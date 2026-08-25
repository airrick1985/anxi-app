/**
 * 請佣獎金系統 後端（docs/請佣獎金系統-spec.md）
 *
 * - submitCommissionEntries：送出請佣（transaction 驗證比例上限＋伺服器端重算金額）
 * - voidCommissionRecord：作廢請佣紀錄（比例回溯、關聯獎金明細連動作廢）
 * - importCommissionHistory：歷史資料批次匯入（source: 'import'）
 * - generateCommissionPdf：請佣總表 / 獎金表 PDF 產製
 *
 * 比例累計以 commissionUnitLedgers/{projectId}_{unitId} 為準（transaction 內讀寫，防並發超額）。
 */

const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { Firestore, FieldValue } = require("@google-cloud/firestore");
const { formatInTimeZone } = require("date-fns-tz");
const calc = require("./utils/commissionCalculation");

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

function ledgerId_(projectId, unitId) {
  return `${projectId}_${unitId}`;
}

/** 讀取建案的請佣設定（合併預設值） */
async function loadSettings_(db, projectId) {
  const snap = await db.collection("commissionSettings").doc(projectId).get();
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
  if (!Number.isFinite(period) || period <= 0) return `戶別 ${entry.unitId}：期別必須為正整數`;
  const ratio = Number(entry.ratioPct);
  if (!Number.isFinite(ratio) || ratio <= 0 || ratio > 100) return `戶別 ${entry.unitId}：本次請佣比例須介於 0～100`;
  return null;
}

/* ==========================================================
 * 送出請佣
 * data: {
 *   projectId, createdBy,
 *   entries: [{
 *     unitId, period, requestDate, ratioPct, commPct, keepPct,
 *     partyAFee, partyBFee, teamSiteKeys: [],
 *     categories: { [catKey]: { ratePct, allocations: [{ personKey, name, sourceProjectId, sourceProjectName, isExternal, mode, sharePct, lockedAmount }] } },
 *     personProfiles: { [personKey]: { name, role, keepPct, taxPct, nhiPct, remark } }
 *   }]
 * }
 * ========================================================== */
