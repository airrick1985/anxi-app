// 建立 DEMO 建案（TESTA）的虛擬示範資料：預約批次＋時段規則＋預約紀錄＋聯絡名單＋賞屋預約
// 所有文件皆標記 isDemo: true、demoSeed: 'landing-2026-08'，可用 `node scripts/seedTrialDemoData.mjs --clean` 全部移除後重建。
// 用法：node scripts/seedTrialDemoData.mjs [--clean]
import { initializeApp } from 'firebase/app';
import {
  getFirestore, collection, getDocs, query, where, doc, writeBatch, Timestamp, updateDoc,
} from 'firebase/firestore';

const PROJECT_ID = 'TESTA';
const PROJECT_NAME = '測試建案A';
const SEED_TAG = 'landing-2026-08';
const CLEAN_ONLY = process.argv.includes('--clean');

const app = initializeApp({ apiKey: 'AIzaSyBdE26vC0UAprsdTgBcmYrVuO67ZbccMTA', projectId: 'apps-script-api-443402' });
const db = getFirestore(app, 'anxi-app');

// ---------- 工具 ----------
const pad = (n) => String(n).padStart(2, '0');
const ymd = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const ymdSlash = (d) => `${d.getFullYear()}/${pad(d.getMonth() + 1)}/${pad(d.getDate())}`;
const addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
// 台灣時區的某日 00:00 → 對應 UTC 前一日 16:00（與既有資料一致）
const twMidnight = (dateStr) => new Date(`${dateStr}T00:00:00+08:00`);
const twTime = (dateStr, hhmm) => new Date(`${dateStr}T${hhmm}:00+08:00`);
const pick = (arr, i) => arr[i % arr.length];
const code = () => Math.random().toString(36).slice(2, 8).toUpperCase();

const now = new Date();
const today = ymd(now);
// 以本週一為基準（截圖時間表顯示本週）
const monday = addDays(now, -((now.getDay() + 6) % 7));

const NAMES = ['林O宸', '陳O瑜', '張O豪', '王O婷', '李O翰', '黃O慧', '吳O恩', '劉O安', '蔡O晴', '許O廷', '楊O筑', '鄭O凱'];
const PHONES = ['0912000101', '0922000202', '0933000303', '0955000404', '0966000505', '0977000606', '0988000707', '0910000808', '0921000909', '0932001010', '0952001111', '0963001212'];
const UNITS = [
  ['A-01', '新竹市中正路1號1樓'], ['A-02', '新竹市中正路1號2樓'], ['A-03', '新竹市中正路1號3樓'], ['A-04', '新竹市中正路1號4樓'], ['A-05', '新竹市中正路1號5樓'],
  ['B-01', '新竹市中正路2號1樓'], ['B-02', '新竹市中正路2號2樓'], ['B-03', '新竹市中正路2號3樓'], ['B-04', '新竹市中正路2號4樓'], ['B-05', '新竹市中正路2號5樓'],
];
const SALES = [
  { name: '陳文賢', phone: '0980371014' },
  { name: '周小倫', phone: '0987654321' },
  { name: '蔡小林', phone: '0912345678' },
];
const SLOTS = ['09:00', '10:30', '13:30', '15:00'];
const METHODS = ['屋主自驗', '委託代驗', '授權驗屋', '設計師陪驗'];

// ---------- 清除舊示範資料 ----------
async function cleanSeed() {
  const cols = ['bookingBatches', 'dateRules', 'batchRuleLinks', 'appointments', 'leads', 'viewing_reservations'];
  for (const col of cols) {
    const snap = await getDocs(query(collection(db, col), where('projectId', '==', PROJECT_ID), where('demoSeed', '==', SEED_TAG)));
    let batch = writeBatch(db); let n = 0;
    for (const d of snap.docs) { batch.delete(d.ref); n++; if (n % 400 === 0) { await batch.commit(); batch = writeBatch(db); } }
    if (n % 400 !== 0) await batch.commit();
    console.log(`clean ${col}: ${n}`);
  }
}

