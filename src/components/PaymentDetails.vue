<template>
  <div class="payment-details-container">
    <div class="payment-list">
      <div v-for="payment in paymentBreakdown" :key="payment.name" class="payment-item-wrapper">
 <div class="payment-row">
  <div class="payment-info">
    <div class="payment-name">{{ payment.name }}</div>
    <div class="payment-percentage">{{ payment.percentage }}</div>
  </div>

  <div class="payment-value-group">
    <div class="payment-amount">{{ payment.amount.toLocaleString() }} 萬</div>
    
    <v-btn
      v-if="payment.name === '工程期款' && detailedInstallments.length > 0"
      :icon="isExpanded ? 'mdi-chevron-up' : 'mdi-chevron-down'"
      variant="text"
      size="small"
      @click="isExpanded = !isExpanded"
      class="expand-button"
    ></v-btn>
    <div v-else class="expand-button-placeholder"></div>
  </div>
        </div>

        <v-expand-transition>
          <div v-if="payment.name === '工程期款' && isExpanded" class="installment-details">
            <div v-for="installment in detailedInstallments" :key="installment.period" class="installment-row">
              <span class="installment-period">第 {{ installment.period }} 期</span>
              <span class="installment-amount">{{ installment.amount.toLocaleString() }} 萬</span>
            </div>
             <div class="installment-row total">
              <span>合計</span>
              <span>{{ totalInstallmentFromDetails.toLocaleString() }} 萬</span>
            </div>
          </div>
        </v-expand-transition>
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
import { ref, computed } from 'vue';

const props = defineProps({
  finalTotalPrice: { type: Number, required: true },
  packagePrice: { type: Number, required: true },
  paymentTermRow: { type: Object, default: null },
  // ✅ 新增 prop 來接收期款比例資料，以便讀取 "工程期數"
  paymentTermsData: { type: Array, default: () => [] }
});

const isExpanded = ref(false);

const depositAmount = computed(() => props.paymentTermRow ? Number(props.paymentTermRow['訂金']) : 0);
const contractAmount = computed(() => {
  if (!props.paymentTermRow) return 0;
  const percent = Number(props.paymentTermRow['簽約金%']) || 0;
 
  return Math.ceil(props.finalTotalPrice * percent) - (depositAmount.value );
});
const installmentAmountTotal = computed(() => {
  if (!props.paymentTermRow) return 0;
  const percent = Number(props.paymentTermRow['工程期款%']) || 0;
  return Math.round(props.finalTotalPrice  * percent);
});
const licenseAmount = computed(() => {
  if (!props.paymentTermRow) return 0;
  const percent = Number(props.paymentTermRow['使照取得%']) || 0;
  return Math.round(props.finalTotalPrice * percent);
});
const handoverAmount = computed(() => {
  if (!props.paymentTermRow) return 0;
  const percent = Number(props.paymentTermRow['交屋款%']) || 0;
  return Math.ceil(props.finalTotalPrice  * percent);
});
const loanAmount = computed(() => {
  if (!props.paymentTermRow) return 0;
  const percent = Number(props.paymentTermRow['銀行貸款%']) || 0;
  return Math.floor(props.finalTotalPrice  * percent);
});

// ✅ 從傳入的 paymentTermsData 中獲取工程總期數
const engineeringInstallmentCount = computed(() => {
  if (props.paymentTermsData.length > 0 && props.paymentTermsData[0]['工程期數']) {
    const count = parseInt(props.paymentTermsData[0]['工程期數'], 10);
    return isNaN(count) ? 0 : count;
  }
  return 0;
});

const detailedInstallments = computed(() => {
  const N = engineeringInstallmentCount.value;
  // 至少要有2期才能分
  if (N < 2) return [];

  const totalInstallment = installmentAmountTotal.value;
  
  // 計算第一期至倒數第二期的金額，並四捨五入到萬位
  const amountPerInstallmentRaw = totalInstallment / (N );
  const pricePerInstallmentRoundedToTenThousand = Math.round(amountPerInstallmentRaw );
  
  const installments = [];
  let sumOfFirstInstallments = 0;

  // 生成第一期至倒數第二期的款項
  for (let i = 1; i < N; i++) {
    installments.push({ period: i, amount: pricePerInstallmentRoundedToTenThousand });
    sumOfFirstInstallments += pricePerInstallmentRoundedToTenThousand;
  }
  
  // 計算最後一期的金額
  const lastInstallmentAmount = installmentAmountTotal.value - sumOfFirstInstallments;

// 將最後一期加入陣列
installments.push({ period: N, amount: lastInstallmentAmount });

  return installments;
});

// ✅ 計算詳細分期加總，用於驗證
const totalInstallmentFromDetails = computed(() => {
  return detailedInstallments.value.reduce((sum, item) => sum + item.amount, 0);
});


const paymentBreakdown = computed(() => {
  if (!props.paymentTermRow) return [];
  const formatPercent = (val) => `${Math.round((Number(val) || 0) * 100)}%`;

  return [
    // 訂金通常是整數萬，所以不用動
    { name: '訂金', percentage: `${depositAmount.value.toLocaleString()} 萬`, amount: depositAmount.value },
    
    // ✅ 對每個計算結果，除以10000後，立即進行四捨五入
    { name: '簽約金', percentage: formatPercent(props.paymentTermRow['簽約金%']), amount: Math.ceil(contractAmount.value ) },
    { name: '工程期款', percentage: formatPercent(props.paymentTermRow['工程期款%']), amount: Math.round(installmentAmountTotal.value ) },
    { name: '使照取得款', percentage: formatPercent(props.paymentTermRow['使照取得%']), amount: Math.round(licenseAmount.value ) },
    { name: '交屋款', percentage: formatPercent(props.paymentTermRow['交屋款%']), amount: Math.round(handoverAmount.value ) },
    { name: '銀行貸款', percentage: formatPercent(props.paymentTermRow['銀行貸款%']), amount: Math.round(loanAmount.value ) },
  ];
  // 註：因為已經取整，最後的 .map(...) 就不再需要了，可以刪除，讓程式碼更乾淨。
});
</script>

<style scoped>
.payment-details-container {
  padding: 8px 16px 16px 16px;
  background-color: #f7f9fc;
  border-top: 1px dashed #ccc;
  display: flex;
  justify-content: center;
}
.payment-list {
  width: 100%;
  max-width: 400px;
}
.payment-item-wrapper {
  display: flex;
  flex-direction: column;
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
.expand-button {
  margin-left: 8px;
  min-width: 40px; /* 確保按鈕有足夠空間 */
}
.expand-button-placeholder {
  width: 40px;
  margin-left: 8px;
}
.installment-details {
  padding: 8px 16px 8px 32px; /* 增加左側內縮 */
  background-color: #ffffff;
  border-radius: 4px;
  margin-top: 4px;
  border: 1px solid #e0e0e0;
}
.installment-row {
  display: flex;
  justify-content: space-between;
  padding: 4px 0;
  font-size: 0.9rem;
  color: #424242;
}
.installment-row.total {
  font-weight: bold;
  color: #000;
  border-top: 1px solid #ccc;
  margin-top: 4px;
  padding-top: 6px;
}

/* ✅ 新增這個 class */
.payment-value-group {
  display: flex;
  align-items: center;
}

.payment-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 6px 4px;
}
</style>