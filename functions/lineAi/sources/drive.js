// LINE AI 助理：Google Drive（使用者把資料夾共用給系統服務帳號）
// 沿用 Google Sheet 同步的服務帳號（GOOGLE_SHEETS_CLIENT_EMAIL／PRIVATE_KEY），沒有時改用執行環境預設帳號。
// 服務帳號看得到所有「共用給它」的檔案，所以每次搜尋／讀取都限定在來源資料夾底下。

const { google } = require('googleapis');
const secrets = require('../../salesAi/secrets');
const { extractText, MAX_FILE_BYTES } = require('./extract');

const SCOPES = ['https://www.googleapis.com/auth/drive.readonly'];
const FOLDER = 'application/vnd.google-apps.folder';
const XLSX_MIME = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
const EXPORTS = {
  'application/vnd.google-apps.document': 'text/plain',
  'application/vnd.google-apps.spreadsheet': XLSX_MIME,
  'application/vnd.google-apps.presentation': 'text/plain',
};
const LIST_OPTS = { supportsAllDrives: true, includeItemsFromAllDrives: true, corpora: 'allDrives' };

let clientPromise = null;

async function createClient() {
  const [email, key] = await Promise.all([secrets.getSecret('GOOGLE_SHEETS_CLIENT_EMAIL'), secrets.getSecret('GOOGLE_SHEETS_PRIVATE_KEY')]);
  if (email && key) {
    const auth = new google.auth.JWT({ email, key: key.replace(/\\n/g, '\n'), scopes: SCOPES });
    return { drive: google.drive({ version: 'v3', auth }), email };
  }
  const auth = new google.auth.GoogleAuth({ scopes: SCOPES });
  const creds = await auth.getCredentials();
  return { drive: google.drive({ version: 'v3', auth }), email: creds.client_email || '' };
}

function client() {
  if (!clientPromise) {
    clientPromise = createClient();
    clientPromise.catch(() => { clientPromise = null; });
  }
  return clientPromise;
}

async function serviceAccountEmail() {
  try { return (await client()).email; } catch (e) { return ''; }
}

/** 資料夾／檔案連結 → id */
function parseDriveId(input) {
  const s = String(input || '').trim();
  const m = s.match(/\/folders\/([A-Za-z0-9_-]{10,})/) || s.match(/\/d\/([A-Za-z0-9_-]{10,})/) || s.match(/[?&]id=([A-Za-z0-9_-]{10,})/);
  if (m) return m[1];
  return /^[A-Za-z0-9_-]{10,}$/.test(s) ? s : null;
}

function driveError(e) {
  const status = e?.code || e?.response?.status;
  if (status === 404) return new Error('找不到檔案，或尚未共用給系統');
  if (status === 403) return new Error('沒有權限讀取，請確認已共用給系統');
  return new Error(e?.errors?.[0]?.message || e.message || 'Google Drive 讀取失敗');
}

async function inspect(id) {
  const { drive } = await client();
  try {
    const r = await drive.files.get({ fileId: id, fields: 'id,name,mimeType,trashed', supportsAllDrives: true });
    if (r.data.trashed) throw new Error('這個項目已在垃圾桶');
    return { id: r.data.id, name: r.data.name, isFolder: r.data.mimeType === FOLDER };
  } catch (e) {
    throw e.message === '這個項目已在垃圾桶' ? e : driveError(e);
  }
}

