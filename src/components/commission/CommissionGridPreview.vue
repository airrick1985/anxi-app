<template>
  <v-card variant="outlined" class="grid-preview">
    <v-card-title class="text-subtitle-2 d-flex align-center flex-wrap ga-1">
      <v-icon start size="small">mdi-eye-outline</v-icon>{{ title }}
      <span v-if="caption" class="text-caption text-medium-emphasis ml-2">{{ caption }}</span>
      <v-chip v-if="sortable && hasPersonCols" size="x-small" variant="tonal" color="primary" class="ml-1" prepend-icon="mdi-drag-horizontal-variant">拖曳人員姓名可調整欄位順序</v-chip>
      <v-chip v-if="editable && hasEditCells" size="x-small" variant="tonal" color="primary" class="ml-1" prepend-icon="mdi-cursor-text">點虛線框文字可直接修改</v-chip>
      <v-chip v-if="unitSortable && hasUnitRows" size="x-small" variant="tonal" color="primary" class="ml-1" prepend-icon="mdi-drag-vertical-variant">拖曳編號可調整戶別順序</v-chip>
      <v-spacer></v-spacer>
      <div class="d-flex align-center ga-1">
        <v-btn icon="mdi-minus" size="x-small" variant="text" :disabled="zoom <= MIN_ZOOM" @click="stepZoom(-1)"></v-btn>
        <v-btn size="x-small" variant="text" class="zoom-label" @click="setZoom(1)">{{ Math.round(zoom * 100) }}%</v-btn>
        <v-btn icon="mdi-plus" size="x-small" variant="text" :disabled="zoom >= MAX_ZOOM" @click="stepZoom(1)"></v-btn>
        <v-btn size="x-small" variant="tonal" prepend-icon="mdi-arrow-expand-horizontal" :color="fitWidth ? 'primary' : undefined" @click="toggleFit">符合寬度</v-btn>
        <v-chip size="x-small" variant="tonal" class="ml-1">{{ grids.length }} {{ unitLabel }}</v-chip>
        <slot name="actions"></slot>
      </div>
    </v-card-title>
    <v-tabs v-if="grids.length > 1" v-model="tab" density="compact" color="primary" show-arrows>
      <v-tab v-for="(gr, i) in grids" :key="i" :value="i">{{ gr.name }}</v-tab>
    </v-tabs>
    <v-divider></v-divider>
    <v-card-text ref="wrapRef" class="preview-wrap" :class="{ 'is-sortable': sortable && hasPersonCols, 'is-editable': editable && hasEditCells, 'is-unit-sortable': unitSortable && hasUnitRows }" :style="{ maxHeight }">
      <div v-if="current" class="preview-zoom" :style="{ zoom }" v-html="html"
        @click="onCellClick"
        @dragstart="onDragStart" @dragover="onDragOver" @dragleave="onDragLeave" @drop="onDrop" @dragend="onDragEnd"></div>
      <!-- 就地編輯浮動框（定位於被點的格子） -->
      <v-card v-if="editor" class="cell-editor" elevation="8" :style="{ top: editor.top + 'px', left: editor.left + 'px', width: editor.width + 'px' }" @click.stop>
        <v-card-text class="pa-2">
          <v-textarea v-if="editor.multiline" v-model="editor.value" :label="editor.label" rows="2" auto-grow autofocus
            variant="outlined" density="compact" hide-details @update:model-value="onEditorInput" @keydown.esc.prevent="closeEditor"></v-textarea>
          <v-text-field v-else v-model="editor.value" :label="editor.label" autofocus variant="outlined" density="compact" hide-details
            @update:model-value="onEditorInput" @keydown.enter.prevent="closeEditor" @keydown.esc.prevent="closeEditor"></v-text-field>
          <div class="d-flex align-center ga-2 mt-1">
            <span v-if="editor.hint" class="text-caption text-medium-emphasis">{{ editor.hint }}</span>
            <v-spacer></v-spacer>
            <v-btn size="x-small" variant="tonal" color="primary" @click="closeEditor">完成</v-btn>
          </div>
        </v-card-text>
      </v-card>
      <div v-else class="text-center text-medium-emphasis py-8">沒有可預覽的內容</div>
    </v-card-text>
  </v-card>
