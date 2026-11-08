<template>
  <v-dialog
    :model-value="modelValue"
    :fullscreen="isMobile"
    :width="isMobile ? undefined : 1040"
    persistent
    scrollable
    :content-class="isMobile ? 'udu-overlay udu-overlay--mobile' : 'udu-overlay'"
    @update:model-value="v => { if (!v) requestClose(); }"
  >
    <v-card
      v-file-drop="canAddFiles ? { onFiles: addFiles } : false"
      class="mac-sheet udu"
      :class="{ 'udu--mobile': isMobile }"
    >
      <!-- 標題列 -->
      <div class="mac-sheet-head udu-head">
        <v-icon size="18">mdi-cloud-upload-outline</v-icon>
        <span class="udu-title">{{ unitId }} 上傳文件</span>
        <button type="button" class="mac-sheet-close" title="關閉" :disabled="running" @click="requestClose">
          <v-icon size="18">mdi-close</v-icon>
        </button>
      </div>

      <!-- 工具列 -->
      <div class="udu-toolbar">
        <template v-if="items.length">
          <input
            type="checkbox"
            class="mac-check"
            title="全選"
            :checked="allChecked"
            :indeterminate.prop="someChecked"
            :disabled="running"
            @change="toggleAll"
          />
          <span v-if="checkedKeys.length" class="udu-checked">已選 {{ checkedKeys.length }}</span>
          <v-menu v-model="typeMenu" :close-on-content-click="false" location="bottom start" :disabled="running">
            <template #activator="{ props: menuProps }">
              <button type="button" class="mac-btn mac-btn--sm" v-bind="menuProps" :disabled="running || !editableItems.length">
                {{ checkedKeys.length ? '設為種類' : '全部設為' }}
                <v-icon size="14" class="mac-btn-chevron">mdi-chevron-down</v-icon>
              </button>
            </template>
            <div class="udu-menu">
              <button
                v-for="t in presetTypes"
                :key="t.key"
                type="button"
                class="udu-menu-item"
                :class="`udt--${t.tone}`"
                @click="applyBatchType(t.key)"
              >
                <span class="udt-dot"></span>{{ t.label }}
              </button>
              <div class="udu-menu-custom udt--gray">
                <span class="udt-dot"></span>
                <input
                  v-model="batchCustom"
                  class="mac-form-input"
                  placeholder="其他（自訂）"
                  :maxlength="UNIT_DOCUMENT_CUSTOM_LABEL_MAX"
                  @keydown.enter.prevent="applyBatchType('other')"
                />
                <button type="button" class="mac-btn mac-btn--sm" :disabled="!batchCustom.trim()" @click="applyBatchType('other')">套用</button>
              </div>
            </div>
          </v-menu>
          <button
            v-if="checkedKeys.length"
            type="button"
            class="mac-btn mac-btn--sm mac-btn--danger"
            :disabled="running"
            @click="removeChecked"
          >
            移除
          </button>
        </template>
        <span class="mac-spacer"></span>
        <label class="mac-btn mac-btn--sm udu-date" :class="{ 'is-disabled': running }" title="文件日期">
          <v-icon size="15">mdi-calendar-blank-outline</v-icon>{{ docDateLabel }}
          <input
            v-model="docDate"
            type="date"
            class="udu-date-input"
            :disabled="running"
            @click="openDatePicker"
          />
        </label>
        <template v-if="items.length">
          <button type="button" class="mac-btn mac-btn--sm" :disabled="!canAddFiles" title="加入檔案（可拖曳或 ⌘V 貼上）" @click="pickFiles">
            <v-icon size="15">mdi-plus</v-icon><span class="mac-hide-xs">加入檔案</span>
          </button>
          <button v-if="isMobile" type="button" class="mac-btn mac-btn--sm" :disabled="!canAddFiles" title="拍照" @click="pickCamera">
            <v-icon size="15">mdi-camera-outline</v-icon>
          </button>
        </template>
      </div>

      <!-- 內容 -->
      <div class="udu-body" :class="{ 'udu-body--empty': !items.length }">
        <!-- 尚未選檔 -->
        <div v-if="!items.length" class="udu-empty">
          <div class="udu-empty-types">
            <span class="udu-empty-label">種類</span>
            <div class="udt-pills">
              <button
                v-for="t in UNIT_DOCUMENT_TYPES"
                :key="t.key"
                type="button"
                class="udt-pill"
                :class="[`udt--${t.tone}`, { 'is-active': defaultType === t.key }]"
                @click="defaultType = t.key"
              >
                {{ t.label }}
              </button>
            </div>
            <v-text-field
              v-if="isCustomType(defaultType)"
              v-model="defaultCustom"
              placeholder="自訂種類"
              variant="solo"
              flat
              density="compact"
              hide-details
              class="mac-vfield udu-empty-custom"
              :maxlength="UNIT_DOCUMENT_CUSTOM_LABEL_MAX"
            />
          </div>
          <div class="udu-drop" role="button" tabindex="0" @click="pickFiles" @keydown.enter.prevent="pickFiles">
            <v-icon size="44" class="udu-drop-icon">mdi-tray-arrow-up</v-icon>
            <div class="udu-drop-title">{{ isMobile ? '選擇檔案或拍照' : '拖曳檔案到這裡' }}</div>
            <div class="udu-drop-actions">
              <button type="button" class="mac-btn mac-btn--primary" :class="{ 'mac-btn--lg': isMobile }" @click.stop="pickFiles">
                <v-icon size="16">mdi-paperclip</v-icon>選擇檔案
              </button>
              <button v-if="isMobile" type="button" class="mac-btn mac-btn--lg" @click.stop="pickCamera">
                <v-icon size="16">mdi-camera-outline</v-icon>拍照
              </button>
            </div>
            <div class="udu-drop-hint">單檔 {{ formatFileSize(UNIT_DOCUMENT_MAX_SIZE) }} 以內・最多 {{ UNIT_DOCUMENT_MAX_BATCH }} 個</div>
          </div>
        </div>

        <!-- 檔案清單 -->
        <div v-else ref="listEl" class="udu-list">
          <draggable
            v-model="items"
            item-key="key"
            handle=".udu-drag"
            :disabled="running"
            :animation="150"
            ghost-class="udu-row--ghost"
            @end="assignAutoNames"
          >
            <template #item="{ element: it }">
              <div
                class="udu-row"
                :data-key="it.key"
                :class="{
                  'is-selected': !isMobile && it.key === selectedKey,
                  'is-blocked': !!it.blocked,
                  'is-done': it.status === 'done',
                }"
                @click="onRowClick(it)"
                @dblclick="openQuickLook(it)"
              >
                <input
                  type="checkbox"
                  class="mac-check udu-row-check"
                  :checked="checkedKeys.includes(it.key)"
                  :disabled="running"
                  @click.stop
                  @change="toggleChecked(it)"
                />
                <div class="udu-thumb">
                  <img v-if="it.thumbUrl" :src="it.thumbUrl" alt="" draggable="false" />
                  <v-icon v-else size="30" :color="fileIcon(it).color">{{ fileIcon(it).icon }}</v-icon>
                  <div v-if="it.jobs > 0 && it.status === 'pending'" class="udu-thumb-cover">
                    <v-progress-circular indeterminate size="18" width="2" color="#6e6e73" />
                  </div>
                  <div v-if="it.status === 'uploading' || it.status === 'committing'" class="udu-thumb-cover udu-thumb-cover--dark">
                    <v-progress-circular
                      :model-value="it.progress"
                      :indeterminate="it.status === 'committing'"
                      size="28"
                      width="3"
                      color="white"
                    />
                  </div>
                  <span v-if="it.status === 'done'" class="udu-thumb-badge udu-thumb-badge--ok">
                    <v-icon size="13">mdi-check</v-icon>
                  </span>
                  <span v-else-if="it.status === 'error' || it.blocked" class="udu-thumb-badge udu-thumb-badge--err">
                    <v-icon size="13">mdi-exclamation</v-icon>
                  </span>
                </div>
                <div class="udu-row-main">
                  <div class="udu-row-name">
                    {{ it.status === 'done' ? it.resultName : (it.blocked ? it.file.name : displayBase(it)) }}<span
                      v-if="it.status !== 'done' && !it.blocked && it.ext"
                      class="udu-ext"
                    >.{{ it.ext }}</span>
                  </div>
                  <div class="udu-row-meta">
                    <span v-if="!it.blocked" class="mac-tag" :class="`udt--${typeMeta(it.docType).tone}`">{{ typeLabel(it) }}</span>
                    <span>{{ finalSizeText(it) }}</span>
                    <span v-if="it.pages">{{ it.pages }} 頁</span>
                    <span v-if="rowState(it)" class="udu-state" :class="`udu-state--${rowState(it).tone}`">{{ rowState(it).text }}</span>
                  </div>
                </div>
                <div class="udu-row-side">
                  <button
                    v-if="!running"
                    type="button"
                    class="mac-icon-btn"
                    title="移除"
                    @click.stop="removeItem(it)"
                  >
                    <v-icon size="17">mdi-close</v-icon>
                  </button>
                  <span v-if="!running && it.status !== 'done'" class="udu-drag" title="拖曳排序" @click.stop>
                    <v-icon size="18">mdi-drag-vertical</v-icon>
                  </span>
                </div>
              </div>
            </template>
          </draggable>
        </div>

        <!-- 右側預覽（電腦版） -->
        <div v-if="items.length && !isMobile" class="udu-detail">
          <template v-if="selectedItem">
            <div class="udu-detail-bar">
              <button type="button" class="mac-icon-btn" title="上一個（↑）" :disabled="selectedIndex <= 0" @click="moveSelection(-1)">
                <v-icon size="18">mdi-chevron-left</v-icon>
              </button>
              <span class="udu-counter">{{ selectedIndex + 1 }} / {{ items.length }}</span>
              <button type="button" class="mac-icon-btn" title="下一個（↓）" :disabled="selectedIndex >= items.length - 1" @click="moveSelection(1)">
                <v-icon size="18">mdi-chevron-right</v-icon>
              </button>
            </div>
            <FilePreviewStage
              :key="selectedItem.key"
              class="udu-stage"
              v-bind="stageProps(selectedItem)"
              expandable
              @rotate="rotateItem(selectedItem)"
              @expand="openQuickLook(selectedItem)"
            />
            <div class="udu-editor">
              <UnitDocumentItemEditor
                :item="selectedItem"
                :disabled="running || selectedItem.status === 'done'"
                @update:name="v => setName(selectedItem, v)"
                @reset-name="resetName(selectedItem)"
                @update:type="k => setType(selectedItem, k)"
                @update:custom-label="v => setCustomLabel(selectedItem, v)"
                @next="moveSelection(1)"
              />
            </div>
          </template>
        </div>
      </div>

      <!-- 底部 -->
      <div class="mac-sheet-foot udu-foot">
        <span class="udu-summary">{{ summaryText }}</span>
        <span class="mac-spacer"></span>
        <button type="button" class="mac-btn" :class="{ 'mac-btn--lg': isMobile }" :disabled="running" @click="requestClose">
          {{ settled ? '完成' : '取消' }}
        </button>
        <button
          v-if="running || uploadableItems.length"
          type="button"
          class="mac-btn mac-btn--primary"
          :class="{ 'mac-btn--lg': isMobile }"
          :disabled="!canStartUpload"
          title="⌘Enter"
          @click="startUpload"
        >
          <v-progress-circular v-if="running" indeterminate size="14" width="2" color="white" />
          {{ uploadButtonText }}
        </button>
      </div>

      <input ref="fileInput" type="file" multiple hidden @change="onInputChange" />
      <input ref="cameraInput" type="file" accept="image/*" capture="environment" hidden @change="onInputChange" />

      <!-- 全螢幕預覽：手機點檔案、電腦雙擊或空白鍵 -->
      <v-dialog v-model="quickLook" fullscreen persistent :scrim="false" transition="fade-transition" content-class="udu-ql-overlay">
        <div v-if="selectedItem" class="udu-ql">
          <div class="udu-ql-head">
            <button type="button" class="mac-icon-btn" title="上一個" :disabled="selectedIndex <= 0" @click="moveSelection(-1)">
              <v-icon size="20">mdi-chevron-left</v-icon>
            </button>
            <span class="udu-counter">{{ selectedIndex + 1 }} / {{ items.length }}</span>
            <button type="button" class="mac-icon-btn" title="下一個" :disabled="selectedIndex >= items.length - 1" @click="moveSelection(1)">
              <v-icon size="20">mdi-chevron-right</v-icon>
            </button>
            <span class="udu-ql-title">{{ selectedItem.status === 'done' ? selectedItem.resultName : `${displayBase(selectedItem)}${selectedItem.ext ? `.${selectedItem.ext}` : ''}` }}</span>
            <button type="button" class="mac-sheet-close" title="關閉" @click="quickLook = false">
              <v-icon size="20">mdi-close</v-icon>
            </button>
          </div>
          <div class="udu-ql-stage-wrap" @touchstart.passive="onSwipeStart" @touchend="onSwipeEnd">
            <FilePreviewStage
              ref="qlStageRef"
              :key="`ql-${selectedItem.key}`"
              class="udu-ql-stage"
              v-bind="stageProps(selectedItem)"
              @rotate="rotateItem(selectedItem)"
            />
          </div>
          <div class="udu-ql-foot">
            <UnitDocumentItemEditor
              :item="selectedItem"
              :disabled="running || selectedItem.status === 'done'"
              @update:name="v => setName(selectedItem, v)"
              @reset-name="resetName(selectedItem)"
              @update:type="k => setType(selectedItem, k)"
              @update:custom-label="v => setCustomLabel(selectedItem, v)"
              @next="moveSelection(1)"
            />
          </div>
        </div>
      </v-dialog>

      <!-- 放棄確認 -->
      <v-dialog v-model="confirmDiscard" max-width="380" persistent content-class="mac-dialog-fit">
        <v-card class="mac-sheet">
          <div class="mac-sheet-section udu-confirm">
            <div class="udu-confirm-title">放棄 {{ pendingCount }} 個未上傳的檔案？</div>
          </div>
          <div class="mac-sheet-foot">
            <span class="mac-spacer"></span>
            <button type="button" class="mac-btn" @click="confirmDiscard = false">繼續編輯</button>
            <button type="button" class="mac-btn mac-btn--danger-fill" @click="close">放棄</button>
          </div>
        </v-card>
      </v-dialog>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { ref, reactive, computed, watch, nextTick, onBeforeUnmount } from 'vue';
