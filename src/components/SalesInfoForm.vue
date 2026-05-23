<template>
  <div class="pa-2" :class="{ 'mb-8': isMobile }">
    <v-form>
       <v-row>
        <v-col cols="12" md="4">
          <div class="info-section">
            <div class="section-title"><v-icon>mdi-information-outline</v-icon>銷售資訊</div>
            <v-select 
              label="後台狀態" 
              :items="statusOptions" 
              v-model="editableData.salesStatus_backend" 
              class="mb-4" 
              clearable 
            ></v-select>

            <v-text-field
              label="銷售狀態"
              v-model="editableData.salesStatus_quote"
              class="mb-4"
              readonly
              
             
              hint="如要取消「已售」，請取消後台狀態"
              persistent-hint
            ></v-text-field>
            
            <v-select 
              label="銷售人員" 
              :items="personnelOptions" 
              v-model="editableData.salesperson" 
              class="mb-4"
              item-title="name"
              item-value="name"
              clearable
            ></v-select> <v-combobox
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
              <v-text-field label="持有車位" :model-value="parkingDisplayText" readonly variant="outlined"  hide-details></v-text-field>
              <v-btn class="ml-2" variant="plain" color="primary" @click="isParkingModalOpen = true" icon="mdi-pencil"></v-btn>
            </div>
            <label class="v-label text-caption">小訂日期</label>
            <VueDatePicker :locale="'zh-TW'" v-model="editableData.payment_deposit_date" auto-apply :enable-time-picker="false" format="yyyy/MM/dd" teleport="body" auto-position class="mb-4 anxi-datepicker"></VueDatePicker>
            <label class="v-label text-caption">補足日期</label>
            <VueDatePicker :locale="'zh-TW'" v-model="editableData.payment_complete_date" auto-apply :enable-time-picker="false" format="yyyy/MM/dd" teleport="body" auto-position class="mb-4 anxi-datepicker"></VueDatePicker>
            <label class="v-label text-caption">簽約日期</label>
            <VueDatePicker :locale="'zh-TW'" v-model="editableData.payment_contract_date" auto-apply :enable-time-picker="false" format="yyyy/MM/dd" teleport="body" auto-position class="mb-4 anxi-datepicker"></VueDatePicker>
            <v-textarea label="備註" v-model="editableData.remarks" rows="3" auto-grow></v-textarea>
          </div>
        </v-col>

        <v-col cols="12" md="4">
          <div class="info-section">
            <div class="section-title"><v-icon>mdi-currency-usd</v-icon>成交資訊</div>
            <!-- 合約方式 -->
            <div class="field-block mb-4">
              <div class="field-label">
                <v-icon size="18" color="indigo-darken-1">mdi-file-sign</v-icon>
                <span>合約方式</span>
              </div>
              <v-chip-group
                v-model="editableData.contractType"
                selected-class="contract-chip--active"
                column
              >
                <v-chip
                  v-for="opt in localContractOptions"
                  :key="opt"
                  :value="opt"
                  filter
                  variant="outlined"
                  class="contract-chip"
                >
                  {{ opt }}
                </v-chip>
              </v-chip-group>
              <div
                v-if="!localContractOptions || localContractOptions.length === 0"
                class="text-caption text-grey-darken-1"
              >
                尚無合約方式選項
              </div>
            </div>

            <!-- 是否首購 -->
            <div class="field-block mb-4">
              <div class="field-label">
                <v-icon size="18" color="amber-darken-2">mdi-home-heart</v-icon>
                <span>是否首購</span>
              </div>
              <v-btn-toggle
                v-model="firstTimeBuyerModel"
                mandatory
                divided
                rounded="lg"
                class="firstbuyer-toggle w-100"
              >
                <v-btn
                  :value="true"
                  :color="firstTimeBuyerModel === true ? 'success' : undefined"
                  variant="flat"
                  class="flex-1-1"
                >
                  <v-icon start>mdi-check-circle</v-icon>是
                </v-btn>
                <v-btn
                  :value="false"
                  :color="firstTimeBuyerModel === false ? 'blue-grey-darken-1' : undefined"
                  variant="flat"
                  class="flex-1-1"
                >
                  <v-icon start>mdi-close-circle-outline</v-icon>否
                </v-btn>
              </v-btn-toggle>
            </div>
            <div class="d-flex align-center gap-2 mb-2">
              <v-text-field label="房屋成交價(萬)" v-model.number="editableData.price_transaction_house" type="number" :min="0" class="flex-1"></v-text-field>
              <v-btn icon="mdi-calculator" size="small" variant="text" color="primary" @click="openPriceNegotiationDialog" title="房屋成交價調整"></v-btn>
            </div>
            <v-text-field label="車位成交價(萬)"  :model-value="parkingSalePrice" variant="solo" readonly   class="mb-2"></v-text-field>
            <v-text-field label="成交總價(萬)" :model-value="totalSalePrice" variant="solo" readonly  class="mb-2"></v-text-field>
            <v-text-field label="溢差價(萬)" :model-value="priceDifference"variant="solo" readonly  ></v-text-field>
          </div>
        </v-col>

        <v-col cols="12" md="4">
          <div class="info-section">
            <div class="section-title"><v-icon>mdi-account-details</v-icon>買方資訊</div>
            <v-text-field label="買方姓名" v-model="editableData.buyerName" class="mb-2"></v-text-field>
            <v-combobox 
              label="聯絡電話" 
              v-model="buyerPhonesList" 
              multiple 
              chips 
              clearable 
              closable-chips 
              class="mb-2"
              hint="可手動輸入多筆電話，輸入後按 Enter 新增"
              persistent-hint
            ></v-combobox>
            <v-text-field label="身分證字號" v-model="editableData.buyerIdNumber" class="mb-2"></v-text-field>
           <v-col cols="12">
    <label class="form-label">出生年月日 (民國)</label>
    <v-row dense>
        <v-col cols="4">
            <v-text-field
                v-model.number="rocYear"
                label="年"
                suffix="年"
                variant="outlined"
                density="compact"
                type="number"
                :rules="rocYearRules"
                @update:model-value="syncToModel"
            ></v-text-field> </v-col>
        <v-col cols="4">
            <v-select
                v-model="rocMonth"
                :items="monthOptions"
                label="月"
                variant="outlined"
                density="compact"
                :rules="rocMonthRules"
                @update:model-value="syncToModel"
            ></v-select> </v-col>
        <v-col cols="4">
            <v-text-field
                v-model.number="rocDay"
                label="日"
                suffix="日"
                variant="outlined"
                density="compact"
                type="number"
                :rules="rocDayRules"
                @update:model-value="syncToModel"
            ></v-text-field> </v-col>
    </v-row>
    <div v-if="!isDateValid" class="text-caption text-error">請輸入正確的日期格式</div>
