<template>
  <div class="amv-view amx" v-file-drop="{ accept: ACTIVITY_FILE_ACCEPT, multiple: true, onFiles: f => $emit('upload', f) }">
    <header class="amv-bar">
      <div class="amv-heading">
        <span class="amv-heading-main">{{ compact ? '管理' : '管理活動訊息' }}</span>
        <span v-if="projectName && !compact" class="amv-heading-sub">{{ projectName }}</span>
      </div>
      <div class="mac-form-seg amx-seg" role="tablist">
        <button
          v-for="f in FILTERS"
          :key="f.value"
          type="button"
          role="tab"
          class="mac-form-seg-btn"
          :class="{ 'is-active': filter === f.value }"
          :aria-selected="filter === f.value"
          @click="filter = f.value"
        >{{ f.label }}<span class="amx-seg-count">{{ counts[f.value] }}</span></button>
      </div>
      <span class="amv-spacer"></span>
      <v-text-field
        v-if="items.length > 8"
        v-model="keyword"
        placeholder="搜尋"
        prepend-inner-icon="mdi-magnify"
        variant="solo"
        flat
        density="compact"
        hide-details
        clearable
        class="mac-vfield mac-vfield--search amv-search"
        @keydown.esc.stop
      />
      <ActivitySizeSlider v-if="!compact" :model-value="cellSize" @update:model-value="$emit('update:cellSize', $event)" />
      <button v-if="!docked && items.length" type="button" class="mac-btn" :class="{ 'is-active': picking }" @click="togglePicking">
        {{ picking ? '取消' : '選取' }}
      </button>
      <v-menu location="bottom end" :offset="6" content-class="mac-menu">
        <template #activator="{ props: mp }">
          <button type="button" class="mac-btn" v-bind="mp"><v-icon size="17">mdi-plus</v-icon>新增</button>
        </template>
        <v-list density="compact" class="amx-menu">
          <v-list-item prepend-icon="mdi-tray-arrow-up" title="上傳圖片／PDF" @click="pickFiles" />
          <v-list-item prepend-icon="mdi-file-document-edit-outline" title="建立頁面" @click="$emit('edit-page', null)" />
        </v-list>
      </v-menu>
      <button type="button" class="mac-btn mac-btn--primary" @click="$emit('done')">完成</button>
    </header>

    <div class="amx-body">
      <div ref="scrollRef" class="amv-scroll" @click.self="clearSelection">
        <draggable
          v-model="ordered"
          item-key="id"
          class="amv-grid"
          :style="{ '--amv-cell': `${cellSize}px` }"
          :animation="180"
          :delay="260"
          :delay-on-touch-only="true"
          :touch-start-threshold="6"
          :disabled="picking"
          draggable=".amx-item"
          filter=".amx-nodrag"
          :prevent-on-filter="false"
          ghost-class="amx-ghost"
          @start="dragging = true"
          @end="dragging = false"
          @click.self="clearSelection"
        >
          <template #header>
            <!-- 上傳中 -->
            <div v-for="u in uploads" :key="u.key" class="amv-card amx-upload">
              <div class="amv-tile">
                <img v-if="u.previewUrl" :src="u.previewUrl" alt="" class="amx-upload-img" />
                <v-icon v-else size="40" class="amx-upload-icon">mdi-file-pdf-box</v-icon>
                <div v-if="u.state === 'error'" class="amx-upload-mask">
                  <v-icon size="24" color="#d62d20">mdi-alert-circle</v-icon>
                  <span class="amx-upload-error">{{ u.error }}</span>
                  <span class="amx-upload-btns">
                    <button type="button" class="mac-btn mac-btn--sm" @click="$emit('retry-upload', u.key)">重試</button>
                    <button type="button" class="mac-btn mac-btn--sm" @click="$emit('remove-upload', u.key)">移除</button>
                  </span>
                </div>
                <div v-else class="amx-upload-mask"><v-progress-circular :indeterminate="true" size="28" width="3" color="#0071e3" /></div>
              </div>
              <div class="amv-name is-empty">{{ u.name }}</div>
            </div>
          </template>

          <template #item="{ element: item }">
            <div
              class="amv-card amx-item"
              :class="{ 'is-selected': isSelected(item.id), 'is-hidden': item.hidden }"
              :data-id="item.id"
              tabindex="0"
              role="button"
              :aria-pressed="isSelected(item.id)"
              @click="onCardClick($event, item)"
              @dblclick="$emit('view', item.id)"
              @contextmenu.prevent="openMenu($event, item)"
              @keydown.enter="$emit('view', item.id)"
            >
              <div class="amv-tile">
                <ActivityThumb :item="item" />
                <label class="amx-check amx-nodrag" :class="{ 'is-shown': picking || isSelected(item.id) }" title="選取" @click.stop @dblclick.stop>
                  <input type="checkbox" class="mac-check" :checked="isSelected(item.id)" aria-label="選取" @change="toggle(item.id)" />
                </label>
                <button
                  v-if="!picking"
                  type="button"
                  class="amx-more amx-nodrag"
                  title="更多"
                  aria-label="更多"
                  @click.stop="openMenu($event, item)"
                  @dblclick.stop
                ><v-icon size="18">mdi-dots-horizontal</v-icon></button>
                <div class="amx-tags">
                  <span v-if="item.hidden" class="mac-tag amx-tag-hidden"><v-icon size="12">mdi-eye-off</v-icon>隱藏</span>
                  <span v-if="item.pinnedToQuote" class="mac-tag mac-tag--orange-fill"><v-icon size="12">mdi-pin</v-icon>報價單</span>
                </div>
              </div>
              <div class="amv-name" :class="{ 'is-empty': !item.title }">{{ item.title || activityFileBase(item) || '未命名' }}</div>
            </div>
          </template>

          <template #footer>
            <button v-if="filter === 'all' && !keyword && !picking" type="button" class="amx-add" @click="pickFiles">
              <v-icon size="30">mdi-plus</v-icon>
              <span class="amx-add-text">{{ canHover ? '拖曳或點擊上傳' : '上傳' }}</span>
            </button>
          </template>
        </draggable>
        <div v-if="!ordered.length && !(filter === 'all' && !keyword)" class="amv-state amx-empty">沒有符合的活動</div>
      </div>

      <!-- 桌機：右側檢閱器 -->
      <aside v-if="docked" class="amx-side mac-form">
        <ActivityInspector
          ref="inspectorRef"
          :items="selectedItems"
          :batch-actions="BATCH_ACTIONS"
          :replacing="selectedItems.length === 1 && replacingId === selectedItems[0].id"
          @action="runAction"
        />
      </aside>
    </div>

    <!-- 手機：多選操作列 -->
    <div v-if="!docked && picking" class="amx-pickbar">
      <button v-for="a in pickbarActions" :key="a.key" type="button" class="amx-pick-btn" :class="{ 'is-danger': a.key === 'delete' }" :disabled="!selectedIds.length" @click="runAction(a.key)">
        <v-icon size="21">{{ a.icon }}</v-icon>{{ a.short || a.label }}
      </button>
    </div>

    <!-- 手機：檢閱器 -->
    <MobileBottomSheet v-if="!docked" v-model="sheetOpen" title="編輯活動訊息" icon="mdi-square-edit-outline">
      <ActivityInspector
        :items="selectedItems"
        :batch-actions="BATCH_ACTIONS"
        :replacing="selectedItems.length === 1 && replacingId === selectedItems[0].id"
        @action="runAction"
      />
    </MobileBottomSheet>

    <!-- 右鍵／⋯ 選單 -->
    <v-menu v-model="menu.open" :target="[menu.x, menu.y]" location="bottom start" :offset="2" content-class="mac-menu">
      <v-list density="compact" class="amx-menu">
        <template v-for="(a, i) in menuActions" :key="a.key || `d${i}`">
          <v-divider v-if="a.divider" class="my-1" />
          <v-list-item v-else :prepend-icon="a.icon" :title="a.label" :class="{ 'amx-menu-danger': a.key === 'delete' }" @click="runAction(a.key)" />
        </template>
      </v-list>
    </v-menu>

    <!-- 刪除確認 -->
    <v-dialog v-model="deleteDialog.open" max-width="380" content-class="mac-dialog-fit" :persistent="deleteDialog.busy">
      <v-card class="mac-sheet">
        <div class="mac-sheet-section amx-del">
          <div v-if="deleteDialog.items.length === 1" class="amx-del-thumb"><ActivityThumb :item="deleteDialog.items[0]" style="--amt-pad: 0px" /></div>
          <div class="amx-del-title">
            {{ deleteDialog.items.length === 1 ? `刪除「${nameOf(deleteDialog.items[0])}」？` : `刪除 ${deleteDialog.items.length} 則活動訊息？` }}
          </div>
          <div class="mac-sheet-note">刪除後無法復原</div>
        </div>
        <div class="mac-sheet-foot">
          <span class="mac-spacer"></span>
          <button type="button" class="mac-btn" :disabled="deleteDialog.busy" @click="deleteDialog.open = false">取消</button>
          <button type="button" class="mac-btn mac-btn--danger-fill" :disabled="deleteDialog.busy" @click="confirmDelete">
            <v-progress-circular v-if="deleteDialog.busy" indeterminate size="14" width="2" />刪除
          </button>
        </div>
      </v-card>
    </v-dialog>

    <input ref="fileInputRef" type="file" hidden multiple :accept="ACTIVITY_FILE_ACCEPT" @change="onPicked" />
    <input ref="replaceInputRef" type="file" hidden :accept="ACTIVITY_FILE_ACCEPT" @change="onReplacePicked" />
  </div>
