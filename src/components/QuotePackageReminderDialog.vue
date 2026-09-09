<template>
  <!-- ✅ [新增] 列印前配套提醒：列出「有配套價但未勾選配套」的戶別，讓使用者在此勾選後再進入列印 -->
  <v-dialog v-model="show" max-width="460" persistent>
    <div class="mac-dialog">
      <div class="mac-dialog-head">
        <div class="mac-dialog-icon">
          <v-icon size="30">mdi-package-variant-closed</v-icon>
        </div>
        <div class="mac-dialog-title">是否使用配套？</div>
        <div class="mac-dialog-message">
          以下 {{ units.length }} 戶有配套價但尚未勾選配套。請確認是否使用，再進入列印報價單。
        </div>
      </div>

      <div class="mac-list">
        <label
          v-for="u in units"
          :key="u.internalId"
          class="mac-list-row"
          :class="{ 'is-on': checked.includes(u.internalId) }"
        >
          <div class="mac-list-main">
            <div class="mac-list-title">
              {{ u.unitId }}
              <span v-if="u.propertyType" class="mac-list-sub">{{ u.propertyType }}</span>
            </div>
            <div class="mac-list-caption">
              <span>總價 {{ fmt(u.originalTotal) }} 萬</span>
              <span class="mac-arrow">→</span>
              <span class="mac-list-accent">配套價 {{ fmt(u.packagePrice) }} 萬</span>
              <span v-if="u.packageAmount > 0" class="mac-list-dim">（配套金額 {{ fmt(u.packageAmount) }} 萬）</span>
            </div>
          </div>
          <span class="mac-switch" :class="{ 'is-on': checked.includes(u.internalId) }">
            <input type="checkbox" class="mac-switch-input" :checked="checked.includes(u.internalId)" @change="toggle(u.internalId)">
            <span class="mac-switch-knob"></span>
          </span>
        </label>
      </div>

      <div class="mac-dialog-tools">
        <button type="button" class="mac-link" @click="toggleAll">
          {{ allChecked ? '全部不使用' : '全部使用' }}
        </button>
        <span class="mac-dialog-hint">已選 {{ checked.length }}／{{ units.length }} 戶使用配套</span>
      </div>

      <div class="mac-dialog-actions">
        <button type="button" class="mac-btn" @click="cancel">取消</button>
        <button type="button" class="mac-btn mac-btn--primary" @click="confirm">
          {{ checked.length > 0 ? `套用配套並列印` : '不使用配套，直接列印' }}
        </button>
      </div>
    </div>
  </v-dialog>
</template>

<script setup>
import { ref, computed, watch } from 'vue';

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  // [{ internalId, unitId, propertyType, originalTotal, packagePrice, packageAmount }]
  units: { type: Array, default: () => [] }
});
const emit = defineEmits(['update:modelValue', 'confirm', 'cancel']);

const show = computed({
  get: () => props.modelValue,
  set: (v) => emit('update:modelValue', v)
});

const checked = ref([]);
// 每次開啟重置為未勾選（提醒的本意是讓使用者主動決定）
watch(() => props.modelValue, (open) => { if (open) checked.value = []; });

const allChecked = computed(() => props.units.length > 0 && checked.value.length === props.units.length);

function toggle(id) {
  const idx = checked.value.indexOf(id);
  if (idx === -1) checked.value.push(id);
  else checked.value.splice(idx, 1);
}
function toggleAll() {
  checked.value = allChecked.value ? [] : props.units.map(u => u.internalId);
}
function fmt(n) {
  const num = Number(n) || 0;
  return num.toLocaleString('en-US', { maximumFractionDigits: 2 });
}
function cancel() {
  emit('cancel');
  show.value = false;
}
function confirm() {
  emit('confirm', [...checked.value]);
  show.value = false;
}
</script>

