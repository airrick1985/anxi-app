/**
 * 面積找補 — 單據版面（畫面預覽、複製圖片、PDF 共用同一份 HTML）與 Excel 一覽表
 * 版面照原 Google Apps Script「面積找補UI」的 A4 分戶坪數表。
 */
import { renderHtmlToPngBlob, PNG_FONT_FAMILY } from './htmlToPng.js';
import {
  areaFileName, fmtFixed, fmtMoney, fmtPct, fmtWan,
} from './areaSettlement.js';

export const SHEET_WIDTH = 794; // A4 寬（96dpi）

const esc = (s) => String(s ?? '').replace(/[&<>"']/g, ch =>
  ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[ch]);

/** 單據樣式（全部限定在 .as-page 內；畫面與圖片共用） */
export const AREA_SHEET_CSS = `
.as-page{width:${SHEET_WIDTH}px;padding:40px 44px 44px;background:#fff;color:#000}
.as-sheet{width:100%;border-collapse:collapse;table-layout:fixed;border:1.5px solid #000;
font-family:${PNG_FONT_FAMILY};font-size:13px;color:#000;font-variant-numeric:tabular-nums}
.as-sheet td{height:34px;padding:4px 3px;border:1px solid #000;text-align:center;vertical-align:middle;line-height:1.3;word-break:break-all}
.as-sheet .as-title td{height:56px;font-size:22px;font-weight:600;letter-spacing:.3em;text-indent:.3em}
.as-sheet .as-meta td{height:40px;border-left:0;border-right:0;text-align:left;font-size:14px;padding-left:8px}
.as-sheet .as-gap td{height:18px;border-left:0;border-right:0}
.as-sheet .as-hd td{height:auto;padding:7px 3px}
.as-sheet .as-foot td{height:auto;padding:10px 8px;text-align:left;font-weight:700;line-height:1.5}
.as-sheet .b{font-weight:700}
.as-sheet .red{color:#e0001b}
.as-sheet .diag{background:linear-gradient(to top right,transparent calc(50% - .7px),#000 50%,transparent calc(50% + .7px))}
`;

/**
 * 單據 HTML
 * @param {object|null} u buildAreaUnits() 的一戶（null = 空白單據）
 * @param {object} s resolveAreaSettings() 結果
 * @param {object} opts
 * @param {boolean} [opts.editable] 畫面預覽：可點擊修改的格子加上 data-edit
 */
export function buildAreaSheetHtml(u, s, { editable = false } = {}) {
  const c = u?.calc || null;
  const rows = c ? c.rows : [null, null, null];

  // 可修改的格子：data-edit = 戶別欄位 key；「@」開頭為建案設定
  const cell = (content, { edit = '', cls = '', attrs = '' } = {}) => {
    const classes = [cls];
    let data = '';
    if (editable && edit && u) {
      classes.push('ed');
      if (content === '') classes.push('ed-empty');
      data = ` data-edit="${esc(edit)}"`;
    }
    const klass = classes.filter(Boolean).join(' ');
    return `<td${klass ? ` class="${klass}"` : ''}${data}${attrs ? ` ${attrs}` : ''}>${content}</td>`;
  };
  const sqm = (x) => fmtFixed(x, 2);
  const names = ['主建物', '附屬建物(陽台)', '公設'];
  const parts = ['Main', 'Balcony', 'Common'];
  const partKey = ['main', 'balcony', 'common'];
  const widths = [18, 12, 12.5, 11.5, 10.5, 11, 12, 12.5];

  const titleCell = editable
    ? `<td colspan="8" class="ed" data-edit="@title">${esc(s.displayTitle)}</td>`
    : `<td colspan="8">${esc(s.displayTitle)}</td>`;

  const itemRows = rows.map((r, i) => {
    const pre = u ? u.contract[partKey[i]] : null;
    const deed = u ? u.deed[partKey[i]] : null;
    return `<tr>
      <td>${names[i]}</td>
      ${cell(sqm(pre), { edit: `areaSettleContract${parts[i]}` })}
      ${cell(sqm(deed), { edit: `areaSettleDeed${parts[i]}` })}
      <td class="b${r && r.diff < 0 ? ' red' : ''}">${r ? sqm(r.diff) : ''}</td>
      <td class="b">${r ? fmtWan(r.price, 1) : ''}</td>
      <td class="b${r && r.amount < 0 ? ' red' : ''}">${r ? fmtMoney(r.amount) : ''}</td>
      <td>${r ? fmtMoney(r.unit) : ''}</td>
      <td>${r ? sqm(r.cap) : ''}</td>
    </tr>`;
  }).join('');

  const capText = fmtPct(s.capPct).replace('%', '');
  return `<div class="as-page"><table class="as-sheet">
    <colgroup>${widths.map(w => `<col style="width:${w}%">`).join('')}</colgroup>
    <tr class="as-title">${titleCell}</tr>
    <tr class="as-meta">
      <td>戶　號：</td><td class="red b">${u ? esc(u.unitId) : ''}</td><td></td>
      <td colspan="5">產權名義人：${u ? esc(u.name) : ''}</td>
    </tr>
    <tr class="as-gap"><td colspan="8"></td></tr>
    <tr class="as-hd">
      <td rowspan="2">建物標示</td><td rowspan="2">建號</td>
      <td rowspan="2">主建物面積<br>(㎡)</td><td rowspan="2">陽台面積<br>(㎡)</td>
      <td rowspan="2" colspan="2">權利範圍</td><td rowspan="2">持分面積<br>(㎡)</td>
      <td>房屋總面積<br>(㎡)</td>
    </tr>
    <tr><td class="b">${c ? sqm(c.total) : ''}</td></tr>
    <tr>
      ${cell(u ? esc(u.address) : '', { edit: 'address' })}
      ${cell(u ? esc(u.buildNo) : '', { edit: 'areaSettleBuildNo' })}
      ${cell(u ? sqm(u.deed.main) : '', { edit: 'areaSettleDeedMain' })}
      ${cell(u ? sqm(u.deed.balcony) : '', { edit: 'areaSettleDeedBalcony' })}
      <td colspan="2">全部</td>
      <td>${c ? sqm(c.own) : ''}</td>
      <td>約<br>(坪)</td>
    </tr>
    <tr>
      <td>公設</td><td></td>
      ${editable ? `<td class="ed${s.publicArea ? '' : ' ed-empty'}" data-edit="@publicArea">${sqm(s.publicArea)}</td>` : `<td>${sqm(s.publicArea)}</td>`}
      <td class="diag"></td>
      ${cell(u && u.share !== null ? esc(String(u.share)) : '', { edit: 'areaSettleShare' })}
      ${editable ? `<td class="ed" data-edit="@shareDen">/${esc(String(s.shareDen))}</td>` : `<td>/${esc(String(s.shareDen))}</td>`}
      ${cell(u ? sqm(u.deed.common) : '', { edit: 'areaSettleDeedCommon' })}
      <td class="b">${c ? fmtFixed(c.ping, 2) : ''}</td>
    </tr>
    <tr class="as-gap"><td colspan="8"></td></tr>
    <tr class="as-hd">
      <td>說明</td><td>預售合約<br>(㎡)</td><td>地政權狀<br>(㎡)</td><td>地政-合約<br>差異<br>(㎡)</td>
      <td>合約<br>價款<br>(萬)</td><td>找補<br>金額<br>(元)</td><td>找補<br>單價<br>(元)</td><td>上限</td>
    </tr>
    ${itemRows}
    <tr>
      <td>合計</td><td>${c ? sqm(c.sum.pre) : ''}</td><td>${c ? sqm(c.sum.deed) : ''}</td><td></td>
      <td class="b">${c ? fmtWan(c.sum.price, 1) : ''}</td>
      <td class="b${c && c.sum.amount < 0 ? ' red' : ''}">${c ? fmtMoney(c.sum.amount) : ''}</td><td></td><td></td>
    </tr>
    <tr>
      <td></td><td></td><td></td><td></td><td></td>
      <td class="b red">${c ? fmtMoney(c.pay) : ''}</td><td></td>
      <td>${fmtPct(s.payPct)}</td>
    </tr>
    <tr class="as-foot"><td colspan="8">*主建物單價*坪數差異(上限百分之${capText})+附屬建物單價*坪數差異(上限百分之${capText})+公設單價*坪數差異(上限百分之${capText})</td></tr>
  </table></div>`;
}

/** 單據 → PNG（瀏覽器原生排版） */
export function renderAreaSheetPng(u, s, { scale = 2 } = {}) {
  return renderHtmlToPngBlob(buildAreaSheetHtml(u, s), { width: SHEET_WIDTH, scale, css: AREA_SHEET_CSS });
}

async function blobToJpegDataUrl(blob, quality = 0.92) {
  const url = URL.createObjectURL(blob);
  try {
    const img = await new Promise((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error('圖片讀取失敗'));
      el.src = url;
    });
    const canvas = document.createElement('canvas');
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0);
    return { dataUrl: canvas.toDataURL('image/jpeg', quality), w: canvas.width, h: canvas.height };
  } finally {
    URL.revokeObjectURL(url);
  }
}

