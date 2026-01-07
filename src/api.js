// /workspaces/anxi-app/src/api.js


//  在檔案頂部，引入所有需要的函式
import { db, storage, functions, rtdb } from '@/firebase';
import {
  collection,
  query,
  where,
  onSnapshot,
  getDocs,
  getDoc,
  doc,
  updateDoc,
  serverTimestamp,
  getCountFromServer,
  documentId,
  orderBy,
  writeBatch,
  setDoc,
  deleteDoc,
  Timestamp,
  addDoc,
  limit, 
} from "firebase/firestore";
import { format } from 'date-fns';

import { 
  ref, 
  uploadBytes, 
  getDownloadURL, 
  deleteObject 
} from "firebase/storage";

import { ref as dbRef, set, onDisconnect, serverTimestamp as rtdbServerTimestamp, remove } from 'firebase/database';

import { getFunctions, httpsCallable } from 'firebase/functions';
import { getAuth } from 'firebase/auth';
import { useUserStore } from '@/store/user';

// 1. 在頂部定義【並匯出】新的路由函數
export const bookingApiRouter = httpsCallable(functions, 'bookingApi');
// 2. 定義【並匯出】後台預約的路由函數
export const adminBookingApiRouter = httpsCallable(functions, 'adminBookingApi');
// 3. 定義【並匯出】行事曆頁面的路由函數_handleSearchAppointmentsAndHouseholds_Optimized
export const inspectionCalendarApiRouter = httpsCallable(functions, 'inspectionCalendarApi');
// 4. 【新增】定義 LIFF 行事曆頁面的路由函數 (您在上一步優化 LiffInspectionCalendar.vue 時會需要)
export const liffCalendarApiRouter = httpsCallable(functions, 'liffCalendarApi');
export const salesApiRouter = httpsCallable(functions, 'salesApi');
export const customerApiRouter = httpsCallable(functions, 'customerApi');
export const vipFormApiRouter = httpsCallable(functions, 'vipFormApi');
export const customerSheetApiRouter = httpsCallable(functions, 'customerSheetApi');




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
 * 獲取所有建案的基礎列表
 */
export async function fetchAllProjects() {
  const projectsCollection = collection(db, 'projects');
  const projectSnapshot = await getDocs(projectsCollection);
  const projectsList = projectSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  return projectsList;
}

/**
 * 獲取指定建案的所有車位資料
 * @param {string} projectName 建案名稱
 * @returns {Promise<object>} API 響應
 */
export async function fetchParkingList(projectName) {
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
  if (!projectName || !userKey) {
    return Promise.resolve({ status: 'error', message: '前端錯誤：呼叫 fetchQuotePersonnelList 時缺少參數。' });
  }
  return fetchPost({
    action: 'get_quote_personnel_list',
    projectName,
    key: userKey, //  關鍵修改：將 currentUserKey 改為 key
    token: 'anxi111003'
  }, USER_API);
}

/**
 * 從 Firestore 獲取報價人員清單 (新版本)
 * @param {string} projectId 專案ID
 * @returns {Promise<object>} 包含人員清單的響應
 */
export async function fetchSalesPersonnelList(projectId) {
  if (!projectId) {
    return Promise.resolve({ status: 'error', message: '前端錯誤：呼叫 fetchSalesPersonnelList 時缺少 projectId。' });
  }
  
  try {
    const q = query(
      collection(db, 'salesPersonnel'), 
      where('projectId', '==', projectId)
    );
    const querySnapshot = await getDocs(q);
    
    const personnelList = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      personnelList.push({
        id: doc.id,
        name: data.name,
        phone: data.phone,
        email: data.email,
        positions: data.positions,
        order: data.order
      });
    });
    
    return {
      status: 'success',
      data: { personnelList }
    };
  } catch (error) {
    console.error('[api.js] fetchSalesPersonnelList error:', error);
    return {
      status: 'error',
      message: error.message
    };
  }
}

/**
 * 從 Firestore 獲取期款範本資料
 * @param {string} projectId - 專案 ID
 * @returns {Promise<object>}
 */
