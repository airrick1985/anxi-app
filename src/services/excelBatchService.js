// src/services/excelBatchService.js
import * as XLSX from 'xlsx';
import { db } from '@/firebase';
import { 
  collection, getDocs, doc, writeBatch, Timestamp, query, where 
} from 'firebase/firestore';
import { v4 as uuidv4 } from 'uuid'; // 如果沒有 uuid 套件，請用簡易函式替代

// === 輔助函式 (Helper Functions) ===

// 1. Excel 日期轉換為 JS Date (處理 Excel 序號日期或字串日期)
const parseExcelDate = (excelDate) => {
  if (!excelDate) return null;
  // 如果是 Excel 序列號 (例如 45290)
  if (typeof excelDate === 'number') {
    return new Date(Math.round((excelDate - 25569) * 86400 * 1000));
  }
  // 如果是字串 (例如 "2025-12-16")
  if (typeof excelDate === 'string') {
    return new Date(excelDate);
  }
  return null;
};

// 2. 格式化日期為字串 YYYY-MM-DD
const formatDateStr = (dateObj) => {
  if (!dateObj) return '';
  // 處理 Firestore Timestamp
  const date = dateObj.toDate ? dateObj.toDate() : new Date(dateObj);
  return date.toISOString().split('T')[0];
};

// 3. 簡易 UUID 產生器 (若專案未安裝 uuid 套件)
const generateUUID = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

// === 匯出邏輯 (Export Logic) ===

