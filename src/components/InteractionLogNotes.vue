<template>
  <div v-if="canManage || notes.length > 0" class="iln">
    <!-- 標題列 -->
    <div class="iln-header">
      <v-icon size="small" color="deep-orange-darken-1" class="mr-1">mdi-comment-account-outline</v-icon>
      <span class="iln-title">櫃台備註</span>
      <template v-if="canManage">
        <v-chip size="x-small" variant="tonal" color="deep-orange" class="ml-2" label>
          {{ notes.length }} 則
        </v-chip>
        <v-chip v-if="notes.length > 0" size="x-small" variant="tonal" class="ml-1" label
          :color="visibleCount > 0 ? 'success' : 'grey'">
          <v-icon start size="x-small">{{ visibleCount > 0 ? 'mdi-eye' : 'mdi-eye-off' }}</v-icon>
          {{ visibleCount }} 則銷售可見
        </v-chip>
      </template>
      <v-chip v-else size="x-small" variant="tonal" color="deep-orange" class="ml-2" label>
        {{ notes.length }} 則
      </v-chip>
      <v-spacer></v-spacer>
      <v-btn v-if="canManage" size="small" color="deep-orange-darken-1" variant="tonal"
        prepend-icon="mdi-comment-plus-outline" :disabled="busy" @click="openCreate">
        新增備註
      </v-btn>
    </div>

    <div v-if="canManage && notes.length === 0" class="iln-empty">
      <v-icon size="small" class="mr-1">mdi-comment-outline</v-icon>
      尚無櫃台備註，新增的備註預設<strong class="mx-1">對銷售隱藏</strong>，可隨時切換為銷售可見。
    </div>

    <!-- 備註列表 -->
    <div v-for="note in notes" :key="note.noteId" class="iln-note"
      :class="note.visibleToSales ? 'iln-note--visible' : 'iln-note--hidden'">

      <!-- 可見性狀態列（櫃台可切換；銷售只看到公開標示） -->
      <div class="iln-vis-bar" :class="note.visibleToSales ? 'iln-vis-bar--visible' : 'iln-vis-bar--hidden'">
        <template v-if="canManage">
          <v-icon size="small" class="mr-1">{{ note.visibleToSales ? 'mdi-eye' : 'mdi-eye-off' }}</v-icon>
          <span class="iln-vis-text">
            <template v-if="note.visibleToSales">
              <strong>銷售可見</strong>
              <span class="iln-vis-sub">{{ targetLabel(note) }}看得到這則備註</span>
            </template>
            <template v-else>
              <strong>對銷售隱藏</strong>
              <span class="iln-vis-sub">僅櫃台／管理員看得到，{{ targetLabel(note) }}看不到</span>
            </template>
          </span>
          <v-spacer></v-spacer>
          <v-switch :model-value="note.visibleToSales" inset hide-details density="compact"
            :color="note.visibleToSales ? 'success' : 'warning'" class="iln-vis-switch"
            :loading="togglingNoteId === note.noteId ? 'white' : false"
            :disabled="busy" @update:model-value="toggleVisibility(note)">
            <template v-slot:label>
              <span class="text-caption font-weight-bold">
                {{ note.visibleToSales ? '已開放' : '已隱藏' }}
              </span>
            </template>
          </v-switch>
        </template>
        <template v-else>
          <v-icon size="small" class="mr-1">mdi-eye-check-outline</v-icon>
          <span class="iln-vis-text"><strong>櫃台備註</strong><span class="iln-vis-sub">櫃台已開放給您查看</span></span>
        </template>
      </div>

      <div class="iln-body">
        <!-- 抬頭：作者 → 對象 · 時間 -->
        <div class="d-flex align-center flex-wrap ga-1">
          <div class="iln-avatar">{{ (note.authorName || '?').charAt(0) }}</div>
          <span class="iln-author">
            <span class="text-grey-darken-1 font-weight-regular">櫃台</span> {{ note.authorName || '未知' }}
          </span>
          <v-icon size="x-small" color="grey">mdi-arrow-right-thin</v-icon>
          <v-chip size="x-small" variant="tonal" color="indigo" label>
            <v-icon start size="x-small">mdi-account-tie</v-icon>
            備註對象：{{ note.targetRecorderName || log.recorderName || '記錄人' }}
          </v-chip>
          <v-spacer></v-spacer>
          <span class="iln-time">
            <v-icon size="x-small" class="mr-1">mdi-clock-outline</v-icon>{{ formatTime(note.createdAt) }}
          </span>
          <v-tooltip v-if="note.updatedAt" location="top">
            <template v-slot:activator="{ props: tipProps }">
              <span v-bind="tipProps" class="iln-time iln-time--edited">
                (已編輯 {{ formatTime(note.updatedAt) }})
              </span>
            </template>
            由 {{ note.updatedBy || note.authorName || '—' }} 編輯
          </v-tooltip>
          <v-menu v-if="canManage" location="bottom end">
            <template v-slot:activator="{ props: menuProps }">
              <v-btn icon size="x-small" variant="text" density="comfortable" v-bind="menuProps" :disabled="busy">
                <v-icon size="small">mdi-dots-horizontal</v-icon>
              </v-btn>
            </template>
            <v-list density="compact">
              <v-list-item @click="openEdit(note)">
                <template v-slot:prepend><v-icon size="small">mdi-pencil-outline</v-icon></template>
                <v-list-item-title>編輯備註／附件</v-list-item-title>
              </v-list-item>
              <v-list-item @click="toggleVisibility(note)">
                <template v-slot:prepend>
                  <v-icon size="small">{{ note.visibleToSales ? 'mdi-eye-off-outline' : 'mdi-eye-outline' }}</v-icon>
                </template>
                <v-list-item-title>{{ note.visibleToSales ? '改為對銷售隱藏' : '改為銷售可見' }}</v-list-item-title>
              </v-list-item>
              <v-list-item @click="askDelete(note)">
                <template v-slot:prepend><v-icon size="small" color="error">mdi-delete-outline</v-icon></template>
                <v-list-item-title class="text-error">刪除備註</v-list-item-title>
              </v-list-item>
            </v-list>
          </v-menu>
        </div>

        <!-- 內容 -->
        <div v-if="note.content" class="iln-content">{{ note.content }}</div>

        <!-- 附件 -->
        <div v-if="(note.attachments || []).length > 0" class="iln-attachments">
          <template v-for="att in note.attachments" :key="att.path || att.url">
            <div v-if="isImage(att)" class="iln-thumb" @click="openPreview(att)">
              <v-img :src="att.url" width="72" height="72" cover class="rounded"></v-img>
            </div>
            <a v-else :href="att.url" target="_blank" rel="noopener" class="iln-file">
              <v-icon size="small" :color="fileMeta(att).color" class="mr-1">{{ fileMeta(att).icon }}</v-icon>
              <span class="iln-file-name">{{ att.name || '附件' }}</span>
              <span v-if="att.size" class="iln-file-size">{{ formatSize(att.size) }}</span>
              <v-icon size="x-small" class="ml-1">mdi-open-in-new</v-icon>
            </a>
          </template>
        </div>

        <div v-if="canManage && note.visibilityUpdatedAt && note.visibilityUpdatedBy" class="iln-vis-log">
          可見性最後由 {{ note.visibilityUpdatedBy }} 於 {{ formatTime(note.visibilityUpdatedAt) }} 設定
        </div>
      </div>
    </div>

    <!-- 新增／編輯對話框 -->
    <v-dialog v-model="editor.show" max-width="640" persistent scrollable :fullscreen="$vuetify.display.smAndDown">
      <v-card>
        <v-card-title class="bg-deep-orange-darken-1 text-white d-flex align-center">
          <v-icon start>{{ editor.noteId ? 'mdi-comment-edit-outline' : 'mdi-comment-plus-outline' }}</v-icon>
          {{ editor.noteId ? '編輯櫃台備註' : '新增櫃台備註' }}
        </v-card-title>
        <v-card-subtitle class="pt-3 pb-0">
          針對 {{ log.date }} 由 <strong>{{ log.recorderName || '—' }}</strong> 記錄的洽談紀錄
        </v-card-subtitle>

        <v-card-text class="pt-4">
          <v-textarea v-model="editor.content" label="備註內容" variant="outlined" rows="4" auto-grow
            placeholder="輸入給這筆洽談紀錄的櫃台備註…" hide-details="auto"></v-textarea>

          <!-- 可見性選擇（醒目的雙卡片） -->
          <div class="text-caption text-grey-darken-1 font-weight-bold mt-4 mb-1">
            <v-icon size="x-small" class="mr-1">mdi-shield-account-outline</v-icon>誰看得到這則備註？
          </div>
          <div class="iln-vis-options">
            <div class="iln-vis-option" :class="{ 'iln-vis-option--active-hidden': !editor.visibleToSales }"
              role="button" tabindex="0" @click="editor.visibleToSales = false"
              @keydown.enter.prevent="editor.visibleToSales = false">
              <v-icon :color="!editor.visibleToSales ? 'warning' : 'grey'">mdi-eye-off</v-icon>
              <div class="iln-vis-option-text">
                <div class="font-weight-bold">對銷售隱藏</div>
                <div class="text-caption text-grey-darken-1">僅櫃台／管理員可見，{{ editorTargetLabel }}看不到</div>
              </div>
              <v-icon v-if="!editor.visibleToSales" color="warning" size="small" class="iln-vis-check">mdi-check-circle</v-icon>
            </div>
            <div class="iln-vis-option" :class="{ 'iln-vis-option--active-visible': editor.visibleToSales }"
              role="button" tabindex="0" @click="editor.visibleToSales = true"
              @keydown.enter.prevent="editor.visibleToSales = true">
              <v-icon :color="editor.visibleToSales ? 'success' : 'grey'">mdi-eye</v-icon>
              <div class="iln-vis-option-text">
                <div class="font-weight-bold">銷售可見</div>
                <div class="text-caption text-grey-darken-1">{{ editorTargetLabel }}開啟此客戶時會看到備註與附件</div>
              </div>
              <v-icon v-if="editor.visibleToSales" color="success" size="small" class="iln-vis-check">mdi-check-circle</v-icon>
            </div>
          </div>

          <!-- 附件 -->
          <div class="d-flex align-center mt-4 mb-1">
            <span class="text-caption text-grey-darken-1 font-weight-bold">
              <v-icon size="x-small" class="mr-1">mdi-paperclip</v-icon>附件
              <span class="font-weight-regular">（{{ editorAttachmentCount }}/{{ MAX_ATTACHMENTS }}，單檔 {{ MAX_FILE_MB }}MB 內）</span>
            </span>
            <v-spacer></v-spacer>
            <v-btn size="small" variant="text" color="primary" prepend-icon="mdi-plus"
              :disabled="busy || editorAttachmentCount >= MAX_ATTACHMENTS" @click="triggerFilePicker">
              加入附件
            </v-btn>
            <input ref="fileInputRef" type="file" multiple class="d-none" :accept="ACCEPT" @change="handleFileSelect" />
          </div>

          <div v-if="editorAttachmentCount === 0" class="iln-empty">
            <v-icon size="small" class="mr-1">mdi-file-hidden</v-icon>尚未加入附件（圖片、PDF、Office 文件等）
          </div>
          <div v-else class="iln-editor-files">
            <div v-for="att in editor.existing" :key="att.path || att.url" class="iln-editor-file">
              <template v-if="isImage(att)">
                <v-img :src="att.url" width="40" height="40" cover class="rounded mr-2 flex-shrink-0"></v-img>
              </template>
              <v-icon v-else :color="fileMeta(att).color" class="mr-2">{{ fileMeta(att).icon }}</v-icon>
              <div class="flex-grow-1" style="min-width: 0;">
                <div class="text-body-2 text-truncate">{{ att.name || '附件' }}</div>
                <div class="text-caption text-grey">{{ formatSize(att.size) }} · 已上傳</div>
              </div>
              <v-btn icon size="x-small" variant="text" color="error" :disabled="busy" @click="removeExisting(att)">
                <v-icon size="small">mdi-close</v-icon>
              </v-btn>
            </div>
            <div v-for="p in editor.pending" :key="p.previewId" class="iln-editor-file iln-editor-file--pending">
              <template v-if="p.previewUrl">
                <v-img :src="p.previewUrl" width="40" height="40" cover class="rounded mr-2 flex-shrink-0"></v-img>
              </template>
              <v-icon v-else :color="fileMeta(p).color" class="mr-2">{{ fileMeta(p).icon }}</v-icon>
              <div class="flex-grow-1" style="min-width: 0;">
                <div class="text-body-2 text-truncate">{{ p.name }}</div>
                <div class="text-caption text-primary">{{ formatSize(p.size) }} · 待上傳</div>
              </div>
              <v-btn icon size="x-small" variant="text" color="error" :disabled="busy" @click="removePending(p.previewId)">
                <v-icon size="small">mdi-close</v-icon>
              </v-btn>
            </div>
          </div>
        </v-card-text>

        <v-divider></v-divider>
        <v-card-actions class="pa-4">
          <v-btn v-if="editor.noteId" color="error" variant="text" prepend-icon="mdi-delete"
            :disabled="busy" @click="askDeleteFromEditor">刪除備註</v-btn>
          <v-spacer></v-spacer>
          <v-btn variant="text" color="grey-darken-1" :disabled="busy" @click="closeEditor">取消</v-btn>
          <v-btn color="deep-orange-darken-1" variant="elevated" :loading="busy" :disabled="!canSave"
            :prepend-icon="editor.visibleToSales ? 'mdi-eye' : 'mdi-eye-off'" @click="saveEditor">
            {{ editor.noteId ? '更新備註' : '新增備註' }}（{{ editor.visibleToSales ? '銷售可見' : '對銷售隱藏' }}）
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- 刪除確認 -->
    <v-dialog v-model="deleteDialog.show" max-width="440">
      <v-card>
        <v-card-title class="text-subtitle-1">刪除這則櫃台備註？</v-card-title>
        <v-card-text class="text-body-2">
          <div v-if="deleteDialog.note?.content" class="pa-2 bg-grey-lighten-4 rounded iln-content">
            {{ deleteDialog.note.content }}
          </div>
          <div v-if="(deleteDialog.note?.attachments || []).length > 0" class="text-caption text-grey mt-2">
            將一併刪除 {{ deleteDialog.note.attachments.length }} 個附件。
          </div>
          <div class="text-caption text-grey mt-2">刪除後無法復原。</div>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn variant="text" :disabled="busy" @click="deleteDialog.show = false">取消</v-btn>
          <v-btn color="error" variant="flat" :loading="busy" @click="confirmDelete">刪除</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- 圖片預覽 -->
    <v-dialog v-model="preview.show" max-width="960">
      <v-card class="pa-2">
        <div class="d-flex align-center px-2 pb-2">
          <span class="text-body-2 text-truncate">{{ preview.name }}</span>
          <v-spacer></v-spacer>
          <v-btn size="small" variant="text" :href="preview.url" target="_blank" rel="noopener"
            prepend-icon="mdi-open-in-new">開新視窗</v-btn>
          <v-btn icon="mdi-close" size="small" variant="text" @click="preview.show = false"></v-btn>
        </div>
        <v-img :src="preview.url" max-height="80vh" contain></v-img>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { storage } from '@/firebase';
