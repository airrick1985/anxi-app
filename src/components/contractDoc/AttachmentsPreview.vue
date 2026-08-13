<template>
  <div class="att-full">
    <template v-if="data.empty">
      <div class="att-empty">
        <v-icon size="40" color="grey">mdi-image-off-outline</v-icon>
        <div class="mt-2">尚未選擇附圖檔案，請於左側「合約附圖」勾選</div>
      </div>
    </template>
    <template v-else>
      <div class="att-stage">
        <img v-if="data.file.thumbnail && !thumbFailed" :src="data.file.thumbnail"
          class="att-img" referrerpolicy="no-referrer" @error="thumbFailed = true" />
        <div v-else class="att-fallback">
          <v-icon size="56" color="grey">
            {{ isPdf ? 'mdi-file-pdf-box' : 'mdi-file-image-outline' }}
          </v-icon>
          <div class="mt-2 text-body-2">{{ data.file.name }}</div>
          <div class="text-caption text-grey mt-1">（無法載入預覽縮圖，匯出時仍會嵌入原始檔案）</div>
        </div>
      </div>
      <div class="att-caption">
        {{ data.file.name }}
        <span v-if="data.file.pageRange" class="ml-2">頁碼：{{ data.file.pageRange }}</span>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue';

const props = defineProps({
  data: { type: Object, required: true },  // { empty } | { file: { name, pageRange, mimeType, thumbnail }, index, total }
});

const thumbFailed = ref(false);
watch(() => props.data?.file?.thumbnail, () => { thumbFailed.value = false; });

const isPdf = computed(() =>
  (props.data.file?.mimeType || '').includes('pdf') || /\.pdf$/i.test(props.data.file?.name || ''));
</script>

<style scoped>
.att-full {
  display: flex;
  flex-direction: column;
  color: #000;
}
.att-stage {
  flex: 1 1 auto;
  min-height: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}
.att-img {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
}
.att-fallback { text-align: center; }
.att-empty {
  flex: 1 1 auto;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #888;
  font-size: 13px;
}
.att-caption {
  flex-shrink: 0;
  text-align: center;
  font-size: 11px;
  color: #555;
  padding-top: 6px;
}
</style>
