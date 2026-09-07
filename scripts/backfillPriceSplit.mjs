// 表價／底價改為「明細為權威、總額自動計算」前的一次性資料回填。
//
// 背景：房屋總表價／總底價原本是獨立輸入的欄位，與明細（房屋＋露臺）可能不一致，
//       且部分建案的「房屋表價／房屋底價」根本沒有值（總額才有）。
// 作法：以現有總額為準反推明細 → 房屋價 = 總額 − 露臺價（露臺空視為 0）。
//       如此切換當下每一戶算出來的總額與現值完全相同，對外報價／合約／付款表零變動。
//
// 用法：
//   node scripts/backfillPriceSplit.mjs                 # 全部建案，只檢視不寫入（dry-run）
//   node scripts/backfillPriceSplit.mjs fuyu984         # 指定建案，dry-run
//   node scripts/backfillPriceSplit.mjs --apply         # 全部建案，實際寫入
//   node scripts/backfillPriceSplit.mjs fuyu984 --apply # 指定建案，實際寫入
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, query, where, writeBatch, doc } from 'firebase/firestore';
import fs from 'fs';
import path from 'path';

const args = process.argv.slice(2);
const APPLY = args.includes('--apply');
const PROJECT_ID = args.find(a => !a.startsWith('--')) || null;

const app = initializeApp({ apiKey: 'AIzaSyBdE26vC0UAprsdTgBcmYrVuO67ZbccMTA', projectId: 'apps-script-api-443402' });
const db = getFirestore(app, 'anxi-app');

// 與 src/utils/priceDerive.js／functions/utils/priceDerive.js 同一套欄位對應
const GROUPS = [
  { only: 'price_list_house_only', terrace: 'price_list_terrace', total: 'price_list_house_total', label: '表價' },
  { only: 'price_floor_house_only', terrace: 'price_floor_terrace', total: 'price_floor_house_total', label: '底價' },
];

const num = (v) => {
  if (v === null || v === undefined || v === '') return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
};
const round2 = (n) => Math.round(n * 100) / 100;

const snap = PROJECT_ID
  ? await getDocs(query(collection(db, 'salesHouseholds'), where('projectId', '==', PROJECT_ID)))
  : await getDocs(collection(db, 'salesHouseholds'));

const rows = snap.docs.map(d => ({ _id: d.id, ...d.data() }));
console.log(`讀取戶別 ${rows.length} 筆${PROJECT_ID ? `（建案 ${PROJECT_ID}）` : '（全部建案）'}`);
console.log(APPLY ? '⚠ 模式：實際寫入' : '模式：dry-run（不寫入，加 --apply 才會寫）');

const updates = [];   // { _id, patch }
const stats = new Map(); // projectId -> { 表價: n, 底價: n, 無總額: n }

for (const r of rows) {
  const pid = r.projectId || '(無)';
  if (!stats.has(pid)) stats.set(pid, { 表價: 0, 底價: 0, 無總額: 0, 樣本: [] });
  const st = stats.get(pid);
  const patch = {};

  for (const g of GROUPS) {
    const total = num(r[g.total]);
    if (total === null) { st.無總額++; continue; }
    const expected = round2(total - (num(r[g.terrace]) || 0));
    const current = num(r[g.only]);
    if (current !== null && Math.abs(current - expected) < 0.005) continue;
    patch[g.only] = expected;
    st[g.label]++;
    if (st.樣本.length < 3) {
      st.樣本.push(`${r.unitId} ${g.label}：${g.only} ${current === null ? '(空)' : current} → ${expected}（總額 ${total} − 露臺 ${num(r[g.terrace]) || 0}）`);
    }
  }

  if (Object.keys(patch).length > 0) updates.push({ _id: r._id, patch });
}

console.log('');
for (const [pid, st] of [...stats.entries()].sort()) {
  if (st.表價 === 0 && st.底價 === 0) { console.log(`${pid}：無需調整`); continue; }
  console.log(`${pid}：回填表價明細 ${st.表價} 戶、底價明細 ${st.底價} 戶`);
  st.樣本.forEach(s => console.log(`   ${s}`));
}
console.log(`\n合計需更新 ${updates.length} 戶`);

if (!APPLY) {
  console.log('（dry-run 結束，未寫入任何資料）');
  process.exit(0);
}

// 寫入前先備份即將被改動的戶別「全部價格欄位」原值，供必要時回滾
const backupDir = 'docs/local';
fs.mkdirSync(backupDir, { recursive: true });
const stamp = new Intl.DateTimeFormat('sv-SE', {
  timeZone: 'Asia/Taipei', dateStyle: 'short', timeStyle: 'medium',
}).format(new Date()).replace(/[: ]/g, '-');
const backupPath = path.join(backupDir, `backfillPriceSplit-backup-${stamp}.json`);
const byId = new Map(rows.map(r => [r._id, r]));
const PRICE_KEYS = [...GROUPS.flatMap(g => [g.only, g.terrace, g.total]), 'price_list_terrace_unit'];
fs.writeFileSync(backupPath, JSON.stringify(updates.map(u => {
  const r = byId.get(u._id);
  const before = { _id: u._id, projectId: r.projectId, unitId: r.unitId };
  for (const k of PRICE_KEYS) before[k] = r[k] ?? null;
  return { before, patch: u.patch };
}), null, 2), 'utf8');
console.log(`已備份原值：${backupPath}`);

let done = 0;
for (let i = 0; i < updates.length; i += 400) {
  const chunk = updates.slice(i, i + 400);
  const batch = writeBatch(db);
  for (const u of chunk) batch.update(doc(db, 'salesHouseholds', u._id), u.patch);
  await batch.commit();
  done += chunk.length;
  console.log(`已寫入 ${done}/${updates.length}`);
}
console.log('回填完成。');
process.exit(0);