import { ref as storageRef, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { useToast } from 'vue-toastification';
import { useUserStore } from '@/store/user';
import { addInteractionLogNote, updateInteractionLogNote, deleteInteractionLogNote } from '@/api';

const props = defineProps({
  /** 該筆洽談紀錄（需含 logId / recorderName / date） */
  log: { type: Object, required: true },
  /** 該筆紀錄的櫃台備註（伺服器已依權限過濾） */
  notes: { type: Array, default: () => [] },
  projectId: { type: String, required: true },
  docId: { type: String, required: true },
  /** 櫃台／管理員：可新增、編輯、切換可見性、刪除 */
  canManage: { type: Boolean, default: false },
});

const emit = defineEmits(['update:notes']);

const MAX_ATTACHMENTS = 10;
const MAX_FILE_MB = 20;
const ACCEPT = 'image/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.zip';

const toast = useToast();
const userStore = useUserStore();

const busy = ref(false);
const togglingNoteId = ref(null);
const fileInputRef = ref(null);

const editor = ref({
  show: false,
  noteId: null,
  content: '',
  visibleToSales: false,
  existing: [],      // 既有附件（可移除）
  removed: [],       // 本次移除的既有附件（儲存成功後清理 Storage）
  pending: [],       // 待上傳 { previewId, file, name, size, type, previewUrl }
});
const deleteDialog = ref({ show: false, note: null });
const preview = ref({ show: false, url: '', name: '' });

const visibleCount = computed(() => props.notes.filter(n => n.visibleToSales).length);
const editorAttachmentCount = computed(() => editor.value.existing.length + editor.value.pending.length);
const canSave = computed(() => !busy.value && (editor.value.content.trim().length > 0 || editorAttachmentCount.value > 0));
const editorTargetLabel = computed(() => props.log?.recorderName ? `記錄人 ${props.log.recorderName} ` : '該筆紀錄的銷售人員');

function targetLabel(note) {
  const name = note.targetRecorderName || props.log?.recorderName;
  return name ? `記錄人 ${name} ` : '該筆紀錄的銷售人員';
}

// ---------- 顯示輔助 ----------
function toDate(v) {
  if (!v) return null;
  try {
    if (typeof v.toDate === 'function') return v.toDate();
    if (typeof v.seconds === 'number') return new Date(v.seconds * 1000);
    if (typeof v._seconds === 'number') return new Date(v._seconds * 1000);
    const d = new Date(v);
    return isNaN(d.getTime()) ? null : d;
  } catch (e) {
    return null;
  }
}

function formatTime(v) {
  const d = toDate(v);
  if (!d) return '';
  return d.toLocaleString('zh-TW', {
    timeZone: 'Asia/Taipei', year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', hour12: false,
  }).replace(/\//g, '-').replace(',', '');
}

function isImage(att) {
  const type = att?.type || '';
  if (type.startsWith('image/')) return true;
  return /\.(png|jpe?g|gif|webp|bmp|heic)$/i.test(att?.name || '');
}

function fileMeta(att) {
  const name = (att?.name || '').toLowerCase();
  const type = att?.type || '';
  if (type.includes('pdf') || name.endsWith('.pdf')) return { icon: 'mdi-file-pdf-box', color: 'red-darken-1' };
  if (type.includes('word') || /\.docx?$/.test(name)) return { icon: 'mdi-file-word-box', color: 'blue-darken-2' };
  if (type.includes('sheet') || type.includes('excel') || /\.(xlsx?|csv)$/.test(name)) return { icon: 'mdi-file-excel-box', color: 'green-darken-2' };
  if (type.includes('presentation') || /\.pptx?$/.test(name)) return { icon: 'mdi-file-powerpoint-box', color: 'orange-darken-2' };
  if (type.includes('zip') || name.endsWith('.zip')) return { icon: 'mdi-folder-zip', color: 'amber-darken-3' };
  if (isImage(att)) return { icon: 'mdi-file-image', color: 'teal' };
  return { icon: 'mdi-file-outline', color: 'grey-darken-1' };
}

function formatSize(bytes) {
  const n = Number(bytes) || 0;
  if (n <= 0) return '';
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(0)} KB`;
  return `${(n / 1024 / 1024).toFixed(1)} MB`;
}

function openPreview(att) {
  preview.value = { show: true, url: att.url, name: att.name || '' };
}

// ---------- 編輯器 ----------
function resetEditor() {
  for (const p of editor.value.pending) {
    if (p.previewUrl) { try { URL.revokeObjectURL(p.previewUrl); } catch (e) { /* noop */ } }
  }
  editor.value = { show: false, noteId: null, content: '', visibleToSales: false, existing: [], removed: [], pending: [] };
}

function openCreate() {
  resetEditor();
  editor.value.show = true;
}

function openEdit(note) {
  resetEditor();
  editor.value = {
    show: true,
    noteId: note.noteId,
    content: note.content || '',
    visibleToSales: note.visibleToSales === true,
    existing: [...(note.attachments || [])],
    removed: [],
    pending: [],
  };
}

function closeEditor() {
  if (busy.value) return;
  resetEditor();
}

function triggerFilePicker() {
  fileInputRef.value?.click();
}

function handleFileSelect(event) {
  const files = Array.from(event.target.files || []);
  event.target.value = '';
  for (const file of files) {
    if (editorAttachmentCount.value >= MAX_ATTACHMENTS) {
      toast.warning(`最多 ${MAX_ATTACHMENTS} 個附件`);
      break;
    }
    if (file.size > MAX_FILE_MB * 1024 * 1024) {
      toast.warning(`「${file.name}」超過 ${MAX_FILE_MB}MB，已略過`);
      continue;
    }
    const previewUrl = file.type.startsWith('image/') ? URL.createObjectURL(file) : '';
    editor.value.pending.push({
      previewId: `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      file, name: file.name, size: file.size, type: file.type, previewUrl,
    });
  }
}

