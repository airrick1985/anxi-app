<template>
  <div ref="rootEl" class="unit-documents-panel">
    <v-expansion-panels v-model="expanded" flat variant="accordion">
      <v-expansion-panel elevation="0">
        <v-expansion-panel-title class="ud-title">
          <div class="d-flex align-center flex-wrap" style="gap: 6px;">
            <v-icon size="small" color="indigo">mdi-file-upload-outline</v-icon>
            <span class="font-weight-medium">已上傳文件</span>
            <v-chip size="small" class="ud-title-chip" :color="documents.length > 0 ? 'primary' : 'grey'" variant="tonal">
              {{ documents.length }} 份
            </v-chip>
          </div>
        </v-expansion-panel-title>

        <v-expansion-panel-text>
          <div class="d-flex align-center flex-wrap mb-2" style="gap: 8px;">
            <div v-if="!driveFolderUrl" class="text-caption text-orange-darken-2 d-flex align-center">
              <v-icon size="small" class="mr-1">mdi-alert-circle-outline</v-icon>
              請先於修改銷控設定此戶別的「戶別資料夾位置」，才能上傳文件
            </div>
            <v-spacer></v-spacer>
            <v-btn
              v-if="driveFolderUrl"
              size="small"
              variant="text"
              color="primary"
              prepend-icon="mdi-folder-google-drive"
              :href="driveFolderUrl"
              target="_blank"
              rel="noopener"
            >
              開啟資料夾
            </v-btn>
            <v-btn
              size="small"
              color="primary"
              variant="tonal"
              prepend-icon="mdi-cloud-upload-outline"
              :disabled="!driveFolderUrl"
              @click="openUpload"
            >
              上傳文件
            </v-btn>
          </div>

          <div v-if="documents.length === 0" class="text-caption text-grey text-center py-3">
            尚無上傳文件
          </div>

          <div v-else class="ud-list">
            <div class="ud-row ud-header">
              <div class="ud-col-icon"></div>
              <div class="ud-col-name">文件名稱</div>
              <div class="ud-meta">
                <div class="ud-col-type">種類</div>
                <div class="ud-col-size">大小</div>
                <div class="ud-col-by">上傳</div>
              </div>
              <div class="ud-col-actions">操作</div>
            </div>
            <div v-for="d in documents" :key="d.id" class="ud-row">
              <div class="ud-col-icon">
                <v-icon :color="fileIcon(d).color" size="26">{{ fileIcon(d).icon }}</v-icon>
              </div>
              <div class="ud-col-name">
                <a v-if="d.webViewLink" :href="d.webViewLink" target="_blank" rel="noopener" class="ud-link" :title="d.originalName || ''">
                  {{ d.fileName }}
                  <v-icon size="12" class="ml-1">mdi-open-in-new</v-icon>
                </a>
                <span v-else>{{ d.fileName }}</span>
              </div>
              <!-- 電腦版 display:contents 拆成三欄；手機版整塊落在 meta 區 -->
              <div class="ud-meta">
                <div class="ud-col-type">
                  <v-chip size="x-small" :color="typeMeta(d.docType).color" variant="tonal" label>
                    {{ d.docTypeLabel || typeMeta(d.docType).label }}
                  </v-chip>
                </div>
                <div class="ud-col-size">{{ formatFileSize(d.size) }}</div>
                <div class="ud-col-by">
                  <span>{{ d.uploadedBy?.name || '—' }}</span>
                  <span class="text-grey ml-1">{{ formatTaipeiDateTime(d.uploadedAt) }}</span>
                </div>
              </div>
              <div class="ud-col-actions">
                <v-btn
                  v-if="renameHandler"
                  icon size="x-small" variant="text" color="primary" title="編輯種類／名稱"
                  :disabled="busyId === d.id"
                  @click.stop="openEdit(d)"
                >
                  <v-icon size="small">mdi-pencil</v-icon>
                </v-btn>
                <v-btn
                  v-if="deleteHandler"
                  icon size="x-small" variant="text" color="error" title="刪除"
                  :loading="busyId === d.id"
                  @click.stop="openDelete(d)"
                >
                  <v-icon size="small">mdi-delete</v-icon>
                </v-btn>
              </div>
            </div>
          </div>
        </v-expansion-panel-text>
      </v-expansion-panel>
    </v-expansion-panels>

    <!-- ── 上傳對話框 ── -->
    <v-dialog
      v-model="upload.open"
      :fullscreen="isMobile"
      :max-width="isMobile ? undefined : 720"
      :persistent="upload.running"
      scrollable
    >
      <v-card>
        <v-card-title class="d-flex align-center">
          <v-icon color="primary" class="mr-2">mdi-cloud-upload-outline</v-icon>
          <span>{{ unitId }} 上傳文件</span>
          <v-spacer></v-spacer>
          <v-btn icon variant="text" :disabled="upload.running" @click="closeUpload">
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </v-card-title>
        <v-divider></v-divider>

        <v-card-text class="pt-4">
          <div v-if="upload.running" class="text-caption text-orange-darken-2 mb-3 d-flex align-center">
            <v-progress-circular indeterminate size="14" width="2" class="mr-2"></v-progress-circular>
            上傳中，請勿關閉視窗
          </div>

          <!-- 1. 批次預設種類 -->
          <div class="text-subtitle-2 font-weight-medium mb-1">文件種類</div>
          <v-chip-group
            v-model="upload.batchType"
            mandatory
            selected-class="text-primary"
            :disabled="upload.running"
            @update:model-value="onBatchTypeChange"
          >
            <v-chip v-for="t in UNIT_DOCUMENT_TYPES" :key="t.key" :value="t.key" filter variant="outlined" size="small">
              <v-icon start size="small">{{ t.icon }}</v-icon>{{ t.label }}
            </v-chip>
          </v-chip-group>
          <v-text-field
            v-if="isCustomType(upload.batchType)"
            v-model="upload.batchCustomLabel"
            label="自訂種類名稱 *"
            variant="outlined"
            density="compact"
            :maxlength="UNIT_DOCUMENT_CUSTOM_LABEL_MAX"
            counter
            hide-details="auto"
            class="mb-2"
            :disabled="upload.running"
            @update:model-value="onBatchCustomLabelChange"
          />

          <!-- 2. 選擇檔案 -->
          <div class="d-flex align-center flex-wrap mt-3 mb-2" style="gap: 8px;">
            <v-btn
              color="primary"
              variant="outlined"
              prepend-icon="mdi-paperclip"
              :disabled="upload.running || upload.done || upload.items.length >= UNIT_DOCUMENT_MAX_BATCH"
              @click="fileInputRef?.click()"
            >
              選擇檔案
            </v-btn>
            <span class="text-caption text-grey">
              任何格式，單檔 ≤ {{ formatFileSize(UNIT_DOCUMENT_MAX_SIZE) }}，單批最多 {{ UNIT_DOCUMENT_MAX_BATCH }} 檔
            </span>
            <input ref="fileInputRef" type="file" multiple style="display: none" @change="onFilesSelected" />
          </div>

          <div v-if="upload.items.length === 0" class="text-caption text-grey text-center py-4 ud-dropzone">
            尚未選擇檔案
          </div>

          <!-- 3. 每檔一列 -->
          <div v-for="it in upload.items" :key="it.key" class="ud-item mb-3" :class="{ 'ud-item--blocked': it.blocked }">
            <div class="d-flex align-center mb-1" style="gap: 6px;">
              <v-icon :color="fileIcon({ mimeType: it.file.type, fileName: it.file.name }).color" size="22">
                {{ fileIcon({ mimeType: it.file.type, fileName: it.file.name }).icon }}
              </v-icon>
              <span class="text-caption text-truncate" style="max-width: 60%;" :title="it.file.name">{{ it.file.name }}</span>
              <span class="text-caption text-grey">{{ formatFileSize(it.file.size) }}</span>
              <v-spacer></v-spacer>
              <v-chip v-if="it.blocked" size="x-small" color="error" variant="tonal">{{ it.blocked }}</v-chip>
              <v-chip v-else-if="it.status === 'pending'" size="x-small" color="grey" variant="tonal">等待</v-chip>
              <v-chip v-else-if="it.status === 'uploading'" size="x-small" color="primary" variant="tonal">上傳中 {{ it.progress }}%</v-chip>
              <v-chip v-else-if="it.status === 'committing'" size="x-small" color="indigo" variant="tonal">轉存 Drive</v-chip>
              <v-chip v-else-if="it.status === 'done'" size="x-small" color="success" variant="tonal">
                <v-icon start size="x-small">mdi-check</v-icon>完成
              </v-chip>
              <v-chip v-else-if="it.status === 'error'" size="x-small" color="error" variant="tonal">失敗</v-chip>
              <v-btn
                v-if="it.status === 'error'"
                icon size="x-small" variant="text" color="primary" title="重試"
                :disabled="upload.running"
                @click="retryItem(it)"
              >
                <v-icon size="small">mdi-refresh</v-icon>
              </v-btn>
              <v-btn
                v-if="it.status === 'pending' || it.status === 'error' || it.blocked"
                icon size="x-small" variant="text" color="error" title="移除"
                :disabled="upload.running"
                @click="removeItem(it)"
              >
                <v-icon size="small">mdi-close</v-icon>
              </v-btn>
            </div>
            <v-progress-linear
              v-if="it.status === 'uploading' || it.status === 'committing'"
              :model-value="it.status === 'committing' ? 100 : it.progress"
              :indeterminate="it.status === 'committing'"
              color="primary"
              height="4"
              rounded
              class="mb-2"
            />
            <div v-if="it.status === 'error' && it.error" class="text-caption text-error mb-1">{{ it.error }}</div>

            <v-row v-if="!it.blocked && it.status !== 'done'" dense>
              <v-col cols="12" sm="4">
                <v-select
                  :model-value="it.docType"
                  :items="typeSelectItems"
                  item-title="label"
                  item-value="key"
                  label="種類"
                  variant="outlined"
                  density="compact"
                  hide-details="auto"
                  :disabled="upload.running"
                  @update:model-value="v => onItemTypeChange(it, v)"
                />
                <v-text-field
                  v-if="isCustomType(it.docType)"
                  :model-value="it.customLabel"
                  label="自訂種類名稱 *"
                  variant="outlined"
                  density="compact"
                  :maxlength="UNIT_DOCUMENT_CUSTOM_LABEL_MAX"
                  hide-details="auto"
                  class="mt-2"
                  :disabled="upload.running"
                  :error="!it.customLabel.trim()"
                  @update:model-value="v => onItemCustomLabelChange(it, v)"
                />
              </v-col>
              <v-col cols="12" sm="8">
                <v-text-field
                  :model-value="it.baseName"
                  label="文件名稱 *"
                  variant="outlined"
                  density="compact"
                  hide-details="auto"
                  :suffix="it.ext ? `.${it.ext}` : ''"
                  :disabled="upload.running"
                  :error="!sanitizeFileNameSegment(it.baseName)"
                  @update:model-value="v => { it.baseName = v; it.nameTouched = true; }"
                />
              </v-col>
            </v-row>
            <div v-else-if="it.status === 'done'" class="text-caption text-grey">
              已存為 <span class="font-weight-medium">{{ it.resultName }}</span>
            </div>
          </div>

          <div v-if="upload.done" class="text-body-2 mt-2">
            上傳完成：成功 {{ doneCount }} 檔<span v-if="errorCount > 0">，失敗 {{ errorCount }} 檔（可按重試）</span>
          </div>
        </v-card-text>

        <v-divider></v-divider>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn variant="text" :disabled="upload.running" @click="closeUpload">
            {{ upload.done ? '完成' : '取消' }}
          </v-btn>
          <v-btn
            v-if="!upload.done || errorCount > 0"
            color="primary"
            variant="flat"
            :loading="upload.running"
            :disabled="!canStartUpload"
            @click="startUpload"
          >
            {{ upload.done ? '重試失敗檔案' : `開始上傳（${uploadableCount}）` }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- ── 編輯對話框 ── -->
    <v-dialog v-model="edit.open" max-width="520" :persistent="edit.saving">
      <v-card>
        <v-card-title class="d-flex align-center">
          <v-icon color="primary" class="mr-2">mdi-pencil</v-icon>
          <span>編輯文件</span>
          <v-spacer></v-spacer>
          <v-btn icon variant="text" :disabled="edit.saving" @click="edit.open = false"><v-icon>mdi-close</v-icon></v-btn>
        </v-card-title>
        <v-divider></v-divider>
        <v-card-text class="pt-4">
          <v-select
            v-model="edit.docType"
            :items="typeSelectItems"
            item-title="label"
            item-value="key"
            label="種類"
            variant="outlined"
            density="compact"
            hide-details="auto"
            class="mb-3"
            @update:model-value="onEditTypeChange"
          />
          <v-text-field
            v-if="isCustomType(edit.docType)"
            v-model="edit.customLabel"
            label="自訂種類名稱 *"
            variant="outlined"
            density="compact"
            :maxlength="UNIT_DOCUMENT_CUSTOM_LABEL_MAX"
            counter
            hide-details="auto"
            class="mb-3"
          />
          <v-text-field
            v-model="edit.baseName"
            label="文件名稱 *"
            variant="outlined"
            density="compact"
            hide-details="auto"
            :suffix="edit.ext ? `.${edit.ext}` : ''"
          />
          <div class="text-caption text-grey mt-2">儲存後會同步更新 Google Drive 上的檔名。</div>
        </v-card-text>
        <v-divider></v-divider>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn variant="text" :disabled="edit.saving" @click="edit.open = false">取消</v-btn>
          <v-btn color="primary" variant="flat" :loading="edit.saving" :disabled="!canSaveEdit" @click="saveEdit">儲存</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- ── 刪除確認 ── -->
    <v-dialog v-model="del.open" max-width="460" :persistent="del.deleting">
      <v-card>
        <v-card-title class="d-flex align-center">
          <v-icon color="error" class="mr-2">mdi-delete-alert-outline</v-icon>
          <span>刪除文件</span>
        </v-card-title>
        <v-card-text>
          <div class="mb-2">確定要刪除「<span class="font-weight-medium">{{ del.doc?.fileName }}</span>」的紀錄嗎？</div>
          <v-checkbox
            v-model="del.trashDriveFile"
            color="error"
            density="compact"
            hide-details
            label="同時將 Google Drive 上的檔案移至垃圾桶"
          />
          <div class="text-caption text-grey mt-1">未勾選時僅移除系統紀錄，Drive 檔案保留於戶別資料夾。</div>
        </v-card-text>
        <v-divider></v-divider>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn variant="text" :disabled="del.deleting" @click="del.open = false">取消</v-btn>
          <v-btn color="error" variant="flat" :loading="del.deleting" @click="confirmDelete">刪除</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, watch, nextTick } from 'vue';
