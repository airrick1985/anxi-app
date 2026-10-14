<template>
  <div class="attachment-field">
    <div class="d-flex flex-wrap align-start ga-2">
      <div
        v-for="(att, i) in modelValue"
        :key="att.storagePath || att.url || i"
        class="att-item"
        :title="att.name"
      >
        <div class="att-thumb" @click="preview(att)">
          <v-img v-if="isImage(att)" :src="att.url" cover width="56" height="56"></v-img>
          <v-icon v-else :color="isPdf(att) ? 'red-darken-2' : 'blue-grey'" size="36">
            {{ isPdf(att) ? 'mdi-file-pdf-box' : 'mdi-file-document-outline' }}
          </v-icon>
        </div>
        <div class="att-name text-caption">{{ att.name }}</div>
        <v-btn
          v-if="!readonly"
          class="att-remove"
          icon="mdi-close"
          size="x-small"
          density="comfortable"
          variant="flat"
          color="grey-darken-3"
          @click="remove(i)"
        ></v-btn>
      </div>

      <div
        v-for="p in pending"
        :key="`p${p.id}`"
        class="att-item"
        :title="p.error ? `${p.name}：${p.error}` : p.name"
      >
        <div
          class="att-thumb att-pending"
          :class="{ 'is-failed': p.status === 'failed', 'is-retryable': p.status === 'failed' && p.retryable }"
          @click="retry(p)"
        >
          <img v-if="p.previewUrl" :src="p.previewUrl" alt="" />
          <v-icon v-else size="30" color="blue-grey-lighten-2">mdi-file-outline</v-icon>
          <div class="att-pending-mask">
            <v-progress-circular v-if="p.status === 'uploading'" indeterminate size="22" width="2" color="white"></v-progress-circular>
            <v-icon v-else-if="p.status === 'waiting'" size="20" color="white">mdi-clock-outline</v-icon>
            <v-icon v-else size="22" color="white">{{ p.retryable ? 'mdi-refresh' : 'mdi-alert-circle-outline' }}</v-icon>
          </div>
        </div>
        <div class="att-name text-caption">{{ p.name }}</div>
        <div v-if="p.status === 'failed'" class="att-name text-caption text-error">{{ p.error }}</div>
        <v-btn
          v-if="p.status !== 'uploading'"
          class="att-remove"
          icon="mdi-close"
          size="x-small"
          density="comfortable"
          variant="flat"
          color="grey-darken-3"
          @click="discard(p)"
        ></v-btn>
      </div>

      <UploadDropZone v-if="!readonly" :accept="accept" :mac="mac" @files="enqueue" />
      <span v-if="readonly && modelValue.length === 0" class="text-caption text-grey">—</span>
    </div>

    <v-dialog v-model="previewOpen" max-width="960px">
      <v-card>
        <div class="att-preview-head">
          <span class="att-preview-name">{{ current?.name }}</span>
          <v-btn icon="mdi-open-in-new" variant="text" color="white" @click="openTab(current?.url)"></v-btn>
          <v-btn icon="mdi-close" variant="text" color="white" @click="previewOpen = false"></v-btn>
        </div>
        <v-card-text class="pa-0 bg-grey-lighten-3" style="height: 75vh;">
          <v-img v-if="current && isImage(current)" :src="current.url" height="100%" contain></v-img>
          <iframe
            v-else-if="current"
            :src="current.url"
            style="width: 100%; height: 100%; border: 0;"
            title="附件預覽"
          ></iframe>
        </v-card-text>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup>
import { ref, nextTick } from 'vue';
import { uploadSubscriptionFile } from '@/api.js';
import { useUploadQueue } from '@/composables/useUploadQueue';
import UploadDropZone from './UploadDropZone.vue';

const props = defineProps({
  modelValue: { type: Array, default: () => [] },
  pathPrefix: { type: String, required: true },
  projectId: { type: String, default: '' },
  readonly: { type: Boolean, default: false },
  accept: { type: String, default: 'image/*,application/pdf,.doc,.docx,.xls,.xlsx' },
  mac: { type: Boolean, default: false }, // macOS 風格按鈕
});
const emit = defineEmits(['update:modelValue']);

const previewOpen = ref(false);
const current = ref(null);

// 逐檔上傳：每完成一個就寫回 modelValue，等父層更新後再傳下一個，避免覆蓋
const { pending, enqueue, retry, discard } = useUploadQueue(async (file, id) => {
  const safeName = file.name.replace(/[^\w.\-]/g, '_');
  const path = `${props.pathPrefix}/${Date.now()}_${id}_${safeName}`;
  const att = await uploadSubscriptionFile(file, file.name, path, props.projectId);
  emit('update:modelValue', [...props.modelValue, att]);
  await nextTick();
});

function isImage(att) {
  if (att?.contentType) return att.contentType.startsWith('image/');
  return /\.(png|jpe?g|gif|webp)(\?|$)/i.test(att?.url || '');
}

function isPdf(att) {
  return att?.contentType === 'application/pdf' || /\.pdf(\?|$)/i.test(att?.url || '');
}

function preview(att) {
  if (!isImage(att) && !isPdf(att)) {
    openTab(att.url);
    return;
  }
  current.value = att;
  previewOpen.value = true;
}

function openTab(url) {
  if (url) window.open(url, '_blank');
}

function remove(index) {
  emit('update:modelValue', props.modelValue.filter((_, i) => i !== index));
}
</script>

<style scoped>
.att-item {
  position: relative;
  width: 96px;
}
.att-thumb {
  width: 56px;
  height: 56px;
  margin: 0 auto;
  border: 1px solid #e0e0e0;
  border-radius: 6px;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  background: #fafafa;
}
.att-thumb:hover {
  opacity: 0.85;
}
/* 完整顯示檔名：自動換行，不截斷 */
.att-name {
  margin-top: 3px;
  text-align: center;
  line-height: 1.35;
  overflow-wrap: anywhere;
}
.att-pending {
  position: relative;
  cursor: default;
}
.att-pending img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.att-pending-mask {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.38);
}
.att-pending.is-failed {
  border-color: rgb(var(--v-theme-error));
}
.att-pending.is-failed .att-pending-mask {
  background: rgba(176, 0, 32, 0.45);
}
.att-pending.is-retryable {
  cursor: pointer;
}
.att-remove {
  position: absolute;
  top: -6px;
  right: calc(50% - 36px);
}
.att-preview-head {
  display: flex;
  align-items: center;
  gap: 2px;
  min-height: 48px;
  padding: 4px 4px 4px 16px;
  background: #004383;
  color: #fff;
}
.att-preview-name {
  flex: 1 1 auto;
  min-width: 0;
  font-size: 15px;
  line-height: 1.4;
  overflow-wrap: anywhere;
}
</style>
