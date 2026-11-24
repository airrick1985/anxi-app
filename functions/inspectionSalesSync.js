/**
 * 驗屋預約「戶別資料總表」手動同步銷控戶別資料
 *
 * - syncInspectionFromSales({ action: 'preview' })：比對 households 與 salesHouseholds，回傳差異清單
 * - syncInspectionFromSales({ action: 'apply' })：只寫入使用者勾選的差異／新增戶別
 *
 * 只有手動同步，沒有觸發器或排程；銷控資料不會被改動。
 *
 * 比對規則
 * - 戶別對應：戶號完全相同優先，其次忽略大小寫、空白與數字補零（A1-02 = A1-2），對不到唯一一戶就不對應
 * - 只有格式不同不算差異：電話的連字號、姓名／車位的分隔符號、車位編號補零
 * - 姓名、電話、身分證(驗證碼)：驗屋已包含銷控的內容（驗屋多記了共同買方、第二支電話）也不算差異，避免蓋掉較完整的資料
 * - 棟別不比對（兩個系統的分棟方式可能不同），只在新增戶別時帶入
 * - 銷控欄位空白時不覆蓋；銷控該戶沒有買方時，買方相關欄位標記為「清空」，由前端決定要不要套用
 * - 車位以 salesParkings 為準（戶別上的「持有車位」是過時快照）
 *
 * 套用時重新比對一次，差異內容與預覽時不同的項目略過（rev 不符），避免蓋掉預覽後才改的資料。
 * 每次同步寫一筆紀錄到 inspectionSalesSyncLogs（含覆蓋前的值）。
 */

const crypto = require('crypto');
const { HttpsError } = require('firebase-functions/v2/https');
// onCall 執行前先擋下已停用的操作者（人員管理一鍵停用）
const { onCall } = require('./utils/accountGuard');
const { Firestore, FieldValue } = require('@google-cloud/firestore');
const { normalizeSalespersons } = require('./utils/salesperson');
const { getUnitDealParkings } = require('./utils/salesStatusGroups');

const ADMIN_ROLES = ['超級管理員', '系統管理員'];
const EDIT_SYSTEM = '驗屋預約管理-修改';
const LOG_COLLECTION = 'inspectionSalesSyncLogs';
const BATCH_WRITE_LIMIT = 400;
const LOG_CHUNK_SIZE = 300;
const MAX_REQUEST_ITEMS = 30000;
const MAX_LISTED_UNITS = 300;

let dbInstance = null;
const getDb = () => dbInstance || (dbInstance = new Firestore({ databaseId: 'anxi-app' }));

// ───────────────────────── 字串處理 ─────────────────────────

/** 寫入用：只去頭尾空白，保留原本的寫法 */
const raw = (value) => (value === null || value === undefined ? '' : String(value).trim());
/** 比對用：全形轉半形、去頭尾空白 */
const norm = (value) => raw(value).normalize('NFKC').trim();
const compact = (value) => norm(value).replace(/\s+/g, '');

const NAME_SPLIT = /[/、,;&]+/;
const PHONE_SPLIT = /[,、;/]+/;
const ID_SPLIT = /[/\s,、;]+/;
const SPOT_SPLIT = /[,、;/\s]+/;

const uniq = (list) => [...new Set(list)];
const sameSet = (a, b) => {
  const left = uniq(a).sort();
  const right = uniq(b).sort();
  return left.length === right.length && left.every((v, i) => v === right[i]);
};
/** 驗屋（current）已包含銷控（next）的每一項 */
const covers = (current, next) => next.every(v => current.includes(v));

/** 忽略大小寫、空白與數字補零：A1-02、a1-2、Ａ１－２ 視為同一個 */
function looseKey(value) {
  return compact(value).toUpperCase().replace(/\d+/g, digits => digits.replace(/^0+(?=\d)/, ''));
}

