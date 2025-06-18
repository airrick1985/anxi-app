<template>
  <div v-if="isMobile" class="quote-item-mobile">
    <v-col cols="6">總價: <strong class="highlight">{{ finalTotalPrice.toLocaleString() }} 萬</strong></v-col>
    <v-col cols="12">配套價: <strong class="highlight">{{ packagePrice.toLocaleString() }} 萬</strong></v-col>
    </div>

  <div v-else class="quote-item-row">
    <div class="item-cell flex-1 font-weight-bold">{{ item.unitId }}</div>
    <div class="item-cell flex-1">{{ formatNumber(item.unitDetails['房屋面積(坪)']) }} 坪</div>
    <div class="item-cell flex-1 highlight">{{ displayHousePrice }} 萬</div>
    <div class="item-cell flex-1">{{ displayUnitPrice }} 萬/坪</div>
    <div class="item-cell flex-2">
      <v-btn density="compact" variant="tonal" @click="emit('open-parking-modal')">{{ parkingDisplayText }}</v-btn>
    </div>
    <div class="item-cell flex-1 highlight">
      <span>{{ formattedParkingPrice }}</span> 
    </div>
    <div class="item-cell flex-1">
      <v-radio-group v-model="isFirstTimeBuyerModel" inline density="compact" hide-details>
        <v-radio label="是" value="是"></v-radio>
        <v-radio label="否" value="否"></v-radio>
      </v-radio-group>
    </div>
    
    <div class="item-cell flex-1 highlight">{{ finalTotalPrice.toLocaleString() }} 萬</div>
    <div class="item-cell flex-1">
      <v-checkbox v-model="usePackageDealModel" :disabled="!item.unitDetails['配套房屋總價']" density="compact" hide-details></v-checkbox>
    </div>
    <div class="item-cell flex-1 highlight">{{ packagePrice.toLocaleString() }} 萬</div>

    <div class="item-cell flex-shrink-0">
      <v-btn icon="mdi-delete" variant="text" color="grey" @click="emit('remove', item.instanceId)"></v-btn>
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
  set: (value) => quoteStore.updateUnitField(props.item.unitId, 'isFirstTimeBuyer', value)
});
const usePackageDealModel = computed({
  get: () => props.item.usePackageDeal,
  set: (value) => quoteStore.updateUnitField(props.item.unitId, 'usePackageDeal', value)
});

const packagePrice = computed(() => {
  if (!quoteStore || typeof quoteStore.getPackagePrice?.value !== 'function') return 0;
  return quoteStore.getPackagePrice.value(props.item.unitId) || 0;
});

const finalTotalPrice = computed(() => {
  if (!quoteStore || typeof quoteStore.getFinalTotalPrice?.value !== 'function') return 0;
  return quoteStore.getFinalTotalPrice.value(props.item.unitId) || 0;
});

const displayHousePrice = computed(() => {
  const details = props.item.unitDetails || props.item;
  const price = props.item.usePackageDeal 
    ? details['配套房屋總價'] 
    : details['房屋總表價'];
  return formatNumber(price);
});

const displayUnitPrice = computed(() => {
  const details = props.item.unitDetails || props.item;
  const price = props.item.usePackageDeal 
    ? details['配套房屋單價'] 
    : details['房屋單價(表價)'];
  return formatNumber(price);
});

const parkingDisplayText = computed(() => {
  if (!props.item.selectedParking || props.item.selectedParking.length === 0) return '新增車位';
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

const formatNumber = (val) => {
  const num = parseFloat(val);
  return isNaN(num) ? '0' : num.toLocaleString();
};
</script>

<style scoped>
.quote-item-row { display: flex; align-items: center; width: 100%; }
.item-cell { padding: 0 8px; display: flex; align-items: center; justify-content: center; text-align: center; }
.highlight { font-weight: bold; color: #D32F2F; font-size: 1.1rem; }
.flex-1 { flex: 1; }
.flex-2 { flex: 2; }
.flex-shrink-0 { flex-shrink: 0; }
.quote-item-mobile { border-bottom: 1px solid #eee; padding-bottom: 8px; margin-bottom: 8px; }
</style>