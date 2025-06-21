<template>
  <div>
    <div v-if="isMobile" class="quote-item-mobile">
      <div class="d-flex justify-space-between align-center mb-2">
        <span class="text-h6 font-weight-bold text-primary">{{ item.unitId }}</span>
        <v-btn icon="mdi-delete" variant="text" color="grey" size="small" @click="emit('remove')"></v-btn>
      </div>
      <v-list lines="one" density="compact" class="bg-transparent">
        <v-list-item class="pl-0"><v-list-item-title>房屋總價</v-list-item-title><template v-slot:append><strong class="highlight-dark">{{ displayHousePrice }} 萬</strong></template></v-list-item>
        <v-list-item class="pl-0"><v-list-item-title>房屋單價</v-list-item-title><template v-slot:append><strong>{{ displayUnitPrice }} 萬/坪</strong></template></v-list-item>
        <v-divider class="my-2"></v-divider>
        <v-list-item class="pl-0"><v-list-item-title>房屋總面積</v-list-item-title><template v-slot:append><strong>{{ item.unitDetails['房屋面積(坪)'] }} 坪</strong></template></v-list-item>
        <v-divider class="my-2"></v-divider>
        <v-list-item class="pl-0"><v-list-item-title>車位</v-list-item-title><template v-slot:append><v-btn size="small" variant="tonal" @click="emit('open-parking-modal')">{{ parkingDisplayText }}</v-btn></template></v-list-item>
        <v-list-item class="pl-0"><v-list-item-title>車位價格</v-list-item-title><template v-slot:append><strong class="highlight-dark">{{ formattedParkingPrice }}</strong></template></v-list-item>
        <v-divider class="my-2"></v-divider>
        <v-list-item class="pl-0">
          <template v-slot:prepend>
            <v-switch class="mr-4" v-model="usePackageDealModel" :disabled="!item.unitDetails['配套房屋總價']" label="配套" color="primary" density="compact" hide-details inset></v-switch>
          </template>
          <v-radio-group v-model="isFirstTimeBuyerModel" inline density="compact" hide-details>
            <template v-slot:label><span class="text-body-2">首購:</span></template>
            <v-radio label="是" value="是" density="compact"></v-radio>
            <v-radio label="否" value="否" density="compact"></v-radio>
          </v-radio-group>
        </v-list-item>
        <v-divider class="my-2"></v-divider>
        <v-list-item class="pl-0"><v-list-item-title>配套價</v-list-item-title><template v-slot:append><strong class="final-price">{{ packagePrice.toLocaleString() }} 萬</strong></template></v-list-item>
        <v-list-item class="pl-0"><v-list-item-title class="font-weight-bold">總價</v-list-item-title><template v-slot:append><strong class="final-price">{{ finalTotalPrice.toLocaleString() }} 萬</strong></template></v-list-item>
      </v-list>
      <v-btn block @click="isPaymentDetailsVisible = !isPaymentDetailsVisible" :append-icon="isPaymentDetailsVisible ? 'mdi-chevron-up' : 'mdi-chevron-down'" class="mt-2" size="small">
        付款方式
      </v-btn>
    </div>

    <div v-else class="quote-item-row">
      <div class="item-cell flex-1 text-h6 font-weight-bold text-primary">{{ item.unitId }}</div>
      <div class="item-cell flex-1">{{ formatNumber(item.unitDetails['房屋面積(坪)']) }} 坪</div>
      <div class="item-cell flex-1 highlight-dark">{{ displayHousePrice }} 萬</div>
      <div class="item-cell flex-1">{{ displayUnitPrice }} 萬/坪</div>
      <div class="item-cell flex-2"><v-btn density="compact" variant="tonal" @click="emit('open-parking-modal')">{{ parkingDisplayText }}</v-btn></div>
      <div class="item-cell flex-1 highlight-dark"><span>{{ formattedParkingPrice }}</span></div>
      <div class="item-cell flex-1">
        <v-radio-group v-model="isFirstTimeBuyerModel" inline density="compact" hide-details>
          <v-radio label="是" value="是"></v-radio>
          <v-radio label="否" value="否"></v-radio>
        </v-radio-group>
      </div>
      <div class="item-cell flex-1 final-price">{{ finalTotalPrice.toLocaleString() }} 萬</div>
      <div class="item-cell flex-1 "><v-checkbox v-model="usePackageDealModel" :disabled="!item.unitDetails['配套房屋總價']" density="compact" hide-details></v-checkbox></div>
      <div class="item-cell flex-1 final-price">{{ packagePrice.toLocaleString() }} 萬</div>
      <div class="item-cell flex-1">
        <v-btn @click="isPaymentDetailsVisible = !isPaymentDetailsVisible" size="small" :append-icon="isPaymentDetailsVisible ? 'mdi-chevron-up' : 'mdi-chevron-down'">
          付款方式
        </v-btn>
      </div>
      <div class="item-cell flex-shrink-0">
        <v-btn icon="mdi-delete" variant="text" color="grey" @click="emit('remove')"></v-btn>
      </div>
    </div>

    <v-expand-transition>
      <div v-show="isPaymentDetailsVisible">
        <PaymentDetails
          v-if="activePaymentTerm"
          :final-total-price="finalTotalPrice"
          :package-price="packagePrice"
          :payment-term-row="activePaymentTerm"
        />
        <div v-else class="text-center pa-4 text-red bg-grey-lighten-4">
          找不到對應的付款條件設定 (總價: {{ finalTotalPrice }}萬, 首購: {{ isFirstTimeBuyerModel }})
        </div>
      </div>
    </v-expand-transition>
  </div>
