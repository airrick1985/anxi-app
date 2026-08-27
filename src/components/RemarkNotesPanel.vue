<template>
  <div class="remark-notes-panel" :class="{ 'remark-notes-panel--dense': dense }">
    <!-- 標題列 -->
    <div class="d-flex align-center mb-2">
      <v-icon size="small" color="primary" class="mr-1">mdi-comment-text-multiple-outline</v-icon>
      <span class="rn-title">{{ title }}</span>
      <v-chip v-if="displayNotes.length > 0" size="x-small" color="primary" variant="tonal" class="ml-2">
        {{ displayNotes.length }}
      </v-chip>
      <v-spacer></v-spacer>
      <!-- 分類篩選 -->
      <v-chip-group
        v-if="usedCategories.length > 1"
        v-model="filterCategory"
        selected-class="rn-filter--active"
        class="rn-filter-group"
      >
        <v-chip size="x-small" variant="outlined" :value="null" label>全部</v-chip>
        <v-chip
          v-for="c in usedCategories"
          :key="c.value"
          size="x-small"
          variant="outlined"
          :color="c.color"
          :value="c.value"
          label
        >{{ c.label }}</v-chip>
      </v-chip-group>
    </div>

    <!-- 新增留言輸入區 -->
    <div class="rn-input-card mb-3">
      <v-textarea
        v-model="newContent"
        :rows="dense ? 1 : 2"
        auto-grow
        density="compact"
        variant="outlined"
        hide-details
        placeholder="新增備註留言…（Ctrl+Enter 送出）"
        :disabled="busy"
        @keydown.ctrl.enter.prevent="submitAdd"
      ></v-textarea>

      <!-- 待上傳圖片預覽 -->
      <div v-if="pendingImages.length > 0" class="d-flex flex-wrap ga-2 mt-2">
        <div v-for="img in pendingImages" :key="img.previewId" class="rn-pending-thumb">
          <v-img :src="img.previewUrl" width="56" height="56" cover class="rounded"></v-img>
          <v-btn icon size="x-small" density="compact" variant="flat" color="error" class="rn-thumb-remove"
            @click="removePendingImage(img.previewId)">
            <v-icon size="x-small">mdi-close</v-icon>
          </v-btn>
        </div>
      </div>

      <div class="d-flex align-center mt-2 flex-wrap ga-1">
        <v-chip-group v-model="newCategory" mandatory selected-class="rn-cat--active" class="rn-cat-group">
          <v-chip
            v-for="c in NOTE_CATEGORIES"
            :key="c.value"
            :value="c.value"
            size="x-small"
            :color="c.color"
            variant="outlined"
            label
          >{{ c.label }}</v-chip>
        </v-chip-group>
        <v-spacer></v-spacer>
        <v-btn
          v-if="storagePathPrefix"
          icon
          size="small"
          variant="text"
          :disabled="busy || pendingImages.length >= MAX_IMAGES"
          @click="triggerFilePicker"
        >
          <v-icon size="small">mdi-image-plus-outline</v-icon>
          <v-tooltip activator="parent">附加圖片（最多 {{ MAX_IMAGES }} 張）</v-tooltip>
        </v-btn>
        <v-btn
          color="primary"
          size="small"
          variant="flat"
          prepend-icon="mdi-send"
          :loading="busy"
          :disabled="!canSubmit"
          @click="submitAdd"
        >送出</v-btn>
      </div>
      <input ref="fileInputRef" type="file" accept="image/jpeg,image/png,image/webp" multiple class="d-none"
        @change="handleFileSelect" />
    </div>

    <!-- 留言列表 -->
    <div v-if="filteredNotes.length === 0" class="text-caption text-grey py-2 text-center">
      <v-icon size="small" class="mr-1">mdi-comment-outline</v-icon>尚無備註留言
    </div>

    <div v-else class="rn-list" :style="dense ? 'max-height: 320px; overflow-y: auto;' : ''">
      <div
        v-for="note in filteredNotes"
        :key="note.noteId"
        class="rn-note"
        :class="{ 'rn-note--pinned': note.pinned, 'rn-note--system': note.type === 'system' }"
      >
        <!-- 頭像 -->
        <div class="rn-avatar" :class="`rn-avatar--${note.type}`">
          <v-icon v-if="note.type === 'system'" size="small" color="white">mdi-cog</v-icon>
          <v-icon v-else-if="note.type === 'legacy'" size="small" color="white">mdi-history</v-icon>
          <span v-else>{{ (note.authorName || '?').charAt(0) }}</span>
        </div>

        <div class="rn-body">
          <div class="d-flex align-center flex-wrap ga-1">
            <span class="rn-author">{{ displayAuthor(note) }}</span>
            <v-chip
              v-if="note.type === 'user' && note.category"
              size="x-small"
              :color="categoryMeta(note.category).color"
              variant="tonal"
              label
              density="comfortable"
            >{{ categoryMeta(note.category).label }}</v-chip>
            <v-icon v-if="note.pinned" size="x-small" color="amber-darken-2">mdi-pin</v-icon>
            <span class="rn-time">{{ formatNoteTime(note.createdAt) || (note.type === 'legacy' ? '轉入自舊備註' : '') }}</span>
            <span v-if="isEdited(note)" class="rn-time">(已編輯)</span>
            <v-spacer></v-spacer>
            <!-- 動作選單 -->
            <v-menu location="bottom end">
              <template v-slot:activator="{ props: menuProps }">
                <v-btn icon size="x-small" variant="text" density="comfortable" v-bind="menuProps" :disabled="busy">
                  <v-icon size="small">mdi-dots-horizontal</v-icon>
                </v-btn>
              </template>
              <v-list density="compact">
                <v-list-item @click="togglePin(note)">
                  <template v-slot:prepend><v-icon size="small">{{ note.pinned ? 'mdi-pin-off-outline' : 'mdi-pin-outline' }}</v-icon></template>
                  <v-list-item-title>{{ note.pinned ? '取消置頂' : '置頂' }}</v-list-item-title>
                </v-list-item>
                <v-list-item v-if="note.type !== 'system'" @click="startEdit(note)">
                  <template v-slot:prepend><v-icon size="small">mdi-pencil-outline</v-icon></template>
                  <v-list-item-title>編輯</v-list-item-title>
                </v-list-item>
                <v-list-item @click="askDelete(note)">
                  <template v-slot:prepend><v-icon size="small" color="error">mdi-delete-outline</v-icon></template>
                  <v-list-item-title class="text-error">刪除</v-list-item-title>
                </v-list-item>
              </v-list>
            </v-menu>
          </div>

          <!-- 內容（編輯中 / 一般顯示） -->
          <template v-if="editingNoteId === note.noteId">
            <v-textarea
              v-model="editContent"
              rows="2"
              auto-grow
              density="compact"
              variant="outlined"
              hide-details
              class="mt-1"
              autofocus
            ></v-textarea>
            <div class="d-flex align-center mt-1 flex-wrap ga-1">
              <v-chip-group v-if="note.type === 'user'" v-model="editCategory" mandatory selected-class="rn-cat--active" class="rn-cat-group">
                <v-chip v-for="c in NOTE_CATEGORIES" :key="c.value" :value="c.value" size="x-small" :color="c.color" variant="outlined" label>{{ c.label }}</v-chip>
              </v-chip-group>
              <v-spacer></v-spacer>
              <v-btn size="x-small" variant="text" @click="cancelEdit">取消</v-btn>
              <v-btn size="x-small" color="primary" variant="flat" :loading="busy" :disabled="!editContent.trim()" @click="saveEdit(note)">儲存</v-btn>
            </div>
          </template>
          <template v-else>
            <div class="rn-content">{{ note.content }}</div>
            <div v-if="(note.images || []).length > 0" class="d-flex flex-wrap ga-2 mt-1">
              <v-img
                v-for="img in note.images"
                :key="img.path || img.url"
                :src="img.url"
                width="64"
                height="64"
                cover
                class="rounded rn-note-img"
                @click="openFullscreen(img.url)"
              ></v-img>
            </div>
          </template>
        </div>
      </div>
    </div>

    <!-- 刪除確認 -->
    <v-dialog v-model="deleteDialog.show" max-width="420">
      <v-card>
        <v-card-title class="text-subtitle-1">刪除這則備註留言？</v-card-title>
        <v-card-text class="text-body-2">
          <div class="pa-2 bg-grey-lighten-4 rounded rn-content">{{ deleteDialog.note?.content }}</div>
          <div class="text-caption text-grey mt-2">刪除後無法復原。</div>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn variant="text" @click="deleteDialog.show = false">取消</v-btn>
          <v-btn color="error" variant="flat" :loading="busy" @click="confirmDelete">刪除</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- 圖片全螢幕預覽 -->
    <v-dialog v-model="fullscreen.show" max-width="900">
      <v-card class="pa-2" @click="fullscreen.show = false">
        <v-img :src="fullscreen.url" max-height="80vh" contain></v-img>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { Timestamp } from 'firebase/firestore';
