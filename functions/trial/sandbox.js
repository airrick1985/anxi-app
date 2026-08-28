/**
 * =================================================================
 * DEMO 沙盒：範本快照與每日重置
 * =================================================================
 * 規格：docs/SPEC_LandingTrialLeadsOnboarding.md §4.2、§9
 *
 * - snapshotTrialSandbox（onCall）：超管建立／更新範本快照（dryRun 只回筆數）
 * - resetTrialSandbox（onSchedule，每日 04:00 台灣時間）：由快照還原沙盒
 * - resetTrialSandboxNow（onCall）：超管立即重置（強制執行）
 *
 * 快照結構：
 *   trialSandboxTemplates/{collection}/docs/{docId}   各集合文件（docId 保留）
 *   trialSandboxTemplates/projects/docs/{projectId}    DEMO 建案文件本體
 *   trialSandboxTemplates/_users/docs/{accountKey}     試用帳號 preferences
 *   trialSandboxTemplates/_meta                        { snapshotAt, counts }
 */

const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { onSchedule } = require("firebase-functions/v2/scheduler");
const { Firestore, Timestamp } = require("@google-cloud/firestore");
const nodemailer = require("nodemailer");
const { getTrialSettings, assertSuperAdmin } = require("../utils/trialGuard");

const gmailSecrets = ["SENDER_EMAIL", "GMAIL_APP_PASSWORD"];

// 重置失敗時的錯誤通知收件人（與 index.js 的 ADMIN_ERROR_RECIPIENT 相同）
const ADMIN_ERROR_RECIPIENT = "anxismart@gmail.com";

const TEMPLATE_ROOT = "trialSandboxTemplates";
const RESET_LOG_COLLECTION = "trialSandboxResets";
const BATCH_LIMIT = 500;       // Firestore 單批寫入上限
const IN_QUERY_LIMIT = 30;     // Firestore `in` 查詢上限

function getDb() {
  return new Firestore({ databaseId: "anxi-app" });
}

/** 將陣列切成固定大小的區塊 */
function chunk(arr, size) {
  const out = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

/** 台灣時間格式化為 yyyyMMdd_HHmm（作為重置紀錄 docId） */
function taipeiStamp(date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Taipei", year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", hour12: false,
  }).formatToParts(date).reduce((acc, p) => { acc[p.type] = p.value; return acc; }, {});
  return `${parts.year}${parts.month}${parts.day}_${parts.hour === "24" ? "00" : parts.hour}${parts.minute}`;
}

/**
 * 查詢某集合中屬於 DEMO 建案的所有文件（projectId in ids ∪ projectName in names，合併去重）
 * @returns {Promise<Array<{ id: string, ref: FirebaseFirestore.DocumentReference, data: object }>>}
 */
async function queryDemoDocs(db, collection, projectIds, projectNames) {
  const found = new Map();
  const colRef = db.collection(collection);

  const runIn = async (field, values) => {
    for (const group of chunk(values, IN_QUERY_LIMIT)) {
      const snap = await colRef.where(field, "in", group).get();
      snap.forEach(doc => {
        if (!found.has(doc.id)) found.set(doc.id, { id: doc.id, ref: doc.ref, data: doc.data() });
      });
    }
  };

  if (projectIds.length > 0) await runIn("projectId", projectIds);
  if (projectNames.length > 0) await runIn("projectName", projectNames);

  // 部分集合以 projectId 作為文件 ID（如 customerFieldSettings、projectSettings），可能沒有 projectId 欄位
  for (const pid of projectIds) {
    if (found.has(pid)) continue;
    const snap = await colRef.doc(pid).get();
    if (snap.exists) found.set(snap.id, { id: snap.id, ref: snap.ref, data: snap.data() });
  }
  return Array.from(found.values());
}

/** 分批刪除一組 DocumentReference */
async function deleteRefs(db, refs) {
  for (const group of chunk(refs, BATCH_LIMIT)) {
    const batch = db.batch();
    group.forEach(ref => batch.delete(ref));
    await batch.commit();
  }
}

