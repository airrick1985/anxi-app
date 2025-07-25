// /workspaces/anxi-app/src/api.js
export const IMAGE_PROXY_BASE_URL = 'https://vercel-proxy-api2.vercel.app';
const BASE_API_URL = `${IMAGE_PROXY_BASE_URL}/api`; 
const INSPECTION_API = `${BASE_API_URL}/inspection`;
const DROPDOWN_API = `${BASE_API_URL}/dropdown`;
const USER_API = `${BASE_API_URL}/user`;
const METADATA_API = `${BASE_API_URL}/metadata`;
const UPLOAD_API = `${BASE_API_URL}/upload`;
const SALES_API = `${BASE_API_URL}/sales`;
const MESSAGE_API = `${BASE_API_URL}/message`; 
const USER_MANAGEMENT_API = `${BASE_API_URL}/userManagement`;
const SUBSCRIPTION_API = `${BASE_API_URL}/subscriptionManagement`; 


/**
 * 獲取指定建案的所有車位資料
 * @param {string} projectName 建案名稱
 * @returns {Promise<object>} API 響應
 */
export async function fetchParkingList(projectName) {
  console.log(`[api.js] fetchParkingList called with projectName: ${projectName}`);
  if (!projectName) {
    return Promise.resolve({ status: 'error', message: '前端錯誤：呼叫 fetchParkingList 時缺少 projectName。' });
  }
  return fetchPost({
    action: 'get_parking_list',
    projectName,
    token: 'anxi111003'
  }, SALES_API); // 假設這個 action 也屬於 SALES_API 端點
}

/**
 * 獲取報價人員列表和當前用戶的編輯權限
 * @param {string} projectName 建案名稱
 * @param {string} userKey 當前登入用戶的手機號碼 (⬅️ 函數參數名也改得更清晰)
 * @returns {Promise<object>} API 響應
 */
export async function fetchQuotePersonnelList(projectName, userKey) {
  console.log(`[api.js] fetchQuotePersonnelList called for project: ${projectName}`);
  if (!projectName || !userKey) {
    return Promise.resolve({ status: 'error', message: '前端錯誤：呼叫 fetchQuotePersonnelList 時缺少參數。' });
  }
  return fetchPost({
    action: 'get_quote_personnel_list',
    projectName,
    key: userKey, // ✅ 關鍵修改：將 currentUserKey 改為 key
    token: 'anxi111003'
  }, USER_API);
}

export async function getProjectList(userKey) { 
  console.log('[api.js] getProjectList called with :', userKey); 

  if (!userKey) {
    console.error("[api.js] getProjectList: userKey is missing!");
    // 返回一個與 fetchPost 失敗時結構類似的 Promise，方便呼叫端統一處理
    return Promise.resolve({ status: 'error', message: '前端錯誤：呼叫 getProjectList 時缺少 userKey。' });
  }
  // 將 userKey 包含在傳遞給 fetchPost 的 body 中
  return fetchPost({ action: 'get_project_list', key: userKey }, USER_API);
  
}



// 🔐 使用者登入
export async function loginUser(key, password, projectName) {
  console.log(`[api.js] loginUser called with key: ${key}, projectName: ${projectName}`);
  try {
    const res = await fetch(USER_API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'login', key, password, projectName })
    });
    return await res.json();
  } catch (e) {
    console.error('loginUser 錯誤:', e);
    return { status: 'error', message: e.message };
  }
}


// 🔧 修改使用者個人資料 (通常與用戶身份綁定，不直接依賴單個建案的 ssId)
export async function updateUserProfile(payload) {
  console.log('[api.js] updateUserProfile called with payload:', payload);
  try {
    const res = await fetch(USER_API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'update_profile',
        ...payload,
        oldPassword: payload.oldPassword ? String(payload.oldPassword) : '',
        newPassword: payload.newPassword ? String(payload.newPassword) : ''
      })
    });
    return await res.json();
  } catch (e) {
    console.error('updateUserProfile 錯誤:', e);
    return { status: 'error', message: e.message };
  }
}


// 🔑 忘記密碼 (通常與用戶身份綁定)
export async function forgotPasswordUser(key) {
  console.log(`[api.js] forgotPasswordUser called with key: ${key}`);
  try {
    const res = await fetch(USER_API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'forgot_password', key })
    });
    return await res.json();
  } catch (e) {
    console.error('forgotPasswordUser 錯誤:', e);
    return { status: 'error', message: e.message };
  }
}

// 📋 查詢所有戶別清單
export async function fetchUnitList(projectName) {
  console.log(`[api.js] fetchUnitList called with projectName: ${projectName}`);
  if (!projectName) {
    console.error("[api.js] fetchUnitList: projectName is missing!");
    return { status: 'error', message: '前端錯誤：呼叫 fetchUnitList 時缺少 projectName。' };
  }
  return fetchPost({ action: 'get_unit_list', projectName }, METADATA_API);
}

