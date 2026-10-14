// LINE AI 助理：Dropbox（App folder 權限：系統只看得到「應用程式／{App 名稱}」資料夾）
// 使用者授權一次 → refresh token 加密存 lineAiDropboxTokens/{userKey}；access token 快取到過期前。

const axios = require('axios');
const crypto = require('crypto');
const secrets = require('../../salesAi/secrets');
const { getDb, COL, FieldValue, toMillis } = require('../db');
const { encrypt, decrypt } = require('../crypto');
const { DROPBOX_REDIRECT_URI } = require('../settings');
const { extractText, MAX_FILE_BYTES } = require('./extract');

const APP_KEY = 'LINEAI_DROPBOX_APP_KEY';
const APP_SECRET = 'LINEAI_DROPBOX_APP_SECRET';
const API = 'https://api.dropboxapi.com/2';
const CONTENT = 'https://content.dropboxapi.com/2';
const STATE_TTL_MS = 10 * 60 * 1000;
const tokenCache = new Map(); // userKey -> { token, exp }

async function appCredentials() {
  const [key, secret] = await Promise.all([secrets.getSecret(APP_KEY), secrets.getSecret(APP_SECRET)]);
  return { key, secret, ready: !!(key && secret) };
}

async function authUrl(userKey) {
  const { key, ready } = await appCredentials();
  if (!ready) throw new Error('超級管理員尚未設定 Dropbox 應用程式');
  const state = crypto.randomBytes(24).toString('hex');
  await getDb().collection(COL.oauthStates).doc(state).set({ userKey, provider: 'dropbox', createdAt: FieldValue.serverTimestamp() });
  const params = new URLSearchParams({
    client_id: key, response_type: 'code', token_access_type: 'offline', redirect_uri: DROPBOX_REDIRECT_URI, state,
  });
  return `https://www.dropbox.com/oauth2/authorize?${params}`;
}

/** OAuth 回跳：換 refresh token、建立使用者的 Dropbox 來源 */
async function handleCallback({ code, state }) {
  if (!code || !/^[a-f0-9]{48}$/.test(String(state || ''))) throw new Error('授權資料不完整');
  const db = getDb();
  const ref = db.collection(COL.oauthStates).doc(String(state));
  const snap = await ref.get();
  await ref.delete().catch(() => {});
  if (!snap.exists || Date.now() - (toMillis(snap.data().createdAt) || 0) > STATE_TTL_MS) throw new Error('授權已逾時，請重新連結');
  const { userKey } = snap.data();
  const { key, secret } = await appCredentials();
  let data;
  try {
    const r = await axios.post('https://api.dropboxapi.com/oauth2/token', new URLSearchParams({
      code: String(code), grant_type: 'authorization_code', redirect_uri: DROPBOX_REDIRECT_URI, client_id: key, client_secret: secret,
    }).toString(), { headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, timeout: 15000 });
    data = r.data;
  } catch (e) {
    throw new Error(`Dropbox 授權失敗：${e?.response?.data?.error_description || e.message}`);
  }
  if (!data.refresh_token) throw new Error('Dropbox 沒有回傳長期授權');
  await db.collection(COL.dropboxTokens).doc(userKey).set({
    refreshToken: await encrypt(data.refresh_token), accountId: data.account_id || null, connectedAt: FieldValue.serverTimestamp(),
  });
  tokenCache.delete(userKey);
  const existing = await db.collection(COL.sources).where('ownerKey', '==', userKey).where('type', '==', 'dropbox').limit(1).get();
  if (existing.empty) {
    await db.collection(COL.sources).add({ type: 'dropbox', name: 'Dropbox', path: '', ownerKey: userKey, shared: false, createdAt: FieldValue.serverTimestamp() });
  }
  return { userKey };
}

async function accessToken(userKey) {
  const hit = tokenCache.get(userKey);
  if (hit && hit.exp > Date.now() + 60000) return hit.token;
  const snap = await getDb().collection(COL.dropboxTokens).doc(userKey).get();
  if (!snap.exists) throw new Error('Dropbox 尚未連結或已中斷，請重新連結');
  const { key, secret } = await appCredentials();
  try {
    const r = await axios.post('https://api.dropboxapi.com/oauth2/token', new URLSearchParams({
      grant_type: 'refresh_token', refresh_token: await decrypt(snap.data().refreshToken), client_id: key, client_secret: secret,
    }).toString(), { headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, timeout: 15000 });
    tokenCache.set(userKey, { token: r.data.access_token, exp: Date.now() + (Number(r.data.expires_in) || 3600) * 1000 });
    return r.data.access_token;
  } catch (e) {
    if (e?.response?.status === 400) throw new Error('Dropbox 授權已失效，請重新連結');
    throw new Error(`Dropbox 連線失敗：${e.message}`);
  }
}