const nameTokens = (value) => norm(value).split(NAME_SPLIT).map(compact).filter(Boolean);
const idTokens = (value) => norm(value).toUpperCase().split(ID_SPLIT).filter(Boolean);
const spotTokens = (value) => norm(value).split(SPOT_SPLIT).map(looseKey).filter(Boolean);

function phoneDigits(value) {
  const digits = norm(value).replace(/\D/g, '');
  return digits.startsWith('886') && digits.length > 9 ? `0${digits.slice(3)}` : digits;
}
const phoneTokens = (value) => norm(value).split(PHONE_SPLIT).map(phoneDigits).filter(Boolean);

/** 電話寫成驗屋慣用的純數字；含分機等其他文字時保留原樣 */
function cleanPhone(value) {
  const tokens = raw(Array.isArray(value) ? value.join(',') : value)
    .split(/[,，、;；]+/)
    .map((token) => {
      const stripped = token.normalize('NFKC').replace(/[\s\-()]/g, '');
      return /^\+?\d+$/.test(stripped) ? stripped : token.trim();
    })
    .filter(Boolean);
  return uniq(tokens).join(',');
}

const naturalCompare = (a, b) => String(a).localeCompare(String(b), 'zh-Hant', { numeric: true });

// ───────────────────────── 欄位定義 ─────────────────────────

const coBuyersOf = (unit) => (Array.isArray(unit?.coBuyers) ? unit.coBuyers.filter(Boolean) : []);

/** 買方姓名：主買方＋共同買方（銷控分開存，驗屋只有一個欄位） */
function salesBuyerName(unit) {
  const names = [raw(unit?.buyerName), ...coBuyersOf(unit).map(c => raw(c.name))].filter(Boolean);
  const seen = new Set();
  return names.filter((name) => {
    const tokens = nameTokens(name);
    if (!tokens.length || tokens.every(t => seen.has(t))) return false;
    tokens.forEach(t => seen.add(t));
    return true;
  }).join('、');
}

/** 身分證(驗證碼)：驗屋以「/」分隔多組，任一組都能通過預約驗證 */
function salesIdNumbers(unit) {
  const ids = [unit?.buyerIdNumber, ...coBuyersOf(unit).map(c => c.idNumber)]
    .flatMap(v => raw(v).split(/[/／\s,，、;；]+/))
    .map(v => v.trim())
    .filter(Boolean);
  const seen = new Set();
  return ids.filter((id) => {
    const key = id.normalize('NFKC').toUpperCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  }).join('/');
}

function salesParkingLots(unit, parkings) {
  const spots = getUnitDealParkings(unit?.unitId, parkings, unit?.salesStatus_backend)
    .map(p => raw(p.spotId))
    .filter(Boolean);
  return uniq(spots).sort(naturalCompare).join(',');
}

/**
 * key：驗屋 households 的欄位；read：從銷控戶別取出要寫入的值；same(驗屋值, 銷控值)：是否視為相同；
 * buyerOwned：銷控該戶沒有買方時可清空
 */
const FIELDS = [
  { key: 'buyerName', label: '買方姓名', buyerOwned: true, read: unit => salesBuyerName(unit), same: (a, b) => covers(nameTokens(a), nameTokens(b)) },
  { key: 'buyerPhone', label: '買方電話', buyerOwned: true, read: unit => cleanPhone(unit?.buyerPhone), same: (a, b) => covers(phoneTokens(a), phoneTokens(b)) },
  { key: 'buyerEmail', label: '買方Email', buyerOwned: true, read: unit => raw(unit?.buyerEmail), same: (a, b) => norm(a).toLowerCase() === norm(b).toLowerCase() },
  { key: 'buyerIdNumber', label: '買方身分證(驗證碼)', buyerOwned: true, read: unit => salesIdNumbers(unit), same: (a, b) => covers(idTokens(a), idTokens(b)) },
  { key: 'salesperson', label: '銷售人員', buyerOwned: true, list: true, read: unit => normalizeSalespersons(unit?.salesperson), same: (a, b) => sameSet(normalizeSalespersons(a), normalizeSalespersons(b)) },
  { key: 'parkingLots', label: '車位', buyerOwned: true, read: (unit, parkings) => salesParkingLots(unit, parkings), same: (a, b) => sameSet(spotTokens(a), spotTokens(b)) },
  { key: 'address', label: '門牌', read: unit => raw(unit?.doorplate), same: (a, b) => compact(a) === compact(b) },
];
const FIELD_BY_KEY = new Map(FIELDS.map(f => [f.key, f]));

