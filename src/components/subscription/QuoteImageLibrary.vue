<template>
  <div>
    <UploadDropZone :accept="ACCEPT" :mac="mac" block class="mb-2" @files="enqueue" />
    <div v-if="images.length" class="text-caption text-grey mb-1">{{ images.length }} 張</div>

    <div v-if="loading" class="text-center py-6">
      <v-progress-circular indeterminate size="28" color="primary"></v-progress-circular>
    </div>
    <div v-else-if="images.length === 0 && pending.length === 0" class="text-center text-caption text-grey py-3">尚無圖片</div>
    <div v-else class="lib-grid">
      <div
        v-for="p in pending"
        :key="`p${p.id}`"
        class="lib-item"
        :title="p.error ? `${p.name}：${p.error}` : p.name"
      >
        <div
          class="lib-thumb lib-pending"
          :class="{ 'is-failed': p.status === 'failed', 'is-retryable': p.status === 'failed' && p.retryable }"
          @click="retry(p)"
        >
          <img v-if="p.previewUrl" :src="p.previewUrl" alt="" />
          <div class="lib-mask">
            <v-progress-circular v-if="p.status === 'uploading'" indeterminate size="24" width="2" color="white"></v-progress-circular>
            <v-icon v-else-if="p.status === 'waiting'" size="22" color="white">mdi-clock-outline</v-icon>
            <v-icon v-else size="24" color="white">{{ p.retryable ? 'mdi-refresh' : 'mdi-alert-circle-outline' }}</v-icon>
          </div>
        </div>
        <div class="d-flex align-center lib-meta">
          <span class="text-caption text-truncate flex-grow-1" :class="{ 'text-error': p.status === 'failed' }">
            {{ p.status === 'failed' ? p.error : p.name }}
          </span>
          <v-btn v-if="p.status !== 'uploading'" icon="mdi-close" size="x-small" variant="text" @click="discard(p)"></v-btn>
        </div>
      </div>
      <div
        v-for="img in images"
        :key="img.id"
        class="lib-item"
        :class="{ 'is-selectable': selectable }"
        @click="selectable && emit('select', img)"
      >
        <div class="lib-thumb">
          <img :src="img.url" :alt="img.name" />
          <div v-if="replacingId === img.id" class="lib-mask">
            <v-progress-circular indeterminate size="24" width="2" color="white"></v-progress-circular>
          </div>
        </div>
        <div class="d-flex align-center lib-meta">
          <span class="text-caption text-truncate flex-grow-1" :title="img.name">{{ img.name }}</span>
          <v-menu>
            <template v-slot:activator="{ props: menuProps }">
              <v-btn v-bind="menuProps" icon="mdi-dots-vertical" size="x-small" variant="text" @click.stop></v-btn>
            </template>
            <v-list density="compact">
              <v-list-item title="改名" prepend-icon="mdi-rename-outline" @click="openRename(img)"></v-list-item>
              <v-list-item title="替換圖檔" prepend-icon="mdi-image-refresh-outline" :disabled="!!replacingId" @click="pickReplace(img)"></v-list-item>
              <v-list-item title="刪除" prepend-icon="mdi-delete-outline" @click="remove(img)"></v-list-item>
            </v-list>
          </v-menu>
        </div>
      </div>
    </div>

    <input ref="replaceInput" type="file" :accept="ACCEPT" class="d-none" @change="onReplace" />

    <v-dialog v-model="renameDialog.open" max-width="360">
      <v-card title="改名">
        <v-card-text>
          <v-text-field v-model="renameDialog.name" label="名稱" variant="outlined" density="compact" hide-details autofocus></v-text-field>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn variant="text" @click="renameDialog.open = false">取消</v-btn>
          <v-btn color="primary" variant="text" :disabled="!renameDialog.name.trim()" @click="saveRename">儲存</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import {
  fetchSubscriptionQuoteImages,
  addSubscriptionQuoteImage,
  updateSubscriptionQuoteImage,
  deleteSubscriptionQuoteImage,
  uploadSubscriptionFile,
} from '@/api.js';
import { useUploadQueue } from '@/composables/useUploadQueue';
import { prepareImageForUpload } from '@/utils/canvasCompress';
import UploadDropZone from './UploadDropZone.vue';

defineProps({
  selectable: { type: Boolean, default: false },
  mac: { type: Boolean, default: false }, // macOS 風格按鈕
});
const emit = defineEmits(['select']);

