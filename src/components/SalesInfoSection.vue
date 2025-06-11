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

        <!-- 右半部分 -->
        <v-col cols="12" sm="6">
          <v-list-item title="小訂日期" :subtitle="salesData['小訂日期'] || 'N/A'"></v-list-item>
          <v-list-item title="補足日期" :subtitle="salesData['補足日期'] || 'N/A'"></v-list-item>
          <v-list-item title="簽約日期" :subtitle="salesData['簽約日期'] || 'N/A'"></v-list-item>
        </v-col>
      </v-row>
      
      <v-divider class="my-2"></v-divider>

      <!-- 金額部分 -->
      <v-row dense>
        <v-col cols="4"><v-list-item title="小訂金額" :subtitle="`${formatNumber(salesData['小訂金額'])} 元`"></v-list-item></v-col>
        <v-col cols="4"><v-list-item title="補足金額" :subtitle="`${formatNumber(salesData['補足金額'])} 元`"></v-list-item></v-col>
        <v-col cols="4"><v-list-item title="簽約金額" :subtitle="`${formatNumber(salesData['簽約金額'])} 元`"></v-list-item></v-col>
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
import { defineProps } from 'vue';

const props = defineProps({
  salesData: {
    type: Object,
    required: true,
  }
});

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