</template>

<script setup>
/**
 * 活動訊息管理：卡片牆＋檢閱器
 * - 點一下選取（⌘/Ctrl 加選、Shift 連選、勾選框多選），雙擊或空白鍵放大
 * - 拖曳排序；篩選中排序只在看得到的幾則之間交換位置
 * - 檔案拖進視窗即上傳；右鍵或 ⋯ 開選單
 */
import { ref, reactive, computed, watch, nextTick, onMounted, onBeforeUnmount } from 'vue';
import { useToast } from 'vue-toastification';
import draggable from 'vuedraggable';
import ActivityThumb from './ActivityThumb.vue';
import ActivityInspector from './ActivityInspector.vue';
import ActivitySizeSlider from './ActivitySizeSlider.vue';
import MobileBottomSheet from '@/components/MobileBottomSheet.vue';
import { useUserStore } from '@/store/user';
import {
  deleteActivityMessage,
  updateActivityMessageVisibility,
  updateActivityMessagePinned,
} from '@/api';
import { activityKind, activityFileBase, activityMatches, ACTIVITY_FILE_ACCEPT } from '@/utils/activityMessage';

const props = defineProps({
  items: { type: Array, required: true },
  projectId: { type: String, required: true },
  projectName: { type: String, default: '' },
  selectedIds: { type: Array, default: () => [] },
  uploads: { type: Array, default: () => [] },
  replacingId: { type: String, default: '' },
  compact: { type: Boolean, default: false },
  docked: { type: Boolean, default: true },
  cellSize: { type: Number, default: 200 },
  // 有子視窗（頁面編輯器）開著時不處理快速鍵
  keysDisabled: { type: Boolean, default: false },
});
const emit = defineEmits([
  'update:selectedIds', 'update:cellSize', 'reorder', 'view', 'edit-page', 'done',
  'upload', 'remove-upload', 'retry-upload', 'replace',
]);

