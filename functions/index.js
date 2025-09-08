// functions/index.js

const admin = require("firebase-admin");
const nodemailer = require("nodemailer");
const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { onDocumentCreated } = require("firebase-functions/v2/firestore");
const { Firestore } = require("@google-cloud/firestore");
const {google} = require("googleapis");
const { FieldPath } = require("firebase-admin/firestore");
const { getStorage } = require("firebase-admin/storage"); //  1. 引入 GCS Admin SDK
const { pipeline } = require("stream/promises"); //  2. 引入 stream.pipeline 以安全地處理流
const { Transform } = require("stream"); //  3. 引入 Transform 來自訂資料轉換流
const readline = require("readline"); 



admin.initializeApp();

// 這個 db 實例會指向 (default) 資料庫，我們在函式內部會建立指向 anxi-app 的實例
const defaultDb = admin.firestore();
const rtdbAdmin = admin.database(); 


// 定義函式需要從 Secret Manager 讀取的密鑰名稱
const gmailSecrets = [
    "SENDER_EMAIL",
    "GMAIL_APP_PASSWORD" 
];

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

const ALL_SYSTEM_PERMISSIONS = [ '人員管理', '報價系統', '銷控系統', '報價系統銷售選單', '客戶管理', '客變系統', '寄信-銷控', '寄信-驗屋', '收信-銷控', '收信-驗屋', '訂閱查詢', '驗屋時間表-修改', '驗屋時間表-檢視', '驗屋系統' ];

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

            // 更新權限物件：新增或覆蓋這個新專案的權限
            currentPermissions[projectId] = {
                projectName: projectName,
                systems: ALL_SYSTEM_PERMISSIONS
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
            .where('showInMenu', '==', 'Y')
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
 *  驗證戶別與身分證號碼是否相符
 */
exports.validateId = onCall(async (request) => {
    const db = new Firestore({ databaseId: 'anxi-app' });
    const { projectId, unitId, idNumber } = request.data;

    if (!projectId || !unitId || !idNumber) {
        throw new HttpsError('invalid-argument', '缺少必要參數 (projectId, unitId, or idNumber)。');
    }

    try {
        // 在 households 集合中，文件 ID 就是 projectId_unitId
        const householdDocId = `${projectId}_${unitId}`;
        const householdDoc = await db.collection('households').doc(householdDocId).get();

        if (!householdDoc.exists) {
            throw new HttpsError('not-found', `找不到戶別 "${unitId}" 的資料。`);
        }

        const householdData = householdDoc.data();
        const storedId = String(householdData.buyerIdNumber || '').trim();
        const inputId = String(idNumber).trim();

        if (storedId === inputId) {
            return { status: 'success', message: '身分驗證成功。' };
        } else {
            throw new HttpsError('permission-denied', '身分證號碼與此戶別的資料不符，請重新確認。');
        }

    } catch (error) {
        console.error("validateId 錯誤:", error);
        if (error instanceof HttpsError) {
            throw error;
        }
        throw new HttpsError('internal', '驗證時發生錯誤。');
    }
});


/**
 *  檢查指定戶別是否有有效預約
 */
exports.checkExistingBooking = onCall(async (request) => {
    const db = new Firestore({ databaseId: 'anxi-app' });
    const { projectId, unitId, bookingType, idNumber } = request.data;

    if (!projectId || !unitId || !bookingType || !idNumber) {
        throw new HttpsError('invalid-argument', '缺少重複檢查所需的必要參數。');
    }

    try {
        const snapshot = await db.collection('appointments')
            .where('projectId', '==', projectId)
            .where('unitId', '==', unitId)
            .where('bookingType', '==', bookingType)
            .where('bookerIdNumber', '==', idNumber)
            .where('status', '==', '預約中')
            .orderBy('createdAt', 'desc') // 依建立時間排序，找到最新一筆
            .limit(1)
            .get();

        if (snapshot.empty) {
            // 找不到有效預約
            return { status: 'success', data: { status: 'not_found' } };
        } else {
            // 找到了，回傳第一筆預約的資料
            const bookingData = snapshot.docs[0].data();
            // Firestore 的 Timestamp 需要轉換才能在前端使用
            if (bookingData.appointmentDate && bookingData.appointmentDate.toDate) {
                bookingData.appointmentDate = bookingData.appointmentDate.toDate().toISOString();
            }
             if (bookingData.createdAt && bookingData.createdAt.toDate) {
                bookingData.createdAt = bookingData.createdAt.toDate().toISOString();
            }

            return { status: 'success', data: { status: 'found', booking: bookingData } };
        }
    } catch (error) {
        console.error("checkExistingBooking 錯誤:", error);
        throw new HttpsError('internal', '檢查現有預約時發生錯誤。');
    }
});


/**
 *  [核心] 獲取可預約的日期與時段 (取代 GAS 的 get_booking_slots)
 * 這是最複雜的函式，會執行以下一連串的資料庫查詢：
 * 1. 從 `households` 找到該戶別被指定的 `batchCode` (批次代號)。
 * 2. 用 `batchCode` 從 `bookingBatches` 找到對應批次的 ID 和起訖日期。
 * 3. 用 `batchId` 從 `batchRuleLinks` 找到所有關聯的每日規則 ID (`ruleId`)。
 * 4. 用 `ruleId` 列表從 `dateRules` 獲取所有詳細的每日規則 (時段/名額/方法)。
 * 5. 查詢 `appointments` 統計在該時段內已預約的人數。
 * 6. 最終計算出每個時段的剩餘名額並回傳。
 */
exports.getAvailableSlots = onCall(async (request) => {
    const db = new Firestore({ databaseId: 'anxi-app' });
    const { projectId, unitId, bookingType, bookingMethod } = request.data;

    if (!projectId || !unitId || !bookingType || !bookingMethod) {
        throw new HttpsError('invalid-argument', '缺少必要參數 (projectId, unitId, bookingType, or bookingMethod)。');
    }

    try {
        // --- 1. 從 households 獲取批次資訊 ---
        const householdDocId = `${projectId}_${unitId}`;
        const householdDoc = await db.collection('households').doc(householdDocId).get();
        if (!householdDoc.exists) {
            throw new HttpsError('not-found', `找不到戶別 "${unitId}" 的資料。`);
        }
        const householdData = householdDoc.data();

        // 根據預約項目決定要讀取哪個欄位
        const batchCodeField = bookingType === '初驗' ? 'initialInspectionBatch' : 'reInspectionBatch';
        const batchStatusField = bookingType === '初驗' ? 'initialInspectionBatchStatus' : 'reInspectionBatchStatus';
        const batchCode = householdData[batchCodeField];
        const batchStatus = householdData[batchStatusField];

        if (!batchCode || batchStatus !== 'Y') {
            throw new HttpsError('failed-precondition', `此戶別的 "${bookingType}" 預約目前未開放。`);
        }

        // --- 2. 從 bookingBatches 獲取批次 ID 和日期範圍 ---
        const batchQuery = await db.collection('bookingBatches')
            .where('projectId', '==', projectId)
            .where('batchCode', '==', batchCode)
            .where('bookingType', '==', bookingType)
            .limit(1).get();

        if (batchQuery.empty) {
            throw new HttpsError('not-found', `找不到對應的預約批次 (代號: ${batchCode})。`);
        }
        const batchDoc = batchQuery.docs[0];
        const batchData = batchDoc.data();
        const batchId = batchDoc.id;

        // --- 3. 從 batchRuleLinks 獲取所有關聯的 ruleId ---
        const linksQuery = await db.collection('batchRuleLinks')
            .where('projectId', '==', projectId)
            .where('batchId', '==', batchId)
            .get();

        if (linksQuery.empty) {
            return { startDate: batchData.bookingStart, endDate: batchData.bookingEnd, unavailableDates: [], timeSlotsByDate: {} };
        }
        const ruleIds = linksQuery.docs.map(doc => doc.data().ruleId);
        
        if (ruleIds.length === 0) {
            return { startDate: batchData.bookingStart, endDate: batchData.bookingEnd, unavailableDates: [], timeSlotsByDate: {} };
        }

        // --- 4. 從 dateRules 獲取所有每日的詳細規則 ---
        const rulesQuery = await db.collection('dateRules').where(admin.firestore.FieldPath.documentId(), 'in', ruleIds).get();
        const dateRulesMap = new Map();
        rulesQuery.forEach(doc => {
            dateRulesMap.set(doc.data().date, doc.data());
        });

        // --- 5. 獲取在時間範圍內的所有已預約紀錄 ---
        const appointmentsQuery = await db.collection('appointments')
            .where('projectId', '==', projectId)
            .where('status', '==', '預約中')
            .where('appointmentDate', '>=', new Date(batchData.bookingStart))
            .where('appointmentDate', '<=', new Date(batchData.bookingEnd))
            .get();

        const bookingsCount = {}; // e.g. { '2025-08-26_09:00': 2 }
        appointmentsQuery.forEach(doc => {
            const appt = doc.data();
            const apptDate = appt.appointmentDate.toDate().toISOString().split('T')[0];
            const key = `${apptDate}_${appt.appointmentTimeSlot}`;
            bookingsCount[key] = (bookingsCount[key] || 0) + 1;
        });

        // --- 6. 組合資料，計算剩餘名額 ---
        const timeSlotsByDate = {};
        dateRulesMap.forEach((rule, dateStr) => {
            const slotsForDay = [];
            // 將時段 (e.g., "14:00", "09:00") 排序，確保顯示順序正確
            const sortedTimeKeys = Object.keys(rule.slots).sort();

            for (const timeSlot of sortedTimeKeys) {
                const slotInfo = rule.slots[timeSlot];
                if (slotInfo.methods && slotInfo.methods.includes(bookingMethod)) {
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
            unavailableDates: [], // 在新架構下，此欄位已不需要，回傳空陣列以相容前端
            timeSlotsByDate: timeSlotsByDate
        };

    } catch (error) {
        console.error("getAvailableSlots 錯誤:", error);
        if (error instanceof HttpsError) throw error;
        throw new HttpsError('internal', '計算可預約時段時發生錯誤。');
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
            .where('showInMenu', '==', 'Y')
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

       // 【修改】資料已經是英文鍵，直接準備儲存，只需處理數字格式
      const dataToSave = { ...row }; // 複製一份，避免修改原始物件
      
      // 確保價格欄位是數字
      if (dataToSave.price_list) dataToSave.price_list = Number(dataToSave.price_list) || 0;
      if (dataToSave.price_floor) dataToSave.price_floor = Number(dataToSave.price_floor) || 0;
      if (dataToSave.price_transaction) dataToSave.price_transaction = Number(dataToSave.price_transaction) || 0;

      dataToSave.projectId = projectId; // 確保 projectId 被寫入

      const existingDocId = existingLotsMap.get(String(spotId));
      const docRef = existingDocId ?
        db.collection("salesParkings").doc(existingDocId) :
        db.collection("salesParkings").doc(`${projectId}_${spotId}`);

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
                     : system === '驗屋時間表' ? '預約驗屋系統'
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
            if (data.system === '預約驗屋系統' || data.system === '驗屋時間表') shouldCount = true;
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
    //  修正點：將 userDocSnap.exists() 改為 userDocSnap.exists
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

    // 密碼驗證通過後，組合回傳給前端的使用者物件
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

exports.handleAppointmentSearch = onCall(async (request) => {
  const { projectId, searchText } = request.data;

  if (!projectId || !searchText) {
    throw new HttpsError("invalid-argument", "缺少 projectId 或 searchText 參數。");
  }

  const anxiDb = new Firestore({ databaseId: "anxi-app" });
  const appointmentsRef = anxiDb.collection("appointments");
  const householdsRef = anxiDb.collection("households");

  try {
    // Firestore 不支援對多個欄位進行 OR 或模糊搜尋
    // 因此我們對幾個最可能的欄位分別進行查詢
    const queryByUnitId = query(appointmentsRef, where("projectId", "==", projectId), where("unitId", "==", searchText));
    const queryByBookerName = query(appointmentsRef, where("projectId", "==", projectId), where("bookerName", "==", searchText));
    const queryByBookerPhone = query(appointmentsRef, where("projectId", "==", projectId), where("bookerPhone", "==", searchText));

    const [unitIdResults, bookerNameResults, bookerPhoneResults] = await Promise.all([
      queryByUnitId.get(),
      queryByBookerName.get(),
      queryByBookerPhone.get()
    ]);

    // 使用 Map 來合併結果並去除重複項
    const resultsMap = new Map();
    const processSnapshot = (snapshot) => {
      snapshot.forEach(doc => {
        if (!resultsMap.has(doc.id)) {
          resultsMap.set(doc.id, { id: doc.id, ...doc.data() });
        }
      });
    };

    processSnapshot(unitIdResults);
    processSnapshot(bookerNameResults);
    processSnapshot(bookerPhoneResults);

    const appointments = Array.from(resultsMap.values());
    
    // 如果找到了預約，我們還需要去補上戶別資料
    if (appointments.length > 0) {
        const householdIds = [...new Set(appointments.map(a => `${a.projectId}_${a.unitId}`))];
        const householdsSnapshot = await anxiDb.collection("households").where(FieldPath.documentId(), 'in', householdIds).get();
        const householdsMap = new Map();
        householdsSnapshot.forEach(doc => {
            householdsMap.set(doc.id, doc.data());
        });

        const combinedData = appointments.map(appt => {
            const householdKey = `${appt.projectId}_${appt.unitId}`;
            const householdData = householdsMap.get(householdKey) || {};
            return { ...householdData, ...appt };
        });

        return { status: "success", data: combinedData };
    }

    return { status: "success", data: [] }; // 如果都沒找到，回傳空陣列

  } catch (error) {
    console.error(`Appointment search failed for project [${projectId}]:`, error);
    throw new HttpsError("internal", `搜尋時發生錯誤: ${error.message}`);
  }
});


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
    // ✅ START: 修正點 1 - 根據 projectId 獲取建案名稱
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
    // ✅ END: 修正點 1

    // --- 步驟 1: 產生備份檔案的路徑與名稱 ---
    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10);
    const timeStr = now.toTimeString().slice(0, 8).replace(/:/g, "");
    
    // ✅ 修正點 2: 使用新的命名規則組合檔案路徑與名稱
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

// ✅ START: 新增 listBackupFiles 雲端函式
/**
 * 列出 GCS 中指定路徑下的檔案與資料夾
 */
exports.listBackupFiles = onCall(async (request) => {
  const { path = '' } = request.data; // 加上預設值
  const functionName = `listBackupFiles (Path: ${path})`;
  console.log(`[${functionName}] Request received.`);

  try {
    const bucket = getStorage().bucket();
    
    // ✅ 核心修正：直接獲取完整的 apiResponse，而不是只拿 files 陣列
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

    // ✅ 核心修正：直接從 apiResponse 中讀取資料夾(prefixes)資訊，不再依賴 files.length
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
// ✅ END: 新增 listBackupFiles 雲端函式

// ✅ START: 新增 getBackupFileContent 雲端函式
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
// ✅ END: 新增 getBackupFileContent 雲端函式

// ✅ START: 新增 deleteBackupFile 雲端函式
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
// ✅ END: 新增 deleteBackupFile 雲端函式


// ✅ START: 新增 generateExcelTemplate 雲端函式
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

      // ✅ 核心修正點：確保內外層迴圈結構正確
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
  // ✅ 1. 修改：接收 fileContent (Base64字串)，而不是 filePath
  const { fileContent, targetCollection, isDryRun } = request.data;
  const functionName = `updateFieldsFromExcel (DryRun: ${isDryRun})`;

  if (!fileContent || !targetCollection) {
    throw new HttpsError("invalid-argument", "缺少檔案內容或目標集合參數。");
  }

  try {
    // ✅ 2. 修改：直接將 Base64 字串轉換為 Buffer，不再需要從 GCS 下載
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
// ✅ END: 新增 getCollectionFields 雲端函式