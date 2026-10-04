/**
 * 公司介紹數據（產品簡報 /deck「關於 ANXI」「用數字認識我們」使用）。
 *
 * - partnerProjects / managedUnits：2026-10-04 自 Firestore（anxi-app）唯讀統計，排除測試建案 TESTA／TESTB，
 *   實際為建案 20 個、4,359 戶（同建案取銷控與預約／驗屋戶別數較大者），對外以取整數顯示。
 * - lateNightUpdates / weekendUpdates：git 提交紀錄（凌晨 0–5 點 146 次、週末 459 次），取整數顯示。
 * - 版本數與上線月數由 appVersion 與 launchDate 自動計算，不需手動更新。
 */
export const COMPANY_PROFILE = {
  launchDate: '2025-04-25',
  partnerProjects: 20,
  managedUnits: 4000,
  latestRelease: '2:20',
  lateNightUpdates: 140,
  weekendUpdates: 450,
};
