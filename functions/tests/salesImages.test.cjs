const test = require('node:test');
const assert = require('node:assert/strict');
const {
  normalizeImageName, buildStoragePath, isSalesImagePath, renameInList,
  saveSalesImageCore, renameSalesImageCore, updateSalesImageUnitsCore, deleteSalesImagesCore,
} = require('../salesImages');
const { SHEET_SYNC_SKIP_FIELD, shouldSkipSheetSync } = require('../utils/sheetSyncSkip');

const PNG = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0]).toString('base64');

// 比照正式環境套用 arrayUnion／arrayRemove
function applyUpdate(current, data) {
  const next = { ...current };
  for (const [key, value] of Object.entries(data)) {
    const list = Array.isArray(current?.[key]) ? current[key] : [];
    if (value?.methodName === 'FieldValue.arrayUnion') next[key] = [...list, ...value.elements.filter(v => !list.includes(v))];
    else if (value?.methodName === 'FieldValue.arrayRemove') next[key] = list.filter(v => !value.elements.includes(v));
    else next[key] = value;
  }
  return next;
}

// 記憶體版 Firestore／Storage：只實作本模組用到的方法
function fakeDb(initial = {}) {
  const store = new Map(Object.entries(initial));
  const ref = (path) => ({
    id: path.split('/').pop(),
    path,
    async get() {
      return { exists: store.has(path), id: path.split('/').pop(), data: () => store.get(path) };
    },
    async update(data) { store.set(path, { ...store.get(path), ...data }); },
    async create(data) {
      if (store.has(path)) throw Object.assign(new Error('exists'), { code: 6 });
      store.set(path, data);
    },
    async delete() { store.delete(path); },
  });
  const collection = (name) => {
    const docs = () => [...store.entries()]
      .filter(([p]) => p.startsWith(`${name}/`))
      .map(([p, d]) => ({ id: p.split('/').pop(), ref: ref(p), data: () => d }));
    return {
      doc: id => ref(`${name}/${id}`),
      where: (field, op, value) => ({
        async get() { return { docs: docs().filter(d => d.data()[field] === value) }; },
      }),
    };
  };
  const batch = () => {
    const ops = [];
    return {
      create: (r, d) => ops.push(() => { if (store.has(r.path)) throw Object.assign(new Error('exists'), { code: 6 }); store.set(r.path, d); }),
      delete: r => ops.push(() => store.delete(r.path)),
      update: (r, d) => ops.push(() => store.set(r.path, applyUpdate(store.get(r.path), d))),
      async commit() {
        db.commits.push(ops.length);
        if (db.failCommitAt === db.commits.length) throw new Error('commit failed');
        const snapshot = new Map(store);
        try { ops.forEach(op => op()); } catch (e) { store.clear(); snapshot.forEach((v, k) => store.set(k, v)); throw e; }
      },
    };
  };
  const db = { store, collection, batch, commits: [], failCommitAt: 0 };
  return db;
}

function fakeBucket() {
  const files = new Map();
  const deleted = [];
  return {
    files,
    deleted,
    file: path => ({
      async save(buffer, opts) { files.set(path, { buffer, opts }); },
      async makePublic() {},
      publicUrl: () => `https://storage.example/${path}`,
      async delete() { deleted.push(path); if (!files.has(path)) throw Object.assign(new Error('nf'), { code: 404 }); files.delete(path); },
    }),
  };
}

test('圖片名稱與檔案路徑規則', () => {
  assert.equal(normalizeImageName('  A1  格局 '), 'A1 格局');
  for (const bad of ['', '   ', 'a/b', 'a,b', 'a，b', '__x__', 'x'.repeat(81)]) {
    assert.throws(() => normalizeImageName(bad));
  }
  assert.equal(buildStoragePath('p1', 'a/b#?.png', 5), 'projects/p1/salesImages/5_a_b__.png');
  assert.ok(isSalesImagePath('projects/p1/salesImages/a.png', 'p1'));
  assert.ok(!isSalesImagePath('projects/p2/salesImages/a.png', 'p1'));
  assert.ok(!isSalesImagePath('projects/p1/salesImages/../x', 'p1'));
  assert.ok(!isSalesImagePath('subscription/a.png'));
  assert.deepEqual(renameInList(['A', 'B', 'C'], 'A', 'C'), ['C', 'B']);
});

