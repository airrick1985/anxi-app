// 把文字物件疊到原 PDF 上輸出。純函式，不碰 DOM（瀏覽器與 Node 都能跑）。
// 每個物件依字型狀況擇一輸出：
//   text    — 內嵌子集字型（可選取、可搜尋）
//   outline — 轉外框向量路徑（CFF／可變字型／字型集，或使用者指定）
//   raster  — 600dpi 透明圖（拿不到字型檔，或字型缺字時）
import {
  PDFDocument,
  rgb,
  pushGraphicsState,
  popGraphicsState,
  concatTransformationMatrix,
  setFillingColor,
  beginText,
  endText,
  setFontAndSize,
  setTextMatrix,
  showText,
  moveTo,
  lineTo,
  appendBezierCurve,
  closePath,
  fill,
  drawObject,
} from 'pdf-lib'

// PDF 矩陣 [a b c d e f]：先套 m2 再套 m1
export function mul(m1, m2) {
  return [
    m1[0] * m2[0] + m1[2] * m2[1],
    m1[1] * m2[0] + m1[3] * m2[1],
    m1[0] * m2[2] + m1[2] * m2[3],
    m1[1] * m2[2] + m1[3] * m2[3],
    m1[0] * m2[4] + m1[2] * m2[5] + m1[4],
    m1[1] * m2[4] + m1[3] * m2[5] + m1[5],
  ]
}

export function invert(m) {
  const det = m[0] * m[3] - m[1] * m[2]
  return [
    m[3] / det,
    -m[1] / det,
    -m[2] / det,
    m[0] / det,
    (m[2] * m[5] - m[3] * m[4]) / det,
    (m[1] * m[4] - m[0] * m[5]) / det,
  ]
}

