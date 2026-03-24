# 驗屋報告 PDF 模板自訂化 - 實作計畫

## 📋 需求摘要

讓使用者在後台（BookingRuleManager）自訂驗屋報告 PDF 的各區段文案與格式，包含封面標題、內文區段等，同時確保向下相容——未設定自訂模板時使用系統預設值。

---

## 🏗️ 現有架構分析

### 目前 PDF 產製流程

1. **前端** `InspectionConsole.vue` → 呼叫 `generateInspectionPdf` API
2. **後端** `functions/index.js` → `generatePdfInBackground()` (PDFKit V5.0)
   - 從 Firestore 查詢 `inspectionConfirmations` + `inspectionRecords` + `projects`
   - 使用 PDFKit 在後端直接硬編碼所有文案
   - 上傳至 Google Drive，寄送 Email 通知

### 目前硬編碼的區段（在 `generatePdfInBackground` 函式中）

| 行號 | 區段 | 目前硬編碼內容 |
|------|------|----------------|
| 11144 | 封面標題 | `${projectData.name} 驗屋報告` |
| 11148-11151 | 封面資訊 | `戶別：`, `產權人：`, `電話：`, `Email：` |
| 11161 | 確認聲明 | `☑️ 本人確認已詳閱本次驗屋紀錄...` |
| 11164 | 簽名標題 | `產權人簽名：` |
| 11178 | 報告產製日期 | `報告產製日期：YYYY/MM/DD` |
| 11191-11194 | 紀錄表格標籤 | `建案`, `戶別`, `日期`, `階段`, `區域`, `人員` 等 |
| 11317-11324 | Email 通知內文 | 報告已完成通知 |

---

## 📐 資料結構設計

### Firestore: `projects/{projectId}` 新增欄位

```javascript
// projects/{projectId}.settings (或直接在 project doc 上)
{
  inspectionPdfTemplate: {
    // --- 封面設定 ---
    cover: {
      title: '{建案名稱} 驗屋報告',           // 大標題 (支援變數)
      showProjectInfo: true,                    // 是否顯示建案資訊
      infoFields: [                             // 封面顯示欄位 (有序陣列)
        { label: '戶別', variable: '{戶別}', enabled: true },
        { label: '產權人', variable: '{產權人姓名}', enabled: true },
        { label: '電話', variable: '{產權人電話}', enabled: true },
        { label: 'Email', variable: '{產權人EMAIL}', enabled: true },
        { label: '驗屋日期', variable: '{驗屋日期}', enabled: true },
      ],
      disclaimer: '☑️ 本人確認已詳閱本次驗屋紀錄，並同意於後續檢驗時，以本報告作為判斷依據。',
      signatureLabel: '產權人簽名：',
      showSignature: true,
      showDate: true,
      dateLabel: '報告產製日期：',
    },

    // --- 內頁設定 ---
    detail: {
      headerNote: '',            // 每頁頂部額外備註文字 (可空)
      footerNote: '',            // 每頁底部備註文字 (可空, 例如公司資訊)
      showInspectorName: true,   // 是否顯示驗屋人員
      showPhotos: true,          // 是否顯示照片
      maxPhotosPerRecord: 4,     // 每筆紀錄最多顯示照片數
    },

    // --- Email 通知設定 ---
    email: {
      subject: '【{建案名稱}】您的驗屋報告已產製完成 ({戶別})',
      bodyHtml: '<p>親愛的 {產權人姓名} 您好：</p><p>關於「{建案名稱}」建案 {戶別} 戶別，驗屋報告已產製完成。</p>',
      showDriveButton: true,
      buttonText: '查看驗屋報告',
      footerText: '此為系統自動發送的郵件，請勿直接回覆。',
    }
  }
}
```

### 支援的變數（佔位符）

| 變數 | 說明 | 來源 |
|------|------|------|
| `{建案名稱}` | 建案名稱 | projectData.name |
| `{戶別}` | 戶別編號 | unitId |
| `{產權人姓名}` | 買方姓名 | confirmationData.buyerInfo.name |
| `{產權人電話}` | 買方電話 | confirmationData.buyerInfo.phone |
| `{產權人EMAIL}` | 買方 Email | confirmationData.buyerInfo.email |
| `{驗屋日期}` | 驗屋日期 | records[0].inspectionDate |
| `{紀錄筆數}` | 紀錄數量 | records.length |
| `{確認日期}` | 確認日期 | confirmationData.confirmedAt |
| `{產製日期}` | 報告產製日期 | 當前日期 |
| `{驗屋人員}` | 驗屋人員名稱 | inspectorName |

---

## 📦 實作拆解 (分階段)

### 階段一：後台設定 UI（前端 BookingRuleManager.vue）
>
> ⏱ 預估工時：中

1. 在 `BookingRuleManager.vue` 新增一個 Tab / 區塊「驗屋報告模板設定」
2. 提供以下編輯區域：
   - **封面標題**：文字框 + 變數快速插入按鈕
   - **封面資訊欄位**：可排序、可啟停的欄位清單
   - **聲明文字**：RichTextEditor 或 textarea
   - **簽名設定**：開關 + 標題文字
   - **內頁設定**：開關控項 (備註文字、照片數量限制等)
   - **Email 模板**：主旨 + 內文 + 預覽（已有類似模式可複用）
3. 在 `projectSettings` 預設值和 `loadSettings` 中加入 `inspectionPdfTemplate` 的向下相容邏輯
4. 預覽功能：提供一個「預覽封面」按鈕，展示模板代入測試資料後的效果

### 階段二：後端讀取模板（Cloud Function）
>
> ⏱ 預估工時：小

1. 在 `generatePdfInBackground` 中，讀取 `projectData.inspectionPdfTemplate`
2. 若不存在，使用 `DEFAULT_PDF_TEMPLATE` 常數 (即目前硬編碼的內容)
3. 建立 `replaceVariables(template, data)` 工具函式

### 階段三：後端 PDF 產製邏輯重構
>
> ⏱ 預估工時：中

1. 將封面繪製邏輯抽取為 `drawCoverPage(doc, template, data)` 函式
2. 將紀錄內頁邏輯抽取為 `drawRecordPage(doc, template, record, data)` 函式
3. 根據模板設定動態決定欄位顯示、文字內容、照片數量等
4. Email 通知內容也改由模板驅動

### 階段四：向下相容確保
>
> ⏱ 預估工時：小

1. `DEFAULT_PDF_TEMPLATE` 常數包含所有目前的硬編碼值
2. 深度合併 (deep merge)：使用者部分設定 + 預設值填補缺漏
3. 不影響既有建案的 PDF 產製流程

---

## ⚠️ 注意事項

- **後端變更**：Cloud Function `generatePdfInBackground` 修改後需部署
  - `firebase deploy --only "functions:generateInspectionPdf"`
- **Firestore 規範**：所有 Firestore 操作使用 `new Firestore({ databaseId: 'anxi-app' })`
- **繁體中文**：所有 UI 和文件均使用繁體中文

---

## ✅ 驗收標準

1. 後台可以編輯封面標題、資訊欄位、聲明文字等
2. 設定後產製的 PDF 正確反映自訂內容
3. 未設定模板的建案產製 PDF 結果與目前完全相同
4. 變數佔位符正確替換
5. Email 通知內容可自訂
