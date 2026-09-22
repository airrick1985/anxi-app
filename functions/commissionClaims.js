/**
 * 請佣獎金系統 後端（docs/請佣獎金系統-spec.md）
 *
 * - submitCommissionEntries：送出請佣（transaction 驗證比例上限＋伺服器端重算金額）；同批可含「退佣」（買方解約）
 * - voidCommissionRecord：作廢請佣紀錄（比例回溯、關聯獎金明細連動作廢）；作廢退佣紀錄會連動還原原紀錄
 * - importCommissionHistory：歷史資料批次匯入（source: 'import'，帶 importBatchId；可先整期作廢再覆蓋）
 * - voidCommissionPeriod：整期作廢（該期全部有效紀錄比例回溯＋獎金明細連動作廢）
 * - purgeVoidedCommissionPeriod：清除該期「已作廢」的請佣紀錄與獎金明細（實體刪除）
 * - undoCommissionImport：撤銷一次歷史匯入（依 importBatchId 回溯比例並實體刪除）
 * - 以上破壞性操作皆需 operatorKey 通過權限檢查，並寫入 commissionAuditLogs 稽核紀錄
 * - generateCommissionPdf：請佣總表 / 獎金表 / 個人獎金明細 PDF 產製（個人明細可加密）
 * - sendCommissionPersonEmail：個人獎金明細 PDF 以 Email 寄送給指定人員
 *
 * 比例累計以各方案的 commissionUnitLedgers 為準（一般方案沿用 {projectId}_{unitId}）（transaction 內讀寫，防並發超額）。
 */

const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { Firestore, FieldValue } = require("@google-cloud/firestore");
const { formatInTimeZone } = require("date-fns-tz");
const nodemailer = require("nodemailer");
const calc = require("./utils/commissionCalculation");
const { DEFAULT_PLANS, planIdOf, planDocumentId, commissionLedgerId, computePlanFinance } = require("./utils/commissionPlans");

// 請佣備註（工作台／匯入填寫，非銷控備註），匯出總表顯示。
function noteOf_(value) {
  return String(value ?? '').trim().slice(0, 200);
}
function requestPlanId_(request) {
  const id = request.data?.planId ?? 'general';
  if (typeof id !== 'string' || !/^[a-zA-Z0-9_-]{1,80}$/.test(id)) {
    throw new HttpsError('invalid-argument', '請佣方案識別不正確。');
  }
  return id;
}
// 一般方案包含尚未補 planId 的舊紀錄，不可僅用 where(planId == general)。
async function planRows_(query, planId) {
  const snap = await query.get();
  const docs = snap.docs.filter(d => planIdOf(d.data()) === planId);
  return { docs, size: docs.length, empty: docs.length === 0 };
}
function planFromSnapshot_(snap, projectId, planId) {
  const saved = snap.exists ? snap.data() : null;
  const builtIn = DEFAULT_PLANS.find(p => p.id === planId);
  if (saved?.deletedAt || (!saved && !builtIn) || (saved && saved.projectId !== projectId)) {
    throw new HttpsError('failed-precondition', '找不到此建案的請佣方案，可能已刪除，請重新載入。');
  }
  const plan = { ...builtIn, ...saved, ...(builtIn ? { priceBasis: builtIn.priceBasis } : {}), id: planId };
  if (!['house', 'package'].includes(plan.priceBasis)) throw new HttpsError('invalid-argument', '請佣方案價格來源不正確。');
  return plan;
}
async function loadPlan_(db, projectId, planId) {
  const snap = await db.collection('commissionPlans').doc(planDocumentId(projectId, planId)).get();
  return planFromSnapshot_(snap, projectId, planId);
}
async function markPlanUsed_(db, projectId, planId, expected) {
  const ref = db.collection('commissionPlans').doc(planDocumentId(projectId, planId));
  await db.runTransaction(async tx => {
    const live = planFromSnapshot_(await tx.get(ref), projectId, planId);
    if (live.priceBasis !== expected.priceBasis) throw new HttpsError('failed-precondition', '方案價格來源已變更，請重新載入後重試。');
    tx.set(ref, { projectId, planId, name: live.name, priceBasis: live.priceBasis, used: true }, { merge: true });
  });
}

const REGION = "asia-east1";
const DB_ID = "anxi-app";

function db_() {
  return new Firestore({ databaseId: DB_ID });
}

function nowStamp_() {
  return formatInTimeZone(new Date(), "Asia/Taipei", "yyyyMMddHHmmss");
}

function rand3_() {
  return String(Math.floor(Math.random() * 900) + 100);
}

function ledgerId_(projectId, unitId, planId) {
  return commissionLedgerId(projectId, unitId, planId);
}

/**
 * 破壞性操作的權限檢查（本系統未使用 Firebase Auth，operatorKey 由前端帶入使用者 key）。
 * 通過條件：users.roles 含「超級管理員/系統管理員」，或 userPermissions[projectId].systems 含「銷控系統」。
 */
async function ensureManagePermission_(db, operatorKey, projectId, allowedSystems = ['銷控系統']) {
  if (!operatorKey) throw new HttpsError("unauthenticated", "缺少操作者識別（operatorKey）。");
  const userSnap = await db.collection("users").doc(String(operatorKey)).get();
  if (!userSnap.exists) throw new HttpsError("permission-denied", "找不到對應使用者資料。");
  const roles = userSnap.data().roles || [];
  if (roles.includes("超級管理員") || roles.includes("系統管理員")) return;
  const permSnap = await db.collection("userPermissions").doc(String(operatorKey)).get();
  const permissions = permSnap.exists ? (permSnap.data().permissions || {}) : {};
  const systems = permissions[projectId]?.systems || [];
  if (!allowedSystems.some(system => systems.includes(system))) {
    throw new HttpsError("permission-denied", "您沒有此建案的管理權限，無法執行此操作。");
  }
}

/** 方案 CRUD：名稱可修改；已有歷史資料時保留價格來源與方案，避免帳務失去歸屬。 */
exports.manageCommissionPlan = onCall({ region: REGION, timeoutSeconds: 60, memory: '256MiB' }, async request => {
  const planId = requestPlanId_(request);
  const { projectId, operation, name, priceBasis, operatorKey, operatorName } = request.data || {};
  if (!projectId || !['create', 'update', 'delete'].includes(operation)) throw new HttpsError('invalid-argument', '缺少建案或方案操作。');
  const cleanName = String(name || '').trim();
  if (operation !== 'delete' && (!cleanName || cleanName.length > 30 || !['house', 'package'].includes(priceBasis))) {
    throw new HttpsError('invalid-argument', '請填寫 1～30 字的方案名稱及有效價格來源。');
  }
  const db = db_();
  await ensureManagePermission_(db, operatorKey, projectId, ['請佣獎金', '銷控系統']);
  const ref = db.collection('commissionPlans').doc(planDocumentId(projectId, planId));
  const builtIn = DEFAULT_PLANS.find(p => p.id === planId);
  await db.runTransaction(async tx => {
    const snap = await tx.get(ref);
    if (operation === 'create' && (snap.exists || builtIn)) throw new HttpsError('already-exists', '此方案已存在，請重新載入。');
    const current = operation === 'create' ? null : planFromSnapshot_(snap, projectId, planId);
    if (builtIn && (operation === 'delete' || priceBasis !== builtIn.priceBasis)) {
      throw new HttpsError('failed-precondition', '內建方案可修改名稱，但不能刪除或更換價格來源。');
    }
    const definitionSnap = await tx.get(db.collection('commissionPlans').where('projectId', '==', projectId));
    const definitions = new Map(DEFAULT_PLANS.map(p => [p.id, p]));
    definitionSnap.docs.forEach(d => definitions.set(d.data().planId, { ...d.data(), id: d.data().planId }));
    if (operation !== 'delete' && [...definitions.values()].some(p => p.id !== planId && !p.deletedAt && p.name === cleanName)) {
      throw new HttpsError('already-exists', '已有同名請佣方案，請使用不同名稱。');
    }
    if (current && (operation === 'delete' || priceBasis !== current.priceBasis)) {
      // 連已作廢／匯入的歷史紀錄都保護；讀取與定義寫入同一 transaction。
      const related = await Promise.all(['commissionRecords', 'bonusRecords', 'commissionUnitLedgers', 'retentionPayouts'].map(async collection => {
        const rows = await tx.get(db.collection(collection).where('projectId', '==', projectId));
        return rows.docs.some(d => planIdOf(d.data()) === planId);
      }));
      if (current.used || related.some(Boolean)) throw new HttpsError('failed-precondition', '此方案已有請佣、獎金或保留款紀錄，可修改名稱，但不能刪除或更換價格來源。');
    }
    const changed = { projectId, planId, updatedAt: FieldValue.serverTimestamp(), updatedBy: String(operatorName || '') };
    if (operation === 'delete') {
      // 保留刪除標記，拒絕仍使用舊方案 ID 的請佣；相關版型／設定不連帶清除。
      tx.set(ref, { ...changed, name: current.name, priceBasis: current.priceBasis, deletedAt: FieldValue.serverTimestamp() }, { merge: true });
    } else {
      tx.set(ref, { ...changed, name: cleanName, priceBasis, ...(operation === 'create' ? { createdAt: FieldValue.serverTimestamp() } : {}) }, { merge: true });
    }
  });
  await writeAudit_(db, { projectId, planId, action: `plan:${operation}`, operator: String(operatorName || ''), operatorKey: String(operatorKey) });
  return { ok: true, planId };
});

