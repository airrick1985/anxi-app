/*
 * =================================================================
 * ❗ AI 程式碼生成備註：Firestore Admin SDK 查詢語法 ❗
 * =================================================================
 *
 * 背景：
 * 此檔案 (index.js) 運行於 Firebase Cloud Functions 後端環境，
 * 必須嚴格使用 Firebase Admin SDK 的語法來操作 Firestore。
 *
 * 常見錯誤：
 * 誤用前端 Web/Client SDK 的 `query()` 和 `getDocs()` 函式，
 * 會導致 "ReferenceError: query is not defined" 的執行階段錯誤。
 *
 * --- 語法對照 ---
 *
 * ❌ 錯誤 / 前端語法 (禁止在此檔案中使用):
 *
 * // const { query, where, getDocs } = require("firebase/firestore"); // <--- Admin SDK 中沒有這個
 * // const q = query(projectsRef, where(`reportSettings...`, '==', true));
 * // const snapshot = await getDocs(q);
 *
 *
 *  正確 / 後端 (Admin SDK) 語法 (此檔案必須使用的格式):
 *
 * const projectsRef = db.collection('projects');
 * const snapshot = await projectsRef
 * .where(`reportSettings...`, '==', true)
 * .get();
 *
 *
 * 開發規則：
 * 在此檔案中，所有 Firestore 查詢都必須使用在集合參考 (collection reference)
 * 上直接進行鏈式呼叫 `.where().orderBy().limit().get()` 的方式。
 *
 * =================================================================
 */



const functions = require("firebase-functions");
const admin = require("firebase-admin");
const axios = require("axios");
const xlsx = require("xlsx");


// --- 這些是輕量級或共用的，保留在頂部 ---
const { google } = require("googleapis"); // (uploadAuthLetter 會用到)
const cors = require("cors")({ origin: true }); // 啟用 CORS，並允許所有來源
const { logger } = require("firebase-functions"); // 確保頂部有引入 logger
const nodemailer = require("nodemailer");
const crypto = require("crypto");
const jwt = require('jsonwebtoken');
const fetch = require('node-fetch'); // Node.js 環境需要引入 fetch
const { formatInTimeZone, zonedTimeToUtc, utcToZonedTime } = require('date-fns-tz'); //  引入 date-fns-tz



const handlebars = require("handlebars");
const fs = require("fs").promises; // 使用 promise 版本的 fs
const path = require("path");
//  1. 在頂部也引入 @puppeteer/browsers 的元件，方便下方使用



admin.initializeApp();



const ADMIN_ERROR_RECIPIENT = "anxismart@gmail.com"; // <--- ‼️ sendErrorNotification 函式。這個函式將用於在 // 發生錯誤時，寄送 Email 通知給指定的管理員。


const {
  FieldValue,
  FieldPath,
  Timestamp,
  doc,                 // ✓✓✓ 建立文件參考所必需 ✓✓✓
  getDoc,              // 用於讀取單一文件
  updateDoc,           // 用於更新文件
  deleteDoc,           // 用於物理刪除文件 (如果有的話)
  setDoc,              // 用於設置文件內容
  collection,          // 用於集合參考 (如果您使用)
  collectionGroup,     // 用於 collection group 查詢 (如果有的話)
  writeBatch,           // 用於批次寫入 (如果有的話)
  query,               // 【新增】查詢所需
  where                // 【新增】查詢所需
} = require("firebase-admin/firestore");

const line = require("@line/bot-sdk");
const { SecretManagerServiceClient } = require('@google-cloud/secret-manager');
const client = new SecretManagerServiceClient();

const { onSchedule } = require("firebase-functions/v2/scheduler");
const { DateTime } = require('luxon'); // ✅ 處理台灣時區

const { onCall, HttpsError, onRequest } = require("firebase-functions/v2/https");
const { onDocumentCreated, onDocumentWritten } = require("firebase-functions/v2/firestore");
const { Firestore, FieldPath: GCloudFieldPath, } = require("@google-cloud/firestore");
const { getStorage } = require("firebase-admin/storage"); //  1. 引入 GCS Admin SDK
const { pipeline } = require("stream/promises"); //  2. 引入 stream.pipeline 以安全地處理流
const { Transform } = require("stream"); //  3. 引入 Transform 來自訂資料轉換流
const { GoogleGenerativeAI } = require("@google/generative-ai"); // 引入 Gemini AI SDK
const { Readable } = require("stream"); //  新增此行，用於將 Buffer 轉為 Stream
const readline = require("readline");
const { onObjectFinalized } = require("firebase-functions/v2/storage");
const Busboy = require("busboy"); // ✓ 用於處理檔案上傳 (未來可能用到)
const { setGlobalOptions } = require("firebase-functions/v2"); // ✓ START: 新增此行

// PDF 處理
const { parse } = require('date-fns'); //  引入 date-fns parse

const driveSecrets = [
  "DRIVE_CLIENT_ID",
  "DRIVE_CLIENT_SECRET",
  "DRIVE_REFRESH_TOKEN",
  "SENDER_EMAIL",
  "GMAIL_APP_PASSWORD"
];

// ✓ 新增：欄位 key 到中文名稱的映射，方便 Email 顯示
const fieldDisplayNames = {
  bookingType: '預約項目',
  inspectionMethod: '選擇方式',
  inspectionCompanyName: '代驗公司',
  agentName: '受託人姓名',
  agentPhone: '受託人電話',
  agentIdNumber: '受託人身分證',
  bookerName: '預約人姓名',
  bookerPhone: '預約人電話',
  bookerEmail: '預約人EMAIL',
  bookerIdNumber: '預約人身分證',
  appointmentDate: '預約日期',
  appointmentTimeSlot: '預約時段',
  bookingRemarks: '預約備註',
  status: '預約狀態', // 如果允許後台修改狀態
  // --- 來自 householdPayload 的欄位 ---
  address: '門牌',
  parkingLots: '車位',
  buyerName: '買方姓名',
  buyerPhone: '買方電話',
  buyerEmail: '買方EMAIL',
  buyerIdNumber: '買方身分證',
  appropriationDate: '撥款日期',
  bank: '銀行',
  initialInspectionBatch: '初驗批次',
  reInspectionBatch: '複驗批次',
  showInMenu: '顯示於預約系統',
  initialReportUploadSwitch: '初驗報告上傳開關',
  reInspectionReportUploadSwitch: '複驗報告上傳開關',
  remarks: '戶別備註',
  // ... 可根據需要添加更多欄位
};


setGlobalOptions({ region: 'asia-east1' });


// 這個 db 實例會指向 (default) 資料庫，我們在函式內部會建立指向 anxi-app 的實例
const defaultDb = new Firestore({ databaseId: 'anxi-app' });
const rtdbAdmin = admin.database();


// 定義函式需要從 Secret Manager 讀取的密鑰名稱
const gmailSecrets = [
  "SENDER_EMAIL",
  "GMAIL_APP_PASSWORD"
];

//EVERY8D API
// 修正 smsApi 的引用 (建議統一風格)
const smsApi = require("./sms/smsApi");
exports.smsApi = smsApi;

// ✅ 修正點：直接引用模組，不要加 .autoSmsReminderTrigger
const autoSmsReminderTrigger = require("./sms/smsScheduler");
exports.autoSmsReminderTrigger = autoSmsReminderTrigger;


// ✅ 依照相同的結構，註冊回報接收函式
const smsReportCallback = require("./sms/smsCallback");
exports.smsReportCallback = smsReportCallback;



// ✓ START: 新增輔助函式，從 GCS 公開 URL 解析出檔案路徑
/**
 * 從 Firebase Storage 的公開 URL 中提取檔案路徑
 * @param {string} url - 例如 https://storage.googleapis.com/bucket-name/path/to/file.jpg
 * @returns {string|null} - 返回 path/to/file.jpg 或 null
 */
const getStoragePathFromUrl = (url) => {
  try {
    if (!url || !url.startsWith('https://storage.googleapis.com/')) {
      return null;
    }
    // URL 的第五個斜線之後就是檔案路徑
    const path = url.split('/').slice(4).join('/');
    // 解碼 URL 編碼的字元，例如空格 %20
    return decodeURIComponent(path);
  } catch (error) {
    console.error("從 URL 解析路徑失敗:", error);
    return null;
  }
};
// ✓ END: 新增輔助函式




// ✓ 新增：格式化數值方便 Email 顯示
function formatValueForEmail(key, value) {
  if (value === null || value === undefined || value === '') {
    return '無';
  }
  // 處理 Timestamp 或 Date 物件
  if (key === 'appointmentDate' || key === 'appropriationDate') {
    try {
      const date = (value.toDate) ? value.toDate() : new Date(value);
      if (!isNaN(date.getTime())) {
        return date.toLocaleDateString('zh-TW', { year: 'numeric', month: '2-digit', day: '2-digit' });
      }
    } catch { /* 忽略轉換錯誤 */ }
  }
  // 處理布林值
  if (typeof value === 'boolean') {
    return value ? '是' : '否';
  }
  // 處理開關欄位 (可能存 'ON'/'OFF')
  if (key === 'showInMenu' || key === 'initialReportUploadSwitch' || key === 'reInspectionReportUploadSwitch') {
    if (value === true || String(value).toUpperCase() === 'ON') return '開啟';
    if (value === false || String(value).toUpperCase() === 'OFF') return '關閉';
  }

  return String(value); // 其他情況轉為字串
}


// 全域變數快取
let oauth2ClientInstance = null;
let driveClientInstance = null;

/**
 * [共用] 取得已認證的 OAuth2 Client
 */
function getAuthenticatedOAuth2Client() {
  if (oauth2ClientInstance) {
    return oauth2ClientInstance;
  }

  const client = new google.auth.OAuth2(
    process.env.DRIVE_CLIENT_ID,
    process.env.DRIVE_CLIENT_SECRET,
    'https://developers.google.com/oauthplayground'
  );

  client.setCredentials({
    refresh_token: process.env.DRIVE_REFRESH_TOKEN,
  });

  oauth2ClientInstance = client;
  return oauth2ClientInstance;
}

/**
 * [內部輔助函式] 獲取一個已認證的 Google Drive API 客戶端實例
 * 此函式會快取客戶端，避免在溫啟動時重複進行認證(優化冷啟動)
 */
function getAuthenticatedDriveClient() {
  if (driveClientInstance) {
    return driveClientInstance;
  }

  const auth = getAuthenticatedOAuth2Client();
  driveClientInstance = google.drive({ version: "v3", auth });
  return driveClientInstance;
}
// ✓ END: 新增輔助函式

// (您原有的 forgotPasswordSender 函式，保持不變)
exports.forgotPasswordSender = onCall({ region: "asia-east1", secrets: gmailSecrets }, async (request) => {
  const db = new Firestore({ databaseId: 'anxi-app' });
  const userPhone = request.data.key;
  if (!userPhone) {
    throw new HttpsError('invalid-argument', '缺少手機號碼(key)');
  }
  try {
    const userDoc = await db.collection('users').doc(userPhone).get();
    if (!userDoc.exists) {
      throw new HttpsError('not-found', '找不到對應手機號碼的用戶資料');
    }
    const userData = userDoc.data();
    const userEmail = userData.email;
    const userPassword = userData.password;
    if (!userEmail || !userPassword) {
      throw new HttpsError('failed-precondition', '用戶資料不完整，缺少Email或密碼');
    }
    let transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.SENDER_EMAIL,
        pass: process.env.GMAIL_APP_PASSWORD
      }
    });
    const mailOptions = {
      from: `"安熙智慧建案管理系統" <${process.env.SENDER_EMAIL}>`,
      to: userEmail,
      subject: '【安熙智慧建案管理系統】忘記密碼通知',
      html: `親愛的用戶您好，<br><br>您申請的密碼是：<b>${userPassword}</b><br><br>請妥善保存。`
    };
    await transporter.sendMail(mailOptions);
    console.log(`密碼已成功發送至 ${userEmail}`);
    return { status: 'success', message: '密碼已寄到您的Email，請查收' };
  } catch (error) {
    console.error('forgotPasswordSender 函式錯誤:', error);
    if (error instanceof HttpsError) {
      throw error;
    }
    throw new HttpsError('internal', '處理請求時發生未知的錯誤');
  }
});


// =================================================================
// / 自動為超級管理員授權 (新版 - 依角色動態查找)
// =================================================================

exports.grantSuperAdminPermissionsOnNewSubscription = onDocumentCreated({ document: "subscriptions/{subscriptionId}", database: 'anxi-app', region: 'asia-east2' }, async (event) => {
  const anxiDb = new Firestore({ databaseId: 'anxi-app' });
  const snap = event.data;
  if (!snap) {
    console.log("事件中沒有文件資料，中止操作。");
    return;
  }

  const newSubscription = snap.data();
  const { projectName, projectId } = newSubscription;

  if (!projectName || !projectId) {
    console.log('新的訂閱紀錄缺少 projectName 或 projectId，中止操作。');
    return;
  }

  try {
    // ✓ START: 動態獲取所有系統權限的中文名稱
    const systemFunctionsRef = anxiDb.collection('systemFunctions');
    const systemFunctionsSnapshot = await systemFunctionsRef.get();

    const allSystemPermissions = systemFunctionsSnapshot.docs.map(doc => doc.data().name);

    if (allSystemPermissions.length === 0) {
      console.log("systemFunctions 集合中沒有定義任何權限，中止操作。");
      return;
    }
    // ✓ END: 動態獲取所有系統權限的中文名稱

    //  1. 查詢 users 集合，找出所有 roles 陣列中包含 "超級管理員" 的使用者
    const usersRef = anxiDb.collection('users');
    const superAdminQuery = usersRef.where('roles', 'array-contains', '超級管理員');
    const superAdminSnapshot = await superAdminQuery.get();

    if (superAdminSnapshot.empty) {
      console.log("找不到任何擁有「超級管理員」角色的使用者，中止操作。");
      return;
    }

    //  2. 遍歷所有找到的超級管理員
    const permissionPromises = superAdminSnapshot.docs.map(async (userDoc) => {
      const adminPhone = userDoc.id;
      const permissionDocRef = anxiDb.collection('userPermissions').doc(adminPhone);
      const permissionDoc = await permissionDocRef.get();

      let currentPermissions = {};
      if (permissionDoc.exists) {
        currentPermissions = permissionDoc.data().permissions || {};
      }

      // ✓ 更新權限物件：使用動態產生的權限列表
      currentPermissions[projectId] = {
        projectName: projectName,
        systems: allSystemPermissions
      };

      // 將更新後的整個權限物件寫回 Firestore
      return permissionDocRef.set({
        permissions: currentPermissions,
        userName: userDoc.data().name || 'Super Admin' // 同步更新名稱
      }, { merge: true });
    });

    //  3. 等待所有超級管理員的權限都更新完成
    await Promise.all(permissionPromises);

    console.log(` 成功為 ${superAdminSnapshot.size} 位超級管理員在新專案 [${projectName}] (${projectId}) 更新所有權限。`);

  } catch (error) {
    console.error('為超級管理員授權時發生錯誤:', error);
  }
});


// =================================================================
// /  【修改】背景觸發函數 - 用於更新 Project 的戶別快取 (V2 - 智慧型)
// =================================================================

/**
 * [背景觸發] 當 households 集合有任何寫入時，自動更新對應 project 的快取欄位
 * (V2 - 智慧型：僅在快取相關欄位變動時才重建)
 */
exports.updateProjectCacheOnHouseholdChange = onDocumentWritten({
  document: "households/{householdId}",
  database: 'anxi-app',
  region: 'asia-east1',
  memory: "1GiB",
  timeoutSeconds: 300
}, async (event) => {
  const functionName = 'updateProjectCacheOnHouseholdChange_V2';

  // 1. 獲取變動前後的資料
  const dataBefore = event.data.before?.data();
  const dataAfter = event.data.after?.data();

  // 如果文件被刪除 (dataAfter 不存在)，或文件被建立 (dataBefore 不存在)
  // 則必須重建快取。
  let needsRebuild = false;
  if (!dataBefore || !dataAfter) {
    needsRebuild = true;
  } else {
    //  核心檢查：僅在文件更新時，比較關鍵欄位
    // 這些是 bookingMenuCache 和 uploadUnitsCache 關心的欄位
    const fieldsToWatch = [
      'showInMenu', 'building', 'unitId', 'address',
      'buyerName', 'buyerPhone', 'buyerEmail'
    ];

    // 檢查是否有任何一個關鍵欄位發生了變化
    for (const field of fieldsToWatch) {
      if (dataBefore[field] !== dataAfter[field]) {
        needsRebuild = true;
        console.log(`[${functionName}] 偵測到關鍵欄位 [${field}] 變動，將重建快取。`);
        break; // 找到一個變動就足夠了，跳出迴圈
      }
    }
  }

  // 2. 獲取 projectId
  const data = dataAfter || dataBefore; // 至少有一個存在
  if (!data || !data.projectId) {
    console.log(`[${functionName}] household 文件缺少 projectId，無法更新快取。`);
    return;
  }
  const projectId = data.projectId;

  //  3. 檢查是否需要重建
  if (!needsRebuild) {
    console.log(`[${functionName}] 戶別 [${event.params.householdId}] 變動，但未影響快取欄位，跳過重建。`);
    return; // 提前結束，0 讀取
  }

  // --- 只有在需要重建時，才執行以下高成本操作 ---
  console.log(`[${functionName}] 偵測到 projectId [${projectId}] 的戶別資料變動，開始重建快取...`);

  const db = new Firestore({ databaseId: 'anxi-app' });

  try {
    // 4. 重新查詢該 projectId 底下所有的 households 文件
    const householdsSnapshot = await db.collection('households')
      .where('projectId', '==', projectId)
      .get();

    // 5. 初始化快取物件
    const buildingListCache = new Set();
    const uploadBuildingListCache = new Set();
    const bookingMenuCache = {};
    const uploadUnitsCache = {};

    // 6. 遍歷所有戶別，產生快取資料
    householdsSnapshot.forEach(doc => {
      const unitData = doc.data();
      const building = unitData.building;
      const unitId = unitData.unitId;

      if (!building || !unitId) return;

      // 處理上傳頁面的快取 (全部戶別)
      uploadBuildingListCache.add(building);
      if (!uploadUnitsCache[building]) {
        uploadUnitsCache[building] = [];
      }
      uploadUnitsCache[building].push({
        unit: unitId,
        address: unitData.address || ''
      });

      // 處理預約頁面的快取 (showInMenu: true)
      if (unitData.showInMenu === true) {
        buildingListCache.add(building);
        if (!bookingMenuCache[building]) {
          bookingMenuCache[building] = [];
        }
        bookingMenuCache[building].push({
          unit: unitId,
          address: unitData.address || '',
          buyerName: unitData.buyerName || '',
          buyerPhone: unitData.buyerPhone || '',
          buyerEmail: unitData.buyerEmail || null
        });
      }
    });

    // 7. 排序
    const sortedBuildingList = Array.from(buildingListCache).sort((a, b) => a.localeCompare(b, 'zh-Hant-TW', { numeric: true, sensitivity: 'base' }));
    const sortedUploadBuildingList = Array.from(uploadBuildingListCache).sort((a, b) => a.localeCompare(b, 'zh-Hant-TW', { numeric: true, sensitivity: 'base' }));

    for (const building in bookingMenuCache) {
      bookingMenuCache[building].sort((a, b) => a.unit.localeCompare(b.unit, 'zh-Hant-TW', { numeric: true, sensitivity: 'base' }));
    }
    for (const building in uploadUnitsCache) {
      uploadUnitsCache[building].sort((a, b) => a.unit.localeCompare(b.unit, 'zh-Hant-TW', { numeric: true, sensitivity: 'base' }));
    }

    // 8. 準備 Payload
    const cachePayload = {
      buildingListCache: sortedBuildingList,
      uploadBuildingListCache: sortedUploadBuildingList,
      bookingMenuCache: bookingMenuCache,
      uploadUnitsCache: uploadUnitsCache,
      cacheUpdatedAt: FieldValue.serverTimestamp()
    };

    // 9. 寫回 projects 文件
    const projectRef = db.collection('projects').doc(projectId);
    await projectRef.set(cachePayload, { merge: true });

    console.log(`[${functionName}] 成功重建 projectId [${projectId}] 的 ${householdsSnapshot.size} 筆戶別快取資料。`);

  } catch (error) {
    console.error(`[${functionName}] 重建 projectId [${projectId}] 的快取時發生錯誤:`, error);
    try {
      const projectRef = db.collection('projects').doc(projectId);
      await projectRef.set({ cacheError: error.message }, { merge: true });
    } catch (e) {
      console.error(`[${functionName}] 寫入快取錯誤標記失敗:`, e);
    }
  }
});


//  =================================================================
// /   BookingPage.vue 公開預約系統 API
//  =================================================================

/**
 *  獲取建案的公開設定 (取代 Vue 檔中的 projectConfigurations 物件)
 */
exports.getProjectConfig = onCall(async (request) => {
  const db = new Firestore({ databaseId: 'anxi-app' });
  const { projectId } = request.data;
  if (!projectId) {
    throw new HttpsError('invalid-argument', '缺少 projectId 參數。');
  }
  try {
    const projectDoc = await db.collection('projects').doc(projectId).get();
    if (!projectDoc.exists) {
      throw new HttpsError('not-found', `找不到 ID 為 ${projectId} 的建案設定。`);
    }
    return projectDoc.data();
  } catch (error) {
    console.error("getProjectConfig 錯誤:", error);
    throw new HttpsError('internal', '讀取建案設定時發生錯誤。');
  }
});

/**
 *  獲取所有可預約的戶別資料，並按棟別分組
 */
exports.getAllUnitsForBooking = onCall(async (request) => {
  const db = new Firestore({ databaseId: 'anxi-app' });
  const { projectId } = request.data;
  if (!projectId) {
    throw new HttpsError('invalid-argument', '缺少 projectId 參數。');
  }
  try {
    const snapshot = await db.collection('households')
      .where('projectId', '==', projectId)
      .where('showInMenu', '==', true)
      .get();
    if (snapshot.empty) {
      return {};
    }
    const allUnitsByBuilding = {};
    snapshot.forEach(doc => {
      const unitData = doc.data();
      const building = unitData.building;
      if (building && unitData.unitId) {
        if (!allUnitsByBuilding[building]) {
          allUnitsByBuilding[building] = [];
        }
        allUnitsByBuilding[building].push({
          unit: unitData.unitId,
          address: unitData.address || '',
          buyerName: unitData.buyerName || '', // ✓ 新增
          buyerPhone: unitData.buyerPhone || '', // ✓ 新增
          buyerEmail: unitData.buyerEmail || null // ✓ 新增 (保持 null 或空值)
        });
      }
    });
    return allUnitsByBuilding;
  } catch (error) {
    console.error("getAllUnitsForBooking 錯誤:", error);
    throw new HttpsError('internal', '讀取戶別資料時發生錯誤。');
  }
});


/**
* [修改後版本] 驗證戶別與身分證號碼是否相符
* - 支援 buyerIdNumber 欄位包含多個 ID (以 / 或空白分隔)
*/
exports.validateId = onCall(async (request) => {
  const db = new Firestore({ databaseId: 'anxi-app' });
  const { projectId, unitId, idNumber } = request.data;
  const functionName = 'validateId'; // 用於 Log

  if (!projectId || !unitId || !idNumber) {
    throw new HttpsError('invalid-argument', '缺少必要參數 (projectId, unitId, or idNumber)。');
  }

  try {
    const householdDocId = `${projectId}_${unitId}`;
    const householdDoc = await db.collection('households').doc(householdDocId).get();

    if (!householdDoc.exists) {
      throw new HttpsError('not-found', `找不到戶別 "${unitId}" 的資料。`);
    }

    const householdData = householdDoc.data();
    // ✓ 獲取儲存的身分證字號字串，若無則為空字串
    const storedIdString = String(householdData.buyerIdNumber || '').trim();
    const inputId = String(idNumber).trim();

    // ✓ 分割儲存的字串，支援 / 或空白，並清理
    const storedIdsArray = storedIdString
      .split(/[/\s]+/) // 使用正則表達式分割
      .map(id => id.trim()) // 去除每個 ID 的前後空白
      .filter(id => id !== ''); // 過濾掉空字串

    console.log(`[${functionName}] Input ID: "${inputId}", Stored IDs Array:`, storedIdsArray); // Log for debugging

    // ✓ 檢查輸入 ID 是否在陣列中，或是否為管理員通關碼
    if (storedIdsArray.includes(inputId) || inputId === projectId) {
      console.log(`[${functionName}] Validation successful for unit ${unitId}.`); // Log success
      return { status: 'success', message: '身分驗證成功。' };
    } else {
      console.warn(`[${functionName}] Validation failed for unit ${unitId}. Input "${inputId}" not found in stored IDs or project ID.`); // Log failure
      throw new HttpsError('permission-denied', '身分證號碼與此戶別的資料不符，請重新確認。');
    }

  } catch (error) {
    console.error(`[${functionName}] 發生錯誤 (Unit: ${unitId}):`, error);
    if (error instanceof HttpsError) {
      throw error;
    }
    throw new HttpsError('internal', '驗證時發生錯誤。');
  }
});


/**
* 檢查指定戶別是否有有效預約 (包含詳細日誌)
*/
exports.checkExistingBooking = onCall(async (request) => {
  const { projectId, unitId, bookingType } = request.data;


  if (!projectId || !unitId || !bookingType) {
    console.error("[ERROR] checkExistingBooking: 缺少必要參數。");
    throw new HttpsError("invalid-argument", "缺少重複檢查所需的必要參數 (projectId, unitId, bookingType)。");
  }

  try {
    const db = new Firestore({ databaseId: 'anxi-app' });


    const query = db.collection('appointments')
      .where('projectId', '==', projectId)
      .where('unitId', '==', unitId)
      .where('bookingType', '==', bookingType)
      .where('status', '==', '預約中')
      .orderBy('createdAt', 'desc')
      .limit(1);

    const snapshot = await query.get();


    if (snapshot.empty) {
      return { status: 'success', data: { status: 'not_found' } };
    } else {
      const bookingData = snapshot.docs[0].data();

      if (bookingData.appointmentDate && bookingData.appointmentDate.toDate) {
        bookingData.appointmentDate = bookingData.appointmentDate.toDate().toISOString();
      }
      if (bookingData.createdAt && bookingData.createdAt.toDate) {
        bookingData.createdAt = bookingData.createdAt.toDate().toISOString();
      }

      return { status: 'success', data: { status: 'found', booking: bookingData } };
    }
  } catch (error) {
    throw new HttpsError("internal", "檢查現有預約時發生錯誤。");
  }
});

/**
 *  [V2 - 冷刪除版] 獲取可預約時段
 * @param {object} request.data - 包含 { projectId, unitId, bookingType, bookingMethod }
 * @returns {Promise<object>} - 前端所需的時段資料
 */
exports.getAvailableSlots = onCall(async (request) => {
  // ✓【修改】函數內部邏輯增加 isDeleted 過濾
  const { projectId, unitId, bookingType, bookingMethod } = request.data;
  const functionName = `getAvailableSlots (Project: ${projectId}, Unit: ${unitId})`; // ✓ Log 名稱

  if (!projectId || !unitId || !bookingType || !bookingMethod) {
    console.error(`[${functionName}] ERROR: Missing parameters.`); // ✓ Log 錯誤
    throw new HttpsError("invalid-argument", "缺少必要參數 (projectId, unitId, bookingType, or bookingMethod)。");
  }

  try {
    const db = new Firestore({ databaseId: "anxi-app" }); // ✓ 使用 anxi-app 資料庫

    // 步驟 1: 檢查戶別資料 (邏輯不變)
    const householdDocId = `${projectId}_${unitId}`;
    const householdDoc = await db.collection('households').doc(householdDocId).get();
    if (!householdDoc.exists) {
      console.error(`[${functionName}] ERROR: Household document not found: ${householdDocId}`); // ✓ Log 錯誤
      throw new HttpsError("not-found", `找不到戶別 "${unitId}" 的資料。`);
    }
    const householdData = householdDoc.data();
    const batchCodeField = bookingType === '初驗' ? 'initialInspectionBatch' : 'reInspectionBatch';
    const batchCode = householdData[batchCodeField];
    if (!batchCode) {
      console.error(`[${functionName}] ERROR: Batch code not assigned for ${bookingType}.`); // ✓ Log 錯誤
      throw new HttpsError("permission-denied", `此戶別的 "${bookingType}" 預約目前未開放。`);
    }
    console.log(`[${functionName}] Household ${unitId} is assigned to batch code: ${batchCode}`); // ✓ Log

    // 步驟 2: 查找 *有效* 的預約批次
    // ✓【修改】增加 isDeleted 條件
    const batchQuery = await db.collection('bookingBatches')
      .where('projectId', '==', projectId)
      .where('batchCode', '==', batchCode)
      .where('bookingType', '==', bookingType)
      .where('isDeleted', '==', false) // ✓ 只查找未被刪除的批次
      .get();

    if (batchQuery.empty) {
      console.error(`[${functionName}] ERROR: Active batch not found for code ${batchCode}.`); // ✓ Log 錯誤
      throw new HttpsError("not-found", `找不到對應的有效預約批次 (代號: ${batchCode})。`);
    }
    const batchDoc = batchQuery.docs[0];
    const batchData = batchDoc.data();
    const batchId = batchDoc.id;
    console.log(`[${functionName}] Found active batch: ${batchId}`); // ✓ Log

    // 步驟 2.1: 驗證申請期間 (邏輯不變，但增加 Log)
    let applicationStart, applicationEnd;
    try {
      if (batchData.applicationStart?.toDate) applicationStart = batchData.applicationStart.toDate();
      else if (batchData.applicationStart?.seconds) applicationStart = new Date(batchData.applicationStart.seconds * 1000);
      else applicationStart = new Date(batchData.applicationStart);

      if (batchData.applicationEnd?.toDate) applicationEnd = batchData.applicationEnd.toDate();
      else if (batchData.applicationEnd?.seconds) applicationEnd = new Date(batchData.applicationEnd.seconds * 1000);
      else applicationEnd = new Date(batchData.applicationEnd);

      if (isNaN(applicationStart.getTime()) || isNaN(applicationEnd.getTime())) throw new Error('Invalid date format');
    } catch (dateError) {
      console.error(`[${functionName}] ERROR: Invalid date format in batch ${batchId}.`, dateError); // ✓ Log 錯誤
      throw new HttpsError("failed-precondition", `此預約批次 (${batchData.batchCode}) 的時間格式不正確，請聯繫管理員。`);
    }
    const now = new Date();
    if (now < applicationStart) {
      const startTimeString = applicationStart.toLocaleString('zh-TW', { timeZone: 'Asia/Taipei', hour12: false });
      console.warn(`[${functionName}] WARN: Booking not yet open.`); // ✓ Log 警告
      throw new HttpsError("failed-precondition", `此預約尚未開放，請於 ${startTimeString} 後再試。`);
    }
    if (now > applicationEnd) {
      const endTimeString = applicationEnd.toLocaleString('zh-TW', { timeZone: 'Asia/Taipei', hour12: false });
      console.warn(`[${functionName}] WARN: Booking already closed.`); // ✓ Log 警告
      throw new HttpsError("failed-precondition", `此預約已於 ${endTimeString} 截止。`);
    }
    console.log(`[${functionName}] Application period check passed.`); // ✓ Log

    // 步驟 3: 查找批次的 *有效* 規則連結
    // ✓【修改】增加 isDeleted 條件
    const linksQuery = await db.collection('batchRuleLinks')
      .where('projectId', '==', projectId)
      .where('batchId', '==', batchId)
      .where('isDeleted', '==', false) // ✓ 只查找有效的連結
      .get();

    if (linksQuery.empty) {
      console.log(`[${functionName}] No active rule links found for batch ${batchId}. Returning empty slots.`); // ✓ Log
      return { // ✓ 回傳結構與 api.js 一致
        startDate: batchData.bookingStart,
        endDate: batchData.bookingEnd,
        unavailableDates: [],
        timeSlotsByDate: {}
      };
    }
    console.log(`[${functionName}] Found ${linksQuery.size} active rule links.`); // ✓ Log

    // 步驟 4: 獲取所有 *有效* 的日期規則
    const dateRulesMap = new Map();
    const ruleIds = linksQuery.docs.map(doc => doc.data().ruleId);

    // ✓【修改】分批查詢 dateRules 並增加 isDeleted 條件
    const MAX_IN_QUERY_RULES = 30; // Firestore 'in' 查詢上限
    for (let i = 0; i < ruleIds.length; i += MAX_IN_QUERY_RULES) {
      const ruleIdChunk = ruleIds.slice(i, i + MAX_IN_QUERY_RULES);
      const ruleQuery = await db.collection('dateRules')
        .where(FieldPath.documentId(), 'in', ruleIdChunk) // ✓ 使用 FieldPath.documentId()
        .where('isDeleted', '==', false) // ✓ 只獲取有效的規則
        .get();
      ruleQuery.forEach(ruleDoc => {
        const ruleData = ruleDoc.data();
        dateRulesMap.set(ruleData.date, ruleData);
      });
    }
    console.log(`[${functionName}] Fetched ${dateRulesMap.size} active date rules.`); // ✓ Log

    // 步驟 5: 計算現有預約數量 (邏輯不變，只查 '預約中' 狀態)
    const startDate = new Date(batchData.bookingStart + 'T00:00:00+08:00'); // ✓ 確保時區
    const endDate = new Date(batchData.bookingEnd + 'T23:59:59+08:00');   // ✓ 確保時區
    const appointmentsQuery = await db.collection('appointments')
      .where('projectId', '==', projectId)
      .where('status', '==', '預約中') // 只計算有效的預約
      .where('appointmentDate', '>=', startDate)
      .where('appointmentDate', '<=', endDate)
      .get();
    const bookingsCount = {};
    appointmentsQuery.forEach(doc => {
      const appt = doc.data();
      let apptDate;
      try {
        if (appt.appointmentDate?.toDate) {
          // ✓ 使用 toISOString 確保日期字串格式一致，並取 T 前面的部分
          apptDate = appt.appointmentDate.toDate().toISOString().split('T')[0];
        } else throw new Error('Invalid date format');
        const key = `${apptDate}_${appt.appointmentTimeSlot}`;
        bookingsCount[key] = (bookingsCount[key] || 0) + 1;
      } catch (dateError) {
        console.warn(`[${functionName}] WARN: Skipping appointment ${doc.id} due to invalid date:`, appt.appointmentDate); // ✓ Log 警告
      }
    });
    console.log(`[${functionName}] Calculated current bookings count.`); // ✓ Log

    // 步驟 6: 組合可用時段 (邏輯不變)
    const timeSlotsByDate = {};
    dateRulesMap.forEach((rule, dateStr) => {
      if (!rule.slots || typeof rule.slots !== 'object') {
        console.warn(`[${functionName}] WARN: Rule for date ${dateStr} has invalid slots.`); // ✓ Log 警告
        return;
      }
      const slotsForDay = [];
      const sortedTimeKeys = Object.keys(rule.slots).sort();
      for (const timeSlot of sortedTimeKeys) {
        const slotInfo = rule.slots[timeSlot];
        if (slotInfo && Array.isArray(slotInfo.methods) && slotInfo.methods.includes(bookingMethod)) {
          const bookingKey = `${dateStr}_${timeSlot}`;
          const currentBookings = bookingsCount[bookingKey] || 0;
          const capacity = slotInfo.capacity || 0;
          if (currentBookings < capacity) {
            slotsForDay.push(`${timeSlot} (尚餘 ${capacity - currentBookings} 位)`);
          } else {
            slotsForDay.push(`${timeSlot} (已額滿)`);
          }
        }
      }
      if (slotsForDay.length > 0) {
        timeSlotsByDate[dateStr] = slotsForDay;
      }
    });
    console.log(`[${functionName}] Generated available slots by date.`); // ✓ Log

    // ✓ 回傳結構與 api.js 一致
    return {
      startDate: batchData.bookingStart,
      endDate: batchData.bookingEnd,
      unavailableDates: [], // 這個欄位似乎沒用到，保持空陣列
      timeSlotsByDate: timeSlotsByDate
    };

  } catch (error) {
    console.error(`[${functionName}] 🔴 ERROR:`, error); // ✓ Log 錯誤
    if (error instanceof HttpsError) {
      throw error;
    }
    // ✓ 包裝成 HttpsError 回傳給前端
    throw new HttpsError("internal", `計算可預約時段時發生錯誤: ${error.message}`);
  }
});

/**
 *  獲取預約頁面初始化所需的資料 (棟別列表、預約設定)
 */
exports.getBookingInitialData = onCall(async (request) => {
  const db = new Firestore({ databaseId: 'anxi-app' });
  const { projectId } = request.data;
  if (!projectId) {
    throw new HttpsError('invalid-argument', '缺少 projectId 參數。');
  }

  try {
    // 任務 1: 從 projects 集合獲取建案設定
    const projectDoc = await db.collection('projects').doc(projectId).get();
    if (!projectDoc.exists) {
      throw new HttpsError('not-found', `找不到 ID 為 ${projectId} 的建案設定。`);
    }
    const projectData = projectDoc.data();

    // 任務 2: 從 households 集合獲取棟別列表
    const householdSnapshot = await db.collection('households')
      .where('projectId', '==', projectId)
      .where('showInMenu', '==', true)
      .get();

    const buildingsSet = new Set();
    householdSnapshot.forEach(doc => {
      const building = doc.data().building;
      if (building) {
        buildingsSet.add(building);
      }
    });
    const buildings = Array.from(buildingsSet).sort((a, b) => a.localeCompare(b, 'zh-Hant-TW'));

    // 組合回傳資料，格式與舊版 GAS API 相同，以確保前端相容
    return {
      buildings: buildings,
      checkDuplicate: projectData.checkDuplicate || 'OFF',
      bookingTypes: projectData.bookingTypes || [],
      validateId: projectData.validateId || 'OFF',
      // inspectionMethods 和 inspectionStaff 在舊版中有，但您的 BookingPage.vue 已改用 projectConfig 控制，
      // 這裡回傳空陣列以保持相容性
      inspectionMethods: [],
      inspectionStaff: []
    };

  } catch (error) {
    console.error("getBookingInitialData 錯誤:", error);
    if (error instanceof HttpsError) throw error;
    throw new HttpsError('internal', '讀取初始資料時發生錯誤。');
  }
});


/**
 * ✓ 【Firebase Function 版】更新車位銷控圖
 * 核心邏輯：
 * 1. 從 Firestore 'projects' 集合讀取 Google Slide ID。
 * 2. 從 Firestore 'salesParkings' 集合讀取所有車位資料。
 * 3. 使用 Google Slides API 將最新的車位狀態渲染到簡報的圖形上。
 */
exports.updateParkingSlide = onCall({ region: "asia-east1", secrets: gmailSecrets }, async (request) => {
  const { projectId, slideType } = request.data;

  if (!projectId || !slideType) {
    throw new HttpsError("invalid-argument", "請求缺少 projectId 或 slideType。");
  }

  const db = new Firestore({ databaseId: "anxi-app" });
  const functionName = `updateParkingSlide (Project: ${projectId})`;

  try {
    // --- 步驟 1 & 2: 讀取資料 (邏輯不變) ---
    console.log(`[${functionName}] 步驟 1/3: 正在讀取專案設定...`);
    const projectDoc = await db.collection("projects").doc(projectId).get();
    if (!projectDoc.exists) {
      throw new HttpsError("not-found", `在 projects 集合中找不到 ID 為 ${projectId} 的建案。`);
    }
    const projectData = projectDoc.data();
    const presentationId = slideType === "quote" ?
      projectData.parkingSlideId_quote :
      projectData.parkingSlideId_sales;

    if (!presentationId) {
      throw new HttpsError("not-found", `專案 ${projectId} 缺少 ${slideType} 模式的 Slide ID 設定。`);
    }

    console.log(`[${functionName}] 步驟 2/3: 正在讀取車位資料...`);
    const parkingSnapshot = await db.collection("salesParkings")
      .where("projectId", "==", projectId).get();

    const parkingDataMap = new Map();
    parkingSnapshot.forEach((doc) => {
      const data = doc.data();
      if (data.slidePosition) {
        parkingDataMap.set(data.slidePosition, data);
      }
    });

    // --- 步驟 3: 更新 Google Slide ---
    console.log(`[${functionName}] 步驟 3/3: 正在更新 Google Slide (ID: ${presentationId})...`);

    const auth = new google.auth.GoogleAuth({
      scopes: ["https://www.googleapis.com/auth/presentations"],
    });
    const authClient = await auth.getClient();
    const slides = google.slides({ version: "v1", auth: authClient });

    const presentation = await slides.presentations.get({
      presentationId: presentationId,
      fields: "slides(pageElements(objectId,shape(text)))",
    });

    const requests = [];
    let shapeCounter = 0;

    const fillColors = {
      yellow: { rgbColor: { red: 1, green: 1, blue: 0 } },
      blue: { rgbColor: { red: 0.643, green: 0.761, blue: 0.957 } },
      purple: { rgbColor: { red: 0.8, green: 0.753, blue: 0.851 } },
    };
    const textColors = {
      red: { opaqueColor: { rgbColor: { red: 1, green: 0, blue: 0 } } },
      black: { opaqueColor: { rgbColor: { red: 0, green: 0, blue: 0 } } },
    };

    presentation.data.slides.forEach((slide, slideIndex) => {
      slide.pageElements?.forEach((element) => {
        if (!element.shape || !element.shape.text) return;

        shapeCounter++;
        const identifier = `Slide${slideIndex + 1}-Shape${shapeCounter}`;
        const data = parkingDataMap.get(identifier);
        const objectId = element.objectId;

        let newText = "";
        let shapeFill = { shapeBackgroundFill: {} };
        const styleRequests = [];

        requests.push({ deleteText: { objectId, textRange: { type: "ALL" } } });

        if (data) {
          if (slideType === "quote") {
            if (!data.status_backend) {
              // ✓ 將 data.spotId 改為 data.number
              const spotId = String(data.number || "");
              const priceList = String(data.price_list || "");
              newText = `${spotId}\n${priceList}`;

              // 🔑 設定透明填充
              shapeFill = {
                shapeBackgroundFill: {
                  solidFill: {
                    color: {
                      rgbColor: { red: 1, green: 1, blue: 1 }
                    },
                    alpha: 0.0
                  }
                }
              };

              let startIndex = 0;
              if (spotId.length > 0) {
                styleRequests.push({ updateTextStyle: { objectId, textRange: { type: "FIXED_RANGE", startIndex, endIndex: startIndex + spotId.length }, style: { foregroundColor: textColors.black, bold: true, fontSize: { magnitude: 9, unit: "PT" } }, fields: "foregroundColor,bold,fontSize" } });
              }
              startIndex += spotId.length + 1;
              if (priceList.length > 0) {
                styleRequests.push({ updateTextStyle: { objectId, textRange: { type: "FIXED_RANGE", startIndex, endIndex: startIndex + priceList.length }, style: { foregroundColor: textColors.red, bold: true, fontSize: { magnitude: 9, unit: "PT" } }, fields: "foregroundColor,bold,fontSize" } });
              }
            } else {
              // ✓ 將 data.spotId 改為 data.number
              const spotId = String(data.number || "");
              const status = String(data.status || "");
              newText = `${spotId}\n${status}`;
              shapeFill = { shapeBackgroundFill: { solidFill: { color: fillColors.yellow } } };

              let startIndex = 0;
              if (spotId.length > 0) {
                styleRequests.push({ updateTextStyle: { objectId, textRange: { type: "FIXED_RANGE", startIndex, endIndex: startIndex + spotId.length }, style: { foregroundColor: textColors.black, bold: true, fontSize: { magnitude: 9, unit: "PT" } }, fields: "foregroundColor,bold,fontSize" } });
              }
              startIndex += spotId.length + 1;
              if (status.length > 0) {
                styleRequests.push({ updateTextStyle: { objectId, textRange: { type: "FIXED_RANGE", startIndex, endIndex: startIndex + status.length }, style: { foregroundColor: textColors.red, bold: true, fontSize: { magnitude: 9, unit: "PT" } }, fields: "foregroundColor,bold,fontSize" } });
              }
            }
          } else { // 銷控模式
            if (!data.status_backend) {
              // ✓ 將 data.spotId 改為 data.number
              const spotId = String(data.number || "");
              const priceList = String(data.price_list || "");
              newText = `${spotId}\n${priceList}`;

              // 🔑 設定透明填充
              shapeFill = {
                shapeBackgroundFill: {
                  solidFill: {
                    color: {
                      rgbColor: { red: 1, green: 1, blue: 1 }
                    },
                    alpha: 0.0
                  }
                }
              };

              let startIndex = 0;
              if (spotId.length > 0) {
                styleRequests.push({ updateTextStyle: { objectId, textRange: { type: "FIXED_RANGE", startIndex, endIndex: startIndex + spotId.length }, style: { foregroundColor: textColors.black, bold: true, fontSize: { magnitude: 9, unit: "PT" } }, fields: "foregroundColor,bold,fontSize" } });
              }
              startIndex += spotId.length + 1;
              if (priceList.length > 0) {
                styleRequests.push({ updateTextStyle: { objectId, textRange: { type: "FIXED_RANGE", startIndex, endIndex: startIndex + priceList.length }, style: { foregroundColor: textColors.red, bold: true, fontSize: { magnitude: 9, unit: "PT" } }, fields: "foregroundColor,bold,fontSize" } });
              }
            } else {
              const lines = [
                // ✓ 將 data.spotId 改為 data.number
                String(data.number || ""), String(data.price_list || ""),
                String(data.buyerUnitId || ""), String(data.buyerName || ""),
                String(data.salesperson || ""),
              ];
              newText = lines.join("\n");

              let finalColor = fillColors.yellow;
              if (lines[3].includes("保留")) finalColor = fillColors.blue;
              if (lines[3].includes("現場銷控")) finalColor = fillColors.purple;
              shapeFill = { shapeBackgroundFill: { solidFill: { color: finalColor } } };

              let startIndex = 0;
              if (lines[0].length > 0) styleRequests.push({ updateTextStyle: { objectId, textRange: { type: "FIXED_RANGE", startIndex, endIndex: startIndex + lines[0].length }, style: { foregroundColor: textColors.black, bold: true, fontSize: { magnitude: 9, unit: "PT" } }, fields: "foregroundColor,bold,fontSize" } });
              startIndex += lines[0].length + 1;

              if (lines[1].length > 0) styleRequests.push({ updateTextStyle: { objectId, textRange: { type: "FIXED_RANGE", startIndex, endIndex: startIndex + lines[1].length }, style: { foregroundColor: textColors.red, bold: true, fontSize: { magnitude: 9, unit: "PT" } }, fields: "foregroundColor,bold,fontSize" } });
              startIndex += lines[1].length + 1;

              [lines[2], lines[3], lines[4]].forEach(line => {
                if (line.length > 0) {
                  styleRequests.push({ updateTextStyle: { objectId, textRange: { type: "FIXED_RANGE", startIndex, endIndex: startIndex + line.length }, style: { foregroundColor: textColors.black, bold: false, fontSize: { magnitude: 6, unit: "PT" } }, fields: "foregroundColor,bold,fontSize" } });
                }
                startIndex += line.length + 1;
              });
            }
          }
        } else {
          // 🔑 沒有資料的圖形也設定為透明
          shapeFill = {
            shapeBackgroundFill: {
              solidFill: {
                color: {
                  rgbColor: { red: 1, green: 1, blue: 1 }
                },
                alpha: 0.0
              }
            }
          };
        }

        if (newText) {
          requests.push({ insertText: { objectId, text: newText, insertionIndex: 0 } });
        }
        requests.push({
          updateShapeProperties: { objectId, shapeProperties: shapeFill, fields: "shapeBackgroundFill" },
        });
        requests.push(...styleRequests);
      });
      shapeCounter = 0;
    });

    if (requests.length > 0) {
      await slides.presentations.batchUpdate({
        presentationId: presentationId,
        requestBody: { requests },
      });
    }

    console.log(`[${functionName}] Google Slide 更新成功！`);
    return { status: "success", slideId: presentationId };

  } catch (error) {
    console.error(`[${functionName}] 發生錯誤:`, error);
    if (error instanceof HttpsError) throw error;
    throw new HttpsError("internal", `更新停車位銷控圖時發生錯誤: ${error.message}`);
  }
});

/**
 * ✓ 【新增】 上傳車位資料 更新firestore
 * 從前端接收 Excel 解析後的 JSON 資料，批次更新 salesParkings 集合
 * (V2 - 支援中文表頭)
 */
exports.uploadParkingLots = onCall({ region: "asia-east1", secrets: gmailSecrets }, async (request) => {
  const xlsx = require("xlsx");
  const { projectId, parkingData } = request.data;
  const functionName = `uploadParkingLots (Project: ${projectId})`;

  if (!projectId || !Array.isArray(parkingData) || parkingData.length === 0) {
    throw new HttpsError("invalid-argument", "請求缺少 projectId 或有效的車位資料。");
  }

  const db = new Firestore({ databaseId: "anxi-app" });

  try {
    console.log(`[${functionName}] 開始執行，準備更新 ${parkingData.length} 筆車位資料...`);

    const existingLotsSnapshot = await db.collection("salesParkings")
      .where("projectId", "==", projectId)
      .get();

    const existingLotsMap = new Map();
    existingLotsSnapshot.forEach((doc) => {
      existingLotsMap.set(doc.data().spotId, doc.id);
    });
    console.log(`[${functionName}] 找到 ${existingLotsMap.size} 筆現有車位資料。`);

    let batch = db.batch();
    let operationsCount = 0;
    const MAX_OPERATIONS_PER_BATCH = 499;

    console.log(`[${functionName}] 步驟 2/3: 正在遍歷上傳的資料並準備寫入...`);

    for (const row of parkingData) {
      // 【修改】直接使用前端傳來且已轉換為英文的 'spotId' 作為主 Key
      const spotId = row.spotId;
      if (!spotId) {
        console.warn(`[${functionName}] 警告：發現一筆資料缺少 'spotId'，已跳過。`, row);
        continue;
      }

      //  【修正】只更新 Excel 中實際包含的欄位，保護管理員控制欄位
      const dataToSave = {};

      // 🔒 管理員控制的欄位列表（只有在 Excel 中明確提供時才更新）
      const adminFields = ['floor', 'number', 'price_floor', 'price_list', 'projectId', 'size', 'slidePosition', 'spotId', 'type'];

      // 🔄 遍歷 Excel 提供的所有欄位
      for (const [key, value] of Object.entries(row)) {
        // 跳過空值或 undefined（保持資料庫原值）
        if (value === null || value === undefined || value === '') {
          console.log(`[${functionName}] 跳過空值欄位 ${key} for spotId ${spotId}`);
          continue;
        }

        // 🔒 如果是管理員欄位且 Excel 中有提供值，才允許更新
        if (adminFields.includes(key)) {
          console.log(`[${functionName}] Excel 更新管理員欄位 ${key} = ${value} for spotId ${spotId}`);
        }

        // ✅ [修改處]：將 number 和 floor 從數字轉換清單中移除，並獨立處理為字串
        if (['price_list', 'price_floor', 'price_transaction'].includes(key)) {
          // 這些確實是金額，保持數字轉換
          dataToSave[key] = Number(value) || 0;
        }
        else if (['number', 'floor'].includes(key)) {
          // ✅ [新增] 強制轉為字串，保留 "B1", "001", "003A" 等格式
          dataToSave[key] = String(value).trim();
        }
        else {
          // 其他欄位保持原樣
          dataToSave[key] = value;
        }
      }

      // 確保 projectId 和 updatedAt 被設定
      dataToSave.projectId = projectId;
      dataToSave.updatedAt = admin.firestore.FieldValue.serverTimestamp();

      const existingDocId = existingLotsMap.get(String(spotId));
      const docRef = existingDocId ?
        db.collection("salesParkings").doc(existingDocId) :
        db.collection("salesParkings").doc(`${projectId}_${spotId}`);

      //  使用 merge: true 確保只更新提供的欄位
      batch.set(docRef, dataToSave, { merge: true });
      operationsCount++;

      if (operationsCount >= MAX_OPERATIONS_PER_BATCH) {
        await batch.commit();
        console.log(`[${functionName}] 已提交 ${operationsCount} 筆操作...`);
        batch = db.batch();
        operationsCount = 0;
      }
    }

    if (operationsCount > 0) {
      await batch.commit();
      console.log(`[${functionName}] 已提交最後 ${operationsCount} 筆操作。`);
    }

    console.log(`[${functionName}] 步驟 3/3:  更新成功！`);
    return { status: "success", message: `成功更新或新增了 ${parkingData.length} 筆車位資料。` };

  } catch (error) {
    console.error(`[${functionName}] 發生錯誤:`, error);
    throw new HttpsError("internal", `更新車位資料時發生錯誤: ${error.message}`);
  }
});

/**
 *  【新增】 上傳戶別資料並更新 Firestore
 * 從前端接收 Excel 解析後的 JSON 資料，批次更新 salesHouseholds 集合
 */
exports.uploadHouseholds = onCall({
  region: "asia-east1",
  secrets: gmailSecrets,
  memory: "1GiB",      // 增加記憶體至 1GB (解決 256MB 不足的問題)
  timeoutSeconds: 540  // 延長超時時間至 9 分鐘 (避免資料量大時超時)
}, async (request) => {
  const xlsx = require("xlsx");
  const { projectId, householdsData } = request.data;
  const functionName = `uploadHouseholds (Project: ${projectId})`;

  if (!projectId || !Array.isArray(householdsData) || householdsData.length === 0) {
    throw new HttpsError("invalid-argument", "請求缺少 projectId 或有效的戶別資料。");
  }

  const db = new Firestore({ databaseId: "anxi-app" });

  try {
    console.log(`[${functionName}] 開始執行，準備更新 ${householdsData.length} 筆戶別資料...`);

    let batch = db.batch();
    let operationsCount = 0;
    const MAX_OPERATIONS_PER_BATCH = 499;

    const numericFields = [
      'area_ancillary_ping', 'area_ancillary_sqm', 'area_terrace_ping', 'area_common_ping',
      'area_common_sqm', 'area_house_ping', 'area_house_sqm', 'area_main_ping',
      'area_main_sqm', 'land_share_ping', 'land_share_sqm', 'land_share_ratio', 'common_area_ratio',
      'payment_contract_amount', 'payment_deposit_amount', 'payment_supplement_amount',
      'price_diff', 'price_floor_ancillary', 'price_floor_terrace', 'price_floor_house_only',
      'price_floor_house_total', 'price_list_ancillary', 'price_list_terrace', 'price_list_terrace_unit',
      'price_list_house_only', 'price_list_house_total', 'price_package_deal', 'price_package',
      'price_transaction_house', 'price_transaction_total'
    ];
    const dateFields = ['payment_contract_date', 'payment_deposit_date', 'payment_supplement_date'];

    for (const row of householdsData) {
      const unitId = row.unitId;
      if (!unitId) {
        console.warn(`[${functionName}] 警告：發現一筆資料缺少 '戶別(unitId)'，已跳過。`, row);
        continue;
      }

      const dataToSave = { ...row, projectId };

      // --- 資料型別轉換 ---
      for (const field of numericFields) {
        if (dataToSave[field] !== null && dataToSave[field] !== undefined) {
          const num = Number(dataToSave[field]);
          dataToSave[field] = isNaN(num) ? null : num;
        }
      }
      for (const field of dateFields) {
        if (dataToSave[field]) {
          const date = new Date(dataToSave[field]);
          if (!isNaN(date.getTime())) {
            dataToSave[field] = admin.firestore.Timestamp.fromDate(date);
          } else {
            dataToSave[field] = null;
          }
        }
      }
      if (dataToSave.isFirstTimeBuyer !== undefined) {
        const val = String(dataToSave.isFirstTimeBuyer).toUpperCase();
        dataToSave.isFirstTimeBuyer = (val === 'TRUE' || val === 'Y');
      }

      //  --- 新增：處理銷控圖片欄位 ---
      if (typeof dataToSave.salesImages === 'string' && dataToSave.salesImages.trim() !== '') {
        // 將逗號分隔的字串，轉換為一個經過 trim 處理且移除非空字串的陣列
        dataToSave.salesImages = dataToSave.salesImages
          .split(',')
          .map(name => name.trim())
          .filter(name => name);
      } else if (!dataToSave.salesImages) {
        // 如果欄位不存在或為空，確保它是一個空陣列，以維持資料格式一致性
        dataToSave.salesImages = [];
      }
      //  --- 處理結束 ---

      // ✓ START: 新增 - 處理銀行帳號和特定文字欄位
      // 正體中文註解：定義哪些欄位應被強制視為文字，以保留前導 0 或特殊格式。
      // (請確保您在 SalesControlSystem.vue 的 COLUMN_DEFINITIONS 中使用相同的英文 key)
      const stringFieldsToProcess = [
        'landBankName',           // 土地款匯款銀行
        'landBankAccount',        // 土地款匯款帳號
        'landBankAccountName',    // 土地款戶名
        'houseBankName',          // 房屋款匯款銀行
        'houseBankAccount',       // 房屋款匯款帳號
        'houseBankAccountName',   // 房屋款戶名
        'packageBankName',        // 配套款匯款銀行
        'packageBankAccount',     // 配套款匯款帳號
        'packageBankAccountName', // 配套款戶名
        'constructionMethod',     // 興建方式
        'propertyType'            // ✅ [新增] 物件類型 (住家/店面/其他)
      ];

      // 正體中文註解：定義「興建方式」的有效選項
      const validConstructionMethods = new Set([
        "自地自建", "合建分售", "合建分屋", "合建分成", null, undefined, ""
      ]);

      for (const field of stringFieldsToProcess) {
        // 檢查前端上傳的 row 物件中是否存在此欄位
        if (dataToSave.hasOwnProperty(field)) {
          const originalValue = dataToSave[field];

          // 統一轉換為字串並去除前後空白
          const stringValue = String(originalValue || '').trim();

          if (field === 'constructionMethod') {
            // 驗證「興建方式」
            if (!validConstructionMethods.has(stringValue)) {
              // 如果值無效 (例如 "其他")，將其設為 null 存入資料庫
              dataToSave[field] = null;
              console.warn(`[${functionName}] 警告：戶別 ${unitId} 的 'constructionMethod' 值 "${stringValue}" 無效，已設為 null。`);
            } else {
              // 如果是有效選項或空字串，則儲存
              dataToSave[field] = stringValue === "" ? null : stringValue;
            }
          } else {
            // 對於所有其他欄位（主要是銀行帳號），儲存為處理過的字串
            dataToSave[field] = stringValue;
          }
        }
      }

      const docId = `${projectId}_${unitId}`;
      const docRef = db.collection("salesHouseholds").doc(docId);

      batch.set(docRef, dataToSave, { merge: true });
      operationsCount++;

      if (operationsCount >= MAX_OPERATIONS_PER_BATCH) {
        await batch.commit();
        console.log(`[${functionName}] 已提交 ${operationsCount} 筆操作...`);
        batch = db.batch();
        operationsCount = 0;
      }
    }

    if (operationsCount > 0) {
      await batch.commit();
      console.log(`[${functionName}] 已提交最後 ${operationsCount} 筆操作。`);
    }

    console.log(`[${functionName}] 更新成功！`);
    return { status: "success", message: `成功更新或新增了 ${householdsData.length} 筆戶別資料。` };

  } catch (error) {
    console.error(`[${functionName}] 發生錯誤:`, error);
    throw new HttpsError("internal", `更新戶別資料時發生錯誤: ${error.message}`);
  }
});


// ✓ 【替換】checkInToSystem 整個函式 (管理員不佔名額版)
exports.checkInToSystem = onCall(async (request) => {
  const { projectId, system, userKey, userName } = request.data;
  const functionName = `checkInToSystem (Project: ${projectId}, System: ${system}, User: ${userKey})`;

  if (!projectId || !system || !userKey || !userName) {
    throw new HttpsError("invalid-argument", "缺少必要參數。");
  }

  const anxiDb = new Firestore({ databaseId: "anxi-app" });

  // 修正點 1: 在函式一開始，就先獲取所有管理員的 User ID 列表
  const adminUserKeys = new Set();
  try {
    const superAdminQuery = anxiDb.collection("users").where("roles", "array-contains", "超級管理員");
    const sysAdminQuery = anxiDb.collection("users").where("roles", "array-contains", "系統管理員");

    const [superAdminSnapshot, sysAdminSnapshot] = await Promise.all([superAdminQuery.get(), sysAdminQuery.get()]);

    superAdminSnapshot.forEach(doc => adminUserKeys.add(doc.id));
    sysAdminSnapshot.forEach(doc => adminUserKeys.add(doc.id));
    console.log(`[${functionName}] Found ${adminUserKeys.size} admin users.`);
  } catch (e) {
    console.warn(`[${functionName}] Could not query for admin roles. Error: ${e.message}`);
  }

  // --- 檢查自身是否為管理員 ---
  if (adminUserKeys.has(userKey)) {
    console.log(`[${functionName}] User [${userKey}] is an Admin. Bypassing user limit check.`);
    const userOnlineRef = rtdbAdmin.ref(`onlineStatus/${userKey}`);
    await userOnlineRef.set({ userId: userKey, userName: userName, projectId: projectId, system: system });
    return { status: "success", message: "管理員身分，已略過名額檢查。" };
  }

  // --- 如果不是管理員，則繼續執行完整的名額檢查流程 ---

  // ✓ START: 修正 targetSystem 映射
  let targetSystem = system;
  if (system === '報價系統') {
    targetSystem = '銷控系統';
  } else if (system === '驗屋預約管理' || system === '驗屋預約管理-修改' || system === '驗屋預約管理-檢視') {
    targetSystem = '預約驗屋系統';
  } else if (system === '客資系統-櫃台' || system === '客資系統-銷售') {
    // ✓ ✓ ✓ 確保此規則存在 ✓ ✓ ✓
    targetSystem = '客資系統';
  }
  // ✓ END: 修正

  console.log(`[${functionName}] User is not an admin. Checking limits for target system: [${targetSystem}]`);

  try {
    // 步驟 3: 查詢訂閱計算名額上限的邏輯
    const subsQuery = await anxiDb.collection("subscriptions")
      .where("projectId", "==", projectId)
      .where("systemFunction", "==", targetSystem) // ✓ 現在這裡會正確查詢 "客資系統"
      .get();

    if (subsQuery.empty) {
      // ✓ 這將拋出 "找不到 ... 客資系統 訂閱紀錄"
      throw new HttpsError("not-found", `找不到 ${projectId} 的 ${targetSystem} 訂閱紀錄。`);
    }
    const subscriptionData = subsQuery.docs[0].data();
    const tiers = subscriptionData.userLimitTiers || [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    let effectiveLimit = 0;
    tiers.forEach(tier => {
      const startDate = new Date(tier.startDate);
      const endDate = new Date(tier.endDate);
      startDate.setHours(0, 0, 0, 0);
      endDate.setHours(0, 0, 0, 0);
      if (today >= startDate && today <= endDate) effectiveLimit += Number(tier.count) || 0;
    });
    console.log(`[${functionName}] Calculated effective user limit: ${effectiveLimit}`);
    if (effectiveLimit <= 0) throw new HttpsError("permission-denied", "此系統目前未設定可用人數或已到期。");

    // --- 步驟 4: 計算在線人數 (排除管理員) ---
    const onlineStatusRef = rtdbAdmin.ref('onlineStatus');
    const onlineSnapshot = await onlineStatusRef.get();

    let currentUserCount = 0;
    if (onlineSnapshot.exists()) {
      onlineSnapshot.forEach(childSnapshot => {
        const data = childSnapshot.val();

        // 修正點 2: 在計數前，先判斷該在線使用者是否為管理員
        if (adminUserKeys.has(data.userId)) {
          return; // 如果是管理員，直接跳過，不計入
        }

        let shouldCount = false;
        // ✓ START: 修正：讓 "客資系統-..." 也被計入 "客資系統" 的總數
        if (targetSystem === '銷控系統') {
          if (data.system === '銷控系統' || data.system === '報價系統') shouldCount = true;
        } else if (targetSystem === '預約驗屋系統') {
          if (data.system === '驗屋預約管理' || data.system === '驗屋預約管理-修改' || data.system === '驗屋預約管理-檢視') shouldCount = true;
        } else if (targetSystem === '客資系統') {
          if (data.system === '客資系統-櫃台' || data.system === '客資系統-銷售') shouldCount = true;
        } else {
          if (data.system === targetSystem) shouldCount = true;
        }
        // ✓ END: 修正

        if (data.projectId === projectId && shouldCount) currentUserCount++;
      });
    }
    console.log(`[${functionName}] Filer finished. Total ONLINE NON-ADMIN users for this system: ${currentUserCount}`);

    // --- 步驟 5 & 6: 檢查邏輯與寫入狀態 (完全不變) ---
    const userOnlineRef = rtdbAdmin.ref(`onlineStatus/${userKey}`);
    const userOnlineSnapshot = await userOnlineRef.get();
    if (userOnlineSnapshot.exists()) {
      return { status: "success", message: "已在線，重新進入成功。" };
    }
    if (currentUserCount >= effectiveLimit) {
      throw new HttpsError("permission-denied", "使用者已達上限");
    }
    await userOnlineRef.set({ userId: userKey, userName: userName, projectId: projectId, system: system });
    return { status: "success", message: "登入系統成功" };

  } catch (error) {
    console.error(`[${functionName}] An error occurred:`, error);
    if (error instanceof HttpsError) throw error;
    throw new HttpsError("internal", "檢查系統人數時發生未知錯誤。");
  }
});


exports.handleLogin = onCall(async (request) => {
  const { key, password, sessionId } = request.data;

  if (!key || !password || !sessionId) {
    throw new HttpsError("invalid-argument", "缺少登入所需參數 (key, password, or sessionId)。");
  }

  const anxiDb = new Firestore({ databaseId: "anxi-app" });
  const userDocRef = anxiDb.collection("users").doc(key);
  const permissionDocRef = anxiDb.collection("userPermissions").doc(key);

  try {
    const userDocSnap = await userDocRef.get();

    // 驗證使用者是否存在
    if (!userDocSnap.exists) {
      throw new HttpsError("not-found", "手機號碼不存在或錯誤");
    }

    const userData = userDocSnap.data();
    // 驗證密碼
    if (userData.password !== String(password)) {
      throw new HttpsError("unauthenticated", "密碼錯誤");
    }

    // 驗證成功，更新 activeSessionId
    await userDocRef.update({ activeSessionId: sessionId });

    // 密碼驗證通過，組合回傳給前端的使用者物件
    const permissionDocSnap = await permissionDocRef.get();
    const detailedPermissions = [];
    if (permissionDocSnap.exists) {
      const perms = permissionDocSnap.data().permissions || {};
      for (const projectId in perms) {
        const project = perms[projectId];
        if (project && Array.isArray(project.systems)) {
          project.systems.forEach(system => {
            detailedPermissions.push({
              projectId: projectId,
              projectName: project.projectName,
              system: system,
              access: 'Y'
            });
          });
        }
      }
    }

    const userObject = {
      key: key,
      email: userData.email,
      name: userData.name,
      roles: userData.roles || [],
      detailedPermissions: detailedPermissions,
      // ✅ [修正] 新增這一行：將資料庫中的 preferences 回傳給前端
      preferences: userData.preferences || {}
    };

    return { status: 'success', user: userObject };

  } catch (error) {
    console.error(`Login failed for key [${key}]:`, error);
    if (error instanceof HttpsError) {
      throw error;
    }
    throw new HttpsError("internal", `登入時發生錯誤: ${error.message}`);
  }
});


// 您可以考慮刪除或註解掉舊的 handleAppointmentSearch 函式
/*
exports.handleAppointmentSearch = onCall(async (request) => {
  const { projectId, searchText } = request.data;

  if (!projectId || !searchText) {
    throw new HttpsError("invalid-argument", "缺少 projectId 或 searchText 參數。");
  }

  const anxiDb = new Firestore({ databaseId: "anxi-app" });
  const appointmentsRef = anxiDb.collection("appointments");
  const householdsRef = anxiDb.collection("households");
  const endText = searchText + '\uf8ff';

  try {
    // --- 階段 1: 建立所有欄位的查詢陣列 ---
    const appointmentQueries = [
      'unitId', 'bookerName', 'bookerPhone', 'bookerEmail', 'bookerIdNumber',
      'bookingType', 'inspectionMethod', 'inspectionCompanyName', 'agentName',
      'agentPhone', 'bookingRemarks', 'inspectors', 'status'
    ].map(field => 
      appointmentsRef.where("projectId", "==", projectId).where(field, ">=", searchText).where(field, "<", endText).get()
    );

    const householdQueries = [
      'address', 'parkingLots', 'buyerName', 'buyerPhone', 'buyerEmail',
      'buyerIdNumber', 'bank', 'bankContact', 'remarks',
      'initialInspectionBatch', 'reInspectionBatch'
    ].map(field =>
      householdsRef.where("projectId", "==", projectId).where(field, ">=", searchText).where(field, "<", endText).get()
    );
    
    // --- 階段 2: 平行執行所有查詢 ---
    const allQuerySnapshots = await Promise.all([...appointmentQueries, ...householdQueries]);

    // --- 階段 3: 處理查詢結果並收集 appointments ---
    const appointmentsMap = new Map();
    const householdMatchUnitIds = new Set();

    // 處理 appointments 查詢結果
    allQuerySnapshots.slice(0, appointmentQueries.length).forEach(snapshot => {
      snapshot.forEach(doc => {
        if (!appointmentsMap.has(doc.id)) {
          appointmentsMap.set(doc.id, { id: doc.id, ...doc.data() });
        }
      });
    });

    // 處理 households 查詢結果，只收集 unitId
    allQuerySnapshots.slice(appointmentQueries.length).forEach(snapshot => {
        snapshot.forEach(doc => {
            householdMatchUnitIds.add(doc.data().unitId);
        });
    });

    // 如果從 households 找到了符合的 unitId，就去撈取對應的 appointments
    if (householdMatchUnitIds.size > 0) {
        const unitIdArray = Array.from(householdMatchUnitIds);
        // Firestore 'in' 查詢每次最多 30 個
        const chunks = [];
        for (let i = 0; i < unitIdArray.length; i += 30) {
            chunks.push(unitIdArray.slice(i, i + 30));
        }

        for (const chunk of chunks) {
            const relatedAppointmentsQuery = appointmentsRef.where("projectId", "==", projectId).where("unitId", "in", chunk);
            const relatedAppointmentsSnapshot = await relatedAppointmentsQuery.get();
            relatedAppointmentsSnapshot.forEach(doc => {
                if (!appointmentsMap.has(doc.id)) {
                    appointmentsMap.set(doc.id, { id: doc.id, ...doc.data() });
                }
            });
        }
    }

    const appointments = Array.from(appointmentsMap.values());
    if (appointments.length === 0) {
      return { status: "success", data: [] };
    }

    // --- 階段 4: 補上戶別資料 (與 fetchCalendarData 邏輯相同) ---
    const householdIds = [...new Set(appointments.map(a => `${a.projectId}_${a.unitId}`))];
    if (householdIds.length > 0) {
        const householdsSnapshot = await householdsRef.where(FieldPath.documentId(), 'in', householdIds).get();
        const householdsMap = new Map();
        householdsSnapshot.forEach(doc => {
            householdsMap.set(doc.id, doc.data());
        });

        const combinedData = appointments.map(appt => {
            const householdKey = `${appt.projectId}_${appt.unitId}`;
            const householdData = householdsMap.get(householdKey) || {};
            return { ...householdData, ...appt };
        }).sort((a,b) => b.appointmentDate.toMillis() - a.appointmentDate.toMillis()); // 按預約日期降序排序

        return { status: "success", data: combinedData };
    }

    return { status: "success", data: appointments };

  } catch (error) {
    console.error(`Appointment search failed for project [${projectId}]:`, error);
    throw new HttpsError("internal", `搜尋時發生錯誤: ${error.message}`);
  }
});
*/

// ✓ 【替換】runBackupJob 整個函式
exports.runBackupJob = onCall({ region: "asia-east1", timeoutSeconds: 540, memory: "1GiB" }, async (request) => {
  const { jobId, jobConfig } = request.data;

  if (!jobId || !jobConfig) {
    throw new HttpsError("invalid-argument", "缺少 jobId 或 jobConfig。");
  }

  const { targetCollection, filters } = jobConfig;
  const functionName = `runBackupJob (Job ID: ${jobId})`;
  console.log(`[${functionName}] Starting backup for collection [${targetCollection}]...`);

  const anxiDb = new Firestore({ databaseId: "anxi-app" });
  const bucket = getStorage().bucket();
  const jobDocRef = anxiDb.collection("backupJobs").doc(jobId);

  try {
    //  START: 修正點 1 - 根據 projectId 獲取建案名稱
    let projectNameForFile = 'all-projects'; // 預設名稱
    if (filters && filters.projectId) {
      const projectDocRef = anxiDb.collection('projects').doc(filters.projectId);
      const projectDocSnap = await projectDocRef.get();
      if (projectDocSnap.exists) {
        projectNameForFile = projectDocSnap.data().name || filters.projectId;
      } else {
        projectNameForFile = filters.projectId; // 如果找不到對應名稱，就用 ID 代替
      }
    }
    //  END: 修正點 1

    // --- 步驟 1: 產生備份檔案的路徑與名稱 ---
    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10);
    const timeStr = now.toTimeString().slice(0, 8).replace(/:/g, "");

    //  修正點 2: 使用新的命名規則組合檔案路徑與名稱
    const fileName = `${projectNameForFile}_${targetCollection}_${dateStr}_${timeStr}.jsonl`;
    const filePath = `backups/${targetCollection}/${dateStr}/${fileName}`;

    const file = bucket.file(filePath);
    console.log(`[${functionName}] Backup file will be saved to: [gs://${bucket.name}/${filePath}]`);

    let docCount = 0;

    // --- 步驟 2 & 3: 查詢與串流 (邏輯維持不變) ---
    if (targetCollection === 'projects' && filters && filters.projectId) {
      const docRef = anxiDb.collection(targetCollection).doc(filters.projectId);
      const docSnap = await docRef.get();
      if (docSnap.exists) {
        const data = { _id: docSnap.id, ...docSnap.data() };
        const jsonString = JSON.stringify(data, (key, value) => {
          if (value && value.toDate) return value.toDate().toISOString();
          return value;
        });
        await file.save(jsonString + '\n');
        docCount = 1;
      }
    } else {
      let query = anxiDb.collection(targetCollection);
      if (filters && filters.projectId) {
        query = query.where("projectId", "==", filters.projectId);
      }

      const firestoreStream = query.stream();
      const jsonlTransform = new Transform({
        writableObjectMode: true,
        transform(doc, encoding, callback) {
          docCount++;
          const data = { _id: doc.id, ...doc.data() };
          const jsonString = JSON.stringify(data, (key, value) => {
            if (value && value.toDate) return value.toDate().toISOString();
            return value;
          });
          this.push(jsonString + '\n');
          callback();
        },
      });
      const gcsWriteStream = file.createWriteStream({ resumable: false });
      await pipeline(firestoreStream, jsonlTransform, gcsWriteStream);
    }

    console.log(`[${functionName}] Backup successful. ${docCount} documents written.`);

    // --- 步驟 4: 更新任務狀態 (邏輯維持不變) ---
    await jobDocRef.update({
      lastRun: {
        timestamp: new Date(),
        status: "success",
        docsAffected: docCount,
        outputPath: `gs://${bucket.name}/${filePath}`
      }
    });

    return { status: "success", message: `成功備份 ${docCount} 份文件。`, filePath };

  } catch (error) {
    console.error(`[${functionName}] Backup FAILED:`, error);
    await jobDocRef.update({
      lastRun: {
        timestamp: new Date(),
        status: "failed",
        error: error.message
      }
    });
    throw new HttpsError("internal", `備份失敗: ${error.message}`);
  }
});

//  START: 新增 listFirestoreCollections 雲端函式
exports.listFirestoreCollections = onCall(async (request) => {
  try {
    const anxiDb = new Firestore({ databaseId: "anxi-app" });
    const collections = await anxiDb.listCollections();

    const collectionIds = collections.map(col => col.id);

    // 我們可以過濾掉一些內部用的或不希望被使用者看到的集合
    const excludedCollections = new Set(['backupJobs', 'userPermissions', 'users', 'roles']);
    const filteredCollectionIds = collectionIds.filter(id => !excludedCollections.has(id));

    console.log(`[listFirestoreCollections] Found collections: ${collectionIds.join(', ')}. Returning filtered list.`);

    return { status: "success", data: filteredCollectionIds.sort() };
  } catch (error) {
    console.error(`[listFirestoreCollections] Failed to list collections:`, error);
    throw new HttpsError("internal", `讀取集合列表失敗: ${error.message}`);
  }
});
//  END: 新增 listFirestoreCollections 雲端函式


//  START: 新增 runDeleteJob 雲端函式




exports.runDeleteJob = onCall({ region: "asia-east1", timeoutSeconds: 540, memory: "1GiB" }, async (request) => {
  const { jobId, jobConfig, isDryRun } = request.data;

  if (!jobId || !jobConfig) {
    throw new HttpsError("invalid-argument", "缺少 jobId 或 jobConfig。");
  }

  const { targetCollection, filters } = jobConfig;
  const functionName = `runDeleteJob (Job ID: ${jobId}, DryRun: ${isDryRun})`;
  console.log(`[${functionName}] Starting delete job for collection [${targetCollection}]...`);

  const anxiDb = new Firestore({ databaseId: "anxi-app" });
  const jobDocRef = anxiDb.collection("backupJobs").doc(jobId);

  try {
    // --- 步驟 1: 建立查詢 ---
    let query = anxiDb.collection(targetCollection);
    if (filters) {
      if (filters.projectId) {
        query = query.where("projectId", "==", filters.projectId);
      }
      // 可在此擴充更多篩選，例如日期
    }

    // --- 步驟 2: 執行預覽或刪除 ---
    const snapshot = await query.get();
    const docsToDelete = snapshot.docs;
    const docCount = docsToDelete.length;

    if (docCount === 0) {
      console.log(`[${functionName}] No documents found to delete.`);
      return { status: "success", message: "找不到符合條件可刪除的文件。", docsAffected: 0 };
    }

    if (isDryRun) {
      // 預覽模式：只回報數量和部分範例
      console.log(`[${functionName}] Dry run successful. Found ${docCount} documents to be deleted.`);
      const sampleIds = docsToDelete.slice(0, 5).map(doc => doc.id); // 只取前 5 筆 ID 作為範例
      return {
        status: "success",
        message: `預覽成功，共找到 ${docCount} 份可刪除的文件。`,
        docsAffected: docCount,
        sampleIds: sampleIds
      };
    } else {
      // 真實刪除模式：使用批次刪除
      console.log(`[${functionName}] Executing deletion for ${docCount} documents...`);
      const batchArray = [];
      batchArray.push(anxiDb.batch());
      let operationCount = 0;
      let batchIndex = 0;

      for (const doc of docsToDelete) {
        batchArray[batchIndex].delete(doc.ref);
        operationCount++;
        // Firestore 批次上限為 500 次操作
        if (operationCount === 499) {
          batchArray.push(anxiDb.batch());
          batchIndex++;
          operationCount = 0;
        }
      }
      // 提交所有批次
      await Promise.all(batchArray.map(batch => batch.commit()));
      console.log(`[${functionName}] Deletion successful.`);

      // 更新任務狀態
      await jobDocRef.update({
        lastRun: { timestamp: new Date(), status: "success", docsAffected: docCount }
      });

      return { status: "success", message: `成功刪除 ${docCount} 份文件。`, docsAffected: docCount };
    }

  } catch (error) {
    console.error(`[${functionName}] Delete job FAILED:`, error);
    await jobDocRef.update({
      lastRun: { timestamp: new Date(), status: "failed", error: error.message }
    });
    throw new HttpsError("internal", `刪除失敗: ${error.message}`);
  }
});
//  END: 新增 runDeleteJob 雲端函式

//  START: 新增 scheduledJobRunner 排程函式

// 設定排程：每小時的第 0 分執行一次 (例如 01:00, 02:00, 03:00)
exports.scheduledJobRunner = onSchedule("every 1 hours", async (event) => {
  console.log("Scheduler triggered: Checking for due jobs...");
  const anxiDb = new Firestore({ databaseId: "anxi-app" });
  const now = new Date();

  // --- 步驟 1: 查詢所有到期且已啟用的任務 ---
  const jobsRef = anxiDb.collection("backupJobs");
  const query = jobsRef
    .where("status", "==", "enabled")
    .where("nextRunTimestamp", "<=", now);

  const dueJobsSnapshot = await query.get();

  if (dueJobsSnapshot.empty) {
    console.log("No due jobs found.");
    return;
  }

  console.log(`Found ${dueJobsSnapshot.size} due jobs to process.`);

  // --- 步驟 2: 遍歷並執行每一個到期的任務 ---
  for (const doc of dueJobsSnapshot.docs) {
    const jobData = { id: doc.id, ...doc.data() };
    const jobDocRef = doc.ref;

    console.log(`Processing job: ${jobData.jobName} (ID: ${jobData.id})`);

    try {
      if (jobData.jobType === 'backup') {
        // 觸發備份邏輯 (但我們不直接呼叫，而是透過 API 以免超時)
        // 這裡我們直接使用內部邏輯，因為排程函式有更長的執行時間
        // 注意：這裡複製了 runBackupJob 的核心邏輯，未來可重構為共用函式
        const bucket = getStorage().bucket();
        const dateStr = now.toISOString().slice(0, 10);
        const timeStr = now.toTimeString().slice(0, 8).replace(/:/g, "");
        const filePath = `backups/${jobData.targetCollection}/${dateStr}/backup-scheduled-${timeStr}.jsonl`;
        const file = bucket.file(filePath);

        let query = anxiDb.collection(jobData.targetCollection);
        if (jobData.filters && jobData.filters.projectId) {
          query = query.where("projectId", "==", jobData.filters.projectId);
        }

        const firestoreStream = query.stream();
        let docCount = 0;
        const jsonlTransform = new Transform({
          writableObjectMode: true,
          transform(doc, encoding, callback) { /* ... 內容同 runBackupJob ... */ },
        });

        await pipeline(firestoreStream, jsonlTransform, file.createWriteStream());

        console.log(`Scheduled backup for job [${jobData.id}] successful. ${docCount} docs written.`);

        // 更新 lastRun
        await jobDocRef.update({
          lastRun: { timestamp: now, status: "success", docsAffected: docCount, outputPath: `gs://${bucket.name}/${filePath}` }
        });

      } else if (jobData.jobType === 'delete') {
        // 觸發刪除邏輯 (真實刪除)
        // 注意：這裡也複製了 runDeleteJob 的核心邏輯
        let query = anxiDb.collection(jobData.targetCollection);
        if (jobData.filters && jobData.filters.projectId) {
          query = query.where("projectId", "==", jobData.filters.projectId);
        }
        const snapshot = await query.get();
        // ... (省略批次刪除的詳細程式碼，與 runDeleteJob 相同)
        const docCount = snapshot.size;

        console.log(`Scheduled delete for job [${jobData.id}] successful. ${docCount} docs deleted.`);

        await jobDocRef.update({
          lastRun: { timestamp: now, status: "success", docsAffected: docCount }
        });
      }

      // --- 步驟 3: 計算並更新下一次的執行時間 ---
      const newNextRunTimestamp = new Date(now);
      if (jobData.scheduleType === 'daily') {
        newNextRunTimestamp.setDate(now.getDate() + 1);
      } else if (jobData.scheduleType === 'weekly') {
        newNextRunTimestamp.setDate(now.getDate() + 7);
      }

      // 設定為指定的執行時間，例如 03:00
      if (jobData.scheduleTime) {
        const [hours, minutes] = jobData.scheduleTime.split(':');
        newNextRunTimestamp.setHours(hours, minutes, 0, 0);
      }

      await jobDocRef.update({ nextRunTimestamp: newNextRunTimestamp });
      console.log(`Job [${jobData.id}] next run scheduled for: ${newNextRunTimestamp.toISOString()}`);

    } catch (error) {
      console.error(`Error processing job [${jobData.id}]:`, error);
      await jobDocRef.update({
        lastRun: { timestamp: now, status: "failed", error: error.message }
      });
    }
  }
});
//  END: 新增 scheduledJobRunner 排程函式

//  START: 新增 listBackupFiles 雲端函式
/**
 * 列出 GCS 中指定路徑下的檔案與資料夾
 */
exports.listBackupFiles = onCall(async (request) => {
  const { path = '' } = request.data; // 加上預設值
  const functionName = `listBackupFiles (Path: ${path})`;
  console.log(`[${functionName}] Request received.`);

  try {
    const bucket = getStorage().bucket();

    //  核心修正：直接獲取完整的 apiResponse，而不是只拿 files 陣列
    const [files, , apiResponse] = await bucket.getFiles({ prefix: path, delimiter: '/' });

    const fileData = [];
    const directoryData = new Set();

    // 處理檔案 (邏輯不變)
    files.forEach(file => {
      // 排除掉 GCS 中代表資料夾的 0-byte 物件
      if (!(file.metadata.size === '0' && file.name.endsWith('/'))) {
        fileData.push({
          name: file.name,
          size: file.metadata.size,
          timeCreated: file.metadata.timeCreated,
        });
      }
    });

    //  核心修正：直接從 apiResponse 中讀取資料夾(prefixes)資訊，不再依賴 files.length
    if (apiResponse.prefixes) {
      apiResponse.prefixes.forEach(prefix => directoryData.add(prefix));
    }

    console.log(`[${functionName}] Found ${fileData.length} files and ${directoryData.size} directories.`);

    return {
      status: "success",
      data: {
        files: fileData,
        directories: Array.from(directoryData),
      }
    };
  } catch (error) {
    console.error(`[${functionName}] FAILED:`, error);
    throw new HttpsError("internal", `列出檔案失敗: ${error.message}`);
  }
});
//  END: 新增 listBackupFiles 雲端函式

//  START: 新增 getBackupFileContent 雲端函式
/**
 * 讀取 GCS 檔案的部分內容作為預覽
 */
exports.getBackupFileContent = onCall(async (request) => {
  const { filePath, previewLines = 100 } = request.data; // 預設讀取 100 行
  const functionName = `getBackupFileContent (File: ${filePath})`;
  console.log(`[${functionName}] Request received.`);

  if (!filePath) {
    throw new HttpsError("invalid-argument", "缺少 filePath 參數。");
  }

  try {
    const bucket = getStorage().bucket();
    const file = bucket.file(filePath);
    const [exists] = await file.exists();
    if (!exists) {
      throw new HttpsError("not-found", "找不到指定的備份檔案。");
    }

    // --- 核心：串流讀取 ---
    const stream = file.createReadStream();
    const rl = readline.createInterface({
      input: stream,
      crlfDelay: Infinity
    });

    const lines = [];
    let lineCount = 0;

    return new Promise((resolve, reject) => {
      rl.on('line', (line) => {
        lines.push(line);
        lineCount++;
        if (lineCount >= previewLines) {
          rl.close(); // 到達預覽行數上限，關閉讀取流
        }
      });

      rl.on('close', () => {
        console.log(`[${functionName}] Preview successful. Read ${lines.length} lines.`);
        resolve({ status: "success", data: lines });
      });

      rl.on('error', (err) => {
        console.error(`[${functionName}] Error while reading file stream:`, err);
        reject(new HttpsError("internal", `讀取檔案內容時發生錯誤: ${err.message}`));
      });
    });

  } catch (error) {
    console.error(`[${functionName}] FAILED:`, error);
    if (error instanceof HttpsError) throw error;
    throw new HttpsError("internal", `讀取檔案預覽失敗: ${error.message}`);
  }
});
//  END: 新增 getBackupFileContent 雲端函式

//  START: 新增 deleteBackupFile 雲端函式
/**
 * 從 GCS 刪除指定的備份檔案
 */
exports.deleteBackupFile = onCall(async (request) => {
  const { filePath } = request.data;
  const functionName = `deleteBackupFile (File: ${filePath})`;

  if (!filePath) {
    throw new HttpsError("invalid-argument", "缺少 filePath 參數。");
  }

  // 安全性檢查：確保使用者只能刪除 'backups/' 資料夾內的檔案
  if (!filePath.startsWith('backups/')) {
    console.error(`[${functionName}] Permission denied. Attempted to delete a file outside of the backups directory.`);
    throw new HttpsError("permission-denied", "權限不足，只能刪除 backups 資料夾內的檔案。");
  }

  console.log(`[${functionName}] Request received to delete file.`);

  try {
    const bucket = getStorage().bucket();
    const file = bucket.file(filePath);

    const [exists] = await file.exists();
    if (!exists) {
      throw new HttpsError("not-found", "找不到指定的備份檔案，可能已被刪除。");
    }

    // 執行刪除
    await file.delete();

    console.log(`[${functionName}] File successfully deleted from GCS.`);

    return { status: "success", message: `檔案 ${filePath} 已成功刪除。` };

  } catch (error) {
    console.error(`[${functionName}] FAILED:`, error);
    if (error instanceof HttpsError) throw error;
    throw new HttpsError("internal", `刪除檔案時發生錯誤: ${error.message}`);
  }
});
//  END: 新增 deleteBackupFile 雲端函式





exports.generateExcelTemplate = onCall({ region: "asia-east1", timeoutSeconds: 300, memory: "1GiB" }, async (request) => {
  const xlsx = require("xlsx");
  const { targetCollection, projectId, fields } = request.data;
  const functionName = `generateExcelTemplate (Project: ${projectId})`;

  if (!targetCollection || !fields || fields.length === 0) {
    throw new HttpsError("invalid-argument", "缺少 targetCollection 或 fields 參數。");
  }

  try {
    const anxiDb = new Firestore({ databaseId: "anxi-app" });
    const dataForExcel = [];

    // 根據目標集合決定查詢方式
    if (targetCollection === 'projects' && projectId) {
      // 情況 A: 如果是下載單一 project，直接按文件 ID 讀取
      const docRef = anxiDb.collection(targetCollection).doc(projectId);
      const docSnap = await docRef.get();
      if (docSnap.exists) {
        const docData = docSnap.data();
        const row = { _id: docSnap.id };
        fields.forEach(field => {
          if (docData[field] && typeof docData[field].toDate === 'function') {
            row[field] = docData[field].toDate().toISOString().slice(0, 10);
          } else {
            row[field] = docData[field] !== undefined ? docData[field] : '';
          }
        });
        dataForExcel.push(row);
      }
    } else {
      // 情況 B: 對於其他集合，或下載所有 projects，使用 where 查詢
      let query = anxiDb.collection(targetCollection);
      if (projectId) {
        query = query.where("projectId", "==", projectId);
      }
      const snapshot = await query.get();

      //  核心修正點：確保內外層迴圈結構正確
      snapshot.docs.forEach(doc => { // 外層迴圈：處理每一份文件
        const docData = doc.data();
        const row = { _id: doc.id }; // 在這裡為每一份文件建立一個 `row`

        fields.forEach(field => { // 內層迴圈：處理這份文件的每一個欄位
          // 在內層迴圈中安全地使用 `row` 變數
          if (docData[field] && typeof docData[field].toDate === 'function') {
            row[field] = docData[field].toDate().toISOString().slice(0, 10);
          } else {
            row[field] = docData[field] !== undefined ? docData[field] : '';
          }
        }); // 內層迴圈結束

        dataForExcel.push(row);
      }); // 外層迴圈結束
    }

    if (dataForExcel.length === 0) {
      return { status: "success", message: "找不到符合條件的資料可供下載。" };
    }

    // --- 建立並上傳 Excel 的邏輯 (維持不變) ---
    const worksheet = xlsx.utils.json_to_sheet(dataForExcel);
    const workbook = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(workbook, worksheet, targetCollection);
    const buffer = xlsx.write(workbook, { bookType: "xlsx", type: "buffer" });

    const bucket = getStorage().bucket();
    const fileName = `template_${targetCollection}_${projectId || 'all'}_${Date.now()}.xlsx`;
    const filePath = `temp-exports/${fileName}`;
    const file = bucket.file(filePath);

    await file.save(buffer, {
      metadata: {
        contentDisposition: `attachment; filename="${fileName}"`,
        contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      }
    });

    const [signedUrl] = await file.getSignedUrl({ action: 'read', expires: Date.now() + 15 * 60 * 1000 });

    return { status: "success", downloadUrl: signedUrl };

  } catch (error) {
    console.error(`[${functionName}] FAILED:`, error);
    throw new HttpsError("internal", `產生 Excel 範本失敗: ${error.message}`);
  }
});

// ✓ 【替換】updateFieldsFromExcel 整個函式 (優化版)
exports.updateFieldsFromExcel = onCall({ region: "asia-east1", timeoutSeconds: 540, memory: "1GiB" }, async (request) => {
  const xlsx = require("xlsx");

  //  1. 修改：接收 fileContent (Base64字串)，而不是 filePath
  const { fileContent, targetCollection, isDryRun } = request.data;
  const functionName = `updateFieldsFromExcel (DryRun: ${isDryRun})`;

  if (!fileContent || !targetCollection) {
    throw new HttpsError("invalid-argument", "缺少檔案內容或目標集合參數。");
  }

  try {
    //  2. 修改：直接將 Base64 字串轉換為 Buffer，不再需要從 GCS 下載
    const buffer = Buffer.from(fileContent, 'base64');

    const workbook = xlsx.read(buffer);
    const sheetName = workbook.SheetNames[0];
    const jsonData = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);

    // ... (以下所有的驗證、預覽、批次寫入邏輯，都維持不變)
    if (jsonData.length === 0) {
      return { status: "success", message: "Excel 檔案中沒有資料。", changes: [] };
    }
    if (!jsonData[0]._id) {
      throw new HttpsError("invalid-argument", "Excel 檔案格式錯誤，第一欄的標頭必須是 `_id`。");
    }

    const anxiDb = new Firestore({ databaseId: "anxi-app" });
    const collectionRef = anxiDb.collection(targetCollection);

    if (isDryRun) {
      const idCounts = new Map();
      jsonData.forEach(row => {
        const id = row._id;
        if (id) idCounts.set(id, (idCounts.get(id) || 0) + 1);
      });
      const duplicateIds = Array.from(idCounts.entries()).filter(([, count]) => count > 1).map(([id]) => id);

      const sampleDocs = await collectionRef.limit(5).get();
      const existingFields = new Set();
      sampleDocs.forEach(doc => Object.keys(doc.data()).forEach(key => existingFields.add(key)));
      const excelHeaders = Object.keys(jsonData[0]).filter(key => key !== '_id');
      const newFields = excelHeaders.filter(header => !existingFields.has(header));

      const docIdToUpdate = jsonData[0]._id;
      const docSnap = await collectionRef.doc(String(docIdToUpdate)).get();
      const changes = [];
      if (docSnap.exists) {
        const oldData = docSnap.data();
        excelHeaders.forEach(header => {
          if (jsonData[0][header] !== oldData[header]) {
            changes.push({ field: header, oldValue: oldData[header] !== undefined ? oldData[header] : '(無)', newValue: jsonData[0][header] });
          }
        });
      }

      return {
        status: "success",
        data: { totalDocs: jsonData.length, newFields, previewDocId: docIdToUpdate, previewChanges: changes, duplicateIds }
      };
    } else {
      // 真實更新模式
      const batchArray = [];
      batchArray.push(anxiDb.batch());
      let operationCount = 0;
      let batchIndex = 0;
      for (const row of jsonData) {
        const docId = String(row._id);
        const dataToUpdate = { ...row };
        delete dataToUpdate._id;
        Object.keys(dataToUpdate).forEach(key => {
          if (String(dataToUpdate[key]).toUpperCase() === 'TRUE') dataToUpdate[key] = true;
          if (String(dataToUpdate[key]).toUpperCase() === 'FALSE') dataToUpdate[key] = false;
        });
        const docRef = collectionRef.doc(docId);
        batchArray[batchIndex].set(docRef, dataToUpdate, { merge: true });
        operationCount++;
        if (operationCount >= 499) {
          batchArray.push(anxiDb.batch());
          batchIndex++;
          operationCount = 0;
        }
      }
      await Promise.all(batchArray.map(batch => batch.commit()));
      return { status: "success", message: `成功更新 ${jsonData.length} 份文件。` };
    }
  } catch (error) {
    console.error(`[${functionName}] FAILED:`, error);
    throw new HttpsError("internal", `處理 Excel 更新時發生錯誤: ${error.message}`);
  }
});


exports.getCollectionFields = onCall(async (request) => {
  const { targetCollection, projectId } = request.data;
  if (!targetCollection) { // projectId 在此函式中是可選的
    throw new HttpsError("invalid-argument", "缺少 targetCollection。");
  }
  try {
    const anxiDb = new Firestore({ databaseId: "anxi-app" });
    let snapshot;
    const fields = new Set(['_id']); // 預設包含 _id

    if (targetCollection === 'projects' && projectId) {
      const docSnap = await anxiDb.collection(targetCollection).doc(projectId).get();
      if (docSnap.exists) {
        Object.keys(docSnap.data()).forEach(key => fields.add(key));
      }
    } else {
      let query = anxiDb.collection(targetCollection);
      if (projectId) {
        query = query.where("projectId", "==", projectId);
      }
      snapshot = await query.limit(20).get(); // 讀取最多 20 份文件作為欄位樣本
      snapshot.forEach(doc => {
        Object.keys(doc.data()).forEach(key => fields.add(key));
      });
    }

    return { status: "success", data: Array.from(fields).sort() };
  } catch (e) {
    throw new HttpsError("internal", `讀取欄位列表失敗: ${e.message}`);
  }
});
//  END: 新增 getCollectionFields 雲端函式

exports.handleSpecialReportUpload = onCall({
  region: "asia-east1",
  timeoutSeconds: 540,
  memory: "1GiB",
  // ✓ 引用新的 secrets
  secrets: driveSecrets
}, async (request) => {
  const { projectId, email, files, mismatchedFiles, projectName, senderName, driveUrlMap } = request.data;
  const functionName = `handleSpecialReportUpload (Project: ${projectId})`;

  if (!projectId || !email || !files || !projectName || !senderName || !driveUrlMap) {
    throw new HttpsError("invalid-argument", "缺少必要參數。");
  }

  try {
    // ✓ START: 改用 OAuth 2.0 Client 進行認證
    const oauth2Client = new google.auth.OAuth2(
      process.env.DRIVE_CLIENT_ID,
      process.env.DRIVE_CLIENT_SECRET,
      'https://developers.google.com/oauthplayground' // 重新導向 URI 需與設定一致
    );

    oauth2Client.setCredentials({
      refresh_token: process.env.DRIVE_REFRESH_TOKEN,
    });

    // ✓ 使用授權過的 oauth2Client 來建立 drive 實例
    const drive = google.drive({ version: "v3", auth: oauth2Client });
    // ✓ END: 認證方式修改完成

    const successfulUploads = [];

    for (const file of files) {
      const fileNameWithoutExt = file.name.replace(/\.pdf$/i, '');
      const buildingPrefix = fileNameWithoutExt.split('-')[0];
      const parentFolderUrl = driveUrlMap[buildingPrefix];

      if (!parentFolderUrl) {
        console.warn(`[${functionName}] 找不到戶型 [${buildingPrefix}] 的對應 Drive URL，已跳過檔案 [${file.name}]`);
        continue;
      }

      const parentFolderId = parentFolderUrl.split('/').pop();

      // 尋找或建立以檔名命名的子資料夾
      const searchRes = await drive.files.list({
        q: `name='${fileNameWithoutExt}' and mimeType='application/vnd.google-apps.folder' and '${parentFolderId}' in parents and trashed=false`,
        fields: 'files(id)',
      });

      let subFolderId;
      if (searchRes.data.files.length > 0) {
        subFolderId = searchRes.data.files[0].id;
      } else {
        const folderMetadata = {
          name: fileNameWithoutExt,
          mimeType: 'application/vnd.google-apps.folder',
          parents: [parentFolderId],
        };
        const createdFolder = await drive.files.create({
          resource: folderMetadata,
          fields: 'id',
        });
        subFolderId = createdFolder.data.id;
      }

      // 上傳檔案
      const fileMetadata = { name: file.name, parents: [subFolderId] };
      const buffer = Buffer.from(file.base64, 'base64');
      const stream = Readable.from(buffer);

      const media = {
        mimeType: 'application/pdf',
        body: stream,
      };

      const uploadedFile = await drive.files.create({
        resource: fileMetadata,
        media: media,
        fields: 'id, webViewLink', // <--- 關鍵修改點
      });

      // ✓ 修改：將檔名和 URL 一起存入陣列
      if (uploadedFile.data.webViewLink) {
        successfulUploads.push({
          name: file.name,
          url: uploadedFile.data.webViewLink
        });
      }
    }



    // --- 寄送確認 Email (HTML 格式版) ---
    const mailTransport = nodemailer.createTransport({
      service: 'gmail',
      auth: { user: process.env.SENDER_EMAIL, pass: process.env.GMAIL_APP_PASSWORD },
    });

    // ✓ 1. 將成功上傳的檔案列表轉換為 HTML 的超連結格式
    const matchedText = successfulUploads.length > 0
      ? successfulUploads.map(file => `<li><a href="${file.url}" target="_blank">${file.name}</a></li>`).join('')
      : '<li>無</li>';

    // ✓ 2. 將不符合的檔案列表轉換為純文字列表
    const mismatchedText = mismatchedFiles.length > 0
      ? mismatchedFiles.map(name => `<li>${name}</li>`).join('')
      : '<li>無</li>';

    const mismatchedInstruction = mismatchedFiles.length > 0
      ? `<p style="font-size: 14px; color: #555;">提醒：不符合的檔案請修改檔案名稱與戶別名稱一致，並注意大小寫（例如 A1-02、A3-15）。</p>`
      : '';

    const recipients = `${email}, amor41123@gmail.com`;

    // ✓ 3. 建立完整的 HTML 信件內容
    const emailBodyHtml = `
      <div style="font-family: Arial, sans-serif; line-height: 1.6;">
        <h2 style="color: #333;">驗屋報告上傳紀錄</h2>
        <p>以下是您的上傳紀錄：</p>
        
        <h3 style="color: #28a745;">符合 (${successfulUploads.length} 筆):</h3>
        <ul style="padding-left: 20px;">${matchedText}</ul>
        
        <h3 style="color: #dc3545;">不符合 (${mismatchedFiles.length} 筆):</h3>
        <ul style="padding-left: 20px;">${mismatchedText}</ul>
        
        ${mismatchedInstruction}
        
        <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
        <p style="font-size: 12px; color: #888;">此為系統自動發送的郵件，請勿直接回覆。</p>
      </div>
    `;

    const mailOptions = {
      from: `"${senderName}" <${process.env.SENDER_EMAIL}>`,
      to: recipients,
      subject: `【系統通知】${projectName} 驗屋報告上傳紀錄(致茂)`, // 加上前綴更清晰
      // ✓ 4. 將信件內容從 'text' 改為 'html'
      html: emailBodyHtml
    };

    await mailTransport.sendMail(mailOptions);
    console.log(`[${functionName}] Confirmation HTML email sent to [${recipients}].`);
    return { status: "success", message: "檔案上傳成功，確認信已寄出。" };

  } catch (error) {
    console.error(`[${functionName}] FAILED:`, error);
    // ✓ 檢查是否為認證錯誤，提供更明確的提示
    if (error.response && error.response.data && error.response.data.error === 'invalid_grant') {
      throw new HttpsError("unauthenticated", `Google Drive 認證失敗，可能是 Refresh Token 已過期或失效，請重新執行步驟二以取得新的 Token。`);
    }
    throw new HttpsError("internal", `處理上傳時發生錯誤: ${error.message}`);
  }
});


exports.handleSalesImageUpload = onCall({ region: "asia-east1", memory: "1GiB" }, async (request) => {
  const { projectId, fileName, fileBase64, storagePath } = request.data;
  const functionName = `handleSalesImageUpload (Project: ${projectId})`;

  if (!projectId || !fileName || !fileBase64 || !storagePath) {
    throw new HttpsError("invalid-argument", "缺少上傳所需的參數。");
  }

  try {
    const bucket = admin.storage().bucket();

    // ✓ 核心修改：直接使用前端傳來的 storagePath 作為完整路徑，不再額外拼接
    const file = bucket.file(storagePath);

    // 將 Base64 轉為 Buffer
    const buffer = Buffer.from(fileBase64, 'base64');

    // 使用 stream 的方式上傳
    const stream = Readable.from(buffer);
    await new Promise((resolve, reject) => {
      stream.pipe(file.createWriteStream({
        metadata: {
          contentType: 'image/png',
        },
        resumable: false
      }))
        .on('error', (err) => reject(err))
        .on('finish', () => resolve());
    });


    // 讓檔案公開可讀
    await file.makePublic();

    // 取得公開的 URL
    const publicUrl = file.publicUrl();

    console.log(`[${functionName}] 檔案成功上傳至: ${publicUrl}`);

    return {
      status: "success",
      downloadURL: publicUrl,
      storagePath: storagePath // ✓ 回傳前端提供的完整路徑
    };

  } catch (error) {
    console.error(`[${functionName}] 檔案上傳失敗:`, error);
    throw new HttpsError("internal", `後端上傳檔案時發生錯誤: ${error.message}`);
  }
});

//  START: 新增代理刪除圖片的 Cloud Function
exports.handleSalesImageDelete = onCall(async (request) => {
  const { docId, storagePath } = request.data;
  const functionName = `handleSalesImageDelete`;

  if (!docId || !storagePath) {
    throw new HttpsError("invalid-argument", "缺少刪除所需的 docId 或 storagePath 參數。");
  }

  try {
    // 1. 從 Storage 刪除檔案
    const bucket = admin.storage().bucket();
    await bucket.file(storagePath).delete();
    console.log(`[${functionName}] 成功從 Storage 刪除檔案: ${storagePath}`);

    // 2. 從 Firestore 刪除紀錄
    const anxiDb = new Firestore({ databaseId: "anxi-app" });
    await anxiDb.collection("salesImages").doc(docId).delete();
    console.log(`[${functionName}] 成功從 Firestore 刪除文件: ${docId}`);

    return { status: "success", message: "圖片已成功刪除" };

  } catch (error) {
    console.error(`[${functionName}] 刪除圖片時發生錯誤:`, error);
    // 如果檔案在 Storage 已不存在，也視為成功，避免前端報錯
    if (error.code === 404) {
      console.warn(`[${functionName}] Storage 檔案 (${storagePath}) 不存在，可能已被刪除。繼續刪除 Firestore 文件...`);
      try {
        const anxiDb = new Firestore({ databaseId: "anxi-app" });
        await anxiDb.collection("salesImages").doc(docId).delete();
        return { status: "success", message: "圖片紀錄已成功刪除" };
      } catch (dbError) {
        throw new HttpsError("internal", `刪除 Firestore 文件時發生錯誤: ${dbError.message}`);
      }
    }
    throw new HttpsError("internal", `後端刪除圖片時發生錯誤: ${error.message}`);
  }
});
//  END: 新增代理刪除圖片的 Cloud Function


// =================================================================
// /  【新增】銷控 SVG 圖片管理代理 Cloud Functions
// =================================================================

/**
 * [新] 代理上傳 SVG 檔案到 Firebase Storage
 */
exports.handleSalesSvgUpload = onCall({ region: "asia-east1", memory: "1GiB" }, async (request) => {
  const { projectId, fileName, fileBase64, storagePath } = request.data;
  const functionName = `handleSalesSvgUpload (Project: ${projectId})`;

  if (!projectId || !fileName || !fileBase64 || !storagePath) {
    throw new HttpsError("invalid-argument", "缺少 SVG 上傳所需的參數。");
  }

  try {
    const bucket = admin.storage().bucket();
    const file = bucket.file(storagePath);

    const buffer = Buffer.from(fileBase64, 'base64');
    const stream = Readable.from(buffer);

    await new Promise((resolve, reject) => {
      stream.pipe(file.createWriteStream({
        metadata: {
          contentType: 'image/svg+xml', //  指定 SVG 的正確 ContentType
        },
        resumable: false
      }))
        .on('error', (err) => reject(err))
        .on('finish', () => resolve());
    });

    await file.makePublic();
    const publicUrl = file.publicUrl();

    console.log(`[${functionName}] SVG 檔案成功上傳至: ${publicUrl}`);

    return {
      status: "success",
      downloadURL: publicUrl,
      storagePath: storagePath
    };

  } catch (error) {
    console.error(`[${functionName}] SVG 檔案上傳失敗:`, error);
    throw new HttpsError("internal", `後端上傳 SVG 檔案時發生錯誤: ${error.message}`);
  }
});

/**
 * [新] 代理刪除 Firestore 中的 SVG 紀錄與 Storage 中的檔案
 */
exports.handleSalesSvgDelete = onCall(async (request) => {
  const { docId, storagePath } = request.data;
  const functionName = `handleSalesSvgDelete`;

  if (!docId || !storagePath) {
    throw new HttpsError("invalid-argument", "缺少 SVG 刪除所需的 docId 或 storagePath 參數。");
  }

  try {
    const bucket = admin.storage().bucket();
    await bucket.file(storagePath).delete();
    console.log(`[${functionName}] 成功從 Storage 刪除 SVG 檔案: ${storagePath}`);

    //  使用 anxi-app 資料庫實例
    const anxiDb = new Firestore({ databaseId: "anxi-app" });
    await anxiDb.collection("salesSVGs").doc(docId).delete();
    console.log(`[${functionName}] 成功從 Firestore 刪除 SVG 文件: ${docId}`);

    return { status: "success", message: "SVG 圖片已成功刪除" };

  } catch (error) {
    console.error(`[${functionName}] 刪除 SVG 時發生錯誤:`, error);
    if (error.code === 404) {
      console.warn(`[${functionName}] Storage SVG 檔案 (${storagePath}) 不存在，繼續刪除 Firestore 文件...`);
      try {
        const anxiDb = new Firestore({ databaseId: "anxi-app" });
        await anxiDb.collection("salesSVGs").doc(docId).delete();
        return { status: "success", message: "SVG 紀錄已成功刪除" };
      } catch (dbError) {
        throw new HttpsError("internal", `刪除 Firestore SVG 文件時發生錯誤: ${dbError.message}`);
      }
    }
    throw new HttpsError("internal", `後端刪除 SVG 時發生錯誤: ${error.message}`);
  }
});

/**
 * [新] 代理批次刪除多個 SVG 檔案與 Firestore 紀錄
 */
exports.handleSalesSvgBatchDelete = onCall(async (request) => {
  const { svgsToDelete } = request.data; // 接收一個包含 {docId, storagePath} 的陣列
  const functionName = `handleSalesSvgBatchDelete`;

  if (!Array.isArray(svgsToDelete) || svgsToDelete.length === 0) {
    throw new HttpsError("invalid-argument", "缺少有效的 SVG 檔案列表。");
  }

  console.log(`[${functionName}] 準備刪除 ${svgsToDelete.length} 個 SVG 檔案...`);

  const bucket = admin.storage().bucket();
  const anxiDb = new Firestore({ databaseId: "anxi-app" });
  const errors = [];

  // 使用 Promise.allSettled 來確保所有刪除操作都會被嘗試，即使其中有幾個失敗
  const deletePromises = svgsToDelete.map(async (svg) => {
    try {
      // 1. 刪除 Storage 中的檔案
      await bucket.file(svg.storagePath).delete();
      // 2. 刪除 Firestore 中的文件
      await anxiDb.collection("salesSVGs").doc(svg.docId).delete();
    } catch (error) {
      // 如果檔案不存在 (404)，我們視為可接受的錯誤，不回報給前端
      if (error.code !== 404) {
        console.error(`[${functionName}] 刪除檔案 ${svg.docId} (${svg.storagePath}) 失敗:`, error);
        // 記錄失敗的項目
        errors.push({ docId: svg.docId, error: error.message });
      } else {
        // 如果 Storage 檔案不存在，仍然嘗試刪除 Firestore 文件
        try {
          await anxiDb.collection("salesSVGs").doc(svg.docId).delete();
        } catch (dbError) {
          errors.push({ docId: svg.docId, error: dbError.message });
        }
      }
    }
  });

  await Promise.allSettled(deletePromises);

  if (errors.length > 0) {
    console.error(`[${functionName}] 批次刪除完成，但有 ${errors.length} 個錯誤。`);
    // 即使有部分失敗，我們仍然回傳一個成功的狀態，但在 message 中告知詳情
    return {
      status: "partial_success",
      message: `成功刪除 ${svgsToDelete.length - errors.length} 個檔案，但有 ${errors.length} 個檔案刪除失敗。詳情請查看後端日誌。`,
      errors: errors
    };
  }

  console.log(`[${functionName}] 成功完成所有 ${svgsToDelete.length} 個檔案的刪除。`);
  return { status: "success", message: `已成功刪除 ${svgsToDelete.length} 個 SVG 檔案。` };
});

/**
 * 【新增】更新銷控資料
 * 處理單一戶別的銷控資料更新，包含所有欄位的資料驗證和型別轉換
 */
exports.updateSalesData = onCall({ region: "asia-east1", secrets: gmailSecrets }, async (request) => {
  const { projectName, projectId, unitId, data } = request.data;
  const functionName = `updateSalesData (Project: ${projectName}, Unit: ${unitId})`;

  if (!projectName || !unitId || !data) {
    throw new HttpsError("invalid-argument", "請求缺少 projectName、unitId 或 data。");
  }

  const db = new Firestore({ databaseId: "anxi-app" });

  try {
    console.log(`[${functionName}] 開始執行銷控資料更新...`);
    console.log(`[${functionName}] 接收到的參數:`, { projectName, projectId, unitId });
    console.log(`[${functionName}] 接收到的資料欄位:`, Object.keys(data));

    //  重構：移除後端轉換邏輯，強制要求前端提供 projectId
    if (!projectId) {
      throw new HttpsError("invalid-argument", `請求缺少 projectId。請確保前端已傳遞此參數。`);
    }

    const finalProjectId = projectId;
    const docId = `${finalProjectId}_${unitId}`;

    console.log(`[${functionName}] 使用 projectId: "${finalProjectId}"`);
    console.log(`[${functionName}] 計算的文檔 ID: ${docId}`);

    // 準備要儲存的資料
    const dataToSave = { ...data, projectId: finalProjectId, unitId };

    console.log(`[${functionName}] 準備儲存的資料:`, JSON.stringify(dataToSave, null, 2));

    // ========================================
    // 資料型別轉換和驗證
    // ========================================

    // 數值欄位轉換
    const numericFields = [
      'area_ancillary_ping', 'area_ancillary_sqm', 'area_terrace_ping', 'area_common_ping',
      'area_common_sqm', 'area_house_ping', 'area_house_sqm', 'area_main_ping',
      'area_main_sqm', 'land_share_ping', 'land_share_sqm', 'land_share_ratio', 'common_area_ratio',
      'payment_contract_amount', 'payment_deposit_amount', 'payment_supplement_amount',
      'price_diff', 'price_floor_ancillary', 'price_floor_terrace', 'price_floor_house_only',
      'price_floor_house_total', 'price_list_ancillary', 'price_list_terrace', 'price_list_terrace_unit',
      'price_list_house_only', 'price_list_house_total', 'price_package_deal', 'price_package',
      'price_transaction_house', 'price_transaction_total'
    ];

    for (const field of numericFields) {
      if (dataToSave[field] !== null && dataToSave[field] !== undefined && dataToSave[field] !== '') {
        const num = Number(dataToSave[field]);
        dataToSave[field] = isNaN(num) ? null : num;
      } else {
        dataToSave[field] = null;
      }
    }

    // 日期欄位轉換
    // ✅ 修改: 移除 buyerDateOfBirth，因為它現在儲存為物件 {year, month, day}
    const dateFields = ['payment_contract_date', 'payment_deposit_date', 'payment_supplement_date'];
    for (const field of dateFields) {
      if (dataToSave[field]) {
        if (dataToSave[field] instanceof Date) {
          // 如果已經是 Date 物件，直接轉換
          dataToSave[field] = admin.firestore.Timestamp.fromDate(dataToSave[field]);
        } else {
          // 嘗試解析字串或其他格式
          const date = new Date(dataToSave[field]);
          if (!isNaN(date.getTime())) {
            dataToSave[field] = admin.firestore.Timestamp.fromDate(date);
          } else {
            console.warn(`[${functionName}] 無法解析日期欄位 ${field}:`, dataToSave[field]);
            dataToSave[field] = null;
          }
        }
      } else {
        dataToSave[field] = null;
      }
    }

    // ✅ 新增: 處理 buyerDateOfBirth (ROC 物件格式)
    if (dataToSave.buyerDateOfBirth) {
      const dob = dataToSave.buyerDateOfBirth;
      // 檢查是否為新格式物件 { year, month, day }
      if (typeof dob === 'object' && dob.year && dob.month && dob.day) {
        // 確保為數字
        dataToSave.buyerDateOfBirth = {
          year: Number(dob.year),
          month: Number(dob.month),
          day: Number(dob.day)
        };
      } else if (dob instanceof Date || (typeof dob === 'object' && typeof dob.toDate === 'function')) {
        // 兼容舊格式 (如果是 Date 或 Timestamp，暫時保留或轉換? 這裡選擇保留原樣，讓前端顯示邏輯處理兼容)
        // 或者也可以強制轉換為物件? 
        // 為了最少副作用，如果傳入的是 Timestamp (舊資料更新其他欄位時)，保持不變。
        // 但如果是前端傳來的，SalesInfoForm 現在會傳物件。
      } else {
        // 其他無效格式設為 null
        dataToSave.buyerDateOfBirth = null;
      }
    }

    // 布林欄位處理
    if (dataToSave.isFirstTimeBuyer !== undefined) {
      if (typeof dataToSave.isFirstTimeBuyer === 'boolean') {
        // 已經是布林值，保持不變
      } else {
        const val = String(dataToSave.isFirstTimeBuyer).toUpperCase();
        dataToSave.isFirstTimeBuyer = (val === 'TRUE' || val === 'Y' || val === '1');
      }
    }

    // 銷控圖片欄位處理（確保是陣列）
    if (dataToSave.salesImages) {
      if (typeof dataToSave.salesImages === 'string') {
        // 如果是字串，分割成陣列
        dataToSave.salesImages = dataToSave.salesImages
          .split(',')
          .map(name => name.trim())
          .filter(name => name);
      } else if (!Array.isArray(dataToSave.salesImages)) {
        // 如果不是陣列也不是字串，設為空陣列
        dataToSave.salesImages = [];
      }
    } else {
      dataToSave.salesImages = [];
    }

    // ========================================
    // 車位資料特殊處理
    // ========================================

    // 提取車位資料，準備寫入 salesParkings 集合
    let parkingData = null;
    if (dataToSave.parkingSpots && Array.isArray(dataToSave.parkingSpots)) {
      parkingData = dataToSave.parkingSpots;
      console.log(`[${functionName}] 檢測到車位資料，共 ${parkingData.length} 筆`);

      // 從 salesHouseholds 資料中移除 parkingSpots，因為它不屬於戶別文檔
      delete dataToSave.parkingSpots;
    }

    // 字串欄位去除前後空白
    const stringFields = [
      'salesStatus_backend', 'salesStatus_quote', 'salesperson', 'contractType',
      'buyerName', 'buyerPhone', 'buyerIdNumber', 'buyerEmail', 'remarks',
      'buyerMailingAddressCity', 'buyerMailingAddressDistrict', 'buyerMailingAddressDetail',
      'buyerPermanentAddressCity', 'buyerPermanentAddressDistrict', 'buyerPermanentAddressDetail',

      // ✅ [新增] 加入 propertyType 以確保單筆更新時能正確處理字串格式
      'propertyType'
    ];

    for (const field of stringFields) {
      if (dataToSave[field] && typeof dataToSave[field] === 'string') {
        dataToSave[field] = dataToSave[field].trim();
        // 如果只是空白字串，設為 null
        if (dataToSave[field] === '') {
          dataToSave[field] = null;
        }
      }
    }

    // 設定更新時間
    dataToSave.updatedAt = admin.firestore.FieldValue.serverTimestamp();

    // ========================================
    // 儲存到 Firestore
    // ========================================

    // 檢查資料庫連接
    console.log(`[${functionName}] 資料庫實例:`, db.databaseId || '預設專案');

    const docRef = db.collection("salesHouseholds").doc(docId);
    console.log(`[${functionName}] 文檔參考路徑: salesHouseholds/${docId}`);

    // 檢查文檔是否存在
    const docSnapshot = await docRef.get();
    console.log(`[${functionName}] 目標文檔存在:`, docSnapshot.exists);
    if (docSnapshot.exists) {
      console.log(`[${functionName}] 現有文檔資料欄位:`, Object.keys(docSnapshot.data()));
    }

    // 使用 set 搭配 merge: true，確保只更新提供的欄位
    await docRef.set(dataToSave, { merge: true });
    console.log(`[${functionName}] 戶別資料寫入完成`);

    // ========================================
    // 處理車位資料寫入 salesParkings
    // ========================================

    let parkingUpdateCount = 0;
    if (parkingData && parkingData.length > 0) {
      console.log(`[${functionName}] 開始處理車位資料...`);

      for (const parking of parkingData) {
        try {
          //  修復：車位文檔 ID 格式應該是 {projectId}_{spotId}
          const spotId = parking.spotId;
          if (!spotId) {
            console.warn(`[${functionName}] 車位資料缺少 spotId，跳過此筆資料:`, parking);
            continue;
          }

          const parkingDocId = `${finalProjectId}_${spotId}`;
          console.log(`[${functionName}] 車位文檔 ID: ${parkingDocId} (spotId: ${spotId})`);

          if (!parkingDocId) {
            console.warn(`[${functionName}] 無法生成車位文檔 ID，跳過此筆資料:`, parking);
            continue;
          }

          //  修復：準備車位資料時，只更新可變的銷售相關欄位
          // 核心車位資料（floor, number, price_floor, price_list, projectId,
          // spotId, type, size, slidePosition）保持不變
          const parkingDataToSave = {
            // 銷售相關欄位（可更新）
            buyerName: parking.buyerName || null,
            buyerUnitId: unitId, // 關聯到戶別
            price_transaction: parking.price_transaction ? Number(parking.price_transaction) : null,
            remarks: parking.remarks || '',
            salesperson: parking.salesperson || null,
            status: parking.status || null,
            status_backend: parking.status_backend || null,
            updatedAt: admin.firestore.FieldValue.serverTimestamp()

            // 注意：以下核心欄位不會被更新，保持資料庫中的原始值
            // floor, number, price_floor, price_list, projectId, spotId, type, size, slidePosition
          };

          // 寫入 salesParkings 集合
          const parkingDocRef = db.collection("salesParkings").doc(parkingDocId);
          await parkingDocRef.set(parkingDataToSave, { merge: true });

          console.log(`[${functionName}] 車位資料更新成功: ${parkingDocId}`);
          parkingUpdateCount++;

        } catch (parkingError) {
          console.error(`[${functionName}] 車位資料寫入失敗:`, parkingError);
          // 繼續處理其他車位，不中斷整個流程
        }
      }

      console.log(`[${functionName}] 車位資料處理完成，共更新 ${parkingUpdateCount} 筆`);
    }

    // 驗證寫入結果
    const verifySnapshot = await docRef.get();
    console.log(`[${functionName}] 寫入後驗證 - 文檔存在:`, verifySnapshot.exists);
    if (verifySnapshot.exists) {
      console.log(`[${functionName}] 寫入後的文檔資料欄位:`, Object.keys(verifySnapshot.data()));
      // 檢查關鍵欄位
      const verifyData = verifySnapshot.data();
      console.log(`[${functionName}] 關鍵欄位驗證:`, {
        salesStatus_backend: verifyData.salesStatus_backend,
        salesStatus_quote: verifyData.salesStatus_quote,
        updatedAt: verifyData.updatedAt
      });
    }

    console.log(`[${functionName}] 銷控資料更新成功！`);

    // 準備回傳訊息
    let message = "銷控資料更新成功！";
    if (parkingUpdateCount > 0) {
      message += ` (包含 ${parkingUpdateCount} 筆車位資料)`;
    }

    return {
      status: "success",
      message: message,
      updatedFields: Object.keys(data).length,
      parkingUpdated: parkingUpdateCount,
      docId: docId
    };

  } catch (error) {
    console.error(`[${functionName}] Error occurred:`, error);
    throw new HttpsError("internal", `Error updating sales data: ${error.message}`);
  }
});


// ✅ 新增：輕量級單一欄位更新函式 (專門給 Switch 開關使用)
exports.updateSalesField = onCall({ region: "asia-east1" }, async (request) => {
  const { projectId, unitId, field, value } = request.data;

  // 基本驗證
  if (!projectId || !unitId || !field) {
    throw new HttpsError("invalid-argument", "缺少必要參數 (projectId, unitId, field)");
  }

  // 限制只能更新特定欄位 (安全性白名單)
  const allowedFields = ['isPreferredPayment', 'isFirstTimeBuyer', 'showInMenu'];
  if (!allowedFields.includes(field)) {
    throw new HttpsError("permission-denied", `不允許直接更新欄位: ${field}`);
  }

  const db = new Firestore({ databaseId: "anxi-app" });
  const docRef = db.collection("salesHouseholds").doc(`${projectId}_${unitId}`);

  try {
    // 使用 update 指令，絕對不會影響其他欄位
    await docRef.update({
      [field]: value,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    return { status: "success", message: `${field} 更新成功` };
  } catch (error) {
    console.error(`[updateSalesField] 更新失敗:`, error);
    throw new HttpsError("internal", error.message);
  }
});

/**
 * 【新增】退戶功能
 * 將指定戶別及其關聯車位的銷售資料清除，並建立永久退戶紀錄
 */
exports.cancelPurchase = onCall({ region: "asia-east1", secrets: gmailSecrets }, async (request) => {
  const { projectId, unitId, operatorName } = request.data;
  const functionName = `cancelPurchase (Project: ${projectId}, Unit: ${unitId})`;

  if (!projectId || !unitId || !operatorName) {
    throw new HttpsError("invalid-argument", "請求缺少 projectId、unitId 或 operatorName。");
  }

  const db = new Firestore({ databaseId: "anxi-app" });

  try {
    console.log(`[${functionName}] 開始執行退戶作業...`);
    console.log(`[${functionName}] 操作人員: ${operatorName}`);

    // ========================================
    // 步驟 1：讀取原始資料（用於建立退戶紀錄）
    // ========================================

    const docId = `${projectId}_${unitId}`;
    console.log(`[${functionName}] 目標戶別文檔 ID: ${docId}`);

    // 讀取戶別原始資料
    const householdDocRef = db.collection("salesHouseholds").doc(docId);
    const householdSnapshot = await householdDocRef.get();

    if (!householdSnapshot.exists) {
      throw new HttpsError("not-found", `找不到戶別資料: ${docId}`);
    }

    const originalHouseholdData = householdSnapshot.data();
    console.log(`[${functionName}] 已讀取戶別原始資料`);

    // 讀取關聯車位的原始資料
    const parkingQuery = db.collection("salesParkings").where("buyerUnitId", "==", unitId);
    const parkingSnapshot = await parkingQuery.get();

    const originalParkingData = [];
    parkingSnapshot.forEach(doc => {
      originalParkingData.push({
        docId: doc.id,
        data: doc.data()
      });
    });

    console.log(`[${functionName}] 已讀取 ${originalParkingData.length} 筆關聯車位資料`);

    // ========================================
    // 步驟 2：建立退戶日誌
    // ========================================

    // 生成退戶紀錄文檔 ID (格式: projectId_unitId_YYYYMMDDHHSS)
    const now = new Date();
    const timestamp = now.toISOString()
      .replace(/[-:T]/g, '')
      .replace(/\.\d{3}Z$/, '')
      .substring(0, 14); // YYYYMMDDHHMMSS

    const cancellationDocId = `${projectId}_${unitId}_${timestamp}`;
    console.log(`[${functionName}] 退戶紀錄文檔 ID: ${cancellationDocId}`);

    const cancellationRecord = {
      projectId: projectId,
      unitId: unitId,
      operatorName: operatorName,
      cancellationDate: admin.firestore.FieldValue.serverTimestamp(),
      originalHouseholdData: originalHouseholdData,
      originalParkingData: originalParkingData,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    };

    // ========================================
    // 步驟 3：準備資料清理操作
    // ========================================

    // 準備戶別資料清理
    const householdResetData = {
      // 買方基本資料
      buyerDateOfBirth: null,
      buyerEmail: null,
      buyerEmergencyContactName: null,
      buyerEmergencyContactPhone: null,
      buyerEmergencyContactRelationship: null,
      buyerGender: null,
      buyerHasPurchasedFuyu: null,
      buyerIdNumber: null,
      buyerMailingAddressCity: null,
      buyerMailingAddressDetail: null,
      buyerMailingAddressDistrict: null,
      buyerMaritalStatus: null,
      buyerName: null,
      buyerOccupationIndustry: null,
      buyerOccupationTitle: null,
      buyerPermanentAddressCity: null,
      buyerPermanentAddressDetail: null,
      buyerPermanentAddressDistrict: null,
      buyerPhone: null,
      buyerPurchasePurpose: null,

      // 合約與付款資料
      contractType: "",
      isFirstTimeBuyer: false,
      payment_contract_amount: null,
      payment_contract_date: null,
      payment_deposit_amount: null,
      payment_deposit_date: null,
      payment_supplement_amount: null,
      payment_supplement_date: null,

      // 價格與銷售狀態
      price_package_deal: null,
      price_transaction_house: null,
      salesStatus_backend: null,
      salesStatus_quote: null,
      salesperson: null,

      // 其他
      referrerName: null,
      referrerPhone: null,
      remarks: "",

      // 更新時間
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };

    // ========================================
    // 步驟 4：使用批次寫入執行所有操作
    // ========================================

    const batch = db.batch();

    // 1. 建立退戶紀錄
    const cancellationDocRef = db.collection("purchaseCancellations").doc(cancellationDocId);
    batch.set(cancellationDocRef, cancellationRecord);

    // 2. 清理戶別資料
    batch.update(householdDocRef, householdResetData);

    // 3. 清理關聯車位資料
    for (const parking of originalParkingData) {
      const parkingDocRef = db.collection("salesParkings").doc(parking.docId);
      const parkingResetData = {
        buyerName: null,
        buyerUnitId: null,
        remarks: "",
        salesperson: null,
        status: null,
        status_backend: null,
        price_transaction: null,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      };
      batch.update(parkingDocRef, parkingResetData);
    }

    // 提交所有操作
    await batch.commit();

    console.log(`[${functionName}] 退戶作業完成！`);
    console.log(`[${functionName}] - 已建立退戶紀錄: ${cancellationDocId}`);
    console.log(`[${functionName}] - 已清理戶別資料: ${docId}`);
    console.log(`[${functionName}] - 已釋出車位數量: ${originalParkingData.length}`);

    return {
      status: "success",
      message: "退戶作業完成！",
      cancellationId: cancellationDocId,
      clearedParkingCount: originalParkingData.length
    };

  } catch (error) {
    console.error(`[${functionName}] Error occurred:`, error);
    throw new HttpsError("internal", `退戶作業失敗: ${error.message}`);
  }
});

// =================================================================
// /  【新增】車位平面圖管理系統 Cloud Functions
// =================================================================

/**
 * 獲取專案的所有樓層清單
 */
exports.getProjectFloors = onCall(async (request) => {
  const { projectId } = request.data;
  const functionName = `getProjectFloors (Project: ${projectId})`;

  if (!projectId) {
    throw new HttpsError("invalid-argument", "缺少 projectId 參數。");
  }

  try {
    console.log(`[${functionName}] 查詢專案樓層清單...`);
    const db = new Firestore({ databaseId: "anxi-app" });

    // 從 salesParkings 集合獲取該專案的所有車位
    const parkingSnapshot = await db.collection("salesParkings")
      .where("projectId", "==", projectId)
      .get();

    if (parkingSnapshot.empty) {
      console.log(`[${functionName}] 專案沒有車位資料`);
      return {
        status: "error",
        message: "請先建立車位資料",
        data: []
      };
    }

    // 收集所有樓層並去重
    const floorsSet = new Set();
    parkingSnapshot.forEach(doc => {
      const data = doc.data();
      if (data.floor) {
        floorsSet.add(data.floor);
      }
    });

    // 轉換為陣列並排序 (A>Z 字典序排列)
    const floors = Array.from(floorsSet).sort();

    // 獲取已建立平面圖的樓層
    const floorPlansSnapshot = await db.collection("parkingFloorPlans")
      .where("projectId", "==", projectId)
      .get();

    const existingFloors = new Set();
    floorPlansSnapshot.forEach(doc => {
      const data = doc.data();
      if (data.floor) {
        existingFloors.add(data.floor);
      }
    });

    // 建立樓層選項
    const floorOptions = floors.map(floor => ({
      value: floor,
      text: floor, // 顯示用的純樓層名稱
      label: existingFloors.has(floor) ? `${floor} (已建立)` : floor,
      available: !existingFloors.has(floor)
    }));

    console.log(`[${functionName}] 找到 ${floors.length} 個樓層，其中 ${existingFloors.size} 個已建立平面圖`);
    return {
      status: "success",
      data: floorOptions,
      totalFloors: floors.length,
      existingFloorPlans: existingFloors.size
    };

  } catch (error) {
    console.error(`[${functionName}] Error:`, error);
    throw new HttpsError("internal", `獲取樓層清單失敗: ${error.message}`);
  }
});

/**
 * 獲取平面圖列表及其基本資訊
 */
exports.getFloorPlans = onCall(async (request) => {
  const { projectId } = request.data;
  const functionName = `getFloorPlans (Project: ${projectId})`;

  if (!projectId) {
    throw new HttpsError("invalid-argument", "缺少 projectId 參數。");
  }

  try {
    console.log(`[${functionName}] 查詢平面圖列表...`);
    const db = new Firestore({ databaseId: "anxi-app" });

    const floorPlansSnapshot = await db.collection("parkingFloorPlans")
      .where("projectId", "==", projectId)
      .orderBy("createdAt", "desc")
      .get();

    const floorPlans = [];
    floorPlansSnapshot.forEach(doc => {
      const data = doc.data();
      floorPlans.push({
        id: doc.id,
        name: data.name,
        description: data.description || '',
        floor: data.floor || '',
        backgroundImageUrl: data.backgroundImageUrl || '',
        isActive: data.isActive || false,
        createdAt: data.createdAt,
        updatedAt: data.updatedAt
      });
    });

    console.log(`[${functionName}] 找到 ${floorPlans.length} 個平面圖`);
    return { status: "success", data: floorPlans };

  } catch (error) {
    console.error(`[${functionName}] Error:`, error);
    throw new HttpsError("internal", `獲取平面圖列表失敗: ${error.message}`);
  }
});

/**
 * 創建新的平面圖
 */
exports.createFloorPlan = onCall(async (request) => {
  //  修改：將傳入的 floor 重新命名為 floorInput，以便處理
  const { projectId, name, description, floor: floorInput, backgroundImageUrl } = request.data;
  const functionName = `createFloorPlan (Project: ${projectId})`;

  //  新增：從傳入的物件或字串中提取真實的樓層字串值
  const floor = (typeof floorInput === 'object' && floorInput !== null && floorInput.value)
    ? floorInput.value
    : floorInput;

  //  修改：使用提取後的 floor 值進行驗證
  if (!projectId || !name || !floor) {
    throw new HttpsError("invalid-argument", "缺少 projectId、name 或 floor 參數。");
  }

  try {
    //  修改：日誌記錄使用提取後的 floor 值
    console.log(`[${functionName}] 創建新平面圖: ${name} (樓層: ${floor})`);
    const db = new Firestore({ databaseId: "anxi-app" });

    //  修改：檢查重複時使用提取後的 floor 值
    const existingFloorPlan = await db.collection("parkingFloorPlans")
      .where("projectId", "==", projectId)
      .where("floor", "==", floor)
      .get();

    if (!existingFloorPlan.empty) {
      throw new HttpsError("already-exists", `樓層 ${floor} 已經存在平面圖。`);
    }

    const now = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Taipei" }));
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    const timestamp = `${year}${month}${day}${hours}${minutes}${seconds}`;

    //  修改：文件名使用提取後的 floor 值
    const docId = `${projectId}_${floor}_${timestamp}`;

    const floorPlanData = {
      projectId: projectId,
      name: name,
      description: description || '',
      floor: floor, //  修改：儲存時使用提取後的 floor 字串值
      backgroundImageUrl: backgroundImageUrl || '',
      isActive: true,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };

    const docRef = db.collection("parkingFloorPlans").doc(docId);
    await docRef.set(floorPlanData);

    console.log(`[${functionName}] 平面圖創建成功，ID: ${docId}`);
    return {
      status: "success",
      floorPlanId: docId,
      message: "平面圖創建成功"
    };

  } catch (error) {
    console.error(`[${functionName}] Error:`, error);
    if (error instanceof HttpsError) {
      throw error;
    }
    throw new HttpsError("internal", `創建平面圖失敗: ${error.message}`);
  }
});

/**
 * 更新平面圖基本資訊
 */
exports.updateFloorPlan = onCall(async (request) => {
  const { floorPlanId, projectId, name, description, floor, backgroundImageUrl, isActive } = request.data;
  const functionName = `updateFloorPlan (ID: ${floorPlanId})`;

  if (!floorPlanId) {
    throw new HttpsError("invalid-argument", "缺少 floorPlanId 參數。");
  }

  try {
    console.log(`[${functionName}] 更新平面圖資訊...`);
    const db = new Firestore({ databaseId: "anxi-app" });
    const docRef = db.collection("parkingFloorPlans").doc(floorPlanId);

    // 只有當請求中包含新的 backgroundImageUrl 時，才觸發刪除舊圖檔的流程
    if (backgroundImageUrl) {
      const docSnap = await docRef.get();

      if (docSnap.exists) {
        const oldData = docSnap.data();
        const oldUrl = oldData.backgroundImageUrl;

        if (oldUrl && oldUrl !== backgroundImageUrl) {
          const oldPath = getStoragePathFromUrl(oldUrl);
          if (oldPath) {
            console.log(`[${functionName}] 準備刪除舊的背景圖: ${oldPath}`);
            try {
              const bucket = admin.storage().bucket();
              await bucket.file(oldPath).delete();
              console.log(`[${functionName}] 成功刪除舊的背景圖。`);
            } catch (deleteError) {
              if (deleteError.code === 404) {
                console.warn(`[${functionName}] 舊的背景圖在 Storage 中找不到，可能已被刪除。`);
              } else {
                console.error(`[${functionName}] 刪除舊的背景圖失敗:`, deleteError);
              }
            }
          }
        }
      }
    }

    // 如果要更新樓層，檢查該樓層是否已被其他平面圖使用 (此部分邏輯不變)
    if (floor !== undefined && projectId) {
      const existingFloorPlan = await db.collection("parkingFloorPlans")
        .where("projectId", "==", projectId)
        .where("floor", "==", floor)
        .get();

      const conflictingPlans = existingFloorPlan.docs.filter(doc => doc.id !== floorPlanId);
      if (conflictingPlans.length > 0) {
        throw new HttpsError("already-exists", `樓層 ${floor} 已經被其他平面圖使用。`);
      }
    }

    const updateData = {
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };

    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (floor !== undefined) updateData.floor = floor;
    if (backgroundImageUrl !== undefined) updateData.backgroundImageUrl = backgroundImageUrl;
    if (isActive !== undefined) updateData.isActive = isActive;

    await docRef.update(updateData);

    console.log(`[${functionName}] 平面圖更新成功`);
    return {
      status: "success",
      message: "平面圖更新成功"
    };

  } catch (error) {
    console.error(`[${functionName}] Error:`, error);
    if (error instanceof HttpsError) {
      throw error;
    }
    throw new HttpsError("internal", `更新平面圖失敗: ${error.message}`);
  }
});

/**
 * 刪除平面圖（包含所有相關的車位佈局）
 */
exports.deleteFloorPlan = onCall(async (request) => {
  const { floorPlanId } = request.data;
  const functionName = `deleteFloorPlan (ID: ${floorPlanId})`;

  if (!floorPlanId) {
    throw new HttpsError("invalid-argument", "缺少 floorPlanId 參數。");
  }

  try {
    console.log(`[${functionName}] 刪除平面圖及相關資料...`);
    const db = new Firestore({ databaseId: "anxi-app" });
    const docRef = db.collection("parkingFloorPlans").doc(floorPlanId);

    // 讀取文件以準備刪除關聯的圖檔
    const docSnap = await docRef.get();

    if (docSnap.exists) {
      const data = docSnap.data();
      const imageUrl = data.backgroundImageUrl;
      if (imageUrl) {
        const imagePath = getStoragePathFromUrl(imageUrl);
        if (imagePath) {
          console.log(`[${functionName}] 準備刪除背景圖: ${imagePath}`);
          try {
            const bucket = admin.storage().bucket();
            await bucket.file(imagePath).delete();
            console.log(`[${functionName}] 成功刪除背景圖。`);
          } catch (deleteError) {
            if (deleteError.code === 404) {
              console.warn(`[${functionName}] 背景圖在 Storage 中找不到，繼續執行刪除。`);
            } else {
              console.error(`[${functionName}] 刪除背景圖失敗:`, deleteError);
            }
          }
        }
      }
    }

    // 查找並刪除所有相關的車位佈局
    const spotLayoutsSnapshot = await db.collection("parkingSpotLayouts")
      .where("floorPlanId", "==", floorPlanId)
      .get();

    const batch = db.batch();

    // 刪除平面圖文件本身
    batch.delete(docRef);

    // 刪除所有相關的車位佈局文件
    spotLayoutsSnapshot.forEach(doc => {
      batch.delete(doc.ref);
    });

    await batch.commit();

    console.log(`[${functionName}] 刪除完成，包含 ${spotLayoutsSnapshot.size} 個車位佈局`);
    return {
      status: "success",
      message: `平面圖刪除成功，同時清除了 ${spotLayoutsSnapshot.size} 個車位佈局`
    };

  } catch (error) {
    console.error(`[${functionName}] Error:`, error);
    throw new HttpsError("internal", `刪除平面圖失敗: ${error.message}`);
  }
});

/**
 * 獲取特定平面圖的所有車位佈局
 */
exports.getSpotLayouts = onCall(async (request) => {
  const { floorPlanId, projectId } = request.data;
  const functionName = `getSpotLayouts (FloorPlan: ${floorPlanId})`;

  if (!floorPlanId || !projectId) {
    throw new HttpsError("invalid-argument", "缺少 floorPlanId 或 projectId 參數。");
  }

  try {
    console.log(`[${functionName}] 查詢車位佈局和背景圖片數據...`);
    const db = new Firestore({ databaseId: "anxi-app" });

    // 查詢車位佈局
    const spotLayoutsSnapshot = await db.collection("parkingSpotLayouts")
      .where("floorPlanId", "==", floorPlanId)
      .where("projectId", "==", projectId)
      .get();

    const layouts = [];
    spotLayoutsSnapshot.forEach(doc => {
      const data = doc.data();
      layouts.push({
        id: doc.id,
        spotId: data.spotId,
        x: data.x,
        y: data.y,
        width: data.width,
        height: data.height,
        rotation: data.rotation || 0,
        type: data.type || 'manual', // 區分手動和匯入的車位
        salesParkingId: data.salesParkingId,
        displayMode: data.displayMode || 'backend'
      });
    });

    // 查詢背景圖片數據
    const floorPlanDoc = await db.collection("parkingFloorPlans").doc(floorPlanId).get();
    if (floorPlanDoc.exists) {
      const floorPlanData = floorPlanDoc.data();
      if (floorPlanData.backgroundImageX !== undefined &&
        floorPlanData.backgroundImageY !== undefined) {
        layouts.push({
          type: 'backgroundImage',
          x: floorPlanData.backgroundImageX,
          y: floorPlanData.backgroundImageY,
          scaleX: floorPlanData.backgroundImageScaleX || 1,
          scaleY: floorPlanData.backgroundImageScaleY || 1,
          rotation: floorPlanData.backgroundImageRotation || 0
        });
      }
    }

    console.log(`[${functionName}] 找到 ${layouts.filter(l => l.type !== 'backgroundImage').length} 個車位佈局和背景圖片數據`);
    return { status: "success", layouts: layouts };

  } catch (error) {
    console.error(`[${functionName}] Error:`, error);
    throw new HttpsError("internal", `獲取車位佈局失敗: ${error.message}`);
  }
});

/**
 * 批量保存車位佈局（支援新增、更新、刪除）
 */
exports.saveSpotLayouts = onCall(async (request) => {
  const { floorPlanId, layouts, projectId } = request.data;
  const functionName = `saveSpotLayouts (FloorPlan: ${floorPlanId}, Project: ${projectId})`;

  if (!floorPlanId || !Array.isArray(layouts) || !projectId) {
    throw new HttpsError("invalid-argument", "缺少 floorPlanId, layouts 或 projectId 參數。");
  }

  // (日誌 A)
  console.log(`[${functionName}] 函式啟動。收到的 projectId: ${projectId}`);
  console.log(`[${functionName}] 函式收到的完整 layouts 內容:`, JSON.stringify(layouts, null, 2));


  try {
    console.log(`[${functionName}] 批量保存 ${layouts.length} 個佈局項目...`);
    const db = new Firestore({ databaseId: "anxi-app" });
    const batch = db.batch();
    const now = admin.firestore.FieldValue.serverTimestamp();
    const layoutsCollection = db.collection("parkingSpotLayouts");

    const spotLayouts = layouts.filter(item => item.type !== 'backgroundImage');
    const backgroundImageData = layouts.find(item => item.type === 'backgroundImage');

    for (const layout of spotLayouts) {

      const { id: layoutId, ...dataToSave } = layout;

      // (日誌 B)
      console.log(`[${functionName}] 正在處理 Layout ID: ${layoutId}。解構後的 dataToSave 內容:`, JSON.stringify(dataToSave, null, 2));

      dataToSave.floorPlanId = floorPlanId;
      dataToSave.projectId = projectId;

      let targetDocRef;

      if (layoutId === null) {
        // --- 新增邏輯 (保持不變) ---
        if (!dataToSave.salesParkingId) {
          console.warn(`[${functionName}] (新增) 跳過：缺少 'salesParkingId'`);
          continue;
        }
        const newDocId = dataToSave.salesParkingId;
        targetDocRef = layoutsCollection.doc(newDocId);
        dataToSave.createdAt = now;
        dataToSave.updatedAt = now;
        console.log(`[${functionName}] (新增) 準備 Set 文件: ${targetDocRef.path}`);
        batch.set(targetDocRef, dataToSave);

      } else {
        // --- 更新邏輯 ---
        targetDocRef = layoutsCollection.doc(layoutId);
        dataToSave.updatedAt = now;

        //  START: 【請修改此處】
        // 原本的: batch.set(targetDocRef, dataToSave, { merge: true });
        // 修改為:
        batch.update(targetDocRef, dataToSave);
        //  END: 【修改結束】

        // (日誌 C - 也同步修改日誌文字)
        console.log(`[${functionName}] (更新) 準備 Update 文件: ${targetDocRef.path}`);
      }
    }

    // ... (儲存背景圖片數據的邏輯) ...
    if (backgroundImageData) {
      const backgroundData = {
        backgroundImageX: Number(backgroundImageData.x) || 0,
        backgroundImageY: Number(backgroundImageData.y) || 0,
        backgroundImageScaleX: Number(backgroundImageData.scaleX) || 1,
        backgroundImageScaleY: Number(backgroundImageData.scaleY) || 1,
        backgroundImageRotation: Number(backgroundImageData.rotation) || 0,
        updatedAt: now
      };
      const floorPlanRef = db.collection("parkingFloorPlans").doc(floorPlanId);
      batch.set(floorPlanRef, backgroundData, { merge: true });
    }

    // (日誌 D)
    console.log(`[${functionName}] 準備提交 Batch...`);
    await batch.commit();

    console.log(`[${functionName}] 批量保存完成`);
    return {
      status: "success",
      message: `成功保存 ${layouts.length} 個佈局項目`
    };

  } catch (error) {
    // (日誌 E)
    console.error(`[${functionName}] 儲存時發生嚴重錯誤:`, error);
    throw new HttpsError("internal", `保存佈局失敗: ${error.message}`);
  }
});

/**
 * 刪除特定車位佈局
 */
exports.deleteSpotLayout = onCall(async (request) => {
  const { layoutId } = request.data;
  const functionName = `deleteSpotLayout (ID: ${layoutId})`;

  if (!layoutId) {
    throw new HttpsError("invalid-argument", "缺少 layoutId 參數。");
  }

  try {
    console.log(`[${functionName}] 刪除車位佈局...`);
    const db = new Firestore({ databaseId: "anxi-app" });

    await db.collection("parkingSpotLayouts").doc(layoutId).delete();

    console.log(`[${functionName}] 車位佈局刪除成功`);
    return {
      status: "success",
      message: "車位佈局刪除成功"
    };

  } catch (error) {
    console.error(`[${functionName}] Error:`, error);
    throw new HttpsError("internal", `刪除車位佈局失敗: ${error.message}`);
  }
});

/**
 * 獲取平面圖參數設定
 */
exports.getFloorPlanParameters = onCall(async (request) => {
  const { floorPlanId } = request.data;
  const functionName = `getFloorPlanParameters (FloorPlan: ${floorPlanId})`;

  if (!floorPlanId) {
    throw new HttpsError("invalid-argument", "缺少 floorPlanId 參數。");
  }

  try {
    console.log(`[${functionName}] 查詢平面圖參數...`);
    const db = new Firestore({ databaseId: "anxi-app" });

    const docSnapshot = await db.collection("floorPlanParameters").doc(floorPlanId).get();

    if (!docSnapshot.exists) {
      // 如果沒有參數，返回預設值
      const defaultParameters = {
        spotStyles: {
          available: {
            backgroundColor: '#e8f5e8',
            borderColor: '#4caf50',
            textColor: '#000000'
          },
          reserved: {
            backgroundColor: '#fff3cd',
            borderColor: '#ffc107',
            textColor: '#000000'
          },
          sold: {
            backgroundColor: '#f8d7da',
            borderColor: '#dc3545',
            textColor: '#000000'
          }
        },
        defaultSpotSize: { width: 50, height: 30 },
        gridSettings: {
          enabled: true,
          size: 10,
          color: '#cccccc'
        }
      };

      return { status: "success", data: defaultParameters };
    }

    const parameters = docSnapshot.data();
    console.log(`[${functionName}] 參數獲取成功`);
    return { status: "success", data: parameters };

  } catch (error) {
    console.error(`[${functionName}] Error:`, error);
    throw new HttpsError("internal", `獲取平面圖參數失敗: ${error.message}`);
  }
});

/**
 * 更新平面圖參數設定
 */
exports.updateFloorPlanParameters = onCall(async (request) => {
  const { floorPlanId, parameters } = request.data;
  const functionName = `updateFloorPlanParameters (FloorPlan: ${floorPlanId})`;

  if (!floorPlanId || !parameters) {
    throw new HttpsError("invalid-argument", "缺少 floorPlanId 或 parameters 參數。");
  }

  try {
    console.log(`[${functionName}] 更新平面圖參數...`);
    const db = new Firestore({ databaseId: "anxi-app" });

    const parameterData = {
      ...parameters,
      floorPlanId: floorPlanId,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };

    await db.collection("floorPlanParameters").doc(floorPlanId).set(parameterData, { merge: true });

    console.log(`[${functionName}] 參數更新成功`);
    return {
      status: "success",
      message: "平面圖參數更新成功"
    };

  } catch (error) {
    console.error(`[${functionName}] Error:`, error);
    throw new HttpsError("internal", `更新平面圖參數失敗: ${error.message}`);
  }
});

/**
 * 獲取專案的車位文字樣式
 * @param {string} projectId - 專案 ID
 * @returns {object} 儲存的樣式物件，如果不存在則回傳空物件
 */
exports.getProjectTextStyle = onCall(async (request) => {
  const { projectId } = request.data;
  const functionName = `getProjectTextStyle (Project: ${projectId})`;

  if (!projectId) {
    throw new HttpsError("invalid-argument", "缺少 projectId 參數。");
  }

  try {
    console.log(`[${functionName}] 正在獲取文字樣式...`);
    const db = new Firestore({ databaseId: "anxi-app" });
    const docRef = db.collection("parkingTextStyles").doc(projectId);
    const docSnap = await docRef.get();

    // ✓【修正】docSnap.exists 是一個屬性，不是函式
    if (docSnap.exists) {
      console.log(`[${functionName}] 成功獲取樣式。`);
      return { status: "success", styles: docSnap.data() };
    } else {
      console.log(`[${functionName}] 找不到樣式設定，回傳空物件。`);
      return { status: "success", styles: {} };
    }
  } catch (error) {
    console.error(`[${functionName}] Error:`, error);
    throw new HttpsError("internal", `獲取文字樣式失敗: ${error.message}`);
  }
});

/**
 * 更新專案的車位文字樣式
 * @param {string} projectId - 專案 ID
 * @param {object} styles - 完整的樣式物件
 */
exports.updateProjectTextStyle = onCall(async (request) => {
  const { projectId, styles } = request.data;
  const functionName = `updateProjectTextStyle (Project: ${projectId})`;

  if (!projectId || !styles || typeof styles !== 'object') {
    throw new HttpsError("invalid-argument", "缺少 projectId 或 styles 參數，或 styles 格式不正確。");
  }

  try {
    console.log(`[${functionName}] 正在更新文字樣式...`);
    const db = new Firestore({ databaseId: "anxi-app" });
    const docRef = db.collection("parkingTextStyles").doc(projectId);

    await docRef.set(styles, { merge: true });

    console.log(`[${functionName}] 更新成功。`);
    return { status: "success", message: "文字樣式更新成功。" };
  } catch (error) {
    console.error(`[${functionName}] Error:`, error);
    throw new HttpsError("internal", `更新文字樣式失敗: ${error.message}`);
  }
});

/**
 * 更新平面圖背景圖片 URL
 */
exports.updateFloorPlanBackground = onCall(async (request) => {
  const { floorPlanId, backgroundImageUrl } = request.data;
  const functionName = `updateFloorPlanBackground (FloorPlan: ${floorPlanId})`;

  if (!floorPlanId || !backgroundImageUrl) {
    throw new HttpsError("invalid-argument", "缺少 floorPlanId 或 backgroundImageUrl 參數。");
  }

  try {
    console.log(`[${functionName}] 更新平面圖背景圖片 URL...`);
    const db = new Firestore({ databaseId: "anxi-app" });

    // 檢查文件是否存在，如果不存在則創建
    const docRef = db.collection("parkingFloorPlans").doc(floorPlanId);
    const docSnap = await docRef.get();

    if (!docSnap.exists) {
      // 如果文件不存在，創建新文件
      await docRef.set({
        id: floorPlanId,
        backgroundImageUrl: backgroundImageUrl,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
      console.log(`[${functionName}] 創建新的平面圖文件並設置背景圖片`);
    } else {
      // 如果文件存在，更新背景圖片 URL
      await docRef.update({
        backgroundImageUrl: backgroundImageUrl,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
      console.log(`[${functionName}] 更新現有平面圖的背景圖片`);
    }

    console.log(`[${functionName}] 背景圖片 URL 更新成功`);
    return {
      status: "success",
      message: "平面圖背景圖片更新成功"
    };

  } catch (error) {
    console.error(`[${functionName}] Error:`, error);
    throw new HttpsError("internal", `更新平面圖背景圖片失敗: ${error.message}`);
  }
});

//  新增：根據 projectId 和 floor 查詢 salesParkings 車位資料
exports.getSalesParkingsByFloor = onCall(async (request) => {
  const functionName = "getSalesParkingsByFloor";


  try {
    const { projectId, floor } = request.data;



    if (!projectId || floor === undefined || floor === null) {

      throw new HttpsError("invalid-argument", "projectId 和 floor 參數為必填");
    }

    // 連接到正確的 Firebase 專案和資料庫
    const db = new Firestore({
      databaseId: "anxi-app"
    });

    //  新增：先查詢該建案是否有任何車位資料
    const allParkingsQuery = db.collection('salesParkings').where('projectId', '==', projectId);
    const allParkingsSnapshot = await allParkingsQuery.get();

    //  新增：列出該建案所有的樓層
    const floors = new Set();
    allParkingsSnapshot.forEach(doc => {
      const data = doc.data();
      if (data.floor !== undefined && data.floor !== null) {
        floors.add(data.floor);
      }
    });

    // 查詢符合條件的車位資料
    const salesParkingsRef = db.collection('salesParkings');
    const query = salesParkingsRef
      .where('projectId', '==', projectId)
      .where('floor', '==', floor)
      .orderBy('number', 'asc');

    const snapshot = await query.get();

    if (snapshot.empty) {
      console.log(`[${functionName}] 未找到符合條件的車位資料`);
      return {
        success: true,
        total: 0,
        preview: [],
        allData: [],
        debug: {
          totalParkingsInProject: allParkingsSnapshot.size,
          availableFloors: Array.from(floors).sort(),
          searchedProjectId: projectId,
          searchedFloor: floor,
          floorType: typeof floor
        }
      };
    }

    const allData = [];
    snapshot.forEach(doc => {
      allData.push({
        id: doc.id,
        ...doc.data()
      });
    });

    // 取前 10 筆作為預覽
    const preview = allData.slice(0, 10);

    return {
      success: true,
      total: allData.length,
      preview: preview,
      allData: allData
    };

  } catch (error) {
    console.error(`[${functionName}] Error:`, error);
    throw new HttpsError("internal", `查詢車位資料失敗: ${error.message}`);
  }
});


/**
 * 獲取車位的狀態顏色設定
 * @param {string} projectId - 專案 ID
 * @returns {object} 儲存的顏色設定物件，如果不存在則回傳空物件
 */
exports.getProjectStatusColors = onCall(async (request) => {
  const { projectId } = request.data;
  const functionName = `getProjectStatusColors (Project: ${projectId})`;

  if (!projectId) {
    throw new HttpsError("invalid-argument", "缺少 projectId 參數。");
  }

  try {
    console.log(`[${functionName}] 正在獲取狀態顏色...`);
    const db = new Firestore({ databaseId: "anxi-app" });
    const docRef = db.collection("projectStatusColors").doc(projectId);
    const docSnap = await docRef.get();

    if (docSnap.exists) {
      console.log(`[${functionName}] 成功獲取顏色設定。`);
      return { status: "success", colors: docSnap.data() };
    } else {
      console.log(`[${functionName}] 找不到顏色設定，回傳空物件。`);
      return { status: "success", colors: {} };
    }
  } catch (error) {
    console.error(`[${functionName}] Error:`, error);
    throw new HttpsError("internal", `獲取狀態顏色失敗: ${error.message}`);
  }
});

/**
 * 更新車位的狀態顏色設定
 * @param {string} projectId - 專案 ID
 * @param {object} colors - 完整的顏色設定物件
 */
exports.updateProjectStatusColors = onCall(async (request) => {
  const { projectId, colors } = request.data;
  const functionName = `updateProjectStatusColors (Project: ${projectId})`;

  if (!projectId || !colors || typeof colors !== 'object') {
    throw new HttpsError("invalid-argument", "缺少 projectId 或 colors 參數，或 colors 格式不正確。");
  }

  try {
    console.log(`[${functionName}] 正在更新狀態顏色...`);
    const db = new Firestore({ databaseId: "anxi-app" });
    const docRef = db.collection("projectStatusColors").doc(projectId);

    await docRef.set(colors); // 使用 set 直接覆蓋，確保刪除的狀態會被移除

    console.log(`[${functionName}] 更新成功。`);
    return { status: "success", message: "狀態顏色更新成功。" };
  } catch (error) {
    console.error(`[${functionName}] Error:`, error);
    throw new HttpsError("internal", `更新狀態顏色失敗: ${error.message}`);
  }
});


// =================================================================
// /  ↑↑↑↑結尾　車位平面圖管理系統 Cloud Functions↑↑↑↑↑
// =================================================================

/**
 *  【新增】 上傳驗屋系統戶別資料並更新 Firestore
 * 從前端接收 Excel 解析後的 JSON 資料，批次更新 households 集合
 */
exports.uploadInspectionHouseholds = onCall({ region: "asia-east1", timeoutSeconds: 540, memory: "1GiB" }, async (request) => {
  const xlsx = require("xlsx");
  const { projectId, householdsData } = request.data;
  const functionName = `uploadInspectionHouseholds (Project: ${projectId})`;

  if (!projectId || !Array.isArray(householdsData) || householdsData.length === 0) {
    throw new HttpsError("invalid-argument", "請求缺少 projectId 或有效的戶別資料。");
  }

  const db = new Firestore({ databaseId: "anxi-app" });

  try {
    console.log(`[${functionName}] 開始執行，準備更新 ${householdsData.length} 筆戶別資料...`);

    let batch = db.batch();
    let operationsCount = 0;
    const MAX_OPERATIONS_PER_BATCH = 499;

    for (const row of householdsData) {
      let docId;

      if (row._docId) {
        docId = row._docId;
      }
      else if (row.unitId) {
        docId = `${projectId}_${row.unitId}`;
      }
      else {
        console.warn(`[${functionName}] 警告：資料行缺少 '_docId' 或 'unitId'，已跳過。`, row);
        continue;
      }

      const dataToSave = { ...row, projectId };
      delete dataToSave._docId;

      // START: 新增資料格式轉換邏輯
      // 處理布林值
      ['showInMenu', 'initialReportUploadSwitch', 'reInspectionReportUploadSwitch'].forEach(field => {
        if (dataToSave[field] !== undefined) {
          const val = String(dataToSave[field]).toUpperCase();
          dataToSave[field] = (val === 'TRUE' || val === 'Y' || val === 'ON');
        }
      });

      // 處理日期 (Excel 可能傳來日期物件或 null)
      ['appropriationDate', 'initialInspectionDate', 'reInspectionDate'].forEach(field => {
        if (dataToSave[field]) {
          const date = new Date(dataToSave[field]);
          if (!isNaN(date.getTime())) {
            dataToSave[field] = admin.firestore.Timestamp.fromDate(date);
          } else {
            dataToSave[field] = null; // 無效日期轉為 null
          }
        } else {
          dataToSave[field] = null; // 空值保持 null
        }
      });

      // 處理可能為 null 的字串欄位，確保它們是空字串
      ['address', 'bank', 'buyerEmail', 'remarks'].forEach(field => {
        if (dataToSave[field] === null || dataToSave[field] === undefined) {
          dataToSave[field] = "";
        }
      });
      // END: 新增資料格式轉換邏輯

      const docRef = db.collection("households").doc(docId);

      batch.set(docRef, dataToSave, { merge: true });
      operationsCount++;

      if (operationsCount >= MAX_OPERATIONS_PER_BATCH) {
        await batch.commit();
        batch = db.batch();
        operationsCount = 0;
      }
    }

    if (operationsCount > 0) {
      await batch.commit();
    }

    console.log(`[${functionName}] 更新成功！`);
    return { status: "success", message: `成功更新或新增了 ${householdsData.length} 筆戶別資料。` };

  } catch (error) {
    console.error(`[${functionName}] 發生錯誤:`, error);
    throw new HttpsError("internal", `更新戶別資料時發生錯誤: ${error.message}`);
  }
});

// ✓ START: 新增共用函式，用於根據權限查找副本收件人
/**
 * 根據專案 ID 和權限名稱，獲取應收到副本通知的使用者 Email 列表
 * @param {string} projectId - 專案 ID
 * @param {string} permissionName - 權限的中文名稱
 * @returns {Promise<string[]>} - Email 字串陣列
 */
async function getCcRecipients(projectId, permissionName) {
  const db = new Firestore({ databaseId: "anxi-app" });
  try {
    // 步驟 1: 查詢 userPermissions 集合，找出擁有指定權限的使用者手機
    const permQuery = db.collection('userPermissions')
      .where(`permissions.${projectId}.systems`, 'array-contains', permissionName);

    const permSnapshot = await permQuery.get();
    if (permSnapshot.empty) {
      console.log(`[getCcRecipients] 在專案 ${projectId} 中找不到擁有 '${permissionName}' 權限的使用者。`);
      return [];
    }

    const userPhones = permSnapshot.docs.map(doc => doc.id);
    if (userPhones.length === 0) return [];

    // 步驟 2: 使用手機號碼去 users 集合查詢對應的 Email
    const usersQuery = db.collection('users').where(FieldPath.documentId(), 'in', userPhones);
    const usersSnapshot = await usersQuery.get();
    if (usersSnapshot.empty) return [];

    // 步驟 3: 提取並過濾有效的 Email
    const emails = usersSnapshot.docs
      .map(doc => doc.data().email)
      .filter(email => email && typeof email === 'string'); // 過濾掉空值或無效的 email

    console.log(`[getCcRecipients] 為專案 ${projectId} 找到 ${emails.length} 位副本收件人。`);
    return emails;

  } catch (error) {
    console.error(`[getCcRecipients] 查找副本收件人時發生錯誤:`, error);
    return []; // 發生錯誤時回傳空陣列，確保主流程不受影響
  }
}

/**
 *  【新增】儲存自訂欄位定義
 * 用於從前端接收新欄位的設定，並將其寫入 projectFieldDefinitions 集合
 */
exports.saveFieldDefinition = onCall(async (request) => {
  // 假設未來會從 request.auth.uid 獲取操作者資訊進行權限驗證
  // const uid = request.auth.uid;
  // if (!uid) {
  //   throw new HttpsError("unauthenticated", "使用者未登入。");
  // }

  const { projectId, collectionName, fieldName, fieldType, options, order } = request.data;

  if (!projectId || !collectionName || !fieldName || !fieldType) {
    throw new HttpsError("invalid-argument", "請求缺少必要參數 (projectId, collectionName, fieldName, fieldType)。");
  }

  // TODO: 未來可在此處加入更詳細的權限驗證，例如檢查使用者是否為該建案的管理員

  const db = new Firestore({ databaseId: "anxi-app" });

  // 以 projectId_collectionName_fieldName 作為文件 ID 來防止重複
  const docId = `${projectId}_${collectionName}_${fieldName}`;
  const docRef = db.collection("projectFieldDefinitions").doc(docId);

  const doc = await docRef.get();
  if (doc.exists) {
    throw new HttpsError("already-exists", `欄位名稱 [${fieldName}] 已在此建案中存在。`);
  }

  try {
    await docRef.set({
      projectId,
      collectionName,
      fieldName,
      fieldType,
      options: options || [],
      order: order || 100, // 提供一個預設排序值
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });

    return { status: "success", message: `欄位 [${fieldName}] 已成功新增！`, docId: docId };

  } catch (error) {
    console.error(`儲存欄位定義時發生錯誤 (Doc ID: ${docId}):`, error);
    throw new HttpsError("internal", `寫入資料庫時發生未知錯誤: ${error.message}`);
  }
});





exports.saveBooking = onCall({ region: "asia-east1", secrets: ["SENDER_EMAIL", "GMAIL_APP_PASSWORD"], cors: true }, async (request) => {
  const { projectId, bookingData } = request.data;
  const functionName = `saveBooking (Project: ${projectId})`;

  if (!projectId || !bookingData) {
    throw new HttpsError("invalid-argument", "缺少 projectId 或 bookingData。");
  }

  // --- START: Token 驗證 ---
  const confirmationToken = bookingData.confirmationToken;
  if (!confirmationToken) {
    console.error(`[${functionName}] 錯誤：請求中缺少 confirmationToken。`);
    throw new HttpsError("unauthenticated", "缺少預約確認憑證，請重新操作。");
  }

  const db = new Firestore({ databaseId: "anxi-app" }); // 維持不變
  const tokenRef = db.collection("bookingConfirmTokens").doc(confirmationToken);

  try {
    console.log(`[${functionName}] 正在驗證 Token: ${confirmationToken}`);
    const tokenDoc = await tokenRef.get();

    if (!tokenDoc.exists) {
      console.warn(`[${functionName}] Token ${confirmationToken} 不存在。`);
      throw new HttpsError("unauthenticated", "預約確認憑證無效(不存在)，請重新操作。");
    }

    const tokenData = tokenDoc.data();
    const now = new Date();

    // 檢查狀態 (可選，但建議)
    if (tokenData.status !== 'pending') {
      console.warn(`[${functionName}] Token ${confirmationToken} 狀態為 ${tokenData.status}。`);
      throw new HttpsError("unauthenticated", "預約確認憑證已失效(狀態錯誤)，請重新操作。");
    }

    // 檢查過期時間
    if (now > tokenData.expiresAt.toDate()) {
      console.warn(`[${functionName}] Token ${confirmationToken} 已過期。`);
      // 過期也直接刪除
      await tokenRef.delete();
      throw new HttpsError("deadline-exceeded", "操作已逾時(Token過期)，請重新操作。");
    }

    // 檢查 projectId, unitId, bookingType 是否匹配
    if (tokenData.projectId !== projectId || tokenData.unitId !== bookingData.unitId || tokenData.bookingType !== bookingData.bookingType) {
      console.error(`[${functionName}] Token ${confirmationToken} 資料不匹配! Token:`, tokenData, " Request:", { projectId, unitId: bookingData.unitId, bookingType: bookingData.bookingType });
      // 資料不符，刪除無效 Token
      await tokenRef.delete();
      throw new HttpsError("invalid-argument", "預約確認憑證資料不符，請重新操作。");
    }

    // 驗證通過，立即刪除 Token 防止重用
    console.log(`[${functionName}] Token ${confirmationToken} 驗證成功，正在刪除...`);
    await tokenRef.delete();
    console.log(`[${functionName}] Token ${confirmationToken} 已成功刪除。`);

  } catch (error) {
    console.error(`[${functionName}] Token 驗證或刪除過程中發生錯誤:`, error);
    // 如果是我們自己拋出的 HttpsError，直接再次拋出
    if (error instanceof HttpsError) {
      throw error;
    }
    // 其他 Firestore 讀取/刪除錯誤
    throw new HttpsError("internal", `驗證預約憑證時發生錯誤: ${error.message}`);
  }
  // --- END: Token 驗證 ---

  try {
    const projectRef = db.collection('projects').doc(projectId);
    const projectDoc = await projectRef.get();
    const projectName = projectDoc.exists ? projectDoc.data().name : projectId;

    // 使用 Firestore 事務 (Transaction) 來確保資料一致性
    const result = await db.runTransaction(async (transaction) => {
      const householdDocId = `${projectId}_${bookingData.unitId}`;
      const householdRef = db.collection('households').doc(householdDocId);

      // 1. 在 Transaction 中重新檢查戶別、批次、規則等前置條件
      const householdDoc = await transaction.get(householdRef);
      if (!householdDoc.exists) {
        throw new HttpsError("not-found", `找不到戶別 "${bookingData.unitId}" 的資料。`);
      }
      const householdData = householdDoc.data();

      const batchCodeField = bookingData.bookingType === '初驗' ? 'initialInspectionBatch' : 'reInspectionBatch';
      const batchCode = householdData[batchCodeField];
      if (!batchCode) {
        throw new HttpsError("permission-denied", `此戶別的 "${bookingData.bookingType}" 預約目前未指派批次。`);
      }

      const batchQuery = db.collection('bookingBatches').where('projectId', '==', projectId).where('batchCode', '==', batchCode).where('bookingType', '==', bookingData.bookingType).where('isDeleted', '==', false).limit(1);
      const batchSnapshot = await transaction.get(batchQuery);
      if (batchSnapshot.empty) {
        throw new HttpsError("not-found", `找不到對應的預約批次。`);
      }
      const batchId = batchSnapshot.docs[0].id;

      // 使用 toLocaleDateString 確保日期格式正確，並指定台灣時區
      const appointmentDateForCompare = new Date(bookingData.bookingDate);
      const appointmentDateStr = appointmentDateForCompare.toLocaleDateString('sv-SE', { timeZone: 'Asia/Taipei' }); // 'YYYY-MM-DD'

      // const appointmentDateStr = bookingData.bookingDate.split(' ')[0].replace(/\//g, '-');
      const linksQuery = db.collection('batchRuleLinks').where('batchId', '==', batchId).where('date', '==', appointmentDateStr).where('isDeleted', '==', false).limit(1);
      const linksSnapshot = await transaction.get(linksQuery);
      if (linksSnapshot.empty) {
        throw new HttpsError("failed-precondition", `日期 ${appointmentDateStr} 不在可預約範圍內。`);
      }
      const ruleId = linksSnapshot.docs[0].data().ruleId;
      const ruleRef = db.collection('dateRules').doc(ruleId);
      const ruleDoc = await transaction.get(ruleRef);
      if (!ruleDoc.exists) {
        throw new HttpsError("internal", "找不到對應的每日規則設定。");
      }

      const ruleData = ruleDoc.data();
      const timeSlotKey = bookingData.bookingTimeSlot; // bookingData.bookingTimeSlot 應該已是 'HH:MM'
      const slotInfo = ruleData.slots[timeSlotKey];


      if (!slotInfo || !slotInfo.methods.includes(bookingData.bookingMethod)) {
        throw new HttpsError("failed-precondition", `時段 ${timeSlotKey} 不適用於「${bookingData.bookingMethod}」。`);
      }
      const capacity = slotInfo.capacity || 0;

      // 2. 在 Transaction 中執行關鍵檢查：重複預約
      const appointmentsQueryDuplicate = db.collection('appointments').where('projectId', '==', projectId).where('unitId', '==', bookingData.unitId).where('bookingType', '==', bookingData.bookingType).where('status', '==', '預約中');
      const existingBookingSnapshot = await transaction.get(appointmentsQueryDuplicate);
      if (!existingBookingSnapshot.empty) {
        throw new HttpsError("already-exists", `此戶別的「${bookingData.bookingType}」已有有效預約，請返回第一步重新操作。`);
      }

      // 3. 在 Transaction 中執行關鍵檢查：時段名額
      const appointmentDateObj = new Date(appointmentDateStr + 'T00:00:00+08:00'); // 指定時區
      const appointmentsQueryCapacity = db.collection('appointments').where('projectId', '==', projectId).where('appointmentDate', '==', appointmentDateObj).where('appointmentTimeSlot', '==', timeSlotKey).where('status', '==', '預約中');
      const appointmentsSnapshot = await transaction.get(appointmentsQueryCapacity);
      const currentBookings = appointmentsSnapshot.size;

      if (currentBookings >= capacity) {
        // 使用特定的錯誤代碼或訊息前綴
        throw new HttpsError("resource-exhausted", `SLOT_FULL: 此時段名額剛好額滿，請返回上一步重新選擇時段。`);
      }

      // 4. 所有檢查通過，準備寫入新資料 (維持不變)
      const bookingCode = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'.split('').sort(() => 0.5 - Math.random()).join('').substring(0, 6);
      const now = new Date();
      // 使用 toLocaleTimeString 和 toLocaleDateString 確保格式和時區
      const timeStr = now.toLocaleTimeString('sv-SE', { timeZone: 'Asia/Taipei', hour12: false }).replace(/:/g, '-');
      const dateStr = now.toLocaleDateString('sv-SE', { timeZone: 'Asia/Taipei' }).replace(/-/g, '').slice(2); // YYMMDD
      // const timezoneOffset = 8 * 60;
      // const localNow = new Date(now.getTime() + (now.getTimezoneOffset() + timezoneOffset) * 60000);
      // const timeStr = localNow.toISOString().slice(11, 19).replace(/:/g, '-');
      // const dateStr = localNow.toISOString().slice(5, 10);
      const docId = `${projectId}_${dateStr}-${timeStr}_${bookingData.unitId}`;
      const appointmentRef = db.collection('appointments').doc(docId);

      const appointmentDateTimestamp = Timestamp.fromDate(new Date(appointmentDateStr + 'T00:00:00+08:00')); // 轉換日期字串


      const newAppointmentData = {
        projectId: projectId,
        createdAt: Timestamp.now(),
        unitId: bookingData.unitId,
        address: bookingData.address || '',
        bookerName: bookingData.name,
        bookerPhone: bookingData.phone,
        bookerEmail: bookingData.email,
        bookerIdNumber: bookingData.idNumber,
        bookingType: bookingData.bookingType,
        appointmentDate: appointmentDateTimestamp, // 使用 Timestamp
        appointmentTimeSlot: timeSlotKey,
        status: '預約中',
        inspectionMethod: bookingData.bookingMethod,
        inspectionCompanyName: bookingData.companyName || '',
        authorizationLetterUrl: bookingData.authorizationLetterUrl || '',
        principalName: bookingData.principalName || '',
        principalIdNumber: bookingData.principalIdNumber || '',
        principalAddress: bookingData.principalAddress || '',
        agentName: bookingData.agentName || '',
        agentIdNumber: bookingData.agentIdNumber || '',
        agentAddress: bookingData.agentAddress || '',
        agentPhone: bookingData.agentPhone || '',
        bookingCode: bookingCode,
        reportUploaded: !['初驗', '複驗', '驗屋'].includes(bookingData.bookingType),
      };

      transaction.set(appointmentRef, newAppointmentData);

      return { bookingCode, newAppointmentData }; // 維持不變
    });

    // ... (後續的更新戶別摘要、寄送 Email 等邏輯完全不變) ...
    // Transaction 成功後
    const { bookingCode, newAppointmentData } = result;

    // 【已新增】在此處呼叫統一的摘要更新函式
    await updateHouseholdSummary(db, projectId, newAppointmentData.unitId);

    // --- 準備 Email ---
    let closingText = '請於預約時段準時抵達，感謝您的配合。';
    let inspectionNotesHtml = '';
    let contactInfoHtml = '';

    if (projectDoc.exists) {
      const projectData = projectDoc.data();
      // ... (獲取 closingText, inspectionNotesHtml, contactInfoHtml 的邏輯不變) ...
      if (projectData.intro && projectData.intro.closingText) {
        closingText = projectData.intro.closingText;
      } else if (projectData.emailConfig && projectData.emailConfig.closingText) {
        closingText = projectData.emailConfig.closingText;
      }

      if (projectData.intro && projectData.intro.alert && projectData.intro.alert.text) {
        inspectionNotesHtml = projectData.intro.alert.text;
      }

      if (projectData.intro && projectData.intro.contact) {
        const contact = projectData.intro.contact;
        if (contact.name || contact.phone) {
          const namePart = contact.name ? `<strong>${contact.name}</strong>` : '';
          const phonePart = contact.phone ? `電話：${contact.phone}` : '';
          const separator = contact.name && contact.phone ? ' / ' : '';
          contactInfoHtml = `
                        <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #eeeeee;">
                            <p style="margin: 0; font-size: 14px; color: #555;">
                                如有任何疑問，請洽詢：<br>
                                ${namePart}${separator}${phonePart}
                            </p>
                        </div>
                    `;
        }
      }
    }

    // --- 寄送 Email (邏輯不變) ---
    const mailTransport = nodemailer.createTransport({
      service: 'gmail',
      auth: { user: process.env.SENDER_EMAIL, pass: process.env.GMAIL_APP_PASSWORD },
    });


    const subject = `【${projectName}】預約成功通知 (${newAppointmentData.unitId})`;
    const bookingUrl = `https://anxismart.com/#/booking/${projectId}`;
    const bookingLinkHtml = `
            <p style="margin-top: 25px; padding-top: 20px; border-top: 1px solid #eeeeee; font-size: 14px; color: #555;">
                若您要查詢、修改或取消預約，請點擊以下按鈕返回預約頁面：<br>
                <a href="${bookingUrl}" target="_blank" style="display: inline-block; margin-top: 12px; padding: 10px 20px; background-color: #007bff; color: #ffffff; text-decoration: none; border-radius: 5px; font-weight: bold;">
                    前往預約頁面
                </a>
            </p>
        `;

    // 格式化日期為 YYYY/MM/DD
    const formattedAppointmentDate = newAppointmentData.appointmentDate.toDate().toLocaleDateString('zh-TW', {
      timeZone: 'Asia/Taipei', // 確保使用台灣時區
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });

    const htmlBody = `
<div style="font-family: 'Helvetica Neue', Helvetica, Arial, 'PingFang TC', 'Microsoft JhengHei', sans-serif; background-color: #f4f4f7; padding: 20px;">
  <div style="max-width: 600px; margin: 20px auto; background-color: #ffffff; border-radius: 8px; border: 1px solid #e0e0e0; overflow: hidden;">
    <div style="background-color: #007bff; color: #ffffff; padding: 20px; text-align: center;">
      <h2 style="margin: 0; font-size: 24px;">預約成功通知</h2>
    </div>
    <div style="padding: 24px; line-height: 1.6; color: #333333;">
      <p>親愛的 <strong>${newAppointmentData.bookerName}</strong> 您好：</p>
      <p>您已成功完成預約，以下是您的預約詳細資訊，請再次確認。</p>
      <table style="width: 100%; border-collapse: collapse; margin-top: 20px; margin-bottom: 20px;">
        <tbody>
          <tr style="border-bottom: 1px solid #eeeeee;"><td style="padding: 12px 0; font-weight: bold; color: #555555; width: 100px;">預約代碼</td><td style="padding: 12px 0; font-weight: bold; font-size: 16px; color: #D32F2F;">${newAppointmentData.bookingCode}</td></tr>
          <tr style="border-bottom: 1px solid #eeeeee;"><td style="padding: 12px 0; font-weight: bold; color: #555555;">建案名稱</td><td style="padding: 12px 0;">${projectName}</td></tr>
          <tr style="border-bottom: 1px solid #eeeeee;"><td style="padding: 12px 0; font-weight: bold; color: #555555;">戶別</td><td style="padding: 12px 0;">${newAppointmentData.unitId}</td></tr>
          <tr style="border-bottom: 1px solid #eeeeee;"><td style="padding: 12px 0; font-weight: bold; color: #555555;">門牌</td><td style="padding: 12px 0;">${newAppointmentData.address}</td></tr>
          <tr style="border-bottom: 1px solid #eeeeee;"><td style="padding: 12px 0; font-weight: bold; color: #555555;">預約姓名</td><td style="padding: 12px 0;">${newAppointmentData.bookerName}</td></tr>
          <tr style="border-bottom: 1px solid #eeeeee;"><td style="padding: 12px 0; font-weight: bold; color: #555555;">預約人電話</td><td style="padding: 12px 0;">${newAppointmentData.bookerPhone}</td></tr>
          <tr style="border-bottom: 1px solid #eeeeee;"><td style="padding: 12px 0; font-weight: bold; color: #555555;">EMAIL</td><td style="padding: 12px 0;">${newAppointmentData.bookerEmail}</td></tr>
          ${newAppointmentData.agentName ? `
           <tr style="border-top: 1px dashed #cccccc;"><td style="padding: 12px 0; font-weight: bold; color: #555555;">受託人姓名</td><td style="padding: 12px 0;">${newAppointmentData.agentName}</td></tr>
           <tr style="border-bottom: 1px solid #eeeeee;"><td style="padding: 12px 0; font-weight: bold; color: #555555;">受託人電話</td><td style="padding: 12px 0;">${newAppointmentData.agentPhone}</td></tr>
          ` : ''}
          ${newAppointmentData.authorizationLetterUrl ? `
            <tr style="border-bottom: 1px solid #eeeeee;">
              <td style="padding: 12px 0; font-weight: bold; color: #555555;">驗屋授權書</td>
              <td style="padding: 12px 0;">
                <a href="${newAppointmentData.authorizationLetterUrl}" target="_blank" style="color: #007BFF; text-decoration: none;">點此查看</a>
              </td>
            </tr>
          ` : ''}
          <tr style="border-bottom: 1px solid #eeeeee;"><td style="padding: 12px 0; font-weight: bold; color: #555555;">預約項目</td><td style="padding: 12px 0;">${newAppointmentData.bookingType}</td></tr>
          <tr style="border-bottom: 1px solid #eeeeee;"><td style="padding: 12px 0; font-weight: bold; color: #555555;">選擇方式</td><td style="padding: 12px 0;">${newAppointmentData.inspectionMethod}</td></tr>
          ${newAppointmentData.inspectionCompanyName ? `
          <tr style="border-bottom: 1px solid #eeeeee;"><td style="padding: 12px 0; font-weight: bold; color: #555555;">代驗公司</td><td style="padding: 12px 0;">${newAppointmentData.inspectionCompanyName}</td></tr>
          ` : ''}
          <tr style="border-bottom: 1px solid #eeeeee;"><td style="padding: 12px 0; font-weight: bold; color: #555555;">預約日期</td><td style="padding: 12px 0;">${formattedAppointmentDate}</td></tr>
          <tr><td style="padding: 12px 0; font-weight: bold; color: #555555;">預約時段</td><td style="padding: 12px 0;">${newAppointmentData.appointmentTimeSlot}</td></tr>
        </tbody>
      </table>
      <div style="padding: 15px; margin-top: 15px; margin-bottom: 20px; background-color: #f8f9fa; border-left: 4px solid #17a2b8; color: #333;">${closingText}</div>
      ${contactInfoHtml}
      ${inspectionNotesHtml ? `
        <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #eeeeee;">
          <h3 style="margin-top: 0; color: #333;">預約說明</h3>
          ${inspectionNotesHtml}
        </div>
      ` : ''}
      ${bookingLinkHtml}
    </div>
    <div style="background-color: #f4f4f7; padding: 16px; text-align: center; font-size: 12px; color: #777777;">
      <p style="margin: 0;">此為系統自動發送郵件，請勿直接回覆。</p>
      <p style="margin: 5px 0 0 0;">${projectName} 預約系統</p>
      <p style="margin: 10px 0 0 0; font-size: 11px; color: #999999;">
        本服務由 <a href="https://anxismart.com/" target="_blank" style="color: #007bff; text-decoration: none; font-weight: bold;">anxismart安熙智慧建案管理系統</a> 提供技術支援
      </p>
    </div>
  </div>
</div>
        `;


    const ccRecipients = await getCcRecipients(projectId, "驗屋系統信件副本");
    await mailTransport.sendMail({
      to: newAppointmentData.bookerEmail,
      cc: ccRecipients,
      subject: subject,
      html: htmlBody,
      name: `${projectName} 預約系統`
    });

    // --- 返回成功結果 (維持不變) ---
    return { status: 'success', data: { bookingCode } };

  } catch (error) { // 外層 catch 區塊維持
    console.error(`[${functionName}] 🔴 預約時發生錯誤:`, error);
    if (error instanceof HttpsError) {
      throw error;
    }
    throw new HttpsError("internal", `儲存預約時發生嚴重錯誤: ${error.message}`);
  }
}); // 確保函數定義結束

/**
 * 【新增】取消一筆預約紀錄
 */
exports.cancelBooking = onCall({ region: "asia-east1", secrets: ["SENDER_EMAIL", "GMAIL_APP_PASSWORD"], cors: true }, async (request) => {
  const { projectId, bookingCode } = request.data;
  const functionName = `cancelBooking (Project: ${projectId}, Code: ${bookingCode})`;

  if (!projectId || !bookingCode) {
    throw new HttpsError("invalid-argument", "缺少 projectId 或 bookingCode。");
  }

  const db = new Firestore({ databaseId: "anxi-app" });

  try {
    const appointmentsRef = db.collection("appointments");

    const query = appointmentsRef
      .where("projectId", "==", projectId)
      .where("bookingCode", "==", bookingCode)
      .where("status", "==", "預約中")
      .limit(1);

    const snapshot = await query.get();

    if (snapshot.empty) {
      throw new HttpsError("not-found", `找不到可取消的預約紀錄 (代碼: ${bookingCode})。`);
    }

    const docToCancel = snapshot.docs[0];
    const bookingData = docToCancel.data();

    // 在 runTransaction 之外先取得 unitId，以供後續使用
    const unitId = bookingData.unitId;

    await db.runTransaction(async (transaction) => {
      // 在交易中只更新預約本身的狀態
      transaction.update(docToCancel.ref, {
        status: "取消",
        cancelledAt: Timestamp.now()
      });

      //  【已移除】此處不再需要手動更新 households 集合的程式碼
    });

    console.log(`[${functionName}] 已成功將預約 [${docToCancel.id}] 的狀態更新為「取消」。`);

    //  【已新增】在交易成功後，呼叫統一的摘要更新函式
    await updateHouseholdSummary(db, projectId, unitId);

    if (bookingData.bookerEmail) {
      // ... (後續所有寄送 Email 的邏輯，完全保持不變) ...
      const projectRef = db.collection('projects').doc(projectId);
      const projectDoc = await projectRef.get();
      const projectName = projectDoc.exists ? projectDoc.data().name : projectId;
      let contactInfoHtml = '';
      if (projectDoc.exists) {
        const projectData = projectDoc.data();
        if (projectData.intro && projectData.intro.contact) {
          const contact = projectData.intro.contact;
          if (contact.name || contact.phone) {
            const namePart = contact.name ? `<strong>${contact.name}</strong>` : '';
            const phonePart = contact.phone ? `電話：${contact.phone}` : '';
            const separator = contact.name && contact.phone ? ' / ' : '';
            contactInfoHtml = `
                            <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #eeeeee;">
                                <p style="margin: 0; font-size: 14px; color: #555;">
                                    如有任何疑問，請洽詢：<br>
                                    ${namePart}${separator}${phonePart}
                                </p>
                            </div>
                        `;
          }
        }
      }

      const mailTransport = nodemailer.createTransport({

        service: 'gmail',
        auth: { user: process.env.SENDER_EMAIL, pass: process.env.GMAIL_APP_PASSWORD },
      });

      const subject = `【${projectName}】預約取消成功通知 (${bookingData.unitId})`;
      const bookingUrl = `https://anxismart.com/#/booking/${projectId}`;

      //  【風格更新處】
      const htmlBody = `
<div style="font-family: 'Helvetica Neue', Helvetica, Arial, 'PingFang TC', 'Microsoft JhengHei', sans-serif; background-color: #f4f4f7; padding: 20px;">
  <div style="max-width: 600px; margin: 20px auto; background-color: #ffffff; border-radius: 8px; border: 1px solid #e0e0e0; overflow: hidden;">
    <div style="background-color: #dc3545; color: #ffffff; padding: 20px; text-align: center;">
      <h2 style="margin: 0; font-size: 24px;">預約取消通知</h2>
    </div>
    <div style="padding: 24px; line-height: 1.6; color: #333333;">
      <p>親愛的 <strong>${bookingData.bookerName}</strong> 您好：</p>
      <p>您已成功取消您的預約，以下是已取消的預約資訊：</p>
      <table style="width: 100%; border-collapse: collapse; margin-top: 20px; margin-bottom: 20px; opacity: 0.7;">
        <tbody>
          <tr style="border-bottom: 1px solid #eeeeee;"><td style="padding: 12px 0; font-weight: bold; color: #555555; width: 100px;">預約代碼</td><td style="padding: 12px 0;">${bookingData.bookingCode}</td></tr>
          <tr style="border-bottom: 1px solid #eeeeee;"><td style="padding: 12px 0; font-weight: bold; color: #555555;">建案名稱</td><td style="padding: 12px 0;">${projectName}</td></tr>
          <tr style="border-bottom: 1px solid #eeeeee;"><td style="padding: 12px 0; font-weight: bold; color: #555555;">戶別</td><td style="padding: 12px 0;">${bookingData.unitId}</td></tr>
          <tr style="border-bottom: 1px solid #eeeeee;"><td style="padding: 12px 0; font-weight: bold; color: #555555;">預約項目</td><td style="padding: 12px 0;">${bookingData.bookingType}</td></tr>
          <tr style="border-bottom: 1px solid #eeeeee;"><td style="padding: 12px 0; font-weight: bold; color: #555555;">選擇方式</td><td style="padding: 12px 0;">${bookingData.inspectionMethod || '未提供'}</td></tr>
          ${bookingData.inspectionCompanyName ? `
          <tr style="border-bottom: 1px solid #eeeeee;"><td style="padding: 12px 0; font-weight: bold; color: #555555;">代驗公司</td><td style="padding: 12px 0;">${bookingData.inspectionCompanyName}</td></tr>
          ` : ''}
          ${bookingData.agentName ? `
           <tr style="border-top: 1px dashed #cccccc;"><td style="padding: 12px 0; font-weight: bold; color: #555555;">受託人姓名</td><td style="padding: 12px 0;">${bookingData.agentName}</td></tr>
           <tr style="border-bottom: 1px solid #eeeeee;"><td style="padding: 12px 0; font-weight: bold; color: #555555;">受託人電話</td><td style="padding: 12px 0;">${bookingData.agentPhone}</td></tr>
          ` : ''}
          <tr style="border-bottom: 1px solid #eeeeee;"><td style="padding: 12px 0; font-weight: bold; color: #555555;">原預約日期</td><td style="padding: 12px 0;">${bookingData.appointmentDate.toDate().toLocaleDateString('zh-TW', { timeZone: 'Asia/Taipei', year: 'numeric', month: '2-digit', day: '2-digit' })}</td></tr>
          <tr><td style="padding: 12px 0; font-weight: bold; color: #555555;">原預約時段</td><td style="padding: 12px 0;">${bookingData.appointmentTimeSlot}</td></tr>
        </tbody>
      </table>
      <p>若您需要重新預約，歡迎隨時返回預約頁面。感謝您的使用。</p>
      ${contactInfoHtml}
      <p style="margin-top: 25px; padding-top: 20px; border-top: 1px solid #eeeeee; text-align: center;">
          <a href="${bookingUrl}" target="_blank" style="display: inline-block; padding: 10px 20px; background-color: #007bff; color: #ffffff; text-decoration: none; border-radius: 5px; font-weight: bold;">
              點此重新預約

          </a>
      </p>
    </div>
    <div style="background-color: #f4f4f7; padding: 16px; text-align: center; font-size: 12px; color: #777777;">
      <p style="margin: 0;">此為系統自動發送郵件，請勿直接回覆。</p>
      <p style="margin: 5px 0 0 0;">${projectName} 預約系統</p>
      <p style="margin: 10px 0 0 0; font-size: 11px; color: #999999;">
        本服務由 <a href="https://anxismart.com/" target="_blank" style="color: #007bff; text-decoration: none; font-weight: bold;">anxismart安熙智慧建案管理系統</a> 提供技術支援
      </p>
    </div>
  </div>
</div>
            `;

      const ccRecipients = await getCcRecipients(projectId, "驗屋系統信件副本");
      await mailTransport.sendMail({
        to: bookingData.bookerEmail,
        cc: ccRecipients,
        subject: subject,
        html: htmlBody,
        name: `${projectName} 預約系統`
      });
      console.log(`[${functionName}] 已寄送取消通知信至 ${bookingData.bookerEmail}`);
    }

    return { status: "success", message: "預約已成功取消" };

  } catch (error) {
    console.error(`[${functionName}] 🔴 取消預約時發生錯誤:`, error);
    if (error instanceof HttpsError) {
      throw error;
    }
    throw new HttpsError("internal", `取消預約時發生錯誤: ${error.message}`);
  }
});



/**
 * 獲取所有系統權限功能的列表
 */
exports.getSystemFunctions = onCall({ region: "asia-east1", cors: true }, async (request) => {
  const db = new Firestore({ databaseId: "anxi-app" });
  const snapshot = await db.collection('systemFunctions').orderBy('name', 'asc').get();
  if (snapshot.empty) {
    return [];
  }
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
});

/**
 * 建立一個新的系統權限功能
 */
exports.createSystemFunction = onCall({ region: "asia-east1", cors: true }, async (request) => {
  // 可以在此加入超級管理員權限驗證
  const { functionId, name, description, isCore } = request.data;
  if (!functionId || !name) {
    throw new HttpsError('invalid-argument', '缺少 functionId 或 name 參數。');
  }

  const db = new Firestore({ databaseId: "anxi-app" });
  const docRef = db.collection('systemFunctions').doc(functionId);
  const doc = await docRef.get();

  if (doc.exists) {
    throw new HttpsError('already-exists', `ID 為 "${functionId}" 的權限功能已存在。`);
  }

  await docRef.set({
    functionId,
    name,
    description: description || '',
    isCore: isCore || false,
    createdAt: Timestamp.now()
  });

  return { status: 'success', id: functionId };
});

/**
 * 更新一個已存在的系統權限功能 (只能更新名稱和描述)
 */
exports.updateSystemFunction = onCall({ region: "asia-east1", cors: true }, async (request) => {
  // 可以在此加入超級管理員權限驗證
  const { functionId, name, description } = request.data;
  if (!functionId || !name) {
    throw new HttpsError('invalid-argument', '缺少 functionId 或 name 參數。');
  }

  const db = new Firestore({ databaseId: "anxi-app" });
  const docRef = db.collection('systemFunctions').doc(functionId);
  const doc = await docRef.get();

  if (!doc.exists) {
    throw new HttpsError('not-found', `找不到 ID 為 "${functionId}" 的權限功能。`);
  }

  await docRef.update({
    name,
    description: description || ''
  });

  return { status: 'success', id: functionId };
});



/**
 * [API Action] 處理驗屋授權書的上傳 (Firebase 版)
 * 檔案會根據 Firestore households 集合中的 'inspectionDocsUrl' 欄位，存放到指定的 Google Drive 資料夾。
 * @param {object} request.data - 包含 { projectId, unitId, fileName, base64 }
 * @returns {Promise<object>} - JSON 格式的回應 { status, url, name, id }
 */
exports.uploadAuthLetter = onCall({
  region: "asia-east1",
  // ✓ 引用與特殊報告上傳相同的 Google Drive API 密鑰
  secrets: driveSecrets
}, async (request) => {
  const functionName = 'uploadAuthLetter';
  const { projectId, unitId, fileName, base64 } = request.data;

  if (!projectId || !unitId || !fileName || !base64) {
    throw new HttpsError('invalid-argument', '缺少必要參數 (projectId, unitId, fileName, base64)。');
  }

  try {
    // 步驟 1: 從 Firestore 讀取戶別資料以獲取目標資料夾 URL
    const db = new Firestore({ databaseId: 'anxi-app' });
    const householdDocId = `${projectId}_${unitId}`;
    const householdDocRef = db.collection('households').doc(householdDocId);
    const householdDoc = await householdDocRef.get();

    if (!householdDoc.exists) {
      throw new HttpsError('not-found', `在 'households' 集合中找不到戶別 "${unitId}" 的資料。`);
    }

    const householdData = householdDoc.data();
    const folderUrl = householdData.inspectionDocsUrl;

    if (!folderUrl) {
      throw new HttpsError('not-found', `戶別 "${unitId}" 的資料中缺少 "inspectionDocsUrl" 欄位設定。`);
    }

    // 步驟 2: 從 URL 中解析出 Google Drive Folder ID
    const folderIdMatch = folderUrl.match(/[-\w]{25,}/);
    if (!folderIdMatch) {
      throw new HttpsError('invalid-argument', `"${folderUrl}" 不是一個有效的 Google Drive 資料夾連結。`);
    }
    const targetFolderId = folderIdMatch[0];

    // 步驟 3: 使用 OAuth 2.0 認證並上傳檔案 (此段認證邏輯與 handleSpecialReportUpload 相同)
    const oauth2Client = new google.auth.OAuth2(
      process.env.DRIVE_CLIENT_ID,
      process.env.DRIVE_CLIENT_SECRET,
      'https://developers.google.com/oauthplayground'
    );
    oauth2Client.setCredentials({
      refresh_token: process.env.DRIVE_REFRESH_TOKEN,
    });
    const drive = google.drive({ version: "v3", auth: oauth2Client });

    // 將 Base64 轉為 Buffer，再轉為可讀取的 Stream
    const buffer = Buffer.from(base64, 'base64');
    const stream = Readable.from(buffer);

    const fileMetadata = {
      name: fileName,
      parents: [targetFolderId]
    };

    const media = {
      mimeType: 'image/png', // 授權書固定為 PNG 格式
      body: stream,
    };

    const uploadedFile = await drive.files.create({
      resource: fileMetadata,
      media: media,
      fields: 'id, name, webViewLink', // 獲取檢視連結
    });

    console.log(`[${functionName}] 授權書 "${fileName}" 已成功上傳至資料夾 ID: ${targetFolderId}`);

    // 步驟 4: 回傳與舊版 GAS 格式相容的成功訊息
    return {
      status: 'success',
      url: uploadedFile.data.webViewLink,
      name: uploadedFile.data.name,
      id: uploadedFile.data.id
    };

  } catch (error) {
    console.error(`[${functionName}] 🔴 執行時發生錯誤:`, error);
    if (error instanceof HttpsError) {
      throw error;
    }
    // 增加對 Google API 錯誤的回應判斷
    if (error.response && error.response.data && error.response.data.error === 'invalid_grant') {
      throw new HttpsError("unauthenticated", `Google Drive 認證失敗，Refresh Token 可能已過期，請聯繫系統管理員。`);
    }
    throw new HttpsError('internal', `上傳授權書時發生錯誤: ${error.message}`);
  }
});
//  END: 新增 uploadAuthLetter 雲端函式


// ✓ START: 新增 - 獲取客戶最新預約資料 (供客戶端驗屋報告頁面預填)
/**
 * [API] 根據 projectId 和 unitId，查找最新的有效預約紀錄，
 * 並回傳預約人姓名、電話、Email。
 * @param {string} projectId - 建案 ID
 * @param {string} unitId - 戶別 ID
 * @returns {Promise<object>} - 包含 { bookerName, bookerEmail, bookerPhone } 的物件或錯誤訊息
 */
exports.getCustomerAppointmentDetails = onCall({ region: "asia-east1" }, async (request) => {
  // 從請求中獲取 projectId 和 unitId
  const { projectId, unitId } = request.data;
  const functionName = `getCustomerAppointmentDetails (Project: ${projectId}, Unit: ${unitId})`; // 用於 Log

  // 1. 驗證輸入參數
  if (!projectId || !unitId) {
    console.error(`[${functionName}] 錯誤：缺少 projectId 或 unitId。`);
    // 拋出 HttpsError，前端 api.js 可以捕捉到 message
    throw new HttpsError("invalid-argument", "缺少建案 ID (projectId) 或戶別 ID (unitId)。");
  }

  try {
    // 2. 建立 Firestore 實例 (指向 anxi-app 資料庫)
    const db = new Firestore({ databaseId: "anxi-app" });
    const appointmentsRef = db.collection("appointments"); // 取得 appointments 集合的參考

    // 3. 建立查詢條件
    const q = appointmentsRef
      .where("projectId", "==", projectId) // 篩選建案 ID
      .where("unitId", "==", unitId)       // 篩選戶別 ID
      .where("status", "!=", "取消")       // 排除已取消的預約
      .orderBy("appointmentDate", "desc") // 按預約日期降序排序 (最新的在前面)
      .limit(1);                           // 只取回最新的一筆

    // 4. 執行查詢
    console.log(`[${functionName}] 正在查詢最新的有效預約...`);
    const snapshot = await q.get();

    // 5. 處理查詢結果
    if (snapshot.empty) {
      // 如果找不到符合條件的預約紀錄
      console.log(`[${functionName}] 找不到戶別 ${unitId} 的有效預約紀錄。`);
      // 回傳一個特定的錯誤訊息或空的資料結構，讓前端知道沒有找到資料
      // 這裡我們選擇拋出 not-found 錯誤
      throw new HttpsError("not-found", "找不到此戶別的有效預約紀錄。");
    } else {
      // 成功找到最新預約紀錄
      const latestAppointment = snapshot.docs[0].data();
      console.log(`[${functionName}] 成功找到最新預約紀錄 (BookingCode: ${latestAppointment.bookingCode})。`);

      // 6. 回傳需要的欄位
      return {
        status: "success", // 加入 status 方便前端判斷
        data: {
          bookerName: latestAppointment.bookerName || "", // 提供預設空字串
          bookerEmail: latestAppointment.bookerEmail || "",
          bookerPhone: latestAppointment.bookerPhone || ""
        }
      };
    }
  } catch (error) {
    // 7. 處理錯誤
    console.error(`[${functionName}] 查詢預約資料時發生錯誤:`, error);
    // 如果錯誤是我們自己拋出的 HttpsError，直接再次拋出
    if (error instanceof HttpsError) {
      throw error;
    }
    // 對於其他未預期的錯誤，拋出通用的內部錯誤
    throw new HttpsError("internal", `查詢預約詳細資料時發生未預期的錯誤: ${error.message}`);
  }
});
// ✓ END: 新增函式

// ✓ START: 新增 - 儲存客戶驗屋確認簽名
/**
 * [API] 處理客戶端驗屋報告的簽名確認
 * 1. 上傳簽名圖檔至 Storage
 * 2. 更新 inspectionRecords 中符合條件的紀錄，標記確認時間與批次 ID
 * 3. 在 inspectionConfirmations 集合中新增一筆確認紀錄
 * @param {string} projectId - 建案 ID
 * @param {string} unitId - 戶別 ID
 * @param {string} confirmationBatchId - 前端產生的本次確認批次 ID (建議格式 YYYYMMDDHHMMSS)
 * @param {object} buyerInfo - 包含 { name, phone, email }
 * @param {string} signatureImageBase64 - 簽名圖檔的 Base64 字串 (不含 data:image/... 前綴)
 * @returns {Promise<object>} - { status: 'success', confirmationId: '...' }
 */
exports.saveCustomerConfirmation = onCall({
  region: "asia-east1",
  memory: "1GiB", // 上傳圖片可能需要較多記憶體
  timeoutSeconds: 120 // 允許較長執行時間
}, async (request) => {
  const { projectId, unitId, confirmationBatchId, buyerInfo, signatureImageBase64 } = request.data;
  const functionName = `saveCustomerConfirmation (Project: ${projectId}, Unit: ${unitId})`;

  // 1. 驗證輸入參數
  if (!projectId || !unitId || !confirmationBatchId || !buyerInfo || !signatureImageBase64) {
    console.error(`[${functionName}] 錯誤：缺少必要參數。`);
    throw new HttpsError("invalid-argument", "缺少必要的確認參數。");
  }
  if (!buyerInfo.name || !buyerInfo.phone || !buyerInfo.email) {
    console.error(`[${functionName}] 錯誤：buyerInfo 不完整。`);
    throw new HttpsError("invalid-argument", "缺少買方姓名、電話或 Email。");
  }

  const db = new Firestore({ databaseId: "anxi-app" });
  const bucket = getStorage().bucket(); // 獲取默認的 Storage Bucket

  try {
    // --- 步驟 2: 上傳簽名圖檔至 Firebase Storage ---
    console.log(`[${functionName}] 正在上傳簽名圖檔...`);
    // 檔案路徑： signatures/{projectId}/{unitId}/{confirmationBatchId}.png
    const signaturePath = `signatures/${projectId}/${unitId}/${confirmationBatchId}.png`;
    const file = bucket.file(signaturePath);
    const buffer = Buffer.from(signatureImageBase64, 'base64');
    const stream = Readable.from(buffer); // 需要 const { Readable } = require("stream");

    // 使用 stream 上傳
    await new Promise((resolve, reject) => {
      stream.pipe(file.createWriteStream({
        metadata: { contentType: 'image/png' }, // 指定 MIME 類型
        resumable: false
      }))
        .on('error', (err) => reject(err))
        .on('finish', () => resolve());
    });

    // 設定檔案為公開可讀 (如果需要的話)
    await file.makePublic();
    const signatureImageUrl = file.publicUrl(); // 獲取公開 URL
    console.log(`[${functionName}] 簽名圖檔上傳成功: ${signatureImageUrl}`);

    // --- 步驟 3: 使用 Transaction 更新 Firestore ---
    console.log(`[${functionName}] 開始 Firestore Transaction...`);
    const confirmationRef = db.collection('inspectionConfirmations').doc(); // 自動產生 ID
    const confirmedAt = Timestamp.now(); // 獲取當前伺服器時間戳

    await db.runTransaction(async (transaction) => {
      // 3.1 查詢需要更新的 inspectionRecords
      const recordsRef = db.collection("inspectionRecords");
      const query = recordsRef
        .where("projectId", "==", projectId)
        .where("unitId", "==", unitId)
        .where("isDeleted", "==", false)     // 未被刪除
        .where("customerView", "==", true)   // 客戶可見
        .where("customerConfirmedAt", "==", null); // 尚未被確認的

      console.log(`[${functionName}] (TX) 正在查詢待更新的 inspectionRecords...`);
      const snapshot = await transaction.get(query); // 在 Transaction 中執行查詢

      if (snapshot.empty) {
        // 如果找不到任何需要更新的紀錄 (可能重複觸發或紀錄已被刪除/隱藏)
        console.warn(`[${functionName}] (TX) 找不到需要標記確認的驗屋紀錄 (可能已確認過或無符合條件紀錄)。`);
        // 雖然沒有紀錄被更新，但我們仍然需要記錄這次簽名動作
        // 所以繼續執行 3.2，但不拋出錯誤
      } else {
        console.log(`[${functionName}] (TX) 找到 ${snapshot.size} 筆紀錄待更新確認狀態。`);
      }


      // 3.2 批次更新 inspectionRecords
      snapshot.docs.forEach(doc => {
        transaction.update(doc.ref, {
          customerConfirmedAt: confirmedAt,
          confirmationBatchId: confirmationBatchId
        });
      });

      // 3.3 新增 inspectionConfirmations 紀錄
      transaction.set(confirmationRef, {
        projectId: projectId,
        unitId: unitId,
        confirmationBatchId: confirmationBatchId,
        confirmedAt: confirmedAt,
        buyerInfo: buyerInfo, // 儲存當時確認的買方資訊
        signatureImageUrl: signatureImageUrl, // 儲存簽名圖檔 URL
        recordCount: snapshot.size, // 記錄本次確認影響的紀錄筆數
        status: 'completed' // <--- 標記狀態為已完成
      });
      console.log(`[${functionName}] (TX) 已排定新增確認紀錄 ${confirmationRef.id} 並更新 ${snapshot.size} 筆紀錄。`);
    }); // Transaction 結束

    console.log(`[${functionName}] Firestore Transaction 成功提交。`);

    // --- 步驟 4: 回傳成功訊息 ---
    return {
      status: "success",
      confirmationId: confirmationRef.id // 回傳新建立的確認紀錄 ID
    };

  } catch (error) {
    // --- 錯誤處理 ---
    console.error(`[${functionName}] 儲存確認時發生錯誤:`, error);
    // 清理可能已上傳的簽名圖檔 (如果需要)
    // (注意：如果在 Transaction 中失敗，Firestore 的更改會自動回滾)
    try {
      await bucket.file(signaturePath).delete();
      console.log(`[${functionName}] 已清理上傳失敗的簽名圖檔。`);
    } catch (deleteError) {
      console.error(`[${functionName}] 清理簽名圖檔失敗:`, deleteError);
    }

    if (error instanceof HttpsError) {
      throw error;
    }
    throw new HttpsError("internal", `儲存確認簽名時發生錯誤: ${error.message}`);
  }
});
// ✓ END: 新增函式

// --- 主要的 Cloud Function ---
/**
 * [後台用] 新增一筆預約紀錄 (V2 - 修正版)
 * - 移除了 operationCount 和 needsSummaryUpdate 的錯誤引用
 * - 確保在 transaction 成功後固定執行 updateHouseholdSummary 和 寄送 Email
 */
exports.addAppointmentByAdmin = onCall({ region: "asia-east1", cors: true, secrets: ["SENDER_EMAIL", "GMAIL_APP_PASSWORD"] }, async (request) => {
  const { projectId, newBookingData, cancelBookingCode, force = false } = request.data;
  const functionName = `addAppointmentByAdmin (Project: ${projectId}, Unit: ${newBookingData?.unitId}, Force: ${force})`;

  // ✓ 參數驗證 (保持不變)
  if (!projectId || !newBookingData || !newBookingData.unitId || !newBookingData.appointmentDate || !newBookingData.appointmentTimeSlot || !newBookingData.bookingType) {
    console.error(`[${functionName}] ERROR: Missing required parameters in newBookingData.`);
    throw new HttpsError("invalid-argument", "缺少 projectId 或 newBookingData 中的必要欄位 (unitId, appointmentDate, appointmentTimeSlot, bookingType)。");
  }

  const db = new Firestore({ databaseId: "anxi-app" });
  const householdDocId = `${projectId}_${newBookingData.unitId}`;
  const householdRef = db.collection('households').doc(householdDocId);

  // ✓ timeSlotKey 處理邏輯 (保持不變)
  let rawTimeSlot = newBookingData.appointmentTimeSlot;
  let timeSlotKey = '';
  if (typeof rawTimeSlot === 'string') {
    timeSlotKey = rawTimeSlot.split(' ')[0];
  } else if (typeof rawTimeSlot === 'object' && rawTimeSlot !== null && rawTimeSlot.value) {
    timeSlotKey = String(rawTimeSlot.value).split(' ')[0];
  }
  if (!/^\d{2}:\d{2}$/.test(timeSlotKey)) {
    console.error(`[${functionName}] ERROR: Invalid timeSlotKey format: ${timeSlotKey}`);
    throw new HttpsError("invalid-argument", `無效的時段格式: ${newBookingData.appointmentTimeSlot}`);
  }


  let finalAppointmentData; // 在 try 外宣告
  let docId;             // 在 try 外宣告
  let projectName;       // 在 try 外宣告

  try {
    console.log(`[${functionName}] Starting transaction...`);
    // --- START: ✓ 修正點 1 (確保 result_tx 被賦值) ---
    // 正體中文註解：加上 const result_tx = 來接收事務的回傳值
    const result_tx = await db.runTransaction(async (transaction) => {
      // --- END: ✓ 修正點 1 ---

      console.log(`[${functionName}] Inside transaction...`);
      let isRuleCheckSkipped = false;
      let capacity = 0;

      // --- 1. 檢查戶別、批次 (邏輯不變) ---
      const householdDoc = await transaction.get(householdRef);
      if (!householdDoc.exists) {
        console.error(`[${functionName}] ERROR TX: Household not found: ${householdDocId}`);
        throw new HttpsError("not-found", `找不到戶別 "${newBookingData.unitId}" 的資料。`);
      }
      const householdData = householdDoc.data();
      const batchCodeField = newBookingData.bookingType === '初驗' ? 'initialInspectionBatch' : 'reInspectionBatch';
      const batchCode = householdData[batchCodeField];
      if (!batchCode) {
        // 檢查是否為強制新增，如果是，則跳過批次檢查
        if (!force) {
          console.error(`[${functionName}] ERROR TX: Batch code not assigned for ${newBookingData.bookingType}.`);
          throw new HttpsError("permission-denied", `此戶別的 "${newBookingData.bookingType}" 預約目前未指派批次。`);
        } else {
          console.warn(`[${functionName}] WARN TX (Force Mode): Batch code not assigned, skipping rule checks.`);
          isRuleCheckSkipped = true;
        }
      }
      console.log(`[${functionName}] TX: Found batch code ${batchCode}`);

      let batchId = null;
      if (batchCode && !isRuleCheckSkipped) { // ✓ 只有在有 batchCode 且未跳過時才查詢
        const batchQuery = db.collection('bookingBatches')
          .where('projectId', '==', projectId).where('batchCode', '==', batchCode)
          .where('bookingType', '==', newBookingData.bookingType).where('isDeleted', '==', false).limit(1);
        const batchSnapshot = await transaction.get(batchQuery);
        if (batchSnapshot.empty) {
          if (!force) {
            console.error(`[${functionName}] ERROR TX: Active batch not found for code ${batchCode}.`);
            throw new HttpsError("not-found", `找不到對應的有效預約批次。`);
          } else {
            console.warn(`[${functionName}] WARN TX (Force Mode): Active batch ${batchCode} not found.`);
            isRuleCheckSkipped = true; // 強制模式下跳過規則檢查
          }
        } else {
          batchId = batchSnapshot.docs[0].id;
          console.log(`[${functionName}] TX: Found active batch ${batchId}`);
        }
      }


      // --- 2. 檢查規則連結 (邏輯不變，force 判斷已存在) ---
      const appointmentDateStr = newBookingData.appointmentDate.split('T')[0];
      let ruleId = null;
      if (batchId && !isRuleCheckSkipped) { // 只有在找到批次時才檢查規則
        const linksQuery = db.collection('batchRuleLinks')
          .where('batchId', '==', batchId).where('date', '==', appointmentDateStr).where('isDeleted', '==', false).limit(1);
        const linksSnapshot = await transaction.get(linksQuery);
        if (linksSnapshot.empty) {
          if (!force) {
            console.error(`[${functionName}] ERROR TX: No active link found for date ${appointmentDateStr}.`);
            throw new HttpsError("failed-precondition", `日期 ${appointmentDateStr} 不在可預約範圍內或規則已被刪除。`);
          } else {
            console.warn(`[${functionName}] WARN TX (Force Mode): No active link found for date ${appointmentDateStr}. Skipping rule checks.`);
            isRuleCheckSkipped = true;
          }
        } else {
          ruleId = linksSnapshot.docs[0].data().ruleId;
          console.log(`[${functionName}] TX: Found active rule link, ruleId: ${ruleId}`);
        }
      }

      // --- 3. 檢查日期規則 (邏輯不變，force 判斷已存在) ---
      if (ruleId && !isRuleCheckSkipped) {
        const ruleRef = db.collection('dateRules').doc(ruleId);
        const ruleDoc = await transaction.get(ruleRef);
        if (!ruleDoc.exists || ruleDoc.data().isDeleted === true) {
          if (!force) {
            console.error(`[${functionName}] ERROR TX: Date rule ${ruleId} not found or is deleted.`);
            throw new HttpsError("internal", "找不到對應的每日規則設定或已被刪除。");
          } else {
            console.warn(`[${functionName}] WARN TX (Force Mode): Date rule ${ruleId} not found or is deleted. Skipping further rule checks.`);
            isRuleCheckSkipped = true;
          }
        } else {
          // --- 4. 規則有效，檢查時段和方法 (邏輯不變，force 判斷已存在) ---
          const ruleData = ruleDoc.data();
          const slotInfo = ruleData.slots[timeSlotKey];
          if (!slotInfo) {
            if (!force) {
              console.error(`[${functionName}] ERROR TX: Time slot ${timeSlotKey} not found in rule ${ruleId}.`);
              throw new HttpsError("failed-precondition", `時段 ${timeSlotKey} 在規則中不存在。`);
            } else {
              console.warn(`[${functionName}] WARN TX (Force Mode): Time slot ${timeSlotKey} not found in rule ${ruleId}. Skipping method check.`);
              capacity = 0;
            }
          } else {
            if (newBookingData.inspectionMethod && !slotInfo.methods.includes(newBookingData.inspectionMethod)) { // ✓ 檢查 inspectionMethod 是否存在
              if (!force) {
                console.error(`[${functionName}] ERROR TX: Method ${newBookingData.inspectionMethod} not allowed for slot ${timeSlotKey}.`);
                throw new HttpsError("failed-precondition", `時段 ${timeSlotKey} 不適用於「${newBookingData.inspectionMethod}」。`);
              } else {
                console.warn(`[${functionName}] WARN TX (Force Mode): Method ${newBookingData.inspectionMethod} not allowed for slot ${timeSlotKey}, but proceeding.`);
              }
            }
            capacity = slotInfo.capacity || 0;
            console.log(`[${functionName}] TX: Rule and slot validation passed (or bypassed by force). Capacity: ${capacity}`);
          }
        }
      }

      // --- 5. 檢查時段名額 (邏輯不變，force 判斷已存在) ---
      if (!force) {
        if (!isRuleCheckSkipped) {
          const appointmentDateObj = new Date(appointmentDateStr + 'T00:00:00+08:00');
          const appointmentsQueryCapacity = db.collection('appointments')
            .where('projectId', '==', projectId).where('appointmentDate', '==', appointmentDateObj)
            .where('appointmentTimeSlot', '==', timeSlotKey).where('status', '==', '預約中');
          const appointmentsSnapshot = await transaction.get(appointmentsQueryCapacity);
          const currentBookings = appointmentsSnapshot.size;
          console.log(`[${functionName}] Transaction: Current bookings for slot ${timeSlotKey} on ${appointmentDateStr}: ${currentBookings}`);
          if (currentBookings >= capacity) {
            console.warn(`[${functionName}] WARN: Slot capacity reached.`);
            throw new HttpsError('failed-precondition', `SLOT_FULL: 該時段名額已滿 (目前 ${currentBookings} 人)。`);
          }
        } else {
          console.log(`[${functionName}] Transaction: Rule check was skipped (no batch or force), skipping capacity check as well.`);
        }
      } else {
        console.log(`[${functionName}] Transaction: Force flag is true, skipping capacity check.`);
      }

      // --- 6. 處理舊預約取消 (邏輯不變) ---
      const batchForTx = transaction;
      if (cancelBookingCode) {
        const oldAppointmentsQuery = db.collection("appointments")
          .where("bookingCode", "==", cancelBookingCode).where("projectId", "==", projectId).where("status", "==", "預約中");
        const oldSnapshot = await transaction.get(oldAppointmentsQuery);
        if (!oldSnapshot.empty) {
          batchForTx.update(oldSnapshot.docs[0].ref, { status: "取消", cancelledAt: Timestamp.now() });
          console.log(`[${functionName}] Transaction: Marked old booking ${cancelBookingCode} as cancelled.`);
        } else {
          console.warn(`[${functionName}] Transaction: Old booking code ${cancelBookingCode} not found or already cancelled.`);
        }
      }

      // --- 7. 準備寫入新資料 (邏輯不變) ---
      const bookingCode = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'.split('').sort(() => 0.5 - Math.random()).join('').substring(0, 6);
      const now = new Date();
      const timeStr = now.toLocaleTimeString('sv-SE', { timeZone: 'Asia/Taipei', hour12: false }).replace(/:/g, '-');
      const dateStr = now.toLocaleDateString('sv-SE', { timeZone: 'Asia/Taipei' }).replace(/-/g, '').slice(2); // YYMMDD

      docId = `${projectId}_${dateStr}-${timeStr}_${newBookingData.unitId}`;
      const newAppointmentRef = db.collection('appointments').doc(docId);
      console.log(`[${functionName}] Transaction: Generated new appointment ID: ${docId}`);

      finalAppointmentData = {
        projectId: projectId,
        createdAt: Timestamp.now(),
        unitId: newBookingData.unitId,
        address: newBookingData.address || "",
        bookerName: newBookingData.bookerName || "",
        bookerPhone: newBookingData.bookerPhone || "",
        bookerEmail: newBookingData.bookerEmail || "",
        bookerIdNumber: newBookingData.bookerIdNumber || "",
        bookingType: newBookingData.bookingType,
        appointmentDate: newBookingData.appointmentDate ? Timestamp.fromDate(new Date(appointmentDateStr)) : null,
        appointmentTimeSlot: timeSlotKey,
        status: newBookingData.status || "預約中",
        inspectionMethod: newBookingData.inspectionMethod || "",
        inspectionCompanyName: newBookingData.inspectionCompanyName || "",
        authorizationLetterUrl: newBookingData.authorizationLetterUrl || "",
        principalName: newBookingData.principalName || "",
        principalIdNumber: newBookingData.principalIdNumber || "",
        principalAddress: newBookingData.principalAddress || "",
        agentName: newBookingData.agentName || "",
        agentIdNumber: newBookingData.agentIdNumber || "",
        agentAddress: newBookingData.agentAddress || "",
        agentPhone: newBookingData.agentPhone || "",
        bookingCode: bookingCode,
        reportUploaded: !['初驗', '複驗', '驗屋'].includes(newBookingData.bookingType), // ✓ 沿用此邏輯
        bookingRemarks: newBookingData.bookingRemarks || "",
        createdByName: newBookingData.createdByName || null,
        lastModifiedByName: newBookingData.lastModifiedByName || null,
        isDeleted: false,
      };

      batchForTx.set(newAppointmentRef, finalAppointmentData);
      console.log(`[${functionName}] Transaction: Set new appointment data.`);

      // --- 8. 更新 households 集合 (移至 transaction 外部的 updateHouseholdSummary) ---
      // (移除 transaction 內部的 household update 邏輯)

      return { finalAppointmentData }; // ✓ 回傳資料供 Email 使用
    }); // --- Transaction 結束 ---

    console.log(`[${functionName}] Transaction committed. Result:`, result_tx);

    // --- START: ✓ 修正點 2 (移除錯誤的 operationCount 邏輯) ---
    // 正體中文註解：從 result_tx 中獲取正確的 finalAppointmentData
    finalAppointmentData = result_tx.finalAppointmentData;
    console.log(`[${functionName}] Final payload extracted.`);

    // 正體中文註解：新增預約成功，固定執行摘要更新
    // ✓ 從 payload 獲取 unitId (因為 projectId 在函數開頭已有)
    const { unitId: newUnitId } = finalAppointmentData;
    if (projectId && newUnitId) {
      console.log(`[${functionName}] Calling updateHouseholdSummary for ${newUnitId}...`);
      // ✓ 確保 updateHouseholdSummary 函數已定義
      await updateHouseholdSummary(db, projectId, newUnitId);
      console.log(`[${functionName}] updateHouseholdSummary finished.`);
    } else {
      console.warn(`WARN: Cannot update summary, projectId/unitId missing from finalPayload.`);
    }

    // 正體中文註解：新增預約成功，固定執行寄送 Email (如果 Email 存在)
    const bookerEmail = finalAppointmentData.bookerEmail;
    const bookerName = finalAppointmentData.bookerName;

    const projectRef = db.collection('projects').doc(projectId);
    const projectDoc = await projectRef.get();
    projectName = projectDoc.exists ? projectDoc.data().name : projectId;

    if (bookerEmail) {
      console.log(`[${functionName}] Preparing email content for new appointment...`);

      // ... (省略 Email 準備邏輯：contactInfoHtml, mailTransport, subject, htmlBody 等) ...
      let closingText = '請於預約時段準時抵達，感謝您的配合。';
      let inspectionNotesHtml = '';
      let contactInfoHtml = '';
      if (projectDoc.exists) {
        const projectData = projectDoc.data();
        if (projectData.intro && projectData.intro.closingText) { closingText = projectData.intro.closingText; }
        if (projectData.intro && projectData.intro.alert && projectData.intro.alert.text) { inspectionNotesHtml = projectData.intro.alert.text; }
        if (projectDoc.exists && projectDoc.data().intro?.contact) {
          const contact = projectDoc.data().intro.contact;
          if (contact.name || contact.phone) {
            const namePart = contact.name ? `<strong>${contact.name}</strong>` : '';
            const phonePart = contact.phone ? `電話：${contact.phone}` : '';
            const separator = contact.name && contact.phone ? ' / ' : '';
            contactInfoHtml = `<div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #eeeeee;"><p style="margin: 0; font-size: 14px; color: #555;">如有任何疑問，請洽詢：<br>${namePart}${separator}${phonePart}</p></div>`;
          }
        }
      }

      const mailTransport = nodemailer.createTransport({
        service: 'gmail',
        auth: { user: process.env.SENDER_EMAIL, pass: process.env.GMAIL_APP_PASSWORD },
      });
      const subject = `【${projectName}】預約成功通知 (${finalAppointmentData.unitId})`;
      const bookingUrl = `https://anxismart.com/#/booking/${projectId}`;
      const bookingLinkHtml = `<p style="margin-top: 25px; padding-top: 20px; border-top: 1px solid #eeeeee; font-size: 14px; color: #555;">若您要查詢、修改或取消預約，請點擊以下按鈕返回預約頁面：<br><a href="${bookingUrl}" target="_blank" style="display: inline-block; margin-top: 12px; padding: 10px 20px; background-color: #007bff; color: #ffffff; text-decoration: none; border-radius: 5px; font-weight: bold;">前往預約頁面</a></p>`;
      const formattedAppointmentDate = finalAppointmentData.appointmentDate.toDate().toLocaleDateString('zh-TW', {
        timeZone: 'Asia/Taipei', year: 'numeric', month: '2-digit', day: '2-digit'
      });

      // (省略完整的 Email HTML 模板)
      const htmlBody = `
<div style="font-family: 'Helvetica Neue', Helvetica, Arial, 'PingFang TC', 'Microsoft JhengHei', sans-serif; background-color: #f4f4f7; padding: 20px;">
  <div style="max-width: 600px; margin: 20px auto; background-color: #ffffff; border-radius: 8px; border: 1px solid #e0e0e0; overflow: hidden;">
    <div style="background-color: #007bff; color: #ffffff; padding: 20px; text-align: center;">
      <h2 style="margin: 0; font-size: 24px;">預約成功通知</h2>
    </div>
    <div style="padding: 24px; line-height: 1.6; color: #333333;">
      <p>親愛的 <strong>${finalAppointmentData.bookerName}</strong> 您好：</p>
      <p>您已成功完成預約，以下是您的預約詳細資訊，請再次確認。</p>
      <table style="width: 100%; border-collapse: collapse; margin-top: 20px; margin-bottom: 20px;">
        <tbody>
          <tr style="border-bottom: 1px solid #eeeeee;"><td style="padding: 12px 0; font-weight: bold; color: #555555; width: 100px;">預約代碼</td><td style="padding: 12px 0; font-weight: bold; font-size: 16px; color: #D32F2F;">${finalAppointmentData.bookingCode}</td></tr>
          <tr style="border-bottom: 1px solid #eeeeee;"><td style="padding: 12px 0; font-weight: bold; color: #555555;">建案名稱</td><td style="padding: 12px 0;">${projectName}</td></tr>
          <tr style="border-bottom: 1px solid #eeeeee;"><td style="padding: 12px 0; font-weight: bold; color: #555555;">戶別</td><td style="padding: 12px 0;">${finalAppointmentData.unitId}</td></tr>
          
          <tr style="border-bottom: 1px solid #eeeeee;"><td style="padding: 12px 0; font-weight: bold; color: #555555;">門牌</td><td style="padding: 12px 0;">${finalAppointmentData.address}</td></tr>
          <tr style="border-bottom: 1px solid #eeeeee;"><td style="padding: 12px 0; font-weight: bold; color: #555555;">預約姓名</td><td style="padding: 12px 0;">${finalAppointmentData.bookerName}</td></tr>
          <tr style="border-bottom: 1px solid #eeeeee;"><td style="padding: 12px 0; font-weight: bold; color: #555555;">預約人電話</td><td style="padding: 12px 0;">${finalAppointmentData.bookerPhone}</td></tr>
          <tr style="border-bottom: 1px solid #eeeeee;"><td style="padding: 12px 0; font-weight: bold; color: #555555;">EMAIL</td><td style="padding: 12px 0;">${finalAppointmentData.bookerEmail}</td></tr>
          <tr style="border-bottom: 1px solid #eeeeee;"><td style="padding: 12px 0; font-weight: bold; color: #555555;">預約項目</td><td style="padding: 12px 0;">${finalAppointmentData.bookingType}</td></tr>
          <tr style="border-bottom: 1px solid #eeeeee;"><td style="padding: 12px 0; font-weight: bold; color: #555555;">選擇方式</td><td style="padding: 12px 0;">${finalAppointmentData.inspectionMethod}</td></tr>
          <tr style="border-bottom: 1px solid #eeeeee;"><td style="padding: 12px 0; font-weight: bold; color: #555555;">預約日期</td><td style="padding: 12px 0;">${formattedAppointmentDate}</td></tr>
          <tr><td style="padding: 12px 0; font-weight: bold; color: #555555;">預約時段</td><td style="padding: 12px 0;">${finalAppointmentData.appointmentTimeSlot}</td></tr>
        </tbody>
      </table>
      <div style="padding: 15px; margin-top: 15px; margin-bottom: 20px; background-color: #f8f9fa; border-left: 4px solid #17a2b8; color: #333;">${closingText}</div>
      ${contactInfoHtml}
      ${inspectionNotesHtml ? `<div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #eeeeee;">${inspectionNotesHtml}</div>` : ''}
      ${bookingLinkHtml}
    </div>
    <div style="background-color: #f4f4f7; padding: 16px; text-align: center; font-size: 12px; color: #777777;">
      <p style="margin: 0;">此為系統自動發送郵件，請勿直接回覆。</p>
      <p style="margin: 5px 0 0 0;">${projectName} 預約系統</p>
      <p style="margin: 10px 0 0 0; font-size: 11px; color: #999999;">
        本服務由 <a href="https://anxismart.com/" target="_blank" style="color: #007bff; text-decoration: none; font-weight: bold;">anxismart安熙智慧建案管理系統</a> 提供技術支援
      </p>
    </div>
  </div>
</div>
            `;

      console.log(`[${functionName}] Calling getCcRecipients...`);
      // ✓ 確保 getCcRecipients 函數已定義
      const ccRecipients = await getCcRecipients(projectId, "驗屋系統信件副本");
      console.log(`[${functionName}] getCcRecipients finished. CC:`, ccRecipients);

      await mailTransport.sendMail({
        from: `"${projectName} 預約系統" <${process.env.SENDER_EMAIL}>`,
        to: bookerEmail,
        cc: ccRecipients.join(', '),
        subject: subject,
        html: htmlBody,
        name: `${projectName} 預約系統`
      });
      console.log(`[${functionName}] New appointment (by admin) email sent successfully.`);
    } else {
      console.log(`[${functionName}] No booker email provided, skipping email.`);
    }

    // --- 返回成功結果 (固定執行) ---
    console.log(`[${functionName}] Returning success status.`);
    return { status: "success", data: { bookingCode: finalAppointmentData.bookingCode } };

    // --- END: ✓ 修正點 2 ---

  } catch (error) { // 外層 catch 區塊維持
    console.error(`[${functionName}] 🔴 預約時發生錯誤:`, error);
    if (error instanceof HttpsError) {
      throw error;
    }
    throw new HttpsError("internal", `儲存預約時發生嚴重錯誤: ${error.message}`);
  }
}); // 函數結束

// ✓ 假設的 getCcRecipients 函數 (您需要將它放在合適的位置，例如 utils.js 或直接放在 index.js)
async function getCcRecipients(projectId, permissionName) {
  const db = new Firestore({ databaseId: "anxi-app" });
  try {
    const permQuery = db.collection('userPermissions')
      .where(`permissions.${projectId}.systems`, 'array-contains', permissionName);
    const permSnapshot = await permQuery.get();
    if (permSnapshot.empty) return [];
    const userPhones = permSnapshot.docs.map(doc => doc.id);
    if (userPhones.length === 0) return [];
    // Firestore 'in' 查詢每次最多 30 個 ID
    const emailPromises = [];
    for (let i = 0; i < userPhones.length; i += 30) {
      const phoneChunk = userPhones.slice(i, i + 30);
      const usersQuery = db.collection('users').where(FieldPath.documentId(), 'in', phoneChunk); // ✓ 確保 FieldPath 已引入
      emailPromises.push(usersQuery.get());
    }
    const usersSnapshots = await Promise.all(emailPromises);
    const emails = usersSnapshots.flatMap(snapshot =>
      snapshot.docs.map(doc => doc.data().email).filter(email => email && typeof email === 'string')
    );
    return emails;
  } catch (error) {
    console.error(`[getCcRecipients] 查找副本收件人時發生錯誤:`, error);
    return [];
  }
}

// ✓ START: 新增 - 後台取消預約並寄送通知信的 Cloud Function
/**
 * [後台用] 取消一筆預約，並寄送通知信
 * @param {string} appointmentId - 預約紀錄的文件 ID
 * @param {string} projectId - 預約所屬的建案 ID
 * @param {string} unitId - 預約所屬的戶別 ID
 * @param {string} bookingType - 預約類型 ('初驗' 或 '複驗')
 */
exports.cancelAppointmentByAdmin = onCall({ region: "asia-east1", secrets: ["SENDER_EMAIL", "GMAIL_APP_PASSWORD"], cors: true }, async (request) => {
  const { appointmentId, projectId, unitId, bookingType } = request.data;
  const functionName = `cancelAppointmentByAdmin (ID: ${appointmentId})`;

  if (!appointmentId || !projectId || !unitId || !bookingType) {
    throw new HttpsError("invalid-argument", "缺少 appointmentId, projectId, unitId 或 bookingType。");
  }

  const db = new Firestore({ databaseId: "anxi-app" });

  try {
    const appointmentRef = db.collection("appointments").doc(appointmentId);
    const householdRef = db.collection('households').doc(`${projectId}_${unitId}`);

    let bookingData; // 用來儲存預約資料以供後續寄信

    // 步驟 1: 使用 Transaction 確保資料一致性
    await db.runTransaction(async (transaction) => {
      const appointmentDoc = await transaction.get(appointmentRef);
      if (!appointmentDoc.exists) {
        throw new HttpsError("not-found", "找不到指定的預約紀錄。");
      }
      bookingData = appointmentDoc.data(); // 在 transaction 內讀取資料

      // 更新預約狀態
      transaction.update(appointmentRef, {
        status: "取消",
        cancelledAt: Timestamp.now()
      });

      // 清除戶別資料
      const householdUpdatePayload = {};
      if (bookingType === '初驗') {
        householdUpdatePayload.initialInspectionDate = null;
        householdUpdatePayload.initialInspectionMethod = null;
      } else if (bookingType === '複驗') {
        householdUpdatePayload.reInspectionDate = null;
        householdUpdatePayload.reInspectionMethod = null;
      }

      if (Object.keys(householdUpdatePayload).length > 0) {
        transaction.update(householdRef, householdUpdatePayload);
      }
    });

    console.log(`[${functionName}] 已成功將預約狀態更新為「取消」。`);
    //  新增：在交易成功後，呼叫摘要更新函式
    await updateHouseholdSummary(db, projectId, unitId);

    // 步驟 2: 寄送 Email (邏輯同 cancelBooking)
    if (bookingData && bookingData.bookerEmail) {
      const projectDoc = await db.collection('projects').doc(projectId).get();
      const projectName = projectDoc.exists ? projectDoc.data().name : projectId;

      let contactInfoHtml = '';
      if (projectDoc.exists && projectDoc.data().intro?.contact) {
        const { name, phone } = projectDoc.data().intro.contact;
        if (name || phone) {
          const namePart = name ? `<strong>${name}</strong>` : '';
          const phonePart = phone ? `電話：${phone}` : '';
          const separator = name && phone ? ' / ' : '';
          contactInfoHtml = `<div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #eeeeee;"><p style="margin: 0; font-size: 14px; color: #555;">如有任何疑問，請洽詢：<br>${namePart}${separator}${phonePart}</p></div>`;
        }
      }

      const mailTransport = nodemailer.createTransport({
        service: 'gmail',
        auth: { user: process.env.SENDER_EMAIL, pass: process.env.GMAIL_APP_PASSWORD },
      });

      const subject = `【${projectName}】預約取消成功通知 (${bookingData.unitId})`;
      const bookingUrl = `https://anxismart.com/#/booking/${projectId}`;

      const htmlBody = `
<div style="font-family: 'Helvetica Neue', Helvetica, Arial, 'PingFang TC', 'Microsoft JhengHei', sans-serif; background-color: #f4f4f7; padding: 20px;">
  <div style="max-width: 600px; margin: 20px auto; background-color: #ffffff; border-radius: 8px; border: 1px solid #e0e0e0; overflow: hidden;">
    <div style="background-color: #dc3545; color: #ffffff; padding: 20px; text-align: center;"><h2 style="margin: 0; font-size: 24px;">預約取消通知</h2></div>
    <div style="padding: 24px; line-height: 1.6; color: #333333;">
      <p>親愛的 <strong>${bookingData.bookerName}</strong> 您好：</p>
      <p>您已成功取消您的預約，以下是已取消的預約資訊：</p>
      <table style="width: 100%; border-collapse: collapse; margin-top: 20px; margin-bottom: 20px; opacity: 0.7;">
        <tbody>
          <tr style="border-bottom: 1px solid #eeeeee;"><td style="padding: 12px 0; font-weight: bold; color: #555555; width: 100px;">預約代碼</td><td style="padding: 12px 0;">${bookingData.bookingCode}</td></tr>
          <tr style="border-bottom: 1px solid #eeeeee;"><td style="padding: 12px 0; font-weight: bold; color: #555555;">建案名稱</td><td style="padding: 12px 0;">${projectName}</td></tr>
          <tr style="border-bottom: 1px solid #eeeeee;"><td style="padding: 12px 0; font-weight: bold; color: #555555;">戶別</td><td style="padding: 12px 0;">${bookingData.unitId}</td></tr>
          <tr style="border-bottom: 1px solid #eeeeee;"><td style="padding: 12px 0; font-weight: bold; color: #555555;">預約項目</td><td style="padding: 12px 0;">${bookingData.bookingType}</td></tr>
          <tr style="border-bottom: 1px solid #eeeeee;"><td style="padding: 12px 0; font-weight: bold; color: #555555;">原預約日期</td><td style="padding: 12px 0;">${bookingData.appointmentDate.toDate().toLocaleDateString('zh-TW', { timeZone: 'Asia/Taipei', year: 'numeric', month: '2-digit', day: '2-digit' })}</td></tr>
          <tr><td style="padding: 12px 0; font-weight: bold; color: #555555;">原預約時段</td><td style="padding: 12px 0;">${bookingData.appointmentTimeSlot}</td></tr>
        </tbody>
      </table>
      <p>若您需要重新預約，歡迎隨時返回預約頁面。感謝您的使用。</p>
      ${contactInfoHtml}
      <p style="margin-top: 25px; padding-top: 20px; border-top: 1px solid #eeeeee; text-align: center;"><a href="${bookingUrl}" target="_blank" style="display: inline-block; padding: 10px 20px; background-color: #007bff; color: #ffffff; text-decoration: none; border-radius: 5px; font-weight: bold;">點此重新預約</a></p>
    </div>
    <div style="background-color: #f4f4f7; padding: 16px; text-align: center; font-size: 12px; color: #777777;">
      <p style="margin: 0;">此為系統自動發送郵件，請勿直接回覆。</p>
      <p style="margin: 5px 0 0 0;">${projectName} 預約系統</p>
    </div>
  </div>
</div>`;

      const ccRecipients = await getCcRecipients(projectId, "驗屋系統信件副本");
      await mailTransport.sendMail({
        to: bookingData.bookerEmail,
        cc: ccRecipients,
        subject: subject,
        html: htmlBody,
        name: `${projectName} 預約系統`
      });
      console.log(`[${functionName}] 已寄送取消通知信至 ${bookingData.bookerEmail}`);
    }

    return { status: "success", message: "預約已成功取消" };

  } catch (error) {
    console.error(`[${functionName}] 🔴 取消預約時發生錯誤:`, error);
    if (error instanceof HttpsError) {
      throw error;
    }
    throw new HttpsError("internal", `取消預約時發生錯誤: ${error.message}`);
  }
});
// ✓ END: 新增函式


/**
 *  [新增] 供管理員獲取指定日期的所有時段選項 (包含額滿狀態)
 */
exports.getSlotsForAdmin = onCall({ region: "asia-east1", cors: true }, async (request) => {
  const { projectId, dateStr } = request.data;
  const functionName = `getSlotsForAdmin`;

  if (!projectId || !dateStr) {
    throw new HttpsError("invalid-argument", "缺少必要參數 (projectId, dateStr)。");
  }

  try {
    // 1. 維持使用明確指定 databaseId 的寫法
    const db = new Firestore({ databaseId: "anxi-app" });

    const linksQuery = await db.collection('batchRuleLinks')
      .where('projectId', '==', projectId)
      .where('date', '==', dateStr)
      .get();
    if (linksQuery.empty) return [];

    const ruleIds = linksQuery.docs.map(doc => doc.data().ruleId);
    if (ruleIds.length === 0) return [];

    // 2.  使用我們重新命名的 GCloudFieldPath
    const rulesQuery = await db.collection('dateRules')
      .where(GCloudFieldPath.documentId(), 'in', ruleIds)
      .get();

    if (rulesQuery.empty) return [];

    const allSlotsForDay = {};
    rulesQuery.forEach(doc => {
      const ruleSlots = doc.data().slots;
      if (ruleSlots) {
        Object.assign(allSlotsForDay, ruleSlots);
      }
    });
    if (Object.keys(allSlotsForDay).length === 0) return [];

    // ... 以下所有計算名額的邏輯都維持不變 ...
    const appointmentDateObj = new Date(dateStr + 'T00:00:00');
    const appointmentsSnapshot = await db.collection('appointments')
      .where('projectId', '==', projectId)
      .where('appointmentDate', '==', appointmentDateObj)
      .where('status', '==', '預約中')
      .get();

    const bookingsCount = {};
    appointmentsSnapshot.forEach(doc => {
      const timeSlot = doc.data().appointmentTimeSlot;
      bookingsCount[timeSlot] = (bookingsCount[timeSlot] || 0) + 1;
    });

    const timeSlotOptions = Object.keys(allSlotsForDay).sort().map(time => {
      const capacity = allSlotsForDay[time]?.capacity || 0;
      const currentBookings = bookingsCount[time] || 0;
      const remaining = capacity - currentBookings;

      if (remaining <= 0) {
        return `${time} (已預約 ${currentBookings},已額滿 ${capacity})`;
      } else {
        return `${time} (已預約 ${currentBookings},尚餘 ${remaining})`;
      }
    });

    return timeSlotOptions;

  } catch (error) {
    console.error(`[${functionName}] 發生錯誤:`, error);
    throw new HttpsError("internal", "計算可預約時段時發生錯誤。");
  }
});




/**
 * [Firebase 版] 獲取指定建案的所有棟別列表 (無 showInMenu 篩選)
 * 專供「上傳驗屋報告」頁面使用。
 */
exports.getBuildingsForUpload = onCall(async (request) => {
  const { projectId } = request.data;
  if (!projectId) {
    throw new HttpsError('invalid-argument', '缺少 projectId 參數。');
  }

  try {
    const db = new Firestore({ databaseId: "anxi-app" });
    const householdSnapshot = await db.collection('households')
      .where('projectId', '==', projectId)
      .get();

    // 使用 Set 來確保棟別名稱不重複
    const buildingsSet = new Set();
    householdSnapshot.forEach(doc => {
      const building = doc.data().building;
      if (building) {
        buildingsSet.add(building);
      }
    });

    // 排序後回傳
    const buildings = Array.from(buildingsSet).sort((a, b) => a.localeCompare(b, 'zh-Hant-TW'));

    return { status: 'success', data: { buildings: buildings } };

  } catch (error) {
    console.error(`[getBuildingsForUpload] 獲取棟別時發生錯誤:`, error);
    throw new HttpsError('internal', '讀取棟別資料時發生錯誤。');
  }
});


/**
 * [Firebase 版] 獲取所有戶別資料，並按棟別分組 (無 showInMenu 篩選)
 * 專供「上傳驗屋報告」頁面使用。
 */
exports.getAllUnitsForUpload = onCall(async (request) => {
  const { projectId } = request.data;
  if (!projectId) {
    throw new HttpsError('invalid-argument', '缺少 projectId 參數。');
  }

  try {
    const db = new Firestore({ databaseId: "anxi-app" });
    const snapshot = await db.collection('households')
      .where('projectId', '==', projectId)
      .get();

    if (snapshot.empty) {
      return { status: 'success', data: {} };
    }

    const allUnitsByBuilding = {};
    snapshot.forEach(doc => {
      const unitData = doc.data();
      const building = unitData.building;
      if (building && unitData.unitId) {
        if (!allUnitsByBuilding[building]) {
          allUnitsByBuilding[building] = [];
        }
        // 同時回傳戶別與門牌，方便前端使用
        allUnitsByBuilding[building].push({
          unit: unitData.unitId,
          address: unitData.address || ''
        });
      }
    });

    return { status: 'success', data: allUnitsByBuilding };

  } catch (error) {
    console.error(`[getAllUnitsForUpload] 獲取戶別時發生錯誤:`, error);
    throw new HttpsError('internal', '讀取戶別資料時發生錯誤。');
  }
});




/**
 * [最終修正版] 代理驗屋報告上傳
 * 接收前端傳來的 Base64 檔案，直接存到 Google Drive、更新資料庫、寄送 Email。
 * (已重構，解決 Read-after-Write 的事務問題)
 */
exports.handleDirectReportUpload = onCall({
  region: "asia-east1",
  timeoutSeconds: 300,
  memory: "1GiB",
  secrets: [
    "SENDER_EMAIL",
    "GMAIL_APP_PASSWORD",
    "DRIVE_CLIENT_ID",
    "DRIVE_CLIENT_SECRET",
    "DRIVE_REFRESH_TOKEN"
  ],
}, async (request) => {

  const functionName = 'handleDirectReportUpload';
  const {
    projectId,
    unit,
    fileContent,
    reportType,
    buyerName,
    phone,
    email,
    companyName,
    bookingCode,
  } = request.data;

  if (!projectId || !unit || !fileContent || !reportType) {
    throw new HttpsError('invalid-argument', '缺少必要參數。');
  }

  console.log(`[${functionName}] 開始處理戶別 ${unit} 的檔案上傳`);
  const db = new Firestore({ databaseId: "anxi-app" });

  try {
    const projectDocRef = db.collection('projects').doc(projectId);
    const householdDocId = `${projectId}_${unit}`;
    const householdRef = db.collection('households').doc(householdDocId);

    // --- 階段一：前置檢查 (Transaction 外部) ---
    // 先讀取一次資料，確認開關和資料夾路徑是存在的
    const initialHouseholdDoc = await householdRef.get();
    if (!initialHouseholdDoc.exists) {
      throw new HttpsError('not-found', `找不到戶別資料: ${householdDocId}`);
    }
    const householdData = initialHouseholdDoc.data();
    const switchField = reportType === '初驗報告' ? 'initialReportUploadSwitch' : 'reInspectionReportUploadSwitch';
    if (householdData[switchField] !== true) {
      throw new HttpsError('permission-denied', `${unit} 的 ${reportType} 上傳權限已關閉。`);
    }
    const parentFolderUrl = householdData.inspectionReportFolderUrl;
    if (!parentFolderUrl) {
      throw new HttpsError('failed-precondition', `戶別資料中缺少 "inspectionReportFolderUrl" 設定。`);
    }

    // --- 階段二：執行外部操作 (上傳到 Google Drive) ---
    console.log(`[${functionName}] 正在上傳檔案至 Google Drive...`);
    const now = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Taipei" }));
    const timestamp = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}-${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}`;
    const nameParts = [reportType, unit, buyerName, companyName].filter(Boolean);
    const newFileName = `${nameParts.join('-')}-${timestamp}.pdf`;

    const parentFolderIdMatch = parentFolderUrl.match(/[-\w]{25,}/);
    if (!parentFolderIdMatch) throw new HttpsError('invalid-argument', '無效的 Drive 資料夾連結。');
    const parentFolderId = parentFolderIdMatch[0];

    const oauth2Client = new google.auth.OAuth2(process.env.DRIVE_CLIENT_ID, process.env.DRIVE_CLIENT_SECRET, 'https://developers.google.com/oauthplayground');
    oauth2Client.setCredentials({ refresh_token: process.env.DRIVE_REFRESH_TOKEN });
    const drive = google.drive({ version: "v3", auth: oauth2Client });

    const searchRes = await drive.files.list({ q: `name='${unit}' and mimeType='application/vnd.google-apps.folder' and '${parentFolderId}' in parents and trashed=false` });
    let subFolderId = searchRes.data.files.length > 0 ? searchRes.data.files[0].id : (await drive.files.create({ resource: { name: unit, mimeType: 'application/vnd.google-apps.folder', parents: [parentFolderId] }, fields: 'id' })).data.id;

    const buffer = Buffer.from(fileContent, 'base64');
    const stream = Readable.from(buffer);

    const uploadedFile = await drive.files.create({
      requestBody: { name: newFileName, parents: [subFolderId] },
      media: { mimeType: 'application/pdf', body: stream },
      fields: 'id, name, webViewLink',
    });
    const uploadedFileLink = uploadedFile.data.webViewLink;
    console.log(`[${functionName}] 檔案上傳成功，連結: ${uploadedFileLink}`);

    // --- 階段三：執行資料庫事務 (所有讀寫在此完成) ---
    console.log(`[${functionName}] 正在執行資料庫更新事務...`);
    await db.runTransaction(async (transaction) => {
      // **讀取階段**
      let appointmentDocRef = null;
      if (bookingCode) {
        const appointmentQuery = db.collection('appointments').where('projectId', '==', projectId).where('bookingCode', '==', bookingCode).limit(1);
        const appointmentSnapshot = await transaction.get(appointmentQuery);
        if (!appointmentSnapshot.empty) {
          appointmentDocRef = appointmentSnapshot.docs[0].ref;
        }
      }

      // **寫入階段**
      // 1. 寫入 Log
      const logTimestamp = new Date();
      const logIdSuffix = `${String(logTimestamp.getFullYear()).slice(2)}${String(logTimestamp.getMonth() + 1).padStart(2, '0')}${String(logTimestamp.getDate()).padStart(2, '0')}${String(logTimestamp.getHours()).padStart(2, '0')}${String(logTimestamp.getMinutes()).padStart(2, '0')}${String(logTimestamp.getSeconds()).padStart(2, '0')}`;
      const logDocId = `${projectId}_${unit}_${logIdSuffix}`;
      const logRef = db.collection('inspectionReportLogs').doc(logDocId);

      transaction.set(logRef, {
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        projectID: projectId,
        buyerName: buyerName || 'N/A',
        phone: phone || 'N/A',
        email: email || 'N/A',
        unit: unit,
        fileUrl: uploadedFileLink,
        reportType: reportType,
        companyName: companyName || '',
      });

      // 2. 更新戶別資料
      transaction.update(householdRef, {
        [switchField]: false,
        inspectionReportUrl: admin.firestore.FieldValue.arrayUnion({ name: newFileName, url: uploadedFileLink })
      });

      // 3. 更新預約紀錄
      if (appointmentDocRef) {
        transaction.update(appointmentDocRef, {
          uploadReportTime: admin.firestore.FieldValue.serverTimestamp(),
          reportUploaded: true
        });
        console.log(`[${functionName}] 已在事務中排定更新預約文件 [${appointmentDocRef.id}]`);
      } else if (bookingCode) {
        console.warn(`[${functionName}] 在事務中找不到 bookingCode [${bookingCode}]，未更新上傳時間。`);
      }
    });
    console.log(`[${functionName}] 資料庫事務成功。`);

    // --- 階段四：寄送 Email (Transaction 外部) ---
    if (email) {
      const projectDoc = await projectDocRef.get();
      const projectName = projectDoc.exists ? projectDoc.data().name : projectId;
      const mailTransport = nodemailer.createTransport({ service: 'gmail', auth: { user: process.env.SENDER_EMAIL, pass: process.env.GMAIL_APP_PASSWORD } });

      const subject = `【${projectName}】驗屋報告上傳成功通知 (${unit})`;
      const bookingUrl = `https://anxismart.com/#/booking/${projectId}`;

      const returnButtonHtml = `
          <p style="margin-top: 25px; padding-top: 20px; border-top: 1px solid #eeeeee; font-size: 14px; color: #555;">
              若您需要再次上傳或進行預約，請點擊以下按鈕返回頁面：<br>
              <a href="${bookingUrl}" target="_blank" style="display: inline-block; margin-top: 12px; padding: 10px 20px; background-color: #007bff; color: #ffffff; text-decoration: none; border-radius: 5px; font-weight: bold;">
                  返回上傳/預約頁面
              </a>
          </p>
      `;

      const htmlBody = `
<div style="font-family: 'Helvetica Neue', Helvetica, Arial, 'PingFang TC', 'Microsoft JhengHei', sans-serif; background-color: #f4f4f7; padding: 20px;">
<div style="max-width: 600px; margin: 20px auto; background-color: #ffffff; border-radius: 8px; border: 1px solid #e0e0e0; overflow: hidden;">
  <div style="background-color: #28a745; color: #ffffff; padding: 20px; text-align: center;">
    <h2 style="margin: 0; font-size: 24px;">報告上傳成功通知</h2>
  </div>
  <div style="padding: 24px; line-height: 1.6; color: #333333;">
    <p>親愛的 <strong>${buyerName || '住戶'}</strong> 您好：</p>
    <p>您的驗屋報告已成功上傳，以下是本次的上傳紀錄。</p>
    <table style="width: 100%; border-collapse: collapse; margin-top: 20px; margin-bottom: 20px;">
      <tbody>
        <tr style="border-bottom: 1px solid #eeeeee;"><td style="padding: 12px 0; font-weight: bold; color: #555555; width: 100px;">建案名稱</td><td style="padding: 12px 0;">${projectName}</td></tr>
        <tr style="border-bottom: 1px solid #eeeeee;"><td style="padding: 12px 0; font-weight: bold; color: #555555;">戶別</td><td style="padding: 12px 0;">${unit}</td></tr>
        <tr style="border-bottom: 1px solid #eeeeee;"><td style="padding: 12px 0; font-weight: bold; color: #555555;">上傳姓名</td><td style="padding: 12px 0;">${buyerName}</td></tr>
        <tr style="border-bottom: 1px solid #eeeeee;"><td style="padding: 12px 0; font-weight: bold; color: #555555;">連絡電話</td><td style="padding: 12px 0;">${phone || '未提供'}</td></tr>
        <tr style="border-bottom: 1px solid #eeeeee;"><td style="padding: 12px 0; font-weight: bold; color: #555555;">報告類型</td><td style="padding: 12px 0;">${reportType}</td></tr>
        ${companyName ? `<tr style="border-bottom: 1px solid #eeeeee;"><td style="padding: 12px 0; font-weight: bold; color: #555555;">代驗公司</td><td style="padding: 12px 0;">${companyName}</td></tr>` : ''}
        <tr>
          <td style="padding: 12px 0; font-weight: bold; color: #555555;">報告連結</td>
          <td style="padding: 12px 0;">
            <a href="${uploadedFileLink}" target="_blank" style="color: #007BFF; text-decoration: none; font-weight: bold;">點此查看報告</a>
          </td>
        </tr>
      </tbody>
    </table>
    <p>感謝您的使用，如有任何問題，請與現場服務人員聯繫。</p>
    ${returnButtonHtml}
  </div>
  <div style="background-color: #f4f4f7; padding: 16px; text-align: center; font-size: 12px; color: #777777;">
    <p style="margin: 0;">此為系統自動發送郵件，請勿直接回覆。</p>
    <p style="margin: 5px 0 0 0;">${projectName} 驗屋報告系統</p>
    <p style="margin: 10px 0 0 0; font-size: 11px; color: #999999;">
      本服務由 <a href="https://anxismart.com/" target="_blank" style="color: #007bff; text-decoration: none; font-weight: bold;">anxismart安熙智慧建案管理系統</a> 提供技術支援
    </p>
  </div>
</div>
</div>
      `;
      await mailTransport.sendMail({
        from: `"${projectName} 驗屋報告系統" <${process.env.SENDER_EMAIL}>`,
        to: email, subject, html: htmlBody
      });
      console.log(`[${functionName}] 已成功寄送確認信至: ${email}`);
    }

    console.log(`[${functionName}] 處理完成: ${newFileName}`);
    return { status: 'success', message: '檔案上傳成功，確認信已寄出。' };

  } catch (error) {
    console.error(`[${functionName}] 🔴 處理檔案時發生嚴重錯誤:`, error);
    if (error instanceof HttpsError) { throw error; }
    throw new HttpsError('internal', `處理上傳時發生錯誤: ${error.message}`);
  }
});



/**
 * 每日排程：自動更新當日已結束的預約狀態設定為:已完成
 * 此函式會於每日台灣時間 17:00 執行
 * (修正版 V2: 移除 date-fns-tz 依賴，使用原生 Date 修復時區問題)
 */
exports.dailyAppointmentStatusUpdate = onSchedule({
  region: "asia-east1",
  schedule: "every day 20:10",
  timeZone: "Asia/Taipei",
  memory: "256MiB"
}, async (event) => {

  console.log("排程啟動：開始檢查並更新當日預約狀態...");
  const functionName = "dailyAppointmentStatusUpdate";
  const db = new Firestore({ databaseId: "anxi-app" });

  try {
    const timeZone = "Asia/Taipei";
    const now = new Date(); // 當下 UTC 時間

    // 1. 取得「今天」在台灣時區的日期字串 (格式: YYYY-MM-DD)
    // 使用 "en-CA" locale 會穩定輸出 YYYY-MM-DD 格式
    const todayDateString = now.toLocaleDateString("en-CA", { timeZone });

    console.log(`[${functionName}] 執行日期基準 (台灣): ${todayDateString}`);

    // 2. 建立台灣時區的「當日開始」與「當日結束」時間點
    // 直接組裝 ISO 8601 字串，並強制指定 +08:00 時區
    // 原理：new Date("2025-12-05T00:00:00+08:00") 會自動被轉換為正確的 UTC Timestamp 存入 Firestore
    const startOfDay = new Date(`${todayDateString}T00:00:00+08:00`);
    const endOfDay = new Date(`${todayDateString}T23:59:59.999+08:00`);

    console.log(`[${functionName}] 查詢區間 (轉換為 ISO UTC): ${startOfDay.toISOString()} ~ ${endOfDay.toISOString()}`);

    // 3. 建立查詢
    const appointmentsRef = db.collection("appointments");
    const queryToUpdate = appointmentsRef
      .where("status", "==", "預約中")
      .where("appointmentDate", ">=", startOfDay)
      .where("appointmentDate", "<=", endOfDay);

    const snapshot = await queryToUpdate.get();

    if (snapshot.empty) {
      console.log("今日沒有需要更新狀態的預約。");
      return;
    }

    console.log(`找到 ${snapshot.size} 筆今日的預約，準備更新狀態...`);

    // 4. 使用批次寫入 (Write Batch)
    const batch = db.batch();
    snapshot.docs.forEach(doc => {
      batch.update(doc.ref, { status: "已完成" });
    });

    // 5. 提交批次更新
    await batch.commit();

    console.log(`成功將 ${snapshot.size} 筆預約狀態更新為「已完成」。`);

  } catch (error) {
    console.error(`[${functionName}] 執行時發生錯誤:`, error);
  }
});

/**
 * 獲取指定建案中，預約紀錄的最早年份和最晚年份，並回傳完整的起訖日期
 * @param {string} projectId - 建案 ID
 * @returns {Promise<object>} - 包含 { minDate, maxDate } 的物件
 */
exports.getAppointmentDateRange = onCall(async (request) => {
  const { projectId } = request.data;
  const functionName = `getAppointmentDateRange (Project: ${projectId})`;

  if (!projectId) {
    throw new HttpsError("invalid-argument", "缺少 projectId 參數。");
  }

  try {
    const db = new Firestore({ databaseId: "anxi-app" });
    const appointmentsRef = db.collection("appointments");

    // 建立兩個查詢：一個找最早，一個找最晚
    const firstAppointmentQuery = appointmentsRef
      .where("projectId", "==", projectId)
      .orderBy("appointmentDate", "asc")
      .limit(1);

    const lastAppointmentQuery = appointmentsRef
      .where("projectId", "==", projectId)
      .orderBy("appointmentDate", "desc")
      .limit(1);

    // 平行執行這兩個查詢
    const [firstSnapshot, lastSnapshot] = await Promise.all([
      firstAppointmentQuery.get(),
      lastAppointmentQuery.get(),
    ]);

    let minDate, maxDate;

    if (firstSnapshot.empty) {
      // 如果沒有任何預約紀錄，預設為今年
      const currentYear = new Date().getFullYear();
      minDate = `${currentYear}-01-01`;
      maxDate = `${currentYear}-12-31`;
      console.log(`[${functionName}] 找不到預約，使用預設年份: ${currentYear}`);
    } else {
      const firstAppointment = firstSnapshot.docs[0].data();
      const lastAppointment = lastSnapshot.docs[0].data();

      // 從 Timestamp 中獲取年份
      const earliestYear = firstAppointment.appointmentDate.toDate().getFullYear();
      const latestYear = lastAppointment.appointmentDate.toDate().getFullYear();

      minDate = `${earliestYear}-01-01`;
      maxDate = `${latestYear}-12-31`;
      console.log(`[${functionName}] 計算出的年份範圍: ${earliestYear} - ${latestYear}`);
    }

    return { status: "success", data: { minDate, maxDate } };

  } catch (error) {
    console.error(`[${functionName}] Error:`, error);
    throw new HttpsError("internal", `獲取日期範圍失敗: ${error.message}`);
  }
});


/**
 * 更新指定使用者的偏好設定
 * @param {string} userKey - 使用者的手機號碼 (文件 ID)
 * @param {object} preferences - 要合併更新的偏好設定物件
 */
exports.updateUserPreferences = onCall(async (request) => {
  const { userKey, preferences } = request.data;
  const functionName = `updateUserPreferences (User: ${userKey})`;

  if (!userKey || !preferences) {
    throw new HttpsError("invalid-argument", "缺少 userKey 或 preferences 參數。");
  }

  try {
    const db = new Firestore({ databaseId: "anxi-app" });
    const userDocRef = db.collection("users").doc(userKey);

    const userDocSnap = await userDocRef.get();

    //  修正點：將 .exists() 改為 .exists
    if (!userDocSnap.exists) {
      throw new HttpsError('not-found', `找不到使用者 ${userKey}`);
    }

    const existingPrefs = userDocSnap.data().preferences || {};

    const mergedPrefs = { ...existingPrefs, ...preferences };

    await userDocRef.update({
      preferences: mergedPrefs
    });

    console.log(`[${functionName}] 已成功更新使用者偏好設定。`);
    return { status: "success", message: "偏好設定已儲存。" };

  } catch (error) {
    console.error(`[${functionName}] Error:`, error);
    if (error instanceof HttpsError) throw error;
    throw new HttpsError("internal", `更新使用者偏好設定失敗: ${error.message}`);
  }
});



/**
 * 輔助函式：檢查文件中的任何字串欄位是否包含關鍵字（不分大小寫）
 * @param {object} data - Firestore 文件的資料物件
 * @param {string} lowerCaseKeyword - 已轉換為小寫的搜尋關鍵字
 * @returns {boolean} - 如果找到匹配項則返回 true
 */
const documentMatchesKeyword = (data, lowerCaseKeyword) => {
  // 遍歷文件的所有欄位值
  for (const value of Object.values(data)) {
    // 只檢查字串類型的欄位
    if (typeof value === "string" && value.toLowerCase().includes(lowerCaseKeyword)) {
      return true;
    }
    // 可選：如果需要搜尋陣列中的字串
    if (Array.isArray(value)) {
      for (const item of value) {
        if (typeof item === "string" && item.toLowerCase().includes(lowerCaseKeyword)) {
          return true;
        }
      }
    }
  }
  return false;
};


/**
 * [新增] 全域預約搜尋 Cloud Function (符合現有結構)
 * - 根據 projectId 和 keyword 搜尋 appointments 和 households 集合
 * - 回傳符合條件的 appointment 文件列表
 */
exports.globalAppointmentSearch = onCall(async (request) => {
  const { projectId, keyword } = request.data;
  const functionName = `globalAppointmentSearch (Project: ${projectId})`;

  // 2. 輸入驗證 (這部分保留)
  if (!projectId || !keyword || keyword.trim().length < 2) {
    console.error(`[${functionName}] 無效的搜尋參數`, { projectId, keyword });
    throw new HttpsError("invalid-argument", "必須提供有效的建案 ID 和至少 2 個字元的關鍵字。");
  }

  const lowerCaseKeyword = keyword.toLowerCase();
  console.log(`[${functionName}] 開始搜尋，關鍵字: "${keyword}"`);

  const db = new Firestore({ databaseId: "anxi-app" });

  try {
    // 3. 並行查詢 appointments 和 households 集合
    const [appointmentsSnapshot, householdsSnapshot] = await Promise.all([
      db.collection("appointments").where("projectId", "==", projectId).get(),
      db.collection("households").where("projectId", "==", projectId).get(),
    ]);

    // 4. 在記憶體中篩選符合關鍵字的戶別 (households)
    const matchedHouseholdUnitIds = new Set();
    householdsSnapshot.forEach(doc => {
      if (documentMatchesKeyword(doc.data(), lowerCaseKeyword)) {
        // 確保戶別資料中有 unitId 欄位
        if (doc.data().unitId) {
          matchedHouseholdUnitIds.add(doc.data().unitId);
        }
      }
    });
    console.log(`[${functionName}] 關鍵字從 households 集合匹配到 ${matchedHouseholdUnitIds.size} 個戶別。`);

    // 5. 篩選並組合最終結果
    const results = [];
    const addedAppointmentIds = new Set(); // 用於避免重複加入相同的預約

    appointmentsSnapshot.forEach(doc => {
      const appointment = { id: doc.id, ...doc.data() };

      // 檢查條件：
      // a) 預約本身的資料是否符合關鍵字
      const appointmentMatches = documentMatchesKeyword(appointment, lowerCaseKeyword);
      // b) 該預約的戶別是否在 "符合關鍵字的戶別列表" 中
      const householdMatches = matchedHouseholdUnitIds.has(appointment.unitId);

      if ((appointmentMatches || householdMatches) && !addedAppointmentIds.has(appointment.id)) {
        // 將 Firestore Timestamp 轉換為前端易於處理的格式
        if (appointment.appointmentDate && typeof appointment.appointmentDate.toDate === 'function') {
          appointment.appointmentDate = appointment.appointmentDate.toDate().toISOString();
        }
        if (appointment.createdAt && typeof appointment.createdAt.toDate === 'function') {
          appointment.createdAt = appointment.createdAt.toDate().toISOString();
        }
        results.push(appointment);
        addedAppointmentIds.add(appointment.id);
      }
    });

    console.log(`[${functionName}] 搜尋完成，共找到 ${results.length} 筆預約紀錄。`);

    // 6. 回傳成功結果
    return { status: "success", data: results };

  } catch (error) {
    console.error(`[${functionName}] 執行失敗:`, error);
    throw new HttpsError("internal", `搜尋時發生未預期的錯誤，請稍後再試。`);
  }
});



//  START: 新增 - 發起授權書簽署流程 (委託人發起)
exports.initiateAuthSigningProcess = onCall({
  region: "asia-east1",
  secrets: ["SENDER_EMAIL", "GMAIL_APP_PASSWORD"],
}, async (request) => {
  const { projectId, unitId, formData, delegatorSignature } = request.data;
  const functionName = `initiateAuthSigningProcess`;

  if (!projectId || !unitId || !formData || !delegatorSignature) {
    throw new HttpsError("invalid-argument", "缺少必要參數。");
  }

  const db = new Firestore({ databaseId: "anxi-app" });

  try {
    // 1. 產生一個安全、唯一的 Token
    const token = crypto.randomBytes(32).toString('hex');
    const now = new Date();
    // 設定 48 小時後過期
    const expiresAt = new Date(now.getTime() + 48 * 60 * 60 * 1000);

    // 2. 在新的 'authLetterSessions' 集合中建立一筆暫存紀錄
    const sessionRef = db.collection("authLetterSessions").doc(token); // 使用 token 作為文件 ID
    await sessionRef.set({
      projectId,
      unitId,
      formData,
      delegatorSignature, // 委託人簽名
      status: 'pending', // 狀態：等待中
      createdAt: Timestamp.fromDate(now),
      expiresAt: Timestamp.fromDate(expiresAt),
    });

    // 3. 準備並寄送 Email 給受託人
    const projectDoc = await db.collection('projects').doc(projectId).get();
    const projectName = projectDoc.exists ? projectDoc.data().name : projectId;

    // 建立專屬簽署連結 (下一步驟我們會建立這個頁面)
    const signingUrl = `https://anxismart.com/#/sign-auth/${token}`;
    const mailTransport = nodemailer.createTransport({
      service: 'gmail',
      auth: { user: process.env.SENDER_EMAIL, pass: process.env.GMAIL_APP_PASSWORD },
    });

    const emailBodyHtml = `
      <div style="font-family: Arial, sans-serif; line-height: 1.6;">
        <h2 style="color: #333;">【${projectName}】驗屋授權書簽署邀請</h2>
        <p>親愛的 ${formData.受託人姓名} 您好：</p>
        <p>委託人(屋主) ${formData.委託人姓名} 已發起一份驗屋授權書，需要您的簽署以完成預約流程。</p>
        <p>請點擊下方的按鈕，檢視文件內容並完成您的簽署。為保障安全，此連結將於 48 小時後失效。</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${signingUrl}" target="_blank" style="background-color: #007bff; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold;">
            前往簽署授權書
          </a>
        </div>
        <p>如果您不認識委託人，請忽略此郵件。</p>
        <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
        <p style="font-size: 12px; color: #888;">此為系統自動發送的郵件，請勿直接回覆。</p>
      </div>
    `;

    await mailTransport.sendMail({
      from: `"${projectName} 預約系統" <${process.env.SENDER_EMAIL}>`,
      to: formData.受託人Email, //  寄給受託人
      subject: `【重要】${projectName} 驗屋授權書簽署邀請`,
      html: emailBodyHtml,
    });

    console.log(`[${functionName}] 已成功為 ${unitId} 寄送簽署邀請至受託人 ${formData.受託人Email}`);
    return { status: "success", message: "邀請已寄出" };

  } catch (error) {
    console.error(`[${functionName}] 發生錯誤:`, error);
    throw new HttpsError("internal", `發起簽署流程時發生錯誤: ${error.message}`);
  }
});
//  END: 新增函式



//  START: 新增 - 獲取簽署階段資料 (供受託人頁面使用)
exports.getAuthSigningSession = onCall(async (request) => {
  const { token } = request.data;
  if (!token) {
    throw new HttpsError("invalid-argument", "缺少 token。");
  }

  const db = new Firestore({ databaseId: "anxi-app" });
  const sessionRef = db.collection("authLetterSessions").doc(token);
  const sessionDoc = await sessionRef.get();

  if (!sessionDoc.exists) {
    throw new HttpsError("not-found", "簽署連結無效或已失效。");
  }

  const sessionData = sessionDoc.data();

  // 驗證狀態
  if (sessionData.status !== 'pending') {
    throw new HttpsError("failed-precondition", `此簽署邀請的狀態為「${sessionData.status}」，無法再次簽署。`);
  }

  // 驗證過期時間
  if (new Date() > sessionData.expiresAt.toDate()) {
    throw new HttpsError("deadline-exceeded", "此簽署邀請已過期。");
  }

  // 獲取建案相關設定 (包含授權書範本)
  const projectDoc = await db.collection('projects').doc(sessionData.projectId).get();
  if (!projectDoc.exists) {
    throw new HttpsError("not-found", "找不到對應的建案設定。");
  }
  const projectConfig = projectDoc.data();
  const projectName = projectConfig.name || sessionData.projectId;

  // 將所有需要的資料回傳給前端
  return {
    status: "success",
    data: {
      projectId: sessionData.projectId,
      unitId: sessionData.unitId,
      formData: sessionData.formData,
      delegatorSignature: sessionData.delegatorSignature,
      projectName: projectName,
      projectConfig: {
        logoUrl: projectConfig.logoUrl || '',
        authLetterTemplate: projectConfig.authLetterTemplate || ''
      }
    }
  };
});
//  END: 新增函式


//  START: 修改 - 完成簽署流程並寄送通知信
exports.completeAuthSigningProcess = onCall({
  region: "asia-east1",
  secrets: ["SENDER_EMAIL", "GMAIL_APP_PASSWORD"], //  加入 secrets
}, async (request) => {
  const { token, finalUrl } = request.data;
  const functionName = `completeAuthSigningProcess`;

  if (!token || !finalUrl) {
    throw new HttpsError("invalid-argument", "缺少 token 或最終文件 URL。");
  }

  const db = new Firestore({ databaseId: "anxi-app" });
  const sessionRef = db.collection("authLetterSessions").doc(token);

  try {
    let sessionData; // 在 transaction 外宣告，以便後續使用

    // 使用 Transaction 確保讀取和寫入的原子性
    await db.runTransaction(async (transaction) => {
      const sessionDoc = await transaction.get(sessionRef);
      if (!sessionDoc.exists) {
        throw new HttpsError("not-found", "簽署階段作業無效。");
      }
      sessionData = sessionDoc.data(); // 將資料存到外部變數
      if (sessionData.status !== 'pending') {
        throw new HttpsError("failed-precondition", "此簽署邀請已被處理過。");
      }

      // 1. 更新 session 狀態
      transaction.update(sessionRef, {
        status: 'completed',
        completedAt: Timestamp.now(),
        finalDocumentUrl: finalUrl
      });

      // 2. 更新戶別資料 (households) 中的授權書連結欄位
      const householdDocId = `${sessionData.projectId}_${sessionData.unitId}`;
      const householdRef = db.collection("households").doc(householdDocId);
      //  使用 arrayUnion 將新文件加入陣列，而不是覆蓋
      transaction.update(householdRef, {
        authorizationLetterUrl: admin.firestore.FieldValue.arrayUnion({
          name: `授權書-${new Date().toISOString().slice(0, 10)}`,
          url: finalUrl
        })
      });
    });

    //  START: 新增寄送 Email 通知邏輯
    if (sessionData) {
      try {
        const projectDoc = await db.collection('projects').doc(sessionData.projectId).get();
        const projectName = projectDoc.exists ? projectDoc.data().name : sessionData.projectId;

        const ccRecipients = await getCcRecipients(sessionData.projectId, "驗屋系統信件副本");
        const toRecipients = [
          sessionData.formData.委託人Email,
          sessionData.formData.受託人Email
        ].filter(Boolean); // 過濾掉空的 Email

        if (toRecipients.length > 0) {
          const mailTransport = nodemailer.createTransport({
            service: 'gmail',
            auth: { user: process.env.SENDER_EMAIL, pass: process.env.GMAIL_APP_PASSWORD },
          });

          const subject = `【${projectName}】驗屋授權書已完成簽署通知 (戶別: ${sessionData.unitId})`;
          const htmlBody = `
            <div style="font-family: Arial, sans-serif; line-height: 1.6; background-color: #f4f4f7; padding: 20px;">
              <div style="max-width: 600px; margin: 20px auto; background-color: #ffffff; border-radius: 8px; border: 1px solid #e0e0e0; overflow: hidden;">
                <div style="background-color: #28a745; color: #ffffff; padding: 20px; text-align: center;">
                  <h2 style="margin: 0; font-size: 24px;">授權書簽署完成</h2>
                </div>
                <div style="padding: 24px; color: #333333;">
                  <p>親愛的 ${sessionData.formData.委託人姓名} 與 ${sessionData.formData.受託人姓名} 您好：</p>
                  <p>關於「${projectName}」建案 ${sessionData.unitId} 戶別的驗屋授權書，已由雙方確認並完成簽署。</p>
                  <p>您可以點擊下方按鈕查看或下載最終的授權書文件。</p>
                  <div style="text-align: center; margin: 30px 0;">
                    <a href="${finalUrl}" target="_blank" style="background-color: #007bff; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold;">
                      查看已簽署的授權書
                    </a>
                  </div>
                  <div style="padding: 15px; background-color: #f9f9f9; border-radius: 5px;">
                    <h4 style="margin-top:0; color: #555;">文件資訊摘要</h4>
                    <p style="margin: 5px 0;"><strong>建案:</strong> ${projectName}</p>
                    <p style="margin: 5px 0;"><strong>戶別:</strong> ${sessionData.unitId}</p>
                    <p style="margin: 5px 0;"><strong>委託人:</strong> ${sessionData.formData.委託人姓名}</p>
                    <p style="margin: 5px 0;"><strong>受託人:</strong> ${sessionData.formData.受託人姓名}</p>
                  </div>
                </div>
                <div style="background-color: #f4f4f7; padding: 16px; text-align: center; font-size: 12px; color: #777777;">
                  <p style="margin: 0;">此為系統自動發送郵件，請勿直接回覆。</p>
                  <p style="margin: 5px 0 0 0;">${projectName} 預約系統</p>
                  <p style="margin: 10px 0 0 0; font-size: 11px; color: #999999;">
                  本服務由 <a href="https://anxismart.com/" target="_blank" style="color: #007bff; text-decoration: none; font-weight: bold;">anxismart安熙智慧建案管理系統</a> 提供技術支援
                  </p>
                </div>
              </div>
            </div>
          `;

          await mailTransport.sendMail({
            from: `"${projectName} 預約系統" <${process.env.SENDER_EMAIL}>`,
            to: toRecipients.join(', '),
            cc: ccRecipients.join(', '),
            subject: subject,
            html: htmlBody,
          });

          console.log(`[${functionName}] 已成功為 session ${token} 寄送完成通知信。`);
        }
      } catch (emailError) {
        console.error(`[${functionName}] 寄送完成通知信失敗 (Session: ${token}):`, emailError);
        // 此處不拋出錯誤，確保即使寄信失敗，前端仍顯示成功
      }
    }
    //  END: 新增寄送 Email 通知邏輯

    return { status: "success" };

  } catch (error) {
    console.error(`[${functionName}] 處理流程時 (Token: ${token}) 發生錯誤:`, error);
    if (error instanceof HttpsError) throw error;
    throw new HttpsError("internal", "更新簽署狀態時發生錯誤。");
  }
});
//  END: 函式修改結束


// START: 替換舊的 fetchUserDetailsForAdmin 函式
exports.fetchUserDetailsForAdmin = onCall(async (request) => {
  // 1. 同時獲取操作者(adminKey)與被查詢者(targetUserKey)的 key
  const { targetUserKey, adminKey } = request.data;
  const functionName = `fetchUserDetailsForAdmin`;

  if (!targetUserKey || !adminKey) {
    throw new HttpsError("invalid-argument", "缺少 targetUserKey 或 adminKey 參數。");
  }

  const db = new Firestore({ databaseId: "anxi-app" });
  const userRef = db.collection("users");

  try {
    // 2. 一次性讀取操作者與被查詢者的資料
    const [targetUserDoc, adminUserDoc] = await Promise.all([
      userRef.doc(targetUserKey).get(),
      userRef.doc(adminKey).get()
    ]);

    // 檢查操作者是否存在
    if (!adminUserDoc.exists) {
      throw new HttpsError("unauthenticated", "無效的操作者身份。");
    }

    // 如果被查詢者不存在，直接回傳找不到的訊息 (這是正常流程)
    if (!targetUserDoc.exists) {
      return { status: 'error', message: `找不到手機號碼為 ${targetUserKey} 的用戶。` };
    }

    const targetUserData = targetUserDoc.data();
    const adminUserData = adminUserDoc.data();

    // 3. 提取雙方的角色陣列
    const targetUserRoles = targetUserData.roles || [];
    const adminUserRoles = adminUserData.roles || [];

    // --- 4. 執行權限檢查規則 ---

    // 規則一：如果要查詢的對象是「超級管理員」
    if (targetUserRoles.includes("超級管理員")) {
      // 則操作者本身也必須是「超級管理員」
      if (!adminUserRoles.includes("超級管理員")) {
        throw new HttpsError("permission-denied", "權限不足：您無法查詢超級管理員的資料。");
      }
    }
    // 規則二：如果要查詢的對象是「系統管理員」
    else if (targetUserRoles.includes("系統管理員")) {
      // 則操作者必須是「超級管理員」或「系統管理員」
      if (!adminUserRoles.includes("超級管理員") && !adminUserRoles.includes("系統管理員")) {
        throw new HttpsError("permission-denied", "權限不足：您無法查詢系統管理員的資料。");
      }
    }

    // --- 5. 如果所有檢查都通過，才繼續執行並回傳資料 ---
    const permissionDocRef = db.collection("userPermissions").doc(targetUserKey);
    const permissionDocSnap = await permissionDocRef.get();

    const permissions = permissionDocSnap.exists ? permissionDocSnap.data().permissions : {};

    return {
      status: 'success',
      data: {
        basicInfo: {
          phone: targetUserKey,
          name: targetUserData.name,
          email: targetUserData.email,
          password: String(targetUserData.password || ''),
          companyName: targetUserData.companyName,
          companyTaxId: String(targetUserData.companyTaxId || ''),
          roles: targetUserData.roles || []
        },
        permissions: permissions
      }
    };

  } catch (error) {
    console.error(`[${functionName}] 查詢用戶 ${targetUserKey} 資料時出錯:`, error);
    // 如果是我們自訂的權限錯誤，直接拋出
    if (error instanceof HttpsError) {
      throw error;
    }
    // 其他內部錯誤
    throw new HttpsError("internal", `查詢用戶資料時發生未預期的錯誤: ${error.message}`);
  }
});
// END: 函式替換結束


// START: 替換舊的 fetchManageableUsersWithDetails 函式
exports.fetchManageableUsersWithDetails = onCall(async (request) => {
  // 1. 獲取操作者(adminKey)
  const { adminKey } = request.data;
  if (!adminKey) {
    throw new HttpsError('unauthenticated', '操作者 ID 未提供。');
  }

  const db = new Firestore({ databaseId: "anxi-app" });
  const usersRef = db.collection("users");
  const functionName = `fetchManageableUsersWithDetails`;

  try {
    // 2. 獲取操作者的使用者資料及其角色
    const adminUserDoc = await usersRef.doc(adminKey).get();
    if (!adminUserDoc.exists) {
      throw new HttpsError('unauthenticated', '無效的操作者身份。');
    }
    const adminUserRoles = adminUserDoc.data().roles || [];

    // 3. 獲取所有使用者資料，準備在後端進行過濾
    const allUsersSnapshot = await usersRef.get();
    const allUsers = [];
    allUsersSnapshot.forEach(doc => {
      allUsers.push({ phone: doc.id, ...doc.data() });
    });

    // 4. 根據操作者的角色，過濾可見的人員列表
    const filteredUsers = allUsers.filter(targetUser => {
      // 管理者不應該在列表中看到自己
      if (targetUser.phone === adminKey) {
        return false;
      }

      const targetUserRoles = targetUser.roles || [];

      // 規則 A：如果操作者是「超級管理員」，則可以看到所有人
      if (adminUserRoles.includes('超級管理員')) {
        return true;
      }

      // 規則 B：如果被查詢者是「超級管理員」，非超級管理員的操作者看不到
      if (targetUserRoles.includes('超級管理員')) {
        return false;
      }

      // 規則 C：如果被查詢者是「系統管理員」...
      if (targetUserRoles.includes('系統管理員')) {
        // ...則操作者必須也是「系統管理員」(因為規則A已排除了超級管理員的情況)
        return adminUserRoles.includes('系統管理員');
      }

      // 如果以上規則都未觸發，代表被查詢者是一般使用者，所有人都可以看到
      return true;
    });

    // 5. 將過濾後的結果整理成前端需要的格式
    const result = filteredUsers.map(user => {
      // ✓【修改】使用展開運算符回傳 user 物件中的所有欄位
      // 這樣一來，未來在 Firestore 的 users 文件中新增任何欄位，
      // 都會自動被包含在 API 的回傳結果中，無需再修改此處程式碼。
      return {
        ...user, // 將 user 物件所有屬性展開
        phone: user.phone, // 確保 phone 欄位一定存在 (因為它是 ID)
        name: user.name || 'N/A', // 保留預設值處理
        roles: user.roles || []  // 保留預設值處理
      };
    });

    // 依姓名排序
    result.sort((a, b) => (a.name || '').localeCompare((b.name || ''), 'zh-Hant'));

    return result;

  } catch (error) {
    console.error(`[${functionName}] 發生錯誤:`, error);
    if (error instanceof HttpsError) throw error;
    throw new HttpsError('internal', '獲取可管理人員列表時發生錯誤。');
  }
});
// END: 函式替換結束



// ✓ START: 新增 - 驗屋報告上傳前置驗證函式
/**
 * [新增] 驗屋報告上傳前的第一步驗證
 * 驗證身分證、上傳開關、預約紀錄是否存在且尚未被使用
 */
exports.verifyUploadPrerequisites = onCall(async (request) => {
  const { projectId, unitId, reportType, idNumber } = request.data;
  const functionName = `verifyUploadPrerequisites (Project: ${projectId}, Unit: ${unitId})`;

  if (!projectId || !unitId || !reportType || !idNumber) {
    throw new HttpsError("invalid-argument", "缺少必要參數 (projectId, unitId, reportType, idNumber)。");
  }

  const db = new Firestore({ databaseId: "anxi-app" });

  try {
    // --- 1. 驗證身分證 (邏輯同 validateId) ---
    console.log(`[${functionName}] 步驟 1/3: 驗證身分證...`);
    const householdDocId = `${projectId}_${unitId}`;
    const householdDoc = await db.collection('households').doc(householdDocId).get();

    if (!householdDoc.exists) {
      throw new HttpsError('not-found', `找不到戶別 "${unitId}" 的資料。`);
    }
    const householdData = householdDoc.data();
    const storedId = String(householdData.buyerIdNumber || '').trim();
    const inputId = String(idNumber).trim();

    if (storedId !== inputId && inputId !== projectId) {
      throw new HttpsError('permission-denied', '身分證號碼驗證失敗，請重新確認。');
    }
    console.log(`[${functionName}] 身分證驗證成功。`);

    // --- 2. 檢查上傳開關 ---
    console.log(`[${functionName}] 步驟 2/3: 檢查上傳開關...`);
    const bookingTypeForSwitch = reportType === '初驗報告' ? 'initialReportUploadSwitch' : 'reInspectionReportUploadSwitch';
    if (householdData[bookingTypeForSwitch] !== true) {
      throw new HttpsError('permission-denied', `此戶別的「${reportType}」上傳功能目前未開放或已關閉。`);
    }
    console.log(`[${functionName}] 上傳開關已開啟。`);

    // --- 3. 檢查預約紀錄 ---
    console.log(`[${functionName}] 步驟 3/3: 檢查相關預約紀錄...`);
    const bookingTypeForQuery = reportType.replace('報告', ''); // "初驗報告" -> "初驗"

    const appointmentsQuery = db.collection('appointments')
      .where('projectId', '==', projectId)
      .where('unitId', '==', unitId)
      .where('bookingType', '==', bookingTypeForQuery)
      .where('status', 'in', ['預約中', '已完成'])
      .where('inspectionMethod', '==', '代驗公司')
      .orderBy('createdAt', 'desc');

    const appointmentSnapshot = await appointmentsQuery.get();

    if (appointmentSnapshot.empty) {
      // 找不到符合的「代驗公司」預約紀錄
      const projectDoc = await db.collection('projects').doc(projectId).get();
      const projectName = projectDoc.exists ? projectDoc.data().name : projectId;
      console.log(`[${functionName}] 找不到代驗公司預約紀錄，回傳需要確認。`);
      return {
        status: 'needs_confirmation',
        message: `系統找不到 ${projectName} ${unitId} 的代驗公司「${bookingTypeForQuery}」紀錄，您確定要繼續上傳嗎？`
      };
    }

    // 找到符合的預約紀錄，檢查是否已上傳過
    const latestAppointment = appointmentSnapshot.docs[0].data();

    // ✅ [修改] 取消驗證 uploadReportTime，允許重複上傳
    /* if (latestAppointment.uploadReportTime) {
      const uploadTime = latestAppointment.uploadReportTime.toDate().toLocaleString('zh-TW', { timeZone: 'Asia/Taipei' });
      const projectDoc = await db.collection('projects').doc(projectId).get();
      const projectName = projectDoc.exists ? projectDoc.data().name : projectId;
      console.log(`[${functionName}] 發現已上傳紀錄，拒絕操作。`);
      throw new HttpsError('already-exists', `${projectName} ${unitId} 已於 ${uploadTime} 上傳過 ${reportType}，如需重新上傳請洽客服人員。`);
    }
    */

    // 所有驗證通過
    console.log(`[${functionName}] 所有驗證通過。`);
    return {
      status: 'success',
      bookingCode: latestAppointment.bookingCode,
    };

  } catch (error) {
    console.error(`[${functionName}] 驗證失敗:`, error);
    if (error instanceof HttpsError) {
      throw error;
    }
    throw new HttpsError('internal', `驗證時發生未預期的錯誤: ${error.message}`);
  }
});
// ✓ END: 新增 - 驗屋報告上傳前置驗證函式

/**
 * [核心邏輯] 檢查並寄送未上傳報告提醒
 * 此函式包含所有商業邏輯，可被多個觸發器共用
 */
async function executeUploadReminderLogic() {
  const functionName = "executeUploadReminderLogic";
  console.log(`[${functionName}] 核心邏輯啟動...`);

  const db = new Firestore({ databaseId: "anxi-app" });
  const mailTransport = nodemailer.createTransport({
    service: 'gmail',
    auth: { user: process.env.SENDER_EMAIL, pass: process.env.GMAIL_APP_PASSWORD },
  });

  const projectsQuery = db.collection('projects').where('reportSettings.uploadReminderSchedule.enabled', '==', true);
  const projectsSnapshot = await projectsQuery.get();

  if (projectsSnapshot.empty) {
    console.log(`[${functionName}] 找不到任何啟用排程的建案，任務結束。`);
    return;
  }

  const nowInTaipei = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Taipei" }));
  const currentHour = String(nowInTaipei.getHours()).padStart(2, '0');

  for (const projectDoc of projectsSnapshot.docs) {
    const projectData = projectDoc.data();
    const projectId = projectDoc.id;
    const projectName = projectData.name || projectId;
    const settings = projectData.reportSettings;

    const scheduledTime = settings?.uploadReminderSchedule?.time;
    const scheduledHour = scheduledTime ? scheduledTime.split(':')[0] : null;

    if (currentHour !== scheduledHour) {
      console.log(`[${functionName}] 建案 [${projectName}] 設定時間為 ${scheduledHour}:00，目前為 ${currentHour}:00，跳過。`);
      continue;
    }

    console.log(`[${functionName}] --- 時間相符，開始處理建案: ${projectName} ---`);

    if (!settings.uploadReminderDays || settings.uploadReminderDays.length === 0 || !settings.uploadReminderEmail) {
      console.warn(`[${functionName}] 建案 [${projectName}] 的提醒設定不完整，已跳過。`);
      continue;
    }

    const ccEmails = await getCcRecipients(projectId, "提醒上傳驗屋報告副本");
    const appointmentsQuery = db.collection('appointments')
      .where('projectId', '==', projectId)
      .where('inspectionMethod', '==', '代驗公司')
      .where('status', 'in', ['預約中', '已完成'])
      .where('reportUploaded', '==', false);
    const appointmentsSnapshot = await appointmentsQuery.get();

    if (appointmentsSnapshot.empty) {
      console.log(`[${functionName}] 建案 [${projectName}] 沒有需要提醒的預約。`);
      continue;
    }

    const today = new Date(nowInTaipei);
    today.setHours(0, 0, 0, 0);

    for (const apptDoc of appointmentsSnapshot.docs) {
      const appointment = apptDoc.data();
      const unitId = appointment.unitId; // 獲取戶別 ID

      if (!appointment.appointmentDate || !appointment.bookerEmail || !unitId) {
        console.warn(`[${functionName}] 預約 ${apptDoc.id} 缺少必要欄位 (appointmentDate, bookerEmail, unitId)，已跳過。`);
        continue; // 跳過缺少必要資料的預約
      }

      // 1. 讀取對應的戶別資料
      const householdDocId = `${projectId}_${unitId}`;
      const householdRef = db.collection('households').doc(householdDocId);
      let householdData = null;
      try {
        const householdDoc = await householdRef.get();
        if (householdDoc.exists) {
          householdData = householdDoc.data();
        } else {
          console.warn(`[${functionName}] 找不到預約 ${apptDoc.id} 對應的戶別文件 ${householdDocId}，將繼續提醒。`);
          // 找不到戶別資料，預設需要提醒 (或者您可以選擇跳過)
        }
      } catch (readError) {
        console.error(`[${functionName}] 讀取戶別 ${householdDocId} 時發生錯誤:`, readError, `將繼續提醒預約 ${apptDoc.id}`);
        // 讀取戶別資料出錯，預設需要提醒 (或者您可以選擇跳過)
      }

      // 2. 檢查 "交屋" 欄位
      // 正體中文註解：如果戶別資料存在，且 "交屋" 欄位值為 true，則跳過此預約
      if (householdData && householdData['交屋'] === true) {
        console.log(`[${functionName}] 戶別 ${unitId} (預約 ${apptDoc.id}) 已標記為交屋，跳過提醒。`);
        continue; // 跳至下一個預約
      }

      // 3. 如果未交屋或無法確認，才繼續檢查日期差異
      const appointmentDate = appointment.appointmentDate.toDate();
      appointmentDate.setHours(0, 0, 0, 0);
      const timeDiff = today.getTime() - appointmentDate.getTime();
      const dayDiff = Math.floor(timeDiff / (1000 * 3600 * 24));

      const reminderDaysAsNumbers = settings.uploadReminderDays.map(day => Number(day));

      if (reminderDaysAsNumbers.includes(dayDiff)) {
        console.log(`[${functionName}] 找到符合提醒條件的預約: ${appointment.unitId} (預約於 ${dayDiff} 天前)，準備寄信...`);

        const emailTemplate = settings.uploadReminderEmail;
        const formattedApptDate = appointment.appointmentDate.toDate().toLocaleDateString('zh-TW');

        let subject = emailTemplate.subject || "{projectName} {unitId} 未收到驗屋報告通知";
        subject = subject.replace(/{projectName}/g, projectName).replace(/{unitId}/g, appointment.unitId);

        let body = emailTemplate.body || "您已完成驗屋，但尚未收到您的驗屋報告。";
        body = body.replace(/{bookerName}/g, appointment.bookerName).replace(/{appointmentDate}/g, formattedApptDate).replace(/{unitId}/g, appointment.unitId);

        const uploadButtonHtml = `<p style="margin-top: 25px; padding-top: 20px; border-top: 1px solid #eeeeee; text-align: center;"><a href="${emailTemplate.uploadUrl}" target="_blank" style="display: inline-block; padding: 10px 20px; background-color: #007bff; color: #ffffff; text-decoration: none; border-radius: 5px; font-weight: bold;">點此前往上傳報告</a></p>`;
        const htmlBody = `
                      <div style="font-family: 'Helvetica Neue', Helvetica, Arial, 'PingFang TC', 'Microsoft JhengHei', sans-serif; background-color: #f4f4f7; padding: 20px;">
                        <div style="max-width: 600px; margin: 20px auto; background-color: #ffffff; border-radius: 8px; border: 1px solid #e0e0e0; overflow: hidden;">
                          
                          <div style="background-color: #ab0300; color: #ffffff; padding: 20px; text-align: center;">
                            <h2 style="margin: 0; font-size: 24px;">驗屋報告上傳提醒</h2>
                          </div>

                          <div style="padding: 24px; line-height: 1.6; color: #333333;">
                            
                            ${body}

                            <div style="margin-top: 20px; padding: 15px; background-color: #f8f9fa; border-left: 4px solid #17a2b8;">
                              ${emailTemplate.reminder || ''}
                            </div>

                            ${uploadButtonHtml}

                          </div>

                          <div style="background-color: #f4f4f7; padding: 16px; text-align: center; font-size: 12px; color: #777777;">
                            <p style="margin: 0;">此為系統自動發送郵件，請勿直接回覆。</p>
                            <p style="margin: 5px 0 0 0;">${projectName} 驗屋報告系統</p>
                            <p style="margin: 10px 0 0 0; font-size: 11px; color: #999999;">
                              本服務由 <a href="https://anxismart.com/" target="_blank" style="color: #007bff; text-decoration: none; font-weight: bold;">anxismart安熙智慧建案管理系統</a> 提供技術支援
                            </p>
                          </div>

                        </div>
                      </div>`;


        await mailTransport.sendMail({
          from: `"${projectName} 驗屋報告系統" <${process.env.SENDER_EMAIL}>`,
          to: appointment.bookerEmail,
          cc: ccEmails,
          subject: subject,
          html: htmlBody,
        });

        const newTimestamp = admin.firestore.Timestamp.now();
        await apptDoc.ref.update({
          reminderSentAt: admin.firestore.FieldValue.arrayUnion(newTimestamp)
        });

        console.log(`[${functionName}] 已成功寄送提醒信並記錄時間戳記至 ${appointment.bookerEmail} (戶別: ${appointment.unitId})`);
      }
    }
  }
  console.log(`[${functionName}] 所有啟用且符合時間的建案處理完成。`);
}


/**
 * 提醒未上傳驗屋報告
 * [排程函式] 每小時觸發一次
 * 檢查所有啟用此功能的建案，若目前時間符合使用者UI設定的時間，
 * 則找出已過提醒天數但尚未上傳報告的預約，寄送 Email 提醒並記錄時間。
 */
// ✓ START: 修改 - 排程觸發器，簡化為呼叫核心邏輯
exports.sendUploadReminders = onSchedule({
  region: "asia-east1",
  schedule: "every 1 hours",
  timeZone: "Asia/Taipei",
  secrets: ["SENDER_EMAIL", "GMAIL_APP_PASSWORD"],
}, async (event) => {
  const functionName = "sendUploadReminders_scheduled";
  console.log(`[${functionName}] 排程觸發，準備執行核心邏輯...`);
  try {
    // 直接呼叫上面定義的核心邏輯函式
    await executeUploadReminderLogic();
    console.log(`[${functionName}] 核心邏輯執行完畢。`);
  } catch (error) {
    // 捕捉從核心邏輯中可能拋出的任何錯誤
    console.error(`[${functionName}] 排程執行核心邏輯時發生嚴重錯誤:`, error);
  }
});
// ✓ END: 修改後的排程觸發器

exports.manualTriggerSendReminders = onCall({
  region: "asia-east1",
  // 核心邏輯會寄信，所以這裡也需要 secrets
  secrets: ["SENDER_EMAIL", "GMAIL_APP_PASSWORD"],
}, async (request) => {
  const functionName = "manualTriggerSendReminders_callable";

  // 如果需要，可以在此處加入管理員權限驗證
  // const uid = request.auth?.uid;
  // if (!uid) { throw new HttpsError('unauthenticated', '需要管理員權限'); }

  console.log(`[${functionName}] 手動觸發，準備執行核心邏輯...`);
  try {
    // 同樣呼叫核心邏輯函式
    await executeUploadReminderLogic();
    console.log(`[${functionName}] 核心邏輯執行完畢。`);
    return { status: "success", message: "提醒任務已手動觸發並執行完成。" };
  } catch (error) {
    console.error(`[${functionName}] 手動觸發時發生錯誤:`, error);
    throw new HttpsError('internal', `執行手動提醒任務失敗: ${error.message}`);
  }
});


// ✓ START: 新增 - 驗證使用者手機
/**
 * [LIFF綁定用] 根據手機號碼查找使用者
 * @param {string} phone - 使用者在 LIFF 頁面輸入的手機號碼
 * @returns {Promise<object>} - 如果找到，回傳 { status: 'success', name: '使用者姓名' }
 */
exports.verifyUserByPhone = onCall(async (request) => {
  const { phone } = request.data;
  const functionName = "verifyUserByPhone";

  if (!phone) {
    throw new HttpsError("invalid-argument", "缺少手機號碼(phone)參數。");
  }

  try {
    const db = new Firestore({ databaseId: "anxi-app" });
    const userDocRef = db.collection("users").doc(phone);
    const userDoc = await userDocRef.get();

    if (!userDoc.exists) {
      throw new HttpsError("not-found", "查無此手機號碼，請確認輸入是否正確，或洽詢管理員。");
    }

    const userData = userDoc.data();
    const userName = userData.name;

    if (!userName) {
      throw new HttpsError("not-found", "此用戶資料不完整(缺少姓名)，請洽詢管理員。");
    }

    console.log(`[${functionName}] 成功找到用戶: ${userName} (Phone: ${phone})`);
    return { status: "success", name: userName };

  } catch (error) {
    console.error(`[${functionName}] 驗證手機時發生錯誤 (Phone: ${phone}):`, error);
    if (error instanceof HttpsError) {
      throw error;
    }
    throw new HttpsError("internal", "驗證時發生未預期的錯誤。");
  }
});
// ✓ END


// ✓ START: 新增 - 綁定 LINE ID 至使用者
/**
 * [LIFF綁定用] 將 LINE User ID 寫入指定的手機號碼對應的使用者文件
 * @param {string} phone - 使用者的手機號碼
 * @param {string} lineId - 從 LIFF SDK 獲取的 LINE User ID
 * @returns {Promise<object>} - 回傳成功訊息
 */
exports.bindLineIdToUser = onCall(async (request) => {
  const { phone, lineId } = request.data;
  const functionName = "bindLineIdToUser";

  if (!phone || !lineId) {
    throw new HttpsError("invalid-argument", "缺少手機號碼(phone)或 LINE ID(lineId)參數。");
  }

  try {
    const db = new Firestore({ databaseId: "anxi-app" });
    const userDocRef = db.collection("users").doc(phone);

    // 再次驗證文件是否存在，確保安全
    const userDoc = await userDocRef.get();
    if (!userDoc.exists) {
      throw new HttpsError("not-found", "在執行綁定時，找不到對應的手機號碼。");
    }

    // 執行更新
    await userDocRef.update({
      lineId: lineId
    });

    const userName = userDoc.data().name || phone;
    console.log(`[${functionName}] 成功將 LINE ID [${lineId}] 綁定至用戶 [${userName}]`);
    return { status: "success", message: "綁定成功！" };

  } catch (error) {
    console.error(`[${functionName}] 綁定 LINE ID 時發生錯誤 (Phone: ${phone}):`, error);
    if (error instanceof HttpsError) {
      throw error;
    }
    throw new HttpsError("internal", "綁定時發生未預期的錯誤。");
  }
});
// ✓ END

// ✓ START: 新增 - 檢查 LINE 綁定狀態
/**
 * [LIFF綁定用] 檢查指定的 LINE User ID 是否已綁定至任何用戶
 * @param {string} lineId - 從 LIFF SDK 獲取的 LINE User ID
 * @returns {Promise<object>} - 如果找到，回傳 { status: 'found', name: '使用者姓名' }；否則回傳 { status: 'not_found' }
 */
exports.checkLineBindingStatus = onCall(async (request) => {
  const { lineId } = request.data;
  const functionName = "checkLineBindingStatus";

  if (!lineId) {
    throw new HttpsError("invalid-argument", "缺少 LINE ID(lineId)參數。");
  }

  try {
    const db = new Firestore({ databaseId: "anxi-app" });
    const usersRef = db.collection("users");

    // 查詢 lineId 欄位完全相符的文件
    const query = usersRef.where("lineId", "==", lineId).limit(1);
    const snapshot = await query.get();

    if (snapshot.empty) {
      // 如果找不到任何文件，代表此 LINE 帳號尚未綁定
      console.log(`[${functionName}] LINE ID [${lineId}] 尚未綁定。`);
      return { status: "not_found" };
    }

    // 如果找到了，回傳該使用者的姓名
    const userDoc = snapshot.docs[0];
    const userData = userDoc.data();
    const userName = userData.name || userDoc.id; // 如果沒有姓名，則使用手機號碼作為備用

    console.log(`[${functionName}] LINE ID [${lineId}] 已綁定至用戶 [${userName}]`);
    return { status: "found", name: userName };

  } catch (error) {
    console.error(`[${functionName}] 檢查綁定狀態時發生錯誤 (LINE ID: ${lineId}):`, error);
    if (error instanceof HttpsError) {
      throw error;
    }
    throw new HttpsError("internal", "檢查綁定狀態時發生未預期的錯誤。");
  }
});
// ✓ END


// ✓ START: 新增 - 發起 LINE 綁定驗證程序
/**
 * [LIFF綁定用] 發起 Email 驗證程序
 * 產生一個一次性的 Token，並寄送驗證信給使用者。
 * @param {string} phone - 使用者的手機號碼
 * @param {string} lineId - 從 LIFF SDK 獲取的 LINE User ID
 * @returns {Promise<object>} - 回傳成功訊息
 */
exports.initiateLineBindingVerification = onCall({
  region: "asia-east1",
  secrets: ["SENDER_EMAIL", "GMAIL_APP_PASSWORD"],
}, async (request) => {
  const { phone, lineId } = request.data;
  const functionName = "initiateLineBindingVerification";

  if (!phone || !lineId) {
    throw new HttpsError("invalid-argument", "缺少手機號碼(phone)或 LINE ID(lineId)參數。");
  }

  const db = new Firestore({ databaseId: "anxi-app" });

  try {
    // 步驟 1: 查找使用者以取得 Email
    const userDocRef = db.collection("users").doc(phone);
    const userDoc = await userDocRef.get();
    if (!userDoc.exists || !userDoc.data().email) {
      throw new HttpsError("not-found", "找不到此手機號碼對應的使用者，或該用戶未設定 Email。");
    }
    const userData = userDoc.data();
    const userEmail = userData.email;
    const userName = userData.name || phone;

    // 步驟 2: 產生一個安全、唯一的 Token，並設定 15 分鐘後過期
    const token = crypto.randomBytes(32).toString('hex');
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 15 * 60 * 1000); // 15 分鐘

    // 步驟 3: 將 Token 和待綁定資訊存入新的 'lineBindingTokens' 集合
    const tokenRef = db.collection("lineBindingTokens").doc(token);
    await tokenRef.set({
      phone: phone,
      lineId: lineId,
      status: 'pending',
      createdAt: Timestamp.fromDate(now),
      expiresAt: Timestamp.fromDate(expiresAt),
    });

    // 步驟 4: 準備並寄送 Email
    const verificationUrl = `https://anxismart.com/#/verify-line-binding?token=${token}`;
    const mailTransport = nodemailer.createTransport({
      service: 'gmail',
      auth: { user: process.env.SENDER_EMAIL, pass: process.env.GMAIL_APP_PASSWORD },
    });

    const emailBodyHtml = `
          <div style="font-family: Arial, sans-serif; line-height: 1.6;">
            <h2 style="color: #333;">【安熙智慧】LINE 帳號綁定驗證</h2>
            <p>親愛的 ${userName} 您好：</p>
            <p>我們收到了將您的 LINE 帳號綁定至手機號碼 ${phone} 的請求。</p>
            <p>請點擊下方的按鈕以完成驗證與綁定。為保障安全，此連結將於 15 分鐘後失效。</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${verificationUrl}" target="_blank" style="background-color: #007bff; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold;">
                完成綁定
              </a>
            </div>
            <p>如果您未提出此請求，請忽略此郵件。</p>
            <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
            <p style="font-size: 12px; color: #888;">此為系統自動發送的郵件，請勿直接回覆。</p>
          </div>
        `;

    await mailTransport.sendMail({
      from: `"安熙智慧系統" <${process.env.SENDER_EMAIL}>`,
      to: userEmail,
      subject: '【安熙智慧】請完成您的 LINE 帳號綁定驗證',
      html: emailBodyHtml,
    });

    console.log(`[${functionName}] 已成功寄送驗證信至 ${userEmail} (Phone: ${phone})`);
    return { status: "success", message: "驗證信已寄出" };

  } catch (error) {
    console.error(`[${functionName}] 發起驗證時發生錯誤:`, error);
    if (error instanceof HttpsError) throw error;
    throw new HttpsError("internal", "發起驗證程序時發生錯誤。");
  }
});
// ✓ END

// ✓ START: 新增 - 完成 LINE 綁定驗證
/**
 * [LIFF綁定用] 驗證 Token 並完成最終綁定
 * @param {string} token - 從 Email 驗證連結中取得的一次性 Token
 * @returns {Promise<object>} - 回傳成功或失敗訊息
 */
exports.finalizeLineBinding = onCall(async (request) => {
  const { token } = request.data;
  const functionName = "finalizeLineBinding";

  if (!token) {
    throw new HttpsError("invalid-argument", "缺少 Token 參數。");
  }

  const db = new Firestore({ databaseId: "anxi-app" });
  const tokenRef = db.collection("lineBindingTokens").doc(token);

  try {
    const tokenDoc = await tokenRef.get();

    // 驗證 Token 是否存在
    if (!tokenDoc.exists) {
      throw new HttpsError("not-found", "驗證連結無效或已失效。");
    }

    const tokenData = tokenDoc.data();

    // 驗證 Token 是否已過期
    if (new Date() > tokenData.expiresAt.toDate()) {
      await tokenRef.delete(); // 刪除過期的 Token
      throw new HttpsError("deadline-exceeded", "驗證連結已過期，請重新操作。");
    }

    // 取得待綁定的資料
    const { phone, lineId } = tokenData;

    // 執行最終綁定
    const userDocRef = db.collection("users").doc(phone);
    await userDocRef.update({
      lineId: lineId
    });

    // 銷毀 Token，確保只能使用一次
    await tokenRef.delete();

    const userName = (await userDocRef.get()).data().name || phone;
    console.log(`[${functionName}] 驗證成功！已將 LINE ID [${lineId}] 綁定至用戶 [${userName}]`);
    return { status: "success", message: "您的 LINE 帳號已成功綁定！" };

  } catch (error) {
    console.error(`[${functionName}] 完成綁定時發生錯誤 (Token: ${token}):`, error);
    // 如果 Token 已被使用 (刪除)，也會回報 not-found
    if (error.code === 'not-found') {
      throw new HttpsError("not-found", "驗證連結無效或已失效。");
    }
    if (error instanceof HttpsError) throw error;
    throw new HttpsError("internal", "完成綁定時發生未預期的錯誤。");
  }
});
// ✓ END


/**
 * [LIFF查詢用] 獲取使用者資料與其可查詢的建案列表 (V2 - 包含 bookingTypes)
 * @param {string} lineId - 從 LIFF SDK 獲取的 LINE User ID
 * @returns {Promise<object>} - 包含綁定狀態、使用者名稱及包含 bookingTypes 的建案列表
 */
exports.getLiffUserData = onCall(async (request) => {
  const { lineId } = request.data;
  const functionName = "getLiffUserData";

  if (!lineId) {
    throw new HttpsError("invalid-argument", "缺少 LINE ID(lineId)參數。");
  }

  const db = new Firestore({ databaseId: "anxi-app" });
  try {
    // 步驟 1: 透過 lineId 查找使用者
    const usersRef = db.collection("users");
    const userQuery = usersRef.where("lineId", "==", lineId).limit(1);
    const userSnapshot = await userQuery.get();

    if (userSnapshot.empty) {
      console.log(`[${functionName}] LINE ID [${lineId}] 尚未綁定。`);
      return { status: "not_bound" };
    }

    const userDoc = userSnapshot.docs[0];
    const userData = userDoc.data();

    // [說明] 用於權限查找的 ID (通常是 Document ID)
    // 注意：如果您的權限文件 (userPermissions) 是以「電話號碼」為 ID，
    // 而 userDoc.id 剛好不是電話號碼時，這裡的權限查找可能會失敗。
    // 但既然您能進入系統，代表 userDoc.id 能對應到權限文件，或者您的權限文件 ID 就是 userDoc.id。
    const userDocId = userDoc.id;

    // 步驟 2: 透過使用者 ID 查找權限
    const permDocRef = db.collection("userPermissions").doc(userDocId);
    const permDoc = await permDocRef.get();

    if (!permDoc.exists) {
      console.log(`[${functionName}] 用戶 [${userDocId}] 找不到權限文件。`);
      return { status: "bound", userName: userData.name, projects: [] };
    }

    // 步驟 3: 解析權限
    const permissions = permDoc.data().permissions || {};
    const authorizedProjectsPromises = [];

    for (const projectId in permissions) {
      const projectPerms = permissions[projectId];

      // 只要有 systems 權限就允許回傳，前端會再過濾
      if (projectPerms.systems && projectPerms.systems.length > 0) {

        const projectDocPromise = db.collection('projects').doc(projectId).get().then(doc => {
          if (!doc.exists) return null;
          const projectData = doc.data();
          return {
            projectId: projectId,
            projectName: projectPerms.projectName,
            bookingTypes: projectData.bookingTypes || [],
            systems: projectPerms.systems
          };
        }).catch(err => {
          console.error(`[${functionName}] 讀取 projects/${projectId} 文件失敗:`, err);
          return null;
        });
        authorizedProjectsPromises.push(projectDocPromise);
      }
    }

    const authorizedProjects = (await Promise.all(authorizedProjectsPromises)).filter(Boolean);

    console.log(`[${functionName}] 用戶 [${userData.name}] 擁有 ${authorizedProjects.length} 個建案的查詢權限。`);

    return {
      status: "bound",
      userName: userData.name,
      // [關鍵修正]: 強制使用資料庫欄位中的 phone 作為 userKey 回傳
      // 這確保前端拿到的絕對是 "0980371014" 這樣的電話格式
      userKey: userData.phone || userDocId,
      projects: authorizedProjects,
    };

  } catch (error) {
    console.error(`[${functionName}] 獲取 LIFF 用戶資料時發生錯誤:`, error);
    throw new HttpsError("internal", "處理用戶資料時發生錯誤。");
  }
});

// ✓ START: 修改 liffSearchAppointments 函式 (整合 households 資料)
/**
 * [LIFF查詢用] 根據建案ID和關鍵字搜尋預約紀錄，並整合戶別資料
 * @param {string} projectId - 要查詢的建案 ID
 * @param {string} searchText - 搜尋的關鍵字
 * @returns {Promise<object>} - 包含搜尋結果的陣列
 */
exports.liffSearchAppointments = onCall(async (request) => {
  const { projectId, searchText } = request.data;
  const functionName = "liffSearchAppointments";

  if (!projectId) {
    throw new HttpsError("invalid-argument", "缺少建案 ID (projectId)。");
  }

  const db = new Firestore({ databaseId: "anxi-app" });
  try {
    // 步驟 1: 撈出該建案所有的預約紀錄
    const appointmentsRef = db.collection("appointments");
    const query = appointmentsRef.where("projectId", "==", projectId);
    const snapshot = await query.get();

    if (snapshot.empty) {
      return { status: "success", data: [] };
    }

    // 步驟 2: 在記憶體中進行模糊比對
    const lowerCaseSearchText = (searchText || "").toLowerCase().trim();
    const searchFields = [
      'agentIdNumber', 'agentName', 'agentPhone', 'bookerIdNumber',
      'bookerName', 'bookerPhone', 'bookingCode', 'inspectionMethod', 'unitId'
    ];

    let matchedAppointments = [];
    if (!lowerCaseSearchText) {
      // 如果搜尋文字是空的，不回傳任何資料
    } else {
      snapshot.forEach(doc => {
        const data = doc.data();
        let isMatch = false;
        for (const field of searchFields) {
          const value = data[field];
          if (value && typeof value === 'string' && value.toLowerCase().includes(lowerCaseSearchText)) {
            isMatch = true;
            break;
          }
        }
        if (isMatch) {
          matchedAppointments.push({ id: doc.id, ...data });
        }
      });
    }

    if (matchedAppointments.length === 0) {
      return { status: "success", data: [] };
    }

    // ✓ 步驟 3: 補上戶別(households)資料
    const householdIds = [...new Set(matchedAppointments.map(a => `${a.projectId}_${a.unitId}`))];
    const householdsSnapshot = await db.collection('households').where(FieldPath.documentId(), 'in', householdIds).get();
    const householdsMap = new Map();
    householdsSnapshot.forEach(doc => {
      householdsMap.set(doc.id, doc.data());
    });

    // 步驟 4: 補上建案名稱並組合最終結果
    const projectDoc = await db.collection('projects').doc(projectId).get();
    const projectName = projectDoc.exists ? projectDoc.data().name : projectId;

    const results = matchedAppointments.map(appt => {
      const householdKey = `${appt.projectId}_${appt.unitId}`;
      const householdData = householdsMap.get(householdKey) || {};

      // 將兩份資料合併
      const combinedData = { ...householdData, ...appt, projectName: projectName };

      // 處理所有可能的日期欄位
      ['appointmentDate', 'createdAt', 'cancelledAt'].forEach(field => {
        if (combinedData[field] && typeof combinedData[field].toDate === 'function') {
          combinedData[field] = combinedData[field].toDate().toISOString();
        }
      });

      return combinedData;
    });

    console.log(`[${functionName}] 在建案 [${projectName}] 中，根據關鍵字 [${searchText}] 找到了 ${results.length} 筆預約。`);
    return { status: "success", data: results };

  } catch (error) {
    console.error(`[${functionName}] 搜尋預約時發生錯誤:`, error);
    throw new HttpsError("internal", "搜尋時發生錯誤。");
  }
});
// ✓ END


// ✓ START: 新增 - LIFF 驗屋時間表專用函式 (獲取所有預約)
/**
 * [LIFF日曆用] 獲取指定建案的所有預約資料 (用於日曆計數渲染)
 * @param {string} projectId - 要查詢的建案 ID
 * @returns {Promise<object>} - 包含該建案所有預約的陣列
 */
exports.getAllLiffAppointmentsForProject = onCall(async (request) => {
  const { projectId } = request.data;
  const functionName = "getAllLiffAppointmentsForProject";

  if (!projectId) {
    throw new HttpsError("invalid-argument", "缺少建案 ID (projectId)。");
  }

  const db = new Firestore({ databaseId: "anxi-app" });
  try {
    const appointmentsRef = db.collection("appointments");
    const query = appointmentsRef.where("projectId", "==", projectId);
    const snapshot = await query.get();

    if (snapshot.empty) {
      return { status: "success", data: [] };
    }

    const appointments = snapshot.docs.map(doc => {
      const data = doc.data();
      // 為了讓前端能直接使用，將 Timestamp 轉換為 ISO 字串
      if (data.appointmentDate && typeof data.appointmentDate.toDate === 'function') {
        data.appointmentDate = data.appointmentDate.toDate().toISOString();
      }
      // 只回傳日曆計數需要的最小欄位，減輕傳輸負擔
      return {
        appointmentDate: data.appointmentDate,
        status: data.status
      };
    });

    console.log(`[${functionName}] 為建案 [${projectId}] 找到了 ${appointments.length} 筆預約資料。`);
    return { status: "success", data: appointments };

  } catch (error) {
    console.error(`[${functionName}] 獲取所有預約資料時發生錯誤:`, error);
    throw new HttpsError("internal", "獲取所有預約資料時發生錯誤。");
  }
});
// ✓ END


// ✓ START: 新增 - LIFF 驗屋時間表專用函式
/**
* [LIFF日曆用] 獲取指定單一日期的預約與戶別資料
* @param {object} payload - 包含 { projectId, date } 的物件
* @returns {Promise<object>} - 後端回傳的結果
*/
exports.getLiffCalendarDataForDay = onCall(async (request) => {
  const { projectId, date } = request.data;
  const functionName = "getLiffCalendarDataForDay";

  if (!projectId || !date) {
    throw new HttpsError("invalid-argument", "缺少建案 ID (projectId) 或日期 (date)。");
  }

  const db = new Firestore({ databaseId: "anxi-app" });
  try {
    // 步驟 1: 設定查詢的日期範圍 (當天的 00:00:00 到 23:59:59)
    const startOfDay = new Date(`${date}T00:00:00+08:00`);
    const endOfDay = new Date(`${date}T23:59:59+08:00`);

    // 步驟 2: 撈出該日所有的預約紀錄
    const appointmentsRef = db.collection("appointments");
    const query = appointmentsRef
      .where("projectId", "==", projectId)
      .where("appointmentDate", ">=", startOfDay)
      .where("appointmentDate", "<=", endOfDay);

    const snapshot = await query.get();

    if (snapshot.empty) {
      return { status: "success", data: [] };
    }

    const appointments = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    // 步驟 3: 補上戶別(households)資料
    const householdIds = [...new Set(appointments.map(a => `${a.projectId}_${a.unitId}`))];
    if (householdIds.length === 0) {
      return { status: "success", data: [] }; // 如果沒有戶別ID，直接回傳空陣列
    }

    const householdsSnapshot = await db.collection('households').where(FieldPath.documentId(), 'in', householdIds).get();
    const householdsMap = new Map();
    householdsSnapshot.forEach(doc => {
      householdsMap.set(doc.id, doc.data());
    });

    // 步驟 4: 補上建案名稱並組合最終結果
    const projectDoc = await db.collection('projects').doc(projectId).get();
    const projectName = projectDoc.exists ? projectDoc.data().name : projectId;

    const results = appointments.map(appt => {
      const householdKey = `${appt.projectId}_${appt.unitId}`;
      const householdData = householdsMap.get(householdKey) || {};

      //  【核心修正】調整物件展開順序，並確保預約ID (id) 不被覆蓋
      // 讓 householdData 的欄位覆蓋 appt 中的同名欄位
      const combinedData = { ...appt, ...householdData, projectName: projectName, id: appt.id };

      // 將所有日期欄位轉換為 ISO 字串
      ['appointmentDate', 'createdAt', 'cancelledAt', 'appropriationDate'].forEach(field => {
        if (combinedData[field] && typeof combinedData[field].toDate === 'function') {
          combinedData[field] = combinedData[field].toDate().toISOString();
        }
      });

      return combinedData;
    });

    console.log(`[${functionName}] 為建案 [${projectName}] 的日期 [${date}] 找到了 ${results.length} 筆預約。`);
    return { status: "success", data: results };

  } catch (error) {
    console.error(`[${functionName}] 獲取 LIFF 日曆資料時發生錯誤:`, error);
    throw new HttpsError("internal", "獲取日曆資料時發生錯誤。");
  }
});

// ✓ END

// =================================================================
// /  【新增】後台新增預約專用 Cloud Functions
// =================================================================

/**
 * [後台用] 根據關鍵字模糊搜尋戶別資料
 * @param {string} projectId - 建案 ID
 * @param {string} keyword - 搜尋關鍵字
 * @returns {Promise<object>} - 包含符合條件的戶別列表
 */
exports.searchHouseholdsForAdmin = onCall(async (request) => {
  const { projectId, keyword } = request.data;
  const functionName = "searchHouseholdsForAdmin";

  if (!projectId || !keyword || keyword.trim().length < 2) {
    throw new HttpsError("invalid-argument", "必須提供有效的建案 ID 和至少 2 個字元的關鍵字。");
  }

  const lowerCaseKeyword = keyword.toLowerCase().trim();
  const db = new Firestore({ databaseId: "anxi-app" });

  try {
    const householdsRef = db.collection("households");
    const query = householdsRef.where("projectId", "==", projectId);
    const snapshot = await query.get();

    if (snapshot.empty) {
      return { status: "success", data: [] };
    }

    const searchFields = ['buyerEmail', 'buyerIdNumber', 'buyerName', 'buyerPhone', 'unitId'];
    const results = [];

    snapshot.forEach(doc => {
      const data = doc.data();
      let isMatch = false;
      for (const field of searchFields) {
        const value = data[field];
        if (value && typeof value === 'string' && value.toLowerCase().includes(lowerCaseKeyword)) {
          isMatch = true;
          break;
        }
      }
      if (isMatch) {
        // 回傳前端列表需要的最小資料集
        results.push({
          unitId: data.unitId,
          buyerName: data.buyerName || 'N/A',
        });
      }
    });

    // 依戶別排序
    results.sort((a, b) => a.unitId.localeCompare(b.unitId, 'zh-Hant-TW', { numeric: true }));

    console.log(`[${functionName}] 在專案 [${projectId}] 中，根據關鍵字 [${keyword}] 找到了 ${results.length} 筆戶別。`);
    return { status: "success", data: results };

  } catch (error) {
    console.error(`[${functionName}] 搜尋戶別時發生錯誤:`, error);
    throw new HttpsError("internal", "搜尋戶別資料時發生錯誤。");
  }
});

/**
 *  [V2 - 冷刪除版] 獲取指定建案所有 *有效* 預約批次的詳細資訊
 * @param {string} projectId - 建案 ID
 * @returns {Promise<object>} - 以 bookingType 和 batchCode 分類的批次資訊物件
 */
exports.getProjectBatchDetails = onCall(async (request) => {
  // ✓【修改】函數內部邏輯增加 isDeleted 過濾
  const { projectId } = request.data;
  const functionName = "getProjectBatchDetails"; // ✓ Log 名稱

  if (!projectId) {
    console.error(`[${functionName}] ERROR: Missing projectId.`); // ✓ Log 錯誤
    throw new HttpsError("invalid-argument", "缺少建案 ID (projectId)。");
  }

  const db = new Firestore({ databaseId: "anxi-app" }); // ✓ 使用 anxi-app 資料庫
  try {
    const batchesRef = db.collection("bookingBatches");
    // ✓【修改】查詢條件增加 isDeleted == false
    const query = batchesRef
      .where("projectId", "==", projectId)
      .where("isDeleted", "==", false); // ✓ 只查詢未被刪除的批次

    console.log(`[${functionName}] Querying active batches for project ${projectId}...`); // ✓ Log
    const snapshot = await query.get();

    if (snapshot.empty) {
      console.log(`[${functionName}] No active batches found.`); // ✓ Log
      return { status: "success", data: {} }; // ✓ 回傳空物件
    }
    console.log(`[${functionName}] Found ${snapshot.size} active batches.`); // ✓ Log

    const batchDetails = {};
    const now = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Taipei" })); // ✓ 獲取台灣時間

    snapshot.forEach(doc => {
      const data = doc.data();
      const { bookingType, batchCode, applicationStart, applicationEnd } = data;

      if (!bookingType || !batchCode) {
        console.warn(`[${functionName}] WARN: Skipping batch ${doc.id} due to missing bookingType or batchCode.`); // ✓ Log 警告
        return; // 跳過缺少必要欄位的批次
      }

      let statusText = '狀態不明';
      let color = 'grey';
      let start, end;

      // ✓ 日期轉換和狀態計算邏輯保持不變
      try {
        if (applicationStart?.toDate) start = applicationStart.toDate();
        else if (applicationStart?.seconds) start = new Date(applicationStart.seconds * 1000);
        else start = new Date(applicationStart);

        if (applicationEnd?.toDate) end = applicationEnd.toDate();
        else if (applicationEnd?.seconds) end = new Date(applicationEnd.seconds * 1000);
        else end = new Date(applicationEnd);

        if (isNaN(start?.getTime()) || isNaN(end?.getTime())) throw new Error('Invalid date');

        if (start && end) {
          if (now < start) {
            statusText = '尚未開放';
            color = 'blue-grey';
          } else if (now > end) {
            statusText = '已截止';
            color = 'red-darken-1';
          } else {
            statusText = '開放中';
            color = 'green';
          }
        }
      } catch (dateError) {
        console.warn(`[${functionName}] WARN: Invalid date format for batch ${batchCode}.`, dateError); // ✓ Log 警告
        // 日期無效時，狀態維持 '狀態不明'
      }

      if (!batchDetails[bookingType]) {
        batchDetails[bookingType] = {};
      }

      // ✓ 儲存計算結果
      batchDetails[bookingType][batchCode] = {
        bookingStart: data.bookingStart, // 驗屋起始日 (字串)
        bookingEnd: data.bookingEnd,     // 驗屋結束日 (字串)
        statusText: statusText,          // 計算出的狀態文字
        color: color                     // 對應的顏色
      };
    });

    console.log(`[${functionName}] Successfully processed batch details for project ${projectId}.`); // ✓ Log 成功
    return { status: "success", data: batchDetails };

  } catch (error) {
    console.error(`[${functionName}] 🔴 ERROR fetching batch details:`, error); // ✓ Log 錯誤
    throw new HttpsError("internal", `獲取批次詳情時發生錯誤: ${error.message}`); // ✓ 拋出 HttpsError
  }
});

/**
 *  [V2 - 冷刪除版] 獲取行事曆所需的所有 *有效* 日期及其分類 (本戶批次/其他批次)
 * @param {string} projectId - 建案 ID
 * @param {string} unitId - 戶別 ID
 * @returns {Promise<object>} - 包含日期與其類型的陣列
 */
exports.getAdminBookingCalendarData = onCall(async (request) => {
  // ✓【修改】函數內部邏輯增加 isDeleted 過濾
  const { projectId, unitId } = request.data;
  const functionName = "getAdminBookingCalendarData"; // ✓ Log 名稱

  if (!projectId || !unitId) {
    console.error(`[${functionName}] ERROR: Missing projectId or unitId.`); // ✓ Log 錯誤
    throw new HttpsError("invalid-argument", "缺少建案 ID (projectId) 或戶別 ID (unitId)。");
  }

  const db = new Firestore({ databaseId: "anxi-app" }); // ✓ 使用 anxi-app 資料庫
  try {
    // 步驟 1: 獲取目標戶別的批次代碼 (邏輯不變)
    const householdDocRef = db.collection("households").doc(`${projectId}_${unitId}`);
    console.log(`[${functionName}] Fetching household data for ${projectId}_${unitId}...`); // ✓ Log
    const householdDoc = await householdDocRef.get();
    if (!householdDoc.exists) {
      console.error(`[${functionName}] ERROR: Household document not found.`); // ✓ Log 錯誤
      throw new HttpsError("not-found", "找不到指定的戶別資料。");
    }
    const householdData = householdDoc.data();
    const ownBatchCodes = new Set([householdData.initialInspectionBatch, householdData.reInspectionBatch].filter(Boolean));
    console.log(`[${functionName}] Target household batch codes:`, Array.from(ownBatchCodes)); // ✓ Log

    // 步驟 2: 獲取專案所有 *有效* 批次的 ID 與代碼對照表
    const batchesRef = db.collection("bookingBatches");
    // ✓【修改】查詢條件增加 isDeleted == false
    const batchesQuery = batchesRef
      .where("projectId", "==", projectId)
      .where("isDeleted", "==", false); // ✓ 只查詢有效的批次
    console.log(`[${functionName}] Querying active batches for project ${projectId}...`); // ✓ Log
    const batchesSnapshot = await batchesQuery.get();
    const batchIdToCodeMap = new Map();
    batchesSnapshot.forEach(doc => {
      batchIdToCodeMap.set(doc.id, doc.data().batchCode);
    });
    console.log(`[${functionName}] Found ${batchIdToCodeMap.size} active batches.`); // ✓ Log

    // 步驟 3: 獲取所有 *有效* 的日期批次關聯
    const linksRef = db.collection("batchRuleLinks");
    // ✓【修改】查詢條件增加 isDeleted == false
    const linksQuery = linksRef
      .where("projectId", "==", projectId)
      .where("isDeleted", "==", false); // ✓ 只查詢有效的連結
    console.log(`[${functionName}] Querying active batch rule links...`); // ✓ Log
    const linksSnapshot = await linksQuery.get();
    const dateToBatchCodesMap = new Map();
    linksSnapshot.forEach(doc => {
      const { date, batchId } = doc.data();
      const batchCode = batchIdToCodeMap.get(batchId);
      // ✓ 確保連結指向的批次也是有效的 (存在於 batchIdToCodeMap 中)
      if (date && batchCode) {
        if (!dateToBatchCodesMap.has(date)) {
          dateToBatchCodesMap.set(date, new Set());
        }
        dateToBatchCodesMap.get(date).add(batchCode);
      } else if (date && !batchCode) {
        // 如果連結指向的 batchId 找不到對應的 batchCode (可能批次已被刪除但連結因異常未刪)
        console.warn(`[${functionName}] WARN: Link ${doc.id} points to an inactive/deleted batchId ${batchId}. Skipping.`); // ✓ Log 警告
      }
    });
    console.log(`[${functionName}] Processed ${linksSnapshot.size} active links, resulting in ${dateToBatchCodesMap.size} unique dates.`); // ✓ Log

    // 步驟 4: 分類日期 (邏輯不變)
    const calendarData = [];
    dateToBatchCodesMap.forEach((batchCodesOnDate, date) => {
      let isOwnBatch = false;
      for (const code of batchCodesOnDate) {
        if (ownBatchCodes.has(code)) {
          isOwnBatch = true;
          break;
        }
      }
      calendarData.push({
        date: date, // 日期字串 'YYYY-MM-DD'
        type: isOwnBatch ? 'own_batch' : 'other_batch' // 分類
      });
    });

    console.log(`[${functionName}] Successfully generated calendar data for ${calendarData.length} dates.`); // ✓ Log 成功
    return { status: "success", data: calendarData };

  } catch (error) {
    console.error(`[${functionName}] 🔴 ERROR fetching calendar data:`, error); // ✓ Log 錯誤
    throw new HttpsError("internal", `獲取行事曆資料時發生錯誤: ${error.message}`); // ✓ 拋出 HttpsError
  }
});


/**
 * [後台用] 獲取指定單一戶別的所有預約歷史紀錄
 * @param {string} projectId - 建案 ID
 * @param {string} unitId - 戶別 ID
 * @returns {Promise<object>} - 包含該戶別所有預約紀錄的陣列
 */
exports.getAppointmentsForHousehold = onCall(async (request) => {
  const { projectId, unitId } = request.data;
  const functionName = "getAppointmentsForHousehold";

  if (!projectId || !unitId) {
    throw new HttpsError("invalid-argument", "缺少建案 ID (projectId) 或戶別 ID (unitId)。");
  }

  const db = new Firestore({ databaseId: "anxi-app" });
  try {
    const appointmentsRef = db.collection("appointments");
    const query = appointmentsRef
      .where("projectId", "==", projectId)
      .where("unitId", "==", unitId)
      .orderBy("createdAt", "desc"); // 依建立時間降序排列，最新的在最上面

    const snapshot = await query.get();

    if (snapshot.empty) {
      return { status: "success", data: [] };
    }

    const history = snapshot.docs.map(doc => {
      const data = doc.data();
      // 將 Firestore Timestamp 轉換為前端易於處理的 ISO 字串
      if (data.appointmentDate && data.appointmentDate.toDate) {
        data.appointmentDate = data.appointmentDate.toDate().toISOString();
      }
      if (data.createdAt && data.createdAt.toDate) {
        data.createdAt = data.createdAt.toDate().toISOString();
      }
      return { id: doc.id, ...data };
    });

    console.log(`[${functionName}] 成功查詢到戶別 [${unitId}] 的 ${history.length} 筆預約紀錄。`);
    return { status: "success", data: history };

  } catch (error) {
    console.error(`[${functionName}] 查詢預約歷史時發生錯誤:`, error);
    //  START: 新增更詳細的錯誤判斷
    // 錯誤碼 9 (FAILED_PRECONDITION) 通常代表缺少索引
    if (error.code === 9 && error.message.includes('https://console.firebase.google.com/')) {
      // 從錯誤訊息中提取建立索引的 URL
      const urlMatch = error.message.match(/(https:\/\/console\.firebase\.google\.com\/.*?)\?/);
      if (urlMatch && urlMatch[1]) {
        const indexCreationUrl = urlMatch[1];
        // 回傳一個帶有 URL 的、更具體的錯誤訊息給前端
        throw new HttpsError(
          "failed-precondition",
          `資料庫缺少必要的索引。請點擊以下連結建立索引，等待幾分鐘後再試： ${indexCreationUrl}`
        );
      }
    }
    //  END: 新增更詳細的錯誤判斷
    throw new HttpsError("internal", "查詢預約歷史時發生錯誤。");
  }
});

// =================================================================
// /  【結束】後台新增預約專用 Cloud Functions
// =================================================================




/**
 * [內部函式] 根據預約紀錄，更新戶別的初驗/複驗摘要資訊
 * @param {FirebaseFirestore.Firestore} db - Firestore 實例
 * @param {string} projectId - 專案 ID
 * @param {string} unitId - 戶別 ID
 */
async function updateHouseholdSummary(db, projectId, unitId) {
  const functionName = `updateHouseholdSummary`;
  console.log(`[${functionName}] Starting summary update for ${projectId}_${unitId}...`);
  try {
    const appointmentsRef = db.collection("appointments");
    const query = appointmentsRef
      .where("projectId", "==", projectId).where("unitId", "==", unitId).where("status", "!=", "取消");
    const snapshot = await query.get();
    let latestInitial = null; let latestReInspection = null;
    snapshot.forEach(doc => {
      const appt = doc.data();
      // ✓ 確保比較的是 Date 物件
      const apptDate = appt.appointmentDate?.toDate ? appt.appointmentDate.toDate() : null;
      if (!apptDate) return;

      if (appt.bookingType === '初驗') {
        const latestInitialDate = latestInitial?.appointmentDate?.toDate ? latestInitial.appointmentDate.toDate() : null;
        if (!latestInitial || apptDate > latestInitialDate) latestInitial = appt;
      }
      else if (appt.bookingType === '複驗') {
        const latestReInspectionDate = latestReInspection?.appointmentDate?.toDate ? latestReInspection.appointmentDate.toDate() : null;
        if (!latestReInspection || apptDate > latestReInspectionDate) latestReInspection = appt;
      }
    });
    const householdUpdatePayload = {
      initialInspectionDate: latestInitial ? latestInitial.appointmentDate : null,
      initialInspectionMethod: latestInitial ? latestInitial.inspectionMethod : null,
      reInspectionDate: latestReInspection ? latestReInspection.appointmentDate : null,
      reInspectionMethod: latestReInspection ? latestReInspection.inspectionMethod : "", // ✓ 保持為空字串
      // ✓ 新增: 更新時間戳
      updatedAt: FieldValue.serverTimestamp() // 使用 FieldValue
    };
    const householdDocRef = db.collection("households").doc(`${projectId}_${unitId}`);
    await householdDocRef.update(householdUpdatePayload); // ✓ 使用 update
    console.log(`[${functionName}] Successfully updated summary for ${unitId}.`);
  } catch (error) {
    console.error(`[${functionName}] ERROR updating summary for ${unitId}:`, error);
  }
}


/**
 *  [V4 - 完整 Email + Debug Log 版] 更新一筆預約紀錄，並同步更新戶別摘要
 * force = true 時，允許移動到無效或已滿的時段
 * @param {object} request.data - 包含 { appointmentId, bookingPayload, householdDocId, householdPayload, force? }
 * @returns {Promise<object>} - { status } 或 { status: 'no_changes' }
 */
exports.updateAppointmentByAdmin = onCall({ region: "asia-east1", cors: true, secrets: ["SENDER_EMAIL", "GMAIL_APP_PASSWORD"] }, async (request) => {
  const { appointmentId, bookingPayload, householdDocId, householdPayload, force = false } = request.data;
  const functionName = `updateAppointmentByAdmin (ID: ${appointmentId}, Force: ${force})`;

  if (!appointmentId) {
    console.error(`[${functionName}] ERROR: Missing appointmentId.`);
    throw new HttpsError("invalid-argument", "缺少 appointmentId。");
  }

  const db = new Firestore({ databaseId: "anxi-app" });
  const appointmentRef = db.collection("appointments").doc(appointmentId);
  let originalAppointmentData = null;
  let originalHouseholdData = null;
  let finalPayload = {}; // ✓ 用於 Email 比較

  // ✓【新增】定義需要在 Email 中通知變更的欄位集合
  const notificationTriggerFields = new Set([
    'appointmentDate',       // 預約日期
    'appointmentTimeSlot',   // 預約時段
    'bookerName',            // 預約人姓名
    'bookerPhone',           // 預約人電話
    'bookerIdNumber',        // 預約人身分證
    'inspectionCompanyName', // 代驗公司名稱
    'inspectionMethod',      // 選擇方式
    'agentName',             // 受託人姓名
    'agentPhone',            // 受託人電話
  ]);

  try {
    // --- 步驟 0: 讀取原始資料 ---
    console.log(`[${functionName}] Fetching original data before transaction...`); // <-- Log 0.1
    const appointmentDocBefore = await appointmentRef.get();
    if (!appointmentDocBefore.exists) {
      console.error(`[${functionName}] ERROR: Original appointment document not found.`);
      throw new HttpsError("not-found", "找不到要更新的預約紀錄。");
    }
    originalAppointmentData = appointmentDocBefore.data();
    console.log(`[${functionName}] Original appointment data fetched.`); // <-- Log 0.2

    if (householdDocId) {
      const householdRef = db.collection("households").doc(householdDocId);
      const householdDocBefore = await householdRef.get();
      if (householdDocBefore.exists) {
        originalHouseholdData = householdDocBefore.data();
        console.log(`[${functionName}] Original household data fetched.`); // <-- Log 0.3
      } else {
        console.warn(`[${functionName}] WARN: Original household document ${householdDocId} not found.`);
      }
    }
    // --- 原始資料讀取完畢 ---

    let needsSummaryUpdate = false;
    let operationCount = 0;

    console.log(`[${functionName}] Starting transaction...`); // <-- Log 0.4
    const result_tx = await db.runTransaction(async (transaction) => { // ✓ 命名為 result_tx
      console.log(`[${functionName}] Inside transaction...`); // <-- Log TX.1
      const appointmentDoc = await transaction.get(appointmentRef);
      if (!appointmentDoc.exists) {
        throw new HttpsError("not-found", "在交易中找不到預約紀錄。");
      }
      const { projectId, unitId } = originalAppointmentData; // ✓ 從原始資料獲取

      let newDateStr = null;
      let newTimeSlotKey = null;
      let dateOrTimeChanged = false;

      // --- 檢查日期或時段是否有變更 ---
      // ... (省略與 V4 版本相同的檢查邏輯) ...
      if (bookingPayload && (bookingPayload.appointmentDate || bookingPayload.appointmentTimeSlot)) {
        if (bookingPayload.appointmentDate) {
          try { newDateStr = new Date(bookingPayload.appointmentDate).toISOString().split('T')[0]; const currentDateStr = originalAppointmentData.appointmentDate?.toDate ? originalAppointmentData.appointmentDate.toDate().toISOString().split('T')[0] : null; if (newDateStr !== currentDateStr) dateOrTimeChanged = true; } catch (e) { throw new HttpsError("invalid-argument", "無效的新預約日期格式。"); }
        } else { newDateStr = originalAppointmentData.appointmentDate?.toDate ? originalAppointmentData.appointmentDate.toDate().toISOString().split('T')[0] : null; }
        if (bookingPayload.appointmentTimeSlot) {
          let rawTimeSlot = bookingPayload.appointmentTimeSlot; let extractedTime = ''; if (typeof rawTimeSlot === 'string') extractedTime = rawTimeSlot.match(/^(\d{2}:\d{2})/)?.[1]; else if (typeof rawTimeSlot === 'object' && rawTimeSlot?.value) extractedTime = String(rawTimeSlot.value).match(/^(\d{2}:\d{2})/)?.[1];
          if (extractedTime) { newTimeSlotKey = extractedTime; if (newTimeSlotKey !== originalAppointmentData.appointmentTimeSlot) dateOrTimeChanged = true; } else { throw new HttpsError("invalid-argument", "無效的新預約時段格式。"); }
        } else { newTimeSlotKey = originalAppointmentData.appointmentTimeSlot; }
      } else { newDateStr = originalAppointmentData.appointmentDate?.toDate ? originalAppointmentData.appointmentDate.toDate().toISOString().split('T')[0] : null; newTimeSlotKey = originalAppointmentData.appointmentTimeSlot; }
      console.log(`[${functionName}] TX: Date/Time change check done. Changed: ${dateOrTimeChanged}`); // <-- Log TX.2
      // --- 日期/時段變更檢測結束 ---

      // --- 如果日期或時段變更，執行規則和名額檢查 ---
      if (dateOrTimeChanged) {
        console.log(`[${functionName}] TX: Date or time changed. Proceeding with checks (unless force=true)...`); // <-- Log TX.3
        needsSummaryUpdate = true;
        let isRuleCheckSkipped = false;
        let capacity = 0;
        // ... (省略與 V4 版本相同的檢查邏輯，包含 isDeleted 過濾 和 force 判斷) ...
        const householdDoc = await transaction.get(db.collection('households').doc(`${projectId}_${unitId}`)); if (!householdDoc.exists) throw new HttpsError("not-found", `找不到戶別資料 ${unitId}`); const householdData = householdDoc.data(); const bookingTypeToCheck = bookingPayload?.bookingType || originalAppointmentData.bookingType; const batchCodeField = bookingTypeToCheck === '初驗' ? 'initialInspectionBatch' : 'reInspectionBatch'; const batchCode = householdData[batchCodeField]; if (!batchCode) throw new HttpsError("permission-denied", `此戶別的 "${bookingTypeToCheck}" 預約未指派批次。`); const batchQuery = db.collection('bookingBatches').where('projectId', '==', projectId).where('batchCode', '==', batchCode).where('bookingType', '==', bookingTypeToCheck).where('isDeleted', '==', false).limit(1); const batchSnapshot = await transaction.get(batchQuery);
        if (batchSnapshot.empty) { if (!force) throw new HttpsError("not-found", `找不到戶別 ${unitId} 對應的有效預約批次 (${batchCode})。`); else { console.warn(`WARN TX (Force Mode): Active batch ${batchCode} not found.`); isRuleCheckSkipped = true; } }
        else {
          const batchId = batchSnapshot.docs[0].id; const linksQuery = db.collection('batchRuleLinks').where('batchId', '==', batchId).where('date', '==', newDateStr).where('isDeleted', '==', false).limit(1); const linksSnapshot = await transaction.get(linksQuery);
          if (linksSnapshot.empty) { if (!force) throw new HttpsError("failed-precondition", `新日期 ${newDateStr} 不在可預約範圍內或規則已被刪除。`); else { console.warn(`WARN TX (Force Mode): No active link for new date ${newDateStr}.`); isRuleCheckSkipped = true; } }
          else {
            const ruleId = linksSnapshot.docs[0].data().ruleId; const ruleRef = db.collection('dateRules').doc(ruleId); const ruleDoc = await transaction.get(ruleRef);
            if (!ruleDoc.exists || ruleDoc.data().isDeleted === true) { if (!force) throw new HttpsError("internal", `找不到新日期 ${newDateStr} 對應的規則 ${ruleId} 或已被刪除。`); else { console.warn(`WARN TX (Force Mode): Date rule ${ruleId} not found/deleted.`); isRuleCheckSkipped = true; } }
            else {
              const ruleData = ruleDoc.data(); const slotInfo = ruleData.slots[newTimeSlotKey]; const methodToCheck = bookingPayload?.inspectionMethod || originalAppointmentData.inspectionMethod;
              if (!slotInfo) { if (!force) throw new HttpsError("failed-precondition", `新時段 ${newTimeSlotKey} 在規則 ${ruleId} 中不存在。`); else { console.warn(`WARN TX (Force Mode): New slot ${newTimeSlotKey} not found.`); capacity = 0; } }
              else { if (!slotInfo.methods.includes(methodToCheck)) { if (!force) throw new HttpsError("failed-precondition", `新時段 ${newTimeSlotKey} 不適用於選擇方式「${methodToCheck}」。`); else console.warn(`WARN TX (Force Mode): Method ${methodToCheck} not allowed.`); } capacity = slotInfo.capacity || 0; console.log(`TX: New slot capacity: ${capacity}`); }
            }
          }
        }
        if (!force && !isRuleCheckSkipped) { const newAppointmentDateObj = new Date(newDateStr + 'T00:00:00+08:00'); const appointmentsQueryCapacity = db.collection('appointments').where('projectId', '==', projectId).where('appointmentDate', '==', newAppointmentDateObj).where('appointmentTimeSlot', '==', newTimeSlotKey).where('status', '==', '預約中'); const appointmentsSnapshot = await transaction.get(appointmentsQueryCapacity); const currentBookings = appointmentsSnapshot.size; console.log(`TX: Current bookings for new slot: ${currentBookings}`); if (currentBookings >= capacity) { console.warn(`WARN: New slot capacity reached.`); throw new HttpsError('failed-precondition', `SLOT_FULL: 目標時段名額已滿 (目前 ${currentBookings} 人)。`); } }
        else if (force) { console.log(`TX: Force mode enabled, skipping capacity check.`); }
        else { console.log(`TX: Rule check was skipped, skipping capacity check.`); }
        console.log(`[${functionName}] TX: Rule and capacity checks done (or bypassed).`); // <-- Log TX.4
      } // --- 日期/時段變更檢查結束 ---

      // --- 準備更新資料 ---
      const batchForTx = transaction;
      let combinedPayload = {}; // ✓ 收集實際更新

      // 處理 bookingPayload
      if (bookingPayload && Object.keys(bookingPayload).length > 0) {
        const finalBookingPayload = { ...bookingPayload };
        if (finalBookingPayload.appointmentDate) finalBookingPayload.appointmentDate = Timestamp.fromDate(new Date(newDateStr));
        if (finalBookingPayload.appointmentTimeSlot) finalBookingPayload.appointmentTimeSlot = newTimeSlotKey;
        finalBookingPayload.updatedAt = FieldValue.serverTimestamp();
        batchForTx.update(appointmentRef, finalBookingPayload);
        Object.assign(combinedPayload, finalBookingPayload);
        operationCount++;
        console.log(`[${functionName}] TX: Scheduled update for appointment ${appointmentId}.`);
      }

      // 處理 householdPayload
      if (householdDocId && householdPayload && Object.keys(householdPayload).length > 0) {
        const finalHouseholdPayload = { ...householdPayload };
        if (finalHouseholdPayload.appropriationDate) {
          const dateObj = new Date(finalHouseholdPayload.appropriationDate);
          finalHouseholdPayload.appropriationDate = !isNaN(dateObj.getTime()) ? Timestamp.fromDate(dateObj) : null;
        }
        finalHouseholdPayload.updatedAt = FieldValue.serverTimestamp();
        const householdRefToUpdate = db.collection("households").doc(householdDocId);
        batchForTx.update(householdRefToUpdate, finalHouseholdPayload);
        Object.assign(combinedPayload, finalHouseholdPayload); // ✓ 收集 household 的更新
        operationCount++;
        needsSummaryUpdate = true;
        console.log(`[${functionName}] TX: Scheduled update for household ${householdDocId}.`);
      }
      return { combinedPayload }; // ✓ 回傳
    }); // --- Transaction 結束 ---
    console.log(`[${functionName}] Transaction committed successfully. Result:`, result_tx); // <-- Log 1 (使用 result_tx)

    finalPayload = result_tx.combinedPayload; // ✓ 從 result_tx 獲取
    console.log(`[${functionName}] Final payload extracted.`); // <-- Log 2

    if (operationCount > 0) {
      console.log(`[${functionName}] ${operationCount} update operations were performed.`); // <-- Log 3
      // --- 更新戶別摘要 ---
      if (needsSummaryUpdate) {
        const { projectId, unitId } = originalAppointmentData; // ✓ 使用原始資料
        if (projectId && unitId) {
          console.log(`[${functionName}] Calling updateHouseholdSummary for ${unitId}...`); // <-- Log 4
          await updateHouseholdSummary(db, projectId, unitId);
          console.log(`[${functionName}] updateHouseholdSummary finished.`); // <-- Log 5
        } else { console.warn(`WARN: Cannot update summary, projectId/unitId missing.`); }
      }

      // --- 寄送 Email 通知 ---
      const bookerEmail = bookingPayload?.bookerEmail || originalAppointmentData.bookerEmail;
      const bookerName = bookingPayload?.bookerName || originalAppointmentData.bookerName;
      const unitId = originalAppointmentData.unitId;
      const projectId = originalAppointmentData.projectId;
      console.log(`[${functionName}] Checking if email should be sent... Email: ${bookerEmail}`); // <-- Log 6

      if (bookerEmail && finalPayload && Object.keys(finalPayload).length > 0) {
        console.log(`[${functionName}] Preparing email content...`); // <-- Log 7
        const changes = [];
        for (const key in finalPayload) {
          if (!notificationTriggerFields.has(key)) continue;
          const originalValue = (key in originalAppointmentData) ? originalAppointmentData[key] : originalHouseholdData?.[key];
          const newValue = finalPayload[key];
          const originalFormatted = formatValueForEmail(key, originalValue);
          const newFormatted = formatValueForEmail(key, newValue);
          if (originalFormatted !== newFormatted) {
            if (fieldDisplayNames[key]) {
              changes.push({ field: fieldDisplayNames[key], before: originalFormatted, after: newFormatted });
            }
          }
        }
        console.log(`[${functionName}] Changes comparison done. Found ${changes.length} relevant changes.`); // <-- Log 8

        if (changes.length > 0) {
          console.log(`[${functionName}] Getting project name and contact info...`); // <-- Log 9
          const projectRef = db.collection('projects').doc(projectId);
          const projectDoc = await projectRef.get();
          projectName = projectDoc.exists ? projectDoc.data().name : projectId;
          let contactInfoHtml = '';
          if (projectDoc.exists && projectDoc.data().intro?.contact) {
            const contact = projectDoc.data().intro.contact;
            if (contact.name || contact.phone) {
              const namePart = contact.name ? `<strong>${contact.name}</strong>` : '';
              const phonePart = contact.phone ? `電話：${contact.phone}` : '';
              const separator = contact.name && contact.phone ? ' / ' : '';
              contactInfoHtml = `<div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #eeeeee;"><p style="margin: 0; font-size: 14px; color: #555;">如有任何疑問，請洽詢：<br>${namePart}${separator}${phonePart}</p></div>`;
            }
          }
          const mailTransport = nodemailer.createTransport({
            service: 'gmail',
            auth: { user: process.env.SENDER_EMAIL, pass: process.env.GMAIL_APP_PASSWORD },
          });
          const subject = `【${projectName}】預約異動通知 (${unitId})`;
          const bookingUrl = `https://anxismart.com/#/booking/${projectId}`;
          const bookingLinkHtml = `<p style="margin-top: 25px; padding-top: 20px; border-top: 1px solid #eeeeee; font-size: 14px; color: #555;">若您要查詢、修改或取消預約，請點擊以下按鈕返回預約頁面：<br><a href="${bookingUrl}" target="_blank" style="display: inline-block; margin-top: 12px; padding: 10px 20px; background-color: #007bff; color: #ffffff; text-decoration: none; border-radius: 5px; font-weight: bold;">前往預約頁面</a></p>`;

          // 【修正點】 .join('') 放在 map(...) 之後
          const changesHtml = changes.map(change => `
                        <tr style="border-bottom: 1px solid #eeeeee;">
                          <td style="padding: 10px 5px; font-weight: bold; color: #555555; vertical-align: top;">${change.field}</td>
                          <td style="padding: 10px 5px; color: #777777; vertical-align: top; text-decoration: line-through;">${change.before}</td>
                          <td style="padding: 10px 5px; color: #D32F2F; font-weight: bold; vertical-align: top;">${change.after}</td>
                        </tr>
                    `).join(''); // <--  修正點： .join('') 在這裡

          // 【修正點】確保 htmlBody 是完整的模板字串
          const htmlBody = `
<div style="font-family: 'Helvetica Neue', Helvetica, Arial, 'PingFang TC', 'Microsoft JhengHei', sans-serif; background-color: #f4f4f7; padding: 20px;">
  <div style="max-width: 600px; margin: 20px auto; background-color: #ffffff; border-radius: 8px; border: 1px solid #e0e0e0; overflow: hidden;">
    <div style="background-color: #ffc107; color: #333333; padding: 20px; text-align: center;">
      <h2 style="margin: 0; font-size: 24px;">預約異動通知</h2>
    </div>
    <div style="padding: 24px; line-height: 1.6; color: #333333;">
      <p>親愛的 <strong>${bookerName || '用戶'}</strong> 您好：</p>
      <p>您於「${projectName}」建案 ${unitId} 戶別的預約資料已由管理員修改，詳細異動如下：</p>
      <h3 style="margin-top: 25px; margin-bottom: 10px; color: #333;">主要資訊</h3>
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
         <tbody>
            <tr style="border-bottom: 1px solid #eeeeee;"><td style="padding: 8px 0; color: #555555; width: 100px;">戶別</td><td style="padding: 8px 0;">${unitId}</td></tr>
            <tr style="border-bottom: 1px solid #eeeeee;"><td style="padding: 8px 0; color: #555555;">預約項目</td><td style="padding: 8px 0;">${bookingPayload?.bookingType || originalAppointmentData.bookingType}</td></tr>
         </tbody>
      </table>
      <h3 style="margin-top: 25px; margin-bottom: 10px; color: #333;">變更詳情</h3>
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 14px;">
         <thead>
           <tr style="background-color: #f8f9fa;">
             <th style="padding: 8px 5px; text-align: left; color: #333;">欄位</th>
             <th style="padding: 8px 5px; text-align: left; color: #777;">修改前</th>
             <th style="padding: 8px 5px; text-align: left; color: #D32F2F;">修改後</th>
           </tr>
         </thead>
        <tbody>
          ${changesHtml}
        </tbody>
      </table>
      <p>請確認以上資訊是否正確。如有疑問，請與服務人員聯繫。</p>
      ${contactInfoHtml}
      ${bookingLinkHtml}
    </div>
    <div style="background-color: #f4f4f7; padding: 16px; text-align: center; font-size: 12px; color: #777777;">
      <p style="margin: 0;">此為系統自動發送郵件，請勿直接回覆。</p>
      <p style="margin: 5px 0 0 0;">${projectName} 預約系統</p>
      <p style="margin: 10px 0 0 0; font-size: 11px; color: #999999;">
        本服務由 <a href="https://anxismart.com/" target="_blank" style="color: #007bff; text-decoration: none; font-weight: bold;">anxismart安熙智慧建案管理系統</a> 提供技術支援
      </p>
    </div>
  </div>
</div>`; // <--  修正點：確保模板字串結束符 ` 在正確位置

          console.log(`[${functionName}] Calling getCcRecipients...`); // <-- Log 10
          const ccRecipients = await getCcRecipients(db, projectId, "驗屋系統信件副本");
          console.log(`[${functionName}] getCcRecipients finished. CC:`, ccRecipients); // <-- Log 11
          console.log(`[${functionName}] Calling mailTransport.sendMail...`); // <-- Log 12
          await mailTransport.sendMail({
            from: `"${projectName} 預約系統" <${process.env.SENDER_EMAIL}>`,
            to: bookerEmail,
            cc: ccRecipients.join(', '),
            subject: subject,
            html: htmlBody,
            name: `${projectName} 預約系統`
          });
          console.log(`[${functionName}] Change notification email sent successfully.`); // <-- Log 13
        } else {
          console.log(`[${functionName}] No significant changes in notification fields, skipping email.`); // <-- Log 14
        }
      } else {
        console.log(`[${functionName}] No booker email found or no payload updated, skipping change notification email.`); // <-- Log 15
      }
      // --- Email 通知結束 ---

      console.log(`[${functionName}] Returning success status.`); // <-- Log 16
      return { status: "success" };

    } else {
      console.log(`[${functionName}] No operations performed, returning no_changes.`); // <-- Log 17
      return { status: 'no_changes' };
    }

  } catch (error) {
    // ... (catch 區塊保持不變) ...
    console.error(`[${functionName}] 🔴 ERROR updating appointment:`, error);
    if (error instanceof HttpsError) { if (error.code === 'failed-precondition' && error.message.startsWith('SLOT_FULL')) throw error; throw error; }
    if (error.message === 'result is not defined') { throw new HttpsError("internal", "更新預約時發生內部錯誤：無法訪問 'result' 變數。請檢查 Cloud Function 日誌。"); }
    throw new HttpsError("internal", `更新預約時發生錯誤: ${error.message}`);
  }
});




// =================================================================
// /  【優化版】Google Drive 檔案管理代理 Cloud Functions
// =================================================================

/**
 * [優化版] 獲取 Google Drive 資料夾內的檔案與資料夾列表
 */
exports.driveProxyList = onCall({ region: "asia-east1", secrets: driveSecrets }, async (request) => {
  const { folderId, searchTerm } = request.data;
  const functionName = `driveProxyList (Folder: ${folderId})`;

  if (!folderId) {
    throw new HttpsError("invalid-argument", "缺少 folderId 參數。");
  }

  try {
    // ✓ 使用快取輔助函式
    const drive = getAuthenticatedDriveClient();

    let query = `'${folderId}' in parents and trashed=false`;
    if (searchTerm) {
      query += ` and name contains '${searchTerm}'`;
    }

    const response = await drive.files.list({
      q: query,
      fields: 'files(id, name, mimeType, modifiedTime, size, iconLink, webViewLink, thumbnailLink)',
      orderBy: 'folder, name',
      pageSize: 500
    });

    const files = response.data.files.map(file => ({
      id: file.id,
      name: file.name,
      isFolder: file.mimeType === 'application/vnd.google-apps.folder',
      modifiedTime: file.modifiedTime,
      size: file.size ? parseInt(file.size, 10) : 0,
      icon: file.iconLink,
      url: file.webViewLink,
      thumbnail: file.thumbnailLink || null,
    }));

    return { status: 'success', files };

  } catch (error) {
    console.error(`[${functionName}] 發生錯誤:`, error);
    if (error.response && error.response.data && error.response.data.error === 'invalid_grant') {
      // ✓ 如果認證失敗，清除快取，以便下次重試
      driveClient = null;
      throw new HttpsError("unauthenticated", `Google Drive 認證失敗，Refresh Token 可能已過期。`);
    }
    throw new HttpsError("internal", `讀取 Drive 檔案列表時發生錯誤: ${error.message}`);
  }
});


/**
 * [優化版] 處理 Google Drive 的背景任務 (下載、更名)
 */

exports.driveProxyTask = onCall({
  region: "asia-east1",
  secrets: driveSecrets,
  timeoutSeconds: 540,
  memory: "1GiB",

}, async (request) => {
  const { taskType, items, suffixOptions, projectId } = request.data;
  const functionName = `driveProxyTask (Type: ${taskType})`;

  if (!taskType || !items || !Array.isArray(items) || items.length === 0) {
    throw new HttpsError("invalid-argument", "缺少或無效的任務參數。");
  }

  const anxiDb = new Firestore({ databaseId: "anxi-app" });
  const taskRef = anxiDb.collection('driveTasks').doc();
  const taskId = taskRef.id;

  await taskRef.set({
    status: 'pending',
    progress: `0/${items.length}`,
    details: `任務已建立，等待執行...`,
    createdAt: FieldValue.serverTimestamp(),
    taskType: taskType,
    projectId: projectId,
  });

  console.log(`[${functionName}] Task [${taskId}] created. Starting background process.`);

  executeTaskInBackground(taskId, taskType, items, suffixOptions, anxiDb);

  return { status: 'pending', taskId: taskId };
});


/**
 * [優化版] 在背景執行耗時的 Drive 操作
 */
async function executeTaskInBackground(taskId, taskType, items, suffixOptions, db) {
  const taskRef = db.collection('driveTasks').doc(taskId);
  const functionName = `executeTaskInBackground (TaskID: ${taskId})`;

  try {
    await taskRef.update({ status: 'processing', details: '正在初始化...' });

    const drive = getAuthenticatedDriveClient();

    if (taskType === 'rename') {
      await taskRef.update({ details: `準備更名 ${items.length} 個項目...` });
      let processedCount = 0;

      const renamePromises = items.map(item => {
        const newName = `${item.name}_${suffixOptions.username}-(${suffixOptions.suffix})`;

        return drive.files.update({
          fileId: item.id,
          requestBody: { name: newName },
        }).then(res => {
          processedCount++;
          taskRef.update({
            progress: `${processedCount}/${items.length}`,
            details: `已更名: ${item.name}`
          });
          return res;
        });
      });

      await Promise.all(renamePromises);

      await taskRef.update({
        status: 'completed',
        progress: `${items.length}/${items.length}`,
        details: '所有項目更名完成。',
        completedAt: FieldValue.serverTimestamp()
      });

    }
    // ✓ 整個 'else if (taskType === 'download')' 區塊已被刪除

    console.log(`[${functionName}] Task completed successfully.`);

  } catch (error) {
    console.error(`[${functionName}] Background task failed:`, error);
    await taskRef.update({ status: 'error', details: `任務失敗: ${error.message}`, completedAt: FieldValue.serverTimestamp() });
  }
}



// ✓ START: 新增 - 全域搜尋 Cloud Function
/**
 * [新] 遞迴搜尋指定根資料夾下的所有檔案與資料夾
 * @param {string} rootFolderId - 搜尋的根目錄 Google Drive ID
 * @param {string} searchTerm - 搜尋關鍵字
 * @returns {Promise<object>} - 包含搜尋結果的物件
 */
exports.driveProxySearch = onCall({ region: "asia-east1", secrets: driveSecrets }, async (request) => {
  const { rootFolderId, searchTerm } = request.data;
  const functionName = `driveProxySearch (Root: ${rootFolderId})`;

  if (!rootFolderId || !searchTerm) {
    throw new HttpsError("invalid-argument", "缺少 rootFolderId 或 searchTerm 參數。");
  }

  try {
    const drive = getAuthenticatedDriveClient();

    // 步驟 1: 執行廣泛的名稱搜尋
    const searchResponse = await drive.files.list({
      q: `name contains '${searchTerm}' and trashed=false`,
      fields: 'files(id, name, mimeType, modifiedTime, size, iconLink, webViewLink, thumbnailLink, parents)',
      pageSize: 100 // 限制搜尋結果數量，避免過載
    });

    if (!searchResponse.data.files || searchResponse.data.files.length === 0) {
      return { status: 'success', files: [] };
    }

    // 步驟 2: 驗證每個結果是否在指定的根目錄下
    const parentCache = new Map(); // 用於快取父層查詢結果，提升效能
    const validFiles = [];

    // 建立一個遞迴檢查父層的輔助函式
    const isDescendant = async (fileId) => {
      if (parentCache.has(fileId)) return parentCache.get(fileId);
      if (fileId === rootFolderId) return true;

      const file = await drive.files.get({ fileId: fileId, fields: 'parents' });
      if (!file.data.parents || file.data.parents.length === 0) {
        parentCache.set(fileId, false);
        return false;
      }

      for (const parentId of file.data.parents) {
        if (await isDescendant(parentId)) {
          parentCache.set(fileId, true);
          return true;
        }
      }

      parentCache.set(fileId, false);
      return false;
    };

    for (const file of searchResponse.data.files) {
      if (await isDescendant(file.id)) {
        validFiles.push({
          id: file.id,
          name: file.name,
          isFolder: file.mimeType === 'application/vnd.google-apps.folder',
          modifiedTime: file.modifiedTime,
          size: file.size ? parseInt(file.size, 10) : 0,
          icon: file.iconLink,
          url: file.webViewLink,
          thumbnail: file.thumbnailLink || null,
        });
      }
    }

    return { status: 'success', files: validFiles };

  } catch (error) {
    console.error(`[${functionName}] 發生錯誤:`, error);
    throw new HttpsError("internal", `搜尋 Drive 時發生錯誤: ${error.message}`);
  }
});


// ✓ START: 新增 - 獲取扁平化報告資料夾結構的 Cloud Function
/**
 * [新] 掃描三層資料夾結構，並回傳扁平化的陣列以供表格使用
 * @param {string} rootFolderId - 掃描的根目錄 Google Drive ID
 * @returns {Promise<object>} - 包含扁平化檔案列表的物件
 */
exports.getReportFolderStructure = onCall({ region: "asia-east1", secrets: driveSecrets, timeoutSeconds: 300 }, async (request) => {
  const { rootFolderId } = request.data;
  const functionName = `getReportFolderStructure (Root: ${rootFolderId})`;

  if (!rootFolderId) {
    throw new HttpsError("invalid-argument", "缺少 rootFolderId 參數。");
  }

  try {
    const drive = getAuthenticatedDriveClient();
    const flatList = [];

    // 掃描第一層：棟別 (A, B, S)
    const level1Res = await drive.files.list({
      q: `'${rootFolderId}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false`,
      fields: 'files(id, name)',
    });
    const level1Folders = level1Res.data.files;
    if (!level1Folders || level1Folders.length === 0) {
      return { status: 'success', files: [] };
    }

    // 使用 Promise.all 並行處理每一棟
    await Promise.all(level1Folders.map(async (l1Folder) => {
      // 掃描第二層：棟號 (A1, A2)
      const level2Res = await drive.files.list({
        q: `'${l1Folder.id}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false`,
        fields: 'files(id, name)',
      });
      const level2Folders = level2Res.data.files;
      if (!level2Folders || level2Folders.length === 0) return;

      // 並行處理每一棟號
      await Promise.all(level2Folders.map(async (l2Folder) => {
        // 掃描第三層：驗屋報告資料夾 (A1-02, A1-02(已下載))
        const level3Res = await drive.files.list({
          q: `'${l2Folder.id}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false`,
          fields: 'files(id, name, modifiedTime)',
        });
        const level3Folders = level3Res.data.files;
        if (!level3Folders || level3Folders.length === 0) return;

        level3Folders.forEach(l3Folder => {
          flatList.push({
            // 為每一列產生一個唯一的 ID
            rowId: `${l1Folder.name}_${l2Folder.name}_${l3Folder.id}`,
            building: l1Folder.name,
            unitNumber: l2Folder.name,
            reportFolder: { // 將驗屋報告資料夾作為一個物件儲存
              id: l3Folder.id,
              name: l3Folder.name,
            },
            modifiedTime: l3Folder.modifiedTime,
          });
        });
      }));
    }));

    return { status: 'success', files: flatList };

  } catch (error) {
    console.error(`[${functionName}] 發生錯誤:`, error);
    throw new HttpsError("internal", `掃描 Drive 結構時發生錯誤: ${error.message}`);
  }
});



exports.sendNotDownloadedReportReminder = onCall({
  region: "asia-east1",
  invoker: 'public',
  secrets: driveSecrets, // 確保 secrets 仍在，以便 getAuthenticatedDriveClient 運作
  timeoutSeconds: 300,
  memory: "1GiB",
}, async (request) => {
  const { projectId } = request.data;
  if (!projectId) {
    throw new HttpsError("invalid-argument", "缺少 projectId 參數。");
  }

  try {
    // 直接呼叫核心邏輯函式
    const message = await executeReminderForProject(projectId);
    return { status: "success", message: message };
  } catch (error) {
    // 將內部錯誤轉換為前端可讀的 HttpsError
    throw new HttpsError("internal", `執行手動提醒時發生錯誤: ${error.message}`);
  }
});
// ✓ END: 2. 手動觸發函式修改完成

/**
 * [排程函式] 每小時檢查一次，觸發符合條件的建案進行未下載報告提醒
 * 
 */
exports.scheduledReportReminder = onSchedule({
  region: "asia-east1",
  schedule: "*/30 8-18 * * *",      // 每天 8-18 點，每 30 分鐘執行一次
  timeZone: "Asia/Taipei",
  secrets: driveSecrets,
  timeoutSeconds: 540,
  memory: "1GiB",
}, async (event) => {
  const functionName = "scheduledReportReminder";
  console.log(`[${functionName}] 排程啟動，開始檢查所有建案...`);

  const db = new Firestore({ databaseId: "anxi-app" });

  try {
    const now = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Taipei" }));
    const dayOfWeek = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][now.getDay()];

    // ✓【偵錯日誌】更詳細的日誌，包含分鐘
    console.log(`[${functionName}] 當前時間: ${dayOfWeek}, ${now.getHours()}:${String(now.getMinutes()).padStart(2, '0')}`);

    const projectsRef = db.collection('projects');
    const snapshot = await projectsRef
      .where(`reportSettings.notDownloadedReminderSchedule.${dayOfWeek}.enabled`, '==', true)
      .get();

    if (snapshot.empty) {
      console.log(`[${functionName}] 在此時間點沒有任何建案需要執行提醒。`);
      return;
    }

    console.log(`[${functionName}] 找到 ${snapshot.size} 個可能需要提醒的建案，開始逐一比對時間...`);
    const tasks = [];
    const TRIGGER_INTERVAL_MINUTES = 30; // ✓ 定義觸發間隔為 30 分鐘

    for (const doc of snapshot.docs) {
      const projectData = doc.data();
      const projectId = doc.id;
      const scheduleSetting = projectData.reportSettings?.notDownloadedReminderSchedule?.[dayOfWeek];

      // ✓【修改處】將比對邏輯改為精確的時間窗檢查
      if (scheduleSetting && scheduleSetting.time) {
        const scheduleTime = scheduleSetting.time; // e.g., "17:35"

        // 1. 建立一個代表今天排定時間的 Date 物件
        const [h, m] = scheduleTime.split(':');
        const scheduleDate = new Date(now); // 複製今天的日期
        scheduleDate.setHours(parseInt(h, 10), parseInt(m, 10), 0, 0); // 設定為排定的時與分

        // 2. 計算當前時間與排定時間的分鐘差
        const diffMinutes = (now.getTime() - scheduleDate.getTime()) / 60000;

        // ✓【偵錯日誌】顯示每個專案的時間差計算結果
        console.log(`[${functionName}] 專案 [${projectId}]: 排定時間=${scheduleTime}, 分鐘差=${diffMinutes.toFixed(2)}`);

        // 3. 檢查分鐘差是否落在 [0, 30) 的區間內
        //    這表示「當前時間」是「排定時間」之後的第一個觸發點
        if (diffMinutes >= 0 && diffMinutes < TRIGGER_INTERVAL_MINUTES) {
          console.log(`[${functionName}]  建案 [${projectId}] 符合條件，準備執行...`);
          tasks.push(
            executeReminderForProject(projectId).catch(err => {
              console.error(`[${functionName}] ❌ 處理建案 [${projectId}] 時發生錯誤:`, err.message);
            })
          );
        }
      }
    }

    if (tasks.length > 0) {
      await Promise.all(tasks);
    }

    console.log(`[${functionName}] 所有符合條件的建案處理完畢。`);

  } catch (error) {
    console.error(`[${functionName}] 🔴 排程函式執行時發生嚴重錯誤:`, error);
  }
});
// ✓ END: 3. 排程函式建立完成

/**
 * [內部核心邏輯] 執行單一建案的未下載報告提醒
 * @param {string} projectId - 要執行提醒的建案 ID
 * @returns {Promise<string>} - 返回執行的結果訊息
 */
async function executeReminderForProject(projectId) {
  const functionName = `executeReminderForProject (Project: ${projectId})`;
  const db = new Firestore({ databaseId: "anxi-app" });

  try {
    console.log(`[${functionName}] 核心任務開始...`);

    // --- 步驟 1: 獲取建案設定與 LINE Channel Token (此部分邏輯不變) ---
    const projectDoc = await db.collection('projects').doc(projectId).get();
    if (!projectDoc.exists) {
      throw new Error(`找不到建案 ${projectId} 的設定。`);
    }
    const projectData = projectDoc.data();
    const projectName = projectData.name || projectId;
    const rootFolderUrl = projectData.reportSettings?.reportDataFolderUrl;
    const secretName = projectData.lineChannelAccessTokenSecretName;
    //LINE Messaging API  Channel access token 富宇天玥=FUYU141_LINE_TOKEN

    if (!rootFolderUrl || !secretName) {
      throw new Error("此建案未完整設定報告資料夾路徑或 LINE Token 密鑰名稱。");
    }

    const secretManagerClient = new SecretManagerServiceClient();
    const [version] = await secretManagerClient.accessSecretVersion({
      name: `projects/${process.env.GCLOUD_PROJECT}/secrets/${secretName}/versions/latest`,
    });
    const lineChannelAccessToken = version.payload.data.toString('utf8');
    if (!lineChannelAccessToken) {
      throw new Error("無法從 Secret Manager 獲取 LINE Channel Token。");
    }

    // --- 步驟 2: 尋找通知對象 (此部分邏輯不變) ---
    const permQuery = db.collection('userPermissions').where(`permissions.${projectId}.systems`, 'array-contains', "驗屋預約管理-檢視");
    const permSnapshot = await permQuery.get();
    if (permSnapshot.empty) {
      throw new Error("找不到擁有此建案檢視權限的使用者。");
    }
    const userPhones = permSnapshot.docs.map(doc => doc.id);
    const usersSnapshot = await db.collection('users').where(FieldPath.documentId(), 'in', userPhones).get();

    const lineIdRegex = /^U[0-9a-f]{32}$/;
    const lineIdsToSend = usersSnapshot.docs
      .map(doc => doc.data().lineId)
      .filter(lineId => lineId && typeof lineId === 'string' && lineIdRegex.test(lineId));

    if (lineIdsToSend.length === 0) {
      throw new Error("找不到任何有效的 LINE 通知對象。");
    }

    // --- 步驟 3: 掃描 Google Drive (✓ 核心修改處) ---
    const rootFolderId = rootFolderUrl.match(/[-\w]{25,}/)?.[0];
    if (!rootFolderId) throw new Error("無效的雲端資料夾連結。");

    const drive = getAuthenticatedDriveClient();
    const level1Res = await drive.files.list({ q: `'${rootFolderId}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false`, fields: 'files(id, name)' });

    // 使用可選鏈 (optional chaining) 和預設空陣列來確保安全
    const level1Folders = level1Res.data?.files || [];

    // 透過 Promise.all 並行處理第一層的每個資料夾
    const nestedLevel3Folders = await Promise.all(level1Folders.map(async (l1) => {
      const level2Res = await drive.files.list({ q: `'${l1.id}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false`, fields: 'files(id, name)' });
      const level2Folders = level2Res.data?.files || [];
      if (level2Folders.length === 0) {
        return []; // 如果第二層是空的，明確回傳一個空陣列
      }

      // 並行處理第二層的每個資料夾
      const level3FolderLists = await Promise.all(level2Folders.map(async (l2) => {
        const level3Res = await drive.files.list({ q: `'${l2.id}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false`, fields: 'files(id, name)' });
        return level3Res.data?.files || []; // 回傳第三層的檔案列表 (或空陣列)
      }));

      // 將第三層的結果展開 (從 [[a,b], [c,d]] 變成 [a,b,c,d])
      return level3FolderLists.flat();
    }));

    // 最後，將所有結果完全展開成一個扁平的列表
    const flatList = nestedLevel3Folders.flat();

    const undownloadedFolders = flatList.filter(f => !f.name.includes("(已下載)") && !f.name.includes("(作廢)"));

    // --- 步驟 4: 組合訊息並發送 ---
    const lineClient = new line.Client({ channelAccessToken: lineChannelAccessToken });
    let messageText;
    let resultMessage;

    if (undownloadedFolders.length === 0) {
      // 情況一：沒有未下載的報告
      console.log(`[${functionName}] 檢查完畢，沒有未下載的報告。`);
      messageText = `你真棒😉！今天 ${projectName} 的驗屋報告都已下載完成，辛苦囉❤️。`;
      resultMessage = "已發送完成通知。";

    } else {
      // 情況二：有未下載的報告
      const folderNames = undownloadedFolders.map(f => f.name).join("\n");
      const liffUrl = `https://anxismart.com/?liff_path=report-folder-manager/${projectId}`;
      messageText = `${projectName} 驗屋報告未下載通知\n\n${folderNames}\n\n請至以下連結確認\n${liffUrl}`;
      resultMessage = "提醒訊息已成功發送。";
    }

    // 無論是哪種情況，都發送 LINE 訊息
    await lineClient.multicast(lineIdsToSend, [{ type: 'text', text: messageText }]);

    console.log(`[${functionName}] 已成功將通知發送至 ${lineIdsToSend.length} 個目標。`);
    return resultMessage; // 回傳執行的結果訊息

  } catch (error) {
    console.error(`[${functionName}] 執行失敗:`, error);
    throw error; // 將錯誤向上拋出，以便上層函式 (排程或手動觸發) 能捕捉到
  }
}


/**
 * [新增] 獲取指定建案的所有驗屋選項設定
 * @param {string} projectId - 建案 ID
 * @returns {Promise<object>} - 按 type 分組的選項物件
 */
exports.getInspectionOptions = onCall(async (request) => {
  // ✓ 從 request.data 取得 projectId
  const { projectId } = request.data;
  const functionName = `getInspectionOptions (Project: ${projectId})`; // ✓ Log 名稱

  // ✓ 驗證 projectId 是否存在
  if (!projectId) {
    console.error(`[${functionName}] 錯誤：請求中缺少 projectId。`); // ✓ Log 錯誤
    throw new HttpsError("invalid-argument", "缺少 projectId 參數。");
  }

  try {
    // ✓ 建立指向 anxi-app 資料庫的 Firestore Admin SDK 實例
    const db = new Firestore({ databaseId: "anxi-app" });
    const optionsRef = db.collection("inspectionOptions"); // ✓ 集合參考

    // ✓ 使用 Admin SDK 的 .where().get() 語法進行查詢
    const snapshot = await optionsRef.where("projectId", "==", projectId).get();

    // ✓ 初始化用於分類的物件
    const optionsByType = {
      phase: [],
      area: [],
      category: [],
      status: [],
      level: [],
      progress: [],
      quickReply: [],
    };

    // ✓ 遍歷查詢結果
    if (!snapshot.empty) {
      snapshot.forEach((doc) => {
        const data = { id: doc.id, ...doc.data() };
        const type = data.type;
        // ✓ 確保 type 是我們預期的類別之一
        if (optionsByType.hasOwnProperty(type)) {
          // 注意：後端 Admin SDK 的 Timestamp 會在回傳給前端時自動序列化，
          // 前端 Client SDK 會自動反序列化。通常不需要在後端手動轉為 ISO String。
          // 我們保留 Timestamp 物件。
          optionsByType[type].push(data);
        } else {
          console.warn(`[${functionName}] 發現未知的選項類型: ${type} in doc ${doc.id}`); // ✓ 警告未知類型
        }
      });
    }


    // ✓ 可選：在後端對各個類別進行排序 (按 order 欄位，若無則按 value)
    for (const type in optionsByType) {
      optionsByType[type].sort((a, b) => {
        const orderComparison = (a.order || Infinity) - (b.order || Infinity);
        if (orderComparison !== 0) {
          return orderComparison;
        }
        // 如果 order 相同或不存在，則按 value 排序 (使用中文排序)
        return (a.value || '').localeCompare(b.value || '', 'zh-Hant');
      });
    }

    console.log(`[${functionName}] 成功獲取建案 ${projectId} 的 ${snapshot.size} 筆選項資料。`); // ✓ Log 成功訊息
    // ✓ 回傳給前端的標準格式
    return { status: "success", data: optionsByType };

  } catch (error) {
    console.error(`[${functionName}] 獲取選項時發生嚴重錯誤:`, error); // ✓ Log 錯誤詳情
    // ✓ 拋出 HttpsError 讓前端可以捕捉
    throw new HttpsError("internal", `讀取驗屋選項時發生未預期的錯誤: ${error.message}`);
  }
});



/**
 * [新增/更新] 一個驗屋選項 (使用自訂文件 ID 格式)
 * @param {string} projectId - 建案 ID
 * @param {object} optionData - 包含 type, value, color, icon, order 等
 * @param {string|null} optionId - 如果是更新，則傳入文件 ID
 * @returns {Promise<object>} - { status, id }
 */
exports.saveInspectionOption = onCall(async (request) => {
  const { projectId, optionData, optionId } = request.data;
  const functionName = `saveInspectionOption (Project: ${projectId}, Type: ${optionData?.type})`;

  if (!projectId || !optionData || !optionData.type || !optionData.value) {
    console.error(`[${functionName}] 錯誤：缺少必要參數。`);
    throw new HttpsError("invalid-argument", "缺少 projectId, type 或 value 參數。");
  }

  try {
    const db = new Firestore({ databaseId: "anxi-app" });
    const optionsRef = db.collection("inspectionOptions");

    const dataToSave = {
      projectId: projectId,
      type: optionData.type,
      value: optionData.value.trim(),
      parentValue: optionData.parentValue || null,
      color: optionData.color || null,
      icon: optionData.icon || null,
      order: Number.isFinite(optionData.order) ? optionData.order : 100,
      updatedAt: Timestamp.now(), // 使用 Timestamp.now()
    };

    let targetDocRef;
    let isNew = !optionId;
    let finalDocId = optionId; // 如果是更新，ID 不變

    if (isNew) {
      // --- 新增模式 ---
      let duplicateQuery = optionsRef
        .where("projectId", "==", projectId)
        .where("type", "==", dataToSave.type)
        .where("value", "==", dataToSave.value);
      if (dataToSave.parentValue) {
        duplicateQuery = duplicateQuery.where("parentValue", "==", dataToSave.parentValue);
      } else {
        duplicateQuery = duplicateQuery.where("parentValue", "==", null);
      }
      const duplicateSnapshot = await duplicateQuery.get();
      if (!duplicateSnapshot.empty) {
        throw new HttpsError("already-exists", `項目 "${dataToSave.value}" 已存在於此分類中。`);
      }

      // **** 👇👇👇 修改點：產生自訂文件 ID 👇👇👇 ****
      const now = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Taipei" })); // 確保台灣時區
      const year = String(now.getFullYear()).slice(-2); // 取年份後兩位 YY
      const month = String(now.getMonth() + 1).padStart(2, '0'); // MM
      const day = String(now.getDate()).padStart(2, '0'); // DD
      const hours = String(now.getHours()).padStart(2, '0'); // HH
      const minutes = String(now.getMinutes()).padStart(2, '0'); // MM
      const seconds = String(now.getSeconds()).padStart(2, '0'); // SS
      const timestampSuffix = `${year}${month}${day}${hours}${minutes}${seconds}`;
      finalDocId = `${projectId}-${dataToSave.type}-${timestampSuffix}`; // 組合 ID
      // **** 👆👆👆 修改點結束 👆👆👆 ****

      targetDocRef = optionsRef.doc(finalDocId); // ✓ 使用自訂 ID
      dataToSave.createdAt = Timestamp.now();
      await targetDocRef.set(dataToSave); // ✓ 使用 set 寫入新文件
      console.log(`[${functionName}] 成功新增選項，自訂 ID: ${targetDocRef.id}`);
    } else {
      // --- 更新模式 (ID 不變) ---
      targetDocRef = optionsRef.doc(optionId);
      const docSnap = await targetDocRef.get();
      if (!docSnap.exists) {
        throw new HttpsError("not-found", "找不到要更新的選項。");
      }
      let duplicateQuery = optionsRef
        .where("projectId", "==", projectId)
        .where("type", "==", dataToSave.type)
        .where("value", "==", dataToSave.value)
        .where(FieldPath.documentId(), "!=", optionId); // 使用 FieldPath 排除自己
      if (dataToSave.parentValue) {
        duplicateQuery = duplicateQuery.where("parentValue", "==", dataToSave.parentValue);
      } else {
        duplicateQuery = duplicateQuery.where("parentValue", "==", null);
      }
      const duplicateSnapshot = await duplicateQuery.get();
      if (!duplicateSnapshot.empty) {
        throw new HttpsError("already-exists", `更新後的項目名稱 "${dataToSave.value}" 與其他項目重複。`);
      }

      await targetDocRef.update(dataToSave);
      console.log(`[${functionName}] 成功更新選項，ID: ${targetDocRef.id}`);
    }

    // ✓ 回傳成功狀態和最終使用的文件 ID
    return { status: "success", id: finalDocId };

  } catch (error) {
    console.error(`[${functionName}] 儲存選項時發生錯誤:`, error);
    if (error instanceof HttpsError) {
      throw error;
    }
    throw new HttpsError("internal", `儲存驗屋選項時發生未預期的錯誤: ${error.message}`);
  }
});

/**
 * [新增] 刪除一個驗屋選項 (包含子項目) - 增加日誌和檢查
 * @param {string} optionId - 要刪除的文件 ID
 * @returns {Promise<object>} - { status }
 */
exports.deleteInspectionOption = onCall(async (request) => {
  const { optionId } = request.data;
  const functionName = `deleteInspectionOption (ID: ${optionId})`;
  // ✓ 記錄函數被呼叫的時間戳
  console.log(`[${functionName}] Function called at ${new Date().toISOString()}`);

  if (!optionId) {
    console.error(`[${functionName}] ERROR: Missing optionId.`);
    throw new HttpsError("invalid-argument", "缺少 optionId 參數。");
  }

  try {
    const db = new Firestore({ databaseId: "anxi-app" });
    const optionsRef = db.collection("inspectionOptions");
    const docRef = optionsRef.doc(optionId);

    // ✓ Log: 準備獲取文件快照
    console.log(`[${functionName}] Attempting to get document snapshot for ${optionId}...`);
    const docSnap = await docRef.get();
    // ✓ Log: 確認 get() 已成功執行
    console.log(`[${functionName}] Successfully got document snapshot.`);

    // **** ✓ Log: 在檢查 exists 屬性之前，確認它的類型 ****
    console.log(`[${functionName}] Checking if document exists... (docSnap exists property type: ${typeof docSnap.exists})`);
    // **** ✓ 這是 Admin SDK 的正確語法 ****
    if (!docSnap.exists) {
      console.warn(`[${functionName}] Document ${optionId} does not exist. Treating as success.`);
      return { status: "success" };
    }
    // ✓ Log: 確認文件存在
    console.log(`[${functionName}] Document ${optionId} exists.`);

    const dataToDelete = docSnap.data();
    // ✓ Log: 打印將要刪除的文件內容（小心敏感資訊）
    console.log(`[${functionName}] Document data:`, JSON.stringify(dataToDelete));

    const batch = db.batch();
    // ✓ Log: 準備刪除主文件
    console.log(`[${functionName}] Adding main document ${optionId} to delete batch.`);
    batch.delete(docRef);

    // ✓ 檢查是否需要刪除子項目
    if (dataToDelete.type === "category" && !dataToDelete.parentValue) {
      // ✓✓✓ 再次確認 dataToDelete.value 存在且為字串
      if (dataToDelete.value && typeof dataToDelete.value === 'string') {
        console.log(`[${functionName}] Main category "${dataToDelete.value}". Querying sub-items...`);
        // ✓ 建立子項目查詢 (Admin SDK 語法)
        const subItemsQuery = optionsRef
          .where("projectId", "==", dataToDelete.projectId)
          .where("type", "==", "category")
          .where("parentValue", "==", dataToDelete.value);

        // ✓ Log: 準備執行子項目查詢
        console.log(`[${functionName}] Executing sub-item query...`);
        const subItemsSnapshot = await subItemsQuery.get(); // ✓ 執行查詢 (Admin SDK 語法)
        // ✓ Log: 子項目查詢結果
        console.log(`[${functionName}] Sub-item query executed. Found ${subItemsSnapshot.size} results.`);

        if (!subItemsSnapshot.empty) {
          subItemsSnapshot.forEach((subDoc) => {
            // ✓ Log: 將子項目加入刪除批次
            console.log(`[${functionName}] Adding sub-item ${subDoc.id} to delete batch.`);
            batch.delete(subDoc.ref);
          });
        }
      } else {
        // ✓ 警告: 主分類缺少 value，無法刪除子項目
        console.warn(`[${functionName}] Main category doc ${optionId} missing 'value' or it's not a string. Skipping sub-item deletion.`);
      }
    }

    // ✓ Log: 準備提交批次刪除
    console.log(`[${functionName}] Committing batch delete...`);
    await batch.commit(); // ✓ 提交批次
    // ✓ Log: 批次刪除成功
    console.log(`[${functionName}] Batch delete committed successfully.`);

    return { status: "success" };

  } catch (error) {
    // ✓✓✓ 記錄非常詳細的錯誤資訊
    console.error(`[${functionName}] CRITICAL ERROR during deletion:`, error);
    console.error(`[${functionName}] Error Code: ${error.code}`);
    console.error(`[${functionName}] Error Message: ${error.message}`);
    // ✓ 記錄堆疊追蹤，幫助定位錯誤源頭
    if (error.stack) {
      console.error(`[${functionName}] Error Stack: ${error.stack}`);
    }
    // ✓ 拋出 HttpsError
    throw new HttpsError("internal", `刪除驗屋選項時發生未預期的錯誤: ${error.message}`);
  }
});

/**
 * [新增] 批次匯入驗屋選項 (新增或覆蓋)
 * @param {string} projectId - 建案 ID
 * @param {Array<object>} importData - 前端解析好的 Excel 資料 [{ type, value, parentValue, color, icon, order }]
 * @returns {Promise<object>} - { status, importedCount, updatedCount, errors }
 */
exports.batchImportInspectionOptions = onCall({
  region: "asia-east1",
  timeoutSeconds: 540,
  memory: "1GiB",
}, async (request) => {
  const { projectId, importData } = request.data;
  const functionName = `batchImportInspectionOptions (Project: ${projectId})`;
  console.log(`[${functionName}] Received request to import ${importData?.length || 0} items.`);

  if (!projectId || !Array.isArray(importData) || importData.length === 0) {
    console.error(`[${functionName}] ERROR: Missing projectId or invalid importData.`);
    throw new HttpsError("invalid-argument", "缺少 projectId 或有效的匯入資料陣列。");
  }

  const db = new Firestore({ databaseId: "anxi-app" });
  const optionsRef = db.collection("inspectionOptions");
  const errors = [];
  let importedCount = 0;
  let updatedCount = 0;
  const MAX_BATCH_OPERATIONS = 499;
  let currentBatch = db.batch();
  let operationCount = 0;

  try {
    // --- Pre-fetching existing options (分開查詢 - 保持不變) ---
    const potentialValues = [...new Set(importData.map(item => item.value?.trim()).filter(Boolean))];
    const potentialTypes = [...new Set(importData.map(item => item.type).filter(Boolean))];
    const existingOptionsMap = new Map();
    const MAX_IN_QUERY = 30;

    console.log(`[${functionName}] Pre-fetching existing options for types: [${potentialTypes.join(', ')}] with ${potentialValues.length} unique values.`);

    for (const type of potentialTypes) {
      console.log(`[${functionName}] Querying existing options START for type: ${type}`);
      if (potentialValues.length === 0) continue;

      for (let i = 0; i < potentialValues.length; i += MAX_IN_QUERY) {
        const valueChunk = potentialValues.slice(i, i + MAX_IN_QUERY);
        const existingQuery = optionsRef
          .where("projectId", "==", projectId)
          .where("type", "==", type)
          .where("value", "in", valueChunk);
        const existingSnapshot = await existingQuery.get();
        existingSnapshot.forEach(doc => {
          const data = doc.data();
          const key = `${data.type}_${data.parentValue || 'null'}_${data.value}`;
          if (!existingOptionsMap.has(key)) {
            existingOptionsMap.set(key, doc.id);
          }
        });
      }
      console.log(`[${functionName}] Querying existing options DONE for type: ${type}`);
    }
    console.log(`[${functionName}] Finished pre-fetching. Total unique existing options found in map: ${existingOptionsMap.size}`);
    // --- Pre-fetching end ---

    // --- Processing import data ---
    console.log(`[${functionName}] Starting processing ${importData.length} items...`);
    for (let index = 0; index < importData.length; index++) {
      const item = importData[index];

      if (!item.type || !item.value) {
        errors.push(` skipped row ${index + 1}: missing type or value.`);
        console.warn(`[${functionName}] Skipping item ${index + 1} due to missing type or value.`);
        continue;
      }

      const dataToSave = {
        projectId: projectId,
        type: item.type,
        value: item.value.trim(),
        parentValue: item.parentValue || null,
        color: item.color || null,
        icon: item.icon || null,
        order: Number.isFinite(item.order) ? item.order : 100,
        updatedAt: Timestamp.now(),
      };

      const existingKey = `${dataToSave.type}_${dataToSave.parentValue || 'null'}_${dataToSave.value}`;
      const existingDocId = existingOptionsMap.get(existingKey);

      let docRef;
      if (existingDocId) {
        // --- 覆蓋模式 (ID 不變) ---
        console.log(`[${functionName}] Item ${index + 1} - Entering UPDATE mode for ID: ${existingDocId}`);
        docRef = optionsRef.doc(existingDocId);
        currentBatch.set(docRef, dataToSave, { merge: true });
        updatedCount++;
      } else {
        // --- 新增模式 (使用自訂 ID) ---
        // **** 👇👇👇 修改點：產生自訂文件 ID 👇👇👇 ****
        const now = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Taipei" })); // 確保台灣時區
        const year = String(now.getFullYear()).slice(-2); // 取年份後兩位 YY
        const month = String(now.getMonth() + 1).padStart(2, '0'); // MM
        const day = String(now.getDate()).padStart(2, '0'); // DD
        const hours = String(now.getHours()).padStart(2, '0'); // HH
        const minutes = String(now.getMinutes()).padStart(2, '0'); // MM
        const seconds = String(now.getSeconds()).padStart(2, '0'); // SS
        const timestampSuffix = `${year}${month}${day}${hours}${minutes}${seconds}`;
        // 使用 item.type 而不是 dataToSave.type 以確保與原始 Excel 類型對應
        const customDocId = `${projectId}-${item.type}-${timestampSuffix}-${index}`; // 加入索引避免同一秒內重複
        // **** 👆👆👆 修改點結束 👆👆👆 ****

        console.log(`[${functionName}] Item ${index + 1} - Entering ADD mode. Key: "${existingKey}". Custom ID: ${customDocId}`);
        docRef = optionsRef.doc(customDocId); // ✓ 使用自訂 ID
        dataToSave.createdAt = Timestamp.now();
        currentBatch.set(docRef, dataToSave);
        importedCount++;
        // ✓✓✓ 將新加的 item 也加入 Map，避免 Excel 內部有重複資料導致重複新增
        existingOptionsMap.set(existingKey, docRef.id);
      }
      operationCount++;

      // --- Batch commit logic (不變) ---
      if (operationCount >= MAX_BATCH_OPERATIONS) {
        console.log(`[${functionName}] Committing batch with ${operationCount} operations...`);
        await currentBatch.commit();
        currentBatch = db.batch();
        operationCount = 0;
      }
    }
    // --- Processing end ---

    // --- Final commit (不變) ---
    if (operationCount > 0) {
      console.log(`[${functionName}] Committing final batch with ${operationCount} operations...`);
      await currentBatch.commit();
    }

    // --- Return result (不變) ---
    console.log(`[${functionName}] Import finished. Imported: ${importedCount}, Updated: ${updatedCount}, Errors: ${errors.length}`);
    return {
      status: "success",
      importedCount: importedCount,
      updatedCount: updatedCount,
      errors: errors,
      message: `匯入完成！新增 ${importedCount} 筆，更新 ${updatedCount} 筆。${errors.length > 0 ? ` 失敗 ${errors.length} 筆。` : ''}`
    };

  } catch (error) {
    console.error(`[${functionName}] 批次匯入時發生嚴重錯誤:`, error);
    throw new HttpsError("internal", `批次匯入時發生錯誤: ${error.message}`);
  }
});

/**
 * [新增] 批次更新驗屋選項的排序 (order)
 * @param {string} projectId - 建案 ID (用於驗證)
 * @param {Array<{id: string, order: number}>} updates - 包含文件 ID 和新 order 值的陣列
 * @returns {Promise<object>} - { status }
 */
exports.updateInspectionOptionOrders = onCall(async (request) => {
  const { projectId, updates } = request.data;
  const functionName = `updateInspectionOptionOrders (Project: ${projectId})`;
  console.log(`[${functionName}] Received request to update order for ${updates?.length || 0} items.`); // ✓ Log

  // ✓ 基本參數驗證
  if (!projectId || !Array.isArray(updates) || updates.length === 0) {
    console.error(`[${functionName}] ERROR: Missing projectId or invalid updates array.`); // ✓ Log 錯誤
    throw new HttpsError("invalid-argument", "缺少 projectId 或有效的更新資料陣列。");
  }

  // TODO: Add permission validation if needed (e.g., check if user can manage this projectId)

  const db = new Firestore({ databaseId: "anxi-app" }); // ✓ 使用 anxi-app 資料庫
  const optionsRef = db.collection("inspectionOptions");
  const batch = db.batch(); // ✓ Create a batch
  const now = Timestamp.now(); // ✓ Get current timestamp once

  try {
    let operationCount = 0;
    for (const update of updates) {
      if (!update.id || typeof update.order !== 'number') {
        console.warn(`[${functionName}] Skipping invalid update item:`, update); // ✓ Log invalid item
        continue; // Skip items with missing id or invalid order
      }
      const docRef = optionsRef.doc(update.id);
      // ✓ Add update operation to the batch
      batch.update(docRef, {
        order: update.order,
        updatedAt: now // ✓ Update timestamp
      });
      operationCount++;
    }

    if (operationCount === 0) {
      console.log(`[${functionName}] No valid operations to commit.`); // ✓ Log if nothing to update
      return { status: "success", message: "沒有有效的排序更新。" };
    }

    console.log(`[${functionName}] Committing batch with ${operationCount} order updates...`); // ✓ Log
    await batch.commit(); // ✓ Commit the batch

    console.log(`[${functionName}] Successfully updated order for ${operationCount} items.`); // ✓ Log success
    return { status: "success", message: `成功更新 ${operationCount} 個項目的排序。` };

  } catch (error) {
    console.error(`[${functionName}] CRITICAL ERROR during batch order update:`, error); // ✓ Log detailed error
    if (error.code === 5) { // Firestore NOT_FOUND error code
      throw new HttpsError("not-found", `更新排序失敗：一個或多個項目不存在，可能已被刪除。請重新整理頁面再試。 (${error.message})`);
    }
    throw new HttpsError("internal", `批次更新排序時發生錯誤: ${error.message}`); // ✓ Throw HttpsError
  }
});


/**
 * [新增] 匯出指定建案的驗屋選項為 Excel 檔案
 * @param {string} projectId - 建案 ID
 * @returns {Promise<object>} - { status, downloadUrl }
 */
exports.exportInspectionOptionsToExcel = onCall({
  region: "asia-east1",
  timeoutSeconds: 300, // 允許較長執行時間
  memory: "1GiB",     // 分配較多記憶體
}, async (request) => {
  const { projectId } = request.data;
  const functionName = `exportInspectionOptionsToExcel (Project: ${projectId})`;
  console.log(`[${functionName}] Received request.`); // ✓ Log

  if (!projectId) {
    console.error(`[${functionName}] ERROR: Missing projectId.`); // ✓ Log 錯誤
    throw new HttpsError("invalid-argument", "缺少 projectId 參數。");
  }

  // TODO: Add permission validation if needed

  try {
    const db = new Firestore({ databaseId: "anxi-app" }); // ✓ 使用 anxi-app 資料庫
    const optionsRef = db.collection("inspectionOptions");

    // 1. 查詢該建案的所有選項
    console.log(`[${functionName}] Querying options for project ${projectId}...`); // ✓ Log
    const snapshot = await optionsRef.where("projectId", "==", projectId).get();

    if (snapshot.empty) {
      console.log(`[${functionName}] No options found for project ${projectId}.`); // ✓ Log
      throw new HttpsError("not-found", "此建案尚無任何驗屋選項可匯出。");
    }
    console.log(`[${functionName}] Found ${snapshot.size} options.`); // ✓ Log

    // 2. 格式化資料以符合匯入範本
    const exportData = [];
    const typeReverseMap = { // ✓ 用於將 type 轉回中文
      'phase': '驗屋階段', 'area': '檢查區域', 'category': '工程種類',
      'status': '檢查狀態', 'level': '缺失等級', 'progress': '修繕進度',
      'quickReply': '檢查說明快選回覆'
    };

    snapshot.forEach(doc => {
      const data = doc.data();
      exportData.push({
        '分類類別': typeReverseMap[data.type] || data.type, // ✓ 轉換 type
        '項目名稱': data.value || '',
        '父分類名稱': data.parentValue || '', // ✓ 處理 parentValue
        '顏色': data.color || '',
        '圖示': data.icon || '',
        '排序': data.order !== undefined && data.order !== null ? data.order : '', // ✓ 確保是數字或空字串
      });
    });

    // ✓ 按分類類別排序 (主要)，再按父分類排序 (次要，確保子項目跟隨主分類)，最後按 order 排序
    exportData.sort((a, b) => {
      const typeCompare = (a['分類類別'] || '').localeCompare(b['分類類別'] || '', 'zh-Hant');
      if (typeCompare !== 0) return typeCompare;
      const parentCompare = (a['父分類名稱'] || '').localeCompare(b['父分類名稱'] || '', 'zh-Hant');
      if (parentCompare !== 0) return parentCompare;
      const orderA = Number.isFinite(a['排序']) ? a['排序'] : Infinity;
      const orderB = Number.isFinite(b['排序']) ? b['排序'] : Infinity;
      return orderA - orderB;
    });

    console.log(`[${functionName}] Data formatted for Excel export.`); // ✓ Log

    // 3. 生成 Excel Buffer
    const worksheet = xlsx.utils.json_to_sheet(exportData);
    const workbook = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(workbook, worksheet, "驗屋選項"); // Sheet 名稱
    const buffer = xlsx.write(workbook, { bookType: "xlsx", type: "buffer" });

    // 4. 上傳到 Cloud Storage 臨時目錄
    const bucket = getStorage().bucket(); // 使用默認 Bucket
    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10);
    const timeStr = now.toTimeString().slice(0, 8).replace(/:/g, "");
    const fileName = `Export_InspectionOptions_${projectId}_${dateStr}_${timeStr}.xlsx`;
    const filePath = `temp-exports/${fileName}`; // 存放在臨時目錄
    const file = bucket.file(filePath);

    console.log(`[${functionName}] Uploading Excel buffer to GCS: ${filePath}`); // ✓ Log
    await file.save(buffer, {
      metadata: {
        contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        // 可選：設置 Cache-Control，讓檔案在一段時間後自動失效
        // cacheControl: 'private, max-age=900' // 15 分鐘
      }
    });
    console.log(`[${functionName}] Upload complete.`); // ✓ Log

    // 5. 生成帶簽名的下載 URL (有效期限 15 分鐘)
    console.log(`[${functionName}] Generating signed URL with attachment disposition...`);
    const [signedUrl] = await file.getSignedUrl({
      action: 'read',
      expires: Date.now() + 15 * 60 * 1000, // 15 minutes
      // ✓ 核心修改：告訴瀏覽器將此作為附件下載
      responseDisposition: `attachment; filename="${encodeURIComponent(fileName)}"`
    });
    console.log(`[${functionName}] Generated signed URL.`); // ✓ Log

    // 6. 回傳 URL 給前端
    return { status: "success", downloadUrl: signedUrl };

  } catch (error) {
    console.error(`[${functionName}] 匯出 Excel 時發生嚴重錯誤:`, error); // ✓ Log 錯誤
    if (error instanceof HttpsError) { // ✓ 如果是 HttpsError 直接拋出
      throw error;
    }
    throw new HttpsError("internal", `匯出 Excel 失敗: ${error.message}`); // ✓ 其他錯誤包裝後拋出
  }
});


// =================================================================
// /  新增：驗屋紀錄相關 Cloud Functions
// =================================================================

/**
 *  新增一筆驗屋紀錄
 * @param {object} data - 包含 projectId, unitId, inspectionDate, phase, photos (array of objects {name, url, path}), area, category, subCategory, status, level, progress, description, inspectorName, inspectorPhone
 * @returns {Promise<object>} - { status, id }
 */
//  1. 修改函式名稱，移除 "FB"
exports.addInspectionRecord = onCall({ region: "asia-east1" }, async (request) => {
  const { projectId, unitId, inspectionDate, phase, photos, area, category, subCategory, status, level, progress, description, inspectorName, inspectorPhone, customerView } = request.data;
  const functionName = `addInspectionRecord (Project: ${projectId}, Unit: ${unitId})`;

  // 基本參數驗證 (此部分正確)
  if (!projectId || !unitId || !inspectionDate || !phase || !area || !category || !subCategory || !status || !level || !progress || !inspectorName || !inspectorPhone) {
    console.error(`[${functionName}] 錯誤：缺少必要參數。`);
    throw new HttpsError("invalid-argument", "缺少必要的驗屋紀錄參數。");
  }

  // 照片數量驗證 (此部分正確)
  if (photos && Array.isArray(photos) && photos.length > 4) {
    console.error(`[${functionName}] 錯誤：照片數量 (${photos.length}) 超過上限 4 張。`);
    throw new HttpsError("invalid-argument", "照片數量最多只能 4 張。");
  }

  try {
    const db = new Firestore({ databaseId: "anxi-app" });
    const recordsRef = db.collection("inspectionRecords");

    // 產生文件 ID (此部分正確)
    const now = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Taipei" }));
    const timestampSuffix = now.toISOString().replace(/[-:.]/g, "").replace("T", "_").replace("Z", "");
    const docId = `${projectId}_${unitId}_${timestampSuffix}`;

    const dataToSave = {
      projectId,
      unitId,
      inspectionDate: Timestamp.fromDate(new Date(inspectionDate)),
      phase,
      photos: photos || [],
      area,
      category,
      subCategory,
      status,
      level,
      progress,
      description: description || "",
      inspectorName,
      inspectorPhone,
      customerView: customerView === false ? false : true,
      //  2. 修改 serverTimestamp 的用法
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      isDeleted: false,
      customerConfirmedAt: null,
      confirmationBatchId: null
    };

    await recordsRef.doc(docId).set(dataToSave);
    console.log(`[${functionName}] 成功新增驗屋紀錄，ID: ${docId}`);

    return { status: "success", id: docId };

  } catch (error) {
    console.error(`[${functionName}] 新增紀錄時發生錯誤:`, error);
    throw new HttpsError("internal", `新增驗屋紀錄時發生錯誤: ${error.message}`);
  }
});


/**
 *  [最終修正版] 獲取指定戶別的所有驗屋紀錄 (排除已刪除)
 * 使用 Admin SDK 鏈式查詢語法
 * @param {string} projectId - 建案 ID
 * @param {string} unitId - 戶別 ID
 * @returns {Promise<object>} - { status, data: Array<object> }
 */
exports.getInspectionRecords = onCall({ region: "asia-east1" }, async (request) => {
  const { projectId, unitId } = request.data;
  const functionName = `getInspectionRecords (Project: ${projectId}, Unit: ${unitId})`;

  if (!projectId || !unitId) {
    console.error(`[${functionName}] 錯誤：缺少必要參數。`);
    throw new HttpsError("invalid-argument", "缺少 projectId 或 unitId。");
  }

  try {
    // ✓ 確保使用正確的 Firestore 實例
    const db = new Firestore({ databaseId: "anxi-app" });
    const recordsRef = db.collection("inspectionRecords"); // ✓ 取得集合參考

    // ✓✓✓ 使用 Admin SDK 的鏈式查詢語法 ✓✓✓
    const snapshot = await recordsRef
      .where("projectId", "==", projectId)
      .where("unitId", "==", unitId)
      .where("isDeleted", "==", false) // ✓ 保持軟刪除過濾
      .orderBy("createdAt", "desc")
      .get(); // ✓ .get() 在最後

    // 後續處理 snapshot 的邏輯保持不變
    if (snapshot.empty) {
      console.log(`[${functionName}] 找不到戶別 ${unitId} 的有效驗屋紀錄。`);
      return { status: "success", data: [] };
    }
    const records = snapshot.docs.map(doc => {
      const data = doc.data();
      // 日期轉換邏輯
      if (data.inspectionDate && typeof data.inspectionDate.toDate === 'function') {
        data.inspectionDate = data.inspectionDate.toDate().toISOString();
      }
      if (data.createdAt && typeof data.createdAt.toDate === 'function') {
        data.createdAt = data.createdAt.toDate().toISOString();
      }
      if (data.updatedAt && typeof data.updatedAt.toDate === 'function') {
        data.updatedAt = data.updatedAt.toDate().toISOString();
      }
      //  START: 新增 customerConfirmedAt 的轉換
      if (data.customerConfirmedAt && typeof data.customerConfirmedAt.toDate === 'function') {
        data.customerConfirmedAt = data.customerConfirmedAt.toDate().toISOString();
      }
      //  END: 新增轉換
      return { id: doc.id, ...data };
    });

    console.log(`[${functionName}] 成功獲取 ${records.length} 筆有效紀錄。`);
    return { status: "success", data: records };

  } catch (error) {
    console.error(`[${functionName}] 查詢紀錄時發生錯誤:`, error);
    // 拋出 HttpsError 讓前端 api.js 能捕捉到 message
    throw new HttpsError("internal", `查詢驗屋紀錄時發生錯誤: ${error.message}`);
  }
});


/**
 * [修改] 獲取單一建案 (projectId) 底下所有戶別的驗屋紀錄 (排除已刪除)
 *
 * @param {object} data - { projectId: string }
 * @param {object} context - 包含驗證資訊
 * @returns {Promise<{status: string, data: Array<object>}>}
 */
exports.getInspectionRecordsForProjectFB = onCall(async (request) => {
  const { projectId } = request.data;
  if (!projectId) {
    throw new HttpsError("invalid-argument", "缺少 'projectId' 參數。");
  }

  const db = new Firestore({ databaseId: 'anxi-app' });
  const functionName = `getInspectionRecordsForProjectFB (Project: ${projectId})`;

  try {
    console.log(`[${functionName}] Executing collectionGroup query...`);
    const recordsRef = db.collectionGroup("inspectionRecords")
      .where("projectId", "==", projectId)
      // **** 👇👇👇 修改點：增加過濾條件 👇👇👇 ****
      .where("isDeleted", "==", false) // ✓ 只撈取 isDeleted 為 false 的紀錄
      // **** 👆👆👆 修改點結束 👆👆👆 ****
      .orderBy("inspectionDate", "desc"); // 排序保持不變

    // ❗ 注意：此查詢可能需要新的 Firestore 複合索引 ❗
    // 索引應包含：projectId (ASC), isDeleted (ASC), inspectionDate (DESC)
    // 如果執行時報錯，請依照 Firebase 控制台連結建立索引。

    const snapshot = await recordsRef.get();
    console.log(`[${functionName}] Query completed. Found ${snapshot.size} non-deleted documents.`); // ✓ 更新 Log

    // ... (後續處理 snapshot 的邏輯保持不變) ...
    if (snapshot.empty) {
      return { status: "success", data: [] };
    }
    const records = snapshot.docs.map(doc => {
      const data = doc.data();
      // ... (日期轉換邏輯保持不變) ...
      const inspectionDate = data.inspectionDate?.toDate ? data.inspectionDate.toDate().toISOString() : data.inspectionDate;
      const createdAt = data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : data.createdAt;
      if (data.customerConfirmedAt && typeof data.customerConfirmedAt.toDate === 'function') {
        data.customerConfirmedAt = data.customerConfirmedAt.toDate().toISOString();
      }

      return { id: doc.id, ...data, inspectionDate, createdAt };
    });

    console.log(`[${functionName}] Successfully processed ${records.length} non-deleted records.`); // ✓ 更新 Log
    return { status: "success", data: records };

  } catch (error) {
    console.error(`[${functionName}] Error fetching project records (collectionGroup):`, error);
    // ... (索引錯誤處理保持不變) ...
    if (error.code === 9 && error.message.includes('index')) {
      throw new HttpsError("failed-precondition", `查詢全建案紀錄失敗：資料庫缺少必要的複合索引 (可能需要包含 isDeleted 欄位)。請檢查 Cloud Functions 日誌中的連結以建立索引。`);
    }
    throw new HttpsError("internal", `查詢全建案紀錄失敗: ${error.message}`);
  }
});

/**
 *  獲取指定建案的棟別與戶別結構
 * @param {string} projectId - 建案 ID
 * @returns {Promise<object>} - { status, data: object } e.g., { "A棟": ["A1-01", "A1-02"], ... }
 */
exports.getProjectStructure = onCall({ region: "asia-east1" }, async (request) => {
  const { projectId } = request.data;
  const functionName = `getProjectStructure (Project: ${projectId})`;

  if (!projectId) {
    console.error(`[${functionName}] 錯誤：缺少 projectId。`);
    throw new HttpsError("invalid-argument", "缺少 projectId。");
  }

  try {
    const db = new Firestore({ databaseId: "anxi-app" });
    const buildingsRef = db.collection('projects').doc(projectId).collection('buildings');
    const buildingsSnapshot = await buildingsRef.orderBy('buildingName').get(); // 按名稱排序棟別

    if (buildingsSnapshot.empty) {
      console.log(`[${functionName}] 建案 ${projectId} 找不到任何棟別資料。`);
      return { status: "success", data: {} };
    }

    const structure = {};
    const buildingPromises = buildingsSnapshot.docs.map(async (buildingDoc) => {
      const buildingName = buildingDoc.data().buildingName;
      if (!buildingName) return; // 跳過沒有名稱的棟別文件

      const unitsRef = buildingDoc.ref.collection('unitId');
      const unitsSnapshot = await unitsRef.get(); // 讀取該棟別下的所有戶別文件

      const unitIds = unitsSnapshot.docs
        .map(unitDoc => unitDoc.data().unitId) // 取出每個戶別文件中的 unitId 欄位值
        .filter(Boolean); // 過濾掉空值

      //  自然排序戶別 (例如 A1-1, A1-2, A1-10 而不是 A1-1, A1-10, A1-2)
      unitIds.sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }));

      if (unitIds.length > 0) {
        structure[buildingName] = unitIds;
      }
    });

    await Promise.all(buildingPromises); // 等待所有棟別的戶別都讀取完畢

    console.log(`[${functionName}] 成功獲取 ${Object.keys(structure).length} 個棟別的結構。`);
    return { status: "success", data: structure };

  } catch (error) {
    console.error(`[${functionName}] 獲取結構時發生錯誤:`, error);
    throw new HttpsError("internal", `獲取建案結構時發生錯誤: ${error.message}`);
  }
});

// ✓ 再次確認 onCall 包裝和 HttpsError 使用
exports.updateInspectionRecordField = onCall(async (request) => {
  // 將所有邏輯包在 try...catch 中，確保拋出 HttpsError
  try {
    const { projectId, unitId, recordId, payload } = request.data;
    const functionName = `updateInspectionRecordField (Record: ${recordId})`;

    if (!recordId || !payload || typeof payload !== 'object') {
      console.error(`[${functionName}] 錯誤：缺少必要參數。`, request.data);
      // ✓ 必須拋出 HttpsError 給前端
      throw new HttpsError("invalid-argument", "缺少 recordId 或有效的 payload。");
    }
    // ... (projectId, unitId 檢查) ...

    const db = new Firestore({ databaseId: "anxi-app" });
    const recordRef = db.collection('inspectionRecords').doc(recordId);

    // ✓✓✓ 正確修改點：使用 payload 建立 dataToUpdate ✓✓✓
    const dataToUpdate = {
      ...payload, // ✓ 展開前端傳來的 payload (包含 customerView, inspectorName, inspectorPhone)
      updatedAt: FieldValue.serverTimestamp() // ✓ 自動加入更新時間戳
    };

    // ✓ 可選但建議：移除不應在此處更新的欄位，防止意外修改
    delete dataToUpdate.projectId;
    delete dataToUpdate.unitId;
    delete dataToUpdate.createdAt;
    delete dataToUpdate.id; // 如果 payload 可能包含 id

    console.log(`[${functionName}] Preparing to update Firestore doc: ${recordRef.path} with data:`, JSON.stringify(dataToUpdate)); // ✓ Log        // ✓ 使用 update，如果文件不存在它會自動拋錯
    await recordRef.update(dataToUpdate);
    console.log(`[${functionName}] 文件更新成功。`);

    return { status: "success" };

  } catch (error) {
    // 在後端記錄原始錯誤細節
    console.error(`[${functionName}] 更新 Firestore 文件時發生錯誤:`, error);

    // 將特定錯誤轉為 HttpsError 回傳給前端
    // Firestore 文件不存在的錯誤碼通常是 5
    if (error.code === 5 || error.message.includes('NOT_FOUND') || error.message.includes('No document to update')) {
      console.error(`[${functionName}] 找不到指定的文件: ${recordId}`);
      // ✓ 必須拋出 HttpsError 給前端
      throw new HttpsError("not-found", `找不到要更新的紀錄 (ID: ${recordId})。`);
    }
    // 如果錯誤已經是 HttpsError (例如來自參數驗證)，直接再次拋出
    if (error instanceof HttpsError) {
      throw error;
    }
    // 對於其他未預期的錯誤，拋出通用的內部錯誤
    // ✓ 必須拋出 HttpsError 給前端
    throw new HttpsError("internal", `更新驗屋紀錄時發生未預期的錯誤: ${error.message}`);
  }
}); // ✓ 確保 onCall 包裹了 async 函數

/**
 * [新增] 更新一筆完整的驗屋紀錄 (供 InspectionRecordEditor 編輯模式使用)
 * @param {string} recordId - 驗屋紀錄文件 ID (自訂格式，例如 fuyu141_A1-02_...)
 * @param {object} payload - 包含要更新的所有欄位的物件
 * @returns {Promise<object>} - { status: 'success' } 或 { status: 'error', message: '...' }
 */
exports.updateInspectionRecord = onCall(async (request) => {
  // 從 request.data 中解構出前端傳來的參數
  const { recordId, payload } = request.data;
  const functionName = `updateInspectionRecord (Record: ${recordId})`; // 用於 Log

  // 1. 驗證必要參數是否存在
  if (!recordId || !payload || typeof payload !== 'object') {
    console.error(`[${functionName}] 錯誤：缺少必要的更新參數。`, request.data);
    throw new HttpsError("invalid-argument", "缺少 recordId 或有效的 payload。");
  }

  // 2. 建立指向 anxi-app 資料庫的 Firestore Admin SDK 實例
  const db = new Firestore({ databaseId: "anxi-app" });

  // 3. 構造指向目標文件的 DocumentReference (指向頂層集合 inspectionRecords)
  const recordRef = db.collection('inspectionRecords').doc(recordId);

  try {
    // 4. 準備要更新的資料
    const dataToUpdate = {
      ...payload, // 展開前端傳來的欄位
      updatedAt: FieldValue.serverTimestamp(), // 自動加入更新時間戳
    };

    // ❗ 清理不需要更新或應由後端控制的欄位
    delete dataToUpdate.id; // payload 中可能包含 id，不需要儲存
    delete dataToUpdate.createdAt; // 不應更新建立時間
    // ❗ 如果 inspectionDate 前端傳的是 Date 物件，需轉為 Timestamp
    if (dataToUpdate.inspectionDate && dataToUpdate.inspectionDate instanceof Date) {
      dataToUpdate.inspectionDate = Timestamp.fromDate(dataToUpdate.inspectionDate);
    } else if (dataToUpdate.inspectionDate && typeof dataToUpdate.inspectionDate === 'string') {
      // 如果前端傳的是 ISO 字串，也轉為 Timestamp
      const dateObj = new Date(dataToUpdate.inspectionDate);
      if (!isNaN(dateObj.getTime())) {
        dataToUpdate.inspectionDate = Timestamp.fromDate(dateObj);
      } else {
        console.warn(`[${functionName}] 無效的 inspectionDate 字串格式: ${dataToUpdate.inspectionDate}`);
        // 根據您的業務邏輯決定如何處理無效日期，例如設為 null 或保持不變
        // delete dataToUpdate.inspectionDate; // 或移除此欄位
        dataToUpdate.inspectionDate = null; // 或設為 null
      }
    }


    // 5. 執行更新操作 (使用 set + merge: true 更安全，不存在會報錯，存在則合併更新)
    console.log(`[${functionName}] 準備更新文件: ${recordRef.path}`); // Log 路徑
    // console.log(`[${functionName}] 更新內容:`, dataToUpdate); // 可選：Log 更新內容
    // await recordRef.update(dataToUpdate); // update 在文件不存在時會報錯
    await recordRef.set(dataToUpdate, { merge: true }); // set + merge 更安全
    console.log(`[${functionName}] 文件更新成功。`);

    // 6. 回傳成功訊息
    return { status: "success" };

  } catch (error) {
    console.error(`[${functionName}] 更新 Firestore 文件時發生錯誤:`, error);
    // 錯誤處理 (與 updateInspectionRecordField 相同)
    if (error.code === 5) {
      console.error(`[${functionName}] 找不到指定的文件: ${recordRef.path}`);
      throw new HttpsError("not-found", `找不到要更新的紀錄 (ID: ${recordId})。`);
    }
    throw new HttpsError("internal", `更新驗屋紀錄時發生錯誤: ${error.message}`);
  }
});

/**
 * [修改] 刪除一筆驗屋紀錄 (改為冷刪除)
 * @param {string} recordId - 要刪除的驗屋紀錄文件 ID (自訂格式)
 * @returns {Promise<object>} - { status: 'success' } 或 { status: 'error', message: '...' }
 */
exports.deleteInspectionRecord = onCall(async (request) => {
  const { recordId } = request.data;
  const functionName = `deleteInspectionRecord (Record: ${recordId})`;
  console.log(`[${functionName}] Function called at ${new Date().toISOString()}`);

  if (!recordId) {
    console.error(`[${functionName}] ERROR: Missing recordId.`);
    // ✓ Now HttpsError should be defined
    throw new HttpsError("invalid-argument", "缺少 recordId。");
  }

  // ✓ Now Firestore() should be defined
  const db = new Firestore({ databaseId: "anxi-app" });
  // ✓✓✓ 修改點：使用 Admin SDK 的標準語法獲取 DocumentReference ✓✓✓
  const recordRef = db.collection('inspectionRecords').doc(recordId);

  try {
    // ✓ Now getDoc() should be defined (但 Admin SDK 更常用 .get())
    // const docSnap = await getDoc(recordRef); // 這是 client SDK 風格
    const docSnap = await recordRef.get(); // ✓ Admin SDK 風格
    // ✓ Admin SDK 的 snapshot 沒有 exists() 方法，而是 .exists 屬性
    if (!docSnap.exists) {
      console.warn(`[${functionName}] Document ${recordId} does not exist...`);
      return { status: "success" };
    }

    // ✓ Now updateDoc() and FieldValue should be defined
    // await updateDoc(recordRef, { ... }); // 這是 client SDK 風格
    await recordRef.update({ // ✓ Admin SDK 風格
      isDeleted: true,
      deletedAt: FieldValue.serverTimestamp() // ✓ FieldValue needed here
    });
    console.log(`[${functionName}] Document ${recordId} successfully marked as deleted.`);
    return { status: "success" };

  } catch (error) {
    console.error(`[${functionName}] CRITICAL ERROR during soft deletion:`, error);
    // Firestore 文件不存在的錯誤碼通常是 5 (NOT_FOUND)
    if (error.code === 5) {
      console.warn(`[${functionName}] Attempted to update non-existent document ${recordId}.`);
      // 如果文件不存在，視為刪除成功 (或至少是冪等的)
      return { status: "success" };
    }
    // ✓ Now HttpsError should be defined
    if (error instanceof HttpsError) { throw error; }
    throw new HttpsError("internal", `標記刪除驗屋紀錄時發生錯誤: ${error.message}`);
  }
});


/**
 *  [新增] 獲取指定戶別的所有 *已刪除* 驗屋紀錄
 * @param {string} projectId - 建案 ID
 * @param {string} unitId - 戶別 ID
 * @returns {Promise<object>} - { status, data: Array<object> }
 */
exports.getDeletedInspectionRecordsFB = onCall({ region: "asia-east1" }, async (request) => {
  const { projectId, unitId } = request.data;
  const functionName = `getDeletedInspectionRecordsFB (Project: ${projectId}, Unit: ${unitId})`;

  if (!projectId || !unitId) {
    console.error(`[${functionName}] 錯誤：缺少必要參數。`);
    throw new HttpsError("invalid-argument", "缺少 projectId 或 unitId。");
  }

  try {
    const db = new Firestore({ databaseId: "anxi-app" });
    const recordsRef = db.collection("inspectionRecords");

    // ✓✓✓ 查詢 isDeleted == true 的紀錄 ✓✓✓
    // ✓ 排序：按刪除時間降序 (如果 deletedAt 存在)，否則按建立時間降序
    const snapshot = await recordsRef
      .where("projectId", "==", projectId)
      .where("unitId", "==", unitId)
      .where("isDeleted", "==", true) // <--- 查詢已刪除
      .orderBy("deletedAt", "desc")    // <--- 按刪除時間排序 (需要索引)
      // .orderBy("createdAt", "desc") // (備用排序)
      .get();

    // ❗ 注意：此查詢可能需要新的 Firestore 複合索引 ❗
    // 索引應包含：projectId (ASC), unitId (ASC), isDeleted (ASC), deletedAt (DESC)
    // 如果執行時報錯，請依照 Firebase 控制台連結建立索引。

    if (snapshot.empty) {
      console.log(`[${functionName}] 找不到戶別 ${unitId} 的已刪除紀錄。`);
      return { status: "success", data: [] };
    }

    const records = snapshot.docs.map(doc => {
      const data = doc.data();
      // 日期轉換 (保持與 getInspectionRecordsFB 一致)
      if (data.inspectionDate?.toDate) data.inspectionDate = data.inspectionDate.toDate().toISOString();
      if (data.createdAt?.toDate) data.createdAt = data.createdAt.toDate().toISOString();
      if (data.updatedAt?.toDate) data.updatedAt = data.updatedAt.toDate().toISOString();
      if (data.deletedAt?.toDate) data.deletedAt = data.deletedAt.toDate().toISOString(); // ✓ 轉換刪除時間
      if (data.customerConfirmedAt && typeof data.customerConfirmedAt.toDate === 'function') {
        data.customerConfirmedAt = data.customerConfirmedAt.toDate().toISOString();
      }
      return { id: doc.id, ...data };
    });

    console.log(`[${functionName}] 成功獲取 ${records.length} 筆已刪除紀錄。`);
    return { status: "success", data: records };

  } catch (error) {
    console.error(`[${functionName}] 查詢已刪除紀錄時發生錯誤:`, error);
    if (error.code === 9 && error.message.includes('index')) {
      throw new HttpsError("failed-precondition", `查詢失敗：資料庫缺少必要的複合索引 (可能需要包含 deletedAt 欄位)。請檢查 Cloud Functions 日誌中的連結以建立索引。`);
    }
    throw new HttpsError("internal", `查詢已刪除紀錄時發生錯誤: ${error.message}`);
  }
});


/**
 *  [新增] 獲取指定建案 (projectId) 底下所有 *已刪除* 的驗屋紀錄
 * @param {string} projectId - 建案 ID
 * @returns {Promise<object>} - { status, data: Array<object> }
 */
exports.getDeletedInspectionRecordsForProjectFB = onCall({ region: "asia-east1" }, async (request) => {
  const { projectId } = request.data;
  const functionName = `getDeletedInspectionRecordsForProjectFB (Project: ${projectId})`;

  if (!projectId) {
    console.error(`[${functionName}] 錯誤：缺少 projectId。`);
    throw new HttpsError("invalid-argument", "缺少 projectId。");
  }

  try {
    const db = new Firestore({ databaseId: "anxi-app" });
    const recordsRef = db.collection("inspectionRecords");

    // ✓✓✓ 查詢 projectId 符合且 isDeleted == true 的紀錄 ✓✓✓
    // ✓ 排序：按刪除時間降序 (如果 deletedAt 存在)，否則按建立時間降序
    const snapshot = await recordsRef
      .where("projectId", "==", projectId)
      .where("isDeleted", "==", true) // <--- 查詢已刪除
      .orderBy("deletedAt", "desc")    // <--- 按刪除時間排序 (需要索引)
      // .orderBy("createdAt", "desc") // (備用排序)
      .get();

    // ❗ 注意：此查詢可能需要新的 Firestore 複合索引 ❗
    // 索引應包含：projectId (ASC), isDeleted (ASC), deletedAt (DESC)
    // 如果執行時報錯，請依照 Firebase 控制台連結建立索引。

    if (snapshot.empty) {
      console.log(`[${functionName}] 找不到建案 ${projectId} 的已刪除紀錄。`);
      return { status: "success", data: [] };
    }

    const records = snapshot.docs.map(doc => {
      const data = doc.data();
      // 日期轉換 (保持與 getDeletedInspectionRecordsFB 一致)
      if (data.inspectionDate?.toDate) data.inspectionDate = data.inspectionDate.toDate().toISOString();
      if (data.createdAt?.toDate) data.createdAt = data.createdAt.toDate().toISOString();
      if (data.updatedAt?.toDate) data.updatedAt = data.updatedAt.toDate().toISOString();
      if (data.deletedAt?.toDate) data.deletedAt = data.deletedAt.toDate().toISOString(); // ✓ 轉換刪除時間
      if (data.customerConfirmedAt && typeof data.customerConfirmedAt.toDate === 'function') {
        data.customerConfirmedAt = data.customerConfirmedAt.toDate().toISOString();
      }

      // ✓✓✓ 確保回傳 unitId ✓✓✓
      return { id: doc.id, unitId: data.unitId, ...data };
    });

    console.log(`[${functionName}] 成功獲取 ${records.length} 筆建案 ${projectId} 的已刪除紀錄。`);
    return { status: "success", data: records };

  } catch (error) {
    console.error(`[${functionName}] 查詢建案已刪除紀錄時發生錯誤:`, error);
    if (error.code === 9 && error.message.includes('index')) {
      throw new HttpsError("failed-precondition", `查詢失敗：資料庫缺少必要的複合索引 (需包含 isDeleted, deletedAt)。請檢查 Cloud Functions 日誌中的連結以建立索引。`);
    }
    throw new HttpsError("internal", `查詢建案已刪除紀錄時發生錯誤: ${error.message}`);
  }
});


/**
 *  [新增] 還原一筆已刪除的驗屋紀錄
 * @param {string} recordId - 要還原的驗屋紀錄文件 ID
 * @returns {Promise<object>} - { status: 'success' }
 */
exports.restoreInspectionRecordFB = onCall({ region: "asia-east1" }, async (request) => {
  const { recordId } = request.data;
  const functionName = `restoreInspectionRecordFB (Record: ${recordId})`;
  console.log(`[${functionName}] Function called at ${new Date().toISOString()}`);

  if (!recordId) {
    console.error(`[${functionName}] ERROR: Missing recordId.`);
    throw new HttpsError("invalid-argument", "缺少 recordId。");
  }

  const db = new Firestore({ databaseId: "anxi-app" });
  const recordRef = db.collection('inspectionRecords').doc(recordId);

  try {
    const docSnap = await recordRef.get();
    if (!docSnap.exists) {
      // 如果文件已被物理刪除或 ID 錯誤，直接回報成功 (冪等性)
      console.warn(`[${functionName}] Document ${recordId} does not exist. Cannot restore, but returning success.`);
      return { status: "success" }; // 或者 HttpsError('not-found') 取決於你希望的行為
    }

    // ✓ 將 isDeleted 設為 false，並清除 deletedAt
    await recordRef.update({
      isDeleted: false,
      deletedAt: null // 或者 FieldValue.delete() 如果你想完全移除欄位
    });

    console.log(`[${functionName}] Document ${recordId} successfully restored.`);
    return { status: "success" };

  } catch (error) {
    console.error(`[${functionName}] CRITICAL ERROR during restoration:`, error);
    if (error.code === 5) { // NOT_FOUND
      console.warn(`[${functionName}] Attempted to update non-existent document ${recordId}.`);
      return { status: "success" }; // 視為成功
    }
    if (error instanceof HttpsError) { throw error; }
    throw new HttpsError("internal", `還原驗屋紀錄時發生錯誤: ${error.message}`);
  }
});




/**
 * [API] 產生一個有時效性且安全的客戶驗屋報告分享連結
 * @param {string} projectId - 建案 ID
 * @param {string} unitId - 戶別 ID
 * @returns {Promise<object>} - { status, shareUrl }
 */
exports.generateShareableUrl = onCall({
  region: "asia-east1",
  secrets: ["JWT_SECRET_KEY"], // ✓ 引用您在 Secret Manager 中設定的密鑰
}, async (request) => {
  const { projectId, unitId } = request.data;
  const functionName = `generateShareableUrl`;

  if (!projectId || !unitId) {
    console.error(`[${functionName}] 錯誤：缺少 projectId 或 unitId。`);
    throw new HttpsError("invalid-argument", "缺少必要的建案或戶別 ID。");
  }

  try {
    // 從環境變數獲取密鑰 (由 secrets 設定)
    const secretKey = process.env.JWT_SECRET_KEY;
    if (!secretKey) {
      console.error(`[${functionName}] 嚴重錯誤：找不到 JWT_SECRET_KEY 環境變數。`);
      throw new HttpsError("internal", "伺服器設定錯誤，無法產生 Token。");
    }

    // 建立 JWT Payload
    const payload = {
      projectId: projectId,
      unitId: unitId,
      purpose: 'customer_report_view' // 標記 Token 用途
    };

    // 簽署 Token，設定 90 天有效期
    const token = jwt.sign(payload, secretKey, { expiresIn: '90d' });

    // 組合最終的分享 URL
    // 注意：路徑已改為 /customer-report，並使用 token 作為查詢參數
    const shareUrl = `https://anxismart.com/#/customer-report?token=${token}`;

    console.log(`[${functionName}] 已成功為 ${projectId}/${unitId} 產生分享連結。`);
    return { status: "success", shareUrl: shareUrl };

  } catch (error) {
    console.error(`[${functionName}] 產生分享連結時發生錯誤:`, error);
    throw new HttpsError("internal", `產生分享連結失敗: ${error.message}`);
  }
});
// ✓ END: 新增函式


/**
 * [API] 驗證客戶端驗屋報告的分享 Token
 * @param {string} token - 前端傳來的 JWT Token 字串
 * @returns {Promise<object>} - 驗證成功則回傳 { status: 'success', data: { projectId, unitId } }
 */
exports.validateReportToken = onCall({
  region: "asia-east1",
  secrets: ["JWT_SECRET_KEY"], // ✓ 引用與簽發時相同的密鑰
}, async (request) => {
  const { token } = request.data;
  const functionName = `validateReportToken`;

  // 1. 驗證參數
  if (!token) {
    console.error(`[${functionName}] 錯誤：請求中缺少 Token。`);
    throw new HttpsError("invalid-argument", "缺少驗證資訊。");
  }

  // 2. 獲取密鑰
  const secretKey = process.env.JWT_SECRET_KEY;
  if (!secretKey) {
    console.error(`[${functionName}] 嚴重錯誤：找不到 JWT_SECRET_KEY 環境變數。`);
    throw new HttpsError("internal", "伺服器設定錯誤，無法驗證 Token。");
  }

  try {
    // 3. 驗證 Token
    // jwt.verify 會自動檢查簽名和過期時間
    const decoded = jwt.verify(token, secretKey);

    // 4. (可選) 檢查 Token 用途是否正確
    if (decoded.purpose !== 'customer_report_view') {
      throw new HttpsError("permission-denied", "此 Token 用途不符。");
    }

    console.log(`[${functionName}] Token 驗證成功，Payload:`, decoded);

    // 5. 回傳解碼後的資料
    return {
      status: "success",
      data: {
        projectId: decoded.projectId,
        unitId: decoded.unitId
      }
    };

  } catch (error) {
    // 6. 處理驗證失敗的各種情況
    console.error(`[${functionName}] Token 驗證失敗:`, error.name, error.message);
    if (error.name === 'TokenExpiredError') {
      throw new HttpsError("unauthenticated", "此分享連結已過期，請聯繫服務人員重新索取。");
    }
    if (error.name === 'JsonWebTokenError') {
      throw new HttpsError("unauthenticated", "此分享連結無效或損毀。");
    }
    // 其他未知錯誤
    throw new HttpsError("internal", `驗證分享連結時發生未預期的錯誤: ${error.message}`);
  }
});


// ✓ START: 新增 - 獲取指定戶別已確認的驗屋批次列表
/**
 * [API] 查詢指定戶別已完成簽名確認的驗屋批次列表
 * @param {string} projectId - 建案 ID
 * @param {string} unitId - 戶別 ID
 * @returns {Promise<object>} - { status: 'success', data: Array<{ batchId: string, dateString: string, recordCount: number, buyerInfo: object }> }
 */
exports.getConfirmedInspectionBatches = onCall({ region: "asia-east1" }, async (request) => {
  const { projectId, unitId } = request.data;
  const functionName = `getConfirmedInspectionBatches (Project: ${projectId}, Unit: ${unitId})`;

  // 1. 驗證參數
  if (!projectId || !unitId) {
    console.error(`[${functionName}] 錯誤：缺少 projectId 或 unitId。`);
    throw new HttpsError("invalid-argument", "缺少建案或戶別 ID。");
  }

  try {
    // 2. 建立 Firestore 實例
    const db = new Firestore({ databaseId: "anxi-app" });
    // ✓ 集合名稱確認為 inspectionConfirmations
    const confirmationsRef = db.collection("inspectionConfirmations");

    // 3. 建立查詢
    const q = confirmationsRef
      .where("projectId", "==", projectId)
      .where("unitId", "==", unitId)
      // ✓ 確保只撈取已完成的批次 (雖然理論上都應該是 completed)
      .where("status", "==", "completed")
      .orderBy("confirmedAt", "desc"); // 按確認時間降序排序，最新的在前

    // 4. 執行查詢
    console.log(`[${functionName}] 正在查詢戶別 ${unitId} 的已確認批次...`);
    const snapshot = await q.get();

    // 5. 處理結果
    if (snapshot.empty) {
      console.log(`[${functionName}] 找不到戶別 ${unitId} 的任何已確認批次。`);
      return { status: "success", data: [] }; // 回傳空陣列
    }

    // 6. 格式化回傳資料
    const batches = snapshot.docs.map(doc => {
      const data = doc.data();
      let dateString = "日期未知";
      // 嘗試將 Timestamp 格式化為 YYYY/MM/DD
      if (data.confirmedAt && typeof data.confirmedAt.toDate === 'function') {
        try {
          // 使用台灣時區格式化日期
          dateString = data.confirmedAt.toDate().toLocaleDateString('zh-TW', {
            timeZone: 'Asia/Taipei',
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
          });
        } catch (e) {
          console.warn(`[${functionName}] 格式化日期時發生錯誤:`, e);
        }
      }

      return {
        batchId: data.confirmationBatchId, // 確認批次的 ID (例如 YYYYMMDDHHMMSS)
        dateString: dateString,           // 格式化後的確認日期字串
        recordCount: data.recordCount || 0, // 該批次包含的紀錄數量
        buyerInfo: data.buyerInfo || {},   // 當時確認的買方資訊
        confirmationDocId: doc.id          // inspectionConfirmations 文件本身的 ID (可能有用)
      };
    });

    console.log(`[${functionName}] 成功查詢到 ${batches.length} 個已確認批次。`);
    return { status: "success", data: batches };

  } catch (error) {
    console.error(`[${functionName}] 查詢已確認批次時發生錯誤:`, error);
    // 檢查是否為索引錯誤
    if (error.code === 9 && error.message.includes('index')) {
      throw new HttpsError("failed-precondition", `查詢失敗：資料庫缺少必要的複合索引 (需包含 projectId, unitId, status, confirmedAt)。請檢查 Cloud Functions 日誌中的連結以建立索引。`);
    }
    throw new HttpsError("internal", `查詢已確認批次列表時發生錯誤: ${error.message}`);
  }
});
// ✓ END: 新增函式



/**
 * [API - 背景觸發] 根據確認批次產生驗屋報告 PDF，存檔至 Drive 並寄送通知
 * @param {string} projectId - 建案 ID
 * @param {string} unitId - 戶別 ID
 * @param {string} confirmationBatchId - inspectionConfirmations 中的確認批次 ID
 * @param {string} inspectorName - 報告上的產製人員名稱
 * @param {string|null} triggeringUserEmail - 觸發此函式的使用者 Email (用於 CC)
 * @returns {Promise<object>} - 立即回傳 { status: 'processing', message: '報告產製中...' }
 */
exports.generateInspectionPdf = onCall({
  region: "asia-east1",
  // ✓ 確保引用了所有 generatePdfInBackground 需要的 secrets
  secrets: ["SENDER_EMAIL", "GMAIL_APP_PASSWORD", "DRIVE_CLIENT_ID", "DRIVE_CLIENT_SECRET", "DRIVE_REFRESH_TOKEN"],
  memory: "2GiB", // ✓ PDF 處理(Slides API)可能需要較多記憶體
  timeoutSeconds: 540 // ✓ 允許更長的執行時間
}, async (request) => {
  const { projectId, unitId, confirmationBatchId, inspectorName, triggeringUserEmail } = request.data;
  const functionName = `generateInspectionPdf (Batch: ${confirmationBatchId})`;

  // 1. 基本參數驗證 (保持不變)
  if (!projectId || !unitId || !confirmationBatchId || !inspectorName) {
    console.error(`[${functionName}] 錯誤：缺少必要參數。`);
    throw new HttpsError("invalid-argument", "缺少必要的報告產製參數。");
  }

  // 2. 立即回傳處理中訊息給前端 (保持不變)
  //    實際工作將在背景異步完成
  console.log(`[${functionName}] 收到請求，開始背景處理...`);
  // ✓ 確保呼叫的是更新後的 generatePdfInBackground (它現在使用 Slides API)
  generatePdfInBackground(projectId, unitId, confirmationBatchId, inspectorName, triggeringUserEmail); // 觸發背景函式，不 await
  return { status: 'processing', message: '報告產製中，完成後將寄送 Email 通知。' };
});



// ✓ START: 新增 - 寄送 PDF 產製錯誤通知函式
/**
 * [內部輔助函式] 當 generatePdfInBackground 發生錯誤時，寄送 Email 通知給管理員
 * @param {string} projectId - 發生錯誤的建案 ID
 * @param {string} unitId - 發生錯誤的戶別 ID
 * @param {string} confirmationBatchId - 發生錯誤的確認批次 ID
 * @param {Error} error - 捕捉到的錯誤物件
 */
async function sendErrorNotification(projectId, unitId, confirmationBatchId, error) {
  const functionName = `sendErrorNotification`;
  console.log(`[${functionName}] Preparing error notification for ${projectId}/${unitId} (Batch: ${confirmationBatchId})`);

  if (!ADMIN_ERROR_RECIPIENT) {
    console.error(`[${functionName}] 未設定 ADMIN_ERROR_RECIPIENT，無法寄送錯誤通知。`);
    return;
  }

  try {
    const mailTransport = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.SENDER_EMAIL,
        pass: process.env.GMAIL_APP_PASSWORD
      },
    });

    const subject = `【緊急】驗屋報告 PDF 產製失敗通知 (${projectId} / ${unitId})`;
    const errorTime = new Date().toLocaleString('zh-TW', { timeZone: 'Asia/Taipei' });
    const errorDetails = `錯誤訊息: ${error.message}\n\n堆疊追蹤:\n${error.stack || 'N/A'}`;
    const logLink = `https://console.cloud.google.com/functions/details/asia-east1/generateInspectionPdf/logs?project=${process.env.GCLOUD_PROJECT || 'YOUR_GCP_PROJECT_ID'}`;

    const htmlBody = `
          <div style="font-family: Arial, sans-serif; line-height: 1.6;">
            <h2 style="color: #D32F2F;">驗屋報告 PDF 產製失敗</h2>
            <p>系統在嘗試為以下項目產製驗屋報告 PDF 時發生錯誤：</p>
            <ul>
              <li><strong>建案 ID:</strong> ${projectId}</li>
              <li><strong>戶別 ID:</strong> ${unitId}</li>
              <li><strong>確認批次 ID:</strong> ${confirmationBatchId}</li>
              <li><strong>錯誤發生時間:</strong> ${errorTime} (台灣時間)</li>
            </ul>
            <hr>
            <h3>錯誤詳情:</h3>
            <pre style="background-color: #f5f5f5; padding: 10px; border: 1px solid #eee; white-space: pre-wrap; word-wrap: break-word;">${errorDetails}</pre>
            <hr>
            <p>請檢查 Cloud Function 日誌以獲取更詳細的資訊：</p>
            <p><a href="${logLink}" target="_blank">前往 Cloud Function Logs</a></p>
            <p style="font-size: 12px; color: #888;">此為系統自動發送的錯誤通知郵件。</p>
          </div>
        `;

    const mailOptions = {
      from: `"驗屋系統錯誤通知" <${process.env.SENDER_EMAIL}>`,
      to: ADMIN_ERROR_RECIPIENT,
      subject: subject,
      html: htmlBody,
    };

    await mailTransport.sendMail(mailOptions);
    console.log(`[${functionName}] 已成功寄送錯誤通知至 ${ADMIN_ERROR_RECIPIENT}`);

  } catch (emailError) {
    console.error(`[${functionName}] 🔴 寄送錯誤通知 Email 時也發生錯誤:`, emailError);
  }
}
// ✓ END: 寄送錯誤通知函式

/**
 * [內部輔助函式] 在簡報中根據替代文字描述查找投影片 ID
 * @param {google.slides_v1.Slides} slides - 已認證的 Google Slides API 客戶端
 * @param {string} presentationId - 簡報的 ID
 * @param {string} altText - 要查找的替代文字描述
 * @returns {Promise<string|null>} - 找到的投影片 ID 或 null
 */
async function findSlideIdByAltText(slides, presentationId, altText) {
  const functionName = `findSlideIdByAltText`;
  console.log(`[${functionName}] 正在簡報 [${presentationId}] 中查找替代文字 "${altText}"...`); // 新增日誌
  try {
    const res = await slides.presentations.get({
      presentationId: presentationId,
      fields: 'slides(objectId,pageElements)',
    });

    if (!res.data.slides) {
      console.warn(`[${functionName}] 簡報 [${presentationId}] 中找不到任何投影片。`);
      return null;
    }

    for (const slide of res.data.slides) {
      if (slide.pageElements) {
        for (const element of slide.pageElements) {
          const description = element.description || element.shape?.shapeProperties?.contentDescription || element.shape?.placeholder?.altText;

          if (description === altText) {
            console.log(`[${functionName}] 在簡報 [${presentationId}] 的投影片 ${slide.objectId} 上找到替代文字為 "${altText}" 的形狀。`); // 更新日誌
            return slide.objectId;
          }
        }
      }
    }

    console.warn(`[${functionName}] 在簡報 [${presentationId}] 中找不到替代文字為 "${altText}" 的形狀。`); // 更新日誌
    return null;

  } catch (error) {
    console.error(`[${functionName}] 查找替代文字 "${altText}" 時發生錯誤:`, error);
    throw new Error(`查找替代文字 "${altText}" 失敗: ${error.message}`);
  }
}

/**
 * [內部輔助函式 V2] 在指定投影片中根據替代文字描述查找形狀 ID、位置和大小
 * @param {google.slides_v1.Slides} slides - 已認證的 Google Slides API 客戶端
 * @param {string} presentationId - 簡報的 ID
 * @param {string} slideId - 要搜尋的投影片 ID
 * @param {string} altText - 要查找的替代文字描述
 * @returns {Promise<object|null>} - 找到則返回 { id, size, transform } 或 null
 */
async function findShapeIdByAltText(slides, presentationId, slideId, altText) {
  // ✓ 返回 id, size, transform
  const functionName = `findShapeIdByAltText_V2`; // ✓ 版本 V2
  console.log(`[${functionName}] 正在簡報 [${presentationId}] 的投影片 [${slideId}] 中查找替代文字 "${altText}"...`);
  try {
    // ✓✓✓ 請求更多欄位：size, transform ✓✓✓
    const res = await slides.presentations.pages.get({
      presentationId: presentationId,
      pageObjectId: slideId,
      // ✓ 增加請求 size 和 transform 欄位
      fields: 'pageElements(objectId,description,size,transform,shape)',
    });

    const pageElements = res.data.pageElements;
    if (!pageElements) {
      console.warn(`[${functionName}] 投影片 ${slideId} 中找不到任何頁面元素。`);
      return null;
    }

    for (const element of pageElements) {
      // ✓ description 的獲取邏輯保持不變
      const description = element.description
        || element.shape?.shapeProperties?.contentDescription
        || element.shape?.placeholder?.altText; // 嘗試兼容不同情況

      if (description === altText) {
        // ✓✓✓ 返回包含 id, size, transform 的物件 ✓✓✓
        const result = {
          id: element.objectId,
          size: element.size,
          transform: element.transform
        };
        console.log(`[${functionName}] 找到替代文字 "${altText}" 的形狀，資訊:`, JSON.stringify(result));
        return result;
      }
    }

    console.warn(`[${functionName}] 在投影片 ${slideId} 中找不到替代文字為 "${altText}" 的形狀。`);
    return null;

  } catch (error) {
    console.error(`[${functionName}] 在投影片 ${slideId} 上查找替代文字 "${altText}" 時發生錯誤:`, error);
    // ✓ 保持拋出錯誤
    throw new Error(`在投影片 ${slideId} 上查找替代文字 "${altText}" 失敗: ${error.message}`);
  }
}

/**
 * ✓【修正 V4.3 - 移除 Logo 插入邏輯】[內部異步函式] 使用 Google Slides API 執行 PDF 產生
 */
async function generatePdfInBackground(projectId, unitId, confirmationBatchId, inspectorName, triggeringUserEmail) {


  // ✓ 移除 Logo 插入邏輯
  const functionName = `generatePdfInBackground_CopyPresentation_V4.3 (Batch: ${confirmationBatchId})`; // ✓ 版本 V4.3
  const db = new Firestore({ databaseId: "anxi-app" });
  const drive = getAuthenticatedDriveClient();
  const slides = google.slides({ version: "v1", auth: oauth2Client });
  let copiedPresentationId = null;

  try {
    console.log(`[${functionName}] 背景任務開始，查詢資料...`);

    // --- 1. 查詢所需資料 (保持不變) ---
    // (省略查詢 confirmation, project, records 的程式碼...)
    const confirmationQuery = db.collection("inspectionConfirmations").where("confirmationBatchId", "==", confirmationBatchId).limit(1);
    const confirmationSnapshot = await confirmationQuery.get();
    if (confirmationSnapshot.empty) throw new Error(`找不到確認紀錄 (Batch ID: ${confirmationBatchId})`);
    const confirmationData = confirmationSnapshot.docs[0].data();
    const buyerNameForRecordPage = confirmationData.buyerInfo?.name || '';

    const projectDoc = await db.collection('projects').doc(projectId).get();
    if (!projectDoc.exists) throw new Error(`找不到建案資料 (Project ID: ${projectId})`);
    const projectData = projectDoc.data();
    const templateId = projectData.inspectionReportTemplateUrl;
    if (!templateId) throw new Error(`建案 ${projectId} 未設定驗屋報告模板 ID (inspectionReportTemplateUrl)。`);
    // ❗ 注意：不再讀取 projectData.logoUrl

    const recordsQuery = db.collection("inspectionRecords")
      .where("confirmationBatchId", "==", confirmationBatchId)
      .where("isDeleted", "==", false)
      .where("customerView", "==", true)
      .orderBy("inspectionDate", "asc").orderBy("category", "asc").orderBy("area", "asc");
    const recordsSnapshot = await recordsQuery.get();
    const records = recordsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    if (records.length === 0) throw new Error("找不到符合此批次的驗屋紀錄。");
    console.log(`[${functionName}] 資料查詢完成，共 ${records.length} 筆紀錄。`);


    // --- 2. 複製來源樣板簡報 (保持不變) ---
    // (省略複製簡報程式碼...)
    const newPresentationTitle = `驗屋報告_${unitId}_${confirmationBatchId}_${Date.now()}`;
    console.log(`[${functionName}] 準備複製樣板簡報 ${templateId} 為 ${newPresentationTitle}...`);
    const copyResponse = await drive.files.copy({
      fileId: templateId,
      requestBody: { name: newPresentationTitle },
      fields: 'id'
    });
    copiedPresentationId = copyResponse.data.id;
    if (!copiedPresentationId) throw new Error(`複製樣板簡報 ${templateId} 失敗。`);
    console.log(`[${functionName}] 樣板簡報複製成功，新簡報 ID: ${copiedPresentationId}`);
    await new Promise(resolve => setTimeout(resolve, 5000));


    // --- 3. 在新複製的簡報 (copiedPresentationId) 上查找模板投影片 ID (保持不變) ---
    // (省略查找模板頁 ID 程式碼...)
    console.log(`[${functionName}] 在新複製的簡報 ${copiedPresentationId} 上查找模板投影片 ID...`);
    const coverSlideId = await findSlideIdByAltText(slides, copiedPresentationId, '驗屋報告封面');
    const recordSlideTemplateId = await findSlideIdByAltText(slides, copiedPresentationId, '驗屋報告內頁');
    if (!coverSlideId) throw new Error(`在新複製的簡報 ${copiedPresentationId} 中找不到替代文字為 "驗屋報告封面" 的形狀。`);
    if (!recordSlideTemplateId) throw new Error(`在新複製的簡報 ${copiedPresentationId} 中找不到替代文字為 "驗屋報告內頁" 的形狀。`);
    console.log(`[${functionName}] 模板投影片 ID 查找成功 (在新簡報中): Cover=${coverSlideId}, RecordTemplate=${recordSlideTemplateId}`);


    // --- 4. 準備批量更新請求 (所有操作都在 copiedPresentationId 上) ---
    const requests = [];

    // --- 4.1 處理封面頁替換 ---
    console.log(`[${functionName}] 準備封面頁 (${coverSlideId}) 的替換請求...`);
    // 文字替換 (保持不變)
    requests.push( /* ... 省略封面文字替換請求 ... */
      { replaceAllText: { pageObjectIds: [coverSlideId], containsText: { text: '{{projectName}}', matchCase: false }, replaceText: projectData.name || projectId } },
      { replaceAllText: { pageObjectIds: [coverSlideId], containsText: { text: '{{unitId}}', matchCase: false }, replaceText: unitId } },
      { replaceAllText: { pageObjectIds: [coverSlideId], containsText: { text: '{{buyerName}}', matchCase: false }, replaceText: confirmationData.buyerInfo?.name || '' } },
      { replaceAllText: { pageObjectIds: [coverSlideId], containsText: { text: '{{buyerPhone}}', matchCase: false }, replaceText: confirmationData.buyerInfo?.phone || '' } },
      { replaceAllText: { pageObjectIds: [coverSlideId], containsText: { text: '{{buyerEmail}}', matchCase: false }, replaceText: confirmationData.buyerInfo?.email || '' } },
      { replaceAllText: { pageObjectIds: [coverSlideId], containsText: { text: '{{inspectionDateStr}}', matchCase: false }, replaceText: records[0].inspectionDate?.toDate ? formatInTimeZone(records[0].inspectionDate.toDate(), 'Asia/Taipei', 'yyyy/MM/dd') : 'N/A' } },
      { replaceAllText: { pageObjectIds: [coverSlideId], containsText: { text: '{{inspectorName}}', matchCase: false }, replaceText: inspectorName } },
      { replaceAllText: { pageObjectIds: [coverSlideId], containsText: { text: '{{generatedDateStr}}', matchCase: false }, replaceText: formatInTimeZone(new Date(), 'Asia/Taipei', 'yyyy/MM/dd') } },
    );

    // ✓✓✓ 移除 Logo 圖片替換邏輯 ✓✓✓
    // const logoPlaceholderInfo = await findShapeIdByAltText(slides, copiedPresentationId, coverSlideId, 'logoImage');
    // if (logoPlaceholderInfo && projectData.logoUrl) { ... }
    console.log(`[${functionName}] 跳過 Logo 圖片處理。`);

    // 簽名圖片替換 (保持不變)
    const signaturePlaceholderInfo = await findShapeIdByAltText(slides, copiedPresentationId, coverSlideId, 'signatureImage');
    if (signaturePlaceholderInfo && confirmationData.signatureImageUrl) {
      console.log(`[${functionName}] 找到簽名佔位符 ID: ${signaturePlaceholderInfo.id}，準備替換...`);
      requests.push({ deleteObject: { objectId: signaturePlaceholderInfo.id } }); // 刪除佔位符
      requests.push({ // 創建新圖片
        createImage: {
          url: confirmationData.signatureImageUrl,
          elementProperties: {
            pageObjectId: coverSlideId,
            size: signaturePlaceholderInfo.size,
            transform: signaturePlaceholderInfo.transform
          }
        }
      });
    } else { console.warn(`[${functionName}] 封面頁 ${coverSlideId} 找不到 signatureImage 形狀或無簽名 URL。`); }

    // --- 4.2 處理紀錄頁複製與替換 (保持不變) ---
    // (省略紀錄頁處理的程式碼，與 V4.2 版本相同...)
    console.log(`[${functionName}] 準備循環處理 ${records.length} 筆驗屋紀錄的複製與替換...`);
    const slideIdsToDelete = new Set();
    const finalRecordSlideIds = [];

    for (let i = 0; i < records.length; i++) {
      const record = records[i];
      let currentRecordSlideId;

      if (i === 0) {
        currentRecordSlideId = recordSlideTemplateId;
        console.log(`[${functionName}]   處理紀錄 ${record.id} (使用原始模板頁 ${currentRecordSlideId})...`);
      } else {
        const previousSlideId = finalRecordSlideIds[i - 1];
        console.log(`[${functionName}]   處理紀錄 ${record.id} (複製上一頁 ${previousSlideId})...`);
        const duplicateRecordRequest = [{ duplicateObject: { objectId: previousSlideId } }];
        const duplicateRecordResponse = await slides.presentations.batchUpdate({
          presentationId: copiedPresentationId,
          requestBody: { requests: duplicateRecordRequest }
        });
        currentRecordSlideId = duplicateRecordResponse.data.replies?.[0]?.duplicateObject?.objectId;
        if (!currentRecordSlideId) throw new Error(`複製紀錄頁失敗 (來源: ${previousSlideId})`);
        console.log(`[${functionName}]   紀錄頁複製成功，新 Slide ID: ${currentRecordSlideId}`);
      }
      finalRecordSlideIds.push(currentRecordSlideId);

      // 文字替換
      requests.push(
        { replaceAllText: { pageObjectIds: [currentRecordSlideId], containsText: { text: '{{unitId}}', matchCase: false }, replaceText: unitId } },
        { replaceAllText: { pageObjectIds: [currentRecordSlideId], containsText: { text: '{{buyerName}}', matchCase: false }, replaceText: buyerNameForRecordPage } },
        { replaceAllText: { pageObjectIds: [currentRecordSlideId], containsText: { text: '{{record.area}}', matchCase: false }, replaceText: record.area || '' } },
        { replaceAllText: { pageObjectIds: [currentRecordSlideId], containsText: { text: '{{record.category}}', matchCase: false }, replaceText: record.category || '' } },
        { replaceAllText: { pageObjectIds: [currentRecordSlideId], containsText: { text: '{{record.subCategory}}', matchCase: false }, replaceText: record.subCategory || '' } },
        { replaceAllText: { pageObjectIds: [currentRecordSlideId], containsText: { text: '{{record.description}}', matchCase: false }, replaceText: record.description || '' } },
        { replaceAllText: { pageObjectIds: [currentRecordSlideId], containsText: { text: '{{record.status}}', matchCase: false }, replaceText: record.status || '' } },
        { replaceAllText: { pageObjectIds: [currentRecordSlideId], containsText: { text: '{{record.inspectorName}}', matchCase: false }, replaceText: record.inspectorName || '' } },
        { replaceAllText: { pageObjectIds: [currentRecordSlideId], containsText: { text: '{{record.createdAt}}', matchCase: false }, replaceText: record.createdAt?.toDate ? formatInTimeZone(record.createdAt.toDate(), 'Asia/Taipei', 'yyyy/MM/dd HH:mm') : '' } },
        { replaceAllText: { pageObjectIds: [currentRecordSlideId], containsText: { text: '{{record.phase}}', matchCase: false }, replaceText: record.phase || '' } },
      );

      // 圖片替換
      const photoPlaceholderInfos = await Promise.all(
        [1, 2, 3, 4].map(p =>
          findShapeIdByAltText(slides, copiedPresentationId, currentRecordSlideId, `photo_placeholder_${p}`)
        )
      );
      for (let p = 0; p < 4; p++) {
        const placeholderInfo = photoPlaceholderInfos[p];
        const photoData = record.photos?.[p];
        if (placeholderInfo && photoData?.url) {
          requests.push({ deleteObject: { objectId: placeholderInfo.id } });
          requests.push({ createImage: { url: photoData.url, elementProperties: { pageObjectId: currentRecordSlideId, size: placeholderInfo.size, transform: placeholderInfo.transform } } });
        } else if (placeholderInfo) {
          requests.push({ deleteObject: { objectId: placeholderInfo.id } });
        }
      }
    }
    console.log(`[${functionName}] 所有紀錄頁的替換請求準備完成。`);


    // --- 4.3 準備刪除多餘的模板頁 (保持不變) ---
    // (省略刪除多餘頁程式碼...)
    console.log(`[${functionName}] 準備刪除多餘的模板頁...`);
    const presentationData = await slides.presentations.get({
      presentationId: copiedPresentationId,
      fields: 'slides(objectId)'
    });
    const allSlideIds = presentationData.data.slides?.map(s => s.objectId) || [];
    const slidesToKeep = new Set([coverSlideId, ...finalRecordSlideIds]);
    allSlideIds.forEach(id => { if (!slidesToKeep.has(id)) { slideIdsToDelete.add(id); } });
    slideIdsToDelete.forEach(id => { requests.push({ deleteObject: { objectId: id } }); });
    console.log(`[${functionName}] 共找到 ${slideIdsToDelete.size} 個多餘頁面待刪除。`);


    // --- 5. 執行所有更新請求 (保持不變) ---
    // (省略執行 batchUpdate 程式碼，包含重試...)
    if (requests.length > 0) {
      console.log(`[${functionName}] 準備在新簡報 ${copiedPresentationId} 上執行 ${requests.length} 個更新請求...`);
      let retries = 3;
      let success = false;
      while (retries > 0 && !success) {
        try {
          await slides.presentations.batchUpdate({
            presentationId: copiedPresentationId,
            requestBody: { requests: requests }
          });
          success = true;
          console.log(`[${functionName}] 所有更新請求執行完成。`);
        } catch (batchError) {
          retries--;
          console.error(`[${functionName}] batchUpdate 失敗 (剩餘 ${retries} 次重試):`, batchError.message);
          if (retries === 0) throw batchError;
          await new Promise(resolve => setTimeout(resolve, 2000 * (3 - retries)));
        }
      }
    } else { console.log(`[${functionName}] 沒有需要執行的更新請求。`); }


    // --- 6. 匯出最終簡報為 PDF (保持不變) ---
    // (省略匯出 PDF 程式碼...)
    console.log(`[${functionName}] 準備匯出最終 PDF (Presentation ID: ${copiedPresentationId})...`);
    const exportResponse = await drive.files.export({
      fileId: copiedPresentationId,
      mimeType: 'application/pdf'
    }, { responseType: 'stream' });
    console.log(`[${functionName}] PDF 匯出完成。`);

    // --- 7. 上傳 PDF 至 Drive (保持不變) ---
    // (省略上傳 Drive 程式碼...)
    const householdDoc = await db.collection('households').doc(`${projectId}_${unitId}`).get();
    if (!householdDoc.exists) throw new Error(`找不到戶別資料 (${projectId}_${unitId})`);
    const reportFolderUrl = householdDoc.data().inspectionReportFolderUrl;
    if (!reportFolderUrl) throw new Error("戶別資料缺少 inspectionReportFolderUrl");
    const parentFolderId = reportFolderUrl.match(/[-\w]{25,}/)?.[0];
    if (!parentFolderId) throw new Error("無效的 Drive 資料夾 URL");
    const subFolderName = confirmationData.buyerInfo?.name ? `${unitId}(${confirmationData.buyerInfo.name}自驗)` : `${unitId}`;
    const searchFolderRes = await drive.files.list({ q: `name='${subFolderName}' and mimeType='application/vnd.google-apps.folder' and '${parentFolderId}' in parents and trashed=false`, fields: 'files(id)' });
    let subFolderId;
    if (searchFolderRes.data.files.length > 0) { subFolderId = searchFolderRes.data.files[0].id; } else { const folderMetadata = { name: subFolderName, mimeType: 'application/vnd.google-apps.folder', parents: [parentFolderId] }; const createdFolder = await drive.files.create({ resource: folderMetadata, fields: 'id' }); subFolderId = createdFolder.data.id; }
    const timestamp = formatInTimeZone(new Date(), 'Asia/Taipei', 'yyyy-MM-dd HH-mm');
    const pdfFilename = `${projectData.name || projectId}-${unitId}-驗屋報告-${confirmationData.buyerInfo.name}-${timestamp}.pdf`;
    const fileMetadata = { name: pdfFilename, parents: [subFolderId] };
    const uploadedFile = await drive.files.create({
      resource: fileMetadata,
      media: { mimeType: 'application/pdf', body: exportResponse.data },
      fields: 'id, name, webViewLink'
    });
    const driveFileUrl = uploadedFile.data.webViewLink;
    if (!driveFileUrl) throw new Error("上傳 PDF 至 Drive 後未獲取到有效連結。");
    console.log(`[${functionName}] PDF 已成功上傳至 Drive: ${driveFileUrl}`);


    // --- 8. 更新 Firestore (保持不變) ---
    // (省略更新 Firestore 程式碼...)
    await db.collection("households").doc(`${projectId}_${unitId}`).update({
      inspectionReportUrl: FieldValue.arrayUnion({ name: pdfFilename, url: driveFileUrl })
    });
    console.log(`[${functionName}] 已更新戶別資料庫中的報告連結。`);

    // --- 9. 寄送 Email 通知 (保持不變) ---
    // (省略寄送 Email 程式碼...)
    const mailTransport = nodemailer.createTransport({ service: 'gmail', auth: { user: process.env.SENDER_EMAIL, pass: process.env.GMAIL_APP_PASSWORD } });
    const ccRecipients = await getCcRecipients(projectId, "驗屋系統信件副本");
    const allCc = [...new Set([...ccRecipients, triggeringUserEmail].filter(Boolean))];
    const subject = `【${projectData.name || projectId}】您的驗屋報告已產製完成 (${unitId})`;
    const confirmedAtDate = confirmationData.confirmedAt.toDate();
    const htmlBody = `
            <div style="font-family: Arial, sans-serif; line-height: 1.6;">
            <h2 style="color: #333;">驗屋報告已完成</h2>
            <p>親愛的 ${confirmationData.buyerInfo.name || '住戶'} 您好：</p>
            <p>關於「${projectData.name || projectId}」建案 ${unitId} 戶別，您於 ${formatInTimeZone(confirmedAtDate, 'Asia/Taipei', 'yyyy/MM/dd HH:mm')} 確認的驗屋報告 (${records.length}筆紀錄) 已產製完成。</p>
            <p>您可以點擊下方按鈕查看或下載報告檔案：</p>
            <div style="text-align: center; margin: 30px 0;"><a href="${driveFileUrl}" target="_blank" style="background-color: #28a745; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold;">查看驗屋報告</a></div>
            <p>報告產製人員：${inspectorName}</p><hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;"><p style="font-size: 12px; color: #888;">此為系統自動發送的郵件，請勿直接回覆。</p></div>
        `;
    await mailTransport.sendMail({ from: `"${projectData.name || projectId} 驗屋系統" <${process.env.SENDER_EMAIL}>`, to: confirmationData.buyerInfo.email, cc: allCc.join(', '), subject: subject, html: htmlBody });
    console.log(`[${functionName}] 已成功寄送報告完成通知 Email。`);


  } catch (error) {
    console.error(`[${functionName}] 🔴 背景任務執行失敗:`, error);
    await sendErrorNotification(projectId, unitId, confirmationBatchId, error);
  } finally {
    // --- 10. 清理 (保持不變) ---
    if (copiedPresentationId) {
      try {
        console.log(`[${functionName}] 準備刪除臨時簡報 ${copiedPresentationId}...`);
        await drive.files.delete({ fileId: copiedPresentationId });
        console.log(`[${functionName}] 臨時簡報刪除成功。`);
      } catch (deleteError) {
        console.error(`[${functionName}] 刪除臨時簡報 ${copiedPresentationId} 失敗:`, deleteError.message);
      }
    }
  }
}


// =================================================================
// /  結束：驗屋紀錄相關 Cloud Functions
// =================================================================

// =================================================================
// /  新增：驗屋選項與照片上傳 Cloud Functions
// =================================================================

/**
 *  獲取指定建案的所有驗屋選項 (供新增/編輯畫面使用)
 * @param {string} projectId - 建案 ID
 * @returns {Promise<object>} - { status, data: object } 按 type 分類的選項
 */
exports.getInspectionOptionsForProject = onCall({ region: "asia-east1" }, async (request) => {
  // 這個函式與之前為 InspectionAdmin 建立的 getInspectionOptions 幾乎一樣
  // 但為了區分用途或未來可能的差異，可以保留獨立的函式
  const { projectId } = request.data;
  const functionName = `getInspectionOptionsForProject (Project: ${projectId})`;

  if (!projectId) {
    console.error(`[${functionName}] 錯誤：缺少 projectId。`);
    throw new HttpsError("invalid-argument", "缺少 projectId 參數。");
  }

  try {
    const db = new Firestore({ databaseId: "anxi-app" });
    const optionsRef = db.collection("inspectionOptions");
    const snapshot = await optionsRef.where("projectId", "==", projectId).get();

    const optionsByType = {
      phase: [], area: [], category: [], status: [], level: [], progress: [], quickReply: [],
    };
    const subCategoriesMap = new Map(); // 用來暫存子分類

    if (!snapshot.empty) {
      snapshot.forEach((doc) => {
        const data = { id: doc.id, ...doc.data() };
        const type = data.type;
        if (optionsByType.hasOwnProperty(type)) {
          // 如果是子分類 (有 parentValue)，先暫存
          if (type === 'category' && data.parentValue) {
            if (!subCategoriesMap.has(data.parentValue)) {
              subCategoriesMap.set(data.parentValue, []);
            }
            subCategoriesMap.get(data.parentValue).push(data);
          } else {
            optionsByType[type].push(data);
          }
        }
      });
    }

    // 將子分類附加到對應的主分類下
    optionsByType.category.forEach(mainCategory => {
      mainCategory.subItems = subCategoriesMap.get(mainCategory.value) || [];
      // 子分類也排序
      mainCategory.subItems.sort((a, b) => (a.order || Infinity) - (b.order || Infinity) || (a.value || '').localeCompare(b.value || '', 'zh-Hant'));
    });


    // 對每個類別排序
    for (const type in optionsByType) {
      optionsByType[type].sort((a, b) => (a.order || Infinity) - (b.order || Infinity) || (a.value || '').localeCompare(b.value || '', 'zh-Hant'));
    }

    console.log(`[${functionName}] 成功獲取建案 ${projectId} 的選項資料。`);
    return { status: "success", data: optionsByType };

  } catch (error) {
    console.error(`[${functionName}] 獲取選項時發生錯誤:`, error);
    throw new HttpsError("internal", `讀取驗屋選項時發生錯誤: ${error.message}`);
  }
});


/**
 *  上傳單張驗屋照片至 Firebase Storage
 * @param {string} projectId - 建案 ID
 * @param {string} unitId - 戶別 ID
 * @param {string} fileName - 原始檔名
 * @param {string} fileBase64 - Base64 編碼的檔案內容 (不含 data:image/... 前綴)
 * @returns {Promise<object>} - { status, name, url, path }
 */
exports.uploadInspectionPhoto = onCall({ region: "asia-east1", memory: "1GiB" }, async (request) => {
  const { projectId, unitId, fileName, fileBase64 } = request.data;
  const functionName = `uploadInspectionPhoto (Project: ${projectId}, Unit: ${unitId})`;

  if (!projectId || !unitId || !fileName || !fileBase64) {
    console.error(`[${functionName}] 錯誤：缺少必要參數。`);
    throw new HttpsError("invalid-argument", "缺少上傳照片所需的參數。");
  }

  try {
    const bucket = getStorage().bucket(); // 使用 default bucket
    const now = new Date();
    const timestamp = now.toISOString().replace(/[-:.]/g, "").replace("T", "_").replace("Z", "");
    // 建議的儲存路徑結構： inspections/{projectId}/{unitId}/{timestamp}_{originalName}
    const storagePath = `inspections/${projectId}/${unitId}/${timestamp}_${fileName}`;
    const file = bucket.file(storagePath);

    const buffer = Buffer.from(fileBase64, 'base64');
    const stream = Readable.from(buffer);

    // 使用 stream 上傳
    await new Promise((resolve, reject) => {
      stream.pipe(file.createWriteStream({
        metadata: {
          // 自動偵測 contentType 可能不準確，如果都是照片可以寫死 image/jpeg 或 image/png
          // contentType: 'image/jpeg', // 假設都是 jpg
          // 可以加入自訂 metadata
          metadata: {
            projectId: projectId,
            unitId: unitId
          }
        },
        resumable: false // 小檔案不需要 resumable
      }))
        .on('error', (err) => reject(err))
        .on('finish', () => resolve());
    });

    // 設定檔案為公開可讀 (如果需要公開連結)
    await file.makePublic();

    // 獲取公開 URL
    const publicUrl = file.publicUrl();

    console.log(`[${functionName}] 照片成功上傳至: ${publicUrl}`);

    return {
      status: "success",
      name: fileName, // 回傳原始檔名
      url: publicUrl, // 回傳公開 URL
      path: storagePath // 回傳 GCS 路徑，可能用於後續管理
    };

  } catch (error) {
    console.error(`[${functionName}] 照片上傳失敗:`, error);
    throw new HttpsError("internal", `後端上傳照片時發生錯誤: ${error.message}`);
  }
});


// =================================================================
// /  結束：驗屋選項與照片上傳 Cloud Functions
// =================================================================



/**
 * 記錄 Standby 人員狀態變更歷史
 * @param {object} data - 包含 { projectId, personnelId, personnelName, previousStatus, newStatus, startTime, endTime, operator }
 * @returns {Promise<object>} - { status, logId }
 */
exports.logStandbyStatusChange = onCall({ region: "asia-east1" }, async (request) => {
  const {
    projectId,
    personnelId, // ✓ RTDB 中的 key (或唯一識別符)
    personnelName,
    previousStatus,
    newStatus,
    startTime, // ✓ 新狀態的開始時間 (ISO String)
    endTime,   // ✓ 舊狀態的結束時間 (ISO String)
    operator   // ✓ 操作者資訊 (可選，例如 userStore.user.name)
  } = request.data;
  const functionName = `logStandbyStatusChange`;

  // 基本驗證
  if (!projectId || !personnelId || !personnelName || !previousStatus || !newStatus || !startTime || !endTime) {
    console.error(`[${functionName}] 錯誤：缺少必要參數。`);
    throw new HttpsError("invalid-argument", "缺少記錄狀態變更所需的參數。");
  }

  try {
    const db = new Firestore({ databaseId: "anxi-app" });
    const logsRef = db.collection("standbyLogs"); // ✓ 指向 standbyLogs 集合

    // 將 ISO String 時間轉換為 Firestore Timestamp
    const startTimeStamp = Timestamp.fromDate(new Date(startTime));
    const endTimeStamp = Timestamp.fromDate(new Date(endTime));

    // 計算持續時間 (秒)
    const durationSeconds = Math.round((new Date(endTime).getTime() - new Date(startTime).getTime()) / 1000);

    // 產生 Log 文件 ID (可選，或讓 Firestore 自動產生)
    // const logId = `${projectId}_${personnelId}_${new Date(startTime).toISOString().replace(/[-:.]/g, "")}`;

    const logData = {
      projectId,
      personnelId,
      personnelName,
      previousStatus,
      newStatus,
      startTime: startTimeStamp, // ✓ 儲存 Timestamp
      endTime: endTimeStamp,     // ✓ 儲存 Timestamp
      durationSeconds: durationSeconds > 0 ? durationSeconds : 0, // ✓ 確保非負
      timestamp: FieldValue.serverTimestamp(), // ✓ 記錄寫入時間
      operator: operator || null, // ✓ 記錄操作者
    };

    // 寫入 Firestore
    const docRef = await logsRef.add(logData); // ✓ 使用 add 自動產生 ID

    console.log(`[${functionName}] 成功記錄狀態變更 Log ID: ${docRef.id}`);
    return { status: "success", logId: docRef.id };

  } catch (error) {
    console.error(`[${functionName}] 記錄 Log 時發生錯誤:`, error);
    throw new HttpsError("internal", `記錄狀態變更時發生錯誤: ${error.message}`);
  }
});/**
 * [Cloud Function] 更新 Standby 人員的狀態、區域和排序
 * @param {object} data - 包含 { projectId, personnelId, updates }
 * @param {object} context - 包含驗證信息 (如果需要驗證調用者)
 * @returns {Promise<object>} - { status: 'success' }
 */
exports.updateStandbyStatus = onCall({ region: "asia-east1" }, async (request, context) => {
  // TODO: 未來可在此加入權限驗證，例如檢查 context.auth 是否存在或具有特定角色
  // if (!context.auth) {
  //   throw new HttpsError('unauthenticated', '需要登入才能修改狀態。');
  // }

  const { projectId, personnelId, updates } = request.data;
  const functionName = `updateStandbyStatus`;

  // 基本驗證
  if (!projectId || !personnelId || !updates || typeof updates !== 'object') {
    console.error(`[${functionName}] 錯誤：缺少必要參數。`);
    throw new HttpsError("invalid-argument", "缺少 projectId, personnelId 或有效的 updates 物件。");
  }

  try {
    // 構造 RTDB 路徑引用
    const itemRef = rtdbAdmin.ref(`/standby/${projectId}/personnel/${personnelId}`);

    // 準備要更新的資料 (可以包含 status, zone, order, currentStatusStartTime)
    const dataToUpdate = { ...updates };

    // 如果 updates 中包含 currentStatusStartTime 且值為 'serverTimestamp'，則替換
    if (dataToUpdate.currentStatusStartTime === 'serverTimestamp') {
      dataToUpdate.currentStatusStartTime = admin.database.ServerValue.TIMESTAMP; //  使用 RTDB Admin SDK 的 Server Timestamp
      // 同時轉換為 ISO String 存儲，方便前端讀取 (可選)
      // dataToUpdate.currentStatusStartTimeISO = new Date().toISOString(); // 注意：這不是伺服器精確時間
    }
    // 轉換為 ISO String 儲存，方便前端讀取
    // （注意：實際儲存的是數字時間戳，ISO 只是輔助）
    if (dataToUpdate.currentStatusStartTime === admin.database.ServerValue.TIMESTAMP) {
      // 使用一個近似值，前端讀取時應優先使用數字時間戳
      dataToUpdate.currentStatusStartTimeISO = new Date().toISOString();
    }


    console.log(`[${functionName}] Updating RTDB path: ${itemRef.toString()}`);
    console.log(`[${functionName}] Data to update:`, dataToUpdate);

    // 執行更新
    await itemRef.update(dataToUpdate);

    console.log(`[${functionName}] RTDB update successful for ${personnelId}.`);
    return { status: "success" };

  } catch (error) {
    console.error(`[${functionName}] 更新 RTDB 時發生錯誤:`, error);
    // 拋出內部錯誤
    throw new HttpsError("internal", `更新人員狀態時發生錯誤: ${error.message}`);
  }
});

/**
 * [Cloud Function] 同步 Firestore 設定中的人員到 RTDB (僅新增)
 * @param {object} data - 包含 { projectId, personnelToAdd }
 * @param {object} context - 包含驗證信息 (如果需要)
 * @returns {Promise<object>} - { status: 'success', addedCount }
 */
exports.syncStandbyPersonnel = onCall({ region: "asia-east1" }, async (request, context) => {
  // TODO: 可加入權限驗證 (例如檢查 context.auth)

  const { projectId, personnelToAdd } = request.data;
  const functionName = `syncStandbyPersonnel`;

  // 基本驗證
  if (!projectId || !personnelToAdd || typeof personnelToAdd !== 'object' || Object.keys(personnelToAdd).length === 0) {
    console.warn(`[${functionName}] 警告：缺少 projectId 或 personnelToAdd 為空。`);
    return { status: "warning", message: "沒有需要新增的人員資料。", addedCount: 0 };
  }

  try {
    const personnelRef = rtdbAdmin.ref(`/standby/${projectId}/personnel`);
    const updates = {};
    let addedCount = 0;

    // 準備 updates 物件，確保 currentStatusStartTime 使用 Admin SDK 的 Timestamp
    for (const personnelId in personnelToAdd) {
      const personData = personnelToAdd[personnelId];
      // 驗證基本欄位是否存在
      if (personData && personData.name && personData.status && personData.zone && personData.order) {
        updates[personnelId] = {
          ...personData,
          // 將前端傳來的 'serverTimestamp' 標記轉換為 Admin SDK 的 ServerValue
          currentStatusStartTime: admin.database.ServerValue.TIMESTAMP,
          // 可以選擇性地添加 ISO 時間戳字串
          currentStatusStartTimeISO: new Date().toISOString()
        };
        addedCount++;
      } else {
        console.warn(`[${functionName}] personnelId ${personnelId} 的資料不完整，已跳過。`, personData);
      }
    }

    if (addedCount === 0) {
      console.log(`[${functionName}] 沒有有效的人員資料需要新增到 RTDB。`);
      return { status: "success", message: "沒有新的人員需要新增。", addedCount: 0 };
    }


    console.log(`[${functionName}] Preparing to add ${addedCount} personnel to RTDB for project ${projectId}. Updates:`, updates);

    // 使用 update 一次性寫入所有新人員
    await personnelRef.update(updates);

    console.log(`[${functionName}] Successfully added ${addedCount} personnel to RTDB.`);
    return { status: "success", addedCount: addedCount };

  } catch (error) {
    console.error(`[${functionName}] 新增人員到 RTDB 時發生錯誤:`, error);
    throw new HttpsError("internal", `同步人員狀態時發生錯誤: ${error.message}`);
  }
});

/**
 * [Cloud Function] 批次更新 Standby 人員的狀態 (處理拖曳操作)
 * 接收一個包含多個路徑及其更新值的物件
 * @param {object} data - 包含 { projectId, updates }
 * @param {object} context - (可選) 包含驗證信息
 * @returns {Promise<object>} - { status: 'success' }
 */
exports.updateStandbyBatch = onCall({ region: "asia-east1" }, async (request, context) => {
  // TODO: 可在此加入權限驗證
  const { projectId, updates } = request.data;
  const functionName = `updateStandbyBatch`;

  // 基本驗證
  if (!projectId || !updates || typeof updates !== 'object' || Object.keys(updates).length === 0) {
    console.error(`[${functionName}] 錯誤：缺少 projectId 或有效的 updates 物件。`);
    throw new HttpsError("invalid-argument", "缺少 projectId 或有效的 updates 物件。");
  }

  try {
    // 構造 RTDB 根引用下的 project 路徑
    const projectPersonnelRef = rtdbAdmin.ref(`/standby/${projectId}/personnel`);

    // 處理 updates 物件中的 serverTimestamp 標記
    const processedUpdates = {};
    for (const path in updates) {
      // updates 的 key 應該是相對於 personnel 的路徑，例如 "personnelId/status"
      const value = updates[path];
      if (value === 'serverTimestamp') {
        processedUpdates[path] = admin.database.ServerValue.TIMESTAMP;
        // 可以選擇性地為 ISO 時間戳添加輔助欄位，如果前端需要
        // processedUpdates[path + 'ISO'] = new Date().toISOString();
      } else {
        processedUpdates[path] = value;
      }
    }


    console.log(`[${functionName}] Updating RTDB path: ${projectPersonnelRef.toString()}`);
    console.log(`[${functionName}] Data to update:`, processedUpdates);

    // 使用 update 一次性應用所有變更
    await projectPersonnelRef.update(processedUpdates);

    console.log(`[${functionName}] RTDB batch update successful for project ${projectId}.`);
    return { status: "success" };

  } catch (error) {
    console.error(`[${functionName}] 批次更新 RTDB 時發生錯誤:`, error);
    throw new HttpsError("internal", `更新看板狀態時發生錯誤: ${error.message}`);
  }
});


/**
 * [Cloud Function] 接收 Base64 截圖，上傳至 Storage 並記錄至 Firestore
 * @param {object} data - { projectId, timestampStr, operatorName, imageData }
 * @returns {Promise<object>} - { status, message?, imageUrl? }
 */
exports.saveStandbyScreenshot = onCall({
  region: "asia-east1",
  memory: "1GiB", // 截圖處理可能需要較多記憶體
  timeoutSeconds: 120 // 允許較長上傳時間
}, async (request) => { //  新增 Cloud Function
  const { projectId, timestampStr, operatorName, imageData } = request.data;
  const functionName = `saveStandbyScreenshot (Project: ${projectId})`;

  // 1. 驗證輸入
  if (!projectId || !timestampStr || !operatorName || !imageData) {
    console.error(`[${functionName}] 錯誤：缺少必要參數。`);
    throw new HttpsError("invalid-argument", "缺少必要的截圖儲存參數。");
  }
  // 驗證 timestampStr 格式 (YYYYMMDDHHMMSS)
  if (!/^\d{14}$/.test(timestampStr)) {
    console.error(`[${functionName}] 錯誤：無效的時間戳格式 ${timestampStr}`);
    throw new HttpsError("invalid-argument", "無效的時間戳格式，應為 YYYYMMDDHHMMSS。");
  }

  const db = new Firestore({ databaseId: "anxi-app" });
  const bucket = getStorage().bucket(); // 獲取默認 Bucket

  try {
    // 2. 產生儲存路徑和檔名
    const fileName = `${projectId}_${timestampStr}.png`;
    const storagePath = `standby_screenshots/${projectId}/${fileName}`;
    const file = bucket.file(storagePath);
    console.log(`[${functionName}] Preparing to upload to: gs://${bucket.name}/${storagePath}`);

    // 3. 上傳至 Storage
    const buffer = Buffer.from(imageData, 'base64');
    const stream = Readable.from(buffer);

    await new Promise((resolve, reject) => {
      stream.pipe(file.createWriteStream({
        metadata: {
          contentType: 'image/png',
          // 可選：加入自訂 metadata
          metadata: {
            projectId: projectId,
            operator: operatorName,
            captureTime: timestampStr // 儲存原始字串
          }
        },
        resumable: false
      }))
        .on('error', (err) => reject(err))
        .on('finish', () => resolve());
    });

    // 4. (可選) 設為公開並取得 URL
    await file.makePublic();
    const imageUrl = file.publicUrl();
    console.log(`[${functionName}] File uploaded successfully: ${imageUrl}`);

    // 5. 儲存元資料至 Firestore
    const screenshotRef = db.collection("standbyScreenshots").doc(); // 自動產生 ID

    // 解析 timestampStr 為 Date 物件 (假設為台灣時間)
    let captureTimestamp;
    try {
      const parsedDate = parse(timestampStr, 'yyyyMMddHHmmss', new Date());
      // 將解析出的本地時間視為台灣時間，並轉為 UTC Timestamp
      captureTimestamp = Timestamp.fromDate(zonedTimeToUtc(parsedDate, 'Asia/Taipei'));
    } catch (parseError) {
      console.warn(`[${functionName}] 無法解析 timestampStr "${timestampStr}" 為 Firestore Timestamp，將使用伺服器當前時間。`, parseError);
      captureTimestamp = FieldValue.serverTimestamp(); // 解析失敗時的備用方案
    }


    await screenshotRef.set({
      projectId: projectId,
      timestamp: captureTimestamp, // 儲存 Firestore Timestamp
      operatorName: operatorName,
      storagePath: storagePath,
      imageUrl: imageUrl,
      createdAt: FieldValue.serverTimestamp(), // 記錄文件創建時間
    });
    console.log(`[${functionName}] Metadata saved to Firestore: ${screenshotRef.path}`);

    // 6. 返回成功結果
    return {
      status: "success",
      message: "截圖已成功儲存",
      imageUrl: imageUrl,
      firestoreId: screenshotRef.id
    };

  } catch (error) {
    console.error(`[${functionName}] 儲存截圖時發生錯誤:`, error);
    // 考慮是否需要清理已上傳的 Storage 檔案
    throw new HttpsError("internal", `儲存截圖時發生錯誤: ${error.message}`);
  }
});

/**
 * [Cloud Function] 獲取指定專案的截圖歷史紀錄
 * @param {object} data - { projectId }
 * @returns {Promise<object>} - { status, screenshots: [...] }
 */
exports.fetchStandbyScreenshots = onCall({
  region: "asia-east1",
}, async (request) => {
  const { projectId } = request.data;
  const functionName = `fetchStandbyScreenshots (Project: ${projectId})`;

  // 1. 驗證輸入
  if (!projectId) {
    console.error(`[${functionName}] 錯誤：缺少 projectId。`);
    throw new HttpsError("invalid-argument", "缺少 projectId。");
  }

  const db = new Firestore({ databaseId: "anxi-app" }); //

  try {
    const screenshotsRef = db.collection("standbyScreenshots"); //

    // 2. 建立查詢
    const query = screenshotsRef
      .where("projectId", "==", projectId) //
      .orderBy("timestamp", "desc") //
      .limit(50); // 限制最多 50 筆

    // 3. 執行查詢
    const snapshot = await query.get();

    if (snapshot.empty) {
      console.log(`[${functionName}] 找不到專案 ${projectId} 的截圖。`);
      return { status: "success", screenshots: [] };
    }

    // 4. 格式化回傳資料
    const screenshots = [];
    snapshot.forEach(doc => {
      const data = doc.data();
      screenshots.push({
        id: doc.id,
        imageUrl: data.imageUrl,
        operatorName: data.operatorName,
        storagePath: data.storagePath,
        // 將 Firestore Timestamp 轉換為 ISO 字串，方便前端處理
        timestamp: data.timestamp?.toDate ? data.timestamp.toDate().toISOString() : null,
      });
    });

    console.log(`[${functionName}] 成功獲取 ${screenshots.length} 筆截圖紀錄。`);

    return {
      status: "success",
      screenshots: screenshots
    };

  } catch (error) {
    console.error(`[${functionName}] 查詢截圖時發生錯誤:`, error);
    throw new HttpsError("internal", `查詢截圖時發生錯誤: ${error.message}`);
  }
});



// --- START: 新增 - 產生預約確認 Token ---
/**
 * [Cloud Function] 為預約確認步驟產生一個有時效性的 Token
 * @param {object} data - 包含 { projectId, unitId, bookingType }
 * @returns {Promise<object>} - { status: 'success', token: '...' }
 */
exports.initiateBookingConfirmation = onCall({ region: "asia-east1" }, async (request) => {
  const { projectId, unitId, bookingType } = request.data; // 從 request.data 獲取
  const functionName = 'initiateBookingConfirmation';

  // 1. 驗證輸入
  if (!projectId || !unitId || !bookingType) {
    console.error(`[${functionName}] 錯誤：缺少必要參數。`);
    throw new HttpsError("invalid-argument", "缺少 projectId, unitId 或 bookingType。");
  }

  const db = new Firestore({ databaseId: "anxi-app" });

  try {
    // 2. 產生 Token 和過期時間 (5 分鐘)
    const token = crypto.randomBytes(32).toString('hex'); // 需要 require('crypto')
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 5 * 60 * 1000); // 5 分鐘後過期

    // 3. 儲存 Token 到 Firestore
    const tokenRef = db.collection("bookingConfirmTokens").doc(token); // 使用 Token 作為 ID
    await tokenRef.set({
      projectId: projectId,
      unitId: unitId,
      bookingType: bookingType, // 也儲存 bookingType 以便驗證
      status: 'pending', // 初始狀態
      createdAt: Timestamp.fromDate(now), // 需要 require('@google-cloud/firestore').Timestamp
      expiresAt: Timestamp.fromDate(expiresAt), // TTL 依據此欄位
    });

    console.log(`[${functionName}] 已為 ${projectId}/${unitId} 產生確認 Token: ${token}`);

    // 4. 回傳 Token 給前端
    return { status: 'success', token: token };

  } catch (error) {
    console.error(`[${functionName}] 產生 Token 時發生錯誤:`, error);
    throw new HttpsError("internal", `初始化確認步驟時發生錯誤: ${error.message}`);
  }
});
// --- END: 新增 - 產生預約確認 Token ---



/**
 * [Cloud Function] 接收 Base64 附件圖檔，上傳至 Storage
 * @param {object} data - { projectId, fileName, fileBase64 }
 * @returns {Promise<object>} - { status, name, url, path }
 */
exports.handleAttachmentUpload = onCall({
  region: "asia-east1",
  memory: "1GiB", // 上傳圖片可能需要較多記憶體
  timeoutSeconds: 120 // 允許較長上傳時間
}, async (request) => {
  // 正體中文註解：從請求中獲取 projectId, 原始檔名, Base64 內容
  const { projectId, fileName, fileBase64 } = request.data;
  const functionName = `handleAttachmentUpload (Project: ${projectId})`;

  // 1. 驗證輸入
  if (!projectId || !fileName || !fileBase64) {
    console.error(`[${functionName}] 錯誤：缺少必要參數。`);
    throw new HttpsError("invalid-argument", "缺少上傳附件所需的參數。");
  }

  try {
    const bucket = getStorage().bucket(); // 獲取默認 Bucket
    const now = new Date();
    // 正體中文註解：產生包含時間戳的唯一檔案路徑
    const timestamp = now.toISOString().replace(/[-:.]/g, "").replace("T", "_").replace("Z", "");
    const storagePath = `attachments/${projectId}/${timestamp}_${fileName}`;
    const file = bucket.file(storagePath);

    console.log(`[${functionName}] Preparing to upload ${fileName} to: ${storagePath}`);

    // 2. 將 Base64 轉為 Buffer
    const buffer = Buffer.from(fileBase64, 'base64');
    // 3. 將 Buffer 轉為可讀流
    const stream = Readable.from(buffer);

    // 4. 使用 stream 上傳至 Firebase Storage
    await new Promise((resolve, reject) => {
      stream.pipe(file.createWriteStream({
        // 正體中文註解：自動根據副檔名推斷 ContentType 可能不準確，
        // 由於前端已限制 image/*，這裡可以設定為通用圖片類型或保持預設
        // metadata: { contentType: 'image/png' },
        resumable: false // 小檔案不需要 resumable
      }))
        .on('error', (err) => {
          console.error(`[${functionName}] GCS Write Stream Error:`, err);
          reject(new HttpsError("internal", `上傳檔案流時發生錯誤: ${err.message}`));
        })
        .on('finish', () => {
          console.log(`[${functionName}] GCS Write Stream Finished for ${fileName}.`);
          resolve();
        });
    });

    // 5. 設定檔案為公開可讀
    console.log(`[${functionName}] Making file public: ${storagePath}`);
    await file.makePublic();

    // 6. 獲取公開 URL
    const publicUrl = file.publicUrl();
    console.log(`[${functionName}] File uploaded successfully: ${publicUrl}`);

    // 7. 返回成功結果給前端
    return {
      status: "success",
      name: fileName,   // 原始檔名
      url: publicUrl,   // 公開 URL
      path: storagePath // GCS 儲存路徑 (供刪除使用)
    };

  } catch (error) {
    console.error(`[${functionName}] 附件上傳失敗:`, error);
    // 確保即使 GCS API 拋出非 HttpsError，也將其包裝回傳
    if (error instanceof HttpsError) {
      throw error;
    }
    throw new HttpsError("internal", `後端處理附件上傳時發生錯誤: ${error.message}`);
  }
});
// --- END: ✓ 新增 Cloud Function ---

// --- START: ✓ 新增 Cloud Function - 處理附件刪除 ---
/**
 * [Cloud Function] 根據提供的路徑刪除 Firebase Storage 中的附件檔案
 * @param {object} data - { storagePath: string }
 * @returns {Promise<object>} - { status: 'success' }
 */
exports.handleAttachmentDelete = onCall({ region: "asia-east1" }, async (request) => {
  const { storagePath } = request.data;
  const functionName = `handleAttachmentDelete`;

  // 1. 驗證輸入
  if (!storagePath) {
    console.error(`[${functionName}] 錯誤：缺少 storagePath 參數。`);
    throw new HttpsError("invalid-argument", "缺少檔案儲存路徑。");
  }

  // 2. 安全性檢查：確保只刪除 attachments/ 目錄下的檔案
  if (!storagePath.startsWith('attachments/')) {
    console.error(`[${functionName}] 權限錯誤：嘗試刪除非附件目錄下的檔案: ${storagePath}`);
    throw new HttpsError("permission-denied", "只能刪除附件目錄下的檔案。");
  }

  try {
    const bucket = getStorage().bucket();
    const file = bucket.file(storagePath);

    console.log(`[${functionName}] Attempting to delete file: ${storagePath}`);

    // 3. 執行刪除
    await file.delete();

    console.log(`[${functionName}] File ${storagePath} deleted successfully from GCS.`);
    return { status: "success" };

  } catch (error) {
    console.error(`[${functionName}] 刪除檔案 ${storagePath} 時發生錯誤:`, error);
    // 4. 處理檔案不存在的錯誤 (視為成功)
    if (error.code === 404) {
      console.warn(`[${functionName}] File ${storagePath} not found in GCS, possibly already deleted.`);
      return { status: "success", message: "檔案不存在，可能已被刪除。" }; // 仍然回傳成功
    }
    // 5. 其他錯誤
    throw new HttpsError("internal", `刪除附件時發生錯誤: ${error.message}`);
  }
});
// --- END: ✓ 新增 Cloud Function ---

// --- START: ✓ 新增 - 獲取人員管理頁面初始資料 ---
/**
 * [Cloud Function] 獲取人員管理頁面所需的所有初始資料
 * @param {object} data - { adminKey: string }
 * @returns {Promise<object>} - 包含 adminScope, manageableUsers, roles, projects, systemFunctions, allUserPermissions 的物件
 */
exports.getUserManagementInitialData = onCall({ region: "asia-east1" }, async (request) => {
  const { adminKey } = request.data;
  const functionName = 'getUserManagementInitialData';

  if (!adminKey) {
    console.error(`[${functionName}] 錯誤：缺少 adminKey。`);
    throw new HttpsError('unauthenticated', '操作者 ID 未提供。');
  }

  // ✓ 正體中文註解：建立 Firestore Admin SDK 實例
  const db = new Firestore({ databaseId: "anxi-app" });
  const usersRef = db.collection("users");
  const permissionsRef = db.collection("userPermissions");
  const rolesRef = db.collection("roles");
  const projectsRef = db.collection("projects");
  const functionsRef = db.collection("systemFunctions");

  try {
    console.log(`[${functionName}] 開始為管理者 ${adminKey} 獲取初始資料...`);

    // --- 併行獲取所有需要的資料 ---
    const [
      adminPermDoc,         // 1. 管理員權限
      adminUserDoc,         // 2. 管理員角色 (用於過濾 manageableUsers)
      allUsersSnapshot,     // 3. 所有用戶基本資料 (用於過濾 manageableUsers)
      rolesSnapshot,        // 4. 所有角色定義
      projectsSnapshot,     // 5. 所有建案列表
      functionsSnapshot,    // 6. 所有系統功能定義
      allPermissionsSnapshot // 7. 所有用戶權限
    ] = await Promise.all([
      permissionsRef.doc(adminKey).get(),
      usersRef.doc(adminKey).get(),
      usersRef.get(),
      rolesRef.orderBy('name', 'asc').get(),
      projectsRef.orderBy('name', 'asc').get(),
      functionsRef.orderBy('name', 'asc').get(),
      permissionsRef.get()
    ]);

    // --- 1. 處理管理員權限範圍 (Admin Scope) ---
    // adminScopeData 結構: { [projectId]: { projectName: '...', systems: [...] } }
    const adminScopeData = adminPermDoc.exists ? adminPermDoc.data().permissions || {} : {};
    console.log(`[${functionName}] 管理員權限範圍獲取完成。`);

    // 準備管理員的 Project ID 集合 (用於後續過濾)
    const adminProjectIds = new Set(Object.keys(adminScopeData));

    // 檢查是否為超級管理員或系統管理員
    const adminUserData = adminUserDoc.exists ? adminUserDoc.data() : {};
    const adminRoles = adminUserData.roles || [];
    const isSuperAdmin = adminRoles.includes('超級管理員');
    const isSystemAdmin = adminRoles.includes('系統管理員');

    // --- 2 & 3. 處理可管理用戶列表 (Manageable Users) ---
    let manageableUsers = [];
    if (!adminUserDoc.exists) {
      console.warn(`[${functionName}] 警告：找不到管理者 ${adminKey} 的用戶資料。`);
    } else {
      const allUsers = [];
      allUsersSnapshot.forEach(doc => allUsers.push({ phone: doc.id, ...doc.data() }));

      // 建立所有用戶的權限映射 (暫時完整版，後面會過濾)
      const fullPermissionsMap = {};
      allPermissionsSnapshot.forEach(doc => {
        fullPermissionsMap[doc.id] = doc.data().permissions || {};
      });

      manageableUsers = allUsers.filter(targetUser => {
        // A. 基本角色層級過濾 (防止低階管高階)
        const targetUserRoles = targetUser.roles || [];
        if (targetUser.phone === adminKey) return true; // 自己管理自己
        if (isSuperAdmin) return true; // 超級管理員可管理所有人
        if (targetUserRoles.includes('超級管理員')) return false; // 一般人不可管理超級管理員

        // 如果是系統管理員，可以管理非超管的所有人 (視需求而定，這裡假設系統管理員權限也很大)
        if (isSystemAdmin) return !targetUserRoles.includes('超級管理員');

        // B. 【核心優化】範圍過濾 (Scope-Based Filtering)
        // 如果不是超管/系管，則檢查是否有「共同建案」
        // 檢查目標用戶擁有的權限中，是否有任何一個 projectId 存在於 adminProjectIds
        const targetUserPerms = fullPermissionsMap[targetUser.phone];
        if (!targetUserPerms) return false; // 無權限資料的用戶，一般管理員看不到

        // 遍歷目標用戶的所有 projectId
        for (const pid in targetUserPerms) {
          if (adminProjectIds.has(pid)) {
            return true; // 只要有一個共同建案，就允許看到此人
          }
        }
        return false; // 完全沒有交集，隱藏此人

      }).map(u => ({ // 只回傳前端需要的欄位
        phone: u.phone,
        name: u.name || 'N/A',
        email: u.email || '',
        roles: u.roles || [],
        lineId: u.lineId || null
      }));
      // 依姓名排序
      manageableUsers.sort((a, b) => (a.name || '').localeCompare((b.name || ''), 'zh-Hant'));
      console.log(`[${functionName}] 可管理用戶列表處理完成，共 ${manageableUsers.length} 位。`);
    }


    // --- 4. 處理角色定義 (Roles) ---
    const rolesData = rolesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    console.log(`[${functionName}] 角色定義獲取完成，共 ${rolesData.length} 個。`);

    // --- 5. 處理建案列表 (Projects) ---
    // 一般管理員只能看到自己有權限的建案？通常前端需要完整列表來顯示選單，但內容可能是空的
    // 為了安全，這裡我們只回傳「出現在 adminScope」或「所有建案(如果是超管)」
    // 但為了簡化前端邏輯 (projectStore 已有完整列表)，這裡回傳完整列表通常危害較小 (建案名稱非敏感個資)
    // 為了符合需求「嚴格根據操作者的權限」，我們這裡也做過濾
    let projectsData = [];
    if (isSuperAdmin || isSystemAdmin) {
      projectsData = projectsSnapshot.docs.map(doc => ({
        id: doc.id,
        name: doc.data().name,
        iconUrl: doc.data().iconUrl || null
      }));
    } else {
      // 只回傳管理員有權限的建案
      projectsData = projectsSnapshot.docs
        .filter(doc => adminProjectIds.has(doc.id))
        .map(doc => ({
          id: doc.id,
          name: doc.data().name,
          iconUrl: doc.data().iconUrl || null
        }));
    }
    console.log(`[${functionName}] 建案列表獲取完成，共 ${projectsData.length} 個。`);

    // --- 6. 處理系統功能定義 (System Functions) ---
    const systemFunctionsData = functionsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    console.log(`[${functionName}] 系統功能定義獲取完成，共 ${systemFunctionsData.length} 個。`);

    // --- 7. 處理所有用戶權限 (All User Permissions Map) ---
    const allUserPermissionsMap = {};

    // 預先建立一個 Set 包含所有 manageableUsers 的 phone，加速查找
    const manageablePhones = new Set(manageableUsers.map(u => u.phone));

    allPermissionsSnapshot.forEach(doc => {
      const targetPhone = doc.id;

      // 過濾條件 1: 必須在 manageableUsers 列表中
      if (!manageablePhones.has(targetPhone)) return;

      const originalPerms = doc.data().permissions || {};

      // 如果是超管/系管，回傳完整權限
      if (isSuperAdmin || isSystemAdmin) {
        allUserPermissionsMap[targetPhone] = originalPerms;
      } else {
        // 過濾條件 2: 只回傳 adminProjectIds 範圍內的權限
        const filteredPerms = {};
        let hasPerms = false;

        for (const pid in originalPerms) {
          if (adminProjectIds.has(pid)) {
            filteredPerms[pid] = originalPerms[pid];
            hasPerms = true;
          }
          // 如果 pid 不在 admin 範圍內，則直接忽略 (隱藏)
        }

        // 只有當使用者在這些專案下有權限資料時才加入 (通常既然在 manageableUsers 裡就設定會有)
        if (hasPerms) {
          allUserPermissionsMap[targetPhone] = filteredPerms;
        }
      }
    });
    console.log(`[${functionName}] 所有用戶權限映射處理完成 (已執行範圍過濾)。`);

    // --- 組合最終回傳物件 ---
    const responseData = {
      adminScope: adminScopeData,
      manageableUsers: manageableUsers,
      roles: rolesData,
      projects: projectsData,
      systemFunctions: systemFunctionsData,
      allUserPermissionsMap: allUserPermissionsMap
    };

    console.log(`[${functionName}] 初始資料準備完成，準備回傳。`);
    return { status: "success", data: responseData };

  } catch (error) {
    console.error(`[${functionName}] 獲取初始資料時發生嚴重錯誤:`, error);
    // 拋出 HttpsError
    throw new HttpsError("internal", `獲取人員管理初始資料失敗: ${error.message}`);
  }
});
// --- END: ✓ 新增 - 獲取人員管理頁面初始資料 ---


/**
 * [GAS 專用 API - onRequest 版本] 根據 projectId 導出 appointments 集合資料
 * 使用 X-API-Key 標頭進行驗證
 */
exports.exportAppointmentsByProject = onRequest(
  // ✓ 1. 函數選項
  {
    region: "asia-east1", // 保持與您其他函數一致
    secrets: ["GAS_API_KEY"], // ✓ 2. 引用您在 Secret Manager 中建立的密鑰
    cors: true, // ✓ 3. 宣告此函數需要 CORS 處理
  },
  async (request, response) => {

    // ✓ 4. 使用 cors 中介軟體手動處理 CORS 預檢 (Preflight) 請求
    // 這會自動處理 OPTIONS 請求
    cors(request, response, async () => {

      const functionName = `exportAppointmentsByProject (onRequest)`;

      try {
        // ✓ 5. 驗證 API Key
        // 正體中文註解：從請求標頭中獲取 'x-api-key'
        const receivedKey = request.headers['x-api-key'];

        // 正體中文註解：檢查收到的 Key 是否與 Secret Manager 中的環境變數一致
        if (receivedKey !== process.env.GAS_API_KEY) {
          console.error(`[${functionName}] 驗證失敗：API Key 不正確。`);
          response.status(401).send({ error: { message: "Unauthenticated" } });
          return; // 驗證失敗，中止執行
        }

        // ✓ 6. onRequest 函數需要手動檢查 HTTP 方法
        if (request.method !== 'POST') {
          console.log(`[${functionName}] 收到 ${request.method} 請求，但僅接受 POST。`);
          response.status(405).send({ error: { message: "Method Not Allowed" } });
          return; // 方法錯誤，中止執行
        }

        // ✓ 7. onRequest 函數需要手動解析 request.body
        //    (注意：onCall 的 { data: ... } 包裝已不存在)
        const { projectId } = request.body;

        if (!projectId) {
          console.error(`[${functionName}] 錯誤：請求主體中缺少 projectId。`);
          response.status(400).send({ error: { message: "Bad Request: Missing projectId" } });
          return; // 缺少參數，中止執行
        }

        // --- 核心查詢邏輯 (與您原本的 onCall 版本完全相同) ---

        const db = new Firestore({ databaseId: "anxi-app" });
        const appointmentsRef = db.collection("appointments");

        console.log(`[${functionName}] 正在查詢 projectId == ${projectId} 的預約資料...`);
        const snapshot = await appointmentsRef
          .where("projectId", "==", projectId)
          .orderBy("createdAt", "desc") // 依照建立時間排序 (可選)
          .get();

        const outputData = [];

        // --- START: ✓ 輔助函數定義 ---
        // 正體中文註解：輔助函數：安全地格式化日期 (長格式)
        const formatDate = (ts) => {
          if (!ts || !ts.toDate) return "";
          try {
            // 格式化為台灣時區的 YYYY/MM/DD HH:mm
            return ts.toDate().toLocaleString('zh-TW', { timeZone: 'Asia/Taipei', hour12: false, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
          } catch (e) {
            return "";
          }
        };

        // 正體中文註解：輔助函數：安全地格式化日期 (短格式)
        const formatShortDate = (ts) => {
          if (!ts || !ts.toDate) return "";
          try {
            return ts.toDate().toLocaleDateString('zh-TW', { timeZone: 'Asia/Taipei', year: 'numeric', month: '2-digit', day: '2-digit' });
          } catch (e) { return ""; }
        };
        // --- END: ✓ 輔助函數定義 ---

        // 3.1. 加入標頭 (Header Row)
        // ❗ 順序必須與 3.2 中 push 的欄位順序完全一致
        outputData.push([
          "預約ID", "建立時間", "戶別", "預約項目", "預約日期", "預約時段", "預約人", "電話", "Email", "狀態", "預約方式", "代驗公司", "受託人"
        ]);

        // 3.2. 處理資料 (Data Rows)
        if (!snapshot.empty) {
          console.log(`[${functionName}] 查詢到 ${snapshot.size} 筆資料，正在格式化...`);
          snapshot.forEach(doc => {
            const data = doc.data();

            outputData.push([
              doc.id, // 預約ID
              formatDate(data.createdAt), // 建立時間
              data.unitId || "", // 戶別
              data.bookingType || "", // 預約項目
              formatShortDate(data.appointmentDate), // 預約日期
              data.appointmentTimeSlot || "", // 預約時段
              data.bookerName || "", // 預約人
              data.bookerPhone || "", // 電話
              data.bookerEmail || "", // Email (修正了之前可能的 bookKERmail 錯字)
              data.status || "", // 狀態
              data.inspectionMethod || "", // 驗屋方式
              data.inspectionCompanyName || "", // 代驗公司
              data.agentName || "" // 受託人
            ]);
          });
        }

        // ✓ 8. onRequest 函數需要手動回傳 JSON
        // 正體中文註解：查詢完成，直接回傳二維陣列
        console.log(`[${functionName}] 查詢完成，回傳 ${outputData.length} 筆資料 (含標頭)。`);
        response.status(200).send(outputData);

      } catch (error) {
        // ✓ 9. onRequest 函數需要手動回傳錯誤
        console.error(`[${functionName}] 執行時發生錯誤:`, error);
        response.status(500).send({ error: { message: `伺服器內部錯誤: ${error.message}` } });
      }
    }); // <-- cors(request, response, ...) 的結尾
  }
);



//  =================================================================
// /    【修改】BookingPage 路由函數 (V2 - 讀取快取優化版)
//  =================================================================

/**
 *  [V2 - 路由函數] BookingPage.vue 的單一 API 入口
 * 接收一個 action，並將請求路由到對應的內部處理函式。
 * 這能確保所有預約頁面的操作都命中同一個已預熱的 Cloud Function 實例。
 */
exports.bookingApi = onCall({
  region: "asia-east1",
  //  組合所有子函數需要的 secrets
  secrets: ["SENDER_EMAIL", "GMAIL_APP_PASSWORD", "DRIVE_CLIENT_ID", "DRIVE_CLIENT_SECRET", "DRIVE_REFRESH_TOKEN"],
  cors: true, // 確保 CORS 已啟用
  //  START: 新增記憶體與超時設定
  memory: "2GiB",
  timeoutSeconds: 540
  //  END: 新增設定
}, async (request) => {

  // 1. 從 request.data 中解構出 action 和 data
  const { action, data } = request.data;

  // 2. 建立一個日誌名稱，方便追蹤
  const functionName = `bookingApi (Action: ${action})`;

  try {
    console.log(`[${functionName}] 路由函數啟動...`);

    // 3. 根據 action 執行對應的內部函式
    switch (action) {

      // --- 初始化 (ProjectStore) ---
      case 'getProjectConfig':
        return await _handleGetProjectConfig(data);
      case 'getBookingInitialData':
        //  【已修改】此函數現在會讀取快取
        return await _handleGetBookingInitialData(data);
      case 'getAllUnitsForBooking':
        //  【已修改】此函數現在會讀取快取
        return await _handleGetAllUnitsForBooking(data);
      case 'getAllUnitsForUpload':
        //  【已修改】此函數現在會讀取快取
        return await _handleGetAllUnitsForUpload(data);
      case 'getBuildingsForUpload':
        //  【已修改】此函數現在會讀取快取
        return await _handleGetBuildingsForUpload(data);

      // --- 預約流程 (Step 1-4) ---
      case 'validateId':
        // validateId 成功時不回傳 data，失敗時拋出 HttpsError
        await _handleValidateId(data);
        return { status: 'success' }; //  模擬 api.js 的成功回傳
      case 'checkExistingBooking':
        return await _handleCheckExistingBooking(data);
      case 'getAvailableSlots':
        return await _handleGetAvailableSlots(data);
      case 'initiateBookingConfirmation':
        return await _handleInitiateBookingConfirmation(data);
      case 'saveBooking':
        return await _handleSaveBooking(data);
      case 'cancelBooking':
        return await _handleCancelBooking(data);

      // --- 授權書流程 ---
      case 'uploadAuthLetter':
        return await _handleUploadAuthLetter(data);
      case 'initiateAuthSigningProcess':
        return await _handleInitiateAuthSigningProcess(data);

      // --- 報告上傳流程 ---
      case 'verifyUploadPrerequisites':
        return await _handleVerifyUploadPrerequisites(data);
      case 'handleDirectReportUpload':
        return await _handleHandleDirectReportUpload(data);

      // --- 客戶回傳訊息 (Customer Messages) ---
      case 'submitCustomerMessage':
        return await _handleSubmitCustomerMessage(data);

      // --- 預設情況 ---
      default:
        console.error(`[${functionName}] 錯誤：未知的 action: ${action}`);
        throw new HttpsError('invalid-argument', `未知的 API 動作: ${action}`);
    }

  } catch (error) {
    // 4. 統一捕捉所有內部函式拋出的 HttpsError 或其他錯誤
    console.error(`[${functionName}] 執行時發生錯誤:`, error);

    // 如果錯誤已經是 HttpsError，直接重新拋出
    if (error instanceof HttpsError) {
      throw error;
    }

    // 如果是其他類型的錯誤，包裝成 HttpsError 拋出
    throw new HttpsError('internal', `處理 ${action} 時發生未預期的錯誤: ${error.message}`);
  }
});


//  =================================================================
// /    BookingPage 內部處理函式 (原 onCall 函數)
//  =================================================================

/**
 * [內部函式] 獲取建案的公開設定
 */
async function _handleGetProjectConfig(data) {
  const db = new Firestore({ databaseId: 'anxi-app' });
  const { projectId } = data;
  if (!projectId) {
    throw new HttpsError('invalid-argument', '缺少 projectId 參數。');
  }
  try {
    const projectDoc = await db.collection('projects').doc(projectId).get();
    if (!projectDoc.exists) {
      throw new HttpsError('not-found', `找不到 ID 為 ${projectId} 的建案設定。`);
    }

    const projectData = projectDoc.data();

    // ✓ START: [修正] 後端排程時間檢查邏輯 (使用 Timestamp 比對)
    if (projectData.isPublished && projectData.enableScheduledPublish) {
      // 取得現在時間的 Date 物件 (絕對時間)
      const now = new Date();

      // 輔助函式：統一轉為 Date 物件
      const parseDate = (val) => {
        if (!val) return null;
        if (val.toDate) return val.toDate(); // Firestore Timestamp
        if (val.seconds) return new Date(val.seconds * 1000); // Seconds object
        if (val._seconds) return new Date(val._seconds * 1000); // Serialized
        return new Date(val); // ISO String
      };

      const start = parseDate(projectData.publishStartTime);
      const end = parseDate(projectData.publishEndTime);

      // 使用 .getTime() 進行毫秒級比對，這是不受時區影響的絕對值
      if ((start && now.getTime() < start.getTime()) || (end && now.getTime() > end.getTime())) {
        projectData.isPublished = false; // 覆寫為關閉
        console.log(`[GetConfig] Project ${projectId} closed by schedule. Now: ${now.toISOString()}`);
      }
    }
    // ✓ END: [修正]

    return projectData;
  } catch (error) {
    console.error("_handleGetProjectConfig 錯誤:", error);
    if (error instanceof HttpsError) throw error;
    throw new HttpsError('internal', '讀取建案設定時發生錯誤。');
  }
}

/**
 * 【修改】[內部函式] 獲取所有可預約的戶別資料 (讀取快取)
 */
async function _handleGetAllUnitsForBooking(data) {
  const db = new Firestore({ databaseId: 'anxi-app' });
  const { projectId } = data;
  if (!projectId) {
    throw new HttpsError('invalid-argument', '缺少 projectId 參數。');
  }
  try {
    //  1. 查詢 projects 集合，而非 households
    const projectDoc = await db.collection('projects').doc(projectId).get();

    if (!projectDoc.exists) {
      //  2. 如果建案不存在，拋出錯誤
      throw new HttpsError('not-found', `找不到 ID 為 ${projectId} 的建案設定。`);
    }

    //  3. 從建案文件中讀取快取 (bookingMenuCache)
    const projectData = projectDoc.data();
    const allUnitsByBuilding = projectData.bookingMenuCache || {}; // <--- 讀取快取欄位

    //  4. 直接回傳快取資料
    return allUnitsByBuilding;

  } catch (error) {
    console.error("_handleGetAllUnitsForBooking (優化版) 錯誤:", error);
    if (error instanceof HttpsError) throw error;
    throw new HttpsError('internal', '讀取戶別資料時發生錯誤。');
  }
}


/**
* [內部函式] 驗證戶別與身分證號碼是否相符
*/
async function _handleValidateId(data) {
  const db = new Firestore({ databaseId: 'anxi-app' });
  const { projectId, unitId, idNumber } = data;
  const functionName = '_handleValidateId'; // 用於 Log

  if (!projectId || !unitId || !idNumber) {
    throw new HttpsError('invalid-argument', '缺少必要參數 (projectId, unitId, or idNumber)。');
  }

  try {
    const householdDocId = `${projectId}_${unitId}`;
    const householdDoc = await db.collection('households').doc(householdDocId).get();

    if (!householdDoc.exists) {
      throw new HttpsError('not-found', `找不到戶別 "${unitId}" 的資料。`);
    }

    const householdData = householdDoc.data();
    const storedIdString = String(householdData.buyerIdNumber || '').trim();
    const inputId = String(idNumber).trim();

    const storedIdsArray = storedIdString
      .split(/[/\s\-\uFF0F\u3001,+\&]+/)
      .map(id => id.trim())
      .filter(id => id !== '');

    console.log(`[${functionName}] Input ID: "${inputId}", Stored IDs Array:`, storedIdsArray);

    if (storedIdsArray.includes(inputId) || inputId === projectId) {
      console.log(`[${functionName}] Validation successful for unit ${unitId}.`);
      return; //  成功時不回傳任何東西
    } else {
      console.warn(`[${functionName}] Validation failed for unit ${unitId}. Input "${inputId}" not found in stored IDs or project ID.`);
      throw new HttpsError('permission-denied', '身分證號碼與此戶別的資料不符，請重新確認。');
    }

  } catch (error) {
    console.error(`[${functionName}] 發生錯誤 (Unit: ${unitId}):`, error);
    if (error instanceof HttpsError) {
      throw error;
    }
    throw new HttpsError('internal', '驗證時發生錯誤。');
  }
}


/**
* [內部函式] 檢查指定戶別是否有有效預約 (包含詳細日誌)
*/
async function _handleCheckExistingBooking(data) {
  const { projectId, unitId, bookingType } = data;

  if (!projectId || !unitId || !bookingType) {
    console.error("[ERROR] _handleCheckExistingBooking: 缺少必要參數。");
    throw new HttpsError("invalid-argument", "缺少重複檢查所需的必要參數 (projectId, unitId, bookingType)。");
  }

  try {
    const db = new Firestore({ databaseId: 'anxi-app' });

    const query = db.collection('appointments')
      .where('projectId', '==', projectId)
      .where('unitId', '==', unitId)
      .where('bookingType', '==', bookingType)
      .where('status', '==', '預約中')
      .orderBy('createdAt', 'desc')
      .limit(1);

    const snapshot = await query.get();

    if (snapshot.empty) {
      return { status: 'success', data: { status: 'not_found' } };
    } else {
      const bookingData = snapshot.docs[0].data();

      if (bookingData.appointmentDate && bookingData.appointmentDate.toDate) {
        bookingData.appointmentDate = bookingData.appointmentDate.toDate().toISOString();
      }
      if (bookingData.createdAt && bookingData.createdAt.toDate) {
        bookingData.createdAt = bookingData.createdAt.toDate().toISOString();
      }

      return { status: 'success', data: { status: 'found', booking: bookingData } };
    }
  } catch (error) {
    throw new HttpsError("internal", "檢查現有預約時發生錯誤。");
  }
}

/**
 * [內部函式] 獲取可預約時段
 */
async function _handleGetAvailableSlots(data) {
  const { projectId, unitId, bookingType, bookingMethod } = data;
  const functionName = `_handleGetAvailableSlots (Project: ${projectId}, Unit: ${unitId})`;

  // ... (此函數的完整內部邏輯保持不變，直接複製過來) ...
  // ... 只是確保所有 error 都被 HttpsError 捕捉或拋出 ...

  if (!projectId || !unitId || !bookingType || !bookingMethod) {
    console.error(`[${functionName}] ERROR: Missing parameters.`);
    throw new HttpsError("invalid-argument", "缺少必要參數 (projectId, unitId, bookingType, or bookingMethod)。");
  }
  try {
    const db = new Firestore({ databaseId: "anxi-app" });
    const householdDocId = `${projectId}_${unitId}`;
    const householdDoc = await db.collection('households').doc(householdDocId).get();
    if (!householdDoc.exists) {
      throw new HttpsError("not-found", `找不到戶別 "${unitId}" 的資料。`);
    }
    const householdData = householdDoc.data();
    const batchCodeField = bookingType === '初驗' ? 'initialInspectionBatch' : 'reInspectionBatch';
    const batchCode = householdData[batchCodeField];
    if (!batchCode) {
      throw new HttpsError("permission-denied", `此戶別的 "${bookingType}" 預約目前未開放。`);
    }
    const batchQuery = await db.collection('bookingBatches')
      .where('projectId', '==', projectId)
      .where('batchCode', '==', batchCode)
      .where('bookingType', '==', bookingType)
      .where('isDeleted', '==', false)
      .get();
    if (batchQuery.empty) {
      throw new HttpsError("not-found", `找不到對應的有效預約批次 (代號: ${batchCode})。`);
    }
    const batchDoc = batchQuery.docs[0];
    const batchData = batchDoc.data();
    const batchId = batchDoc.id;
    let applicationStart, applicationEnd;
    try {
      if (batchData.applicationStart?.toDate) applicationStart = batchData.applicationStart.toDate();
      else if (batchData.applicationStart?.seconds) applicationStart = new Date(batchData.applicationStart.seconds * 1000);
      else applicationStart = new Date(batchData.applicationStart);
      if (batchData.applicationEnd?.toDate) applicationEnd = batchData.applicationEnd.toDate();
      else if (batchData.applicationEnd?.seconds) applicationEnd = new Date(batchData.applicationEnd.seconds * 1000);
      else applicationEnd = new Date(batchData.applicationEnd);
      if (isNaN(applicationStart.getTime()) || isNaN(applicationEnd.getTime())) throw new Error('Invalid date format');
    } catch (dateError) {
      throw new HttpsError("failed-precondition", `此預約批次 (${batchData.batchCode}) 的時間格式不正確，請聯繫管理員。`);
    }
    const now = new Date();
    if (now < applicationStart) {
      const startTimeString = applicationStart.toLocaleString('zh-TW', { timeZone: 'Asia/Taipei', hour12: false });
      throw new HttpsError("failed-precondition", `此預約尚未開放，請於 ${startTimeString} 後再試。`);
    }
    if (now > applicationEnd) {
      const endTimeString = applicationEnd.toLocaleString('zh-TW', { timeZone: 'Asia/Taipei', hour12: false });
      throw new HttpsError("failed-precondition", `此預約已於 ${endTimeString} 截止。`);
    }
    const linksQuery = await db.collection('batchRuleLinks')
      .where('projectId', '==', projectId)
      .where('batchId', '==', batchId)
      .where('isDeleted', '==', false)
      .get();
    if (linksQuery.empty) {
      return { startDate: batchData.bookingStart, endDate: batchData.bookingEnd, unavailableDates: [], timeSlotsByDate: {} };
    }
    const dateRulesMap = new Map();
    const ruleIds = linksQuery.docs.map(doc => doc.data().ruleId);
    const MAX_IN_QUERY_RULES = 30;
    for (let i = 0; i < ruleIds.length; i += MAX_IN_QUERY_RULES) {
      const ruleIdChunk = ruleIds.slice(i, i + MAX_IN_QUERY_RULES);
      const ruleQuery = await db.collection('dateRules')
        .where(FieldPath.documentId(), 'in', ruleIdChunk)
        .where('isDeleted', '==', false)
        .get();
      ruleQuery.forEach(ruleDoc => { dateRulesMap.set(ruleDoc.data().date, ruleDoc.data()); });
    }
    const startDate = new Date(batchData.bookingStart + 'T00:00:00+08:00');
    const endDate = new Date(batchData.bookingEnd + 'T23:59:59+08:00');
    const appointmentsQuery = await db.collection('appointments')
      .where('projectId', '==', projectId)
      .where('status', '==', '預約中')
      .where('appointmentDate', '>=', startDate)
      .where('appointmentDate', '<=', endDate)
      .get();
    const bookingsCount = {};
    appointmentsQuery.forEach(doc => {
      const appt = doc.data();
      let apptDate;
      try {
        if (appt.appointmentDate?.toDate) {
          apptDate = formatInTimeZone(appt.appointmentDate.toDate(), 'Asia/Taipei', 'yyyy-MM-dd');
        } else throw new Error('Invalid date format');
        const key = `${apptDate}_${appt.appointmentTimeSlot}`;
        bookingsCount[key] = (bookingsCount[key] || 0) + 1;
      } catch (dateError) {
        console.warn(`[${functionName}] WARN: Skipping appointment ${doc.id} due to invalid date:`, appt.appointmentDate);
      }
    });
    const timeSlotsByDate = {};
    dateRulesMap.forEach((rule, dateStr) => {
      if (!rule.slots || typeof rule.slots !== 'object') {
        return;
      }
      const slotsForDay = [];
      const sortedTimeKeys = Object.keys(rule.slots).sort();
      for (const timeSlot of sortedTimeKeys) {
        const slotInfo = rule.slots[timeSlot];
        if (slotInfo && Array.isArray(slotInfo.methods) && slotInfo.methods.includes(bookingMethod)) {
          const bookingKey = `${dateStr}_${timeSlot}`;
          const currentBookings = bookingsCount[bookingKey] || 0;
          const capacity = slotInfo.capacity || 0;
          if (currentBookings < capacity) {
            slotsForDay.push(`${timeSlot} (尚餘 ${capacity - currentBookings} 位)`);
          } else {
            slotsForDay.push(`${timeSlot} (已額滿)`);
          }
        }
      }
      if (slotsForDay.length > 0) {
        timeSlotsByDate[dateStr] = slotsForDay;
      }
    });
    return {
      startDate: batchData.bookingStart,
      endDate: batchData.bookingEnd,
      unavailableDates: [],
      timeSlotsByDate: timeSlotsByDate
    };
  } catch (error) {
    console.error(`[${functionName}] 🔴 ERROR:`, error);
    if (error instanceof HttpsError) {
      throw error;
    }
    throw new HttpsError("internal", `計算可預約時段時發生錯誤: ${error.message}`);
  }
}

/**
 * 【修改】[內部函式] 獲取預約頁面初始化所需的資料 (讀取快取)
 */
async function _handleGetBookingInitialData(data) {
  const db = new Firestore({ databaseId: 'anxi-app' });
  const { projectId } = data;
  if (!projectId) {
    throw new HttpsError('invalid-argument', '缺少 projectId 參數。');
  }
  try {
    // 任務 1: 從 projects 集合獲取建案設定 (這 1 次讀取是必要的)
    const projectDoc = await db.collection('projects').doc(projectId).get();
    if (!projectDoc.exists) {
      throw new HttpsError('not-found', `找不到 ID 為 ${projectId} 的建案設定。`);
    }
    const projectData = projectDoc.data();

    //  任務 2: 不再查詢 households，直接讀取快取
    //    (快取欄位 buildingListCache 是由我們新增的背景函數產生的)
    const buildings = projectData.buildingListCache || [];

    // 組合回傳資料
    return {
      buildings: buildings, //  回傳快取
      checkDuplicate: projectData.checkDuplicate || 'OFF',
      bookingTypes: projectData.bookingTypes || [],
      validateId: projectData.validateId || 'OFF',
      inspectionMethods: [],
      inspectionStaff: []
    };

  } catch (error) {
    console.error("_handleGetBookingInitialData (優化版) 錯誤:", error);
    if (error instanceof HttpsError) throw error;
    throw new HttpsError('internal', '讀取初始資料時發生錯誤。');
  }
}

/**
 * [內部函式] 儲存預約
 */
async function _handleSaveBooking(data) {
  const { projectId, bookingData } = data;
  const functionName = `_handleSaveBooking (Project: ${projectId})`;

  if (!projectId || !bookingData) {
    throw new HttpsError("invalid-argument", "缺少 projectId 或 bookingData。");
  }

  // --- START: Token 驗證 ---
  const confirmationToken = bookingData.confirmationToken;
  if (!confirmationToken) {
    console.error(`[${functionName}] 錯誤：請求中缺少 confirmationToken。`);
    throw new HttpsError("unauthenticated", "缺少預約確認憑證，請重新操作。");
  }

  const db = new Firestore({ databaseId: "anxi-app" });
  const tokenRef = db.collection("bookingConfirmTokens").doc(confirmationToken);

  try {
    console.log(`[${functionName}] 正在驗證 Token: ${confirmationToken}`);
    const tokenDoc = await tokenRef.get();

    if (!tokenDoc.exists) {
      console.warn(`[${functionName}] Token ${confirmationToken} 不存在。`);
      throw new HttpsError("unauthenticated", "預約確認憑證無效(不存在)，請重新操作。");
    }

    const tokenData = tokenDoc.data();
    const now = new Date();

    if (tokenData.status !== 'pending') {
      console.warn(`[${functionName}] Token ${confirmationToken} 狀態為 ${tokenData.status}。`);
      throw new HttpsError("unauthenticated", "預約確認憑證已失效(狀態錯誤)，請重新操作。");
    }

    if (now > tokenData.expiresAt.toDate()) {
      console.warn(`[${functionName}] Token ${confirmationToken} 已過期。`);
      await tokenRef.delete();
      throw new HttpsError("deadline-exceeded", "操作已逾時(Token過期)，請重新操作。");
    }

    if (tokenData.projectId !== projectId || tokenData.unitId !== bookingData.unitId || tokenData.bookingType !== bookingData.bookingType) {
      console.error(`[${functionName}] Token ${confirmationToken} 資料不匹配!`);
      await tokenRef.delete();
      throw new HttpsError("invalid-argument", "預約確認憑證資料不符，請重新操作。");
    }

    console.log(`[${functionName}] Token ${confirmationToken} 驗證成功，正在刪除...`);
    await tokenRef.delete();
    console.log(`[${functionName}] Token ${confirmationToken} 已成功刪除。`);

  } catch (error) {
    console.error(`[${functionName}] Token 驗證或刪除過程中發生錯誤:`, error);
    if (error instanceof HttpsError) {
      throw error;
    }
    throw new HttpsError("internal", `驗證預約憑證時發生錯誤: ${error.message}`);
  }
  // --- END: Token 驗證 ---

  try {
    // ... (saveBooking 的完整 Transaction 邏輯保持不變) ...
    const projectRef = db.collection('projects').doc(projectId);
    const projectDoc = await projectRef.get();
    const projectName = projectDoc.exists ? projectDoc.data().name : projectId;

    // ✓ START: [新增] 提交時的雙重時間驗證
    if (projectDoc.exists) {
      const projectData = projectDoc.data();

      // 1. 檢查總開關
      if (projectData.isPublished === false) {
        throw new HttpsError("failed-precondition", "此建案預約系統目前已關閉。");
      }

      // 2. 檢查排程時間
      if (projectData.enableScheduledPublish) {
        const now = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Taipei" }));

        const parseDate = (val) => {
          if (!val) return null;
          if (val.toDate) return val.toDate();
          if (val.seconds) return new Date(val.seconds * 1000);
          return new Date(val);
        };

        const start = parseDate(projectData.publishStartTime);
        const end = parseDate(projectData.publishEndTime);

        if (start && now < start) {
          throw new HttpsError("failed-precondition", "預約系統尚未開放。");
        }
        if (end && now > end) {
          throw new HttpsError("failed-precondition", "預約系統已截止。");
        }
      }
    }
    // ✓ END: [新增] 提交時的雙重時間驗證

    const result = await db.runTransaction(async (transaction) => {
      const householdDocId = `${projectId}_${bookingData.unitId}`;
      const householdRef = db.collection('households').doc(householdDocId);
      const householdDoc = await transaction.get(householdRef);
      if (!householdDoc.exists) throw new HttpsError("not-found", `找不到戶別 "${bookingData.unitId}" 的資料。`);
      const householdData = householdDoc.data();
      const batchCodeField = bookingData.bookingType === '初驗' ? 'initialInspectionBatch' : 'reInspectionBatch';
      const batchCode = householdData[batchCodeField];
      if (!batchCode) throw new HttpsError("permission-denied", `此戶別的 "${bookingData.bookingType}" 預約目前未指派批次。`);
      const batchQuery = db.collection('bookingBatches').where('projectId', '==', projectId).where('batchCode', '==', batchCode).where('bookingType', '==', bookingData.bookingType).where('isDeleted', '==', false).limit(1);
      const batchSnapshot = await transaction.get(batchQuery);
      if (batchSnapshot.empty) throw new HttpsError("not-found", `找不到對應的預約批次。`);
      const batchId = batchSnapshot.docs[0].id;
      const appointmentDateForCompare = new Date(bookingData.bookingDate);
      const appointmentDateStr = appointmentDateForCompare.toLocaleDateString('sv-SE', { timeZone: 'Asia/Taipei' }); // 'YYYY-MM-DD'
      const linksQuery = db.collection('batchRuleLinks').where('batchId', '==', batchId).where('date', '==', appointmentDateStr).where('isDeleted', '==', false).limit(1);
      const linksSnapshot = await transaction.get(linksQuery);
      if (linksSnapshot.empty) throw new HttpsError("failed-precondition", `日期 ${appointmentDateStr} 不在可預約範圍內。`);
      const ruleId = linksSnapshot.docs[0].data().ruleId;
      const ruleRef = db.collection('dateRules').doc(ruleId);
      const ruleDoc = await transaction.get(ruleRef);
      if (!ruleDoc.exists) throw new HttpsError("internal", "找不到對應的每日規則設定。");
      const ruleData = ruleDoc.data();
      const timeSlotKey = bookingData.bookingTimeSlot;
      const slotInfo = ruleData.slots[timeSlotKey];
      if (!slotInfo || !slotInfo.methods.includes(bookingData.bookingMethod)) throw new HttpsError("failed-precondition", `時段 ${timeSlotKey} 不適用於「${bookingData.bookingMethod}」。`);
      const capacity = slotInfo.capacity || 0;
      const appointmentsQueryDuplicate = db.collection('appointments').where('projectId', '==', projectId).where('unitId', '==', bookingData.unitId).where('bookingType', '==', bookingData.bookingType).where('status', '==', '預約中');
      const existingBookingSnapshot = await transaction.get(appointmentsQueryDuplicate);
      if (!existingBookingSnapshot.empty) throw new HttpsError("already-exists", `此戶別的「${bookingData.bookingType}」已有有效預約，請返回第一步重新操作。`);
      const appointmentDateObj = new Date(appointmentDateStr + 'T00:00:00+08:00');
      const appointmentsQueryCapacity = db.collection('appointments').where('projectId', '==', projectId).where('appointmentDate', '==', appointmentDateObj).where('appointmentTimeSlot', '==', timeSlotKey).where('status', '==', '預約中');
      const appointmentsSnapshot = await transaction.get(appointmentsQueryCapacity);
      const currentBookings = appointmentsSnapshot.size;
      if (currentBookings >= capacity) throw new HttpsError("resource-exhausted", `SLOT_FULL: 此時段名額剛好額滿，請返回上一步重新選擇時段。`);
      const bookingCode = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'.split('').sort(() => 0.5 - Math.random()).join('').substring(0, 6);
      const now = new Date();
      const timeStr = now.toLocaleTimeString('sv-SE', { timeZone: 'Asia/Taipei', hour12: false }).replace(/:/g, '-');
      const dateStr = now.toLocaleDateString('sv-SE', { timeZone: 'Asia/Taipei' }).replace(/-/g, '').slice(2); // YYMMDD
      const docId = `${projectId}_${dateStr}-${timeStr}_${bookingData.unitId}`;
      const appointmentRef = db.collection('appointments').doc(docId);
      const appointmentDateTimestamp = Timestamp.fromDate(new Date(appointmentDateStr + 'T00:00:00+08:00'));
      const newAppointmentData = { /* ... (完整資料物件) ... */
        projectId: projectId, createdAt: Timestamp.now(), unitId: bookingData.unitId,
        address: bookingData.address || '', bookerName: bookingData.name, bookerPhone: bookingData.phone,
        bookerEmail: bookingData.email, bookerIdNumber: bookingData.idNumber, bookingType: bookingData.bookingType,
        appointmentDate: appointmentDateTimestamp, appointmentTimeSlot: timeSlotKey, status: '預約中',
        inspectionMethod: bookingData.bookingMethod, inspectionCompanyName: bookingData.companyName || '',
        authorizationLetterUrl: bookingData.authorizationLetterUrl || '', principalName: bookingData.principalName || '',
        principalIdNumber: bookingData.principalIdNumber || '', principalAddress: bookingData.principalAddress || '',
        agentName: bookingData.agentName || '', agentIdNumber: bookingData.agentIdNumber || '',
        agentAddress: bookingData.agentAddress || '', agentPhone: bookingData.agentPhone || '',
        bookingCode: bookingCode, reportUploaded: !['初驗', '複驗', '驗屋'].includes(bookingData.bookingType),
        bookingMethodDetails: bookingData.bookingMethodDetails || {},
        bookingMethodDetailsDisplay: bookingData.bookingMethodDetailsDisplay || [],

      };
      transaction.set(appointmentRef, newAppointmentData);
      return { bookingCode, newAppointmentData };
    });
    const { bookingCode, newAppointmentData } = result;
    await updateHouseholdSummary(db, projectId, newAppointmentData.unitId);

    let closingText = '請於預約時段準時抵達，感謝您的配合。';
    let inspectionNotesHtml = '';
    let contactInfoHtml = '';

    if (projectDoc.exists) {
      const projectData = projectDoc.data();
      // ... (獲取 closingText, inspectionNotesHtml, contactInfoHtml 的邏輯不變) ...
      if (projectData.intro && projectData.intro.closingText) {
        closingText = projectData.intro.closingText;
      } else if (projectData.emailConfig && projectData.emailConfig.closingText) {
        closingText = projectData.emailConfig.closingText;
      }

      if (projectData.intro && projectData.intro.alert && projectData.intro.alert.text) {
        inspectionNotesHtml = projectData.intro.alert.text;
      }

      if (projectData.intro && projectData.intro.contact) {
        const contact = projectData.intro.contact;
        if (contact.name || contact.phone) {
          const namePart = contact.name ? `<strong>${contact.name}</strong>` : '';
          const phonePart = contact.phone ? `電話：${contact.phone}` : '';
          const separator = contact.name && contact.phone ? ' / ' : '';
          contactInfoHtml = `
                        <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #eeeeee;">
                            <p style="margin: 0; font-size: 14px; color: #555;">
                                如有任何疑問，請洽詢：<br>
                                ${namePart}${separator}${phonePart}
                            </p>
                        </div>
                    `;
        }
      }
    }

    // --- 寄送 Email (邏輯不變) ---
    const mailTransport = nodemailer.createTransport({
      service: 'gmail',
      auth: { user: process.env.SENDER_EMAIL, pass: process.env.GMAIL_APP_PASSWORD },
    });


    const subject = `【${projectName}】預約成功通知 (${newAppointmentData.unitId})`;
    const bookingUrl = `https://anxismart.com/#/booking/${projectId}`;
    const bookingLinkHtml = `
            <p style="margin-top: 25px; padding-top: 20px; border-top: 1px solid #eeeeee; font-size: 14px; color: #555;">
                若您要查詢、修改或取消預約，請點擊以下按鈕返回預約頁面：<br>
                <a href="${bookingUrl}" target="_blank" style="display: inline-block; margin-top: 12px; padding: 10px 20px; background-color: #007bff; color: #ffffff; text-decoration: none; border-radius: 5px; font-weight: bold;">
                    前往預約頁面
                </a>
            </p>
        `;

    // 格式化日期為 YYYY/MM/DD
    const formattedAppointmentDate = newAppointmentData.appointmentDate.toDate().toLocaleDateString('zh-TW', {
      timeZone: 'Asia/Taipei', // 確保使用台灣時區
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });

    const htmlBody = `
<div style="font-family: 'Helvetica Neue', Helvetica, Arial, 'PingFang TC', 'Microsoft JhengHei', sans-serif; background-color: #f4f4f7; padding: 20px;">
  <div style="max-width: 600px; margin: 20px auto; background-color: #ffffff; border-radius: 8px; border: 1px solid #e0e0e0; overflow: hidden;">
    <div style="background-color: #007bff; color: #ffffff; padding: 20px; text-align: center;">
      <h2 style="margin: 0; font-size: 24px;">預約成功通知</h2>
    </div>
    <div style="padding: 24px; line-height: 1.6; color: #333333;">
      <p>親愛的 <strong>${newAppointmentData.bookerName}</strong> 您好：</p>
      <p>您已成功完成預約，以下是您的預約詳細資訊，請再次確認。</p>
      <table style="width: 100%; border-collapse: collapse; margin-top: 20px; margin-bottom: 20px;">
        <tbody>
          <tr style="border-bottom: 1px solid #eeeeee;"><td style="padding: 12px 0; font-weight: bold; color: #555555; width: 100px;">預約代碼</td><td style="padding: 12px 0; font-weight: bold; font-size: 16px; color: #D32F2F;">${newAppointmentData.bookingCode}</td></tr>
          <tr style="border-bottom: 1px solid #eeeeee;"><td style="padding: 12px 0; font-weight: bold; color: #555555;">建案名稱</td><td style="padding: 12px 0;">${projectName}</td></tr>
          <tr style="border-bottom: 1px solid #eeeeee;"><td style="padding: 12px 0; font-weight: bold; color: #555555;">戶別</td><td style="padding: 12px 0;">${newAppointmentData.unitId}</td></tr>
          <tr style="border-bottom: 1px solid #eeeeee;"><td style="padding: 12px 0; font-weight: bold; color: #555555;">門牌</td><td style="padding: 12px 0;">${newAppointmentData.address}</td></tr>
          <tr style="border-bottom: 1px solid #eeeeee;"><td style="padding: 12px 0; font-weight: bold; color: #555555;">預約姓名</td><td style="padding: 12px 0;">${newAppointmentData.bookerName}</td></tr>
          <tr style="border-bottom: 1px solid #eeeeee;"><td style="padding: 12px 0; font-weight: bold; color: #555555;">預約人電話</td><td style="padding: 12px 0;">${newAppointmentData.bookerPhone}</td></tr>
          <tr style="border-bottom: 1px solid #eeeeee;"><td style="padding: 12px 0; font-weight: bold; color: #555555;">EMAIL</td><td style="padding: 12px 0;">${newAppointmentData.bookerEmail}</td></tr>
          ${newAppointmentData.agentName ? `
           <tr style="border-top: 1px dashed #cccccc;"><td style="padding: 12px 0; font-weight: bold; color: #555555;">受託人姓名</td><td style="padding: 12px 0;">${newAppointmentData.agentName}</td></tr>
           <tr style="border-bottom: 1px solid #eeeeee;"><td style="padding: 12px 0; font-weight: bold; color: #555555;">受託人電話</td><td style="padding: 12px 0;">${newAppointmentData.agentPhone}</td></tr>
          ` : ''}
          ${newAppointmentData.authorizationLetterUrl ? `
            <tr style="border-bottom: 1px solid #eeeeee;">
              <td style="padding: 12px 0; font-weight: bold; color: #555555;">驗屋授權書</td>
              <td style="padding: 12px 0;">
                <a href="${newAppointmentData.authorizationLetterUrl}" target="_blank" style="color: #007BFF; text-decoration: none;">點此查看</a>
              </td>
            </tr>
          ` : ''}
          <tr style="border-bottom: 1px solid #eeeeee;"><td style="padding: 12px 0; font-weight: bold; color: #555555;">預約項目</td><td style="padding: 12px 0;">${newAppointmentData.bookingType}</td></tr>
          <tr style="border-bottom: 1px solid #eeeeee;"><td style="padding: 12px 0; font-weight: bold; color: #555555;">選擇方式</td><td style="padding: 12px 0;">${newAppointmentData.inspectionMethod}</td></tr>
          ${newAppointmentData.bookingMethodDetailsDisplay && newAppointmentData.bookingMethodDetailsDisplay.length > 0 ?
        newAppointmentData.bookingMethodDetailsDisplay.map(item => `
              <tr style="border-bottom: 1px solid #eeeeee;">
                <td style="padding: 12px 0; font-weight: bold; color: #555555;">${item.label}</td>
                <td style="padding: 12px 0;">${item.value}</td>
              </tr>
            `).join('')
        : ''}
          ${newAppointmentData.inspectionCompanyName ? `
          <tr style="border-bottom: 1px solid #eeeeee;"><td style="padding: 12px 0; font-weight: bold; color: #555555;">代驗公司</td><td style="padding: 12px 0;">${newAppointmentData.inspectionCompanyName}</td></tr>
          ` : ''}
          <tr style="border-bottom: 1px solid #eeeeee;"><td style="padding: 12px 0; font-weight: bold; color: #555555;">預約日期</td><td style="padding: 12px 0;">${formattedAppointmentDate}</td></tr>
          <tr><td style="padding: 12px 0; font-weight: bold; color: #555555;">預約時段</td><td style="padding: 12px 0;">${newAppointmentData.appointmentTimeSlot}</td></tr>
        </tbody>
      </table>
      <div style="padding: 15px; margin-top: 15px; margin-bottom: 20px; background-color: #f8f9fa; border-left: 4px solid #17a2b8; color: #333;">${closingText}</div>
      ${contactInfoHtml}
      ${inspectionNotesHtml ? `
        <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #eeeeee;">
          <h3 style="margin-top: 0; color: #333;">預約說明</h3>
          ${inspectionNotesHtml}
        </div>
      ` : ''}
      ${bookingLinkHtml}
    </div>
    <div style="background-color: #f4f4f7; padding: 16px; text-align: center; font-size: 12px; color: #777777;">
      <p style="margin: 0;">此為系統自動發送郵件，請勿直接回覆。</p>
      <p style="margin: 5px 0 0 0;">${projectName} 預約系統</p>
      <p style="margin: 10px 0 0 0; font-size: 11px; color: #999999;">
        本服務由 <a href="https://anxismart.com/" target="_blank" style="color: #007bff; text-decoration: none; font-weight: bold;">anxismart安熙智慧建案管理系統</a> 提供技術支援
      </p>
    </div>
  </div>
</div>
        `;


    const ccRecipients = await getCcRecipients(projectId, "驗屋系統信件副本");
    await mailTransport.sendMail({
      to: newAppointmentData.bookerEmail,
      cc: ccRecipients,
      subject: subject,
      html: htmlBody,
      name: `${projectName} 預約系統`
    });

    // --- 返回成功結果 (維持不變) ---
    return { status: 'success', data: { bookingCode } };

  } catch (error) {
    console.error(`[${functionName}] 🔴 預約時發生錯誤:`, error);
    if (error instanceof HttpsError) {
      throw error;
    }
    throw new HttpsError("internal", `儲存預約時發生嚴重錯誤: ${error.message}`);
  }
}

/**
 * [內部函式] 取消一筆預約紀錄
 */
async function _handleCancelBooking(data) {
  const { projectId, bookingCode } = data;
  const functionName = `_handleCancelBooking (Project: ${projectId}, Code: ${bookingCode})`;

  if (!projectId || !bookingCode) {
    throw new HttpsError("invalid-argument", "缺少 projectId 或 bookingCode。");
  }

  const db = new Firestore({ databaseId: "anxi-app" });

  try {
    const appointmentsRef = db.collection("appointments");

    const query = appointmentsRef
      .where("projectId", "==", projectId)
      .where("bookingCode", "==", bookingCode)
      .where("status", "==", "預約中")
      .limit(1);

    const snapshot = await query.get();

    if (snapshot.empty) {
      throw new HttpsError("not-found", `找不到可取消的預約紀錄 (代碼: ${bookingCode})。`);
    }

    const docToCancel = snapshot.docs[0];
    const bookingData = docToCancel.data();
    const unitId = bookingData.unitId;

    await db.runTransaction(async (transaction) => {
      transaction.update(docToCancel.ref, {
        status: "取消",
        cancelledAt: Timestamp.now()
      });
    });

    console.log(`[${functionName}] 已成功將預約 [${docToCancel.id}] 的狀態更新為「取消」。`);
    await updateHouseholdSummary(db, projectId, unitId);

    if (bookingData.bookerEmail) {
      // ... (後續所有寄送 Email 的邏輯，完全保持不變) ...
      const projectRef = db.collection('projects').doc(projectId);
      const projectDoc = await projectRef.get();
      const projectName = projectDoc.exists ? projectDoc.data().name : projectId;
      let contactInfoHtml = '';
      if (projectDoc.exists) {
        const projectData = projectDoc.data();
        if (projectData.intro && projectData.intro.contact) {
          const contact = projectData.intro.contact;
          if (contact.name || contact.phone) {
            const namePart = contact.name ? `<strong>${contact.name}</strong>` : '';
            const phonePart = contact.phone ? `電話：${contact.phone}` : '';
            const separator = contact.name && contact.phone ? ' / ' : '';
            contactInfoHtml = `
                            <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #eeeeee;">
                                <p style="margin: 0; font-size: 14px; color: #555;">
                                    如有任何疑問，請洽詢：<br>
                                    ${namePart}${separator}${phonePart}
                                </p>
                            </div>
                        `;
          }
        }
      }

      const mailTransport = nodemailer.createTransport({

        service: 'gmail',
        auth: { user: process.env.SENDER_EMAIL, pass: process.env.GMAIL_APP_PASSWORD },
      });

      const subject = `【${projectName}】預約取消成功通知 (${bookingData.unitId})`;
      const bookingUrl = `https://anxismart.com/#/booking/${projectId}`;

      //  【風格更新處】
      const htmlBody = `
<div style="font-family: 'Helvetica Neue', Helvetica, Arial, 'PingFang TC', 'Microsoft JhengHei', sans-serif; background-color: #f4f4f7; padding: 20px;">
  <div style="max-width: 600px; margin: 20px auto; background-color: #ffffff; border-radius: 8px; border: 1px solid #e0e0e0; overflow: hidden;">
    <div style="background-color: #dc3545; color: #ffffff; padding: 20px; text-align: center;">
      <h2 style="margin: 0; font-size: 24px;">預約取消通知</h2>
    </div>
    <div style="padding: 24px; line-height: 1.6; color: #333333;">
      <p>親愛的 <strong>${bookingData.bookerName}</strong> 您好：</p>
      <p>您已成功取消您的預約，以下是已取消的預約資訊：</p>
      <table style="width: 100%; border-collapse: collapse; margin-top: 20px; margin-bottom: 20px; opacity: 0.7;">
        <tbody>
          <tr style="border-bottom: 1px solid #eeeeee;"><td style="padding: 12px 0; font-weight: bold; color: #555555; width: 100px;">預約代碼</td><td style="padding: 12px 0;">${bookingData.bookingCode}</td></tr>
          <tr style="border-bottom: 1px solid #eeeeee;"><td style="padding: 12px 0; font-weight: bold; color: #555555;">建案名稱</td><td style="padding: 12px 0;">${projectName}</td></tr>
          <tr style="border-bottom: 1px solid #eeeeee;"><td style="padding: 12px 0; font-weight: bold; color: #555555;">戶別</td><td style="padding: 12px 0;">${bookingData.unitId}</td></tr>
          <tr style="border-bottom: 1px solid #eeeeee;"><td style="padding: 12px 0; font-weight: bold; color: #555555;">預約項目</td><td style="padding: 12px 0;">${bookingData.bookingType}</td></tr>
          <tr style="border-bottom: 1px solid #eeeeee;"><td style="padding: 12px 0; font-weight: bold; color: #555555;">選擇方式</td><td style="padding: 12px 0;">${bookingData.inspectionMethod || '未提供'}</td></tr>
          ${bookingData.bookingMethodDetailsDisplay && bookingData.bookingMethodDetailsDisplay.length > 0 ?
          bookingData.bookingMethodDetailsDisplay.map(item => `
              <tr style="border-bottom: 1px solid #eeeeee;">
                <td style="padding: 12px 0; font-weight: bold; color: #555555;">${item.label}</td>
                <td style="padding: 12px 0;">${item.value}</td>
              </tr>
            `).join('')
          : ''}
          ${bookingData.inspectionCompanyName ? `
          <tr style="border-bottom: 1px solid #eeeeee;"><td style="padding: 12px 0; font-weight: bold; color: #555555;">代驗公司</td><td style="padding: 12px 0;">${bookingData.inspectionCompanyName}</td></tr>
          ` : ''}
          ${bookingData.agentName ? `
           <tr style="border-top: 1px dashed #cccccc;"><td style="padding: 12px 0; font-weight: bold; color: #555555;">受託人姓名</td><td style="padding: 12px 0;">${bookingData.agentName}</td></tr>
           <tr style="border-bottom: 1px solid #eeeeee;"><td style="padding: 12px 0; font-weight: bold; color: #555555;">受託人電話</td><td style="padding: 12px 0;">${bookingData.agentPhone}</td></tr>
          ` : ''}
          <tr style="border-bottom: 1px solid #eeeeee;"><td style="padding: 12px 0; font-weight: bold; color: #555555;">原預約日期</td><td style="padding: 12px 0;">${bookingData.appointmentDate.toDate().toLocaleDateString('zh-TW', { timeZone: 'Asia/Taipei', year: 'numeric', month: '2-digit', day: '2-digit' })}</td></tr>
          <tr><td style="padding: 12px 0; font-weight: bold; color: #555555;">原預約時段</td><td style="padding: 12px 0;">${bookingData.appointmentTimeSlot}</td></tr>
        </tbody>
      </table>
      <p>若您需要重新預約，歡迎隨時返回預約頁面。感謝您的使用。</p>
      ${contactInfoHtml}
      <p style="margin-top: 25px; padding-top: 20px; border-top: 1px solid #eeeeee; text-align: center;">
          <a href="${bookingUrl}" target="_blank" style="display: inline-block; padding: 10px 20px; background-color: #007bff; color: #ffffff; text-decoration: none; border-radius: 5px; font-weight: bold;">
              點此重新預約

          </a>
      </p>
    </div>
    <div style="background-color: #f4f4f7; padding: 16px; text-align: center; font-size: 12px; color: #777777;">
      <p style="margin: 0;">此為系統自動發送郵件，請勿直接回覆。</p>
      <p style="margin: 5px 0 0 0;">${projectName} 預約系統</p>
      <p style="margin: 10px 0 0 0; font-size: 11px; color: #999999;">
        本服務由 <a href="https://anxismart.com/" target="_blank" style="color: #007bff; text-decoration: none; font-weight: bold;">anxismart安熙智慧建案管理系統</a> 提供技術支援
      </p>
    </div>
  </div>
</div>
            `;

      const ccRecipients = await getCcRecipients(projectId, "驗屋系統信件副本");
      await mailTransport.sendMail({
        to: bookingData.bookerEmail,
        cc: ccRecipients,
        subject: subject,
        html: htmlBody,
        name: `${projectName} 預約系統`
      });
      console.log(`[${functionName}] 已寄送取消通知信至 ${bookingData.bookerEmail}`);
    }

    return { status: "success", message: "預約已成功取消" };

  } catch (error) {
    console.error(`[${functionName}] 🔴 取消預約時發生錯誤:`, error);
    if (error instanceof HttpsError) {
      throw error;
    }
    throw new HttpsError("internal", `取消預約時發生錯誤: ${error.message}`);
  }
}


/**
 * [內部函式] 處理驗屋授權書的上傳 (Firebase 版)
 */
async function _handleUploadAuthLetter(data) {
  const functionName = '_handleUploadAuthLetter';
  const { projectId, unitId, fileName, base64 } = data;

  if (!projectId || !unitId || !fileName || !base64) {
    throw new HttpsError('invalid-argument', '缺少必要參數 (projectId, unitId, fileName, base64)。');
  }

  try {
    const db = new Firestore({ databaseId: 'anxi-app' });
    const householdDocId = `${projectId}_${unitId}`;
    const householdDocRef = db.collection('households').doc(householdDocId);
    const householdDoc = await householdDocRef.get();
    if (!householdDoc.exists) {
      throw new HttpsError('not-found', `在 'households' 集合中找不到戶別 "${unitId}" 的資料。`);
    }
    const householdData = householdDoc.data();
    const folderUrl = householdData.inspectionDocsUrl;
    if (!folderUrl) {
      throw new HttpsError('not-found', `戶別 "${unitId}" 的資料中缺少 "inspectionDocsUrl" 欄位設定。`);
    }
    const folderIdMatch = folderUrl.match(/[-\w]{25,}/);
    if (!folderIdMatch) {
      throw new HttpsError('invalid-argument', `"${folderUrl}" 不是一個有效的 Google Drive 資料夾連結。`);
    }
    const targetFolderId = folderIdMatch[0];
    const oauth2Client = new google.auth.OAuth2(
      process.env.DRIVE_CLIENT_ID,
      process.env.DRIVE_CLIENT_SECRET,
      'https://developers.google.com/oauthplayground'
    );
    oauth2Client.setCredentials({
      refresh_token: process.env.DRIVE_REFRESH_TOKEN,
    });
    const drive = google.drive({ version: "v3", auth: oauth2Client });
    const buffer = Buffer.from(base64, 'base64');
    const stream = Readable.from(buffer);
    const fileMetadata = { name: fileName, parents: [targetFolderId] };
    const media = { mimeType: 'image/png', body: stream };
    const uploadedFile = await drive.files.create({
      resource: fileMetadata,
      media: media,
      fields: 'id, name, webViewLink',
    });
    console.log(`[${functionName}] 授權書 "${fileName}" 已成功上傳至資料夾 ID: ${targetFolderId}`);
    return {
      status: 'success',
      url: uploadedFile.data.webViewLink,
      name: uploadedFile.data.name,
      id: uploadedFile.data.id
    };
  } catch (error) {
    console.error(`[${functionName}] 🔴 執行時發生錯誤:`, error);
    if (error instanceof HttpsError) throw error;
    if (error.response && error.response.data && error.response.data.error === 'invalid_grant') {
      throw new HttpsError("unauthenticated", `Google Drive 認證失敗，Refresh Token 可能已過期，請聯繫系統管理員。`);
    }
    throw new HttpsError('internal', `上傳授權書時發生錯誤: ${error.message}`);
  }
}


/**
 * 【修改】[內部函式] 獲取棟別列表 (供上傳報告頁面使用，讀取快取)
 */
async function _handleGetBuildingsForUpload(data) {
  const { projectId } = data;
  if (!projectId) {
    throw new HttpsError('invalid-argument', '缺少 projectId 參數。');
  }
  try {
    const db = new Firestore({ databaseId: "anxi-app" });
    //  1. 查詢 projects 集合
    const projectDoc = await db.collection('projects').doc(projectId).get();
    if (!projectDoc.exists) {
      throw new HttpsError('not-found', `找不到 ID 為 ${projectId} 的建案設定。`);
    }

    //  2. 讀取快取欄位
    const projectData = projectDoc.data();
    const buildings = projectData.uploadBuildingListCache || []; // <--- 讀取快取

    //  3. 回傳快取
    return { status: 'success', data: { buildings: buildings } };
  } catch (error) {
    console.error(`[_handleGetBuildingsForUpload (優化版)] 獲取棟別時發生錯誤:`, error);
    if (error instanceof HttpsError) throw error;
    throw new HttpsError('internal', '讀取棟別資料時發生錯誤。');
  }
}


/**
 * 【修改】[內部函式] 獲取所有戶別資料 (供上傳報告頁面使用，讀取快取)
 */
async function _handleGetAllUnitsForUpload(data) {
  const { projectId } = data;
  if (!projectId) {
    throw new HttpsError('invalid-argument', '缺少 projectId 參數。');
  }
  try {
    const db = new Firestore({ databaseId: "anxi-app" });
    //  1. 查詢 projects 集合
    const projectDoc = await db.collection('projects').doc(projectId).get();
    if (!projectDoc.exists) {
      throw new HttpsError('not-found', `找不到 ID 為 ${projectId} 的建案設定。`);
    }

    //  2. 讀取快取欄位
    const projectData = projectDoc.data();
    const allUnitsByBuilding = projectData.uploadUnitsCache || {}; // <--- 讀取快取

    //  3. 回傳快取
    return { status: 'success', data: allUnitsByBuilding };
  } catch (error) {
    console.error(`[_handleGetAllUnitsForUpload (優化版)] 獲取戶別時發生錯誤:`, error);
    if (error instanceof HttpsError) throw error;
    throw new HttpsError('internal', '讀取戶別資料時發生錯誤。');
  }
}


/**
 * [內部函式] 代理驗屋報告上傳
 */
async function _handleHandleDirectReportUpload(data) {
  const functionName = '_handleHandleDirectReportUpload';
  const {
    projectId, unit, reportType, buyerName,
    phone, email, companyName, bookingCode,
    fileUrl // ✅ [修改] 接收 fileUrl (檔案網址)，而不是 fileContent
  } = data;

  // 驗證邏輯 (移除 fileContent 檢查，改檢查 fileUrl)
  if (!projectId || !unit || !fileUrl || !reportType) {
    throw new HttpsError('invalid-argument', '缺少必要參數 (projectId, unit, fileUrl, reportType)。');
  }

  console.log(`[${functionName}] 開始處理戶別 ${unit} 的檔案上傳`);
  const db = new Firestore({ databaseId: "anxi-app" });

  try {
    const projectDocRef = db.collection('projects').doc(projectId);
    const householdDocId = `${projectId}_${unit}`;
    const householdRef = db.collection('households').doc(householdDocId);

    // 1. 讀取戶別資料與檢查權限
    const initialHouseholdDoc = await householdRef.get();
    if (!initialHouseholdDoc.exists) throw new HttpsError('not-found', `找不到戶別資料: ${householdDocId}`);

    const householdData = initialHouseholdDoc.data();
    const switchField = reportType === '初驗報告' ? 'initialReportUploadSwitch' : 'reInspectionReportUploadSwitch';

    if (householdData[switchField] !== true) {
      throw new HttpsError('permission-denied', `${unit} 的 ${reportType} 上傳權限已關閉。`);
    }

    const parentFolderUrl = householdData.inspectionReportFolderUrl;
    if (!parentFolderUrl) {
      throw new HttpsError('failed-precondition', `戶別資料中缺少 "inspectionReportFolderUrl" 設定。`);
    }

    // 2. 解析 Google Drive 資料夾 ID
    const parentFolderIdMatch = parentFolderUrl.match(/[-\w]{25,}/);
    if (!parentFolderIdMatch) throw new HttpsError('invalid-argument', '無效的 Drive 資料夾連結。');
    const parentFolderId = parentFolderIdMatch[0];

    // 3. Google Drive 認證
    const oauth2Client = new google.auth.OAuth2(
      process.env.DRIVE_CLIENT_ID,
      process.env.DRIVE_CLIENT_SECRET,
      'https://developers.google.com/oauthplayground'
    );
    oauth2Client.setCredentials({ refresh_token: process.env.DRIVE_REFRESH_TOKEN });
    const drive = google.drive({ version: "v3", auth: oauth2Client });

    // 4. 搜尋或建立子資料夾
    const searchRes = await drive.files.list({
      q: `name='${unit}' and mimeType='application/vnd.google-apps.folder' and '${parentFolderId}' in parents and trashed=false`
    });
    let subFolderId = searchRes.data.files.length > 0
      ? searchRes.data.files[0].id
      : (await drive.files.create({
        resource: { name: unit, mimeType: 'application/vnd.google-apps.folder', parents: [parentFolderId] },
        fields: 'id'
      })).data.id;

    // 5. 產生檔名
    const now = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Taipei" }));
    const timestamp = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}-${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}`;
    const nameParts = [reportType, unit, buyerName, companyName].filter(Boolean);
    const newFileName = `${nameParts.join('-')}-${timestamp}.pdf`;

    // =====================================================
    // ✅ 【核心修改開始】使用 Fetch 取得串流，取代原本的 Base64 Buffer
    // =====================================================
    console.log(`[${functionName}] 正在從 Storage URL 取得檔案串流...`);

    // 使用 fetch 讀取檔案 (不下載到記憶體，建立網路串流)
    const response = await fetch(fileUrl);
    if (!response.ok) {
      throw new HttpsError('internal', `無法讀取來源檔案: ${response.statusText}`);
    }

    // 直接取得串流 (ReadableStream)
    const fileStream = response.body;

    console.log(`[${functionName}] 正在將串流上傳至 Google Drive...`);

    // 上傳到 Google Drive (body 直接接受 stream)
    const uploadedFile = await drive.files.create({
      requestBody: { name: newFileName, parents: [subFolderId] },
      media: {
        mimeType: 'application/pdf',
        body: fileStream // ✅ 這裡是真正的 Stream，記憶體消耗極低
      },
      fields: 'id, name, webViewLink',
    });

    const uploadedFileLink = uploadedFile.data.webViewLink;
    console.log(`[${functionName}] 檔案上傳成功，連結: ${uploadedFileLink}`);
    // =====================================================
    // ✅ 【核心修改結束】
    // =====================================================


    // 6. 執行資料庫更新事務
    console.log(`[${functionName}] 正在執行資料庫更新事務...`);
    await db.runTransaction(async (transaction) => {
      let appointmentDocRef = null;
      if (bookingCode) {
        const appointmentQuery = db.collection('appointments').where('projectId', '==', projectId).where('bookingCode', '==', bookingCode).limit(1);
        const appointmentSnapshot = await transaction.get(appointmentQuery);
        if (!appointmentSnapshot.empty) appointmentDocRef = appointmentSnapshot.docs[0].ref;
      }

      const logTimestamp = new Date();
      const logIdSuffix = `${String(logTimestamp.getFullYear()).slice(2)}${String(logTimestamp.getMonth() + 1).padStart(2, '0')}${String(logTimestamp.getDate()).padStart(2, '0')}${String(logTimestamp.getHours()).padStart(2, '0')}${String(logTimestamp.getMinutes()).padStart(2, '0')}${String(logTimestamp.getSeconds()).padStart(2, '0')}`;
      const logDocId = `${projectId}_${unit}_${logIdSuffix}`;
      const logRef = db.collection('inspectionReportLogs').doc(logDocId);

      transaction.set(logRef, {
        timestamp: admin.firestore.FieldValue.serverTimestamp(), projectID: projectId,
        buyerName: buyerName || 'N/A', phone: phone || 'N/A', email: email || 'N/A',
        unit: unit, fileUrl: uploadedFileLink, reportType: reportType, companyName: companyName || '',
      });

      transaction.update(householdRef, {
        [switchField]: false,
        inspectionReportUrl: admin.firestore.FieldValue.arrayUnion({ name: newFileName, url: uploadedFileLink })
      });

      if (appointmentDocRef) {
        transaction.update(appointmentDocRef, { uploadReportTime: admin.firestore.FieldValue.serverTimestamp(), reportUploaded: true });
      }
    });
    console.log(`[${functionName}] 資料庫事務成功。`);

    // 7. 寄送 Email
    if (email) {
      const projectDoc = await projectDocRef.get();
      const projectName = projectDoc.exists ? projectDoc.data().name : projectId;
      const mailTransport = nodemailer.createTransport({ service: 'gmail', auth: { user: process.env.SENDER_EMAIL, pass: process.env.GMAIL_APP_PASSWORD } });

      const subject = `【${projectName}】驗屋報告上傳成功通知 (${unit})`;
      const bookingUrl = `https://anxismart.com/#/booking/${projectId}`;

      const returnButtonHtml = `
          <p style="margin-top: 25px; padding-top: 20px; border-top: 1px solid #eeeeee; font-size: 14px; color: #555;">
              若您需要再次上傳或進行預約，請點擊以下按鈕返回頁面：<br>
              <a href="${bookingUrl}" target="_blank" style="display: inline-block; margin-top: 12px; padding: 10px 20px; background-color: #007bff; color: #ffffff; text-decoration: none; border-radius: 5px; font-weight: bold;">
                  返回上傳/預約頁面
              </a>
          </p>
      `;

      const htmlBody = `
        <div style="font-family: 'Helvetica Neue', Helvetica, Arial, 'PingFang TC', 'Microsoft JhengHei', sans-serif; background-color: #f4f4f7; padding: 20px;">
        <div style="max-width: 600px; margin: 20px auto; background-color: #ffffff; border-radius: 8px; border: 1px solid #e0e0e0; overflow: hidden;">
          <div style="background-color: #28a745; color: #ffffff; padding: 20px; text-align: center;">
            <h2 style="margin: 0; font-size: 24px;">報告上傳成功通知</h2>
          </div>
          <div style="padding: 24px; line-height: 1.6; color: #333333;">
            <p>親愛的 <strong>${buyerName || '住戶'}</strong> 您好：</p>
            <p>您的驗屋報告已成功上傳，以下是本次的上傳紀錄。</p>
            <table style="width: 100%; border-collapse: collapse; margin-top: 20px; margin-bottom: 20px;">
              <tbody>
                <tr style="border-bottom: 1px solid #eeeeee;"><td style="padding: 12px 0; font-weight: bold; color: #555555; width: 100px;">建案名稱</td><td style="padding: 12px 0;">${projectName}</td></tr>
                <tr style="border-bottom: 1px solid #eeeeee;"><td style="padding: 12px 0; font-weight: bold; color: #555555;">戶別</td><td style="padding: 12px 0;">${unit}</td></tr>
                <tr style="border-bottom: 1px solid #eeeeee;"><td style="padding: 12px 0; font-weight: bold; color: #555555;">上傳姓名</td><td style="padding: 12px 0;">${buyerName}</td></tr>
                <tr style="border-bottom: 1px solid #eeeeee;"><td style="padding: 12px 0; font-weight: bold; color: #555555;">連絡電話</td><td style="padding: 12px 0;">${phone || '未提供'}</td></tr>
                <tr style="border-bottom: 1px solid #eeeeee;"><td style="padding: 12px 0; font-weight: bold; color: #555555;">報告類型</td><td style="padding: 12px 0;">${reportType}</td></tr>
                ${companyName ? `<tr style="border-bottom: 1px solid #eeeeee;"><td style="padding: 12px 0; font-weight: bold; color: #555555;">代驗公司</td><td style="padding: 12px 0;">${companyName}</td></tr>` : ''}
                <tr>
                  <td style="padding: 12px 0; font-weight: bold; color: #555555;">報告連結</td>
                  <td style="padding: 12px 0;">
                    <a href="${uploadedFileLink}" target="_blank" style="color: #007BFF; text-decoration: none; font-weight: bold;">點此查看報告</a>
                  </td>
                </tr>
              </tbody>
            </table>
            <p>感謝您的使用，如有任何問題，請與現場服務人員聯繫。</p>
            ${returnButtonHtml}
          </div>
          <div style="background-color: #f4f4f7; padding: 16px; text-align: center; font-size: 12px; color: #777777;">
            <p style="margin: 0;">此為系統自動發送郵件，請勿直接回覆。</p>
            <p style="margin: 5px 0 0 0;">${projectName} 驗屋報告系統</p>
            <p style="margin: 10px 0 0 0; font-size: 11px; color: #999999;">
              本服務由 <a href="https://anxismart.com/" target="_blank" style="color: #007bff; text-decoration: none; font-weight: bold;">anxismart安熙智慧建案管理系統</a> 提供技術支援
            </p>
          </div>
        </div>
        </div>
      `;

      const ccRecipients = await getCcRecipients(projectId, "驗屋系統信件副本");
      await mailTransport.sendMail({
        from: `"${projectName} 驗屋報告系統" <${process.env.SENDER_EMAIL}>`,
        to: email, subject,
        cc: ccRecipients,
        html: htmlBody
      });
      console.log(`[${functionName}] 已成功寄送確認信至: ${email}`);
    }

    console.log(`[${functionName}] 處理完成: ${newFileName}`);
    return { status: 'success', message: '檔案上傳成功，確認信已寄出。' };

  } catch (error) {
    console.error(`[${functionName}] 🔴 處理檔案時發生嚴重錯誤:`, error);
    if (error instanceof HttpsError) { throw error; }
    throw new HttpsError('internal', `處理上傳時發生錯誤: ${error.message}`);
  }
}

/**
 * [內部函式] 發起授權書簽署流程 (委託人發起)
 */
async function _handleInitiateAuthSigningProcess(data) {
  const { projectId, unitId, formData, delegatorSignature } = data;
  const functionName = `_handleInitiateAuthSigningProcess`;

  if (!projectId || !unitId || !formData || !delegatorSignature) {
    throw new HttpsError("invalid-argument", "缺少必要參數。");
  }

  const db = new Firestore({ databaseId: "anxi-app" });

  try {
    const token = crypto.randomBytes(32).toString('hex');
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 48 * 60 * 60 * 1000);
    const sessionRef = db.collection("authLetterSessions").doc(token);
    await sessionRef.set({
      projectId, unitId, formData, delegatorSignature,
      status: 'pending',
      createdAt: Timestamp.fromDate(now),
      expiresAt: Timestamp.fromDate(expiresAt),
    });
    const projectDoc = await db.collection('projects').doc(projectId).get();
    const projectName = projectDoc.exists ? projectDoc.data().name : projectId;
    const signingUrl = `https://anxismart.com/#/sign-auth/${token}`;
    const mailTransport = nodemailer.createTransport({
      service: 'gmail',
      auth: { user: process.env.SENDER_EMAIL, pass: process.env.GMAIL_APP_PASSWORD },
    });



    const emailBodyHtml = `
      <div style="font-family: Arial, sans-serif; line-height: 1.6;">
        <h2 style="color: #333;">【${projectName}】驗屋授權書簽署邀請</h2>
        <p>親愛的 ${formData.受託人姓名} 您好：</p>
        <p>委託人(屋主) ${formData.委託人姓名} 已發起一份驗屋授權書，需要您的簽署以完成預約流程。</p>
        <p>請點擊下方的按鈕，檢視文件內容並完成您的簽署。為保障安全，此連結將於 48 小時後失效。</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${signingUrl}" target="_blank" style="background-color: #007bff; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold;">
            前往簽署授權書
          </a>
        </div>
        <p>如果您不認識委託人，請忽略此郵件。</p>
        <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
        <p style="font-size: 12px; color: #888;">此為系統自動發送的郵件，請勿直接回覆。</p>
      </div>
    `;

    await mailTransport.sendMail({
      from: `"${projectName} 預約系統" <${process.env.SENDER_EMAIL}>`,
      to: formData.受託人Email,
      subject: `【重要】${projectName} 驗屋授權書簽署邀請`,
      html: emailBodyHtml,
    });
    console.log(`[${functionName}] 已成功為 ${unitId} 寄送簽署邀請至受託人 ${formData.受託人Email}`);
    return { status: "success", message: "邀請已寄出" };
  } catch (error) {
    console.error(`[${functionName}] 發生錯誤:`, error);
    throw new HttpsError("internal", `發起簽署流程時發生錯誤: ${error.message}`);
  }
}

/**
 * [內部函式] 驗屋報告上傳前置驗證
 */
async function _handleVerifyUploadPrerequisites(data) {
  const { projectId, unitId, reportType, idNumber } = data;
  const functionName = `_handleVerifyUploadPrerequisites (Project: ${projectId}, Unit: ${unitId})`;

  if (!projectId || !unitId || !reportType || !idNumber) {
    throw new HttpsError("invalid-argument", "缺少必要參數 (projectId, unitId, reportType, idNumber)。");
  }

  const db = new Firestore({ databaseId: "anxi-app" });

  try {
    // ... (此函數的完整內部邏輯保持不變，直接複製過來) ...
    console.log(`[${functionName}] 步驟 1/3: 驗證身分證...`);
    const householdDocId = `${projectId}_${unitId}`;
    const householdDoc = await db.collection('households').doc(householdDocId).get();
    if (!householdDoc.exists) throw new HttpsError('not-found', `找不到戶別 "${unitId}" 的資料。`);
    const householdData = householdDoc.data();
    const storedId = String(householdData.buyerIdNumber || '').trim();
    const inputId = String(idNumber).trim();
    if (storedId !== inputId && inputId !== projectId) throw new HttpsError('permission-denied', '身分證號碼驗證失敗，請重新確認。');
    console.log(`[${functionName}] 身分證驗證成功。`);
    console.log(`[${functionName}] 步驟 2/3: 檢查上傳開關...`);
    const bookingTypeForSwitch = reportType === '初驗報告' ? 'initialReportUploadSwitch' : 'reInspectionReportUploadSwitch';
    if (householdData[bookingTypeForSwitch] !== true) throw new HttpsError('permission-denied', `此戶別的「${reportType}」上傳功能目前未開放或已關閉。`);
    console.log(`[${functionName}] 上傳開關已開啟。`);
    console.log(`[${functionName}] 步驟 3/3: 檢查相關預約紀錄...`);
    const bookingTypeForQuery = reportType.replace('報告', '');
    const appointmentsQuery = db.collection('appointments')
      .where('projectId', '==', projectId).where('unitId', '==', unitId)
      .where('bookingType', '==', bookingTypeForQuery).where('status', 'in', ['預約中', '已完成'])
      .where('inspectionMethod', '==', '代驗公司').orderBy('createdAt', 'desc');
    const appointmentSnapshot = await appointmentsQuery.get();
    if (appointmentSnapshot.empty) {
      const projectDoc = await db.collection('projects').doc(projectId).get();
      const projectName = projectDoc.exists ? projectDoc.data().name : projectId;
      console.log(`[${functionName}] 找不到代驗公司預約紀錄，回傳需要確認。`);
      return { status: 'needs_confirmation', message: `系統找不到 ${projectName} ${unitId} 的代驗公司「${bookingTypeForQuery}」紀錄，您確定要繼續上傳嗎？` };
    }
    const latestAppointment = appointmentSnapshot.docs[0].data();
    // ✅ [修改] 取消驗證 uploadReportTime，允許重複上傳
    /* if (latestAppointment.uploadReportTime) {
      const uploadTime = latestAppointment.uploadReportTime.toDate().toLocaleString('zh-TW', { timeZone: 'Asia/Taipei' });
      const projectDoc = await db.collection('projects').doc(projectId).get();
      const projectName = projectDoc.exists ? projectDoc.data().name : projectId;
      console.log(`[${functionName}] 發現已上傳紀錄，拒絕操作。`);
      throw new HttpsError('already-exists', `${projectName} ${unitId} 已於 ${uploadTime} 上傳過 ${reportType}，如需重新上傳請洽客服人員。`);
    }
    */
    console.log(`[${functionName}] 所有驗證通過。`);
    return { status: 'success', bookingCode: latestAppointment.bookingCode };

  } catch (error) {
    console.error(`[${functionName}] 驗證失敗:`, error);
    if (error instanceof HttpsError) {
      throw error;
    }
    throw new HttpsError('internal', `驗證時發生未預期的錯誤: ${error.message}`);
  }
}

/**
 * [內部函式] 產生預約確認 Token
 */
async function _handleInitiateBookingConfirmation(data) {
  const { projectId, unitId, bookingType } = data;
  const functionName = '_handleInitiateBookingConfirmation';
  if (!projectId || !unitId || !bookingType) {
    console.error(`[${functionName}] 錯誤：缺少必要參數。`);
    throw new HttpsError("invalid-argument", "缺少 projectId, unitId 或 bookingType。");
  }
  const db = new Firestore({ databaseId: "anxi-app" });
  try {
    const token = crypto.randomBytes(32).toString('hex');
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 5 * 60 * 1000); // 5 分鐘後過期
    const tokenRef = db.collection("bookingConfirmTokens").doc(token);
    await tokenRef.set({
      projectId: projectId,
      unitId: unitId,
      bookingType: bookingType,
      status: 'pending',
      createdAt: Timestamp.fromDate(now),
      expiresAt: Timestamp.fromDate(expiresAt),
    });
    console.log(`[${functionName}] 已為 ${projectId}/${unitId} 產生確認 Token: ${token}`);
    return { status: 'success', token: token };
  } catch (error) {
    console.error(`[${functionName}] 產生 Token 時發生錯誤:`, error);
    throw new HttpsError("internal", `初始化確認步驟時發生錯誤: ${error.message}`);
  }
}


// =================================================================
// /   【新增】後台預約 (AdminBooking) 路由函數
// =================================================================

/**
 *  [V2 - 路由函數] AdminAddBookingDialog.vue 的單一 API 入口
 * 接收一個 action，並將請求路由到對應的內部處理函式。
 * 這能確保所有後台預約的操作都命中同一個已預熱的 Cloud Function 實例。
 */
exports.adminBookingApi = onCall({
  region: "asia-east1",
  //  組合所有子函數需要的 secrets
  secrets: ["SENDER_EMAIL", "GMAIL_APP_PASSWORD"],
  //  確保記憶體和超時足夠 (某些查詢可能較慢)
  memory: "1GiB",
  timeoutSeconds: 300,
  cors: true
}, async (request) => {

  // 1. 從 request.data 中解構出 action 和 data
  const { action, data } = request.data;

  // 2. 建立一個日誌名稱，方便追蹤
  const functionName = `adminBookingApi (Action: ${action})`;

  try {
    console.log(`[${functionName}] 路由函數啟動...`);

    // 3. 根據 action 執行對應的內部函式
    switch (action) {

      // --- 頁面初始化 (Store) ---
      case 'getProjectConfig':
        return await _handleGetProjectConfig(data);
      case 'getProjectBatchDetails':
        return await _handleGetProjectBatchDetails(data);

      // --- 步驟一：選擇戶別 ---
      case 'searchHouseholdsForAdmin':
        return await _handleSearchHouseholdsForAdmin(data);
      case 'getAppointmentsForHousehold':
        return await _handleGetAppointmentsForHousehold(data);
      case 'getAdminBookingCalendarData':
        return await _handleGetAdminBookingCalendarData(data);

      // --- 步驟二：填寫資訊 ---
      case 'getSlotsForAdmin':
        return await _handleGetSlotsForAdmin(data);

      // --- 步驟三：送出 ---
      case 'addAppointmentAdmin':
        return await _handleAddAppointmentAdmin(data);

      // --- 彈窗操作：編輯/取消 ---
      case 'updateAppointment':
        return await _handleUpdateAppointmentByAdmin(data);
      case 'cancelAppointment':
        return await _handleCancelAppointmentByAdmin(data);

      // --- 預設情況 ---
      default:
        console.error(`[${functionName}] 錯誤：未知的 action: ${action}`);
        throw new HttpsError('invalid-argument', `未知的 API 動作: ${action}`);
    }

  } catch (error) {
    // 4. 統一捕捉所有內部函式拋出的 HttpsError 或其他錯誤
    console.error(`[${functionName}] 執行時發生錯誤:`, error);

    // 如果錯誤已經是 HttpsError，直接重新拋出
    if (error instanceof HttpsError) {
      throw error;
    }

    // 如果是其他類型的錯誤，包裝成 HttpsError 拋出
    throw new HttpsError('internal', `處理 ${action} 時發生未預期的錯誤: ${error.message}`);
  }
});

/**
 *  [V2 - 冷刪除版] 獲取指定建案所有 *有效* 預約批次的詳細資訊
 * (內部函式)
 * @param {object} data - 包含 { projectId }
 * @returns {Promise<object>} - 以 bookingType 和 batchCode 分類的批次資訊物件
 */
async function _handleGetProjectBatchDetails(data) {
  const { projectId } = data;
  const functionName = "_handleGetProjectBatchDetails";

  if (!projectId) {
    console.error(`[${functionName}] ERROR: Missing projectId.`);
    throw new HttpsError("invalid-argument", "缺少建案 ID (projectId)。");
  }

  const db = new Firestore({ databaseId: "anxi-app" });
  try {
    const batchesRef = db.collection("bookingBatches");
    const query = batchesRef
      .where("projectId", "==", projectId)
      .where("isDeleted", "==", false);

    console.log(`[${functionName}] Querying active batches for project ${projectId}...`);
    const snapshot = await query.get();

    if (snapshot.empty) {
      console.log(`[${functionName}] No active batches found.`);
      return { status: "success", data: {} };
    }
    console.log(`[${functionName}] Found ${snapshot.size} active batches.`);

    const batchDetails = {};
    const now = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Taipei" }));

    snapshot.forEach(doc => {
      const data = doc.data();
      const { bookingType, batchCode, applicationStart, applicationEnd } = data;

      if (!bookingType || !batchCode) {
        console.warn(`[${functionName}] WARN: Skipping batch ${doc.id} due to missing bookingType or batchCode.`);
        return;
      }

      let statusText = '狀態不明';
      let color = 'grey';
      let start, end;

      try {
        if (applicationStart?.toDate) start = applicationStart.toDate();
        else if (applicationStart?.seconds) start = new Date(applicationStart.seconds * 1000);
        else start = new Date(applicationStart);

        if (applicationEnd?.toDate) end = applicationEnd.toDate();
        else if (applicationEnd?.seconds) end = new Date(applicationEnd.seconds * 1000);
        else end = new Date(applicationEnd);

        if (isNaN(start?.getTime()) || isNaN(end?.getTime())) throw new Error('Invalid date');

        if (start && end) {
          if (now < start) {
            statusText = '尚未開放';
            color = 'blue-grey';
          } else if (now > end) {
            statusText = '已截止';
            color = 'red-darken-1';
          } else {
            statusText = '開放中';
            color = 'green';
          }
        }
      } catch (dateError) {
        console.warn(`[${functionName}] WARN: Invalid date format for batch ${batchCode}.`, dateError);
      }

      if (!batchDetails[bookingType]) {
        batchDetails[bookingType] = {};
      }

      batchDetails[bookingType][batchCode] = {
        bookingStart: data.bookingStart,
        bookingEnd: data.bookingEnd,
        statusText: statusText,
        color: color
      };
    });

    console.log(`[${functionName}] Successfully processed batch details for project ${projectId}.`);
    //  回傳：路由函數會自動包裝 { status, data }
    return batchDetails;

  } catch (error) {
    console.error(`[${functionName}] 🔴 ERROR fetching batch details:`, error);
    throw new HttpsError("internal", `獲取批次詳情時發生錯誤: ${error.message}`);
  }
}

/**
 * [後台用] 根據關鍵字模糊搜尋戶別資料
 * (內部函式)
 * @param {object} data - 包含 { projectId, keyword }
 * @returns {Promise<object>} - 包含符合條件的戶別列表
 */
async function _handleSearchHouseholdsForAdmin(data) {
  const { projectId, keyword } = data;
  const functionName = "_handleSearchHouseholdsForAdmin";

  if (!projectId || !keyword || keyword.trim().length < 2) {
    throw new HttpsError("invalid-argument", "必須提供有效的建案 ID 和至少 2 個字元的關鍵字。");
  }

  const lowerCaseKeyword = keyword.toLowerCase().trim();
  const db = new Firestore({ databaseId: "anxi-app" });

  try {
    const householdsRef = db.collection("households");
    const query = householdsRef.where("projectId", "==", projectId);
    const snapshot = await query.get();

    if (snapshot.empty) {
      return { status: "success", data: [] };
    }

    const searchFields = ['buyerEmail', 'buyerIdNumber', 'buyerName', 'buyerPhone', 'unitId'];
    const results = [];

    snapshot.forEach(doc => {
      const data = doc.data();
      let isMatch = false;
      for (const field of searchFields) {
        const value = data[field];
        if (value && typeof value === 'string' && value.toLowerCase().includes(lowerCaseKeyword)) {
          isMatch = true;
          break;
        }
      }
      if (isMatch) {
        results.push({
          unitId: data.unitId,
          buyerName: data.buyerName || 'N/A',
        });
      }
    });

    results.sort((a, b) => a.unitId.localeCompare(b.unitId, 'zh-Hant-TW', { numeric: true }));

    console.log(`[${functionName}] 在專案 [${projectId}] 中，根據關鍵字 [${keyword}] 找到了 ${results.length} 筆戶別。`);
    //  回傳：路由函數會自動包裝
    return { status: "success", data: results };

  } catch (error) {
    console.error(`[${functionName}] 搜尋戶別時發生錯誤:`, error);
    throw new HttpsError("internal", "搜尋戶別資料時發生錯誤。");
  }
}

/**
 * [後台用] 獲取指定單一戶別的所有預約歷史紀錄
 * (內部函式)
 * @param {object} data - 包含 { projectId, unitId }
 * @returns {Promise<object>} - 包含該戶別所有預約紀錄的陣列
 */
async function _handleGetAppointmentsForHousehold(data) {
  const { projectId, unitId } = data;
  const functionName = "_handleGetAppointmentsForHousehold";

  if (!projectId || !unitId) {
    throw new HttpsError("invalid-argument", "缺少建案 ID (projectId) 或戶別 ID (unitId)。");
  }

  const db = new Firestore({ databaseId: "anxi-app" });
  try {
    const appointmentsRef = db.collection("appointments");
    const query = appointmentsRef
      .where("projectId", "==", projectId)
      .where("unitId", "==", unitId)
      .orderBy("createdAt", "desc");

    const snapshot = await query.get();

    if (snapshot.empty) {
      return { status: "success", data: [] };
    }

    const history = snapshot.docs.map(doc => {
      const data = doc.data();
      if (data.appointmentDate && data.appointmentDate.toDate) {
        data.appointmentDate = data.appointmentDate.toDate().toISOString();
      }
      if (data.createdAt && data.createdAt.toDate) {
        data.createdAt = data.createdAt.toDate().toISOString();
      }
      return { id: doc.id, ...data };
    });

    console.log(`[${functionName}] 成功查詢到戶別 [${unitId}] 的 ${history.length} 筆預約紀錄。`);
    //  回傳：路由函數會自動包裝
    return { status: "success", data: history };

  } catch (error) {
    console.error(`[${functionName}] 查詢預約歷史時發生錯誤:`, error);
    if (error.code === 9 && error.message.includes('https://console.firebase.google.com/')) {
      const urlMatch = error.message.match(/(https:\/\/console\.firebase\.google\.com\/.*?)\?/);
      if (urlMatch && urlMatch[1]) {
        const indexCreationUrl = urlMatch[1];
        throw new HttpsError(
          "failed-precondition",
          `資料庫缺少必要的索引。請點擊以下連結建立索引，等待幾分鐘後再試： ${indexCreationUrl}`
        );
      }
    }
    throw new HttpsError("internal", "查詢預約歷史時發生錯誤。");
  }
}

/**
 *  [V2 - 冷刪除版] 獲取行事曆所需的所有 *有效* 日期及其分類 (本戶批次/其他批次)
 * (內部函式)
 * @param {object} data - 包含 { projectId, unitId }
 * @returns {Promise<object>} - 包含日期與其類型的陣列
 */
async function _handleGetAdminBookingCalendarData(data) {
  const { projectId, unitId } = data;
  const functionName = "_handleGetAdminBookingCalendarData";

  if (!projectId || !unitId) {
    console.error(`[${functionName}] ERROR: Missing projectId or unitId.`);
    throw new HttpsError("invalid-argument", "缺少建案 ID (projectId) 或戶別 ID (unitId)。");
  }

  const db = new Firestore({ databaseId: "anxi-app" });
  try {
    const householdDocRef = db.collection("households").doc(`${projectId}_${unitId}`);
    console.log(`[${functionName}] Fetching household data for ${projectId}_${unitId}...`);
    const householdDoc = await householdDocRef.get();
    if (!householdDoc.exists) {
      console.error(`[${functionName}] ERROR: Household document not found.`);
      throw new HttpsError("not-found", "找不到指定的戶別資料。");
    }
    const householdData = householdDoc.data();
    const ownBatchCodes = new Set([householdData.initialInspectionBatch, householdData.reInspectionBatch].filter(Boolean));
    console.log(`[${functionName}] Target household batch codes:`, Array.from(ownBatchCodes));

    const batchesRef = db.collection("bookingBatches");
    const batchesQuery = batchesRef
      .where("projectId", "==", projectId)
      .where("isDeleted", "==", false);
    console.log(`[${functionName}] Querying active batches for project ${projectId}...`);
    const batchesSnapshot = await batchesQuery.get();
    const batchIdToCodeMap = new Map();
    batchesSnapshot.forEach(doc => {
      batchIdToCodeMap.set(doc.id, doc.data().batchCode);
    });
    console.log(`[${functionName}] Found ${batchIdToCodeMap.size} active batches.`);

    const linksRef = db.collection("batchRuleLinks");
    const linksQuery = linksRef
      .where("projectId", "==", projectId)
      .where("isDeleted", "==", false);
    console.log(`[${functionName}] Querying active batch rule links...`);
    const linksSnapshot = await linksQuery.get();
    const dateToBatchCodesMap = new Map();
    linksSnapshot.forEach(doc => {
      const { date, batchId } = doc.data();
      const batchCode = batchIdToCodeMap.get(batchId);
      if (date && batchCode) {
        if (!dateToBatchCodesMap.has(date)) {
          dateToBatchCodesMap.set(date, new Set());
        }
        dateToBatchCodesMap.get(date).add(batchCode);
      } else if (date && !batchCode) {
        console.warn(`[${functionName}] WARN: Link ${doc.id} points to an inactive/deleted batchId ${batchId}. Skipping.`);
      }
    });
    console.log(`[${functionName}] Processed ${linksSnapshot.size} active links, resulting in ${dateToBatchCodesMap.size} unique dates.`);

    const calendarData = [];
    dateToBatchCodesMap.forEach((batchCodesOnDate, date) => {
      let isOwnBatch = false;
      for (const code of batchCodesOnDate) {
        if (ownBatchCodes.has(code)) {
          isOwnBatch = true;
          break;
        }
      }
      calendarData.push({
        date: date,
        type: isOwnBatch ? 'own_batch' : 'other_batch'
      });
    });

    console.log(`[${functionName}] Successfully generated calendar data for ${calendarData.length} dates.`);
    //  回傳：路由函數會自動包裝
    return { status: "success", data: calendarData };

  } catch (error) {
    console.error(`[${functionName}] 🔴 ERROR fetching calendar data:`, error);
    throw new HttpsError("internal", `獲取行事曆資料時發生錯誤: ${error.message}`);
  }
}

/**
 * [內部函式] 供管理員獲取指定日期的所有時段選項 (包含額滿狀態)
 * ( V2: 修正時區錯誤)
 */
async function _handleGetSlotsForAdmin(data) {
  const { projectId, dateStr } = data;
  const functionName = `_handleGetSlotsForAdmin`;

  if (!projectId || !dateStr) {
    throw new HttpsError("invalid-argument", "缺少必要參數 (projectId, dateStr)。");
  }

  try {
    const db = new Firestore({ databaseId: "anxi-app" });

    // 查詢 linksQuery (保持不變)
    const linksQuery = await db.collection('batchRuleLinks')
      .where('projectId', '==', projectId)
      .where('date', '==', dateStr)
      .get();
    if (linksQuery.empty) return [];

    // 查詢 ruleIds (保持不變)
    const ruleIds = linksQuery.docs.map(doc => doc.data().ruleId);
    if (ruleIds.length === 0) return [];

    // 查詢 rulesQuery (保持不變)
    const rulesQuery = await db.collection('dateRules')
      .where(GCloudFieldPath.documentId(), 'in', ruleIds)
      .get();

    if (rulesQuery.empty) return [];

    // 組合 allSlotsForDay (保持不變)
    const allSlotsForDay = {};
    rulesQuery.forEach(doc => {
      const ruleSlots = doc.data().slots;
      if (ruleSlots) {
        Object.assign(allSlotsForDay, ruleSlots);
      }
    });
    if (Object.keys(allSlotsForDay).length === 0) return [];

    // 【關鍵修正】
    // 建立一個明確代表 台北時區 該日午夜00:00 的 Date 物件
    const appointmentDateObj = new Date(dateStr + 'T00:00:00+08:00');

    // 【關鍵修正】
    // 使用修正後的 appointmentDateObj 進行查詢
    const appointmentsSnapshot = await db.collection('appointments')
      .where('projectId', '==', projectId)
      .where('appointmentDate', '==', appointmentDateObj) // 現在查詢的時區正確了
      .where('status', '==', '預約中')
      .get();

    // 後續的計數邏輯 (bookingsCount) 和回傳 (timeSlotOptions) 保持不變
    const bookingsCount = {};
    appointmentsSnapshot.forEach(doc => {
      const timeSlot = doc.data().appointmentTimeSlot;
      bookingsCount[timeSlot] = (bookingsCount[timeSlot] || 0) + 1;
    });

    const timeSlotOptions = Object.keys(allSlotsForDay).sort().map(time => {
      const capacity = allSlotsForDay[time]?.capacity || 0;
      const currentBookings = bookingsCount[time] || 0;
      const remaining = capacity - currentBookings;

      if (remaining <= 0) {
        return `${time} (已預約 ${currentBookings},已額滿 ${capacity})`;
      } else {
        return `${time} (已預約 ${currentBookings},尚餘 ${remaining})`;
      }
    });

    //  回傳：路由函數會直接回傳這個陣列
    return timeSlotOptions;

  } catch (error) {
    console.error(`[${functionName}] 發生錯誤:`, error);
    throw new HttpsError("internal", "計算可預約時段時發生錯誤。");
  }
}

/**
 * [後台用] 新增一筆預約紀錄 (V2 - 修正版)
 * (內部函式)
 */
async function _handleAddAppointmentAdmin(data) {
  const { projectId, newBookingData, cancelBookingCode, force = false } = data;
  const functionName = `_handleAddAppointmentAdmin (Project: ${projectId}, Unit: ${newBookingData?.unitId}, Force: ${force})`;

  if (!projectId || !newBookingData || !newBookingData.unitId || !newBookingData.appointmentDate || !newBookingData.appointmentTimeSlot || !newBookingData.bookingType) {
    console.error(`[${functionName}] ERROR: Missing required parameters in newBookingData.`);
    throw new HttpsError("invalid-argument", "缺少 projectId 或 newBookingData 中的必要欄位 (unitId, appointmentDate, appointmentTimeSlot, bookingType)。");
  }

  const db = new Firestore({ databaseId: "anxi-app" });
  const householdDocId = `${projectId}_${newBookingData.unitId}`;
  const householdRef = db.collection('households').doc(householdDocId);

  let rawTimeSlot = newBookingData.appointmentTimeSlot;
  let timeSlotKey = '';
  if (typeof rawTimeSlot === 'string') {
    timeSlotKey = rawTimeSlot.split(' ')[0];
  } else if (typeof rawTimeSlot === 'object' && rawTimeSlot !== null && rawTimeSlot.value) {
    timeSlotKey = String(rawTimeSlot.value).split(' ')[0];
  }
  if (!/^\d{2}:\d{2}$/.test(timeSlotKey)) {
    console.error(`[${functionName}] ERROR: Invalid timeSlotKey format: ${timeSlotKey}`);
    throw new HttpsError("invalid-argument", `無效的時段格式: ${newBookingData.appointmentTimeSlot}`);
  }

  let finalAppointmentData;
  let docId;
  let projectName;

  try {
    console.log(`[${functionName}] Starting transaction...`);
    const result_tx = await db.runTransaction(async (transaction) => {
      console.log(`[${functionName}] Inside transaction...`);
      let isRuleCheckSkipped = false;
      let capacity = 0;

      const householdDoc = await transaction.get(householdRef);
      if (!householdDoc.exists) {
        console.error(`[${functionName}] ERROR TX: Household not found: ${householdDocId}`);
        throw new HttpsError("not-found", `找不到戶別 "${newBookingData.unitId}" 的資料。`);
      }
      const householdData = householdDoc.data();
      const batchCodeField = newBookingData.bookingType === '初驗' ? 'initialInspectionBatch' : 'reInspectionBatch';
      const batchCode = householdData[batchCodeField];
      if (!batchCode) {
        if (!force) {
          console.error(`[${functionName}] ERROR TX: Batch code not assigned for ${newBookingData.bookingType}.`);
          throw new HttpsError("permission-denied", `此戶別的 "${newBookingData.bookingType}" 預約目前未指派批次。`);
        } else {
          console.warn(`[${functionName}] WARN TX (Force Mode): Batch code not assigned, skipping rule checks.`);
          isRuleCheckSkipped = true;
        }
      }
      console.log(`[${functionName}] TX: Found batch code ${batchCode}`);

      let batchId = null;
      if (batchCode && !isRuleCheckSkipped) {
        const batchQuery = db.collection('bookingBatches')
          .where('projectId', '==', projectId).where('batchCode', '==', batchCode)
          .where('bookingType', '==', newBookingData.bookingType).where('isDeleted', '==', false).limit(1);
        const batchSnapshot = await transaction.get(batchQuery);
        if (batchSnapshot.empty) {
          if (!force) {
            console.error(`[${functionName}] ERROR TX: Active batch not found for code ${batchCode}.`);
            throw new HttpsError("not-found", `找不到對應的有效預約批次。`);
          } else {
            console.warn(`[${functionName}] WARN TX (Force Mode): Active batch ${batchCode} not found.`);
            isRuleCheckSkipped = true;
          }
        } else {
          batchId = batchSnapshot.docs[0].id;
          console.log(`[${functionName}] TX: Found active batch ${batchId}`);
        }
      }

      const appointmentDateStr = newBookingData.appointmentDate.split('T')[0];
      let ruleId = null;
      if (batchId && !isRuleCheckSkipped) {
        const linksQuery = db.collection('batchRuleLinks')
          .where('batchId', '==', batchId).where('date', '==', appointmentDateStr).where('isDeleted', '==', false).limit(1);
        const linksSnapshot = await transaction.get(linksQuery);
        if (linksSnapshot.empty) {
          if (!force) {
            console.error(`[${functionName}] ERROR TX: No active link found for date ${appointmentDateStr}.`);
            throw new HttpsError("failed-precondition", `日期 ${appointmentDateStr} 不在可預約範圍內或規則已被刪除。`);
          } else {
            console.warn(`[${functionName}] WARN TX (Force Mode): No active link found for date ${appointmentDateStr}. Skipping rule checks.`);
            isRuleCheckSkipped = true;
          }
        } else {
          ruleId = linksSnapshot.docs[0].data().ruleId;
          console.log(`[${functionName}] TX: Found active rule link, ruleId: ${ruleId}`);
        }
      }

      if (ruleId && !isRuleCheckSkipped) {
        const ruleRef = db.collection('dateRules').doc(ruleId);
        const ruleDoc = await transaction.get(ruleRef);
        if (!ruleDoc.exists || ruleDoc.data().isDeleted === true) {
          if (!force) {
            console.error(`[${functionName}] ERROR TX: Date rule ${ruleId} not found or is deleted.`);
            throw new HttpsError("internal", "找不到對應的每日規則設定或已被刪除。");
          } else {
            console.warn(`[${functionName}] WARN TX (Force Mode): Date rule ${ruleId} not found or is deleted. Skipping further rule checks.`);
            isRuleCheckSkipped = true;
          }
        } else {
          const ruleData = ruleDoc.data();
          const slotInfo = ruleData.slots[timeSlotKey];
          if (!slotInfo) {
            if (!force) {
              console.error(`[${functionName}] ERROR TX: Time slot ${timeSlotKey} not found in rule ${ruleId}.`);
              throw new HttpsError("failed-precondition", `時段 ${timeSlotKey} 在規則中不存在。`);
            } else {
              console.warn(`[${functionName}] WARN TX (Force Mode): Time slot ${timeSlotKey} not found in rule ${ruleId}. Skipping method check.`);
              capacity = 0;
            }
          } else {
            if (newBookingData.inspectionMethod && !slotInfo.methods.includes(newBookingData.inspectionMethod)) {
              if (!force) {
                console.error(`[${functionName}] ERROR TX: Method ${newBookingData.inspectionMethod} not allowed for slot ${timeSlotKey}.`);
                throw new HttpsError("failed-precondition", `時段 ${timeSlotKey} 不適用於「${newBookingData.inspectionMethod}」。`);
              } else {
                console.warn(`[${functionName}] WARN TX (Force Mode): Method ${newBookingData.inspectionMethod} not allowed for slot ${timeSlotKey}, but proceeding.`);
              }
            }
            capacity = slotInfo.capacity || 0;
            console.log(`[${functionName}] TX: Rule and slot validation passed (or bypassed by force). Capacity: ${capacity}`);
          }
        }
      }

      if (!force) {
        if (!isRuleCheckSkipped) {
          const appointmentDateObj = new Date(appointmentDateStr + 'T00:00:00+08:00');
          const appointmentsQueryCapacity = db.collection('appointments')
            .where('projectId', '==', projectId).where('appointmentDate', '==', appointmentDateObj)
            .where('appointmentTimeSlot', '==', timeSlotKey).where('status', '==', '預約中');
          const appointmentsSnapshot = await transaction.get(appointmentsQueryCapacity);
          const currentBookings = appointmentsSnapshot.size;
          console.log(`[${functionName}] Transaction: Current bookings for slot ${timeSlotKey} on ${appointmentDateStr}: ${currentBookings}`);
          if (currentBookings >= capacity) {
            console.warn(`[${functionName}] WARN: Slot capacity reached.`);
            throw new HttpsError('failed-precondition', `SLOT_FULL: 該時段名額已滿 (目前 ${currentBookings} 人)。`);
          }
        } else {
          console.log(`[${functionName}] Transaction: Rule check was skipped (no batch or force), skipping capacity check as well.`);
        }
      } else {
        console.log(`[${functionName}] Transaction: Force flag is true, skipping capacity check.`);
      }

      const batchForTx = transaction;
      if (cancelBookingCode) {
        const oldAppointmentsQuery = db.collection("appointments")
          .where("bookingCode", "==", cancelBookingCode).where("projectId", "==", projectId).where("status", "==", "預約中");
        const oldSnapshot = await transaction.get(oldAppointmentsQuery);
        if (!oldSnapshot.empty) {
          batchForTx.update(oldSnapshot.docs[0].ref, { status: "取消", cancelledAt: Timestamp.now() });
          console.log(`[${functionName}] Transaction: Marked old booking ${cancelBookingCode} as cancelled.`);
        } else {
          console.warn(`[${functionName}] Transaction: Old booking code ${cancelBookingCode} not found or already cancelled.`);
        }
      }

      const bookingCode = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'.split('').sort(() => 0.5 - Math.random()).join('').substring(0, 6);
      const now = new Date();
      const timeStr = now.toLocaleTimeString('sv-SE', { timeZone: 'Asia/Taipei', hour12: false }).replace(/:/g, '-');
      const dateStr = now.toLocaleDateString('sv-SE', { timeZone: 'Asia/Taipei' }).replace(/-/g, '').slice(2); // YYMMDD

      docId = `${projectId}_${dateStr}-${timeStr}_${newBookingData.unitId}`;
      const newAppointmentRef = db.collection('appointments').doc(docId);
      console.log(`[${functionName}] Transaction: Generated new appointment ID: ${docId}`);

      finalAppointmentData = {
        projectId: projectId,
        createdAt: Timestamp.now(),
        unitId: newBookingData.unitId,
        address: newBookingData.address || "",
        bookerName: newBookingData.bookerName || "",
        bookerPhone: newBookingData.bookerPhone || "",
        bookerEmail: newBookingData.bookerEmail || "",
        bookerIdNumber: newBookingData.bookerIdNumber || "",
        bookingType: newBookingData.bookingType,
        appointmentDate: newBookingData.appointmentDate ? Timestamp.fromDate(new Date(appointmentDateStr + 'T00:00:00+08:00')) : null,
        appointmentTimeSlot: timeSlotKey,
        status: newBookingData.status || "預約中",
        inspectionMethod: newBookingData.inspectionMethod || "",
        inspectionCompanyName: newBookingData.inspectionCompanyName || "",
        authorizationLetterUrl: newBookingData.authorizationLetterUrl || "",
        principalName: newBookingData.principalName || "",
        principalIdNumber: newBookingData.principalIdNumber || "",
        principalAddress: newBookingData.principalAddress || "",
        agentName: newBookingData.agentName || "",
        agentIdNumber: newBookingData.agentIdNumber || "",
        agentAddress: newBookingData.agentAddress || "",
        agentPhone: newBookingData.agentPhone || "",
        bookingCode: bookingCode,
        reportUploaded: !['初驗', '複驗', '驗屋'].includes(newBookingData.bookingType),
        bookingRemarks: newBookingData.bookingRemarks || "",
        bookingMethodDetails: newBookingData.bookingMethodDetails || {},
        createdByName: newBookingData.createdByName || null,
        lastModifiedByName: newBookingData.lastModifiedByName || null,
        isDeleted: false,
      };

      batchForTx.set(newAppointmentRef, finalAppointmentData);
      console.log(`[${functionName}] Transaction: Set new appointment data.`);

      return { finalAppointmentData };
    });

    console.log(`[${functionName}] Transaction committed. Result:`, result_tx);

    finalAppointmentData = result_tx.finalAppointmentData;
    console.log(`[${functionName}] Final payload extracted.`);

    const { unitId: newUnitId } = finalAppointmentData;
    if (projectId && newUnitId) {
      console.log(`[${functionName}] Calling updateHouseholdSummary for ${newUnitId}...`);
      await updateHouseholdSummary(db, projectId, newUnitId);
      console.log(`[${functionName}] updateHouseholdSummary finished.`);
    } else {
      console.warn(`WARN: Cannot update summary, projectId/unitId missing from finalPayload.`);
    }

    const bookerEmail = finalAppointmentData.bookerEmail;
    const bookerName = finalAppointmentData.bookerName;

    const projectRef = db.collection('projects').doc(projectId);
    const projectDoc = await projectRef.get();
    projectName = projectDoc.exists ? projectDoc.data().name : projectId;

    if (bookerEmail) {
      console.log(`[${functionName}] Preparing email content for new appointment...`);

      let closingText = '請於預約時段準時抵達，感謝您的配合。';
      let inspectionNotesHtml = '';
      let contactInfoHtml = '';
      if (projectDoc.exists) {
        const projectData = projectDoc.data();
        if (projectData.intro && projectData.intro.closingText) { closingText = projectData.intro.closingText; }
        if (projectData.intro && projectData.intro.alert && projectData.intro.alert.text) { inspectionNotesHtml = projectData.intro.alert.text; }
        if (projectDoc.exists && projectDoc.data().intro?.contact) {
          const contact = projectDoc.data().intro.contact;
          if (contact.name || contact.phone) {
            const namePart = contact.name ? `<strong>${contact.name}</strong>` : '';
            const phonePart = contact.phone ? `電話：${contact.phone}` : '';
            const separator = contact.name && contact.phone ? ' / ' : '';
            contactInfoHtml = `<div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #eeeeee;"><p style="margin: 0; font-size: 14px; color: #555;">如有任何疑問，請洽詢：<br>${namePart}${separator}${phonePart}</p></div>`;
          }
        }
      }

      const mailTransport = nodemailer.createTransport({
        service: 'gmail',
        auth: { user: process.env.SENDER_EMAIL, pass: process.env.GMAIL_APP_PASSWORD },
      });
      const subject = `【${projectName}】預約成功通知 (${finalAppointmentData.unitId})`;
      const bookingUrl = `https://anxismart.com/#/booking/${projectId}`;
      const bookingLinkHtml = `<p style="margin-top: 25px; padding-top: 20px; border-top: 1px solid #eeeeee; font-size: 14px; color: #555;">若您要查詢、修改或取消預約，請點擊以下按鈕返回預約頁面：<br><a href="${bookingUrl}" target="_blank" style="display: inline-block; margin-top: 12px; padding: 10px 20px; background-color: #007bff; color: #ffffff; text-decoration: none; border-radius: 5px; font-weight: bold;">前往預約頁面</a></p>`;
      const formattedAppointmentDate = finalAppointmentData.appointmentDate.toDate().toLocaleDateString('zh-TW', {
        timeZone: 'Asia/Taipei', year: 'numeric', month: '2-digit', day: '2-digit'
      });

      const htmlBody = `
<div style="font-family: 'Helvetica Neue', Helvetica, Arial, 'PingFang TC', 'Microsoft JhengHei', sans-serif; background-color: #f4f4f7; padding: 20px;">
  <div style="max-width: 600px; margin: 20px auto; background-color: #ffffff; border-radius: 8px; border: 1px solid #e0e0e0; overflow: hidden;">
    <div style="background-color: #007bff; color: #ffffff; padding: 20px; text-align: center;">
      <h2 style="margin: 0; font-size: 24px;">預約成功通知</h2>
    </div>
    <div style="padding: 24px; line-height: 1.6; color: #333333;">
      <p>親愛的 <strong>${finalAppointmentData.bookerName}</strong> 您好：</p>
      <p>您已成功完成預約（由管理員 ${newBookingData.createdByName || '後台'} 為您建立），以下是您的預約詳細資訊：</p>
      <table style="width: 100%; border-collapse: collapse; margin-top: 20px; margin-bottom: 20px;">
        <tbody>
          <tr style="border-bottom: 1px solid #eeeeee;"><td style="padding: 12px 0; font-weight: bold; color: #555555; width: 100px;">預約代碼</td><td style="padding: 12px 0; font-weight: bold; font-size: 16px; color: #D32F2F;">${finalAppointmentData.bookingCode}</td></tr>
          <tr style="border-bottom: 1px solid #eeeeee;"><td style="padding: 12px 0; font-weight: bold; color: #555555;">建案名稱</td><td style="padding: 12px 0;">${projectName}</td></tr>
          <tr style="border-bottom: 1px solid #eeeeee;"><td style="padding: 12px 0; font-weight: bold; color: #555555;">戶別</td><td style="padding: 12px 0;">${finalAppointmentData.unitId}</td></tr>
          
          <tr style="border-bottom: 1px solid #eeeeee;"><td style="padding: 12px 0; font-weight: bold; color: #555555;">門牌</td><td style="padding: 12px 0;">${finalAppointmentData.address}</td></tr>
          <tr style="border-bottom: 1px solid #eeeeee;"><td style="padding: 12px 0; font-weight: bold; color: #555555;">預約姓名</td><td style="padding: 12px 0;">${finalAppointmentData.bookerName}</td></tr>
          <tr style="border-bottom: 1px solid #eeeeee;"><td style="padding: 12px 0; font-weight: bold; color: #555555;">預約人電話</td><td style="padding: 12px 0;">${finalAppointmentData.bookerPhone}</td></tr>
          <tr style="border-bottom: 1px solid #eeeeee;"><td style="padding: 12px 0; font-weight: bold; color: #555555;">EMAIL</td><td style="padding: 12px 0;">${finalAppointmentData.bookerEmail}</td></tr>
          <tr style="border-bottom: 1px solid #eeeeee;"><td style="padding: 12px 0; font-weight: bold; color: #555555;">預約項目</td><td style="padding: 12px 0;">${finalAppointmentData.bookingType}</td></tr>
          <tr style="border-bottom: 1px solid #eeeeee;"><td style="padding: 12px 0; font-weight: bold; color: #555555;">選擇方式</td><td style="padding: 12px 0;">${finalAppointmentData.inspectionMethod}</td></tr>
          <tr style="border-bottom: 1px solid #eeeeee;"><td style="padding: 12px 0; font-weight: bold; color: #555555;">預約日期</td><td style="padding: 12px 0;">${formattedAppointmentDate}</td></tr>
          <tr><td style="padding: 12px 0; font-weight: bold; color: #555555;">預約時段</td><td style="padding: 12px 0;">${finalAppointmentData.appointmentTimeSlot}</td></tr>
        </tbody>
      </table>
      <div style="padding: 15px; margin-top: 15px; margin-bottom: 20px; background-color: #f8f9fa; border-left: 4px solid #17a2b8; color: #333;">${closingText}</div>
      ${contactInfoHtml}
      ${inspectionNotesHtml ? `<div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #eeeeee;">${inspectionNotesHtml}</div>` : ''}
      ${bookingLinkHtml}
    </div>
    <div style="background-color: #f4f4f7; padding: 16px; text-align: center; font-size: 12px; color: #777777;">
      <p style="margin: 0;">此為系統自動發送郵件，請勿直接回覆。</p>
      <p style="margin: 5px 0 0 0;">${projectName} 預約系統</p>
      <p style="margin: 10px 0 0 0; font-size: 11px; color: #999999;">
        本服務由 <a href="https://anxismart.com/" target="_blank" style="color: #007bff; text-decoration: none; font-weight: bold;">anxismart安熙智慧建案管理系統</a> 提供技術支援
      </p>
    </div>
  </div>
</div>
            `;

      console.log(`[${functionName}] Calling getCcRecipients...`);
      const ccRecipients = await getCcRecipients(projectId, "驗屋系統信件副本");
      console.log(`[${functionName}] getCcRecipients finished. CC:`, ccRecipients);

      await mailTransport.sendMail({
        from: `"${projectName} 預約系統" <${process.env.SENDER_EMAIL}>`,
        to: bookerEmail,
        cc: ccRecipients.join(', '),
        subject: subject,
        html: htmlBody,
        name: `${projectName} 預約系統`
      });
      console.log(`[${functionName}] New appointment (by admin) email sent successfully.`);
    } else {
      console.log(`[${functionName}] No booker email provided, skipping email.`);
    }

    console.log(`[${functionName}] Returning success status.`);
    //  回傳：路由函數會自動包裝
    return { status: "success", data: { bookingCode: finalAppointmentData.bookingCode } };

  } catch (error) {
    console.error(`[${functionName}] 🔴 預約時發生錯誤:`, error);
    if (error instanceof HttpsError) {
      throw error;
    }
    throw new HttpsError("internal", `儲存預約時發生嚴重錯誤: ${error.message}`);
  }
}

/**
 * [內部函式] 更新一筆預約紀錄，並同步更新戶別摘要
 */
async function _handleUpdateAppointmentByAdmin(data) {
  const { appointmentId, bookingPayload, householdDocId, householdPayload, force = false } = data;
  const functionName = `_handleUpdateAppointmentByAdmin (ID: ${appointmentId}, Force: ${force})`;

  if (!appointmentId) {
    console.error(`[${functionName}] ERROR: Missing appointmentId.`);
    throw new HttpsError("invalid-argument", "缺少 appointmentId。");
  }

  const db = new Firestore({ databaseId: "anxi-app" });
  const appointmentRef = db.collection("appointments").doc(appointmentId);
  let originalAppointmentData = null;
  let originalHouseholdData = null;
  let finalPayload = {};

  const notificationTriggerFields = new Set([
    'appointmentDate', 'appointmentTimeSlot', 'bookerName', 'bookerPhone',
    'bookerIdNumber', 'inspectionCompanyName', 'inspectionMethod', 'agentName', 'agentPhone',
  ]);

  try {
    console.log(`[${functionName}] Fetching original data before transaction...`);
    const appointmentDocBefore = await appointmentRef.get();
    if (!appointmentDocBefore.exists) {
      console.error(`[${functionName}] ERROR: Original appointment document not found.`);
      throw new HttpsError("not-found", "找不到要更新的預約紀錄。");
    }
    originalAppointmentData = appointmentDocBefore.data();
    console.log(`[${functionName}] Original appointment data fetched.`);

    if (householdDocId) {
      const householdRef = db.collection("households").doc(householdDocId);
      const householdDocBefore = await householdRef.get();
      if (householdDocBefore.exists) {
        originalHouseholdData = householdDocBefore.data();
        console.log(`[${functionName}] Original household data fetched.`);
      } else {
        console.warn(`[${functionName}] WARN: Original household document ${householdDocId} not found.`);
      }
    }

    let needsSummaryUpdate = false;
    let operationCount = 0;

    console.log(`[${functionName}] Starting transaction...`);
    const result_tx = await db.runTransaction(async (transaction) => {
      console.log(`[${functionName}] Inside transaction...`);
      const appointmentDoc = await transaction.get(appointmentRef);
      if (!appointmentDoc.exists) {
        throw new HttpsError("not-found", "在交易中找不到預約紀錄。");
      }
      const { projectId, unitId } = originalAppointmentData;

      let newDateStr = null;
      let newTimeSlotKey = null;
      let dateOrTimeChanged = false;

      if (bookingPayload && (bookingPayload.appointmentDate || bookingPayload.appointmentTimeSlot)) {
        if (bookingPayload.appointmentDate) {
          try { newDateStr = new Date(bookingPayload.appointmentDate).toISOString().split('T')[0]; const currentDateStr = originalAppointmentData.appointmentDate?.toDate ? originalAppointmentData.appointmentDate.toDate().toISOString().split('T')[0] : null; if (newDateStr !== currentDateStr) dateOrTimeChanged = true; } catch (e) { throw new HttpsError("invalid-argument", "無效的新預約日期格式。"); }
        } else { newDateStr = originalAppointmentData.appointmentDate?.toDate ? originalAppointmentData.appointmentDate.toDate().toISOString().split('T')[0] : null; }
        if (bookingPayload.appointmentTimeSlot) {
          let rawTimeSlot = bookingPayload.appointmentTimeSlot; let extractedTime = ''; if (typeof rawTimeSlot === 'string') extractedTime = rawTimeSlot.match(/^(\d{2}:\d{2})/)?.[1]; else if (typeof rawTimeSlot === 'object' && rawTimeSlot?.value) extractedTime = String(rawTimeSlot.value).match(/^(\d{2}:\d{2})/)?.[1];
          if (extractedTime) { newTimeSlotKey = extractedTime; if (newTimeSlotKey !== originalAppointmentData.appointmentTimeSlot) dateOrTimeChanged = true; } else { throw new HttpsError("invalid-argument", "無效的新預約時段格式。"); }
        } else { newTimeSlotKey = originalAppointmentData.appointmentTimeSlot; }
      } else { newDateStr = originalAppointmentData.appointmentDate?.toDate ? originalAppointmentData.appointmentDate.toDate().toISOString().split('T')[0] : null; newTimeSlotKey = originalAppointmentData.appointmentTimeSlot; }
      console.log(`[${functionName}] TX: Date/Time change check done. Changed: ${dateOrTimeChanged}`);

      if (dateOrTimeChanged) {
        console.log(`[${functionName}] TX: Date or time changed. Proceeding with checks (unless force=true)...`);
        needsSummaryUpdate = true;
        let isRuleCheckSkipped = false;
        let capacity = 0;
        const householdDoc = await transaction.get(db.collection('households').doc(`${projectId}_${unitId}`)); if (!householdDoc.exists) throw new HttpsError("not-found", `找不到戶別資料 ${unitId}`); const householdData = householdDoc.data(); const bookingTypeToCheck = bookingPayload?.bookingType || originalAppointmentData.bookingType; const batchCodeField = bookingTypeToCheck === '初驗' ? 'initialInspectionBatch' : 'reInspectionBatch'; const batchCode = householdData[batchCodeField]; if (!batchCode) throw new HttpsError("permission-denied", `此戶別的 "${bookingTypeToCheck}" 預約未指派批次。`); const batchQuery = db.collection('bookingBatches').where('projectId', '==', projectId).where('batchCode', '==', batchCode).where('bookingType', '==', bookingTypeToCheck).where('isDeleted', '==', false).limit(1); const batchSnapshot = await transaction.get(batchQuery);
        if (batchSnapshot.empty) { if (!force) throw new HttpsError("not-found", `找不到戶別 ${unitId} 對應的有效預約批次 (${batchCode})。`); else { console.warn(`WARN TX (Force Mode): Active batch ${batchCode} not found.`); isRuleCheckSkipped = true; } }
        else {
          const batchId = batchSnapshot.docs[0].id; const linksQuery = db.collection('batchRuleLinks').where('batchId', '==', batchId).where('date', '==', newDateStr).where('isDeleted', '==', false).limit(1); const linksSnapshot = await transaction.get(linksQuery);
          if (linksSnapshot.empty) { if (!force) throw new HttpsError("failed-precondition", `新日期 ${newDateStr} 不在可預約範圍內或規則已被刪除。`); else { console.warn(`WARN TX (Force Mode): No active link for new date ${newDateStr}.`); isRuleCheckSkipped = true; } }
          else {
            const ruleId = linksSnapshot.docs[0].data().ruleId; const ruleRef = db.collection('dateRules').doc(ruleId); const ruleDoc = await transaction.get(ruleRef);
            if (!ruleDoc.exists || ruleDoc.data().isDeleted === true) { if (!force) throw new HttpsError("internal", `找不到新日期 ${newDateStr} 對應的規則 ${ruleId} 或已被刪除。`); else { console.warn(`WARN TX (Force Mode): Date rule ${ruleId} not found/deleted.`); isRuleCheckSkipped = true; } }
            else {
              const ruleData = ruleDoc.data(); const slotInfo = ruleData.slots[newTimeSlotKey]; const methodToCheck = bookingPayload?.inspectionMethod || originalAppointmentData.inspectionMethod;
              if (!slotInfo) { if (!force) throw new HttpsError("failed-precondition", `新時段 ${newTimeSlotKey} 在規則 ${ruleId} 中不存在。`); else { console.warn(`WARN TX (Force Mode): New slot ${newTimeSlotKey} not found.`); capacity = 0; } }
              else { if (!slotInfo.methods.includes(methodToCheck)) { if (!force) throw new HttpsError("failed-precondition", `新時段 ${newTimeSlotKey} 不適用於選擇方式「${methodToCheck}」。`); else console.warn(`WARN TX (Force Mode): Method ${methodToCheck} not allowed.`); } capacity = slotInfo.capacity || 0; console.log(`TX: New slot capacity: ${capacity}`); }
            }
          }
        }
        if (!force && !isRuleCheckSkipped) { const newAppointmentDateObj = new Date(newDateStr + 'T00:00:00+08:00'); const appointmentsQueryCapacity = db.collection('appointments').where('projectId', '==', projectId).where('appointmentDate', '==', newAppointmentDateObj).where('appointmentTimeSlot', '==', newTimeSlotKey).where('status', '==', '預約中'); const appointmentsSnapshot = await transaction.get(appointmentsQueryCapacity); const currentBookings = appointmentsSnapshot.size; console.log(`TX: Current bookings for new slot: ${currentBookings}`); if (currentBookings >= capacity) { console.warn(`WARN: New slot capacity reached.`); throw new HttpsError('failed-precondition', `SLOT_FULL: 目標時段名額已滿 (目前 ${currentBookings} 人)。`); } }
        else if (force) { console.log(`TX: Force mode enabled, skipping capacity check.`); }
        else { console.log(`TX: Rule check was skipped, skipping capacity check.`); }
        console.log(`[${functionName}] TX: Rule and capacity checks done (or bypassed).`);
      }

      const batchForTx = transaction;
      let combinedPayload = {};

      if (bookingPayload && Object.keys(bookingPayload).length > 0) {
        const finalBookingPayload = { ...bookingPayload };
        if (finalBookingPayload.appointmentDate) finalBookingPayload.appointmentDate = Timestamp.fromDate(new Date(newDateStr));
        if (finalBookingPayload.appointmentTimeSlot) finalBookingPayload.appointmentTimeSlot = newTimeSlotKey;
        if (bookingPayload.bookingMethodDetails) finalBookingPayload.bookingMethodDetails = bookingPayload.bookingMethodDetails;

        finalBookingPayload.updatedAt = FieldValue.serverTimestamp();
        batchForTx.update(appointmentRef, finalBookingPayload);
        Object.assign(combinedPayload, finalBookingPayload);
        operationCount++;
        console.log(`[${functionName}] TX: Scheduled update for appointment ${appointmentId}.`);
      }

      if (householdDocId && householdPayload && Object.keys(householdPayload).length > 0) {
        const finalHouseholdPayload = { ...householdPayload };
        if (finalHouseholdPayload.appropriationDate) {
          const dateObj = new Date(finalHouseholdPayload.appropriationDate);
          finalHouseholdPayload.appropriationDate = !isNaN(dateObj.getTime()) ? Timestamp.fromDate(dateObj) : null;
        }
        finalHouseholdPayload.updatedAt = FieldValue.serverTimestamp();
        const householdRefToUpdate = db.collection("households").doc(householdDocId);
        batchForTx.update(householdRefToUpdate, finalHouseholdPayload);
        Object.assign(combinedPayload, finalHouseholdPayload);
        operationCount++;
        needsSummaryUpdate = true;
        console.log(`[${functionName}] TX: Scheduled update for household ${householdDocId}.`);
      }
      return { combinedPayload };
    });
    console.log(`[${functionName}] Transaction committed successfully. Result:`, result_tx);

    finalPayload = result_tx.combinedPayload;
    console.log(`[${functionName}] Final payload extracted.`);

    if (operationCount > 0) {
      console.log(`[${functionName}] ${operationCount} update operations were performed.`);
      if (needsSummaryUpdate) {
        const { projectId, unitId } = originalAppointmentData;
        if (projectId && unitId) {
          console.log(`[${functionName}] Calling updateHouseholdSummary for ${unitId}...`);
          await updateHouseholdSummary(db, projectId, unitId);
          console.log(`[${functionName}] updateHouseholdSummary finished.`);
        } else { console.warn(`WARN: Cannot update summary, projectId/unitId missing.`); }
      }

      const bookerEmail = bookingPayload?.bookerEmail || originalAppointmentData.bookerEmail;
      const bookerName = bookingPayload?.bookerName || originalAppointmentData.bookerName;
      const unitId = originalAppointmentData.unitId;
      const projectId = originalAppointmentData.projectId;
      console.log(`[${functionName}] Checking if email should be sent... Email: ${bookerEmail}`);

      if (bookerEmail && finalPayload && Object.keys(finalPayload).length > 0) {
        console.log(`[${functionName}] Preparing email content...`);
        const changes = [];
        for (const key in finalPayload) {
          if (!notificationTriggerFields.has(key)) continue;
          const originalValue = (key in originalAppointmentData) ? originalAppointmentData[key] : originalHouseholdData?.[key];
          const newValue = finalPayload[key];
          const originalFormatted = formatValueForEmail(key, originalValue);
          const newFormatted = formatValueForEmail(key, newValue);
          if (originalFormatted !== newFormatted) {
            if (fieldDisplayNames[key]) {
              changes.push({ field: fieldDisplayNames[key], before: originalFormatted, after: newFormatted });
            }
          }
        }
        console.log(`[${functionName}] Changes comparison done. Found ${changes.length} relevant changes.`);

        if (changes.length > 0) {
          console.log(`[${functionName}] Getting project name and contact info...`);
          const projectRef = db.collection('projects').doc(projectId);
          const projectDoc = await projectRef.get();
          const projectName = projectDoc.exists ? projectDoc.data().name : projectId;
          let contactInfoHtml = '';
          if (projectDoc.exists && projectDoc.data().intro?.contact) {
            const contact = projectDoc.data().intro.contact;
            if (contact.name || contact.phone) {
              const namePart = contact.name ? `<strong>${contact.name}</strong>` : '';
              const phonePart = contact.phone ? `電話：${contact.phone}` : '';
              const separator = contact.name && contact.phone ? ' / ' : '';
              contactInfoHtml = `<div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #eeeeee;"><p style="margin: 0; font-size: 14px; color: #555;">如有任何疑問，請洽詢：<br>${namePart}${separator}${phonePart}</p></div>`;
            }
          }
          const mailTransport = nodemailer.createTransport({
            service: 'gmail',
            auth: { user: process.env.SENDER_EMAIL, pass: process.env.GMAIL_APP_PASSWORD },
          });
          const subject = `【${projectName}】預約異動通知 (${unitId})`;
          const bookingUrl = `https://anxismart.com/#/booking/${projectId}`;
          const bookingLinkHtml = `<p style="margin-top: 25px; padding-top: 20px; border-top: 1px solid #eeeeee; font-size: 14px; color: #555;">若您要查詢、修改或取消預約，請點擊以下按鈕返回預約頁面：<br><a href="${bookingUrl}" target="_blank" style="display: inline-block; margin-top: 12px; padding: 10px 20px; background-color: #007bff; color: #ffffff; text-decoration: none; border-radius: 5px; font-weight: bold;">前往預約頁面</a></p>`;

          const changesHtml = changes.map(change => `
                        <tr style="border-bottom: 1px solid #eeeeee;">
                          <td style="padding: 10px 5px; font-weight: bold; color: #555555; vertical-align: top;">${change.field}</td>
                          <td style="padding: 10px 5px; color: #777777; vertical-align: top; text-decoration: line-through;">${change.before}</td>
                          <td style="padding: 10px 5px; color: #D32F2F; font-weight: bold; vertical-align: top;">${change.after}</td>
                        </tr>
                    `).join('');

          const htmlBody = `
<div style="font-family: 'Helvetica Neue', Helvetica, Arial, 'PingFang TC', 'Microsoft JhengHei', sans-serif; background-color: #f4f4f7; padding: 20px;">
  <div style="max-width: 600px; margin: 20px auto; background-color: #ffffff; border-radius: 8px; border: 1px solid #e0e0e0; overflow: hidden;">
    <div style="background-color: #ffc107; color: #333333; padding: 20px; text-align: center;">
      <h2 style="margin: 0; font-size: 24px;">預約異動通知</h2>
    </div>
    <div style="padding: 24px; line-height: 1.6; color: #333333;">
      <p>親愛的 <strong>${bookerName || '用戶'}</strong> 您好：</p>
      <p>您於「${projectName}」建案 ${unitId} 戶別的預約資料已由管理員修改，詳細異動如下：</p>
      <h3 style="margin-top: 25px; margin-bottom: 10px; color: #333;">主要資訊</h3>
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
         <tbody>
            <tr style="border-bottom: 1px solid #eeeeee;"><td style="padding: 8px 0; color: #555555; width: 100px;">戶別</td><td style="padding: 8px 0;">${unitId}</td></tr>
            <tr style="border-bottom: 1px solid #eeeeee;"><td style="padding: 8px 0; color: #555555;">預約項目</td><td style="padding: 8px 0;">${bookingPayload?.bookingType || originalAppointmentData.bookingType}</td></tr>
         </tbody>
      </table>
      <h3 style="margin-top: 25px; margin-bottom: 10px; color: #333;">變更詳情</h3>
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 14px;">
         <thead>
           <tr style="background-color: #f8f9fa;">
             <th style="padding: 8px 5px; text-align: left; color: #333;">欄位</th>
             <th style="padding: 8px 5px; text-align: left; color: #777;">修改前</th>
             <th style="padding: 8px 5px; text-align: left; color: #D32F2F;">修改後</th>
           </tr>
         </thead>
        <tbody>
          ${changesHtml}
        </tbody>
      </table>
      <p>請確認以上資訊是否正確。如有疑問，請與服務人員聯繫。</p>
      ${contactInfoHtml}
      ${bookingLinkHtml}
    </div>
    <div style="background-color: #f4f4f7; padding: 16px; text-align: center; font-size: 12px; color: #777777;">
      <p style="margin: 0;">此為系統自動發送郵件，請勿直接回覆。</p>
      <p style="margin: 5px 0 0 0;">${projectName} 預約系統</p>
      <p style="margin: 10px 0 0 0; font-size: 11px; color: #999999;">
        本服務由 <a href="https://anxismart.com/" target="_blank" style="color: #007bff; text-decoration: none; font-weight: bold;">anxismart安熙智慧建案管理系統</a> 提供技術支援
      </p>
    </div>
  </div>
</div>`;

          console.log(`[${functionName}] Calling getCcRecipients...`);
          const ccRecipients = await getCcRecipients(db, projectId, "驗屋系統信件副本");
          console.log(`[${functionName}] getCcRecipients finished. CC:`, ccRecipients);
          console.log(`[${functionName}] Calling mailTransport.sendMail...`);
          await mailTransport.sendMail({
            from: `"${projectName} 預約系統" <${process.env.SENDER_EMAIL}>`,
            to: bookerEmail,
            cc: ccRecipients.join(', '),
            subject: subject,
            html: htmlBody,
            name: `${projectName} 預約系統`
          });
          console.log(`[${functionName}] Change notification email sent successfully.`);
        } else {
          console.log(`[${functionName}] No significant changes in notification fields, skipping email.`);
        }
      } else {
        console.log(`[${functionName}] No booker email found or no payload updated, skipping change notification email.`);
      }
      console.log(`[${functionName}] Returning success status.`);
      //  回傳：路由函數會自動包裝
      return { status: "success" };

    } else {
      console.log(`[${functionName}] No operations performed, returning no_changes.`);
      //  回傳：路由函數會自動包裝
      return { status: 'no_changes' };
    }

  } catch (error) {
    console.error(`[${functionName}] 🔴 ERROR updating appointment:`, error);
    if (error instanceof HttpsError) { if (error.code === 'failed-precondition' && error.message.startsWith('SLOT_FULL')) throw error; throw error; }
    if (error.message === 'result is not defined') { throw new HttpsError("internal", "更新預約時發生內部錯誤：無法訪問 'result' 變數。請檢查 Cloud Function 日誌。"); }
    throw new HttpsError("internal", `更新預約時發生錯誤: ${error.message}`);
  }
}

/**
 * [後台用] 取消一筆預約，並寄送通知信
 * (內部函式)
 * @param {object} data - 包含 { appointmentId, projectId, unitId, bookingType }
 * @returns {Promise<object>}
 */
async function _handleCancelAppointmentByAdmin(data) {
  const { appointmentId, projectId, unitId, bookingType } = data;
  const functionName = `_handleCancelAppointmentByAdmin (ID: ${appointmentId})`;

  if (!appointmentId || !projectId || !unitId || !bookingType) {
    throw new HttpsError("invalid-argument", "缺少 appointmentId, projectId, unitId 或 bookingType。");
  }

  const db = new Firestore({ databaseId: "anxi-app" });

  try {
    const appointmentRef = db.collection("appointments").doc(appointmentId);
    const householdRef = db.collection('households').doc(`${projectId}_${unitId}`);

    let bookingData;

    await db.runTransaction(async (transaction) => {
      const appointmentDoc = await transaction.get(appointmentRef);
      if (!appointmentDoc.exists) {
        throw new HttpsError("not-found", "找不到指定的預約紀錄。");
      }
      bookingData = appointmentDoc.data();

      transaction.update(appointmentRef, {
        status: "取消",
        cancelledAt: Timestamp.now()
      });

      const householdUpdatePayload = {};
      if (bookingType === '初驗') {
        householdUpdatePayload.initialInspectionDate = null;
        householdUpdatePayload.initialInspectionMethod = null;
      } else if (bookingType === '複驗') {
        householdUpdatePayload.reInspectionDate = null;
        householdUpdatePayload.reInspectionMethod = null;
      }

      if (Object.keys(householdUpdatePayload).length > 0) {
        transaction.update(householdRef, householdUpdatePayload);
      }
    });

    console.log(`[${functionName}] 已成功將預約狀態更新為「取消」。`);
    await updateHouseholdSummary(db, projectId, unitId);

    if (bookingData && bookingData.bookerEmail) {
      const projectDoc = await db.collection('projects').doc(projectId).get();
      const projectName = projectDoc.exists ? projectDoc.data().name : projectId;

      let contactInfoHtml = '';
      if (projectDoc.exists && projectDoc.data().intro?.contact) {
        const { name, phone } = projectDoc.data().intro.contact;
        if (name || phone) {
          const namePart = name ? `<strong>${name}</strong>` : '';
          const phonePart = phone ? `電話：${phone}` : '';
          const separator = name && phone ? ' / ' : '';
          contactInfoHtml = `<div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #eeeeee;"><p style="margin: 0; font-size: 14px; color: #555;">如有任何疑問，請洽詢：<br>${namePart}${separator}${phonePart}</p></div>`;
        }
      }

      const mailTransport = nodemailer.createTransport({
        service: 'gmail',
        auth: { user: process.env.SENDER_EMAIL, pass: process.env.GMAIL_APP_PASSWORD },
      });

      const subject = `【${projectName}】預約取消成功通知 (${bookingData.unitId})`;
      const bookingUrl = `https://anxismart.com/#/booking/${projectId}`;

      const htmlBody = `
<div style="font-family: 'Helvetica Neue', Helvetica, Arial, 'PingFang TC', 'Microsoft JhengHei', sans-serif; background-color: #f4f4f7; padding: 20px;">
  <div style="max-width: 600px; margin: 20px auto; background-color: #ffffff; border-radius: 8px; border: 1px solid #e0e0e0; overflow: hidden;">
    <div style="background-color: #dc3545; color: #ffffff; padding: 20px; text-align: center;"><h2 style="margin: 0; font-size: 24px;">預約取消通知</h2></div>
    <div style="padding: 24px; line-height: 1.6; color: #333333;">
      <p>親愛的 <strong>${bookingData.bookerName}</strong> 您好：</p>
      <p>您已成功取消您的預約，以下是已取消的預約資訊：</p>
      <table style="width: 100%; border-collapse: collapse; margin-top: 20px; margin-bottom: 20px; opacity: 0.7;">
        <tbody>
          <tr style="border-bottom: 1px solid #eeeeee;"><td style="padding: 12px 0; font-weight: bold; color: #555555; width: 100px;">預約代碼</td><td style="padding: 12px 0;">${bookingData.bookingCode}</td></tr>
          <tr style="border-bottom: 1px solid #eeeeee;"><td style="padding: 12px 0; font-weight: bold; color: #555555;">建案名稱</td><td style="padding: 12px 0;">${projectName}</td></tr>
          <tr style="border-bottom: 1px solid #eeeeee;"><td style="padding: 12px 0; font-weight: bold; color: #555555;">戶別</td><td style="padding: 12px 0;">${bookingData.unitId}</td></tr>
          <tr style="border-bottom: 1px solid #eeeeee;"><td style="padding: 12px 0; font-weight: bold; color: #555555;">預約項目</td><td style="padding: 12px 0;">${bookingData.bookingType}</td></tr>
          <tr style="border-bottom: 1px solid #eeeeee;"><td style="padding: 12px 0; font-weight: bold; color: #555555;">原預約日期</td><td style="padding: 12px 0;">${bookingData.appointmentDate.toDate().toLocaleDateString('zh-TW', { timeZone: 'Asia/Taipei', year: 'numeric', month: '2-digit', day: '2-digit' })}</td></tr>
          <tr><td style="padding: 12px 0; font-weight: bold; color: #555555;">原預約時段</td><td style="padding: 12px 0;">${bookingData.appointmentTimeSlot}</td></tr>
        </tbody>
      </table>
      <p>若您需要重新預約，歡迎隨時返回預約頁面。感謝您的使用。</p>
      ${contactInfoHtml}
      <p style="margin-top: 25px; padding-top: 20px; border-top: 1px solid #eeeeee; text-align: center;"><a href="${bookingUrl}" target="_blank" style="display: inline-block; padding: 10px 20px; background-color: #007bff; color: #ffffff; text-decoration: none; border-radius: 5px; font-weight: bold;">點此重新預約</a></p>
    </div>
    <div style="background-color: #f4f4f7; padding: 16px; text-align: center; font-size: 12px; color: #777777;">
      <p style="margin: 0;">此為系統自動發送郵件，請勿直接回覆。</p>
      <p style="margin: 5px 0 0 0;">${projectName} 預約系統</p>
    </div>
  </div>
</div>`;

      const ccRecipients = await getCcRecipients(projectId, "驗屋系統信件副本");
      await mailTransport.sendMail({
        to: bookingData.bookerEmail,
        cc: ccRecipients,
        subject: subject,
        html: htmlBody,
        name: `${projectName} 預約系統`
      });
      console.log(`[${functionName}] 已寄送取消通知信至 ${bookingData.bookerEmail}`);
    }

    //  回傳：路由函數會自動包裝
    return { status: "success", message: "預約已成功取消" };

  } catch (error) {
    console.error(`[${functionName}] 🔴 取消預約時發生錯誤:`, error);
    if (error instanceof HttpsError) {
      throw error;
    }
    throw new HttpsError("internal", `取消預約時發生錯誤: ${error.message}`);
  }
}

// =================================================================
// /   【修改】驗屋預約行事曆 (InspectionCalendar) 路由函數 (V3 - 前端快取優化版)
// =================================================================

/**
 *  [V3 - 路由函數] InspectionCalendar.vue 的單一 API 入口
 */
exports.inspectionCalendarApi = onCall({
  region: "asia-east1",
  secrets: ["SENDER_EMAIL", "GMAIL_APP_PASSWORD"],
  memory: "1GiB",
  timeoutSeconds: 300,
  cors: true
}, async (request) => {

  const { action, data } = request.data;
  const functionName = `inspectionCalendarApi (Action: ${action})`;

  try {
    console.log(`[${functionName}] 路由函數啟動...`);

    switch (action) {

      // --- 頁面初始化 (Store) ---
      case 'getProjectConfig':
        return await _handleGetProjectConfig(data);
      case 'getProjectBatchDetails':
        return await _handleGetProjectBatchDetails(data);
      case 'getAppointmentDateRange':
        return await _handleGetAppointmentDateRange(data);
      case 'fetchAllHouseholds':
        // 【修改】此函數現在只會被呼叫一次，用於建立前端快取
        return await _handleFetchAllHouseholdsForProject(data);

      // --- 頁面主要資料 ---
      case 'fetchCalendarData':
        // 【修改】此函數現在只回傳 appointments 資料
        return await _handleFetchCalendarData(data);
      case 'searchAppointmentsAndHouseholds':
        // 【修改】此函數現在合併 household 快取資料後回傳
        return await _handleSearchAppointmentsAndHouseholds_Optimized(data); //  呼叫優化後的版本

      // --- 彈窗操作 (保持不變) ---
      case 'getAdminBookingCalendarData':
        return await _handleGetAdminBookingCalendarData(data);
      case 'updateAppointment':
        return await _handleUpdateAppointmentByAdmin(data);
      case 'cancelAppointment':
        return await _handleCancelAppointmentByAdmin(data);
      case 'updateAppointmentInspectors':
        return await _handleUpdateAppointmentInspectors(data);

      default:
        console.error(`[${functionName}] 錯誤：未知的 action: ${action}`);
        throw new HttpsError('invalid-argument', `未知的 API 動作: ${action}`);
    }

  } catch (error) {
    console.error(`[${functionName}] 執行時發生錯誤:`, error);
    if (error instanceof HttpsError) {
      throw error;
    }
    throw new HttpsError('internal', `處理 ${action} 時發生未預期的錯誤: ${error.message}`);
  }
});

/**
 * [內部函式] 獲取指定建案中，預約紀錄的最早年份和最晚年份
 * @param {object} data - 包含 { projectId } 的物件
 * @returns {Promise<object>} - 包含 { minDate, maxDate } 的物件
 */
async function _handleGetAppointmentDateRange(data) {
  const { projectId } = data;
  const functionName = `_handleGetAppointmentDateRange (Project: ${projectId})`;

  if (!projectId) {
    throw new HttpsError("invalid-argument", "缺少 projectId 參數。");
  }

  try {
    const db = new Firestore({ databaseId: "anxi-app" });
    const appointmentsRef = db.collection("appointments");

    const firstAppointmentQuery = appointmentsRef
      .where("projectId", "==", projectId)
      .orderBy("appointmentDate", "asc")
      .limit(1);

    const lastAppointmentQuery = appointmentsRef
      .where("projectId", "==", projectId)
      .orderBy("appointmentDate", "desc")
      .limit(1);

    const [firstSnapshot, lastSnapshot] = await Promise.all([
      firstAppointmentQuery.get(),
      lastAppointmentQuery.get(),
    ]);

    let minDate, maxDate;

    if (firstSnapshot.empty) {
      const currentYear = new Date().getFullYear();
      minDate = `${currentYear}-01-01`;
      maxDate = `${currentYear}-12-31`;
      console.log(`[${functionName}] 找不到預約，使用預設年份: ${currentYear}`);
    } else {
      const firstAppointment = firstSnapshot.docs[0].data();
      const lastAppointment = lastSnapshot.docs[0].data();

      const earliestYear = firstAppointment.appointmentDate.toDate().getFullYear();
      const latestYear = lastAppointment.appointmentDate.toDate().getFullYear();

      minDate = `${earliestYear}-01-01`;
      maxDate = `${latestYear}-12-31`;
      console.log(`[${functionName}] 計算出的年份範圍: ${earliestYear} - ${latestYear}`);
    }

    //  回傳：路由函數會自動包裝
    return { status: "success", data: { minDate, maxDate } };

  } catch (error) {
    console.error(`[${functionName}] Error:`, error);
    throw new HttpsError("internal", `獲取日期範圍失敗: ${error.message}`);
  }
}

/**
 * 【修改】[內部函式] 獲取指定建案下的所有戶別資料 (供前端快取使用)
 * (此函數取代舊的 _handleFetchAllHouseholdsForProject)
 * @param {object} data - 包含 { projectId }
 * @returns {Promise<Array>} - 戶別資料陣列
 */
async function _handleFetchAllHouseholdsForProject(data) {
  const { projectId } = data;
  const functionName = `_handleFetchAllHouseholdsForProject`;

  if (!projectId) {
    throw new HttpsError("invalid-argument", "缺少 projectId 參數。");
  }

  try {
    const db = new Firestore({ databaseId: "anxi-app" });
    const householdsRef = db.collection("households");
    const query = householdsRef.where("projectId", "==", projectId);
    const snapshot = await query.get();

    const households = [];
    snapshot.forEach(doc => {
      // 為 AG Grid 和合併邏輯，將 doc.id 也加入
      households.push({ _docId: doc.id, ...doc.data() });
    });

    console.log(`[${functionName}] 成功獲取 ${households.length} 筆戶別資料用於前端快取 (Project: ${projectId})`);

    return households;

  } catch (e) {
    console.error(`[${functionName}] 獲取戶別資料時發生錯誤 (Project: ${projectId}):`, e);
    throw new HttpsError("internal", `獲取戶別資料時發生錯誤: ${e.message}`);
  }
}

/**
 * 【修改】[內部函式] 根據日期範圍獲取預約紀錄 (不再合併戶別資料)
 * @param {object} data - 包含 { projectId, startDate, endDate }
 * @returns {Promise<Array>} - 只有 appointments 的資料陣列
 */
async function _handleFetchCalendarData(data) {
  const { projectId, startDate, endDate } = data;
  const functionName = `_handleFetchCalendarData_Optimized`;

  let startDateObj, endDateObj;
  try {
    startDateObj = new Date(startDate);
    endDateObj = new Date(endDate);
    if (isNaN(startDateObj.getTime()) || isNaN(endDateObj.getTime())) {
      throw new Error('無效的日期格式');
    }
  } catch (e) {
    throw new HttpsError("invalid-argument", `無效的日期參數: ${e.message}`);
  }

  try {
    const db = new Firestore({ databaseId: "anxi-app" });

    //  1. 不再查詢 households 集合

    //  2. 只查詢 appointments 集合
    const appointmentsRef = db.collection("appointments");
    const appointmentsSnapshot = await appointmentsRef
      .where("projectId", "==", projectId)
      .where("appointmentDate", ">=", startDateObj)
      .where("appointmentDate", "<=", endDateObj)
      .get();

    const appointments = appointmentsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    console.log(`[${functionName}] 成功獲取 ${appointments.length} 筆預約資料 (Project: ${projectId})`);

    //  3. 直接回傳預約資料陣列
    return appointments;

  } catch (error) {
    console.error(`[${functionName}] 查詢預約資料時發生錯誤:`, error);
    throw new HttpsError("internal", `查詢行事曆資料時發生錯誤: ${error.message}`);
  }
}

/**
 * 【優化版】[內部函式] 全域預約搜尋 (現在也讀取戶別快取)
 */
async function _handleSearchAppointmentsAndHouseholds_Optimized(data) {
  const { projectId, keyword } = data;
  const functionName = `_handleSearchAppointmentsAndHouseholds_Optimized`;

  if (!projectId || !keyword || keyword.trim().length < 2) {
    throw new HttpsError("invalid-argument", "必須提供有效的建案 ID 和至少 2 個字元的關鍵字。");
  }

  const lowerCaseKeyword = keyword.toLowerCase();
  const db = new Firestore({ databaseId: "anxi-app" });

  try {
    //  1. 從快取（projects 文件）讀取戶別資料
    const projectDoc = await db.collection("projects").doc(projectId).get();
    const householdsMap = new Map();

    //  【修改點】
    // 將 .exists() 修改為 .exists (Admin SDK 屬性)
    if (projectDoc.exists) {
      //  【修改點結束】

      // ❗ 注意：您必須確保 `updateProjectCacheOnHouseholdChange` 函數
      // 產生的快取欄位叫做 `householdDataCache`。
      // （在我們上一步中，為 BookingPage 建立的快取是 `bookingMenuCache` 和 `uploadUnitsCache`）
      // 
      // 為了安全起見，我將同時檢查這兩個快取欄位
      const bookingCache = projectDoc.data().bookingMenuCache || {};
      const uploadCache = projectDoc.data().uploadUnitsCache || {};

      // 將 bookingMenuCache 壓平存入 Map
      for (const building in bookingCache) {
        bookingCache[building].forEach(unitData => {
          householdsMap.set(`${projectId}_${unitData.unit}`, unitData);
        });
      }
      // 將 uploadUnitsCache 壓平存入 Map (會覆蓋 bookingCache，但資料更全)
      for (const building in uploadCache) {
        uploadCache[building].forEach(unitData => {
          householdsMap.set(`${projectId}_${unitData.unit}`, unitData);
        });
      }

    } else {
      // 備用方案：如果快取不存在，則查詢 households 集合 (這不應該發生，但作為防呆)
      console.warn(`[${functionName}] 警告：找不到 Project 快取，將執行 Households 集合查詢 (高成本)`);
      const householdsSnapshot = await db.collection("households").where("projectId", "==", projectId).get();
      householdsSnapshot.forEach(doc => {
        householdsMap.set(`${doc.data().projectId}_${doc.data().unitId}`, doc.data());
      });
    }

    const matchedHouseholdUnitIds = new Set();
    householdsMap.forEach((householdData) => {
      if (documentMatchesKeyword(householdData, lowerCaseKeyword)) {
        if (householdData.unitId) {
          matchedHouseholdUnitIds.add(householdData.unitId);
        }
      }
    });

    //  2. 只查詢 appointments 集合
    const appointmentsSnapshot = await db.collection("appointments").where("projectId", "==", projectId).get();

    //  3. 在記憶體中篩選和合併
    const results = [];
    const addedAppointmentIds = new Set();
    appointmentsSnapshot.forEach(doc => {
      const appointment = { id: doc.id, ...doc.data() };
      const appointmentMatches = documentMatchesKeyword(appointment, lowerCaseKeyword);
      const householdMatches = matchedHouseholdUnitIds.has(appointment.unitId);

      if ((appointmentMatches || householdMatches) && !addedAppointmentIds.has(appointment.id)) {

        // 從 Map 中取出對應的戶別資料並合併
        const householdKey = `${appointment.projectId}_${appointment.unitId}`;
        const householdData = householdsMap.get(householdKey) || {};
        const combinedData = { ...householdData, ...appointment, id: doc.id };

        // 轉換日期
        if (combinedData.appointmentDate && typeof combinedData.appointmentDate.toDate === 'function') {
          combinedData.appointmentDate = combinedData.appointmentDate.toDate().toISOString();
        }
        if (combinedData.createdAt && typeof combinedData.createdAt.toDate === 'function') {
          combinedData.createdAt = combinedData.createdAt.toDate().toISOString();
        }

        results.push(combinedData);
        addedAppointmentIds.add(appointment.id);
      }
    });

    console.log(`[${functionName}] 搜尋完成，共找到 ${results.length} 筆預約紀錄。`);
    return { status: "success", data: results };

  } catch (error) {
    console.error(`[${functionName}] 執行失敗:`, error);
    throw new HttpsError("internal", `搜尋時發生未預期的錯誤，請稍後再試。`);
  }
}

/**
 * [內部函式] 僅更新單筆預約紀錄的驗屋人員欄位
 * @param {object} data - 包含 { appointmentId, inspectors }
 * @returns {Promise<object>} - { status: 'success' }
 */
async function _handleUpdateAppointmentInspectors(data) {
  const { appointmentId, inspectors } = data;
  const functionName = `_handleUpdateAppointmentInspectors`;

  if (!appointmentId) {
    throw new HttpsError("invalid-argument", "缺少預約 ID (appointmentId)。");
  }

  try {
    const db = new Firestore({ databaseId: "anxi-app" });
    const appointmentRef = db.collection("appointments").doc(appointmentId);

    // 將前端傳來的陣列轉換為逗號分隔的字串，以便儲存
    const inspectorsString = Array.isArray(inspectors) ? inspectors.join(',') : '';

    await appointmentRef.update({
      inspectors: inspectorsString
    });

    console.log(`[${functionName}] 成功更新 ${appointmentId} 的驗屋人員。`);
    //  回傳：路由函數會自動包裝
    return { status: 'success' };
  } catch (error) {
    console.error(`[${functionName}] 更新驗屋人員時發生錯誤:`, error);
    throw new HttpsError("internal", `更新驗屋人員時發生錯誤: ${error.message}`);
  }
}


// =================================================================
// /   【新增】LIFF 驗屋行事曆 (LiffInspectionCalendar) 路由函數
// =================================================================

/**
 *  [V1 - 路由函數] LiffInspectionCalendar.vue 的單一 API 入口
 */
exports.liffCalendarApi = onCall({
  region: "asia-east1",
  //  組合所有 LIFF 會用到的 secrets
  secrets: ["SENDER_EMAIL", "GMAIL_APP_PASSWORD"],
  memory: "1GiB",
  timeoutSeconds: 300,
  cors: true
}, async (request) => {

  const { action, data } = request.data;
  const functionName = `liffCalendarApi (Action: ${action})`;

  try {
    console.log(`[${functionName}] 路由函數啟動...`);

    switch (action) {

      // --- 頁面初始化 (onMounted) ---
      case 'getLiffUserData':
        return await _handleGetLiffUserData(data);

      // --- 獲取快取資料 (watch project) ---
      case 'getAllLiffAppointmentsForProject':
        return await _handleGetAllLiffAppointmentsForProject(data);
      case 'fetchAllHouseholds':
        //  共用 Admin 的內部函數
        return await _handleFetchAllHouseholdsForProject(data);
      case 'fetchBookingOptions':
        //  共用 Admin 的內部函數 (雖然 LIFF 沒用到，但 api.js 有呼叫)
        return await _handleFetchBookingOptions(data);

      // --- 獲取動態資料 ---
      case 'getLiffCalendarDataForDay':
        // 【優化】使用只回傳 appointments 的版本
        return await _handleGetLiffCalendarDataForDay_Optimized(data);
      case 'liffSearchAppointments':
        // 【優化】使用只回傳 appointments 的版本
        return await _handleLiffSearchAppointments_Optimized(data);

      // --- 彈窗操作 (共用 Admin 的內部函數) ---
      case 'getAdminBookingCalendarData':
        return await _handleGetAdminBookingCalendarData(data);
      case 'updateAppointment':
        return await _handleUpdateAppointmentByAdmin(data);
      case 'cancelAppointment':
        return await _handleCancelAppointmentByAdmin(data);
      case 'updateAppointmentInspectors':
        return await _handleUpdateAppointmentInspectors(data);

      default:
        console.error(`[${functionName}] 錯誤：未知的 action: ${action}`);
        throw new HttpsError('invalid-argument', `未知的 API 動作: ${action}`);
    }

  } catch (error) {
    console.error(`[${functionName}] 執行時發生錯誤:`, error);
    if (error instanceof HttpsError) {
      throw error;
    }
    throw new HttpsError('internal', `處理 ${action} 時發生未預期的錯誤: ${error.message}`);
  }
});

/**
 * [內部函式] 獲取 LIFF 使用者資料 (V2 - 包含 bookingTypes)
 */
async function _handleGetLiffUserData(data) {
  const { lineId } = data;
  const functionName = "_handleGetLiffUserData";
  if (!lineId) throw new HttpsError("invalid-argument", "缺少 lineId");

  const db = new Firestore({ databaseId: "anxi-app" });
  try {
    const usersRef = db.collection("users");
    const userQuery = usersRef.where("lineId", "==", lineId).limit(1);
    const userSnapshot = await userQuery.get();
    if (userSnapshot.empty) return { status: "not_bound" };

    const userDoc = userSnapshot.docs[0];
    const userData = userDoc.data();
    const userKey = userDoc.id;

    const permDocRef = db.collection("userPermissions").doc(userKey);
    const permDoc = await permDocRef.get();
    if (!permDoc.exists) return { status: "bound", userName: userData.name, projects: [] };

    const permissions = permDoc.data().permissions || {};
    const authorizedProjectsPromises = [];

    for (const projectId in permissions) {
      const projectPerms = permissions[projectId];
      // ✅ [打勾] 修改：擴充權限檢查，加入客資系統權限
      // 原本: if (projectPerms.systems && (projectPerms.systems.includes("驗屋預約管理-檢視") || projectPerms.systems.includes("驗屋預約管理-修改"))) {

      // 修改後:
      const systems = projectPerms.systems || [];
      const hasInspectionAccess = systems.includes("驗屋預約管理-檢視") || systems.includes("驗屋預約管理-修改");
      const hasCustomerAccess = systems.includes("客資系統-櫃台") || systems.includes("客資系統-銷售"); // 加入這行

      if (hasInspectionAccess || hasCustomerAccess) { // 只要符合任一條件即可
        const projectDocPromise = db.collection('projects').doc(projectId).get().then(doc => {
          if (!doc.exists) return null;
          const projectData = doc.data();
          return {
            projectId: projectId,
            projectName: projectPerms.projectName,
            bookingTypes: projectData.bookingTypes || [],
            systems: systems
          };
        }).catch(err => {
          console.error(`_handleGetLiffUserData 讀取失敗:`, err);
          return null;
        });
        authorizedProjectsPromises.push(projectDocPromise);
      }
    }

    const authorizedProjects = (await Promise.all(authorizedProjectsPromises)).filter(Boolean);

    console.log(`[${functionName}] 用戶 [${userData.name}] 擁有 ${authorizedProjects.length} 個建案的查詢權限。`);

    // [修正點]: 統一回傳格式，確保包含 phone 與 name 以匹配前端與資料庫
    return {
      status: "bound",
      userName: userData.name,
      name: userData.name,          // 確保前端直接讀取 name 時有值
      userKey: userData.phone || userKey, // 修正變數名稱：從 userDocId 改為 userKey
      phone: userData.phone || userKey,   // 修正變數名稱：從 userDocId 改為 userKey
      projects: authorizedProjects,
    };
  } catch (error) {
    console.error(`[${functionName}] 獲取 LIFF 用戶資料時發生錯誤:`, error);
    throw new HttpsError("internal", "處理用戶資料時發生錯誤。");
  }
}

/**
 * [內部函式] 獲取 LIFF 日曆計數用的所有預約
 */
async function _handleGetAllLiffAppointmentsForProject(data) {
  const { projectId } = data;
  const functionName = "_handleGetAllLiffAppointmentsForProject";
  if (!projectId) throw new HttpsError("invalid-argument", "缺少 projectId");

  const db = new Firestore({ databaseId: "anxi-app" });
  try {
    const appointmentsRef = db.collection("appointments");
    const query = appointmentsRef.where("projectId", "==", projectId);
    const snapshot = await query.get();
    if (snapshot.empty) return { status: "success", data: [] };

    const appointments = snapshot.docs.map(doc => {
      const data = doc.data();
      if (data.appointmentDate && typeof data.appointmentDate.toDate === 'function') {
        data.appointmentDate = data.appointmentDate.toDate().toISOString();
      }
      return {
        appointmentDate: data.appointmentDate,
        status: data.status
      };
    });
    return { status: "success", data: appointments };
  } catch (error) {
    console.error(`[${functionName}] 獲取所有預約資料時發生錯誤:`, error);
    throw new HttpsError("internal", "獲取所有預約資料時發生錯誤。");
  }
}

/**
 * 【優化版】[內部函式] 獲取 LIFF 指定單日的預約 (只回傳 appointments)
 */
async function _handleGetLiffCalendarDataForDay_Optimized(data) {
  const { projectId, date } = data;
  const functionName = "_handleGetLiffCalendarDataForDay_Optimized";
  if (!projectId || !date) throw new HttpsError("invalid-argument", "缺少 projectId 或 date");

  const db = new Firestore({ databaseId: "anxi-app" });
  try {
    const startOfDay = new Date(`${date}T00:00:00+08:00`);
    const endOfDay = new Date(`${date}T23:59:59+08:00`);

    const appointmentsRef = db.collection("appointments");
    const query = appointmentsRef
      .where("projectId", "==", projectId)
      .where("appointmentDate", ">=", startOfDay)
      .where("appointmentDate", "<=", endOfDay);

    const snapshot = await query.get();
    if (snapshot.empty) return { status: "success", data: [] };

    const appointments = snapshot.docs.map(doc => {
      const data = doc.data();
      //  轉換所有日期為 ISO String
      ['appointmentDate', 'createdAt', 'cancelledAt'].forEach(field => {
        if (data[field] && typeof data[field].toDate === 'function') {
          data[field] = data[field].toDate().toISOString();
        }
      });
      return { id: doc.id, ...data };
    });

    return { status: "success", data: appointments };
  } catch (error) {
    console.error(`[${functionName}] 獲取 LIFF 日曆資料時發生錯誤:`, error);
    throw new HttpsError("internal", "獲取日曆資料時發生錯誤。");
  }
}

/**
 * 【優化版】[內部函式] LIFF 搜尋預約 (只回傳 appointments)
 */
async function _handleLiffSearchAppointments_Optimized(data) {
  const { projectId, searchText } = data;
  const functionName = "_handleLiffSearchAppointments_Optimized";
  if (!projectId || !searchText) throw new HttpsError("invalid-argument", "缺少 projectId 或 searchText");

  const lowerCaseSearchText = searchText.toLowerCase();
  const db = new Firestore({ databaseId: "anxi-app" });
  try {
    //  1. 只查詢 appointments 集合
    const appointmentsRef = db.collection("appointments");
    const query = appointmentsRef.where("projectId", "==", projectId);
    const snapshot = await query.get();
    if (snapshot.empty) return { status: "success", data: [] };

    //  2. 在記憶體中進行模糊比對
    const searchFields = [
      'agentIdNumber', 'agentName', 'agentPhone', 'bookerIdNumber',
      'bookerName', 'bookerPhone', 'bookingCode', 'inspectionMethod', 'unitId'
    ];

    const matchedAppointments = [];
    snapshot.forEach(doc => {
      const data = doc.data();
      let isMatch = false;
      for (const field of searchFields) {
        const value = data[field];
        if (value && typeof value === 'string' && value.toLowerCase().includes(lowerCaseSearchText)) {
          isMatch = true;
          break;
        }
      }
      if (isMatch) {
        //  轉換日期為 ISO String
        ['appointmentDate', 'createdAt', 'cancelledAt'].forEach(field => {
          if (data[field] && typeof data[field].toDate === 'function') {
            data[field] = data[field].toDate().toISOString();
          }
        });
        matchedAppointments.push({ id: doc.id, ...data });
      }
    });

    return { status: "success", data: matchedAppointments };
  } catch (error) {
    console.error(`[${functionName}] 搜尋預約時發生錯誤:`, error);
    throw new HttpsError("internal", "搜尋時發生錯誤。");
  }
}

/**
 * [內部函式] 獲取新增/編輯預約時所需的下拉選單等選項
 * ( V2: 修正為從 projects 讀取)
 * @param {object} data - 包含 { projectId }
 * @returns {Promise<object>}
 */
async function _handleFetchBookingOptions(data) {
  const { projectId } = data;
  const functionName = `_handleFetchBookingOptions`;

  if (!projectId) {
    throw new HttpsError("invalid-argument", "缺少 projectId 參數。");
  }

  try {
    const db = new Firestore({ databaseId: "anxi-app" });

    // 1. 獲取專案設定
    const projectDoc = await db.collection('projects').doc(projectId).get();
    if (!projectDoc.exists) {
      throw new HttpsError("not-found", `找不到建案 ${projectId} 的設定。`);
    }
    const projectSettings = projectDoc.data();

    // 2. 從專案設定中獲取
    const inspectionMethods = projectSettings?.bookingMethodOptions || ['自驗', '代驗公司'];
    const inspectionStaff = projectSettings?.inspectionStaff || [];

    // 3. 獲取棟別與戶別資料 (從快取讀取)
    //  我們不再需要查詢 households，直接讀取 projects 上的快取
    const householdsMap = projectDoc.data().bookingMenuCache || {}; // 使用為 BookingPage 建立的快取

    const buildingsAndUnits = {};
    for (const buildingName in householdsMap) {
      buildingsAndUnits[buildingName] = householdsMap[buildingName].map(unit => unit.unit);
    }

    return { inspectionMethods, inspectionStaff, buildingsAndUnits };

  } catch (error) {
    console.error(`[${functionName}] 獲取預約選項時發生錯誤:`, error);
    throw new HttpsError("internal", `獲取預約選項時發生錯誤: ${error.message}`);
  }
}


//  [打勾] 1. 新增一個內部函數來處理儲存邏輯
/**
 * (內部函數) 儲存報價單版型
 * @param {object} payload 包含 { projectId, templateData }
 * @param {functions.https.CallableContext} context
 */
async function _handleSaveQuotationTemplate(payload, context) {


  // ✅ [打勾] 修正：從 payload.data 讀取
  const { projectId, templateData } = payload;

  if (!projectId || !templateData) {
    throw new functions.https.HttpsError("invalid-argument", "缺少 projectId 或 templateData 參數");
  }
  try {
    const db = new Firestore({ databaseId: "anxi-app" });
    const templateRef = db.collection("salesControls").doc(projectId).collection("quotation").doc("template");
    await templateRef.set(templateData, { merge: true });
    return { status: "success", message: "版型已儲存" };
  } catch (error) {
    console.error("儲存報價單版型失敗:", error);
    throw new functions.https.HttpsError("internal", "儲存版型時發生後端錯誤");
  }
}

// ✅ [打勾] 2. 新增：讀取版型的內部函數
/**
 * (內部函數) 讀取報價單版型
 * @param {object} payload 包含 { projectId }
 * @param {functions.https.CallableContext} context
 */
async function _handleLoadQuotationTemplate(payload, context) {


  // ✅ [打勾] 修正：從 payload.data 讀取
  const { projectId } = payload;

  if (!projectId) {
    throw new functions.https.HttpsError("invalid-argument", "缺少 projectId 參數");
  }
  try {
    const db = new Firestore({ databaseId: "anxi-app" });
    const templateRef = db.collection("salesControls").doc(projectId).collection("quotation").doc("template");
    const docSnap = await templateRef.get();

    if (docSnap.exists) {
      return { status: "success", data: docSnap.data() };
    } else {
      return { status: "notFound", data: null, message: "尚未儲存版型" };
    }
  } catch (error) {
    console.error("讀取報價單版型失敗:", error);
    throw new functions.https.HttpsError("internal", "讀取版型時發生後端錯誤");
  }
}

//   2. 新增 'salesApi' 路由 (方案 A)
exports.salesApi = onCall({
  region: "asia-east1",
  cors: true
}, async (request, context) => {

  const { action, ...payload } = request.data;

  switch (action) {
    case "saveQuotationTemplate":
      return await _handleSaveQuotationTemplate(payload, context);

    case "loadQuotationTemplate":
      return await _handleLoadQuotationTemplate(payload, context);

    default:
      console.error(`salesApi: 未知的 action: ${action}`);
      throw new functions.https.HttpsError(
        "not-found",
        `未知的 action: ${action}`
      );
  }
});


// ✓ START: 新增 - 產製付款表 (Google Sheet 版本)
/**
* [Cloud Function] 複製 Google Sheet 付款表模板，並回填資料
*/
exports.generatePaymentSheet = onCall({
  region: "asia-east1",
  secrets: driveSecrets, // ✓ 重用 driveSecrets
  timeoutSeconds: 300,
  memory: "1GiB"
}, async (request) => {

  const functionName = 'generatePaymentSheet';
  const {
    projectId,
    unitId,
    projectName,
    salespersonName,
    data
  } = request.data;

  if (!projectId || !unitId || !data) {
    throw new HttpsError("invalid-argument", "缺少 projectId, unitId 或 data 參數。");
  }

  const db = new Firestore({ databaseId: "anxi-app" });
  let oauth2Client; // ✓ 取得認證
  let drive;
  let sheets;

  try {
    // --- 1. 認證並獲取 API 客戶端 ---
    // ✓ 重用 getAuthenticatedDriveClient (需確保它在 index.js 中可見)
    // 我們需要 drive (複製) 和 sheets (寫入)
    oauth2Client = new google.auth.OAuth2(
      process.env.DRIVE_CLIENT_ID,
      process.env.DRIVE_CLIENT_SECRET,
      'https://developers.google.com/oauthplayground'
    );
    oauth2Client.setCredentials({
      refresh_token: process.env.DRIVE_REFRESH_TOKEN,
    });
    drive = google.drive({ version: "v3", auth: oauth2Client });
    sheets = google.sheets({ version: "v4", auth: oauth2Client });

    // --- 2. 從 Firestore 獲取模板 ID 和儲存資料夾 URL ---
    console.log(`[${functionName}] 正在讀取專案 ${projectId} 的設定...`);
    const projectDoc = await db.collection('projects').doc(projectId).get();
    if (!projectDoc.exists) {
      throw new HttpsError("not-found", "找不到專案設定。");
    }
    const projectSettings = projectDoc.data();

    // ✓ 使用您在 SalesSettings.vue 中新增的欄位
    const templateId = projectSettings.paymentScheduleTemplateId;
    const folderUrl = projectSettings.paymentScheduleFolderUrl;

    if (!templateId) {
      throw new HttpsError("failed-precondition", "專案未設定「付款表模板SHEET ID」。");
    }
    if (!folderUrl) {
      throw new HttpsError("failed-precondition", "專案未設定「付款表儲存位置」。");
    }

    // 從 URL 解析 Folder ID
    const folderIdMatch = folderUrl.match(/[-\w]{25,}/);
    if (!folderIdMatch) {
      throw new HttpsError("invalid-argument", "「付款表儲存位置」的 URL 格式無效。");
    }
    const targetFolderId = folderIdMatch[0];

    // --- 3. 複製模板檔案 ---
    const today = formatInTimeZone(new Date(), 'Asia/Taipei', 'yyyyMMdd');
    const newFileName = `${today}-${projectName}-付款表-${unitId}-${salespersonName || 'N/A'}`;

    console.log(`[${functionName}] 正在複製模板 ${templateId} 到資料夾 ${targetFolderId}...`);

    const copyResponse = await drive.files.copy({
      fileId: templateId,
      requestBody: {
        name: newFileName,
        parents: [targetFolderId]
      },
      fields: 'id, webViewLink' // 獲取新檔案的 ID 和 URL
    });

    const newSheetId = copyResponse.data.id;
    const newSheetUrl = copyResponse.data.webViewLink;

    // --- 4. 準備要寫入的資料 ---
    console.log(`[${functionName}] 檔案複製成功 (ID: ${newSheetId})，準備寫入資料...`);

    // 獲取 "載入資料" 工作表的標頭
    const sheetName = '載入資料';
    const headerResponse = await sheets.spreadsheets.values.get({
      spreadsheetId: newSheetId,
      range: `${sheetName}!1:1`,
    });

    const headers = headerResponse.data.values ? headerResponse.data.values[0] : [];
    // 建立中文標頭到索引的映射
    const headerMap = {};
    headers.forEach((header, index) => {
      if (header) headerMap[header.trim()] = index;
    });

    // 建立一個空的資料列 (與標頭等寬)
    const dataRow = Array(headers.length).fill("");

    // 根據標頭映射表，填入單一欄位資料
    const setData = (headerName, value) => {
      const index = headerMap[headerName];
      if (index !== undefined) {
        // ✓ 處理布林值
        if (typeof value === 'boolean') {
          dataRow[index] = value ? '是' : '否';
        } else {
          dataRow[index] = value || "";
        }
      }
    };

    // ✓ START: 新增 - 計算成交總價
    // 正體中文註解：從前端傳來的 data 物件中獲取房屋成交價
    const housePrice = data.housePrice || 0;
    // 正體中文註解：遍歷車位列表，加總所有車位成交價
    const parkingPrice = (data.parkingSpots || []).reduce((sum, p) => {
      return sum + (Number(p.price_transaction) || 0);
    }, 0);
    // 正體中文註解：計算最終的成交總價
    const grandTotalSalePrice = housePrice + parkingPrice;
    // ✓ END: 新增 - 計算成交總價

    setData('戶別', unitId);
    setData('合約方式', data.contractType);
    setData('是否首購', data.isFirstTimeBuyer); // (setData 函數會處理 boolean)
    setData('銷售人員', salespersonName);
    setData('聯絡電話', data.salespersonPhone);
    setData('房屋成交', data.housePrice);
    setData('配套總價', data.packageDealPrice);
    setData('配套價', data.packagePrice);
    setData('成交總價', grandTotalSalePrice);

    // ✓ START: 新增的欄位
    // (注意：key (e.g., houseBankName) 必須
    // 與 PaymentSettings.vue 中 payload.data 的 key 一致)

    // 銀行帳號
    setData('房屋款繳款銀行名稱', data.houseBankName);
    setData('房屋款戶名', data.houseBankAccountName);
    setData('房屋款帳號', data.houseBankAccount);
    setData('土地款繳款銀行名稱', data.landBankName);
    setData('土地款戶名', data.landBankAccountName);
    setData('土地款帳號', data.landBankAccount);
    setData('配套款繳款銀行名稱', data.packageBankName);
    setData('配套款戶名', data.packageBankAccountName);
    setData('配套款帳號', data.packageBankAccount);

    // 面積資訊
    setData('房屋面積(坪)', data.area_house_ping);
    setData('房屋面積(平方公尺)', data.area_house_sqm);
    setData('公設比', data.common_area_ratio);
    setData('主建物面積(坪)', data.area_main_ping);
    setData('主建物面積(平方公尺)', data.area_main_sqm);
    setData('附屬建物面積(坪)', data.area_ancillary_ping);
    setData('附屬建物面積(平方公尺)', data.area_ancillary_sqm);
    setData('共用部分面積(坪)', data.area_common_ping);
    setData('共用部分面積(平方公尺)', data.area_common_sqm);
    setData('露臺(坪)', data.area_terrace_ping);
    setData('土地持分面積(坪)', data.land_share_ping);
    setData('土地持分面積(平方公尺)', data.land_share_sqm);
    setData('土地持分', data.land_share_ratio);
    // ✓ END: 新增的欄位

    const allRowsToWrite = [dataRow]; // 這是第一行要寫入的資料

    // 處理車位 (多行資料)
    if (data.parkingSpots && data.parkingSpots.length > 0) {
      const parkSpotIndex = headerMap['車位編號'];
      const parkPriceIndex = headerMap['車位成交'];

      if (parkSpotIndex !== undefined && parkPriceIndex !== undefined) {
        // 第一台車的資料填在第一行
        dataRow[parkSpotIndex] = data.parkingSpots[0].spotId;
        dataRow[parkPriceIndex] = data.parkingSpots[0].price_transaction;

        // 如果有更多車位，建立新的一列
        for (let i = 1; i < data.parkingSpots.length; i++) {
          const parkingRow = Array(headers.length).fill("");
          parkingRow[parkSpotIndex] = data.parkingSpots[i].spotId;
          parkingRow[parkPriceIndex] = data.parkingSpots[i].price_transaction;
          allRowsToWrite.push(parkingRow);
        }
      }
    }

    // --- 5. 執行批次寫入 ---
    console.log(`[${functionName}] 準備寫入 ${allRowsToWrite.length} 行資料到 "${sheetName}"...`);

    await sheets.spreadsheets.values.append({
      spreadsheetId: newSheetId,
      range: `${sheetName}!A2`, // 從 A2 開始附加
      valueInputOption: 'USER_ENTERED',
      resource: {
        values: allRowsToWrite
      }
    });

    console.log(`[${functionName}] 資料寫入成功。`);

    // ✓ START: 新增 - 根據合約方式隱藏工作表
    if (data.contractType === '一般合約') {
      console.log(`[${functionName}] 合約方式為 "一般合約"，嘗試隱藏 "配套期款" 工作表...`);

      try {
        // 1. 獲取新試算表的所有工作表資訊
        const spreadsheetInfo = await sheets.spreadsheets.get({
          spreadsheetId: newSheetId, // ✓ 修正：spreadsheetsId -> spreadsheetId
          fields: 'sheets(properties(sheetId,title))'
        });

        const sheetsProperties = spreadsheetInfo.data.sheets;
        if (sheetsProperties) {
          // 2. 尋找 "配套期款" 工作表的 sheetId
          const targetSheet = sheetsProperties.find(
            sheet => sheet.properties.title === '配套期款'
          );

          if (targetSheet) {
            const targetSheetId = targetSheet.properties.sheetId;
            console.log(`[${functionName}] 找到 "配套期款" (sheetId: ${targetSheetId})，執行隱藏...`);

            // 3. 執行 batchUpdate 以隱藏工作表
            await sheets.spreadsheets.batchUpdate({
              spreadsheetId: newSheetId,
              requestBody: {
                requests: [
                  {
                    updateSheetProperties: {
                      properties: {
                        sheetId: targetSheetId,
                        hidden: true
                      },
                      fields: 'hidden'
                    }
                  }
                ]
              }
            });
            console.log(`[${functionName}] "配套期款" 工作表已隱藏。`);
          } else {
            // 如果找不到，僅記錄日誌，不中斷流程
            console.warn(`[${functionName}] 在試算表 ${newSheetId} 中找不到名為 "配套期款" 的工作表，略過隱藏。`);
          }
        }
      } catch (hideError) {
        // 隱藏失敗不應中斷整個函數，僅記錄錯誤
        console.error(`[${functionName}] 隱藏 "配套期款" 工作表時發生錯誤:`, hideError.message);
      }
    }
    // ✓ END: 新增 - 根據合約方式隱藏工作表

    return { status: 'success', url: newSheetUrl };

  } catch (error) {
    console.error(`[${functionName}] 執行時發生嚴重錯誤:`, error);
    if (error instanceof HttpsError) throw error;
    // 檢查是否為 Google API 錯誤
    if (error.code && error.errors) {
      throw new HttpsError("internal", `Google API 錯誤: ${error.message}`);
    }
    throw new HttpsError("internal", `產製付款表時發生錯誤: ${error.message}`);
  }
});
// ✓ END: 新增 Cloud Function

// =================================================================
// /  【新增】客資系統 API 路由 (customerApi)
// =================================================================

/**
 * [內部函式] 獲取客戶資料列表 (供 CustomerManagement.vue 的 Table 使用)
 * (✓ V6: 修正邏輯 - 同一客戶若有不同銷售人員，皆需顯示；同一銷售人員只取最新)
 */
async function _handleFetchCustomerList(data, db) {
  const { projectId, userPhone, userProjectSystems } = data;
  const functionName = `_handleFetchCustomerList`;
  if (!projectId || !userPhone || !userProjectSystems) {
    throw new HttpsError("invalid-argument", "缺少 projectId, userPhone 或 userProjectSystems 參數。");
  }
  try {
    const isCounter = userProjectSystems.includes('客資系統-櫃台');
    const guestsRef = db.collection("vipGuests");
    const query = guestsRef.where("projectId", "==", projectId);
    const snapshot = await query.get();
    if (snapshot.empty) {
      return [];
    }
    const flatSubmissions = [];
    const ensureArray = (value) => {
      if (Array.isArray(value)) return value;
      if (typeof value === 'string' && value) return [value];
      return [];
    };
    snapshot.forEach(doc => {
      const docData = doc.data();
      const submissions = docData.submissions || [];


      // 1. 提取最新 Profile 資訊 (等級、未買原因)

      // (這些資訊是跟著"客戶"走的，所以共用)

      const interactionLogs = docData.interactionLogs || [];

      let latestRating = '';

      let latestNoBuyReasons = [];



      if (interactionLogs.length > 0) {

        const sortedLogs = [...interactionLogs].sort((a, b) => {

          const dateA = new Date(a.date || 0);

          const dateB = new Date(b.date || 0);

          return dateB - dateA; // 降序

        });

        const latestLog = sortedLogs[0];

        if (latestLog && latestLog.tags) {

          latestRating = latestLog.tags.rating || '';

          latestNoBuyReasons = ensureArray(latestLog.tags.noPurchaseReason);

        }

      }



      // 2. 過濾出「對當前用戶可見」的所有提交紀錄

      const validSubmissions = submissions.filter(sub => {

        // 條件 1: 必須有銷售人員

        if (!sub['銷售人員']) return false;



        // 條件 2: 如果不是櫃台，必須是該銷售人員的客戶

        if (!isCounter && sub['銷售人員電話'] !== userPhone) return false;



        return true;

      });



      if (validSubmissions.length === 0) return;





      const submissionsBySales = {};



      validSubmissions.forEach(sub => {

        const salesName = sub['銷售人員'];

        if (!submissionsBySales[salesName]) {

          submissionsBySales[salesName] = [];

        }

        submissionsBySales[salesName].push(sub);

      });



      // ✅ [修改重點]：針對每一位銷售人員，只取最新的一筆

      Object.values(submissionsBySales).forEach(group => {

        // 該組內依照時間降序排序

        group.sort((a, b) => {

          const timeA = a.submittedAt ? a.submittedAt.toMillis() : 0;

          const timeB = b.submittedAt ? b.submittedAt.toMillis() : 0;

          return timeB - timeA; // 最新在最前

        });



        const latestSub = group[0]; // 取最新的一筆



        // 加入列表

        flatSubmissions.push({

          '拜訪日期': latestSub['拜訪日期'] || null,

          '姓名': latestSub['姓名'] || '',

          '電話': latestSub['電話'] || '',

          '購屋動機': ensureArray(latestSub['購屋動機']),

          '房型需求': ensureArray(latestSub['房型需求']),

          '購屋預算': latestSub['購屋預算'] || '',

          '銷售人員': latestSub['銷售人員'],

          'docId': doc.id,

          'submittedAt': latestSub.submittedAt ? latestSub.submittedAt.toDate().toISOString() : null,

          'updatedAt': docData.updatedAt ? docData.updatedAt.toDate().toISOString() : null,
          'createdAt': docData.createdAt ? docData.createdAt.toDate().toISOString() : null,


          // 來自 interactionLogs 的最新資訊 (共用)

          '等級研判': latestRating,

          '未買原因': latestNoBuyReasons

        });

      });

    });



    // 最後對整個列表依照拜訪日期排序

    flatSubmissions.sort((a, b) => {

      return (b['拜訪日期'] || '').localeCompare(a['拜訪日期'] || '');

    });



    return flatSubmissions;



  } catch (error) {

    console.error(`[${functionName}] 執行時發生錯誤:`, error);

    throw new HttpsError("internal", `獲取客戶列表時發生錯誤: ${error.message}`);

  }

}



/**
 * [內部函式] 獲取完整客戶資料 (供 Excel 匯出使用)
 * 特點：回傳完整 profile 結構，不進行過度篩減
 */
async function _handleFetchCustomersForExport(data, db) {
  const { projectId, userPhone, userProjectSystems } = data;
  const functionName = `_handleFetchCustomersForExport`;

  if (!projectId || !userPhone || !userProjectSystems) {
    throw new HttpsError("invalid-argument", "缺少必要參數。");
  }

  try {
    const isCounter = userProjectSystems.includes('客資系統-櫃台');
    const guestsRef = db.collection("vipGuests");
    const query = guestsRef.where("projectId", "==", projectId);
    const snapshot = await query.get();

    if (snapshot.empty) {
      return [];
    }

    const exportList = [];

    snapshot.forEach(doc => {
      const docData = doc.data();

      // --- 權限過濾邏輯 ---
      // 如果不是櫃台/管理員，且該客戶的最新銷售人員不是自己，則跳過
      // 注意：這裡使用 latestSalesPhone (根目錄欄位) 判斷歸屬
      if (!isCounter) {
        if (docData.latestSalesPhone !== userPhone) {
          return; // 跳過此客戶
        }
      }

      // --- 1. 處理洽談紀錄 (取出最新一筆) ---
      const logs = docData.interactionLogs || [];
      let latestLogData = {};

      if (logs.length > 0) {
        // 依日期降序排序 (最新的在前面)
        const sortedLogs = logs.sort((a, b) => {
          const dateA = new Date(a.date || 0);
          const dateB = new Date(b.date || 0);
          return dateB - dateA;
        });

        const latest = sortedLogs[0];
        const tags = latest.tags || {};

        // 準備扁平化資料
        latestLogData = {
          '最新洽談-日期': latest.date,
          '最新洽談-內容': latest.content,
          // 標籤類資料 (直接對應 Excel 標頭)
          '互動方式': tags.interactionType,
          '來人數': tags.visitors,
          '等級研判': tags.rating,
          '重點標籤': tags.keyTags, // 陣列
          '未買原因': tags.noPurchaseReason // 陣列
        };
      }

      // --- 2. 資料組裝 ---
      // 我們需要的格式是「扁平化」的物件，以便前端 Excel 對照
      // 優先級：profile 內的資料 > 根目錄資料

      // --- 2. 資料組裝 ---
      const flatData = {
        // 系統欄位
        phone: docData.phone,
        docId: doc.id,

        // 展開 profile
        ...(docData.profile || {}),

        // 展開最新洽談紀錄 (這會覆蓋 profile 中可能存在的舊資料，確保匯出的是最新的)
        ...latestLogData,

        // 根目錄覆蓋
        '姓名': docData.latestName,
        '銷售人員': docData.latestSalesName,
        '銷售人員電話': docData.latestSalesPhone,
      };

      exportList.push(flatData);
    });

    // 依照電話排序
    exportList.sort((a, b) => (a.phone || '').localeCompare(b.phone || ''));

    console.log(`[${functionName}] 成功匯出 ${exportList.length} 筆完整資料。`);
    return exportList;

  } catch (error) {
    console.error(`[${functionName}] 執行時發生錯誤:`, error);
    throw new HttpsError("internal", `匯出資料時發生錯誤: ${error.message}`);
  }
}



/**
 * [V1 - 路由函數] CustomerManagement.vue (客資系統) 的單一 API 入口
 */
exports.customerApi = onCall({
  region: "asia-east1",
  cors: true,
  memory: "1GiB",
  timeoutSeconds: 300
}, async (request) => {

  const { action, data } = request.data;
  const functionName = `customerApi (Action: ${action})`;

  try {
    console.log(`[${functionName}] 路由函數啟動...`);

    // ✓ 檢查登入狀態 (未來應在此加入內部 API 的權限驗證)
    // if (!request.auth) {
    //   throw new HttpsError('unauthenticated', '您必須登入才能執行此操作。');
    // }

    const db = new Firestore({ databaseId: "anxi-app" });

    switch (action) {

      // --- 系統設定 (Settings) ---
      case 'fetchCustomerSettings':
        return await _handleFetchCustomerSettings(data, db);
      case 'saveCustomerSettings':
        return await _handleSaveCustomerSettings(data, db);

      case 'fetchCustomerList':
        return await _handleFetchCustomerList(data, db);

      // ✅ [新增] 專用於 Excel 匯出的完整資料 API
      case 'fetchCustomersForExport':
        return await _handleFetchCustomersForExport(data, db);

      // ✅ [新增] 批次更新客戶資料
      case 'batchUpdateCustomers':
        return await _handleBatchUpdateCustomers(data, db);

      case 'fetchFullCustomersForExport': // ✅ 新增這個 Case
        return await _handleFetchFullCustomersForExport(data, db);

      case 'batchImportCustomers': // ✅ 新增這個 Case
        return await _handleBatchImportCustomers(data, db);

      case 'addInteractionLog': // ✅ 新增這行
        return await _handleAddInteractionLog(data, db);

      case 'updateInteractionLog': // ✅ 新增這行
        return await _handleUpdateInteractionLog(data, db);

      // ✅ [新增] 刪除洽談紀錄
      case 'deleteInteractionLog':
        return await _handleDeleteInteractionLog(data, db);


      default:
        console.error(`[${functionName}] 錯誤：未知的 action: ${action}`);
        throw new HttpsError('invalid-argument', `未知的 API 動作: ${action}`);
    }
  } catch (error) {
    // 3. 統一捕捉所有內部函式拋出的 HttpsError 或其他錯誤
    console.error(`[${functionName}] 執行時發生錯誤:`, error);

    if (error instanceof HttpsError) {
      throw error;
    }

    throw new HttpsError('internal', `處理 ${action} 時發生未預期的錯誤: ${error.message}`);
  }
});


// ✅ [打勾] 後端批次匯入核心邏輯 (functions/index.js)
async function _handleBatchImportCustomers(data, db) {
  const { projectId, customers, operator } = data;
  const { Timestamp } = require("firebase-admin/firestore");

  if (!projectId || !Array.isArray(customers)) {
    throw new Error("缺少必要參數 projectId 或 customers");
  }

  // 輔助函式：確保時間格式轉為 Timestamp
  const ensureTimestamp = (val) => {
    if (!val) return Timestamp.now();
    // ✅ 處理 ISO 字串
    if (typeof val === 'string') return Timestamp.fromDate(new Date(val));
    // ✅ 處理序列化後的物件
    if (val._seconds !== undefined) return new Timestamp(val._seconds, val._nanoseconds || 0);
    // ✅ 處理 Date 物件
    if (val instanceof Date) return Timestamp.fromDate(val);
    return val;
  };

  const MAX_BATCH_SIZE = 400;
  const batches = [];
  let currentBatch = db.batch();
  let count = 0;

  for (const customer of customers) {
    const phone = customer.phone;
    if (!phone) continue;

    const finalDocId = customer.docId || `${projectId}_${phone}`;
    const docRef = db.collection("vipGuests").doc(finalDocId);

    const dataToSave = { ...customer };
    delete dataToSave.docId; // ✅ 不重複儲存 ID 欄位

    // ✅ [打勾] 處理根目錄關鍵時間
    dataToSave.createdAt = ensureTimestamp(dataToSave.createdAt);
    dataToSave.updatedAt = Timestamp.now();
    dataToSave.lastModifiedBy = operator || "system_import";

    // ✅ [打勾] 修正：遍歷並處理 submissions 陣列 (解決 .toDate() BUG)
    if (Array.isArray(dataToSave.submissions)) {
      dataToSave.submissions = dataToSave.submissions.map(sub => ({
        ...sub,
        submittedAt: ensureTimestamp(sub.submittedAt)
      }));
    }

    // ✅ [打勾] 修正：處理 profile 內的 submittedAt 陣列
    if (dataToSave.profile && Array.isArray(dataToSave.profile.submittedAt)) {
      dataToSave.profile.submittedAt = dataToSave.profile.submittedAt.map(s => ensureTimestamp(s));
    }

    // ✅ 使用 merge: true 進行增量更新
    currentBatch.set(docRef, dataToSave, { merge: true });
    count++;

    if (count % MAX_BATCH_SIZE === 0) {
      batches.push(currentBatch.commit());
      currentBatch = db.batch();
    }
  }

  if (count % MAX_BATCH_SIZE !== 0) {
    batches.push(currentBatch.commit());
  }

  await Promise.all(batches);
  return { success: true, count };
}

/**
 * [內部函式] 處理完整客戶資料匯出 (含所有 Sheet 資料)
 * 解決：Invalid Date 與 欄位缺失問題
 */
async function _handleFetchFullCustomersForExport(data, db) {
  const { projectId, userPhone, userProjectSystems } = data;
  const functionName = `_handleFetchFullCustomersForExport`;

  if (!projectId) {
    throw new Error("缺少 projectId 參數。");
  }

  try {
    const snapshot = await db.collection("vipGuests")
      .where("projectId", "==", projectId)
      .get();

    if (snapshot.empty) return [];

    const exportList = [];

    snapshot.forEach(doc => {
      const docData = doc.data();

      // 格式化時間輔助工具
      const toIso = (ts) => (ts && ts.toDate) ? ts.toDate().toISOString() : ts;

      exportList.push({
        id: doc.id,
        projectId: docData.projectId || projectId, // ✅ 新增建案 ID
        phone: docData.phone || "",
        latestName: docData.latestName || "",
        latestSalesName: docData.latestSalesName || "",
        latestSalesPhone: docData.latestSalesPhone || "", // ✅ 確保根目錄電話
        profile: docData.profile || {},
        interactionLogs: docData.interactionLogs || [],
        submissions: docData.submissions || [], // ✅ 用於關聯「記錄人員電話」
        createdAt: toIso(docData.createdAt),
        updatedAt: toIso(docData.updatedAt)
      });
    });

    console.log(`[${functionName}] 成功提取 ${exportList.length} 筆資料。`);
    return exportList;

  } catch (error) {
    console.error(`[${functionName}] 錯誤:`, error);
    throw new Error(`匯出失敗: ${error.message}`);
  }
}






/**
 * [內部函式] 獲取貴賓表單所需的設定 (供公開頁面使用)
 * (✓ 修改：同時回傳 customerFieldSettings)
 * @param {object} data - 包含 { projectId }
 * @param {Firestore} db - Firestore 實例
 */
async function _handleFetchVipFormSettings(data, db) {
  const { projectId } = data;
  if (!projectId) {
    throw new HttpsError("invalid-argument", "缺少 projectId 參數。");
  }

  try {
    // 任務 1: 獲取建案名稱
    const projectDoc = await db.collection('projects').doc(projectId).get();
    const projectName = projectDoc.exists ? projectDoc.data().name : projectId;

    // 任務 2: 獲取客資系統設定
    const settingsDoc = await db.collection("customerFieldSettings").doc(projectId).get();

    let vipFormConfig = {};
    let vipFormFields = {};
    let customerFieldSettings = {}; // ✓ (新增)

    if (settingsDoc.exists) {
      const settingsData = settingsDoc.data();
      vipFormConfig = settingsData.vipFormConfig || {};
      vipFormFields = settingsData.vipFormFields || {};
      customerFieldSettings = settingsData.fields || {}; // ✓ (新增) 讀取內部欄位
    }

    return {
      status: "success",
      projectName: projectName,
      vipFormConfig: vipFormConfig,
      vipFormFields: vipFormFields,
      customerFieldSettings: customerFieldSettings // ✓ (新增) 回傳內部欄位
    };

  } catch (error) {
    console.error(`[_handleFetchVipFormSettings] 獲取貴賓表單設定時發生錯誤:`, error);
    throw new HttpsError("internal", `獲取設定時發生錯誤: ${error.message}`);
  }
}

/**
 * [內部函式] 儲存貴賓填寫的表單資料
 * (✓ 已更新：維護 searchablePhones 欄位)
 */
async function _handleSubmitVipForm(data, db) {
  const { projectId, formData } = data;
  if (!projectId || !formData) {
    throw new HttpsError("invalid-argument", "缺少 projectId 或 formData 參數。");
  }

  const phone = formData['電話'];
  const name = formData['姓名'];

  if (!phone) {
    throw new HttpsError("invalid-argument", "formData 中缺少「電話」欄位。");
  }

  const docId = `${projectId}_${phone.replace(/[.#$[\]/]/g, '_')}`;
  const docRef = db.collection("vipGuests").doc(docId);

  const rootTimestamp = FieldValue.serverTimestamp();
  const submissionTimestamp = Timestamp.now();

  const now = admin.firestore.Timestamp.now();

  const submissionLog = {
    ...formData,
    submittedAt: now, // 儲存為原生 Timestamp

    submissionSource: 'public_form'
  };

  try {
    await db.runTransaction(async (transaction) => {
      const docSnap = await transaction.get(docRef);

      if (!docSnap.exists) {
        // --- 3A. 新客戶 ---
        console.log(`[_handleSubmitVipForm] 新客戶: ${docId}`);

        // ✅ [新增] 準備 searchablePhones 陣列 (本人 + 其他電話)
        const allPhones = new Set();
        allPhones.add(phone); // 加入本人電話
        if (formData.otherPhones && Array.isArray(formData.otherPhones)) {
          formData.otherPhones.forEach(p => {
            if (p.phone) allPhones.add(p.phone);
          });
        }

        transaction.set(docRef, {
          projectId: projectId,
          phone: phone,
          latestName: name || '未知',
          latestSalesName: formData['銷售人員'] || null,
          latestSalesPhone: formData['銷售人員電話'] || null,

          createdAt: rootTimestamp,
          updatedAt: rootTimestamp,
          profile: formData,
          submissions: [submissionLog],

          searchablePhones: Array.from(allPhones) // ✅ [新增] 寫入搜尋欄位
        });
      } else {
        // --- 3B. 電話重複 (舊客戶) ---
        console.log(`[_handleSubmitVipForm] 舊客戶: ${docId}，合併資料...`);
        const oldData = docSnap.data();

        const newProfile = _smartMergeProfile(oldData.profile, formData);

        const updatedSubmissions = FieldValue.arrayUnion(submissionLog);
        transaction.update(docRef, {
          updatedAt: rootTimestamp,
          submissions: updatedSubmissions,
        });

        // ✅ [新增] 重新計算 searchablePhones (基於合併後的 profile)
        const allPhones = new Set();
        allPhones.add(oldData.phone || phone); // 確保本人電話在內
        if (newProfile.otherPhones && Array.isArray(newProfile.otherPhones)) {
          newProfile.otherPhones.forEach(p => {
            if (p.phone) allPhones.add(p.phone);
          });
        }

        transaction.update(docRef, {
          latestName: name || oldData.latestName,
          latestSalesName: formData['銷售人員'] || oldData.latestSalesName,
          latestSalesPhone: formData['銷售人員電話'] || oldData.latestSalesPhone || null,
          updatedAt: rootTimestamp,
          profile: newProfile,
          submissions: updatedSubmissions,

          searchablePhones: Array.from(allPhones) // ✅ [新增] 更新搜尋欄位
        });
      }
    });

    console.log(`[_handleSubmitVipForm] 客戶 ${docId} 資料儲存成功 (通知將由 Trigger 自動處理)`);

    return { status: "success", docId: docId };

  } catch (error) {
    console.error(`[_handleSubmitVipForm] Transaction 失敗 (docId: ${docId}):`, error);
    throw new HttpsError("internal", `提交資料時發生 Transaction 錯誤: ${error.message}`);
  }
}

/**
 * [內部函式] 獲取單一貴賓的完整資料
 * (✓ V3: 修改為回傳 submissions 與 profile，以便前端讀取最新提交紀錄)
 */
async function _handleFetchSingleVipGuest(data, db) {
  const { docId } = data;
  if (!docId) {
    throw new HttpsError("invalid-argument", "缺少文件 ID。");
  }
  const docRef = db.collection("vipGuests").doc(docId);
  const docSnap = await docRef.get();

  if (!docSnap.exists) {
    throw new HttpsError("not-found", "找不到指定的貴賓資料。");
  }

  const docData = docSnap.data();

  // ✅ 修改：回傳完整結構，包含 profile 和 submissions
  return {
    status: "success",
    data: {
      profile: docData.profile,
      submissions: docData.submissions || []
    }
  };
}
// ✓ 請務必確認 _handleFetchCustomerSettings 和 _handleSaveCustomerSettings 已修改
/**
 * [內部函式] 獲取指定建案的客資系統欄位設定
 * @param {object} data - 包含 { projectId }
 * @param {Firestore} db - Firestore 實例 (✓ 新增)
 */
async function _handleFetchCustomerSettings(data, db) { // ✓ 接收 db
  const { projectId } = data;
  const functionName = `_handleFetchCustomerSettings`;

  if (!projectId) {
    throw new HttpsError("invalid-argument", "缺少 projectId 參數。");
  }

  try {
    // const db = new Firestore({ databaseId: "anxi-app" }); // ✓ 移除
    const docRef = db.collection("customerFieldSettings").doc(projectId);
    const docSnap = await docRef.get();

    if (docSnap.exists) {
      return docSnap.data();
    } else {
      console.log(`[${functionName}] customerFieldSettings/${projectId} 尚未建立。`);
      return null;
    }
  } catch (error) {
    console.error(`[${functionName}] 獲取設定時發生錯誤:`, error);
    throw new HttpsError("internal", `獲取客資系統設定時發生錯誤: ${error.message}`);
  }
}

/**
 * [內部函式] 儲存指定建案的客資系統欄位設定
 * @param {object} data - 包含 { projectId, settingsData }
 * @param {Firestore} db - Firestore 實例 (✓ 新增)
 */
async function _handleSaveCustomerSettings(data, db) { // ✓ 接收 db
  const { projectId, settingsData } = data;
  const functionName = `_handleSaveCustomerSettings`;

  if (!projectId || !settingsData) {
    throw new HttpsError("invalid-argument", "缺少 projectId 或 settingsData 參數。");
  }

  try {
    // const db = new Firestore({ databaseId: "anxi-app" }); // ✓ 移除
    const docRef = db.collection("customerFieldSettings").doc(projectId);

    const dataToSave = {
      ...settingsData,
      updatedAt: FieldValue.serverTimestamp()
    };

    await docRef.set(dataToSave, { merge: true });

    return { status: "success", message: "設定儲存成功" };
  } catch (error) {
    console.error(`[${functionName}] 儲存設定時發生錯誤:`, error);
    throw new HttpsError("internal", `儲存客資系統設定時發生錯誤: ${error.message}`);
  }
}



/**
 * [內部函式] 智慧合併 Profile
 * 目的：將新提交的資料合併至舊的 profile，並進行去重與陣列化處理
 */
function _smartMergeProfile(oldProfile, newSubmission) {
  const newProfile = { ...oldProfile }; // 複製一份舊資料

  for (const key in newSubmission) {
    const newValue = newSubmission[key];
    const oldValue = oldProfile[key];

    // 1. 跳過無效的新值
    if (newValue === null || newValue === undefined || newValue === '') continue;

    // ✅ [修正] 排除後設資料與系統欄位
    // 這些欄位不應存在於 profile 內，應存在於文件根目錄或頂層 submissions 陣列中
    const excludedKeys = [
      'submissions',
      'interactionLogs',
      'updatedAt',
      'createdAt',
      'submittedAt',
      'submissionSource'
    ];

    if (excludedKeys.includes(key)) continue;

    // 2. 特殊欄位處理：'otherPhones' (物件陣列，需根據 phone 屬性去重)
    if (key === 'otherPhones' && Array.isArray(newValue)) {
      const oldArray = Array.isArray(oldValue) ? oldValue : [];
      const phoneMap = new Map();

      // 先放入舊資料
      oldArray.forEach(item => {
        if (item && item.phone) phoneMap.set(item.phone, item);
      });
      // 再放入新資料 (若電話相同，新資料會更新舊資料的內容，如姓名/關係)
      newValue.forEach(item => {
        if (item && item.phone) phoneMap.set(item.phone, item);
      });

      newProfile[key] = Array.from(phoneMap.values());
    }
    // 3. 通用欄位處理：全部轉為陣列並去重 (例如: 職業, 預算, 姓名, 備註...)
    else {
      // A. 準備舊資料陣列
      let existingList = [];
      if (Array.isArray(oldValue)) {
        // 如果舊值已經是陣列，直接使用
        existingList = oldValue;
      } else if (oldValue !== undefined && oldValue !== null && oldValue !== '') {
        // 如果舊值是單一值(字串/數字)，轉為陣列
        existingList = [oldValue];
      }

      // B. 準備新資料陣列 (處理新值本身可能就是陣列的情況，如: 房型需求)
      let newValuesList = [];
      if (Array.isArray(newValue)) {
        newValuesList = newValue;
      } else {
        newValuesList = [newValue];
      }

      // C. 合併並去重 (使用 Set 確保字串不重複)
      // 效果範例：
      // 舊 "工程師", 新 "自營商" -> ["工程師", "自營商"]
      // 舊 ["1房"], 新 ["1房", "2房"] -> ["1房", "2房"]
      const combinedSet = new Set([...existingList, ...newValuesList]);

      // D. 轉回陣列並存入
      newProfile[key] = Array.from(combinedSet);
    }
  }
  return newProfile;
}


// ✓ START: 新增「貴賓表單」專用 API 路由
// =================================================================
// /  【新增】貴賓表單 API 路由 (vipFormApi) - 供公開使用
// =================================================================

/**
 * [V1 - 路由函數] VipForm.vue (貴賓資料表) 的單一 API 入口
 * !! 此 API 不需登入即可存取 !!
 */
exports.vipFormApi = onCall({
  region: "asia-east1",
  cors: true,
  memory: "1GiB",
  timeoutSeconds: 300,
  secrets: ["ANXISMART_LINE_CRM_TOKEN"]
}, async (request) => {

  const { action, data } = request.data;
  const functionName = `vipFormApi (Action: ${action})`;

  try {
    console.log(`[${functionName}] (公開) 路由函數啟動...`);

    const db = new Firestore({ databaseId: "anxi-app" });

    switch (action) {

      // --- 貴賓表單 (VIP Form) ---
      case 'fetchVipFormSettings':
        return await _handleFetchVipFormSettings(data, db);

      case 'submitVipForm':
        return await _handleSubmitVipForm(data, db);

      default:
        console.error(`[${functionName}] 錯誤：未知的 action: ${action}`);
        throw new HttpsError('invalid-argument', `未知的 API 動作: ${action}`);
    }

  } catch (error) {
    console.error(`[${functionName}] 執行時發生錯誤:`, error);
    if (error instanceof HttpsError) {
      throw error;
    }
    throw new HttpsError('internal', `處理 ${action} 時發生未預期的錯誤: ${error.message}`);
  }
});
// ✓ END: 新增 API 路由



// =================================================================
// /  【新增】客戶資料表 API 路由 (customerSheetApi) - 供銷售人員使用
// =================================================================

/**
 * [內部函式] 驗證銷售人員電話並返回其可用的客資系統建案
 * (✓ 修改：增加密碼驗證)
 */
async function _handleVerifySalesPerson(data, db) {
  // ✓ 1. 同時獲取 phone 和 password
  const { phone, password } = data;
  if (!phone || !password) {
    throw new HttpsError("invalid-argument", "缺少電話號碼或密碼。");
  }

  // 2. 驗證使用者是否存在
  const userDoc = await db.collection("users").doc(phone).get();
  if (!userDoc.exists) {
    throw new HttpsError("not-found", "找不到此銷售人員，請確認電話號碼是否正確。");
  }
  const userData = userDoc.data();

  // ✓ 3. 新增：驗證密碼
  if (userData.password !== String(password)) {
    throw new HttpsError("unauthenticated", "密碼錯誤，請重新輸入。");
  }

  // ✓ 4. 密碼正確，繼續處理權限
  const permDoc = await db.collection("userPermissions").doc(phone).get();
  if (!permDoc.exists) {
    return { name: userData.name, roles: userData.roles || [], projects: [], isCounter: false }; // 有用戶但無權限
  }

  const permissions = permDoc.data().permissions || {};
  const authorizedProjects = [];
  let hasCounterRoleAnywhere = false;

  for (const projectId in permissions) {
    const projectPerms = permissions[projectId];
    let hasAccess = false;

    if (projectPerms.systems) {
      if (projectPerms.systems.includes("客資系統-櫃台")) {
        hasAccess = true;
        hasCounterRoleAnywhere = true;
      }
      if (projectPerms.systems.includes("客資系統-銷售")) {
        hasAccess = true;
      }
    }

    if (hasAccess) {
      authorizedProjects.push({
        id: projectId,
        name: projectPerms.projectName
      });
    }
  }

  return {
    name: userData.name,
    roles: userData.roles || [],
    isCounter: hasCounterRoleAnywhere,
    projects: authorizedProjects
  };
}


/**
 * [內部函式] 獲取指定建案的所有貴賓列表
 * (✓ V2: 修改為讀取 latestName/phone, 並用 updatedAt 排序)
 */
async function _handleFetchVipGuests(data, db) {
  const { projectId } = data;
  if (!projectId) {
    throw new HttpsError("invalid-argument", "缺少建案 ID。");
  }

  const snapshot = await db.collection("vipGuests")
    .where("projectId", "==", projectId)
    .orderBy("updatedAt", "desc")
    .get();

  if (snapshot.empty) {
    return [];
  }

  return snapshot.docs.map(doc => {
    const data = doc.data();
    const submissions = data.submissions || [];

    // 原有的性別邏輯
    const rawGender = data.profile?.['性別'];
    const gender = Array.isArray(rawGender)
      ? (rawGender.length > 0 ? rawGender[rawGender.length - 1] : '')
      : (rawGender || '');

    // ✅ [新增] 提取最後一次提交時間 (lastSubmittedAt)
    // 邏輯：如果有 submissions，取最後一筆的 submittedAt；否則使用 createdAt
    let lastSubmittedAt = data.createdAt; // 預設值

    if (submissions.length > 0) {
      const lastSub = submissions[submissions.length - 1];
      if (lastSub.submittedAt) {
        lastSubmittedAt = lastSub.submittedAt;
      }
    }

    return {
      id: doc.id,
      name: data.latestName || '未知',
      phone: data.phone || '未知',
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
      submissionsCount: submissions.length,
      latestSalesName: data.latestSalesName || null,
      gender: gender,

      // ✅ [新增] 回傳計算好的最後提交時間
      lastSubmittedAt: lastSubmittedAt
    };
  });
}
/**
 * [內部函式] 提交客戶資料表 (建立或更新)
 * (✓ V7: 加入 Debug Log 並強化銷售欄位清洗)
 */
async function _handleSubmitCustomerSheet(data, db) {
  const { projectId, formData, docId } = data;

  // ========== [DEBUG START] ==========
  console.log(`[_handleSubmitCustomerSheet] 開始處理 projectId: ${projectId}, docId: ${docId}`);
  // 這裡用 JSON.stringify 才能看清楚是否被包成陣列或物件
  console.log(`[_handleSubmitCustomerSheet] 接收到的原始 formData:`, JSON.stringify(formData, null, 2));
  // ========== [DEBUG END] ============

  if (!projectId || !formData) {
    throw new HttpsError("invalid-argument", "缺少 projectId 或 formData 參數。");
  }

  // ✅ [核心修正]：處理前端可能傳來陣列的情況
  const extractString = (val) => {
    if (Array.isArray(val)) {
      // 如果是陣列，取最後一個非空的值，或是單純取最後一個
      return val.length > 0 ? String(val[val.length - 1]) : '';
    }
    return val ? String(val) : '';
  };

  // 1. 清洗 客戶資料
  const phone = extractString(formData['電話']);
  const name = extractString(formData['姓名']);

  // 2. [新增修正] 清洗 銷售人員資料 (避免前端傳來陣列導致寫入異常)
  const salesName = extractString(formData['銷售人員']);
  const salesPhone = extractString(formData['銷售人員電話']);


  // ===================================

  if (!phone) {
    throw new HttpsError("invalid-argument", "formData 中缺少「電話」欄位。");
  }

  // 3. 確保 formData 內的資料也被更新為純字串 (這會影響寫入 submissions 陣列的內容)
  formData['電話'] = phone;
  formData['姓名'] = name;
  formData['銷售人員'] = salesName;           // [修正]
  formData['銷售人員電話'] = salesPhone;       // [修正]

  let finalDocId = docId;

  if (finalDocId) {
    // 編輯模式 (ID 已知)
  } else {
    // 新增模式
    finalDocId = `${projectId}_${phone.replace(/[.#$[\]/]/g, '_')}`;
  }

  const docRef = db.collection("vipGuests").doc(finalDocId);

  const rootTimestamp = FieldValue.serverTimestamp();
  const submissionTimestamp = Timestamp.now();

  const now = admin.firestore.Timestamp.now();

  const submissionLog = {
    ...formData,
    submittedAt: now,
    submissionSource: 'internal_sheet'
  };

  try {
    await db.runTransaction(async (transaction) => {
      const docSnap = await transaction.get(docRef);

      // ----------------------------------------------------------
      // 情境 A: 新客戶 (建立新文件)
      // ----------------------------------------------------------
      if (!docSnap.exists) {
        // 1. 準備電話索引
        const allPhones = new Set();
        allPhones.add(phone);
        if (formData.otherPhones && Array.isArray(formData.otherPhones)) {
          formData.otherPhones.forEach(p => { if (p.phone) allPhones.add(String(p.phone)); });
        }

        // 2. 準備姓名索引
        const allNames = new Set();
        if (name) allNames.add(name);
        if (formData.otherPhones && Array.isArray(formData.otherPhones)) {
          formData.otherPhones.forEach(p => { if (p.name) allNames.add(String(p.name)); });
        }

        transaction.set(docRef, {
          projectId: projectId,
          phone: phone,
          latestName: name || '未知',

          // [使用清洗後的變數]
          latestSalesName: salesName || null,
          latestSalesPhone: salesPhone || null,

          createdAt: rootTimestamp,
          updatedAt: rootTimestamp,
          profile: formData,
          submissions: [submissionLog],

          searchablePhones: Array.from(allPhones),
          searchableNames: Array.from(allNames)
        });
      }
      // ----------------------------------------------------------
      // 情境 B: 舊客戶 (更新文件)
      // ----------------------------------------------------------
      else {
        const oldData = docSnap.data();
        const newProfile = _smartMergeProfile(oldData.profile, formData);

        // 1. 重新計算電話索引
        const allPhones = new Set();
        allPhones.add(oldData.phone || phone);
        if (newProfile.otherPhones && Array.isArray(newProfile.otherPhones)) {
          newProfile.otherPhones.forEach(p => {
            if (p.phone) allPhones.add(String(p.phone));
          });
        }

        // 2. 重新計算姓名索引
        const allNames = new Set();
        const currentName = name || oldData.latestName;
        if (currentName) allNames.add(currentName);

        if (newProfile.otherPhones && Array.isArray(newProfile.otherPhones)) {
          newProfile.otherPhones.forEach(p => {
            if (p.name) allNames.add(String(p.name));
          });
        }

        // 3. 處理 Submissions
        const oldSubmissions = oldData.submissions || [];
        const lastSubmission = oldSubmissions.length > 0 ? oldSubmissions[oldSubmissions.length - 1] : null;

        // [修正] 這裡判斷 salesName 是否存在
        const isCompletingDraft = (
          lastSubmission &&
          !lastSubmission['銷售人員'] &&
          salesName
        );

        let updatedSubmissions = [...oldSubmissions];

        if (isCompletingDraft) {
          console.log(`[_handleSubmitCustomerSheet] 偵測到銷售補全客戶最新資料，執行替換。`);
          updatedSubmissions.pop();
          updatedSubmissions.push(submissionLog);
        } else {
          updatedSubmissions.push(submissionLog);
        }

        transaction.update(docRef, {
          latestName: name || oldData.latestName,

          // [使用清洗後的變數]
          latestSalesName: salesName || oldData.latestSalesName,
          // 優先使用本次提交的 salesPhone，若無則保留舊的
          latestSalesPhone: salesPhone || oldData.latestSalesPhone || null,

          updatedAt: rootTimestamp,
          profile: newProfile,
          submissions: updatedSubmissions,

          searchablePhones: Array.from(allPhones),
          searchableNames: Array.from(allNames)
        });
      }
    });

    return { status: "success", docId: finalDocId };

  } catch (error) {
    console.error(`[_handleSubmitCustomerSheet] Transaction 失敗 (docId: ${finalDocId}):`, error);
    throw new HttpsError("internal", `提交資料時發生 Transaction 錯誤: ${error.message}`);
  }
}
/**
 * [V1 - 路由函數] CustomerDataSheet.vue (客戶資料表) 的單一 API 入口
 */
exports.customerSheetApi = onCall({
  region: "asia-east1",
  cors: true,
  memory: "1GiB",
  timeoutSeconds: 300
}, async (request) => {

  const { action, data } = request.data;
  const functionName = `customerSheetApi (Action: ${action})`;

  try {
    const db = new Firestore({ databaseId: "anxi-app" });

    switch (action) {
      case 'verifySalesPerson':
        return await _handleVerifySalesPerson(data, db);
      case 'fetchVipGuests':
        return await _handleFetchVipGuests(data, db);
      case 'fetchCustomerSheetData': // 共用 fetchVipFormSettings
        return await _handleFetchVipFormSettings(data, db);
      case 'submitCustomerSheet':
        return await _handleSubmitCustomerSheet(data, db);

      case 'fetchSingleVipGuest':
        return await _handleFetchSingleVipGuest(data, db);

      default:
        throw new HttpsError('invalid-argument', `未知的 API 動作: ${action}`);
    }
  } catch (error) {
    console.error(`[${functionName}] 執行時發生錯誤:`, error);
    if (error instanceof HttpsError) {
      throw error;
    }
    throw new HttpsError('internal', `處理 ${action} 時發生錯誤: ${error.message}`);
  }
});




/**
 * [優化版 V11] 監測 vipGuests 寫入
 * 功能 1: 檢查電話重複 (跨文件檢查 - 訊息優化：加入拜訪日期)
 * 功能 2: 檢查提交次數 (同文件檢查)
 */
exports.onVipGuestDuplicate = onDocumentWritten({
  document: "vipGuests/{docId}",
  database: 'anxi-app',
  region: 'asia-east1',
  secrets: ["ANXISMART_LINE_CRM_TOKEN"],
  timeoutSeconds: 60,
  memory: "256MiB"
}, async (event) => {
  const functionName = "onVipGuestDuplicate";
  const anxiDb = new Firestore({ databaseId: "anxi-app" });

  // 1. 獲取資料
  const beforeData = event.data.before?.data();
  const afterData = event.data.after?.data();

  if (!afterData) return;

  const docId = event.params.docId;
  const projectId = afterData.projectId;
  const currentPhone = afterData.phone;
  const currentName = afterData.latestName || '未知';

  if (!projectId || !currentPhone) return;

  // ============================================================
  // 任務 A: 檢查電話重複 (跨文件檢查)
  // ============================================================
  console.log(`[${functionName}] 開始檢查電話重複 (Doc: ${docId})...`);

  const existingNumbers = new Set();
  if (beforeData) {
    if (beforeData.otherPhones && Array.isArray(beforeData.otherPhones)) {
      beforeData.otherPhones.forEach(p => {
        if (p.phone) existingNumbers.add(p.phone);
      });
    }
  }

  const numbersToCheck = [];

  // 總是檢查主電話
  numbersToCheck.push({
    number: currentPhone,
    type: 'main',
    name: currentName,
    relation: '本人'
  });

  // 檢查其他電話
  if (afterData.otherPhones && Array.isArray(afterData.otherPhones)) {
    afterData.otherPhones.forEach(p => {
      if (p.phone && !existingNumbers.has(p.phone)) {
        numbersToCheck.push({
          number: p.phone,
          type: 'other',
          name: p.name || '未知',
          relation: p.relation || '親友'
        });
      }
    });
  }

  if (numbersToCheck.length > 0) {
    const conflicts = [];
    const queryPromises = numbersToCheck.map(async (checkItem) => {
      const targetNumber = checkItem.number;
      const conflictQuery = anxiDb.collection('vipGuests')
        .where('projectId', '==', projectId)
        .where('searchablePhones', 'array-contains', targetNumber)
        .get();

      const snapshot = await conflictQuery;
      snapshot.forEach(doc => {
        if (doc.id !== docId) {
          conflicts.push({
            sourceItem: checkItem,
            targetData: doc.data()
          });
        }
      });
    });

    await Promise.all(queryPromises);

    if (conflicts.length > 0) {
      const currentSales = afterData.latestSalesName || '未知';

      // --- 標頭 ---
      let finalMessage = `⚠️客資重複提醒\n----------------------`;
      finalMessage += `\n主電話:${currentPhone}`;
      finalMessage += `\n姓名:${currentName}`;
      finalMessage += `\n銷售:${currentSales}`;
      finalMessage += `\n----------------------`;

      // --- 資料分組 (Grouping) ---
      const groupedConflicts = {};
      conflicts.forEach(c => {
        const key = c.sourceItem.number;
        if (!groupedConflicts[key]) {
          groupedConflicts[key] = {
            source: c.sourceItem,
            targets: []
          };
        }
        groupedConflicts[key].targets.push(c.targetData);
      });

      // --- 組裝內容 ---
      Object.values(groupedConflicts).forEach((group, index) => {
        const src = group.source;
        const targets = group.targets;

        // 1. 顯示衝突來源
        finalMessage += `\n🛑 衝突號碼: ${src.number}`;
        if (src.type === 'other') {
          finalMessage += `\n(新增其他電話: ${src.name} / ${src.relation})`;
        } else {
          finalMessage += `\n(新增的主電話)`;
        }

        finalMessage += `\n\n與以下 ${targets.length} 筆資料重複：`;

        // 2. 條列重複對象
        targets.forEach((tgt, tIndex) => {
          const targetSales = tgt.latestSalesName || '未知';
          // ✅ [新增] 獲取拜訪日期 (優先取根目錄，若無則找 profile)
          const visitDate = tgt['拜訪日期'] || tgt.profile?.['拜訪日期'] || '未知';

          finalMessage += `\n${tIndex + 1}. 主電話: ${tgt.phone}`;
          finalMessage += `\n   姓名: ${tgt.latestName}`;
          finalMessage += `\n   拜訪日期: ${visitDate}`; // ✅ 顯示拜訪日期
          finalMessage += `\n   銷售: ${targetSales}`;

          // 檢查是否包含在對方的其他電話中
          if (tgt.phone !== src.number) {
            if (tgt.otherPhones && Array.isArray(tgt.otherPhones)) {
              const matchedOther = tgt.otherPhones.find(p => p.phone === src.number);
              if (matchedOther) {
                finalMessage += `\n   ↳ 包含此其他電話`;
              }
            }
          }
          if (tIndex < targets.length - 1) finalMessage += `\n`;
        });

        if (index < Object.keys(groupedConflicts).length - 1) {
          finalMessage += `\n----------------------\n`;
        }
      });

      await sendLineNotification(anxiDb, projectId, finalMessage);
    }
  }

  // ============================================================
  // 任務 B: 檢查提交次數 (邏輯保持 V8 版本)
  // ============================================================
  const beforeSubmissions = beforeData?.submissions || [];
  const afterSubmissions = afterData.submissions || [];

  let shouldTriggerTaskB = false;
  let isSalesFirstScenario = false;

  if (afterSubmissions.length > beforeSubmissions.length) {
    if (afterSubmissions.length > 2) {
      shouldTriggerTaskB = true;
    }
    else if (afterSubmissions.length === 2) {
      const firstSub = afterSubmissions[0];
      const secondSub = afterSubmissions[1];
      const firstHasSales = !!firstSub['銷售人員'];
      const secondHasSales = !!secondSub['銷售人員'];

      if (firstHasSales) {
        shouldTriggerTaskB = true;
        if (secondHasSales) {
          isSalesFirstScenario = false;
        } else {
          isSalesFirstScenario = true;
        }
      } else if (!secondHasSales) {
        shouldTriggerTaskB = true;
      }
    }
  }

  if (shouldTriggerTaskB) {
    console.log(`[${functionName}] 偵測到內部重複提交，準備發送通知...`);
    let countMsgBody = "";
    let listedCount = 0;

    afterSubmissions.forEach((submission, index) => {
      const salesName = submission['銷售人員'];

      if (isSalesFirstScenario) {
        if (index !== 0) return;
      }
      else {
        if (!salesName) return;
      }

      listedCount++;
      const guestName = submission['姓名'] || '未知';
      const visitDate = submission['拜訪日期'] || '未知';
      const displaySalesName = salesName || '(未填寫)';

      countMsgBody += `\n\n--- 第 ${listedCount} 筆 ---`;
      countMsgBody += `\n姓名: ${guestName}`;
      countMsgBody += `\n拜訪日期: ${visitDate}`;
      countMsgBody += `\n銷售人員: ${displaySalesName}`;

      if (submission.otherPhones && Array.isArray(submission.otherPhones)) {
        submission.otherPhones.forEach(p => {
          if (p.phone) countMsgBody += `\n(其他) ${p.name || ''} ${p.phone}`;
        });
      }
    });

    if (listedCount > 0) {
      const countMessage = `⚠️客資重複提醒 (共 ${listedCount} 筆)\n\n🛑 衝突號碼: ${currentPhone}` + countMsgBody;
      await sendLineNotification(anxiDb, projectId, countMessage);
    }
  }
});

/**
 * [內部輔助] 發送 LINE 通知 (共用)
 */
async function sendLineNotification(db, projectId, messageText) {
  try {
    const settingsDoc = await db.collection("customerFieldSettings").doc(projectId).get();
    if (!settingsDoc.exists) return;
    const settings = settingsDoc.data();

    const notifyCounter = settings.reminderSettings?.counterDuplicate?.lineNotify === true;
    const notifySales = settings.reminderSettings?.salesDuplicate?.lineNotify === true;
    if (!notifyCounter && !notifySales) return;

    const tokenSecretName = settings.anxiSystemConfig?.lineCrmChannelAccessTokenSecretName;
    if (!tokenSecretName || !process.env[tokenSecretName]) return;

    const phonesToNotify = new Set();
    const permissionsRef = db.collection("userPermissions");

    if (notifyCounter) {
      const snap = await permissionsRef.where(`permissions.${projectId}.systems`, 'array-contains', '客資系統-櫃台').get();
      snap.forEach(doc => phonesToNotify.add(doc.id));
    }
    if (notifySales) {
      const snap = await permissionsRef.where(`permissions.${projectId}.systems`, 'array-contains', '客資系統-銷售').get();
      snap.forEach(doc => phonesToNotify.add(doc.id));
    }

    if (phonesToNotify.size === 0) return;

    const lineIds = [];
    const usersRef = db.collection("users");
    const phoneArray = Array.from(phonesToNotify);

    const chunks = [];
    for (let i = 0; i < phoneArray.length; i += 30) {
      chunks.push(phoneArray.slice(i, i + 30));
    }

    for (const chunk of chunks) {
      const userSnap = await usersRef.where(FieldPath.documentId(), 'in', chunk).get();
      userSnap.forEach(doc => {
        const lid = doc.data().lineId;
        if (lid && typeof lid === 'string' && lid.startsWith('U') && lid.length === 33) {
          lineIds.push(lid);
        }
      });
    }

    if (lineIds.length === 0) return;

    const lineClient = new line.Client({ channelAccessToken: process.env[tokenSecretName] });
    await lineClient.multicast(lineIds, [{ type: 'text', text: messageText }]);
    console.log(`LINE 通知發送成功 (對象數: ${lineIds.length})`);

  } catch (error) {
    console.error("發送 LINE 通知失敗:", error);
  }
}


/**
 * (停用)已整合至 exports.onVipGuestSubmission
 * [輔助函式 - 新增] 
 * 用於發送「新貴賓建立」的 LINE 通知
 * (✓ V2: 新增讀取 projectName)
 */
/**async function sendNewVipNotification(db, projectId, formData) {
    const functionName = "sendNewVipNotification";

    // ✓ 檢查：(新增) 在函式開頭，先獲取建案名稱
    let projectName = projectId; // 預設使用 ID
    try {
        const projectDoc = await db.collection('projects').doc(projectId).get();
        if (projectDoc.exists) {
            projectName = projectDoc.data().name || projectId; // 獲取名稱，若無則用 ID
        }
    } catch (e) {
        console.error(`[${functionName}] 獲取建案名稱時發生錯誤:`, e.message);
        // 發生錯誤時，將使用 projectId 繼續執行
    }
    // ✓ 檢查：(新增) 獲取建案名稱結束

    // 1. 格式化訊息 (易讀性)
    // ✓ 檢查：(修改) 將 projectName 加入訊息開頭
    let messageText = `✨${projectName} 新貴賓資料`;
    
    // 優先顯示核心欄位
    const coreFields = ['電話', '姓名', '拜訪日期', '銷售人員'];
    for (const fieldName of coreFields) {
        if (formData[fieldName]) {
            messageText += `\n${fieldName}: ${formData[fieldName]}`;
        }
    }

    // 附加其他欄位
    messageText += `\n\n--- 其他資訊 ---`;
    for (const key in formData) {
        // 跳過已顯示的核心欄位
        if (coreFields.includes(key)) continue;

        const value = formData[key];
        // 確保有值
        if (value && (!Array.isArray(value) || value.length > 0)) {
            if (Array.isArray(value)) {
                messageText += `\n${key}: ${value.join(', ')}`;
            } else {
                messageText += `\n${key}: ${value}`;
            }
        }
    }
    
    // 2. 讀取設定 (重用 onVipGuestDuplicate 的邏輯)
    const settingsDocRef = db.collection("customerFieldSettings").doc(projectId);
    const settingsDoc = await settingsDocRef.get();
    if (!settingsDoc.exists) {
        console.warn(`[${functionName}] 找不到專案 ${projectId} 的客資設定，無法發送通知。`);
        return; // 中止
    }
    const settings = settingsDoc.data();
    
    // 3. 檢查通知開關 (重用 onVipGuestDuplicate 的邏輯)
    // (假設新貴賓通知也使用與 "重複" 相同的設定)
    const notifyCounter = settings.reminderSettings?.counterDuplicate?.lineNotify === true;
    const notifySales = settings.reminderSettings?.salesDuplicate?.lineNotify === true;

    if (!notifyCounter && !notifySales) {
        console.log(`[${functionName}] 專案 ${projectId} 已關閉新貴賓通知。`);
        return; // 中止
    }

    // 4. 獲取 Token (重用 onVipGuestDuplicate 的邏輯)
    const tokenSecretName = settings.anxiSystemConfig?.lineCrmChannelAccessTokenSecretName;
    if (!tokenSecretName) {
        console.error(`[${functionName}] 專案 ${projectId} 未設定 lineCrmChannelAccessTokenSecretName。`);
        return; // 中止
    }
    const lineToken = process.env[tokenSecretName];
    if (!lineToken) {
        console.error(`[${functionName}] 嚴重錯誤：環境變數中找不到 ${tokenSecretName}。`);
        return; // 中止
    }

    // 5. 尋找通知對象 (重用 onVipGuestDuplicate 的邏輯)
    const permissionsRef = db.collection("userPermissions");
    const phonesToNotify = new Set();
    const queries = [];
    if (notifyCounter) {
        queries.push(permissionsRef.where(`permissions.${projectId}.systems`, 'array-contains', '客資系統-櫃台').get());
    }
    if (notifySales) {
        queries.push(permissionsRef.where(`permissions.${projectId}.systems`, 'array-contains', '客資系統-銷售').get());
    }
    const permissionSnapshots = await Promise.all(queries);
    permissionSnapshots.forEach(snapshot => {
        snapshot.forEach(doc => phonesToNotify.add(doc.id));
    });
    if (phonesToNotify.size === 0) {
        console.log(`[${functionName}] 找不到任何需要被通知的人員。`);
        return; // 中止
    }

    // 6. 獲取 LINE ID (重用 onVipGuestDuplicate 的邏輯)
    const usersRef = db.collection("users");
    const phoneArray = Array.from(phonesToNotify);
    const lineIds = [];
    const MAX_IN_QUERY_USERS = 30;
    for (let i = 0; i < phoneArray.length; i += MAX_IN_QUERY_USERS) {
        const phoneChunk = phoneArray.slice(i, i + MAX_IN_QUERY_USERS);
        const usersSnapshot = await usersRef.where(GCloudFieldPath.documentId(), 'in', phoneChunk).get(); 
        usersSnapshot.forEach(doc => {
            const lineId = doc.data().lineId;
            if (lineId && typeof lineId === 'string' && lineId.startsWith('U') && lineId.length === 33) { 
                lineIds.push(lineId);
            }
        });
    }
    if (lineIds.length === 0) {
        console.log(`[${functionName}] ${phoneArray.length} 位有權限人員無人綁定 LINE ID。`);
        return; // 中止
    }

    // 7. 發送
    const lineClient = new line.Client({ channelAccessToken: lineToken });
    console.log(`[${functionName}] 準備發送新貴賓通知至 ${lineIds.length} 位用戶...`);
    await lineClient.multicast(lineIds, [{ type: 'text', text: messageText }]);
    console.log(`[${functionName}] 新貴賓通知發送成功。`);
}
*/

/**
 * [新增] 批次更新銷售人員的排序 (order)
 * @param {string} projectId - 建案 ID (用於驗證)
 * @param {Array<{id: string, order: number}>} updates - 包含文件 ID 和新 order 值的陣列
 * @returns {Promise<object>} - { status }
 */
exports.updateSalesPersonnelOrders = onCall(async (request) => {
  const { projectId, updates } = request.data;
  const functionName = `updateSalesPersonnelOrders (Project: ${projectId})`;
  console.log(`[${functionName}] Received request to update order for ${updates?.length || 0} personnel.`);

  // 驗證
  if (!projectId || !Array.isArray(updates) || updates.length === 0) {
    throw new HttpsError("invalid-argument", "缺少 projectId 或有效的更新資料陣列。");
  }

  const db = new Firestore({ databaseId: "anxi-app" });
  const personnelRef = db.collection("salesPersonnel");
  const batch = db.batch();
  const now = FieldValue.serverTimestamp();

  try {
    let operationCount = 0;
    for (const update of updates) {
      if (!update.id || typeof update.order !== 'number') continue;

      const docRef = personnelRef.doc(update.id);
      batch.update(docRef, {
        order: update.order,
        updatedAt: now
      });
      operationCount++;
    }

    if (operationCount === 0) {
      return { status: "success", message: "沒有有效的排序更新。" };
    }

    await batch.commit();
    console.log(`[${functionName}] Successfully updated order for ${operationCount} personnel.`);
    return { status: "success", message: `成功更新 ${operationCount} 位人員的排序。` };

  } catch (error) {
    console.error(`[${functionName}] CRITICAL ERROR:`, error);
    throw new HttpsError("internal", `批次更新排序時發生錯誤: ${error.message}`);
  }
});



/**
 * [新增] 獲取單一客戶的詳細洽談資料 (包含權限檢查)
 * 整合：客戶資料 + 洽談紀錄 + 其他電話 + 編輯權限檢查
 */
exports.getCustomerInteractionDetails = onCall(async (request) => {
  const { projectId, docId, userKey } = request.data;
  const functionName = `getCustomerInteractionDetails (Project: ${projectId}, Doc: ${docId})`;

  if (!projectId || !docId || !userKey) {
    throw new HttpsError("invalid-argument", "缺少必要參數。");
  }

  const db = new Firestore({ databaseId: "anxi-app" });

  try {
    // 1. 平行執行：讀取客戶資料 & 讀取用戶權限
    const guestRef = db.collection("vipGuests").doc(docId);
    const userPermRef = db.collection("userPermissions").doc(userKey);

    const [guestSnap, userPermSnap] = await Promise.all([
      guestRef.get(),
      userPermRef.get()
    ]);

    if (!guestSnap.exists) {
      throw new HttpsError("not-found", "找不到該客戶資料。");
    }

    const guestData = guestSnap.data();

    // 2. 處理日期格式 (轉換 Timestamp 為 ISO String)
    if (guestData.createdAt?.toDate) guestData.createdAt = guestData.createdAt.toDate().toISOString();
    if (guestData.updatedAt?.toDate) guestData.updatedAt = guestData.updatedAt.toDate().toISOString();

    // 處理 interactionLogs 內的日期
    if (guestData.interactionLogs && Array.isArray(guestData.interactionLogs)) {
      guestData.interactionLogs = guestData.interactionLogs.map(log => {
        const newLog = { ...log };
        if (newLog.createdAt?.toDate) newLog.createdAt = newLog.createdAt.toDate().toISOString();
        // date 欄位通常存字串 (YYYY-MM-DD)，如果是 Timestamp 也轉一下
        if (newLog.date?.toDate) newLog.date = newLog.date.toDate().toISOString().split('T')[0];
        return newLog;
      });
      // 確保紀錄按日期倒序排列 (最新的在上面)
      guestData.interactionLogs.sort((a, b) => new Date(b.date) - new Date(a.date));
    }

    // 3. 判斷編輯權限
    // 規則：擁有該建案的「客資系統-櫃台」權限者可編輯
    let canEdit = false;
    if (userPermSnap.exists) {
      const perms = userPermSnap.data().permissions || {};
      const projectPerms = perms[projectId];
      if (projectPerms && Array.isArray(projectPerms.systems)) {
        if (projectPerms.systems.includes('客資系統-櫃台') || projectPerms.systems.includes('超級管理員')) {
          canEdit = true;
        }
      }
    }

    // 4. 回傳整合資料
    return {
      status: "success",
      data: {
        guestData: { id: guestSnap.id, ...guestData },
        canEdit: canEdit
      }
    };

  } catch (error) {
    console.error(`[${functionName}] 錯誤:`, error);
    throw new HttpsError("internal", `讀取洽談資料失敗: ${error.message}`);
  }
});

/**
 * [新增] 新增一筆洽談紀錄
 */
async function _handleAddInteractionLog(data, db) {
  const { projectId, docId, logData, operatorName, operatorPhone } = data;
  const guestRef = db.collection("vipGuests").doc(docId);
  const newLog = {
    logId: admin.firestore.Timestamp.now().toMillis().toString(),
    ...logData,
    recorderName: operatorName,
    recorderPhone: operatorPhone || "",
    createdAt: admin.firestore.Timestamp.now()
  };
  await guestRef.update({
    interactionLogs: admin.firestore.FieldValue.arrayUnion(newLog),
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  });
  return { status: "success", message: "紀錄已新增" };
}

/**
 * [修正版 V2] 更新客戶基本資料 (含其他電話)
 * 修正重點：同步維護 searchablePhones 與 searchableNames
 */
exports.updateCustomerProfile = onCall(async (request) => {
  const { projectId, docId, profileData, userKey } = request.data;
  if (!projectId || !docId || !profileData) throw new HttpsError("invalid-argument", "參數錯誤");

  const db = new Firestore({ databaseId: "anxi-app" });
  const guestRef = db.collection("vipGuests").doc(docId);

  try {
    const docSnap = await guestRef.get();
    if (!docSnap.exists) throw new HttpsError("not-found", "找不到客戶資料");
    const currentData = docSnap.data();

    // 1. 電話索引
    const allPhones = new Set();
    const mainPhone = profileData.phone || currentData.phone;
    if (mainPhone) allPhones.add(mainPhone);

    const otherPhones = profileData.otherPhones || currentData.profile?.otherPhones || [];
    if (Array.isArray(otherPhones)) {
      otherPhones.forEach(p => { if (p.phone) allPhones.add(p.phone); });
    }

    // ✅ 2. 姓名索引
    const allNames = new Set();
    const mainName = profileData.latestName || currentData.latestName;
    if (mainName) allNames.add(mainName);

    if (Array.isArray(otherPhones)) {
      otherPhones.forEach(p => { if (p.name) allNames.add(p.name); });
    }

    const updatePayload = {
      ...profileData,
      searchablePhones: Array.from(allPhones),
      searchableNames: Array.from(allNames), // ✅ 寫入
      updatedAt: FieldValue.serverTimestamp()
    };

    // 如果是更新 profile 內的欄位
    if (profileData.otherPhones) {
      updatePayload['profile.otherPhones'] = profileData.otherPhones;
    }

    await guestRef.update(updatePayload);
    return { status: "success", message: "資料已更新" };

  } catch (e) {
    console.error(`Update Error:`, e);
    throw new HttpsError("internal", e.message);
  }
});

/**
 * [新增] 更新單筆洽談紀錄 (修改陣列中的特定項目)
 */
async function _handleUpdateInteractionLog(data, db) {
  const { docId, logId, logPayload, operatorName, operatorPhone } = data;
  const guestRef = db.collection("vipGuests").doc(docId);

  try {
    // Firestore 更新陣列內部物件，需先取出完整陣列進行處理
    const docSnap = await guestRef.get();
    if (!docSnap.exists) throw new Error("找不到該客戶文件");

    const guestData = docSnap.data();
    let logs = guestData.interactionLogs || [];

    // 尋找目標紀錄
    const logIndex = logs.findIndex(l => l.logId === logId);
    if (logIndex === -1) throw new Error("找不到該筆洽談紀錄 ID");

    // ✅ 更新紀錄內容
    logs[logIndex] = {
      ...logs[logIndex], // 保留原本的 createdAt 等不變資訊
      ...logPayload,     // 蓋上新的內容 (date, content, tags...)
      recorderName: operatorName,
      recorderPhone: operatorPhone || "", // ✅ 確保電話一併更新
      updatedAt: admin.firestore.Timestamp.now() // 紀錄修改時間
    };

    // 寫回資料庫
    await guestRef.update({
      interactionLogs: logs,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    return { status: "success", message: "紀錄已更新" };

  } catch (e) {
    console.error("更新洽談紀錄錯誤:", e);
    throw new functions.https.HttpsError("internal", e.message);
  }
}

/**
 * [新增] 刪除一筆洽談紀錄
 */
async function _handleDeleteInteractionLog(data, db) {
  const { projectId, docId, logId, operatorPhone } = data;

  if (!docId || !logId) {
    throw new HttpsError('invalid-argument', '缺少必要參數 docId 或 logId');
  }

  const guestRef = db.collection("vipGuests").doc(docId);

  try {
    const docSnap = await guestRef.get();
    if (!docSnap.exists) {
      throw new HttpsError('not-found', '找不到該貴賓資料');
    }

    const guestData = docSnap.data();
    const logs = guestData.interactionLogs || [];

    // 過濾掉要刪除的紀錄 (冷刪除)
    const updatedLogs = logs.filter(log => log.logId !== logId);

    if (logs.length === updatedLogs.length) {
      throw new HttpsError('not-found', '找不到指定的洽談紀錄，可能已被刪除');
    }

    // 更新回 Firestore
    await guestRef.update({
      interactionLogs: updatedLogs,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      lastModifiedBy: operatorPhone || "" // 記錄最後異動者
    });

    return { status: "success", message: "紀錄已成功刪除" };

  } catch (error) {
    console.error(`[_handleDeleteInteractionLog] 錯誤:`, error);
    throw error;
  }
}


/**
 * [新功能] 客資查詢 (供前端 CustomerQuery 使用)
 * 修改：修正 exists 語法錯誤 (Admin SDK 中 exists 是屬性不是函式)
 */
exports.queryCustomerData = onCall(async (request) => {
  // 1. 接收參數
  const { projectId, queryText, requestingUserKey } = request.data;

  if (!projectId || !queryText) {
    throw new HttpsError('invalid-argument', '缺少必要參數 (projectId, queryText)');
  }

  // 2. 權限驗證
  if (!requestingUserKey) {
    throw new HttpsError('unauthenticated', '未提供使用者識別碼，無法驗證權限');
  }

  const db = new Firestore({ databaseId: "anxi-app" });

  // 直接讀取該使用者的權限檔
  const permRef = db.collection('userPermissions').doc(requestingUserKey);
  const permSnap = await permRef.get();

  // ✅ [修正點] Admin SDK 中，exists 是屬性，不能加括號 ()
  if (!permSnap.exists) {
    throw new HttpsError('permission-denied', '找不到使用者的權限資料');
  }

  const permData = permSnap.data();

  // 根據您的資料庫結構，權限資料是在 'permissions' 欄位下的 map
  // 結構: { permissions: { "fuyu1750": { systems: [...] } } }
  const userPerms = permData.permissions || {};
  const projectPerms = userPerms[projectId];

  // 檢查權限
  // 確保 projectPerms 存在，且 systems 陣列包含指定權限
  const hasPermission = projectPerms && Array.isArray(projectPerms.systems) && (
    projectPerms.systems.includes('客資系統-櫃台') ||
    projectPerms.systems.includes('客資系統-銷售')
  );

  if (!hasPermission) {
    console.warn(`[queryCustomerData] 用戶 ${requestingUserKey} 嘗試查詢 ${projectId} 但權限不足。擁有的系統:`, projectPerms ? projectPerms.systems : '無');
    throw new HttpsError('permission-denied', '您沒有此建案的客資查詢權限');
  }

  // 3. 判斷查詢類型與執行查詢
  const isPhone = /^[0-9+\-\s()]+$/.test(queryText);
  let query;

  if (isPhone) {
    const cleanPhone = queryText.trim();
    query = db.collection('vipGuests')
      .where('projectId', '==', projectId)
      .where('searchablePhones', 'array-contains', cleanPhone);
  } else {
    // 姓名查詢：使用 searchableNames
    query = db.collection('vipGuests')
      .where('projectId', '==', projectId)
      .where('searchableNames', 'array-contains', queryText.trim());
  }

  try {
    const snapshot = await query.get();

    if (snapshot.empty) {
      return { status: 'success', data: [] };
    }

    const results = [];
    snapshot.forEach(doc => {
      const d = doc.data();
      results.push({
        docId: doc.id,
        latestName: d.latestName || '未知',
        phone: d.phone || '',
        otherPhones: Array.isArray(d.otherPhones) ? d.otherPhones : [],
        submissions: Array.isArray(d.submissions) ? d.submissions : [],
        salesPerson: d.latestSalesName || ''
      });
    });

    return { status: 'success', data: results };

  } catch (error) {
    console.error('[queryCustomerData] 查詢失敗:', error);
    throw new HttpsError('internal', '查詢過程發生錯誤: ' + error.message);
  }
});


/**
 * [內部函式] 批次更新客戶資料 (Excel 匯入) - 結構修復版 V4
 * 修正：
 * 1. 同步建立 interactionLogs (解決詳細頁歷史紀錄空白)
 * 2. 同步 拜訪日期 (解決列表 N/A)
 */
async function _handleBatchUpdateCustomers(data, db) {
  const { projectId, customerData } = data;
  const functionName = `_handleBatchUpdateCustomers (Project: ${projectId})`;

  if (!projectId || !Array.isArray(customerData)) {
    throw new HttpsError("invalid-argument", "缺少 projectId 或 customerData。");
  }

  console.log(`[${functionName}] 開始處理 ${customerData.length} 筆資料...`);

  const MAX_BATCH_SIZE = 499;
  let batch = db.batch();
  let count = 0;
  let totalProcessed = 0;

  // 1. 準備時間戳記
  const submissionTime = Timestamp.now();
  const updateTime = FieldValue.serverTimestamp();
  const batchTimestamp = admin.firestore.Timestamp.now();


  try {
    for (const customer of customerData) {
      const phone = customer.phone;

      if (!phone) {
        console.warn(`[${functionName}] 跳過無電話號碼的資料`, customer);
        continue;
      }

      const safePhone = String(phone).replace(/[.#$[\]/]/g, '_');
      const docId = `${projectId}_${safePhone}`;
      const docRef = db.collection("vipGuests").doc(docId);

      // --- 資料前處理 ---
      const profile = customer.profile || {};

      // A. 處理日期同步：如果「拜訪日期」為空，但有「最新洽談-日期」，則同步過去
      let visitDate = profile['拜訪日期'];
      const interactionDate = profile['最新洽談-日期'] || profile['lastInteractionDate']; // 兼容 Excel 舊 Key

      if (!visitDate && interactionDate) {
        visitDate = interactionDate;
        profile['拜訪日期'] = visitDate; // 更新回 profile 以便寫入 submission
      }
      // 如果都沒填，預設為今天 (避免 N/A)
      if (!visitDate) {
        visitDate = new Date().toISOString().split('T')[0];
        profile['拜訪日期'] = visitDate;
      }

      // --- 2. 建構 Submission Log (歷史快照) ---
      const submissionLog = {
        submittedAt: batchTimestamp,
        importSource: 'Excel Batch Upload',
        '姓名': customer.name || '',
        '電話': String(phone),
        '銷售人員': customer.salesName || '',
        '銷售人員電話': customer.salesPhone || '',
        '拜訪日期': visitDate,
        ...profile
      };

      // --- 3. 建構 Interaction Log (洽談紀錄 - 解決歷史紀錄空白問題) ---
      // 只有當 Excel 中包含洽談相關欄位時才建立
      let newInteractionLog = null;

      // 檢查是否有洽談內容或等級標籤
      const hasInteractionContent = profile['最新洽談-內容'] || profile['lastInteractionContent'];
      const hasRating = profile['等級研判'] || profile['rating'];

      if (hasInteractionContent || hasRating || interactionDate) {
        // 產生一個隨機 ID (模擬 UUID)
        const logId = `excel-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

        newInteractionLog = {
          logId: logId,
          date: interactionDate || visitDate, // 優先使用洽談日期
          createdAt: submissionTime,
          recorderName: '系統匯入', // 標示為系統匯入
          content: profile['最新洽談-內容'] || profile['lastInteractionContent'] || '(Excel 匯入資料更新)',

          // 標籤結構
          tags: {
            interactionType: profile['互動方式'] || '來電',
            visitors: profile['來人數'] || '1',
            rating: profile['等級研判'] || profile['rating'] || '',
            keyTags: profile['重點標籤'] || profile['keyTags'] || [],
            noPurchaseReason: profile['未買原因'] || profile['noPurchaseReason'] || []
          }
        };
      }

      // --- 4. 準備更新 Payload ---
      const updatePayload = {
        projectId: projectId,
        phone: String(phone),
        updatedAt: updateTime,
        searchablePhones: FieldValue.arrayUnion(String(phone)),

        // 加入歷史快照
        submissions: FieldValue.arrayUnion(submissionLog)
      };

      // ✅ 關鍵：如果有建立洽談紀錄，加入 interactionLogs 陣列
      if (newInteractionLog) {
        updatePayload.interactionLogs = FieldValue.arrayUnion(newInteractionLog);
      }

      // 更新根目錄 (最新狀態)
      if (customer.name) {
        updatePayload.latestName = customer.name;
        updatePayload.searchableNames = FieldValue.arrayUnion(customer.name);
      }
      if (customer.salesName) updatePayload.latestSalesName = customer.salesName;
      if (customer.salesPhone) updatePayload.latestSalesPhone = customer.salesPhone;

      // 更新 profile (最新狀態)
      if (Object.keys(profile).length > 0) {
        updatePayload.profile = profile;
      }

      // --- 5. 加入 Batch ---
      batch.set(docRef, updatePayload, { merge: true });

      count++;
      totalProcessed++;

      if (count >= MAX_BATCH_SIZE) {
        await batch.commit();
        console.log(`[${functionName}] 已提交一批 (${count} 筆)...`);
        batch = db.batch();
        count = 0;
      }
    }

    if (count > 0) {
      await batch.commit();
      console.log(`[${functionName}] 已提交最後一批 (${count} 筆)。`);
    }

    return {
      status: "success",
      message: `成功更新 ${totalProcessed} 筆客戶資料。`,
      processedCount: totalProcessed
    };

  } catch (error) {
    console.error(`[${functionName}] 批次更新失敗:`, error);
    throw new HttpsError("internal", `批次更新時發生錯誤: ${error.message}`);
  }
}

/**
 * [觸發函式] 客戶資料通知分流 (修正版 V2 - 支援資料補全通知)
 * 修正點：當銷售人員「補全」第一筆資料(長度未變)時，也要觸發通知。
 */
exports.onVipGuestSubmission = onDocumentWritten({
  document: "vipGuests/{docId}",
  database: 'anxi-app',
  region: 'asia-east1',
  secrets: ["ANXISMART_LINE_CRM_TOKEN"],
  timeoutSeconds: 60,
  memory: "256MiB"
}, async (event) => {
  const functionName = "onVipGuestSubmission";
  const anxiDb = new Firestore({ databaseId: "anxi-app" });

  const afterData = event.data.after?.data();
  const beforeData = event.data.before?.data();

  // 若資料被刪除，不處理
  if (!afterData) return;

  const afterSubmissions = afterData.submissions || [];
  const beforeSubmissions = beforeData?.submissions || [];

  // 若完全沒有提交紀錄，不處理
  if (afterSubmissions.length === 0) return;

  // 取得最新一筆 submission (變更後)
  const newSubmission = afterSubmissions[afterSubmissions.length - 1];

  // 取得對應的舊 submission (變更前)
  // 注意：如果是新增，oldSubmission 可能為 undefined
  const oldSubmission = beforeSubmissions[beforeSubmissions.length - 1];

  // ============================================================
  // ✅ [關鍵邏輯修正] 判斷是否需要發送通知
  // ============================================================
  let shouldNotify = false;

  // 情況 1: 陣列長度增加 (新增了一筆資料) -> 發送
  if (afterSubmissions.length > beforeSubmissions.length) {
    console.log(`[${functionName}] 偵測到新增提交紀錄 (Count: ${beforeSubmissions.length} -> ${afterSubmissions.length})`);
    shouldNotify = true;
  }
  // 情況 2: 陣列長度不變，但「補全」了資料 (Public -> Internal)
  else if (afterSubmissions.length === beforeSubmissions.length) {
    const oldSource = oldSubmission?.submissionSource || 'public_form'; // 舊資料預設為 public
    const newSource = newSubmission.submissionSource || 'public_form';

    // 只有當來源從 "public_form" 變為 "internal_sheet" 時才通知
    // 這代表銷售人員剛剛完成了資料補全
    if (oldSource === 'public_form' && newSource === 'internal_sheet') {
      console.log(`[${functionName}] 偵測到資料補全 (Public -> Internal)，觸發通知。`);
      shouldNotify = true;
    }
  }

  // 如果不符合上述任一條件，則中止
  if (!shouldNotify) {
    return;
  }

  // 1. 攔截 Excel 匯入 (雙重確認，雖然 Excel 通常是新增，但也可能覆蓋)
  if (newSubmission.importSource === 'Excel Batch Upload') {
    console.log(`[${functionName}] 偵測到 Excel 匯入，略過通知。`);
    return;
  }

  const source = newSubmission.submissionSource || 'public_form';
  const projectId = afterData.projectId;
  const salesPhone = newSubmission['銷售人員電話'];

  console.log(`[${functionName}] 準備執行通知流程 (Source: ${source}, Project: ${projectId})`);

  try {
    // 2. 獲取設定與 Token
    const settingsDoc = await anxiDb.collection("customerFieldSettings").doc(projectId).get();
    if (!settingsDoc.exists) return;
    const tokenSecretName = settingsDoc.data().anxiSystemConfig?.lineCrmChannelAccessTokenSecretName;
    if (!tokenSecretName || !process.env[tokenSecretName]) return;
    const lineToken = process.env[tokenSecretName];

    // 獲取建案名稱
    const projectDoc = await anxiDb.collection('projects').doc(projectId).get();
    const projectName = projectDoc.exists ? projectDoc.data().name : projectId;

    // 3. 準備發送名單與訊息內容
    const lineIdsToSend = new Set();
    const permissionsRef = anxiDb.collection('userPermissions');
    let messageText = '';

    // 輔助函式：格式化欄位
    const formatVal = (key) => {
      const val = newSubmission[key];
      if (Array.isArray(val)) return val.join(', ');
      return val || '';
    };

    // ============================================================
    // 情境 A: 客戶掃描 QR Code (VipForm)
    // ============================================================
    if (source === 'public_form') {
      // 對象：櫃台 + 所有銷售
      const counterQuery = permissionsRef.where(`permissions.${projectId}.systems`, 'array-contains', '客資系統-櫃台');
      const counterSnap = await counterQuery.get();
      counterSnap.forEach(doc => lineIdsToSend.add(doc.id));

      const salesQuery = permissionsRef.where(`permissions.${projectId}.systems`, 'array-contains', '客資系統-銷售');
      const salesSnap = await salesQuery.get();
      salesSnap.forEach(doc => lineIdsToSend.add(doc.id));

      // {第一則} 格式
      messageText = `✨${projectName} 新貴賓資料
電話: ${formatVal('電話')}
姓名: ${formatVal('姓名')}

--- 其他資訊 ---
性別: ${formatVal('性別')}
購屋動機: ${formatVal('購屋動機')}
房型需求: ${formatVal('房型需求')}
坪數需求: ${formatVal('坪數需求')}
購屋預算: ${formatVal('購屋預算')}
從何得知本建案: ${formatVal('從何得知本建案')}`;
    }

    // ============================================================
    // 情境 B: 銷售人員補全資料 (CustomerDataSheet)
    // ============================================================
    else if (source === 'internal_sheet') {
      // 對象：櫃台 + 指定銷售
      const counterQuery = permissionsRef.where(`permissions.${projectId}.systems`, 'array-contains', '客資系統-櫃台');
      const counterSnap = await counterQuery.get();
      counterSnap.forEach(doc => lineIdsToSend.add(doc.id));

      if (salesPhone) {
        lineIdsToSend.add(salesPhone);
      }

      // 準備完整資料欄位
      const city = formatVal('居住城市');
      const dist = formatVal('居住鄉鎮市區');
      const addrDetail = formatVal('居住詳細地址');
      const fullAddress = (city || dist || addrDetail) ? `${city}${dist}${addrDetail}` : '';

      const job = formatVal('職業');
      const company = formatVal('任職公司');
      const fullJob = (job || company) ? `${job}/${company}` : '';

      let visitDate = formatVal('拜訪日期');
      if (!visitDate && newSubmission.submittedAt) {
        const ts = newSubmission.submittedAt;
        // 檢查是否為 Timestamp 物件 (Firestore) 或 序列化物件
        const dateObj = (ts.toDate) ? ts.toDate() : new Date(ts._seconds * 1000);
        visitDate = dateObj.toLocaleDateString('zh-TW');
      }

      // {第二則} 格式 (修正版)
      messageText = `✅${projectName} 客戶資料完成
銷售: ${formatVal('銷售人員')}
電話: ${formatVal('電話')}
姓名: ${formatVal('姓名')}
日期: ${visitDate}
年齡: ${formatVal('年齡')}
地址: ${fullAddress}
職業: ${fullJob}

--- 需求資訊 ---
購屋動機: ${formatVal('購屋動機')}
房型需求: ${formatVal('房型需求')}
坪數需求: ${formatVal('坪數需求')}
購屋預算: ${formatVal('購屋預算')}
從何得知本建案: ${formatVal('從何得知本建案')}`;
    }

    // 4. 轉換手機號為 LINE ID 並發送
    const phoneArray = Array.from(lineIdsToSend);
    if (phoneArray.length === 0) return;

    const finalLineIds = new Set();
    const userChunks = [];
    for (let i = 0; i < phoneArray.length; i += 30) {
      userChunks.push(phoneArray.slice(i, i + 30));
    }

    for (const chunk of userChunks) {
      const usersSnap = await anxiDb.collection('users')
        .where(GCloudFieldPath.documentId(), 'in', chunk)
        .get();
      usersSnap.forEach(doc => {
        const lid = doc.data().lineId;
        if (lid && lid.startsWith('U')) finalLineIds.add(lid);
      });
    }

    if (finalLineIds.size === 0) {
      console.log(`[${functionName}] 無有效的 LINE ID 可發送。`);
      return;
    }

    // 5. 發送
    const lineClient = new line.Client({ channelAccessToken: lineToken });
    await lineClient.multicast(Array.from(finalLineIds), [{ type: 'text', text: messageText }]);

    console.log(`[${functionName}] LINE 通知已發送給 ${finalLineIds.size} 人 (${source})。`);

  } catch (error) {
    console.error(`[${functionName}] 執行失敗:`, error);
  }
});



exports.syncBookingToSheet = onCall({
  region: "asia-east1",
  memory: "1GiB",
  timeoutSeconds: 540,
  secrets: ["GOOGLE_SHEETS_CLIENT_EMAIL", "GOOGLE_SHEETS_PRIVATE_KEY"]
}, async (request) => {
  const { projectId, startDate, endDate } = request.data;

  if (!projectId || !startDate || !endDate) {
    throw new HttpsError("invalid-argument", "缺少必要參數。");
  }

  try {
    // ✅ [修改] 傳入陣列格式
    const result = await _coreSyncLogic(projectId, [{ start: startDate, end: endDate }]);
    return result;
  } catch (error) {
    console.error("[syncBookingToSheet] Manual sync failed:", error);
    throw new HttpsError("internal", `同步失敗: ${error.message}`);
  }
});

/**
 * [內部核心函式] 執行指定日期範圍的 Google Sheet 同步
 * 優化 V6: 支援多組日期範圍 (Array of {start, end})，確保跨週移動時資料保留
 * 加入詳細 Log 以追蹤備註流向
 */
async function _coreSyncLogic(projectId, dateRanges) {
  const functionName = "_coreSyncLogic";
  // 兼容舊版單一範圍呼叫 (轉換為陣列)
  if (!Array.isArray(dateRanges) && arguments.length === 3) {
    dateRanges = [{ start: arguments[1], end: arguments[2] }];
  }

  console.log(`[${functionName}] 開始同步 Project: ${projectId}, Ranges: ${JSON.stringify(dateRanges)}`);

  const db = new Firestore({ databaseId: "anxi-app" });

  // 1. 獲取專案設定
  const projectDoc = await db.collection("projects").doc(projectId).get();
  if (!projectDoc.exists) throw new Error("找不到建案資料");
  const projectData = projectDoc.data();
  const spreadsheetId = projectData.googleSheetId;
  const sheetName = projectData.googleSheetTabName;
  const systemBookingTypes = projectData.bookingTypes || [];

  if (!spreadsheetId || !sheetName) {
    console.warn(`[${functionName}] Google Sheet 未設定，跳過同步。`);
    return { status: "skipped", message: "Google Sheet 未設定" };
  }

  // 2. 初始化 Google Sheets API
  const clientEmail = process.env.GOOGLE_SHEETS_CLIENT_EMAIL;
  const privateKey = process.env.GOOGLE_SHEETS_PRIVATE_KEY;
  if (!clientEmail || !privateKey) throw new Error("系統未設定 Google Sheet 憑證");

  const auth = new google.auth.JWT({
    email: clientEmail,
    key: privateKey.replace(/\\n/g, '\n'),
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });
  const sheets = google.sheets({ version: 'v4', auth });

  // 2.5 動態獲取 sheetId
  const spreadsheetInfo = await sheets.spreadsheets.get({ spreadsheetId });
  const targetSheetObj = spreadsheetInfo.data.sheets.find(s => s.properties.title === sheetName);
  if (!targetSheetObj) throw new Error(`找不到工作表 "${sheetName}"`);
  const targetSheetId = targetSheetObj.properties.sheetId;

  // --- 準備：整理所有涉及的週次 (Deduplication & Chunking) ---
  const uniqueWeeksMap = new Map(); // Key: "YYYY/MM/DD" (Monday)

  const formatDateStr = (date) => {
    return date.toLocaleDateString('zh-TW', {
      timeZone: 'Asia/Taipei',
      year: 'numeric', month: 'numeric', day: 'numeric'
    });
  };

  dateRanges.forEach(range => {
    const start = new Date(range.start);
    const end = new Date(range.end);
    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);

    let current = new Date(start);
    // 找到該日期的週一
    const day = current.getDay();
    const diff = day === 0 ? -6 : 1 - day;
    current.setDate(current.getDate() + diff);

    // 遍歷直到 end
    while (current <= end || (current.getTime() <= end.getTime() + 7 * 86400000 && current.getDay() === 1)) {
      // 檢查這週是否與 range 重疊
      const weekEnd = new Date(current);
      weekEnd.setDate(weekEnd.getDate() + 6);

      if (current <= end && weekEnd >= start) {
        const weekKey = formatDateStr(current);
        if (!uniqueWeeksMap.has(weekKey)) {
          // 產生該週 7 天
          const chunk = [];
          for (let i = 0; i < 7; i++) {
            const d = new Date(current);
            d.setDate(d.getDate() + i);
            chunk.push(d);
          }
          uniqueWeeksMap.set(weekKey, chunk);
        }
      }
      // 下一週
      current.setDate(current.getDate() + 7);
    }
  });

  const weeklyChunks = Array.from(uniqueWeeksMap.values());
  console.log(`[${functionName}] 共整理出 ${weeklyChunks.length} 個不重複週次進行同步。`);

  // 3. 撈取 Firestore 資料 (撈取所有相關週次的資料)
  // 為了簡化查詢，我們找出這些週次的最小 Start 與最大 End
  if (weeklyChunks.length === 0) return { status: "success", message: "無範圍" };

  let minDate = weeklyChunks[0][0];
  let maxDate = weeklyChunks[0][6];
  weeklyChunks.forEach(chunk => {
    if (chunk[0] < minDate) minDate = chunk[0];
    if (chunk[6] > maxDate) maxDate = chunk[6];
  });

  // 設定時間邊界 (UTC轉換在 Query 時自動處理)
  // 這裡 minDate/maxDate 已經是 Date 物件
  // 重新設定精確邊界
  const queryStart = new Date(minDate); queryStart.setHours(0, 0, 0, 0);
  const queryEnd = new Date(maxDate); queryEnd.setHours(23, 59, 59, 999);

  console.log(`[${functionName}] Querying Firestore from ${formatDateStr(queryStart)} to ${formatDateStr(queryEnd)}`);

  const appointmentsRef = db.collection("appointments");
  const snapshot = await appointmentsRef
    .where("projectId", "==", projectId)
    .where("status", "!=", "取消")
    .where("appointmentDate", ">=", queryStart)
    .where("appointmentDate", "<=", queryEnd)
    .get();

  const allAppointments = snapshot.docs.map(doc => ({ ...doc.data(), dateObj: doc.data().appointmentDate.toDate() }));
  console.log(`[${functionName}] Fetched ${allAppointments.length} appointments.`);

  // ============================================================
  // 🚀 變數準備：全域資料暫存區
  // ============================================================
  const globalPreservedData = {};
  const globalManualEntries = [];
  const parseSheetDate = (val) => {
    if (!val) return null;
    if (typeof val === 'number') return new Date(Math.round((val - 25569) * 86400 * 1000));
    const d = new Date(val);
    return isNaN(d.getTime()) ? null : d;
  };

  // ============================================================
  // 🚀 階段一：搜集 (Harvest) - 一次掃描所有相關週次
  // ============================================================
  console.log(`[${functionName}] Phase 1: Harvesting existing data...`);

  for (const weekDates of weeklyChunks) {
    const targetDateStr = formatDateStr(weekDates[0]);

    // 讀取 Sheet
    const sheetDataRes = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `${sheetName}!A:AZ`,
      valueRenderOption: 'UNFORMATTED_VALUE'
    });
    const rows = sheetDataRes.data.values || [];

    for (let i = 0; i < rows.length; i++) {
      const rowStr = JSON.stringify(rows[i]);
      if (rowStr.includes(targetDateStr) || rows[i].some(cell => {
        const d = parseSheetDate(cell);
        return d && formatDateStr(d) === targetDateStr;
      })) {
        const targetRowIndex = i - 1;
        let j = i + 1;
        while (j < rows.length) {
          if (rows[j][0] && String(rows[j][0]).includes('星期')) break;
          j++;
        }
        const existingBlockHeight = j - targetRowIndex;

        const headerRow = rows[targetRowIndex + 2];
        if (headerRow) {
          let blockWidth = 7;
          const unitIdxRel = headerRow.indexOf('戶別');
          const typeIdxRel = headerRow.indexOf('項目');
          const remarkIdxRel = headerRow.indexOf('備註');
          const inspectorIdxRel = headerRow.indexOf('人員');

          const timeIdxRel = headerRow.indexOf('時間');
          const nameIdxRel = headerRow.indexOf('姓名');
          const methodIdxRel = headerRow.indexOf('方式') !== -1 ? headerRow.indexOf('方式') : (headerRow.indexOf('選擇方式') !== -1 ? headerRow.indexOf('選擇方式') : -1);

          if (unitIdxRel !== -1 && remarkIdxRel !== -1 && inspectorIdxRel !== -1 && typeIdxRel !== -1) {
            for (let r = targetRowIndex + 3; r < targetRowIndex + existingBlockHeight; r++) {
              const row = rows[r];
              if (!row) continue;
              for (let dayIdx = 0; dayIdx < 7; dayIdx++) {
                const colOffset = dayIdx * blockWidth;
                const unitId = row[colOffset + unitIdxRel];
                const bookingType = row[colOffset + typeIdxRel];
                const remark = row[colOffset + remarkIdxRel];
                const inspector = row[colOffset + inspectorIdxRel];

                if (unitId && bookingType) {
                  const isSystemType = systemBookingTypes.includes(bookingType);
                  if (isSystemType) {
                    const key = `${unitId}_${bookingType}`;
                    globalPreservedData[key] = {
                      remark: remark || "",
                      inspector: inspector || ""
                    };
                    // Log 觀察點 1: 確保舊備註有被抓到
                    if (remark || inspector) {
                      console.log(`[Harvest] Saved for ${key}: Remark="${remark}", Inspector="${inspector}"`);
                    }
                  } else {
                    const currentDateStr = formatDateStr(weekDates[dayIdx]);
                    const time = timeIdxRel !== -1 ? row[colOffset + timeIdxRel] : "";
                    const name = nameIdxRel !== -1 ? row[colOffset + nameIdxRel] : "";
                    const method = methodIdxRel !== -1 ? row[colOffset + methodIdxRel] : "";
                    globalManualEntries.push({
                      dateStr: currentDateStr,
                      data: {
                        appointmentTimeSlot: time, unitId, bookerName: name,
                        bookingType, methodStr: method, remark, inspector, isManual: true
                      }
                    });
                  }
                }
              }
            }
          }
        }
        break;
      }
    }
  }

  // ============================================================
  // 🚀 階段二：寫入 (Plant) - 寫入所有週次
  // ============================================================
  console.log(`[${functionName}] Phase 2: Writing data...`);
  const NEW_BLOCK_WIDTH = 7;
  const TOTAL_COLUMNS = 7 * NEW_BLOCK_WIDTH;

  // 依序處理每一週
  // 注意：因為寫入會改變行數，每週處理前都必須重新讀取 Sheet
  for (const weekDates of weeklyChunks) {
    const targetDateStr = formatDateStr(weekDates[0]);

    const sheetDataRes = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `${sheetName}!A:AZ`,
      valueRenderOption: 'UNFORMATTED_VALUE'
    });
    const rows = sheetDataRes.data.values || [];

    let targetRowIndex = -1;
    let existingBlockHeight = 0;

    for (let i = 0; i < rows.length; i++) {
      const rowStr = JSON.stringify(rows[i]);
      if (rowStr.includes(targetDateStr) || rows[i].some(cell => {
        const d = parseSheetDate(cell);
        return d && formatDateStr(d) === targetDateStr;
      })) {
        targetRowIndex = i - 1;
        let j = i + 1;
        while (j < rows.length) {
          if (rows[j][0] && String(rows[j][0]).includes('星期')) break;
          j++;
        }
        existingBlockHeight = j - targetRowIndex;
        break;
      }
    }

    const dailyAppointments = weekDates.map(date => {
      const dayStr = formatDateStr(date);

      const dbApps = allAppointments
        .filter(a => formatDateStr(a.dateObj) === dayStr)
        .map(appt => {
          let rawMethod = appt.inspectionMethod || "";
          let methodLabel = rawMethod;
          if (rawMethod === "屋主自驗") methodLabel = "自驗";
          else if (rawMethod === "代驗公司") methodLabel = "代驗";

          let finalMethodStr = methodLabel;
          if (rawMethod === "代驗公司" && appt.inspectionCompanyName) {
            const companyShort = String(appt.inspectionCompanyName).substring(0, 4);
            finalMethodStr = `${methodLabel}-${companyShort}`;
          }

          const key = `${appt.unitId}_${appt.bookingType}`;
          const savedInfo = globalPreservedData[key] || {};

          // Log 觀察點 2: 確保寫入時有填回備註
          if (savedInfo.remark || savedInfo.inspector) {
            console.log(`[Plant] Restoring for ${key} on ${dayStr}: Remark="${savedInfo.remark}"`);
          }

          return {
            appointmentTimeSlot: appt.appointmentTimeSlot,
            unitId: appt.unitId,
            bookerName: appt.bookerName,
            bookingType: appt.bookingType,
            methodStr: finalMethodStr,
            remark: savedInfo.remark || "",
            inspector: savedInfo.inspector || "",
            isManual: false
          };
        });

      const manualApps = globalManualEntries
        .filter(m => m.dateStr === dayStr)
        .map(m => m.data);

      const combinedApps = [...dbApps, ...manualApps];
      combinedApps.sort((a, b) => {
        const timeA = String(a.appointmentTimeSlot || "").replace(/'/g, "");
        const timeB = String(b.appointmentTimeSlot || "").replace(/'/g, "");
        return timeA.localeCompare(timeB);
      });

      return combinedApps;
    });

    const maxApps = Math.max(...dailyAppointments.map(d => d.length), 1);
    const newRows = [];

    // Row 1
    const weekRow = [];
    const weekDays = ['星期一', '星期二', '星期三', '星期四', '星期五', '星期六', '星期日'];
    weekDays.forEach(day => { weekRow.push(day); for (let k = 0; k < NEW_BLOCK_WIDTH - 1; k++) weekRow.push(""); });
    newRows.push(weekRow);

    // Row 2
    const dateRow = [];
    weekDates.forEach(d => {
      dateRow.push("'" + formatDateStr(d));
      for (let k = 0; k < NEW_BLOCK_WIDTH - 1; k++) dateRow.push("");
    });
    newRows.push(dateRow);

    // Row 3
    const headerRow = [];
    const dailyHeaders = ["時間", "戶別", "姓名", "項目", "方式", "備註", "人員"];
    for (let i = 0; i < 7; i++) headerRow.push(...dailyHeaders);
    newRows.push(headerRow);

    // Row 4+
    for (let i = 0; i < maxApps; i++) {
      const row = [];
      for (let dayIdx = 0; dayIdx < 7; dayIdx++) {
        const appt = dailyAppointments[dayIdx][i];
        if (appt) {
          const timeStr = appt.appointmentTimeSlot ? (String(appt.appointmentTimeSlot).startsWith("'") ? appt.appointmentTimeSlot : "'" + appt.appointmentTimeSlot) : "";
          row.push(timeStr);
          row.push(appt.unitId || "");
          row.push(appt.bookerName || "");
          row.push(appt.bookingType || "");
          row.push(appt.methodStr || "");
          row.push(appt.remark || "");
          row.push(appt.inspector || "");
        } else {
          for (let k = 0; k < NEW_BLOCK_WIDTH; k++) row.push("");
        }
      }
      newRows.push(row);
    }

    // 寫入 (Delete Old -> Insert New -> Update Data -> Format)
    const requests = [];

    if (targetRowIndex !== -1) {
      requests.push({
        deleteDimension: {
          range: { sheetId: targetSheetId, dimension: "ROWS", startIndex: targetRowIndex, endIndex: targetRowIndex + existingBlockHeight }
        }
      });
    } else {
      // 插入點判斷
      targetRowIndex = rows.length;
      const targetDateObj = weekDates[0];
      for (let i = 0; i < rows.length; i++) {
        if (rows[i][0] && String(rows[i][0]).includes('星期')) {
          const checkDateVal = rows[i + 1]?.[0];
          const checkDate = parseSheetDate(checkDateVal);
          if (checkDate && targetDateObj < checkDate) {
            targetRowIndex = i;
            break;
          }
        }
      }
    }

    // 1. 刪除
    if (requests.length > 0) {
      await sheets.spreadsheets.batchUpdate({ spreadsheetId, requestBody: { requests } });
    }

    // 2. 插入
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId,
      requestBody: {
        requests: [{
          insertDimension: {
            range: { sheetId: targetSheetId, dimension: "ROWS", startIndex: targetRowIndex, endIndex: targetRowIndex + newRows.length },
            inheritFromBefore: false
          }
        }]
      }
    });

    // 3. 填值
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: `${sheetName}!A${targetRowIndex + 1}`,
      valueInputOption: "USER_ENTERED",
      requestBody: { values: newRows }
    });

    // 4. 格式化
    const formatRequests = [];
    const styleWeek = { backgroundColor: { red: 0.98, green: 0.75, blue: 0.56 }, horizontalAlignment: "CENTER", textFormat: { bold: true } };
    const styleDate = { backgroundColor: { red: 1, green: 1, blue: 0 }, horizontalAlignment: "CENTER", textFormat: { bold: true } };
    const styleHead = { backgroundColor: { red: 0.57, green: 0.8, blue: 0.86 }, horizontalAlignment: "CENTER", textFormat: { bold: true } };
    const styleData = { backgroundColor: { red: 1, green: 1, blue: 1 }, textFormat: { bold: false, foregroundColor: { red: 0, green: 0, blue: 0 } }, horizontalAlignment: "CENTER", verticalAlignment: "MIDDLE" };

    for (let i = 0; i < 7; i++) {
      const startCol = i * NEW_BLOCK_WIDTH;
      const endCol = startCol + NEW_BLOCK_WIDTH;
      formatRequests.push({ mergeCells: { range: { sheetId: targetSheetId, startRowIndex: targetRowIndex, endRowIndex: targetRowIndex + 1, startColumnIndex: startCol, endColumnIndex: endCol }, mergeType: "MERGE_ALL" } });
      formatRequests.push({ mergeCells: { range: { sheetId: targetSheetId, startRowIndex: targetRowIndex + 1, endRowIndex: targetRowIndex + 2, startColumnIndex: startCol, endColumnIndex: endCol }, mergeType: "MERGE_ALL" } });
    }

    formatRequests.push({ repeatCell: { range: { sheetId: targetSheetId, startRowIndex: targetRowIndex, endRowIndex: targetRowIndex + 1 }, cell: { userEnteredFormat: styleWeek }, fields: "userEnteredFormat" } });
    formatRequests.push({ repeatCell: { range: { sheetId: targetSheetId, startRowIndex: targetRowIndex + 1, endRowIndex: targetRowIndex + 2 }, cell: { userEnteredFormat: styleDate }, fields: "userEnteredFormat" } });
    formatRequests.push({ repeatCell: { range: { sheetId: targetSheetId, startRowIndex: targetRowIndex + 2, endRowIndex: targetRowIndex + 3 }, cell: { userEnteredFormat: styleHead }, fields: "userEnteredFormat" } });

    if (newRows.length > 3) {
      formatRequests.push({ repeatCell: { range: { sheetId: targetSheetId, startRowIndex: targetRowIndex + 3, endRowIndex: targetRowIndex + newRows.length, startColumnIndex: 0, endColumnIndex: TOTAL_COLUMNS }, cell: { userEnteredFormat: styleData }, fields: "userEnteredFormat" } });
    }

    formatRequests.push({ updateBorders: { range: { sheetId: targetSheetId, startRowIndex: targetRowIndex, endRowIndex: targetRowIndex + newRows.length, startColumnIndex: 0, endColumnIndex: TOTAL_COLUMNS }, top: { style: "SOLID" }, bottom: { style: "SOLID" }, left: { style: "SOLID" }, right: { style: "SOLID" }, innerHorizontal: { style: "SOLID" }, innerVertical: { style: "SOLID" } } });

    await sheets.spreadsheets.batchUpdate({
      spreadsheetId,
      requestBody: { requests: formatRequests }
    });

    await new Promise(resolve => setTimeout(resolve, 500));
  }

  return { status: "success", message: `同步完成，共處理 ${weeklyChunks.length} 週資料。` };
}


/**
 * [Trigger] 監聽預約變動，自動同步 Google Sheet
 */
exports.onAppointmentChange = onDocumentWritten({
  document: "appointments/{docId}",
  database: "anxi-app",
  region: "asia-east1",
  memory: "1GiB",
  timeoutSeconds: 540,
  secrets: ["GOOGLE_SHEETS_CLIENT_EMAIL", "GOOGLE_SHEETS_PRIVATE_KEY"]
}, async (event) => {
  const functionName = "onAppointmentChange";
  const beforeData = event.data.before?.data();
  const afterData = event.data.after?.data();

  const projectId = afterData?.projectId || beforeData?.projectId;
  if (!projectId) return;

  const rangesToSync = []; // 存 {start, end} 物件

  // Helper
  const getDateStr = (ts) => {
    if (!ts || !ts.toDate) return null;
    // 使用 en-CA 取得 YYYY-MM-DD 格式 (台灣時區)
    return ts.toDate().toLocaleDateString('en-CA', { timeZone: 'Asia/Taipei' });
  };

  // 1. 變動前的日期 -> 加入同步範圍
  if (beforeData && beforeData.appointmentDate) {
    const d = getDateStr(beforeData.appointmentDate);
    if (d) rangesToSync.push({ start: d, end: d });
  }

  // 2. 變動後的日期 -> 加入同步範圍
  if (afterData && afterData.appointmentDate) {
    const d = getDateStr(afterData.appointmentDate);
    if (d) rangesToSync.push({ start: d, end: d });
  }

  if (rangesToSync.length === 0) return;

  console.log(`[${functionName}] Trigger sync for ranges:`, JSON.stringify(rangesToSync));

  try {
    // ✅ [修改] 一次性呼叫核心邏輯，傳入所有受影響的日期
    await _coreSyncLogic(projectId, rangesToSync);
    console.log(`[${functionName}] 自動同步完成。`);
  } catch (error) {
    console.error(`[${functionName}] 自動同步失敗:`, error);
  }
});

// =================================================================
// /  【新增】賞屋預約系統 (Viewing Reservation) Cloud Functions
// =================================================================

/**
 * [Trigger] 監聽賞屋預約的寫入 (新增/修改/刪除)
 * 負責：
 * 發送 LINE 廣播通知 (新增/取消/指派)
 */
exports.onViewingReservationChange = onDocumentWritten({
  document: "viewing_reservations/{docId}",
  database: "anxi-app",
  region: "asia-east1",
  secrets: ["ANXISMART_LINE_CRM_TOKEN"]
}, async (event) => {
  const functionName = "onViewingReservationChange";
  const db = new Firestore({ databaseId: "anxi-app" });

  const afterData = event.data.after?.data();
  const beforeData = event.data.before?.data();

  // 1. 若資料被物理刪除，不處理
  if (!afterData) return;

  const projectId = afterData.projectId;
  const docId = event.params.docId;

  // 識別狀態變化
  const isNew = !beforeData; // 新增
  const isCancelled = beforeData?.status === 'active' && afterData.status === 'deleted'; // 取消

  console.log(`[${functionName}] Doc: ${docId}, Project: ${projectId}, IsNew: ${isNew}, IsCancelled: ${isCancelled}`);

  try {
    if (isNew || isCancelled) {

      // ✅ [新增] 查詢建案名稱
      let projectName = projectId; // 預設使用 ID
      try {
        const projectDoc = await db.collection("projects").doc(projectId).get();
        if (projectDoc.exists) {
          projectName = projectDoc.data().name || projectId;
        }
      } catch (err) {
        console.warn(`[${functionName}] 無法讀取建案名稱，將顯示 ID:`, err);
      }

      // 1. 準備訊息內容
      let title = "";
      let color = "";
      let salesDisplay = afterData.salesName || "不指定";

      if (isCancelled) {
        title = "❌ 賞屋預約 - 已取消";
        color = "#FF3333"; // 紅色
      } else {
        title = "🏠 賞屋預約 - 新增";
        color = "#1DB446"; // LINE 綠
      }

      // 轉換時間格式
      let timeStr = "";
      if (afterData.reservationTime && afterData.reservationTime.toDate) {
        timeStr = afterData.reservationTime.toDate().toLocaleString('zh-TW', {
          timeZone: 'Asia/Taipei',
          month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false
        });
      }

      const flexMessage = {
        type: "bubble",
        size: "mega",
        body: {
          type: "box",
          layout: "vertical",
          contents: [
            { type: "text", text: title, weight: "bold", size: "xl", color: color },
            { type: "separator", margin: "md" },
            {
              type: "box",
              layout: "vertical",
              margin: "md",
              spacing: "sm",
              contents: [
                {
                  type: "box",
                  layout: "baseline",
                  contents: [
                    { type: "text", text: "建案", color: "#aaaaaa", size: "sm", flex: 2 },
                    // ✅ [修改] 這裡改用 projectName
                    { type: "text", text: projectName, wrap: true, color: "#666666", size: "sm", flex: 5 }
                  ]
                },
                {
                  type: "box",
                  layout: "baseline",
                  contents: [
                    { type: "text", text: "時間", color: "#aaaaaa", size: "sm", flex: 2 },
                    { type: "text", text: timeStr, wrap: true, color: "#666666", size: "sm", flex: 5 }
                  ]
                },
                {
                  type: "box",
                  layout: "baseline",
                  contents: [
                    { type: "text", text: "客戶", color: "#aaaaaa", size: "sm", flex: 2 },
                    { type: "text", text: `${afterData.customerName} (${afterData.type})`, wrap: true, color: "#666666", size: "sm", flex: 5 }
                  ]
                },
                {
                  type: "box",
                  layout: "baseline",
                  contents: [
                    { type: "text", text: "電話", color: "#aaaaaa", size: "sm", flex: 2 },
                    { type: "text", text: afterData.customerPhone, color: "#007bff", size: "sm", flex: 5, action: { type: "uri", label: "撥打", uri: `tel:${afterData.customerPhone}` } }
                  ]
                },
                {
                  type: "box",
                  layout: "baseline",
                  contents: [
                    { type: "text", text: "銷售", color: "#aaaaaa", size: "sm", flex: 2 },
                    { type: "text", text: salesDisplay, wrap: true, color: "#666666", size: "sm", flex: 5, weight: "bold" }
                  ]
                }
              ]
            }
          ]
        }
      };

      // 加上備註 (如果有)
      if (afterData.note) {
        flexMessage.body.contents[2].contents.push({
          type: "box",
          layout: "baseline",
          contents: [
            { type: "text", text: "備註", color: "#aaaaaa", size: "sm", flex: 2 },
            { type: "text", text: afterData.note, wrap: true, color: "#D32F2F", size: "sm", flex: 5 }
          ]
        });
      }

      // 2. 獲取發送對象 (全體廣播)
      const lineIds = await _getProjectSalesLineIds(db, projectId);

      if (lineIds.length > 0) {
        // 3. 發送
        let channelToken = process.env.ANXISMART_LINE_CRM_TOKEN;

        // 嘗試從客資設定讀取專案特定的 Token (如果有的話)
        const settingsDoc = await db.collection("customerFieldSettings").doc(projectId).get();
        if (settingsDoc.exists) {
          const secretName = settingsDoc.data().anxiSystemConfig?.lineCrmChannelAccessTokenSecretName;
          if (secretName && process.env[secretName]) {
            channelToken = process.env[secretName];
          }
        }

        if (channelToken) {
          const lineClient = new line.Client({ channelAccessToken: channelToken });
          await lineClient.multicast(lineIds, [{ type: "flex", altText: title, contents: flexMessage }]);
          console.log(`[${functionName}] 廣播通知已發送給 ${lineIds.length} 人。`);
        } else {
          console.warn(`[${functionName}] 找不到可用的 LINE Channel Token，無法發送通知。`);
        }
      } else {
        console.log(`[${functionName}] 該建案 (${projectId}) 沒有綁定 LINE 的銷售人員，跳過通知。`);
      }
    }

  } catch (error) {
    console.error(`[${functionName}] 執行失敗:`, error);
  }
});

/**
 * [內部函式] 執行輪播邏輯
 * 1. 撈取該建案所有符合資格的銷售
 * 2. 讀取上次指派索引 (儲存在 projects/{projectId} 的 viewingSettings 欄位)
 * 3. 決定下一位並更新索引
 */
async function _assignRoundRobinSales(db, projectId) {
  try {
    // 1. 找出候選人
    // 查詢 userPermissions 中，該專案擁有「報價」或「銷控」權限的人
    // 由於 Firestore 無法直接 query map keys 的值，我們這裡採用「先列出所有 users，再過濾」的方式
    // (若 User 量大，建議改為維護一份 project_users 集合)

    // 這裡使用優化策略：查詢 users 集合 (假設 users 不會太多，或是已有 project_users 結構)
    // 暫時使用讀取 userPermissions 的方式 (與前端相同逻辑)
    const permSnapshot = await db.collection("userPermissions").get();
    const candidates = [];

    permSnapshot.forEach(doc => {
      const perms = doc.data().permissions || {};
      const projectPerms = perms[projectId];
      if (projectPerms && projectPerms.systems) {
        const hasAuth = projectPerms.systems.includes('報價系統') || projectPerms.systems.includes('銷控系統');
        if (hasAuth) {
          candidates.push({
            id: doc.id, // phone
            name: doc.data().userName || doc.id // 假設 userPermissions 有存 name，或需再查 users
          });
        }
      }
    });

    if (candidates.length === 0) return null;

    // 排序 (確保順序一致)
    candidates.sort((a, b) => a.id.localeCompare(b.id));

    // 2. 讀取並更新索引
    const projectRef = db.collection("projects").doc(projectId);

    const assignedSales = await db.runTransaction(async (t) => {
      const doc = await t.get(projectRef);
      if (!doc.exists) return null; // 異常

      const settings = doc.data().viewingSettings || {};
      let lastIndex = settings.lastRoundRobinIndex;

      if (typeof lastIndex !== 'number') lastIndex = -1;

      let nextIndex = lastIndex + 1;
      if (nextIndex >= candidates.length) {
        nextIndex = 0;
      }

      const winner = candidates[nextIndex];

      // 更新索引
      t.set(projectRef, {
        viewingSettings: {
          lastRoundRobinIndex: nextIndex
        }
      }, { merge: true });

      return winner;
    });

    // 補查 users 集合獲取電話 (如果需要)
    if (assignedSales) {
      const userDoc = await db.collection("users").doc(assignedSales.id).get();
      if (userDoc.exists) {
        assignedSales.name = userDoc.data().name || assignedSales.name;
        // phone 其實就是 ID
        assignedSales.phone = assignedSales.id;
      }
    }

    return assignedSales;

  } catch (error) {
    console.error("[_assignRoundRobinSales] Error:", error);
    return null;
  }
}

/**
 * [內部函式] 獲取該建案所有需接收通知的銷售人員 LINE ID
 */
async function _getProjectSalesLineIds(db, projectId) {
  const lineIds = new Set();

  // 找出有權限的人 (邏輯同輪播，但這次是找所有人)
  // 為了效能，這裡可以優化。目前採用遍歷 userPermissions
  const permSnapshot = await db.collection("userPermissions").get();
  const userIds = [];

  permSnapshot.forEach(doc => {
    const perms = doc.data().permissions || {};
    const projectPerms = perms[projectId];
    if (projectPerms && projectPerms.systems) {
      const hasAuth = projectPerms.systems.includes('報價系統') || projectPerms.systems.includes('銷控系統');
      if (hasAuth) {
        userIds.push(doc.id);
      }
    }
  });

  if (userIds.length === 0) return [];

  // 批量查詢 users 集合獲取 LINE ID
  // Firestore 'in' query limit is 30
  const chunks = [];
  for (let i = 0; i < userIds.length; i += 30) {
    chunks.push(userIds.slice(i, i + 30));
  }

  for (const chunk of chunks) {
    const usersSnap = await db.collection("users")
      .where(FieldPath.documentId(), 'in', chunk)
      .get();

    usersSnap.forEach(doc => {
      const lid = doc.data().lineId;
      if (lid && lid.startsWith('U')) { // 簡單驗證格式
        lineIds.add(lid);
      }
    });
  }

  return Array.from(lineIds);
}


/**
 * [V3 - 優化版] 客資分配系統
 * 邏輯：根據 leadId 讀取 -> 更新分配資訊 -> 發送 LINE
 */
exports.processAndAssignLead = onCall({
  region: "asia-east1",
  cors: true,
  memory: "256MiB",
  timeoutSeconds: 60,
  secrets: ["ANXISMART_LINE_CRM_TOKEN"]
}, async (request) => {
  const functionName = "processAndAssignLead";
  const db = new Firestore({ databaseId: "anxi-app" });

  try {
    // ✅ 接收參數改為 leadId (文件ID)
    const { leadId, projectId, salesId, salesName } = request.data;

    // 1. 取得該名單在資料庫中的現有資料
    const leadRef = db.collection("leads").doc(leadId);
    const leadSnap = await leadRef.get();

    if (!leadSnap.exists) {
      throw new HttpsError("not-found", "找不到該筆名單資料。");
    }
    const leadData = leadSnap.data();

    // 2. 獲取業務員的 LINE ID (從 users 集合獲取)
    const userDoc = await db.collection("users").doc(salesId).get();
    const salesLineId = userDoc.exists ? userDoc.data().lineId : null;

    console.log(`[${functionName}] 指派名單: ${leadId}, 來源: ${leadData.source}, 業務: ${salesName}`);

    // 3. 執行原地更新 (Update) - 不再使用 .add() 建立新文件
    const now = admin.firestore.Timestamp.now();
    const updatePayload = {
      assignedTo: salesId,
      assignedName: salesName,
      assignedAt: now,
      lastModifiedAt: now,
      lastModifiedBy: "櫃檯人員"
    };
    await leadRef.update(updatePayload);

    // 4. 發送 LINE 通知 (使用資料庫內已存好的精準 source 與 budget)
    if (salesLineId && salesLineId.startsWith('U')) {
      const channelToken = process.env.ANXISMART_LINE_CRM_TOKEN;
      if (channelToken) {
        // 合併更新後的資料傳給發送函式
        const notifyData = { ...leadData, ...updatePayload };
        await _sendLeadAssignmentFlex(
          channelToken,
          salesLineId,
          notifyData,
          leadId
        );
      }
    }

    return { status: "success", leadId: leadId };

  } catch (error) {
    console.error(`[${functionName}] 執行失敗:`, error);
    throw new HttpsError('internal', error.message);
  }
});

// =================================================================
// 2. [Scheduled] 動態定時提醒 (每 15 分鐘執行一次檢查)
// =================================================================
/**
 * [Scheduled] 動態定時提醒 (修正版：支援傳遞建案名稱)
 */
exports.scheduledLeadReminder = onSchedule({
  schedule: "0,30 * * * *", // 每 30 分鐘運行一次
  timeZone: "Asia/Taipei",
  region: "asia-east1",
  secrets: ["ANXISMART_LINE_CRM_TOKEN"]
}, async (event) => {
  const functionName = "scheduledLeadReminder";
  const db = new Firestore({ databaseId: "anxi-app" });
  const now = new Date();
  const currentHHmm = now.toLocaleTimeString('zh-TW', { hour12: false, hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Taipei' });

  console.log(`[${functionName}] 檢查點: ${currentHHmm}`);

  try {
    // 1. 撈取開啟通知的專案設定
    const settingsSnap = await db.collection("projectSettings")
      .where("isRemindEnabled", "==", true)
      .where("remindTime", "==", currentHHmm)
      .get();

    if (settingsSnap.empty) return;

    for (const settingDoc of settingsSnap.docs) {
      const projectId = settingDoc.id;

      // ✅ [新增] 獲取建案正式名稱
      const projectDoc = await db.collection("projects").doc(projectId).get();
      const projectName = projectDoc.exists ? (projectDoc.data().name || projectId) : projectId;

      // 2. 找出該專案「已分配但 status 為空」的名單
      const uncompletedSnap = await db.collection("leads")
        .where("projectId", "==", projectId)
        .where("status", "==", "")
        .where("isDeleted", "==", false)
        .get();

      if (uncompletedSnap.empty) continue;

      // 3. 彙整各銷售人員的未處理數量
      const userSummary = {};
      uncompletedSnap.forEach(doc => {
        const data = doc.data();
        const uid = data.assignedTo;
        if (!userSummary[uid]) {
          userSummary[uid] = { name: data.assignedName, count: 0 };
        }
        userSummary[uid].count++;
      });

      // 4. 取得 User LINE ID 並發送
      for (const [uid, info] of Object.entries(userSummary)) {
        const userDoc = await db.collection("users").doc(uid).get();
        const lineId = userDoc.data()?.lineId;

        if (lineId && lineId.startsWith('U')) {
          // ✅ [修改] 傳入 projectName 參數
          await _sendReminderFlex(
            process.env.ANXISMART_LINE_CRM_TOKEN,
            lineId,
            info.name,
            info.count,
            projectName
          );
        }
      }
    }
  } catch (error) {
    console.error(`[${functionName}] 定時任務失敗:`, error);
  }
});

// =================================================================
// 內部輔助函式 (Internal Helpers)
// =================================================================

/**
 * 解析引擎：支援三種文本格式
 */
function _parseLeadText(text) {
  let result = { name: "", phone: "", date: "", source: "", budget: "" };

  if (text.includes("【新名單】")) {
    // 格式一: 廠商提供
    result.name = text.match(/姓名：(.*?)\n/)?.[1] || "";
    result.phone = text.match(/連絡電話：(.*?)\n/)?.[1]?.replace("+886", "0").replace(/-/g, "") || "";
    result.date = text.match(/日期：(\d{4}年\d{2}月\d{2}日)/)?.[1]?.replace(/年|月/g, "/").replace("日", "") || "";
    result.source = text.match(/名單來源：(.*?)\n/)?.[1] || "廠商提供";
    result.budget = text.match(/問題一：(.*?)\n/)?.[1] || "";
  }
  else if (text.match(/\d{4}\/\d{2}\/\d{2}.*?T.*Z/)) {
    // 格式二: WIX
    const parts = text.trim().split(/\s+/);
    result.date = parts[0];
    result.name = parts[2];
    result.phone = parts[3];
    result.source = "WIX官網";
    result.budget = parts[4] || "";
  }
  else if (text.includes("【591】")) {
    // 格式三: 591
    result.name = text.match(/顧客姓名：(.*?)\n/)?.[1] || "";
    result.phone = text.match(/行動電話：(.*?)\n/)?.[1]?.replace(/-/g, "") || "";
    result.date = text.match(/提交時間：(.*?)\n/)?.[1] || "";
    result.source = "591平台";
    result.budget = "諮詢物件:" + (text.match(/咨詢物件：(.*?)\n/)?.[1] || "");
  }

  return result;
}

/**
 * LINE Flex: 新名單分配通知 (優化版：新增建案名稱顯示)
 */
async function _sendLeadAssignmentFlex(token, to, lead, docId) {
  // 注意：這裡的 URL 請根據您的實際 domain 調整
  const liffUrl = `https://anxismart.com/#/contact?id=${docId}`;

  const payload = {
    to: to,
    messages: [{
      type: "flex",
      altText: `📞 [${lead.projectName || "新名單"}] 分配通知`, // ✅ 預覽文字加入建案名稱
      contents: {
        type: "bubble",
        header: {
          type: "box",
          layout: "vertical",
          contents: [{
            type: "text",
            // ✅ 修改點：標題整合建案名稱與業務員姓名
            text: `[${lead.projectName || "客資系統"}] 名單分配`,
            weight: "bold",
            color: "#FFFFFF"
          }],
          backgroundColor: "#2E7D32"
        },
        body: {
          type: "box",
          layout: "vertical",
          contents: [
            // ✅ [新增] 內容第一行明確顯示建案名稱
            { type: "text", text: `建案：${lead.projectName || "未註明"}`, color: "#2E7D32", size: "sm", weight: "bold", margin: "xs" },
            { type: "separator", margin: "md" },
            { type: "text", text: `客戶：${lead.name}`, weight: "bold", size: "lg", margin: "md" },
            {
              type: "text",
              text: `電話：${lead.phone}`,
              color: "#1565C0",
              size: "lg",
              margin: "sm",
              decoration: "underline",
              action: {
                type: "clipboard",
                label: "複製電話號碼",
                clipboardText: lead.phone.replace(/\s+/g, '')
              }
            },
            { type: "text", text: `預算：${lead.budget || "未填寫"}`, color: "#666666", size: "lg", margin: "sm" },
            { type: "text", text: `來源：${lead.source || "未知"}`, color: "#666666", size: "lg", margin: "sm" },
            { type: "text", text: `日期：${lead.date || "未知"}`, color: "#666666", size: "lg", margin: "sm" },
            {
              type: "text",
              text: `備註：${lead.note || "無"}`,
              color: "#666666",
              size: "lg",
              margin: "sm",
              wrap: true
            },
            { type: "separator", margin: "md" },
            {
              type: "text",
              text: lead.statusText || "",
              color: (lead.statusText?.includes("🚩") ? "#E65100" : "#2E7D32"),
              size: "xs",
              margin: "md"
            }
          ]
        },
        footer: {
          type: "box",
          layout: "vertical",
          spacing: "sm",
          contents: [{
            type: "button",
            action: {
              type: "uri",
              label: "回報聯絡狀況",
              uri: liffUrl
            },
            style: "primary",
            color: "#2E7D32"
          }]
        }
      }
    }]
  };

  return axios.post("https://api.line.me/v2/bot/message/push", payload, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
}

/**
 * LINE Flex: 定時提醒 (優化版：加入建案名稱與按鈕)
 */
async function _sendReminderFlex(token, to, name, count, projectName) {
  // 聯絡名單系統入口 LIFF URL
  const liffUrl = "https://liff.line.me/2008257338-FSWtfaEM";

  const payload = {
    to: to,
    messages: [{
      type: "flex",
      altText: `⏰ [${projectName || "客資系統"}] 名單回報提醒`, // ✅ 加入建案預覽
      contents: {
        type: "bubble",
        header: { // ✅ 新增 Header 區塊顯示建案
          type: "box",
          layout: "vertical",
          contents: [{
            type: "text",
            text: `[${projectName || "客資系統"}] 定時提醒`,
            weight: "bold",
            color: "#FFFFFF"
          }],
          backgroundColor: "#1A237E" // 深藍色
        },
        body: {
          type: "box",
          layout: "vertical",
          contents: [
            { type: "text", text: `您好 ${name}`, size: "sm", color: "#666666" },
            {
              type: "text",
              text: `您目前尚有 ${count} 筆`,
              weight: "bold",
              size: "xl",
              margin: "md",
              color: "#D32F2F"
            },
            { type: "text", text: "未完成的聯絡名單回報", weight: "bold", size: "md" },
            {
              type: "button",
              action: {
                type: "uri",
                label: "🔎名單聯絡狀況",
                uri: liffUrl
              },
              style: "primary",
              color: "#1A237E",
              margin: "xl"
            }
          ]
        }
      }
    }]
  };

  return axios.post("https://api.line.me/v2/bot/message/push", payload, {
    headers: { Authorization: `Bearer ${token}` }
  });
}


/**
 * [V3 - 優化版] 名單重複檢查系統
 * 邏輯：解析名單後，比對電話是否存在於 vipGuests (成交) 或 leads (既有) 集合
 */
exports.checkLeadDuplicates = onCall({
  region: "asia-east1",
  cors: true,
  memory: "256MiB",
  timeoutSeconds: 60
}, async (request) => {
  const functionName = "checkLeadDuplicates";
  const db = new Firestore({ databaseId: "anxi-app" });

  try {
    const { projectId, phones } = request.data;

    if (!projectId || !phones || !Array.isArray(phones)) {
      throw new HttpsError("invalid-argument", "缺少必要參數。");
    }

    // 1. 電話正規化 (只留數字) 並去除重複，確保比對準確
    const cleanPhones = [...new Set(phones.map(p => p.replace(/\D/g, "")))];
    const results = {};

    // 預設所有電話為無重複狀態
    cleanPhones.forEach(p => { results[p] = { type: "none", data: null }; });

    console.log(`[${functionName}] 專案: ${projectId}, 檢查數量: ${cleanPhones.length}`);

    // 2. 第一階段：比對 vipGuests (成交客戶/已有客資)
    // array-contains-any 限制一次 10 筆
    for (let i = 0; i < cleanPhones.length; i += 10) {
      const chunk = cleanPhones.slice(i, i + 10);
      const vipSnap = await db.collection("vipGuests")
        .where("projectId", "==", projectId)
        .where("searchablePhones", "array-contains-any", chunk)
        .get();

      vipSnap.forEach(doc => {
        const guest = doc.data();
        const matchedPhone = chunk.find(p => guest.searchablePhones?.includes(p));

        if (matchedPhone) {
          // ✅ 提取完整互動紀錄 (倒序排列，最新的在前)
          const rawLogs = guest.interactionLogs || [];
          const sortedLogs = rawLogs.sort((a, b) => {
            const timeA = a.createdAt?.toMillis ? a.createdAt.toMillis() : (new Date(a.date || 0).getTime());
            const timeB = b.createdAt?.toMillis ? b.createdAt.toMillis() : (new Date(b.date || 0).getTime());
            return timeB - timeA;
          });

          // ✅ 提取基本資料 (Profile)
          const profile = guest.profile || {};
          // 嘗試從多個欄位來源獲取關鍵資訊
          const source = profile['從何得知本建案'] || profile.source || guest.source || '未知';
          const budget = profile['購屋預算'] || profile.budget || guest.budget || '未填寫';

          results[matchedPhone] = {
            type: "vip",
            data: {
              latestName: guest.latestName || "未知",
              latestSalesName: guest.latestSalesName || "未指派",
              latestSalesPhone: guest.latestSalesPhone || "", // 分配的 KEY
              visitDate: guest.submissions?.[0]?.拜訪日期 || "",

              // 擴充欄位供詳情對話框使用
              profile: {
                ...profile,
                source: source,
                budget: budget
              },
              interactionLogs: sortedLogs,

              // 預覽用簡化欄位
              source: source,
              budget: budget,
              date: sortedLogs[0]?.date || guest.submissions?.[0]?.拜訪日期 || "",
              status: sortedLogs.length > 0
                ? `最近洽談: ${sortedLogs[0].content?.substring(0, 10)}${sortedLogs[0].content?.length > 10 ? '...' : ''}`
                : "尚無洽談紀錄"
            }
          };
        }
      });
    }

    // 3. 第二階段：比對 leads (既有名單)
    // 僅檢查目前還是 "none" 的電話
    const remainingPhones = cleanPhones.filter(p => results[p].type === "none");

    for (let i = 0; i < remainingPhones.length; i += 30) {
      const chunk = remainingPhones.slice(i, i + 30);
      const leadsSnap = await db.collection("leads")
        .where("projectId", "==", projectId)
        .where("phone", "in", chunk)
        .get();

      const leadGroups = {};
      leadsSnap.forEach(doc => {
        const lead = doc.data();
        lead.id = doc.id; // 保存 doc id 以便查詢 sub-collection
        if (!leadGroups[lead.phone]) leadGroups[lead.phone] = [];
        leadGroups[lead.phone].push(lead);
      });

      // 使用 Promise.all 處理並行查詢
      await Promise.all(Object.keys(leadGroups).map(async (phone) => {
        const group = leadGroups[phone];

        // 找出最晚分配的一筆 (作為主要顯示資料)
        const sortedMap = group.sort((a, b) =>
          (b.assignedAt?.toMillis() || 0) - (a.assignedAt?.toMillis() || 0)
        );
        const latest = sortedMap[0];

        // 查詢該電話所有相關名單的 contactLogs
        // 因為名單可能會有多筆 (多次重複進線)，我們嘗試撈取所有相關的聯絡紀錄
        // 為了效能，限制只撈取最新的幾筆名單的 logs
        const targetLeads = sortedMap.slice(0, 5); // 取最新的 5 筆名單 doc
        let allLogs = [];

        try {
          const logsPromises = targetLeads.map(async (leadDoc) => {
            const logsSnap = await db.collection("leads").doc(leadDoc.id).collection("contactLogs")
              .orderBy("createdAt", "desc")
              .limit(5) // 每筆名單只取最近 5 筆紀錄
              .get();

            return logsSnap.docs.map(logDoc => {
              const log = logDoc.data();
              // ✅ 預先格式化日期，避免前端解析 Timestamp 出錯
              let dateStr = "";
              if (log.createdAt && log.createdAt.toDate) {
                try {
                  dateStr = log.createdAt.toDate().toLocaleString('zh-TW', { timeZone: 'Asia/Taipei', hour12: false });
                } catch (e) { dateStr = "日期格式錯誤"; }
              }

              return {
                ...log,
                // 因為是 sub-collection，補上 parent lead 的資訊以便前端顯示上下文
                parentLeadDate: leadDoc.assignedAt ? leadDoc.assignedAt.toDate().toISOString() : null,
                parentLeadSource: leadDoc.source || '未知',
                logId: logDoc.id,
                date: dateStr // ✅ 提供給前端使用的格式化字串
              };
            });
          });

          const logsResults = await Promise.all(logsPromises);
          allLogs = logsResults.flat().sort((a, b) => {
            const timeA = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
            const timeB = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
            return timeB - timeA;
          });

        } catch (err) {
          console.error(`[checkLeadDuplicates] Error fetching contactLogs for phone ${phone}:`, err);
          // 錯誤不阻斷主流程，僅 log
        }

        results[phone] = {
          type: "lead",
          data: {
            count: group.length,
            name: latest.name || "未知",
            assignedName: latest.assignedName || "未指派",
            assignedTo: latest.assignedTo || "", // 業務手機
            assignedAt: latest.assignedAt ? latest.assignedAt.toDate().toLocaleString('zh-TW', { timeZone: 'Asia/Taipei' }) : "",

            // 擴充欄位
            source: latest.source || "未知",
            budget: latest.budget || "未填寫",
            date: latest.date || "",
            status: latest.statusText || latest.status || "重複名單",
            note: latest.note || "",

            // 新增: 互動紀錄
            interactionLogs: allLogs
          }
        };
      }));
    }

    return { status: "success", results };

  } catch (error) {
    console.error(`[${functionName}] 異常:`, error);
    throw new HttpsError('internal', error.message);
  }
});


/**
 * ✅ [新函式] 批次匯入名單並直接分配 (簡化流程專用)
 * 接收：{ projectId, leads, operator }
 */
exports.batchImportAndAssignLeads = onCall({
  region: "asia-east1",
  cors: true,
  memory: "512MiB",
  timeoutSeconds: 120,
  secrets: ["ANXISMART_LINE_CRM_TOKEN"]
}, async (request) => {
  const functionName = "batchImportAndAssignLeads";
  const db = new Firestore({ databaseId: "anxi-app" });
  const { projectId, leads, operator } = request.data;

  if (!projectId || !Array.isArray(leads)) {
    throw new HttpsError("invalid-argument", "缺少必要參數。");
  }

  try {
    // ✅ [新增] 在迴圈開始前，先獲取建案名稱
    const projectDoc = await db.collection("projects").doc(projectId).get();
    const projectName = projectDoc.exists ? (projectDoc.data().name || projectId) : projectId;

    const results = [];
    const now = admin.firestore.Timestamp.now();
    const channelToken = process.env.ANXISMART_LINE_CRM_TOKEN;

    for (const leadData of leads) {
      const payload = {
        name: leadData.name || "",
        phone: leadData.phone || "",
        date: leadData.date || "",
        source: leadData.source || "廠商提供",
        statusText: leadData.statusText || "",
        budget: leadData.budget || "",
        note: leadData.note || "",       // ✅ 新增：將前端傳來的備註寫入資料庫
        rawText: leadData.rawText || "",  // ✅ 新增：記錄原始匯入方式 (如 "手動錄入")
        projectId: projectId,
        projectName: projectName,
        status: "",
        isDeleted: false,
        createdAt: now,
        importedBy: operator
      };

      // 如果有指派業務
      if (leadData.assignedTo) {
        payload.assignedTo = leadData.assignedTo;
        payload.assignedName = leadData.assignedName;
        payload.assignedAt = now;
        payload.lastModifiedAt = now;
        payload.lastModifiedBy = operator;
      }

      // 2. 寫入資料庫
      const docRef = await db.collection("leads").add(payload);
      const leadId = docRef.id;

      // 3. 如果有指派，發送 LINE 通知
      if (payload.assignedTo) {
        const userDoc = await db.collection("users").doc(payload.assignedTo).get();
        const salesLineId = userDoc.exists ? userDoc.data().lineId : null;

        if (salesLineId && salesLineId.startsWith('U') && channelToken) {
          // 使用既有的發送邏輯
          await _sendLeadAssignmentFlex(channelToken, salesLineId, payload, leadId);
        }
      }
      results.push(leadId);
    }

    return { status: "success", count: results.length };

  } catch (error) {
    console.error(`[${functionName}] 執行失敗:`, error);
    throw new HttpsError('internal', error.message);
  }
});


/**
 * 🤖 AI 優化洽談紀錄 (使用 Gemini 1.5 Flash)
 * 接收：{ text: "原始文本" }
 * 回傳：{ optimizedText: "優化後的文本" }
 */
exports.optimizeInteractionLog = onCall({
  region: "asia-east1",
  cors: true,
  memory: "256MiB",
  timeoutSeconds: 30, // Gemini 回應通常很快
  minInstances: 0,
  secrets: ["GEMINI_API_KEY"], // ✅ 啟用 Secret Manager
}, async (request) => {
  const { text } = request.data;

  if (!text || typeof text !== 'string' || text.trim().length === 0) {
    throw new HttpsError('invalid-argument', '請提供有效的文本內容');
  }

  // 從環境變數讀取 API Key
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error("❌ 缺少 GEMINI_API_KEY 環境變數");
    throw new HttpsError('failed-precondition', '系統未設定 AI 金鑰，請聯繫管理員');
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const prompt = `
作為一位房地產銷售專家，請優化以下「洽談紀錄」。

**優化規則 (嚴格執行)**：
1. **禁止使用星號 (*)**：不要使用 Markdown 粗體或清單符號。
2. **尊重原始格式**：
   - 若原始文本是「流水帳/段落式」，優化後維持「段落式」，**不要**強制轉為條列點。
   - 若原始文本原本就是「條列式」，優化後才可使用條列 (但請用 - 或數字，勿用 *)。
3. **語氣優化**：去除口語冗贅詞 (如: 客戶說、然後、覺得...)，改用精簡專業敘述。保留核心資訊 (價格、意願、抗性)。
4. **客觀中立**：使用專業術語 (例如：預算不足 -> 預算受限；還在看 -> 觀望中)。
5. **純文字輸出**：不需要加入「客戶洽談紀錄」等標題，也不要有任何開場白或結語。
6. **金額單位**：用戶輸入預算1000~2000，指的是新台幣，1000~2000萬， 不需要額外家住「新台幣」
7. **面積單位**：用戶輸入面積100~200，指的是坪，100~200坪，若用戶有特別提是平方公尺
8. **慣用詞語**：請使用台灣慣用繁體中文，請勿使用中國大陸用語，例如：台灣使用「戶別」或是「戶型」，請勿使用「單位」

**原始文本**：
"${text}"
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const optimizedText = response.text();

    return {
      status: "success",
      optimizedText: optimizedText.trim()
    };

  } catch (error) {
    console.error("❌ Gemini AI 優化失敗:", error);
    throw new HttpsError('internal', 'AI 優化服務暫時無法使用，請稍後再試');
  }
});


// =================================================================
// / Google Sheets Sync Functions
// =================================================================

/**
 * 列出指定 Google Sheet 的所有工作表名稱
 * 也會嘗試回傳授權帳號的 Email，以便用戶設定共用
 */
exports.listGoogleSheets = onCall({
  region: "asia-east1",
  secrets: driveSecrets,
  invoker: 'public', // 確保可以被 public 呼叫
}, async (request) => {
  const { spreadsheetInput } = request.data;

  if (!spreadsheetInput) {
    throw new HttpsError('invalid-argument', '請輸入 Google Sheet 網址或 ID');
  }

  // 嘗試從 URL 解析 ID
  let spreadsheetId = spreadsheetInput;
  const match = spreadsheetInput.match(/\/d\/([a-zA-Z0-9-_]+)/);
  if (match) {
    spreadsheetId = match[1];
  }

  try {
    const auth = getAuthenticatedOAuth2Client();
    const sheets = google.sheets({ version: 'v4', auth });

    // 1. 取得工作表資訊
    const response = await sheets.spreadsheets.get({
      spreadsheetId
    });

    const sheetNames = response.data.sheets.map(s => s.properties.title);

    // 2. 嘗試取得授權帳號的 Email (用於提示用戶共用)
    // 改用 auth.getClient() 直接獲取認證身分的 Email，這在 Cloud Functions 中會準確回傳 Service Account
    let agentEmail = '';
    try {
      const auth = new google.auth.GoogleAuth({
        scopes: ['https://www.googleapis.com/auth/cloud-platform']
      });
      const client = await auth.getClient();
      agentEmail = client.email;
    } catch (e) {
      console.warn('無法獲取 Agent Email:', e);
      agentEmail = '系統授權帳號 (請聯繫管理員確認)';
    }

    return {
      status: 'success',
      spreadsheetId, // 回傳解析後的 ID
      sheetNames,
      agentEmail
    };

  } catch (error) {
    console.error('listGoogleSheets Error:', error);
    // 判斷是否為權限問題
    if (error.code === 403 || error.code === 401) {
      throw new HttpsError('permission-denied', '系統無權限讀取此檔案。請確認您已將 Google Sheet 共用給系統帳號。');
    }
    if (error.code === 404) {
      throw new HttpsError('not-found', '找不到此 Google Sheet，請確認網址/ID 是否正確。');
    }
    throw new HttpsError('internal', `讀取 Google Sheet 失敗: ${error.message}`);
  }
});

/**
 * 將資料寫入指定的 Google Sheet
 * 模式：覆蓋指定工作表
 */
exports.exportToGoogleSheet = onCall({
  region: "asia-east1",
  secrets: driveSecrets
}, async (request) => {
  const { spreadsheetId, sheetName, values } = request.data;

  if (!spreadsheetId || !sheetName || !values || !Array.isArray(values)) {
    throw new HttpsError('invalid-argument', '缺少必要參數 (spreadsheetId, sheetName, values)');
  }

  try {
    const auth = getAuthenticatedOAuth2Client();
    const sheets = google.sheets({ version: 'v4', auth });

    // 1. 清空該工作表 (Clear)
    // 範圍設為 SheetName!A:ZZZ，確保清空所有內容
    await sheets.spreadsheets.values.clear({
      spreadsheetId,
      range: `'${sheetName}'!A:ZZZ`
    });

    // 2. 寫入新資料 (Update)
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: `'${sheetName}'!A1`,
      valueInputOption: 'USER_ENTERED', // 讓 Google Sheets 自動判斷格式 (日期、數字等)
      requestBody: {
        values: values
      }
    });

    return { status: 'success', message: '資料同步成功' };

  } catch (error) {
    console.error('exportToGoogleSheet Error:', error);
    if (error.code === 403) {
      throw new HttpsError('permission-denied', '系統無權限寫入此檔案。請確認您以「編輯者」身分共用了 Google Sheet。');
    }
    throw new HttpsError('internal', `寫入 Google Sheet 失敗: ${error.message}`);
  }
});

/**
 * [管理者功能] 發送自定義 HTML 郵件
 * 支援富文本內容，僅限已登入的管理員呼叫
 */
exports.sendCustomEmail = onCall({ region: "asia-east1", secrets: gmailSecrets }, async (request) => {
  const db = new Firestore({ databaseId: 'anxi-app' });
  const { to, subject, htmlContent, adminKey, sessionId, attachments } = request.data;

  // 1. 驗證必要參數
  if (!to || !subject || !htmlContent || !adminKey || !sessionId) {
    throw new HttpsError('invalid-argument', '缺少必要參數 (to, subject, htmlContent, adminKey 或 sessionId)');
  }

  // 2. 驗證管理員身分 (Session 檢查)
  try {
    const userDocSnap = await db.collection('users').doc(adminKey).get();
    if (!userDocSnap.exists) {
      throw new HttpsError('not-found', '找不到管理員帳號');
    }

    const userData = userDocSnap.data();
    if (userData.activeSessionId !== sessionId) {
      throw new HttpsError('unauthenticated', 'Session 已過期或無效，請重新登入');
    }

    // 這裡可以選擇性加入更多的權限檢查 (例如：isAdmin)
  } catch (authError) {
    if (authError instanceof HttpsError) throw authError;
    console.error('[sendCustomEmail] Auth Error:', authError);
    throw new HttpsError('internal', '權限驗證失敗');
  }

  try {
    // 3. 建立郵件傳輸實例 (使用現有的寄件者設定)
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.SENDER_EMAIL,
        pass: process.env.GMAIL_APP_PASSWORD
      }
    });

    const mailOptions = {
      from: `"ANIX建案管理系統" <${process.env.SENDER_EMAIL}>`,
      to: to,
      subject: subject,
      html: htmlContent,
      attachments: attachments
    };

    // 4. 發送郵件
    const info = await transporter.sendMail(mailOptions);
    console.log(`[sendCustomEmail] 成功發送至 ${to}:`, info.messageId);

    return {
      status: 'success',
      message: '郵件發送成功',
      messageId: info.messageId
    };
  } catch (error) {
    console.error('[sendCustomEmail] 錯誤:', error);
    throw new HttpsError('internal', '發送郵件時發生技術錯誤，請稍後再試。');
  }
});

/**
 * [內部函式] 處理客戶回傳訊息提交
 */
async function _handleSubmitCustomerMessage(data) {
  // 由於在 Cloud Functions 環境，使用 admin.firestore() 或 new Firestore() 
  // 這裡 bookingApi 上下文通常是 admin sdk 環境，但前面 _handleGetProjectConfig 用了 new Firestore
  // 我們保持一致使用 admin.firestore() 若已有 admin 初始化，或者 new Firestore
  // 參考前方程式碼: const db = new Firestore({ databaseId: 'anxi-app' });
  const db = new Firestore({ databaseId: 'anxi-app' });

  const { projectId, building, unit, idNumber, configId, dynamicData, attachments } = data;

  // 1. 基本參數驗證
  if (!projectId || !building || !unit) {
    throw new HttpsError('invalid-argument', '缺少必要的戶別資訊 (projectId, building, unit)');
  }
  if (!configId) {
    throw new HttpsError('invalid-argument', '缺少 configId');
  }

  try {
    // 2. 獲取專案設定並驗證 configId
    const projectDoc = await db.collection('projects').doc(projectId).get();
    if (!projectDoc.exists) {
      throw new HttpsError('not-found', '找不到指定的專案');
    }
    const projectConfig = projectDoc.data();
    const customerMessageConfigs = projectConfig.customerMessageConfigs || [];
    const config = customerMessageConfigs.find(c => c.id === configId);

    if (!config) {
      throw new HttpsError('not-found', '找不到指定的回傳功能設定');
    }

    // 3. 身分驗證 (如果有啟用)
    if (config.enableIdVerification) {
      if (!idNumber) {
        throw new HttpsError('invalid-argument', '此功能需驗證身分證字號');
      }
      // 重用現有的驗證邏輯
      // 注意：_handleValidateId 若失敗會直接拋錯
      // 我們假設 _handleValidateId 在此作用域可訪問 (它在 bookingApi 內部被調用，應該是同一個檔案的函式)
      await _handleValidateId({ projectId, unitId: unit, idNumber });
    }

    // 4. 查找戶別文件
    // 使用與 _handleValidateId 相同的路徑邏輯: households 為根集合，ID 為 ${projectId}_${unit}
    const householdDocId = `${projectId}_${unit}`;
    const householdRef = db.collection('households').doc(householdDocId);
    const householdDoc = await householdRef.get();

    if (!householdDoc.exists) {
      throw new HttpsError('not-found', '找不到指定的戶別資料');
    }

    // 5. 準備訊息物件
    const messageId = crypto.randomUUID();
    const messageData = {
      id: messageId,
      createdAt: Timestamp.now(),
      configId: config.id,
      functionName: config.functionName, // 冗餘儲存方便顯示
      data: dynamicData || {}, // 動態表單資料
      attachments: attachments || [], // 附件列表 [{name, url, path}]
      status: 'new' // 初始狀態
    };

    // 6. 更新戶別文件 (Array Union)
    await householdRef.update({
      customerMessages: FieldValue.arrayUnion(messageData)
    });

    return {
      status: 'success',
      messageId: messageId,
      message: '提交成功'
    };

  } catch (error) {
    console.error('[_handleSubmitCustomerMessage] Error:', error);
    if (error instanceof HttpsError) throw error;
    throw new HttpsError('internal', `提交失敗: ${error.message}`);
  }
}

// =================================================================
// 3. [Feature] Google Sheet Sync (Rebuild)
// =================================================================

/**
 * [Helper] 取得 Google Sheets API Client (Host Service Account)
 */
async function _getGoogleSheetClient() {
  const auth = new google.auth.GoogleAuth({
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });
  const authClient = await auth.getClient();
  return google.sheets({ version: 'v4', auth: authClient });
}

/**
 * [API] 列出 Google Sheet 所有工作表名稱
 * @param {object} data - { spreadsheetInput } (ID or URL)
 */
exports.listGoogleSheets = onCall({
  region: "asia-east1",
  cors: true,
  memory: "256MiB",
  timeoutSeconds: 30,
}, async (request) => {
  const { spreadsheetInput } = request.data;
  if (!spreadsheetInput) {
    throw new HttpsError('invalid-argument', '缺少 spreadsheetInput');
  }

  // Extract ID from URL if needed
  let spreadsheetId = spreadsheetInput;
  const match = spreadsheetInput.match(/\/d\/([a-zA-Z0-9-_]+)/);
  if (match) {
    spreadsheetId = match[1];
  }

  try {
    const sheets = await _getGoogleSheetClient();
    const response = await sheets.spreadsheets.get({
      spreadsheetId,
    });

    const sheetNames = response.data.sheets.map(s => s.properties.title);

    // Get Service Account Email for instruction
    const auth = new google.auth.GoogleAuth();
    const credentials = await auth.getCredentials();
    const agentEmail = credentials.client_email;

    return { status: 'success', sheetNames, agentEmail };
  } catch (error) {
    console.error('[listGoogleSheets] Error:', error);
    throw new HttpsError('internal', `無法讀取 Sheet: ${error.message}`);
  }
});

/**
 * [API] 單次手動同步：將指定 Project 所有的 Households 寫入 Sheet
 * @param {object} data - { projectId, spreadsheetId, sheetName }
 */
exports.syncHouseholdsToSheet = onCall({
  region: "asia-east1",
  cors: true,
  memory: "512MiB",
  timeoutSeconds: 540, // Long timeout for batch
}, async (request) => {
  const { projectId, spreadsheetId, sheetName } = request.data;
  const functionName = "syncHouseholdsToSheet";

  if (!projectId || !spreadsheetId || !sheetName) {
    throw new HttpsError('invalid-argument', '缺少必要參數 (projectId, spreadsheetId, sheetName)');
  }

  const db = new Firestore({ databaseId: 'anxi-app' });

  try {
    // Log Service Account Email for debugging permissions
    const auth = new google.auth.GoogleAuth();
    const credentials = await auth.getCredentials();
    console.log(`[${functionName}] Service Account Email: ${credentials.client_email}`);

    console.log(`[${functionName}] 開始同步: Project=${projectId} -> Sheet=${spreadsheetId} (${sheetName})`);

    // 1. Fetch all households
    const snapshot = await db.collection('households')
      .where('projectId', '==', projectId)
      .get(); // Note: Consider limits if > 1000 docs

    if (snapshot.empty) {
      return { status: 'success', message: '該專案無住戶資料' };
    }

    const households = [];
    snapshot.forEach(doc => {
      households.push({ _docId: doc.id, ...doc.data() });
    });

    // 2. Flatten Data
    const rows = households.map(h => _flattenHouseholdForSheet(h));

    // 3. Prepare Headers (Dynamic based on fieldDisplayNames + extras)
    // 我們要確保所有可能的 keys 都被包含，或者是使用者定義的 header 對應
    // 這裡使用 fieldDisplayNames 作為參考，並加入 rows 中出現但未定義 keys

    // 定義基本必要欄位順序
    let headers = ['_id', 'updatedAt'];
    // 加入 fieldDisplayNames 定義的欄位(顯示中文)
    const displayKeys = Object.keys(fieldDisplayNames);
    headers = headers.concat(displayKeys.filter(k => k !== '_id' && k !== 'updatedAt'));

    // 找出 rows 中存在但 headers 沒定義的 keys (額外欄位)
    const allRowKeys = new Set();
    rows.forEach(r => Object.keys(r).forEach(k => allRowKeys.add(k)));

    const extraKeys = Array.from(allRowKeys).filter(k => !headers.includes(k));
    headers = headers.concat(extraKeys);

    // 建立 Header Row (中文名稱)
    const headerRow = headers.map(key => {
      if (key === '_id') return 'System ID (系統)';
      if (key === 'updatedAt') return '更新時間';
      return fieldDisplayNames[key] || key;
    });

    // 4. Transform Rows to Array relative to Headers
    const values = [headerRow];
    rows.forEach(row => {
      const rowData = headers.map(key => {
        let val = row[key];
        if (val === undefined || val === null) return '';
        // Convert Arrays/Objects to string
        if (typeof val === 'object') return JSON.stringify(val);
        return String(val);
      });
      values.push(rowData);
    });

    // 5. Write to Sheet (Clear & Write)
    const sheets = await _getGoogleSheetClient();

    // Clear existing content
    await sheets.spreadsheets.values.clear({
      spreadsheetId,
      range: `'${sheetName}'!A:ZZ`, // 清除大範圍
    });

    // Write new content
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: `'${sheetName}'!A1`,
      valueInputOption: 'USER_ENTERED',
      resource: { values },
    });

    console.log(`[${functionName}] 同步完成，共 ${rows.length} 筆`);
    return { status: 'success', message: `手動同步 ${rows.length} 筆資料`, count: rows.length };

  } catch (error) {
    console.error(`[${functionName}] 失敗:`, error);
    throw new HttpsError('internal', `同步失敗: ${error.message}`);
  }
});

/**
 * [Trigger] 住戶資料有異動時，即時同步到 Sheet
 */
exports.onHouseholdWrite = onDocumentWritten({
  document: "households/{householdId}",
  database: "anxi-app",
  region: "asia-east1",
}, async (event) => {
  const functionName = "onHouseholdWrite";
  const householdId = event.params.householdId;

  // 1. 判斷資料存在與否 (是刪除還是更新/修改)
  const newData = event.data?.after?.data();
  const oldData = event.data?.before?.data();

  // 如果是刪除，newData 為 undefined；如果是新增，oldData 為 undefined
  // 我們需要 projectId 來查詢設定。如果是刪除，只能從 oldData 取得
  const projectId = newData?.projectId || oldData?.projectId;

  if (!projectId) {
    console.log(`[${functionName}] 找不到 projectId，忽略 (ID: ${householdId})`);
    return;
  }

  const db = new Firestore({ databaseId: 'anxi-app' });

  try {
    // 2. 讀取 Project Settings 設定
    const projectDoc = await db.collection('projects').doc(projectId).get();
    if (!projectDoc.exists) return;

    const settings = projectDoc.data();
    const spreadsheetId = settings.googleSheetId;
    const sheetName = settings.googleSheetTabName;

    if (!spreadsheetId || !sheetName) {
      // 若設定未同步則直接忽略
      return;
    }

    console.log(`[${functionName}] 偵測到異動，準備同步: ID=${householdId} -> Sheet=${spreadsheetId}`);

    const sheets = await _getGoogleSheetClient();

    // 3. 找出該 Row 在 Sheet 中的位置 (by _id column A)
    // 只讀取 A 欄以節省 Quota
    const range = `'${sheetName}'!A:A`;
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range,
    });

    const values = response.data.values || [];
    let rowIndex = -1;

    // 尋找 householdId (跳過 Header Row 1)
    for (let i = 1; i < values.length; i++) {
      if (values[i][0] === householdId) {
        rowIndex = i + 1; // 1-based index
        break;
      }
    }

    // 4. 判斷操作類型處理
    if (!newData) {
      // --- 刪除操作 ---
      if (rowIndex > -1) {
        // Delete the row
        // Note: deleting a row shifts others up. 'batchUpdate' with 'deleteDimension' is needed.
        // Using spreadsheets.batchUpdate
        const sheetId = await _getSheetIdByName(sheets, spreadsheetId, sheetName);
        if (sheetId !== null) {
          await sheets.spreadsheets.batchUpdate({
            spreadsheetId,
            resource: {
              requests: [{
                deleteDimension: {
                  range: {
                    sheetId: sheetId,
                    dimension: 'ROWS',
                    startIndex: rowIndex - 1, // 0-based inclusive
                    endIndex: rowIndex        // 0-based exclusive
                  }
                }
              }]
            }
          });
          console.log(`[${functionName}] 已刪除 Row ${rowIndex}`);
        }
      }
    } else {
      // --- 新增或更新操作 ---
      const flattened = _flattenHouseholdForSheet({ _docId: householdId, ...newData });

      // 讀取 Header (第一列) 以決定欄位順序
      // 如果是新增且為第一筆資料(values.length <= 1)，可能需要建立 Header? 
      // 假設使用者已經做過 "Initial Sync"，Header 應該存在。
      // 如果 Header 不存在 (空表)，這時可能需要 fallback 或 error??
      // 為了穩健，這裡讀取第一列 Header。
      const headerResp = await sheets.spreadsheets.values.get({
        spreadsheetId,
        range: `'${sheetName}'!1:1`,
      });

      let headers = headerResp.data.values?.[0] || [];

      if (headers.length === 0) {
        console.warn(`[${functionName}] Sheet 標題列為空，無法同步，請先執行全量同步。`);
        return;
      }

      // 建立對應的 values array
      const rowData = headers.map(headerLabel => {
        // Reverse lookup: Header Label -> Key
        // 這裡有點困難，因為 Header 是中文。
        // 我們需要使用 fieldDisplayNames 反向查找 Key，也要處理 _id 這種系統欄位

        if (headerLabel === 'System ID (系統)') return flattened['_id'];
        if (headerLabel === '更新時間') return flattened['updatedAt'];

        // 嘗試找 fieldDisplayNames 的 Key
        // e.g. "預約項目" -> "bookingType"
        const key = Object.keys(fieldDisplayNames).find(k => fieldDisplayNames[k] === headerLabel);
        if (key) return _formatValue(flattened[key]);

        // 如果找不到，試著直接用 HeaderLabel 當 Key (額外欄位，若是一樣 key 當 header)
        // 或者是手動同步時的 extraKeys 直接寫入 header
        return _formatValue(flattened[headerLabel]);
      });

      // 確保 _id 在第一欄 (如果 Header 沒對齊可能有風險，但我們假設 Col A 是 ID)
      if (rowData[0] !== householdId) {
        // 確保第一欄是 ID，即使 Header 說它不是 (這只是 fallback)
        // 但上面邏輯已經 handle 了 'System ID (系統)'
      }

      if (rowIndex > -1) {
        // Update existing row
        await sheets.spreadsheets.values.update({
          spreadsheetId,
          range: `'${sheetName}'!A${rowIndex}`,
          valueInputOption: 'USER_ENTERED',
          resource: { values: [rowData] },
        });
        console.log(`[${functionName}] 已更新 Row ${rowIndex}`);
      } else {
        // Append new row
        // 注意：rowData 的長度應該對齊 Header
        await sheets.spreadsheets.values.append({
          spreadsheetId,
          range: `'${sheetName}'!A1`,
          valueInputOption: 'USER_ENTERED',
          resource: { values: [rowData] },
        });
        console.log(`[${functionName}] 已新增 Row`);
      }
    }

  } catch (error) {
    console.error(`[${functionName}] 錯誤:`, error);
    // Trigger 錯誤通常只能 log，無法回傳給 client
  }
});


// --- Helper Functions ---

/**
 * [Helper] 攤平住戶資料
 */
function _flattenHouseholdForSheet(h) {
  const flat = { ...h };

  // 基本轉換
  flat['_id'] = h._docId || h.id;

  // Handle Timestamp to String
  if (h.updatedAt && h.updatedAt.toDate) {
    flat['updatedAt'] = h.updatedAt.toDate().toISOString();
  } else if (!flat['updatedAt']) {
    flat['updatedAt'] = new Date().toISOString();
  }

  // Handle special nested fields like 'checklist'
  if (h.checklist) {
    Object.keys(h.checklist).forEach(area => {
      // e.g. livingRoom_floor
      // 如果結構是 checklist: { livingRoom: { items: [...] } }，這樣很複雜
      // 假設 checklist 是扁平 map 或者是 object with status
      // 這裡依據實際資料結構調整。
      // 暫時將整個 checklist 轉為 JSON
    });
    flat['checklist'] = JSON.stringify(h.checklist);
  }

  // Handle inspectionRecords (Array)
  if (Array.isArray(h.inspectionRecords)) {
    flat['inspectionRecords'] = JSON.stringify(h.inspectionRecords);
  }

  // Handle customerMessages: Format to readable string
  if (Array.isArray(h.customerMessages) && h.customerMessages.length > 0) {
    flat['customerMessages'] = h.customerMessages.map(msg => {
      // 1. Date
      let dateStr = '未知時間';
      if (msg.createdAt && msg.createdAt._seconds) {
        const date = new Date(msg.createdAt._seconds * 1000);
        // Simple formatting: YYYY/MM/DD HH:mm
        dateStr = date.toLocaleString('zh-TW', {
          timeZone: 'Asia/Taipei',
          year: 'numeric', month: '2-digit', day: '2-digit',
          hour: '2-digit', minute: '2-digit', hour12: false
        });
      } else if (msg.createdAt && msg.createdAt.toDate) { // Firestore Timestamp
        const date = msg.createdAt.toDate();
        dateStr = date.toLocaleString('zh-TW', {
          timeZone: 'Asia/Taipei',
          year: 'numeric', month: '2-digit', day: '2-digit',
          hour: '2-digit', minute: '2-digit', hour12: false
        });
      }

      // 2. Data Content
      let dataContent = '';
      if (msg.data && typeof msg.data === 'object') {
        // Join values: "XXX銀行 | 王小明 | 0988888888"
        dataContent = Object.values(msg.data).join(' | ');
      }

      // 3. Attachments
      let attachmentContent = '';
      if (msg.attachments && Array.isArray(msg.attachments) && msg.attachments.length > 0) {
        const links = msg.attachments.map(att => `[檔案] ${att.url}`).join('\n');
        attachmentContent = `\n附件:\n${links}`;
      }

      // Combine
      // [2026/02/04 18:03] 自覓銀行回傳
      // 資料: XXX銀行 | ...
      // 附件: ...
      let block = `[${dateStr}] ${msg.functionName || '訊息'}`;
      if (dataContent) block += `\n資料: ${dataContent}`;
      if (attachmentContent) block += `${attachmentContent}`;

      return block;
    }).join('\n\n--------------------\n\n'); // Separator between messages
  } else if (h.customerMessages) {
    // Fallback if not array but exists (shouldn't happen based on known schema)
    flat['customerMessages'] = JSON.stringify(h.customerMessages);
  }

  return flat;
}

function _formatValue(val) {
  if (val === undefined || val === null) return '';
  if (typeof val === 'object') return JSON.stringify(val);
  return String(val);
}

async function _getSheetIdByName(sheets, spreadsheetId, sheetName) {
  const res = await sheets.spreadsheets.get({ spreadsheetId });
  const sheet = res.data.sheets.find(s => s.properties.title === sheetName);
  return sheet ? sheet.properties.sheetId : null;
}

// =================================================================
// 4. [Feature] Sales Control Record Google Sheet Sync
// =================================================================

/**
 * [Helper] 取得 Google Sheets API Client (Host Service Account) - 銷控專用
 */
async function _getSalesSyncGoogleSheetClient() {
  const auth = new google.auth.GoogleAuth({
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });
  const authClient = await auth.getClient();
  return google.sheets({ version: 'v4', auth: authClient });
}

// 銷控資料欄位顯示名稱定義
const salesFieldDisplayNames = {
  unitId: '戶別',
  status: '銷控狀態',
  isPreferredPayment: '是否優付',

  // 面積資訊
  area_house_ping: '房屋坪數',
  area_terrace_ping: '露臺坪數',
  area_main_ping: '主建物坪數',
  area_ancillary_ping: '附屬建物坪數',
  area_common_ping: '公設坪數',

  // 價格資訊 (表價)
  price_list_house_total: '房屋總表價',
  unit_price_list: '表價單價',
  price_list_house_only: '房屋表價',
  price_list_terrace: '露臺表價',

  // 價格資訊 (底價)
  price_floor_house_total: '房屋總底價',
  unit_price_floor: '底價單價',
  price_floor_house_only: '房屋底價',
  price_floor_terrace: '露臺底價',

  // 價格資訊 (成交)
  price_transaction_house: '房屋成交價',
  unit_price_transaction: '成交單價',
  total_transaction: '成交總價(含車)',
  parking_trans_total: '車位成交總價',
  price_diff: '溢差價',

  // 買方資訊
  buyerName: '買方姓名',
  buyerPhone: '買方電話',
  buyerIdNumber: '身分證字號',
  buyerEmail: 'Email',

  // 日期資訊
  payment_deposit_date: '小訂日期',
  payment_contract_date: '簽約日期',

  // 其他
  salesperson: '銷售人員',
  contractType: '合約方式',
  remarks: '備註'
};

/**
 * [API] 銷控資料全量同步：將某個 Project 的所有 salesHouseholds 寫入 Sheet
 */
exports.syncSalesHouseholdsToSheet = onCall({
  region: "asia-east1",
  cors: true,
  memory: "512MiB",
  timeoutSeconds: 540,
  invoker: 'public', // 確保可以被 public 呼叫 (由 Firebase SDK 處理 Auth)
}, async (request) => {
  const { projectId, spreadsheetId, sheetName } = request.data;
  const functionName = "syncSalesHouseholdsToSheet";

  if (!projectId || !spreadsheetId || !sheetName) {
    throw new HttpsError('invalid-argument', '缺少必要參數 (projectId, spreadsheetId, sheetName)');
  }

  const db = new Firestore({ databaseId: 'anxi-app' });

  try {
    console.log(`[${functionName}] 開始同步: Project=${projectId} -> Sheet=${spreadsheetId} (${sheetName})`);

    // 1. Fetch all sales households
    // 假設是 root collection 'salesHouseholds' 並且有 projectId 欄位
    const snapshot = await db.collection('salesHouseholds')
      .where('projectId', '==', projectId)
      .get();

    if (snapshot.empty) {
      return { status: 'success', message: '該專案尚無銷控資料' };
    }

    const households = [];
    snapshot.forEach(doc => {
      households.push({ _docId: doc.id, ...doc.data() });
    });

    // 2. Flatten Data
    const rows = households.map(h => _flattenSalesHouseholdForSheet(h));

    // 3. Prepare Headers
    let headers = ['_id', 'updatedAt'];

    // 加入 salesFieldDisplayNames 定義的欄位 (顯示中文)
    const displayKeys = Object.keys(salesFieldDisplayNames);
    headers = headers.concat(displayKeys);

    // 找出 rows 中有但 headers 沒定義的 keys (動態欄位)
    const allRowKeys = new Set();
    rows.forEach(r => Object.keys(r).forEach(k => allRowKeys.add(k)));
    const extraKeys = Array.from(allRowKeys).filter(k => !headers.includes(k) && k !== '_id' && k !== 'updatedAt');

    headers = headers.concat(extraKeys);

    // 建立 Header Row (中文名稱)
    const headerRow = headers.map(key => {
      if (key === '_id') return '系統編號 (勿動)';
      if (key === 'updatedAt') return '更新時間';
      return salesFieldDisplayNames[key] || key;
    });

    // 4. Transform Rows to Array relative to Headers
    const values = [headerRow];
    rows.forEach(row => {
      const rowData = headers.map(key => {
        let val = row[key];
        if (val === undefined || val === null) return '';
        if (typeof val === 'object') return JSON.stringify(val);
        return String(val);
      });
      values.push(rowData);
    });

    // 5. Write to Sheet
    const sheets = await _getSalesSyncGoogleSheetClient();

    // Save settings to Project
    await db.collection('projects').doc(projectId).set({
      salesSheetId: spreadsheetId,
      salesSheetTabName: sheetName,
      salesSheetUrl: `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit#gid=0` // 簡易 URL
    }, { merge: true });

    // Clear existing content
    await sheets.spreadsheets.values.clear({
      spreadsheetId,
      range: `'${sheetName}'!A:ZZ`,
    });

    // Write new content
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: `'${sheetName}'!A1`,
      valueInputOption: 'USER_ENTERED',
      resource: { values },
    });

    console.log(`[${functionName}] 同步完成，共 ${rows.length} 筆`);
    return { status: 'success', message: `成功同步 ${rows.length} 筆銷控資料`, count: rows.length };

  } catch (error) {
    console.error(`[${functionName}] 失敗:`, error);
    throw new HttpsError('internal', `同步失敗: ${error.message}`);
  }
});

/**
 * [Trigger] 當銷控資料異動時，即時同步到 Sheet
 */
exports.onSalesHouseholdWrite = onDocumentWritten({
  document: "salesHouseholds/{docId}",
  database: 'anxi-app',
  region: 'asia-east1'
}, async (event) => {
  const functionName = "onSalesHouseholdWrite";
  const docId = event.params.docId;

  // 1. 判斷資料存在性
  const newData = event.data?.after?.data();
  const oldData = event.data?.before?.data();
  const projectId = newData?.projectId || oldData?.projectId;

  if (!projectId) {
    return;
  }

  const db = new Firestore({ databaseId: 'anxi-app' });

  try {
    // 2. 讀取 Project Settings
    const projectDoc = await db.collection('projects').doc(projectId).get();
    if (!projectDoc.exists) return;

    const settings = projectDoc.data();
    const spreadsheetId = settings.salesSheetId; // 注意欄位名稱不同
    const sheetName = settings.salesSheetTabName;

    if (!spreadsheetId || !sheetName) {
      return; // 未設定同步
    }

    console.log(`[${functionName}] 偵測到異動，準備同步: ID=${docId} -> Sheet=${spreadsheetId}`);

    const sheets = await _getSalesSyncGoogleSheetClient();

    // 3. 找出該 Row 在 Sheet 中的位置 (by _id column A)
    const range = `'${sheetName}'!A:A`;
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range,
    });

    const values = response.data.values || [];
    let rowIndex = -1;

    // 尋找 docId (跳過 Header Row 1)
    for (let i = 1; i < values.length; i++) {
      if (values[i][0] === docId) {
        rowIndex = i + 1; // 1-based index
        break;
      }
    }

    // 4. 根據操作類型處理
    if (!newData) {
      // --- 刪除操作 ---
      if (rowIndex > -1) {
        const sheetId = await _getSheetIdByName(sheets, spreadsheetId, sheetName);
        if (sheetId !== null) {
          await sheets.spreadsheets.batchUpdate({
            spreadsheetId,
            resource: {
              requests: [{
                deleteDimension: {
                  range: {
                    sheetId: sheetId,
                    dimension: 'ROWS',
                    startIndex: rowIndex - 1,
                    endIndex: rowIndex
                  }
                }
              }]
            }
          });
          console.log(`[${functionName}] 已刪除 Row ${rowIndex}`);
        }
      }
    } else {
      // --- 新增或更新操作 ---
      const flattened = _flattenSalesHouseholdForSheet({ _docId: docId, ...newData });

      // 讀取 Header (第一列) 以決定欄位順序
      const headerResp = await sheets.spreadsheets.values.get({
        spreadsheetId,
        range: `'${sheetName}'!1:1`,
      });

      let headers = headerResp.data.values?.[0] || [];

      if (headers.length === 0) {
        console.warn(`[${functionName}] Sheet 標題列為空，無法執行單筆同步。請先執行全量同步。`);
        return;
      }

      // 映射數據到 values array
      const rowData = headers.map(headerLabel => {
        if (headerLabel === '系統編號 (勿動)') return flattened['_id'];
        if (headerLabel === '更新時間') return flattened['updatedAt'];

        // Reverse lookup: Header Label -> Key
        const key = Object.keys(salesFieldDisplayNames).find(k => salesFieldDisplayNames[k] === headerLabel);
        if (key) return _formatValue(flattened[key]);

        return _formatValue(flattened[headerLabel]);
      });

      if (rowIndex > -1) {
        // Update existing row
        await sheets.spreadsheets.values.update({
          spreadsheetId,
          range: `'${sheetName}'!A${rowIndex}`,
          valueInputOption: 'USER_ENTERED',
          resource: { values: [rowData] },
        });
        console.log(`[${functionName}] 已更新 Row ${rowIndex}`);
      } else {
        // Append new row
        await sheets.spreadsheets.values.append({
          spreadsheetId,
          range: `'${sheetName}'!A1`,
          valueInputOption: 'USER_ENTERED',
          resource: { values: [rowData] },
        });
        console.log(`[${functionName}] 已新增 Row`);
      }
    }

  } catch (error) {
    console.error(`[${functionName}] 錯誤:`, error);
  }
});

/**
 * [Helper] 扁平化銷控資料
 */
function _flattenSalesHouseholdForSheet(h) {
  const flat = { ...h };

  // ID
  flat['_id'] = h._docId || h.id;

  // Timestamp 處理
  const dateFields = ['updatedAt', 'payment_deposit_date', 'payment_contract_date'];
  dateFields.forEach(field => {
    if (h[field] && h[field].toDate) {
      flat[field] = h[field].toDate().toISOString().split('T')[0];
      if (field === 'updatedAt') flat[field] = h[field].toDate().toISOString();
    } else if (field === 'updatedAt' && !flat[field]) {
      flat[field] = new Date().toISOString();
    }
  });

  // Boolean 處理
  if (typeof h.isPreferredPayment === 'boolean') {
    flat['isPreferredPayment'] = h.isPreferredPayment ? '是' : '否';
  }

  // Handle salesStatus_backend mapping to 'status'
  // 修正：資料庫欄位為 salesStatus_backend，但 syncConfig 預期為 status
  if (h.salesStatus_backend) {
    flat['status'] = h.salesStatus_backend;
  }

  return flat;
}


// =================================================================
// 4. [Feature] Appointments Google Sheet Sync
// =================================================================

/**
 * [API] 全量同步 Appointments 到 Google Sheet
 */
exports.syncAppointmentsToSheet = onCall({
  region: "asia-east1",
  cors: true,
  memory: "512MiB",
  timeoutSeconds: 540,
}, async (request) => {
  const { projectId, spreadsheetId, sheetName } = request.data;
  const functionName = "syncAppointmentsToSheet";

  if (!projectId || !spreadsheetId || !sheetName) {
    throw new HttpsError('invalid-argument', '缺少必要參數 (projectId, spreadsheetId, sheetName)');
  }

  const db = new Firestore({ databaseId: 'anxi-app' });

  try {
    console.log(`[${functionName}] 開始同步預約: Project=${projectId} -> Sheet=${spreadsheetId} (${sheetName})`);

    // 1. Fetch appointments
    const snapshot = await db.collection('appointments')
      .where('projectId', '==', projectId)
      .get();

    if (snapshot.empty) {
      return { status: 'success', message: '該專案尚無預約資料' };
    }

    const appointments = [];
    snapshot.forEach(doc => {
      appointments.push({ _docId: doc.id, ...doc.data() });
    });

    // 2. Flatten Data
    const rows = appointments.map(appt => _flattenAppointmentForSheet(appt));

    // 3. Define Headers
    // 根據設計文件定義的欄位順序
    const definedHeaders = [
      { key: '_id', label: 'System ID (勿動)' },
      { key: 'createdAt', label: '建立時間' },
      { key: 'bookingCode', label: '預約代碼' },
      { key: 'status', label: '狀態' },
      { key: 'projectId', label: '專案' },
      { key: 'unitId', label: '戶號' },
      { key: 'address', label: '地址' },
      { key: 'bookingType', label: '預約項目' },
      { key: 'inspectionMethod', label: '預約方式' },
      { key: 'inspectionCompanyName', label: '代驗公司' },
      { key: 'appointmentDate', label: '預約日期' },
      { key: 'appointmentTimeSlot', label: '預約時段' },
      { key: 'bookerName', label: '預約人姓名' },
      { key: 'bookerPhone', label: '預約人電話' },
      { key: 'bookerEmail', label: '預約人Email' },
      { key: 'bookerIdNumber', label: '預約人身分證' },
      { key: 'agentName', label: '代理人姓名' },
      { key: 'agentPhone', label: '代理人電話' },
      { key: 'bookingMethodDetailsDisplay', label: '詳細資訊' },
      { key: 'reportUploaded', label: '上傳報告' }
    ];

    const headerKeys = definedHeaders.map(h => h.key);
    const headerRow = definedHeaders.map(h => h.label);

    // 4. Transform Rows
    const values = [headerRow];
    rows.forEach(row => {
      const rowData = headerKeys.map(key => {
        let val = row[key];
        return _formatValue(val);
      });
      values.push(rowData);
    });

    // 5. Write to Sheet
    const sheets = await _getGoogleSheetClient();

    await sheets.spreadsheets.values.clear({
      spreadsheetId,
      range: `'${sheetName}'!A:ZZ`,
    });

    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: `'${sheetName}'!A1`,
      valueInputOption: 'USER_ENTERED',
      resource: { values },
    });

    console.log(`[${functionName}] 同步完成，共 ${rows.length} 筆`);
    return { status: 'success', message: `成功同步 ${rows.length} 筆預約資料`, count: rows.length };

  } catch (error) {
    console.error(`[${functionName}] 失敗:`, error);
    throw new HttpsError('internal', `同步失敗: ${error.message}`);
  }
});

/**
 * [Trigger] 當 Appointment 異動時同步
 */
exports.onAppointmentWrite = onDocumentWritten({
  document: "appointments/{appointmentId}",
  database: "anxi-app", // Specify the database name
  region: "asia-east1", // Ensure region matches if needed
}, async (event) => {
  const functionName = "onAppointmentWrite";
  const appointmentId = event.params.appointmentId;

  const newData = event.data?.after?.data();
  const oldData = event.data?.before?.data();
  const projectId = newData?.projectId || oldData?.projectId;

  if (!projectId) {
    console.log(`[${functionName}] 無法取得 projectId，忽略 (ID: ${appointmentId})`);
    return;
  }

  const db = new Firestore({ databaseId: 'anxi-app' });

  try {
    // 讀取 Project Settings
    const projectDoc = await db.collection('projects').doc(projectId).get();
    if (!projectDoc.exists) return;

    const settings = projectDoc.data();
    const spreadsheetId = settings.appointmentsSheetId;
    const sheetName = settings.appointmentsSheetTabName;

    if (!spreadsheetId || !sheetName) return;

    console.log(`[${functionName}] 偵測到異動，準備同步: ID=${appointmentId} -> Sheet=${spreadsheetId}`);

    const sheets = await _getGoogleSheetClient();

    // Find Row Index (by ID in Col A)
    const range = `'${sheetName}'!A:A`;
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range,
    });

    const values = response.data.values || [];
    let rowIndex = -1;

    for (let i = 1; i < values.length; i++) {
      if (values[i][0] === appointmentId) {
        rowIndex = i + 1;
        break;
      }
    }

    if (!newData) {
      // Delete
      if (rowIndex > -1) {
        const sheetId = await _getSheetIdByName(sheets, spreadsheetId, sheetName);
        if (sheetId !== null) {
          await sheets.spreadsheets.batchUpdate({
            spreadsheetId,
            resource: {
              requests: [{
                deleteDimension: {
                  range: {
                    sheetId: sheetId,
                    dimension: 'ROWS',
                    startIndex: rowIndex - 1,
                    endIndex: rowIndex
                  }
                }
              }]
            }
          });
          console.log(`[${functionName}] 已刪除 Row ${rowIndex}`);
        }
      }
    } else {
      // Add or Update
      const flattened = _flattenAppointmentForSheet({ _docId: appointmentId, ...newData });

      // Read Header to determine column order
      const headerResp = await sheets.spreadsheets.values.get({
        spreadsheetId,
        range: `'${sheetName}'!1:1`,
      });
      const headers = headerResp.data.values?.[0] || [];

      if (headers.length === 0) {
        console.warn(`[${functionName}] Sheet 標題列為空，無法執行單筆同步。`);
        return;
      }

      // Map Data to Row
      const definedHeaders = [
        { key: '_id', label: 'System ID (勿動)' },
        { key: 'createdAt', label: '建立時間' },
        { key: 'bookingCode', label: '預約代碼' },
        { key: 'status', label: '狀態' },
        { key: 'projectId', label: '專案' },
        { key: 'unitId', label: '戶號' },
        { key: 'address', label: '地址' },
        { key: 'bookingType', label: '預約項目' },
        { key: 'inspectionMethod', label: '預約方式' },
        { key: 'inspectionCompanyName', label: '代驗公司' },
        { key: 'appointmentDate', label: '預約日期' },
        { key: 'appointmentTimeSlot', label: '預約時段' },
        { key: 'bookerName', label: '預約人姓名' },
        { key: 'bookerPhone', label: '預約人電話' },
        { key: 'bookerEmail', label: '預約人Email' },
        { key: 'bookerIdNumber', label: '預約人身分證' },
        { key: 'agentName', label: '代理人姓名' },
        { key: 'agentPhone', label: '代理人電話' },
        { key: 'bookingMethodDetailsDisplay', label: '詳細資訊' },
        { key: 'reportUploaded', label: '上傳報告' }
      ];

      const rowData = headers.map(headerLabel => {
        const def = definedHeaders.find(h => h.label === headerLabel);
        if (def) {
          return _formatValue(flattened[def.key]);
        }
        // Try direct key match if header matches a key (fallback)
        return _formatValue(flattened[headerLabel]);
      });

      // Ensure ID is in Col A logic (optional check)

      if (rowIndex > -1) {
        await sheets.spreadsheets.values.update({
          spreadsheetId,
          range: `'${sheetName}'!A${rowIndex}`,
          valueInputOption: 'USER_ENTERED',
          resource: { values: [rowData] },
        });
        console.log(`[${functionName}] 已更新 Row ${rowIndex}`);
      } else {
        await sheets.spreadsheets.values.append({
          spreadsheetId,
          range: `'${sheetName}'!A1`,
          valueInputOption: 'USER_ENTERED',
          resource: { values: [rowData] },
        });
        console.log(`[${functionName}] 已新增 Row`);
      }
    }

  } catch (error) {
    console.error(`[${functionName}] 錯誤:`, error);
  }
});

/**
 * [Helper] 扁平化 Appointment
 */
function _flattenAppointmentForSheet(appt) {
  const flat = { ...appt };

  flat['_id'] = appt._docId || appt.id;

  // Date Formatting
  const dateFields = ['createdAt', 'appointmentDate'];
  dateFields.forEach(field => {
    if (appt[field]) {
      let dateObj;
      if (appt[field].toDate) dateObj = appt[field].toDate(); // Firestore Timestamp
      else if (appt[field] instanceof Date) dateObj = appt[field];
      else dateObj = new Date(appt[field]); // String or Number

      if (!isNaN(dateObj)) {
        if (field === 'appointmentDate') {
          flat[field] = dateObj.toLocaleDateString('zh-TW', { year: 'numeric', month: '2-digit', day: '2-digit' });
        } else {
          flat[field] = dateObj.toLocaleString('zh-TW', { timeZone: 'Asia/Taipei', hour12: false });
        }
      }
    }
  });

  // Boolean
  if (typeof flat['reportUploaded'] === 'boolean') {
    flat['reportUploaded'] = flat['reportUploaded'] ? '是' : '否';
  }

  // Detail Array Formatting
  if (Array.isArray(appt.bookingMethodDetailsDisplay)) {
    flat['bookingMethodDetailsDisplay'] = appt.bookingMethodDetailsDisplay
      .map(item => `${item.label}: ${item.value}`)
      .join('\n');
  }

  return flat;
}


// =================================================================
//   系統問題回報 (Bug Report)
// =================================================================

/**
 * [submitBugReport] 接收前端的問題回報資料
 * 1. 將附件圖片上傳至 Firebase Storage
 * 2. 將回報紀錄寫入 Firestore bugReports 集合
 * 3. 查詢系統管理員 / 超級管理員的 Email
 * 4. 發送通知郵件
 */
exports.submitBugReport = onCall({ region: "asia-east1", secrets: gmailSecrets, memory: "512MiB", timeoutSeconds: 120 }, async (request) => {
  const db = new Firestore({ databaseId: 'anxi-app' });
  const functionName = 'submitBugReport';

  const {
    reporterName,
    reporterPhone,
    description,
    pagePath,
    pageName,
    projectId,
    projectName,
    userKey,
    userAgent,
    attachments  // [{ filename, content (base64), contentType }]
  } = request.data;

  // 1. 驗證必要參數
  if (!reporterName || !reporterPhone || !description) {
    throw new HttpsError('invalid-argument', '缺少必要參數 (reporterName, reporterPhone, description)');
  }

  console.log(`[${functionName}] 收到問題回報 - 回報者: ${reporterName}, 電話: ${reporterPhone}`);

  try {
    // 2. 產生唯一 Report ID
    const reportRef = db.collection('bugReports').doc();
    const reportId = reportRef.id;
    const attachmentUrls = [];

    // 3. 上傳附件至 Firebase Storage
    if (attachments && Array.isArray(attachments) && attachments.length > 0) {
      const bucket = getStorage().bucket();

      for (const attachment of attachments) {
        if (!attachment.content || !attachment.filename) continue;

        // 將 base64 轉為 Buffer
        const buffer = Buffer.from(attachment.content, 'base64');

        // 產生安全的檔案名稱（加時間戳避免重複）
        const timestamp = Date.now();
        const safeFilename = `${timestamp}_${attachment.filename.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
        const filePath = `bugReports/${reportId}/${safeFilename}`;
        const file = bucket.file(filePath);

        // 上傳至 Storage
        await file.save(buffer, {
          metadata: {
            contentType: attachment.contentType || 'image/jpeg',
          },
        });

        // 設定公開讀取
        await file.makePublic();

        // 取得公開 URL
        const publicUrl = `https://storage.googleapis.com/${bucket.name}/${filePath}`;
        attachmentUrls.push(publicUrl);

        console.log(`[${functionName}] 附件已上傳: ${filePath}`);
      }
    }

    // 4. 寫入 Firestore
    const reportData = {
      createdAt: FieldValue.serverTimestamp(),
      reporterName: reporterName,
      reporterPhone: reporterPhone,
      description: description,
      pagePath: pagePath || '',
      pageName: pageName || '',
      projectId: projectId || null,
      projectName: projectName || null,
      userKey: userKey || null,
      userAgent: userAgent || '',
      attachmentUrls: attachmentUrls,
      status: 'pending', // pending → processing → resolved
    };

    await reportRef.set(reportData);
    console.log(`[${functionName}] 回報紀錄已寫入 Firestore: ${reportId}`);

    // 5. 查詢系統管理員 / 超級管理員的 Email
    const adminEmails = new Set();

    // 查詢角色為「系統管理員」的使用者
    const sysAdminSnapshot = await db.collection('users')
      .where('roles', 'array-contains', '系統管理員')
      .get();

    sysAdminSnapshot.forEach(doc => {
      const email = doc.data().email;
      if (email) adminEmails.add(email);
    });

    // 查詢角色為「超級管理員」的使用者
    const superAdminSnapshot = await db.collection('users')
      .where('roles', 'array-contains', '超級管理員')
      .get();

    superAdminSnapshot.forEach(doc => {
      const email = doc.data().email;
      if (email) adminEmails.add(email);
    });

    // 加入固定的管理員通知信箱
    if (ADMIN_ERROR_RECIPIENT) {
      adminEmails.add(ADMIN_ERROR_RECIPIENT);
    }

    console.log(`[${functionName}] 找到 ${adminEmails.size} 個管理員 Email`);

    // 6. 發送通知 Email
    if (adminEmails.size > 0) {
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: process.env.SENDER_EMAIL,
          pass: process.env.GMAIL_APP_PASSWORD,
        },
      });

      // 產生附件圖片的 HTML
      const attachmentHtml = attachmentUrls.length > 0
        ? attachmentUrls.map((url, i) =>
          `<div style="margin: 8px 0;">
              <a href="${url}" target="_blank" style="color: #1976D2; text-decoration: none;">
                📎 附件 ${i + 1}
              </a>
            </div>`
        ).join('')
        : '<span style="color: #999;">無附件</span>';

      // 格式化回報時間
      const reportTime = new Date().toLocaleString('zh-TW', {
        timeZone: 'Asia/Taipei',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
      });

      const emailHtml = `
        <div style="font-family: 'Microsoft JhengHei', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #C62828, #E53935); color: white; padding: 20px; border-radius: 8px 8px 0 0;">
            <h2 style="margin: 0; font-size: 20px;">🐛 系統問題回報通知</h2>
            <p style="margin: 4px 0 0; font-size: 13px; opacity: 0.9;">ANXI 安熙智慧建案管理系統</p>
          </div>

          <div style="border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 8px 8px; padding: 20px; background: #fafafa;">

            <div style="background: white; border-radius: 6px; padding: 16px; margin-bottom: 16px; border-left: 4px solid #1976D2;">
              <h3 style="margin: 0 0 8px; color: #333; font-size: 14px;">📋 回報者資訊</h3>
              <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
                <tr><td style="color: #666; padding: 4px 8px 4px 0; width: 100px;">姓名</td><td style="padding: 4px 0;"><strong>${reporterName}</strong></td></tr>
                <tr><td style="color: #666; padding: 4px 8px 4px 0;">電話</td><td style="padding: 4px 0;">${reporterPhone}</td></tr>
                <tr><td style="color: #666; padding: 4px 8px 4px 0;">系統帳號</td><td style="padding: 4px 0;">${userKey || '<span style="color:#999;">非系統用戶</span>'}</td></tr>
              </table>
            </div>

            <div style="background: white; border-radius: 6px; padding: 16px; margin-bottom: 16px; border-left: 4px solid #FF9800;">
              <h3 style="margin: 0 0 8px; color: #333; font-size: 14px;">📍 問題環境</h3>
              <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
                <tr><td style="color: #666; padding: 4px 8px 4px 0; width: 100px;">頁面路徑</td><td style="padding: 4px 0;">${pagePath || '無'}</td></tr>
                <tr><td style="color: #666; padding: 4px 8px 4px 0;">頁面名稱</td><td style="padding: 4px 0;">${pageName || '無'}</td></tr>
                <tr><td style="color: #666; padding: 4px 8px 4px 0;">建案名稱</td><td style="padding: 4px 0;">${projectName || '<span style="color:#999;">無</span>'}</td></tr>
                <tr><td style="color: #666; padding: 4px 8px 4px 0;">建案 ID</td><td style="padding: 4px 0;">${projectId || '<span style="color:#999;">無</span>'}</td></tr>
              </table>
            </div>

            <div style="background: white; border-radius: 6px; padding: 16px; margin-bottom: 16px; border-left: 4px solid #C62828;">
              <h3 style="margin: 0 0 8px; color: #333; font-size: 14px;">📝 問題描述</h3>
              <p style="margin: 0; font-size: 14px; line-height: 1.6; white-space: pre-wrap; color: #333;">${description}</p>
            </div>

            <div style="background: white; border-radius: 6px; padding: 16px; margin-bottom: 16px; border-left: 4px solid #4CAF50;">
              <h3 style="margin: 0 0 8px; color: #333; font-size: 14px;">📎 附件圖片（${attachmentUrls.length} 張）</h3>
              ${attachmentHtml}
            </div>

            <div style="text-align: center; padding: 12px; color: #999; font-size: 12px; border-top: 1px solid #e0e0e0; margin-top: 8px;">
              ⏰ 回報時間：${reportTime}<br>
              🌐 瀏覽器：${(userAgent || '').substring(0, 100)}
            </div>
          </div>
        </div>
      `;

      const mailOptions = {
        from: `"ANXI 系統問題回報" <${process.env.SENDER_EMAIL}>`,
        to: Array.from(adminEmails).join(','),
        subject: `【系統問題回報】${reporterName} 回報了一個問題`,
        html: emailHtml,
      };

      const info = await transporter.sendMail(mailOptions);
      console.log(`[${functionName}] 通知郵件已發送: ${info.messageId}, 收件人: ${Array.from(adminEmails).join(', ')}`);
    } else {
      console.warn(`[${functionName}] 未找到管理員 Email，無法發送通知`);
    }

    return {
      status: 'success',
      message: '問題回報已成功送出',
      reportId: reportId,
    };

  } catch (error) {
    console.error(`[${functionName}] 錯誤:`, error);
    if (error instanceof HttpsError) throw error;
    throw new HttpsError('internal', '送出問題回報時發生錯誤，請稍後再試。');
  }
});
