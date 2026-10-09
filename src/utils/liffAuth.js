import liff from '@line/liff';

export function withLiffTimeout(promise, message = 'LINE 驗證逾時，請確認網路後重試。', ms = 15000) {
  let timer;
  return Promise.race([
    promise,
    new Promise((_, reject) => { timer = setTimeout(() => reject(new Error(message)), ms); }),
  ]).finally(() => clearTimeout(timer));
}

let initialization;
let initializedId;
export function initializeLiff(liffId) {
  if (!initialization || initializedId !== liffId) {
    initializedId = liffId;
    const attempt = withLiffTimeout(liff.init({ liffId }));
    initialization = attempt;
    // 失敗不留快取，頁面「重試」才會真的重新初始化
    attempt.catch(() => { if (initialization === attempt) initialization = null; });
  }
  return initialization;
}

export function getLiffAccessToken() {
  const token = liff.getAccessToken();
  if (!token) throw new Error('LINE 登入已失效，請重新從通知開啟。');
  return token;
}


// 同一分頁內，token 失效觸發的「登出→重新登入」只做一次，避免無限轉址迴圈
const RELOGIN_KEY = 'anxi-liff-relogin-at';
const RELOGIN_WINDOW_MS = 2 * 60 * 1000;

const readRelogin = () => {
  try { return Number(sessionStorage.getItem(RELOGIN_KEY) || 0); } catch (e) { return 0; }
};
const hasRecentRelogin = () => Date.now() - readRelogin() < RELOGIN_WINDOW_MS;
const markRelogin = () => { try { sessionStorage.setItem(RELOGIN_KEY, String(Date.now())); } catch (e) { /* ignore */ } };
const clearRelogin = () => { try { sessionStorage.removeItem(RELOGIN_KEY); } catch (e) { /* ignore */ } };

/** 是否為 LIFF access token 失效類錯誤（被撤銷／過期／401） */
export function isLiffTokenError(err) {
  const code = String(err?.code || '').toUpperCase();
  const msg = String(err?.message || '').toLowerCase();
  return code === 'UNAUTHORIZED' || /revoked|expired|invalid.*token|401/.test(msg);
}

/**
 * 建立不含 hash 的 LINE 登入回跳網址。
 * LINE Login 的 OAuth 轉址會遺失 hash route 內的 query（例如 #/contact?id=...），
 * 改以 ?liff_path=contact?id=... 帶回，登入完成後由 App.vue 依 liff_path 導向正確路由。
 */
export function buildLiffRedirectUri(routePath) {
  const path = String(routePath || '').replace(/^\/+/, '');
  const url = new URL('/', window.location.origin);
  url.searchParams.set('liff_path', path);
  return url.toString();
}

const doLogin = (redirectUri, onBeforeLogin) => {
  if (typeof onBeforeLogin === 'function') {
    try { onBeforeLogin(); } catch (e) { /* ignore */ }
  }
  liff.login(redirectUri ? { redirectUri } : undefined);
};

const doRelogin = (redirectUri, onBeforeLogin) => {
  markRelogin();
  try { liff.logout(); } catch (e) { /* ignore */ }
  doLogin(redirectUri, onBeforeLogin);
};

/**
 * 初始化 LIFF 並確保已登入。
 * - token 已失效（撤銷／過期）→ 登出後重新登入一次
 * - 尚未登入 → 轉址登入
 * 回傳 true 表示可繼續；false 表示已觸發轉址，呼叫端應直接 return。
 */
export async function initLiffAndEnsureLogin(liffId, { redirectUri, onBeforeLogin } = {}) {
  try {
    await initializeLiff(liffId);
  } catch (err) {
    if (isLiffTokenError(err) && !hasRecentRelogin()) {
      console.warn('[LIFF] token 失效，重新登入:', err?.message);
      doRelogin(redirectUri, onBeforeLogin);
      return false;
    }
    throw err;
  }

  if (!liff.isLoggedIn()) {
    if (hasRecentRelogin()) throw new Error('LINE 登入尚未完成，請重新從 LINE 通知開啟。');
    markRelogin();
    doLogin(redirectUri, onBeforeLogin);
    return false;
  }
  return true;
}

/**
 * 取得 LINE profile；若 token 失效（401）則登出重登一次。
 * 回傳 profile；回傳 null 表示已觸發轉址，呼叫端應直接 return。
 */
export async function getLiffProfileOrRelogin({ redirectUri, onBeforeLogin } = {}) {
  try {
    const profile = await withLiffTimeout(liff.getProfile());
    clearRelogin();
    return profile;
  } catch (err) {
    if (isLiffTokenError(err) && !hasRecentRelogin()) {
      console.warn('[LIFF] 取得 profile 失敗，重新登入:', err?.message);
      doRelogin(redirectUri, onBeforeLogin);
      return null;
    }
    throw err;
  }
}
