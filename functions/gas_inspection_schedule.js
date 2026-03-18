/**
 * Google Apps Script - 驗屋時間表渲染腳本
 * 
 * 目的：從「ANXI預約資料」sheet 讀取預約資料，
 *       渲染到「驗屋時間表」sheet，格式參考 InspectionCalendar 的 Excel 下載。
 * 
 * 佈局：每 3 天為一組橫向排列，每天含：
 *   - 日期標頭行（合併儲存格）
 *   - 欄位標頭行（時間、戶別、預約人姓名、預約項目、選擇方式、動態欄位...、狀態、備註、驗屋人員）
 *   - 預約資料行（依時段排序）
 * 
 * 效能優化：使用批量寫入（setValues / setBackgrounds 等），大幅減少 API 呼叫次數。
 */

// --- 設定區域 ---
const SCHEDULE_SOURCE_SHEET_NAME = "ANXI預約資料";
const SCHEDULE_TARGET_SHEET_NAME = "驗屋時間表";
const SCHEDULE_DAYS_PER_ROW = 7; // 固定每行 7 天（週一~週日）

const SCHEDULE_DISPLAY_COLUMNS = [
    { label: "預約時段", displayLabel: "時間" },
    { label: "戶號", displayLabel: "戶別" },
    { label: "預約人姓名", displayLabel: "預約人" },
    { label: "預約項目", displayLabel: "預約項目" },
    { label: "預約方式", displayLabel: "選擇方式" },
    // 動態欄位會自動偵測並插入在「選擇方式」之後
    { label: "狀態", displayLabel: "狀態" },
    { label: "_備註", displayLabel: "備註" },
    { label: "_驗屋人員", displayLabel: "驗屋人員" },
];

const SCHEDULE_ALLOWED_BOOKING_TYPES = ["初驗", "複驗"];

const SCHEDULE_KEYWORD_COLOR_MAP = [
    { keyword: "已撥款", bgColor: "#ffc107", textColor: "#212529" },
    { keyword: "交屋", bgColor: "#ffc107", textColor: "#212529" },
    { keyword: "初驗", bgColor: "#d4edda", textColor: "#155724" },
    { keyword: "複驗", bgColor: "#f8d7da", textColor: "#721c24" },
];

