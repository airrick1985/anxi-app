<template>
  <Teleport to="body">
    <button
      v-show="!aiStore.hidden"
      ref="fabEl"
      class="sales-ai-fab"
      :class="{ 'sales-ai-fab--collapsed': aiStore.collapsed && !aiStore.isOpen, 'sales-ai-fab--dragging': dragging, [`sales-ai-fab--${side}`]: true }"
      :style="style"
      type="button"
      :aria-label="aiStore.isOpen ? '關閉 AI 智能助理' : 'AI 智能助理'"
      :title="tooltip"
    >
      <AiOrbIcon :size="size" :state="aiStore.fabState" :badge="aiStore.isOpen ? 0 : aiStore.pendingCount" :show-close="aiStore.isOpen" />
    </button>
  </Teleport>
</template>

<script setup>
// 常駐浮動 ICON：可拖曳、邊緣吸附、位置記憶、雙擊收合（docs/銷控AI智能助理-spec.md §3.1）
import { ref, computed } from 'vue';
import { useDisplay } from 'vuetify';
import { useSalesAiStore } from '@/store/salesAiStore';
import { useUserStore } from '@/store/user';
import { useFloatingDrag } from '@/composables/useFloatingDrag';
import AiOrbIcon from './AiOrbIcon.vue';

const aiStore = useSalesAiStore();
const userStore = useUserStore();
const { smAndDown } = useDisplay();
const fabEl = ref(null);
const size = computed(() => (smAndDown.value ? 48 : 56));

const { style, dragging, pos } = useFloatingDrag(fabEl, {
  storageKey: `salesAi.fab.pos.${userStore.user?.key || 'anon'}`,
  margin: 16,
  bottomOffset: () => {
    const v = getComputedStyle(document.documentElement).getPropertyValue('--v-layout-bottom');
    return parseFloat(v) || 0;
  },
  onClick: () => aiStore.toggle(),
  onDoubleClick: () => { if (!aiStore.isOpen) aiStore.collapsed = !aiStore.collapsed; },
});
const side = computed(() => pos.side);

const tooltip = computed(() => {
  if (aiStore.capsError) return `AI 助理無法使用：${aiStore.capsError}`;
  if (aiStore.quotaExhausted) return 'AI Token 額度已用完';
  if (aiStore.pendingCount) return `有 ${aiStore.pendingCount} 項待您確認`;
  return 'AI 智能助理（可拖曳；雙擊收合）';
});
</script>

<style scoped>
.sales-ai-fab {
  position: fixed;
  z-index: 1010;
  padding: 0;
  border: 0;
  background: transparent;
  border-radius: 50%;
  cursor: pointer;
  user-select: none;
  -webkit-tap-highlight-color: transparent;
  transition: left 0.22s ease, right 0.22s ease, top 0.22s ease, transform 0.22s ease, opacity 0.2s ease;
}
.sales-ai-fab:focus-visible { outline: 3px solid #00E5FF; outline-offset: 3px; }
.sales-ai-fab--dragging { cursor: grabbing; transition: none; }
.sales-ai-fab--collapsed { opacity: 0.6; }
.sales-ai-fab--collapsed.sales-ai-fab--right { transform: translateX(62%); }
.sales-ai-fab--collapsed.sales-ai-fab--left { transform: translateX(-62%); }
.sales-ai-fab--collapsed:hover { opacity: 1; transform: translateX(0); }
</style>
