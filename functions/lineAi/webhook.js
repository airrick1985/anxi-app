// LINE AI 助理：Webhook 入口（所有官方帳號共用）
// 依 body.destination（bot userId）找官方帳號 → 驗簽 → 事件寫入 lineAiEvents 後立即回 200，由觸發器處理
const { getDb, COL, FieldValue } = require('./db');
const { getChannelByBotUserId } = require('./settings');
const { verifySignature, channelSecret } = require('./line');
const secrets = require('../salesAi/secrets');

async function handleWebhook(req, res) {
  if (req.method !== 'POST') { res.status(200).send('OK'); return; }
  const body = req.body || {};
  const channel = body.destination ? await getChannelByBotUserId(String(body.destination)) : null;
  if (!channel) {
    console.warn(`[lineAiWebhook] 未登記的官方帳號：${body.destination || '(無 destination)'}`);
    res.status(404).send('Unknown channel');
    return;
  }
  const signature = req.get('x-line-signature');
  let valid = verifySignature(req.rawBody, signature, await channelSecret(channel.id));
  if (!valid) {
    // 後台剛更新 Channel Secret 時，本實例的金鑰快取可能還是舊的
    secrets.clearCache();
    valid = verifySignature(req.rawBody, signature, await channelSecret(channel.id));
  }
  if (!valid) {
    console.warn(`[lineAiWebhook] 簽章驗證失敗：${channel.id}`);
    res.status(401).send('Invalid signature');
    return;
  }
  const events = Array.isArray(body.events) ? body.events : [];
  const col = getDb().collection(COL.events);
  await Promise.all(events.map(event => {
    const ref = event.webhookEventId ? col.doc(String(event.webhookEventId)) : col.doc();
    // LINE 重送同一事件時 webhookEventId 相同，create 失敗即略過
    return ref.create({ channelId: channel.id, event, receivedAt: FieldValue.serverTimestamp() }).catch(e => { if (e.code !== 6) throw e; });
  }));
  res.status(200).send('OK');
}

module.exports = { handleWebhook };
