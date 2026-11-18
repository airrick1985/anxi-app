<template>
  <div class="uig" :class="{ 'is-editable': editable, 'is-empty': !images.length }" v-file-drop="dropConfig">
    <template v-if="images.length">
      <!-- 主圖：點擊全螢幕；銷控模式滑過浮出工具列 -->
      <div class="uig-stage">
        <v-carousel v-model="current" height="auto" hide-delimiters show-arrows="hover" class="uig-carousel">
          <v-carousel-item v-for="image in images" :key="image.id">
            <v-img :src="image.downloadURL" class="uig-main-img" contain
              @load="thumbsReady = true" @error="thumbsReady = true"
              @click="emit('open-fullscreen')"></v-img>
          </v-carousel-item>
        </v-carousel>

        <div v-if="currentImage" class="uig-caption">
          <span class="uig-caption-name">{{ currentImage.imageName }}</span>
          <span v-if="images.length > 1" class="uig-caption-count">{{ current + 1 }} / {{ images.length }}</span>
        </div>

        <div v-if="editable && currentImage" class="uig-toolbar">
          <button type="button" class="uig-tool" title="更換圖片" :disabled="!!busy" @click="pickReplace">
            <v-icon size="17">mdi-image-refresh-outline</v-icon><span class="uig-tool-label">更換</span>
          </button>
          <span class="uig-tool-sep"></span>
          <button type="button" class="uig-tool uig-tool--danger" title="移除圖片" :disabled="!!busy" @click="askRemove">
            <v-icon size="17">mdi-trash-can-outline</v-icon><span class="uig-tool-label">移除</span>
          </button>
        </div>

        <div v-if="busy" class="uig-busy">
          <v-progress-circular indeterminate size="22" width="2" color="#1d1d1f"></v-progress-circular>
          <span>{{ busy }}</span>
        </div>
      </div>

      <!-- 縮圖列：點選切換；銷控模式可拖曳排序（放下即存），最後一格新增 -->
      <draggable
        :model-value="images"
        item-key="id"
        tag="div"
        class="uig-strip"
        ghost-class="uig-thumb--ghost"
        :disabled="!editable || !!busy || images.length < 2"
        :animation="180"
        :delay="200"
        :delay-on-touch-only="true"
        @update:model-value="onSorted"
      >
        <template #item="{ element, index }">
          <button
            type="button"
            class="uig-thumb"
            :class="{ 'is-active': index === current }"
            :title="element.imageName"
            @click="current = index"
          >
            <img v-if="thumbsReady" :src="element.downloadURL" :alt="element.imageName" draggable="false" />
          </button>
        </template>
        <template #footer>
          <v-menu v-if="editable" location="bottom start" content-class="mac-menu">
            <template #activator="{ props: menuProps }">
              <button type="button" class="uig-add" title="新增圖片" :disabled="!!busy" v-bind="menuProps">
                <v-icon size="20">mdi-plus</v-icon>
              </button>
            </template>
            <v-list density="compact">
              <v-list-item prepend-icon="mdi-tray-arrow-up" title="上傳圖片" @click="openUpload()"></v-list-item>
              <v-list-item prepend-icon="mdi-image-multiple-outline" title="從圖庫挑選" @click="openPicker"></v-list-item>
            </v-list>
          </v-menu>
        </template>
      </draggable>
    </template>

    <!-- 尚無圖片 -->
    <div v-else class="uig-empty">
      <v-icon size="40">mdi-image-multiple-outline</v-icon>
      <div class="uig-empty-title">此戶別尚無圖片</div>
      <div v-if="editable" class="uig-empty-actions">
        <button type="button" class="mac-btn mac-btn--primary" :disabled="!!busy" @click="openUpload()">
          <v-icon size="16">mdi-tray-arrow-up</v-icon>上傳圖片
        </button>
        <button type="button" class="mac-btn" :disabled="!!busy" @click="openPicker">
          <v-icon size="16">mdi-image-multiple-outline</v-icon>從圖庫挑選
        </button>
      </div>
      <div v-if="busy" class="uig-busy">
        <v-progress-circular indeterminate size="22" width="2" color="#1d1d1f"></v-progress-circular>
        <span>{{ busy }}</span>
      </div>
    </div>

    <input ref="replaceInput" type="file" :accept="SALES_IMAGE_ACCEPT" hidden @change="onReplaceInput" />

    <template v-if="editable">
      <SalesImageUploadDialog
        ref="uploadDialogRef"
        v-model="uploadOpen"
        :project-id="projectId"
        :existing-names="libraryNames"
        :title="`上傳圖片到 ${unitId}`"
        :allow-replace="false"
        @uploaded="onUploaded"
      />

      <SalesImagePickerDialog
        v-model="pickerOpen"
        :images="library"
        :usage="usage"
        :added-names="names"
        :saving="pickerSaving"
        @confirm="onPicked"
      />

      <!-- 更換：多戶共用時選擇範圍 -->
      <v-dialog v-model="replacing.open" max-width="460" content-class="mac-dialog-fit" :persistent="!!busy">
        <v-card class="mac-sheet">
          <div class="mac-sheet-head">
            <v-icon size="18">mdi-image-refresh-outline</v-icon>更換圖片
            <button type="button" class="mac-sheet-close" title="關閉" @click="closeReplace">
              <v-icon size="18">mdi-close</v-icon>
            </button>
          </div>
          <div class="mac-sheet-section">
            <div class="uig-swap">
              <div class="uig-swap-img"><img :src="replacing.image?.downloadURL" alt="" /></div>
              <v-icon size="20" class="uig-swap-arrow">mdi-arrow-right</v-icon>
              <div class="uig-swap-img"><img v-if="replacing.previewUrl" :src="replacing.previewUrl" alt="" /></div>
            </div>
            <div class="uig-dlg-title">「{{ replacing.image?.imageName }}」另有 {{ replacing.others.length }} 戶使用</div>
            <div class="uig-units">
              <span v-for="u in replacing.others.slice(0, UNIT_PREVIEW)" :key="u" class="mac-tag">{{ u }}</span>
              <span v-if="replacing.others.length > UNIT_PREVIEW" class="uig-more">等 {{ replacing.others.length }} 戶</span>
            </div>
          </div>
          <div class="mac-sheet-foot">
            <button type="button" class="mac-btn" @click="closeReplace">取消</button>
            <span class="mac-spacer"></span>
            <button type="button" class="mac-btn" @click="confirmReplace('unit')">只換 {{ unitId }}</button>
            <button type="button" class="mac-btn mac-btn--primary" @click="confirmReplace('all')">
              全部 {{ replacing.others.length + 1 }} 戶一起換
            </button>
          </div>
        </v-card>
      </v-dialog>

      <!-- 移除確認 -->
      <v-dialog v-model="removal.open" max-width="440" content-class="mac-dialog-fit" :persistent="removal.saving">
        <v-card class="mac-sheet">
          <div class="mac-sheet-head">
            <v-icon size="18">mdi-trash-can-outline</v-icon>移除圖片
            <button type="button" class="mac-sheet-close" title="關閉" :disabled="removal.saving" @click="removal.open = false">
              <v-icon size="18">mdi-close</v-icon>
            </button>
          </div>
          <div class="mac-sheet-section uig-remove">
            <div class="uig-remove-img"><img :src="removal.image?.downloadURL" alt="" /></div>
            <div class="uig-remove-main">
              <div class="uig-dlg-title">從 {{ unitId }} 移除「{{ removal.image?.imageName }}」？</div>
              <div v-if="removal.others.length" class="mac-sheet-note">另有 {{ removal.others.length }} 戶使用，圖庫保留此圖</div>
              <div v-else class="mac-callout mac-callout--warning uig-remove-note">
                <v-icon size="16">mdi-alert</v-icon>沒有其他戶使用，圖檔將一併刪除
              </div>
            </div>
          </div>
          <div class="mac-sheet-foot">
            <span class="mac-spacer"></span>
            <button type="button" class="mac-btn" :disabled="removal.saving" @click="removal.open = false">取消</button>
            <button type="button" class="mac-btn mac-btn--danger-fill" :disabled="removal.saving" @click="executeRemove">
              <v-progress-circular v-if="removal.saving" indeterminate size="14" width="2"></v-progress-circular>移除
            </button>
          </div>
        </v-card>
      </v-dialog>
    </template>
  </div>