</template>

<script setup>
import { ref, computed, watch, nextTick, onMounted, onBeforeUnmount } from 'vue';
import { gridToHtml } from '@/services/commissionExcelService';

const props = defineProps({
  grids: { type: Array, default: () => [] },
  title: { type: String, default: '即時預覽' },
  caption: { type: String, default: '' },
  unitLabel: { type: String, default: '張分頁' },
  maxHeight: { type: String, default: '70vh' },
  sortable: { type: Boolean, default: false },   // 允許拖曳人員欄位排序（獎金表）
  unitSortable: { type: Boolean, default: false },   // 允許拖曳戶別列上下排序（請佣總表／獎金表）
  editable: { type: Boolean, default: false },   // 允許點格子就地修改文字自訂
  editValues: { type: Object, default: () => ({}) },   // 文字自訂目前值 { key: 原始字串（含 {pct} 等樣板） }
});
const emit = defineEmits(['reorder', 'reorder-units', 'edit']);   // reorder：{ section, personKeys }；reorder-units：{ unitIds }；edit：{ key, value }

const MIN_ZOOM = 0.3;
const MAX_ZOOM = 2;
const ZOOM_STEP = 0.1;
const PADDING = 32;   // preview-wrap 左右 padding 合計

const tab = ref(0);
const zoom = ref(1);
const fitWidth = ref(false);
const wrapRef = ref(null);

const current = computed(() => props.grids[tab.value] || null);
const html = computed(() => (current.value ? gridToHtml(current.value) : ''));
const hasPersonCols = computed(() => (current.value?.personCols || []).length > 0);
const hasEditCells = computed(() => (current.value?.editCells || []).length > 0);
const hasUnitRows = computed(() => (current.value?.unitRows || []).length > 1);

// ---------- 戶別列拖曳排序 ----------
let rowDrag = null;   // { idx }
let rowOverIdx = -1;
function rowCells(idx) {
  const root = wrapRef.value?.$el || wrapRef.value;
  return root ? Array.from(root.querySelectorAll(`[data-ur="${idx}"]`)) : [];
}
function clearRowOver() {
  if (rowOverIdx < 0) return;
  rowCells(rowOverIdx).forEach(el => el.classList.remove('ur-over-above', 'ur-over-below'));
  rowOverIdx = -1;
}
function onRowDragStart(e, handle) {
  const idx = Number(handle.dataset.ur);
  if (!current.value?.unitRows?.[idx]) return;
  rowDrag = { idx };
  try { e.dataTransfer.effectAllowed = 'move'; e.dataTransfer.setData('text/plain', current.value.unitRows[idx].unitId); } catch { /* ignore */ }
  rowCells(idx).forEach(el => el.classList.add('ur-dragging'));
}
function onRowDragOver(e) {
  const cell = e.target?.closest?.('[data-ur]');
  const idx = cell ? Number(cell.dataset.ur) : -1;
  if (idx < 0 || idx === rowDrag.idx) { clearRowOver(); return; }
  e.preventDefault();
  e.dataTransfer.dropEffect = 'move';
  if (rowOverIdx !== idx) {
    clearRowOver();
    rowOverIdx = idx;
    rowCells(idx).forEach(el => el.classList.add(idx < rowDrag.idx ? 'ur-over-above' : 'ur-over-below'));
  }
}
function onRowDrop(e) {
  const cell = e.target?.closest?.('[data-ur]');
  const idx = cell ? Number(cell.dataset.ur) : -1;
  if (idx < 0 || idx === rowDrag.idx) { onRowDragEnd(); return; }
  e.preventDefault();
  const ids = current.value.unitRows.map(u => u.unitId);
  const [moved] = ids.splice(rowDrag.idx, 1);
  ids.splice(idx, 0, moved);
  onRowDragEnd();
  emit('reorder-units', { unitIds: Array.from(new Set(ids)) });
}
function onRowDragEnd() {
  if (rowDrag) rowCells(rowDrag.idx).forEach(el => el.classList.remove('ur-dragging'));
  clearRowOver();
  rowDrag = null;
}