test('新增圖片：驗證格式、同名需明確取代', async () => {
  const db = fakeDb();
  const bucket = fakeBucket();
  const base = { projectId: 'p1', imageName: 'A1', fileName: 'a1.png', contentType: 'image/png', fileBase64: PNG, width: 800, height: 600 };

  const res = await saveSalesImageCore({ db, bucket, data: base, now: 1 });
  assert.equal(res.docId, 'p1_A1');
  assert.equal(res.replaced, false);
  const doc = db.store.get('salesImages/p1_A1');
  assert.equal(doc.storagePath, 'projects/p1/salesImages/1_a1.png');
  assert.equal(doc.fileSize, 12);
  assert.equal(doc.width, 800);

  await assert.rejects(saveSalesImageCore({ db, bucket, data: base, now: 2 }), /已存在/);
  await assert.rejects(saveSalesImageCore({ db, bucket, data: { ...base, contentType: 'image/gif' } }), /僅支援/);
  await assert.rejects(saveSalesImageCore({ db, bucket, data: { ...base, imageName: 'B', fileBase64: Buffer.from('hello').toString('base64') } }), /不是有效/);

  // 同名取代：換新路徑、刪除舊檔
  const replaced = await saveSalesImageCore({ db, bucket, data: { ...base, replace: true }, now: 3 });
  assert.equal(replaced.replaced, true);
  assert.equal(db.store.get('salesImages/p1_A1').storagePath, 'projects/p1/salesImages/3_a1.png');
  assert.deepEqual(bucket.deleted, ['projects/p1/salesImages/1_a1.png']);
});

test('替換檔案：舊路徑仍被其他圖片引用時保留', async () => {
  const shared = 'projects/p1/salesImages/a.png';
  const db = fakeDb({
    'salesImages/p1_A': { projectId: 'p1', imageName: 'A', storagePath: shared },
    'salesImages/p1_B': { projectId: 'p1', imageName: 'B', storagePath: shared },
  });
  const bucket = fakeBucket();
  await saveSalesImageCore({ db, bucket, data: { projectId: 'p1', docId: 'p1_A', fileName: 'a.png', contentType: 'image/png', fileBase64: PNG }, now: 9 });
  assert.deepEqual(bucket.deleted, []);
  await assert.rejects(saveSalesImageCore({ db, bucket, data: { projectId: 'p2', docId: 'p1_A', fileName: 'a.png', contentType: 'image/png', fileBase64: PNG } }), /找不到/);
});

test('更名：搬移文件並同步戶別引用', async () => {
  const db = fakeDb({
    'salesImages/p1_A': { projectId: 'p1', imageName: 'A', storagePath: 'projects/p1/salesImages/a.png' },
    'salesImages/p1_B': { projectId: 'p1', imageName: 'B' },
    'salesHouseholds/h1': { projectId: 'p1', salesImages: ['A', 'X'] },
    'salesHouseholds/h2': { projectId: 'p1', salesImages: ['X'] },
    'salesHouseholds/h3': { projectId: 'p2', salesImages: ['A'] },
  });
  const res = await renameSalesImageCore({ db, data: { projectId: 'p1', docId: 'p1_A', newName: 'A2' } });
  assert.equal(res.docId, 'p1_A2');
  assert.equal(res.householdsUpdated, 1);
  assert.ok(!db.store.has('salesImages/p1_A'));
  assert.equal(db.store.get('salesImages/p1_A2').imageName, 'A2');
  assert.equal(db.store.get('salesImages/p1_A2').storagePath, 'projects/p1/salesImages/a.png');
  assert.deepEqual(db.store.get('salesHouseholds/h1').salesImages, ['A2', 'X']);
  assert.deepEqual(db.store.get('salesHouseholds/h3').salesImages, ['A']);

  await assert.rejects(renameSalesImageCore({ db, data: { projectId: 'p1', docId: 'p1_A2', newName: 'B' } }), /已存在/);
  assert.ok(db.store.has('salesImages/p1_A2'));
  assert.deepEqual(db.store.get('salesHouseholds/h1').salesImages, ['A2', 'X']);
});

test('批次刪除：略過不存在、拒絕其他建案、共用檔案不刪', async () => {
  const db = fakeDb({
    'salesImages/p1_A': { projectId: 'p1', imageName: 'A', storagePath: 'projects/p1/salesImages/a.png' },
    'salesImages/p1_B': { projectId: 'p1', imageName: 'B', storagePath: 'projects/p1/salesImages/shared.png' },
    'salesImages/p1_C': { projectId: 'p1', imageName: 'C', storagePath: 'projects/p1/salesImages/shared.png' },
    'salesImages/p2_D': { projectId: 'p2', imageName: 'D', storagePath: 'projects/p2/salesImages/d.png' },
  });
  const bucket = fakeBucket();
  bucket.files.set('projects/p1/salesImages/a.png', {});
  const res = await deleteSalesImagesCore({ db, bucket, data: { projectId: 'p1', docIds: ['p1_A', 'p1_B', 'missing', 'p2_D'] } });
  assert.equal(res.deleted, 3);
  assert.deepEqual(res.failed.map(f => f.docId), ['p2_D']);
  assert.ok(db.store.has('salesImages/p2_D'));
  assert.deepEqual(bucket.deleted, ['projects/p1/salesImages/a.png']);
  await assert.rejects(deleteSalesImagesCore({ db, bucket, data: { projectId: 'p1', docIds: [] } }), /請選擇/);
});

