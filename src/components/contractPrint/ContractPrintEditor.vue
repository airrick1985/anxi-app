<script setup>
import { computed, markRaw, nextTick, onBeforeUnmount, onMounted, reactive, ref, shallowRef, watch } from 'vue'
import {
  mdiAlignHorizontalCenter,
  mdiAlignHorizontalLeft,
  mdiAlignHorizontalRight,
  mdiAlignVerticalBottom,
  mdiAlignVerticalCenter,
  mdiAlignVerticalTop,
  mdiAlertCircleOutline,
  mdiAutoFix,
  mdiCheckCircleOutline,
  mdiChevronLeft,
  mdiClose,
  mdiCogOutline,
  mdiChevronRight,
  mdiCloudUploadOutline,
  mdiContentCopy,
  mdiCursorDefaultOutline,
  mdiDistributeHorizontalCenter,
  mdiDistributeVerticalCenter,
  mdiFileDocumentMultipleOutline,
  mdiFileImportOutline,
  mdiFormTextbox,
  mdiFormatAlignCenter,
  mdiFormatAlignLeft,
  mdiFormatAlignRight,
  mdiFormatText,
  mdiFormatUnderline,
  mdiGroup,
  mdiMagnet,
  mdiMinus,
  mdiPlus,
  mdiPrinterOutline,
  mdiRedo,
  mdiTrashCanOutline,
  mdiTrayArrowDown,
  mdiUndo,
  mdiUngroup,
  mdiVariable,
} from '@mdi/js'
import { alignMoves, distributeMoves, intersects, snapAxis, union } from '@/utils/contractPrint/geometry.js'
import { extractColoredText, pageBaselines, pageGeometry } from '@/utils/contractPrint/pdfSource.js'
import { buildPdf } from '@/utils/contractPrint/pdfExport.js'
import { FORMATS, PLACES, digitOverflow, formatValue, formatsFor, toNumber } from '@/utils/contractPrint/cnNumber.js'
import { detectPage } from '@/utils/contractPrint/detect.js'
import { getPdfjs, openPdfBytes } from '@/utils/contractPrint/pdfjsLoader.js'
import { groupFields, valueAt } from '@/utils/contractPrint/fields.js'
import { getContractPrintTemplate, getContractPrintTemplatePdf, saveContractPrintTemplate } from '@/api'
import McIcon from './McIcon.js'
import ContractPrintPages from './ContractPrintPages.vue'
import {
  DEFAULT_FONT,
  addFontFile,
  cssFamily,
  ensureFace,
  familyList,
  fontBytes,
  fontState,
  fontkit,
  hasFontSource,
  loadLocalFonts,
  measure,
  probeKnownFonts,
  rasterizeText,
} from '@/utils/contractPrint/fonts.js'

// 合約套印編輯器：範本（物件位置＋欄位綁定）疊在空白合約 PDF 上，以本戶資料預覽、列印、存 PDF。
// canEdit＝false 時只能預覽與輸出，不能改範本。
const props = defineProps({
  templateId: { type: String, required: true },
  detect: Boolean, // 新建立的範本：載入後自動偵測全部頁
  canEdit: Boolean,
  values: { type: Object, default: () => ({}) }, // 本戶欄位值（buildPrintValues）
  fields: { type: Array, default: () => [] }, // 欄位定義（系統＋建案自訂）
  unitLabel: { type: String, default: '' },
})
const emit = defineEmits(['back', 'close', 'detected', 'settings'])

const SWATCHES = ['#0000ff', '#000000', '#ff0000', '#008000']
const ANCHOR_K = { start: 0, middle: 0.5, end: 1 }

const uid = () => Math.random().toString(36).slice(2, 10)
const r2 = (n) => Math.round(n * 100) / 100
const r1 = (n) => Math.round(n * 10) / 10
const clamp = (n, lo, hi) => Math.min(hi, Math.max(lo, n))

// ── 狀態 ──
const tpl = ref(null) // { id, name, pdfName }
const loadError = ref('')
const doc = shallowRef(null) // { name, bytes, pdf }
const pageNo = ref(1)
const pg = shallowRef(null) // { w, h }
const pageBase = shallowRef([]) // 原 PDF 文字基線（吸附用）
const zoom = ref(1.5)
// { id, page, x, y(基線), size, text, color, font, group, anchor?, bind?: {field, fmt, place?, lead?}, when?: {field, value}, todo? }
// anchor：x 是文字的左端／中點／右端；bind：由資料帶入；when：欄位等於某值才印
// todo：自動偵測到但還沒設定欄位／條件（不輸出）
const objects = ref([])
// 已刪除的頁（原始頁碼）：PDF 不變，編輯、換頁與輸出都略過這些頁，可在「頁面」還原
const removedPages = ref([])
const showPages = ref(false)
const sel = ref([])
const tool = ref('select') // select | text | field
const insertKey = ref('') // 插入欄位工具目前選的欄位
const snapOn = ref(true)
const markVars = ref(true)
const scope = ref('all') // all | page
const busy = ref(false)
const toast = ref('')
const editing = ref(null) // { id, value, isNew }
const marquee = ref(null)
const guides = ref([])
const lastStyle = reactive({ font: DEFAULT_FONT, size: 14, color: '#0000ff' })

const stageEl = ref(null)
const canvasEl = ref(null)
const svgEl = ref(null)
const editEl = ref(null)
const importInput = ref(null)
const fontInput = ref(null)

let toastTimer = 0
function say(msg) {
  toast.value = msg
  clearTimeout(toastTimer)
  toastTimer = setTimeout(() => (toast.value = ''), 2600)
}

// ── 資料來源：本戶欄位值 ──
let pdfjs = null
const curValues = computed(() => props.values || {})
const fieldMap = computed(() => Object.fromEntries(props.fields.map((f) => [f.key, f])))
const fieldGroups = computed(() => groupFields(props.fields))
const isListField = (key) => !!fieldMap.value[key]?.list

const removedSet = computed(() => new Set(removedPages.value))
const keptPages = computed(() =>
  doc.value ? Array.from({ length: doc.value.pdf.numPages }, (_, i) => i + 1).filter((n) => !removedSet.value.has(n)) : [],
)
/** 未刪除頁面上的物件 */
const liveObjects = computed(() => objects.value.filter((o) => !removedSet.value.has(o.page)))
const pagePos = computed(() => keptPages.value.indexOf(pageNo.value) + 1)

const condOk = (o, values) =>
  !o.when?.field || String(valueAt(values, o.when.field, o.when.index) ?? '') === String(o.when.value ?? '')

/** 物件在本戶資料下要印的文字；hidden＝條件不成立 */
function evalObj(o, values) {
  if (o.todo) return { text: '', hidden: true }
  const text = o.bind
    ? (o.bind.field ? formatValue(valueAt(values, o.bind.field, o.bind.index), o.bind, fieldMap.value[o.bind.field]) : '')
    : o.text
  return { text, hidden: !condOk(o, values) }
}
function placeholderOf(o) {
  if (o.bind?.fmt === 'digit') return PLACES[o.bind.place ?? 0]
  if (!o.bind) return o.text || ' '
  return `〔${fieldMap.value[o.bind.field]?.label || '未設定'}〕`
}

/** 依閱讀順序（由上而下、由左而右）排序 */
function readingOrder(list) {
  return [...list].sort((a, b) => (Math.abs(a.y - b.y) < Math.max(a.size, b.size) * 0.4 ? a.x - b.x : a.y - b.y))
}

/** 逐格金額有沒有放不下的位數；回傳欄位名稱 */
function overflowFields(values) {
  const places = new Map() // field|page → Set
  for (const o of liveObjects.value) {
    if (o.bind?.fmt !== 'digit' || !o.bind.field || o.todo || !condOk(o, values)) continue
    const k = o.bind.field + '|' + (o.bind.index || 1) + '|' + o.page
    if (!places.has(k)) places.set(k, new Set())
    places.get(k).add(o.bind.place ?? 0)
  }
  const bad = new Set()
  for (const [k, set] of places) {
    const [field, index] = k.split('|')
    if (digitOverflow(valueAt(values, field, index), set)) bad.add(fieldMap.value[field]?.label || field)
  }
  return [...bad]
}
const issues = computed(() => overflowFields(curValues.value))

/** 資料面板顯示用：金額千分位、清單欄位以頓號串接 */
function displayValue(f) {
  const raw = curValues.value[f.key]
  const one = (v) => {
    if (v == null || v === '') return ''
    if (f.type === 'money' && toNumber(v) != null) return toNumber(v).toLocaleString('en-US')
    if (f.type === 'number' && f.dp != null && toNumber(v) != null) return toNumber(v).toFixed(f.dp)
    return String(v)
  }
  if (Array.isArray(raw)) return raw.map(one).filter(Boolean).join('、')
  return one(raw)
}
/** 範本有用到、但本戶沒有值的欄位 */
const missingFields = computed(() => {
  const used = new Map()
  for (const o of liveObjects.value) {
    if (o.todo) continue
    if (o.bind?.field) used.set(o.bind.field + '|' + (o.bind.index || 1), o)
    if (o.when?.field) used.set(o.when.field + '|' + (o.when.index || 1), o)
  }
  const out = []
  for (const k of used.keys()) {
    const [field, index] = k.split('|')
    if (fieldMap.value[field]?.optional) continue
    const v = valueAt(curValues.value, field, index)
    if (v === '' || v == null) {
      const label = fieldMap.value[field]?.label || field
      out.push(isListField(field) && Number(index) > 1 ? `${label}（第 ${index} 筆）` : label)
    }
  }
  return [...new Set(out)]
})

// ── 衍生資料 ──
const pageObjs = computed(() => objects.value.filter((o) => o.page === pageNo.value))
const selSet = computed(() => new Set(sel.value))
const selObjs = computed(() => pageObjs.value.filter((o) => selSet.value.has(o.id)))

/** 有最大寬度（maxW）時，文字太長就縮小字級以放進格子 */
function fitSize(o, text) {
  if (!o.maxW || !text) return o.size
  const w = measure(o.font, o.size, text).w
  return w > o.maxW ? Math.round(o.size * (o.maxW / w) * 100) / 100 : o.size
}

