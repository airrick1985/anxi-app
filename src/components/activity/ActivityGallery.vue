<template>
  <div class="amv-view">
    <header class="amv-bar">
      <div class="amv-heading">
        <span class="amv-heading-main">活動訊息<span v-if="items.length" class="amv-heading-count">{{ items.length }}</span></span>
        <span v-if="projectName" class="amv-heading-sub">{{ projectName }}</span>
      </div>
      <span class="amv-spacer"></span>
      <v-text-field
        v-if="items.length > 8"
        v-model="keyword"
        placeholder="搜尋"
        prepend-inner-icon="mdi-magnify"
        variant="solo"
        flat
        density="compact"
        hide-details
        clearable
        class="mac-vfield mac-vfield--search amv-search"
      />
      <ActivitySizeSlider v-if="!compact && items.length > 2" :model-value="cellSize" @update:model-value="$emit('update:cellSize', $event)" />
      <button v-if="canManage" type="button" class="mac-btn" @click="$emit('manage')">
        <v-icon size="16">mdi-square-edit-outline</v-icon>管理
      </button>
      <button type="button" class="amv-tool" title="關閉" aria-label="關閉" @click="$emit('close')">
        <v-icon size="20">mdi-close</v-icon>
      </button>
    </header>

    <div v-if="loading" class="amv-state"><v-progress-circular indeterminate size="32" width="3" color="#8e8e93" /></div>

    <div v-else-if="!items.length" class="amv-state">
      <v-icon size="56">mdi-image-multiple-outline</v-icon>
      <span>尚無活動訊息</span>
      <div v-if="canManage" class="amv-state-actions">
        <button type="button" class="mac-btn mac-btn--primary mac-btn--lg" @click="$emit('manage')">開始新增</button>
      </div>
    </div>

    <div v-else-if="!shown.length" class="amv-state">找不到符合的活動</div>

    <div v-else class="amv-scroll">
      <div class="amv-grid" :style="{ '--amv-cell': `${cellSize}px` }">
        <button v-for="item in shown" :key="item.id" type="button" class="amv-card" @click="$emit('open', item.id)">
          <div class="amv-tile">
            <ActivityThumb :item="item" />
            <span v-if="kindOf(item) === 'pdf'" class="amg-kind">{{ activityTypeLabel(item) }}</span>
          </div>
          <div v-if="activityPublicName(item)" class="amv-name">{{ activityPublicName(item) }}</div>
          <div v-if="item.description" class="amv-desc">{{ item.description }}</div>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
// 活動訊息總覽牆（一般瀏覽）：完整縮圖＋標題＋說明，點一張放大
import { ref, computed } from 'vue';
import ActivityThumb from './ActivityThumb.vue';
import ActivitySizeSlider from './ActivitySizeSlider.vue';
import { activityKind as kindOf, activityTypeLabel, activityPublicName, activityMatches } from '@/utils/activityMessage';

const props = defineProps({
  items: { type: Array, required: true },
  loading: { type: Boolean, default: false },
  projectName: { type: String, default: '' },
  canManage: { type: Boolean, default: false },
  compact: { type: Boolean, default: false },
  cellSize: { type: Number, default: 200 },
});
defineEmits(['open', 'manage', 'close', 'update:cellSize']);

const keyword = ref('');
const shown = computed(() => props.items.filter(i => activityMatches(i, keyword.value)));
</script>

<style scoped>
.amg-kind {
  position: absolute;
  right: 8px;
  bottom: 8px;
  padding: 2px 7px;
  border-radius: 6px;
  background: rgba(29, 29, 31, 0.72);
  color: #fff;
  font-size: 11.5px;
  font-weight: 600;
  line-height: 1.4;
}
</style>