// 📋 查詢所有棟別
export async function getBuildingList(projectName) {
  console.log(`[api.js] getBuildingList called with projectName: ${projectName}`);
  if (!projectName) {
    console.error("[api.js] getBuildingList: projectName is missing!");
    return { status: 'error', message: '前端錯誤：呼叫 getBuildingList 時缺少 projectName。' };
  }
  // 注意：原始 get_building_list 在 GAS 中也接收 payload 和 ssId，
  // 但前端 api.js 只傳 projectName，代理層 metadata.js 會轉發 projectName。
  // GAS doPost 會用 projectName 獲取 ssId。
  // 如果 get_building_list 的 token 是固定的，可以這樣傳。
  return fetchPost({ action: 'get_building_list', projectName, token: 'anxi111003' }, METADATA_API);
}

// 📋 查詢單一戶別詳細資料
export async function fetchHouseDetail(unitId, projectName, token = 'anxi111003') {
  console.log(`[api.js] fetchHouseDetail called with unitId: ${unitId}, projectName: ${projectName}, token: ${token}`);
  if (!projectName) {
    console.error("[api.js] fetchHouseDetail: projectName is missing!");
    return { status: 'error', message: '前端錯誤：呼叫 fetchHouseDetail 時缺少 projectName。' };
  }
  return fetchPost({ action: 'get_house_detail', unitId, projectName, token }, METADATA_API);
}

// 📋 查詢所有戶別資料（初始載入）
export async function fetchAllHouseDetails(projectName) {
  console.log(`[api.js] fetchAllHouseDetails called with projectName: ${projectName}`);
  if (!projectName) {
    console.error("[api.js] fetchAllHouseDetails: projectName is missing!");
    return { status: 'error', message: '前端錯誤：呼叫 fetchAllHouseDetails 時缺少 projectName。' };
  }
  return fetchPost({ action: 'get_all_house_details', projectName, token: 'anxi111003' }, METADATA_API);
}


// 🧾 查詢驗屋紀錄
export async function fetchInspectionRecords(unitId, projectName) {
  console.log(`[api.js] fetchInspectionRecords called with unitId: ${unitId}, projectName: ${projectName}`);
  if (!projectName) {
    console.error("[api.js] fetchInspectionRecords: projectName is missing!");
    return { status: 'error', message: '前端錯誤：呼叫 fetchInspectionRecords 時缺少 projectName。' };
  }
  return fetchPost({
    action: 'get_inspection_records',
    unitId,
    projectName,
    token: 'anxi111003' // GAS 端 handleGetInspectionRecords 似乎不檢查 token，但代理層 inspection.js 會
  }, INSPECTION_API);
}


// 🧾 新增驗屋紀錄
export async function addInspectionRecord(payload, projectName) {
  console.log(`[api.js] addInspectionRecord called with projectName: ${projectName}, payload:`, payload);
  if (!projectName) {
    console.error("[api.js] addInspectionRecord: projectName is missing!");
    return { status: 'error', message: '前端錯誤：呼叫 addInspectionRecord 時缺少 projectName。' };
  }
  return fetchPost({
    action: 'add_inspection_record',
    token: 'anxi111003',
    projectName,
    ...payload
  }, INSPECTION_API);
}

// 🧾 更新檢修欄位
export async function updateInspectionRecord({ key, repairDate, repairStatus, repairDescription }, projectName) {
  console.log(`[api.js] updateInspectionRecord called with key: ${key}, projectName: ${projectName}`);
  if (!projectName) {
    console.error("[api.js] updateInspectionRecord: projectName is missing!");
    return { status: 'error', message: '前端錯誤：呼叫 updateInspectionRecord 時缺少 projectName。' };
  }
  return fetchPost({
    action: 'update_inspection_record',
    key,
    repairDate,
    repairStatus,
    repairDescription,
    projectName,
    token: 'anxi111003'
  }, INSPECTION_API);
}


// 🧾 修改驗屋紀錄（舊版，可能未使用，新版是 fetchInspectionUpdateWithPhotos）
export async function fetchInspectionUpdate(payload, projectName) {
  console.log(`[api.js] fetchInspectionUpdate called with projectName: ${projectName}, payload:`, payload);
  if (!projectName) {
    console.error("[api.js] fetchInspectionUpdate: projectName is missing!");
    return { status: 'error', message: '前端錯誤：呼叫 fetchInspectionUpdate 時缺少 projectName。' };
  }
  return fetchPost({
    action: 'edit_inspection_record',
    token: 'anxi111003',
    projectName,
    ...payload
  }, INSPECTION_API);
}


// 📦 選單參數（area/category/status/level）
export async function fetchDropdownOptions(projectName) {
  console.log(`[api.js] fetchDropdownOptions called with projectName: ${projectName}`);
  if (!projectName) {
    console.error("[api.js] fetchDropdownOptions: projectName is missing!");
    return { status: 'error', message: '前端錯誤：呼叫 fetchDropdownOptions 時缺少 projectName。' };
  }
  return fetchPost({ action: 'get_dropdown_options', projectName, token: 'anxi111003' }, DROPDOWN_API);
}


// 📦 所有分類對應細項一次載入
export async function fetchAllSubcategories(projectName) {
  console.log(`[api.js] fetchAllSubcategories called with projectName: ${projectName}`);
  if (!projectName) {
    console.error("[api.js] fetchAllSubcategories: projectName is missing!");
    return { status: 'error', message: '前端錯誤：呼叫 fetchAllSubcategories 時缺少 projectName。' };
  }
  return fetchPost({ action: 'get_all_subcategories', projectName, token: 'anxi111003' }, DROPDOWN_API);
}


