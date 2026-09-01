<template>
  <div class="att-full">
    <template v-if="data.empty">
      <div class="att-empty">
        <v-icon size="40" color="grey">mdi-image-off-outline</v-icon>
        <div class="mt-2">尚未選擇附圖檔案，請於左側「合約附圖」勾選</div>
      </div>
    </template>
    <template v-else>
      <!-- 旋轉工具列：逐檔設定，匯出 PDF 依此方向嵌入 -->
      <div class="att-toolbar">
        <v-btn icon size="x-small" variant="tonal" title="逆時針旋轉 90°"
          @click="$emit('rotate', data.file.fileId, -1)">
          <v-icon size="small">mdi-rotate-left</v-icon>
        </v-btn>
        <v-btn icon size="x-small" variant="tonal" title="順時針旋轉 90°"
          @click="$emit('rotate', data.file.fileId, 1)">
          <v-icon size="small">mdi-rotate-right</v-icon>
        </v-btn>
        <v-chip v-if="rotation" size="x-small" color="deep-orange" variant="flat">{{ rotation }}°</v-chip>
      </div>
      <div class="att-stage">
        <img v-if="data.file.thumbnail && !thumbFailed" :src="data.file.thumbnail"
          class="att-img" :style="imgStyle" referrerpolicy="no-referrer" @error="thumbFailed = true" />
        <div v-else class="att-fallback">
          <v-icon size="56" color="grey">
            {{ isPdf ? 'mdi-file-pdf-box' : 'mdi-file-image-outline' }}
          </v-icon>
          <div class="mt-2 text-body-2">{{ data.file.name }}</div>
          <div class="text-caption text-grey mt-1">（無法載入預覽縮圖，匯出時仍會嵌入原始檔案）</div>
          <v-chip v-if="rotation" size="x-small" color="deep-orange" variant="tonal" class="mt-2">
            <v-icon start size="x-small">mdi-rotate-right</v-icon>匯出時旋轉 {{ rotation }}°
          </v-chip>
        </div>
      </div>
      <div class="att-caption">
        {{ data.file.name }}
        <span v-if="data.file.pageRange" class="ml-2">頁碼：{{ data.file.pageRange }}</span>
        <span v-if="rotation" class="ml-2 text-deep-orange">旋轉 {{ rotation }}°</span>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue';

const props = defineProps({
  data: { type: Object, required: true },  // { empty } | { file: { fileId, name, pageRange, mimeType, thumbnail, rotation }, index, total }
});
defineEmits(['rotate']);   // (fileId, dir)  dir: 1 順時針 / -1 逆時針

const thumbFailed = ref(false);
watch(() => props.data?.file?.thumbnail, () => { thumbFailed.value = false; });

const isPdf = computed(() =>
  (props.data.file?.mimeType || '').includes('pdf') || /\.pdf$/i.test(props.data.file?.name || ''));

const rotation = computed(() => {
  const r = Math.round(Number(props.data.file?.rotation) || 0);
  return ((r % 360) + 360) % 360;
});

// 旋轉 90/270 時視覺寬高互換：以父層 CSS 變數（紙張內容尺寸）作為互換後的限制
const imgStyle = computed(() => {
  if (!rotation.value) return {};
  const style = { transform: `rotate(${rotation.value}deg)` };
  if (rotation.value % 180 !== 0) {
    style.maxWidth = 'var(--att-stage-h, 100%)';
    style.maxHeight = 'var(--att-stage-w, 100%)';
  }
  return style;
});
</script>

<style scoped>
.att-full {
  position: relative;
  display: flex;
  flex-direction: column;
  color: #000;
}
.att-toolbar {
  position: absolute;
  top: 0;
  right: 0;
  z-index: 2;
  display: flex;
  align-items: center;
  gap: 6px;
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
