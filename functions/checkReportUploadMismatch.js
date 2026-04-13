/**
 * 檢查工具：找出 inspectionReportUrl 已上傳但 reportUploaded = false 的預約
 *
 * 用途：檢查 households 文檔有上傳報告，但對應的 appointments 尚未標記為已上傳的不一致情況
 */

const functions = require("firebase-functions");
const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { Firestore } = require("@google-cloud/firestore");

exports.checkReportUploadMismatch = onCall(
  { region: "asia-east1" },
  async (request) => {
    const functionName = "checkReportUploadMismatch";
    const { projectId } = request.data;

    if (!projectId) {
      throw new HttpsError(
        "invalid-argument",
        "缺少必要參數 (projectId)。"
      );
    }

    const db = new Firestore({ databaseId: "anxi-app" });
    const results = {
      projectId,
      totalHouseholds: 0,
      householdsWithReports: 0,
      mismatchCount: 0,
      mismatchDetails: [],
      timestamp: new Date().toISOString(),
    };

    try {
      console.log(
        `[${functionName}] 開始檢查建案 ${projectId} 的報告上傳狀態...`
      );

      // 1. 查詢該建案所有有 inspectionReportUrl 的 households
      const householdsSnapshot = await db
        .collection("households")
        .where("projectId", "==", projectId)
        .get();

      results.totalHouseholds = householdsSnapshot.size;
      console.log(`[${functionName}] 找到 ${householdsSnapshot.size} 筆戶別`);

      // 2. 逐一檢查每個 household
      for (const householdDoc of householdsSnapshot.docs) {
        const householdData = householdDoc.data();
        const unitId = householdData.unitId;
        const inspectionReportUrl = householdData.inspectionReportUrl;

        // 檢查是否有 inspectionReportUrl（不為空）
        if (
          !inspectionReportUrl ||
          !Array.isArray(inspectionReportUrl) ||
          inspectionReportUrl.length === 0
        ) {
          continue; // 跳過沒有報告的
        }

        results.householdsWithReports++;
        console.log(
          `[${functionName}] 戶別 ${unitId} 有報告上傳 (共 ${inspectionReportUrl.length} 筆)`
        );

        // 3. 查詢該戶別的所有預約
        const appointmentsSnapshot = await db
          .collection("appointments")
          .where("projectId", "==", projectId)
          .where("unitId", "==", unitId)
          .get();

        // 4. 檢查是否存在「不匹配」的預約
        for (const appointmentDoc of appointmentsSnapshot.docs) {
          const appointmentData = appointmentDoc.data();
          const bookingType = appointmentData.bookingType;
          const reportUploaded = appointmentData.reportUploaded;
          const status = appointmentData.status;
          const bookingCode = appointmentData.bookingCode;

          // 檢查是否符合「應該被標記但未被標記」的條件
          if (
            (bookingType === "初驗" || bookingType === "複驗") &&
            reportUploaded === false &&
            status === "已完成"
          ) {
            results.mismatchCount++;
            results.mismatchDetails.push({
              appointmentId: appointmentDoc.id,
              bookingCode: bookingCode,
              unitId: unitId,
              bookingType: bookingType,
              inspectionMethod: appointmentData.inspectionMethod || 'N/A', // ✅ 新增：預約方式
              reportUploaded: reportUploaded,
              status: status,
              appointmentDate: appointmentData.appointmentDate,
              bookerName: appointmentData.bookerName,
              bookerEmail: appointmentData.bookerEmail,
              inspectionReportCount: inspectionReportUrl.length,
            });

            console.warn(
              `[${functionName}] ⚠️  不匹配項: 戶別 ${unitId}, 預約代碼 ${bookingCode}, bookingType=${bookingType}, reportUploaded=false, status=已完成`
            );
          }
        }
      }

      console.log(
        `[${functionName}] 檢查完成。找到 ${results.mismatchCount} 筆不匹配的預約。`
      );

      return results;
    } catch (error) {
      console.error(`[${functionName}] 檢查時發生錯誤:`, error);
      throw new HttpsError(
        "internal",
        `檢查報告上傳狀態時發生錯誤: ${error.message}`
      );
    }
  }
);

/**
 * 修復工具：自動更新不匹配的 reportUploaded 狀態
 *
 * ⚠️ 使用前請確保已確認不匹配項，避免誤改
 */
exports.fixReportUploadMismatch = onCall(
  { region: "asia-east1", timeoutSeconds: 540 },
  async (request) => {
    const functionName = "fixReportUploadMismatch";
    const { appointmentIds } = request.data;

    if (!appointmentIds || !Array.isArray(appointmentIds) || appointmentIds.length === 0) {
      throw new HttpsError(
        "invalid-argument",
        "缺少必要參數 (appointmentIds)，應為非空陣列。"
      );
    }

    const db = new Firestore({ databaseId: "anxi-app" });
    const results = {
      totalToFix: appointmentIds.length,
      successCount: 0,
      failureCount: 0,
      failureDetails: [],
      timestamp: new Date().toISOString(),
    };

    try {
      console.log(
        `[${functionName}] 開始修復 ${appointmentIds.length} 筆預約...`
      );

      // 使用批次更新
      const batch = db.batch();

      for (const appointmentId of appointmentIds) {
        try {
          const appointmentRef = db
            .collection("appointments")
            .doc(appointmentId);
          batch.update(appointmentRef, {
            reportUploaded: true,
            fixedAt: new Date().toISOString(),
          });
        } catch (err) {
          results.failureCount++;
          results.failureDetails.push({
            appointmentId,
            error: err.message,
          });
          console.error(`[${functionName}] 準備更新 ${appointmentId} 時出錯:`, err);
        }
      }

      // 執行批次更新
      await batch.commit();
      results.successCount = appointmentIds.length - results.failureCount;

      console.log(
        `[${functionName}] 修復完成。成功: ${results.successCount}, 失敗: ${results.failureCount}`
      );

      return results;
    } catch (error) {
      console.error(`[${functionName}] 修復時發生錯誤:`, error);
      throw new HttpsError(
        "internal",
        `修復報告上傳狀態時發生錯誤: ${error.message}`
      );
    }
  }
);
