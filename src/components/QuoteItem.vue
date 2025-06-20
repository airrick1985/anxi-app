<template>
  <div v-if="isMobile" class="quote-item-mobile">
    <div class="d-flex justify-space-between align-center mb-2">
      <span class="text-h6 font-weight-bold text-primary">{{ item.unitId }}</span>
      <v-btn icon="mdi-delete" variant="text" color="grey" size="small" @click="emit('remove')"></v-btn>
    </div>

    <v-list lines="one" density="compact" class="bg-transparent">
      <v-list-item class="pl-0">
        <v-list-item-title>房屋總價</v-list-item-title>
        <template v-slot:append><strong class="highlight-dark">{{ displayHousePrice }} 萬</strong></template>
      </v-list-item>
      <v-list-item class="pl-0">
        <v-list-item-title>房屋單價</v-list-item-title>
        <template v-slot:append><strong>{{ displayUnitPrice }} 萬/坪</strong></template>
      </v-list-item>

      <v-divider class="my-2"></v-divider>

      <v-list-item class="pl-0">
        <v-list-item-title>房屋總面積</v-list-item-title>
        <template v-slot:append><strong>{{ item.unitDetails['房屋面積(坪)'] }} 坪</strong></template>
      </v-list-item>
      
      <v-divider class="my-2"></v-divider>

      <v-list-item class="pl-0">
        <v-list-item-title>車位</v-list-item-title>
        <template v-slot:append>
          <v-btn size="small" variant="tonal" @click="emit('open-parking-modal')">{{ parkingDisplayText }}</v-btn>
        </template>
      </v-list-item>
      <v-list-item class="pl-0">
        <v-list-item-title>車位價格</v-list-item-title>
        <template v-slot:append><strong class="highlight-dark">{{ formattedParkingPrice }}</strong></template>
      </v-list-item>

      <v-divider class="my-2"></v-divider>

      <v-list-item class="pl-0">
        <template v-slot:prepend>
          <v-switch
            class="mr-4"
            v-model="usePackageDealModel"
            :disabled="!item.unitDetails['配套房屋總價']"
            label="配套"
            color="primary"
            density="compact"
            hide-details
            inset
          ></v-switch>
        </template>
        <v-radio-group v-model="isFirstTimeBuyerModel" inline density="compact" hide-details>
          <template v-slot:label><span class="text-body-2">首購:</span></template>
          <v-radio label="是" value="是" density="compact"></v-radio>
          <v-radio label="否" value="否" density="compact"></v-radio>
        </v-radio-group>
      </v-list-item>
      
      <v-divider class="my-2"></v-divider>
      
      <v-list-item class="pl-0">
        <v-list-item-title>配套價</v-list-item-title>
        <template v-slot:append><strong class="final-price">{{ packagePrice.toLocaleString() }} 萬</strong></template>
      </v-list-item>
      <v-list-item class="pl-0">
        <v-list-item-title class="font-weight-bold">總價</v-list-item-title>
        <template v-slot:append><strong class="final-price">{{ finalTotalPrice.toLocaleString() }} 萬</strong></template>
      </v-list-item>
    </v-list>
  </div>

  <div v-else class="quote-item-row">
    <div class="item-cell flex-1 text-h6 font-weight-bold text-primary">{{ item.unitId }}</div>
    <div class="item-cell flex-1">{{ formatNumber(item.unitDetails['房屋面積(坪)']) }} 坪</div>
    <div class="item-cell flex-1 highlight-dark">{{ displayHousePrice }} 萬</div>
    <div class="item-cell flex-1">{{ displayUnitPrice }} 萬/坪</div>
    <div class="item-cell flex-2">
      <v-btn density="compact" variant="tonal" @click="emit('open-parking-modal')">{{ parkingDisplayText }}</v-btn>
    </div>
    <div class="item-cell flex-1 highlight-dark">
      <span>{{ formattedParkingPrice }}</span> 
    </div>
    <div class="item-cell flex-1">
      <v-radio-group v-model="isFirstTimeBuyerModel" inline density="compact" hide-details>
        <v-radio label="是" value="是"></v-radio>
        <v-radio label="否" value="否"></v-radio>
      </v-radio-group>
    </div>
    
    <div class="item-cell flex-1 final-price">{{ finalTotalPrice.toLocaleString() }} 萬</div>
    <div class="item-cell flex-1 ">
      <v-checkbox v-model="usePackageDealModel" :disabled="!item.unitDetails['配套房屋總價']" density="compact" hide-details></v-checkbox>
    </div>
    <div class="item-cell flex-1 final-price">{{ packagePrice.toLocaleString() }} 萬</div>
    <div class="item-cell flex-shrink-0">
      <v-btn icon="mdi-delete" variant="text" color="grey" @click="emit('remove')"></v-btn>
    </div>
  </div>
