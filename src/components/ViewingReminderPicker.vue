<template>
  <div class="rm">
    <!-- 提醒對象是我方人員（負責銷售／建立者），不是客戶：標題與收件人一律顯示 -->
    <label class="rm-head">
      <span class="rm-title">LINE 提醒銷售</span>
      <span v-if="recipientName" class="rm-to">
        <v-icon size="15">mdi-account-tie</v-icon>{{ recipientName }}
      </span>
      <span v-if="recipientHasLine === false" class="mac-tag rm-tag">未綁定 LINE</span>
      <input
        type="checkbox"
        class="mac-switch"
        :checked="modelValue.enabled"
        @change="emitReminder({ enabled: $event.target.checked })"
      >
    </label>

    <div v-if="modelValue.enabled" class="rm-body">
      <div class="rm-chips">
        <span
          v-for="o in options"
          :key="o"
          class="rm-chip"
          :class="{ 'is-on': isOn(o), 'is-past': isPast(o), 'has-x': isCustom(o) }"
        >
          <button type="button" class="rm-chip-main" :disabled="!isOn(o) && (isPast(o) || isFull)" @click="toggle(o)">
            <v-icon v-if="isOn(o)" size="14">mdi-check</v-icon>{{ formatOffset(o) }}前
          </button>
          <button v-if="isCustom(o)" type="button" class="rm-chip-x" title="移除" @click="removeCustom(o)">
            <v-icon size="13">mdi-close</v-icon>
          </button>
        </span>
        <button v-if="!adding" type="button" class="rm-chip rm-chip--add" @click="adding = true">
          <v-icon size="14">mdi-plus</v-icon>自訂
        </button>
      </div>

      <div v-if="adding" class="rm-add">
        <input
          v-model.number="customValue"
          type="number"
          min="1"
          inputmode="numeric"
          class="mac-form-input rm-num"
          @keydown.enter.prevent="addCustom"
        >
        <select v-model.number="customUnit" class="mac-form-input mac-form-select rm-unit">
          <option v-for="u in REMINDER_UNITS" :key="u.value" :value="u.value">{{ u.label }}</option>
        </select>
        <span class="rm-suffix">前</span>
        <span class="mac-spacer"></span>
        <button type="button" class="mac-btn" @click="adding = false">取消</button>
        <button type="button" class="mac-btn mac-btn--primary" :disabled="!customMinutes" @click="addCustom">加入</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue';
import { REMINDER_PRESETS, MAX_REMINDERS, MAX_OFFSET_MINUTES, REMINDER_UNITS, formatOffset } from '@/utils/viewingReminder';

const props = defineProps({
  // { enabled, offsets }：offsets 為提前分鐘數
  modelValue: { type: Object, required: true },
  reservationTime: { type: Date, default: null },
  // 個人自訂的時間點（存在使用者偏好）
  customOffsets: { type: Array, default: () => [] },
  recipientName: { type: String, default: '' },
  // null：查詢中或未知
  recipientHasLine: { type: Boolean, default: null },
});
const emit = defineEmits(['update:modelValue', 'update:customOffsets']);

// 已過的時間點不能勾；表單開著時隨時間更新
const now = ref(Date.now());
let timer = null;
onMounted(() => { timer = setInterval(() => { now.value = Date.now(); }, 30 * 1000); });
onBeforeUnmount(() => clearInterval(timer));

const selected = computed(() => props.modelValue.offsets || []);
// 已勾選但不在預設／自訂清單的時間點（例如他人自訂）也要顯示
const options = computed(() =>
  [...new Set([...REMINDER_PRESETS, ...props.customOffsets, ...selected.value])].sort((a, b) => b - a)
);
const isFull = computed(() => selected.value.length >= MAX_REMINDERS);

const isOn = (o) => selected.value.includes(o);
const isCustom = (o) => props.customOffsets.includes(o) && !REMINDER_PRESETS.includes(o);
const isPast = (o) => !!props.reservationTime && props.reservationTime.getTime() - o * 60 * 1000 <= now.value;

const emitReminder = (patch) => emit('update:modelValue', { ...props.modelValue, ...patch });

