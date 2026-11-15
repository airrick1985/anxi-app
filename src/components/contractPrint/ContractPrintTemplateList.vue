<script setup>
// 合約套印：建案的範本清單（新增範本＝上傳空白合約 PDF，建立後自動偵測）
import { nextTick, onMounted, reactive, ref } from 'vue'
import { mdiClose, mdiCogOutline, mdiFileDocumentOutline, mdiPencilOutline, mdiPlus, mdiTrashCanOutline } from '@mdi/js'
import McIcon from './McIcon.js'
import {
  createContractPrintTemplate,
  deleteContractPrintTemplate,
  getContractPrintTemplatePdf,
  listContractPrintTemplates,
  saveContractPrintTemplate,
} from '@/api'
import { openPdfBytes } from '@/utils/contractPrint/pdfjsLoader.js'

const props = defineProps({
  projectId: { type: String, required: true },
  title: { type: String, default: '' },
  canEdit: Boolean,
})
const emit = defineEmits(['open', 'close', 'settings'])

const list = ref([])
const loaded = ref(false)
const thumbs = reactive({}) // id → dataURL
const renaming = ref(null) // { id, name }
const dlg = ref(null) // { name, file, error, busy }
const fileEl = ref(null)
const tplFileEl = ref(null)
const nameEl = ref(null)
const renameEl = ref(null)

const loadError = ref('')
async function refresh() {
  loadError.value = ''
  try {
    list.value = await listContractPrintTemplates(props.projectId)
  } catch (e) {
    console.error(e)
    loadError.value = '範本清單讀取失敗'
  } finally {
    loaded.value = true
  }
  for (const t of list.value) if (!(t.id in thumbs)) renderThumb(t)
}

async function renderThumb(t) {
  const id = t.id
  thumbs[id] = ''
  try {
    const pdf = await openPdfBytes(await getContractPrintTemplatePdf(t))
    const page = await pdf.getPage(1)
    const vp0 = page.getViewport({ scale: 1 })
    const vp = page.getViewport({ scale: 360 / vp0.width })
    const canvas = document.createElement('canvas')
    canvas.width = vp.width
    canvas.height = vp.height
    await page.render({ canvasContext: canvas.getContext('2d'), viewport: vp }).promise
    thumbs[id] = canvas.toDataURL('image/png')
    pdf.destroy()
  } catch {
    thumbs[id] = ''
  }
}

const fmtDate = (value) => {
  const d = value instanceof Date ? value : new Date(value)
  if (!value || Number.isNaN(d.getTime())) return ''
  const p = (n) => String(n).padStart(2, '0')
  return `${d.getMonth() + 1}/${d.getDate()} ${p(d.getHours())}:${p(d.getMinutes())}`
}

function openNew(file = null) {
  dlg.value = { name: file ? file.name.replace(/\.pdf$/i, '') : '', file, tplFile: null, error: '', busy: false }
  nextTick(() => nameEl.value?.focus())
}
function onPick(e) {
  const file = e.target.files?.[0]
  e.target.value = ''
  if (!file || !dlg.value) return
  dlg.value.file = file
  dlg.value.error = ''
  if (!dlg.value.name.trim()) dlg.value.name = file.name.replace(/\.pdf$/i, '')
}
function onPickTemplate(e) {
  const file = e.target.files?.[0]
  e.target.value = ''
  if (file && dlg.value) dlg.value.tplFile = file
}
/** 讀取既有範本檔（本機試做版的 template.json）的物件 */
async function readTemplateObjects(file) {
  const data = JSON.parse(await file.text())
  const objects = Array.isArray(data) ? data : data?.objects
  if (!Array.isArray(objects)) throw new Error('範本檔格式不符')
  return objects
}
async function create() {
  const d = dlg.value
  if (!d || !d.name.trim() || !d.file || d.busy) return
  d.busy = true
  d.error = ''
  let imported = null
  if (d.tplFile) {
    try {
      imported = await readTemplateObjects(d.tplFile)
    } catch {
      d.error = '範本檔無法讀取'
      d.busy = false
      return
    }
  }
  try {
    const bytes = new Uint8Array(await d.file.arrayBuffer())
    let pages = 0
    try {
      const pdf = await openPdfBytes(bytes)
      pages = pdf.numPages
      pdf.destroy()
    } catch {
      d.error = '無法讀取這個 PDF'
      d.busy = false
      return
    }
    const t = await createContractPrintTemplate({ projectId: props.projectId, name: d.name.trim(), pdfName: d.file.name, pages, bytes })
    if (imported) await saveContractPrintTemplate(t.id, { objects: imported })
    dlg.value = null
    // 匯入既有範本就不再自動偵測
    emit('open', t.id, { detect: !imported })
  } catch {
    d.error = '建立失敗'
    d.busy = false
  }
}

