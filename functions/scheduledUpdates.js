// 排程更新（指定時間更新資料）：調價排程、Excel 排程、每分鐘執行、LINE 通知、一鍵還原
//
// 集合 scheduledUpdates/{jobId}
//   type: 'price' | 'excel'
//   status: pending → running → done → reverting → reverted；cancelled；failed
//   子集合 items/{householdDocId}：Excel 排程建立時保存的欄位異動 { unitId, docId, fields: { 欄位: { from, to } } }
//   子集合 changes/{h_docId | p_docId}：執行時實際寫入的異動（還原依據；重試時已寫入的不再重寫）
//
// 未售判斷、尾數規則見 utils/scheduledPricePlan.js；Excel 衝突與還原規則見 utils/scheduledUpdateDiff.js

const { onCall, HttpsError } = require('firebase-functions/v2/https');
const { onSchedule } = require('firebase-functions/v2/scheduler');
const { Firestore, FieldPath, FieldValue, Timestamp } = require('@google-cloud/firestore');
const axios = require('axios');
const { getEligibleRecipients } = require('./utils/getEligibleRecipients');
const { shouldBlockOutbound } = require('./utils/trialGuard');
const { normalizeHouseholdUploadRow } = require('./utils/householdUploadRow');
const {
  normalizePriceConfig, planPriceUpdate, describePriceConfig, hasPriceAdjustment, householdStatus,
} = require('./utils/scheduledPricePlan');
const { buildExcelDiff, finalizeHouseholdUpdate, planExcelApply, planRevert } = require('./utils/scheduledUpdateDiff');

const COLLECTION = 'scheduledUpdates';
const MANAGE_SYSTEM = '銷控系統';
const ADMIN_ROLES = ['超級管理員', '系統管理員'];
const MAX_ATTEMPTS = 3;
const LEASE_MS = 9 * 60 * 1000; // 略長於排程逾時 540 秒
const ITEMS_PER_BATCH = 200; // 每筆異動＝資料寫入＋異動紀錄兩個操作
const SKIP_LIMIT = 500;
const MAX_EXCEL_ROWS = 3000;
const LINE_SECRETS = ['ANXISMART_LINE_CRM_TOKEN'];
const LINE_MULTICAST_URL = 'https://api.line.me/v2/bot/message/multicast';

let dbInstance = null;
const getDb = () => dbInstance || (dbInstance = new Firestore({ databaseId: 'anxi-app' }));
const jobsCol = (db) => db.collection(COLLECTION);
const text = (v) => (v === null || v === undefined ? '' : String(v).trim());
const serverTime = () => FieldValue.serverTimestamp();

// ───────────────────────── 共用 ─────────────────────────

async function getAccess(db, userKey, projectId) {
  const key = text(userKey);
  if (!key) throw new HttpsError('unauthenticated', '缺少使用者識別。');
  if (!text(projectId)) throw new HttpsError('invalid-argument', '缺少建案。');
  const [userSnap, permSnap] = await Promise.all([
    db.collection('users').doc(key).get(),
    db.collection('userPermissions').doc(key).get(),
  ]);
  if (!userSnap.exists) throw new HttpsError('permission-denied', '找不到使用者資料。');
  const user = userSnap.data() || {};
  const roles = Array.isArray(user.roles) ? user.roles : [];
  const systems = permSnap.exists ? (permSnap.data()?.permissions?.[projectId]?.systems || []) : [];
  if (!roles.some(r => ADMIN_ROLES.includes(r)) && !systems.includes(MANAGE_SYSTEM)) {
    throw new HttpsError('permission-denied', '您沒有此建案的「銷控系統」權限。');
  }
  return { userKey: key, name: text(user.name) || key };
}

async function loadHouseholds(db, projectId) {
  const snap = await db.collection('salesHouseholds').where('projectId', '==', projectId).get();
  return snap.docs.map(d => ({ docId: d.id, data: d.data() || {} })).filter(h => text(h.data.unitId));
}

