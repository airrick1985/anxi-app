/**
 * 預約異動：台灣日期換算、異動內容比對、通知信收件人
 * 前端 src/utils/bookingChanges.js 用同一套欄位與規則顯示「修改前 → 修改後」，改欄位時兩邊要一起改。
 */
const TAIPEI_DATE = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Asia/Taipei", year: "numeric", month: "2-digit", day: "2-digit",
});

/** Timestamp／Date／字串 → 台灣日期 yyyy-MM-dd；無法辨識回傳 null */
function toTaipeiDateStr(value) {
  if (!value) return null;
  const date = typeof value.toDate === "function" ? value.toDate() : new Date(value);
  return isNaN(date.getTime()) ? null : TAIPEI_DATE.format(date);
}

/** yyyy-MM-dd → 該日台灣 00:00（與新增預約、名額查詢一致） */
const taipeiMidnight = (dateStr) => new Date(`${dateStr}T00:00:00+08:00`);

// 會通知預約人的欄位（備註、驗屋人員為內部資料，不列入）
const NOTIFY_FIELDS = [
  ["bookingType", "預約項目"],
  ["appointmentDate", "預約日期"],
  ["appointmentTimeSlot", "預約時段"],
  ["inspectionMethod", "選擇方式"],
  ["bookingSubOption", "子項目"],
  ["inspectionCompanyName", "代驗公司"],
  ["bookerName", "預約人姓名"],
  ["bookerPhone", "預約人電話"],
  ["bookerEmail", "預約人Email"],
  ["bookerIdNumber", "預約人身分證"],
  ["agentName", "受託人姓名"],
  ["agentPhone", "受託人電話"],
  ["agentIdNumber", "受託人身分證"],
  ["agentRelationship", "與委託人關係"],
];
const ID_FIELDS = new Set(["bookerIdNumber", "agentIdNumber"]);

const EMPTY = "無";
const maskId = (text) => (text.length > 6 ? `${text.slice(0, 3)}***${text.slice(-3)}` : "***");

function formatValue(key, value) {
  if (Array.isArray(value)) return value.length ? value.join("、") : EMPTY;
  if (value === null || value === undefined || value === "") return EMPTY;
  if (key === "appointmentDate") return (toTaipeiDateStr(value) || "").replace(/-/g, "/") || EMPTY;
  return String(value);
}

/** 實際有變動、要通知的欄位：[{ field, before, after }] */
function buildBookingChanges(original = {}, payload = {}) {
  const changes = [];
  const push = (field, before, after, key) => {
    if (before === after) return;
    const show = (text) => (ID_FIELDS.has(key) && text !== EMPTY ? maskId(text) : text);
    changes.push({ field, before: show(before), after: show(after) });
  };
  for (const [key, label] of NOTIFY_FIELDS) {
    if (!(key in payload)) continue;
    push(label, formatValue(key, original[key]), formatValue(key, payload[key]), key);
  }
  // 方式額外欄位：bookingMethodDetailsDisplay 與 bookingMethodDetails 的鍵順序一致
  if (payload.bookingMethodDetails && Array.isArray(payload.bookingMethodDetailsDisplay)) {
    const before = original.bookingMethodDetails || {};
    // 換方式後同名欄位的 id 不同，改用標籤找原本的值
    const byLabel = Object.fromEntries((Array.isArray(original.bookingMethodDetailsDisplay) ? original.bookingMethodDetailsDisplay : [])
      .filter((d) => d?.label).map((d) => [d.label, d.value]));
    Object.entries(payload.bookingMethodDetails).forEach(([id, value], i) => {
      const label = payload.bookingMethodDetailsDisplay[i]?.label;
      if (label) push(label, formatValue(id, id in before ? before[id] : byLabel[label]), formatValue(id, value));
    });
  }
  return changes;
}

/**
 * 收件人：預約人依勾選；副本只採用伺服器名單內被勾選的，必寄角色一律包含
 * ccDetails: [{ email, mandatory }]
 */
function resolveNotifyRecipients(notify, bookerEmail, ccDetails) {
  const selected = Array.isArray(notify?.cc) ? notify.cc : [];
  const cc = [...new Set((ccDetails || [])
    .filter((r) => r.mandatory || selected.includes(r.email))
    .map((r) => r.email))];
  if (notify?.toBooker === true && bookerEmail) return { to: [bookerEmail], cc: cc.filter((email) => email !== bookerEmail) };
  return { to: cc, cc: [] };
}

const escapeHtml = (text) => String(text ?? "").replace(/[&<>"']/g,
  (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

module.exports = { toTaipeiDateStr, taipeiMidnight, buildBookingChanges, resolveNotifyRecipients, escapeHtml, NOTIFY_FIELDS };
