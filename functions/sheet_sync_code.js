
// =================================================================
// 3. [Feature] Google Sheet Sync (Rebuild)
// =================================================================

/**
 * [Helper] 取得 Google Sheets API Client (Host Service Account)
 */
async function _getGoogleSheetClient() {
    const auth = new google.auth.GoogleAuth({
        scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });
    const authClient = await auth.getClient();
    return google.sheets({ version: 'v4', auth: authClient });
}

/**
 * [API] 列出 Google Sheet 的所有工作表名稱
 * @param {object} data - { spreadsheetInput } (ID or URL)
 */
exports.listGoogleSheets = onCall({
    region: "asia-east1",
    cors: true,
    memory: "256MiB",
    timeoutSeconds: 30,
}, async (request) => {
    const { spreadsheetInput } = request.data;
    if (!spreadsheetInput) {
        throw new HttpsError('invalid-argument', '缺少 spreadsheetInput');
    }

    // Extract ID from URL if needed
    let spreadsheetId = spreadsheetInput;
    const match = spreadsheetInput.match(/\/d\/([a-zA-Z0-9-_]+)/);
    if (match) {
        spreadsheetId = match[1];
    }

    try {
        const sheets = await _getGoogleSheetClient();
        const response = await sheets.spreadsheets.get({
            spreadsheetId,
        });

        const sheetNames = response.data.sheets.map(s => s.properties.title);

        // Get Service Account Email for instruction
        const auth = new google.auth.GoogleAuth();
        const credentials = await auth.getCredentials();
        const agentEmail = credentials.client_email;

        return { status: 'success', sheetNames, agentEmail };
    } catch (error) {
        console.error('[listGoogleSheets] Error:', error);
        throw new HttpsError('internal', `無法讀取 Sheet: ${error.message}`);
    }
});

/**
 * [API] 初次全量同步：將某個 Project 的所有 Households 寫入 Sheet
 * @param {object} data - { projectId, spreadsheetId, sheetName }
 */
exports.syncHouseholdsToSheet = onCall({
    region: "asia-east1",
    cors: true,
    memory: "512MiB",
    timeoutSeconds: 540, // Long timeout for batch
}, async (request) => {
    const { projectId, spreadsheetId, sheetName } = request.data;
    const functionName = "syncHouseholdsToSheet";

    if (!projectId || !spreadsheetId || !sheetName) {
        throw new HttpsError('invalid-argument', '缺少必要參數 (projectId, spreadsheetId, sheetName)');
    }

    const db = admin.firestore();

    try {
        console.log(`[${functionName}] 開始同步: Project=${projectId} -> Sheet=${spreadsheetId} (${sheetName})`);

        // 1. Fetch all households
        const snapshot = await db.collection('households')
            .where('projectId', '==', projectId)
            .get(); // Note: Consider limits if > 1000 docs

        if (snapshot.empty) {
            return { status: 'success', message: '該專案尚無戶別資料' };
        }

        const households = [];
        snapshot.forEach(doc => {
            households.push({ _docId: doc.id, ...doc.data() });
        });

        // 2. Flatten Data
        const rows = households.map(h => _flattenHouseholdForSheet(h));

        // 3. Prepare Headers (Dynamic based on fieldDisplayNames + extras)
        // 我們需要確保所有可能的 keys 都被捕捉到，或者使用預定義的 header 順序
        // 這裡使用 fieldDisplayNames 作為基準，並加入 rows 中出現的其他 keys

        // 定義固定必要的欄位順序
        let headers = ['_id', 'updatedAt'];
        // 加入 fieldDisplayNames 定義的欄位 (顯示中文)
        const displayKeys = Object.keys(fieldDisplayNames);
        headers = headers.concat(displayKeys.filter(k => k !== '_id' && k !== 'updatedAt'));

        // 找出 rows 中有但 headers 沒定義的 keys (動態欄位)
        const allRowKeys = new Set();
        rows.forEach(r => Object.keys(r).forEach(k => allRowKeys.add(k)));

        const extraKeys = Array.from(allRowKeys).filter(k => !headers.includes(k));
        headers = headers.concat(extraKeys);

        // 建立 Header Row (中文名稱)
        const headerRow = headers.map(key => {
            if (key === '_id') return 'System ID (勿動)';
            if (key === 'updatedAt') return '更新時間';
            return fieldDisplayNames[key] || key;
        });

        // 4. Transform Rows to Array relative to Headers
        const values = [headerRow];
        rows.forEach(row => {
            const rowData = headers.map(key => {
                let val = row[key];
                if (val === undefined || val === null) return '';
                // Convert Arrays/Objects to string
                if (typeof val === 'object') return JSON.stringify(val);
                return String(val);
            });
            values.push(rowData);
        });

        // 5. Write to Sheet (Clear & Write)
        const sheets = await _getGoogleSheetClient();

        // Clear existing content
        await sheets.spreadsheets.values.clear({
            spreadsheetId,
            range: `'${sheetName}'!A:ZZ`, // 清除大範圍
        });

        // Write new content
        await sheets.spreadsheets.values.update({
            spreadsheetId,
            range: `'${sheetName}'!A1`,
            valueInputOption: 'USER_ENTERED',
            resource: { values },
        });

        console.log(`[${functionName}] 同步完成，共 ${rows.length} 筆`);
        return { status: 'success', message: `成功同步 ${rows.length} 筆資料`, count: rows.length };

    } catch (error) {
        console.error(`[${functionName}] 失敗:`, error);
        throw new HttpsError('internal', `同步失敗: ${error.message}`);
    }
});