</v-col>
            <v-text-field label="EMAIL" v-model="editableData.buyerEmail" type="email" class="mb-4"></v-text-field>
            
            <div>
              <label class="form-label">通訊地址</label>
              <v-row dense>
                <v-col cols="6">
                  <v-select
                    v-model="mailingCounty"
                    :items="counties"
                    label="縣市"
                    
                    variant="outlined"
                    clearable
                  ></v-select> </v-col>
                <v-col cols="6">
                  <v-select
                    :key="`mailing-towns-${mailingCounty}`"
                    v-model="mailingTown"
                    :items="mailingTowns"
                    label="鄉鎮市區"
                    :disabled="!mailingCounty"
                    
                    variant="outlined"
                    clearable
                  ></v-select> </v-col>
              </v-row>
              <v-text-field label="詳細地址" v-model="editableData.buyerMailingAddressDetail"  variant="outlined"></v-text-field>
            </div>

<v-checkbox v-model="isPermanentSameAsMailing" label="戶籍地址與通訊地址相同" ></v-checkbox>
            
            <div>
              <label class="form-label">戶籍地址</label>
              <v-row dense>
                <v-col cols="6">
                  <v-select
                    v-model="permanentCounty"
                    :items="counties"
                    label="縣市"
                    variant="outlined"
                    clearable
                    :disabled="isPermanentSameAsMailing"
                    :bg-color="isPermanentSameAsMailing ? 'grey-lighten-4' : undefined"
                  ></v-select> </v-col>
                <v-col cols="6">
                  <v-select
                    :key="`permanent-towns-${permanentCounty}`"
                    v-model="permanentTown"
                    :items="permanentTowns"
                    label="鄉鎮市區"
                    :disabled="!permanentCounty || isPermanentSameAsMailing"
                    variant="outlined"
                    clearable
                    :bg-color="isPermanentSameAsMailing ? 'grey-lighten-4' : undefined"
                  ></v-select> </v-col>
              </v-row>
              <v-text-field 
                label="詳細地址" 
                v-model="editableData.buyerPermanentAddressDetail"  
                variant="outlined"
                :readonly="isPermanentSameAsMailing"
                :bg-color="isPermanentSameAsMailing ? 'grey-lighten-4' : undefined"
              ></v-text-field>
            </div>
            </div>
        </v-col>
      </v-row>
    </v-form>
    
    <ParkingEditModal 
      v-model:show="isParkingModalOpen"
      :allParkingData="allParkingData"
      :initialSelectedParking="ownedParkingSpots"
      @confirm="handleParkingUpdate"
      @request-open-slide="$emit('request-open-slide')"
      mode="sales"
      :project-id="props.projectId"
      :sales-control-view-mode="props.viewMode" />

    <!-- ✅ [新增] 房屋成交價調整對話框 -->
    <v-dialog v-model="isPriceNegotiationDialogVisible" max-width="500">
      <v-card>
        <v-card-title class="bg-primary text-white d-flex align-center gap-2">
          <v-icon>mdi-calculator</v-icon>
          房屋成交價調整
        </v-card-title>

        <v-card-text class="pt-6">
          <div class="mb-6">
            <div class="text-caption text-grey-darken-1 mb-2">房屋表價</div>
            <div class="text-h5 font-weight-bold text-primary">{{ Math.round(Number(editableData.price_list_house_total) || 0) }} 萬元</div>
            <div class="text-caption text-grey">房屋總面積: {{ formatNumber(editableData.area_house_ping, 2) }} 坪</div>
          </div>

          <v-divider class="my-4"></v-divider>

          <!-- 調整方式 -->
          <div class="mb-6">
            <div class="text-subtitle-2 font-weight-bold mb-4">調整方式</div>

            <!-- 第一欄：每坪調整 -->
            <div class="mb-4">
              <label class="text-caption text-grey-darken-1 d-block mb-2">每坪調整 (萬/坪)</label>
              <v-text-field
                v-model="priceNegotiationPerTsuboValue"
                type="number"
                suffix="萬/坪"
                placeholder="例如: -1.5 (減) 或 +0.5 (加)"
                variant="outlined"
                density="compact"
                hint="輸入負數表示每坪減少"
                persistent-hint
                @update:model-value="calculatePriceNegotiation"
              ></v-text-field>
            </div>

            <!-- 第二欄：直接調整 -->
            <div class="mb-4">
              <label class="text-caption text-grey-darken-1 d-block mb-2">直接調整總價 (萬)</label>
              <v-text-field
                v-model="priceNegotiationDirectAmountValue"
                type="number"
                suffix="萬"
                placeholder="例如: -15 (減) 或 +10 (加)"
                variant="outlined"
                density="compact"
                hint="輸入負數表示總價減少"
                persistent-hint
                @update:model-value="calculatePriceNegotiation"
              ></v-text-field>
            </div>
          </div>

          <v-divider class="my-4"></v-divider>

          <!-- 預覽結果 -->
          <div class="mb-4">
            <div class="text-subtitle-2 font-weight-bold mb-3">調整預覽</div>
            <v-card variant="outlined" class="pa-4 bg-grey-lighten-5">
              <!-- 原房屋表價 -->
              <div class="d-flex justify-space-between align-center mb-3">
                <span class="text-grey-darken-2">原房屋表價</span>
                <span class="font-weight-bold">{{ Math.round(Number(editableData.price_list_house_total) || 0) }} 萬</span>
              </div>
              <v-divider class="my-2"></v-divider>

              <!-- 每坪調整 (僅在有值時顯示) -->
              <div v-if="priceNegotiationPerTsuboValue !== ''" class="d-flex justify-space-between align-center mb-3">
                <span class="text-grey-darken-2">
                  每坪調整 ({{ priceNegotiationPerTsuboValue }} × {{ formatNumber(editableData.area_house_ping, 2) }} 坪)
                </span>
                <span :class="(Number(priceNegotiationPerTsuboValue) * Number(editableData.area_house_ping)) > 0 ? 'text-error font-weight-bold' : 'text-success font-weight-bold'">
                  {{ (Number(priceNegotiationPerTsuboValue) * Number(editableData.area_house_ping)) > 0 ? '+' : '' }}{{ Math.round(Number(priceNegotiationPerTsuboValue) * Number(editableData.area_house_ping)) }} 萬
                </span>
              </div>

              <!-- 直接調整 (僅在有值時顯示) -->
              <div v-if="priceNegotiationDirectAmountValue !== ''" class="d-flex justify-space-between align-center mb-3">
                <span class="text-grey-darken-2">直接調整</span>
                <span :class="Number(priceNegotiationDirectAmountValue) > 0 ? 'text-error font-weight-bold' : 'text-success font-weight-bold'">
                  {{ Number(priceNegotiationDirectAmountValue) > 0 ? '+' : '' }}{{ priceNegotiationDirectAmountValue }} 萬
                </span>
              </div>

              <!-- 分隔線 (若有任一調整) -->
              <div v-if="priceNegotiationPerTsuboValue !== '' || priceNegotiationDirectAmountValue !== ''">
                <v-divider class="my-2"></v-divider>
              </div>

              <!-- 調整合計 -->
              <div v-if="priceNegotiationPerTsuboValue !== '' || priceNegotiationDirectAmountValue !== ''" class="d-flex justify-space-between align-center mb-3">
                <span class="text-grey-darken-2 font-weight-bold">調整合計</span>
                <span :class="(priceNegotiationResult - (Number(editableData.price_list_house_total) || 0)) > 0 ? 'text-error font-weight-bold' : 'text-success font-weight-bold'">
                  {{ (priceNegotiationResult - (Number(editableData.price_list_house_total) || 0)) > 0 ? '+' : '' }}{{ Math.round(priceNegotiationResult - (Number(editableData.price_list_house_total) || 0)) }} 萬
                </span>
              </div>
              <v-divider class="my-2"></v-divider>

              <!-- 新房屋成交價 -->
              <div class="d-flex justify-space-between align-center">
                <span class="text-h6 font-weight-bold">新房屋成交價</span>
                <span class="text-h5 font-weight-bold text-primary">{{ Math.round(priceNegotiationResult) }} 萬</span>
              </div>
              <div class="text-caption text-grey mt-1">單價: {{ formatNumber(priceNegotiationResult / (Number(editableData.area_house_ping) || 1), 2) }} 萬/坪</div>

              <!-- 房屋底價 -->
              <div class="d-flex justify-space-between align-center mt-3">
                <span class="text-grey-darken-2">房屋底價</span>
                <span class="font-weight-bold">{{ Math.round(Number(editableData.price_floor_house_total) || 0) }} 萬</span>
              </div>

              <!-- 溢差價 -->
              <div class="d-flex justify-space-between align-center mt-2">
                <span class="text-h6 font-weight-bold">溢差價</span>
                <span :class="(priceNegotiationResult - (Number(editableData.price_floor_house_total) || 0)) >= 0 ? 'text-success font-weight-bold text-h6' : 'text-error font-weight-bold text-h6'">
                  {{ Math.round(priceNegotiationResult - (Number(editableData.price_floor_house_total) || 0)) }} 萬
                </span>
              </div>
            </v-card>
          </div>
        </v-card-text>

        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="grey" variant="text" @click="isPriceNegotiationDialogVisible = false">
            取消
          </v-btn>
          <v-btn color="primary" variant="flat" @click="savePriceNegotiation">
            確認調整
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup>
import { ref, computed, watch, defineAsyncComponent, defineProps, defineEmits, onMounted, nextTick } from 'vue';
import VueDatePicker from '@vuepic/vue-datepicker';
import '@vuepic/vue-datepicker/dist/main.css';
import axios from 'axios';
import { useDisplay } from 'vuetify';
import TwCitiesData from '@/assets/TwCities.json' with { type: 'json' };
const ParkingEditModal = defineAsyncComponent(() => import('./ParkingEditModal.vue'));