function hexToRgb(hex) {
  const h = String(hex || '#000000').replace('#', '')
  const n = parseInt(h.length === 3 ? h.replace(/./g, (c) => c + c) : h, 16) || 0
  return rgb(((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255)
}

// 從字型檔取出要用的字體；字型集（TTC）依 PostScript 名稱挑
export function openFace(fontkit, bytes, postscriptName) {
  const f = fontkit.create(bytes)
  if (!f.fonts) return { face: f, collection: false }
  let face = null
  if (postscriptName) {
    try {
      face = f.getFont(postscriptName)
    } catch {
      face = null
    }
  }
  return { face: face || f.fonts[0], collection: true }
}

function hasAllGlyphs(face, text) {
  for (const ch of text) {
    if (/\s/.test(ch)) continue
    if (!face.hasGlyphForCodePoint(ch.codePointAt(0))) return false
  }
  return true
}

function canEmbed(face) {
  const tables = face.directory?.tables || {}
  return !!tables.glyf && !tables.fvar
}

function outlineOps(face, text, size, matrix, color) {
  const s = size / face.unitsPerEm
  const run = face.layout(text)
  const ops = [pushGraphicsState(), concatTransformationMatrix(...matrix), setFillingColor(color)]
  let penX = 0
  let drew = false
  run.glyphs.forEach((glyph, i) => {
    const pos = run.positions[i]
    const ox = penX + (pos.xOffset || 0)
    const oy = pos.yOffset || 0
    let cx = 0
    let cy = 0
    for (const { command, args } of glyph.path.commands) {
      if (command === 'moveTo') {
        cx = args[0]
        cy = args[1]
        ops.push(moveTo((ox + cx) * s, (oy + cy) * s))
      } else if (command === 'lineTo') {
        cx = args[0]
        cy = args[1]
        ops.push(lineTo((ox + cx) * s, (oy + cy) * s))
      } else if (command === 'quadraticCurveTo') {
        const [qx, qy, x, y] = args
        const c1x = cx + (2 / 3) * (qx - cx)
        const c1y = cy + (2 / 3) * (qy - cy)
        const c2x = x + (2 / 3) * (qx - x)
        const c2y = y + (2 / 3) * (qy - y)
        ops.push(appendBezierCurve((ox + c1x) * s, (oy + c1y) * s, (ox + c2x) * s, (oy + c2y) * s, (ox + x) * s, (oy + y) * s))
        cx = x
        cy = y
      } else if (command === 'bezierCurveTo') {
        const [x1, y1, x2, y2, x, y] = args
        ops.push(appendBezierCurve((ox + x1) * s, (oy + y1) * s, (ox + x2) * s, (oy + y2) * s, (ox + x) * s, (oy + y) * s))
        cx = x
        cy = y
      } else if (command === 'closePath') {
        ops.push(closePath())
      }
      drew = true
    }
    penX += pos.xAdvance || 0
  })
  if (drew) ops.push(fill())
  ops.push(popGraphicsState())
  return ops
}

/**
 * @param {object} o
 * @param {object} o.fontkit            fontkit 實例
 * @param {Uint8Array} o.srcBytes       原 PDF
 * @param {number[]} [o.pageNumbers]    要輸出的頁（1 起算）；不給＝全部
 * @param {Record<number, number[]>} o.toPdf  各頁「編輯器座標（左上原點、pt）→ PDF 座標」矩陣
 * @param {Array} o.objects             { page, x, y(基線), size, text, color, font }
 * @param {Record<string, {bytes?: Uint8Array, ps?: string}>} o.fonts
 * @param {boolean} [o.outline]         一律轉外框
 * @param {(obj) => Promise<{png: Uint8Array, x: number, top: number, w: number, h: number}|null>} [o.rasterize]
 * @returns {Promise<{bytes: Uint8Array, stats: {text: number, outline: number, raster: number, skipped: number}}>}
 */
export async function buildPdf({ fontkit, srcBytes, pageNumbers, toPdf, objects, fonts, outline = false, rasterize }) {
  const doc = await PDFDocument.load(srcBytes, { ignoreEncryption: true })
  const faces = new Map() // fontId → { face, bytes, collection } | null
  const byBytes = new Map() // Uint8Array → face（給 pdf-lib 內嵌時取用）
  doc.registerFontkit({ create: (data) => byBytes.get(data) || fontkit.create(data) })

  const faceOf = (fontId) => {
    if (faces.has(fontId)) return faces.get(fontId)
    let entry = null
    const src = fonts?.[fontId]
    if (src?.bytes) {
      try {
        const { face, collection } = openFace(fontkit, src.bytes, src.ps || fontId)
        entry = { face, collection, bytes: src.bytes, embedded: null }
        byBytes.set(src.bytes, face)
      } catch (e) {
        console.warn('字型無法解析', fontId, e)
      }
    }
    faces.set(fontId, entry)
    return entry
  }

  const stats = { text: 0, outline: 0, raster: 0, skipped: 0 }
  const pages = doc.getPages()
  const wanted = new Set(pageNumbers?.length ? pageNumbers : pages.map((_, i) => i + 1))

  for (const obj of objects) {
    if (!wanted.has(obj.page) || !obj.text || !obj.text.trim()) continue
    const page = pages[obj.page - 1]
    const base = toPdf[obj.page]
    if (!page || !base) {
      stats.skipped++
      continue
    }
    const color = hexToRgb(obj.color)
    const entry = faceOf(obj.font)
    const usable = entry && hasAllGlyphs(entry.face, obj.text)

    if (usable && !outline && canEmbed(entry.face)) {
      try {
        if (!entry.embedded) entry.embedded = await doc.embedFont(entry.bytes, { subset: true })
        const font = entry.embedded
        const key = page.node.newFontDictionary(font.name, font.ref)
        const m = mul(base, [1, 0, 0, -1, obj.x, obj.y])
        page.pushOperators(
          pushGraphicsState(),
          beginText(),
          setFillingColor(color),
          setFontAndSize(key, obj.size),
          setTextMatrix(...m),
          showText(font.encodeText(obj.text)),
          endText(),
          popGraphicsState(),
        )
        stats.text++
        continue
      } catch (e) {
        console.warn('內嵌字型失敗，改用外框', obj.font, e)
      }
    }

    if (usable) {
      try {
        const m = mul(base, [1, 0, 0, -1, obj.x, obj.y])
        page.pushOperators(...outlineOps(entry.face, obj.text, obj.size, m, color))
        stats.outline++
        continue
      } catch (e) {
        console.warn('轉外框失敗，改用圖片', obj.font, e)
      }
    }

    const img = rasterize ? await rasterize(obj) : null
    if (!img) {
      stats.skipped++
      continue
    }
    const png = await doc.embedPng(img.png)
    const name = page.node.newXObject('OvImg', png.ref)
    const m = mul(base, [img.w, 0, 0, -img.h, img.x, img.top + img.h])
    page.pushOperators(pushGraphicsState(), concatTransformationMatrix(...m), drawObject(name), popGraphicsState())
    stats.raster++
  }

  for (let i = pages.length; i >= 1; i--) if (!wanted.has(i)) doc.removePage(i - 1)
  return { bytes: await doc.save(), stats }
}

/** 多份 PDF 依序合併成一份（批次輸出每筆資料用） */
export async function mergePdfs(list) {
  const out = await PDFDocument.create()
  for (const bytes of list) {
    const src = await PDFDocument.load(bytes)
    const pages = await out.copyPages(src, src.getPageIndices())
    pages.forEach((p) => out.addPage(p))
  }
  return out.save()
}
