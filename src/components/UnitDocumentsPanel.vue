<template>
  <div
    v-file-drop="canUpload ? { onFiles: openUploadWithFiles } : false"
    class="udp"
  >
    <div class="udp-bar">
      <div class="udp-title">
        <span class="udp-title-main">已上傳文件</span>
        <span class="udp-count">{{ documents.length }} 份</span>
      </div>
      <div class="udp-actions">
        <a
          v-if="driveFolderUrl"
          class="mac-btn mac-btn--sm"
          :href="driveFolderUrl"
          target="_blank"
          rel="noopener"
          title="開啟戶別資料夾"
        >
          <v-icon size="15">mdi-folder-google-drive</v-icon><span class="mac-hide-xs">開啟資料夾</span>
        </a>
        <button type="button" class="mac-btn mac-btn--sm mac-btn--primary" :disabled="!canUpload" @click="openUpload">
          <v-icon size="15">mdi-cloud-upload-outline</v-icon>上傳文件
        </button>
      </div>
    </div>

    <div v-if="!driveFolderUrl" class="mac-callout mac-callout--warning udp-callout">
      <v-icon size="16">mdi-alert-circle-outline</v-icon>
      <span>請先在「修改銷控」設定戶別資料夾位置</span>
    </div>

    <div v-if="typeFilters.length > 1" class="udp-filter">
      <div class="mac-form-seg">
        <button type="button" class="mac-form-seg-btn" :class="{ 'is-active': filter === '' }" @click="filter = ''">
          全部 <span class="udp-seg-n">{{ documents.length }}</span>
        </button>
        <button
          v-for="f in typeFilters"
          :key="f.label"
          type="button"
          class="mac-form-seg-btn"
          :class="{ 'is-active': filter === f.label }"
          @click="filter = f.label"
        >
          {{ f.label }} <span class="udp-seg-n">{{ f.count }}</span>
        </button>
      </div>
    </div>

    <div v-if="documents.length === 0" class="udp-empty">尚無文件</div>

    <div v-else class="mac-form-group udp-list">
      <div v-for="d in filteredDocuments" :key="d.id" class="udp-row">
        <div class="udp-icon">
          <v-icon :color="fileIcon(d).color" size="28">{{ fileIcon(d).icon }}</v-icon>
        </div>
        <div class="udp-main">
          <a
            v-if="d.webViewLink"
            :href="d.webViewLink"
            target="_blank"
            rel="noopener"
            class="udp-name udp-name--link"
            :title="d.originalName || ''"
          >{{ d.fileName }}<v-icon size="12" class="udp-open">mdi-open-in-new</v-icon></a>
          <span v-else class="udp-name">{{ d.fileName }}</span>
          <div class="udp-meta">
            <span class="mac-tag" :class="`udt--${typeMeta(d.docType).tone}`">{{ docLabel(d) }}</span>
            <span>{{ formatFileSize(d.size) }}</span>
            <span>{{ d.uploadedBy?.name || '—' }}・{{ formatTaipeiDateTime(d.uploadedAt) }}</span>
          </div>
        </div>
        <div class="udp-side">
          <button
            v-if="renameHandler"
            type="button"
            class="mac-icon-btn"
            title="編輯種類／名稱"
            :disabled="busyId === d.id"
            @click.stop="openEdit(d)"
          >
            <v-icon size="17">mdi-pencil-outline</v-icon>
          </button>
          <button
            v-if="deleteHandler"
            type="button"
            class="mac-icon-btn mac-icon-btn--danger"
            title="刪除"
            :disabled="busyId === d.id"
            @click.stop="openDelete(d)"
          >
            <v-progress-circular v-if="busyId === d.id" indeterminate size="14" width="2" />
            <v-icon v-else size="17">mdi-trash-can-outline</v-icon>
          </button>
        </div>
      </div>
    </div>

    <!-- 上傳視窗 -->
    <UnitDocumentUploadSheet
      ref="sheetRef"
      v-model="uploadOpen"
      :project-id="projectId"
      :unit-id="unitId"
      :existing-documents="documents"
      :upload-handler="uploadHandler"
    />

    <!-- 編輯 -->
    <v-dialog v-model="edit.open" max-width="520" persistent content-class="mac-dialog-fit">
      <v-card class="mac-sheet">
        <div class="mac-sheet-head">
          <v-icon size="18">mdi-pencil-outline</v-icon>
          <span>編輯文件</span>
          <button type="button" class="mac-sheet-close" title="關閉" :disabled="edit.saving" @click="edit.open = false">
            <v-icon size="18">mdi-close</v-icon>
          </button>
        </div>
        <div class="mac-sheet-section udp-edit">
          <label class="udp-label" for="udp-edit-name">名稱</label>
          <v-text-field
            id="udp-edit-name"
            v-model="edit.baseName"
            variant="solo"
            flat
            density="compact"
            hide-details
            class="mac-vfield"
            :suffix="edit.ext ? `.${edit.ext}` : ''"
            :error="!sanitizeFileNameSegment(edit.baseName)"
            @keydown.enter.prevent="saveEdit"
          />
          <span class="udp-label">種類</span>
          <div>
            <div class="udt-pills">
              <button
                v-for="t in UNIT_DOCUMENT_TYPES"
                :key="t.key"
                type="button"
                class="udt-pill"
                :class="[`udt--${t.tone}`, { 'is-active': edit.docType === t.key }]"
                @click="onEditTypeChange(t.key)"
              >
                {{ t.label }}
              </button>
            </div>
            <v-text-field
              v-if="isCustomType(edit.docType)"
              v-model="edit.customLabel"
              placeholder="自訂種類"
              variant="solo"
              flat
              density="compact"
              hide-details
              class="mac-vfield udp-edit-custom"
              :maxlength="UNIT_DOCUMENT_CUSTOM_LABEL_MAX"
              :error="!sanitizeFileNameSegment(edit.customLabel, UNIT_DOCUMENT_CUSTOM_LABEL_MAX)"
            />
          </div>
        </div>
        <div class="mac-sheet-foot">
          <span class="mac-spacer"></span>
          <button type="button" class="mac-btn" :disabled="edit.saving" @click="edit.open = false">取消</button>
          <button type="button" class="mac-btn mac-btn--primary" :disabled="!canSaveEdit || edit.saving" @click="saveEdit">
            <v-progress-circular v-if="edit.saving" indeterminate size="14" width="2" color="white" />儲存
          </button>
        </div>
      </v-card>
    </v-dialog>

    <!-- 刪除 -->
    <v-dialog v-model="del.open" max-width="420" persistent content-class="mac-dialog-fit">
      <v-card class="mac-sheet">
        <div class="mac-sheet-head">
          <v-icon size="18">mdi-trash-can-outline</v-icon>
          <span>刪除文件</span>
          <button type="button" class="mac-sheet-close" title="關閉" :disabled="del.deleting" @click="del.open = false">
            <v-icon size="18">mdi-close</v-icon>
          </button>
        </div>
        <div class="mac-sheet-section udp-del">
          <div class="udp-del-name">{{ del.doc?.fileName }}</div>
          <label class="udp-del-check">
            <input v-model="del.trashDriveFile" type="checkbox" class="mac-check udp-check-danger" />
            Drive 檔案也移至垃圾桶
          </label>
        </div>
        <div class="mac-sheet-foot">
          <span class="mac-spacer"></span>
          <button type="button" class="mac-btn" :disabled="del.deleting" @click="del.open = false">取消</button>
          <button type="button" class="mac-btn mac-btn--danger-fill" :disabled="del.deleting" @click="confirmDelete">
            <v-progress-circular v-if="del.deleting" indeterminate size="14" width="2" color="white" />刪除
          </button>
        </div>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, watch, nextTick } from 'vue';