const props = defineProps({
  modelValue: { type: Object, default: () => ({}) },
  statusOptions: { type: Array, default: () => [] },
  personnelOptions: { type: Array, default: () => [] },
  allParkingData: { type: Array, default: () => [] },
  projectName: { type: String, required: true },

  projectId: { type: String, required: true },
  viewMode: { type: String, default: 'sales' },

  contractTypeOptions: { type: Array, default: () => [] },
  firstPurchaseOptions: { type: Array, default: () => [] },
  // ✅ 1. 新增 Prop
  allSalesImages: { type: Array, default: () => [] },
});

const emit = defineEmits(['update:modelValue', 'request-open-slide', 'parking-updated']);

const { mobile } = useDisplay();
const isMobile = computed(() => mobile.value);

// ✅ [新增] 格式化數字函數
function formatNumber(val, frac = 0) {
  if (val === null || val === undefined || val === '') return 'N/A';
  const num = parseFloat(val);
  if (isNaN(num)) return 'N/A';
  return num.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: frac });
} 

const isParkingModalOpen = ref(false);
const isPermanentSameAsMailing = ref(false);

// ✅ [新增] 房屋成交價調整相關狀態
const isPriceNegotiationDialogVisible = ref(false);
const priceNegotiationPerTsuboValue = ref('');    // 每坪調整值
const priceNegotiationDirectAmountValue = ref(''); // 直接調整值
const priceNegotiationResult = ref(0);             // 調整後的價格

