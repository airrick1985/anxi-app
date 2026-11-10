// 排程更新：以記憶體假 Firestore 跑完整流程（建立 → 執行 → 重試 → 還原）
import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { FieldPath, FieldValue, Timestamp } = require('../../functions/node_modules/@google-cloud/firestore');
const { _test: api } = require('../../functions/scheduledUpdates.js');
const diff = require('../../functions/utils/scheduledUpdateDiff.js');

// ───── 假 Firestore（只實作本模組用到的介面） ─────
function resolve(v) {
  if (v instanceof FieldValue) return Timestamp.now();
  if (v === undefined) return undefined;
  if (v === null || v instanceof Timestamp || typeof v !== 'object') return v;
  if (Array.isArray(v)) return v.map(resolve);
  const out = {};
  for (const [k, val] of Object.entries(v)) {
    const r = resolve(val);
    if (r !== undefined) out[k] = r;
  }
  return out;
}

class Snap {
  constructor(ref, data) { this.ref = ref; this.id = ref.id; this._data = data; this.exists = data !== undefined; }
  data() { return this._data === undefined ? undefined : resolve(this._data); }
}

class Ref {
  constructor(db, path) { this.db = db; this.path = path; this.id = path.split('/').pop(); }
  collection(name) { return new Col(this.db, `${this.path}/${name}`); }
  async get() { return new Snap(this, this.db.store.get(this.path)); }
  async set(data, opts) { this.db.write(this.path, data, opts); }
  async update(...args) { this.db.patch(this.path, args); }
}

class Query {
  constructor(db, path, filters = []) { this.db = db; this.path = path; this.filters = filters; }
  where(field, op, value) { return new Query(this.db, this.path, [...this.filters, { field, op, value }]); }
  async get() {
    const prefix = `${this.path}/`;
    const docs = [...this.db.store.entries()]
      .filter(([p]) => p.startsWith(prefix) && !p.slice(prefix.length).includes('/'))
      .filter(([, d]) => this.filters.every(f => (f.op === '==' ? d[f.field] === f.value : f.value.includes(d[f.field]))))
      .map(([p, d]) => new Snap(new Ref(this.db, p), d));
    return { docs, empty: docs.length === 0, size: docs.length, forEach: fn => docs.forEach(fn) };
  }
}

class Col extends Query {
  doc(id) { return new Ref(this.db, `${this.path}/${id || `auto${++this.db.seq}`}`); }
}

class Batch {
  constructor(db) { this.db = db; this.ops = []; }
  set(ref, data, opts) { this.ops.push(() => this.db.write(ref.path, data, opts)); }
  update(ref, ...args) { this.ops.push(() => this.db.patch(ref.path, args)); }
  async commit() {
    if (this.db.failCommits > 0) { this.db.failCommits -= 1; throw new Error('模擬寫入失敗'); }
    this.ops.forEach(op => op());
  }
}

class FakeDb {
  constructor() { this.store = new Map(); this.seq = 0; this.failCommits = 0; }
  collection(name) { return new Col(this, name); }
  batch() { return new Batch(this); }
  async getAll(...refs) { return Promise.all(refs.map(r => r.get())); }
  async runTransaction(fn) {
    const ops = [];
    const tx = {
      get: ref => ref.get(),
      update: (ref, data) => ops.push(() => this.patch(ref.path, [data])),
      set: (ref, data, opts) => ops.push(() => this.write(ref.path, data, opts)),
    };
    const result = await fn(tx);
    ops.forEach(op => op());
    return result;
  }
  write(path, data, opts) {
    const base = opts && opts.merge ? (this.store.get(path) || {}) : {};
    this.store.set(path, { ...base, ...resolve(data) });
  }
  patch(path, args) {
    const current = this.store.get(path);
    if (!current) throw new Error(`NOT_FOUND ${path}`);
    const next = { ...current };
    if (args[0] instanceof FieldPath) {
      for (let i = 0; i < args.length; i += 2) next[args[i].segments.join('.')] = resolve(args[i + 1]);
    } else {
      Object.assign(next, resolve(args[0]));
    }
    this.store.set(path, next);
  }
  doc(path) { return this.store.get(path); }
}

// ───── 測試資料 ─────
const PROJECT = 'p1';
const access = { userKey: 'u1', name: '王小明' };