/** 畫面上顯示的文字：沒有值時顯示欄位名稱、條件不成立時淡化 */
const view = computed(() => {
  const map = {}
  for (const o of pageObjs.value) {
    const r = evalObj(o, curValues.value)
    const empty = !r.text
    // 沒有值時以縮小的欄位名稱提示位置（不輸出）
    const small = empty && !!o.bind
    const text = empty ? placeholderOf(o) : r.text
    map[o.id] = { text, ghost: r.hidden || empty, out: r.hidden ? '' : r.text, size: small ? o.size * 0.55 : fitSize(o, text), todo: !!o.todo }
  }
  return map
})

function boxOf(o) {
  const m = measure(o.font, view.value[o.id]?.size ?? o.size, view.value[o.id]?.text || ' ')
  const w = Math.max(m.w, o.size * 0.3)
  return { x: o.x - w * (ANCHOR_K[o.anchor] || 0), y: o.y - m.asc, w, h: m.asc + m.desc, base: o.y }
}
const boxes = computed(() => {
  const map = {}
  for (const o of pageObjs.value) map[o.id] = boxOf(o)
  return map
})

function makeUnit(members, grouped) {
  const b = union(members.map((o) => boxes.value[o.id]))
  return { ...b, base: Math.max(...members.map((o) => o.y)), objs: members, grouped }
}
/** 選取內容拆成單位：整組都被選到的群組算一個，其餘各算一個 */
function unitsOf(ids) {
  const set = new Set(ids)
  const groups = new Map()
  const units = []
  for (const o of pageObjs.value) {
    if (!set.has(o.id)) continue
    const whole = o.group && pageObjs.value.every((x) => x.group !== o.group || set.has(x.id))
    if (whole) {
      if (!groups.has(o.group)) groups.set(o.group, [])
      groups.get(o.group).push(o)
    } else units.push(makeUnit([o], false))
  }
  for (const members of groups.values()) units.push(makeUnit(members, members.length > 1))
  return units
}
const selUnits = computed(() => unitsOf(sel.value))
const selBox = computed(() => union(selUnits.value))
// 只選到一個群組時，對齊／分散作用在群組內的成員
const arrangeUnits = computed(() => {
  const us = selUnits.value
  if (us.length === 1 && us[0].objs.length > 1) return us[0].objs.map((o) => makeUnit([o], false))
  return us
})
const canGroup = computed(() => selObjs.value.length > 1 && !(selUnits.value.length === 1 && selUnits.value[0].grouped))
const canUngroup = computed(() => selObjs.value.some((o) => o.group))

const common = (key) => {
  const os = selObjs.value
  if (!os.length) return null
  const v = os[0][key]
  return os.every((o) => o[key] === v) ? v : null
}

// ── 歷史紀錄／自動儲存 ──
let hist = ['[]']
let hi = 0
const histTick = ref(0)
const canUndo = computed(() => (histTick.value, hi > 0))
const canRedo = computed(() => (histTick.value, hi < hist.length - 1))

// 存到 Firestore contractPrintTemplates/{id}：停手 0.8 秒後送出，依序排隊避免舊的蓋掉新的
const saveState = ref('') // '' | saving | saved | error
let saveTimer = 0
let dirty = false
let saveChain = Promise.resolve()
function persist() {
  if (!tpl.value || !props.canEdit) return
  dirty = true
  clearTimeout(saveTimer)
  saveTimer = setTimeout(flushSave, 800)
}
function flushSave() {
  clearTimeout(saveTimer)
  saveChain = saveChain.then(async () => {
    if (!dirty || !tpl.value) return
    dirty = false
    saveState.value = 'saving'
    try {
      await saveContractPrintTemplate(tpl.value.id, { objects: objects.value })
      saveState.value = dirty ? 'saving' : 'saved'
    } catch {
      dirty = true
      saveState.value = 'error'
    }
  })
  return saveChain
}
// 關閉分頁前還有沒存的修改：先送出，並請瀏覽器提示
function onBeforeUnload(e) {
  if (!dirty) return
  flushSave()
  e.preventDefault()
  e.returnValue = ''
}
function commit() {
  const json = JSON.stringify(objects.value)
  if (json === hist[hi]) return
  hist.splice(hi + 1)
  hist.push(json)
  if (hist.length > 200) hist.shift()
  hi = hist.length - 1
  histTick.value++
  persist()
}
let commitTimer = 0
function commitSoon() {
  clearTimeout(commitTimer)
  commitTimer = setTimeout(commit, 400)
}
function resetHistory() {
  hist = [JSON.stringify(objects.value)]
  hi = 0
  histTick.value++
}
function travel(step) {
  clearTimeout(commitTimer)
  commit()
  const next = hi + step
  if (next < 0 || next >= hist.length) return
  hi = next
  objects.value = JSON.parse(hist[hi])
  const alive = new Set(objects.value.map((o) => o.id))
  sel.value = sel.value.filter((id) => alive.has(id))
  histTick.value++
  persist()
}

// ── 載入範本 ──
async function load() {
  try {
    pdfjs = await getPdfjs()
    const t = await getContractPrintTemplate(props.templateId)
    const bytes = await getContractPrintTemplatePdf(t)
    const pdf = await openPdfBytes(bytes)
    tpl.value = { id: t.id, name: t.name, pdfName: t.pdfName }
    doc.value = markRaw({ name: t.pdfName || 'blank.pdf', bytes, pdf })
    objects.value = Array.isArray(t.objects) ? t.objects : []
    removedPages.value = Array.isArray(t.removedPages) ? t.removedPages.filter((n) => n >= 1 && n <= pdf.numPages) : []
    sel.value = []
    resetHistory()
    const first = liveObjects.value.length ? Math.min(...liveObjects.value.map((o) => o.page)) : keptPages.value[0] || 1
    pageNo.value = clamp(first, 1, pdf.numPages)
    await showPage(true)
    if (props.detect && props.canEdit) {
      emit('detected')
      await detectAll()
    }
  } catch (err) {
    console.error(err)
    loadError.value = '範本無法開啟'
  }
}

async function importFilled(bytes) {
  const pdf = await openPdfBytes(bytes)
  const added = []
  const pages = Math.min(pdf.numPages, doc.value.pdf.numPages)
  for (let n = 1; n <= pages; n++) {
    if (removedSet.value.has(n)) continue
    for (const t of await extractColoredText(pdfjs, pdf, n)) {
      added.push({ ...t, id: uid(), size: r1(t.size), font: t.font || DEFAULT_FONT, group: null })
    }
  }
  pdf.destroy()
  objects.value.push(...added)
  sel.value = added.filter((o) => o.page === pageNo.value).map((o) => o.id)
  commit()
  return added.length
}
async function onImportFile(e) {
  const file = e.target.files?.[0]
  e.target.value = ''
  if (!file || !doc.value) return
  const n = await importFilled(new Uint8Array(await file.arrayBuffer()))
  say(n ? `已匯入 ${n} 個文字` : '找不到彩色文字')
}

// ── 自動偵測（金額格、勾選框） ──
function centerX(o) {
  const text = evalObj(o, curValues.value).text || placeholderOf(o)
  const w = measure(o.font, o.size, text).w
  return o.x - w * (ANCHOR_K[o.anchor] || 0) + w / 2
}
/**
 * 偵測指定頁並加入物件；已經有東西的位置不重複產生，
 * 但原本待設定的格子若這次猜得到欄位／條件（例如剛新增了欄位），就補上
 */
async function detectPages(pages) {
  const fields = props.fields
  const added = []
  let updated = 0
  for (const n of pages) {
    const cands = await detectPage(pdfjs, doc.value.pdf, n, fields)
    const existing = objects.value.filter((o) => o.page === n).map((o) => ({ o, x: centerX(o), y: o.y, size: o.size }))
    const rowGroup = {}
    for (const c of cands) {
      const hit = existing.find((e) => Math.abs(e.y - c.y) < c.size * 0.5 && Math.abs(e.x - c.x) < c.size * 0.6)
      if (hit) {
        const o = hit.o
        if (o.todo && c.kind === 'digit' && c.field && o.bind && !o.bind.field) {
          o.bind.field = c.field
          delete o.todo
          updated++
        } else if (o.todo && c.kind === 'check' && c.when && !o.bind) {
          o.when = { ...c.when }
          delete o.todo
          updated++
        }
        continue
      }
      const base = { id: uid(), page: n, x: r2(c.x), y: r2(c.y), size: r1(c.size), color: '#0000ff', font: DEFAULT_FONT, anchor: 'middle', group: null }
      if (c.kind === 'digit') {
        rowGroup[c.row] ??= uid()
        added.push({
          ...base,
          text: '',
          group: rowGroup[c.row],
          bind: { field: c.field || '', fmt: 'digit', place: c.place, lead: '零' },
          ...(c.field ? {} : { todo: true }),
        })
      } else {
        added.push({ ...base, text: 'V', ...(c.when ? { when: { ...c.when } } : { todo: true }) })
      }
    }
  }
  if (added.length) objects.value.push(...added)
  if (added.length || updated) commit()
  const rows = new Set(added.filter((o) => o.bind).map((o) => o.group)).size
  const checks = added.filter((o) => !o.bind).length
  const todo = added.filter((o) => o.todo).length
  return { added: added.length, updated, rows, checks, todo }
}
function detectMsg(r) {
  if (!r.added && !r.updated) return '沒有找到新的位置'
  const parts = []
  if (r.rows) parts.push(`金額 ${r.rows} 列`)
  if (r.checks) parts.push(`勾選框 ${r.checks} 個`)
  if (r.updated) parts.push(`補上欄位 ${r.updated} 格`)
  return `已偵測：${parts.join('、')}` + (r.todo ? `（待設定 ${r.todo}）` : '')
}
async function detectAll() {
  busy.value = true
  try {
    say(detectMsg(await detectPages(keptPages.value)))
    // 本頁沒有偵測到東西時，跳到第一個有的頁面
    if (!pageObjs.value.length && liveObjects.value.length) gotoPage(Math.min(...liveObjects.value.map((o) => o.page)))
  } finally {
    busy.value = false
  }
}
async function detectCurrent() {
  if (!doc.value || busy.value) return
  say(detectMsg(await detectPages([pageNo.value])))
}