/** 分批寫入（set 覆寫）一組 { ref, data } */
async function setDocs(db, items) {
  for (const group of chunk(items, BATCH_LIMIT)) {
    const batch = db.batch();
    group.forEach(({ ref, data }) => batch.set(ref, data));
    await batch.commit();
  }
}

/** 清空某快照集合底下的所有文件 */
async function clearTemplateCollection(db, collection) {
  const snap = await db.collection(TEMPLATE_ROOT).doc(collection).collection("docs").get();
  await deleteRefs(db, snap.docs.map(d => d.ref));
  return snap.size;
}

/** 讀取某快照集合底下的所有文件 */
async function readTemplateCollection(db, collection) {
  const snap = await db.collection(TEMPLATE_ROOT).doc(collection).collection("docs").get();
  return snap.docs.map(d => ({ id: d.id, data: d.data() }));
}

/** 寄送重置失敗通知信（沿用 index.js sendErrorNotification 的模式；需 gmailSecrets） */
async function sendResetErrorMail(subject, bodyText) {
  try {
    if (!process.env.SENDER_EMAIL || !process.env.GMAIL_APP_PASSWORD) {
      console.error("[sandbox] 未設定寄信 Secret，無法寄送錯誤通知。");
      return;
    }
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: { user: process.env.SENDER_EMAIL, pass: process.env.GMAIL_APP_PASSWORD },
    });
    await transporter.sendMail({
      from: `"ANXI 沙盒重置錯誤通知" <${process.env.SENDER_EMAIL}>`,
      to: ADMIN_ERROR_RECIPIENT,
      subject,
      html: `<pre style="font-family:monospace;white-space:pre-wrap;">${bodyText
        .replace(/&/g, "&amp;").replace(/</g, "&lt;")}</pre>`,
    });
  } catch (err) {
    console.error("[sandbox] 寄送錯誤通知失敗：", err.message);
  }
}

/**
 * 建立／更新範本快照
 * @param {{ dryRun?: boolean }} opts
 * @returns {Promise<{ status: string, counts: object, snapshotAt: Timestamp|null }>}
 */
async function runSnapshot(opts = {}) {
  const functionName = "snapshotTrialSandbox";
  const dryRun = opts.dryRun === true;
  const db = getDb();
  const settings = await getTrialSettings(true);
  const projectIds = (settings.projectIds || []).map(String).filter(Boolean);
  const projectNames = (settings.projectNames || []).map(String).filter(Boolean);
  const collections = settings.sandboxCollections || [];

  if (projectIds.length === 0 && projectNames.length === 0) {
    throw new HttpsError("failed-precondition", "systemSettings/trial 未設定 projectIds／projectNames。");
  }

  const counts = {};

  for (const collection of collections) {
    const docs = await queryDemoDocs(db, collection, projectIds, projectNames);
    counts[collection] = docs.length;
    console.log(`[${functionName}] ${collection}: ${docs.length} 筆${dryRun ? "（dryRun）" : ""}`);
    if (dryRun) continue;

    await clearTemplateCollection(db, collection);
    const tplCol = db.collection(TEMPLATE_ROOT).doc(collection).collection("docs");
    await setDocs(db, docs.map(d => ({ ref: tplCol.doc(d.id), data: d.data })));
    // 標記父文件，方便 console 瀏覽
    await db.collection(TEMPLATE_ROOT).doc(collection).set({ collection, count: docs.length, updatedAt: Timestamp.now() });
  }

  // DEMO 建案文件本體
  const projectDocs = [];
  for (const pid of projectIds) {
    const snap = await db.collection("projects").doc(pid).get();
    if (snap.exists) projectDocs.push({ id: pid, data: snap.data() });
  }
  counts.projects = projectDocs.length;

  // 試用帳號 preferences
  const accountKey = settings.accountKey;
  let userPrefs = null;
  if (accountKey) {
    const userSnap = await db.collection("users").doc(accountKey).get();
    if (userSnap.exists) userPrefs = userSnap.data().preferences || {};
  }
  counts._users = userPrefs ? 1 : 0;

  if (dryRun) {
    return { status: "dry-run", counts, snapshotAt: null };
  }

  await clearTemplateCollection(db, "projects");
  const tplProjects = db.collection(TEMPLATE_ROOT).doc("projects").collection("docs");
  await setDocs(db, projectDocs.map(p => ({ ref: tplProjects.doc(p.id), data: p.data })));
  await db.collection(TEMPLATE_ROOT).doc("projects").set({ collection: "projects", count: projectDocs.length, updatedAt: Timestamp.now() });

  await clearTemplateCollection(db, "_users");
  if (userPrefs) {
    await db.collection(TEMPLATE_ROOT).doc("_users").collection("docs").doc(accountKey)
      .set({ preferences: userPrefs });
  }
  await db.collection(TEMPLATE_ROOT).doc("_users").set({ collection: "_users", count: counts._users, updatedAt: Timestamp.now() });

  const snapshotAt = Timestamp.now();
  await db.collection(TEMPLATE_ROOT).doc("_meta").set({
    snapshotAt, counts, projectIds, projectNames, collections, accountKey: accountKey || null,
  });
  await db.collection("systemSettings").doc("trial").set({ lastSnapshotAt: snapshotAt }, { merge: true });

  console.log(`[${functionName}] 快照完成：`, JSON.stringify(counts));
  return { status: "success", counts, snapshotAt };
}

