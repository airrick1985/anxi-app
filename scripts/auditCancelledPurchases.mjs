// 退戶資料清查（一次性）：舊版退戶沒有清除繳款紀錄、車位查詢也沒有限定建案，這支腳本找出留下的問題。
// 規格：docs/SPEC_PaymentDueReminder.md
//
// A. 繳款紀錄殘留：戶別目前的紀錄，id 也出現在該戶未復原的退戶備份中，就是舊買方留下的
// B. 車位跨案：退戶備份的 parkingData 含其他建案的車位（只回報，不提供修復）
//
// 用法：
//   node scripts/auditCancelledPurchases.mjs --out=/路徑/report.json
//       只讀不寫。報告寫入 --out，畫面只印統計。報告不含買方姓名、電話。
//   node scripts/auditCancelledPurchases.mjs --out=/路徑/report.json --only=fuyu665:A1,fuyu665:B2
//       只清查指定戶別。
//   node scripts/auditCancelledPurchases.mjs --out=/路徑/result.json --apply --only=fuyu665:A1,fuyu665:B2
//       只移除 A 的殘留紀錄，一定要指定確認過的戶別。移除前原始紀錄會存到
//       paymentRecordCleanupBackups/{projectId}_{unitId}_{時間}。不動 Drive 憑證。
//       可能是現任買方自己的紀錄時跳過：目前買方等於未復原備份的買方（same-buyer）、
//       殘留 id 也在已復原的備份（in-restored-backup）。報告用同名布林值標示這兩種情況。
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { initializeApp } from 'firebase/app';
import {
  collection, doc, getDoc, getDocs, getFirestore, runTransaction,
} from 'firebase/firestore';

const USAGE = '用法：node scripts/auditCancelledPurchases.mjs --out=報告路徑 [--only=projectId:unitId,...] [--apply]（--apply 必須搭配 --only）';
const READ_CONCURRENCY = 20;

export function parseArgs(argv) {
  const options = { apply: false, out: '', only: null };
  for (const arg of argv) {
    if (arg === '--apply') {
      options.apply = true;
    } else if (arg.startsWith('--out=')) {
      options.out = arg.slice('--out='.length);
    } else if (arg.startsWith('--only=')) {
      const entries = arg.slice('--only='.length).split(',').map(text => text.trim()).filter(Boolean);
      const only = [];
      for (const entry of entries) {
        const separator = entry.indexOf(':');
        if (separator <= 0 || separator === entry.length - 1) return { error: `--only 格式錯誤：${entry}（應為 projectId:unitId）` };
        only.push({ projectId: entry.slice(0, separator), unitId: entry.slice(separator + 1) });
      }
      options.only = only;
    } else {
      return { error: `不認識的參數：${arg}` };
    }
  }
  if (!options.out) return { error: '缺少 --out=' };
  if (options.apply && !options.only?.length) return { error: '--apply 必須搭配 --only=projectId:unitId,...，只處理確認過的戶別' };
  return options;
}

const unitKeyOf = (projectId, unitId) => `${projectId}_${unitId}`;
const recordsOf = data => (Array.isArray(data?.paymentRecords) ? data.paymentRecords.filter(Boolean) : []);
const amountOf = records => records.reduce((sum, record) => sum + (Number(record.amount) || 0), 0);
// 比對時忽略空白；空字串代表沒有買方，不算相同
const normalizeBuyerName = name => String(name ?? '').replace(/\s+/g, '');

// 依戶別整理未復原的備份；已復原的備份，紀錄本來就屬於目前買方，不可當成殘留。
// 買方姓名只留在記憶體供比對，不可寫入報告
export function groupBackupsByUnit(backups) {
  const units = new Map();
  const restoredIdsByUnit = new Map();
  const stats = { backupsTotal: backups.length, backupsRestoredSkipped: 0, backupsMissingKeys: 0 };
  backups.forEach(({ docId, data }) => {
    if (data?._isRestored === true) {
      stats.backupsRestoredSkipped += 1;
      const restoredKey = unitKeyOf(data.projectId, data.unitId);
      if (!restoredIdsByUnit.has(restoredKey)) restoredIdsByUnit.set(restoredKey, new Set());
      recordsOf(data).forEach((record) => {
        if (record.id) restoredIdsByUnit.get(restoredKey).add(record.id);
      });
      return;
    }
    if (!data?.projectId || !data?.unitId) {
      stats.backupsMissingKeys += 1;
      return;
    }
    const key = unitKeyOf(data.projectId, data.unitId);
    if (!units.has(key)) {
      units.set(key, {
        key, projectId: data.projectId, unitId: data.unitId, residualIds: new Set(), backupDocIds: [], backupBuyerNames: new Set(), restoredIds: new Set(),
      });
    }
    const unit = units.get(key);
    unit.backupDocIds.push(docId);
    const buyerName = normalizeBuyerName(data.buyerName);
    if (buyerName) unit.backupBuyerNames.add(buyerName);
    recordsOf(data).forEach((record) => {
      if (record.id) unit.residualIds.add(record.id);
    });
  });
  // 已復原的備份可能排在未復原的前面，全部讀完才對應回戶別；只有已復原備份的戶別不列入清查
  units.forEach((unit, key) => {
    unit.restoredIds = restoredIdsByUnit.get(key) || unit.restoredIds;
  });
  return { units, stats };
}

