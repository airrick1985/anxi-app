// 從空白合約自動找出要填的位置：
//   金額格 —「新臺幣 __仟__佰__拾__萬__仟元整」，每個單位字前面的空白就是一格
//   勾選框 — □
// 並依旁邊的文字猜欄位。純函式（傳入 pdfjs 與文件），瀏覽器與 Node 都能跑。
import { pageGeometry } from './pdfSource.js'

const UNIT = { 元: 0, 拾: 1, 佰: 2, 仟: 3, 萬: 4, 億: 8 }
const BOX = new Set(['□', '☐'])
const isWide = (ch) => {
  const c = ch.codePointAt(0)
  return c >= 0x2e80 || (c >= 0x25a0 && c <= 0x27bf)
}

/** 逐字座標（編輯器座標：左上原點、y＝基線），依行分組 */
export async function pageChars(pdfjs, pdf, pageNo) {
  const { page, viewTransform } = await pageGeometry(pdf, pageNo)
  const tc = await page.getTextContent()
  const chars = []
  for (const it of tc.items) {
    if (!it.str || !it.width) continue
    const t = pdfjs.Util.transform(viewTransform, it.transform)
    if (Math.abs(t[1]) > 0.01 || Math.abs(t[2]) > 0.01) continue // 只處理水平文字
    const size = Math.abs(t[3])
    const list = [...it.str]
    // 項目寬度依全形 1、半形 0.5 的比例分給每個字
    const weights = list.map((ch) => (isWide(ch) ? 1 : 0.5))
    const unit = it.width / weights.reduce((a, b) => a + b, 0)
    let x = t[4]
    list.forEach((ch, i) => {
      const w = weights[i] * unit
      if (!/\s/.test(ch)) chars.push({ ch, x0: x, x1: x + w, y: t[5], size })
      x += w
    })
  }
  chars.sort((a, b) => a.y - b.y || a.x0 - b.x0)
  const lines = []
  for (const c of chars) {
    let line = lines.find((l) => Math.abs(l.y - c.y) < Math.max(l.size, c.size) * 0.3)
    if (!line) lines.push((line = { y: c.y, size: c.size, chars: [] }))
    line.chars.push(c)
  }
  lines.sort((a, b) => a.y - b.y)
  const flat = []
  lines.forEach((l, li) => {
    l.chars.sort((a, b) => a.x0 - b.x0)
    l.chars.forEach((c, ci) => flat.push({ ...c, li, ci }))
  })
  return flat
}