</template>

<script setup>
import { ref, reactive, computed, watch, onUnmounted } from 'vue';
import draggable from 'vuedraggable';
import { useToast } from 'vue-toastification';
import { db } from '@/firebase';
import { doc, updateDoc, arrayUnion, arrayRemove, serverTimestamp } from 'firebase/firestore';
import { saveSalesImage, deleteSalesImages, fetchSalesHouseholdsOnce } from '@/api.js';
import { shrinkImageToLimit } from '@/utils/canvasCompress';
import {
  SALES_IMAGE_ACCEPT, SALES_IMAGE_MAX_BYTES, buildImageUsage, readImageSize, fileToBase64, uniqueImageName,
} from '@/utils/salesImages';
import SalesImageUploadDialog from './SalesImageUploadDialog.vue';
import SalesImagePickerDialog from './SalesImagePickerDialog.vue';

const props = defineProps({
  projectId: { type: String, required: true },
  unitId: { type: String, required: true },
  // 本戶引用的圖片名稱（salesHouseholds.salesImages）
  names: { type: Array, default: () => [] },
  // 建案圖庫（salesImages）
  library: { type: Array, default: () => [] },
  // 全案戶別（算其他戶是否共用）；未提供時需要時才讀一次
  households: { type: Array, default: () => [] },
  editable: { type: Boolean, default: false },
  index: { type: Number, default: 0 },
});
const emit = defineEmits(['update:names', 'update:index', 'open-fullscreen']);

