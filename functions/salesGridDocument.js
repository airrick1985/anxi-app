/**
 * 銷控網格下載 PDF 產製模組（docs/銷控網格下載PDF-spec.md §4~§5）
 *
 * doc payload（由前端 SalesGridDownloadDialog.vue 以 salesGridLayout.js 算好，pt 單位）：
 * {
 *   projectName, titleSuffix,        // titleSuffix: '' 或 '（店面）'
 *   generatedAt,                     // '2026年8月22日 14:30'（前端台灣時間組好）
 *   priceModeLabel,                  // '表價' | '底價' | '成交價'
 *   layout: { paperW, paperH, margin, headerH, legendH, legendRowH,
 *             floorHeaderW, buildingHeaderH, cellW, cellH, gapX, gapY,
 *             gridLeft, gridTop, scale,
 *             fonts: { title, meta, header, unitName, total, sub, sold, legend } },
 *   legend: [ { statusName, colorCode } ],
 *   pages: [ { pageNo, totalPages, buildings:[], floors:[],
 *              cells: [ { empty:true } |
 *                       { unitId, bgColor, soldOnly, hasTerrace,
 *                         tags: [ { text, bgColor, textColor } ],   // 文字標籤（右上角 chip，最多畫 2 個 + '+N'，可省略）
 *                         lines: { total,       // 總價（紅色粗體、無「萬」）
 *                                  breakdown,   // 露臺戶拆分「房屋+露臺」（如 '1,100+134'，可省略）
 *                                  area, unit } } ] } ]   // cells 依 floor×building 攤平
 * }
 *
 * 後端信任前端 page plan 照畫不重算（僅做色碼/數值防呆）。
 */

const PDFDocument = require("pdfkit");
const path = require("path");

const FONT_REGULAR = path.join(__dirname, "assets", "fonts", "NotoSansTC-Regular.otf");
const FONT_BOLD = path.join(__dirname, "assets", "fonts", "NotoSansTC-Bold.otf");

const HEADER_BG = "#f5f5f5";
const CELL_STROKE = "#d0d0d0";
const EMPTY_BG = "#e9ecef";
const EMPTY_STROKE = "#e0e0e0";
const SOLD_RED = "#d32f2f";
const TOTAL_RED = "#C00000";
const TERRACE_GREEN = "#2e7d32";
const TEXT_DARK = "#212121";
const TEXT_GRAY = "#555555";
const TAG_MORE_BG = "#eceff1";
const TAG_MORE_TEXT = "#455a64";
const TAG_DEFAULT_BG = "#607D8B";

// 文字標籤帶尺寸（畫面 px 基準，乘 scale；與前端 SalesGridDownloadDialog.vue 同值）
const TAG_STRIP_TOP = 2;
const TAG_CHIP_H = 13;
const TAG_MAX_W = 48;
const TAG_PAD_X = 4;
const TAG_GAP = 2;
const TAG_TOP_INSET = 16;
const TAG_MAX_SHOWN = 2;

