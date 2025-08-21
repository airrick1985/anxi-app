// functions/index.js

const admin = require("firebase-admin");
const nodemailer = require("nodemailer");
const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { Firestore } = require("@google-cloud/firestore");

admin.initializeApp();

const db = new Firestore({
    databaseId: 'anxi-app'
});

// 定義函式需要從 Secret Manager 讀取的密鑰名稱
const gmailSecrets = [
    "SENDER_EMAIL",
    "GMAIL_APP_PASSWORD" 
];

exports.forgotPasswordSender = onCall({ secrets: gmailSecrets }, async (request) => {
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

        // 設定 Nodemailer 使用 Gmail 和應用程式密碼
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