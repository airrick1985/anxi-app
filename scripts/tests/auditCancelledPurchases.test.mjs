import test from 'node:test';
import assert from 'node:assert/strict';
import {
  parseArgs, groupBackupsByUnit, findResidualForUnit, findCrossProjectParking, buildReport,
  planCleanup, cleanupUnit, cleanupTimestamp,
} from '../auditCancelledPurchases.mjs';

const OLD_A = { id: 'pr_a', date: '2026-01-01', amount: 1000000, note: 'A' };
const OLD_B = { id: 'pr_b', date: '2026-06-01', amount: 2000000, note: 'B' };
const NEW_C = { id: 'pr_c', date: '2026-10-01', amount: 500000, note: '新買方' };

const backup = (docId, data) => ({
  docId,
  data: {
    projectId: 'p1', unitId: 'A1', buyerName: '王小明', buyerPhone: '0912345678', paymentRecords: [], ...data,
  },
});

const household = (records, extra = {}) => ({
  projectId: 'p1', unitId: 'A1', salesStatus_backend: '簽約', buyerName: '李大同', buyerPhone: '0987654321', paymentRecords: records, ...extra,
});

test('同 id 才算殘留：新買方紀錄不動，金額分開統計', () => {
  const backups = [backup('b1', { paymentRecords: [OLD_A] })];
  const report = buildReport({ backups, households: new Map([['p1_A1', household([OLD_A, NEW_C])]]) });
  assert.deepEqual(report.residual, [{
    projectId: 'p1',
    unitId: 'A1',
    residualCount: 1,
    residualAmount: 1000000,
    currentPaidTotal: 1500000,
    hasBackendStatus: true,
    sameBuyerAsBackup: false,
    alsoInRestoredBackup: false,
    recordIds: ['pr_a'],
    backupDocIds: ['b1'],
  }]);
  assert.equal(report.stats.unitsWithResidual, 1);
  assert.equal(report.stats.residualRecords, 1);
  assert.equal(report.stats.residualAmount, 1000000);
});

test('日期、金額相同但 id 不同不算殘留，沒有 id 的紀錄也不算', () => {
  const sameContent = { ...OLD_A, id: 'pr_new' };
  const { id, ...noId } = OLD_A;
  const backups = [backup('b1', { paymentRecords: [OLD_A, noId] })];
  const report = buildReport({ backups, households: new Map([['p1_A1', household([sameContent, noId])]]) });
  assert.deepEqual(report.residual, []);
});

test('已復原的備份略過：紀錄屬於目前買方', () => {
  const backups = [backup('b1', { paymentRecords: [OLD_A], _isRestored: true })];
  const report = buildReport({ backups, households: new Map([['p1_A1', household([OLD_A])]]) });
  assert.deepEqual(report.residual, []);
  assert.equal(report.stats.backupsRestoredSkipped, 1);
  assert.equal(report.stats.unitsChecked, 0);
});

test('多筆備份：殘留取聯集，同一筆不重複計算；已復原那筆不算', () => {
  const backups = [
    backup('b1', { paymentRecords: [OLD_A] }),
    backup('b2', { paymentRecords: [OLD_A, OLD_B] }),
    backup('b3', { paymentRecords: [NEW_C], _isRestored: true }),
  ];
  const report = buildReport({ backups, households: new Map([['p1_A1', household([OLD_A, OLD_B, NEW_C])]]) });
  assert.equal(report.residual.length, 1);
  const [row] = report.residual;
  assert.deepEqual(row.recordIds, ['pr_a', 'pr_b']);
  assert.equal(row.residualCount, 2);
  assert.equal(row.residualAmount, 3000000);
  assert.equal(row.currentPaidTotal, 3500000);
  assert.deepEqual(row.backupDocIds, ['b1', 'b2']);
});

test('sameBuyerAsBackup：目前買方等於任一未復原備份的買方；空白差異不算不同', () => {
  const report = buyerName => buildReport({
    backups: [
      backup('b1', { paymentRecords: [OLD_A], buyerName: '陳一' }),
      backup('b2', { paymentRecords: [OLD_B], buyerName: '王小明' }),
    ],
    households: new Map([['p1_A1', household([OLD_A], { buyerName })]]),
  }).residual[0].sameBuyerAsBackup;
  assert.equal(report('李大同'), false);
  assert.equal(report('陳一'), true);
  assert.equal(report('王小明'), true);
  assert.equal(report(' 王　小明 '), true);
});

