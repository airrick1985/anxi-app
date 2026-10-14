// LINE AI 助理：Cloud Functions 匯出
// - lineAiWebhook：所有官方帳號共用的 Webhook（LINE Developers 填這個網址）
// - lineAiProcessEvent：處理 webhook 事件
// - lineAiApi：工作台；lineAiAdmin：超級管理員後台
// - lineAiNotify（每分鐘）：客戶來訊通知；lineAiHourly：整理記憶；lineAiDaily：刪除過期訊息
// - lineAiDropboxCallback：Dropbox 授權回跳

const { onCall, onRequest } = require('firebase-functions/v2/https');
const { onDocumentCreated } = require('firebase-functions/v2/firestore');
const { onSchedule } = require('firebase-functions/v2/scheduler');
const { FieldValue } = require('./db');
const { REGION, SYSTEM_NOTIFY_TOKEN_ENV, getGlobal } = require('./settings');
const { handleWebhook } = require('./webhook');
const { processEvent } = require('./processor');
const { handleApi } = require('./api');
const { handleAdmin } = require('./admin');
const { runNotifications } = require('./notify');
const { runSummaries, runRetention } = require('./maintenance');
const dropbox = require('./sources/dropbox');

const base = { region: REGION, memory: '512MiB' };

const lineAiWebhook = onRequest({ ...base, timeoutSeconds: 30, invoker: 'public', concurrency: 40 }, handleWebhook);

const lineAiProcessEvent = onDocumentCreated({ ...base, document: 'lineAiEvents/{eventId}', database: 'anxi-app', timeoutSeconds: 120 }, async (event) => {
  const snap = event.data;
  const data = snap?.data();
  if (!data) return;
  try {
    await processEvent(data);
    await snap.ref.delete();
  } catch (e) {
    console.error(`[lineAi] 處理事件失敗 ${snap.id}（${data.event?.type}）: ${e.message}`);
    await snap.ref.update({ error: e.message, failedAt: FieldValue.serverTimestamp() }).catch(() => {});
  }
});

const lineAiApi = onCall({ ...base, timeoutSeconds: 120 }, handleApi);
const lineAiAdmin = onCall({ ...base, timeoutSeconds: 120 }, handleAdmin);

const lineAiNotify = onSchedule({ ...base, schedule: 'every 1 minutes', timeZone: 'Asia/Taipei', timeoutSeconds: 120, secrets: [SYSTEM_NOTIFY_TOKEN_ENV] }, runNotifications);
const lineAiHourly = onSchedule({ ...base, schedule: '15 * * * *', timeZone: 'Asia/Taipei', timeoutSeconds: 540 }, runSummaries);
const lineAiDaily = onSchedule({ ...base, schedule: '30 3 * * *', timeZone: 'Asia/Taipei', timeoutSeconds: 540 }, runRetention);

const lineAiDropboxCallback = onRequest({ ...base, timeoutSeconds: 30, invoker: 'public' }, async (req, res) => {
  const { appUrl } = await getGlobal();
  try {
    await dropbox.handleCallback({ code: req.query.code, state: req.query.state });
    res.redirect(302, `${appUrl}/#/line-ai?dropbox=connected`);
  } catch (e) {
    console.warn(`[lineAi] Dropbox 授權失敗: ${e.message}`);
    res.redirect(302, `${appUrl}/#/line-ai?dropbox=error&reason=${encodeURIComponent(e.message)}`);
  }
});

module.exports = { lineAiWebhook, lineAiProcessEvent, lineAiApi, lineAiAdmin, lineAiNotify, lineAiHourly, lineAiDaily, lineAiDropboxCallback };