const isSameBuyerAsBackup = (unit, household) => {
  const buyerName = normalizeBuyerName(household?.buyerName);
  return !!buyerName && !!unit.backupBuyerNames?.has(buyerName);
};
const isInRestoredBackup = (unit, residual) => residual.some(record => unit.restoredIds?.has(record.id));

// 欄位刻意逐一列出：報告只能有這些欄，不可帶出買方姓名、電話
export function findResidualForUnit(unit, household) {
  const current = recordsOf(household);
  const residual = current.filter(record => record.id && unit.residualIds.has(record.id));
  if (residual.length === 0) return null;
  return {
    projectId: unit.projectId,
    unitId: unit.unitId,
    residualCount: residual.length,
    residualAmount: amountOf(residual),
    currentPaidTotal: amountOf(current),
    hasBackendStatus: !!household?.salesStatus_backend,
    sameBuyerAsBackup: isSameBuyerAsBackup(unit, household),
    alsoInRestoredBackup: isInRestoredBackup(unit, residual),
    recordIds: residual.map(record => record.id),
    backupDocIds: unit.backupDocIds,
  };
}

// 他案車位只回報；沒有 projectId 的舊資料無從判斷，不列入
export function findCrossProjectParking(backups) {
  const rows = [];
  backups.forEach(({ docId, data }) => {
    const parking = Array.isArray(data?.parkingData) ? data.parkingData : [];
    parking.forEach((item) => {
      if (item?.projectId && data?.projectId && item.projectId !== data.projectId) {
        rows.push({
          backupDocId: docId,
          projectId: data.projectId,
          unitId: data.unitId || '',
          otherProjectId: item.projectId,
          spotId: item.spotId || '',
          isRestored: data._isRestored === true,
        });
      }
    });
  });
  return rows;
}

const matchesOnly = (unit, only) => !only || only.some(o => o.projectId === unit.projectId && o.unitId === unit.unitId);

export function buildReport({ backups, households, only = null }) {
  const { units, stats } = groupBackupsByUnit(backups);
  const residual = [];
  let unitsChecked = 0;
  let unitsMissingHousehold = 0;
  units.forEach((unit) => {
    if (!matchesOnly(unit, only)) return;
    unitsChecked += 1;
    if (!households.has(unit.key)) {
      unitsMissingHousehold += 1;
      return;
    }
    const row = findResidualForUnit(unit, households.get(unit.key));
    if (row) residual.push(row);
  });
  const crossProjectParking = findCrossProjectParking(backups)
    .filter(row => !only || only.some(o => o.projectId === row.projectId && o.unitId === row.unitId));
  return {
    stats: {
      ...stats,
      unitsChecked,
      unitsMissingHousehold,
      unitsWithResidual: residual.length,
      residualRecords: residual.reduce((sum, row) => sum + row.residualCount, 0),
      residualAmount: residual.reduce((sum, row) => sum + row.residualAmount, 0),
      crossProjectParking: crossProjectParking.length,
    },
    residual,
    crossProjectParking,
  };
}

export function planCleanup(currentRecords, residualIds) {
  const list = Array.isArray(currentRecords) ? currentRecords : [];
  const isResidual = record => !!record?.id && residualIds.has(record.id);
  return { remaining: list.filter(record => !isResidual(record)), removed: list.filter(isResidual) };
}

export function cleanupTimestamp(now = new Date()) {
  return now.toISOString().replace(/[-:T]/g, '').slice(0, 14);
}

