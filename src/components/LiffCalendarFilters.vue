<template>
  <div>
    <div class="mb-4">
      <h4 class="text-subtitle-1 mb-2">預約狀態</h4>
      
      <div class="switch-row">
        <label class="v-label text-body-1" for="status-switch-1">預約中</label>
        <v-switch
          id="status-switch-1"
          v-model="selectedStatuses"
          value="預約中"
          color="primary"
          hide-details
          inset
        ></v-switch>
      </div>
      <div class="switch-row">
        <label class="v-label text-body-1" for="status-switch-2">已完成</label>
        <v-switch
          id="status-switch-2"
          v-model="selectedStatuses"
          value="已完成"
          color="blue-grey"
          hide-details
          inset
        ></v-switch>
      </div>
      <div class="switch-row">
        <label class="v-label text-body-1" for="status-switch-3">取消</label>
        <v-switch
          id="status-switch-3"
          v-model="selectedStatuses"
          value="取消"
          color="error"
          hide-details
          inset
        ></v-switch>
      </div>
    </div>
    <v-divider class="my-4"></v-divider>
    <div>
      <h4 class="text-subtitle-1 mb-2">預約項目</h4>
      <div v-for="(itemType, index) in typeOptions" :key="itemType" class="switch-row">
        <label class="v-label text-body-1" :for="`type-switch-${index}`">{{ itemType }}</label>
        <v-switch
          :id="`type-switch-${index}`"
          v-model="selectedTypes"
          :value="itemType"
          color="teal-darken-1"
          hide-details
          inset
        ></v-switch>
      </div>
    </div>
    <v-divider class="my-4"></v-divider>
    <div>
      <h4 class="text-subtitle-1 mb-2">事件顯示內容</h4>
      <div v-for="(field, index) in displayFieldOptions" :key="field.key" class="switch-row">
        <label class="v-label text-body-1" :for="`field-switch-${index}`">{{ field.label }}</label>
        <v-switch
          :id="`field-switch-${index}`"
          v-model="selectedDisplayFields"
          :value="field.key"
          color="indigo"
          hide-details
          inset
        ></v-switch>
      </div>
    </div>
  </div>
</template>

<script setup>
import { defineModel, defineProps, ref } from 'vue';

// ✓ 修改：移除 onMounted 和 defineEmits，因為不再需要 'options-initialized' 事件

// 使用 defineModel 來建立與父元件的雙向綁定
const selectedStatuses = defineModel('selectedStatuses', { default: [] });
const selectedTypes = defineModel('selectedTypes', { default: [] });
const selectedDisplayFields = defineModel('selectedDisplayFields', { default: [] });

// props 和 typeOptions 保持不變
const props = defineProps({
  displayFieldOptions: {
    type: Array,
    default: () => []
  }
});

const typeOptions = ref(['初驗', '複驗', '交屋']);
</script>

<style scoped>
.switch-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 2px 0;
}
</style>