// ---------- 文字自訂就地編輯 ----------
const editor = ref(null);   // { key, label, hint, multiline, value, top, left, width }
function onCellClick(e) {
  if (!props.editable) return;
  const cell = e.target?.closest?.('[data-ed]');
  if (!cell) { closeEditor(); return; }
  const meta = current.value?.editCells?.[Number(cell.dataset.ed)];
  if (!meta) return;
  const wrap = wrapRef.value?.$el || wrapRef.value;
  const wr = wrap.getBoundingClientRect();
  const cr = cell.getBoundingClientRect();
  const width = Math.min(Math.max(cr.width, 320), Math.max(240, wrap.clientWidth - 24));
  const left = Math.max(4, Math.min(cr.left - wr.left + wrap.scrollLeft, wrap.scrollLeft + wrap.clientWidth - width - 4));
  editor.value = {
    key: meta.key, label: meta.label || meta.key, hint: meta.hint || '', multiline: !!meta.multiline,
    value: String(props.editValues?.[meta.key] ?? ''),
    top: cr.bottom - wr.top + wrap.scrollTop + 4, left, width,
  };
}
function onEditorInput(v) {
  if (!editor.value) return;
  emit('edit', { key: editor.value.key, value: String(v ?? '') });
}
function closeEditor() { editor.value = null; }
watch(() => props.editable, v => { if (!v) closeEditor(); });
watch(tab, closeEditor);

// ---------- 人員欄位拖曳排序（HTML5 DnD，事件委派到 v-html 容器） ----------
let drag = null;   // { idx, section, cat }
let overIdx = -1;

function colMeta(idx) { return current.value?.personCols?.[idx] || null; }
function cellsOf(idx) {
  const root = wrapRef.value?.$el || wrapRef.value;
  return root ? Array.from(root.querySelectorAll(`[data-pc="${idx}"]`)) : [];
}
function clearOver() {
  if (overIdx < 0) return;
  cellsOf(overIdx).forEach(el => el.classList.remove('pc-over-before', 'pc-over-after'));
  overIdx = -1;
}
/** 同區（上段銷售人員／下段管理職／下段其他人員）才可互相排序 */
function canDropOn(idx) {
  if (!drag || idx === drag.idx) return false;
  const m = colMeta(idx);
  return !!m && m.section === drag.section;
}
function onDragStart(e) {
  const rowHandle = e.target?.closest?.('[data-unit-handle]');
  if (rowHandle) {
    if (!props.unitSortable) { e.preventDefault?.(); return; }
    onRowDragStart(e, rowHandle);
    return;
  }
  const head = e.target?.closest?.('[data-person-key]');
  if (!props.sortable || !head) { e.preventDefault?.(); return; }
  const idx = Number(head.dataset.pc);
  const m = colMeta(idx);
  if (!m) return;
  drag = { idx, section: m.section, cat: m.mgmtCat || '' };
  try { e.dataTransfer.effectAllowed = 'move'; e.dataTransfer.setData('text/plain', m.personKey); } catch { /* ignore */ }
  cellsOf(idx).forEach(el => el.classList.add('pc-dragging'));
}
function onDragOver(e) {
  if (rowDrag) { onRowDragOver(e); return; }
  if (!drag) return;
  const cell = e.target?.closest?.('[data-pc]');
  const idx = cell ? Number(cell.dataset.pc) : -1;
  if (idx < 0 || !canDropOn(idx)) { clearOver(); return; }
  e.preventDefault();
  e.dataTransfer.dropEffect = 'move';
  if (overIdx !== idx) {
    clearOver();
    overIdx = idx;
    const cls = idx < drag.idx ? 'pc-over-before' : 'pc-over-after';
    cellsOf(idx).forEach(el => el.classList.add(cls));
  }
}
function onDragLeave(e) {
  const root = wrapRef.value?.$el || wrapRef.value;
  if (root && e.relatedTarget && root.contains(e.relatedTarget)) return;
  clearOver();
  clearRowOver();
}
function onDrop(e) {
  if (rowDrag) { onRowDrop(e); return; }
  if (!drag) return;
  const cell = e.target?.closest?.('[data-pc]');
  const idx = cell ? Number(cell.dataset.pc) : -1;
  if (idx < 0 || !canDropOn(idx)) { onDragEnd(); return; }
  e.preventDefault();
  const cols = current.value.personCols;
  const from = cols[drag.idx];
  const list = cols.filter(c => c.section === drag.section);
  const keys = list.map(c => c.personKey);
  const fromPos = keys.indexOf(from.personKey);
  const toPos = keys.indexOf(cols[idx].personKey);
  keys.splice(fromPos, 1);
  keys.splice(toPos, 0, from.personKey);
  const section = drag.section;
  onDragEnd();
  emit('reorder', { section, personKeys: keys });
}
function onDragEnd() {
  if (rowDrag) { onRowDragEnd(); return; }
  if (drag) cellsOf(drag.idx).forEach(el => el.classList.remove('pc-dragging'));
  clearOver();
  drag = null;
}
// gridToHtml 以 cols×1.05 設欄寬（table-layout: fixed），表格自然寬度可直接由欄寬加總得出
const naturalWidth = computed(() => (current.value ? current.value.cols.reduce((s, w) => s + Math.round(w * 1.05), 0) + 2 : 0));

