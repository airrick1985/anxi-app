const { onSchedule } = require("firebase-functions/v2/scheduler");
const admin = require("firebase-admin");
const { getFirestore, FieldValue } = require("firebase-admin/firestore");
const axios = require("axios");

if (admin.apps.length === 0) {
    admin.initializeApp();
}
const db = getFirestore("anxi-app");

/**
 * [測試版] 預約提醒簡訊發送任務
 * 已加入白名單過濾，僅限測試號碼收訊
 */
module.exports = onSchedule({
    schedule: "every 30 mins",
    region: "asia-east1",
    secrets: ["EVERY8D_UID", "EVERY8D_PWD"],
    timeZone: "Asia/Taipei"
}, async (event) => {
    const functionName = "autoSmsReminderTrigger";
    const UID = process.env.EVERY8D_UID;
    const PWD = process.env.EVERY8D_PWD;

    // ✅ 1. 定義測試白名單 (非此清單中的號碼將不會發送)
    //const TEST_WHITELIST = ["0980371014"];

    try {
        const now = new Date();
        const currentH = parseInt(now.toLocaleTimeString('zh-TW', { hour: '2-digit', hour12: false, timeZone: 'Asia/Taipei' }));
        const currentM = parseInt(now.toLocaleTimeString('zh-TW', { minute: '2-digit', hour12: false, timeZone: 'Asia/Taipei' }));

        const projectsSnap = await db.collection("projects").get();

        for (const projectDoc of projectsSnap.docs) {
            const projectData = projectDoc.data();
            const config = projectData.smsReminder;

            if (!config?.enabled || !config?.template) continue;

            let startTime, endTime;
            const strategy = config.sendStrategy || "hours_before";

            if (strategy === "hours_before") {
                const targetHours = parseInt(config.sendBeforeHours || 24);
                startTime = new Date(now.getTime() + targetHours * 60 * 60 * 1000);
                endTime = new Date(startTime.getTime() + 40 * 60 * 1000);
            } 
            else if (strategy === "day_before") {
                const targetFixedTime = config.fixedTime || "19:00";
                const [targetH, targetM] = targetFixedTime.split(":").map(Number);
                const isTimeToSend = (currentH === targetH && currentM >= targetM && currentM < targetM + 30);
                if (!isTimeToSend) continue;

                const tomorrow = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Taipei' }));
                tomorrow.setDate(tomorrow.getDate() + 1);
                startTime = new Date(tomorrow.setHours(0, 0, 0, 0));
                endTime = new Date(tomorrow.setHours(23, 59, 59, 999));
            }

            const resSnap = await db.collection("viewing_reservations")
                .where("projectId", "==", projectDoc.id)
                .where("status", "==", "active")
                .where("reservationTime", ">=", startTime)
                .where("reservationTime", "<=", endTime)
                .get();

            if (resSnap.empty) continue;

            const recipientList = [];
            const docRefsToUpdate = [];
            const reportRefsToUpdate = [];

           for (const resDoc of resSnap.docs) {
                const data = resDoc.data();
                if (data.isSmsSent === true) continue;

                /* 🛠️ 測試白名單攔截邏輯：不需要測試時，請將下方 if 區塊註解掉 
                if (TEST_WHITELIST.length > 0 && !TEST_WHITELIST.includes(data.customerPhone)) {
                    console.log(`[白名單跳過] 號碼 ${data.customerPhone} 不在測試清單中`);
                    continue;
                }
                */

                const resTime = data.reservationTime.toDate();
                const timeStr = resTime.toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'Asia/Taipei' });
                const dateStr = resTime.toLocaleDateString('zh-TW', { year: 'numeric', month: '2-digit', day: '2-digit', timeZone: 'Asia/Taipei' });

                let msg = config.template
                    .replace(/{projectName}/g, projectData.name || projectDoc.id)
                    .replace(/{customerName}/g, data.customerName || "貴賓")
                    .replace(/{reservationTime}/g, `${dateStr} ${timeStr}`)
                    .replace(/{salesName}/g, data.salesName || "");

                // 儲存發送內容至報告集合 (優化功能：可在監控畫面看到發送原文)
                const reportRef = db.collection("sms_reports").doc();
                const reportId = reportRef.id;

                await reportRef.set({
                    reservationId: resDoc.id,
                    projectId: projectDoc.id,
                    projectName: projectData.name || projectDoc.id,
                    mobile: data.customerPhone,
                    name: data.customerName || "客戶",
                    sentContent: msg,       
                    status: "0",           
                    subject: `${projectData.name || projectDoc.id} 預約提醒`,
                    receivedAt: admin.firestore.FieldValue.serverTimestamp()
                });

                recipientList.push({
                    "Name": data.customerName || "客戶",
                    "Mobile": data.customerPhone,
                    "Email": "",
                    "SendTime": "",
                    "Param": msg,
                    "Mr": reportId 
                });

                docRefsToUpdate.push(resDoc.ref);
                reportRefsToUpdate.push(reportRef);
            }

            if (recipientList.length === 0) continue;

            const response = await axios.post("https://new.e8d.tw/API21/HTTP/SendParam.ashx", {
                UID, PWD,
                SB: `${projectData.name || '系統'} 預約提醒`,
                RecipientDataList: recipientList
            });

            if (response.data.Result === true) {
                const batch = db.batch();
                const msgParts = response.data.Msg.split(',');
                const batchId = msgParts[msgParts.length - 1];

                docRefsToUpdate.forEach(ref => {
                    batch.update(ref, { isSmsSent: true, smsSentAt: FieldValue.serverTimestamp() });
                });

                reportRefsToUpdate.forEach(ref => {
                    batch.update(ref, { batchId: batchId });
                });

                await batch.commit();
                console.log(`[成功] 已處理 ${recipientList.length} 筆測試白名單簡訊。`);
            } else {
                console.error(`[API 錯誤] ${response.data.Msg}`);
            }
        }
    } catch (error) {
        console.error(`[系統異常]`, error);
    }
});