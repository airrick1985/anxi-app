<template>
  <div class="attachment-field">
    <div class="d-flex flex-wrap align-center ga-2">
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
        <div class="att-name text-caption text-truncate">{{ att.name }}</div>
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

      <div v-if="uploading" class="att-item d-flex align-center justify-center">
        <v-progress-circular indeterminate size="24" width="2" color="primary"></v-progress-circular>
      </div>

      <template v-if="!readonly">
        <button v-if="mac" type="button" class="mac-btn" :disabled="uploading" @click="fileInput?.click()">
          <v-icon size="15">mdi-upload</v-icon><span>{{ label }}</span>
        </button>
        <v-btn
          v-else
          variant="tonal"
          size="small"
          prepend-icon="mdi-paperclip"
          :disabled="uploading"
          @click="fileInput?.click()"
        >{{ label }}</v-btn>
      </template>
      <span v-if="readonly && modelValue.length === 0" class="text-caption text-grey">—</span>
    </div>
    <input
      ref="fileInput"
      type="file"
      multiple
      :accept="accept"
      class="d-none"
      @change="onPick"
    />

    <v-dialog v-model="previewOpen" max-width="960px">
      <v-card>
        <v-toolbar density="compact" color="#004383">
          <v-toolbar-title class="text-body-1">{{ current?.name }}</v-toolbar-title>
          <v-spacer></v-spacer>
          <v-btn icon="mdi-open-in-new" variant="text" @click="openTab(current?.url)"></v-btn>
          <v-btn icon="mdi-close" variant="text" @click="previewOpen = false"></v-btn>
        </v-toolbar>
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
import { ref } from 'vue';
import { uploadSubscriptionFile } from '@/api.js';

const props = defineProps({
  modelValue: { type: Array, default: () => [] },
  pathPrefix: { type: String, required: true },
  projectId: { type: String, default: '' },
  readonly: { type: Boolean, default: false },
  label: { type: String, default: '附件' },
  accept: { type: String, default: 'image/*,application/pdf,.doc,.docx,.xls,.xlsx' },
  mac: { type: Boolean, default: false }, // macOS 風格按鈕
});
const emit = defineEmits(['update:modelValue']);

const MAX_SIZE = 7 * 1024 * 1024;
const fileInput = ref(null);
const uploading = ref(false);
const previewOpen = ref(false);
const current = ref(null);

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
  const added = [];
  try {
    for (const [i, file] of files.entries()) {
      const safeName = file.name.replace(/[^\w.\-]/g, '_');
      const path = `${props.pathPrefix}/${Date.now()}_${i}_${safeName}`;
      added.push(await uploadSubscriptionFile(file, file.name, path, props.projectId));
    }
  } catch (err) {
    alert('上傳失敗：' + err.message);
  } finally {
    uploading.value = false;
    if (added.length) emit('update:modelValue', [...props.modelValue, ...added]);
  }
}
</script>

<style scoped>
.att-item {
  position: relative;
  width: 72px;
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
.att-name {
  text-align: center;
  max-width: 72px;
}
.att-remove {
  position: absolute;
  top: -6px;
  right: 2px;
}
</style>