const toast = useToast();
const UNIT_PREVIEW = 12;
const ACCEPTED_TYPES = SALES_IMAGE_ACCEPT.split(',');

// ── 顯示 ──
const images = computed(() => {
  const map = new Map(props.library.map(img => [img.imageName, img]));
  return props.names.map(name => map.get(name)).filter(img => img?.downloadURL);
});
const current = computed({
  get: () => Math.min(props.index, Math.max(0, images.value.length - 1)),
  set: v => emit('update:index', v),
});
const currentImage = computed(() => images.value[current.value] || null);
const libraryNames = computed(() => props.library.map(img => img.imageName).filter(Boolean));

// 縮圖與主圖同一原檔：等主圖載入完（或最多 1.5 秒）才載入縮圖，避免開啟時同時下載多張大圖
const thumbsReady = ref(false);
let thumbsTimer = null;
watch(() => props.unitId, () => {
  thumbsReady.value = false;
  clearTimeout(thumbsTimer);
  thumbsTimer = setTimeout(() => { thumbsReady.value = true; }, 1500);
}, { immediate: true });

// 圖片數變少時（移除）索引不可超出範圍
watch(() => images.value.length, (len) => {
  if (props.index > 0 && props.index >= len) emit('update:index', Math.max(0, len - 1));
});

// 新增／另存的圖片可能稍後才出現在圖庫（即時監聽），出現時切換過去
const focusName = ref('');
watch([images, focusName], () => {
  if (!focusName.value) return;
  const i = images.value.findIndex(img => img.imageName === focusName.value);
  if (i >= 0) {
    emit('update:index', i);
    focusName.value = '';
  }
});

// ── 共用戶別 ──
const fetchedHouseholds = ref(null);
const householdList = computed(() => (props.households.length ? props.households : (fetchedHouseholds.value || [])));
const usage = computed(() => buildImageUsage(householdList.value));
async function ensureHouseholds() {
  if (props.households.length || fetchedHouseholds.value) return;
  try {
    fetchedHouseholds.value = await fetchSalesHouseholdsOnce(props.projectId);
  } catch (e) {
    console.error('[UnitImageGallery] 讀取戶別失敗', e);
  }
}
watch(() => props.projectId, () => { fetchedHouseholds.value = null; });
const otherUnits = name => (usage.value.get(name) || []).filter(u => u !== props.unitId);

// ── 寫入本戶 ──
const busy = ref('');
const unitRef = () => doc(db, 'salesHouseholds', `${props.projectId}_${props.unitId}`);

async function addNames(list) {
  const fresh = [...new Set(list)].filter(n => n && !props.names.includes(n));
  if (!fresh.length) return;
  await updateDoc(unitRef(), { salesImages: arrayUnion(...fresh), updatedAt: serverTimestamp() });
  emit('update:names', [...props.names, ...fresh]);
  focusName.value = fresh[0];
}

