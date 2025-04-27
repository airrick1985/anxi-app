// src/api.js

// !! 確認這些 Proxy URL 和路徑是否正確 !!
// !! loginUser 調用的 URL 可能需要改成與 updateUserProfile 不同的路徑，或者後端 doPost 需要 action 參數 !!
const LOGIN_API = 'https://vercel-proxy-api2.vercel.app/api/login';       // <--- 確認這個路徑是處理登入的
const UPDATE_API = 'https://vercel-proxy-api2.vercel.app/api/update-profile'; // <--- 確認這個路徑是處理更新的

/**
 * 呼叫登入 API
 * @param {string} key - 用戶的手機號碼
 * @param {string} password - 用戶的密碼
 * @returns {Promise<object>} - API 的回應結果 { status: '...', user: {...}, message?: '...' }
 */
export async function loginUser(key, password) { // <--- 參數改成 key
  try {
    console.log(`Calling Login API: ${LOGIN_API} with key: ${key}`); // 增加 Log
    const response = await fetch(LOGIN_API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        key: key,         // <--- 發送 key
        password: password,
        // ** 考慮是否需要加 action? **
        // action: 'login' // 如果後端 doPost 需要用 action 區分
      }) 
    });

    // 檢查回應是否 OK (狀態碼 200-299)
    if (!response.ok) {
        // 嘗試讀取錯誤回應體 (如果有的話)
        let errorData = { status: 'error', message: `HTTP error! status: ${response.status}` };
        try {
            errorData = await response.json(); // 假設錯誤也是 JSON 格式
        } catch (jsonError) {
            // 如果錯誤回應不是 JSON，則保留原始 HTTP 錯誤訊息
            console.error("Failed to parse error response as JSON", jsonError);
        }
        console.error("Login API response not OK:", errorData);
        return errorData; // 返回包含錯誤訊息的物件
    }

    const data = await response.json();
    console.log("Login API success response:", data); // 增加 Log
    return data;

  } catch (e) {
    console.error('Login fetch error:', e);
    return { status: 'error', message: '網路請求失敗: ' + e.message }; // 返回標準錯誤格式
  }
}

/**
 * 呼叫更新個人資料 API
 * @param {object} payload - 包含更新所需數據的物件 { key, originalPassword, newName, newEmail, newPassword }
 * @returns {Promise<object>} - API 的回應結果 { status: '...', message?: '...' }
 */
export async function updateUserProfile(payload) { // <--- payload 應包含 key, newEmail 等
  try {
    console.log(`Calling Update Profile API: ${UPDATE_API} with payload:`, payload); // 增加 Log
    const response = await fetch(UPDATE_API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      // **確保發送 action 和完整的 payload**
      body: JSON.stringify({
          action: 'update_profile', // <--- 告訴後端執行更新操作
          ...payload               // <--- 將 payload 內容 ({ key, originalPassword, ... }) 包含進去
      })
    });

    // 檢查回應是否 OK
    if (!response.ok) {
        let errorData = { status: 'error', message: `HTTP error! status: ${response.status}` };
        try {
            errorData = await response.json();
        } catch (jsonError) {
            console.error("Failed to parse update error response as JSON", jsonError);
        }
        console.error("Update Profile API response not OK:", errorData);
        return errorData;
    }

    const data = await response.json();
    console.log("Update Profile API success response:", data); // 增加 Log
    return data;

  } catch (e) {
    console.error('Update profile fetch error:', e);
    return { status: 'error', message: '網路請求失敗: ' + e.message };
  }
}