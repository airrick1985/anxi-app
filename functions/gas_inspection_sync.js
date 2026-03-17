/**
 * Google Apps Script - 初驗資料同步腳本
 * 
 * 目的：從「ANXI預約資料」sheet 讀取預約項目為「初驗」的資料，
 *       寫入到「森之樹分戶」sheet 的「初驗」及「驗屋公司」欄位。
 * 
 * 規則：
 *   1. 篩選條件：預約項目 = "初驗" 且 狀態 ≠ "取消"
 *   2. Key 對應：ANXI預約資料.戶號 = 森之樹分戶.戶別
 *   3. 寫入「初驗」欄 ← ANXI預約資料.預約日期（格式 yyyy/mm/dd）
 *   4. 寫入「驗屋公司」欄 ← ANXI預約資料.驗屋公司名稱
 *   5. 同一戶號若有多筆資料，以「建立時間」最晚的為唯一寫入資料
 */

// --- 設定區域 ---
const INSP_SOURCE_SHEET_NAME = "ANXI預約資料";
const INSP_TARGET_SHEET_NAME = "森之樹分戶";

// 來源表頭名稱
const INSP_SOURCE_HEADERS = {
    bookingType: "預約項目",
    status: "狀態",
    householdId: "戶號",
    bookingDate: "預約日期",
    companyName: "驗屋公司名稱",
    createdTime: "建立時間",
};

// 目標表頭名稱
const INSP_TARGET_HEADERS = {
    householdId: "戶別",
    inspectionDate: "初驗",
    inspectionCompany: "驗屋公司",
};

// 篩選條件
const INSP_FILTER_BOOKING_TYPE = "初驗";
const INSP_FILTER_EXCLUDE_STATUS = "取消";

// --- 主函式 ---
function syncInspectionDataToHousehold() {
    const ss = SpreadsheetApp.getActiveSpreadsheet();

    // --- 1. 取得來源表 ---
    const sourceSheet = ss.getSheetByName(INSP_SOURCE_SHEET_NAME);
    if (!sourceSheet) {
        console.log(`❌ 找不到來源工作表「${INSP_SOURCE_SHEET_NAME}」`);
        return;
    }

    // --- 2. 取得目標表 ---
    const targetSheet = ss.getSheetByName(INSP_TARGET_SHEET_NAME);
    if (!targetSheet) {
        console.log(`❌ 找不到目標工作表「${INSP_TARGET_SHEET_NAME}」`);
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
    const requiredSourceHeaders = Object.values(INSP_SOURCE_HEADERS);
    const missingHeaders = requiredSourceHeaders.filter(h => srcIdx[h] === undefined);
    if (missingHeaders.length > 0) {
        console.log(`❌ 來源表缺少必要欄位：${missingHeaders.join(", ")}`);
        return;
    }

    // --- 4. 篩選資料：預約項目 = "初驗" 且 狀態 ≠ "取消" ---
    const filteredRows = sourceRows.filter(row => {
        const bookingType = row[srcIdx[INSP_SOURCE_HEADERS.bookingType]].toString().trim();
        const status = row[srcIdx[INSP_SOURCE_HEADERS.status]].toString().trim();
        return bookingType === INSP_FILTER_BOOKING_TYPE && status !== INSP_FILTER_EXCLUDE_STATUS;
    });

    console.log(`📋 篩選後符合條件的資料共 ${filteredRows.length} 筆`);

    // --- 5. 按戶號分組，保留建立時間最晚的那筆 ---
    // 結構：{ "戶號": { bookingDate, companyName, createdTime } }
    const latestByHousehold = {};

    filteredRows.forEach(row => {
        const householdId = row[srcIdx[INSP_SOURCE_HEADERS.householdId]].toString().trim();
        if (!householdId) return; // 忽略無戶號的資料

        const bookingDateRaw = row[srcIdx[INSP_SOURCE_HEADERS.bookingDate]];
        const companyName = row[srcIdx[INSP_SOURCE_HEADERS.companyName]].toString().trim();
        const createdTimeRaw = row[srcIdx[INSP_SOURCE_HEADERS.createdTime]];

        // 解析建立時間
        const createdTime = _parseDate(createdTimeRaw);

        // 解析預約日期並格式化為 yyyy/mm/dd
        const bookingDate = _formatDateToYMD(bookingDateRaw);

        // 若此戶號尚未記錄，或本筆建立時間比已記錄的更晚，則替換
        if (!latestByHousehold[householdId] ||
            (createdTime && latestByHousehold[householdId].createdTime &&
                createdTime > latestByHousehold[householdId].createdTime) ||
            (createdTime && !latestByHousehold[householdId].createdTime)) {
            latestByHousehold[householdId] = {
                bookingDate: bookingDate,
                companyName: companyName,
                createdTime: createdTime,
            };
        }
    });

    const householdIds = Object.keys(latestByHousehold);
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
    const requiredTargetHeaders = Object.values(INSP_TARGET_HEADERS);
    const missingTargetHeaders = requiredTargetHeaders.filter(h => tgtIdx[h] === undefined);
    if (missingTargetHeaders.length > 0) {
        console.log(`❌ 目標表缺少必要欄位：${missingTargetHeaders.join(", ")}`);
        return;
    }

    const tgtHouseholdColIdx = tgtIdx[INSP_TARGET_HEADERS.householdId];       // 戶別欄索引
    const tgtInspDateColIdx = tgtIdx[INSP_TARGET_HEADERS.inspectionDate];     // 初驗欄索引
    const tgtCompanyColIdx = tgtIdx[INSP_TARGET_HEADERS.inspectionCompany];   // 驗屋公司欄索引

    // --- 7. 匹配並寫入資料 ---
    let updatedCount = 0;
    let notFoundIds = [];

    for (let i = 1; i < targetData.length; i++) {
        const targetHouseholdId = targetData[i][tgtHouseholdColIdx].toString().trim();

        if (latestByHousehold[targetHouseholdId]) {
            const data = latestByHousehold[targetHouseholdId];

            // 寫入「初驗」欄（i+1 因為 Sheet 是 1-based）
            targetSheet.getRange(i + 1, tgtInspDateColIdx + 1).setValue(data.bookingDate);

            // 寫入「驗屋公司」欄
            targetSheet.getRange(i + 1, tgtCompanyColIdx + 1).setValue(data.companyName);

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
        console.log(`⚠️ 以下戶號在「${INSP_TARGET_SHEET_NAME}」中找不到對應戶別：${notFoundIds.join(", ")}`);
    }
}

// --- 輔助函式 ---

/**
 * 解析日期值，支援 Date 物件和字串格式
 * @param {*} val - 日期值
 * @returns {Date|null}
 */
function _parseDate(val) {
    if (!val) return null;
    if (val instanceof Date) return val;
    const parsed = new Date(val);
    return isNaN(parsed) ? null : parsed;
}

/**
 * 將日期格式化為 yyyy/mm/dd
 * @param {*} val - 日期值
 * @returns {string}
 */
function _formatDateToYMD(val) {
    if (!val) return "";
    let date;
    if (val instanceof Date) {
        date = val;
    } else {
        date = new Date(val);
        if (isNaN(date)) return val.toString();
    }
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${y}/${m}/${d}`;
}

// --- 選單註冊（可加到現有的 onOpen 中） ---
function onOpenInspectionSync() {
    SpreadsheetApp.getUi()
        .createMenu("🏠 ANXI 工具")
        .addItem("🔍 同步初驗資料到分戶表", "syncInspectionDataToHousehold")
        .addToUi();
}
