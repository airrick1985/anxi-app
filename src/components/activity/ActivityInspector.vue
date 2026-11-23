<template>
  <div class="ami">
    <!-- 多選 -->
    <template v-if="items.length > 1">
      <div class="ami-preview ami-stack">
        <div v-for="it in items.slice(0, 3)" :key="it.id" class="ami-stack-card"><ActivityThumb :item="it" style="--amt-pad: 0px" /></div>
      </div>
      <div class="ami-multi-title">已選取 {{ items.length }} 則</div>
      <div class="mac-form-group ami-group">
        <button v-for="a in batchActions" :key="a.key" type="button" class="ami-action" @click="$emit('action', a.key)">
          <v-icon size="18">{{ a.icon }}</v-icon>{{ a.label }}
        </button>
      </div>
      <button type="button" class="mac-btn mac-btn--danger mac-btn--block ami-delete" @click="$emit('action', 'delete')">
        <v-icon size="16">mdi-trash-can-outline</v-icon>刪除 {{ items.length }} 則
      </button>
    </template>

    <!-- 單則 -->
    <template v-else-if="item">
      <button type="button" class="ami-preview" title="放大檢視" @click="$emit('action', 'view')">
        <ActivityThumb :item="item" />
        <span v-if="replacing" class="ami-busy"><v-progress-circular indeterminate size="26" width="3" color="#0071e3" /></span>
      </button>
      <div class="ami-buttons">
        <button v-if="isPage" type="button" class="mac-btn" @click="$emit('action', 'edit-page')">
          <v-icon size="16">mdi-pencil-outline</v-icon>編輯頁面
        </button>
        <button v-else type="button" class="mac-btn" :disabled="replacing" @click="$emit('action', 'replace')">
          <v-icon size="16">mdi-swap-horizontal</v-icon>更換檔案
        </button>
        <button type="button" class="mac-btn" @click="$emit('action', 'view')">
          <v-icon size="16">mdi-magnify-plus-outline</v-icon>放大檢視
        </button>
      </div>

      <div class="mac-form-label">
        標題
        <span class="mac-spacer"></span>
        <span v-if="saveState === 'saving'" class="ami-save">儲存中…</span>
        <span v-else-if="saveState === 'saved'" class="ami-save ami-save--ok"><v-icon size="13">mdi-check</v-icon>已儲存</span>
      </div>
      <input
        ref="titleRef"
        v-model="draft.title"
        class="mac-form-input ami-input"
        :maxlength="ACTIVITY_TITLE_MAX"
        placeholder="未命名"
        aria-label="標題"
        @input="queueSave"
        @blur="onBlur"
        @keydown.enter="onTitleEnter"
        @keydown.esc.stop="$event.target.blur()"
      />
      <div class="mac-form-label">說明</div>
      <textarea
        ref="descRef"
        v-model="draft.description"
        class="mac-form-textarea ami-textarea"
        rows="4"
        :maxlength="ACTIVITY_DESCRIPTION_MAX"
        aria-label="說明"
        @input="queueSave"
        @blur="onBlur"
        @keydown.esc.stop="$event.target.blur()"
      ></textarea>

      <div class="mac-form-group ami-group">
        <label class="mac-form-row ami-toggle">
          <span class="mac-form-row-main">顯示</span>
          <input type="checkbox" class="mac-switch" :checked="!item.hidden" @change="$emit('action', item.hidden ? 'show' : 'hide')" />
        </label>
        <label class="mac-form-row ami-toggle">
          <span class="mac-form-row-main">釘選到報價單</span>
          <input type="checkbox" class="mac-switch" :checked="!!item.pinnedToQuote" @change="$emit('action', item.pinnedToQuote ? 'unpin' : 'pin')" />
        </label>
      </div>

      <dl class="ami-info">
        <template v-for="row in infoRows" :key="row.label"><dt>{{ row.label }}</dt><dd>{{ row.value }}</dd></template>
      </dl>

      <button type="button" class="mac-btn mac-btn--danger mac-btn--block ami-delete" @click="$emit('action', 'delete')">
        <v-icon size="16">mdi-trash-can-outline</v-icon>刪除
      </button>
    </template>

    <div v-else class="ami-none"><v-icon size="36">mdi-cursor-default-click-outline</v-icon>點選一則開始編輯</div>
  </div>
