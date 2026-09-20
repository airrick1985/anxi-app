const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { createRequire } = require('node:module');
const calc = require('../utils/commissionCalculation');
const { DEFAULT_PLANS, computePlanFinance, defaultManualFloor, planIdOf, planDocumentId, commissionLedgerId } = require('../utils/commissionPlans');

const projectId = 'fuyu1750';
const unitId = 'C-15';
// 3849 = 房屋 3649 + 車位 200；3750 已含車位，配套為 99。
const unit = { projectId, unitId, contractType: '毛胚合約', price_transaction_house: 3649, price_package_deal: 3750, price_floor_house_total: 3400, buyerName: '測試買方' };
const parking = { projectId, buyerUnitId: unitId, status_backend: '簽約', spotId: 'P1', price_transaction: 200, price_floor: 180 };

test('房屋只取代房屋底價；配套排除車位，價格不重複計入', () => {
  const house = computePlanFinance(unit, [parking], DEFAULT_PLANS[0], { manualFloor: 3300 });
  assert.deepEqual(house.errors, []);
  assert.equal(house.houseDeal, 3550);
  assert.equal(house.dealTotal, 3750);
  assert.equal(house.houseFloor, 3300);
  assert.equal(house.parkFloor, 180);
  assert.equal(house.totalFloor, 3480);
  const pkg = computePlanFinance(unit, [parking], DEFAULT_PLANS[1], { manualFloor: 80 });
  assert.deepEqual(pkg.errors, []);
  assert.equal(pkg.dealTotal, 99);
  assert.equal(pkg.totalFloor, 80);
  assert.equal(pkg.parkFloor, 0);
  assert.equal(pkg.parkDeal, 0);
  assert.equal(pkg.parkingSpots, '');
  assert.equal(calc.calcClaim(house, { commPct: 2.2 }).realClaim, 765600);
  assert.equal(calc.calcClaim(pkg, { commPct: 3 }).realClaim, 24000);
});

test('房屋底價預設為配套房屋總價減車位底價；其他來源不預設', () => {
  assert.equal(defaultManualFloor(unit, 180, 'splitHouse'), 3570);
  assert.equal(defaultManualFloor(unit, 0, 'splitHouse'), 3750);
  assert.equal(defaultManualFloor(unit, 4000, 'splitHouse'), 0);
  assert.equal(defaultManualFloor({ ...unit, price_package_deal: null }, 180, 'splitHouse'), null);
  assert.equal(defaultManualFloor(unit, 180, 'package'), null);
  assert.equal(defaultManualFloor(unit, 180, 'transaction'), null);
  assert.equal(computePlanFinance(unit, [parking], DEFAULT_PLANS[0], { manualFloor: defaultManualFloor(unit, 180, 'splitHouse') }).totalFloor, 3750);
});

test('一般合約維持既有金額；非一般合約可手動選用原成交價', () => {
  for (const sample of [{ ...unit, contractType: '一般合約' }, unit]) {
    const f = computePlanFinance(sample, [parking], DEFAULT_PLANS[0], { priceSource: 'transaction' });
    assert.equal(f.dealTotal, 3849);
    assert.equal(f.totalFloor, 3580);
    assert.equal(f.manualFloorRequired, false);
    assert.deepEqual(f.errors, []);
  }
});

test('手填底價必填且有限非負；不完整拆價和偽造來源會被拒絕', () => {
  for (const manualFloor of [null, undefined, '', '  ', -1, NaN, Infinity, 'abc']) {
    assert.ok(computePlanFinance(unit, [parking], DEFAULT_PLANS[1], { manualFloor }).errors.length);
  }
  assert.deepEqual(computePlanFinance(unit, [parking], DEFAULT_PLANS[1], { manualFloor: 0 }).errors, []);
  for (const price_package_deal of [null, 0, 5000]) {
    assert.ok(computePlanFinance({ ...unit, price_package_deal }, [parking], DEFAULT_PLANS[1], { manualFloor: 80 }).errors.length);
  }
  assert.ok(computePlanFinance(unit, [parking], DEFAULT_PLANS[1], { priceSource: 'transaction' }).errors.length);
  assert.ok(computePlanFinance({ ...unit, contractType: '一般合約' }, [parking], DEFAULT_PLANS[1], { manualFloor: 80 }).errors.length);
});

