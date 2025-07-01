<template>
  <div class="payment-details-container">
    <div v-if="error" class="pa-4 text-center text-red bg-red-lighten-5">
      <p class="font-weight-bold">計算時發生錯誤</p>
      <p class="text-caption">{{ error }}</p>
    </div>

    <div v-else>
      <div class="payment-row header">
        <div class="payment-name">項目</div>
        <div class="payment-amount">金額 (萬)</div>
      </div>

      <div
        v-for="(item, index) in paymentBreakdown"
        :key="item.id || index"
        class="payment-row"
        :class="{ 'child-item': item.isChild, 'package-deal-row': item.isPackageDeal }"
      >
        <div class="payment-name">
          <div>
            <v-btn
              v-if="item.isExpandable"
              variant="text"
              density="compact"
              class="expand-button"
              @click="toggleExpansion(item.id)"
              :ripple="false"
            >
              {{ item.name }}
              <v-icon end>{{ item.isExpanded ? 'mdi-chevron-up' : 'mdi-chevron-down' }}</v-icon>
            </v-btn>
            <span v-else>{{ item.name }}</span>
          </div>
          <small v-if="item.displayValue" class="item-subtitle">
            {{ item.displayValue }}
          </small>
        </div>

        <div class="payment-amount">{{ item.formattedAmount }}</div>
      </div>

      <hr class="my-2">

      <div class="payment-row total">
        <div class="payment-name">總計</div>
        <div class="payment-amount final-total">{{ formattedTotalAmount }}</div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue';

const props = defineProps({
  // 常規期款
  paymentTermsData: { type: Array, required: true, default: () => [] },
  finalTotalPrice: { type: Number, required: true, default: 0 },
  isFirstTimeBuyer: { type: Boolean, required: true, default: false },

  // 配套期款
  usePackageDeal: { type: Boolean, default: false },
  packagePrice: { type: Number, default: 0 },
  packageTermsData: { type: Array, default: () => [] }
});

// --- 狀態管理 ---
const expandedItems = ref(new Set());
const calculatedAmounts = ref({});
const calculatedPackageAmounts = ref({});
const error = ref(null);

function toggleExpansion(itemId) {
  if (expandedItems.value.has(itemId)) {
    expandedItems.value.delete(itemId);
  } else {
    expandedItems.value.add(itemId);
  }
}

// --- 核心計算引擎 ---
function parseFormula(formula, context) {
  let expression = String(formula);
  expression = expression.replace(new RegExp(context.priceKeyword, 'g'), context.priceValue);
  
  // ✅ 只有當公式中真的有「條件設定值」時才替換
  if (expression.includes('條件設定值')) {
      expression = expression.replace(/條件設定值/g, context.currentTermValue);
  }

  const references = expression.match(/[A-Z]/g) || [];
  for (const refId of references) {
    if (context.results[refId] === undefined) {
      throw new Error(`公式無法計算，因為參照的項目 '${refId}' 尚未被計算。`);
    }
    expression = expression.replace(new RegExp(refId, 'g'), context.results[refId]);
  }

  try {
    return new Function(`return ${expression}`)();
  } catch (e) {
    throw new Error(`公式錯誤 "${formula}" -> "${expression}": ${e.message}`);
  }
}

function runCalculationEngine(terms, priceValue, priceKeyword, conditionContext = null) {
  const results = {};
  if (!terms || terms.length === 0) return results;

  const pendingTerms = new Map(terms.map(t => [t['編號'], t]));
  let calculationMadeInLoop = true;
  let loops = 0;

  while (pendingTerms.size > 0 && calculationMadeInLoop && loops < terms.length + 5) {
    calculationMadeInLoop = false;
    loops++;
    pendingTerms.forEach((term, id) => {
      if (!term['計算方式']) return;
      try {
        let currentTermValue = 0;
        // ✅ 只有在需要時 (處理期款比例) 才讀取條件欄
        if (conditionContext && term[conditionContext.conditionCol]) {
            currentTermValue = parseFloat(term[conditionContext.conditionCol]) || 0;
        }

        const context = {
          priceValue: priceValue,
          priceKeyword: priceKeyword,
          currentTermValue: currentTermValue,
          results: results
        };
        const amount = parseFormula(term['計算方式'], context);
        results[id] = applyRounding(amount, term['進位方式'], term['進位值']);
        pendingTerms.delete(id);
        calculationMadeInLoop = true;
      } catch (e) {
        // 暫時忽略
      }
    });
  }

  if (pendingTerms.size > 0) {
    const unresolvedIds = Array.from(pendingTerms.keys()).join(', ');
    throw new Error(`項目 ${unresolvedIds} 可能存在循環依賴或公式錯誤。`);
  }
  return results;
}

watch(
  () => [props.paymentTermsData, props.finalTotalPrice, props.isFirstTimeBuyer, props.packageTermsData, props.packagePrice, props.usePackageDeal],
  () => {
    try {
      error.value = null;
      const conditionCol = props.isFirstTimeBuyer ?
        (props.finalTotalPrice >= 4000 ? '>=4000首購' : '<4000首購') :
        (props.finalTotalPrice >= 4000 ? '>=4000非首購' : '<4000非首購');
      
      const conditionContext = { conditionCol };

      calculatedAmounts.value = runCalculationEngine(props.paymentTermsData, props.finalTotalPrice, '總價', conditionContext);
      
      if (props.usePackageDeal) {
        // ✅ 修正：計算配套期款時，不再傳遞 conditionContext
        calculatedPackageAmounts.value = runCalculationEngine(props.packageTermsData, props.packagePrice, '配套金額');
      }
    } catch (e) {
      error.value = e.message;
      console.error(e);
    }
  },
  { immediate: true, deep: true }
);

