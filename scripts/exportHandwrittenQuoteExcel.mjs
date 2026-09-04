// 產出「手寫報價單備援 Excel」：系統故障／列印報價功能不可用時，改用本機 Excel 列印 A4 直式報價單手寫。
// 內含：報價單（選戶別自動帶入面積／表價）、戶別資料、車位資料、期款範本、使用說明。
// 用法：node scripts/exportHandwrittenQuoteExcel.mjs [projectId=fuyu1750] [輸出資料夾=docs/local]
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, query, where, doc, getDoc } from 'firebase/firestore';
import ExcelJS from 'exceljs';
import fs from 'fs';
import path from 'path';

const PROJECT_ID = process.argv[2] || 'fuyu1750';
const OUT_DIR = process.argv[3] || 'docs/local';

const app = initializeApp({ apiKey: 'AIzaSyBdE26vC0UAprsdTgBcmYrVuO67ZbccMTA', projectId: 'apps-script-api-443402' });
const db = getFirestore(app, 'anxi-app');

// ---------- 取資料 ----------
const projSnap = await getDoc(doc(db, 'projects', PROJECT_ID));
if (!projSnap.exists()) { console.error(`找不到建案 ${PROJECT_ID}`); process.exit(1); }
const project = { id: projSnap.id, ...projSnap.data() };
const PROJECT_NAME = project.name || PROJECT_ID;
const fetchCol = async (col) => (await getDocs(query(collection(db, col), where('projectId', '==', PROJECT_ID)))).docs.map(d => ({ _docId: d.id, ...d.data() }));
const [households, parkings, templates] = await Promise.all([fetchCol('salesHouseholds'), fetchCol('salesParkings'), fetchCol('paymentTermTemplates')]);
console.log(`${PROJECT_NAME}：戶別 ${households.length}、車位 ${parkings.length}、期款範本 ${templates.length}`);

const natural = (a, b) => String(a).localeCompare(String(b), 'zh-Hant', { numeric: true });
households.sort((a, b) => natural(a.unitId, b.unitId));
parkings.sort((a, b) => natural(a.floor, b.floor) || natural(a.spotId, b.spotId));
templates.sort((a, b) => natural(a.templateName, b.templateName));

const num = (v) => { const n = Number(v); return v === null || v === undefined || v === '' || isNaN(n) ? null : n; };
const r2 = (n) => (n === null ? null : Math.round(n * 100) / 100);
const nowTW = new Intl.DateTimeFormat('zh-TW', { timeZone: 'Asia/Taipei', dateStyle: 'medium', timeStyle: 'short' }).format(new Date());