import { storage } from '@/firebase';
import { ref as storageRef, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { useToast, POSITION } from 'vue-toastification';
import { useUserStore } from '@/store/user';
import {
  NOTE_CATEGORIES, categoryMeta, formatNoteTime, toDateSafe,
  resolveDisplayNotes, materializeNotes, newNoteId,
} from '@/utils/remarkNotes';

const props = defineProps({
  notes: { type: Array, default: () => [] },          // 文件上的 remarkNotes 原始陣列
  legacyRemarks: { type: String, default: '' },        // 舊字串備註（向下相容顯示/轉入）
  persistHandler: { type: Function, required: true },  // async (newNotesArray) => void
  storagePathPrefix: { type: String, default: '' },    // 留言附圖上傳路徑前綴；空字串停用附圖
  title: { type: String, default: '備註' },
  dense: { type: Boolean, default: false },
});

const MAX_IMAGES = 3;
const MAX_IMAGE_SIZE_MB = 5;

const toast = useToast();
const userStore = useUserStore();

const busy = ref(false);
const filterCategory = ref(null);

const newContent = ref('');
const newCategory = ref('general');
const pendingImages = ref([]); // { previewId, file, previewUrl }
const fileInputRef = ref(null);

const editingNoteId = ref(null);
const editContent = ref('');
const editCategory = ref('general');

const deleteDialog = ref({ show: false, note: null });
const fullscreen = ref({ show: false, url: '' });

const displayNotes = computed(() => resolveDisplayNotes(props.notes, props.legacyRemarks));

const usedCategories = computed(() => {
  const used = new Set(displayNotes.value.filter(n => n.type === 'user').map(n => n.category || 'general'));
  return NOTE_CATEGORIES.filter(c => used.has(c.value));
});

const filteredNotes = computed(() => {
  if (!filterCategory.value) return displayNotes.value;
  return displayNotes.value.filter(n => n.type !== 'user' || (n.category || 'general') === filterCategory.value);
});

const canSubmit = computed(() => newContent.value.trim().length > 0 || pendingImages.value.length > 0);

function displayAuthor(note) {
  if (note.type === 'system') return `系統${note.authorName ? `（${note.authorName}）` : ''}`;
  if (note.type === 'legacy') return '舊備註';
  return note.authorName || '未知用戶';
}

function isEdited(note) {
  const c = toDateSafe(note.createdAt);
  const u = toDateSafe(note.updatedAt);
  return !!(c && u && u.getTime() > c.getTime());
}

// ---------- 附圖 ----------
function triggerFilePicker() {
  if (fileInputRef.value) {
    fileInputRef.value.value = '';
    fileInputRef.value.click();
  }
}

function handleFileSelect(event) {
  const files = Array.from(event.target.files || []);
  for (const file of files) {
    if (pendingImages.value.length >= MAX_IMAGES) {
      toast.warning(`附圖最多 ${MAX_IMAGES} 張`, { position: POSITION.BOTTOM_CENTER });
      break;
    }
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      toast.error(`不支援的格式：${file.name}`, { position: POSITION.BOTTOM_CENTER });
      continue;
    }
    if (file.size > MAX_IMAGE_SIZE_MB * 1024 * 1024) {
      toast.error(`檔案過大：${file.name}（上限 ${MAX_IMAGE_SIZE_MB}MB）`, { position: POSITION.BOTTOM_CENTER });
      continue;
    }
    pendingImages.value.push({
      previewId: `pending_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      file,
      previewUrl: URL.createObjectURL(file),
    });
  }
}

function removePendingImage(previewId) {
  const idx = pendingImages.value.findIndex(p => p.previewId === previewId);
  if (idx !== -1) {
    try { URL.revokeObjectURL(pendingImages.value[idx].previewUrl); } catch (e) { /* noop */ }
    pendingImages.value.splice(idx, 1);
  }
}

async function uploadPendingImages() {
  const uploaded = [];
  for (const item of pendingImages.value) {
    const safeName = item.file.name.replace(/[^\w.\-]/g, '_');
    const path = `${props.storagePathPrefix}/${Date.now()}_${Math.random().toString(36).slice(2, 8)}_${safeName}`;
    const snapshot = await uploadBytes(storageRef(storage, path), item.file);
    const url = await getDownloadURL(snapshot.ref);
    uploaded.push({ url, path, name: item.file.name, size: item.file.size, type: item.file.type });
  }
  return uploaded;
}

function clearPendingImages() {
  for (const item of pendingImages.value) {
    try { URL.revokeObjectURL(item.previewUrl); } catch (e) { /* noop */ }
  }
  pendingImages.value = [];
}

function openFullscreen(url) {
  fullscreen.value = { show: true, url };
}

// ---------- CRUD ----------
async function persist(newNotes) {
  await props.persistHandler(newNotes);
}

async function submitAdd() {
  if (!canSubmit.value || busy.value) return;
  busy.value = true;
  try {
    const images = pendingImages.value.length > 0 ? await uploadPendingImages() : [];
    const base = materializeNotes(props.notes, props.legacyRemarks);
    const note = {
      noteId: newNoteId(),
      type: 'user',
      category: newCategory.value || 'general',
      content: newContent.value.trim(),
      images,
      authorName: userStore.user?.name || '未知用戶',
      authorKey: userStore.user?.key || '',
      createdAt: Timestamp.now(),
      updatedAt: null,
      pinned: false,
    };
    await persist([...base, note]);
    newContent.value = '';
    newCategory.value = 'general';
    clearPendingImages();
  } catch (error) {
    console.error('新增備註留言失敗:', error);
    toast.error(`新增失敗：${error.message}`, { position: POSITION.BOTTOM_CENTER });
  } finally {
    busy.value = false;
  }
}

function startEdit(note) {
  editingNoteId.value = note.noteId;
  editContent.value = note.content;
  editCategory.value = note.category || 'general';
}

function cancelEdit() {
  editingNoteId.value = null;
  editContent.value = '';
}

async function saveEdit(note) {
  if (!editContent.value.trim() || busy.value) return;
  busy.value = true;
  try {
    const base = materializeNotes(props.notes, props.legacyRemarks);
    const newNotes = base.map(n => n.noteId === note.noteId
      ? { ...n, content: editContent.value.trim(), category: n.type === 'user' ? (editCategory.value || 'general') : n.category, updatedAt: Timestamp.now() }
      : n);
    await persist(newNotes);
    cancelEdit();
  } catch (error) {
    console.error('編輯備註留言失敗:', error);
    toast.error(`編輯失敗：${error.message}`, { position: POSITION.BOTTOM_CENTER });
  } finally {
    busy.value = false;
  }
}

async function togglePin(note) {
  if (busy.value) return;
  busy.value = true;
  try {
    const base = materializeNotes(props.notes, props.legacyRemarks);
    const newNotes = base.map(n => n.noteId === note.noteId ? { ...n, pinned: !n.pinned } : n);
    await persist(newNotes);
  } catch (error) {
    console.error('置頂備註留言失敗:', error);
    toast.error(`操作失敗：${error.message}`, { position: POSITION.BOTTOM_CENTER });
  } finally {
    busy.value = false;
  }
}

function askDelete(note) {
  deleteDialog.value = { show: true, note };
}

async function confirmDelete() {
  const note = deleteDialog.value.note;
  if (!note || busy.value) return;
  busy.value = true;
  try {
    const base = materializeNotes(props.notes, props.legacyRemarks);
    const newNotes = base.filter(n => n.noteId !== note.noteId);
    await persist(newNotes);
    // 附圖 Storage 清理（容錯：失敗不阻斷）
    for (const img of (note.images || [])) {
      if (!img?.path) continue;
      try { await deleteObject(storageRef(storage, img.path)); } catch (e) { console.warn('刪除留言附圖失敗:', img.path, e); }
    }
    deleteDialog.value = { show: false, note: null };
  } catch (error) {
    console.error('刪除備註留言失敗:', error);
    toast.error(`刪除失敗：${error.message}`, { position: POSITION.BOTTOM_CENTER });
  } finally {
    busy.value = false;
  }
}
</script>

<style scoped>
.rn-title {
  font-weight: 700;
  font-size: 0.95rem;
}
.remark-notes-panel--dense .rn-title {
  font-size: 0.85rem;
}
.rn-input-card {
  border: 1px solid rgba(0, 0, 0, 0.12);
  border-radius: 8px;
  padding: 8px;
  background-color: rgba(0, 0, 0, 0.02);
}
.rn-cat-group :deep(.v-slide-group__content) {
  gap: 2px;
}
.rn-cat--active,
.rn-filter--active {
  opacity: 1 !important;
  font-weight: 700;
}
.rn-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.rn-note {
  display: flex;
  gap: 8px;
  padding: 8px;
  border-radius: 8px;
  background-color: rgba(0, 0, 0, 0.03);
}
.rn-note--pinned {
  background-color: rgba(255, 193, 7, 0.08);
  border: 1px solid rgba(255, 193, 7, 0.35);
}
.rn-note--system {
  background-color: rgba(96, 125, 139, 0.08);
}
.rn-avatar {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 0.8rem;
  font-weight: 700;
  background-color: #1976d2;
}
.rn-avatar--system {
  background-color: #607d8b;
}
.rn-avatar--legacy {
  background-color: #9e9e9e;
}
.rn-body {
  flex: 1;
  min-width: 0;
}
.rn-author {
  font-weight: 700;
  font-size: 0.82rem;
}
.rn-time {
  font-size: 0.72rem;
  color: rgba(0, 0, 0, 0.45);
}
.rn-content {
  white-space: pre-wrap;
  word-break: break-word;
  font-size: 0.85rem;
  margin-top: 2px;
}
.rn-note-img {
  cursor: pointer;
  flex: 0 0 64px;
}
.rn-pending-thumb {
  position: relative;
}
.rn-thumb-remove {
  position: absolute;
  top: -6px;
  right: -6px;
}
</style>