// 📦 檢修狀態選項
export async function getRepairStatusOptions(projectName) {
  console.log(`[api.js] getRepairStatusOptions called with projectName: ${projectName}`);
  if (!projectName) {
    console.error("[api.js] getRepairStatusOptions: projectName is missing!");
    return { status: 'error', message: '前端錯誤：呼叫 getRepairStatusOptions 時缺少 projectName。' };
  }
  const res = await fetchPost({ action: 'get_repair_status_options', projectName, token: 'anxi111003' }, DROPDOWN_API);
  return res.status === 'success' ? res.options : [];
}

// 🖼️ 上傳圖片 (假設不需要 projectName，如果需要，請添加)
export async function uploadPhotoToDrive(filename, base64) {
  console.log(`[api.js] uploadPhotoToDrive called with filename: ${filename}`);
  return fetchPost({ action: 'upload_photo', filename, base64, token: 'anxi111003' }, UPLOAD_API); // GAS doPost 的 upload_photo case 沒有接收 ssId
}

// 🌐 通用 POST 發送函數
async function fetchPost(body, url) {
  console.log(`[api.js] fetchPost to ${url} with body:`, JSON.stringify(body).substring(0, 500) + (JSON.stringify(body).length > 500 ? '...' : ''));
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    if (!res.ok) { // 檢查 HTTP 狀態碼
        const errorText = await res.text();
        console.error(`${body.action || 'unknown'} API HTTP error ${res.status}:`, errorText);
        try {
            // 嘗試解析為 JSON，如果代理層返回 JSON 錯誤
            const errorJson = JSON.parse(errorText);
            return { status: 'error', message: errorJson.message || `HTTP error ${res.status}`, raw: errorText };
        } catch (e) {
            return { status: 'error', message: `HTTP error ${res.status}`, raw: errorText };
        }
    }
    return await res.json();
  } catch (e) {
    console.error(`${body.action || 'unknown'} API fetch catch error:`, e);
    return { status: 'error', message: e.message || '網路請求失敗' };
  }
}

// 🚀 取得 GitHub 最新版本資訊（PWA 更新用）
export async function getLatestRelease() {
  console.log('[api.js] getLatestRelease called');
  try {
    const response = await fetch(
      'https://api.github.com/repos/airrick1985/anxi-app/releases/latest',
      { headers: { Accept: 'application/vnd.github.v3+json' } }
    );
    if (!response.ok) throw new Error(`GitHub API ${response.status}`);
    const json = await response.json();
    return {
      version: json.tag_name || '',
      notes: json.body || ''
    };
  } catch (e) {
    console.error('getLatestRelease error:', e);
    return { version: '', notes: '', error: e.message };
  }
}

// 🗑️ 刪除驗屋紀錄（軟刪除）
export async function deleteInspectionRecord(key, projectName) {
  console.log(`[api.js] deleteInspectionRecord called with key: ${key}, projectName: ${projectName}`);
  if (!projectName) {
    console.error("[api.js] deleteInspectionRecord: projectName is missing!");
    return { status: 'error', message: '前端錯誤：呼叫 deleteInspectionRecord 時缺少 projectName。' };
  }
  return fetchPost({
    action: 'delete_inspection_record',
    key,
    projectName,
    token: 'anxi111003'
  }, INSPECTION_API);
}

// 🗑️ 取得已刪除的驗屋紀錄
export async function fetchDeletedInspectionRecords(projectName) {
  console.log(`[api.js] fetchDeletedInspectionRecords called with projectName: ${projectName}`);
  if (!projectName) {
    console.error("[api.js] fetchDeletedInspectionRecords: projectName is missing!");
    return { status: 'error', message: '前端錯誤：呼叫 fetchDeletedInspectionRecords 時缺少 projectName。' };
  }
  return fetchPost({ action: 'get_deleted_inspection_records', projectName, token: 'anxi111003' }, INSPECTION_API);
}

// ♻️ 復原刪除的驗屋紀錄
export async function restoreInspectionRecord(key, projectName) {
  console.log(`[api.js] restoreInspectionRecord called with key: ${key}, projectName: ${projectName}`);
  if (!projectName) {
    console.error("[api.js] restoreInspectionRecord: projectName is missing!");
    return { status: 'error', message: '前端錯誤：呼叫 restoreInspectionRecord 時缺少 projectName。' };
  }
  return fetchPost({ action: 'restore_inspection_record', key, projectName, token: 'anxi111003' }, INSPECTION_API);
}

// 🖼️ 刪除單張照片 (包含 Drive 刪除)
export async function deletePhotoFromRecord(key, photoField, projectName) {
  console.log(`[api.js] deletePhotoFromRecord called with key: ${key}, photoField: ${photoField}, projectName: ${projectName}`);
  if (!projectName) {
    console.error("[api.js] deletePhotoFromRecord: projectName is missing!");
    return { status: 'error', message: '前端錯誤：呼叫 deletePhotoFromRecord 時缺少 projectName。' };
  }
  return fetchPost({
    action: 'delete_photo_from_record',
    key,
    photoField,
    projectName,
    token: 'anxi111003'
  }, INSPECTION_API);
}