/** 從「元」往回找單位字，單位字前面有空白（≥0.6 字寬）的就是一格；可跨行 */
function amountRuns(flat) {
  // 每行行首 x，判斷行首是否縮排（行首空白也可能是一格）
  const left = []
  for (const c of flat) if (left[c.li] === undefined) left[c.li] = c.x0
  const indentOf = (c) => {
    const refs = [left[c.li - 1], left[c.li + 1]].filter((v) => v !== undefined)
    return refs.length ? c.x0 - Math.min(...refs) : 0
  }
  const runs = []
  const used = new Set()
  for (let k = flat.length - 1; k >= 0; k--) {
    if (flat[k].ch !== '元' || used.has(k)) continue
    const slots = []
    let base = 0
    let last = -1
    let j = k
    let firstIdx = k
    while (j >= 0) {
      const c = flat[j]
      const v = UNIT[c.ch]
      if (v === undefined) break
      let place
      if (c.ch === '萬' || c.ch === '億') {
        base = v
        place = v
      } else place = c.ch === '元' ? 0 : base + v
      if (place <= last) break
      last = place
      used.add(j)
      const prev = flat[j - 1]
      const sameLine = prev && prev.li === c.li
      const prevIsUnit = prev && UNIT[prev.ch] !== undefined
      if (sameLine) {
        if (c.x0 - prev.x1 >= c.size * 0.6) {
          // 置中於空白；空白很長（例如「新臺幣」後面）時靠近單位字
          const half = Math.min((c.x0 - prev.x1) / 2, c.size * 1.15)
          slots.push({ place, x: c.x0 - half, y: c.y, size: c.size })
          firstIdx = j
        }
      } else if (c.ch !== '元') {
        // 行首的單位字：行首有縮排＝空白在這一行；否則空白落在上一行行尾
        const indent = indentOf(c)
        if (indent >= c.size * 0.6) {
          slots.push({ place, x: c.x0 - Math.min(indent / 2, c.size * 1.15), y: c.y, size: c.size })
          firstIdx = j
        } else if (prevIsUnit && prev.li === c.li - 1) {
          slots.push({ place, x: prev.x1 + c.size * 0.75, y: prev.y, size: c.size })
          firstIdx = j
        }
      }
      if (!prev || (!sameLine && !(prevIsUnit && prev.li === c.li - 1))) break
      j--
    }
    if (slots.length < 2) continue
    // 第一格前面的文字（同一行；第一格在行首時連上一行）用來猜欄位
    const head = flat[firstIdx]
    const atLineStart = !flat[firstIdx - 1] || flat[firstIdx - 1].li !== head.li
    const before = flat
      .filter((c, i) => i < firstIdx && (c.li === head.li || (atLineStart && c.li === head.li - 1)))
      .map((c) => c.ch)
      .join('')
    runs.push({ slots, before })
  }
  return runs.reverse()
}

function guessAmountField(text, fields) {
  let best = null
  for (const f of fields) {
    if (f.type !== 'money') continue
    for (const kw of [f.label, ...(f.aliases || [])]) {
      const i = text.lastIndexOf(kw)
      if (i < 0) continue
      const end = i + kw.length
      if (!best || end > best.end || (end === best.end && kw.length > best.len)) best = { key: f.key, end, len: kw.length }
    }
  }
  return best && text.length - best.end <= 8 ? best.key : null
}

function checkboxes(flat, fields) {
  const out = []
  const choices = fields.filter((f) => f.options?.length)
  for (let k = 0; k < flat.length; k++) {
    const c = flat[k]
    if (!BOX.has(c.ch)) continue
    let follow = ''
    for (let j = k + 1; j < flat.length && follow.length < 14; j++) {
      if (BOX.has(flat[j].ch)) break
      follow += flat[j].ch
    }
    let match = null
    for (const f of choices) {
      for (const opt of f.options) {
        if (!follow.startsWith(opt)) continue
        if (!match || opt.length > match.value.length) match = { field: f.key, value: opt }
      }
    }
    out.push({ x: (c.x0 + c.x1) / 2, y: c.y - c.size * 0.18, size: c.size, li: c.li, match })
  }
  // 「其他」這類短選項容易誤判：只有前一個勾選框（兩行內）屬於同一欄位時才採用
  out.forEach((b, i) => {
    if (!b.match || b.match.value.length >= 3) return
    const prev = out[i - 1]
    const ok = prev?.match && prev.match.value.length >= 3 && prev.match.field === b.match.field && b.li - prev.li <= 2
    if (!ok) b.match = null
  })
  return out
}

/**
 * 偵測一頁。回傳候選：
 *   { kind: 'digit', x, y, size, place, field|null, row }  x 為該格中心
 *   { kind: 'check', x, y, size, when|null }               x 為框中心
 */
export async function detectPage(pdfjs, pdf, pageNo, fields) {
  const flat = await pageChars(pdfjs, pdf, pageNo)
  const out = []
  amountRuns(flat).forEach((run, ri) => {
    const field = guessAmountField(run.before, fields)
    for (const s of run.slots) out.push({ kind: 'digit', ...s, field, row: ri })
  })
  for (const b of checkboxes(flat, fields)) {
    out.push({ kind: 'check', x: b.x, y: b.y, size: b.size, when: b.match })
  }
  return out
}
