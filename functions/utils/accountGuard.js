/**
 * =================================================================
 * 帳號停用守衛
 * =================================================================
 * 人員管理可一鍵停用帳號（users/{key}.disabled === true）。本專案未使用 Firebase Auth，
 * 操作者身分由前端帶入的手機號碼表示，所以在 Cloud Function 入口統一擋下已停用的操作者。
 *
 * - `onCall`：取代 firebase-functions 的 onCall，執行前先檢查操作者是否停用
 * - `assertAccountActive(key)`：單一帳號檢查，停用則丟 permission-denied
 * - `isAccountDisabled(key)`：只回傳是否停用
 *
 * 操作者欄位：有 adminKey／operatorKey／operatorPhone／requestingUserKey 時只看這些
 * （此時 userKey、targetUserKey 可能是被操作的對象）；否則看 userKey。
 * 路由型函式的參數包在 data／payload 內，往下再找一層。
 *
 * 守衛本身查詢失敗時放行，避免資料庫暫時異常讓所有人都不能用。
 */

const { onCall: baseOnCall, HttpsError } = require("firebase-functions/v2/https");

const DISABLED_MESSAGE = "此帳號已停用，請聯絡管理員。";
const DISABLED_REASON = "account-disabled";
// 被停用後暫存的 LINE ID 欄位：停用期間 lineId 移到這裡，所有以 lineId 查人的功能自然失效
const SUSPENDED_LINE_FIELD = "lineIdDisabled";

const OPERATOR_FIELDS = ["adminKey", "operatorKey", "operatorPhone", "requestingUserKey"];
const SELF_FIELDS = ["userKey"];
const NESTED_FIELDS = ["data", "payload"];

// 只快取「啟用中」的結果；停用的結果不快取，重新啟用後立即生效
const ACTIVE_TTL_MS = 30 * 1000;
const MAX_CACHE_SIZE = 2000;
const activeCache = new Map();

let cachedDb = null;
function getDb() {
  if (!cachedDb) {
    const { Firestore } = require("@google-cloud/firestore");
    cachedDb = new Firestore({ databaseId: "anxi-app" });
  }
  return cachedDb;
}

function disabledError() {
  return new HttpsError("permission-denied", DISABLED_MESSAGE, { reason: DISABLED_REASON });
}

function normalizeKey(value) {
  if (typeof value !== "string" && typeof value !== "number") return "";
  const key = String(value).trim();
  // Firestore 文件 ID 不可含斜線；過長的值不會是手機號碼
  if (!key || key.length > 64 || key.includes("/") || key === "." || key === "..") return "";
  return key;
}

function pickKeys(source, fields) {
  if (!source || typeof source !== "object") return [];
  return fields.map(field => normalizeKey(source[field])).filter(Boolean);
}

/** 從呼叫參數找出操作者的帳號 */
function actorKeysOf(data) {
  if (!data || typeof data !== "object") return [];
  const sources = [data, ...NESTED_FIELDS.map(field => data[field]).filter(v => v && typeof v === "object" && !Array.isArray(v))];
  const operators = sources.flatMap(source => pickKeys(source, OPERATOR_FIELDS));
  const keys = operators.length ? operators : sources.flatMap(source => pickKeys(source, SELF_FIELDS));
  return [...new Set(keys)];
}

async function isAccountDisabled(key, db) {
  const userKey = normalizeKey(key);
  if (!userKey) return false;
  const cachedUntil = activeCache.get(userKey);
  if (cachedUntil && cachedUntil > Date.now()) return false;
  const snap = await (db || getDb()).collection("users").doc(userKey).get();
  const disabled = snap.exists && snap.data()?.disabled === true;
  if (disabled) {
    activeCache.delete(userKey);
  } else {
    if (activeCache.size >= MAX_CACHE_SIZE) activeCache.clear();
    activeCache.set(userKey, Date.now() + ACTIVE_TTL_MS);
  }
  return disabled;
}

async function assertAccountActive(key, db) {
  if (await isAccountDisabled(key, db)) throw disabledError();
}

/** 帳號狀態變更後清掉快取，讓同一個執行個體立即套用 */
function forgetAccount(key) {
  activeCache.delete(normalizeKey(key));
}

async function assertActorActive(data) {
  const keys = actorKeysOf(data);
  if (!keys.length) return;
  let flags;
  try {
    flags = await Promise.all(keys.map(key => isAccountDisabled(key)));
  } catch (error) {
    console.error("[accountGuard] 檢查帳號狀態失敗，本次放行:", error?.message || error);
    return;
  }
  if (flags.some(Boolean)) throw disabledError();
}

/** 取代 firebase-functions/v2/https 的 onCall：先檢查操作者是否停用 */
function onCall(optsOrHandler, maybeHandler) {
  const hasOptions = typeof optsOrHandler !== "function";
  const handler = hasOptions ? maybeHandler : optsOrHandler;
  const guarded = async (request, response) => {
    await assertActorActive(request?.data);
    return handler(request, response);
  };
  return hasOptions ? baseOnCall(optsOrHandler, guarded) : baseOnCall(guarded);
}

module.exports = {
  onCall,
  assertAccountActive,
  assertActorActive,
  isAccountDisabled,
  forgetAccount,
  actorKeysOf,
  disabledError,
  DISABLED_MESSAGE,
  DISABLED_REASON,
  SUSPENDED_LINE_FIELD,
};