import { useDisplay } from 'vuetify';
import { ref as storageRef, uploadBytesResumable, deleteObject } from 'firebase/storage';
import { storage } from '@/firebase';
import {
  UNIT_DOCUMENT_TYPES,
  UNIT_DOCUMENT_MAX_SIZE,
  UNIT_DOCUMENT_MAX_BATCH,
  UNIT_DOCUMENT_CUSTOM_LABEL_MAX,
  getDocTypeMeta,
  sanitizeFileNameSegment,
  getFileExtension,
  isBlockedExtension,
  buildUnitDocumentBaseName,
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
  defaultExpanded: { type: Boolean, default: false },
  autoOpenUpload: { type: Boolean, default: false },
});

const { smAndDown } = useDisplay();
const isMobile = computed(() => smAndDown.value);

const rootEl = ref(null);
const fileInputRef = ref(null);
const expanded = ref(props.defaultExpanded ? [0] : []);
const busyId = ref('');

const documents = computed(() => sortUnitDocuments(props.modelValue));
const typeSelectItems = UNIT_DOCUMENT_TYPES.map(t => ({ key: t.key, label: t.label }));

function typeMeta(key) { return getDocTypeMeta(key); }
function isCustomType(key) { return !!getDocTypeMeta(key).custom; }
function fileIcon(d) { return fileIconForDocument(d?.mimeType, d?.fileName); }

