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
const SCHEDULE_HOUSEHOLD_SHEET_NAME = "森之樹分戶"; // 分戶總表（用於查詢優付標記）
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

    // --- 3.5 建立優付查詢表（從「森之樹分戶」Sheet 讀取） ---
    const priorityPaymentMap = _buildPriorityPaymentMap(ss);
    console.log(`已建立優付查詢表，共 ${Object.keys(priorityPaymentMap).length} 筆優付戶別`);

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
        // 存入 System ID 作為唯一識別符（不隨日期/時間異動而改變）
        const sysIdIdx = colIndexMap["System ID (勿動)"];
        record._systemId = sysIdIdx !== undefined ? (row[sysIdIdx] || "").toString().trim() : "";
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

    // --- 6. 讀取現有手動輸入資料（備註、驗屋人員） ---
    // 重要：必須先 breakApart 合併儲存格，否則 getValues() 只有左上角有值
    const existMaxRows = targetSheet.getMaxRows();
    const existMaxCols = targetSheet.getMaxColumns();
    if (existMaxRows >= 2 && existMaxCols >= numColumns) {
        const existMerged = targetSheet.getRange(1, 1, existMaxRows, existMaxCols).getMergedRanges();
        existMerged.forEach(r => r.breakApart());
    }
    const existingManualData = _readExistingManualData(targetSheet, numColumns);
    console.log(`已讀取 ${Object.keys(existingManualData).length} 筆現有手動輸入資料`);
    // debug: 列出所有讀到的 key
    Object.keys(existingManualData).forEach(k => {
        console.log(`  舊資料 key=[${k}] remarks=[${existingManualData[k].remarks}] inspector=[${existingManualData[k].inspector}]`);
    });

    // --- 7. 在記憶體中準備所有渲染資料（批量操作） ---
    const totalColumns = SCHEDULE_DAYS_PER_ROW * numColumns;

    const allValues = [];
    const allBgColors = [];
    const allFontColors = [];
    const allFontWeights = [];
    const allHAligns = [];
    const allNotes = [];  // 用於在 cell note 中隱藏存放 System ID
    const mergesToApply = [];
    const thickBorders = [];

    // 總標題行
    const titleRow = new Array(totalColumns).fill("");
    const titleBg = new Array(totalColumns).fill("#005B9A");
    const titleFc = new Array(totalColumns).fill("#FFFFFF");
    const titleFw = new Array(totalColumns).fill("bold");
    const titleHa = new Array(totalColumns).fill("left");
    const titleNotes = new Array(totalColumns).fill("");
    titleRow[0] = "富宇森之樹－驗屋時間表";
    allValues.push(titleRow);
    allBgColors.push(titleBg);
    allFontColors.push(titleFc);
    allFontWeights.push(titleFw);
    allHAligns.push(titleHa);
    allNotes.push(titleNotes);
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
            allNotes.push(new Array(totalColumns).fill(""));
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
                    const sysId = appt._systemId || "";
                    const householdVal = _normalizeCell(appt["戶號"] || "");

                    // 策略：優先用 System ID 匹配（跨日期移動也能追蹤）
                    //       若無 System ID，fallback 用「日期+戶號」
                    let existingData = null;
                    if (sysId && existingManualData[`sid:${sysId}`]) {
                        existingData = existingManualData[`sid:${sysId}`];
                        console.log(`[SystemID匹配] sid=${sysId} remarks=[${existingData.remarks}] inspector=[${existingData.inspector}]`);
                    } else {
                        const fallbackKey = `${dateStr}|${householdVal}`;
                        if (existingManualData[fallbackKey]) {
                            existingData = existingManualData[fallbackKey];
                            console.log(`[Fallback匹配] key=[${fallbackKey}] remarks=[${existingData.remarks}] inspector=[${existingData.inspector}]`);
                        }
                    }

                    displayColumns.forEach((col, colIdx) => {
                        const c = startCol + colIdx;
                        const r = currentRowIdx + 2 + i;

                        // 備註和驗屋人員欄位：優先使用用戶手動輸入的舊資料
                        if (col.label === "_備註" && existingData && existingData.remarks) {
                            allValues[r][c] = existingData.remarks;
                        } else if (col.label === "_驗屋人員" && existingData && existingData.inspector) {
                            allValues[r][c] = existingData.inspector;
                        } else {
                            let cellValue = appt[col.label] || "";
                            // 預約人姓名欄位：若該戶別為優付戶（優付="V"），加上 "※" 前綴
                            if (col.label === "預約人姓名" && cellValue) {
                                const household = _normalizeCell(appt["戶號"] || "");
                                if (household && priorityPaymentMap[household]) {
                                    cellValue = "※" + cellValue;
                                }
                            }
                            allValues[r][c] = cellValue;
                        }
                        allBgColors[r][c] = style.bgColor;
                        allFontColors[r][c] = style.textColor;

                        // 在「時間」欄位的 cell note 中隱藏存放 System ID
                        if (col.label === "預約時段" && sysId) {
                            allNotes[r][c] = `sid:${sysId}`;
                        }
                    });
                }
            }

            // 粗外框線
            thickBorders.push({ row: currentRowIdx + 1, col: startCol + 1, numRows: blockHeight, numCols: numColumns });
        });
    }

    // --- 8. 清空目標 sheet 並一次性批量寫入 ---
    const maxRows = targetSheet.getMaxRows();
    const maxCols = targetSheet.getMaxColumns();

    // 取消合併儲存格
    const mergedRanges = targetSheet.getRange(1, 1, maxRows, maxCols).getMergedRanges();
    mergedRanges.forEach(r => r.breakApart());

    // 清除內容、格式和 notes（不影響欄寬列高）
    targetSheet.getRange(1, 1, maxRows, maxCols)
        .clearContent()
        .clearFormat()
        .clearNote()
        .setFontFamily("標楷體")
        .setFontSize(13)
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
    dataRange.setNotes(allNotes);  // 批量寫入 System ID 到 cell note

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

    console.log(`渲染完成！共 ${sortedDates.length} 天，已保留 ${Object.keys(existingManualData).length} 筆手動輸入資料`);
}

