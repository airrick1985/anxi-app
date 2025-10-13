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
        positions: data.positions
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
 * @returns {Array} 符合條件的範本列表
 */
export function selectApplicableTemplates(templates, totalPrice, buyerType) {
  
  const applicable = templates.filter(template => 
    template.minPrice <= totalPrice && 
    totalPrice <= template.maxPrice && 
    template.buyerType === buyerType
  );
  
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


/**
 * 傳送付款表（包含檔案連結）給指定的收件人
 * @param {object} payload - 包含 projectName, recipients, files, unitId 等資訊
 * @returns {Promise<object>} API 響應
 */
export async function sendPaymentScheduleEmail(payload) {
    //console.log('[api.js] sendPaymentScheduleEmail called with payload:', payload);
    
    // 我們可以將這個新功能歸類在銷售相關的 API 端點
    return fetchPost({
        action: 'send_payment_schedule_email',
        token: 'anxi111003', // 遵循您專案的慣例
        ...payload
    }, SALES_API);
}

/**
 * 製作付款表 (Word & PDF)
 * @param {object} payload - 包含 projectName, contractType, data 的物件
 * @returns {Promise<object>} API 響應
 */
export async function generatePaymentSchedule(payload) {
  //console.log('[api.js] generatePaymentSchedule called with payload:', payload);
  const body = {
    action: 'generate_payment_schedule',
    token: 'anxi111003',
    ...payload
  };
  // 這個功能的 action 通常與銷售相關，所以我們發到 SALES_API 端點
  return fetchPost(body, SALES_API);
}

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
    //  從 projects 集合中動態獲取所有建案的完整資料 (ID + name)
    const projectsRef = collection(db, "projects");
    const snapshot = await getDocs(projectsRef);
    const projects = [];
    snapshot.forEach(doc => {
        projects.push({ id: doc.id, ...doc.data() });
    });
    
    const systemFunctions = ['驗屋系統', '銷控系統', '預約驗屋系統', '客戶管理'];

    //  回傳完整的 projects 陣列，而非只有名稱
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
 * @param {string} projectId 
 * @returns {Promise<{minDate: string, maxDate: string}>}
 */
export async function fetchAppointmentDateRange(projectId) {
  try {
    const getDateRange = httpsCallable(functions, 'getAppointmentDateRange');
    const result = await getDateRange({ projectId });
    if (result.data.status === 'success') {
      return result.data.data;
    }
    throw new Error(result.data.message || '無法獲取日期範圍');
  } catch (error) {
    console.error("API fetchAppointmentDateRange 錯誤:", error);
    // 發生錯誤時提供一個預設值，避免頁面崩潰
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
 * @param {string} projectId 
 * @param {Date} startDate - JS Date 物件
 * @param {Date} endDate - JS Date 物件
 * @returns {Promise<Array>}
 */
export async function fetchCalendarData(projectId, startDate, endDate) {
 //  START: 新增偵錯日誌
    //console.log(`[API] fetchCalendarData 執行中...`);
    //console.log(`  > 接收到的 startDate:`, startDate);
    //console.log(`  > startDate 的型別:`, Object.prototype.toString.call(startDate));
    //console.log(`  > 接收到的 endDate:`, endDate);
    //console.log(`  > endDate 的型別:`, Object.prototype.toString.call(endDate));

    // 檢查日期是否有效
    if (!(startDate instanceof Date) || isNaN(startDate.getTime())) {
        console.error('🔴 [API] 偵測到無效的 startDate!', startDate);
        throw new Error('API 接收到無效的開始日期');
    }
    if (!(endDate instanceof Date) || isNaN(endDate.getTime())) {
        console.error('🔴 [API] 偵測到無效的 endDate!', endDate);
        throw new Error('API 接收到無效的結束日期');
    }
    //console.log(`[API] 日期驗證通過，準備查詢 Firestore...`);
    //  END: 新增偵錯日誌

    // 1. 一次性獲取該建案所有的 households 資料 (維持不變)
    const householdsRef = collection(db, "households");
    const householdsQuery = query(householdsRef, where("projectId", "==", projectId));
    const householdsSnapshot = await getDocs(householdsQuery);
    const householdsMap = new Map();
    householdsSnapshot.forEach(doc => {
        householdsMap.set(`${doc.data().projectId}_${doc.data().unitId}`, doc.data());
    });

    const appointmentsRef = collection(db, "appointments");
    const appointmentsQuery = query(
        appointmentsRef, 
        where("projectId", "==", projectId),
        where("appointmentDate", ">=", startDate),
        where("appointmentDate", "<=", endDate)
    );
    const appointmentsSnapshot = await getDocs(appointmentsQuery);

    const combinedData = appointmentsSnapshot.docs.map(doc => {
        const appointment = { id: doc.id, ...doc.data() };
        const householdKey = `${appointment.projectId}_${appointment.unitId}`;
        const householdData = householdsMap.get(householdKey) || {};
        return { ...householdData, ...appointment };
    });

    return combinedData;
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

        // 從專案設定中獲取驗屋方式和人員，如果不存在則提供預設空陣列
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
 * @param {string} projectId 
 * @param {object} newBookingData - 包含所有欄位的預約資料
 * @param {string|null} cancelBookingCode - 可選，要同時取消的舊預約代碼
 * @param {boolean} force - 可選，是否強制新增
 */
// ✓ 修改函式簽名，直接接收一個 payload 物件
export async function addAppointmentAdmin(payload) {
    //  START: 修改此函式以呼叫 Cloud Function
    try {
        const addFunction = httpsCallable(functions, 'addAppointmentByAdmin');
        // ✓ 直接將收到的 payload 傳給後端
        const result = await addFunction(payload);
        return result.data; // 直接回傳後端的回應 { status: 'success', docId: '...' }
    } catch (error) {
        console.error("呼叫 addAppointmentByAdmin 雲端函式時發生錯誤:", error);
        // 將 HttpsError 轉換為前端可處理的格式
        throw new Error(error.message);
    }
    //  END: 修改結束
}

/**
 * [Firestore 版] 更新預約紀錄 (可同時更新 appointments 和 households)
 * @param {string} appointmentId - 預約紀錄的文件 ID
 * @param {object} bookingUpdatePayload - 要更新到 appointments 集合的資料
 * @param {string} householdDocId - 戶別資料的文件 ID (projectId_unitId)
 * @param {object} householdUpdatePayload - 要更新到 households 集合的資料
 */
export async function updateAppointment(appointmentId, bookingUpdatePayload, householdDocId, householdUpdatePayload) {
    const batch = writeBatch(db);

    // 處理日期轉換
    ['appointmentDate'].forEach(field => {
        if (bookingUpdatePayload[field]) {
            bookingUpdatePayload[field] = Timestamp.fromDate(new Date(bookingUpdatePayload[field]));
        }
    });
     ['appropriationDate'].forEach(field => {
        if (householdUpdatePayload[field]) {
            householdUpdatePayload[field] = Timestamp.fromDate(new Date(householdUpdatePayload[field]));
        }
    });

    if (appointmentId && Object.keys(bookingUpdatePayload).length > 0) {
        const appointmentRef = doc(db, "appointments", appointmentId);
        batch.update(appointmentRef, bookingUpdatePayload);
    }
    if (householdDocId && Object.keys(householdUpdatePayload).length > 0) {
        const householdRef = doc(db, "households", householdDocId);
        batch.update(householdRef, householdUpdatePayload);
    }

    if (batch._mutations.length > 0) {
        await batch.commit();
        return { status: 'success' };
    }
    
    return { status: 'no_changes' };
}

/**
 * ✓ [Firebase 版] 取消一筆預約 (呼叫 Cloud Function)
 * @param {string} appointmentId - 預約紀錄的文件 ID
 * @param {string} projectId - 預約所屬的建案 ID
 * @param {string} unitId - 預約所屬的戶別 ID
 * @param {string} bookingType - 預約類型 ('初驗' 或 '複驗')
 */
export async function cancelAppointment(appointmentId, projectId, unitId, bookingType) {
  if (!appointmentId || !projectId || !unitId || !bookingType) {
    return { status: 'error', message: '前端錯誤：缺少取消預約所需的參數。' };
  }
  
  try {
    // ✓ 呼叫我們剛剛建立的新 Cloud Function
    const doCancel = httpsCallable(functions, 'cancelAppointmentByAdmin');
    const result = await doCancel({
      appointmentId,
      projectId,
      unitId,
      bookingType
    });
    // ✓ 直接回傳後端的執行結果
    return result.data;
  } catch (error) {
    console.error("API cancelAppointment 錯誤:", error);
    return { status: 'error', message: error.message };
  }
}


/**
 * [Firebase 版] 取消一筆預約
 * @param {object} payload - 包含 projectId 和 bookingCode 的物件
 * @returns {Promise<object>}
 */
export const cancelBooking = async (payload) => {
  if (!payload.projectId || !payload.bookingCode) {
    return { status: 'error', message: '前端錯誤：缺少 projectId 或 bookingCode。' };
  }
  try {
    const doCancel = httpsCallable(functions, 'cancelBooking');
    const result = await doCancel(payload);
    return result.data;
  } catch (error) {
    console.error("API cancelBooking 錯誤:", error);
    return { status: 'error', message: error.message };
  }
};

// =============================================
//  公開預約系統 API (Firebase 遷移版)
// =============================================

//  [新增] 獲取預約頁面初始化所需的資料
export async function getBookingInitialData(projectName, projectId) {
  const doGetInitialData = httpsCallable(functions, 'getBookingInitialData');
  try {
    const result = await doGetInitialData({ projectId });
    // 為了與舊版前端的格式相容，回傳包含 status 和 data 的物件
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
 *  [新增] 從 Firestore 獲取建案的公開設定
 * @param {string} projectId 建案 ID
 */
export async function fetchProjectConfig(projectId) {
  const getProjectConfig = httpsCallable(functions, 'getProjectConfig');
  try {
    const result = await getProjectConfig({ projectId });
    return result.data;
  } catch (error) {
    console.error("API fetchProjectConfig 錯誤:", error);
    // 回傳 null 或拋出錯誤，讓前端頁面可以處理加載失敗的情況
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
 *  檢查是否已有有效預約
 * @param {string} unitId 戶別
 * @param {string} bookingType 預約項目
 * @param {string} projectId 建案 ID
 */
export async function checkExistingBooking(projectId, unitId, bookingType) {
 const doCheck = httpsCallable(functions, 'checkExistingBooking');
 try {
  const result = await doCheck({ projectId, unitId, bookingType });
  return result.data;
 } catch (error) {
  console.error("API checkExistingBooking 錯誤:", error);
  return { status: 'error', message: error.message };
 }
}

/**
 *   獲取可預約的日期和時段
 * @param {string} projectName (舊參數)
 * @param {string} unitId 戶別
 * @param {string} bookingType 預約項目
 * @param {string} bookingMethod 驗屋方式
 * @param {string} projectId 建案 ID
 */
export const getBookingSlots = async (projectName, unitId, bookingType, bookingMethod, projectId) => {
  const getSlots = httpsCallable(functions, 'getAvailableSlots');
  try {
    //console.log('呼叫 getAvailableSlots，參數:', { projectId, unitId, bookingType, bookingMethod });
    
    const result = await getSlots({ projectId, unitId, bookingType, bookingMethod });
    
    //console.log('getAvailableSlots 完整回傳:', result);
    //console.log('result.data:', result.data);
    
    //  根據 Cloud Functions 的回傳格式，包裝成前端期望的格式
    return {
      status: 'success',
      data: result.data  // 這裡是 Cloud Functions 回傳的實際資料
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
 * 儲存預約資料 (Firebase 版)
 *  修改此函式以呼叫 Cloud Function
 * @param {object} payload - 包含 projectId 和 bookingData 的物件
 */
export const saveBooking = async (payload) => {
  const doSaveBooking = httpsCallable(functions, 'saveBooking');
  try {
    const result = await doSaveBooking(payload);
    // Cloud Function 成功時，回傳的資料會在 result.data 中
    // 我們將其包裝成與舊版類似的格式，確保前端相容性
    return { status: 'success', ...result.data };
  } catch (error) {
    console.error("API saveBooking 錯誤:", error);
    // 將 HttpsError 轉換為前端習慣的格式
    return { status: 'error', message: error.message };
  }
};



/**
 *  [修改] 一次性獲取所有可預約的戶別資料
 * @param {string} projectName (雖然函式仍接收 projectName，但後端已改用 projectId)
 * @param {string} projectId 建案 ID
 */
export const fetchAllUnitsForBooking = async (projectName, projectId) => {
  // 注意：我們現在需要傳遞 projectId
  const getAllUnitsForBooking = httpsCallable(functions, 'getAllUnitsForBooking');
  try {
    const result = await getAllUnitsForBooking({ projectId: projectId });
    // 為了與舊版前端的格式相容，我們仍然回傳一個包含 status 和 data 的物件
    return { status: 'success', data: result.data };
  } catch (error) {
    console.error("API fetchAllUnitsForBooking 錯誤:", error);
    return { status: 'error', message: error.message, data: {} };
  }
};


/**
 *  [修改] 驗證身分證與戶別是否相符
 * @param {string} projectName (舊參數，後端已不使用但保留以相容舊呼叫)
 * @param {string} unitId 戶別
 * @param {string} idNumber 身分證號碼
 * @param {string} projectId 建案 ID
 */
export const validateId = async (projectName, unitId, idNumber, projectId) => {
  const doValidateId = httpsCallable(functions, 'validateId');
  try {
    await doValidateId({ projectId, unitId, idNumber });
    // 成功時，Cloud Function 不會回傳 data，直接 resolve
    return { status: 'success' };
  } catch (error) {
    console.error("API validateId 錯誤:", error);
    // HttpsError 的 message 會直接是後端拋出的錯誤訊息
    return { status: 'error', message: error.message };
  }
};




/**
 * 上傳驗屋授權書 (Firebase Function 版)
 * @param {string} base64Data - 產生的圖檔的 Base64 Data URL
 * @param {string} fileName - 指定的檔案名稱
 * @param {string} projectId - 當前建案 ID
 * @param {string} unitId - 當前選擇的戶別
 * @returns {Promise<object>} - 回傳包含 { status, message, url } 的物件
 */
export const uploadAuthLetter = async (base64Data, fileName, projectId, unitId) => {
  // 1. 去除 Base64 URL 的前綴，與舊版邏輯相同
  const pureBase64 = base64Data.split(',')[1];
  
  try {
    // 2. 獲取對我們剛剛建立的 Cloud Function 的引用
    const uploader = httpsCallable(functions, 'uploadAuthLetter');
    
    // 3. 呼叫 Cloud Function 並傳遞必要的參數
    const result = await uploader({
      projectId: projectId, //  新增 projectId
      unitId: unitId,
      fileName: fileName,
      base64: pureBase64
    });
    
    // 4. 直接回傳 Cloud Function 的執行結果
    return result.data;

  } catch (error) {
    console.error("呼叫 uploadAuthLetter 雲端函式時發生錯誤:", error);
    // 將 Firebase Function 拋出的 HttpsError 轉換為前端習慣的格式
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
 * [代理模式] 將驗屋報告透過 Cloud Function 直接上傳到 Google Drive
 * @param {object} payload - 表單資料
 * @param {File} fileObject - 原始 File 物件
 * @returns {Promise<object>}
 */
export async function uploadReportDirectlyToDrive(payload, fileObject) {
  //console.log('[api.js] Starting direct upload process via proxy function...');
  try {
    // 1. 將檔案轉為 Base64
    const base64Content = await fileToBase64(fileObject);

    // 2. 準備傳給 Cloud Function 的完整資料
    const functionPayload = {
      ...payload,
      fileName: fileObject.name,
      fileContent: base64Content, // 傳送 Base64 內容
      contentType: fileObject.type,
    };
    
    // 3. 呼叫新的 Cloud Function
    const functions = getFunctions();
    const uploader = httpsCallable(functions, 'handleDirectReportUpload');
    const result = await uploader(functionPayload);

    // 4. 直接回傳 Cloud Function 的執行結果
    return result.data;

  } catch (error) {
    console.error("代理上傳報告失敗:", error);
    return { status: "error", message: `代理上傳失敗: ${error.message}` };
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
 * [新] 檢查日期是否存在「基礎共享規則」 (V2 - 修正版，會回傳詳細批次名稱)
 * @param {string} projectId 
 * @param {Array<string>} dates - 要檢查的日期陣列 ['2025-08-25', ...]
 * @param {string|null} currentBatchId - 編輯模式下傳入，以排除自身
 * @returns {Promise<object>}
 */
export async function checkDateConflicts(projectId, dates, currentBatchId = null) {
    if (!dates || dates.length === 0) {
        return { conflictingDates: [], nonConflictingDates: [] };
    }
    try {
        // 步驟 1: 查找在指定日期中已存在的「共享規則」
        const rulesRef = collection(db, "dateRules");
        const rulesQuery = query(rulesRef,
            where("projectId", "==", projectId),
            where("isShared", "==", true),
            where("date", "in", dates)
        );
        const rulesSnapshot = await getDocs(rulesQuery);
        if (rulesSnapshot.empty) {
            return { conflictingDates: [], nonConflictingDates: dates };
        }

        const conflictingRulesMap = new Map();
        rulesSnapshot.forEach(doc => {
            conflictingRulesMap.set(doc.id, { ruleId: doc.id, ...doc.data(), sharedBy: [] });
        });
        const ruleIds = Array.from(conflictingRulesMap.keys());

        // 步驟 2: 根據找到的規則 ID，查找所有關聯的批次 ID
        const linksRef = collection(db, "batchRuleLinks");
        const linksQuery = query(linksRef, where("ruleId", "in", ruleIds));
        const linksSnapshot = await getDocs(linksQuery);
        if (linksSnapshot.empty) {
            return { conflictingDates: [], nonConflictingDates: dates };
        }

        const batchIds = new Set();
        const ruleToBatchIdsMap = new Map();
        linksSnapshot.forEach(doc => {
            const { ruleId, batchId } = doc.data();
            batchIds.add(batchId);
            if (!ruleToBatchIdsMap.has(ruleId)) {
                ruleToBatchIdsMap.set(ruleId, []);
            }
            ruleToBatchIdsMap.get(ruleId).push(batchId);
        });

        // 步驟 3: 根據批次 ID，一次性獲取所有批次的詳細資料
        const batchesRef = collection(db, "bookingBatches");
        const batchesQuery = query(batchesRef, where(documentId(), 'in', Array.from(batchIds)));
        const batchesSnapshot = await getDocs(batchesQuery);
        const batchDetailsMap = new Map();
        batchesSnapshot.forEach(doc => {
            batchDetailsMap.set(doc.id, doc.data());
        });

        // 步驟 4: 組合出前端需要的 "預約項目(批次代號)" 格式
        conflictingRulesMap.forEach((rule, ruleId) => {
            const linkedBatchIds = ruleToBatchIdsMap.get(ruleId) || [];
            rule.sharedBy = linkedBatchIds.map(batchId => {
                const details = batchDetailsMap.get(batchId);
                return details ? `${details.bookingType}(${details.batchCode})` : '未知批次';
            }).filter(name => name !== '未知批次');
        });

        // 步驟 5: 格式化最終回傳給前端的資料
        const conflictingDates = [];
        const foundDates = new Set();
        conflictingRulesMap.forEach(rule => {
            conflictingDates.push({
                date: rule.date,
                existingRule: {
                    ruleId: rule.ruleId,
                    rule: rule.slots,
                    sharedBy: rule.sharedBy
                }
            });
            foundDates.add(rule.date);
        });

        const nonConflictingDates = dates.filter(d => !foundDates.has(d));
        
        return { conflictingDates, nonConflictingDates };

    } catch (e) {
        console.error("檢查日期衝突時發生錯誤:", e);
        return { conflictingDates: [], nonConflictingDates: dates };
    }
}

/**
 * [新] 儲存批次與其關聯的每日規則 (混合模式)
 * @param {object} payload - 包含 { batchData, resolutions } 的物件
 * @returns {Promise<object>}
 */
export async function saveBatchWithRules(payload) {
    const { batchData, resolutions } = payload;
    const batchId = batchData.id || doc(collection(db, "bookingBatches")).id;

    try {
        const batch = writeBatch(db);
        const batchDocRef = doc(db, "bookingBatches", batchId);

        // 步驟 1: 新增/更新 bookingBatches 主文件
        const dataToSave = { ...batchData, id: batchId };
        dataToSave.lastModified = serverTimestamp();
        if (!batchData.id) dataToSave.createdAt = serverTimestamp();
        delete dataToSave.dailyRules;
        batch.set(batchDocRef, dataToSave, { merge: true });

        // 步驟 2: 處理規則，先刪除此批次在此次異動日期中的所有舊關聯
        const datesToUpdate = Object.keys(resolutions);
        if (datesToUpdate.length > 0) {
            const oldLinksQuery = query(collection(db, "batchRuleLinks"),
                where("batchId", "==", batchId),
                where("date", "in", datesToUpdate)
            );
            const oldLinksSnapshot = await getDocs(oldLinksQuery);
            oldLinksSnapshot.forEach(doc => batch.delete(doc.ref));
        }

        // 步驟 3: 根據 resolutions 建立新規則或新關聯
        for (const date in resolutions) {
            const resolution = resolutions[date];
            const ruleContent = batchData.dailyRules[date];

            if (!ruleContent || !ruleContent.slots || Object.keys(ruleContent.slots).length === 0) {
                continue;
            }

            if (resolution.mode === 'link' && resolution.targetRuleId) {
                // 模式 A: 連結至現有規則
                const linkDocRef = doc(collection(db, "batchRuleLinks"));
                batch.set(linkDocRef, {
                    batchId: batchId,
                    ruleId: resolution.targetRuleId,
                    date: date,
                    projectId: batchData.projectId,
                });

            } else if (resolution.mode === 'update_shared' && resolution.targetRuleId) {
                //  [新增] 模式 C: 更新現有共享規則，然後連結
                const ruleToUpdateRef = doc(db, "dateRules", resolution.targetRuleId);
                batch.update(ruleToUpdateRef, {
                    slots: ruleContent.slots,
                    lastModified: serverTimestamp()
                });

                const linkDocRef = doc(collection(db, "batchRuleLinks"));
                batch.set(linkDocRef, {
                    batchId: batchId,
                    ruleId: resolution.targetRuleId,
                    date: date,
                    projectId: batchData.projectId,
                });

            } else if (resolution.mode === 'create_independent' || resolution.mode === 'create_shared') {
                // 模式 B (獨立) 或新日期的共享規則
                const newRuleDocRef = doc(collection(db, "dateRules"));
                batch.set(newRuleDocRef, {
                    slots: ruleContent.slots,
                    date: date,
                    projectId: batchData.projectId,
                    isShared: resolution.mode === 'create_shared',
                    createdAt: serverTimestamp(),
                });

                const linkDocRef = doc(collection(db, "batchRuleLinks"));
                batch.set(linkDocRef, {
                    batchId: batchId,
                    ruleId: newRuleDocRef.id,
                    date: date,
                    projectId: batchData.projectId,
                });
            }
        }

        await batch.commit();
        return { status: 'success', id: batchId };

    } catch (e) {
        console.error(`儲存批次 ${batchId} 與規則時發生錯誤:`, e);
        return { status: 'error', message: e.message };
    }
}

/**
 * [新] 獲取指定批次的所有每日規則 (給編輯畫面使用)
 * @param {string} batchId - 批次的文件 ID
 * @returns {Promise<object>} - 返回以日期為 key 的規則物件
 */
export async function fetchRulesForBatch(batchId) {
    try {
        // 1. 透過 batchId 查找所有關聯的 ruleId
        const linksRef = collection(db, "batchRuleLinks");
        const linksQuery = query(linksRef, where("batchId", "==", batchId));
        const linksSnapshot = await getDocs(linksQuery);

        if (linksSnapshot.empty) return {};

        const ruleIds = linksSnapshot.docs.map(doc => doc.data().ruleId);

        // 2. 透過 ruleIds 一次性獲取所有規則的內容
        const rulesRef = collection(db, "dateRules");
        const rulesQuery = query(rulesRef, where(documentId(), 'in', ruleIds));
        const rulesSnapshot = await getDocs(rulesQuery);

        const rules = {};
        rulesSnapshot.forEach(doc => {
            const data = doc.data();
            rules[data.date] = { slots: data.slots }; // 回傳前端習慣的格式
        });
        
        return rules;
    } catch (e) {
        console.error(`獲取批次 ${batchId} 的每日規則時發生錯誤:`, e);
        return {};
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
 * [Firestore] 獲取指定建案的所有預約批次 (此函式維持不變，因為它只讀取主資料)
 * @param {string} projectId - 建案的 ID
 * @returns {Promise<Array>} - 返回批次資料陣列
 */
export async function fetchBookingBatches(projectId) {
    try {
        const batchesRef = collection(db, "bookingBatches");
        const q = query(
            batchesRef,
            where("projectId", "==", projectId),
            orderBy("bookingStart", "desc")
        );

        const querySnapshot = await getDocs(q);
        const batches = [];
        querySnapshot.forEach((doc) => {
            batches.push({ id: doc.id, ...doc.data() });
        });
        return batches;
    } catch (e) {
        console.error(`獲取建案 ${projectId} 的預約批次時發生錯誤:`, e);
        return [];
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
 * [Firestore] 刪除一筆預約批次及其所有關聯 (V2 - 包含孤兒規則清理)
 * @param {string} batchId - 批次的文件 ID
 * @returns {Promise<object>}
 */
export async function deleteBookingBatch(batchId) {
    try {
        const batch = writeBatch(db);
        const linksRef = collection(db, "batchRuleLinks");

        // 步驟 1: 找到此批次關聯的所有規則 ID
        const linksQuery = query(linksRef, where("batchId", "==", batchId));
        const linksSnapshot = await getDocs(linksQuery);
        
        const ruleIdsToCheck = [];
        linksSnapshot.forEach(doc => {
            ruleIdsToCheck.push(doc.data().ruleId);
            // 準備刪除這些關聯
            batch.delete(doc.ref);
        });

        // 步驟 2: 檢查這些規則是否還有被其他批次使用
        if (ruleIdsToCheck.length > 0) {
            for (const ruleId of ruleIdsToCheck) {
                // 查詢是否還存在其他連結指向這個 ruleId
                const otherLinksQuery = query(linksRef, 
                    where("ruleId", "==", ruleId),
                    where("batchId", "!=", batchId) // 關鍵：排除當前要被刪除的批次
                );
                
                // 使用 getCountFromServer 進行高效能計數
                const countSnapshot = await getCountFromServer(otherLinksQuery);
                
                // 如果計數為 0，代表這個規則已成為孤兒，可以刪除
                if (countSnapshot.data().count === 0) {
                    const orphanRuleRef = doc(db, "dateRules", ruleId);
                    batch.delete(orphanRuleRef);
                }
            }
        }
        
        // 步驟 3: 準備刪除批次主文件
        const batchDocRef = doc(db, "bookingBatches", batchId);
        batch.delete(batchDocRef);

        // 步驟 4: 一次性提交所有刪除操作
        await batch.commit();
        return { status: 'success' };
    } catch (e) {
        console.error(`刪除批次 ${batchId} 時發生錯誤:`, e);
        return { status: 'error', message: e.message };
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

  let combinedData = {
    project: null,
    parameters: [],
    households: [],
    parkings: [] //  新增 parkings 屬性
  };
  
  let projectLoaded = false;
  let paramsLoaded = false;
  let householdsLoaded = false;
  let parkingsLoaded = false; //  新增 parkings 載入旗標

  const checkAndEmitData = () => {
    //  確保所有監聽器都至少回傳過一次資料後才呼叫回呼函式
    if (projectLoaded && paramsLoaded && householdsLoaded && parkingsLoaded) {
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

  //  回傳一個函式，用於一次性地停止所有監聽器
  return () => {
    unsubProject();
    unsubParams();
    unsubHouseholds();
    unsubParkings(); //  確保停止車位監聽
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
export const uploadSalesImage = async (storagePath, fileName, fileBase64, projectId) => {
  try {
    const uploader = httpsCallable(functions, 'handleSalesImageUpload');
    const result = await uploader({
      projectId,
      fileName,
      fileBase64,
      storagePath,
    });
    
    if (result.data.status === 'success') {
      return result.data; // 回傳 { downloadURL, storagePath }
    } else {
      throw new Error(result.data.message || 'Cloud Function 回報錯誤');
    }
  } catch (error) {
    console.error("呼叫 handleSalesImageUpload 雲端函式時發生錯誤:", error);
    // 將錯誤包裝成與前端期望的格式一致
    throw new Error(error.message || "代理上傳失敗");
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
    last_changed: rtdbServerTimestamp(), // ✓【修正】使用新的別名
  };
  return set(userStatusRef, offlineStatus);
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
    orderBy("name", "asc") // 依姓名筆劃排序
  );

  const unsubscribe = onSnapshot(q, (snapshot) => {
    const personnel = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    onDataChange(personnel);
  }, (error) => {
    console.error(`監聽銷售人員時發生錯誤 (Project: ${projectId}):`, error);
  });

  return unsubscribe;
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
 *  [新增] 僅更新單筆預約紀錄的驗屋人員欄位
 * @param {string} appointmentId - appointments 集合中的文件 ID
 * @param {Array<string>} inspectors - 新的驗屋人員陣列
 * @returns {Promise<void>}
 */
export async function updateAppointmentInspectors(appointmentId, inspectors) {
  if (!appointmentId) throw new Error("缺少預約 ID。");
  
  const appointmentRef = doc(db, "appointments", appointmentId);
  
  // 將前端傳來的陣列轉換為逗號分隔的字串，以便儲存
  const inspectorsString = Array.isArray(inspectors) ? inspectors.join(',') : '';
  
  // 僅更新 inspectors 這一個欄位
  await updateDoc(appointmentRef, {
    inspectors: inspectorsString
  });
}

/**
 *  [新增] 獲取指定建案下的所有戶別資料
 * @param {string} projectId - 專案 ID
 * @returns {Promise<Array>} - 戶別資料陣列
 */
export async function fetchAllHouseholdsForProject(projectId) {
  if (!projectId) return [];
  
  const householdsRef = collection(db, "households");
  const q = query(householdsRef, where("projectId", "==", projectId));
  const snapshot = await getDocs(q);
  
  const households = [];
  snapshot.forEach(doc => {
    households.push({ ...doc.data(), _docId: doc.id });
  });
  
  return households;
}

/**
 *  [修改後版本] 供管理員獲取指定日期的所有時段選項
 * @param {string} projectId 
 * @param {string} dateStr - 'YYYY-MM-DD' 格式
 * @returns {Promise<Array<string>>}
 */
export async function getSlotsForAdmin(projectId, dateStr) {
    try {
        const getSlotsFunction = httpsCallable(functions, 'getSlotsForAdmin');
        // 移除了 unitId 和 bookingType
        const result = await getSlotsFunction({ projectId, dateStr });
        return result.data;
    } catch (error) {
        console.error("獲取管理員時段選項時發生錯誤:", error);
        throw new Error(error.message);
    }
}


/**
 * [新] 獲取上傳報告頁面所需的棟別列表 (無篩選)
 * @param {string} projectId 建案 ID
 */
export async function fetchBuildingListForUpload(projectId) {
  try {
    const functions = getFunctions();
    const getBuildingsFunc = httpsCallable(functions, 'getBuildingsForUpload');
    const result = await getBuildingsFunc({ projectId: projectId });
    return result.data; // 直接回傳 { status, data }
  } catch (error) {
    console.error("API fetchBuildingListForUpload 錯誤:", error);
    return { status: 'error', message: error.message };
  }
}

/**
 * [新] 獲取上傳報告頁面所需的所有戶別資料 (無篩選)
 * @param {string} projectId 建案 ID
 */
export async function fetchAllUnitsForUpload(projectId) {
  try {
    const functions = getFunctions();
    const getUnitsFunc = httpsCallable(functions, 'getAllUnitsForUpload');
    const result = await getUnitsFunc({ projectId: projectId });
    return result.data; // 直接回傳 { status, data }
  } catch (error) {
    console.error("API fetchAllUnitsForUpload 錯誤:", error);
    return { status: 'error', message: error.message };
  }
}


/**
 * [新增] 跨集合全域搜尋預約紀錄
 * 根據關鍵字搜尋與 projectId 相關的 appointments 和 households 集合
 * @param {string} projectId - 建案 ID
 * @param {string} keyword - 搜尋關鍵字
 * @returns {Promise<{status: string, data: Array, message?: string}>}
 */
export async function searchAppointmentsAndHouseholds(projectId, keyword) {
  if (!projectId || !keyword) {
    return { status: 'error', message: '缺少 projectId 或 keyword' };
  }
  
  try {


    const searchFunction = httpsCallable(functions, 'globalAppointmentSearch');
    const result = await searchFunction({ projectId, keyword });



    if (result.data.status === 'success') {
      const processedData = result.data.data.map(appt => ({
        ...appt,
        //  將後端回傳的 ISO 字串轉回 Date 物件
        appointmentDate: appt.appointmentDate ? new Date(appt.appointmentDate) : null,
      }));
      return { status: 'success', data: processedData };
    } else {
      return { status: 'error', message: result.data.message || '搜尋時發生未知錯誤' };
    }
  } catch (error) {
    console.error("❌ 全域搜尋 API 呼叫失敗:", error);
    // 簡化錯誤回報
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
 * [新] 呼叫後端發起授權書簽署流程 (委託人發起)
 * @param {object} payload - 包含 projectId, unitId, formData, delegatorSignature
 * @returns {Promise<object>}
 */
export async function initiateAuthSigningProcess(payload) {
  try {
    const initiator = httpsCallable(functions, 'initiateAuthSigningProcess');
    const result = await initiator(payload);
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
 * [API] 呼叫後端，執行上傳報告前的第一步驗證
 * @param {object} payload - 包含 { projectId, unitId, reportType, idNumber }
 * @returns {Promise<object>} - 後端回傳的驗證結果
 */
export const verifyUploadPrerequisites = async (payload) => {
  try {
    const verifyFunction = httpsCallable(functions, 'verifyUploadPrerequisites');
    const result = await verifyFunction(payload);
    // onCall 函式回傳的資料會包在一個 data 物件中
    return result.data;
  } catch (error) {
    console.error("API Error in verifyUploadPrerequisites:", error);
    // 將錯誤再次拋出，讓 Vue 元件的 catch 區塊可以接收到更清晰的錯誤訊息
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
 * [API] 獲取 LIFF 使用者資料與其可查詢的建案列表
 * @param {object} payload - 包含 { lineId }
 * @returns {Promise<object>} - 後端回傳的結果
 */
export const getLiffUserData = async (payload) => {
  try {
    const getDataFunction = httpsCallable(functions, 'getLiffUserData');
    const result = await getDataFunction(payload);
    return result.data;
  } catch (error) {
    console.error("API Error in getLiffUserData:", error);
    throw new Error(error.message);
  }
};



// ✓ START: 修改為新的函式名稱 liffSearchAppointments
/**
 * [API] 根據建案ID和關鍵字搜尋預約紀錄 (LIFF查詢用)
 * @param {object} payload - 包含 { projectId, searchText }
 * @returns {Promise<object>} - 後端回傳的結果
 */
export const liffSearchAppointments = async (payload) => {
  try {
    // ✓ 呼叫的後端函式名稱也要同步修改
    const searchFunction = httpsCallable(functions, 'liffSearchAppointments');
    const result = await searchFunction(payload);
    return result.data;
  } catch (error) {
    console.error("API Error in liffSearchAppointments:", error);
    throw new Error(error.message);
  }
};
// ✓ END


// ✓ START: 新增 - LIFF 驗屋時間表專用函式
/**
 * [LIFF日曆用] 獲取指定建案的所有預約資料 (用於日曆計數渲染)
 * @param {object} payload - 包含 { projectId } 的物件
 * @returns {Promise<object>} - 後端回傳的結果
 */
export const getAllLiffAppointmentsForProject = async (payload) => {
  try {
    const getDataFunction = httpsCallable(functions, 'getAllLiffAppointmentsForProject');
    const result = await getDataFunction(payload);
    return result.data;
  } catch (error) {
    console.error("API Error in getAllLiffAppointmentsForProject:", error);
    throw new Error(error.message);
  }
};


// ✓ START: 新增 - LIFF 驗屋時間表專用函式
/**
 * [LIFF日曆用] 獲取指定單一日期的預約與戶別資料
 * @param {object} payload - 包含 { projectId, date } 的物件
 * @returns {Promise<object>} - 後端回傳的結果
 */
export const getLiffCalendarDataForDay = async (payload) => {
  try {
    const getDataFunction = httpsCallable(functions, 'getLiffCalendarDataForDay');
    const result = await getDataFunction(payload);
    return result.data;
  } catch (error) {
    console.error("API Error in getLiffCalendarDataForDay:", error);
    throw new Error(error.message);
  }
};
// ✓ END




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
 * @param {object} payload - 包含 { projectId, keyword }
 * @returns {Promise<object>} - 後端回傳的結果
 */
export const searchHouseholdsForAdmin = async (payload) => {
  try {
    const searchFunction = httpsCallable(functions, 'searchHouseholdsForAdmin');
    const result = await searchFunction(payload);
    return result.data;
  } catch (error) {
    console.error("API Error in searchHouseholdsForAdmin:", error);
    throw new Error(error.message);
  }
};

/**
 * [後台用] 獲取指定建案所有預約批次的詳細資訊
 * @param {object} payload - 包含 { projectId }
 * @returns {Promise<object>} - 後端回傳的結果
 */
export const getProjectBatchDetails = async (payload) => {
  try {
    const getDetailsFunction = httpsCallable(functions, 'getProjectBatchDetails');
    const result = await getDetailsFunction(payload);
    return result.data;
  } catch (error) {
    console.error("API Error in getProjectBatchDetails:", error);
    throw new Error(error.message);
  }
};

/**
 * [後台用] 獲取行事曆所需的所有日期及其分類
 * @param {object} payload - 包含 { projectId, unitId }
 * @returns {Promise<object>} - 後端回傳的結果
 */
export const getAdminBookingCalendarData = async (payload) => {
  try {
    const getDataFunction = httpsCallable(functions, 'getAdminBookingCalendarData');
    const result = await getDataFunction(payload);
    return result.data;
  } catch (error) {
    console.error("API Error in getAdminBookingCalendarData:", error);
    throw new Error(error.message);
  }
};

/**
 * [後台用] 獲取指定單一戶別的所有預約歷史紀錄
 * @param {object} payload - 包含 { projectId, unitId }
 * @returns {Promise<object>} - 後端回傳的結果
 */
export const getAppointmentsForHousehold = async (payload) => {
  try {
    const getHistoryFunction = httpsCallable(functions, 'getAppointmentsForHousehold');
    const result = await getHistoryFunction(payload);
    return result.data;
  } catch (error) {
    console.error("API Error in getAppointmentsForHousehold:", error);
    throw new Error(error.message);
  }
};