const toast = useToast();
const userStore = useUserStore();

const canHover = typeof window !== 'undefined' && window.matchMedia('(hover: hover)').matches;

// ---------- 篩選 ----------
const FILTERS = [
  { value: 'all', label: '全部', test: () => true },
  { value: 'visible', label: '顯示', test: i => !i.hidden },
  { value: 'hidden', label: '隱藏', test: i => !!i.hidden },
  { value: 'pinned', label: '釘選', test: i => !!i.pinnedToQuote },
];
const filter = ref('all');
const keyword = ref('');
const counts = computed(() => Object.fromEntries(FILTERS.map(f => [f.value, props.items.filter(f.test).length])));
const filtered = computed(() => {
  const { test } = FILTERS.find(f => f.value === filter.value);
  return props.items.filter(i => test(i) && activityMatches(i, keyword.value));
});

// ---------- 排序 ----------
const dragging = ref(false);
const ordered = computed({
  get: () => filtered.value,
  // 篩選中：把新順序放回這幾則原本佔的位置，其餘不動
  set(list) {
    const ids = new Set(list.map(i => i.id));
    const queue = [...list];
    emit('reorder', props.items.map(i => (ids.has(i.id) ? queue.shift() : i)));
  },
});
function moveTo(edge) {
  const ids = new Set(props.selectedIds);
  const picked = props.items.filter(i => ids.has(i.id));
  const rest = props.items.filter(i => !ids.has(i.id));
  emit('reorder', edge === 'first' ? [...picked, ...rest] : [...rest, ...picked]);
}

// ---------- 選取 ----------
const scrollRef = ref(null);
const inspectorRef = ref(null);
const picking = ref(false); // 手機多選
const sheetOpen = ref(false);
let anchorId = '';