// ✅ 產出分享網址
export async function generateShareUrl(unitId, projectName) {
  console.log(`[api.js] generateShareUrl called with unitId: ${unitId}, projectName: ${projectName}`);
  if (!projectName) {
    console.error("[api.js] generateShareUrl: projectName is missing!");
    return { status: 'error', message: '前端錯誤：呼叫 generateShareUrl 時缺少 projectName。' };
  }
  return fetchPost({
    action: 'generate_share_url',
    unitId,
    projectName,
    token: 'anxi111003'
  }, INSPECTION_API);
}

// 🧾 修改驗屋紀錄（包含照片處理邏輯）
export async function fetchInspectionUpdateWithPhotos(payload, projectName) {
  console.log(`[api.js] fetchInspectionUpdateWithPhotos called with projectName: ${projectName}, payload:`, payload);
  if (!projectName) {
    console.error("[api.js] fetchInspectionUpdateWithPhotos: projectName is missing!");
    return { status: 'error', message: '前端錯誤：呼叫 fetchInspectionUpdateWithPhotos 時缺少 projectName。' };
  }
  return fetchPost({
    action: 'edit_inspection_record_with_photos',
    token: 'anxi111003',
    projectName,
    ...payload
  }, INSPECTION_API);
}

// ✅ 上傳簽名圖 (假設不需要 projectName，如果需要，請添加)
export async function uploadSignature(filename, base64) {
    console.log(`[api.js] uploadSignature called with filename: ${filename}`);
    return fetchPost({ action: 'upload_signature', filename, base64, token: 'anxi111003' }, UPLOAD_API); // GAS doPost 的 upload_signature case 沒有接收 ssId
}

// ✅ 確認驗屋 (將簽名等資訊寫入)
export async function confirmInspection(payload, projectName) {
    console.log(`[api.js] confirmInspection called with projectName: ${projectName}, payload:`, payload);
    if (!projectName) {
        console.error("[api.js] confirmInspection: projectName is missing!");
        return { status: 'error', message: '前端錯誤：呼叫 confirmInspection 時缺少 projectName。' };
    }
    return fetchPost({
        action: 'confirm_inspection',
        projectName,
        token: 'anxi111003', // 假設代理層會檢查 token
        ...payload
    }, INSPECTION_API);
}

// ✅ 產出驗屋 PDF
export async function fetchGenerateInspectionPdf(unitId, projectName, overwrite = false) {
  console.log(`[api.js] fetchGenerateInspectionPdf called with unitId: ${unitId}, projectName: ${projectName}, overwrite: ${overwrite}`);
  if (!projectName) {
    console.error("[api.js] fetchGenerateInspectionPdf: projectName is missing!");
    return { status: 'error', message: '前端錯誤：呼叫 fetchGenerateInspectionPdf 時缺少 projectName。' };
  }
  return fetchPost({
    action: 'generate_inspection_pdf',
    unitId,
    projectName,
    overwrite,
    token: 'anxi111003'
  }, INSPECTION_API);
}

export async function fetchAllProjectInspectionRecords(projectName) {
  console.log(`[api.js] fetchAllProjectInspectionRecords called with projectName: ${projectName}`);
  if (!projectName) {
    console.error("[api.js] fetchAllProjectInspectionRecords: projectName is missing!");
    return { status: 'error', message: '前端錯誤：呼叫 fetchAllProjectInspectionRecords 時缺少 projectName。' };
  }
  return fetchPost({
    action: 'get_all_project_inspection_records', // 對應 GAS doPost 中的新 action
    projectName,
    token: 'anxi111003' // 假設也需要 token
  }, INSPECTION_API);
}

export async function getProjectsBySystemPermission(userKey, systemName) {
  console.log(`[api.js] getProjectsBySystemPermission called with userKey: ${userKey}, systemName: ${systemName}`);
  if (!userKey || !systemName) {
    console.error("[api.js] getProjectsBySystemPermission: userKey or systemName is missing!");
    return Promise.resolve({ status: 'error', message: '前端錯誤：呼叫 getProjectsBySystemPermission 時缺少 userKey 或 systemName。' });
  }
  return fetchPost({ action: 'get_projects_by_system_permission', key: userKey, systemName }, USER_API); // 假設此 action 屬於 USER_API 範疇
}

export async function fetchSalesControlData(projectName) {
  console.log(`[api.js] fetchSalesControlData called with projectName: ${projectName}`);
  if (!projectName) {
    console.error("[api.js] fetchSalesControlData: projectName is missing!");
    return Promise.resolve({ status: 'error', message: '前端錯誤：呼叫 fetchSalesControlData 時缺少 projectName。' });
  }
  return fetchPost({
    action: 'get_sales_control_data',
    projectName,
    token: 'anxi111003' // 假設代理層需要 token
  }, SALES_API); // 假設此 action 屬於一個新的 SALES_API 端點
}

export async function generateQuotePdf(payload) {
  console.log('[api.js] generateQuotePdf called with payload:', payload);
  // 這個功能的 action 通常與銷售相關，所以我們發到 sales 端點
  const body = {
    action: 'generate_quote_pdf',
    token: 'anxi111003', // 遵循您專案的慣例，加上 token
    ...payload
  };
  return fetchPost(body, SALES_API); // 使用已定義的 SALES_API 常數
}

