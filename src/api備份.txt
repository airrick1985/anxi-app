// src/api.js

const LOGIN_API = 'https://vercel-proxy-api2.vercel.app/api/login';
const UPDATE_API = 'https://vercel-proxy-api2.vercel.app/api/update-profile';
const FORGOT_API = 'https://vercel-proxy-api2.vercel.app/api/forgot-password';
const GET_UNIT_LIST_API = 'https://vercel-proxy-api2.vercel.app/api/get-unit-list';
const GET_BUILDING_LIST_API = 'https://vercel-proxy-api2.vercel.app/api/get-building-list';

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
    const text = await response.text();
    console.log('Login API Response Text:', text);
    const data = JSON.parse(text);
    return data;
  } catch (e) {
    console.error('Login fetch error:', e);
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
    const text = await response.text();
    console.log('Update Profile API Response Text:', text);
    return JSON.parse(text);
  } catch (e) {
    console.error('Update profile fetch error:', e);
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
    const text = await response.text();
    return JSON.parse(text);
  } catch (e) {
    console.error('forgotPassword fetch error:', e);
    return { status: 'error', message: e.message };
  }
}

/**
 * 呼叫戶別選單 API
 */
export async function fetchUnitList() {
  try {
    const response = await fetch(GET_UNIT_LIST_API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'get_unit_list' })
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return await response.json();
  } catch (e) {
    console.error('fetchUnitList error:', e);
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