function seed() {
  const db = new FakeDb();
  const hh = (unitId, extra) => db.store.set(`salesHouseholds/${PROJECT}_${unitId}`, {
    projectId: PROJECT, unitId, building: 'A', salesStatus_backend: '', status: '', area_house_ping: 30,
    price_list_house_only: 1000, price_list_terrace: 10, price_list_house_total: 1010,
    price_floor_house_only: 900, price_floor_terrace: 8, price_floor_house_total: 908,
    buyerName: null, ...extra,
  });
  hh('A1');
  hh('A2', { salesStatus_backend: '簽約', status: '簽約', buyerName: '陳先生' });
  hh('A3');
  db.store.set(`salesParkings/${PROJECT}_B1`, { projectId: PROJECT, spotId: 'B1', type2: '坡道平面', status_backend: '', price_list: 250, price_floor: 230 });
  db.store.set(`salesParkings/${PROJECT}_B2`, { projectId: PROJECT, spotId: 'B2', type2: '坡道平面', status_backend: '簽約', buyerUnitId: 'A2', price_list: 250, price_floor: 230 });
  return db;
}

const unitDoc = (db, unitId) => db.doc(`salesHouseholds/${PROJECT}_${unitId}`);
const jobDoc = (db, id) => db.doc(`scheduledUpdates/${id}`);
const jobRef = (db, id) => db.collection('scheduledUpdates').doc(id);
const runAtSoon = () => Date.now() + 120000;
const afterRun = (db, id) => jobDoc(db, id).runAt.toMillis() + 1000;

const PRICE_CONFIG = {
  statuses: [''],
  house: { mode: 'perPing', list: 1, floor: 0.5 },
  parking: { enabled: true, mode: 'fixed', amounts: { 坡道平面: { list: 10 } } },
};

async function createPriceJob(db, config = PRICE_CONFIG) {
  const res = await api.handleSavePrice({ db, projectId: PROJECT, access, data: { runAt: runAtSoon(), config, recipients: [] } });
  return res.jobId;
}

test('調價排程：到時間只調未售戶與未售車位，總價重算', async () => {
  const db = seed();
  const id = await createPriceJob(db);
  assert.equal(jobDoc(db, id).status, 'pending');
  assert.equal(jobDoc(db, id).summary, '房屋 表價 +1萬/坪、底價 +0.5萬/坪；車位 表價 +10萬');

  // 時間未到不執行
  assert.equal(await api.processJob(db, jobRef(db, id), Date.now()), null);

  // 建立後、執行前 A3 賣掉 → 不調
  db.patch(`salesHouseholds/${PROJECT}_A3`, [{ salesStatus_backend: '小訂', status: '小訂' }]);

  assert.equal(await api.processJob(db, jobRef(db, id), afterRun(db, id)), 'done');
  const a1 = unitDoc(db, 'A1');
  // 1000 + 10 + 30 = 1040 → 房屋 1030
  assert.equal(a1.price_list_house_only, 1030);
  assert.equal(a1.price_list_house_total, 1040);
  // 900 + 8 + 15 = 923 → 房屋 915
  assert.equal(a1.price_floor_house_only, 915);
  assert.equal(a1.price_floor_house_total, 923);
  assert.equal(unitDoc(db, 'A2').price_list_house_only, 1000);
  assert.equal(unitDoc(db, 'A3').price_list_house_only, 1000);
  assert.equal(db.doc(`salesParkings/${PROJECT}_B1`).price_list, 260);
  assert.equal(db.doc(`salesParkings/${PROJECT}_B2`).price_list, 250);

  const job = jobDoc(db, id);
  assert.equal(job.status, 'done');
  assert.deepEqual({ u: job.result.unitsUpdated, p: job.result.parkingsUpdated }, { u: 1, p: 1 });
  const change = db.doc(`scheduledUpdates/${id}/changes/h_${PROJECT}_A1`);
  assert.deepEqual(change.fields.price_list_house_only, { from: 1000, to: 1030 });

  // 已完成的排程不會再執行
  assert.equal(await api.processJob(db, jobRef(db, id), afterRun(db, id)), null);
});

test('寫入中途失敗重試：已寫入的戶不重複加價，三次失敗標記失敗', async () => {
  const db = seed();
  const id = await createPriceJob(db, { statuses: [''], house: { mode: 'perUnit', list: 20 } });
  const now = afterRun(db, id);

  db.failCommits = 1;
  assert.equal(await api.processJob(db, jobRef(db, id), now), 'retry');
  assert.equal(jobDoc(db, id).status, 'pending');
  assert.equal(jobDoc(db, id).lastError, '模擬寫入失敗');
  assert.equal(unitDoc(db, 'A1').price_list_house_only, 1000);

  // 模擬上次已寫入 A1（含異動紀錄）後才失敗
  db.patch(`salesHouseholds/${PROJECT}_A1`, [{ price_list_house_only: 1020, price_list_house_total: 1030 }]);
  db.store.set(`scheduledUpdates/${id}/changes/h_${PROJECT}_A1`, {
    kind: 'household', id: 'A1', docId: `${PROJECT}_A1`,
    fields: { price_list_house_only: { from: 1000, to: 1020 }, price_list_house_total: { from: 1010, to: 1030 } },
  });
  assert.equal(await api.processJob(db, jobRef(db, id), now), 'done');
  assert.equal(unitDoc(db, 'A1').price_list_house_only, 1020);
  assert.equal(unitDoc(db, 'A3').price_list_house_only, 1020);
  assert.equal(jobDoc(db, id).result.unitsUpdated, 2);

  const id2 = await createPriceJob(db, { statuses: [''], house: { mode: 'perUnit', list: 5 } });
  db.failCommits = 3;
  const now2 = afterRun(db, id2);
  assert.equal(await api.processJob(db, jobRef(db, id2), now2), 'retry');
  assert.equal(await api.processJob(db, jobRef(db, id2), now2), 'retry');
  assert.equal(await api.processJob(db, jobRef(db, id2), now2), 'failed');
  assert.equal(jobDoc(db, id2).status, 'failed');
});

