<template>
  <div class="pa-2" :class="{ 'mb-8': isMobile }">
    <v-form>
       <v-row>
        <v-col cols="12" md="4">
          <div class="info-section">
            <div class="section-title"><v-icon>mdi-information-outline</v-icon> 銷售資訊</div>
            <v-select label="後台狀態" :items="statusOptions" v-model="editableData.salesStatus_backend" class="mb-4"></v-select>
            <v-select label="銷售人員" :items="personnelOptions" v-model="editableData.salesperson" class="mb-4"></v-select>
            
            <v-combobox
              label="戶別圖片"
              v-model="editableData.salesImages"
              :items="salesImageOptions"
              multiple
              chips
              clearable
              closable-chips
              class="mb-4"
              hint="可從下拉選單選擇，或手動輸入後按 Enter 新增"
              persistent-hint
            ></v-combobox>
            <div class="d-flex align-center mb-4">
              <v-text-field label="持有車位" :model-value="parkingDisplayText" readonly variant="outlined" density="compact" hide-details></v-text-field>
              <v-btn class="ml-2" color="primary" @click="isParkingModalOpen = true" icon="mdi-pencil"></v-btn>
            </div>
            <label class="v-label text-caption">小訂日期</label>
            <VueDatePicker :locale="'zh-TW'" v-model="editableData.payment_deposit_date" auto-apply :enable-time-picker="false" format="yyyy/MM/dd" class="mb-4"></VueDatePicker>
            <label class="v-label text-caption">簽約日期</label>
            <VueDatePicker :locale="'zh-TW'" v-model="editableData.payment_contract_date" auto-apply :enable-time-picker="false" format="yyyy/MM/dd" class="mb-4"></VueDatePicker>
            <v-textarea label="備註" v-model="editableData.remarks" rows="3" auto-grow></v-textarea>
          </div>
        </v-col>

        <v-col cols="12" md="4">
          <div class="info-section">
            <div class="section-title"><v-icon>mdi-currency-usd</v-icon> 成交資訊</div>
            <v-select label="合約方式" :items="contractTypeOptions" v-model="editableData.contractType" class="mb-4"></v-select>
            <v-radio-group v-model="editableData.isFirstTimeBuyer" inline label="是否首購" class="mb-4">
              <v-radio label="是" :value="true"></v-radio>
              <v-radio label="否" :value="false"></v-radio>
            </v-radio-group>
            <v-text-field label="房屋成交價(萬)" v-model.number="editableData.price_transaction_house" type="number" :min="0" class="mb-2"></v-text-field>
            <v-text-field label="車位成交價(萬)" :model-value="parkingSalePrice" readonly hint="由編輯車位彈窗自動計算" persistent-hint class="mb-2"></v-text-field>
            <v-text-field label="成交總價(萬)" :model-value="totalSalePrice" readonly hint="自動計算" persistent-hint class="mb-2"></v-text-field>
            <v-text-field label="溢差價(萬)" :model-value="priceDifference" readonly hint="自動計算" persistent-hint></v-text-field>
          </div>
        </v-col>

        <v-col cols="12" md="4">
          <div class="info-section">
            <div class="section-title"><v-icon>mdi-account-details</v-icon> 買方資訊</div>
            <v-text-field label="買方姓名" v-model="editableData.buyerName" class="mb-2"></v-text-field>
            <v-text-field label="聯絡電話" v-model="editableData.buyerPhone" type="tel" class="mb-2"></v-text-field>
            <v-text-field label="身分證字號" v-model="editableData.buyerIdNumber" class="mb-2"></v-text-field>
            <label class="v-label text-caption">出生年月日</label>
            <VueDatePicker :locale="'zh-TW'" v-model="editableData.buyerDateOfBirth" auto-apply :enable-time-picker="false" format="yyyy/MM/dd" class="mb-2"></VueDatePicker>
            <v-text-field label="EMAIL" v-model="editableData.buyerEmail" type="email" class="mb-4"></v-text-field>
            
            <div>
              <label class="form-label">通訊地址</label>
              <v-row dense>
                <v-col cols="6">
                  <v-select
                    v-model="mailingCounty"
                    :items="counties"
                    label="縣市"
                    :loading="loadingCounties"
                    density="compact"
                    variant="outlined"
                  ></v-select>
                </v-col>
                <v-col cols="6">
                  <v-select
                    :key="`mailing-towns-${mailingCounty}`"
                    v-model="mailingTown"
                    :items="mailingTowns"
                    label="鄉鎮市區"
                    :loading="loadingMailingTowns"
                    :disabled="!mailingCounty"
                    density="compact"
                    variant="outlined"
                  ></v-select>
                </v-col>
              </v-row>
              <v-text-field label="詳細地址" v-model="editableData.buyerMailingAddressDetail" density="compact" variant="outlined"></v-text-field>
            </div>

            <v-checkbox v-model="isPermanentSameAsMailing" label="戶籍地址與通訊地址相同" density="compact"></v-checkbox>
            
            <div v-if="!isPermanentSameAsMailing">
              <label class="form-label">戶籍地址</label>
              <v-row dense>
                <v-col cols="6">
                  <v-select
                    v-model="permanentCounty"
                    :items="counties"
                    label="縣市"
                    :loading="loadingCounties"
                    density="compact"
                    variant="outlined"
                  ></v-select>
                </v-col>
                <v-col cols="6">
                  <v-select
                    :key="`permanent-towns-${permanentCounty}`"
                    v-model="permanentTown"
                    :items="permanentTowns"
                    label="鄉鎮市區"
                    :loading="loadingPermanentTowns"
                    :disabled="!permanentCounty"
                    density="compact"
                    variant="outlined"
                  ></v-select>
                </v-col>
              </v-row>
              <v-text-field label="詳細地址" v-model="editableData.buyerPermanentAddressDetail" density="compact" variant="outlined"></v-text-field>
            </div>
            </div>
        </v-col>
      </v-row>
    </v-form>
    
    <ParkingEditModal 
      v-model:show="isParkingModalOpen"
      :all-parking-data="allParkingData"
      :initial-selected-parking="editableData.parkingSpots || []"
      @confirm="handleParkingUpdate"
      @request-open-slide="$emit('request-open-slide')"
    />
  </div>
