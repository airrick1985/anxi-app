// LINE AI 助理：客戶私訊官方帳號 → LINE 通知負責業務，附 AI 建議回覆
// processor 收到客戶訊息時設 notifyDueAt（延遲數分鐘，期間多則訊息合併），每分鐘排程發送到期的通知。

const { getDb, COL, Timestamp, toMillis } = require('./db');
const { getGlobal, getChannel, resolveAgent } = require('./settings');
const { notifyClient } = require('./line');
const { generate, recentMessages, messageText } = require('./assist');
const { shouldBlockOutbound } = require('../utils/trialGuard');

const MAX_PREVIEW = 3;

function openUrl(global, convId) {
  const c = encodeURIComponent(convId);
  return global.liffId ? `https://liff.line.me/${global.liffId}?c=${c}` : `${global.appUrl}/#/line-ai?c=${c}`;
}

function buildMessage({ title, subtitle, lines, draft, url }) {
  const body = [
    { type: 'text', text: title, weight: 'bold', size: 'lg', color: '#0071E3', wrap: true },
    subtitle && { type: 'text', text: subtitle, size: 'xs', color: '#8E8E93', wrap: true },
    { type: 'separator', margin: 'md' },
    { type: 'box', layout: 'vertical', spacing: 'sm', margin: 'md', contents: lines.map(t => ({ type: 'text', text: t, size: 'sm', color: '#1D1D1F', wrap: true })) },
  ];
  if (draft) {
    body.push(
      { type: 'separator', margin: 'md' },
      { type: 'text', text: 'AI 建議回覆', size: 'xs', color: '#8E8E93', weight: 'bold', margin: 'md' },
      { type: 'text', text: draft.slice(0, 900), size: 'sm', color: '#3A3A3C', wrap: true },
    );
  }
  const footer = [
    draft && { type: 'button', style: 'secondary', height: 'sm', action: { type: 'clipboard', label: '複製草稿', clipboardText: draft.slice(0, 1000) } },
    { type: 'button', style: 'primary', height: 'sm', color: '#0071E3', action: { type: 'uri', label: '開啟對話', uri: url } },
  ].filter(Boolean);
  return {
    type: 'flex',
    altText: `${title}：${lines[lines.length - 1] || ''}`.slice(0, 400),
    contents: {
      type: 'bubble',
      size: 'mega',
      body: { type: 'box', layout: 'vertical', contents: body.filter(Boolean) },
      footer: { type: 'box', layout: 'horizontal', spacing: 'sm', contents: footer },
    },
  };
}

async function recipients(conv, global) {
  const keys = conv.assignState === 'assigned' ? (conv.viewerKeys || []) : (global.claimerKeys || []);
  const unique = [...new Set(keys.filter(Boolean))].slice(0, 10);
  const snaps = await Promise.all(unique.map(k => getDb().collection('users').doc(k).get()));
  return snaps
    .filter(s => s.exists && String(s.data().lineId || '').startsWith('U') && s.data().disabled !== true)
    .map(s => ({ userKey: s.id, name: s.data().name || s.id, lineId: s.data().lineId }));
}

async function notifyOne(ref) {
  const db = getDb();
  // 先在交易內清掉 notifyDueAt 再發送，避免兩個排程重複通知
  const conv = await db.runTransaction(async tx => {
    const snap = await tx.get(ref);
    const c = snap.data();
    if (!c?.notifyDueAt || toMillis(c.notifyDueAt) > Date.now()) return null;
    tx.update(ref, { notifyDueAt: null });
    return { id: snap.id, ...c };
  });
  if (!conv || conv.lastSenderRole !== 'customer' || conv.active === false) return;
  if (conv.projectId && await shouldBlockOutbound(conv.projectId, 'line')) return; // [TrialGuard]

  const [global, channel] = await Promise.all([getGlobal(), getChannel(conv.channelId)]);
  const agent = await resolveAgent(conv, channel);
  if (!agent || agent.notifyEnabled === false) return;
  const to = await recipients(conv, global);
  if (!to.length) return;

  // 最後一段客戶連續訊息
  const recent = await recentMessages(conv.id, 12);
  const tail = [];
  for (let i = recent.length - 1; i >= 0 && recent[i].senderRole === 'customer'; i--) tail.unshift(recent[i]);
  const lines = tail.slice(-MAX_PREVIEW).map(m => messageText(m).slice(0, 200));
  if (!lines.length) return;

  let draft = '';
  try {
    const me = conv.assignState === 'assigned' ? to[0] : null;
    draft = (await generate({ me, conv, agent, mode: 'suggest', styleId: agent.defaultStyleId, global, kind: 'notify' })).text;
  } catch (e) {
    console.warn(`[lineAi] 通知草稿產生失敗 ${conv.id}: ${e.message}`);
  }

  const title = `💬 ${conv.type === 'user' ? (conv.customerName || conv.name) : conv.name}`;
  const subtitle = [channel?.displayName || channel?.name, conv.assignState === 'assigned' ? '' : '待認領'].filter(Boolean).join('・');
  const message = buildMessage({ title, subtitle, lines, draft, url: openUrl(global, conv.id) });
  const client = await notifyClient();
  for (const r of to) {
    try { await client.push(r.lineId, [message]); } catch (e) { console.warn(`[lineAi] 通知 ${r.userKey} 失敗: ${e.message}`); }
  }
}

async function runNotifications() {
  const snap = await getDb().collection(COL.conversations).where('notifyDueAt', '<=', Timestamp.now()).limit(30).get();
  for (const d of snap.docs) {
    try { await notifyOne(d.ref); } catch (e) { console.error(`[lineAi] 通知失敗 ${d.id}: ${e.message}`); }
  }
}

module.exports = { runNotifications, buildMessage, openUrl };