export const exportCustomersToExcel = async (projectId) => {
  try {
    // 1. 讀取專案下所有客戶
    const q = query(collection(db, 'users'), where('projectId', '==', projectId));
    const querySnapshot = await getDocs(q);
    
    const profilesData = [];
    const logsData = [];

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      const phone = data.phone || doc.id; // 以電話為主鍵

      // A. 處理 Profile (Sheet 1)
      // 注意：根據你的資料結構，profile 內多數欄位是 array，需取 [0]
      const profile = data.profile || {};
      
      profilesData.push({
        'Phone (Key)': phone,
        'Name': data.latestName || (profile['姓名'] ? profile['姓名'][0] : ''),
        'Sales': data.latestSalesName || '',
        'Rating': profile.rating || '', // 假設 rating 在 profile 根目錄或外層
        'City': profile['居住城市'] ? profile['居住城市'][0] : '',
        'District': profile['居住鄉鎮市區'] ? profile['居住鄉鎮市區'][0] : '',
        'Budget': profile['購屋預算'] ? profile['購屋預算'][0] : '',
        'Job': profile['職業'] ? profile['職業'][0] : '',
        'Company': profile['任職公司'] ? profile['任職公司'][0] : '',
        'UpdatedAt': data.updatedAt ? formatDateStr(data.updatedAt) : ''
      });

      // B. 處理 Interaction Logs (Sheet 2)
      if (data.interactionLogs && Array.isArray(data.interactionLogs)) {
        data.interactionLogs.forEach(log => {
          // 處理 Tags (Array -> String)
          const keyTags = log.tags?.keyTags?.join(',') || '';
          const rejectReason = log.tags?.noPurchaseReason?.join(',') || '';

          logsData.push({
            'CustomerPhone (Key)': phone,
            'LogId': log.logId || generateUUID(), // 確保有 ID
            'Date': log.date || '',
            'StartTime': log.startTime || '',
            'EndTime': log.endTime || '',
            'Type': log.interactionType || '',
            'Content': log.content || '',
            'Rating': log.rating || '',
            'Recorder': log.recorderName || '',
            'Tags': keyTags,
            'RejectReason': rejectReason
          });
        });
      }
    });

    // 2. 建立 Workbook
    const wb = XLSX.utils.book_new();
    
    // Sheet 1
    const wsProfile = XLSX.utils.json_to_sheet(profilesData);
    XLSX.utils.book_append_sheet(wb, wsProfile, "CustomerProfiles");

    // Sheet 2
    const wsLogs = XLSX.utils.json_to_sheet(logsData);
    XLSX.utils.book_append_sheet(wb, wsLogs, "InteractionLogs");

    // 3. 寫入檔案
    const fileName = `Customer_Export_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(wb, fileName);

    return { success: true, count: profilesData.length };

  } catch (error) {
    console.error("Export Error:", error);
    throw error;
  }
};

// === 匯入邏輯 (Import Logic) ===

export const importCustomersFromExcel = async (file, currentProjectId, currentUser) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = async (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });

        // 1. 檢查 Sheet 是否存在
        if (!workbook.SheetNames.includes("CustomerProfiles")) {
          throw new Error("找不到 'CustomerProfiles' 工作表，請確認範本格式。");
        }

        // 2. 解析資料
        const profilesRaw = XLSX.utils.sheet_to_json(workbook.Sheets["CustomerProfiles"]);
        // 若有 Logs Sheet 才解析
        let logsRaw = [];
        if (workbook.SheetNames.includes("InteractionLogs")) {
          logsRaw = XLSX.utils.sheet_to_json(workbook.Sheets["InteractionLogs"]);
        }

        // 3. 依照電話將 Logs 分組 (Group Logs by Phone)
        const logsMap = {};
        logsRaw.forEach(row => {
          const p = row['CustomerPhone (Key)'];
          if (p) {
            // 強制轉為字串比較，避免 Excel 將電話讀成數字
            const phoneStr = String(p); 
            if (!logsMap[phoneStr]) logsMap[phoneStr] = [];
            logsMap[phoneStr].push(row);
          }
        });

        // 4. 開始批次寫入 (Batch Write)
        // Firestore Batch 限制 500 筆，這裡做簡易分批處理
        const batchSize = 450; 
        let updatedCount = 0;
        let createdCount = 0;
        
        // 將資料分塊
        for (let i = 0; i < profilesRaw.length; i += batchSize) {
          const chunk = profilesRaw.slice(i, i + batchSize);
          const batch = writeBatch(db);

          for (const row of chunk) {
            const phone = String(row['Phone (Key)']);
            if (!phone) continue;

            const userRef = doc(db, 'users', phone); // 假設 Phone 是 ID，或者你需要用 Query 找 ID

            // 準備 Profile 更新資料
            // 這裡必須配合你的資料結構，將扁平資料轉回巢狀
            const updateData = {
              phone: phone,
              projectId: currentProjectId, // 強制鎖定當前專案
              latestName: row['Name'] || '',
              latestSalesName: row['Sales'] || '',
              updatedAt: Timestamp.now(),
              profile: {
                '姓名': [row['Name'] || ''], // 轉回 Array
                '居住城市': row['City'] ? [row['City']] : [],
                '居住鄉鎮市區': row['District'] ? [row['District']] : [],
                '購屋預算': row['Budget'] ? [row['Budget']] : [],
                '職業': row['Job'] ? [row['Job']] : [],
                '任職公司': row['Company'] ? [row['Company']] : [],
                // 若 Excel 有 Status 欄位對應 Rating
                'rating': row['Status'] || row['Rating'] || ''
              }
            };

            // 準備 Logs 資料 (合併邏輯)
            // 技術決策：這裡我們無法輕易讀取「舊資料」再合併(因為會太慢)，
            // 為了效能，我們假設 Excel 的 Logs 就是「要新增/更新」的集合。
            // 但為了避免覆蓋掉「不在 Excel 內的舊 Log」，理想做法是 Transaction，但批次匯入做不到。
            // *折衷方案*：使用 arrayUnion? 不行，因為要更新。
            // *最終方案*：在此實作中，我們將直接讀取 Excel 中的 Logs 並轉為 Object Array，
            // 若要保留舊資料，通常建議「不匯入 Logs」或「下載完整版修改後再上傳」。
            
            // 這裡實作：讀取該 User 所有的 Excel Logs -> 轉為 Firestore 格式
            const userLogsExcel = logsMap[phone] || [];
            if (userLogsExcel.length > 0) {
              const formattedLogs = userLogsExcel.map(l => {
                return {
                  logId: l['LogId'] || generateUUID(),
                  date: l['Date'] ? formatDateStr(parseExcelDate(l['Date'])) : '',
                  startTime: l['StartTime'] || '',
                  endTime: l['EndTime'] || '',
                  interactionType: l['Type'] || '',
                  content: l['Content'] || '',
                  rating: l['Rating'] || '',
                  recorderName: l['Recorder'] || currentUser || '系統匯入',
                  tags: {
                    keyTags: l['Tags'] ? String(l['Tags']).split(',') : [],
                    noPurchaseReason: l['RejectReason'] ? String(l['RejectReason']).split(',') : []
                  },
                  createdAt: Timestamp.now() // 標記匯入時間
                };
              });

              // !!! 危險操作：直接覆蓋 interactionLogs 欄位 !!!
              // 這是根據需求 "Excel 覆蓋資料庫"
              updateData.interactionLogs = formattedLogs;
            }

            // 使用 set + merge: true
            // 若文件存在則更新，不存在則建立
            batch.set(userRef, updateData, { merge: true });
            updatedCount++;
          }

          await batch.commit();
        }

        resolve({ success: true, count: updatedCount });

      } catch (error) {
        console.error("Import Error:", error);
        reject(error);
      }
    };

    reader.onerror = (err) => reject(err);
    reader.readAsArrayBuffer(file);
  });
};