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
import { toNum, money } from '@/utils/commissionCalculation';
import { applyPrintSetup, NARROW_MARGINS } from './xlsxPrintSetup';

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
    g.set(rNote0 + 3, valCol, model.summary.bill, sumStyle);      g.set(rNote0 + 3, labCol, '一個期票支付', labStyle);
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
  return rates.length === 1 ? `　${rates[0].toFixed(2)}%` : '';
}

function personHeaderName(p, model) {
  if (model.showSourceProjectTag && p.sourceProjectId && p.sourceProjectId !== model.projectId && p.sourceProjectName) {
    return `${p.name}\n(${p.sourceProjectName})`;
  }
  return p.name;
}

export function buildBonusGroupGrid(group, model) {
  const st = model.style || {};
  const HAS_H = !!(group.hasHandover ?? model.hasHandover);   // 交屋團獎欄（自個獎提撥、本期不發放）
  const HCOL = 14;                                             // 交屋團獎欄位置（團獎人數之後）
  const FIX = HAS_H ? 15 : 14;
  const P = group.topPersons.length;
  const L = group.left.length;
  const R = group.right.length;
  const LSTART = 2;                 // 左側第一位管理人員欄（0-based）
  const RLAB = LSTART + L;          // 右側「項目」標籤欄
  const NC = Math.max(FIX + 2 * P, RLAB + 1 + R, 12);

  const n = group.unitRows.length;
  const rTitle = 0, rKilo = 1, rH1 = 2, rH2 = 3, rData0 = 4;
  const rDataEnd = rData0 + Math.max(n, 1) - 1;
  const rTopTotal = rDataEnd + 1;
  const rSpacer = rTopTotal + 1;
  const rbTitle = rSpacer + 1;
  const rbH = rbTitle + 1;
  const rb0 = rbH + 1;

  // 右側列：類別列（含補齊管理列數）＋合計＋(優付)＋扣款＋實發＋備註
  const preRows = Math.max(group.rightRows.length, 2 + group.mgmtCats.length);
  const ROWS = [];
  for (let k = 0; k < preRows; k++) ROWS.push(group.rightRows[k] || null);
  const RI = {};
  RI.sub = preRows;
  RI.youfu = group.isYoufu ? preRows + 1 : -1;
  RI.keep = group.isYoufu ? preRows + 2 : preRows + 1;
  RI.tax = RI.keep + 1; RI.nhi = RI.keep + 2; RI.net = RI.keep + 3; RI.remark = RI.keep + 4;
  const nBottomRows = RI.remark + 1;

  const rGrand0 = rb0 + nBottomRows;
  const GRAND_N = 4;
  const nRows = rGrand0 + GRAND_N;

  const g = new Grid(group.sheetName, NC, nRows, { fontFamily: st.fontFamily || 'DFKai-SB', sz: st.dataFontSize || 12 });
  const FW = [46, 82, 82, 84, 72, 96, 66, 62, 90, 96, 56, 96, 84, 72];
  if (HAS_H) FW.push(92);
  for (let c = 0; c < NC; c++) g.cols[c] = c < FW.length ? FW[c] : 66;
  g.cols[RLAB] = Math.max(g.cols[RLAB] || 66, 116);   // 右側「項目」標籤欄需容納「類別＋比例」單行

  const headerBg = normBg(st.headerBg) || '#c4bd97';
  const totalBg = normBg(st.totalRowBg) || '#ffff00';
  const rRow = idx => rb0 + idx;

  // 標題
  g.set(rTitle, 0, group.title, { sz: st.titleFontSize || 20, bold: true, align: 'center' });
  g.merge(rTitle, 0, rTitle, NC - 1);
  g.rowHeights[rTitle] = 38;

  // 千4 列
  g.set(rKilo, 13, group.kiloLabel, { sz: 9, align: 'center', border: true });
  if (HAS_H) g.set(rKilo, HCOL, group.handoverX || '', { sz: 9, align: 'center', border: true });
  group.topPersons.forEach((p, i) => {
    const col = FIX + 2 * i;
    g.set(rKilo, col, group.indivX || '', { sz: 9, align: 'center', border: true });
    g.set(rKilo, col + 1, group.teamX || '', { sz: 9, align: 'center', border: true });
  });
  if (P > 0) g.region(rKilo, 13, rKilo, FIX - 1 + 2 * P, { border: true });
  g.rowHeights[rKilo] = 18;

  // 上方表頭
  const isPackage = model.priceBasis === 'package';
  const H1 = ['編號', '小訂日期', '簽約日期', '戶別', isPackage ? '配套底價(萬)' : '停車位', '姓名', isPackage ? '配套價格(萬)' : '成交價(萬)', '', isPackage ? '配套總價(萬)' : '總成交價(萬)', model.partyALabel, '折數', '折數後總價(萬)', '銷售人員', '團獎人數'];
  if (HAS_H) H1.push(`${group.handoverLabel || model.handoverLabel || '交屋團獎'}\n(暫留不發放)`);
  const hStyle = { sz: st.headerFontSize || 12, bold: true, align: 'center', wrap: true, bg: headerBg, border: true };
  H1.forEach((h, c) => { if (h) g.set(rH1, c, h, hStyle); });
  if (isPackage) {
    g.merge(rH1, 6, rH2, 7);
  } else {
    g.set(rH2, 6, '房價', hStyle); g.set(rH2, 7, '車價', hStyle);
    g.merge(rH1, 6, rH1, 7);
  }
  [0, 1, 2, 3, 4, 5, 8, 9, 10, 11, 12, 13].concat(HAS_H ? [HCOL] : []).forEach(c => g.merge(rH1, c, rH2, c));
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
    const rc = d.refund ? '#C00000' : undefined;   // 退佣列紅字
    g.set(r, 0, d.no, { align: 'center', border: true, color: rc });
    g.set(r, 1, d.sodate, { align: 'center', border: true, color: rc });
    g.set(r, 2, d.sign, { align: 'center', border: true, color: rc });
    g.set(r, 3, d.unit, { align: 'center', border: true, color: rc });
    g.set(r, 4, isPackage ? d.packageFloor : d.park, { align: 'center', border: true, color: rc });
    g.set(r, 5, d.name, { align: 'center', border: true, color: rc });
    g.set(r, 6, d.house || '', { fmt: '#,##0', border: true, color: rc });
    if (isPackage) g.merge(r, 6, r, 7);
    else g.set(r, 7, d.parkP || '', { fmt: '#,##0', border: true, color: rc });
    g.set(r, 8, d.total || '', { fmt: '#,##0', border: true, color: rc });
    g.set(r, 9, d.referral || '', { fmt: '#,##0', border: true, color: rc });
    g.set(r, 10, d.disc || '', { fmt: '0.00', border: true, color: rc });
    g.set(r, 11, d.after || '', { fmt: '#,##0', border: true, color: rc });
    g.set(r, 12, d.sales, { align: 'center', border: true, color: rc });
    g.set(r, 13, d.team || '', { align: 'center', border: true, color: rc });
    if (HAS_H) g.set(r, HCOL, d.handover || '', { fmt: '#,##0', border: true, color: rc });
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
  if (HAS_H) g.set(rTopTotal, HCOL, group.topTotal.handover || '', { fmt: '#,##0', bold: true });
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

  // 表頭列
  g.set(rbH, 0, '銷售日期', hStyle);
  g.merge(rbH, 0, rbH, 1);
  group.left.forEach((a, i) => g.set(rbH, LSTART + i, a.name, hStyle));
  g.set(rbH, RLAB, '項目', hStyle);
  group.right.forEach((a, i) => g.set(rbH, RLAB + 1 + i, a.name, hStyle));
  g.region(rbH, 0, rbH, NC - 1, { bg: headerBg, border: true });

  // 左側標籤（col0-1 合併）
  const leftLabels = [];
  leftLabels[0] = group.saleYM || '';
  leftLabels[1] = `總銷　${money(group.topTotal.after || 0)}`;
  group.mgmtCats.forEach((c, i) => { leftLabels[2 + i] = `${c.label}　${toNum(c.ratePct).toFixed(2)}%`; });
  for (let k = 0; k < preRows; k++) {
    g.set(rRow(k), 0, leftLabels[k] || '', { align: 'center', border: true });
    g.merge(rRow(k), 0, rRow(k), 1);
  }
  const keepPctTxt = uniformKeepPctText(group.left.concat(group.right));
  g.set(rRow(RI.sub), 0, '合計', { bold: true, align: 'center', border: true });
  if (group.isYoufu) g.set(rRow(RI.youfu), 0, group.youfuLabel, { bold: true, align: 'center', border: true });
  g.set(rRow(RI.keep), 0, `保留款${keepPctTxt}`, { align: 'center', border: true });
  g.set(rRow(RI.tax), 0, '稅金', { align: 'center', border: true });
  g.set(rRow(RI.nhi), 0, '二代健保', { align: 'center', border: true });
  g.set(rRow(RI.net), 0, '實發', { align: 'center', border: true });
  g.set(rRow(RI.remark), 0, '備註', { align: 'center', border: true });
  for (let k = RI.sub; k <= RI.remark; k++) g.merge(rRow(k), 0, rRow(k), 1);

  // 左側管理人員金額（100% 呈現；置於其管理類別列）
  group.left.forEach((a, i) => {
    const col = LSTART + i;
    if (a.mgmtAmounts) {
      // 各管理類別金額置於該類別列（左側標籤列 2+k）；另有個獎／團獎者置於 0／1 列
      group.mgmtCats.forEach((c, k) => {
        const v = Math.round(toNum(a.mgmtAmounts[c.key]));
        if (v) g.set(rRow(2 + k), col, v, { fmt: '#,##0', border: true });
      });
      if (Math.round(a.indiv)) g.set(rRow(0), col, Math.round(a.indiv), { fmt: '#,##0', border: true });
      if (Math.round(a.team)) g.set(rRow(1), col, Math.round(a.team), { fmt: '#,##0', border: true });
    } else {
      // 相容舊 model：依職務分類列
      let rowIdx = 2;
      const matchIdx = group.mgmtCats.findIndex(c =>
        (a.mgmtCat === '輔導' && String(c.label).includes('輔導')) ||
        (a.mgmtCat !== '輔導' && String(c.label).includes('主委'))
      );
      if (matchIdx >= 0) rowIdx = 2 + matchIdx;
      g.set(rRow(rowIdx), col, Math.round(a.sub) || '', { fmt: '#,##0', border: true });
    }
    g.set(rRow(RI.sub), col, Math.round(a.sub) || '', { fmt: '#,##0', bold: true, border: true });
    if (group.isYoufu) g.set(rRow(RI.youfu), col, Math.round(a.subDisc) || '', { fmt: '#,##0', bold: true, border: true });
    g.set(rRow(RI.keep), col, (group.isYoufu ? a.keepDisc : a.keep) || '', { fmt: '#,##0', border: true });
    g.set(rRow(RI.tax), col, (group.isYoufu ? a.taxDisc : a.tax) || '', { fmt: '#,##0', border: true });
    g.set(rRow(RI.nhi), col, (group.isYoufu ? a.nhiDisc : a.nhi) || '', { fmt: '#,##0', border: true });
    g.set(rRow(RI.net), col, (group.isYoufu ? a.netDisc : a.net) || '', { fmt: '#,##0', border: true });
    g.set(rRow(RI.remark), col, a.remark || '', { align: 'center', border: true });
  });

  // 右側項目標籤 + 業務人員金額
  group.rightRows.forEach((rr, k) => {
    g.set(rRow(k), RLAB, `${rr.label} ${toNum(rr.ratePct).toFixed(2)}%`, { align: 'center', border: true, sz: 10 });
  });
  g.set(rRow(RI.sub), RLAB, '合計', { bold: true, align: 'center', border: true });
  if (group.isYoufu) g.set(rRow(RI.youfu), RLAB, group.youfuLabel, { bold: true, align: 'center', border: true, sz: 10 });
  g.set(rRow(RI.keep), RLAB, '保留款', { align: 'center', border: true });
  g.set(rRow(RI.tax), RLAB, '稅金', { align: 'center', border: true });
  g.set(rRow(RI.nhi), RLAB, '二代健保', { align: 'center', border: true });
  g.set(rRow(RI.net), RLAB, '實發', { align: 'center', border: true });
  g.set(rRow(RI.remark), RLAB, '備註', { align: 'center', border: true });

  group.right.forEach((a, i) => {
    const col = RLAB + 1 + i;
    group.rightRows.forEach((rr, k) => {
      g.set(rRow(k), col, rr.get(a) || '', { fmt: '#,##0', border: true });
    });
    g.set(rRow(RI.sub), col, Math.round(a.sub) || '', { fmt: '#,##0', bold: true, border: true });
    if (group.isYoufu) g.set(rRow(RI.youfu), col, Math.round(a.subDisc) || '', { fmt: '#,##0', bold: true, border: true });
    g.set(rRow(RI.keep), col, (group.isYoufu ? a.keepDisc : a.keep) || '', { fmt: '#,##0', border: true });
    g.set(rRow(RI.tax), col, (group.isYoufu ? a.taxDisc : a.tax) || '', { fmt: '#,##0', border: true });
    g.set(rRow(RI.nhi), col, (group.isYoufu ? a.nhiDisc : a.nhi) || '', { fmt: '#,##0', border: true });
    g.set(rRow(RI.net), col, (group.isYoufu ? a.netDisc : a.net) || '', { fmt: '#,##0', border: true });
    g.set(rRow(RI.remark), col, a.remark || '', { align: 'center', border: true });
  });

  // 合計列黃底
  g.region(rRow(RI.sub), 0, rRow(RI.sub), NC - 1, { bg: totalBg, bold: true, border: true });
  if (group.isYoufu) g.region(rRow(RI.youfu), 0, rRow(RI.youfu), NC - 1, { bg: totalBg, bold: true, border: true });
  g.region(rb0, 0, rRow(RI.remark), NC - 1, { border: true });

  // 底部合計區
  const GRAND = [
    { label: '實發合計', val: group.grand.net },
    { label: '稅金合計', val: group.grand.tax },
    { label: '二代健保合計', val: group.grand.nhi },
    { label: '獎金總計（實發＋稅金＋二代健保）', val: group.grand.total },
  ];
  GRAND.forEach((it, i) => {
    const r = rGrand0 + i;
    g.set(r, 0, it.label, { sz: 13, bold: true, align: 'center', border: true });
    if (RLAB > 1) g.merge(r, 0, r, RLAB - 1);
    g.set(r, RLAB, it.val, { sz: 14, bold: true, color: st.summaryColor || '#DD0806', fmt: '#,##0', border: true });
    g.region(r, 0, r, RLAB, { border: true });
    g.rowHeights[r] = 28;
  });
  g.region(rGrand0 + GRAND_N - 1, 0, rGrand0 + GRAND_N - 1, RLAB, { bg: totalBg });

  // 人員欄位資訊（即時預覽拖曳排序用；不影響 Excel／PDF）
  // section：top＝上段銷售人員（個獎／團獎兩欄）、left＝下段管理職、right＝下段銷售人員
  const personCols = [];
  group.topPersons.forEach((p, i) => {
    personCols.push({ section: 'top', personKey: p.personKey, name: p.name, c1: FIX + 2 * i, c2: FIX + 2 * i + 1, r1: rH1, r2: rTopTotal });
  });
  group.left.forEach((a, i) => {
    personCols.push({ section: 'left', mgmtCat: a.mgmtCat || '', personKey: a.personKey, name: a.name, c1: LSTART + i, c2: LSTART + i, r1: rbH, r2: rRow(RI.remark) });
  });
  group.right.forEach((a, i) => {
    personCols.push({ section: 'right', personKey: a.personKey, name: a.name, c1: RLAB + 1 + i, c2: RLAB + 1 + i, r1: rbH, r2: rRow(RI.remark) });
  });

  // 可就地編輯的文字格（匯出中心即時預覽；對應請佣設定「文字自訂」）
  const editCells = [
    { r: rKilo, c: 13, key: 'kiloLabel', label: '「千4」標籤' },
    { r: rH1, c: 9, key: 'partyALabel', label: '介紹費欄位 A' },
  ];
  if (group.isYoufu) {
    editCells.push({ r: rRow(RI.youfu), c: 0, key: 'youfuLabelPattern', label: '優付列文字', hint: '{pct}＝請佣比例' });
    editCells.push({ r: rRow(RI.youfu), c: RLAB, key: 'youfuLabelPattern', label: '優付列文字', hint: '{pct}＝請佣比例' });
  }

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
      headerSub: `${toNum(c.ratePct).toFixed(2)}%`,   // 類別比例（建案設定 ratePct，單位 %）
      get: r => r.amounts[c.key], sumGet: t => t.amounts[c.key],
    });
  });
  cols.push({ key: 'subtotal', label: '小計', width: 78, numFmt: '#,##0', sum: true, bold: true, get: r => r.subtotal });
  cols.push({ key: 'keep',     label: '保留款',   width: 70, numFmt: '#,##0', sum: true, get: r => r.keep, sub: r => `${r.keepPct}%` });
  cols.push({ key: 'tax',      label: '稅金',     width: 66, numFmt: '#,##0', sum: true, get: r => r.tax, sub: r => `${r.taxPct}%` });
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
  { key: 'tax',         label: '稅金',     width: 90,  numFmt: '#,##0', get: p => p.tax },
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
        align: c.align || 'right', fmt: c.numFmt, border: true, bold: !!c.bold, wrap: isText,
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
    cols.forEach((c, ci) => g.set(r, ci, c.get(p), { align: c.align || 'right', fmt: c.numFmt, border: true, bold: !!c.bold }));
  });
  const rTotal = rH + 1 + model.periodSummaries.length;
  g.set(rTotal, 0, '合計', { bold: true, align: 'center', border: true, bg: normBg(st.totalRowBg) });
  g.merge(rTotal, 0, rTotal, 1);
  g.set(rTotal, 2, model.rows.length, { bold: true, align: 'right', fmt: '#,##0', border: true, bg: normBg(st.totalRowBg) });
  ['subtotal', 'keep', 'tax', 'nhi', 'net'].forEach((k, i) => {
    g.set(rTotal, 3 + i, toNum(model.totals[k]), { bold: true, align: 'right', fmt: '#,##0', border: true, bg: normBg(st.totalRowBg) });
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
    ['已發還', model.retention.keepPaid],
    ['未發還', model.retention.keepUnpaid],
  ];
  const labStyle = { bold: true, align: 'center', border: true, bg: normBg(st.headerBg) };
  // 版位：欄數足夠時標籤／數值各佔兩欄；否則首個標籤佔兩欄（第 0 欄最窄），其餘各佔一欄
  const wide = NC >= 12;
  const layout = wide
    ? [[0, 1, 2, 3], [4, 5, 6, 7], [8, 9, 10, 11]]           // [labStart, labEnd, valStart, valEnd]
    : [[0, 1, 2, 2], [3, 3, 4, 4], [5, 5, 6, 6]];
  items.forEach(([lab, val], i) => {
    const [l1, l2, v1, v2] = layout[i];
    if (v2 >= NC) return;
    g.set(r, l1, lab, labStyle);
    g.set(r, v1, toNum(val), { bold: true, align: 'right', fmt: '#,##0', border: true, color: i === 2 ? color : undefined });
    if (l2 > l1) { g.region(r, l1, r, l2, labStyle); g.merge(r, l1, r, l2); }
    if (v2 > v1) { g.region(r, v1, r, v2, { border: true }); g.merge(r, v1, r, v2); }
  });
  g.rowHeights[r] = 28;
  return r + 1;
}

