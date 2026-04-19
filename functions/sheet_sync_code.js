
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

// =================================================================
// 4. [Feature] Sales Control Record Google Sheet Sync
// =================================================================

// 銷控資料欄位顯示名稱定義
const salesFieldDisplayNames = {
    unitId: '戶別',
    status: '銷控狀態',
    isPreferredPayment: '是否優付',

    // 面積資訊
    area_house_ping: '房屋坪數',
    area_terrace_ping: '露臺坪數',
    area_main_ping: '主建物坪數',
    area_ancillary_ping: '附屬建物坪數',
    area_common_ping: '公設坪數',

    // 價格資訊 (表價)
    price_list_house_total: '房屋總表價',
    unit_price_list: '表價單價',
    price_list_house_only: '房屋表價',
    price_list_terrace: '露臺表價',

    // 價格資訊 (底價)
    price_floor_house_total: '房屋總底價',
    unit_price_floor: '底價單價',
    price_floor_house_only: '房屋底價',
    price_floor_terrace: '露臺底價',

    // 價格資訊 (成交)
    price_transaction_house: '房屋成交價',
    unit_price_transaction: '成交單價',
    total_transaction: '成交總價(含車)',
    parking_trans_total: '車位成交總價',
    price_diff: '溢差價',

    // 買方資訊
    buyerName: '買方姓名',
    buyerPhone: '買方電話',
    buyerIdNumber: '身分證字號',
    buyerEmail: 'Email',

    // 日期資訊
    payment_deposit_date: '小訂日期',
    payment_complete_date: '補足日期',
    payment_contract_date: '簽約日期',

    // 其他
    salesperson: '銷售人員',
    contractType: '合約方式',
    remarks: '備註'
};

/**
 * [API] 銷控資料全量同步：將某個 Project 的所有 salesHouseholds 寫入 Sheet
 */
exports.syncSalesHouseholdsToSheet = onCall({
    region: "asia-east1",
    cors: true,
    memory: "512MiB",
    timeoutSeconds: 540,
}, async (request) => {
    const { projectId, spreadsheetId, sheetName } = request.data;
    const functionName = "syncSalesHouseholdsToSheet";

    if (!projectId || !spreadsheetId || !sheetName) {
        throw new HttpsError('invalid-argument', '缺少必要參數 (projectId, spreadsheetId, sheetName)');
    }

    const db = admin.firestore();

    try {
        console.log(`[${functionName}] 開始同步: Project=${projectId} -> Sheet=${spreadsheetId} (${sheetName})`);

        // 1. Fetch all sales households
        // 注意：salesHouseholds 集合的 id 通常是 ${projectId}_${unitId} 或其他格式
        // 這裡假設我們可以直接 query projectId 欄位 (如果在 salesHouseholds 中有存的話)
        // 根據 SalesControlSystem.vue 的資料來源，salesHouseholds 是從 projectData.households 取得
        // 這意味著 salesHouseholds 可能是 subcollection 或者是 root collection 但有 projectId 欄位
        // 假設是 root collection 'salesHouseholds' 並且有 projectId 欄位

        const snapshot = await db.collection('salesHouseholds')
            .where('projectId', '==', projectId)
            .get();

        if (snapshot.empty) {
            return { status: 'success', message: '該專案尚無銷控資料' };
        }

        const households = [];
        snapshot.forEach(doc => {
            households.push({ _docId: doc.id, ...doc.data() });
        });

        // 2. Flatten Data
        const rows = households.map(h => _flattenSalesHouseholdForSheet(h));

        // 3. Prepare Headers
        // 定義固定必要的欄位順序 (ID 與更新時間)
        let headers = ['_id', 'updatedAt'];

        // 加入 salesFieldDisplayNames 定義的欄位 (顯示中文)
        const displayKeys = Object.keys(salesFieldDisplayNames);
        headers = headers.concat(displayKeys);

        // 找出 rows 中有但 headers 沒定義的 keys (動態欄位，例如自訂欄位)
        const allRowKeys = new Set();
        rows.forEach(r => Object.keys(r).forEach(k => allRowKeys.add(k)));
        const extraKeys = Array.from(allRowKeys).filter(k => !headers.includes(k) && k !== '_id' && k !== 'updatedAt');

        // 依需求決定是否加入 extraKeys，這裡選擇加入以避免漏資料
        headers = headers.concat(extraKeys);

        // 建立 Header Row (中文名稱)
        const headerRow = headers.map(key => {
            if (key === '_id') return '系統編號 (勿動)';
            if (key === 'updatedAt') return '更新時間';
            return salesFieldDisplayNames[key] || key;
        });

        // 4. Transform Rows to Array relative to Headers
        const values = [headerRow];
        rows.forEach(row => {
            const rowData = headers.map(key => {
                let val = row[key];
                if (val === undefined || val === null) return '';
                if (typeof val === 'object') return JSON.stringify(val);
                return String(val);
            });
            values.push(rowData);
        });

        // 5. Write to Sheet (Clear & Write)
        const sheets = await _getGoogleSheetClient();

        // Save settings to Project
        await db.collection('projects').doc(projectId).set({
            salesSheetId: spreadsheetId,
            salesSheetTabName: sheetName,
            salesSheetUrl: `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit#gid=0` // 簡易 URL
        }, { merge: true });

        // Clear existing content
        await sheets.spreadsheets.values.clear({
            spreadsheetId,
            range: `'${sheetName}'!A:ZZ`,
        });

        // Write new content
        await sheets.spreadsheets.values.update({
            spreadsheetId,
            range: `'${sheetName}'!A1`,
            valueInputOption: 'USER_ENTERED',
            resource: { values },
        });

        console.log(`[${functionName}] 同步完成，共 ${rows.length} 筆`);
        return { status: 'success', message: `成功同步 ${rows.length} 筆銷控資料`, count: rows.length };

    } catch (error) {
        console.error(`[${functionName}] 失敗:`, error);
        throw new HttpsError('internal', `同步失敗: ${error.message}`);
    }
});