exports.submitCommissionEntries = onCall({
  region: REGION,
  timeoutSeconds: 120,
  memory: "512MiB",
}, async (request) => {
  const { projectId, entries, createdBy } = request.data || {};
  if (!projectId || !Array.isArray(entries) || entries.length === 0) {
    throw new HttpsError("invalid-argument", "缺少 projectId 或 entries。");
  }
  for (const entry of entries) {
    const err = validateEntry_(entry);
    if (err) throw new HttpsError("invalid-argument", err);
  }

  const db = db_();
  const settings = await loadSettings_(db, projectId);
  const parkings = await loadParkings_(db, projectId);

  // 逐戶讀取戶別資料並在伺服器端重算（不信任前端金額）
  const prepared = [];
  for (const entry of entries) {
    const unitDocId = `${projectId}_${entry.unitId}`;
    const unitSnap = await db.collection("salesHouseholds").doc(unitDocId).get();
    if (!unitSnap.exists) {
      throw new HttpsError("not-found", `找不到戶別資料：${entry.unitId}`);
    }
    const unit = unitSnap.data();
    const finance = calc.computeUnitFinance({ ...unit, unitId: entry.unitId }, parkings);
    const isPreferred = !!unit.isPreferredPayment;

    const commPct = (entry.commPct === undefined || entry.commPct === null || entry.commPct === "")
      ? calc.resolveCommPct(settings, isPreferred)
      : Number(entry.commPct);
    const keepPct = (entry.keepPct === undefined || entry.keepPct === null || entry.keepPct === "")
      ? calc.toNum(settings.defaultKeepPct)
      : Number(entry.keepPct);

    const input = {
      ratioPct: Number(entry.ratioPct),
      commPct,
      keepPct,
      partyAFee: calc.toNum(entry.partyAFee),
      partyBFee: calc.toNum(entry.partyBFee),
      categories: entry.categories || {},
    };
    const result = calc.calcUnitBonus(finance, input, entry.personProfiles || {});
    if (result.errors.length) {
      const msg = result.errors.map(e => `${e.catKey}：${e.error}`).join("；");
      throw new HttpsError("invalid-argument", `戶別 ${entry.unitId} 分配驗證未通過：${msg}`);
    }

    prepared.push({ entry, unit, finance, input, result, isPreferred });
  }

  // 預估寫入量（每戶 1 請佣紀錄 + N 獎金明細 + 1 ledger），transaction 上限 500
  const totalWrites = prepared.reduce((s, p) => s + 1 + p.result.people.length, 0) + prepared.length;
  if (totalWrites > 450) {
    throw new HttpsError("invalid-argument", `本次寫入量過大（${totalWrites} 筆），請分批送出（建議一次少於 20 戶）。`);
  }

  const stamp = nowStamp_();
  const results = [];

  await db.runTransaction(async (tx) => {
    results.length = 0;   // transaction 可能重試，避免結果重複累加
    // 1) 讀取所有戶別 ledger 並驗證比例
    const ratioAdd = {};   // unitId -> 本次合計新增比例
    prepared.forEach(p => {
      ratioAdd[p.entry.unitId] = (ratioAdd[p.entry.unitId] || 0) + Number(p.entry.ratioPct);
    });
    const ledgerRefs = {};
    const ledgerVals = {};
    for (const unitId of Object.keys(ratioAdd)) {
      const ref = db.collection("commissionUnitLedgers").doc(ledgerId_(projectId, unitId));
      ledgerRefs[unitId] = ref;
      const snap = await tx.get(ref);
      const existing = snap.exists ? calc.toNum(snap.data().claimedRatioPct) : 0;
      if (existing + ratioAdd[unitId] > 100.0001) {
        throw new HttpsError("failed-precondition",
          `戶別 ${unitId}「已請 ${Math.round(existing * 10) / 10}% ＋ 本次 ${ratioAdd[unitId]}%」超過 100%，未寫入任何資料。`);
      }
      ledgerVals[unitId] = existing;
    }

    // 2) 寫入
    prepared.forEach(p => {
      const { entry, unit, finance, input, result } = p;
      const recordId = `${projectId}_${entry.unitId}_${entry.period}_${stamp}${rand3_()}`;
      const recordRef = db.collection("commissionRecords").doc(recordId);

      tx.set(recordRef, {
        projectId,
        unitId: entry.unitId,
        period: Number(entry.period),
        status: "active",
        requestDate: entry.requestDate || formatInTimeZone(new Date(), "Asia/Taipei", "yyyy/MM/dd"),
        ratioPct: input.ratioPct,
        commPct: input.commPct,
        keepPct: input.keepPct,
        partyAFee: input.partyAFee,
        partyBFee: input.partyBFee,
        teamSiteKeys: Array.isArray(entry.teamSiteKeys) ? entry.teamSiteKeys : [],
        snapshot: {
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
        categories: entry.categories || {},
        source: "system",
        createdAt: FieldValue.serverTimestamp(),
        createdBy: createdBy || "",
      });

      result.people.forEach(person => {
        const bonusId = `${recordId}_${person.personKey}`;
        const bonusRef = db.collection("bonusRecords").doc(bonusId);
        tx.set(bonusRef, {
          projectId,
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
          source: "system",
          createdAt: FieldValue.serverTimestamp(),
          createdBy: createdBy || "",
        });
      });

      results.push({ unitId: entry.unitId, period: Number(entry.period), recordId, people: result.people.length });
    });

    // 3) 更新 ledger
    Object.keys(ratioAdd).forEach(unitId => {
      tx.set(ledgerRefs[unitId], {
        projectId,
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
  const { projectId, recordId, voidReason, voidedBy } = request.data || {};
  if (!projectId || !recordId) {
    throw new HttpsError("invalid-argument", "缺少 projectId 或 recordId。");
  }

  const db = db_();
  const recordRef = db.collection("commissionRecords").doc(recordId);

  let unitId = "";
  await db.runTransaction(async (tx) => {
    const snap = await tx.get(recordRef);
    if (!snap.exists) throw new HttpsError("not-found", "找不到此請佣紀錄。");
    const rec = snap.data();
    if (rec.projectId !== projectId) throw new HttpsError("permission-denied", "紀錄不屬於此建案。");
    if (rec.status === "voided") throw new HttpsError("failed-precondition", "此紀錄已作廢，不可重複作廢。");
    unitId = rec.unitId;

    const ledgerRef = db.collection("commissionUnitLedgers").doc(ledgerId_(projectId, rec.unitId));
    const ledgerSnap = await tx.get(ledgerRef);
    const existing = ledgerSnap.exists ? calc.toNum(ledgerSnap.data().claimedRatioPct) : 0;
    const next = Math.max(0, Math.round((existing - calc.toNum(rec.ratioPct)) * 1000) / 1000);

    tx.update(recordRef, {
      status: "voided",
      voidedAt: FieldValue.serverTimestamp(),
      voidedBy: voidedBy || "",
      voidReason: voidReason || "",
    });
    tx.set(ledgerRef, {
      projectId,
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
 *              snapshot: {...}, calc: {...}, categories: {...} }],
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
  const { projectId, claims, bonuses, createdBy } = request.data || {};
  if (!projectId || !Array.isArray(claims) || claims.length === 0) {
    throw new HttpsError("invalid-argument", "缺少 projectId 或 claims。");
  }
  const bonusList = Array.isArray(bonuses) ? bonuses : [];

  const db = db_();

  // 驗證每戶比例累計（含既有 ledger）
  const ratioAdd = {};
  claims.forEach(c => {
    if (!c.unitId || !Number.isFinite(Number(c.period))) {
      throw new HttpsError("invalid-argument", `匯入資料缺少 unitId 或期別（${c.unitId || "?"}）。`);
    }
    ratioAdd[c.unitId] = (ratioAdd[c.unitId] || 0) + calc.toNum(c.ratioPct);
  });
  const ledgerBase = {};
  for (const unitId of Object.keys(ratioAdd)) {
    const snap = await db.collection("commissionUnitLedgers").doc(ledgerId_(projectId, unitId)).get();
    const existing = snap.exists ? calc.toNum(snap.data().claimedRatioPct) : 0;
    if (existing + ratioAdd[unitId] > 100.0001) {
      throw new HttpsError("failed-precondition",
        `戶別 ${unitId} 匯入後累計比例將超過 100%（既有 ${existing}% ＋ 匯入 ${ratioAdd[unitId]}%），未寫入任何資料。`);
    }
    ledgerBase[unitId] = existing;
  }

  const stamp = nowStamp_();
  const claimIds = [];
  let batch = db.batch();
  let ops = 0;
  const flush = async () => {
    if (ops > 0) { await batch.commit(); batch = db.batch(); ops = 0; }
  };
  const add = async (fn) => {
    fn(batch);
    ops++;
    if (ops >= 450) await flush();
  };

  // 寫入請佣紀錄
  for (let i = 0; i < claims.length; i++) {
    const c = claims[i];
    const recordId = `${projectId}_${c.unitId}_${c.period}_${stamp}${rand3_()}${i}`;
    claimIds.push(recordId);
    await add(b => b.set(db.collection("commissionRecords").doc(recordId), {
      projectId,
      unitId: c.unitId,
      period: Number(c.period),
      status: "active",
      requestDate: c.requestDate || "",
      ratioPct: calc.toNum(c.ratioPct),
      commPct: calc.toNum(c.commPct),
      keepPct: c.keepPct === undefined ? 10 : calc.toNum(c.keepPct),
      partyAFee: calc.toNum(c.partyAFee),
      partyBFee: calc.toNum(c.partyBFee),
      teamSiteKeys: [],
      snapshot: c.snapshot || {},
      calc: c.calc || {},
      categories: c.categories || {},
      source: "import",
      createdAt: FieldValue.serverTimestamp(),
      createdBy: createdBy || "",
    }));
  }

  // 寫入獎金明細
  for (let i = 0; i < bonusList.length; i++) {
    const bRow = bonusList[i];
    const recordId = claimIds[bRow.claimIndex] || "";
    const personKey = bRow.personKey || bRow.name || `p${i}`;
    const bonusId = `${projectId}_${bRow.unitId}_${bRow.period}_${personKey}_${stamp}${i}`;
    await add(b => b.set(db.collection("bonusRecords").doc(bonusId), {
      projectId,
      unitId: bRow.unitId,
      period: Number(bRow.period),
      status: "active",
      commissionRecordId: recordId,
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
      createdAt: FieldValue.serverTimestamp(),
      createdBy: createdBy || "",
    }));
  }

  // 更新 ledger
  for (const unitId of Object.keys(ratioAdd)) {
    await add(b => b.set(db.collection("commissionUnitLedgers").doc(ledgerId_(projectId, unitId)), {
      projectId,
      unitId,
      claimedRatioPct: Math.round((ledgerBase[unitId] + ratioAdd[unitId]) * 1000) / 1000,
      updatedAt: FieldValue.serverTimestamp(),
    }, { merge: true }));
  }
  await flush();

  return { ok: true, claims: claims.length, bonuses: bonusList.length };
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
  if (!projectId || !["claim", "bonus"].includes(docType) || !payload) {
    throw new HttpsError("invalid-argument", "缺少 projectId、docType(claim|bonus) 或 payload。");
  }
  try {
    const { buildClaimPdf, buildBonusPdf } = require("./commissionDocument");
    const buffer = docType === "claim"
      ? await buildClaimPdf(payload)
      : await buildBonusPdf(payload);
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
