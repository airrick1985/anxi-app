<template>
  <div class="payment-details-container">
    <div class="payment-list">
      <div v-for="payment in paymentBreakdown" :key="payment.name" class="payment-row">
        <div class="payment-info">
          <div class="payment-name">{{ payment.name }}</div>
          <div class="payment-percentage">{{ payment.percentage }}</div>
        </div>
        <div class="payment-amount">{{ payment.amount.toLocaleString() }} 萬</div>
      </div>

      <v-divider class="my-2"></v-divider>

      <div v-if="packagePrice > 0" class="payment-row">
        <div class="payment-info">
          <div class="payment-name text-blue-darken-2">配套方案</div>
        </div>
        <div class="payment-amount text-blue-darken-2">+ {{ packagePrice.toLocaleString() }} 萬</div>
      </div>

      <v-divider class="my-2"></v-divider>

      <div class="payment-row total-row">
        <div class="payment-info">
          <div class="payment-name font-weight-bold">總價 (含車位)</div>
        </div>
        <div class="final-price">{{ finalTotalPrice.toLocaleString() }} 萬</div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  finalTotalPrice: { type: Number, required: true },
  packagePrice: { type: Number, required: true },
  paymentTermRow: { type: Object, default: null },
});

// --- Script 內容維持不變 ---
const depositAmount = computed(() => props.paymentTermRow ? Number(props.paymentTermRow['訂金']) : 0);
const contractAmount = computed(() => {
  if (!props.paymentTermRow) return 0;
  const percent = Number(props.paymentTermRow['簽約金%']) || 0;
  return Math.ceil(props.finalTotalPrice * percent) - depositAmount.value;
});
const installmentAmount = computed(() => {
  if (!props.paymentTermRow) return 0;
  const percent = Number(props.paymentTermRow['工程期款%']) || 0;
  return Math.round(props.finalTotalPrice * percent);
});
const licenseAmount = computed(() => {
  if (!props.paymentTermRow) return 0;
  const percent = Number(props.paymentTermRow['使照取得%']) || 0;
  return Math.round(props.finalTotalPrice * percent);
});
const handoverAmount = computed(() => {
  if (!props.paymentTermRow) return 0;
  const percent = Number(props.paymentTermRow['交屋款%']) || 0;
  return Math.round(props.finalTotalPrice * percent);
});
const loanAmount = computed(() => {
  if (!props.paymentTermRow) return 0;
  return props.finalTotalPrice - depositAmount.value - contractAmount.value - installmentAmount.value - licenseAmount.value - handoverAmount.value;
});

const paymentBreakdown = computed(() => {
  if (!props.paymentTermRow) return [];
  const formatPercent = (val) => `${Math.round((Number(val) || 0) * 100)}%`;
  return [
    { name: '訂金', percentage: `${depositAmount.value} 萬`, amount: depositAmount.value },
    { name: '簽約金', percentage: formatPercent(props.paymentTermRow['簽約金%']), amount: contractAmount.value },
    { name: '工程期款', percentage: formatPercent(props.paymentTermRow['工程期款%']), amount: installmentAmount.value },
    { name: '使照取得款', percentage: formatPercent(props.paymentTermRow['使照取得%']), amount: licenseAmount.value },
    { name: '交屋款', percentage: formatPercent(props.paymentTermRow['交屋款%']), amount: handoverAmount.value },
    { name: '銀行貸款', percentage: formatPercent(props.paymentTermRow['銀行貸款%']), amount: loanAmount.value },
  ];
});
</script>

<style scoped>
.payment-details-container {
  padding: 8px 16px 16px 16px;
  background-color: #f7f9fc;
  border-top: 1px dashed #ccc;
  display: flex; /* ✅ 讓內層容器可以置中 */
  justify-content: center; /* ✅ 讓內層容器可以置中 */
}

/* ✅ 2. 新增列表容器樣式 */
.payment-list {
  width: 100%; /* 在手機上佔滿 */
  max-width: 400px; /* 在桌機上的最大寬度 */
}

.payment-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 6px 4px;
}

.payment-info {
  text-align: left;
}
.payment-name {
  font-size: 1rem;
  color: #333;
}
.payment-percentage {
  font-size: 0.85rem;
  color: #555;
}
.payment-amount {
  font-size: 1rem;
  font-weight: 600;
  color: #111;
  min-width: 100px; 
  text-align: right;
}
.total-row .payment-name {
  font-size: 1.1rem;
}
.final-price {
  font-size: 1.2rem;
  font-weight: bold;
  color: #1E88E5;
  min-width: 100px;
  text-align: right;
}
</style>