function removePending(previewId) {
  const idx = editor.value.pending.findIndex(p => p.previewId === previewId);
  if (idx === -1) return;
  const [item] = editor.value.pending.splice(idx, 1);
  if (item?.previewUrl) { try { URL.revokeObjectURL(item.previewUrl); } catch (e) { /* noop */ } }
}

function removeExisting(att) {
  editor.value.existing = editor.value.existing.filter(a => a !== att);
  editor.value.removed.push(att);
}

async function uploadPending() {
  const uploaded = [];
  const prefix = `vipGuests/${props.docId}/logNotes/${props.log.logId}`;
  for (const item of editor.value.pending) {
    const safeName = item.file.name.replace(/[^\w.\-]/g, '_');
    const path = `${prefix}/${Date.now()}_${Math.random().toString(36).slice(2, 8)}_${safeName}`;
    const snapshot = await uploadBytes(storageRef(storage, path), item.file, { contentType: item.file.type || undefined });
    const url = await getDownloadURL(snapshot.ref);
    uploaded.push({ url, path, name: item.file.name, size: item.file.size, type: item.file.type });
  }
  return uploaded;
}

async function deleteStorageFiles(list) {
  for (const att of list || []) {
    if (!att?.path) continue;
    try { await deleteObject(storageRef(storage, att.path)); } catch (e) { console.warn('刪除備註附件失敗:', att.path, e); }
  }
}