export async function updateSalesData(payload) {
  console.log('[api.js] updateSalesData called with payload:', payload);
  const body = {
    action: 'update_sales_data',
    token: 'anxi111003',
    ...payload
  };
  return fetchPost(body, SALES_API);
}

/**
 * 獲取銷售下拉選單選項 (合約方式、是否首購)
 * @param {string} projectName 建案名稱
 * @returns {Promise<object>} API 響應
 */
export async function fetchSalesOptions(projectName) {
  console.log(`[api.js] fetchSalesOptions called for project: ${projectName}`);
  if (!projectName) {
    return Promise.resolve({ status: 'error', message: '前端錯誤：呼叫 fetchSalesOptions 時缺少 projectName。' });
  }
  // 這個 action 會透過 SALES_API 或 DROPDOWN_API 端點發送
  // 這裡我們假設它屬於 DROPDOWN_API 範疇
  return fetchPost({
    action: 'get_sales_options',
    projectName,
    token: 'anxi111003' // 如果需要 token 的話
  }, SALES_API); 
}


/**
 * 傳送付款表（包含檔案連結）給指定的收件人
 * @param {object} payload - 包含 projectName, recipients, files, unitId 等資訊
 * @returns {Promise<object>} API 響應
 */
export async function sendPaymentScheduleEmail(payload) {
    console.log('[api.js] sendPaymentScheduleEmail called with payload:', payload);
    
    // 我們可以將這個新功能歸類在銷售相關的 API 端點
    return fetchPost({
        action: 'send_payment_schedule_email',
        token: 'anxi111003', // 遵循您專案的慣例
        ...payload
    }, SALES_API);
}

/**
 * 製作付款表 (Word & PDF)
 * @param {object} payload - 包含 projectName, contractType, data 的物件
 * @returns {Promise<object>} API 響應
 */
export async function generatePaymentSchedule(payload) {
  console.log('[api.js] generatePaymentSchedule called with payload:', payload);
  const body = {
    action: 'generate_payment_schedule',
    token: 'anxi111003',
    ...payload
  };
  // 這個功能的 action 通常與銷售相關，所以我們發到 SALES_API 端點
  return fetchPost(body, SALES_API);
}

/**
 * 從指定的 Google Drive 資料夾 URL 中獲取唯一的 SVG 檔案內容
 * @param {string} folderUrl Google Drive 的資料夾連結
 * @param {string} projectName 建案名稱 (後端驗證需要)
 * @returns {Promise<object>} API 響應
 */
export async function fetchSvgFromDrive(folderUrl, projectName) {
  console.log(`[api.js] fetchSvgFromDrive called with folderUrl: ${folderUrl}, projectName: ${projectName}`);
  if (!folderUrl || !projectName) {
    return Promise.resolve({ status: 'error', message: '前端錯誤：呼叫 fetchSvgFromDrive 時缺少 folderUrl 或 projectName。' });
  }

  // 將 projectName 一起傳入 payload
  return fetchPost({
    action: 'get_svg_from_folder',
    folderUrl: folderUrl,
    projectName: projectName, // <--- 關鍵新增
    token: 'anxi111003'
  }, SALES_API);
}

/**
 * 觸發後端更新停車位銷控圖，並回傳最新的 Slide ID
 * @param {string} projectName 建案名稱
 * @returns {Promise<object>} API 響應，成功時 data 中應包含 slideId
 */
export async function updateAndGetParkingSlide(projectName, slideType) {
  console.log(`[api.js] updateAndGetParkingSlide called for project: ${projectName}, type: ${slideType}`);
  // ✅ 增加對 slideType 的檢查
  if (!projectName || !slideType) {
    return Promise.resolve({ status: 'error', message: '前端錯誤：呼叫時缺少 projectName 或 slideType。' });
  }
  return fetchPost({
    action: 'update_parking_slide',
    projectName,
    slideType, 
    token: 'anxi111003' 
  }, SALES_API); 
}

/**
 * 請求後端執行退戶操作
 * @param {string} projectName - 建案名稱
 * @param {string} unitId - 要退戶的戶別 ID
 * @param {string} operatorName - 執行此操作的使用者名稱
 * @returns {Promise<object>}
 */
export async function cancelPurchase(projectName, unitId, operatorName) {
  return fetchPost({
    action: 'cancel_purchase',
    projectName,
    unitId,
    operatorName,
    token: 'anxi111003' // 遵循您的慣例
  }, SALES_API);
}

// ===============================================
// /  訊息系統 API (修正版)
// ===============================================

/**
 * 獲取當前用戶的發信權限 (可選的建案與系統)
 * @param {string} userKey - 用戶的手機號碼
 * @returns {Promise<object>} - ✅ 直接回傳 data 物件
 */
export async function fetchMessagePermissionOptions(userKey) {
    const result = await fetchPost({ action: 'get_message_permission_options', key: userKey }, MESSAGE_API);
    // ✅ 修正：只回傳 data 部分，如果失敗則回傳空物件
    return result.status === 'success' ? result.data : {};
}

/**
 * 根據建案和系統功能獲取收件人列表
 * @param {string} projectName 
 * @param {string} systemFunction - e.g., '銷控', '驗屋'
 * @returns {Promise<Array>} - ✅ 直接回傳 data 陣列
 */
