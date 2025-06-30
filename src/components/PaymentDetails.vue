<template>
  <div>
    <div class="payment-row header">
      <div class="payment-name">項目</div>
      <div class="payment-display-value">設定值</div>
      <div class="payment-amount">金額 (萬)</div>
    </div>

    <div 
      v-for="(item, index) in paymentBreakdown" 
      :key="index" 
      class="payment-row"
      :class="{ 'child-item': item.isChild }"
    >
      <div class="payment-name">
        <v-btn
          v-if="item.isExpandable"
          variant="text"
          density="compact"
          class="expand-button"
          @click="toggleExpansion(item.name)"
          :ripple="false"
        >
          {{ item.name }}
          <v-icon end>{{ item.isExpanded ? 'mdi-chevron-up' : 'mdi-chevron-down' }}</v-icon>
        </v-btn>
        <span v-else>{{ item.name }}</span>
      </div>

      <div class="payment-display-value">{{ item.displayValue }}</div>
      
      <div class="payment-amount">{{ item.formattedAmount }}</div>
    </div>

    <hr class="my-2">

    <div class="payment-row total">
      <div class="payment-name">總計</div>
      <div class="payment-display-value"></div>
      <div class="payment-amount">{{ formattedTotalAmount }}</div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';

const props = defineProps({
  paymentTermsData: { type: Array, required: true, default: () => [] },
  finalTotalPrice: { type: Number, required: true, default: 0 },
  isFirstTimeBuyer: { type: Boolean, required: true, default: false }
});

const expandedItems = ref(new Set());

function toggleExpansion(itemName) {
  if (expandedItems.value.has(itemName)) {
    expandedItems.value.delete(itemName);
  } else {
    expandedItems.value.add(itemName);
  }
}

const conditionColumn = computed(() => {
  const priceCondition = props.finalTotalPrice >= 4000 ? '>=4000' : '<4000';
  const buyerCondition = props.isFirstTimeBuyer ? '首購' : '非首購';
  return `${priceCondition}${buyerCondition}`;
});

function applyRounding(value, method, precisionSpec) {
  const precision = String(precisionSpec).includes('.') ? String(precisionSpec).split('.')[1].length : 0;
  if (!method || method === '固定金額') {
    return Number(value.toFixed(precision));
  }
  const multiplier = Math.pow(10, precision);
  let roundedValue;
  const valToProcess = value * multiplier;
  switch (method) {
    case '無條件進位':
      roundedValue = Math.ceil(valToProcess) / multiplier;
      break;
    case '四捨五入':
      roundedValue = Math.round(valToProcess) / multiplier;
      break;
    case '無條件捨去':
      roundedValue = Math.floor(valToProcess) / multiplier;
      break;
    default:
      roundedValue = value;
  }
  return Number(roundedValue.toFixed(precision));
}

function formatAmount(value, precisionSpec) {
  if (typeof value !== 'number') return value;
  const precision = String(precisionSpec).includes('.') ? String(precisionSpec).split('.')[1].length : 0;
  return value.toLocaleString('en-US', {
    minimumFractionDigits: precision,
    maximumFractionDigits: precision,
  });
}