</template>

<script setup>
import { computed, defineProps, defineEmits } from 'vue';
import { useQuoteStore } from '@/store/quoteStore';
import { useDisplay } from 'vuetify';

const props = defineProps({
  item: { type: Object, required: true }
});

const emit = defineEmits(['remove', 'open-parking-modal']);
const quoteStore = useQuoteStore();
const { mobile } = useDisplay();

const isMobile = computed(() => mobile.value);

const isFirstTimeBuyerModel = computed({
  get: () => props.item.isFirstTimeBuyer,
  // ✅ 修改 #3: 使用 props.item.internalId 更新 store
  set: (value) => quoteStore.updateUnitField(props.item.internalId, 'isFirstTimeBuyer', value)
});
const usePackageDealModel = computed({
  get: () => props.item.usePackageDeal,
  // ✅ 修改 #4: 使用 props.item.internalId 更新 store
  set: (value) => quoteStore.updateUnitField(props.item.internalId, 'usePackageDeal', value)
});

// ✅ 修改 #5: 使用 props.item.internalId 從 store 獲取價格
const packagePrice = computed(() => quoteStore.getPackagePrice(props.item.internalId));
// ✅ 修改 #6: 使用 props.item.internalId 從 store 獲取價格
const finalTotalPrice = computed(() => quoteStore.getFinalTotalPrice(props.item.internalId));

// 以下計算屬性不依賴 store 查找，維持原樣
const displayHousePrice = computed(() => {
  const price = props.item.usePackageDeal 
    ? props.item.unitDetails['配套房屋總價'] 
    : props.item.unitDetails['房屋總表價'];
  return formatNumber(price);
});

const displayUnitPrice = computed(() => {
  const price = props.item.usePackageDeal 
    ? props.item.unitDetails['配套房屋單價'] 
    : props.item.unitDetails['房屋單價(表價)'];
  return formatNumber(price);
});

const parkingDisplayText = computed(() => {
  if (props.item.selectedParking.length === 0) return '新增車位';
  return props.item.selectedParking.map(p => p['車位編號']).join(', ');
});

const formattedParkingPrice = computed(() => {
  if (!props.item.selectedParking || props.item.selectedParking.length === 0) {
    return '—';
  }
  
  const totalPrice = props.item.selectedParking.reduce((sum, parking) => {
    return sum + (Number(parking['車位表價']) || 0);
  }, 0);

  return totalPrice > 0 ? `${totalPrice.toLocaleString()} 萬` : '—';
});

const formatNumber = (val) => val ? parseFloat(val).toLocaleString() : '0';
</script>

<style scoped>
.quote-item-row { display: flex; align-items: center; width: 100%; padding: 16px 0; }
.item-cell { padding: 0 8px; display: flex; align-items: center; justify-content: center; text-align: center; }
.highlight { font-weight: bold; color: #D32F2F; font-size: 1.1rem; }
.flex-1 { flex: 1; }
.flex-2 { flex: 2; }
.flex-shrink-0 { flex-shrink: 0; }
.item-cell > .v-input { flex: none; }

/* ✅ 手機版優化樣式 */
.quote-item-mobile {
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  padding: 8px 12px;
  margin-bottom: 16px;
  background-color: #fafafa;
}

.quote-item-mobile .v-list-item {
  padding-left: 0;
  padding-right: 0;
  min-height: 40px;
}

.highlight-dark {
  font-weight: 600;
  color: #c62828; /* 深一點的紅色 */
}

.final-price {
  font-size: 1.2rem;
  font-weight: bold;
  color: #1E88E5; /* Vuetify Primary Color */
}
</style>