/**
 * 請佣獎金 匯出轉換服務
 *
 * 核心概念：model（commissionExportModel）→ grid（儲存格矩陣＋合併＋欄寬列高＋樣式）
 * → 三種輸出共用同一 grid，確保呈現一致：
 *   - gridToHtml()：匯出中心即時預覽
 *   - exportGridsToExcel()：xlsx-js-style 產出（前端下載）
 *   - grid 陣列直接作為 generateCommissionPdf 的 payload（後端 pdfkit 照畫）
 */

import * as XLSX from 'xlsx-js-style';
import { toNum, money, pctText } from '@/utils/commissionCalculation';
import { applyPrintSetup, NARROW_MARGINS } from './xlsxPrintSetup';

const HK_BG = '#fde2e2';   // 交屋保留款：含於保留款，僅供參考、不參與計算

// ================= Grid 基礎 =================
class Grid {
  constructor(name, nCols, nRows, baseStyle = {}) {
    this.name = name;
    this.nCols = nCols;
    this.nRows = nRows;
    this.cols = new Array(nCols).fill(66);       // wpx
    this.rowHeights = new Array(nRows).fill(24); // hpx
    this.cells = Array.from({ length: nRows }, () => new Array(nCols).fill(null));
    this.merges = [];
    this.base = baseStyle;   // { fontFamily, sz }
  }

  set(r, c, v, s = {}) {
    if (r < 0 || r >= this.nRows || c < 0 || c >= this.nCols) return;
    const isNum = typeof v === 'number' && Number.isFinite(v);
    this.cells[r][c] = { v, t: isNum ? 'n' : 's', s: { ...s } };
  }

  style(r, c, s) {
    const cell = this.cells[r][c] || { v: '', t: 's', s: {} };
    cell.s = { ...cell.s, ...s };
    this.cells[r][c] = cell;
  }

  merge(r1, c1, r2, c2) {
    this.merges.push({ r1, c1, r2, c2 });
  }

  /** 對區域套用樣式（含空白格，確保底色/框線完整） */
  region(r1, c1, r2, c2, s) {
    for (let r = r1; r <= r2; r++) {
      for (let c = c1; c <= c2; c++) this.style(r, c, s);
    }
  }

  toJSON() {
    return {
      name: this.name,
      nCols: this.nCols,
      nRows: this.nRows,
      cols: this.cols,
      rowHeights: this.rowHeights,
      cells: this.cells,
      merges: this.merges,
      base: this.base,
    };
  }
}

