// 聯絡名單「最新回報」欄位的一次性資料回填。
//
// 背景：名單表格新增「最新回報」欄，直接讀名單文件上的 lastReport（最新一筆回報快照），
//       之後每次回報／預約同步都會寫入；既有名單則由本腳本從 contactLogs 取最新一筆補上。
// 規則：取每筆名單 createdAt 最新的 contactLog；若最新一筆是「歷史資料移轉匯入」標記（非實際回報）則不寫。
//       名單已有較新（或相同時間）的 lastReport 時略過，不覆蓋。
//
// 用法：
//   node scripts/backfillLeadLastReport.mjs                 # 全部建案，只檢視不寫入（dry-run）
//   node scripts/backfillLeadLastReport.mjs fuyu665         # 指定建案，dry-run
//   node scripts/backfillLeadLastReport.mjs --apply         # 全部建案，實際寫入
//   node scripts/backfillLeadLastReport.mjs fuyu665 --apply # 指定建案，實際寫入
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, collectionGroup, getDocs, query, where, writeBatch, doc } from 'firebase/firestore';

const args = process.argv.slice(2);
const APPLY = args.includes('--apply');
const PROJECT_ID = args.find(a => !a.startsWith('--')) || null;

const app = initializeApp({ apiKey: 'AIzaSyBdE26vC0UAprsdTgBcmYrVuO67ZbccMTA', projectId: 'apps-script-api-443402' });
const db = getFirestore(app, 'anxi-app');

const IMPORT_MARKER = '歷史資料移轉匯入';
const toMillis = (ts) => (ts?.toMillis ? ts.toMillis() : 0);

const leadSnap = PROJECT_ID
  ? await getDocs(query(collection(db, 'leads'), where('projectId', '==', PROJECT_ID)))
  : await getDocs(collection(db, 'leads'));
const leads = new Map(leadSnap.docs.map(d => [d.id, d.data()]));

// 依名單分組，保留 createdAt 最新的一筆
const logSnap = await getDocs(collectionGroup(db, 'contactLogs'));
const latestByLead = new Map();
let orphan = 0;
for (const d of logSnap.docs) {
  const leadId = d.ref.parent.parent?.id;
  if (!leadId || !leads.has(leadId)) { orphan++; continue; }
  const log = d.data();
  const prev = latestByLead.get(leadId);
  if (!prev || toMillis(log.createdAt) > toMillis(prev.createdAt)) latestByLead.set(leadId, log);
}

const updates = [];
const stats = {};
let skippedImport = 0, skippedNewer = 0;

for (const [leadId, log] of latestByLead) {
  const lead = leads.get(leadId);
  const pid = lead.projectId || '(無建案)';
  stats[pid] ??= { leads: 0, write: 0 };
  stats[pid].leads++;
  if ((log.note || '').startsWith(IMPORT_MARKER)) { skippedImport++; continue; }
  if (lead.lastReport && toMillis(lead.lastReport.createdAt) >= toMillis(log.createdAt)) { skippedNewer++; continue; }
  updates.push({
    leadId,
    lead,
    lastReport: {
      status: log.status || '',
      reason: log.reason || '',
      note: log.note || '',
      createdBy: log.createdBy || '',
      createdAt: log.createdAt || null
    }
  });
  stats[pid].write++;
}

console.log(`範圍：${PROJECT_ID || '全部建案'}｜名單 ${leads.size} 筆｜回報日誌 ${logSnap.size} 筆（不屬於範圍內名單 ${orphan} 筆）`);
console.log(`有回報日誌的名單 ${latestByLead.size} 筆 → 要寫入 ${updates.length} 筆，略過：匯入標記 ${skippedImport}、已有較新 ${skippedNewer}`);
console.table(stats);
for (const u of updates.slice(0, 5)) {
  const r = u.lastReport;
  console.log(`- ${u.lead.projectId} ${u.lead.name} ${u.lead.phone}｜${r.status}｜${r.createdBy}｜${r.createdAt?.toDate?.().toISOString() || '-'}`);
  console.log(`  ${(r.note.trim() || r.reason || '-').replace(/\n/g, ' / ').slice(0, 80)}`);
}

if (!APPLY) {
  console.log('\n（dry-run，未寫入；加上 --apply 實際寫入）');
  process.exit(0);
}

const BATCH = 400;
for (let i = 0; i < updates.length; i += BATCH) {
  const batch = writeBatch(db);
  for (const u of updates.slice(i, i + BATCH)) {
    batch.update(doc(db, 'leads', u.leadId), { lastReport: u.lastReport });
  }
  await batch.commit();
  console.log(`已寫入 ${Math.min(i + BATCH, updates.length)} / ${updates.length}`);
}
console.log('完成');
process.exit(0);
