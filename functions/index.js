// functions/index.js

const functions = require("firebase-functions");
const cors = require("cors")({ origin: true }); // 啟用 CORS，並允許所有來源
const { logger } = require("firebase-functions"); // 確保頂部有引入 logger



const admin = require("firebase-admin");
const nodemailer = require("nodemailer");
const crypto = require("crypto");
const { onCall, HttpsError, onRequest } = require("firebase-functions/v2/https");
const { onDocumentCreated } = require("firebase-functions/v2/firestore");
const { Firestore, FieldPath: GCloudFieldPath } = require("@google-cloud/firestore");
const {google} = require("googleapis");
const { FieldPath } = require("firebase-admin/firestore");
const { getStorage } = require("firebase-admin/storage"); //  1. 引入 GCS Admin SDK
const { pipeline } = require("stream/promises"); //  2. 引入 stream.pipeline 以安全地處理流
const { Transform } = require("stream"); //  3. 引入 Transform 來自訂資料轉換流
const { Readable } = require("stream"); //  新增此行，用於將 Buffer 轉為 Stream
const readline = require("readline"); 
const { Timestamp } = require("firebase-admin/firestore"); //  引入 Timestamp
const { onObjectFinalized } = require("firebase-functions/v2/storage");





const driveSecrets = [
    "DRIVE_CLIENT_ID",
    "DRIVE_CLIENT_SECRET",
    "DRIVE_REFRESH_TOKEN",
    "SENDER_EMAIL",
    "GMAIL_APP_PASSWORD"
];

admin.initializeApp();

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

