<template>
  <div>
    <div v-if="isMobile" class="quote-item-mobile">
      <div class="d-flex justify-space-between align-center mb-2">
       <span class="text-h6 font-weight-bold text-primary">{{ item.unitId }}</span>
        <v-btn
          color="red"
          variant="flat"
     size="small"
     @click="emit('remove')"
    >
     刪除
    </v-btn>
      </div>
   <v-list lines="one" density="compact" class="bg-transparent">
    <v-list-item class="pl-0"><v-list-item-title>房屋總價</v-list-item-title><template v-slot:append><strong class="highlight-dark">{{ displayHousePrice }} 萬</strong></template></v-list-item>
    <v-list-item class="pl-0"><v-list-item-title>房屋單價</v-list-item-title><template v-slot:append><strong>{{ displayUnitPrice }} 萬/坪</strong></template></v-list-item>
    <v-divider class="my-2"></v-divider>
    
    <v-list-item class="pl-0">
     <v-list-item-title>房屋總面積</v-list-item-title>
     <template v-slot:append>
      <v-menu open-on-click location="top">
       <template v-slot:activator="{ props: menuProps }">
        <v-btn v-bind="menuProps" size="medium" variant="tonal" density="comfortable">
         {{ formatNumber(item.unitDetails.area_house_ping) }} 坪
         <v-icon end>mdi-information-outline</v-icon>
        </v-btn>
       </template>
       <v-card min-width="280">
        <v-card-title class="text-subtitle-1 font-weight-bold pa-3 text-center bg-grey-lighten-5">
         詳細面積資訊
        </v-card-title>
        <v-divider></v-divider>
        <v-table density="compact">
         <tbody>
          <tr class="font-weight-bold bg-blue-grey-lighten-5">
           <td>房屋總面積</td>
           <td class="text-right">{{ formatNumber(item.unitDetails.area_house_ping) }} 坪</td>
          </tr>
          <tr v-for="(detail, i) in areaDetails" :key="i">
           <td class="text-grey-darken-1">{{ detail.label }}</td>
           <td class="text-right">
            {{ detail.isPercentage ? formatPercentage(detail.value) : `${formatNumber(detail.value)} ${detail.unit}` }}
           </td>
          </tr>
         </tbody>
        </v-table>
       </v-card>
      </v-menu>
     </template>
    </v-list-item>

    <v-divider class="my-2"></v-divider>
    <v-list-item class="pl-0"><v-list-item-title>車位</v-list-item-title><template v-slot:append><v-btn size="small" variant="tonal" @click="openParkingModal">{{ parkingDisplayText }}</v-btn></template></v-list-item>
    <v-list-item class="pl-0"><v-list-item-title>車位價格</v-list-item-title><template v-slot:append><strong class="highlight-dark">{{ formattedParkingPrice }}</strong></template></v-list-item>
    <v-divider class="my-2"></v-divider>
    
    <v-list-item class="pl-0">
     <template v-if="showPackageDeal" v-slot:prepend>
      <v-switch class="mr-4" v-model="usePackageDealModel" :disabled="!item.unitDetails.price_package_deal" label="配套" color="primary" density="compact" hide-details inset></v-switch>
     </template>
     <v-radio-group v-model="isFirstTimeBuyerModel" inline density="compact" hide-details>
      <template v-slot:label><span class="text-body-2">首購:</span></template>
      <v-radio label="是" value="是" density="compact"></v-radio>
      <v-radio label="否" value="否" density="compact"></v-radio>
     </v-radio-group>
    </v-list-item>
    
    <v-divider class="my-2"></v-divider>
    <v-list-item v-if="showPackageDeal" class="pl-0"><v-list-item-title>配套價</v-list-item-title><template v-slot:append><strong class="final-price">{{ packagePrice.toLocaleString() }} 萬</strong></template></v-list-item>
    <v-list-item class="pl-0"><v-list-item-title class="font-weight-bold">總價</v-list-item-title><template v-slot:append><strong class="final-price">{{ finalTotalPrice.toLocaleString() }} 萬</strong></template></v-list-item>
   </v-list>
   <v-btn block @click="isPaymentDetailsVisible = !isPaymentDetailsVisible" :append-icon="isPaymentDetailsVisible ? 'mdi-chevron-up' : 'mdi-chevron-down'" class="mt-2" size="small">
    付款方式
   </v-btn>
    </div>

    <div v-else class="quote-item-row">
      <div class="item-cell flex-1 text-h6 font-weight-bold text-primary">{{ item.unitId }}</div>
   
   <div class="item-cell flex-1">
    <v-menu open-on-click location="top">
     <template v-slot:activator="{ props: menuProps }">
      <v-btn v-bind="menuProps" variant="tonal" density="compact">
       {{ formatNumber(item.unitDetails.area_house_ping) }} 坪
      </v-btn>
     </template>
     <v-card min-width="300">
      <v-card-title class="text-subtitle-1 font-weight-bold pa-3 text-center bg-grey-lighten-5">
       詳細面積資訊
      </v-card-title>
      <v-divider></v-divider>
      <v-table density="compact">
       <tbody>
        <tr class="font-weight-bold bg-blue-grey-lighten-5">
         <td>房屋總面積</td>
         <td class="text-right">{{ formatNumber(item.unitDetails.area_house_ping) }} 坪</td>
        </tr>
        <tr v-for="(detail, i) in areaDetails" :key="i">
         <td class="text-grey-darken-1">{{ detail.label }}</td>
         <td class="text-right">
          {{ detail.isPercentage ? formatPercentage(detail.value) : `${formatNumber(detail.value)} ${detail.unit}` }}
         </td>
        </tr>
       </tbody>
      </v-table>
     </v-card>
    </v-menu>
   </div>

   <div class="item-cell flex-1 highlight-dark">{{ displayHousePrice }} 萬</div>
   <div class="item-cell flex-1">{{ displayUnitPrice }} 萬/坪</div>
   <div class="item-cell flex-2"><v-btn density="compact" variant="tonal" @click="openParkingModal">{{ parkingDisplayText }}</v-btn></div>
   <div class="item-cell flex-1 highlight-dark"><span>{{ formattedParkingPrice }}</span></div>
   <div class="item-cell flex-1">
    <v-radio-group v-model="isFirstTimeBuyerModel" inline density="compact" hide-details>
     <v-radio label="是" value="是"></v-radio>
     <v-radio label="否" value="否"></v-radio>
    </v-radio-group>
   </div>
   <div class="item-cell flex-1 final-price">{{ finalTotalPrice.toLocaleString() }} 萬</div>
   
   <template v-if="showPackageDeal">
    <div class="item-cell flex-1"><v-checkbox v-model="usePackageDealModel" :disabled="!item.unitDetails.price_package_deal" density="compact" hide-details></v-checkbox></div>
    <div class="item-cell flex-1 final-price">{{ packagePrice.toLocaleString() }} 萬</div>
   </template>

   <div class="item-cell flex-1">
    <v-btn @click="isPaymentDetailsVisible = !isPaymentDetailsVisible" size="small" :append-icon="isPaymentDetailsVisible ? 'mdi-chevron-up' : 'mdi-chevron-down'">
     付款方式
    </v-btn>
   </div>
   <div class="item-cell flex-shrink-0">
    <v-btn icon="mdi-close-circle-outline" variant="text" color="red" @click="emit('remove')"></v-btn>
   </div>
    </div>