async function loadParkings(db, projectId) {
  const snap = await db.collection('salesParkings').where('projectId', '==', projectId).get();
  return snap.docs.map(d => ({ docId: d.id, data: d.data() || {} })).filter(p => text(p.data.spotId));
}

function indexBy(list, keyOf) {
  const map = new Map();
  for (const item of list) {
    const key = keyOf(item);
    if (key && !map.has(key)) map.set(key, item);
  }
  return map;
}

/** Firestore 值轉成可回傳前端的純資料；時間轉 { _ts: 毫秒 } */
function toPlain(v) {
  if (v === null || v === undefined) return null;
  if (v instanceof Timestamp || (v && typeof v.toMillis === 'function')) return { _ts: v.toMillis() };
  if (v instanceof Date) return { _ts: v.getTime() };
  if (Array.isArray(v)) return v.map(toPlain);
  if (typeof v === 'object') {
    const out = {};
    for (const [k, val] of Object.entries(v)) out[k] = toPlain(val);
    return out;
  }
  return v;
}

const millisOf = (v) => (v && typeof v.toMillis === 'function' ? v.toMillis() : null);

function serializeJob(id, job) {
  const plain = toPlain(job);
  for (const key of ['runAt', 'createdAt', 'updatedAt', 'startedAt', 'finishedAt', 'leaseUntil']) {
    plain[key] = millisOf(job[key]);
  }
  if (job.revert) plain.revert = { ...toPlain(job.revert), at: millisOf(job.revert.at) };
  return { id, ...plain };
}

function parseRunAt(value) {
  const ms = Number(value);
  if (!Number.isFinite(ms) || ms <= 0) throw new HttpsError('invalid-argument', '請設定執行時間。');
  const minute = Math.floor(ms / 60000) * 60000;
  if (minute <= Date.now()) throw new HttpsError('invalid-argument', '執行時間必須晚於現在。');
  if (minute > Date.now() + 366 * 24 * 3600 * 1000) throw new HttpsError('invalid-argument', '執行時間不可超過一年。');
  return Timestamp.fromMillis(minute);
}

function sanitizeKeys(list, limit = 200) {
  if (!Array.isArray(list)) return [];
  return [...new Set(list.map(text).filter(Boolean))].slice(0, limit);
}

function formatTaipei(ms) {
  if (!ms) return '';
  const p = Object.fromEntries(new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Taipei', year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
  }).formatToParts(new Date(ms)).map(x => [x.type, x.value]));
  return `${p.year}/${p.month}/${p.day} ${p.hour}:${p.minute}`;
}

/** 以欄位路徑逐欄更新（整欄取代，不做物件深層合併；欄位名含「.」也安全） */
function updateArgs(update) {
  const args = [];
  for (const [key, value] of Object.entries(update)) args.push(new FieldPath(key), value);
  args.push(new FieldPath('updatedAt'), serverTime());
  return args;
}

/** 寫入資料並同時記下異動（同一批次，重試時以異動紀錄判斷是否已寫過） */
async function commitWrites(db, jobRef, writes) {
  for (let i = 0; i < writes.length; i += ITEMS_PER_BATCH) {
    const batch = db.batch();
    for (const w of writes.slice(i, i + ITEMS_PER_BATCH)) {
      batch.update(db.collection(w.collection).doc(w.docId), ...updateArgs(w.update));
      if (w.changeId) batch.set(jobRef.collection('changes').doc(w.changeId), { ...w.change, at: serverTime() });
    }
    await batch.commit();
  }
}

// ───────────────────────── 執行 ─────────────────────────

