/**
 * ====================================================================
 * Google Apps Script - 銀行資料同步（合併版）
 * ====================================================================
 * 
 * 本腳本合併了以下兩個功能：
 * 
 * 【功能 A】processBankLinks（onChange 自動觸發）
 *   - 來源：ANXI系統資料（Log）+ ANXI預約資料
 *   - 目標欄位：銀行、銀行窗口、銀行附件、銀行紀錄時間
 *   - 邏輯：彙整所有來源的銀行資料，按時間排序、篩選有效紀錄
 * 
 * 【功能 B】syncLoanDataToHousehold（手動選單觸發）
 *   - 來源：ANXI預約資料（僅篩選 預約項目="對保"）
 *   - 目標欄位：銀行、銀行窗口
 *   - 邏輯：專門處理對保預約資料，寫入銀行欄位
 * 
 * ⚠️ 注意：兩個功能都寫入「銀行」「銀行窗口」欄位。
 *    syncLoanDataToHousehold 會以逗號銜接現有資料，不會覆蓋。
 *    processBankLinks 額外管理「銀行附件」「銀行紀錄時間」欄位。
 * ====================================================================
 */

// ====================================================================
// 共用設定區域
// ====================================================================

// --- 工作表名稱 ---
const SHEET_NAMES = {
    RESULT: "森之樹分戶",        // 目標結果表
    SOURCE_LOG: "ANXI系統資料",   // Log 資料來源
    SOURCE_APPT: "ANXI預約資料",  // 預約資料來源
};

// --- processBankLinks 表頭對應 ---
const BANK_HEADERS = {
    ID: "戶別",
    BANK: "銀行",
    CONTACT: "銀行窗口",
    ATTACH: "銀行附件",
    VERSION: "銀行紀錄時間",
};

// --- processBankLinks 使用的預約表頭 ---
const APPT_HEADERS = {
    APPT_ID: "戶號",
    APPT_TIME: "建立時間",
    APPT_TYPE: "預約方式",
    APPT_STATUS: "狀態",
    APPT_DETAIL: "詳細資訊",
    APPT_BOOKING_TYPE: "預約項目",
};

// --- processBankLinks 使用的 Log 表頭（ANXI系統資料）---
const LOG_HEADERS = {
    UNIT_ID: "unitId",             // AH欄 - 戶號
    CUSTOMER_MESSAGES: "customerMessages", // AR欄 - Log 內容
};

// --- syncLoanDataToHousehold 使用的對保表頭 ---
const LOAN_HEADERS = {
    BOOKING_TYPE: "預約項目",
    STATUS: "狀態",
    HOUSEHOLD_ID: "戶號",
    BOOKING_METHOD: "預約方式",
    BANK_BRANCH: "銀行及分行",
    AGENT_NAME: "承辦人姓名",
    AGENT_PHONE: "承辦人電話",
};

// --- syncLoanDataToHousehold 目標表頭 ---
const LOAN_TARGET_HEADERS = {
    HOUSEHOLD_ID: "戶別",
    TARGET_BANK: "銀行",
    TARGET_CONTACT: "銀行窗口",
};

// --- 對保篩選條件 ---
const LOAN_FILTER = {
    BOOKING_TYPE: "對保",
    EXCLUDE_STATUS: "取消",
};


// ====================================================================
// 共用輔助函式
// ====================================================================

/**
 * 取得工作表的表頭索引 Map
 * @param {Sheet} sheet - Google Sheet 工作表物件
 * @returns {Object} { "欄位名": 欄位位置(1-based) }
 */
function getHeaderMap(sheet) {
    const headerRow = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    const map = {};
    headerRow.forEach((name, i) => map[name.toString().trim()] = i + 1);
    return map;
}

/**
 * 解析預約詳細資訊字串（用於 processBankLinks）
 * @param {string} detailStr - 詳細資訊原始字串
 * @returns {{ bank: string, contact: string }}
 */
