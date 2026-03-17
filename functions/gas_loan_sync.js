/**
 * Google Apps Script - 對保資料同步腳本
 * 
 * 目的：從「ANXI預約資料」sheet 讀取預約項目為「對保」的資料，
 *       寫入到「森之樹分戶」sheet 的「銀行」及「銀行窗口」欄位。
 * 
 * 規則：
 *   1. 篩選條件：預約項目 = "對保" 且 狀態 ≠ "取消"
 *   2. Key 對應：ANXI預約資料.戶號 = 森之樹分戶.戶別
 *   3. 寫入「銀行」欄 ← ANXI預約資料.預約方式
 *   4. 寫入「銀行窗口」欄：
 *      - 若 預約方式 ≠ "自覓銀行" → 寫入 "(預約系統)"
 *      - 若 預約方式 = "自覓銀行" → 寫入 "承辦人姓名|承辦人電話"
 *   5. 同一戶號多筆資料時，以 "," 區隔寫入同一欄
 */

// --- 設定區域 ---
const LOAN_SOURCE_SHEET_NAME = "ANXI預約資料";
const LOAN_TARGET_SHEET_NAME = "森之樹分戶";

// 來源表頭名稱
const LOAN_SOURCE_HEADERS = {
    bookingType: "預約項目",
    status: "狀態",
    householdId: "戶號",
    bookingMethod: "預約方式",
    bankBranch: "銀行及分行",
    agentName: "承辦人姓名",
    agentPhone: "承辦人電話",
};

// 目標表頭名稱
const LOAN_TARGET_HEADERS = {
    householdId: "戶別",
    bank: "銀行",
    bankContact: "銀行窗口",
};

// 篩選條件
const LOAN_FILTER_BOOKING_TYPE = "對保";
const LOAN_FILTER_EXCLUDE_STATUS = "取消";