import { useDisplay } from 'vuetify';
import { useToast, POSITION } from 'vue-toastification';
import draggable from 'vuedraggable';
import { ref as storageRef, uploadBytesResumable, deleteObject } from 'firebase/storage';
import { storage } from '@/firebase';
import '@/styles/unitDocuments.css';
import FilePreviewStage from './FilePreviewStage.vue';
import UnitDocumentItemEditor from './UnitDocumentItemEditor.vue';
import {
  UNIT_DOCUMENT_TYPES,
  UNIT_DOCUMENT_MAX_SIZE,
  UNIT_DOCUMENT_MAX_BATCH,
  UNIT_DOCUMENT_CUSTOM_LABEL_MAX,
  getDocTypeMeta,
  sanitizeFileNameSegment,
  getFileExtension,
  stripFileExtension,
  isBlockedExtension,
  buildUnitDocumentBaseName,
  computeAutoNames,
  resolveDocTypeLabel,
  formatFileSize,
  fileIconForDocument,
  taipeiDateInputValue,
} from '@/utils/unitDocuments';
import {
  PREVIEW_LAZY_SIZE,
  detectPreviewKind,
  extensionForBlob,
  prepareUploadImage,
  makeImageThumb,
  convertHeicToJpeg,
  makePdfThumb,
  makeDocxThumb,
  revokeUrl,
} from '@/utils/filePreview';

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  projectId: { type: String, required: true },
  unitId: { type: String, default: '' },
  // 此戶已上傳的文件（自動編號接續用）
  existingDocuments: { type: Array, default: () => [] },
  // async ({ storagePath, fileName, docType, docTypeLabel, originalName, mimeType, size }) => record
  uploadHandler: { type: Function, default: null },
});
const emit = defineEmits(['update:modelValue']);

