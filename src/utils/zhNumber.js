// 國字大寫金額轉換（裝修合約製作用）
// 見 docs/裝修合約製作範本-spec.md §4.2
//
// 依範例 PDF「裝修付款明細表」樣式，佰/拾/個三位固定（含零位）：
//   400 → 「肆 佰 零 拾 零 萬元整」
//    26 → 「零 佰 貳 拾 陸 萬元整」
//     5 → 「零 佰 零 拾 伍 萬元整」
// ≥1000 萬時前置仟位（「壹 仟 …」），<1000 萬不顯示仟位。

const ZH_DIGITS = ['零', '壹', '貳', '參', '肆', '伍', '陸', '柒', '捌', '玖'];

// 國字序號（一、二、…、十六）：裝修付款明細表期別編號用
const ZH_ORDINAL_DIGITS = ['零', '一', '二', '三', '四', '五', '六', '七', '八', '九'];

/**
 * 金額（萬）轉國字大寫，固定位數含零位，不含「萬元整」尾綴。
 * @param {number} amountWan 金額（萬），非整數四捨五入取整；負數/NaN 回空字串
 * @param {object} [opts]
 * @param {string} [opts.separator=' '] 位與位之間的分隔字元
 * @returns {string} 例如 '零 佰 貳 拾 陸'（26）、'肆 佰 零 拾 零'（400）
 */
export function toZhFixedWan(amountWan, opts = {}) {
  const separator = opts.separator !== undefined ? opts.separator : ' ';
  const n = Math.round(Number(amountWan));
  if (!Number.isFinite(n) || n < 0) return '';

  const units = ['', '拾', '佰', '仟', '萬', '拾', '佰', '仟'];
  const digits = String(n).split('').map(Number);   // 高位在前
  // 至少補到 3 位（個/拾/佰），超過就依實際位數（仟、萬…）
  while (digits.length < 3) digits.unshift(0);

  const parts = [];
  for (let i = 0; i < digits.length; i++) {
    const place = digits.length - 1 - i;   // 0=個位
    const zh = ZH_DIGITS[digits[i]];
    const unit = units[place] || '';
    parts.push(place === 0 ? zh : `${zh}${separator}${unit}`);
  }
  return parts.join(separator);
}

/**
 * 金額（萬）轉完整國字大寫字串（含「萬元整」）。
 * @returns {string} 例如 '零 佰 貳 拾 陸 萬元整'
 */
export function toZhWanString(amountWan, opts = {}) {
  const body = toZhFixedWan(amountWan, opts);
  if (!body) return '';
  const separator = opts.separator !== undefined ? opts.separator : ' ';
  return `${body}${separator}萬元整`;
}

/**
 * 整數轉國字序號（一、二、…、十、十一、…、二十、九十九）。
 * @param {number} n 1-based 序號
 * @returns {string} 超出 1~99 或非法值回傳阿拉伯數字字串
 */
export function toZhOrdinal(n) {
  const v = Math.round(Number(n));
  if (!Number.isFinite(v) || v < 1 || v > 99) return String(n);
  if (v < 10) return ZH_ORDINAL_DIGITS[v];
  const tens = Math.floor(v / 10);
  const ones = v % 10;
  const tensPart = tens === 1 ? '十' : `${ZH_ORDINAL_DIGITS[tens]}十`;
  return ones === 0 ? tensPart : `${tensPart}${ZH_ORDINAL_DIGITS[ones]}`;
}