test('sameBuyerAsBackup：雙方都沒有買方不算相同；已復原備份的買方不列入比對', () => {
  const blank = (currentName, backupName) => buildReport({
    backups: [backup('b1', { paymentRecords: [OLD_A], buyerName: backupName })],
    households: new Map([['p1_A1', household([OLD_A], { buyerName: currentName })]]),
  }).residual[0].sameBuyerAsBackup;
  assert.equal(blank(null, null), false);
  assert.equal(blank('', ''), false);
  assert.equal(blank('  ', undefined), false);

  const restoredOnly = buildReport({
    backups: [
      backup('b1', { paymentRecords: [OLD_A], buyerName: '陳一' }),
      backup('b2', { paymentRecords: [NEW_C], buyerName: '李大同', _isRestored: true }),
    ],
    households: new Map([['p1_A1', household([OLD_A])]]),
  });
  assert.equal(restoredOnly.residual[0].sameBuyerAsBackup, false);
});

test('alsoInRestoredBackup：殘留 id 也在該戶已復原的備份；與備份順序無關，其他戶不算', () => {
  const restored = backup('r1', { paymentRecords: [OLD_A], _isRestored: true });
  const active = backup('b1', { paymentRecords: [OLD_A, OLD_B] });
  const households = new Map([['p1_A1', household([OLD_A, OLD_B])]]);
  for (const backups of [[restored, active], [active, restored]]) {
    const [row] = buildReport({ backups, households }).residual;
    assert.equal(row.alsoInRestoredBackup, true);
    assert.deepEqual(row.recordIds, ['pr_a', 'pr_b'], '已復原備份的 id 仍要列為殘留，由 --apply 判斷跳過');
    assert.deepEqual(row.backupDocIds, ['b1']);
  }

  // 已復原備份的紀錄不在目前的殘留內
  const other = buildReport({
    backups: [backup('r1', { paymentRecords: [NEW_C], _isRestored: true }), active],
    households,
  });
  assert.equal(other.residual[0].alsoInRestoredBackup, false);
  // 其他戶、其他建案已復原的備份不影響
  const elsewhere = buildReport({
    backups: [
      backup('r1', { unitId: 'A2', paymentRecords: [OLD_A], _isRestored: true }),
      backup('r2', { projectId: 'p2', paymentRecords: [OLD_A], _isRestored: true }),
      active,
    ],
    households,
  });
  assert.equal(elsewhere.residual[0].alsoInRestoredBackup, false);
});

test('只有已復原備份的戶別不列入清查；已復原備份缺欄位也不出錯', () => {
  const report = buildReport({
    backups: [backup('r1', { paymentRecords: [OLD_A], _isRestored: true }), { docId: 'r2', data: { _isRestored: true, paymentRecords: [OLD_A] } }],
    households: new Map([['p1_A1', household([OLD_A])]]),
  });
  assert.deepEqual(report.residual, []);
  assert.equal(report.stats.unitsChecked, 0);
  assert.equal(report.stats.backupsRestoredSkipped, 2);
});

test('新增的布林欄位不帶出姓名電話，同買方的情況也一樣', () => {
  const report = buildReport({
    backups: [
      backup('b1', { paymentRecords: [OLD_A] }),
      backup('r1', { paymentRecords: [OLD_A], _isRestored: true }),
    ],
    households: new Map([['p1_A1', household([OLD_A], { buyerName: '王小明' })]]),
  });
  const [row] = report.residual;
  assert.deepEqual([row.sameBuyerAsBackup, row.alsoInRestoredBackup], [true, true]);
  const text = JSON.stringify(report);
  for (const secret of ['王小明', '李大同', '0912345678', '0987654321']) {
    assert.ok(!text.includes(secret), secret);
  }
});

