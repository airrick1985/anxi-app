const { onCall, HttpsError } = require("firebase-functions/v2/https");
const admin = require("firebase-admin");
const { getFirestore } = require("firebase-admin/firestore");
const axios = require("axios");

// 初始化 Admin SDK
if (admin.apps.length === 0) {
    admin.initializeApp();
}

// 指定具名資料庫 anxi-app
const db = getFirestore("anxi-app");

module.exports = onCall({
    region: "asia-east1",
    cors: true,
    memory: "256MiB",
    timeoutSeconds: 60,
    secrets: ["EVERY8D_UID", "EVERY8D_PWD"]
}, async (request) => {
    const functionName = "smsApi";
    
    // 1. 統一解構所有可能用到的參數
    const { action, userKey, phoneNumber, message, subject, sendTime } = request.data;

    console.log(`[${functionName}] 觸發 - Action: ${action}, UserKey: ${userKey}`);

    // 2. 權限檢查
    if (!userKey) {
        throw new HttpsError("unauthenticated", "缺少使用者識別碼 (userKey)。");
    }

    try {
        const userDoc = await db.collection("users").doc(userKey).get();
        if (!userDoc.exists) {
            console.warn(`[${functionName}] 找不到 userKey: ${userKey}`);
            throw new HttpsError("permission-denied", "無效的使用者識別碼，請重新登入。");
        }

        const UID = process.env.EVERY8D_UID;
        const PWD = process.env.EVERY8D_PWD;

        // --- 分支 A：餘額查詢 ---
        if (action === "getBalance") {
            const params = new URLSearchParams({ UID, PWD });
            const response = await axios.post(
                "https://new.e8d.tw/API21/HTTP/GetCredit.ashx",
                params.toString(),
                {
                    headers: { "Content-Type": "application/x-www-form-urlencoded" },
                    timeout: 10000 
                }
            );

            const resData = response.data;
            if (typeof resData === "string" && resData.includes(",")) {
                const [status, msg] = resData.split(",");
                return { status: "error", code: status, message: msg };
            }
            return { status: "success", credit: parseFloat(resData) };
        }

        // --- 分支 B：發送簡訊 (包含立即與排程) ---
        else if (action === "sendSms") {
            if (!phoneNumber || !message) {
                throw new HttpsError("invalid-argument", "缺少手機號碼或簡訊內容。");
            }

            // 組裝 EVERY8D 規格要求的 JSON Body
            const smsPayload = {
                UID: UID,
                PWD: PWD,
                SB: subject || "系統通知",
                RecipientDataList: [
                    {
                        Name: "收件人",
                        Mobile: phoneNumber,
                        Param: message,
                        // 如果有傳入 sendTime 則使用，否則立即發送
                        SendTime: sendTime || "" 
                    }
                ]
            };

            const response = await axios.post(
                "https://new.e8d.tw/API21/HTTP/SendParam.ashx",
                smsPayload,
                { headers: { "Content-Type": "application/json" } }
            );

            const resData = response.data;
            
            if (resData.Result === true) {
                // 解析 Msg 回傳值: 剩餘點數,發送通數,扣除點數,無效通數,BATCH_ID
                const [credit, sended, cost, unsend, batchId] = resData.Msg.split(",");
                return { 
                    status: "success", 
                    credit: parseFloat(credit), 
                    batchId: batchId 
                };
            } else {
                return { status: "error", message: resData.Msg || "發送失敗" };
            }
        }

        // 3. 如果以上 if 都不符合，才拋出未知 Action
        throw new HttpsError("invalid-argument", "未知的 Action。");

    } catch (error) {
        console.error(`[${functionName}] 執行異常:`, error);
        if (error instanceof HttpsError) throw error;
        throw new HttpsError("internal", error.message);
    }
});