/** 寫入稽核紀錄 commissionAuditLogs */
async function writeAudit_(db, entry) {
  await db.collection("commissionAuditLogs").add({
    ...entry,
    createdAt: FieldValue.serverTimestamp(),
  });
}

/** 該期別是否已有保留款發還登記（periods 可能存數字或字串） */
async function findRetentionPayoutsForPeriod_(db, projectId, period, planId) {
  const col = db.collection("retentionPayouts").where("projectId", "==", projectId);
  const [a, b] = await Promise.all([
    col.where("periods", "array-contains", Number(period)).get(),
    col.where("periods", "array-contains", String(period)).get(),
  ]);
  const map = new Map();
  [...a.docs, ...b.docs].forEach(d => map.set(d.id, { id: d.id, ...d.data() }));
  return Array.from(map.values()).filter(row => planIdOf(row) === planId);
}

/** 分批 commit（每批最多 450 筆） */
function batcher_(db) {
  let batch = db.batch();
  let ops = 0;
  return {
    async add(fn) {
      fn(batch); ops++;
      if (ops >= 450) { await batch.commit(); batch = db.batch(); ops = 0; }
    },
    async flush() {
      if (ops > 0) { await batch.commit(); batch = db.batch(); ops = 0; }
    },
  };
}

/**
 * 整期作廢核心：該期所有 active 請佣紀錄 → voided、每戶 ledger 回溯、獎金明細連動作廢。
 * 回傳 { records, bonuses, units: [{unitId, before, after, ratioPct}] }
 */
async function voidPeriodCore_(db, projectId, period, { reason, by }, planId) {
  const p = Number(period);
  const recSnap = await planRows_(db.collection("commissionRecords")
    .where("projectId", "==", projectId).where("period", "==", p).where("status", "==", "active"), planId);
  const recs = recSnap.docs.map(d => ({ id: d.id, ref: d.ref, ...d.data() }));
  if (!recs.length) return { records: 0, bonuses: 0, units: [] };

  // 期內原紀錄若已被「其他期」的退佣紀錄退回 → 需先作廢該退佣紀錄
  const inPeriod = new Set(recs.map(r => r.id));
  const blocked = recs.filter(r => r.refundedBy && !inPeriod.has(String(r.refundedBy)));
  if (blocked.length) {
    throw new HttpsError("failed-precondition",
      `${blocked.map(r => r.unitId).join("、")} 已於其他期別退佣，請先作廢對應的退佣紀錄再整期作廢。`);
  }

  const rollback = {};
  recs.forEach(r => { rollback[r.unitId] = (rollback[r.unitId] || 0) + calc.toNum(r.ratioPct); });
  const unitIds = Object.keys(rollback);
  const units = [];

  await db.runTransaction(async (tx) => {
    const ledgerRefs = unitIds.map(u => db.collection("commissionUnitLedgers").doc(ledgerId_(projectId, u, planId)));
    const ledgerSnaps = await Promise.all(ledgerRefs.map(ref => tx.get(ref)));
    // 再次確認紀錄仍為 active（避免並發重複回溯）
    const recSnaps = await Promise.all(recs.map(r => tx.get(r.ref)));
    const stillActive = recSnaps.filter(sn => sn.exists && sn.data().status === "active");
    const rb = {};
    stillActive.forEach(sn => { const d = sn.data(); rb[d.unitId] = (rb[d.unitId] || 0) + calc.toNum(d.ratioPct); });

    // 每份文件只組一次 update（退佣紀錄的來源若同在本期，需同時作廢＋移除標記）
    const updates = new Map();
    const addUpdate = (ref, fields) => {
      const cur = updates.get(ref.path) || { ref, fields: {} };
      Object.assign(cur.fields, fields);
      updates.set(ref.path, cur);
    };
    stillActive.forEach(sn => {
      addUpdate(sn.ref, {
        status: "voided",
        voidedAt: FieldValue.serverTimestamp(),
        voidedBy: by || "",
        voidReason: reason || "",
      });
      const d = sn.data();
      if (d.type === "refund") {
        (d.sourceRecordIds || []).forEach(id => {
          addUpdate(db.collection("commissionRecords").doc(String(id)),
            { refundedBy: FieldValue.delete(), refundedAt: FieldValue.delete(), refundPeriod: FieldValue.delete() });
        });
      }
    });
    updates.forEach(u => tx.update(u.ref, u.fields));
    unitIds.forEach((u, i) => {
      const existing = ledgerSnaps[i].exists ? calc.toNum(ledgerSnaps[i].data().claimedRatioPct) : 0;
      const dec = rb[u] || 0;   // 退佣紀錄 ratioPct 為負 → 作廢時加回
      const raw = Math.round((existing - dec) * 1000) / 1000;
      if (raw > 100.0001) {
        throw new HttpsError("failed-precondition",
          `戶別 ${u} 已重新請佣，作廢本期退佣紀錄將使已請比例超過 100%，無法整期作廢。`);
      }
      const next = Math.max(0, raw);
      units.push({ unitId: u, before: existing, after: next, ratioPct: dec });
      tx.set(ledgerRefs[i], { projectId, planId, unitId: u, claimedRatioPct: next, updatedAt: FieldValue.serverTimestamp() }, { merge: true });
    });
  });

  // 獎金明細連動作廢
  const bonusSnap = await planRows_(db.collection("bonusRecords")
    .where("projectId", "==", projectId).where("period", "==", p).where("status", "==", "active"), planId);
  const bt = batcher_(db);
  bonusSnap.docs = bonusSnap.docs.filter(d => inPeriod.has(d.data().commissionRecordId));
  bonusSnap.size = bonusSnap.docs.length;
  for (const d of bonusSnap.docs) {
    await bt.add(b => b.update(d.ref, { status: "voided", voidedAt: FieldValue.serverTimestamp(), voidedBy: by || "" }));
  }
  await bt.flush();

  return { records: recs.length, bonuses: bonusSnap.size, units };
}

/** 讀取建案的請佣設定（合併預設值） */
async function loadSettings_(db, projectId, planId) {
  const snap = await db.collection("commissionSettings").doc(planDocumentId(projectId, planId)).get();
  return calc.mergeSettings(snap.exists ? snap.data() : null);
}

/** 讀取建案全部車位（供 computeUnitFinance 用） */
async function loadParkings_(db, projectId) {
  const snap = await db.collection("salesParkings").where("projectId", "==", projectId).get();
  return snap.docs.map(d => d.data());
}

/** Timestamp / Date / 字串 → 'yyyy/MM/dd'（台灣時區）；空值回 '' */
function fmtDate_(v) {
  if (!v) return "";
  let d = null;
  if (v instanceof Date) d = v;
  else if (typeof v.toDate === "function") d = v.toDate();
  else if (typeof v === "object" && v.seconds !== undefined) d = new Date(v.seconds * 1000);
  else {
    const parsed = new Date(v);
    if (!Number.isNaN(parsed.getTime())) d = parsed;
  }
  if (!d || Number.isNaN(d.getTime())) return "";
  return formatInTimeZone(d, "Asia/Taipei", "yyyy/MM/dd");
}

/** 正規化 salesperson 欄位為字串陣列 */
function normSales_(v) {
  if (Array.isArray(v)) return v.map(s => String(s).trim()).filter(Boolean);
  if (typeof v === "string") return v.split(/[、,，\/\s]+/).map(s => s.trim()).filter(Boolean);
  return [];
}

/** 驗證單一 entry 的必要欄位（回傳錯誤訊息或 null） */
function validateEntry_(entry) {
  if (!entry || typeof entry !== "object") return "entry 格式錯誤";
  if (!entry.unitId) return "缺少 unitId";
  const period = Number(entry.period);
  if (!Number.isInteger(period) || period <= 0) return `戶別 ${entry.unitId}：期別必須為正整數`;
  const ratio = Number(entry.ratioPct);
  if (!Number.isFinite(ratio) || ratio <= 0 || ratio > 100) return `戶別 ${entry.unitId}：本次請佣比例須介於 0～100`;
  return null;
}

/** 驗證單一退佣 entry（回傳錯誤訊息或 null） */
function validateRefund_(rf) {
  if (!rf || typeof rf !== "object") return "refund 格式錯誤";
  if (!rf.unitId) return "退佣缺少 unitId";
  const period = Number(rf.period);
  if (!Number.isInteger(period) || period <= 0) return `退佣 ${rf.unitId}：期別必須為正整數`;
  if (!Array.isArray(rf.sourceRecordIds) || rf.sourceRecordIds.length === 0) return `退佣 ${rf.unitId}：未選擇要退回的原請佣紀錄`;
  return null;
}

