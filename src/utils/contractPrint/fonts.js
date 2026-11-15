// 字型登記：畫面顯示用 CSS 字族、輸出 PDF 用字型檔。
// 字型一律以 PostScript 名稱（ps）識別；畫面上用 @font-face local(ps) 取得同一套字。
import { reactive } from 'vue'
import fontkitModule from '@pdf-lib/fontkit'
import { openFace } from './pdfExport.js'

export const fontkit = fontkitModule

const ZH_NAMES = {
  'DFKai-SB': '標楷體',
  BiauKaiTC: '標楷體-繁',
  BiauKaiHK: '標楷體-港',
  'PingFang TC': '蘋方-繁',
  'PingFang HK': '蘋方-港',
  'PingFang SC': '蘋方-簡',
  'Songti TC': '宋體-繁',
  'Songti SC': '宋體-簡',
  'Heiti TC': '黑體-繁',
  'Heiti SC': '黑體-簡',
  'Kaiti TC': '楷體-繁',
  'Kaiti SC': '楷體-簡',
  PMingLiU: '新細明體',
  MingLiU: '細明體',
  'Microsoft JhengHei': '微軟正黑體',
  'Noto Sans TC': '思源黑體',
  'Noto Serif TC': '思源宋體',
  'Source Han Serif': '思源宋體',
  'Source Han Serif TC': '思源宋體-繁',
  'Source Han Sans TC': '思源黑體-繁',
  'LiSong Pro': '儷宋 Pro',
  'LiHei Pro': '儷黑 Pro',
  'Arial Unicode MS': 'Arial Unicode',
}

// 未取得本機字型清單前可選的常用字型（實際有安裝才列出）
const KNOWN = [
  { ps: 'DFKaiShu-SB-Estd-BF', family: 'DFKai-SB', style: 'Regular' },
  { ps: 'BiauKaiTC-Regular', family: 'BiauKaiTC', style: 'Regular' },
  { ps: 'PMingLiU', family: 'PMingLiU', style: 'Regular' },
  { ps: 'STSongti-TC-Regular', family: 'Songti TC', style: 'Regular' },
  { ps: 'STSongti-TC-Bold', family: 'Songti TC', style: 'Bold' },
  { ps: 'MicrosoftJhengHeiRegular', family: 'Microsoft JhengHei', style: 'Regular' },
  { ps: 'MicrosoftJhengHeiBold', family: 'Microsoft JhengHei', style: 'Bold' },
  { ps: 'PingFangTC-Regular', family: 'PingFang TC', style: 'Regular' },
  { ps: 'PingFangTC-Semibold', family: 'PingFang TC', style: 'Semibold' },
  { ps: 'STHeitiTC-Light', family: 'Heiti TC', style: 'Light' },
  { ps: 'STHeitiTC-Medium', family: 'Heiti TC', style: 'Medium' },
  { ps: 'ArialMT', family: 'Arial', style: 'Regular' },
  { ps: 'Arial-BoldMT', family: 'Arial', style: 'Bold' },
  { ps: 'TimesNewRomanPSMT', family: 'Times New Roman', style: 'Regular' },
  { ps: 'TimesNewRomanPS-BoldMT', family: 'Times New Roman', style: 'Bold' },
]

// 找不到指定字型時的備援（讓畫面仍接近原樣）
const FALLBACKS = [
  [/kai/i, '"DFKai-SB", "標楷體", "BiauKaiTC", "BiauKai", "Kaiti TC", serif'],
  [/ming|song|serif|times/i, '"PMingLiU", "新細明體", "Songti TC", "Times New Roman", serif'],
]
const DEFAULT_FALLBACK = '"PingFang TC", "Microsoft JhengHei", "Heiti TC", sans-serif'

export const DEFAULT_FONT = 'DFKaiShu-SB-Estd-BF'

export const fontState = reactive({
  faces: [], // { ps, family, style, source: 'known' | 'local' | 'file' }
  localSupported: typeof window !== 'undefined' && 'queryLocalFonts' in window,
  localGranted: false,
  epoch: 0, // 字型載入完成就 +1，用來讓量測結果重算
})

const fileBytes = new Map() // ps → Uint8Array（使用者載入的字型檔）
const localData = new Map() // ps → FontData（Local Font Access）
const bytesCache = new Map()
const registered = new Map() // ps → Promise<boolean>

const alias = (ps) => 'pf-' + String(ps).replace(/[^\w-]/g, '_')

export function familyLabel(family) {
  return ZH_NAMES[family] ? `${ZH_NAMES[family]}（${family}）` : family
}

export function cssFamily(ps) {
  const fb = FALLBACKS.find(([re]) => re.test(ps))?.[1] || DEFAULT_FALLBACK
  return `"${alias(ps)}", ${fb}`
}

/** 讓 ps 對應的字型可在畫面上使用；回傳是否真的找到該字型 */
export function ensureFace(ps) {
  if (!ps) return Promise.resolve(false)
  if (registered.has(ps)) return registered.get(ps)
  const p = (async () => {
    try {
      const ff = new FontFace(alias(ps), `local("${String(ps).replace(/"/g, '')}")`)
      await ff.load()
      document.fonts.add(ff)
      return true
    } catch {
      return false
    } finally {
      fontState.epoch++
    }
  })()
  registered.set(ps, p)
  return p
}

function addFace(face) {
  const i = fontState.faces.findIndex((f) => f.ps === face.ps)
  if (i < 0) fontState.faces.push(face)
  else if (face.source !== 'known') fontState.faces[i] = face
}