// --- 主函式 ---
function renderInspectionSchedule() {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sourceSheet = ss.getSheetByName(SCHEDULE_SOURCE_SHEET_NAME);

    if (!sourceSheet) {
        console.log(`找不到來源工作表「${SCHEDULE_SOURCE_SHEET_NAME}」`);
        return;
    }

    let targetSheet = ss.getSheetByName(SCHEDULE_TARGET_SHEET_NAME);
    if (!targetSheet) {
        targetSheet = ss.insertSheet(SCHEDULE_TARGET_SHEET_NAME);
    }

    // 先顯示同步提示，讓使用者知道正在處理
    targetSheet.getRange(1, 1).setValue("⏳ 同步中...");
    SpreadsheetApp.flush();

    // --- 1. 讀取來源資料 ---
    const sourceData = sourceSheet.getDataRange().getValues();
    if (sourceData.length < 2) {
        console.log("來源工作表無資料");
        return;
    }

    const sourceHeaders = sourceData[0].map(h => h.toString().trim());
    const dataRows = sourceData.slice(1);

    // --- 2. 偵測動態欄位 ---
    const fixedLabels = new Set([
        "System ID (勿動)", "建立時間", "預約代碼", "狀態", "專案",
        "戶號", "地址", "預約項目", "預約方式", "預約日期", "預約時段",
        "預約人姓名", "預約人電話", "預約人Email", "預約人身分證",
        "代理人姓名", "代理人電話", "上傳報告", "是否已確認銀行?", "承辦人電話", "承辦人姓名", "銀行及分行"
    ]);
    const dynamicLabels = sourceHeaders.filter(h => h && !fixedLabels.has(h));

    const displayColumns = [];
    for (const col of SCHEDULE_DISPLAY_COLUMNS) {
        displayColumns.push(col);
        if (col.label === "預約方式") {
            dynamicLabels.forEach(dl => {
                displayColumns.push({ label: dl, displayLabel: dl });
            });
        }
    }
    const numColumns = displayColumns.length;

    // --- 3. 建立欄位索引對應 ---
    const colIndexMap = {};
    sourceHeaders.forEach((h, i) => { colIndexMap[h] = i; });

    const dateColIdx = colIndexMap["預約日期"];
    if (dateColIdx === undefined) {
        console.log("來源工作表中找不到「預約日期」欄位");
        return;
    }

    // --- 4. 將資料按日期分組（過濾取消 & 非指定項目） ---
    const groupedByDate = {};
    dataRows.forEach(row => {
        const status = colIndexMap["狀態"] !== undefined ? row[colIndexMap["狀態"]].toString().trim() : "";
        const bookingType = colIndexMap["預約項目"] !== undefined ? row[colIndexMap["預約項目"]].toString().trim() : "";
        const dateVal = row[dateColIdx];
        if (!dateVal) return;
        if (status === "取消") return;
        if (!SCHEDULE_ALLOWED_BOOKING_TYPES.some(t => bookingType.includes(t))) return;

        let dateStr;
        if (dateVal instanceof Date) {
            dateStr = Utilities.formatDate(dateVal, "GMT+8", "yyyy/MM/dd");
        } else {
            const parsed = new Date(dateVal);
            dateStr = !isNaN(parsed) ? Utilities.formatDate(parsed, "GMT+8", "yyyy/MM/dd") : dateVal.toString();
        }

        if (!groupedByDate[dateStr]) groupedByDate[dateStr] = [];

        const record = {};
        displayColumns.forEach(col => {
            if (col.label.startsWith("_")) { record[col.label] = ""; return; }
            const idx = colIndexMap[col.label];
            let value = idx !== undefined ? (row[idx] || "") : "";
            if (col.label === "預約時段" && value instanceof Date) {
                value = Utilities.formatDate(value, "GMT+8", "HH:mm");
            }
            record[col.label] = value;
        });
        record._status = status;
        record._bookingType = bookingType;
        record._inspectionMethod = colIndexMap["預約方式"] !== undefined ? row[colIndexMap["預約方式"]] : "";
        groupedByDate[dateStr].push(record);
    });

    // --- 5. 產生完整週行事曆日期（今天 ~ 今天+30天，週一~週日） ---

    // 固定範圍：今天到今天+30天
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const endDate = new Date(today);
    endDate.setDate(today.getDate() + 30);

    // 往前補到週一（getDay: 0=日 1=一 ... 6=六）
    const firstDay = today.getDay();
    const mondayOffset = firstDay === 0 ? -6 : 1 - firstDay;
    const startMonday = new Date(today);
    startMonday.setDate(today.getDate() + mondayOffset);

    // 往後補到週日
    const lastDay = endDate.getDay();
    const sundayOffset = lastDay === 0 ? 0 : 7 - lastDay;
    const endSunday = new Date(endDate);
    endSunday.setDate(endDate.getDate() + sundayOffset);

    // 產生所有日期
    const sortedDates = [];
    const cur = new Date(startMonday);
    while (cur <= endSunday) {
        const y = cur.getFullYear();
        const m = String(cur.getMonth() + 1).padStart(2, "0");
        const d = String(cur.getDate()).padStart(2, "0");
        sortedDates.push(`${y}/${m}/${d}`);
        cur.setDate(cur.getDate() + 1);
    }

    // --- 6. 在記憶體中準備所有渲染資料（批量操作） ---
    const totalColumns = SCHEDULE_DAYS_PER_ROW * numColumns;

    const allValues = [];
    const allBgColors = [];
    const allFontColors = [];
    const allFontWeights = [];
    const allHAligns = [];
    const mergesToApply = [];
    const thickBorders = [];

    // 總標題行
    const titleRow = new Array(totalColumns).fill("");
    const titleBg = new Array(totalColumns).fill("#005B9A");
    const titleFc = new Array(totalColumns).fill("#FFFFFF");
    const titleFw = new Array(totalColumns).fill("bold");
    const titleHa = new Array(totalColumns).fill("left");
    titleRow[0] = "富宇森之樹－驗屋時間表";
    allValues.push(titleRow);
    allBgColors.push(titleBg);
    allFontColors.push(titleFc);
    allFontWeights.push(titleFw);
    allHAligns.push(titleHa);
    mergesToApply.push({ row: 1, col: 1, numRows: 1, numCols: totalColumns });

    // 遍歷日期組
    for (let chunkStart = 0; chunkStart < sortedDates.length; chunkStart += SCHEDULE_DAYS_PER_ROW) {
        const chunk = sortedDates.slice(chunkStart, chunkStart + SCHEDULE_DAYS_PER_ROW);

        let maxAppointments = 0;
        chunk.forEach(d => {
            const len = (groupedByDate[d] || []).length;
            if (len > maxAppointments) maxAppointments = len;
        });
        if (maxAppointments === 0) maxAppointments = 1;

        const blockHeight = 2 + maxAppointments;
        const currentRowIdx = allValues.length;

        // 預填空行
        for (let r = 0; r < blockHeight; r++) {
            allValues.push(new Array(totalColumns).fill(""));
            allBgColors.push(new Array(totalColumns).fill(null));
            allFontColors.push(new Array(totalColumns).fill(null));
            allFontWeights.push(new Array(totalColumns).fill("normal"));
            allHAligns.push(new Array(totalColumns).fill("center"));
        }

        chunk.forEach((dateStr, dayIdx) => {
            const startCol = dayIdx * numColumns;
            const appts = (groupedByDate[dateStr] || []).sort((a, b) =>
                (a["預約時段"] || "").toString().localeCompare((b["預約時段"] || "").toString())
            );

            // 日期標頭行
            const dayOfWeek = _getDayOfWeek(dateStr);
            allValues[currentRowIdx][startCol] = `${dateStr} (${dayOfWeek})`;
            for (let c = startCol; c < startCol + numColumns; c++) {
                allBgColors[currentRowIdx][c] = "#fff2cc";
                allFontWeights[currentRowIdx][c] = "bold";
            }
            mergesToApply.push({ row: currentRowIdx + 1, col: startCol + 1, numRows: 1, numCols: numColumns });

            // 欄位標頭行
            displayColumns.forEach((col, colIdx) => {
                allValues[currentRowIdx + 1][startCol + colIdx] = col.displayLabel;
                allBgColors[currentRowIdx + 1][startCol + colIdx] = "#fff2cc";
                allFontWeights[currentRowIdx + 1][startCol + colIdx] = "bold";
            });

            // 預約資料行
            for (let i = 0; i < maxAppointments; i++) {
                const appt = appts[i];
                if (appt) {
                    const style = _getRowStyle(appt);
                    displayColumns.forEach((col, colIdx) => {
                        const c = startCol + colIdx;
                        const r = currentRowIdx + 2 + i;
                        allValues[r][c] = appt[col.label] || "";
                        allBgColors[r][c] = style.bgColor;
                        allFontColors[r][c] = style.textColor;
                    });
                }
            }

            // 粗外框線
            thickBorders.push({ row: currentRowIdx + 1, col: startCol + 1, numRows: blockHeight, numCols: numColumns });
        });
    }

    // --- 7. 清空目標 sheet 並一次性批量寫入 ---
    const maxRows = targetSheet.getMaxRows();
    const maxCols = targetSheet.getMaxColumns();

    // 取消合併儲存格
    const mergedRanges = targetSheet.getRange(1, 1, maxRows, maxCols).getMergedRanges();
    mergedRanges.forEach(r => r.breakApart());

    // 清除內容和格式（不影響欄寬列高）
    targetSheet.getRange(1, 1, maxRows, maxCols)
        .clearContent()
        .clearFormat()
        .setFontFamily("標楷體")
        .setFontSize(12)
        .setVerticalAlignment("middle")
        .setWrap(true);

    // 確保有足夠行列
    const needRows = allValues.length;
    const needCols = totalColumns;
    if (maxRows < needRows) targetSheet.insertRowsAfter(maxRows, needRows - maxRows);
    if (maxCols < needCols) targetSheet.insertColumnsAfter(maxCols, needCols - maxCols);

    // 批量寫入
    const dataRange = targetSheet.getRange(1, 1, needRows, needCols);
    dataRange.setValues(allValues);
    dataRange.setBackgrounds(allBgColors);
    dataRange.setFontColors(allFontColors);
    dataRange.setFontWeights(allFontWeights);
    dataRange.setHorizontalAlignments(allHAligns);

    // 合併儲存格
    mergesToApply.forEach(m => {
        targetSheet.getRange(m.row, m.col, m.numRows, m.numCols).merge();
    });

    // 細邊框（全範圍）
    dataRange.setBorder(true, true, true, true, true, true);

    // 粗外框線（每個日期群組）
    thickBorders.forEach(b => {
        targetSheet.getRange(b.row, b.col, b.numRows, b.numCols).setBorder(
            true, true, true, true, null, null,
            "#000000", SpreadsheetApp.BorderStyle.SOLID_THICK
        );
    });

    // 總標題字體大小
    targetSheet.getRange(1, 1).setFontSize(16);

    console.log(`渲染完成！共 ${sortedDates.length} 天`);
}

// --- 輔助函式 ---

function _getRowStyle(record) {
    const status = record._status || record["狀態"] || "";
    if (status === "取消") return { bgColor: "#F5F5F5", textColor: "#9E9E9E" };

    const textToSearch = [
        record._bookingType || "", record._inspectionMethod || "",
        record["預約項目"] || "", record["預約方式"] || ""
    ].join(" ");

    for (const config of SCHEDULE_KEYWORD_COLOR_MAP) {
        if (config.keyword && textToSearch.includes(config.keyword)) {
            return { bgColor: config.bgColor, textColor: config.textColor };
        }
    }
    return { bgColor: "#EEEEEE", textColor: "#212121" };
}

function _getDayOfWeek(dateStr) {
    const days = ["日", "一", "二", "三", "四", "五", "六"];
    const date = new Date(dateStr.replace(/\//g, "-"));
    if (isNaN(date)) return "";
    return "週" + days[date.getDay()];
}

function onOpen() {
    SpreadsheetApp.getUi()
        .createMenu("🏠 ANXI 工具")
        .addItem("📅 同步驗屋時間表", "renderInspectionSchedule")
        .addToUi();

    // 每次開啟 Sheet 時自動渲染
    renderInspectionSchedule();
}
