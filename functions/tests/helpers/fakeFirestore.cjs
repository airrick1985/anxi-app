// 記憶體假 Firestore：寫入與查詢條件都先交給真正的 SDK 驗證（不連線），
// 所以 undefined、不合法的 documentId、不合法的欄位路徑都會像正式環境一樣丟錯。
const { Firestore, FieldPath } = require('@google-cloud/firestore');

const validator = new Firestore({ projectId: 'offline', databaseId: 'anxi-app' });

const validateWrite = (path, data, merge) => {
  if (merge) validator.batch().set(validator.doc(path), data, { merge: true });
  else validator.batch().set(validator.doc(path), data);
};

const getPath = (data, segments) => segments.reduce((value, key) => (value == null ? value : value[key]), data);

function matches(doc, { field, op, value }) {
  const isPathObject = field instanceof FieldPath;
  if (isPathObject && field.isEqual(FieldPath.documentId())) {
    return op === 'in' ? value.includes(doc.id) : doc.id === value;
  }
  const segments = isPathObject ? field.segments : String(field).split('.');
  const actual = getPath(doc.data(), segments);
  if (op === 'in') return value.includes(actual);
  if (op === 'array-contains') return Array.isArray(actual) && actual.includes(value);
  if (op === 'array-contains-any') return Array.isArray(actual) && actual.some(item => value.includes(item));
  if (op === '==') return actual === value;
  throw new Error(`假 Firestore 不支援查詢條件: ${op}`);
}

function createFakeDb(initial = {}) {
  const store = new Map(Object.entries(initial));
  let autoId = 0;
  const failures = new Map(); // 測試用：指定文件路徑的 update 丟錯

  const snapshot = (path) => ({
    id: path.split('/').pop(),
    exists: store.has(path),
    ref: docRef(path),
    data: () => (store.has(path) ? { ...store.get(path) } : undefined),
    get: key => store.get(path)?.[key],
  });

  // 比照正式環境：FieldValue.delete() 會移除欄位，不會留在文件內
  const applyMerge = (current, data) => Object.fromEntries(
    Object.entries({ ...current, ...data }).filter(([, value]) => value?.methodName !== 'FieldValue.delete'),
  );

  const writeSet = (path, data, options) => {
    validateWrite(path, data, options?.merge);
    store.set(path, options?.merge ? applyMerge(store.get(path) || {}, data) : data);
  };
  const writeUpdate = (path, data) => {
    validateWrite(path, data, true);
    if (failures.has(path)) throw failures.get(path);
    if (!store.has(path)) throw new Error(`no document ${path}`);
    store.set(path, applyMerge(store.get(path), data));
  };

  function docRef(path) {
    return {
      path,
      id: path.split('/').pop(),
      firestore: db,
      get: async () => snapshot(path),
      set: async (data, options) => writeSet(path, data, options),
      update: async data => writeUpdate(path, data),
      delete: async () => { store.delete(path); },
      collection: name => collectionRef(`${path}/${name}`),
    };
  }

  function queryRef(path, filters, realQuery, max) {
    return {
      where: (field, op, value) => {
        const next = realQuery.where(field, op, value);
        next.toProto();
        return queryRef(path, [...filters, { field, op, value }], next, max);
      },
      orderBy: () => queryRef(path, filters, realQuery, max),
      select: () => queryRef(path, filters, realQuery, max),
      limit: count => queryRef(path, filters, realQuery, count),
      get: async () => {
        let docs = [...store.keys()]
          .filter(key => key.startsWith(`${path}/`) && !key.slice(path.length + 1).includes('/'))
          .map(snapshot)
          .filter(doc => filters.every(filter => matches(doc, filter)));
        if (max) docs = docs.slice(0, max);
        return { docs, empty: docs.length === 0, size: docs.length, forEach: fn => docs.forEach(fn) };
      },
    };
  }

  function collectionRef(path) {
    return {
      ...queryRef(path, [], validator.collection(path)),
      path,
      doc: (id) => {
        autoId += id === undefined ? 1 : 0;
        return docRef(`${path}/${id === undefined ? `auto${autoId}` : id}`);
      },
      add: async (data) => {
        autoId += 1;
        writeSet(`${path}/auto${autoId}`, data);
        return docRef(`${path}/auto${autoId}`);
      },
    };
  }

  const db = {
    store,
    failures,
    collection: name => collectionRef(name),
    doc: path => docRef(path),
    batch() {
      const operations = [];
      const batch = {
        set: (ref, data, options) => { validateWrite(ref.path, data, options?.merge); operations.push(() => writeSet(ref.path, data, options)); return batch; },
        update: (ref, data) => { validateWrite(ref.path, data, true); operations.push(() => writeUpdate(ref.path, data)); return batch; },
        delete: (ref) => { operations.push(() => store.delete(ref.path)); return batch; },
        commit: async () => { operations.forEach(run => run()); },
      };
      return batch;
    },
    runTransaction: async fn => fn({
      get: ref => ref.get(),
      set: (ref, data, options) => writeSet(ref.path, data, options),
      update: (ref, data) => writeUpdate(ref.path, data),
      delete: (ref) => { store.delete(ref.path); },
    }),
  };
  return db;
}

module.exports = { createFakeDb, Firestore, FieldPath };
