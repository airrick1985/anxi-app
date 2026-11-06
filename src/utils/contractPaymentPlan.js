// 合約期款 → 繳款紀錄的期別選項與預計繳款（純函式），規格：docs/SPEC_PaymentDueReminder.md §6.9
//
// 來源是戶別 contractDocData 上次儲存的 manualRows／decorationManualRows（金額單位：萬）。
// 合約製作按儲存或下載時都會寫入，不論是否手動調整過。
import { isPaidRecord, isPlannedRecord } from './paymentRecordStatus.js';

const YUAN_PER_WAN = 10000;
const DECORATION_PERIOD_PREFIX = '裝修－';
const PACKAGE_TEMPLATE_CATEGORY = '配套期款';

const textOf = value => String(value || '').trim();
const paidAmountOf = record => Number(record?.amount) || 0;
const sumBy = (list, read) => list.reduce((sum, item) => sum + read(item), 0);

// 比照合約製作的母項／子項：有子項列子項，沒有子項列母項本身
function flattenRows(rows) {
  return (Array.isArray(rows) ? rows : []).flatMap((row) => {
    const children = Array.isArray(row?.children) ? row.children : [];
    return children.length
      ? children.map(child => ({ ...child, groupName: row.name || '' }))
      : [{ ...row, groupName: '' }];
  });
}

// 口徑同合約製作的 rowsAmountSum：每期先四捨五入到整數萬再加總
function sumWan(leaves) {
  return sumBy(leaves, leaf => Math.round(Number(leaf.amount)) || 0);
}

/**
 * 讀出戶別的合約期款。
 * @param {object|null} contractDocData 戶別 contractDocData
 * @param {{ isPackageContract?: boolean, mainBase?: number, decorationBase?: number }} options 基準單位：萬
 * @returns {{
 *   hasData: boolean,
 *   sections: Array<{ id: string, label: string, baseLabel: string, baseWan: number, sumWan: number, hasRows: boolean, matchesBase: boolean }>,
 *   rows: Array<{ key: string, section: string, groupName: string, name: string, period: string, amount: number }>,
 *   skippedCount: number,
 * }} rows 只含金額大於 0 的期別，金額單位：元；period 是寫入紀錄的期別名稱
 */
export function buildContractPlan(contractDocData, { isPackageContract = false, mainBase = 0, decorationBase = 0 } = {}) {
  const sectionSources = [
    {
      id: 'main',
      label: '期款',
      baseLabel: isPackageContract ? '配套房屋總價' : '成交總價',
      baseWan: mainBase,
      rows: contractDocData?.manualRows,
    },
    ...(isPackageContract
      ? [{ id: 'decoration', label: '裝修期款', baseLabel: '配套價格', baseWan: decorationBase, rows: contractDocData?.decorationManualRows }]
      : []),
  ];
  const leavesBySection = sectionSources.map(section => flattenRows(section.rows));
  const mainNames = new Set(leavesBySection[0].map(leaf => textOf(leaf.name)));

  const allRows = sectionSources.flatMap((section, index) => leavesBySection[index].map((leaf, leafIndex) => {
    const name = textOf(leaf.name);
    // 比對既有紀錄靠期別名稱，裝修款和期款同名時要分開
    const period = section.id === 'decoration' && mainNames.has(name) ? `${DECORATION_PERIOD_PREFIX}${name}` : name;
    return {
      key: `${section.id}:${leaf.key ?? leafIndex}`,
      section: section.id,
      groupName: leaf.groupName,
      name,
      period,
      amount: Math.round((Number(leaf.amount) || 0) * YUAN_PER_WAN),
    };
  }));
  const rows = allRows.filter(row => row.amount > 0);

  return {
    hasData: allRows.length > 0,
    sections: sectionSources.map((section, index) => {
      const sum = sumWan(leavesBySection[index]);
      return {
        id: section.id,
        label: section.label,
        baseLabel: section.baseLabel,
        baseWan: section.baseWan,
        sumWan: sum,
        hasRows: leavesBySection[index].length > 0,
        matchesBase: sum === section.baseWan,
      };
    }),
    rows,
    skippedCount: allRows.length - rows.length,
  };
}

// 範本的期別：同付款表，母項有子項時列子項，沒有子項時列母項
function templatePeriodNames(template) {
  const items = Array.isArray(template?.items) ? template.items : [];
  return items.filter(item => !item.parentId).flatMap((parent) => {
    const children = items.filter(item => item.parentId === parent.id);
    return (children.length ? children : [parent]).map(leaf => textOf(leaf.name));
  });
}

/**
 * 期別下拉選單的選項：該戶已存合約期款就列它的期別，還沒有（例如剛下訂）就列建案所有範本的期別。
 * @param {{ contractDocData?: object|null, templates?: Array, isPackageContract?: boolean }} source
 *   isPackageContract 未知時（例如批次新增不針對單一戶別）全部列出
 */
export function resolvePeriodOptions({ contractDocData = null, templates = [], isPackageContract } = {}) {
  const contractNames = buildContractPlan(contractDocData, { isPackageContract: isPackageContract !== false }).rows.map(row => row.period);
  const names = contractNames.length
    ? contractNames
    : (Array.isArray(templates) ? templates : [])
      .filter(template => isPackageContract !== false || template?.paymentCategory !== PACKAGE_TEMPLATE_CATEGORY)
      .flatMap(templatePeriodNames);
  return [...new Set(names.filter(Boolean))];
}

