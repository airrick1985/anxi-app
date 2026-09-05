// 客戶資料卡（自訂表單）填寫紀錄查詢 — 共用 Firestore 存取
// 供「從客資卡導入買方」與「戶別客戶資料卡／匯出文件」兩處共用，避免各自維護查詢邏輯
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/firebase';
import { isCustomerDataCardForm } from '@/utils/customerCardImport';

/** 台灣時間顯示（yyyy/mm/dd hh:mm） */
export function formatTaiwanTime(ts) {
  if (!ts) return '';
  const date = typeof ts.toDate === 'function' ? ts.toDate() : new Date(ts);
  if (isNaN(date.getTime())) return '';
  return date.toLocaleString('zh-TW', {
    timeZone: 'Asia/Taipei',
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', hour12: false,
  });
}

/** 此建案所有「客戶資料卡」表單（名稱關鍵字或手動標記） */
export async function loadCustomerCardForms(projectId) {
  const snap = await getDocs(query(
    collection(db, 'customFormTemplates'),
    where('projectId', '==', projectId)
  ));
  return snap.docs
    .map(d => ({ id: d.id, ...d.data() }))
    .filter(isCustomerDataCardForm);
}

/**
 * 某戶別的所有客戶資料卡填寫紀錄（排除已刪除），依填寫時間由早到晚
 * @returns {Promise<Array<{ id: string, form: object, data: object }>>}
 */
export async function loadUnitCustomerCardSubmissions(projectId, unitId) {
  if (!projectId || !unitId) return [];
  const cardForms = await loadCustomerCardForms(projectId);
  if (cardForms.length === 0) return [];

  const all = [];
  // 客資卡表單數量少，逐一查詢即可，也避開 in 查詢上限
  await Promise.all(cardForms.map(async (form) => {
    const snap = await getDocs(query(
      collection(db, 'customFormSubmissions'),
      where('projectId', '==', projectId),
      where('formId', '==', form.id),
      where('unitId', '==', unitId)
    ));
    snap.docs.forEach(d => {
      const data = d.data();
      if (data.isDeleted === true) return;
      all.push({ id: d.id, form, data });
    });
  }));

  all.sort((a, b) => {
    const ta = a.data.submittedAt?.seconds ?? Number.MAX_SAFE_INTEGER;
    const tb = b.data.submittedAt?.seconds ?? Number.MAX_SAFE_INTEGER;
    return ta - tb;
  });
  return all;
}

/**
 * 將原始回覆攤平成 FormExportDialog／CustomFormResponses 使用的格式
 * （_id/_unitId 等中繼欄位 + 可讀快照 label→value + 原始 data id→value）
 */
export function flattenSubmissionForExport(id, raw) {
  const displayData = raw.snapshotAvailable && raw.readableSnapshot
    ? raw.readableSnapshot
    : raw.data || {};
  return {
    _id: id,
    _unitId: raw.unitId || displayData['戶別'] || '',
    _submittedAt: raw.submittedAt,
    _isDeleted: raw.isDeleted || false,
    _submitterLineId: raw.submitterLineId || '',
    _submitterLineName: raw.submitterLineName || '',
    ...displayData,
    ...(raw.data || {}),
  };
}
