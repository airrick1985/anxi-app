<template>
  <div class="attachment-field">
    <div class="att-list">
      <div
        v-for="(att, i) in modelValue"
        :key="att.storagePath || att.url || i"
        class="att-item"
        :title="att.name"
      >
        <div class="att-thumb" role="button" tabindex="0" @click="open(i)" @keydown.enter="open(i)">
          <img v-if="isImageAttachment(att)" :src="att.url" alt="" loading="lazy" />
          <template v-else>
            <v-icon size="30" color="#8e8e93">mdi-file-document-outline</v-icon>
            <span class="att-type" :style="{ background: fileTypeStyle(att).color }">{{ fileTypeStyle(att).label }}</span>
          </template>
          <button
            type="button"
            class="att-download"
            title="下載"
            :disabled="downloadingIndex === i"
            @click.stop="download(att, i)"
          >
            <v-progress-circular v-if="downloadingIndex === i" indeterminate size="12" width="2"></v-progress-circular>
            <v-icon v-else size="15">mdi-download</v-icon>
          </button>
        </div>
        <div class="att-name">{{ att.name }}</div>
        <button v-if="!readonly" type="button" class="att-remove" title="移除" @click="remove(i)">
          <v-icon size="13">mdi-close</v-icon>
        </button>
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
        <div class="att-name">{{ p.name }}</div>
        <div v-if="p.status === 'failed'" class="att-name text-error">{{ p.error }}</div>
        <button v-if="p.status !== 'uploading'" type="button" class="att-remove" title="移除" @click="discard(p)">
          <v-icon size="13">mdi-close</v-icon>
        </button>
      </div>

      <UploadDropZone v-if="!readonly" :accept="accept" :mac="mac" @files="enqueue" />
      <span v-if="readonly && modelValue.length === 0" class="text-caption text-grey">—</span>
    </div>

    <AttachmentViewer v-model="viewerOpen" :items="modelValue" :start-index="viewerIndex" />
  </div>
</template>

<script setup>
import { ref, nextTick } from 'vue';
import { uploadSubscriptionFile } from '@/api.js';
import { useUploadQueue } from '@/composables/useUploadQueue';
import { isImageAttachment, fileTypeStyle, downloadAttachment } from '@/utils/attachmentFile';
import UploadDropZone from './UploadDropZone.vue';
import AttachmentViewer from './AttachmentViewer.vue';

const props = defineProps({
  modelValue: { type: Array, default: () => [] },
  pathPrefix: { type: String, required: true },
  projectId: { type: String, default: '' },
  readonly: { type: Boolean, default: false },
  accept: { type: String, default: 'image/*,application/pdf,.doc,.docx,.xls,.xlsx' },
  mac: { type: Boolean, default: false }, // macOS 風格按鈕
});
const emit = defineEmits(['update:modelValue']);

const viewerOpen = ref(false);
const viewerIndex = ref(0);
const downloadingIndex = ref(-1);

// 逐檔上傳：每完成一個就寫回 modelValue，等父層更新後再傳下一個，避免覆蓋
const { pending, enqueue, retry, discard } = useUploadQueue(async (file, id) => {
  const safeName = file.name.replace(/[^\w.\-]/g, '_');
  const path = `${props.pathPrefix}/${Date.now()}_${id}_${safeName}`;
  const att = await uploadSubscriptionFile(file, file.name, path, props.projectId);
  emit('update:modelValue', [...props.modelValue, att]);
  await nextTick();
});

function open(index) {
  viewerIndex.value = index;
  viewerOpen.value = true;
}

async function download(att, index) {
  downloadingIndex.value = index;
  try {
    await downloadAttachment(att);
  } finally {
    downloadingIndex.value = -1;
  }
}

function remove(index) {
  emit('update:modelValue', props.modelValue.filter((_, i) => i !== index));
}
</script>

<style scoped>
.att-list {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  gap: 10px;
}
.att-item {
  position: relative;
  width: 84px;
}
.att-thumb {
  position: relative;
  width: 72px;
  height: 72px;
  margin: 0 auto;
  border: 1px solid rgba(0, 0, 0, 0.1);
  border-radius: 8px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
  cursor: pointer;
  background: #f5f5f7;
  transition: box-shadow 0.15s, border-color 0.15s;
}
.att-thumb:hover,
.att-thumb:focus-visible {
  border-color: rgba(0, 113, 227, 0.5);
  box-shadow: 0 0 0 3px rgba(0, 113, 227, 0.15);
  outline: none;
}
.att-thumb > img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.att-type {
  padding: 0 5px;
  border-radius: 3px;
  color: #fff;
  font-size: 9.5px;
  font-weight: 700;
  line-height: 15px;
  letter-spacing: 0.3px;
}
/* 下載鈕：滑鼠移上縮圖才出現；觸控裝置改在檢視器內下載 */
.att-download {
  position: absolute;
  right: 4px;
  bottom: 4px;
  display: none;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border: 0;
  border-radius: 6px;
  background: rgba(29, 29, 31, 0.78);
  color: #fff;
  cursor: pointer;
}
.att-download:hover {
  background: #0071e3;
}
@media (hover: hover) {
  .att-thumb:hover .att-download,
  .att-download:focus-visible {
    display: inline-flex;
  }
}
/* 完整顯示檔名：自動換行，不截斷 */
.att-name {
  margin-top: 4px;
  text-align: center;
  font-size: 11.5px;
  line-height: 1.35;
  color: #3a3a3c;
  overflow-wrap: anywhere;
}
.att-pending {
  cursor: default;
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
  right: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  border: 2px solid #fff;
  border-radius: 50%;
  background: #48484a;
  color: #fff;
  cursor: pointer;
}
.att-remove:hover {
  background: #d62d20;
}
</style>