<v-expand-transition>
  <div v-show="isPaymentDetailsVisible">

    <div v-if="isLoading" class="text-center pa-4">
      <v-progress-circular indeterminate color="primary"></v-progress-circular>
      <div class="mt-2 text-caption">付款方式計算中...</div>
    </div>

    <div v-else-if="paymentTermsData && paymentTermsData.length > 0" class="pa-2 bg-grey-lighten-5">
      <PaymentDetails
        :payment-terms-data="paymentTermsData"
        :package-terms-data="packageTermsData"
        :final-total-price="finalTotalPrice"
        :is-first-time-buyer="isFirstTimeBuyerBoolean"
        :use-package-deal="usePackageDealModel"
        :package-price="packagePrice"
      />
    </div>

    <div v-else class="text-center pa-4 text-red bg-grey-lighten-4">
      缺少有效的期款比例設定，請至後台確認。
    </div>

  </div>
</v-expand-transition>

    <!-- 車位選擇 Modal -->
    <ParkingEditModal 
      v-model:show="isParkingModalOpen"
      :allParkingData="allParkingData"
      :initialSelectedParking="item.selectedParking || []"
      @confirm="handleParkingUpdate"
      mode="quote"
      :unitId="item.internalId"
      @request-open-slide="emit('request-open-slide')"
    />
    </div>
