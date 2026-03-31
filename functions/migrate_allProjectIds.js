/**
 * 資料遷移腳本：為所有 vipGuests 文件補充 allProjectIds 欄位
 * 
 * 執行前請先設定 GOOGLE_APPLICATION_CREDENTIALS 環境變數，或使用：
 *   $env:GCLOUD_PROJECT = "apps-script-api-443402"
 *   node migrate_allProjectIds.js
 */

const admin = require('firebase-admin');
const { Firestore } = require('@google-cloud/firestore');

// 初始化 Firebase Admin (若尚未初始化)
if (!admin.apps.length) {
  admin.initializeApp({ projectId: 'apps-script-api-443402' });
}

const db = new Firestore({ 
  projectId: 'apps-script-api-443402',
  databaseId: 'anxi-app' 
});

async function migrate() {
  console.log('🚀 開始遷移 vipGuests allProjectIds...');
  
  const batchSize = 500;
  let totalUpdated = 0;
  let totalSkipped = 0;
  let lastDoc = null;
  
  while (true) {
    let query = db.collection('vipGuests')
      .orderBy('__name__')
      .limit(batchSize);
    
    if (lastDoc) {
      query = query.startAfter(lastDoc);
    }
    
    const snapshot = await query.get();
    
    if (snapshot.empty) {
      break;
    }
    
    const batch = db.batch();
    let batchCount = 0;
    
    for (const doc of snapshot.docs) {
      const data = doc.data();
      
      // 如果已有 allProjectIds 且不為空，跳過
      if (data.allProjectIds && Array.isArray(data.allProjectIds) && data.allProjectIds.length > 0) {
        totalSkipped++;
        continue;
      }
      
      // 組合 allProjectIds
      const projectId = data.projectId;
      if (!projectId) {
        console.warn(`⚠️ 文件 ${doc.id} 缺少 projectId，跳過`);
        totalSkipped++;
        continue;
      }
      
      const linkedProjectIds = data.linkedProjectIds || [];
      const allProjectIds = [projectId, ...linkedProjectIds];
      
      batch.update(doc.ref, {
        allProjectIds: allProjectIds,
        // 如果沒有 linkedProjectIds，也補上空陣列
        linkedProjectIds: linkedProjectIds
      });
      
      batchCount++;
    }
    
    if (batchCount > 0) {
      await batch.commit();
      totalUpdated += batchCount;
      console.log(`✅ 已更新 ${totalUpdated} 筆 (本批: ${batchCount})`);
    }
    
    lastDoc = snapshot.docs[snapshot.docs.length - 1];
    
    // 如果這批不足 batchSize，代表已到最後一頁
    if (snapshot.docs.length < batchSize) {
      break;
    }
  }
  
  console.log(`\n🎉 遷移完成！共更新 ${totalUpdated} 筆，跳過 ${totalSkipped} 筆`);
}

migrate().catch(err => {
  console.error('❌ 遷移失敗:', err);
  process.exit(1);
});