// ✅ 
const localContractOptions = computed(() => {
  // 
  console.log('SalesInfoForm: 接收到的 contractTypeOptions prop 更新:', props.contractTypeOptions);
  return props.contractTypeOptions;
});

const editableData = computed({
  get: () => props.modelValue,
  set: (newValue) => emit('update:modelValue', newValue)
});

// ✅ [新增] 是否首購顯示模型：資料為空值（非明確的 true/false）時，UI 一律視為「是」
// 這保證畫面在任何時序下都顯示「是」；實際空值正規化寫回由下方 deep watch 處理
const firstTimeBuyerModel = computed({
  get: () => (editableData.value?.isFirstTimeBuyer === false ? false : true),
  set: (val) => {
    if (editableData.value) editableData.value.isFirstTimeBuyer = val;
  }
});

// ✅ 2. 新增 Computed，將圖片物件陣列轉換為名稱字串陣列
const salesImageOptions = computed(() => {
  return props.allSalesImages.map(img => img.imageName);
});

// ✅ 新增：處理多筆聯絡電話，綁定至逗號分隔字串
const buyerPhonesList = computed({
  get: () => {
    if (!editableData.value.buyerPhone) return [];
    if (Array.isArray(editableData.value.buyerPhone)) return editableData.value.buyerPhone;
    return String(editableData.value.buyerPhone).split(',').map(p => p.trim()).filter(Boolean);
  },
  set: (val) => {
    editableData.value.buyerPhone = Array.isArray(val) ? val.join(',') : val;
  }
});

