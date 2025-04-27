// src/api.js

const LOGIN_API = 'https://vercel-proxy-api2.vercel.app/api/login';
const UPDATE_API = 'https://vercel-proxy-api2.vercel.app/api/update-profile';
const FORGOT_API = 'https://vercel-proxy-api2.vercel.app/api/forgot-password'; // ✅ 注意換成你的 Proxy URL
const GET_UNIT_LIST_API = 'https://vercel-proxy-api2.vercel.app/api/get-unit-list';


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

    let data;
    try {
      data = JSON.parse(text);
    } catch (e) {
      console.error('登入回傳不是有效 JSON:', text);
      throw new Error('登入回傳不是有效 JSON');
    }

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

    let data;
    try {
      data = JSON.parse(text);
    } catch (e) {
      console.error('更新回傳不是有效 JSON:', text);
      throw new Error('更新回傳不是有效 JSON');
    }

    return data;

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
      body: JSON.stringify({ key }) // ✅ 只傳 key，不用 password
    });

    const text = await response.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch (e) {
      console.error('忘記密碼回傳不是有效JSON:', text);
      throw new Error('忘記密碼回傳無效');
    }

    return data;

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
    const response = await fetch(GET_UNIT_LIST_API);
    const data = await response.json();
    return data;
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
    const response = await fetch('https://你的vercel-domain.vercel.app/api/get-building-list', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'get_building_list' })
    });

    if (!response.ok) {
      return { status: 'error', message: `HTTP error! status: ${response.status}` };
    }

    const data = await response.json();
    return data;

  } catch (e) {
    console.error('getBuildingList API error:', e);
    return { status: 'error', message: e.message };
  }
}