const selectedItems = computed(() => {
  const ids = new Set(props.selectedIds);
  return props.items.filter(i => ids.has(i.id));
});
const isSelected = id => props.selectedIds.includes(id);
const select = ids => emit('update:selectedIds', ids);

function toggle(id) {
  anchorId = id;
  select(isSelected(id) ? props.selectedIds.filter(x => x !== id) : [...props.selectedIds, id]);
}
function clearSelection() {
  if (!picking.value) select([]);
}
function onCardClick(e, item) {
  if (dragging.value) return;
  if (picking.value || e.metaKey || e.ctrlKey) {
    toggle(item.id);
    return;
  }
  if (e.shiftKey && anchorId) {
    const list = filtered.value.map(i => i.id);
    const a = list.indexOf(anchorId);
    const b = list.indexOf(item.id);
    if (a >= 0 && b >= 0) {
      select(list.slice(Math.min(a, b), Math.max(a, b) + 1));
      return;
    }
  }
  anchorId = item.id;
  select([item.id]);
  if (!props.docked) sheetOpen.value = true;
}
function togglePicking() {
  picking.value = !picking.value;
  select([]);
}
// 選取的項目被刪除後清掉
watch(() => props.items, (list) => {
  const ids = new Set(list.map(i => i.id));
  const kept = props.selectedIds.filter(id => ids.has(id));
  if (kept.length !== props.selectedIds.length) select(kept);
});
watch(() => selectedItems.value.length, (n) => { if (!n) sheetOpen.value = false; });
watch(() => props.docked, () => { picking.value = false; sheetOpen.value = false; });

function reveal(id) {
  nextTick(() => {
    const el = [...(scrollRef.value?.querySelectorAll('.amx-item') || [])].find(n => n.dataset.id === id);
    el?.scrollIntoView({ block: 'nearest' });
  });
}

// ---------- 動作 ----------
const ACTIONS = {
  view: { label: '放大檢視', icon: 'mdi-magnify-plus-outline' },
  'edit-page': { label: '編輯頁面', icon: 'mdi-pencil-outline' },
  replace: { label: '更換檔案', icon: 'mdi-swap-horizontal' },
  show: { label: '顯示', icon: 'mdi-eye-outline' },
  hide: { label: '隱藏', icon: 'mdi-eye-off-outline' },
  pin: { label: '釘選到報價單', short: '釘選', icon: 'mdi-pin-outline' },
  unpin: { label: '取消釘選', icon: 'mdi-pin-off-outline' },
  first: { label: '移到最前', icon: 'mdi-arrow-collapse-up' },
  last: { label: '移到最後', icon: 'mdi-arrow-collapse-down' },
  delete: { label: '刪除', icon: 'mdi-trash-can-outline' },
};
const pick = keys => keys.map(key => ({ key, ...ACTIONS[key] }));
const BATCH_ACTIONS = pick(['show', 'hide', 'pin', 'unpin', 'first', 'last']);
const pickbarActions = pick(['show', 'hide', 'pin', 'unpin', 'delete']);

const menu = reactive({ open: false, x: 0, y: 0 });
const menuActions = computed(() => {
  const list = selectedItems.value;
  if (list.length > 1) return [...BATCH_ACTIONS, { divider: true }, ...pick(['delete'])];
  const it = list[0];
  if (!it) return [];
  return [
    ...pick(['view', activityKind(it) === 'page' ? 'edit-page' : 'replace']),
    { divider: true },
    ...pick([it.hidden ? 'show' : 'hide', it.pinnedToQuote ? 'unpin' : 'pin']),
    { divider: true },
    ...pick(['first', 'last']),
    { divider: true },
    ...pick(['delete']),
  ];
});
function openMenu(e, item) {
  if (picking.value) return;
  if (!isSelected(item.id)) {
    anchorId = item.id;
    select([item.id]);
  }
  if (e.type === 'contextmenu') {
    menu.x = e.clientX;
    menu.y = e.clientY;
  } else {
    const r = e.currentTarget.getBoundingClientRect();
    menu.x = r.left;
    menu.y = r.bottom;
  }
  nextTick(() => { menu.open = true; });
}

// 結果直接反映在卡片與開關上，只有失敗才提示
async function updateAll(list, needs, update) {
  const results = await Promise.allSettled(list.filter(needs).map(update));
  const failed = results.find(r => r.status === 'rejected');
  if (failed) toast.error(`更新失敗：${failed.reason?.message || ''}`);
}