/**
 * [Trigger] 當戶別資料異動時，即時同步到 Sheet
 */
exports.onHouseholdWrite = onDocumentWritten("households/{householdId}", async (event) => {
    const functionName = "onHouseholdWrite";
    const householdId = event.params.householdId;

    // 1. 判斷資料存在性 (是刪除還是新增/修改)
    const newData = event.data?.after?.data();
    const oldData = event.data?.before?.data();

    // 如果是刪除，newData 為 undefined；如果是新增，oldData 為 undefined
    // 我們需要 projectId 來查找設定。如果是刪除，只能從 oldData 拿。
    const projectId = newData?.projectId || oldData?.projectId;

    if (!projectId) {
        console.log(`[${functionName}] 無法取得 projectId，忽略 (ID: ${householdId})`);
        return;
    }

    const db = admin.firestore();

    try {
        // 2. 讀取 Project Settings 設定
        const projectDoc = await db.collection('projects').doc(projectId).get();
        if (!projectDoc.exists) return;

        const settings = projectDoc.data();
        const spreadsheetId = settings.googleSheetId;
        const sheetName = settings.googleSheetTabName;

        if (!spreadsheetId || !sheetName) {
            // 未設定同步，直接忽略
            return;
        }

        console.log(`[${functionName}] 偵測到異動，準備同步: ID=${householdId} -> Sheet=${spreadsheetId}`);

        const sheets = await _getGoogleSheetClient();

        // 3. 找出該 Row 在 Sheet 中的位置 (by _id column A)
        // 只讀取 A 欄以節省 Quota
        const range = `'${sheetName}'!A:A`;
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId,
            range,
        });

        const values = response.data.values || [];
        let rowIndex = -1;

        // 尋找 householdId (跳過 Header Row 1)
        for (let i = 1; i < values.length; i++) {
            if (values[i][0] === householdId) {
                rowIndex = i + 1; // 1-based index
                break;
            }
        }

        // 4. 根據操作類型處理
        if (!newData) {
            // --- 刪除操作 ---
            if (rowIndex > -1) {
                // Delete the row
                // Note: deleting a row shifts others up. 'batchUpdate' with 'deleteDimension' is needed.
                // Using spreadsheets.batchUpdate
                const sheetId = await _getSheetIdByName(sheets, spreadsheetId, sheetName);
                if (sheetId !== null) {
                    await sheets.spreadsheets.batchUpdate({
                        spreadsheetId,
                        resource: {
                            requests: [{
                                deleteDimension: {
                                    range: {
                                        sheetId: sheetId,
                                        dimension: 'ROWS',
                                        startIndex: rowIndex - 1, // 0-based inclusive
                                        endIndex: rowIndex        // 0-based exclusive
                                    }
                                }
                            }]
                        }
                    });
                    console.log(`[${functionName}] 已刪除 Row ${rowIndex}`);
                }
            }
        } else {
            // --- 新增或更新操作 ---
            const flattened = _flattenHouseholdForSheet({ _docId: householdId, ...newData });

            // 讀取 Header (第一列) 以決定欄位順序
            // 如果是新增且是第一筆資料 (values.length <= 1)，我們可能需要先寫 Header? 
            // 假設使用者已經跑過 "Initial Sync"，Header 應該存在。
            // 如果 Header 不存在 (空表)，我們可能需要 fallback 或 error。
            // 為了穩健，我們讀取第一列 Header。
            const headerResp = await sheets.spreadsheets.values.get({
                spreadsheetId,
                range: `'${sheetName}'!1:1`,
            });

            let headers = headerResp.data.values?.[0] || [];

            if (headers.length === 0) {
                console.warn(`[${functionName}] Sheet 標題列為空，無法執行單筆同步。請先執行全量同步。`);
                return;
            }

            // 映射數據到 values array
            const rowData = headers.map(headerLabel => {
                // Reverse lookup: Header Label -> Key
                // 這有點困難，因為 Header 是中文。
                // 我們需要使用 fieldDisplayNames 做反向查找，同時也要處理 _id 這種固定欄位

                if (headerLabel === 'System ID (勿動)') return flattened['_id'];
                if (headerLabel === '更新時間') return flattened['updatedAt'];

                // 嘗試從 fieldDisplayNames 找 Key
                // e.g. "預約項目" -> "bookingType"
                const key = Object.keys(fieldDisplayNames).find(k => fieldDisplayNames[k] === headerLabel);
                if (key) return _formatValue(flattened[key]);

                // 如果找不到，嘗試直接用 HeaderLabel 當 Key (針對動態欄位，若當初用 key 當 header)
                // 或者我們之前的全量同步有把 extraKeys 直接放入 header
                return _formatValue(flattened[headerLabel]);
            });

            // 確保 _id 在第一欄 (如果 Header 沒對齊，這可能有風險，但我們假設 Col A 是 ID)
            if (rowData[0] !== householdId) {
                // 確保第一欄是 ID，即使 Header 說的不是 (或是 fallback)
                // 但我們上面已經 handle 了 'System ID (勿動)'
            }

            if (rowIndex > -1) {
                // Update existing row
                await sheets.spreadsheets.values.update({
                    spreadsheetId,
                    range: `'${sheetName}'!A${rowIndex}`,
                    valueInputOption: 'USER_ENTERED',
                    resource: { values: [rowData] },
                });
                console.log(`[${functionName}] 已更新 Row ${rowIndex}`);
            } else {
                // Append new row
                // 注意：rowData 的長度必須對齊 Header
                await sheets.spreadsheets.values.append({
                    spreadsheetId,
                    range: `'${sheetName}'!A1`,
                    valueInputOption: 'USER_ENTERED',
                    resource: { values: [rowData] },
                });
                console.log(`[${functionName}] 已新增 Row`);
            }
        }

    } catch (error) {
        console.error(`[${functionName}] 錯誤:`, error);
        // Trigger 錯誤通常只能 log，無法回傳給 client
    }
});