test('無方案歷史資料及舊 ledger ID 仍屬一般；前後端方案計算原始碼一致', () => {
  assert.equal(planIdOf({}), 'general');
  assert.equal(commissionLedgerId(projectId, unitId, 'general'), 'fuyu1750_C-15');
  assert.notEqual(commissionLedgerId(projectId, unitId, 'general'), commissionLedgerId(projectId, unitId, 'package'));
  const body = file => fs.readFileSync(file, 'utf8').split('// 無方案欄位')[1].split(/\n(?:export|module.exports)/)[0];
  assert.equal(body(path.join(__dirname, '../utils/commissionPlans.js')), body(path.join(__dirname, '../../src/utils/commissionPlans.js')));
});

// In-memory Firestore double: run real callable handlers and calculations without writing production data.
function harness() {
  const rows = new Map();
  let auto = 0;
  const DELETE = Symbol('delete');
  const check = obj => {
    if (obj && typeof obj === 'object') for (const value of Object.values(obj)) { assert.notEqual(value, undefined, 'Firestore rejects undefined values'); check(value); }
  };
  const apply = (ref, data, merge) => {
    check(data);
    const next = merge ? { ...rows.get(ref.path), ...data } : { ...data };
    for (const key of Object.keys(next)) if (next[key] === DELETE) delete next[key];
    rows.set(ref.path, next);
  };
  const ref = p => ({ path: p, id: p.split('/').pop(), get: async () => snap(p) });
  const snap = p => ({ id: p.split('/').pop(), ref: ref(p), exists: rows.has(p), data: () => structuredClone(rows.get(p)) });
  const query = (collection, filters = []) => ({
    doc: id => ref(`${collection}/${id}`),
    where: (key, op, value) => query(collection, [...filters, [key, op, value]]),
    get: async () => {
      const docs = [...rows.keys()].filter(p => p.startsWith(`${collection}/`)).filter(p => filters.every(([key, op, value]) => op === 'array-contains' ? rows.get(p)[key]?.includes(value) : rows.get(p)[key] === value)).map(snap);
      return { docs, size: docs.length, empty: !docs.length };
    },
    add: async data => { const r = ref(`${collection}/auto${auto++}`); apply(r, data, false); return r; },
  });
  const batch = () => {
    const pending = [];
    return {
      get: r => r.get(),
      set: (r, d, o) => pending.push(() => apply(r, d, o?.merge)),
      update: (r, d) => pending.push(() => apply(r, d, true)),
      delete: r => pending.push(() => rows.delete(r.path)),
      commit: async () => pending.forEach(fn => fn()),
    };
  };
  const db = { collection: name => query(name), batch, getAll: (...refs) => Promise.all(refs.map(r => r.get())), runTransaction: async fn => { const tx = batch(); const result = await fn(tx); await tx.commit(); return result; } };
  class HttpsError extends Error { constructor(code, message) { super(message); this.code = code; } }
  const filename = path.join(__dirname, '../commissionClaims.js');
  const realRequire = createRequire(filename);
  const exports = {};
  const requireMock = id => {
    if (id === 'firebase-functions/v2/https') return { onCall: (_, handler) => handler, HttpsError };
    if (id === '@google-cloud/firestore') return { Firestore: function () { return db; }, FieldValue: { serverTimestamp: () => ({ seconds: 1000 + auto++ }), delete: () => DELETE } };
    if (id === 'date-fns-tz') return { formatInTimeZone: () => '20260919000000' };
    if (id === 'nodemailer') return {};
    return realRequire(id);
  };
  vm.runInNewContext(fs.readFileSync(filename, 'utf8'), { require: requireMock, exports, console, Date, Math, Set, Map }, { filename });
  rows.set(`salesHouseholds/${projectId}_${unitId}`, unit);
  rows.set('salesParkings/P1', parking);
  rows.set('users/admin', { roles: ['系統管理員'] });
  rows.set(`commissionSettings/${planDocumentId(projectId, 'package')}`, { defaultCommissionPct: 3 });
  const entry = { unitId, period: 1, ratioPct: 100, manualFloor: 80, categories: { indiv: { ratePct: 1, allocations: [{ personKey: 'p1', name: '業務', sharePct: 100, mode: 'percent' }] } }, personProfiles: { p1: { name: '業務', role: '銷售', keepPct: 0, taxPct: 0, nhiPct: 0 } } };
  const call = (name, data) => exports[name]({ data: { projectId, operatorKey: 'admin', createdBy: '測試', ...data } });
  const submit = (planId, overrides = {}) => call('submitCommissionEntries', { planId, entries: [{ ...entry, ...overrides }] });
  const ledger = planId => rows.get(`commissionUnitLedgers/${commissionLedgerId(projectId, unitId, planId)}`)?.claimedRatioPct;
  return { rows, call, submit, ledger };
}

