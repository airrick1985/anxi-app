// 批次新增預計繳款時略過逐戶 Sheet 同步的判定，規格：docs/SPEC_PaymentDueReminder.md
//
// 批次寫入會在戶別留下標記，觸發器看到「只改繳款紀錄且標記是新值」就不逐戶同步，由批次結束時全量同步一次。
// 判定不確定時一律回 false，退回原本的逐筆同步，最多只是多寫幾次 Sheet，不會漏資料。

const { isDeepStrictEqual } = require('util');

const SHEET_SYNC_SKIP_FIELD = '_sheetSyncSkipBatchId';
const SKIPPABLE_FIELDS = new Set([SHEET_SYNC_SKIP_FIELD, 'paymentRecords', 'updatedAt']);

// 時間固定 13 位數，字串比較即先後，舊快照把標記寫回時不會被當成新批次
function newSheetSyncBatchId(now = new Date()) {
  const rand = Math.random().toString(36).slice(2, 8);
  return `batch_${String(now.getTime()).padStart(13, '0')}_${rand}`;
}

function shouldSkipSheetSync(before, after) {
  if (!before || !after) return false;
  const marker = after[SHEET_SYNC_SKIP_FIELD];
  if (typeof marker !== 'string' || !marker) return false;
  const previous = before[SHEET_SYNC_SKIP_FIELD];
  if (typeof previous === 'string' && marker <= previous) return false;
  const fields = new Set([...Object.keys(before), ...Object.keys(after)]);
  for (const field of fields) {
    if (!SKIPPABLE_FIELDS.has(field) && !isDeepStrictEqual(before[field], after[field])) return false;
  }
  return true;
}

module.exports = { SHEET_SYNC_SKIP_FIELD, newSheetSyncBatchId, shouldSkipSheetSync };
