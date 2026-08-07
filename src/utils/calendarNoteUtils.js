// 行事曆備註共用工具
// 資料來源：Firestore `calendarNotes` 集合（經 inspectionCalendarApi / liffCalendarApi 的 fetchCalendarNotes 取得）
// 註：與「驗屋人員排休」的備註 (inspectorLeaves.kind='note') 是兩套獨立資料，互不干涉。

// 備註顏色（時間表上的醒目色帶）
export const CALENDAR_NOTE_COLORS = {
  amber: { bg: '#FFF3C4', text: '#7A4F01', border: '#F0A500', label: '黃（一般提醒）' },
  red: { bg: '#FFE0E0', text: '#B3261E', border: '#E53935', label: '紅（重要／緊急）' },
  blue: { bg: '#DCEBFF', text: '#0D47A1', border: '#1E88E5', label: '藍（資訊公告）' },
  green: { bg: '#DCF5E3', text: '#1B5E20', border: '#43A047', label: '綠（已確認）' },
  purple: { bg: '#EDE1FB', text: '#4A148C', border: '#8E24AA', label: '紫（其他）' },
};

export const CALENDAR_NOTE_COLOR_OPTIONS = Object.entries(CALENDAR_NOTE_COLORS)
  .map(([value, cfg]) => ({ value, ...cfg }));

/** 取得顏色設定（未知色碼一律退回黃色） */
export function getNoteColor(color) {
  return CALENDAR_NOTE_COLORS[color] || CALENDAR_NOTE_COLORS.amber;
}

/**
 * 把後端回傳的備註陣列整理成「日期 → 備註陣列」查詢用 Map
 * @returns {Object<string, Array>} key 為 'yyyy-MM-dd'
 */
export function buildCalendarNoteMap(records) {
  const map = {};
  for (const rec of (records || [])) {
    if (!rec || !rec.date || !rec.note) continue;
    if (!map[rec.date]) map[rec.date] = [];
    map[rec.date].push(rec);
  }
  return map;
}

/**
 * 依 groupId 把同一則（套用多個日期）的備註收合成單筆，供管理清單顯示
 * @returns {Array<{ groupId, note, color, dates: string[], ids: string[], updatedByName, updatedAt, createdAt }>}
 */
export function groupCalendarNotes(records) {
  const groups = new Map();
  for (const rec of (records || [])) {
    if (!rec || !rec.date || !rec.note) continue;
    const key = rec.groupId || rec.id;
    if (!groups.has(key)) {
      groups.set(key, {
        groupId: key,
        note: rec.note,
        color: rec.color || 'amber',
        dates: [],
        ids: [],
        updatedByName: rec.updatedByName || rec.createdByName || '',
        updatedAt: rec.updatedAt || rec.createdAt || null,
      });
    }
    const g = groups.get(key);
    g.dates.push(rec.date);
    g.ids.push(rec.id);
  }
  return [...groups.values()]
    .map(g => ({ ...g, dates: [...new Set(g.dates)].sort() }))
    .sort((a, b) => (a.dates[0] || '').localeCompare(b.dates[0] || ''));
}
