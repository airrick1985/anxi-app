// functions/index.js

const admin = require("firebase-admin");
const nodemailer = require("nodemailer");
const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { onDocumentCreated } = require("firebase-functions/v2/firestore");
const { Firestore } = require("@google-cloud/firestore");
const {google} = require("googleapis");


admin.initializeApp();

// 這個 db 實例會指向 (default) 資料庫，我們在函式內部會建立指向 anxi-app 的實例
const defaultDb = admin.firestore();

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
        // ✅ 1. 查詢 users 集合，找出所有 roles 陣列中包含 "超級管理員" 的使用者
        const usersRef = anxiDb.collection('users');
        const superAdminQuery = usersRef.where('roles', 'array-contains', '超級管理員');
        const superAdminSnapshot = await superAdminQuery.get();

        if (superAdminSnapshot.empty) {
            console.log("找不到任何擁有「超級管理員」角色的使用者，中止操作。");
            return;
        }
        
        // ✅ 2. 遍歷所有找到的超級管理員
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
        
        // ✅ 3. 等待所有超級管理員的權限都更新完成
        await Promise.all(permissionPromises);

        console.log(`✅ 成功為 ${superAdminSnapshot.size} 位超級管理員在新專案 [${projectName}] (${projectId}) 更新所有權限。`);

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
 * ✅ 【新增】 上傳戶別資料並更新 Firestore
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

      // ✅ --- 新增：處理銷控圖片欄位 ---
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
      // ✅ --- 處理結束 ---

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