async function api(userKey, path, body) {
  const token = await accessToken(userKey);
  try {
    const r = await axios.post(`${API}${path}`, body, { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, timeout: 20000 });
    return r.data;
  } catch (e) {
    const summary = e?.response?.data?.error_summary || e.message;
    if (/not_found/.test(summary)) throw new Error('找不到檔案');
    throw new Error(`Dropbox 錯誤：${summary}`);
  }
}

const inPath = (source, pathLower) => !source.path || String(pathLower || '').startsWith(String(source.path).toLowerCase());

async function search(source, query, limit = 8) {
  const term = String(query || '').trim();
  let entries;
  if (term) {
    const r = await api(source.ownerKey, '/files/search_v2', {
      query: term, options: { ...(source.path ? { path: source.path } : {}), max_results: limit, file_status: 'active' },
    });
    entries = (r.matches || []).map(m => m.metadata?.metadata).filter(Boolean);
  } else {
    const r = await api(source.ownerKey, '/files/list_folder', { path: source.path || '', recursive: true, limit: 100 });
    entries = (r.entries || []).sort((a, b) => String(b.server_modified || '').localeCompare(String(a.server_modified || '')));
  }
  return entries
    .filter(e => e['.tag'] === 'file' && inPath(source, e.path_lower))
    .slice(0, limit)
    .map(e => ({ id: e.id, name: e.name, path: e.path_display, modifiedTime: e.server_modified || null }));
}

async function read(source, fileId) {
  const meta = await api(source.ownerKey, '/files/get_metadata', { path: fileId });
  if (!inPath(source, meta.path_lower)) throw new Error('這個檔案不在開放的資料夾內');
  if (meta['.tag'] === 'folder') {
    const r = await api(source.ownerKey, '/files/list_folder', { path: meta.id, limit: 100 });
    return { name: meta.name, text: (r.entries || []).map(e => `${e['.tag'] === 'folder' ? '[資料夾]' : '-'} ${e.name}（fileId: ${e.id}）`).join('\n'), isFolder: true };
  }
  if (Number(meta.size) > MAX_FILE_BYTES) throw new Error('檔案太大（超過 15MB）');
  const token = await accessToken(source.ownerKey);
  let r;
  try {
    r = await axios.post(`${CONTENT}/files/download`, null, {
      headers: { Authorization: `Bearer ${token}`, 'Dropbox-API-Arg': JSON.stringify({ path: meta.id }) },
      responseType: 'arraybuffer', timeout: 60000, maxContentLength: MAX_FILE_BYTES,
    });
  } catch (e) {
    throw new Error(`Dropbox 下載失敗：${e.message}`);
  }
  const { text, truncated } = await extractText(Buffer.from(r.data), r.headers['content-type'], meta.name);
  return { name: meta.name, modifiedTime: meta.server_modified || null, text, truncated };
}

async function status(userKey) {
  const [creds, snap] = await Promise.all([appCredentials(), getDb().collection(COL.dropboxTokens).doc(userKey).get()]);
  return { available: creds.ready, connected: snap.exists };
}

async function disconnect(userKey) {
  const db = getDb();
  try {
    const token = await accessToken(userKey);
    await axios.post(`${API}/auth/token/revoke`, null, { headers: { Authorization: `Bearer ${token}` }, timeout: 10000 });
  } catch (e) { /* 已失效也照樣移除 */ }
  tokenCache.delete(userKey);
  await db.collection(COL.dropboxTokens).doc(userKey).delete();
  const own = await db.collection(COL.sources).where('ownerKey', '==', userKey).where('type', '==', 'dropbox').get();
  const batch = db.batch();
  own.forEach(d => batch.delete(d.ref));
  if (!own.empty) await batch.commit();
}

module.exports = { APP_KEY, APP_SECRET, appCredentials, authUrl, handleCallback, search, read, status, disconnect };
