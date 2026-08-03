// 驗屋人員排休共用工具
// 排休資料來源：Firestore `inspectorLeaves` 集合（經 inspectionCalendarApi / liffCalendarApi 的 fetchInspectorLeaves 取得）
// 排休類型：am=上休（12:00 前時段）、pm=下休（12:00 起時段）、full=休假（整天）

export const LEAVE_TYPE_LABELS = { am: '上休', pm: '下休', full: '休假' };
export const LEAVE_TYPE_OPTIONS = [
  { value: 'am', label: '上休', hint: '12:00 前時段休', icon: 'mdi-weather-sunset-up' },
  { value: 'pm', label: '下休', hint: '12:00 起時段休', icon: 'mdi-weather-sunset-down' },
  { value: 'full', label: '休假(整天)', hint: '全日休', icon: 'mdi-beach' },
];

// 排休類型對應顏色（月曆 chips 用）
export const LEAVE_TYPE_COLORS = {
  am: { bg: '#FFF3E0', text: '#E65100', border: '#FFCC80' },   // 橘：上休
  pm: { bg: '#E3F2FD', text: '#1565C0', border: '#90CAF9' },   // 藍：下休
  full: { bg: '#FCE4EC', text: '#C2185B', border: '#F48FB1' }, // 粉紅：休假
};

/**
 * 把後端回傳的排休/備註陣列整理成查詢用 Map
 * @returns {{ leaveMap: Object<date, Object<staffName, leave>>, notesByDate: Object<date, note[]> }}
 */
export function buildLeaveMap(records) {
  const leaveMap = {};
  const notesByDate = {};
  for (const rec of (records || [])) {
    if (!rec || !rec.date) continue;
    if ((rec.kind || 'leave') === 'note') {
      if (!notesByDate[rec.date]) notesByDate[rec.date] = [];
      notesByDate[rec.date].push(rec);
    } else {
      if (!leaveMap[rec.date]) leaveMap[rec.date] = {};
      leaveMap[rec.date][rec.staffName] = rec;
    }
  }
  return { leaveMap, notesByDate };
}

/**
 * 判斷某人員在指定日期+時段是否受排休影響
 * @param {Object} leaveMap - buildLeaveMap 的 leaveMap
 * @param {string} dateStr - 'yyyy-MM-dd'
 * @param {string} startTime - 'HH:mm'（預約時段開始時間）
 * @param {string} staffName
 * @returns {string|null} 受影響時回傳排休類型 'am'|'pm'|'full'，否則 null
 */
export function getLeaveTypeForSlot(leaveMap, dateStr, startTime, staffName) {
  const leave = leaveMap?.[dateStr]?.[staffName];
  if (!leave) return null;
  if (leave.type === 'full') return 'full';
  const time = startTime || '00:00';
  if (leave.type === 'am' && time < '12:00') return 'am';
  if (leave.type === 'pm' && time >= '12:00') return 'pm';
  return null;
}

/**
 * 將驗屋人員字串（逗號分隔）拆解並標註每個人的排休狀態
 * @returns {Array<{ name, label, onLeave, leaveType }>}
 */
export function annotateInspectorPersons(inspectorsText, leaveMap, dateStr, startTime) {
  return String(inspectorsText || '')
    .split(',')
    .map(name => name.trim())
    .filter(Boolean)
    .map(name => {
      const leaveType = getLeaveTypeForSlot(leaveMap, dateStr, startTime, name);
      return {
        name,
        leaveType,
        onLeave: !!leaveType,
        label: leaveType ? `${name}(${LEAVE_TYPE_LABELS[leaveType]})` : name,
      };
    });
}

/** 從 appointmentTimeSlot 字串取出開始時間 'HH:mm'（取不到回傳 '00:00'） */
export function extractStartTime(timeSlotString) {
  const match = String(timeSlotString || '').match(/(\d{1,2}[:：]\d{2})/);
  if (!match) return '00:00';
  const t = match[0].replace(/：/g, ':');
  return t.length === 4 ? `0${t}` : t; // 9:30 -> 09:30
}