// ── 批次設定使用戶別 ──
const sheetProject = { name: '森之樹', salesSheetId: 's1', salesSheetTabName: 't1' };
const manyUnits = (n, salesImages = []) => Object.fromEntries(
  Array.from({ length: n }, (_, i) => [`salesHouseholds/u${i}`, { projectId: 'p1', unitId: `U${i}`, salesImages }]),
);
const addAll = (n, name = 'A') => Array.from({ length: n }, (_, i) => ({ docId: `u${i}`, add: [name] }));
const fakeSync = (error) => {
  const calls = [];
  const fn = async (params) => { calls.push(params); if (error) throw error; return 1; };
  return { fn, calls };
};

test('使用戶別：加入排最後、移出、已是目標狀態不寫、其他建案與不存在的戶別不動', async () => {
  const db = fakeDb({
    'salesHouseholds/a': { projectId: 'p1', salesImages: ['X'] },
    'salesHouseholds/b': { projectId: 'p1', salesImages: ['A', 'X'] },
    'salesHouseholds/c': { projectId: 'p1' },
    'salesHouseholds/d': { projectId: 'p1', salesImages: ['A'] },
    'salesHouseholds/z': { projectId: 'p2', salesImages: [] },
  });
  const sync = fakeSync();
  const res = await updateSalesImageUnitsCore({
    db,
    syncSalesSheet: sync.fn,
    data: { projectId: 'p1', changes: [
      { docId: 'a', add: ['A', 'B', 'A'] }, { docId: 'b', remove: ['A'] }, { docId: 'c', add: ['A'] },
      { docId: 'd', add: ['A'] }, { docId: 'z', add: ['A'] }, { docId: 'none', remove: ['A'] },
    ] },
  });
  assert.deepEqual(res, { status: 'success', updated: 3, notFound: ['z', 'none'] });
  assert.deepEqual(db.store.get('salesHouseholds/a').salesImages, ['X', 'A', 'B']);
  assert.deepEqual(db.store.get('salesHouseholds/b').salesImages, ['X']);
  assert.deepEqual(db.store.get('salesHouseholds/c').salesImages, ['A']);
  assert.deepEqual(db.store.get('salesHouseholds/d'), { projectId: 'p1', salesImages: ['A'] });
  assert.deepEqual(db.store.get('salesHouseholds/z').salesImages, []);
  assert.equal(sync.calls.length, 0);
});

test('使用戶別：輸入檢查', async () => {
  const db = fakeDb({ 'salesHouseholds/a': { projectId: 'p1' } });
  const run = changes => updateSalesImageUnitsCore({ db, data: { projectId: 'p1', changes } });
  for (const bad of [
    undefined, [], [{ docId: 'a' }], [{ docId: 'a', add: [], remove: [] }], [{ docId: 'a', add: ['A'], remove: ['B'] }],
    [{ docId: 'a/b', add: ['A'] }], [{ add: ['A'] }], [{ docId: 'a', add: [''] }], [{ docId: 'a', add: 'A' }], [{ docId: 'a', add: [1] }],
    [{ docId: 'a', add: ['A'] }, { docId: 'a', remove: ['A'] }], [{ docId: 'a', add: ['x'.repeat(301)] }],
    Array.from({ length: 5001 }, (_, i) => ({ docId: `x${i}`, add: ['A'] })),
  ]) await assert.rejects(run(bad), { code: 'invalid-argument' });
  await assert.rejects(updateSalesImageUnitsCore({ db, data: { changes: [{ docId: 'a', add: ['A'] }] } }), { code: 'invalid-argument' });
  assert.deepEqual(db.store.get('salesHouseholds/a'), { projectId: 'p1' });
});

test('使用戶別：10 戶以內逐戶同步；超過才留標記並全量同步一次', async () => {
  for (const [n, batch] of [[10, false], [11, true]]) {
    const db = fakeDb({ 'projects/p1': sheetProject, ...manyUnits(n) });
    const sync = fakeSync();
    const res = await updateSalesImageUnitsCore({ db, syncSalesSheet: sync.fn, data: { projectId: 'p1', changes: addAll(n) } });
    assert.equal(res.updated, n);
    assert.ok(!('sheetSyncWarning' in res));
    const unit = db.store.get('salesHouseholds/u0');
    assert.equal(SHEET_SYNC_SKIP_FIELD in unit, batch);
    assert.deepEqual(sync.calls.map(({ db: _, ...rest }) => rest), batch ? [{ projectId: 'p1', spreadsheetId: 's1', sheetName: 't1' }] : []);
    assert.equal(shouldSkipSheetSync({ projectId: 'p1', unitId: 'U0', salesImages: [] }, unit), batch);
  }
});