// ───────────────── 上傳 ─────────────────
const upload = reactive({
  open: false,
  batchType: 'contract',
  batchCustomLabel: '',
  items: [],
  running: false,
  done: false,
});

const uploadableItems = computed(() => upload.items.filter(it => !it.blocked && (it.status === 'pending' || it.status === 'error')));
const uploadableCount = computed(() => uploadableItems.value.length);
const doneCount = computed(() => upload.items.filter(it => it.status === 'done').length);
const errorCount = computed(() => upload.items.filter(it => it.status === 'error').length);
const canStartUpload = computed(() =>
  !upload.running
  && uploadableCount.value > 0
  && uploadableItems.value.every(it => itemValid(it))
);

function itemValid(it) {
  if (!sanitizeFileNameSegment(it.baseName)) return false;
  if (isCustomType(it.docType) && !sanitizeFileNameSegment(it.customLabel, UNIT_DOCUMENT_CUSTOM_LABEL_MAX)) return false;
  return true;
}

function itemTypeLabel(it) {
  return resolveDocTypeLabel(it.docType, it.customLabel);
}

/** 依目前種類重算未被使用者改過的預設名稱；同批同種類第 2 檔起補 -2、-3 */
function assignDefaultNames() {
  const counters = new Map();
  for (const it of upload.items) {
    if (it.blocked || it.status === 'done') continue;
    const label = itemTypeLabel(it) || getDocTypeMeta(it.docType).label;
    const base = buildUnitDocumentBaseName(props.unitId, label);
    const n = (counters.get(base) || 0) + 1;
    counters.set(base, n);
    if (!it.nameTouched) it.baseName = n === 1 ? base : `${base}-${n}`;
  }
}

