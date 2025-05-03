const BASE_API_URL = 'https://vercel-proxy-api2.vercel.app/api';
const INSPECTION_API = `${BASE_API_URL}/inspection`;
const DROPDOWN_API = `${BASE_API_URL}/dropdown`;
const USER_API = `${BASE_API_URL}/user`;
const METADATA_API = `${BASE_API_URL}/metadata`;
const UPLOAD_API = `${BASE_API_URL}/upload`;

// 🔐 使用者登入
export async function loginUser(key, password) {
  try {
    const res = await fetch(USER_API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'login', key, password })
    });
    return await res.json();
  } catch (e) {
    console.error('loginUser 錯誤:', e);
    return { status: 'error', message: e.message };
  }
}

// 🔧 修改使用者個人資料
export async function updateUserProfile(payload) {
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


// 🔑 忘記密碼
export async function forgotPasswordUser(key) {
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
export async function fetchUnitList() {
  return fetchPost({ action: 'get_unit_list' }, METADATA_API);
}

// 📋 查詢所有棟別
export async function getBuildingList() {
  return fetchPost({ action: 'get_building_list', token: 'anxi111003' }, METADATA_API);
}

// 📋 查詢單一戶別詳細資料
export async function fetchHouseDetail(unit, token) {
  return fetchPost({ action: 'get_house_detail', unit, token }, METADATA_API);
}

// 📋 查詢所有戶別資料（初始載入）
export async function fetchAllHouseDetails() {
  return fetchPost({ action: 'get_all_house_details', token: 'anxi111003' }, METADATA_API);
}


// 🧾 查詢驗屋紀錄
export async function fetchInspectionRecords(unitId) {
  return fetchPost({ action: 'get_inspection_records', unitId, token: 'anxi111003' }, INSPECTION_API);
}



// 🧾 新增驗屋紀錄
export async function addInspectionRecord(payload) {
  return fetchPost({ action: 'add_inspection_record', token: 'anxi111003', ...payload }, INSPECTION_API);
}

// 🧾 更新檢修欄位
export async function updateInspectionRecord({ key, repairDate, repairStatus, repairDescription }) {
  return fetchPost({
    action: 'update_inspection_record',
    key,
    repairDate,
    repairStatus,
    repairDescription,
    token: 'anxi111003'
  }, INSPECTION_API);
}

// 🧾 修改驗屋紀錄（編輯模式用）
export async function fetchInspectionUpdate(payload) {
  return fetchPost({
    action: 'edit_inspection_record',
    token: 'anxi111003',
    ...payload
  }, INSPECTION_API);
}


// 📦 選單參數（area/category/status/level）
export async function fetchDropdownOptions() {
  return fetchPost({ action: 'get_dropdown_options', token: 'anxi111003' }, DROPDOWN_API);
}

// 📦 細項選單依分類
export async function fetchSubcategories(category) {
  return fetchPost({ action: 'get_subcategories', category, token: 'anxi111003' }, DROPDOWN_API);
}

// 📦 檢修狀態選項
export async function getRepairStatusOptions() {
  const res = await fetchPost({ action: 'get_repair_status_options', token: 'anxi111003' }, DROPDOWN_API);
  return res.status === 'success' ? res.options : [];
}

// 🖼️ 上傳圖片
export async function uploadPhotoToDrive(filename, base64) {
  return fetchPost({ filename, base64, token: 'anxi111003' }, UPLOAD_API);
}

// 🌐 通用 POST 發送函數
async function fetchPost(body, url) {
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    return await res.json();
  } catch (e) {
    console.error(`${body.action || 'unknown'} API error:`, e);
    return { status: 'error', message: e.message };
  }
}

// 🚀 取得 GitHub 最新版本資訊（PWA 更新用）
export async function getLatestRelease() {
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
