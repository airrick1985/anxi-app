<template>
  <div class="payment-details-container">
    <v-list density="compact" lines="two">
      <v-list-item v-for="payment in paymentBreakdown" :key="payment.name">
        <v-list-item-title>{{ payment.name }}</v-list-item-title>
        <v-list-item-subtitle>{{ payment.percentage }}</v-list-item-subtitle>
        <template v-slot:append>
          <span class="font-weight-bold">{{ payment.amount.toLocaleString() }} 萬</span>
        </template>
      </v-list-item>

      <v-divider class="my-2"></v-divider>
      
      <v-list-item v-if="packagePrice > 0" class="text-red">
        <v-list-item-title>配套方惠</v-list-item-title>
        <template v-slot:append>
          <span class="font-weight-bold">- {{ packagePrice.toLocaleString() }} 萬</span>
        </template>
      </v-list-item>

      <v-list-item>
        <v-list-item-title class="font-weight-bold">總價 (含車位)</v-list-item-title>
        <template v-slot:append>
          <span class="font-weight-bold text-primary">{{ finalTotalPrice.toLocaleString() }} 萬</span>
        </template>
      </v-list-item>
    </v-list>
  </div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  finalTotalPrice: { type: Number, required: true },
  packagePrice: { type: Number, required: true },
  paymentTermRow: { type: Object, default: null }, // 從 QuoteItem 傳入的、已配對好的那一行比例資料
});

// --- 輔助函式：解析百分比文字 (例如 '10%') 為小數 (0.1) ---
function parsePercent(percentString) {
  if (typeof percentString !== 'string' || !percentString.includes('%')) {
    return 0;
  }
  return parseFloat(percentString.replace('%', '')) / 100;
}

// --- 計算屬性 ---
const depositAmount = computed(() => {
  return props.paymentTermRow ? Number(props.paymentTermRow['訂金']) : 0;
});

const contractAmount = computed(() => {
  if (!props.paymentTermRow) return 0;
  const percent = parsePercent(props.paymentTermRow['簽約金%']);
  // 簽約金 = roundup(總價 * 簽約金%) - 訂金
  return Math.ceil(props.finalTotalPrice * percent) - depositAmount.value;
});

const installmentAmount = computed(() => {
  if (!props.paymentTermRow) return 0;
  const percent = parsePercent(props.paymentTermRow['工程期款%']);
  return Math.round(props.finalTotalPrice * percent);
});

const licenseAmount = computed(() => {
  if (!props.paymentTermRow) return 0;
  const percent = parsePercent(props.paymentTermRow['使照取得%']);
  return Math.round(props.finalTotalPrice * percent);
});

const handoverAmount = computed(() => {
  if (!props.paymentTermRow) return 0;
  const percent = parsePercent(props.paymentTermRow['交屋款%']);
  return Math.round(props.finalTotalPrice * percent);
});

const loanAmount = computed(() => {
  if (!props.paymentTermRow) return 0;
  // 貸款 = 總價 - 其他所有款項
  return props.finalTotalPrice - depositAmount.value - contractAmount.value - installmentAmount.value - licenseAmount.value - handoverAmount.value;
});

// --- 整理成陣列，方便模板 v-for 渲染 ---
const paymentBreakdown = computed(() => {
  if (!props.paymentTermRow) return [];
  return [
    { name: '訂金', percentage: '', amount: depositAmount.value },
    { name: '簽約金', percentage: props.paymentTermRow['簽約金%'], amount: contractAmount.value },
    { name: '工程期款', percentage: props.paymentTermRow['工程期款%'], amount: installmentAmount.value },
    { name: '使照取得款', percentage: props.paymentTermRow['使照取得%'], amount: licenseAmount.value },
    { name: '交屋款', percentage: props.paymentTermRow['交屋款%'], amount: handoverAmount.value },
    { name: '銀行貸款', percentage: props.paymentTermRow['銀行貸款%'], amount: loanAmount.value },
  ];
});

</script>

<style scoped>
.payment-details-container {
  padding: 8px 16px;
  background-color: #f5f5f5;
  border-top: 1px solid #e0e0e0;
}
</style>