const displayOf = (field, value) => {
  if (field.list) return normalizeSalespersons(value).join('、');
  return Array.isArray(value) ? value.map(raw).filter(Boolean).join('、') : raw(value);
};
const isBlank = (field, value) => displayOf(field, value) === '';
const emptyOf = (field) => (field.list ? [] : '');

function revOf(fieldKey, before, after, clear) {
  return crypto.createHash('sha1')
    .update(JSON.stringify([fieldKey, before, after, !!clear]))
    .digest('hex')
    .slice(0, 12);
}

// ───────────────────────── 比對 ─────────────────────────

/** 驗屋戶別 → 銷控戶別的對應；一對一，對不到唯一一戶就不對應 */
function matchUnits(households, salesUnits) {
  const salesById = new Map();
  const salesByLoose = new Map();
  for (const unit of salesUnits) {
    const id = raw(unit.data.unitId);
    if (!salesById.has(id)) salesById.set(id, unit);
    const key = looseKey(id);
    if (!salesByLoose.has(key)) salesByLoose.set(key, []);
    salesByLoose.get(key).push(unit);
  }
  const householdsByLoose = new Map();
  for (const h of households) {
    const key = looseKey(h.data.unitId);
    householdsByLoose.set(key, (householdsByLoose.get(key) || 0) + 1);
  }

  const pairs = new Map(); // household docId → sales unit
  const used = new Set(); // sales docId
  for (const h of households) {
    const exact = salesById.get(raw(h.data.unitId));
    if (exact && !used.has(exact.docId)) {
      pairs.set(h.docId, exact);
      used.add(exact.docId);
    }
  }
  for (const h of households) {
    if (pairs.has(h.docId)) continue;
    const key = looseKey(h.data.unitId);
    const candidates = (salesByLoose.get(key) || []).filter(u => !used.has(u.docId));
    if (candidates.length !== 1 || householdsByLoose.get(key) !== 1) continue;
    pairs.set(h.docId, candidates[0]);
    used.add(candidates[0].docId);
  }
  return { pairs, used };
}

function diffUnit(household, salesUnit, parkings) {
  const hasBuyer = salesBuyerName(salesUnit) !== '';
  const diffs = [];
  for (const field of FIELDS) {
    const current = household[field.key];
    const next = field.read(salesUnit, parkings);
    const before = displayOf(field, current);
    if (isBlank(field, next)) {
      // 銷控空白不覆蓋；只有整戶沒有買方（未售／退戶）時才提出清空
      if (!field.buyerOwned || hasBuyer || before === '') continue;
      diffs.push({ field: field.key, before, after: '', clear: true, value: emptyOf(field), previous: current ?? null, rev: revOf(field.key, before, '', true) });
      continue;
    }
    if (before !== '' && field.same(current, next)) continue;
    const after = displayOf(field, next);
    diffs.push({ field: field.key, before, after, clear: false, value: next, previous: current ?? null, rev: revOf(field.key, before, after, false) });
  }
  return diffs;
}

/**
 * @param {{docId: string, data: object}[]} households 驗屋戶別
 * @param {{docId: string, data: object}[]} salesUnits 銷控戶別
 * @param {object[]} parkings 銷控車位
 */