import '@/styles/unitDocuments.css';
import UnitDocumentUploadSheet from './unitDocuments/UnitDocumentUploadSheet.vue';
import {
  UNIT_DOCUMENT_TYPES,
  UNIT_DOCUMENT_CUSTOM_LABEL_MAX,
  getDocTypeMeta,
  sanitizeFileNameSegment,
  getFileExtension,
  resolveDocTypeLabel,
  formatFileSize,
  fileIconForDocument,
  formatTaipeiDateTime,
  sortUnitDocuments,
} from '@/utils/unitDocuments';

const props = defineProps({
  modelValue: { type: Array, default: () => [] },
  projectId: { type: String, required: true },
  unitId: { type: String, default: '' },
  driveFolderUrl: { type: String, default: '' },
  // async ({ storagePath, fileName, docType, docTypeLabel, originalName, mimeType, size }) => record
  uploadHandler: { type: Function, default: null },
  // async ({ docId, fileName, docType, docTypeLabel }) => record
  renameHandler: { type: Function, default: null },
  // async ({ docId, trashDriveFile }) => void
  deleteHandler: { type: Function, default: null },
  autoOpenUpload: { type: Boolean, default: false },
});

const sheetRef = ref(null);
const uploadOpen = ref(false);
const busyId = ref('');
const filter = ref('');