function openUpload() {
  if (!props.driveFolderUrl) return;
  expanded.value = [0];
  upload.items = [];
  upload.running = false;
  upload.done = false;
  upload.open = true;
  nextTick(() => {
    try { rootEl.value?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); } catch (e) { /* noop */ }
  });
}

function closeUpload() {
  if (upload.running) return;
  upload.open = false;
  upload.items = [];
  upload.done = false;
}

function onBatchTypeChange() {
  for (const it of upload.items) {
    if (it.status === 'pending' && !it.typeTouched) {
      it.docType = upload.batchType;
      it.customLabel = upload.batchCustomLabel;
    }
  }
  assignDefaultNames();
}

function onBatchCustomLabelChange() {
  for (const it of upload.items) {
    if (it.status === 'pending' && !it.typeTouched && isCustomType(it.docType)) it.customLabel = upload.batchCustomLabel;
  }
  assignDefaultNames();
}

function onItemTypeChange(it, v) {
  it.docType = v;
  it.typeTouched = true;
  if (!isCustomType(v)) it.customLabel = '';
  assignDefaultNames();
}

function onItemCustomLabelChange(it, v) {
  it.customLabel = v;
  it.typeTouched = true;
  assignDefaultNames();
}

function onFilesSelected(e) {
  const files = Array.from(e.target?.files || []);
  e.target.value = '';
  if (files.length === 0) return;
  for (const file of files) {
    if (upload.items.length >= UNIT_DOCUMENT_MAX_BATCH) break;
    const ext = getFileExtension(file.name);
    let blocked = '';
    if (isBlockedExtension(ext)) blocked = '不允許的檔案類型';
    else if (file.size > UNIT_DOCUMENT_MAX_SIZE) blocked = `超過 ${formatFileSize(UNIT_DOCUMENT_MAX_SIZE)} 上限`;
    else if (file.size === 0) blocked = '空檔案';
    upload.items.push({
      key: `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      file,
      ext,
      docType: upload.batchType,
      customLabel: upload.batchCustomLabel,
      baseName: '',
      nameTouched: false,
      typeTouched: false,
      status: 'pending',
      progress: 0,
      error: '',
      blocked,
      storagePath: '',
      resultName: '',
    });
  }
  if (upload.done) upload.done = false;
  assignDefaultNames();
}

function removeItem(it) {
  if (upload.running) return;
  upload.items = upload.items.filter(x => x.key !== it.key);
  assignDefaultNames();
}

function retryItem(it) {
  if (upload.running) return;
  it.status = 'pending';
  it.error = '';
  it.progress = 0;
  upload.done = false;
}

async function startUpload() {
  if (!canStartUpload.value || !props.uploadHandler) return;
  upload.running = true;
  upload.done = false;
  const queue = uploadableItems.value.slice();
  const CONCURRENCY = 2;
  const workers = Array.from({ length: Math.min(CONCURRENCY, queue.length) }, async () => {
    while (queue.length > 0) {
      const it = queue.shift();
      await uploadOne(it);
    }
  });
  await Promise.all(workers);
  upload.running = false;
  upload.done = true;
}

function uploadToStorage(it) {
  const uploadId = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const safeName = it.file.name.replace(/[^\w.\-]/g, '_') || 'file';
  const path = `unitDocuments/temp/${props.projectId}/${props.unitId}/${uploadId}/${safeName}`;
  const fileRef = storageRef(storage, path);
  return new Promise((resolve, reject) => {
    const task = uploadBytesResumable(fileRef, it.file, { contentType: it.file.type || 'application/octet-stream' });
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
    storagePath = await uploadToStorage(it);
    it.storagePath = storagePath;
    it.status = 'committing';
    const baseName = sanitizeFileNameSegment(it.baseName);
    const record = await props.uploadHandler({
      storagePath,
      fileName: baseName,
      docType: it.docType,
      docTypeLabel: itemTypeLabel(it),
      originalName: it.file.name,
      mimeType: it.file.type || '',
      size: it.file.size,
    });
    it.resultName = record?.fileName || `${baseName}${it.ext ? `.${it.ext}` : ''}`;
    it.status = 'done';
  } catch (err) {
    console.error('[UnitDocumentsPanel] 上傳失敗:', err);
    it.status = 'error';
    it.error = err?.message || '上傳失敗，請稍後再試';
    // Storage 已上傳但轉存失敗 → 清掉暫存（失敗忽略，另有 lifecycle 兜底）
    if (storagePath) {
      try { await deleteObject(storageRef(storage, storagePath)); } catch (e) { /* noop */ }
    }
  }
}

// ───────────────── 編輯 ─────────────────
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

function onEditTypeChange(v) {
  if (!isCustomType(v)) edit.customLabel = '';
}

async function saveEdit() {
  if (!canSaveEdit.value || !props.renameHandler || !edit.doc) return;
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

// ───────────────── 刪除 ─────────────────
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

// 快速選單進入：自動打開上傳對話框
watch(() => props.autoOpenUpload, (v) => { if (v) nextTick(openUpload); }, { immediate: true });

defineExpose({ openUpload });
</script>

<style scoped>
.unit-documents-panel :deep(.v-expansion-panel) {
  border: 1px solid rgba(0, 0, 0, 0.08);
  border-radius: 8px;
  background: #fafafa;
}
.ud-title {
  min-height: 44px !important;
  padding: 8px 16px;
}
.ud-title-chip {
  height: 22px;
}
.ud-list {
  border: 1px solid rgba(0, 0, 0, 0.08);
  border-radius: 6px;
  overflow: hidden;
  background: #fff;
}
.ud-row {
  display: grid;
  grid-template-columns: 36px minmax(0, 1fr) 100px 80px 150px 72px;
  align-items: center;
  gap: 8px;
  padding: 8px 10px;
  border-top: 1px solid rgba(0, 0, 0, 0.06);
  font-size: 0.875rem;
}
.ud-meta {
  display: contents;
}
.ud-row:first-child {
  border-top: none;
}
.ud-header {
  background: #f3f4f6;
  font-size: 0.75rem;
  color: #666;
  font-weight: 500;
}
.ud-col-icon,
.ud-col-actions {
  display: flex;
  align-items: center;
  justify-content: center;
}
.ud-col-name {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.ud-col-size,
.ud-col-by {
  font-size: 0.75rem;
  color: #555;
  white-space: nowrap;
}
.ud-link {
  color: #1976d2;
  text-decoration: none;
}
.ud-link:hover {
  text-decoration: underline;
}
.ud-item {
  border: 1px solid rgba(0, 0, 0, 0.1);
  border-radius: 8px;
  padding: 10px 12px;
  background: #fff;
}
.ud-item--blocked {
  background: #fff5f5;
  border-color: rgba(244, 67, 54, 0.4);
}
.ud-dropzone {
  border: 1px dashed rgba(0, 0, 0, 0.2);
  border-radius: 8px;
}

/* 手機版：改為卡片式堆疊 */
@media (max-width: 600px) {
  .ud-header {
    display: none;
  }
  .ud-row {
    grid-template-columns: 32px minmax(0, 1fr) auto;
    grid-template-areas:
      'icon name actions'
      'icon meta actions';
    row-gap: 2px;
  }
  .ud-col-icon { grid-area: icon; }
  .ud-col-name { grid-area: name; white-space: normal; word-break: break-all; }
  .ud-col-actions { grid-area: actions; }
  .ud-meta {
    grid-area: meta;
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 6px;
  }
  .ud-col-size::after { content: ' ・'; color: #aaa; }
}
</style>
