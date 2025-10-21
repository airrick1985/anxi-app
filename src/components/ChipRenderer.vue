<template>
  <v-chip v-if="option" :color="option.color || 'grey'" variant="outlined" size="small" label>
    <v-icon v-if="option.icon" start size="small">{{ option.icon }}</v-icon>
    {{ value }}
  </v-chip>
  <span v-else>{{ value }}</span>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  value: String, // 當前紀錄的值
  // type: String, // status, level, progress (目前未使用，但可保留)
  options: Array // 從 Console 傳入的該類型選項陣列 [{ id, value, color, icon, ... }]
});

const option = computed(() => {
  if (!props.options || props.options.length === 0) return null;
  return props.options.find(opt => opt.value === props.value);
});
</script>