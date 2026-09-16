/**
 * 客戶開發：網路蒐集工作（前端觸發 → 背景分批執行）
 *
 *   prospectHarvest（onCall，僅超級管理員）
 *     action: 'start'        → 建立 prospectHarvestJobs/{id}（status queued）
 *             'cancel'       → 標記 cancelRequested
 *             'config'       → 回傳搜尋金鑰是否已設定（Brave Search API）
 *             'setSearchKey' → 寫入 Secret Manager（PROSPECT_BRAVE_SEARCH_KEY）
 *   runProspectHarvest（Firestore 觸發 prospectHarvestJobs/{id}）
 *     status 為 queued 時認領執行；stage sources → enrich（分批，每批以時間預算為限，未完自動重新排隊）
 *
 * 工作文件：
 *   { status: queued|running|done|failed|cancelled, stage: sources|enrich,
 *     params: { cities[], since, categories[], enrich }, progress: {...}, result: {...},
 *     cancelRequested, runs, error, createdAt, createdBy, createdByName, startedAt, finishedAt, updatedAt }
 */
const { onCall, HttpsError } = require('firebase-functions/v2/https');
const { onDocumentWritten } = require('firebase-functions/v2/firestore');
const { Firestore, FieldValue } = require('@google-cloud/firestore');
const { assertSuperAdmin } = require('../utils/trialGuard');
const secrets = require('../salesAi/secrets');
const core = require('./harvestCore');

const JOBS = 'prospectHarvestJobs';
const SECRET_BRAVE = 'PROSPECT_BRAVE_SEARCH_KEY';   // Brave Search API（主要）
const SECRET_KEY = 'PROSPECT_GOOGLE_CSE_KEY';      // Google Programmable Search（舊；新建引擎已不能搜整個網路）
const SECRET_CX = 'PROSPECT_GOOGLE_CSE_CX';
const ENRICH_BUDGET_MS = 420000; // 每批 7 分鐘（函式上限 9 分鐘）
const SEARCH_INTERVAL_MS = 700;

let _db = null;
const getDb = () => { if (!_db) _db = new Firestore({ databaseId: 'anxi-app' }); return _db; };

async function getSearchConfig() {
  const [brave, key, cx] = await Promise.all([secrets.getSecret(SECRET_BRAVE), secrets.getSecret(SECRET_KEY), secrets.getSecret(SECRET_CX)]);
  if (brave) return { provider: 'brave', key: brave };
  return key && cx ? { provider: 'google', key, cx } : null;
}

function normalizeParams(raw = {}) {
  const cities = (Array.isArray(raw.cities) ? raw.cities : []).map((c) => String(c).replace(/台/g, '臺').trim()).filter((c) => core.CITY_CODES[c]);
  const categories = (Array.isArray(raw.categories) ? raw.categories : []).filter((c) => ['project', 'builder', 'agency'].includes(c));
  const since = /^\d{4}-\d{2}-\d{2}$/.test(String(raw.since || '')) ? String(raw.since) : '2024-01-01';
  if (!cities.length) throw new HttpsError('invalid-argument', '請至少選擇一個縣市');
  if (!categories.length) throw new HttpsError('invalid-argument', '請至少選擇一個類別');
  return { cities, categories, since, enrich: !!raw.enrich };
}

// ---------------------------------------------------------------
// Callable
// ---------------------------------------------------------------
exports.prospectHarvest = onCall({ region: 'asia-east1', memory: '256MiB', timeoutSeconds: 60 }, async (request) => {
  const data = request.data || {};
  const db = getDb();
  const user = await assertSuperAdmin(db, data.operatorKey);
  const operator = { key: user.key, name: user.name || user.key };

  switch (data.action) {
    case 'config': {
      const cfg = await getSearchConfig();
      return { status: 'success', hasSearchKey: !!cfg, provider: cfg?.provider || '' };
    }
    case 'setSearchKey': {
      const key = String(data.key || '').trim();
      if (!key) throw new HttpsError('invalid-argument', '請輸入 API 金鑰');
      try {
        await secrets.setSecret(SECRET_BRAVE, key);
      } catch (e) {
        throw new HttpsError('internal', `寫入 Secret Manager 失敗：${e.message}`);
      }
      return { status: 'success' };
    }
    case 'start': {
      const params = normalizeParams(data.params);
      const active = await db.collection(JOBS).where('status', 'in', ['queued', 'running']).limit(1).get();
      if (!active.empty) throw new HttpsError('already-exists', '已有蒐集工作執行中，請等它完成或取消。');
      const ref = db.collection(JOBS).doc();
      await ref.set({
        status: 'queued', stage: 'sources', params, progress: {}, result: {}, cancelRequested: false, runs: 0, error: '',
        createdAt: FieldValue.serverTimestamp(), createdBy: operator.key, createdByName: operator.name,
        startedAt: null, finishedAt: null, updatedAt: FieldValue.serverTimestamp(),
      });
      return { status: 'success', jobId: ref.id };
    }
    case 'cancel': {
      const id = String(data.jobId || '');
      if (!id) throw new HttpsError('invalid-argument', '缺少 jobId');
      const ref = db.collection(JOBS).doc(id);
      const snap = await ref.get();
      if (!snap.exists) throw new HttpsError('not-found', '找不到工作');
      const job = snap.data();
      if (job.status === 'queued') {
        await ref.update({ status: 'cancelled', cancelRequested: true, finishedAt: FieldValue.serverTimestamp(), updatedAt: FieldValue.serverTimestamp(), updatedBy: operator.key });
      } else if (job.status === 'running') {
        await ref.update({ cancelRequested: true, updatedAt: FieldValue.serverTimestamp(), updatedBy: operator.key });
      }
      return { status: 'success' };
    }
    default:
      throw new HttpsError('invalid-argument', `未知 action：${data.action}`);
  }
});