test('不同建案、不同戶別的備份不混用', () => {
  const backups = [
    backup('b1', { paymentRecords: [OLD_A] }),
    backup('b2', { projectId: 'p2', paymentRecords: [OLD_B] }),
    backup('b3', { unitId: 'A2', paymentRecords: [NEW_C] }),
  ];
  const report = buildReport({
    backups,
    households: new Map([
      ['p1_A1', household([OLD_B, NEW_C])],
      ['p2_A1', household([OLD_A])],
      ['p1_A2', household([OLD_A])],
    ]),
  });
  assert.deepEqual(report.residual, []);
});

test('報告不含買方姓名、電話；空狀態與缺戶別都有統計', () => {
  const backups = [
    backup('b1', { paymentRecords: [OLD_A] }),
    backup('b2', { unitId: 'A9', paymentRecords: [OLD_B] }),
    { docId: 'b3', data: { paymentRecords: [OLD_B] } },
  ];
  const report = buildReport({
    backups,
    households: new Map([['p1_A1', household([OLD_A], { salesStatus_backend: null })]]),
  });
  assert.equal(report.residual[0].hasBackendStatus, false);
  assert.equal(report.stats.unitsMissingHousehold, 1);
  assert.equal(report.stats.backupsMissingKeys, 1);
  const text = JSON.stringify(report);
  for (const secret of ['王小明', '李大同', '0912345678', '0987654321']) {
    assert.ok(!text.includes(secret), secret);
  }
});

test('--only 只處理指定戶別', () => {
  const backups = [
    backup('b1', { paymentRecords: [OLD_A] }),
    backup('b2', { unitId: 'A2', paymentRecords: [OLD_B], parkingData: [{ projectId: 'p9', spotId: 'S1' }] }),
    backup('b3', { unitId: 'A3', paymentRecords: [OLD_B], parkingData: [{ projectId: 'p9', spotId: 'S2' }] }),
  ];
  const households = new Map([
    ['p1_A1', household([OLD_A])],
    ['p1_A2', household([OLD_B])],
    ['p1_A3', household([OLD_B])],
  ]);
  const report = buildReport({ backups, households, only: [{ projectId: 'p1', unitId: 'A2' }] });
  assert.deepEqual(report.residual.map(row => row.unitId), ['A2']);
  assert.deepEqual(report.crossProjectParking.map(row => row.spotId), ['S1']);
  assert.equal(report.stats.unitsChecked, 1);
});

test('車位跨案：只回報 projectId 不同的項目，含已復原的備份', () => {
  const rows = findCrossProjectParking([
    backup('b1', { parkingData: [{ projectId: 'p1', spotId: 'S1' }, { projectId: 'p2', spotId: 'S2', buyerName: '王小明' }, { spotId: 'S3' }] }),
    backup('b2', { unitId: 'A2', _isRestored: true, parkingData: [{ projectId: 'p3', spotId: 'S4' }] }),
    backup('b3', { parkingData: 'bad' }),
    { docId: 'b4', data: { parkingData: [{ projectId: 'p2', spotId: 'S5' }] } },
  ]);
  assert.deepEqual(rows, [
    { backupDocId: 'b1', projectId: 'p1', unitId: 'A1', otherProjectId: 'p2', spotId: 'S2', isRestored: false },
    { backupDocId: 'b2', projectId: 'p1', unitId: 'A2', otherProjectId: 'p3', spotId: 'S4', isRestored: true },
  ]);
  assert.ok(!JSON.stringify(rows).includes('王小明'));
});

test('參數：--apply 沒帶 --only 要拒絕，缺 --out 也要拒絕', () => {
  assert.deepEqual(parseArgs(['--out=/a.json']), { apply: false, out: '/a.json', only: null });
  assert.deepEqual(parseArgs(['--out=/a.json', '--only=p1:A1, p2:B-2']).only, [
    { projectId: 'p1', unitId: 'A1' },
    { projectId: 'p2', unitId: 'B-2' },
  ]);
  const applied = parseArgs(['--apply', '--out=/a.json', '--only=p1:A1']);
  assert.equal(applied.apply, true);
  assert.deepEqual(applied.only, [{ projectId: 'p1', unitId: 'A1' }]);

  assert.match(parseArgs(['--apply', '--out=/a.json']).error, /必須搭配 --only/);
  assert.match(parseArgs(['--apply', '--out=/a.json', '--only=']).error, /必須搭配 --only/);
  assert.match(parseArgs(['--apply']).error, /缺少 --out/);
  assert.match(parseArgs([]).error, /缺少 --out/);
  assert.match(parseArgs(['--out=/a.json', '--only=p1']).error, /格式錯誤/);
  assert.match(parseArgs(['--out=/a.json', '--only=:A1']).error, /格式錯誤/);
  assert.match(parseArgs(['--out=/a.json', '--only=p1:']).error, /格式錯誤/);
  assert.match(parseArgs(['--out=/a.json', '--force']).error, /不認識/);
});