</template>

// /src/components/QuoteItem.vue

<script setup>
import { ref, computed, defineProps, defineEmits, onMounted, watch } from 'vue'; // ★★★ 1. 引入 watch ★★★
import { useQuoteStore } from '@/store/quoteStore';
import { useDisplay } from 'vuetify';
import PaymentDetails from './PaymentDetails.vue';
import ParkingEditModal from './ParkingEditModal.vue';

const props = defineProps({
  item: { type: Object, required: true },
  paymentTermsData: { type: Array, default: () => [] },
  packageTermsData: { type: Array, default: () => [] },
  showPackageDeal: { type: Boolean, default: true },
  isLoading: { type: Boolean, default: false },
  allParkingData: { type: Array, default: () => [] } // 新增車位資料 prop
});

const emit = defineEmits(['remove', 'request-open-slide']);
const quoteStore = useQuoteStore();
const { mobile } = useDisplay();
const isMobile = computed(() => mobile.value);
const isPaymentDetailsVisible = ref(false);

// 車位選擇相關狀態
const isParkingModalOpen = ref(false);

// ★★★ 2. 新增：從 QuoteSettings 搬過來的計算引擎 ★★★
// (理想上應該放在共用的 utils 或 composable 中，但為求簡單先放這裡)
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

function parseFormula(formula, context) {
    let expression = String(formula);
    expression = expression.replace(/(\d+(\.\d+)?)%/g, (match, number) => `(${number}/100)`);
    expression = expression.replace(new RegExp(context.priceKeyword, 'g'), context.priceValue);
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
        throw new Error(`公式錯誤 "${formula}" -> 最終表達式 "${expression}": ${e.message}`);
    }
}

function runCalculationEngine(terms, priceValue, priceKeyword, conditionContext = null) {
    const results = {};
    if (!terms || terms.length === 0 || !priceValue) return results;
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
                if (conditionContext && term[conditionContext.conditionCol]) {
                    currentTermValue = parseFloat(term[conditionContext.conditionCol]) || 0;
                }
                const context = { priceValue, priceKeyword, currentTermValue, results };
                const amount = parseFormula(term['計算方式'], context);
                results[id] = applyRounding(amount, term['進位方式'], term['進位值']);
                pendingTerms.delete(id);
                calculationMadeInLoop = true;
            } catch (e) {
                // Silent catch
            }
        });
    }
    if (pendingTerms.size > 0) {
        // 在正式環境中，可以選擇不拋出錯誤，只在 console 提示
        console.warn(`項目 ${Array.from(pendingTerms.keys()).join(', ')} 可能存在循環依賴或公式錯誤。`);
    }
    return results;
}


const formatNumber = (val, frac = 2) => {
  const num = parseFloat(val);
  if (isNaN(num)) return 'N/A';
  return num.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: frac });
};

const isFirstTimeBuyerModel = computed({
  get: () => props.item.isFirstTimeBuyer,
  set: (value) => quoteStore.updateUnitField(props.item.internalId, 'isFirstTimeBuyer', value)
});

const isFirstTimeBuyerBoolean = computed(() => isFirstTimeBuyerModel.value === '是');

const usePackageDealModel = computed({
  get: () => props.item.usePackageDeal,
  set: (value) => quoteStore.updateUnitField(props.item.internalId, 'usePackageDeal', value)
});

