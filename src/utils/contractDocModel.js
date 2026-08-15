// 合約製作資料範本：各頁面「渲染資料模型」組裝
// 前端預覽與後端 PDF/EXCEL payload 共用同一份模型（docs/合約製作資料範本-spec.md §4、§7）。
//
// 輸入：
//   ctx     — buildUnitDocContext() 的戶別 context
//   config  — contractDocConfigs/{projectId} 設定
//   state   — Dialog 內的即時狀態（期款列、填寫值、條款勾選…）

import {
  buildContractBaseContext,
  computeContractPriceFields,
  computeInstallmentSplit,
} from '@/composables/usePriceFormula';
import { resolveBankSets } from '@/utils/unitDocContext';
import { toZhWanString, toZhOrdinal } from '@/utils/zhNumber';

export const SQM_TO_PING = 0.3025;

export function sqmToPing(sqm) {
  const n = Number(sqm);
  if (!Number.isFinite(n) || n === 0) return null;
  return Math.round(n * SQM_TO_PING * 100) / 100;
}

/** 期款編輯列（group/single）攤平成葉列 [{ name, amount, percent, groupName }] */
export function flattenEditRows(editRows = []) {
  const rows = [];
  for (const r of editRows) {
    if (r.type === 'group') {
      (r.children || []).forEach(c => rows.push({
        name: c.name,
        seq: c.seq ?? null,
        amount: Math.round(Number(c.amount)) || 0,
        percent: null,
        groupName: r.name,
        groupPercent: Number(r.percent) || 0,
      }));
    } else {
      rows.push({
        name: r.name,
        seq: null,
        amount: Math.round(Number(r.amount)) || 0,
        percent: Number(r.percent) || 0,
        groupName: null,
        groupPercent: null,
      });
    }
  }
  return rows;
}

/**
 * 價款計算（房土比 + 合約價款項目）。
 * @returns {{ baseContext, baseError, fieldValues: {values, errors}, fullContext }}
 */
export function buildPriceModel(unitData, priceFormulaSettings, config, options = {}) {
  const { context: baseContext, error: baseError } = buildContractBaseContext(unitData, priceFormulaSettings, options);
  const fieldValues = computeContractPriceFields(config?.priceFormulas || [], baseContext);
  return {
    baseContext,
    baseError,
    fieldValues,
    fullContext: { ...baseContext, ...fieldValues.values },
  };
}

/**
 * 期款房/土拆分（葉列 → landAmount/houseAmount）。
 */
export function buildSplitModel(editRows, config, fullContext) {
  const leaves = flattenEditRows(editRows);
  const split = computeInstallmentSplit(leaves, config?.installmentSplitRules || {}, fullContext);
  const landSum = split.reduce((s, r) => s + (r.landAmount || 0), 0);
  const houseSum = split.reduce((s, r) => s + (r.houseAmount || 0), 0);
  const amountSum = split.reduce((s, r) => s + (r.amount || 0), 0);
  const landTarget = Number(fullContext?.landPrice) || 0;
  return {
    rows: split,
    landSum, houseSum, amountSum,
    landTarget,
    landOk: Math.abs(landSum - landTarget) < 0.05,
  };
}

/** 拆款表付款明細「欄」結構：single → 單欄；group → 多子欄（供橫式表頭） */
export function buildInstallmentColumns(editRows = [], splitRows = []) {
  const splitByName = Object.fromEntries(splitRows.map(r => [r.name, r]));
  const columns = [];
  for (const r of editRows) {
    if (r.type === 'group') {
      columns.push({
        type: 'group',
        name: r.name,
        percent: Number(r.percent) || 0,
        children: (r.children || []).map(c => {
          const s = splitByName[c.name] || {};
          return {
            name: c.name,
            seq: c.seq ?? null,
            amount: Math.round(Number(c.amount)) || 0,
            houseAmount: s.houseAmount ?? (Math.round(Number(c.amount)) || 0),
            landAmount: s.landAmount ?? 0,
          };
        }),
      });
    } else {
      const s = splitByName[r.name] || {};
      columns.push({
        type: 'single',
        name: r.name,
        percent: Number(r.percent) || 0,
        amount: Math.round(Number(r.amount)) || 0,
        houseAmount: s.houseAmount ?? (Math.round(Number(r.amount)) || 0),
        landAmount: s.landAmount ?? 0,
      });
    }
  }
  return columns;
}

/** 磋商條款：依戶別條件自動預選（isDefault 或條件相符） */
export function defaultSelectedClauseIds(clauseLibrary = [], ctx = {}) {
  const buyerType = ctx.isFirstTimeBuyer ? '首購' : '非首購';
  const isStore = (ctx.propertyType || '') === '店面';
  return clauseLibrary
    .filter(c => {
      if (c.isDefault) return true;
      if (!c.condition) return false;
      if (c.condition === '店面') return isStore;
      return c.condition === buyerType;
    })
    .map(c => c.id);
}

/* ============================================================
 * 各頁面渲染模型
 * ============================================================ */