export async function probeKnownFonts() {
  await Promise.all(
    KNOWN.map(async (k) => {
      if (await ensureFace(k.ps)) addFace({ ...k, source: 'known' })
    }),
  )
}

async function isGranted() {
  try {
    const st = await navigator.permissions.query({ name: 'local-fonts' })
    return st.state === 'granted'
  } catch {
    return false
  }
}

/** 取得本機全部字型（Chrome／Edge）；第一次需由使用者操作觸發以顯示授權提示 */
export async function loadLocalFonts({ silent = false } = {}) {
  if (!fontState.localSupported) return false
  if (silent && !(await isGranted())) return false
  let list = []
  try {
    list = await window.queryLocalFonts()
  } catch {
    return false
  }
  if (!list.length) return false
  for (const fd of list) {
    localData.set(fd.postscriptName, fd)
    if (fileBytes.has(fd.postscriptName)) continue
    addFace({ ps: fd.postscriptName, family: fd.family, style: fd.style || 'Regular', source: 'local' })
  }
  fontState.localGranted = true
  return true
}

/** 載入字型檔（ttf／otf／ttc） */
export async function addFontFile(file) {
  const bytes = new Uint8Array(await file.arrayBuffer())
  const { face } = openFace(fontkit, bytes)
  const ps = face.postscriptName || file.name.replace(/\.\w+$/, '')
  const ff = new FontFace(alias(ps), bytes.buffer.slice(0))
  await ff.load()
  document.fonts.add(ff)
  registered.set(ps, Promise.resolve(true))
  fileBytes.set(ps, bytes)
  bytesCache.delete(ps)
  addFace({ ps, family: face.familyName || ps, style: face.subfamilyName || 'Regular', source: 'file' })
  fontState.epoch++
  return ps
}

/** 輸出 PDF 用的字型檔內容；拿不到回傳 null */
export async function fontBytes(ps) {
  if (bytesCache.has(ps)) return bytesCache.get(ps)
  let bytes = fileBytes.get(ps) || null
  if (!bytes && localData.has(ps)) {
    try {
      const blob = await localData.get(ps).blob()
      bytes = new Uint8Array(await blob.arrayBuffer())
    } catch {
      bytes = null
    }
  }
  bytesCache.set(ps, bytes)
  return bytes
}

export const hasFontSource = (ps) => fileBytes.has(ps) || localData.has(ps)

/** 依字族分組，常用中文字型排前面 */
export function familyList() {
  const map = new Map()
  for (const f of fontState.faces) {
    if (!map.has(f.family)) map.set(f.family, [])
    map.get(f.family).push(f)
  }
  const styleRank = (s) => {
    const i = ['Regular', 'Light', 'Medium', 'Semibold', 'Bold', 'Heavy'].indexOf(s)
    return i < 0 ? 99 : i
  }
  const all = [...map.entries()].map(([family, faces]) => ({
    family,
    label: familyLabel(family),
    faces: faces.sort((a, b) => styleRank(a.style) - styleRank(b.style) || a.style.localeCompare(b.style)),
  }))
  all.sort((a, b) => a.family.localeCompare(b.family))
  return {
    common: all.filter((f) => ZH_NAMES[f.family] || f.faces.some((x) => x.source === 'file')),
    others: all.filter((f) => !ZH_NAMES[f.family] && !f.faces.some((x) => x.source === 'file')),
  }
}

// ── 量測 ──
let ctx = null
const cache = new Map()
let cacheEpoch = -1

/** 文字寬度與字型上下緣（單位同 size） */
export function measure(ps, size, text) {
  const epoch = fontState.epoch // 讓 Vue 追蹤，字型載入後重算
  if (cacheEpoch !== epoch) {
    cache.clear()
    cacheEpoch = epoch
  }
  ensureFace(ps)
  const key = ps + '\u0001' + text
  let m = cache.get(key)
  if (!m) {
    if (!ctx) ctx = document.createElement('canvas').getContext('2d')
    ctx.font = `100px ${cssFamily(ps)}`
    const tm = ctx.measureText(text || '')
    m = {
      w: tm.width / 100,
      asc: (tm.fontBoundingBoxAscent ?? 88) / 100,
      desc: (tm.fontBoundingBoxDescent ?? 12) / 100,
    }
    cache.set(key, m)
  }
  return { w: m.w * size, asc: m.asc * size, desc: m.desc * size }
}

/** 拿不到字型檔時，把文字畫成 600dpi 透明圖 */
export async function rasterizeText(obj) {
  await ensureFace(obj.font)
  const k = 600 / 72
  const m = measure(obj.font, obj.size, obj.text)
  const pad = obj.size * 0.25
  const canvas = document.createElement('canvas')
  canvas.width = Math.ceil((m.w + pad * 2) * k)
  canvas.height = Math.ceil((m.asc + m.desc + pad * 2) * k)
  const c = canvas.getContext('2d')
  c.scale(k, k)
  c.font = `${obj.size}px ${cssFamily(obj.font)}`
  c.fillStyle = obj.color
  c.textBaseline = 'alphabetic'
  c.fillText(obj.text, pad, pad + m.asc)
  const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/png'))
  if (!blob) return null
  return {
    png: new Uint8Array(await blob.arrayBuffer()),
    x: obj.x - pad,
    top: obj.y - m.asc - pad,
    w: canvas.width / k,
    h: canvas.height / k,
  }
}
