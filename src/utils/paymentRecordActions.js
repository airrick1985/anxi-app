// 繳款紀錄的前端操作：戶別面板、列表浮動視窗與到期清單共用，規格：docs/SPEC_PaymentDueReminder.md
import { paymentProofApi } from '@/api';

export function paymentProofFileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result).split(',')[1]);
    reader.onerror = () => reject(new Error('讀取檔案失敗'));
    reader.readAsDataURL(file);
  });
}

function assertSuccess(res) {
  if (res?.status !== 'success' || !res.record) {
    throw new Error(res?.message || '請稍後再試');
  }
  return res;
}

/**
 * 新增預計繳款。
 * @param {{ projectId: string, unitId: string, expectedDate?: string|null, expectedAmount?: number|null, period?: string, note?: string, planSource?: string }} plan
 */
export async function addPaymentPlan({ projectId, unitId, expectedDate = null, expectedAmount = null, period = '', note = '', planSource = 'manual' }) {
  const res = await paymentProofApi({
    action: 'addRecord', projectId, unitId, date: '', amount: null, period, note, expectedDate, expectedAmount, planSource,
  });
  return assertSuccess(res).record;
}

/**
 * 標記已繳；balancePlan 有值時另外新增差額的預計繳款。
 * 差額新增失敗不影響已完成的標記已繳，由 balanceError 回報。
 * @returns {Promise<{ record: object, balanceRecord: object|null, balanceError: string, renameWarning: boolean, trashWarning: boolean }>}
 */
export async function markPaymentRecordPaid({
  projectId, unitId, record, date, amount, note, file = null, paidBy = '', balancePlan = null,
}) {
  const base64 = file ? await paymentProofFileToBase64(file) : null;
  const res = assertSuccess(await paymentProofApi({
    action: 'updateRecord',
    projectId,
    unitId,
    recordId: record.id,
    base64,
    removeFile: false,
    date,
    amount,
    note: note ?? record.note ?? '',
    paidBy,
  }));

  let balanceRecord = null;
  let balanceError = '';
  if (balancePlan) {
    try {
      balanceRecord = await addPaymentPlan({ projectId, unitId, ...balancePlan, planSource: 'balance' });
    } catch (error) {
      balanceError = error.message;
    }
  }
  return {
    record: res.record,
    balanceRecord,
    balanceError,
    renameWarning: !!res.renameWarning,
    trashWarning: !!res.trashWarning,
  };
}

/** 已繳改回預計：清除實繳內容，憑證移至垃圾桶；呼叫前由畫面先確認。 */
export async function revertPaymentRecordToPlanned({ projectId, unitId, record }) {
  const res = assertSuccess(await paymentProofApi({
    action: 'updateRecord',
    projectId,
    unitId,
    recordId: record.id,
    removeFile: true,
    date: '',
    amount: null,
    note: record.note || '',
  }));
  return { record: res.record, trashWarning: !!res.trashWarning };
}
