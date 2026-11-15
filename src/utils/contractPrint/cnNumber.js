// 阿拉伯數字 → 國字大寫，以及變數文字的格式化。純函式。

export const CN_DIGITS = '零壹貳參肆伍陸柒捌玖'
const UNITS = ['', '拾', '佰', '仟']
const BIG = ['', '萬', '億', '兆']

/** 位數名稱：0＝個位、3＝仟位、4＝萬位、7＝仟萬位 */
export const PLACES = ['個', '拾', '佰', '仟', '萬', '拾萬', '佰萬', '仟萬', '億', '拾億', '佰億', '仟億']

export function toNumber(v) {
  if (v === '' || v == null) return null
  const n = typeof v === 'number' ? v : Number(String(v).replace(/[,\s]/g, ''))
  return Number.isFinite(n) ? n : null
}

const intDigits = (n) => Math.trunc(Math.abs(n)).toLocaleString('en-US', { useGrouping: false })

function readInt(s) {
  if (/^0*$/.test(s)) return '零'
  const groups = []
  for (let i = s.length; i > 0; i -= 4) groups.unshift(s.slice(Math.max(0, i - 4), i))
  let out = ''
  let zero = false
  groups.forEach((g, gi) => {
    if (Number(g) === 0) {
      if (out) zero = true
      return
    }
    const digits = g.padStart(4, '0')
    for (let i = 0; i < 4; i++) {
      const d = Number(digits[i])
      if (d === 0) {
        if (out) zero = true
        continue
      }
      if (zero) out += '零'
      zero = false
      out += CN_DIGITS[d] + UNITS[3 - i]
    }
    out += BIG[groups.length - 1 - gi]
  })
  return out
}

/** 完整國字大寫：35370000 → 參仟伍佰參拾柒萬；10500 → 壹萬零伍佰；1 → 壹 */
export function cnNumber(value) {
  const n = toNumber(value)
  if (n == null) return ''
  if (n < 0) return '負' + cnNumber(-n)
  const [, frac = ''] = String(n).split('.')
  const int = readInt(intDigits(n))
  return frac ? int + '點' + [...frac].map((d) => CN_DIGITS[Number(d)]).join('') : int
}

const LOWER_DIGITS = '〇一二三四五六七八九'
const LOWER_UNITS = ['', '十', '百', '千']

/** 國字小寫（整數，樓層等用）：2 → 二、10 → 十、12 → 十二、105 → 一百〇五 */
export function cnNumberLower(value) {
  const n = toNumber(value)
  if (n == null) return ''
  const v = Math.trunc(Math.abs(n))
  if (v === 0) return '〇'
  if (v >= 10000) return String(v)
  const digits = String(v).padStart(4, '0')
  let out = ''
  let zero = false
  for (let i = 0; i < 4; i++) {
    const d = Number(digits[i])
    if (d === 0) {
      if (out) zero = true
      continue
    }
    if (zero) out += '〇'
    zero = false
    out += LOWER_DIGITS[d] + LOWER_UNITS[3 - i]
  }
  return (n < 0 ? '負' : '') + out.replace(/^一十/, '十')
}

/** 從樓層文字取出數字：B2 → 2、3F → 3、地下12層 → 12；全形數字也可 */
export function floorNumber(value) {
  const s = String(value ?? '').replace(/[０-９]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0xfee0))
  const m = s.match(/\d+/)
  return m ? Number(m[0]) : null
}

/** 國字金額：35370000 → 參仟伍佰參拾柒萬元整 */
export function cnMoney(value) {
  const n = toNumber(value)
  if (n == null) return ''
  return cnNumber(Math.round(n)) + '元整'
}

/**
 * 單一位數的國字：給逐格填寫的金額用。
 * 比最高位還高的格子填 lead（預設「零」，與範本一致）。
 */
export function cnDigitAt(value, place, lead = '零') {
  const n = toNumber(value)
  if (n == null) return ''
  const v = Math.trunc(Math.abs(n))
  if (v < 10 ** place) return lead
  return CN_DIGITS[Math.floor(v / 10 ** place) % 10]
}

/** 依格式把欄位值轉成要印的文字 */
export function formatValue(value, bind, field) {
  if (value == null || value === '') return ''
  const dp = bind.dp ?? field?.dp
  switch (bind.fmt) {
    case 'digit':
      return cnDigitAt(value, bind.place ?? 0, bind.lead ?? '零')
    case 'cnum':
      return cnNumber(value)
    case 'cnumLower':
      return cnNumberLower(value)
    case 'cmoney':
      return cnMoney(value)
    case 'comma': {
      const n = toNumber(value)
      if (n == null) return String(value)
      return n.toLocaleString('en-US', dp == null ? { maximumFractionDigits: 4 } : { minimumFractionDigits: dp, maximumFractionDigits: dp })
    }
    case 'number': {
      const n = toNumber(value)
      if (n == null) return String(value)
      return dp == null ? String(n) : n.toFixed(dp)
    }
    case 'floorNum':
    case 'floorZh':
    case 'floorZhLower': {
      const n = floorNumber(value)
      if (n == null) return String(value)
      if (bind.fmt === 'floorNum') return String(n)
      return bind.fmt === 'floorZh' ? cnNumber(n) : cnNumberLower(n)
    }
    default:
      return String(value)
  }
}

export const FORMATS = {
  text: '原樣',
  number: '數字',
  comma: '千分位',
  digit: '國字（單一位數）',
  cnum: '國字大寫',
  cnumLower: '國字小寫',
  cmoney: '國字金額（元整）',
  floorNum: '數字（B2→2）',
  floorZh: '國字大寫（B2→貳）',
  floorZhLower: '國字小寫（B2→二）',
}

export function formatsFor(field) {
  if (!field) return []
  if (field.type === 'money') return ['digit', 'cnum', 'cmoney', 'comma', 'number', 'text']
  if (field.type === 'number') return ['number', 'comma', 'cnum', 'cnumLower', 'digit', 'text']
  if (field.floor) return ['text', 'floorNum', 'floorZh', 'floorZhLower']
  return ['text']
}

/**
 * 逐格金額的位數檢查：有非零的位數沒有格子可放（例如總價破億、或有百位數），
 * 或有小數，回傳 true。
 */
export function digitOverflow(value, places) {
  const n = toNumber(value)
  if (n == null) return false
  if (!Number.isInteger(n)) return true
  const s = intDigits(n)
  for (let i = 0; i < s.length; i++) {
    const place = s.length - 1 - i
    if (s[i] !== '0' && !places.has(place)) return true
  }
  return false
}