// 待設定：點一下選取本頁的；再點跳到下一頁有待設定的
const todoCount = computed(() => liveObjects.value.filter((o) => o.todo).length)
function gotoTodo() {
  const here = pageObjs.value.filter((o) => o.todo).map((o) => o.id)
  const allSelected = here.length && here.every((id) => selSet.value.has(id)) && sel.value.length === here.length
  if (here.length && !allSelected) {
    sel.value = here
    tool.value = 'select'
    return
  }
  const pages = [...new Set(liveObjects.value.filter((o) => o.todo).map((o) => o.page))].sort((a, b) => a - b)
  if (!pages.length) return
  const next = pages.find((p) => p > pageNo.value) ?? pages[0]
  gotoPage(next)
  sel.value = objects.value.filter((o) => o.todo && o.page === next).map((o) => o.id)
  tool.value = 'select'
}

async function goBack() {
  commitEdit()
  await flushSave()
  emit('back')
}
async function close() {
  commitEdit()
  await flushSave()
  emit('close')
}

async function onFontFile(e) {
  const file = e.target.files?.[0]
  e.target.value = ''
  if (!file) return
  try {
    const ps = await addFontFile(file)
    if (selObjs.value.length) {
      setProp('font', ps)
      commit()
    }
  } catch {
    say('字型檔無法讀取')
  }
}
async function moreFonts() {
  if (!(await loadLocalFonts())) say('無法取得本機字型')
}

// ── 頁面顯示 ──
let renderSeq = 0
let renderTask = null
async function renderCanvas() {
  if (!doc.value || !pg.value) return
  const seq = ++renderSeq
  const { page } = await pageGeometry(doc.value.pdf, pageNo.value)
  let scale = zoom.value * (window.devicePixelRatio || 1)
  const px = pg.value.w * pg.value.h * scale * scale
  if (px > 24e6) scale *= Math.sqrt(24e6 / px)
  const vp = page.getViewport({ scale })
  const off = document.createElement('canvas')
  off.width = Math.ceil(vp.width)
  off.height = Math.ceil(vp.height)
  renderTask?.cancel()
  renderTask = page.render({ canvasContext: off.getContext('2d'), viewport: vp })
  try {
    await renderTask.promise
  } catch {
    return
  }
  if (seq !== renderSeq || !canvasEl.value) return
  canvasEl.value.width = off.width
  canvasEl.value.height = off.height
  canvasEl.value.getContext('2d').drawImage(off, 0, 0)
}

function fitWidth() {
  if (!pg.value || !stageEl.value) return
  zoom.value = clamp(r2((stageEl.value.clientWidth - 56) / pg.value.w), 0.25, 6)
}

async function showPage(fit = false) {
  if (!doc.value) return
  const geo = await pageGeometry(doc.value.pdf, pageNo.value)
  pg.value = { w: geo.w, h: geo.h }
  pageBase.value = await pageBaselines(pdfjs, doc.value.pdf, pageNo.value)
  await nextTick()
  if (fit) {
    fitWidth()
    zoom.value = Math.min(zoom.value, 1.8)
  }
  await renderCanvas()
}

function gotoPage(n) {
  if (!doc.value || !keptPages.value.length) return
  let next = clamp(Math.round(Number(n)) || 1, 1, doc.value.pdf.numPages)
  // 已刪除的頁：改到後面最近的頁，沒有就前面最近的
  if (removedSet.value.has(next)) next = keptPages.value.find((p) => p > next) ?? keptPages.value.at(-1)
  if (next === pageNo.value) return
  commitEdit()
  sel.value = []
  pageNo.value = next
  showPage()
}
/** 以「第幾頁（未刪除頁中的順序）」換頁 */
function gotoPagePos(pos) {
  const list = keptPages.value
  if (!list.length) return
  gotoPage(list[clamp(Math.round(Number(pos)) || 1, 1, list.length) - 1])
}

async function savePages(list) {
  showPages.value = false
  const removed = [...new Set(list)].sort((a, b) => a - b)
  if (removed.length >= doc.value.pdf.numPages) return
  removedPages.value = removed
  sel.value = []
  if (removedSet.value.has(pageNo.value)) {
    const next = keptPages.value.find((p) => p > pageNo.value) ?? keptPages.value.at(-1)
    pageNo.value = next
    showPage()
  }
  saveState.value = 'saving'
  try {
    await saveContractPrintTemplate(tpl.value.id, { removedPages: removed })
    saveState.value = 'saved'
    say(removed.length ? `已刪除 ${removed.length} 頁` : '已還原全部頁面')
  } catch {
    saveState.value = 'error'
    say('儲存失敗')
  }
}


let zoomTimer = 0
watch(zoom, () => {
  clearTimeout(zoomTimer)
  zoomTimer = setTimeout(renderCanvas, 120)
})
function setZoom(z, anchor) {
  const old = zoom.value
  const next = clamp(r2(z), 0.25, 6)
  if (next === old) return
  zoom.value = next
  if (anchor && stageEl.value) {
    stageEl.value.scrollLeft += anchor.x * (next - old)
    stageEl.value.scrollTop += anchor.y * (next - old)
  }
}
function onWheel(e) {
  if (!(e.ctrlKey || e.metaKey) || !pg.value) return
  e.preventDefault()
  setZoom(zoom.value * Math.exp(-e.deltaY * 0.01), svgEl.value ? pt(e) : null)
}

// ── 滑鼠操作 ──
function pt(e) {
  const r = svgEl.value.getBoundingClientRect()
  return { x: (e.clientX - r.left) / zoom.value, y: (e.clientY - r.top) / zoom.value }
}
function track(onMove, onUp) {
  const move = (e) => onMove(e)
  const up = (e) => {
    window.removeEventListener('pointermove', move)
    window.removeEventListener('pointerup', up)
    window.removeEventListener('pointercancel', up)
    onUp?.(e)
  }
  window.addEventListener('pointermove', move)
  window.addEventListener('pointerup', up)
  window.addEventListener('pointercancel', up)
}
const blurActive = () => {
  const a = document.activeElement
  if (a && a !== document.body && a !== editEl.value) a.blur()
}

function cloneObjects(src, dx = 0, dy = 0, page = pageNo.value) {
  const groupMap = new Map()
  return src.map((o) => {
    if (o.group && !groupMap.has(o.group)) groupMap.set(o.group, uid())
    const copy = JSON.parse(JSON.stringify(o))
    return { ...copy, id: uid(), page, x: r2(o.x + dx), y: r2(o.y + dy), group: o.group ? groupMap.get(o.group) : null }
  })
}

function onObjDown(e, o) {
  if (e.button !== 0 || !props.canEdit) return
  if (tool.value === 'text') {
    startEdit(o)
    return
  }
  commitEdit()
  blurActive()
  const deep = e.metaKey || e.ctrlKey
  const ids = deep || !o.group ? [o.id] : pageObjs.value.filter((x) => x.group === o.group).map((x) => x.id)
  if (e.shiftKey) {
    if (ids.every((id) => selSet.value.has(id))) {
      sel.value = sel.value.filter((id) => !ids.includes(id))
      return
    }
    sel.value = [...new Set([...sel.value, ...ids])]
  } else if (!ids.every((id) => selSet.value.has(id))) {
    sel.value = ids
  }
  startDrag(e, o)
}

function startDrag(e, grabbed) {
  const start = pt(e)
  let moving = selObjs.value
  let orig = new Map(moving.map((o) => [o.id, { x: o.x, y: o.y }]))
  let grab = grabbed
  let moved = false
  let startBox = selBox.value
  let targetsX = []
  let targetsY = []

  const prepare = () => {
    const ids = new Set(moving.map((o) => o.id))
    targetsX = []
    targetsY = [...pageBase.value]
    for (const o of pageObjs.value) {
      if (ids.has(o.id)) continue
      const b = boxes.value[o.id]
      targetsX.push(b.x, b.x + b.w / 2, b.x + b.w)
      targetsY.push(b.base)
    }
  }

  track(
    (ev) => {
      const p = pt(ev)
      let dx = p.x - start.x
      let dy = p.y - start.y
      if (!moved) {
        if (Math.hypot(dx, dy) * zoom.value < 3) return
        moved = true
        if (ev.altKey) {
          // Option 拖曳＝複製
          const copies = cloneObjects(moving)
          const grabIndex = moving.findIndex((o) => o.id === grab.id)
          objects.value.push(...copies)
          moving = objects.value.slice(-copies.length)
          grab = moving[grabIndex] || moving[0]
          orig = new Map(moving.map((o) => [o.id, { x: o.x, y: o.y }]))
          sel.value = moving.map((o) => o.id)
        }
        prepare()
      }
      if (ev.shiftKey) {
        if (Math.abs(dx) > Math.abs(dy)) dy = 0
        else dx = 0
      }
      const lines = []
      if (snapOn.value && !(ev.metaKey || ev.ctrlKey)) {
        const tol = 5 / zoom.value
        const g0 = orig.get(grab.id)
        const sx = snapAxis([startBox.x + dx, startBox.x + startBox.w / 2 + dx, startBox.x + startBox.w + dx], targetsX, tol)
        const sy = snapAxis([g0.y + dy], targetsY, tol)
        if (sx && !(ev.shiftKey && dx === 0)) {
          dx += sx.delta
          lines.push({ x1: sx.at, y1: 0, x2: sx.at, y2: pg.value.h })
        }
        if (sy && !(ev.shiftKey && dy === 0)) {
          dy += sy.delta
          lines.push({ x1: 0, y1: sy.at, x2: pg.value.w, y2: sy.at })
        }
      }
      guides.value = lines
      for (const o of moving) {
        const s = orig.get(o.id)
        o.x = r2(s.x + dx)
        o.y = r2(s.y + dy)
      }
    },
    () => {
      guides.value = []
      if (moved) commit()
    },
  )
}

