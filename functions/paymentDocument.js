/**
 * 付款明細表產製模組（PDF / EXCEL）
 * 版面依據 docs/付款表範本.pdf；資料由前端 PaymentSchedulePreviewDialog 傳入。
 *
 * doc payload 結構：
 * {
 *   projectName, unitId, unitLabel, listDate,
 *   logoUrl,            // Firebase Storage 下載 URL（可為 null）
 *   qrDataUrl,          // 前端生成之 QR PNG dataURL（可為 null）
 *   parkingText,        // "B5-40 (225萬)"，多車位逗號串接；無車位 = "無"
 *   areas: { houseTotalPing, houseTotalSqm, mainPing, mainSqm,
 *            ancillaryPing, ancillarySqm, commonPing, commonSqm,
 *            landSharePing, landShareSqm, landShareRatio },
 *   rows: [ { type:'group', name, percent, verticalLabel, children:[{seq,name,amount,note}] },
 *           { type:'single', name, percent, amount, note } ],
 *   totalPrice,         // 成交總價（萬）
 *   banks: [ { title, bankName, accountName, account } ],
 *   loanWarningText, remitNoteText,
 *   salesperson, salesPhone
 * }
 */

const PDFDocument = require("pdfkit");
const ExcelJS = require("exceljs");
const axios = require("axios");
const path = require("path");

const FONT_REGULAR = path.join(__dirname, "assets", "fonts", "NotoSerifTC-Regular.otf");
const FONT_BOLD = path.join(__dirname, "assets", "fonts", "NotoSerifTC-Bold.otf");

const GRAY_BG = "#E0E0E0";
const RED = "#C00000";
const BLACK = "#000000";

/** 將 dataURL 轉為 Buffer（僅接受 png/jpeg） */
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

/** 下載遠端圖片為 Buffer；失敗回傳 null（不阻斷產製） */
async function fetchImageBuffer(url) {
  if (!url) return null;
  try {
    const res = await axios.get(url, { responseType: "arraybuffer", timeout: 10000 });
    return Buffer.from(res.data);
  } catch (e) {
    console.warn(`[paymentDocument] 下載圖片失敗：${url}`, e.message);
    return null;
  }
}

/** 千分位整數格式 */
function fmtAmount(value) {
  const num = Math.round(Number(value) || 0);
  return num.toLocaleString("en-US");
}

/** 比例顯示：去除多餘小數（10 -> "10%", 2.5 -> "2.5%"） */
function fmtPercent(value) {
  const num = Number(value) || 0;
  const text = Number.isInteger(num) ? String(num) : String(Math.round(num * 100) / 100);
  return `${text}%`;
}

/** 攤平 rows 計算資料列總數（不含表頭與總價列） */
function countDataRows(rows) {
  return rows.reduce((sum, r) => sum + (r.type === "group" ? r.children.length : 1), 0);
}

/* ==========================================================
 * PDF 產製
 * ========================================================== */