// --- 輔助函式 ---

/**
 * 正規化儲存格值：處理 Google Sheets getValues() 返回 Date 物件的問題
 * Google Sheets 會自動將 "09:00" 辨識為時間型別，getValues() 返回 Date 物件
 * 此函式將 Date 轉為可比對的字串
 */
function _normalizeCell(val) {
    if (val == null || val === "") return "";
    if (val instanceof Date) {
        // GAS 時間基準日為 1899-12-30，判斷是否為「純時間」
        if (val.getFullYear() <= 1900) {
            const h = String(val.getHours()).padStart(2, "0");
            const m = String(val.getMinutes()).padStart(2, "0");
            return `${h}:${m}`;
        }
        // 一般日期
        const y = val.getFullYear();
        const mm = String(val.getMonth() + 1).padStart(2, "0");
        const d = String(val.getDate()).padStart(2, "0");
        return `${y}/${mm}/${d}`;
    }
    return val.toString().trim();
}

/**
 * 讀取現有驗屋時間表中用戶手動輸入的「備註」和「驗屋人員」資料
 * 
 * 匹配策略（雙重 key）：
 *   - 主要 key:  `sid:{System ID}`   → 用 cell note 中存放的 System ID（跨日期移動也能追蹤）
 *   - 備援 key:  `{日期}|{戶號}`     → 當 note 不存在時（例如首次升級後同步）
 * 
 * 佈局解析：
 *   1. 逐行掃描，尋找欄位標頭行（第一欄為「時間」）
 *   2. 從標頭行的前一行取得日期
 *   3. 從標頭行的下方讀取資料行
 *   4. 同時讀取對應位置的 cell note 取得 System ID
 * 
 * @param {Sheet} targetSheet - 驗屋時間表 sheet
 * @param {number} numColumns - 每天的欄位數
 * @returns {Object} key => { remarks, inspector } 的對應表
 */