test('同戶一般、配套、自訂各請100%；各自佣金設定、紀錄及獎金，超額被拒絕', async () => {
  const h = harness();
  h.rows.set(`commissionPlans/${planDocumentId(projectId, 'decor')}`, { projectId, planId: 'decor', name: '裝修請佣', priceBasis: 'package' });
  // 內建方案改名只覆寫名稱，價格來源不受定義文件影響。
  h.rows.set(`commissionPlans/${planDocumentId(projectId, 'general')}`, { projectId, planId: 'general', name: '一般請佣（房屋）', priceBasis: 'package' });
  const house = await h.submit('general', { manualFloor: 3300, note: '  毛胚合約  ' });
  const pkg = await h.submit('package');
  await h.submit('decor');
  assert.equal(h.ledger('general'), 100);
  assert.equal(h.ledger('package'), 100);
  assert.equal(h.ledger('decor'), 100);
  const hr = h.rows.get(`commissionRecords/${house.results[0].recordId}`);
  const pr = h.rows.get(`commissionRecords/${pkg.results[0].recordId}`);
  assert.equal(hr.snapshot.dealTotal, 3750);
  assert.equal(hr.planName, '一般請佣（房屋）');
  assert.equal(hr.note, '毛胚合約');
  assert.equal(pr.note, '');
  assert.equal(hr.snapshot.priceBasis, 'house');
  assert.equal(pr.snapshot.dealTotal, 99);
  assert.equal(hr.commPct, 2.2);
  assert.equal(pr.commPct, 3);
  const bonuses = [...h.rows.entries()].filter(([k]) => k.startsWith('bonusRecords/')).map(([, v]) => v);
  assert.equal(bonuses.length, 3);
  assert.equal(bonuses.find(b => b.planId === 'general').subtotal, 375000);
  assert.equal(bonuses.find(b => b.planId === 'package').subtotal, 9900);
  await assert.rejects(h.submit('package', { ratioPct: 1 }), /超過 100%/);
  await assert.rejects(h.submit('missing'), /找不到.*方案/);
  await assert.rejects(h.submit('../bad'), /識別不正確/);
});

test('底價更新不改寫前期快照；後端拒絕未填底價', async () => {
  const h = harness();
  await assert.rejects(h.submit('package', { manualFloor: null }), /配套底價/);
  const first = await h.submit('package', { ratioPct: 50, manualFloor: 80 });
  await h.submit('package', { ratioPct: 50, manualFloor: 85, period: 2 });
  assert.equal(h.rows.get(`commissionRecords/${first.results[0].recordId}`).snapshot.manualFloor, 80);
  assert.equal(h.ledger('package'), 100);
});