const { smAndDown } = useDisplay();
const isMobile = computed(() => smAndDown.value);
const toast = useToast();

const UPLOAD_CONCURRENCY = 2;
const PREP_CONCURRENCY = 2;
const presetTypes = UNIT_DOCUMENT_TYPES.filter(t => !t.custom);

const items = ref([]);
const selectedKey = ref('');
const checkedKeys = ref([]);
const docDate = ref(taipeiDateInputValue());
const defaultType = ref('contract');
const defaultCustom = ref('');
const batchCustom = ref('');
const typeMenu = ref(false);
const running = ref(false);
const finished = ref(false);
const runKeys = ref([]);
const quickLook = ref(false);
const confirmDiscard = ref(false);

const fileInput = ref(null);
const cameraInput = ref(null);
const listEl = ref(null);
const qlStageRef = ref(null);

// ───────── 狀態 ─────────
const selectedItem = computed(() => items.value.find(it => it.key === selectedKey.value) || null);
const selectedIndex = computed(() => items.value.findIndex(it => it.key === selectedKey.value));
const editableItems = computed(() => items.value.filter(it => !it.blocked && it.status !== 'done'));
const uploadableItems = computed(() => items.value.filter(it => !it.blocked && (it.status === 'pending' || it.status === 'error')));
const pendingCount = computed(() => editableItems.value.length);
const preparing = computed(() => uploadableItems.value.some(it => it.jobs > 0));
const invalidCount = computed(() => uploadableItems.value.filter(it => !itemValid(it)).length);
const doneCount = computed(() => items.value.filter(it => it.status === 'done').length);
const errorCount = computed(() => items.value.filter(it => it.status === 'error').length);
const settled = computed(() => uploadableItems.value.length === 0 && doneCount.value > 0);
const canAddFiles = computed(() => !running.value
  && items.value.filter(it => it.status !== 'done').length < UNIT_DOCUMENT_MAX_BATCH);
const canStartUpload = computed(() => !running.value
  && uploadableItems.value.length > 0
  && !preparing.value
  && invalidCount.value === 0);
const allChecked = computed(() => items.value.length > 0 && items.value.every(it => checkedKeys.value.includes(it.key)));
const someChecked = computed(() => checkedKeys.value.length > 0 && !allChecked.value);