async function buildPaymentPdf(docData) {
  const logoBuffer = await fetchImageBuffer(docData.logoUrl);
  const qrBuffer = dataUrlToBuffer(docData.qrDataUrl);

  const pdf = new PDFDocument({ size: "A4", margins: { top: 28, bottom: 28, left: 36, right: 36 } });
  const chunks = [];
  pdf.on("data", (c) => chunks.push(c));
  const done = new Promise((resolve) => pdf.on("end", () => resolve(Buffer.concat(chunks))));

  pdf.registerFont("TC", FONT_REGULAR);
  pdf.registerFont("TC-Bold", FONT_BOLD);

  const pageW = 595.28;
  const left = 36;
  const right = pageW - 36;
  const contentW = right - left;

  /* ---------- 表頭 ---------- */
  const headerTop = 30;
  if (logoBuffer) {
    try {
      pdf.image(logoBuffer, left, headerTop, { fit: [130, 62] });
    } catch (e) {
      console.warn("[paymentDocument] logo 嵌入失敗：", e.message);
    }
  }
  pdf.font("TC-Bold").fontSize(24).fillColor(BLACK)
    .text("付款明細表", left, headerTop + 18, { width: contentW, align: "center", characterSpacing: 6 });

  if (qrBuffer) {
    const qrSize = 60;
    const qrX = right - qrSize;
    try {
      pdf.image(qrBuffer, qrX, headerTop - 2, { fit: [qrSize, qrSize] });
      pdf.font("TC").fontSize(9)
        .text("合約範本", qrX - 60, headerTop + 16, { width: 55, align: "right" })
        .text("QR CODE", qrX - 60, headerTop + 29, { width: 55, align: "right" });
    } catch (e) {
      console.warn("[paymentDocument] QR 嵌入失敗：", e.message);
    }
  }

  /* ---------- 基本資訊區 ---------- */
  const a = docData.areas || {};
  const infoTop = headerTop + 80;
  const labelSize = 10.5;

  // 右欄（面積資訊）
  const rLabelX = 300;
  const rLabelW = 105;
  const rValX = rLabelX + rLabelW + 4;
  const rValW = right - rValX;
  const halfW = rValW / 2;
  const rowH = 19;

  const fmt2 = (v) => {
    const num = Number(v);
    if (isNaN(num)) return "-";
    return num.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const drawAreaRow = (y, label, ping, sqm, grayBg, bold) => {
    if (grayBg) pdf.rect(rValX, y - 3, rValW, rowH - 3).fill(GRAY_BG);
    pdf.fillColor(BLACK).font("TC").fontSize(labelSize)
      .text(label, rLabelX, y, { width: rLabelW, align: "right" });
    pdf.font(bold ? "TC-Bold" : "TC").fontSize(labelSize)
      .text(`${ping}坪`, rValX, y, { width: halfW, align: "center" })
      .text(`${sqm} m²`, rValX + halfW, y, { width: halfW, align: "center" });
    // 底線
    pdf.moveTo(rValX, y + rowH - 6).lineTo(right, y + rowH - 6).lineWidth(0.5).strokeColor("#999999").stroke();
  };

  let ry = infoTop;
  drawAreaRow(ry, "房屋買賣面積：", fmt2(a.houseTotalPing), fmt2(a.houseTotalSqm), true, true); ry += rowH;
  drawAreaRow(ry, "主建物：", fmt2(a.mainPing), fmt2(a.mainSqm), false, false); ry += rowH;
  drawAreaRow(ry, "陽台：", fmt2(a.ancillaryPing), fmt2(a.ancillarySqm), false, false); ry += rowH;
  drawAreaRow(ry, "共用部分：", fmt2(a.commonPing), fmt2(a.commonSqm), false, false); ry += rowH;
  ry += 8;
  // 土地持分
  pdf.fillColor(BLACK).font("TC").fontSize(labelSize)
    .text("土地持分：", rLabelX, ry, { width: rLabelW, align: "right" });
  pdf.font("TC-Bold").text(a.landShareRatio ? `十萬分之${a.landShareRatio}` : "-", rValX, ry, { width: rValW, align: "center" });
  pdf.moveTo(rValX, ry + rowH - 6).lineTo(right, ry + rowH - 6).lineWidth(0.5).strokeColor("#999999").stroke();
  ry += rowH;
  drawAreaRow(ry, "土地買賣面積：", fmt2(a.landSharePing), fmt2(a.landShareSqm), true, true);
  const infoBottom = ry + rowH;

  // 左欄（戶別 / 車位）
  const lLabelX = left + 10;
  const lValX = lLabelX + 55;
  const lValW = 260 - lValX;
  const drawLeftBox = (y, label, value) => {
    pdf.rect(lValX, y - 4, lValW, 22).fill(GRAY_BG);
    pdf.fillColor(BLACK).font("TC").fontSize(11).text(label, lLabelX, y);
    pdf.font("TC-Bold").fontSize(12).text(value || "-", lValX + 4, y - 1, { width: lValW - 8, align: "center" });
  };
  drawLeftBox(infoTop + rowH, "戶別：", docData.unitLabel || docData.unitId);
  drawLeftBox(infoTop + rowH * 3 + 4, "車位：", docData.parkingText || "無");

  /* ---------- 期款表格 ---------- */
  const rows = docData.rows || [];
  const dataRowCount = countDataRows(rows) + 1; // +1 總價列
  const tableTop = infoBottom + 26;

  // 版面預算：表尾固定區（警語 + 銀行區 + 銷售列）высота
  const banks = (docData.banks || []).filter(b => b && (b.bankName || b.accountName || b.account));
  const bankBoxH = banks.length > 0 ? banks.length * 32 + 26 + 8 : 26;
  const footerNeed = 14 + bankBoxH + 8 + 26 + 10; // 警語 + 銀行框 + 間距 + 銷售列
  const availableH = (841.89 - 32) - tableTop - footerNeed - 22; // 22 = 表頭列
  let dataRowH = Math.floor(availableH / dataRowCount);
  dataRowH = Math.max(13, Math.min(24, dataRowH));
  const tblFontSize = dataRowH >= 20 ? 10.5 : (dataRowH >= 16 ? 9.5 : 8.5);

  // 欄位 X 座標
  const colPercentW = 50;
  const colAmountW = 95;
  const colNoteW = 130;
  const colNameW = contentW - colPercentW - colAmountW - colNoteW;
  const xPercent = left;
  const xName = xPercent + colPercentW;
  const xAmount = xName + colNameW;
  const xNote = xAmount + colAmountW;
  const vLabelW = 22;  // 直排母項目名稱子欄
  const seqW = 26;     // 序號子欄

  // 列表日期
  pdf.font("TC").fontSize(9.5).fillColor(BLACK)
    .text(`列表日期：　${docData.listDate || ""}`, left, tableTop - 16);

  // 表頭列
  const headH = 22;
  pdf.lineWidth(1).strokeColor(BLACK);
  pdf.rect(xPercent, tableTop, contentW, headH).fillAndStroke(GRAY_BG, BLACK);
  pdf.fillColor(BLACK).font("TC-Bold").fontSize(10.5);
  const headTextY = tableTop + (headH - 12) / 2;
  pdf.text("比例", xPercent, headTextY, { width: colPercentW, align: "center" });
  pdf.text("期別名稱", xName, headTextY, { width: colNameW, align: "center" });
  pdf.text("金額(萬)", xAmount, headTextY, { width: colAmountW, align: "center" });
  pdf.text("備註", xNote, headTextY, { width: colNoteW, align: "center" });

  const textY = (rowTop, h) => rowTop + (h - tblFontSize - 2) / 2 + 1;

  let ty = tableTop + headH;
  const drawCellBorders = (y, h, nameDividers) => {
    // 外框直線由整表結束後畫；此處畫該列底線與欄分隔
    pdf.lineWidth(0.75).strokeColor(BLACK);
    pdf.moveTo(xPercent, y + h).lineTo(right, y + h).stroke();
    nameDividers.forEach(x => {
      pdf.moveTo(x, y).lineTo(x, y + h).stroke();
    });
  };

  for (const row of rows) {
    if (row.type === "group") {
      const children = row.children || [];
      const groupH = children.length * dataRowH;
      const hasVertical = !!row.verticalLabel;
      // 比例欄（合併）
      pdf.font("TC-Bold").fontSize(tblFontSize).fillColor(BLACK)
        .text(fmtPercent(row.percent), xPercent, ty + (groupH - tblFontSize) / 2, { width: colPercentW, align: "center" });
      // 直排母項目名稱
      if (hasVertical) {
        const chars = String(row.verticalLabel).split("");
        const charH = tblFontSize + 3;
        let cy = ty + (groupH - chars.length * charH) / 2;
        pdf.font("TC").fontSize(tblFontSize);
        chars.forEach(ch => {
          pdf.text(ch, xName, cy, { width: vLabelW, align: "center" });
          cy += charH;
        });
      }
      // 子項目列
      children.forEach((child, idx) => {
        const cy = textY(ty, dataRowH);
        pdf.font("TC").fontSize(tblFontSize).fillColor(BLACK);
        if (child.seq !== null && child.seq !== undefined) {
          pdf.text(String(child.seq), xName + vLabelW, cy, { width: seqW, align: "center" });
          pdf.text(child.name || "", xName + vLabelW + seqW, cy, { width: colNameW - vLabelW - seqW - 4, align: "center" });
        } else {
          const nx = hasVertical ? xName + vLabelW : xName;
          pdf.text(child.name || "", nx, cy, { width: xAmount - nx - 4, align: "center" });
        }
        pdf.font("TC-Bold").text(fmtAmount(child.amount), xAmount, cy, { width: colAmountW - 8, align: "center" });
        if (child.note) {
          pdf.font("TC").fontSize(Math.max(7.5, tblFontSize - 1.5))
            .text(String(child.note), xNote + 3, cy, { width: colNoteW - 6, align: "left", height: dataRowH, ellipsis: true });
        }
        // 子列分隔線（比例欄不畫，維持合併視覺）
        const dividers = [xAmount, xNote];
        if (hasVertical) dividers.push(xName + vLabelW);
        if (child.seq !== null && child.seq !== undefined) dividers.push(xName + vLabelW + seqW);
        pdf.lineWidth(0.75).strokeColor(BLACK);
        if (idx < children.length - 1) {
          pdf.moveTo(xName + (hasVertical ? vLabelW : 0), ty + dataRowH).lineTo(right, ty + dataRowH).stroke();
        }
        dividers.forEach(x => { pdf.moveTo(x, ty).lineTo(x, ty + dataRowH).stroke(); });
        ty += dataRowH;
      });
      // group 底線
      pdf.lineWidth(0.75).strokeColor(BLACK).moveTo(xPercent, ty).lineTo(right, ty).stroke();
    } else {
      const cy = textY(ty, dataRowH);
      pdf.font("TC").fontSize(tblFontSize).fillColor(BLACK)
        .text(fmtPercent(row.percent), xPercent, cy, { width: colPercentW, align: "center" })
        .text(row.name || "", xName, cy, { width: colNameW, align: "center" });
      pdf.font("TC-Bold").text(fmtAmount(row.amount), xAmount, cy, { width: colAmountW - 8, align: "center" });
      if (row.note) {
        pdf.font("TC").fontSize(Math.max(7.5, tblFontSize - 1.5))
          .text(String(row.note), xNote + 3, cy, { width: colNoteW - 6, align: "left", height: dataRowH, ellipsis: true });
      }
      drawCellBorders(ty, dataRowH, [xAmount, xNote]);
      ty += dataRowH;
    }
  }

  // 總價列
  const totalH = Math.max(dataRowH, 20);
  pdf.font("TC-Bold").fontSize(tblFontSize + 1).fillColor(BLACK);
  const tcy = ty + (totalH - tblFontSize - 3) / 2;
  pdf.text("100%", xPercent, tcy, { width: colPercentW, align: "center" });
  pdf.fontSize(tblFontSize + 3).text("總價", xName, ty + (totalH - tblFontSize - 5) / 2, { width: colNameW, align: "center" });
  pdf.fontSize(tblFontSize + 1).text(fmtAmount(docData.totalPrice), xAmount, tcy, { width: colAmountW - 8, align: "center" });
  pdf.lineWidth(0.75).strokeColor(BLACK);
  [xAmount, xNote].forEach(x => { pdf.moveTo(x, ty).lineTo(x, ty + totalH).stroke(); });
  ty += totalH;

  // 表格外框與比例/名稱欄分隔（全高）
  pdf.lineWidth(1.2).strokeColor(BLACK).rect(xPercent, tableTop, contentW, ty - tableTop).stroke();
  pdf.lineWidth(0.75).moveTo(xName, tableTop).lineTo(xName, ty).stroke();

  /* ---------- 警語 ---------- */
  let fy = ty + 6;
  if (docData.loanWarningText) {
    pdf.font("TC-Bold").fontSize(9.5).fillColor(RED)
      .text(docData.loanWarningText, left, fy, { width: contentW, align: "center" });
    fy += 16;
  }

  /* ---------- 繳款銀行區 ---------- */
  if (banks.length > 0 || docData.remitNoteText) {
    const boxTop = fy + 2;
    let by = boxTop + 8;
    pdf.font("TC").fontSize(10).fillColor(BLACK);
    banks.forEach(bank => {
      const prefix = banks.length > 1 && bank.title ? `【${bank.title}】` : "";
      pdf.font("TC").fontSize(10).fillColor(BLACK)
        .text(`${prefix}繳款銀行名稱：`, left + 12, by, { width: 130, align: "left" });
      pdf.font("TC-Bold").text(bank.bankName || "-", left + 145, by, { width: 150, align: "left" });
      pdf.font("TC").text("戶名：", left + 300, by, { width: 40, align: "left" });
      pdf.font("TC-Bold").text(bank.accountName || "-", left + 340, by, { width: right - left - 348, align: "left" });
      by += 16;
      pdf.font("TC").text("帳號：", left + 60, by, { width: 40, align: "left" });
      pdf.font("TC-Bold").text(bank.account || "-", left + 100, by, { width: 250, align: "left" });
      by += 16;
    });
    if (docData.remitNoteText) {
      pdf.font("TC-Bold").fontSize(9.5).fillColor(RED)
        .text(docData.remitNoteText, left + 12, by, { width: contentW - 24, align: "left" });
      by += 14;
    }
    pdf.lineWidth(1).strokeColor(BLACK).rect(left, boxTop, contentW, by - boxTop + 6).stroke();
    fy = by + 14;
  }

  /* ---------- 銷售顧問列 ---------- */
  const footH = 24;
  pdf.lineWidth(1).strokeColor(BLACK).rect(left, fy, contentW, footH).stroke();
  const fcy = fy + (footH - 11) / 2;
  pdf.font("TC").fontSize(10.5).fillColor(BLACK)
    .text("銷售顧問", left + 10, fcy, { width: 70, align: "center" });
  pdf.font("TC-Bold").fontSize(11)
    .text(docData.salesperson || "-", left + 90, fcy, { width: 160, align: "center" });
  pdf.font("TC").fontSize(10.5)
    .text("聯絡電話", left + 260, fcy, { width: 70, align: "center" });
  pdf.font("TC-Bold").fontSize(11)
    .text(docData.salesPhone || "-", left + 340, fcy, { width: contentW - 350, align: "center" });

  pdf.end();
  return done;
}

/* ==========================================================
 * EXCEL 產製
 * ========================================================== */
async function buildPaymentExcel(docData) {
  const logoBuffer = await fetchImageBuffer(docData.logoUrl);
  const qrBuffer = dataUrlToBuffer(docData.qrDataUrl);

  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet("付款明細表", {
    pageSetup: {
      paperSize: 9, // A4
      orientation: "portrait",
      fitToPage: true,
      fitToWidth: 1,
      fitToHeight: 1,
      margins: { left: 0.4, right: 0.4, top: 0.4, bottom: 0.4, header: 0.2, footer: 0.2 }
    }
  });

  const FONT_NAME = "新細明體";
  const baseFont = { name: FONT_NAME, size: 11 };
  const boldFont = { name: FONT_NAME, size: 11, bold: true };
  const grayFill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFE0E0E0" } };
  const redFont = { name: FONT_NAME, size: 10, bold: true, color: { argb: "FFC00000" } };
  const center = { horizontal: "center", vertical: "middle" };
  const thinBorder = {
    top: { style: "thin" }, bottom: { style: "thin" },
    left: { style: "thin" }, right: { style: "thin" }
  };

  ws.columns = [
    { key: "A", width: 8 },   // 比例
    { key: "B", width: 4 },   // 直排母項目
    { key: "C", width: 5 },   // 序號
    { key: "D", width: 22 },  // 期別名稱
    { key: "E", width: 14 },  // 金額
    { key: "F", width: 14 },  // 備註/右欄
    { key: "G", width: 14 }
  ];

  const fmt2 = (v) => {
    const num = Number(v);
    return isNaN(num) ? "-" : Math.round(num * 100) / 100;
  };

  /* ---------- 表頭（列 1-3）---------- */
  ws.mergeCells("C1:E3");
  const titleCell = ws.getCell("C1");
  titleCell.value = "付 款 明 細 表";
  titleCell.font = { name: FONT_NAME, size: 22, bold: true };
  titleCell.alignment = center;

  if (logoBuffer) {
    try {
      const logoId = wb.addImage({ buffer: logoBuffer, extension: "png" });
      ws.addImage(logoId, { tl: { col: 0, row: 0 }, ext: { width: 130, height: 60 } });
    } catch (e) {
      console.warn("[paymentDocument] Excel logo 嵌入失敗：", e.message);
    }
  }
  if (qrBuffer) {
    ws.mergeCells("F1:F3");
    const qrLabel = ws.getCell("F1");
    qrLabel.value = "合約範本\nQR CODE";
    qrLabel.font = { name: FONT_NAME, size: 9 };
    qrLabel.alignment = { ...center, wrapText: true };
    try {
      const qrId = wb.addImage({ buffer: qrBuffer, extension: "png" });
      ws.addImage(qrId, { tl: { col: 6, row: 0 }, ext: { width: 62, height: 62 } });
    } catch (e) {
      console.warn("[paymentDocument] Excel QR 嵌入失敗：", e.message);
    }
  }
  ws.getRow(1).height = 18; ws.getRow(2).height = 18; ws.getRow(3).height = 18;

  /* ---------- 基本資訊（列 5-11）---------- */
  const a = docData.areas || {};
  const setLabel = (addr, text) => {
    const c = ws.getCell(addr);
    c.value = text;
    c.font = baseFont;
    c.alignment = { horizontal: "right", vertical: "middle" };
  };
  const setVal = (addr, val, opts = {}) => {
    const c = ws.getCell(addr);
    c.value = val;
    c.font = opts.bold ? boldFont : baseFont;
    c.alignment = center;
    if (opts.gray) c.fill = grayFill;
    if (opts.numFmt) c.numFmt = opts.numFmt;
    return c;
  };

  setLabel("E5", "房屋買賣面積：");
  setVal("F5", `${fmt2(a.houseTotalPing)}坪`, { gray: true, bold: true });
  setVal("G5", `${fmt2(a.houseTotalSqm)} m²`, { gray: true, bold: true });

  setLabel("A6", "戶別：");
  ws.mergeCells("B6:D6");
  setVal("B6", docData.unitLabel || docData.unitId, { gray: true, bold: true });
  setLabel("E6", "主建物：");
  setVal("F6", `${fmt2(a.mainPing)}坪`);
  setVal("G6", `${fmt2(a.mainSqm)} m²`);

  setLabel("E7", "陽台：");
  setVal("F7", `${fmt2(a.ancillaryPing)}坪`);
  setVal("G7", `${fmt2(a.ancillarySqm)} m²`);

  setLabel("A8", "車位：");
  ws.mergeCells("B8:D8");
  setVal("B8", docData.parkingText || "無", { gray: true, bold: true });
  setLabel("E8", "共用部分：");
  setVal("F8", `${fmt2(a.commonPing)}坪`);
  setVal("G8", `${fmt2(a.commonSqm)} m²`);

  setLabel("E10", "土地持分：");
  ws.mergeCells("F10:G10");
  setVal("F10", a.landShareRatio ? `十萬分之${a.landShareRatio}` : "-", { bold: true });

  setLabel("E11", "土地買賣面積：");
  setVal("F11", `${fmt2(a.landSharePing)}坪`, { gray: true, bold: true });
  setVal("G11", `${fmt2(a.landShareSqm)} m²`, { gray: true, bold: true });

  /* ---------- 列表日期（列 13）---------- */
  const dateCell = ws.getCell("A13");
  dateCell.value = `列表日期：　${docData.listDate || ""}`;
  dateCell.font = { name: FONT_NAME, size: 10 };
  ws.mergeCells("A13:D13");

  /* ---------- 期款表格（列 14 起）---------- */
  let r = 14;
  const headerRow = ws.getRow(r);
  ws.mergeCells(`B${r}:D${r}`);
  ws.mergeCells(`F${r}:G${r}`);
  ws.getCell(`A${r}`).value = "比例";
  ws.getCell(`B${r}`).value = "期別名稱";
  ws.getCell(`E${r}`).value = "金額(萬)";
  ws.getCell(`F${r}`).value = "備註";
  ["A", "B", "E", "F"].forEach(col => {
    const c = ws.getCell(`${col}${r}`);
    c.font = boldFont;
    c.alignment = center;
    c.fill = grayFill;
  });
  headerRow.height = 20;
  const tableStartRow = r;
  r++;

  const applyRowBorders = (rowNum) => {
    ["A", "B", "C", "D", "E", "F", "G"].forEach(col => {
      ws.getCell(`${col}${rowNum}`).border = thinBorder;
    });
  };
  applyRowBorders(tableStartRow);

  const rows = docData.rows || [];
  for (const row of rows) {
    if (row.type === "group") {
      const children = row.children || [];
      const startR = r;
      const endR = r + children.length - 1;
      const hasVertical = !!row.verticalLabel;

      children.forEach(child => {
        const hasSeq = child.seq !== null && child.seq !== undefined;
        if (hasSeq) {
          ws.getCell(`C${r}`).value = child.seq;
          ws.getCell(`C${r}`).font = baseFont;
          ws.getCell(`C${r}`).alignment = center;
          ws.getCell(`D${r}`).value = child.name || "";
          ws.getCell(`D${r}`).font = baseFont;
          ws.getCell(`D${r}`).alignment = center;
        } else {
          ws.mergeCells(`C${r}:D${r}`);
          ws.getCell(`C${r}`).value = child.name || "";
          ws.getCell(`C${r}`).font = baseFont;
          ws.getCell(`C${r}`).alignment = center;
        }
        const amt = ws.getCell(`E${r}`);
        amt.value = Math.round(Number(child.amount) || 0);
        amt.numFmt = "#,##0";
        amt.font = boldFont;
        amt.alignment = center;
        ws.mergeCells(`F${r}:G${r}`);
        const note = ws.getCell(`F${r}`);
        note.value = child.note || "";
        note.font = { name: FONT_NAME, size: 9 };
        note.alignment = { horizontal: "left", vertical: "middle", wrapText: true };
        applyRowBorders(r);
        ws.getRow(r).height = 20;
        r++;
      });

      // 合併比例欄
      if (endR > startR) ws.mergeCells(`A${startR}:A${endR}`);
      const pc = ws.getCell(`A${startR}`);
      pc.value = fmtPercent(row.percent);
      pc.font = boldFont;
      pc.alignment = center;

      // 直排母項目名稱
      if (hasVertical) {
        if (endR > startR) ws.mergeCells(`B${startR}:B${endR}`);
        const vc = ws.getCell(`B${startR}`);
        vc.value = row.verticalLabel;
        vc.font = baseFont;
        vc.alignment = { horizontal: "center", vertical: "middle", textRotation: "vertical" };
      } else if (endR > startR) {
        ws.mergeCells(`B${startR}:B${endR}`);
      }
    } else {
      ws.getCell(`A${r}`).value = fmtPercent(row.percent);
      ws.getCell(`A${r}`).font = baseFont;
      ws.getCell(`A${r}`).alignment = center;
      ws.mergeCells(`B${r}:D${r}`);
      const nameCell = ws.getCell(`B${r}`);
      nameCell.value = row.name || "";
      nameCell.font = baseFont;
      nameCell.alignment = center;
      const amt = ws.getCell(`E${r}`);
      amt.value = Math.round(Number(row.amount) || 0);
      amt.numFmt = "#,##0";
      amt.font = boldFont;
      amt.alignment = center;
      ws.mergeCells(`F${r}:G${r}`);
      const note = ws.getCell(`F${r}`);
      note.value = row.note || "";
      note.font = { name: FONT_NAME, size: 9 };
      note.alignment = { horizontal: "left", vertical: "middle", wrapText: true };
      applyRowBorders(r);
      ws.getRow(r).height = 20;
      r++;
    }
  }

  // 總價列
  ws.getCell(`A${r}`).value = "100%";
  ws.getCell(`A${r}`).font = boldFont;
  ws.getCell(`A${r}`).alignment = center;
  ws.mergeCells(`B${r}:D${r}`);
  const totalName = ws.getCell(`B${r}`);
  totalName.value = "總價";
  totalName.font = { name: FONT_NAME, size: 14, bold: true };
  totalName.alignment = center;
  const totalAmt = ws.getCell(`E${r}`);
  totalAmt.value = Math.round(Number(docData.totalPrice) || 0);
  totalAmt.numFmt = "#,##0";
  totalAmt.font = { name: FONT_NAME, size: 12, bold: true };
  totalAmt.alignment = center;
  ws.mergeCells(`F${r}:G${r}`);
  applyRowBorders(r);
  ws.getRow(r).height = 24;
  r++;

  /* ---------- 警語 ---------- */
  if (docData.loanWarningText) {
    ws.mergeCells(`A${r}:G${r}`);
    const c = ws.getCell(`A${r}`);
    c.value = docData.loanWarningText;
    c.font = redFont;
    c.alignment = center;
    r++;
  }
  r++;

  /* ---------- 繳款銀行區 ---------- */
  const banks = (docData.banks || []).filter(b => b && (b.bankName || b.accountName || b.account));
  const bankStartRow = r;
  banks.forEach(bank => {
    const prefix = banks.length > 1 && bank.title ? `【${bank.title}】` : "";
    ws.mergeCells(`A${r}:B${r}`);
    const l1 = ws.getCell(`A${r}`);
    l1.value = `${prefix}繳款銀行名稱：`;
    l1.font = baseFont;
    l1.alignment = { horizontal: "right", vertical: "middle" };
    ws.mergeCells(`C${r}:D${r}`);
    setValPlain(ws, `C${r}`, bank.bankName || "-", boldFont);
    setValPlain(ws, `E${r}`, "戶名：", baseFont, "right");
    ws.mergeCells(`F${r}:G${r}`);
    setValPlain(ws, `F${r}`, bank.accountName || "-", boldFont, "left");
    r++;
    ws.mergeCells(`A${r}:B${r}`);
    const l2 = ws.getCell(`A${r}`);
    l2.value = "帳號：";
    l2.font = baseFont;
    l2.alignment = { horizontal: "right", vertical: "middle" };
    ws.mergeCells(`C${r}:D${r}`);
    setValPlain(ws, `C${r}`, bank.account || "-", boldFont);
    r++;
  });
  if (docData.remitNoteText) {
    ws.mergeCells(`A${r}:G${r}`);
    const c = ws.getCell(`A${r}`);
    c.value = docData.remitNoteText;
    c.font = redFont;
    c.alignment = { horizontal: "left", vertical: "middle" };
    r++;
  }
  // 銀行區外框
  if (r > bankStartRow) {
    for (let br = bankStartRow; br < r; br++) {
      ws.getCell(`A${br}`).border = { ...(ws.getCell(`A${br}`).border || {}), left: { style: "medium" } };
      ws.getCell(`G${br}`).border = { ...(ws.getCell(`G${br}`).border || {}), right: { style: "medium" } };
    }
    ["A", "B", "C", "D", "E", "F", "G"].forEach(col => {
      ws.getCell(`${col}${bankStartRow}`).border = { ...(ws.getCell(`${col}${bankStartRow}`).border || {}), top: { style: "medium" } };
      ws.getCell(`${col}${r - 1}`).border = { ...(ws.getCell(`${col}${r - 1}`).border || {}), bottom: { style: "medium" } };
    });
  }
  r++;

  /* ---------- 銷售顧問列 ---------- */
  setValPlain(ws, `A${r}`, "銷售顧問", baseFont);
  ws.mergeCells(`B${r}:D${r}`);
  setValPlain(ws, `B${r}`, docData.salesperson || "-", boldFont);
  setValPlain(ws, `E${r}`, "聯絡電話", baseFont);
  ws.mergeCells(`F${r}:G${r}`);
  setValPlain(ws, `F${r}`, docData.salesPhone || "-", boldFont);
  ["A", "B", "C", "D", "E", "F", "G"].forEach(col => {
    ws.getCell(`${col}${r}`).border = thinBorder;
  });
  ws.getRow(r).height = 22;

  const buffer = await wb.xlsx.writeBuffer();
  return Buffer.from(buffer);
}

/** Excel 小工具：設值 + 字型 + 對齊 */
function setValPlain(ws, addr, value, font, horizontal = "center") {
  const c = ws.getCell(addr);
  c.value = value;
  c.font = font;
  c.alignment = { horizontal, vertical: "middle" };
  return c;
}

module.exports = { buildPaymentPdf, buildPaymentExcel };
