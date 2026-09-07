// 產出「房屋表價／房屋底價回填」Excel（每個建案一個檔案，可直接用系統的「上傳戶別資料」上傳）。
//
// 背景：房屋總表價／總底價改為由「房屋價＋露臺價」自動計算後，
//       部分戶別的房屋表價／房屋底價是空的、或與總額兜不攏，需要先補齊。
// 作法：以現有總額為準反推 → 房屋價 = 總額 − 露臺價。回填後每戶算出的總額與現在完全相同。
//
// 產出內容（三個工作表）：
//   1.「戶別資料」  系統上傳格式，確認金額後直接上傳即可完成回填
//   2.「回填對照表」目前值 → 回填後值的逐戶對照，含說明
//   3.「使用說明」  這份檔案是什麼、怎麼操作、注意事項
//
// 用法：
//   node scripts/exportPriceSplitBackfillExcel.mjs                # 全部建案（各產一檔）
//   node scripts/exportPriceSplitBackfillExcel.mjs fuyu984        # 只產指定建案
//   node scripts/exportPriceSplitBackfillExcel.mjs fuyu984 出貨用  # 指定輸出資料夾
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, query, where, doc, getDoc } from 'firebase/firestore';
import ExcelJS from 'exceljs';
import fs from 'fs';
import path from 'path';

const args = process.argv.slice(2).filter(a => !a.startsWith('--'));
const PROJECT_ID = args[0] || null;
const OUT_DIR = args[1] || 'docs/local';

const app = initializeApp({ apiKey: 'AIzaSyBdE26vC0UAprsdTgBcmYrVuO67ZbccMTA', projectId: 'apps-script-api-443402' });
const db = getFirestore(app, 'anxi-app');

// ---------- 欄位對應（與 src/constants/householdColumns.js 的標題一致，上傳才認得） ----------
const HEADER = {
  unitId: '戶別',
  listOnly: '房屋表價',
  listTerrace: '露臺表價',
  floorOnly: '房屋底價',
  floorTerrace: '露臺底價',
};
const GROUPS = [
  { key: 'list', label: '表價', only: 'price_list_house_only', terrace: 'price_list_terrace', total: 'price_list_house_total' },
  { key: 'floor', label: '底價', only: 'price_floor_house_only', terrace: 'price_floor_terrace', total: 'price_floor_house_total' },
];

const num = (v) => {
  if (v === null || v === undefined || v === '') return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
};
const round2 = (n) => (n === null ? null : Math.round(n * 100) / 100);
const natural = (a, b) => String(a ?? '').localeCompare(String(b ?? ''), 'zh-Hant', { numeric: true });
const nowTW = new Intl.DateTimeFormat('zh-TW', { timeZone: 'Asia/Taipei', dateStyle: 'long', timeStyle: 'short' }).format(new Date());
const stampTW = new Intl.DateTimeFormat('sv-SE', { timeZone: 'Asia/Taipei' }).format(new Date()).replace(/-/g, '');