async function saveEditor() {
  if (!canSave.value) return;
  busy.value = true;
  let uploaded = [];
  try {
    uploaded = editor.value.pending.length > 0 ? await uploadPending() : [];
    const payload = {
      content: editor.value.content.trim(),
      attachments: [...editor.value.existing, ...uploaded],
      visibleToSales: editor.value.visibleToSales === true,
    };
    const operatorName = userStore.user?.name || '';
    const operatorKey = userStore.user?.key;

    let result;
    if (editor.value.noteId) {
      result = await updateInteractionLogNote(props.projectId, props.docId, props.log.logId, editor.value.noteId, payload, operatorName, operatorKey);
      emitReplaced(result.note);
    } else {
      result = await addInteractionLogNote(props.projectId, props.docId, props.log.logId, payload, operatorName, operatorKey);
      emitAppended(result.note);
    }
    const removed = [...editor.value.removed];
    toast.success(editor.value.noteId
      ? `備註已更新（${payload.visibleToSales ? '銷售可見' : '對銷售隱藏'}）`
      : `備註已新增（${payload.visibleToSales ? '銷售可見' : '對銷售隱藏'}）`);
    resetEditor();
    await deleteStorageFiles(removed);
  } catch (error) {
    console.error('儲存櫃台備註失敗:', error);
    toast.error(`儲存失敗：${error.message}`);
    // 儲存失敗時清理本次已上傳的檔案
    await deleteStorageFiles(uploaded);
  } finally {
    busy.value = false;
  }
}

