// LINE AI 助理：Messaging API（axios 直呼）＋ Webhook 簽章驗證＋官方帳號金鑰
const axios = require('axios');
const crypto = require('crypto');
const secrets = require('../salesAi/secrets');
const { channelSecretNames, getGlobal, getChannel, SYSTEM_NOTIFY_TOKEN_ENV } = require('./settings');

const API = 'https://api.line.me/v2/bot';
const DATA_API = 'https://api-data.line.me/v2/bot';
const MAX_CONTENT_BYTES = 25 * 1024 * 1024;

class LineApiError extends Error {
  constructor(message, status) {
    super(message);
    this.name = 'LineApiError';
    this.status = status || null;
  }
}

function wrap(e, label) {
  const status = e?.response?.status || null;
  const data = e?.response?.data;
  let detail = data?.message || e.message;
  if (Buffer.isBuffer(data)) {
    try { detail = JSON.parse(data.toString('utf8')).message || detail; } catch { /* ignore */ }
  }
  // 不記錄 axios error 本身：config 內含 channel access token
  return new LineApiError(`${label}（${status || e.code || '?'}）：${detail}`, status);
}

function verifySignature(rawBody, signature, channelSecret) {
  if (!rawBody || !signature || !channelSecret) return false;
  const expected = Buffer.from(crypto.createHmac('sha256', channelSecret).update(rawBody).digest('base64'));
  const actual = Buffer.from(String(signature));
  return expected.length === actual.length && crypto.timingSafeEqual(expected, actual);
}

class LineClient {
  constructor(token) {
    if (!token) throw new LineApiError('官方帳號尚未設定 Channel Access Token');
    this.headers = { Authorization: `Bearer ${token}` };
  }

  async get(path, label, opts = {}) {
    try {
      const r = await axios.get(`${opts.data ? DATA_API : API}${path}`, { headers: this.headers, timeout: 15000, ...opts.axios });
      return r;
    } catch (e) { throw wrap(e, label); }
  }

  async send(method, path, body, label, extraHeaders = {}) {
    try {
      const r = await axios({ method, url: `${API}${path}`, data: body, headers: { ...this.headers, 'Content-Type': 'application/json', ...extraHeaders }, timeout: 15000 });
      return r.data;
    } catch (e) { throw wrap(e, label); }
  }

  async botInfo() { return (await this.get('/info', '讀取官方帳號資訊失敗')).data; }
  async userProfile(userId) { return (await this.get(`/profile/${encodeURIComponent(userId)}`, '讀取使用者資料失敗')).data; }
  async groupSummary(groupId) { return (await this.get(`/group/${encodeURIComponent(groupId)}/summary`, '讀取群組資料失敗')).data; }
  async memberProfile(type, sourceId, userId) {
    const kind = type === 'room' ? 'room' : 'group';
    return (await this.get(`/${kind}/${encodeURIComponent(sourceId)}/member/${encodeURIComponent(userId)}`, '讀取群組成員失敗')).data;
  }

  /** 群組成員 ID 清單：只有認證／Premium 官方帳號可用，其他回 403 */
  async memberIds(type, sourceId, max = 500) {
    const kind = type === 'room' ? 'room' : 'group';
    const ids = [];
    let start = null;
    do {
      const r = await this.get(`/${kind}/${encodeURIComponent(sourceId)}/members/ids${start ? `?start=${encodeURIComponent(start)}` : ''}`, '讀取群組成員清單失敗');
      ids.push(...(r.data?.memberIds || []));
      start = r.data?.next || null;
    } while (start && ids.length < max);
    return ids;
  }

  async content(messageId) {
    const r = await this.get(`/message/${encodeURIComponent(messageId)}/content`, '下載訊息內容失敗', {
      data: true,
      axios: { responseType: 'arraybuffer', maxContentLength: MAX_CONTENT_BYTES, maxBodyLength: MAX_CONTENT_BYTES, timeout: 60000 },
    });
    return { buffer: Buffer.from(r.data), contentType: r.headers['content-type'] || 'application/octet-stream' };
  }

  async push(to, messages) {
    // X-Line-Retry-Key：網路重試時不會重複送出
    return this.send('post', '/message/push', { to, messages }, '官方帳號發送失敗', { 'X-Line-Retry-Key': crypto.randomUUID() });
  }

  async reply(replyToken, messages) { return this.send('post', '/message/reply', { replyToken, messages }, '官方帳號回覆失敗'); }
  async getWebhook() { return (await this.get('/channel/webhook/endpoint', '讀取 Webhook 設定失敗')).data; }
  async setWebhook(endpoint) { return this.send('put', '/channel/webhook/endpoint', { endpoint }, '設定 Webhook 失敗'); }
  async testWebhook(endpoint) { return this.send('post', '/channel/webhook/test', endpoint ? { endpoint } : {}, '測試 Webhook 失敗'); }
  async quota() {
    const [q, c] = await Promise.all([
      this.get('/message/quota', '讀取訊息額度失敗'),
      this.get('/message/quota/consumption', '讀取訊息用量失敗'),
    ]);
    return { type: q.data?.type || null, limit: q.data?.value ?? null, used: c.data?.totalUsage ?? null };
  }
}

async function channelToken(channelId) {
  return secrets.getSecret(channelSecretNames(channelId).token);
}

async function channelSecret(channelId) {
  return secrets.getSecret(channelSecretNames(channelId).secret);
}

async function clientForChannel(channelId) {
  return new LineClient(await channelToken(channelId));
}

/** 通知員工用的官方帳號：全域設定指定的帳號，否則用系統預設官方帳號 */
async function notifyClient() {
  const g = await getGlobal();
  if (g.notifyChannelId) {
    const ch = await getChannel(g.notifyChannelId);
    if (ch) return clientForChannel(ch.id);
  }
  return new LineClient((process.env[SYSTEM_NOTIFY_TOKEN_ENV] || '').trim());
}

/** 錯誤訊息轉成給使用者看的短句 */
function friendlySendError(e) {
  const msg = String(e?.message || '');
  if (e?.status === 429 && /monthly limit/i.test(msg)) return '官方帳號本月訊息額度已用完';
  if (e?.status === 429) return '發送太頻繁，請稍後再試';
  if (e?.status === 400 && /not found|invalid.*to/i.test(msg)) return '對方已封鎖或已不在這個聊天室';
  if (e?.status === 401) return '官方帳號金鑰無效';
  return msg || '發送失敗';
}

module.exports = { LineClient, LineApiError, verifySignature, channelToken, channelSecret, clientForChannel, notifyClient, friendlySendError, MAX_CONTENT_BYTES };