// --- 主函式 ---
function syncLoanDataToHousehold() {
    const ss = SpreadsheetApp.getActiveSpreadsheet();

    // --- 1. 取得來源表 ---
    const sourceSheet = ss.getSheetByName(LOAN_SOURCE_SHEET_NAME);
    if (!sourceSheet) {
        console.log(`❌ 找不到來源工作表「${LOAN_SOURCE_SHEET_NAME}」`);
        return;
    }

    // --- 2. 取得目標表 ---
    const targetSheet = ss.getSheetByName(LOAN_TARGET_SHEET_NAME);
    if (!targetSheet) {
        console.log(`❌ 找不到目標工作表「${LOAN_TARGET_SHEET_NAME}」`);
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
    const requiredSourceHeaders = Object.values(LOAN_SOURCE_HEADERS);
    const missingHeaders = requiredSourceHeaders.filter(h => srcIdx[h] === undefined);
    if (missingHeaders.length > 0) {
        console.log(`❌ 來源表缺少必要欄位：${missingHeaders.join(", ")}`);
        return;
    }

    // --- 4. 篩選資料：預約項目 = "對保" 且 狀態 ≠ "取消" ---
    const filteredRows = sourceRows.filter(row => {
        const bookingType = row[srcIdx[LOAN_SOURCE_HEADERS.bookingType]].toString().trim();
        const status = row[srcIdx[LOAN_SOURCE_HEADERS.status]].toString().trim();
        return bookingType === LOAN_FILTER_BOOKING_TYPE && status !== LOAN_FILTER_EXCLUDE_STATUS;
    });

    console.log(`📋 篩選後符合條件的資料共 ${filteredRows.length} 筆`);

    // --- 5. 按戶號分組，處理同戶號多筆資料 ---
    // 結構：{ "戶號": { banks: [], contacts: [] } }
    const groupedByHousehold = {};

    filteredRows.forEach(row => {
        const householdId = row[srcIdx[LOAN_SOURCE_HEADERS.householdId]].toString().trim();
        const bookingMethod = row[srcIdx[LOAN_SOURCE_HEADERS.bookingMethod]].toString().trim();
        const bankBranch = row[srcIdx[LOAN_SOURCE_HEADERS.bankBranch]].toString().trim();
        const agentName = row[srcIdx[LOAN_SOURCE_HEADERS.agentName]].toString().trim();
        const agentPhoneRaw = row[srcIdx[LOAN_SOURCE_HEADERS.agentPhone]].toString().trim();
        const agentPhone = _normalizePhone(agentPhoneRaw);

        if (!householdId) return; // 忽略無戶號的資料

        if (!groupedByHousehold[householdId]) {
            groupedByHousehold[householdId] = { banks: [], contacts: [] };
        }

        // 銀行 ← 預約方式
        groupedByHousehold[householdId].banks.push(bookingMethod);

        // 銀行窗口
        if (bookingMethod === "自覓銀行") {
            // 自覓銀行：寫入 "銀行及分行|承辦人姓名|承辦人電話"
            const contactStr = `${bankBranch}|${agentName}|${agentPhone}`;
            groupedByHousehold[householdId].contacts.push(contactStr);
        } else {
            // 非自覓銀行：寫入 "(預約系統)"
            groupedByHousehold[householdId].contacts.push("(預約系統)");
        }
    });

    const householdIds = Object.keys(groupedByHousehold);
    console.log(`🏠 共有 ${householdIds.length} 個不重複戶號`);

    if (householdIds.length === 0) {
        console.log("無符合條件的資料需要寫入");
        return;
    }

    // --- 6. 讀取目標表資料 ---
    const targetData = targetSheet.getDataRange().getValues();
    if (targetData.length < 2) {
        console.log("目標工作表無資料（至少需要表頭行）");
        return;
    }

    const targetHeaders = targetData[0].map(h => h.toString().trim());

    // 建立目標表頭索引
    const tgtIdx = {};
    targetHeaders.forEach((h, i) => { tgtIdx[h] = i; });

    // 驗證目標表必要欄位
    const requiredTargetHeaders = Object.values(LOAN_TARGET_HEADERS);
    const missingTargetHeaders = requiredTargetHeaders.filter(h => tgtIdx[h] === undefined);
    if (missingTargetHeaders.length > 0) {
        console.log(`❌ 目標表缺少必要欄位：${missingTargetHeaders.join(", ")}`);
        return;
    }

    const tgtHouseholdColIdx = tgtIdx[LOAN_TARGET_HEADERS.householdId]; // 戶別欄索引
    const tgtBankColIdx = tgtIdx[LOAN_TARGET_HEADERS.bank];            // 銀行欄索引
    const tgtContactColIdx = tgtIdx[LOAN_TARGET_HEADERS.bankContact];  // 銀行窗口欄索引

    // --- 7. 匹配並寫入資料 ---
    let updatedCount = 0;
    let notFoundIds = [];

    for (let i = 1; i < targetData.length; i++) {
        const targetHouseholdId = targetData[i][tgtHouseholdColIdx].toString().trim();

        if (groupedByHousehold[targetHouseholdId]) {
            const data = groupedByHousehold[targetHouseholdId];

            // 多筆以 "," 區隔
            const bankValue = data.banks.join(",");
            const contactValue = data.contacts.join(",");

            // 寫入「銀行」欄（i+1 因為 Sheet 是 1-based）
            targetSheet.getRange(i + 1, tgtBankColIdx + 1).setValue(bankValue);

            // 寫入「銀行窗口」欄
            targetSheet.getRange(i + 1, tgtContactColIdx + 1).setValue(contactValue);

            updatedCount++;
        }
    }

    // 檢查是否有未找到的戶號
    householdIds.forEach(id => {
        const found = targetData.some((row, idx) => {
            if (idx === 0) return false; // 跳過表頭
            return row[tgtHouseholdColIdx].toString().trim() === id;
        });
        if (!found) notFoundIds.push(id);
    });

    // --- 8. 輸出結果 ---
    console.log(`✅ 同步完成！共更新 ${updatedCount} 筆戶別資料`);
    if (notFoundIds.length > 0) {
        console.log(`⚠️ 以下戶號在「${LOAN_TARGET_SHEET_NAME}」中找不到對應戶別：${notFoundIds.join(", ")}`);
    }
}

// --- 輔助函式 ---

/**
 * 正規化電話號碼
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

// --- 選單註冊（可加到現有的 onOpen 中） ---
function onOpenLoanSync() {
    SpreadsheetApp.getUi()
        .createMenu("🏠 ANXI 工具")
        .addItem("🏦 同步對保資料到分戶表", "syncLoanDataToHousehold")
        .addToUi();
}