// ---------- 本地合併（後端只回傳單則備註） ----------
function emitAppended(note) {
  if (!note?.noteId) return;
  emit('update:notes', [...props.notes.filter(n => n.noteId !== note.noteId), note]);
}

function emitReplaced(note) {
  if (!note?.noteId) return;
  emit('update:notes', props.notes.map(n => (n.noteId === note.noteId ? note : n)));
}

// ---------- 可見性切換 ----------
async function toggleVisibility(note) {
  if (busy.value) return;
  busy.value = true;
  togglingNoteId.value = note.noteId;
  const next = !note.visibleToSales;
  try {
    const result = await updateInteractionLogNote(
      props.projectId, props.docId, props.log.logId, note.noteId,
      { visibleToSales: next },
      userStore.user?.name || '', userStore.user?.key,
    );
    emitReplaced(result.note);
    toast.success(next ? `已開放：${targetLabel(note)}現在看得到這則備註` : '已隱藏：銷售看不到這則備註');
  } catch (error) {
    console.error('切換備註可見性失敗:', error);
    toast.error(`切換失敗：${error.message}`);
  } finally {
    busy.value = false;
    togglingNoteId.value = null;
  }
}

// ---------- 刪除 ----------
function askDelete(note) {
  deleteDialog.value = { show: true, note };
}

