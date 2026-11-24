/**
 * 戶別整合資訊：預約就地編輯的草稿、檢查與異動內容
 */
import { activeMethodFields, findBookingMethods, formatBookingValue, methodFieldLabels, toTaipeiDateStr } from './bookingChanges.js';

const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;
// 草稿欄位 → appointments 欄位（純文字，逐欄比對）
const TEXT_FIELDS = {
  timeSlot: 'appointmentTimeSlot',
  method: 'inspectionMethod',
  subOption: 'bookingSubOption',
  bookerName: 'bookerName',
  bookerPhone: 'bookerPhone',
  bookerEmail: 'bookerEmail',
  agentName: 'agentName',
  agentPhone: 'agentPhone',
  agentIdNumber: 'agentIdNumber',
  agentRelationship: 'agentRelationship',
  bookingRemarks: 'bookingRemarks',
};

export const splitInspectors = (raw) => (Array.isArray(raw) ? raw : String(raw || '').split(','))
  .map((name) => String(name).trim()).filter(Boolean);

/** entry：HouseholdGrid buildAppointmentMap 的單筆預約 */
export function createBookingDraft(entry, type) {
  const draft = { appointmentId: entry.appointmentId, type, status: entry.status || '', date: toTaipeiDateStr(entry.date) };
  for (const key of Object.keys(TEXT_FIELDS)) draft[key] = String(entry[key] ?? '');
  draft.inspectors = splitInspectors(entry.inspectors);
  draft.bookingMethodDetails = JSON.parse(JSON.stringify(entry.bookingMethodDetails || {}));
  draft.methodDetailsDisplay = JSON.parse(JSON.stringify(entry.bookingMethodDetailsDisplay || [])); // 只供比對原值
  return draft;
}

/** 換方式：保留同欄位或同名稱欄位已填的內容；換回原方式則還原 */
export function detailsForMethod(draft, snapshot, methods) {
  if (draft.method === snapshot.method) return JSON.parse(JSON.stringify(snapshot.bookingMethodDetails));
  const labels = methodFieldLabels(methods);
  const byLabel = {};
  for (const source of [snapshot.bookingMethodDetails, draft.bookingMethodDetails]) {
    for (const [id, value] of Object.entries(source || {})) {
      if (labels[id] && formatBookingValue('', value) !== '無') byLabel[labels[id]] = value;
    }
  }
  const method = methods.find((m) => m.title === draft.method);
  const next = {};
  // 子欄位要在父選項帶入後才會出現，跑到沒有新欄位為止
  for (let guard = 0; guard < 6; guard++) {
    const added = activeMethodFields(method, next).filter((f) => !(f.id in next));
    if (!added.length) break;
    for (const f of added) next[f.id] = byLabel[f.label] ?? (f.type === 'checkbox' ? [] : '');
  }
  return next;
}

/** 儲存前檢查；回傳錯誤文字，沒有問題回傳 '' */
export function validateBookingDraft(draft, snapshot, bookingMenu) {
  if (!draft.date && snapshot.date) return '請輸入預約日期';
  if (!draft.timeSlot && snapshot.timeSlot) return '請選擇時段';
  if (draft.timeSlot !== snapshot.timeSlot && !TIME_RE.test(draft.timeSlot)) return '時段格式為 HH:MM';
  if (draft.date !== snapshot.date && !draft.timeSlot) return '請選擇時段';
  if (!draft.method && snapshot.method) return '請選擇方式';
  if (draft.bookerEmail && draft.bookerEmail !== snapshot.bookerEmail && !/^\S+@\S+\.\S+$/.test(draft.bookerEmail)) return '預約人 Email 格式不正確';
  if (draft.method !== snapshot.method) {
    const method = findBookingMethods(bookingMenu, draft.type).find((m) => m.title === draft.method);
    if (method?.subOptions?.length && !draft.subOption) return '請選擇子項目';
  }
  return '';
}

/** 要寫回 appointments 的欄位；沒有變更回傳 {} */
export function buildBookingPayload(draft, snapshot, bookingMenu) {
  const payload = {};
  if (draft.date !== snapshot.date && draft.date) payload.appointmentDate = draft.date;
  for (const [key, field] of Object.entries(TEXT_FIELDS)) {
    if (draft[key] !== snapshot[key]) payload[field] = draft[key];
  }
  if (draft.inspectors.join(',') !== snapshot.inspectors.join(',')) payload.inspectors = draft.inspectors.join(',');

  const methods = findBookingMethods(bookingMenu, draft.type);
  const oldD = snapshot.bookingMethodDetails;
  const newD = draft.bookingMethodDetails;
  const changed = [...new Set([...Object.keys(oldD), ...Object.keys(newD)])]
    .some((k) => formatBookingValue('', oldD[k]) !== formatBookingValue('', newD[k]));
  if (changed) {
    let details = { ...newD };
    if (draft.method !== snapshot.method) {
      // 換方式後只留新方式的欄位
      const ids = new Set(activeMethodFields(methods.find((m) => m.title === draft.method), newD).map((f) => f.id));
      details = Object.fromEntries(Object.entries(newD).filter(([id]) => ids.has(id)));
    }
    const labels = methodFieldLabels(methods);
    payload.bookingMethodDetails = details;
    payload.bookingMethodDetailsDisplay = Object.entries(details).map(([id, value]) => ({ label: labels[id] || id, value }));
  }
  return payload;
}

/** 給 buildBookingChanges 比對用的原始資料（appointments 欄位名） */
export function draftToAppointment(snapshot) {
  const out = { appointmentDate: snapshot.date, inspectors: snapshot.inspectors.join(','), bookingMethodDetails: snapshot.bookingMethodDetails, bookingMethodDetailsDisplay: snapshot.methodDetailsDisplay };
  for (const [key, field] of Object.entries(TEXT_FIELDS)) out[field] = snapshot[key];
  return out;
}
