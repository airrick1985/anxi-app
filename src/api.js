// /workspaces/anxi-app/src/api.js
const BASE_API_URL = 'https://vercel-proxy-api2.vercel.app/api';
const INSPECTION_API = `${BASE_API_URL}/inspection`;
const DROPDOWN_API = `${BASE_API_URL}/dropdown`;
const USER_API = `${BASE_API_URL}/user`;
const METADATA_API = `${BASE_API_URL}/metadata`;
const UPLOAD_API = `${BASE_API_URL}/upload`;


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