// --- Helper Functions ---

/**
 * [Helper] 扁平化戶別資料
 */
function _flattenHouseholdForSheet(h) {
    const flat = { ...h };

    // 基本轉換
    flat['_id'] = h._docId || h.id;

    // Handle Timestamp to String
    if (h.updatedAt && h.updatedAt.toDate) {
        flat['updatedAt'] = h.updatedAt.toDate().toISOString();
    } else if (!flat['updatedAt']) {
        flat['updatedAt'] = new Date().toISOString();
    }

    // Handle special nested fields like 'checklist'
    if (h.checklist) {
        Object.keys(h.checklist).forEach(area => {
            // e.g. livingRoom_floor
            // 如果結構是 checklist: { livingRoom: { items: [...] } }，這會很複雜
            // 假設 checklist 是扁平的 map 或者是 object with status
            // 這裡依據實際資料結構調整。
            // 暫且將整個 checklist 轉為 JSON
        });
        flat['checklist'] = JSON.stringify(h.checklist);
    }

    // Handle inspectionRecords (Array)
    if (Array.isArray(h.inspectionRecords)) {
        flat['inspectionRecords'] = JSON.stringify(h.inspectionRecords);
    }

    return flat;
}

function _formatValue(val) {
    if (val === undefined || val === null) return '';
    if (typeof val === 'object') return JSON.stringify(val);
    return String(val);
}

async function _getSheetIdByName(sheets, spreadsheetId, sheetName) {
    const res = await sheets.spreadsheets.get({ spreadsheetId });
    const sheet = res.data.sheets.find(s => s.properties.title === sheetName);
    return sheet ? sheet.properties.sheetId : null;
}
