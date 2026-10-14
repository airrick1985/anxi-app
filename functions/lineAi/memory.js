// LINE AI 助理：對話記憶（滾動摘要＋重點），原文過期刪除後仍保留
const { COL, FieldValue, Timestamp, toMillis } = require('./db');
const { run, recordUsage } = require('./models');
const { transcript } = require('./assist');

const MAX_BATCH = 200;
const MAX_FACTS = 15;

const SYSTEM = [
  '你是對話紀錄整理助手，負責維護一段 LINE 對話的長期記憶，之後撰寫回覆時會參考。',
  '根據「既有記憶」與「新訊息」，輸出更新後的完整記憶，只輸出 JSON：',
  '{"summary": "對話脈絡摘要，300 字內", "facts": ["重點1", "重點2"]}',
  `facts 最多 ${MAX_FACTS} 條，只留之後回覆需要記得的事：客戶需求、預算、偏好、疑慮、我方承諾、待辦、約定時間、重要日期。過時或已完成的項目要移除或改寫。`,
  '使用繁體中文；不要記錄電話、身分證、地址等個資。',
].join('\n');

function parseMemory(text) {
  const m = String(text || '').match(/\{[\s\S]*\}/);
  if (!m) return null;
  try {
    const obj = JSON.parse(m[0]);
    const summary = String(obj.summary || '').trim().slice(0, 1500);
    const facts = (Array.isArray(obj.facts) ? obj.facts : []).map(f => String(f || '').trim()).filter(Boolean).slice(0, MAX_FACTS).map(f => f.slice(0, 200));
    return summary || facts.length ? { summary, facts } : null;
  } catch {
    return null;
  }
}

/**
 * 依上次整理之後的新訊息更新記憶
 * @returns {boolean} 是否有更新
 */
async function updateMemory(convRef, conv, agent) {
  if (!agent) return false;
  let q = convRef.collection(COL.messages).orderBy('createdAt', 'asc');
  const since = toMillis(conv.summaryUpdatedAt);
  if (since) q = q.where('createdAt', '>', Timestamp.fromMillis(since));
  const snap = await q.limit(MAX_BATCH).get();
  if (snap.empty) {
    if (conv.pendingSummary) await convRef.update({ pendingSummary: 0 });
    return false;
  }
  const messages = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  const prev = [conv.summary ? `摘要：${conv.summary}` : '', conv.facts?.length ? `重點：\n${conv.facts.map(f => `- ${f}`).join('\n')}` : ''].filter(Boolean).join('\n') || '（尚無）';
  const content = `# 對話\n${conv.customerName || conv.name}\n\n# 既有記憶\n${prev}\n\n# 新訊息（由舊到新）\n${transcript(messages, conv, null)}`;
  const res = await run({ ...agent, temperature: 0.2 }, { system: SYSTEM, messages: [{ role: 'user', content }] });
  await recordUsage(agent, res.usage, 'summary');
  const memory = parseMemory(res.text);
  if (!memory) throw new Error('AI 回傳的記憶格式不正確');
  const last = messages[messages.length - 1];
  await convRef.update({
    summary: memory.summary,
    facts: memory.facts,
    summaryUpdatedAt: last.createdAt || FieldValue.serverTimestamp(),
    pendingSummary: snap.size >= MAX_BATCH ? FieldValue.increment(-snap.size) : 0,
  });
  return true;
}

module.exports = { updateMemory, parseMemory };
