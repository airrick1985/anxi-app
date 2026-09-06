<template>
  <Teleport to="body">
    <Transition name="sai-panel">
      <section v-if="aiStore.isOpen" ref="panelEl" class="sai-panel" :class="{ 'sai-panel--mobile': smAndDown, 'sai-panel--full': mobileFull, 'sai-panel--left': side === 'left' }" :style="panelStyle" role="dialog" aria-label="AI 智能助理">
        <header class="sai-panel__head" @pointerdown="onHeadDown">
          <AiOrbIcon :size="26" :state="aiStore.fabState" />
          <div class="sai-panel__title">
            <div class="sai-panel__name">{{ aiStore.projectName || '建案' }} 智能助理</div>
            <div class="sai-panel__meta">
              <span :class="quotaClass">Token {{ fmt(aiStore.quota.used) }} / {{ aiStore.quota.limit > 0 ? fmt(aiStore.quota.limit) : '∞' }}</span>
              <span v-if="aiStore.canWrite" class="sai-panel__cap">可修改銷控</span>
              <span v-else class="sai-panel__cap sai-panel__cap--ro">唯讀</span>
            </div>
          </div>
          <v-btn v-if="smAndDown" icon size="x-small" variant="text" :title="mobileFull ? '縮小' : '全螢幕'" @click.stop="mobileFull = !mobileFull"><v-icon>{{ mobileFull ? 'mdi-arrow-collapse' : 'mdi-arrow-expand' }}</v-icon></v-btn>
          <v-btn icon size="x-small" variant="text" title="清除對話" :disabled="!aiStore.messages.length || aiStore.isLoading" @click.stop="confirmClear"><v-icon>mdi-delete-sweep-outline</v-icon></v-btn>
          <v-btn icon size="x-small" variant="text" title="最小化" @click.stop="aiStore.close()"><v-icon>mdi-minus</v-icon></v-btn>
        </header>
        <div class="sai-panel__body">
          <SalesAiChat :project-id="projectId" :project-name="projectName" @open-unit="$emit('open-unit', $event)" @notify="openNotify" />
        </div>
        <div v-if="!smAndDown" class="sai-panel__resize" @pointerdown="onResizeDown" title="拖曳調整大小"></div>
      </section>
    </Transition>

    <SalesStatusNotifyDialog
      v-if="notify.show"
      :show="notify.show" @update:show="notify.show = $event"
      :project-id="projectId" :project-name="projectName" :unit-id="notify.unitId"
      :old-status="notify.oldStatus" :new-status="notify.newStatus"
      :trigger-type="notify.triggerType" :operator-name="operatorName"
      :recipients="notify.recipients" @finished="notify.show = false" />
  </Teleport>
</template>

<script setup>
// 浮動對話面板（桌機可拖曳／縮放；手機底部抽屜）docs/銷控AI智能助理-spec.md §3.2
import { ref, reactive, computed, watch } from 'vue';
import { useDisplay } from 'vuetify';
import { useSalesAiStore } from '@/store/salesAiStore';
import { useUserStore } from '@/store/user';
import AiOrbIcon from './AiOrbIcon.vue';
import SalesAiChat from './SalesAiChat.vue';
import SalesStatusNotifyDialog from '@/components/SalesStatusNotifyDialog.vue';

const props = defineProps({
  projectId: { type: String, required: true },
  projectName: { type: String, default: '' },
});
defineEmits(['open-unit']);

const aiStore = useSalesAiStore();
const userStore = useUserStore();
const { smAndDown } = useDisplay();
const panelEl = ref(null);
const mobileFull = ref(false);
const operatorName = computed(() => userStore.user?.name || '');

// ---- 位置／尺寸（桌機）----
const STORAGE = `salesAi.panel.${userStore.user?.key || 'anon'}`;
const geom = reactive({ w: 420, h: 640, dx: 0, dy: 0 });
try { const s = JSON.parse(localStorage.getItem(STORAGE) || 'null'); if (s) Object.assign(geom, s); } catch { /* ignore */ }
function persist() { try { localStorage.setItem(STORAGE, JSON.stringify({ w: geom.w, h: geom.h, dx: geom.dx, dy: geom.dy })); } catch { /* ignore */ } }
const side = computed(() => { try { const p = JSON.parse(localStorage.getItem(`salesAi.fab.pos.${userStore.user?.key || 'anon'}`) || 'null'); return p?.side || 'right'; } catch { return 'right'; } });

const panelStyle = computed(() => {
  if (smAndDown.value) return {};
  const w = Math.min(geom.w, window.innerWidth - 24);
  const h = Math.min(geom.h, window.innerHeight - 24);
  const bottom = 88; // FAB 上方
  return { width: `${w}px`, height: `${h}px`, bottom: `${bottom}px`, transform: `translate(${geom.dx}px, ${geom.dy}px)` };
});