// ✓ [打勾] 新增民國年月日暫存狀態
const rocYear = ref(null);
const rocMonth = ref(null);
const rocDay = ref(null);

const monthOptions = Array.from({ length: 12 }, (_, i) => i + 1);

// ✓ [打勾] 驗證邏輯：檢查日期是否合法 (含閏年判斷)
const isDateValid = computed(() => {
    if (!rocYear.value || !rocMonth.value || !rocDay.value) return true;
    const ceYear = rocYear.value + 1911;
    const date = new Date(ceYear, rocMonth.value - 1, rocDay.value);
    // 檢查 Date 物件是否發生自動進位 (例如 2/30 變成 3/2)
    return date.getFullYear() === ceYear && 
           date.getMonth() === rocMonth.value - 1 && 
           date.getDate() === rocDay.value;
});

// ✓ [打勾] 驗證規則
const rocYearRules = [
    v => !!v || '必填',
    v => v > 0 || '年份需大於 0',
    v => v <= (new Date().getFullYear() - 1911) || '年份不可超過今年'
];
const rocMonthRules = [v => !!v || '必填'];
const rocDayRules = [
    v => !!v || '必填',
    v => (v >= 1 && v <= 31) || '日期範圍錯誤'
];

// ✓ [打勾] 函數：將民國年月日寫入編輯模型 (儲存為物件格式 { year, month, day })
function syncToModel() {
    if (rocYear.value && rocMonth.value && rocDay.value && isDateValid.value) {
        // 修改：不再轉為 Date，而是儲存為自訂物件
        editableData.value.buyerDateOfBirth = {
            year: rocYear.value,
            month: rocMonth.value,
            day: rocDay.value
        };
    } else {
        editableData.value.buyerDateOfBirth = null;
    }
}

// ✓ [打勾] 監聽初始資料，將後端格式 (Timestamp/Date 或 ROC物件) 拆解回民國顯示
watch(() => props.modelValue.buyerDateOfBirth, (newVal) => {
    if (!newVal) {
        rocYear.value = null;
        rocMonth.value = null;
        rocDay.value = null;
        return;
    }

    // 情況 A: 新格式 (物件 { year, month, day })
    if (typeof newVal === 'object' && 'year' in newVal && 'month' in newVal) {
        rocYear.value = newVal.year;
        rocMonth.value = newVal.month;
        rocDay.value = newVal.day;
        return;
    }

    // 情況 B: 舊格式 (Firestore Timestamp 或 JS Date)
    let dateObj;
    if (typeof newVal.toDate === 'function') {
        dateObj = newVal.toDate();
    } else {
        dateObj = new Date(newVal);
    }
    
    if (!isNaN(dateObj.getTime())) {
        rocYear.value = dateObj.getFullYear() - 1911;
        rocMonth.value = dateObj.getMonth() + 1;
        rocDay.value = dateObj.getDate();
    }
}, { immediate: true });