function runAction(key) {
  const list = selectedItems.value;
  const it = list[0];
  if (!it) return;
  switch (key) {
    case 'view': emit('view', it.id); break;
    case 'edit-page': emit('edit-page', it); break;
    case 'replace': replaceInputRef.value?.click(); break;
    case 'show': updateAll(list, i => i.hidden, i => updateActivityMessageVisibility(i.id, false)); break;
    case 'hide': updateAll(list, i => !i.hidden, i => updateActivityMessageVisibility(i.id, true)); break;
    case 'pin': updateAll(list, i => !i.pinnedToQuote, i => updateActivityMessagePinned(i.id, true)); break;
    case 'unpin': updateAll(list, i => i.pinnedToQuote, i => updateActivityMessagePinned(i.id, false)); break;
    case 'first':
    case 'last':
      moveTo(key);
      reveal(it.id);
      break;
    case 'delete':
      Object.assign(deleteDialog, { open: true, busy: false, items: [...list] });
      break;
    default:
  }
}

// ---------- 刪除 ----------
const deleteDialog = reactive({ open: false, busy: false, items: [] });
const nameOf = i => i.title || activityFileBase(i) || '未命名';
async function confirmDelete() {
  deleteDialog.busy = true;
  try {
    for (const it of deleteDialog.items) {
      await deleteActivityMessage({
        projectId: props.projectId,
        userKey: userStore.user?.key,
        docId: it.id,
        storagePath: it.storagePath || '',
      });
    }
    if (picking.value) picking.value = false;
  } catch (err) {
    toast.error(`刪除失敗：${err.message}`);
  } finally {
    deleteDialog.busy = false;
    deleteDialog.open = false;
  }
}

// ---------- 檔案 ----------
const fileInputRef = ref(null);
const replaceInputRef = ref(null);
function pickFiles() {
  fileInputRef.value?.click();
}
function onPicked(e) {
  const files = [...(e.target.files || [])];
  e.target.value = '';
  if (files.length) emit('upload', files);
}
function onReplacePicked(e) {
  const file = e.target.files?.[0];
  e.target.value = '';
  if (file && selectedItems.value[0]) emit('replace', selectedItems.value[0], file);
}

// ---------- 快速鍵 ----------
function onKeydown(e) {
  if (props.keysDisabled || deleteDialog.open || menu.open || sheetOpen.value) return;
  const t = e.target;
  if (t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName))) return;
  if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'a') {
    e.preventDefault();
    select(filtered.value.map(i => i.id));
  } else if ((e.key === 'Delete' || e.key === 'Backspace') && props.selectedIds.length) {
    e.preventDefault();
    runAction('delete');
  } else if (e.key === ' ' && selectedItems.value.length === 1) {
    e.preventDefault();
    emit('view', selectedItems.value[0].id);
  }
}
onMounted(() => {
  document.addEventListener('keydown', onKeydown);
  if (props.selectedIds[0]) reveal(props.selectedIds[0]);
});
onBeforeUnmount(() => document.removeEventListener('keydown', onKeydown));

// Esc：先關多選、再取消選取；都沒有才交給外層離開管理
function handleEscape() {
  if (picking.value) { togglePicking(); return true; }
  if (props.selectedIds.length) { select([]); return true; }
  return false;
}
defineExpose({ handleEscape, reveal, pickFiles });
</script>