function askDeleteFromEditor() {
  const note = props.notes.find(n => n.noteId === editor.value.noteId);
  if (!note) return;
  askDelete(note);
}

async function confirmDelete() {
  const note = deleteDialog.value.note;
  if (!note || busy.value) return;
  busy.value = true;
  try {
    // 後端刪除備註時會一併清理 Storage 附件，前端不再重複刪檔
    await deleteInteractionLogNote(props.projectId, props.docId, props.log.logId, note.noteId, userStore.user?.key);
    emit('update:notes', props.notes.filter(n => n.noteId !== note.noteId));
    deleteDialog.value = { show: false, note: null };
    if (editor.value.show && editor.value.noteId === note.noteId) resetEditor();
    toast.success('備註已刪除');
  } catch (error) {
    console.error('刪除櫃台備註失敗:', error);
    toast.error(`刪除失敗：${error.message}`);
  } finally {
    busy.value = false;
  }
}
</script>

<style scoped>
.iln {
  margin-top: 12px;
  padding-top: 10px;
  border-top: 1px dashed rgba(0, 0, 0, 0.12);
}
.iln-header {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 4px;
  margin-bottom: 8px;
}
.iln-title {
  font-weight: 700;
  font-size: 0.85rem;
  color: #bf360c;
}
.iln-empty {
  font-size: 0.75rem;
  color: #757575;
  padding: 8px 10px;
  background: #fafafa;
  border: 1px dashed rgba(0, 0, 0, 0.12);
  border-radius: 6px;
  display: flex;
  align-items: center;
  flex-wrap: wrap;
}