function buildSyncPlan({ projectId, households, salesUnits, parkings }) {
  const { pairs, used } = matchUnits(households, salesUnits);
  const takenDocIds = new Set(households.map(h => h.docId));

  const units = [];
  const inspectionOnly = [];
  for (const h of households) {
    const salesUnit = pairs.get(h.docId);
    if (!salesUnit) {
      inspectionOnly.push(raw(h.data.unitId) || h.docId);
      continue;
    }
    const diffs = diffUnit(h.data, salesUnit.data, parkings);
    if (!diffs.length) continue;
    units.push({
      key: h.docId,
      unitId: raw(h.data.unitId),
      salesUnitId: raw(salesUnit.data.unitId),
      building: raw(h.data.building) || raw(salesUnit.data.building),
      diffs,
    });
  }

  const additions = [];
  const blocked = []; // 無法新增：戶號不能當文件 ID，或文件 ID 已被其他戶別使用
  for (const unit of salesUnits) {
    if (used.has(unit.docId)) continue;
    const unitId = raw(unit.data.unitId);
    const docId = `${projectId}_${unitId}`;
    if (!unitId || /[/\\]/.test(unitId) || takenDocIds.has(docId)) {
      blocked.push(unitId || unit.docId);
      continue;
    }
    takenDocIds.add(docId);
    const values = [];
    for (const field of FIELDS) {
      const value = field.read(unit.data, parkings);
      if (isBlank(field, value)) continue;
      values.push({ field: field.key, after: displayOf(field, value), value });
    }
    additions.push({ key: unitId, docId, unitId, building: raw(unit.data.building), values });
  }

  const byUnit = (a, b) => naturalCompare(a.building, b.building) || naturalCompare(a.unitId, b.unitId);
  units.sort(byUnit);
  additions.sort(byUnit);
  inspectionOnly.sort(naturalCompare);
  blocked.sort(naturalCompare);

  return {
    units,
    additions,
    inspectionOnly,
    blocked,
    counts: {
      sales: salesUnits.length,
      inspection: households.length,
      matched: pairs.size,
      inspectionOnly: inspectionOnly.length,
    },
  };
}

// ───────────────────────── 資料存取 ─────────────────────────

function requireProjectId(value) {
  const id = typeof value === 'string' ? value.trim() : '';
  if (!id || id.length > 100 || /[/\\]/.test(id)) throw new HttpsError('invalid-argument', '建案識別不正確。');
  return id;
}

async function getAccess(db, userKey, projectId) {
  const key = raw(userKey);
  if (!key || key.includes('/')) throw new HttpsError('unauthenticated', '缺少使用者識別，請重新登入。');
  const [userSnap, permSnap] = await Promise.all([
    db.collection('users').doc(key).get(),
    db.collection('userPermissions').doc(key).get(),
  ]);
  if (!userSnap.exists) throw new HttpsError('permission-denied', '找不到使用者資料。');
  const user = userSnap.data() || {};
  const roles = Array.isArray(user.roles) ? user.roles : [];
  const systems = permSnap.exists ? (permSnap.data()?.permissions?.[projectId]?.systems || []) : [];
  if (!roles.some(r => ADMIN_ROLES.includes(r)) && !systems.includes(EDIT_SYSTEM)) {
    throw new HttpsError('permission-denied', `您沒有此建案的「${EDIT_SYSTEM}」權限。`);
  }
  return { userKey: key, name: raw(user.name) || key };
}

async function loadPlan(db, projectId) {
  const byProject = name => db.collection(name).where('projectId', '==', projectId).get();
  const [householdSnap, salesSnap, parkingSnap] = await Promise.all([
    byProject('households'), byProject('salesHouseholds'), byProject('salesParkings'),
  ]);
  const toRows = snap => snap.docs.map(d => ({ docId: d.id, data: d.data() || {} }));
  return buildSyncPlan({
    projectId,
    households: toRows(householdSnap),
    salesUnits: toRows(salesSnap).filter(u => raw(u.data.unitId)),
    parkings: parkingSnap.docs.map(d => d.data() || {}),
  });
}

const toMillis = (value) => {
  if (!value) return 0;
  if (typeof value.toMillis === 'function') return value.toMillis();
  if (value instanceof Date) return value.getTime();
  return Number(value) || 0;
};

