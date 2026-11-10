// 排程更新：欄位比對、Excel 排程套用與還原（純函式，Firestore 讀寫在 scheduledUpdates.js）
//
// Excel 排程：建立時把上傳列與現有資料比對，只保存有改的欄位 { from, to }；
//   執行時欄位目前值仍等於 from 才寫入 to，已被別人改過就跳過（衝突）；
//   已售戶（狀態不在勾選清單）的表價／底價欄位不動。
// 還原：只把「目前仍等於排程寫入值」的欄位改回原值，被改過的跳過。
// 總價（房屋＋露臺）一律由 applyDerivedPrices 重算，不當成一般欄位比對。

const { DERIVED_TOTAL_KEYS, applyDerivedPrices } = require('./priceDerive');

// Excel 比對時不列入的欄位：識別欄位、系統時間、衍生欄位
const EXCEL_IGNORED_FIELDS = new Set([
  'projectId', 'unitId', 'updatedAt', 'createdAt',
  ...DERIVED_TOTAL_KEYS, 'price_list_terrace_unit',
]);

// 已售戶不可由 Excel 排程改動的價格欄位（表價／底價）
const LIST_FLOOR_PRICE_FIELDS = new Set([
  'price_list_house_only', 'price_list_terrace', 'price_list_ancillary',
  'price_floor_house_only', 'price_floor_terrace', 'price_floor_ancillary',
]);

function isTimestampLike(v) {
  return !!v && typeof v === 'object' && (typeof v.toMillis === 'function'
    || (typeof v._seconds === 'number' && typeof v._nanoseconds === 'number'));
}

function timestampMillis(v) {
  if (typeof v.toMillis === 'function') return v.toMillis();
  return v._seconds * 1000 + Math.round(v._nanoseconds / 1e6);
}

/** 比對用的標準形：空值（null／undefined／''／[]／{}）一律 null，時間轉毫秒，物件鍵排序 */
function canonValue(v) {
  if (v === undefined || v === null) return null;
  if (typeof v === 'string') {
    const s = v.trim();
    return s === '' ? null : s;
  }
  if (typeof v === 'number') return Number.isFinite(v) ? v : null;
  if (typeof v === 'boolean') return v;
  if (v instanceof Date) return { $t: v.getTime() };
  if (isTimestampLike(v)) return { $t: timestampMillis(v) };
  if (Array.isArray(v)) {
    const arr = v.map(canonValue);
    return arr.length ? arr : null;
  }
  if (typeof v === 'object') {
    const out = {};
    for (const key of Object.keys(v).sort()) {
      const c = canonValue(v[key]);
      if (c !== null) out[key] = c;
    }
    return Object.keys(out).length ? out : null;
  }
  return String(v);
}

function numericOf(c) {
  if (typeof c === 'number') return c;
  if (typeof c === 'string' && /^-?\d+(\.\d+)?$/.test(c)) return Number(c);
  return null;
}

/** 兩個欄位值是否視為相同（'' 與 null 相同、"12" 與 12 相同） */
function sameValue(a, b) {
  const ca = canonValue(a);
  const cb = canonValue(b);
  if (ca === null || cb === null) return ca === cb;
  if (typeof ca !== 'object' && typeof cb !== 'object') {
    const na = numericOf(ca);
    const nb = numericOf(cb);
    if (na !== null && nb !== null) return Math.abs(na - nb) < 1e-9;
    return ca === cb;
  }
  return JSON.stringify(ca) === JSON.stringify(cb);
}

const storable = (v) => (v === undefined ? null : v);

/**
 * Excel 列（已正規化）與現有資料比對，只留有改的欄位。
 * @param {object[]} rows 經 normalizeHouseholdUploadRow 處理過的列
 * @param {Map<string, {docId: string, data: object}>} existingByUnitId
 */
