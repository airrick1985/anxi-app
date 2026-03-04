const fs = require('fs');
const path = require('path');

let code = fs.readFileSync('index.js', 'utf8');

// 1. Insert imports
if (!code.includes('const PDFDocument = require("pdfkit");')) {
    code = code.replace('const xlsx = require("xlsx");', 'const xlsx = require("xlsx");\nconst PDFDocument = require("pdfkit");');
}

// 2. Find replacement boundaries
const startMarker = ' * [內部輔助函式] 在簡報中根據替代文字描述查找投影片 ID';
const endMarker = '結束：驗屋紀錄相關 Cloud Functions';

const startIdxRaw = code.indexOf(startMarker);
const endIdxRaw = code.indexOf(endMarker);

if (startIdxRaw === -1 || endIdxRaw === -1) {
    console.error('Cannot find markers!');
    process.exit(1);
}

const startIdx = code.lastIndexOf('/**', startIdxRaw);
const endIdx = code.lastIndexOf('// =================================================================', endIdxRaw);


const newCode = `/**
 * [內部異步函式] 使用 PDFKit 生成驗屋報告 PDF
 */
async function generatePdfInBackground(projectId, unitId, confirmationBatchId, inspectorName, triggeringUserEmail) {
  const functionName = \`generatePdfInBackground_PdfKit_V5.0 (Batch: \${confirmationBatchId})\`;
  const db = new Firestore({ databaseId: "anxi-app" });
  const drive = getAuthenticatedDriveClient();

  try {
    console.log(\`[\${functionName}] 背景任務開始，查詢資料...\`);

    // --- 1. 查詢所需資料 ---
    const confirmationQuery = db.collection("inspectionConfirmations").where("confirmationBatchId", "==", confirmationBatchId).limit(1);
    const confirmationSnapshot = await confirmationQuery.get();
    if (confirmationSnapshot.empty) throw new Error(\`找不到確認紀錄 (Batch ID: \${confirmationBatchId})\`);
    const confirmationData = confirmationSnapshot.docs[0].data();

    const projectDoc = await db.collection('projects').doc(projectId).get();
    if (!projectDoc.exists) throw new Error(\`找不到建案資料 (Project ID: \${projectId})\`);
    const projectData = projectDoc.data();

    const recordsQuery = db.collection("inspectionRecords")
      .where("confirmationBatchId", "==", confirmationBatchId)
      .where("isDeleted", "==", false)
      .where("customerView", "==", true)
      .orderBy("inspectionDate", "asc").orderBy("category", "asc").orderBy("area", "asc");
    const recordsSnapshot = await recordsQuery.get();
    const records = recordsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    if (records.length === 0) throw new Error("找不到符合此批次的驗屋紀錄。");
    console.log(\`[\${functionName}] 資料查詢完成，共 \${records.length} 筆紀錄。\`);

    // --- 2. 預載簽名與驗屋照片 ---
    console.log(\`[\${functionName}] 下載簽名與所有驗屋照片緩存...\`);
    let signatureBuf = null;
    if (confirmationData.signatureImageUrl) {
      try {
        const sigResp = await axios.get(confirmationData.signatureImageUrl, { responseType: 'arraybuffer' });
        signatureBuf = sigResp.data;
      } catch (e) {
        console.warn(\`[\${functionName}] 下載簽名圖片失敗:\`, e.message);
      }
    }

    const imageCache = {};
    for (const record of records) {
      if (record.photos && record.photos.length > 0) {
        for (const photo of record.photos) {
          if (!imageCache[photo.url]) {
            try {
              const imgResp = await axios.get(photo.url, { responseType: 'arraybuffer' });
              imageCache[photo.url] = imgResp.data;
            } catch (e) {
              console.warn(\`[\${functionName}] 無法載入圖片 \${photo.url}:\`, e.message);
            }
          }
        }
      }
    }

    // --- 3. 生成 PDF ---
    console.log(\`[\${functionName}] 開始產生 PDF...\`);
    const fontPath = path.join(__dirname, 'fonts', 'NotoSansTC-Regular.ttf');
    if (!require('fs').existsSync(fontPath)) {
      throw new Error(\`找不到字體檔案: \${fontPath}\`);
    }

    const doc = new PDFDocument({ size: 'A4', margin: 24 });
    const buffers = [];
    doc.on('data', buffers.push.bind(buffers));

    doc.font(fontPath);
    const textOptions = { fallbackFonts: [fontPath] }; // 確保 Emoji 等不會崩潰

    // --- 3.1 繪製封面 ---
    const pageW = doc.page.width;
    const pageH = doc.page.height;
    const margin = 24;
    const usableW = pageW - 2 * margin;
    const halfH = pageH / 2;
    const cardH = halfH - margin - 5;

    doc.fontSize(24).text(\`\${projectData.name || projectId} 驗屋報告\`, { align: 'center' });
    doc.moveDown(3);

    doc.fontSize(14).lineGap(6);
    doc.text(\`戶別：\${unitId}\`);
    doc.text(\`產權人：\${confirmationData.buyerInfo?.name || ''}\`);
    doc.text(\`電話：\${confirmationData.buyerInfo?.phone || ''}\`);
    doc.text(\`Email：\${confirmationData.buyerInfo?.email || ''}\`);
    
    let inspectionDateStr = 'N/A';
    if (records[0].inspectionDate?.toDate) {
      inspectionDateStr = formatInTimeZone(records[0].inspectionDate.toDate(), 'Asia/Taipei', 'yyyy/MM/dd');
    }
    doc.text(\`驗屋日期：\${inspectionDateStr}\`);
    
    doc.moveDown(3);
    doc.fontSize(12);
    doc.text(\`☑️ 本人確認已詳閱本次驗屋紀錄，並同意於後續檢驗時，以本報告作為判斷依據。\`);
    
    doc.moveDown(1.5);
    doc.fontSize(14).text(\`產權人簽名：\`);
    
    if (signatureBuf) {
      try {
        doc.image(signatureBuf, { width: 150 });
      } catch (e) {
        doc.text('(簽名載入失敗)', { color: 'red' });
        doc.fillColor('black');
      }
    } else {
      doc.text('(無簽名)');
    }
    
    doc.moveDown(3);
    doc.fontSize(12).text(\`報告產製日期：\${formatInTimeZone(new Date(), 'Asia/Taipei', 'yyyy/MM/dd')}\`);

    // --- 3.2 繪製驗屋紀錄內頁 ---
    for (let i = 0; i < records.length; i++) {
        const record = records[i];
        const isTop = (i % 2 === 0);
        if (i > 0 && isTop) doc.addPage();
        
        const startY = isTop ? margin : (halfH + 5);
        let currentY = startY;

        // 表格區域 (4列3欄)
        const fields = [
            ['建案', projectData.name || projectId], ['戶別', record.unitId || ''], ['日期', record.inspectionDate?.toDate ? formatInTimeZone(record.inspectionDate.toDate(), 'Asia/Taipei', 'yyyy/MM/dd') : ''],
            ['階段', record.phase || ''], ['區域', record.area || ''], ['人員', record.inspectorName || ''],
            ['種類', record.category || ''], ['細項', record.subCategory || ''], ['狀態', record.status || ''],
            ['等級', record.level || ''], ['進度', record.progress || ''], ['']
        ];
        
        const colW = usableW / 3;
        const rowH = 18;
        doc.fontSize(10);
        
        for (let r = 0; r < 4; r++) {
            for (let c = 0; c < 3; c++) {
                const [label, val] = fields[r * 3 + c];
                const x = margin + c * colW;
                const y = currentY + r * rowH;
                
                doc.rect(x, y, colW, rowH).stroke('#e0e0e0');
                if (label) {
                    doc.fillColor('#757575').text(\`\${label}:\`, x + 5, y + 4, { continued: true });
                    doc.fillColor('#212121').text(\` \${val || ''}\`);
                }
            }
        }
        currentY += 4 * rowH + 6;

        // 說明區
        const desc = record.description || '(無)';
        doc.rect(margin, currentY, usableW, 25).stroke('#e0e0e0');
        doc.fillColor('#757575').text(\`說明:\`, margin + 5, currentY + 5, { continued: true });
        doc.fillColor('#212121').text(\` \${desc}\`, { width: usableW - 10, height: 15, ellipsis: true });
        
        currentY += 25 + 6;
        
        // 圖片區
        if (record.photos && record.photos.length > 0) {
            const photos = record.photos;
            const cnt = photos.length;
            const maxShow = Math.min(cnt, 4);
            const gap = 8;
            const imgMaxW = (usableW - gap * (maxShow - 1)) / maxShow;
            const imgMaxH = cardH - (currentY - startY) - 5; 

            if (imgMaxH > 20) {
                if (cnt === 1) {
                    const imgBuf = imageCache[photos[0].url];
                    if (imgBuf) {
                        try {
                            doc.image(imgBuf, margin, currentY, { fit: [usableW, imgMaxH], align: 'left', valign: 'top' });
                        } catch(e) {}
                    }
                } else {
                    let currX = margin;
                    for (let j = 0; j < maxShow; j++) {
                        const imgBuf = imageCache[photos[j].url];
                        if (imgBuf) {
                            try {
                                doc.image(imgBuf, currX, currentY, { fit: [imgMaxW, imgMaxH], align: 'left', valign: 'top' });
                            } catch(e) {}
                        }
                        currX += imgMaxW + gap;
                    }
                }
            }
        }
        
        // 繪製分隔線
        if (isTop && i + 1 < records.length) {
            doc.moveTo(margin, halfH).lineTo(pageW - margin, halfH).stroke('#eeeeee');
        }
    }

    doc.end();

    const pdfBuffer = await new Promise((resolve, reject) => {
        doc.on('end', () => resolve(Buffer.concat(buffers)));
        doc.on('error', reject);
    });
    console.log(\`[\${functionName}] PDF 產生完成，大小: \${pdfBuffer.length} bytes\`);

    // --- 4. 上傳至 Drive ---
    // (邏輯同原先 V4 版本)
    const householdDoc = await db.collection('households').doc(\`\${projectId}_\${unitId}\`).get();
    if (!householdDoc.exists) throw new Error(\`找不到戶別資料 (\${projectId}_\${unitId})\`);
    const reportFolderUrl = householdDoc.data().inspectionReportFolderUrl;
    if (!reportFolderUrl) throw new Error("戶別資料缺少 inspectionReportFolderUrl");
    const parentFolderId = reportFolderUrl.match(/[-\w]{25,}/)?.[0];
    if (!parentFolderId) throw new Error("無效的 Drive 資料夾 URL");

    const subFolderName = confirmationData.buyerInfo?.name ? \`\${unitId}(\${confirmationData.buyerInfo.name}自驗)\` : \`\${unitId}\`;
    const searchFolderRes = await drive.files.list({ q: \`name='\${subFolderName}' and mimeType='application/vnd.google-apps.folder' and '\${parentFolderId}' in parents and trashed=false\`, fields: 'files(id)' });
    
    let subFolderId;
    if (searchFolderRes.data.files.length > 0) { 
        subFolderId = searchFolderRes.data.files[0].id; 
    } else { 
        const folderMetadata = { name: subFolderName, mimeType: 'application/vnd.google-apps.folder', parents: [parentFolderId] }; 
        const createdFolder = await drive.files.create({ resource: folderMetadata, fields: 'id' }); 
        subFolderId = createdFolder.data.id; 
    }

    const timestamp = formatInTimeZone(new Date(), 'Asia/Taipei', 'yyyy-MM-dd HH-mm');
    const pdfFilename = \`\${projectData.name || projectId}-\${unitId}-驗屋報告-\${confirmationData.buyerInfo.name}-\${timestamp}.pdf\`;
    const fileMetadata = { name: pdfFilename, parents: [subFolderId] };
    
    const uploadedFile = await drive.files.create({
      resource: fileMetadata,
      media: { mimeType: 'application/pdf', body: Readable.from(pdfBuffer) },
      fields: 'id, name, webViewLink'
    });
    
    const driveFileUrl = uploadedFile.data.webViewLink;
    if (!driveFileUrl) throw new Error("上傳 PDF 至 Drive 後未獲取到有效連結。");
    console.log(\`[\${functionName}] PDF 已成功上傳至 Drive: \${driveFileUrl}\`);

    // --- 5. 更新 Firestore ---
    await db.collection("households").doc(\`\${projectId}_\${unitId}\`).update({
      inspectionReportUrl: FieldValue.arrayUnion({ name: pdfFilename, url: driveFileUrl })
    });
    console.log(\`[\${functionName}] 已更新戶別資料庫中的報告連結。\`);

    // --- 6. 寄送 Email 通知 ---
    const mailTransport = nodemailer.createTransport({ service: 'gmail', auth: { user: process.env.SENDER_EMAIL, pass: process.env.GMAIL_APP_PASSWORD } });
    const ccRecipients = await getCcRecipients(projectId, "驗屋系統信件副本");
    const allCc = [...new Set([...ccRecipients, triggeringUserEmail].filter(Boolean))];
    const subject = \`【\${projectData.name || projectId}】您的驗屋報告已產製完成 (\${unitId})\`;
    const confirmedAtDate = confirmationData.confirmedAt.toDate();
    const htmlBody = \`
        <div style="font-family: Arial, sans-serif; line-height: 1.6;">
        <h2 style="color: #333;">驗屋報告已完成</h2>
        <p>親愛的 \${confirmationData.buyerInfo.name || '住戶'} 您好：</p>
        <p>關於「\${projectData.name || projectId}」建案 \${unitId} 戶別，您於 \${formatInTimeZone(confirmedAtDate, 'Asia/Taipei', 'yyyy/MM/dd HH:mm')} 確認的驗屋報告 (\${records.length}筆紀錄) 已產製完成。</p>
        <p>您可以點擊下方按鈕查看或下載報告檔案：</p>
        <div style="text-align: center; margin: 30px 0;"><a href="\${driveFileUrl}" target="_blank" style="background-color: #28a745; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold;">查看驗屋報告</a></div>
        <p>報告產製人員：\${inspectorName}</p><hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;"><p style="font-size: 12px; color: #888;">此為系統自動發送的郵件，請勿直接回覆。</p></div>
    \`;
    await mailTransport.sendMail({ from: \`"\${projectData.name || projectId} 驗屋系統" <\${process.env.SENDER_EMAIL}>\`, to: confirmationData.buyerInfo.email, cc: allCc.join(', '), subject: subject, html: htmlBody });
    console.log(\`[\${functionName}] 已成功寄送報告完成通知 Email。\`);

  } catch (error) {
    console.error(\`[\${functionName}] 🔴 背景任務執行失敗:\`, error);
    await sendErrorNotification(projectId, unitId, confirmationBatchId, error);
  }
}
\n`;

code = code.slice(0, startIdx) + newCode + code.slice(endIdx);
fs.writeFileSync('index.js', code, 'utf8');
console.log('Successfully patched index.js!');
