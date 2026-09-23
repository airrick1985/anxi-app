const { Firestore, FieldPath } = require('@google-cloud/firestore');
const { onSchedule } = require('firebase-functions/v2/scheduler');
const { onDocumentWritten } = require('firebase-functions/v2/firestore');

// 舊批次使用沒有時區的字串，統一按台灣時間解讀。
function parseBatchDate(value) {
  if (!value) return null;
  if (typeof value.toDate === 'function') return value.toDate();
  if (typeof value === 'object' && !(value instanceof Date)) {
    const seconds = value.seconds ?? value._seconds;
    return typeof seconds === 'number' ? new Date(seconds * 1000) : null;
  }
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T/.test(value) && !/(Z|[+-]\d{2}:?\d{2})$/i.test(value)) {
    value += '+08:00';
  }
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function openingKey(batch, now) {
  if (!batch || batch.isDeleted || !batch.projectId || !batch.bookingType) return null;
  const start = parseBatchDate(batch.applicationStart);
  const end = parseBatchDate(batch.applicationEnd);
  if (!start || !Number.isFinite(start.getTime()) || (batch.applicationEnd && (!end || !Number.isFinite(end.getTime())))) return null;
  if (now < start || (end && now > end)) return null;
  return JSON.stringify([batch.projectId, batch.bookingType, start.getTime(), end?.getTime() ?? null]);
}

async function openBatchVisibility(db, batchRef, now = new Date()) {
  // 交易內重新讀取，避免排程與批次修改／刪除交錯，或重複事件再次開啟。
  return db.runTransaction(async transaction => {
    const snapshot = await transaction.get(batchRef);
    const batch = snapshot.data();
    const key = openingKey(batch, now);
    if (!key || batch.customerVisibilityOpeningKey === key) return false;
    const projectRef = db.collection('projects').doc(batch.projectId);
    const project = await transaction.get(projectRef);
    if (!project.exists) return false;
    const config = project.data();
    if (config.bookingMenu?.some(item => item.title === batch.bookingType && item.deleted)) return false;
    // 精準更新單一欄位，保留其他項目的可見性與頁面設定。
    transaction.update(projectRef, new FieldPath('pageSettingsByItem', batch.bookingType, 'visibleToCustomer'), true);
    transaction.update(batchRef, { customerVisibilityOpeningKey: key });
    return true;
  });
}

exports.openBookingItemOnBatchWrite = onDocumentWritten({
  document: 'bookingBatches/{batchId}',
  database: 'anxi-app',
  region: 'asia-east1',
}, async event => {
  if (!event.data?.after.exists) return;
  const batch = event.data.after.data();
  const key = openingKey(batch, new Date());
  if (!key || batch.customerVisibilityOpeningKey === key) return;
  await openBatchVisibility(new Firestore({ databaseId: 'anxi-app' }), event.data.after.ref);
});

exports.openScheduledBookingItems = onSchedule({
  schedule: 'every 1 minutes',
  timeZone: 'Asia/Taipei',
  region: 'asia-east1',
  timeoutSeconds: 300,
}, async () => {
  const db = new Firestore({ databaseId: 'anxi-app' });
  const now = new Date();
  // 現有批次日期混用字串與 Timestamp，不能直接以日期篩選。
  const batches = await db.collection('bookingBatches').where('isDeleted', '==', false).get();
  for (const snapshot of batches.docs) {
    const batch = snapshot.data();
    const key = openingKey(batch, now);
    if (key && batch.customerVisibilityOpeningKey !== key) {
      await openBatchVisibility(db, snapshot.ref, now);
    }
  }
});

exports.openingKey = openingKey;
exports.openBatchVisibility = openBatchVisibility;