test('清理比對：只移除殘留 id，其他紀錄順序不變；沒有 id 的不動', () => {
  const { id, ...noId } = NEW_C;
  const { remaining, removed } = planCleanup([OLD_A, NEW_C, noId, OLD_B], new Set(['pr_a', 'pr_b']));
  assert.deepEqual(remaining, [NEW_C, noId]);
  assert.deepEqual(removed, [OLD_A, OLD_B]);
  assert.deepEqual(planCleanup(undefined, new Set(['x'])), { remaining: [], removed: [] });
});

function fakeTransaction(current) {
  const writes = [];
  const reads = [];
  const transact = fn => fn({
    get: async (ref) => {
      reads.push(ref);
      return { exists: () => current !== null, data: () => current };
    },
    set: (ref, data) => writes.push({ type: 'set', ref, data }),
    update: (ref, data) => writes.push({ type: 'update', ref, data }),
  });
  return { transact, writes, reads };
}

const UNIT = { projectId: 'p1', unitId: 'A1', residualIds: new Set(['pr_a']), backupDocIds: ['b1'] };
const NOW = new Date('2026-11-06T01:02:03.456Z');

test('清理：交易內重讀，用最新資料過濾，新增的紀錄不會被舊快照蓋掉；原始資料先備份', async () => {
  // 掃描之後才有人新增 pr_new：交易內讀到的才算數
  const latest = { paymentRecords: [OLD_A, NEW_C, { id: 'pr_new', amount: 1 }], buyerName: '李大同' };
  const { transact, writes, reads } = fakeTransaction(latest);
  const result = await cleanupUnit({ transact, householdRef: 'house', backupRef: 'backup', unit: UNIT, now: NOW });

  assert.deepEqual(reads, ['house']);
  assert.deepEqual(result, { status: 'applied', removedRecordIds: ['pr_a'], removedAmount: 1000000, remainingCount: 2 });
  assert.deepEqual(writes.map(write => [write.type, write.ref]), [['set', 'backup'], ['update', 'house']]);
  assert.deepEqual(writes[0].data.paymentRecords, latest.paymentRecords);
  assert.deepEqual(writes[0].data.removedRecordIds, ['pr_a']);
  assert.deepEqual(writes[0].data.sourceBackupDocIds, ['b1']);
  assert.equal(writes[0].data.createdAt, NOW.toISOString());
  assert.ok(!('buyerName' in writes[0].data));
  assert.deepEqual(writes[1].data, { paymentRecords: [NEW_C, { id: 'pr_new', amount: 1 }] });
});

test('清理：沒有殘留或戶別不存在時不寫入任何資料', async () => {
  const clean = fakeTransaction({ paymentRecords: [NEW_C] });
  assert.deepEqual(
    await cleanupUnit({ transact: clean.transact, householdRef: 'house', backupRef: 'backup', unit: UNIT, now: NOW }),
    { status: 'skipped', reason: 'no-residual' },
  );
  assert.equal(clean.writes.length, 0);

  const missing = fakeTransaction(null);
  assert.deepEqual(
    await cleanupUnit({ transact: missing.transact, householdRef: 'house', backupRef: 'backup', unit: UNIT, now: NOW }),
    { status: 'skipped', reason: 'household-not-found' },
  );
  assert.equal(missing.writes.length, 0);
});