function startRename(t) {
  renaming.value = { id: t.id, name: t.name }
  nextTick(() => {
    renameEl.value?.[0]?.focus()
    renameEl.value?.[0]?.select()
  })
}
async function finishRename() {
  const r = renaming.value
  renaming.value = null
  if (!r) return
  const t = list.value.find((x) => x.id === r.id)
  if (!t || !r.name.trim() || r.name.trim() === t.name) return
  t.name = r.name.trim()
  await saveContractPrintTemplate(r.id, { name: t.name }).catch(() => {})
}
async function remove(t) {
  if (!window.confirm(`刪除範本「${t.name}」？`)) return
  await deleteContractPrintTemplate(t).catch((e) => console.error(e))
  await refresh()
}

function onDrop(e) {
  if (!props.canEdit) return
  const file = [...(e.dataTransfer?.files || [])].find((f) => /\.pdf$/i.test(f.name))
  if (!file) return
  if (dlg.value) {
    dlg.value.file = file
    if (!dlg.value.name.trim()) dlg.value.name = file.name.replace(/\.pdf$/i, '')
  } else openNew(file)
}

onMounted(refresh)
</script>

<template>
  <div class="tl mac-form" @dragover.prevent @drop.prevent="onDrop">
    <header class="tl-bar">
      <div class="tl-title">合約套印<span v-if="title" class="tl-sub">{{ title }}</span></div>
      <button class="mac-btn" @click="emit('settings')"><McIcon :d="mdiCogOutline" />建案設定</button>
      <button v-if="canEdit" class="mac-btn mac-btn--primary" @click="openNew()"><McIcon :d="mdiPlus" />新增範本</button>
      <button class="mac-icon-btn" title="關閉" @click="emit('close')"><McIcon :d="mdiClose" /></button>
    </header>

    <main class="tl-main">
      <div v-if="loadError" class="tl-empty">{{ loadError }}</div>
      <div v-else-if="loaded && !list.length" class="tl-empty">
        <McIcon :d="mdiFileDocumentOutline" :size="40" />
        <div>{{ canEdit ? '還沒有範本' : '本建案尚未建立套印範本' }}</div>
        <button v-if="canEdit" class="mac-btn mac-btn--primary" @click="openNew()"><McIcon :d="mdiPlus" />新增範本</button>
      </div>
      <div v-else class="tl-grid">
        <article v-for="t in list" :key="t.id" class="tl-card" @click="renaming?.id !== t.id && emit('open', t.id)">
          <div class="tl-thumb">
            <img v-if="thumbs[t.id]" :src="thumbs[t.id]" alt="" />
          </div>
          <div class="tl-info">
            <input
              v-if="renaming?.id === t.id"
              ref="renameEl"
              v-model="renaming.name"
              class="mac-form-input tl-rename"
              @click.stop
              @keydown.enter="finishRename"
              @keydown.esc="renaming = null"
              @blur="finishRename"
            />
            <div v-else class="tl-name">{{ t.name }}</div>
            <div class="tl-file">{{ t.pdfName }}</div>
            <div class="tl-meta">
              <span>{{ t.pages }} 頁</span><span>{{ t.count }} 格</span><span>{{ fmtDate(t.updatedAt) }}</span>
              <span v-if="t.todo" class="tl-todo">待設定 {{ t.todo }}</span>
            </div>
          </div>
          <div v-if="canEdit" class="tl-actions" @click.stop>
            <button class="mac-icon-btn" title="改名" @click="startRename(t)"><McIcon :d="mdiPencilOutline" /></button>
            <button class="mac-icon-btn mac-icon-btn--danger" title="刪除" @click="remove(t)"><McIcon :d="mdiTrashCanOutline" /></button>
          </div>
        </article>
      </div>
    </main>

    <div v-if="dlg" class="tl-mask" @pointerdown.self="!dlg.busy && (dlg = null)">
      <div class="tl-dialog mac-sheet">
        <div class="mac-sheet-head">新增範本</div>
        <div class="mac-sheet-section">
          <div class="mac-sheet-label">建案名稱</div>
          <input ref="nameEl" v-model="dlg.name" class="mac-form-input tl-input" @keydown.enter="create" />
          <div class="mac-sheet-label tl-gap">空白合約 PDF</div>
          <div class="tl-pick">
            <button class="mac-btn" @click="fileEl.click()">選擇檔案</button>
            <span class="tl-pick-name">{{ dlg.file?.name || '未選擇' }}</span>
          </div>
          <input ref="fileEl" type="file" accept="application/pdf" hidden @change="onPick" />
          <div class="mac-sheet-label tl-gap">範本檔（選填）</div>
          <div class="tl-pick">
            <button class="mac-btn" @click="tplFileEl.click()">選擇檔案</button>
            <span class="tl-pick-name">{{ dlg.tplFile?.name || '不使用（自動偵測）' }}</span>
          </div>
          <input ref="tplFileEl" type="file" accept=".json,application/json" hidden @change="onPickTemplate" />
          <div v-if="dlg.error" class="mac-callout mac-callout--error tl-gap">{{ dlg.error }}</div>
        </div>
        <div class="mac-sheet-foot">
          <span class="mac-spacer" />
          <button class="mac-btn" :disabled="dlg.busy" @click="dlg = null">取消</button>
          <button class="mac-btn mac-btn--primary" :disabled="!dlg.name.trim() || !dlg.file || dlg.busy" @click="create">
            {{ dlg.busy ? '建立中…' : '建立' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.tl { display: flex; flex-direction: column; height: 100%; overflow: hidden; background: #f5f5f7; }
.tl-sub { margin-left: 10px; font-size: 14px; font-weight: 500; color: #6e6e73; }
.tl, .tl :deep(*) { box-sizing: border-box; }
.tl-bar { display: flex; align-items: center; gap: 12px; padding: 14px 24px; border-bottom: 1px solid rgba(0, 0, 0, 0.08); }
.tl-title { flex: 1; font-size: 20px; font-weight: 700; letter-spacing: -0.01em; white-space: nowrap; }
.tl-bar .mac-btn svg { color: #6e6e73; }
.tl-bar .mac-btn--primary svg { color: #fff; }
.tl-main { flex: 1; overflow: auto; padding: 24px; }
.tl-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 20px; }
.tl-card {
  position: relative; display: flex; flex-direction: column; overflow: hidden;
  background: #fff; border-radius: 12px; cursor: pointer;
  box-shadow: 0 0.5px 1px rgba(0, 0, 0, 0.12), 0 0 0 0.5px rgba(0, 0, 0, 0.06);
  transition: box-shadow 0.15s, transform 0.15s;
}
.tl-card:hover { box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12), 0 0 0 0.5px rgba(0, 0, 0, 0.08); transform: translateY(-1px); }
.tl-thumb { height: 200px; overflow: hidden; background: #ececf0; display: flex; justify-content: center; align-items: flex-start; }
.tl-thumb img { width: 82%; margin-top: 14px; box-shadow: 0 1px 4px rgba(0, 0, 0, 0.18); background: #fff; }
.tl-info { padding: 10px 12px 12px; min-width: 0; }
.tl-name { font-size: 14px; font-weight: 600; line-height: 1.35; word-break: break-all; }
.tl-rename { width: 100%; }
.tl-file { margin-top: 2px; font-size: 12px; color: #6e6e73; word-break: break-all; }
.tl-meta { display: flex; flex-wrap: wrap; gap: 4px 10px; margin-top: 6px; font-size: 12px; color: #6e6e73; }
.tl-todo { color: #c27400; font-weight: 600; }
.tl-actions { position: absolute; top: 8px; right: 8px; display: flex; gap: 2px; padding: 2px; border-radius: 8px; background: rgba(255, 255, 255, 0.92); opacity: 0; transition: opacity 0.12s; }
.tl-card:hover .tl-actions, .tl-actions:focus-within { opacity: 1; }
@media (hover: none) { .tl-actions { opacity: 1; } }
.tl-empty { display: flex; flex-direction: column; align-items: center; gap: 12px; padding-top: 18vh; color: #8e8e93; font-size: 15px; }
.tl-empty .mac-btn--primary svg { color: #fff; }
.tl-mask { position: fixed; inset: 0; display: grid; place-items: center; padding: 16px; background: rgba(0, 0, 0, 0.25); z-index: 3000; }
.tl-dialog { width: min(420px, 100%); background: #fff; box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3); }
.tl-input { width: 100%; }
.tl-gap { margin-top: 14px; }
.tl-pick { display: flex; align-items: center; gap: 10px; min-width: 0; }
.tl-pick-name { min-width: 0; font-size: 13px; color: #6e6e73; word-break: break-all; }
</style>