async function executePriceJob(db, jobRef, job) {
  const config = normalizePriceConfig(job.config);
  const [households, parkings, doneSnap] = await Promise.all([
    loadHouseholds(db, job.projectId),
    config.parking.enabled ? loadParkings(db, job.projectId) : Promise.resolve([]),
    jobRef.collection('changes').get(),
  ]);
  const done = new Set(doneSnap.docs.map(d => d.id));
  const byUnit = indexBy(households, h => text(h.data.unitId));
  const bySpot = indexBy(parkings, p => text(p.data.spotId));
  const plan = planPriceUpdate([...byUnit.values()].map(h => h.data), [...bySpot.values()].map(p => p.data), config);
  const writes = [];
  const skipped = [];

  for (const row of plan.households) {
    if (row.excluded) continue;
    row.skips.forEach(reason => skipped.push({ kind: 'household', id: row.id, reason }));
    if (!Object.keys(row.changes).length) continue;
    const h = byUnit.get(row.id);
    const changeId = `h_${h.docId}`;
    if (done.has(changeId)) continue;
    const update = {};
    for (const [key, c] of Object.entries(row.changes)) update[key] = c.to;
    const fin = finalizeHouseholdUpdate(h.data, update);
    if (!Object.keys(fin.changes).length) continue;
    writes.push({
      collection: 'salesHouseholds', docId: h.docId, update: fin.update, changeId,
      change: { kind: 'household', id: row.id, docId: h.docId, fields: fin.changes },
    });
  }

  for (const row of plan.parkings) {
    if (row.excluded) continue;
    row.skips.forEach(reason => skipped.push({ kind: 'parking', id: row.id, reason }));
    if (!Object.keys(row.changes).length) continue;
    const p = bySpot.get(row.id);
    const changeId = `p_${p.docId}`;
    if (done.has(changeId)) continue;
    const update = {};
    const fields = {};
    for (const [key, c] of Object.entries(row.changes)) {
      update[key] = c.to;
      fields[key] = { from: p.data[key] === undefined ? null : p.data[key], to: c.to };
    }
    writes.push({
      collection: 'salesParkings', docId: p.docId, update, changeId,
      change: { kind: 'parking', id: row.id, docId: p.docId, fields },
    });
  }

  await commitWrites(db, jobRef, writes);
  const ids = [...done, ...writes.map(w => w.changeId)];
  return {
    unitsUpdated: ids.filter(id => id.startsWith('h_')).length,
    parkingsUpdated: ids.filter(id => id.startsWith('p_')).length,
    skipped,
  };
}

async function executeExcelJob(db, jobRef, job) {
  const [households, itemsSnap, doneSnap] = await Promise.all([
    loadHouseholds(db, job.projectId),
    jobRef.collection('items').get(),
    jobRef.collection('changes').get(),
  ]);
  const done = new Set(doneSnap.docs.map(d => d.id));
  const byDoc = indexBy(households, h => h.docId);
  const byUnit = indexBy(households, h => text(h.data.unitId));
  const statuses = new Set(Array.isArray(job.config?.statuses) ? job.config.statuses.map(text) : []);
  const writes = [];
  const skipped = [];

  for (const itemDoc of itemsSnap.docs) {
    const item = itemDoc.data() || {};
    const h = byDoc.get(item.docId) || byUnit.get(text(item.unitId));
    if (!h) {
      skipped.push({ kind: 'household', id: text(item.unitId), reason: '找不到戶別' });
      continue;
    }
    const changeId = `h_${h.docId}`;
    if (done.has(changeId)) continue;
    const r = planExcelApply(h.data, item.fields, { unsold: statuses.has(householdStatus(h.data)) });
    r.skipped.forEach(s => skipped.push({ kind: 'household', id: text(item.unitId), field: s.field, reason: s.reason }));
    if (!Object.keys(r.update).length) continue;
    writes.push({
      collection: 'salesHouseholds', docId: h.docId, update: r.update, changeId,
      change: { kind: 'household', id: text(h.data.unitId), docId: h.docId, fields: r.changes },
    });
  }

  await commitWrites(db, jobRef, writes);
  const ids = [...done, ...writes.map(w => w.changeId)];
  return { unitsUpdated: ids.filter(id => id.startsWith('h_')).length, parkingsUpdated: 0, skipped };
}