/** 色碼防呆：非合法 hex 一律回退 */
function safeColor(color, fallback) {
  return (typeof color === "string" && /^#[0-9a-fA-F]{3,8}$/.test(color)) ? color : fallback;
}

function num(v, fallback = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

/** 圖例 item 估寬（與 src/utils/salesGridLayout.js estimateLegend 同公式，確保換行一致） */
function legendItemWidth(name, fontSize) {
  return 10 + 4 + String(name || "").length * fontSize + 14;
}

/** 圖例分行（依估寬，與前端一致） */
function groupLegendRows(legend, contentW, fontSize) {
  const rows = [];
  let line = [];
  let lineW = 0;
  for (const item of legend) {
    const w = legendItemWidth(item.statusName, fontSize);
    if (lineW + w > contentW && line.length > 0) {
      rows.push({ items: line, width: lineW });
      line = [];
      lineW = 0;
    }
    line.push(item);
    lineW += w;
  }
  if (line.length > 0) rows.push({ items: line, width: lineW });
  return rows;
}

/** 單行置中文字（不換行） */
function centeredText(pdf, text, x, y, w, fontSize, font, color) {
  pdf.font(font).fontSize(fontSize).fillColor(color);
  pdf.text(String(text), x, y, { width: w, align: "center", lineBreak: false });
}

/** 文字超過 maxW 時截斷加「…」（需先設定 font/fontSize） */
function fitText(pdf, text, maxW) {
  let s = String(text ?? "");
  if (pdf.widthOfString(s) <= maxW) return s;
  while (s.length > 1 && pdf.widthOfString(s + "…") > maxW) s = s.slice(0, -1);
  return s + "…";
}

/**
 * 文字標籤帶：格子右上角由右往左排 chip，最多 TAG_MAX_SHOWN 個 + '+N'。
 * 露臺綠點在時右邊界內縮讓開。
 */
function drawTagStrip(pdf, cell, x, y, cellW, scale, fTag) {
  const tags = (Array.isArray(cell.tags) ? cell.tags : []).filter(t => t && String(t.text || "").trim());
  if (tags.length === 0) return;

  const chipH = TAG_CHIP_H * scale;
  const padX = TAG_PAD_X * scale;
  const gap = TAG_GAP * scale;
  const maxChipW = TAG_MAX_W * scale;
  const stripY = y + TAG_STRIP_TOP * scale;
  const leftLimit = x + 3 * scale;
  let rightX = x + cellW - (cell.hasTerrace ? 11 : 3) * scale;

  // 顯示順序：tag1 tag2 +N（靠右對齊）→ 由右往左畫：+N, tag2, tag1
  const items = [];
  const shown = tags.slice(0, TAG_MAX_SHOWN);
  if (tags.length > TAG_MAX_SHOWN) {
    items.push({ text: `+${tags.length - TAG_MAX_SHOWN}`, bg: TAG_MORE_BG, color: TAG_MORE_TEXT, noClip: true });
  }
  for (let i = shown.length - 1; i >= 0; i--) {
    const t = shown[i];
    items.push({
      text: String(t.text).trim(),
      bg: safeColor(t.bgColor, TAG_DEFAULT_BG),
      color: safeColor(t.textColor, "#FFFFFF"),
    });
  }

  pdf.font("TC-Bold").fontSize(fTag);
  for (const item of items) {
    const label = item.noClip ? item.text : fitText(pdf, item.text, maxChipW - padX * 2);
    const chipW = Math.min(pdf.widthOfString(label) + padX * 2, item.noClip ? Infinity : maxChipW);
    const chipX = rightX - chipW;
    if (chipX < leftLimit) break; // 放不下就不畫（避免壓到左側）
    pdf.roundedRect(chipX, stripY, chipW, chipH, chipH / 2).fill(item.bg);
    pdf.font("TC-Bold").fontSize(fTag).fillColor(item.color);
    pdf.text(label, chipX, stripY + (chipH - fTag) / 2 - fTag * 0.08, { width: chipW, align: "center", lineBreak: false });
    rightX = chipX - gap;
  }
}

function drawPage(pdf, docData, page) {
  const L = docData.layout;
  const margin = num(L.margin, 28);
  const paperW = num(L.paperW);
  const paperH = num(L.paperH);
  const contentW = paperW - margin * 2;
  const fonts = L.fonts || {};
  const fTitle = num(fonts.title, 13);
  const fMeta = num(fonts.meta, 9);
  const fHeader = num(fonts.header, 10);
  const fUnit = num(fonts.unitName, 10);
  const fTotal = num(fonts.total, 9);
  const fSub = num(fonts.sub, 8);
  const fSold = num(fonts.sold, 9);
  const fTag = num(fonts.tag, 7);
  const fLegend = num(fonts.legend, 9);

  const cellW = num(L.cellW);
  const cellH = num(L.cellH);
  const gapX = num(L.gapX);
  const gapY = num(L.gapY);
  const floorHeaderW = num(L.floorHeaderW, 28);
  const buildingHeaderH = num(L.buildingHeaderH, 18);
  const gridLeft = num(L.gridLeft, margin);
  const gridTop = num(L.gridTop, margin + 30);
  const scale = num(L.scale, 1);

  const colX = (j) => gridLeft + floorHeaderW + gapX + j * (cellW + gapX);
  const rowY = (i) => gridTop + buildingHeaderH + gapY + i * (cellH + gapY);

  /* ---------- 頁首 ---------- */
  const title = `${docData.projectName || ""}${docData.titleSuffix || ""} 銷控表`;
  pdf.font("TC-Bold").fontSize(fTitle).fillColor(TEXT_DARK);
  pdf.text(title, margin, margin + (num(L.headerH, 30) - fTitle) / 2 - 2, { width: contentW * 0.45, lineBreak: false });

  pdf.font("TC").fontSize(fMeta).fillColor(TEXT_GRAY);
  const metaY = margin + (num(L.headerH, 30) - fMeta) / 2 - 1;
  if (docData.priceModeLabel) { // 報價模式傳空字串 → 整欄省略
    pdf.text(`價格：${docData.priceModeLabel}`, margin + contentW * 0.45, metaY, {
      width: contentW * 0.15, align: "center", lineBreak: false,
    });
  }
  pdf.text(`${docData.generatedAt || ""}　第 ${page.pageNo} / ${page.totalPages} 頁`, margin + contentW * 0.6, metaY, {
    width: contentW * 0.4, align: "right", lineBreak: false,
  });

  /* ---------- 棟別表頭列 ---------- */
  page.buildings.forEach((building, j) => {
    const x = colX(j);
    pdf.rect(x, gridTop, cellW, buildingHeaderH).fill(HEADER_BG);
    centeredText(pdf, building, x, gridTop + (buildingHeaderH - fHeader) / 2, cellW, fHeader, "TC-Bold", TEXT_DARK);
  });

  /* ---------- 樓層表頭欄 ---------- */
  page.floors.forEach((floor, i) => {
    const y = rowY(i);
    pdf.rect(gridLeft, y, floorHeaderW, cellH).fill(HEADER_BG);
    centeredText(pdf, `${floor}F`, gridLeft, y + (cellH - fHeader) / 2, floorHeaderW, fHeader, "TC-Bold", TEXT_DARK);
  });

  /* ---------- 格子 ---------- */
  const radius = Math.min(4 * scale, cellW / 4, cellH / 4);
  page.cells.forEach((cell, idx) => {
    const i = Math.floor(idx / page.buildings.length);
    const j = idx % page.buildings.length;
    const x = colX(j);
    const y = rowY(i);

    if (!cell || cell.empty) {
      pdf.roundedRect(x, y, cellW, cellH, radius).fillAndStroke(EMPTY_BG, EMPTY_STROKE);
      return;
    }

    pdf.roundedRect(x, y, cellW, cellH, radius)
      .fillAndStroke(safeColor(cell.bgColor, "#ffffff"), CELL_STROKE);

    // 露台標示：右上角小綠點（格子過小則省略）
    if (cell.hasTerrace && cellW >= 40) {
      pdf.circle(x + cellW - 5 * scale, y + 5 * scale, 2.5 * scale).fill(TERRACE_GREEN);
    }

    // 文字標籤帶：右上角（格子過小則省略）；有標籤時內容區上緣內縮，與畫面一致不重疊戶別編號
    const hasTags = Array.isArray(cell.tags) && cell.tags.length > 0 && cellW >= 40;
    if (hasTags) drawTagStrip(pdf, cell, x, y, cellW, scale, fTag);
    const topInset = hasTags ? TAG_TOP_INSET * scale : 0;

    // 內容行：戶別編號（必顯）＋ 依勾選的價格行；垂直置中
    const lines = [{ text: cell.unitId, size: fUnit, font: "TC-Bold", color: TEXT_DARK }];
    if (cell.soldOnly) {
      lines.push({ text: "已售", size: fSold, font: "TC-Bold", color: SOLD_RED });
    } else if (cell.lines) {
      if (cell.lines.total) lines.push({ text: cell.lines.total, size: fTotal, font: "TC-Bold", color: TOTAL_RED });
      if (cell.lines.breakdown) lines.push({ text: cell.lines.breakdown, size: fSub, font: "TC", color: TEXT_GRAY });
      if (cell.lines.area) lines.push({ text: cell.lines.area, size: fSub, font: "TC", color: TEXT_GRAY });
      if (cell.lines.unit) lines.push({ text: cell.lines.unit, size: fSub, font: "TC", color: TEXT_GRAY });
    }

    const blockH = lines.reduce((s, l) => s + l.size * 1.25, 0);
    let ty = y + topInset + Math.max(0, (cellH - topInset - blockH) / 2);
    for (const line of lines) {
      centeredText(pdf, line.text ?? "", x, ty, cellW, line.size, line.font, line.color);
      ty += line.size * 1.25;
    }
  });

  /* ---------- 頁尾圖例 ---------- */
  const legend = Array.isArray(docData.legend) ? docData.legend : [];
  if (legend.length > 0 && num(L.legendH) > 0) {
    const legendRowH = num(L.legendRowH, 16);
    const legendTop = paperH - margin - num(L.legendH) + 4;
    const rows = groupLegendRows(legend, contentW, fLegend);
    rows.forEach((row, r) => {
      let lx = margin + Math.max(0, (contentW - row.width) / 2); // 每行置中
      const ly = legendTop + r * legendRowH;
      for (const item of row.items) {
        pdf.rect(lx, ly + (legendRowH - 10) / 2, 10, 10)
          .fillAndStroke(safeColor(item.colorCode, "#ffffff"), CELL_STROKE);
        pdf.font("TC").fontSize(fLegend).fillColor(TEXT_DARK);
        pdf.text(String(item.statusName || ""), lx + 14, ly + (legendRowH - fLegend) / 2, { lineBreak: false });
        lx += legendItemWidth(item.statusName, fLegend);
      }
    });
  }
}

/** 產製銷控網格 PDF，回傳 Buffer */
async function buildSalesGridPdf(docData) {
  const L = docData.layout || {};
  const paperW = num(L.paperW, 841.89);
  const paperH = num(L.paperH, 595.28);

  const pdf = new PDFDocument({ size: [paperW, paperH], margin: 0 });
  const chunks = [];
  pdf.on("data", (c) => chunks.push(c));
  const done = new Promise((resolve) => pdf.on("end", () => resolve(Buffer.concat(chunks))));

  pdf.registerFont("TC", FONT_REGULAR);
  pdf.registerFont("TC-Bold", FONT_BOLD);

  (docData.pages || []).forEach((page, i) => {
    if (i > 0) pdf.addPage({ size: [paperW, paperH], margin: 0 });
    drawPage(pdf, docData, page);
  });

  pdf.end();
  return done;
}

module.exports = { buildSalesGridPdf };
