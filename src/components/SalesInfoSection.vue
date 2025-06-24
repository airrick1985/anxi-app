<template>
  <div v-if="salesData" class="info-section mt-4">
    <div class="section-title">
      <v-icon>mdi-information-outline</v-icon>
      銷售資訊
    </div>
    <v-list lines="one" density="compact" class="bg-transparent">
      <v-row>
        <v-col cols="12" sm="6">
          <v-list-item title="後台狀態" :subtitle="salesData['銷控後台狀態'] || 'N/A'"></v-list-item>
          <v-list-item title="銷售人員" :subtitle="salesData['銷售'] || 'N/A'"></v-list-item>
          <v-list-item title="持有車位" :subtitle="salesData['車位'] || '無'"></v-list-item>
        </v-col>
        <v-col cols="12" sm="6">
          <v-list-item title="小訂日期" :subtitle="formatDate(salesData['小訂日期'])"></v-list-item>
          <v-list-item title="補足日期" :subtitle="formatDate(salesData['補足日期'])"></v-list-item>
          <v-list-item title="簽約日期" :subtitle="formatDate(salesData['簽約日期'])"></v-list-item>
        </v-col>
      </v-row>
      <v-row dense>
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
    </v-list>

     <div class="section-title mt-4">
       <v-icon>mdi-currency-usd</v-icon>
       成交資訊
    </div>
    <v-list lines="one" density="compact" class="bg-transparent">
       <v-row>
        <v-col cols="12" sm="6" md="4">
          <v-list-item title="房屋成交價" :subtitle="`${formatNumber(salesData['房屋成交價'])} 萬`"></v-list-item>
        </v-col>  
        <v-col cols="12" sm="6" md="4">
          <v-list-item title="房屋成交單價" :subtitle="`${formatNumber(salesData['房屋成交單價'], 2)} 萬/坪`"></v-list-item>
        </v-col>
        <v-col cols="12" sm="6" md="4">
          <v-list-item title="車位成交價" :subtitle="`${formatNumber(salesData['車位成交價'])} 萬`"></v-list-item>
        </v-col>
        <v-col cols="12" sm="6" md="4">
          <v-list-item title="成交總價" class="font-weight-bold">
             <template #subtitle><span class="text-blue font-weight-bold text-h6">{{ formatNumber(salesData['成交總價']) }} 萬</span></template>
          </v-list-item>
        </v-col>
      
        <v-col cols="12" sm="6" md="4">
          <v-list-item title="溢差價">
            <template #subtitle><span :class="priceDifference.color" class="font-weight-bold text-h6">{{ priceDifference.text }}</span></template>
          </v-list-item>
        </v-col>
       </v-row>
    </v-list>

    <div class="section-title mt-4">
      <v-icon>mdi-account-details</v-icon>
      買方資訊
    </div>
    <v-list lines="one" density="compact" class="bg-transparent">
      <v-row>
        <v-col cols="12" md="6">
          <v-list-item title="買方姓名" :subtitle="salesData['買方姓名'] || 'N/A'"></v-list-item>
          <v-list-item title="身分證字號" :subtitle="salesData['身分證字號'] || 'N/A'"></v-list-item>
          <v-list-item title="出生年月日" :subtitle="formatDate(salesData['出生年月日'])"></v-list-item>
          <v-list-item title="聯絡電話" :subtitle="salesData['電話'] || 'N/A'"></v-list-item>
          <v-list-item title="EMAIL" :subtitle="salesData['EMAIL'] || 'N/A'"></v-list-item>
          <v-list-item title="通訊地址" :subtitle="salesData['通訊地址'] || 'N/A'"></v-list-item>
          <v-list-item title="戶籍地址" :subtitle="salesData['戶籍地址'] || 'N/A'"></v-list-item>
          <v-list-item title="介紹人姓名" :subtitle="salesData['介紹人姓名'] || 'N/A'"></v-list-item>
          <v-list-item title="介紹人電話" :subtitle="salesData['介紹人電話'] || 'N/A'"></v-list-item>
        </v-col>
        <v-col cols="12" md="6">
          <v-list-item title="性別" :subtitle="salesData['性別'] || 'N/A'"></v-list-item>
          <v-list-item title="婚姻狀況" :subtitle="salesData['婚姻狀況'] || 'N/A'"></v-list-item>
          <v-list-item title="行業別" :subtitle="salesData['行業別'] || 'N/A'"></v-list-item>
          <v-list-item title="職務" :subtitle="salesData['職務'] || 'N/A'"></v-list-item>
          <v-list-item title="購買用途" :subtitle="salesData['購買用途'] || 'N/A'"></v-list-item>
          <v-list-item title="曾否購買富宇房子" :subtitle="salesData['已購買富宇房子'] || 'N/A'"></v-list-item>
          <v-list-item title="緊急聯絡人" :subtitle="salesData['緊急聯絡人'] || 'N/A'"></v-list-item>
          <v-list-item title="緊急聯絡人電話" :subtitle="salesData['緊急聯絡人電話'] || 'N/A'"></v-list-item>
          <v-list-item title="緊急聯絡人關係" :subtitle="salesData['緊急聯絡人關係'] || 'N/A'"></v-list-item>
        </v-col>
      </v-row>
    </v-list>
    
   

    <v-divider class="my-2"></v-divider>
    
    <div class="note-section pa-2">
      <div class="note-title">備註</div>
      <p class="note-content">{{ salesData['備註'] || '無' }}</p>
    </div>
  </div>
