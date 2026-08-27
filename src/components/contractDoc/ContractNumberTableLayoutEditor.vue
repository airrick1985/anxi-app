<template>
  <div class="cnt-layout-editor">
    <div class="d-flex align-center flex-wrap ga-2 mb-2">
      <div class="text-caption text-grey">
        以渲染後畫面直接編輯：拖曳（左側把手）或 ▲▼ 調整每一列順序、✕ 隱藏列、底部「插入列」可新增自訂列（固定文字＋變數欄位）或還原被隱藏的列。
      </div>
      <v-spacer />
      <v-btn v-if="canEdit && hasLayout" size="x-small" variant="tonal" color="warning"
        prepend-icon="mdi-restore" @click="resetLayout">還原預設版面</v-btn>
    </div>

    <div v-for="sec in structure.sections" :key="sec.key" class="mb-4">
      <div class="cnt-title">{{ sec.title }}</div>
      <div class="cnt-table">
        <draggable :model-value="entriesFor(sec.key)" item-key="_dragKey" handle=".cnt-drag-handle"
          :disabled="!canEdit" @update:model-value="setEntries(sec.key, $event)">
          <template #item="{ element: entry, index: eIdx }">
            <div class="cnt-entry" :class="{ 'cnt-entry--custom': entry.kind === 'custom' }">
              <!-- 左側控制列 -->
              <div v-if="canEdit" class="cnt-entry-controls">
                <v-icon size="16" class="cnt-drag-handle cursor-move text-grey">mdi-drag</v-icon>
                <button type="button" class="cnt-ctl-btn" :disabled="eIdx === 0"
                  title="上移" @click="moveEntry(sec.key, eIdx, -1)">▲</button>
                <button type="button" class="cnt-ctl-btn" :disabled="eIdx === entriesFor(sec.key).length - 1"
                  title="下移" @click="moveEntry(sec.key, eIdx, 1)">▼</button>
              </div>
              <!-- 渲染後的列（與正式預覽同樣式） -->
              <div class="cnt-entry-rows">
                <div v-for="(row, ri) in entryRows(sec, entry)" :key="ri" class="cnt-row">
                  <div v-for="(c, ci) in row.cells" :key="ci" class="cnt-cell"
                    :class="{ 'is-blue': c.blue, 'is-bold': c.bold }"
                    :style="{ flexGrow: c.w || 1 }">{{ c.t }}</div>
                </div>
              </div>
              <!-- 右側動作 -->
              <div v-if="canEdit" class="cnt-entry-actions">
                <button v-if="entry.kind === 'custom'" type="button" class="cnt-ctl-btn cnt-ctl-edit"
                  title="編輯自訂列" @click="openCustomDialog(sec.key, eIdx)">✎</button>
                <button type="button" class="cnt-ctl-btn cnt-ctl-remove"
                  :title="entry.kind === 'custom' ? '刪除自訂列' : '隱藏此列（可由「插入列」還原）'"
                  @click="removeEntry(sec.key, eIdx)">✕</button>
              </div>
            </div>
          </template>
        </draggable>
      </div>

      <!-- 插入列 -->
      <div v-if="canEdit" class="mt-1 d-flex align-center ga-2">
        <v-menu>
          <template #activator="{ props: mp }">
            <v-btn v-bind="mp" size="small" variant="tonal" color="primary" prepend-icon="mdi-plus">插入列</v-btn>
          </template>
          <v-list density="compact">
            <v-list-item prepend-icon="mdi-format-text" title="自訂列（固定文字＋變數欄位）"
              @click="openCustomDialog(sec.key, -1)" />
            <template v-if="hiddenBlocksFor(sec.key).length">
              <v-divider />
              <v-list-subheader>還原被隱藏的列</v-list-subheader>
              <v-list-item v-for="b in hiddenBlocksFor(sec.key)" :key="b.key"
                prepend-icon="mdi-eye-plus-outline" :title="b.label" @click="restoreBlock(sec.key, b.key)" />
            </template>
          </v-list>
        </v-menu>
      </div>
    </div>

    <!-- 自訂列編輯 Dialog -->
    <v-dialog v-model="customDialog.show" max-width="720" scrollable>
      <v-card v-if="customDialog.show">
        <v-card-title class="d-flex align-center">
          {{ customDialog.editIndex >= 0 ? '編輯自訂列' : '新增自訂列' }}
          <v-spacer />
          <v-btn icon variant="text" @click="customDialog.show = false"><v-icon>mdi-close</v-icon></v-btn>
        </v-card-title>
        <v-card-text>
          <div class="text-caption text-grey mb-3">
            由左至右組成一列：固定文字＝契約書對照文字、變數欄位＝自動帶入戶別資料；每個片段都可自選黑字或藍字（藍＝需蓋章內容，變數預設藍、文字預設黑）。
          </div>

          <!-- 即時預覽 -->
          <div class="text-subtitle-2 mb-1">預覽</div>
          <div class="cnt-table mb-4">
            <div class="cnt-row">
              <div v-for="(c, ci) in customPreviewCells" :key="ci" class="cnt-cell"
                :class="{ 'is-blue': c.blue, 'is-bold': c.bold }"
                :style="{ flexGrow: c.w || 1 }">{{ c.t }}</div>
            </div>
          </div>

          <!-- 片段列表 -->
          <div class="text-subtitle-2 mb-1">內容片段</div>
          <div v-for="(seg, si) in customDialog.segments" :key="si"
            class="d-flex align-center ga-2 mb-2">
            <v-btn icon size="x-small" variant="text" :disabled="si === 0"
              @click="swapSegment(si, -1)"><v-icon>mdi-chevron-up</v-icon></v-btn>
            <v-btn icon size="x-small" variant="text" :disabled="si === customDialog.segments.length - 1"
              @click="swapSegment(si, 1)"><v-icon>mdi-chevron-down</v-icon></v-btn>
            <v-select v-model="seg.type"
              :items="[{ title: '固定文字', value: 'text' }, { title: '變數欄位', value: 'var' }]"
              density="compact" variant="outlined" hide-details style="max-width: 150px;" />
            <v-text-field v-if="seg.type === 'text'" v-model="seg.value" density="compact" variant="outlined"
              hide-details placeholder="輸入固定文字" class="flex-grow-1" />
            <v-select v-else v-model="seg.key" :items="variableOptions"
              item-title="label" item-value="key" density="compact" variant="outlined"
              hide-details placeholder="選擇變數" class="flex-grow-1" />
            <!-- 顏色：每個片段可自選黑字/藍字（藍＝需蓋章內容） -->
            <v-btn-toggle :model-value="segColor(seg)" @update:model-value="seg.color = $event"
              density="compact" mandatory divided class="seg-color-toggle">
              <v-btn value="black" size="x-small" class="seg-color-black">黑</v-btn>
              <v-btn value="blue" size="x-small" class="seg-color-blue">藍</v-btn>
            </v-btn-toggle>
            <v-btn icon size="x-small" variant="text" color="error"
              @click="customDialog.segments.splice(si, 1)"><v-icon>mdi-close</v-icon></v-btn>
          </div>
          <div class="d-flex ga-2">
            <v-btn size="small" variant="tonal" prepend-icon="mdi-plus"
              @click="customDialog.segments.push({ type: 'text', value: '' })">固定文字</v-btn>
            <v-btn size="small" variant="tonal" color="primary" prepend-icon="mdi-plus"
              @click="customDialog.segments.push({ type: 'var', key: variableOptions[0]?.key || '' })">變數欄位</v-btn>
          </div>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="customDialog.show = false">取消</v-btn>
          <v-btn color="primary" variant="flat" :disabled="!customDialogValid" @click="commitCustomDialog">
            {{ customDialog.editIndex >= 0 ? '套用' : '插入' }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup>
import { computed, reactive } from 'vue';
import draggable from 'vuedraggable';
import { CNT_VARIABLES, buildCntCustomRow } from '@/utils/contractDocModel';

const props = defineProps({
  page: { type: Object, required: true },        // config 內的頁面物件（直接寫入 options.rowLayout）
  structure: { type: Object, required: true },   // buildCntStructure() 輸出（sections/blocks/varValues）
  canEdit: { type: Boolean, default: false },
});

const variableOptions = CNT_VARIABLES;

/* ---------- 版面（rowLayout）讀寫 ---------- */
const hasLayout = computed(() => !!props.page.options?.rowLayout?.sections);

// 預設 entries：structure blocks 依序轉 builtin 項目
function defaultEntries(secKey) {
  const sec = props.structure.sections.find(s => s.key === secKey);
  return (sec?.blocks || []).map(b => ({ kind: 'builtin', key: b.key }));
}

function entriesFor(secKey) {
  const stored = props.page.options?.rowLayout?.sections?.[secKey];
  const list = Array.isArray(stored) && stored.length ? stored : defaultEntries(secKey);
  // draggable item-key 需要唯一鍵
  return list.map((e, i) => ({ ...e, _dragKey: e.kind === 'custom' ? e.id : `b_${e.key}_${i}` }));
}

// 首次修改時把「所有 section」的預設順序寫入 rowLayout，之後才能穩定排序/隱藏
function materializeLayout() {
  if (!props.page.options) props.page.options = {};
  if (!props.page.options.rowLayout?.sections) {
    const sections = {};
    for (const sec of props.structure.sections) sections[sec.key] = defaultEntries(sec.key);
    props.page.options.rowLayout = { version: 1, sections };
  }
  return props.page.options.rowLayout.sections;
}

function stripDragKeys(list) {
  return list.map(({ _dragKey, ...rest }) => rest);
}

function setEntries(secKey, list) {
  const sections = materializeLayout();
  sections[secKey] = stripDragKeys(list);
}

function moveEntry(secKey, idx, delta) {
  const list = stripDragKeys(entriesFor(secKey));
  const j = idx + delta;
  if (j < 0 || j >= list.length) return;
  [list[idx], list[j]] = [list[j], list[idx]];
  const sections = materializeLayout();
  sections[secKey] = list;
}

function removeEntry(secKey, idx) {
  const list = stripDragKeys(entriesFor(secKey));
  const entry = list[idx];
  if (entry.kind === 'custom' && !window.confirm('確認刪除此自訂列？')) return;
  list.splice(idx, 1);
  const sections = materializeLayout();
  sections[secKey] = list;
}

function hiddenBlocksFor(secKey) {
  const sec = props.structure.sections.find(s => s.key === secKey);
  if (!sec) return [];
  const used = new Set(entriesFor(secKey).filter(e => e.kind !== 'custom').map(e => e.key));
  return sec.blocks.filter(b => !used.has(b.key));
}

function restoreBlock(secKey, blockKey) {
  const list = stripDragKeys(entriesFor(secKey));
  list.push({ kind: 'builtin', key: blockKey });
  const sections = materializeLayout();
  sections[secKey] = list;
}

function resetLayout() {
  if (!window.confirm('確認還原預設版面？（自訂列與排序、隱藏設定都會清除）')) return;
  if (props.page.options) delete props.page.options.rowLayout;
}

/* ---------- 列渲染 ---------- */
function entryRows(sec, entry) {
  if (entry.kind === 'custom') {
    return [buildCntCustomRow(entry.segments, props.structure.varValues)];
  }
  const block = sec.blocks.find(b => b.key === entry.key);
  return block ? block.rows : [];
}

/* ---------- 自訂列 Dialog ---------- */
const customDialog = reactive({
  show: false,
  secKey: '',
  editIndex: -1,   // -1 = 新增（附加到最後）
  segments: [],
});

function openCustomDialog(secKey, editIndex) {
  customDialog.secKey = secKey;
  customDialog.editIndex = editIndex;
  if (editIndex >= 0) {
    const entry = entriesFor(secKey)[editIndex];
    customDialog.segments = JSON.parse(JSON.stringify(entry.segments || []));
  } else {
    customDialog.segments = [{ type: 'text', value: '' }];
  }
  customDialog.show = true;
}

const customDialogValid = computed(() =>
  customDialog.segments.length > 0 &&
  customDialog.segments.every(s => (s.type === 'text' ? String(s.value ?? '').length > 0 : !!s.key)));

// 片段顏色：未指定時沿用預設（變數＝藍、固定文字＝黑），與 buildCntCustomRow 同邏輯
function segColor(seg) {
  return seg.color || (seg.type === 'var' ? 'blue' : 'black');
}

const customPreviewCells = computed(() =>
  buildCntCustomRow(customDialog.segments, props.structure.varValues).cells);

function swapSegment(i, delta) {
  const j = i + delta;
  if (j < 0 || j >= customDialog.segments.length) return;
  const arr = customDialog.segments;
  [arr[i], arr[j]] = [arr[j], arr[i]];
}

function commitCustomDialog() {
  const list = stripDragKeys(entriesFor(customDialog.secKey));
  const segments = JSON.parse(JSON.stringify(customDialog.segments));
  if (customDialog.editIndex >= 0) {
    list[customDialog.editIndex] = { ...list[customDialog.editIndex], segments };
  } else {
    list.push({ kind: 'custom', id: `cr_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`, segments });
  }
  const sections = materializeLayout();
  sections[customDialog.secKey] = list;
  customDialog.show = false;
}
</script>

<style scoped>
/* 與 ContractNumberTablePreview 同一套渲染樣式（標楷體、藍字、黑格線） */
.cnt-layout-editor {
  font-family: var(--doc-font, 'DFKai-SB', '標楷體', 'BiauKai', 'TW-Kai', 'KaiTi', serif);
  font-size: 11.5px;
  line-height: 1.35;
  color: #000;
}
.cnt-title {
  text-align: center;
  font-weight: 700;
  font-size: 15px;
  letter-spacing: 2px;
  padding: 4px 0;
}
.cnt-table {
  border: 2px solid #000;
  background: #fff;
}
.cnt-row {
  display: flex;
  border-bottom: 1px solid #000;
  min-height: 27px;
}
.cnt-row:last-child { border-bottom: none; }
.cnt-cell {
  flex-basis: 0;
  flex-shrink: 0;
  border-right: 1px solid #000;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 1px 2px;
  overflow: hidden;
  white-space: nowrap;
}
.cnt-cell:last-child { border-right: none; }
.cnt-cell.is-bold { font-weight: 700; }
.cnt-cell.is-blue {
  color: #1E50A2;
  font-weight: 700;
  font-size: 15px;
}

/* ── 編輯外掛：每個 entry 左控制 / 中渲染 / 右動作 ── */
.cnt-entry {
  display: flex;
  align-items: stretch;
  border-bottom: 1px solid #000;
}
.cnt-entry:last-child { border-bottom: none; }
.cnt-entry:hover { background: #f6f9ff; }
.cnt-entry--custom .cnt-entry-rows { background: #fffbea; }

.cnt-entry-controls,
.cnt-entry-actions {
  flex: 0 0 auto;
  display: flex;
  align-items: center;
  gap: 2px;
  padding: 0 4px;
  background: #fafafa;
  font-family: 'Noto Sans TC', 'Microsoft JhengHei', sans-serif;
}
.cnt-entry-controls { border-right: 1px dashed #bbb; }
.cnt-entry-actions { border-left: 1px dashed #bbb; }

.cnt-entry-rows {
  flex: 1 1 auto;
  min-width: 0;
}
/* entry 內的列沿用格線；entry 自身已有底線，最後一列不重複畫 */
.cnt-entry-rows .cnt-row { border-bottom: 1px solid #000; }
.cnt-entry-rows .cnt-row:last-child { border-bottom: none; }

.cnt-ctl-btn {
  border: none;
  background: transparent;
  cursor: pointer;
  font-size: 11px;
  line-height: 1;
  padding: 3px 4px;
  color: #607d8b;
  border-radius: 4px;
}
.cnt-ctl-btn:hover:not(:disabled) { background: #e3f2fd; color: #1565c0; }
.cnt-ctl-btn:disabled { opacity: 0.25; cursor: default; }
.cnt-ctl-edit { color: #1565c0; }
.cnt-ctl-remove:hover:not(:disabled) { background: #fdecea; color: #c62828; }
.cursor-move { cursor: move; }

/* 片段顏色切換（黑字/藍字） */
.seg-color-toggle {
  height: 32px;
  font-family: 'Noto Sans TC', 'Microsoft JhengHei', sans-serif;
}
.seg-color-black { color: #000; font-weight: 700; }
.seg-color-blue { color: #1E50A2; font-weight: 700; }
</style>
