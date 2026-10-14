// LINE AI 助理前端共用：呼叫 lineAiApi／lineAiAdminApi 並自動附加身分
// 網頁版用 userKey＋sessionId；LINE 內頁面（LIFF）用 access token，不另外登入系統
import { lineAiApi, lineAiAdminApi } from '@/api';
import { useUserStore } from '@/store/user';

let liffTokenGetter = null;

/** LIFF 入口頁初始化後呼叫，之後的 API 一律以 LINE 身分驗證 */
export function useLiffAuth(getter) { liffTokenGetter = getter; }
export const isLiffMode = () => !!liffTokenGetter;

// 撰稿區各對話的草稿：切換對話、手機版回到清單時保留
export const composerDrafts = new Map();

function authPayload() {
  if (liffTokenGetter) return { liffAccessToken: liffTokenGetter() };
  const userStore = useUserStore();
  return { userKey: userStore.user?.key, sessionId: userStore.sessionId };
}

export function errorText(e) {
  return String(e?.message || e || '').replace(/^FirebaseError:\s*/, '') || '發生錯誤';
}

export function lineAiCall(action, payload = {}) {
  return lineAiApi({ action, ...authPayload(), ...payload });
}

export function lineAiAdminCall(action, payload = {}) {
  return lineAiAdminApi({ action, ...authPayload(), ...payload });
}

// 「10:05」「昨天」「10/12」
export function shortTime(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  const now = new Date();
  const tz = { timeZone: 'Asia/Taipei' };
  const day = x => x.toLocaleDateString('en-CA', tz);
  if (day(d) === day(now)) return d.toLocaleTimeString('zh-TW', { ...tz, hour: '2-digit', minute: '2-digit', hour12: false });
  const y = new Date(now.getTime() - 86400000);
  if (day(d) === day(y)) return '昨天';
  return d.toLocaleDateString('zh-TW', { ...tz, month: 'numeric', day: 'numeric' });
}

export function fullTime(iso) {
  if (!iso) return '';
  return new Date(iso).toLocaleString('zh-TW', { timeZone: 'Asia/Taipei', month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false });
}

export const TYPE_ICON = { group: 'mdi-account-group', room: 'mdi-account-multiple', user: 'mdi-account' };
export const TYPE_LABEL = { group: '群組', room: '多人聊天', user: '一對一' };