// ---------- 樣式 ----------
const FONT = 'Microsoft JhengHei';
const NAVY = '1A3C6E', RED = 'C62828', GREEN = '2E7D32', GREY = '757575';
const LIGHT = 'EEF2F7', YELLOW = 'FFF7CC', PINK = 'FDECEA';
const thin = { style: 'thin', color: { argb: 'FFBFC8D4' } };
const box = { top: thin, left: thin, bottom: thin, right: thin };
const f = (o = {}) => ({ name: FONT, size: 10, ...o });
const fill = (argb) => ({ type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF' + argb } });
const MONEY = '#,##0.##';

// ---------- 取資料 ----------
const projSnap = await getDocs(collection(db, 'projects'));
const projectNames = new Map(projSnap.docs.map(d => [d.id, d.data()?.name || d.id]));

const snap = PROJECT_ID
  ? await getDocs(query(collection(db, 'salesHouseholds'), where('projectId', '==', PROJECT_ID)))
  : await getDocs(collection(db, 'salesHouseholds'));
const rows = snap.docs.map(d => ({ _id: d.id, ...d.data() }));
console.log(`讀取戶別 ${rows.length} 筆${PROJECT_ID ? `（建案 ${PROJECT_ID}）` : '（全部建案）'}`);

const byProject = new Map();
for (const r of rows) {
  const pid = r.projectId || '(無)';
  if (!byProject.has(pid)) byProject.set(pid, []);
  byProject.get(pid).push(r);
}

fs.mkdirSync(OUT_DIR, { recursive: true });
let produced = 0;

for (const [pid, list] of [...byProject.entries()].sort()) {
  const projectName = projectNames.get(pid) || pid;
  list.sort((a, b) => natural(a.building, b.building) || natural(a.floor, b.floor) || natural(a.unitId, b.unitId));

  // ---- 逐戶計算回填值 ----
  const targets = [];
  for (const r of list) {
    const item = { unitId: r.unitId, building: r.building, floor: r.floor, groups: {}, need: false };
    for (const g of GROUPS) {
      const total = num(r[g.total]);
      const terrace = num(r[g.terrace]);
      const current = num(r[g.only]);
      const expected = total === null ? null : round2(total - (terrace || 0));
      let note = '';
      let need = false;
      if (total === null) {
        note = `尚未設定${g.label}，不需處理`;
      } else if (current !== null && Math.abs(current - expected) < 0.005) {
        note = '目前已相符，不需調整';
      } else {
        need = true;
        note = current === null
          ? `原本空白，依總${g.label}補上`
          : `原本 ${current}，與總${g.label}兜不攏（差 ${round2(Math.abs(expected - current))} 萬），改為 ${expected}`;
      }
      item.groups[g.key] = { total, terrace, current, expected, note, need };
      if (need) item.need = true;
    }
    if (item.need) targets.push(item);
  }

  if (targets.length === 0) {
    console.log(`${projectName}（${pid}）：全部相符，不需回填，略過`);
    continue;
  }

  // ---- 建立活頁簿 ----
  const wb = new ExcelJS.Workbook();
  wb.creator = '安心宅銷控系統';
  wb.created = new Date();

  // ============ Sheet 1：戶別資料（上傳用） ============
  const ws = wb.addWorksheet('戶別資料', { views: [{ state: 'frozen', ySplit: 2 }] });
  const cols = [HEADER.unitId, HEADER.listOnly, HEADER.listTerrace, HEADER.floorOnly, HEADER.floorTerrace];
  ws.columns = [
    { width: 14 }, { width: 14 }, { width: 14 }, { width: 14 }, { width: 14 },
  ];

  ws.mergeCells(1, 1, 1, cols.length);
  const warn = ws.getCell(1, 1);
  warn.value = `⚠ ${projectName}｜房屋表價／房屋底價回填檔　：確認金額無誤後，直接上傳本檔即可（銷控系統 → 上傳戶別資料）。請勿修改標題列與「戶別」欄；本檔只會更新下列 4 個金額欄位，其他資料一律不受影響。`;
  warn.font = f({ bold: true, color: { argb: 'FF' + RED }, size: 11 });
  warn.fill = fill(YELLOW);
  warn.alignment = { vertical: 'middle', wrapText: true };
  ws.getRow(1).height = 34;

  const head = ws.getRow(2);
  cols.forEach((t, i) => {
    const c = head.getCell(i + 1);
    c.value = t;
    c.font = f({ bold: true, color: { argb: 'FFFFFFFF' } });
    c.fill = fill(NAVY);
    c.alignment = { horizontal: 'center', vertical: 'middle' };
    c.border = box;
  });
  head.height = 22;

  targets.forEach((t, idx) => {
    const r = ws.getRow(idx + 3);
    const vals = [
      t.unitId,
      t.groups.list.expected,
      t.groups.list.terrace,
      t.groups.floor.expected,
      t.groups.floor.terrace,
    ];
    vals.forEach((v, i) => {
      const c = r.getCell(i + 1);
      c.value = v === null ? null : v;
      c.font = f(i === 0 ? { bold: true } : {});
      c.numFmt = i === 0 ? undefined : MONEY;
      c.alignment = { horizontal: i === 0 ? 'center' : 'right' };
      c.border = box;
      // 本次被補上／修正的欄位淡底標示，讓使用者一眼看出改了什麼
      const g = i === 1 || i === 2 ? t.groups.list : t.groups.floor;
      if ((i === 1 || i === 3) && g.need) c.fill = fill(LIGHT);
    });
  });

  // ============ Sheet 2：回填對照表 ============
  const ws2 = wb.addWorksheet('回填對照表', { views: [{ state: 'frozen', xSplit: 3, ySplit: 2 }] });
  const cols2 = [
    { t: '棟別', w: 10 }, { t: '樓層', w: 8 }, { t: '戶別', w: 14 },
    { t: '目前房屋表價', w: 14 }, { t: '露臺表價', w: 12 }, { t: '目前總表價', w: 13 },
    { t: '回填後房屋表價', w: 15 }, { t: '回填後總表價', w: 14 }, { t: '表價說明', w: 46 },
    { t: '目前房屋底價', w: 14 }, { t: '露臺底價', w: 12 }, { t: '目前總底價', w: 13 },
    { t: '回填後房屋底價', w: 15 }, { t: '回填後總底價', w: 14 }, { t: '底價說明', w: 46 },
  ];
  ws2.columns = cols2.map(c => ({ width: c.w }));

  ws2.mergeCells(1, 1, 1, cols2.length);
  const t2 = ws2.getCell(1, 1);
  t2.value = `${projectName}　房屋表價／房屋底價回填對照（共 ${targets.length} 戶）　　※「回填後總表價／總底價」與目前完全相同，對外報價、合約、付款表都不會變`;
  t2.font = f({ bold: true, size: 11, color: { argb: 'FF' + NAVY } });
  t2.fill = fill(LIGHT);
  t2.alignment = { vertical: 'middle' };
  ws2.getRow(1).height = 28;

  const head2 = ws2.getRow(2);
  cols2.forEach((c0, i) => {
    const c = head2.getCell(i + 1);
    c.value = c0.t;
    c.font = f({ bold: true, color: { argb: 'FFFFFFFF' } });
    c.fill = fill(i >= 9 ? GREY : (i >= 3 ? NAVY : '455A64'));
    c.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
    c.border = box;
  });
  head2.height = 24;

  targets.forEach((t, idx) => {
    const r = ws2.getRow(idx + 3);
    const L = t.groups.list, F = t.groups.floor;
    const vals = [
      t.building, t.floor, t.unitId,
      L.current, L.terrace, L.total, L.expected, L.total, L.note,
      F.current, F.terrace, F.total, F.expected, F.total, F.note,
    ];
    vals.forEach((v, i) => {
      const c = r.getCell(i + 1);
      c.value = v === null || v === undefined ? null : v;
      c.border = box;
      const isMoney = [3, 4, 5, 6, 7, 9, 10, 11, 12, 13].includes(i);
      const isNote = i === 8 || i === 14;
      c.numFmt = isMoney ? MONEY : undefined;
      c.alignment = { horizontal: isMoney ? 'right' : (isNote ? 'left' : 'center'), vertical: 'middle', wrapText: isNote };
      c.font = f(
        i === 2 ? { bold: true }
          : (i === 6 || i === 12) ? { bold: true, color: { argb: 'FF' + GREEN } }
            : isNote ? { size: 9, color: { argb: 'FF' + GREY } }
              : {}
      );
      // 回填欄位淡綠底；空白原值淡紅底（最需要注意的）
      if ((i === 6 && L.need) || (i === 12 && F.need)) c.fill = fill('E8F5E9');
      if ((i === 3 && L.current === null) || (i === 9 && F.current === null)) c.fill = fill(PINK);
    });
  });

  // ============ Sheet 3：使用說明 ============
  const ws3 = wb.addWorksheet('使用說明');
  ws3.columns = [{ width: 4 }, { width: 108 }];
  const lines = [
    ['h', `${projectName}　房屋表價／房屋底價回填檔`],
    ['p', `產生時間：${nowTW}（台灣時間）　需回填戶別：${targets.length} 戶`],
    ['b', '一、這份檔案在做什麼？'],
    ['p', '銷控系統的「房屋總表價」與「房屋總底價」已改為系統自動計算：'],
    ['q', '房屋總表價 ＝ 房屋表價 ＋ 露臺表價　／　房屋總底價 ＝ 房屋底價 ＋ 露臺底價'],
    ['p', '過去這三個欄位是各自獨立輸入的，所以有些戶別的「房屋表價／房屋底價」是空白的，或是與總額兜不攏。'],
    ['p', '這份檔案就是把這些戶別的「房屋表價／房屋底價」補齊，計算方式是：房屋價 ＝ 目前的總額 − 露臺價。'],
    ['b', '二、會不會影響現在的價格？'],
    ['ok', '不會。回填後每一戶算出來的總表價／總底價，與現在完全一樣（可對照「回填對照表」的前後兩欄）。'],
    ['p', '對外報價單、合約、付款表、銷控表看到的金額都不會變動，只是把明細補上去而已。'],
    ['b', '三、操作步驟'],
    ['n', '1. 先看「回填對照表」工作表，確認每一戶的金額沒有問題（尤其是原本空白、以淡紅色標示的欄位）。'],
    ['n', '2. 如果某一戶的拆分方式想自己調整（例如露臺價要另外給），直接在「戶別資料」工作表改金額即可。'],
    ['n', '3. 進入「銷控系統」→ 選擇本建案 →「上傳戶別資料」。'],
    ['n', '4. 選擇本檔案上傳，畫面會顯示「將更新 N 個欄位」，確認後送出。'],
    ['n', '5. 上傳完成後，隨便點開一戶確認「房屋表價」有值、「房屋總表價」與之前相同即可。'],
    ['b', '四、注意事項'],
    ['w', '「戶別資料」工作表的標題列與「戶別」欄請勿修改，否則系統會認不得欄位。'],
    ['w', '本檔只包含 4 個金額欄位，上傳不會動到買方、銷控狀態、成交價等任何其他資料。'],
    ['w', '沒有露臺的戶別，露臺欄位留空即可（系統視為 0，房屋表價就等於總表價）。'],
    ['w', '本檔只列出需要回填的戶別；沒有列到的戶別代表資料本來就正確，不需處理。'],
  ];
  let rowNo = 1;
  for (const [kind, text] of lines) {
    const r = ws3.getRow(rowNo);
    const c = r.getCell(2);
    c.value = (kind === 'ok' ? '✓ ' : kind === 'w' ? '※ ' : '') + text;
    c.alignment = { vertical: 'middle', wrapText: true, indent: kind === 'n' || kind === 'w' || kind === 'q' ? 1 : 0 };
    if (kind === 'h') { c.font = f({ bold: true, size: 15, color: { argb: 'FF' + NAVY } }); r.height = 30; }
    else if (kind === 'b') { c.font = f({ bold: true, size: 12, color: { argb: 'FF' + NAVY } }); r.height = 26; }
    else if (kind === 'q') { c.font = f({ bold: true, size: 11, color: { argb: 'FF' + RED } }); c.fill = fill(YELLOW); r.height = 24; }
    else if (kind === 'ok') { c.font = f({ bold: true, size: 11, color: { argb: 'FF' + GREEN } }); r.height = 22; }
    else if (kind === 'w') { c.font = f({ color: { argb: 'FF' + RED } }); r.height = 20; }
    else { c.font = f(); r.height = 20; }
    rowNo++;
    if (kind === 'h') rowNo++; // 標題後空一列
  }

  const file = path.join(OUT_DIR, `表價回填-${projectName}-${stampTW}.xlsx`);
  await wb.xlsx.writeFile(file);
  produced++;
  const needList = targets.filter(t => t.groups.list.need).length;
  const needFloor = targets.filter(t => t.groups.floor.need).length;
  console.log(`✓ ${projectName}（${pid}）：${targets.length} 戶（表價 ${needList}、底價 ${needFloor}）→ ${file}`);
}

console.log(`\n完成，共產出 ${produced} 個檔案於 ${OUT_DIR}`);
process.exit(0);
