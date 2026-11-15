<template>
  <v-dialog :model-value="modelValue" max-width="640" scrollable @update:model-value="v => emit('update:modelValue', v)">
    <v-card class="mac-sheet urd">
      <div class="mac-sheet-head">
        <v-icon size="18">mdi-comment-text-multiple-outline</v-icon>
        <span>{{ unitId }} 備註</span>
        <span v-if="buyerName" class="urd-buyer">{{ buyerName }}</span>
        <button type="button" class="mac-sheet-close" title="關閉" @click="emit('update:modelValue', false)">
          <v-icon size="18">mdi-close</v-icon>
        </button>
      </div>

      <div v-if="tabs.length > 2" class="urd-filter" role="tablist" aria-label="備註來源">
        <button v-for="t in tabs" :key="t.key" type="button" role="tab" class="urd-tab" :class="{ 'is-active': filter === t.key }"
          :aria-selected="filter === t.key" @click="filter = t.key">
          {{ t.label }} <span class="urd-tab-n">{{ t.count }}</span>
        </button>
      </div>
      <v-progress-linear v-if="loading" indeterminate color="primary" height="2" />

      <v-card-text class="urd-body">
        <div v-if="!shown.length" class="urd-empty">{{ loading ? '載入中…' : '無備註' }}</div>
        <article v-for="it in shown" :key="it.key" class="urd-item" :class="`is-${it.source}`">
          <header class="urd-meta">
            <span class="urd-src">{{ sourceLabel(it.source) }}</span>
            <span v-if="it.pinned" title="置頂">📌</span>
            <time class="urd-time" :class="{ 'is-none': !it.date }">{{ it.date ? [it.date, it.time].filter(Boolean).join(' ') : '無日期' }}</time>
            <b v-if="it.title" class="urd-title">{{ it.title }}</b>
            <span v-if="it.by" class="urd-by">{{ it.by }}</span>
          </header>
          <div v-if="it.tags.length" class="urd-tags">
            <v-chip v-for="(tag, i) in it.tags" :key="i" size="x-small" variant="tonal" label :color="tag.color">{{ tag.text }}</v-chip>
          </div>
          <div v-if="it.content" class="urd-content">{{ it.content }}</div>
          <dl v-if="it.lines.length" class="urd-lines">
            <div v-for="(ln, i) in it.lines" :key="i">
              <dt>{{ ln.label }}</dt>
              <dd>{{ ln.text }}</dd>
            </div>
          </dl>
          <div v-if="it.images.length" class="urd-images">
            <a v-for="(img, i) in it.images" :key="i" :href="img.url" target="_blank" rel="noopener noreferrer" :title="img.name || '開啟圖片'">
              <img :src="img.url" :alt="img.name || '備註圖片'" loading="lazy" />
            </a>
          </div>
        </article>
      </v-card-text>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import { REMARK_SOURCES } from '@/utils/unitRemarkTimeline';

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  unitId: { type: String, default: '' },
  buyerName: { type: String, default: '' },
  items: { type: Array, default: () => [] },   // buildUnitRemarkTimeline 結果
  loading: { type: Boolean, default: false },  // 退戶紀錄載入中
});
const emit = defineEmits(['update:modelValue']);

const filter = ref('all');
watch(() => [props.modelValue, props.unitId], () => { filter.value = 'all'; });

const tabs = computed(() => [
  { key: 'all', label: '全部', count: props.items.length },
  ...REMARK_SOURCES
    .map(s => ({ key: s.key, label: s.label, count: props.items.filter(it => it.source === s.key).length }))
    .filter(t => t.count > 0),
]);
const shown = computed(() => (filter.value === 'all' ? props.items : props.items.filter(it => it.source === filter.value)));
const sourceLabel = key => REMARK_SOURCES.find(s => s.key === key)?.label || '';
</script>

<style scoped>
.urd-buyer { font-weight: 400; color: #6e6e73; font-size: 13px; }
.urd-filter { display: flex; flex-wrap: wrap; gap: 6px; padding: 10px 16px; border-bottom: 1px solid #f0f0f3; }
.urd-tab { height: 26px; padding: 0 10px; border: 1px solid #d9dce3; border-radius: 13px; background: #fff; color: #1d1d1f; font: inherit; font-size: 12.5px; cursor: pointer; white-space: nowrap; }
.urd-tab:hover { background: #f5f6f8; }
.urd-tab.is-active { background: #1d1d1f; border-color: #1d1d1f; color: #fff; }
.urd-tab-n { opacity: .7; font-variant-numeric: tabular-nums; }
.urd-body { padding: 12px 16px !important; max-height: 70vh; background: #fafafb; }
.urd-empty { padding: 32px 0; text-align: center; color: #8e8e93; }
.urd-item { --src: #1565c0; background: #fff; border: 1px solid #e8e9ee; border-left: 3px solid var(--src); border-radius: 8px; padding: 8px 12px; }
.urd-item + .urd-item { margin-top: 8px; }
.urd-item.is-cancelled { --src: #c62828; }
.urd-item.is-record { --src: #00897b; }
.urd-item.is-feeGift { --src: #e64a19; }
.urd-meta { display: flex; align-items: baseline; flex-wrap: wrap; gap: 2px 8px; font-size: 12px; color: #6e6e73; }
.urd-src { font-size: 11px; font-weight: 600; color: var(--src); }
.urd-time { font-variant-numeric: tabular-nums; color: #3a3a3c; }
.urd-time.is-none { color: #8e8e93; }
.urd-title { color: #1d1d1f; font-size: 13px; }
.urd-tags { display: flex; flex-wrap: wrap; gap: 4px; margin-top: 4px; }
.urd-content { margin-top: 4px; font-size: 14px; line-height: 1.6; color: #1d1d1f; white-space: pre-wrap; overflow-wrap: anywhere; }
.urd-lines { margin: 4px 0 0; font-size: 13px; line-height: 1.55; }
.urd-lines > div { display: flex; gap: 8px; }
.urd-lines dt { flex: none; color: #6e6e73; }
.urd-lines dd { margin: 0; min-width: 0; white-space: pre-wrap; overflow-wrap: anywhere; color: #1d1d1f; }
.urd-images { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 6px; }
.urd-images img { display: block; width: 64px; height: 64px; object-fit: cover; border-radius: 6px; border: 1px solid #e8e9ee; }
@media (max-width: 600px) {
  .urd-filter { padding: 8px 12px; }
  .urd-body { padding: 10px 12px !important; }
  .urd-content { font-size: 15px; }
}
</style>