/** 讀取退佣來源紀錄與關聯獎金明細並試算（transaction 外；transaction 內再確認狀態） */
/** 退獎金來源：獨立獎金紀錄（bonusEntries）優先，找不到再找舊版請佣附帶獎金（commissionRecords） */
async function bonusSourceRef_(db, id) {
  const ref = db.collection("bonusEntries").doc(id);
  const sn = await ref.get();
  return sn.exists ? ref : db.collection("commissionRecords").doc(id);
}

/**
 * 退佣／退獎金試算前置。
 * bonusOnly＝退獎金：來源為獎金紀錄、只追回獎金明細、標記欄位為 bonusRefundedBy（與請佣的退佣各自獨立）。
 */
async function prepareRefund_(db, projectId, rf, planId, bonusOnly = false) {
  const label = bonusOnly ? "退獎金" : "退佣";
  const marker = bonusOnly ? "bonusRefundedBy" : "refundedBy";
  const ids = [...new Set(rf.sourceRecordIds.map(String))];
  const refs = bonusOnly
    ? await Promise.all(ids.map(id => bonusSourceRef_(db, id)))
    : ids.map(id => db.collection("commissionRecords").doc(id));
  const snaps = await db.getAll(...refs);
  const sources = snaps.map(sn => {
    if (!sn.exists) throw new HttpsError("not-found", `${label} ${rf.unitId}：找不到原${bonusOnly ? "獎金" : "請佣"}紀錄 ${sn.id}`);
    return { id: sn.id, ...sn.data() };
  });
  sources.forEach(sr => {
    if (sr.projectId !== projectId || sr.unitId !== rf.unitId || planIdOf(sr) !== planId) {
      throw new HttpsError("invalid-argument", `${label} ${rf.unitId}：原紀錄 ${sr.id} 不屬於此戶別。`);
    }
    if (sr.type === "refund") throw new HttpsError("invalid-argument", `${label} ${rf.unitId}：不可退回${label}紀錄。`);
    if (sr.status !== "active") throw new HttpsError("failed-precondition", `${label} ${rf.unitId}：第 ${sr.period} 期原紀錄已作廢。`);
    if (sr[marker]) throw new HttpsError("failed-precondition", `${label} ${rf.unitId}：第 ${sr.period} 期原紀錄已${label}。`);
  });
  const bonuses = [];
  for (const id of ids) {
    const bs = await db.collection("bonusRecords").where("commissionRecordId", "==", id).get();
    bs.docs.forEach(d => { const b = d.data(); if (b.status === "active") bonuses.push({ id: d.id, ...b }); });
  }
  if (bonusOnly && !bonuses.length) throw new HttpsError("failed-precondition", `退獎金 ${rf.unitId}：原紀錄沒有有效的獎金明細。`);
  const plan = calc.buildRefundPlan({
    sources,
    sourceBonuses: bonuses,
    includeKeep: !!rf.includeKeep,
    refundBonus: bonusOnly ? true : rf.refundBonus !== false,
    people: Array.isArray(rf.people) ? rf.people : null,
  });
  if (plan.errors.length) throw new HttpsError("invalid-argument", `${label} ${rf.unitId}：${plan.errors.join("；")}`);
  return { rf, ids, refs, sources, plan, marker, label };
}

/* ==========================================================
 * 送出請佣（含退佣）
 * data: {
 *   projectId, createdBy,
 *   entries: [{
 *     unitId, period, requestDate, ratioPct, commPct, keepPct,
 *     partyAFee, partyBFee, teamSiteKeys: [],
 *     categories: { [catKey]: { ratePct, allocations: [{ personKey, name, sourceProjectId, sourceProjectName, isExternal, mode, sharePct, lockedAmount }] } },
 *     personProfiles: { [personKey]: { name, role, keepPct, taxPct, nhiPct, remark } }
 *   }],
 *   refunds: [{   // 退佣（買方解約）：原紀錄原數反向，金額為負值
 *     unitId, period, requestDate, reason, includeKeep, refundBonus,
 *     sourceRecordIds: [], people: null | [{ personKey, amounts: { [catKey]: 正數 }, remark }]
 *   }]
 * }
 * ========================================================== */
