const BASE_API_URL = 'https://vercel-proxy-api2.vercel.app/api';
const LOGIN_API = `${BASE_API_URL}/login`;
const UPDATE_API = `${BASE_API_URL}/update-profile`;
const FORGOT_API = `${BASE_API_URL}/forgot-password`;
const GET_UNIT_LIST_API = `${BASE_API_URL}/get-unit-list`;
const GET_BUILDING_LIST_API = `${BASE_API_URL}/get-building-list`;
const GET_HOUSE_DETAIL_API = `${BASE_API_URL}/get-house-detail`;
const GET_INSPECTION_RECORDS_API = `${BASE_API_URL}/get-inspection-records`;
const GET_ALL_HOUSE_DETAILS_API = `${BASE_API_URL}/get-all-house-details`; // 🔥 新增 API URL

// 登入
export async function loginUser(key, password) {
  try {
    const response = await fetch(LOGIN_API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key, password })
    });
    return await response.json();
  } catch (e) {
    console.error('loginUser 錯誤:', e);
    return { status: 'error', message: e.message };
  }
}

// 更新個人資料
export async function updateUserProfile(payload) {
  try {
    const response = await fetch(UPDATE_API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'update_profile', ...payload })
    });
    return await response.json();
  } catch (e) {
    console.error('updateUserProfile 錯誤:', e);
    return { status: 'error', message: e.message };
  }
}

// 忘記密碼
export async function forgotPasswordUser(key) {
  try {
    const response = await fetch(FORGOT_API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key })
    });
    return await response.json();
  } catch (e) {
    console.error('forgotPasswordUser 錯誤:', e);
    return { status: 'error', message: e.message };
  }
}

// 取得棟別+戶別清單
export async function fetchUnitList() {
  try {
    const response = await fetch(GET_UNIT_LIST_API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'get_unit_list' })
    });
    return await response.json();
  } catch (e) {
    console.error('fetchUnitList 錯誤:', e);
    return { status: 'error', message: e.message };
  }
}

// 取得棟別清單
export async function getBuildingList() {
  try {
    const response = await fetch(GET_BUILDING_LIST_API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'get_building_list' })
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return await response.json();
  } catch (e) {
    console.error('getBuildingList API error:', e);
    return { status: 'error', message: e.message };
  }
}

// GitHub 最新版本（可選）
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

// 🔥 查詢單一戶別詳細資料（傳 token）
export async function fetchHouseDetail(unit, token) {
  try {
    const response = await fetch(GET_HOUSE_DETAIL_API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ unit, token })
    });
    return await response.json();
  } catch (e) {
    console.error('fetchHouseDetail 錯誤:', e);
    return { status: 'error', message: e.message };
  }
}

// 🔥 查詢所有戶別資料（一次撈完）
export async function fetchAllHouseDetails() {
  try {
    const response = await fetch(GET_ALL_HOUSE_DETAILS_API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: 'anxi111003' })
    });

    return await response.json();
  } catch (e) {
    return { status: 'error', message: e.message }; // 🔥 這是第 132 行
  } // ✅ ← 檢查這裡有沒有多餘 } 或漏掉 }
}


// 查詢驗屋紀錄
export async function fetchInspectionRecords(unitId) {
  try {
    const response = await fetch(GET_INSPECTION_RECORDS_API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        unit: unitId,
        token: 'anxi111003'
      })
    });
    return await response.json();
  } catch (err) {
    console.error('fetchInspectionRecords error:', err);
    return { status: 'error', message: err.message };
  }
}