function buildExcelDiff(rows, existingByUnitId) {
  const items = [];
  const unknownUnitIds = [];
  const seen = new Set();
  let unchangedCount = 0;
  for (const row of rows) {
    const unitId = String(row.unitId || '').trim();
    if (!unitId || seen.has(unitId)) continue;
    seen.add(unitId);
    const existing = existingByUnitId.get(unitId);
    if (!existing) {
      unknownUnitIds.push(unitId);
      continue;
    }
    const fields = {};
    for (const key of Object.keys(row)) {
      if (EXCEL_IGNORED_FIELDS.has(key)) continue;
      if (sameValue(row[key], existing.data[key])) continue;
      fields[key] = { from: storable(existing.data[key]), to: storable(row[key]) };
    }
    if (Object.keys(fields).length) items.push({ unitId, docId: existing.docId, fields });
    else unchangedCount += 1;
  }
  return { items, unknownUnitIds, unchangedCount };
}

/** 依寫入內容補上總價重算，回傳最終寫入內容與每欄 { from, to } 紀錄 */
function finalizeHouseholdUpdate(current, update) {
  applyDerivedPrices(update, current || {});
  const changes = {};
  for (const [key, value] of Object.entries(update)) {
    const from = current ? current[key] : undefined;
    if (sameValue(from, value)) continue;
    changes[key] = { from: storable(from), to: storable(value) };
  }
  for (const key of Object.keys(update)) {
    if (!(key in changes)) delete update[key];
  }
  return { update, changes };
}

/**
 * Excel 排程執行：逐欄檢查衝突後組出寫入內容。
 * @param {object} current 執行當下的戶別資料
 * @param {object} fields 建立時保存的 { 欄位: { from, to } }
 * @param {{ unsold: boolean }} opts unsold=false 時表價／底價欄位不動
 */
function planExcelApply(current, fields, opts = {}) {
  const update = {};
  const skipped = [];
  for (const [key, diff] of Object.entries(fields || {})) {
    if (!diff || typeof diff !== 'object') continue;
    const now = current ? current[key] : undefined;
    if (sameValue(now, diff.to)) continue; // 已經是新值
    if (LIST_FLOOR_PRICE_FIELDS.has(key) && !opts.unsold) {
      skipped.push({ field: key, reason: '已售不調價' });
      continue;
    }
    if (!sameValue(now, diff.from)) {
      skipped.push({ field: key, reason: '建立後已被修改' });
      continue;
    }
    update[key] = storable(diff.to);
  }
  // salesStatus_backend 與 status 必須連動（與 Excel 上傳一致）
  if ('salesStatus_backend' in update) update.status = update.salesStatus_backend;
  const finalized = finalizeHouseholdUpdate(current, update);
  return { update: finalized.update, changes: finalized.changes, skipped };
}

/**
 * 還原：只改回目前仍等於排程寫入值的欄位。
 * @param {object} current 目前資料
 * @param {object} changes 執行時記錄的 { 欄位: { from, to } }
 * @param {'household'|'parking'} kind
 */
function planRevert(current, changes, kind) {
  const update = {};
  const skipped = [];
  const derived = new Set([...DERIVED_TOTAL_KEYS, 'price_list_terrace_unit']);
  for (const [key, diff] of Object.entries(changes || {})) {
    if (!diff || typeof diff !== 'object') continue;
    if (kind === 'household' && derived.has(key)) continue; // 由明細重算
    const now = current ? current[key] : undefined;
    if (sameValue(now, diff.from)) continue; // 已是原值
    if (!sameValue(now, diff.to)) {
      skipped.push({ field: key, reason: '執行後已被修改' });
      continue;
    }
    update[key] = storable(diff.from);
  }
  if (kind === 'household') {
    if ('salesStatus_backend' in update) update.status = update.salesStatus_backend;
    return { ...finalizeHouseholdUpdate(current, update), skipped };
  }
  const result = {};
  for (const [key, value] of Object.entries(update)) {
    result[key] = { from: storable(current ? current[key] : undefined), to: value };
  }
  return { update, changes: result, skipped };
}

module.exports = {
  EXCEL_IGNORED_FIELDS,
  LIST_FLOOR_PRICE_FIELDS,
  canonValue,
  sameValue,
  buildExcelDiff,
  finalizeHouseholdUpdate,
  planExcelApply,
  planRevert,
};