exports.submitCommissionEntries = onCall({
  region: REGION,
  timeoutSeconds: 120,
  memory: "512MiB",
}, async (request) => {
  const planId = requestPlanId_(request);
  const { projectId, entries, refunds, createdBy, submissionType = "both", periodNotes = [] } = request.data || {};
  if (!['claim', 'bonus', 'both'].includes(submissionType)) throw new HttpsError('invalid-argument', '送出類型不正確。');
  const bonusOnly = submissionType === 'bonus';
  const claimOnly = submissionType === 'claim';
  const recordCollection = bonusOnly ? 'bonusEntries' : 'commissionRecords';
  const ledgerCollection = bonusOnly ? 'bonusUnitLedgers' : 'commissionUnitLedgers';
  if (!Array.isArray(periodNotes) || periodNotes.some(n => !Number.isInteger(n.period) || n.period < 1 || typeof n.personKey !== 'string' || !n.personKey || !Array.isArray(n.notes) || n.notes.some(v => typeof v !== 'string'))) {
    throw new HttpsError('invalid-argument', '當期人員備註格式錯誤。');
  }
  const entryList = Array.isArray(entries) ? entries : [];
  const refundList = Array.isArray(refunds) ? refunds : [];
  if (!projectId || (entryList.length === 0 && refundList.length === 0)) {
    throw new HttpsError("invalid-argument", "缺少 projectId 或 entries。");
  }
  for (const entry of entryList) {
    const err = validateEntry_(entry);
    if (err) throw new HttpsError("invalid-argument", err);
    if (entry.replaceRecordId !== undefined && entry.replaceRecordId !== null && typeof entry.replaceRecordId !== "string") {
      throw new HttpsError("invalid-argument", `戶別 ${entry.unitId}：replaceRecordId 格式錯誤`);
    }
  }
  const replaceIdSeen = new Set();
  for (const entry of entryList) {
    if (!entry.replaceRecordId) continue;
    if (replaceIdSeen.has(entry.replaceRecordId)) throw new HttpsError("invalid-argument", `原紀錄 ${entry.replaceRecordId} 被重複取代。`);
    replaceIdSeen.add(entry.replaceRecordId);
  }
  for (const rf of refundList) {
    const err = validateRefund_(rf);
    if (err) throw new HttpsError("invalid-argument", err);
  }
  const refundUnitSeen = new Set();
  for (const rf of refundList) {
    if (refundUnitSeen.has(rf.unitId)) throw new HttpsError("invalid-argument", `退佣 ${rf.unitId}：同一戶別重複。`);
    refundUnitSeen.add(rf.unitId);
  }

  const db = db_();
  const commissionPlan = await loadPlan_(db, projectId, planId);
  const settings = await loadSettings_(db, projectId, planId);
  const parkings = await loadParkings_(db, projectId);

  // 退佣：讀取原紀錄與獎金明細並試算（transaction 內再確認狀態）
  const preparedRefunds = [];
  for (const rf of refundList) preparedRefunds.push(await prepareRefund_(db, projectId, claimOnly ? { ...rf, refundBonus: false } : rf, planId, bonusOnly));

  // 拉回編輯：要取代的原紀錄（送出時於同一 transaction 作廢原紀錄、寫入新紀錄；比例先扣原紀錄再驗證）
  const preparedReplaces = [];
  for (const entry of entryList) {
    if (!entry.replaceRecordId) continue;
    const ref = db.collection(bonusOnly && entry.replaceLegacyBonus ? "commissionRecords" : recordCollection).doc(String(entry.replaceRecordId));
    const sn = await ref.get();
    if (!sn.exists) throw new HttpsError("not-found", `戶別 ${entry.unitId}：找不到要取代的原紀錄。`);
    const rec = sn.data();
    if (rec.projectId !== projectId || planIdOf(rec) !== planId) throw new HttpsError("permission-denied", `戶別 ${entry.unitId}：原紀錄不屬於此建案／方案。`);
    if (rec.unitId !== entry.unitId) throw new HttpsError("invalid-argument", `戶別 ${entry.unitId}：原紀錄戶別不符（${rec.unitId}）。`);
    if (rec.type === "refund") throw new HttpsError("invalid-argument", `戶別 ${entry.unitId}：退佣紀錄不可拉回編輯。`);
    preparedReplaces.push({ unitId: rec.unitId, recordId: String(entry.replaceRecordId), ref, ratioPct: calc.toNum(rec.ratioPct), legacyBonus: bonusOnly && !!entry.replaceLegacyBonus, record: rec });
  }

  // 逐戶讀取戶別資料並在伺服器端重算（不信任前端金額）
  const prepared = [];
  for (const entry of entryList) {
    const unitDocId = `${projectId}_${entry.unitId}`;
    const unitSnap = await db.collection("salesHouseholds").doc(unitDocId).get();
    if (!unitSnap.exists) {
      throw new HttpsError("not-found", `找不到戶別資料：${entry.unitId}`);
    }
    const unit = unitSnap.data();
    const finance = computePlanFinance({ ...unit, unitId: entry.unitId }, parkings, commissionPlan, entry);
    if (finance.errors.length) throw new HttpsError('invalid-argument', `戶別 ${entry.unitId}：${finance.errors.join('；')}`);
    const isPreferred = !!unit.isPreferredPayment;

    let basis = entry;
    if (bonusOnly) {
      const replacement = preparedReplaces.find(r => r.recordId === entry.replaceRecordId);
      const claims = await db.collection('commissionRecords').where('projectId', '==', projectId).where('unitId', '==', entry.unitId).get();
      const latest = claims.docs.map(d => d.data()).filter(r => planIdOf(r) === planId && r.status === 'active' && r.type !== 'refund')
        .sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0) || Number(b.period) - Number(a.period))[0];
      basis = replacement?.record || latest || {};
    }
    const commPct = (basis.commPct === undefined || basis.commPct === null || basis.commPct === "")
      ? calc.resolveCommPct(settings, isPreferred)
      : Number(basis.commPct);
    const keepPct = (basis.keepPct === undefined || basis.keepPct === null || basis.keepPct === "")
      ? calc.toNum(settings.defaultKeepPct)
      : Number(basis.keepPct);

    // 基準法：請佣基準與介紹費 B 時機隨請佣紀錄；獎金基準可於獎金編輯時依當期改選；未指定則採方案設定預設
    const input = {
      ratioPct: Number(entry.ratioPct),
      commPct,
      keepPct,
      partyAFee: calc.toNum(basis.partyAFee),
      partyBFee: calc.toNum(basis.partyBFee),
      claimBasisMethod: calc.basisMethodOf(basis.claimBasisMethod) || calc.basisMethodOf(settings.claimBasisMethod) || 'lower',
      partyBFeeTiming: calc.feeTimingOf(basis.partyBFeeTiming) || calc.feeTimingOf(settings.partyBFeeTiming) || 'before',
      bonusBasisMethod: calc.basisMethodOf(entry.bonusBasisMethod) || calc.basisMethodOf(basis.bonusBasisMethod) || calc.basisMethodOf(settings.bonusBasisMethod) || 'deal',
      categories: claimOnly ? {} : (entry.categories || {}),
    };
    const result = calc.calcUnitBonus(finance, input, entry.personProfiles || {});
    if (result.errors.length) {
      const msg = result.errors.map(e => `${e.catKey}：${e.error}`).join("；");
      throw new HttpsError("invalid-argument", `戶別 ${entry.unitId} 分配驗證未通過：${msg}`);
    }

    prepared.push({ entry, unit, finance, input, result, isPreferred });
  }

  // 預估寫入量（每戶 1 請佣紀錄 + N 獎金明細 + 1 ledger），transaction 上限 500
  const totalWrites = 1 + preparedReplaces.length + periodNotes.length + prepared.reduce((s, p) => s + 1 + p.result.people.length, 0) + prepared.length
    + preparedRefunds.reduce((s, r) => s + 1 + r.plan.people.length + r.ids.length + 1, 0);
  if (totalWrites > 450) {
    throw new HttpsError("invalid-argument", `本次寫入量過大（${totalWrites} 筆），請分批送出（建議一次少於 20 戶）。`);
  }

  const stamp = nowStamp_();
  const results = [];

  await db.runTransaction(async (tx) => {
    const planRef = db.collection('commissionPlans').doc(planDocumentId(projectId, planId));
    const currentPlan = planFromSnapshot_(await tx.get(planRef), projectId, planId);
    if (currentPlan.priceBasis !== commissionPlan.priceBasis || currentPlan.name !== commissionPlan.name) {
      throw new HttpsError('failed-precondition', '請佣方案已變更，請重新載入後再送出。');
    }
    results.length = 0;   // transaction 可能重試，避免結果重複累加
    // 1) 讀取所有戶別 ledger 並驗證比例（退佣為負向：先扣退佣再驗證新增）
    const ratioAdd = {};   // unitId -> 本次合計新增比例
    const ratioSub = {};   // unitId -> 本次退佣比例
    prepared.forEach(p => {
      ratioAdd[p.entry.unitId] = (ratioAdd[p.entry.unitId] || 0) + Number(p.entry.ratioPct);
    });
    preparedRefunds.forEach(r => {
      ratioSub[r.rf.unitId] = (ratioSub[r.rf.unitId] || 0) + calc.toNum(r.plan.refundRatioPct);
      if (ratioAdd[r.rf.unitId] === undefined) ratioAdd[r.rf.unitId] = 0;
    });
    preparedReplaces.forEach(r => {
      ratioSub[r.unitId] = (ratioSub[r.unitId] || 0) + r.ratioPct;
      if (ratioAdd[r.unitId] === undefined) ratioAdd[r.unitId] = 0;
    });
    const ledgerRefs = {};
    const ledgerVals = {};
    for (const unitId of Object.keys(ratioAdd)) {
      const ref = db.collection(ledgerCollection).doc(ledgerId_(projectId, unitId, planId));
      ledgerRefs[unitId] = ref;
      const snap = await tx.get(ref);
      let existing = snap.exists ? calc.toNum(snap.data().claimedRatioPct) : 0;
      if (bonusOnly) {
        const bonusSnap = await tx.get(db.collection('bonusRecords').where('projectId', '==', projectId).where('unitId', '==', unitId));
        const sourceIds = [...new Set(bonusSnap.docs.filter(d => d.data().status !== 'voided' && planIdOf(d.data()) === planId).map(d => d.data().commissionRecordId))];
        const independent = await tx.get(db.collection('bonusEntries').where('projectId', '==', projectId).where('unitId', '==', unitId));
        const independentDocs = independent.docs.filter(d => d.data().status !== 'voided' && planIdOf(d.data()) === planId);
        const ownIds = new Set(independent.docs.map(d => d.id));
        const legacy = await Promise.all(sourceIds.filter(id => !ownIds.has(id)).map(id => tx.get(db.collection('commissionRecords').doc(id))));
        existing = [...independentDocs, ...legacy.filter(d => d.exists)].reduce((sum, d) => sum + calc.toNum(d.data().ratioPct), 0);
      }
      const afterRefund = Math.max(0, existing - (ratioSub[unitId] || 0));
      if (afterRefund + ratioAdd[unitId] > 100.0001) {
        throw new HttpsError("failed-precondition",
          `戶別 ${unitId}「已請 ${Math.round(afterRefund * 10) / 10}% ＋ 本次 ${ratioAdd[unitId]}%」超過 100%，未寫入任何資料。`);
      }
      ledgerVals[unitId] = afterRefund;
    }
    // 退佣：transaction 內再次確認原紀錄仍有效且未被退佣（防並發）
    for (const r of preparedRefunds) {
      const snaps = await Promise.all(r.refs.map(ref => tx.get(ref)));
      snaps.forEach(sn => {
        const d = sn.exists ? sn.data() : null;
        if (!d || d.status !== "active") throw new HttpsError("failed-precondition", `${r.label} ${r.rf.unitId}：原紀錄 ${sn.id} 已作廢或不存在，未寫入任何資料。`);
        if (d[r.marker]) throw new HttpsError("failed-precondition", `${r.label} ${r.rf.unitId}：原紀錄 ${sn.id} 已被${r.label}，未寫入任何資料。`);
      });
    }

    // 拉回編輯：transaction 內再次確認原紀錄仍有效、未退佣（防並發）
    const replaceSnaps = await Promise.all(preparedReplaces.map(r => tx.get(r.ref)));
    replaceSnaps.forEach((sn, i) => {
      const d = sn.exists ? sn.data() : null;
      const unitId = preparedReplaces[i].unitId;
      if (!d || (d.status !== "active" && !preparedReplaces[i].legacyBonus)) throw new HttpsError("failed-precondition", `戶別 ${unitId}：原紀錄已作廢或不存在，未寫入任何資料。`);
      if (bonusOnly ? d.bonusRefundedBy : d.refundedBy) throw new HttpsError("failed-precondition", `戶別 ${unitId}：原紀錄已${bonusOnly ? "退獎金" : "退佣"}，請先作廢對應紀錄，未寫入任何資料。`);
    });

    const replacedBonusDocs = [];
    if (!claimOnly) for (const rp of preparedReplaces) {
      const sn = await tx.get(db.collection('bonusRecords').where('commissionRecordId', '==', rp.recordId));
      const active = sn.docs.filter(d => d.data().status !== 'voided');
      if (rp.legacyBonus && !active.length) throw new HttpsError('failed-precondition', '原獎金已修改，請重新載入。');
      replacedBonusDocs.push(...active);
    }
    if (totalWrites + replacedBonusDocs.length > 450) throw new HttpsError('invalid-argument', '本次資料過多，請分批送出。');
    replacedBonusDocs.forEach(d => tx.update(d.ref, { status: 'voided', voidedAt: FieldValue.serverTimestamp(), voidedBy: createdBy || '' }));
    if (bonusOnly) periodNotes.forEach(n => tx.set(db.collection('commissionSettings').doc(`${projectId}__bonusNotes_${n.period}_${encodeURIComponent(n.personKey)}`), {
      projectId, kind: 'periodPersonNotes', period: n.period, personKey: n.personKey, notes: n.notes,
      updatedBy: createdBy || '', updatedAt: FieldValue.serverTimestamp(),
    }));

    tx.set(planRef, { projectId, planId, name: currentPlan.name, priceBasis: currentPlan.priceBasis, used: true }, { merge: true });

    // 2) 寫入
    prepared.forEach(p => {
      const { entry, unit, finance, input, result } = p;
      const recordId = `${planDocumentId(projectId, planId)}_${entry.unitId}_${entry.period}_${stamp}${rand3_()}`;
      const recordRef = db.collection(recordCollection).doc(recordId);

      tx.set(recordRef, {
        projectId,
        submissionType,
        planId,
        unitId: entry.unitId,
        period: Number(entry.period),
        status: "active",
        requestDate: entry.requestDate || formatInTimeZone(new Date(), "Asia/Taipei", "yyyy/MM/dd"),
        ratioPct: input.ratioPct,
        commPct: input.commPct,
        keepPct: input.keepPct,
        partyAFee: input.partyAFee,
        partyBFee: input.partyBFee,
        claimBasisMethod: input.claimBasisMethod,
        bonusBasisMethod: input.bonusBasisMethod,
        partyBFeeTiming: input.partyBFeeTiming,
        teamSiteKeys: Array.isArray(entry.teamSiteKeys) ? entry.teamSiteKeys : [],
        note: noteOf_(entry.note),
        snapshot: {
          planName: commissionPlan.name,
          priceBasis: commissionPlan.priceBasis,
          priceSource: finance.priceSource,
          manualFloor: finance.manualFloorRequired ? Number(entry.manualFloor) : null,
          contractType: unit.contractType || '',
          buyerName: unit.buyerName || "",
          salesperson: normSales_(unit.salesperson),
          parkingSpots: finance.parkingSpots,
          isPreferredPayment: !!unit.isPreferredPayment,
          contractDate: fmtDate_(unit.payment_contract_date),
          depositDate: fmtDate_(unit.payment_deposit_date),
          salesStatus: unit.salesStatus_backend || "",
          remarks: unit.remarks || "",
          dealTotal: finance.dealTotal,
          totalFloor: finance.totalFloor,
          spread: finance.spread,
          houseDeal: finance.houseDeal,
          parkDeal: finance.parkDeal,
          houseFloor: finance.houseFloor,
          parkFloor: finance.parkFloor,
        },
        calc: {
          feeWan: result.claim.feeWan,
          realSpread: result.claim.realSpread,
          baseWan: result.claim.baseWan,
          realClaim: result.claim.realClaim,
          claimKeep: result.claim.claimKeep,
          thisClaim: result.claim.thisClaim,
          base: result.claim.base,
          discount: result.claim.discount,
          dealAfter: result.claim.dealAfter,
        },
        categories: claimOnly ? {} : (entry.categories || {}),
        // 交屋團獎（自個獎提撥、本期不發放）快照：total＝本次（已乘請佣比例）、totalFull＝100% 重算
        handover: {
          total: calc.toNum(result.handoverTotal),
          totalFull: calc.toNum(result.handoverTotalFull),
          byCat: result.handover || {},
        },
        planName: commissionPlan.name,
        source: "system",
        replaces: entry.replaceRecordId || null,   // 拉回編輯：被取代的原紀錄
        createdAt: FieldValue.serverTimestamp(),
        createdBy: createdBy || "",
      });
      if (entry.replaceRecordId) {
        const rp = preparedReplaces.find(x => x.recordId === entry.replaceRecordId);
        if (rp && !rp.legacyBonus) {
          tx.update(rp.ref, {
            status: "voided",
            voidedAt: FieldValue.serverTimestamp(),
            voidedBy: createdBy || "",
            voidReason: `拉回編輯後重新送出（新紀錄 ${recordId}）`,
            replacedBy: recordId,
          });
        }
      }

      result.people.forEach(person => {
        const bonusId = `${recordId}_${person.personKey}`;
        const bonusRef = db.collection("bonusRecords").doc(bonusId);
        tx.set(bonusRef, {
          projectId,
          submissionType,
          planId,
          unitId: entry.unitId,
          period: Number(entry.period),
          status: "active",
          commissionRecordId: recordId,
          personKey: person.personKey,
          name: person.name,
          role: person.role,
          sourceProjectId: person.sourceProjectId || projectId,
          sourceProjectName: person.sourceProjectName || "",
          isExternal: !!person.isExternal,
          requestDate: entry.requestDate || "",
          amounts: person.amounts,
          amountsFull: person.amountsFull,
          subtotal: person.subtotal,
          keepPct: person.keepPct,
          taxPct: person.taxPct,
          nhiPct: person.nhiPct,
          keep: person.keep,
          tax: person.tax,
          nhi: person.nhi,
          net: person.net,
          remark: person.remark || "",
          planName: commissionPlan.name,
          source: "system",
          createdAt: FieldValue.serverTimestamp(),
          createdBy: createdBy || "",
        });
      });

      results.push({ unitId: entry.unitId, period: Number(entry.period), recordId, people: result.people.length });
    });

    // 2b) 寫入退佣紀錄（金額為負值）、負向獎金明細、標記原紀錄「已退佣」
    preparedRefunds.forEach(r => {
      const { rf, plan, ids } = r;
      const period = Number(rf.period);
      const recordId = `${planDocumentId(projectId, planId)}_${rf.unitId}_${period}_R${stamp}${rand3_()}`;
      const recordRef = db.collection(recordCollection).doc(recordId);
      const requestDate = rf.requestDate || formatInTimeZone(new Date(), "Asia/Taipei", "yyyy/MM/dd");
      tx.set(recordRef, {
        projectId,
        submissionType,
        planId,
        unitId: rf.unitId,
        period,
        type: "refund",
        status: "active",
        requestDate,
        reason: String(rf.reason || ""),
        includeKeep: !!rf.includeKeep,
        refundBonus: bonusOnly ? true : rf.refundBonus !== false,
        ratioPct: -calc.toNum(plan.refundRatioPct),
        refundRatioPct: calc.toNum(plan.refundRatioPct),
        commPct: plan.commPct,
        keepPct: plan.keepPct,
        partyAFee: 0,
        partyBFee: 0,
        teamSiteKeys: [],
        sourceRecordIds: ids,
        sources: plan.sources,
        snapshot: plan.snapshot,
        calc: plan.calc,
        categories: {},
        handover: plan.handover,
        planName: commissionPlan.name,
        source: "system",
        createdAt: FieldValue.serverTimestamp(),
        createdBy: createdBy || "",
      });
      plan.people.forEach(person => {
        const bonusRef = db.collection("bonusRecords").doc(`${recordId}_${person.personKey}`);
        tx.set(bonusRef, {
          projectId,
          submissionType,
          planId,
          unitId: rf.unitId,
          period,
          type: "refund",
          status: "active",
          commissionRecordId: recordId,
          personKey: person.personKey,
          name: person.name,
          role: person.role,
          sourceProjectId: person.sourceProjectId || projectId,
          sourceProjectName: person.sourceProjectName || "",
          isExternal: !!person.isExternal,
          requestDate,
          amounts: person.amounts,
          amountsFull: person.amountsFull,
          adjusted: !!person.adjusted,
          subtotal: person.subtotal,
          keepPct: person.keepPct,
          taxPct: person.taxPct,
          nhiPct: person.nhiPct,
          keep: person.keep,
          tax: person.tax,
          nhi: person.nhi,
          net: person.net,
          remark: person.remark || "",
          planName: commissionPlan.name,
          source: "system",
          createdAt: FieldValue.serverTimestamp(),
          createdBy: createdBy || "",
        });
      });
      r.refs.forEach(ref => {
        tx.update(ref, bonusOnly
          ? { bonusRefundedBy: recordId, bonusRefundedAt: FieldValue.serverTimestamp(), bonusRefundPeriod: period }
          : { refundedBy: recordId, refundedAt: FieldValue.serverTimestamp(), refundPeriod: period });
      });
      results.push({ unitId: rf.unitId, period, recordId, people: plan.people.length, refund: true });
    });

    // 3) 更新 ledger
    Object.keys(ratioAdd).forEach(unitId => {
      tx.set(ledgerRefs[unitId], {
        projectId,
        submissionType,
        planId,
        unitId,
        claimedRatioPct: Math.round((ledgerVals[unitId] + ratioAdd[unitId]) * 1000) / 1000,
        updatedAt: FieldValue.serverTimestamp(),
      }, { merge: true });
    });
  });

  return { ok: true, results };
});

