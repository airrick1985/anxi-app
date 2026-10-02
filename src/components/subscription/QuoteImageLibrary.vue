<template>
  <div>
    <div class="d-flex align-center mb-2">
      <span v-if="images.length" class="text-caption text-grey">{{ images.length }} 張</span>
      <v-spacer></v-spacer>
      <button v-if="mac" type="button" class="mac-btn" :disabled="uploading" @click="pick(null)">
        <v-progress-circular v-if="uploading" indeterminate size="14" width="2"></v-progress-circular>
        <v-icon v-else size="15">mdi-upload</v-icon><span>上傳</span>
      </button>
      <v-btn v-else size="small" variant="tonal" color="primary" prepend-icon="mdi-upload" :loading="uploading" @click="pick(null)">上傳</v-btn>
    </div>

    <div v-if="loading" class="text-center py-6">
      <v-progress-circular indeterminate size="28" color="primary"></v-progress-circular>
    </div>
    <div v-else-if="images.length === 0" class="lib-empty text-center text-grey py-6">尚無圖片</div>
    <div v-else class="lib-grid">
      <div
        v-for="img in images"
        :key="img.id"
        class="lib-item"
        :class="{ 'is-selectable': selectable }"
        @click="selectable && emit('select', img)"
      >
        <div class="lib-thumb"><img :src="img.url" :alt="img.name" /></div>
        <div class="d-flex align-center">
          <span class="text-caption text-truncate flex-grow-1" :title="img.name">{{ img.name }}</span>
          <v-menu>
            <template v-slot:activator="{ props: menuProps }">
              <v-btn v-bind="menuProps" icon="mdi-dots-vertical" size="x-small" variant="text" @click.stop></v-btn>
            </template>
            <v-list density="compact">
              <v-list-item title="改名" prepend-icon="mdi-rename-outline" @click="openRename(img)"></v-list-item>
              <v-list-item title="替換圖檔" prepend-icon="mdi-image-refresh-outline" @click="pick(img)"></v-list-item>
              <v-list-item title="刪除" prepend-icon="mdi-delete-outline" @click="remove(img)"></v-list-item>
            </v-list>
          </v-menu>
        </div>
      </div>
    </div>

    <input
      ref="fileInput"
      type="file"
      accept="image/png,image/jpeg,image/webp,image/gif"
      :multiple="!replaceTarget"
      class="d-none"
      @change="onPick"
    />

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

defineProps({
  selectable: { type: Boolean, default: false },
  mac: { type: Boolean, default: false }, // macOS 風格按鈕
});
const emit = defineEmits(['select']);

const MAX_SIZE = 7 * 1024 * 1024;
const images = ref([]);
const loading = ref(false);
const uploading = ref(false);
const fileInput = ref(null);
const replaceTarget = ref(null);
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

function pick(target) {
  replaceTarget.value = target;
  // 等 multiple 屬性更新後再開檔案選擇
  setTimeout(() => fileInput.value?.click(), 0);
}

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

async function onPick(e) {
  const files = Array.from(e.target.files || []);
  e.target.value = '';
  if (files.length === 0) return;
  const oversized = files.find(f => f.size > MAX_SIZE);
  if (oversized) {
    alert(`「${oversized.name}」超過 7MB 上限`);
    return;
  }
  uploading.value = true;
  try {
    if (replaceTarget.value) {
      // 替換只更新圖片庫；已插入報價單的圖片維持原檔
      await updateSubscriptionQuoteImage(replaceTarget.value.id, await uploadOne(files[0], 0));
    } else {
      for (const [i, file] of files.entries()) {
        const data = await uploadOne(file, i);
        await addSubscriptionQuoteImage({ ...data, name: file.name.replace(/\.[^.]+$/, '') });
      }
    }
    await load();
  } catch (err) {
    alert('上傳失敗：' + err.message);
  } finally {
    uploading.value = false;
    replaceTarget.value = null;
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
.lib-empty {
  border: 2px dashed #e0e0e0;
  border-radius: 8px;
}
</style>
