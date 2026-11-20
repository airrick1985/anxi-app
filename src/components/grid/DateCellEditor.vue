<template>
  <MacDateInput
    ref="field"
    v-model="value"
    variant="cell"
    :start-text="startText"
    :aria-label="params.colDef?.headerName || '日期'"
    @picked="onPicked"
  />
</template>

<script setup>
/**
 * AG Grid 日期編輯器：文字輸入＋日曆圖示（取代 agDateCellEditor 的原生 date input）
 * 回傳 Date（當地午夜）；清空回傳 null；無法辨識的輸入維持原值
 */
import { nextTick, ref } from 'vue';
import MacDateInput from '@/components/MacDateInput.vue';
import { formatDateIso } from '@/utils/dateInput';

const props = defineProps({ params: { type: Object, required: true } });

// 直接打字開始編輯：從該字元開始；Backspace／Delete 開始：清空
const key = props.params.eventKey;
const startText = key === 'Backspace' || key === 'Delete' ? '' : (typeof key === 'string' && key.length === 1 ? key : null);
const value = ref(startText === null ? formatDateIso(props.params.value) : '');
const field = ref(null);

function getValue() {
  const d = field.value?.currentValue();
  if (d === undefined) return props.params.value;
  if (d === null) return null;
  // 同一天回傳原值，避免沒改也寫入
  return formatDateIso(d) === formatDateIso(props.params.value) ? props.params.value : d;
}

function afterGuiAttached() {
  field.value?.focus(startText === null);
}

// 從日曆選完直接完成編輯
function onPicked() {
  nextTick(() => props.params.stopEditing());
}

defineExpose({ getValue, afterGuiAttached });
</script>
