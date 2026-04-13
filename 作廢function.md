// ✓ START: 新增 - 驗屋報告上傳前置驗證函式
/**
 * [新增] 驗屋報告上傳前的第一步驗證
 * 驗證身分證、上傳開關、預約紀錄是否存在且尚未被使用
 */
exports.verifyUploadPrerequisites = onCall(async (request) => {
  const { projectId, unitId, reportType, idNumber } = request.data;
  const functionName = `verifyUploadPrerequisites (Project: ${projectId}, Unit: ${unitId})`;

  if (!projectId || !unitId || !reportType || !idNumber) {
    throw new HttpsError("invalid-argument", "缺少必要參數 (projectId, unitId, reportType, idNumber)。");
  }

  const db = new Firestore({ databaseId: "anxi-app" });

  try {
    // --- 1. 驗證身分證 (邏輯同 validateId) ---
    console.log(`[${functionName}] 步驟 1/3: 驗證身分證...`);
    const householdDocId = `${projectId}_${unitId}`;
    const householdDoc = await db.collection('households').doc(householdDocId).get();

    if (!householdDoc.exists) {
      throw new HttpsError('not-found', `找不到戶別 "${unitId}" 的資料。`);
    }
    const householdData = householdDoc.data();
    const storedId = String(householdData.buyerIdNumber || '').trim();
    const inputId = String(idNumber).trim();

    if (storedId !== inputId && inputId !== projectId) {
      throw new HttpsError('permission-denied', '身分證號碼驗證失敗，請重新確認。');
    }
    console.log(`[${functionName}] 身分證驗證成功。`);

    // --- 2. 檢查上傳開關 ---
    console.log(`[${functionName}] 步驟 2/3: 檢查上傳開關...`);
    const bookingTypeForSwitch = reportType === '初驗報告' ? 'initialReportUploadSwitch' : 'reInspectionReportUploadSwitch';
    if (householdData[bookingTypeForSwitch] !== true) {
      throw new HttpsError('permission-denied', `此戶別的「${reportType}」上傳功能目前未開放或已關閉。`);
    }
    console.log(`[${functionName}] 上傳開關已開啟。`);

    // --- 3. 檢查預約紀錄 ---
    console.log(`[${functionName}] 步驟 3/3: 檢查相關預約紀錄...`);
    const bookingTypeForQuery = reportType.replace('報告', ''); // "初驗報告" -> "初驗"

    const appointmentsQuery = db.collection('appointments')
      .where('projectId', '==', projectId)
      .where('unitId', '==', unitId)
      .where('bookingType', '==', bookingTypeForQuery)
      .where('status', 'in', ['預約中', '已完成'])
      .where('inspectionMethod', 'in', ['代驗公司', '驗屋公司'])
      .orderBy('createdAt', 'desc');

    const appointmentSnapshot = await appointmentsQuery.get();

    if (appointmentSnapshot.empty) {
      // 找不到符合的「代驗公司」或「驗屋公司」預約紀錄
      const projectDoc = await db.collection('projects').doc(projectId).get();
      const projectName = projectDoc.exists ? projectDoc.data().name : projectId;
      console.log(`[${functionName}] 找不到代驗公司或驗屋公司預約紀錄，回傳需要確認。`);
      return {
        status: 'needs_confirmation',
        message: `系統找不到 ${projectName} ${unitId} 的代驗/驗屋公司「${bookingTypeForQuery}」紀錄，您確定要繼續上傳嗎？`
      };
    }

    // 找到符合的預約紀錄，檢查是否已上傳過
    const latestAppointment = appointmentSnapshot.docs[0].data();

    // ✅ [修改] 取消驗證 uploadReportTime，允許重複上傳
    /* if (latestAppointment.uploadReportTime) {
      const uploadTime = latestAppointment.uploadReportTime.toDate().toLocaleString('zh-TW', { timeZone: 'Asia/Taipei' });
      const projectDoc = await db.collection('projects').doc(projectId).get();
      const projectName = projectDoc.exists ? projectDoc.data().name : projectId;
      console.log(`[${functionName}] 發現已上傳紀錄，拒絕操作。`);
      throw new HttpsError('already-exists', `${projectName} ${unitId} 已於 ${uploadTime} 上傳過 ${reportType}，如需重新上傳請洽客服人員。`);
    }
    */

    // 所有驗證通過，返回預約詳情供用戶確認
    console.log(`[${functionName}] 所有驗證通過。`);

    // 格式化預約日期為 YYYY/MM/DD
    const appointmentDateObj = latestAppointment.appointmentDate.toDate();
    const formattedAppointmentDate = appointmentDateObj.toLocaleDateString('zh-TW', {
      timeZone: 'Asia/Taipei',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).replace(/\//g, '/'); // 確保使用 / 分隔符

    return {
      status: 'success',
      bookingCode: latestAppointment.bookingCode,
      appointmentDetails: {
        bookingType: latestAppointment.bookingType,
        inspectionMethod: latestAppointment.inspectionMethod,
        appointmentDate: formattedAppointmentDate,
        bookerName: latestAppointment.bookerName,
        bookerEmail: latestAppointment.bookerEmail,
      }
    };

  } catch (error) {
    console.error(`[${functionName}] 驗證失敗:`, error);
    if (error instanceof HttpsError) {
      throw error;
    }
    throw new HttpsError('internal', `驗證時發生未預期的錯誤: ${error.message}`);
  }
});
// ✓ END: 新增 - 驗屋報告上傳前置驗證函式