const toggle = (o) => {
  const offsets = isOn(o) ? selected.value.filter(x => x !== o) : [...selected.value, o];
  emitReminder({ offsets: offsets.sort((a, b) => b - a) });
};

const adding = ref(false);
const customValue = ref(null);
const customUnit = ref(60);
const customMinutes = computed(() => {
  const n = Number(customValue.value);
  const minutes = n * customUnit.value;
  return Number.isInteger(n) && n > 0 && minutes <= MAX_OFFSET_MINUTES ? minutes : 0;
});

const addCustom = () => {
  const minutes = customMinutes.value;
  if (!minutes) return;
  if (!REMINDER_PRESETS.includes(minutes) && !props.customOffsets.includes(minutes)) {
    emit('update:customOffsets', [...props.customOffsets, minutes].sort((a, b) => b - a));
  }
  if (!isOn(minutes) && !isFull.value && !isPast(minutes)) toggle(minutes);
  adding.value = false;
  customValue.value = null;
};

const removeCustom = (o) => {
  emit('update:customOffsets', props.customOffsets.filter(x => x !== o));
  if (isOn(o)) toggle(o);
};
</script>

<style scoped>
.rm-head {
  display: flex;
  align-items: center;
  gap: 8px;
  min-height: 48px;
  padding: 8px 14px;
  cursor: pointer;
}
.rm-title { flex: 1 1 auto; font-size: 13px; font-weight: 500; color: #1d1d1f; white-space: nowrap; }
.rm-to { display: inline-flex; align-items: center; gap: 3px; min-width: 0; font-size: 12.5px; color: #6e6e73; overflow-wrap: anywhere; }
.rm-tag { --mac-tag-bg: rgba(255, 149, 0, 0.15); --mac-tag-color: #c25e00; }

.rm-body { padding: 10px 14px 12px; border-top: 1px solid #ececf0; }
.rm-chips { display: flex; flex-wrap: wrap; gap: 6px; }
.rm-chip {
  display: inline-flex;
  align-items: center;
  min-height: 28px;
  border-radius: 14px;
  background: rgba(0, 0, 0, 0.05);
  color: #1d1d1f;
  font-size: 13px;
}
.rm-chip.is-on { background: rgba(0, 113, 227, 0.12); color: #0058b0; }
.rm-chip.is-on.is-past { background: rgba(0, 0, 0, 0.05); color: #8e8e93; text-decoration: line-through; }
.rm-chip-main {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  padding: 3px 12px;
  border: 0;
  background: none;
  color: inherit;
  font: inherit;
  white-space: nowrap;
  cursor: pointer;
}
.rm-chip-main:disabled { color: #aeaeb2; cursor: default; }
.rm-chip.has-x .rm-chip-main { padding-right: 2px; }
.rm-chip-x {
  display: inline-grid;
  place-content: center;
  width: 22px;
  height: 22px;
  margin-right: 3px;
  border: 0;
  border-radius: 50%;
  background: none;
  color: inherit;
  cursor: pointer;
}
.rm-chip-x:hover { background: rgba(0, 0, 0, 0.08); }
.rm-chip--add {
  gap: 2px;
  padding: 3px 12px;
  border: 1px dashed rgba(0, 0, 0, 0.2);
  background: none;
  color: #0071e3;
  font: inherit;
  font-size: 13px;
  cursor: pointer;
}

.rm-add { display: flex; flex-wrap: wrap; align-items: center; gap: 6px; margin-top: 10px; }
.rm-add .rm-num { flex: 0 0 72px; }
.rm-add .rm-unit { flex: 0 0 84px; }
.rm-suffix { font-size: 13px; color: #6e6e73; }

@media (max-width: 600px) {
  .rm-head { padding: 10px 12px; }
  .rm-body { padding: 10px 12px 12px; }
  .rm-chip, .rm-chip--add { min-height: 32px; font-size: 14px; }
  .rm-add .mac-form-input { height: 34px; font-size: 16px; }
  .rm-add .mac-btn { height: 34px; font-size: 14px; }
}
</style>
