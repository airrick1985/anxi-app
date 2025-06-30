<template>
  <div>
    <div class="payment-row header">
      <div class="payment-name">項目</div>
      <div class="payment-display-value">設定值</div>
      <div class="payment-amount">金額 (萬)</div>
    </div>

    <div v-for="(item, index) in paymentBreakdown" :key="index" class="payment-row">
      <div class="payment-name">{{ item.name }}</div>
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
import { computed } from 'vue';

const props = defineProps({
  paymentTermsData: { type: Array, required: true, default: () => [] },
  finalTotalPrice: { type: Number, required: true, default: 0 },
  isFirstTimeBuyer: { type: Boolean, required: true, default: false }
});

const conditionColumn = computed(() => {
  const priceCondition = props.finalTotalPrice >= 4000 ? '>=4000' : '<4000';
  const buyerCondition = props.isFirstTimeBuyer ? '首購' : '非首購';
  return `${priceCondition}${buyerCondition}`;
});


// --- 主要修改區域 START ---

/**
 * ✅ 核心修正：此函式現在確保回傳的「數字」本身就已經是精確的
 * 它將計算結果轉換為指定精度的字串後，再轉回數字，從而完成精確的四捨五入或截斷
 */
function applyRounding(value, method, precisionSpec) {
  if (!method || method === '固定金額') {
    // 對於固定金額，如果 precisionSpec 有定義，也應用其精度
    const defaultPrecision = String(precisionSpec).includes('.') ? String(precisionSpec).split('.')[1].length : 0;
    return Number(value.toFixed(defaultPrecision));
  }

  const precision = String(precisionSpec).includes('.') ? String(precisionSpec).split('.')[1].length : 0;
  const multiplier = Math.pow(10, precision);
  let roundedValue;
  
  // 為了避免浮點數誤差，先將數值轉為整數進行運算
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
  
  // ✅ 關鍵步驟：使用 toFixed 將數字轉換為具有正確小數位數的字串，
  // 然後再用 Number() 轉回數字。這一步確保了計算值的精度。
  return Number(roundedValue.toFixed(precision));
}


/**
 * 顯示專用函式：將已計算好的精確數字，格式化為帶有千分位和正確小數點的字串
 */
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
    const itemName = term['項目名稱'];
    const type = term['類型'];
    const value = term[conditionColumn.value];
    const roundingMethod = term['進位方式'];
    const roundingPrecision = term['進位值'];
    const installments = term['工程期數'];

    if (value === undefined || value === null || value === '' || !itemName) {
      return;
    }

    let displayValue = '';
    let amount = 0; // 這是用於計算的、已確保精度的數字
    const numericValue = parseFloat(value) || 0;

    if (type === '百分比') {
      displayValue = `${(numericValue * 100).toFixed(2).replace(/\.00$/, '')}%`;
      const calculatedAmount = props.finalTotalPrice * numericValue;
      // 計算結果立刻通過 applyRounding 確保其精度
      amount = applyRounding(calculatedAmount, roundingMethod, roundingPrecision);
    } else if (type === '固定金額') {
      displayValue = numericValue.toLocaleString('en-US');
      // 固定金額也通過 applyRounding 來確保其符合定義的精度
      amount = applyRounding(numericValue, roundingMethod, roundingPrecision);
    }
    
    if (itemName === '工程期款' && installments > 0) {
      // 'amount' 已是進位後的總工程款
      const singleInstallmentRaw = amount / installments;
      // ✅ 修正點: 對每一期的基礎金額也進行精確的進位處理
      const singleInstallmentRounded = applyRounding(singleInstallmentRaw, roundingMethod, roundingPrecision);

      let accumulatedAmount = 0;
      for (let i = 1; i < installments; i++) {
        accumulatedAmount += singleInstallmentRounded;
        breakdown.push({
          name: `${itemName} (第 ${i} 期)`,
          displayValue: ``,
          amount: singleInstallmentRounded,
          formattedAmount: formatAmount(singleInstallmentRounded, roundingPrecision)
        });
      }
      
      // ✅ 修正點: 最後一期用總額減去前面期數的總和，並再次確保其精度
      const lastInstallmentAmount = amount - accumulatedAmount;
      const finalLastInstallment = applyRounding(lastInstallmentAmount, '四捨五入', roundingPrecision);
      
      breakdown.push({
        name: `${itemName} (第 ${installments} 期)`,
        displayValue: ``,
        amount: finalLastInstallment,
        formattedAmount: formatAmount(finalLastInstallment, roundingPrecision)
      });
    } else {
      breakdown.push({
        name: itemName,
        displayValue: displayValue,
        amount: amount, // 'amount' 已經是具有正確精度的數字
        formattedAmount: formatAmount(amount, roundingPrecision)
      });
    }
  });

  return breakdown;
});


const totalAmount = computed(() => {
  // ✅ 總計直接加總 paymentBreakdown 中已經過精度處理的 amount 值，結果自然正確
  return paymentBreakdown.value.reduce((sum, item) => sum + item.amount, 0);
});


const formattedTotalAmount = computed(() => {
    // 總金額預設顯示到小數點第二位
    const totalPrecisionSpec = "0.00"; 
    // ✅ 修正點: 對最終的總金額也應用一次 rounding，確保其精度
    const roundedTotal = applyRounding(totalAmount.value, '四捨五入', totalPrecisionSpec);
    return formatAmount(roundedTotal, totalPrecisionSpec);
});

// --- 主要修改區域 END ---
</script>

<style scoped>
.payment-row {
  display: flex;
  justify-content: space-between;
  padding: 8px 0;
  border-bottom: 1px solid #eee;
  align-items: center; /* 垂直置中 */
}
.payment-row.header {
  font-weight: bold;
}
.payment-row.total {
  font-weight: bold;
  font-size: 1.1em;
  border-top: 2px solid #333;
  border-bottom: none;
}
.payment-name {
  flex: 2; /* 佔用較多空間 */
  text-align: left;
}
/* MODIFICATION START: 新增 '設定值' 欄位樣式 */
.payment-display-value {
  flex: 1;
  text-align: center; /* 置中對齊 */
  color: #888; /* 使用灰色以區分 */
  font-size: 0.9em;
}
/* MODIFICATION END */
.payment-amount {
  flex: 1.5; /* 佔用中等空間 */
  text-align: right;
  font-weight: 600;
}
</style>