/* ==========================================================
 * 作廢請佣紀錄
 * data: { projectId, recordId, voidReason, voidedBy }
 * ========================================================== */
exports.voidCommissionRecord = onCall({
  region: REGION,
  timeoutSeconds: 60,
  memory: "512MiB",
}, async (request) => {
  const planId = requestPlanId_(request);
  const { projectId, recordId, voidReason, voidedBy, submissionType = "claim" } = request.data || {};
  if (!projectId || !recordId) {
    throw new HttpsError("invalid-argument", "缺少 projectId 或 recordId。");
  }
  // 獨立獎金紀錄（含退獎金）：存於 bonusEntries，標記欄位為 bonusRefundedBy
  const bonusOnly = submissionType === "bonus";
  const marker = bonusOnly ? "bonusRefundedBy" : "refundedBy";
  const label = bonusOnly ? "退獎金" : "退佣";

  const db = db_();
  const recordRef = db.collection(bonusOnly ? "bonusEntries" : "commissionRecords").doc(recordId);

  let unitId = "";
  await db.runTransaction(async (tx) => {
    const snap = await tx.get(recordRef);
    if (!snap.exists) throw new HttpsError("not-found", bonusOnly ? "找不到此獎金紀錄。" : "找不到此請佣紀錄。");
    const rec = snap.data();
    if (rec.projectId !== projectId || planIdOf(rec) !== planId) throw new HttpsError("permission-denied", "紀錄不屬於此建案。");
    if (rec.status === "voided") throw new HttpsError("failed-precondition", "此紀錄已作廢，不可重複作廢。");
    if (rec[marker]) {
      throw new HttpsError("failed-precondition", `此紀錄已${label}，請先作廢對應的${label}紀錄。`);
    }
    unitId = rec.unitId;

    const ledgerRef = db.collection(bonusOnly ? "bonusUnitLedgers" : "commissionUnitLedgers").doc(ledgerId_(projectId, rec.unitId, planId));
    const ledgerSnap = await tx.get(ledgerRef);
    const existing = ledgerSnap.exists ? calc.toNum(ledgerSnap.data().claimedRatioPct) : 0;
    let next;
    const isRefund = rec.type === "refund";
    let sourceRefs = [];
    if (isRefund) {
      // 作廢退佣：原紀錄恢復有效（移除已退佣標記）、已請比例加回
      const back = calc.toNum(rec.refundRatioPct !== undefined ? rec.refundRatioPct : -calc.toNum(rec.ratioPct));
      if (existing + back > 100.0001) {
        throw new HttpsError("failed-precondition",
          `該戶已重新請佣（已請 ${Math.round(existing * 10) / 10}%），加回 ${back}% 將超過 100%，無法作廢此退佣紀錄。`);
      }
      next = Math.round((existing + back) * 1000) / 1000;
      sourceRefs = bonusOnly
        ? await Promise.all((rec.sourceRecordIds || []).map(id => bonusSourceRef_(db, String(id))))
        : (rec.sourceRecordIds || []).map(id => db.collection("commissionRecords").doc(String(id)));
      const srcSnaps = await Promise.all(sourceRefs.map(ref => tx.get(ref)));
      srcSnaps.forEach(sn => {
        if (!sn.exists) return;
        tx.update(sn.ref, bonusOnly
          ? { bonusRefundedBy: FieldValue.delete(), bonusRefundedAt: FieldValue.delete(), bonusRefundPeriod: FieldValue.delete() }
          : { refundedBy: FieldValue.delete(), refundedAt: FieldValue.delete(), refundPeriod: FieldValue.delete() });
      });
    } else {
      next = Math.max(0, Math.round((existing - calc.toNum(rec.ratioPct)) * 1000) / 1000);
    }

    tx.update(recordRef, {
      status: "voided",
      voidedAt: FieldValue.serverTimestamp(),
      voidedBy: voidedBy || "",
      voidReason: voidReason || "",
    });
    tx.set(ledgerRef, {
      projectId,
      planId,
      unitId: rec.unitId,
      claimedRatioPct: next,
      updatedAt: FieldValue.serverTimestamp(),
    }, { merge: true });
  });

  // 關聯獎金明細連動作廢（transaction 外批次處理）
  const bonusSnap = await db.collection("bonusRecords")
    .where("commissionRecordId", "==", recordId).get();
  if (!bonusSnap.empty) {
    const batch = db.batch();
    bonusSnap.docs.forEach(d => {
      batch.update(d.ref, {
        status: "voided",
        voidedAt: FieldValue.serverTimestamp(),
        voidedBy: voidedBy || "",
      });
    });
    await batch.commit();
  }

  return { ok: true, unitId, bonusVoided: bonusSnap.size };
});

