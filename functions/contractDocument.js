/**
 * 合約製作資料範本：PDF / EXCEL 渲染模組
 * 見 docs/合約製作資料範本-spec.md §7
 * 版面依 docs/2026-08-09-富宇首馥-D-18-黃紹文-簽約會辦單.pdf 範本還原：
 *   - 拆款表（簽約會辦單）：黑體、整頁外框、儲存格合併、直排「付款明細」
 *   - 付款明細表：明體、置中期別、房屋/土地總價列
 *   - 繳款銀行：置中表格 + QR（中央標籤）+ 一頁多份裁切配置
 *   - 合約加註：明體、虛線框、買方簽名列
 *
 * buildContractPdf(payload, attachmentFiles)
 *   attachmentFiles: [{ fileId, fileName, pageRange, buffer, mimeType }]
 */

const PDFDocument = require("pdfkit");
const ExcelJS = require("exceljs");
const path = require("path");

const FONTS = {
  MING: path.join(__dirname, "assets", "fonts", "NotoSerifTC-Regular.otf"),
  "MING-B": path.join(__dirname, "assets", "fonts", "NotoSerifTC-Bold.otf"),
  HEI: path.join(__dirname, "assets", "fonts", "NotoSansTC-Regular.otf"),
  "HEI-B": path.join(__dirname, "assets", "fonts", "NotoSansTC-Bold.otf"),
  // 標楷體：全字庫正楷體 TW-Kai（政府開放授權）；楷體無粗體字重，粗體以同檔代替
  KAI: path.join(__dirname, "assets", "fonts", "TW-Kai-98_1.ttf"),
  "KAI-B": path.join(__dirname, "assets", "fonts", "TW-Kai-98_1.ttf"),
};

// 頁面字體覆蓋（config.pages[].font: 'ming' | 'hei' | 'kai'；null = 各頁型內建預設混排）
const PAGE_FONT_FAMILY = { ming: "MING", hei: "HEI", kai: "KAI" };
let pageFontOverride = null;   // buildContractPdf 渲染期間逐頁設定

function F(name) {
  if (!pageFontOverride) return name;
  return String(name).endsWith("-B") ? `${pageFontOverride}-B` : pageFontOverride;
}

const BLACK = "#000000";
// 印泥藍（合約數字對照表蓋章內容；與前端 ContractNumberTablePreview.vue 同值）
const STAMP_BLUE = "#1E50A2";

// pdfkit 紙張（points）
const PAPER_PT = {
  A4: [595.28, 841.89],
  A3: [841.89, 1190.55],
  B4: [708.66, 1000.63],
  Letter: [612, 792],
};

// exceljs paperSize 代碼
const EXCEL_PAPER = { A4: 9, A3: 8, B4: 12, Letter: 1 };

const MARGIN = 34;

/** dataURL → Buffer（png/jpeg） */
function dataUrlToBuffer(dataUrl) {
  if (!dataUrl || typeof dataUrl !== "string") return null;
  const match = dataUrl.match(/^data:image\/(png|jpeg|jpg);base64,(.+)$/);
  if (!match) return null;
  try {
    return Buffer.from(match[2], "base64");
  } catch (e) {
    return null;
  }
}

function fmtWan(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return "";
  return n.toLocaleString("en-US", { maximumFractionDigits: 2 });
}

