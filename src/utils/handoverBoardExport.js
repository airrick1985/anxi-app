/**
 * 交屋控管表 — 下載 Excel（依範本版型：標題、更新日期、樓層 × 棟線矩陣、店面排、右側統計與圖例）
 * 規格：docs/SPEC_HandoverControlBoard.md §7
 */
import { shortDate, textColorFor } from './handoverBoard.js';

const FONT = '微軟正黑體';
const BORDER_COLOR = 'C7C7CC';
const HEAD_FILL = 'F2F2F7';

const thin = { style: 'thin', color: { rgb: BORDER_COLOR } };
const BORDER = { top: thin, bottom: thin, left: thin, right: thin };
const rgb = (hex) => String(hex || '#FFFFFF').replace('#', '').toUpperCase();

const style = ({ fill, bold = false, sz = 11, color = '1D1D1F', align = 'center', border = true, wrap = true } = {}) => ({
  font: { name: FONT, sz, bold, color: { rgb: color } },
  alignment: { horizontal: align, vertical: 'center', wrapText: wrap },
  ...(fill ? { fill: { patternType: 'solid', fgColor: { rgb: rgb(fill) } } } : {}),
  ...(border ? { border: BORDER } : {}),
});

const pctText = (n) => `${n}%`;

/**
 * 產生工作表
 * @param {object} XLSX xlsx-js-style 模組
 * @param {object} board buildHandoverBoard() 結果
 * @param {object} opts { projectName, updatedAt: Date }
 */
