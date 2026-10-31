const test = require('node:test');
const assert = require('node:assert/strict');
const {
  normalizeImageName, buildStoragePath, isSalesImagePath, renameInList,
  saveSalesImageCore, renameSalesImageCore, deleteSalesImagesCore,
} = require('../salesImages');

const PNG = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0]).toString('base64');

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
      update: (r, d) => ops.push(() => store.set(r.path, { ...store.get(r.path), ...d })),
      async commit() {
        const snapshot = new Map(store);
        try { ops.forEach(op => op()); } catch (e) { store.clear(); snapshot.forEach((v, k) => store.set(k, v)); throw e; }
      },
    };
  };
  return { store, collection, batch };
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
