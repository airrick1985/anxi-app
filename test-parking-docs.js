/**
 * 測試車位文檔 ID 修復結果
 * 驗證車位資料是否正確寫入到 {projectId}_{spotId} 格式的文檔
 */

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, query, where } from 'firebase/firestore';

// Firebase 配置
const firebaseConfig = {
  apiKey: "AIzaSyBOZLYQ4ZSPVdJYH0ZNP2YYTaVLJXUbCJE",
  authDomain: "apps-script-api-443402.firebaseapp.com",
  databaseURL: "https://apps-script-api-443402-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "apps-script-api-443402",
  storageBucket: "apps-script-api-443402.firebasestorage.app",
  messagingSenderId: "775917067825",
  appId: "1:775917067825:web:9b2ff12f5c43f2dc8c1bc9"
};

async function checkParkingDocuments() {
  try {
    // 初始化 Firebase
    const app = initializeApp(firebaseConfig);
    const db = getFirestore(app, 'anxi-app');

    console.log('🚗 檢查 salesParkings 集合中的文檔 ID 格式...\n');
    
    // 查詢 fuyu1750 項目的車位資料
    const q = query(collection(db, 'salesParkings'), where('projectId', '==', 'fuyu1750'));
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      console.log('❌ salesParkings 集合中沒有 fuyu1750 項目的車位資料');
      return;
    }

    console.log(`✅ 找到 ${querySnapshot.size} 筆 fuyu1750 項目的車位資料`);
    console.log('\n' + '='.repeat(80));
    
    const correctFormat = [];
    const incorrectFormat = [];
    
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      const docId = doc.id;
      
      console.log(`\n📄 文檔 ID: ${docId}`);
      console.log(`   Project ID: ${data.projectId || '未設定'}`);
      console.log(`   Spot ID: ${data.spotId || '未設定'}`);
      console.log(`   Buyer Unit: ${data.buyerUnitId || '未設定'}`);
      console.log(`   Status: ${data.status || '未設定'}`);
      console.log(`   Updated: ${data.updatedAt ? data.updatedAt.toDate?.() || data.updatedAt : '未設定'}`);
      
      // 檢查文檔 ID 格式
      const expectedId = `${data.projectId}_${data.spotId}`;
      if (docId === expectedId) {
        console.log(`   ✅ 文檔 ID 格式正確: ${docId}`);
        correctFormat.push(docId);
      } else {
        console.log(`   ❌ 文檔 ID 格式錯誤:`);
        console.log(`      實際: ${docId}`);
        console.log(`      預期: ${expectedId}`);
        incorrectFormat.push({ actual: docId, expected: expectedId });
      }
    });

    console.log('\n' + '='.repeat(80));
    console.log('\n📊 檢查結果總結:');
    console.log(`   ✅ 正確格式: ${correctFormat.length} 筆`);
    console.log(`   ❌ 錯誤格式: ${incorrectFormat.length} 筆`);
    
    if (correctFormat.length > 0) {
      console.log('\n✅ 正確格式的文檔:');
      correctFormat.forEach(id => console.log(`   - ${id}`));
    }
    
    if (incorrectFormat.length > 0) {
      console.log('\n❌ 需要修正的文檔:');
      incorrectFormat.forEach(item => {
        console.log(`   - ${item.actual} → 應該是 ${item.expected}`);
      });
    }

  } catch (error) {
    console.error('❌ 錯誤:', error);
  }
}

// 執行檢查
checkParkingDocuments();