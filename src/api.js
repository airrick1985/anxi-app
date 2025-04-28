// src/api.js
const BASE_API_URL = 'https://vercel-proxy-api2.vercel.app/api';
const LOGIN_API = 'https://vercel-proxy-api2.vercel.app/api/login';
const UPDATE_API = 'https://vercel-proxy-api2.vercel.app/api/update-profile';
const FORGOT_API = 'https://vercel-proxy-api2.vercel.app/api/forgot-password';
const GET_UNIT_LIST_API = 'https://vercel-proxy-api2.vercel.app/api/get-unit-list';
const GET_BUILDING_LIST_API = 'https://vercel-proxy-api2.vercel.app/api/get-building-list';
const GET_HOUSE_DETAIL_API = 'https://vercel-proxy-api2.vercel.app/api/get-house-detail';

/**
 * 呼叫登入 API
 */
export async function loginUser(key, password) {
  try {
    const response = await fetch(LOGIN_API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key, password })
    });
    const data = await response.json();
    return data;
  } catch (e) {
    console.error('loginUser 錯誤:', e);
    return { status: 'error', message: e.message };
  }
}

/**
 * 呼叫更新個人資料 API
 */
export async function updateUserProfile(payload) {
  try {
    const response = await fetch(UPDATE_API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'update_profile', ...payload })
    });
    const data = await response.json();
    return data;
  } catch (e) {
    console.error('updateUserProfile 錯誤:', e);
    return { status: 'error', message: e.message };
  }
}

/**
 * 呼叫忘記密碼 API
 */
export async function forgotPasswordUser(key) {
  try {
    const response = await fetch(FORGOT_API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key })
    });
    const data = await response.json();
    return data;
  } catch (e) {
    console.error('forgotPasswordUser 錯誤:', e);
    return { status: 'error', message: e.message };
  }
}

/**
 * 取得棟別+戶別資料
 */
export async function fetchUnitList() {
  try {
    const response = await fetch(GET_UNIT_LIST_API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'get_unit_list' })
    });
    const data = await response.json();
    return data;
  } catch (e) {
    console.error('fetchUnitList 錯誤:', e);
    return { status: 'error', message: e.message };
  }
}

/**
 * 棟別選單 API
 */
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

/**
 * 取得 GitHub Releases 最新版本號與更新說明
 */
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

/**
 * 🔥 新增：查詢單一戶別詳細資料
 * @param {string} unit 戶別 (例如 "A1-04")
 * @param {string} token 安全驗證 (固定是 anxi111003)
 */
export async function fetchHouseDetail(unit, token) {
  try {
    const response = await fetch(GET_HOUSE_DETAIL_API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ unit, token })
    });
    const data = await response.json();
    return data;
  } catch (e) {
    console.error('fetchHouseDetail 錯誤:', e);
    return { status: 'error', message: e.message };
  }
}
