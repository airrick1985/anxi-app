<template>
  <div class="pa-2">
    <v-form>
      <div class="info-section">
        <div class="section-title"><v-icon>mdi-information-outline</v-icon> 銷售資訊</div>
        <v-row>
          <v-col cols="12" sm="6" md="4"><v-select label="後台狀態" :items="statusOptions" v-model="editableData['銷控後台狀態']"></v-select></v-col>
          <v-col cols="12" sm="6" md="4"><v-select label="銷售人員" :items="personnelOptions" v-model="editableData['銷售']"></v-select></v-col>
          <v-col cols="12" sm="12" md="4">
             <div class="d-flex align-center">
                <v-text-field label="持有車位" :model-value="parkingDisplayText" readonly variant="outlined" density="compact" hide-details></v-text-field>
                <v-btn class="ml-2" @click="isParkingModalOpen = true">編輯車位</v-btn>
             </div>
          </v-col>
          <v-col cols="12" sm="4"><VueDatePicker v-model="editableData['小訂日期']" placeholder="小訂日期" auto-apply :enable-time-picker="false" format="yyyy/MM/dd"></VueDatePicker></v-col>
          <v-col cols="12" sm="4"><VueDatePicker v-model="editableData['補足日期']" placeholder="補足日期" auto-apply :enable-time-picker="false" format="yyyy/MM/dd"></VueDatePicker></v-col>
          <v-col cols="12" sm="4"><VueDatePicker v-model="editableData['簽約日期']" placeholder="簽約日期" auto-apply :enable-time-picker="false" format="yyyy/MM/dd"></VueDatePicker></v-col>
          <v-col cols="12" sm="4"><v-text-field label="小訂金額" v-model.number="editableData['小訂金額']" type="number" prefix="NT$" :min="0"></v-text-field></v-col>
          <v-col cols="12" sm="4"><v-text-field label="補足金額" v-model.number="editableData['補足金額']" type="number" prefix="NT$" :min="0"></v-text-field></v-col>
          <v-col cols="12" sm="4"><v-text-field label="簽約金額" v-model.number="editableData['簽約金額']" type="number" prefix="NT$" :min="0"></v-text-field></v-col>
        </v-row>
      </div>

      <div class="info-section mt-4">
         <div class="section-title"><v-icon>mdi-currency-usd</v-icon> 成交資訊</div>
         <v-row>
            <v-col cols="12" sm="6" md="4"><v-text-field label="房屋成交價(萬)" v-model.number="editableData['房屋成交價']" type="number" :min="0"></v-text-field></v-col>
            <v-col cols="12" sm="6" md="4"><v-text-field label="車位成交價(萬)" :model-value="parkingSalePrice" readonly hint="由編輯車位彈窗自動計算" persistent-hint></v-text-field></v-col>
            <v-col cols="12" sm="6" md="4"><v-text-field label="成交總價(萬)" :model-value="totalSalePrice" readonly hint="自動計算" persistent-hint></v-text-field></v-col>
            <v-col cols="12" sm="6" md="4"><v-text-field label="房屋成交單價(萬/坪)" :model-value="unitSalePrice" readonly hint="自動計算" persistent-hint></v-text-field></v-col>
            <v-col cols="12" sm="6" md="4"><v-text-field label="溢差價" :model-value="priceDifference" readonly hint="自動計算" persistent-hint></v-text-field></v-col>
         </v-row>
      </div>

      <div class="info-section mt-4">
        <div class="section-title"><v-icon>mdi-account-details</v-icon> 買方資訊</div>
        <v-row>
            <v-col cols="12" md="4"><v-text-field label="買方姓名" v-model="editableData['買方姓名']"></v-text-field></v-col>
            <v-col cols="12" md="4"><v-text-field label="身分證字號" v-model="editableData['身分證字號']"></v-text-field></v-col>
            <v-col cols="12" md="4"><VueDatePicker v-model="editableData['出生年月日']" placeholder="出生年月日" auto-apply :enable-time-picker="false" format="yyyy/MM/dd"></VueDatePicker></v-col>
            <v-col cols="12" md="4"><v-text-field label="聯絡電話" v-model="editableData['電話']" type="tel"></v-text-field></v-col>
            <v-col cols="12" md="8"><v-text-field label="EMAIL" v-model="editableData['EMAIL']" type="email"></v-text-field></v-col>
            <v-col cols="12">
                <label class="form-label">通訊地址</label>
                <VueTwZipCodeSelector @getSelectedZone="handleMailingAddressSelect" class="my-2" />
                <v-text-field label="詳細地址" v-model="editableData['通訊地址_詳細']" density="compact" variant="outlined"></v-text-field>
            </v-col>
            <v-col cols="12"><v-checkbox v-model="isPermanentSameAsMailing" label="戶籍地址與通訊地址相同" density="compact"></v-checkbox></v-col>
            <v-col cols="12" v-if="!isPermanentSameAsMailing">
              <label class="form-label">戶籍地址</label>
              <VueTwZipCodeSelector @getSelectedZone="handlePermanentAddressSelect" class="my-2" />
              <v-text-field label="詳細地址" v-model="editableData['戶籍地址_詳細']" density="compact" variant="outlined"></v-text-field>
            </v-col>
        </v-row>
      </div>

      <div class="info-section mt-4">
        <div class="section-title"><v-icon>mdi-comment-text-outline</v-icon> 備註</div>
        <v-textarea label="備註" v-model="editableData['備註']" rows="3" auto-grow></v-textarea>
      </div>

    </v-form>
    
  <ParkingEditModal 
        v-model:show="isParkingModalOpen"
        :all-parking-data="allParkingDataForModal"
        :initial-selected-parking="editableData['持有車位'] || []"
        @confirm="handleParkingUpdate"
        @request-open-slide="$emit('request-open-slide')"
    />
  </div>
