<template>
  <div>
    <h4 class="text-subtitle-1 mb-2">預約狀態</h4>
    <v-checkbox v-model="selectedStatuses" label="預約中" value="預約中" density="compact" hide-details color="primary"></v-checkbox>
    <v-checkbox v-model="selectedStatuses" label="已完成" value="已完成" density="compact" hide-details color="green"></v-checkbox>
    <v-checkbox v-model="selectedStatuses" label="取消" value="取消" density="compact" hide-details color="red"></v-checkbox>
  </div>
  <v-divider class="my-4"></v-divider>
  <div>
    <h4 class="text-subtitle-1 mb-2">預約項目</h4>
    <v-checkbox v-model="selectedTypes" label="初驗" value="初驗" density="compact" hide-details color="blue"></v-checkbox>
    <v-checkbox v-model="selectedTypes" label="複驗" value="複驗" density="compact" hide-details color="orange"></v-checkbox>
  </div>
  <v-divider class="my-4"></v-divider>
  <div>
    <h4 class="text-subtitle-1 mb-2">事件顯示內容</h4>
    <v-checkbox v-for="field in displayFieldOptions" :key="field.key" v-model="selectedDisplayFields" :label="field.label" :value="field.key" density="compact" hide-details color="indigo"></v-checkbox>
  </div>
</template>

<script setup>
import { defineModel } from 'vue';

// 使用 defineModel 來建立與父元件的雙向綁定
const selectedStatuses = defineModel('selectedStatuses', { default: [] });
const selectedTypes = defineModel('selectedTypes', { default: [] });
const selectedDisplayFields = defineModel('selectedDisplayFields', { default: [] });
const displayFieldOptions = defineModel('displayFieldOptions', { default: [] });
</script>