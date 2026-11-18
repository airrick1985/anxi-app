// 帳號停用（人員管理一鍵停用）：後端回報停用時，由 App.vue 統一顯示「帳號已停用」並清除登入狀態。
// 用視窗事件串接，api.js 與 user store 不必互相引用。
export const ACCOUNT_DISABLED_EVENT = 'anxi-account-disabled';
export const ACCOUNT_DISABLED_MESSAGE = '此帳號已停用，請聯絡管理員。';

/** Cloud Function 丟出的停用錯誤（functions/utils/accountGuard.js 的 details.reason） */
export const isAccountDisabledError = (error) => error?.details?.reason === 'account-disabled';

export function notifyAccountDisabled() {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(ACCOUNT_DISABLED_EVENT));
}