test('退佣及作廢退佣只回溯本方案；跨方案來源被拒絕', async () => {
  const h = harness();
  const general = await h.submit('general', { manualFloor: 3300 });
  const pkg = await h.submit('package');
  const refund = { unitId, period: 2, sourceRecordIds: [pkg.results[0].recordId], includeKeep: true, refundBonus: true };
  await assert.rejects(h.call('submitCommissionEntries', { planId: 'general', refunds: [refund] }), /不屬於/);
  const result = await h.call('submitCommissionEntries', { planId: 'package', refunds: [refund] });
  assert.equal(h.ledger('package'), 0);
  assert.equal(h.ledger('general'), 100);
  const packageBonus = [...h.rows.entries()].filter(([k,v]) => k.startsWith('bonusRecords/') && v.planId === 'package').map(([,v]) => v);
  assert.equal(packageBonus.reduce((n,b) => n + b.subtotal, 0), 0);
  await h.call('voidCommissionRecord', { planId: 'package', recordId: result.results[0].recordId });
  assert.equal(h.ledger('package'), 100);
  await assert.rejects(h.call('voidCommissionRecord', { planId: 'package', recordId: general.results[0].recordId }), /不屬於/);
});

test('整期作廢、清除及保留款檢查只作用於該方案；舊紀錄仍算一般', async () => {
  const h = harness();
  const general = await h.submit('general', { manualFloor: 3300 });
  const pkg = await h.submit('package');
  // Simulate legacy untagged records and ledgers.
  for (const [key, row] of h.rows) if (row.planId === 'general') { delete row.planId; h.rows.set(key, row); }
  h.rows.set('retentionPayouts/legacy', { projectId, periods: [1], amount: 1 });
  await h.call('voidCommissionPeriod', { planId: 'package', period: 1, voidReason: '測試' });
  assert.equal(h.ledger('package'), 0);
  assert.equal(h.ledger('general'), 100);
  assert.equal(h.rows.get(`commissionRecords/${general.results[0].recordId}`).status, 'active');
  await h.call('purgeVoidedCommissionPeriod', { planId: 'package', period: 1 });
  assert.equal(h.rows.has(`commissionRecords/${pkg.results[0].recordId}`), false);
  await assert.rejects(h.call('voidCommissionPeriod', { period: 1, voidReason: '測試' }), /保留款/);
  h.rows.delete('retentionPayouts/legacy');
  await h.call('voidCommissionPeriod', { period: 1, voidReason: '測試' });
  assert.equal(h.ledger('general'), 0);
});

test('歷史匯入同一期別不跨方案衝突；撤銷只刪本方案批次', async () => {
  const h = harness();
  await h.submit('general', { manualFloor: 3300 });
  const data = { planId: 'package', claims: [{ unitId, period: 1, ratioPct: 100 }], bonuses: [] };
  const result = await h.call('importCommissionHistory', data);
  assert.equal(h.ledger('package'), 100);
  assert.equal(h.ledger('general'), 100);
  await assert.rejects(h.call('undoCommissionImport', { planId: 'general', importBatchId: result.importBatchId }), /找不到/);
  await h.call('undoCommissionImport', { planId: 'package', importBatchId: result.importBatchId });
  assert.equal(h.ledger('package'), 0);
  assert.equal(h.ledger('general'), 100);
});

test('方案 CRUD：新增、更新、刪除與已刪方案阻擋，保留設定及版型', async () => {
  const h = harness();
  const planId = 'renovation';
  await h.call('manageCommissionPlan', { operation: 'create', planId, name: '裝修', priceBasis: 'package' });
  await h.call('manageCommissionPlan', { operation: 'update', planId, name: '裝修改名', priceBasis: 'house' });
  const ref = `commissionPlans/${planDocumentId(projectId, planId)}`;
  assert.equal(h.rows.get(ref).name, '裝修改名');
  assert.equal(h.rows.get(ref).priceBasis, 'house');
  const settingsRef = `commissionSettings/${planDocumentId(projectId, planId)}`;
  h.rows.set(settingsRef, { defaultCommissionPct: 3 });
  await h.call('manageCommissionPlan', { operation: 'delete', planId });
  assert.ok(h.rows.get(ref).deletedAt);
  assert.equal(h.rows.get(settingsRef).defaultCommissionPct, 3);
  await assert.rejects(h.submit(planId), /已刪除/);
  await assert.rejects(h.call('manageCommissionPlan', { operation: 'update', planId, name: '復活', priceBasis: 'house' }), /已刪除/);
});