/** 價款欄：固定 1 位小數（範本 1,804.5萬 / 1,107.0萬 樣式） */
function fmtWan1(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return "";
  return n.toLocaleString("en-US", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
}

function fmtYuan(wan, keepZero = false) {
  const n = Math.round((Number(wan) || 0) * 10000);
  if (n === 0 && !keepZero) return "-";
  return n.toLocaleString("en-US");
}

function fmtArea(v) {
  const n = Number(v);
  if (!Number.isFinite(n) || n === 0) return "-";
  return n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function fmtPercent(value) {
  const num = Number(value) || 0;
  const text = Number.isInteger(num) ? String(num) : String(Math.round(num * 100) / 100);
  return `${text}%`;
}

/** 解析頁碼範圍字串（"1-3,5"）→ 0-based index 陣列；null/空 = 全部 */
function parsePageRange(rangeText, totalPages) {
  if (!rangeText || !String(rangeText).trim()) {
    return Array.from({ length: totalPages }, (_, i) => i);
  }
  const result = new Set();
  for (const part of String(rangeText).split(/[,，]/)) {
    const seg = part.trim();
    if (!seg) continue;
    const m = seg.match(/^(\d+)\s*[-~]\s*(\d+)$/);
    if (m) {
      const from = Math.max(1, parseInt(m[1], 10));
      const to = Math.min(totalPages, parseInt(m[2], 10));
      for (let i = from; i <= to; i++) result.add(i - 1);
    } else if (/^\d+$/.test(seg)) {
      const p = parseInt(seg, 10);
      if (p >= 1 && p <= totalPages) result.add(p - 1);
    }
  }
  return Array.from(result).sort((a, b) => a - b);
}

/* ==========================================================
 * PDF：儲存格繪製工具
 * ========================================================== */

/**
 * 畫一個儲存格（框線 + 垂直置中文字）。
 * o: { font:'HEI'|'MING', bold, size, align, border, lineWidth, padX, charSpace, lineGap, dy, color,
 *      noWrap（禁止換行，超寬不自動折行）, fauxBold（同色描邊仿粗體：楷體無粗體字重時用） }
 */
function cell(pdf, x, y, w, h, text, o = {}) {
  if (o.border !== false) {
    pdf.lineWidth(o.lineWidth || 0.7).rect(x, y, w, h).stroke(BLACK);
  }
  const t = text === null || text === undefined ? "" : String(text);
  if (t === "") return;
  const base = o.font || "HEI";
  pdf.font(F(o.bold ? `${base}-B` : base)).fontSize(o.size || 9).fillColor(o.color || BLACK);
  const padX = o.padX !== undefined ? o.padX : 3;
  const opts = { width: w - padX * 2, align: o.align || "center", lineGap: o.lineGap || 0 };
  if (o.charSpace) opts.characterSpacing = o.charSpace;
  if (o.noWrap) opts.lineBreak = false;
  if (o.fauxBold) {
    pdf.strokeColor(o.color || BLACK).lineWidth(o.fauxBoldWidth || 0.45);
    opts.fill = true;
    opts.stroke = true;
  }
  const th = pdf.heightOfString(t, opts);
  let ty = y + (h - th) / 2 + (o.dy || 0);
  if (ty < y + 1) ty = y + 1;
  pdf.text(t, x + padX, ty, opts);
}

/** 直排文字儲存格（每字一行） */
function vCell(pdf, x, y, w, h, label, o = {}) {
  const chars = String(label || "").split("").join("\n");
  cell(pdf, x, y, w, h, chars, { lineGap: 2, ...o });
}

/** 標籤靠左 + 數值靠右的儲存格（價款欄樣式） */
function labelValueCell(pdf, x, y, w, h, label, value, o = {}) {
  if (o.border !== false) pdf.lineWidth(o.lineWidth || 0.7).rect(x, y, w, h).stroke(BLACK);
  const base = o.font || "HEI";
  const lsize = o.labelSize || 9;
  const vsize = o.valueSize || 10;
  pdf.font(F(`${base}-B`)).fontSize(lsize).fillColor(BLACK);
  const lh = pdf.heightOfString(label, { width: w - 8 });
  pdf.text(label, x + 5, y + (h - lh) / 2, { width: w - 8, align: "left" });
  pdf.font(F(base)).fontSize(vsize);
  const vh = pdf.heightOfString(String(value), { width: w - 10 });
  pdf.text(String(value), x + 5, y + (h - vh) / 2, { width: w - 10, align: "right" });
}

function pageMetrics(pdf) {
  const w = pdf.page.width;
  return { left: MARGIN, right: w - MARGIN, contentW: w - MARGIN * 2 };
}

/* ==========================================================
 * 拆款表（簽約會辦單）：整頁外框 + 各區塊
 * ========================================================== */

function drawBreakdown(pdf, d, slotTop) {
  const { left: L, contentW: W } = pageMetrics(pdf);
  const pageBottom = pdf.page.height - MARGIN;
  let y = slotTop;
  const X = f => L + W * f;
  const FW = f => W * f;

  // ---- 標題 ----
  cell(pdf, L, y, W, 34, d.headerTitle || "簽約會辦單", { bold: true, size: 18, charSpace: 8 });
  y += 34;

  // ---- 基本資訊（3 列）----
  const IF = [0, 0.13, 0.32, 0.435, 0.605, 0.74, 1];
  const infoRow = (cells, h = 28) => {
    for (const c of cells) {
      cell(pdf, X(IF[c.i0]), y, X(IF[c.i1]) - X(IF[c.i0]), h, c.t, c.o || {});
    }
    y += h;
  };
  infoRow([
    { i0: 0, i1: 1, t: "個案名稱", o: { bold: true, size: 10.5 } },
    { i0: 1, i1: 2, t: d.projectName || "", o: { size: 13 } },
    { i0: 2, i1: 3, t: "客戶姓名", o: { bold: true, size: 10.5 } },
    { i0: 3, i1: 4, t: d.buyerName || "", o: { size: 11.5 } },
    { i0: 4, i1: 5, t: "身分證字號", o: { bold: true, size: 10.5 } },
    { i0: 5, i1: 6, t: d.buyerIdNumber || "", o: { size: 11 } },
  ]);
  infoRow([
    { i0: 0, i1: 1, t: "房屋編號", o: { bold: true, size: 10.5 } },
    { i0: 1, i1: 2, t: d.unitId || "", o: { size: 13 } },
    { i0: 2, i1: 3, t: "總　價", o: { bold: true, size: 10.5 } },
    { i0: 3, i1: 4, t: fmtWan(d.totalPrice), o: { size: 13 } },
    { i0: 4, i1: 5, t: "聯絡電話", o: { bold: true, size: 10.5 } },
    { i0: 5, i1: 6, t: d.buyerPhone || "", o: { size: 11 } },
  ]);
  infoRow([
    { i0: 0, i1: 1, t: "地　址", o: { bold: true, size: 10.5 } },
    { i0: 1, i1: 4, t: d.address || "", o: { size: 10.5 } },
    { i0: 4, i1: 5, t: "簽約日期", o: { bold: true, size: 10.5 } },
    { i0: 5, i1: 6, t: d.signDate || "", o: { size: 10.5 } },
  ]);

  // ---- 車位編號區 ----
  const spots = (d.parkingSpots && d.parkingSpots.length)
    ? d.parkingSpots
    : [{ label: "無", price: null }];
  const parkRows = Math.max(spots.length, 2);
  const PH = 24;
  // 左：車位編號（跨列）
  cell(pdf, L, y, FW(0.13), PH * parkRows, "車位編號", { bold: true, size: 10.5 });
  const rightPairs = [
    { label: "房地價款", value: d.housePlusLandPrice },
    { label: "車位價款", value: d.parkingTotal },
  ];
  for (let i = 0; i < parkRows; i++) {
    const ry = y + PH * i;
    const p = spots[i];
    cell(pdf, X(0.13), ry, FW(0.50), PH, p ? (p.label || "") : "", { size: 10 });
    cell(pdf, X(0.63), ry, FW(0.105), PH,
      p && p.price !== null && p.price !== undefined ? `價款 ${fmtWan(p.price)} 萬` : "", { size: 8.5 });
    const rp = rightPairs[i];
    cell(pdf, X(0.735), ry, FW(0.12), PH, rp ? rp.label : "", { bold: true, size: 8 });
    cell(pdf, X(0.855), ry, FW(0.10), PH, rp ? fmtWan(rp.value) : "", { size: 11 });
    cell(pdf, X(0.955), ry, FW(0.045), PH, rp ? "萬" : "", { size: 8.5 });
  }
  y += PH * parkRows;

  // ---- 面積區（左 1 欄跨 6 列 + 中/右各 3 組，每組 2 列）----
  const a = d.areas || {};
  const AH = 25;
  const hasTerrace = Number(a.terracePing) > 0;
  const areaRows = 6;
  // 欄界（比照範本）
  const AF = { l0: 0, l1: 0.13, v1: 0.235, u1: 0.275, m0: 0.275, m1: 0.39, s1: 0.475, v2: 0.58, u2: 0.62, r0: 0.62, r1: 0.77, v3: 0.96, u3: 1 };
  const areaTop = y;
  // 左：房屋總面積
  cell(pdf, X(AF.l0), y, X(AF.l1) - X(AF.l0), AH * areaRows, "房屋總面積", { bold: true, size: 10.5 });
  cell(pdf, X(AF.l1), y, X(AF.v1) - X(AF.l1), AH * 3, fmtArea(a.houseTotalSqm), { size: 11 });
  cell(pdf, X(AF.v1), y, X(AF.u1) - X(AF.v1), AH * 3, "㎡", { size: 8.5 });
  cell(pdf, X(AF.l1), y + AH * 3, X(AF.v1) - X(AF.l1), AH * 3, fmtArea(a.houseTotalPing), { size: 11 });
  cell(pdf, X(AF.v1), y + AH * 3, X(AF.u1) - X(AF.v1), AH * 3, "坪", { size: 8.5 });

  // 中/右一組（2 列）：label(跨2) + [subTop/subBottom] + 值/單位
  const pairAt = (row, colDef) => {
    const py = areaTop + AH * row;
    const { x0, x1, sx, vx, ux, label, sub, sqm, ping, labelSize } = colDef;
    if (sx !== null) {
      cell(pdf, x0, py, x1 - x0, AH * 2, label, { bold: true, size: labelSize || 10 });
      cell(pdf, x1, py, sx - x1, AH, sub && sub[0] !== undefined ? sub[0] : "", { size: 8.5 });
      cell(pdf, x1, py + AH, sx - x1, AH, sub && sub[1] !== undefined ? sub[1] : "", { size: 8.5 });
      cell(pdf, sx, py, vx - sx, AH, fmtArea(sqm), { size: 10.5 });
      cell(pdf, vx, py, ux - vx, AH, "㎡", { size: 8.5 });
      cell(pdf, sx, py + AH, vx - sx, AH, fmtArea(ping), { size: 10.5 });
      cell(pdf, vx, py + AH, ux - vx, AH, "坪", { size: 8.5 });
    } else {
      cell(pdf, x0, py, x1 - x0, AH * 2, label, { bold: true, size: labelSize || 10 });
      cell(pdf, x1, py, vx - x1, AH, fmtArea(sqm), { size: 10.5 });
      cell(pdf, vx, py, ux - vx, AH, "㎡", { size: 8.5 });
      cell(pdf, x1, py + AH, vx - x1, AH, fmtArea(ping), { size: 10.5 });
      cell(pdf, vx, py + AH, ux - vx, AH, "坪", { size: 8.5 });
    }
  };

  // 中欄三組
  pairAt(0, { x0: X(AF.m0), x1: X(AF.m1), sx: X(AF.s1), vx: X(AF.v2), ux: X(AF.u2), label: "主建物", sub: ["占比", a.mainRatioText || ""], sqm: a.mainSqm, ping: a.mainPing });
  pairAt(2, { x0: X(AF.m0), x1: X(AF.s1), sx: null, vx: X(AF.v2), ux: X(AF.u2), label: "附屬建物(陽台)", sqm: a.ancillarySqm, ping: a.ancillaryPing, labelSize: 9 });
  pairAt(4, { x0: X(AF.m0), x1: X(AF.s1), sx: null, vx: X(AF.v2), ux: X(AF.u2), label: "專有部分(合計)", sqm: a.exclusiveSqm, ping: a.exclusivePing, labelSize: 9 });
  // 右欄三組
  pairAt(0, { x0: X(AF.r0), x1: X(AF.r1), sx: null, vx: X(AF.v3), ux: X(AF.u3), label: "共有部份", sqm: a.commonSqm, ping: a.commonPing });
  pairAt(2, { x0: X(AF.r0), x1: X(AF.r1), sx: null, vx: X(AF.v3), ux: X(AF.u3), label: "車位", sqm: a.parkingAreaSqm, ping: a.parkingAreaPing });
  pairAt(4, {
    x0: X(AF.r0), x1: X(AF.r1), sx: null, vx: X(AF.v3), ux: X(AF.u3),
    label: a.landShareRatio ? `土地持分\n${a.landShareRatio}/100000` : "土地持分",
    sqm: a.landShareSqm, ping: a.landSharePing, labelSize: 9.5,
  });
  y = areaTop + AH * areaRows;

  // 露臺（不計坪）：附加一列
  if (hasTerrace) {
    const TH = 20;
    cell(pdf, L, y, FW(0.275), TH, "露臺(不計坪)", { bold: true, size: 9.5 });
    cell(pdf, X(0.275), y, FW(0.305), TH, `${fmtArea(a.terracePing)} 坪`, { size: 10 });
    cell(pdf, X(0.58), y, FW(0.42), TH, "", {});
    y += TH;
  }

  // ---- 價款區（房屋款 / 主建物 / 附屬 / 專有 / 共有）----
  const priceFields = d.priceFields || [];
  const byKey = Object.fromEntries(priceFields.map(f => [f.key, f]));
  const fVal = f => (f ? (f.error ? "公式錯誤" : `${fmtWan1(f.value)}萬`) : "");
  const KNOWN = ["houseAmount", "mainAmount", "ancillaryAmount", "exclusiveAmount", "commonAmount"];
  const PRH = 24;
  if (KNOWN.every(k => byKey[k])) {
    labelValueCell(pdf, L, y, FW(0.22), PRH * 2, "房屋款：", fVal(byKey.houseAmount), { labelSize: 10, valueSize: 10.5 });
    labelValueCell(pdf, X(0.22), y, FW(0.30), PRH, `${byKey.mainAmount.label}：`, fVal(byKey.mainAmount), { labelSize: 9, valueSize: 10 });
    labelValueCell(pdf, X(0.22), y + PRH, FW(0.30), PRH, `${byKey.ancillaryAmount.label}：`, fVal(byKey.ancillaryAmount), { labelSize: 8.5, valueSize: 10 });
    labelValueCell(pdf, X(0.52), y, FW(0.24), PRH * 2, `${byKey.exclusiveAmount.label}：`, fVal(byKey.exclusiveAmount), { labelSize: 9, valueSize: 10 });
    labelValueCell(pdf, X(0.76), y, FW(0.24), PRH * 2, `${byKey.commonAmount.label}：`, fVal(byKey.commonAmount), { labelSize: 9, valueSize: 10 });
    y += PRH * 2;
    // 其餘自訂價款欄位：每列 3 欄
    const extras = priceFields.filter(f => !KNOWN.includes(f.key));
    for (let i = 0; i < extras.length; i += 3) {
      const rowFields = extras.slice(i, i + 3);
      const cw = W / rowFields.length;
      rowFields.forEach((f, j) => {
        labelValueCell(pdf, L + cw * j, y, cw, 20, `${f.label}：`, fVal(f), { labelSize: 9, valueSize: 10 });
      });
      y += 20;
    }
  } else if (priceFields.length) {
    for (let i = 0; i < priceFields.length; i += 3) {
      const rowFields = priceFields.slice(i, i + 3);
      const cw = W / rowFields.length;
      rowFields.forEach((f, j) => {
        labelValueCell(pdf, L + cw * j, y, cw, 22, `${f.label}：`, fVal(f), { labelSize: 9, valueSize: 10 });
      });
      y += 22;
    }
  }

  // ---- 付款明細（橫式，直排標籤 + 兩層表頭）----
  const columns = (d.installment && d.installment.columns) || [];
  if (columns.length) {
    const leaves = columns.reduce((s, c) => s + (c.type === "group" ? c.children.length : 1), 0);
    const vertW = 20;
    const labelW = 46;
    const totalW = 47;
    const leafW = (W - vertW - labelW - totalW) / Math.max(leaves, 1);
    const nfs = leafW < 26 ? 6.5 : leafW < 34 ? 7.2 : 8;
    const H1 = 17, H2 = 14, DH = 22, TH = 23, PCH = 15;
    const blockH = H1 + H2 + DH * 2 + TH + PCH;
    const bx = L + vertW;

    // 直排「付款明細」
    vCell(pdf, L, y, vertW, blockH, "付款明細", { bold: true, size: 10 });

    // 表頭
    cell(pdf, bx, y, labelW, H1 + H2, "單位:萬", { bold: true, size: 8 });
    let hx = bx + labelW;
    for (const col of columns) {
      if (col.type === "group") {
        const gw = leafW * col.children.length;
        cell(pdf, hx, y, gw, H1, col.name, { bold: true, size: 9 });
        col.children.forEach((c2, j) => {
          cell(pdf, hx + leafW * j, y + H1, leafW, H2, c2.seq !== null && c2.seq !== undefined ? String(c2.seq) : String(j + 1), { size: 7.5, bold: true });
        });
        hx += gw;
      } else {
        cell(pdf, hx, y, leafW, H1 + H2, col.name, { bold: true, size: nfs, padX: 1 });
        hx += leafW;
      }
    }
    cell(pdf, hx, y, totalW, H1 + H2, "總價", { bold: true, size: 9.5 });
    y += H1 + H2;

    // 三列資料
    const dataRow = (label, picker, total, h, bold = false) => {
      cell(pdf, bx, y, labelW, h, label, { size: 8.5, bold: true, padX: 2 });
      let cx = bx + labelW;
      for (const col of columns) {
        const leavesArr = col.type === "group" ? col.children : [col];
        for (const lf of leavesArr) {
          cell(pdf, cx, y, leafW, h, fmtWan(picker(lf)), { size: nfs, bold, padX: 1 });
          cx += leafW;
        }
      }
      cell(pdf, cx, y, totalW, h, fmtWan(total), { size: 8.5, bold: true, padX: 2 });
      y += h;
    };
    dataRow(`房屋 ${fmtPercent(d.housePriceRatio)}`, c => c.houseAmount, d.installment.houseTotal, DH);
    dataRow(`土地 ${fmtPercent(d.landPriceRatio)}`, c => c.landAmount, d.installment.landTotal, DH);
    dataRow("合計", c => c.amount, d.installment.grandTotal, TH, true);

    // 比例列：開頭連續 single 合併為一格（範本：訂金+簽約金 5%）
    cell(pdf, bx, y, labelW, PCH, "", {});
    let px = bx + labelW;
    let idx = 0;
    // 前導 single 群
    let leadPercent = 0, leadWidth = 0;
    while (idx < columns.length && columns[idx].type !== "group") {
      leadPercent += Number(columns[idx].percent) || 0;
      leadWidth += leafW;
      idx += 1;
    }
    if (leadWidth > 0) {
      cell(pdf, px, y, leadWidth, PCH, fmtPercent(leadPercent), { size: 8 });
      px += leadWidth;
    }
    for (; idx < columns.length; idx++) {
      const col = columns[idx];
      const wcol = col.type === "group" ? leafW * col.children.length : leafW;
      cell(pdf, px, y, wcol, PCH, fmtPercent(col.percent), { size: 8 });
      px += wcol;
    }
    cell(pdf, px, y, totalW, PCH, "100%", { size: 8, bold: true });
    y += PCH;
  }

  // ---- 備註 ----
  cell(pdf, L, y, FW(0.13), 20, "備註", { bold: true, size: 10 });
  cell(pdf, X(0.13), y, FW(0.87), 20, d.remark || "", { size: 9, align: "left" });
  y += 20;

  // ---- 底部固定區塊高度（自由欄位 + 簽核欄）----
  const freeFields = d.freeFields || [];
  const signFields = d.signFields || [];
  const freeH = freeFields.length ? 16 + 18 : 0;
  const signH = signFields.length ? 18 + 32 : 0;

  // ---- 磋商條款（彈性區域，填滿中間）----
  const clauses = d.clauses || [];
  const clauseText = clauses.map(c => c.content).join("\n\n");
  let clauseAreaH = pageBottom - y - freeH - signH;
  if (clauseText) {
    pdf.font(F("HEI")).fontSize(8.5).fillColor(BLACK);
    const th = pdf.heightOfString(clauseText, { width: W - 12, lineGap: 1.5 }) + 10;
    if (th > clauseAreaH) clauseAreaH = th;   // 超出時往下擠（外框跟著加長）
    pdf.text(clauseText, L + 6, y + 5, { width: W - 12, lineGap: 1.5 });
  }
  if (clauseAreaH < 0) clauseAreaH = 0;
  y += clauseAreaH;

  // ---- 自由欄位（右側半寬表格：贈品/仲人費/介紹費/溢差價）----
  if (freeFields.length) {
    const tw = W * 0.55;
    const fx = L + W - tw;
    const cw = tw / freeFields.length;
    freeFields.forEach((f, i) => {
      cell(pdf, fx + cw * i, y, cw, 16, f.label, { bold: true, size: 9 });
    });
    freeFields.forEach((f, i) => {
      const empty = f.value === null || f.value === undefined || f.value === "";
      const v = empty ? "" : (f.type === "number" ? fmtWan(f.value) : String(f.value));
      cell(pdf, fx + cw * i, y + 16, cw, 18, v, { size: 9.5 });
    });
    y += 16 + 18;
  }

  // ---- 簽核欄 ----
  if (signFields.length) {
    const sw = W / signFields.length;
    signFields.forEach((f, i) => {
      cell(pdf, L + sw * i, y, sw, 18, f.label, { bold: true, size: 10.5 });
    });
    signFields.forEach((f, i) => {
      cell(pdf, L + sw * i, y + 18, sw, 32, f.value || "", { size: 11 });
    });
    y += 18 + 32;
  }

  // ---- 整頁外框（加粗）----
  pdf.lineWidth(1.3).rect(L, slotTop, W, y - slotTop).stroke(BLACK);
  return y;
}

/* ==========================================================
 * 付款明細表（明體、置中、房屋/土地總價列）
 * ========================================================== */

function drawPaymentDetail(pdf, d, slotTop) {
  const { left: L, contentW: W } = pageMetrics(pdf);
  let y = slotTop + 4;

  const mode = d.mode || "combined";
  const showHouse = mode !== "land";
  const showLand = mode !== "house" && mode !== "package";
  const houseColLabel = mode === "package" ? "配套款" : "房屋款";
  const title = mode === "house" ? "房屋付款明細表"
    : mode === "land" ? "土地付款明細表"
    : mode === "package" ? "配套款付款明細表"
    : "付款明細表";

  const isCombined = (d.mode || "combined") === "combined";
  const tableW = W * (isCombined ? 0.94 : 0.78);

  // 表頭文字
  pdf.font(F("MING")).fontSize(11.5).fillColor(BLACK);
  pdf.text("工地名稱：", L + 8, y);
  pdf.text(d.projectName || "", L + 78, y);
  pdf.font(F("MING")).fontSize(12.5).text(title, L + tableW * 0.42, y - 1, { characterSpacing: 2 });
  y += 26;
  pdf.font(F("MING")).fontSize(11.5).text("房屋代號：", L + 8, y);
  pdf.text(d.unitId || "", L + 78, y);
  pdf.fontSize(9.5).text("單位:元", L + tableW - 52, y + 1);
  y += 24;

  const vertW = 22;
  const seqW = 30;
  const amountCols = (showHouse ? 1 : 0) + (showLand ? 1 : 0);
  const signW = d.showSignColumn ? tableW * (amountCols > 1 ? 0.19 : 0.23) : 0;
  const amtW = tableW * (amountCols > 1 ? 0.19 : 0.26);
  const nameW = tableW - vertW - seqW - amtW * amountCols - signW;

  const RH = 27;
  const M = { font: "MING" };

  // 表頭列
  cell(pdf, L, y, vertW + seqW + nameW, 22, "期別名稱", { ...M, size: 10.5 });
  let hx = L + vertW + seqW + nameW;
  if (showHouse) { cell(pdf, hx, y, amtW, 22, houseColLabel, { ...M, size: 10.5 }); hx += amtW; }
  if (showLand) { cell(pdf, hx, y, amtW, 22, "土地款", { ...M, size: 10.5 }); hx += amtW; }
  if (d.showSignColumn) cell(pdf, hx, y, signW, 22, "收款人簽章", { ...M, size: 10.5 });
  y += 22;

  const amountCells = (row, ry, h) => {
    let cx = L + vertW + seqW + nameW;
    if (showHouse) { cell(pdf, cx, ry, amtW, h, fmtYuan(row.houseAmount), { ...M, size: 10.5, align: "right", padX: 8 }); cx += amtW; }
    if (showLand) { cell(pdf, cx, ry, amtW, h, fmtYuan(row.landAmount), { ...M, size: 10.5, align: "right", padX: 8 }); cx += amtW; }
    if (d.showSignColumn) cell(pdf, cx, ry, signW, h, "", {});
  };

  const rows = d.rows || [];
  let i = 0;
  while (i < rows.length) {
    const row = rows[i];
    if (row.groupName && row.groupIndex === 0) {
      const groupRows = rows.slice(i, i + row.groupSize);
      const groupTop = y;
      for (const gr of groupRows) {
        cell(pdf, L + vertW, y, seqW, RH, gr.seq !== null && gr.seq !== undefined ? String(gr.seq) : "", { ...M, size: 10.5 });
        cell(pdf, L + vertW + seqW, y, nameW, RH, gr.name, { ...M, size: 11 });
        amountCells(gr, y, RH);
        y += RH;
      }
      vCell(pdf, L, groupTop, vertW, y - groupTop, row.groupName, { ...M, size: 10 });
      i += row.groupSize;
    } else {
      cell(pdf, L, y, vertW + seqW + nameW, RH, row.name, { ...M, size: 11 });
      amountCells(row, y, RH);
      y += RH;
      i += 1;
    }
  }

  // 總價列
  if (mode === "combined") {
    cell(pdf, L, y, vertW + seqW + nameW, RH, "加總", { ...M, size: 11 });
    amountCells({ houseAmount: d.houseTotal, landAmount: d.landTotal }, y, RH);
    y += RH;
    cell(pdf, L, y, vertW + seqW + nameW, RH, "合計總價", { ...M, size: 11 });
    let cx = L + vertW + seqW + nameW;
    cell(pdf, cx, y, amtW * amountCols, RH, fmtYuan(d.pageTotal, true), { ...M, size: 11, align: "right", padX: 8 });
    if (d.showSignColumn) cell(pdf, cx + amtW * amountCols, y, signW, RH, "", {});
    y += RH;
  } else {
    const totalLabel = mode === "house" ? "房屋總價" : mode === "land" ? "土地總價" : "配套款總價";
    cell(pdf, L, y, vertW + seqW + nameW, RH, totalLabel, { ...M, size: 11 });
    let cx = L + vertW + seqW + nameW;
    cell(pdf, cx, y, amtW, RH, fmtYuan(d.pageTotal, true), { ...M, size: 10.5, align: "right", padX: 8 });
    cx += amtW;
    if (d.showSignColumn) cell(pdf, cx, y, signW, RH, "", {});
    y += RH;
  }

  if (d.noteText) {
    y += 8;
    pdf.font(F("MING")).fontSize(7.5).fillColor(BLACK).text(d.noteText, L + 2, y, { width: tableW });
    y += pdf.heightOfString(d.noteText, { width: tableW }) + 4;
  }
  return y;
}

/* ==========================================================
 * 繳款銀行（置中表格 + QR 中央標籤）
 * ========================================================== */

function drawBankAccounts(pdf, d, slotTop, slotH, qrBuffer) {
  const { left: L } = pageMetrics(pdf);
  const x0 = L + 10;
  let y = slotTop + 8;

  // 頁首：建案名稱 戶別 頁面名稱（例：富宇首馥 D-19 房屋繳款銀行帳戶）
  const headerText = [d.projectName, d.unitId, d.pageTitle].filter(Boolean).join(" ") || `戶別 ${d.unitId || ""}`;
  pdf.font(F("HEI-B")).fontSize(13.5).fillColor(BLACK);
  pdf.text(headerText, x0, y, { width: pageMetrics(pdf).contentW - 20 });
  y += 30;

  const tw = 218;
  const RH = 30;
  const sets = d.bankSets || [];
  const showLabel = sets.length > 1;
  const tableTop = y;

  for (const set of sets) {
    if (showLabel) {
      pdf.font(F("HEI-B")).fontSize(10.5).text(set.label || "", x0, y);
      y += 16;
    }
    const rowsDef = [
      ["繳款銀行名稱", 11], [set.bankName || "", 11.5],
      ["戶名", 11], [set.accountName || "", 11.5],
      ["帳號", 11], [set.account || "", 12],
    ];
    rowsDef.forEach(([text, size], idx) => {
      cell(pdf, x0, y, tw, RH, text, {
        font: "MING", size, lineWidth: 0.9,
        charSpace: idx === 5 ? 1.2 : 0,
      });
      y += RH;
    });
    y += 12;
  }
  if (!sets.length) {
    pdf.font(F("MING")).fontSize(10.5).text("（無銀行帳戶資料）", x0, y);
    y += 18;
  }

  // QR（右側）
  if (d.showQr) {
    const qrSize = 106;
    const qx = x0 + tw + 52;
    let qy = tableTop + 14;
    pdf.font(F("HEI-B")).fontSize(10.5)
      .text(d.qrLabel || "請填寫客戶資料卡", qx - 8, qy, { width: qrSize + 16, align: "center", characterSpacing: 1 });
    qy += 20;
    if (qrBuffer) {
      try {
        pdf.image(qrBuffer, qx, qy, { fit: [qrSize, qrSize] });
      } catch (e) {
        console.warn("[contractDocument] QR 嵌入失敗：", e.message);
      }
    } else {
      pdf.rect(qx, qy, qrSize, qrSize).dash(3, { space: 2 }).stroke("#999999").undash();
    }
    // 案名 / 戶別：置於 QR 下方（不覆蓋 QR 圖形）
    const qrCaption = [d.projectName, d.unitId].filter(Boolean).join("　");
    if (qrCaption) {
      pdf.font(F("HEI")).fontSize(9.5).fillColor(BLACK)
        .text(qrCaption, qx - 12, qy + qrSize + 6, { width: qrSize + 24, align: "center" });
    }
  }
  return y;
}

/* ==========================================================
 * 合約加註（明體、虛線輕框、買方簽名）
 * ========================================================== */

function drawContractNotes(pdf, d, slotTop, slotH) {
  const { left: L, contentW: W } = pageMetrics(pdf);
  // 輕虛線框（供裁剪參考）
  pdf.lineWidth(0.5).dash(2, { space: 2 })
    .rect(L + 2, slotTop + 3, W - 4, slotH - 10)
    .stroke("#BBBBBB")
    .undash();

  let y = slotTop + 16;
  for (const n of d.notes || []) {
    const fs = Number(n.fontSize) || 12;
    pdf.font(F("MING")).fontSize(fs).fillColor(BLACK).text(String(n.content || ""), L + 16, y, {
      width: W - 32, lineGap: fs * 0.38,
    });
    y += pdf.heightOfString(String(n.content || ""), { width: W - 32, lineGap: fs * 0.38 }) + 14;
  }
  if (d.showBuyerSignLine && (d.notes || []).length) {
    y += 10;
    pdf.font(F("MING")).fontSize(12).text("買方簽名：＿＿＿＿＿＿＿＿＿", L + 16, y, { width: W - 56, align: "right" });
    y += 22;
  }
  return y;
}

/* ==========================================================
 * 裝修工程會辦單（配套戶；docs/裝修合約製作範本-spec.md §4.1）
 * 版面 = 簽約會辦單簡化版：無車位/土地持分/價款公式區，付款明細單列
 * ========================================================== */

function drawDecorationBreakdown(pdf, d, slotTop) {
  const { left: L, contentW: W } = pageMetrics(pdf);
  const pageBottom = pdf.page.height - MARGIN;
  let y = slotTop;
  const X = f => L + W * f;
  const FW = f => W * f;

  // ---- 標題 ----
  cell(pdf, L, y, W, 34, d.headerTitle || "裝修工程會辦單", { bold: true, size: 18, charSpace: 8 });
  y += 34;

  // ---- 基本資訊（3 列，同簽約會辦單）----
  const IF = [0, 0.13, 0.32, 0.435, 0.605, 0.74, 1];
  const infoRow = (cells, h = 28) => {
    for (const c of cells) {
      cell(pdf, X(IF[c.i0]), y, X(IF[c.i1]) - X(IF[c.i0]), h, c.t, c.o || {});
    }
    y += h;
  };
  infoRow([
    { i0: 0, i1: 1, t: "個案名稱", o: { bold: true, size: 10.5 } },
    { i0: 1, i1: 2, t: d.projectName || "", o: { size: 13 } },
    { i0: 2, i1: 3, t: "客戶姓名", o: { bold: true, size: 10.5 } },
    { i0: 3, i1: 4, t: d.buyerName || "", o: { size: 11.5 } },
    { i0: 4, i1: 5, t: "身分證字號", o: { bold: true, size: 10.5 } },
    { i0: 5, i1: 6, t: d.buyerIdNumber || "", o: { size: 11 } },
  ]);
  infoRow([
    { i0: 0, i1: 1, t: "房屋編號", o: { bold: true, size: 10.5 } },
    { i0: 1, i1: 2, t: d.unitId || "", o: { size: 13 } },
    { i0: 2, i1: 3, t: "總　價", o: { bold: true, size: 10.5 } },
    { i0: 3, i1: 4, t: fmtWan(d.totalPrice), o: { size: 13 } },
    { i0: 4, i1: 5, t: "聯絡電話", o: { bold: true, size: 10.5 } },
    { i0: 5, i1: 6, t: d.buyerPhone || "", o: { size: 11 } },
  ]);
  infoRow([
    { i0: 0, i1: 1, t: "地　址", o: { bold: true, size: 10.5 } },
    { i0: 1, i1: 4, t: d.address || "", o: { size: 10.5 } },
    { i0: 4, i1: 5, t: "簽約日期", o: { bold: true, size: 10.5 } },
    { i0: 5, i1: 6, t: d.signDate || "", o: { size: 10.5 } },
  ]);

  // ---- 面積區（無車位/土地持分：右欄僅「共有部份」，其餘留白）----
  const a = d.areas || {};
  const AH = 25;
  const areaRows = 6;
  const AF = { l0: 0, l1: 0.13, v1: 0.235, u1: 0.275, m0: 0.275, m1: 0.39, s1: 0.475, v2: 0.58, u2: 0.62, r0: 0.62, r1: 0.77, v3: 0.96, u3: 1 };
  const areaTop = y;
  cell(pdf, X(AF.l0), y, X(AF.l1) - X(AF.l0), AH * areaRows, "房屋總面積", { bold: true, size: 10.5 });
  cell(pdf, X(AF.l1), y, X(AF.v1) - X(AF.l1), AH * 3, fmtArea(a.houseTotalSqm), { size: 11 });
  cell(pdf, X(AF.v1), y, X(AF.u1) - X(AF.v1), AH * 3, "㎡", { size: 8.5 });
  cell(pdf, X(AF.l1), y + AH * 3, X(AF.v1) - X(AF.l1), AH * 3, fmtArea(a.houseTotalPing), { size: 11 });
  cell(pdf, X(AF.v1), y + AH * 3, X(AF.u1) - X(AF.v1), AH * 3, "坪", { size: 8.5 });

  const pairAt = (row, colDef) => {
    const py = areaTop + AH * row;
    const { x0, x1, sx, vx, ux, label, sub, sqm, ping, labelSize } = colDef;
    if (sx !== null) {
      cell(pdf, x0, py, x1 - x0, AH * 2, label, { bold: true, size: labelSize || 10 });
      cell(pdf, x1, py, sx - x1, AH, sub && sub[0] !== undefined ? sub[0] : "", { size: 8.5 });
      cell(pdf, x1, py + AH, sx - x1, AH, sub && sub[1] !== undefined ? sub[1] : "", { size: 8.5 });
      cell(pdf, sx, py, vx - sx, AH, fmtArea(sqm), { size: 10.5 });
      cell(pdf, vx, py, ux - vx, AH, "㎡", { size: 8.5 });
      cell(pdf, sx, py + AH, vx - sx, AH, fmtArea(ping), { size: 10.5 });
      cell(pdf, vx, py + AH, ux - vx, AH, "坪", { size: 8.5 });
    } else {
      cell(pdf, x0, py, x1 - x0, AH * 2, label, { bold: true, size: labelSize || 10 });
      cell(pdf, x1, py, vx - x1, AH, fmtArea(sqm), { size: 10.5 });
      cell(pdf, vx, py, ux - vx, AH, "㎡", { size: 8.5 });
      cell(pdf, x1, py + AH, vx - x1, AH, fmtArea(ping), { size: 10.5 });
      cell(pdf, vx, py + AH, ux - vx, AH, "坪", { size: 8.5 });
    }
  };

  pairAt(0, { x0: X(AF.m0), x1: X(AF.m1), sx: X(AF.s1), vx: X(AF.v2), ux: X(AF.u2), label: "主建物", sub: ["占比", a.mainRatioText || ""], sqm: a.mainSqm, ping: a.mainPing });
  pairAt(2, { x0: X(AF.m0), x1: X(AF.s1), sx: null, vx: X(AF.v2), ux: X(AF.u2), label: "附屬建物(陽台)", sqm: a.ancillarySqm, ping: a.ancillaryPing, labelSize: 9 });
  pairAt(4, { x0: X(AF.m0), x1: X(AF.s1), sx: null, vx: X(AF.v2), ux: X(AF.u2), label: "專有部分(合計)", sqm: a.exclusiveSqm, ping: a.exclusivePing, labelSize: 9 });
  // 右欄：僅共有部份，其餘留白
  pairAt(0, { x0: X(AF.r0), x1: X(AF.r1), sx: null, vx: X(AF.v3), ux: X(AF.u3), label: "共有部份", sqm: a.commonSqm, ping: a.commonPing });
  cell(pdf, X(AF.r0), areaTop + AH * 2, X(AF.u3) - X(AF.r0), AH * 4, "", {});
  y = areaTop + AH * areaRows;

  // ---- 付款明細區塊（單列「裝修工程款」＋備註列併入同一區塊，直排標籤跨全區）----
  const columns = (d.installment && d.installment.columns) || [];
  const remarkH = 60;
  if (columns.length) {
    const leaves = columns.reduce((s, c) => s + (c.type === "group" ? c.children.length : 1), 0);
    const vertW = 20;
    const labelW = 52;
    const totalW = 47;
    const leafW = (W - vertW - labelW - totalW) / Math.max(leaves, 1);
    const nfs = leafW < 26 ? 6.5 : leafW < 34 ? 7.2 : 8;
    const H1 = 17, H2 = 14, DH = 24;
    const blockH = H1 + H2 + DH + remarkH;   // 直排「付款明細」涵蓋期款列與備註列
    const bx = L + vertW;

    vCell(pdf, L, y, vertW, blockH, "付款明細", { bold: true, size: 10 });

    cell(pdf, bx, y, labelW, H1 + H2, "單位:萬", { bold: true, size: 8 });
    let hx = bx + labelW;
    for (const col of columns) {
      if (col.type === "group") {
        const gw = leafW * col.children.length;
        cell(pdf, hx, y, gw, H1, col.name, { bold: true, size: 9 });
        col.children.forEach((c2, j) => {
          cell(pdf, hx + leafW * j, y + H1, leafW, H2, c2.seq !== null && c2.seq !== undefined ? String(c2.seq) : String(j + 1), { size: 7.5, bold: true });
        });
        hx += gw;
      } else {
        cell(pdf, hx, y, leafW, H1 + H2, col.name, { bold: true, size: nfs, padX: 1 });
        hx += leafW;
      }
    }
    cell(pdf, hx, y, totalW, H1 + H2, "總價", { bold: true, size: 9.5 });
    y += H1 + H2;

    cell(pdf, bx, y, labelW, DH, d.installment.rowLabel || "裝修工程款", { size: 8, bold: true, padX: 2 });
    let cx = bx + labelW;
    for (const col of columns) {
      const leavesArr = col.type === "group" ? col.children : [col];
      for (const lf of leavesArr) {
        cell(pdf, cx, y, leafW, DH, fmtWan(lf.amount), { size: nfs, padX: 1 });
        cx += leafW;
      }
    }
    cell(pdf, cx, y, totalW, DH, fmtWan(d.installment.grandTotal), { size: 8.5, bold: true, padX: 2 });
    y += DH;

    // 備註列（同區塊：標籤欄對齊「單位:萬」欄，內容跨其餘欄）
    cell(pdf, bx, y, labelW, remarkH, "備註", { bold: true, size: 9 });
    pdf.lineWidth(0.7).rect(bx + labelW, y, W - vertW - labelW, remarkH).stroke(BLACK);
    if (d.remark) {
      pdf.font(F("HEI")).fontSize(9).fillColor(BLACK)
        .text(String(d.remark), bx + labelW + 5, y + 5, { width: W - vertW - labelW - 10 });
    }
    y += remarkH;
  } else {
    // 無期款資料：備註獨立列
    cell(pdf, L, y, FW(0.13), remarkH, "備註", { bold: true, size: 10 });
    pdf.lineWidth(0.7).rect(X(0.13), y, FW(0.87), remarkH).stroke(BLACK);
    if (d.remark) {
      pdf.font(F("HEI")).fontSize(9).fillColor(BLACK)
        .text(String(d.remark), X(0.13) + 5, y + 5, { width: FW(0.87) - 10 });
    }
    y += remarkH;
  }

  // ---- 簽核欄（貼齊頁底，中間留白由外框涵蓋）----
  const signFields = d.signFields || [];
  const signH = signFields.length ? 18 + 32 : 0;
  let signTop = pageBottom - signH;
  if (signTop < y) signTop = y;
  if (signFields.length) {
    const sw = W / signFields.length;
    signFields.forEach((f, i) => {
      cell(pdf, L + sw * i, signTop, sw, 18, f.label, { bold: true, size: 10.5 });
    });
    signFields.forEach((f, i) => {
      cell(pdf, L + sw * i, signTop + 18, sw, 32, f.value || "", { size: 11 });
    });
  }
  y = signTop + signH;

  // ---- 整頁外框（加粗）----
  pdf.lineWidth(1.3).rect(L, slotTop, W, y - slotTop).stroke(BLACK);
  return y;
}

/* ==========================================================
 * 裝修付款明細表（明體、國字大寫；docs/裝修合約製作範本-spec.md §4.2）
 * ========================================================== */

function drawDecorationPaymentDetail(pdf, d, slotTop) {
  const { left: L, contentW: W } = pageMetrics(pdf);
  let y = slotTop + 6;

  // 表頭：工地名稱 + 標題、房屋代號
  pdf.font(F("MING")).fontSize(11.5).fillColor(BLACK);
  pdf.text(`${d.siteLabel || "工地名稱"}：`, L + 8, y);
  pdf.text(d.projectName || "", L + 86, y);
  pdf.font(F("MING-B")).fontSize(13).text(d.headerTitle || "裝修付款明細表", L, y - 1, { width: W, align: "center", characterSpacing: 3 });
  y += 26;
  pdf.font(F("MING")).fontSize(11.5).text(`${d.unitLabel || "房屋代號"}：`, L + 8, y);
  pdf.text(d.unitId || "", L + 86, y);
  y += 34;

  // 工程總價（國字大寫）
  pdf.font(F("MING-B")).fontSize(12.5);
  pdf.text("工程總價", L + 8, y);
  pdf.text(`計新臺幣 ${d.zhTotal || ""}`, L + 96, y);
  y += 30;

  // 期款清單（每期一列：國字序號、期別名稱：新台幣：國字大寫）
  const rows = d.rows || [];
  const RH = 24;
  for (const row of rows) {
    pdf.font(F("MING")).fontSize(11.5).fillColor(BLACK);
    pdf.text(`${row.zhSeq}、`, L + 8, y, { width: 46, align: "right" });
    pdf.text(String(row.name || ""), L + 58, y);
    pdf.text(`：新台幣：${row.zhAmount || ""}`, L + 196, y);
    y += RH;
  }

  if (d.noteText) {
    y += 10;
    pdf.font(F("MING")).fontSize(8.5).fillColor(BLACK).text(String(d.noteText), L + 8, y, { width: W - 16 });
    y += pdf.heightOfString(String(d.noteText), { width: W - 16 }) + 4;
  }
  return y;
}

/* ==========================================================
 * 合約數字對照表（富宇首馥・房地分開合約；docs/合約數字對照表-spec.md）
 * data.houseRows / landRows：每列 cells = [{ t, blue, bold, w }]（前端 contractDocModel 組好）
 * 藍字 = 蓋章內容（印泥藍）；warnings 僅前端預覽顯示，此處不渲染
 * ========================================================== */

function drawStampRow(pdf, x, y, w, h, cells, sizes) {
  const list = Array.isArray(cells) ? cells : [];
  const totalW = list.reduce((s, c) => s + (Number(c.w) || 1), 0) || 1;
  let cx = x;
  list.forEach((c, i) => {
    // 末格吃掉浮點誤差，貼齊右框線
    const cw = i === list.length - 1 ? x + w - cx : w * (Number(c.w) || 1) / totalW;
    const padX = 1;
    // 字級自動縮放至格寬塞得下（禁止換行，避免多行撐爆列高觸發 pdfkit 自動換頁）
    const baseSize = c.blue ? sizes.blue : sizes.black;
    const fontName = F(c.blue || c.bold ? "HEI-B" : "HEI");
    let size = baseSize;
    pdf.font(fontName).fontSize(size);
    while (size > 6 && pdf.widthOfString(c.t || "") > cw - padX * 2) {
      size -= 0.5;
      pdf.fontSize(size);
    }
    cell(pdf, cx, y, cw, h, c.t, {
      size,
      bold: c.blue || c.bold,
      color: c.blue ? STAMP_BLUE : BLACK,
      padX,
      noWrap: true,
      // 楷體無粗體字重（KAI-B 同檔），藍字以同色描邊仿粗體
      fauxBold: c.blue,
      fauxBoldWidth: 0.5,
    });
    cx += cw;
  });
}

function drawContractNumberTable(pdf, d, slotTop) {
  // 本頁型獨立縮小邊界（16pt），讓蓋章藍字放大呈現
  const M2 = 16;
  const L = M2;
  const W = pdf.page.width - M2 * 2;
  const TITLE_H = 22;
  const GAP = 8;
  let y = Math.max(M2, slotTop - (MARGIN - M2));

  // pdfkit 於文字超過當頁 bottom margin 時會自動換頁（造成爆頁），本頁使用縮小邊界需同步下修
  pdf.page.margins.bottom = 8;

  // 區塊（房地分開＝2 區、房地合一＝1 區）；舊 payload（houseRows/landRows）相容
  const sections = Array.isArray(d.sections) && d.sections.length
    ? d.sections
    : [
      { title: d.houseTitle || "房屋合約 (一般合約)", rows: d.houseRows || [] },
      { title: d.landTitle || "土地合約", rows: d.landRows || [] },
    ];

  // 列高依總列數自適應（3 個以上車位增列時自動縮小，避免爆頁）
  const rowCount = sections.reduce((s, sec) => s + (sec.rows || []).length, 0);
  const avail = pdf.page.height - M2 - y - TITLE_H * sections.length - GAP * (sections.length - 1);
  const RH = Math.min(20.5, Math.max(14, Math.floor((avail / Math.max(rowCount, 1)) * 10) / 10));
  const sizes = RH >= 18 ? { blue: 13, black: 9 } : { blue: 11.5, black: 8 };

  sections.forEach((sec, si) => {
    if (si > 0) y += GAP;
    cell(pdf, L, y, W, TITLE_H, sec.title || "", { bold: true, size: 14, border: false, charSpace: 2 });
    y += TITLE_H;
    const top = y;
    for (const row of sec.rows || []) {
      drawStampRow(pdf, L, y, W, RH, row.cells, sizes);
      y += RH;
    }
    pdf.lineWidth(1.2).rect(L, top, W, y - top).stroke(BLACK);
  });
  return y;
}

/* ==========================================================
 * PDF 主流程（repeatCount：等分頁面、槽間裁切虛線）
 * ========================================================== */

async function buildContractPdf(payload, attachmentFiles = []) {
  const pages = (payload.pages || []).filter(p => p.type !== "contractAttachments");
  const attachmentPages = (payload.pages || []).filter(p => p.type === "contractAttachments");

  const pdf = new PDFDocument({ autoFirstPage: false, margin: MARGIN });
  for (const [name, file] of Object.entries(FONTS)) pdf.registerFont(name, file);

  const chunks = [];
  const done = new Promise((resolve, reject) => {
    pdf.on("data", c => chunks.push(c));
    pdf.on("end", () => resolve(Buffer.concat(chunks)));
    pdf.on("error", reject);
  });

  for (const page of pages) {
    const size = PAPER_PT[page.paper?.size] ? (page.paper.size === "Letter" ? "LETTER" : page.paper.size) : "A4";
    const layout = page.paper?.orientation === "landscape" ? "landscape" : "portrait";
    const pageCopies = Math.max(1, Math.min(10, Number(page.pageCopies) || 1));
    pageFontOverride = PAGE_FONT_FAMILY[page.font] || null;   // 本頁字體覆蓋

    // 重複頁數：整頁內容複製 N 頁
    for (let pc = 0; pc < pageCopies; pc++) {
      pdf.addPage({ size, layout, margins: { top: MARGIN, bottom: MARGIN, left: MARGIN, right: MARGIN } });

      const repeat = Math.max(1, Math.min(3, Number(page.repeatCount) || 1));
      const contentH = pdf.page.height - MARGIN * 2;
      const slotH = contentH / repeat;

      for (let copy = 0; copy < repeat; copy++) {
        const slotTop = MARGIN + slotH * copy;
        if (copy > 0) {
          // 槽間裁切虛線
          pdf.moveTo(MARGIN, slotTop - 1)
            .lineTo(pdf.page.width - MARGIN, slotTop - 1)
            .dash(3, { space: 3 }).lineWidth(0.6).stroke("#999999").undash();
        }
        drawPageContent(pdf, page, slotTop, slotH);
      }
    }
  }
  pageFontOverride = null;

  pdf.end();
  const baseBuffer = await done;

  if (!attachmentPages.length || !attachmentFiles.length) return baseBuffer;
  return mergeAttachments(baseBuffer, attachmentFiles);
}

function drawPageContent(pdf, page, slotTop, slotH) {
  const d = page.data || {};
  switch (page.type) {
    case "breakdown":
      return drawBreakdown(pdf, d, slotTop);
    case "paymentDetail":
      return drawPaymentDetail(pdf, d, slotTop);
    case "bankAccounts":
      return drawBankAccounts(pdf, d, slotTop, slotH, dataUrlToBuffer(d.qrDataUrl));
    case "contractNotes":
      return drawContractNotes(pdf, d, slotTop, slotH);
    case "decorationBreakdown":
      return drawDecorationBreakdown(pdf, d, slotTop);
    case "decorationPaymentDetail":
      return drawDecorationPaymentDetail(pdf, d, slotTop);
    case "contractNumberTable":
    case "contractNumberTableCombined":
      return drawContractNumberTable(pdf, d, slotTop);
    default:
      return slotTop;
  }
}

/** pdf-lib 合併附圖（PDF 依頁碼範圍；圖片各佔一頁，依附圖頁紙張設定） */
async function mergeAttachments(baseBuffer, attachmentFiles) {
  const { PDFDocument: PdfLibDocument } = require("pdf-lib");
  const merged = await PdfLibDocument.load(baseBuffer);

  for (const file of attachmentFiles) {
    if (!file || !file.buffer) continue;
    try {
      const isPdf = (file.mimeType || "").includes("pdf") || /\.pdf$/i.test(file.fileName || "");
      if (isPdf) {
        const src = await PdfLibDocument.load(file.buffer, { ignoreEncryption: true });
        const indices = parsePageRange(file.pageRange, src.getPageCount());
        const copied = await merged.copyPages(src, indices);
        copied.forEach(p => merged.addPage(p));
      } else {
        const isPng = (file.mimeType || "").includes("png") || /\.png$/i.test(file.fileName || "");
        const img = isPng ? await merged.embedPng(file.buffer) : await merged.embedJpg(file.buffer);
        // 依圖片方向決定紙張方向（橫圖 → A4 橫式，比照合約圖範本）
        const landscape = img.width > img.height;
        const pageW = landscape ? 841.89 : 595.28;
        const pageH = landscape ? 595.28 : 841.89;
        const margin = 20;
        const page = merged.addPage([pageW, pageH]);
        const scale = Math.min((pageW - margin * 2) / img.width, (pageH - margin * 2) / img.height);
        const w = img.width * scale, h = img.height * scale;
        page.drawImage(img, { x: (pageW - w) / 2, y: (pageH - h) / 2, width: w, height: h });
      }
    } catch (e) {
      console.warn(`[contractDocument] 附圖合併失敗（${file.fileName}）：`, e.message);
      throw new Error(`附圖「${file.fileName}」合併失敗：${e.message}`);
    }
  }

  const out = await merged.save();
  return Buffer.from(out);
}

/* ==========================================================
 * EXCEL 產製（每頁一個 worksheet；附圖頁跳過）
 * ========================================================== */

const FONT_HEI = "微軟正黑體";
const FONT_MING = "新細明體";
const FONT_KAI = "標楷體";

// Excel 頁面字體覆蓋（同 PDF：config.pages[].font）
const EXCEL_FONT_FAMILY = { ming: FONT_MING, hei: FONT_HEI, kai: FONT_KAI };
let excelFontOverride = null;

function borderAll(style = "thin") {
  return {
    top: { style }, bottom: { style },
    left: { style }, right: { style },
  };
}

function setCell(ws, row, col, value, opts = {}) {
  const cellRef = ws.getCell(row, col);
  cellRef.value = value;
  cellRef.font = {
    name: excelFontOverride || opts.fontName || FONT_HEI,
    size: opts.size || 10,
    bold: !!opts.bold,
    color: { argb: opts.color || "FF000000" },
  };
  cellRef.alignment = {
    horizontal: opts.align || "center",
    vertical: opts.vAlign || "middle",
    wrapText: opts.wrap !== false,
  };
  if (opts.border !== false) cellRef.border = borderAll(opts.borderStyle || "thin");
  return cellRef;
}

/** merge + set（避免 merge 後取錯格；合併衝突時降級為不合併，不讓整份產製失敗） */
function setMerged(ws, r1, c1, r2, c2, value, opts = {}) {
  if (r2 > r1 || c2 > c1) {
    try {
      ws.mergeCells(r1, c1, r2, c2);
    } catch (e) {
      console.warn(`[contractDocument] Excel 合併衝突（r${r1}c${c1}-r${r2}c${c2}），改為不合併：`, e.message);
    }
  }
  // 合併範圍每格都補框線（exceljs 合併後只有左上格有框）
  if (opts.border !== false) {
    for (let r = r1; r <= r2; r++) {
      for (let c = c1; c <= c2; c++) {
        ws.getCell(r, c).border = borderAll(opts.borderStyle || "thin");
      }
    }
  }
  return setCell(ws, r1, c1, value, opts);
}

function setupSheet(wb, page, index, copyIndex = 0) {
  const copySuffix = copyIndex > 0 ? `(${copyIndex + 1})` : "";
  const rawName = `${index + 1}-${page.title || page.type}${copySuffix}`.replace(/[\\/?*[\]:]/g, "");
  const ws = wb.addWorksheet(rawName.slice(0, 31), {
    pageSetup: {
      paperSize: EXCEL_PAPER[page.paper?.size] || 9,
      orientation: page.paper?.orientation === "landscape" ? "landscape" : "portrait",
      fitToPage: true, fitToWidth: 1, fitToHeight: 1,
      margins: { left: 0.35, right: 0.35, top: 0.45, bottom: 0.45, header: 0.2, footer: 0.2 },
      horizontalCentered: true,
    },
  });
  return ws;
}

/* ---------- 拆款表（動態欄格線：付款明細葉欄決定欄數） ---------- */

function excelBreakdown(ws, d) {
  const columns = (d.installment && d.installment.columns) || [];
  const leaves = columns.reduce((s, c) => s + (c.type === "group" ? c.children.length : 1), 0);
  // 固定 160 欄細格線：所有區塊以「比例」對應欄位範圍，
  // 邊界間距遠大於取整誤差，不會出現合併範圍碰撞（欄數與期款數無關）。
  const ncols = 160;
  ws.columns = Array.from({ length: ncols }, () => ({ width: 0.62 }));

  const colAt = f => Math.min(ncols, Math.max(1, 1 + Math.round(f * ncols)));
  // frac 區段 [f0,f1) → [colAt(f0), colAt(f1)-1]
  const seg = (f0, f1) => [colAt(f0), Math.max(colAt(f0), colAt(f1) - 1)];

  let r = 1;
  // 標題
  ws.getRow(r).height = 30;
  setMerged(ws, r, 1, r, ncols, d.headerTitle || "簽約會辦單", { bold: true, size: 16 });
  r += 1;

  // 基本資訊
  const IF = [0, 0.13, 0.32, 0.435, 0.605, 0.74, 1];
  const infoRow = (items, h = 24) => {
    ws.getRow(r).height = h;
    items.forEach(([i0, i1, text, o]) => {
      const [c1, c2] = [colAt(IF[i0]), Math.max(colAt(IF[i0]), colAt(IF[i1]) - 1)];
      setMerged(ws, r, c1, r, c2, text, o || {});
    });
    r += 1;
  };
  infoRow([
    [0, 1, "個案名稱", { bold: true }], [1, 2, d.projectName || "", { size: 12 }],
    [2, 3, "客戶姓名", { bold: true }], [3, 4, d.buyerName || "", { size: 11 }],
    [4, 5, "身分證字號", { bold: true }], [5, 6, d.buyerIdNumber || "", { size: 10 }],
  ]);
  infoRow([
    [0, 1, "房屋編號", { bold: true }], [1, 2, d.unitId || "", { size: 12 }],
    [2, 3, "總　價", { bold: true }], [3, 4, fmtWan(d.totalPrice), { size: 12 }],
    [4, 5, "聯絡電話", { bold: true }], [5, 6, d.buyerPhone || "", { size: 10 }],
  ]);
  infoRow([
    [0, 1, "地　址", { bold: true }], [1, 4, d.address || "", { size: 10, align: "left" }],
    [4, 5, "簽約日期", { bold: true }], [5, 6, d.signDate || "", { size: 10 }],
  ]);

  // 車位區
  const spots = (d.parkingSpots && d.parkingSpots.length) ? d.parkingSpots : [{ label: "無", price: null }];
  const parkRows = Math.max(spots.length, 2);
  const rightPairs = [
    ["房地價款", d.housePlusLandPrice],
    ["車位價款", d.parkingTotal],
  ];
  const parkTop = r;
  for (let i = 0; i < parkRows; i++) {
    ws.getRow(r).height = 20;
    const p = spots[i];
    const [t1, t2] = seg(0.13, 0.63);
    setMerged(ws, r, t1, r, t2, p ? (p.label || "") : "", { size: 10 });
    const [p1, p2] = seg(0.63, 0.735);
    setMerged(ws, r, p1, r, p2, p && p.price !== null && p.price !== undefined ? `價款 ${fmtWan(p.price)} 萬` : "", { size: 9 });
    const rp = rightPairs[i];
    const [l1, l2] = seg(0.735, 0.855);
    setMerged(ws, r, l1, r, l2, rp ? rp[0] : "", { bold: true, size: 9 });
    const [v1, v2] = seg(0.855, 0.955);
    setMerged(ws, r, v1, r, v2, rp ? fmtWan(rp[1]) : "", { size: 11 });
    const [u1, u2] = seg(0.955, 1);
    setMerged(ws, r, u1, r, u2, rp ? "萬" : "", { size: 9 });
    r += 1;
  }
  const [pk1, pk2] = seg(0, 0.13);
  setMerged(ws, parkTop, pk1, r - 1, pk2, "車位編號", { bold: true });

  // 面積區（6 列）
  const a = d.areas || {};
  const AF = { l1: 0.13, v1: 0.235, u1: 0.275, m1: 0.39, s1: 0.475, v2: 0.58, u2: 0.62, r1: 0.77, v3: 0.96 };
  const areaTop = r;
  for (let i = 0; i < 6; i++) ws.getRow(r + i).height = 20;

  const [al1, al2] = seg(0, AF.l1);
  setMerged(ws, areaTop, al1, areaTop + 5, al2, "房屋總面積", { bold: true });
  const [av1, av2] = seg(AF.l1, AF.v1);
  const [au1, au2] = seg(AF.v1, AF.u1);
  setMerged(ws, areaTop, av1, areaTop + 2, av2, fmtArea(a.houseTotalSqm), { size: 11 });
  setMerged(ws, areaTop, au1, areaTop + 2, au2, "㎡", { size: 9 });
  setMerged(ws, areaTop + 3, av1, areaTop + 5, av2, fmtArea(a.houseTotalPing), { size: 11 });
  setMerged(ws, areaTop + 3, au1, areaTop + 5, au2, "坪", { size: 9 });

  const pairXl = (row, labelF0, labelF1, subF, valF, unitF, label, sub, sqm, ping) => {
    const rr = areaTop + row;
    const [c1, c2] = seg(labelF0, subF !== null ? labelF1 : (labelF1 === AF.m1 ? AF.s1 : labelF1));
    setMerged(ws, rr, c1, rr + 1, c2, label, { bold: true, size: 9.5 });
    if (subF !== null) {
      const [s1, s2] = seg(labelF1, subF);
      setMerged(ws, rr, s1, rr, s2, sub && sub[0] !== undefined ? sub[0] : "", { size: 9 });
      setMerged(ws, rr + 1, s1, rr + 1, s2, sub && sub[1] !== undefined ? sub[1] : "", { size: 9 });
    }
    const vf0 = subF !== null ? subF : labelF1 === AF.m1 ? AF.s1 : labelF1;
    const [v1c, v2c] = seg(vf0, valF);
    const [u1c, u2c] = seg(valF, unitF);
    setMerged(ws, rr, v1c, rr, v2c, fmtArea(sqm), { size: 10 });
    setMerged(ws, rr, u1c, rr, u2c, "㎡", { size: 9 });
    setMerged(ws, rr + 1, v1c, rr + 1, v2c, fmtArea(ping), { size: 10 });
    setMerged(ws, rr + 1, u1c, rr + 1, u2c, "坪", { size: 9 });
  };

  pairXl(0, AF.u1, AF.m1, AF.s1, AF.v2, AF.u2, "主建物", ["占比", a.mainRatioText || ""], a.mainSqm, a.mainPing);
  pairXl(2, AF.u1, AF.s1, null, AF.v2, AF.u2, "附屬建物(陽台)", null, a.ancillarySqm, a.ancillaryPing);
  pairXl(4, AF.u1, AF.s1, null, AF.v2, AF.u2, "專有部分(合計)", null, a.exclusiveSqm, a.exclusivePing);
  pairXl(0, AF.u2, AF.r1, null, AF.v3, 1, "共有部份", null, a.commonSqm, a.commonPing);
  pairXl(2, AF.u2, AF.r1, null, AF.v3, 1, "車位", null, a.parkingAreaSqm, a.parkingAreaPing);
  pairXl(4, AF.u2, AF.r1, null, AF.v3, 1,
    a.landShareRatio ? `土地持分\n${a.landShareRatio}/100000` : "土地持分",
    null, a.landShareSqm, a.landSharePing);
  r = areaTop + 6;

  if (Number(a.terracePing) > 0) {
    ws.getRow(r).height = 18;
    const [t1, t2] = seg(0, 0.275);
    setMerged(ws, r, t1, r, t2, "露臺(不計坪)", { bold: true, size: 9.5 });
    const [t3, t4] = seg(0.275, 0.58);
    setMerged(ws, r, t3, r, t4, `${fmtArea(a.terracePing)} 坪`, { size: 10 });
    const [t5, t6] = seg(0.58, 1);
    setMerged(ws, r, t5, r, t6, "");
    r += 1;
  }

  // 價款區
  const priceFields = d.priceFields || [];
  const byKey = Object.fromEntries(priceFields.map(f => [f.key, f]));
  const fValX = f => (f ? (f.error ? "公式錯誤" : `${f.label}：  ${fmtWan1(f.value)}萬`) : "");
  const KNOWN = ["houseAmount", "mainAmount", "ancillaryAmount", "exclusiveAmount", "commonAmount"];
  if (KNOWN.every(k => byKey[k])) {
    ws.getRow(r).height = 20;
    ws.getRow(r + 1).height = 20;
    const [h1, h2] = seg(0, 0.22);
    setMerged(ws, r, h1, r + 1, h2, fValX(byKey.houseAmount), { size: 10, align: "left" });
    const [m1, m2] = seg(0.22, 0.52);
    setMerged(ws, r, m1, r, m2, fValX(byKey.mainAmount), { size: 9.5, align: "left" });
    setMerged(ws, r + 1, m1, r + 1, m2, fValX(byKey.ancillaryAmount), { size: 9, align: "left" });
    const [e1, e2] = seg(0.52, 0.76);
    setMerged(ws, r, e1, r + 1, e2, fValX(byKey.exclusiveAmount), { size: 9.5, align: "left" });
    const [c1, c2] = seg(0.76, 1);
    setMerged(ws, r, c1, r + 1, c2, fValX(byKey.commonAmount), { size: 9.5, align: "left" });
    r += 2;
    const extras = priceFields.filter(f => !KNOWN.includes(f.key));
    for (let i = 0; i < extras.length; i += 3) {
      const rowF = extras.slice(i, i + 3);
      ws.getRow(r).height = 18;
      rowF.forEach((f, j) => {
        const [x1, x2] = seg(j / rowF.length, (j + 1) / rowF.length);
        setMerged(ws, r, x1, r, x2, fValX(f), { size: 9.5, align: "left" });
      });
      r += 1;
    }
  } else if (priceFields.length) {
    for (let i = 0; i < priceFields.length; i += 3) {
      const rowF = priceFields.slice(i, i + 3);
      ws.getRow(r).height = 18;
      rowF.forEach((f, j) => {
        const [x1, x2] = seg(j / rowF.length, (j + 1) / rowF.length);
        setMerged(ws, r, x1, r, x2, fValX(f), { size: 9.5, align: "left" });
      });
      r += 1;
    }
  }

  // 付款明細（橫式；比例式欄位範圍，與期款數無關）
  if (columns.length) {
    const VF = 0.038;                 // 直排「付款明細」
    const LF = 0.126;                 // 「單位:萬」/ 列標籤 右界
    const TF = 0.912;                 // 「總價」左界
    const leafF = (TF - LF) / Math.max(leaves, 1);
    const leafSeg = i => seg(LF + leafF * i, LF + leafF * (i + 1));

    ws.getRow(r).height = 16;
    ws.getRow(r + 1).height = 14;
    // 直排標籤（跨表頭 2 列 + 3 資料列 + 比例列 = 6 列）
    const [v1, v2] = seg(0, VF);
    setMerged(ws, r, v1, r + 5, v2, "付\n款\n明\n細", { bold: true, size: 9 });
    const [u1c, u2c] = seg(VF, LF);
    setMerged(ws, r, u1c, r + 1, u2c, "單位:萬", { bold: true, size: 8 });
    let leafIdx = 0;
    for (const col of columns) {
      if (col.type === "group") {
        const [g1] = leafSeg(leafIdx);
        const [, g2] = leafSeg(leafIdx + col.children.length - 1);
        setMerged(ws, r, g1, r, g2, col.name, { bold: true, size: 9 });
        col.children.forEach((ch, j) => {
          const [s1, s2] = leafSeg(leafIdx + j);
          setMerged(ws, r + 1, s1, r + 1, s2, ch.seq !== null && ch.seq !== undefined ? ch.seq : j + 1, { bold: true, size: 8 });
        });
        leafIdx += col.children.length;
      } else {
        const [s1, s2] = leafSeg(leafIdx);
        setMerged(ws, r, s1, r + 1, s2, col.name, { bold: true, size: 8 });
        leafIdx += 1;
      }
    }
    const [t1, t2] = seg(TF, 1);
    setMerged(ws, r, t1, r + 1, t2, "總價", { bold: true, size: 9 });
    r += 2;

    const dataRowXl = (label, picker, total, bold = false) => {
      ws.getRow(r).height = 18;
      const [a1, a2] = seg(VF, LF);
      setMerged(ws, r, a1, r, a2, label, { bold: true, size: 8.5 });
      let li = 0;
      for (const col of columns) {
        const arr = col.type === "group" ? col.children : [col];
        for (const lf of arr) {
          const [s1, s2] = leafSeg(li);
          setMerged(ws, r, s1, r, s2, Math.round(Number(picker(lf)) * 100) / 100, { size: 8.5, bold });
          li += 1;
        }
      }
      const [x1, x2] = seg(TF, 1);
      setMerged(ws, r, x1, r, x2, Math.round(Number(total) * 100) / 100, { size: 8.5, bold: true });
      r += 1;
    };
    dataRowXl(`房屋 ${fmtPercent(d.housePriceRatio)}`, x => x.houseAmount, d.installment.houseTotal);
    dataRowXl(`土地 ${fmtPercent(d.landPriceRatio)}`, x => x.landAmount, d.installment.landTotal);
    dataRowXl("合計", x => x.amount, d.installment.grandTotal, true);

    // 比例列（前導 single 合併）
    ws.getRow(r).height = 14;
    const [p1, p2] = seg(VF, LF);
    setMerged(ws, r, p1, r, p2, "");
    let li = 0;
    let idx = 0;
    let leadPercent = 0, leadCount = 0;
    while (idx < columns.length && columns[idx].type !== "group") {
      leadPercent += Number(columns[idx].percent) || 0;
      leadCount += 1;
      idx += 1;
    }
    if (leadCount > 0) {
      const [s1] = leafSeg(0);
      const [, s2] = leafSeg(leadCount - 1);
      setMerged(ws, r, s1, r, s2, fmtPercent(leadPercent), { size: 8 });
      li = leadCount;
    }
    for (; idx < columns.length; idx++) {
      const col = columns[idx];
      const span = col.type === "group" ? col.children.length : 1;
      const [s1] = leafSeg(li);
      const [, s2] = leafSeg(li + span - 1);
      setMerged(ws, r, s1, r, s2, fmtPercent(col.percent), { size: 8 });
      li += span;
    }
    const [q1, q2] = seg(TF, 1);
    setMerged(ws, r, q1, r, q2, "100%", { size: 8, bold: true });
    r += 1;
  }

  // 備註
  ws.getRow(r).height = 18;
  const [b1, b2] = seg(0, 0.13);
  setMerged(ws, r, b1, r, b2, "備註", { bold: true });
  const [b3, b4] = seg(0.13, 1);
  setMerged(ws, r, b3, r, b4, d.remark || "", { align: "left" });
  r += 1;

  // 磋商條款
  const clauses = d.clauses || [];
  if (clauses.length) {
    const text = clauses.map(cl => cl.content).join("\n\n");
    const lines = text.split("\n").reduce((s, line) => s + Math.max(1, Math.ceil(line.length / 60)), 0);
    setMerged(ws, r, 1, r, ncols, text, { size: 9, align: "left", vAlign: "top", border: false });
    ws.getRow(r).height = Math.max(60, lines * 13 + 10);
    r += 1;
  }

  // 自由欄位（右半）
  const freeFields = d.freeFields || [];
  if (freeFields.length) {
    ws.getRow(r).height = 15;
    ws.getRow(r + 1).height = 17;
    const startF = 0.45;
    freeFields.forEach((f, i) => {
      const f0 = startF + (1 - startF) * (i / freeFields.length);
      const f1 = startF + (1 - startF) * ((i + 1) / freeFields.length);
      const [x1, x2] = seg(f0, f1);
      setMerged(ws, r, x1, r, x2, f.label, { bold: true, size: 9 });
      const emptyVal = f.value === null || f.value === undefined || f.value === "";
      setMerged(ws, r + 1, x1, r + 1, x2, emptyVal ? "" : (f.type === "number" ? fmtWan(f.value) : String(f.value)), { size: 9.5 });
    });
    r += 2;
  }

  // 簽核欄
  const signFields = d.signFields || [];
  if (signFields.length) {
    ws.getRow(r).height = 17;
    ws.getRow(r + 1).height = 28;
    signFields.forEach((f, i) => {
      const [x1, x2] = seg(i / signFields.length, (i + 1) / signFields.length);
      setMerged(ws, r, x1, r, x2, f.label, { bold: true, size: 10 });
      setMerged(ws, r + 1, x1, r + 1, x2, f.value || "", { size: 11 });
    });
    r += 2;
  }

  // 外框加粗
  const lastRow = r - 1;
  for (let c = 1; c <= ncols; c++) {
    const top = ws.getCell(1, c);
    top.border = { ...(top.border || {}), top: { style: "medium" } };
    const bot = ws.getCell(lastRow, c);
    bot.border = { ...(bot.border || {}), bottom: { style: "medium" } };
  }
  for (let rr = 1; rr <= lastRow; rr++) {
    const lft = ws.getCell(rr, 1);
    lft.border = { ...(lft.border || {}), left: { style: "medium" } };
    const rgt = ws.getCell(rr, ncols);
    rgt.border = { ...(rgt.border || {}), right: { style: "medium" } };
  }
}

/* ---------- 付款明細表 ---------- */

function excelPaymentDetail(ws, d) {
  ws.columns = [{ width: 4 }, { width: 5 }, { width: 26 }, { width: 14 }, { width: 14 }, { width: 16 }];
  const mode = d.mode || "combined";
  const showHouse = mode !== "land";
  const showLand = mode !== "house" && mode !== "package";
  const houseColLabel = mode === "package" ? "配套款" : "房屋款";
  const title = mode === "house" ? "房屋付款明細表"
    : mode === "land" ? "土地付款明細表"
    : mode === "package" ? "配套款付款明細表"
    : "付款明細表";
  const M = { fontName: FONT_MING };

  let r = 1;
  ws.getRow(r).height = 22;
  setMerged(ws, r, 1, r, 2, "工地名稱：", { ...M, size: 11, border: false, align: "left" });
  setCell(ws, r, 3, d.projectName || "", { ...M, size: 11, border: false, align: "left" });
  setMerged(ws, r, 4, r, 6, title, { ...M, size: 12, border: false, align: "left" });
  r += 1;
  ws.getRow(r).height = 20;
  setMerged(ws, r, 1, r, 2, "房屋代號：", { ...M, size: 11, border: false, align: "left" });
  setCell(ws, r, 3, d.unitId || "", { ...M, size: 11, border: false, align: "left" });
  const lastCol = 3 + (showHouse ? 1 : 0) + (showLand ? 1 : 0) + (d.showSignColumn ? 1 : 0);
  setCell(ws, r, lastCol, "單位:元", { ...M, size: 9, border: false, align: "right" });
  r += 1;

  // 表頭
  ws.getRow(r).height = 20;
  setMerged(ws, r, 1, r, 3, "期別名稱", { ...M, size: 11 });
  let c = 4;
  if (showHouse) { setCell(ws, r, c, houseColLabel, { ...M, size: 11 }); c += 1; }
  if (showLand) { setCell(ws, r, c, "土地款", { ...M, size: 11 }); c += 1; }
  if (d.showSignColumn) setCell(ws, r, c, "收款人簽章", { ...M, size: 11 });
  r += 1;

  const amountsXl = (row) => {
    let cc = 4;
    if (showHouse) { setCell(ws, r, cc, fmtYuan(row.houseAmount), { ...M, size: 10.5, align: "right" }); cc += 1; }
    if (showLand) { setCell(ws, r, cc, fmtYuan(row.landAmount), { ...M, size: 10.5, align: "right" }); cc += 1; }
    if (d.showSignColumn) setCell(ws, r, cc, "", {});
  };

  const rows = d.rows || [];
  let i = 0;
  while (i < rows.length) {
    const row = rows[i];
    if (row.groupName && row.groupIndex === 0) {
      const start = r;
      for (const gr of rows.slice(i, i + row.groupSize)) {
        ws.getRow(r).height = 24;
        setCell(ws, r, 2, gr.seq !== null && gr.seq !== undefined ? gr.seq : "", { ...M, size: 10.5 });
        setCell(ws, r, 3, gr.name, { ...M, size: 11 });
        amountsXl(gr);
        r += 1;
      }
      setMerged(ws, start, 1, r - 1, 1, String(row.groupName).split("").join("\n"), { ...M, size: 10 });
      i += row.groupSize;
    } else {
      ws.getRow(r).height = 24;
      setMerged(ws, r, 1, r, 3, row.name, { ...M, size: 11 });
      amountsXl(row);
      r += 1;
      i += 1;
    }
  }

  if (mode === "combined") {
    ws.getRow(r).height = 24;
    setMerged(ws, r, 1, r, 3, "加總", { ...M, size: 11 });
    amountsXl({ houseAmount: d.houseTotal, landAmount: d.landTotal });
    r += 1;
    ws.getRow(r).height = 24;
    setMerged(ws, r, 1, r, 3, "合計總價", { ...M, size: 11 });
    const nAmt = (showHouse ? 1 : 0) + (showLand ? 1 : 0);
    setMerged(ws, r, 4, r, 3 + nAmt, fmtYuan(d.pageTotal, true), { ...M, size: 11, align: "right" });
    if (d.showSignColumn) setCell(ws, r, 4 + nAmt, "", {});
    r += 1;
  } else {
    ws.getRow(r).height = 24;
    setMerged(ws, r, 1, r, 3, mode === "house" ? "房屋總價" : mode === "land" ? "土地總價" : "配套款總價", { ...M, size: 11 });
    setCell(ws, r, 4, fmtYuan(d.pageTotal, true), { ...M, size: 10.5, align: "right" });
    if (d.showSignColumn) setCell(ws, r, 5, "", {});
    r += 1;
  }

  if (d.noteText) {
    r += 1;
    setMerged(ws, r, 1, r, 6, d.noteText, { ...M, size: 8, border: false, align: "left" });
  }
}

/* ---------- 繳款銀行（含 QR 圖）---------- */

function excelBankAccounts(wb, ws, d, repeatCount) {
  ws.columns = [{ width: 30 }, { width: 6 }, { width: 20 }];
  const M = { fontName: FONT_MING };
  let r = 1;
  const repeat = Math.max(1, Math.min(3, Number(repeatCount) || 1));
  const qrBuffer = dataUrlToBuffer(d.qrDataUrl);
  let qrImageId = null;
  if (d.showQr && qrBuffer) {
    qrImageId = wb.addImage({ buffer: qrBuffer, extension: "png" });
  }

  for (let copy = 0; copy < repeat; copy++) {
    if (copy > 0) {
      ws.getRow(r).height = 16;
      setMerged(ws, r, 1, r, 3, "✂ - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -", { size: 8, border: false, align: "left" });
      r += 1;
    }
    ws.getRow(r).height = 24;
    const headerText = [d.projectName, d.unitId, d.pageTitle].filter(Boolean).join(" ") || `戶別　${d.unitId || ""}`;
    setMerged(ws, r, 1, r, 3, headerText, { bold: true, size: 13, border: false, align: "left" });
    r += 1;

    const qrTopRow = r;
    const sets = d.bankSets || [];
    const showLabel = sets.length > 1;
    for (const set of sets) {
      if (showLabel) {
        ws.getRow(r).height = 16;
        setCell(ws, r, 1, set.label || "", { bold: true, size: 10, border: false, align: "left" });
        r += 1;
      }
      const rowsDef = [
        ["繳款銀行名稱", 11], [set.bankName || "", 11],
        ["戶名", 11], [set.accountName || "", 11],
        ["帳號", 11], [set.account || "", 11.5],
      ];
      for (const [text, size] of rowsDef) {
        ws.getRow(r).height = 24;
        setCell(ws, r, 1, text, { ...M, size });
        r += 1;
      }
      r += 1;
    }

    if (d.showQr) {
      setCell(ws, qrTopRow - 1, 3, d.qrLabel || "請填寫客戶資料卡", { bold: true, size: 10, border: false });
      if (qrImageId !== null) {
        ws.addImage(qrImageId, {
          tl: { col: 2.15, row: qrTopRow - 0.6 },
          ext: { width: 108, height: 108 },
        });
        // 案名 / 戶別：置於 QR 下方
        const qrCaption = [d.projectName, d.unitId].filter(Boolean).join("　");
        if (qrCaption) {
          setCell(ws, qrTopRow + 4, 3, qrCaption, { size: 9, border: false });
        }
      } else if (d.qrUrl) {
        setCell(ws, qrTopRow, 3, d.qrUrl, { size: 8, border: false });
      }
    }
    r += 1;
  }
}

/* ---------- 合約加註 ---------- */

function excelContractNotes(ws, d, repeatCount) {
  ws.columns = [{ width: 96 }];
  const repeat = Math.max(1, Math.min(3, Number(repeatCount) || 1));
  let r = 1;
  for (let copy = 0; copy < repeat; copy++) {
    if (copy > 0) {
      ws.getRow(r).height = 16;
      setCell(ws, r, 1, "✂ - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -", { size: 8, border: false, align: "left" });
      r += 1;
    }
    for (const n of d.notes || []) {
      const fs = Math.round(Number(n.fontSize) || 12);
      const content = String(n.content || "");
      const cellRef = setCell(ws, r, 1, content, { fontName: FONT_MING, size: fs, border: false, align: "left", vAlign: "top" });
      cellRef.alignment = { ...cellRef.alignment, wrapText: true };
      const lines = content.split("\n").reduce((s, line) => s + Math.max(1, Math.ceil(line.length / Math.floor(1000 / fs / 2))), 0);
      ws.getRow(r).height = Math.max(30, lines * fs * 1.65);
      r += 1;
    }
    if (d.showBuyerSignLine && (d.notes || []).length) {
      ws.getRow(r).height = 26;
      const cellRef = setCell(ws, r, 1, "買方簽名：＿＿＿＿＿＿＿＿＿", { fontName: FONT_MING, size: 12, border: false });
      cellRef.alignment = { horizontal: "right", vertical: "middle" };
      r += 1;
    }
    r += 1;
  }
}

/* ---------- 裝修工程會辦單（直式清單） ---------- */

function excelDecorationBreakdown(ws, d) {
  ws.columns = [{ width: 8 }, { width: 30 }, { width: 16 }, { width: 16 }];
  let r = 1;
  ws.getRow(r).height = 26;
  setMerged(ws, r, 1, r, 4, d.headerTitle || "裝修工程會辦單", { bold: true, size: 15 });
  r += 1;

  const infoRows = [
    ["個案名稱", d.projectName || "", "房屋編號", d.unitId || ""],
    ["客戶姓名", d.buyerName || "", "身分證字號", d.buyerIdNumber || ""],
    ["總價(萬)", fmtWan(d.totalPrice), "聯絡電話", d.buyerPhone || ""],
    ["地址", d.address || "", "簽約日期", d.signDate || ""],
  ];
  for (const [l1, v1, l2, v2] of infoRows) {
    ws.getRow(r).height = 20;
    setCell(ws, r, 1, l1, { bold: true, size: 10 });
    setCell(ws, r, 2, v1, { size: 10, align: "left" });
    setCell(ws, r, 3, l2, { bold: true, size: 10 });
    setCell(ws, r, 4, v2, { size: 10, align: "left" });
    r += 1;
  }
  r += 1;

  // 期款直式清單（Excel 不做橫式動態欄，同拆款表 Excel 慣例）
  ws.getRow(r).height = 18;
  setCell(ws, r, 1, "序", { bold: true, size: 10 });
  setCell(ws, r, 2, "期別名稱", { bold: true, size: 10 });
  setCell(ws, r, 3, "金額(萬)", { bold: true, size: 10 });
  setCell(ws, r, 4, "", { border: false });
  r += 1;
  const columns = (d.installment && d.installment.columns) || [];
  let seq = 1;
  for (const col of columns) {
    const leaves = col.type === "group" ? col.children : [col];
    for (const lf of leaves) {
      ws.getRow(r).height = 18;
      setCell(ws, r, 1, seq, { size: 10 });
      setCell(ws, r, 2, (col.type === "group" ? `${col.name}－${lf.name}` : lf.name), { size: 10, align: "left" });
      setCell(ws, r, 3, Math.round(Number(lf.amount) * 100) / 100, { size: 10, align: "right" });
      r += 1;
      seq += 1;
    }
  }
  ws.getRow(r).height = 20;
  setCell(ws, r, 1, "", {});
  setCell(ws, r, 2, `${d.installment && d.installment.rowLabel ? d.installment.rowLabel : "裝修工程款"}總價`, { bold: true, size: 10.5 });
  setCell(ws, r, 3, Math.round(Number(d.installment && d.installment.grandTotal) * 100) / 100, { bold: true, size: 10.5, align: "right" });
  r += 2;

  ws.getRow(r).height = 20;
  setCell(ws, r, 1, "備註", { bold: true, size: 10 });
  setMerged(ws, r, 2, r, 4, d.remark || "", { size: 10, align: "left" });
  r += 2;

  const signFields = d.signFields || [];
  if (signFields.length) {
    signFields.forEach((f, i) => {
      setCell(ws, r, i + 1, f.label, { bold: true, size: 10 });
      setCell(ws, r + 1, i + 1, f.value || "", { size: 10 });
    });
    ws.getRow(r + 1).height = 28;
  }
}

/* ---------- 裝修付款明細表（國字大寫） ---------- */

function excelDecorationPaymentDetail(ws, d) {
  ws.columns = [{ width: 8 }, { width: 22 }, { width: 44 }, { width: 12 }];
  const M = { fontName: FONT_MING };
  let r = 1;
  ws.getRow(r).height = 22;
  setMerged(ws, r, 1, r, 2, `${d.siteLabel || "工地名稱"}：${d.projectName || ""}`, { ...M, size: 11, border: false, align: "left" });
  setMerged(ws, r, 3, r, 4, d.headerTitle || "裝修付款明細表", { ...M, bold: true, size: 12, border: false });
  r += 1;
  ws.getRow(r).height = 20;
  setMerged(ws, r, 1, r, 2, `${d.unitLabel || "房屋代號"}：${d.unitId || ""}`, { ...M, size: 11, border: false, align: "left" });
  r += 2;

  ws.getRow(r).height = 22;
  setMerged(ws, r, 1, r, 4, `工程總價　計新臺幣 ${d.zhTotal || ""}`, { ...M, bold: true, size: 12, border: false, align: "left" });
  r += 2;

  for (const row of d.rows || []) {
    ws.getRow(r).height = 20;
    setCell(ws, r, 1, `${row.zhSeq}、`, { ...M, size: 11, border: false, align: "right" });
    setCell(ws, r, 2, row.name || "", { ...M, size: 11, border: false, align: "left" });
    setCell(ws, r, 3, `：新台幣：${row.zhAmount || ""}`, { ...M, size: 11, border: false, align: "left" });
    setCell(ws, r, 4, Math.round(Number(row.amount) * 100) / 100, { ...M, size: 10, border: false, align: "right" });
    r += 1;
  }

  if (d.noteText) {
    r += 1;
    setMerged(ws, r, 1, r, 4, d.noteText, { ...M, size: 8.5, border: false, align: "left" });
  }
}

/* ---------- 合約數字對照表（比例式欄位範圍，藍字 = 蓋章內容） ---------- */

function excelContractNumberTable(ws, d) {
  const ncols = 160;
  ws.columns = Array.from({ length: ncols }, () => ({ width: 0.62 }));
  let r = 1;

  const writeSection = (title, rows) => {
    ws.getRow(r).height = 24;
    setMerged(ws, r, 1, r, ncols, title, { bold: true, size: 14, border: false });
    r += 1;
    const top = r;
    for (const row of rows || []) {
      ws.getRow(r).height = 23;
      const list = Array.isArray(row.cells) ? row.cells : [];
      const totalW = list.reduce((s, c) => s + (Number(c.w) || 1), 0) || 1;
      let f0 = 0;
      list.forEach((c, i) => {
        const f1 = f0 + (Number(c.w) || 1) / totalW;
        const c1 = Math.min(ncols, Math.max(1, 1 + Math.round(f0 * ncols)));
        let c2 = i === list.length - 1 ? ncols : Math.max(c1, Math.round(f1 * ncols));
        if (c2 > ncols) c2 = ncols;
        setMerged(ws, r, c1, r, c2, c.t, {
          bold: !!(c.blue || c.bold),
          size: c.blue ? 13 : 9.5,
          color: c.blue ? "FF1E50A2" : undefined,
        });
        f0 = f1;
      });
      r += 1;
    }
    // 外框加粗
    for (let cc = 1; cc <= ncols; cc++) {
      const t = ws.getCell(top, cc);
      t.border = { ...(t.border || {}), top: { style: "medium" } };
      const b = ws.getCell(r - 1, cc);
      b.border = { ...(b.border || {}), bottom: { style: "medium" } };
    }
    for (let rr = top; rr <= r - 1; rr++) {
      const lft = ws.getCell(rr, 1);
      lft.border = { ...(lft.border || {}), left: { style: "medium" } };
      const rgt = ws.getCell(rr, ncols);
      rgt.border = { ...(rgt.border || {}), right: { style: "medium" } };
    }
    r += 1;   // 區塊間空一列
  };

  const sections = Array.isArray(d.sections) && d.sections.length
    ? d.sections
    : [
      { title: d.houseTitle || "房屋合約 (一般合約)", rows: d.houseRows || [] },
      { title: d.landTitle || "土地合約", rows: d.landRows || [] },
    ];
  sections.forEach(sec => writeSection(sec.title || "", sec.rows));
}

async function buildContractExcel(payload) {
  const wb = new ExcelJS.Workbook();
  const pages = (payload.pages || []).filter(p => p.type !== "contractAttachments");
  pages.forEach((page, index) => {
    const pageCopies = Math.max(1, Math.min(10, Number(page.pageCopies) || 1));
    excelFontOverride = EXCEL_FONT_FAMILY[page.font] || null;   // 本頁字體覆蓋
    for (let pc = 0; pc < pageCopies; pc++) {
      const ws = setupSheet(wb, page, index, pc);
      const d = page.data || {};
      switch (page.type) {
        case "breakdown": excelBreakdown(ws, d); break;
        case "paymentDetail": excelPaymentDetail(ws, d); break;
        case "bankAccounts": excelBankAccounts(wb, ws, d, page.repeatCount); break;
        case "contractNotes": excelContractNotes(ws, d, page.repeatCount); break;
        case "decorationBreakdown": excelDecorationBreakdown(ws, d); break;
        case "decorationPaymentDetail": excelDecorationPaymentDetail(ws, d); break;
        case "contractNumberTable":
        case "contractNumberTableCombined": excelContractNumberTable(ws, d); break;
        default: break;
      }
    }
  });
  excelFontOverride = null;
  if (!wb.worksheets.length) {
    wb.addWorksheet("空白");
  }
  const buffer = await wb.xlsx.writeBuffer();
  return Buffer.from(buffer);
}

module.exports = { buildContractPdf, buildContractExcel, parsePageRange };
