/**
 * =================================================================
 * 試用沙盒（DEMO 建案）對外通知守衛
 * =================================================================
 * 規格：docs/SPEC_LandingTrialLeadsOnboarding.md §4.1、§9
 *
 * - `getTrialSettings()`：讀 `systemSettings/trial`（記憶體快取 5 分鐘）
 * - `isTrialProject(idOrName)`：blockOutbound 開啟且 id／名稱命中 → true
 * - `guardedSendMail(transport, mailOptions, { projectId, force })`：命中則不寄信
 * - `shouldBlockOutbound(projectId, type)`：泛用判斷（LINE／簡訊用）
 *
 * 守衛命中時一律「視同成功」回傳，不改變呼叫端既有流程。
 */

const { Firestore } = require("@google-cloud/firestore");

// 快取有效時間（毫秒）
const CACHE_TTL_MS = 5 * 60 * 1000;

// 沙盒集合預設清單（規格 §4.2）
const DEFAULT_SANDBOX_COLLECTIONS = [
  "households", "appointments", "leads", "vipGuests", "contactLogs", "calendarNotes",
  "salesHouseholds", "salesParkings", "salesParameters", "salesSVGs", "salesImages",
  "parkingFloorPlans", "parkingSpotLayouts", "inspectionRecords", "inspectionOptions",
  "cancelledPurchases", "bookingBatches", "batchRuleLinks", "dateRules", "timeSlotRules",
  "activityMessages", "customFormTemplates", "customerFieldSettings", "projectSettings",
  "retentionPayouts", "bonusRecords", "commissionRecords", "commissionUnitLedgers",
];

// `systemSettings/trial` 文件不存在時使用的預設值（規格 §9）
const DEFAULT_TRIAL_SETTINGS = Object.freeze({
  enabled: true,
  accountKey: "TESTA",
  password: "TESTA",
  projectIds: ["TESTA"],
  projectNames: ["測試建案A"],
  blockOutbound: true,
  resetEnabled: true,
  sandboxCollections: DEFAULT_SANDBOX_COLLECTIONS,
});

let _db = null;
let _cache = null;        // 快取的設定物件
let _cacheAt = 0;         // 快取建立時間（ms）

function getDb() {
  if (!_db) _db = new Firestore({ databaseId: "anxi-app" });
  return _db;
}

/**
 * 讀取試用設定（含 5 分鐘記憶體快取）。
 * 文件不存在時回傳 DEFAULT_TRIAL_SETTINGS；存在時以文件值覆蓋預設值。
 * @param {boolean} [forceRefresh=false] 是否略過快取重新讀取
 * @returns {Promise<object>}
 */
async function getTrialSettings(forceRefresh = false) {
  const now = Date.now();
  if (!forceRefresh && _cache && now - _cacheAt < CACHE_TTL_MS) {
    return _cache;
  }
  try {
    const snap = await getDb().collection("systemSettings").doc("trial").get();
    if (snap.exists) {
      const data = snap.data() || {};
      _cache = {
        ...DEFAULT_TRIAL_SETTINGS,
        ...data,
        projectIds: Array.isArray(data.projectIds) ? data.projectIds : DEFAULT_TRIAL_SETTINGS.projectIds,
        projectNames: Array.isArray(data.projectNames) ? data.projectNames : DEFAULT_TRIAL_SETTINGS.projectNames,
        sandboxCollections: Array.isArray(data.sandboxCollections) && data.sandboxCollections.length > 0
          ? data.sandboxCollections
          : DEFAULT_SANDBOX_COLLECTIONS,
      };
    } else {
      _cache = { ...DEFAULT_TRIAL_SETTINGS };
    }
    _cacheAt = now;
  } catch (err) {
    // 讀取失敗時：若已有舊快取就沿用，否則採預設值；不讓守衛本身造成通知流程失敗
    console.error("[TrialGuard] 讀取 systemSettings/trial 失敗，改用預設值：", err.message);
    if (!_cache) {
      _cache = { ...DEFAULT_TRIAL_SETTINGS };
      _cacheAt = now;
    }
  }
  return _cache;
}

