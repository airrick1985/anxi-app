// src/api.js
const LOGIN_API = 'https://vercel-proxy-api2.vercel.app/api/login';
const UPDATE_API = 'https://vercel-proxy-api2.vercel.app/api/update-profile';

export async function loginUser(name, password) {
  try {
    const response = await fetch(LOGIN_API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, password })
    });
    return await response.json();
  } catch (e) {
    return { status: 'error', message: e.message };
  }
}

export async function updateUserProfile(payload) {
  try {
    const response = await fetch(UPDATE_API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    return await response.json();
  } catch (e) {
    return { status: 'error', message: e.message };
  }
}