// 拖曳排序：放下即存；圖庫找不到的名稱（缺圖）維持在最後
async function onSorted(list) {
  const prev = props.names.slice();
  const shown = list.map(img => img.imageName);
  const next = [...shown, ...prev.filter(n => !shown.includes(n))];
  if (next.every((n, i) => n === prev[i])) return;
  const activeName = currentImage.value?.imageName;
  emit('update:names', next);
  const i = shown.indexOf(activeName);
  if (i >= 0) emit('update:index', i);
  try {
    await updateDoc(unitRef(), { salesImages: next, updatedAt: serverTimestamp() });
  } catch (e) {
    emit('update:names', prev);
    toast.error(`排序儲存失敗：${e.message}`);
  }
}

// ── 新增：上傳 ──
const uploadOpen = ref(false);
const uploadDialogRef = ref(null);
function openUpload(files) {
  if (busy.value) return;
  uploadOpen.value = true;
  if (files?.length) uploadDialogRef.value?.addFiles(files);
}
const dropConfig = computed(() => (props.editable && !busy.value
  ? { accept: SALES_IMAGE_ACCEPT, multiple: true, onFiles: files => openUpload(files) }
  : false));
async function onUploaded(_count, uploadedNames) {
  try {
    await addNames(uploadedNames || []);
  } catch (e) {
    toast.error(`加入 ${props.unitId} 失敗：${e.message}`);
  }
}

// ── 新增：圖庫挑選 ──
const pickerOpen = ref(false);
const pickerSaving = ref(false);
function openPicker() {
  if (busy.value) return;
  ensureHouseholds();
  pickerOpen.value = true;
}
async function onPicked(list) {
  pickerSaving.value = true;
  try {
    await addNames(list);
    toast.success(`已加入 ${list.length} 張圖片`);
    pickerOpen.value = false;
  } catch (e) {
    toast.error(`加入失敗：${e.message}`);
  } finally {
    pickerSaving.value = false;
  }
}

// ── 更換 ──
const replaceInput = ref(null);
const replacing = reactive({ open: false, image: null, file: null, previewUrl: '', others: [] });
function pickReplace() {
  if (busy.value || !currentImage.value) return;
  replacing.image = currentImage.value;
  replaceInput.value?.click();
}
async function onReplaceInput(e) {
  const file = e.target.files?.[0];
  e.target.value = '';
  const image = replacing.image;
  if (!file || !image) return;
  if (!ACCEPTED_TYPES.includes(file.type)) {
    toast.error('僅支援 PNG、JPG、WEBP');
    return;
  }
  busy.value = '準備中…';
  await ensureHouseholds();
  busy.value = '';
  const others = otherUnits(image.imageName);
  if (!others.length) {
    doReplace(image, file, 'all', 0);
    return;
  }
  revokePreview();
  Object.assign(replacing, { open: true, image, file, previewUrl: URL.createObjectURL(file), others });
}
function revokePreview() {
  if (replacing.previewUrl) URL.revokeObjectURL(replacing.previewUrl);
  replacing.previewUrl = '';
}
function closeReplace() {
  replacing.open = false;
  replacing.file = null;
  revokePreview();
}
function confirmReplace(scope) {
  const { image, file, others } = replacing;
  closeReplace();
  if (image && file) doReplace(image, file, scope, others.length);
}
async function doReplace(image, file, scope, othersCount) {
  busy.value = '更換中…';
  try {
    const upload = await shrinkImageToLimit(file, SALES_IMAGE_MAX_BYTES);
    const size = await readImageSize(upload);
    if (!size) throw new Error('無法讀取這張圖片');
    const payload = {
      projectId: props.projectId,
      fileName: upload.name,
      contentType: upload.type,
      fileBase64: await fileToBase64(upload),
      width: size.width,
      height: size.height,
    };
    if (scope === 'all') {
      await saveSalesImage({ ...payload, docId: image.id });
      toast.success(othersCount ? `已更換「${image.imageName}」（${othersCount + 1} 戶）` : `已更換「${image.imageName}」`);
      return;
    }
    // 只換本戶：另存一張新圖，本戶改引用新名稱（位置不變）
    const newName = uniqueImageName(`${image.imageName} (${props.unitId})`, new Set(libraryNames.value));
    await saveSalesImage({ ...payload, imageName: newName });
    const next = props.names.map(n => (n === image.imageName ? newName : n));
    await updateDoc(unitRef(), { salesImages: next, updatedAt: serverTimestamp() });
    emit('update:names', next);
    focusName.value = newName;
    toast.success(`已另存為「${newName}」`);
  } catch (e) {
    toast.error(`更換失敗：${e.message}`);
  } finally {
    busy.value = '';
  }
}

