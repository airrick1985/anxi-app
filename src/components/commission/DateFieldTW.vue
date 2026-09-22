<template>
  <v-text-field :model-value="modelValue" :label="label" placeholder="yyyy/mm/dd" variant="outlined" density="compact" hide-details
    inputmode="numeric" @update:model-value="v => emit('update:modelValue', v)" @blur="normalize">
    <template #append-inner>
      <v-menu v-model="open" :close-on-content-click="false" location="bottom end">
        <template #activator="{ props: menuProps }">
          <v-btn v-bind="menuProps" icon="mdi-calendar" size="small" variant="text" density="comfortable" :aria-label="`${label}：開啟日曆`" />
        </template>
        <v-date-picker :model-value="pickerDate" hide-header show-adjacent-months @update:model-value="pick" />
      </v-menu>
    </template>
  </v-text-field>
</template>

<script setup>
import { ref, computed } from 'vue';
import { formatDateTW, toDateValue } from '@/utils/commissionCalculation';

const props = defineProps({
  modelValue: { type: String, default: '' },
  label: { type: String, default: '日期' },
});
const emit = defineEmits(['update:modelValue']);
const open = ref(false);

const pickerDate = computed(() => toDateValue(props.modelValue));
function pick(d) {
  emit('update:modelValue', formatDateTW(d));
  open.value = false;
}
/** 離開欄位時把可解析的輸入（如 2026-9-3、2026/9/3）統一成 yyyy/MM/dd */
function normalize() {
  const raw = String(props.modelValue || '').trim();
  if (!raw) return;
  const m = raw.match(/^(\d{4})[/.-](\d{1,2})[/.-](\d{1,2})$/);
  if (!m) return;
  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  if (Number.isNaN(d.getTime()) || d.getMonth() !== Number(m[2]) - 1) return;
  const text = formatDateTW(d);
  if (text !== raw) emit('update:modelValue', text);
}
</script>