// ---------------------------------------------------------------
// 背景執行
// ---------------------------------------------------------------
exports.runProspectHarvest = onDocumentWritten({
  document: `${JOBS}/{jobId}`,
  database: 'anxi-app',
  region: 'asia-east1',
  memory: '1GiB',
  timeoutSeconds: 540,
  maxInstances: 1,
}, async (event) => {
  const after = event.data?.after;
  if (!after || !after.exists) return;
  if (after.data().status !== 'queued') return;

  const db = getDb();
  const ref = db.collection(JOBS).doc(event.params.jobId);

  // 認領（避免重複觸發同時執行）
  const claimed = await db.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists || snap.data().status !== 'queued') return null;
    const job = snap.data();
    tx.update(ref, { status: 'running', runs: (job.runs || 0) + 1, startedAt: job.startedAt || FieldValue.serverTimestamp(), lastRunAt: FieldValue.serverTimestamp(), updatedAt: FieldValue.serverTimestamp() });
    return job;
  });
  if (!claimed) return;

  const job = claimed;
  const operator = { key: job.createdBy || 'harvest', name: job.createdByName || '網路蒐集' };
  const report = async (patch) => ref.update({ ...patch, updatedAt: FieldValue.serverTimestamp() });
  const shouldStop = async () => !!(await ref.get()).data()?.cancelRequested;
  const finish = (status, extra = {}) => ref.update({ status, finishedAt: FieldValue.serverTimestamp(), updatedAt: FieldValue.serverTimestamp(), ...extra });

  try {
    if (job.stage === 'sources') {
      const r = await core.runSources(db, { ...job.params, operator, batchId: `web_${event.params.jobId}` }, report);
      const result = { ...(job.result || {}), sources: r };
      if (await shouldStop()) { await finish('cancelled', { result }); return; }
      if (job.params.enrich) {
        await ref.update({ stage: 'enrich', status: 'queued', result, updatedAt: FieldValue.serverTimestamp() });
      } else {
        await finish('done', { result });
      }
      return;
    }

    if (job.stage === 'enrich') {
      const search = await getSearchConfig();
      const r = await core.runEnrichBatch(db, { ...job.params, operator, search, budgetMs: ENRICH_BUDGET_MS, searchIntervalMs: SEARCH_INTERVAL_MS }, { shouldStop, report });
      const prev = job.result?.enrich || { done: 0, found: 0 };
      const enrich = { total: prev.total || r.total, done: (prev.done || 0) + r.done, found: (prev.found || 0) + r.found, searchEnabled: !!search, quotaExceeded: r.quotaExceeded };
      const result = { ...(job.result || {}), enrich };
      if (r.stopped) { await finish('cancelled', { result }); return; }
      const remaining = r.total - r.done;
      if (remaining > 0 && !r.quotaExceeded) {
        await ref.update({ status: 'queued', result, updatedAt: FieldValue.serverTimestamp() });
      } else {
        await finish('done', { result, error: r.quotaExceeded ? '搜尋額度用盡，其餘公司未搜尋官網' : '' });
      }
      return;
    }

    await finish('failed', { error: `未知階段：${job.stage}` });
  } catch (e) {
    console.error('[runProspectHarvest]', e);
    await finish('failed', { error: String(e.message || e).slice(0, 500) }).catch(() => {});
  }
});