let drag = null;
function onHeadDown(e) {
  if (smAndDown.value || e.button !== 0) return;
  if (e.target.closest('button, .v-btn')) return;
  drag = { x: e.clientX, y: e.clientY, dx: geom.dx, dy: geom.dy };
  const move = ev => {
    if (!drag) return;
    const nx = drag.dx + (ev.clientX - drag.x); const ny = drag.dy + (ev.clientY - drag.y);
    const rect = panelEl.value?.getBoundingClientRect();
    if (rect) {
      const left = rect.left - geom.dx + nx, top = rect.top - geom.dy + ny;
      if (left < -rect.width + 80 || left > window.innerWidth - 80 || top < 0 || top > window.innerHeight - 48) return;
    }
    geom.dx = nx; geom.dy = ny;
  };
  const up = () => { drag = null; persist(); window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', up); };
  window.addEventListener('pointermove', move); window.addEventListener('pointerup', up);
}
function onResizeDown(e) {
  if (e.button !== 0) return;
  e.preventDefault();
  const start = { x: e.clientX, y: e.clientY, w: geom.w, h: geom.h };
  const move = ev => {
    // 左側時向右拉變寬；右側時向左拉變寬（把手在面板左下／右下）
    const sign = side.value === 'left' ? 1 : -1;
    geom.w = Math.max(340, Math.min(760, start.w + sign * (ev.clientX - start.x)));
    geom.h = Math.max(380, Math.min(window.innerHeight - 24, start.h - (ev.clientY - start.y)));
  };
  const up = () => { persist(); window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', up); };
  window.addEventListener('pointermove', move); window.addEventListener('pointerup', up);
}

// ---- 配額樣式 ----
const fmt = n => Number(n || 0).toLocaleString('zh-TW');
const quotaClass = computed(() => {
  const { used, limit } = aiStore.quota;
  if (!limit) return 'sai-panel__quota';
  const r = used / limit;
  return r >= 1 ? 'sai-panel__quota sai-panel__quota--over' : r >= 0.8 ? 'sai-panel__quota sai-panel__quota--warn' : 'sai-panel__quota';
});

function confirmClear() { if (confirm('確定要清除此建案的 AI 對話紀錄嗎？')) aiStore.clearHistory(); }

// ---- 狀態通知 ----
const notify = reactive({ show: false, unitId: '', oldStatus: null, newStatus: null, triggerType: 'update', recipients: [] });
function openNotify(result) {
  const n = result?.notification;
  if (!n || !n.statusChanged) return;
  Object.assign(notify, { show: true, unitId: result.unitId || '', oldStatus: n.oldStatus || null, newStatus: n.newStatus || null, triggerType: n.triggerType || 'update', recipients: n.eligibleRecipients || [] });
}
aiStore.registerNotifyHandler(openNotify);

watch(() => aiStore.isOpen, v => { if (!v) mobileFull.value = false; });
</script>

<style scoped>
.sai-panel {
  position: fixed;
  right: 16px;
  z-index: 1010;
  display: flex;
  flex-direction: column;
  background: #fff;
  border-radius: 16px;
  box-shadow: 0 12px 40px rgba(16, 32, 58, 0.22), 0 0 0 1px rgba(47, 107, 255, 0.12);
  overflow: hidden;
  max-width: calc(100vw - 24px);
}
.sai-panel--left { right: auto; left: 16px; }
.sai-panel__head {
  display: flex; align-items: center; gap: 8px; padding: 8px 8px 8px 12px;
  background: linear-gradient(135deg, #0B1B3A 0%, #17306B 60%, #1F3F8F 100%); color: #fff; cursor: move; user-select: none; touch-action: none;
}
.sai-panel--mobile .sai-panel__head { cursor: default; }
.sai-panel__title { flex: 1; min-width: 0; display: flex; flex-direction: column; }
.sai-panel__name { font-size: 14px; font-weight: 600; letter-spacing: 0.02em; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.sai-panel__meta { display: flex; gap: 8px; align-items: center; font-size: 11px; opacity: 0.85; }
.sai-panel__quota--warn { color: #FFD54F; }
.sai-panel__quota--over { color: #FF8A80; font-weight: 700; }
.sai-panel__cap { background: rgba(0, 229, 255, 0.18); color: #9FF7FF; border-radius: 999px; padding: 0 6px; }
.sai-panel__cap--ro { background: rgba(255, 255, 255, 0.14); color: #E3F2FD; }
.sai-panel__head .v-btn { color: #fff; }
.sai-panel__body { flex: 1; min-height: 0; display: flex; flex-direction: column; }
.sai-panel__resize { position: absolute; right: 0; bottom: 0; width: 18px; height: 18px; cursor: nwse-resize; background: linear-gradient(135deg, transparent 50%, rgba(47, 107, 255, 0.35) 50%); }
.sai-panel--left .sai-panel__resize { right: auto; left: 0; cursor: nesw-resize; background: linear-gradient(225deg, transparent 50%, rgba(47, 107, 255, 0.35) 50%); }

.sai-panel--mobile {
  left: 0; right: 0; bottom: 0; width: 100vw; max-width: 100vw; height: 72vh; border-radius: 16px 16px 0 0; transform: none !important;
  padding-bottom: env(safe-area-inset-bottom);
}
.sai-panel--mobile.sai-panel--full { height: 100dvh; border-radius: 0; }

.sai-panel-enter-active, .sai-panel-leave-active { transition: opacity 0.18s ease, transform 0.18s ease; }
.sai-panel-enter-from, .sai-panel-leave-to { opacity: 0; transform: translateY(12px) scale(0.98); }
</style>