const docDateLabel = computed(() => {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(docDate.value || '');
  return m ? `${m[2]}/${m[3]}` : '今天';
});

const summaryText = computed(() => {
  if (running.value) {
    const done = items.value.filter(it => runKeys.value.includes(it.key) && it.status === 'done').length;
    return `上傳中 ${done} / ${runKeys.value.length}`;
  }
  if (!items.value.length) return '';
  if (finished.value && !uploadableItems.value.some(it => it.status === 'pending')) {
    return errorCount.value
      ? `已上傳 ${doneCount.value} 個・${errorCount.value} 個失敗`
      : `已上傳 ${doneCount.value} 個檔案`;
  }
  const list = uploadableItems.value;
  const bytes = list.reduce((sum, it) => sum + finalSize(it), 0);
  const parts = [`${list.length} 個檔案・${formatFileSize(bytes)}`];
  if (preparing.value) parts.push('處理中');
  else if (invalidCount.value) parts.push(`${invalidCount.value} 個需填寫`);
  return parts.join('・');
});

const uploadButtonText = computed(() => {
  if (running.value) return '上傳中';
  const n = uploadableItems.value.length;
  return uploadableItems.value.every(it => it.status === 'error') ? `重試 ${n} 個檔案` : `上傳 ${n} 個檔案`;
});

function typeMeta(key) { return getDocTypeMeta(key); }
function isCustomType(key) { return !!getDocTypeMeta(key).custom; }
function typeLabel(it) {
  if (isCustomType(it.docType)) return sanitizeFileNameSegment(it.customLabel, UNIT_DOCUMENT_CUSTOM_LABEL_MAX) || '其他';
  return getDocTypeMeta(it.docType).label;
}
function itemValid(it) {
  if (!sanitizeFileNameSegment(it.baseName)) return false;
  if (isCustomType(it.docType) && !sanitizeFileNameSegment(it.customLabel, UNIT_DOCUMENT_CUSTOM_LABEL_MAX)) return false;
  return true;
}
function displayBase(it) {
  return sanitizeFileNameSegment(it.baseName) || '（未命名）';
}
function finalBlob(it) { return it.out || it.source || it.file; }
function finalSize(it) { return finalBlob(it)?.size || it.file.size || 0; }
function finalSizeText(it) { return formatFileSize(finalSize(it)); }
function fileIcon(it) { return fileIconForDocument(it.file.type, it.file.name); }

function rowState(it) {
  if (it.blocked) return { text: it.blocked, tone: 'err' };
  if (it.status === 'uploading') return { text: `上傳中 ${it.progress}%`, tone: 'run' };
  if (it.status === 'committing') return { text: '轉存 Drive', tone: 'run' };
  if (it.status === 'done') return { text: '已上傳', tone: 'ok' };
  if (it.status === 'error') return { text: '上傳失敗', tone: 'err' };
  if (running.value && runKeys.value.includes(it.key)) return { text: '等待', tone: 'muted' };
  if (it.jobs > 0) return { text: '處理中', tone: 'muted' };
  if (!sanitizeFileNameSegment(it.baseName)) return { text: '名稱未填', tone: 'err' };
  if (isCustomType(it.docType) && !sanitizeFileNameSegment(it.customLabel, UNIT_DOCUMENT_CUSTOM_LABEL_MAX)) {
    return { text: '種類未填', tone: 'err' };
  }
  return null;
}

function stageProps(it) {
  const isDoc = it.kind === 'pdf' || it.kind === 'docx';
  return {
    kind: it.blocked ? 'none' : (it.kind === 'heic' ? 'image' : it.kind),
    src: !it.blocked && isDoc ? it.file : null,
    imageUrl: it.kind === 'image' ? it.previewUrl : '',
    fileName: it.file.name,
    mimeType: it.file.type,
    deferred: it.deferred,
    rotatable: it.kind === 'image' && !it.blocked && it.status !== 'done' && !running.value,
    busy: it.jobs > 0 && it.status === 'pending',
  };
}

// ───────── 命名 ─────────
function assignAutoNames() {
  const editable = editableItems.value;
  const entries = editable.map(it => ({
    key: it.key,
    base: buildUnitDocumentBaseName(props.unitId, resolveDocTypeLabel(it.docType, it.customLabel) || getDocTypeMeta(it.docType).label, docDate.value),
    touched: it.nameTouched,
    name: sanitizeFileNameSegment(it.baseName),
  }));
  const existing = [
    ...(props.existingDocuments || []).map(d => d?.fileName || ''),
    ...items.value.filter(it => it.status === 'done').map(it => it.resultName),
  ];
  const names = computeAutoNames(entries, existing);
  for (const it of editable) {
    if (!it.nameTouched && names.has(it.key)) it.baseName = names.get(it.key);
  }
}

function setName(it, v) {
  it.baseName = v;
  it.nameTouched = true;
}
function resetName(it) {
  it.nameTouched = false;
  assignAutoNames();
}
function setType(it, key) {
  it.docType = key;
  if (!isCustomType(key)) it.customLabel = '';
  assignAutoNames();
}
function setCustomLabel(it, v) {
  it.customLabel = v;
  assignAutoNames();
}

function applyBatchType(key) {
  const custom = isCustomType(key);
  const label = custom ? sanitizeFileNameSegment(batchCustom.value, UNIT_DOCUMENT_CUSTOM_LABEL_MAX) : '';
  if (custom && !label) return;
  const targets = checkedKeys.value.length
    ? editableItems.value.filter(it => checkedKeys.value.includes(it.key))
    : editableItems.value;
  for (const it of targets) {
    it.docType = key;
    it.customLabel = label;
  }
  defaultType.value = key;
  defaultCustom.value = label;
  typeMenu.value = false;
  assignAutoNames();
}

watch(docDate, (v) => {
  if (!v) { docDate.value = taipeiDateInputValue(); return; }
  assignAutoNames();
});

function openDatePicker(e) {
  try { e.target.showPicker?.(); } catch (err) { /* 舊瀏覽器直接用原生點選 */ }
}