</template>

<script setup>
import { ref, computed, watch, defineAsyncComponent, defineProps, defineEmits } from 'vue';
import VueDatePicker from '@vuepic/vue-datepicker';
import '@vuepic/vue-datepicker/dist/main.css';

// 非同步載入，因為地址選擇器可能不是每個頁面都需要
const VueTwZipCodeSelector = defineAsyncComponent(() => 
  import('@andy922200/vue-tw-zip-code-selector').then(m => m.VueTwZipCodeSelector)
);
const ParkingEditModal = defineAsyncComponent(() => import('./ParkingEditModal.vue'));

const props = defineProps({
  modelValue: { type: Object, default: () => ({}) },
  statusOptions: { type: Array, default: () => [] },
  personnelOptions: { type: Array, default: () => [] },
  allParkingData: { type: Array, default: () => [] },
  buyerInfoOptions: { type: Object, default: () => ({}) }
});

const emit = defineEmits(['update:modelValue', 'request-open-slide']);

const isParkingModalOpen = ref(false);
const isPermanentSameAsMailing = ref(false);
const otherIndustry = ref('');
const otherPurchasePurpose = ref('');


// ✅ --- 核心修正：用一個可寫的 computed 取代兩個 watch ---
const editableData = computed({
  get() {
    // 當模板讀取資料時，直接回傳父層傳來的 prop
    return props.modelValue;
  },
  set(newValue) {
    // 當模板中的 v-model 嘗試修改資料時，發出事件通知父層
    emit('update:modelValue', newValue);
  }
});
// ✅ --- 修正結束 ---
// --- 車位相關 ---
const allParkingDataForModal = computed(() => props.allParkingData);
const parkingDisplayText = computed(() => {
    const parking = editableData.value?.['持有車位'] || [];
    if (parking.length === 0) return '尚未設定';
    return parking.map(p => p.車位編號).join(', ');
});
function handleParkingUpdate(updatedParkingList) {
    const newData = { ...editableData.value, '持有車位': updatedParkingList };
    emit('update:modelValue', newData);
}

// --- 成交資訊計算 ---
const parkingSalePrice = computed(() => {
    const parking = editableData.value?.['持有車位'] || [];
    return parking.reduce((sum, p) => sum + (Number(p.車位成交價) || 0), 0);
});
const totalSalePrice = computed(() => (Number(editableData.value?.['房屋成交價']) || 0) + parkingSalePrice.value);
const unitSalePrice = computed(() => {
    const housePrice = Number(editableData.value?.['房屋成交價']) || 0;
    const area = Number(props.modelValue?.['房屋面積(坪)']);
    if (!area) return 0;
    return (housePrice / area).toFixed(2);
});
const priceDifference = computed(() => {
    const baseHouse = Number(props.modelValue?.['房屋總底價']) || 0;
    const parking = editableData.value?.['持有車位'] || [];
    const baseParking = parking.reduce((sum, p) => sum + (Number(p.車位底價) || 0), 0);
    return totalSalePrice.value - (baseHouse + baseParking);
});


// --- 地址選擇器相關 ---
function handleMailingAddressSelect(zoneObject) {
  if (zoneObject) {
    editableData.value['通訊地址_縣市'] = zoneObject.county;
    editableData.value['通訊地址_區域'] = zoneObject.district;
  }
}
function handlePermanentAddressSelect(zoneObject) {
  if (zoneObject) {
    editableData.value['戶籍地址_縣市'] = zoneObject.county;
    editableData.value['戶籍地址_區域'] = zoneObject.district;
  }
}
watch(isPermanentSameAsMailing, (isSame) => {
  if (isSame) {
    editableData.value['戶籍地址_縣市'] = editableData.value['通訊地址_縣市'];
    editableData.value['戶籍地址_區域'] = editableData.value['通訊地址_區域'];
    editableData.value['戶籍地址_詳細'] = editableData.value['通訊地址_詳細'];
  }
});
</script>

<style scoped>
.info-section { padding: 16px; border: 1px solid #e0e0e0; border-radius: 8px; }
.section-title { font-size: 1.1rem; font-weight: 600; color: #1a3a6e; margin-bottom: 16px; padding-bottom: 8px; border-bottom: 2px solid #e0e0e0; display: flex; align-items: center; gap: 8px; }
.form-label { font-size: 0.9rem; color: #555; font-weight: 500; margin-bottom: 4px; display: block; }
</style>