<template>
  <!-- 使用 v-navigation-drawer，並設置為從右側滑出 -->
  <v-navigation-drawer
    :model-value="isOpen"
    @update:model-value="$emit('update:isOpen', $event)"
    location="right"
    temporary
    width="400"
    class="quote-sidebar"
  >
    <!-- 抽屜的標題 -->
    <v-toolbar color="primary" density="compact">
      <v-toolbar-title class="text-h6">報價單</v-toolbar-title>
      <v-spacer></v-spacer>
      <v-btn icon="mdi-close" @click="$emit('update:isOpen', false)"></v-btn>
    </v-toolbar>

    <!-- 當報價單為空時的提示 -->
    <div v-if="items.length === 0" class="empty-cart-card text-center pa-10">
      <v-icon size="80" color="grey-lighten-1">mdi-cart-off</v-icon>
      <p class="text-h6 text-grey-darken-1 mt-4">您的報價單是空的</p>
      <p class="text-body-1 text-grey">請從銷控表加入戶別。</p>
    </div>

    <!-- 報價列表 (可滾動) -->
    <v-list v-else class="quote-list">
      <v-list-item
        v-for="item in items"
        :key="item['戶別']"
        class="quote-item"
        lines="two"
      >
        <v-list-item-title class="font-weight-bold">{{ item['戶別'] }}</v-list-item-title>
        <v-list-item-subtitle>
          總價: {{ formatNumber(item['房屋總表價']) }} 萬 | 面積: {{ formatNumber(item['房屋面積(坪)']) }} 坪
        </v-list-item-subtitle>
        <template v-slot:append>
          <v-btn 
            icon="mdi-delete-outline" 
            variant="text" 
            color="grey" 
            size="small"
            @click="handleRemoveItem(item['戶別'])"
          ></v-btn>
        </template>
      </v-list-item>
    </v-list>
    
    <!-- 固定的底部操作欄 -->
    <div class="summary-footer" v-if="items.length > 0">
       <div class="summary-text d-flex justify-space-between align-center">
        <span>已選擇 <strong class="highlight-text">{{ itemCount }}</strong> / 5 戶</span>
        <v-btn color="error" variant="text" size="small" @click="handleClearQuote">清空全部</v-btn>
      </div>
      <v-btn block color="success" size="large" class="mt-4">
        <v-icon left>mdi-file-export-outline</v-icon>
        匯出報價
      </v-btn>
    </div>
  </v-navigation-drawer>
</template>

<script setup>
import { defineProps, defineEmits } from 'vue';
import { useQuoteStore } from '@/store/quoteStore';
import { storeToRefs } from 'pinia';

// Props 和 Emits 用於父組件控制開關
defineProps({ isOpen: Boolean });
const emit = defineEmits(['update:isOpen']);

const quoteStore = useQuoteStore();
const { items, itemCount } = storeToRefs(quoteStore);
const { removeItem, clearQuote } = quoteStore;

function handleRemoveItem(unitId) {
  if (confirm(`確定要從報價單中移除 ${unitId} 嗎？`)) {
    removeItem(unitId);
  }
}
function handleClearQuote() {
  if (confirm('確定要清空所有已選戶別嗎？')) {
    clearQuote();
  }
}
function formatNumber(value) {
  const num = parseFloat(value);
  if (isNaN(num)) return 'N/A';
  return num.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 });
}
</script>

<style scoped>
.quote-sidebar {
  display: flex;
  flex-direction: column;
  height: 100%;
}
.quote-list {
  flex-grow: 1;
  overflow-y: auto;
}
.quote-item {
  border-bottom: 1px solid #e0e0e0;
}
.summary-footer {
  flex-shrink: 0;
  padding: 16px;
  border-top: 1px solid #e0e0e0;
  background-color: white;
}
.highlight-text {
  color: #d81b60;
  font-size: 1.2rem;
}
.empty-cart-card {
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
}
</style>