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
      <div v-if="pendingImages.length > 0" class="d-flex flex-wrap ga-2 mt-2 align-center">
        <span class="rn-time">附圖 {{ pendingImages.length }} 張</span>
        <div v-for="img in pendingImages" :key="img.previewId" class="rn-pending-thumb">
          <v-img :src="img.previewUrl" width="56" height="56" cover class="rounded rn-note-img"
            @click="openFullscreen({ source: 'pending', list: pendingImages, item: img })"></v-img>
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
          :disabled="busy"
          @click="triggerFilePicker('new')"
        >
          <v-icon size="small">mdi-image-plus-outline</v-icon>
          <v-tooltip activator="parent">附加圖片（可多選）</v-tooltip>
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
            <!-- 編輯中：既有圖片（可移除）＋ 新增待上傳圖片 -->
            <div v-if="editKeptImages.length > 0 || editPendingImages.length > 0" class="d-flex flex-wrap ga-2 mt-2 align-center">
              <span class="rn-time">附圖 {{ editKeptImages.length + editPendingImages.length }} 張</span>
              <div v-for="img in editKeptImages" :key="img.path || img.url" class="rn-pending-thumb">
                <v-img :src="img.url" width="56" height="56" cover class="rounded rn-note-img"
                  @click="openFullscreen({ source: 'kept', list: editKeptImages, item: img })"></v-img>
                <v-btn icon size="x-small" density="compact" variant="flat" color="error" class="rn-thumb-remove"
                  @click="removeEditKeptImage(img)">
                  <v-icon size="x-small">mdi-close</v-icon>
                  <v-tooltip activator="parent">移除此圖（儲存後生效）</v-tooltip>
                </v-btn>
              </div>
              <div v-for="img in editPendingImages" :key="img.previewId" class="rn-pending-thumb rn-pending-thumb--new">
                <v-img :src="img.previewUrl" width="56" height="56" cover class="rounded rn-note-img"
                  @click="openFullscreen({ source: 'pending', list: editPendingImages, item: img })"></v-img>
                <v-btn icon size="x-small" density="compact" variant="flat" color="error" class="rn-thumb-remove"
                  @click="removeEditPendingImage(img.previewId)">
                  <v-icon size="x-small">mdi-close</v-icon>
                </v-btn>
              </div>
            </div>
            <div class="d-flex align-center mt-1 flex-wrap ga-1">
              <v-chip-group v-if="note.type === 'user'" v-model="editCategory" mandatory selected-class="rn-cat--active" class="rn-cat-group">
                <v-chip v-for="c in NOTE_CATEGORIES" :key="c.value" :value="c.value" size="x-small" :color="c.color" variant="outlined" label>{{ c.label }}</v-chip>
              </v-chip-group>
              <v-spacer></v-spacer>
              <v-btn v-if="storagePathPrefix" icon size="x-small" variant="text" :disabled="busy" @click="triggerFilePicker('edit')">
                <v-icon size="small">mdi-image-plus-outline</v-icon>
                <v-tooltip activator="parent">新增圖片（可多選）</v-tooltip>
              </v-btn>
              <v-btn size="x-small" variant="text" :disabled="busy" @click="cancelEdit">取消</v-btn>
              <v-btn size="x-small" color="primary" variant="flat" :loading="busy" :disabled="!canSaveEdit" @click="saveEdit(note)">儲存</v-btn>
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
                @click="openFullscreen({ source: 'note', note, list: note.images, item: img })"
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

    <!-- 圖片燈箱（mac 快速查看風格） -->
    <v-dialog v-model="fullscreen.show" max-width="960" content-class="rn-lightbox-dialog">
      <div class="rn-lightbox" @click.self="fullscreen.show = false">
        <div class="rn-lb-bar">
          <div class="rn-lb-lights">
            <button class="rn-lb-light rn-lb-light--close" title="關閉" @click="fullscreen.show = false"></button>
          </div>
          <div class="rn-lb-title">
            <span class="rn-lb-name">{{ fullscreenName }}</span>
            <span v-if="fullscreenList.length > 1" class="rn-lb-count">{{ fullscreenIndex + 1 }} / {{ fullscreenList.length }}</span>
          </div>
          <div class="rn-lb-actions">
            <button v-if="fullscreenList.length > 1" class="rn-lb-btn" title="上一張" @click="stepFullscreen(-1)"><v-icon size="16">mdi-chevron-left</v-icon></button>
            <button v-if="fullscreenList.length > 1" class="rn-lb-btn" title="下一張" @click="stepFullscreen(1)"><v-icon size="16">mdi-chevron-right</v-icon></button>
            <button class="rn-lb-btn" title="下載" @click="downloadFullscreen"><v-icon size="16">mdi-download-outline</v-icon></button>
            <button v-if="canMarkup" class="rn-lb-btn rn-lb-btn--primary" title="標記：加文字、畫筆、形狀、馬賽克" @click="openMarkup">
              <v-icon size="15" class="mr-1">mdi-pencil-outline</v-icon>標記
            </button>
          </div>
        </div>
        <div
          class="rn-lb-body"
          @click.self="fullscreen.show = false"
          @touchstart.passive="onLightboxTouchStart"
          @touchend.passive="onLightboxTouchEnd"
        >
          <button v-if="fullscreenList.length > 1" class="rn-lb-nav rn-lb-nav--prev" title="上一張 (←)" @click.stop="stepFullscreen(-1)">
            <v-icon size="28">mdi-chevron-left</v-icon>
          </button>
          <img :key="fullscreenUrl" :src="fullscreenUrl" class="rn-lb-img" :alt="fullscreenName" @click.stop="stepFullscreen(1)" />
          <button v-if="fullscreenList.length > 1" class="rn-lb-nav rn-lb-nav--next" title="下一張 (→)" @click.stop="stepFullscreen(1)">
            <v-icon size="28">mdi-chevron-right</v-icon>
          </button>
          <div v-if="fullscreenList.length > 1" class="rn-lb-dots">
            <span
              v-for="(it, i) in fullscreenList"
              :key="it.previewId || it.path || it.url"
              class="rn-lb-dot"
              :class="{ 'rn-lb-dot--active': i === fullscreenIndex }"
              @click.stop="fullscreen.index = i"
            ></span>
          </div>
        </div>
      </div>
    </v-dialog>

    <!-- 圖片標記編輯器 -->
    <ImageMarkupDialog
      ref="markupRef"
      v-model="markup.show"
      :src="markup.url"
      :name="markup.name"
      :mime-type="markup.mimeType"
      :can-save="markup.canSave"
      :saving="busy"
      @save="handleMarkupSave"
    />
  </div>