function parseApptDetail(detailStr) {
    if (!detailStr || detailStr.trim() === "" || detailStr === "{}") {
        return { bank: "自覓銀行", contact: "尚未回報" };
    }
    const bankMatch = detailStr.match(/銀行及分行:\s*([^\n\r}]+)/);
    const nameMatch = detailStr.match(/承辦人姓名:\s*([^\n\r}]+)/);
    const phoneMatch = detailStr.match(/承辦人電話:\s*([^\n\r}]+)/);
    const bank = bankMatch ? bankMatch[1].trim() : "自覓銀行";
    const name = nameMatch ? nameMatch[1].trim() : "";
    const phone = phoneMatch ? phoneMatch[1].trim() : "";
    const contact = (name || phone) ? (name + " | " + phone).trim() : "尚未回報";
    return { bank: bank, contact: contact };
}

/**
 * 正規化電話號碼（用於 syncLoanDataToHousehold）
 * - 移除所有 "-" 符號
 * - 若號碼以 "9" 開頭（手機缺少前導 0），自動補上 "0"
 * - 支援分機格式：# 或 "分機" 統一轉為 #分機號
 * 
 * 範例：
 *   988888888        → 0988888888
 *   0988-888-888     → 0988888888
 *   03-8888888       → 038888888
 *   03-5559111#217   → 035559111#217
 *   03-5555555分機123 → 035555555#123
 */