/**
 * 編輯時拆開舊資料：舊資料只有備註一欄，內容剛好等於期別名稱時視為該期別。
 * 只影響編輯時的預設值，存檔後才真的分開。
 */
export function splitPeriodAndNote(record, periodOptions = []) {
  const period = textOf(record?.period);
  const note = String(record?.note || '');
  if (period) return { period, note };
  return periodOptions.includes(note.trim()) ? { period: note.trim(), note: '' } : { period: '', note };
}

// 紀錄目前屬於哪一期；舊資料沒有期別時，備註剛好等於期別名稱就視為該期
function recordPeriodIn(record, periods) {
  const period = textOf(record?.period);
  if (period) return periods.has(period) ? period : '';
  const note = textOf(record?.note);
  return periods.has(note) ? note : '';
}

/** 還沒對應到任何合約期別的已繳款 */
export function unassignedPaidRecords(plan, records) {
  const periods = new Set(plan.rows.map(row => row.period));
  return (records || []).filter(record => isPaidRecord(record) && !recordPeriodIn(record, periods));
}

/**
 * 系統預選的期別：小訂、補足對應名稱含「訂」的期別，簽約對應名稱含「簽約」的期別。
 * 比對不到回傳空字串（不對應）。裝修期款是另一份帳，不預選。
 */
export function suggestPeriodForRecord(record, plan) {
  const text = `${textOf(record?.period)} ${textOf(record?.note)}`;
  const mainRows = plan.rows.filter(row => row.section === 'main');
  const firstWith = keyword => mainRows.find(row => row.name.includes(keyword))?.period || '';
  if (/小訂|補足|訂金|定金/.test(text)) return firstWith('訂') || firstWith('定金');
  if (text.includes('簽約')) return firstWith('簽約');
  return '';
}

/**
 * 依已繳款與預計繳款對帳，算出每期還要帶入多少。
 *   應繳＝合約金額－該期已繳－由溢繳沖抵的金額。
 * 某期繳超過的金額依序沖抵同一區其他還沒繳的期別，期款的溢繳不沖抵裝修期款。
 * @param {object} plan buildContractPlan 的結果
 * @param {Array} records 戶別 paymentRecords
 * @param {Record<string, string>} assignments 已繳款 id → 使用者在視窗內選的期別
 * @returns {{ rows: Array, overpaid: Array<{ section: string, label: string, amount: number }> }}
 *   status：new 帶入新預計／same 已帶入／changed 預計金額不同／settled 已繳清／existing 同期多筆預計或無法判斷的舊資料。
 *   只有 new、changed 可勾選；changed 只更新預計金額，已繳不動。
 */
export function reconcileContractRows(plan, records, assignments = {}) {
  const periods = new Set(plan.rows.map(row => row.period));
  const recordsByPeriod = new Map();
  (records || []).filter(Boolean).forEach((record) => {
    const assigned = isPaidRecord(record) ? assignments[record.id] : '';
    const period = recordPeriodIn(record, periods) || (periods.has(assigned) ? assigned : '');
    if (period) recordsByPeriod.set(period, [...(recordsByPeriod.get(period) || []), record]);
  });

  const overpaid = [];
  const rows = plan.sections.flatMap((section) => {
    const sectionRows = plan.rows.filter(row => row.section === section.id).map((row) => {
      const matched = recordsByPeriod.get(row.period) || [];
      const paidRecords = matched.filter(isPaidRecord);
      const plannedRecords = matched.filter(isPlannedRecord);
      const paidAmount = sumBy(paidRecords, paidAmountOf);
      return {
        ...row,
        paidRecords,
        plannedRecords,
        hasUnknownRecords: matched.length > paidRecords.length + plannedRecords.length,
        paidAmount,
        shortage: Math.max(row.amount - paidAmount, 0),
        surplus: Math.max(paidAmount - row.amount, 0),
      };
    });

    let pool = sumBy(sectionRows, row => row.surplus);
    const allocated = sectionRows.map((row) => {
      const offset = Math.min(row.shortage, pool);
      pool -= offset;
      return { ...row, offset, due: row.shortage - offset };
    });
    if (pool > 0) overpaid.push({ section: section.id, label: section.label, amount: pool });
    return allocated;
  }).map(classifyRow);

  return { rows, overpaid };
}

function classifyRow(row) {
  const { due, plannedRecords, hasUnknownRecords, paidAmount, offset } = row;
  const plannedAmount = sumBy(plannedRecords, record => Number(record.expectedAmount) || 0);
  const base = { ...row, plannedAmount, isBalance: paidAmount + offset > 0, record: plannedRecords[0] || null };
  if (due === 0) return { ...base, status: 'settled', selectable: false };
  if (plannedRecords.length > 1) return { ...base, status: 'existing', selectable: false, matchCount: plannedRecords.length };
  if (plannedRecords.length === 1) {
    return Number(plannedRecords[0].expectedAmount) === due
      ? { ...base, status: 'same', selectable: false }
      : { ...base, status: 'changed', selectable: true };
  }
  if (hasUnknownRecords) return { ...base, status: 'existing', selectable: false, matchCount: 1 };
  return { ...base, status: 'new', selectable: true };
}
