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
  if (fmt === '0.0') return (Math.round(v * 10) / 10).toLocaleString('en-US', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
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

export function buildBonusGroupGrid(group, model) {
  const st = model.style || {};
  const HK = !!group.hasHandover;   // 交屋保留款費率／金額兩欄：該組有提撥才顯示
  const FIX = HK ? 18 : 16;
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
    { label: '最終實領', get: a => (D ? a.netDisc : a.net), style: { bold: true }, always: true },
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
  const FW = [46, 82, 82, 84, 72, 96, 66, 62, 90, 96, 56, 96, 84, 72, 66, 66, ...(HK ? [110, 84] : [])];
  for (let c = 0; c < NC; c++) g.cols[c] = c < FW.length ? FW[c] : 66;

  const headerBg = normBg(st.headerBg) || '#c4bd97';
  const totalBg = normBg(st.totalRowBg) || '#ffff00';

  // 標題
  g.set(rTitle, 0, group.title, { sz: st.titleFontSize || 20, bold: true, align: 'center' });
  g.merge(rTitle, 0, rTitle, NC - 1);
  g.rowHeights[rTitle] = 38;

  // 上方表頭
  const isPackage = !model.mergedRows && model.priceBasis === 'package';
  const H1 = ['編號', '小訂日期', '簽約日期', '戶別', isPackage ? '配套底價(萬)' : '停車位', '姓名', isPackage ? '配套價格(萬)' : '成交價(萬)', '', isPackage ? '配套總價(萬)' : '總成交價(萬)', model.partyALabel, '折數', '折數後總價(萬)', '銷售人員', '團獎人數', '個獎費率', '團獎費率'];
  if (HK) H1.push('交屋保留款費率', '交屋保留款金額');
  if (model.mergedRows) {
    H1[3] = '戶別／方案'; H1[4] = '停車位／配套底價(萬)'; H1[6] = '成交價／配套價格(萬)'; H1[8] = '總價(萬)';
  }
  const hStyle = { sz: st.headerFontSize || 12, bold: true, align: 'center', wrap: true, bg: headerBg, border: true };
  H1.forEach((h, c) => { if (h) g.set(rH1, c, h, hStyle); });
  if (isPackage) {
    g.merge(rH1, 6, rH2, 7);
  } else {
    g.set(rH2, 6, model.mergedRows ? '房價／配套價' : '房價', hStyle); g.set(rH2, 7, '車價', hStyle);
    g.merge(rH1, 6, rH1, 7);
  }
  [0, 1, 2, 3, 4, 5, 8, 9, 10, 11, 12, 13, 14, 15, ...(HK ? [16, 17] : [])].forEach(c => g.merge(rH1, c, rH2, c));
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
    const rowIsPackage = model.mergedRows ? d.priceBasis === 'package' : isPackage;
    if (model.mergedRows) g.rowHeights[r] = 36;
    const rc = d.refund ? '#C00000' : undefined;   // 退佣列紅字
    g.set(r, 0, d.no, { align: 'center', border: true, color: rc });
    g.set(r, 1, d.sodate, { align: 'center', border: true, color: rc });
    g.set(r, 2, d.sign, { align: 'center', border: true, color: rc });
    g.set(r, 3, model.mergedRows ? `${d.unit}\n${d.planName}` : d.unit, { align: 'center', wrap: !!model.mergedRows, border: true, color: rc });
    g.set(r, 4, rowIsPackage ? d.packageFloor : d.park, { align: 'center', border: true, color: rc });
    g.set(r, 5, d.name, { align: 'center', border: true, color: rc });
    g.set(r, 6, d.house || '', { fmt: '#,##0', border: true, color: rc });
    if (rowIsPackage) g.merge(r, 6, r, 7);
    else g.set(r, 7, d.parkP || '', { fmt: '#,##0', border: true, color: rc });
    g.set(r, 8, d.total || '', { fmt: '#,##0', border: true, color: rc });
    g.set(r, 9, d.referral || '', { fmt: '#,##0', border: true, color: rc });
    g.set(r, 10, d.disc || '', { fmt: '0.00', border: true, color: rc });
    g.set(r, 11, d.after || '', { fmt: '#,##0', border: true, color: rc });
    g.set(r, 12, d.sales, { align: 'center', border: true, color: rc });
    g.set(r, 13, d.team || '', { align: 'center', border: true, color: rc });
    g.set(r, 14, d.indivRate ? `${pctText(d.indivRate)}%` : '', { align: 'center', border: true, color: rc });
    g.set(r, 15, d.teamRate ? `${pctText(d.teamRate)}%` : '', { align: 'center', border: true, color: rc });
    if (HK) {
      g.set(r, 16, d.hkRate || '', { align: 'center', border: true, color: rc });
      g.set(r, 17, d.hkAmt || '', { fmt: '#,##0', border: true, color: rc });
    }
    group.topPersons.forEach((p, j) => {
      const col = FIX + 2 * j;
      const v = d.pp[p.personKey] || { indiv: 0, team: 0 };
      g.set(r, col, v.indiv || '', { fmt: '#,##0', border: true, color: rc });
      g.set(r, col + 1, v.team || '', { fmt: '#,##0', border: true, color: rc });
    });
  });
  if (n > 0) g.region(rData0, 0, rDataEnd, NC - 1, { border: true });

  // 上方合計（黃底）
  g.set(rTopTotal, 0, '合計', { bold: true, align: 'center' });
  g.set(rTopTotal, 8, group.topTotal.total || '', { fmt: '#,##0', bold: true });
  g.set(rTopTotal, 9, group.topTotal.referral || '', { fmt: '#,##0', bold: true });
  g.set(rTopTotal, 11, group.topTotal.after || '', { fmt: '#,##0', bold: true });
  if (HK) g.set(rTopTotal, 17, group.topTotal.hk || '', { fmt: '#,##0', bold: true });
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
    { r: rH1, c: 9, key: 'partyALabel', label: '介紹費欄位 A' },
  ];
  const youfuIdx = rowDefs.findIndex(d => d.key === 'youfu');
  if (youfuIdx >= 0) editCells.push({ r: rb0 + youfuIdx, c: 0, key: 'youfuLabelPattern', label: '優付列文字', hint: '{pct}＝請佣比例' });

  // 戶別列（即時預覽拖曳上下排序；handle 為編號欄）
  const unitRows = group.unitRows.map((d, i) => ({ r: rData0 + i, unitId: d.unitId, recordId: d.recordId, handleCol: 0 }));

  return { ...g.toJSON(), personCols, editCells, unitRows };
}