/**
 * 由快照還原沙盒（排程與手動共用）
 * @param {{ trigger: 'schedule'|'manual', force?: boolean }} opts
 */
async function runReset(opts = {}) {
  const functionName = "resetTrialSandbox";
  const trigger = opts.trigger || "manual";
  const force = opts.force === true;
  const db = getDb();
  const settings = await getTrialSettings(true);

  if (settings.resetEnabled !== true && !force) {
    console.log(`[${functionName}] resetEnabled 未開啟，跳過。`);
    return { status: "skipped", reason: "resetEnabled=false" };
  }

  const metaSnap = await db.collection(TEMPLATE_ROOT).doc("_meta").get();
  if (!metaSnap.exists) {
    throw new HttpsError("failed-precondition", "尚未建立範本快照");
  }
  const meta = metaSnap.data() || {};

  // 以「目前設定」的建案條件刪除、以快照中記錄的集合清單還原
  const projectIds = (settings.projectIds || []).map(String).filter(Boolean);
  const projectNames = (settings.projectNames || []).map(String).filter(Boolean);
  const collections = Array.isArray(meta.collections) && meta.collections.length > 0
    ? meta.collections
    : (settings.sandboxCollections || []);

  const startedAt = Timestamp.now();
  const counts = {};
  const errors = [];

  for (const collection of collections) {
    try {
      // (1) 刪除目前 DEMO 條件下的所有文件
      const current = await queryDemoDocs(db, collection, projectIds, projectNames);
      await deleteRefs(db, current.map(d => d.ref));

      // (2) 由快照寫回（docId 保留）
      const templates = await readTemplateCollection(db, collection);
      const colRef = db.collection(collection);
      await setDocs(db, templates.map(t => ({ ref: colRef.doc(t.id), data: t.data })));

      counts[collection] = { deleted: current.length, restored: templates.length };
      console.log(`[${functionName}] ${collection}: 刪除 ${current.length}、還原 ${templates.length}`);
    } catch (err) {
      console.error(`[${functionName}] 集合 ${collection} 還原失敗：`, err);
      errors.push({ collection, error: err.message || String(err) });
    }
  }

  // (3) 還原 DEMO 建案文件本體
  try {
    const projectTemplates = await readTemplateCollection(db, "projects");
    await setDocs(db, projectTemplates.map(t => ({ ref: db.collection("projects").doc(t.id), data: t.data })));
    counts.projects = { restored: projectTemplates.length };
  } catch (err) {
    console.error(`[${functionName}] projects 還原失敗：`, err);
    errors.push({ collection: "projects", error: err.message || String(err) });
  }

  // (4) 還原試用帳號 preferences
  try {
    const userTemplates = await readTemplateCollection(db, "_users");
    for (const t of userTemplates) {
      await db.collection("users").doc(t.id).set({ preferences: t.data.preferences || {} }, { merge: true });
    }
    counts._users = { restored: userTemplates.length };
  } catch (err) {
    console.error(`[${functionName}] users preferences 還原失敗：`, err);
    errors.push({ collection: "_users", error: err.message || String(err) });
  }

  const finishedAt = Timestamp.now();
  const logId = taipeiStamp(new Date());
  await db.collection(RESET_LOG_COLLECTION).doc(logId).set({
    startedAt, finishedAt, counts, errors, trigger,
    snapshotAt: meta.snapshotAt || null,
    status: errors.length === 0 ? "success" : "partial",
  });
  await db.collection("systemSettings").doc("trial").set({ lastResetAt: finishedAt }, { merge: true });

  if (errors.length > 0) {
    await sendResetErrorMail(
      `【緊急】DEMO 沙盒重置部分失敗（${logId}）`,
      `觸發方式：${trigger}\n開始：${startedAt.toDate().toLocaleString("zh-TW", { timeZone: "Asia/Taipei" })}\n` +
      `錯誤：\n${JSON.stringify(errors, null, 2)}\n\n筆數：\n${JSON.stringify(counts, null, 2)}`,
    );
  }

  console.log(`[${functionName}] 重置完成（${trigger}）：`, JSON.stringify(counts), errors.length ? `錯誤 ${errors.length} 筆` : "");
  return { status: errors.length === 0 ? "success" : "partial", counts, errors, logId };
}