/**
 * [Trigger] 當銷控資料異動時，即時同步到 Sheet
 */
exports.onSalesHouseholdWrite = onDocumentWritten("salesHouseholds/{docId}", async (event) => {
    const functionName = "onSalesHouseholdWrite";
    const docId = event.data?.after?.id || event.data?.before?.id || event.params.docId;

    // 1. 判斷資料存在性
    const newData = event.data?.after?.data();
    const oldData = event.data?.before?.data();
    const projectId = newData?.projectId || oldData?.projectId;

    if (!projectId) {
        console.log(`[${functionName}] 無法取得 projectId，忽略 (ID: ${docId})`);
        return;
    }

    const db = admin.firestore();

    try {
        // 2. 讀取 Project Settings
        const projectDoc = await db.collection('projects').doc(projectId).get();
        if (!projectDoc.exists) return;

        const settings = projectDoc.data();
        const spreadsheetId = settings.salesSheetId; // 注意欄位名稱不同
        const sheetName = settings.salesSheetTabName;

        if (!spreadsheetId || !sheetName) {
            return; // 未設定同步
        }

        console.log(`[${functionName}] 偵測到異動，準備同步: ID=${docId} -> Sheet=${spreadsheetId}`);

        const sheets = await _getGoogleSheetClient();

        // 3. 找出該 Row 在 Sheet 中的位置 (by _id column A)
        const range = `'${sheetName}'!A:A`;
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId,
            range,
        });

        const values = response.data.values || [];
        let rowIndex = -1;

        // 尋找 docId (跳過 Header Row 1)
        for (let i = 1; i < values.length; i++) {
            if (values[i][0] === docId) {
                rowIndex = i + 1; // 1-based index
                break;
            }
        }

        // 4. 根據操作類型處理
        if (!newData) {
            // --- 刪除操作 ---
            if (rowIndex > -1) {
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
                                        startIndex: rowIndex - 1,
                                        endIndex: rowIndex
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
            const flattened = _flattenSalesHouseholdForSheet({ _docId: docId, ...newData });

            // 讀取 Header (第一列) 以決定欄位順序
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
                if (headerLabel === '系統編號 (勿動)') return flattened['_id'];
                if (headerLabel === '更新時間') return flattened['updatedAt'];

                // Reverse lookup: Header Label -> Key
                const key = Object.keys(salesFieldDisplayNames).find(k => salesFieldDisplayNames[k] === headerLabel);
                if (key) return _formatValue(flattened[key]);

                return _formatValue(flattened[headerLabel]);
            });

            // 確保第一欄是 ID
            if (rowData[0] !== docId) {
                // 若 Header 沒對齊，這可能有風險
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
    }
});