/* ==========================================================
 * 歷史資料批次匯入
 * data: {
 *   projectId, createdBy,
 *   claims: [{ unitId, period, requestDate, ratioPct, commPct, keepPct, partyAFee, partyBFee,
 *              snapshot: {...}, calc: {...}, categories: {...},
 *              type?: "refund", refundRatioPct? }],   // 退佣列：ratioPct 為負、金額為負值，無來源紀錄
 *   bonuses: [{ unitId, period, requestDate, personKey, name, role, sourceProjectName,
 *               amounts: {...}, amountsFull: {...}, subtotal, keepPct, taxPct, nhiPct,
 *               keep, tax, nhi, net, remark, claimIndex }]
 * }
 * claims 由前端解析驗證後傳入；bonuses 以 claimIndex 對應 claims 陣列索引。
 * ========================================================== */
exports.importCommissionHistory = onCall({
  region: REGION,
  timeoutSeconds: 540,
  memory: "512MiB",
}, async (request) => {
  const planId = requestPlanId_(request);
  const {
    projectId, claims, bonuses, createdBy, operatorKey,
    replaceExisting = false, importFileName = "",
  } = request.data || {};
  if (!projectId || !Array.isArray(claims) || claims.length === 0) {
    throw new HttpsError("invalid-argument", "缺少 projectId 或 claims。");
  }
  const bonusList = Array.isArray(bonuses) ? bonuses : [];

  const db = db_();
  await ensureManagePermission_(db, operatorKey, projectId);
  const importPlan = await loadPlan_(db, projectId, planId);

  const ratioAdd = {};
  const filePeriods = new Set();
  claims.forEach(c => {
    if (!c.unitId || !Number.isFinite(Number(c.period))) {
      throw new HttpsError("invalid-argument", `匯入資料缺少 unitId 或期別（${c.unitId || "?"}）。`);
    }
    const ratio = calc.toNum(c.ratioPct);
    if (c.type === "refund" ? !(ratio < 0 && ratio >= -100) : !(ratio > 0 && ratio <= 100)) {
      throw new HttpsError("invalid-argument", `戶別 ${c.unitId} 第 ${c.period} 期：請佣比例須介於 0～100（退佣為負數）。`);
    }
    ratioAdd[c.unitId] = (ratioAdd[c.unitId] || 0) + ratio;
    filePeriods.add(Number(c.period));
  });

  // 期別衝突檢查：檔案內期別已有有效紀錄 → 未勾選覆蓋則擋下；勾選則先整期作廢
  const conflictPeriods = [];
  for (const p of [...filePeriods].sort((a, b) => a - b)) {
    const snap = await planRows_(db.collection("commissionRecords")
      .where("projectId", "==", projectId).where("period", "==", p).where("status", "==", "active"), planId);
    if (!snap.empty) conflictPeriods.push(p);
  }
  const replaced = [];
  if (conflictPeriods.length) {
    if (!replaceExisting) {
      throw new HttpsError("failed-precondition",
        `第 ${conflictPeriods.join("、")} 期已有有效請佣紀錄。請先於「歷期總覽」整期作廢，或勾選「先整期作廢再匯入（覆蓋）」後重試。未寫入任何資料。`);
    }
    for (const p of conflictPeriods) {
      const payouts = await findRetentionPayoutsForPeriod_(db, projectId, p, planId);
      if (payouts.length) {
        throw new HttpsError("failed-precondition",
          `第 ${p} 期已有 ${payouts.length} 筆保留款發還登記，請先於「保留款追蹤」刪除後再覆蓋匯入。未寫入任何資料。`);
      }
    }
    for (const p of conflictPeriods) {
      const r = await voidPeriodCore_(db, projectId, p, { reason: `重新匯入覆蓋（${importFileName || "歷史匯入"}）`, by: createdBy || "" }, planId);
      replaced.push({ period: p, ...r });
    }
  }

  // 驗證每戶比例累計（含既有 ledger；若有覆蓋，ledger 已回溯）
  const ledgerBase = {};
  for (const unitId of Object.keys(ratioAdd)) {
    const snap = await db.collection("commissionUnitLedgers").doc(ledgerId_(projectId, unitId, planId)).get();
    const existing = snap.exists ? calc.toNum(snap.data().claimedRatioPct) : 0;
    if (existing + ratioAdd[unitId] > 100.0001) {
      throw new HttpsError("failed-precondition",
        `戶別 ${unitId} 匯入後累計比例將超過 100%（既有 ${existing}% ＋ 匯入 ${ratioAdd[unitId]}%），未寫入任何資料。`);
    }
    ledgerBase[unitId] = existing;
  }

  const stamp = nowStamp_();
  await markPlanUsed_(db, projectId, planId, importPlan);
  const importBatchId = `imp_${stamp}${rand3_()}`;
  const claimIds = [];
  const bt = batcher_(db);
  const add = (fn) => bt.add(fn);
  const flush = () => bt.flush();

  // 寫入請佣紀錄
  for (let i = 0; i < claims.length; i++) {
    const c = claims[i];
    const recordId = `${planDocumentId(projectId, planId)}_${c.unitId}_${c.period}_${stamp}${rand3_()}${i}`;
    claimIds.push(recordId);
    await add(b => b.set(db.collection("commissionRecords").doc(recordId), {
      projectId,
      planId,
      unitId: c.unitId,
      period: Number(c.period),
      status: "active",
      requestDate: c.requestDate || "",
      ratioPct: calc.toNum(c.ratioPct),
      commPct: calc.toNum(c.commPct),
      keepPct: c.keepPct === undefined ? 10 : calc.toNum(c.keepPct),
      partyAFee: calc.toNum(c.partyAFee),
      partyBFee: calc.toNum(c.partyBFee),
      claimBasisMethod: calc.basisMethodOf(c.claimBasisMethod) || 'lower',
      bonusBasisMethod: calc.basisMethodOf(c.bonusBasisMethod) || 'deal',
      partyBFeeTiming: calc.feeTimingOf(c.partyBFeeTiming) || 'before',
      teamSiteKeys: [],
      note: noteOf_(c.note),
      snapshot: c.snapshot || {},
      calc: c.calc || {},
      categories: c.categories || {},
      // 歷史退佣：原數反向，無對應來源紀錄（作廢時僅加回比例）
      ...(c.type === "refund" ? {
        type: "refund",
        reason: noteOf_(c.note),
        includeKeep: false,
        refundBonus: true,
        refundRatioPct: Math.abs(calc.toNum(c.refundRatioPct) || calc.toNum(c.ratioPct)),
        sourceRecordIds: [],
        sources: [],
      } : {}),
      source: "import",
      importBatchId,
      importFileName: importFileName || "",
      createdAt: FieldValue.serverTimestamp(),
      createdBy: createdBy || "",
    }));
  }

  // 寫入獎金明細
  for (let i = 0; i < bonusList.length; i++) {
    const bRow = bonusList[i];
    const recordId = claimIds[bRow.claimIndex] || "";
    const claimRow = claims[bRow.claimIndex] || {};
    const personKey = bRow.personKey || bRow.name || `p${i}`;
    const bonusId = `${planDocumentId(projectId, planId)}_${bRow.unitId}_${bRow.period}_${personKey}_${stamp}${i}`;
    await add(b => b.set(db.collection("bonusRecords").doc(bonusId), {
      projectId,
      planId,
      unitId: bRow.unitId,
      period: Number(bRow.period),
      status: "active",
      commissionRecordId: recordId,
      ...(claimRow.type === "refund" || bRow.type === "refund" ? { type: "refund" } : {}),
      personKey,
      name: bRow.name || "",
      role: bRow.role || "",
      sourceProjectId: bRow.sourceProjectId || projectId,
      sourceProjectName: bRow.sourceProjectName || "",
      isExternal: !!bRow.isExternal,
      requestDate: bRow.requestDate || "",
      amounts: bRow.amounts || {},
      amountsFull: bRow.amountsFull || bRow.amounts || {},
      subtotal: calc.toNum(bRow.subtotal),
      keepPct: calc.toNum(bRow.keepPct),
      taxPct: calc.toNum(bRow.taxPct),
      nhiPct: calc.toNum(bRow.nhiPct),
      keep: calc.toNum(bRow.keep),
      tax: calc.toNum(bRow.tax),
      nhi: calc.toNum(bRow.nhi),
      net: calc.toNum(bRow.net),
      remark: bRow.remark || "",
      source: "import",
      importBatchId,
      createdAt: FieldValue.serverTimestamp(),
      createdBy: createdBy || "",
    }));
  }

  // 更新 ledger
  for (const unitId of Object.keys(ratioAdd)) {
    await add(b => b.set(db.collection("commissionUnitLedgers").doc(ledgerId_(projectId, unitId, planId)), {
      projectId,
      planId,
      unitId,
      claimedRatioPct: Math.max(0, Math.round((ledgerBase[unitId] + ratioAdd[unitId]) * 1000) / 1000),   // 歷史退佣無對應原請佣時不低於 0
      updatedAt: FieldValue.serverTimestamp(),
    }, { merge: true }));
  }
  await flush();

  await writeAudit_(db, {
    projectId,
    planId,
    action: "import",
    periods: [...filePeriods].sort((a, b) => a - b),
    importBatchId,
    importFileName: importFileName || "",
    operator: createdBy || "",
    operatorKey: String(operatorKey),
    reason: replaced.length ? `覆蓋匯入（先整期作廢第 ${replaced.map(r => r.period).join("、")} 期）` : "歷史匯入",
    impact: {
      claims: claims.length,
      bonuses: bonusList.length,
      replaced: replaced.map(r => ({ period: r.period, records: r.records, bonuses: r.bonuses })),
    },
  });

  return {
    ok: true, claims: claims.length, bonuses: bonusList.length, importBatchId,
    replaced: replaced.map(r => ({ period: r.period, records: r.records, bonuses: r.bonuses })),
  };
});