function finalResult(result) {
  return {
    unitsUpdated: result.unitsUpdated,
    parkingsUpdated: result.parkingsUpdated,
    skipped: result.skipped.slice(0, SKIP_LIMIT),
    skippedCount: result.skipped.length,
  };
}

/** 認領並執行一筆到期排程（交易內認領，避免兩次排程同時執行） */
async function processJob(db, ref, now = Date.now()) {
  const claim = await db.runTransaction(async tx => {
    const snap = await tx.get(ref);
    const job = snap.data();
    if (!job || !job.runAt || millisOf(job.runAt) > now) return null;
    if (job.status !== 'pending' && job.status !== 'running') return null;
    if (job.status === 'running' && job.leaseUntil && millisOf(job.leaseUntil) > now) return null;
    const attempts = (job.attempts || 0) + 1;
    if (attempts > MAX_ATTEMPTS) {
      const lastError = job.lastError || '執行逾時';
      tx.update(ref, { status: 'failed', lastError, leaseUntil: null, finishedAt: serverTime(), updatedAt: serverTime() });
      return { job: { ...job, status: 'failed', lastError }, giveUp: true };
    }
    tx.update(ref, {
      status: 'running', attempts, leaseUntil: Timestamp.fromMillis(now + LEASE_MS),
      startedAt: job.startedAt || serverTime(), updatedAt: serverTime(),
    });
    return { job: { ...job, attempts } };
  });
  if (!claim) return null;
  if (claim.giveUp) {
    await notifyJob(db, ref, claim.job);
    return 'failed';
  }

  const job = claim.job;
  try {
    const raw = job.type === 'excel' ? await executeExcelJob(db, ref, job) : await executePriceJob(db, ref, job);
    const result = finalResult(raw);
    await ref.update({ status: 'done', result, lastError: null, leaseUntil: null, finishedAt: serverTime(), updatedAt: serverTime() });
    console.log(`[scheduledUpdates] ${ref.id} 完成：戶別 ${result.unitsUpdated}、車位 ${result.parkingsUpdated}、略過 ${result.skippedCount}`);
    await notifyJob(db, ref, { ...job, status: 'done', result });
    return 'done';
  } catch (err) {
    const lastError = String(err?.message || err).slice(0, 500);
    const failed = job.attempts >= MAX_ATTEMPTS;
    console.error(`[scheduledUpdates] ${ref.id} 第 ${job.attempts} 次執行失敗:`, err);
    await ref.update({
      status: failed ? 'failed' : 'pending', lastError, leaseUntil: null, updatedAt: serverTime(),
      ...(failed ? { finishedAt: serverTime() } : {}),
    });
    if (failed) await notifyJob(db, ref, { ...job, status: 'failed', lastError });
    return failed ? 'failed' : 'retry';
  }
}

// ───────────────────────── 通知 ─────────────────────────

function jobContentText(job) {
  if (job.type === 'excel') {
    const meta = job.excel || {};
    return `Excel 排程${meta.fileName ? `（${meta.fileName}）` : ''}：${meta.unitCount || 0} 戶`;
  }
  return job.summary || describePriceConfig(job.config);
}

function buildNotifyText(projectName, job) {
  const lines = [
    job.status === 'done' ? '【排程更新完成】' : '【排程更新失敗】',
    `建案：${projectName}`,
    `時間：${formatTaipei(millisOf(job.runAt))}`,
    `內容：${jobContentText(job)}`,
  ];
  if (job.status === 'done') {
    const r = job.result || {};
    const parts = [`房屋 ${r.unitsUpdated || 0} 戶`];
    if (job.type !== 'excel' && job.config?.parking?.enabled) parts.push(`車位 ${r.parkingsUpdated || 0} 個`);
    lines.push(`已更新：${parts.join('、')}`);
    if (r.skippedCount) lines.push(`略過：${r.skippedCount} 筆`);
  } else {
    lines.push(`原因：${job.lastError || '未知錯誤'}`);
  }
  if (job.createdBy?.name) lines.push(`建立：${job.createdBy.name}`);
  lines.push('明細請至銷控系統「排程更新」查看');
  return lines.join('\n');
}

