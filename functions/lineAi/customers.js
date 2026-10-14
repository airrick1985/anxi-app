// LINE AI 助理：客資（vipGuests）搜尋與給 AI 的客戶摘要
// 負責業務：vipGuests.latestSalesPhone（= users 文件 id）

const { getDb, toMillis } = require('./db');

// 送給 AI 前排除的個資欄位
const SENSITIVE_KEY = /電話|手機|phone|mobile|身分證|身份證|idNumber|email|信箱|生日|birthday|地址|address/i;
const MAX_FIELD_CHARS = 200;

async function getCustomer(customerId) {
  if (!customerId) return null;
  const snap = await getDb().collection('vipGuests').doc(String(customerId)).get();
  return snap.exists ? { id: snap.id, ...snap.data() } : null;
}

function customerBrief(c) {
  return {
    id: c.id,
    name: c.latestName || c.profile?.['姓名'] || '',
    phone: c.phone || '',
    salesName: c.latestSalesName || '',
    salesKey: c.latestSalesPhone || null,
    projectId: c.projectId || null,
  };
}

async function searchCustomers(projectId, q) {
  const term = String(q || '').trim();
  if (!projectId || !term) return [];
  const col = getDb().collection('vipGuests');
  const isPhone = /^[0-9+\-\s()]+$/.test(term);
  const phones = [...new Set([term, term.replace(/[\s\-()]/g, '')])];
  const snap = isPhone
    ? await col.where('searchablePhones', 'array-contains-any', phones).limit(20).get()
    : await col.where('searchableNames', 'array-contains', term).limit(20).get();
  return snap.docs
    .map(d => ({ id: d.id, ...d.data() }))
    .filter(c => (c.allProjectIds || [c.projectId]).includes(projectId))
    .map(customerBrief);
}

function profileLines(profile) {
  const out = [];
  for (const [k, v] of Object.entries(profile || {})) {
    if (SENSITIVE_KEY.test(k) || k.startsWith('_') || k === 'otherPhones' || k === 'submissionSource') continue;
    let text = Array.isArray(v) ? v.filter(x => typeof x === 'string' || typeof x === 'number').join('、') : v;
    if (text === null || text === undefined || typeof text === 'object') continue;
    text = String(text).trim();
    if (!text) continue;
    out.push(`- ${k}：${text.slice(0, MAX_FIELD_CHARS)}`);
    if (out.length >= 30) break;
  }
  return out;
}

/** 給 AI 的客戶資料（不含電話、身分證、地址等個資） */
function customerContext(c) {
  if (!c) return '';
  const lines = [`- 姓名：${c.latestName || '未填'}`];
  if (c.latestSalesName) lines.push(`- 負責業務：${c.latestSalesName}`);
  lines.push(...profileLines(c.profile));
  const logs = [...(c.interactionLogs || [])]
    .filter(l => l && typeof l.content === 'string' && l.content.trim())
    .sort((a, b) => (toMillis(b.date) || 0) - (toMillis(a.date) || 0))
    .slice(0, 5);
  if (logs.length) {
    lines.push('- 最近洽談紀錄：');
    for (const l of logs) {
      const date = typeof l.date === 'string' ? l.date.slice(0, 10) : (toMillis(l.date) ? new Date(toMillis(l.date)).toISOString().slice(0, 10) : '');
      const type = l['互動方式'] || l.interactionType || '';
      lines.push(`  - ${date}${type ? `（${type}）` : ''}：${l.content.trim().slice(0, 300)}`);
    }
  }
  return lines.join('\n');
}

module.exports = { getCustomer, customerBrief, searchCustomers, customerContext };