test('執行中租約未過期不重複認領，過期後接手', async () => {
  const db = seed();
  const id = await createPriceJob(db);
  const now = afterRun(db, id);
  db.patch(`scheduledUpdates/${id}`, [{ status: 'running', attempts: 1, leaseUntil: Timestamp.fromMillis(now + 60000) }]);
  assert.equal(await api.processJob(db, jobRef(db, id), now), null);
  assert.equal(await api.processJob(db, jobRef(db, id), now + 120000), 'done');
  assert.equal(jobDoc(db, id).attempts, 2);
});

test('還原：只改回仍是排程值的欄位，被改過的跳過', async () => {
  const db = seed();
  const id = await createPriceJob(db);
  await api.processJob(db, jobRef(db, id), afterRun(db, id));
  // 執行後有人手動改了 A1 底價
  db.patch(`salesHouseholds/${PROJECT}_A1`, [{ price_floor_house_only: 950, price_floor_house_total: 958 }]);

  const res = await api.handleRevert({ db, projectId: PROJECT, access, data: { jobId: id } });
  assert.deepEqual({ u: res.unitsRestored, p: res.parkingsRestored, s: res.skippedCount }, { u: 2, p: 1, s: 1 });
  assert.equal(unitDoc(db, 'A3').price_list_house_only, 1000);
  assert.equal(unitDoc(db, 'A3').price_floor_house_only, 900);
  const a1 = unitDoc(db, 'A1');
  assert.equal(a1.price_list_house_only, 1000);
  assert.equal(a1.price_list_house_total, 1010);
  assert.equal(a1.price_floor_house_only, 950);
  assert.equal(a1.price_floor_house_total, 958);
  assert.equal(db.doc(`salesParkings/${PROJECT}_B1`).price_list, 250);
  assert.equal(jobDoc(db, id).status, 'reverted');
  await assert.rejects(api.handleRevert({ db, projectId: PROJECT, access, data: { jobId: id } }), /只有已完成/);
});

test('修改與取消：只有待執行可改、可取消，取消後不執行', async () => {
  const db = seed();
  const id = await createPriceJob(db);
  await api.handleSavePrice({ db, projectId: PROJECT, access, data: { jobId: id, runAt: runAtSoon(), config: { statuses: [''], house: { mode: 'perUnit', list: 50 } } } });
  assert.equal(jobDoc(db, id).summary, '房屋 表價 +50萬/戶');
  await api.handleCancel({ db, projectId: PROJECT, access, data: { jobId: id } });
  assert.equal(jobDoc(db, id).status, 'cancelled');
  assert.equal(await api.processJob(db, jobRef(db, id), afterRun(db, id)), null);
  await assert.rejects(
    api.handleSavePrice({ db, projectId: PROJECT, access, data: { jobId: id, runAt: runAtSoon(), config: PRICE_CONFIG } }),
    /無法修改/,
  );
  await assert.rejects(
    api.handleSavePrice({ db, projectId: PROJECT, access, data: { runAt: Date.now() - 1000, config: PRICE_CONFIG } }),
    /晚於現在/,
  );
  await assert.rejects(
    api.handleSavePrice({ db, projectId: PROJECT, access, data: { runAt: runAtSoon(), config: { statuses: [''], house: { mode: 'perPing' } } } }),
    /調整金額/,
  );
});