// ── 移除 ──
const removal = reactive({ open: false, image: null, others: [], saving: false });
async function askRemove() {
  const image = currentImage.value;
  if (busy.value || !image) return;
  busy.value = '準備中…';
  await ensureHouseholds();
  busy.value = '';
  Object.assign(removal, { open: true, image, others: otherUnits(image.imageName), saving: false });
}
async function executeRemove() {
  const { image } = removal;
  if (!image || removal.saving) return;
  removal.saving = true;
  try {
    await updateDoc(unitRef(), { salesImages: arrayRemove(image.imageName), updatedAt: serverTimestamp() });
    emit('update:names', props.names.filter(n => n !== image.imageName));
    let fileDeleted = false;
    if (!removal.others.length) {
      // 刪檔前以最新資料再確認沒有任何戶別引用
      const fresh = await fetchSalesHouseholdsOnce(props.projectId);
      const stillUsed = fresh.some(h => Array.isArray(h.salesImages) && h.salesImages.includes(image.imageName));
      if (!stillUsed) {
        const res = await deleteSalesImages(props.projectId, [image.id]);
        fileDeleted = !res?.failed?.length;
      }
    }
    toast.success(fileDeleted ? `已移除並刪除「${image.imageName}」` : `已從 ${props.unitId} 移除「${image.imageName}」`);
    removal.open = false;
  } catch (e) {
    toast.error(`移除失敗：${e.message}`);
  } finally {
    removal.saving = false;
  }
}

onUnmounted(() => {
  clearTimeout(thumbsTimer);
  revokePreview();
});
</script>

<style scoped>
.uig {
  position: relative;
  border-radius: 12px;
  overflow: hidden;
  background: #f5f5f7;
  box-shadow: 0 0 0 0.5px rgba(0, 0, 0, 0.12), 0 1px 3px rgba(0, 0, 0, 0.05);
  font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", "Helvetica Neue", "PingFang TC", "Noto Sans TC", sans-serif;
}

.uig.is-empty { height: 100%; }

/* 主圖 */
.uig-stage { position: relative; }
.uig-main-img {
  height: 40vh;
  min-height: 250px;
  background-color: #e8eaed; /* 淺灰白：讓白底圖片與背景有區隔 */
  cursor: zoom-in;
}