export function buildBonusGrids(model) {
  return model.groups.map(gr => buildBonusGroupGrid(gr, model));
}

// ================= 個人獎金明細 grid =================
/** 明細表欄位定義（依 model 動態組合） */
function personDetailColumns(model) {
  const cols = [
    { key: 'period',       label: '期別',       width: 40, align: 'center', get: r => r.period },
    { key: 'requestDate',  label: '請佣日期',   width: 66, align: 'center', get: r => r.requestDate },
    { key: 'unit',         label: '戶別',       width: 56, align: 'center', get: r => r.unit },
    { key: 'contractDate', label: '簽約日期',   width: 66, align: 'center', get: r => r.contractDate },
  ];
  if (model.showBuyerName) cols.push({ key: 'buyerName', label: '買方', width: 72, align: 'center', get: r => r.buyerName });
  if (model.showDealTotal) cols.push({ key: 'dealTotal', label: '成交總價(萬)', width: 92, numFmt: '#,##0', sum: true, get: r => r.dealTotal });
  cols.push({ key: 'ratioPct', label: '請佣比例', width: 68, align: 'center', get: r => `${r.ratioPct}%` });
  model.categories.forEach(c => {
    cols.push({
      key: `cat_${c.key}`, label: c.label, width: 74, numFmt: '#,##0', sum: true,
      headerSub: `${pctText(c.ratePct)}%`,   // 類別比例（建案設定 ratePct，單位 %）
      get: r => r.amounts[c.key], sumGet: t => t.amounts[c.key],
    });
  });
  cols.push({ key: 'subtotal', label: '小計', width: 78, numFmt: '#,##0', sum: true, bold: true, get: r => r.subtotal });
  cols.push({ key: 'keep',     label: '保留款',   width: 70, numFmt: '#,##0', sum: true, get: r => r.keep, sub: r => `${r.keepPct}%` });
  // 交屋保留款：含於保留款，僅供參考（淡紅底，同獎金表）
  cols.push({ key: 'hkRate',   label: '交屋保留款費率', width: 96, align: 'center', bg: HK_BG, get: r => r.hkRate });
  cols.push({ key: 'hk',       label: '交屋保留款金額', width: 80, numFmt: '#,##0', sum: true, bg: HK_BG, get: r => r.hk });
  cols.push({ key: 'tax',     label: '稅金',     width: 66, numFmt: '#,##0', sum: true, get: r => r.tax, sub: r => `${r.taxPct}%` });
  cols.push({ key: 'nhi',      label: '二代健保', width: 66, numFmt: '#,##0', sum: true, get: r => r.nhi, sub: r => `${r.nhiPct}%` });
  cols.push({ key: 'net',      label: '實發金額', width: 84, numFmt: '#,##0', sum: true, bold: true, get: r => r.net });
  cols.push({ key: 'remark',   label: '備註',     width: 90, align: 'left', get: r => r.remark });
  return cols;
}