/** 超管：建立／更新範本快照（dryRun 只回各集合筆數） */
exports.snapshotTrialSandbox = onCall({
  region: "asia-east1",
  memory: "512MiB",
  timeoutSeconds: 540,
}, async (request) => {
  const { operatorKey, dryRun } = request.data || {};
  const db = getDb();
  await assertSuperAdmin(db, operatorKey);
  try {
    return await runSnapshot({ dryRun: dryRun === true });
  } catch (error) {
    console.error("[snapshotTrialSandbox] 失敗：", error);
    if (error instanceof HttpsError) throw error;
    throw new HttpsError("internal", `建立快照失敗：${error.message}`);
  }
});

/** 排程：每日台灣時間 04:00 重置沙盒 */
exports.resetTrialSandbox = onSchedule({
  schedule: "0 4 * * *",
  timeZone: "Asia/Taipei",
  region: "asia-east1",
  memory: "512MiB",
  timeoutSeconds: 540,
  secrets: gmailSecrets,
}, async () => {
  try {
    await runReset({ trigger: "schedule" });
  } catch (error) {
    console.error("[resetTrialSandbox] 排程重置失敗：", error);
    await sendResetErrorMail(
      "【緊急】DEMO 沙盒排程重置失敗",
      `時間：${new Date().toLocaleString("zh-TW", { timeZone: "Asia/Taipei" })}\n錯誤：${error.message}\n${error.stack || ""}`,
    );
  }
});

/** 超管：立即重置（強制執行，不受 resetEnabled 影響） */
exports.resetTrialSandboxNow = onCall({
  region: "asia-east1",
  memory: "512MiB",
  timeoutSeconds: 540,
  secrets: gmailSecrets,
}, async (request) => {
  const { operatorKey } = request.data || {};
  const db = getDb();
  await assertSuperAdmin(db, operatorKey);
  try {
    return await runReset({ trigger: "manual", force: true });
  } catch (error) {
    console.error("[resetTrialSandboxNow] 失敗：", error);
    if (error instanceof HttpsError) throw error;
    throw new HttpsError("internal", `重置沙盒失敗：${error.message}`);
  }
});

// 供測試／其他模組重用
exports.runSnapshot = runSnapshot;
exports.runReset = runReset;