function onHandleDown(e, corner) {
  if (e.button !== 0 || !selBox.value || !props.canEdit) return
  commitEdit()
  const b = selBox.value
  const ax = corner.includes('w') ? b.x + b.w : b.x
  const ay = corner.includes('n') ? b.y + b.h : b.y
  const vx = (corner.includes('w') ? b.x : b.x + b.w) - ax
  const vy = (corner.includes('n') ? b.y : b.y + b.h) - ay
  const len2 = vx * vx + vy * vy || 1
  const orig = selObjs.value.map((o) => ({ o, x: o.x, y: o.y, size: o.size, maxW: o.maxW }))
  track(
    (ev) => {
      const p = pt(ev)
      const s = clamp(((p.x - ax) * vx + (p.y - ay) * vy) / len2, 0.1, 20)
      for (const it of orig) {
        it.o.x = r2(ax + (it.x - ax) * s)
        it.o.y = r2(ay + (it.y - ay) * s)
        it.o.size = Math.max(1, r1(it.size * s))
        if (it.maxW) it.o.maxW = r1(it.maxW * s)
      }
    },
    () => {
      rememberStyle()
      commit()
    },
  )
}

function onBgDown(e) {
  if (e.button !== 0 || !pg.value || !props.canEdit) return
  const wasEditing = !!editing.value
  commitEdit()
  blurActive()
  const start = pt(e)
  if (tool.value === 'text') {
    if (!wasEditing) newText(start)
    return
  }
  if (tool.value === 'field') {
    placeField(start)
    return
  }
  const keep = e.shiftKey ? [...sel.value] : []
  let moved = false
  track(
    (ev) => {
      const p = pt(ev)
      if (!moved && Math.hypot(p.x - start.x, p.y - start.y) * zoom.value < 3) return
      moved = true
      const box = { x: Math.min(start.x, p.x), y: Math.min(start.y, p.y), w: Math.abs(p.x - start.x), h: Math.abs(p.y - start.y) }
      marquee.value = box
      const hit = new Set(keep)
      for (const o of pageObjs.value) {
        if (!intersects(box, boxes.value[o.id])) continue
        if (o.group) pageObjs.value.forEach((x) => x.group === o.group && hit.add(x.id))
        else hit.add(o.id)
      }
      sel.value = [...hit]
    },
    () => {
      marquee.value = null
      if (!moved && !e.shiftKey) sel.value = []
    },
  )
}
function onBgDblClick(e) {
  if (!props.canEdit) return
  if (tool.value === 'select' && e.target === svgEl.value) newText(pt(e))
}
function onStageDown(e) {
  if (e.target !== stageEl.value) return
  commitEdit()
  sel.value = []
}

// ── 文字編輯 ──
function rememberStyle() {
  const o = selObjs.value[0]
  if (o) Object.assign(lastStyle, { font: o.font, size: o.size, color: o.color })
}
watch(sel, rememberStyle)

/** 插入欄位：點的位置當作文字中心（基線略低於點擊處） */
function placeField(p) {
  const f = fieldMap.value[insertKey.value]
  if (!f) {
    say('先選要插入的欄位')
    return
  }
  const fmt = f.type === 'money' ? 'comma' : formatsFor(f)[0]
  const o = {
    id: uid(),
    page: pageNo.value,
    x: r2(p.x),
    y: r2(p.y + lastStyle.size * 0.35),
    text: '',
    group: null,
    ...lastStyle,
    anchor: 'middle',
    bind: { field: f.key, fmt },
  }
  objects.value.push(o)
  sel.value = [o.id]
  commit()
}

function newText(p) {
  const o = { id: uid(), page: pageNo.value, x: r2(p.x), y: r2(p.y), text: '', group: null, ...lastStyle }
  objects.value.push(o)
  sel.value = [o.id]
  editing.value = { id: o.id, value: '', isNew: true }
  nextTick(() => editEl.value?.focus())
}
function startEdit(o) {
  if (!props.canEdit) return
  commitEdit()
  sel.value = [o.id]
  if (o.bind?.field) {
    say('由資料帶入')
    return
  }
  editing.value = { id: o.id, value: o.text, isNew: false }
  nextTick(() => {
    editEl.value?.focus()
    editEl.value?.select()
  })
}
function commitEdit() {
  const ed = editing.value
  if (!ed) return
  editing.value = null
  const o = objects.value.find((x) => x.id === ed.id)
  if (!o) return
  if (!ed.value.trim()) {
    objects.value = objects.value.filter((x) => x.id !== ed.id)
    sel.value = sel.value.filter((id) => id !== ed.id)
  } else o.text = ed.value
  if (ed.isNew) tool.value = 'select'
  commit()
}
function cancelEdit() {
  const ed = editing.value
  if (!ed) return
  editing.value = null
  if (ed.isNew) {
    objects.value = objects.value.filter((x) => x.id !== ed.id)
    sel.value = []
    tool.value = 'select'
  }
}
function onEditKey(e) {
  if (e.isComposing) return
  if (e.key === 'Enter') {
    e.preventDefault()
    commitEdit()
  } else if (e.key === 'Escape') {
    e.preventDefault()
    cancelEdit()
  }
}
const editStyle = computed(() => {
  const ed = editing.value
  const o = ed && objects.value.find((x) => x.id === ed.id)
  if (!o) return null
  const m = measure(o.font, o.size, ed.value || ' ')
  const z = zoom.value
  const w = m.w + o.size * 1.2
  const k = ANCHOR_K[o.anchor] || 0
  return {
    left: (o.x - w * k) * z + 'px',
    top: (o.y - m.asc) * z + 'px',
    width: w * z + 'px',
    textAlign: ['left', 'center', 'right'][k * 2],
    height: (m.asc + m.desc) * z + 'px',
    lineHeight: (m.asc + m.desc) * z + 'px',
    fontSize: o.size * z + 'px',
    fontFamily: cssFamily(o.font),
    color: o.color,
  }
})

// ── 屬性 ──
function setProp(key, value) {
  if (key === 'size') {
    value = clamp(r1(Number(value)), 1, 400)
    if (!Number.isFinite(value)) return
  }
  for (const o of selObjs.value) o[key] = value
  rememberStyle()
}
/** 最大寬度：空白＝不限 */
function setMaxW(raw) {
  const v = r1(Number(raw))
  for (const o of selObjs.value) {
    if (raw === '' || !(v >= 1)) delete o.maxW
    else o.maxW = v
  }
  commit()
}
function setText(value) {
  if (selObjs.value.length === 1 && !selObjs.value[0].bind) selObjs.value[0].text = value
}
/** 改對齊點但文字位置不動 */
function setAnchor(anchor) {
  for (const o of selObjs.value) {
    const b = boxes.value[o.id]
    o.x = r2(b.x + b.w * ANCHOR_K[anchor])
    o.anchor = anchor
  }
  commit()
}

// ── 變數綁定 ──
const commonOf = (fn) => {
  const os = selObjs.value
  if (!os.length) return undefined
  const v = fn(os[0])
  return os.every((o) => fn(o) === v) ? v : undefined // undefined＝多種
}
// '?'＝自動偵測到、還沒設定
const bindField = computed(() => commonOf((o) => (o.todo && o.bind && !o.bind.field ? '?' : o.bind?.field || '')))
const bindDef = computed(() => fieldMap.value[bindField.value] || null)
const bindFmt = computed(() => commonOf((o) => o.bind?.fmt || ''))
const bindLead = computed(() => commonOf((o) => o.bind?.lead ?? '零'))
const bindPlace = computed(() => {
  const ps = selObjs.value.map((o) => o.bind?.place ?? 0)
  return ps.length ? Math.min(...ps) : 0
})
const whenField = computed(() => commonOf((o) => (o.todo && !o.bind ? '?' : o.when?.field || '')))
const whenDef = computed(() => fieldMap.value[whenField.value] || null)
const whenValue = computed(() => commonOf((o) => o.when?.value ?? ''))
const singleBound = computed(() => selObjs.value.length === 1 && !!selObjs.value[0].bind)

/** 多格一起指定：依閱讀順序，最後一格＝lowest 位，往前遞增 */
function assignPlaces(list, lowest) {
  const ordered = readingOrder(list)
  ordered.forEach((o, i) => (o.bind.place = lowest + ordered.length - 1 - i))
}
function ensurePlaces() {
  const os = selObjs.value
  const lowest = bindDef.value?.type === 'money' ? 3 : 0
  if (os.length > 1) assignPlaces(os, os.every((o) => o.bind.place != null) ? bindPlace.value : lowest)
  else for (const o of os) o.bind.place ??= lowest
}
function setBindField(key) {
  const os = selObjs.value
  if (!key) {
    for (const o of os) {
      if (!o.bind) continue
      o.text = evalObj(o, curValues.value).text || o.text
      delete o.bind
      delete o.todo
    }
    commit()
    return
  }
  const fmts = formatsFor(fieldMap.value[key])
  const fmt = fmts.includes(bindFmt.value) ? bindFmt.value : fmts[0]
  for (const o of os) {
    o.bind = { field: key, fmt, place: o.bind?.place, lead: o.bind?.lead ?? '零' }
    delete o.todo
  }
  if (fmt === 'digit') ensurePlaces()
  commit()
}
function setBindFmt(fmt) {
  for (const o of selObjs.value) if (o.bind) o.bind.fmt = fmt
  if (fmt === 'digit') ensurePlaces()
  commit()
}
function setPlace(place) {
  const os = selObjs.value
  if (os.length > 1) assignPlaces(os, place)
  else if (os[0]?.bind) os[0].bind.place = place
  commit()
}
function setLead(lead) {
  for (const o of selObjs.value) if (o.bind) o.bind.lead = lead
  commit()
}
function setWhenField(key) {
  for (const o of selObjs.value) {
    if (!key) delete o.when
    else o.when = { field: key, value: o.when?.field === key ? o.when.value : fieldMap.value[key]?.options?.[0] ?? '' }
    if (!o.bind || o.bind.field) delete o.todo
  }
  commit()
}
function setWhenValue(value) {
  for (const o of selObjs.value) if (o.when) o.when.value = value
  commit()
}
// 清單欄位（土地、車位）：第幾筆
const bindIndex = computed(() => commonOf((o) => o.bind?.index || 1))
const whenIndex = computed(() => commonOf((o) => o.when?.index || 1))
function setBindIndex(n) {
  for (const o of selObjs.value) if (o.bind) o.bind.index = n
  commit()
}
function setWhenIndex(n) {
  for (const o of selObjs.value) if (o.when) o.when.index = n
  commit()
}
function setPos(axis, value) {
  const b = selBox.value
  const v = Number(value)
  if (!b || !Number.isFinite(v)) return
  const d = v - b[axis]
  for (const o of selObjs.value) o[axis] = r2(o[axis] + d)
  commit()
}

