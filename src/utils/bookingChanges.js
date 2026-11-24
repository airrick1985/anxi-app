/**
 * 預約修改：修改前 → 修改後（給「是否寄修改通知」視窗顯示）
 * 欄位與規則要和後端 functions/bookingChangeNotify.js 一致：畫面列出的就是信件內容。
 */
export const BOOKING_NOTIFY_FIELDS = [
  ['bookingType', '預約項目'],
  ['appointmentDate', '預約日期'],
  ['appointmentTimeSlot', '預約時段'],
  ['inspectionMethod', '選擇方式'],
  ['bookingSubOption', '子項目'],
  ['inspectionCompanyName', '代驗公司'],
  ['bookerName', '預約人姓名'],
  ['bookerPhone', '預約人電話'],
  ['bookerEmail', '預約人Email'],
  ['bookerIdNumber', '預約人身分證'],
  ['agentName', '受託人姓名'],
  ['agentPhone', '受託人電話'],
  ['agentIdNumber', '受託人身分證'],
  ['agentRelationship', '與委託人關係'],
];
const ID_FIELDS = new Set(['bookerIdNumber', 'agentIdNumber']);
const EMPTY = '無';
const TAIPEI_DATE = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Taipei', year: 'numeric', month: '2-digit', day: '2-digit' });

/** Timestamp／Date／字串 → 台灣日期 yyyy-MM-dd；無法辨識回傳 '' */
export function toTaipeiDateStr(value) {
  if (!value) return '';
  const d = typeof value.toDate === 'function' ? value.toDate() : new Date(value);
  return isNaN(d.getTime()) ? '' : TAIPEI_DATE.format(d);
}

const maskId = (text) => (text.length > 6 ? `${text.slice(0, 3)}***${text.slice(-3)}` : '***');

export function formatBookingValue(key, value) {
  if (Array.isArray(value)) return value.length ? value.join('、') : EMPTY;
  if (value === null || value === undefined || value === '') return EMPTY;
  if (key === 'appointmentDate') return toTaipeiDateStr(value).replace(/-/g, '/') || EMPTY;
  return String(value);
}

/** 要通知的異動：[{ field, before, after }]；備註、驗屋人員等內部欄位不列 */
export function buildBookingChanges(original = {}, payload = {}) {
  const changes = [];
  const push = (field, before, after, key) => {
    if (before === after) return;
    const show = (text) => (ID_FIELDS.has(key) && text !== EMPTY ? maskId(text) : text);
    changes.push({ field, before: show(before), after: show(after) });
  };
  for (const [key, label] of BOOKING_NOTIFY_FIELDS) {
    if (!(key in payload)) continue;
    push(label, formatBookingValue(key, original[key]), formatBookingValue(key, payload[key]), key);
  }
  if (payload.bookingMethodDetails && Array.isArray(payload.bookingMethodDetailsDisplay)) {
    const before = original.bookingMethodDetails || {};
    // 換方式後同名欄位的 id 不同，改用標籤找原本的值
    const byLabel = Object.fromEntries((Array.isArray(original.bookingMethodDetailsDisplay) ? original.bookingMethodDetailsDisplay : [])
      .filter((d) => d?.label).map((d) => [d.label, d.value]));
    Object.entries(payload.bookingMethodDetails).forEach(([id, value], i) => {
      const label = payload.bookingMethodDetailsDisplay[i]?.label;
      if (label) push(label, formatBookingValue(id, id in before ? before[id] : byLabel[label]), formatBookingValue(id, value));
    });
  }
  return changes;
}

/** 規則類錯誤（名額、日期、時段、方式、批次）：後台確認後可強制儲存 */
export function isForceableBookingError(message) {
  const msg = String(message || '');
  return msg.includes('不在可預約範圍內') || msg.includes('規則已被刪除')
    || msg.startsWith('SLOT_FULL') || msg.includes('不適用於選擇方式')
    || (msg.includes('時段') && msg.includes('不存在'))
    || msg.includes('有效預約批次') || msg.includes('未指派批次') || msg.includes('對應的規則');
}

/** 儲存結果訊息；notify 為後端回傳的 { sent, error } */
export function bookingSaveMessage(result, wantedNotify) {
  if (result?.notify?.error) return { text: '已儲存，但修改通知寄送失敗', color: 'warning' };
  if (wantedNotify && result?.notify?.sent) return { text: '已儲存並寄出修改通知', color: 'success' };
  return { text: '儲存成功', color: 'success' };
}

/** 選單中該預約項目／方式的設定 */
export function findBookingMethods(bookingMenu, type) {
  const item = (Array.isArray(bookingMenu) ? bookingMenu : []).find((i) => i && !i.deleted && i.title === type);
  return (Array.isArray(item?.methods) ? item.methods : []).filter((m) => m && !m.deleted && m.title);
}

const DISPLAY_ONLY = new Set(['header', 'description', 'divider', 'link']);

/** 該方式的額外欄位（含已選選項底下的子欄位），依目前填寫內容展開 */
export function activeMethodFields(method, details = {}) {
  const out = [];
  const walk = (fields) => {
    for (const f of Array.isArray(fields) ? fields : []) {
      if (!f || f.deleted || !f.id || DISPLAY_ONLY.has(f.type)) continue;
      out.push(f);
      for (const o of Array.isArray(f.options) ? f.options : []) {
        const v = details[f.id];
        const on = Array.isArray(v) ? v.includes(o.value) : v === o.value;
        if (on && o.subFields) walk(o.subFields);
      }
    }
  };
  walk(method?.customFields);
  return out;
}

/** 該方式全部欄位 id → 標籤（含子欄位） */
export function methodFieldLabels(methods) {
  const map = {};
  const walk = (fields) => {
    for (const f of Array.isArray(fields) ? fields : []) {
      if (!f?.id) continue;
      if (f.label) map[f.id] = f.label;
      for (const o of Array.isArray(f.options) ? f.options : []) walk(o?.subFields);
    }
  };
  for (const m of methods) walk(m.customFields);
  return map;
}
