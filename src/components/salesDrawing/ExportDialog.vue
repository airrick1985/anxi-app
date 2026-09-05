<template>
  <v-dialog v-model="open" max-width="520">
    <v-card>
      <v-card-title class="d-flex align-center bg-primary text-white py-3">
        <v-icon start>mdi-export-variant</v-icon>
        <span>匯出圖面</span>
        <v-spacer />
        <v-btn icon="mdi-close" variant="text" size="small" @click="open = false" />
      </v-card-title>
      <v-card-text class="pt-4">
        <v-alert v-if="hasInternalFields" type="warning" variant="tonal" density="compact" class="mb-3" icon="mdi-alert-outline">
          此圖面含內部資料欄位（底價／成交／買方資料／付款），請確認匯出對象後再進行。
        </v-alert>
        <v-alert v-if="tainted" type="error" variant="tonal" density="compact" class="mb-3">
          底圖的跨域（CORS）設定未完成，瀏覽器不允許匯出含底圖的畫面。請聯絡管理員完成 Storage CORS 設定。
        </v-alert>

        <v-btn-toggle v-model="kind" mandatory density="comfortable" variant="outlined" divided class="mb-4 w-100">
          <v-btn value="image" class="flex-1" prepend-icon="mdi-image-outline">圖片</v-btn>
          <v-btn value="pdf" class="flex-1" prepend-icon="mdi-file-pdf-box">PDF</v-btn>
          <v-btn value="print" class="flex-1" prepend-icon="mdi-printer-outline">列印</v-btn>
        </v-btn-toggle>

        <template v-if="kind === 'image'">
          <div class="text-caption text-grey mb-1">格式</div>
          <v-btn-toggle v-model="format" mandatory density="comfortable" variant="outlined" divided class="mb-1 w-100">
            <v-btn v-for="f in formatItems" :key="f.value" :value="f.value" :disabled="f.disabled" class="flex-1" size="small">{{ f.short }}</v-btn>
          </v-btn-toggle>
          <div class="text-caption text-grey mb-3">{{ formatItems.find(f => f.value === format)?.label }}</div>
          <v-slider v-if="isLossy" v-model="quality" :min="0.5" :max="1" :step="0.01" label="品質" density="compact" hide-details thumb-label class="mb-2">
            <template #append><span class="text-caption" style="width:36px">{{ Math.round(quality * 100) }}%</span></template>
          </v-slider>
        </template>
        <template v-if="kind === 'pdf'">
          <v-select v-model="pageSize" :items="[{ title: 'A4 橫向', value: 'a4' }, { title: 'A3 橫向', value: 'a3' }]" label="紙張" density="compact" variant="outlined" hide-details class="mb-3" />
        </template>

        <v-select v-model="multiplier" :items="multiplierItems" label="解析度" density="compact" variant="outlined" hide-details class="mb-2" />
        <div class="text-caption text-grey">輸出尺寸：{{ Math.round(canvasSize.width * multiplier) }} × {{ Math.round(canvasSize.height * multiplier) }} px</div>
      </v-card-text>
      <v-card-actions class="px-4 pb-4">
        <v-spacer />
        <v-btn variant="text" @click="open = false">取消</v-btn>
        <v-btn color="primary" variant="flat" :loading="loading" :disabled="tainted" @click="confirm">{{ kind === 'print' ? '列印' : '匯出' }}</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { ref, computed } from 'vue';
import { EXPORT_FORMATS, supportsWebp } from '@/utils/salesDrawing/exportDrawing';

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  canvasSize: { type: Object, default: () => ({ width: 0, height: 0 }) },
  hasInternalFields: { type: Boolean, default: false },
  tainted: { type: Boolean, default: false },
  loading: { type: Boolean, default: false },
});
const emit = defineEmits(['update:modelValue', 'export']);
const open = computed({ get: () => props.modelValue, set: v => emit('update:modelValue', v) });

const kind = ref('image');
const format = ref('png');
const quality = ref(0.92);
const pageSize = ref('a4');
const multiplier = ref(1);

const webp = supportsWebp();
const formatItems = EXPORT_FORMATS.map(f => ({ ...f, short: f.ext.toUpperCase().replace('JPG', 'JPEG'), label: f.value === 'webp' && !webp ? `${f.label}（此瀏覽器不支援）` : f.label, disabled: f.value === 'webp' && !webp }));
const isLossy = computed(() => EXPORT_FORMATS.find(f => f.value === format.value)?.lossy);

const multiplierItems = computed(() => {
  const big = Math.max(props.canvasSize.width, props.canvasSize.height);
  const items = [{ title: '1x（同底圖解析度）', value: 1 }, { title: '1.5x', value: 1.5 }, { title: '2x（高解析）', value: 2 }];
  if (big > 4000) items.push({ title: '0.5x（縮小）', value: 0.5 });
  return items;
});

function confirm() {
  emit('export', { kind: kind.value, format: format.value, quality: quality.value, pageSize: pageSize.value, multiplier: multiplier.value });
}
</script>

<style scoped>
.flex-1 { flex: 1; }
</style>