/** 依 fmt 將數值格式化為顯示字串（HTML/PDF 用；Excel 用原生 numFmt） */
export function fmtValue(v, fmt) {
  if (v === '' || v === null || v === undefined) return '';
  if (typeof v !== 'number') return String(v);
  if (!fmt || fmt === '#,##0') return money(v);
  if (fmt === '0.0' || fmt === '#,##0.0') return (Math.round(v * 10) / 10).toLocaleString('en-US', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
  if (fmt === '0.00') return v.toFixed(2);
  if (fmt === '"$"#,##0') return '$' + money(v);
  return money(v);
}

// ================= 請佣總表 grid =================
export function buildClaimGrid(model) {
  const cols = model.columns;
  const NC = Math.max(cols.length, 8);
  const n = model.rows.length;
  const rTitle = 0, rH1 = 1, rH2 = 2, rData0 = 3;
  const rDataEnd = rData0 + n - 1;
  const rSpacer = rDataEnd + 1;
  const rTotal = rSpacer + 1;
  const rNote0 = rTotal + 1;
  const nRows = rNote0 + 4;

  const st = model.style || {};
  const g = new Grid('請佣總表', NC, nRows, { fontFamily: st.fontFamily || 'DFKai-SB', sz: st.dataFontSize || 14 });
  cols.forEach((c, i) => { g.cols[i] = c.width || 66; });

  // 標題
  g.set(rTitle, 0, model.title, { sz: st.titleFontSize || 22, bold: true, align: 'center' });
  g.merge(rTitle, 0, rTitle, NC - 1);
  g.rowHeights[rTitle] = 40;

  // 表頭（雙層：group 橫向合併、無 group 直向合併）
  const headerStyle = { sz: st.headerFontSize || 14, bold: true, align: 'center', wrap: true, border: true, bg: normBg(st.headerBg) };
  let i = 0;
  while (i < cols.length) {
    const c = cols[i];
    if (c.group) {
      let j = i;
      while (j + 1 < cols.length && cols[j + 1].group === c.group) j++;
      g.set(rH1, i, c.group, headerStyle);
      if (j > i) g.merge(rH1, i, rH1, j);
      for (let k = i; k <= j; k++) g.set(rH2, k, cols[k].label, headerStyle);
      i = j + 1;
    } else {
      g.set(rH1, i, c.label, headerStyle);
      if (c.headerSub) g.set(rH2, i, c.headerSub, headerStyle);
      else g.merge(rH1, i, rH2, i);
      i++;
    }
  }
  g.region(rH1, 0, rH2, cols.length - 1, { border: true, bg: normBg(st.headerBg) });
  g.rowHeights[rH1] = 42; g.rowHeights[rH2] = 42;

  // 資料
  model.rows.forEach((row, ri) => {
    const r = rData0 + ri;
    g.rowHeights[r] = 48;
    cols.forEach((c, ci) => {
      const v = row.cells[c.key];
      g.set(r, ci, v === undefined ? '' : v, {
        align: c.align || 'right',
        fmt: c.numFmt,
        border: true,
        color: (c.red || row.refund) ? '#C00000' : undefined,
        sz: (c.key === 'signDate' || c.key === 'unit') ? Math.max(10, (st.dataFontSize || 14) - 2) : undefined,
      });
    });
  });
  if (n > 0) g.region(rData0, 0, rDataEnd, cols.length - 1, { border: true });
  g.rowHeights[rSpacer] = 22;

  // 合計列
  g.set(rTotal, 0, '合計', { bold: true, align: 'center', border: true, bg: normBg(st.totalRowBg) });
  cols.forEach((c, ci) => {
    if (model.totals[c.key] !== undefined) {
      g.set(rTotal, ci, model.totals[c.key], { bold: true, align: 'right', fmt: c.numFmt, border: true, bg: normBg(st.totalRowBg) });
    } else if (c.key === 'wanLabel') {
      g.set(rTotal, ci, '萬請款', { bold: true, align: 'center', border: true, bg: normBg(st.totalRowBg) });
    }
  });
  g.region(rTotal, 0, rTotal, cols.length - 1, { border: true, bold: true, bg: normBg(st.totalRowBg) });
  g.rowHeights[rTotal] = 40;

  // 備註 + 右側紅字摘要
  g.set(rNote0, 0, '備註：', { align: 'left' });
  const noteSpan = Math.min(9, Math.max(4, cols.length - 8));
  const noteSlots = Array.isArray(model.noteSlots) ? model.noteSlots : (model.notes || []).slice(0, 2);
  noteSlots.slice(0, 2).forEach((note, ni) => {
    g.set(rNote0 + ni, 1, note || '', { align: 'left' });
    g.merge(rNote0 + ni, 1, rNote0 + ni, noteSpan);
  });
  if (model.showSummaryBlock) {
    const valCol = Math.max(noteSpan + 1, cols.length - 6);
    const labCol = Math.min(valCol + 1, NC - 1);
    const sumStyle = { sz: 16, bold: true, color: st.summaryColor || '#DD0806', align: 'right', fmt: '"$"#,##0' };
    const labStyle = { sz: 16, bold: true, color: st.summaryColor || '#DD0806', align: 'left' };
    g.set(rNote0, valCol, model.summary.baseSum, sumStyle);       g.set(rNote0, labCol, '萬元', labStyle);
    g.set(rNote0 + 1, valCol, model.summary.thisClaimSum, sumStyle); g.set(rNote0 + 1, labCol, '元', labStyle);
    g.set(rNote0 + 2, valCol, model.summary.cash, sumStyle);      g.set(rNote0 + 2, labCol, '現金', labStyle);
    g.set(rNote0 + 3, valCol, model.summary.bill, sumStyle);      g.set(rNote0 + 3, labCol, '30天期票支付', labStyle);
  }
  for (let rr = rNote0; rr < rNote0 + 4; rr++) g.rowHeights[rr] = 36;

  // 可就地編輯的文字格（匯出中心即時預覽；對應請佣設定「文字自訂」）
  const editCells = [
    { r: rTitle, c: 0, key: 'claimTitlePattern', label: '請佣總表標題', hint: '可用 {建案名}{期別}{期別中文}{民國年月}' },
    { r: rNote0, c: 1, key: 'note1', label: '請佣總表條文 1', multiline: true },
    { r: rNote0 + 1, c: 1, key: 'note2', label: '請佣總表條文 2', multiline: true },
  ];

  // 戶別列（即時預覽拖曳上下排序；handle 為編號欄）
  const unitRows = model.rows.map((row, ri) => ({ r: rData0 + ri, unitId: row.unitId, recordId: row.recordId, handleCol: 0 }));

  return { ...g.toJSON(), editCells, unitRows };
}

// ================= 獎金表 grid =================
/** 全員保留款有效比例一致時顯示 %，否則留空 */
function uniformKeepPctText(people) {
  const rates = [...new Set(
    people
      .map(a => (a.subDisc ? Math.round((a.keepDisc / a.subDisc) * 10000) / 100 : 0))
      .filter(v => v > 0)
  )];
  return rates.length === 1 ? `　${pctText(rates[0])}%` : '';
}

function personHeaderName(p, model) {
  if (model.showSourceProjectTag && p.sourceProjectId && p.sourceProjectId !== model.projectId && p.sourceProjectName) {
    return `${p.name}\n(${p.sourceProjectName})`;
  }
  return p.name;
}

// Bound each rendered text row so arbitrarily many notes paginate instead of forming one oversized cell.
function noteParts(text, size = 48) {
  const chars = Array.from(String(text ?? ''));
  if (!chars.length) return [''];
  const parts = [];
  for (let i = 0; i < chars.length; i += size) parts.push(chars.slice(i, i + size).join(''));
  return parts;
}
function personNoteRows(model) {
  return (model.periodRemarks || []).flatMap(note => noteParts(note.text, 120).map(text => ({ period: note.period, text })));
}

/** 獎金表上方固定欄預設順序（預覽可拖曳表頭調整、建案層級記住）；price＝成交價（房價＋車價兩欄） */
export const BONUS_TOP_COLUMN_KEYS = ['no', 'sodate', 'sign', 'unit', 'park', 'name', 'price', 'total', 'referral', 'disc', 'after',
  'sales', 'team', 'ratio', 'base', 'indivRate', 'teamRate', 'hkRate', 'hkAmt'];

/** 依已儲存順序排列欄位 key；未儲存的（之後新增的欄位）接在預設順序的前一欄之後 */
export function resolveColumnOrder(saved = [], defaults = BONUS_TOP_COLUMN_KEYS) {
  const out = [];
  (saved || []).forEach(k => { if (defaults.includes(k) && !out.includes(k)) out.push(k); });
  defaults.forEach((k, i) => {
    if (out.includes(k)) return;
    const prev = defaults.slice(0, i).reverse().find(p => out.includes(p));
    out.splice(prev ? out.indexOf(prev) + 1 : 0, 0, k);
  });
  return out;
}

/** 把畫面上可見欄位的新順序套回完整順序（該頁未顯示的欄位留在原位） */
export function mergeColumnOrder(saved, visibleKeys) {
  const full = resolveColumnOrder(saved);
  const set = new Set(visibleKeys);
  const queue = (visibleKeys || []).filter(k => full.includes(k));
  return full.map(k => (set.has(k) ? queue.shift() : k));
}

export function buildBonusGroupGrid(group, model) {
  const st = model.style || {};
  const HK = !!group.hasHandover;   // 交屋保留款費率／金額兩欄：該組有提撥才顯示
  const M = !!model.mergedRows;
  const isPackage = !M && model.priceBasis === 'package';
  const baseFmt = v => (Number.isInteger(v) ? '#,##0' : '#,##0.0');   // 計獎總價：整數不顯示 .0
  const pct = v => (v ? `${pctText(v)}%` : '');
  // 上方固定欄：w＝欄寬（成交價佔房價／車價兩欄）、get＝每戶值、sum＝合計列取 topTotal 欄位
  const COLS = {
    no: { w: [46], head: '編號', get: d => d.no, align: 'center' },
    sodate: { w: [82], head: '小訂日期', get: d => d.sodate, align: 'center' },
    sign: { w: [82], head: '簽約日期', get: d => d.sign, align: 'center' },
    unit: { w: [84], head: M ? '戶別／方案' : '戶別', get: d => (M ? `${d.unit}\n${d.planName}` : d.unit), align: 'center', wrap: M },
    park: { w: [72], head: M ? '停車位／配套底價(萬)' : (isPackage ? '配套底價(萬)' : '停車位'), get: (d, pkg) => (pkg ? d.packageFloor : d.park), align: 'center' },
    name: { w: [96], head: '姓名', get: d => d.name, align: 'center' },
    price: { w: [66, 62], head: M ? '成交價／配套價格(萬)' : (isPackage ? '配套價格(萬)' : '成交價(萬)') },
    total: { w: [90], head: M ? '總價(萬)' : (isPackage ? '配套總價(萬)' : '總成交價(萬)'), get: d => d.total || '', fmt: '#,##0', sum: 'total' },
    referral: { w: [96], head: model.partyALabel, get: d => d.referral || '', fmt: '#,##0', sum: 'referral' },
    disc: { w: [56], head: '折數', get: d => d.disc || '', fmt: '0.00' },
    after: { w: [96], head: '折數後總價(萬)', get: d => d.after || '', fmt: '#,##0', sum: 'after' },
    sales: { w: [84], head: '銷售人員', get: d => d.sales, align: 'center' },
    team: { w: [72], head: '團獎人數', get: d => d.team || '', align: 'center' },
    ratio: { w: [66], head: '獎金比例', get: d => pct(d.ratioPct), align: 'center' },
    base: { w: [90], head: '計獎總價(萬)', get: d => d.base || '', fmt: baseFmt, sum: 'base' },
    indivRate: { w: [66], head: '個獎費率', get: d => pct(d.indivRate), align: 'center' },
    teamRate: { w: [66], head: '團獎費率', get: d => pct(d.teamRate), align: 'center' },
    hkRate: HK && { w: [110], head: '交屋保留款費率', get: d => d.hkRate || '', align: 'center' },
    hkAmt: HK && { w: [84], head: '交屋保留款金額', get: d => d.hkAmt || '', fmt: '#,##0', sum: 'hk' },
  };
  let FIX = 0;   // 固定欄總欄數＝第一位人員欄
  const topCols = resolveColumnOrder(model.columnOrder).filter(k => COLS[k]).map(key => {
    const col = { key, ...COLS[key], c: FIX };
    FIX += col.w.length;
    return col;
  });
  const colOf = key => topCols.find(col => col.key === key)?.c ?? 0;
  const cellStyle = (col, v) => ({
    ...(col.align ? { align: col.align } : {}),
    ...(col.wrap ? { wrap: true } : {}),
    ...(col.fmt ? { fmt: typeof col.fmt === 'function' ? col.fmt(v) : col.fmt } : {}),
  });
  const P = group.topPersons.length;
  const L = group.left.length;
  const R = group.right.length;
  const LSTART = 2;                 // 獎金合計第一位人員欄（col0-1 合併為「項目」欄）；管理職在前、業務在後
  const RSTART = LSTART + L;
  const NC = Math.max(FIX + 2 * P, RSTART + R, 12);

  const n = group.unitRows.length;
  const rTitle = 0, rH1 = 1, rH2 = 2, rData0 = 3;
  const rDataEnd = rData0 + Math.max(n, 1) - 1;
  const rTopTotal = rDataEnd + 1;
  const rSpacer = rTopTotal + 1;
  const rbTitle = rSpacer + 1;
  const rbH = rbTitle + 1;
  const rb0 = rbH + 1;

  // 獎金合計列（依序）：類別列＋累計＋(優付)＋保留款＋合計(扣保留款)＋稅金＋二代健保＋最終實領＋交屋保留款＋備註
  // 全員皆無金額（或備註）的列不呈現；累計／合計(扣保留款)／最終實領恆列。優付組扣款以實際金額
  const people = group.left.concat(group.right);
  const D = group.isYoufu;
  const keepOf = a => (D ? a.keepDisc : a.keep);
  const HK_STYLE = { color: '#000000', bg: HK_BG, border: true };
  const rowDefs = [
    ...group.catRows.map(cr => ({ label: `${cr.label} ${cr.rateText ?? `${pctText(cr.ratePct)}%`}`, labelSz: 10, get: cr.get })),
    { label: '累計', get: a => a.sub, style: { bold: true }, band: 'total', always: true },
    D && { key: 'youfu', label: group.youfuLabel, labelSz: 10, get: a => a.subDisc, style: { bold: true }, band: 'total' },
    { label: `保留款${uniformKeepPctText(people)}`, get: keepOf },
    { label: '合計(扣保留款)', get: a => (D ? a.subDisc : a.sub) - keepOf(a), style: { bold: true }, band: 'total', always: true },
    { label: '稅金', get: a => (D ? a.taxDisc : a.tax) },
    { label: '二代健保', get: a => (D ? a.nhiDisc : a.nhi) },
    { label: '最終實領', get: a => (D ? a.netDisc : a.net), style: { bold: true }, band: 'total', always: true },
    { label: '交屋保留款', get: a => a.handoverKeep, style: HK_STYLE, band: 'hk' },
  ].filter(d => d && (d.always || people.some(a => Math.round(toNum(d.get(a))) !== 0)));
  const notesFor = person => (person.remarkNotes || [person.remark || '']).flatMap(text => noteParts(text));
  const noteCount = people.some(a => notesFor(a).some(Boolean)) ? Math.max(...people.map(a => notesFor(a).length)) : 0;
  const rNote0 = rb0 + rowDefs.length;
  const nBottomRows = rowDefs.length + noteCount;
  const rbEnd = rb0 + nBottomRows - 1;

  const rGrand0 = rb0 + nBottomRows;
  const GRAND_N = 4;
  const nRows = rGrand0 + GRAND_N;

  const g = new Grid(group.sheetName, NC, nRows, { fontFamily: st.fontFamily || 'DFKai-SB', sz: st.dataFontSize || 12 });
  const FW = topCols.flatMap(col => col.w);
  for (let c = 0; c < NC; c++) g.cols[c] = c < FW.length ? FW[c] : 66;

  const headerBg = normBg(st.headerBg) || '#c4bd97';
  const totalBg = normBg(st.totalRowBg) || '#ffff00';

  // 標題
  g.set(rTitle, 0, group.title, { sz: st.titleFontSize || 20, bold: true, align: 'center' });
  g.merge(rTitle, 0, rTitle, NC - 1);
  g.rowHeights[rTitle] = 38;

  // 上方表頭
  const hStyle = { sz: st.headerFontSize || 12, bold: true, align: 'center', wrap: true, bg: headerBg, border: true };
  topCols.forEach(({ key, c, head }) => {
    g.set(rH1, c, head ?? '', hStyle);
    if (key !== 'price') g.merge(rH1, c, rH2, c);
    else if (isPackage) g.merge(rH1, c, rH2, c + 1);
    else {
      g.set(rH2, c, M ? '房價／配套價' : '房價', hStyle); g.set(rH2, c + 1, '車價', hStyle);
      g.merge(rH1, c, rH1, c + 1);
    }
  });
  group.topPersons.forEach((p, i) => {
    const col = FIX + 2 * i;
    g.set(rH1, col, personHeaderName(p, model), hStyle);
    g.merge(rH1, col, rH1, col + 1);
    g.set(rH2, col, '個獎', hStyle); g.set(rH2, col + 1, '團獎', hStyle);
  });
  g.region(rH1, 0, rH2, NC - 1, { bg: headerBg, border: true });
  g.rowHeights[rH1] = 26; g.rowHeights[rH2] = 26;

  // 上方資料
  group.unitRows.forEach((d, i) => {
    const r = rData0 + i;
    const rowIsPackage = M ? d.priceBasis === 'package' : isPackage;
    if (M) g.rowHeights[r] = 36;
    const rc = d.refund ? '#C00000' : undefined;   // 退佣列紅字
    topCols.forEach(col => {
      if (col.key === 'price') {
        g.set(r, col.c, d.house || '', { fmt: '#,##0', border: true, color: rc });
        if (rowIsPackage) g.merge(r, col.c, r, col.c + 1);
        else g.set(r, col.c + 1, d.parkP || '', { fmt: '#,##0', border: true, color: rc });
        return;
      }
      const v = col.get(d, rowIsPackage);
      g.set(r, col.c, v, { ...cellStyle(col, v), border: true, color: rc });
    });
    group.topPersons.forEach((p, j) => {
      const col = FIX + 2 * j;
      const v = d.pp[p.personKey] || { indiv: 0, team: 0 };
      g.set(r, col, v.indiv || '', { fmt: '#,##0', border: true, color: rc });
      g.set(r, col + 1, v.team || '', { fmt: '#,##0', border: true, color: rc });
    });
  });
  if (n > 0) g.region(rData0, 0, rDataEnd, NC - 1, { border: true });

  // 上方合計（黃底）
  g.set(rTopTotal, topCols.find(col => !col.sum)?.c ?? 0, '合計', { bold: true, align: 'center' });
  topCols.filter(col => col.sum).forEach(col => {
    const v = group.topTotal[col.sum];
    g.set(rTopTotal, col.c, v || '', { ...cellStyle(col, v), bold: true });
  });
  group.topPersons.forEach((p, j) => {
    const col = FIX + 2 * j;
    g.set(rTopTotal, col, group.topTotal.pp[p.personKey].indiv || '', { fmt: '#,##0', bold: true });
    g.set(rTopTotal, col + 1, group.topTotal.pp[p.personKey].team || '', { fmt: '#,##0', bold: true });
  });
  g.region(rTopTotal, 0, rTopTotal, NC - 1, { bold: true, bg: totalBg, border: true });
  g.rowHeights[rSpacer] = 18;

  // ===== 下方「獎金合計」 =====
  g.set(rbTitle, 0, '獎金合計', { sz: 16, bold: true, align: 'center' });
  g.merge(rbTitle, 0, rbTitle, NC - 1);
  g.rowHeights[rbTitle] = 34;

  // 表頭列：項目（col0-1 合併）＋人員（一人一欄，管理職在前、業務在後）
  g.set(rbH, 0, '項目', hStyle);
  g.merge(rbH, 0, rbH, 1);
  people.forEach((a, i) => g.set(rbH, LSTART + i, a.name, hStyle));
  g.region(rbH, 0, rbH, NC - 1, { bg: headerBg, border: true });

  // 項目欄＋人員金額
  rowDefs.forEach((d, k) => {
    const r = rb0 + k;
    g.set(r, 0, d.label, { align: 'center', border: true, ...d.style, ...(d.labelSz ? { sz: d.labelSz } : {}) });
    g.merge(r, 0, r, 1);
    people.forEach((a, i) => g.set(r, LSTART + i, Math.round(toNum(d.get(a))) || '', { fmt: '#,##0', border: true, ...d.style }));
    if (d.band === 'total') g.region(r, 0, r, NC - 1, { bg: totalBg, bold: true, border: true });
    if (d.band === 'hk') g.region(r, 0, r, NC - 1, HK_STYLE);
  });
  for (let i = 0; i < noteCount; i++) {
    g.set(rNote0 + i, 0, i ? '備註（續）' : '備註', { align: 'center', border: true });
    g.merge(rNote0 + i, 0, rNote0 + i, 1);
  }
  if (noteCount) people.forEach((a, i) => notesFor(a).forEach((text, j) => {
    const r = rNote0 + j, col = LSTART + i;
    g.set(r, col, text, { align: 'left', wrap: true, border: true });
    g.rowHeights[r] = Math.max(g.rowHeights[r], estimateRowHeight(text, g.cols[col], st.dataFontSize || 12, 24));
  }));
  if (nBottomRows) g.region(rb0, 0, rbEnd, NC - 1, { border: true });

  // 底部合計區（標題 col0-3、金額 col4-5）
  const GRAND = [
    { label: '最終實領合計', val: group.grand.net },
    { label: '稅金合計', val: group.grand.tax },
    { label: '二代健保合計', val: group.grand.nhi },
    { label: '獎金總計（最終實領＋稅金＋二代健保）', val: group.grand.total },
  ];
  GRAND.forEach((it, i) => {
    const r = rGrand0 + i;
    g.set(r, 0, it.label, { sz: 13, bold: true, align: 'center', border: true });
    g.merge(r, 0, r, 3);
    g.set(r, 4, it.val, { sz: 14, bold: true, color: st.summaryColor || '#DD0806', fmt: '#,##0', border: true });
    g.merge(r, 4, r, 5);
    g.region(r, 0, r, 5, { border: true });
    g.rowHeights[r] = 28;
  });
  g.region(rGrand0 + GRAND_N - 1, 0, rGrand0 + GRAND_N - 1, 5, { bg: totalBg });

  // 人員欄位資訊（即時預覽拖曳排序用；不影響 Excel／PDF）
  // section：top＝上段銷售人員（個獎／團獎兩欄）、left＝下段管理職、right＝下段業務人員
  const personCols = [];
  group.topPersons.forEach((p, i) => {
    personCols.push({ section: 'top', personKey: p.personKey, name: p.name, c1: FIX + 2 * i, c2: FIX + 2 * i + 1, r1: rH1, r2: rTopTotal });
  });
  group.left.forEach((a, i) => {
    personCols.push({ section: 'left', mgmtCat: a.mgmtCat || '', personKey: a.personKey, name: a.name, c1: LSTART + i, c2: LSTART + i, r1: rbH, r2: Math.max(rbH, rbEnd) });
  });
  group.right.forEach((a, i) => {
    personCols.push({ section: 'right', personKey: a.personKey, name: a.name, c1: RSTART + i, c2: RSTART + i, r1: rbH, r2: Math.max(rbH, rbEnd) });
  });

  // 可就地編輯的文字格（匯出中心即時預覽；對應請佣設定「文字自訂」）
  const editCells = [
    { r: rH1, c: colOf('referral'), key: 'partyALabel', label: '介紹費欄位 A' },
  ];
  const youfuIdx = rowDefs.findIndex(d => d.key === 'youfu');
  if (youfuIdx >= 0) editCells.push({ r: rb0 + youfuIdx, c: 0, key: 'youfuLabelPattern', label: '優付列文字', hint: '{pct}＝請佣比例' });

  // 戶別列（即時預覽拖曳上下排序；handle 為編號欄）
  const unitRows = group.unitRows.map((d, i) => ({ r: rData0 + i, unitId: d.unitId, recordId: d.recordId, handleCol: colOf('no') }));

  // 上方固定欄（即時預覽拖曳表頭排序；不影響 Excel／PDF）
  const fixedCols = topCols.map(col => ({ key: col.key, c1: col.c, c2: col.c + col.w.length - 1, r1: rH1, r2: rTopTotal }));

  return { ...g.toJSON(), personCols, editCells, unitRows, fixedCols };
}

export function buildBonusGrids(model) {
  return model.groups.map(gr => buildBonusGroupGrid(gr, model));
}

// ================= 每人／每戶當期獎金結果 grid（獎金表最後兩頁） =================
/**
 * 共用表格：標題｜表頭｜資料列｜合計列。
 * cols: { label, w, align, num, wrap, bold, bg, get(item), sumGet(totals), color(item), srcKey }
 * num 欄為數字（四捨五入、負數紅字）；非 num 欄有 sumGet 時合計列放文字。
 * srcKey：該欄金額來源戶別取 item.sources[srcKey]（合計列取 totals.sources），輸出為 cellTips 供預覽 hover。
 */
function periodTableGrid(model, cols, items, rowColor = () => undefined) {
  const st = model.style || {};
  const sz = st.dataFontSize || 12;
  const NC = cols.length;
  const n = items.length;
  const nRows = 2 + Math.max(n, 1) + (n ? 1 : 0);
  const g = new Grid(model.sheetName, NC, nRows, { fontFamily: st.fontFamily || 'DFKai-SB', sz });
  cols.forEach((c, i) => { g.cols[i] = c.w; });
  const border = st.borders !== false;
  const headerStyle = { sz: st.headerFontSize || 12, bold: true, align: 'center', wrap: true, bg: normBg(st.headerBg) || '#c4bd97', border };

  g.set(0, 0, model.title, { sz: st.titleFontSize || 20, bold: true, align: 'center' });
  g.merge(0, 0, 0, NC - 1);
  g.rowHeights[0] = 38;
  cols.forEach((c, i) => g.set(1, i, c.label, headerStyle));
  g.rowHeights[1] = model.categories.some(c => c.rateText) ? 44 : 30;

  const cellTips = [];   // { r, c, title, lines: [{ unit, amount }] }
  const addTip = (r, ci, name, sources) => {
    const c = cols[ci];
    const lines = c.srcKey ? sources?.[c.srcKey] : null;
    if (lines?.length) cellTips.push({ r, c: ci, title: `${name}｜${String(c.label).replace(/\n/g, ' ')}`, lines });
  };

  items.forEach((item, i) => {
    const r = 2 + i;
    let h = 26;
    cols.forEach((c, ci) => {
      const v = c.get(item);
      g.set(r, ci, c.num ? (Math.round(toNum(v)) || '') : (v ?? ''), {
        align: c.align || 'right', fmt: c.num ? '#,##0' : undefined, wrap: !!c.wrap, bold: !!c.bold, border, bg: c.bg,
        color: rowColor(item) || c.color?.(item) || (c.num && toNum(v) < 0 ? '#C00000' : undefined),
      });
      if (c.wrap) h = Math.max(h, estimateRowHeight(v, c.w, sz, 26, c.asciiWeight));
      addTip(r, ci, cols[0].get(item), item.sources);
    });
    g.rowHeights[r] = h;
  });
  if (!n) {
    g.set(2, 0, '本期尚無獎金資料', { align: 'center', border });
    g.merge(2, 0, 2, NC - 1);
    return g.toJSON();
  }
  const rt = 2 + n;
  const totalBg = normBg(st.totalRowBg) || '#ffff00';
  g.region(rt, 0, rt, NC - 1, { bold: true, bg: totalBg, border });
  g.set(rt, 0, '合計', { bold: true, align: 'center', bg: totalBg, border });
  cols.forEach((c, ci) => {
    if (!c.sumGet) return;
    const v = c.sumGet(model.totals);
    const isNum = c.num || typeof v === 'number';
    g.set(rt, ci, c.num ? Math.round(toNum(v)) : v, { bold: true, align: 'right', fmt: isNum ? '#,##0' : undefined, bg: totalBg, border });
    addTip(rt, ci, '合計', model.totals.sources);
  });
  g.rowHeights[rt] = 28;
  return { ...g.toJSON(), cellTips };
}

const categoryHeader = c => (c.rateText ? `${c.label}\n${c.rateText}` : c.label);
const moneyCols = () => [['小計', 'subtotal', 100], ['保留款', 'keep', 90], ['稅金', 'tax', 84], ['二代健保', 'nhi', 84], ['實發', 'net', 100]]
  .map(([label, key, w]) => ({ label, w, num: true, bold: key === 'subtotal' || key === 'net', get: x => x[key], sumGet: t => t[key], srcKey: key }));
// 交屋保留款：含於保留款，僅供參考（淡紅底，同獎金表）
const handoverCols = model => (model.hasHandover ? [
  { label: '交屋保留款比例', w: 120, align: 'center', wrap: true, bg: HK_BG, get: x => x.hkRate },
  { label: '交屋保留款金額', w: 100, num: true, bg: HK_BG, get: x => x.hk, sumGet: t => t.hk, srcKey: 'hk' },
] : []);

/** 每人當期獎金結果：人員｜各類別×比例｜扣款比例｜小計｜扣款｜實發｜(交屋保留款比例／金額)｜當期備註 */
export function buildPeriodResultGrid(model) {
  const pctCell = v => (v === null ? '依戶別' : `${pctText(v)}%`);
  const cols = [
    { label: '人員', w: 90, align: 'center', get: p => p.name },
    ...model.categories.map(c => ({ label: categoryHeader(c), w: 96, num: true, get: p => p.byCat[c.key], sumGet: t => t.byCat[c.key], srcKey: c.key })),
    { label: '保留款％', w: 70, align: 'center', get: p => pctCell(p.keepPct) },
    { label: '稅金％', w: 64, align: 'center', get: p => pctCell(p.taxPct) },
    { label: '二代健保％', w: 92, align: 'center', get: p => pctCell(p.nhiPct) },
    ...moneyCols(),
    ...handoverCols(model),
    { label: '當期備註', w: 300, align: 'left', wrap: true, get: p => p.notes.join('\n') },
  ];
  return periodTableGrid(model, cols, model.people);
}

/** 每戶當期獎金結果：戶別｜客戶｜銷售人員｜折後總價｜發放比例｜各類別×比例（金額＋領取人員）｜小計｜扣款｜實發｜(交屋保留款) */
export function buildPeriodUnitGrid(model) {
  const wan = v => (toNum(v) ? Number(toNum(v).toFixed(4)).toLocaleString('en-US', { maximumFractionDigits: 4 }) : '');
  const cols = [
    { label: '戶別', w: 100, align: 'center', wrap: true, get: u => (model.multiPlan ? `${u.unitId}（${u.planName}）` : u.unitId) },
    { label: '客戶姓名', w: 90, align: 'center', wrap: true, get: u => (u.refund ? `${u.buyerName}(退佣)` : u.buyerName) },
    { label: '銷售人員', w: 100, align: 'center', wrap: true, get: u => u.sales },
    { label: '折後總價(萬)', w: 90, get: u => wan(u.after), sumGet: t => wan(t.after) },
    { label: '獎金發放比例', w: 90, align: 'center', wrap: true, get: u => (u.ratioPct ? `${pctText(u.ratioPct)}%` : '') },
    ...model.categories.map(c => ({
      label: categoryHeader(c), w: 110, wrap: true, asciiWeight: 0.6,
      // 金額＋領取人員；2 人以上於姓名後標占該項目比例
      get: u => (u.byCat[c.key].amount ? [money(u.byCat[c.key].amount),
        ...u.byCat[c.key].people.map(p => (p.sharePct === null ? p.name : `${p.name} ${pctText(p.sharePct)}%`))].join('\n') : ''),
      color: u => (u.byCat[c.key].amount < 0 ? '#C00000' : undefined),
      sumGet: t => Math.round(t.byCat[c.key]),
    })),
    ...moneyCols(),
    ...handoverCols(model),
  ];
  return periodTableGrid(model, cols, model.units, u => (u.refund ? '#C00000' : undefined));
}

// ================= 個人獎金明細 grid =================
// A4 直式、清爽配色：細基準欄（每欄 PERSON_UNIT px）＋各區塊以合併格自行分欄；無框線，以斑馬底分列。
const PERSON_UNIT = 10;
const PERSON_PAGE_PX = 720;   // A4 直式可用寬（PDF 不縮放）
const PERSON_THEME = {
  accent: '#1f5f99', ink: '#1f2a37', muted: '#6b7785',
  headBg: '#e8f0f8', zebra: '#f5f8fb', totalBg: '#e8f0f8',
  net: '#127347', netBg: '#e6f4ec', neg: '#c0392b',
};

/** 依文字長度估算需要的列高（px），供 Excel／預覽避免截斷；asciiWeight＜1 時半形字元（數字、%）以較窄寬度計 */
function estimateRowHeight(text, widthPx, sz, minH, asciiWeight = 1) {
  const str = String(text || '');
  if (!str) return minH;
  const perLine = Math.max(1, Math.floor((widthPx - 8) / (sz * 1.05)));
  const len = seg => [...seg].reduce((n, ch) => n + (ch.charCodeAt(0) < 0x2E80 ? asciiWeight : 1), 0);
  let lines = 0;
  str.split('\n').forEach(seg => { lines += Math.max(1, Math.ceil(len(seg) / perLine)); });
  return Math.max(minH, lines * (sz + 6) + 8);
}

/** 全列扣款比例一致時回傳該比例；否則 null */
function uniformPct(rows, key) {
  if (!rows.length) return null;
  const v = rows[0][key];
  return rows.every(r => r[key] === v) ? v : null;
}

/** 依權重把 NC 個基準欄分成連續區段（每段至少 1 欄，最大餘數法） */
function weightSpans(weights, NC) {
  const total = weights.reduce((s, w) => s + w, 0) || 1;
  const exact = weights.map(w => w / total * NC);
  const units = exact.map(x => Math.max(1, Math.floor(x)));
  let used = units.reduce((s, v) => s + v, 0);
  const byRem = exact.map((x, i) => ({ i, rem: x - Math.floor(x) })).sort((a, b) => b.rem - a.rem);
  for (let k = 0; used < NC; k++, used++) units[byRem[k % units.length].i]++;
  while (used > NC) {
    const j = units.indexOf(Math.max(...units));
    units[j]--; used--;
  }
  let c = 0;
  return units.map(u => { const span = [c, c + u - 1]; c += u; return span; });
}

/** 名單以「、」接續，超過 maxLines 行即分到下一列（避免單列過高，PDF 可換頁） */
function chunkJoin(items, widthPx, sz, maxLines = 6) {
  const perLine = Math.max(1, Math.floor((widthPx - 8) / (sz * 1.05)));
  const limit = perLine * maxLines;
  const out = [];
  let cur = '';
  items.forEach(it => {
    const next = cur ? `${cur}、${it}` : it;
    if (cur && next.length > limit) { out.push(cur); cur = it; } else cur = next;
  });
  if (cur) out.push(cur);
  return out.length ? out : [''];
}

const allocShareText = (pct, locked) => `${pctText(pct)}%${locked ? '(鎖定)' : ''}`;
const pctLabel = (rows, key) => { const u = uniformPct(rows, key); return u === null ? '' : ` ${pctText(u)}%`; };

/** 每戶明細欄位（寬度為期望 px，實際依基準欄分配）；多行標籤用空白而非換行字元，PDF（pdfkit）遇換行字元時首行會多佔寬而提早折行 */
function personDetailColumns(model) {
  const cols = [];
  cols.push({ key: 'unit', label: '戶別', w: 56, bold: true, get: r => (r.refund ? `${r.unit} (退佣)` : r.unit) });
  if (model.unitMode) {
    cols.push({ key: 'period', label: '期別', w: 36, get: r => r.period });
    cols.push({ key: 'month', label: '月份', w: 52, nowrap: true, get: r => r.month });
  }
  if (model.showBuyerName) cols.push({ key: 'buyerName', label: '買方', w: 58, get: r => r.buyerName });
  cols.push({ key: 'contractDate', label: '簽約日', w: 68, nowrap: true, get: r => r.contractDate });
  if (model.showDealTotal) cols.push({ key: 'dealTotal', label: '總價 (萬)', w: 54, num: true, get: r => r.dealTotal });
  cols.push({ key: 'ratioPct', label: '請佣 比例', w: 52, nowrap: true, get: r => `${pctText(r.ratioPct)}%` });
  model.categories.forEach(c => cols.push({
    key: `cat_${c.key}`, catKey: c.key, label: `${c.label} ${pctText(c.ratePct)}%`, w: 72, num: true, sum: true,
    get: r => r.amounts[c.key], sumGet: t => t.amounts[c.key],
  }));
  cols.push({ key: 'subtotal', label: '小計', w: 76, num: true, sum: true, bold: true, get: r => r.subtotal });
  cols.push({ key: 'deduct', label: '扣款', w: 66, num: true, sum: true, get: r => r.keep + r.tax + r.nhi, sumGet: t => t.keep + t.tax + t.nhi });
  cols.push({ key: 'net', label: '實發', w: 74, num: true, sum: true, bold: true, net: true, get: r => r.net });
  return cols;
}

/** 名單分配區塊版面：類別｜戶別｜戶數｜本人比例｜分配人員；名單過長分列（續） */
function personAllocationLayout(model, spans) {
  const sz = model.style?.dataFontSize || 12;
  const spanW = ([a, b]) => (b - a + 1) * PERSON_UNIT;
  const rows = [];
  (model.allocations || []).forEach((a, gi) => {
    const units = chunkJoin(a.units, spanW(spans[1]), sz);
    const persons = chunkJoin(a.persons.map(p => `${p.name}${p.self ? '(本人)' : ''} ${allocShareText(p.pct, p.locked)}`), spanW(spans[4]), sz);
    const n = Math.max(units.length, persons.length);
    for (let i = 0; i < n; i++) {
      const cells = [i ? `${a.label}（續）` : a.label, units[i] || '', i ? '' : a.count, i ? '' : allocShareText(a.own.pct, a.own.locked), persons[i] || ''];
      const h = Math.max(28, estimateRowHeight(cells[1], spanW(spans[1]), sz, 28), estimateRowHeight(cells[4], spanW(spans[4]), sz, 28));
      rows.push({ cells, h, group: gi, cont: i > 0 });
    }
  });
  return rows;
}

/** 個人明細：單張 grid（預覽、PDF、Excel 共用，A4 直式） */
export function buildPersonGrid(model) {
  const st = model.style || {};
  const T = { ...PERSON_THEME, accent: st.accentColor || PERSON_THEME.accent, headBg: normBg(st.headerBg) || PERSON_THEME.headBg,
    totalBg: normBg(st.totalRowBg) || PERSON_THEME.totalBg, net: st.summaryColor || PERSON_THEME.net };
  const sz = st.dataFontSize || 12;
  const hsz = st.headerFontSize || 12;
  const small = Math.max(9, sz - 2);
  const cols = personDetailColumns(model);
  const NC = Math.max(Math.round(PERSON_PAGE_PX / PERSON_UNIT), Math.ceil(cols.reduce((s, c) => s + c.w, 0) / PERSON_UNIT));
  const notes = personNoteRows(model);
  const allocSpans = weightSpans([100, 150, 44, 70, 356], NC);
  const allocRows = model.allocations?.length ? personAllocationLayout(model, allocSpans) : [];
  const maxRows = 40 + model.rows.length * 2 + allocRows.length + model.periodSummaries.length * 2 + notes.length;
  const g = new Grid(model.person.name || '個人明細', NC, maxRows, { fontFamily: st.fontFamily || 'Microsoft JhengHei', sz });
  g.cols = new Array(NC).fill(PERSON_UNIT);
  const full = [[0, NC - 1]];
  let r = 0;

  /** 一列：各區段放值並合併，styles 可為單一樣式或逐段樣式 */
  const put = (spans, values, styles, h) => {
    spans.forEach(([c1, c2], i) => {
      const s = Array.isArray(styles) ? (styles[i] || {}) : styles;
      g.region(r, c1, r, c2, s);
      if (values[i] !== undefined && values[i] !== null) g.set(r, c1, values[i], s);
      if (c2 > c1) g.merge(r, c1, r, c2);
    });
    g.rowHeights[r] = h || 26;
    r += 1;
  };
  const gap = (h = 12) => { g.rowHeights[r] = h; r += 1; };
  const heading = text => put(full, [text], { sz: 14, bold: true, color: T.accent, align: 'left' }, 30);
  const sec = ['一', '二', '三', '四', '五'];
  let secIdx = 0;
  const nextSec = () => sec[secIdx++];

  // ---- 標題 ----
  const singleDate = model.periodSummaries.length === 1 ? model.periodSummaries[0].requestDate : '';
  const p = model.person;
  put(full, [model.title], { sz: st.titleFontSize || 20, bold: true, color: T.accent, align: 'left' }, 40);
  put(full, [`${model.subtitle}${singleDate ? `　請佣日期 ${singleDate}` : ''}`], { sz: 13, color: T.muted, align: 'left' }, 24);
  put(full, [`姓名　${p.name}${p.sourceProjectName ? `（${p.sourceProjectName}）` : ''}　　職務　${p.role || '—'}　　建案　${model.projectName}`], { sz: 13, bold: true, color: T.ink, align: 'left' }, 28);
  put(full, [`產出日期 ${model.generatedAt}　｜　本明細僅含本人獎金　｜　金額單位：元`], { sz: small, color: T.muted, align: 'left' }, 20);
  gap(14);

  // ---- 重點：獎金小計 − 扣款 ＝ 實發 ----
  heading(model.unitMode ? `所選戶別合計（${model.unitCount} 戶）` : model.periods.length > 1 ? `所選期別合計（第 ${model.periodsLabel} 期）` : '本期獎金');
  const t = model.totals;
  const boxSpans = weightSpans([1, 1, 1, 1, 1.3], NC);
  const boxLabels = ['獎金小計', `－ 保留款${pctLabel(model.rows, 'keepPct')}`, `－ 稅金${pctLabel(model.rows, 'taxPct')}`, `－ 二代健保${pctLabel(model.rows, 'nhiPct')}`, '＝ 實發金額'];
  const boxLab = { sz: small + 1, color: T.muted, bg: T.zebra, align: 'center' };
  put(boxSpans, boxLabels, [boxLab, boxLab, boxLab, boxLab, { ...boxLab, color: T.net, bold: true, bg: T.netBg }], 26);
  const boxVal = { sz: 17, bold: true, color: T.ink, bg: T.zebra, align: 'center', fmt: '#,##0' };
  put(boxSpans, [t.subtotal, t.keep, t.tax, t.nhi, t.net], [boxVal, boxVal, boxVal, boxVal, { ...boxVal, sz: 22, color: T.net, bg: T.netBg }], 42);
  if (Math.round(toNum(t.hk))) put(full, [`※ 保留款中含交屋保留款 ${money(t.hk)} 元`], { sz: small, color: T.muted, align: 'left' }, 22);
  gap(16);

  // ---- 每戶獎金明細 ----
  if (model.showDetail) {
    heading(`${nextSec()}、每戶獎金明細${model.detailScope === 'all' ? '' : '（僅列本人銷售之戶別）'}`);
    const spans = weightSpans(cols.map(c => c.w), NC);
    const firstCat = cols.findIndex(c => c.catKey);
    const infoEnd = (firstCat < 0 ? cols.findIndex(c => c.key === 'subtotal') : firstCat) - 1;
    const tailStart = cols.findIndex(c => c.key === 'subtotal');
    const headStyle = { sz: hsz, bold: true, color: T.ink, bg: T.headBg, align: 'center', wrap: true };
    put(spans, cols.map(c => c.label), headStyle, model.categories.length ? 40 : 30);
    const cellStyle = (c, bg, refund = false) => ({
      sz, bg, align: c.num ? 'right' : 'center', fmt: c.num ? '#,##0' : undefined, wrap: !c.num && !c.nowrap, nowrap: !!c.nowrap,
      bold: !!c.bold, color: refund ? T.neg : (c.net ? T.net : T.ink),
    });
    const nonUniform = ['keep', 'tax', 'nhi'].filter(k => uniformPct(model.rows, `${k}Pct`) === null);
    const dateOf = per => model.periodSummaries.find(x => x.period === per)?.requestDate || '';
    let lastPeriod = null;
    (model.detailRows || []).forEach((row, i) => {
      // 多期：每期第一戶前加期別分組列
      if (!model.unitMode && model.periods.length > 1 && row.period !== lastPeriod) {
        lastPeriod = row.period;
        put(full, [`第 ${row.period} 期${dateOf(row.period) ? `　請佣日期 ${dateOf(row.period)}` : ''}`], { sz, bold: true, color: T.accent, align: 'left' }, 26);
      }
      const bg = i % 2 ? T.zebra : undefined;
      put(spans, cols.map(c => c.get(row) ?? ''), cols.map(c => cellStyle(c, bg, row.refund)), row.refund ? 36 : 28);
      // 本人分配比例（類別金額下方）＋備註
      const remark = [nonUniform.map(k => `${k === 'keep' ? '保留' : k === 'tax' ? '稅' : '健保'}${row[`${k}Pct`]}%`).join('／'), row.remark].filter(Boolean).join('　');
      const hasShare = Object.keys(row.shares || {}).length > 0;
      if (!hasShare && !remark) return;
      const subSpans = [[0, spans[infoEnd][1]], ...cols.slice(infoEnd + 1, tailStart).map((c, k) => spans[infoEnd + 1 + k]), [spans[tailStart][0], NC - 1]];
      const subVals = [hasShare ? '本人分配比例' : '', ...cols.slice(infoEnd + 1, tailStart).map(c => {
        const sh = row.shares?.[c.catKey];
        return sh ? allocShareText(sh.pct, sh.locked) : '';
      }), remark ? `備註：${remark}` : ''];
      const sub = { sz: small, color: T.muted, bg };
      const remarkW = (NC - spans[tailStart][0]) * PERSON_UNIT;
      put(subSpans, subVals, [{ ...sub, align: 'right' }, ...cols.slice(infoEnd + 1, tailStart).map(() => ({ ...sub, color: T.accent, align: 'right' })), { ...sub, align: 'left', wrap: true }],
        Math.max(22, estimateRowHeight(subVals[subVals.length - 1], remarkW, small, 22)));
    });
    const sumVals = (label, src) => {
      const vals = [label];
      cols.slice(infoEnd + 1).forEach(c => vals.push(c.sum ? toNum(c.sumGet ? c.sumGet(src) : src[c.key]) : ''));
      return vals;
    };
    const sumSpans = [[0, spans[infoEnd][1]], ...spans.slice(infoEnd + 1)];
    if (model.otherAggregate) {
      const bg = (model.detailRows.length % 2) ? T.zebra : undefined;
      put(sumSpans, sumVals(`其他戶別 ${model.otherAggregate.count} 戶（非本人銷售）`, model.otherAggregate),
        [{ sz, color: T.muted, bg, align: 'left' }, ...cols.slice(infoEnd + 1).map(c => cellStyle(c, bg))], 28);
    }
    put(sumSpans, sumVals('合計', t), [{ sz, bold: true, color: T.ink, bg: T.totalBg, align: 'center' },
      ...cols.slice(infoEnd + 1).map(c => ({ ...cellStyle(c, T.totalBg), bold: true }))], 30);
    gap(16);
  }

  // ---- 獎金分配比例 ----
  if (allocRows.length) {
    heading(`${nextSec()}、獎金分配比例`);
    put(allocSpans, ['獎金類別', '戶別', '戶數', '本人比例', '分配人員'], { sz: hsz, bold: true, color: T.ink, bg: T.headBg, align: 'center' }, 30);
    allocRows.forEach(row => {
      const bg = row.group % 2 ? T.zebra : undefined;
      const text = { sz, bg, color: T.ink, align: 'left', wrap: true };
      put(allocSpans, row.cells, [{ ...text, align: 'center', color: row.cont ? T.muted : T.ink }, text, { ...text, align: 'center', fmt: '#,##0' },
        { ...text, align: 'center', bold: true, color: T.accent }, text], row.h);
    });
    gap(16);
  }

  // ---- 期別彙總（多期才列） ----
  if (model.periodSummaries.length > 1) {
    heading(`${nextSec()}、期別彙總`);
    const ps = [
      { label: '期別', w: 50, get: x => x.period }, { label: '請佣日期', w: 80, get: x => x.requestDate },
      { label: '戶數', w: 50, num: true, get: x => x.count }, { label: '獎金小計', w: 90, num: true, get: x => x.subtotal },
      { label: '保留款', w: 80, num: true, get: x => x.keep }, { label: '稅金', w: 70, num: true, get: x => x.tax },
      { label: '二代健保', w: 80, num: true, get: x => x.nhi }, { label: '實發金額', w: 100, num: true, net: true, get: x => x.net },
    ];
    const spans = weightSpans(ps.map(c => c.w), NC);
    put(spans, ps.map(c => c.label), { sz: hsz, bold: true, color: T.ink, bg: T.headBg, align: 'center' }, 30);
    const style = (c, bg, bold) => ({ sz, bg, bold: bold || !!c.net, color: c.net ? T.net : T.ink, align: c.num ? 'right' : 'center', fmt: c.num ? '#,##0' : undefined });
    model.periodSummaries.forEach((x, i) => put(spans, ps.map(c => c.get(x)), ps.map(c => style(c, i % 2 ? T.zebra : undefined)), 28));
    const tot = { period: '合計', requestDate: '', count: model.rows.length, ...t };
    put(spans, ps.map(c => c.get(tot)), ps.map(c => style(c, T.totalBg, true)), 30);
    gap(16);
  }

  // ---- 保留款累計 ----
  heading(`${nextSec()}、保留款累計（本建案全部期別）`);
  const ret = model.retention;
  const items = [['累計保留款', ret.keepTotal], ...(Math.round(toNum(ret.hkTotal)) ? [['其中交屋保留款', ret.hkTotal]] : []), ['已發還', ret.keepPaid], ['未發還', ret.keepUnpaid, true]];
  const retSpans = weightSpans(items.map(() => 1), NC);
  put(retSpans, items.map(x => x[0]), items.map(x => ({ sz: small + 1, color: x[2] ? T.accent : T.muted, bold: !!x[2], bg: x[2] ? T.headBg : T.zebra, align: 'center' })), 26);
  put(retSpans, items.map(x => toNum(x[1])), items.map(x => ({ sz: 16, bold: true, color: x[2] ? T.accent : T.ink, bg: x[2] ? T.headBg : T.zebra, align: 'center', fmt: '#,##0' })), 38);

  // ---- 當期備註 ----
  if (notes.length) {
    gap(16);
    heading('當期備註');
    notes.forEach((note, i) => {
      const text = `第 ${note.period} 期：${note.text}`;
      put(full, [text], { sz, color: T.ink, align: 'left', wrap: true, bg: i % 2 ? T.zebra : undefined }, estimateRowHeight(text, NC * PERSON_UNIT, sz, 26));
    });
  }

  // 收斂實際列數
  g.nRows = r;
  g.cells.length = r;
  g.rowHeights.length = r;
  return { ...g.toJSON(), print: { orientation: 'portrait', fitToHeight: 0 } };
}

/** 個人明細 Excel：與 PDF／預覽同一張（A4 直式、寬度一頁） */
export function buildPersonExcelGrids(model) {
  return [buildPersonGrid(model)];
}

// ================= Grid → Excel =================
function hexToRgb(hex) {
  const h = String(hex || '').replace('#', '');
  return h.length === 6 ? h.toUpperCase() : null;
}

function normBg(bg) {
  const h = String(bg || '').trim();
  if (!h || h.toLowerCase() === '#ffffff' || h.toLowerCase() === 'ffffff') return undefined;
  return h;
}

export function gridToWorksheet(grid) {
  const ws = {};
  const range = { s: { r: 0, c: 0 }, e: { r: grid.nRows - 1, c: grid.nCols - 1 } };
  for (let r = 0; r < grid.nRows; r++) {
    for (let c = 0; c < grid.nCols; c++) {
      const cell = grid.cells[r][c];
      if (!cell) continue;
      const s = cell.s || {};
      const style = {
        font: {
          name: grid.base.fontFamily || 'DFKai-SB',
          sz: s.sz || grid.base.sz || 12,
          bold: !!s.bold,
          color: s.color ? { rgb: hexToRgb(s.color) } : undefined,
        },
        alignment: {
          horizontal: s.align || (cell.t === 'n' ? 'right' : 'center'),
          vertical: 'center',
          wrapText: !!s.wrap || String(cell.v).includes('\n'),
        },
      };
      if (s.bg) style.fill = { fgColor: { rgb: hexToRgb(s.bg) }, patternType: 'solid' };
      if (s.border) {
        const bd = { style: 'thin', color: { rgb: '000000' } };
        style.border = { top: bd, bottom: bd, left: bd, right: bd };
      }
      const out = { v: cell.v, t: cell.t, s: style };
      if (cell.t === 'n' && s.fmt) out.z = s.fmt;
      ws[XLSX.utils.encode_cell({ r, c })] = out;
    }
  }
  ws['!ref'] = XLSX.utils.encode_range(range);
  ws['!cols'] = grid.cols.map(w => ({ wpx: w }));
  ws['!rows'] = grid.rowHeights.map(h => ({ hpx: h }));
  ws['!merges'] = grid.merges.map(m => ({ s: { r: m.r1, c: m.c1 }, e: { r: m.r2, c: m.c2 } }));
  ws['!margins'] = { ...NARROW_MARGINS };
  return ws;
}

/** 列印範圍 = 工作表實際使用範圍（!ref），寫成 _xlnm.Print_Area 定義名稱 */
function addPrintAreas(wb) {
  wb.Workbook = wb.Workbook || {};
  wb.Workbook.Names = wb.Workbook.Names || [];
  wb.SheetNames.forEach((name, i) => {
    const ws = wb.Sheets[name];
    if (!ws || !ws['!ref']) return;
    const r = XLSX.utils.decode_range(ws['!ref']);
    const abs = c => `$${XLSX.utils.encode_col(c.c)}$${c.r + 1}`;
    wb.Workbook.Names.push({
      Name: '_xlnm.Print_Area',
      Sheet: i,
      Ref: `'${name.replace(/'/g, "''")}'!${abs(r.s)}:${abs(r.e)}`,
    });
  });
}

function gridsToWorkbook(grids) {
  const wb = XLSX.utils.book_new();
  const used = new Set();
  grids.forEach((grid, i) => {
    let safe = String(grid.name || `Sheet${i + 1}`).replace(/[\\/?*[\]:]/g, '').slice(0, 31) || `Sheet${i + 1}`;
    let n = 2;
    while (used.has(safe)) { safe = `${safe.slice(0, 28)}(${n++})`; }
    used.add(safe);
    XLSX.utils.book_append_sheet(wb, gridToWorksheet(grid), safe);
  });
  addPrintAreas(wb);
  return wb;
}

/** 產生 xlsx Blob：A4 橫式、列印範圍＝使用範圍、寬高各 1 頁、窄邊界、水平置中 */
export async function gridsToExcelBlob(grids) {
  const out = XLSX.write(gridsToWorkbook(grids), { bookType: 'xlsx', type: 'array' });
  return applyPrintSetup(out, grids.map(g => g.print));
}

export async function exportGridsToExcel(grids, fileName) {
  const blob = await gridsToExcelBlob(grids);
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${fileName}.xlsx`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

// ================= Grid → HTML（預覽） =================
export function gridToHtml(grid) {
  const merged = {};   // "r,c" -> {rowspan, colspan} 或 skip
  grid.merges.forEach(m => {
    merged[`${m.r1},${m.c1}`] = { rowspan: m.r2 - m.r1 + 1, colspan: m.c2 - m.c1 + 1 };
    for (let r = m.r1; r <= m.r2; r++) {
      for (let c = m.c1; c <= m.c2; c++) {
        if (r === m.r1 && c === m.c1) continue;
        merged[`${r},${c}`] = 'skip';
      }
    }
  });

  // 人員欄位標記：整欄加 data-pc（欄索引），表頭格加 data-person-key 供拖曳排序
  const pcMap = {};   // "r,c" -> { idx, head }
  (grid.personCols || []).forEach((pc, idx) => {
    for (let r = pc.r1; r <= pc.r2; r++) {
      for (let c = pc.c1; c <= pc.c2; c++) pcMap[`${r},${c}`] = { idx, head: r === pc.r1 && c === pc.c1 };
    }
  });

  // 上方固定欄標記：整欄加 data-fc，表頭格加 data-col-key 供拖曳排序
  const fcMap = {};   // "r,c" -> { idx, head }
  (grid.fixedCols || []).forEach((fc, idx) => {
    for (let r = fc.r1; r <= fc.r2; r++) {
      for (let c = fc.c1; c <= fc.c2; c++) fcMap[`${r},${c}`] = { idx, head: r === fc.r1 && c === fc.c1 };
    }
  });

  const edMap = {};   // "r,c" -> editCells index
  (grid.editCells || []).forEach((ec, idx) => { edMap[`${ec.r},${ec.c}`] = idx; });
  const urMap = {};   // r -> unitRows index
  (grid.unitRows || []).forEach((ur, idx) => { urMap[ur.r] = idx; });
  const tipMap = {};   // "r,c" -> cellTips index（金額來源戶別，預覽 hover）
  (grid.cellTips || []).forEach((t, idx) => { tipMap[`${t.r},${t.c}`] = idx; });

  const colTags = grid.cols.map(w => `<col style="width:${Math.round(w * 1.05)}px">`).join('');
  const family = grid.base.fontFamily || 'DFKai-SB';
  const fallback = /Kai|楷|Serif|明/.test(family) ? "'Noto Serif TC',serif" : "'Noto Sans TC','PingFang TC',sans-serif";
  let html = `<table class="comm-grid" style="border-collapse:collapse;table-layout:fixed;font-family:'${family}',${fallback}">` + `<colgroup>${colTags}</colgroup>`;
  for (let r = 0; r < grid.nRows; r++) {
    html += `<tr style="height:${grid.rowHeights[r]}px">`;
    for (let c = 0; c < grid.nCols; c++) {
      const mk = merged[`${r},${c}`];
      if (mk === 'skip') continue;
      const cell = grid.cells[r][c];
      const s = cell?.s || {};
      const styles = [
        `text-align:${s.align || (cell?.t === 'n' ? 'right' : 'center')}`,
        'vertical-align:middle',
        `font-size:${Math.max(9, Math.round((s.sz || grid.base.sz || 12) * 0.85))}px`,
        'padding:1px 4px',
        'overflow:hidden',
        'white-space:pre-wrap',
      ];
      if (s.bold) styles.push('font-weight:700');
      if (s.color) styles.push(`color:${s.color}`);
      if (s.bg) styles.push(`background:${s.bg}`);
      styles.push(s.border ? 'border:1px solid #999' : 'border:1px solid transparent');
      const span = mk ? ` rowspan="${mk.rowspan}" colspan="${mk.colspan}"` : '';
      const text = cell ? escapeHtml(fmtValue(cell.v, s.fmt)) : '';
      const pc = pcMap[`${r},${c}`];
      const ed = edMap[`${r},${c}`];
      let attrs = '';
      const classes = [];
      if (pc) {
        const meta = grid.personCols[pc.idx];
        attrs += ` data-pc="${pc.idx}"`;
        if (pc.head) {
          attrs += ` data-person-key="${escapeAttr(meta.personKey)}" data-person-section="${meta.section}" data-person-cat="${escapeAttr(meta.mgmtCat || '')}" draggable="true"`;
          classes.push('pc-head');
        }
      }
      const fc = fcMap[`${r},${c}`];
      if (fc) {
        attrs += ` data-fc="${fc.idx}"`;
        if (fc.head) { attrs += ` data-col-key="${escapeAttr(grid.fixedCols[fc.idx].key)}" draggable="true"`; classes.push('fc-head'); }
      }
      if (ed !== undefined) { attrs += ` data-ed="${ed}"`; classes.push('ed-cell'); }
      const ur = urMap[r];
      if (ur !== undefined) {
        attrs += ` data-ur="${ur}"`;
        if (c === (grid.unitRows[ur].handleCol ?? 0)) { attrs += ` data-unit-handle="1" draggable="true"`; classes.push('ur-handle'); }
      }
      const tip = tipMap[`${r},${c}`];
      if (tip !== undefined) { attrs += ` data-tip="${tip}"`; classes.push('tip-cell'); }
      if (classes.length) attrs += ` class="${classes.join(' ')}"`;
      html += `<td${span}${attrs} style="${styles.join(';')}">${text}</td>`;
    }
    html += '</tr>';
  }
  html += '</table>';
  return html;
}

function escapeHtml(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\n/g, '<br>');
}
function escapeAttr(s) {
  return String(s ?? '').replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