/** 全列扣款比例一致時，表頭顯示 %；否則以資料列各自比例呈現於備註 */
function uniformPct(rows, key) {
  if (!rows.length) return null;
  const v = rows[0][key];
  return rows.every(r => r[key] === v) ? v : null;
}

const PERSON_SUMMARY_COLS = [
  { key: 'period',      label: '期別',     width: 60,  align: 'center', get: p => p.period },
  { key: 'requestDate', label: '請佣日期', width: 90,  align: 'center', get: p => p.requestDate },
  { key: 'count',       label: '戶數',     width: 60,  numFmt: '#,##0', get: p => p.count },
  { key: 'subtotal',    label: '獎金小計', width: 100, numFmt: '#,##0', get: p => p.subtotal },
  { key: 'keep',        label: '保留款',   width: 90,  numFmt: '#,##0', get: p => p.keep },
  { key: 'hk',          label: '交屋保留款', width: 100, numFmt: '#,##0', bg: HK_BG, get: p => p.hk },
  { key: 'tax',        label: '稅金',     width: 90,  numFmt: '#,##0', get: p => p.tax },
  { key: 'nhi',         label: '二代健保', width: 100, numFmt: '#,##0', get: p => p.nhi },
  { key: 'net',         label: '實發金額', width: 110, numFmt: '#,##0', bold: true, get: p => p.net },
];

function personRowCounts(model) {
  return {
    head: 4,                                       // 標題、期別、人員資訊、產出資訊
    detail: model.showDetail ? 3 + model.detailRows.length + (model.otherAggregate ? 1 : 0) + 1 : 0, // 區塊標題、表頭(2列)、資料、其他彙整、合計
    summary: 2 + model.periodSummaries.length + 1, // 區塊標題、表頭、資料、合計
    retention: 2,                                  // 區塊標題、數值列
    spacer: 1,
  };
}

function drawPersonHead(g, r0, model, NC) {
  const st = model.style || {};
  g.set(r0, 0, model.title, { sz: st.titleFontSize || 18, bold: true, align: 'center' });
  g.merge(r0, 0, r0, NC - 1);
  g.rowHeights[r0] = 36;
  g.set(r0 + 1, 0, model.subtitle, { sz: (st.titleFontSize || 18) - 4, bold: true, align: 'center' });
  g.merge(r0 + 1, 0, r0 + 1, NC - 1);
  g.rowHeights[r0 + 1] = 28;
  const p = model.person;
  const src = p.sourceProjectName ? `（${p.sourceProjectName}）` : '';
  g.set(r0 + 2, 0, `姓名：${p.name}${src}　　職務：${p.role || '—'}　　建案：${model.projectName}`, { align: 'left' });
  g.merge(r0 + 2, 0, r0 + 2, NC - 1);
  g.rowHeights[r0 + 2] = 26;
  g.set(r0 + 3, 0, `產出日期：${model.generatedAt}　　本明細僅含本人獎金，金額單位：元`, { align: 'left', sz: Math.max(9, (st.dataFontSize || 11) - 1), color: '#555555' });
  g.merge(r0 + 3, 0, r0 + 3, NC - 1);
  g.rowHeights[r0 + 3] = 22;
  return r0 + 4;
}

/** 依文字長度估算需要的列高（px），供 Excel／預覽避免截斷 */
function estimateRowHeight(text, widthPx, sz, minH) {
  const str = String(text || '');
  if (!str) return minH;
  const perLine = Math.max(1, Math.floor((widthPx - 8) / (sz * 1.05)));
  let lines = 0;
  str.split('\n').forEach(seg => { lines += Math.max(1, Math.ceil(seg.length / perLine)); });
  return Math.max(minH, lines * (sz + 6) + 8);
}