/**
 * 在交易內重讀戶別後才過濾，不用先前讀到的快照覆寫；備份與移除在同一個交易內完成。
 * 可能是現任買方自己的紀錄時整戶跳過，同樣以交易內讀到的資料判斷。
 * @param {object} params
 * @param {Function} params.transact (fn) => Promise，執行 Firestore 交易
 * @param {object} params.householdRef 戶別文件
 * @param {object} params.backupRef paymentRecordCleanupBackups 文件
 * @param {object} params.unit groupBackupsByUnit 的戶別資料
 * @param {Date} [params.now]
 */
export async function cleanupUnit({ transact, householdRef, backupRef, unit, now = new Date() }) {
  return transact(async (tx) => {
    const snapshot = await tx.get(householdRef);
    if (!snapshot.exists()) return { status: 'skipped', reason: 'household-not-found' };
    const household = snapshot.data();
    const original = household.paymentRecords;
    const { remaining, removed } = planCleanup(original, unit.residualIds);
    if (removed.length === 0) return { status: 'skipped', reason: 'no-residual' };
    if (isSameBuyerAsBackup(unit, household)) return { status: 'skipped', reason: 'same-buyer' };
    if (isInRestoredBackup(unit, removed)) return { status: 'skipped', reason: 'in-restored-backup' };
    const removedRecordIds = removed.map(record => record.id);
    const removedAmount = amountOf(removed);
    tx.set(backupRef, {
      projectId: unit.projectId,
      unitId: unit.unitId,
      paymentRecords: original,
      removedRecordIds,
      removedAmount,
      sourceBackupDocIds: unit.backupDocIds,
      createdAt: now.toISOString(),
    });
    tx.update(householdRef, { paymentRecords: remaining });
    return { status: 'applied', removedRecordIds, removedAmount, remainingCount: remaining.length };
  });
}

async function loadHouseholds(db, units, only) {
  const targets = [...units.values()].filter(unit => matchesOnly(unit, only));
  const households = new Map();
  for (let i = 0; i < targets.length; i += READ_CONCURRENCY) {
    await Promise.all(targets.slice(i, i + READ_CONCURRENCY).map(async (unit) => {
      const snapshot = await getDoc(doc(db, 'salesHouseholds', unit.key));
      if (snapshot.exists()) households.set(unit.key, snapshot.data());
    }));
  }
  return households;
}

async function applyCleanup(db, units, only) {
  const results = [];
  const now = new Date();
  const stamp = cleanupTimestamp(now);
  for (const { projectId, unitId } of only) {
    const key = unitKeyOf(projectId, unitId);
    const unit = units.get(key);
    if (!unit) {
      results.push({ projectId, unitId, status: 'skipped', reason: 'no-backup' });
      continue;
    }
    const result = await cleanupUnit({
      transact: fn => runTransaction(db, fn),
      householdRef: doc(db, 'salesHouseholds', key),
      backupRef: doc(db, 'paymentRecordCleanupBackups', `${key}_${stamp}`),
      unit,
      now,
    });
    results.push({ projectId, unitId, ...result });
  }
  return results;
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  if (options.error) {
    console.error(options.error);
    console.error(USAGE);
    process.exit(1);
  }

  const app = initializeApp({ apiKey: 'AIzaSyBdE26vC0UAprsdTgBcmYrVuO67ZbccMTA', projectId: 'apps-script-api-443402' });
  const db = getFirestore(app, 'anxi-app');

  const snapshot = await getDocs(collection(db, 'cancelledPurchases'));
  const backups = snapshot.docs.map(item => ({ docId: item.id, data: item.data() }));
  const { units } = groupBackupsByUnit(backups);
  const households = await loadHouseholds(db, units, options.only);
  const report = buildReport({ backups, households, only: options.only });

  const output = { generatedAt: new Date().toISOString(), mode: options.apply ? 'apply' : 'dry-run', ...report };
  if (options.apply) {
    output.applied = await applyCleanup(db, units, options.only);
  }

  mkdirSync(dirname(resolve(options.out)), { recursive: true });
  writeFileSync(options.out, `${JSON.stringify(output, null, 2)}\n`);

  console.log(options.apply ? '模式：apply' : '模式：dry-run（未寫入）');
  console.log('統計：', report.stats);
  if (output.applied) {
    const count = status => output.applied.filter(item => item.status === status).length;
    console.log('清理結果：', { applied: count('applied'), skipped: count('skipped') });
  }
  console.log(`報告：${options.out}`);
  process.exit(0);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
  main().catch((error) => {
    console.error('清查失敗：', error.message);
    process.exit(1);
  });
}
