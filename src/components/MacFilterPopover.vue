<template>
  <!-- 篩選按鈕＋面板：桌機為按鈕下方的彈出面板，手機為底部面板；欄位由預設 slot 提供，兩種外殼共用同一份 -->
  <template v-if="sheet">
    <button type="button" class="mac-btn" :class="{ 'is-active': count > 0 }" @click="open = true">
      <v-icon size="16">mdi-filter-variant</v-icon>篩選<span v-if="count" class="mac-filter-count">{{ count }}</span>
    </button>
    <MobileBottomSheet v-model="open" icon="mdi-filter-variant" title="篩選">
      <div class="mac-filter-grid mfp-sheet-body"><slot /></div>
      <div class="mfp-sheet-foot">
        <button type="button" class="mac-btn mac-btn--lg" :disabled="!count" @click="$emit('clear')">清除全部</button>
        <button type="button" class="mac-btn mac-btn--primary mac-btn--lg mfp-show" @click="open = false">顯示 {{ resultCount }} 筆</button>
      </div>
    </MobileBottomSheet>
  </template>

  <v-menu v-else v-model="open" :close-on-content-click="false" location="bottom end" offset="6">
    <template #activator="{ props: activatorProps }">
      <button type="button" class="mac-btn" :class="{ 'is-active': count > 0, 'is-open': open }" v-bind="activatorProps">
        <v-icon size="16">mdi-filter-variant</v-icon>篩選<span v-if="count" class="mac-filter-count">{{ count }}</span>
      </button>
    </template>
    <div class="mac-sheet mac-filter-pop">
      <div class="mac-sheet-head">
        <v-icon size="17">mdi-filter-variant</v-icon>篩選
        <button type="button" class="mac-sheet-close" title="關閉" @click="open = false">
          <v-icon size="18">mdi-close</v-icon>
        </button>
      </div>
      <div class="mac-filter-body">
        <div class="mac-filter-grid"><slot /></div>
      </div>
      <div class="mac-sheet-foot">
        <button type="button" class="mac-link-btn" :disabled="!count" @click="$emit('clear')">清除全部</button>
        <span class="mac-spacer"></span>
        <span class="mac-sheet-note">符合 {{ resultCount }} 筆</span>
      </div>
    </div>
  </v-menu>
</template>

<script setup>
import { ref } from 'vue';
import MobileBottomSheet from '@/components/MobileBottomSheet.vue';

defineProps({
  sheet: { type: Boolean, default: false },      // true：手機底部面板
  count: { type: Number, default: 0 },           // 已套用的條件數
  resultCount: { type: Number, default: 0 },     // 符合筆數
});
defineEmits(['clear']);

const open = ref(false);
</script>

<style scoped>
.mfp-sheet-body { padding-bottom: 14px; }
.mfp-sheet-foot {
  position: sticky;
  bottom: calc(-20px - env(safe-area-inset-bottom, 0px));
  display: flex;
  gap: 8px;
  margin: 0 -16px;
  padding: 10px 16px calc(10px + env(safe-area-inset-bottom, 0px));
  background: #fff;
  border-top: 1px solid rgba(0, 0, 0, 0.08);
}
.mfp-show { flex: 1 1 auto; }
</style>
