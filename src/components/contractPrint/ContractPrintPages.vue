<script setup>
// 合約套印：頁面管理（標記刪除／還原頁面；PDF 本身不變）
import { computed, onBeforeUnmount, onMounted, reactive } from 'vue'
import { mdiClose, mdiRestore, mdiTrashCanOutline } from '@mdi/js'
import McIcon from './McIcon.js'

const props = defineProps({
  pdf: { type: Object, required: true }, // pdfjs 文件
  removed: { type: Array, default: () => [] }, // 目前已刪除的頁碼
  objects: { type: Array, default: () => [] }, // 範本物件（顯示各頁有幾格）
})
const emit = defineEmits(['close', 'save'])

const total = props.pdf.numPages
const marked = reactive(new Set(props.removed))
const thumbs = reactive({})
const counts = computed(() => {
  const map = {}
  for (const o of props.objects) if (!o.todo) map[o.page] = (map[o.page] || 0) + 1
  return map
})
const keptCount = computed(() => total - marked.size)
const hiddenCells = computed(() => [...marked].reduce((s, n) => s + (counts.value[n] || 0), 0))
const changed = computed(() => marked.size !== props.removed.length || props.removed.some((n) => !marked.has(n)))

function toggle(n) {
  if (marked.has(n)) marked.delete(n)
  else if (marked.size < total - 1) marked.add(n) // 至少保留一頁
}

let cancelled = false
onMounted(async () => {
  for (let n = 1; n <= total && !cancelled; n++) {
    try {
      const page = await props.pdf.getPage(n)
      const base = page.getViewport({ scale: 1 })
      const vp = page.getViewport({ scale: 220 / base.width })
      const canvas = document.createElement('canvas')
      canvas.width = vp.width
      canvas.height = vp.height
      await page.render({ canvasContext: canvas.getContext('2d'), viewport: vp }).promise
      thumbs[n] = canvas.toDataURL('image/png')
    } catch {
      thumbs[n] = ''
    }
  }
})
onBeforeUnmount(() => (cancelled = true))
</script>

<template>
  <div class="cpp-mask" @pointerdown.self="emit('close')">
    <div class="cpp mac-sheet">
      <div class="mac-sheet-head">
        頁面
        <span class="cpp-sum">保留 {{ keptCount }} / {{ total }} 頁</span>
        <button class="mac-sheet-close" title="關閉" @click="emit('close')"><McIcon :d="mdiClose" /></button>
      </div>
      <div class="cpp-grid">
        <button v-for="n in total" :key="n" type="button" class="cpp-page" :class="{ 'is-removed': marked.has(n) }" @click="toggle(n)">
          <div class="cpp-thumb">
            <img v-if="thumbs[n]" :src="thumbs[n]" alt="" />
            <span v-if="marked.has(n)" class="cpp-badge">已刪除</span>
          </div>
          <div class="cpp-meta">
            <span>第 {{ n }} 頁</span>
            <span v-if="counts[n]" class="cpp-count">{{ counts[n] }} 格</span>
            <span class="cpp-act" :title="marked.has(n) ? '還原' : '刪除'">
              <McIcon :d="marked.has(n) ? mdiRestore : mdiTrashCanOutline" :size="16" />
            </span>
          </div>
        </button>
      </div>
      <div class="mac-sheet-foot">
        <span v-if="hiddenCells" class="cpp-warn">刪除的頁面上有 {{ hiddenCells }} 格欄位，會一起隱藏</span>
        <span class="mac-spacer" />
        <button class="mac-btn" @click="emit('close')">取消</button>
        <button class="mac-btn mac-btn--primary" :disabled="!changed" @click="emit('save', [...marked])">儲存</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.cpp-mask { position: fixed; inset: 0; z-index: 3000; display: grid; place-items: center; padding: 16px; background: rgba(0, 0, 0, 0.25); }
.cpp { display: flex; flex-direction: column; width: min(980px, 100%); max-height: min(860px, 100%); background: #fff; box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3); }
.cpp, .cpp :deep(*) { box-sizing: border-box; }
.cpp-sum { margin-left: 4px; font-size: 12.5px; font-weight: 500; color: #6e6e73; }
.cpp-grid {
  flex: 1; overflow-y: auto; padding: 16px;
  display: grid; grid-template-columns: repeat(auto-fill, minmax(132px, 1fr)); grid-auto-rows: max-content; align-content: start; gap: 14px;
  background: #f5f5f7;
}
.cpp-page {
  display: flex; flex-direction: column; padding: 0; border: 0; border-radius: 10px; overflow: hidden;
  background: #fff; cursor: pointer; text-align: left; font: inherit; color: #1d1d1f;
  box-shadow: 0 0.5px 1px rgba(0, 0, 0, 0.12), 0 0 0 0.5px rgba(0, 0, 0, 0.06);
  transition: box-shadow 0.12s;
}
.cpp-page:hover { box-shadow: 0 2px 10px rgba(0, 0, 0, 0.14), 0 0 0 0.5px rgba(0, 0, 0, 0.08); }
.cpp-thumb { position: relative; flex: none; padding-top: 141.4%; background: #ececf0; }
.cpp-thumb img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: contain; background: #fff; }
.cpp-page.is-removed .cpp-thumb img { opacity: 0.25; }
.cpp-badge {
  position: absolute; left: 50%; top: 50%; transform: translate(-50%, -50%);
  padding: 3px 10px; border-radius: 10px; background: #d62d20; color: #fff; font-size: 12px; font-weight: 600; white-space: nowrap;
}
.cpp-meta { flex: none; display: flex; align-items: center; gap: 6px; padding: 6px 8px; font-size: 12.5px; }
.cpp-count { color: #0071e3; font-size: 11.5px; font-weight: 600; }
.cpp-act { margin-left: auto; display: inline-flex; color: #8e8e93; }
.cpp-page:hover .cpp-act { color: #d62d20; }
.cpp-page.is-removed .cpp-act { color: #0071e3; }
.cpp-warn { font-size: 12.5px; color: #b25f00; }
</style>
