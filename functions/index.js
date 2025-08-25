// functions/index.js

const admin = require("firebase-admin");
const nodemailer = require("nodemailer");
const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { onDocumentCreated } = require("firebase-functions/v2/firestore");
const { Firestore } = require("@google-cloud/firestore");



admin.initializeApp();

// ✅ 修改點 2: 直接使用 admin.firestore()，它會自動讀取環境變數
const db = admin.firestore();


// 定義函式需要從 Secret Manager 讀取的密鑰名稱
const gmailSecrets = [
    "SENDER_EMAIL",
    "GMAIL_APP_PASSWORD" 
];

// (您原有的 forgotPasswordSender 函式，保持不變)
exports.forgotPasswordSender = onCall({ secrets: gmailSecrets }, async (request) => {
    // ✅ 修改點: 在函式內部建立指向 'anxi-app' 的 db 實例
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

const ALL_SYSTEM_PERMISSIONS = [
    '人員管理',
    '報價系統',
    '銷控系統',  
    '報價系統銷售選單',
    '客戶管理',
    '客變系統',
    '寄信-銷控',
    '寄信-驗屋',
    '收信-銷控',
    '收信-驗屋',
    '訂閱查詢',
    '驗屋時間表-修改',
    '驗屋時間表-檢視',
    '驗屋系統'
    //可新增
];

exports.grantSuperAdminPermissionsOnNewSubscription = onDocumentCreated(
    {
        document: "subscriptions/{subscriptionId}",
        database: 'anxi-app', // 指向 'anxi-app' 資料庫
        region: 'asia-east2'   // 建議指定一個靠近台灣的區域
    }, 
    async (event) => {    
    // ✅ 修改點: 在這個函式內部，建立一個全新的、獨立的 db 實例
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
        // ✅ 修改點: 所有資料庫操作都使用這個新的 anxiDb 實例
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
                    lastModifiedAt: Firestore.FieldValue.serverTimestamp() // 使用 Firestore 模組取得時間戳
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