/**
 * 下載 PDF（A4 直式，每戶一頁）
 * @param {Array} units 要輸出的戶別（需有 calc）
 * @param {object} s 設定
 * @param {object} opts { projectName, onProgress(done, total), isCancelled() }
 * @returns {Promise<boolean>} 是否完成（取消時回傳 false）
 */
export async function downloadAreaPdf(units, s, { projectName = '', onProgress, isCancelled } = {}) {
  const { jsPDF } = await import('jspdf');
  const pdf = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait', compress: true });
  const pageW = 210;
  const pageH = 297;
  for (let i = 0; i < units.length; i += 1) {
    if (isCancelled?.()) return false;
    const png = await renderAreaSheetPng(units[i], s);
    const { dataUrl, w, h } = await blobToJpegDataUrl(png);
    if (i > 0) pdf.addPage('a4', 'portrait');
    const imgH = pageW * h / w;
    pdf.addImage(dataUrl, 'JPEG', 0, 0, pageW, Math.min(imgH, pageH), undefined, 'FAST');
    onProgress?.(i + 1, units.length);
  }
  pdf.save(areaFileName(projectName, units.length === 1 ? units[0] : null, 'pdf'));
  return true;
}

// ───────────── Excel 一覽表 ─────────────

const FONT = '微軟正黑體';
const thin = { style: 'thin', color: { rgb: 'BFBFC4' } };
const BORDER = { top: thin, bottom: thin, left: thin, right: thin };
const xs = ({ bold = false, sz = 11, color = '1D1D1F', fill = '', align = 'center', fmt = '' } = {}) => ({
  font: { name: FONT, sz, bold, color: { rgb: color } },
  alignment: { horizontal: align, vertical: 'center', wrapText: true },
  border: BORDER,
  ...(fill ? { fill: { patternType: 'solid', fgColor: { rgb: fill } } } : {}),
  ...(fmt ? { numFmt: fmt } : {}),
});
const FMT_SQM = '0.00;[Red]-0.00';
const FMT_WAN = '#,##0.0;[Red]-#,##0.0';
const FMT_YUAN = '#,##0;[Red]-#,##0';