async function loadLastSync(db, projectId) {
  // 單一條件查詢後在記憶體取最新一筆，不需要另建複合索引
  const snap = await db.collection(LOG_COLLECTION).where('projectId', '==', projectId).get();
  let latest = null;
  for (const doc of snap.docs) {
    const data = doc.data() || {};
    const at = toMillis(data.createdAt) || Number(data.createdAtMs) || 0;
    if (!latest || at > latest.at) {
      latest = { at, operatorName: raw(data.operatorName), updatedUnits: Number(data.updatedUnits) || 0, addedUnits: Number(data.addedUnits) || 0 };
    }
  }
  return latest;
}

// ───────────────────────── 預覽 ─────────────────────────

async function previewCore(db, { projectId }) {
  const [plan, lastSync] = await Promise.all([loadPlan(db, projectId), loadLastSync(db, projectId)]);
  return {
    status: 'success',
    fields: FIELDS.map(f => ({ key: f.key, label: f.label })),
    counts: plan.counts,
    units: plan.units.map(u => ({
      key: u.key,
      unitId: u.unitId,
      salesUnitId: u.salesUnitId,
      building: u.building,
      diffs: u.diffs.map(d => ({ field: d.field, before: d.before, after: d.after, clear: d.clear, rev: d.rev })),
    })),
    additions: plan.additions.map(a => ({
      key: a.key,
      unitId: a.unitId,
      building: a.building,
      values: a.values.map(v => ({ field: v.field, after: v.after })),
    })),
    inspectionOnly: plan.inspectionOnly.slice(0, MAX_LISTED_UNITS),
    blocked: plan.blocked.slice(0, MAX_LISTED_UNITS),
    lastSync,
  };
}

// ───────────────────────── 套用 ─────────────────────────

function parseApplyRequest(data) {
  const changes = Array.isArray(data?.changes) ? data.changes : [];
  const additions = Array.isArray(data?.additions) ? data.additions : [];
  const addFields = Array.isArray(data?.addFields) ? data.addFields : [];
  if (changes.length + additions.length === 0) throw new HttpsError('invalid-argument', '沒有選取要同步的項目。');
  if (changes.length + additions.length > MAX_REQUEST_ITEMS) throw new HttpsError('invalid-argument', '一次同步的項目過多，請分批處理。');
  return {
    changes: changes.map(c => ({ key: raw(c?.key), field: raw(c?.field), rev: raw(c?.rev) })),
    additions: uniq(additions.map(raw).filter(Boolean)),
    addFields: new Set(addFields.map(raw).filter(k => FIELD_BY_KEY.has(k))),
  };
}

async function commitInChunks(db, writes) {
  for (let i = 0; i < writes.length; i += BATCH_WRITE_LIMIT) {
    const batch = db.batch();
    for (const w of writes.slice(i, i + BATCH_WRITE_LIMIT)) {
      if (w.merge) batch.set(w.ref, w.data, { merge: true });
      else batch.update(w.ref, w.data);
    }
    await batch.commit();
  }
}

async function writeLog(db, { projectId, access, summary, entries, now }) {
  const logRef = db.collection(LOG_COLLECTION).doc();
  const parts = [];
  for (let i = 0; i < entries.length; i += LOG_CHUNK_SIZE) parts.push(entries.slice(i, i + LOG_CHUNK_SIZE));
  await logRef.set({
    projectId,
    operatorKey: access.userKey,
    operatorName: access.name,
    createdAt: FieldValue.serverTimestamp(),
    createdAtMs: now,
    ...summary,
    parts: parts.length,
  });
  // 明細含覆蓋前的值，供日後查核或還原
  for (let i = 0; i < parts.length; i += 1) {
    await logRef.collection('changes').doc(String(i).padStart(4, '0')).set({ index: i, items: parts[i] });
  }
  return logRef.id;
}

