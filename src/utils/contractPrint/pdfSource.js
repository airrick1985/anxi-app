// pdfjs 相關：載入、算座標矩陣、從「完成檔」抓出有顏色的文字。不碰 DOM。
import { invert } from './pdfExport.js'

const toHex = (r, g, b) => '#' + [r, g, b].map((v) => Math.round(v).toString(16).padStart(2, '0')).join('')

function fillFromArgs(args) {
  if (typeof args[0] === 'string') return args[0].toLowerCase()
  return toHex(args[0], args[1], args[2])
}

const isBlackish = (hex) => {
  const n = parseInt(hex.slice(1), 16)
  return ((n >> 16) & 255) < 48 && ((n >> 8) & 255) < 48 && (n & 255) < 48
}

export const cleanFontName = (name) => String(name || '').replace(/^[A-Z]{6}\+/, '')

/** 該頁的尺寸與「編輯器座標 → PDF 座標」矩陣 */
export async function pageGeometry(pdf, pageNo) {
  const page = await pdf.getPage(pageNo)
  const vp = page.getViewport({ scale: 1 })
  return { page, w: vp.width, h: vp.height, viewTransform: vp.transform, toPdf: invert(vp.transform) }
}

/** 該頁原有文字的基線 y（編輯器座標），拖曳吸附用 */
export async function pageBaselines(pdfjs, pdf, pageNo) {
  const { page, viewTransform } = await pageGeometry(pdf, pageNo)
  const tc = await page.getTextContent()
  const ys = new Set()
  for (const it of tc.items) {
    if (!it.str || !it.str.trim()) continue
    const t = pdfjs.Util.transform(viewTransform, it.transform)
    ys.add(Math.round(t[5] * 10) / 10)
  }
  return [...ys].sort((a, b) => a - b)
}

/**
 * 抓出一頁中非黑色的文字（填寫上去的字）。
 * 文字位置取自 getTextContent，顏色靠同一頁的繪圖指令依序對照。
 */
export async function extractColoredText(pdfjs, pdf, pageNo) {
  const { page, viewTransform } = await pageGeometry(pdf, pageNo)
  const [tc, ops] = await Promise.all([
    page.getTextContent({ disableNormalization: true }),
    page.getOperatorList(),
  ])
  const { OPS } = pdfjs

  const chars = [] // 依繪製順序的每個字與當時的填色
  let fillColor = '#000000'
  const stack = []
  for (let i = 0; i < ops.fnArray.length; i++) {
    const fn = ops.fnArray[i]
    const args = ops.argsArray[i]
    if (fn === OPS.save) stack.push(fillColor)
    else if (fn === OPS.restore) fillColor = stack.pop() ?? fillColor
    else if (fn === OPS.setFillRGBColor) fillColor = fillFromArgs(args)
    else if (fn === OPS.showText) {
      for (const g of args[0]) {
        if (!g || typeof g !== 'object' || !g.unicode) continue
        for (const ch of g.unicode) if (!/\s/.test(ch)) chars.push({ ch, color: fillColor })
      }
    }
  }

  const out = []
  let p = 0
  for (const it of tc.items) {
    const solid = [...(it.str || '')].filter((ch) => !/\s/.test(ch))
    if (!solid.length) continue
    // 順序對不上時往後找同一串字重新對齊
    if (chars[p]?.ch !== solid[0]) {
      let found = -1
      for (let q = p; q < Math.min(chars.length, p + 400) && found < 0; q++) {
        if (solid.every((ch, k) => chars[q + k]?.ch === ch)) found = q
      }
      if (found < 0) continue
      p = found
    }
    const color = chars[p].color
    p += solid.length
    if (isBlackish(color)) continue

    const t = pdfjs.Util.transform(viewTransform, it.transform)
    let fontName = ''
    try {
      fontName = cleanFontName(page.commonObjs.get(it.fontName)?.name)
    } catch {
      fontName = ''
    }
    out.push({
      page: pageNo,
      x: Math.round(t[4] * 100) / 100,
      y: Math.round(t[5] * 100) / 100,
      size: Math.round(Math.hypot(t[2], t[3]) * 100) / 100,
      text: it.str,
      color,
      font: fontName,
    })
  }
  return out
}