// ✅ [新增] 監聽銷售人員選擇變化，同步寫入 salespersonUserKey (來源：salesPersonnel.phone)
// Why: salesHouseholds 原本只存姓名字串，造成同名衝突 / 改名失聯 / 反查效率差
watch(
  [() => editableData.value?.salesperson, () => props.personnelOptions],
  ([name, options]) => {
    if (!editableData.value) return;
    const matched = name ? (options || []).find(p => p?.name === name) : null;
    const newKey = matched?.phone || null;
    if (editableData.value.salespersonUserKey !== newKey) {
      editableData.value.salespersonUserKey = newKey;
    }
  },
  { immediate: true }
);

// ✅ 3. Watcher：確保 salesImages 永遠是陣列、衍伸銷售狀態，並套用成交資訊預設值
// 同時監聽 localContractOptions，因 contractTypeOptions 為非同步傳入的 prop（初始可能為空陣列）
watch([() => editableData.value, localContractOptions], ([newData, options]) => {
  if (!newData) return; // 如果 newData 是 null/undefined，則跳過

  let needsUpdate = false;
  const updatedData = { ...newData }; // 建立一個可變更的副本

  // 檢查 salesImages
  if (!Array.isArray(newData.salesImages)) {
    // 如果 salesImages 不存在或不是陣列，初始化為一個空陣列
    updatedData.salesImages = [];
    needsUpdate = true;
  }

  // ✅ START: 新增 - 衍伸銷售狀態
  // 根據 "後台狀態" (salesStatus_backend) 決定 "銷售狀態" (salesStatus_quote)
  const newQuoteStatus = newData.salesStatus_backend ? "已售" : "";

  // 只有在衍伸值與當前值不同時，才標記為需要更新
  if (newData.salesStatus_quote !== newQuoteStatus) {
    updatedData.salesStatus_quote = newQuoteStatus;
    needsUpdate = true;
  }
  // ✅ END: 新增

  // ✅ 是否首購：空值（非明確 true/false，含 undefined/null/空字串）一律預設「是」
  if (newData.isFirstTimeBuyer !== true && newData.isFirstTimeBuyer !== false) {
    updatedData.isFirstTimeBuyer = true;
    needsUpdate = true;
  }

  // ✅ 合約方式：尚未選取且選項含「一般合約」→ 預設選「一般合約」
  const contractEmpty =
    newData.contractType === undefined || newData.contractType === null || newData.contractType === '';
  if (contractEmpty && Array.isArray(options) && options.includes('一般合約')) {
    updatedData.contractType = '一般合約';
    needsUpdate = true;
  }

  // 如果需要更新 (任一邏輯觸發)，則發出一次 'update:modelValue' 事件
  if (needsUpdate) {
    emit('update:modelValue', updatedData);
  }

}, { immediate: true, deep: true });

const allCitiesData = ref(TwCitiesData);

const counties = computed(() => allCitiesData.value.map(city => city.name));
const mailingTowns = ref([]);
const permanentTowns = ref([]);
const mailingCounty = ref(null);
const mailingTown = ref(null);
const permanentCounty = ref(null);
const permanentTown = ref(null);

onMounted(async () => {
  initializeAddress();
});


const initializeAddress = () => {
    const data = editableData.value;
    if (!data || counties.value.length === 0) return;

    const mailingCountyName = data.buyerMailingAddressCity;
    if (mailingCountyName) {
        const county = allCitiesData.value.find(c => c.name === mailingCountyName);
        if (county) {
            mailingCounty.value = county.name;
            mailingTowns.value = county.districts.map(d => d.name);
            
            // ✅ 使用 nextTick 確保 v-select (下拉選單) 已經更新了選項
            nextTick(() => { 
                mailingTown.value = data.buyerMailingAddressDistrict; 
            });
        }
    }

    const permanentCountyName = data.buyerPermanentAddressCity;
    if (permanentCountyName) {
      const county = allCitiesData.value.find(c => c.name === permanentCountyName);
      if (county) {
        permanentCounty.value = county.name;
        permanentTowns.value = county.districts.map(d => d.name);
        
        // ✅ 使用 nextTick
        nextTick(() => { 
            permanentTown.value = data.buyerPermanentAddressDistrict; 
        });
      }
    }
};