const fams = computed(() => familyList())
const curFace = computed(() => fontState.faces.find((f) => f.ps === common('font')) || null)
const curStyles = computed(() => (curFace.value ? fontState.faces.filter((f) => f.family === curFace.value.family) : []))
function setFamily(family) {
  const faces = fontState.faces.filter((f) => f.family === family)
  const face = faces.find((f) => f.style === curFace.value?.style) || faces.find((f) => f.style === 'Regular') || faces[0]
  if (!face) return
  setProp('font', face.ps)
  commit()
}

// ── 排列 ──
function applyMoves(moves) {
  for (const [u, { dx, dy }] of moves) {
    for (const o of u.objs) {
      o.x = r2(o.x + dx)
      o.y = r2(o.y + dy)
    }
  }
  commit()
}
const align = (mode) => arrangeUnits.value.length > 1 && applyMoves(alignMoves(arrangeUnits.value, mode))
const distribute = (axis) => arrangeUnits.value.length > 2 && applyMoves(distributeMoves(arrangeUnits.value, axis))

function group() {
  if (!canGroup.value) return
  const id = uid()
  for (const o of selObjs.value) o.group = id
  commit()
}
function ungroup() {
  if (!canUngroup.value) return
  for (const o of selObjs.value) o.group = null
  commit()
}
function removeSelected() {
  const n = selObjs.value.length
  if (!n) return
  objects.value = objects.value.filter((o) => !selSet.value.has(o.id))
  sel.value = []
  commit()
  say(`已刪除 ${n} 個（⌘Z 復原）`)
}
let clip = []
function copy() {
  if (selObjs.value.length) clip = JSON.parse(JSON.stringify(selObjs.value))
}
function paste(src = clip, offset = 10) {
  if (!src.length) return
  // 原位置已有相同物件才偏移（同頁再貼一次）；貼到別頁或別份 PDF 則保留原座標
  const samePage = pageObjs.value.some((o) => Math.abs(o.x - src[0].x) < 0.01 && Math.abs(o.y - src[0].y) < 0.01)
  const copies = cloneObjects(src, samePage ? offset : 0, samePage ? offset : 0)
  objects.value.push(...copies)
  sel.value = copies.map((o) => o.id)
  commit()
}
const duplicate = () => paste(JSON.parse(JSON.stringify(selObjs.value)))
function nudge(dx, dy) {
  for (const o of selObjs.value) {
    o.x = r2(o.x + dx)
    o.y = r2(o.y + dy)
  }
  commitSoon()
}

function onKey(e) {
  const t = e.target
  if (!props.canEdit || editing.value || /^(INPUT|TEXTAREA|SELECT)$/.test(t?.tagName || '')) return
  const mod = e.metaKey || e.ctrlKey
  const k = e.key.toLowerCase()
  const done = () => e.preventDefault()
  if (mod && k === 'z') return done(), travel(e.shiftKey ? 1 : -1)
  if (mod && k === 'y') return done(), travel(1)
  if (mod && k === 'a') return done(), (sel.value = pageObjs.value.map((o) => o.id))
  if (mod && k === 'c') return copy()
  if (mod && k === 'x') return copy(), removeSelected()
  if (mod && k === 'v') return done(), paste()
  if (mod && k === 'd') return done(), duplicate()
  if (mod && k === 'g') return done(), e.shiftKey ? ungroup() : group()
  if (mod) return
  if (k === 'delete' || k === 'backspace') return done(), removeSelected()
  if (k === 'escape') return (sel.value = []), (tool.value = 'select')
  if (k === 'v') return (tool.value = 'select')
  if (k === 't') return (tool.value = 'text')
  if (k === 'f') return (tool.value = 'field')
  if (k === 'enter' && selObjs.value.length === 1) return done(), startEdit(selObjs.value[0])
  const step = e.altKey ? 0.1 : e.shiftKey ? 10 : 1
  if (k === 'arrowleft') return done(), nudge(-step, 0)
  if (k === 'arrowright') return done(), nudge(step, 0)
  if (k === 'arrowup') return done(), nudge(0, -step)
  if (k === 'arrowdown') return done(), nudge(0, step)
}

// ── 輸出 ──
/** 某筆資料要印的物件（文字已代入、x 已換成左端） */
function outputObjects(values, pages) {
  const list = []
  for (const o of liveObjects.value) {
    if (pages && !pages.includes(o.page)) continue
    const r = evalObj(o, values)
    if (r.hidden || !r.text.trim()) continue
    const k = ANCHOR_K[o.anchor] || 0
    const size = fitSize(o, r.text)
    const x = k ? o.x - measure(o.font, size, r.text).w * k : o.x
    list.push({ ...o, x, size, text: r.text })
  }
  return list
}