/**
 * [Helper] 將 Date 格式化為 YYYY/MM/DD（Asia/Taipei 時區）
 */
function _formatDateTaipei(date) {
    if (!date) return '';
    const d = date instanceof Date ? date : (date && date.toDate ? date.toDate() : new Date(date));
    if (!d || isNaN(d.getTime())) return '';
    return d.toLocaleDateString('sv-SE', { timeZone: 'Asia/Taipei' }).replace(/-/g, '/');
}

/**
 * [Helper] 扁平化銷控資料
 */
function _flattenSalesHouseholdForSheet(h) {
    const flat = { ...h };

    // ID
    flat['_id'] = h._docId || h.id;

    // Timestamp 處理（日期欄位統一格式為 YYYY/MM/DD，依 Asia/Taipei 時區）
    const dateOnlyFields = ['payment_deposit_date', 'payment_complete_date', 'payment_contract_date'];
    dateOnlyFields.forEach(field => {
        if (h[field] && h[field].toDate) {
            flat[field] = _formatDateTaipei(h[field].toDate());
        }
    });
    if (h.updatedAt && h.updatedAt.toDate) {
        flat['updatedAt'] = h.updatedAt.toDate().toISOString();
    } else if (!flat['updatedAt']) {
        flat['updatedAt'] = new Date().toISOString();
    }

    // Boolean 處理
    if (typeof h.isPreferredPayment === 'boolean') {
        flat['isPreferredPayment'] = h.isPreferredPayment ? '是' : '否';
    }

    // salesStatus_backend 同步到 status
    if (h.salesStatus_backend) {
        flat['status'] = h.salesStatus_backend;
    }

    // 衍生欄位即時計算（與前端 SalesControlSystem.vue computed 邏輯一致）
    // Why: 這些欄位不應儲存在 Firestore，避免與原始欄位不同步；改由同步時計算
    const parkingArr = Array.isArray(h['持有車位']) ? h['持有車位'] : [];
    const parkingFloorTotal = parkingArr.reduce((sum, p) => sum + (Number(p && p.price_floor) || 0), 0);
    const parkingTransTotal = parkingArr.reduce((sum, p) => sum + (Number(p && p.price_transaction) || 0), 0);
    const houseTrans = Number(h.price_transaction_house) || 0;
    const houseFloor = Number(h.price_floor_house_total) || 0;
    const areaHousePing = Number(h.area_house_ping) || 0;
    const calcUnit = (totalPrice) => {
        const price = Number(totalPrice) || 0;
        if (price <= 0 || areaHousePing === 0) return null;
        return price / areaHousePing;
    };

    flat['parking_floor_total'] = parkingFloorTotal || null;
    flat['parking_trans_total'] = parkingTransTotal || null;
    flat['total_transaction'] = (houseTrans + parkingTransTotal) || null;
    flat['total_floor'] = (houseFloor + parkingFloorTotal) || null;
    flat['price_diff'] = houseTrans > 0 ? (houseTrans + parkingTransTotal) - (houseFloor + parkingFloorTotal) : null;
    flat['unit_price_list'] = calcUnit(h.price_list_house_total);
    flat['unit_price_floor'] = calcUnit(h.price_floor_house_total);
    flat['unit_price_transaction'] = calcUnit(h.price_transaction_house);

    const statusForQuote = h.salesStatus_quote || h.salesStatus_backend;
    if (statusForQuote === '已售') {
        flat['unit_price_value'] = null;
        flat['quote_mode_total_price'] = null;
    } else {
        flat['unit_price_value'] = calcUnit(h.price_list_house_total);
        flat['quote_mode_total_price'] = Number(h.price_list_house_total) || null;
    }

    // 持有車位：陣列僅取「車位編號」，以「、」串接
    if (Array.isArray(h['持有車位'])) {
        flat['持有車位'] = h['持有車位']
            .map(p => (p && (p['車位編號'] || p.spotId)) || '')
            .filter(Boolean)
            .join('、');
    }

    return flat;
}