function clamp(z) { return Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, Math.round(z * 100) / 100)); }
function setZoom(z) { fitWidth.value = false; zoom.value = clamp(z); }
function stepZoom(dir) { setZoom(zoom.value + dir * ZOOM_STEP); }

function applyFit() {
  const el = wrapRef.value?.$el || wrapRef.value;
  if (!fitWidth.value || !el || !naturalWidth.value) return;
  zoom.value = clamp((el.clientWidth - PADDING) / naturalWidth.value);
}
function toggleFit() {
  fitWidth.value = !fitWidth.value;
  if (fitWidth.value) nextTick(applyFit);
  else zoom.value = 1;
}

watch(() => props.grids, (g) => { if (tab.value >= g.length) tab.value = 0; });
watch([current, naturalWidth], () => nextTick(applyFit));

let observer = null;
onMounted(() => {
  const el = wrapRef.value?.$el || wrapRef.value;
  if (el && typeof ResizeObserver !== 'undefined') {
    observer = new ResizeObserver(() => applyFit());
    observer.observe(el);
  }
});
onBeforeUnmount(() => { observer?.disconnect(); });
</script>

<style scoped>
.preview-wrap {
  position: relative;
  overflow: auto;
  background: #eceff4;
  padding: 16px;
}
.cell-editor { position: absolute; z-index: 5; }
.is-editable :deep(td.ed-cell) { cursor: text; outline: 1px dashed rgb(var(--v-theme-primary)); outline-offset: -1px; }
.is-editable :deep(td.ed-cell:hover) { background: rgba(var(--v-theme-primary), .08) !important; }
.preview-zoom { display: inline-block; min-width: 100%; }
.preview-wrap :deep(table.comm-grid) {
  background: #fff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.12);
  margin: 0 auto;
}
.zoom-label { min-width: 48px; }
/* 人員欄位拖曳排序 */
.is-sortable :deep(td.pc-head) { cursor: grab; }
.is-sortable :deep(td.pc-head:hover) { outline: 2px solid rgb(var(--v-theme-primary)); outline-offset: -2px; }
.preview-wrap :deep(td.pc-dragging) { opacity: .35; }
.preview-wrap :deep(td.pc-over-before) { box-shadow: inset 3px 0 0 rgb(var(--v-theme-primary)); }
.preview-wrap :deep(td.pc-over-after) { box-shadow: inset -3px 0 0 rgb(var(--v-theme-primary)); }
/* 戶別列拖曳排序 */
.is-unit-sortable :deep(td.ur-handle) { cursor: grab; }
.is-unit-sortable :deep(td.ur-handle:hover) { outline: 2px solid rgb(var(--v-theme-primary)); outline-offset: -2px; }
.preview-wrap :deep(td.ur-dragging) { opacity: .35; }
.preview-wrap :deep(td.ur-over-above) { box-shadow: inset 0 3px 0 rgb(var(--v-theme-primary)); }
.preview-wrap :deep(td.ur-over-below) { box-shadow: inset 0 -3px 0 rgb(var(--v-theme-primary)); }
</style>