async function makePdf() {
  commitEdit()
  const pages = scope.value === 'page' ? [pageNo.value] : keptPages.value
  const need = [...new Set(objects.value.map((o) => o.font))]
  if (fontState.localSupported && !fontState.localGranted && need.some((ps) => !hasFontSource(ps))) await loadLocalFonts()
  const fonts = {}
  for (const ps of need) fonts[ps] = { bytes: await fontBytes(ps), ps }
  await Promise.all(need.map(ensureFace))
  const toPdf = {}
  for (const n of new Set(objects.value.map((o) => o.page))) toPdf[n] = (await pageGeometry(doc.value.pdf, n)).toPdf
  const { bytes, stats } = await buildPdf({
    fontkit,
    srcBytes: doc.value.bytes,
    pageNumbers: pages,
    toPdf,
    objects: outputObjects(curValues.value, pages),
    fonts,
    rasterize: rasterizeText,
  })
  return { bytes, stats, overflow: overflowFields(curValues.value) }
}
const outName = () => {
  const base = (tpl.value?.name || doc.value.name.replace(/\.pdf$/i, '')).replace(/[\\/:*?"<>|]/g, '_')
  const unit = String(props.unitLabel || curValues.value.unit || '').replace(/[\\/:*?"<>|]/g, '_')
  return unit ? `${base}-${unit}.pdf` : `${base}.pdf`
}

async function exportPdf(mode) {
  if (!doc.value || busy.value) return
  busy.value = true
  try {
    const { bytes, stats, overflow } = await makePdf()
    const blob = new Blob([bytes], { type: 'application/pdf' })
    const url = URL.createObjectURL(blob)
    if (mode === 'print') printUrl(url)
    else {
      const a = document.createElement('a')
      a.href = url
      a.download = outName()
      a.click()
      setTimeout(() => URL.revokeObjectURL(url), 60000)
    }
    const msg = [mode === 'print' ? '已送出列印' : '已儲存']
    if (overflow.length) msg.push(`${overflow.join('、')} 位數不足`)
    if (stats.raster) msg.push(`${stats.raster} 處以圖片輸出`)
    say(msg.join('，'))
  } catch (err) {
    console.error(err)
    say('輸出失敗')
  } finally {
    busy.value = false
  }
}
function printUrl(url) {
  document.getElementById('ov-print-frame')?.remove()
  const frame = document.createElement('iframe')
  frame.id = 'ov-print-frame'
  frame.style.cssText = 'visibility:hidden;position:fixed;right:0;bottom:0;width:0;height:0;border:0'
  frame.onload = () => {
    try {
      frame.contentWindow.focus()
      frame.contentWindow.print()
    } catch {
      window.open(url, '_blank')
    }
  }
  frame.src = url
  document.body.appendChild(frame)
}

onMounted(async () => {
  window.addEventListener('keydown', onKey)
  window.addEventListener('beforeunload', onBeforeUnload)
  // 本機自動測試用
  if (import.meta.env.DEV) {
    window.__contractPrintEditor = { makePdf, objects, sel, scope, issues, view, todoCount, flushSave, saveState, pageNo, gotoPage, tool, insertKey, missingFields }
  }
  probeKnownFonts()
  loadLocalFonts({ silent: true })
  await load()
})
onBeforeUnmount(() => {
  window.removeEventListener('keydown', onKey)
  window.removeEventListener('beforeunload', onBeforeUnload)
  flushSave()
})

const hs = computed(() => 7 / zoom.value) // 縮放控制點邊長
const handles = computed(() => {
  const b = selBox.value
  if (!b || editing.value) return []
  return [
    { c: 'nw', x: b.x, y: b.y },
    { c: 'ne', x: b.x + b.w, y: b.y },
    { c: 'sw', x: b.x, y: b.y + b.h },
    { c: 'se', x: b.x + b.w, y: b.y + b.h },
  ]
})
</script>

<template>
  <div class="ov mac-form">
    <header class="ov-bar">
      <button class="mac-btn ov-back" data-tip="回範本清單" aria-label="回範本清單" @click="goBack"><McIcon :d="mdiChevronLeft" />範本</button>
      <div class="ov-name" :title="tpl ? `${tpl.name}（${tpl.pdfName}）` : ''">
        <span class="ov-name-text">{{ tpl?.name }}</span>
        <span v-if="saveState" class="ov-save" :class="'is-' + saveState" :title="{ saving: '儲存中', saved: '已儲存', error: '儲存失敗' }[saveState]">
          <McIcon :d="{ saving: mdiCloudUploadOutline, saved: mdiCheckCircleOutline, error: mdiAlertCircleOutline }[saveState]" :size="14" />
        </span>
      </div>
      <template v-if="canEdit">
      <button class="mac-icon-btn" data-tip="自動偵測本頁的金額格與勾選框" aria-label="自動偵測本頁的金額格與勾選框" :disabled="!doc || busy" @click="detectCurrent"><McIcon :d="mdiAutoFix" /></button>
      <button class="mac-icon-btn" data-tip="從已填好的 PDF 匯入彩色文字" aria-label="從已填好的 PDF 匯入彩色文字" :disabled="!doc" @click="importInput.click()"><McIcon :d="mdiFileImportOutline" /></button>
      <input ref="importInput" type="file" accept="application/pdf" hidden @change="onImportFile" />
      <button class="mac-icon-btn" data-tip="頁面（刪除不需要的頁）" aria-label="頁面" :disabled="!doc" @click="showPages = true"><McIcon :d="mdiFileDocumentMultipleOutline" /></button>

      <span class="ov-sep" />
      <div class="mac-form-seg">
        <button class="mac-form-seg-btn" :class="{ 'is-active': tool === 'select' }" data-tip="選取 (V)" aria-label="選取 (V)" @click="tool = 'select'">
          <McIcon :d="mdiCursorDefaultOutline" :size="16" />選取
        </button>
        <button class="mac-form-seg-btn" :class="{ 'is-active': tool === 'text' }" data-tip="文字 (T)" aria-label="文字 (T)" @click="tool = 'text'">
          <McIcon :d="mdiFormatText" :size="16" />文字
        </button>
        <button class="mac-form-seg-btn" :class="{ 'is-active': tool === 'field' }" data-tip="插入欄位 (F)" aria-label="插入欄位 (F)" @click="tool = 'field'">
          <McIcon :d="mdiFormTextbox" :size="16" />欄位
        </button>
      </div>
      <button class="mac-icon-btn" data-tip="復原 (⌘Z)" aria-label="復原 (⌘Z)" :disabled="!canUndo" @click="travel(-1)"><McIcon :d="mdiUndo" /></button>
      <button class="mac-icon-btn" data-tip="重做 (⇧⌘Z)" aria-label="重做 (⇧⌘Z)" :disabled="!canRedo" @click="travel(1)"><McIcon :d="mdiRedo" /></button>
      <button class="mac-icon-btn" :class="{ 'is-on': snapOn }" data-tip="吸附" aria-label="吸附" @click="snapOn = !snapOn"><McIcon :d="mdiMagnet" /></button>
      </template>

      <span class="ov-sep" />
      <template v-if="doc">
        <button class="mac-icon-btn" data-tip="上一頁" aria-label="上一頁" :disabled="pagePos <= 1" @click="gotoPagePos(pagePos - 1)"><McIcon :d="mdiChevronLeft" /></button>
        <input class="mac-form-input ov-num" type="number" min="1" :max="keptPages.length" :value="pagePos" @change="gotoPagePos($event.target.value)" />
        <span class="ov-dim">/ {{ keptPages.length }}</span>
        <button class="mac-icon-btn" data-tip="下一頁" aria-label="下一頁" :disabled="pagePos >= keptPages.length" @click="gotoPagePos(pagePos + 1)"><McIcon :d="mdiChevronRight" /></button>

        <span class="ov-sep" />
        <button class="mac-icon-btn" data-tip="縮小" aria-label="縮小" @click="setZoom(zoom / 1.2)"><McIcon :d="mdiMinus" /></button>
        <button class="mac-btn mac-btn--sm ov-zoom" data-tip="符合寬度" aria-label="符合寬度" @click="fitWidth">{{ Math.round(zoom * 100) }}%</button>
        <button class="mac-icon-btn" data-tip="放大" aria-label="放大" @click="setZoom(zoom * 1.2)"><McIcon :d="mdiPlus" /></button>
      </template>

      <span class="ov-sep" />
      <span v-if="issues.length" class="ov-warn" :title="issues.join('、') + ' 位數不足'">位數不足</span>
      <span v-if="missingFields.length" class="ov-miss" :title="'沒有資料：' + missingFields.join('、')">缺資料 {{ missingFields.length }}</span>
      <button v-if="canEdit && todoCount" class="ov-todo-chip" title="選取本頁待設定；再按跳下一頁" @click="gotoTodo">待設定 {{ todoCount }}</button>
      <button class="mac-icon-btn" :class="{ 'is-on': markVars }" data-tip="標示變數" aria-label="標示變數" @click="markVars = !markVars"><McIcon :d="mdiVariable" /></button>

      <span class="ov-grow" />
      <select v-model="scope" class="mac-form-input mac-form-select ov-scope" title="輸出範圍" @change="$event.target.blur()">
        <option value="all">全部頁</option>
        <option value="page">本頁</option>
      </select>
      <button class="mac-icon-btn" data-tip="列印" aria-label="列印" data-tip-end :disabled="!doc || busy" @click="exportPdf('print')"><McIcon :d="mdiPrinterOutline" /></button>
      <button class="mac-btn mac-btn--primary" :disabled="!doc || busy" @click="exportPdf('save')"><McIcon :d="mdiTrayArrowDown" />儲存 PDF</button>
      <button class="mac-icon-btn" data-tip="關閉" aria-label="關閉" data-tip-end @click="close"><McIcon :d="mdiClose" /></button>
    </header>

    <div class="ov-body">
      <main ref="stageEl" class="ov-stage" @wheel="onWheel" @pointerdown="onStageDown">
        <div v-if="pg" class="ov-page" :style="{ width: pg.w * zoom + 'px', height: pg.h * zoom + 'px' }">
          <canvas ref="canvasEl" />
          <svg
            ref="svgEl"
            :class="['ov-svg', 'is-' + tool]"
            :viewBox="`0 0 ${pg.w} ${pg.h}`"
            @pointerdown="onBgDown"
            @mousedown.prevent
            @dblclick="onBgDblClick"
          >
            <g v-for="o in pageObjs" :key="o.id">
              <rect
                v-if="view[o.id].todo"
                class="ov-todo"
                :x="boxes[o.id].x - 1"
                :y="boxes[o.id].y - 1"
                :width="boxes[o.id].w + 2"
                :height="boxes[o.id].h + 2"
              />
              <rect
                v-else-if="markVars && (o.bind || o.when)"
                class="ov-var"
                :x="boxes[o.id].x"
                :y="boxes[o.id].y"
                :width="boxes[o.id].w"
                :height="boxes[o.id].h"
              />
              <text
                v-show="editing?.id !== o.id"
                :class="['ov-text', { 'is-ghost': view[o.id].ghost }]"
                :x="o.x"
                :y="o.y"
                :text-anchor="o.anchor || 'start'"
                :font-size="view[o.id].size"
                :fill="o.color"
                :style="{ fontFamily: cssFamily(o.font) }"
              >{{ view[o.id].text }}</text>
              <rect
                class="ov-hit"
                :x="boxes[o.id].x - 1"
                :y="boxes[o.id].y"
                :width="boxes[o.id].w + 2"
                :height="boxes[o.id].h"
                @pointerdown.stop="onObjDown($event, o)"
                @dblclick.stop="startEdit(o)"
              />
            </g>
            <rect
              v-for="(u, i) in selUnits"
              :key="'u' + i"
              :class="['ov-sel', { 'is-group': u.grouped }]"
              :x="u.x"
              :y="u.y"
              :width="u.w"
              :height="u.h"
            />
            <rect v-if="selBox && selUnits.length > 1" class="ov-selbox" :x="selBox.x" :y="selBox.y" :width="selBox.w" :height="selBox.h" />
            <line v-for="(g, i) in guides" :key="'g' + i" class="ov-guide" :x1="g.x1" :y1="g.y1" :x2="g.x2" :y2="g.y2" />
            <rect
              v-for="hd in handles"
              :key="hd.c"
              :class="['ov-handle', 'is-' + hd.c]"
              :x="hd.x - hs / 2"
              :y="hd.y - hs / 2"
              :width="hs"
              :height="hs"
              @pointerdown.stop="onHandleDown($event, hd.c)"
            />
            <rect v-if="marquee" class="ov-marquee" :x="marquee.x" :y="marquee.y" :width="marquee.w" :height="marquee.h" />
          </svg>
          <input
            v-if="editing && editStyle"
            ref="editEl"
            v-model="editing.value"
            class="ov-edit"
            :style="editStyle"
            spellcheck="false"
            @keydown="onEditKey"
            @blur="commitEdit"
            @pointerdown.stop
          />
        </div>
        <div v-else class="ov-empty">
          <template v-if="loadError">
            {{ loadError }}
            <button class="mac-btn" @click="emit('back')">回範本清單</button>
          </template>
          <template v-else>載入中…</template>
        </div>
      </main>

      <aside class="ov-panel">
        <div v-if="canEdit && tool === 'field'" class="ov-pick">
          <div class="ov-data-head">
            <label>插入欄位</label>
            <button class="mac-icon-btn" title="建案設定（自訂欄位）" @click="emit('settings')"><McIcon :d="mdiCogOutline" /></button>
          </div>
          <template v-for="g in fieldGroups" :key="g.group">
            <div class="ov-dgroup">{{ g.group }}</div>
            <button
              v-for="f in g.fields"
              :key="f.key"
              class="ov-pick-row"
              :class="{ 'is-on': insertKey === f.key }"
              @click="insertKey = f.key"
            >
              {{ f.label }}
            </button>
          </template>
        </div>
        <template v-else-if="canEdit && selObjs.length">
          <div class="ov-field">
            <label>文字</label>
            <input
              class="mac-form-input"
              :disabled="selObjs.length !== 1 || singleBound"
              :value="selObjs.length === 1 ? (singleBound ? view[selObjs[0].id].out : selObjs[0].text) : ''"
              :placeholder="selObjs.length > 1 ? `${selObjs.length} 個物件` : ''"
              @input="setText($event.target.value)"
              @change="commit"
            />
          </div>

          <div class="ov-field">
            <label>資料欄位</label>
            <select class="mac-form-input mac-form-select" :value="bindField ?? '*'" @change="(setBindField($event.target.value), $event.target.blur())">
              <option v-if="bindField === undefined" value="*" disabled>多種</option>
              <option v-if="bindField === '?'" value="?" disabled>未設定</option>
              <option value="">固定文字</option>
              <optgroup v-for="g in fieldGroups" :key="g.group" :label="g.group">
                <option v-for="f in g.fields" :key="f.key" :value="f.key">{{ f.label }}</option>
              </optgroup>
            </select>
            <template v-if="bindDef">
              <select
                v-if="formatsFor(bindDef).length > 1"
                class="mac-form-input mac-form-select"
                :value="bindFmt ?? '*'"
                @change="(setBindFmt($event.target.value), $event.target.blur())"
              >
                <option v-if="bindFmt === undefined" value="*" disabled>多種</option>
                <option v-for="k in formatsFor(bindDef)" :key="k" :value="k">{{ FORMATS[k] }}</option>
              </select>
              <select
                v-if="bindDef.list"
                class="mac-form-input mac-form-select"
                :value="bindIndex ?? '*'"
                @change="(setBindIndex(+$event.target.value), $event.target.blur())"
              >
                <option v-if="bindIndex === undefined" value="*" disabled>多種</option>
                <option v-for="n in 6" :key="n" :value="n">第 {{ n }} 筆</option>
              </select>
              <div v-if="bindFmt === 'digit'" class="ov-field ov-field--half ov-sub">
                <div>
                  <label>{{ selObjs.length > 1 ? '最右一格' : '位數' }}</label>
                  <select class="mac-form-input mac-form-select" :value="bindPlace" @change="(setPlace(+$event.target.value), $event.target.blur())">
                    <option v-for="(p, i) in PLACES" :key="p" :value="i">{{ p }}位</option>
                  </select>
                </div>
                <div>
                  <label>前面補</label>
                  <select class="mac-form-input mac-form-select" :value="bindLead ?? '零'" @change="(setLead($event.target.value), $event.target.blur())">
                    <option value="零">零</option>
                    <option value="">空白</option>
                  </select>
                </div>
              </div>
            </template>
          </div>

          <div class="ov-field">
            <label>顯示條件</label>
            <select class="mac-form-input mac-form-select" :value="whenField ?? '*'" @change="(setWhenField($event.target.value), $event.target.blur())">
              <option v-if="whenField === undefined" value="*" disabled>多種</option>
              <option v-if="whenField === '?'" value="?" disabled>未設定</option>
              <option value="">一律顯示</option>
              <optgroup v-for="g in fieldGroups" :key="g.group" :label="g.group">
                <option v-for="f in g.fields" :key="f.key" :value="f.key">{{ f.label }}</option>
              </optgroup>
            </select>
            <template v-if="whenDef">
              <select
                v-if="whenDef.list"
                class="mac-form-input mac-form-select"
                :value="whenIndex ?? '*'"
                @change="(setWhenIndex(+$event.target.value), $event.target.blur())"
              >
                <option v-if="whenIndex === undefined" value="*" disabled>多種</option>
                <option v-for="n in 6" :key="n" :value="n">第 {{ n }} 筆</option>
              </select>
              <select
                v-if="whenDef.options"
                class="mac-form-input mac-form-select"
                :value="whenValue ?? '*'"
                @change="(setWhenValue($event.target.value), $event.target.blur())"
              >
                <option v-if="whenValue === undefined" value="*" disabled>多種</option>
                <option v-for="v in whenDef.options" :key="v" :value="v">＝ {{ v }}</option>
              </select>
              <input v-else class="mac-form-input" :value="whenValue ?? ''" placeholder="＝" @change="setWhenValue($event.target.value)" />
            </template>
          </div>

          <div class="ov-field">
            <label>字型</label>
            <select class="mac-form-input mac-form-select" :value="curFace?.family ?? ''" @change="(setFamily($event.target.value), $event.target.blur())">
              <option v-if="!curFace" value="" disabled>{{ common('font') || '多種' }}</option>
              <optgroup v-if="fams.common.length" label="常用">
                <option v-for="f in fams.common" :key="f.family" :value="f.family">{{ f.label }}</option>
              </optgroup>
              <optgroup v-if="fams.others.length" label="全部">
                <option v-for="f in fams.others" :key="f.family" :value="f.family">{{ f.label }}</option>
              </optgroup>
            </select>
            <select
              v-if="curStyles.length > 1"
              class="mac-form-input mac-form-select"
              :value="curFace.ps"
              @change="(setProp('font', $event.target.value), commit(), $event.target.blur())"
            >
              <option v-for="f in curStyles" :key="f.ps" :value="f.ps">{{ f.style }}</option>
            </select>
            <div class="ov-row">
              <button v-if="fontState.localSupported && !fontState.localGranted" class="mac-btn mac-btn--sm" @click="moreFonts">本機字型</button>
              <button class="mac-btn mac-btn--sm" @click="fontInput.click()">字型檔</button>
              <input ref="fontInput" type="file" accept=".ttf,.otf,.ttc" hidden @change="onFontFile" />
            </div>
          </div>

          <div class="ov-field ov-field--half">
            <div class="ov-narrow">
              <label>字級</label>
              <input class="mac-form-input" type="number" min="1" max="400" step="0.5" :value="common('size') ?? ''" placeholder="多種" @change="(setProp('size', $event.target.value), commit())" />
            </div>
            <div>
              <label>顏色</label>
              <div class="ov-row">
                <input class="ov-color" type="color" :value="common('color') || '#000000'" @input="setProp('color', $event.target.value)" @change="commit" />
                <button
                  v-for="c in SWATCHES"
                  :key="c"
                  class="ov-swatch"
                  :class="{ 'is-on': common('color') === c }"
                  :style="{ background: c }"
                  :title="c"
                  @click="(setProp('color', c), commit())"
                />
              </div>
            </div>
          </div>

          <div class="ov-field">
            <label>文字對齊</label>
            <div class="mac-form-seg">
              <button
                v-for="[a, icon, t] in [['start', mdiFormatAlignLeft, '靠左'], ['middle', mdiFormatAlignCenter, '置中'], ['end', mdiFormatAlignRight, '靠右']]"
                :key="a"
                class="mac-form-seg-btn"
                :class="{ 'is-active': commonOf((o) => o.anchor || 'start') === a }"
                :title="t"
                @click="setAnchor(a)"
              >
                <McIcon :d="icon" :size="16" />
              </button>
            </div>
          </div>

          <div class="ov-field">
            <label>最大寬度</label>
            <input
              class="mac-form-input"
              type="number"
              min="1"
              step="1"
              :value="common('maxW') ?? ''"
              :placeholder="selObjs.some((o) => o.maxW) ? '多種' : '不限'"
              @change="setMaxW($event.target.value)"
            />
          </div>

          <div class="ov-field ov-field--half">
            <div>
              <label>X</label>
              <input class="mac-form-input" type="number" step="0.5" :value="r1(selBox.x)" @change="setPos('x', $event.target.value)" />
            </div>
            <div>
              <label>Y</label>
              <input class="mac-form-input" type="number" step="0.5" :value="r1(selBox.y)" @change="setPos('y', $event.target.value)" />
            </div>
          </div>

          <div class="ov-field">
            <label>對齊</label>
            <div class="ov-row">
              <button class="mac-icon-btn" title="靠左" :disabled="arrangeUnits.length < 2" @click="align('left')"><McIcon :d="mdiAlignHorizontalLeft" /></button>
              <button class="mac-icon-btn" title="水平置中" :disabled="arrangeUnits.length < 2" @click="align('hcenter')"><McIcon :d="mdiAlignHorizontalCenter" /></button>
              <button class="mac-icon-btn" title="靠右" :disabled="arrangeUnits.length < 2" @click="align('right')"><McIcon :d="mdiAlignHorizontalRight" /></button>
              <button class="mac-icon-btn" title="靠上" :disabled="arrangeUnits.length < 2" @click="align('top')"><McIcon :d="mdiAlignVerticalTop" /></button>
              <button class="mac-icon-btn" title="垂直置中" :disabled="arrangeUnits.length < 2" @click="align('vmiddle')"><McIcon :d="mdiAlignVerticalCenter" /></button>
              <button class="mac-icon-btn" title="靠下" :disabled="arrangeUnits.length < 2" @click="align('bottom')"><McIcon :d="mdiAlignVerticalBottom" /></button>
              <button class="mac-icon-btn" title="基線對齊" :disabled="arrangeUnits.length < 2" @click="align('baseline')"><McIcon :d="mdiFormatUnderline" /></button>
            </div>
          </div>

          <div class="ov-field">
            <label>平均分散</label>
            <div class="ov-row">
              <button class="mac-btn mac-btn--sm" :disabled="arrangeUnits.length < 3" @click="distribute('h')"><McIcon :d="mdiDistributeHorizontalCenter" :size="16" />水平</button>
              <button class="mac-btn mac-btn--sm" :disabled="arrangeUnits.length < 3" @click="distribute('v')"><McIcon :d="mdiDistributeVerticalCenter" :size="16" />垂直</button>
            </div>
          </div>

          <div class="ov-field">
            <label>群組</label>
            <div class="ov-row">
              <button class="mac-btn mac-btn--sm" title="⌘G" :disabled="!canGroup" @click="group"><McIcon :d="mdiGroup" :size="16" />群組</button>
              <button class="mac-btn mac-btn--sm" title="⇧⌘G" :disabled="!canUngroup" @click="ungroup"><McIcon :d="mdiUngroup" :size="16" />解散</button>
            </div>
          </div>

          <div class="ov-field">
            <div class="ov-row">
              <button class="mac-btn mac-btn--sm" title="⌘D" @click="duplicate"><McIcon :d="mdiContentCopy" :size="16" />複製</button>
              <button class="mac-btn mac-btn--sm mac-btn--danger" @click="removeSelected"><McIcon :d="mdiTrashCanOutline" :size="16" />刪除</button>
            </div>
          </div>
        </template>
        <div v-else class="ov-data">
          <div class="ov-data-head">
            <label>{{ unitLabel || curValues.unit }}</label>
            <button v-if="canEdit" class="mac-icon-btn" title="建案設定" @click="emit('settings')"><McIcon :d="mdiCogOutline" /></button>
          </div>
          <div v-if="issues.length" class="mac-callout mac-callout--error ov-issue">位數不足：{{ issues.join('、') }}</div>
          <div v-if="missingFields.length" class="mac-callout mac-callout--warning ov-issue">沒有資料：{{ missingFields.join('、') }}</div>
          <template v-for="g in fieldGroups" :key="g.group">
            <div class="ov-dgroup">{{ g.group }}</div>
            <div v-for="f in g.fields" :key="f.key" class="ov-drow" :title="f.source">
              <span class="ov-dlabel">{{ f.label }}</span>
              <span class="ov-dval" :class="{ 'is-empty': !displayValue(f) }">{{ displayValue(f) || '—' }}</span>
            </div>
          </template>
        </div>
      </aside>
    </div>

    <ContractPrintPages
      v-if="showPages && doc"
      :pdf="doc.pdf"
      :removed="removedPages"
      :objects="objects"
      @close="showPages = false"
      @save="savePages"
    />
    <div v-if="toast" class="ov-toast">{{ toast }}</div>
  </div>
</template>

<style scoped>
.ov { display: flex; flex-direction: column; height: 100%; overflow: hidden; background: #f5f5f7; }
.ov, .ov :deep(*) { box-sizing: border-box; }
.ov-bar {
  display: flex; align-items: center; flex-wrap: wrap; gap: 4px;
  padding: 8px 12px; background: #f5f5f7; border-bottom: 1px solid rgba(0, 0, 0, 0.1);
}
.ov-sep { width: 1px; height: 20px; margin: 0 2px; background: rgba(0, 0, 0, 0.12); }
.ov-grow { flex: 1; }
.ov-dim { color: #6e6e73; white-space: nowrap; }
.ov-num { flex: none; width: 56px; text-align: center; }
.ov-zoom { min-width: 56px; }
.ov-scope { flex: none; width: 108px; }
.ov-rec { flex: none; width: 140px; }
.ov-warn {
  padding: 3px 8px; border-radius: 10px; background: rgba(214, 45, 32, 0.1);
  color: #d62d20; font-size: 12px; font-weight: 600; white-space: nowrap; cursor: help;
}
.ov-bar .mac-btn svg { color: #6e6e73; }
.ov-bar .mac-btn--primary svg { color: #fff; }
.mac-icon-btn:disabled { opacity: 0.35; cursor: default; background: transparent; }
/* 工具列提示：滑鼠移上去約 0.2 秒顯示 */
.ov-bar [data-tip] { position: relative; }
.ov-bar [data-tip]::after {
  content: attr(data-tip); position: absolute; top: calc(100% + 6px); left: 50%; z-index: 30;
  transform: translateX(-50%); padding: 4px 8px; border-radius: 6px;
  background: rgba(29, 29, 31, 0.92); color: #fff; font-size: 12px; font-weight: 500; line-height: 1.4;
  white-space: nowrap; pointer-events: none; opacity: 0; visibility: hidden;
  transition: opacity 0.12s, visibility 0.12s;
}
.ov-bar [data-tip-end]::after { left: auto; right: 0; transform: none; }
.ov-bar [data-tip]:hover::after { opacity: 1; visibility: visible; transition-delay: 0.2s; }
@media (hover: none) { .ov-bar [data-tip]::after { display: none; } }
.mac-icon-btn.is-on { background: rgba(0, 113, 227, 0.12); color: #0071e3; }

.ov-body { flex: 1; display: flex; min-height: 0; }
.ov-stage { flex: 1; min-width: 0; overflow: auto; padding: 24px; background: #e3e3e8; }
.ov-page { position: relative; margin: 0 auto; background: #fff; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2), 0 8px 24px rgba(0, 0, 0, 0.12); }
.ov-page canvas { display: block; width: 100%; height: 100%; }
.ov-svg { position: absolute; inset: 0; width: 100%; height: 100%; overflow: visible; touch-action: none; user-select: none; -webkit-user-select: none; }
.ov-svg.is-text { cursor: text; }
.ov-text { white-space: pre; pointer-events: none; }
.ov-text.is-ghost { opacity: 0.22; }
.ov-todo { fill: rgba(255, 149, 0, 0.12); stroke: #ff9500; stroke-width: 1; stroke-dasharray: 3 2; vector-effect: non-scaling-stroke; pointer-events: none; }
.ov-svg.is-field { cursor: crosshair; }
.ov-var { fill: rgba(255, 196, 0, 0.2); pointer-events: none; }
.ov-hit { fill: transparent; cursor: move; }
.is-text .ov-hit { cursor: text; }
.ov-hit:hover { stroke: rgba(0, 113, 227, 0.55); stroke-width: 1; vector-effect: non-scaling-stroke; }
.ov-sel, .ov-selbox, .ov-guide, .ov-marquee, .ov-handle { vector-effect: non-scaling-stroke; pointer-events: none; }
.ov-sel { fill: none; stroke: #0071e3; stroke-width: 1; }
.ov-sel.is-group { stroke-dasharray: 4 3; }
.ov-selbox { fill: none; stroke: #0071e3; stroke-width: 1; stroke-opacity: 0.5; }
.ov-guide { stroke: #ff2d92; stroke-width: 1; }
.ov-marquee { fill: rgba(0, 113, 227, 0.1); stroke: #0071e3; stroke-width: 1; }
.ov-handle { fill: #fff; stroke: #0071e3; stroke-width: 1; pointer-events: all; }
.ov-handle.is-nw, .ov-handle.is-se { cursor: nwse-resize; }
.ov-handle.is-ne, .ov-handle.is-sw { cursor: nesw-resize; }
.ov-edit {
  position: absolute; box-sizing: content-box; margin: 0; padding: 0; border: 0;
  background: rgba(255, 255, 255, 0.9); outline: 1px solid #0071e3; outline-offset: 1px;
}
.ov-empty { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 12px; height: 100%; color: #8e8e93; font-size: 15px; }
.ov-back { flex: none; padding-left: 6px; }
.ov-name { display: flex; align-items: center; gap: 6px; min-width: 0; max-width: 180px; font-size: 14px; font-weight: 600; white-space: nowrap; }
.ov-name-text { min-width: 0; overflow: hidden; text-overflow: ellipsis; }
.ov-save { display: inline-flex; align-self: center; color: #8e8e93; }
.ov-save.is-saved { color: #34c759; }
.ov-save.is-error { color: #d62d20; }
.ov-todo-chip {
  padding: 3px 9px; border: 0; border-radius: 10px; background: rgba(255, 149, 0, 0.16);
  color: #b25f00; font: inherit; font-size: 12px; font-weight: 600; white-space: nowrap; cursor: pointer;
}
.ov-todo-chip:hover { background: rgba(255, 149, 0, 0.26); }
.ov-dgroup { margin: 12px 0 4px; font-size: 11px; font-weight: 600; color: #8e8e93; }
.ov-pick-row {
  display: block; width: 100%; padding: 6px 10px; border: 0; border-radius: 6px; background: transparent;
  color: #1d1d1f; font: inherit; font-size: 13px; text-align: left; cursor: pointer;
}
.ov-pick-row:hover { background: rgba(0, 0, 0, 0.05); }
.ov-pick-row.is-on { background: #0071e3; color: #fff; }

.ov-panel {
  flex: none; width: 252px; padding: 12px; overflow-y: auto;
  background: #f5f5f7; border-left: 1px solid rgba(0, 0, 0, 0.1);
}
.ov-field { display: flex; flex-direction: column; gap: 6px; margin-bottom: 14px; }
.ov-field label { font-size: 11.5px; font-weight: 600; color: #6e6e73; }
.ov-field .mac-form-input { flex: none; width: 100%; }
.ov-field--half { flex-direction: row; gap: 10px; }
.ov-field--half > div { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 6px; }
.ov-field--half > .ov-narrow { flex: 0 0 72px; }
.ov-sub { margin-bottom: 0; }
.ov-field > .mac-form-seg { align-self: flex-start; }
.ov-row { display: flex; align-items: center; flex-wrap: wrap; gap: 6px; }
.ov-color { width: 28px; height: 28px; padding: 0; border: 1px solid rgba(0, 0, 0, 0.14); border-radius: 6px; background: #fff; cursor: pointer; }
.ov-swatch { width: 18px; height: 18px; padding: 0; border: 0; border-radius: 50%; cursor: pointer; box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.15); }
.ov-swatch.is-on { box-shadow: 0 0 0 2px #f5f5f7, 0 0 0 4px #0071e3; }
.ov-none { padding: 24px 0; text-align: center; color: #8e8e93; }
.ov-data-head { display: flex; align-items: center; gap: 2px; margin-bottom: 8px; }
.ov-data-head label { flex: 1; min-width: 0; font-size: 13px; font-weight: 600; color: #1d1d1f; }
.ov-issue { margin-bottom: 8px; }
.ov-drow { display: flex; align-items: center; gap: 8px; min-height: 32px; }
.ov-dlabel { flex: none; width: 74px; font-size: 12px; color: #6e6e73; }
.ov-drow .mac-form-input { flex: 1; min-width: 0; height: 26px; }
.ov-drow .mac-form-input.is-num { text-align: right; }
.ov-dval { flex: 1; min-width: 0; text-align: right; color: #1d1d1f; font-weight: 500; word-break: break-all; }
.ov-dval.is-empty { color: #c7c7cc; font-weight: 400; }
.ov-miss {
  padding: 3px 8px; border-radius: 10px; background: rgba(255, 149, 0, 0.16);
  color: #b25f00; font-size: 12px; font-weight: 600; white-space: nowrap; cursor: help;
}
.ov-dcalc { flex: 1; padding-right: 10px; text-align: right; font-variant-numeric: tabular-nums; color: #1d1d1f; font-weight: 500; }
.ov-toast {
  position: fixed; left: 50%; bottom: 28px; transform: translateX(-50%);
  padding: 8px 16px; border-radius: 18px; background: rgba(29, 29, 31, 0.88); color: #fff; font-size: 13px; white-space: nowrap;
}

@media (max-width: 760px) {
  .ov-body { flex-direction: column; }
  .ov-panel { width: auto; max-height: 42vh; border-left: 0; border-top: 1px solid rgba(0, 0, 0, 0.1); }
}
</style>
