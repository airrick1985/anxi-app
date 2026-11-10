// Excel 上傳戶別：逐列正規化（uploadHouseholds 與排程更新的 Excel 排程共用，確保兩者寫入格式一致）
// 自 functions/index.js uploadHouseholds 抽出，邏輯未改動。

const { Timestamp } = require('firebase-admin/firestore');
const { normalizeSalespersons } = require('./salesperson');
const { applyDerivedPrices } = require('./priceDerive');

const numericFields = [
  'area_ancillary_ping', 'area_ancillary_sqm', 'area_terrace_ping', 'area_common_ping',
  'area_common_sqm', 'area_house_ping', 'area_house_sqm', 'area_main_ping',
  'area_main_sqm', 'land_share_ping', 'land_share_sqm', 'land_share_ratio', 'common_area_ratio',
  'payment_contract_amount', 'payment_deposit_amount', 'payment_supplement_amount',
  'price_diff', 'price_floor_ancillary', 'price_floor_terrace', 'price_floor_house_only',
  'price_floor_house_total', 'price_list_ancillary', 'price_list_terrace', 'price_list_terrace_unit',
  'price_list_house_only', 'price_list_house_total', 'price_package_deal', 'price_package',
  'price_transaction_house', 'price_transaction_total',
  'housePriceRatio', 'landPriceRatio'
];
const dateFields = ['payment_contract_date', 'payment_deposit_date', 'payment_supplement_date', 'payment_complete_date'];

/**
 * 將前端解析的 Excel 列（英文欄位 key）轉成要寫入 salesHouseholds 的資料。
 * @param {object} row 必須含 unitId
 * @param {object} ctx
 *   - projectId
 *   - salespersonNameToUserKey: Map<姓名, userKey>，銷售人員只填姓名時反查 userKey
 *   - existing: 該戶既有資料（價格衍生計算基底）
 *   - logPrefix: 警告訊息前綴
 * @returns {object} dataToSave
 */