function drawPersonDetail(g, r0, model, cols, secLabel = '一') {
  const st = model.style || {};
  const sz = st.dataFontSize || 11;
  const headerStyle = { sz: st.headerFontSize || 11, bold: true, align: 'center', wrap: true, border: true, bg: normBg(st.headerBg) };
  const scopeText = model.detailScope === 'all' ? '' : '（僅列本人為銷售人員之戶別）';
  g.set(r0, 0, `${secLabel}、每戶獎金明細${scopeText}`, { bold: true, align: 'left' });
  g.merge(r0, 0, r0, cols.length - 1);
  g.rowHeights[r0] = 26;
  const rH1 = r0 + 1, rH2 = r0 + 2;
  cols.forEach((c, ci) => {
    g.set(rH1, ci, c.label, headerStyle);
    if (c.headerSub) {
      g.set(rH2, ci, c.headerSub, headerStyle);
    } else if (c.sub) {
      const u = uniformPct(model.rows, `${c.key}Pct`);
      g.set(rH2, ci, u !== null ? `${u}%` : '', headerStyle);
    } else {
      g.merge(rH1, ci, rH2, ci);
    }
  });
  g.region(rH1, 0, rH2, cols.length - 1, { border: true, bg: normBg(st.headerBg) });
  g.rowHeights[rH1] = 30; g.rowHeights[rH2] = 20;

  const rData0 = rH2 + 1;
  const detailRows = model.detailRows || model.rows;
  detailRows.forEach((row, ri) => {
    const r = rData0 + ri;
    g.rowHeights[r] = 26;
    cols.forEach((c, ci) => {
      let v = c.get(row);
      // 扣款比例不一致時，在備註前補註該列比例
      if (c.key === 'remark') {
        const notes = [];
        ['keep', 'tax', 'nhi'].forEach(k => {
          if (uniformPct(model.rows, `${k}Pct`) === null) notes.push(`${k === 'keep' ? '保留' : k === 'tax' ? '稅' : '健保'}${row[`${k}Pct`]}%`);
        });
        if (notes.length) v = [notes.join('/'), v].filter(Boolean).join(' ');
      }
      const isText = typeof v === 'string' && v !== '';
      if (isText) g.rowHeights[r] = Math.max(g.rowHeights[r], estimateRowHeight(v, c.width, sz, 26));
      g.set(r, ci, v === undefined || v === null ? '' : v, {
        align: c.align || 'right', fmt: c.numFmt, border: true, bold: !!c.bold, wrap: isText, bg: c.bg,
      });
    });
  });
  // 非本人銷售之戶別：彙整為一列，不列戶別／買方
  let rNext = rData0 + detailRows.length;
  if (model.otherAggregate) {
    const agg = model.otherAggregate;
    const labelEnd = Math.max(0, cols.findIndex(c => c.key === 'ratioPct'));
    g.set(rNext, 0, `其他戶別（${agg.count} 戶，非本人銷售）`, { align: 'left', border: true, wrap: true });
    if (labelEnd > 0) { g.region(rNext, 0, rNext, labelEnd, { border: true }); g.merge(rNext, 0, rNext, labelEnd); }
    cols.forEach((c, ci) => {
      if (ci <= labelEnd) return;
      if (c.sum && c.key !== 'dealTotal') {
        const v = c.sumGet ? c.sumGet(agg) : agg[c.key];
        g.set(rNext, ci, toNum(v), { align: 'right', fmt: c.numFmt, border: true, bold: !!c.bold });
      } else {
        g.set(rNext, ci, '', { border: true });
      }
    });
    g.rowHeights[rNext] = 26;
    rNext += 1;
  }
  const rTotal = rNext;
  g.set(rTotal, 0, '合計', { bold: true, align: 'center', border: true, bg: normBg(st.totalRowBg) });
  cols.forEach((c, ci) => {
    if (!c.sum) return;
    const v = c.sumGet ? c.sumGet(model.totals) : model.totals[c.key];
    g.set(rTotal, ci, toNum(v), { bold: true, align: 'right', fmt: c.numFmt, border: true, bg: normBg(st.totalRowBg) });
  });
  g.region(rTotal, 0, rTotal, cols.length - 1, { border: true, bold: true, bg: normBg(st.totalRowBg) });
  g.rowHeights[rTotal] = 28;
  return rTotal + 1;
}

