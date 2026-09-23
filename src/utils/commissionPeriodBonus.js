/** Active bonus sources include legacy combined records and independent bonus entries. */
export function bonusSourceRecords(claims = [], entries = [], bonuses = []) {
  const activeIds = new Set(bonuses.filter(b => b.status !== 'voided').map(b => b.commissionRecordId));
  return [...claims.filter(r => activeIds.has(r.id)).map(r => ({ ...r, status: 'active' })),
    ...entries.filter(r => r.status !== 'voided')];
}

/**
 * 每人歷期備註（來自獎金明細 remark，例如歷史匯入的「備註」欄）：
 * personKey -> [{ period, requestDate, notes }]，只收有效明細、去重、依期別／獎金日期由新到舊。
 */
export function personNoteHistory(bonusRecords = []) {
  const map = {};
  (bonusRecords || []).forEach(b => {
    const remark = String(b.remark || '').trim();
    if (!remark || b.status === 'voided') return;
    const key = b.personKey || b.name;
    const period = Number(b.period) || 0;
    if (!map[key]) map[key] = [];
    let row = map[key].find(x => x.period === period);
    if (!row) { row = { period, requestDate: String(b.requestDate || ''), notes: [] }; map[key].push(row); }
    if (!row.notes.includes(remark)) row.notes.push(remark);
    if (String(b.requestDate || '') > row.requestDate) row.requestDate = String(b.requestDate || '');
  });
  Object.values(map).forEach(list => list.sort((a, b) => b.period - a.period || b.requestDate.localeCompare(a.requestDate)));
  return map;
}

/**
 * 某人某期的當期備註：本期已存者優先（存過空陣列視為刻意清空）；
 * 未存則用本期獎金明細的備註（fallback）；都沒有時自動帶入此人最近一期（期別小於本期）的備註：
 * 已存的當期備註與獎金明細備註（history，例如歷史匯入）取期別較新者。
 */
export function periodPersonNotes(notes, period, personKey, fallback = [], history = []) {
  const list = notes || [];
  const saved = list.find(n => Number(n.period) === Number(period) && n.personKey === personKey);
  if (saved) return (saved.notes || []).map(String);
  if (fallback.length) return fallback;
  const prevSaved = list.filter(n => n.personKey === personKey && Number(n.period) < Number(period))
    .sort((a, b) => Number(b.period) - Number(a.period))[0];
  const prevLegacy = (history || []).filter(h => Number(h.period) < Number(period) && (h.notes || []).length)
    .sort((a, b) => Number(b.period) - Number(a.period))[0];
  if (prevSaved && (!prevLegacy || Number(prevSaved.period) >= Number(prevLegacy.period))) return (prevSaved.notes || []).map(String);
  if (prevLegacy) return prevLegacy.notes.map(String);
  return fallback;
}

/**
 * Replacements remove the old rows before adding drafts, including when moved to another period.
 * byCat：每人各獎金項目合計。
 * 人員排序：先依 categoryOrder（獎金類別順序）取每人「第一個有金額的項目」排序，同項目再依 sorter（預設姓名）。
 * 這樣列出的順序會與戶別卡片「獎金人員與分配」逐類別列人的順序一致（主委 → 副總 → … → 銷售個獎）。
 */
export function summarizePeriodBonus({ period, saved = [], drafts = [], replacingIds = [], sorter = null, categoryOrder = [] }) {
  const replacing = new Set(replacingIds.filter(Boolean));
  const rows = [...saved.filter(b => b.status !== 'voided' && !replacing.has(b.commissionRecordId)), ...drafts]
    .filter(b => Number(b.period) === Number(period));
  const people = new Map();
  const fields = ['subtotal', 'keep', 'tax', 'nhi', 'net'];
  for (const row of rows) {
    const key = row.personKey || row.name;
    if (!people.has(key)) people.set(key, { ...row, personKey: key, subtotal: 0, keep: 0, tax: 0, nhi: 0, net: 0, byCat: {}, legacyNotes: [] });
    const person = people.get(key);
    fields.forEach(field => { person[field] += Number(row[field]) || 0; });
    Object.entries(row.amounts || {}).forEach(([k, v]) => { person.byCat[k] = (person.byCat[k] || 0) + (Number(v) || 0); });
    if (row.remark && !person.legacyNotes.includes(row.remark)) person.legacyNotes.push(row.remark);
  }
  const byName = (a, b) => String(a.name).localeCompare(String(b.name), 'zh-Hant');
  const tie = typeof sorter === 'function' ? sorter : byName;
  const catIdx = {};
  (categoryOrder || []).forEach((k, i) => { if (catIdx[k] === undefined) catIdx[k] = i; });
  const catRank = p => Object.entries(p.byCat || {}).reduce((best, [k, v]) => (v && catIdx[k] !== undefined ? Math.min(best, catIdx[k]) : best), Number.MAX_SAFE_INTEGER);
  const list = [...people.values()].sort((a, b) => (catRank(a) - catRank(b)) || tie(a, b));
  const totals = Object.fromEntries(fields.map(field => [field, list.reduce((sum, p) => sum + p[field], 0)]));
  return { people: list, totals };
}