<style scoped>
/* macOS 風格提示視窗：置中圖示＋標題＋說明、清單列 + 開關、右下角主/次按鈕 */
.mac-dialog {
  --mac-text: #1d1d1f;
  --mac-secondary: #6e6e73;
  --mac-tertiary: #aeaeb2;
  --mac-accent: #0071e3;
  --mac-fill: #f2f2f7;
  --mac-border: #e5e5ea;
  background: rgba(246, 246, 248, 0.96);
  backdrop-filter: saturate(180%) blur(20px);
  -webkit-backdrop-filter: saturate(180%) blur(20px);
  border-radius: 14px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.22), 0 0 0 0.5px rgba(0, 0, 0, 0.12);
  padding: 22px 20px 16px;
  font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", "Helvetica Neue", "PingFang TC", "Noto Sans TC", sans-serif;
  color: var(--mac-text);
}
.mac-dialog-head { text-align: center; padding: 0 6px 14px; }
.mac-dialog-icon {
  display: inline-flex; align-items: center; justify-content: center;
  width: 60px; height: 60px; border-radius: 16px; margin-bottom: 10px;
  background: linear-gradient(180deg, #4fa3f7, #0a6fdc);
  color: #fff;
  box-shadow: 0 4px 10px rgba(10, 111, 220, 0.3), inset 0 0.5px 0 rgba(255, 255, 255, 0.4);
}
.mac-dialog-title { font-size: 15px; font-weight: 700; margin-bottom: 4px; }
.mac-dialog-message { font-size: 12.5px; color: var(--mac-secondary); line-height: 1.5; }

.mac-list {
  background: #fff;
  border: 1px solid var(--mac-border);
  border-radius: 10px;
  overflow: hidden;
  max-height: 300px;
  overflow-y: auto;
}
.mac-list-row {
  display: flex; align-items: center; justify-content: space-between; gap: 12px;
  padding: 10px 12px;
  border-bottom: 1px solid #f0f0f3;
  cursor: pointer;
  transition: background-color 0.12s;
}
.mac-list-row:last-child { border-bottom: 0; }
.mac-list-row:hover { background: #fafafc; }
.mac-list-row.is-on { background: rgba(0, 113, 227, 0.05); }
.mac-list-main { min-width: 0; display: flex; flex-direction: column; gap: 2px; }
.mac-list-title { font-size: 14px; font-weight: 600; display: flex; align-items: baseline; gap: 6px; }
.mac-list-sub { font-size: 11.5px; font-weight: 400; color: var(--mac-secondary); }
.mac-list-caption { font-size: 11.5px; color: var(--mac-secondary); display: flex; flex-wrap: wrap; align-items: center; gap: 4px; font-variant-numeric: tabular-nums; }
.mac-arrow { color: var(--mac-tertiary); }
.mac-list-accent { color: #2e7d32; font-weight: 600; }
.mac-list-dim { color: var(--mac-tertiary); }

/* macOS 開關 */
.mac-switch {
  position: relative; flex: 0 0 auto;
  width: 38px; height: 22px; border-radius: 11px;
  background: #e9e9eb; box-shadow: inset 0 0 0 0.5px rgba(0, 0, 0, 0.08);
  transition: background-color 0.18s;
}
.mac-switch.is-on { background: #34c759; }
.mac-switch-input { position: absolute; inset: 0; opacity: 0; margin: 0; cursor: pointer; }
.mac-switch-knob {
  position: absolute; top: 2px; left: 2px; width: 18px; height: 18px; border-radius: 50%;
  background: #fff; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.25), 0 0 0 0.5px rgba(0, 0, 0, 0.06);
  transition: transform 0.18s cubic-bezier(0.2, 0.8, 0.2, 1);
  pointer-events: none;
}
.mac-switch.is-on .mac-switch-knob { transform: translateX(16px); }
.mac-switch-input:focus-visible + .mac-switch-knob { box-shadow: 0 0 0 3px rgba(0, 113, 227, 0.35); }

.mac-dialog-tools { display: flex; align-items: center; justify-content: space-between; padding: 8px 2px 0; }
.mac-link { background: none; border: 0; padding: 0; font: inherit; font-size: 12px; color: var(--mac-accent); cursor: pointer; }
.mac-link:hover { text-decoration: underline; }
.mac-dialog-hint { font-size: 11.5px; color: var(--mac-tertiary); }

.mac-dialog-actions { display: flex; justify-content: flex-end; gap: 8px; margin-top: 14px; }

@media (max-width: 600px) {
  .mac-dialog { padding: 18px 14px 14px; border-radius: 12px; }
  .mac-dialog-actions { flex-direction: column-reverse; }
  .mac-dialog-actions .mac-btn { width: 100%; height: 36px; }
}
</style>
