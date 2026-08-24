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
import {
  toZhWanString, toZhOrdinal,
  toZhIntDigits, toZhFloor, toZhNumberParts, toZhSlotParts,
} from '@/utils/zhNumber';
import { buildDefaultPageOptions } from '@/utils/contractDocDefaults';

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

/** 拆款表（簽約會辦單）
 *  總價基準：一般戶 = 成交總價；配套戶 = 配套房屋總價（ctx.contractTotalPrice，與期款基準一致） */
export function buildBreakdownPageData(page, ctx, priceModel, splitModel, editRows, state) {
  const opts = page.options || {};
  const contractTotal = Number(ctx.contractTotalPrice ?? ctx.totalPrice) || 0;
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
    totalPrice: contractTotal,
    housePlusLandPrice: contractTotal - (Number(ctx.parkingTotal) || 0),
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

/** 付款明細表（combined / house / land / package；金額單位元）
 *  package（配套款版）：期款取裝修期款列（decorationEditRows），單一金額欄，僅配套合約戶別適用 */
export function buildPaymentDetailPageData(page, ctx, splitModel, editRows, state, decorationEditRows = []) {
  const opts = page.options || {};
  const mode = opts.mode || 'combined';
  const isPackageMode = mode === 'package';
  const columns = isPackageMode
    ? buildInstallmentColumns(decorationEditRows, [])   // 無房土拆分：houseAmount 即期款金額
    : buildInstallmentColumns(editRows, splitModel.rows);

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

  const packageTotal = isPackageMode ? rows.reduce((s, r) => s + (Number(r.houseAmount) || 0), 0) : 0;
  const houseTotal = isPackageMode ? packageTotal : splitModel.houseSum;
  const landTotal = isPackageMode ? 0 : splitModel.landSum;
  const grandTotal = isPackageMode ? packageTotal : splitModel.amountSum;

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

/** 會辦單（拆款表）負數欄位檢查：面積 / 價款 / 付款明細不得為負。
 *  label 含「溢差」的價款項目除外（溢差價本來就可能為負）。
 *  回傳 [{ label, value }]，空陣列 = 無異常。預覽標示與下載攔截共用同一份判定。 */
export function collectBreakdownNegatives(data) {
  const found = [];
  const add = (label, value) => {
    const n = Number(value);
    if (Number.isFinite(n) && n < 0) found.push({ label, value: n });
  };
  if (!data) return found;

  // 價款相關
  add('總價', data.totalPrice);
  add('房地價款', data.housePlusLandPrice);
  add('車位價款', data.parkingTotal);
  (data.parkingSpots || []).forEach(p => add(`車位 ${p.label || ''} 價款`.trim(), p.price));
  (data.priceFields || []).forEach(f => {
    if (String(f.label || '').includes('溢差')) return;
    add(f.label, f.value);
  });

  // 面積
  const a = data.areas || {};
  const AREA_LABELS = {
    houseTotalSqm: '房屋總面積(㎡)', houseTotalPing: '房屋總面積(坪)',
    mainSqm: '主建物面積(㎡)', mainPing: '主建物面積(坪)',
    ancillarySqm: '附屬建物面積(㎡)', ancillaryPing: '附屬建物面積(坪)',
    commonSqm: '共有部份面積(㎡)', commonPing: '共有部份面積(坪)',
    exclusiveSqm: '專有部分面積(㎡)', exclusivePing: '專有部分面積(坪)',
    parkingAreaSqm: '車位面積(㎡)', parkingAreaPing: '車位面積(坪)',
    landShareSqm: '土地持分面積(㎡)', landSharePing: '土地持分面積(坪)',
    terracePing: '露臺(坪)',
  };
  Object.entries(AREA_LABELS).forEach(([key, label]) => add(label, a[key]));

  // 付款明細（各期金額 / 房屋款 / 土地款 + 合計列）
  const inst = data.installment || {};
  const addLeaf = (name, leaf) => {
    add(`期款「${name}」金額`, leaf.amount);
    add(`期款「${name}」房屋款`, leaf.houseAmount);
    add(`期款「${name}」土地款`, leaf.landAmount);
  };
  (inst.columns || []).forEach(col => {
    if (col.type === 'group') {
      (col.children || []).forEach(c => addLeaf(`${col.name}-${c.name}`, c));
    } else {
      addLeaf(col.name, col);
    }
  });
  add('付款明細 房屋款合計', inst.houseTotal);
  add('付款明細 土地款合計', inst.landTotal);
  add('付款明細 總價', inst.grandTotal);

  return found;
}

/** 繳款銀行帳戶名稱
 *  配套款銀行組（source: unit-package）僅配套合約戶別適用；一般戶即使帳戶欄位有值也不顯示 */
export function buildBankAccountsPageData(page, ctx, config, state, unitData) {
  const opts = page.options || {};
  const applicableSets = (config?.bankSets || [])
    .filter(s => s.source !== 'unit-package' || ctx.isPackageContract === true);
  const all = resolveBankSets(applicableSets, unitData || {});
  const ids = opts.bankSetIds || [];
  const sets = ids.length ? all.filter(s => ids.includes(s.id)) : all;
  return {
    unitId: ctx.unitId,
    projectName: state.projectName || '',   // QR 中央標籤（建案名 + 戶別）
    pageTitle: page.title || '',            // 頁首：建案名 戶別 頁面名稱
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
 * 合約數字對照表（富宇首馥・房地分開合約專用，docs/合約數字對照表-spec.md）
 * 每列 = cells 陣列；cell = { t, blue, bold, w }：
 *   blue = 需蓋章內容（印泥藍）；w = 相對寬度（渲染端逐列正規化）
 * ============================================================ */

const X_CH = 'Ｘ';   // 缺值佔位（照契約書格式，藍色）

function cntB(t, opts = {}) {   // 黑字（契約書印刷對照文字）
  const s = String(t ?? '');
  return { t: s, blue: false, bold: !!opts.bold, w: opts.w ?? Math.max(2.4, s.length * 1.5) };
}

function cntV(t, opts = {}) {   // 藍字（蓋章值；空值 → Ｘ）
  const s = (t === null || t === undefined || t === '') ? X_CH : String(t);
  return { t: s, blue: true, bold: true, w: opts.w ?? Math.max(3.2, s.length * 2) };
}

function cntL(t, opts = {}) {   // 列標籤
  const s = String(t ?? '');
  return { t: s, blue: false, bold: true, w: opts.w ?? Math.max(10, s.length * 1.5) };
}

/** 固定槽位數字 cells：digit(藍) 與 unit(黑) 交錯；parts=null → 每槽Ｘ */
function cntSlotCells(parts, units, warnings, warnLabel) {
  const cells = [];
  if (!parts) {
    units.forEach(u => {
      cells.push(cntV(null));
      if (u) cells.push(cntB(u));
    });
    return cells;
  }
  const digits = parts.intDigits;
  const extra = digits.length - units.length;
  if (extra > 0) {
    cells.push(cntV(digits.slice(0, extra).join('')));
    if (warnings && warnLabel) warnings.push(`「${warnLabel}」數值超出契約書欄位位數，請確認`);
  }
  digits.slice(Math.max(0, extra)).forEach((d, i) => {
    cells.push(cntV(d));
    if (units[i]) cells.push(cntB(units[i]));
  });
  return cells;
}

/** 金額列（萬、1 位小數）：intSlots=4 → 仟佰拾萬＋仟；3 → 佰拾萬＋仟 */
function cntAmountRow(label, valueWan, intSlots, warnings, labelOpts = {}) {
  const parts = toZhSlotParts(valueWan, intSlots, 1);
  const units = intSlots === 4 ? ['仟', '佰', '拾', '萬'] : ['佰', '拾', '萬'];
  const cells = [cntL(label, labelOpts)];
  cells.push(...cntSlotCells(parts, units, warnings, label));
  cells.push(parts ? cntV(parts.decText) : cntV(null));
  cells.push(cntB('仟'));
  cells.push(cntB('元整。'));
  cells.push(cntB('', { w: 14 }));
  return { cells };
}

/** 面積列（槽位式）：intSlots=3 → 佰拾＋個；2 → 拾＋個；小數 2 位；坪為數字串式 */
function cntAreaSlotRow(label, sqm, ping, intSlots, warnings) {
  const sp = toZhSlotParts(Number(sqm) > 0 ? sqm : null, intSlots, 2);
  const pp = toZhNumberParts(ping, 2);
  if (!sp) warnings.push(`「${label}」缺少平方公尺資料，請補齊戶別面積欄位`);
  const units = intSlots === 3 ? ['佰', '拾', ''] : ['拾', ''];
  const cells = [cntL(label)];
  cells.push(...cntSlotCells(sp, units, warnings, label));
  cells.push(cntB('點'));
  cells.push(sp ? cntV(sp.decText) : cntV(null));
  cells.push(cntB('平方公尺('));
  cells.push(pp ? cntV(pp.intText) : cntV(null));
  cells.push(cntB('點'));
  cells.push(pp ? cntV(pp.decText) : cntV(null));
  cells.push(cntB('坪)'));
  cells.push(cntB('', { w: 12 }));
  return { cells };
}

/** 常數列（P11 三、交屋日起【三】日內…） */
function cntConstRow(pageLabel, before, value, after) {
  return {
    cells: [
      cntL(pageLabel, { w: 10 }),
      cntB(before, { w: Math.max(6, before.length * 1.5) }),
      cntV(value, { w: 5 }),
      cntB(after, { w: Math.max(22, after.length * 1.5) }),
    ],
  };
}

/** 車位編號拆解：B4-73 → { floorZh: '肆', number: '73' }（編號原樣保留前導零） */
export function parseParkingSpotId(spotId) {
  const s = String(spotId || '').trim();
  const i = s.indexOf('-');
  if (i < 0) return { floorZh: null, number: s || null };
  const m = s.slice(0, i).match(/(\d+)/);
  return {
    floorZh: m ? toZhFloor(parseInt(m[1], 10)) : null,
    number: s.slice(i + 1) || null,
  };
}

/** 車位尺寸拆解（公分）：大數＝長、小數＝寬（公尺、去尾零）。
 *  容忍常見分隔格式：600*250、600＊250、600 X 250、600 x 250、600×250（含前後空白、全形數字） */
export function parseParkingSize(size) {
  const normalized = String(size || '')
    .replace(/[０-９]/g, ch => String.fromCharCode(ch.charCodeAt(0) - 0xFF10 + 0x30));   // 全形數字 → 半形
  const nums = normalized.split(/[*＊×xXｘＸ]/).map(v => parseFloat(v.trim())).filter(Number.isFinite);
  if (nums.length < 2) return null;
  const fmt = v => String(Math.round(v) / 100);
  return { lengthM: fmt(Math.max(nums[0], nums[1])), widthM: fmt(Math.min(nums[0], nums[1])) };
}

/** 銀行貸款期認定：指定名稱 → 含「銀行貸款」→ 含「貸款」 */
function resolveLoanAmounts(splitModel, loanItemName, warnings) {
  const rows = splitModel?.rows || [];
  const name = String(loanItemName || '').trim();
  let row = name ? rows.find(r => r.name === name) : null;
  if (name && !row) warnings.push(`找不到指定的貸款期別「${name}」，改以名稱自動比對`);
  if (!row) row = rows.find(r => String(r.name).includes('銀行貸款'));
  if (!row) row = rows.find(r => String(r.name).includes('貸款'));
  if (!row) {
    warnings.push('期款中找不到「銀行貸款」期別，貸款金額以Ｘ表示（可於範本頁面設定指定期別名稱）');
    return { house: null, land: null, total: null };
  }
  return {
    house: Number.isFinite(Number(row.houseAmount)) ? Number(row.houseAmount) : null,
    land: Number.isFinite(Number(row.landAmount)) ? Number(row.landAmount) : null,
    total: Number.isFinite(Number(row.amount)) ? Number(row.amount) : null,   // 房地合一版：整期金額
  };
}

/** 「房屋（含地下＿層編號＿號…汽車停車位）」段落 cells（多車位以「號、」串接） */
function cntHouseWithParkingCells(parsedSpots, countZh, includeCount) {
  const list = parsedSpots.length ? parsedSpots : [null];
  const cells = [cntB('房屋（含', { bold: true })];
  list.forEach((p, i) => {
    cells.push(cntB('地下'));
    cells.push(cntV(p?.floorZh));
    cells.push(cntB('層編號'));
    cells.push(cntV(p?.number));
    cells.push(cntB(i < list.length - 1 ? '號、' : '號'));
  });
  cells.push(cntB('汽車停車位）'));
  if (includeCount) {
    cells.push(cntV(countZh));
    cells.push(cntB('位'));
  }
  return cells;
}

/* ---------- 兩版本共用的前置組裝 ---------- */
function prepareCntBase(page, ctx, priceModel, splitModel, unitData, pageType) {
  const defaults = buildDefaultPageOptions(pageType);
  const opts = {
    ...defaults,
    ...(page.options || {}),
    constants: { ...defaults.constants, ...(page.options?.constants || {}) },
    pageLabels: { ...defaults.pageLabels, ...(page.options?.pageLabels || {}) },
  };
  const warnings = [];
  const d = unitData || {};
  const a = ctx.areas || {};

  // ---- 棟/樓 ----
  const building = String(d.building || '').trim() || null;
  const floorNum = parseInt(d.floor, 10);
  const floor = Number.isFinite(floorNum) ? String(floorNum) : (String(d.floor || '').trim() || null);
  if (!building || !floor) warnings.push('戶別未設定棟別/樓層（房屋編號以Ｘ表示）');

  // ---- 車位 ----
  const spots = (ctx.parkingSpots || []).map(p => {
    const parsed = parseParkingSpotId(p.spotId);
    const size = parseParkingSize(p.size);
    const type = String(p.type || '');
    const isLegal = type.includes('法定');
    const isSelf = type.includes('自設');
    if (!parsed.floorZh || !parsed.number) warnings.push(`車位「${p.spotId}」編號無法拆解為 層/號（如 B4-73）`);
    if (!size) warnings.push(`車位「${p.spotId}」尺寸無法解析（如 550*250），長寬以Ｘ表示`);
    if (!isLegal && !isSelf) warnings.push(`車位「${p.spotId}」類型非 法定/自設，勾選框留空`);
    const areaSqm = Number(p.areaSqm) > 0 ? Number(p.areaSqm) : null;
    if (!areaSqm) warnings.push(`車位「${p.spotId}」缺少面積資料`);
    return {
      ...parsed,
      lengthM: size?.lengthM ?? null,
      widthM: size?.widthM ?? null,
      checkText: isLegal ? '■法定 □自設' : isSelf ? '□法定 ■自設' : '□法定 □自設',
      areaSqm,
      areaPing: areaSqm ? Math.round(areaSqm * SQM_TO_PING * 100) / 100 : null,
      priceWan: Number.isFinite(Number(p.price)) ? Number(p.price) : null,
    };
  });
  const spotRowCount = Math.max(2, spots.length);   // 契約書固定 2 格；3 個以上動態增列
  const countZh = toZhIntDigits(spots.length) || '零';

  // ---- 價款（固定 key）----
  const fullCtx = priceModel?.fullContext || {};   // 基礎 ref + 價款公式結果（buildPriceModel）
  const errors = priceModel?.fieldValues?.errors || {};
  const priceOf = (key, label) => {
    const v = key in fullCtx ? fullCtx[key] : undefined;
    if (errors[key]) { warnings.push(`「${label}」價款公式錯誤：${errors[key]}`); return null; }
    if (!Number.isFinite(Number(v))) { warnings.push(`「${label}」無法取得金額（請確認建案價款公式含 ${key} 項目）`); return null; }
    return Number(v);
  };

  // ---- 貸款金額（拆款表期款房/土拆分的銀行貸款期）----
  const loan = resolveLoanAmounts(splitModel, opts.loanItemName, warnings);

  // ---- 專有部分（主建物＋附屬）與主建物占比 ----
  const exclusiveSqm = (Number(a.mainSqm) || 0) + (Number(a.ancillarySqm) || 0) || null;
  const exclusivePing = (Number(a.mainPing) || 0) + (Number(a.ancillaryPing) || 0) || null;
  const mainRatioText = (Number(a.mainSqm) && Number(a.houseTotalSqm))
    ? `${(Number(a.mainSqm) / Number(a.houseTotalSqm) * 100).toFixed(2)}%`
    : null;
  if (!mainRatioText) warnings.push('無法計算主建物面積占比（缺主建物/房屋總面積）');

  return {
    opts, c: opts.constants, pl: opts.pageLabels, warnings, a,
    building, floor, spots, spotRowCount, countZh,
    priceOf, loan, exclusiveSqm, exclusivePing, mainRatioText,
  };
}

/** 房屋編號 / 住家編號 列 */
function cntUnitNoRow(prep, label, prefix, fillerW) {
  return {
    cells: [
      cntL(label, { w: typeof label === 'string' && label.length > 6 ? 14 : 10 }),
      cntB(prefix), cntV(prep.building), cntB('棟第'), cntV(prep.floor), cntB('樓'),
      cntB('', { w: fillerW }),
    ],
  };
}

/** 車位－N ＋ 車位－N面積 列（末列附「以上停車位共計」） */
function cntSpotBlockRows(prep) {
  const rows = [];
  for (let i = 0; i < prep.spotRowCount; i++) {
    const p = prep.spots[i] || null;
    rows.push({
      cells: [
        cntL(i === 0 ? '車位－1:' : `停車位－${i + 1}:`),
        cntB('地下第'), cntV(p?.floorZh), cntB('層第'), cntV(p?.number), cntB('號，'),
        cntB('長為'), cntV(p?.lengthM), cntB('公尺，'), cntB('寬為'), cntV(p?.widthM), cntB('公尺'),
        p ? cntV(p.checkText, { w: 11 }) : cntV('□法定 □自設', { w: 11 }),
      ],
    });
    const sqmParts = p?.areaSqm ? toZhNumberParts(p.areaSqm, 2) : null;
    const pingParts = p?.areaPing ? toZhNumberParts(p.areaPing, 2) : null;
    const isLastSpotRow = i === prep.spotRowCount - 1;
    rows.push({
      cells: [
        cntL(`車位－${i + 1}面積`),
        sqmParts ? cntV(sqmParts.intText) : cntV(null), cntB('點'),
        sqmParts ? cntV(sqmParts.decText) : cntV(null), cntB('平方公尺('),
        pingParts ? cntV(pingParts.intText) : cntV(null), cntB('點'),
        pingParts ? cntV(pingParts.decText) : cntV(null), cntB('坪)'),
        ...(isLastSpotRow
          ? [cntB('以上停車位共計', { bold: true, w: 12 }), cntV(prep.countZh), cntB('個')]
          : [cntB('', { w: 16 })]),
      ],
    });
  }
  return rows;
}

/** 主建物占比列 */
function cntMainRatioRow(prep) {
  return {
    cells: [
      cntL('主建物面積占本房屋登記總面積之比例', { w: 30 }),
      cntV(prep.mainRatioText, { w: 9 }),
      cntB('', { w: 33 }),
    ],
  };
}

/** 土地持分面積列（含 壹拾萬分之 N） */
function cntLandShareRow(prep) {
  const a = prep.a;
  const lsSqm = toZhNumberParts(a.landShareSqm, 2);
  const lsPing = toZhNumberParts(a.landSharePing, 2);
  if (!lsSqm) prep.warnings.push('缺少土地持分面積資料');
  const ratioNum = Number(a.landShareRatio) > 0 ? toZhIntDigits(a.landShareRatio) : null;
  if (!ratioNum) prep.warnings.push('缺少土地持分比例（壹拾萬分之 N）資料');
  return {
    cells: [
      cntL('土地持分面積'),
      lsSqm ? cntV(lsSqm.intText) : cntV(null), cntB('點'),
      lsSqm ? cntV(lsSqm.decText) : cntV(null), cntB('平方公尺('),
      lsPing ? cntV(lsPing.intText) : cntV(null), cntB('點'),
      lsPing ? cntV(lsPing.decText) : cntV(null), cntB('坪)'),
      cntB('壹拾萬分之', { bold: true, w: 9 }), cntV(ratioNum, { w: 7 }),
      cntB('', { w: 8 }),
    ],
  };
}

/** 車位價款明細（（一）（二）…）；missingAsZero：無車位時金額以「零」呈現（房地合一版樣式），否則Ｘ */
function cntSpotPriceRows(prep, missingAsZero) {
  const rows = [];
  for (let i = 0; i < prep.spotRowCount; i++) {
    const p = prep.spots[i] || null;
    rows.push({
      cells: [
        cntL(`（${toZhOrdinal(i + 1)}）地下`, { w: 12 }),
        cntV(p?.floorZh), cntB('層，編號'), cntV(p?.number), cntB('號'),
        cntB('', { w: 40 }),
      ],
    });
    rows.push(cntAmountRow('新台幣', p ? p.priceWan : (missingAsZero ? 0 : null), 3, prep.warnings));
  }
  return rows;
}

/**
 * 合約數字對照表【房屋土地分開版】（富宇首馥）渲染模型（前端預覽與後端 PDF/EXCEL 共用）。
 * 價款固定取 priceFormulas 既定 key（houseAmount/exclusiveAmount/mainAmount/ancillaryAmount/commonAmount）
 * 與基礎 ref（housePrice/landPrice）；缺 key 或公式錯誤 → 該格Ｘ＋warnings。
 */
export function buildContractNumberTablePageData(page, ctx, priceModel, splitModel, unitData) {
  const prep = prepareCntBase(page, ctx, priceModel, splitModel, unitData, 'contractNumberTable');
  const { c, pl, warnings, a, spots, spotRowCount, countZh, priceOf, loan, exclusiveSqm, exclusivePing } = prep;

  /* ================= 房屋合約 ================= */
  const houseRows = [];

  houseRows.push(cntUnitNoRow(prep, '房屋編號:', '第', 46));
  houseRows.push(...cntSpotBlockRows(prep));

  // 面積區（槽位式）
  houseRows.push(cntAreaSlotRow('房屋面積共計', a.houseTotalSqm, a.houseTotalPing, 3, warnings));
  houseRows.push(cntAreaSlotRow('專有部分面積', exclusiveSqm, exclusivePing, 3, warnings));
  houseRows.push(cntAreaSlotRow('主建物面積', a.mainSqm, a.mainPing, 3, warnings));
  houseRows.push(cntAreaSlotRow('附屬建物陽台面積', a.ancillarySqm, a.ancillaryPing, 2, warnings));
  houseRows.push(cntAreaSlotRow('共有部份面積', a.commonSqm, a.commonPing, 2, warnings));
  houseRows.push(cntMainRatioRow(prep));

  // 本契約總價款 = 房屋價款（價款公式 houseAmount）＋ 車位成交價合計
  const houseAmountVal = priceOf('houseAmount', '房屋價款');
  const parkingTotalVal = Number(ctx.parkingTotal) || 0;
  houseRows.push(cntAmountRow('本契約總價款',
    houseAmountVal === null ? null : houseAmountVal + parkingTotalVal, 4, warnings));
  houseRows.push(cntAmountRow('房屋價款', houseAmountVal, 4, warnings));
  houseRows.push(cntAmountRow('專有部分價款', priceOf('exclusiveAmount', '專有部分價款'), 4, warnings));
  houseRows.push(cntAmountRow('主建物價款', priceOf('mainAmount', '主建物價款'), 4, warnings));
  houseRows.push(cntAmountRow('附屬建物陽台價款', priceOf('ancillaryAmount', '附屬建物陽台價款'), 3, warnings));
  houseRows.push(cntAmountRow('共有部份價款', priceOf('commonAmount', '共有部份價款'), 3, warnings));
  houseRows.push(cntAmountRow('車位價款', parkingTotalVal, 4, warnings));
  houseRows.push(...cntSpotPriceRows(prep, false));

  // 契約條款常數
  houseRows.push(cntConstRow(pl.handover, '三、交屋日起', c.handoverDays, '日內配合辦理交屋手續'));
  houseRows.push(cntAmountRow('貸款金額:', loan.house, 4, warnings, { w: 10 }));
  houseRows[houseRows.length - 1].cells.unshift(cntL(pl.houseLoan, { w: 8 }));
  houseRows.push(cntConstRow(pl.shorten, '2、縮短償還期限為', c.shortenYears, '年(期間不得少於七年)，'));
  houseRows.push(cntConstRow(pl.notice, '（三）買方應於接獲通知之日起', c.noticeDays, '天（不得少於三十天）'));
  houseRows.push(cntConstRow(pl.fee, '三、房屋總價款萬分之', c.feePerTenThousand, '（最高以萬分之五為限）之手續費。'));
  houseRows.push(cntConstRow(pl.housePenalty, '賠償房屋總價款百分之', c.housePenaltyPercent, '（不得低於百分之十五）之違約金。'));
  houseRows.push(cntConstRow(pl.houseForfeit, '沒收依房屋總價款百分之', c.houseForfeitPercent, '（最高不得超過百分之十五）計算之金額。'));

  // 住家編號 + 房屋（含停車位）
  houseRows.push(cntUnitNoRow(prep, pl.houseUnitNo, '住家編號：第', 34));
  houseRows.push({ cells: cntHouseWithParkingCells(spots, countZh, true) });

  /* ================= 土地合約 ================= */
  const landRows = [];

  landRows.push(cntLandShareRow(prep));
  landRows.push(cntAreaSlotRow('專有部份面積', exclusiveSqm, exclusivePing, 3, warnings));
  landRows.push(cntAmountRow('土地總價款', priceOf('landPrice', '土地總價款'), 4, warnings));
  landRows.push(cntAmountRow('貸款金額:', loan.land, 4, warnings, { w: 10 }));
  landRows[landRows.length - 1].cells.unshift(cntL(pl.landLoan, { w: 8 }));
  landRows.push(cntConstRow(pl.landPenalty, '賠償土地總價款百分之', c.landPenaltyPercent, '（不得低於百分之十五）之違約金。'));
  landRows.push(cntConstRow(pl.landForfeit, '沒收依土地總價款百分之', c.landForfeitPercent, '（最高不得超過百分之十五）計算之金額。'));
  landRows.push({
    cells: [
      cntL(pl.landUnitNo, { w: 8 }),
      cntB('住家編號：第'), cntV(prep.building), cntB('棟第'), cntV(prep.floor), cntB('樓'),
      ...cntHouseWithParkingCells(spots, countZh, false),
    ],
  });

  return {
    sections: [
      { title: '房屋合約 (一般合約)', rows: houseRows },
      { title: '土地合約', rows: landRows },
    ],
    // 舊欄位保留（後端渲染相容，避免部署空窗期間出錯）
    houseTitle: '房屋合約 (一般合約)',
    landTitle: '土地合約',
    houseRows,
    landRows,
    warnings,
  };
}

/**
 * 合約數字對照表【房屋土地合一版】（富宇學森）渲染模型。
 * 單一表格：土地持分/專有部份面積併入主表、價款加「土地總價款」、貸款金額單列（整期金額）、
 * 無土地合約區；無車位時價款金額以「零」呈現（照學森契約書樣式）。
 * 本契約總價款 = 房屋價款（houseAmount）＋土地總價款（landPrice）＋車位成交價合計。
 */
export function buildContractNumberTableCombinedPageData(page, ctx, priceModel, splitModel, unitData) {
  const prep = prepareCntBase(page, ctx, priceModel, splitModel, unitData, 'contractNumberTableCombined');
  const { c, pl, warnings, a, spots, countZh, priceOf, loan, exclusiveSqm, exclusivePing } = prep;

  const rows = [];

  rows.push(cntUnitNoRow(prep, '房屋編號:', '第', 46));
  rows.push(...cntSpotBlockRows(prep));

  // 土地持分 + 面積區（專有部份面積在契約書出現兩處，照樣重複）
  rows.push(cntLandShareRow(prep));
  rows.push(cntAreaSlotRow('專有部份面積', exclusiveSqm, exclusivePing, 3, warnings));
  rows.push(cntAreaSlotRow('房屋面積共計', a.houseTotalSqm, a.houseTotalPing, 3, warnings));
  rows.push(cntAreaSlotRow('專有部分面積', exclusiveSqm, exclusivePing, 3, warnings));
  rows.push(cntAreaSlotRow('主建物面積', a.mainSqm, a.mainPing, 3, warnings));
  rows.push(cntAreaSlotRow('附屬建物陽台面積', a.ancillarySqm, a.ancillaryPing, 2, warnings));
  rows.push(cntAreaSlotRow('共有部份面積', a.commonSqm, a.commonPing, 2, warnings));
  rows.push(cntMainRatioRow(prep));

  // 價款區
  const houseAmountVal = priceOf('houseAmount', '房屋價款');
  const landPriceVal = priceOf('landPrice', '土地總價款');
  const parkingTotalVal = Number(ctx.parkingTotal) || 0;
  rows.push(cntAmountRow('本契約總價款',
    (houseAmountVal === null || landPriceVal === null) ? null : houseAmountVal + landPriceVal + parkingTotalVal,
    4, warnings));
  rows.push(cntAmountRow('土地總價款', landPriceVal, 4, warnings));
  rows.push(cntAmountRow('房屋價款', houseAmountVal, 4, warnings));
  rows.push(cntAmountRow('專有部分價款', priceOf('exclusiveAmount', '專有部分價款'), 4, warnings));
  rows.push(cntAmountRow('主建物價款', priceOf('mainAmount', '主建物價款'), 4, warnings));
  rows.push(cntAmountRow('附屬建物陽台價款', priceOf('ancillaryAmount', '附屬建物陽台價款'), 3, warnings));
  rows.push(cntAmountRow('共有部份價款', priceOf('commonAmount', '共有部份價款'), 3, warnings));
  rows.push(cntAmountRow('車位價款', parkingTotalVal, 4, warnings));
  rows.push(...cntSpotPriceRows(prep, true));

  // 契約條款常數（貸款金額 = 銀行貸款期整期金額，房地合併）
  rows.push(cntConstRow(pl.handover, '三、交屋日起', c.handoverDays, '日內配合辦理交屋手續'));
  rows.push(cntAmountRow('貸款金額:', loan.total, 4, warnings, { w: 10 }));
  rows[rows.length - 1].cells.unshift(cntL(pl.houseLoan, { w: 8 }));
  rows.push(cntConstRow(pl.shorten, '2、縮短償還期限為', c.shortenYears, '年(期間不得少於七年)，'));
  rows.push(cntConstRow(pl.notice, '（三）買方應於接獲通知之日起', c.noticeDays, '天（不得少於三十天）'));
  rows.push(cntConstRow(pl.fee, '三、房屋總價款萬分之', c.feePerTenThousand, '（最高以萬分之五為限）之手續費。'));
  rows.push(cntConstRow(pl.housePenalty, '賠償房屋總價款百分之', c.housePenaltyPercent, '（不得低於百分之十五）之違約金。'));
  rows.push(cntConstRow(pl.houseForfeit, '沒收依房屋總價款百分之', c.houseForfeitPercent, '（最高不得超過百分之十五）計算之金額。'));

  // 住家編號 + 房屋（含停車位；本版不帶「位」數）
  rows.push(cntUnitNoRow(prep, pl.houseUnitNo, '住家編號：第', 34));
  rows.push({ cells: cntHouseWithParkingCells(spots, countZh, false) });

  return {
    sections: [{ title: '房屋土地合約（一般合約）', rows }],
    warnings,
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
