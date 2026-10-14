// LINE AI 助理：排程維護
// - 每小時：整理有新訊息、且已安靜一小時的對話記憶（未滿 summaryEvery 則的部分）
// - 每天：刪除超過保存期限的訊息原文與檔案（摘要與重點保留）

const { getDb, COL, Timestamp, toMillis } = require('./db');
const { getGlobal, getChannel, resolveAgent } = require('./settings');
const { updateMemory } = require('./memory');
const { deleteMedia } = require('./processor');

const QUIET_MS = 60 * 60 * 1000;
const TIME_BUDGET_MS = 8 * 60 * 1000;

async function runSummaries() {
  const started = Date.now();
  const snap = await getDb().collection(COL.conversations).where('pendingSummary', '>', 0).limit(200).get();
  for (const d of snap.docs) {
    if (Date.now() - started > TIME_BUDGET_MS) break;
    const conv = { id: d.id, ...d.data() };
    if (Date.now() - (toMillis(conv.lastMessageAt) || 0) < QUIET_MS) continue;
    try {
      const agent = await resolveAgent(conv, await getChannel(conv.channelId));
      if (agent) await updateMemory(d.ref, conv, agent);
    } catch (e) {
      console.warn(`[lineAi] 排程整理記憶失敗 ${d.id}: ${e.message}`);
    }
  }
}

async function runRetention() {
  const started = Date.now();
  const global = await getGlobal({ fresh: true });
  const months = Math.max(1, Number(global.retentionMonths) || 12);
  const cutoff = new Date();
  cutoff.setMonth(cutoff.getMonth() - months);
  const db = getDb();
  const convs = await db.collection(COL.conversations).select('lastMessageAt').get();
  let removed = 0;
  for (const c of convs.docs) {
    if (Date.now() - started > TIME_BUDGET_MS) break;
    for (;;) {
      const old = await c.ref.collection(COL.messages).where('createdAt', '<', Timestamp.fromDate(cutoff)).limit(300).get();
      if (old.empty) break;
      await Promise.all(old.docs.map(m => deleteMedia(m.data().media?.path)));
      const batch = db.batch();
      old.docs.forEach(m => batch.delete(m.ref));
      await batch.commit();
      removed += old.size;
      if (old.size < 300 || Date.now() - started > TIME_BUDGET_MS) break;
    }
  }
  if (removed) console.log(`[lineAi] 已刪除 ${removed} 則超過 ${months} 個月的訊息`);
}

module.exports = { runSummaries, runRetention };
