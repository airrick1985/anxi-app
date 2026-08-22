/**
 * 公司借貸攤還表計算模組
 * 供「報價設定畫面預覽」與「列印報價單(含期款)」共用。
 * 規格見 docs/公司借貸期款設定-spec.md 第 3 節。
 */

import { applyNewRounding } from '@/utils/paymentCalculation';

/**
 * 產生公司借貸攤還表
 * @param {number} totalPrice - 報價總價（元）
 * @param {object} loanConfig - 借貸參數
 *   { ratioPercent, years, periods, annualRate, amortizationType, roundingMethod, roundingValue }
 * @returns {{
 *   loanAmount: number,          // 借貸金額（總價×成數，套用範本進位）
 *   intervalMonths: number,      // 每期間隔月數 = years*12/periods
 *   periodRate: number,          // 單期利率（小數）= annualRate% × years / periods
 *   rows: Array<{ period, principal, interest, payment, remaining }>,
 *   totals: { principal, interest, payment }
 * } | null} 參數不足時回傳 null
 */
export function buildCompanyLoanSchedule(totalPrice, loanConfig) {
    if (!loanConfig || !totalPrice || totalPrice <= 0) return null;

    const ratioPercent = Number(loanConfig.ratioPercent) || 0;
    const years = Number(loanConfig.years) || 0;
    const periods = Math.floor(Number(loanConfig.periods)) || 0;
    const annualRate = Number(loanConfig.annualRate) || 0;

    if (ratioPercent <= 0 || years <= 0 || periods <= 0) return null;

    // 借貸金額：總價×成數，套用範本設定的進位方式與精度
    const loanAmount = applyNewRounding(
        totalPrice * ratioPercent / 100,
        loanConfig.roundingMethod || '四捨五入',
        loanConfig.roundingValue || 1
    );
    if (loanAmount <= 0) return null;

    const intervalMonths = years * 12 / periods;
    // 單期利率：年利率按實際期間換算（例：年利率2.5%、每3個月一期 → 0.625%/期）
    const periodRate = (annualRate / 100) * years / periods;

    const rows = [];
    let remaining = loanAmount;

    if (loanConfig.amortizationType === '本息平均攤還') {
        // 年金法：每期金額固定；利率 0 時退化為本金均分
        const pmt = periodRate > 0
            ? Math.round(loanAmount * periodRate / (1 - Math.pow(1 + periodRate, -periods)))
            : Math.round(loanAmount / periods);

        for (let k = 1; k <= periods; k++) {
            const interest = Math.round(remaining * periodRate);
            let principal;
            if (k === periods) {
                // 末期本金吸收尾差，確保本金合計＝借貸金額
                principal = remaining;
            } else {
                principal = pmt - interest;
            }
            remaining -= principal;
            rows.push({
                period: k,
                principal,
                interest,
                payment: principal + interest,
                remaining,
            });
        }
    } else {
        // 本金平均攤還（預設）：每期本金固定，利息按剩餘本金遞減
        const basePrincipal = Math.round(loanAmount / periods);

        for (let k = 1; k <= periods; k++) {
            const interest = Math.round(remaining * periodRate);
            // 末期本金吸收尾差
            const principal = (k === periods) ? remaining : basePrincipal;
            remaining -= principal;
            rows.push({
                period: k,
                principal,
                interest,
                payment: principal + interest,
                remaining,
            });
        }
    }

    const totalInterest = rows.reduce((sum, r) => sum + r.interest, 0);

    return {
        loanAmount,
        intervalMonths,
        periodRate,
        rows,
        totals: {
            principal: loanAmount,
            interest: totalInterest,
            payment: loanAmount + totalInterest,
        },
    };
}