/** 拆款表（簽約會辦單） */
export function buildBreakdownPageData(page, ctx, priceModel, splitModel, editRows, state) {
  const opts = page.options || {};
  const landTotal = splitModel.landSum;
  const houseTotal = splitModel.houseSum;
  const columns = buildInstallmentColumns(editRows, splitModel.rows);
  const selectedClauses = (state.selectedClauseIds || []);
  const priceFields = (state.configPriceFormulas || [])
    .filter(f => f.showOnPage !== false)
    .map(f => ({
      key: f.key,
      label: f.label,
      value: priceModel.fieldValues.values[f.key],
      error: priceModel.fieldValues.errors[f.key] || null,
    }));

  return {
    headerTitle: opts.headerTitle || '簽約會辦單',
    projectName: state.projectName || '',
    unitId: ctx.unitId,
    buyerName: ctx.buyerName,
    buyerIdNumber: ctx.buyerIdNumber,
    buyerPhone: ctx.buyerPhone,
    address: ctx.buyerMailingAddress,
    signDate: state.signDateText || '',
    totalPrice: ctx.totalPrice,
    housePlusLandPrice: (Number(ctx.totalPrice) || 0) - (Number(ctx.parkingTotal) || 0),
    parkingTotal: ctx.parkingTotal,
    parkingSpots: ctx.parkingSpots,
    areas: {
      ...ctx.areas,
      parkingAreaSqm: ctx.parkingAreaSqm || null,
      parkingAreaPing: sqmToPing(ctx.parkingAreaSqm),
      mainRatioText: (Number(ctx.areas?.mainSqm) && Number(ctx.areas?.houseTotalSqm))
        ? `${(Number(ctx.areas.mainSqm) / Number(ctx.areas.houseTotalSqm) * 100).toFixed(2)}%`
        : '',
      exclusiveSqm: (Number(ctx.areas?.mainSqm) || 0) + (Number(ctx.areas?.ancillarySqm) || 0) || null,
      exclusivePing: (Number(ctx.areas?.mainPing) || 0) + (Number(ctx.areas?.ancillaryPing) || 0) || null,
    },
    housePriceRatio: ctx.housePriceRatio,
    landPriceRatio: ctx.landPriceRatio,
    priceFields,
    installment: {
      columns,
      houseTotal,
      landTotal,
      grandTotal: splitModel.amountSum,
    },
    remark: state.breakdownRemark || '',
    clauses: (state.clauseLibrary || []).filter(c => selectedClauses.includes(c.id)),
    freeFields: (opts.freeFields || []).map(f => ({
      key: f.key, label: f.label, type: f.type,
      value: state.freeFieldValues?.[f.key] ?? f.default ?? '',
    })),
    signFields: (opts.signFields || []).map(f => ({
      label: f.label,
      value: f.source === 'salesperson' ? ctx.salespersonText : (state.signFieldValues?.[f.label] ?? f.default ?? ''),
      readonly: f.source === 'salesperson',
    })),
  };
}

/** 付款明細表（combined / house / land；金額單位元） */
export function buildPaymentDetailPageData(page, ctx, splitModel, editRows, state) {
  const opts = page.options || {};
  const mode = opts.mode || 'combined';
  const columns = buildInstallmentColumns(editRows, splitModel.rows);

  // 展開為列（母項含直排群組）
  const rows = [];
  for (const col of columns) {
    if (col.type === 'group') {
      col.children.forEach((c, idx) => rows.push({
        groupName: col.name,
        groupSize: col.children.length,
        groupIndex: idx,
        seq: c.seq,
        name: c.name,
        houseAmount: c.houseAmount,
        landAmount: c.landAmount,
      }));
    } else {
      rows.push({
        groupName: null, groupSize: 0, groupIndex: 0, seq: null,
        name: col.name,
        houseAmount: col.houseAmount,
        landAmount: col.landAmount,
      });
    }
  }

  const houseTotal = splitModel.houseSum;
  const landTotal = splitModel.landSum;
  const grandTotal = splitModel.amountSum;

  return {
    projectName: state.projectName || '',
    unitId: ctx.unitId,
    mode,
    showSignColumn: opts.showSignColumn !== false,
    noteText: opts.noteText || '',
    rows,
    houseTotal,
    landTotal,
    grandTotal,
    // 單頁版的總價基準
    pageTotal: mode === 'house' ? houseTotal : mode === 'land' ? landTotal : grandTotal,
  };
}

/** 繳款銀行帳戶名稱 */
export function buildBankAccountsPageData(page, ctx, config, state, unitData) {
  const opts = page.options || {};
  const all = resolveBankSets(config?.bankSets || [], unitData || {});
  const ids = opts.bankSetIds || [];
  const sets = ids.length ? all.filter(s => ids.includes(s.id)) : all;
  return {
    unitId: ctx.unitId,
    projectName: state.projectName || '',   // QR 中央標籤（建案名 + 戶別）
    bankSets: sets,
    showQr: opts.showQr !== false,
    qrLabel: opts.qrLabel || '請填寫客戶資料卡',
    qrUrl: state.qrUrl || '',
  };
}

