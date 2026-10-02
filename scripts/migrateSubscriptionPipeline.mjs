// 訂閱管理：舊資料 (startDate/endDate/paymentRecords) 轉為跟進流程 cycles 的一次性轉換。
// 規格：docs/SPEC_SubscriptionPipeline.md §8
//
// 轉換規則與前後端即時轉換 legacyToCycles 相同；已有 cycles 的訂閱跳過。
// paymentRecords 保留不刪 (僅不再使用)。
//
// 用法：
//   node scripts/migrateSubscriptionPipeline.mjs          # 只檢視不寫入（dry-run）
//   node scripts/migrateSubscriptionPipeline.mjs --apply  # 實際寫入
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, writeBatch } from 'firebase/firestore';
import { legacyToCycles, cycleSummary, STAGES } from '../src/utils/subscriptionPipeline.js';

const APPLY = process.argv.includes('--apply');

const app = initializeApp({ apiKey: 'AIzaSyBdE26vC0UAprsdTgBcmYrVuO67ZbccMTA', projectId: 'apps-script-api-443402' });
const db = getFirestore(app, 'anxi-app');

const tsToYmd = (v) => (v && typeof v.toDate === 'function' ? v.toDate().toISOString().split('T')[0] : (v || ''));

const snap = await getDocs(collection(db, 'subscriptions'));
const toWrite = [];
let skippedHasCycles = 0;
let skippedEmpty = 0;

snap.forEach(d => {
  const raw = d.data();
  if (Array.isArray(raw.cycles) && raw.cycles.length > 0) {
    skippedHasCycles += 1;
    return;
  }
  const cycles = legacyToCycles({ ...raw, startDate: tsToYmd(raw.startDate), endDate: tsToYmd(raw.endDate) });
  if (cycles.length === 0) {
    skippedEmpty += 1;
    console.log(`  - 略過（無啟用日也無繳款紀錄）：${raw.projectName} / ${raw.systemFunction}`);
    return;
  }
  const summary = cycleSummary(cycles[0]);
  const stage = STAGES.find(s => s.key === summary.stage)?.label;
  console.log(`  ✓ ${raw.projectName} / ${raw.systemFunction}：款項 ${cycles[0].installments.length} 期 → ${stage}${summary.date ? `（${summary.date}）` : ''}`);
  toWrite.push({ ref: d.ref, cycles: JSON.parse(JSON.stringify(cycles)) });
});

console.log(`\n共 ${snap.size} 筆：待轉換 ${toWrite.length}、已有 cycles ${skippedHasCycles}、無資料 ${skippedEmpty}`);

if (!APPLY) {
  console.log('dry-run：未寫入。加上 --apply 實際寫入。');
  process.exit(0);
}

for (let i = 0; i < toWrite.length; i += 400) {
  const batch = writeBatch(db);
  toWrite.slice(i, i + 400).forEach(({ ref, cycles }) => batch.update(ref, { cycles }));
  await batch.commit();
}
console.log(`已寫入 ${toWrite.length} 筆。`);
process.exit(0);
