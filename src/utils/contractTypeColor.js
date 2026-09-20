// 固定常用合約配色；自訂名稱依名稱取色，請佣／退佣及方案切換皆一致。
const CONTRACT_TYPE_COLORS = new Map([
  ['一般合約', 'blue-darken-2'],
  ['毛胚合約', 'orange-darken-3'],
  ['配套合約', 'teal-darken-2'],
  ['裝修合約', 'purple-darken-2'],
  ['其他合約', 'brown-darken-1'],
  ['未設定合約方式', 'grey-darken-1'],
]);
const CUSTOM_CONTRACT_COLORS = ['indigo', 'pink-darken-2', 'cyan-darken-3', 'green-darken-2', 'deep-orange-darken-2', 'deep-purple'];
export function contractTypeColor(contractType) {
  const name = String(contractType || '').trim() || '未設定合約方式';
  if (CONTRACT_TYPE_COLORS.has(name)) return CONTRACT_TYPE_COLORS.get(name);
  const hash = Array.from(name).reduce((value, char) => (value * 31 + char.codePointAt(0)) >>> 0, 0);
  return CUSTOM_CONTRACT_COLORS[hash % CUSTOM_CONTRACT_COLORS.length];
}