</template>

<script setup>
import { ref, computed, defineProps, defineEmits } from 'vue';
import { useQuoteStore } from '@/store/quoteStore';
import { useDisplay } from 'vuetify';
import PaymentDetails from './PaymentDetails.vue';

const props = defineProps({
  item: { type: Object, required: true },
  paymentTermsData: { type: Array, default: () => [] } 
});

const emit = defineEmits(['remove', 'open-parking-modal']);
const quoteStore = useQuoteStore();
const { mobile } = useDisplay();

const isMobile = computed(() => mobile.value);
const isPaymentDetailsVisible = ref(false);

const isFirstTimeBuyerModel = computed({
  get: () => props.item.isFirstTimeBuyer,
  set: (value) => quoteStore.updateUnitField(props.item.internalId, 'isFirstTimeBuyer', value)
});
const usePackageDealModel = computed({
  get: () => props.item.usePackageDeal,
  set: (value) => quoteStore.updateUnitField(props.item.internalId, 'usePackageDeal', value)
});

// --- ✅ 修改開始 ---

// 1. 從 store 獲取原始的、未格式化的數值，以供計算使用
const packagePrice = computed(() => quoteStore.getPackagePrice(props.item.internalId));
const finalTotalPrice = computed(() => quoteStore.getFinalTotalPrice(props.item.internalId));
const parkingTotalPrice = computed(() => quoteStore.getParkingTotalPrice(props.item.internalId));

// 2. 新增一個 computed 來計算「純粹的房屋價格(未格式化)」，這是所有顯示價格的基礎
const rawDisplayHousePrice = computed(() => {
  if (usePackageDealModel.value) {
    // 如果是配套方案，房屋價格 = 配套總價 - 車位總價
    const packageTotal = Number(props.item.unitDetails['配套房屋總價']) || 0;
    return packageTotal - parkingTotalPrice.value;
  } else {
    // 如果不是配套方案，房屋價格 = 房屋總表價
    return Number(props.item.unitDetails['房屋總表價']) || 0;
  }
});

// 3. 修改 displayHousePrice，讓它只負責「格式化」rawDisplayHousePrice 的結果
const displayHousePrice = computed(() => {
  return formatNumber(rawDisplayHousePrice.value);
});

// 4. 修改 displayUnitPrice，讓它的計算基於新的 rawDisplayHousePrice，確保邏輯一致
const displayUnitPrice = computed(() => {
  const area = Number(props.item.unitDetails['房屋面積(坪)']);
  if (!area || area === 0) return '0';
  
  const unitPrice = rawDisplayHousePrice.value / area;
  // toFixed(2) 將單價計算到小數點後兩位
  return formatNumber(unitPrice.toFixed(2));
});

// --- ✅ 修改結束 ---


const activePaymentTerm = computed(() => {
  if (!props.paymentTermsData || props.paymentTermsData.length === 0) {
    return null;
  }
  const priceCondition = finalTotalPrice.value < 4000 ? '<4000' : '>=4000';
  const buyerCondition = isFirstTimeBuyerModel.value;
  const foundTerm = props.paymentTermsData.find(term => 
    String(term['總價']).trim() === priceCondition && String(term['是否首購']).trim() === buyerCondition
  );
  if (!foundTerm) {
      console.warn(`[${props.item.unitId}] 比對失敗，找不到條件為 (總價: ${priceCondition}, 首購: ${buyerCondition}) 的付款設定。`);
  }
  return foundTerm;
});

const parkingDisplayText = computed(() => {
  if (props.item.selectedParking.length === 0) return '新增車位';
  return props.item.selectedParking.map(p => p['車位編號']).join(', ');
});

const formattedParkingPrice = computed(() => {
  if (!props.item.selectedParking || props.item.selectedParking.length === 0) return '—';
  // 這裡的 totalPrice 僅用於顯示，與 store 中的 parkingTotalPrice 來源相同
  const totalPrice = props.item.selectedParking.reduce((sum, parking) => sum + (Number(parking['車位表價']) || 0), 0);
  return totalPrice > 0 ? `${totalPrice.toLocaleString()} 萬` : '—';
});

const formatNumber = (val) => val ? parseFloat(val).toLocaleString() : '0';
</script>

<style scoped>
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