const ACCEPT = 'image/png,image/jpeg,image/webp,image/gif';
const MAX_SIZE = 7 * 1024 * 1024;
const images = ref([]);
const loading = ref(false);
const replaceInput = ref(null);
const replaceTarget = ref(null);
const replacingId = ref(null);
const renameDialog = ref({ open: false, id: null, name: '' });

async function load() {
  loading.value = true;
  try {
    images.value = await fetchSubscriptionQuoteImages();
  } catch (e) {
    console.error('載入圖片庫失敗:', e);
  } finally {
    loading.value = false;
  }
}
onMounted(load);

function readImageSize(file) {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      resolve({ width: img.naturalWidth, height: img.naturalHeight });
      URL.revokeObjectURL(url);
    };
    img.onerror = () => {
      resolve({ width: 0, height: 0 });
      URL.revokeObjectURL(url);
    };
    img.src = url;
  });
}

async function uploadOne(file, index) {
  const safeName = file.name.replace(/[^\w.\-]/g, '_');
  const path = `subscriptionSettings/images/${Date.now()}_${index}_${safeName}`;
  const [att, size] = await Promise.all([
    uploadSubscriptionFile(file, file.name, path, 'subscription'),
    readImageSize(file),
  ]);
  return { url: att.url, storagePath: att.storagePath, contentType: att.contentType, ...size };
}

// 新增：逐檔上傳，完成一張就放到最前面（圖片庫依建立時間新到舊）
const { pending, enqueue, retry, discard } = useUploadQueue(async (file, id) => {
  const data = await uploadOne(file, id);
  const name = file.name.replace(/\.[^.]+$/, '');
  const docId = await addSubscriptionQuoteImage({ ...data, name });
  images.value = [{ id: docId, ...data, name }, ...images.value];
});

function pickReplace(img) {
  replaceTarget.value = img;
  replaceInput.value?.click();
}

async function onReplace(e) {
  const picked = e.target.files?.[0];
  e.target.value = '';
  const target = replaceTarget.value;
  replaceTarget.value = null;
  if (!picked || !target) return;
  replacingId.value = target.id;
  try {
    const file = await prepareImageForUpload(picked);
    if (file.size > MAX_SIZE) throw new Error('超過 7MB');
    // 替換只更新圖片庫；已插入報價單的圖片維持原檔
    await updateSubscriptionQuoteImage(target.id, await uploadOne(file, 0));
    await load();
  } catch (err) {
    alert('替換失敗：' + err.message);
  } finally {
    replacingId.value = null;
  }
}

function openRename(img) {
  renameDialog.value = { open: true, id: img.id, name: img.name || '' };
}

async function saveRename() {
  try {
    await updateSubscriptionQuoteImage(renameDialog.value.id, { name: renameDialog.value.name.trim() });
    renameDialog.value.open = false;
    await load();
  } catch (e) {
    alert('改名失敗：' + e.message);
  }
}

async function remove(img) {
  if (!confirm(`從圖片庫刪除「${img.name}」？`)) return;
  try {
    await deleteSubscriptionQuoteImage(img.id);
    await load();
  } catch (e) {
    alert('刪除失敗：' + e.message);
  }
}
</script>

<style scoped>
.lib-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(116px, 1fr));
  gap: 10px;
}
.lib-item {
  border: 1px solid #e0e0e0;
  border-radius: 6px;
  padding: 6px 4px 2px 6px;
  background: #fff;
}
.lib-item.is-selectable {
  cursor: pointer;
}
.lib-item.is-selectable:hover {
  border-color: #004383;
  box-shadow: 0 0 0 1px #004383;
}
.lib-thumb {
  position: relative;
  height: 84px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: repeating-conic-gradient(#f2f2f2 0% 25%, #ffffff 0% 50%) 50% / 14px 14px;
  border-radius: 4px;
  overflow: hidden;
}
.lib-thumb img {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
}
.lib-meta {
  min-height: 28px;
}
.lib-pending img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.lib-mask {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.38);
}
.lib-pending.is-failed {
  box-shadow: inset 0 0 0 2px rgb(var(--v-theme-error));
}
.lib-pending.is-failed .lib-mask {
  background: rgba(176, 0, 32, 0.45);
}
.lib-pending.is-retryable {
  cursor: pointer;
}
</style>