</template>

<script setup>
/**
 * 活動訊息檢閱器：單則改標題、說明、顯示、釘選、換檔；多選時批次處理
 * 文字停止輸入後自動儲存，換選或關閉前會先存完
 */
import { ref, reactive, computed, watch, onBeforeUnmount } from 'vue';
import { useToast } from 'vue-toastification';
import ActivityThumb from './ActivityThumb.vue';
import { useUserStore } from '@/store/user';
import { updateActivityMessage } from '@/api';
import {
  activityKind,
  activityTypeLabel,
  formatFileSize,
  ACTIVITY_TITLE_MAX,
  ACTIVITY_DESCRIPTION_MAX,
} from '@/utils/activityMessage';

const props = defineProps({
  items: { type: Array, required: true },
  batchActions: { type: Array, default: () => [] },
  replacing: { type: Boolean, default: false },
});
defineEmits(['action']);

const toast = useToast();
const userStore = useUserStore();

const item = computed(() => (props.items.length === 1 ? props.items[0] : null));
const isPage = computed(() => !!item.value && activityKind(item.value) === 'page');

// ---------- 自動儲存 ----------
const SAVE_DELAY = 700;
const titleRef = ref(null);
const descRef = ref(null);
const draft = reactive({ id: '', isPage: false, title: '', description: '', dirty: false });
const saveState = ref(''); // ''｜saving｜saved
let timer = null;
let savedTimer = null;

function loadDraft() {
  draft.id = item.value?.id || '';
  draft.isPage = isPage.value;
  draft.title = item.value?.title || '';
  draft.description = item.value?.description || '';
  draft.dirty = false;
}

// 換選：先把上一則存完再載入新的
watch(() => item.value?.id, () => {
  flush();
  saveState.value = '';
  loadDraft();
}, { immediate: true });
// 別處改了同一則（例如頁面編輯器改名）：跟著更新；正在輸入時不動，離開欄位再同步
function isEditing() {
  return [titleRef.value, descRef.value].some(el => el && el === document.activeElement);
}
watch([() => item.value?.title, () => item.value?.description], () => {
  if (item.value?.id === draft.id && !draft.dirty && !isEditing()) loadDraft();
});

function queueSave() {
  draft.dirty = true;
  clearTimeout(timer);
  timer = setTimeout(flush, SAVE_DELAY);
}

async function flush() {
  clearTimeout(timer);
  if (!draft.dirty || !draft.id) return;
  const id = draft.id;
  const page = draft.isPage;
  const title = draft.title.trim();
  // 自建頁面沿用頁面名稱為標題，不可空白：還在輸入時先不存，離開欄位還原
  if (page && !title) {
    if (!isEditing() && item.value?.id === id) loadDraft();
    return;
  }
  const data = { title, description: draft.description.trim() };
  draft.dirty = false;
  saveState.value = 'saving';
  try {
    await updateActivityMessage(id, {
      ...data,
      // 自建頁面的 fileName 一向等於頁面名稱
      ...(page ? { fileName: title } : {}),
      updatedBy: userStore.user?.key || '',
      updatedByName: userStore.user?.name || '',
    });
    if (draft.id === id && !draft.dirty) {
      saveState.value = 'saved';
      clearTimeout(savedTimer);
      savedTimer = setTimeout(() => { if (saveState.value === 'saved') saveState.value = ''; }, 2000);
    }
  } catch (err) {
    saveState.value = '';
    if (draft.id === id) draft.dirty = true;
    toast.error(`儲存失敗：${err.message}`);
  }
}
async function onBlur() {
  await flush();
  if (!draft.dirty && !isEditing() && item.value?.id === draft.id) loadDraft();
}
function onTitleEnter(e) {
  // 中文輸入法選字的 Enter 不算
  if (!e.isComposing) e.target.blur();
}
onBeforeUnmount(() => {
  flush();
  clearTimeout(savedTimer);
});

