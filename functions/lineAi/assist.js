// LINE AI 助理：撰稿（建議回覆／潤稿）
// AI 參考：Agent 指令 → 風格 → 對話記憶（摘要、重點）→ 最近訊息 → 客資與建案 → 雲端資料（工具）

const { HttpsError } = require('firebase-functions/v2/https');
const { getDb, COL, toMillis, formatTaipei } = require('./db');
const { listStyles } = require('./settings');
const { run, recordUsage, friendlyModelError } = require('./models');
const { getCustomer, customerContext } = require('./customers');
const sources = require('./sources');

const TYPE_LABEL = { group: 'LINE 群組', room: 'LINE 多人聊天', user: '官方帳號一對一' };

async function recentMessages(convId, limit) {
  const snap = await getDb().collection(COL.conversations).doc(convId).collection(COL.messages)
    .orderBy('createdAt', 'desc').limit(limit).get();
  return snap.docs.map(d => ({ id: d.id, ...d.data() })).reverse();
}

function messageText(m) {
  switch (m.type) {
    case 'text': return m.text || '';
    case 'image': return '[傳了一張圖片]';
    case 'video': return '[傳了一段影片]';
    case 'audio': return '[傳了一段語音]';
    case 'file': return `[傳了檔案：${m.media?.fileName || ''}]`;
    case 'sticker': return '[貼圖]';
    case 'location': return `[分享位置：${m.location?.title || ''} ${m.location?.address || ''}]`;
    default: return '[訊息]';
  }
}

function speaker(m, conv, me) {
  if (m.senderRole === 'bot') return `官方帳號${m.sentByName ? `（${m.sentByName} 代發）` : ''}`;
  const member = conv.members?.[m.senderLineId];
  const name = m.senderName || member?.name || '成員';
  if (me && ((m.sentByUserKey && m.sentByUserKey === me.userKey) || (me.lineId && m.senderLineId === me.lineId))) return `我（${name}）`;
  return m.senderRole === 'staff' ? `${name}（同仁）` : `${name}（客戶）`;
}

function transcript(messages, conv, me) {
  return messages.map(m => `[${formatTaipei(toMillis(m.createdAt))}] ${speaker(m, conv, me)}：${messageText(m)}`).join('\n');
}

/** 可用風格：Agent 未勾選代表全部 */
async function stylesFor(agent) {
  const all = (await listStyles()).filter(s => s.enabled !== false);
  const ids = agent?.styleIds || [];
  return ids.length ? all.filter(s => ids.includes(s.id)) : all;
}

function cleanDraft(text) {
  let t = String(text || '').trim();
  t = t.replace(/^```[a-z]*\n?|```$/g, '').trim();
  t = t.replace(/^(回覆|建議回覆|潤稿|修改後)[：:]\s*/, '');
  if (/^「[\s\S]*」$/.test(t) || /^"[\s\S]*"$/.test(t)) t = t.slice(1, -1).trim();
  return t.replace(/\*\*(.+?)\*\*/g, '$1');
}

function systemPrompt(agent, style, { hasSources }) {
  const parts = [
    `你是「${agent.name}」，協助公司同仁撰寫要在 LINE 對話中送出的訊息。`,
    agent.instructions ? `# 角色與指示\n${agent.instructions}` : '',
    '# 輸出規則',
    '- 只輸出要送出的訊息本文，不要加前言、說明、引號或多個版本。',
    '- 使用繁體中文（台灣用語）；對方用其他語言時改用對方的語言。',
    '- LINE 不支援 Markdown：不要用粗體、標題、表格或程式碼區塊；需要條列時用「・」或數字。',
    '- 不可捏造價格、坪數、日期、優惠或承諾；資料不足時以詢問、保留或「我確認後回覆您」的方式表達。',
    '- 不要透露客戶資料中與這次回覆無關的內容，也不要提到你是 AI。',
    hasSources ? '- 需要具體資料（價目、規格、條款、活動）時，先用 search_files 找檔案、read_file 讀內容，再依內容回答；找不到就不要編造。' : '',
  ];
  if (style) {
    parts.push(`# 風格：${style.name}\n${style.instruction || ''}`);
    if (style.example) parts.push(`# 風格範例\n${style.example}`);
  }
  return parts.filter(Boolean).join('\n');
}