async function notifyJob(db, ref, job) {
  try {
    const keys = sanitizeKeys(job.recipients);
    if (!keys.length) return;
    if (await shouldBlockOutbound(job.projectId, 'line')) return;
    const token = process.env.ANXISMART_LINE_CRM_TOKEN;
    if (!token) {
      console.warn('[scheduledUpdates] 缺少 LINE token，略過通知');
      return;
    }
    const creatorKey = text(job.createdBy?.userKey);
    const [projectSnap, userSnaps, permSnaps] = await Promise.all([
      db.collection('projects').doc(job.projectId).get(),
      db.getAll(...keys.map(k => db.collection('users').doc(k))),
      db.getAll(...keys.map(k => db.collection('userPermissions').doc(k))),
    ]);
    const lineIds = [];
    keys.forEach((key, i) => {
      const user = userSnaps[i].exists ? (userSnaps[i].data() || {}) : null;
      const lineId = text(user?.lineId);
      if (!user || !lineId.startsWith('U')) return;
      // 建立者一律可收；其他人需仍有本案銷控權限（或為管理員）
      const roles = Array.isArray(user.roles) ? user.roles : [];
      const systems = permSnaps[i].exists ? (permSnaps[i].data()?.permissions?.[job.projectId]?.systems || []) : [];
      if (key !== creatorKey && !roles.some(r => ADMIN_ROLES.includes(r)) && !systems.includes(MANAGE_SYSTEM)) return;
      lineIds.push(lineId);
    });
    const uniqueIds = [...new Set(lineIds)];
    if (!uniqueIds.length) return;
    const project = projectSnap.data() || {};
    const message = { type: 'text', text: buildNotifyText(project.name || project.projectName || job.projectId, job) };
    for (let i = 0; i < uniqueIds.length; i += 500) {
      await axios.post(LINE_MULTICAST_URL, { to: uniqueIds.slice(i, i + 500), messages: [message] }, {
        headers: { Authorization: `Bearer ${token}` },
        timeout: 15000,
      });
    }
    await ref.update({ notified: { sent: uniqueIds.length, at: serverTime() } });
  } catch (err) {
    console.error(`[scheduledUpdates] ${ref.id} 通知失敗:`, err?.response?.data || err);
  }
}

// ───────────────────────── API ─────────────────────────

async function handleList({ db, projectId }) {
  const snap = await jobsCol(db).where('projectId', '==', projectId).get();
  const active = new Set(['pending', 'running', 'reverting']);
  const jobs = snap.docs.map(d => serializeJob(d.id, d.data() || {}));
  jobs.sort((a, b) => {
    const aa = active.has(a.status) ? 0 : 1;
    const bb = active.has(b.status) ? 0 : 1;
    if (aa !== bb) return aa - bb;
    return aa === 0 ? (a.runAt || 0) - (b.runAt || 0) : (b.runAt || 0) - (a.runAt || 0);
  });
  return { status: 'success', jobs: jobs.slice(0, 100) };
}

async function handleRecipients({ db, projectId, access }) {
  const list = await getEligibleRecipients(projectId, db, { systems: [MANAGE_SYSTEM], includeUnreachable: true });
  const recipients = list.map(r => ({ userKey: r.userKey, name: r.name, hasLine: !!r.hasLine }));
  if (!recipients.some(r => r.userKey === access.userKey)) {
    const self = await db.collection('users').doc(access.userKey).get();
    recipients.push({ userKey: access.userKey, name: access.name, hasLine: text(self.data()?.lineId).startsWith('U') });
  }
  recipients.sort((a, b) => (a.userKey === access.userKey ? -1 : b.userKey === access.userKey ? 1 : a.name.localeCompare(b.name, 'zh-Hant')));
  return { status: 'success', recipients, selfKey: access.userKey };
}