/* 單則備註 */
.iln-note {
  border-radius: 8px;
  overflow: hidden;
  margin-bottom: 10px;
  border: 1px solid rgba(0, 0, 0, 0.12);
  background: #fff;
}
.iln-note--visible {
  border-color: #81c784;
  box-shadow: inset 4px 0 0 #43a047;
}
.iln-note--hidden {
  border-color: #ffb74d;
  border-style: dashed;
  box-shadow: inset 4px 0 0 #fb8c00;
  background-image: repeating-linear-gradient(135deg, rgba(255, 152, 0, 0.05) 0 8px, transparent 8px 16px);
}

/* 可見性狀態列 */
.iln-vis-bar {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 4px;
  padding: 6px 10px;
  font-size: 0.78rem;
  min-height: 40px;
}
.iln-vis-bar--visible {
  background: #e8f5e9;
  color: #1b5e20;
}
.iln-vis-bar--hidden {
  background: #fff3e0;
  color: #e65100;
}
.iln-vis-text {
  display: inline-flex;
  flex-direction: column;
  line-height: 1.2;
}
.iln-vis-sub {
  font-size: 0.7rem;
  opacity: 0.85;
}
.iln-vis-switch {
  flex-shrink: 0;
}
.iln-vis-switch :deep(.v-selection-control) {
  min-height: 0;
}
.iln-vis-log {
  font-size: 0.68rem;
  color: #9e9e9e;
  margin-top: 6px;
}