// --- 顯示邏輯 ---
const paymentBreakdown = computed(() => {
  if (error.value) return [];
  const breakdown = [];
  const conditionCol = props.isFirstTimeBuyer ?
    (props.finalTotalPrice >= 4000 ? '>=4000首購' : '<4000首購') :
    (props.finalTotalPrice >= 4000 ? '>=4000非首購' : '<4000非首購');

  // --- 處理常規期款 ---
  const regularParentIds = new Set(props.paymentTermsData.map(t => t['子項目']).filter(Boolean));
  const regularChildrenMap = new Map();
  props.paymentTermsData.forEach(term => {
    const parentId = term['子項目'];
    if (parentId) {
      if (!regularChildrenMap.has(parentId)) regularChildrenMap.set(parentId, []);
      regularChildrenMap.get(parentId).push(term);
    }
  });

  props.paymentTermsData.forEach(term => {
    if (term['子項目']) return;
    const id = term['編號'];
    const amount = calculatedAmounts.value[id] ?? 0;
    const isParent = regularParentIds.has(id);
    const isExpanded = expandedItems.value.has(id);
    const termValue = parseFloat(term[conditionCol]) || 0;
    let displayValue = '';
    if (term['類型'] === '百分比') {
        displayValue = `${(termValue * 100).toFixed(2).replace(/\.00$/, '')}%`;
    } else if (term['類型'] === '固定金額') {
        displayValue = `${termValue.toLocaleString('en-US')} 萬`;
    }

    breakdown.push({ id, name: term['項目名稱'], amount, formattedAmount: formatAmount(amount, term['進位值']), displayValue, isExpandable: isParent, isExpanded });
    
    if (isParent && isExpanded) {
      const children = regularChildrenMap.get(id) || [];
      children.forEach(childTerm => {
        const childId = childTerm['編號'];
        const childAmount = calculatedAmounts.value[childId] ?? 0;
        breakdown.push({ id: childId, name: childTerm['項目名稱'], amount: childAmount, formattedAmount: formatAmount(childAmount, childTerm['進位值']), displayValue: '', isChild: true });
      });
    }
  });
  
  // --- 處理配套期款 ---
  if (props.usePackageDeal) {
    const isPackageExpanded = expandedItems.value.has('__PACKAGE_DEAL__');
    breakdown.push({
      id: '__PACKAGE_DEAL__',
      name: '配套',
      amount: props.packagePrice,
      formattedAmount: formatAmount(props.packagePrice, '0'),
      isExpandable: props.packageTermsData.length > 0,
      isExpanded: isPackageExpanded,
      isPackageDeal: true
    });
    
    if (isPackageExpanded && props.packageTermsData.length > 0) {
      props.packageTermsData.forEach(term => {
        const id = term['編號'];
        const amount = calculatedPackageAmounts.value[id] ?? 0;
        breakdown.push({ id, name: term['項目名稱'], amount, formattedAmount: formatAmount(amount, term['進位值']), displayValue: '', isChild: true, isPackageDeal: true });
      });
    }
  }

  return breakdown;
});

// --- 總金額計算 ---
const totalAmount = computed(() => {
    // ✅ Bug 2 修正：直接加總 paymentBreakdown 中非子項目的金額
    return paymentBreakdown.value
        .filter(item => !item.isChild)
        .reduce((sum, item) => sum + item.amount, 0);
});

const formattedTotalAmount = computed(() => {
    const roundedTotal = applyRounding(totalAmount.value, '四捨五入', "0");
    return formatAmount(roundedTotal, "0");
});

// --- Helper 函式 (不變) ---
function applyRounding(value, method, precisionSpec) {
    const precision = String(precisionSpec).includes('.') ? String(precisionSpec).split('.')[1].length : 0;
    if (!method) return Number(value.toFixed(precision));
    const multiplier = Math.pow(10, precision);
    let roundedValue;
    switch (method) {
        case '無條件進位': roundedValue = Math.ceil(value * multiplier) / multiplier; break;
        case '四捨五入': roundedValue = Math.round(value * multiplier) / multiplier; break;
        case '無條件捨去': roundedValue = Math.floor(value * multiplier) / multiplier; break;
        default: roundedValue = value;
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
</script>

<style scoped>
/* ... 樣式與前一版相同 ... */
.payment-details-container {
  max-width: 500px;
  margin: 0 auto;
}
.payment-row {
  display: flex;
  padding: 6px 0;
  border-bottom: 1px solid #eee;
  align-items: center;
}
.payment-row.header { font-weight: bold; }

.package-deal-row .payment-name,
.package-deal-row .payment-amount {
    font-weight: 500;
    color: #00897B;
}
.package-deal-row.child-item .payment-name,
.package-deal-row.child-item .payment-amount {
    color: #00897B;
}


.payment-row.total {
  font-weight: bold;
  border-top: 2px solid #333;
  border-bottom: none;
  margin-top: 8px;
}

.payment-name {
  flex: 1;
  text-align: left;
  display: flex;
  flex-direction: column;
  justify-content: center;
  margin-right: 16px;
}
.payment-amount {
  flex: 0 0 120px;
  text-align: right;
  font-weight: 600;
  color: #333;
}

.item-subtitle {
  color: #888;
  font-size: 0.85em;
  margin-top: 2px;
}

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
  padding-left: 24px;
}

.child-item .payment-amount {
  font-weight: 400;
  color: #666;
  font-size: 0.95em;
}

.payment-amount.final-total {
  font-size: 1.5em;
  font-weight: bold;
  color: #1E88E5;
}
</style>