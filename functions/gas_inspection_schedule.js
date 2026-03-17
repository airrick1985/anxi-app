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
 * 使用方式：
 *   1. 在 Google Sheet 中開啟「擴充功能 → Apps Script」
 *   2. 將此腳本貼入
 *   3. 執行 renderInspectionSchedule() 或設定觸發器自動執行
 */

// --- 設定區域 ---
const SOURCE_SHEET_NAME = "ANXI預約資料";   // 來源資料 sheet 名稱
const TARGET_SHEET_NAME = "驗屋時間表";       // 目標渲染 sheet 名稱
const DAYS_PER_ROW = 3;                       // 每行排列幾天

// 從來源 sheet 讀取哪些欄位，以及渲染到目標的順序
// label: sheet 標頭名稱（對應 ANXI預約資料的欄位標頭，以 "_" 開頭為硬編碼空白欄位）
// displayLabel: 渲染到驗屋時間表時顯示的標題
const DISPLAY_COLUMNS = [
    { label: "預約時段", displayLabel: "時間" },
    { label: "戶號", displayLabel: "戶別" },
    { label: "預約人姓名", displayLabel: "預約人" },
    { label: "預約項目", displayLabel: "預約項目" },
    { label: "預約方式", displayLabel: "選擇方式" },
    // 動態欄位會自動偵測並插入在「選擇方式」之後
    { label: "狀態", displayLabel: "狀態" },
    { label: "_備註", displayLabel: "備註" },       // 硬編碼空白欄位，供手動填寫
    { label: "_驗屋人員", displayLabel: "驗屋人員" },  // 硬編碼空白欄位，供手動填寫
];

// 只渲染以下預約項目（未來可擴充）
const ALLOWED_BOOKING_TYPES = ["初驗", "複驗"];

// 關鍵字色彩對應（背景色, 文字色）
const KEYWORD_COLOR_MAP = [
    { keyword: "已撥款", bgColor: "#ffc107", textColor: "#212529" },
    { keyword: "交屋", bgColor: "#ffc107", textColor: "#212529" },
    { keyword: "初驗", bgColor: "#d4edda", textColor: "#155724" },
    { keyword: "複驗", bgColor: "#f8d7da", textColor: "#721c24" },
];

