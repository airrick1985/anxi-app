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
        :class="{ 'child-item': item.isChild }"
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

      <div v-if="usePackageDeal" class="payment-row package-deal-row">
          <div class="payment-name">配套</div>
          <div class="payment-amount">{{ formatAmount(packagePrice, "0") }}</div>
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
  paymentTermsData: { type: Array, required: true, default: () => [] },
  finalTotalPrice: { type: Number, required: true, default: 0 },
  isFirstTimeBuyer: { type: Boolean, required: true, default: false },
  // ✅ 新增 Props
  usePackageDeal: { type: Boolean, default: false },
  packagePrice: { type: Number, default: 0 }
});

// --- 狀態管理 ---
const expandedItems = ref(new Set());
const calculatedAmounts = ref({});
const error = ref(null);

function toggleExpansion(itemId) {
  if (expandedItems.value.has(itemId)) {
    expandedItems.value.delete(itemId);
  } else {
    expandedItems.value.add(itemId);
  }
}

// --- 核心計算引擎 (此區塊不變) ---
function parseFormula(formula, context) {
  let expression = String(formula);
  expression = expression.replace(/總價/g, context.finalTotalPrice);
  expression = expression.replace(/條件設定值/g, context.currentTermValue);

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

function calculateAllItems() {
  error.value = null;
  const results = {};
  const terms = props.paymentTermsData;
  if (!terms || terms.length === 0) return {};

  const conditionCol = props.isFirstTimeBuyer ?
    (props.finalTotalPrice >= 4000 ? '>=4000首購' : '<4000首購') :
    (props.finalTotalPrice >= 4000 ? '>=4000非首購' : '<4000非首購');

  const pendingTerms = new Map(terms.map(t => [t['編號'], t]));
  let calculationMadeInLoop = true;
  let loops = 0;

  while (pendingTerms.size > 0 && calculationMadeInLoop && loops < terms.length + 5) {
    calculationMadeInLoop = false;
    loops++;

    pendingTerms.forEach((term, id) => {
      if (!term['計算方式']) return;
      try {
        const context = {
          finalTotalPrice: props.finalTotalPrice,
          currentTermValue: parseFloat(term[conditionCol]) || 0,
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
    error.value = `計算錯誤：項目 ${unresolvedIds} 可能存在循環依賴或公式錯誤。`;
    console.error(error.value);
  }

  return results;
}

watch(
  () => [props.paymentTermsData, props.finalTotalPrice, props.isFirstTimeBuyer],
  () => {
    calculatedAmounts.value = calculateAllItems();
  },
  { immediate: true, deep: true }
);

// --- 顯示邏輯 (此區塊不變) ---
const paymentBreakdown = computed(() => {
  const breakdown = [];
  const allCalculated = calculatedAmounts.value;
  if (Object.keys(allCalculated).length === 0 && props.paymentTermsData.length > 0) return [];

  const conditionCol = props.isFirstTimeBuyer ?
    (props.finalTotalPrice >= 4000 ? '>=4000首購' : '<4000首購') :
    (props.finalTotalPrice >= 4000 ? '>=4000非首購' : '<4000非首購');

  const parentIds = new Set(props.paymentTermsData.map(t => t['子項目']).filter(Boolean));
  const childrenMap = new Map();
  props.paymentTermsData.forEach(term => {
    const parentId = term['子項目'];
    if (parentId) {
      if (!childrenMap.has(parentId)) childrenMap.set(parentId, []);
      childrenMap.get(parentId).push(term);
    }
  });

  props.paymentTermsData.forEach(term => {
    if (term['子項目']) return;

    const id = term['編號'];
    const amount = allCalculated[id] ?? 0;
    const isParent = parentIds.has(id);
    const isExpanded = expandedItems.value.has(id);

    const termValue = parseFloat(term[conditionCol]) || 0;
    let displayValue = '';
    if (term['類型'] === '百分比') {
        displayValue = `${(termValue * 100).toFixed(2).replace(/\.00$/, '')}%`;
    } else if (term['類型'] === '固定金額') {
        displayValue = `${termValue.toLocaleString('en-US')} 萬`;
    }

    breakdown.push({
      id: id,
      name: term['項目名稱'],
      amount: amount,
      formattedAmount: formatAmount(amount, term['進位值']),
      displayValue: displayValue,
      isExpandable: isParent,
      isExpanded: isParent && isExpanded,
    });

    if (isParent && isExpanded) {
      const children = childrenMap.get(id) || [];
      children.forEach(childTerm => {
        const childId = childTerm['編號'];
        const childAmount = allCalculated[childId] ?? 0;

        breakdown.push({
          id: childId,
          name: childTerm['項目名稱'],
          amount: childAmount,
          formattedAmount: formatAmount(childAmount, childTerm['進位值']),
          displayValue: '',
          isChild: true,
        });
      });
    }
  });

  return breakdown;
});

// --- 總金額計算 ---
const totalAmount = computed(() => {
    const childIds = new Set(
        props.paymentTermsData.map(term => term['子項目']).filter(Boolean)
    );

    // 計算基礎總和 (不含子項目)
    let baseTotal = Object.entries(calculatedAmounts.value)
      .filter(([id, amount]) => !childIds.has(id))
      .reduce((sum, [id, amount]) => sum + amount, 0);
      
    // ✅ 新增：如果啟用配套，則加上配套金額
    if (props.usePackageDeal) {
        baseTotal += props.packagePrice;
    }
    
    return baseTotal;
});

const formattedTotalAmount = computed(() => {
    const roundedTotal = applyRounding(totalAmount.value, '四捨五入', "0");
    return formatAmount(roundedTotal, "0");
});

// --- Helper 函式 (此區塊不變) ---
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

/* ✅ 新增：為配套項目增加樣式 */
.package-deal-row {
    font-weight: 500;
    color: #000000; /* 您可以自訂顏色 */
}
.package-deal-row .payment-amount {
    font-weight: 700;
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