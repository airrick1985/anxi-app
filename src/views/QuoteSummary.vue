<template>
<v-container class="quote-summary-page">
    <!-- ✅ 修改：頁面標題和操作按鈕 -->
    <div class="page-header d-flex justify-space-between align-center mb-4">
      <h1 class="text-h4 font-weight-bold text-primary">報價籃</h1>
      
      <!-- 將按鈕組合在一起 -->
      <div>
        <!-- 新增的返回按鈕 -->
        <v-btn 
          color="secondary" 
          variant="outlined" 
          class="mr-4"
          @click="goBack"
        >
          <v-icon left>mdi-arrow-left</v-icon>
          返回銷控表
        </v-btn>

        <!-- 現有的清空按鈕 -->
        <v-btn 
          color="error" 
          variant="outlined" 
          @click="handleClearQuote"
          :disabled="items.length === 0"
        >
          <v-icon left>mdi-delete-sweep-outline</v-icon>
          清空全部
        </v-btn>
      </div>
    </div>

    <!-- 當報價單為空時顯示的提示 -->
    <v-card v-if="items.length === 0" class="empty-cart-card text-center pa-10">
      <v-icon size="80" color="grey-lighten-1">mdi-cart-off</v-icon>
      <p class="text-h6 text-grey-darken-1 mt-4">您的報價單是空的</p>
      <p class="text-body-1 text-grey">請返回銷控表，將可售戶別加入報價。</p>
      <v-btn color="primary" class="mt-6" @click="goBack">返回銷控表</v-btn>
    </v-card>

    <!-- 報價列表 -->
    <v-row v-else>
      <v-col
        v-for="item in items"
        :key="item['戶別']"
        cols="12"
        md="6"
        lg="4"
      >
        <v-card class="quote-item-card" elevation="2">
          <v-card-title class="d-flex justify-space-between">
            <span class="font-weight-bold">{{ item['戶別'] }}</span>
            <v-btn 
              icon="mdi-close-circle" 
              variant="text" 
              color="grey"
              size="small"
              @click="handleRemoveItem(item['戶別'])"
              title="移除此戶別"
            ></v-btn>
          </v-card-title>

          <v-divider></v-divider>

          <v-list density="compact">
            <v-list-item>
              <template v-slot:prepend><v-icon size="small" class="mr-2">mdi-cash</v-icon></template>
              <v-list-item-title>房屋總價: <span class="value-text">{{ formatNumber(item['房屋總表價']) }} 萬</span></v-list-item-title>
            </v-list-item>
            <v-list-item>
              <template v-slot:prepend><v-icon size="small" class="mr-2">mdi-texture-box</v-icon></template>
              <v-list-item-title>房屋面積: <span class="value-text">{{ formatNumber(item['房屋面積(坪)']) }} 坪</span></v-list-item-title>
            </v-list-item>
          </v-list>
        </v-card>
      </v-col>
    </v-row>
    
    <!-- 底部固定的操作欄 -->
    <div class="summary-footer" v-if="items.length > 0">
      <v-row align="center">
        <v-col>
          <div class="summary-text">
            已選擇 <strong class="highlight-text">{{ itemCount }}</strong> / 5 戶
          </div>
        </v-col>
        <v-col class="text-right">
          <v-btn
            size="x-large"
            color="success"
            elevation="4"
          >
            <v-icon left>mdi-file-export-outline</v-icon>
            匯出報價
          </v-btn>
        </v-col>
      </v-row>
    </div>

  </v-container>
</template>

<script setup>
import { computed } from 'vue';
import { useRouter } from 'vue-router';
import { useQuoteStore } from '@/store/quoteStore';
import { storeToRefs } from 'pinia';

const router = useRouter();
const quoteStore = useQuoteStore();

// 使用 storeToRefs 來讓 state 和 getters 具有響應性
const { items, itemCount } = storeToRefs(quoteStore);

// 從 store 中獲取 actions
const { removeItem, clearQuote } = quoteStore;

function handleRemoveItem(unitId) {
  // 可以添加一個確認對話框
  if (confirm(`確定要從報價單中移除 ${unitId} 嗎？`)) {
    removeItem(unitId);
  }
}

function handleClearQuote() {
  if (confirm('確定要清空所有已選戶別嗎？')) {
    clearQuote();
  }
}

function goBack() {
  // 返回歷史上一頁，如果沒有上一頁，則去首頁
  router.go(-1);
}

// 數據格式化函數
function formatNumber(value) {
  const num = parseFloat(value);
  if (isNaN(num)) return 'N/A';
  return num.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 });
}
</script>

<style scoped>
.quote-summary-page {
  padding-bottom: 100px; /* 為固定的 footer 預留空間 */
}

.page-header {
  border-bottom: 2px solid #ddd;
  padding-bottom: 16px;
}

.empty-cart-card {
  border: 2px dashed #ccc;
  background-color: #f9f9f9;
}

.quote-item-card {
  transition: all 0.2s ease-in-out;
}
.quote-item-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 16px rgba(0,0,0,0.1) !important;
}

.value-text {
  font-weight: 500;
  color: #1a3a6e;
}

.summary-footer {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background-color: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(5px);
  padding: 16px 24px;
  box-shadow: 0 -4px 10px rgba(0,0,0,0.08);
  border-top: 1px solid #e0e0e0;
}

.summary-text {
  font-size: 1.1rem;
  font-weight: 500;
}

.highlight-text {
  color: #d81b60;
  font-size: 1.5rem;
}
</style>