test('清理：可能是現任買方自己的紀錄時跳過，不寫入，也不回傳姓名', async () => {
  const unitOf = (extra) => ({ ...UNIT, backupBuyerNames: new Set(['王小明']), restoredIds: new Set(), ...extra });

  const sameBuyer = fakeTransaction({ paymentRecords: [OLD_A, NEW_C], buyerName: ' 王小明' });
  const skippedBuyer = await cleanupUnit({ transact: sameBuyer.transact, householdRef: 'house', backupRef: 'backup', unit: unitOf(), now: NOW });
  assert.deepEqual(skippedBuyer, { status: 'skipped', reason: 'same-buyer' });
  assert.equal(sameBuyer.writes.length, 0);

  const inRestored = fakeTransaction({ paymentRecords: [OLD_A, NEW_C], buyerName: '李大同' });
  const skippedRestored = await cleanupUnit({
    transact: inRestored.transact, householdRef: 'house', backupRef: 'backup', unit: unitOf({ restoredIds: new Set(['pr_a']) }), now: NOW,
  });
  assert.deepEqual(skippedRestored, { status: 'skipped', reason: 'in-restored-backup' });
  assert.equal(inRestored.writes.length, 0);

  // 兩者都符合時回報 same-buyer；沒有買方不算相同，可以清
  const both = fakeTransaction({ paymentRecords: [OLD_A], buyerName: '王小明' });
  assert.equal((await cleanupUnit({
    transact: both.transact, householdRef: 'house', backupRef: 'backup', unit: unitOf({ restoredIds: new Set(['pr_a']) }), now: NOW,
  })).reason, 'same-buyer');

  const noBuyer = fakeTransaction({ paymentRecords: [OLD_A], buyerName: null });
  const applied = await cleanupUnit({
    transact: noBuyer.transact, householdRef: 'house', backupRef: 'backup', unit: unitOf({ backupBuyerNames: new Set() }), now: NOW,
  });
  assert.equal(applied.status, 'applied');
  assert.equal(noBuyer.writes.length, 2);
});

test('清理：跳過判斷用交易內讀到的買方，不用掃描時的快照', async () => {
  const unit = { ...UNIT, backupBuyerNames: new Set(['王小明']), restoredIds: new Set() };
  // 掃描時是別人，交易內已改成備份上的買方
  const changed = fakeTransaction({ paymentRecords: [OLD_A], buyerName: '王小明' });
  assert.equal((await cleanupUnit({ transact: changed.transact, householdRef: 'house', backupRef: 'backup', unit, now: NOW })).reason, 'same-buyer');
  // 掃描時相同，交易內已換人
  const replaced = fakeTransaction({ paymentRecords: [OLD_A], buyerName: '李大同' });
  assert.equal((await cleanupUnit({ transact: replaced.transact, householdRef: 'house', backupRef: 'backup', unit, now: NOW })).status, 'applied');
  // 沒有殘留時維持 no-residual，不會回報成買方相同
  const clean = fakeTransaction({ paymentRecords: [NEW_C], buyerName: '王小明' });
  assert.equal((await cleanupUnit({ transact: clean.transact, householdRef: 'house', backupRef: 'backup', unit, now: NOW })).reason, 'no-residual');
});

test('清理：groupBackupsByUnit 的結果可直接交給清理判斷', async () => {
  const { units } = groupBackupsByUnit([
    backup('b1', { paymentRecords: [OLD_A] }),
    backup('r1', { paymentRecords: [OLD_B], _isRestored: true }),
  ]);
  const unit = units.get('p1_A1');
  assert.deepEqual([...unit.restoredIds], ['pr_b']);
  const fromScan = fakeTransaction({ paymentRecords: [OLD_A], buyerName: '王小明' });
  assert.equal((await cleanupUnit({ transact: fromScan.transact, householdRef: 'house', backupRef: 'backup', unit, now: NOW })).reason, 'same-buyer');
});

test('清理備份文件時間格式固定，可排序', () => {
  assert.equal(cleanupTimestamp(NOW), '20261106010203');
});

test('groupBackupsByUnit 統計筆數', () => {
  const { stats, units } = groupBackupsByUnit([
    backup('b1', { paymentRecords: [OLD_A] }),
    backup('b2', { _isRestored: true }),
    { docId: 'b3', data: {} },
  ]);
  assert.deepEqual(stats, { backupsTotal: 3, backupsRestoredSkipped: 1, backupsMissingKeys: 1 });
  assert.deepEqual([...units.keys()], ['p1_A1']);
  assert.equal(findResidualForUnit(units.get('p1_A1'), household([NEW_C])), null);
});