function drawPersonSummary(g, r0, model, NC, secLabel = '二') {
  const st = model.style || {};
  const cols = PERSON_SUMMARY_COLS;
  const headerStyle = { sz: st.headerFontSize || 11, bold: true, align: 'center', wrap: true, border: true, bg: normBg(st.headerBg) };
  g.set(r0, 0, `${secLabel}、期別彙總（含本人全部獎金）`, { bold: true, align: 'left' });
  g.merge(r0, 0, r0, NC - 1);
  g.rowHeights[r0] = 26;
  const rH = r0 + 1;
  cols.forEach((c, ci) => g.set(rH, ci, c.label, headerStyle));
  g.rowHeights[rH] = 28;
  model.periodSummaries.forEach((p, i) => {
    const r = rH + 1 + i;
    g.rowHeights[r] = 26;
    cols.forEach((c, ci) => g.set(r, ci, c.get(p), { align: c.align || 'right', fmt: c.numFmt, border: true, bold: !!c.bold, bg: c.bg }));
  });
  const rTotal = rH + 1 + model.periodSummaries.length;
  g.set(rTotal, 0, '合計', { bold: true, align: 'center', border: true, bg: normBg(st.totalRowBg) });
  g.merge(rTotal, 0, rTotal, 1);
  g.set(rTotal, 2, model.rows.length, { bold: true, align: 'right', fmt: '#,##0', border: true, bg: normBg(st.totalRowBg) });
  cols.slice(3).forEach((c, i) => {
    g.set(rTotal, 3 + i, toNum(model.totals[c.key]), { bold: true, align: 'right', fmt: '#,##0', border: true, bg: normBg(st.totalRowBg) });
  });
  g.region(rTotal, 0, rTotal, cols.length - 1, { border: true, bold: true, bg: normBg(st.totalRowBg) });
  g.rowHeights[rTotal] = 28;
  return rTotal + 1;
}

function drawPersonRetention(g, r0, model, NC, secLabel = '三') {
  const st = model.style || {};
  const color = st.summaryColor || '#DD0806';
  g.set(r0, 0, `${secLabel}、保留款累計（本建案全部期別）`, { bold: true, align: 'left' });
  g.merge(r0, 0, r0, NC - 1);
  g.rowHeights[r0] = 26;
  const r = r0 + 1;
  const items = [
    ['累計保留款', model.retention.keepTotal],
    ['其中交屋保留款', model.retention.hkTotal, HK_BG],
    ['已發還', model.retention.keepPaid],
    ['未發還', model.retention.keepUnpaid, undefined, color],
  ];
  const labStyle = { bold: true, align: 'center', wrap: true, border: true, bg: normBg(st.headerBg) };
  // 版位：欄數足夠時標籤／數值各佔兩欄；否則首個標籤佔兩欄（第 0 欄最窄），其餘各佔一欄
  const wide = NC >= 16;
  const layout = wide
    ? [[0, 1, 2, 3], [4, 5, 6, 7], [8, 9, 10, 11], [12, 13, 14, 15]]   // [labStart, labEnd, valStart, valEnd]
    : [[0, 1, 2, 2], [3, 3, 4, 4], [5, 5, 6, 6], [7, 7, 8, 8]];
  const spanW = (c1, c2) => g.cols.slice(c1, c2 + 1).reduce((s, w) => s + w, 0);
  let h = 28;
  items.forEach(([lab, val, bg, valColor], i) => {
    const [l1, l2, v1, v2] = layout[i];
    if (v2 >= NC) return;
    g.set(r, l1, lab, labStyle);
    g.set(r, v1, toNum(val), { bold: true, align: 'right', fmt: '#,##0', border: true, color: valColor, bg });
    if (l2 > l1) { g.region(r, l1, r, l2, labStyle); g.merge(r, l1, r, l2); }
    if (v2 > v1) { g.region(r, v1, r, v2, { border: true, bg }); g.merge(r, v1, r, v2); }
    h = Math.max(h, estimateRowHeight(lab, spanW(l1, l2), st.dataFontSize || 11, 28));
  });
  g.rowHeights[r] = h;
  return r + 1;
}

function drawPersonNotes(g, start, model, columns) {
  const rows = personNoteRows(model);
  if (!rows.length) return;
  g.set(start, 0, '當期備註', { bold: true, border: true });
  g.merge(start, 0, start, columns - 1);
  const width = g.cols.reduce((sum, w) => sum + w, 0);
  rows.forEach((note, i) => {
    const r = start + 1 + i;
    const text = `第 ${note.period} 期：${note.text}`;
    g.set(r, 0, text, { align: 'left', wrap: true, border: true });
    g.merge(r, 0, r, columns - 1);
    g.rowHeights[r] = estimateRowHeight(text, width, model.style?.dataFontSize || 11, 28);
  });
}

