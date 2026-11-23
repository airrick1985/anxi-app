<template>
  <v-dialog :model-value="modelValue" fullscreen transition="dialog-bottom-transition" @update:model-value="onDialogUpdate">
    <div class="amv">
      <ActivityGallery
        v-if="mode === 'gallery'"
        v-model:cell-size="cellSize"
        :items="visibleItems"
        :loading="loading"
        :project-name="projectName"
        :can-manage="canUpload"
        :compact="compact"
        @open="openSingle($event, 'gallery')"
        @manage="openManager()"
        @close="close"
      />

      <ActivitySingle
        v-else-if="mode === 'single'"
        v-model:current-id="currentId"
        v-model:sidebar-open="sidebarOpen"
        v-model:sidebar-width="sidebarWidth"
        :items="singleItems"
        :back-label="backLabel"
        :can-manage="canUpload"
        :manage-context="returnTo === 'manage'"
        :compact="compact"
        :keys-disabled="pageEditor.open"
        @back="goBack"
        @manage="openManager"
        @close="close"
      />

      <ActivityManager
        v-else
        ref="managerRef"
        v-model:selected-ids="selectedIds"
        v-model:cell-size="cellSize"
        :items="messages"
        :project-id="projectId"
        :project-name="projectName"
        :uploads="uploads"
        :replacing-id="replacingId"
        :compact="compact"
        :docked="docked"
        :keys-disabled="pageEditor.open"
        @upload="addFiles"
        @remove-upload="removeUpload"
        @retry-upload="retryUpload"
        @replace="replaceFile"
        @reorder="reorder"
        @view="openSingle($event, 'manage')"
        @edit-page="openPageEditor"
        @done="leaveManager"
      />
    </div>

    <ActivityCanvasEditor
      v-if="pageEditor.open"
      :project-id="projectId"
      :page="pageEditor.page"
      @close="pageEditor.open = false"
      @saved="onPageSaved"
    />
  </v-dialog>
</template>

<script setup>
/**
 * 活動訊息：總覽牆（gallery）→ 單張（single）；有權限者可進管理（manage）
 * 從報價單設定頁點釘選縮圖（initialId）直接開單張
 */
import { ref, computed, watch, onUnmounted, defineAsyncComponent } from 'vue';
import { useDisplay } from 'vuetify';
import { useToast } from 'vue-toastification';
import { listenToActivityMessages, updateActivityMessagesOrder } from '@/api';
import { useActivityFiles } from '@/composables/useActivityFiles';
import ActivityGallery from '@/components/activity/ActivityGallery.vue';
import '@/styles/activityViewer.css';

const ActivitySingle = defineAsyncComponent(() => import('@/components/activity/ActivitySingle.vue'));
// 管理與頁面編輯器只有管理者用到才載入
const ActivityManager = defineAsyncComponent(() => import('@/components/activity/ActivityManager.vue'));
const ActivityCanvasEditor = defineAsyncComponent(() => import('@/components/ActivityCanvasEditor.vue'));

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  projectId: { type: String, required: true },
  projectName: { type: String, default: '' },
  canUpload: { type: Boolean, default: false },
  // 開啟時直接放大指定的一則；找不到則顯示總覽
  initialId: { type: String, default: '' },
});
const emit = defineEmits(['update:modelValue']);

const toast = useToast();
const { width } = useDisplay();
const compact = computed(() => width.value < 768);
const docked = computed(() => width.value >= 900);

// ---------- 個人介面設定（只存在這台裝置） ----------
const PREFS_KEY = 'anxi.activityViewer';
function readPrefs() {
  try { return JSON.parse(localStorage.getItem(PREFS_KEY)) || {}; } catch (e) { return {}; }
}
const prefs = readPrefs();
const cellSize = ref(Number(prefs.cellSize) || 200);
const sidebarOpen = ref(prefs.sidebarOpen !== false);
const sidebarWidth = ref(Number(prefs.sidebarWidth) || 200);
watch([cellSize, sidebarOpen, sidebarWidth], () => {
  try {
    localStorage.setItem(PREFS_KEY, JSON.stringify({
      cellSize: cellSize.value, sidebarOpen: sidebarOpen.value, sidebarWidth: sidebarWidth.value,
    }));
  } catch (e) { /* 無法寫入時略過 */ }
});

// ---------- 資料 ----------
const messages = ref([]);
const loading = ref(false);
const visibleItems = computed(() => messages.value.filter(m => !m.hidden));
let unsubscribe = null;
let firstSnapshot = true;