/* ==========================================================
 * 整期作廢
 * data: { projectId, period, voidReason, voidedBy, operatorKey }
 * ========================================================== */
exports.voidCommissionPeriod = onCall({
  region: REGION,
  timeoutSeconds: 120,
  memory: "512MiB",
}, async (request) => {
  const planId = requestPlanId_(request);
  const { projectId, period, voidReason, voidedBy, operatorKey } = request.data || {};
  const p = Number(period);
  if (!projectId || !Number.isFinite(p) || p <= 0) throw new HttpsError("invalid-argument", "缺少 projectId 或期別。");
  if (!String(voidReason || "").trim()) throw new HttpsError("invalid-argument", "作廢原因為必填。");

  const db = db_();
  await ensureManagePermission_(db, operatorKey, projectId);

  const payouts = await findRetentionPayoutsForPeriod_(db, projectId, p, planId);
  if (payouts.length) {
    throw new HttpsError("failed-precondition",
      `第 ${p} 期已有 ${payouts.length} 筆保留款發還登記，請先於「保留款追蹤」刪除後再整期作廢。`);
  }

  const result = await voidPeriodCore_(db, projectId, p, { reason: voidReason, by: voidedBy || "" }, planId);
  if (!result.records) throw new HttpsError("failed-precondition", `第 ${p} 期沒有有效的請佣紀錄可作廢。`);

  await writeAudit_(db, {
    projectId, planId, action: "voidPeriod", period: p,
    operator: voidedBy || "", operatorKey: String(operatorKey), reason: voidReason,
    impact: { records: result.records, bonuses: result.bonuses, units: result.units },
  });
  return { ok: true, period: p, ...result };
});

/* ==========================================================
 * 清除該期「已作廢」紀錄（實體刪除；只刪 status=voided，不會動到有效資料）
 * data: { projectId, period, purgedBy, operatorKey }
 * ========================================================== */
exports.purgeVoidedCommissionPeriod = onCall({
  region: REGION,
  timeoutSeconds: 120,
  memory: "512MiB",
}, async (request) => {
  const planId = requestPlanId_(request);
  const { projectId, period, purgedBy, operatorKey } = request.data || {};
  const p = Number(period);
  if (!projectId || !Number.isFinite(p) || p <= 0) throw new HttpsError("invalid-argument", "缺少 projectId 或期別。");

  const db = db_();
  await ensureManagePermission_(db, operatorKey, projectId);

  const recSnap = await planRows_(db.collection("commissionRecords")
    .where("projectId", "==", projectId).where("period", "==", p).where("status", "==", "voided"), planId);
  const bonusSnap = await planRows_(db.collection("bonusRecords")
    .where("projectId", "==", projectId).where("period", "==", p).where("status", "==", "voided"), planId);
  const claimIds = new Set(recSnap.docs.map(d => d.id));
  bonusSnap.docs = bonusSnap.docs.filter(d => claimIds.has(d.data().commissionRecordId));
  bonusSnap.size = bonusSnap.docs.length;
  bonusSnap.empty = !bonusSnap.size;
  if (recSnap.empty && bonusSnap.empty) {
    throw new HttpsError("failed-precondition", `第 ${p} 期沒有已作廢的紀錄可清除。`);
  }

  const activeBonuses = await planRows_(db.collection('bonusRecords').where('projectId', '==', projectId).where('status', '==', 'active'), planId);
  const usedIds = new Set(activeBonuses.docs.map(d => d.data().commissionRecordId));
  recSnap.docs = recSnap.docs.filter(d => !usedIds.has(d.id));
  recSnap.size = recSnap.docs.length;
  const bt = batcher_(db);
  for (const d of recSnap.docs) await bt.add(b => b.delete(d.ref));
  for (const d of bonusSnap.docs) await bt.add(b => b.delete(d.ref));
  await bt.flush();

  await writeAudit_(db, {
    projectId, planId, action: "purgeVoided", period: p,
    operator: purgedBy || "", operatorKey: String(operatorKey), reason: "",
    impact: { records: recSnap.size, bonuses: bonusSnap.size },
  });
  return { ok: true, period: p, records: recSnap.size, bonuses: bonusSnap.size };
});