/** 個人明細：單張合併 grid（PDF / 預覽） */
const SEC = ['一', '二', '三'];

export function buildPersonGrid(model) {
  const cols = personDetailColumns(model);
  const NC = model.showDetail ? Math.max(cols.length, PERSON_SUMMARY_COLS.length) : PERSON_SUMMARY_COLS.length;
  const rc = personRowCounts(model);
  const nRows = rc.head + (model.showDetail ? rc.detail + rc.spacer : 0) + rc.summary + rc.spacer + rc.retention + (personNoteRows(model).length ? personNoteRows(model).length + 1 : 0);
  const st = model.style || {};
  const g = new Grid(model.person.name || '個人明細', NC, nRows, { fontFamily: st.fontFamily || 'DFKai-SB', sz: st.dataFontSize || 11 });
  if (model.showDetail) {
    cols.forEach((c, i) => { g.cols[i] = c.width; });
    for (let i = cols.length; i < NC; i++) g.cols[i] = 60;
  } else {
    PERSON_SUMMARY_COLS.forEach((c, i) => { g.cols[i] = c.width; });
  }

  let sec = 0;
  let r = drawPersonHead(g, 0, model, NC);
  if (model.showDetail) {
    r = drawPersonDetail(g, r, model, cols, SEC[sec++]);
    g.rowHeights[r] = 14; r += 1;
  }
  r = drawPersonSummary(g, r, model, NC, SEC[sec++]);
  g.rowHeights[r] = 14; r += 1;
  r = drawPersonRetention(g, r, model, NC, SEC[sec++]);
  drawPersonNotes(g, r, model, NC);
  return g.toJSON();
}

/** 個人明細：Excel 兩張工作表（彙總 ＋ 每戶明細） */
export function buildPersonExcelGrids(model) {
  const st = model.style || {};
  const base = { fontFamily: st.fontFamily || 'DFKai-SB', sz: st.dataFontSize || 11 };
  const rc = personRowCounts(model);

  // 彙總
  const NC1 = PERSON_SUMMARY_COLS.length;
  const g1 = new Grid('彙總', NC1, rc.head + rc.summary + rc.spacer + rc.retention + (personNoteRows(model).length ? personNoteRows(model).length + 1 : 0), base);
  PERSON_SUMMARY_COLS.forEach((c, i) => { g1.cols[i] = c.width; });
  let r = drawPersonHead(g1, 0, model, NC1);
  r = drawPersonSummary(g1, r, model, NC1, '一');
  g1.rowHeights[r] = 14; r += 1;
  r = drawPersonRetention(g1, r, model, NC1, '二');
  drawPersonNotes(g1, r, model, NC1);
  if (!model.showDetail) return [g1.toJSON()];

  // 每戶明細（本人為銷售人員之戶別）
  const cols = personDetailColumns(model);
  const NC2 = cols.length;
  const g2 = new Grid('每戶明細', NC2, rc.head + rc.detail, base);
  cols.forEach((c, i) => { g2.cols[i] = c.width; });
  r = drawPersonHead(g2, 0, model, NC2);
  drawPersonDetail(g2, r, model, cols, '三');

  return [g1.toJSON(), g2.toJSON()];
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
  return applyPrintSetup(out);
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

  const edMap = {};   // "r,c" -> editCells index
  (grid.editCells || []).forEach((ec, idx) => { edMap[`${ec.r},${ec.c}`] = idx; });
  const urMap = {};   // r -> unitRows index
  (grid.unitRows || []).forEach((ur, idx) => { urMap[ur.r] = idx; });

  const colTags = grid.cols.map(w => `<col style="width:${Math.round(w * 1.05)}px">`).join('');
  let html = `<table class="comm-grid" style="border-collapse:collapse;table-layout:fixed;font-family:'${grid.base.fontFamily || 'DFKai-SB'}','Noto Serif TC',serif">` + `<colgroup>${colTags}</colgroup>`;
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
      if (ed !== undefined) { attrs += ` data-ed="${ed}"`; classes.push('ed-cell'); }
      const ur = urMap[r];
      if (ur !== undefined) {
        attrs += ` data-ur="${ur}"`;
        if (c === (grid.unitRows[ur].handleCol ?? 0)) { attrs += ` data-unit-handle="1" draggable="true"`; classes.push('ur-handle'); }
      }
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