test('Excel 排程：只存有改的欄位；衝突與已售價格欄位跳過', async () => {
  const db = seed();
  const rows = [
    { unitId: 'A1', price_list_house_only: 1100, buyerName: '林小姐', price_list_house_total: 9999 },
    { unitId: 'A2', price_list_house_only: 1200, remarks: '已簽約' },
    { unitId: 'A3', buyerName: '' },
    { unitId: 'ZZ', buyerName: '不存在' },
  ];
  const res = await api.handleCreateExcel({
    db, projectId: PROJECT, access,
    data: { rows, runAt: runAtSoon(), statuses: [''], recipients: [], fileName: '調價.xlsx' },
  });
  const job = jobDoc(db, res.jobId);
  assert.equal(job.excel.unitCount, 2);
  assert.deepEqual(job.excel.unknownUnitIds, ['ZZ']);
  const itemA1 = db.doc(`scheduledUpdates/${res.jobId}/items/${PROJECT}_A1`);
  assert.deepEqual(Object.keys(itemA1.fields).sort(), ['buyerName', 'price_list_house_only']);

  // 建立後有人改了 A1 的買方姓名 → 該欄跳過
  db.patch(`salesHouseholds/${PROJECT}_A1`, [{ buyerName: '張先生' }]);
  assert.equal(await api.processJob(db, jobRef(db, res.jobId), afterRun(db, res.jobId)), 'done');
  const a1 = unitDoc(db, 'A1');
  assert.equal(a1.price_list_house_only, 1100);
  assert.equal(a1.price_list_house_total, 1110);
  assert.equal(a1.buyerName, '張先生');
  const a2 = unitDoc(db, 'A2');
  assert.equal(a2.price_list_house_only, 1000);
  assert.equal(a2.remarks, '已簽約');
  const reasons = jobDoc(db, res.jobId).result.skipped.map(s => `${s.id}:${s.field}:${s.reason}`).sort();
  assert.deepEqual(reasons, ['A1:buyerName:建立後已被修改', 'A2:price_list_house_only:已售不調價']);

  const detail = await api.handleDetail({ db, projectId: PROJECT, access, data: { jobId: res.jobId } });
  assert.equal(detail.items.length, 2);
  assert.equal(detail.changes.length, 2);
});

test('Excel 排程：內容與目前資料相同時不能建立', async () => {
  const db = seed();
  await assert.rejects(api.handleCreateExcel({
    db, projectId: PROJECT, access,
    data: { rows: [{ unitId: 'A1', price_list_house_only: '1000', buyerName: '' }], runAt: runAtSoon(), statuses: [''] },
  }), /沒有需要更新/);
});

test('清單排序：待執行依時間先後在前，其餘新到舊', async () => {
  const db = seed();
  const id1 = await createPriceJob(db);
  const id2 = await createPriceJob(db);
  db.patch(`scheduledUpdates/${id1}`, [{ runAt: Timestamp.fromMillis(Date.now() + 999999) }]);
  const id3 = await createPriceJob(db);
  db.patch(`scheduledUpdates/${id3}`, [{ status: 'done' }]);
  const { jobs } = await api.handleList({ db, projectId: PROJECT });
  assert.deepEqual(jobs.map(j => j.id), [id2, id1, id3]);
  assert.equal(typeof jobs[0].runAt, 'number');
});

test('欄位比對：空值、數字字串、時間視為相同', () => {
  assert.ok(diff.sameValue('', null));
  assert.ok(diff.sameValue(undefined, []));
  assert.ok(diff.sameValue('1000', 1000));
  assert.ok(diff.sameValue(['王', '李'], ['王', '李']));
  assert.ok(!diff.sameValue(['王'], ['李']));
  assert.ok(diff.sameValue(Timestamp.fromMillis(1700000000000), new Date(1700000000000)));
  assert.ok(diff.sameValue({ year: 80, month: 1, day: 2 }, { day: 2, month: 1, year: 80 }));
  assert.ok(!diff.sameValue(0, null));
});

test('通知文字', () => {
  const textDone = api.buildNotifyText('富宇森之樹', {
    status: 'done', type: 'price', runAt: Timestamp.fromMillis(Date.UTC(2026, 10, 14, 2, 0)),
    summary: '房屋 表價 +1萬/坪', config: { parking: { enabled: true } },
    result: { unitsUpdated: 32, parkingsUpdated: 10, skippedCount: 2 }, createdBy: { name: '王小明' },
  });
  assert.match(textDone, /【排程更新完成】/);
  assert.match(textDone, /時間：2026\/11\/14 10:00/);
  assert.match(textDone, /已更新：房屋 32 戶、車位 10 個/);
  assert.match(textDone, /略過：2 筆/);
  const textFail = api.buildNotifyText('X', { status: 'failed', type: 'excel', runAt: null, excel: { fileName: 'a.xlsx', unitCount: 3 }, lastError: '逾時' });
  assert.match(textFail, /【排程更新失敗】/);
  assert.match(textFail, /Excel 排程（a.xlsx）：3 戶/);
  assert.match(textFail, /原因：逾時/);
});
