// src/api.js

const LOGIN_API = 'https://vercel-proxy-api2.vercel.app/api/login';
const UPDATE_API = 'https://vercel-proxy-api2.vercel.app/api/update-profile';
const FORGOT_API = 'https://vercel-proxy-api2.vercel.app/api/forgot-password'; // ✅ 注意換成你的 Proxy URL
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