</template>

<script setup>
import { ref, computed, watch, onBeforeUnmount } from 'vue';
import { Timestamp } from 'firebase/firestore';
import { storage } from '@/firebase';
import { ref as storageRef, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { useToast, POSITION } from 'vue-toastification';
import { useUserStore } from '@/store/user';
import {
  NOTE_CATEGORIES, categoryMeta, formatNoteTime, toDateSafe,
  resolveDisplayNotes, materializeNotes, newNoteId,
} from '@/utils/remarkNotes';
import ImageMarkupDialog from './ImageMarkupDialog.vue';

const props = defineProps({
  notes: { type: Array, default: () => [] },          // 文件上的 remarkNotes 原始陣列
  legacyRemarks: { type: String, default: '' },        // 舊字串備註（向下相容顯示/轉入）
  persistHandler: { type: Function, required: true },  // async (newNotesArray) => void
  storagePathPrefix: { type: String, default: '' },    // 留言附圖上傳路徑前綴；空字串停用附圖
  title: { type: String, default: '備註' },
  dense: { type: Boolean, default: false },
});

const MAX_IMAGE_SIZE_MB = 5;
const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

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
const editKeptImages = ref([]);      // 編輯中保留的既有圖片 { url, path, ... }
const editRemovedImages = ref([]);   // 編輯中標記移除的既有圖片（儲存後才真正刪除）
const editPendingImages = ref([]);   // 編輯中新增的待上傳圖片 { previewId, file, previewUrl }
const filePickerTarget = ref('new'); // 檔案選擇器目前服務的對象：'new' | 'edit'

const deleteDialog = ref({ show: false, note: null });
// 燈箱：source = 'note'（已儲存留言的圖）| 'pending'（待上傳）| 'kept'（編輯中保留的既有圖）
const fullscreen = ref({ show: false, source: 'note', note: null, list: [], index: 0 });
const markup = ref({ show: false, url: '', name: '', mimeType: '', canSave: true });
const markupRef = ref(null);

const fullscreenList = computed(() => fullscreen.value.list || []);
const fullscreenIndex = computed(() => Math.min(Math.max(0, fullscreen.value.index), Math.max(0, fullscreenList.value.length - 1)));
const fullscreenItem = computed(() => fullscreenList.value[fullscreenIndex.value] || null);
const fullscreenUrl = computed(() => imageItemUrl(fullscreenItem.value));
const fullscreenName = computed(() => imageItemName(fullscreenItem.value));
// 可標記：已儲存留言（需有上傳路徑）或待上傳圖片；編輯中保留的既有圖僅供檢視
const canMarkup = computed(() => {
  const src = fullscreen.value.source;
  if (src === 'pending') return true;
  if (src === 'note') return !!props.storagePathPrefix && !!fullscreen.value.note && fullscreen.value.note.type !== 'system';
  return false;
});

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
const canSaveEdit = computed(() =>
  editContent.value.trim().length > 0 || editKeptImages.value.length > 0 || editPendingImages.value.length > 0
);

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
function triggerFilePicker(target = 'new') {
  filePickerTarget.value = target;
  if (fileInputRef.value) {
    fileInputRef.value.value = '';
    fileInputRef.value.click();
  }
}

// 將選取的檔案驗證後轉為待上傳項目（不限張數，只檢查格式與大小）
function filesToPendingItems(files) {
  const items = [];
  for (const file of files) {
    if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
      toast.error(`不支援的格式：${file.name}`, { position: POSITION.BOTTOM_CENTER });
      continue;
    }
    if (file.size > MAX_IMAGE_SIZE_MB * 1024 * 1024) {
      toast.error(`檔案過大：${file.name}（上限 ${MAX_IMAGE_SIZE_MB}MB）`, { position: POSITION.BOTTOM_CENTER });
      continue;
    }
    items.push({
      previewId: `pending_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      file,
      previewUrl: URL.createObjectURL(file),
    });
  }
  return items;
}

function handleFileSelect(event) {
  const files = Array.from(event.target.files || []);
  const items = filesToPendingItems(files);
  if (filePickerTarget.value === 'edit') {
    editPendingImages.value.push(...items);
  } else {
    pendingImages.value.push(...items);
  }
}

function removeFromPendingList(listRef, previewId) {
  const idx = listRef.value.findIndex(p => p.previewId === previewId);
  if (idx !== -1) {
    try { URL.revokeObjectURL(listRef.value[idx].previewUrl); } catch (e) { /* noop */ }
    listRef.value.splice(idx, 1);
  }
}

function removePendingImage(previewId) {
  removeFromPendingList(pendingImages, previewId);
}

function removeEditPendingImage(previewId) {
  removeFromPendingList(editPendingImages, previewId);
}

function removeEditKeptImage(img) {
  const key = img.path || img.url;
  editKeptImages.value = editKeptImages.value.filter(i => (i.path || i.url) !== key);
  editRemovedImages.value.push(img);
}

async function uploadImages(items) {
  const uploaded = [];
  for (const item of items) {
    const safeName = item.file.name.replace(/[^\w.\-]/g, '_');
    const path = `${props.storagePathPrefix}/${Date.now()}_${Math.random().toString(36).slice(2, 8)}_${safeName}`;
    const snapshot = await uploadBytes(storageRef(storage, path), item.file);
    const url = await getDownloadURL(snapshot.ref);
    uploaded.push({ url, path, name: item.file.name, size: item.file.size, type: item.file.type });
  }
  return uploaded;
}

function revokePendingList(listRef) {
  for (const item of listRef.value) {
    try { URL.revokeObjectURL(item.previewUrl); } catch (e) { /* noop */ }
  }
  listRef.value = [];
}

function clearPendingImages() {
  revokePendingList(pendingImages);
}

// Storage 附圖清理（容錯：失敗不阻斷）
async function deleteStorageImages(images) {
  for (const img of (images || [])) {
    if (!img?.path) continue;
    try { await deleteObject(storageRef(storage, img.path)); } catch (e) { console.warn('刪除留言附圖失敗:', img.path, e); }
  }
}

function imageItemUrl(item) {
  if (!item) return '';
  return item.previewUrl || item.url || '';
}
function imageItemName(item) {
  if (!item) return '';
  return item.file?.name || item.name || '圖片';
}
function imageItemMime(item) {
  if (!item) return '';
  return item.file?.type || item.type || '';
}

function openFullscreen({ source = 'note', note = null, list = [], item = null }) {
  const arr = Array.isArray(list) ? list : [];
  const key = item?.previewId || item?.path || item?.url;
  const idx = Math.max(0, arr.findIndex(i => (i.previewId || i.path || i.url) === key));
  fullscreen.value = { show: true, source, note, list: arr, index: idx };
}

function stepFullscreen(delta) {
  const n = fullscreenList.value.length;
  if (n <= 1) return;
  fullscreen.value.index = (fullscreenIndex.value + delta + n) % n;
}

// 鍵盤 ← → 切換、Esc 關閉（標記編輯器開啟時交由編輯器處理）
function onLightboxKeydown(e) {
  if (!fullscreen.value.show || markup.value.show) return;
  if (e.key === 'ArrowLeft') { e.preventDefault(); stepFullscreen(-1); }
  else if (e.key === 'ArrowRight') { e.preventDefault(); stepFullscreen(1); }
  else if (e.key === 'Escape') { e.preventDefault(); fullscreen.value.show = false; }
}
watch(() => fullscreen.value.show, (show) => {
  if (show) window.addEventListener('keydown', onLightboxKeydown);
  else window.removeEventListener('keydown', onLightboxKeydown);
});
onBeforeUnmount(() => window.removeEventListener('keydown', onLightboxKeydown));

// 手機左右滑動切換
let lbTouchX = null;
function onLightboxTouchStart(e) {
  lbTouchX = e.changedTouches?.[0]?.clientX ?? null;
}
function onLightboxTouchEnd(e) {
  if (lbTouchX === null) return;
  const dx = (e.changedTouches?.[0]?.clientX ?? lbTouchX) - lbTouchX;
  lbTouchX = null;
  if (Math.abs(dx) < 40) return;
  stepFullscreen(dx < 0 ? 1 : -1);
}

async function downloadFullscreen() {
  const item = fullscreenItem.value;
  if (!item) return;
  const url = imageItemUrl(item);
  const name = imageItemName(item);
  try {
    // 先嘗試以 blob 下載（可自訂檔名）；跨域失敗則直接開新分頁
    const res = await fetch(url, { mode: 'cors' });
    const blob = await res.blob();
    const objUrl = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = objUrl;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(objUrl), 2000);
  } catch (e) {
    window.open(url, '_blank', 'noopener');
  }
}

function openMarkup() {
  const item = fullscreenItem.value;
  if (!item || !canMarkup.value) return;
  markup.value = {
    show: true,
    url: imageItemUrl(item),
    name: imageItemName(item),
    mimeType: imageItemMime(item),
    canSave: true,
  };
}

/** 標記編輯器儲存：replace = 覆蓋原圖；new = 另存為同一則留言的新圖 */
async function handleMarkupSave({ blob, mode, filename, mimeType }) {
  const item = fullscreenItem.value;
  const source = fullscreen.value.source;
  if (!item || busy.value) return;
  const file = new File([blob], filename, { type: mimeType });

  // 待上傳圖片：直接替換／追加本地檔案，送出時才上傳
  if (source === 'pending') {
    const list = fullscreen.value.list;
    const newItem = {
      previewId: `pending_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      file,
      previewUrl: URL.createObjectURL(file),
    };
    if (mode === 'replace') {
      const idx = list.findIndex(p => p.previewId === item.previewId);
      if (idx !== -1) {
        try { URL.revokeObjectURL(list[idx].previewUrl); } catch (e) { /* noop */ }
        list.splice(idx, 1, newItem);
      }
    } else {
      list.push(newItem);
      fullscreen.value.index = list.length - 1;
    }
    markupRef.value?.markSavedAndClose();
    toast.success(mode === 'replace' ? '已套用標記' : '已新增標記後的圖片', { position: POSITION.BOTTOM_CENTER });
    return;
  }

  // 已儲存留言的圖片：上傳新圖 → 更新留言 → 覆蓋時清理舊檔
  const note = fullscreen.value.note;
  if (source !== 'note' || !note) return;
  busy.value = true;
  try {
    const [uploaded] = await uploadImages([{ file }]);
    const base = materializeNotes(props.notes, props.legacyRemarks);
    const target = base.find(n => n.noteId === note.noteId);
    if (!target) throw new Error('找不到原留言，可能已被刪除');
    const oldKey = item.path || item.url;
    const oldImages = target.images || [];
    let images;
    if (mode === 'replace') {
      images = oldImages.map(img => ((img.path || img.url) === oldKey ? uploaded : img));
      if (!images.some(img => img === uploaded)) images = [...oldImages, uploaded];
    } else {
      images = [...oldImages, uploaded];
    }
    const newNotes = base.map(n => n.noteId === note.noteId ? { ...n, images, updatedAt: Timestamp.now() } : n);
    await persist(newNotes);
    if (mode === 'replace' && item.path && item.path !== uploaded.path) {
      await deleteStorageImages([item]);
    }
    // 燈箱同步顯示新圖
    fullscreen.value.list = images;
    fullscreen.value.index = Math.max(0, images.findIndex(img => img === uploaded));
    fullscreen.value.note = { ...note, images };
    markupRef.value?.markSavedAndClose();
    toast.success(mode === 'replace' ? '標記已儲存並覆蓋原圖' : '已新增標記後的圖片', { position: POSITION.BOTTOM_CENTER });
  } catch (error) {
    console.error('儲存標記圖片失敗:', error);
    toast.error(`儲存失敗：${error.message}`, { position: POSITION.BOTTOM_CENTER });
  } finally {
    busy.value = false;
  }
}

// ---------- CRUD ----------
async function persist(newNotes) {
  await props.persistHandler(newNotes);
}

async function submitAdd() {
  if (!canSubmit.value || busy.value) return;
  busy.value = true;
  try {
    const images = pendingImages.value.length > 0 ? await uploadImages(pendingImages.value) : [];
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
  editKeptImages.value = [...(note.images || [])];
  editRemovedImages.value = [];
  revokePendingList(editPendingImages);
}

function cancelEdit() {
  editingNoteId.value = null;
  editContent.value = '';
  editKeptImages.value = [];
  editRemovedImages.value = [];
  revokePendingList(editPendingImages);
}

async function saveEdit(note) {
  if (!canSaveEdit.value || busy.value) return;
  busy.value = true;
  try {
    const uploaded = editPendingImages.value.length > 0 ? await uploadImages(editPendingImages.value) : [];
    const images = [...editKeptImages.value, ...uploaded];
    const removed = [...editRemovedImages.value];
    const base = materializeNotes(props.notes, props.legacyRemarks);
    const newNotes = base.map(n => n.noteId === note.noteId
      ? {
          ...n,
          content: editContent.value.trim(),
          category: n.type === 'user' ? (editCategory.value || 'general') : n.category,
          images,
          updatedAt: Timestamp.now(),
        }
      : n);
    await persist(newNotes);
    // 已從留言移除的既有圖片，儲存成功後再清理 Storage
    await deleteStorageImages(removed);
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
    await deleteStorageImages(note.images);
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
/* 燈箱 */
.rn-lightbox {
  --lb-font: -apple-system, BlinkMacSystemFont, "SF Pro Text", "PingFang TC", "Helvetica Neue", "Noto Sans TC", sans-serif;
  font-family: var(--lb-font);
  display: flex;
  flex-direction: column;
  max-height: 88vh;
  border-radius: 12px;
  overflow: hidden;
  background: #1c1c1e;
  box-shadow: 0 30px 80px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.08);
}
.rn-lb-bar {
  position: relative;
  display: flex;
  align-items: center;
  height: 40px;
  padding: 0 10px 0 12px;
  background: rgba(40, 40, 42, 0.92);
  backdrop-filter: saturate(180%) blur(20px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  flex-shrink: 0;
}
.rn-lb-lights { display: flex; gap: 8px; z-index: 1; }
.rn-lb-light {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  border: 1px solid rgba(0, 0, 0, 0.3);
  padding: 0;
  cursor: pointer;
}
.rn-lb-light--close { background: #ff5f57; }
.rn-lb-title {
  position: absolute;
  left: 0;
  right: 0;
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 8px;
  pointer-events: none;
  color: rgba(255, 255, 255, 0.85);
  font-size: 13px;
  font-weight: 600;
}
.rn-lb-name {
  max-width: 40vw;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.rn-lb-count { font-size: 11px; color: rgba(255, 255, 255, 0.5); font-variant-numeric: tabular-nums; }
.rn-lb-actions { margin-left: auto; display: flex; gap: 4px; z-index: 1; }
.rn-lb-btn {
  height: 26px;
  min-width: 28px;
  padding: 0 6px;
  border: none;
  border-radius: 6px;
  background: rgba(255, 255, 255, 0.1);
  color: rgba(255, 255, 255, 0.85);
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-family: var(--lb-font);
  font-size: 12px;
  font-weight: 500;
}
.rn-lb-btn:hover { background: rgba(255, 255, 255, 0.18); }
.rn-lb-btn--primary {
  background: #0a84ff;
  color: #fff;
  padding: 0 10px;
}
.rn-lb-btn--primary:hover { background: #2f8dff; }
.rn-lb-body {
  position: relative;
  flex: 1;
  min-height: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 12px 56px 24px;
  overflow: hidden;
  touch-action: pan-y;
}
.rn-lb-nav {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  width: 40px;
  height: 64px;
  border: none;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.1);
  color: rgba(255, 255, 255, 0.9);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0.55;
  transition: opacity 0.15s, background 0.15s;
  backdrop-filter: blur(6px);
}
.rn-lb-nav:hover { opacity: 1; background: rgba(255, 255, 255, 0.22); }
.rn-lb-nav--prev { left: 10px; }
.rn-lb-nav--next { right: 10px; }
.rn-lb-dots {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 8px;
  display: flex;
  justify-content: center;
  gap: 6px;
}
.rn-lb-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.35);
  cursor: pointer;
  transition: background 0.15s, transform 0.15s;
}
.rn-lb-dot--active { background: #fff; transform: scale(1.25); }
@media (max-width: 600px) {
  .rn-lb-body { padding: 8px 8px 24px; }
  .rn-lb-nav { width: 32px; height: 52px; opacity: 0.8; }
  .rn-lb-nav--prev { left: 4px; }
  .rn-lb-nav--next { right: 4px; }
}
.rn-lb-img {
  max-width: 100%;
  max-height: calc(88vh - 76px);
  object-fit: contain;
  border-radius: 4px;
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.5);
  cursor: pointer;
  animation: rn-lb-fade 0.18s ease-out;
}
@keyframes rn-lb-fade {
  from { opacity: 0; transform: scale(0.985); }
  to { opacity: 1; transform: scale(1); }
}
.rn-pending-thumb--new {
  outline: 2px dashed rgba(25, 118, 210, 0.6);
  outline-offset: 1px;
  border-radius: 4px;
}
</style>

<style>
.rn-lightbox-dialog {
  box-shadow: none !important;
  overflow: visible !important;
}
</style>