test('內建方案僅可改名；使用過的自訂方案禁止改價格來源或刪除', async () => {
  const h = harness();
  await h.call('manageCommissionPlan', { operation: 'update', planId: 'general', name: '房屋請佣', priceBasis: 'house' });
  await assert.rejects(h.call('manageCommissionPlan', { operation: 'delete', planId: 'general' }), /內建/);
  await assert.rejects(h.call('manageCommissionPlan', { operation: 'update', planId: 'package', name: '配套請佣', priceBasis: 'house' }), /內建/);
  await h.call('manageCommissionPlan', { operation: 'create', planId: 'renovation', name: '裝修', priceBasis: 'package' });
  const result = await h.submit('renovation');
  await h.call('manageCommissionPlan', { operation: 'update', planId: 'renovation', name: '裝修改名', priceBasis: 'package' });
  assert.equal(h.rows.get(`commissionRecords/${result.results[0].recordId}`).planName, '裝修');
  await assert.rejects(h.call('manageCommissionPlan', { operation: 'delete', planId: 'renovation' }), /已有請佣/);
  await assert.rejects(h.call('manageCommissionPlan', { operation: 'update', planId: 'renovation', name: '裝修改名', priceBasis: 'house' }), /已有請佣/);
});

test('方案管理檢查名稱、權限，並保護未標記 used 的歷史紀錄', async () => {
  const h = harness();
  await assert.rejects(h.call('manageCommissionPlan', { operation: 'create', planId: 'bad', name: '', priceBasis: 'house' }), /方案名稱/);
  await assert.rejects(h.call('manageCommissionPlan', { operation: 'create', planId: 'bad', name: '一般請佣', priceBasis: 'house' }), /同名/);
  await assert.rejects(h.call('manageCommissionPlan', { operation: 'create', planId: 'bad', name: '新方案', priceBasis: 'house', operatorKey: '' }), /操作者/);
  h.rows.set(`commissionPlans/${planDocumentId(projectId, 'legacy')}`, { projectId, planId: 'legacy', name: '舊裝修', priceBasis: 'package' });
  h.rows.set('bonusRecords/old', { projectId, planId: 'legacy', status: 'voided' });
  await assert.rejects(h.call('manageCommissionPlan', { operation: 'delete', planId: 'legacy' }), /已有請佣/);
});

test('一般及配套可重複改名：隔離建案、保留全部歷史帳務並繼續原方案請佣', async () => {
  const h = harness();
  for (const planId of ['general', 'package']) {
    await h.submit(planId, { ratioPct: 40 });
    const otherProjectRef = `commissionPlans/${planDocumentId('other-project', planId)}`;
    h.rows.set(otherProjectRef, { projectId: 'other-project', planId, name: '其他建案名稱', priceBasis: planId === 'general' ? 'house' : 'package' });
    const protectedRows = [...h.rows].filter(([key]) => /^(commissionRecords|bonusRecords|commissionUnitLedgers|commissionSettings|commissionExportConfigs|retentionPayouts)\//.test(key));
    const before = JSON.stringify(protectedRows);
    for (const name of ['首次改名', '再次改名']) {
      await h.call('manageCommissionPlan', { operation: 'update', planId, name: `${planId}-${name}`, priceBasis: planId === 'general' ? 'house' : 'package' });
      assert.equal(h.rows.get(`commissionPlans/${planDocumentId(projectId, planId)}`).name, `${planId}-${name}`);
      assert.equal(h.rows.get(otherProjectRef).name, '其他建案名稱');
      assert.equal(JSON.stringify(protectedRows.map(([key]) => [key, h.rows.get(key)])), before);
      assert.equal(h.ledger(planId), 40);
    }
    const next = await h.submit(planId, { period: 2, ratioPct: 60 });
    const record = h.rows.get(`commissionRecords/${next.results[0].recordId}`);
    assert.equal(record.planId, planId);
    assert.equal(record.planName, `${planId}-再次改名`);
    assert.equal(h.ledger(planId), 100);
    await assert.rejects(h.submit(planId, { period: 3, ratioPct: 1 }), /100/);
  }
});