const paymentBreakdown = computed(() => {
  const breakdown = [];
  if (!props.paymentTermsData || props.paymentTermsData.length === 0) {
    return breakdown;
  }

  props.paymentTermsData.forEach(term => {
    const itemName = term['項目名稱'] ? String(term['項目名稱']).trim() : '';
    if (!itemName) return;

    const type = term['類型'];
    const value = term[conditionColumn.value];
    const roundingMethod = term['進位方式'];
    const roundingPrecision = term['進位值'];
    const installments = Number(term['期數']) || 0;
    
    // ✅ 核心修改點 1：讀取「特殊項目」欄位
    const specialItemType = term['特殊項目'] ? String(term['特殊項目']).trim() : '';

    if (value === undefined || value === null || value === '') return;

    let displayValue = '';
    let amount = 0;
    const numericValue = parseFloat(value) || 0;

    if (type === '百分比') {
      displayValue = `${(numericValue * 100).toFixed(2).replace(/\.00$/, '')}%`;
      const calculatedAmount = props.finalTotalPrice * numericValue;
      amount = applyRounding(calculatedAmount, roundingMethod, roundingPrecision);
    } else if (type === '固定金額') {
      displayValue = numericValue.toLocaleString('en-US');
      amount = applyRounding(numericValue, '四捨五入', roundingPrecision);
    }

    const isExpanded = expandedItems.value.has(itemName);
    
    // ✅ 核心修改點 2：判斷條件從寫死的名稱改為讀取 `specialItemType`
    const isExpandableItem = (specialItemType === 'Y' && installments > 0);

    if (isExpandableItem) {
      // 1. 加入可展開的父項目
      breakdown.push({
        name: itemName,
        displayValue: displayValue,
        amount: amount,
        formattedAmount: formatAmount(amount, roundingPrecision),
        isExpandable: true,
        isExpanded: isExpanded,
      });

      // 2. 如果處於展開狀態，才加入子項目
      if (isExpanded) {
        const singleInstallmentRaw = amount / installments;
        const singleInstallmentRounded = applyRounding(singleInstallmentRaw, roundingMethod, roundingPrecision);
        let accumulatedAmount = 0;
        
        for (let i = 1; i < installments; i++) {
          accumulatedAmount += singleInstallmentRounded;
          breakdown.push({
            name: `第 ${i} 期`,
            displayValue: '',
            amount: singleInstallmentRounded,
            formattedAmount: formatAmount(singleInstallmentRounded, roundingPrecision),
            isChild: true,
          });
        }
        
        const lastInstallmentAmount = amount - accumulatedAmount;
        const finalLastInstallment = applyRounding(lastInstallmentAmount, '四捨五入', roundingPrecision);
        
        breakdown.push({
          name: `第 ${installments} 期`,
          displayValue: ``,
          amount: finalLastInstallment,
          formattedAmount: formatAmount(finalLastInstallment, roundingPrecision),
          isChild: true,
        });
      }
    } else {
      // 對於普通項目，直接加入
      breakdown.push({
        name: itemName,
        displayValue: displayValue,
        amount: amount,
        formattedAmount: formatAmount(amount, roundingPrecision),
      });
    }
  });

  return breakdown;
});

// 總金額計算邏輯不變
const totalAmount = computed(() => {
    let total = 0;
    if (!props.paymentTermsData) return 0;
    props.paymentTermsData.forEach(term => {
        const itemName = term['項目名稱'] ? String(term['項目名稱']).trim() : '';
        if (!itemName) return;
        const type = term['類型'];
        const value = term[conditionColumn.value];
        const roundingMethod = term['進位方式'];
        const roundingPrecision = term['進визначення']; // Note: This might be a typo in your original, should it be '進位值'? I've kept it for now.
        if (value === undefined || value === null || value === '') return;
        let amount = 0;
        const numericValue = parseFloat(value) || 0;
        if (type === '百分比') {
            const calculatedAmount = props.finalTotalPrice * numericValue;
            amount = applyRounding(calculatedAmount, roundingMethod, roundingPrecision);
        } else if (type === '固定金額') {
            amount = applyRounding(numericValue, '四捨五入', roundingPrecision);
        }
        total += amount;
    });
    return total;
});

const formattedTotalAmount = computed(() => {
    const totalPrecisionSpec = "0.00"; 
    const roundedTotal = applyRounding(totalAmount.value, '四捨五入', totalPrecisionSpec);
    return formatAmount(roundedTotal, totalPrecisionSpec);
});

</script>

<style scoped>
.payment-row {
  display: flex;
  justify-content: space-between;
  padding: 8px 0;
  border-bottom: 1px solid #eee;
  align-items: center;
}
.payment-row.header { font-weight: bold; }
.payment-row.total {
  font-weight: bold;
  font-size: 1.1em;
  border-top: 2px solid #333;
  border-bottom: none;
}
.payment-name { flex: 2; text-align: left; }
.payment-display-value {
  flex: 1;
  text-align: center;
  color: #888;
  font-size: 0.9em;
}
.payment-amount {
  flex: 1.5;
  text-align: right;
  font-weight: 600;
}

/* ✅ 新增樣式 */
.expand-button {
  padding: 0 !important;
  min-width: 0 !important;
  text-transform: none;
  font-weight: normal;
  letter-spacing: normal;
  color: inherit;
  justify-content: flex-start;
  width: 100%;
}
.child-item .payment-name {
  padding-left: 24px; /* 子項目縮排 */
  color: #555;
}
</style>