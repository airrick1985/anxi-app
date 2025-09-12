<!-- /src/components/QuoteSidebar.vue -->
<template>
  <v-navigation-drawer
    :model-value="isOpen"
    @update:model-value="$emit('update:isOpen', $event)"
    location="right"
    temporary
    width="400"
    class="quote-sidebar"
  >
    <!-- ✅ 增加一個 v-if 來確保 quoteStore 已被正確初始化 -->
    <template v-if="quoteStore">
      <!-- 抽屜的標題 -->
      <v-toolbar color="primary" density="compact">
        <v-toolbar-title class="text-h6">報價單</v-toolbar-title>
        <v-spacer></v-spacer>
        <v-btn icon="mdi-close" @click="$emit('update:isOpen', false)"></v-btn>
      </v-toolbar>

      <!-- 當報價單為空時的提示 -->
      <div v-if="quoteStore.items && quoteStore.items.length === 0" class="empty-cart-card text-center pa-10">
        <v-icon size="80" color="grey-lighten-1">mdi-cart-off</v-icon>
        <p class="text-h6 text-grey-darken-1 mt-4">您的報價單是空的</p>
        <p class="text-body-1 text-grey">請從銷控表加入戶別。</p>
      </div>

      <!-- 報價列表 (可滾動) -->
      <v-list v-else-if="quoteStore.items" class="quote-list">
        <v-list-item
          v-for="item in quoteStore.items"
          :key="item.unitId"
          class="quote-item"
          lines="two"
        >
          <v-list-item-title class="font-weight-bold">{{ item.unitId }}</v-list-item-title>
          <v-list-item-subtitle>
            總價: {{ formatNumber(item.unitDetails['房屋總表價']) }} 萬 | 面積: {{ formatNumber(item.unitDetails.area_house_ping) }} 坪
          </v-list-item-subtitle>
          <template v-slot:append>
            <v-btn 
              icon="mdi-delete-outline" 
              variant="text" 
              color="grey" 
              size="small"
              @click="handleRemoveItem(item.unitId)"
            ></v-btn>
          </template>
        </v-list-item>
      </v-list>
      
      <!-- 固定的底部操作欄 -->
      <div class="summary-footer" v-if="quoteStore.items && quoteStore.items.length > 0">
         <div class="summary-text d-flex justify-space-between align-center">
          <span>已選擇 <strong class="highlight-text">{{ quoteStore.itemCount }}</strong> / {{ quoteStore.maxItems }} 戶</span>
          <v-btn color="error" variant="text" size="small" @click="handleClearQuote">清空全部</v-btn>
        </div>
        <v-btn block color="success" size="large" class="mt-4" @click="goToQuoteSettings" :disabled="quoteStore.itemCount === 0">
          <v-icon left>mdi-file-document-edit-outline</v-icon>
          進入報價設定
        </v-btn>
      </div>
    </template>
  </v-navigation-drawer>
</template>

<script setup>
import { defineProps, defineEmits } from 'vue';
import { useQuoteStore } from '@/store/quoteStore';
import { useRoute, useRouter } from 'vue-router'; // 引入 useRouter

const props = defineProps({ isOpen: Boolean });
const emit = defineEmits(['update:isOpen']);

const quoteStore = useQuoteStore();
const router = useRouter();
const route = useRoute(); // ✅ 獲取當前路由信息

// removeItem 和 clearQuote 可以直接從 store 中解構
const { removeItem, clearQuote } = quoteStore;

function handleRemoveItem(unitId) {
  const itemToRemove = quoteStore.items.find(item => item.unitId === unitId);
  if (itemToRemove && confirm(`確定要從報價單中移除 ${unitId} 嗎？`)) {
    // 使用 item 的 internalId 來呼叫 store action
    removeItem(itemToRemove.internalId);
  }
}
function handleClearQuote() {
  if (confirm('確定要清空所有已選戶別嗎？')) {
    clearQuote();
  }
}

function goToQuoteSettings() {
  const projectName = route.params.projectName;
  // ✅ 從當前路由的 meta 中獲取 viewMode
  const currentMode = route.meta.viewMode; 

  router.push({ 
    name: 'QuoteSettings', 
    params: { projectName },
    // ✅ 關鍵：將當前的 mode 作為 query 參數傳遞下去
    query: { viewMode: currentMode } 
  });
  emit('update:isOpen', false);
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