</template>

<script setup>
import { ref, computed, watch, defineAsyncComponent, defineProps, defineEmits, onMounted, nextTick } from 'vue';
import VueDatePicker from '@vuepic/vue-datepicker';
import '@vuepic/vue-datepicker/dist/main.css';
import axios from 'axios';
import { useDisplay } from 'vuetify';

const NLSC_API_BASE_URL = '/api-nlsc'; 

const ParkingEditModal = defineAsyncComponent(() => import('./ParkingEditModal.vue'));

const props = defineProps({
  modelValue: { type: Object, default: () => ({}) },
  statusOptions: { type: Array, default: () => [] },
  personnelOptions: { type: Array, default: () => [] },
  allParkingData: { type: Array, default: () => [] },
  projectName: { type: String, required: true },
  contractTypeOptions: { type: Array, default: () => [] },
  firstPurchaseOptions: { type: Array, default: () => [] },
  // ✅ 1. 新增 Prop
  allSalesImages: { type: Array, default: () => [] },
});

const emit = defineEmits(['update:modelValue', 'request-open-slide']);

const { mobile } = useDisplay(); 
const isMobile = computed(() => mobile.value); 

const isParkingModalOpen = ref(false);
const isPermanentSameAsMailing = ref(false);

const editableData = computed({
  get: () => props.modelValue,
  set: (newValue) => emit('update:modelValue', newValue)
});

// ✅ 2. 新增 Computed，將圖片物件陣列轉換為名稱字串陣列
const salesImageOptions = computed(() => {
  return props.allSalesImages.map(img => img.imageName);
});

// ✅ 3. 新增 Watcher，確保 salesImages 永遠是陣列
watch(() => editableData.value, (newData) => {
  if (newData && !Array.isArray(newData.salesImages)) {
    // 如果 salesImages 不存在或不是陣列，初始化為一個空陣列
    // ✅ 修改：透過 emit 更新一個新的物件，而不是直接修改舊物件的屬性
    emit('update:modelValue', { ...newData, salesImages: [] });
  }
}, { immediate: true, deep: true });

const counties = ref([]);
const mailingTowns = ref([]);
const permanentTowns = ref([]);
const mailingCounty = ref(null);
const mailingTown = ref(null);
const permanentCounty = ref(null);
const permanentTown = ref(null);
const loadingCounties = ref(false);
const loadingMailingTowns = ref(false);
const loadingPermanentTowns = ref(false);

onMounted(async () => {
  await fetchCounties();
  initializeAddress();
});

const fetchCounties = async () => {
    loadingCounties.value = true;
    try {
        const response = await axios.get(`${NLSC_API_BASE_URL}/other/ListCounty`);
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(response.data, "application/xml");
        const countyNodes = xmlDoc.querySelectorAll('countyItem');
        counties.value = Array.from(countyNodes).map(node => ({
            title: node.querySelector('countyname').textContent,
            value: node.querySelector('countycode').textContent
        }));
    } catch (error) {
        console.error("無法獲取縣市列表:", error);
    } finally {
        loadingCounties.value = false;
    }
};

const fetchTowns = async (countyCode, targetTownsRef, loadingRef) => {
    if (!countyCode) {
        targetTownsRef.value = [];
        return;
    };
    loadingRef.value = true;
    targetTownsRef.value = [];
    try {
        const url = `${NLSC_API_BASE_URL}/other/ListTown1/${countyCode}`;
        const response = await axios.get(url);
        targetTownsRef.value = response.data.map(item => ({
            title: item.townname,
            value: item.townname,
        }));
    } catch (error) {
        console.error(`無法獲取鄉鎮市區列表 (代碼: ${countyCode}):`, error);
    } finally {
        loadingRef.value = false;
    }
};