// ───────── 加入檔案 ─────────
function pickFiles() {
  if (!canAddFiles.value) return;
  fileInput.value?.click();
}
function pickCamera() {
  if (!canAddFiles.value) return;
  cameraInput.value?.click();
}
function onInputChange(e) {
  const files = Array.from(e.target?.files || []);
  e.target.value = '';
  addFiles(files);
}

function createItem(file, sig) {
  const kind = detectPreviewKind(file);
  const ext = getFileExtension(file.name);
  let blocked = '';
  if (isBlockedExtension(ext)) blocked = '不允許的檔案類型';
  else if (file.size > UNIT_DOCUMENT_MAX_SIZE) blocked = `超過 ${formatFileSize(UNIT_DOCUMENT_MAX_SIZE)} 上限`;
  else if (file.size === 0) blocked = '空檔案';
  return reactive({
    key: `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    sig,
    file,
    kind,
    wasHeic: kind === 'heic',
    ext: kind === 'heic' ? 'jpg' : ext,
    source: kind === 'heic' ? null : file,
    out: null,
    rotation: 0,
    imgVersion: 0,
    jobs: 0,
    thumbUrl: '',
    previewUrl: '',
    pages: 0,
    prepNote: '',
    deferred: (kind === 'pdf' || kind === 'docx') && file.size > PREVIEW_LAZY_SIZE,
    docType: defaultType.value,
    customLabel: isCustomType(defaultType.value) ? defaultCustom.value : '',
    baseName: '',
    nameTouched: false,
    status: 'pending',
    progress: 0,
    error: '',
    blocked,
    resultName: '',
  });
}

function addFiles(fileList) {
  if (running.value) return;
  const files = Array.from(fileList || []);
  if (!files.length) return;
  let skippedMax = 0;
  let skippedDup = 0;
  const added = [];
  for (const file of files) {
    if (items.value.filter(it => it.status !== 'done').length >= UNIT_DOCUMENT_MAX_BATCH) { skippedMax += 1; continue; }
    const sig = `${file.name}|${file.size}|${file.lastModified}`;
    if (items.value.some(it => it.sig === sig && it.status !== 'done')) { skippedDup += 1; continue; }
    const it = createItem(file, sig);
    items.value.push(it);
    added.push(it);
  }
  if (skippedMax) toast.warning(`一次最多 ${UNIT_DOCUMENT_MAX_BATCH} 個檔案，已略過 ${skippedMax} 個`, { position: POSITION.BOTTOM_CENTER });
  if (skippedDup) toast.info(`已略過 ${skippedDup} 個重複的檔案`, { position: POSITION.BOTTOM_CENTER });
  if (!added.length) return;
  finished.value = false;
  if (!selectedItem.value) selectedKey.value = added[0].key;
  assignAutoNames();
  for (const it of added) enqueuePrep(it);
}

function onPaste(e) {
  if (!props.modelValue || running.value || quickLook.value) return;
  const files = Array.from(e.clipboardData?.files || []);
  if (!files.length) return;
  e.preventDefault();
  addFiles(files);
}

// ───────── 縮圖／轉檔／壓縮（依序處理，同時 2 個）─────────
const prepQueue = [];
let prepActive = 0;

function alive(it) {
  return items.value.includes(it);
}

function enqueuePrep(it) {
  if (it.blocked) return;
  it.jobs += 1;
  prepQueue.push(it);
  pumpPrep();
}

function pumpPrep() {
  while (prepActive < PREP_CONCURRENCY && prepQueue.length) {
    const it = prepQueue.shift();
    if (!alive(it)) continue;
    prepActive += 1;
    prepareItem(it).finally(() => {
      it.jobs = Math.max(0, it.jobs - 1);
      prepActive -= 1;
      pumpPrep();
    });
  }
}

async function prepareItem(it) {
  try {
    if (it.kind === 'heic') {
      try {
        it.source = await convertHeicToJpeg(it.file);
        it.kind = 'image';
      } catch (err) {
        console.warn('[UnitDocumentUploadSheet] HEIC 轉檔失敗:', err);
        it.source = it.file;
        it.kind = 'none';
        it.ext = getFileExtension(it.file.name);
        it.prepNote = '無法轉成 JPG，將上傳原檔';
      }
      if (!alive(it)) return;
    }
    if (it.kind === 'image') {
      await refreshImage(it);
    } else if (it.kind === 'pdf' && !it.deferred) {
      const r = await makePdfThumb(it.file);
      if (!alive(it)) { revokeUrl(r.url); return; }
      it.thumbUrl = r.url;
      it.pages = r.pages;
    } else if (it.kind === 'docx' && !it.deferred) {
      const url = await makeDocxThumb(it.file);
      if (!alive(it)) { revokeUrl(url); return; }
      it.thumbUrl = url;
    }
  } catch (err) {
    // 縮圖失敗只影響顯示，仍可上傳原檔
    console.warn('[UnitDocumentUploadSheet] 產生縮圖失敗:', it.file.name, err);
  }
}

/** 依旋轉角度與壓縮規則重新產生要上傳的圖片、預覽與縮圖 */
async function refreshImage(it) {
  const version = ++it.imgVersion;
  let out = null;
  try {
    out = await prepareUploadImage(it.source, it.rotation);
  } catch (err) {
    console.warn('[UnitDocumentUploadSheet] 圖片處理失敗，改上傳原檔:', err);
    out = null;
  }
  if (version !== it.imgVersion || !alive(it)) return;
  const display = out || it.source;
  const thumb = await makeImageThumb(display).catch(() => '');
  if (version !== it.imgVersion || !alive(it)) { revokeUrl(thumb); return; }
  revokeUrl(it.previewUrl);
  revokeUrl(it.thumbUrl);
  const baseExt = it.wasHeic ? 'jpg' : getFileExtension(it.file.name);
  it.out = out;
  it.ext = out ? extensionForBlob(out, baseExt) : baseExt;
  it.previewUrl = URL.createObjectURL(display);
  it.thumbUrl = thumb;
}

async function rotateItem(it) {
  if (!it || running.value || it.status === 'done' || it.kind !== 'image' || !it.source) return;
  it.rotation = (it.rotation + 90) % 360;
  it.jobs += 1;
  try {
    await refreshImage(it);
  } finally {
    it.jobs = Math.max(0, it.jobs - 1);
  }
}

// ───────── 清單操作 ─────────
function releaseItem(it) {
  revokeUrl(it.thumbUrl);
  revokeUrl(it.previewUrl);
  it.thumbUrl = '';
  it.previewUrl = '';
}

function removeItem(it) {
  if (running.value) return;
  const idx = items.value.indexOf(it);
  if (idx < 0) return;
  items.value.splice(idx, 1);
  releaseItem(it);
  checkedKeys.value = checkedKeys.value.filter(k => k !== it.key);
  if (selectedKey.value === it.key) {
    selectedKey.value = (items.value[idx] || items.value[idx - 1])?.key || '';
  }
  if (!items.value.length) quickLook.value = false;
  assignAutoNames();
}

function removeChecked() {
  for (const it of items.value.filter(x => checkedKeys.value.includes(x.key))) removeItem(it);
  checkedKeys.value = [];
}

function toggleChecked(it) {
  checkedKeys.value = checkedKeys.value.includes(it.key)
    ? checkedKeys.value.filter(k => k !== it.key)
    : [...checkedKeys.value, it.key];
}
function toggleAll() {
  checkedKeys.value = allChecked.value ? [] : items.value.map(it => it.key);
}

function scrollRowIntoView(key) {
  nextTick(() => {
    const row = listEl.value?.querySelector(`[data-key="${key}"]`);
    try { row?.scrollIntoView({ block: 'nearest' }); } catch (e) { /* noop */ }
  });
}

function moveSelection(delta) {
  if (!items.value.length) return;
  const idx = selectedIndex.value < 0 ? 0 : selectedIndex.value;
  const next = Math.min(items.value.length - 1, Math.max(0, idx + delta));
  selectedKey.value = items.value[next].key;
  scrollRowIntoView(selectedKey.value);
}

function onRowClick(it) {
  selectedKey.value = it.key;
  if (isMobile.value) quickLook.value = true;
}

function openQuickLook(it) {
  if (it) selectedKey.value = it.key;
  if (selectedItem.value) quickLook.value = true;
}

// 手機全螢幕預覽左右滑動切換（放大中不切換）
let swipe = null;
function onSwipeStart(e) {
  swipe = e.touches.length === 1 ? { x: e.touches[0].clientX, y: e.touches[0].clientY } : null;
}
function onSwipeEnd(e) {
  if (!swipe) return;
  const t = e.changedTouches[0];
  const dx = t.clientX - swipe.x;
  const dy = t.clientY - swipe.y;
  swipe = null;
  if (qlStageRef.value?.isZoomed?.()) return;
  if (Math.abs(dx) > 60 && Math.abs(dy) < 50) moveSelection(dx < 0 ? 1 : -1);
}

// ───────── 上傳（Storage 暫存 → uploadHandler 轉存 Drive）─────────
function uploadToStorage(it) {
  const blob = finalBlob(it);
  const uploadId = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const safeBase = stripFileExtension(it.file.name).replace(/[^\w-]/g, '_').replace(/_+/g, '_').slice(0, 60) || 'file';
  const path = `unitDocuments/temp/${props.projectId}/${props.unitId}/${uploadId}/${safeBase}${it.ext ? `.${it.ext}` : ''}`;
  const fileRef = storageRef(storage, path);
  return new Promise((resolve, reject) => {
    const task = uploadBytesResumable(fileRef, blob, { contentType: blob.type || it.file.type || 'application/octet-stream' });
    task.on('state_changed',
      snap => { it.progress = snap.totalBytes ? Math.round((snap.bytesTransferred / snap.totalBytes) * 100) : 0; },
      err => reject(err),
      () => resolve(path)
    );
  });
}

async function uploadOne(it) {
  it.error = '';
  it.progress = 0;
  it.status = 'uploading';
  let storagePath = '';
  try {
    const blob = finalBlob(it);
    storagePath = await uploadToStorage(it);
    it.status = 'committing';
    const baseName = sanitizeFileNameSegment(it.baseName);
    const record = await props.uploadHandler({
      storagePath,
      fileName: baseName,
      docType: it.docType,
      docTypeLabel: resolveDocTypeLabel(it.docType, it.customLabel),
      originalName: it.file.name,
      mimeType: blob.type || it.file.type || '',
      size: blob.size,
    });
    it.resultName = record?.fileName || `${baseName}${it.ext ? `.${it.ext}` : ''}`;
    it.status = 'done';
  } catch (err) {
    console.error('[UnitDocumentUploadSheet] 上傳失敗:', err);
    it.status = 'error';
    it.error = err?.message || '上傳失敗，請稍後再試';
    // 已傳到 Storage 但轉存失敗 → 清掉暫存（失敗忽略，另有 lifecycle 兜底）
    if (storagePath) {
      try { await deleteObject(storageRef(storage, storagePath)); } catch (e) { /* noop */ }
    }
  }
}

function onBeforeUnload(e) {
  e.preventDefault();
  e.returnValue = '';
}

async function startUpload() {
  if (!canStartUpload.value || !props.uploadHandler) return;
  quickLook.value = false;
  typeMenu.value = false;
  checkedKeys.value = [];
  running.value = true;
  finished.value = false;
  window.addEventListener('beforeunload', onBeforeUnload);
  const queue = uploadableItems.value.slice();
  runKeys.value = queue.map(it => it.key);
  for (const it of queue) {
    it.status = 'pending';
    it.error = '';
  }
  try {
    const workers = Array.from({ length: Math.min(UPLOAD_CONCURRENCY, queue.length) }, async () => {
      while (queue.length > 0) {
        await uploadOne(queue.shift());
      }
    });
    await Promise.all(workers);
  } finally {
    window.removeEventListener('beforeunload', onBeforeUnload);
    running.value = false;
    finished.value = true;
  }
  const failed = items.value.filter(it => runKeys.value.includes(it.key) && it.status === 'error').length;
  const ok = runKeys.value.length - failed;
  if (failed) toast.error(`${failed} 個檔案上傳失敗，可按「重試」`, { position: POSITION.BOTTOM_CENTER });
  else toast.success(`已上傳 ${ok} 個檔案`, { position: POSITION.BOTTOM_CENTER });
  const firstFailed = items.value.find(it => it.status === 'error');
  if (firstFailed) selectedKey.value = firstFailed.key;
}

// ───────── 開關 ─────────
function resetAll() {
  for (const it of items.value) releaseItem(it);
  items.value = [];
  prepQueue.length = 0;
  selectedKey.value = '';
  checkedKeys.value = [];
  runKeys.value = [];
  docDate.value = taipeiDateInputValue();
  batchCustom.value = '';
  finished.value = false;
  quickLook.value = false;
  confirmDiscard.value = false;
  typeMenu.value = false;
}

function requestClose() {
  if (running.value) return;
  if (pendingCount.value > 0) {
    confirmDiscard.value = true;
    return;
  }
  close();
}

function close() {
  confirmDiscard.value = false;
  quickLook.value = false;
  emit('update:modelValue', false);
}

// 在 window capture 階段處理：比 Vuetify 選單／對話框自己的 Esc 更早執行，才能判斷當下開著哪一層
function onKeydown(e) {
  if (!props.modelValue) return;
  if (e.key === 'Escape') {
    if (typeMenu.value) return; // 交給選單自己關
    e.preventDefault();
    e.stopPropagation();
    if (confirmDiscard.value) confirmDiscard.value = false;
    else if (quickLook.value) quickLook.value = false;
    else requestClose();
    return;
  }
  if (confirmDiscard.value) return;
  if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
    e.preventDefault();
    if (canStartUpload.value) startUpload();
    return;
  }
  const t = e.target;
  const typing = t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.tagName === 'SELECT' || t.isContentEditable);
  if (typing || typeMenu.value || !items.value.length) return;
  if (quickLook.value) {
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') { e.preventDefault(); moveSelection(1); }
    else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') { e.preventDefault(); moveSelection(-1); }
    else if (e.key === ' ') { e.preventDefault(); quickLook.value = false; }
    return;
  }
  if (isMobile.value) return;
  if (e.key === 'ArrowDown') { e.preventDefault(); moveSelection(1); }
  else if (e.key === 'ArrowUp') { e.preventDefault(); moveSelection(-1); }
  else if (e.key === ' ' && selectedItem.value) { e.preventDefault(); quickLook.value = true; }
}

function bindListeners(on) {
  const method = on ? 'addEventListener' : 'removeEventListener';
  window[method]('keydown', onKeydown, true);
  document[method]('paste', onPaste);
}

watch(() => props.modelValue, (open, wasOpen) => {
  if (open) {
    resetAll();
    bindListeners(true);
  } else if (wasOpen) {
    bindListeners(false);
    resetAll();
  }
}, { immediate: true });

defineExpose({ addFiles });

onBeforeUnmount(() => {
  bindListeners(false);
  window.removeEventListener('beforeunload', onBeforeUnload);
  for (const it of items.value) releaseItem(it);
});
</script>

<style scoped>
.udu {
  display: flex;
  flex-direction: column;
  max-height: calc(100vh - 48px);
  background: #fff;
}
.udu--mobile {
  max-height: none;
  height: 100%;
  border-radius: 0 !important;
}
/* 手機全螢幕：避開全站左上角固定漢堡鈕 */
.udu--mobile .udu-head { padding-left: 58px; }
.udu-title {
  min-width: 0;
  overflow-wrap: anywhere;
}

/* 工具列 */
.udu-toolbar {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
  min-height: 46px;
  padding: 8px 16px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.08);
}
.udu-toolbar .mac-spacer { flex: 1 1 auto; }
.udu-checked {
  color: #6e6e73;
  font-size: 12.5px;
  white-space: nowrap;
}
.udu-date {
  position: relative;
  font-variant-numeric: tabular-nums;
}
.udu-date.is-disabled { opacity: 0.45; }
.udu-date-input {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  opacity: 0;
  cursor: pointer;
  border: 0;
}

/* 種類選單 */
.udu-menu {
  display: flex;
  flex-direction: column;
  min-width: 220px;
  padding: 5px;
  border-radius: 10px;
  background: rgba(248, 248, 250, 0.97);
  -webkit-backdrop-filter: saturate(180%) blur(20px);
  backdrop-filter: saturate(180%) blur(20px);
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.16), 0 0 0 0.5px rgba(0, 0, 0, 0.12);
  font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", "PingFang TC", "Noto Sans TC", sans-serif;
}
.udu-menu-item {
  display: flex;
  align-items: center;
  gap: 8px;
  min-height: 32px;
  padding: 5px 10px;
  border: 0;
  border-radius: 6px;
  background: transparent;
  color: #1d1d1f;
  font-size: 13.5px;
  font-weight: 500;
  text-align: left;
  cursor: pointer;
}
.udu-menu-item:hover { background: #0071e3; color: #fff; }
.udu-menu-item:hover .udt-dot { box-shadow: 0 0 0 1.5px #fff; }
.udu-menu-custom {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 4px 4px 10px;
  margin-top: 4px;
  border-top: 1px solid rgba(0, 0, 0, 0.08);
}
.udu-menu-custom .mac-form-input { width: 120px; flex: 1 1 auto; }

/* 內容 */
.udu-body {
  display: grid;
  grid-template-columns: 380px minmax(0, 1fr);
  height: min(68vh, 660px);
  min-height: 0;
}
.udu-body--empty {
  display: block;
  height: auto;
  overflow-y: auto;
}
.udu--mobile .udu-body {
  display: block;
  flex: 1 1 auto;
  height: auto;
  overflow-y: auto;
}

/* 尚未選檔 */
.udu-empty {
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding: 16px;
}
.udu-empty-types {
  display: flex;
  align-items: flex-start;
  flex-wrap: wrap;
  gap: 8px 12px;
}
.udu-empty-label {
  padding-top: 5px;
  color: #6e6e73;
  font-size: 12.5px;
  font-weight: 600;
}
.udu-empty-custom { flex: 0 0 220px; }
.udu-drop {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  min-height: 300px;
  padding: 24px 16px;
  border: 1.5px dashed rgba(0, 0, 0, 0.18);
  border-radius: 12px;
  background: #fafafc;
  cursor: pointer;
  text-align: center;
  transition: background-color 0.12s, border-color 0.12s;
}
.udu-drop:hover { background: #f4f6fa; border-color: rgba(0, 113, 227, 0.4); }
.udu-drop:focus-visible { outline: 2px solid rgba(0, 113, 227, 0.4); outline-offset: 2px; }
.udu-drop-icon { color: #8e8e93; }
.udu-drop-title { font-size: 15px; font-weight: 600; }
.udu-drop-actions { display: flex; flex-wrap: wrap; justify-content: center; gap: 8px; }
.udu-drop-hint { color: #8e8e93; font-size: 12px; }

/* 檔案清單 */
.udu-list {
  min-height: 0;
  overflow-y: auto;
  border-right: 1px solid rgba(0, 0, 0, 0.08);
  background: #fff;
}
.udu--mobile .udu-list { border-right: 0; overflow: visible; }
.udu-row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 8px 8px 12px;
  border-bottom: 1px solid #f0f0f3;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
}
.udu-row:hover { background: #f7f7f9; }
.udu-row.is-selected { background: rgba(0, 113, 227, 0.1); }
.udu-row.is-blocked { background: rgba(214, 45, 32, 0.05); }
.udu-row--ghost { opacity: 0.4; }
.udu-row-check { flex-shrink: 0; }
.udu-thumb {
  position: relative;
  display: grid;
  place-items: center;
  flex-shrink: 0;
  width: 52px;
  height: 52px;
  border-radius: 7px;
  background: #f2f2f5;
  box-shadow: inset 0 0 0 0.5px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}
.udu-thumb img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  background: #fff;
}
.udu-thumb-cover {
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  background: rgba(255, 255, 255, 0.65);
}
.udu-thumb-cover--dark { background: rgba(0, 0, 0, 0.42); }
.udu-thumb-badge {
  position: absolute;
  right: 3px;
  bottom: 3px;
  display: grid;
  place-items: center;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  color: #fff;
  box-shadow: 0 0 0 1.5px #fff;
}
.udu-thumb-badge .v-icon { color: #fff; }
.udu-thumb-badge--ok { background: #34c759; }
.udu-thumb-badge--err { background: #d62d20; }
.udu-row-main {
  flex: 1 1 auto;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.udu-row-name {
  font-size: 13px;
  font-weight: 500;
  line-height: 1.35;
  overflow-wrap: anywhere;
}
.udu-row.is-done .udu-row-name { color: #3a3a3c; }
.udu-ext { color: #8e8e93; font-weight: 400; }
.udu-row-meta {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 4px 8px;
  color: #6e6e73;
  font-size: 12px;
}
.udu-row-meta .mac-tag { min-height: 18px; padding: 0 6px; font-size: 11.5px; }
.udu-state { font-weight: 600; }
.udu-state--err { color: #d62d20; }
.udu-state--ok { color: #1f7a36; }
.udu-state--run { color: #0058b0; }
.udu-state--muted { color: #8e8e93; font-weight: 500; }
.udu-row-side {
  display: flex;
  align-items: center;
  flex-shrink: 0;
}
.udu-drag {
  display: grid;
  place-items: center;
  width: 22px;
  height: 30px;
  color: #aeaeb2;
  cursor: grab;
  touch-action: none;
}
.udu-drag .v-icon { color: inherit; }

/* 右側預覽 */
.udu-detail {
  display: flex;
  flex-direction: column;
  min-width: 0;
  min-height: 0;
}
.udu-detail-bar {
  display: flex;
  align-items: center;
  gap: 4px;
  height: 36px;
  padding: 0 10px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
  background: #fafafc;
}
.udu-counter {
  min-width: 48px;
  color: #6e6e73;
  font-size: 12.5px;
  font-variant-numeric: tabular-nums;
  text-align: center;
}
.udu-stage { flex: 1 1 auto; min-height: 0; }
.udu-editor {
  flex-shrink: 0;
  padding: 12px 16px 14px;
  border-top: 1px solid rgba(0, 0, 0, 0.08);
  background: #fff;
}

/* 底部 */
.udu-foot { flex-shrink: 0; }
.udu-summary {
  color: #6e6e73;
  font-size: 12.5px;
  font-variant-numeric: tabular-nums;
}
.udu--mobile .udu-foot {
  padding-bottom: calc(10px + env(safe-area-inset-bottom));
}
.udu--mobile .udu-summary { flex-basis: 100%; }
.udu--mobile .udu-foot .mac-btn { flex: 1 1 0; }
.udu--mobile .udu-foot .mac-spacer { display: none; }

/* 全螢幕預覽 */
.udu-ql {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: #fff;
  font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", "Helvetica Neue", "PingFang TC", "Noto Sans TC", sans-serif;
  color: #1d1d1f;
}
.udu-ql-head {
  display: flex;
  align-items: center;
  gap: 4px;
  min-height: 48px;
  padding: 4px 10px 4px 58px; /* 避開全站左上角固定漢堡鈕 */
  background: #f6f6f8;
  border-bottom: 1px solid rgba(0, 0, 0, 0.08);
}
.udu-ql-title {
  flex: 1 1 auto;
  min-width: 0;
  margin-left: 6px;
  font-size: 14px;
  font-weight: 600;
  overflow-wrap: anywhere;
}
.udu-ql-head .mac-sheet-close { margin-left: 0; }
.udu-ql-stage-wrap {
  position: relative;
  display: flex;
  flex: 1 1 auto;
  min-height: 0;
}
.udu-ql-stage { flex: 1 1 auto; min-height: 0; }
.udu-ql-foot {
  flex-shrink: 0;
  max-height: 45vh;
  overflow-y: auto;
  padding: 12px 16px calc(12px + env(safe-area-inset-bottom));
  border-top: 1px solid rgba(0, 0, 0, 0.08);
}
.udu-ql-foot > * { max-width: 760px; margin: 0 auto; }

.udu-confirm-title {
  padding: 8px 0;
  font-size: 14px;
  font-weight: 600;
  text-align: center;
}

@media (max-width: 600px) {
  .udu-toolbar { padding: 8px 12px; }
  .udu-row { padding: 10px 6px 10px 12px; }
  .udu-thumb { width: 56px; height: 56px; }
  .udu-row-name { font-size: 14px; }
  .udu-empty { padding: 12px; }
  .udu-drop { min-height: 240px; }
  .udu-empty-custom { flex-basis: 100%; }
}
</style>
