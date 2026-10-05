/**
 * 公司借貸報價單計算模組
 * 獨立於戶別報價：任意借款金額（萬）＋年利率／年數／期數＋一次付清的費用明細。
 * 攤還表沿用 buildCompanyLoanSchedule（成數固定 100%、四捨五入到元）。
 */

import { buildCompanyLoanSchedule } from '@/utils/companyLoanCalculation';

export const LOAN_AMORTIZATION_TYPES = ['本息平均攤還', '本金平均攤還'];

// 費用計算方式：ratio＝借款金額×千分之 value；fixed＝固定金額 value 元
export const FEE_MODE_RATIO = 'ratio';
export const FEE_MODE_FIXED = 'fixed';

// 新表單的借款條件（範本改回「不使用」且無套用前記錄時亦同）：條件空白、帶入預設費用
export const DEFAULT_LOAN_TERMS = Object.freeze({
  annualRate: '',
  years: '',
  periods: '',
  amortizationType: '本息平均攤還',
  fees: Object.freeze([
    { name: '設定規費', mode: FEE_MODE_RATIO, value: 1 },
    { name: '謄本費', mode: FEE_MODE_FIXED, value: 160 },
    { name: '抵押權登記', mode: FEE_MODE_FIXED, value: 4000 },
    { name: '塗銷費', mode: FEE_MODE_FIXED, value: 2000 },
  ]),
});

const numOrBlank = (v) => {
  if (v === '' || v === null || v === undefined) return '';
  const n = Number(v);
  return Number.isFinite(n) ? n : '';
};

function normalizeFee(fee) {
  return {
    name: String(fee?.name ?? ''),
    mode: fee?.mode === FEE_MODE_RATIO ? FEE_MODE_RATIO : FEE_MODE_FIXED,
    value: numOrBlank(fee?.value),
  };
}

/**
 * 正規化借款條件（範本、草稿共用）：年利率／年數／期數／攤還方式／費用
 */
export function normalizeLoanTerms(raw) {
  const base = DEFAULT_LOAN_TERMS;
  if (!raw || typeof raw !== 'object') return { ...base, fees: base.fees.map(normalizeFee) };
  return {
    annualRate: numOrBlank(raw.annualRate),
    years: numOrBlank(raw.years),
    periods: numOrBlank(raw.periods),
    amortizationType: LOAN_AMORTIZATION_TYPES.includes(raw.amortizationType)
      ? raw.amortizationType
      : base.amortizationType,
    fees: Array.isArray(raw.fees) ? raw.fees.map(normalizeFee) : [],
  };
}

/**
 * 正規化建案借貸範本清單（Firestore projects/{id}.companyLoanQuoteTemplates），依名稱排序
 */
export function normalizeLoanQuoteTemplates(list) {
  if (!Array.isArray(list)) return [];
  return list
    .filter(t => t && t.id && String(t.name || '').trim())
    .map(t => ({
      ...normalizeLoanTerms(t),
      id: String(t.id),
      name: String(t.name).trim(),
      updatedBy: t.updatedBy || '',
      updatedAt: t.updatedAt || '',
    }))
    .sort((a, b) => a.name.localeCompare(b.name, 'zh-Hant'));
}

/** 單一費用金額（元，四捨五入） */
export function calcFeeAmount(fee, loanAmount) {
  const value = Number(fee?.value) || 0;
  if (value <= 0) return 0;
  return fee.mode === FEE_MODE_RATIO
    ? Math.round((Number(loanAmount) || 0) * value / 1000)
    : Math.round(value);
}

/** 費用計算方式文字（列印用） */
export function describeFeeMode(fee) {
  return fee.mode === FEE_MODE_RATIO ? `借款金額 × 千分之${fee.value || 0}` : '固定金額';
}

/**
 * 計算借貸報價
 * @param {object} form { loanAmountWan, annualRate, years, periods, amortizationType, fees }
 * @returns {{ loanAmount, fees, feeTotal, schedule, grandTotal }}
 *   schedule 為 buildCompanyLoanSchedule 結果，條件不足時為 null
 */
export function buildLoanQuote(form) {
  const loanAmount = Math.round((Number(form?.loanAmountWan) || 0) * 10000);
  const fees = (form?.fees || [])
    .map(f => ({ ...f, amount: calcFeeAmount(f, loanAmount) }));
  const feeTotal = fees.reduce((sum, f) => sum + f.amount, 0);

  // 年利率須明確輸入（0＝無息），空白時不產生攤還表
  const rawRate = form?.annualRate;
  const annualRate = rawRate === '' || rawRate === null || rawRate === undefined ? NaN : Number(rawRate);
  const schedule = loanAmount > 0 && annualRate >= 0
    ? buildCompanyLoanSchedule(loanAmount, {
        ratioPercent: 100,
        years: form.years,
        periods: form.periods,
        annualRate: annualRate || 0,
        amortizationType: form.amortizationType,
        roundingMethod: '四捨五入',
        roundingValue: 1,
      })
    : null;

  return {
    loanAmount,
    fees,
    feeTotal,
    schedule,
    grandTotal: schedule ? schedule.totals.payment + feeTotal : null,
  };
}

/**
 * 每期金額摘要：除末期外金額相同 → { fixed, last }；否則（本金平均）→ { first, last }
 */
export function summarizePayments(rows) {
  if (!rows || rows.length === 0) return null;
  const first = rows[0].payment;
  const last = rows[rows.length - 1].payment;
  const regular = rows.slice(0, -1);
  if (regular.every(r => r.payment === first)) {
    return { fixed: first, last: rows.length > 1 && last !== first ? last : null };
  }
  return { first, last };
}
