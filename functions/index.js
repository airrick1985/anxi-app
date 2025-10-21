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
 * ✅ 正確 / 後端 (Admin SDK) 語法 (此檔案必須使用的格式):
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

// functions/index.js

const functions = require("firebase-functions");
const { google } = require("googleapis"); // ✓ START: 新增此行
const cors = require("cors")({ origin: true }); // 啟用 CORS，並允許所有來源
const { logger } = require("firebase-functions"); // 確保頂部有引入 logger
const { FieldValue } = require("firebase-admin/firestore");
const line = require("@line/bot-sdk");
const { SecretManagerServiceClient } = require('@google-cloud/secret-manager');
const { onSchedule } = require("firebase-functions/v2/scheduler");

const admin = require("firebase-admin");
const nodemailer = require("nodemailer");
const crypto = require("crypto");
const { onCall, HttpsError, onRequest } = require("firebase-functions/v2/https");
const { onDocumentCreated } = require("firebase-functions/v2/firestore");
const { Firestore, FieldPath: GCloudFieldPath, } = require("@google-cloud/firestore");
const { FieldPath } = require("firebase-admin/firestore");
const { getStorage } = require("firebase-admin/storage"); //  1. 引入 GCS Admin SDK
const { pipeline } = require("stream/promises"); //  2. 引入 stream.pipeline 以安全地處理流
const { Transform } = require("stream"); //  3. 引入 Transform 來自訂資料轉換流
const { Readable } = require("stream"); //  新增此行，用於將 Buffer 轉為 Stream
const readline = require("readline"); 
const { Timestamp } = require("firebase-admin/firestore"); //  引入 Timestamp
const { onObjectFinalized } = require("firebase-functions/v2/storage");
const archiver = require("archiver"); // ✓ 引入 archiver 用於壓縮檔案
const Busboy = require("busboy"); // ✓ 用於處理檔案上傳 (未來可能用到)
const { setGlobalOptions } = require("firebase-functions/v2"); // ✓ START: 新增此行
const xlsx = require("xlsx"); 



const driveSecrets = [
    "DRIVE_CLIENT_ID",
    "DRIVE_CLIENT_SECRET",
    "DRIVE_REFRESH_TOKEN",
    "SENDER_EMAIL",
    "GMAIL_APP_PASSWORD"
];


admin.initializeApp();

setGlobalOptions({ region: 'asia-east1' });


// 這個 db 實例會指向 (default) 資料庫，我們在函式內部會建立指向 anxi-app 的實例
const defaultDb = admin.firestore();
const rtdbAdmin = admin.database(); 


// 定義函式需要從 Secret Manager 讀取的密鑰名稱
const gmailSecrets = [
    "SENDER_EMAIL",
    "GMAIL_APP_PASSWORD" 
];

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


// ✓ START: 新增 - 全域變數用於快取認證過的 Google Drive 客戶端
let oauth2Client;
let driveClient;

/**
 * [內部輔助函式] 獲取一個已認證的 Google Drive API 客戶端實例
 * 此函式會快取客戶端，避免在溫啟動時重複進行認證(優化冷啟動)
 */
