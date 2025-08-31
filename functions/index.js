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
// / 自動為超級管理員授權
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
    const SUPER_ADMIN_PHONE = '60763998';
    if (!projectName) {
        console.log('新的訂閱紀錄缺少 projectName，中止操作。');
        return;
    }
    try {
        const userDoc = await anxiDb.collection('users').doc(SUPER_ADMIN_PHONE).get();
        if (!userDoc.exists) {
            console.error(`超級管理員 ${SUPER_ADMIN_PHONE} 不存在於 users 集合中。`);
            return;
        }
        const adminUserName = userDoc.data().name || 'Super Admin';
        const batch = anxiDb.batch();
        const permissionsRef = anxiDb.collection('permissions');
        for (const system of ALL_SYSTEM_PERMISSIONS) {
            const querySnapshot = await permissionsRef
                .where('userPhone', '==', SUPER_ADMIN_PHONE)
                .where('projectName', '==', projectName)
                .where('system', '==', system)
                .limit(1)
                .get();
            if (querySnapshot.empty) {
                const newPermRef = permissionsRef.doc();
                batch.set(newPermRef, {
                    userPhone: SUPER_ADMIN_PHONE,
                    userName: adminUserName,
                    projectName: projectName,
                    projectId: projectId || '',
                    system: system,
                    access: true,
                    lastModifiedBy: 'System Automation',
                    lastModifiedAt: Firestore.FieldValue.serverTimestamp()
                });
            } else {
                const existingDocRef = querySnapshot.docs[0].ref;
                batch.update(existingDocRef, { access: true });
            }
        }
        await batch.commit();
        console.log(`成功為超級管理員 [${SUPER_ADMIN_PHONE}] 在建案 [${projectName}] 開啟所有權限。`);
    } catch (error) {
        console.error('為超級管理員授權時發生錯誤:', error);
    }
});

// ✅ =================================================================
// /  ✅ BookingPage.vue 公開預約系統 API
// ✅ =================================================================

/**
 * ✅ 獲取建案的公開設定 (取代 Vue 檔中的 projectConfigurations 物件)
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
 * ✅ 獲取所有可預約的戶別資料，並按棟別分組
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
 * ✅ 驗證戶別與身分證號碼是否相符
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
 * ✅ 檢查指定戶別是否有有效預約
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
 * ✅ [核心] 獲取可預約的日期與時段 (取代 GAS 的 get_booking_slots)
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
 * ✅ 獲取預約頁面初始化所需的資料 (棟別列表、預約設定)
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

  // 使用 anxi-app 資料庫
  const db = new Firestore({databaseId: "anxi-app"});
  const functionName = `updateParkingSlide (Project: ${projectId})`;

  try {
    // --- 步驟 1: 從 Firestore 讀取專案設定，取得 Slide ID ---
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

    // --- 步驟 2: 從 Firestore 讀取所有車位資料 ---
    console.log(`[${functionName}] 步驟 2/3: 正在讀取車位資料...`);
    const parkingSnapshot = await db.collection("salesParkings")
        .where("projectId", "==", projectId).get();
    if (parkingSnapshot.empty) {
      console.warn(`[${functionName}] 警告：在 salesParkings 集合中找不到任何屬於 ${projectId} 的車位。`);
    }

    const parkingDataMap = new Map();
    parkingSnapshot.forEach((doc) => {
      const data = doc.data();
      if (data.slidePosition) {
        parkingDataMap.set(data.slidePosition, data);
      }
    });

    // --- 步驟 3: 使用 Google Slides API 更新簡報 ---
    console.log(`[${functionName}] 步驟 3/3: 正在更新 Google Slide (ID: ${presentationId})...`);

 // 初始化 Google API 客戶端
    const auth = new google.auth.GoogleAuth({
      scopes: ["https://www.googleapis.com/auth/presentations"],
    });
    const authClient = await auth.getClient();
    const slides = google.slides({version: "v1", auth: authClient});

    // 獲取簡報中的所有頁面元素
    const presentation = await slides.presentations.get({
      presentationId: presentationId,
      fields: "slides(pageElements(objectId,shape(text)))",
    });

    const requests = []; // 準備批次更新請求
    let shapeCounter = 0;

    presentation.data.slides.forEach((slide, slideIndex) => {
      slide.pageElements?.forEach((element, shapeIndex) => {
        // GAS 的 shapeIndex 是從 1 開始且連續的，但 API 的 objectId 是唯一的字串
        // 為了相容您舊的 slidePosition, 我們繼續用索引來模擬
        shapeCounter++;
        const identifier = `Slide${slideIndex + 1}-Shape${shapeCounter}`;
        const data = parkingDataMap.get(identifier);
        const objectId = element.objectId;

        let newText = "";
        let fillColor = {opaqueColor: {rgbColor: {red: 1, green: 1, blue: 1}}}; // 預設白色
        let isTransparent = true;

        if (data) {
          if (slideType === "quote") {
            // --- 報價模式邏輯 ---
            if (!data.status_backend) { // 可售
              newText = String(data.price_list || "");
              isTransparent = true;
            } else { // 已售/保留
              newText = `${data.spotId || ""}\n${data.status || ""}`;
              fillColor = {opaqueColor: {rgbColor: {red: 1, green: 1, blue: 0}}}; // 黃色
              isTransparent = false;
            }
          } else {
            // --- 銷控模式邏輯 ---
            if (!data.status_backend) { // 可售
              newText = String(data.price_list || "");
              isTransparent = true;
            } else { // 已售/保留
              newText = `${data.spotId || ""}\n${data.price_list || ""}\n${data.buyerUnitId || ""}\n${data.buyerName || ""}\n${data.salesperson || ""}`;
              
              if (String(data.buyerName).includes("保留")) {
                fillColor = {opaqueColor: {rgbColor: {red: 0.643, green: 0.761, blue: 0.957}}}; // 藍色 #a4c2f4
              } else if (String(data.buyerName).includes("現場銷控")) {
                fillColor = {opaqueColor: {rgbColor: {red: 0.8, green: 0.753, blue: 0.851}}}; // 紫色 #ccc0d9
              } else {
                fillColor = {opaqueColor: {rgbColor: {red: 1, green: 1, blue: 0}}}; // 黃色
              }
              isTransparent = false;
            }
          }
        }

        // 產生刪除舊文字的請求
        requests.push({
          deleteText: {objectId: objectId, textRange: {type: "ALL"}},
        });

        // 產生插入新文字的請求
        if (newText) {
          requests.push({
            insertText: {objectId: objectId, text: newText, insertionIndex: 0},
          });
        }

        // 產生更新背景顏色的請求
        requests.push({
          updateShapeProperties: {
            objectId: objectId,
            shapeProperties: {
              shapeBackgroundFill: {
                solidFill: isTransparent ? null : fillColor,
              },
            },
            fields: "shapeBackgroundFill.solidFill",
          },
        });
      });
      shapeCounter = 0; // 每個 slide 重新計數
    });

    // 如果有需要更新的內容，才執行批次更新
    if (requests.length > 0) {
      await slides.presentations.batchUpdate({
        presentationId: presentationId,
        requestBody: {requests: requests},
      });
    }

    console.log(`[${functionName}] Google Slide 更新成功！`);
    return {status: "success", slideId: presentationId};

  } catch (error) {
    console.error(`[${functionName}] 發生錯誤:`, error);
    if (error instanceof HttpsError) {
      throw error;
    } else {
      throw new HttpsError("internal", `更新停車位銷控圖時發生錯誤: ${error.message}`);
    }
  }
});