// ---------- 樣式 ----------
const FONT = 'Microsoft JhengHei';
const NAVY = '1A3C6E', GREEN = '2E7D32', LIGHT = 'EEF2F7', YELLOW = 'FFF7CC', GREY = '757575';
const thin = { style: 'thin', color: { argb: 'FF9AA5B1' } };
const box = { top: thin, left: thin, bottom: thin, right: thin };
const f = (o = {}) => ({ name: FONT, size: 10, ...o });
const fill = (argb) => ({ type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF' + argb } });
const center = { vertical: 'middle', horizontal: 'center', wrapText: true };
const left = { vertical: 'middle', horizontal: 'left', wrapText: true, indent: 1 };
const right = { vertical: 'middle', horizontal: 'right', wrapText: true, indent: 1 };

const wb = new ExcelJS.Workbook();
wb.creator = 'ANXI 安熙智慧';
wb.calcProperties.fullCalcOnLoad = true;

// =====================================================================
// 報價單（A4 直式；選戶別自動帶入，其餘手寫）— 先建立，讓它成為第一個工作表
// =====================================================================
const ws = wb.addWorksheet('報價單', { views: [{ showGridLines: false }] });

// =====================================================================
// 戶別資料
// =====================================================================
const wsU = wb.addWorksheet('戶別資料', { views: [{ state: 'frozen', xSplit: 1, ySplit: 1 }] });
const U_COLS = [
  ['戶別', 10], ['棟別', 7], ['樓層', 6], ['物件類型', 9], ['格局', 12],
  ['房屋面積(坪)', 12], ['房屋面積(m²)', 12],
  ['主建物(坪)', 11], ['主建物(m²)', 11], ['附屬建物(坪)', 12], ['附屬建物(m²)', 12],
  ['共用部分(坪)', 12], ['共用部分(m²)', 12], ['露臺(坪)', 10], ['土地持分(坪)', 12], ['土地持分(m²)', 12],
  ['公設比', 8], ['房屋總表價(萬)', 14], ['房屋表價不含露臺(萬)', 18], ['露臺表價(萬)', 12], ['露臺單價(萬/坪)', 14],
  ['表價單價(萬/坪)', 14], ['配套價(萬)', 11],
];
wsU.columns = U_COLS.map(([header, width], i) => ({ header, width, key: 'c' + i }));
households.forEach((h) => {
  const area = num(h.area_house_ping);
  const total = num(h.price_list_house_total);
  const terrace = num(h.price_list_terrace) || 0;
  const terracePing = num(h.area_terrace_ping);
  const houseOnly = num(h.price_list_house_only) ?? (total === null ? null : total - terrace);
  const unitPrice = area && total !== null ? r2((total - terrace) / area) : null;
  const terraceUnit = num(h.price_list_terrace_unit) ?? (terrace && terracePing ? r2(terrace / terracePing) : null);
  wsU.addRow([
    h.unitId, h.building ?? '', num(h.floor) ?? h.floor ?? '', h.propertyType ?? '', h.layout ?? '',
    area, num(h.area_house_sqm),
    num(h.area_main_ping), num(h.area_main_sqm), num(h.area_ancillary_ping), num(h.area_ancillary_sqm),
    num(h.area_common_ping), num(h.area_common_sqm), terracePing, num(h.land_share_ping), num(h.land_share_sqm),
    num(h.common_area_ratio), total, houseOnly, terrace || null, terraceUnit,
    unitPrice, num(h.price_package_deal),
  ]);
});
const U_LAST = households.length + 1;
wsU.getRow(1).eachCell((c) => { c.font = f({ bold: true, color: { argb: 'FFFFFFFF' } }); c.fill = fill(NAVY); c.alignment = center; c.border = box; });
wsU.getRow(1).height = 30;
wsU.eachRow((row, i) => {
  if (i === 1) return;
  row.eachCell({ includeEmpty: true }, (c, col) => {
    c.font = f(); c.border = box; c.alignment = col <= 5 ? center : right;
    if (col >= 6 && col <= 16) c.numFmt = '0.00';
    if (col === 17) c.numFmt = '0.00%';
    if (col === 21 || col === 22) c.numFmt = '#,##0.00';
    if (col === 18 || col === 19 || col === 20 || col === 23) c.numFmt = '#,##0';
    if (i % 2 === 0) c.fill = fill('F7F9FC');
  });
});
wsU.autoFilter = { from: 'A1', to: `W${U_LAST}` };
wsU.pageSetup = { paperSize: 9, orientation: 'landscape', fitToPage: true, fitToWidth: 1, fitToHeight: 0, printTitlesRow: '1:1' };

// =====================================================================
// 車位資料（不含買方／銷售狀態，避免個資外流；銷售狀態請以銷控為準）
// =====================================================================
const wsP = wb.addWorksheet('車位資料', { views: [{ state: 'frozen', xSplit: 1, ySplit: 1 }] });
wsP.columns = [
  { header: '車位編號', width: 11 }, { header: '樓層', width: 7 }, { header: '類型', width: 8 }, { header: '型式', width: 10 },
  { header: '尺寸', width: 11 }, { header: '面積(m²)', width: 10 }, { header: '面積(坪)', width: 10 }, { header: '表價(萬)', width: 10 },
];
parkings.forEach((p) => {
  const sqm = num(p.area);
  wsP.addRow([p.spotId, p.floor ?? '', p.type ?? '', p.type2 ?? '', p.size ?? '', sqm, sqm === null ? null : r2(sqm * 0.3025), num(p.price_list)]);
});
const P_LAST = parkings.length + 1;
wsP.getRow(1).eachCell((c) => { c.font = f({ bold: true, color: { argb: 'FFFFFFFF' } }); c.fill = fill(NAVY); c.alignment = center; c.border = box; });
wsP.getRow(1).height = 26;
wsP.eachRow((row, i) => {
  if (i === 1) return;
  row.eachCell({ includeEmpty: true }, (c, col) => {
    c.font = f(); c.border = box; c.alignment = col <= 5 ? center : right;
    if (col === 6 || col === 7) c.numFmt = '0.00';
    if (col === 8) c.numFmt = '#,##0';
    if (i % 2 === 0) c.fill = fill('F7F9FC');
  });
});
wsP.autoFilter = { from: 'A1', to: `H${P_LAST}` };
wsP.pageSetup = { paperSize: 9, orientation: 'portrait', fitToPage: true, fitToWidth: 1, fitToHeight: 0, printTitlesRow: '1:1' };

// =====================================================================
// 期款範本（攤平；A 欄為查找鍵 = 範本名稱|序）
// =====================================================================
const wsT = wb.addWorksheet('期款範本', { views: [{ state: 'frozen', ySplit: 1 }] });
wsT.columns = [
  { header: '查找鍵', width: 34 }, { header: '範本名稱', width: 32 }, { header: '期款類別', width: 10 }, { header: '物件類型', width: 9 },
  { header: '買方', width: 8 }, { header: '總價下限(萬)', width: 12 }, { header: '總價上限(萬)', width: 12 }, { header: '序', width: 5 },
  { header: '期款項目', width: 24 }, { header: '層級', width: 7 }, { header: '比例/說明', width: 14 }, { header: '公式(系統)', width: 60 },
  { header: '進位方式', width: 10 }, { header: '範本備註', width: 30 },
  { header: '金額(自動計算)', width: 14 }, { header: '範本清單', width: 34 }, { header: '類別', width: 10 }, { header: '物件類型', width: 9 },
  { header: '買方', width: 8 }, { header: '下限', width: 8 }, { header: '上限', width: 8 }, { header: '符合總價期款(自動)', width: 16 }, { header: '符合配套期款(自動)', width: 16 },
];
const hintOf = (it) => {
  const cv = num(it.conditionalValue);
  if (cv) return `${cv}%`;
  const fm = String(it.formula ?? '').trim();
  if (fm === '') return '';
  if (/^\d+(\.\d+)?$/.test(fm)) return Number(fm) === 0 ? '0' : `固定 ${fm} 萬`;
  if (/^(總價|配套金額)-/.test(fm) && fm.length > 18) return '餘額補足';
  const div = fm.match(/^\((總價|配套金額)-[^)]+\)\/(\d+)$/);
  if (div) return `餘額÷${div[2]}`;
  return fm.length <= 18 ? fm : '';
};
// 範本清單順序：一般期款 → 優付期款 → 配套期款；同類依名稱自然排序，讓「基本款」排前面（自動判斷取第一個符合者）
const catOrder = (t) => (t.paymentCategory === '配套期款' ? 2 : t.paymentCategory === '優付期款' ? 1 : 0);
templates.sort((a, b) => catOrder(a) - catOrder(b) || natural(a.templateName, b.templateName));
const generalNames = templates.filter((t) => catOrder(t) < 2).map((t) => t.templateName);
const packageNames = templates.filter((t) => catOrder(t) === 2).map((t) => t.templateName);
let maxItems = 0;
const tplRows = []; // { row, t, it }：期款範本每一列，供回填「金額(自動計算)」公式
templates.forEach((t) => {
  const items = t.items || [];
  maxItems = Math.max(maxItems, items.length);
  items.forEach((it, idx) => {
    const isChild = !!it.parentId;
    tplRows.push({ row: wsT.rowCount + 1, t, it });
    wsT.addRow([
      `${t.templateName}|${idx + 1}`, t.templateName, t.paymentCategory ?? '', t.propertyType ?? '', t.buyerType ?? '',
      num(t.minPrice), num(t.maxPrice), idx + 1, (isChild ? '　└ ' : '') + it.name, isChild ? '子項' : '主項',
      hintOf(it), it.formula ?? '', it.roundingMethod ?? '', t.applyNote ?? '',
    ]);
  });
});
// 報價單輔助欄（不列印）：K4 買方類型、K5 判斷用總價；D4 物件類型（空白視為住家）
const Q_PROP = `IF('報價單'!$D$4="","住家",'報價單'!$D$4)`;
templates.forEach((t, i) => {
  const row = i + 2;
  wsT.getCell(row, 16).value = t.templateName;
  wsT.getCell(row, 17).value = t.paymentCategory ?? '';
  wsT.getCell(row, 18).value = t.propertyType || '住家';
  wsT.getCell(row, 19).value = t.buyerType ?? '';
  wsT.getCell(row, 20).value = num(t.minPrice) ?? 0;
  wsT.getCell(row, 21).value = num(t.maxPrice) || 999999;
  wsT.getCell(row, 22).value = { formula: `IF(AND($Q${row}="一般期款",$R${row}=${Q_PROP},$S${row}='報價單'!$K$4,$T${row}<='報價單'!$K$5,$U${row}>='報價單'!$K$5),1,0)`, result: 0 };
  wsT.getCell(row, 23).value = { formula: `IF(AND($Q${row}="配套期款",$R${row}=${Q_PROP},$S${row}='報價單'!$K$4),1,0)`, result: 0 };
});
const TPL_LAST = templates.length + 1;
const GEN_RANGE = `'期款範本'!$P$2:$P$${generalNames.length + 1}`;
const PKG_RANGE = `'期款範本'!$P$${generalNames.length + 2}:$P$${TPL_LAST}`;
const T_LAST = wsT.rowCount;
wsT.getRow(1).eachCell((c) => { c.font = f({ bold: true, color: { argb: 'FFFFFFFF' } }); c.fill = fill(NAVY); c.alignment = center; c.border = box; });
wsT.eachRow((row, i) => {
  if (i === 1) return;
  row.eachCell({ includeEmpty: true }, (c, col) => {
    c.font = f({ color: { argb: col === 1 ? 'FF9E9E9E' : 'FF000000' } }); c.border = box;
    if (col === 15) { c.numFmt = '#,##0'; c.fill = fill('FFFDE7'); }
    c.alignment = [1, 2, 9, 12, 14, 16].includes(col) ? left : center;
    if (row.getCell(10).value === '子項' && col === 9) c.font = f({ color: { argb: 'FF' + GREY } });
  });
});
wsT.autoFilter = { from: 'A1', to: `N${T_LAST}` };
wsT.pageSetup = { paperSize: 9, orientation: 'landscape', fitToPage: true, fitToWidth: 1, fitToHeight: 0, printTitlesRow: '1:1' };

// =====================================================================
// 報價單版面
// =====================================================================
ws.columns = [13.5, 11.5, 13.5, 11.5, 13.5, 11.5, 13.5, 11.5, 3, 26, 34].map((w) => ({ width: w }));

const PAY_ROWS = Math.max(maxItems, 12);
const UNIT_CELL = '$B$4';
const U_RANGE = `'戶別資料'!$A$2:$W$${U_LAST}`;
const uLookup = (colIdx) => ({ formula: `IFERROR(INDEX(${U_RANGE},MATCH(${UNIT_CELL},'戶別資料'!$A$2:$A$${U_LAST},0),${colIdx}),"")`, result: '' });
const P_RANGE = `'車位資料'!$A$2:$H$${P_LAST}`;
const pLookup = (cellRef, colIdx) => ({ formula: `IF(${cellRef}="","",IFERROR(INDEX(${P_RANGE},MATCH(${cellRef},'車位資料'!$A$2:$A$${P_LAST},0),${colIdx}),""))`, result: '' });

let r = 1;
const setRow = (h) => { ws.getRow(r).height = h; };
const cell = (addr, value, opt = {}) => {
  const c = ws.getCell(addr);
  c.value = value;
  c.font = f(opt.font || {});
  c.alignment = opt.align || center;
  if (opt.fill) c.fill = fill(opt.fill);
  if (opt.border !== false) c.border = opt.border || box;
  if (opt.numFmt) c.numFmt = opt.numFmt;
  return c;
};
const merge = (range) => ws.mergeCells(range);
const label = (addr, text, extra = {}) => cell(addr, text, { font: { bold: true, size: 9, color: { argb: 'FF' + NAVY } }, fill: LIGHT, ...extra });
const sectionTitle = (row, text, color = NAVY) => {
  merge(`A${row}:H${row}`);
  cell(`A${row}`, text, { font: { bold: true, size: 10, color: { argb: 'FFFFFFFF' } }, fill: color, align: left });
  ws.getRow(row).height = 18;
};
const spacer = (h = 6) => { setRow(h); r++; };

// --- 表頭 ---
merge('A1:E1'); merge('F1:H1');
cell('A1', PROJECT_NAME, { font: { bold: true, size: 20, color: { argb: 'FFFFFFFF' } }, fill: NAVY, align: left });
cell('F1', '房屋報價單', { font: { bold: true, size: 18, color: { argb: 'FFFFFFFF' } }, fill: NAVY, align: right });
setRow(34); r++;
// 報價日期：真正的日期格，預設 =TODAY()（開檔即今天），可直接輸入 2026/9/4 或 9/4 覆蓋；有效期限預設空白
merge('B2:D2'); merge('F2:H2');
label('A2', '報價日期');
label('E2', '有效期限至');
const DATE_FMT = 'yyyy"年"m"月"d"日"';
const dateValidation = (title) => ({
  type: 'date', operator: 'between', allowBlank: true, showInputMessage: true, showErrorMessage: true,
  formulae: ['DATE(2020,1,1)', 'DATE(2099,12,31)'],
  promptTitle: title, prompt: '直接輸入日期，例如 2026/9/4 或 9/4（同年）；清空則列印後手寫',
  errorTitle: title, error: '請輸入有效日期，例如 2026/9/4',
});
const quoteDate = cell('B2', { formula: 'TODAY()', result: new Date() }, { font: { size: 11, bold: true }, fill: YELLOW, numFmt: DATE_FMT });
quoteDate.dataValidation = dateValidation('報價日期');
const validDate = cell('F2', null, { font: { size: 11, bold: true }, fill: YELLOW, numFmt: DATE_FMT });
validDate.dataValidation = dateValidation('有效期限');
setRow(22); r++;
spacer();

// --- 基本資訊（4 列 × 4 組） ---
const infoRows = [
  [['戶別', null, 'unit'], ['物件類型', uLookup(4)], ['格局', uLookup(5)], ['樓層', uLookup(3)]],
  [['面積(坪)', uLookup(6), '0.00'], ['面積(m²)', uLookup(7), '0.00'], ['首購', '否', 'select'], ['棟別', uLookup(2)]],
  [['房屋表價(萬)', uLookup(18), '#,##0'], ['表價單價(萬/坪)', uLookup(22), '#,##0.00'], ['露臺價(萬)', uLookup(20), '#,##0'], ['露臺單價(萬/坪)', uLookup(21), '#,##0.00']],
  [['房屋總價(萬)', null, 'hand'], ['房屋單價(萬/坪)', { formula: 'IF(AND(ISNUMBER($B$7),ISNUMBER($B$5),$B$5>0),($B$7-IF(ISNUMBER($F$6),$F$6,0))/$B$5,"")', result: '' }, '#,##0.00'], ['配套價(萬)', { formula: `IF($H$7="是",${uLookup(23).formula},"")`, result: '' }, '#,##0'], ['配套', '否', 'select']],
];
const cols = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
infoRows.forEach((groups) => {
  setRow(24);
  groups.forEach(([lbl, val, mode], gi) => {
    const lc = cols[gi * 2], vc = cols[gi * 2 + 1];
    label(`${lc}${r}`, lbl);
    if (mode === 'unit') {
      const c = cell(`${vc}${r}`, null, { font: { bold: true, size: 14 }, fill: YELLOW });
      c.dataValidation = { type: 'list', allowBlank: true, showErrorMessage: true, errorTitle: '戶別', error: '請由下拉清單選擇戶別（清單來源：戶別資料 工作表）', formulae: [`'戶別資料'!$A$2:$A$${U_LAST}`] };
      const med = { style: 'medium', color: { argb: 'FF' + NAVY } };
      c.border = { top: med, left: med, bottom: med, right: med };
    } else if (mode === 'select') {
      const c = cell(`${vc}${r}`, val, { font: { size: 12, bold: true }, fill: YELLOW });
      c.dataValidation = { type: 'list', allowBlank: false, showErrorMessage: true, errorTitle: lbl, error: '請選擇 是 或 否', formulae: ['"是,否"'] };
    } else if (mode === 'hand') {
      cell(`${vc}${r}`, val, { font: { size: 11, bold: lbl.includes('總價') } });
    } else {
      cell(`${vc}${r}`, val, { font: { size: 11, bold: lbl.includes('表價') }, numFmt: mode });
    }
  });
  r++;
});
spacer();

// --- 詳細面積 ---
sectionTitle(r, '詳細面積（坪 ／ m²）'); r++;
const areaItems = [
  ['主建物(室內)', 8, 9], ['附屬建物', 10, 11], ['共用部分', 12, 13], ['露臺(不計坪)', 14, null], ['土地持分', 15, 16], ['公設比', 17, null],
];
setRow(18);
areaItems.forEach(([lbl], i) => label(`${cols[i]}${r}`, lbl));
merge(`G${r}:H${r}`); label(`G${r}`, '車位持分面積(所選車位合計)');
r++;
const rowPing = r, rowSqm = r + 1;
setRow(20); ws.getRow(rowSqm).height = 16;
areaItems.forEach(([, pIdx, sIdx], i) => {
  const isRatio = pIdx === 17;
  cell(`${cols[i]}${rowPing}`, uLookup(pIdx), { font: { size: 11, bold: true }, numFmt: isRatio ? '0.00%' : '0.00" 坪"' });
  cell(`${cols[i]}${rowSqm}`, sIdx ? uLookup(sIdx) : (isRatio ? '' : '—'), { font: { size: 9, color: { argb: 'FF' + GREY } }, numFmt: '0.00" m²"' });
});
merge(`G${rowPing}:H${rowPing}`); merge(`G${rowSqm}:H${rowSqm}`);
cell(`G${rowPing}`, null, { font: { size: 11, bold: true }, numFmt: '0.00" 坪"' });
cell(`G${rowSqm}`, null, { font: { size: 9, color: { argb: 'FF' + GREY } }, numFmt: '0.00" m²"' });
const parkingAreaPingCell = `G${rowPing}`, parkingAreaSqmCell = `G${rowSqm}`;
r += 2;
spacer();

// --- 車位 ---
sectionTitle(r, '車位（由下拉清單選車位編號自動帶入面積／表價；成交價手寫）'); r++;
setRow(18);
['車位編號', '樓層', '面積(坪)', '面積(m²)', '表價(萬)', '成交價(萬)'].forEach((t, i) => label(`${cols[i]}${r}`, t));
merge(`G${r}:H${r}`); label(`G${r}`, '備註');
r++;
const parkingFirst = r;
for (let i = 0; i < 3; i++) {
  setRow(22);
  const c = cell(`A${r}`, null, { font: { bold: true, size: 11 }, fill: YELLOW });
  c.dataValidation = { type: 'list', allowBlank: true, showErrorMessage: true, errorTitle: '車位', error: '請由下拉清單選擇車位編號（清單來源：車位資料 工作表）', formulae: [`'車位資料'!$A$2:$A$${P_LAST}`] };
  cell(`B${r}`, pLookup(`$A${r}`, 2), { font: { size: 10 } });
  cell(`C${r}`, pLookup(`$A${r}`, 7), { font: { size: 10 }, numFmt: '0.00' });
  cell(`D${r}`, pLookup(`$A${r}`, 6), { font: { size: 10 }, numFmt: '0.00' });
  cell(`E${r}`, pLookup(`$A${r}`, 8), { font: { size: 11, bold: true }, numFmt: '#,##0' });
  cell(`F${r}`, null, { font: { size: 11 } });
  merge(`G${r}:H${r}`); cell(`G${r}`, null, { font: { size: 10 } });
  r++;
}
const parkingLast = r - 1;
setRow(20);
merge(`A${r}:D${r}`); label(`A${r}`, '車位合計', { align: right });
cell(`E${r}`, { formula: `IF(COUNT(E${parkingFirst}:E${parkingLast})=0,"",SUM(E${parkingFirst}:E${parkingLast}))`, result: '' }, { font: { size: 11, bold: true }, fill: LIGHT, numFmt: '#,##0' });
cell(`F${r}`, { formula: `IF(COUNT(F${parkingFirst}:F${parkingLast})=0,"",SUM(F${parkingFirst}:F${parkingLast}))`, result: '' }, { font: { size: 11, bold: true }, fill: LIGHT, numFmt: '#,##0' });
merge(`G${r}:H${r}`); cell(`G${r}`, '單位：萬元', { font: { size: 8, color: { argb: 'FF' + GREY } }, fill: LIGHT });
const parkingListSumCell = `E${r}`, parkingDealSumCell = `F${r}`;
r++;
ws.getCell(parkingAreaPingCell).value = { formula: `IF(COUNT(C${parkingFirst}:C${parkingLast})=0,"",SUM(C${parkingFirst}:C${parkingLast}))`, result: '' };
ws.getCell(parkingAreaSqmCell).value = { formula: `IF(COUNT(D${parkingFirst}:D${parkingLast})=0,"",SUM(D${parkingFirst}:D${parkingLast}))`, result: '' };
spacer();

// --- 總價帶 ---
setRow(36);
merge(`A${r}:B${r}`); merge(`C${r}:G${r}`);
cell(`A${r}`, '總　　價', { font: { bold: true, size: 14, color: { argb: 'FFFFFFFF' } }, fill: NAVY });
const parkingForTotal = `IF(ISNUMBER(${parkingDealSumCell}),${parkingDealSumCell},IF(ISNUMBER(${parkingListSumCell}),${parkingListSumCell},0))`;
cell(`C${r}`, { formula: `IF($H$7="是",IF(ISNUMBER($F$7),$F$7,""),IF(ISNUMBER($B$7),$B$7+${parkingForTotal},""))`, result: '' }, { font: { bold: true, size: 20 }, numFmt: '#,##0', align: right });
cell(`H${r}`, '萬', { font: { bold: true, size: 14 } });
const totalCell = `C${r}`;
r++;
setRow(12);
merge(`A${r}:H${r}`);
cell(`A${r}`, '總價 ＝ 房屋總價 ＋ 車位價格（成交價未填時以車位表價計）。配套模式：總價 ＝ 配套價，配套金額 ＝ 房屋總價 ＋ 車位表價 － 配套價，另依配套期款支付。', { font: { size: 7.5, color: { argb: 'FF' + GREY } }, align: left, border: false });
r++;
spacer();

// --- 付款方式 ---
setRow(22);
label(`A${r}`, '總價期款', { fill: NAVY, font: { bold: true, size: 10, color: { argb: 'FFFFFFFF' } } });
merge(`B${r}:D${r}`);
// 範本自動判斷：依物件類型、首購、判斷用總價（K5）取第一個符合的一般期款範本；K6 有填則以手動指定為準
cell(`B${r}`, { formula: `IF($K$6<>"",$K$6,IFERROR(INDEX('期款範本'!$P$2:$P$${TPL_LAST},MATCH(1,'期款範本'!$V$2:$V$${TPL_LAST},0)),"（無符合範本，請於 K6 手動指定）"))`, result: '' }, { font: { size: 9, bold: true }, fill: LIGHT, align: left });
cell(`E${r}`, { formula: 'IF($H$7="是","配套期款","未採用配套")', result: '' }, { fill: GREEN, font: { bold: true, size: 10, color: { argb: 'FFFFFFFF' } } });
merge(`F${r}:H${r}`);
cell(`F${r}`, { formula: `IF($H$7<>"是","",IF($K$7<>"",$K$7,IFERROR(INDEX('期款範本'!$P$2:$P$${TPL_LAST},MATCH(1,'期款範本'!$W$2:$W$${TPL_LAST},0)),"（無符合範本，請於 K7 手動指定）")))`, result: '' }, { font: { size: 9, bold: true }, fill: LIGHT, align: left });
const genSelRef = `$B$${r}`, pkgSelRef = `$F$${r}`;
const pkgHeadRow = r;
const payFirstRow = r + 2;
r++;
setRow(18);
merge(`A${r}:B${r}`); label(`A${r}`, '期款項目'); label(`C${r}`, '比例／說明'); label(`D${r}`, '金額(萬)');
merge(`E${r}:F${r}`); label(`E${r}`, '期款項目'); label(`G${r}`, '比例／說明'); label(`H${r}`, '金額(萬)');
r++;
const T_KEY = `'期款範本'!$A$2:$A$${T_LAST}`;
const tLookup = (selRef, idx, colLetter) => ({ formula: `IF(${selRef}="","",IFERROR(INDEX('期款範本'!$${colLetter}$2:$${colLetter}$${T_LAST},MATCH(${selRef}&"|"&${idx},${T_KEY},0)),""))`, result: '' });
for (let i = 1; i <= PAY_ROWS; i++) {
  setRow(21);
  merge(`A${r}:B${r}`); cell(`A${r}`, tLookup(genSelRef, i, 'I'), { font: { size: 9.5 }, align: left });
  cell(`C${r}`, tLookup(genSelRef, i, 'K'), { font: { size: 8.5, color: { argb: 'FF' + GREY } } });
  const amt = (selRef, nameCell) => {
    const v = `INDEX('期款範本'!$O$2:$O$${T_LAST},MATCH(${selRef}&"|"&${i},${T_KEY},0))`;
    return { formula: `IF(${selRef}="","",IFERROR(IF(${v}="","",IF(LEFT(${nameCell},2)="　└","("&TEXT(${v},"#,##0")&")",${v})),""))`, result: '' };
  };
  cell(`D${r}`, amt(genSelRef, `$A${r}`), { font: { size: 11, bold: true }, numFmt: '#,##0' });
  merge(`E${r}:F${r}`); cell(`E${r}`, tLookup(pkgSelRef, i, 'I'), { font: { size: 9.5 }, align: left });
  cell(`G${r}`, tLookup(pkgSelRef, i, 'K'), { font: { size: 8.5, color: { argb: 'FF' + GREY } } });
  cell(`H${r}`, amt(pkgSelRef, `$E${r}`), { font: { size: 11, bold: true }, numFmt: '#,##0' });
  r++;
}
setRow(22);
merge(`A${r}:C${r}`); cell(`A${r}`, '總價', { font: { bold: true, size: 11, color: { argb: 'FF' + NAVY } }, fill: LIGHT, align: right });
cell(`D${r}`, { formula: `IF(ISNUMBER(${totalCell}),${totalCell},"")`, result: '' }, { font: { bold: true, size: 12, color: { argb: 'FF' + NAVY } }, fill: LIGHT, numFmt: '#,##0' });
merge(`E${r}:G${r}`); cell(`E${r}`, { formula: 'IF($H$7="是","配套金額","")', result: '' }, { font: { bold: true, size: 11, color: { argb: 'FF' + GREEN } }, fill: LIGHT, align: right });
cell(`H${r}`, { formula: `IF(AND($H$7="是",ISNUMBER($B$7),ISNUMBER($F$7)),$B$7+IF(ISNUMBER(${parkingListSumCell}),${parkingListSumCell},0)-$F$7,"")`, result: '' }, { font: { bold: true, size: 12, color: { argb: 'FF' + GREEN } }, fill: LIGHT, numFmt: '#,##0' });
const pkgAmountCell = `H${r}`;
// 子項金額（括號文字）灰字
ws.addConditionalFormatting({ ref: `D${payFirstRow}:D${r - 1}`, rules: [{ type: 'expression', formulae: [`LEFT($A${payFirstRow},2)="　└"`], style: { font: { color: { argb: 'FF' + GREY }, bold: false } } }] });
ws.addConditionalFormatting({ ref: `H${payFirstRow}:H${r - 1}`, rules: [{ type: 'expression', formulae: [`LEFT($E${payFirstRow},2)="　└"`], style: { font: { color: { argb: 'FF' + GREY }, bold: false } } }] });
// 配套＝否：右半邊整塊淡化（標題列改灰）
ws.addConditionalFormatting({ ref: `E${pkgHeadRow + 1}:H${r}`, rules: [{ type: 'expression', formulae: ['$H$7<>"是"'], style: { font: { color: { argb: 'FFBDBDBD' } }, fill: { type: 'pattern', pattern: 'solid', bgColor: { argb: 'FFFAFAFA' } } } }] });
ws.addConditionalFormatting({ ref: `E${pkgHeadRow}:H${pkgHeadRow}`, rules: [{ type: 'expression', formulae: ['$H$7<>"是"'], style: { font: { color: { argb: 'FFFFFFFF' } }, fill: { type: 'pattern', pattern: 'solid', bgColor: { argb: 'FFB0BEC5' } } } }] });
r++;
setRow(12);
merge(`A${r}:H${r}`);
cell(`A${r}`, '金額依系統期款範本公式自動計算（需先填房屋總價）；「└」括號內為主項之內含明細，已含於主項金額，請勿重複累加。', { font: { size: 7.5, color: { argb: 'FF' + GREY } }, align: left, border: false });
r++;
spacer();

// --- 備註 ---
sectionTitle(r, '備註'); r++;
for (let i = 0; i < 2; i++) {
  setRow(22);
  merge(`A${r}:H${r}`);
  cell(`A${r}`, null, { align: left, border: { bottom: thin } });
  r++;
}
spacer();

// --- 主管簽核／用印 ---
const apTop = r;
merge(`A${apTop}:B${apTop + 1}`); merge(`C${apTop}:E${apTop + 1}`); merge(`F${apTop}:H${apTop + 1}`);
label(`A${apTop}`, '主管簽核／用印', { font: { bold: true, size: 10, color: { argb: 'FF' + NAVY } } });
cell(`C${apTop}`, null, {});
cell(`F${apTop}`, '客戶簽名：', { font: { size: 9, color: { argb: 'FF' + GREY } }, align: { vertical: 'top', horizontal: 'left', indent: 1 } });
ws.getRow(apTop).height = 22; ws.getRow(apTop + 1).height = 22;
r += 2;
setRow(14);
merge(`A${r}:H${r}`);
cell(`A${r}`, '⚠ 本報價單須經主管簽核或用印始生效力，未經簽核用印者一律視為無效。', { font: { size: 8, bold: true, color: { argb: 'FFB71C1C' } }, align: left, border: false });
r++;
setRow(22);
merge(`A${r}:H${r}`);
cell(`A${r}`, '銷售顧問：＿＿＿＿＿＿＿＿＿　　聯絡電話：＿＿＿＿＿＿＿＿＿＿＿＿　　　　　　　（手寫報價單備援版）', { font: { size: 10 }, align: left, border: { top: { style: 'medium', color: { argb: 'FF' + NAVY } } } });
const lastRow = r;

// --- 期款範本 O 欄：把系統公式翻成 Excel 公式（對齊 utils/paymentCalculation.js 的引擎語意） ---
// 變數：總價 → 報價單總價、配套金額 → 報價單配套金額；其他項目名稱 → 同範本該列 O 欄；找不到的名稱視為 0；
// 進位：precision = roundingValue || 1；四捨五入 ROUND、無條件進位 ROUNDUP、無條件捨去 ROUNDDOWN（皆以 精度 為單位）
const BASE_REF = { '總價': `'報價單'!$${totalCell.replace(/(\D+)(\d+)/, '$1$$$2')}`, '配套金額': `'報價單'!$${pkgAmountCell.replace(/(\D+)(\d+)/, '$1$$$2')}` };
const toExcelFormula = (formula, nameToRow) => {
  const src = String(formula ?? '').trim();
  if (src === '') return '0';
  if (/^\d+(\.\d+)?$/.test(src)) return src;
  const ops = new Set(['+', '-', '*', '/', '(', ')']);
  const tokens = [];
  let cur = '';
  for (const ch of src) {
    if (ops.has(ch)) { if (cur.trim()) tokens.push(cur.trim()); cur = ''; tokens.push(ch); }
    else cur += ch;
  }
  if (cur.trim()) tokens.push(cur.trim());
  return tokens.map((tk) => {
    if (ops.has(tk)) return tk;
    if (/^\d+(\.\d+)?%?$/.test(tk)) return tk;
    if (BASE_REF[tk]) return `N(${BASE_REF[tk]})`;
    if (nameToRow[tk]) return `N($O$${nameToRow[tk]})`;
    return '0';
  }).join('');
};
const roundWrap = (expr, method, roundingValue) => {
  const p = Number(roundingValue) || 1;
  const fn = method === '無條件進位' ? 'ROUNDUP' : method === '無條件捨去' ? 'ROUNDDOWN' : 'ROUND';
  return p === 1 ? `${fn}(${expr},0)` : `${fn}((${expr})/${p},0)*${p}`;
};
templates.forEach((t) => {
  const rows = tplRows.filter((x) => x.t === t);
  const nameToRow = Object.fromEntries(rows.map((x) => [x.it.name, x.row]));
  const baseRef = BASE_REF[t.paymentCategory === '配套期款' ? '配套金額' : '總價'];
  rows.forEach(({ row, it }) => {
    const expr = roundWrap(toExcelFormula(it.formula, nameToRow), it.roundingMethod, it.roundingValue);
    wsT.getCell(row, 15).value = { formula: `IF(N(${baseRef})>0,${expr},"")`, result: '' };
  });
});

// --- 螢幕用輔助欄（J/K 欄，不在列印範圍） ---
const helper = (row, lbl, value, opt = {}) => {
  cell(`J${row}`, lbl, { font: { size: 9, bold: true, color: { argb: 'FF' + NAVY } }, fill: LIGHT, align: left });
  return cell(`K${row}`, value, { font: { size: 9 }, align: left, ...opt });
};
merge('J3:K3');
cell('J3', '▶ 輔助欄（僅螢幕顯示，不列印）', { font: { size: 9, bold: true, color: { argb: 'FFFFFFFF' } }, fill: GREY, align: left });
helper(4, '買方類型（依首購自動）', { formula: 'IF($F$5="是","首購","非首購")', result: '' });
helper(5, '判斷範本用總價（自動）', { formula: `IF(AND($H$7="是",ISNUMBER($F$7)),$F$7,IF(ISNUMBER($B$7),$B$7+${parkingForTotal},IF(ISNUMBER($B$6),$B$6+IF(ISNUMBER(${parkingListSumCell}),${parkingListSumCell},0),1)))`, result: '' }, { numFmt: '#,##0' });
const ovG = helper(6, '手動指定總價期款範本', null, { fill: YELLOW });
ovG.dataValidation = { type: 'list', allowBlank: true, showErrorMessage: true, errorTitle: '期款範本', error: '請由下拉清單選擇；清空即恢復自動判斷', formulae: [GEN_RANGE] };
const ovP = helper(7, '手動指定配套期款範本', null, { fill: YELLOW });
ovP.dataValidation = { type: 'list', allowBlank: true, showErrorMessage: true, errorTitle: '期款範本', error: '請由下拉清單選擇；清空即恢復自動判斷', formulae: [PKG_RANGE] };
merge('J8:K10');
cell('J8', '總價期款範本依「物件類型＋首購＋總價區間」自動選擇（總價未填時以表價估算）；配套期款依「配套＝是＋首購」自動選擇。要用優付或其他版本時，在 K6／K7 手動指定，清空即恢復自動。', { font: { size: 8, color: { argb: 'FF' + GREY } }, align: { vertical: 'top', horizontal: 'left', wrapText: true }, border: false });

ws.pageSetup = {
  paperSize: 9, orientation: 'portrait', fitToPage: true, fitToWidth: 1, fitToHeight: 1,
  horizontalCentered: true, printArea: `A1:H${lastRow}`,
  margins: { left: 0.3, right: 0.3, top: 0.3, bottom: 0.3, header: 0.15, footer: 0.15 },
};
ws.headerFooter = { oddFooter: `&L&8${PROJECT_NAME}　手寫報價單備援版　資料截止：${nowTW}&R&8第 &P 頁／共 &N 頁` };

// =====================================================================
// 使用說明
// =====================================================================
const wsH = wb.addWorksheet('使用說明');
wsH.columns = [{ width: 4 }, { width: 110 }];
const lines = [
  [`${PROJECT_NAME}　手寫報價單備援 Excel`, 'title'],
  [`資料來源：ANXI 安熙智慧系統（建案 ${PROJECT_ID}）　資料截止：${nowTW}（台灣時間）`, 'sub'],
  ['', ''],
  ['用途', 'h'],
  ['系統故障或「列印報價」功能無法使用時，改以本檔案列印 A4 直式報價單，面積／表價由 Excel 自動帶入，其餘（成交價、期款金額、日期、簽名）由銷售人員手寫。', ''],
  ['', ''],
  ['操作步驟', 'h'],
  ['1. 開啟「報價單」工作表，於黃底「戶別」格點選下拉清單選擇戶別 → 物件類型、格局、樓層、面積、詳細面積、表價、配套價自動帶入。', ''],
  ['2. 車位：於黃底「車位編號」格點選下拉清單（最多 3 個），樓層、面積、表價自動帶入；成交價可手寫或直接輸入。', ''],
  ['　 報價日期預設為開檔當天（=TODAY()），要改日期直接在黃底格輸入，例如 2026/9/4 或 9/4；有效期限同樣輸入日期，留空則列印後手寫。', ''],
  ['3. 首購：黃底格選「是／否」→ 總價期款範本依「物件類型＋首購／非首購＋總價區間」自動切換（銀行貸款成數隨範本改變）。', ''],
  ['4. 配套：黃底格選「是／否」→ 選「是」才顯示配套價、配套期款與配套金額，且總價改以配套價計；選「否」右半邊淡化不採用。', ''],
  ['5. 期款範本自動判斷用的總價：已填房屋總價時用房屋總價＋車位，未填時以表價估算。要改用優付或其他版本，於報價單右側輔助欄 K6／K7 手動指定，清空即恢復自動。', ''],
  ['6. 在電腦上輸入「房屋總價(萬)」後，房屋單價、總價、配套金額與各期期款金額都會依系統範本公式自動計算（含四捨五入／進位規則，與系統報價一致）；留白則列印後手寫。', ''],
  ['　 期款金額算法在「期款範本」工作表 O 欄，可核對；子項（└）在報價單上以括號呈現，已含於主項金額。', ''],
  ['7. 列印：Ctrl+P，已預設 A4 直式、單頁縮放、置中（右側 J／K 輔助欄不會印出）。建議先看「列印預覽」再印。', ''],
  ['', ''],
  ['注意事項', 'h'],
  ['• 本檔案「不含底價」與車位／戶別銷售狀態，請以銷控系統為準；未售／已售請先向銷控確認。', ''],
  ['• 表價（含露臺價、配套價）為資料截止當日之系統表價，價格調整後本檔即失效，請重新產出。', ''],
  ['• 期款「比例／說明」為系統範本設定，實際各期金額請依總價計算後手寫，特別是「餘額補足」項目須以總價減去其他各期。', ''],
  ['• 系統恢復後，請將手寫報價單內容補登回系統（報價單紀錄與主管簽核流程），避免報價紀錄斷檔。', ''],
  ['• 若資料工作表（戶別資料／車位資料／期款範本）被誤改，下拉與自動帶入會失效；請勿刪除或改名工作表。', ''],
  ['', ''],
  ['重新產出', 'h'],
  [`於專案根目錄執行：node scripts/exportHandwrittenQuoteExcel.mjs ${PROJECT_ID}　（可改為其他建案 id；輸出至 docs/local）`, ''],
];
lines.forEach(([text, kind], i) => {
  const row = wsH.getRow(i + 1);
  const c = row.getCell(2);
  c.value = text;
  c.alignment = { vertical: 'middle', wrapText: true };
  if (kind === 'title') { c.font = f({ bold: true, size: 16, color: { argb: 'FF' + NAVY } }); row.height = 30; }
  else if (kind === 'sub') { c.font = f({ size: 10, color: { argb: 'FF' + GREY } }); }
  else if (kind === 'h') { c.font = f({ bold: true, size: 12, color: { argb: 'FFFFFFFF' } }); c.fill = fill(NAVY); row.height = 22; }
  else { c.font = f({ size: 10.5 }); row.height = text.length > 60 ? 34 : 20; }
});

// ---------- 輸出 ----------
fs.mkdirSync(OUT_DIR, { recursive: true });
const stamp = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Taipei' }).format(new Date()).replace(/-/g, '');
const outPath = path.join(OUT_DIR, `${PROJECT_NAME}_手寫報價單備援_${stamp}.xlsx`);
await wb.xlsx.writeFile(outPath);
console.log('已輸出：', outPath);
process.exit(0);