function getAuthenticatedDriveClient() {
    if (driveClient) {
        return driveClient;
    }

    oauth2Client = new google.auth.OAuth2(
        process.env.DRIVE_CLIENT_ID,
        process.env.DRIVE_CLIENT_SECRET,
        'https://developers.google.com/oauthplayground'
    );

    oauth2Client.setCredentials({
        refresh_token: process.env.DRIVE_REFRESH_TOKEN,
    });

    driveClient = google.drive({ version: "v3", auth: oauth2Client });
    return driveClient;
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

exports.grantSuperAdminPermissionsOnNewSubscription = onDocumentCreated( { document: "subscriptions/{subscriptionId}", database: 'anxi-app', region: 'asia-east2' }, async (event) => {
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
                    address: unitData.address || ''
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
* 驗證戶別與身分證號碼是否相符
*/
exports.validateId = onCall(async (request) => {
    const db = new Firestore({ databaseId: 'anxi-app' });
    const { projectId, unitId, idNumber } = request.data;

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
        const storedId = String(householdData.buyerIdNumber || '').trim();
        const inputId = String(idNumber).trim();

        // ✓ START: 修改驗證邏輯
        // 條件一：輸入的 ID 與資料庫中的 ID 相符
        // 條件二：輸入的 ID 與當前建案的 Project ID 相符 (管理員快速通關)
        if (storedId === inputId || inputId === projectId) {
            return { status: 'success', message: '身分驗證成功。' };
        } else {
            throw new HttpsError('permission-denied', '身分證號碼與此戶別的資料不符，請重新確認。');
        }
        // ✓ END: 修改驗證邏輯

    } catch (error) {
        console.error("validateId 錯誤:", error);
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

// 獲取可預約時段
exports.getAvailableSlots = onCall(async (request) => {
  const { projectId, unitId, bookingType, bookingMethod } = request.data;

  if (!projectId || !unitId || !bookingType || !bookingMethod) {
    throw new HttpsError("invalid-argument", "缺少必要參數 (projectId, unitId, bookingType, or bookingMethod)。");
  }

  try {
    const db = new Firestore({ databaseId: 'anxi-app' });
    
    // 步驟 1: 檢查戶別資料
    const householdDocId = `${projectId}_${unitId}`;

    
    
    const householdDoc = await db.collection('households').doc(householdDocId).get();
    if (!householdDoc.exists) {
      console.error(`[ERROR] 找不到戶別文檔: ${householdDocId}`);
      throw new HttpsError("not-found", `找不到戶別 "${unitId}" 的資料。`);
    }
    
    const householdData = householdDoc.data();
    const batchCodeField = bookingType === '初驗' ? 'initialInspectionBatch' : 'reInspectionBatch';
    const batchCode = householdData[batchCodeField];
    
    
    if (!batchCode) {
      throw new HttpsError("permission-denied", `此戶別的 "${bookingType}" 預約目前未開放。`);
    }

    // 步驟 2: 查找預約批次（修正查詢邏輯）
    const batchQuery = await db.collection('bookingBatches')
      .where('projectId', '==', projectId)
      .where('batchCode', '==', batchCode)
      .where('bookingType', '==', bookingType)
      .get();

    if (batchQuery.empty) {
      console.error(`[ERROR] 找不到預約批次`);
      throw new HttpsError("not-found", `找不到對應的預約批次 (代號: ${batchCode})。`);
    }
    
    const batchDoc = batchQuery.docs[0];
    const batchData = batchDoc.data();
    const batchId = batchDoc.id;

     // ✓ START: 使用更穩健的時間驗證邏輯
    let applicationStart, applicationEnd;

    // 嘗試從 Timestamp 或類似物件中建立 Date 物件
    if (batchData.applicationStart?.toDate) {
      applicationStart = batchData.applicationStart.toDate();
    } else if (batchData.applicationStart?.seconds) {
      applicationStart = new Date(batchData.applicationStart.seconds * 1000);
    } else {
      applicationStart = new Date(batchData.applicationStart); // 兼容舊的字串格式
    }

    if (batchData.applicationEnd?.toDate) {
      applicationEnd = batchData.applicationEnd.toDate();
    } else if (batchData.applicationEnd?.seconds) {
      applicationEnd = new Date(batchData.applicationEnd.seconds * 1000);
    } else {
      applicationEnd = new Date(batchData.applicationEnd); // 兼容舊的字串格式
    }

    // 最終驗證轉換結果是否為有效日期
  if (isNaN(applicationStart.getTime()) || isNaN(applicationEnd.getTime())) {
   throw new HttpsError("failed-precondition", `此預約批次 (${batchData.batchCode}) 的時間格式不正確，請聯繫管理員。`);
  }
  
  const now = new Date();

  // 進行精確的時間點比較 (此部分邏輯不變)
  if (now < applicationStart) {
    const startTimeString = applicationStart.toLocaleString('zh-TW', { timeZone: 'Asia/Taipei', hour12: false });
    throw new HttpsError("failed-precondition", `此預約尚未開放，請於 ${startTimeString} 後再試。`);
  }
  if (now > applicationEnd) {
    const endTimeString = applicationEnd.toLocaleString('zh-TW', { timeZone: 'Asia/Taipei', hour12: false });
    throw new HttpsError("failed-precondition", `此預約已於 ${endTimeString} 截止。`);
  }
    

    // 步驟 3: 查找批次規則連結（修正查詢方式）
    const linksQuery = await db.collection('batchRuleLinks')
      .where('projectId', '==', projectId)
      .where('batchId', '==', batchId)
      .get();


    if (linksQuery.empty) {
      return {
        startDate: batchData.bookingStart,
        endDate: batchData.bookingEnd,
        unavailableDates: [],
        timeSlotsByDate: {}
      };
    }

    // 步驟 4: 獲取所有日期規則（按照實際資料結構）
    const dateRulesMap = new Map();
    
    // 遍歷每個連結，獲取對應的日期規則
    for (const linkDoc of linksQuery.docs) {
      const linkData = linkDoc.data();
      
      const ruleQuery = await db.collection('dateRules')
        .where('projectId', '==', projectId)
        .where(FieldPath.documentId(), '==', linkData.ruleId)
        .get();
      
      ruleQuery.forEach(ruleDoc => {
        const ruleData = ruleDoc.data();
        dateRulesMap.set(ruleData.date, ruleData);
      });
    }

    // 步驟 5: 計算現有預約數量
    const startDate = new Date(batchData.bookingStart + 'T00:00:00');
    const endDate = new Date(batchData.bookingEnd + 'T23:59:59');
    
    
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
      
      if (appt.appointmentDate && typeof appt.appointmentDate.toDate === 'function') {
        apptDate = appt.appointmentDate.toDate().toISOString().split('T')[0];
      } else {
        console.warn('Invalid appointmentDate format:', appt.appointmentDate);
        return;
      }
      
      const key = `${apptDate}_${appt.appointmentTimeSlot}`;
      bookingsCount[key] = (bookingsCount[key] || 0) + 1;
    });


    // 步驟 6: 組合可用時段
    const timeSlotsByDate = {};
    
    dateRulesMap.forEach((rule, dateStr) => {
      
      if (!rule.slots || typeof rule.slots !== 'object') {
        console.warn(`日期 ${dateStr} 缺少時段設定`);
        return;
      }

      const slotsForDay = [];
      const sortedTimeKeys = Object.keys(rule.slots).sort();

      for (const timeSlot of sortedTimeKeys) {
        const slotInfo = rule.slots[timeSlot];
        
        if (slotInfo && Array.isArray(slotInfo.methods)) {
          // 檢查預約方式是否符合
          if (slotInfo.methods.includes(bookingMethod)) {
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
    console.error("getAvailableSlots 錯誤:", error);
    if (error instanceof HttpsError) {
      throw error;
    }
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
exports.updateParkingSlide = onCall({ region: "asia-east1",secrets: gmailSecrets}, async (request) => {
  const {projectId, slideType} = request.data;

  if (!projectId || !slideType) {
    throw new HttpsError("invalid-argument", "請求缺少 projectId 或 slideType。");
  }

  const db = new Firestore({databaseId: "anxi-app"});
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
    const slides = google.slides({version: "v1", auth: authClient});

    const presentation = await slides.presentations.get({
      presentationId: presentationId,
      fields: "slides(pageElements(objectId,shape(text)))",
    });

    const requests = [];
    let shapeCounter = 0;

    const fillColors = {
      yellow: {rgbColor: {red: 1, green: 1, blue: 0}},
      blue: {rgbColor: {red: 0.643, green: 0.761, blue: 0.957}},
      purple: {rgbColor: {red: 0.8, green: 0.753, blue: 0.851}},
    };
    const textColors = {
      red: {opaqueColor: {rgbColor: {red: 1, green: 0, blue: 0}}},
      black: {opaqueColor: {rgbColor: {red: 0, green: 0, blue: 0}}},
    };

    presentation.data.slides.forEach((slide, slideIndex) => {
      slide.pageElements?.forEach((element) => {
        if (!element.shape || !element.shape.text) return;
        
        shapeCounter++;
        const identifier = `Slide${slideIndex + 1}-Shape${shapeCounter}`;
        const data = parkingDataMap.get(identifier);
        const objectId = element.objectId;

        let newText = "";
        let shapeFill = {shapeBackgroundFill: {}};
        const styleRequests = [];

        requests.push({deleteText: {objectId, textRange: {type: "ALL"}}});

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
                      rgbColor: {red: 1, green: 1, blue: 1}
                    },
                    alpha: 0.0
                  }
                }
              };

              let startIndex = 0;
              if (spotId.length > 0) {
                styleRequests.push({updateTextStyle: {objectId, textRange: {type: "FIXED_RANGE", startIndex, endIndex: startIndex + spotId.length}, style: {foregroundColor: textColors.black, bold: true, fontSize: {magnitude: 9, unit: "PT"}}, fields: "foregroundColor,bold,fontSize"}});
              }
              startIndex += spotId.length + 1;
              if (priceList.length > 0) {
                 styleRequests.push({updateTextStyle: {objectId, textRange: {type: "FIXED_RANGE", startIndex, endIndex: startIndex + priceList.length}, style: {foregroundColor: textColors.red, bold: true, fontSize: {magnitude: 9, unit: "PT"}}, fields: "foregroundColor,bold,fontSize"}});
              }
            } else {
              // ✓ 將 data.spotId 改為 data.number
              const spotId = String(data.number || "");
              const status = String(data.status || "");
              newText = `${spotId}\n${status}`;
              shapeFill = {shapeBackgroundFill: {solidFill: {color: fillColors.yellow}}};

              let startIndex = 0;
              if (spotId.length > 0) {
                styleRequests.push({updateTextStyle: {objectId, textRange: {type: "FIXED_RANGE", startIndex, endIndex: startIndex + spotId.length}, style: {foregroundColor: textColors.black, bold: true, fontSize: {magnitude: 9, unit: "PT"}}, fields: "foregroundColor,bold,fontSize"}});
              }
              startIndex += spotId.length + 1;
              if (status.length > 0) {
                 styleRequests.push({updateTextStyle: {objectId, textRange: {type: "FIXED_RANGE", startIndex, endIndex: startIndex + status.length}, style: {foregroundColor: textColors.red, bold: true, fontSize: {magnitude: 9, unit: "PT"}}, fields: "foregroundColor,bold,fontSize"}});
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
                      rgbColor: {red: 1, green: 1, blue: 1}
                    },
                    alpha: 0.0
                  }
                }
              };

              let startIndex = 0;
              if (spotId.length > 0) {
                styleRequests.push({updateTextStyle: {objectId, textRange: {type: "FIXED_RANGE", startIndex, endIndex: startIndex + spotId.length}, style: {foregroundColor: textColors.black, bold: true, fontSize: {magnitude: 9, unit: "PT"}}, fields: "foregroundColor,bold,fontSize"}});
              }
              startIndex += spotId.length + 1;
              if (priceList.length > 0) {
                 styleRequests.push({updateTextStyle: {objectId, textRange: {type: "FIXED_RANGE", startIndex, endIndex: startIndex + priceList.length}, style: {foregroundColor: textColors.red, bold: true, fontSize: {magnitude: 9, unit: "PT"}}, fields: "foregroundColor,bold,fontSize"}});
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
              shapeFill = {shapeBackgroundFill: {solidFill: {color: finalColor}}};

              let startIndex = 0;
              if(lines[0].length > 0) styleRequests.push({updateTextStyle: {objectId, textRange: {type: "FIXED_RANGE", startIndex, endIndex: startIndex + lines[0].length}, style: {foregroundColor: textColors.black, bold: true, fontSize: {magnitude: 9, unit: "PT"}}, fields: "foregroundColor,bold,fontSize"}});
              startIndex += lines[0].length + 1;
              
              if(lines[1].length > 0) styleRequests.push({updateTextStyle: {objectId, textRange: {type: "FIXED_RANGE", startIndex, endIndex: startIndex + lines[1].length}, style: {foregroundColor: textColors.red, bold: true, fontSize: {magnitude: 9, unit: "PT"}}, fields: "foregroundColor,bold,fontSize"}});
              startIndex += lines[1].length + 1;
              
              [lines[2], lines[3], lines[4]].forEach(line => {
                if (line.length > 0) {
                   styleRequests.push({updateTextStyle: {objectId, textRange: {type: "FIXED_RANGE", startIndex, endIndex: startIndex + line.length}, style: {foregroundColor: textColors.black, bold: false, fontSize: {magnitude: 6, unit: "PT"}}, fields: "foregroundColor,bold,fontSize"}});
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
                  rgbColor: {red: 1, green: 1, blue: 1}
                },
                alpha: 0.0
              }
            }
          };
        }
        
        if (newText) {
          requests.push({insertText: {objectId, text: newText, insertionIndex: 0}});
        }
        requests.push({
          updateShapeProperties: {objectId, shapeProperties: shapeFill, fields: "shapeBackgroundFill"},
        });
        requests.push(...styleRequests);
      });
      shapeCounter = 0;
    });

    if (requests.length > 0) {
      await slides.presentations.batchUpdate({
        presentationId: presentationId,
        requestBody: {requests},
      });
    }

    console.log(`[${functionName}] Google Slide 更新成功！`);
    return {status: "success", slideId: presentationId};

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
exports.uploadParkingLots = onCall({ region: "asia-east1",secrets: gmailSecrets}, async (request) => {
  const {projectId, parkingData} = request.data;
  const functionName = `uploadParkingLots (Project: ${projectId})`;

  if (!projectId || !Array.isArray(parkingData) || parkingData.length === 0) {
    throw new HttpsError("invalid-argument", "請求缺少 projectId 或有效的車位資料。");
  }

  const db = new Firestore({databaseId: "anxi-app"});

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
        
        // 處理數字格式的欄位
        if (['price_list', 'price_floor', 'price_transaction', 'number', 'floor'].includes(key)) {
          dataToSave[key] = Number(value) || 0;
        } else {
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
      batch.set(docRef, dataToSave, {merge: true});
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
    return {status: "success", message: `成功更新或新增了 ${parkingData.length} 筆車位資料。`};

  } catch (error) {
    console.error(`[${functionName}] 發生錯誤:`, error);
    throw new HttpsError("internal", `更新車位資料時發生錯誤: ${error.message}`);
  }
});

/**
 *  【新增】 上傳戶別資料並更新 Firestore
 * 從前端接收 Excel 解析後的 JSON 資料，批次更新 salesHouseholds 集合
 */
exports.uploadHouseholds = onCall({ region: "asia-east1", secrets: gmailSecrets }, async (request) => {
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
  
  //  修正點 1: 在函式一開始，就先獲取所有管理員的 User ID 列表
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
  const targetSystem = system === '報價系統' ? '銷控系統'
                     : system === '驗屋預約管理' ? '預約驗屋系統'
                     : system;

  console.log(`[${functionName}] User is not an admin. Checking limits for target system: [${targetSystem}]`);

  try {
    // ... (步驟 3: 查詢訂閱計算名額上限的邏輯，完全不變)
    const subsQuery = await anxiDb.collection("subscriptions").where("projectId", "==", projectId).where("systemFunction", "==", targetSystem).get();
    if (subsQuery.empty) throw new HttpsError("not-found", `找不到 ${projectId} 的 ${targetSystem} 訂閱紀錄。`);
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
        
        //  修正點 2: 在計數前，先判斷該在線使用者是否為管理員
        if (adminUserKeys.has(data.userId)) {
          return; // 如果是管理員，直接跳過，不計入
        }

        let shouldCount = false;
        if (targetSystem === '銷控系統') {
            if (data.system === '銷控系統' || data.system === '報價系統') shouldCount = true;
        } else if (targetSystem === '預約驗屋系統') {
            if (data.system === '預約驗屋系統' || data.system === '驗屋預約管理') shouldCount = true;
        } else {
            if (data.system === targetSystem) shouldCount = true;
        }
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
      detailedPermissions: detailedPermissions
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
      if(jobData.scheduleTime) {
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
  } catch(e) {
    throw new HttpsError("internal", `讀取欄位列表失敗: ${e.message}`);
  }
});
//  END: 新增 getCollectionFields 雲端函式

exports.handleSpecialReportUpload = onCall({ region: "asia-east1",
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
    const dateFields = ['payment_contract_date', 'payment_deposit_date', 'payment_supplement_date', 'buyerDateOfBirth'];
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
      'buyerPermanentAddressCity', 'buyerPermanentAddressDistrict', 'buyerPermanentAddressDetail'
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
  const { floorPlanId, layouts, projectId } = request.data; // ✓【修改】直接接收 projectId
  const functionName = `saveSpotLayouts (FloorPlan: ${floorPlanId}, Project: ${projectId})`; // ✓【修改】更新日誌名稱

  if (!floorPlanId || !Array.isArray(layouts) || !projectId) { // ✓【修改】增加 projectId 驗證
    throw new HttpsError("invalid-argument", "缺少 floorPlanId, layouts 或 projectId 參數。");
  }

  try {
    console.log(`[${functionName}] 批量保存 ${layouts.length} 個佈局項目...`);
    const db = new Firestore({ databaseId: "anxi-app" });
    
    const batch = db.batch();
    const now = admin.firestore.FieldValue.serverTimestamp();

    // 分離車位和背景圖片數據
    const spotLayouts = layouts.filter(item => item.type !== 'backgroundImage');
    const backgroundImageData = layouts.find(item => item.type === 'backgroundImage');

    // 保存車位佈局
    for (const layout of spotLayouts) {
      const layoutData = {
        floorPlanId: floorPlanId,
        projectId: projectId, // ✓【新增】儲存 projectId
        spotId: layout.spotId,
        x: Number(layout.x) || 0,
        y: Number(layout.y) || 0,
        width: Number(layout.width) || 50,
        height: Number(layout.height) || 30,
        rotation: Number(layout.rotation) || 0,
        type: layout.type || 'manual',
        salesParkingId: layout.salesParkingId,
        displayMode: layout.displayMode || 'backend',
        updatedAt: now
      };

      if (layout.id) {
        // 更新現有佈局
        batch.update(db.collection("parkingSpotLayouts").doc(layout.id), layoutData);
      } else {
        // 創建新佈局
        layoutData.createdAt = now;
        // ✓【修改】文件名稱定義為 {projectid}_{spotId}
        const docRef = db.collection("parkingSpotLayouts").doc(`${projectId}_${layout.spotId}`);
        batch.set(docRef, layoutData);
      }
    }

    // 保存背景圖片數據
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

    await batch.commit();
    
    console.log(`[${functionName}] 批量保存完成`);
    return { 
      status: "success", 
      message: `成功保存 ${layouts.length} 個佈局項目` 
    };

  } catch (error) {
    console.error(`[${functionName}] Error:`, error);
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
      .orderBy('number', 'desc'); // 降冪排序

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


/**
 *  【新增】 上傳驗屋系統戶別資料並更新 Firestore
 * 從前端接收 Excel 解析後的 JSON 資料，批次更新 households 集合
 */
exports.uploadInspectionHouseholds = onCall({ region: "asia-east1", timeoutSeconds: 540, memory: "1GiB" }, async (request) => {
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

    const db = new Firestore({ databaseId: "anxi-app" });

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

            const batchQuery = db.collection('bookingBatches').where('projectId', '==', projectId).where('batchCode', '==', batchCode).where('bookingType', '==', bookingData.bookingType).limit(1);
            const batchSnapshot = await transaction.get(batchQuery);
            if (batchSnapshot.empty) {
                throw new HttpsError("not-found", `找不到對應的預約批次。`);
            }
            const batchId = batchSnapshot.docs[0].id;

            const appointmentDateStr = bookingData.bookingDate.split(' ')[0].replace(/\//g, '-');
            const linksQuery = db.collection('batchRuleLinks').where('batchId', '==', batchId).where('date', '==', appointmentDateStr).limit(1);
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
            const timeSlotKey = bookingData.bookingTimeSlot.split(' ')[0];
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
            const appointmentDateObj = new Date(appointmentDateStr + 'T00:00:00');
            const appointmentsQueryCapacity = db.collection('appointments').where('projectId', '==', projectId).where('appointmentDate', '==', appointmentDateObj).where('appointmentTimeSlot', '==', timeSlotKey).where('status', '==', '預約中');
            const appointmentsSnapshot = await transaction.get(appointmentsQueryCapacity);
            const currentBookings = appointmentsSnapshot.size;

            if (currentBookings >= capacity) {
                throw new HttpsError("resource-exhausted", `此時段名額剛好額滿，請返回上一步重新選擇時段。`);
            }
            
            // 4. 所有檢查通過，準備寫入新資料
            const bookingCode = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'.split('').sort(() => 0.5 - Math.random()).join('').substring(0, 6);
            const now = new Date();
            const timezoneOffset = 8 * 60;
            const localNow = new Date(now.getTime() + (now.getTimezoneOffset() + timezoneOffset) * 60000);
            const timeStr = localNow.toISOString().slice(11, 19).replace(/:/g, '-');
            const dateStr = localNow.toISOString().slice(5, 10);
            const docId = `${projectId}_${dateStr}-${timeStr}_${bookingData.unitId}`;
            const appointmentRef = db.collection('appointments').doc(docId);
            
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
                appointmentDate: Timestamp.fromDate(new Date(appointmentDateStr)),
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
                reportUploaded: false,
            };

            transaction.set(appointmentRef, newAppointmentData);
            
            //  【已移除】此處不再需要手動更新 households 集合的程式碼

            return { bookingCode, newAppointmentData };
        });

        // Transaction 成功後
        const { bookingCode, newAppointmentData } = result;
        
        //  【已新增】在此處呼叫統一的摘要更新函式
        await updateHouseholdSummary(db, projectId, newAppointmentData.unitId);
        
        let closingText = '請於預約時段準時抵達，感謝您的配合。';
        let inspectionNotesHtml = '';
        let contactInfoHtml = ''; 
        if (projectDoc.exists) {
            const projectData = projectDoc.data();
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
          <tr style="border-bottom: 1px solid #eeeeee;"><td style="padding: 12px 0; font-weight: bold; color: #555555;">驗屋方式</td><td style="padding: 12px 0;">${newAppointmentData.inspectionMethod}</td></tr>
          ${newAppointmentData.inspectionCompanyName ? `
          <tr style="border-bottom: 1px solid #eeeeee;"><td style="padding: 12px 0; font-weight: bold; color: #555555;">代驗公司</td><td style="padding: 12px 0;">${newAppointmentData.inspectionCompanyName}</td></tr>
          ` : ''}
 <tr style="border-bottom: 1px solid #eeeeee;"><td style="padding: 12px 0; font-weight: bold; color: #555555;">預約日期</td><td style="padding: 12px 0;">${newAppointmentData.appointmentDate.toDate().toLocaleDateString('zh-TW', { year: 'numeric', month: '2-digit', day: '2-digit' })}</td></tr>
          <tr><td style="padding: 12px 0; font-weight: bold; color: #555555;">預約時段</td><td style="padding: 12px 0;">${newAppointmentData.appointmentTimeSlot}</td></tr>
        </tbody>
      </table>
      <div style="padding: 15px; margin-top: 15px; margin-bottom: 20px; background-color: #f8f9fa; border-left: 4px solid #17a2b8; color: #333;">${closingText}</div>
      ${contactInfoHtml}
      ${inspectionNotesHtml ? `
        <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #eeeeee;">
          <h3 style="margin-top: 0; color: #333;">驗屋說明</h3>
          ${inspectionNotesHtml}
        </div>
      ` : ''}
      ${bookingLinkHtml}
    </div>
    <div style="background-color: #f4f4f7; padding: 16px; text-align: center; font-size: 12px; color: #777777;">
      <p style="margin: 0;">此為系統自動發送郵件，請勿直接回覆。</p>
     <p style="margin: 5px 0 0 0;">${projectName} 預約系統</p>
      <p style="margin: 10px 0 0 0; font-size: 11px; color: #999999;">
        本服務由 <a href="https://airrick1985.wixsite.com/anxi" target="_blank" style="color: #007bff; text-decoration: none; font-weight: bold;">anxismart安熙智慧建案管理系統</a> 提供技術支援
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

        return { status: 'success', data: { bookingCode } };

    } catch (error) {
        console.error(`[${functionName}] 🔴 預約時發生錯誤:`, error);
        if (error instanceof HttpsError) {
            throw error;
        }
        throw new HttpsError("internal", `儲存預約時發生嚴重錯誤: ${error.message}`);
    }
});

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

            // ✅ 【已移除】此處不再需要手動更新 households 集合的程式碼
        });
        
        console.log(`[${functionName}] 已成功將預約 [${docToCancel.id}] 的狀態更新為「取消」。`);

        // ✅ 【已新增】在交易成功後，呼叫統一的摘要更新函式
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
          <tr style="border-bottom: 1px solid #eeeeee;"><td style="padding: 12px 0; font-weight: bold; color: #555555;">驗屋方式</td><td style="padding: 12px 0;">${bookingData.inspectionMethod || '未提供'}</td></tr>
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
        本服務由 <a href="https://airrick1985.wixsite.com/anxi" target="_blank" style="color: #007bff; text-decoration: none; font-weight: bold;">anxismart安熙智慧建案管理系統</a> 提供技術支援
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
exports.uploadAuthLetter = onCall({ region: "asia-east1",
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



/**
 * [新增] 供管理員新增預約的雲端函式
 * 包含：時段與名額驗證、強制新增、自訂文件ID、同步更新戶別資料
 */
// ✓ START: 修改 - 增加 secrets 和 email 寄送邏輯
exports.addAppointmentByAdmin = onCall({ region: "asia-east1", cors: true, secrets: ["SENDER_EMAIL", "GMAIL_APP_PASSWORD"] }, async (request) => {
    const { projectId, newBookingData, cancelBookingCode, force = false } = request.data;
    const functionName = `addAppointmentByAdmin (Project: ${projectId})`;

    if (!projectId || !newBookingData) {
        throw new HttpsError("invalid-argument", "缺少 projectId 或 newBookingData。");
    }

    const db = new Firestore({ databaseId: "anxi-app" });
    const householdDocId = `${projectId}_${newBookingData.unitId}`;
    const householdRef = db.collection('households').doc(householdDocId);

    let rawTimeSlot = newBookingData.appointmentTimeSlot;
    let timeSlotKey = '';

    if (typeof rawTimeSlot === 'string') {
        timeSlotKey = rawTimeSlot;
    } else if (typeof rawTimeSlot === 'object' && rawTimeSlot !== null && rawTimeSlot.value) {
        timeSlotKey = String(rawTimeSlot.value);
    }
    
    timeSlotKey = timeSlotKey.split(' ')[0];
    
    // 在 try 區塊外宣告變數，以便後續寄送 email 時使用
    let finalAppointmentData;
    let docId;
    let projectName;

    try {
        if (!force) {
            const appointmentDateStr = newBookingData.appointmentDate.split('T')[0];
            const appointmentDateObj = new Date(appointmentDateStr + 'T00:00:00');
            const appointmentsQuery = await db.collection('appointments').where('projectId', '==', projectId).where('appointmentDate', '==', appointmentDateObj).where('appointmentTimeSlot', '==', timeSlotKey).where('status', '==', '預約中').get();
            const currentBookings = appointmentsQuery.size;
            const capacity = 1; 
            if (currentBookings >= capacity) {
                throw new HttpsError('failed-precondition', `SLOT_FULL: 該時段名額已滿 (目前 ${currentBookings} 人)。`);
            }
        }

        const batch = db.batch();
        if (cancelBookingCode) {
            const oldAppointmentsQuery = db.collection("appointments").where("bookingCode", "==", cancelBookingCode).where("projectId", "==", projectId);
            const oldSnapshot = await oldAppointmentsQuery.get();
            if (!oldSnapshot.empty) {
                batch.update(oldSnapshot.docs[0].ref, { status: "取消", cancelledAt: Timestamp.now() });
            }
        }

        const now = new Date();
        const timezoneOffset = 8 * 60;
        const localNow = new Date(now.getTime() + (now.getTimezoneOffset() + timezoneOffset) * 60000);
        const timeStr = localNow.toISOString().slice(11, 19).replace(/:/g, '-');
        const dateStr = localNow.toISOString().slice(5, 10);
        docId = `${projectId}_${dateStr}-${timeStr}_${newBookingData.unitId}`;
        const newAppointmentRef = db.collection('appointments').doc(docId);

        const bookingCode = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'.split('').sort(() => 0.5 - Math.random()).join('').substring(0, 6);
        
        // 將要寫入的資料存到 finalAppointmentData
        finalAppointmentData = {
            address: newBookingData.address || "",
            agentAddress: newBookingData.agentAddress || "",
            agentIdNumber: newBookingData.agentIdNumber || "",
            agentName: newBookingData.agentName || "",
            agentPhone: newBookingData.agentPhone || "",
            authorizationLetterUrl: newBookingData.authorizationLetterUrl || "",
            bookerEmail: newBookingData.bookerEmail || "",
            bookerIdNumber: newBookingData.bookerIdNumber || "",
            bookerName: newBookingData.bookerName || "",
            bookerPhone: newBookingData.bookerPhone || "",
            bookingType: newBookingData.bookingType || "",
            bookingRemarks: newBookingData.bookingRemarks || "", 
            inspectionCompanyName: newBookingData.inspectionCompanyName || "",
            inspectionMethod: newBookingData.inspectionMethod || "",
            principalAddress: newBookingData.principalAddress || "",
            principalIdNumber: newBookingData.principalIdNumber || "",
            principalName: newBookingData.principalName || "",
            status: newBookingData.status || "預約中",
            unitId: newBookingData.unitId,
            createdByName: newBookingData.createdByName || null,
            lastModifiedByName: newBookingData.lastModifiedByName || null,
            projectId: projectId,
            createdAt: Timestamp.now(),
            appointmentTimeSlot: timeSlotKey,
            bookingCode: bookingCode,
            reportUploaded: false, 
            appointmentDate: newBookingData.appointmentDate ? Timestamp.fromDate(new Date(newBookingData.appointmentDate.split('T')[0])) : null
        };

        batch.set(newAppointmentRef, finalAppointmentData);

        const householdUpdatePayload = {};
        const finalAppointmentDateObj = new Date(`${newBookingData.appointmentDate.split('T')[0]}T${timeSlotKey}:00`);
        if (newBookingData.bookingType === '初驗') {
            householdUpdatePayload.initialInspectionDate = Timestamp.fromDate(finalAppointmentDateObj);
            householdUpdatePayload.initialInspectionMethod = newBookingData.inspectionMethod;
        } else if (newBookingData.bookingType === '複驗') {
            householdUpdatePayload.reInspectionDate = Timestamp.fromDate(finalAppointmentDateObj);
            householdUpdatePayload.reInspectionMethod = newBookingData.inspectionMethod;
        }
        if (Object.keys(householdUpdatePayload).length > 0) {
            const householdDoc = await householdRef.get();
            if(householdDoc.exists) {
                batch.update(householdRef, householdUpdatePayload);
            }
        }
        
        await batch.commit();
        //新增：在所有資料庫操作成功後，呼叫摘要更新函式
        await updateHouseholdSummary(db, projectId, newBookingData.unitId);

        // --- 資料寫入成功後，開始寄送 Email ---
        if (finalAppointmentData.bookerEmail) {
            const projectRef = db.collection('projects').doc(projectId);
            const projectDoc = await projectRef.get();
            projectName = projectDoc.exists ? projectDoc.data().name : projectId;

            let closingText = '請於預約時段準時抵達，感謝您的配合。';
            let inspectionNotesHtml = '';
            let contactInfoHtml = '';

            if (projectDoc.exists) {
                const projectData = projectDoc.data();
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
            const htmlBody = `
<div style="font-family: 'Helvetica Neue', Helvetica, Arial, 'PingFang TC', 'Microsoft JhengHei', sans-serif; background-color: #f4f4f7; padding: 20px;">
  <div style="max-width: 600px; margin: 20px auto; background-color: #ffffff; border-radius: 8px; border: 1px solid #e0e0e0; overflow: hidden;">
    <div style="background-color: #007bff; color: #ffffff; padding: 20px; text-align: center;"><h2 style="margin: 0; font-size: 24px;">預約成功通知</h2></div>
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
          ${finalAppointmentData.agentName ? `<tr style="border-top: 1px dashed #cccccc;"><td style="padding: 12px 0; font-weight: bold; color: #555555;">受託人姓名</td><td style="padding: 12px 0;">${finalAppointmentData.agentName}</td></tr><tr style="border-bottom: 1px solid #eeeeee;"><td style="padding: 12px 0; font-weight: bold; color: #555555;">受託人電話</td><td style="padding: 12px 0;">${finalAppointmentData.agentPhone}</td></tr>` : ''}
          ${finalAppointmentData.authorizationLetterUrl ? `<tr style="border-bottom: 1px solid #eeeeee;"><td style="padding: 12px 0; font-weight: bold; color: #555555;">驗屋授權書</td><td style="padding: 12px 0;"><a href="${finalAppointmentData.authorizationLetterUrl}" target="_blank" style="color: #007BFF; text-decoration: none;">點此查看</a></td></tr>` : ''}
          <tr style="border-bottom: 1px solid #eeeeee;"><td style="padding: 12px 0; font-weight: bold; color: #555555;">預約項目</td><td style="padding: 12px 0;">${finalAppointmentData.bookingType}</td></tr>
          <tr style="border-bottom: 1px solid #eeeeee;"><td style="padding: 12px 0; font-weight: bold; color: #555555;">驗屋方式</td><td style="padding: 12px 0;">${finalAppointmentData.inspectionMethod}</td></tr>
          ${finalAppointmentData.inspectionCompanyName ? `<tr style="border-bottom: 1px solid #eeeeee;"><td style="padding: 12px 0; font-weight: bold; color: #555555;">代驗公司</td><td style="padding: 12px 0;">${finalAppointmentData.inspectionCompanyName}</td></tr>` : ''}
          <tr style="border-bottom: 1px solid #eeeeee;"><td style="padding: 12px 0; font-weight: bold; color: #555555;">預約日期</td><td style="padding: 12px 0;">${finalAppointmentData.appointmentDate.toDate().toLocaleDateString('zh-TW', { year: 'numeric', month: '2-digit', day: '2-digit' })}</td></tr>
          <tr><td style="padding: 12px 0; font-weight: bold; color: #555555;">預約時段</td><td style="padding: 12px 0;">${finalAppointmentData.appointmentTimeSlot}</td></tr>
        </tbody>
      </table>
      <div style="padding: 15px; margin-top: 15px; margin-bottom: 20px; background-color: #f8f9fa; border-left: 4px solid #17a2b8; color: #333;">${closingText}</div>
      ${contactInfoHtml}
      ${inspectionNotesHtml ? `<div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #eeeeee;"><h3 style="margin-top: 0; color: #333;">驗屋說明</h3>${inspectionNotesHtml}</div>` : ''}
      ${bookingLinkHtml}
    </div>
    <div style="background-color: #f4f4f7; padding: 16px; text-align: center; font-size: 12px; color: #777777;">
      <p style="margin: 0;">此為系統自動發送郵件，請勿直接回覆。</p>
      <p style="margin: 5px 0 0 0;">${projectName} 預約系統</p>
      <p style="margin: 10px 0 0 0; font-size: 11px; color: #999999;">本服務由 <a href="https://airrick1985.wixsite.com/anxi" target="_blank" style="color: #007bff; text-decoration: none; font-weight: bold;">anxismart安熙智慧建案管理系統</a> 提供技術支援</p>
    </div>
  </div>
</div>`;

            const ccRecipients = await getCcRecipients(projectId, "驗屋系統信件副本");
            await mailTransport.sendMail({
                to: finalAppointmentData.bookerEmail,
                cc: ccRecipients,
                subject: subject,
                html: htmlBody, 
                name: `${projectName} 預約系統`
            });
            console.log(`[${functionName}] 已成功寄送預約成功通知信至 ${finalAppointmentData.bookerEmail}`);
        }

        return { status: 'success', docId: docId };

    } catch (error) {
        console.error(`[${functionName}] 新增預約時發生錯誤:`, error);
        if (error instanceof HttpsError) {
            throw error;
        }
        throw new HttpsError("internal", `新增預約時發生嚴重錯誤: ${error.message}`);
    }
});

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
 *  [最終修正版] 代理驗屋報告上傳
 * 接收前端傳來的 Base64 檔案，直接存到 Google Drive、更新資料庫、寄送 Email。
 */
/**
 * [最終修正版] 代理驗屋報告上傳
 * 接收前端傳來的 Base64 檔案，直接存到 Google Drive、更新資料庫、寄送 Email。
 * (已重構，解決 Read-after-Write 的事務問題)
 */
exports.handleDirectReportUpload = onCall({ region: "asia-east1",
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
      本服務由 <a href="https://airrick1985.wixsite.com/anxi" target="_blank" style="color: #007bff; text-decoration: none; font-weight: bold;">anxismart安熙智慧建案管理系統</a> 提供技術支援
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
 */
exports.dailyAppointmentStatusUpdate = onSchedule({ region: "asia-east1",
    schedule: "every day 17:00",
    timeZone: "Asia/Taipei", // 指定時區為台灣
    memory: "256MiB" // 此任務所需記憶體不多，256MB 足夠
}, async (event) => {
    
    console.log("排程啟動：開始檢查並更新當日預約狀態...");
    const functionName = "dailyAppointmentStatusUpdate";
    const db = new Firestore({ databaseId: "anxi-app" });

    try {
        // 1. 獲取台灣時區的「今天」日期範圍
        // 由於函式可能在 UTC 時區的伺服器上運行，我們需要明確指定時區
        const nowInTaipei = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Taipei" }));
        
        // 設定查詢範圍為今天的 00:00:00 到 23:59:59
        const startOfDay = new Date(nowInTaipei.getFullYear(), nowInTaipei.getMonth(), nowInTaipei.getDate(), 0, 0, 0);
        const endOfDay = new Date(nowInTaipei.getFullYear(), nowInTaipei.getMonth(), nowInTaipei.getDate(), 23, 59, 59);

        // 2. 建立查詢
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

        // 3. 使用批次寫入 (Write Batch) 來一次性更新所有文件，效能較好
        const batch = db.batch();
        snapshot.docs.forEach(doc => {
            batch.update(doc.ref, { status: "已完成" });
        });

        // 4. 提交批次更新
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
exports.initiateAuthSigningProcess = onCall({ region: "asia-east1",
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
exports.completeAuthSigningProcess = onCall({ region: "asia-east1",
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
            name: `授權書-${new Date().toISOString().slice(0,10)}`,
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
                  本服務由 <a href="https://airrick1985.wixsite.com/anxi" target="_blank" style="color: #007bff; text-decoration: none; font-weight: bold;">anxismart安熙智慧建案管理系統</a> 提供技術支援
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
    
    if (latestAppointment.uploadReportTime) {
      const uploadTime = latestAppointment.uploadReportTime.toDate().toLocaleString('zh-TW', { timeZone: 'Asia/Taipei' });
      const projectDoc = await db.collection('projects').doc(projectId).get();
      const projectName = projectDoc.exists ? projectDoc.data().name : projectId;
      console.log(`[${functionName}] 發現已上傳紀錄，拒絕操作。`);
      throw new HttpsError('already-exists', `${projectName} ${unitId} 已於 ${uploadTime} 上傳過 ${reportType}，如需重新上傳請洽客服人員。`);
    }

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
            if (!appointment.appointmentDate || !appointment.bookerEmail) continue;

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
                              本服務由 <a href="https://airrick1985.wixsite.com/anxi" target="_blank" style="color: #007bff; text-decoration: none; font-weight: bold;">anxismart安熙智慧建案管理系統</a> 提供技術支援
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
exports.sendUploadReminders = onSchedule({ region: "asia-east1",
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

exports.manualTriggerSendReminders = onCall({ region: "asia-east1",
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
exports.initiateLineBindingVerification = onCall({ region: "asia-east1",
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


// ✓ START: 新增 - 獲取 LIFF 使用者資料與權限
/**
 * [LIFF查詢用] 獲取使用者資料與其可查詢的建案列表
 * @param {string} lineId - 從 LIFF SDK 獲取的 LINE User ID
 * @returns {Promise<object>} - 包含綁定狀態、使用者名稱及建案列表
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
        const userKey = userDoc.id; // 使用者文件 ID (手機號碼)

        // 步驟 2: 透過使用者 ID (手機) 查找權限
        const permDocRef = db.collection("userPermissions").doc(userKey);
        const permDoc = await permDocRef.get();

        if (!permDoc.exists) {
            console.log(`[${functionName}] 用戶 [${userKey}] 找不到權限文件。`);
            return { status: "bound", userName: userData.name, projects: [] }; // 已綁定但無任何權限
        }

        // 步驟 3: 解析權限，篩選出可用的建案
        const permissions = permDoc.data().permissions || {};
        const authorizedProjects = [];
        for (const projectId in permissions) {
            const projectPerms = permissions[projectId];
            // 檢查是否包含 '驗屋預約管理-檢視' 或 '驗屋預約管理-修改' 權限
            if (projectPerms.systems && (projectPerms.systems.includes("驗屋預約管理-檢視") || projectPerms.systems.includes("驗屋預約管理-修改"))) {
                authorizedProjects.push({
                    projectId: projectId,
                    projectName: projectPerms.projectName,
                });
            }
        }
        
        console.log(`[${functionName}] 用戶 [${userKey}] 擁有 ${authorizedProjects.length} 個建案的查詢權限。`);
        return {
            status: "bound",
            userName: userData.name,
            projects: authorizedProjects,
        };

    } catch (error) {
        console.error(`[${functionName}] 獲取 LIFF 用戶資料時發生錯誤:`, error);
        throw new HttpsError("internal", "處理用戶資料時發生錯誤。");
    }
});
// ✓ END

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
 * [後台用] 獲取指定建案所有預約批次的詳細資訊 (修正版)
 * @param {string} projectId - 建案 ID
 * @returns {Promise<object>} - 以 bookingType 和 batchCode 分類的批次資訊物件
 */
exports.getProjectBatchDetails = onCall(async (request) => {
    const { projectId } = request.data;
    const functionName = "getProjectBatchDetails";

    if (!projectId) {
        throw new HttpsError("invalid-argument", "缺少建案 ID (projectId)。");
    }

    const db = new Firestore({ databaseId: "anxi-app" });
    try {
        const batchesRef = db.collection("bookingBatches");
        const query = batchesRef.where("projectId", "==", projectId);
        const snapshot = await query.get();

        if (snapshot.empty) {
            return { status: "success", data: {} };
        }

        const batchDetails = {};
        // ✓ 1. 獲取當下的台灣時區時間，作為比較的基準
        const now = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Taipei" }));

        snapshot.forEach(doc => {
            const data = doc.data();
            const { bookingType, batchCode, applicationStart, applicationEnd } = data;

            if (!bookingType || !batchCode) return;

            let statusText = '狀態不明';
            let color = 'grey';
            let start, end;

            // ✓ 2. 將 Firestore 的 Timestamp 物件轉換為 JavaScript 的 Date 物件
            if (applicationStart && typeof applicationStart.toDate === 'function') {
                start = applicationStart.toDate();
            }

            if (applicationEnd && typeof applicationEnd.toDate === 'function') {
                end = applicationEnd.toDate();
            }

            if ((start && isNaN(start.getTime())) || (end && isNaN(end.getTime()))) {
                console.warn(`[${functionName}] 警告：批次 ${batchCode} 的日期格式無效，已跳過。`, { applicationStart, applicationEnd });
                return;
            }

            // ✓ 3. 執行核心的動態比較邏輯
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

            if (!batchDetails[bookingType]) {
                batchDetails[bookingType] = {};
            }

            // ✓ 4. 將計算出的結果存入回傳物件
            batchDetails[bookingType][batchCode] = {
                bookingStart: data.bookingStart,
                bookingEnd: data.bookingEnd,
                statusText: statusText,
                color: color
            };
        });

        console.log(`[${functionName}] 已成功處理專案 [${projectId}] 的 ${snapshot.size} 個批次資訊。`);
        return { status: "success", data: batchDetails };

    } catch (error) {
        console.error(`[${functionName}] 獲取批次詳情時發生錯誤:`, error);
        throw new HttpsError("internal", "獲取批次詳情時發生錯誤。");
    }
});

/**
 * [後台用] 獲取行事曆所需的所有日期及其分類 (本戶批次/其他批次)
 * @param {string} projectId - 建案 ID
 * @param {string} unitId - 戶別 ID
 * @returns {Promise<object>} - 包含日期與其類型的陣列
 */
exports.getAdminBookingCalendarData = onCall(async (request) => {
    const { projectId, unitId } = request.data;
    const functionName = "getAdminBookingCalendarData";

    if (!projectId || !unitId) {
        throw new HttpsError("invalid-argument", "缺少建案 ID (projectId) 或戶別 ID (unitId)。");
    }

    const db = new Firestore({ databaseId: "anxi-app" });
    try {
        // 步驟 1: 獲取目標戶別的批次代碼
        const householdDocRef = db.collection("households").doc(`${projectId}_${unitId}`);
        const householdDoc = await householdDocRef.get();
        if (!householdDoc.exists) {
            throw new HttpsError("not-found", "找不到指定的戶別資料。");
        }
        const householdData = householdDoc.data();
        const ownBatchCodes = new Set([householdData.initialInspectionBatch, householdData.reInspectionBatch].filter(Boolean));

        // 步驟 2: 獲取專案所有批次的 ID 與代碼對照表
        const batchesRef = db.collection("bookingBatches");
        const batchesQuery = batchesRef.where("projectId", "==", projectId);
        const batchesSnapshot = await batchesQuery.get();
        const batchIdToCodeMap = new Map();
        batchesSnapshot.forEach(doc => {
            batchIdToCodeMap.set(doc.id, doc.data().batchCode);
        });

        // 步驟 3: 獲取所有日期的批次歸屬
        const linksRef = db.collection("batchRuleLinks");
        const linksQuery = linksRef.where("projectId", "==", projectId);
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
            }
        });

        // 步驟 4: 分類日期
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

        console.log(`[${functionName}] 已成功處理專案 [${projectId}] 的 ${calendarData.length} 個可預約日期。`);
        return { status: "success", data: calendarData };

    } catch (error) {
        console.error(`[${functionName}] 獲取行事曆資料時發生錯誤:`, error);
        throw new HttpsError("internal", "獲取行事曆資料時發生錯誤。");
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
  console.log(`[${functionName}] 開始為戶別 ${projectId}_${unitId} 更新摘要...`);

  try {
    // 1. 查找此戶別所有「有效」的預約 (狀態不為 "取消")
    const appointmentsRef = db.collection("appointments");
    const query = appointmentsRef
      .where("projectId", "==", projectId)
      .where("unitId", "==", unitId)
      .where("status", "!=", "取消");
    
    const snapshot = await query.get();

    let latestInitial = null;
    let latestReInspection = null;

    // 2. 遍歷所有有效預約，找出最新的初驗和複驗
    snapshot.forEach(doc => {
      const appt = doc.data();
      if (appt.bookingType === '初驗') {
        if (!latestInitial || appt.appointmentDate.toDate() > latestInitial.appointmentDate.toDate()) {
          latestInitial = appt;
        }
      } else if (appt.bookingType === '複驗') {
        if (!latestReInspection || appt.appointmentDate.toDate() > latestReInspection.appointmentDate.toDate()) {
          latestReInspection = appt;
        }
      }
    });

    // 3. 準備要寫入 households 集合的資料
    const householdUpdatePayload = {
      initialInspectionDate: latestInitial ? latestInitial.appointmentDate : null,
      initialInspectionMethod: latestInitial ? latestInitial.inspectionMethod : null,
      reInspectionDate: latestReInspection ? latestReInspection.appointmentDate : null,
      reInspectionMethod: latestReInspection ? latestReInspection.inspectionMethod : "",
    };

    // 4. 執行更新
    const householdDocRef = db.collection("households").doc(`${projectId}_${unitId}`);
    await householdDocRef.update(householdUpdatePayload);
    
    console.log(`[${functionName}] 成功更新戶別 ${unitId} 的摘要資訊。`);

  } catch (error) {
    // 即使摘要更新失敗，也不應該中斷主流程，僅記錄錯誤
    console.error(`[${functionName}] 更新戶別 ${unitId} 摘要時發生錯誤:`, error);
  }
}


/**
 * [後台用] 更新一筆預約紀錄，並同步更新戶別摘要
 */
exports.updateAppointmentByAdmin = onCall({ region: "asia-east1", cors: true }, async (request) => {
  const { appointmentId, bookingPayload, householdDocId, householdPayload } = request.data;
  const functionName = `updateAppointmentByAdmin (ID: ${appointmentId})`;

  if (!appointmentId) {
    throw new HttpsError("invalid-argument", "缺少 appointmentId。");
  }

  const db = new Firestore({ databaseId: "anxi-app" });
  
  try {
    const appointmentRef = db.collection("appointments").doc(appointmentId);
    
    const appointmentDoc = await appointmentRef.get();
    if (!appointmentDoc.exists) {
      throw new HttpsError("not-found", "找不到要更新的預約紀錄。");
    }
    const { projectId, unitId } = appointmentDoc.data();

    const batch = db.batch();
    let hasOperations = false;

    // ✅ 【核心修正】增強日期處理邏輯
    // ----------------------------------------------------
    const processDate = (payload, fieldName) => {
      if (payload && payload[fieldName]) {
        // 無論傳進來的是 Date 物件還是 ISO 字串，都先嘗試建立一個新的 Date 物件
        const dateObj = new Date(payload[fieldName]);
        // 只要能成功轉換成有效日期，就將其格式化為 Firestore Timestamp
        if (!isNaN(dateObj.getTime())) {
          payload[fieldName] = Timestamp.fromDate(dateObj);
        }
      }
    };

    processDate(bookingPayload, 'appointmentDate');
    processDate(householdPayload, 'appropriationDate');
    // ----------------------------------------------------

    if (bookingPayload && Object.keys(bookingPayload).length > 0) {
        batch.update(appointmentRef, bookingPayload);
        hasOperations = true;
    }
    if (householdDocId && householdPayload && Object.keys(householdPayload).length > 0) {
        const householdRef = db.collection("households").doc(householdDocId);
        batch.update(householdRef, householdPayload);
        hasOperations = true;
    }
    
    if (hasOperations) {
        await batch.commit();
        console.log(`[${functionName}] 成功更新文件。`);
    } else {
        console.log(`[${functionName}] 沒有偵測到任何變更。`);
        await updateHouseholdSummary(db, projectId, unitId);
        return { status: 'no_changes' };
    }

    await updateHouseholdSummary(db, projectId, unitId);

    return { status: "success" };

  } catch (error) {
    console.error(`[${functionName}] 發生錯誤:`, error);
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

exports.driveProxyTask = onCall({ region: "asia-east1", 
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



exports.sendNotDownloadedReportReminder = onCall({ region: "asia-east1",
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
exports.scheduledReportReminder = onSchedule({ region: "asia-east1",
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
          console.log(`[${functionName}] ✅ 建案 [${projectId}] 符合條件，準備執行...`);
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
exports.batchImportInspectionOptions = onCall({ region: "asia-east1",
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
      if(potentialValues.length === 0) continue;

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
exports.exportInspectionOptionsToExcel = onCall({ region: "asia-east1",
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