</template>

<script setup>
import { computed, defineProps, watch } from 'vue'; 

const props = defineProps({
  salesData: { type: Object, required: true },
  allParkingData: { type: Array, default: () => [] } 
});

watch(() => props.salesData, (newData) => {
  if (newData) {
    console.log('--- [偵錯日誌] SalesInfoSection 元件收到的資料 ---');
    console.log('完整的 salesData prop:', newData);
    
    const hasTotalPrice = newData.hasOwnProperty('成交總價');
    console.log(`是否存在 '成交總價' 欄位? -> ${hasTotalPrice}`, `值為:`, hasTotalPrice ? newData['成交總價'] : '不存在');
    
    const hasPriceDiff = newData.hasOwnProperty('溢差價');
    console.log(`是否存在 '溢差價' 欄位? -> ${hasPriceDiff}`, `值為:`, hasPriceDiff ? newData['溢差價'] : '不存在');
    
    console.log('-------------------------------------------------');
  }
}, { immediate: true, deep: true });


function formatDate(dateString) {
  if (!dateString || typeof dateString !== 'string') return 'N/A';
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}/${month}/${day}`;
  } catch (error) {
    return dateString;
  }
}

function openFolderUrl() {
  if (props.salesData && props.salesData['資料夾URL']) {
    window.open(props.salesData['資料夾URL'], '_blank');
  }
}

function formatNumber(value, frac = 0) {
  const num = parseFloat(value);
  if (isNaN(num)) return '0';
  return num.toLocaleString('en-US', { minimumFractionDigits: frac, maximumFractionDigits: frac });
}

const priceDifference = computed(() => {
  const value = parseFloat(props.salesData['溢差價']);
  if (props.salesData['溢差價'] === undefined || isNaN(value)) {
    return { text: 'N/A', color: 'text-grey' };
  }
  const formattedValue = formatNumber(Math.abs(value));
  if (value > 0) {
    return { text: `+${formattedValue}`, color: 'text-blue' };
  } else if (value < 0) {
    return { text: `-${formattedValue}`, color: 'text-red' };
  } else {
    return { text: formatNumber(value), color: 'text-grey' };
  }
});
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
  border-bottom: 2px solid #e0e0e0;
  display: flex;
  align-items: center;
  gap: 8px;
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
  white-space: pre-wrap;
  word-break: break-all;
}
:deep(.v-list-item-title) {
  font-size: 0.8rem;
  color: #555;
  margin-bottom: 2px;
}
:deep(.v-list-item-subtitle), .text-h6 {
  font-size: 1rem !important; /* 原本是 1.1rem，微調成 1rem */
  font-weight: 500 !important;
  color: #212121 !important;
  line-height: 1.4 !important;
}
.v-list-item {
    padding: 4px 8px !important;
}
</style>