export async function fetchRecipientList(projectName, systemFunction) {
    const result = await fetchPost({ action: 'get_recipient_list', projectName, systemFunction }, MESSAGE_API);
    // ✅ 修正：只回傳 data 部分，如果失敗則回傳空陣列
    return result.status === 'success' ? result.data : [];
}

/**
 * 上傳單一附件檔案
 * @param {string} filename 
 * @param {string} base64 - Base64 編碼的檔案內容
 * @returns {Promise<object>} - ✅ 直接回傳 data 物件
 */
export async function uploadMessageAttachment(filename, base64) {
    const result = await fetchPost({ action: 'upload_attachment', filename, base64 }, MESSAGE_API);
    // ✅ 修正：只回傳 data 部分
    return result.status === 'success' ? result.data : null;
}

/**
 * 發送訊息
 * @param {object} messageData - 包含所有訊息內容的物件
 */
export async function sendMessage(messageData) {
    // 這個函式通常只關心成功或失敗，回傳整個 result 即可
    return fetchPost({ action: 'send_message', ...messageData }, MESSAGE_API);
}

/**
 * 獲取我的收件匣列表
 * @param {string} userKey 
 * @returns {Promise<Array>} - ✅ 直接回傳 data 陣列
 */
export async function fetchMyMessages(userKey) {
    const result = await fetchPost({ action: 'get_my_messages', key: userKey }, MESSAGE_API);
    // ✅ 修正：只回傳 data 部分，如果失敗則回傳空陣列
    return result.status === 'success' ? result.data : [];
}

/**
 * 獲取單一訊息的詳細內容
 * @param {string} statusId 
 * @param {string} userKey 
 * @returns {Promise<object>} - ✅ 直接回傳 data 物件
 */
export async function fetchMessageDetail(statusId, userKey) {
    const result = await fetchPost({ action: 'get_message_detail', statusId, key: userKey }, MESSAGE_API);
    // ✅ 修正：只回傳 data 部分
    return result.status === 'success' ? result.data : null;
}

/**
 * 獲取未讀訊息數量
 * @param {string} userKey 
 * @returns {Promise<number>} - ✅ 直接回傳 count 數字
 */
export async function fetchUnreadMessageCount(userKey) {
    const result = await fetchPost({ action: 'get_unread_message_count', key: userKey }, MESSAGE_API);
    // ✅ 修正：只回傳 count 部分，如果失敗則回傳 0
    return result.status === 'success' ? result.count : 0;
}

/**
 * 設定訊息狀態 - ✅ 修正版
 * @param {string} statusId 
 * @param {string} actionType - 'markRead', 'markUnread', 'toggleImportant', 'delete'
 */
export async function setMessageStatus(statusId, actionType) {
    return fetchPost({
        action: 'set_message_status', // 這是給代理層看的主要 action
        statusId: statusId,
        // ✅ 修正：將 'action' key 改名為 'statusAction'
        statusAction: actionType 
    }, MESSAGE_API);
}

// ===============================================
// /  人員管理系統 API
// ===============================================

/**
 * 獲取當前管理員的權限範圍 (可管理的建案和可指派的權限)
 * @param {string} adminKey - 管理員自己的手機號碼
 * @returns {Promise<object>} - 返回管理範圍物件
 */
export async function fetchAdminScope(adminKey) {
    const result = await fetchPost({ action: 'get_admin_scope', adminKey }, USER_MANAGEMENT_API);
    return result.status === 'success' ? result.data : {};
}

/**
 * 管理員查詢特定用戶的詳細資料
 * @param {string} targetUserKey - 被查詢者的手機號碼
 * @param {string} adminKey - 管理員自己的手機號碼
 * @returns {Promise<object|null>} - 返回用戶資料物件或 null
 */
export async function fetchUserDetailsForAdmin(targetUserKey, adminKey) {
    const result = await fetchPost({ action: 'fetch_user_details_for_admin', targetUserKey, adminKey }, USER_MANAGEMENT_API);
    // 如果成功，回傳 data，否則直接回傳整個 result 讓元件可以判斷錯誤類型
    return result.status === 'success' ? result.data : result;
}

/**
 * 管理員更新用戶資料
 * @param {object} updatePayload - 包含 targetUserKey, adminKey, basicInfo, permissionsData 的物件
 * @returns {Promise<object>} - 返回操作結果
 */
export async function updateUserDetailsForAdmin(updatePayload) {
    return fetchPost({ action: 'update_user_details_for_admin', ...updatePayload }, USER_MANAGEMENT_API);
}

/**
 * 獲取管理者可管理的人員列表 (姓名+電話)
 * @param {string} adminKey - 管理員自己的手機號碼
 * @returns {Promise<Array>} - 返回可管理人員的陣列
 */
export async function fetchManageableUsersForAdmin(adminKey) {
    const result = await fetchPost({ action: 'get_manageable_users_for_admin', adminKey }, USER_MANAGEMENT_API);
    return result.status === 'success' ? result.data : [];
}


// ===============================================
// /  訂閱管理系統 API
// ===============================================

/**
 * 獲取所有訂閱紀錄
 * @param {string} adminKey - 超級管理員的手機號碼
 */
