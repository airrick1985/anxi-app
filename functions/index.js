// functions/index.js

const admin = require("firebase-admin");
const nodemailer = require("nodemailer");

// ✅ 1. 從 v2/https 引入 onCall 和 HttpsError，這是新版 SDK 的語法
const { onCall, HttpsError } = require("firebase-functions/v2/https");

admin.initializeApp();
const db = admin.firestore();

// 定義您在 Secret Manager 中建立的密鑰名稱 (這部分不變)
const gmailSecrets = [
    "GMAIL_CLIENT_ID",
    "GMAIL_CLIENT_SECRET",
    "GMAIL_REFRESH_TOKEN",
    "SENDER_EMAIL"
];

// ✅ 2. 使用新的 v2 語法來定義函式和綁定密鑰
// 將 { secrets: ... } 作為第一個參數傳入 onCall
exports.forgotPasswordSender = onCall({ secrets: gmailSecrets }, async (request) => {
    
    // ✅ 3. 在 v2 函式中，前端傳來的資料在 request.data 中
    const userPhone = request.data.key;
    if (!userPhone) {
        // 在 v2 中，我們用拋出 HttpsError 的方式回傳錯誤給前端
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

        // 使用 process.env 的方式讀取密鑰 (這部分不變)
        let transporter = nodemailer.createTransport({
            host: 'smtp.gmail.com',
            port: 465,
            secure: true,
            auth: {
                type: 'OAuth2',
                user: process.env.SENDER_EMAIL,
                clientId: process.env.GMAIL_CLIENT_ID,
                clientSecret: process.env.GMAIL_CLIENT_SECRET,
                refreshToken: process.env.GMAIL_REFRESH_TOKEN
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
        // 在 v2 函式中，直接 return 物件即可
        return { status: 'success', message: '密碼已寄到您的Email，請查收' };

    } catch (error) {
        console.error('forgotPasswordSender 函式錯誤:', error);
        // 如果錯誤本身就是 HttpsError，直接重新拋出
        if (error instanceof HttpsError) {
            throw error;
        }
        // 對於其他未知錯誤，包裝成 internal 錯誤
        throw new HttpsError('internal', '處理請求時發生未知的錯誤');
    }
});