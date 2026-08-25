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
        color: c.red ? '#C00000' : undefined,
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
  (model.notes || []).slice(0, 2).forEach((note, ni) => {
    g.set(rNote0 + ni, 1, note, { align: 'left' });
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

  return g.toJSON();
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
  const FIX = 14;
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
  group.topPersons.forEach((p, i) => {
    const col = FIX + 2 * i;
    g.set(rKilo, col, group.indivX || '', { sz: 9, align: 'center', border: true });
    g.set(rKilo, col + 1, group.teamX || '', { sz: 9, align: 'center', border: true });
  });
  if (P > 0) g.region(rKilo, 13, rKilo, 13 + 2 * P, { border: true });
  g.rowHeights[rKilo] = 18;

  // 上方表頭
  const H1 = ['編號', '小訂日期', '簽約日期', '戶別', '停車位', '姓名', '成交價(萬)', '', '總成交價(萬)', model.partyALabel, '折數', '折數後總價(萬)', '銷售人員', '團獎人數'];
  const hStyle = { sz: st.headerFontSize || 12, bold: true, align: 'center', wrap: true, bg: headerBg, border: true };
  H1.forEach((h, c) => { if (h) g.set(rH1, c, h, hStyle); });
  g.set(rH2, 6, '房價', hStyle); g.set(rH2, 7, '車價', hStyle);
  g.merge(rH1, 6, rH1, 7);
  [0, 1, 2, 3, 4, 5, 8, 9, 10, 11, 12, 13].forEach(c => g.merge(rH1, c, rH2, c));
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
    g.set(r, 0, d.no, { align: 'center', border: true });
    g.set(r, 1, d.sodate, { align: 'center', border: true });
    g.set(r, 2, d.sign, { align: 'center', border: true });
    g.set(r, 3, d.unit, { align: 'center', border: true });
    g.set(r, 4, d.park, { align: 'center', border: true });
    g.set(r, 5, d.name, { align: 'center', border: true });
    g.set(r, 6, d.house || '', { fmt: '#,##0', border: true });
    g.set(r, 7, d.parkP || '', { fmt: '#,##0', border: true });
    g.set(r, 8, d.total || '', { fmt: '#,##0', border: true });
    g.set(r, 9, d.referral || '', { fmt: '#,##0', border: true });
    g.set(r, 10, d.disc || '', { fmt: '0.00', border: true });
    g.set(r, 11, d.after || '', { fmt: '#,##0', border: true });
    g.set(r, 12, d.sales, { align: 'center', border: true });
    g.set(r, 13, d.team || '', { align: 'center', border: true });
    group.topPersons.forEach((p, j) => {
      const col = FIX + 2 * j;
      const v = d.pp[p.personKey] || { indiv: 0, team: 0 };
      g.set(r, col, v.indiv || '', { fmt: '#,##0', border: true });
      g.set(r, col + 1, v.team || '', { fmt: '#,##0', border: true });
    });
  });
  if (n > 0) g.region(rData0, 0, rDataEnd, NC - 1, { border: true });

  // 上方合計（黃底）
  g.set(rTopTotal, 0, '合計', { bold: true, align: 'center' });
  g.set(rTopTotal, 8, group.topTotal.total || '', { fmt: '#,##0', bold: true });
  g.set(rTopTotal, 9, group.topTotal.referral || '', { fmt: '#,##0', bold: true });
  g.set(rTopTotal, 11, group.topTotal.after || '', { fmt: '#,##0', bold: true });
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
    let rowIdx = 2;   // 預設第一個管理類別列
    const matchIdx = group.mgmtCats.findIndex(c =>
      (a.mgmtCat === '輔導' && String(c.label).includes('輔導')) ||
      (a.mgmtCat !== '輔導' && String(c.label).includes('主委'))
    );
    if (matchIdx >= 0) rowIdx = 2 + matchIdx;
    g.set(rRow(rowIdx), col, Math.round(a.sub) || '', { fmt: '#,##0', border: true });
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

  return g.toJSON();
}

export function buildBonusGrids(model) {
  return model.groups.map(gr => buildBonusGroupGrid(gr, model));
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
  return ws;
}

export function exportGridsToExcel(grids, fileName) {
  const wb = XLSX.utils.book_new();
  grids.forEach(grid => {
    const safe = String(grid.name || 'Sheet').replace(/[\\/?*[\]:]/g, '').slice(0, 31);
    XLSX.utils.book_append_sheet(wb, gridToWorksheet(grid), safe);
  });
  XLSX.writeFile(wb, `${fileName}.xlsx`);
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
      html += `<td${span} style="${styles.join(';')}">${text}</td>`;
    }
    html += '</tr>';
  }
  html += '</table>';
  return html;
}

function escapeHtml(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\n/g, '<br>');
}