const initializeAddress = () => {
    const data = editableData.value;
    if (!data || counties.value.length === 0) return;

    const mailingCountyName = data.buyerMailingAddressCity;
    if (mailingCountyName) {
        const county = counties.value.find(c => c.title === mailingCountyName);
        if (county) {
            mailingCounty.value = county.value;
            const unwatch = watch(loadingMailingTowns, (isLoading) => {
                if (!isLoading) {
                    nextTick(() => { mailingTown.value = data.buyerMailingAddressDistrict; });
                    unwatch();
                }
            });
        }
    }

    const permanentCountyName = data.buyerPermanentAddressCity;
    if (permanentCountyName) {
      const county = counties.value.find(c => c.title === permanentCountyName);
      if (county) {
        permanentCounty.value = county.value;
        const unwatch = watch(loadingPermanentTowns, (isLoading) => {
            if (!isLoading) {
                nextTick(() => { permanentTown.value = data.buyerPermanentAddressDistrict; });
                unwatch();
            }
        });
      }
    }
};

watch(mailingCounty, (newCountyCode) => {
    const selectedCounty = counties.value.find(c => c.value === newCountyCode);
    editableData.value.buyerMailingAddressCity = selectedCounty ? selectedCounty.title : '';
    mailingTown.value = null;
    fetchTowns(newCountyCode, mailingTowns, loadingMailingTowns);
});
watch(mailingTown, (newTownName) => {
    editableData.value.buyerMailingAddressDistrict = newTownName || '';
});

watch(permanentCounty, (newCountyCode) => {
    const selectedCounty = counties.value.find(c => c.value === newCountyCode);
    editableData.value.buyerPermanentAddressCity = selectedCounty ? selectedCounty.title : '';
    permanentTown.value = null;
    fetchTowns(newCountyCode, permanentTowns, loadingPermanentTowns);
});
watch(permanentTown, (newTownName) => {
    editableData.value.buyerPermanentAddressDistrict = newTownName || '';
});

watch(isPermanentSameAsMailing, (isSame) => {
  if (isSame) {
    permanentCounty.value = mailingCounty.value;
    editableData.value.buyerPermanentAddressDetail = editableData.value.buyerMailingAddressDetail;
    const unwatch = watch(loadingPermanentTowns, (isLoading) => {
        if (!isLoading) {
            nextTick(() => { permanentTown.value = mailingTown.value; });
            unwatch();
        }
    });
  }
});

const houseBasePrice = computed(() => editableData.value?.price_floor_house_total || 0);
const parkingBasePrice = computed(() => {
  if (!editableData.value?.parkingSpots || !Array.isArray(editableData.value.parkingSpots)) return 0;
  return editableData.value.parkingSpots.reduce((sum, p) => sum + (Number(p.price_floor) || 0), 0);
});
const totalBasePrice = computed(() => houseBasePrice.value + parkingBasePrice.value);
const parkingDisplayText = computed(() => {
    const parking = editableData.value?.parkingSpots || [];
    if (parking.length === 0) return '尚未設定';
    return parking.map(p => p.spotId).join(', ');
});
const parkingSalePrice = computed(() => {
    const parking = editableData.value?.parkingSpots || [];
    return parking.reduce((sum, p) => sum + (Number(p.price_transaction) || 0), 0);
});
const totalSalePrice = computed(() => (Number(editableData.value?.price_transaction_house) || 0) + parkingSalePrice.value);
const unitSalePrice = computed(() => {
    const housePrice = Number(editableData.value?.price_transaction_house) || 0;
    const area = Number(editableData.value?.area_house_ping);
    if (!area) return 0;
    return (housePrice / area).toFixed(2);
});
const priceDifference = computed(() => {
  if (!totalSalePrice.value || !totalBasePrice.value) return 0;
  return totalSalePrice.value - totalBasePrice.value;
});
function handleParkingUpdate(updatedParkingList) {
    const newData = { ...editableData.value, parkingSpots: updatedParkingList };
    emit('update:modelValue', newData);
}
</script>

<style scoped>
.info-section { 
  padding: 16px; 
  border: 1px solid #e0e0e0; 
  border-radius: 8px; 
  height: 100%;
}
.section-title { font-size: 1.1rem; font-weight: 600; color: #1a3a6e; margin-bottom: 16px; padding-bottom: 8px; border-bottom: 2px solid #e0e0e0; display: flex; align-items: center; gap: 8px; }
.form-label { font-size: 0.9rem; color: #555; font-weight: 500; margin-bottom: 4px; display: block; }
.base-price-field :deep(.v-field) {
  background-color: #fce4ec; 
}
.mb-4 {
  margin-bottom: 16px;
}
.mb-2 {
  margin-bottom: 8px;
}
</style>