const ITEM_NAMES = ['主建物', '陽台', '公設'];
const ITEM_KEYS = ['main', 'balcony', 'common'];
const ITEM_COLS = [
  { label: '合約(㎡)', fmt: FMT_SQM, get: (u, i) => u.contract[ITEM_KEYS[i]] },
  { label: '權狀(㎡)', fmt: FMT_SQM, get: (u, i) => u.deed[ITEM_KEYS[i]] },
  { label: '差異(㎡)', fmt: FMT_SQM, get: (u, i) => u.calc?.rows[i].diff },
  { label: '價款(萬)', fmt: FMT_WAN, get: (u, i) => u.calc?.rows[i].price },
  { label: '單價(元)', fmt: FMT_YUAN, get: (u, i) => u.calc?.rows[i].unit },
  { label: '找補(元)', fmt: FMT_YUAN, get: (u, i) => u.calc?.rows[i].amount },
];
const LEAD_COLS = [
  { label: '戶號', w: 10, get: u => u.unitId, align: 'center' },
  { label: '棟別', w: 7, get: u => u.group, align: 'center' },
  { label: '產權名義人', w: 12, get: u => u.name, align: 'left' },
  { label: '門牌', w: 24, get: u => u.address, align: 'left' },
  { label: '建號', w: 10, get: u => u.buildNo, align: 'center' },
  { label: '房地總價(元)', w: 14, get: u => u.totalPrice, fmt: FMT_YUAN },
  { label: '車位價(元)', w: 12, get: u => u.parkingPrice, fmt: FMT_YUAN },
  { label: '房屋價款(萬)', w: 12, get: u => u.calc?.sum.price, fmt: FMT_WAN },
];
const TAIL_COLS = [
  { label: '找補合計(元)', w: 13, get: u => u.calc?.sum.amount, fmt: FMT_YUAN, bold: true },
  { label: '實收(元)', w: 12, get: u => u.calc?.pay, fmt: FMT_YUAN, bold: true },
  { label: '房屋總面積(㎡)', w: 12, get: u => u.calc?.total, fmt: FMT_SQM },
  { label: '約(坪)', w: 9, get: u => u.calc?.ping, fmt: FMT_SQM },
  { label: '找補備註', w: 20, get: u => u.note, align: 'left' },
  { label: '資料不足', w: 20, get: u => (u.missing.length ? `缺：${u.missing.join('、')}` : ''), align: 'left', color: 'C2410C' },
];

