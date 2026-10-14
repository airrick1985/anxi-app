// LINE AI 助理：Firestore 共用（集合名稱、時間格式）
const { Firestore, FieldValue, Timestamp } = require('firebase-admin/firestore');

const DB_ID = 'anxi-app';
let db = null;
function getDb() {
  if (!db) db = new Firestore({ databaseId: DB_ID });
  return db;
}

const COL = {
  channels: 'lineAiChannels',
  agents: 'lineAiAgents',
  styles: 'lineAiStyles',
  conversations: 'lineAiConversations',
  messages: 'lineAiMessages', // lineAiConversations/{id}/lineAiMessages
  events: 'lineAiEvents',
  sources: 'lineAiSources',
  usage: 'lineAiUsage',
  dropboxTokens: 'lineAiDropboxTokens',
  oauthStates: 'lineAiOauthStates',
  rateLimits: 'lineAiRateLimits',
  adminLogs: 'lineAiAdminLogs',
};
const SETTINGS_DOC = ['systemSettings', 'lineAi'];

function toMillis(v) {
  if (!v) return null;
  if (typeof v.toMillis === 'function') return v.toMillis();
  if (v instanceof Date) return v.getTime();
  const ms = new Date(v).getTime();
  return Number.isNaN(ms) ? null : ms;
}

function toIso(v) {
  const ms = toMillis(v);
  return ms === null ? null : new Date(ms).toISOString();
}

function todayTaipei() {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Taipei' }).replace(/-/g, '');
}

// 對話記錄用的「10/14 13:05」
function formatTaipei(ms) {
  if (!ms) return '';
  const parts = new Date(ms).toLocaleString('zh-TW', {
    timeZone: 'Asia/Taipei', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false,
  });
  return parts.replace(/\s+/g, ' ');
}

async function adminLog(user, action, detail) {
  try {
    await getDb().collection(COL.adminLogs).add({
      action, detail: detail || null, userKey: user.userKey, userName: user.name, createdAt: FieldValue.serverTimestamp(),
    });
  } catch (e) { /* 稽核失敗不影響操作 */ }
}

module.exports = { getDb, COL, SETTINGS_DOC, FieldValue, Timestamp, toMillis, toIso, todayTaipei, formatTaipei, adminLog };
