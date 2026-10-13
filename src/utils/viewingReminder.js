// 賞屋預約 LINE 預約前提醒：offsets 為提前分鐘數（規則同 functions/viewingReservationReminder.js）
export const REMINDER_PRESETS = [1440, 180, 60, 30, 15];
export const MAX_REMINDERS = 3;
export const MAX_OFFSET_MINUTES = 30 * 24 * 60;
export const REMINDER_UNITS = [
  { value: 1, label: '分鐘' },
  { value: 60, label: '小時' },
  { value: 1440, label: '天' },
];

export function formatOffset(minutes) {
  if (minutes % 1440 === 0) return `${minutes / 1440} 天`;
  if (minutes % 60 === 0) return `${minutes / 60} 小時`;
  return `${minutes} 分鐘`;
}

export function normalizeOffsets(offsets) {
  if (!Array.isArray(offsets)) return [];
  return [...new Set(offsets.map(Number))]
    .filter(n => Number.isInteger(n) && n > 0 && n <= MAX_OFFSET_MINUTES)
    .sort((a, b) => b - a)
    .slice(0, MAX_REMINDERS);
}

// 個人偏好（users/{key}.preferences.viewingReminder）→ 預約上的 lineReminder；沒有偏好時預設關閉、勾 1 小時前
export function reminderFromPrefs(prefs) {
  const offsets = normalizeOffsets(prefs?.offsets);
  return { enabled: prefs?.enabled === true, offsets: offsets.length ? offsets : [60] };
}

export function normalizeReminder(reminder) {
  return { enabled: reminder?.enabled === true, offsets: normalizeOffsets(reminder?.offsets) };
}