watch(mailingCounty, (newCountyName) => {
    const selectedCounty = counties.value.find(c => c === newCountyName);
    editableData.value.buyerMailingAddressCity = selectedCounty || '';
    mailingTown.value = null; // 重設鄉鎮市區
    
    if (selectedCounty) {
        const countyData = allCitiesData.value.find(c => c.name === selectedCounty);
        mailingTowns.value = countyData ? countyData.districts.map(d => d.name) : [];
    } else {
        mailingTowns.value = [];
    }
});
watch(mailingTown, (newTownName) => {
    editableData.value.buyerMailingAddressDistrict = newTownName || '';
});

// ✅ MOD: 修改 watch，從本地資料獲取鄉鎮市區
watch(permanentCounty, (newCountyName) => {
    const selectedCounty = counties.value.find(c => c === newCountyName);
    editableData.value.buyerPermanentAddressCity = selectedCounty || '';
    permanentTown.value = null; // 重設鄉鎮市區
    
    if (selectedCounty) {
        const countyData = allCitiesData.value.find(c => c.name === selectedCounty);
        permanentTowns.value = countyData ? countyData.districts.map(d => d.name) : [];
    } else {
        permanentTowns.value = [];
    }
});
watch(permanentTown, (newTownName) => {
    editableData.value.buyerPermanentAddressDistrict = newTownName || '';
});

// ✅ MOD: 修改 "地址相同" 的 watch 邏輯
watch(isPermanentSameAsMailing, (isSame) => {
  if (isSame) {
    permanentCounty.value = mailingCounty.value;
    editableData.value.buyerPermanentAddressDetail = editableData.value.buyerMailingAddressDetail;
    
    // ✅ 由於 permanentCounty 的 watch 會自動更新 permanentTowns，我們用 nextTick 來等待更新
    nextTick(() => { 
        permanentTown.value = mailingTown.value; 
    });
  }
});

// ✅ [新增] 監聽通訊縣市變化，若同步開啟則更新戶籍縣市
watch(mailingCounty, (val) => {
  if (isPermanentSameAsMailing.value) {
    permanentCounty.value = val;
  }
});

// ✅ [新增] 監聽通訊鄉鎮變化，若同步開啟則更新戶籍鄉鎮
watch(mailingTown, (val) => {
  if (isPermanentSameAsMailing.value) {
     // 使用 nextTick 確保 permanentCounty 變更觸發的列表更新已完成
     nextTick(() => {
        permanentTown.value = val;
     });
  }
});

// ✅ [新增] 監聽通訊詳細地址變化，若同步開啟則更新戶籍詳細地址
watch(() => editableData.value.buyerMailingAddressDetail, (val) => {
  if (isPermanentSameAsMailing.value) {
    editableData.value.buyerPermanentAddressDetail = val;
  }
});

// 📋 從 salesParkings 集合中找出該戶別持有的車位
const ownedParkingSpots = computed(() => {
  // 1. 如果已存在編輯中的暫存資料，優先使用它
  if (editableData.value?.['持有車位'] && editableData.value['持有車位'].length > 0) {
    return editableData.value['持有車位'].map(p => ({
        ...p,
        spotId: p.spotId || p['車位編號'], // 確保 Key 相容
        price_transaction: p.price_transaction || p['車位成交價']
    }));
  }

  // 2. 否則才從原始資料庫列表過濾 (原本的邏輯)
  if (!props.allParkingData || !editableData.value?.unitId) return [];
  return props.allParkingData.filter(parking => parking.buyerUnitId === editableData.value.unitId);
});

const houseBasePrice = computed(() => editableData.value?.price_floor_house_total || 0);
const parkingBasePrice = computed(() => {
  return ownedParkingSpots.value.reduce((sum, p) => sum + (Number(p.price_floor) || 0), 0);
});
const totalBasePrice = computed(() => houseBasePrice.value + parkingBasePrice.value);
const parkingDisplayText = computed(() => {
    if (ownedParkingSpots.value.length === 0) return '尚未設定';
    return ownedParkingSpots.value.map(p => p.spotId).join(', ');
});
const parkingSalePrice = computed(() => {
    return ownedParkingSpots.value.reduce((sum, p) => sum + (Number(p.price_transaction) || 0), 0);
});
const totalSalePrice = computed(() => (Number(editableData.value?.price_transaction_house) || 0) + parkingSalePrice.value);