test('使用戶別：戶數以實際有異動的計算；沒設定 Sheet 的建案不留標記', async () => {
  const same = fakeDb({ 'projects/p1': sheetProject, ...manyUnits(30, ['A']), 'salesHouseholds/u0': { projectId: 'p1', salesImages: [] } });
  const s1 = fakeSync();
  assert.equal((await updateSalesImageUnitsCore({ db: same, syncSalesSheet: s1.fn, data: { projectId: 'p1', changes: addAll(30) } })).updated, 1);
  assert.equal(s1.calls.length, 0);

  for (const project of [undefined, { name: 'x' }, { salesSheetId: 's1' }]) {
    const db = fakeDb({ ...(project ? { 'projects/p1': project } : {}), ...manyUnits(30) });
    const sync = fakeSync();
    await updateSalesImageUnitsCore({ db, syncSalesSheet: sync.fn, data: { projectId: 'p1', changes: addAll(30) } });
    assert.ok(!(SHEET_SYNC_SKIP_FIELD in db.store.get('salesHouseholds/u0')));
    assert.equal(sync.calls.length, 0);
  }
});

test('使用戶別：Sheet 同步失敗只回提示，資料已寫入', async () => {
  const db = fakeDb({ 'projects/p1': sheetProject, ...manyUnits(20) });
  const { error } = console;
  console.error = () => {};
  const res = await updateSalesImageUnitsCore({ db, syncSalesSheet: fakeSync(new Error('quota')).fn, data: { projectId: 'p1', changes: addAll(20) } });
  console.error = error;
  assert.equal(res.updated, 20);
  assert.match(res.sheetSyncWarning, /quota/);
  assert.deepEqual(db.store.get('salesHouseholds/u19').salesImages, ['A']);
});

test('使用戶別：分批寫入中途失敗，已寫入的仍全量同步並回報', async () => {
  const db = fakeDb({ 'projects/p1': sheetProject, ...manyUnits(1000) });
  db.failCommitAt = 2;
  const sync = fakeSync();
  const { error } = console;
  console.error = () => {};
  await assert.rejects(
    updateSalesImageUnitsCore({ db, syncSalesSheet: sync.fn, data: { projectId: 'p1', changes: addAll(1000) } }),
    /已更新 450 戶，其餘 550 戶失敗/,
  );
  console.error = error;
  assert.equal(sync.calls.length, 1);
  assert.deepEqual(db.commits, [450, 450]);

  // 再送一次只補沒寫到的
  db.failCommitAt = 0;
  db.commits.length = 0;
  const again = await updateSalesImageUnitsCore({ db, syncSalesSheet: sync.fn, data: { projectId: 'p1', changes: addAll(1000) } });
  assert.equal(again.updated, 550);
  assert.deepEqual(db.commits, [450, 100]);
});

test('使用戶別：第一批就失敗時不同步', async () => {
  const db = fakeDb({ 'projects/p1': sheetProject, ...manyUnits(20) });
  db.failCommitAt = 1;
  const sync = fakeSync();
  const { error } = console;
  console.error = () => {};
  await assert.rejects(updateSalesImageUnitsCore({ db, syncSalesSheet: sync.fn, data: { projectId: 'p1', changes: addAll(20) } }), /再試一次/);
  console.error = error;
  assert.equal(sync.calls.length, 0);
});

test('更名：引用戶數多時留標記並全量同步一次', async () => {
  for (const [n, batch] of [[3, false], [25, true]]) {
    const db = fakeDb({ 'projects/p1': sheetProject, 'salesImages/p1_A': { projectId: 'p1', imageName: 'A' }, ...manyUnits(n, ['A', 'X']) });
    const sync = fakeSync();
    const res = await renameSalesImageCore({ db, syncSalesSheet: sync.fn, data: { projectId: 'p1', docId: 'p1_A', newName: 'A2' } });
    assert.equal(res.householdsUpdated, n);
    const unit = db.store.get('salesHouseholds/u0');
    assert.deepEqual(unit.salesImages, ['A2', 'X']);
    assert.equal(SHEET_SYNC_SKIP_FIELD in unit, batch);
    assert.equal(sync.calls.length, batch ? 1 : 0);
    assert.equal(shouldSkipSheetSync({ projectId: 'p1', unitId: 'U0', salesImages: ['A', 'X'] }, unit), batch);
  }
});