/** 清除快取（測試或設定變更後可呼叫） */
function clearTrialSettingsCache() {
  _cache = null;
  _cacheAt = 0;
}

/**
 * 判斷是否為試用（DEMO）建案。
 * 條件：blockOutbound === true 且 projectId 或 projectName 命中設定清單。
 * @param {string} projectIdOrName 建案 ID 或建案名稱
 * @returns {Promise<boolean>}
 */
async function isTrialProject(projectIdOrName) {
  if (projectIdOrName === undefined || projectIdOrName === null || projectIdOrName === "") return false;
  const settings = await getTrialSettings();
  if (settings.blockOutbound !== true) return false;
  const key = String(projectIdOrName);
  const ids = (settings.projectIds || []).map(String);
  const names = (settings.projectNames || []).map(String);
  return ids.includes(key) || names.includes(key);
}

/**
 * 泛用對外通知封鎖判斷（LINE／簡訊／其他）。
 * 命中時輸出 log `[TrialGuard] blocked {type} for {projectId}` 並回傳 true。
 * @param {string} projectId 建案 ID（或名稱）
 * @param {string} type 通知類型，例如 'line' | 'sms' | 'email'
 * @returns {Promise<boolean>} true 表示應封鎖（不要送出）
 */
async function shouldBlockOutbound(projectId, type = "outbound") {
  try {
    const hit = await isTrialProject(projectId);
    if (hit) {
      console.log(`[TrialGuard] blocked ${type} for ${projectId}`);
    }
    return hit;
  } catch (err) {
    console.error("[TrialGuard] shouldBlockOutbound 判斷失敗，預設放行：", err.message);
    return false;
  }
}

/**
 * 帶守衛的寄信。命中試用建案則不寄、回傳 { blocked: true }；否則實際呼叫 transport.sendMail。
 * @param {object} transport nodemailer transporter
 * @param {object} mailOptions nodemailer mailOptions
 * @param {{ projectId?: string, force?: boolean }} [opts]
 * @returns {Promise<object>} sendMail 的結果或 { blocked: true }
 */
async function guardedSendMail(transport, mailOptions, opts = {}) {
  const { projectId, force } = opts || {};
  if (force !== true && projectId) {
    const hit = await isTrialProject(projectId);
    if (hit) {
      console.log(`[TrialGuard] blocked email for ${projectId}`);
      return { blocked: true, projectId, accepted: [], rejected: [] };
    }
  }
  return transport.sendMail(mailOptions);
}

/**
 * 驗證 operatorKey 是否為超級管理員；不是則拋出 HttpsError。
 * @param {Firestore} db
 * @param {string} operatorKey users 文件 ID（手機）
 * @returns {Promise<object>} 使用者資料
 */
async function assertSuperAdmin(db, operatorKey) {
  const { HttpsError } = require("firebase-functions/v2/https");
  if (!operatorKey || typeof operatorKey !== "string") {
    throw new HttpsError("unauthenticated", "缺少操作者識別碼（operatorKey）。");
  }
  const snap = await (db || getDb()).collection("users").doc(operatorKey).get();
  if (!snap.exists) {
    throw new HttpsError("permission-denied", "無效的操作者，請重新登入。");
  }
  const data = snap.data() || {};
  const roles = Array.isArray(data.roles) ? data.roles : [];
  if (!roles.includes("超級管理員")) {
    throw new HttpsError("permission-denied", "權限不足：僅限超級管理員操作。");
  }
  return { key: operatorKey, ...data };
}

module.exports = {
  assertSuperAdmin,
  DEFAULT_SANDBOX_COLLECTIONS,
  DEFAULT_TRIAL_SETTINGS,
  getTrialSettings,
  clearTrialSettingsCache,
  isTrialProject,
  shouldBlockOutbound,
  guardedSendMail,
};