/**
 * @param {object} p
 * @param {object} p.me 撰稿者 { userKey, name, lineId }
 * @param {'suggest'|'polish'} p.mode
 * @returns {{ text, styleId, cited: string[], usage }}
 */
async function generate({ me, conv, agent, mode, styleId, text, instruction, sourceIds, global, kind }) {
  if (!agent) throw new HttpsError('failed-precondition', '這段對話尚未指定 AI Agent，請聯絡超級管理員。');
  if (mode === 'polish' && !String(text || '').trim()) throw new HttpsError('invalid-argument', '請先輸入要潤飾的文字。');

  const styles = await stylesFor(agent);
  const style = styles.find(s => s.id === styleId) || styles.find(s => s.id === agent.defaultStyleId) || null;

  const [messages, customer, project] = await Promise.all([
    recentMessages(conv.id, Math.max(5, Math.min(80, Number(global.historyMessages) || 30))),
    agent.useCustomerData !== false && conv.customerId ? getCustomer(conv.customerId) : null,
    conv.projectId ? getDb().collection('projects').doc(conv.projectId).get() : null,
  ]);

  let available = [];
  if (Array.isArray(sourceIds) && sourceIds.length) {
    const wanted = new Set(sourceIds.map(String));
    available = (await sources.availableFor(me, agent)).filter(s => wanted.has(s.id));
  }

  const info = [`- 對話：${conv.customerName || conv.name}（${TYPE_LABEL[conv.type] || 'LINE'}）`];
  if (project?.exists) info.push(`- 建案：${project.data().name || conv.projectId}`);
  if (me?.name) info.push(`- 我方發言者：${me.name}`);
  info.push(`- 今天：${new Date().toLocaleDateString('zh-TW', { timeZone: 'Asia/Taipei', year: 'numeric', month: '2-digit', day: '2-digit', weekday: 'short' })}`);

  const blocks = [`# 對話資訊\n${info.join('\n')}`];
  const custText = customerContext(customer);
  if (custText) blocks.push(`# 客戶資料\n${custText}`);
  if (conv.summary) blocks.push(`# 對話記憶（摘要）\n${conv.summary}`);
  if (conv.facts?.length) blocks.push(`# 需要記得的重點\n${conv.facts.map(f => `- ${f}`).join('\n')}`);
  blocks.push(`# 最近對話（由舊到新）\n${messages.length ? transcript(messages, conv, me) : '（尚無訊息）'}`);

  const extra = String(instruction || '').trim().slice(0, 1000);
  if (mode === 'polish') {
    blocks.push(`# 任務\n請潤飾我寫的草稿，保留原意與重點，讓它更通順、得體，符合風格要求。${extra ? `\n補充要求：${extra}` : ''}\n\n# 我的草稿\n${String(text).trim().slice(0, 4000)}`);
  } else {
    const draft = String(text || '').trim();
    blocks.push(`# 任務\n請根據以上對話，替我想一則接下來要送出的回覆。${extra ? `\n補充要求：${extra}` : ''}${draft ? `\n可參考我想表達的重點：${draft.slice(0, 2000)}` : ''}`);
  }

  const cited = [];
  let result;
  try {
    result = await run(agent, {
      system: systemPrompt(agent, style, { hasSources: available.length > 0 }),
      messages: [{ role: 'user', content: blocks.join('\n\n') }],
      tools: available.length ? sources.TOOLS : [],
      handlers: available.length ? sources.handlersFor(available, cited) : {},
    });
  } catch (e) {
    throw friendlyModelError(e);
  }
  await recordUsage(agent, result.usage, kind || mode);
  const draftText = cleanDraft(result.text);
  if (!draftText) throw new HttpsError('internal', result.stop === 'safety' ? 'AI 拒絕產生這段內容，請調整後再試。' : 'AI 沒有產生內容，請再試一次。');
  return { text: draftText, styleId: style?.id || null, cited, usage: result.usage };
}

module.exports = { generate, stylesFor, recentMessages, transcript, messageText };