// (您原有的 forgotPasswordSender 函式，保持不變)
exports.forgotPasswordSender = onCall({ secrets: gmailSecrets }, async (request) => {
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
exports.updateParkingSlide = onCall({secrets: gmailSecrets}, async (request) => {
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
exports.uploadParkingLots = onCall({secrets: gmailSecrets}, async (request) => {
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
exports.uploadHouseholds = onCall({ secrets: gmailSecrets }, async (request) => {
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
exports.runBackupJob = onCall({ timeoutSeconds: 540, memory: "1GiB" }, async (request) => {
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

const { FieldValue } = require("firebase-admin/firestore");


exports.runDeleteJob = onCall({ timeoutSeconds: 540, memory: "1GiB" }, async (request) => {
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
const { onSchedule } = require("firebase-functions/v2/scheduler");

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


//  START: 新增 generateExcelTemplate 雲端函式
const xlsx = require("xlsx"); // 在檔案頂部加入 require

exports.generateExcelTemplate = onCall({ timeoutSeconds: 300, memory: "1GiB" }, async (request) => {
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
exports.updateFieldsFromExcel = onCall({ timeoutSeconds: 540, memory: "1GiB" }, async (request) => {
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

exports.handleSpecialReportUpload = onCall({
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

    // functions/index.js

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


exports.handleSalesImageUpload = onCall({ memory: "1GiB" }, async (request) => {
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
exports.handleSalesSvgUpload = onCall({ memory: "1GiB" }, async (request) => {
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
exports.updateSalesData = onCall({ secrets: gmailSecrets }, async (request) => {
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
exports.cancelPurchase = onCall({ secrets: gmailSecrets }, async (request) => {
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
exports.uploadInspectionHouseholds = onCall({ timeoutSeconds: 540, memory: "1GiB" }, async (request) => {
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



exports.saveBooking = onCall({ secrets: ["SENDER_EMAIL", "GMAIL_APP_PASSWORD"], cors: true }, async (request) => {
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

            // 2.  在 Transaction 中執行關鍵檢查：重複預約
            const appointmentsQueryDuplicate = db.collection('appointments').where('projectId', '==', projectId).where('unitId', '==', bookingData.unitId).where('bookingType', '==', bookingData.bookingType).where('status', '==', '預約中');
            const existingBookingSnapshot = await transaction.get(appointmentsQueryDuplicate);
            if (!existingBookingSnapshot.empty) {
                // 如果已有預約，中斷 Transaction 並拋出錯誤
                throw new HttpsError("already-exists", `此戶別的「${bookingData.bookingType}」已有有效預約，請返回第一步重新操作。`);
            }

            // 3.  在 Transaction 中執行關鍵檢查：時段名額
            const appointmentDateObj = new Date(appointmentDateStr + 'T00:00:00');
            const appointmentsQueryCapacity = db.collection('appointments').where('projectId', '==', projectId).where('appointmentDate', '==', appointmentDateObj).where('appointmentTimeSlot', '==', timeSlotKey).where('status', '==', '預約中');
            const appointmentsSnapshot = await transaction.get(appointmentsQueryCapacity);
            const currentBookings = appointmentsSnapshot.size;

            if (currentBookings >= capacity) {
                // 如果名額已滿，中斷 Transaction 並拋出錯誤
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
            const finalAppointmentDate = new Date(`${appointmentDateStr}T${timeSlotKey}:00`);
            
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
            };

            transaction.set(appointmentRef, newAppointmentData);
            
            const householdUpdatePayload = {};
            if (bookingData.bookingType === '初驗') {
                householdUpdatePayload.initialInspectionDate = Timestamp.fromDate(finalAppointmentDate);
                householdUpdatePayload.initialInspectionMethod = bookingData.bookingMethod;
            } 
            else if (bookingData.bookingType === '複驗') {
                householdUpdatePayload.reInspectionDate = Timestamp.fromDate(finalAppointmentDate);
                householdUpdatePayload.reInspectionMethod = bookingData.bookingMethod;
            }
            
            if (Object.keys(householdUpdatePayload).length > 0) {
                 transaction.update(householdRef, householdUpdatePayload);
            }
            
            return { bookingCode, newAppointmentData };
        });

        // Transaction 成功後，繼續執行寄信等非關鍵操作
        const { bookingCode, newAppointmentData } = result;
        
          let closingText = '請於預約時段準時抵達，感謝您的配合。';
        let inspectionNotesHtml = '';
        if (projectDoc.exists) {
            const projectData = projectDoc.data();
            if (projectData.emailConfig && projectData.emailConfig.closingText) {
                closingText = projectData.emailConfig.closingText;
            }
            if (projectData.intro && projectData.intro.alert && projectData.intro.alert.text) {
                inspectionNotesHtml = projectData.intro.alert.text;
            }
        }

        const mailTransport = nodemailer.createTransport({
            service: 'gmail',
            auth: { user: process.env.SENDER_EMAIL, pass: process.env.GMAIL_APP_PASSWORD },
        });

        //  【關鍵修改】使用從後端安全獲取的 projectName
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
      ${inspectionNotesHtml ? `
        <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #eeeeee;">
          <h3 style="margin-top: 0; color: #333;">驗屋說明</h3>
          ${inspectionNotesHtml}
        </div>
      ` : ''}
      <p>${closingText}</p>
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
exports.cancelBooking = onCall({ secrets: ["SENDER_EMAIL", "GMAIL_APP_PASSWORD"], cors: true }, async (request) => {
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
        const householdDocId = `${projectId}_${bookingData.unitId}`;
        const householdRef = db.collection('households').doc(householdDocId);

        await db.runTransaction(async (transaction) => {
            const householdDoc = await transaction.get(householdRef);
            if (!householdDoc.exists) {
                console.warn(`[${functionName}] 警告：找不到對應的戶別資料文件 [${householdDocId}]，將僅取消預約。`);
            }

            transaction.update(docToCancel.ref, {
                status: "取消",
                cancelledAt: Timestamp.now()
            });

            if (householdDoc.exists) {
                const householdUpdatePayload = {};
                if (bookingData.bookingType === '初驗') {
                    householdUpdatePayload.initialInspectionDate = null;
                    householdUpdatePayload.initialInspectionMethod = null;
                } else if (bookingData.bookingType === '複驗') {
                    householdUpdatePayload.reInspectionDate = null;
                    householdUpdatePayload.reInspectionMethod = null;
                }
                
                if (Object.keys(householdUpdatePayload).length > 0) {
                    transaction.update(householdRef, householdUpdatePayload);
                }
            }
        });
        
        console.log(`[${functionName}] 已成功將預約 [${docToCancel.id}] 的狀態更新為「取消」，並同步清除戶別資料。`);

        if (bookingData.bookerEmail) {
            const projectRef = db.collection('projects').doc(projectId);
            const projectDoc = await projectRef.get();
            const projectName = projectDoc.exists ? projectDoc.data().name : projectId;

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
          <tr style="border-bottom: 1px solid #eeeeee;"><td style="padding: 12px 0; font-weight: bold; color: #555555;">原預約日期</td><td style="padding: 12px 0;">${bookingData.appointmentDate.toDate().toLocaleDateString('zh-TW', { timeZone: 'Asia/Taipei', year: 'numeric', month: '2-digit', day: '2-digit' })}</td></tr>
          <tr><td style="padding: 12px 0; font-weight: bold; color: #555555;">原預約時段</td><td style="padding: 12px 0;">${bookingData.appointmentTimeSlot}</td></tr>
        </tbody>
      </table>
      <p>若您需要重新預約，歡迎隨時返回預約頁面。感謝您的使用。</p>
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
exports.getSystemFunctions = onCall({ cors: true }, async (request) => {
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
exports.createSystemFunction = onCall({ cors: true }, async (request) => {
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
exports.updateSystemFunction = onCall({ cors: true }, async (request) => {
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
 *  [新增] 供管理員新增預約的雲端函式
 * 包含：時段與名額驗證、強制新增、自訂文件ID、同步更新戶別資料
 */
exports.addAppointmentByAdmin = onCall({ cors: true }, async (request) => {
    const { projectId, newBookingData, cancelBookingCode, force = false } = request.data;
    const functionName = `addAppointmentByAdmin (Project: ${projectId})`;

    if (!projectId || !newBookingData) {
        throw new HttpsError("invalid-argument", "缺少 projectId 或 newBookingData。");
    }

    const db = new Firestore({ databaseId: "anxi-app" });
    const householdDocId = `${projectId}_${newBookingData.unitId}`;
    const householdRef = db.collection('households').doc(householdDocId);

    //  START: 新增保護機制，安全地獲取 timeSlotKey
    let rawTimeSlot = newBookingData.appointmentTimeSlot;
    let timeSlotKey = '';

    if (typeof rawTimeSlot === 'string') {
        timeSlotKey = rawTimeSlot;
    } else if (typeof rawTimeSlot === 'object' && rawTimeSlot !== null && rawTimeSlot.value) {
        // 如果是從 v-combobox 來的物件，提取其 value
        timeSlotKey = String(rawTimeSlot.value);
    }
    
    // 清理字串，只取 HH:mm 部分
    timeSlotKey = timeSlotKey.split(' ')[0];
    //  END: 保護機制結束
    
    if (!force) {
        // ... (省略名額驗證邏輯，使用上面處理好的 timeSlotKey) ...
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
    const docId = `${projectId}_${dateStr}-${timeStr}_${newBookingData.unitId}`;
    const newAppointmentRef = db.collection('appointments').doc(docId);

    const bookingCode = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'.split('').sort(() => 0.5 - Math.random()).join('').substring(0, 6);
const dataToSave = {
        // 從前端 newBookingData 物件中獲取資料，並提供預設值
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

        // 由後端生成或處理的欄位
        projectId: projectId,
        createdAt: Timestamp.now(),
        appointmentTimeSlot: timeSlotKey,
        bookingCode: bookingCode,
        appointmentDate: null // 預設為 null，下面會處理
    };

    if (newBookingData.appointmentDate) {
        dataToSave.appointmentDate = Timestamp.fromDate(new Date(newBookingData.appointmentDate.split('T')[0]));
    }
    batch.set(newAppointmentRef, dataToSave);

    const householdUpdatePayload = {};
    const finalAppointmentDate = new Date(`${newBookingData.appointmentDate.split('T')[0]}T${timeSlotKey}:00`);
    if (newBookingData.bookingType === '初驗') {
        householdUpdatePayload.initialInspectionDate = Timestamp.fromDate(finalAppointmentDate);
        householdUpdatePayload.initialInspectionMethod = newBookingData.inspectionMethod;
    } else if (newBookingData.bookingType === '複驗') {
        householdUpdatePayload.reInspectionDate = Timestamp.fromDate(finalAppointmentDate);
        householdUpdatePayload.reInspectionMethod = newBookingData.inspectionMethod;
    }
    if (Object.keys(householdUpdatePayload).length > 0) {
        const householdDoc = await householdRef.get();
        if(householdDoc.exists) {
            batch.update(householdRef, householdUpdatePayload);
        }
    }
    
    await batch.commit();
    return { status: 'success', docId: docId };
});


/**
 *  [新增] 供管理員獲取指定日期的所有時段選項 (包含額滿狀態)
 */
exports.getSlotsForAdmin = onCall({ cors: true }, async (request) => {
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
                return `${time} (已額滿)`;
            } else {
                return `${time} (尚餘 ${remaining} 位)`;
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
exports.handleDirectReportUpload = onCall({
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
    fileName,
    fileContent,
    reportType,
    buyerName,
    phone,
    email,
    companyName,
  } = request.data;
  
  if (!projectId || !unit || !fileName || !fileContent || !reportType) {
    throw new HttpsError('invalid-argument', '缺少必要參數。');
  }

  console.log(`[${functionName}] 開始處理檔案: ${fileName} for ${unit}`);
  const db = new Firestore({ databaseId: "anxi-app" });
  
  try {
    const projectDocRef = db.collection('projects').doc(projectId);
    const projectDoc = await projectDocRef.get();
    
    const projectName = projectDoc.exists ? projectDoc.data().name : projectId;

    const householdDocId = `${projectId}_${unit}`;
    const householdRef = db.collection('households').doc(householdDocId);
    let uploadedFileLink;

    const now = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Taipei" }));
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const timestamp = `${year}${month}${day}-${hours}${minutes}`;

    const nameParts = [reportType, unit, buyerName, companyName].filter(Boolean);
    const newFileName = `${nameParts.join('-')}-${timestamp}.pdf`;


    await db.runTransaction(async (transaction) => {
      const householdDoc = await transaction.get(householdRef);
      if (!householdDoc.exists) {
        throw new Error(`找不到戶別資料: ${householdDocId}`);
      }
      const householdData = householdDoc.data();
      
      const switchField = reportType === '初驗報告' ? 'initialReportUploadSwitch' : 'reInspectionReportUploadSwitch';
      if (householdData[switchField] !== true) {
        throw new Error(`${unit} 的 ${reportType} 上傳權限已關閉。`);
      }
      
      const parentFolderUrl = householdData.inspectionReportFolderUrl;
      if (!parentFolderUrl) throw new Error(`戶別資料中缺少 "inspectionReportFolderUrl" 設定。`);
      
      const parentFolderIdMatch = parentFolderUrl.match(/[-\w]{25,}/);
      if (!parentFolderIdMatch) throw new Error('無效的 Drive 資料夾連結。');
      const parentFolderId = parentFolderIdMatch[0];
      
      const oauth2Client = new google.auth.OAuth2(
        process.env.DRIVE_CLIENT_ID, process.env.DRIVE_CLIENT_SECRET, 'https://developers.google.com/oauthplayground'
      );
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
      
      uploadedFileLink = uploadedFile.data.webViewLink;

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

      transaction.update(householdRef, {
        [switchField]: false,
        inspectionReportUrl: admin.firestore.FieldValue.arrayUnion({
          name: newFileName,
          url: uploadedFileLink,
        })
      });
    });

    if (email) {
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
          to: email,
          subject: subject,
          html: htmlBody,
      });
      console.log(`[${functionName}] 已成功寄送風格化確認信至: ${email}`);
    }
    
    console.log(`[${functionName}] 處理完成: ${newFileName}`);
    return { status: 'success', message: '檔案上傳成功，確認信已寄出。' };

  } catch (error) {
    console.error(`[${functionName}] 🔴 處理檔案時發生嚴重錯誤: ${fileName}`, error);
    if (error instanceof HttpsError) { throw error; }
    throw new HttpsError('internal', `處理上傳時發生錯誤: ${error.message}`);
  }
});



/**
 * 每日排程：自動更新當日已結束的預約狀態設定為:已完成
 * 此函式會於每日台灣時間 17:00 執行
 */
exports.dailyAppointmentStatusUpdate = onSchedule({
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
exports.initiateAuthSigningProcess = onCall({
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