async function handleSavePrice({ db, projectId, access, data }) {
  const config = normalizePriceConfig(data.config);
  if (!config.statuses.length) throw new HttpsError('invalid-argument', '請至少勾選一個狀態。');
  if (!hasPriceAdjustment(config)) throw new HttpsError('invalid-argument', '請填寫調整金額。');
  const payload = {
    projectId,
    type: 'price',
    status: 'pending',
    runAt: parseRunAt(data.runAt),
    config,
    summary: describePriceConfig(config),
    recipients: sanitizeKeys(data.recipients),
    attempts: 0,
    lastError: null,
    updatedAt: serverTime(),
    updatedBy: { userKey: access.userKey, name: access.name },
  };
  const jobId = text(data.jobId);
  if (jobId) {
    const ref = jobsCol(db).doc(jobId);
    await db.runTransaction(async tx => {
      const job = (await tx.get(ref)).data();
      if (!job || job.projectId !== projectId || job.type !== 'price') throw new HttpsError('not-found', '找不到排程。');
      if (job.status !== 'pending') throw new HttpsError('failed-precondition', '排程已開始執行或已結束，無法修改。');
      tx.update(ref, payload);
    });
    return { status: 'success', jobId };
  }
  const ref = jobsCol(db).doc();
  await ref.set({ ...payload, createdAt: serverTime(), createdBy: { userKey: access.userKey, name: access.name } });
  return { status: 'success', jobId: ref.id };
}

async function buildExcelPlan(db, projectId, rows) {
  if (!Array.isArray(rows) || rows.length === 0) throw new HttpsError('invalid-argument', '沒有可排程的資料。');
  if (rows.length > MAX_EXCEL_ROWS) throw new HttpsError('invalid-argument', `一次最多 ${MAX_EXCEL_ROWS} 列。`);
  const [households, personnelSnap] = await Promise.all([
    loadHouseholds(db, projectId),
    db.collection('salesPersonnel').where('projectId', '==', projectId).get(),
  ]);
  // 與 Excel 上傳相同：銷售人員只填姓名時依姓名反查 userKey
  const salespersonNameToUserKey = new Map();
  personnelSnap.forEach(d => {
    const p = d.data() || {};
    if (p.name && p.phone) salespersonNameToUserKey.set(text(p.name), text(p.phone));
  });
  const existingByUnitId = indexBy(households, h => text(h.data.unitId));
  const normalized = rows
    .filter(r => r && typeof r === 'object' && text(r.unitId))
    .map(r => {
      const unitId = text(r.unitId);
      return normalizeHouseholdUploadRow({ ...r, unitId }, {
        projectId,
        salespersonNameToUserKey,
        existing: existingByUnitId.get(unitId)?.data,
        logPrefix: 'scheduledUpdates.excel',
      });
    });
  return buildExcelDiff(normalized, existingByUnitId);
}

function excelPreview(diff) {
  const fieldKeys = [...new Set(diff.items.flatMap(i => Object.keys(i.fields)))];
  return {
    unitCount: diff.items.length,
    fieldKeys,
    unchangedCount: diff.unchangedCount,
    unknownUnitIds: diff.unknownUnitIds,
    items: diff.items.map(i => ({ unitId: i.unitId, fields: toPlain(i.fields) })),
  };
}

async function handlePreviewExcel({ db, projectId, data }) {
  const diff = await buildExcelPlan(db, projectId, data.rows);
  return { status: 'success', ...excelPreview(diff) };
}