export async function fetchAllSubscriptions(adminKey) {
    const result = await fetchPost({ action: 'get_all_subscriptions', adminKey }, SUBSCRIPTION_API);
    return result.status === 'success' ? result.data : [];
}

/**
 * 獲取用於訂閱表單的下拉選單資料 (建案、系統列表)
 * @param {string} adminKey - 超級管理員的手機號碼
 */
export async function fetchMasterDataForSubscriptionForm(adminKey) {
    const result = await fetchPost({ action: 'get_master_data_for_subscription_form', adminKey }, SUBSCRIPTION_API);
    return result.status === 'success' ? result.data : { projectNames: [], systemFunctions: [] };
}

/**
 * 新增一筆訂閱紀錄
 * @param {object} subscriptionData - 要新增的訂閱資料
 * @param {string} adminKey - 超級管理員的手機號碼
 */
export async function addSubscription(subscriptionData, adminKey) {
    return fetchPost({ action: 'add_subscription', subscriptionData, adminKey }, SUBSCRIPTION_API);
}

/**
 * 更新一筆訂閱紀錄
 * @param {string} subscriptionId - 要更新的紀錄 ID
 * @param {object} subscriptionData - 要更新的訂閱資料
 * @param {string} adminKey - 超級管理員的手機號碼
 */
export async function updateSubscription(subscriptionId, subscriptionData, adminKey) {
    return fetchPost({ action: 'update_subscription', subscriptionId, subscriptionData, adminKey }, SUBSCRIPTION_API);
}

/**
 * 刪除一筆訂閱紀錄
 * @param {string} subscriptionId - 要刪除的紀錄 ID
 * @param {string} adminKey - 超級管理員的手機號碼
 */
export async function deleteSubscription(subscriptionId, adminKey) {
    return fetchPost({ action: 'delete_subscription', subscriptionId, adminKey }, SUBSCRIPTION_API);
}

/**
 * ✅ 新增：獲取當前用戶可查看的訂閱狀態
 * @param {string} userKey - 當前登入用戶的手機號碼
 */
export async function fetchMySubscriptionStatus(userKey) {
    const result = await fetchPost({ action: 'get_my_subscription_status', userKey }, SUBSCRIPTION_API);
    // 如果成功，回傳 data 物件，否則回傳空物件以避免前端出錯
    return result.status === 'success' ? result.data : {};
}

/**
 * ===============================================
 * /  ✅ 新增：車位銷控管理 API
 * ===============================================
 */

/**
 * 獲取指定建案所有的「車位」詳細資料，用於銷控管理表格。
 * @param {string} projectName 建案名稱
 * @returns {Promise<object>} API 響應
 */
export async function fetchParkingLotDetails(projectName) {
  console.log(`[api.js] fetchParkingLotDetails called with projectName: ${projectName}`);
  if (!projectName) {
    return Promise.resolve({ status: 'error', message: '前端錯誤：呼叫 fetchParkingLotDetails 時缺少 projectName。' });
  }
  return fetchPost({
    action: 'get_parking_lot_details',
    projectName,
    token: 'anxi111003' // 遵循專案慣例
  }, SALES_API); 
}

/**
 * 更新單筆車位的銷控資料 (例如：買方姓名、備註、後台狀態)
 * @param {object} payload 包含 projectName, key (車位編號), 和 data (要更新的資料物件)
 * @returns {Promise<object>} API 響應
 */
export async function updateParkingLotDetails(payload) {
  console.log('[api.js] updateParkingLotDetails called with payload:', payload);
  if (!payload.projectName || !payload.key || !payload.data) {
      return Promise.resolve({ status: 'error', message: '前端錯誤：呼叫 updateParkingLotDetails 時缺少參數。' });
  }
  return fetchPost({
    action: 'update_parking_lot_details',
    token: 'anxi111003', // 遵循專案慣例
    ...payload
  }, SALES_API);
}

/**
 * ===============================================
 * /  ✅ 新增：銷控資料更新 API
 * ===============================================
 */

/**
 * 請求後端產生並下載指定的 Excel 工作表
 * @param {string} projectName 建案名稱
 * @param {Array<string>} sheetNames 要下載的工作表名稱陣列
 * @returns {Promise<object>} API 響應
 */
export async function downloadSheetsAsExcel(projectName, sheetNames) {
  console.log(`[api.js] downloadSheetsAsExcel called for project: ${projectName}, sheets: ${sheetNames}`);
  if (!projectName || !sheetNames || sheetNames.length === 0) {
    return Promise.resolve({ status: 'error', message: '前端錯誤：呼叫 downloadSheetsAsExcel 時缺少參數。' });
  }
  return fetchPost({
    action: 'download_sheets_as_excel',
    projectName,
    sheetNames, // 確保這個 key 是 'sheetNames'
    token: 'anxi111003'
  }, SALES_API);
}
/**
 * 上傳 Excel 檔案以覆蓋線上資料
 * @param {string} projectName 建案名稱
 * @param {string} fileId 上傳到 Google Drive 後的檔案 ID
 * @returns {Promise<object>} API 響應
 */