async function applyCore(db, { projectId, access, data, now = Date.now() }) {
  const request = parseApplyRequest(data);
  const plan = await loadPlan(db, projectId);
  const unitByKey = new Map(plan.units.map(u => [u.key, u]));
  const additionByKey = new Map(plan.additions.map(a => [a.key, a]));

  let stale = 0;
  const updates = new Map(); // docId → { unit, fields: Map<field, diff> }
  for (const change of request.changes) {
    const unit = unitByKey.get(change.key);
    const diff = unit?.diffs.find(d => d.field === change.field);
    if (!diff || diff.rev !== change.rev) {
      stale += 1;
      continue;
    }
    if (!updates.has(unit.key)) updates.set(unit.key, { unit, fields: new Map() });
    updates.get(unit.key).fields.set(diff.field, diff);
  }

  const writes = [];
  const entries = [];
  const fieldCounts = {};
  const households = db.collection('households');
  let updatedFields = 0;

  for (const { unit, fields } of updates.values()) {
    const payload = { updatedAt: FieldValue.serverTimestamp() };
    for (const diff of fields.values()) {
      payload[diff.field] = diff.value;
      fieldCounts[diff.field] = (fieldCounts[diff.field] || 0) + 1;
      updatedFields += 1;
      entries.push({ type: 'update', docId: unit.key, unitId: unit.unitId, field: diff.field, before: diff.previous, after: diff.value });
    }
    writes.push({ ref: households.doc(unit.key), data: payload });
  }

  let addedUnits = 0;
  for (const key of request.additions) {
    const addition = additionByKey.get(key);
    if (!addition) {
      stale += 1;
      continue;
    }
    const payload = {
      projectId,
      unitId: addition.unitId,
      building: addition.building,
      showInMenu: false,
      initialReportUploadSwitch: false,
      reInspectionReportUploadSwitch: false,
      updatedAt: FieldValue.serverTimestamp(),
    };
    const written = {};
    for (const item of addition.values) {
      if (!request.addFields.has(item.field)) continue;
      payload[item.field] = item.value;
      written[item.field] = item.value;
    }
    writes.push({ ref: households.doc(addition.docId), data: payload, merge: true });
    entries.push({ type: 'add', docId: addition.docId, unitId: addition.unitId, values: written });
    addedUnits += 1;
  }

  if (!writes.length) {
    return { status: 'success', updatedUnits: 0, updatedFields: 0, addedUnits: 0, staleCount: stale };
  }

  await commitInChunks(db, writes);

  const summary = { updatedUnits: updates.size, updatedFields, addedUnits, staleCount: stale, fieldCounts };
  let logId = null;
  try {
    logId = await writeLog(db, { projectId, access, summary, entries, now });
  } catch (error) {
    // 資料已寫入，紀錄失敗不讓整個同步變成失敗
    console.error(`[syncInspectionFromSales] 寫入同步紀錄失敗 (project ${projectId}):`, error);
  }
  return { status: 'success', updatedUnits: updates.size, updatedFields, addedUnits, staleCount: stale, logId };
}

async function syncInspectionFromSalesCore(db, data) {
  const projectId = requireProjectId(data?.projectId);
  const access = await getAccess(db, data?.userKey, projectId);
  const action = raw(data?.action) || 'preview';
  if (action === 'preview') return previewCore(db, { projectId });
  if (action === 'apply') return applyCore(db, { projectId, access, data });
  throw new HttpsError('invalid-argument', '不支援的操作。');
}

exports.syncInspectionFromSales = onCall({ region: 'asia-east1', memory: '512MiB', timeoutSeconds: 300 }, async (request) => {
  try {
    return await syncInspectionFromSalesCore(getDb(), request.data || {});
  } catch (error) {
    if (error instanceof HttpsError) throw error;
    console.error('[syncInspectionFromSales] 失敗:', error);
    throw new HttpsError('internal', `同步銷控資料失敗：${error.message}`);
  }
});

// 供測試使用
exports.FIELDS = FIELDS;
exports.looseKey = looseKey;
exports.cleanPhone = cleanPhone;
exports.buildSyncPlan = buildSyncPlan;
exports.syncInspectionFromSalesCore = syncInspectionFromSalesCore;
