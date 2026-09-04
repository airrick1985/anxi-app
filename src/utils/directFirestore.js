/**
 * 「前端直讀 Firestore，失敗退回 Cloud Function」共用工具
 *
 * 純查詢類的資料（沒有權限判斷、不用秘鑰）直接從前端讀 Firestore，可以省掉一次
 * 可能冷啟動的 Cloud Function 往返，也能吃到 Firestore 本機持久化快取。
 * 若安全規則不允許（permission-denied）就退回原本的 Cloud Function，並在本次 session 記住，
 * 之後同一種讀取不再嘗試直讀（避免每次都先失敗一次才退回）。
 */
const deniedKeys = new Set();

const isPermissionDenied = (e) => {
  const code = e?.code || '';
  return code === 'permission-denied' || code === 'firestore/permission-denied' || /permission/i.test(e?.message || '');
};

/**
 * @param {string} key 直讀類型識別（例如 'appointments'），同 key 一旦被拒就不再直讀
 * @param {() => Promise<any>} directFn 直讀 Firestore
 * @param {() => Promise<any>} fallbackFn 退回 Cloud Function
 */
export async function withDirectFallback(key, directFn, fallbackFn) {
  if (!deniedKeys.has(key)) {
    try {
      return await directFn();
    } catch (e) {
      if (isPermissionDenied(e)) {
        deniedKeys.add(key);
        console.warn(`[directFirestore] ${key} 直讀被安全規則拒絕，本次 session 改走 Cloud Function`);
      } else {
        console.warn(`[directFirestore] ${key} 直讀失敗，改走 Cloud Function:`, e?.message || e);
      }
    }
  }
  return fallbackFn();
}

export function isDirectDenied(key) {
  return deniedKeys.has(key);
}

export function markDirectDenied(key) {
  deniedKeys.add(key);
}