export async function uploadExcelToOverwrite(projectName, fileId) {
    console.log(`[api.js] uploadExcelToOverwrite called for project: ${projectName}`);
    if (!projectName || !fileId) {
        return Promise.resolve({ status: 'error', message: '前端錯誤：呼叫 uploadExcelToOverwrite 時缺少參數。' });
    }
    // 注意：這個 action 可能會執行很久，前端需要有良好的等待提示
    return fetchPost({
        action: 'upload_excel_to_overwrite',
        projectName,
        fileId,
        token: 'anxi111003'
    }, SALES_API);
}

/**
 * ✅ 新版：上傳檔案到後端暫存區 (給「更新銷控」功能專用)
 * @param {string} filename 檔名
 * @param {string} base64 Base64 編碼的檔案內容
 * @returns {Promise<object>} API 響應，包含 fileId
 */
export async function uploadFile(filename, base64) {
    console.log(`[api.js] uploadFile (for overwrite) called with filename: ${filename}`);
    // 這個 action 我們明確地讓它走銷售系統的 API 端點
    return fetchPost({ 
        action: 'upload_excel_for_overwrite', // <--- 使用新的 action
        filename, 
        base64, 
        token: 'anxi111003' 
    }, SALES_API); // <--- 使用 SALES_API
}

/**
 * 請求後端備份當前的銷控 SpreadSheet
 * @param {string} projectName 建案名稱
 * @returns {Promise<object>} API 響應
 */
export async function backupSpreadsheet(projectName) {
    console.log(`[api.js] backupSpreadsheet called for project: ${projectName}`);
    return fetchPost({
        action: 'backup_spreadsheet',
        projectName,
        token: 'anxi111003'
    }, SALES_API);
}

/**
 * 獲取活動訊息的 Google Slide ID
 * @param {string} projectName - 建案名稱
 */
export async function fetchActivityMessageSlideId(projectName) {
  const response = await fetchPost({
    action: 'get_activity_message_slide_id',
    projectName,
    token: 'anxi111003'
  }, SALES_API);
  if (response.status === 'success') {
    return response.data.slideId;
  }
  throw new Error(response.message || '無法獲取活動訊息 Slide ID。');
}


// =============================================
// ✅ 公開預約系統 API
// =============================================

/**
 * 獲取預約頁面初始化資料 (棟別、設定等)
 * @param {string} projectName 建案名稱
 */
export async function getBookingInitialData(projectName) {
  // 注意：公開功能，理論上不需 token，但我們會在 proxy 層處理
  return fetchPost({
    action: 'get_booking_initial_data',
    projectName: projectName,
  }, INSPECTION_API); // 繼續使用您現有的 API 端點
};
/**
 * 根據棟別獲取戶別列表
 * @param {string} projectName 建案名稱
 * @param {string} building 棟別
 */
export async function getUnitsByBuilding(projectName, building) {
  return fetchPost({
    action: 'get_units_by_building',
    projectName: projectName,
    building: building,
  }, INSPECTION_API);
};


/**
 * 檢查是否已有有效預約
 * @param {string} projectName 建案名稱
 * @param {string} unitId 戶別
 * @param {string} bookingType 預約項目 (e.g., '初驗')
 */
export async function checkExistingBooking(projectName, unitId, bookingType, idNumber) {
  return fetchPost({
    action: 'check_existing_booking',
    projectName: projectName,
    unitId: unitId,
    bookingType: bookingType,
    idNumber: idNumber,
  }, INSPECTION_API);
};

/**
 * 獲取可預約的日期和時段
 * @param {string} projectName 建案名稱
 * @param {string} unitId 戶別
 * @param {string} bookingType 預約項目
 * @param {string} bookingMethod 驗屋方式  
 */
export const getBookingSlots = async (projectName, unitId, bookingType, bookingMethod) => { // ✅ 新增此參數
  return fetchPost({
    action: 'get_booking_slots',
    projectName,
    unitId,
    bookingType,
    bookingMethod, 
  }, INSPECTION_API);
};
/**
 * 儲存預約資料
 * @param {string} projectName 建案名稱
 * @param {object} bookingData 表單資料
 */
export const saveBooking = async (projectName, bookingData) => {
  return fetchPost({
    action: 'save_booking',
    projectName,
    bookingData,
  }, INSPECTION_API);
};

/**
 * 取消預約
 * @param {string} projectName 建案名稱
 * @param {string} unitId 戶別
 * @param {string} bookingType 預約項目
 */
export const cancelBooking = async (projectName, unitId, bookingType) => {
  return fetchPost({
    action: 'cancel_booking',
    projectName,
    unitId,
    bookingType,
  }, INSPECTION_API);
};

/**
 * 一次性獲取所有可預約的戶別資料
 * @param {string} projectName 建案名稱
 */
export const fetchAllUnitsForBooking = async (projectName) => {
  return fetchPost({
    action: 'get_all_units_for_booking',
    projectName: projectName,
  }, INSPECTION_API);
};

/**
 * ✅ [新增] 驗證身分證與戶別是否相符
 * @param {string} projectName 建案名稱
 * @param {string} unitId 戶別
 * @param {string} idNumber 身分證號碼
 */
export const validateId = async (projectName, unitId, idNumber) => {
  return fetchPost({
    action: 'validate_id',
    projectName,
    unitId,
    idNumber,
  }, INSPECTION_API);
};