function _readExistingManualData(targetSheet, numColumns) {
    const result = {};
    const maxRows = targetSheet.getMaxRows();
    const maxCols = targetSheet.getMaxColumns();

    if (maxRows < 3 || maxCols < numColumns) return result;

    // 注意：呼叫前應已 breakApart 合併儲存格
    const fullRange = targetSheet.getRange(1, 1, maxRows, maxCols);
    const allData = fullRange.getValues();
    const allNotes = fullRange.getNotes();  // 讀取所有 cell note（含 System ID）
    console.log(`_readExistingManualData: 讀取 ${allData.length} 行 x ${maxCols} 列`);

    // 逐行掃描，尋找欄位標頭行
    for (let rowIdx = 2; rowIdx < allData.length; rowIdx++) {
        const row = allData[rowIdx];
        if (!row) continue;

        // 遍歷每天的區塊
        for (let dayIdx = 0; dayIdx < SCHEDULE_DAYS_PER_ROW; dayIdx++) {
            const startCol = dayIdx * numColumns;
            if (startCol >= row.length) break;

            // 檢查此行此區塊是否為欄位標頭行（第一欄是「時間」）
            const firstHeaderCell = _normalizeCell(row[startCol]);
            if (firstHeaderCell !== "時間") continue;

            // 找到欄位標頭行！解析各欄位偏移量
            let remarksColOffset = -1;
            let inspectorColOffset = -1;
            let householdColOffset = -1;
            let timeSlotColOffset = 0; // 時間欄就是第一欄（startCol + 0）

            for (let c = 0; c < numColumns; c++) {
                const headerText = _normalizeCell(row[startCol + c]);
                if (headerText === "備註") remarksColOffset = c;
                if (headerText === "驗屋人員") inspectorColOffset = c;
                if (headerText === "戶別") householdColOffset = c;
            }

            // 如果找不到備註或驗屋人員欄位，跳過
            if (remarksColOffset < 0 && inspectorColOffset < 0) continue;

            // 從前一行取得日期標頭
            const dateRowIdx = rowIdx - 1;
            if (dateRowIdx < 0) continue;
            const dateCell = _normalizeCell(allData[dateRowIdx][startCol]);
            const dateMatch = dateCell.match(/^(\d{4}\/\d{2}\/\d{2})/);
            if (!dateMatch) {
                console.log(`  dayIdx=${dayIdx} rowIdx=${rowIdx}: 前一行非日期 [${dateCell}]`);
                continue;
            }
            const dateStr = dateMatch[1];

            // 從標頭行下方開始讀取資料行
            for (let dataRowIdx = rowIdx + 1; dataRowIdx < allData.length; dataRowIdx++) {
                const dataRow = allData[dataRowIdx];
                if (!dataRow) break;

                // 檢查是否已到下一個區塊
                const checkCell = _normalizeCell(dataRow[startCol]);
                if (checkCell.match(/^\d{4}\/\d{2}\/\d{2}/)) break;
                if (checkCell === "時間" || checkCell === "預約時段") break;

                // 讀取備註和驗屋人員值
                const household = householdColOffset >= 0 ? _normalizeCell(dataRow[startCol + householdColOffset]) : "";
                const remarks = remarksColOffset >= 0 ? _normalizeCell(dataRow[startCol + remarksColOffset]) : "";
                const inspector = inspectorColOffset >= 0 ? _normalizeCell(dataRow[startCol + inspectorColOffset]) : "";

                // 備註或驗屋人員至少有一個有值才保存
                if (!(remarks || inspector)) continue;

                // 從「時間」欄的 cell note 中讀取 System ID
                const noteVal = (allNotes[dataRowIdx] && allNotes[dataRowIdx][startCol + timeSlotColOffset]) || "";
                const sidMatch = noteVal.match(/^sid:(.+)$/);

                if (sidMatch) {
                    // 主要 key: System ID（跨日期移動也能追蹤）
                    const sidKey = `sid:${sidMatch[1]}`;
                    result[sidKey] = { remarks, inspector };
                    console.log(`  保存[SID]: key=[${sidKey}] 備註=[${remarks}] 驗屋人員=[${inspector}]`);
                }

                if (household) {
                    // 備援 key: 日期+戶號（首次升級或 note 遺失時用）
                    const fallbackKey = `${dateStr}|${household}`;
                    result[fallbackKey] = { remarks, inspector };
                    console.log(`  保存[FB]:  key=[${fallbackKey}] 備註=[${remarks}] 驗屋人員=[${inspector}]`);
                }
            }
        }
    }

    return result;
}

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

/**
 * 從「森之樹分戶」Sheet 讀取「戶別」與「優付」欄位，
 * 建立查詢表：戶別 => true（僅收錄優付="V"的戶別）
 * 
 * @param {Spreadsheet} ss - 當前活頁簿
 * @returns {Object} 優付查詢表，key 為戶別字串，value 為 true
 */
function _buildPriorityPaymentMap(ss) {
    const map = {};
    const sheet = ss.getSheetByName(SCHEDULE_HOUSEHOLD_SHEET_NAME);
    if (!sheet) {
        console.log(`找不到分戶總表「${SCHEDULE_HOUSEHOLD_SHEET_NAME}」，跳過優付查詢`);
        return map;
    }

    const data = sheet.getDataRange().getValues();
    if (data.length < 2) {
        console.log("分戶總表無資料");
        return map;
    }

    const headers = data[0].map(h => h.toString().trim());
    const householdIdx = headers.indexOf("戶別");
    const priorityIdx = headers.indexOf("優付");

    if (householdIdx < 0) {
        console.log("分戶總表中找不到「戶別」欄位");
        return map;
    }
    if (priorityIdx < 0) {
        console.log("分戶總表中找不到「優付」欄位");
        return map;
    }

    for (let i = 1; i < data.length; i++) {
        const household = (data[i][householdIdx] || "").toString().trim();
        const priority = (data[i][priorityIdx] || "").toString().trim();
        if (household && priority === "V") {
            map[household] = true;
        }
    }

    console.log(`優付查詢表建立完成：${Object.keys(map).length} 筆優付戶別 → ${Object.keys(map).join(", ")}`);
    return map;
}



function onOpen() {
    SpreadsheetApp.getUi()
        .createMenu("🏠 ANXI 工具")
        .addItem("📅 同步驗屋時間表", "renderInspectionSchedule")
        .addItem("🏦 同步對保資料到分戶表", "processBankLinks")
        .addToUi();
}