const packagePrice = computed(() => quoteStore.getPackagePrice(props.item.internalId));
const finalTotalPrice = computed(() => quoteStore.getFinalTotalPrice(props.item.internalId));
const parkingTotalPrice = computed(() => quoteStore.getParkingTotalPrice(props.item.internalId));
const displayHousePrice = computed(() => formatNumber(quoteStore.getRawDisplayHousePrice(props.item.internalId)));
const displayUnitPrice = computed(() => formatNumber(quoteStore.getDisplayUnitPrice(props.item.internalId), 2));


// ★★★ 3. 新增：計算配套價子項目的 computed 屬性 ★★★
const calculatedPackageItems = computed(() => {
    // 如果不使用配套，或配套價為0，或沒有設定規則，則返回空物件
    if (!usePackageDealModel.value || packagePrice.value <= 0 || !props.packageTermsData || props.packageTermsData.length === 0) {
        return {};
    }

    // 使用公式引擎計算
    // 注意：這裡假設公式中使用的關鍵字是 '配套總價'
    const calculatedAmounts = runCalculationEngine(props.packageTermsData, packagePrice.value, '配套金額');

    // 將結果轉換為 { "項目名稱": 金額 } 的格式
    return props.packageTermsData.reduce((acc, term) => {
        const termName = term['項目名稱'];
        const termId = term['編號'];
        if (termName && calculatedAmounts[termId] !== undefined) {
            acc[termName] = calculatedAmounts[termId];
        }
        return acc;
    }, {});
});

// ★★★ 4. 新增：使用 watch 監聽計算結果，並更新到 store 中 ★★★
watch(calculatedPackageItems, (newPackageItems) => {
    // 呼叫 store 的 action 來更新
    quoteStore.updateItemPackageItems(props.item.internalId, newPackageItems);
}, {
    deep: true, // 深度監聽，確保物件內部變化也能被偵測到
    immediate: true // 立即執行一次，確保初始值也被寫入 store
});


const parkingDisplayText = computed(() => {
  if (props.item.selectedParking.length === 0) return '新增車位';
  return props.item.selectedParking.map(p => p['車位編號']).join(', ');
});

const formattedParkingPrice = computed(() => {
  if (parkingTotalPrice.value === 0) return '—';
  return `${parkingTotalPrice.value.toLocaleString()} 萬`;
});

const areaDetails = computed(() => {
  const details = props.item.unitDetails;
  if (!details) return [];
  const areaItems = [
    { label: '主建物(室內)', value: details.area_main_ping, unit: '坪' },
    { label: '附屬建物(陽台)', value: details.area_ancillary_ping, unit: '坪' },
    { label: '共用部分(公設)', value: details.area_common_ping, unit: '坪' },
    { label: '露臺(不計坪)', value: details.area_terrace_ping, unit: '坪' },
    { label: '公設比', value: details.common_area_ratio, unit: '%', isPercentage: true }
  ];
  return areaItems.filter(item => item.value !== null && item.value !== undefined && item.value !== '');
});

function formatPercentage(value) {
  const num = parseFloat(value);
  return isNaN(num) ? 'N/A' : `${(num * 100).toFixed(2)} %`;
}

// 車位選擇處理方法
function handleParkingUpdate(updatedParkingList) {
  quoteStore.updateParking(props.item.internalId, updatedParkingList);
  isParkingModalOpen.value = false;
}

function openParkingModal() {
  isParkingModalOpen.value = true;
}
</script>

<style scoped>
/* Styles remain the same */
.quote-item-row { display: flex; align-items: center; width: 100%; padding: 8px 0; border-bottom: 1px solid #eee; }
.item-cell { padding: 0 8px; display: flex; align-items: center; justify-content: center; text-align: center; }
.flex-1 { flex: 1; }
.flex-2 { flex: 2; }
.flex-shrink-0 { flex-shrink: 0; }
.item-cell > .v-input { flex: none; }
.quote-item-mobile { border: 1px solid #e0e0e0; border-radius: 8px; padding: 8px 12px; margin-bottom: 16px; background-color: #fafafa; }
.quote-item-mobile .v-list-item { padding-left: 0; padding-right: 0; min-height: 40px; }
.highlight-dark { font-weight: 600; color: #c62828; }
.final-price { font-size: 1.2rem; font-weight: bold; color: #1E88E5; }
</style>