function _normalizePhone(phone) {
    if (!phone) return "";

    let mainPart = phone;
    let ext = "";

    // 先處理分機：支援 "#" 或 "分機" 分隔
    const extMatch = phone.match(/[#＃](.+)$/);
    const extMatch2 = phone.match(/分機\s*(.+)$/);

    if (extMatch) {
        mainPart = phone.substring(0, phone.indexOf(extMatch[0]));
        ext = extMatch[1].trim();
    } else if (extMatch2) {
        mainPart = phone.substring(0, phone.indexOf(extMatch2[0]));
        ext = extMatch2[1].trim();
    }

    // 移除主號碼中的所有 "-"
    let normalized = mainPart.replace(/-/g, "").trim();

    // 若以 9 開頭且長度為 9（台灣手機缺少前導 0），補上 0
    if (normalized.startsWith("9") && normalized.length === 9) {
        normalized = "0" + normalized;
    }

    // 若有分機，附加 #分機號
    if (ext) {
        normalized += "#" + ext;
    }

    return normalized;
}

/**
 * 合併兩個逗號分隔的字串，去除重複項目
 * @param {string} existing - 現有欄位值（可能已有多項以逗號分隔）
 * @param {string} newValue - 要新增的值（可能也有多項以逗號分隔）
 * @returns {string} 合併後的字串，以 "," 分隔，無重複
 * 
 * 範例：
 *   ("台灣銀行", "合作金庫")           → "台灣銀行,合作金庫"
 *   ("台灣銀行", "台灣銀行")           → "台灣銀行"（去重）
 *   ("台灣銀行,合作金庫", "華南銀行") → "台灣銀行,合作金庫,華南銀行"
 *   ("", "合作金庫")                   → "合作金庫"
 */
function _mergeWithComma(existing, newValue) {
    if (!existing && !newValue) return "";
    if (!existing) return newValue;
    if (!newValue) return existing;

    // 拆分現有值與新值
    const existingParts = existing.split(",").map(s => s.trim()).filter(s => s !== "");
    const newParts = newValue.split(",").map(s => s.trim()).filter(s => s !== "");

    // 合併並去重（保留順序：現有值在前、新值在後）
    const merged = [...existingParts];
    newParts.forEach(part => {
        if (!merged.includes(part)) {
            merged.push(part);
        }
    });

    return merged.join(",");
}


// ====================================================================
// 【功能 A】processBankLinks - 銀行資料自動同步
// ====================================================================
// 觸發方式：onChange Trigger (autoTriggerOnChange)
// 寫入欄位：銀行、銀行窗口、銀行附件、銀行紀錄時間

/**
 * onChange 觸發入口（延遲 1 秒後執行）
 */
function autoTriggerOnChange(e) {
    Utilities.sleep(1000);
    processBankLinks();
}

/**
 * 主函式：處理銀行資料連結
 * 從 ANXI系統資料（Log）與 ANXI預約資料 彙整銀行資訊
 */
function processBankLinks() {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const mainSheet = ss.getSheetByName(SHEET_NAMES.RESULT);
    const logSheet = ss.getSheetByName(SHEET_NAMES.SOURCE_LOG);
    const apptSheet = ss.getSheetByName(SHEET_NAMES.SOURCE_APPT);
    if (!mainSheet || !logSheet || !apptSheet) return;

    const mCol = getHeaderMap(mainSheet);
    const aCol = getHeaderMap(apptSheet);
    const lCol = getHeaderMap(logSheet); // Log 表動態表頭查詢
    const lastRow = mainSheet.getLastRow();
    if (lastRow < 2) return;

    const mData = mainSheet.getRange(1, 1, lastRow, mainSheet.getLastColumn()).getValues();
    const mRichTexts = mainSheet.getRange(1, 1, lastRow, mainSheet.getLastColumn()).getRichTextValues();

    // 讀取 Log 資料（動態表頭查詢，取代硬編碼索引）
    const logRaw = logSheet.getDataRange().getValues();
    const logUnitIdCol = lCol[LOG_HEADERS.UNIT_ID];             // unitId 欄位位置
    const logMsgCol = lCol[LOG_HEADERS.CUSTOMER_MESSAGES];      // customerMessages 欄位位置

    if (!logUnitIdCol || !logMsgCol) {
        console.log(`❌ Log 表缺少必要欄位：unitId=${logUnitIdCol}, customerMessages=${logMsgCol}`);
        return;
    }

    const logIds = logRaw.map(r => r[logUnitIdCol - 1] ? r[logUnitIdCol - 1].toString() : "");
    const logContents = logRaw.map(r => r[logMsgCol - 1] || "");

    const apptData = apptSheet.getDataRange().getValues();
    const apptIdIndex = aCol[APPT_HEADERS.APPT_ID] - 1;

    const writeV = [], writeW = [], writeX = [], writeY = [];
    const emptyRichText = SpreadsheetApp.newRichTextValue().setText("").build();

    for (let i = 1; i < mData.length; i++) {
        const row = mData[i];
        const searchId = row[mCol[BANK_HEADERS.ID] - 1].toString();
        const lastVersionInSheet = String(row[mCol[BANK_HEADERS.VERSION] - 1]).trim();

        // 用於收集該戶「所有」出現過的紀錄
        let allHistory = [];

        // --- 來源 A：Log 資料 ---
        // Log 格式範例：
        //   [2026/03/05 11:45] 自覓銀行回傳
        //   資料: 台新竹科 | 彭國華 | 0933948954
        //   附件:
        //   [檔案] https://firebasestorage.googleapis.com/...
        logIds.forEach((id, idx) => {
            if (id === searchId) {
                const content = logContents[idx].toString();
                if (!content) return;

                // 用時間戳記 [yyyy/MM/dd HH:mm] 分割多筆記錄
                const blocks = content.split(/(\[\d{4}\/\d{2}\/\d{2} \d{2}:\d{2}(?::\d{2})?\])/);

                // blocks 會是交替的：["", "[時間]", "內容", "[時間]", "內容", ...]
                for (let b = 1; b < blocks.length; b += 2) {
                    const timeStamp = blocks[b];           // [2026/03/05 11:45]
                    const blockContent = blocks[b + 1] || "";

                    if (blockContent.includes("自覓銀行回傳")) {
                        // 解析「資料: 銀行 | 姓名 | 電話」三段式格式
                        const dataMatch = blockContent.match(/資料:\s*(.+)/);
                        let bank = "", contact = "";

                        if (dataMatch) {
                            const parts = dataMatch[1].split("|").map(s => s.trim());
                            bank = parts[0] || "";                          // 銀行名稱
                            const name = parts[1] || "";                    // 承辦人姓名
                            const phone = parts[2] || "";                   // 承辦人電話
                            contact = (name && phone) ? (name + " | " + phone) :
                                (name || phone || "");
                        }

                        // 抓取所有附件 URL
                        const urls = [...blockContent.matchAll(/https?:\/\/[^\s\n\r]+/g)].map(m => m[0]);

                        allHistory.push({
                            time: timeStamp,
                            bank: bank,
                            contact: contact,
                            urls: urls,
                            versionStr: timeStamp,
                            status: "有效"
                        });
                    }
                }
            }
        });

        // --- 來源 B：預約系統資料（篩選：預約項目="對保" 且 狀態≠"取消"） ---
        apptData.forEach(r => {
            if (r[apptIdIndex].toString() !== searchId) return;

            // 篩選條件：預約項目 必須是「對保」
            const bookingType = (r[aCol[APPT_HEADERS.APPT_BOOKING_TYPE] - 1] || "").toString().trim();
            if (bookingType !== LOAN_FILTER.BOOKING_TYPE) return;

            // 篩選條件：狀態 不可以是「取消」
            const status = (r[aCol[APPT_HEADERS.APPT_STATUS] - 1] || "").toString().trim();
            if (status === LOAN_FILTER.EXCLUDE_STATUS) return;

            const rawTime = r[aCol[APPT_HEADERS.APPT_TIME] - 1];
            const rawType = r[aCol[APPT_HEADERS.APPT_TYPE] - 1];
            const rawDetail = r[aCol[APPT_HEADERS.APPT_DETAIL] - 1];
            const timeStr = "[" + Utilities.formatDate(new Date(rawTime), "GMT+8", "yyyy/MM/dd HH:mm:ss") + "]";

            let b, c;
            if (rawType === "自覓銀行") {
                const parsed = parseApptDetail(rawDetail);
                b = parsed.bank; c = parsed.contact;
            } else {
                b = rawType; c = "(預約系統)";
            }

            allHistory.push({
                time: timeStr,
                bank: b,
                contact: c,
                urls: [],
                versionStr: timeStr + " " + status,
                status: status
            });
        });

        // --- 決策邏輯 ---
        if (allHistory.length === 0) {
            // 完全沒資料：維持原狀
            writeV.push([row[mCol[BANK_HEADERS.BANK] - 1]]);
            writeW.push([row[mCol[BANK_HEADERS.CONTACT] - 1]]);
            writeX.push([mRichTexts[i][mCol[BANK_HEADERS.ATTACH] - 1]]);
            writeY.push([lastVersionInSheet]);
            continue;
        }

        // 先按時間排序
        allHistory.sort((a, b) => a.time.localeCompare(b.time));

        // 篩選出所有「非取消」的有效紀錄
        const validRecords = allHistory.filter(h => h.status !== "取消");

        let finalV, finalW, finalX, finalY;

        if (validRecords.length > 0) {
            // 只要還有有效紀錄，就合併它們
            finalV = validRecords.map(r => r.bank).join(", ");
            finalW = validRecords.map(r => r.contact).join(", ");
            finalY = validRecords.map(r => r.versionStr).join(", ");

            // 合併附件
            let combinedText = "";
            let linkSegments = [];
            let fileCount = 1;
            validRecords.forEach(vr => {
                vr.urls.forEach(url => {
                    const label = `📁檔案${fileCount} `;
                    const start = combinedText.length;
                    combinedText += label;
                    linkSegments.push({ start: start, end: start + label.length - 1, url: url });
                    fileCount++;
                });
            });
            if (combinedText !== "") {
                const rb = SpreadsheetApp.newRichTextValue().setText(combinedText.trim());
                linkSegments.forEach(l => rb.setLinkUrl(l.start, l.end, l.url));
                finalX = rb.build();
            } else {
                finalX = emptyRichText;
            }
        } else {
            // 如果「所有」紀錄都是取消
            finalV = "";
            finalW = "";
            finalX = emptyRichText;
            finalY = allHistory[allHistory.length - 1].versionStr;
        }

        // 防重複寫入：比對版本 + 實際內容，三者都相同才跳過
        // （修正：僅比對版本會導致外部修改後無法恢復正確值）
        const currentBank = String(row[mCol[BANK_HEADERS.BANK] - 1]).trim();
        const currentContact = String(row[mCol[BANK_HEADERS.CONTACT] - 1]).trim();
        const isContentSame = (finalY === lastVersionInSheet) &&
            (finalV === currentBank) &&
            (finalW === currentContact);

        if (isContentSame) {
            writeV.push([currentBank]);
            writeW.push([currentContact]);
            writeX.push([mRichTexts[i][mCol[BANK_HEADERS.ATTACH] - 1]]);
            writeY.push([lastVersionInSheet]);
        } else {
            writeV.push([finalV]);
            writeW.push([finalW]);
            writeX.push([finalX]);
            writeY.push([finalY]);
        }
    }

    // 批量更新
    mainSheet.getRange(2, mCol[BANK_HEADERS.BANK], writeV.length, 1).setValues(writeV);
    mainSheet.getRange(2, mCol[BANK_HEADERS.CONTACT], writeW.length, 1).setValues(writeW);
    mainSheet.getRange(2, mCol[BANK_HEADERS.ATTACH], writeX.length, 1).setRichTextValues(writeX);
    mainSheet.getRange(2, mCol[BANK_HEADERS.VERSION], writeY.length, 1).setValues(writeY);
}


// ====================================================================
// 【功能 B】syncLoanDataToHousehold - 對保資料手動同步
// ====================================================================
// 觸發方式：選單手動觸發
// 寫入欄位：銀行、銀行窗口（與功能 A 共用欄位，手動執行時會覆蓋）

/**
 * 主函式：同步對保資料到分戶表
 * 從 ANXI預約資料 篩選 預約項目="對保" 且 狀態≠"取消" 的資料
 */
function syncLoanDataToHousehold() {
    const ss = SpreadsheetApp.getActiveSpreadsheet();

    // --- 1. 取得來源表 ---
    const sourceSheet = ss.getSheetByName(SHEET_NAMES.SOURCE_APPT);
    if (!sourceSheet) {
        console.log(`❌ 找不到來源工作表「${SHEET_NAMES.SOURCE_APPT}」`);
        return;
    }

    // --- 2. 取得目標表 ---
    const targetSheet = ss.getSheetByName(SHEET_NAMES.RESULT);
    if (!targetSheet) {
        console.log(`❌ 找不到目標工作表「${SHEET_NAMES.RESULT}」`);
        return;
    }

    // --- 3. 讀取來源資料 ---
    const sourceData = sourceSheet.getDataRange().getValues();
    if (sourceData.length < 2) {
        console.log("來源工作表無資料");
        return;
    }

    const sourceHeaders = sourceData[0].map(h => h.toString().trim());
    const sourceRows = sourceData.slice(1);

    // 建立來源表頭索引
    const srcIdx = {};
    sourceHeaders.forEach((h, i) => { srcIdx[h] = i; });

    // 驗證必要欄位
    const requiredHeaders = [
        LOAN_HEADERS.BOOKING_TYPE,
        LOAN_HEADERS.STATUS,
        LOAN_HEADERS.HOUSEHOLD_ID,
        LOAN_HEADERS.BOOKING_METHOD,
        LOAN_HEADERS.BANK_BRANCH,
        LOAN_HEADERS.AGENT_NAME,
        LOAN_HEADERS.AGENT_PHONE,
    ];
    const missingHeaders = requiredHeaders.filter(h => srcIdx[h] === undefined);
    if (missingHeaders.length > 0) {
        console.log(`❌ 來源表缺少必要欄位：${missingHeaders.join(", ")}`);
        return;
    }

    // --- 4. 篩選資料：預約項目 = "對保" 且 狀態 ≠ "取消" ---
    const filteredRows = sourceRows.filter(row => {
        const bookingType = row[srcIdx[LOAN_HEADERS.BOOKING_TYPE]].toString().trim();
        const status = row[srcIdx[LOAN_HEADERS.STATUS]].toString().trim();
        return bookingType === LOAN_FILTER.BOOKING_TYPE && status !== LOAN_FILTER.EXCLUDE_STATUS;
    });

    console.log(`📋 篩選後符合條件的對保資料共 ${filteredRows.length} 筆`);

    // --- 5. 按戶號分組 ---
    const groupedByHousehold = {};

    filteredRows.forEach(row => {
        const householdId = row[srcIdx[LOAN_HEADERS.HOUSEHOLD_ID]].toString().trim();
        const bookingMethod = row[srcIdx[LOAN_HEADERS.BOOKING_METHOD]].toString().trim();
        const bankBranch = row[srcIdx[LOAN_HEADERS.BANK_BRANCH]].toString().trim();
        const agentName = row[srcIdx[LOAN_HEADERS.AGENT_NAME]].toString().trim();
        const agentPhoneRaw = row[srcIdx[LOAN_HEADERS.AGENT_PHONE]].toString().trim();
        const agentPhone = _normalizePhone(agentPhoneRaw);

        if (!householdId) return;

        if (!groupedByHousehold[householdId]) {
            groupedByHousehold[householdId] = { banks: [], contacts: [] };
        }

        // 銀行 ← 預約方式
        groupedByHousehold[householdId].banks.push(bookingMethod);

        // 銀行窗口
        if (bookingMethod === "自覓銀行") {
            const contactStr = `${bankBranch}|${agentName}|${agentPhone}`;
            groupedByHousehold[householdId].contacts.push(contactStr);
        } else {
            groupedByHousehold[householdId].contacts.push("(預約系統)");
        }
    });

    const householdIds = Object.keys(groupedByHousehold);
    console.log(`🏠 共有 ${householdIds.length} 個不重複戶號`);

    if (householdIds.length === 0) {
        console.log("無符合條件的對保資料需要寫入");
        return;
    }

    // --- 6. 讀取目標表並建立表頭索引 ---
    const targetData = targetSheet.getDataRange().getValues();
    if (targetData.length < 2) {
        console.log("目標工作表無資料（至少需要表頭行）");
        return;
    }

    const tgtIdx = {};
    targetData[0].forEach((h, i) => { tgtIdx[h.toString().trim()] = i; });

    // 驗證目標表必要欄位
    const requiredTargetHeaders = Object.values(LOAN_TARGET_HEADERS);
    const missingTargetHeaders = requiredTargetHeaders.filter(h => tgtIdx[h] === undefined);
    if (missingTargetHeaders.length > 0) {
        console.log(`❌ 目標表缺少必要欄位：${missingTargetHeaders.join(", ")}`);
        console.log(`💡 提示：請在「${SHEET_NAMES.RESULT}」表中新增以下欄位：${missingTargetHeaders.join(", ")}`);
        return;
    }

    const tgtHouseholdColIdx = tgtIdx[LOAN_TARGET_HEADERS.HOUSEHOLD_ID];
    const tgtBankColIdx = tgtIdx[LOAN_TARGET_HEADERS.TARGET_BANK];
    const tgtContactColIdx = tgtIdx[LOAN_TARGET_HEADERS.TARGET_CONTACT];

    // --- 7. 批量匹配並準備寫入資料 ---
    // 讀取現有欄位值，以逗號銜接對保資料（不覆蓋）
    const bankValues = [];
    const contactValues = [];
    let updatedCount = 0;

    for (let i = 1; i < targetData.length; i++) {
        const targetHouseholdId = targetData[i][tgtHouseholdColIdx].toString().trim();

        if (groupedByHousehold[targetHouseholdId]) {
            const data = groupedByHousehold[targetHouseholdId];
            const newBank = data.banks.join(",");
            const newContact = data.contacts.join(",");

            // 讀取現有欄位值
            const existingBank = (targetData[i][tgtBankColIdx] || "").toString().trim();
            const existingContact = (targetData[i][tgtContactColIdx] || "").toString().trim();

            // 合併：將現有值與對保資料以逗號銜接（去重避免重複寫入）
            const mergedBank = _mergeWithComma(existingBank, newBank);
            const mergedContact = _mergeWithComma(existingContact, newContact);

            bankValues.push([mergedBank]);
            contactValues.push([mergedContact]);
            updatedCount++;
        } else {
            // 無匹配資料時保留原值
            bankValues.push([targetData[i][tgtBankColIdx] || ""]);
            contactValues.push([targetData[i][tgtContactColIdx] || ""]);
        }
    }

    // 批量寫入（效能優化：一次寫入整欄，避免逐行 setValue 觸發大量 API 呼叫）
    if (bankValues.length > 0) {
        targetSheet.getRange(2, tgtBankColIdx + 1, bankValues.length, 1).setValues(bankValues);
        targetSheet.getRange(2, tgtContactColIdx + 1, contactValues.length, 1).setValues(contactValues);
    }

    // --- 8. 檢查未找到的戶號 ---
    const notFoundIds = [];
    householdIds.forEach(id => {
        const found = targetData.some((row, idx) => {
            if (idx === 0) return false;
            return row[tgtHouseholdColIdx].toString().trim() === id;
        });
        if (!found) notFoundIds.push(id);
    });

    // --- 9. 輸出結果 ---
    console.log(`✅ 對保同步完成！共更新 ${updatedCount} 筆戶別資料`);
    if (notFoundIds.length > 0) {
        console.log(`⚠️ 以下戶號在「${SHEET_NAMES.RESULT}」中找不到對應戶別：${notFoundIds.join(", ")}`);
    }
}


// ====================================================================
// 選單與觸發器
// ====================================================================

/**
 * 開啟試算表時建立選單
 * 將此函式設為 onOpen 觸發器，或整合到既有的 onOpen 函式中
 */
function onOpen() {
    SpreadsheetApp.getUi()
        .createMenu("🏠 ANXI 工具")
        .addItem("🔄 同步銀行資料 (自覓銀行/預約)", "processBankLinks")
        .addItem("🏦 同步對保資料到分戶表", "syncLoanDataToHousehold")
        .addSeparator()
        .addItem("🔍 診斷 Log 資料解析", "debugLogParsing")
        .addToUi();
}

/**
 * 診斷函式：檢查 SOURCE_LOG 資料的讀取與解析是否正常
 * 請在 GAS 中直接執行此函式，然後到「執行項目」查看輸出結果
 */
function debugLogParsing() {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const logSheet = ss.getSheetByName(SHEET_NAMES.SOURCE_LOG);
    const mainSheet = ss.getSheetByName(SHEET_NAMES.RESULT);

    if (!logSheet) {
        console.log(`❌ 找不到工作表「${SHEET_NAMES.SOURCE_LOG}」`);
        return;
    }

    // === 步驟 1：檢查表頭 ===
    console.log("========== 步驟 1：檢查 Log 表頭 ==========");
    const lCol = getHeaderMap(logSheet);
    const allHeaders = Object.keys(lCol);
    console.log(`Log 表共有 ${allHeaders.length} 個欄位`);
    console.log(`所有表頭：${allHeaders.join(" | ")}`);

    const unitIdCol = lCol[LOG_HEADERS.UNIT_ID];
    const msgCol = lCol[LOG_HEADERS.CUSTOMER_MESSAGES];
    console.log(`「${LOG_HEADERS.UNIT_ID}」欄位位置：${unitIdCol || "❌ 未找到！"}`);
    console.log(`「${LOG_HEADERS.CUSTOMER_MESSAGES}」欄位位置：${msgCol || "❌ 未找到！"}`);

    if (!unitIdCol || !msgCol) {
        console.log("❌ 表頭查詢失敗！請確認 Log 表第一列是否有 unitId 和 customerMessages 欄位");
        console.log("提示：以下是表頭中包含 'unit' 或 'message' 的欄位：");
        allHeaders.forEach(h => {
            if (h.toLowerCase().includes("unit") || h.toLowerCase().includes("message") || h.toLowerCase().includes("msg")) {
                console.log(`  → 「${h}」在第 ${lCol[h]} 欄`);
            }
        });
        return;
    }

    // === 步驟 2：檢查 Log 資料內容 ===
    console.log("\n========== 步驟 2：檢查 Log 資料 ==========");
    const logRaw = logSheet.getDataRange().getValues();
    console.log(`Log 表共有 ${logRaw.length} 列（含表頭）`);

    // 統計有 unitId 的資料筆數
    let hasIdCount = 0;
    let hasMsgCount = 0;
    let hasBankReturnCount = 0;

    for (let i = 1; i < logRaw.length; i++) {
        const unitId = logRaw[i][unitIdCol - 1];
        const msg = logRaw[i][msgCol - 1];

        if (unitId && unitId.toString().trim() !== "") hasIdCount++;
        if (msg && msg.toString().trim() !== "") hasMsgCount++;
        if (msg && msg.toString().includes("自覓銀行回傳")) hasBankReturnCount++;
    }

    console.log(`有 unitId 的資料：${hasIdCount} 筆`);
    console.log(`有 customerMessages 的資料：${hasMsgCount} 筆`);
    console.log(`包含「自覓銀行回傳」的資料：${hasBankReturnCount} 筆`);

    if (hasBankReturnCount === 0) {
        console.log("⚠️ 沒有任何 Log 包含「自覓銀行回傳」關鍵字！");
        // 顯示前 3 筆有內容的 Log 樣本
        let sampleCount = 0;
        for (let i = 1; i < logRaw.length && sampleCount < 3; i++) {
            const msg = logRaw[i][msgCol - 1];
            if (msg && msg.toString().trim() !== "") {
                console.log(`\n--- Log 樣本 (第 ${i + 1} 列) ---`);
                console.log(`unitId: ${logRaw[i][unitIdCol - 1]}`);
                console.log(`內容前200字: ${msg.toString().substring(0, 200)}`);
                sampleCount++;
            }
        }
        return;
    }

    // === 步驟 3：嘗試解析並匹配 ===
    console.log("\n========== 步驟 3：解析測試 ==========");

    // 取主表第一個有效戶別來測試匹配
    const mCol = getHeaderMap(mainSheet);
    const mData = mainSheet.getRange(1, 1, mainSheet.getLastRow(), mainSheet.getLastColumn()).getValues();

    let matchTestCount = 0;

    for (let i = 1; i < logRaw.length && matchTestCount < 5; i++) {
        const msg = logRaw[i][msgCol - 1];
        if (!msg || !msg.toString().includes("自覓銀行回傳")) continue;

        const unitId = logRaw[i][unitIdCol - 1].toString().trim();
        console.log(`\n--- 解析測試 (Log 第 ${i + 1} 列, unitId=${unitId}) ---`);

        const content = msg.toString();
        console.log(`原始內容前500字：\n${content.substring(0, 500)}`);

        // 測試時間戳記分割
        const blocks = content.split(/(\[\d{4}\/\d{2}\/\d{2} \d{2}:\d{2}(?::\d{2})?\])/);
        console.log(`時間戳記分割後共 ${blocks.length} 段`);

        for (let b = 1; b < blocks.length; b += 2) {
            const timeStamp = blocks[b];
            const blockContent = blocks[b + 1] || "";
            console.log(`  段落 ${Math.floor(b / 2) + 1}：時間=${timeStamp}, 包含自覓銀行回傳=${blockContent.includes("自覓銀行回傳")}`);

            if (blockContent.includes("自覓銀行回傳")) {
                const dataMatch = blockContent.match(/資料:\s*(.+)/);
                if (dataMatch) {
                    const parts = dataMatch[1].split("|").map(s => s.trim());
                    console.log(`    ✅ 解析成功！銀行=${parts[0]}, 姓名=${parts[1] || "無"}, 電話=${parts[2] || "無"}`);
                } else {
                    console.log(`    ❌ 「資料:」正則未匹配！blockContent 前200字：${blockContent.substring(0, 200)}`);
                }

                const urls = [...blockContent.matchAll(/https?:\/\/[^\s\n\r]+/g)].map(m => m[0]);
                console.log(`    附件 URL 數量：${urls.length}`);
            }
        }

        // 檢查主表是否有匹配的戶別
        const mainMatch = mData.find((row, idx) => idx > 0 && row[mCol[BANK_HEADERS.ID] - 1].toString() === unitId);
        console.log(`  主表匹配：${mainMatch ? "✅ 找到" : "❌ 未找到"}`);

        matchTestCount++;
    }

    console.log("\n========== 診斷完成 ==========");
}