/** 個人明細：單張合併 grid（PDF / 預覽） */
const SEC = ['一', '二', '三'];

export function buildPersonGrid(model) {
  const cols = personDetailColumns(model);
  const NC = model.showDetail ? Math.max(cols.length, PERSON_SUMMARY_COLS.length) : PERSON_SUMMARY_COLS.length;
  const rc = personRowCounts(model);
  const nRows = rc.head + (model.showDetail ? rc.detail + rc.spacer : 0) + rc.summary + rc.spacer + rc.retention;
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
  drawPersonRetention(g, r, model, NC, SEC[sec++]);
  return g.toJSON();
}

/** 個人明細：Excel 兩張工作表（彙總 ＋ 每戶明細） */
export function buildPersonExcelGrids(model) {
  const st = model.style || {};
  const base = { fontFamily: st.fontFamily || 'DFKai-SB', sz: st.dataFontSize || 11 };
  const rc = personRowCounts(model);

  // 彙總
  const NC1 = PERSON_SUMMARY_COLS.length;
  const g1 = new Grid('彙總', NC1, rc.head + rc.summary + rc.spacer + rc.retention, base);
  PERSON_SUMMARY_COLS.forEach((c, i) => { g1.cols[i] = c.width; });
  let r = drawPersonHead(g1, 0, model, NC1);
  r = drawPersonSummary(g1, r, model, NC1, '一');
  g1.rowHeights[r] = 14; r += 1;
  drawPersonRetention(g1, r, model, NC1, '二');
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