<style scoped>
.amx-seg { margin-left: 8px; }
.amx-seg-count { color: #8e8e93; font-weight: 500; font-variant-numeric: tabular-nums; }
.amx-body { display: flex; flex: 1 1 auto; min-height: 0; }
.amx-side {
  flex-shrink: 0;
  width: 312px;
  overflow-y: auto;
  border-left: 1px solid var(--amv-line);
}

/* 卡片 */
.amx-item:focus { outline: none; }
.amx-item.is-selected .amv-tile { box-shadow: inset 0 0 0 3px #0071e3; background: #e3eefb; }
.amx-item.is-selected .amv-name { color: #0058b0; }
.amx-item.is-hidden :deep(.amt) { opacity: 0.4; }
.amx-item.is-hidden .amv-name { color: #8e8e93; }
.amx-ghost { opacity: 0.35; }
.amx-check {
  position: absolute;
  top: 0;
  left: 0;
  display: grid;
  place-content: center;
  width: 40px;
  height: 40px;
  cursor: pointer;
  opacity: 0;
  transition: opacity 0.12s;
}
.amx-check .mac-check { width: 20px; height: 20px; border-radius: 6px; box-shadow: 0 1px 4px rgba(0, 0, 0, 0.18); }
.amx-item:hover .amx-check,
.amx-item:focus-within .amx-check,
.amx-check.is-shown { opacity: 1; }
.amx-more {
  position: absolute;
  top: 7px;
  right: 7px;
  display: grid;
  place-content: center;
  width: 28px;
  height: 28px;
  border: 0;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.9);
  color: #1d1d1f;
  box-shadow: 0 0 0 0.5px rgba(0, 0, 0, 0.12), 0 1px 5px rgba(0, 0, 0, 0.16);
  cursor: pointer;
  opacity: 0;
  transition: opacity 0.12s;
}
.amx-item:hover .amx-more,
.amx-item:focus-within .amx-more { opacity: 1; }
.amx-more:hover { background: #fff; }
.amx-tags { position: absolute; left: 8px; right: 8px; bottom: 8px; display: flex; flex-wrap: wrap; gap: 5px; pointer-events: none; }
.amx-tags .mac-tag { box-shadow: 0 1px 4px rgba(0, 0, 0, 0.14); }
.amx-tag-hidden { --mac-tag-bg: rgba(29, 29, 31, 0.78); --mac-tag-color: #fff; }

/* 上傳 */
.amx-upload { cursor: default; }
.amx-upload-img { position: absolute; inset: 12px; width: calc(100% - 24px); height: calc(100% - 24px); object-fit: contain; }
.amx-upload-icon { position: absolute; inset: 0; margin: auto; color: #b0b0b6; }
.amx-upload-mask {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 10px;
  background: rgba(245, 245, 247, 0.82);
}
.amx-upload-error { color: #b3261b; font-size: 12.5px; text-align: center; overflow-wrap: anywhere; }
.amx-upload-btns { display: flex; gap: 6px; }
.amx-add {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
  aspect-ratio: 1;
  border: 2px dashed rgba(0, 0, 0, 0.16);
  border-radius: 12px;
  background: transparent;
  color: #6e6e73;
  font: 500 13px -apple-system, BlinkMacSystemFont, "SF Pro Text", "PingFang TC", "Noto Sans TC", sans-serif;
  cursor: pointer;
  transition: border-color 0.12s, color 0.12s, background-color 0.12s;
}
.amx-add:hover { border-color: #0071e3; color: #0071e3; background: rgba(0, 113, 227, 0.04); }
.amx-empty { min-height: 40vh; }

.amx-menu { min-width: 180px; }
.amx-menu :deep(.v-list-item__prepend > .v-icon) { opacity: 1; font-size: 18px; }
.amx-menu :deep(.v-list-item__spacer) { width: 10px !important; }
.amx-menu-danger:not(:hover) { color: #d62d20 !important; }

/* 刪除確認 */
.amx-del { display: flex; flex-direction: column; align-items: center; gap: 6px; padding: 20px 20px 18px; text-align: center; }
.amx-del-thumb { position: relative; width: 100%; height: 130px; margin-bottom: 6px; }
.amx-del-title { font-size: 15px; font-weight: 600; line-height: 1.45; overflow-wrap: anywhere; }

/* 手機多選操作列 */
.amx-pickbar {
  display: flex;
  flex-shrink: 0;
  padding: 6px 6px calc(6px + env(safe-area-inset-bottom, 0px));
  background: #f6f6f8;
  border-top: 1px solid var(--amv-line);
}
.amx-pick-btn {
  flex: 1 1 0;
  min-width: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 3px;
  padding: 6px 2px;
  border: 0;
  border-radius: 8px;
  background: transparent;
  color: #0071e3;
  font: 500 11.5px -apple-system, BlinkMacSystemFont, "SF Pro Text", "PingFang TC", "Noto Sans TC", sans-serif;
  white-space: nowrap;
}
.amx-pick-btn:disabled { color: #b0b0b6; }
.amx-pick-btn.is-danger:not(:disabled) { color: #d62d20; }

@media (hover: none) {
  .amx-more { opacity: 1; }
}
@media (max-width: 1099.98px) {
  .amx .amv-size { display: none; }
  .amx .amv-search { order: 10; flex: 1 1 100%; }
}
@media (max-width: 767.98px) {
  .amx .amv-search { flex-basis: calc(100% + 46px); }
  .amx-seg { order: 9; display: flex; flex: 1 1 calc(100% + 46px); margin-left: -46px; }
  .amx-seg .mac-form-seg-btn { flex: 1 1 0; min-width: 0; height: 28px; padding: 0 4px; }
}
</style>