const documents = computed(() => sortUnitDocuments(props.modelValue));
const canUpload = computed(() => !!props.driveFolderUrl && !!props.uploadHandler);

function typeMeta(key) { return getDocTypeMeta(key); }
function isCustomType(key) { return !!getDocTypeMeta(key).custom; }
function fileIcon(d) { return fileIconForDocument(d?.mimeType, d?.fileName); }
function docLabel(d) { return d.docTypeLabel || typeMeta(d.docType).label; }

// 種類篩選：只列出有文件的種類（預設種類依固定順序，自訂種類排在後面）
const typeFilters = computed(() => {
  const counts = new Map();
  for (const d of documents.value) {
    const label = docLabel(d);
    counts.set(label, (counts.get(label) || 0) + 1);
  }
  const order = UNIT_DOCUMENT_TYPES.filter(t => !t.custom).map(t => t.label);
  return [...counts.entries()]
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => {
      const ia = order.indexOf(a.label);
      const ib = order.indexOf(b.label);
      return (ia < 0 ? 99 : ia) - (ib < 0 ? 99 : ib);
    });
});
const filteredDocuments = computed(() =>
  filter.value ? documents.value.filter(d => docLabel(d) === filter.value) : documents.value
);
watch(typeFilters, (list) => {
  if (filter.value && !list.some(f => f.label === filter.value)) filter.value = '';
});

// ───────── 上傳 ─────────
function openUpload() {
  if (!canUpload.value) return;
  uploadOpen.value = true;
}

function openUploadWithFiles(files) {
  if (!canUpload.value) return;
  if (!uploadOpen.value) uploadOpen.value = true;
  nextTick(() => sheetRef.value?.addFiles(files));
}

// ───────── 編輯 ─────────
const edit = reactive({ open: false, saving: false, doc: null, docType: 'contract', customLabel: '', baseName: '', ext: '' });
const canSaveEdit = computed(() => {
  if (!sanitizeFileNameSegment(edit.baseName)) return false;
  if (isCustomType(edit.docType) && !sanitizeFileNameSegment(edit.customLabel, UNIT_DOCUMENT_CUSTOM_LABEL_MAX)) return false;
  return true;
});

function openEdit(d) {
  const ext = getFileExtension(d.fileName);
  edit.doc = d;
  edit.docType = getDocTypeMeta(d.docType).key;
  edit.customLabel = isCustomType(d.docType) ? (d.docTypeLabel || '') : '';
  edit.ext = ext;
  edit.baseName = ext ? String(d.fileName || '').slice(0, -(ext.length + 1)) : String(d.fileName || '');
  edit.saving = false;
  edit.open = true;
}

function onEditTypeChange(key) {
  edit.docType = key;
  if (!isCustomType(key)) edit.customLabel = '';
}

async function saveEdit() {
  if (!canSaveEdit.value || !props.renameHandler || !edit.doc || edit.saving) return;
  edit.saving = true;
  busyId.value = edit.doc.id;
  try {
    await props.renameHandler({
      docId: edit.doc.id,
      fileName: sanitizeFileNameSegment(edit.baseName),
      docType: edit.docType,
      docTypeLabel: resolveDocTypeLabel(edit.docType, edit.customLabel),
    });
    edit.open = false;
  } catch (err) {
    console.error('[UnitDocumentsPanel] 編輯失敗:', err);
  } finally {
    edit.saving = false;
    busyId.value = '';
  }
}