async function handleCreateExcel({ db, projectId, access, data }) {
  // '' 代表空白狀態
  const statuses = Array.isArray(data.statuses) ? [...new Set(data.statuses.map(text))].slice(0, 200) : [];
  if (!statuses.length) throw new HttpsError('invalid-argument', '請至少勾選一個可調價狀態。');
  const runAt = parseRunAt(data.runAt);
  const diff = await buildExcelPlan(db, projectId, data.rows);
  if (!diff.items.length) throw new HttpsError('invalid-argument', 'Excel 內容與目前資料相同，沒有需要更新的欄位。');
  const preview = excelPreview(diff);
  const ref = jobsCol(db).doc();
  for (let i = 0; i < diff.items.length; i += 400) {
    const batch = db.batch();
    diff.items.slice(i, i + 400).forEach(item => batch.set(ref.collection('items').doc(item.docId), item));
    await batch.commit();
  }
  await ref.set({
    projectId,
    type: 'excel',
    status: 'pending',
    runAt,
    config: { statuses },
    excel: {
      fileName: text(data.fileName).slice(0, 200),
      unitCount: preview.unitCount,
      fieldKeys: preview.fieldKeys,
      unknownUnitIds: preview.unknownUnitIds.slice(0, 200),
    },
    summary: `Excel 排程：${preview.unitCount} 戶、${preview.fieldKeys.length} 個欄位`,
    recipients: sanitizeKeys(data.recipients),
    attempts: 0,
    lastError: null,
    createdAt: serverTime(),
    updatedAt: serverTime(),
    createdBy: { userKey: access.userKey, name: access.name },
  });
  return { status: 'success', jobId: ref.id };
}

async function getOwnJob(db, projectId, jobId) {
  const ref = jobsCol(db).doc(text(jobId));
  if (!text(jobId)) throw new HttpsError('invalid-argument', '缺少排程。');
  const snap = await ref.get();
  const job = snap.data();
  if (!job || job.projectId !== projectId) throw new HttpsError('not-found', '找不到排程。');
  return { ref, job };
}

async function handleCancel({ db, projectId, access, data }) {
  const { ref } = await getOwnJob(db, projectId, data.jobId);
  await db.runTransaction(async tx => {
    const job = (await tx.get(ref)).data();
    if (!job || job.status !== 'pending') throw new HttpsError('failed-precondition', '只有待執行的排程可以取消。');
    tx.update(ref, {
      status: 'cancelled', cancelledBy: { userKey: access.userKey, name: access.name },
      finishedAt: serverTime(), updatedAt: serverTime(),
    });
  });
  return { status: 'success' };
}

async function handleDetail({ db, projectId, data }) {
  const { ref, job } = await getOwnJob(db, projectId, data.jobId);
  const out = { status: 'success', job: serializeJob(ref.id, job) };
  if (job.type === 'excel') {
    const items = await ref.collection('items').get();
    out.items = items.docs.map(d => toPlain(d.data()));
  }
  if (['done', 'reverting', 'reverted', 'failed', 'running'].includes(job.status)) {
    const changes = await ref.collection('changes').get();
    out.changes = changes.docs.map(d => toPlain({ ...d.data(), at: undefined }));
  }
  return out;
}

async function getAllChunked(db, refs) {
  const out = [];
  for (let i = 0; i < refs.length; i += 200) {
    if (refs.slice(i, i + 200).length) out.push(...await db.getAll(...refs.slice(i, i + 200)));
  }
  return out;
}