function normalizeHouseholdUploadRow(row, ctx = {}) {
  const projectId = ctx.projectId;
  const salespersonNameToUserKey = ctx.salespersonNameToUserKey || new Map();
  const existing = ctx.existing || {};
  const functionName = ctx.logPrefix || 'normalizeHouseholdUploadRow';
  const unitId = row.unitId;

  const dataToSave = { ...row, projectId };

  // --- 資料型別轉換 ---
  for (const field of numericFields) {
    if (dataToSave[field] !== null && dataToSave[field] !== undefined) {
      const num = Number(dataToSave[field]);
      dataToSave[field] = isNaN(num) ? null : num;
    }
  }
  for (const field of dateFields) {
    if (dataToSave[field]) {
      const date = new Date(dataToSave[field]);
      if (!isNaN(date.getTime())) {
        dataToSave[field] = Timestamp.fromDate(date);
      } else {
        dataToSave[field] = null;
      }
    }
  }
  if (dataToSave.isFirstTimeBuyer !== undefined) {
    // 空白格存空值（前端一律預設「是」），不可當成「否」
    const val = String(dataToSave.isFirstTimeBuyer ?? '').trim().toUpperCase();
    dataToSave.isFirstTimeBuyer = val === '' ? null : (val === 'TRUE' || val === 'Y' || val === '是');
  }

  //  --- 新增：處理銷控圖片欄位 ---
  // ✅ [優化] 部分欄位上傳：payload「沒有」此欄位時不可寫入（merge: true 保留既有值），
  // 只在欄位存在時做格式正規化（字串 → 陣列；空值 → 清空為 []）
  if (Object.prototype.hasOwnProperty.call(dataToSave, 'salesImages')) {
    if (typeof dataToSave.salesImages === 'string' && dataToSave.salesImages.trim() !== '') {
      // 將逗號分隔的字串，轉換為一個經過 trim 處理且移除非空字串的陣列
      dataToSave.salesImages = dataToSave.salesImages
        .split(',')
        .map(name => name.trim())
        .filter(name => name);
    } else if (!Array.isArray(dataToSave.salesImages)) {
      // 欄位存在但為空（空儲存格）→ 清空為空陣列，維持資料格式一致性
      dataToSave.salesImages = [];
    }
  }
  //  --- 處理結束 ---

  // ✅ [新增] 可選方案（方案編輯器）：正規化為字串陣列（存方案 id）。
  // 注意：payload「沒有」此欄位時不可寫入（merge: true 會保留既有值），
  // 以支援舊格式 Excel（無「可選方案」欄）上傳不清空既有設定
  if (Object.prototype.hasOwnProperty.call(dataToSave, 'availablePlans')) {
    const rawPlans = dataToSave.availablePlans;
    if (Array.isArray(rawPlans)) {
      dataToSave.availablePlans = rawPlans.map(v => String(v || '').trim()).filter(Boolean);
    } else if (typeof rawPlans === 'string' && rawPlans.trim() !== '') {
      dataToSave.availablePlans = rawPlans.split(',').map(v => v.trim()).filter(Boolean);
    } else {
      dataToSave.availablePlans = [];
    }
  }

  // ✅ [新增] 合約分戶圖位置：Google Drive 資料夾或圖檔連結，正規化為 trim 後字串。
  // payload「沒有」此欄位時不寫入（merge: true 保留既有值）；空儲存格 → 清空為 null
  if (Object.prototype.hasOwnProperty.call(dataToSave, 'contractDrawingFolderUrl')) {
    const rawUrl = String(dataToSave.contractDrawingFolderUrl ?? '').trim();
    dataToSave.contractDrawingFolderUrl = rawUrl === '' ? null : rawUrl;
  }

  // 門牌（銷售端，與驗屋 households.address 無關）：trim 後字串；沒有此欄位不寫入、空儲存格 → null
  if (Object.prototype.hasOwnProperty.call(dataToSave, 'doorplate')) {
    const rawDoorplate = String(dataToSave.doorplate ?? '').trim();
    dataToSave.doorplate = rawDoorplate === '' ? null : rawDoorplate;
  }

  // ✓ START: 新增 - 處理銀行帳號和特定文字欄位
  // 正體中文註解：定義哪些欄位應被強制視為文字，以保留前導 0 或特殊格式。
  // (請確保您在 SalesControlSystem.vue 的 COLUMN_DEFINITIONS 中使用相同的英文 key)
  const stringFieldsToProcess = [
    'landBankName',           // 土地款匯款銀行
    'landBankAccount',        // 土地款匯款帳號
    'landBankAccountName',    // 土地款戶名
    'houseBankName',          // 房屋款匯款銀行
    'houseBankAccount',       // 房屋款匯款帳號
    'houseBankAccountName',   // 房屋款戶名
    'packageBankName',        // 配套款匯款銀行
    'packageBankAccount',     // 配套款匯款帳號
    'packageBankAccountName', // 配套款戶名
    'constructionMethod',     // 興建方式
    'propertyType'            // ✅ [新增] 物件類型 (住家/店面/其他)
    // 註：salesperson / salespersonUserKey 已改為「陣列（複選）」，
    //     於下方獨立處理，不可在此強制轉字串
  ];

  // 正體中文註解：定義「興建方式」的有效選項
  const validConstructionMethods = new Set([
    "自地自建", "合建分售", "合建分屋", "合建分成", null, undefined, ""
  ]);

  for (const field of stringFieldsToProcess) {
    // 檢查前端上傳的 row 物件中是否存在此欄位
    if (dataToSave.hasOwnProperty(field)) {
      const originalValue = dataToSave[field];

      // 統一轉換為字串並去除前後空白
      const stringValue = String(originalValue || '').trim();

      if (field === 'constructionMethod') {
        // 驗證「興建方式」
        if (!validConstructionMethods.has(stringValue)) {
          // 如果值無效 (例如 "其他")，將其設為 null 存入資料庫
          dataToSave[field] = null;
          console.warn(`[${functionName}] 警告：戶別 ${unitId} 的 'constructionMethod' 值 "${stringValue}" 無效，已設為 null。`);
        } else {
          // 如果是有效選項或空字串，則儲存
          dataToSave[field] = stringValue === "" ? null : stringValue;
        }
      } else {
        // 對於所有其他欄位（主要是銀行帳號），儲存為處理過的字串
        dataToSave[field] = stringValue;
      }
    }
  }

  // ✅ 銷售人員（複選）↔ userKey 一致性處理
  // salesperson / salespersonUserKey 皆儲存為「字串陣列」。相容舊單人字串與逗號分隔字串。
  // 規則：
  //  1) Excel 提供 salesperson 欄位且為空 → salesperson 與 salespersonUserKey 同步清為 []
  //  2) Excel 提供姓名 + 同時提供非空 salespersonUserKey → userKey 採用使用者輸入（trust input）
  //  3) Excel 提供姓名、salespersonUserKey 留白或欄位不存在 → 逐一依姓名反查補上對應 userKey
  //  4) Excel 完全沒有 salesperson 欄位 → 不動現有資料 (依 merge: true)
  if (Object.prototype.hasOwnProperty.call(dataToSave, 'salesperson')) {
    const names = normalizeSalespersons(dataToSave.salesperson);
    if (names.length === 0) {
      dataToSave.salesperson = [];
      dataToSave.salespersonUserKey = [];
    } else {
      dataToSave.salesperson = names;
      const providedKeys = normalizeSalespersons(dataToSave.salespersonUserKey);
      if (providedKeys.length > 0) {
        // 使用者有提供 userKey → 直接採用（trust input）
        dataToSave.salespersonUserKey = providedKeys;
      } else {
        // 依各姓名反查 phone，過濾查不到的
        dataToSave.salespersonUserKey = names
          .map(n => (salespersonNameToUserKey.has(n) ? salespersonNameToUserKey.get(n) : null))
          .filter(Boolean);
      }
    }
  } else if (Object.prototype.hasOwnProperty.call(dataToSave, 'salespersonUserKey')) {
    // 邊界：只有 userKey 欄位、沒有姓名欄位 → 正規化為陣列，避免污染既有資料
    dataToSave.salespersonUserKey = normalizeSalespersons(dataToSave.salespersonUserKey);
  }

  // salesStatus_backend 與 status 必須連動
  // Why: 前端/報表/同步邏輯同時參考這兩個欄位，必須保持一致
  const batchHasBackend = Object.prototype.hasOwnProperty.call(dataToSave, 'salesStatus_backend');
  const batchHasStatus = Object.prototype.hasOwnProperty.call(dataToSave, 'status');
  if (batchHasBackend) {
    dataToSave.status = dataToSave.salesStatus_backend;
  } else if (batchHasStatus) {
    dataToSave.salesStatus_backend = dataToSave.status;
  }

  // 💰 房屋總表價／總底價一律由明細（房屋＋露臺）衍生，不採用檔案內的總額欄位。
  //    例外：檔案只給了總額、沒給明細 → 反推明細（房屋＝總額−露臺），維持「拿舊範本改總價上傳」可用。
  applyDerivedPrices(
    dataToSave,
    existing || {},
    { backfillFromTotal: true }
  );

  return dataToSave;
}

module.exports = { HOUSEHOLD_NUMERIC_FIELDS: numericFields, HOUSEHOLD_DATE_FIELDS: dateFields, normalizeHouseholdUploadRow };