export function buildHandoverSheet(XLSX, board, { projectName = '', updatedAt = new Date() } = {}) {
  const cells = {}; // 'r,c' -> { v, s }
  const merges = [];
  let maxCol = 0;
  let maxRow = 0;
  const put = (r, c, v, s) => {
    cells[`${r},${c}`] = { v: v ?? '', s };
    if (c > maxCol) maxCol = c;
    if (r > maxRow) maxRow = r;
  };
  const statusLabel = Object.fromEntries(board.statusList.map(s => [s.key, s.label]));
  const statusCell = (unit) => {
    const fill = board.colors[unit.status] || '#FFFFFF';
    const date = unit.nextDate ? `\n${shortDate(unit.nextDate)}` : '';
    return { v: `${statusLabel[unit.status] || ''}${date}`, s: style({ fill, bold: true, sz: 10, color: rgb(textColorFor(fill)) }) };
  };

  const nCols = board.cols.length;
  const lastGridCol = nCols + 1; // 0 = 左樓層、1..n = 棟線、n+1 = 右樓層
  const perRow = Math.max(nCols + 1, 6); // 店面排每列戶數（可用到右側樓層欄，同範本）
  const specialCols = Math.min(board.specialUnits.length, perRow);
  const rightEdge = Math.max(nCols > 0 ? lastGridCol : 0, specialCols);

  // 標題、更新日期
  put(0, 0, `${projectName}-交屋控管表`, style({ bold: true, sz: 16, align: 'left', border: false, wrap: false }));
  put(1, 0, `更新日期：${formatDateTime(updatedAt)}`, style({ sz: 10, color: '6E6E73', align: 'left', border: false, wrap: false }));

  // 棟名表頭
  let r = 3;
  if (board.showTowerHeader) {
    put(r, 0, '', style({ fill: HEAD_FILL }));
    let c = 1;
    for (const tower of board.towers) {
      put(r, c, `${tower.name} 棟`, style({ fill: HEAD_FILL, bold: true }));
      for (let i = 1; i < tower.cols.length; i += 1) put(r, c + i, '', style({ fill: HEAD_FILL }));
      if (tower.cols.length > 1) merges.push({ s: { r, c }, e: { r, c: c + tower.cols.length - 1 } });
      c += tower.cols.length;
    }
    put(r, lastGridCol, '', style({ fill: HEAD_FILL }));
    r += 1;
  }

  // 欄表頭
  if (nCols > 0) {
    put(r, 0, '樓層', style({ fill: HEAD_FILL, bold: true }));
    board.cols.forEach((col, i) => put(r, i + 1, col, style({ fill: HEAD_FILL, bold: true })));
    put(r, lastGridCol, '樓層', style({ fill: HEAD_FILL, bold: true }));
    r += 1;
  }
  const gridStartRow = r;

  // 矩陣
  for (const floor of board.floors) {
    put(r, 0, `${floor}F`, style({ fill: HEAD_FILL, bold: true }));
    board.cols.forEach((col, i) => {
      const unit = board.cellMap[`${floor}|${col}`];
      if (unit) {
        const cell = statusCell(unit);
        put(r, i + 1, cell.v, cell.s);
      } else {
        put(r, i + 1, '', style({ border: false }));
      }
    });
    put(r, lastGridCol, `${floor}F`, style({ fill: HEAD_FILL, bold: true }));
    r += 1;
  }

  // 店面／其他：每排最多與矩陣同欄數，戶號一列、狀態一列
  if (board.specialUnits.length > 0) {
    if (board.floors.length > 0) r += 1;
    for (let start = 0; start < board.specialUnits.length; start += perRow) {
      const chunk = board.specialUnits.slice(start, start + perRow);
      put(r, 0, start === 0 ? board.specialLabel : '', style({ fill: HEAD_FILL, bold: true }));
      put(r + 1, 0, '', style({ fill: HEAD_FILL }));
      if (start === 0) merges.push({ s: { r, c: 0 }, e: { r: r + 1, c: 0 } });
      chunk.forEach((unit, i) => {
        put(r, i + 1, unit.unitId, style({ fill: HEAD_FILL, bold: true }));
        const cell = statusCell(unit);
        put(r + 1, i + 1, cell.v, cell.s);
      });
      r += 2;
    }
  }
  const gridEndRow = r - 1;

  // 右側統計
  const sc = rightEdge + 2;
  const s = board.stats;
  let sr = 3;
  const statHead = (label) => {
    put(sr, sc, label, style({ fill: HEAD_FILL, bold: true, align: 'left' }));
    put(sr, sc + 1, '戶數', style({ fill: HEAD_FILL, bold: true }));
    put(sr, sc + 2, '百分比', style({ fill: HEAD_FILL, bold: true }));
    sr += 1;
  };
  const statRow = (label, count, percent) => {
    put(sr, sc, label, style({ align: 'left' }));
    put(sr, sc + 1, count, style({ bold: true }));
    put(sr, sc + 2, percent === undefined ? '' : pctText(percent), style({ color: '6E6E73' }));
    sr += 1;
  };

  put(sr, sc, '總戶數', style({ fill: HEAD_FILL, bold: true, align: 'left' }));
  put(sr, sc + 1, s.total, style({ bold: true }));
  put(sr, sc + 2, '戶', style({ color: '6E6E73' }));
  sr += 2;

  statHead('銷售');
  statRow('已售戶', s.sold, s.soldPct);
  statRow('未售戶', s.unsold, s.unsoldPct);
  sr += 1;

  statHead('進度（占已售）');
  statRow(s.hasInspection ? '已售未驗' : '已售未開始', s.pending, s.pendingPct);
  if (s.hasInspection) statRow('已驗戶', s.inspected, s.inspectedPct);
  statRow('交屋戶數', s.handedOver, s.handedOverPct);
  sr += 1;

  statHead('各項目');
  for (const st of s.stageStats) {
    statRow(`已${st.label}`, st.done, st.donePct);
    if (!st.virtual) statRow(`已約${st.label}`, st.booked);
  }

  if (s.extra.length > 0) {
    sr += 1;
    statHead('其他');
    for (const ex of s.extra) statRow(ex.label, ex.count, s.total > 0 ? Math.round((ex.count / s.total) * 1000) / 10 : 0);
  }

  // 圖例
  sr += 1;
  put(sr, sc, '圖例', style({ fill: HEAD_FILL, bold: true, align: 'left' }));
  put(sr, sc + 1, '戶數', style({ fill: HEAD_FILL, bold: true }));
  sr += 1;
  for (const st of board.statusList) {
    const fill = board.colors[st.key];
    put(sr, sc, st.label, style({ fill, bold: true, color: rgb(textColorFor(fill)) }));
    put(sr, sc + 1, s.statusCounts[st.key] || 0, style({}));
    sr += 1;
  }

  // 組工作表
  const rows = Math.max(maxRow, sr) + 1;
  const ws = {};
  for (let rr = 0; rr < rows; rr += 1) {
    for (let cc = 0; cc <= maxCol; cc += 1) {
      const cell = cells[`${rr},${cc}`];
      if (!cell) continue;
      const addr = XLSX.utils.encode_cell({ r: rr, c: cc });
      ws[addr] = { v: cell.v, t: typeof cell.v === 'number' ? 'n' : 's', s: cell.s };
    }
  }
  ws['!ref'] = XLSX.utils.encode_range({ s: { r: 0, c: 0 }, e: { r: rows - 1, c: maxCol } });
  ws['!merges'] = merges;
  const cols = [];
  for (let cc = 0; cc <= maxCol; cc += 1) {
    if (cc === 0 || (nCols > 0 && cc === lastGridCol)) cols.push({ wch: 7 });
    else if (cc <= rightEdge) cols.push({ wch: 10 });
    else if (cc === sc) cols.push({ wch: 16 });
    else if (cc > sc) cols.push({ wch: 9 });
    else cols.push({ wch: 3 });
  }
  ws['!cols'] = cols;
  const rowsMeta = [];
  for (let rr = 0; rr < rows; rr += 1) {
    rowsMeta.push(rr >= gridStartRow && rr <= gridEndRow ? { hpt: 30 } : { hpt: 20 });
  }
  rowsMeta[0] = { hpt: 26 };
  ws['!rows'] = rowsMeta;
  return ws;
}

export function formatDateTime(d) {
  const x = d instanceof Date ? d : new Date(d);
  const p = (n) => String(n).padStart(2, '0');
  return `${x.getFullYear()}/${p(x.getMonth() + 1)}/${p(x.getDate())} ${p(x.getHours())}:${p(x.getMinutes())}`;
}

/** 下載 Excel（動態載入 xlsx-js-style，避免一進頁面就載入） */
export async function downloadHandoverExcel(board, { projectName = '', updatedAt = new Date() } = {}) {
  const mod = await import('xlsx-js-style');
  const XLSX = mod.utils ? mod : mod.default; // CommonJS 互通：API 可能在 default 底下
  const ws = buildHandoverSheet(XLSX, board, { projectName, updatedAt });
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, '交屋進度控管表');
  const d = updatedAt instanceof Date ? updatedAt : new Date();
  const p = (n) => String(n).padStart(2, '0');
  XLSX.writeFile(wb, `${projectName || '建案'}_交屋控管表_${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}.xlsx`);
}