.iln-body {
  padding: 8px 10px 10px;
}
.iln-avatar {
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: #ff7043;
  color: #fff;
  font-size: 0.72rem;
  font-weight: 700;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.iln-author {
  font-size: 0.8rem;
  font-weight: 700;
  color: #424242;
}
.iln-time {
  font-size: 0.7rem;
  color: #757575;
  display: inline-flex;
  align-items: center;
}
.iln-time--edited {
  color: #9e9e9e;
  cursor: help;
}
.iln-content {
  white-space: pre-wrap;
  word-break: break-word;
  line-height: 1.6;
  font-size: 0.85rem;
  color: #424242;
  margin-top: 6px;
}

/* 附件 */
.iln-attachments {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 8px;
}
.iln-thumb {
  cursor: zoom-in;
  border: 1px solid rgba(0, 0, 0, 0.12);
  border-radius: 6px;
  overflow: hidden;
}
.iln-file {
  display: inline-flex;
  align-items: center;
  max-width: 100%;
  padding: 4px 8px;
  border: 1px solid rgba(0, 0, 0, 0.12);
  border-radius: 6px;
  background: #fafafa;
  text-decoration: none;
  color: #424242;
  font-size: 0.78rem;
}
.iln-file:hover {
  background: #f0f0f0;
}
.iln-file-name {
  max-width: 180px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.iln-file-size {
  margin-left: 6px;
  color: #9e9e9e;
  font-size: 0.7rem;
}

/* 編輯器：可見性雙卡片 */
.iln-vis-options {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}
@media (max-width: 600px) {
  .iln-vis-options {
    grid-template-columns: 1fr;
  }
}
.iln-vis-option {
  position: relative;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 36px 12px 12px;
  border: 2px solid rgba(0, 0, 0, 0.12);
  border-radius: 10px;
  cursor: pointer;
  transition: border-color .15s, background .15s;
  user-select: none;
}
.iln-vis-option:hover {
  background: #fafafa;
}
.iln-vis-option--active-hidden {
  border-color: #fb8c00;
  background: #fff3e0;
}
.iln-vis-option--active-visible {
  border-color: #43a047;
  background: #e8f5e9;
}
.iln-vis-option-text {
  min-width: 0;
  font-size: 0.85rem;
}
.iln-vis-check {
  position: absolute;
  right: 10px;
  top: 10px;
}

/* 編輯器：附件清單 */
.iln-editor-files {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.iln-editor-file {
  display: flex;
  align-items: center;
  padding: 6px 8px;
  border: 1px solid rgba(0, 0, 0, 0.12);
  border-radius: 6px;
  background: #fafafa;
}
.iln-editor-file--pending {
  border-style: dashed;
  border-color: #90caf9;
  background: #e3f2fd;
}
</style>
