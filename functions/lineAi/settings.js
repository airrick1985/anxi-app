// LINE AI 助理：設定（全域 systemSettings/lineAi、官方帳號、Agent、風格）
// 各實例快取 30 秒；後台寫入時清除本實例快取，其他實例最遲 30 秒後更新。

const { getDb, COL, SETTINGS_DOC } = require('./db');

const CACHE_TTL_MS = 30 * 1000;
const cache = new Map(); // key -> { at, value }

const PROJECT_ID = process.env.GCLOUD_PROJECT || process.env.GCP_PROJECT || 'apps-script-api-443402';
const REGION = 'asia-east1';
const FUNCTIONS_BASE = `https://${REGION}-${PROJECT_ID}.cloudfunctions.net`;
const WEBHOOK_URL = `${FUNCTIONS_BASE}/lineAiWebhook`;
const DROPBOX_REDIRECT_URI = `${FUNCTIONS_BASE}/lineAiDropboxCallback`;

// 系統通知用的既有官方帳號（員工都已加好友、已綁定 lineId）
const SYSTEM_NOTIFY_TOKEN_ENV = 'ANXISMART_LINE_CRM_TOKEN';

const DEFAULT_GLOBAL = {
  appUrl: 'https://anxismart.com',
  liffId: '',
  liffChannelId: '2008257338',
  notifyChannelId: null, // null：系統預設官方帳號
  notifyDelayMinutes: 2,
  claimerKeys: [],
  retentionMonths: 12,
  summaryEvery: 20,
  historyMessages: 30,
  perUserPerMinute: 20,
  keys: [], // [{ name, provider, label }] 本功能專用的 API Key 清單（Secret Manager 名稱）
};

const DEFAULT_AGENT = {
  name: '',
  enabled: true,
  provider: 'gemini',
  model: 'gemini-2.5-flash',
  secretName: '',
  baseUrl: null,
  temperature: 0.6,
  maxOutputTokens: 2048,
  thinking: 'off',
  instructions: '',
  styleIds: [],
  defaultStyleId: null,
  sendMode: 'manual', // manual：使用者自己送；bot：官方帳號代發；both：兩者皆可
  notifyEnabled: true,
  useCustomerData: true,
  sharedSourceIds: [],
  allowUserSources: true,
  pricePer1MInput: 0,
  pricePer1MOutput: 0,
};

const DEFAULT_CHANNEL = {
  name: '',
  enabled: true,
  botUserId: null,
  basicId: null,
  displayName: null,
  pictureUrl: null,
  defaultAgentId: null,
  joinMessage: '',
};

const DEFAULT_STYLE = { name: '', instruction: '', example: '', order: 0, enabled: true };

function cached(key, loader) {
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < CACHE_TTL_MS) return hit.value;
  const value = loader();
  cache.set(key, { at: Date.now(), value });
  value.catch(() => cache.delete(key));
  return value;
}

function invalidate() { cache.clear(); }

function mergeGlobal(raw) {
  const g = raw && typeof raw === 'object' ? raw : {};
  return {
    ...DEFAULT_GLOBAL,
    ...g,
    claimerKeys: Array.isArray(g.claimerKeys) ? g.claimerKeys.map(String) : [],
    keys: Array.isArray(g.keys) ? g.keys.filter(k => k && k.name) : [],
  };
}

function getGlobal({ fresh = false } = {}) {
  const load = async () => {
    const snap = await getDb().collection(SETTINGS_DOC[0]).doc(SETTINGS_DOC[1]).get();
    return mergeGlobal(snap.exists ? snap.data() : null);
  };
  if (fresh) { cache.delete('global'); }
  return cached('global', load);
}

function globalRef() { return getDb().collection(SETTINGS_DOC[0]).doc(SETTINGS_DOC[1]); }

function listOf(col, defaults, { fresh = false } = {}) {
  if (fresh) cache.delete(col);
  return cached(col, async () => {
    const snap = await getDb().collection(col).get();
    return snap.docs.map(d => ({ ...defaults, ...d.data(), id: d.id }));
  });
}

const listChannels = (opts) => listOf(COL.channels, DEFAULT_CHANNEL, opts);
const listAgents = () => listOf(COL.agents, DEFAULT_AGENT);
async function listStyles() {
  const styles = await listOf(COL.styles, DEFAULT_STYLE);
  return [...styles].sort((a, b) => (a.order || 0) - (b.order || 0) || String(a.name).localeCompare(String(b.name), 'zh-Hant'));
}

async function getChannel(id) { return (await listChannels()).find(c => c.id === id) || null; }
async function getChannelByBotUserId(botUserId) {
  const find = list => list.find(c => c.botUserId === botUserId) || null;
  // 剛在後台新增的官方帳號：快取裡找不到時重讀一次
  return find(await listChannels()) || find(await listChannels({ fresh: true }));
}
async function getAgent(id) { return id ? (await listAgents()).find(a => a.id === id) || null : null; }

/** 對話實際使用的 Agent：對話指定 → 官方帳號預設；停用的 Agent 視為無 */
async function resolveAgent(conv, channel) {
  const agent = (await getAgent(conv?.agentId)) || (await getAgent(channel?.defaultAgentId));
  return agent && agent.enabled !== false ? agent : null;
}

function channelSecretNames(channelId) {
  return { token: `LINEAI_${channelId}_TOKEN`, secret: `LINEAI_${channelId}_SECRET` };
}

module.exports = {
  DEFAULT_GLOBAL, DEFAULT_AGENT, DEFAULT_CHANNEL, DEFAULT_STYLE,
  WEBHOOK_URL, DROPBOX_REDIRECT_URI, SYSTEM_NOTIFY_TOKEN_ENV, REGION,
  getGlobal, globalRef, listChannels, listAgents, listStyles, getChannel, getChannelByBotUserId, getAgent, resolveAgent,
  channelSecretNames, invalidate,
};
