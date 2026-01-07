// functions/sms/smsCallback.js
const { onRequest } = require("firebase-functions/v2/https");
const admin = require("firebase-admin");
const { getFirestore } = require("firebase-admin/firestore");

// 初始化連線到具名資料庫 anxi-app
if (admin.apps.length === 0) {
    admin.initializeApp();
}
const db = getFirestore("anxi-app");

/**
 * [Every8D Webhook 回報接收]
 * 規格：HTTP GET
 */
module.exports = onRequest({ region: "asia-east1", cors: true }, async (req, res) => {
    const data = req.query; // Every8D 回傳參數
    const reportId = data.MR; // 我們之前帶入的自定義 ID

    if (!reportId) {
        return res.status(200).send("No MR Provided");
    }

    try {
        // 直接使用 MR (即文件 ID) 進行更新，不再使用 .add() 產生新文件
        const reportRef = db.collection("sms_reports").doc(reportId);
        
        await reportRef.update({
            status: data.STATUS || "",     // 更新最新狀態碼
            replyMsg: data.SM || "",      // 若 STATUS 為 999，存入回覆內容
            reportTime: data.RT || "",    // 更新回報時間
            charge: parseFloat(data.CHARGE || 0),
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });

        res.status(200).send("OK");
    } catch (error) {
        console.error("[smsCallback] 更新失敗:", error);
        res.status(500).send("Error");
    }
});