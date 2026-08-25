/**
 * 請佣獎金 PDF 產製（docs/請佣獎金系統-spec.md §7）
 *
 * 前端（src/services/commissionExcelService.js）算好 grid（儲存格矩陣＋合併＋欄寬列高＋樣式），
 * 後端照畫（同 salesGridDocument.js「前端算 plan、後端渲染」模式），
 * 確保 PDF 與 Excel / 預覽呈現一致。
 *
 * payload: {
 *   fileName, paper: 'A4'|'A3', orientation: 'landscape'|'portrait',
 *   grids: [{ name, nCols, nRows, cols[], rowHeights[], cells[][], merges[], base:{fontFamily,sz} }]
 * }
 */

const PDFDocument = require("pdfkit");
const path = require("path");

const FONT_KAI = path.join(__dirname, "assets", "fonts", "TW-Kai-98_1.ttf");
const FONT_SANS = path.join(__dirname, "assets", "fonts", "NotoSansTC-Regular.otf");
const FONT_SANS_BOLD = path.join(__dirname, "assets", "fonts", "NotoSansTC-Bold.otf");

const PAPER_SIZES = {
  A4: [595.28, 841.89],
  A3: [841.89, 1190.55],
};
const MARGIN = 24;
const PX_TO_PT = 0.75;

function money(n) {
  return Math.round(Number(n) || 0).toLocaleString("en-US");
}

function fmtValue(v, fmt) {
  if (v === "" || v === null || v === undefined) return "";
  if (typeof v !== "number") return String(v);
  if (!fmt || fmt === "#,##0") return money(v);
  if (fmt === "0.0") return (Math.round(v * 10) / 10).toLocaleString("en-US", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
  if (fmt === "0.00") return v.toFixed(2);
  if (fmt === '"$"#,##0') return "$" + money(v);
  return money(v);
}

/** 選擇字型：楷體系用 TW-Kai，其餘 NotoSans */
function fontFor(grid, bold) {
  const fam = String(grid.base?.fontFamily || "");
  const isKai = fam.includes("Kai") || fam.includes("標楷") || fam === "DFKai-SB";
  if (isKai) return "Kai";           // 楷體無粗體檔，粗體以描邊模擬
  return bold ? "SansBold" : "Sans";
}

function drawGrid(doc, grid, pageW, pageH) {
  const usableW = pageW - MARGIN * 2;
  const totalColPt = grid.cols.reduce((s, w) => s + w * PX_TO_PT, 0);
  const scale = totalColPt > usableW ? usableW / totalColPt : 1;
  const colW = grid.cols.map(w => w * PX_TO_PT * scale);
  const rowH = grid.rowHeights.map(h => Math.max(12, h * PX_TO_PT * scale));

  // 合併覆蓋表
  const anchor = {};   // "r,c" -> {rs, cs}
  const covered = {};  // "r,c" -> true（非左上角）
  (grid.merges || []).forEach(m => {
    anchor[`${m.r1},${m.c1}`] = { rs: m.r2 - m.r1 + 1, cs: m.c2 - m.c1 + 1 };
    for (let r = m.r1; r <= m.r2; r++) {
      for (let c = m.c1; c <= m.c2; c++) {
        if (r === m.r1 && c === m.c1) continue;
        covered[`${r},${c}`] = true;
      }
    }
  });

  const colX = [MARGIN];
  for (let c = 0; c < grid.nCols; c++) colX.push(colX[c] + colW[c]);

  let y = MARGIN;
  for (let r = 0; r < grid.nRows; r++) {
    const h = rowH[r];
    if (y + h > pageH - MARGIN && r > 0) {
      doc.addPage({ size: [pageW, pageH], margin: 0 });
      y = MARGIN;
    }
    for (let c = 0; c < grid.nCols; c++) {
      const key = `${r},${c}`;
      if (covered[key]) continue;
      const cell = grid.cells[r]?.[c];
      const span = anchor[key] || { rs: 1, cs: 1 };
      const w = colW.slice(c, c + span.cs).reduce((s, v) => s + v, 0);
      let hh = 0;
      for (let rr = r; rr < r + span.rs && rr < grid.nRows; rr++) hh += rowH[rr];
      const x = colX[c];
      const s = cell?.s || {};

      if (s.bg) {
        doc.save().rect(x, y, w, hh).fill(s.bg).restore();
      }
      if (s.border) {
        doc.save().lineWidth(0.5).strokeColor("#555").rect(x, y, w, hh).stroke().restore();
      }
      if (cell && cell.v !== "" && cell.v !== null && cell.v !== undefined) {
        const text = fmtValue(cell.v, s.fmt);
        if (text !== "") {
          const sz = Math.max(6, (s.sz || grid.base?.sz || 12) * scale * 0.92);
          const fontName = fontFor(grid, s.bold);
          doc.font(fontName).fontSize(sz).fillColor(s.color || "#000000");
          const pad = 2;
          const align = s.align || (cell.t === "n" ? "right" : "center");
          const textW = w - pad * 2;
          const textH = doc.heightOfString(text, { width: textW, align });
          const ty = y + Math.max(pad, (hh - textH) / 2);
          const opts = { width: textW, align, lineBreak: true };
          doc.text(text, x + pad, ty, opts);
          // 楷體粗體：描邊模擬
          if (s.bold && fontName === "Kai") {
            doc.text(text, x + pad + 0.3, ty, opts);
          }
        }
      }
    }
    y += h;
  }
}

async function buildGridsPdf(payload) {
  const paper = PAPER_SIZES[payload.paper] || PAPER_SIZES.A4;
  const landscape = payload.orientation !== "portrait";
  const pageW = landscape ? paper[1] : paper[0];
  const pageH = landscape ? paper[0] : paper[1];

  const doc = new PDFDocument({ size: [pageW, pageH], margin: 0, autoFirstPage: false });
  const chunks = [];
  doc.on("data", c => chunks.push(c));
  const done = new Promise(resolve => doc.on("end", () => resolve(Buffer.concat(chunks))));

  doc.registerFont("Kai", FONT_KAI);
  doc.registerFont("Sans", FONT_SANS);
  doc.registerFont("SansBold", FONT_SANS_BOLD);

  const grids = Array.isArray(payload.grids) ? payload.grids : [];
  if (!grids.length) throw new Error("payload.grids 不可為空。");
  grids.forEach(grid => {
    doc.addPage({ size: [pageW, pageH], margin: 0 });
    drawGrid(doc, grid, pageW, pageH);
  });

  doc.end();
  return done;
}

/** 請佣總表 PDF */
async function buildClaimPdf(payload) {
  return buildGridsPdf(payload);
}

/** 獎金表 PDF（含多分組 grid，另可含請佣總表 grid） */
async function buildBonusPdf(payload) {
  return buildGridsPdf(payload);
}

module.exports = { buildClaimPdf, buildBonusPdf };