function focusTitle() {
  titleRef.value?.focus();
}
defineExpose({ flush, focusTitle });

// ---------- 資訊 ----------
function formatDate(ts) {
  const d = ts?.toDate?.();
  if (!d) return '';
  const p = n => String(n).padStart(2, '0');
  return `${d.getFullYear()}/${p(d.getMonth() + 1)}/${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;
}
const infoRows = computed(() => {
  const it = item.value;
  if (!it) return [];
  return [
    { label: '類型', value: activityTypeLabel(it) },
    { label: '檔名', value: isPage.value ? '' : it.fileName },
    { label: '大小', value: isPage.value ? '' : formatFileSize(it.fileSize) },
    { label: '建立', value: [it.uploadedByName, formatDate(it.createdAt)].filter(Boolean).join('　') },
    { label: '修改', value: it.updatedByName ? [it.updatedByName, formatDate(it.updatedAt)].filter(Boolean).join('　') : '' },
  ].filter(r => r.value);
});
</script>

<style scoped>
.ami { padding: 16px; font-size: 13px; }
.ami-preview {
  position: relative;
  display: block;
  width: 100%;
  aspect-ratio: 4 / 3;
  padding: 0;
  border: 0;
  border-radius: 12px;
  background: #e8e8ec;
  overflow: hidden;
  cursor: zoom-in;
}
.ami-busy { position: absolute; inset: 0; display: grid; place-content: center; background: rgba(245, 245, 247, 0.7); }
.ami-buttons { display: flex; gap: 8px; margin-top: 10px; }
.ami-buttons .mac-btn { flex: 1 1 0; padding: 0 8px; }
.ami-input { display: block; width: 100%; height: 32px; font-size: 14px; }
.ami-textarea { font-size: 13.5px; }
.ami-save { display: inline-flex; align-items: center; gap: 2px; font-weight: 500; color: #8e8e93; }
.ami-save--ok { color: #1f7a36; }
.ami-group { margin-top: 16px; }
.ami-toggle { cursor: pointer; flex-wrap: nowrap; }
.ami-info {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  gap: 5px 14px;
  margin: 16px 4px 0;
  font-size: 12px;
  line-height: 1.5;
}
.ami-info dt { color: #8e8e93; white-space: nowrap; }
.ami-info dd { margin: 0; color: #48484a; overflow-wrap: anywhere; }
.ami-delete { margin-top: 18px; }
.ami-none { display: flex; flex-direction: column; align-items: center; gap: 10px; padding: 90px 10px; color: #8e8e93; font-size: 13.5px; }

/* 多選 */
.ami-stack { cursor: default; }
.ami-stack-card { position: absolute; inset: 16px 22%; }
.ami-stack-card:nth-child(1) { z-index: 3; }
.ami-stack-card:nth-child(2) { z-index: 2; transform: rotate(-6deg); }
.ami-stack-card:nth-child(3) { z-index: 1; transform: rotate(6deg); }
.ami-multi-title { margin-top: 12px; font-size: 15px; font-weight: 600; text-align: center; }
.ami-action {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  min-height: 40px;
  padding: 0 14px;
  border: 0;
  background: transparent;
  color: #1d1d1f;
  font: inherit;
  text-align: left;
  cursor: pointer;
}
.ami-action .v-icon { color: #6e6e73; }
.ami-action + .ami-action { border-top: 1px solid #ececf0; }
.ami-action:hover { background: #f7f7f9; }

@media (max-width: 899.98px) {
  .ami { padding: 4px 0 8px; }
  .ami-input, .ami-textarea { font-size: 16px; }
  .ami-input { height: 40px; }
  .ami-buttons .mac-btn, .ami-delete { height: 36px; }
}
</style>
