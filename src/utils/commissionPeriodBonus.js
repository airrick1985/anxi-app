/** Active bonus sources include legacy combined records and independent bonus entries. */
export function bonusSourceRecords(claims = [], entries = [], bonuses = []) {
  const activeIds = new Set(bonuses.filter(b => b.status !== 'voided').map(b => b.commissionRecordId));
  return [...claims.filter(r => activeIds.has(r.id)).map(r => ({ ...r, status: 'active' })),
    ...entries.filter(r => r.status !== 'voided')];
}

/**
 * 某人某期的當期備註：本期已存者優先；未存則用該期舊紀錄備註（fallback）；
 * 都沒有時預設帶入此人最近一期（期別小於本期）已存的備註。本期存過空陣列視為刻意清空，不再帶入。
 */
export function periodPersonNotes(notes, period, personKey, fallback = []) {
  const list = notes || [];
  const saved = list.find(n => Number(n.period) === Number(period) && n.personKey === personKey);
  if (saved) return (saved.notes || []).map(String);
  if (fallback.length) return fallback;
  const previous = list.filter(n => n.personKey === personKey && Number(n.period) < Number(period))
    .sort((a, b) => Number(b.period) - Number(a.period))[0];
  return previous ? (previous.notes || []).map(String) : fallback;
}

/** Replacements remove the old rows before adding drafts, including when moved to another period. */
export function summarizePeriodBonus({ period, saved = [], drafts = [], replacingIds = [] }) {
  const replacing = new Set(replacingIds.filter(Boolean));
  const rows = [...saved.filter(b => b.status !== 'voided' && !replacing.has(b.commissionRecordId)), ...drafts]
    .filter(b => Number(b.period) === Number(period));
  const people = new Map();
  const fields = ['subtotal', 'keep', 'tax', 'nhi', 'net'];
  for (const row of rows) {
    const key = row.personKey || row.name;
    if (!people.has(key)) people.set(key, { ...row, personKey: key, subtotal: 0, keep: 0, tax: 0, nhi: 0, net: 0, legacyNotes: [] });
    const person = people.get(key);
    fields.forEach(field => { person[field] += Number(row[field]) || 0; });
    if (row.remark && !person.legacyNotes.includes(row.remark)) person.legacyNotes.push(row.remark);
  }
  const list = [...people.values()].sort((a, b) => String(a.name).localeCompare(String(b.name), 'zh-Hant'));
  const totals = Object.fromEntries(fields.map(field => [field, list.reduce((sum, p) => sum + p[field], 0)]));
  return { people: list, totals };
}
