<template>
  <div class="date-input" :class="[`date-input--${variant}`, { 'is-invalid': invalid }]">
    <input
      ref="inputEl"
      class="date-input__field"
      :value="text"
      placeholder="yyyy/mm/dd"
      inputmode="numeric"
      autocomplete="off"
      :aria-label="ariaLabel"
      @input="onInput"
      @blur="onBlur"
    >
    <v-menu v-model="open" :close-on-content-click="false" location="bottom end" :offset="4">
      <template #activator="{ props: menuProps }">
        <!-- mousedown.prevent：點圖示時游標留在輸入框，不觸發 blur -->
        <button
          v-bind="menuProps"
          type="button"
          class="date-input__icon"
          :class="{ 'is-open': open }"
          tabindex="-1"
          :aria-label="`${ariaLabel}：開啟日曆`"
          @mousedown.prevent
        >
          <v-icon icon="mdi-calendar-month-outline" size="17" />
        </button>
      </template>
      <v-date-picker
        :model-value="pickerDate"
        hide-header
        show-adjacent-months
        @update:model-value="pick"
      />
    </v-menu>
  </div>
</template>

<script setup>
/**
 * 日期輸入：文字框（可直接打 2026/11/20、20261120、民國 115/11/20）＋日曆圖示點選
 * 取代原生 input type=date（Safari 會以灰字顯示今天日期、打數字常只進年份格，看似有值實際是空的）
 * v-model：yyyy-MM-dd 字串，清空為 ''；輸入中無法辨識時不更新
 */
import { computed, ref, watch } from 'vue';
import { formatDateIso, formatDateSlash, parseDateInput, toDateOrNull } from '@/utils/dateInput';

const props = defineProps({
  modelValue: { type: [Date, String, Object], default: null },
  // field：表單輸入框；cell：填滿表格儲存格（AG Grid 編輯器）
  variant: { type: String, default: 'field' },
  // 起始文字（表格直接打字開始編輯時帶入第一個字）；null＝顯示目前日期
  startText: { type: String, default: null },
  ariaLabel: { type: String, default: '日期' },
});
const emit = defineEmits(['update:modelValue', 'picked']);

const inputEl = ref(null);
const open = ref(false);
const text = ref(props.startText ?? formatDateSlash(props.modelValue));

const parsed = computed(() => parseDateInput(text.value));
const invalid = computed(() => parsed.value === undefined);
const pickerDate = computed(() => parsed.value || toDateOrNull(props.modelValue) || undefined);

// 外部改值時同步顯示；與輸入中的日期相同就不動，避免打字被改寫
watch(() => props.modelValue, (v) => {
  if (formatDateIso(parsed.value) !== formatDateIso(v)) text.value = formatDateSlash(v);
});

function onInput(e) {
  text.value = e.target.value;
  const d = parsed.value;
  if (d !== undefined) emit('update:modelValue', d ? formatDateIso(d) : '');
}

// 離開欄位：可辨識的統一成 yyyy/mm/dd，無法辨識的還原
function onBlur() {
  const d = parsed.value;
  text.value = d === undefined ? formatDateSlash(props.modelValue) : formatDateSlash(d);
}

function pick(d) {
  const date = toDateOrNull(d);
  if (!date) return;
  text.value = formatDateSlash(date);
  emit('update:modelValue', formatDateIso(date));
  open.value = false;
  emit('picked', date);
}

function focus(selectAll = true) {
  const el = inputEl.value;
  if (!el) return;
  el.focus();
  if (selectAll) el.select();
  else el.setSelectionRange(el.value.length, el.value.length);
}

/** 目前輸入：Date＝有效、null＝空白、undefined＝無法辨識 */
const currentValue = () => parsed.value;

defineExpose({ focus, currentValue });
</script>

<style scoped>
.date-input {
  position: relative;
  display: inline-flex;
  align-items: center;
  min-width: 0;
}
.date-input__field {
  width: 100%;
  min-width: 0;
  height: 100%;
  padding: 0 32px 0 9px;
  border: 0;
  outline: none;
  background: transparent;
  color: inherit;
  font: inherit;
}
.date-input__field::placeholder { color: #a1a1a6; }
.date-input__icon {
  position: absolute;
  top: 50%;
  right: 4px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 26px;
  height: 24px;
  margin-top: -12px;
  padding: 0;
  border: 0;
  border-radius: 5px;
  background: transparent;
  color: #6e6e73;
  cursor: pointer;
}
.date-input__icon:hover,
.date-input__icon.is-open { background: rgba(0, 0, 0, 0.06); color: #1d1d1f; }
.date-input__icon .v-icon { color: inherit; }
.is-invalid .date-input__field { color: #d70015; }

/* 表單 */
.date-input--field {
  width: 100%;
  max-width: 200px;
  height: 28px;
  border: 1px solid rgba(0, 0, 0, 0.14);
  border-radius: 6px;
  background: #fff;
  box-shadow: inset 0 0.5px 1px rgba(0, 0, 0, 0.05);
  font-size: 13px;
  transition: border-color 0.12s, box-shadow 0.12s;
}
.date-input--field:focus-within {
  border-color: #0071e3;
  box-shadow: 0 0 0 3px rgba(0, 113, 227, 0.22);
}
.date-input--field.is-invalid { border-color: #d70015; }

/* 表格儲存格 */
.date-input--cell { width: 100%; height: 100%; }
.date-input--cell .date-input__field { padding-left: calc(var(--ag-cell-horizontal-padding, 17px) - 1px); }

@media (max-width: 599.98px) {
  .date-input--field { max-width: none; height: 36px; font-size: 16px; }
}
</style>