// ✅ [新增] 監聽 totalSalePrice 變動，自動同步到資料庫要儲存的欄位 price_transaction_total
watch(totalSalePrice, (newVal) => {
    if (editableData.value) {
        editableData.value.price_transaction_total = newVal;
    }
}, { immediate: true });
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

// 📋 處理車位更新：透過 API 直接更新 salesParkings 集合
async function handleParkingUpdate(updatedParkingList) {
    try {
        // ✅ [新增/修正] 即時更新前端顯示綁定
        // 若清空車位或變更車位，在此處即時將新陣列塞入 editableData (對應 ownedParkingSpots 取值來源)
        if (editableData.value) {
           editableData.value['持有車位'] = updatedParkingList;
        }

        // 觸發父元件進行車位資料更新
        // 傳遞更新的車位清單給父元件處理
        emit('parking-updated', {
            unitId: editableData.value.unitId,
            parkingList: updatedParkingList
        });
    } catch (error) {
        console.error('🚗 車位更新失敗:', error);
    }
}

// ✅ [新增] 房屋成交價調整相關方法
function openPriceNegotiationDialog() {
  // 重置調整欄位
  priceNegotiationPerTsuboValue.value = '';
  priceNegotiationDirectAmountValue.value = '';

  // 初始化調整後的價格為房屋表價
  const listPrice = Number(editableData.value?.price_list_house_total) || 0;
  priceNegotiationResult.value = listPrice;

  isPriceNegotiationDialogVisible.value = true;
}

function calculatePriceNegotiation() {
  const listPrice = Number(editableData.value?.price_list_house_total) || 0;
  const area = Number(editableData.value?.area_house_ping) || 0;
  const hasPerTsuboValue = priceNegotiationPerTsuboValue.value !== '';
  const hasDirectAmountValue = priceNegotiationDirectAmountValue.value !== '';

  // 兩欄位都空 → 顯示原始表價（恢復狀態）
  if (!hasPerTsuboValue && !hasDirectAmountValue) {
    priceNegotiationResult.value = Math.round(listPrice);
    return;
  }

  // 兩種方式並存、累加計算
  // 每坪調整
  const perTsuboAdj = hasPerTsuboValue
    ? Math.round((Number(priceNegotiationPerTsuboValue.value) || 0) * area)
    : 0;

  // 直接調整
  const directAdj = hasDirectAmountValue
    ? Math.round(Number(priceNegotiationDirectAmountValue.value) || 0)
    : 0;

  // 合計調整 = 每坪 + 直接（並存累加）
  const totalAdjustment = perTsuboAdj + directAdj;
  priceNegotiationResult.value = Math.round(listPrice + totalAdjustment);
}

function savePriceNegotiation() {
  const hasDirectAmount = priceNegotiationDirectAmountValue.value !== '';
  const hasPerTsubo = priceNegotiationPerTsuboValue.value !== '';

  // 兩欄位都空 → 視同取消調整，恢復原始價格
  if (!hasDirectAmount && !hasPerTsubo) {
    isPriceNegotiationDialogVisible.value = false;
    return;
  }

  // 更新房屋成交價
  editableData.value.price_transaction_house = Math.round(priceNegotiationResult.value);

  isPriceNegotiationDialogVisible.value = false;
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

/* ===== 合約方式 / 是否首購 區塊美化 ===== */
.field-block {
  background: #f7f9fc;
  border: 1px solid #e6ebf2;
  border-radius: 10px;
  padding: 12px 14px;
}
.field-label {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.85rem;
  font-weight: 600;
  color: #44546a;
  margin-bottom: 8px;
}
.contract-chip {
  font-weight: 500;
}
/* v-chip-group 選中的合約方式樣式（selected-class） */
.contract-chip--active {
  background-color: #1a3a6e !important;
  border-color: #1a3a6e !important;
  color: #ffffff !important;
}
/* 是否首購：兩顆按鈕平分寬度、等高 */
.firstbuyer-toggle {
  height: 44px;
}
.flex-1-1 {
  flex: 1 1 0;
}
.firstbuyer-toggle :deep(.v-btn) {
  height: 100%;
}
</style>

<style>
/* VueDatePicker teleport 到 body 後需要全域樣式：拉高 z-index 避免被 v-dialog (2400) 蓋住 */
.dp__outer_menu_wrap,
.dp__menu,
.dp__theme_light {
  z-index: 3000 !important;
}
</style>