// ───────── 刪除 ─────────
const del = reactive({ open: false, deleting: false, doc: null, trashDriveFile: false });

function openDelete(d) {
  del.doc = d;
  del.trashDriveFile = false;
  del.deleting = false;
  del.open = true;
}

async function confirmDelete() {
  if (!props.deleteHandler || !del.doc) return;
  del.deleting = true;
  busyId.value = del.doc.id;
  try {
    await props.deleteHandler({ docId: del.doc.id, trashDriveFile: !!del.trashDriveFile });
    del.open = false;
  } catch (err) {
    console.error('[UnitDocumentsPanel] 刪除失敗:', err);
  } finally {
    del.deleting = false;
    busyId.value = '';
  }
}

// 快速選單進入：自動打開上傳視窗
watch(() => props.autoOpenUpload, (v) => { if (v) nextTick(openUpload); }, { immediate: true });

defineExpose({ openUpload });
</script>

<style scoped>
.udp {
  color: #1d1d1f;
  font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", "Helvetica Neue", "PingFang TC", "Noto Sans TC", sans-serif;
  font-size: 13px;
  border-radius: 10px;
}
.udp-bar {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
  padding: 4px 2px 10px;
}
.udp-title {
  display: flex;
  align-items: baseline;
  gap: 8px;
  margin-right: auto;
}
.udp-title-main { font-size: 15px; font-weight: 700; }
.udp-count { color: #6e6e73; font-size: 12.5px; }
.udp-actions { display: flex; align-items: center; gap: 6px; }
.udp-callout { margin-bottom: 10px; }
.udp-filter {
  max-width: 100%;
  overflow-x: auto;
  margin-bottom: 10px;
  -webkit-overflow-scrolling: touch;
}
.udp-seg-n {
  margin-left: 2px;
  color: #8e8e93;
  font-weight: 500;
  font-variant-numeric: tabular-nums;
}
.udp-empty {
  padding: 28px 16px;
  border: 1.5px dashed rgba(0, 0, 0, 0.12);
  border-radius: 10px;
  color: #8e8e93;
  text-align: center;
}
.udp-row {
  display: flex;
  align-items: center;
  gap: 10px;
  min-height: 56px;
  padding: 8px 8px 8px 12px;
}
.udp-row + .udp-row { border-top: 1px solid #ececf0; }
.udp-icon {
  display: grid;
  place-items: center;
  flex-shrink: 0;
  width: 32px;
}
.udp-main {
  flex: 1 1 auto;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.udp-name {
  font-size: 13.5px;
  font-weight: 500;
  line-height: 1.35;
  overflow-wrap: anywhere;
  color: #1d1d1f;
}
.udp-name--link { color: #0058b0; text-decoration: none; }
.udp-name--link:hover { text-decoration: underline; }
.udp-open { margin-left: 3px; vertical-align: -1px; }
.udp-meta {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 4px 10px;
  color: #6e6e73;
  font-size: 12px;
}
.udp-meta .mac-tag { min-height: 18px; padding: 0 6px; font-size: 11.5px; }
.udp-side {
  display: flex;
  align-items: center;
  gap: 2px;
  flex-shrink: 0;
}

.udp-edit {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  align-items: center;
  gap: 12px 12px;
  padding: 16px;
}
.udp-label {
  color: #6e6e73;
  font-size: 12.5px;
  font-weight: 600;
}
.udp-edit-custom { margin-top: 8px; max-width: 260px; }
.udp-del { padding: 16px; }
.udp-del-name {
  margin-bottom: 12px;
  font-size: 14px;
  font-weight: 600;
  overflow-wrap: anywhere;
}
.udp-del-check {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
}
.udp-check-danger { --mac-check-color: #d62d20; }

@media (max-width: 600px) {
  .udp-edit { grid-template-columns: minmax(0, 1fr); gap: 6px; }
  .udp-edit .udp-label:not(:first-child) { margin-top: 8px; }
  .udp-edit-custom { max-width: none; }
}
</style>