// --- 主函式 ---
function renderInspectionSchedule() {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sourceSheet = ss.getSheetByName(SOURCE_SHEET_NAME);

    if (!sourceSheet) {
        console.log(`找不到來源工作表「${SOURCE_SHEET_NAME}」`);
        return;
    }

    // 建立或清空目標 sheet
    let targetSheet = ss.getSheetByName(TARGET_SHEET_NAME);
    if (!targetSheet) {
        targetSheet = ss.insertSheet(TARGET_SHEET_NAME);
    } else {
        targetSheet.clear();
        // 清除所有格式
        targetSheet.getRange(1, 1, targetSheet.getMaxRows(), targetSheet.getMaxColumns())
            .setBackground(null)
            .setFontColor(null)
            .setFontWeight(null)
            .setFontFamily(null)
            .setFontSize(10)
            .setHorizontalAlignment(null)
            .setVerticalAlignment(null)
            .setWrap(false);
        // 取消所有合併儲存格
        const mergedRanges = targetSheet.getRange(1, 1, targetSheet.getMaxRows(), targetSheet.getMaxColumns()).getMergedRanges();
        mergedRanges.forEach(r => r.breakApart());
    }

    // --- 1. 讀取來源資料 ---
    const sourceData = sourceSheet.getDataRange().getValues();
    if (sourceData.length < 2) {
        console.log("來源工作表無資料");
        return;
    }

    const sourceHeaders = sourceData[0].map(h => h.toString().trim());
    const dataRows = sourceData.slice(1);

    // --- 2. 偵測動態欄位（排除固定欄位） ---
    const fixedLabels = new Set([
        "System ID (勿動)", "建立時間", "預約代碼", "狀態", "專案",
        "戶號", "地址", "預約項目", "預約方式", "預約日期", "預約時段",
        "預約人姓名", "預約人電話", "預約人Email", "預約人身分證",
        "代理人姓名", "代理人電話", "上傳報告", "是否已確認銀行?", "承辦人電話", "承辦人姓名", "銀行及分行"
    ]);
    const dynamicLabels = sourceHeaders.filter(h => h && !fixedLabels.has(h));

    // 建立完整的顯示欄位（在「選擇方式」之後插入動態欄位）
    const displayColumns = [];
    for (const col of DISPLAY_COLUMNS) {
        displayColumns.push(col);
        if (col.label === "預約方式") {
            // 插入動態欄位
            dynamicLabels.forEach(dl => {
                displayColumns.push({ label: dl, displayLabel: dl });
            });
        }
    }

    const numColumns = displayColumns.length;

    // --- 3. 建立欄位索引對應 ---
    const colIndexMap = {};
    sourceHeaders.forEach((h, i) => { colIndexMap[h] = i; });

    // --- 4. 將資料按日期分組 ---
    const dateColIdx = colIndexMap["預約日期"];
    if (dateColIdx === undefined) {
        console.log("來源工作表中找不到「預約日期」欄位");
        return;
    }

    const groupedByDate = {};
    dataRows.forEach(row => {
        const status = colIndexMap["狀態"] !== undefined ? row[colIndexMap["狀態"]].toString().trim() : "";
        const bookingType = colIndexMap["預約項目"] !== undefined ? row[colIndexMap["預約項目"]].toString().trim() : "";
        const dateVal = row[dateColIdx];
        if (!dateVal) return;

        // 過濾：狀態=取消 不渲染
        if (status === "取消") return;

        // 過濾：只渲染指定的預約項目
        const isAllowed = ALLOWED_BOOKING_TYPES.some(t => bookingType.includes(t));
        if (!isAllowed) return;

        let dateStr;
        if (dateVal instanceof Date) {
            dateStr = Utilities.formatDate(dateVal, "GMT+8", "yyyy/MM/dd");
        } else {
            // 嘗試解析字串日期
            const parsed = new Date(dateVal);
            if (!isNaN(parsed)) {
                dateStr = Utilities.formatDate(parsed, "GMT+8", "yyyy/MM/dd");
            } else {
                dateStr = dateVal.toString();
            }
        }

        if (!groupedByDate[dateStr]) groupedByDate[dateStr] = [];

        // 擷取需要的欄位值
        const record = {};
        displayColumns.forEach(col => {
            // 以 "_" 開頭的 label 是硬編碼空白欄位（如備註、驗屋人員）
            if (col.label.startsWith("_")) {
                record[col.label] = "";
                return;
            }
            const idx = colIndexMap[col.label];
            let value = idx !== undefined ? (row[idx] || "") : "";

            // 修正時間格式：如果是 Date 物件（常見的 1899/12/30 問題），轉為 HH:mm
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

    // --- 5. 排序日期 ---
    const sortedDates = Object.keys(groupedByDate).sort();

    if (sortedDates.length === 0) {
        console.log("沒有可渲染的預約資料（已排除取消及非初驗/複驗項目）");
        return;
    }

    // --- 6. 渲染到目標 sheet ---
    let currentRow = 1;

    // 總標題
    const totalColumns = DAYS_PER_ROW * numColumns;
    targetSheet.getRange(1, 1, 1, totalColumns).merge();
    targetSheet.getRange(1, 1)
        .setValue("富宇森之樹－驗屋時間表")
        .setFontFamily("標楷體")
        .setFontSize(16)
        .setFontWeight("bold")
        .setFontColor("#FFFFFF")
        .setBackground("#005B9A")
        .setHorizontalAlignment("left")
        .setVerticalAlignment("middle");
    currentRow = 2;

    // 每 DAYS_PER_ROW 天為一組
    for (let chunkStart = 0; chunkStart < sortedDates.length; chunkStart += DAYS_PER_ROW) {
        const chunk = sortedDates.slice(chunkStart, chunkStart + DAYS_PER_ROW);

        // 計算這一組中最多的預約筆數
        let maxAppointments = 0;
        chunk.forEach(dateStr => {
            const appts = groupedByDate[dateStr] || [];
            if (appts.length > maxAppointments) maxAppointments = appts.length;
        });
        if (maxAppointments === 0) maxAppointments = 1; // 至少留一行空白

        // 渲染每天
        chunk.forEach((dateStr, dayIdx) => {
            const startCol = dayIdx * numColumns + 1;
            const appts = groupedByDate[dateStr] || [];

            // 排序：依時段排序
            appts.sort((a, b) => {
                const timeA = a["預約時段"] || "";
                const timeB = b["預約時段"] || "";
                return timeA.toString().localeCompare(timeB.toString());
            });

            // --- 日期標頭行 ---
            const dateHeaderRange = targetSheet.getRange(currentRow, startCol, 1, numColumns);
            dateHeaderRange.merge();
            const dayOfWeek = _getDayOfWeek(dateStr);
            dateHeaderRange.setValue(`${dateStr} (${dayOfWeek})`)
                .setFontFamily("標楷體")
                .setFontSize(12)
                .setFontWeight("bold")
                .setBackground("#fff2cc")
                .setHorizontalAlignment("center")
                .setVerticalAlignment("middle")
                .setBorder(true, true, true, true, true, true);

            // --- 欄位標頭行 ---
            displayColumns.forEach((col, colIdx) => {
                const cell = targetSheet.getRange(currentRow + 1, startCol + colIdx);
                cell.setValue(col.displayLabel)
                    .setFontFamily("標楷體")
                    .setFontSize(10)
                    .setFontWeight("bold")
                    .setBackground("#fff2cc")
                    .setHorizontalAlignment("center")
                    .setVerticalAlignment("middle")
                    .setBorder(true, true, true, true, true, true);
            });

            // --- 預約資料行 ---
            for (let i = 0; i < maxAppointments; i++) {
                const appt = appts[i];
                displayColumns.forEach((col, colIdx) => {
                    const cell = targetSheet.getRange(currentRow + 2 + i, startCol + colIdx);
                    if (appt) {
                        const value = appt[col.label] || "";
                        const rowStyle = _getRowStyle(appt);
                        cell.setValue(value)
                            .setFontFamily("標楷體")
                            .setFontSize(10)
                            .setBackground(rowStyle.bgColor)
                            .setFontColor(rowStyle.textColor)
                            .setHorizontalAlignment("center")
                            .setVerticalAlignment("middle")
                            .setWrap(true)
                            .setBorder(true, true, true, true, true, true);
                    } else {
                        cell.setValue("")
                            .setFontFamily("標楷體")
                            .setFontSize(10)
                            .setVerticalAlignment("middle")
                            .setBorder(true, true, true, true, true, true);
                    }
                });
            }

            // --- 整個日期群組的粗外框線（上下左右） ---
            const groupRows = 2 + maxAppointments; // 日期標頭 + 欄位標頭 + 資料行數
            const groupRange = targetSheet.getRange(currentRow, startCol, groupRows, numColumns);
            groupRange.setBorder(
                true, true, true, true,  // top, left, bottom, right
                null, null,              // vertical, horizontal（不覆蓋內部線）
                "#000000",               // 色彩
                SpreadsheetApp.BorderStyle.SOLID_THICK // 粗線
            );
        });

        // 移動到下一組的起始行
        currentRow += 2 + maxAppointments; // 日期標頭 + 欄位標頭 + 資料行數
    }

    // --- 7. 完成（不調整欄寬列高，保留已設定的格式） ---

    console.log(`渲染完成！共 ${sortedDates.length} 天，已輸出到「${TARGET_SHEET_NAME}」工作表。`);
}

// --- 輔助函式 ---

/**
 * 根據預約狀態和關鍵字決定行的樣式
 */
function _getRowStyle(record) {
    const status = record._status || record["狀態"] || "";

    // 取消 → 灰色（理論上不會觸發，因為已在前面過濾）
    if (status === "取消") {
        return { bgColor: "#F5F5F5", textColor: "#9E9E9E" };
    }

    // 關鍵字比對
    const textToSearch = [
        record._bookingType || "",
        record._inspectionMethod || "",
        record["預約項目"] || "",
        record["預約方式"] || ""
    ].join(" ");

    for (const config of KEYWORD_COLOR_MAP) {
        if (config.keyword && textToSearch.includes(config.keyword)) {
            return { bgColor: config.bgColor, textColor: config.textColor };
        }
    }

    // 預設
    return { bgColor: "#EEEEEE", textColor: "#212121" };
}

/**
 * 取得日期的星期中文
 */
function _getDayOfWeek(dateStr) {
    const days = ["日", "一", "二", "三", "四", "五", "六"];
    const date = new Date(dateStr.replace(/\//g, "-"));
    if (isNaN(date)) return "";
    return "週" + days[date.getDay()];
}

/**
 * 加入選單（方便從選單執行）
 */
function onOpen() {
    SpreadsheetApp.getUi()
        .createMenu("🏠 ANXI 工具")
        .addItem("📅 同步驗屋時間表", "renderInspectionSchedule")
        .addToUi();

    // 每次開啟 Sheet 時自動渲染驗屋時間表
    renderInspectionSchedule();
}