/* 毛玻璃浮層（名稱／工具列） */
.uig-caption,
.uig-toolbar {
  position: absolute;
  z-index: 2;
  display: flex;
  align-items: center;
  background: rgba(255, 255, 255, 0.78);
  -webkit-backdrop-filter: saturate(180%) blur(14px);
  backdrop-filter: saturate(180%) blur(14px);
  box-shadow: 0 0 0 0.5px rgba(0, 0, 0, 0.12), 0 2px 8px rgba(0, 0, 0, 0.12);
}
.uig-caption {
  left: 10px;
  bottom: 10px;
  max-width: calc(100% - 20px);
  gap: 8px;
  padding: 4px 10px;
  border-radius: 8px;
  font-size: 12px;
  color: #1d1d1f;
  pointer-events: none;
}
.uig-caption-name { font-weight: 600; overflow-wrap: anywhere; line-height: 1.35; }
.uig-caption-count { flex-shrink: 0; color: #6e6e73; font-variant-numeric: tabular-nums; }

.uig-toolbar {
  top: 10px;
  right: 10px;
  gap: 2px;
  padding: 3px;
  border-radius: 9px;
  opacity: 0;
  transform: translateY(-4px);
  transition: opacity 0.16s ease, transform 0.16s ease;
}
.uig-stage:hover .uig-toolbar,
.uig-toolbar:focus-within { opacity: 1; transform: none; }
.uig-tool {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  height: 28px;
  padding: 0 9px;
  border: 0;
  border-radius: 6px;
  background: transparent;
  color: #1d1d1f;
  font-family: inherit;
  font-size: 12.5px;
  font-weight: 500;
  white-space: nowrap;
  cursor: pointer;
  transition: background-color 0.12s;
}
.uig-tool:hover:not(:disabled) { background: rgba(0, 0, 0, 0.07); }
.uig-tool:disabled { opacity: 0.45; cursor: default; }
.uig-tool .v-icon { color: #3a3a3c; }
.uig-tool--danger,
.uig-tool--danger .v-icon { color: #d62d20; }
.uig-tool--danger:hover:not(:disabled) { background: rgba(214, 45, 32, 0.1); }
.uig-tool-sep { width: 1px; height: 16px; background: rgba(0, 0, 0, 0.12); }

.uig-busy {
  position: absolute;
  inset: 0;
  z-index: 3;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  background: rgba(245, 245, 247, 0.72);
  -webkit-backdrop-filter: blur(4px);
  backdrop-filter: blur(4px);
  font-size: 13px;
  color: #1d1d1f;
}

/* 縮圖列 */
.uig-strip {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px;
  overflow-x: auto;
  border-top: 1px solid rgba(0, 0, 0, 0.06);
  background: rgba(255, 255, 255, 0.6);
}
.uig-strip::-webkit-scrollbar { height: 6px; }
.uig-strip::-webkit-scrollbar-thumb { background-color: rgba(0, 0, 0, 0.18); border-radius: 3px; }
.uig-thumb,
.uig-add {
  flex-shrink: 0;
  width: 80px;
  height: 52px;
  border-radius: 7px;
}
.uig-thumb {
  position: relative;
  padding: 0;
  border: 0;
  overflow: hidden;
  background: #e8eaed;
  box-shadow: 0 0 0 0.5px rgba(0, 0, 0, 0.14);
  cursor: pointer;
  transition: box-shadow 0.12s, transform 0.12s;
}
.uig.is-editable .uig-thumb { cursor: grab; }
.uig-thumb img { width: 100%; height: 100%; object-fit: cover; display: block; pointer-events: none; }
.uig-thumb:hover { box-shadow: 0 0 0 2px rgba(0, 113, 227, 0.4); }
.uig-thumb.is-active { box-shadow: 0 0 0 2.5px #0071e3; }
.uig-thumb--ghost { opacity: 0.35; }
/* 新增鈕固定在縮圖列右側，縮圖多時不會被捲出畫面 */
.uig-add {
  position: sticky;
  right: 0;
  z-index: 1;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 1.5px dashed rgba(0, 0, 0, 0.2);
  background: #fbfbfd;
  box-shadow: -10px 0 8px -2px rgba(251, 251, 253, 0.95);
  color: #6e6e73;
  cursor: pointer;
  transition: background-color 0.12s, border-color 0.12s, color 0.12s;
}
.uig-add:hover:not(:disabled) { border-color: #0071e3; color: #0071e3; background: #eef5fe; }
.uig-add:disabled { opacity: 0.45; cursor: default; }

/* 尚無圖片 */
.uig-empty {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  min-height: 250px;
  height: 100%;
  padding: 24px 16px;
  color: #8e8e93;
}
.uig-empty-title { font-size: 14px; color: #6e6e73; }
.uig-empty-actions { display: flex; flex-wrap: wrap; justify-content: center; gap: 8px; margin-top: 4px; }

/* 對話框內容 */
.uig-dlg-title { font-size: 14px; font-weight: 600; color: #1d1d1f; line-height: 1.45; overflow-wrap: anywhere; }
.uig-swap {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  margin-bottom: 12px;
}
.uig-swap-img,
.uig-remove-img {
  flex-shrink: 0;
  width: 120px;
  height: 84px;
  border-radius: 8px;
  overflow: hidden;
  background: #e8eaed;
  box-shadow: 0 0 0 0.5px rgba(0, 0, 0, 0.12);
}
.uig-swap-img img,
.uig-remove-img img { width: 100%; height: 100%; object-fit: contain; display: block; }
.uig-swap-arrow { color: #8e8e93; }
.uig-units { display: flex; flex-wrap: wrap; align-items: center; gap: 4px; margin-top: 8px; }
.uig-more { font-size: 12px; color: #6e6e73; }
.uig-remove { display: flex; align-items: flex-start; gap: 12px; }
.uig-remove-img { width: 88px; height: 62px; }
.uig-remove-main { display: flex; flex-direction: column; gap: 6px; min-width: 0; }
.uig-remove-note { margin: 0; }

/* 觸控裝置沒有滑過：工具列常駐 */
@media (hover: none) {
  .uig-toolbar { opacity: 1; transform: none; }
}
@media (max-width: 600px) {
  .uig-thumb,
  .uig-add { width: 72px; height: 48px; }
  .uig-swap-img { width: 104px; height: 74px; }
}
</style>