const esc = s => String(s).replace(/\\/g, '\\\\').replace(/'/g, "\\'");

/** 來源底下所有資料夾（廣度優先，最多 max 個） */
async function collectFolders(rootIds, max = 80) {
  const { drive } = await client();
  const out = [...rootIds];
  const queue = [...rootIds];
  while (queue.length && out.length < max) {
    const batch = queue.splice(0, 10);
    const q = `(${batch.map(id => `'${esc(id)}' in parents`).join(' or ')}) and mimeType = '${FOLDER}' and trashed = false`;
    const r = await drive.files.list({ q, fields: 'files(id)', pageSize: 100, ...LIST_OPTS });
    for (const f of r.data.files || []) {
      if (out.length >= max) break;
      if (!out.includes(f.id)) { out.push(f.id); queue.push(f.id); }
    }
  }
  return out;
}

async function search(roots, query, limit = 8) {
  const { drive } = await client();
  const fileRoots = roots.filter(r => !r.isFolder);
  const folderIds = await collectFolders(roots.filter(r => r.isFolder).map(r => r.id));
  const files = [];
  const term = String(query || '').trim();
  for (let i = 0; i < folderIds.length && files.length < limit; i += 15) {
    const parents = folderIds.slice(i, i + 15).map(id => `'${esc(id)}' in parents`).join(' or ');
    let q = `(${parents}) and mimeType != '${FOLDER}' and trashed = false`;
    if (term) q += ` and (name contains '${esc(term)}' or fullText contains '${esc(term)}')`;
    const r = await drive.files.list({
      q, pageSize: limit, fields: 'files(id,name,mimeType,modifiedTime)', ...LIST_OPTS,
      ...(term ? {} : { orderBy: 'modifiedTime desc' }),
    });
    files.push(...(r.data.files || []));
  }
  for (const f of fileRoots) {
    if (!term || String(f.name || '').includes(term)) files.push({ id: f.id, name: f.name, mimeType: null, modifiedTime: null });
  }
  return files.slice(0, limit).map(f => ({ id: f.id, name: f.name, mimeType: f.mimeType, modifiedTime: f.modifiedTime || null }));
}

/** 檔案是否在來源（資料夾或單一檔案）底下：往上找父資料夾，最多 12 層 */
async function isWithin(roots, fileId) {
  const rootIds = new Set(roots.map(r => r.id));
  if (rootIds.has(fileId)) return true;
  const { drive } = await client();
  let frontier = [fileId];
  const seen = new Set(frontier);
  for (let depth = 0; depth < 12 && frontier.length; depth++) {
    const next = [];
    for (const id of frontier) {
      const r = await drive.files.get({ fileId: id, fields: 'parents', supportsAllDrives: true });
      for (const p of r.data.parents || []) {
        if (rootIds.has(p)) return true;
        if (!seen.has(p)) { seen.add(p); next.push(p); }
      }
    }
    frontier = next;
  }
  return false;
}

async function read(roots, fileId) {
  const { drive } = await client();
  let meta;
  try {
    meta = (await drive.files.get({ fileId, fields: 'id,name,mimeType,size,modifiedTime', supportsAllDrives: true })).data;
  } catch (e) { throw driveError(e); }
  if (!(await isWithin(roots, fileId))) throw new Error('這個檔案不在開放的資料夾內');
  if (meta.mimeType === FOLDER) {
    const r = await drive.files.list({ q: `'${esc(fileId)}' in parents and trashed = false`, pageSize: 50, fields: 'files(id,name,mimeType)', ...LIST_OPTS });
    return { name: meta.name, text: (r.data.files || []).map(f => `${f.mimeType === FOLDER ? '[資料夾]' : '-'} ${f.name}（fileId: ${f.id}）`).join('\n'), isFolder: true };
  }
  let buf;
  let mimeType = meta.mimeType;
  try {
    if (EXPORTS[meta.mimeType]) {
      mimeType = EXPORTS[meta.mimeType];
      const r = await drive.files.export({ fileId, mimeType }, { responseType: 'arraybuffer' });
      buf = Buffer.from(r.data);
    } else {
      if (Number(meta.size) > MAX_FILE_BYTES) throw new Error('檔案太大（超過 15MB）');
      const r = await drive.files.get({ fileId, alt: 'media', supportsAllDrives: true }, { responseType: 'arraybuffer' });
      buf = Buffer.from(r.data);
    }
  } catch (e) {
    throw e.message?.startsWith('檔案太大') ? e : driveError(e);
  }
  const name = mimeType === XLSX_MIME && !/\.xlsx$/i.test(meta.name) ? `${meta.name}.xlsx` : meta.name;
  const { text, truncated } = await extractText(buf, mimeType, name);
  return { name: meta.name, modifiedTime: meta.modifiedTime || null, text, truncated };
}

module.exports = { serviceAccountEmail, parseDriveId, inspect, search, read };