/* ==========================================================
 * 撤銷一次歷史匯入：依 importBatchId 回溯有效紀錄的比例並實體刪除該批全部請佣／獎金紀錄
 * data: { projectId, importBatchId, undoneBy, operatorKey }
 * ========================================================== */
exports.undoCommissionImport = onCall({
  region: REGION,
  timeoutSeconds: 120,
  memory: "512MiB",
}, async (request) => {
  const planId = requestPlanId_(request);
  const { projectId, importBatchId, undoneBy, operatorKey } = request.data || {};
  if (!projectId || !importBatchId) throw new HttpsError("invalid-argument", "缺少 projectId 或 importBatchId。");

  const db = db_();
  await ensureManagePermission_(db, operatorKey, projectId);

  const recSnap = await planRows_(db.collection("commissionRecords")
    .where("projectId", "==", projectId).where("importBatchId", "==", importBatchId), planId);
  if (recSnap.empty) throw new HttpsError("not-found", "找不到此匯入批次的紀錄（可能已被撤銷或清除）。");

  const recs = recSnap.docs.map(d => ({ ref: d.ref, ...d.data() }));
  const refunded = recs.filter(r => r.status === "active" && r.refundedBy);
  if (refunded.length) {
    throw new HttpsError("failed-precondition",
      `${refunded.map(r => `${r.unitId}(第${r.period}期)`).join("、")} 已退佣，請先作廢對應的退佣紀錄再撤銷匯入。`);
  }
  const periods = [...new Set(recs.map(r => Number(r.period)))].sort((a, b) => a - b);
  for (const p of periods) {
    const payouts = await findRetentionPayoutsForPeriod_(db, projectId, p, planId);
    if (payouts.length && recs.some(r => Number(r.period) === p && r.status === "active")) {
      throw new HttpsError("failed-precondition",
        `第 ${p} 期已有 ${payouts.length} 筆保留款發還登記，請先於「保留款追蹤」刪除後再撤銷匯入。`);
    }
  }

  // 有效紀錄需回溯 ledger（transaction）
  const rollback = {};
  recs.filter(r => r.status === "active").forEach(r => {
    rollback[r.unitId] = (rollback[r.unitId] || 0) + calc.toNum(r.ratioPct);
  });
  const unitIds = Object.keys(rollback);
  const units = [];
  if (unitIds.length) {
    await db.runTransaction(async (tx) => {
      const refs = unitIds.map(u => db.collection("commissionUnitLedgers").doc(ledgerId_(projectId, u, planId)));
      const snaps = await Promise.all(refs.map(ref => tx.get(ref)));
      unitIds.forEach((u, i) => {
        const existing = snaps[i].exists ? calc.toNum(snaps[i].data().claimedRatioPct) : 0;
        const next = Math.max(0, Math.round((existing - rollback[u]) * 1000) / 1000);
        units.push({ unitId: u, before: existing, after: next, ratioPct: rollback[u] });
        tx.set(refs[i], { projectId, planId, unitId: u, claimedRatioPct: next, updatedAt: FieldValue.serverTimestamp() }, { merge: true });
      });
      recs.forEach(r => tx.delete(r.ref));
    });
  } else {
    const bt0 = batcher_(db);
    for (const r of recs) await bt0.add(b => b.delete(r.ref));
    await bt0.flush();
  }

  const bonusSnap = await planRows_(db.collection("bonusRecords")
    .where("projectId", "==", projectId).where("importBatchId", "==", importBatchId), planId);
  const bt = batcher_(db);
  for (const d of bonusSnap.docs) await bt.add(b => b.delete(d.ref));
  await bt.flush();

  await writeAudit_(db, {
    projectId, planId, action: "undoImport", periods, importBatchId,
    importFileName: recs[0]?.importFileName || "",
    operator: undoneBy || "", operatorKey: String(operatorKey), reason: "撤銷匯入",
    impact: { records: recs.length, bonuses: bonusSnap.size, units },
  });
  return { ok: true, periods, records: recs.length, bonuses: bonusSnap.size, units };
});

/* ==========================================================
 * 請佣總表 / 獎金表 PDF 產製
 * data: { projectId, docType: 'claim'|'bonus', payload }
 * payload 由前端組好（版型 config + 資料列），後端照畫（同 generateSalesGridPdf 模式）。
 * ========================================================== */
exports.generateCommissionPdf = onCall({
  region: REGION,
  timeoutSeconds: 120,
  memory: "512MiB",
}, async (request) => {
  const { projectId, docType, payload } = request.data || {};
  if (!projectId || !["claim", "bonus", "person"].includes(docType) || !payload) {
    throw new HttpsError("invalid-argument", "缺少 projectId、docType(claim|bonus|person) 或 payload。");
  }
  try {
    const { buildClaimPdf, buildBonusPdf, buildPersonPdf } = require("./commissionDocument");
    const builders = { claim: buildClaimPdf, bonus: buildBonusPdf, person: buildPersonPdf };
    const buffer = await builders[docType](payload);
    const MAX = 7 * 1024 * 1024;
    if (buffer.length > MAX) {
      throw new HttpsError("resource-exhausted", "PDF 檔案超過 7MB 上限，請減少期別資料量或分次匯出。");
    }
    return {
      ok: true,
      fileName: `${payload.fileName || "請佣獎金"}.pdf`,
      mimeType: "application/pdf",
      base64: buffer.toString("base64"),
    };
  } catch (error) {
    if (error instanceof HttpsError) throw error;
    console.error("[generateCommissionPdf] ERROR:", error);
    throw new HttpsError("internal", `PDF 產製失敗: ${error.message}`);
  }
});

/**
 * 寄送個人獎金明細 PDF
 * data: {
 *   projectId, projectName,
 *   to, personName, subject, body,          // body：純文字（換行以 \n）
 *   payload: { fileName, paper, orientation, grids, encrypt? }
 * }
 */
exports.sendCommissionPersonEmail = onCall({
  region: REGION,
  timeoutSeconds: 120,
  memory: "512MiB",
  secrets: ["SENDER_EMAIL", "GMAIL_APP_PASSWORD"],
}, async (request) => {
  // 本系統未使用 Firebase Auth 登入（request.auth 恆為空），比照同模組其他函式不檢查 auth；
  // 入口已由前端「請佣獎金」權限把關。
  const { projectId, projectName, to, personName, subject, body, payload } = request.data || {};
  if (!projectId || !payload || !Array.isArray(payload.grids) || !payload.grids.length) {
    throw new HttpsError("invalid-argument", "缺少 projectId 或 payload.grids。");
  }
  const email = String(to || "").trim();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new HttpsError("invalid-argument", `收件人 Email 格式不正確：${email || "(空白)"}`);
  }
  if (!process.env.SENDER_EMAIL || !process.env.GMAIL_APP_PASSWORD) {
    throw new HttpsError("failed-precondition", "系統未設定寄件信箱。");
  }
  try {
    const { buildPersonPdf } = require("./commissionDocument");
    const buffer = await buildPersonPdf(payload);
    const MAX = 7 * 1024 * 1024;
    if (buffer.length > MAX) throw new HttpsError("resource-exhausted", "PDF 超過 7MB 上限，請減少期別後再寄送。");

    const fileName = `${payload.fileName || "獎金明細"}.pdf`;
    const safeSubject = String(subject || `【${projectName || projectId}】獎金明細`).slice(0, 200);
    const text = String(body || "").slice(0, 5000);
    const html = `<div style="font-family:Arial,'Microsoft JhengHei',sans-serif;line-height:1.7;white-space:pre-wrap;">${escapeHtml_(text)}</div>
      <hr style="border:0;border-top:1px solid #eee;margin:20px 0;">
      <p style="font-size:12px;color:#888;">此為系統自動發送的郵件，請勿直接回覆。</p>`;

    const transport = nodemailer.createTransport({
      service: "gmail",
      auth: { user: process.env.SENDER_EMAIL, pass: process.env.GMAIL_APP_PASSWORD },
    });
    await transport.sendMail({
      from: `"安熙智慧系統" <${process.env.SENDER_EMAIL}>`,
      to: email,
      subject: safeSubject,
      text,
      html,
      attachments: [{ filename: fileName, content: buffer, contentType: "application/pdf" }],
    });
    console.log(`[sendCommissionPersonEmail] ${projectId} → ${personName || ""} <${email}> ${fileName} (${buffer.length} bytes, encrypted=${!!payload.encrypt?.userPassword})`);
    return { ok: true, to: email, fileName };
  } catch (error) {
    if (error instanceof HttpsError) throw error;
    console.error("[sendCommissionPersonEmail] ERROR:", error);
    throw new HttpsError("internal", `寄送失敗: ${error.message}`);
  }
});

function escapeHtml_(s) {
  return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