// ---------- 建立 ----------
async function seed() {
  const stamp = { isDemo: true, demoSeed: SEED_TAG, projectId: PROJECT_ID };
  let batch = writeBatch(db); let ops = 0;
  const flush = async (force = false) => { if (force || ops >= 400) { await batch.commit(); batch = writeBatch(db); ops = 0; } };
  const set = (ref, data) => { batch.set(ref, data); ops++; };

  // 1. 預約批次（初驗 2 期：本週起開放；對保 A：同時開放）
  const batchDefs = [
    { bookingType: '初驗', batchCode: '初驗2', quotaMode: 'shared' },
    { bookingType: '對保', batchCode: '對保A', quotaMode: 'shared' },
  ];
  const batchIds = {};
  for (const b of batchDefs) {
    const ref = doc(collection(db, 'bookingBatches'));
    batchIds[b.bookingType] = ref.id;
    set(ref, {
      ...stamp,
      id: ref.id,
      projectName: PROJECT_NAME,
      bookingType: b.bookingType,
      batchCode: b.batchCode,
      quotaMode: b.quotaMode,
      bookingStart: ymd(monday),
      bookingEnd: ymd(addDays(monday, 41)),
      applicationStart: Timestamp.fromDate(twMidnight(ymd(addDays(monday, -30)))),
      applicationEnd: Timestamp.fromDate(twMidnight(ymd(addDays(monday, 120)))),
      statusText: '開放中',
      preDisplayOnFrontend: true,
      isDeleted: false,
      createdAt: Timestamp.now(),
      lastModified: Timestamp.now(),
    });
  }

  // 2. 時段規則（本週一起 6 週，週一～週六）＋ 批次連結
  const ruleIdsByDate = {};
  for (let i = 0; i < 42; i++) {
    const d = addDays(monday, i);
    if (d.getDay() === 0) continue; // 週日休
    const dateStr = ymd(d);
    const slots = {};
    SLOTS.forEach((t) => { slots[t] = { capacity: 3, methods: METHODS, methodLimits: {} }; });
    const ruleRef = doc(collection(db, 'dateRules'));
    ruleIdsByDate[dateStr] = ruleRef.id;
    set(ruleRef, { ...stamp, date: dateStr, slots, isShared: true, isDeleted: false, createdAt: Timestamp.now() });
    for (const type of Object.keys(batchIds)) {
      const linkRef = doc(collection(db, 'batchRuleLinks'));
      set(linkRef, { ...stamp, batchId: batchIds[type], ruleId: ruleRef.id, date: dateStr, isDeleted: false, createdAt: Timestamp.now() });
    }
    await flush();
  }

  // 3. 預約紀錄（本週＋下週，每天 1～3 筆，狀態預約中／已完成）
  let k = 0;
  for (let i = 0; i < 12; i++) {
    const d = addDays(monday, i);
    if (d.getDay() === 0) continue;
    const dateStr = ymd(d);
    const perDay = (i % 3) + 1;
    for (let j = 0; j < perDay; j++, k++) {
      const [unitId, address] = pick(UNITS, k);
      const slot = pick(SLOTS, k + j);
      const type = k % 4 === 3 ? '對保' : '初驗';
      const method = type === '對保' ? pick(['需貸款(選擇建配合銀行)', '自覓銀行', '不貸款'], k) : pick(METHODS, k);
      const isPast = d < now && dateStr !== today;
      const created = addDays(d, -7);
      const id = `${PROJECT_ID}_${String(created.getFullYear()).slice(2)}${pad(created.getMonth() + 1)}${pad(created.getDate())}-${pad(9 + (k % 8))}-${pad((k * 7) % 60)}-${pad((k * 13) % 60)}_${unitId}`;
      set(doc(db, 'appointments', id), {
        ...stamp,
        unitId, address,
        bookerName: pick(NAMES, k), bookerPhone: pick(PHONES, k), bookerEmail: 'demo@example.com', bookerIdNumber: 'DEMO',
        bookingType: type, batchCode: type === '對保' ? '對保A' : '初驗2', batchId: batchIds[type],
        bookingSubOption: '', inspectionMethod: method, inspectionCompanyName: method === '委託代驗' ? '安心驗屋工作室' : '',
        appointmentDate: Timestamp.fromDate(twMidnight(dateStr)), appointmentTimeSlot: slot,
        bookingCode: code(), status: isPast ? '已完成' : '預約中',
        agentName: '', agentPhone: '', agentIdNumber: '', agentAddress: '', agentRelationship: '未填寫',
        principalName: '', principalIdNumber: '', principalAddress: '', authorizationLetterUrl: '',
        bookingMethodDetails: {}, bookingMethodDetailsDisplay: [], reportUploaded: false,
        createdAt: Timestamp.fromDate(created),
      });
    }
    await flush();
  }

  // 4. 聯絡名單（12 筆，來源／狀態多樣）
  const SOURCES = ['591 房屋交易', 'FB 廣告', '官網留資', '現場來電', 'LINE 官方帳號', '樂居'];
  const STATUSES = ['未接', '已約賞屋', '還在討論', '不考慮', '', '已約賞屋'];
  const BUDGETS = ['2000-2500萬', '2500-3000萬', '3000萬以上', '1500-2000萬'];
  const REASONS = { '不考慮': '總價太高', '未接': '未接電話' };
  for (let i = 0; i < 12; i++) {
    const created = addDays(now, -(i * 2 + 1));
    const sales = pick(SALES, i);
    const status = pick(STATUSES, i);
    const ref = doc(collection(db, 'leads'));
    set(ref, {
      ...stamp,
      projectName: PROJECT_NAME,
      name: pick(NAMES, i + 3), phone: pick(PHONES, i + 5),
      source: pick(SOURCES, i), budget: pick(BUDGETS, i),
      date: ymdSlash(created),
      note: pick(['想看 3 房，週末可賞屋', '詢問車位價格與貸款成數', '希望平日晚上聯絡', '對高樓層有興趣', '已看過其他建案，比較中', ''], i),
      rawText: '示範資料',
      status, statusText: status ? '' : '✨ 全新名單',
      reason: REASONS[status] || '',
      assignedTo: sales.phone, assignedName: sales.name, assignedAt: Timestamp.fromDate(created),
      lastReportedAt: status ? Timestamp.fromDate(addDays(created, 1)) : null,
      importedBy: '示範資料', lastModifiedBy: '示範資料',
      isDeleted: false,
      createdAt: Timestamp.fromDate(created), lastModifiedAt: Timestamp.fromDate(created),
    });
  }
  await flush();

  // 5. 賞屋預約（本週＋下週 10 筆）
  const TYPES = ['新客', '回訪', '簽約', '新客', '回訪'];
  for (let i = 0; i < 10; i++) {
    const d = addDays(monday, i + (i >= 6 ? 2 : 0));
    const sales = pick(SALES, i);
    const type = pick(TYPES, i);
    const ref = doc(collection(db, 'viewing_reservations'));
    set(ref, {
      ...stamp,
      customerName: pick(NAMES, i + 6), customerPhone: pick(PHONES, i + 2),
      reservationTime: Timestamp.fromDate(twTime(ymd(d), pick(['10:00', '11:00', '14:00', '15:30', '16:30'], i))),
      type, unitId: type === '簽約' ? pick(UNITS, i)[0] : '',
      salesId: sales.phone, salesName: sales.name, salesPhone: sales.phone,
      note: pick(['帶家人一起看', '想看 A 棟高樓層', '', '確認貸款方案', ''], i),
      operatorId: 'TESTA', operatorName: 'TESTA',
      status: 'active',
      createdAt: Timestamp.now(), updatedAt: Timestamp.now(),
    });
  }
  await flush(true);

  // 6. 讓「初驗」「對保」在客戶預約頁可見
  await updateDoc(doc(db, 'projects', PROJECT_ID), {
    'pageSettingsByItem.初驗.visibleToCustomer': true,
    'pageSettingsByItem.對保.visibleToCustomer': true,
  });
  console.log('seed done. batches:', batchIds);
}

await cleanSeed();
if (!CLEAN_ONLY) await seed();
process.exit(0);