export async function fetchPaymentTermTemplates(projectId) {
  if (!projectId) {
    return Promise.resolve({ status: 'error', message: '前端錯誤：呼叫 fetchPaymentTermTemplates 時缺少 projectId。' });
  }

  try {
    const q = query(
      collection(db, 'paymentTermTemplates'), 
      where('projectId', '==', projectId)
    );
    const querySnapshot = await getDocs(q);
    
    const templates = [];
    querySnapshot.forEach((doc) => {
      templates.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    return {
      status: 'success',
      data: templates
    };
  } catch (error) {
    console.error('[api.js] fetchPaymentTermTemplates error:', error);
    return {
      status: 'error',
      message: error.message
    };
  }
}

/**
 * 根據條件選擇適用的期款範本
 * @param {Array} templates - 所有範本列表
 * @param {number} totalPrice - 總價（萬元）
 * @param {string} buyerType - 購買身份："首購" 或 "非首購"
 * @param {string} propertyType - 物件類型："住家"、"店面" 或其他
 * @returns {Array} 符合條件的範本列表
 */
export function selectApplicableTemplates(templates, totalPrice, buyerType, propertyType) {
  
  // 1. 鎖定目標物件類型 (若戶別資料沒有該欄位，預設為 '住家')
  const targetPropertyType = propertyType || '住家';

  const applicable = templates.filter(template => {
    
    // ✅ [優先判斷] 範本物件類型 (若舊範本沒欄位，預設為 '住家')
    const templatePropType = template.propertyType || '住家';

    // 🔴 嚴格比對：類型不符，直接排除 (無論價格是否符合)
    if (templatePropType !== targetPropertyType) {
        return false;
    }

    // 2. 價格區間判斷
    const min = Number(template.minPrice) || 0;
    const max = Number(template.maxPrice) || Infinity; // 0 或 null 視為無上限

    // 3. 買家身分判斷
    return (
      totalPrice >= min && 
      totalPrice <= max && 
      template.buyerType === buyerType
    );
  });
  
  return applicable;
}

export async function getProjectList(userKey) { 

  if (!userKey) {
    console.error("[api.js] getProjectList: userKey is missing!");
    // 返回一個與 fetchPost 失敗時結構類似的 Promise，方便呼叫端統一處理
    return Promise.resolve({ status: 'error', message: '前端錯誤：呼叫 getProjectList 時缺少 userKey。' });
  }
  // 將 userKey 包含在傳遞給 fetchPost 的 body 中
  return fetchPost({ action: 'get_project_list', key: userKey }, USER_API);
  
}




/**
 * [新] 登入時，呼叫後端函式進行驗證並獲取使用者資料
 * @param {string} key - 手機號碼
 * @param {string} password - 密碼
 * @param {string} sessionId - 本次登入的唯一憑證
 * @returns {Promise<object>}
 */
export async function loginUser(key, password, sessionId) {
  //console.log(`[api.js] New loginUser called with key: ${key} and sessionId: ${sessionId}`);
  try {
    const handleLogin = httpsCallable(functions, 'handleLogin');
    const result = await handleLogin({ key, password, sessionId });
    
    // Cloud Function 成功時，回傳的資料會在 result.data 中
    return result.data;

  } catch (e) {
    console.error('New loginUser 錯誤:', e);
    // Cloud Function 拋出的 HttpsError 可以被捕捉到
    // 我們將其轉換為前端習慣的格式
    return { status: 'error', message: e.message };
  }
}

// 🔧 [Firestore 版] - 修改使用者個人資料
export async function updateUserProfile(payload) {
  const { key, oldPassword, name, email, newPassword } = payload;
  //console.log(`[api.js] Firestore updateUserProfile called for key: ${key}`);

  try {
    // 步驟 1: 獲取使用者文件參考
    const userDocRef = doc(db, "users", key);
    const userDocSnap = await getDoc(userDocRef);

    // 步驟 2: 驗證使用者是否存在及舊密碼是否正確
    if (!userDocSnap.exists()) {
      return { status: 'error', message: '找不到用戶資料，請重新登入' };
    }

    const userData = userDocSnap.data();
    if (userData.password !== String(oldPassword)) {
      return { status: 'error', message: '原密碼錯誤，無法更新資料' };
    }

    // 步驟 3: 準備要更新的資料
    const dataToUpdate = {
      name: name,
      email: email,
    };

    // 如果有提供新密碼，才將其加入待更新的資料中
    if (newPassword && String(newPassword).trim() !== '') {
      dataToUpdate.password = String(newPassword);
    }

    // 步驟 4: 執行更新
    await updateDoc(userDocRef, dataToUpdate);

    // 步驟 5: 回傳成功訊息
    //console.log(`[api.js] User profile for ${key} updated successfully.`);
    return { status: 'success', message: '個人資料已更新' };

  } catch (e) {
    console.error('Firestore updateUserProfile 錯誤:', e);
    return { status: 'error', message: `更新資料時發生錯誤: ${e.message}` };
  }
}


// 🔑 忘記密碼 (呼叫 Firebase Cloud Function)
export async function forgotPasswordUser(key) {
  //console.log(`[api.js] forgotPasswordUser called with key: ${key}`);
  try {
    // 獲取 Cloud Function 的引用
    const forgotPasswordSender = httpsCallable(functions, 'forgotPasswordSender');
    
    // 呼叫 Cloud Function 並傳遞資料
    const result = await forgotPasswordSender({ key: key });

    // httpsCallable 回傳的結果直接就在 result.data 中
    return result.data;

  } catch (e) {
    console.error('forgotPasswordUser 錯誤:', e);
    // Cloud Function 拋出的錯誤可以被捕捉到
    return { status: 'error', message: e.message };
  }
}

// 📋 查詢所有戶別清單
export async function fetchUnitList(projectName) {
  //console.log(`[api.js] fetchUnitList called with projectName: ${projectName}`);
  if (!projectName) {
    console.error("[api.js] fetchUnitList: projectName is missing!");
    return { status: 'error', message: '前端錯誤：呼叫 fetchUnitList 時缺少 projectName。' };
  }
  return fetchPost({ action: 'get_unit_list', projectName }, METADATA_API);
}

// 📋 查詢所有棟別
export async function getBuildingList(projectName) {
  //console.log(`[api.js] getBuildingList called with projectName: ${projectName}`);
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
  //console.log(`[api.js] fetchHouseDetail called with unitId: ${unitId}, projectName: ${projectName}, token: ${token}`);
  if (!projectName) {
    console.error("[api.js] fetchHouseDetail: projectName is missing!");
    return { status: 'error', message: '前端錯誤：呼叫 fetchHouseDetail 時缺少 projectName。' };
  }
  return fetchPost({ action: 'get_house_detail', unitId, projectName, token }, METADATA_API);
}

// 📋 查詢所有戶別資料（初始載入）
export async function fetchAllHouseDetails(projectName) {
  //console.log(`[api.js] fetchAllHouseDetails called with projectName: ${projectName}`);
  if (!projectName) {
    console.error("[api.js] fetchAllHouseDetails: projectName is missing!");
    return { status: 'error', message: '前端錯誤：呼叫 fetchAllHouseDetails 時缺少 projectName。' };
  }
  return fetchPost({ action: 'get_all_house_details', projectName, token: 'anxi111003' }, METADATA_API);
}


// 🧾 查詢驗屋紀錄
export async function fetchInspectionRecords(unitId, projectName) {
  //console.log(`[api.js] fetchInspectionRecords called with unitId: ${unitId}, projectName: ${projectName}`);
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
  //console.log(`[api.js] addInspectionRecord called with projectName: ${projectName}, payload:`, payload);
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
  //console.log(`[api.js] updateInspectionRecord called with key: ${key}, projectName: ${projectName}`);
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
  //console.log(`[api.js] fetchInspectionUpdate called with projectName: ${projectName}, payload:`, payload);
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
  //console.log(`[api.js] fetchDropdownOptions called with projectName: ${projectName}`);
  if (!projectName) {
    console.error("[api.js] fetchDropdownOptions: projectName is missing!");
    return { status: 'error', message: '前端錯誤：呼叫 fetchDropdownOptions 時缺少 projectName。' };
  }
  return fetchPost({ action: 'get_dropdown_options', projectName, token: 'anxi111003' }, DROPDOWN_API);
}


// 📦 所有分類對應細項一次載入
export async function fetchAllSubcategories(projectName) {
  //console.log(`[api.js] fetchAllSubcategories called with projectName: ${projectName}`);
  if (!projectName) {
    console.error("[api.js] fetchAllSubcategories: projectName is missing!");
    return { status: 'error', message: '前端錯誤：呼叫 fetchAllSubcategories 時缺少 projectName。' };
  }
  return fetchPost({ action: 'get_all_subcategories', projectName, token: 'anxi111003' }, DROPDOWN_API);
}


// 📦 檢修狀態選項
export async function getRepairStatusOptions(projectName) {
  //console.log(`[api.js] getRepairStatusOptions called with projectName: ${projectName}`);
  if (!projectName) {
    console.error("[api.js] getRepairStatusOptions: projectName is missing!");
    return { status: 'error', message: '前端錯誤：呼叫 getRepairStatusOptions 時缺少 projectName。' };
  }
  const res = await fetchPost({ action: 'get_repair_status_options', projectName, token: 'anxi111003' }, DROPDOWN_API);
  return res.status === 'success' ? res.options : [];
}

// 🖼️ 上傳圖片 (假設不需要 projectName，如果需要，請添加)
export async function uploadPhotoToDrive(filename, base64) {
  //console.log(`[api.js] uploadPhotoToDrive called with filename: ${filename}`);
  return fetchPost({ action: 'upload_photo', filename, base64, token: 'anxi111003' }, UPLOAD_API); // GAS doPost 的 upload_photo case 沒有接收 ssId
}

// 🌐 通用 POST 發送函數
async function fetchPost(body, url) {
  //console.log(`[api.js] fetchPost to ${url} with body:`, JSON.stringify(body).substring(0, 500) + (JSON.stringify(body).length > 500 ? '...' : ''));
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
  //console.log('[api.js] getLatestRelease called');
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
  //console.log(`[api.js] deleteInspectionRecord called with key: ${key}, projectName: ${projectName}`);
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
  //console.log(`[api.js] fetchDeletedInspectionRecords called with projectName: ${projectName}`);
  if (!projectName) {
    console.error("[api.js] fetchDeletedInspectionRecords: projectName is missing!");
    return { status: 'error', message: '前端錯誤：呼叫 fetchDeletedInspectionRecords 時缺少 projectName。' };
  }
  return fetchPost({ action: 'get_deleted_inspection_records', projectName, token: 'anxi111003' }, INSPECTION_API);
}

// ♻️ 復原刪除的驗屋紀錄
export async function restoreInspectionRecord(key, projectName) {
  //console.log(`[api.js] restoreInspectionRecord called with key: ${key}, projectName: ${projectName}`);
  if (!projectName) {
    console.error("[api.js] restoreInspectionRecord: projectName is missing!");
    return { status: 'error', message: '前端錯誤：呼叫 restoreInspectionRecord 時缺少 projectName。' };
  }
  return fetchPost({ action: 'restore_inspection_record', key, projectName, token: 'anxi111003' }, INSPECTION_API);
}

// 🖼️ 刪除單張照片 (包含 Drive 刪除)
export async function deletePhotoFromRecord(key, photoField, projectName) {
  //console.log(`[api.js] deletePhotoFromRecord called with key: ${key}, photoField: ${photoField}, projectName: ${projectName}`);
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

//  產出分享網址
export async function generateShareUrl(unitId, projectName) {
  //console.log(`[api.js] generateShareUrl called with unitId: ${unitId}, projectName: ${projectName}`);
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
  //console.log(`[api.js] fetchInspectionUpdateWithPhotos called with projectName: ${projectName}, payload:`, payload);
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

//  上傳簽名圖 (假設不需要 projectName，如果需要，請添加)
export async function uploadSignature(filename, base64) {
    //console.log(`[api.js] uploadSignature called with filename: ${filename}`);
    return fetchPost({ action: 'upload_signature', filename, base64, token: 'anxi111003' }, UPLOAD_API); // GAS doPost 的 upload_signature case 沒有接收 ssId
}

//  確認驗屋 (將簽名等資訊寫入)
export async function confirmInspection(payload, projectName) {
    //console.log(`[api.js] confirmInspection called with projectName: ${projectName}, payload:`, payload);
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

//  產出驗屋 PDF
export async function fetchGenerateInspectionPdf(unitId, projectName, overwrite = false) {
  //console.log(`[api.js] fetchGenerateInspectionPdf called with unitId: ${unitId}, projectName: ${projectName}, overwrite: ${overwrite}`);
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
  //console.log(`[api.js] fetchAllProjectInspectionRecords called with projectName: ${projectName}`);
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
  //console.log(`[api.js] getProjectsBySystemPermission called with userKey: ${userKey}, systemName: ${systemName}`);
  if (!userKey || !systemName) {
    console.error("[api.js] getProjectsBySystemPermission: userKey or systemName is missing!");
    return Promise.resolve({ status: 'error', message: '前端錯誤：呼叫 getProjectsBySystemPermission 時缺少 userKey 或 systemName。' });
  }
  return fetchPost({ action: 'get_projects_by_system_permission', key: userKey, systemName }, USER_API); // 假設此 action 屬於 USER_API 範疇
}

export async function fetchSalesControlData(projectName) {
  //console.log(`[api.js] fetchSalesControlData called with projectName: ${projectName}`);
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
  //console.log('[api.js] generateQuotePdf called with payload:', payload);
  // 這個功能的 action 通常與銷售相關，所以我們發到 sales 端點
  const body = {
    action: 'generate_quote_pdf',
    token: 'anxi111003', // 遵循您專案的慣例，加上 token
    ...payload
  };
  return fetchPost(body, SALES_API); // 使用已定義的 SALES_API 常數
}

/**
 * 更新銷控資料（透過 Firebase Cloud Function）
 * @param {object} payload - 包含 projectName, unitId, data 的物件
 * @returns {Promise<object>} API 響應
 */
export async function updateSalesData(payload) {
  //console.log('[api.js] updateSalesData called with payload:', payload);
  
  if (!payload.projectName || !payload.unitId || !payload.data) {
    return { status: "error", message: "前端錯誤：缺少 projectName、unitId 或 data。" };
  }
  
  try {
    const updateFunction = httpsCallable(functions, 'updateSalesData');
    const result = await updateFunction({
      projectName: payload.projectName,
      projectId: payload.projectId, //  新增：傳遞 projectId 到 Cloud Function
      unitId: payload.unitId,
      data: payload.data
    });
    return result.data; // 直接回傳 Cloud Function 的 { status, message }
  } catch (error) {
    console.error("呼叫 updateSalesData 雲端函式時發生錯誤:", error);
    return { status: "error", message: error.message };
  }
}

/**
 * 獲取銷售下拉選單選項 (合約方式、是否首購)
 * @param {string} projectName 建案名稱
 * @returns {Promise<object>} API 響應
 */
export async function fetchSalesOptions(projectName) {
  //console.log(`[api.js] fetchSalesOptions called for project: ${projectName}`);
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


// ✓ 新增：呼叫新的 Cloud Function
/**
 * [API] 呼叫後端，複製 Google Sheet 付款表模板並回填資料
 * @param {object} payload - 包含 projectId, unitId, data 等...
 * @returns {Promise<object>} - { status, url }
 */
export const generatePaymentSheet = async (payload) => {
  try {
    const generateFunc = httpsCallable(functions, 'generatePaymentSheet');
    const result = await generateFunc(payload);
    return result.data; // 直接回傳後端 { status, url }
  } catch (error) {
    console.error("API Error in generatePaymentSheet:", error);
    // 將 HttpsError 的 message 提取出來拋出
    throw new Error(error.message || '產製付款表失敗');
  }
};


/**
 * 從指定的 Google Drive 資料夾 URL 中獲取唯一的 SVG 檔案內容
 * @param {string} folderUrl Google Drive 的資料夾連結
 * @param {string} projectName 建案名稱 (後端驗證需要)
 * @returns {Promise<object>} API 響應
 */
export async function fetchSvgFromDrive(folderUrl, projectName) {
  //console.log(`[api.js] fetchSvgFromDrive called with folderUrl: ${folderUrl}, projectName: ${projectName}`);
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
 * ✓ 【Firebase Function 版】觸發後端更新停車位銷控圖，並回傳最新的 Slide ID
 * @param {string} projectId 建案 ID (注意：參數名稱從 projectName 改為 projectId)
 * @param {string} slideType 模式 ('sales' 或 'quote')
 * @returns {Promise<object>} API 響應，成功時 data 中應包含 slideId
 */
export async function updateAndGetParkingSlide(projectId, slideType) {
  
  if (!projectId || !slideType) {
    return { status: 'error', message: '前端錯誤：呼叫時缺少 projectId 或 slideType。' };
  }

  try {
    // 獲取對我們剛剛部署的 Cloud Function 的引用
    const updateParkingSlideFunction = httpsCallable(functions, 'updateParkingSlide');
    
    // 呼叫 Cloud Function 並傳遞資料
    const result = await updateParkingSlideFunction({ projectId, slideType });

    // Cloud Function 的回傳結果會被包裹在 result.data 中
    // 我們直接回傳這個結果，它應該包含 { status: 'success', slideId: '...' }
    return result.data;

  } catch (error) {
    console.error("呼叫 updateParkingSlide 雲端函式時發生錯誤:", error);
    // 將 Firebase Function 拋出的 HttpsError 轉換為前端習慣的格式
    return { status: 'error', message: error.message };
  }
}

/**
 * 請求後端執行退戶操作
 * @param {string} projectName - 建案名稱
 * @param {string} projectId - 專案 ID
 * @param {string} unitId - 要退戶的戶別 ID
 * @param {string} operatorName - 執行此操作的使用者名稱
 * @returns {Promise<object>}
 */
export async function cancelPurchase(projectName, projectId, unitId, operatorName) {
  //console.log('[api.js] cancelPurchase called with params:', { projectName, projectId, unitId, operatorName });
  
  if (!projectId || !unitId || !operatorName) {
    return { status: "error", message: "前端錯誤：缺少 projectId、unitId 或 operatorName。" };
  }
  
  try {
    const cancelFunction = httpsCallable(functions, 'cancelPurchase');
    const result = await cancelFunction({
      projectId: projectId,
      unitId: unitId,
      operatorName: operatorName
    });
    
    //console.log('[api.js] cancelPurchase success:', result.data);
    return result.data; // 直接回傳 Cloud Function 的回應
  } catch (error) {
    console.error("呼叫 cancelPurchase 雲端函式時發生錯誤:", error);
    return { status: "error", message: error.message };
  }
}

// ===============================================
// /  訊息系統 API (Firestore 遷移版)
// ===============================================

/**
 *  [已修正] 獲取當前用戶的發信權限 (可選的建案與系統)
 * @param {string} userKey - 用戶的手機號碼
 * @returns {Promise<object>} - 返回權限物件 { projectName: [system1, system2] }
 */
export async function fetchMessagePermissionOptions(userKey) {
    // 1. 從新的 userPermissions 集合中讀取使用者的單一權限文件
    const permissionDocRef = doc(db, "userPermissions", userKey);
    const docSnap = await getDoc(permissionDocRef);

    if (!docSnap.exists()) {
        return {}; // 如果沒有權限文件，直接回傳空物件
    }

    const permissions = {};
    const perms = docSnap.data().permissions || {};

    // 2. 遍歷權限物件，篩選出 "寄信-" 開頭的權限
    for (const projectId in perms) {
        const project = perms[projectId];
        if (project && project.projectName && Array.isArray(project.systems)) {
            const sendingSystems = project.systems
                .filter(system => system.startsWith('寄信-'))
                .map(system => system.replace('寄信-', '')); // 移除 "寄信-" 前綴

            if (sendingSystems.length > 0) {
                permissions[project.projectName] = sendingSystems;
            }
        }
    }
    return permissions;
}

/**
 *  [已修正] 根據建案和系統功能獲取收件人列表
 */
export async function fetchRecipientList(projectName, systemFunction) {
    const targetPermission = `收信-${systemFunction}`;
    const permissionsRef = collection(db, "userPermissions");

    const snapshot = await getDocs(permissionsRef);
    const userPhones = [];

    snapshot.forEach(doc => {
        const perms = doc.data().permissions || {};
        for (const projectId in perms) {
            if (perms[projectId].projectName === projectName && perms[projectId].systems.includes(targetPermission)) {
                userPhones.push(doc.id);
                break;
            }
        }
    });

    if (userPhones.length === 0) return [];

    const usersRef = collection(db, "users");
    const usersQuery = query(usersRef, where(documentId(), 'in', [...new Set(userPhones)]));
    const usersSnapshot = await getDocs(usersQuery);

    const recipients = [];
    usersSnapshot.forEach(doc => {
        recipients.push({ name: doc.data().name, phone: doc.id });
    });

    return recipients;
}

/**
 * [Firebase Storage 版] 上傳單一附件檔案
 * @param {File} file - 從 input 取得的原始 File 物件
 * @returns {Promise<object>} - 返回包含 { name, url, path } 的物件
 */
export async function uploadMessageAttachment(file) {
    // 建立一個對 Firebase Storage 的引用
    const storageRef = ref(storage, `attachments/${Date.now()}_${file.name}`);
    
    // 上傳檔案
    const snapshot = await uploadBytes(storageRef, file);
    
    // 獲取下載 URL
    const downloadURL = await getDownloadURL(snapshot.ref);

    // 回傳包含檔案資訊的物件，供後續使用
    return {
        name: file.name,
        url: downloadURL,
        path: snapshot.ref.fullPath // 儲存完整路徑以便未來管理 (例如刪除)
    };
}


/**
 * [Firestore 版] 發送訊息
 * @param {object} messageData - 包含所有訊息內容的物件
 */
export async function sendMessage(messageData) {
    // 1. 建立一個批次寫入操作，確保資料一致性
    const batch = writeBatch(db);

    // 2. 在 'messages' 集合中建立一個新文件並取得其 ID
    const messageRef = doc(collection(db, 'messages'));
    const messageId = messageRef.id;

    // 3. 準備要寫入 'messages' 集合的資料
    const messagePayload = {
        senderKey: messageData.senderKey,
        senderName: messageData.senderName,
        sentTimestamp: serverTimestamp(), // 使用伺服器時間，更準確
        projectName: messageData.projectName,
        systemFunction: messageData.systemFunction,
        subject: messageData.subject,
        body: messageData.body,
        attachments: JSON.stringify(messageData.attachments) // 將附件陣列轉為 JSON 字串儲存
    };
    batch.set(messageRef, messagePayload);

    // 4. 為每一位收件人（包含寄件人自己）在 'messageStatus' 集合中建立對應的狀態文件
    messageData.recipientPhones.forEach(phone => {
        const statusRef = doc(collection(db, 'messageStatus')); // 自動產生唯一 ID
        const statusPayload = {
            messageId: messageId,
            recipientPhone: phone,
            readTimestamp: null,
            isImportant: false,
            isDeleted: false
        };
        batch.set(statusRef, statusPayload);
    });

    // 5. 提交所有寫入操作
    await batch.commit();
}
/**
 * [Firestore 版] 獲取我的收件匣列表
 * @param {string} userKey 
 * @returns {Promise<Array>}
 */
export async function fetchMyMessages(userKey) {
    // 1. 查詢 messageStatus 集合，找到所有屬於該用戶且未刪除的訊息狀態
    const statusRef = collection(db, "messageStatus");
    const statusQuery = query(
        statusRef,
        where("recipientPhone", "==", userKey),
        where("isDeleted", "==", false)
    );
    const statusSnapshot = await getDocs(statusQuery);
    if (statusSnapshot.empty) return [];

    // 2. 從狀態中提取所有不重複的 messageId
    const messageStatusMap = new Map();
    statusSnapshot.forEach(doc => {
        messageStatusMap.set(doc.data().messageId, { id: doc.id, ...doc.data() });
    });
    const messageIds = Array.from(messageStatusMap.keys());
    if (messageIds.length === 0) return [];
    
    // 3. 使用 'in' 查詢，一次性從 messages 集合獲取所有相關的訊息主體
    const messagesRef = collection(db, "messages");
    const messagesQuery = query(
        messagesRef, 
        where(documentId(), 'in', messageIds),
        orderBy("sentTimestamp", "desc") // 直接在查詢時排序
    );
    const messagesSnapshot = await getDocs(messagesQuery);

    // 4. 組合訊息主體和個人狀態，回傳給前端
    const myMessages = messagesSnapshot.docs.map(doc => {
        const message = doc.data();
        const status = messageStatusMap.get(doc.id);

        return {
            statusId: status.id,
            messageId: doc.id,
            senderName: message.senderName,
            subject: message.subject,
            sentTimestamp: message.sentTimestamp?.toDate(), // 將 Firestore Timestamp 轉為 JS Date
            isRead: !!status.readTimestamp,
            isImportant: status.isImportant,
            projectName: message.projectName,
            systemFunction: message.systemFunction
        };
    });

    return myMessages;
}

/**
 * [Firestore 版] 獲取單一訊息的詳細內容
 * @param {string} statusId 
 * @param {string} userKey 
 * @returns {Promise<object|null>}
 */
export async function fetchMessageDetail(statusId, userKey) {
    // 1. 獲取狀態文件，並驗證所有權
    const statusDocRef = doc(db, "messageStatus", statusId);
    const statusDocSnap = await getDoc(statusDocRef);

    if (!statusDocSnap.exists() || statusDocSnap.data().recipientPhone !== userKey) {
        console.error("權限不足或找不到訊息狀態");
        return null;
    }

    // 2. 根據狀態文件中的 messageId 獲取訊息主體
    const messageId = statusDocSnap.data().messageId;
    const messageDocRef = doc(db, "messages", messageId);
    const messageDocSnap = await getDoc(messageDocRef);

    if (!messageDocSnap.exists()) {
        console.error("找不到對應的訊息主體");
        return null;
    }

    const message = messageDocSnap.data();
    return {
        messageId: messageDocSnap.id,
        senderName: message.senderName,
        sentTimestamp: message.sentTimestamp?.toDate(),
        subject: message.subject,
        body: message.body,
        attachments: JSON.parse(message.attachments || '[]')
    };
}

/**
 * [Firestore 版] 獲取未讀訊息數量
 * @param {string} userKey 
 * @returns {Promise<number>}
 */
export async function fetchUnreadMessageCount(userKey) {
    const statusRef = collection(db, "messageStatus");
    const q = query(
        statusRef,
        where("recipientPhone", "==", userKey),
        where("isDeleted", "==", false),
        where("readTimestamp", "==", null)
    );
    
    // 使用 getCountFromServer 效能更好
    const snapshot = await getCountFromServer(q);
    return snapshot.data().count;
}

/**
 * [Firestore 版] 設定訊息狀態
 * @param {string} statusId 
 * @param {string} actionType - 'markRead', 'markUnread', 'toggleImportant', 'delete'
 */
export async function setMessageStatus(statusId, actionType) {
    const docRef = doc(db, "messageStatus", statusId);

    switch (actionType) {
        case 'markRead':
            return updateDoc(docRef, { readTimestamp: serverTimestamp() });
        case 'markUnread':
            return updateDoc(docRef, { readTimestamp: null });
        case 'toggleImportant': {
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
                const currentStatus = docSnap.data().isImportant;
                return updateDoc(docRef, { isImportant: !currentStatus });
            }
            break;
        }
        case 'delete':
            return updateDoc(docRef, { isDeleted: true });
    }
    return Promise.resolve(); // 如果 actionType 無效，返回一個 resolved promise
}

// =================================================================
// / 【新功能】角色權限管理 (RBAC) API
// =================================================================

/**
 * 獲取所有角色的設定
 * @returns {Promise<Array>}
 */
export async function fetchAllRoles() {
    const rolesCollection = collection(db, 'roles');
    const rolesSnapshot = await getDocs(rolesCollection);
    return rolesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

/**
 * 更新或建立一個角色
 * @param {string} roleId - 角色名稱 (文件 ID)
 * @param {object} roleData - 角色的資料物件 (現在只包含 grantableRoles 和 fieldPermissions)
 */
export async function updateRole(roleId, roleData) {
    const roleDocRef = doc(db, "roles", roleId);
    // 確保只儲存我們定義的欄位
    const dataToSave = {
      name: roleData.name,
      grantableRoles: roleData.grantableRoles || [],
      fieldPermissions: roleData.fieldPermissions || {}
    };
    await setDoc(roleDocRef, dataToSave, { merge: true });
}

/**
 * 刪除一個角色
 * @param {string} roleId - 角色名稱 (文件 ID)
 */
export async function deleteRole(roleId) {
    const roleDocRef = doc(db, "roles", roleId);
    await deleteDoc(roleDocRef);
}
// ===============================================
// /  人員管理系統 API
// ===============================================

/**
 * [新] 獲取管理者可管理的人員列表
 */
export async function fetchManageableUsersWithDetails(adminKey) {
  if (!adminKey) {
    console.error("fetchManageableUsersWithDetails: 缺少 adminKey。");
    return []; // 如果沒有 adminKey，直接返回空陣列
  }
  
  try {
    // 1. 獲取對後端 Cloud Function 的引用
    const fetcher = httpsCallable(functions, 'fetchManageableUsersWithDetails');
    
    // 2. 呼叫後端函式，並將 adminKey 作為參數傳遞
    const result = await fetcher({ adminKey });
    
    // 3. 直接回傳後端經過完整權限過濾後的結果
    return result.data; // result.data 將會是您需要的人員陣列

  } catch (error) {
    console.error("API fetchManageableUsersWithDetails 錯誤:", error);
    // 在實際應用中，可以在此處觸發一個錯誤通知
    // toast.error(`獲取人員列表失敗: ${error.message}`);
    return []; // 發生錯誤時回傳空陣列，避免頁面崩潰
  }
}

/**
 * [新] 更新指定使用者的角色列表
 */
export async function updateUserRoles(userPhone, roles) {
  if (!userPhone) throw new Error("缺少使用者手機號碼。");
  const userDocRef = doc(db, "users", userPhone);
  await updateDoc(userDocRef, {
    roles: roles
  });
}

/**
 * 根據使用者金鑰 (userKey) 取得其權限範圍。
 * @param {string} userKey - 使用者的唯一金鑰。
 * @returns {Promise<object|null>} - 回傳權限物件，或在找不到時回傳 null。
 */
export async function fetchAdminScope(userKey) {
  if (!userKey) {
    return null;
  }
  const userPermDocRef = doc(db, 'userPermissions', userKey);
  const docSnap = await getDoc(userPermDocRef);

  if (docSnap.exists()) {
    const permissionsData = docSnap.data().permissions || {};
    return permissionsData;
  } else {
    return null;
  }
}


/**
 * [新] 管理員查詢特定用戶的詳細資料 (透過 Cloud Function 進行權限驗證)
 * @param {string} targetUserKey - 被查詢者的手機號碼
 * @param {string} adminKey - 操作者的手機號碼
 * @returns {Promise<object>}
 */
export async function fetchUserDetailsForAdmin(targetUserKey, adminKey) {
  try {
    // 1. 獲取對後端 Cloud Function 的引用
    const fetcher = httpsCallable(functions, 'fetchUserDetailsForAdmin');
    
    // 2. 呼叫後端函式，並傳遞所有必要的參數
    const result = await fetcher({
      targetUserKey: targetUserKey,
      adminKey: adminKey
    });

    // 3. 直接回傳後端的執行結果
    return result.data; // e.g., { status: 'success', data: { ... } }

  } catch (error) {
    // 4. 如果後端拋出錯誤 (例如 'permission-denied')，將其轉換為前端可用的格式
    console.error(`查詢用戶 ${targetUserKey} 資料時出錯:`, error);
    return { status: 'error', message: error.message };
  }
}

/**
 * [新] 管理員更新用戶資料 (包含後端欄位權限驗證)
 */
export async function updateUserDetailsForAdmin(payload) {
    //  接收 isNewUser 參數
    const { targetUserKey, adminKey, adminName, basicInfo, permissions, isNewUser } = payload;

    try {
        const adminUserDoc = await getDoc(doc(db, "users", adminKey));
        const adminRoles = adminUserDoc.exists() ? adminUserDoc.data().roles || [] : [];
        
        let finalBasicInfo = { ...basicInfo };
        let mergedFieldPerms = {};

        if (!adminRoles.includes('超級管理員')) {
            const rolesDocs = await getDocs(query(collection(db, 'roles'), where('name', 'in', adminRoles)));
            
            rolesDocs.forEach(roleDoc => {
                const perms = roleDoc.data().fieldPermissions?.UserManagement || {};
                Object.assign(mergedFieldPerms, perms);
            });
            
            const allowedBasicInfo = {};
            for (const key in basicInfo) {
                const perm = mergedFieldPerms[key];
                
                //  核心修改點：根據 isNewUser 執行不同的權限判斷
                const canWrite = 
                    (isNewUser && (perm === 'RU' || perm === 'C')) || // 新建模式: RU 或 C 都可以寫
                    (!isNewUser && perm === 'RU');                     // 編輯模式: 只有 RU 可以寫

                if (canWrite) {
                    allowedBasicInfo[key] = basicInfo[key];
                }
            }
            // 確保 phone 和 name 總是存在，因為它們是基礎欄位
            allowedBasicInfo.phone = basicInfo.phone; 
            allowedBasicInfo.name = basicInfo.name;
            finalBasicInfo = allowedBasicInfo;
        }

        const batch = writeBatch(db);
        const userDocRef = doc(db, "users", targetUserKey);
        
        const infoToSave = {
            ...finalBasicInfo,
            lastModifiedBy: adminName,
            lastModifiedByPhone: adminKey
        };
        
        // 密碼處理邏輯維持不變：只有在有內容時才寫入
        if (!infoToSave.password) {
            delete infoToSave.password;
        }

        batch.set(userDocRef, infoToSave, { merge: true });

        // 系統權限的儲存邏輯維持不變
        if (adminRoles.includes('超級管理員') || (mergedFieldPerms && mergedFieldPerms['permissions'] === 'RU')) {
            const permissionDocRef = doc(db, "userPermissions", targetUserKey);
            batch.set(permissionDocRef, {
                userName: basicInfo.name,
                permissions: permissions,
                lastModifiedBy: adminName,
                lastModifiedAt: serverTimestamp()
            }, { merge: true });
        }

        await batch.commit();
        return { status: 'success' };
    } catch (e) {
        console.error("更新 Firestore 資料失敗: ", e);
        return { status: 'error', message: e.message };
    }
}

/**
 * [新] 呼叫後端，儲存使用者的個人化偏好設定
 * @param {string} userKey - 使用者手機
 * @param {object} preferences - 要儲存的偏好設定物件
 * @returns {Promise<object>}
 */
export async function saveUserPreferencesToBackend(userKey, preferences) {
  try {
    const savePrefs = httpsCallable(functions, 'updateUserPreferences');
    const result = await savePrefs({ userKey, preferences });
    return result.data;
  } catch (error) {
    console.error("API saveUserPreferencesToBackend 錯誤:", error);
    return { status: 'error', message: `儲存設定到後端時發生錯誤: ${error.message}` };
  }
}

// ===============================================
// /  訂閱管理系統 API
// ===============================================

/**
 *  [已修正] 檢查指定用戶是否為超級管理員 (依角色判斷)
 */
async function isSuperAdmin(userKey) {
    if (!userKey) return false;
    try {
        const userDocRef = doc(db, "users", userKey);
        const userDocSnap = await getDoc(userDocRef);

        if (!userDocSnap.exists()) {
            return false;
        }
        const userData = userDocSnap.data();
        const roles = userData.roles || [];
        return Array.isArray(roles) && roles.includes("超級管理員");
    } catch (error) {
        console.error(`檢查使用者 ${userKey} 超級管理員權限時出錯:`, error);
        return false;
    }
}

/**
 *  [已修正] 獲取擁有特定系統權限的所有使用者
 */
export async function getUsersWithSystemPermission(systemName) {
    const permissionsSnapshot = await getDocs(collection(db, "userPermissions"));
    const users = [];
    permissionsSnapshot.forEach(doc => {
        const perms = doc.data().permissions || {};
        for (const projectId in perms) {
            const project = perms[projectId];
            if (project && Array.isArray(project.systems) && project.systems.includes(systemName)) {
                users.push({
                    phone: doc.id,
                    name: doc.data().userName || 'N/A',
                    projectName: project.projectName
                });
            }
        }
    });
    return users;
}

/**
 *  [已修正] 獲取所有建案的訂閱狀況
 */
export async function fetchUsersForSubscriptionManagement() {
    const projectsSnapshot = await getDocs(collection(db, "projects"));
    const projects = projectsSnapshot.docs.map(doc => ({ id: doc.id, name: doc.data().name }));

    const permissionsSnapshot = await getDocs(collection(db, "userPermissions"));
    const permissionsByUser = new Map();
    permissionsSnapshot.forEach(doc => {
        permissionsByUser.set(doc.id, doc.data().permissions || {});
    });

    const result = [];
    permissionsByUser.forEach((perms, userPhone) => {
        for (const projectId in perms) {
            const project = perms[projectId];
            if (project && project.projectName) {
                 result.push({
                    userPhone: userPhone,
                    projectName: project.projectName,
                    systems: project.systems || []
                });
            }
        }
    });
    return result;
}

/**
 *  [已修正] 獲取所有存在於系統中的系統功能名稱
 */
export async function getAllSystemFunctions() {
    const permissionsSnapshot = await getDocs(collection(db, "userPermissions"));
    const systemFunctions = new Set();
    permissionsSnapshot.forEach(doc => {
        const perms = doc.data().permissions || {};
        for (const projectId in perms) {
            if (perms[projectId] && Array.isArray(perms[projectId].systems)) {
                perms[projectId].systems.forEach(system => systemFunctions.add(system));
            }
        }
    });
    return Array.from(systemFunctions).sort();
}

/**
 * [Firestore 版] 獲取所有訂閱紀錄
 * @param {string} adminKey - 超級管理員的手機號碼
 */
export async function fetchAllSubscriptions(adminKey) {
    if (!await isSuperAdmin(adminKey)) {
        throw new Error("權限不足。");
    }
    const subscriptionsRef = collection(db, "subscriptions");
    const snapshot = await getDocs(subscriptionsRef);
    const subscriptions = [];
    
    //  【核心修改點】強制使用台灣時區來定義「今天」
    const taiwanDateString = new Date().toLocaleDateString('sv-SE', { timeZone: 'Asia/Taipei' });
    const today = new Date(taiwanDateString);

    snapshot.forEach(doc => {
        const record = { id: doc.id, ...doc.data() };
        
        const startDateValue = record.startDate?.toDate();
        const endDateValue = record.endDate?.toDate();
        
        // 這裡的 startDateValue 本身就是一個帶有時區資訊的物件，
        // 與我們新定義的 today 比較時，會得到正確的結果。
        // 因此下方原有的 normalizedStartDate 邏輯可以簡化或維持不變。
        
        let status = '狀態不明';
        let color = 'grey';
        
        if (startDateValue && endDateValue) {
            if (today < startDateValue) {
                status = '尚未啟用';
                color = 'blue-grey';
            } else if (today > endDateValue) {
                status = '已到期';
                color = 'red';
            } else {
                const diffTime = endDateValue.getTime() - today.getTime();
                //  天數計算改為四捨五入，避免日光節約時間問題
                const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
                if (diffDays <= 14) {
                    //  顯示剩餘天數，至少為 0 天
                    status = `即將到期 (${Math.max(0, diffDays)}天)`;
                    color = 'orange';
                } else {
                    status = '啟用中';
                    color = 'green';
                }
            }
        } else {
            status = '日期不完整';
            color = 'orange';
        }
        
        record.status = status;
        record.color = color;
        
        record.paymentDate = record.paymentDate?.toDate().toISOString().split('T')[0];
        record.startDate = startDateValue?.toISOString().split('T')[0];
        record.endDate = endDateValue?.toISOString().split('T')[0];

        subscriptions.push(record);
    });
    return subscriptions;
}

/**
 * [Firestore 版] 獲取用於訂閱表單的下拉選單資料 (建案、系統列表)
 * @param {string} adminKey - 超級管理員的手機號碼
 */
export async function fetchMasterDataForSubscriptionForm(adminKey) {
  if (!await isSuperAdmin(adminKey)) {
    throw new Error("權限不足。");
  }
  // 從 projects 集合中動態獲取所有建案的完整資料 (ID + name + iconUrl)
  const projectsRef = collection(db, "projects");
  const snapshot = await getDocs(projectsRef);

  const projects = [];
  snapshot.forEach(doc => {
    const data = doc.data(); // 先取得資料
    projects.push({ 
      id: doc.id, 
      ...data, // 展開所有既有資料
      iconUrl: data.iconUrl || '' // 確保 iconUrl 欄位存在，若無則給予空字串
    });
  });
  
  const systemFunctions = ['驗屋系統', '銷控系統', '預約驗屋系統', '客資系統']; // (此處可保持不變)

  // 回傳完整的 projects 陣列
  return { 
    projects: projects.sort((a, b) => (a.name || '').localeCompare(b.name || '', 'zh-Hant')), 
    systemFunctions: systemFunctions 
  };
}
/**
 * [Firestore 版] 新增一筆訂閱紀錄
 * @param {string} subscriptionId - 新紀錄的 ID
 * @param {object} subscriptionData - 要新增的訂閱資料
 * @param {string} adminKey - 超級管理員的手機號
 */
export async function addSubscription(subscriptionId, subscriptionData, adminKey) {
    if (!await isSuperAdmin(adminKey)) {
        throw new Error("權限不足。");
    }
    
    //  新增邏輯：如果提供了 projectId 和 projectName，則在 projects 集合中建立或更新對應文件
    if (subscriptionData.projectId && subscriptionData.projectName) {
        const projectDocRef = doc(db, "projects", subscriptionData.projectId);
        // 使用 setDoc + merge:true 可以同時處理新增和更新，確保資料存在
        await setDoc(projectDocRef, { name: subscriptionData.projectName }, { merge: true });
    }

    const dataToSave = { ...subscriptionData };
    delete dataToSave.id; 

    ['paymentDate', 'startDate', 'endDate'].forEach(field => {
        if (dataToSave[field]) {
            dataToSave[field] = Timestamp.fromDate(new Date(dataToSave[field]));
        } else {
            dataToSave[field] = null;
        }
    });

    const docRef = doc(db, "subscriptions", subscriptionId);
    await setDoc(docRef, dataToSave);
    return { status: 'success' };
}


/**
 * [Firestore 版] 更新一筆訂閱紀錄
 * @param {string} subscriptionId - 要更新的紀錄 ID
 * @param {object} subscriptionData - 要更新的訂閱資料
 * @param {string} adminKey - 超級管理員的手機號碼
 */
export async function updateSubscription(subscriptionId, subscriptionData, adminKey) {
    if (!await isSuperAdmin(adminKey)) {
        throw new Error("權限不足。");
    }

    //  新增邏輯：更新時也同步更新 projects 集合中的建案名稱，確保一致性
    if (subscriptionData.projectId && subscriptionData.projectName) {
        const projectDocRef = doc(db, "projects", subscriptionData.projectId);
        await setDoc(projectDocRef, { name: subscriptionData.projectName }, { merge: true });
    }

    const dataToUpdate = { ...subscriptionData };
    delete dataToUpdate.id;

    ['paymentDate', 'startDate', 'endDate'].forEach(field => {
        if (dataToUpdate[field]) {
            dataToUpdate[field] = Timestamp.fromDate(new Date(dataToUpdate[field]));
        } else {
            dataToUpdate[field] = null;
        }
    });
    
    const docRef = doc(db, "subscriptions", subscriptionId);
    await updateDoc(docRef, dataToUpdate);
    return { status: 'success' };
}

/**
 * [Firestore 版] 刪除一筆訂閱紀錄
 * @param {string} subscriptionId - 要刪除的紀錄 ID (SubscriptionID)
 * @param {string} adminKey - 超級管理員的手機號碼
 */
export async function deleteSubscription(subscriptionId, adminKey) {
    if (!await isSuperAdmin(adminKey)) {
        throw new Error("權限不足。");
    }
    const docRef = doc(db, "subscriptions", subscriptionId);
    await deleteDoc(docRef);
    return { status: 'success' };
}

/**
 *  [已修正] 獲取當前用戶可查看的訂閱狀態
 * @param {string} userKey - 當前登入用戶的手機號碼
 */
export async function fetchMySubscriptionStatus(userKey) {
    // 1. 從新的 userPermissions 集合中讀取使用者的單一權限文件
    const permissionDocRef = doc(db, "userPermissions", userKey);
    const docSnap = await getDoc(permissionDocRef);

    if (!docSnap.exists()) {
        return {}; // 如果沒有權限文件，直接回傳空物件
    }

    // 2. 從權限文件中解析出使用者有權限的所有建案名稱
    const perms = docSnap.data().permissions || {};
    const accessibleProjects = Object.values(perms).map(p => p.projectName);

    if (accessibleProjects.length === 0) {
        return {};
    }

    // 3. 根據有權限的建案列表，去 subscriptions 集合中查找對應的訂閱紀錄
    const subsRef = collection(db, "subscriptions");
    const subsQuery = query(subsRef, where("projectName", "in", accessibleProjects));
    const subsSnapshot = await getDocs(subsQuery);

    const subscriptionsByProject = {};

    // 4. (維持不變) 處理訂閱狀態與日期格式
    const taiwanDateString = new Date().toLocaleDateString('sv-SE', { timeZone: 'Asia/Taipei' });
    const today = new Date(taiwanDateString);

    subsSnapshot.forEach(doc => {
        const sub = doc.data();
        if (!subscriptionsByProject[sub.projectName]) {
            subscriptionsByProject[sub.projectName] = [];
        }

        const startDate = sub.startDate?.toDate();
        const endDate = sub.endDate?.toDate();
        let status = '日期不完整';
        let color = 'orange';

        if (startDate && endDate) {
            if (today < startDate) {
                status = '尚未啟用';
                color = 'blue-grey';
            } else if (today > endDate) {
                status = '已到期';
                color = 'red';
            } else {
                status = '啟用中';
                color = 'green';
            }
        }

        subscriptionsByProject[sub.projectName].push({
            system: sub.systemFunction,
            status: status,
            color: color,
            validityPeriod: `${startDate ? startDate.toISOString().split('T')[0] : 'N/A'} ~ ${endDate ? endDate.toISOString().split('T')[0] : 'N/A'}`,
            contact: sub.contactName || '-',
            contactPhone: sub.contactPhone || '-'
        });
    });

    return subscriptionsByProject;
}

/**
 * ===============================================
 * /  車位銷控管理 API
 * ===============================================
 */

/**
 * ✓ 【新增】即時監聽指定建案的所有車位資料
 * @param {string} projectId - 專案 ID
 * @param {function} onDataChange - 收到資料時的回呼函式
 * @returns {function} - 用於停止監聽的 unsubscribe 函式
 */
export const listenToParkingLots = (projectId, onDataChange, onError) => {
  const q = query(
    collection(db, "salesParkings"), 
    where("projectId", "==", projectId),
    orderBy("spotId", "asc") // 依照車位編號排序
  );

  const unsubscribe = onSnapshot(q, (querySnapshot) => {
    const parkingLots = [];
    querySnapshot.forEach((doc) => {
      // 將 Firestore 文件 ID 也一併傳給前端，方便更新
      parkingLots.push({ docId: doc.id, ...doc.data() });
    });
    onDataChange(parkingLots);
  }, (error) => {
    console.error(`監聽專案 ${projectId} 的車位資料時發生錯誤:`, error);
    if (onError) {
      onError(error);
    }
  });

  return unsubscribe;
};

/**
 * ✓ 【新增】更新單筆車位的銷控資料
 * @param {string} docId - salesParkings 集合中的文件 ID
 * @param {object} dataToUpdate - 要更新的資料物件
 * @returns {Promise<void>}
 */
export const updateParkingLot = async (docId, dataToUpdate) => {
  if (!docId) throw new Error("缺少車位文件 ID。");
  
  const docRef = doc(db, "salesParkings", docId);
  await updateDoc(docRef, dataToUpdate);
};

/**
 * 獲取指定建案所有的「車位」詳細資料，用於銷控管理表格。
 * @param {string} projectName 建案名稱
 * @returns {Promise<object>} API 響應
 */
export async function fetchParkingLotDetails(projectName) {
  //console.log(`[api.js] fetchParkingLotDetails called with projectName: ${projectName}`);
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
  //console.log('[api.js] updateParkingLotDetails called with payload:', payload);
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
 * /   新增：銷控資料更新 API
 * ===============================================
 */

/**
 * 請求後端產生並下載指定的 Excel 工作表
 * @param {string} projectName 建案名稱
 * @param {Array<string>} sheetNames 要下載的工作表名稱陣列
 * @returns {Promise<object>} API 響應
 */
export async function downloadSheetsAsExcel(projectName, sheetNames) {
  //console.log(`[api.js] downloadSheetsAsExcel called for project: ${projectName}, sheets: ${sheetNames}`);
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
    //console.log(`[api.js] uploadExcelToOverwrite called for project: ${projectName}`);
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
 *  新版：上傳檔案到後端暫存區 (給「更新銷控」功能專用)
 * @param {string} filename 檔名
 * @param {string} base64 Base64 編碼的檔案內容
 * @returns {Promise<object>} API 響應，包含 fileId
 */
export async function uploadFile(filename, base64) {
    //console.log(`[api.js] uploadFile (for overwrite) called with filename: ${filename}`);
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
    //console.log(`[api.js] backupSpreadsheet called for project: ${projectName}`);
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
//  驗屋預約系統 API (Firestore 遷移版)
// =============================================

/**
 * [新] 從後端獲取指定建案的預約紀錄有效日期範圍
 * (V2: 呼叫 inspectionCalendarApi 路由)
 * @param {string} projectId 
 * @returns {Promise<{minDate: string, maxDate: string}>}
 */
export async function fetchAppointmentDateRange(projectId) {
  try {
    // 修改：呼叫 inspectionCalendarApiRouter
    const result = await inspectionCalendarApiRouter({
        action: 'getAppointmentDateRange',
        data: { projectId }
    });
    
    if (result.data.status === 'success') {
      return result.data.data;
    }
    throw new Error(result.data.message || '無法獲取日期範圍');
  } catch (error) {
    console.error("API fetchAppointmentDateRange 錯誤:", error);
    const currentYear = new Date().getFullYear();
    return {
      minDate: `${currentYear}-01-01`,
      maxDate: `${currentYear}-12-31`,
    };
  }
}

/**
 *  [已修正] 獲取使用者有權限查看驗屋預約管理的建案列表
 */
export async function getProjectsForInspectionCalendar(userKey) {
    const permissionDocRef = doc(db, "userPermissions", userKey);
    const docSnap = await getDoc(permissionDocRef);
    if (!docSnap.exists()) return [];

    const perms = docSnap.data().permissions || {};
    const projectOptions = [];

    for (const projectId in perms) {
        const project = perms[projectId];
        if (project.systems.includes('驗屋預約管理-修改') || project.systems.includes('驗屋預約管理-檢視')) {
            projectOptions.push({ text: project.projectName, value: projectId });
        }
    }
    return projectOptions;
}


/**
 * [Firestore 版] 根據日期範圍獲取指定建案的預約紀錄與戶別資料
 * (V6: 修正 toClientTimestamp 以正確處理 _seconds)
 * @param {string} projectId 
 * @param {Date} startDate - JS Date 物件
 * @param {Date} endDate - JS Date 物件
 * @returns {Promise<Array>}
 */
export async function fetchCalendarData(projectId, startDate, endDate) {
    // 1. 日期驗證 (保持不變)
    if (!(startDate instanceof Date) || isNaN(startDate.getTime())) {
        console.error('🔴 [API] 偵測到無效的 startDate!', startDate);
        throw new Error('API 接收到無效的開始日期');
    }
    if (!(endDate instanceof Date) || isNaN(endDate.getTime())) {
        console.error('🔴 [API] 偵測到無效的 endDate!', endDate);
        throw new Error('API 接收到無效的結束日期');
    }

    try {
        // 2. 呼叫後端路由 (保持不變)
        const result = await inspectionCalendarApiRouter({
            action: 'fetchCalendarData',
            data: {
                projectId,
                startDate: startDate.toISOString(), // 傳送 ISO 字串給後端
                endDate: endDate.toISOString()
            }
        });
        
        // 3. 【關鍵修正 V2】
        // Cloud Function 回傳的是序列化的普通物件 (e.g., {_seconds: ..., _nanoseconds: ...})
        // Vue 元件期望的是 Client SDK 的 Timestamp 物件 (有 .toDate() 方法)。
        
        /**
         * 輔助函數：安全地將 "序列化的 Timestamp 物件" 轉為 "Client SDK Timestamp 物件"
         * @param {object | string | null} serverTimestamp - 後端回傳的序列化物件
         */
        const toClientTimestamp = (serverTimestamp) => {
            // 1. 檢查是否為 null 或 undefined
            if (!serverTimestamp) return null;
            
            // 2. 【關鍵修正】檢查帶有底線的 _seconds 和 _nanoseconds
            if (typeof serverTimestamp === 'object' && serverTimestamp !== null && 
                typeof serverTimestamp._seconds === 'number' && typeof serverTimestamp._nanoseconds === 'number') {
                
                // 3. 【關鍵修正】使用帶底線的屬性來建立新的 Timestamp
                return new Timestamp(serverTimestamp._seconds, serverTimestamp._nanoseconds);
            }
            
            // 4. (備用) 如果它已經是 Timestamp 物件 (例如在重整時)，直接回傳
            if (typeof serverTimestamp.toDate === 'function') {
                return serverTimestamp;
            }
            
            // 5. (備用) 處理 ISO 字串 (以防萬一)
            if (typeof serverTimestamp === 'string') {
                const date = new Date(serverTimestamp);
                if (!isNaN(date.getTime())) {
                    return Timestamp.fromDate(date);
                }
            }

            // 6. 如果都不是，回傳 null
            console.warn('[API] toClientTimestamp: 收到未知的時間格式:', serverTimestamp);
            return null;
        };

        // 4. 重新加入 .map() 轉換邏輯
        return result.data.map(appt => {
            // 對所有可能的日期/時間戳記欄位執行安全轉換
            const convertedAppt = { ...appt };
            const dateFields = [
                'appointmentDate', 'createdAt', 'updatedAt', 'cancelledAt',
                'appropriationDate', 'handoverTime', 'uploadReportTime',
                'initialInspectionDate', 'reInspectionDate'
            ];
            
            for (const field of dateFields) {
                convertedAppt[field] = toClientTimestamp(appt[field]);
            }
            
            return convertedAppt;
        });

    } catch (e) {
        // 5. 錯誤處理 (保持不變)
        console.error(`[API] fetchCalendarData 呼叫路由時發生錯誤:`, e);
        throw new Error(e.message || '獲取行事曆資料失敗');
    }
}

/**
 * [Firestore 版] 獲取新增/編輯預約時所需的下拉選單等選項
 * @param {string} projectId 
 * @returns {Promise<object>}
 */
export async function fetchBookingOptions(projectId) {
    try {
        // ✓ START: 修改此處，從資料庫讀取專案設定
        const projectSettings = await getProjectSettings(projectId);

        // 從專案設定中獲取選擇方式和人員，如果不存在則提供預設空陣列
        const inspectionMethods = projectSettings?.bookingMethodOptions || ['自驗', '代驗公司'];
        const inspectionStaff = projectSettings?.inspectionStaff || []; // ✓ 從這裡動態讀取驗屋人員
        // ✓ END: 修改結束

        // 獲取棟別與戶別資料 (此部分邏輯不變)
        const householdsRef = collection(db, "households");
        const q = query(householdsRef, where("projectId", "==", projectId));
        const snapshot = await getDocs(q);
        const buildingsAndUnits = {};
        snapshot.forEach(doc => {
            const data = doc.data();
            if (data.building && data.unitId) {
                if (!buildingsAndUnits[data.building]) {
                    buildingsAndUnits[data.building] = [];
                }
                buildingsAndUnits[data.building].push(data.unitId);
            }
        });

        return { inspectionMethods, inspectionStaff, buildingsAndUnits };

    } catch (error) {
        console.error(`獲取預約選項時發生錯誤 (Project ID: ${projectId}):`, error);
        // 發生錯誤時回傳預設值，避免頁面崩潰
        return { 
            inspectionMethods: ['自驗', '代驗公司'], 
            inspectionStaff: [], 
            buildingsAndUnits: {} 
        };
    }
}

/**
 * [Firestore 版] 新增一筆預約紀錄
 * (V2: 呼叫 adminBookingApi 路由)
 * @param {object} payload - 包含 { projectId, newBookingData, ... }
 */
export async function addAppointmentAdmin(payload) {
    try {
        // 修改：呼叫 adminBookingApiRouter
        const result = await adminBookingApiRouter({
            action: 'addAppointmentAdmin',
            data: payload
        });
        // 修改：後端路由會直接回傳 { status, data: { bookingCode } }
        return result.data; 
    } catch (error) {
        console.error("呼叫 addAppointmentByAdmin 雲端函式時發生錯誤:", error);
        // 修改：保持拋出錯誤，讓前端 UI 可以捕捉
        throw new Error(error.message);
    }
}

/**
 * [Firebase 版] 更新預約紀錄 (透過 Cloud Function 處理)
 * (V2: 呼叫 inspectionCalendarApi 路由)
 */
export async function updateAppointment(appointmentId, bookingUpdatePayload, householdDocId, householdUpdatePayload, force = false) { 
  try {
    // 修改：呼叫 inspectionCalendarApiRouter
    const result = await inspectionCalendarApiRouter({
        action: 'updateAppointment',
        data: {
          appointmentId,
          bookingPayload: bookingUpdatePayload,
          householdDocId,
          householdPayload: householdUpdatePayload,
          force: force 
        }
    });
    return result.data; 
  } catch (error) {
    console.error("API updateAppointment 錯誤:", error);
    throw new Error(error.message);
  }
}


/**
 * ✓ [Firebase 版] 取消一筆預約 (呼叫 Cloud Function)
 * (V2: 呼叫 inspectionCalendarApi 路由)
 */
export async function cancelAppointment(appointmentId, projectId, unitId, bookingType) {
  if (!appointmentId || !projectId || !unitId || !bookingType) {
    return { status: 'error', message: '前端錯誤：缺少取消預約所需的參數。' };
  }
  
  try {
    // 修改：呼叫 inspectionCalendarApiRouter
    const result = await inspectionCalendarApiRouter({
        action: 'cancelAppointment',
        data: {
          appointmentId,
          projectId,
          unitId,
          bookingType
        }
    });
    return result.data;
  } catch (error) {
    console.error("API cancelAppointment 錯誤:", error);
    return { status: 'error', message: error.message };
  }
}

/**
 * [Firebase 版] 取消一筆預約 (V2: 呼叫 bookingApi 路由)
 * @param {object} payload - 包含 projectId 和 bookingCode 的物件
 * @returns {Promise<object>}
 */
export const cancelBooking = async (payload) => {
  if (!payload.projectId || !payload.bookingCode) {
    return { status: 'error', message: '前端錯誤：缺少 projectId 或 bookingCode。' };
  }
  try {
    // 修改：呼叫 bookingApiRouter，傳入 action 和 data
    const result = await bookingApiRouter({
        action: 'cancelBooking',
        data: payload
    });
    // 修改：後端路由會直接回傳 { status, message }，因此 result.data 就是該物件
    return result.data; 
  } catch (error) {
    console.error("API cancelBooking 錯誤:", error);
    return { status: 'error', message: error.message };
  }
};

// =============================================
//  公開預約系統 API (Firebase 遷移版)
// =============================================

//  [新增] 獲取預約頁面初始化所需的資料 (V2: 呼叫 bookingApi 路由)
export async function getBookingInitialData(projectName, projectId) {
  try {
    // 修改：呼叫 bookingApiRouter
    const result = await bookingApiRouter({
        action: 'getBookingInitialData',
        data: { projectId, projectName } // 保持傳遞，即使後端可能不用 projectName
    });
    // 修改：後端路由會回傳 { buildings, ... }，我們保持原有的包裝
    return { status: 'success', data: result.data };
  } catch (error) {
    console.error("API getBookingInitialData 錯誤:", error);
    return { status: 'error', message: error.message };
  }
}

/**
 * [Firestore 版] 更新指定建案的公開預約頁面設定
 * @param {string} projectId - 要更新的建案 ID
 * @param {object} settingsData - 包含要更新設定的物件
 * @returns {Promise<object>} - 返回操作結果
 */
export async function updateProjectSettings(projectId, settingsData) {
    if (!projectId || !settingsData) {
        return { status: 'error', message: '缺少 projectId 或設定資料。' };
    }
    try {
        const projectDocRef = doc(db, "projects", projectId);
        await updateDoc(projectDocRef, settingsData);
        return { status: 'success' };
    } catch (e) {
        console.error('更新專案設定時發生錯誤:', e);
        return { status: 'error', message: e.message };
    }
}

/**
 * [新增] 從 Firestore 獲取建案的公開設定 (V2: 呼叫 bookingApi 路由)
 * @param {string} projectId 建案 ID
 */
export async function fetchProjectConfig(projectId) {
  try {
    // 修改：呼叫 bookingApiRouter
    const result = await bookingApiRouter({
        action: 'getProjectConfig',
        data: { projectId }
    });
    return result.data;
  } catch (error) {
    console.error("API fetchProjectConfig 錯誤:", error);
    return null; 
  }
}


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
 * 檢查是否已有有效預約 (V2: 呼叫 bookingApi 路由)
 */
export async function checkExistingBooking(projectId, unitId, bookingType) {
 try {
  // 修改：呼叫 bookingApiRouter
  const result = await bookingApiRouter({
      action: 'checkExistingBooking',
      data: { projectId, unitId, bookingType }
  });
  // 修改：後端路由會直接回傳 { status, data: { status } }，這符合原函式 return result.data 的預期
  return result.data;
 } catch (error) {
  console.error("API checkExistingBooking 錯誤:", error);
  return { status: 'error', message: error.message };
 }
}

/**
 * 獲取可預約的日期和時段 (V2: 呼叫 bookingApi 路由)
 */
export const getBookingSlots = async (projectName, unitId, bookingType, bookingMethod, projectId) => {
  try {
    // 修改：呼叫 bookingApiRouter
    const result = await bookingApiRouter({
        action: 'getAvailableSlots',
        data: { projectId, unitId, bookingType, bookingMethod, projectName }
    });
    // 修改：後端路由會直接回傳 { startDate, ... }，我們保持原有的包裝
    return {
      status: 'success',
      data: result.data
    };
  } catch (error) {
    console.error("API getBookingSlots 錯誤:", error);
    return {
      status: 'error',
      message: error.message || '獲取可預約時段時發生錯誤'
    };
  }
};

/**
 *  [Firebase 版] 獲取指定建案的所有預約批次規則
 * @param {string} projectId - 建案的 ID
 * @returns {Promise<object>} - 返回包含批次規則的物件
 */
export async function getAllBookingRules(projectId) {
    if (!projectId) {
        console.error("[api.js] getAllBookingRules: 缺少 projectId。");
        return { status: 'error', message: '缺少 projectId' };
    }

    try {
        // 直接查詢 bookingBatches 集合，找出屬於該建案的所有批次
        const batchesRef = collection(db, "bookingBatches");
        const q = query(batchesRef, where("projectId", "==", projectId));
        const querySnapshot = await getDocs(q);

        const batchRules = {};
        querySnapshot.forEach((doc) => {
            // 將每筆批次資料以其文件 ID 為 key 存入物件
            // 這正是前端 watch 函式所期望的資料結構
            batchRules[doc.id] = { id: doc.id, ...doc.data() };
        });

        // 模仿舊版 API 的回傳格式，確保前端相容性
        return { 
            status: 'success', 
            data: { 
                batchRules: batchRules 
            } 
        };

    } catch (e) {
        console.error(`獲取建案 ${projectId} 的預約批次規則時發生錯誤:`, e);
        return { status: 'error', message: e.message, data: { batchRules: {} } };
    }
}


/**
 * 儲存預約資料 (Firebase 版) (V2: 呼叫 bookingApi 路由)
 * @param {object} payload - 包含 projectId 和 bookingData 的物件
 */
export const saveBooking = async (payload) => {
  try {
    // 修改：呼叫 bookingApiRouter
    const result = await bookingApiRouter({
        action: 'saveBooking',
        data: payload // 整個 payload { projectId, bookingData } 作為 data 傳遞
    });
    // 修改：後端路由會回傳 { status, data: { bookingCode } }
    // 我們將其包裝成前端期望的 { status, ...result.data }
    return { status: 'success', ...result.data };
  } catch (error) {
    console.error("API saveBooking 錯誤:", error);
    return { status: 'error', message: error.message };
  }
};

/**
 * [API] 呼叫後端，為預約確認步驟產生一個有時效性的 Token (V2: 呼叫 bookingApi 路由)
 * @param {object} payload - 包含 { projectId, unitId, bookingType }
 */
export const initiateBookingConfirmation = async (payload) => {
  const functionName = 'initiateBookingConfirmation';
  try {
    // 修改：呼叫 bookingApiRouter
    const result = await bookingApiRouter({
        action: functionName, // 使用函式名稱作為 action
        data: payload
    });
    // 修改：後端路由會直接回傳 { status, token }
    return result.data;
  } catch (error) {
    console.error(`API Error in ${functionName}:`, error);
    const message = (error.code) ? error.message : `呼叫後端 ${functionName} 時發生錯誤: ${error.message || error}`;
    return { status: "error", message: message };
  }
};



/**
 * [修改] 一次性獲取所有可預約的戶別資料 (V2: 呼叫 bookingApi 路由)
 */
export const fetchAllUnitsForBooking = async (projectName, projectId) => {
  try {
    // 修改：呼叫 bookingApiRouter
    const result = await bookingApiRouter({
        action: 'getAllUnitsForBooking',
        data: { projectId: projectId, projectName: projectName }
    });
    // 修改：後端路由會直接回傳 allUnitsByBuilding 物件，我們保持原有的包裝
    return { status: 'success', data: result.data };
  } catch (error) {
    console.error("API fetchAllUnitsForBooking 錯誤:", error);
    return { status: 'error', message: error.message, data: {} };
  }
};


/**
 * [修改] 驗證身分證與戶別是否相符 (V2: 呼叫 bookingApi 路由)
 */
export const validateId = async (projectName, unitId, idNumber, projectId) => {
  try {
    // 修改：呼叫 bookingApiRouter
    await bookingApiRouter({
        action: 'validateId',
        data: { projectId, unitId, idNumber, projectName }
    });
    // 修改：保持原有的成功回傳 (因為後端成功時不回傳 data)
    return { status: 'success' };
  } catch (error) {
    console.error("API validateId 錯誤:", error);
    return { status: 'error', message: error.message };
  }
};



/**
 * 上傳驗屋授權書 (Firebase Function 版) (V2: 呼叫 bookingApi 路由)
 */
export const uploadAuthLetter = async (base64Data, fileName, projectId, unitId) => {
  const pureBase64 = base64Data.split(',')[1];
  try {
    // 修改：呼叫 bookingApiRouter
    const result = await bookingApiRouter({
      action: 'uploadAuthLetter',
      data: {
        projectId: projectId, 
        unitId: unitId,
        fileName: fileName,
        base64: pureBase64
      }
    });
    // 修改：後端路由會直接回傳 { status, url, ... }
    return result.data;
  } catch (error) {
    console.error("呼叫 uploadAuthLetter 雲端函式時發生錯誤:", error);
    return { status: 'error', message: error.message };
  }
};





/**
 * ===============================================
 * /    AI 代理後端
 * ===============================================
 */


/**
 * 呼叫 AI 代理後端，發送聊天訊息。
 * @param {object} payload - 包含 { prompt, history, projectData } 的物件。
 * @returns {Promise<object>} - AI 的回應。
 */
export async function postToAiAssistant(payload) {
  // 【重要】這就是我們之前部署的 Cloud Function URL
  const API_URL = 'https://us-central1-thematic-runner-447203-n2.cloudfunctions.net/aiProxy/chat';

  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // TODO: 未來在這裡加入 Authorization token 進行安全性驗證
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      // 嘗試解析後端回傳的錯誤訊息
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `AI 服務錯誤: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('與 AI 助理通訊失敗:', error);
    // 將更詳細的錯誤訊息回傳給前端
    return { error: error.message || '無法連接至 AI 助理，請稍後再試。' };
  }
}


/**
 * ===============================================
 * /   新增：驗屋報告上傳 API
 * ===============================================
 */



//    現在它會接收完整的 formDATA payload，並將其傳給後端
async function getSignedUrlForReportUpload(payload, fileInfo) {
  try {
    const functions = getFunctions();
    // ✓ 將函式名稱改為新的、能處理 metadata 的函式
    const getUrlFunction = httpsCallable(functions, 'generateSignedUrlWithMetadata');
    const result = await getUrlFunction({
      ...payload,     // 包含 projectId, unit, buyerName, email 等...
      ...fileInfo,    // 包含 fileName, contentType
    });
    return result.data.signedUrl;
  } catch (error) {
    console.error("獲取上傳 URL 失敗:", error);
    throw new Error(`無法取得上傳授權: ${error.message}`);
  }
}

/**
 * 將 File 物件轉換為 Base64 字串
 * @param {File} file - 原始 File 物件
 * @returns {Promise<string>} - 只包含 Base64 內容的字串
 */
function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      // 結果格式為 "data:application/pdf;base64,JVBERi0xLjQKJ..."
      // 我們只需要逗號後面的部分
        let encoded = reader.result.toString().replace(/^data:(.*,)?/, '');
      if ((encoded.length % 4) > 0) {
        encoded += '='.repeat(4 - (encoded.length % 4));
      }
      resolve(encoded);
    };
    reader.onerror = error => reject(error);
  });
}





/**
 * [代理模式] 將驗屋報告透過 Cloud Function 直接上傳到 Google Drive (V2: 呼叫 bookingApi 路由)
 */
export async function uploadReportDirectlyToDrive(payload, fileObject) {
  try {
    // 1. 【新增】前端直接上傳到 Firebase Storage (暫存區)
    // 這樣就不會經過 Cloud Function 的 Payload 限制，速度快且穩定
    const timestamp = Date.now();
    // 設定暫存路徑，建議包含專案ID以方便管理
    const storagePath = `temp_reports/${payload.projectId}/${timestamp}_${fileObject.name}`;
    const storageRef = ref(storage, storagePath);
    
    // 執行上傳 (Firebase SDK 會自動處理大檔案分片上傳)
    const snapshot = await uploadBytes(storageRef, fileObject);
    
    // 2. 取得檔案的公開下載連結
    const downloadURL = await getDownloadURL(snapshot.ref);

    // 3. 準備 Payload 傳給後端
    // 注意：我們改傳 fileUrl，移除會導致崩潰的 fileContent (Base64)
    const functionPayload = {
      ...payload,
      fileName: fileObject.name,
      fileUrl: downloadURL,     // ✅ 關鍵修改：傳送網址，而非檔案內容
      contentType: fileObject.type,
      // fileContent: base64Content, // ❌ 已移除
    };
    
    // 4. 呼叫後端處理 (後端會用 fetch(fileUrl) 讀取並轉存 Drive)
    const result = await bookingApiRouter({
        action: 'handleDirectReportUpload',
        data: functionPayload
    });

    // 修改：後端路由會直接回傳 { status, message }
    return result.data;

  } catch (error) {
    console.error("代理上傳報告失敗:", error);
    return { status: "error", message: `上傳失敗: ${error.message}` };
  }
}



// ===============================================
// /   預約批次規則管理 API (混合模式新版)
// ===============================================

/**
 * ❗注意：以下函式是基於「共享/獨立」混合模式的新資料庫結構。
 * 新結構包含：
 * 1. `bookingBatches`: 批次主資料 (與舊版類似，但不含規則)。
 * 2. `dateRules`: 頂層集合，存放所有每日規則。規則分為 isShared:true (共享) 和 isShared:false (獨立)。
 * 3. `batchRuleLinks`: 頂層集合，用來建立「批次」與「每日規則」的多對多關聯。
 */

/**
 * [V3 - 冷刪除版] 檢查日期是否存在 *有效* 的「基礎共享規則」
 * @param {string} projectId
 * @param {Array<string>} dates - 要檢查的日期陣列 ['2025-08-25', ...]
 * @param {string|null} currentBatchId - 編輯模式下傳入，以排除自身
 * @returns {Promise<object>}
 */
export async function checkDateConflicts(projectId, dates, currentBatchId = null) {
  // ✓【修改】函數內部邏輯增加 isDeleted 過濾
  if (!dates || dates.length === 0) {
    return { conflictingDates: [], nonConflictingDates: [] };
  }
  try {
    // 步驟 1: 查找在指定日期中已存在的 *有效*「共享規則」
    const rulesRef = collection(db, "dateRules");
    // ✓【修改】增加 isDeleted 條件
    const rulesQuery = query(rulesRef,
      where("projectId", "==", projectId),
      where("isShared", "==", true),
      where("date", "in", dates),
      where("isDeleted", "==", false) // ✓ 只查找有效的共享規則
    );
    const rulesSnapshot = await getDocs(rulesQuery);
    // 如果找不到有效的共享規則，直接返回無衝突
    if (rulesSnapshot.empty) {
      console.log(`[api.js] checkDateConflicts: No active shared rules found for dates.`); // ✓ Log
      return { conflictingDates: [], nonConflictingDates: dates };
    }

    const conflictingRulesMap = new Map();
    rulesSnapshot.forEach(doc => {
      conflictingRulesMap.set(doc.id, { ruleId: doc.id, ...doc.data(), sharedBy: [] });
    });
    const ruleIds = Array.from(conflictingRulesMap.keys());

    // 步驟 2: 根據找到的規則 ID，查找所有 *有效* 的關聯批次 ID
    const linksRef = collection(db, "batchRuleLinks");
    // ✓【修改】增加 isDeleted 條件
    const linksQuery = query(
      linksRef,
      where("ruleId", "in", ruleIds),
      where("isDeleted", "==", false) // ✓ 只查找有效的連結
    );
    const linksSnapshot = await getDocs(linksQuery);
    // 如果找不到有效的連結，理論上不該發生 (因為規則存在)，但仍做防禦性處理
    if (linksSnapshot.empty) {
      console.warn(`[api.js] checkDateConflicts: Found shared rules but no active links? Rule IDs:`, ruleIds); // ✓ Log 警告
      return { conflictingDates: [], nonConflictingDates: dates };
    }

    const batchIds = new Set();
    const ruleToBatchIdsMap = new Map();
    linksSnapshot.forEach(doc => {
      const { ruleId, batchId } = doc.data();
      // ✓【修改】排除當前正在編輯的批次 ID (如果提供了 currentBatchId)
      if (currentBatchId && batchId === currentBatchId) {
          return; // 跳過自己批次的連結
      }
      batchIds.add(batchId);
      if (!ruleToBatchIdsMap.has(ruleId)) {
        ruleToBatchIdsMap.set(ruleId, []);
      }
      ruleToBatchIdsMap.get(ruleId).push(batchId);
    });

    // 如果過濾掉自己後，沒有其他批次連結到這些規則，則無衝突
    if (batchIds.size === 0) {
        console.log(`[api.js] checkDateConflicts: Conflicts only involved the current batch (${currentBatchId}). No external conflicts.`); // ✓ Log
        return { conflictingDates: [], nonConflictingDates: dates };
    }

    // 步驟 3: 根據批次 ID，一次性獲取所有 *有效* 批次的詳細資料
    const batchesRef = collection(db, "bookingBatches");
    // ✓【修改】增加 isDeleted 條件
    const batchesQuery = query(
      batchesRef,
      where(documentId(), 'in', Array.from(batchIds)),
      where("isDeleted", "==", false) // ✓ 只獲取有效的批次資訊
    );
    const batchesSnapshot = await getDocs(batchesQuery);
    const batchDetailsMap = new Map();
    batchesSnapshot.forEach(doc => {
      batchDetailsMap.set(doc.id, doc.data());
    });

    // 步驟 4: 組合出前端需要的 "預約項目(批次代號)" 格式
    conflictingRulesMap.forEach((rule, ruleId) => {
      const linkedBatchIds = ruleToBatchIdsMap.get(ruleId) || [];
      rule.sharedBy = linkedBatchIds
        .map(batchId => {
          const details = batchDetailsMap.get(batchId);
          // ✓ 確保批次詳細資料存在 (因為批次可能已被冷刪除但連結還在 - 理論上不該發生，但做防禦)
          return details ? `${details.bookingType}(${details.batchCode})` : null;
        })
        .filter(name => name !== null); // ✓ 過濾掉找不到詳情的批次
    });

    // 步驟 5: 格式化最終回傳給前端的資料
    const conflictingDates = [];
    const foundDates = new Set();
    conflictingRulesMap.forEach(rule => {
      // ✓【修改】只有當 rule.sharedBy 陣列不為空時，才算真正的衝突
      if (rule.sharedBy.length > 0) {
          conflictingDates.push({
            date: rule.date,
            existingRule: {
              ruleId: rule.ruleId,
              rule: rule.slots, // 規則內容
              sharedBy: rule.sharedBy // 使用此規則的其他有效批次
            }
          });
          foundDates.add(rule.date);
      }
    });

    const nonConflictingDates = dates.filter(d => !foundDates.has(d));

    console.log(`[api.js] checkDateConflicts: Found ${conflictingDates.length} conflicting dates.`); // ✓ Log
    return { conflictingDates, nonConflictingDates };

  } catch (e) {
    console.error("[api.js] checkDateConflicts: Error checking date conflicts:", e); // ✓ Log 錯誤
    // 發生錯誤時，保守起見回傳所有日期皆無衝突
    return { conflictingDates: [], nonConflictingDates: dates };
  }
}

/**
 * [V2 - 冷刪除版] 儲存批次與其關聯的每日規則 (混合模式)
 * @param {object} payload - 包含 { batchData, resolutions } 的物件
 * @returns {Promise<object>}
 */
export async function saveBatchWithRules(payload) {
    const { batchData, resolutions } = payload;
    const isNewBatch = !batchData.id; // ✓ 判斷是新增還是更新批次
    const batchId = batchData.id || doc(collection(db, "bookingBatches")).id; // ✓ 如果是新增，產生新 ID
    const now = serverTimestamp(); // ✓ 獲取伺服器時間戳

    try {
        const batch = writeBatch(db);
        const batchDocRef = doc(db, "bookingBatches", batchId);

        // 步驟 1: 新增/更新 bookingBatches 主文件
        const dataToSave = { ...batchData, id: batchId }; // ✓ 確保 ID 存在
        dataToSave.lastModified = now;
        if (isNewBatch) {
            dataToSave.createdAt = now;
            dataToSave.isDeleted = false; // ✓ 新增時預設為未刪除
        }
        delete dataToSave.dailyRules; // ✓ 移除規則資料，不存主文件
        // ✓【修改】確保 isDeleted 狀態不會意外被覆蓋成 true (只在新增時設 false)
        if (!isNewBatch) {
            delete dataToSave.isDeleted; // 更新時不修改 isDeleted
            delete dataToSave.deletedAt; // 更新時不修改 deletedAt
        }
        batch.set(batchDocRef, dataToSave, { merge: true });

        // 步驟 2: 處理規則，先 *冷刪除* 此批次在 *此次異動日期中* 的所有 *未被刪除的* 舊關聯
        const datesToUpdate = Object.keys(resolutions);
        if (datesToUpdate.length > 0) {
            // ✓【修改】查詢條件增加 isDeleted == false
            const oldLinksQuery = query(collection(db, "batchRuleLinks"),
                where("batchId", "==", batchId),
                where("date", "in", datesToUpdate),
                where("isDeleted", "==", false) // ✓ 只找未刪除的舊連結
            );
            const oldLinksSnapshot = await getDocs(oldLinksQuery);
            // ✓【修改】從 delete 改為 update，標記為已刪除
            oldLinksSnapshot.forEach(doc => {
                batch.update(doc.ref, {
                  isDeleted: true,
                  deletedAt: now
                });
            });
            console.log(`[api.js] saveBatchWithRules: Marked ${oldLinksSnapshot.size} old links for soft deletion.`); // ✓ Log
        }

        // 步驟 3: 根據 resolutions 建立新規則或新關聯
        for (const date in resolutions) {
            const resolution = resolutions[date];
            const ruleContent = batchData.dailyRules[date];

            // 如果該日期沒有設定規則內容，則跳過 (避免產生空的連結或規則)
            if (!ruleContent || !ruleContent.slots || Object.keys(ruleContent.slots).length === 0) {
                console.log(`[api.js] saveBatchWithRules: Skipping date ${date} due to empty rule content.`); // ✓ Log
                continue;
            }

            // --- 建立新連結或新規則的邏輯 (基本不變，但新增 isDeleted: false) ---
            if (resolution.mode === 'link' && resolution.targetRuleId) {
                // 模式 A: 連結至現有規則
                const linkDocRef = doc(collection(db, "batchRuleLinks"));
                batch.set(linkDocRef, {
                    batchId: batchId,
                    ruleId: resolution.targetRuleId,
                    date: date,
                    projectId: batchData.projectId,
                    isDeleted: false, // ✓ 新連結預設未刪除
                    createdAt: now,   // ✓ 增加建立時間
                });

            } else if (resolution.mode === 'update_shared' && resolution.targetRuleId) {
                // 模式 C: 更新現有共享規則，然後連結
                const ruleToUpdateRef = doc(db, "dateRules", resolution.targetRuleId);
                // ✓【修改】更新時也加入 isDeleted: false，確保規則是有效的
                batch.update(ruleToUpdateRef, {
                    slots: ruleContent.slots,
                    lastModified: now,
                    isDeleted: false, // ✓ 確保更新後的規則是未刪除狀態
                    deletedAt: null   // ✓ 清除可能的舊刪除時間
                });

                const linkDocRef = doc(collection(db, "batchRuleLinks"));
                batch.set(linkDocRef, {
                    batchId: batchId,
                    ruleId: resolution.targetRuleId,
                    date: date,
                    projectId: batchData.projectId,
                    isDeleted: false, // ✓ 新連結預設未刪除
                    createdAt: now,   // ✓ 增加建立時間
                });

            } else if (resolution.mode === 'create_independent' || resolution.mode === 'create_shared') {
                // 模式 B (獨立) 或新日期的共享規則
                const newRuleDocRef = doc(collection(db, "dateRules"));
                batch.set(newRuleDocRef, {
                    slots: ruleContent.slots,
                    date: date,
                    projectId: batchData.projectId,
                    isShared: resolution.mode === 'create_shared',
                    createdAt: now,
                    isDeleted: false, // ✓ 新規則預設未刪除
                });

                const linkDocRef = doc(collection(db, "batchRuleLinks"));
                batch.set(linkDocRef, {
                    batchId: batchId,
                    ruleId: newRuleDocRef.id,
                    date: date,
                    projectId: batchData.projectId,
                    isDeleted: false, // ✓ 新連結預設未刪除
                    createdAt: now,   // ✓ 增加建立時間
                });
            }
        }

        await batch.commit();
        console.log(`[api.js] saveBatchWithRules: Successfully saved batch ${batchId} and rules.`); // ✓ Log
        return { status: 'success', id: batchId };

    } catch (e) {
        console.error(`[api.js] saveBatchWithRules: Error saving batch ${batchId}:`, e); // ✓ Log 錯誤
        return { status: 'error', message: `儲存批次與規則時發生錯誤: ${e.message}` };
    }
}

/**
 * [V2 - 冷刪除版] 獲取指定批次的所有 *有效* 每日規則 (給編輯畫面使用)
 * @param {string} batchId - 批次的文件 ID
 * @returns {Promise<object>} - 返回以日期為 key 的規則物件
 */
export async function fetchRulesForBatch(batchId) {
  // ✓【修改】函數內部邏輯增加 isDeleted 過濾
  try {
    // 步驟 1: 透過 batchId 查找所有 *未被刪除* 的關聯 ruleId
    const linksRef = collection(db, "batchRuleLinks");
    // ✓【修改】增加 isDeleted 條件
    const linksQuery = query(
      linksRef,
      where("batchId", "==", batchId),
      where("isDeleted", "==", false) // ✓ 只查找有效的連結
    );
    const linksSnapshot = await getDocs(linksQuery);

    // 如果找不到任何有效連結，直接回傳空物件
    if (linksSnapshot.empty) {
      console.log(`[api.js] fetchRulesForBatch: No active links found for batch ${batchId}.`); // ✓ Log
      return {};
    }

    // 提取所有有效的 ruleId
    const ruleIds = linksSnapshot.docs.map(doc => doc.data().ruleId);
    if (ruleIds.length === 0) return {}; // 再次檢查，雖然理論上不會發生

    // 步驟 2: 透過有效的 ruleIds 一次性獲取所有 *未被刪除* 的規則內容
    const rulesRef = collection(db, "dateRules");
    // ✓【修改】增加 isDeleted 條件
    const rulesQuery = query(
      rulesRef,
      where(documentId(), 'in', ruleIds),
      where("isDeleted", "==", false) // ✓ 只獲取有效的規則
    );
    const rulesSnapshot = await getDocs(rulesQuery);

    const rules = {};
    rulesSnapshot.forEach(doc => {
      const data = doc.data();
      // ✓ 回傳前端習慣的格式 { 'YYYY-MM-DD': { slots: {...} } }
      rules[data.date] = { slots: data.slots };
    });

    console.log(`[api.js] fetchRulesForBatch: Fetched ${Object.keys(rules).length} active rules for batch ${batchId}.`); // ✓ Log
    return rules;
  } catch (e) {
    console.error(`[api.js] fetchRulesForBatch: Error fetching rules for batch ${batchId}:`, e); // ✓ Log 錯誤
    return {}; // 發生錯誤時回傳空物件
  }
}
/**
 * [舊版][Firestore] 儲存或更新一筆預約批次規則 [舊版]
 * 這個函式現在只負責儲存批次本身的基本資訊。
 * @param {object} batchData - 包含批次詳細資訊的物件 (不含每日規則)
 * @returns {Promise<object>} - 返回操作結果，包含 status 和 id
 */
export async function saveBookingBatch(batchData) {
    try {
        const isNew = !batchData.id;
        const docRef = isNew
            ? doc(collection(db, "bookingBatches"))
            : doc(db, "bookingBatches", batchData.id);

        const dataToSave = { ...batchData };
        
        if (isNew) {
            dataToSave.createdAt = serverTimestamp();
            delete dataToSave.id; 
        }
        dataToSave.lastModified = serverTimestamp();
        // 移除從 payload 傳過來的每日規則，避免存到主文件裡
        delete dataToSave.dailyRules; 

        await setDoc(docRef, dataToSave, { merge: true });

        return { status: 'success', id: docRef.id };
    } catch (e) {
        console.error("儲存預約批次時發生錯誤: ", e);
        return { status: 'error', message: e.message };
    }
}

/**
 * [舊版]　儲存指定批次的每日時段與名額規則
 * @param {string} batchId - 批次的文件 ID
 * @param {object} dailyRules - 以日期為 key 的規則物件 e.g., { '2025-09-01': { slots: {...} }, ... }
 * @returns {Promise<object>}
 */
export async function saveDailyRules(batchId, dailyRules) {
    try {
        const batch = writeBatch(db);

        for (const date in dailyRules) {
            const ruleData = dailyRules[date];
            // 建立指向子集合中文件的參照，文件 ID 就是日期
            const dailyRuleRef = doc(db, "bookingBatches", batchId, "dailyRules", date);
            batch.set(dailyRuleRef, ruleData);
        }

        await batch.commit();
        return { status: 'success' };
    } catch (e) {
        console.error(`儲存批次 ${batchId} 的每日規則時發生錯誤:`, e);
        return { status: 'error', message: e.message };
    }
}

/**
 * ［舊版] 獲取指定批次的所有每日規則
 * @param {string} batchId - 批次的文件 ID
 * @returns {Promise<object>} - 返回以日期為 key 的規則物件
 */
export async function fetchDailyRules(batchId) {
    try {
        const dailyRulesRef = collection(db, "bookingBatches", batchId, "dailyRules");
        const snapshot = await getDocs(dailyRulesRef);
        const rules = {};
        snapshot.forEach(doc => {
            rules[doc.id] = doc.data(); // doc.id 就是日期 'YYYY-MM-DD'
        });
        return rules;
    } catch (e) {
        console.error(`獲取批次 ${batchId} 的每日規則時發生錯誤:`, e);
        return {};
    }
}

/**
 * [V2 - 冷刪除版] 獲取指定建案的所有 *有效* 預約批次
 * @param {string} projectId - 建案的 ID
 * @returns {Promise<Array>} - 返回有效的批次資料陣列
 */
export async function fetchBookingBatches(projectId) {
  // ✓【修改】函數內部邏輯增加 isDeleted 過濾
  try {
    const batchesRef = collection(db, "bookingBatches");
    // ✓【修改】查詢條件增加 isDeleted == false
    const q = query(
      batchesRef,
      where("projectId", "==", projectId),
      where("isDeleted", "==", false), // ✓ 只查詢未被刪除的批次
      orderBy("bookingStart", "desc") // ✓ 保持原有的排序
    );

    const querySnapshot = await getDocs(q);
    const batches = [];
    querySnapshot.forEach((doc) => {
      // ✓ 回傳的資料結構不變
      batches.push({ id: doc.id, ...doc.data() });
    });

    console.log(`[api.js] fetchBookingBatches: Fetched ${batches.length} active batches for project ${projectId}.`); // ✓ Log
    return batches;
  } catch (e) {
    console.error(`[api.js] fetchBookingBatches: Error fetching batches for project ${projectId}:`, e); // ✓ Log 錯誤
    return []; // 發生錯誤時回傳空陣列
  }
}


/**
 * [Firestore] 獲取指定建案的所有時段規則
 * @param {string} projectId - 建案的 ID
 * @returns {Promise<Array>}
 */
export async function fetchTimeSlotRules(projectId) {
    const rulesRef = collection(db, "timeSlotRules");
    const q = query(rulesRef, where("projectId", "==", projectId));
    const snapshot = await getDocs(q);
    const rules = [];
    snapshot.forEach(doc => {
        rules.push({ id: doc.id, ...doc.data() });
    });
    return rules;
}

/**
 * [Firestore] 儲存一筆時段規則 (會自動判斷新增或更新)
 * @param {object} ruleData - 包含 projectId, bookingType, inspectionMethod, timeSlots 的物件
 * @returns {Promise<object>}
 */
export async function saveTimeSlotRule(ruleData) {
    const rulesRef = collection(db, "timeSlotRules");
    // 查詢是否已存在相同 (projectId, bookingType, inspectionMethod) 的規則
    const q = query(
        rulesRef,
        where("projectId", "==", ruleData.projectId),
        where("bookingType", "==", ruleData.bookingType),
        where("inspectionMethod", "==", ruleData.inspectionMethod)
    );

    try {
        const snapshot = await getDocs(q);
        if (snapshot.empty) {
            // 不存在，新增一筆
            const docRef = await addDoc(rulesRef, { ...ruleData, createdAt: serverTimestamp() });
            return { status: 'success', id: docRef.id };
        } else {
            // 已存在，更新第一筆找到的資料
            const docId = snapshot.docs[0].id;
            await updateDoc(doc(db, "timeSlotRules", docId), {
                timeSlots: ruleData.timeSlots,
                lastModified: serverTimestamp()
            });
            return { status: 'success', id: docId };
        }
    } catch (e) {
        console.error("儲存時段規則時發生錯誤:", e);
        return { status: 'error', message: e.message };
    }
}

/**
 * [Firestore] 獲取指定日期的名額設定
 * @param {string} projectId - 建案 ID
 * @param {string} date - 日期字串 (YYYY-MM-DD)
 * @returns {Promise<Array>}
 */
export async function fetchDateCapacities(projectId, date) {
    // 我們將每日的名額存在一個文件中，文件ID格式為 'projectId_date'
    const docId = `${projectId}_${date}`;
    const docRef = doc(db, "dailyCapacities", docId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
        const data = docSnap.data().slots; // { "09:00": 5, "10:00": 3 }
        // 將其轉換回元件習慣的陣列格式
        return Object.entries(data).map(([timeSlot, capacity]) => ({ timeSlot, capacity }));
    } else {
        return []; // 如果文件不存在，回傳空陣列
    }
}

/**
 * [Firestore] 儲存指定日期的名額設定
 * @param {string} projectId - 建案 ID
 * @param {string} date - 日期字串 (YYYY-MM-DD)
 * @param {Array} capacities - 包含 { timeSlot, capacity } 的陣列
 * @returns {Promise<object>}
 */
export async function saveDateCapacities(projectId, date, capacities) {
    const docId = `${projectId}_${date}`;
    const docRef = doc(db, "dailyCapacities", docId);
    
    // 將陣列轉換為 Firestore 中儲存的 map 格式
    const slotsMap = capacities.reduce((acc, curr) => {
        acc[curr.timeSlot] = Number(curr.capacity) || 0;
        return acc;
    }, {});

    try {
        await setDoc(docRef, {
            projectId,
            date,
            slots: slotsMap,
            lastModified: serverTimestamp()
        }, { merge: true }); // merge:true 確保我們只更新 slots 欄位
        return { status: 'success' };
    } catch (e) {
        console.error("儲存每日名額時發生錯誤:", e);
        return { status: 'error', message: e.message };
    }
}

/**
 * [V3 - 冷刪除版] 標記一個預約批次及其所有關聯為已刪除
 * @param {string} batchId - 批次的文件 ID
 * @returns {Promise<object>}
 */
export async function deleteBookingBatch(batchId) {
  // ✓【修改】函數內部邏輯改為冷刪除
  try {
    const batch = writeBatch(db); // ✓ 使用 writeBatch 確保原子性
    const linksRef = collection(db, "batchRuleLinks");
    const now = serverTimestamp(); // ✓ 獲取伺服器時間戳

    // 步驟 1: 找到此批次所有 *未被刪除* 的關聯 (batchRuleLinks)
    // ✓【修改】增加 isDeleted 條件
    const linksQuery = query(
      linksRef,
      where("batchId", "==", batchId),
      where("isDeleted", "==", false) // ✓ 只找未刪除的連結
    );
    const linksSnapshot = await getDocs(linksQuery);

    const ruleIdsToCheck = new Set(); // ✓ 使用 Set 避免重複檢查 ruleId
    linksSnapshot.forEach(doc => {
      ruleIdsToCheck.add(doc.data().ruleId);
      // 步驟 2: 準備 *更新* (而非刪除) 這些關聯，標記為已刪除
      // ✓【修改】從 delete 改為 update
      batch.update(doc.ref, {
        isDeleted: true,
        deletedAt: now
      });
    });

    // 步驟 3: 檢查這些規則 (dateRules) 是否因為此批次的連結被冷刪除而變成孤兒
    if (ruleIdsToCheck.size > 0) {
      for (const ruleId of ruleIdsToCheck) {
        // 查詢是否還存在 *其他未被刪除* 的連結指向這個 ruleId
        // ✓【修改】增加 isDeleted 條件
        const otherLinksQuery = query(
          linksRef,
          where("ruleId", "==", ruleId),
          where("batchId", "!=", batchId), // ✓ 排除當前批次
          where("isDeleted", "==", false) // ✓ 只計算其他未刪除的連結
        );

        // 使用 getCountFromServer 進行高效能計數
        const countSnapshot = await getCountFromServer(otherLinksQuery);

        // 如果計數為 0，代表這個規則已成為孤兒，標記為已刪除
        if (countSnapshot.data().count === 0) {
          const orphanRuleRef = doc(db, "dateRules", ruleId);
          // 步驟 4: 準備 *更新* (而非刪除) 孤兒規則
          // ✓【修改】從 delete 改為 update
          batch.update(orphanRuleRef, {
            isDeleted: true,
            deletedAt: now
          });
        }
      }
    }

    // 步驟 5: 準備 *更新* (而非刪除) 批次主文件 (bookingBatches)
    const batchDocRef = doc(db, "bookingBatches", batchId);
    // ✓【修改】從 delete 改為 update
    batch.update(batchDocRef, {
      isDeleted: true,
      deletedAt: now
    });

    // 步驟 6: 一次性提交所有更新操作
    await batch.commit();
    console.log(`[api.js] deleteBookingBatch: Soft deleted batch ${batchId} and related links/rules.`); // ✓ Log
    return { status: 'success', message: '批次已標記為刪除' }; // ✓ 更新回傳訊息
  } catch (e) {
    console.error(`[api.js] deleteBookingBatch: Error soft deleting batch ${batchId}:`, e); // ✓ Log 錯誤
    return { status: 'error', message: `標記刪除批次時發生錯誤: ${e.message}` };
  }
}



//  ===============================================
// /   戶別資料管理 (AG Grid) API
//  ===============================================

/**
 * [新] 即時監聽指定建案的自訂欄位定義
 * @param {string} projectId - 專案 ID
 * @param {string} collectionName - 目標集合名稱 (e.g., 'households')
 * @param {function} onDataChange - 收到資料時的回呼函式
 * @param {function} onError - 發生錯誤時的回呼函式
 * @returns {function} - 用於停止監聽的 unsubscribe 函式
 */
export const listenToFieldDefinitions = (projectId, collectionName, onDataChange, onError) => {
  const q = query(
    collection(db, "projectFieldDefinitions"),
    where("projectId", "==", projectId),
    where("collectionName", "==", collectionName),
    orderBy("order", "asc") // 根據 order 欄位排序
  );
  // 返回 onSnapshot 的 unsubscribe 函式，以便在組件卸載時停止監聽
  return onSnapshot(q, snapshot => {
    const definitions = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    onDataChange(definitions);
  }, onError);
};

/**
 * [新] 呼叫後端函式，儲存一個新的欄位定義
 * @param {object} definitionData - 包含新欄位所有設定的物件
 * @returns {Promise<object>}
 */
export async function saveFieldDefinition(definitionData) {
  try {
    const saveFunction = httpsCallable(functions, 'saveFieldDefinition');
    const result = await saveFunction(definitionData);
    return result.data; // 直接回傳 Cloud Function 的 { status, message }
  } catch (error) {
    console.error("儲存欄位定義時發生錯誤:", error);
    // 將 HttpsError 轉換為前端習慣的格式
    return { status: "error", message: error.message };
  }
}

/**
 * [Firestore 版] 根據建案 ID 獲取所有戶別資料，用於 AG Grid
 * @param {string} projectId 
 * @returns {Promise<Array>} 返回戶別資料陣列
 */
export async function fetchAllHouseholds(projectId) {
  try {
    const householdsRef = collection(db, "households");
    const q = query(householdsRef, where("projectId", "==", projectId));
    const querySnapshot = await getDocs(q);
    
    const households = [];
    querySnapshot.forEach((doc) => {
      // 將 Firestore Timestamp 轉換為 JavaScript Date 物件，AG Grid 更易處理
      const data = doc.data();
      const formattedData = { ...data };
      ['initialInspectionDate', 'reInspectionDate', 'statusDate', 'appropriationDate'].forEach(key => {
        if (data[key] && typeof data[key].toDate === 'function') {
          formattedData[key] = data[key].toDate();
        }
      });

    // 為了向下相容，將資料庫中可能存為 "ON" / "OFF" 的字串轉換為布林值
      ['initialReportUploadSwitch', 'reInspectionReportUploadSwitch', 'showInMenu'].forEach(key => { 
        if (formattedData[key] === 'ON') {
          formattedData[key] = true;
        } else if (formattedData[key] === 'OFF') {
          formattedData[key] = false;
        }
      });
      
      households.push({
        // 將 Firestore document ID 也存起來，方便更新
        _docId: doc.id, 
        ...formattedData
      });
    });
    return households;
  } catch (e) {
    console.error(`獲取建案 ${projectId} 的戶別資料時發生錯誤:`, e);
    return [];
  }
}

/**
 * [Firestore 版] 更新單一戶別的特定欄位資料
 * @param {string} householdDocId - Firestore 文件 ID
 * @param {object} dataToUpdate - e.g., { buyerName: '新名字' }
 * @returns {Promise<object>}
 */
export async function updateHouseholdData(householdDocId, dataToUpdate) {
  try {
    if (!householdDocId) throw new Error("缺少戶別文件 ID。");
    
    const processedData = { ...dataToUpdate };
    const dateFields = ['initialInspectionDate', 'reInspectionDate', 'statusDate', 'appropriationDate'];

    for (const key in processedData) {
      if (dateFields.includes(key)) {
        const value = processedData[key];
        // 如果使用者清空日期，則存為 null；否則轉換為 Timestamp
        if (value) {
          processedData[key] = Timestamp.fromDate(new Date(value));
        } else {
          processedData[key] = null;
        }
      }
    }

    const docRef = doc(db, "households", householdDocId);
    await updateDoc(docRef, processedData); // ✓ 使用處理過的資料
    return { status: 'success' };
  } catch (e) {
    console.error(`更新戶別 ${householdDocId} 資料時發生錯誤:`, e);
    return { status: 'error', message: e.message };
  }
}

/**
 * [Firestore 版] 批次更新多筆戶別資料的特定欄位
 * @param {Array<Object>} updates - 更新內容的陣列，格式為 [{ docId: string, data: object }]
 * @returns {Promise<object>}
 */
export async function batchUpdateHouseholds(updates) {
  if (!updates || updates.length === 0) {
    return { status: 'success', message: '沒有需要更新的資料。' };
  }

  const batch = writeBatch(db);
  
  updates.forEach(update => {
    if (update.docId && update.data) {
      const docRef = doc(db, "households", update.docId);
      batch.update(docRef, update.data);
    }
  });

  try {
    await batch.commit();
    return { status: 'success' };
  } catch (e) {
    console.error("批次更新戶別資料時發生錯誤:", e);
    return { status: 'error', message: e.message };
  }
}

/**
 *  【新增】呼叫 Firebase Function 來批次上傳驗屋系統的戶別資料
 * @param {string} projectId - 專案 ID
 * @param {Array<object>} householdsData - 從 Excel 解析出的戶別資料陣列
 * @returns {Promise<object>}
 */
export const uploadInspectionHouseholds = async (projectId, householdsData) => {
  if (!projectId || !householdsData) {
    return { status: "error", message: "前端錯誤：缺少 projectId 或戶別資料。" };
  }
  
  try {
    const uploadFunction = httpsCallable(functions, 'uploadInspectionHouseholds');
    const result = await uploadFunction({ projectId, householdsData });
    return result.data; // 直接回傳 Cloud Function 的 { status, message }
  } catch (error) {
    console.error("呼叫 uploadInspectionHouseholds 雲端函式時發生錯誤:", error);
    return { status: "error", message: error.message };
  }
}


/**
 * 監聽驗屋預約集合的即時變動
 * @param {string} projectId - 專案 ID
 * @param {function} onDataChange - 當資料變動時要執行的回呼函式，會傳入最新的事件陣列
 * @param {function} onError - 當發生錯誤時執行的回呼函式
 * @returns {function} - 一個可以用來停止監聽的 unsubscribe 函式
 */
export const listenToBookings = (projectId, onDataChange, onError) => {
  // ✓ 建立一個指向特定專案下 `bookings` 集合的查詢
  //   請注意：這裡的 'projects', projectId, 'bookings' 是假設的資料庫路徑，
  //   您需要根據您實際的 Firestore 資料結構進行調整。
  const bookingsCol = collection(db, 'projects', projectId, 'bookings');
  const q = query(bookingsCol);

  // ✓ 建立 onSnapshot 監聽器
  const unsubscribe = onSnapshot(q, (querySnapshot) => {
    const bookings = [];
    querySnapshot.forEach((doc) => {
      bookings.push({
        id: doc.id,
        ...doc.data()
      });
    });
    // ✓ 當資料更新時，呼叫傳入的回呼函式
    onDataChange(bookings);
  }, (error) => {
    // ✓ 處理監聽時發生的錯誤
    console.error("Error listening to bookings collection: ", error);
    if (onError) {
      onError(error);
    }
  });

  // ✓ 回傳 unsubscribe 函式，讓呼叫者可以在需要時停止監聽
  return unsubscribe;
};



/**
 * ✓ (新) 監聽指定專案的戶別資料以用於日曆
 * @param {string} projectId - 專案 ID
 * @param {function} onDataChange - 資料變動時的回呼函式
 * @param {function} onError - 錯誤時的回呼函式
 * @returns {function} - 用於停止監聽的 unsubscribe 函式
 */
export const listenToHouseholdsForCalendar = (projectId, onDataChange, onError) => {
  // ✓ 建立查詢，只撈取符合目前 projectId 的戶別
  const householdsCol = collection(db, 'households');
  const q = query(householdsCol, where("projectId", "==", projectId));

  const unsubscribe = onSnapshot(q, (querySnapshot) => {
    const households = [];
    querySnapshot.forEach((doc) => {
      households.push({
        id: doc.id, // ✓ 將文件的 ID 也一併傳出去
        ...doc.data()
      });
    });
    onDataChange(households);
  }, (error) => {
    console.error("監聽戶別資料時發生錯誤: ", error);
    if (onError) {
      onError(error);
    }
  });

  return unsubscribe;
};

/**
 * ✓ (新) 更新戶別的驗屋日期與時段
 * @param {string} docId - Firestore 文件的 ID
 * @param {'initial' | 're'} inspectionType - 要更新的是 '初驗' 還是 '複驗'
 * @param {Date} newDate - 新的日期時間物件
 * @returns {Promise<void>}
 */
export const updateHouseholdInspectionDate = async (docId, inspectionType, newDate) => {
  const householdRef = doc(db, 'households', docId);

  // ✓ 從新的日期物件中，格式化出日期和時間
  const newStartTime = newDate.toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit', hour12: false }).replace(':', '：');

  const updatePayload = {};

  // ✓ 根據是初驗還是複驗，決定要更新哪個欄位
  if (inspectionType === 'initial') {
    updatePayload.initialInspectionDate = Timestamp.fromDate(newDate);
  } else {
    updatePayload.reInspectionDate = Timestamp.fromDate(newDate);
  }

  // ✓ 根據您的資料結構，似乎只有一個 `statusTimeSlot` 欄位
  //   這裡我們假設拖曳任何事件都是更新這一個時間欄位
  updatePayload.statusTimeSlot = newStartTime;

  await updateDoc(householdRef, updatePayload);
};


/**
 * ✓ (新) 監聽指定專案的所有戶別資料 (用於 AG Grid)
 * @param {string} projectId - 專案 ID
 * @param {function} onDataChange - 資料變動時的回呼函式，會傳入最新的戶別資料陣列
 * @param {function} onError - 發生錯誤時的回呼函式
 * @returns {function} - 用於停止監聽的 unsubscribe 函式
 */
export const listenToAllHouseholds = (projectId, onDataChange, onError) => {
  const householdsCol = collection(db, 'households');
  // ✓ 建立查詢，篩選出符合當前 projectId 的所有文件
  const q = query(householdsCol, where("projectId", "==", projectId));

  const unsubscribe = onSnapshot(q, (snapshot) => {
    const households = [];
    // ✓ 我們可以從 snapshot.docChanges() 中獲取更詳細的變動類型
    snapshot.docChanges().forEach((change) => {
        // 這部分邏輯先在 Vue 元件中處理，以簡化 API
    });

    // 為了簡化初版，我們先回傳完整資料列表
    snapshot.forEach((doc) => {
      // 驗屋預約管理 START: 新增修改處
      const data = doc.data();
      const formattedData = { ...data };
      
      // 遍歷所有可能的日期欄位
      ['initialInspectionDate', 'reInspectionDate', 'statusDate', 'appropriationDate'].forEach(key => {
        // 如果欄位存在，且是 Firestore Timestamp 物件 (可以呼叫 toDate() 方法)
        if (data[key] && typeof data[key].toDate === 'function') {
          // 將其轉換為 JavaScript Date 物件
          formattedData[key] = data[key].toDate();
        }
      });
      
      households.push({
        _docId: doc.id, 
        ...formattedData // 使用處理過的資料
      });
      // 驗屋預約管理 END: 新增修改處
    });

    onDataChange(households);

  }, (error) => {
    console.error("監聽戶別總表時發生錯誤: ", error);
    if (onError) {
      onError(error);
    }
  });

  return unsubscribe;
};


// =================================================================
// ✓ 【新增】銷控設定頁面專用 API
// =================================================================

/**
 * 獲取單一專案的設定
 * @param {string} projectId - 專案 ID
 * @returns {Promise<object|null>}
 */
export const getProjectSettings = async (projectId) => {
  if (!projectId) return null;
  const projectRef = doc(db, 'projects', projectId);
  const docSnap = await getDoc(projectRef);
  if (docSnap.exists()) {
    return { id: docSnap.id, ...docSnap.data() };
  } else {
    console.warn(`在 projects 集合中找不到文件: ${projectId}`);
    return null;
  }
};

/**
 * 更新專案設定
 * @param {string} projectId - 專案 ID
 * @param {object} dataToUpdate - 要更新的資料物件
 * @returns {Promise<void>}
 */
export const updateProjectSalesSettings = async (projectId, dataToUpdate) => {
  const projectRef = doc(db, 'projects', projectId);
  await updateDoc(projectRef, dataToUpdate);
};

/**
 * 即時監聽銷控狀態參數 (偵錯版本)
 * @param {string} projectId - 專案 ID
 * @param {function} callback - 收到資料時的回呼函式
 * @returns {function} - 用於停止監聽的 unsubscribe 函式
 */
export const listenToSalesParameters = (projectId, callback) => {

  const q = query(
    collection(db, 'salesParameters'),
    where('projectId', '==', projectId),
    orderBy('order', 'asc')
  );

  const unsubscribe = onSnapshot(q, 
    (querySnapshot) => {

      const parameters = [];
      querySnapshot.forEach((doc) => {
        parameters.push({ id: doc.id, ...doc.data() });
      });
      callback(parameters);
    },
    (error) => {

    }
  );

  return unsubscribe;
};

/**
 * 新增一個銷控狀態參數
 * @param {string} projectId - 專案 ID
 * @param {object} data - { statusName, colorCode, order }
 * @returns {Promise<void>}
 */
export const addSalesParameter = async (projectId, data) => {
  // ✓ 產生您指定的自訂文件 ID
  const timestamp = format(new Date(), 'yyyyMMddHHmmss');
  const randomSuffix = String(Math.floor(Math.random() * 1000)).padStart(3, '0');
  const customDocId = `${projectId}${timestamp}${randomSuffix}`;

  const docRef = doc(db, 'salesParameters', customDocId);
  await setDoc(docRef, {
    projectId: projectId,
    ...data
  });
};

/**
 * 更新銷控狀態參數
 * @param {string} docId - salesParameters 集合中的文件 ID
 * @param {object} dataToUpdate - 要更新的資料
 * @returns {Promise<void>}
 */
export const updateSalesParameter = async (docId, dataToUpdate) => {
  const docRef = doc(db, 'salesParameters', docId);
  await updateDoc(docRef, dataToUpdate);
};

/**
 * 刪除銷控狀態參數
 * @param {string} docId - salesParameters 集合中的文件 ID
 * @returns {Promise<void>}
 */
export const deleteSalesParameter = async (docId) => {
  const docRef = doc(db, 'salesParameters', docId);
  await deleteDoc(docRef);
};


/**
 *  【新增】即時監聽銷控系統所需的所有資料
 * @param {string} projectId - 專案 ID (e.g., "fuyu61")
 * @param {function} onDataChange - 收到更新資料時的回呼函式
 * @param {function} onError - 發生錯誤時的回呼函式
 * @returns {function} - 一個可以用來停止所有監聽的 unsubscribe 函式
 */
export const listenToSalesControlData = (projectId, onDataChange, onError) => {
  const projectDocRef = doc(db, 'projects', projectId);
  const parametersQuery = query(collection(db, 'salesParameters'), where('projectId', '==', projectId));
  const householdsQuery = query(collection(db, 'salesHouseholds'), where('projectId', '==', projectId));
  //  取得同專案的所有車位資料
  const parkingsQuery = query(collection(db, 'salesParkings'), where('projectId', '==', projectId)); 
  const personnelQuery = query(collection(db, 'salesPersonnel'), where('projectId', '==', projectId));

 let combinedData = {
    project: null,
    parameters: [],
    households: [],
    parkings: [],
    personnel: [] // ✓ 新增 personnel 屬性
  };
  
  let projectLoaded = false;
  let paramsLoaded = false;
  let householdsLoaded = false;
  let parkingsLoaded = false; 
  let personnelLoaded = false; // ✓ 新增 personnel 載入旗標

const checkAndEmitData = () => {
    // ✓ 修改：確保 personnelLoaded 也為 true
    if (projectLoaded && paramsLoaded && householdsLoaded && parkingsLoaded && personnelLoaded) {
      onDataChange(combinedData);
    }
  };
  
  const unsubProject = onSnapshot(projectDocRef, (docSnap) => {
    if (docSnap.exists()) {
      combinedData.project = docSnap.data();
    } else {
      console.warn(`[API] 找不到專案文件: ${projectId}`);
      combinedData.project = {}; 
    }
    projectLoaded = true;
    checkAndEmitData();
  }, onError);

  const unsubParams = onSnapshot(parametersQuery, (snapshot) => {
    combinedData.parameters = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    paramsLoaded = true;
    checkAndEmitData();
  }, onError);

  const unsubHouseholds = onSnapshot(householdsQuery, (snapshot) => {
    combinedData.households = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    householdsLoaded = true;
    checkAndEmitData();
  }, onError);

  //  新增對 salesParkings 的監聽
  const unsubParkings = onSnapshot(parkingsQuery, (snapshot) => {
    combinedData.parkings = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    parkingsLoaded = true;
    checkAndEmitData();
  }, onError);



  // ✓ 新增：對 salesPersonnel 的監聽
  const unsubPersonnel = onSnapshot(personnelQuery, (snapshot) => {
    combinedData.personnel = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    personnelLoaded = true;
    checkAndEmitData();
  }, onError);

  return () => {
    unsubProject();
    unsubParams();
    unsubHouseholds();
    unsubParkings(); 
    unsubPersonnel(); // ✓ 確保停止 personnel 監聽
  };
};


/**
 * ✓ 【新增】呼叫 Firebase Function 來批次上傳車位資料
 * @param {string} projectId - 專案 ID
 * @param {Array<object>} parkingData - 從 Excel 解析出的車位資料陣列
 * @returns {Promise<object>}
 */
export const uploadParkingLots = async (projectId, parkingData) => {
  if (!projectId || !parkingData) {
    return { status: "error", message: "前端錯誤：缺少 projectId 或車位資料。" };
  }
  
  try {
    const uploadFunction = httpsCallable(functions, 'uploadParkingLots');
    const result = await uploadFunction({ projectId, parkingData });
    return result.data; // 直接回傳 Cloud Function 的 { status, message }
  } catch (error) {
    console.error("呼叫 uploadParkingLots 雲端函式時發生錯誤:", error);
    return { status: "error", message: error.message };
  }
};




/**
 *  【新增】呼叫 Firebase Function 來批次上傳戶別資料
 * @param {string} projectId - 專案 ID
 * @param {Array<object>} householdsData - 從 Excel 解析出的戶別資料陣列
 * @returns {Promise<object>}
 */
export const uploadHouseholds = async (projectId, householdsData) => {
  if (!projectId || !householdsData) {
    return { status: "error", message: "前端錯誤：缺少 projectId 或戶別資料。" };
  }
  
  try {
    const uploadFunction = httpsCallable(functions, 'uploadHouseholds');
    const result = await uploadFunction({ projectId, householdsData });
    return result.data; // 直接回傳 Cloud Function 的 { status, message }
  } catch (error) {
    console.error("呼叫 uploadHouseholds 雲端函式時發生錯誤:", error);
    return { status: "error", message: error.message };
  }
};


// =================================================================
// / ✓ 【新增】銷控圖片管理 API
// =================================================================

/**
 * 即時監聽指定建案的所有銷控圖片資料
 * @param {string} projectId - 專案 ID
 * @param {function} onDataChange - 收到資料時的回呼函式
 * @param {function} onError - 發生錯誤時的回呼函式
 * @returns {function} - 用於停止監聽的 unsubscribe 函式
 */
export const listenToSalesImages = (projectId, onDataChange, onError) => {
  const q = query(
    collection(db, "salesImages"),
    where("projectId", "==", projectId),
    orderBy("createdAt", "desc")
  );

  const unsubscribe = onSnapshot(q, (snapshot) => {
    const images = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    onDataChange(images);
  }, (error) => {
    console.error(`監聽銷控圖片時發生錯誤 (Project: ${projectId}):`, error);
    if (onError) onError(error);
  });

  return unsubscribe;
};


//  START: 修改圖片上傳邏輯
/**
 * [舊] 直接上傳檔案 (現在改為備用或移除)
 */
export const uploadSalesImage_direct = async (storagePath, file) => {
  const imageRef = ref(storage, storagePath);
  await uploadBytes(imageRef, file);
  return getDownloadURL(imageRef);
};

/**
 * [新] 透過 Cloud Function 代理上傳銷控圖片檔案
 * @param {string} storagePath - 在 Storage 中的完整儲存路徑
 * @param {string} fileName - 原始檔案名稱
 * @param {string} fileBase64 - 檔案的 Base64 內容 (不含 data:image/... 前綴)
 * @param {string} projectId - 當前專案 ID
 * @returns {Promise<object>} - 返回包含 downloadURL 和 storagePath 的物件
 */
export const uploadSalesImage = async (storagePath, fileName, fileBase64, projectId, contentType = null) => {
  try {
    const uploader = httpsCallable(functions, 'handleSalesImageUpload');
    // 將 contentType 加入 payload，以便後端 Storage 正確設定標頭
    const payload = { projectId, fileName, fileBase64, storagePath };
    if (contentType) payload.contentType = contentType;

    const result = await uploader(payload);
    if (result.data.status === 'success') {
      return result.data; 
    } else {
      throw new Error(result.data.message || 'Cloud Function 回報錯誤');
    }
  } catch (error) {
    console.error("呼叫 handleSalesImageUpload 雲端函式時發生錯誤:", error);
    throw new Error(error.message || "上傳失敗");
  }
};
//  END: 修改圖片上傳邏輯

/**
 * 在 Firestore 中建立或更新銷控圖片的中繼資料
 * @param {string} docId - 文件 ID (格式: projectId_imageName)
 * @param {object} metadata - 要儲存的圖片資料
 * @returns {Promise<void>}
 */
export const setSalesImageMetadata = async (docId, metadata) => {
  const docRef = doc(db, "salesImages", docId);
  // 使用 setDoc 搭配 merge:true，無論是新增還是覆蓋(重新上傳)都能處理
  await setDoc(docRef, metadata, { merge: true });
};

/**
 * [新] 透過 Cloud Function 代理刪除一張銷控圖片 (包含 Storage 檔案和 Firestore 記錄)
 * @param {string} docId - Firestore 的文件 ID
 * @param {string} storagePath - Storage 中的檔案完整路徑
 * @returns {Promise<void>}
 */
export const deleteSalesImage = async (docId, storagePath) => {
  if (!docId || !storagePath) {
    throw new Error('缺少 docId 或 storagePath，無法刪除圖片。');
  }
  
  try {
    const deleter = httpsCallable(functions, 'handleSalesImageDelete');
    const result = await deleter({ docId, storagePath });

    if (result.data.status !== 'success') {
      throw new Error(result.data.message || 'Cloud Function 回報刪除錯誤');
    }
  } catch (error) {
    console.error("呼叫 handleSalesImageDelete 雲端函式時發生錯誤:", error);
    throw new Error(error.message || "代理刪除失敗");
  }
};

//  START: 新增 checkInToSystem API 函式

/**
 * [新] 請求後端檢查是否可以進入特定系統
 * @param {string} projectId 建案 ID
 * @param {string} system 系統名稱 (e.g., '銷控系統')
 * @param {string} userKey 使用者手機
 * @param {string} userName 使用者姓名
 * @returns {Promise<object>}
 */
export async function checkInToSystem(projectId, system, userKey, userName) {
  if (!projectId || !system || !userKey || !userName) {
    return { status: 'error', message: '前端錯誤：呼叫 checkInToSystem 時缺少參數。' };
  }

  try {
    const checkInFunction = httpsCallable(functions, 'checkInToSystem');
    const result = await checkInFunction({ projectId, system, userKey, userName });
    return result.data; // e.g., { status: 'success', message: '...' }
  } catch (error) {
    console.error("呼叫 checkInToSystem 雲端函式時發生錯誤:", error);
    // 將 Firebase Function 拋出的 HttpsError 轉換為前端習慣的格式
    return { status: 'error', message: error.message };
  }
}
//  END: 新增 checkInToSystem API 函式

/**
 * [新] 設定使用者的在線狀態，並可選地設定 onDisconnect 清理
 * @param {string} userKey 
 * @param {string} userName
 * @param {string} projectId 
 * @param {string} system 
 * @param {boolean} setupOnDisconnect 是否設定離線時自動移除
 */
export async function setUserOnlineStatus(userKey, userName, projectId, system, setupOnDisconnect = false) {
  if (!userKey) return; 
  const presenceRef = dbRef(rtdb, `onlineStatus/${userKey}`);
  const statusPayload = {
    userId: userKey,
    userName: userName,
    projectId: projectId,
    system: system,
  };

  await set(presenceRef, statusPayload);

  if (setupOnDisconnect) {
    onDisconnect(presenceRef).remove();
  }
}



/**
 * [新] 設定使用者在線，並設定 onDisconnect 清理
 * @param {string} userKey 
 * @param {string} userName
 * @param {string} projectId 
 * @param {string} system 
 */
export async function goOnline(userKey, userName, projectId, system) {
  if (!userKey) return;
  const presenceRef = dbRef(rtdb, `onlineStatus/${userKey}`);
  const statusPayload = {
    userId: userKey,
    userName: userName,
    projectId: projectId,
    system: system,
  };

  // onDisconnect 必須在 set() 之前設定，確保不會有遺漏
  await onDisconnect(presenceRef).remove();
  
  // 將使用者狀態寫入 RTDB
  await set(presenceRef, statusPayload);
}



/**
 * 管理使用者在線狀態。
 * 當使用者連線時，設定其狀態為在線，並註冊一個 onDisconnect 事件，
 * 以便在連線意外中斷時自動將其狀態更新為離線。
 * @param {string} userKey - 使用者的唯一識別碼。
 */
export const manageUserPresence = (userKey) => {
  if (!userKey) return;

  // 指向 Realtime Database 中該使用者的狀態路徑
  const userStatusRef = dbRef(rtdb, `/status/${userKey}`);

  // 定義離線時要寫入的資料
  const offlineStatus = {
    isOnline: false,
    last_changed: rtdbServerTimestamp(), // ✓【修正】使用新的別名
  };

  // 定義在線時要寫入的資料
  const onlineStatus = {
    isOnline: true,
    last_changed: rtdbServerTimestamp(), // ✓【修正】使用新的別名
  };

  // 註冊 onDisconnect 事件。當客戶端斷線時，Firebase 伺服器會自動執行此操作。
  onDisconnect(userStatusRef).set(offlineStatus)
    .then(() => {
      // onDisconnect 設定成功後，才將當前狀態設為在線
      set(userStatusRef, onlineStatus);
    })
    .catch((error) => {
      console.error("無法設定 onDisconnect 事件:", error);
    });
};

/**
 * 將使用者狀態明確設為離線。
 * 通常在使用者主動登出時呼叫。
 * @param {string} userKey - 使用者的唯一識別碼。
 */
export const goOffline = (userKey) => {
  if (!userKey) return Promise.resolve();
  const userStatusRef = dbRef(rtdb, `/status/${userKey}`);
  const offlineStatus = {
    isOnline: false,
    last_changed: rtdbServerTimestamp(),
  };
  // **** 👇👇👇 在這裡加入 Log 👇👇👇 ****
  console.log(`>>> API goOffline: Attempting RTDB set for ${userKey}... <<<`);
  // **** 👆👆👆 加入 Log 結束 👆👆👆 ****
  return set(userStatusRef, offlineStatus).then(() => {
      // **** 👇👇👇 在這裡加入 Log 👇👇👇 ****
      console.log(`>>> API goOffline: RTDB set SUCCESS for ${userKey}. <<<`);
      // **** 👆👆👆 加入 Log 結束 👆👆👆 ****
  }).catch(error => {
      // **** 👇👇👇 在這裡加入 Log 👇👇👇 ****
      console.error(`>>> API goOffline: RTDB set FAILED for ${userKey}:`, error);
      // **** 👆👆👆 加入 Log 結束 👆👆👆 ****
      // 選擇是否重新拋出錯誤，目前 userStore 會捕獲
      // throw error;
  });
};


/**
 * [新] 呼叫後端函式，在指定建案中搜尋預約紀錄 (全域搜尋)
 * @param {string} projectId 
 * @param {string} searchText 
 * @returns {Promise<object>}
 */
 // 替換舊的 searchAppointments 函式
export async function searchAppointments(projectId, searchText) {
  try {
    const searchFunction = httpsCallable(functions, 'handleAppointmentSearch');
    const result = await searchFunction({ projectId, searchText });
    return result.data; // 應該是 { status: 'success', data: [...] }
  } catch (error) {
    console.error("呼叫 handleAppointmentSearch 雲端函式時發生錯誤:", error);
    return { status: 'error', message: error.message, data: [] };
  }
}




// 備份任務管理 API

/**
 * [新] 即時監聽所有備份任務的變化
 * @param {function} onDataChange - 收到資料時的回呼函式
 * @returns {function} - 用於停止監聽的 unsubscribe 函式
 */
export const listenToBackupJobs = (onDataChange) => {
  const jobsRef = collection(db, "backupJobs");
  const unsubscribe = onSnapshot(jobsRef, (snapshot) => {
    const jobs = [];
    snapshot.forEach((doc) => {
      jobs.push({ id: doc.id, ...doc.data() });
    });
    onDataChange(jobs);
  });
  return unsubscribe;
};

/**
 * [新] 建立一個新的備份任務
 * @param {object} jobData - 任務設定資料
 */
export async function createBackupJob(jobData) {
  const jobsRef = collection(db, "backupJobs");
  await addDoc(jobsRef, {
    ...jobData,
    createdAt: serverTimestamp(),
  });
}

/**
 * [新] 更新一個備份任務
 * @param {string} jobId 
 * @param {object} jobData 
 */
export async function updateBackupJob(jobId, jobData) {
  const jobDocRef = doc(db, "backupJobs", jobId);
  await updateDoc(jobDocRef, jobData);
}

/**
 * [新] 刪除一個備份任務
 * @param {string} jobId 
 */
export async function deleteBackupJob(jobId) {
  const jobDocRef = doc(db, "backupJobs", jobId);
  await deleteDoc(jobDocRef);
}

/**
 * [新] 手動觸發後端備份函式
 * @param {string} jobId 
 * @param {object} jobConfig 
 * @returns {Promise<object>}
 */
export async function triggerBackupJob(jobId, jobConfig) {
    try {
        const runBackupJob = httpsCallable(functions, 'runBackupJob');
        const result = await runBackupJob({ jobId, jobConfig });
        return result.data;
    } catch (error) {
        console.error(`觸發備份任務 (Job ID: ${jobId}) 時發生錯誤:`, error);
        // 將 HttpsError 轉換為前端可用的格式
        return { status: 'error', message: error.message };
    }
}
//  END: 新增備份任務管理 API

//  START: 新增獲取集合列表的 API
/**
 * [新] 呼叫後端，獲取 Firestore 中所有集合的名稱列表
 * @returns {Promise<Array>}
 */
export async function fetchFirestoreCollections() {
  try {
    const listCollections = httpsCallable(functions, 'listFirestoreCollections');
    const result = await listCollections();
    if (result.data.status === 'success') {
      return result.data.data; // 回傳集合名稱的陣列
    }
    return [];
  } catch (error) {
    console.error("獲取集合列表時發生錯誤:", error);
    return []; // 發生錯誤時回傳空陣列
  }
}
//  END: 新增獲取集合列表的 API

//  新增觸發刪除的 API
export async function triggerDeleteJob(jobId, jobConfig, isDryRun) {
    try {
        const runDeleteJob = httpsCallable(functions, 'runDeleteJob');
        const result = await runDeleteJob({ jobId, jobConfig, isDryRun });
        return result.data;
    } catch (error) {
        return { status: 'error', message: error.message };
    }
}

//  START: 新增備份檔案瀏覽 API
/**
 * [新] 呼叫後端，獲取 GCS 中指定路徑的檔案與資料夾列表
 * @param {string} path - 要瀏覽的路徑，例如 "backups/"
 * @returns {Promise<{files: Array, directories: Array}>}
 */
export async function fetchBackupFiles(path = '') {
  try {
    const listFiles = httpsCallable(functions, 'listBackupFiles');
    const result = await listFiles({ path });
    if (result.data.status === 'success') {
      return result.data.data; // 回傳 { files: [...], directories: [...] }
    }
    return { files: [], directories: [] };
  } catch (error) {
    console.error(`獲取路徑 [${path}] 的檔案列表時發生錯誤:`, error);
    return { files: [], directories: [] };
  }
}

/**
 * [新] 呼叫後端，獲取 GCS 檔案的預覽內容
 * @param {string} filePath - 完整的檔案路徑
 * @param {number} previewLines - 預計讀取的行數
 * @returns {Promise<Array>} - 包含檔案內容逐行字串的陣列
 */
export async function fetchBackupFileContent(filePath, previewLines = 100) {
  try {
    const getFileContent = httpsCallable(functions, 'getBackupFileContent');
    const result = await getFileContent({ filePath, previewLines });
    if (result.data.status === 'success') {
      return result.data.data; // 回傳 string[]
    }
    return [];
  } catch (error) {
    console.error(`獲取檔案 [${filePath}] 內容時發生錯誤:`, error);
    return [`讀取檔案時發生錯誤: ${error.message}`];
  }
}
//  END: 新增備份檔案瀏覽 API

//  START: 新增觸發刪除備份檔案的 API
/**
 * [新] 呼叫後端，刪除 GCS 中指定的備份檔案
 * @param {string} filePath - GCS 中的完整檔案路徑
 * @returns {Promise<object>}
 */
export async function triggerDeleteBackupFile(filePath) {
  try {
    const deleteFile = httpsCallable(functions, 'deleteBackupFile');
    const result = await deleteFile({ filePath });
    return result.data; // 回傳 { status, message }
  } catch (error) {
    console.error(`觸發刪除檔案 (File: ${filePath}) 時發生錯誤:`, error);
    return { status: 'error', message: error.message };
  }
}
//  END: 新增觸發刪除備份檔案的 API

//  START: 新增欄位批次更新 API
/**
 * [新] 呼叫後端，產生用於欄位更新的 Excel 範本
 * @param {object} config - 包含 targetCollection, projectId, fields
 * @returns {Promise<object>} - 返回包含下載連結的物件
 */
export async function triggerGenerateExcelTemplate(config) {
  try {
    const generate = httpsCallable(functions, 'generateExcelTemplate');
    const result = await generate(config);
    return result.data;
  } catch (error) {
    return { status: 'error', message: `產生範本失敗: ${error.message}` };
  }
}


/**
 * [新] 呼叫後端，執行 Excel 更新的預覽或真實更新
 * @param {string} fileContent - Base64 編碼的檔案內容
 * @param {string} targetCollection 
 * @param {boolean} isDryRun 
 * @returns {Promise<object>}
 */
export async function triggerUpdateFromExcel(fileContent, targetCollection, isDryRun) {
  try {
    const update = httpsCallable(functions, 'updateFieldsFromExcel');
    //  修改：傳送 fileContent 而不是 filePath
    const result = await update({ fileContent, targetCollection, isDryRun });
    return result.data;
  } catch (error) {
    return { status: 'error', message: `執行更新失敗: ${error.message}` };
  }
}



//  START: 新增獲取集合欄位的 API
/**
 * [新] 呼叫後端，獲取指定集合的可用欄位列表
 * @param {string} targetCollection 
 * @param {string} projectId 
 * @returns {Promise<Array>}
 */
export async function fetchAvailableFields(targetCollection, projectId) {
  try {
    const getFields = httpsCallable(functions, 'getCollectionFields');
    const result = await getFields({ targetCollection, projectId });
    if (result.data.status === 'success') {
      return result.data.data;
    }
    return [];
  } catch (error) {
    console.error("獲取可用欄位時發生錯誤:", error);
    return [];
  }
}
//  END: 新增獲取集合欄位的 API

//  START: 新增特殊報告上傳 API
/**
 * [新] 呼叫後端，執行特殊驗屋報告的上傳與郵件通知
 * @param {object} payload - 包含所有必要資訊的物件
 * @returns {Promise<object>}
 */
export async function triggerSpecialReportUpload(payload) {
  try {
    const upload = httpsCallable(functions, 'handleSpecialReportUpload');
    const result = await upload(payload);
    return result.data;
  } catch (error) {
    console.error("觸發特殊報告上傳時發生錯誤:", error);
    return { status: 'error', message: error.message };
  }
}
//  END: 新增特殊報告上傳 API


// =================================================================
// /  【新增】銷控 SVG 圖片管理 API
// =================================================================

/**
 * [新] 透過 Cloud Function 代理上傳銷控 SVG 檔案
 * @param {string} storagePath - 在 Storage 中的完整儲存路徑
 * @param {string} fileName - 原始檔案名稱
 * @param {string} fileBase64 - 檔案的 Base64 內容
 * @param {string} projectId - 當前專案 ID
 * @returns {Promise<object>} - 返回包含 downloadURL 和 storagePath 的物件
 */
export const uploadSalesSvgViaFunction = async (storagePath, fileName, fileBase64, projectId) => {
  try {
    // 注意：我們將在下一步為 SVG 建立一個專用的 Cloud Function
    const uploader = httpsCallable(functions, 'handleSalesSvgUpload');
    const result = await uploader({
      projectId,
      fileName,
      fileBase64,
      storagePath,
    });
    
    if (result.data.status === 'success') {
      return result.data; // 回傳 { downloadURL, storagePath }
    } else {
      throw new Error(result.data.message || 'Cloud Function 回報 SVG 上傳錯誤');
    }
  } catch (error) {
    console.error("呼叫 SVG 上傳雲端函式時發生錯誤:", error);
    throw new Error(error.message || "代理上傳 SVG 失敗");
  }
};

/**
 * [新] 在 Firestore 中建立 SVG 的中繼資料
 * @param {string} docId - 文件 ID (格式: projectId_svgName)
 * @param {object} metadata - 要儲存的 SVG 資料 (包含 building, svgName 等)
 * @returns {Promise<void>}
 */
export const setSalesSvgMetadata = async (docId, metadata) => {
  const docRef = doc(db, "salesSVGs", docId);
  await setDoc(docRef, metadata, { merge: true });
};

/**
 * [新] 透過 Cloud Function 代理刪除一個 SVG (包含 Storage 檔案和 Firestore 記錄)
 * @param {string} docId - Firestore 的文件 ID
 * @param {string} storagePath - Storage 中的檔案完整路徑
 * @returns {Promise<void>}
 */
export const deleteSalesSvgViaFunction = async (docId, storagePath) => {
    if (!docId || !storagePath) {
        throw new Error('缺少 docId 或 storagePath，無法刪除 SVG。');
    }
    try {
        // 注意：我們將在下一步為 SVG 建立一個專用的刪除 Cloud Function
        const deleter = httpsCallable(functions, 'handleSalesSvgDelete');
        const result = await deleter({ docId, storagePath });
        if (result.data.status !== 'success') {
            throw new Error(result.data.message || 'Cloud Function 回報 SVG 刪除錯誤');
        }
    } catch (error) {
        console.error("呼叫 SVG 刪除雲端函式時發生錯誤:", error);
        throw new Error(error.message || "代理刪除 SVG 失敗");
    }
};

/**
 * [新] 獲取指定專案所有不重複的 SVG 棟別列表
 * @param {string} projectId - 專案 ID
 * @returns {Promise<Array<string>>} - 返回棟別字串陣列
 */
export async function getUniqueSvgBuildings(projectId) {
  const svgRef = collection(db, "salesSVGs");
  const q = query(svgRef, where("projectId", "==", projectId));
  const snapshot = await getDocs(q);
  
  const buildings = new Set();
  snapshot.forEach(doc => {
    if (doc.data().building) {
      buildings.add(doc.data().building);
    }
  });
  
  return Array.from(buildings).sort((a, b) => a.localeCompare(b, 'zh-Hant'));
}

/**
 * [新] 即時監聽指定專案和棟別的 SVG 資料
 * @param {string} projectId - 專案 ID
 * @param {string} building - 棟別名稱
 * @param {function} onDataChange - 收到資料時的回呼函式
 * @returns {function} - 用於停止監聽的 unsubscribe 函式
 */
export const listenToSvgsByBuilding = (projectId, building, onDataChange) => {
  const q = query(
    collection(db, "salesSVGs"),
    where("projectId", "==", projectId),
    where("building", "==", building),
    orderBy("svgName", "asc")
  );

  const unsubscribe = onSnapshot(q, (snapshot) => {
    const svgs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    onDataChange(svgs);
  }, (error) => {
    console.error(`監聽 SVG 時發生錯誤 (Building: ${building}):`, error);
  });

  return unsubscribe;
};

/**
 * [新] 透過 Cloud Function 代理批次刪除多個 SVG
 * @param {Array<object>} svgsToDelete - 要刪除的 SVG 物件陣列, e.g., [{ docId, storagePath }]
 * @returns {Promise<object>} - 返回 Cloud Function 的執行結果
 */
export const batchDeleteSalesSvgsViaFunction = async (svgsToDelete) => {
  if (!Array.isArray(svgsToDelete) || svgsToDelete.length === 0) {
    // 如果沒有傳入檔案，直接回傳成功，避免不必要的後端呼叫
    return { status: "success", message: "沒有需要刪除的檔案。" };
  }
  try {
    const batchDeleter = httpsCallable(functions, 'handleSalesSvgBatchDelete');
    const result = await batchDeleter({ svgsToDelete });
    // 直接回傳後端的完整結果，讓前端可以根據 status 決定提示訊息
    return result.data; 
  } catch (error) {
    console.error("呼叫 SVG 批次刪除雲端函式時發生錯誤:", error);
    throw new Error(error.message || "代理批次刪除 SVG 失敗");
  }
};

/**
 * [新] 根據戶別 ID 獲取單一戶別的詳細資料
 * @param {string} projectId - 專案 ID
 * @param {string} unitId - 戶別 ID
 * @returns {Promise<object|null>} - 返回戶別資料或 null
 */
export async function getHouseholdByUnitId(projectId, unitId) {
  const householdsRef = collection(db, "salesHouseholds");
  const q = query(
    householdsRef,
    where("projectId", "==", projectId),
    where("unitId", "==", unitId),
    limit(1)
  );
  const snapshot = await getDocs(q);
  if (snapshot.empty) {
    return null;
  }
  return { id: snapshot.docs[0].id, ...snapshot.docs[0].data() };
}

/**
 * [新] 根據 SVG 名稱獲取單一 SVG 的詳細資料
 * @param {string} projectId - 專案 ID
 * @param {string} svgName - SVG 名稱 (例如 "A-10")
 * @returns {Promise<object|null>} - 返回 SVG 資料或 null
 */
export async function getSvgBySvgName(projectId, svgName) {
  const docId = `${projectId}_${svgName}`;
  const docRef = doc(db, "salesSVGs", docId);
  const docSnap = await getDoc(docRef);

  if (docSnap.exists()) {
    return { id: docSnap.id, ...docSnap.data() };
  } else {
    // 如果用 docId 找不到，可能是舊資料，用查詢的方式再試一次
    const svgsRef = collection(db, "salesSVGs");
    const q = query(
      svgsRef,
      where("projectId", "==", projectId),
      where("svgName", "==", svgName),
      limit(1)
    );
    const snapshot = await getDocs(q);
    if (snapshot.empty) {
      return null;
    }
    return { id: snapshot.docs[0].id, ...snapshot.docs[0].data() };
  }
}


// =================================================================
// /  【新增】銷售人員管理 API
// =================================================================

/**
 * [新] 即時監聽指定建案的所有銷售人員資料
 * @param {string} projectId - 專案 ID
 * @param {function} onDataChange - 收到資料時的回呼函式
 * @returns {function} - 用於停止監聽的 unsubscribe 函式
 */
export const listenToSalesPersonnel = (projectId, onDataChange) => {
  const q = query(
    collection(db, "salesPersonnel"),
    where("projectId", "==", projectId),
    // ✅ [修改] 改為先依 order 排序，再依 name 排序
    orderBy("order", "asc"), 
    orderBy("name", "asc")
  );

  const unsubscribe = onSnapshot(q, (snapshot) => {
    const personnel = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    onDataChange(personnel);
  }, (error) => {
    console.error(`監聽銷售人員時發生錯誤 (Project: ${projectId}):`, error);
  });

  return unsubscribe;
};

// ✅ [新增] 在文件末尾或其他 API 附近加入
/**
 * [API] 呼叫後端，批次更新銷售人員的排序
 * @param {string} projectId 
 * @param {Array<{id: string, order: number}>} updates 
 * @returns {Promise<object>}
 */
export const updateSalesPersonnelOrders = async (projectId, updates) => {
  try {
    const updaterFunction = httpsCallable(functions, 'updateSalesPersonnelOrders');
    const result = await updaterFunction({ projectId, updates });
    return result.data;
  } catch (error) {
    console.error("API Error in updateSalesPersonnelOrders:", error);
    throw new Error(error.message);
  }
};

/**
 *  【修改】新增或更新一筆銷售人員資料 (使用自訂文件 ID)
 * @param {string} docId - 自訂的文件 ID (例如：姓名_電話)
 * @param {object} personnelData - 要寫入的人員資料
 * @returns {Promise<void>}
 */
export const setSalesPersonnel = (docId, personnelData) => {
  const docRef = doc(db, "salesPersonnel", docId);
  // 使用 setDoc 搭配 merge: true，可以同時處理新增和更新
  return setDoc(docRef, {
    ...personnelData,
    updatedAt: serverTimestamp(),
  }, { merge: true });
};

/**
 * [新] 更新一筆銷售人員資料
 * @param {string} docId - Firestore 中的文件 ID
 * @param {object} dataToUpdate - 要更新的資料物件
 * @returns {Promise<void>}
 */
export const updateSalesPersonnel = (docId, dataToUpdate) => {
  const docRef = doc(db, "salesPersonnel", docId);
  return updateDoc(docRef, {
    ...dataToUpdate,
    updatedAt: serverTimestamp(),
  });
};

/**
 * [新] 刪除一筆銷售人員資料
 * @param {string} docId - Firestore 中的文件 ID
 * @returns {Promise<void>}
 */
export const deleteSalesPersonnel = (docId) => {
  const docRef = doc(db, "salesPersonnel", docId);
  return deleteDoc(docRef);
};

// =================================================================
// /  【新增】期款方式範本 (Payment Terms Template) 管理 API
// =================================================================

/**
 * [新] 即時監聽指定建案的所有期款範本
 * @param {string} projectId - 專案 ID
 * @param {function} onDataChange - 收到資料時的回呼函式
 * @returns {function} - 用於停止監聽的 unsubscribe 函式
 */
export const listenToPaymentTermTemplates = (projectId, onDataChange) => {
  const q = query(
    collection(db, "paymentTermTemplates"),
    where("projectId", "==", projectId),
    orderBy("templateName", "asc")
  );

  const unsubscribe = onSnapshot(q, (snapshot) => {
    const templates = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    onDataChange(templates);
  }, (error) => {
    console.error(`監聽期款範本時發生錯誤 (Project: ${projectId}):`, error);
  });

  return unsubscribe;
};

/**
 *  【修改】將 addPaymentTermTemplate 替換為 setPaymentTermTemplate
 * [新] 新增或完整覆蓋一筆期款範本 (使用自訂文件 ID)
 * @param {string} docId - 自訂的文件 ID
 * @param {object} templateData - 要新增的範本資料物件
 * @returns {Promise<void>}
 */
export const setPaymentTermTemplate = (docId, templateData) => {
  const docRef = doc(db, "paymentTermTemplates", docId);
  return setDoc(docRef, {
    ...templateData,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
};

/**
 * [新] 更新一筆期款範本
 * @param {string} docId - Firestore 中的文件 ID
 * @param {object} dataToUpdate - 要更新的資料物件
 * @returns {Promise<void>}
 */
export const updatePaymentTermTemplate = (docId, dataToUpdate) => {
  const docRef = doc(db, "paymentTermTemplates", docId);
  return updateDoc(docRef, {
    ...dataToUpdate,
    updatedAt: serverTimestamp(),
  });
};

/**
 * [新] 刪除一筆期款範本
 * @param {string} docId - Firestore 中的文件 ID
 * @returns {Promise<void>}
 */
export const deletePaymentTermTemplate = (docId) => {
  const docRef = doc(db, "paymentTermTemplates", docId);
  return deleteDoc(docRef);
};

/**
 * 從後端獲取指定專案的文字樣式
 * @param {string} projectId 專案 ID
 * @returns {Promise<object>} 樣式物件
 */
export const getProjectTextStyle = async (projectId) => {
  const getStyles = httpsCallable(functions, 'getProjectTextStyle');
  const result = await getStyles({ projectId });
  if (result.data.status === 'success') {
    return result.data.styles;
  }
  throw new Error('Failed to get text styles from server.');
};

/**
 * 更新後端的專案文字樣式
 * @param {string} projectId 專案 ID
 * @param {object} styles 完整的樣式物件
 * @returns {Promise<object>} 伺服器回應
 */
export const updateProjectTextStyle = async (projectId, styles) => {
  const updateStyles = httpsCallable(functions, 'updateProjectTextStyle');
  const result = await updateStyles({ projectId, styles });
  if (result.data.status === 'success') {
    return result.data;
  }
  throw new Error('Failed to update text styles on server.');
};

/**
 * 從後端獲取指定車位的狀態顏色設定
 * @param {string} projectId 專案 ID
 * @returns {Promise<object>} 顏色設定物件
 */
export const getProjectStatusColors = async (projectId) => {
  const getColors = httpsCallable(functions, 'getProjectStatusColors');
  const result = await getColors({ projectId });
  if (result.data.status === 'success') {
    return result.data.colors;
  }
  throw new Error('Failed to get status colors from server.');
};

/**
 * 更新後端的車位狀態顏色設定
 * @param {string} projectId 專案 ID
 * @param {object} colors 完整的顏色設定物件
 * @returns {Promise<object>} 伺服器回應
 */
export const updateProjectStatusColors = async (projectId, colors) => {
  const updateColors = httpsCallable(functions, 'updateProjectStatusColors');
  const result = await updateColors({ projectId, colors });
  if (result.data.status === 'success') {
    return result.data;
  }
  throw new Error('Failed to update status colors on server.');
};


/**
 * 獲取所有系統權限功能的列表
 * @returns {Promise<Array>}
 */
export async function fetchAllSystemFunctions() {
  try {
    const getFunctions = httpsCallable(functions, 'getSystemFunctions');
    const result = await getFunctions();
    return result.data;
  } catch (error) {
    console.error("獲取權限功能列表失敗:", error);
    return [];
  }
}

/**
 * 建立一個新的系統權限功能
 * @param {object} functionData - { functionId, name, description, isCore }
 * @returns {Promise<object>}
 */
export async function createSystemFunction(functionData) {
  try {
    const createFunc = httpsCallable(functions, 'createSystemFunction');
    const result = await createFunc(functionData);
    return result.data;
  } catch (error) {
    return { status: 'error', message: error.message };
  }
}

/**
 * 更新一個系統權限功能
 * @param {object} functionData - { functionId, name, description }
 * @returns {Promise<object>}
 */
export async function updateSystemFunction(functionData) {
  try {
    const updateFunc = httpsCallable(functions, 'updateSystemFunction');
    const result = await updateFunc(functionData);
    return result.data;
  } catch (error) {
    return { status: 'error', message: error.message };
  }
}

/**
 * [新增] 僅更新單筆預約紀錄的驗屋人員欄位
 * (V2: 呼叫 inspectionCalendarApi 路由)
 */
export async function updateAppointmentInspectors(appointmentId, inspectors) {
  if (!appointmentId) throw new Error("缺少預約 ID。");
  
  try {
    // 修改：呼叫 inspectionCalendarApiRouter
    const result = await inspectionCalendarApiRouter({
        action: 'updateAppointmentInspectors',
        data: {
            appointmentId,
            inspectors
        }
    });
    // 修改：後端路由會直接回傳 { status }
    return result.data;
  } catch (e) {
      console.error("API updateAppointmentInspectors 錯誤:", e);
      throw new Error(e.message || '更新驗屋人員失敗');
  }
}

/**
 * [新] 獲取指定建案下的所有戶別資料
 * (V2: 呼叫 inspectionCalendarApi 路由)
 * @param {string} projectId - 專案 ID
 * @returns {Promise<Array>} - 戶別資料陣列
 */
export async function fetchAllHouseholdsForProject(projectId) {
  if (!projectId) return [];
  
  try {
    // 修改：呼叫 inspectionCalendarApiRouter
    const result = await inspectionCalendarApiRouter({
        action: 'fetchAllHouseholds',
        data: { projectId }
    });
    // 修改：後端路由會直接回傳陣列
    return result.data;
  } catch (e) {
    console.error(`獲取建案 ${projectId} 的戶別資料時發生錯誤:`, e);
    // 保持拋出錯誤，讓 Store 可以捕捉
    throw new Error(e.message || '獲取戶別資料失敗');
  }
}

/**
 * [修改後版本] 供管理員獲取指定日期的所有時段選項
 * (V2: 呼叫 adminBookingApi 路由)
 * @param {string} projectId 
 * @param {string} dateStr - 'YYYY-MM-DD' 格式
 * @returns {Promise<Array<string>>}
 */
export async function getSlotsForAdmin(projectId, dateStr) {
    try {
        // 修改：呼叫 adminBookingApiRouter
        const result = await adminBookingApiRouter({
            action: 'getSlotsForAdmin',
            data: { projectId, dateStr }
        });
        // 修改：後端路由會直接回傳 slots 陣列
        return result.data;
    } catch (error) {
        console.error("獲取管理員時段選項時發生錯誤:", error);
        throw new Error(error.message);
    }
}


/**
 * [新] 獲取上傳報告頁面所需的棟別列表 (無篩選) (V2: 呼叫 bookingApi 路由)
 */
export async function fetchBuildingListForUpload(projectId) {
  try {
    // 修改：呼叫 bookingApiRouter
    const result = await bookingApiRouter({
        action: 'getBuildingsForUpload',
        data: { projectId: projectId }
    });
    // 修改：後端路由會直接回傳 { status, data }
    return result.data;
  } catch (error) {
    console.error("API fetchBuildingListForUpload 呼叫錯誤:", error);
    return { status: 'error', message: error.message };
  }
}

/**
 * [新] 獲取上傳報告頁面所需的所有戶別資料 (無篩選) (V2: 呼叫 bookingApi 路由)
 */
export async function fetchAllUnitsForUpload(projectId) {
  try {
    // 修改：呼叫 bookingApiRouter
    const result = await bookingApiRouter({
        action: 'getAllUnitsForUpload',
        data: { projectId: projectId }
    });
    // 修改：後端路由會直接回傳 { status, data }
    return result.data;
  } catch (error) { 
    console.error("API fetchAllUnitsForUpload 呼叫錯誤:", error);
    return { status: 'error', message: error.message };
  }
}


/**
 * [新增] 跨集合全域搜尋預約紀錄
 * (V2: 呼叫 inspectionCalendarApi 路由)
 * @param {string} projectId - 建案 ID
 * @param {string} keyword - 搜尋關鍵字
 * @returns {Promise<{status: string, data: Array, message?: string}>}
 */
export async function searchAppointmentsAndHouseholds(projectId, keyword) {
  if (!projectId || !keyword) {
    return { status: 'error', message: '缺少 projectId 或 keyword' };
  }
  
  try {
    // 修改：呼叫 inspectionCalendarApiRouter
    const result = await inspectionCalendarApiRouter({
        action: 'searchAppointmentsAndHouseholds',
        data: { projectId, keyword }
    });

    if (result.data.status === 'success') {
      const processedData = result.data.data.map(appt => ({
        ...appt,
        //  將後端回傳的 ISO 字串轉回 Date 物件 (符合原函式行為)
        appointmentDate: appt.appointmentDate ? new Date(appt.appointmentDate) : null,
      }));
      return { status: 'success', data: processedData };
    } else {
      return { status: 'error', message: result.data.message || '搜尋時發生未知錯誤' };
    }
  } catch (error) {
    console.error("❌ 全域搜尋 API 呼叫失敗:", error);
    return { status: 'error', message: `搜尋失敗: ${error.message}` };
  }
}

/**
 * 從資料庫獲取使用者偏好設定
 */
export async function fetchUserPreferencesFromBackend(userKey) {
  try {
    // 修正：使用 Firestore v9 的語法
    const userDocRef = doc(db, 'users', userKey);
    const userDoc = await getDoc(userDocRef);
    
    if (userDoc.exists()) {
      const userData = userDoc.data();
      return userData.preferences || {};
    }
    return {};
  } catch (error) {
    console.error('[API] 獲取使用者偏好設定失敗:', error);
    throw error;
  }
}


/**
 * [新] 呼叫後端發起授權書簽署流程 (委託人發起) (V2: 呼叫 bookingApi 路由)
 */
export async function initiateAuthSigningProcess(payload) {
  try {
    // 修改：呼叫 bookingApiRouter
    const result = await bookingApiRouter({
        action: 'initiateAuthSigningProcess',
        data: payload
    });
    // 修改：後端路由會直接回傳 { status, message }
    return result.data;
  } catch (error) {
    console.error("API initiateAuthSigningProcess 錯誤:", error);
    return { status: 'error', message: error.message };
  }
}

/**
 * [新] 根據 Token 獲取授權書簽署階段的資料
 * @param {object} payload - 包含 { token } 的物件
 * @returns {Promise<object>}
 */
export async function getAuthSigningSession(payload) {
  try {
    const getSession = httpsCallable(functions, 'getAuthSigningSession');
    const result = await getSession(payload);
    return result.data;
  } catch (error) {
    console.error("API getAuthSigningSession 錯誤:", error);
    return { status: 'error', message: error.message };
  }
}

/**
 * [新] 標記授權書簽署流程已完成，並更新最終文件連結
 * @param {object} payload - 包含 { token, finalUrl } 的物件
 * @returns {Promise<object>}
 */
export async function markAuthSessionComplete(payload) {
  try {
    const completeSession = httpsCallable(functions, 'completeAuthSigningProcess');
    const result = await completeSession(payload);
    return result.data;
  } catch (error) {
    console.error("API markAuthSessionComplete 錯誤:", error);
    return { status: 'error', message: error.message };
  }
}


/**
 * [API] 呼叫後端，執行上傳報告前的第一步驗證 (V2: 呼叫 bookingApi 路由)
 */
export const verifyUploadPrerequisites = async (payload) => {
  try {
    // 修改：呼叫 bookingApiRouter
    const result = await bookingApiRouter({
        action: 'verifyUploadPrerequisites',
        data: payload
    });
    // 修改：後端路由會直接回傳 { status, ... }
    return result.data;
  } catch (error) {
    console.error("API Error in verifyUploadPrerequisites:", error);
    throw new Error(error.message);
  }
};

//手動啟用提醒上傳驗屋報告通知
export const manualTriggerSendReminders = async () => {
  try {
    const triggerFunction = httpsCallable(functions, 'manualTriggerSendReminders');
    const result = await triggerFunction();
    return result.data;
  } catch (error) {
    console.error("API Error in manualTriggerSendReminders:", error);
    throw new Error(error.message);
  }
};


// ✓ 在您的 src/api.js 檔案中加入這兩個新的函式

/**
 * [API] 根據手機號碼驗證使用者是否存在
 * @param {object} payload - 包含 { phone }
 * @returns {Promise<object>} - 後端回傳的結果
 */
export const verifyUserByPhone = async (payload) => {
  try {
    const verifyFunction = httpsCallable(functions, 'verifyUserByPhone');
    const result = await verifyFunction(payload);
    return result.data;
  } catch (error) {
    console.error("API Error in verifyUserByPhone:", error);
    throw new Error(error.message);
  }
};

/**
 * [API] 將 LINE User ID 綁定到指定使用者
 * @param {object} payload - 包含 { phone, lineId }
 * @returns {Promise<object>} - 後端回傳的結果
 */
export const bindLineIdToUser = async (payload) => {
  try {
    const bindFunction = httpsCallable(functions, 'bindLineIdToUser');
    const result = await bindFunction(payload);
    return result.data;
  } catch (error) {
    console.error("API Error in bindLineIdToUser:", error);
    throw new Error(error.message);
  }
};



// ✓ START: 新增 - 呼叫後端檢查 LINE 綁定狀態
/**
 * [API] 呼叫後端檢查指定的 LINE ID 是否已綁定
 * @param {object} payload - 包含 { lineId }
 * @returns {Promise<object>} - 後端回傳的結果
 */
export const checkLineBindingStatus = async (payload) => {
  try {
    const checkFunction = httpsCallable(functions, 'checkLineBindingStatus');
    const result = await checkFunction(payload);
    return result.data;
  } catch (error)
 {
    console.error("API Error in checkLineBindingStatus:", error);
    throw new Error(error.message);
  }
};
// ✓ END

// ✓ START: 替換舊的 bindLineIdToUser，改為新的兩段式驗證 API

/**
 * [API] 請求後端發送 LINE 綁定驗證信
 * @param {object} payload - 包含 { phone, lineId }
 * @returns {Promise<object>} - 後端回傳的結果
 */
export const initiateLineBindingVerification = async (payload) => {
  try {
    const initiateFunction = httpsCallable(functions, 'initiateLineBindingVerification');
    const result = await initiateFunction(payload);
    return result.data;
  } catch (error) {
    console.error("API Error in initiateLineBindingVerification:", error);
    throw new Error(error.message);
  }
};

/**
 * [API] 傳送驗證 Token 至後端，完成最終綁定
 * @param {object} payload - 包含 { token }
 * @returns {Promise<object>} - 後端回傳的結果
 */
export const finalizeLineBinding = async (payload) => {
  try {
    const finalizeFunction = httpsCallable(functions, 'finalizeLineBinding');
    const result = await finalizeFunction(payload);
    return result.data;
  } catch (error) {
    console.error("API Error in finalizeLineBinding:", error);
    throw new Error(error.message);
  }
};

// ✓ END

// ✓ START: 新增 - LIFF 查詢功能所需的 API 函式

/**
 * 【修改】[API] 獲取 LIFF 使用者資料與其可查詢的建案列表
 * (改用 liffCalendarApiRouter)
 * @param {object} payload - 包含 { lineId }
 * @returns {Promise<object>} - 後端回傳的結果
 */
export const getLiffUserData = async (payload) => {
  try {
    //  修改：呼叫 liffCalendarApiRouter
    const result = await liffCalendarApiRouter({
        action: 'getLiffUserData', //  對應後端的 action
        data: payload
    });
    return result.data;
  } catch (error) {
    console.error("API Error in getLiffUserData:", error);
    throw new Error(error.message);
  }
};




/**
 * 【修改】[API] 根據建案ID和關鍵字搜尋預約紀錄 (LIFF查詢用)
 * (改用 liffCalendarApiRouter，並呼叫優化版的 action)
 * @param {object} payload - 包含 { projectId, searchText }
 * @returns {Promise<object>} - 後端回傳的結果 (僅含 appointments)
 */
export const liffSearchAppointments = async (payload) => {
  try {
    //  修改：呼叫 liffCalendarApiRouter
    const result = await liffCalendarApiRouter({
        action: 'liffSearchAppointments', //  呼叫優化版的 action
        data: payload
    });
    return result.data;
  } catch (error) {
    console.error("API Error in liffSearchAppointments:", error);
    throw new Error(error.message);
  }
};
// ✓ END


// ✓ START: 新增 - LIFF 驗屋時間表專用函式

/**
 * 【修改】[LIFF日曆用] 獲取指定建案的所有預約資料 (用於日曆計數渲染)
 * (改用 liffCalendarApiRouter)
 * @param {object} payload - 包含 { projectId } 的物件
 * @returns {Promise<object>} - 後端回傳的結果
 */
export const getAllLiffAppointmentsForProject = async (payload) => {
  try {
    //  修改：呼叫 liffCalendarApiRouter
    const result = await liffCalendarApiRouter({
        action: 'getAllLiffAppointmentsForProject', //  對應後端的 action
        data: payload
    });
    return result.data;
  } catch (error) {
    console.error("API Error in getAllLiffAppointmentsForProject:", error);
    throw new Error(error.message);
  }
};


/**
 * 【修改】[LIFF日曆用] 獲取指定單一日期的預約 (只回傳 appointments)
 * (改用 liffCalendarApiRouter，並呼叫優化版的 action)
 * @param {object} payload - 包含 { projectId, date } 的物件
 * @returns {Promise<object>} - 後端回傳的結果
 */
export const getLiffCalendarDataForDay = async (payload) => {
  try {
    //  修改：呼叫 liffCalendarApiRouter
    const result = await liffCalendarApiRouter({
        action: 'getLiffCalendarDataForDay', //  呼叫優化版的 action
        data: payload
    });
    return result.data;
  } catch (error) {
    console.error("API Error in getLiffCalendarDataForDay:", error);
    throw new Error(error.message);
  }
};
// ✓ END

// 【新增】一個 API 函數，用於讓 LIFF 獲取戶別快取
/**
 * [API] 獲取指定建案下的所有戶別資料 (供 LIFF 快取使用)
 * @param {string} projectId - 專案 ID
 * @returns {Promise<Array>} - 戶別資料陣列
 */
export async function fetchAllHouseholdsForLiff(projectId) {
  if (!projectId) return [];
  
  try {
    const result = await liffCalendarApiRouter({
        action: 'fetchAllHouseholds', //  對應後端的 action
        data: { projectId }
    });
    return result.data; // 後端直接回傳陣列
  } catch (e) {
    console.error(`獲取建案 ${projectId} 的戶別資料時發生錯誤:`, e);
    throw new Error(e.message || '獲取戶別資料失敗');
  }
}


// ✓ START: 新增 - 獲取開發者資料的 API
/**
 * [API][開發者用] 根據 User Key 獲取使用者資料與權限
 * @param {object} payload - 包含 { userKey }
 * @returns {Promise<object>} - 後端回傳的結果
 */
export const getDeveloperData = async (payload) => {
  try {
    const getDataFunction = httpsCallable(functions, 'getDeveloperData');
    const result = await getDataFunction(payload);
    return result.data;
  } catch (error) {
    console.error("API Error in getDeveloperData:", error);
    throw new Error(error.message);
  }
};
// ✓ END

// =================================================================
// /  【新增】後台新增預約專用 API
// =================================================================

/**
 * [後台用] 根據關鍵字模糊搜尋戶別資料
 * (V2: 呼叫 adminBookingApi 路由)
 * @param {object} payload - 包含 { projectId, keyword }
 * @returns {Promise<object>} - 後端回傳的結果
 */
export const searchHouseholdsForAdmin = async (payload) => {
  try {
    // 修改：呼叫 adminBookingApiRouter
    const result = await adminBookingApiRouter({
        action: 'searchHouseholdsForAdmin',
        data: payload
    });
    // 修改：後端路由會直接回傳 { status, data }
    return result.data;
  } catch (error) {
    console.error("API Error in searchHouseholdsForAdmin:", error);
    throw new Error(error.message);
  }
};

/**
 * [後台用] 獲取指定建案所有預約批次的詳細資訊
 * (V2: 呼叫 adminBookingApi 路由)
 * @param {object} payload - 包含 { projectId }
 * @returns {Promise<object>} - 後端回傳的結果
 */
export const getProjectBatchDetails = async (payload) => {
  try {
    // 修改：呼叫 adminBookingApiRouter
    const result = await adminBookingApiRouter({
        action: 'getProjectBatchDetails',
        data: payload
    });
    // 修改：後端路由會直接回傳 data 物件 (或拋錯)
    return result.data;
  } catch (error) {
    console.error("API Error in getProjectBatchDetails:", error);
    throw new Error(error.message);
  }
};

/**
 * [後台用] 獲取行事曆所需的所有日期及其分類
 * (V2: 呼叫 inspectionCalendarApi 路由)
 * @param {object} payload - 包含 { projectId, unitId }
 * @returns {Promise<object>} - 後端回傳的結果
 */
export const getAdminBookingCalendarData = async (payload) => {
  try {
    // 修改：呼叫 inspectionCalendarApiRouter
    const result = await inspectionCalendarApiRouter({
        action: 'getAdminBookingCalendarData',
        data: payload
    });
    // 修改：後端路由會直接回傳 { status, data }
    return result.data;
  } catch (error) {
    console.error("API Error in getAdminBookingCalendarData:", error);
    throw new Error(error.message);
  }
};

/**
 * [後台用] 獲取指定單一戶別的所有預約歷史紀錄
 * (V2: 呼叫 adminBookingApi 路由)
 * @param {object} payload - 包含 { projectId, unitId }
 * @returns {Promise<object>} - 後端回傳的結果
 */
export const getAppointmentsForHousehold = async (payload) => {
  try {
    // 修改：呼叫 adminBookingApiRouter
    const result = await adminBookingApiRouter({
        action: 'getAppointmentsForHousehold',
        data: payload
    });
    // 修改：後端路由會直接回傳 { status, data }
    return result.data;
  } catch (error) {
    console.error("API Error in getAppointmentsForHousehold:", error);
    throw new Error(error.message);
  }
};

// ✓ START: 新增 - Google Drive 檔案管理 API
// =================================================================
// /  【新增】Google Drive 檔案管理 API
// =================================================================

/**
 * [新] 呼叫後端，獲取 Google Drive 資料夾內的檔案與資料夾列表
 * @param {object} payload - 包含 { folderId, searchTerm } 的物件
 * @returns {Promise<object>} - 後端回傳的結果 { status, files }
 */
export const driveProxyList = async (payload) => {
  try {
    const listFunction = httpsCallable(functions, 'driveProxyList');
    const result = await listFunction(payload);
    return result.data;
  } catch (error) {
    console.error("API Error in driveProxyList:", error);
    throw new Error(error.message);
  }
};

/**
 * [新] 呼叫後端，啟動一個 Google Drive 背景任務 (下載或更名)
 * @param {object} payload - 包含 { taskType, items, suffixOptions, projectId } 的物件
 * @returns {Promise<object>} - 後端回傳的結果 { status, taskId }
 */
export const driveProxyTask = async (payload) => {
  try {
    const taskFunction = httpsCallable(functions, 'driveProxyTask');
    const result = await taskFunction(payload);
    return result.data;
  } catch (error) {
    console.error("API Error in driveProxyTask:", error);
    throw new Error(error.message);
  }
};

// ✓ END: 新增 - Google Drive 檔案管理 API

// ✓ START: 新增 - 呼叫後端全域搜尋的 API
/**
 * [新] 呼叫後端，遞迴搜尋指定根目錄下的所有檔案
 * @param {object} payload - 包含 { rootFolderId, searchTerm } 的物件
 * @returns {Promise<object>}
 */
export const driveProxySearch = async (payload) => {
  try {
    const searchFunction = httpsCallable(functions, 'driveProxySearch');
    const result = await searchFunction(payload);
    return result.data;
  } catch (error) {
    console.error("API Error in driveProxySearch:", error);
    throw new Error(error.message);
  }
};



// ✓ START: 新增 - 呼叫後端獲取扁平化結構的 API
/**
 * [新] 呼叫後端，獲取扁平化的報告資料夾結構
 * @param {object} payload - 包含 { rootFolderId } 的物件
 * @returns {Promise<object>}
 */
export const getReportFolderStructure = async (payload) => {
  try {
    const getStructureFunction = httpsCallable(functions, 'getReportFolderStructure');
    const result = await getStructureFunction(payload);
    return result.data;
  } catch (error) {
    console.error("API Error in getReportFolderStructure:", error);
    throw new Error(error.message);
  }
};


/**
 * [新] 手動觸發後端，發送「驗屋報告未下載」的 LINE 提醒
 * @param {object} payload - 包含 { projectId } 的物件
 * @returns {Promise<object>} - 後端回傳的執行結果 { status, message }
 */
export const triggerNotDownloadedReportReminder = async (payload) => {
  try {
    const triggerFunction = httpsCallable(functions, 'sendNotDownloadedReportReminder');
    const result = await triggerFunction(payload);
    return result.data; // 直接回傳後端的回應
  } catch (error) {
    console.error("API Error in triggerNotDownloadedReportReminder:", error);
    // 將後端的 HttpsError 轉換為前端可讀的錯誤訊息
    throw new Error(error.message);
  }
};



// --- 驗屋系統設定 API ---

/**
 * 讀取使用者有權限管理的驗屋系統建案列表
 * @param {string} userKey - 使用者 ID/Key
 * @returns {Promise<Array<{id: string, name: string}>>} - 建案列表
 * @throws {Error} - 如果 userKey 無效或 Firestore 讀取失敗
 */
export async function fetchInspectionAdminProjects(userKey) {
  if (!userKey) throw new Error("需要使用者 KEY");

  console.log(`API: fetchInspectionAdminProjects using USERKEY ${userKey}`);
  try {
    const userPermissionsRef = doc(db, 'userPermissions', userKey);
    const docSnap = await getDoc(userPermissionsRef);

    if (docSnap.exists()) {
      const permissionsData = docSnap.data()?.permissions;
      if (permissionsData) {
        const allowedProjects = [];
        for (const [projectId, projectData] of Object.entries(permissionsData)) {
          // ❗ 權限檢查: Admin 是否應看到所有建案，或只限有'驗屋系統'權限的?
          // 這裡暫時假設 Admin 需要有 '驗屋系統' 權限才能管理
          if (projectData?.systems && Array.isArray(projectData.systems) && projectData.systems.includes('驗屋系統')) {
             allowedProjects.push({ id: projectId, name: projectData.projectName });
           }
        }
        allowedProjects.sort((a, b) => a.name.localeCompare(b.name, 'zh-Hant'));
        console.log('API: Fetched Accessible Projects (Inspection Admin):', allowedProjects);
        return allowedProjects;
      } else {
        console.warn('API: 使用者權限文件中找不到 permissions 欄位。');
        return []; // 回傳空陣列
      }
    } else {
      console.warn(`API: 找不到使用者 ${userKey} 的權限文件。`);
      return []; // 回傳空陣列
    }
  } catch (error) {
    console.error("API Error in fetchInspectionAdminProjects: ", error);
    throw new Error(`讀取使用者權限時發生錯誤: ${error.message}`); // 拋出錯誤
  }
}

/**
 * 讀取指定建案的棟別列表
 * @param {string} projectId - 建案 ID
 * @returns {Promise<Array<{id: string, name: string}>>} - 棟別列表
 * @throws {Error} - 如果 projectId 無效或 Firestore 讀取失敗
 */
export async function fetchBuildingsForProject(projectId) {
  if (!projectId) return []; // 如果 projectId 無效，直接回傳空陣列

  console.log(`API: fetchBuildingsForProject for project ${projectId}`);
  try {
    // ❗ 請再次確認❗ Firestore 路徑是否為 'projects/[projectId]/buildings'
    const buildingsColRef = collection(db, 'projects', projectId, 'buildings');

    // ❗ 請再次確認❗ 排序欄位 'buildingName' 是否存在？
    const q = query(buildingsColRef, orderBy('buildingName', 'asc'));

    const querySnapshot = await getDocs(q);
    console.log(`API: fetchBuildingsForProject - Firestore returned ${querySnapshot.docs.length} documents.`);

    const buildings = querySnapshot.docs.map(doc => {
      console.log(`API: fetchBuildingsForProject - Processing doc ${doc.id}, data:`, doc.data());
       return {
         id: doc.id,
         // ❗ 請再次確認❗ 棟別名稱欄位是否【確實】是 'buildingName'？
         name: doc.data().buildingName
       }
    }).filter(b => b.name); // 過濾掉 name 無效的

    console.log(`API: Fetched Buildings for ${projectId} (processed):`, JSON.parse(JSON.stringify(buildings)))
    return buildings;
  } catch (error) {
    console.error(`API Error in fetchBuildingsForProject for project ${projectId}: `, error);
    throw new Error(`讀取建案棟別時發生錯誤: ${error.message}`); // 拋出錯誤
  }
}

/**
 * 新增棟別到指定建案 (修正版：使用棟別名稱作為文件 ID)
 * @param {string} projectId - 建案 ID
 * @param {object} buildingData - 包含 { buildingName: string } 的物件
 * @returns {Promise<{id: string}>} - 新增文件的 ID (即棟別名稱)
 * @throws {Error} - 如果缺少必要資訊或 Firestore 寫入失敗
 */
export async function addBuildingToProject(projectId, buildingData) {
  if (!projectId || !buildingData?.buildingName) {
    throw new Error("缺少建案 ID 或棟別名稱");
  }

  console.log(`API: addBuildingToProject - Adding "${buildingData.buildingName}" to project ${projectId} using name as ID`);
  try {
    // 使用 buildingData.buildingName 作為文件 ID
    const buildingDocRef = doc(db, 'projects', projectId, 'buildings', buildingData.buildingName);

    // 使用 setDoc 寫入，確保使用指定的 ID
    await setDoc(buildingDocRef, {
      buildingName: buildingData.buildingName,
      createdAt: serverTimestamp() // 使用您 api.js 中已 import 的 serverTimestamp
    });

    console.log(`API: addBuildingToProject - Successfully added/updated building with ID: ${buildingDocRef.id}`);
    return { id: buildingDocRef.id }; // 回傳文件 ID (即棟別名稱)

  } catch (error) {
    console.error("API Error in addBuildingToProject: ", error);
    throw new Error(`新增棟別時發生錯誤: ${error.message}`); // 拋出錯誤
  }
}

// --- 結束 驗屋系統設定 API ---

/**
 * [API] 讀取指定建案和棟別下的所有戶別 (修正版：回傳 id 和 unitId 欄位)
 * @param {string} projectId - 建案 ID
 * @param {string} buildingId - 棟別 ID (名稱)
 * @returns {Promise<Array<{id: string, unitId: string}>>} - 包含文件ID和unitId欄位值的列表
 */
export async function fetchUnitsForBuilding(projectId, buildingId) {
  if (!projectId || !buildingId) return [];
  const unitsColRef = collection(db, 'projects', projectId, 'buildings', buildingId, 'unitId');
  const snapshot = await getDocs(unitsColRef);
  if (snapshot.empty) return [];
  // 修改：同時回傳文件 ID (doc.id) 和文件內的 unitId 欄位值 (doc.data().unitId)
  return snapshot.docs.map(doc => ({
    id: doc.id, // 文件 ID (例如 'A1-02')
    unitId: doc.data().unitId // 欄位值 (例如 'A1-0299')
  }));
}

// --- 新增 addUnitToBuilding ---
/**
 * 在指定建案和棟別下新增一個戶別
 * @param {string} projectId - 建案 ID
 * @param {string} buildingId - 棟別 ID (名稱)
 * @param {string} unitId - 要新增的戶別 ID (名稱/編號)
 * @returns {Promise<{id: string}>} - 新增戶別的 ID
 */
export async function addUnitToBuilding(projectId, buildingId, unitId) {
  if (!projectId || !buildingId || !unitId) {
    throw new Error("缺少 projectId, buildingId 或 unitId");
  }
  // 子集合為 'unitId', 文件 ID 為 unitId
  const unitDocRef = doc(db, 'projects', projectId, 'buildings', buildingId, 'unitId', unitId);
  // 文件欄位也叫 'unitId'
  await setDoc(unitDocRef, {
    unitId: unitId
    // 可以考慮加入 createdAt: serverTimestamp()
  });
  return { id: unitDocRef.id }; // 回傳 ID
}


/**
 * [API] 更新棟別名稱
 * @param {string} projectId - 建案 ID
 * @param {string} buildingId - 棟別文件 ID (即原始棟別名稱)
 * @param {string} newBuildingName - 新的棟別名稱
 * @returns {Promise<void>}
 * @throws {Error} - 如果 Firestore 更新失敗
 */
export async function updateBuildingInProject(projectId, buildingId, newBuildingName) {
  if (!projectId || !buildingId || !newBuildingName) {
    throw new Error("缺少 projectId, buildingId 或 newBuildingName");
  }
  // 文件 ID (buildingId) 保持不變，只更新 buildingName 欄位
  const buildingDocRef = doc(db, 'projects', projectId, 'buildings', buildingId);
  try {
    await updateDoc(buildingDocRef, {
      buildingName: newBuildingName // 更新 buildingName 欄位
      // 可以考慮加入 updatedAt: serverTimestamp()
    });
    console.log(`API: Updated building ${buildingId} name to ${newBuildingName}`);
  } catch (error) {
    console.error(`API Error updating building ${buildingId}: `, error);
    throw new Error(`更新棟別名稱時發生錯誤: ${error.message}`);
  }
}

/**
 * [API] 刪除棟別 (注意：目前不包含其下的戶別)
 * @param {string} projectId - 建案 ID
 * @param {string} buildingId - 棟別文件 ID (即棟別名稱)
 * @returns {Promise<void>}
 * @throws {Error} - 如果 Firestore 刪除失敗
 */
export async function deleteBuildingFromProject(projectId, buildingId) {
  if (!projectId || !buildingId) {
    throw new Error("缺少 projectId 或 buildingId");
  }
  const buildingDocRef = doc(db, 'projects', projectId, 'buildings', buildingId);
  try {
    await deleteDoc(buildingDocRef);
    console.log(`API: Deleted building ${buildingId}`);
  } catch (error) {
    console.error(`API Error deleting building ${buildingId}: `, error);
    throw new Error(`刪除棟別時發生錯誤: ${error.message}`);
  }
}

/**
 * [API] 更新戶別名稱/編號
 * @param {string} projectId - 建案 ID
 * @param {string} buildingId - 棟別 ID (名稱)
 * @param {string} unitId - 戶別文件 ID (即原始戶別名稱/編號)
 * @param {string} newUnitName - 新的戶別名稱/編號
 * @returns {Promise<void>}
 * @throws {Error} - 如果 Firestore 更新失敗
 */
export async function updateUnitInBuilding(projectId, buildingId, unitId, newUnitName) {
  if (!projectId || !buildingId || !unitId || !newUnitName) {
    throw new Error("缺少 projectId, buildingId, unitId 或 newUnitName");
  }
  // 文件 ID (unitId) 保持不變，只更新 unitId 欄位
  const unitDocRef = doc(db, 'projects', projectId, 'buildings', buildingId, 'unitId', unitId);
  try {
    await updateDoc(unitDocRef, {
      unitId: newUnitName // 更新 unitId 欄位
      // 可以考慮加入 updatedAt: serverTimestamp()
    });
    console.log(`API: Updated unit ${unitId} in building ${buildingId} to ${newUnitName}`);
  } catch (error) {
    console.error(`API Error updating unit ${unitId}: `, error);
    throw new Error(`更新戶別時發生錯誤: ${error.message}`);
  }
}

/**
 * [API] 刪除戶別
 * @param {string} projectId - 建案 ID
 * @param {string} buildingId - 棟別 ID (名稱)
 * @param {string} unitId - 戶別文件 ID (即戶別名稱/編號)
 * @returns {Promise<void>}
 * @throws {Error} - 如果 Firestore 刪除失敗
 */
export async function deleteUnitFromBuilding(projectId, buildingId, unitId) {
  if (!projectId || !buildingId || !unitId) {
    throw new Error("缺少 projectId, buildingId 或 unitId");
  }
  const unitDocRef = doc(db, 'projects', projectId, 'buildings', buildingId, 'unitId', unitId);
  try {
    await deleteDoc(unitDocRef);
    console.log(`API: Deleted unit ${unitId} from building ${buildingId}`);
  } catch (error) {
    console.error(`API Error deleting unit ${unitId}: `, error);
    throw new Error(`刪除戶別時發生錯誤: ${error.message}`);
  }
}

/**
 * [API] 呼叫後端，獲取指定建案的所有驗屋選項設定
 * @param {object} payload - 包含 { projectId }
 * @returns {Promise<object>} - 後端回傳的結果 { status, data }
 */
export const getInspectionOptions = async (payload) => {
  try {
    const getterFunction = httpsCallable(functions, 'getInspectionOptions'); // ✓ 對應後端函數名稱
    const result = await getterFunction(payload);
    return result.data; // 回傳 { status: 'success', data: optionsByType }
  } catch (error) {
    console.error("API Error in getInspectionOptions:", error);
    throw new Error(error.message); // 拋出錯誤讓 Vue 元件處理
  }
};

/**
 * [API] 呼叫後端，新增或更新一個驗屋選項
 * @param {object} payload - 包含 { projectId, optionData, optionId? }
 * @returns {Promise<object>} - 後端回傳的結果 { status, id }
 */
export const saveInspectionOption = async (payload) => {
  try {
    const saverFunction = httpsCallable(functions, 'saveInspectionOption'); // ✓ 對應後端函數名稱
    const result = await saverFunction(payload);
    return result.data; // 回傳 { status: 'success', id: '...' }
  } catch (error) {
    console.error("API Error in saveInspectionOption:", error);
    throw new Error(error.message);
  }
};

/**
 * [API] 呼叫後端，刪除一個驗屋選項 (及其子項目)
 * @param {object} payload - 包含 { optionId }
 * @returns {Promise<object>} - 後端回傳的結果 { status }
 */
export const deleteInspectionOption = async (payload) => {
  try {
    const deleterFunction = httpsCallable(functions, 'deleteInspectionOption'); // ✓ 對應後端函數名稱
    const result = await deleterFunction(payload);
    return result.data; // 回傳 { status: 'success' }
  } catch (error) {
    console.error("API Error in deleteInspectionOption:", error);
    throw new Error(error.message);
  }
};


/**
 * [API] 呼叫後端，批次匯入驗屋選項 (Excel)
 * @param {object} payload - 包含 { projectId, importData }
 * @returns {Promise<object>} - 後端回傳的結果 { status, importedCount, updatedCount, errors, message }
 */
export const batchImportInspectionOptions = async (payload) => {
  try {
    // ✓ 確認函數名稱與後端一致
    const importerFunction = httpsCallable(functions, 'batchImportInspectionOptions');
    const result = await importerFunction(payload);
    return result.data; // 直接回傳後端的結果
  } catch (error) {
    console.error("API Error in batchImportInspectionOptions:", error);
    // ✓ 將 HttpsError 的 message 提取出來拋出
    throw new Error(error.message || '批次匯入 API 呼叫失敗');
  }
};


/**
 * [API] 呼叫後端，批次更新驗屋選項的排序
 * @param {object} payload - 包含 { projectId, updates: Array<{id: string, order: number}> }
 * @returns {Promise<object>} - 後端回傳的結果 { status, message? }
 */
export const updateInspectionOptionOrders = async (payload) => {
  try {
    const updaterFunction = httpsCallable(functions, 'updateInspectionOptionOrders'); // ✓ Match backend function name
    const result = await updaterFunction(payload);
    return result.data; // Return { status: 'success', message: '...' }
  } catch (error) {
    console.error("API Error in updateInspectionOptionOrders:", error);
    throw new Error(error.message); // Rethrow error for Vue component to handle
  }
};


/**
 * [API] 呼叫後端，匯出指定建案的驗屋選項為 Excel
 * @param {object} payload - 包含 { projectId }
 * @returns {Promise<object>} - 後端回傳的結果 { status, downloadUrl }
 */
export const exportInspectionOptionsToExcel = async (payload) => {
  try {
    // ✓ 確認函數名稱與後端一致
    const exporterFunction = httpsCallable(functions, 'exportInspectionOptionsToExcel');
    const result = await exporterFunction(payload);
    return result.data; // 直接回傳後端的結果 { status: 'success', downloadUrl: '...' }
  } catch (error) {
    console.error("API Error in exportInspectionOptionsToExcel:", error);
    // ✓ 將 HttpsError 的 message 提取出來拋出
    throw new Error(error.message || '匯出 Excel API 呼叫失敗');
  }
};



/**
 * 更新指定建案的圖示 URL
 * @param {string} projectId - 建案 ID
 * @param {string} iconUrl - 新的圖檔 URL
 * @param {string} adminKey - 執行此操作的管理員 Key
 * @returns {Promise<void>}
 */
export const updateProjectIcon = async (projectId, iconUrl, adminKey) => {
  if (!projectId) throw new Error('缺少建案 ID');
  if (!iconUrl) throw new Error('缺少圖示 URL');
  if (!adminKey) throw new Error('缺少管理者金鑰');

  const projectDocRef = doc(db, 'projects', projectId);
  
  try {
    await updateDoc(projectDocRef, {
      iconUrl: iconUrl
    });
    console.log(`[api.js] Project ${projectId} iconUrl updated.`);
  } catch (error) {
    console.error(`[api.js] Failed to update project icon for ${projectId}:`, error);
    throw new Error('更新建案圖示時發生錯誤。');
  }
};


// =================================================================
// / 新增：驗屋紀錄 API
// =================================================================

/**
 * 新增一筆驗屋紀錄
 * @param {object} payload - 包含驗屋紀錄所有欄位的物件
 * @returns {Promise<object>} - 後端回傳的結果 { status, id }
 */
export async function addInspectionRecordFB(payload) { // 命名為 addInspectionRecordFB 以區分舊版 GAS API
  try {
    const addFunction = httpsCallable(functions, 'addInspectionRecord');
    const result = await addFunction(payload);
    return result.data; // 直接回傳 Cloud Function 的 { status, id }
  } catch (error) {
    console.error("API addInspectionRecordFB 錯誤:", error);
    // 將 HttpsError 轉換為前端習慣的格式
    return { status: "error", message: error.message };
  }
}

/**
 * 獲取指定戶別的所有驗屋紀錄
 * @param {string} projectId - 建案 ID
 * @param {string} unitId - 戶別 ID
 * @returns {Promise<object>} - 後端回傳的結果 { status, data: Array<object> }
 */
export async function getInspectionRecordsFB(projectId, unitId) { // 命名為 getInspectionRecordsFB
  try {
    const getFunction = httpsCallable(functions, 'getInspectionRecords');
    const result = await getFunction({ projectId, unitId });
    // 後端已將 Timestamp 轉為 ISO String，前端可直接使用
    return result.data; // 直接回傳 Cloud Function 的 { status, data }
  } catch (error) {
    console.error("API getInspectionRecordsFB 錯誤:", error);
    return { status: "error", message: error.message, data: [] }; // 發生錯誤時回傳空陣列
  }
}

// ✓ START: 請將以下函式新增到您的 api.js 中
/**
 * 獲取指定建案 (projectId) 底下所有戶別的驗屋紀錄
 * @param {string} projectId - 建案 ID
 * @returns {Promise<object>} - 後端回傳的結果 { status, data: Array<object> }
 */
export async function getInspectionRecordsForProjectFB(projectId) {
  if (!projectId) {
    return { status: 'error', message: '缺少 projectId' };
  }

  try {
    // 依照您的風格，在函式內部建立 httpsCallable 引用
    const getFunction = httpsCallable(functions, 'getInspectionRecordsForProjectFB');
    
    // 呼叫後端函式
    const result = await getFunction({ projectId });
    
    // 直接回傳後端的 { status, data }
    return result.data; 

  } catch (error) {
    console.error("API getInspectionRecordsForProjectFB 錯誤:", error);
    // 參照 getInspectionRecordsFB 的錯誤處理
    return { status: "error", message: error.message, data: [] }; 
  }
}

/**
 * 獲取指定建案的棟別與戶別結構
 * @param {string} projectId - 建案 ID
 * @returns {Promise<object>} - 後端回傳的結果 { status, data: object }
 */
export async function getProjectStructureFB(projectId) { // 命名為 getProjectStructureFB
  try {
    const getFunction = httpsCallable(functions, 'getProjectStructure');
    const result = await getFunction({ projectId });
    return result.data; // 直接回傳 Cloud Function 的 { status, data }
  } catch (error) {
    console.error("API getProjectStructureFB 錯誤:", error);
    return { status: "error", message: error.message, data: {} }; // 發生錯誤時回傳空物件
  }
}

/**
 * [修正] 更新單筆驗屋紀錄的特定欄位 (透過 Cloud Function)
 * @param {string} projectId 建案 ID
 * @param {string} unitId 戶別 ID
 * @param {string} recordId 紀錄文件 ID (自訂格式，例如 fuyu141_A1-02_...)
 * @param {object} payload 要更新的欄位 (例如 { status: '已完成', inspectorName: '...' })
 * @returns {Promise<{status: string, message?: string}>}
 */
export const updateInspectionRecordFieldFB = async (projectId, unitId, recordId, payload) => {
  // 基本參數驗證 (保留)
  console.log("[API updateInspectionRecordFieldFB] Function called with:", { projectId, unitId, recordId, payload });
  if (!projectId || !unitId || !recordId || !payload) {
    console.error("[API Error] updateInspectionRecordFieldFB: Missing required parameters.", { projectId, unitId, recordId, payload });
    return { status: 'error', message: '前端錯誤：缺少必要的更新參數' };
  }

  try {
    // 1. 獲取對 Cloud Function 的引用 (函數名稱需與 function index.js 中定義的完全一致)
    const updateFunction = httpsCallable(functions, 'updateInspectionRecordField');

    // 2. 呼叫 Cloud Function，將所有參數包裝在一個物件中傳遞
    console.log("[API Call] Calling 'updateInspectionRecordField' Cloud Function with:", { projectId, unitId, recordId, payload });
    const result = await updateFunction({
      projectId: projectId,
      unitId: unitId,
      recordId: recordId,
      payload: payload // 將 payload 物件直接傳遞
    });
    console.log("[API Response] 'updateInspectionRecordField' Cloud Function returned:", result.data);

    // 3. 直接回傳 Cloud Function 的執行結果 (Cloud Function 成功時應回傳 { status: 'success' })
    return result.data;

  } catch (error) {
    console.error("[API updateInspectionRecordFieldFB] Error calling Cloud Function:", error);
    // 4. 捕捉呼叫 Cloud Function 時發生的錯誤 (包括 HttpsError)
    console.error("[API Error] Error calling 'updateInspectionRecordField' Cloud Function:", error);
    // 將錯誤訊息傳回給前端元件
    const message = error instanceof HttpsError ? error.message : `呼叫後端更新時發生錯誤: ${error.message}`;
    return { status: 'error', message: message };
  }
};

/**
 * [新增] 更新一筆完整的驗屋紀錄 (透過 Cloud Function)
 * @param {string} recordId - 要更新的紀錄文件 ID (自訂格式)
 * @param {object} payload - 包含所有更新欄位的物件 (來自 InspectionRecordEditor)
 * @returns {Promise<{status: string, message?: string}>}
 */
export const updateInspectionRecordFB = async (recordId, payload) => {
  // 基本參數驗證
  if (!recordId || !payload) {
    console.error("[API Error] updateInspectionRecordFB: Missing required parameters.", { recordId, payload });
    return { status: 'error', message: '前端錯誤：缺少紀錄 ID 或更新資料。' };
  }

  try {
    // 1. 獲取對 Cloud Function 的引用y
    const updateFunction = httpsCallable(functions, 'updateInspectionRecord'); // ✓ 呼叫新的 CF

    // 2. 呼叫 Cloud Function
    console.log("[API Call] Calling 'updateInspectionRecord' Cloud Function with:", { recordId, payload });
    const result = await updateFunction({
      recordId: recordId,
      payload: payload // 將整個 payload 物件傳遞
    });
    console.log("[API Response] 'updateInspectionRecord' Cloud Function returned:", result.data);

    // 3. 直接回傳 Cloud Function 的執行結果
    return result.data;

  } catch (error) {
    // 4. 捕捉錯誤
    console.error("[API Error] Error calling 'updateInspectionRecord' Cloud Function:", error);
    const message = error instanceof HttpsError ? error.message : `呼叫後端更新時發生錯誤: ${error.message}`;
    return { status: 'error', message: message };
  }
};

/**
 * [新增] 刪除一筆驗屋紀錄 (透過 Cloud Function)
 * @param {string} recordId - 要刪除的紀錄文件 ID (自訂格式)
 * @returns {Promise<{status: string, message?: string}>}
 */
export const deleteInspectionRecordFB = async (recordId) => {
  // 基本參數驗證
  if (!recordId) {
    console.error("[API Error] deleteInspectionRecordFB: Missing required parameter 'recordId'.");
    return { status: 'error', message: '前端錯誤：缺少紀錄 ID。' };
  }

  try {
    // 1. 獲取對 Cloud Function 的引用
    const deleteFunction = httpsCallable(functions, 'deleteInspectionRecord'); // ✓ 呼叫新的 CF

    // 2. 呼叫 Cloud Function
    console.log("[API Call] Calling 'deleteInspectionRecord' Cloud Function with:", { recordId });
    const result = await deleteFunction({
      recordId: recordId
    });
    console.log("[API Response] 'deleteInspectionRecord' Cloud Function returned:", result.data);

    // 3. 直接回傳 Cloud Function 的執行結果
    return result.data; // 成功時應回傳 { status: 'success' }

  } catch (error) {
    // 4. 捕捉錯誤
    console.error("[API Error] Error calling 'deleteInspectionRecord' Cloud Function:", error);
    // ✓ 修改 catch 區塊，檢查 error.code
    const message = (error.code) // Firebase Functions 拋出的錯誤會有 code 屬性
      ? error.message // 如果有 code，直接取 message
      : `呼叫後端刪除時發生錯誤: ${error.message || error}`; // 否則取通用 message 或錯誤本身
    return { status: 'error', message: message };
  }
};


/**
 * 獲取指定戶別的所有 *已刪除* 驗屋紀錄
 * @param {string} projectId - 建案 ID
 * @param {string} unitId - 戶別 ID
 * @returns {Promise<object>} - 後端回傳的結果 { status, data: Array<object> }
 */
export async function getDeletedInspectionRecordsFB(projectId, unitId) {
  const functionName = 'getDeletedInspectionRecordsFB'; // For logging/error context
  try {
    const getFunction = httpsCallable(functions, functionName); // Use the correct function name
    const result = await getFunction({ projectId, unitId });
    return result.data; // Directly return { status, data }
  } catch (error) {
    console.error(`[API ${functionName}] 錯誤:`, error);
    const message = (error.code)
      ? error.message
      : `查詢已刪除紀錄時發生錯誤: ${error.message || error}`;
    return { status: "error", message: message, data: [] }; // Return empty array on error
  }
}

/**
 * 還原一筆已刪除的驗屋紀錄
 * @param {string} recordId - 要還原的紀錄文件 ID
 * @returns {Promise<object>} - 後端回傳的結果 { status }
 */
export async function restoreInspectionRecordFB(recordId) {
  const functionName = 'restoreInspectionRecordFB'; // For logging/error context
  if (!recordId) {
    console.error(`[API Error] ${functionName}: Missing required parameter 'recordId'.`);
    return { status: 'error', message: '前端錯誤：缺少紀錄 ID。' };
  }
  try {
    const restoreFunction = httpsCallable(functions, functionName); // Use the correct function name
    const result = await restoreFunction({ recordId });
    return result.data; // Directly return { status }
  } catch (error) {
    console.error(`[API ${functionName}] 錯誤:`, error);
    const message = (error.code)
      ? error.message
      : `還原紀錄時發生錯誤: ${error.message || error}`;
    return { status: "error", message: message };
  }
}



/**
 * [新增] 獲取指定建案 (projectId) 底下所有 *已刪除* 的驗屋紀錄
 * @param {string} projectId - 建案 ID
 * @returns {Promise<object>} - 後端回傳的結果 { status, data: Array<object> }
 */
export async function getDeletedInspectionRecordsForProjectFB(projectId) {
  const functionName = 'getDeletedInspectionRecordsForProjectFB'; // For logging/error context
  if (!projectId) {
    console.error(`[API Error] ${functionName}: Missing required parameter 'projectId'.`);
    return { status: 'error', message: '前端錯誤：缺少建案 ID。', data: [] };
  }
  try {
    const getFunction = httpsCallable(functions, functionName); // Use the correct function name
    const result = await getFunction({ projectId });
    return result.data; // Directly return { status, data }
  } catch (error) {
    console.error(`[API ${functionName}] 錯誤:`, error);
    const message = (error.code)
      ? error.message
      : `查詢建案已刪除紀錄時發生錯誤: ${error.message || error}`;
    return { status: "error", message: message, data: [] }; // Return empty array on error
  }
}


// =================================================================
// / 結束：驗屋紀錄 API
// =================================================================

// =================================================================
// / 新增：驗屋選項與照片上傳 API
// =================================================================

/**
 * 獲取指定建案的所有驗屋選項 (供新增/編輯畫面使用)
 * @param {string} projectId - 建案 ID
 * @returns {Promise<object>} - 後端回傳的結果 { status, data: object }
 */
export async function getInspectionOptionsForProjectFB(projectId) {
  try {
    const getFunction = httpsCallable(functions, 'getInspectionOptionsForProject');
    const result = await getFunction({ projectId });
    return result.data; // 直接回傳 Cloud Function 的 { status, data }
  } catch (error) {
    console.error("API getInspectionOptionsForProjectFB 錯誤:", error);
    return { status: "error", message: error.message, data: {} }; // 發生錯誤時回傳空物件
  }
}

/**
 * 上傳單張驗屋照片
 * @param {string} projectId
 * @param {string} unitId
 * @param {File} fileObject - 經過 PhotoEditor 處理後的 File 物件
 * @returns {Promise<object>} - 後端回傳的結果 { status, name, url, path } 或 { status: 'error', message }
 */
export async function uploadInspectionPhotoFB(projectId, unitId, fileObject) {
  try {
    // 1. 將 File 物件轉為 Base64 (移除 dataURL 前綴)
    const base64Content = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(fileObject);
        reader.onload = () => resolve(reader.result.toString().split(',')[1]);
        reader.onerror = error => reject(error);
    });

    // 2. 呼叫 Cloud Function
    const uploadFunction = httpsCallable(functions, 'uploadInspectionPhoto');
    const result = await uploadFunction({
      projectId,
      unitId,
      fileName: fileObject.name,
      fileBase64: base64Content
    });
    return result.data; // 直接回傳 Cloud Function 的 { status, name, url, path }

  } catch (error) {
    console.error("API uploadInspectionPhotoFB 錯誤:", error);
    return { status: "error", message: error.message || "上傳照片失敗" };
  }
}

// =================================================================
// / 結束：驗屋選項與照片上傳 API
// =================================================================





//客戶驗屋報告相關 API

/**
 * [API] 呼叫後端，獲取指定戶別最新的有效預約資料中的買方資訊
 * @param {object} payload - 包含 { projectId, unitId }
 * @returns {Promise<object>} - 後端回傳的結果 { status, data: { bookerName, bookerEmail, bookerPhone } } 或 { status: 'error', message }
 */
export const getCustomerAppointmentDetails = async (payload) => {
  // 函數名稱，用於日誌
  const functionName = 'getCustomerAppointmentDetails';
  try {
    // 獲取 Cloud Function 的引用
    const getterFunction = httpsCallable(functions, functionName); // ✓ 使用後端函式名稱
    // 呼叫 Cloud Function 並傳遞 payload
    const result = await getterFunction(payload);
    // 直接回傳 Cloud Function 的執行結果 (包含 status 和 data)
    return result.data;
  } catch (error) {
    // 捕捉呼叫 Cloud Function 時的錯誤 (包括 HttpsError)
    console.error(`API Error in ${functionName}:`, error);
    // 將錯誤訊息回傳給前端元件
    const message = (error.code) ? error.message : `呼叫後端 ${functionName} 時發生錯誤: ${error.message || error}`;
    return { status: "error", message: message }; // 維持一致的回傳格式
  }
};

/**
 * [API] 呼叫後端，儲存客戶的驗屋報告確認簽名
 * @param {object} payload - 包含 { projectId, unitId, confirmationBatchId, buyerInfo, signatureImageBase64 }
 * @returns {Promise<object>} - 後端回傳的結果 { status, confirmationId } 或 { status: 'error', message }
 */
export const saveCustomerConfirmation = async (payload) => {
  // 函數名稱，用於日誌
  const functionName = 'saveCustomerConfirmation';
  try {
    // 獲取 Cloud Function 的引用
    const saveFunction = httpsCallable(functions, functionName); // ✓ 使用後端函式名稱
    // 呼叫 Cloud Function 並傳遞 payload
    const result = await saveFunction(payload);
    // 直接回傳 Cloud Function 的執行結果
    return result.data;
  } catch (error) {
    // 捕捉呼叫 Cloud Function 時的錯誤
    console.error(`API Error in ${functionName}:`, error);
    // 將錯誤訊息回傳給前端元件
    const message = (error.code) ? error.message : `呼叫後端 ${functionName} 時發生錯誤: ${error.message || error}`;
    return { status: "error", message: message };
  }
};


// ✓ START: 新增 - 呼叫後端產生分享連結的 API
/**
 * [API] 呼叫後端，產生一個有時效性的客戶驗屋報告分享連結
 * @param {object} payload - 包含 { projectId, unitId }
 * @returns {Promise<object>} - { status, shareUrl } 或 { status: 'error', message }
 */
export const generateShareableUrl = async (payload) => {
  const functionName = 'generateShareableUrl';
  try {
    const generateFunction = httpsCallable(functions, functionName);
    const result = await generateFunction(payload);
    return result.data; // 直接回傳後端的 { status, shareUrl }
  } catch (error) {
    console.error(`API Error in ${functionName}:`, error);
    const message = (error.code) ? error.message : `呼叫後端 ${functionName} 時發生錯誤: ${error.message || error}`;
    return { status: "error", message: message };
  }
};
// ✓ END: 新增函式


// ✓ START: 新增 - 呼叫後端驗證分享連結 Token 的 API
/**
 * [API] 呼叫後端，驗證客戶驗屋報告的分享 Token
 * @param {object} payload - 包含 { token }
 * @returns {Promise<object>} - { status, data: { projectId, unitId } } 或 { status: 'error', message }
 */
export const validateReportTokenAPI = async (payload) => {
  const functionName = 'validateReportToken';
  try {
    const validateFunction = httpsCallable(functions, functionName);
    const result = await validateFunction(payload);
    return result.data; // 直接回傳後端的 { status, data }
  } catch (error) {
    console.error(`API Error in ${functionName}:`, error);
    const message = (error.code) ? error.message : `呼叫後端 ${functionName} 時發生錯誤: ${error.message || error}`;
    return { status: "error", message: message };
  }
};
// ✓ END: 新增函式


/**
 * [API] 呼叫後端，獲取指定戶別已確認簽名的驗屋批次列表
 * @param {object} payload - 包含 { projectId, unitId }
 * @returns {Promise<object>} - { status, data: Array } 或 { status: 'error', message }
 */
export const getConfirmedInspectionBatches = async (payload) => {
  const functionName = 'getConfirmedInspectionBatches';
  try {
    const getterFunction = httpsCallable(functions, functionName);
    const result = await getterFunction(payload);
    return result.data; // 直接回傳後端的 { status, data }
  } catch (error) {
    console.error(`API Error in ${functionName}:`, error);
    const message = (error.code) ? error.message : `呼叫後端 ${functionName} 時發生錯誤: ${error.message || error}`;
    // 回傳包含 data: [] 以避免前端在解構時出錯
    return { status: "error", message: message, data: [] };
  }
};


/**
 * [API] 呼叫後端，觸發產製驗屋報告 PDF 的背景任務
 * @param {object} payload - 包含 { projectId, unitId, confirmationBatchId, inspectorName, triggeringUserEmail }
 * @returns {Promise<object>} - { status: 'processing', message: '...' } 或 { status: 'error', message }
 */
export const generateInspectionPdf = async (payload) => {
  const functionName = 'generateInspectionPdf';
  try {
    // 獲取 Cloud Function 的引用
    const generatorFunction = httpsCallable(functions, functionName);
    // 呼叫 Cloud Function 並傳遞 payload
    const result = await generatorFunction(payload);
    // 直接回傳後端的執行結果 (預期是 { status: 'processing', message: '...' })
    return result.data;
  } catch (error) {
    // 捕捉呼叫 Cloud Function 時的錯誤
    console.error(`API Error in ${functionName}:`, error);
    // 將錯誤訊息回傳給前端元件
    const message = (error.code) ? error.message : `呼叫後端 ${functionName} 時發生錯誤: ${error.message || error}`;
    return { status: "error", message: message };
  }
};

/**
 * [API] 呼叫後端記錄 Standby 人員狀態變更歷史
 * @param {object} logData - 包含 { projectId, personnelId, personnelName, previousStatus, newStatus, startTime, endTime, operator }
 * @returns {Promise<object>} - 後端回傳的結果 { status, logId } 或錯誤
 */
export const logStandbyStatusChangeAPI = async (logData) => {
  try {
    // ✓ 確認 functions 實例已正確初始化 (可能在 firebase.js 或 api.js 頂部)
    const logFunction = httpsCallable(functions, 'logStandbyStatusChange');
    const result = await logFunction(logData);
    return result.data; // 直接回傳 Cloud Function 的結果
  } catch (error) {
    console.error("API Error in logStandbyStatusChangeAPI:", error);
    // ✓ 將 HttpsError 的 message 提取出來拋出，方便前端處理
    throw new Error(error.message || '記錄狀態變更時發生錯誤');
  }
};


/**
 * [API][修正版] 獲取指定建案下，具有報價或銷控系統權限的人員列表
 * @param {string} projectId - 建案 ID
 * @returns {Promise<Array<{id: string, name: string}>>} - 人員列表
 */
export const fetchPotentialPersonnelAPI = async (projectId) => {
  if (!projectId) return [];
  try {
    const permissionsRef = collection(db, "userPermissions");
    // 暫時先撈取所有權限文件 (保持不變)
    const q = query(permissionsRef);
    const snapshot = await getDocs(q);
    console.log(`[API fetchPotentialPersonnelAPI] Firestore snapshot size for ${projectId}: ${snapshot.size}`);

    const personnel = [];
    snapshot.forEach(doc => {
      // 直接從文件頂層讀取 userName
      const docData = doc.data();
      const userName = docData.userName; // <--- 修改點：從頂層讀取
      const perms = docData.permissions || {};
      const projectPerm = perms[projectId]; // ✓ 檢查 projectId 是否存在於 permissions Map 中

      console.log(`[API fetchPotentialPersonnelAPI] Processing doc ${doc.id}, userName: ${userName}`);
      console.log(`[API fetchPotentialPersonnelAPI] ProjectPerm for ${projectId}:`, projectPerm);

      // 條件修改：檢查 projectPerm 是否存在，userName 是否存在，
      //   以及 projectPerm.systems 是否包含所需權限
      if (projectPerm && userName && Array.isArray(projectPerm.systems)) {
         console.log(`[API fetchPotentialPersonnelAPI] Checking systems for ${userName}:`, projectPerm.systems);
        if (projectPerm.systems.includes('銷售StandBy') ) {
           personnel.push({ id: doc.id, name: userName }); // ✓ 使用從頂層讀取的 userName
           console.log(`[API fetchPotentialPersonnelAPI] Added: ${userName}`);
        }
      }
    });

    personnel.sort((a, b) => a.name.localeCompare(b.name, 'zh-Hant'));
    console.log('[API fetchPotentialPersonnelAPI] Final personnel list:', personnel);
    return personnel;

  } catch (error) {
    console.error(`API Error fetching potential personnel for ${projectId}:`, error);
    throw new Error(`獲取人員列表時發生錯誤: ${error.message}`);
  }
};

/**
 * [API] 獲取 Standby 看板的設定 (包含所有欄位)
 * @param {string} projectId - 建案 ID
 * @returns {Promise<object>} - 返回完整的設定物件
 */
export const fetchStandbyConfigAPI = async (projectId) => {
  // ✅ [修改] 定義一個包含 *所有* 欄位預設值的物件
  const defaultConfig = {
    visiblePersonnelIds: [],
    colors: {},
    alertThresholdMinutes: 120 // 預設 120 分鐘
  };

  if (!projectId) {
    console.warn("fetchStandbyConfigAPI called without projectId");
    return defaultConfig; // ✅ 回傳完整的預設物件
  }

  try {
    const configDocRef = doc(db, "standbyConfig", projectId);
    const docSnap = await getDoc(configDocRef);

    if (docSnap.exists()) {
      const data = docSnap.data();
      
      // ✅ [核心修正]
      // 使用預設值打底，並用 Firestore 的資料覆蓋
      // 這樣能確保 'alertThresholdMinutes' 總是存在
      return {
        ...defaultConfig, // 先載入預設值
        ...data           // 再用 Firestore 的資料覆蓋
      };

    } else {
      // ✅ [修改] 如果文件不存在，也回傳完整的預設物件
      console.log(`No standby config found for ${projectId}, returning defaults.`);
      return defaultConfig;
    }
  } catch (error) {
    console.error(`API Error fetching standby config for ${projectId}:`, error);
    throw new Error(`讀取看板設定時發生錯誤: ${error.message}`);
  }
};

/**
 * ✅ [修改後的正確版本] 儲存看板設定 (接受一個 configObject)
 * @param {string} projectId - 建案 ID
 * @param {object} configObject - 包含所有設定的物件 
 * (例如: { visiblePersonnelIds: [], colors: {}, alertThresholdMinutes: 120 })
 */
export const saveStandbyConfigAPI = async (projectId, configObject) => {
  if (!projectId) {
    return { status: 'error', message: '缺少 projectId' };
  }
  
  // 驗證 configObject
  if (!configObject || typeof configObject !== 'object' || Array.isArray(configObject)) {
     return { status: 'error', message: '無效的設定資料 (configObject)' };
  }

  try {
    const configDocRef = doc(db, "standbyConfig", projectId);
    
    // ✅ [核心修改] 
    // 將傳入的 configObject 完整儲存
    // 並總是覆蓋/新增 updatedAt 時間戳
    await setDoc(configDocRef, {
      ...configObject, // 展開 configObject (包含 visiblePersonnelIds, colors, alertThresholdMinutes)
      updatedAt: serverTimestamp() 
    }, { merge: true }); // merge: true 確保安全更新

    return { status: 'success' };
  } catch (error) {
    console.error(`API Error saving standby config for ${projectId}:`, error);
    return { status: 'error', message: `儲存看板設定時發生錯誤: ${error.message}` };
  }
};

/**
 * [API] 呼叫後端更新 Standby 人員狀態
 * @param {string} projectId
 * @param {string} personnelId
 * @param {object} updates - 要更新的欄位物件 (e.g., { status: 'away', currentStatusStartTime: 'serverTimestamp' })
 * @returns {Promise<object>} - 後端回傳的結果 { status } 或錯誤
 */
export const updateStandbyStatusAPI = async (projectId, personnelId, updates) => {
  try {
    const updateFunction = httpsCallable(functions, 'updateStandbyStatus');
    // 將 rtdbServerTimestamp() 轉換為字串 'serverTimestamp' 傳給後端
    const finalUpdates = { ...updates };
    if (finalUpdates.currentStatusStartTime === rtdbServerTimestamp()) {
        finalUpdates.currentStatusStartTime = 'serverTimestamp';
    }
    const result = await updateFunction({ projectId, personnelId, updates: finalUpdates });
    return result.data;
  } catch (error) {
    console.error("API Error in updateStandbyStatusAPI:", error);
    throw new Error(error.message || '更新人員狀態時發生錯誤');
  }
};

/**
 * [API] 呼叫後端同步 Firestore 設定中的人員到 RTDB (僅新增)
 * @param {string} projectId
 * @param {object} personnelToAdd - 要新增的人員物件 (格式: { personnelId: { name, status, zone, order, currentStatusStartTime: 'serverTimestamp' } })
 * @returns {Promise<object>} - 後端回傳的結果 { status, addedCount } 或錯誤
 */
export const syncStandbyPersonnelAPI = async (projectId, personnelToAdd) => {
  try {
    const syncFunction = httpsCallable(functions, 'syncStandbyPersonnel');
    const result = await syncFunction({ projectId, personnelToAdd });
    return result.data;
  } catch (error) {
    console.error("API Error in syncStandbyPersonnelAPI:", error);
    throw new Error(error.message || '同步人員狀態時發生錯誤');
  }
};

/**
 * [API] 呼叫後端批次更新 Standby 人員狀態 (用於拖曳操作)
 * @param {string} projectId
 * @param {object} updates - 要更新的多個路徑及其值的物件 (路徑相對於 personnel 節點)
 * e.g., { "personnelId1/order": 1, "personnelId2/zone": "serving", "personnelId2/status": "serving" }
 * @returns {Promise<object>} - 後端回傳的結果 { status } 或錯誤
 */
export const updateStandbyBatchAPI = async (projectId, updates) => {
  try {
    const updateFunction = httpsCallable(functions, 'updateStandbyBatch');
    // 檢查 updates 物件中是否有 rtdbServerTimestamp()，並替換為 'serverTimestamp'
    const processedUpdates = {};
    for (const path in updates) {
        const value = updates[path];
        if (value === rtdbServerTimestamp()) {
            processedUpdates[path] = 'serverTimestamp';
        } else {
            processedUpdates[path] = value;
        }
    }
    const result = await updateFunction({ projectId, updates: processedUpdates });
    return result.data;
  } catch (error) {
    console.error("API Error in updateStandbyBatchAPI:", error);
    throw new Error(error.message || '批次更新看板狀態時發生錯誤');
  }
};


/**
 * [API] 呼叫後端截圖並儲存 Standby 看板畫面
 * @param {object} payload - 包含 { projectId, timestampStr, operatorName, imageData }
 * @returns {Promise<object>} - 後端回傳的結果 { status, message?, imageUrl? } 或錯誤
 */
export const saveStandbyScreenshotAPI = async (payload) => { // 新增函數
  try {
    const saveFunction = httpsCallable(functions, 'saveStandbyScreenshot');
    const result = await saveFunction(payload);
    return result.data; // 直接回傳 Cloud Function 的結果
  } catch (error) {
    console.error("API Error in saveStandbyScreenshotAPI:", error);
    // 將 HttpsError 的 message 提取出來拋出
    throw new Error(error.message || '呼叫儲存截圖 API 時發生錯誤');
  }
};


/**
 * [API] 獲取指定專案的截圖歷史紀錄
 * @param {string} projectId - 專案 ID
 * @returns {Promise<Array<object>>} - 截圖物件陣列
 */
export const fetchStandbyScreenshotsAPI = async (projectId) => { // 新增函數
  try {
    const fetchFunction = httpsCallable(functions, 'fetchStandbyScreenshots');
    const result = await fetchFunction({ projectId });
    
    // Cloud Function 回傳 { status: "success", screenshots: [...] }
    if (result.data.status === 'success') {
      return result.data.screenshots; // 直接回傳陣列
    } else {
      throw new Error(result.data.message || '獲取截圖列表時後端回報錯誤');
    }
  } catch (error) {
    console.error("API Error in fetchStandbyScreenshotsAPI:", error);
    throw new Error(error.message || '呼叫獲取截圖 API 時發生錯誤');
  }
};


// =================================================================
// /  【新增/修改】車位平面圖管理 API (移自 ParkingFloorplanManager.vue)
// =================================================================

/**
 * [API] 獲取指定建案的所有平面圖列表
 * @param {string} projectId - 專案 ID
 * @returns {Promise<object>} - 後端回傳的原始 result.data
 */
export async function getFloorPlansAPI(projectId) { // 稍微改名避免衝突
  try {
    const getterFunction = httpsCallable(functions, 'getFloorPlans');
    const result = await getterFunction({ projectId });
    // 後端回傳 { status: 'success', data: floorPlans }
    return result.data;
  } catch (error) {
    console.error(`API Error in getFloorPlansAPI (Project: ${projectId}):`, error);
    throw new Error(error.message || '獲取平面圖列表失敗');
  }
}

/**
 * [API] 獲取專案的所有樓層清單 (供平面圖管理器使用)
 * @param {string} projectId - 專案 ID
 * @returns {Promise<object>} - 後端回傳的原始 result.data
 */
export async function getProjectFloorsForManager(projectId) {
  try {
    const getFloorsFunc = httpsCallable(functions, 'getProjectFloors');
    const result = await getFloorsFunc({ projectId });
    // 後端回傳 { status, data, message?, totalFloors?, existingFloorPlans? }
    return result.data;
  } catch (error) {
    console.error(`API Error in getProjectFloorsForManager (Project: ${projectId}):`, error);
    throw new Error(error.message || '獲取樓層清單失敗');
  }
}

/**
 * [API] 建立新的平面圖
 * @param {object} payload - 包含 { projectId, name, description, floor, backgroundImageUrl, isActive }
 * @returns {Promise<object>} - 後端回傳的原始 result.data
 */
export async function createFloorPlanAPI(payload) { // 稍微改名避免衝突
  try {
    const creatorFunction = httpsCallable(functions, 'createFloorPlan');
    const result = await creatorFunction(payload);
    // 後端回傳 { status, floorPlanId, message }
    return result.data;
  } catch (error) {
    console.error(`API Error in createFloorPlanAPI:`, error);
    throw new Error(error.message || '建立平面圖失敗');
  }
}

/**
 * [API] 更新平面圖基本資訊
 * @param {object} payload - 包含 { floorPlanId, projectId?, name?, description?, floor?, backgroundImageUrl?, isActive? }
 * @returns {Promise<object>} - 後端回傳的原始 result.data
 */
export async function updateFloorPlanAPI(payload) { // 稍微改名避免衝突
  try {
    const updaterFunction = httpsCallable(functions, 'updateFloorPlan');
    const result = await updaterFunction(payload);
    // 後端回傳 { status, message }
    return result.data;
  } catch (error) {
    console.error(`API Error in updateFloorPlanAPI (ID: ${payload?.floorPlanId}):`, error);
    throw new Error(error.message || '更新平面圖失敗');
  }
}

/**
 * [API] 刪除平面圖（包含所有相關的車位佈局）
 * @param {string} floorPlanId - 要刪除的平面圖 ID
 * @returns {Promise<object>} - 後端回傳的原始 result.data
 */
export async function deleteFloorPlanAPI(floorPlanId) { // 稍微改名避免衝突
  try {
    const deleterFunction = httpsCallable(functions, 'deleteFloorPlan');
    const result = await deleterFunction({ floorPlanId });
    // 後端回傳 { status, message }
    return result.data;
  } catch (error) {
    console.error(`API Error in deleteFloorPlanAPI (ID: ${floorPlanId}):`, error);
    throw new Error(error.message || '刪除平面圖失敗');
  }
}

/**
 * [API] 批量保存車位佈局（呼叫 Cloud Function）
 * @param {string} floorPlanId - 平面圖 ID
 * @param {Array<object>} layouts - 佈局項目陣列
 * @param {string} projectId - 專案 ID
 * @returns {Promise<object>} - { status, message }
 */
export async function saveSpotLayoutsAPI(floorPlanId, layouts, projectId) { 
  const functionName = `saveSpotLayoutsAPI (via CF)`;
  
  // START: 請加入這個 console.log
  console.log(`[API] 準備呼叫 Cloud Function 'saveSpotLayouts'，Payload 內容：`, JSON.stringify({ floorPlanId, layouts, projectId }, null, 2));
  // END: 加入 console.log

  try {
    const saveFunction = httpsCallable(functions, 'saveSpotLayouts'); // ✓ 呼叫後端函式
    const result = await saveFunction({ floorPlanId, layouts, projectId });
    
    console.log(`[${functionName}] Cloud Function 回應:`, result.data);
    return result.data; // 直接回傳後端的 { status, message }

  } catch (error) {
    console.error(`[${functionName}] 呼叫 'saveSpotLayouts' 失敗:`, error);
    throw new Error(`儲存佈局失敗: ${error.message}`);
  }
}


/**
 * [API] 獲取特定平面圖的所有車位佈局 (包含背景圖位置)
 * @param {string} floorPlanId - 平面圖 ID
 * @param {string} projectId - 專案 ID
 * @returns {Promise<object>} - 後端回傳的原始 result.data
 */
export async function getSpotLayoutsAPI(floorPlanId, projectId) { // 稍微改名避免衝突
  try {
    const getterFunction = httpsCallable(functions, 'getSpotLayouts');
    const result = await getterFunction({ floorPlanId, projectId });
    // 後端回傳 { status, layouts }
    return result.data;
  } catch (error) {
    console.error(`API Error in getSpotLayoutsAPI (FloorPlan: ${floorPlanId}):`, error);
    throw new Error(error.message || '獲取佈局失敗');
  }
}

/**
 * [API] 根據 projectId 和 floor 查詢 salesParkings 車位資料 (供平面圖使用)
 * @param {string} projectId - 專案 ID
 * @param {string} floor - 樓層 (字串)
 * @returns {Promise<object>} - 後端回傳的原始 result.data { success, total, preview, allData, debug? }
 */
export async function getSalesParkingsByFloorForManager(projectId, floor) { // 加上 ForManager 後綴
  try {
    const getterFunction = httpsCallable(functions, 'getSalesParkingsByFloor'); // 後端函式名稱
    const result = await getterFunction({ projectId, floor });
    // 直接回傳後端的 result.data
    return result.data;
  } catch (error) {
    console.error(`API Error in getSalesParkingsByFloorForManager (Project: ${projectId}, Floor: ${floor}):`, error);
    // 拋出錯誤，讓 Vue 元件可以捕捉並處理
    throw new Error(error.message || '查詢車位資料失敗');
  }
}



// --- START: ✓ 修改附件圖片上傳 API ---
/**
 * [修改版] 呼叫 Cloud Function 上傳附件圖片
 * @param {string} projectId - 建案 ID
 * @param {File} file - 原始 File 物件
 * @returns {Promise<object>} - { name, url, path }
 * @throws {Error} - 上傳失敗時拋出錯誤
 */
export const uploadAttachmentImage = async (projectId, file) => {
  if (!projectId || !file) {
    throw new Error('缺少 projectId 或檔案');
  }
  const functionName = 'uploadAttachmentImage (via CF)'; // 用於 Log

  try {
    // 1. 將 File 物件轉為 Base64 (移除 dataURL 前綴)
    const fileBase64 = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result.toString().split(',')[1]);
      reader.onerror = error => reject(error);
    });

    // 2. 獲取 Cloud Function 的引用
    const uploader = httpsCallable(functions, 'handleAttachmentUpload'); // ✓ 對應後端函數名稱

    // 3. 呼叫 Cloud Function
    console.log(`[${functionName}] Calling CF for ${file.name}...`);
    const result = await uploader({
      projectId: projectId,
      fileName: file.name,
      fileBase64: fileBase64
    });

    // 4. 檢查後端回傳狀態並返回結果
    if (result.data.status === 'success') {
      console.log(`[${functionName}] CF upload successful for ${file.name}.`);
      return result.data; // 返回 { status, name, url, path }
    } else {
      // 如果後端回報 status: 'error'
      throw new Error(result.data.message || `Cloud Function 回報上傳錯誤`);
    }

  } catch (error) {
    console.error(`[${functionName}] 上傳附件 ${file.name} 失敗:`, error);
    // 將 HttpsError 或其他錯誤的 message 提取出來拋出
    throw new Error(error.message || `上傳附件 ${file.name} 失敗`);
  }
};
// --- END: ✓ 修改附件圖片上傳 API ---

// --- START: ✓ 修改附件圖片刪除 API (呼叫 Cloud Function) ---
/**
 * [修改版] 呼叫 Cloud Function 從 Firebase Storage 刪除附件圖片
 * @param {string} storagePath - 檔案在 Storage 中的完整路徑
 * @returns {Promise<void>} // Cloud Function 成功時 resolve, 失敗時 reject
 * @throws {Error} - 呼叫失敗時拋出錯誤
 */
export const deleteAttachmentImage = async (storagePath) => {
  if (!storagePath) {
    throw new Error('缺少儲存路徑');
  }
  const functionName = 'deleteAttachmentImage (via CF)'; // 用於 Log

  try {
    // 1. 獲取 Cloud Function 的引用
    const deleter = httpsCallable(functions, 'handleAttachmentDelete'); // ✓ 對應後端函數名稱

    // 2. 呼叫 Cloud Function
    console.log(`[${functionName}] Calling CF to delete ${storagePath}...`);
    const result = await deleter({ storagePath: storagePath }); // ✓ 將路徑作為參數傳遞

    // 3. 檢查後端回傳狀態
    if (result.data.status === 'success') {
      console.log(`[${functionName}] CF deletion successful for ${storagePath}.`);
      // 成功時 Cloud Function resolve，這裡不需要額外做什麼
    } else {
      // 如果後端回報 status: 'error'
      throw new Error(result.data.message || `Cloud Function 回報刪除錯誤`);
    }

  } catch (error) {
    console.error(`[${functionName}] 刪除附件 ${storagePath} 失敗:`, error);
    // 將 HttpsError 或其他錯誤的 message 提取出來拋出
    throw new Error(error.message || `刪除附件 ${storagePath} 失敗`);
  }
};
// --- END: ✓ 修改附件圖片刪除 API ---


// --- START: ✓ 新增 - 獲取人員管理頁面初始資料 API ---
/**
 * [API] 呼叫後端，獲取人員管理頁面所需的所有初始資料
 * @param {string} adminKey - 當前管理員的手機號碼
 * @returns {Promise<object>} - 後端回傳的包含所有初始資料的物件
 */
export const fetchUserManagementInitialData = async (adminKey) => {
  const functionName = 'fetchUserManagementInitialData'; // 用於 Log
  if (!adminKey) {
      // 可以選擇拋出錯誤或返回錯誤狀態
      console.error(`[${functionName}] 錯誤：缺少 adminKey。`);
      return { status: "error", message: "缺少管理者金鑰" };
      // throw new Error("缺少管理者金鑰");
  }
  try {
    const getterFunction = httpsCallable(functions, 'getUserManagementInitialData'); // ✓ 對應後端函數名稱
    const result = await getterFunction({ adminKey: adminKey }); // ✓ 將 adminKey 作為參數傳遞
    // 後端成功時會回傳 { status: 'success', data: { ... } }
    // 後端失敗時會拋出 HttpsError，會被下面的 catch 捕捉
    return result.data; // ✓ 直接回傳後端的 data 物件 (包含 status 和 data)
  } catch (error) {
    console.error(`API Error in ${functionName}:`, error);
    // 將 HttpsError 的 message 或其他錯誤訊息包裝回傳
    const message = (error instanceof HttpsError || error.code) ? error.message : `呼叫後端 ${functionName} 時發生錯誤: ${error.message || error}`;
    return { status: "error", message: message }; // ✓ 回傳錯誤狀態
  }
};
// --- END: ✓ 新增 - 獲取人員管理頁面初始資料 API ---


/**
 * [LIFF用] 獲取新增/編輯預約時所需的下拉選單等選項
 * (V2: 呼叫 liffCalendarApi 路由)
 * @param {string} projectId 
 * @returns {Promise<object>}
 */
export async function liffFetchBookingOptions(projectId) {
  try {
    const result = await liffCalendarApiRouter({
        action: 'fetchBookingOptions',
        data: { projectId }
    });
    // 後端 _handleFetchBookingOptions 會直接回傳 { inspectionMethods, ... }
    return result.data; 
  } catch (error) {
    console.error(`LIFF 獲取預約選項時發生錯誤 (Project ID: ${projectId}):`, error);
    throw new Error(error.message || '獲取預約選項失敗');
  }
}

/**
 * [LIFF用] 更新預約紀錄
 * (V2: 呼叫 liffCalendarApi 路由)
 */
export async function liffUpdateAppointment(appointmentId, bookingUpdatePayload, householdDocId, householdUpdatePayload, force = false) { 
  try {
    const result = await liffCalendarApiRouter({
        action: 'updateAppointment',
        data: {
          appointmentId,
          bookingPayload: bookingUpdatePayload,
          householdDocId,
          householdPayload: householdUpdatePayload,
          force: force 
        }
    });
    return result.data; 
  } catch (error) {
    console.error("API liffUpdateAppointment 錯誤:", error);
    throw new Error(error.message);
  }
}

/**
 * [LIFF用] 取消一筆預約
 * (V2: 呼叫 liffCalendarApi 路由)
 */
export async function liffCancelAppointment(appointmentId, projectId, unitId, bookingType) {
  if (!appointmentId || !projectId || !unitId || !bookingType) {
    return { status: 'error', message: '前端錯誤：缺少取消預約所需的參數。' };
  }
  
  try {
    const result = await liffCalendarApiRouter({
        action: 'cancelAppointment',
        data: {
          appointmentId,
          projectId,
          unitId,
          bookingType
        }
    });
    return result.data;
  } catch (error) {
    console.error("API liffCancelAppointment 錯誤:", error);
    return { status: 'error', message: error.message };
  }
}

/**
 * [LIFF用] 僅更新單筆預約紀錄的驗屋人員欄位
 * (V2: 呼叫 liffCalendarApi 路由)
 */
export async function liffUpdateAppointmentInspectors(appointmentId, inspectors) {
  if (!appointmentId) throw new Error("缺少預約 ID。");
  
  try {
    const result = await liffCalendarApiRouter({
        action: 'updateAppointmentInspectors',
        data: {
            appointmentId,
            inspectors
        }
    });
    return result.data;
  } catch (e) {
      console.error("API liffUpdateAppointmentInspectors 錯誤:", e);
      throw new Error(e.message || '更新驗屋人員失敗');
  }
}

/**
 * [LIFF用] 獲取行事曆所需的所有日期及其分類
 * (V2: 呼叫 liffCalendarApi 路由)
 * @param {object} payload - 包含 { projectId, unitId }
 * @returns {Promise<object>} - 後端回傳的結果
 */
export const liffGetAdminBookingCalendarData = async (payload) => {
  try {
    const result = await liffCalendarApiRouter({
        action: 'getAdminBookingCalendarData',
        data: payload
    });
    return result.data;
  } catch (error) {
    console.error("API Error in liffGetAdminBookingCalendarData:", error);
    throw new Error(error.message);
  }
};


/**
 * 儲存報價單版型
 * @param {string} projectId 
 * @param {object} templateData 
 * @returns {Promise<object>} 
 */
export async function saveQuotationTemplate(projectId, templateData) {
  if (!projectId || !templateData) {
    return { status: 'error', message: '前端錯誤：缺少 projectId 或 templateData' };
  }
  
  try {
    // ✅ [打勾] 修正：移除 'data:' 包裝，直接擴展
    const result = await salesApiRouter({
        action: 'saveQuotationTemplate',
        projectId, 
        templateData 
    });
    return result.data;
  } catch (error) {
    console.error("API saveQuotationTemplate 錯誤:", error);
    return { status: 'error', message: error.message };
  }
}


// ✅ [打勾] 新增：讀取版型的函數
/**
 * 讀取報價單版型
 * @param {string} projectId 
 * @returns {Promise<object>} 
 */
export async function loadQuotationTemplate(projectId) {
  if (!projectId) {
    return { status: 'error', message: '前端錯誤：缺少 projectId' };
  }
  
  try {
    // ✅ [打勾] 修正：移除 'data:' 包裝
    const result = await salesApiRouter({
        action: 'loadQuotationTemplate',
        projectId // 直接傳遞
    });
    return result.data;
  } catch (error) {
    console.error("API loadQuotationTemplate 錯誤:", error);
    return { status: 'error', message: error.message };
  }
}


// ✓ START: 新增 - 匯出 PDF 的 API
/**
 * [API] 呼叫後端，將已確認的 Sheet 副本匯出為 PDF
 * @param {object} payload - 包含 sheetIdToExport, projectId, unitId 等...
 * @returns {Promise<object>} - { status, url }
 */
export const exportSheetToPdf = async (payload) => {
  try {
    const exportFunc = httpsCallable(functions, 'exportSheetToPdf');
    const result = await exportFunc(payload);
    return result.data; // 直接回傳後端 { status, url }
  } catch (error) {
    console.error("API Error in exportSheetToPdf:", error);
    throw new Error(error.message || '匯出 PDF 失敗');
  }
};
// ✓ END: 新增 API


// =================================================================
// /  【修改】客資系統設定 API (V2 - MUX)
// =================================================================

/**
 * [API] 獲取指定建案的客資系統欄位設定 (V2: MUX)
 * @param {string} projectId - 專案 ID
 * @returns {Promise<object|null>} - 返回設定物件，若不存在則返回 null
 */
export const fetchCustomerSettings = async (projectId) => {
  if (!projectId) return null;
  
  try {
    // ✓ MUX: 呼叫 customerApiRouter
    const result = await customerApiRouter({
        action: 'fetchCustomerSettings',
        data: { projectId } // ✓ 將 projectId 包在 data 內
    });
    
    // ✓ MUX: onCall 的回傳資料在 result.data
    return result.data; 
    
  } catch (error) {
    console.error(`[api.js] 獲取客資系統設定時發生錯誤 (Project: ${projectId}):`, error);
    throw error; // 拋出錯誤讓 .vue 檔案捕捉
  }
};

/**
 * [API] 儲存指定建案的客資系統欄位設定 (V2: MUX)
 * @param {string} projectId - 專案 ID
 * @param {object} settingsData - 要儲存的完整設定物件
 * @returns {Promise<object>} - MUX: 返回 { status, message }
 */
export const saveCustomerSettings = async (projectId, settingsData) => {
  if (!projectId || !settingsData) {
    throw new Error("缺少 projectId 或 settingsData");
  }
  
  try {
    // ✓ MUX: 呼叫 customerApiRouter
    const result = await customerApiRouter({
        action: 'saveCustomerSettings',
        data: { 
            projectId, 
            settingsData // ✓ 將 projectId 和 settingsData 都包在 data 內
        }
    });
    
    // ✓ MUX: onCall 的回傳資料在 result.data
    return result.data; 
    
  } catch (error) {
    console.error(`[api.js] 儲存客資系統設定時發生錯誤 (Project: ${projectId}):`, error);
    throw error; // 拋出錯誤讓 .vue 檔案捕捉
  }
};



// =================================================================
// /  【修改】客資系統設定 API (V2 - MUX)
// =================================================================



// ✓ START: 修改貴賓表單 API 函式
/**
 * [API] 獲取貴賓表單所需的設定 (名稱、封面圖、欄位)
 * (由 VipForm.vue 使用)
 */
export const fetchVipFormSettings = async (projectId) => {
  if (!projectId) {
    return { status: 'error', message: '缺少 projectId' };
  }
  
  try {
    // ✓ 修改：呼叫 vipFormApiRouter
    const result = await vipFormApiRouter({
        action: 'fetchVipFormSettings',
        data: { projectId }
    });
    return result.data; // 直接回傳後端的 { status, ... }
  } catch (error) {
    console.error(`[api.js] 獲取貴賓表單設定時發生錯誤:`, error);
    return { status: "error", message: error.message };
  }
};

/**
 * [API] 提交貴賓填寫的表單資料
 * (由 VipForm.vue 使用)
 */
export const submitVipForm = async (projectId, formData) => {
  if (!projectId || !formData) {
    return { status: 'error', message: '缺少 projectId 或 formData' };
  }
  
  try {
    // ✓ 修改：呼叫 vipFormApiRouter
    const result = await vipFormApiRouter({
        action: 'submitVipForm',
        data: { projectId, formData }
    });
    return result.data; // 直接回傳後端的 { status, docId }
  } catch (error) {
    console.error(`[api.js] 提交貴賓表單時發生錯誤:`, error);
    return { status: "error", message: error.message };
  }
};
// ✓ END: 修改


// =================================================================
// /  【新增】客戶資料表 API
// =================================================================

/**
 * [API] 驗證銷售人員電話並返回其可用的客資系統建案
 * (✓ 修改：增加 password 參數)
 */
export const verifySalesPerson = async (phone, password) => { // ✓ 1. 增加 password 參數
  try {
    const result = await customerSheetApiRouter({
      action: 'verifySalesPerson',
      data: { phone, password } // ✓ 2. 將 password 傳入 data
    });
    return result.data; // { name, roles, projects, isCounter }
  } catch (error) {
    console.error(`[api.js] 驗證銷售人員失敗:`, error);
    throw error;
  }
};

/**
 * [API] 獲取指定建案的所有貴賓列表
 * (✓ 修改：轉換 createdAt Timestamp)
 */
export const fetchVipGuests = async (projectId) => {
  try {
    const result = await customerSheetApiRouter({
      action: 'fetchVipGuests',
      data: { projectId }
    });

    // ✓ START: 轉換 Timestamp
    // result.data 是一個陣列 [ { id, name, phone, createdAt: {_seconds: ...} } ]
    const guests = result.data.map(guest => {
      let convertedDate = null;
      
      // 檢查是否為 CF 回傳的序列化 Timestamp
      if (guest.createdAt && typeof guest.createdAt === 'object' && guest.createdAt._seconds !== undefined) {
        // 轉換序列化的 Timestamp (from Cloud Function) 為 Client-side Date 物件
        convertedDate = new Date(guest.createdAt._seconds * 1000);
      } else if (guest.createdAt) {
        // 備用方案 (如果它意外地是其他格式，例如 ISO 字串)
        convertedDate = new Date(guest.createdAt);
      }
      
      return {
        ...guest,
        createdAt: convertedDate // ✓ 覆蓋為 Date 物件
      };
    });
    
    return guests; // ✓ 回傳轉換後的陣列
    // ✓ END: 轉換

  } catch (error) {
    console.error(`[api.js] 獲取貴賓列表失敗:`, error);
    throw error;
  }
};
/**
 * [API] 獲取客戶資料表所需的設定 (共用貴賓表單的設定)
 */
export const fetchCustomerSheetSettings = async (projectId) => {
  try {
    const result = await customerSheetApiRouter({
      action: 'fetchCustomerSheetData',
      data: { projectId }
    });
    return result.data;
  } catch (error) {
    console.error(`[api.js] 獲取客戶資料表設定失敗:`, error);
    return { status: "error", message: error.message };
  }
};

/**
 * [API] 提交客戶資料表 (建立或更新)
 */
export const submitCustomerSheet = async (projectId, formData, docId = null) => {
  try {
    const result = await customerSheetApiRouter({
      action: 'submitCustomerSheet',
      data: { projectId, formData, docId }
    });
    return result.data;
  } catch (error) {
    console.error(`[api.js] 提交客戶資料表失敗:`, error);
    throw error;
  }
};

/**
 * [API] 獲取單筆貴賓的完整資料 (用於編輯)
 */
export const fetchSingleVipGuest = async (docId) => {
  try {
    const result = await customerSheetApiRouter({
      action: 'fetchSingleVipGuest',
      data: { docId }
    });
    return result.data; // { status, data }
  } catch (error) {
    console.error(`[api.js] 獲取單筆貴賓資料失敗:`, error);
    throw error;
  }
};

/**
 * [API] 獲取客戶資料管理列表 (已由後端過濾和攤平)
 * @param {string} projectId 
 * @param {string} userPhone 
 * @param {Array<string>} userProjectSystems 
 * @returns {Promise<Array<object>>}
 */
// ✅ [修正版] 獲取客戶資料管理列表 - 增加時間格式化容錯
export const fetchCustomerList = async (projectId, userPhone, userProjectSystems) => {
  if (!projectId || !userPhone || !userProjectSystems) {
    return [];
  }
  
  try {
    const result = await customerApiRouter({
        action: 'fetchCustomerList',
        data: { projectId, userPhone, userProjectSystems }
    });
    
    // 如果後端拋出錯誤，這裡會直接進入 catch
    if (!result.data || !Array.isArray(result.data)) return [];

    return result.data.map(item => {
      let subDate = null;
      // 容錯處理：處理 ISO 字串、Timestamp 物件 或 序列化後的 {_seconds}
      if (item.submittedAt) {
        if (typeof item.submittedAt.toDate === 'function') {
          subDate = item.submittedAt.toDate();
        } else if (item.submittedAt._seconds) {
          subDate = new Date(item.submittedAt._seconds * 1000);
        } else {
          subDate = new Date(item.submittedAt);
        }
      }

      return {
        ...item,
        submittedAt: subDate
      };
    });
    
  } catch (error) {
    console.error(`[api.js] 獲取客戶列表時發生錯誤:`, error);
    // 💡 ANXI 提醒：若錯誤訊息包含 "toDate is not a function"，
    // 說明後端 Cloud Function 也需要同步修正解析邏輯
    throw error;
  }
};


/**
 * [API] 獲取客戶洽談詳細資料 (整合版)
 */
export const fetchCustomerInteractionDetails = async (projectId, docId, userKey) => {
  try {
    const fetchFunc = httpsCallable(functions, 'getCustomerInteractionDetails');
    const result = await fetchFunc({ projectId, docId, userKey });
    return result.data; // { status, data: { guestData, canEdit } }
  } catch (error) {
    console.error("API Error:", error);
    throw new Error(error.message);
  }
};

/**
 * [API] 新增洽談紀錄
 * @param {string} projectId - 建案 ID
 * @param {string} docId - 客戶文件 ID
 * @param {object} logData - 紀錄內容 (date, content, tags...)
 * @param {string} operatorName - 記錄人姓名
 * @param {string} operatorPhone - 記錄人電話 (新增參數)
 */
export const addInteractionLog = async (projectId, docId, logData, operatorName, operatorPhone) => {
  try {
    // ✅ 改用統一的路由函式呼叫
    const result = await customerApiRouter({
      action: 'addInteractionLog',
      data: { projectId, docId, logData, operatorName, operatorPhone }
    });
    return result.data;
  } catch (error) {
    console.error("[api.js] addInteractionLog 失敗:", error);
    throw new Error(error.message);
  }
};

/**
 * [API] 更新客戶基本資料
 */
export const updateCustomerProfile = async (projectId, docId, profileData, userKey) => {
  try {
    const updateFunc = httpsCallable(functions, 'updateCustomerProfile');
    const result = await updateFunc({ projectId, docId, profileData, userKey });
    return result.data;
  } catch (error) {
    throw new Error(error.message);
  }
};

/**
 * [API] 更新洽談紀錄 (整合 V2)
 * @param {string} projectId - 建案 ID
 * @param {string} docId - 客戶文件 ID
 * @param {string} logId - 紀錄唯一的 ID
 * @param {object} logPayload - 紀錄內容
 * @param {string} operatorName - 更新人姓名
 * @param {string} operatorPhone - 更新人電話
 */
export const updateInteractionLog = async (projectId, docId, logId, logPayload, operatorName, operatorPhone) => {
  try {
    // ✅ 改用統一的路由函式呼叫，避免 NOT_FOUND 錯誤
    const result = await customerApiRouter({
      action: 'updateInteractionLog',
      data: { 
        projectId, 
        docId, 
        logId, 
        logPayload, 
        operatorName, 
        operatorPhone 
      }
    });
    return result.data;
  } catch (error) {
    console.error("[api.js] updateInteractionLog 失敗:", error);
    throw new Error(error.message);
  }
};

export async function queryCustomerDataApi(projectId, queryText) {
  const queryFunc = httpsCallable(functions, 'queryCustomerData');
  const result = await queryFunc({ projectId, queryText });
  return result.data;
}


/**
 * [API] 批次更新客戶資料 (Excel 匯入用)
 * @param {string} projectId - 建案 ID
 * @param {Array<object>} customerData - 包含 phone, name, salesInfo, profile 等資料的陣列
 * @returns {Promise<object>} - { status, message, processedCount }
 */
export const batchUpdateCustomers = async (projectId, customerData) => {
  if (!projectId || !Array.isArray(customerData) || customerData.length === 0) {
    return { status: 'error', message: '前端錯誤：缺少 projectId 或有效的客戶資料。' };
  }

  try {
    // 呼叫 customerApiRouter
    const result = await customerApiRouter({
      action: 'batchUpdateCustomers',
      data: {
        projectId,
        customerData
      }
    });
    return result.data;
  } catch (error) {
    console.error("API batchUpdateCustomers 錯誤:", error);
    return { status: 'error', message: error.message };
  }
};

/**
 * [API] 獲取完整客戶資料供匯出 (包含所有資料庫欄位)
 */
export const fetchCustomersForExport = async (projectId, userPhone, userProjectSystems) => {
  if (!projectId || !userPhone || !userProjectSystems) {
    return [];
  }
  
  try {
    const result = await customerApiRouter({
        action: 'fetchCustomersForExport', // 對應後端新路由
        data: { 
            projectId, 
            userPhone, 
            userProjectSystems 
        }
    });
    
    return result.data;
    
  } catch (error) {
    console.error(`[api.js] 匯出客戶列表失敗:`, error);
    throw error;
  }
};


/**
 * [API] 更新專案的 Google Sheet 設定
 */
export const updateProjectSheetSettings = async (projectId, sheetId, tabName) => {
  if (!projectId) return { status: 'error', message: '缺少 projectId' };
  
  try {
    // 直接更新 projects 集合
    const docRef = doc(db, 'projects', projectId);
    await updateDoc(docRef, {
        googleSheetId: sheetId,
        googleSheetTabName: tabName
    });
    return { status: 'success' };
  } catch (e) {
    return { status: 'error', message: e.message };
  }
};

/**
 * [API] 呼叫後端執行 Sheet 同步
 */
export const syncToGoogleSheet = async (projectId, startDate, endDate) => {
    const syncFunc = httpsCallable(functions, 'syncBookingToSheet');
    try {
        const result = await syncFunc({ projectId, startDate, endDate });
        return result.data;
    } catch (e) {
        throw new Error(e.message);
    }
};

// ✅ 新增：呼叫後端單一欄位更新
export async function updateSingleField(projectId, unitId, field, value) {
  try {
    const updateFunction = httpsCallable(functions, 'updateSalesField');
    const result = await updateFunction({
      projectId,
      unitId,
      field,
      value
    });
    return result.data;
  } catch (error) {
    console.error("單一欄位更新失敗:", error);
    return { status: "error", message: error.message };
  }
}

/**
 * [API] 獲取完整客戶資料 (含歷史紀錄，供 Excel 雙 Sheet 匯出用)
 */
export const fetchFullCustomersForExport = async (projectId, userPhone, userProjectSystems) => {
  if (!projectId) return [];
  try {
    // 呼叫剛剛在後端新增的 action
    const result = await customerApiRouter({
      action: 'fetchFullCustomersForExport',
      data: { projectId, userPhone, userProjectSystems }
    });
    return result.data;
  } catch (error) {
    console.error(`[api.js] 匯出完整客戶資料失敗:`, error);
    throw error;
  }
};

/**
 * [API] 批次匯入客戶資料
 */
export const batchImportCustomers = async (projectId, customers, operator) => {
  if (!projectId || !customers.length) return;
  
  try {
    const result = await customerApiRouter({
      action: 'batchImportCustomers',
      data: { 
        projectId, 
        customers: customers, 
        operator 
      }
    });
    return result.data;
  } catch (error) {
    console.error("批次匯入 API 異常:", error);
    throw error;
  }
};

/**
 * [API] 刪除洽談紀錄
 * @param {string} projectId - 建案 ID
 * @param {string} docId - 客戶文件 ID
 * @param {string} logId - 紀錄 ID
 * @param {string} operatorPhone - 執行人手機(ID)
 */
export const deleteInteractionLog = async (projectId, docId, logId, operatorPhone) => {
  try {
    const result = await customerApiRouter({
      action: 'deleteInteractionLog', // ✅ 對應後端新 Action
      data: { projectId, docId, logId, operatorPhone }
    });
    return result.data;
  } catch (error) {
    console.error("[api.js] deleteInteractionLog 失敗:", error);
    throw new Error(error.message);
  }
};


// 定義客資分配的路由函式 (強制指定 asia-east1 地區)
// 在 src/api.js 中加入或更新
export const leadAssignmentApi = httpsCallable(getFunctions(undefined, 'asia-east1'), 'processAndAssignLead');

/**
 * [API] 執行名單分配 (傳送文件ID)
 * @param {object} data - { leadId, projectId, salesId, salesName }
 */
export const processAndAssignLeadAPI = async (data) => {
  try {
    const result = await leadAssignmentApi(data);
    return result.data;
  } catch (error) {
    console.error("[api.js] processAndAssignLeadAPI 錯誤:", error);
    throw error;
  }
};

// 定義名單查重的路由函式 (強制指定 asia-east1)
export const checkLeadDuplicatesApi = httpsCallable(getFunctions(undefined, 'asia-east1'), 'checkLeadDuplicates');

/**
 * [API] 執行名單查重比對
 * @param {string} projectId - 建案 ID
 * @param {string[]} phones - 待檢查的電話陣列
 */
export const checkLeadDuplicates = async (projectId, phones) => {
  if (!projectId || !phones.length) return { results: {} };
  
  try {
    const result = await checkLeadDuplicatesApi({
      projectId,
      phones
    });
    return result.data;
  } catch (error) {
    console.error("[api.js] checkLeadDuplicates 失敗:", error);
    throw error;
  }
};


// ✅ 新增：批次匯入並直接分配名單的 API
export const batchImportAndAssignLeadsAPI = async (data) => {
  try {
    const func = httpsCallable(getFunctions(undefined, 'asia-east1'), 'batchImportAndAssignLeads');
    const result = await func(data);
    return result.data;
  } catch (error) {
    console.error("[api.js] batchImportAndAssignLeadsAPI 異常:", error);
    throw error;
  }
};



// 定義簡訊 API 路由
export const smsApiRouter = httpsCallable(getFunctions(undefined, 'asia-east1'), 'smsApi');


/**
 * [API] 獲取簡訊帳號餘額
 * @param {string} userKey - 自定義的使用者 ID
 */
export const getSmsBalanceAPI = async (userKey) => {
  try {
    // 定義路由 (確保名稱與 index.js 導出一致)
    const smsApiRouter = httpsCallable(getFunctions(undefined, 'asia-east1'), 'smsApi');
    
    const result = await smsApiRouter({ 
      action: 'getBalance',
      userKey: userKey // 這裡傳遞給後端的 request.data
    });
    
    return result.data;
  } catch (error) {
    console.error("[api.js] getSmsBalanceAPI 錯誤:", error);
    throw error;
  }
};

/**
 * [API] 發送測試簡訊
 */
export const sendSmsAPI = async (data) => {
  try {
    const smsApiRouter = httpsCallable(getFunctions(undefined, 'asia-east1'), 'smsApi');
    const result = await smsApiRouter({ 
      action: 'sendSms',
      ...data 
    });
    return result.data;
  } catch (error) {
    console.error("[api.js] sendSmsAPI 錯誤:", error);
    throw error;
  }
};