const fmtStamp = (d) => {
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}/${p(d.getMonth() + 1)}/${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;
};

/** 一覽表工作表（XLSX = xlsx-js-style 模組） */
export function buildAreaListSheet(XLSX, units, s, { projectName = '', exportedAt = new Date() } = {}) {
  const nCols = LEAD_COLS.length + ITEM_NAMES.length * ITEM_COLS.length + TAIL_COLS.length;
  const ws = {};
  const merges = [];
  const put = (r, c, v, style, fmt) => {
    const ref = XLSX.utils.encode_cell({ r, c });
    const isNum = typeof v === 'number' && Number.isFinite(v);
    ws[ref] = { v: v === null || v === undefined ? '' : v, t: isNum ? 'n' : 's', s: style };
    if (isNum && fmt) ws[ref].z = fmt;
  };

  // 標題
  put(0, 0, `${projectName} 面積找補一覽`, { font: { name: FONT, sz: 15, bold: true }, alignment: { horizontal: 'left', vertical: 'center' } });
  merges.push({ s: { r: 0, c: 0 }, e: { r: 0, c: nCols - 1 } });
  put(1, 0, `匯出 ${fmtStamp(exportedAt)}　房屋價款比例 ${fmtPct(s.buildingPct)}　陽台公設折算 ${s.sideRatio}　找補上限 ${fmtPct(s.capPct)}　實收 ${fmtPct(s.payPct)}`,
    { font: { name: FONT, sz: 10, color: { rgb: '6E6E73' } }, alignment: { horizontal: 'left', vertical: 'center' } });
  merges.push({ s: { r: 1, c: 0 }, e: { r: 1, c: nCols - 1 } });

  // 表頭（兩列）
  const H1 = 2;
  const H2 = 3;
  const head = xs({ bold: true, fill: 'F2F2F7' });
  let col = 0;
  const lead = (list) => {
    for (const def of list) {
      put(H1, col, def.label, head);
      put(H2, col, '', head);
      merges.push({ s: { r: H1, c: col }, e: { r: H2, c: col } });
      col += 1;
    }
  };
  lead(LEAD_COLS);
  ITEM_NAMES.forEach((name) => {
    put(H1, col, name, head);
    merges.push({ s: { r: H1, c: col }, e: { r: H1, c: col + ITEM_COLS.length - 1 } });
    ITEM_COLS.forEach((def, j) => {
      if (j > 0) put(H1, col + j, '', head);
      put(H2, col + j, def.label, head);
    });
    col += ITEM_COLS.length;
  });
  lead(TAIL_COLS);

  // 資料列
  let r = H2 + 1;
  for (const u of units) {
    const dim = !u.calc;
    const base = { color: dim ? '8E8E93' : '1D1D1F' };
    col = 0;
    for (const def of LEAD_COLS) {
      put(r, col, def.get(u) ?? '', xs({ ...base, align: def.align || 'right', fmt: def.fmt }), def.fmt);
      col += 1;
    }
    ITEM_NAMES.forEach((_, i) => {
      ITEM_COLS.forEach((def) => {
        put(r, col, def.get(u, i) ?? '', xs({ ...base, align: 'right', fmt: def.fmt }), def.fmt);
        col += 1;
      });
    });
    for (const def of TAIL_COLS) {
      put(r, col, def.get(u) ?? '', xs({ ...base, bold: !!def.bold, color: def.color || base.color, align: def.align || 'right', fmt: def.fmt }), def.fmt);
      col += 1;
    }
    r += 1;
  }

  // 合計列
  const ready = units.filter(u => u.calc);
  const total = xs({ bold: true, fill: 'FAFAFC', align: 'right' });
  for (let c = 0; c < nCols; c += 1) put(r, c, '', total);
  put(r, 0, `合計（${ready.length} 戶）`, xs({ bold: true, fill: 'FAFAFC', align: 'left' }));
  merges.push({ s: { r, c: 0 }, e: { r, c: LEAD_COLS.length - 1 } });
  ITEM_NAMES.forEach((_, i) => {
    const c = LEAD_COLS.length + i * ITEM_COLS.length + ITEM_COLS.length - 1;
    put(r, c, ready.reduce((sum, u) => sum + u.calc.rows[i].amount, 0), xs({ bold: true, fill: 'FAFAFC', align: 'right', fmt: FMT_YUAN }), FMT_YUAN);
  });
  const tail0 = LEAD_COLS.length + ITEM_NAMES.length * ITEM_COLS.length;
  put(r, tail0, ready.reduce((sum, u) => sum + u.calc.sum.amount, 0), xs({ bold: true, fill: 'FAFAFC', align: 'right', fmt: FMT_YUAN }), FMT_YUAN);
  put(r, tail0 + 1, ready.reduce((sum, u) => sum + u.calc.pay, 0), xs({ bold: true, fill: 'FAFAFC', align: 'right', fmt: FMT_YUAN }), FMT_YUAN);

  ws['!ref'] = XLSX.utils.encode_range({ s: { r: 0, c: 0 }, e: { r, c: nCols - 1 } });
  ws['!merges'] = merges;
  ws['!cols'] = [
    ...LEAD_COLS.map(d => ({ wch: d.w })),
    ...ITEM_NAMES.flatMap(() => ITEM_COLS.map(() => ({ wch: 10 }))),
    ...TAIL_COLS.map(d => ({ wch: d.w })),
  ];
  const rowsMeta = [{ hpt: 26 }, { hpt: 18 }, { hpt: 22 }, { hpt: 22 }];
  for (let i = H2 + 1; i <= r; i += 1) rowsMeta.push({ hpt: 20 });
  ws['!rows'] = rowsMeta;
  return ws;
}

/** 下載 Excel 一覽表（動態載入 xlsx-js-style） */
export async function downloadAreaExcel(units, s, { projectName = '', exportedAt = new Date() } = {}) {
  const mod = await import('xlsx-js-style');
  const XLSX = mod.utils ? mod : mod.default;
  const ws = buildAreaListSheet(XLSX, units, s, { projectName, exportedAt });
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, '面積找補');
  XLSX.writeFile(wb, areaFileName(projectName, null, 'xlsx'));
}

/** 複製／下載圖片的檔名 */
export const areaImageFileName = (projectName, u) => areaFileName(projectName, u, 'png');