async function handleRevert({ db, projectId, access, data }) {
  const { ref } = await getOwnJob(db, projectId, data.jobId);
  await db.runTransaction(async tx => {
    const job = (await tx.get(ref)).data();
    if (!job || job.status !== 'done') throw new HttpsError('failed-precondition', '只有已完成的排程可以還原。');
    tx.update(ref, { status: 'reverting', updatedAt: serverTime() });
  });
  try {
    const changesSnap = await ref.collection('changes').get();
    const changes = changesSnap.docs.map(d => d.data() || {});
    const refs = changes.map(c => db.collection(c.kind === 'parking' ? 'salesParkings' : 'salesHouseholds').doc(c.docId));
    const snaps = await getAllChunked(db, refs);
    const writes = [];
    const skipped = [];
    let units = 0;
    let parkings = 0;
    changes.forEach((c, i) => {
      if (!snaps[i] || !snaps[i].exists) {
        skipped.push({ kind: c.kind, id: c.id, reason: '資料已刪除' });
        return;
      }
      const r = planRevert(snaps[i].data() || {}, c.fields, c.kind);
      r.skipped.forEach(s => skipped.push({ kind: c.kind, id: c.id, field: s.field, reason: s.reason }));
      if (!Object.keys(r.update).length) return;
      writes.push({ collection: c.kind === 'parking' ? 'salesParkings' : 'salesHouseholds', docId: c.docId, update: r.update });
      if (c.kind === 'parking') parkings += 1; else units += 1;
    });
    await commitWrites(db, ref, writes);
    const revert = {
      at: serverTime(),
      by: { userKey: access.userKey, name: access.name },
      unitsRestored: units,
      parkingsRestored: parkings,
      skipped: skipped.slice(0, SKIP_LIMIT),
      skippedCount: skipped.length,
    };
    await ref.update({ status: 'reverted', revert, updatedAt: serverTime() });
    return { status: 'success', unitsRestored: units, parkingsRestored: parkings, skippedCount: skipped.length };
  } catch (err) {
    await ref.update({ status: 'done', updatedAt: serverTime() }).catch(() => {});
    throw err;
  }
}

const scheduledUpdateApi = onCall({
  region: 'asia-east1',
  memory: '1GiB',
  timeoutSeconds: 300,
  cors: true,
}, async (request) => {
  const data = request.data || {};
  const action = data.action;
  const projectId = text(data.projectId);
  const db = getDb();
  try {
    const access = await getAccess(db, data.userKey, projectId);
    const ctx = { db, projectId, access, data };
    switch (action) {
      case 'list': return await handleList(ctx);
      case 'recipients': return await handleRecipients(ctx);
      case 'savePrice': return await handleSavePrice(ctx);
      case 'previewExcel': return await handlePreviewExcel(ctx);
      case 'createExcel': return await handleCreateExcel(ctx);
      case 'cancel': return await handleCancel(ctx);
      case 'detail': return await handleDetail(ctx);
      case 'revert': return await handleRevert(ctx);
      default: throw new HttpsError('invalid-argument', `未知的 action: ${action}`);
    }
  } catch (err) {
    if (err instanceof HttpsError) throw err;
    console.error(`[scheduledUpdateApi] ${action} 失敗:`, err);
    throw new HttpsError('internal', `排程更新處理失敗：${err.message}`);
  }
});

// 每分鐘檢查到期排程：10:00 的排程會在 10:00～10:01 之間完成
const runScheduledUpdates = onSchedule({
  schedule: 'every 1 minutes',
  timeZone: 'Asia/Taipei',
  region: 'asia-east1',
  timeoutSeconds: 540,
  memory: '1GiB',
  secrets: LINE_SECRETS,
}, async () => {
  const db = getDb();
  const now = Date.now();
  const snap = await jobsCol(db).where('status', 'in', ['pending', 'running']).get();
  const due = snap.docs
    .filter(d => {
      const job = d.data() || {};
      const runAt = millisOf(job.runAt);
      if (!runAt || runAt > now) return false;
      return job.status === 'pending' || !job.leaseUntil || millisOf(job.leaseUntil) <= now;
    })
    .sort((a, b) => millisOf(a.data().runAt) - millisOf(b.data().runAt));
  for (const doc of due) {
    try {
      await processJob(db, doc.ref, now);
    } catch (err) {
      console.error(`[scheduledUpdates] ${doc.id} 處理失敗:`, err);
    }
  }
});

module.exports = {
  scheduledUpdateApi,
  runScheduledUpdates,
  // 測試用
  _test: {
    buildNotifyText,
    serializeJob,
    processJob,
    handleList,
    handleSavePrice,
    handleCreateExcel,
    handleCancel,
    handleDetail,
    handleRevert,
  },
};