/** 合約加註 */
export function buildContractNotesPageData(page, state) {
  const opts = page.options || {};
  return {
    notes: (state.contractNotes || []).map(n => ({
      id: n.id,
      content: n.content,
      fontSize: Number(n.fontSize) || Number(opts.defaultFontSize) || 10,
    })),
    showBuyerSignLine: opts.showBuyerSignLine !== false,
    defaultFontSize: Number(opts.defaultFontSize) || 10,
  };
}

/* ============================================================
 * 裝修合約頁（僅配套合約戶別，docs/裝修合約製作範本-spec.md §4）
 * ============================================================ */

/** 裝修工程會辦單（範例 PDF 第 2 頁）：無車位/土地/價款公式區，付款明細單列無房土拆分 */
export function buildDecorationBreakdownPageData(page, ctx, decorationEditRows, state) {
  const opts = page.options || {};
  const columns = buildInstallmentColumns(decorationEditRows, []);
  const grandTotal = flattenEditRows(decorationEditRows).reduce((s, r) => s + r.amount, 0);

  return {
    headerTitle: opts.headerTitle || '裝修工程會辦單',
    projectName: state.projectName || '',
    unitId: ctx.unitId,
    buyerName: ctx.buyerName,
    buyerIdNumber: ctx.buyerIdNumber,
    buyerPhone: ctx.buyerPhone,
    address: ctx.buyerMailingAddress,
    signDate: state.signDateText || '',
    totalPrice: ctx.packagePrice,           // 配套價格（萬）
    areas: {
      ...ctx.areas,
      mainRatioText: (Number(ctx.areas?.mainSqm) && Number(ctx.areas?.houseTotalSqm))
        ? `${(Number(ctx.areas.mainSqm) / Number(ctx.areas.houseTotalSqm) * 100).toFixed(2)}%`
        : '',
      exclusiveSqm: (Number(ctx.areas?.mainSqm) || 0) + (Number(ctx.areas?.ancillarySqm) || 0) || null,
      exclusivePing: (Number(ctx.areas?.mainPing) || 0) + (Number(ctx.areas?.ancillaryPing) || 0) || null,
    },
    installment: {
      rowLabel: '裝修工程款',
      columns,
      grandTotal,
    },
    remark: state.decorationRemark || '',
    signFields: (opts.signFields || []).map(f => ({
      label: f.label,
      value: f.source === 'salesperson' ? ctx.salespersonText : (state.signFieldValues?.[f.label] ?? f.default ?? ''),
      readonly: f.source === 'salesperson',
    })),
  };
}

/** 裝修付款明細表（範例 PDF 第 4 頁）：期別國字序號 + 金額國字大寫（萬元整） */
export function buildDecorationPaymentDetailPageData(page, ctx, decorationEditRows, state) {
  const opts = page.options || {};
  const leaves = flattenEditRows(decorationEditRows);
  const total = leaves.reduce((s, r) => s + r.amount, 0);

  return {
    headerTitle: opts.headerTitle || '裝修付款明細表',
    siteLabel: opts.siteLabel || '工地名稱',
    unitLabel: opts.unitLabel || '房屋代號',
    projectName: state.projectName || '',
    unitId: ctx.unitId,
    total,
    zhTotal: toZhWanString(total),
    rows: leaves.map((r, idx) => ({
      seq: idx + 1,
      zhSeq: toZhOrdinal(idx + 1),
      name: r.name,
      amount: r.amount,
      zhAmount: toZhWanString(r.amount),
    })),
    noteText: opts.noteText || '',
  };
}

/* ============================================================
 * 頁面清單（config.pages + 戶別 pageOverrides 合併）
 * ============================================================ */
export function mergePagesWithOverrides(configPages = [], pageOverrides = {}) {
  const pages = configPages.map((p, idx) => {
    const ov = pageOverrides?.[p.id] || {};
    return {
      ...p,
      enabled: ov.enabled !== undefined ? ov.enabled : p.enabled !== false,
      repeatCount: ov.repeatCount !== undefined ? ov.repeatCount : (p.repeatCount || 1),
      pageCopies: ov.pageCopies !== undefined ? ov.pageCopies : (p.pageCopies || 1),
      _order: ov.order !== undefined ? ov.order : idx,
    };
  });
  pages.sort((a, b) => a._order - b._order);
  return pages;
}

export function pagesToOverrides(pages = [], configPages = []) {
  const overrides = {};
  const byId = Object.fromEntries(configPages.map((p, idx) => [p.id, { page: p, idx }]));
  pages.forEach((p, idx) => {
    const orig = byId[p.id];
    if (!orig) return;
    const ov = {};
    const origEnabled = orig.page.enabled !== false;
    if (p.enabled !== origEnabled) ov.enabled = p.enabled;
    if ((p.repeatCount || 1) !== (orig.page.repeatCount || 1)) ov.repeatCount = p.repeatCount;
    if ((p.pageCopies || 1) !== (orig.page.pageCopies || 1)) ov.pageCopies = p.pageCopies;
    if (idx !== orig.idx) ov.order = idx;
    if (Object.keys(ov).length) overrides[p.id] = ov;
  });
  return overrides;
}
