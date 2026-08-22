/**
 * 銷控網格下載 PDF — 版面/分頁計算模組（docs/銷控網格下載PDF-spec.md §3.3）
 *
 * 前端預覽（SalesGridDownloadDialog.vue）與後端 payload 共用同一份 page plan（pt 單位），
 * 後端 salesGridDocument.js 照 plan 直接繪製不重算，確保預覽＝PDF。
 *
 * 版面基準：畫面格子 120×90(px)、gap 12×10(px)，全部乘同一 scale 等比縮放。
 */

// 紙張尺寸（pt）
export const PAPER_SIZES = {
  A4: { w: 595.28, h: 841.89 },
  A3: { w: 841.89, h: 1190.55 },
};

const MARGIN = 16;            // 頁邊界（約 5.6mm，兼顧一般印表機可列印範圍）
const HEADER_H = 30;          // 頁首列高
const FLOOR_HEADER_W = 32;    // 樓層表頭欄寬
const BUILDING_HEADER_H = 22; // 棟別表頭列高
const LEGEND_FONT = 9;
const LEGEND_ROW_H = 16;
const MAX_SCALE = 1.5;        // 小網格避免格子過度放大

// 畫面基準尺寸（px，1px 視為 1pt）
const BASE_CELL_W = 120;
const BASE_CELL_H = 90;
const BASE_GAP_X = 12;
const BASE_GAP_Y = 10;

/** pt → mm（UI 提示用） */
export function ptToMm(pt) {
  return pt * 0.352778;
}

/** 陣列切段 */
function chunk(arr, size) {
  const out = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

/** 圖例 item 估寬：CJK 字寬 ≈ 字級，item = 色塊10 + 間隔4 + 文字 + 尾距14（與後端 salesGridDocument.js 同公式） */
export function legendItemWidth(name, fontSize = LEGEND_FONT) {
  return 10 + 4 + String(name || '').length * fontSize + 14;
}

/** 圖例依估寬分行（預覽與後端共用同一換行結果） */
export function groupLegendRows(legendItems, contentW, fontSize = LEGEND_FONT) {
  const rows = [];
  let line = [];
  let lineW = 0;
  for (const item of legendItems || []) {
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

/** 估算圖例高度 */
function estimateLegend(legendItems, contentW) {
  if (!legendItems || legendItems.length === 0) return { rows: 0, height: 0 };
  const rows = groupLegendRows(legendItems, contentW).length;
  return { rows, height: rows * LEGEND_ROW_H + 6 };
}

/**
 * 建立完整 page plan
 * @param {object} opts
 * @param {'A4'|'A3'} opts.paper
 * @param {'portrait'|'landscape'} opts.orientation
 * @param {number} opts.rowsPerPage  每頁樓層數（1 ~ floors.length）
 * @param {number} opts.colsPerPage  每頁棟別數（1 ~ buildings.length）
 * @param {Array}  opts.buildings    棟別（畫面順序，左→右）
 * @param {Array}  opts.floors       樓層（畫面順序，高→低）
 * @param {Function} opts.getCell    (floor, building) => 格子資料物件 或 null（空格）
 * @param {Array}  opts.legendItems  [{ statusName, colorCode }]
 * @returns {object} pagePlan（pt 單位）
 */
export function buildPagePlan({ paper, orientation, rowsPerPage, colsPerPage, buildings, floors, getCell, legendItems }) {
  const size = PAPER_SIZES[paper] || PAPER_SIZES.A4;
  const paperW = orientation === 'portrait' ? size.w : size.h;
  const paperH = orientation === 'portrait' ? size.h : size.w;

  const R = Math.max(1, Math.min(rowsPerPage, floors.length));
  const C = Math.max(1, Math.min(colsPerPage, buildings.length));

  const contentW = paperW - MARGIN * 2;
  const legend = estimateLegend(legendItems, contentW);
  const contentH = paperH - MARGIN * 2 - HEADER_H - legend.height;

  // 網格總寬 = floorHeaderW + s×(gapX + C×cellW + (C−1)×gapX) = floorHeaderW + s×(120C+12C)
  // 網格總高 = buildingHeaderH + s×(gapY + R×cellH + (R−1)×gapY) = buildingHeaderH + s×(90R+10R)
  const scaleW = (contentW - FLOOR_HEADER_W) / ((BASE_CELL_W + BASE_GAP_X) * C);
  const scaleH = (contentH - BUILDING_HEADER_H) / ((BASE_CELL_H + BASE_GAP_Y) * R);
  const scale = Math.min(scaleW, scaleH, MAX_SCALE);

  const cellW = BASE_CELL_W * scale;
  const cellH = BASE_CELL_H * scale;
  const gapX = BASE_GAP_X * scale;
  const gapY = BASE_GAP_Y * scale;

  // 網格水平置中（以滿版 chunk 寬計，所有頁一致）
  const gridW = FLOOR_HEADER_W + gapX + C * cellW + (C - 1) * gapX;
  const gridLeft = MARGIN + Math.max(0, (contentW - gridW) / 2);
  const gridTop = MARGIN + HEADER_H;

  const fonts = {
    title: 13,
    meta: 9,
    header: Math.min(16, Math.max(6, 15 * scale)),  // 棟別/樓層表頭
    unitName: 16 * scale,
    total: 16 * scale,   // 總價：紅色粗體、不帶「萬」
    sub: 12 * scale,
    sold: 14 * scale,
    legend: LEGEND_FONT,
  };

  // 分頁：先橫後直（同一樓層段先走完全部棟別段，再往低樓層段）
  const floorChunks = chunk(floors, R);
  const buildingChunks = chunk(buildings, C);
  const totalPages = floorChunks.length * buildingChunks.length;

  const pages = [];
  let pageNo = 0;
  for (const floorChunk of floorChunks) {
    for (const buildingChunk of buildingChunks) {
      pageNo += 1;
      const cells = [];
      for (const floor of floorChunk) {
        for (const building of buildingChunk) {
          cells.push(getCell(floor, building) || { empty: true });
        }
      }
      pages.push({
        pageNo,
        totalPages,
        buildings: buildingChunk,
        floors: floorChunk,
        cells,
      });
    }
  }

  return {
    paperW, paperH,
    margin: MARGIN,
    headerH: HEADER_H,
    legendH: legend.height,
    legendRowH: LEGEND_ROW_H,
    floorHeaderW: FLOOR_HEADER_W,
    buildingHeaderH: BUILDING_HEADER_H,
    cellW, cellH, gapX, gapY, scale,
    gridLeft, gridTop,
    fonts,
    cellWidthMm: ptToMm(cellW),
    totalPages,
    pages,
  };
}
