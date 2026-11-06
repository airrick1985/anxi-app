<template>
  <div class="ppf">
    <v-select
      class="mac-vfield ppf-select"
      :model-value="selectValue"
      :items="items"
      item-title="title"
      item-value="value"
      variant="solo"
      flat
      density="compact"
      hide-details
      menu-icon="mdi-unfold-more-horizontal"
      aria-label="期別"
      :disabled="disabled"
      @update:model-value="onSelect"
    ></v-select>
    <v-text-field
      v-if="showCustomInput"
      class="mac-vfield ppf-custom"
      :model-value="modelValue"
      variant="solo"
      flat
      density="compact"
      hide-details
      placeholder="輸入期別名稱"
      aria-label="其他期別"
      :disabled="disabled"
      @update:model-value="value => emit('update:modelValue', value)"
    ></v-text-field>
  </div>
</template>

<script setup>
/** 期別欄位：下拉選建案或該戶的期別，選「其他」可自行輸入。規格：docs/SPEC_PaymentDueReminder.md §4.1 */
import { computed, ref } from 'vue';

const OTHER = '__other__';

const props = defineProps({
  modelValue: { type: String, default: '' },
  options: { type: Array, default: () => [] },
  disabled: { type: Boolean, default: false },
});
const emit = defineEmits(['update:modelValue']);

// 選了「其他」但還沒輸入時，值是空的，要記住輸入框還開著
const customMode = ref(false);

const value = computed(() => String(props.modelValue || ''));
const showCustomInput = computed(() => customMode.value || (!!value.value && !props.options.includes(value.value)));
const selectValue = computed(() => (showCustomInput.value ? OTHER : value.value));
const items = computed(() => [
  { title: '未指定', value: '' },
  ...props.options.map(option => ({ title: option, value: option })),
  { title: '其他', value: OTHER },
]);

function onSelect(next) {
  customMode.value = next === OTHER;
  if (next !== OTHER) {
    emit('update:modelValue', next || '');
  } else if (props.options.includes(value.value)) {
    emit('update:modelValue', '');
  }
}
</script>

<style scoped>
.ppf { display: flex; flex-direction: column; gap: 6px; min-width: 0; }
</style>
