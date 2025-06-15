<!-- /src/components/SalesInfoSection.vue -->
<template>
  <div class="info-section mt-4">
    <div class="section-title">
      <v-icon left>mdi-information-outline</v-icon>
      銷售資訊
    </div>
    
    <v-list lines="one" dense>
      <v-row>
        <!-- 左半部分 -->
        <v-col cols="12" sm="6">
          <v-list-item title="後台狀態" :subtitle="salesData['銷控後台狀態'] || 'N/A'"></v-list-item>
          <v-list-item title="銷售人員" :subtitle="salesData['銷售'] || 'N/A'"></v-list-item>
          <v-list-item title="買方姓名" :subtitle="salesData['買方姓名'] || 'N/A'"></v-list-item>
          
          <!-- 資料夾連結 -->
          <v-list-item v-if="salesData['資料夾URL']">
            <template v-slot:prepend>
              <v-btn 
                icon 
                variant="text" 
                color="info" 
                @click="openFolderUrl"
                title="打開雲端資料夾"
              >
                <v-icon>mdi-folder-open</v-icon>
              </v-btn>
            </template>
            <v-list-item-title>相關文件資料夾</v-list-item-title>
          </v-list-item>
        </v-col>

       <v-col cols="12" sm="6">
        <!-- ✅ 應用 formatDate 函數 -->
        <v-list-item 
          title="小訂日期" 
          :subtitle="formatDate(salesData['小訂日期'])"
        ></v-list-item>
        <v-list-item 
          title="補足日期" 
          :subtitle="formatDate(salesData['補足日期'])"
        ></v-list-item>
        <v-list-item 
          title="簽約日期" 
          :subtitle="formatDate(salesData['簽約日期'])"
        ></v-list-item>
      </v-col>
    </v-row>
      
      <v-divider class="my-2"></v-divider>

      <!-- 金額部分 -->
    <v-row dense>
        <!-- 
          ✅ 關鍵修改：
          - cols="12": 在最小的螢幕上 (xs)，每欄佔滿 12 格寬度，即換行。
          - sm="4": 在 sm (small) 及更大的螢幕上，每欄佔 4 格寬度，恢復三欄佈局。
        -->
        <v-col cols="12" sm="4">
          <v-list-item title="小訂金額" :subtitle="`${formatNumber(salesData['小訂金額'])} 元`"></v-list-item>
        </v-col>
        <v-col cols="12" sm="4">
          <v-list-item title="補足金額" :subtitle="`${formatNumber(salesData['補足金額'])} 元`"></v-list-item>
        </v-col>
        <v-col cols="12" sm="4">
          <v-list-item title="簽約金額" :subtitle="`${formatNumber(salesData['簽約金額'])} 元`"></v-list-item>
        </v-col>
      </v-row>

      <v-divider class="my-2"></v-divider>
      
      <!-- 備註部分 -->
      <div class="note-section pa-2">
        <div class="note-title">備註</div>
        <p class="note-content">{{ salesData['備註'] || '無' }}</p>
      </div>

    </v-list>
  </div>
</template>

<script setup>
import { computed, defineProps } from 'vue';

const props = defineProps({
  salesData: {
    type: Object,
    required: true,
  }
});

// ✅ 新增：日期格式化輔助函數
function formatDate(dateString) {
  // 如果傳入的日期字符串是空的或無效的，直接返回 'N/A'
  if (!dateString || typeof dateString !== 'string') {
    return 'N/A';
  }

  try {
    const date = new Date(dateString);
    // 檢查轉換後的日期是否有效
    if (isNaN(date.getTime())) {
      // 如果無效，可能是一個非標準格式，直接返回原始字符串或 'N/A'
      return dateString; 
    }

    const year = date.getFullYear();
    // getMonth() 返回的是 0-11，所以需要 +1
    // String(...).padStart(2, '0') 確保月份和日期是兩位數，例如 07, 09
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    // 返回我們想要的格式
    return `${year}/${month}/${day}`;

  } catch (error) {
    console.error(`日期格式化失敗: ${dateString}`, error);
    return dateString; // 如果發生未知錯誤，返回原始字符串
  }
}

function openFolderUrl() {
  if (props.salesData && props.salesData['資料夾URL']) {
    window.open(props.salesData['資料夾URL'], '_blank');
  }
}

// 輔助函數：格式化數字
function formatNumber(value) {
  const num = parseFloat(value);
  return isNaN(num) ? '0' : num.toLocaleString();
}
</script>

<style scoped>
.info-section {
  padding: 8px;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
}
.section-title {
  font-size: 1.1rem;
  font-weight: 600;
  color: #1a3a6e;
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 2px solid #1a3a6e;
}
.note-section {
  background-color: #fafafa;
  border-radius: 4px;
}
.note-title {
  font-size: 0.8rem;
  color: #555;
  font-weight: 500;
}
.note-content {
  font-size: 0.9rem;
  white-space: pre-wrap; /* 讓備註可以自動換行 */
  word-break: break-all;
}
:deep(.v-list-item-subtitle) {
  font-size: 1rem;
  font-weight: 500;
  color: #333;
}
</style>