function startListening() {
  stopListening();
  if (!props.projectId) return;
  loading.value = true;
  firstSnapshot = true;
  unsubscribe = listenToActivityMessages(
    props.projectId,
    (items) => {
      messages.value = items;
      loading.value = false;
      if (firstSnapshot) {
        firstSnapshot = false;
        enterFirstView();
      }
      afterSnapshot();
    },
    (error) => {
      toast.error(`載入活動訊息失敗：${error.message}`);
      loading.value = false;
    }
  );
}
function stopListening() {
  unsubscribe?.();
  unsubscribe = null;
  messages.value = [];
}

// ---------- 畫面切換 ----------
const mode = ref('gallery'); // gallery｜single｜manage
const currentId = ref('');
const returnTo = ref(''); // 單張要返回哪裡：gallery｜manage
const enteredDirect = ref(false); // 直接開單張（釘選縮圖／只有一則）
const selectedIds = ref([]);
const managerRef = ref(null);

const singleItems = computed(() => (returnTo.value === 'manage' ? messages.value : visibleItems.value));
const backLabel = computed(() => {
  if (returnTo.value === 'manage') return '管理';
  return visibleItems.value.length > 1 ? '總覽' : '';
});

function enterFirstView() {
  if (mode.value !== 'gallery') return;
  const list = visibleItems.value;
  const target = list.find(m => m.id === props.initialId) || (list.length === 1 ? list[0] : null);
  if (!target) return;
  openSingle(target.id, 'gallery');
  enteredDirect.value = true;
}

// 看到一半那則被刪除或隱藏：停在原位置的下一則；全沒了就回上一層
function afterSnapshot() {
  if (mode.value !== 'single') return;
  const list = singleItems.value;
  if (list.some(m => m.id === currentId.value)) {
    lastIndex = list.findIndex(m => m.id === currentId.value);
    return;
  }
  if (list.length) currentId.value = list[Math.min(lastIndex, list.length - 1)].id;
  else mode.value = returnTo.value || 'gallery';
}
let lastIndex = 0;
watch(currentId, (id) => { lastIndex = Math.max(0, singleItems.value.findIndex(m => m.id === id)); });

function openSingle(id, from) {
  returnTo.value = from;
  enteredDirect.value = false;
  currentId.value = id;
  mode.value = 'single';
}
function goBack() {
  if (returnTo.value === 'manage') selectedIds.value = currentId.value ? [currentId.value] : [];
  mode.value = returnTo.value || 'gallery';
}
function openManager(id) {
  if (!props.canUpload) return;
  selectedIds.value = id ? [id] : [];
  mode.value = 'manage';
  backfillCovers(() => messages.value);
}
function leaveManager() {
  selectedIds.value = [];
  mode.value = 'gallery';
}
function close() {
  emit('update:modelValue', false);
}
// Esc／返回鍵：一層一層退回，最外層才關閉
function onDialogUpdate(open) {
  if (open) {
    emit('update:modelValue', true);
    return;
  }
  if (mode.value === 'single' && !enteredDirect.value) goBack();
  else if (mode.value === 'manage') {
    if (!managerRef.value?.handleEscape()) leaveManager();
  } else close();
}

// ---------- 管理 ----------
const { uploads, isUploading, addFiles, removeUpload, retryUpload, replaceFile, replacingId, backfillCovers } = useActivityFiles(
  () => props.projectId,
  (id) => {
    // 一批檔案上傳完，選取第一個完成的方便接著補標題
    if (mode.value === 'manage' && !selectedIds.value.length) selectedIds.value = [id];
  }
);

async function reorder(list) {
  const before = messages.value;
  messages.value = list;
  try {
    await updateActivityMessagesOrder(list.map(m => m.id));
  } catch (err) {
    messages.value = before;
    toast.error(`排序儲存失敗：${err.message}`);
  }
}

const pageEditor = ref({ open: false, page: null });
function openPageEditor(page) {
  pageEditor.value = { open: true, page: page || null };
}
function onPageSaved(id) {
  if (!id) return;
  selectedIds.value = [id];
  managerRef.value?.reveal(id);
}

// 上傳中關閉分頁會中斷，先提醒
function onBeforeUnload(e) {
  if (isUploading.value) e.preventDefault();
}
window.addEventListener('beforeunload', onBeforeUnload);

watch(
  () => [props.modelValue, props.projectId].join('|'),
  () => {
    if (props.modelValue) {
      mode.value = 'gallery';
      currentId.value = '';
      returnTo.value = '';
      enteredDirect.value = false;
      selectedIds.value = [];
      startListening();
    } else {
      pageEditor.value = { open: false, page: null };
      stopListening();
    }
  },
  { immediate: true }
);

onUnmounted(() => {
  stopListening();
  window.removeEventListener('beforeunload', onBeforeUnload);
});
</script>
