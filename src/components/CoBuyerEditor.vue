<template>
  <v-card variant="outlined" class="mb-2 cobuyer-card">
    <!-- 收合列：姓名 + 電話摘要 -->
    <div class="d-flex align-center px-3 py-2 cursor-pointer bg-grey-lighten-5" @click="expanded = !expanded">
      <v-icon size="small" color="indigo" class="mr-2">mdi-account-plus-outline</v-icon>
      <div class="flex-grow-1 text-truncate">
        <span class="font-weight-bold">{{ coBuyer.name || '未填姓名' }}</span>
        <span v-if="coBuyer.phone" class="text-caption text-grey-darken-1 ml-2">{{ coBuyer.phone }}</span>
      </div>
      <v-chip v-if="coBuyer.sourceSubmissionId" size="x-small" color="teal" variant="tonal" class="mr-1">客資卡導入</v-chip>
      <v-btn icon="mdi-trash-can-outline" variant="text" size="small" color="grey" @click.stop="$emit('remove')"></v-btn>
      <v-icon size="small" :class="{ 'rotate-180': expanded }">mdi-chevron-down</v-icon>
    </div>

    <v-expand-transition>
      <div v-show="expanded">
        <v-divider></v-divider>
        <v-card-text class="pa-3">
          <v-text-field label="姓名" v-model="coBuyer.name" density="compact" variant="outlined" class="mb-2" hide-details></v-text-field>
          <v-combobox
            label="聯絡電話"
            v-model="phonesList"
            multiple
            chips
            clearable
            closable-chips
            density="compact"
            variant="outlined"
            class="mb-2"
            hint="可輸入多筆電話，輸入後按 Enter 新增"
            persistent-hint
          ></v-combobox>
          <v-text-field label="身分證字號" v-model="coBuyer.idNumber" density="compact" variant="outlined" class="mb-2" hide-details></v-text-field>
          <v-text-field label="EMAIL" v-model="coBuyer.email" type="email" density="compact" variant="outlined" class="mb-2" hide-details></v-text-field>

          <label class="form-label">出生年月日 (民國)</label>
          <v-row dense>
            <v-col cols="4">
              <v-text-field v-model.number="rocYear" label="年" suffix="年" variant="outlined" density="compact" type="number" hide-details @update:model-value="syncDob"></v-text-field>
            </v-col>
            <v-col cols="4">
              <v-select v-model="rocMonth" :items="monthOptions" label="月" variant="outlined" density="compact" hide-details @update:model-value="syncDob"></v-select>
            </v-col>
            <v-col cols="4">
              <v-text-field v-model.number="rocDay" label="日" suffix="日" variant="outlined" density="compact" type="number" hide-details @update:model-value="syncDob"></v-text-field>
            </v-col>
          </v-row>
          <div v-if="!isDateValid" class="text-caption text-error mb-1">請輸入正確的日期格式</div>

          <label class="form-label mt-2">通訊地址</label>
          <v-row dense>
            <v-col cols="6">
              <v-select v-model="addrCity" :items="counties" label="縣市" variant="outlined" density="compact" clearable hide-details></v-select>
            </v-col>
            <v-col cols="6">
              <v-select
                :key="`cobuyer-towns-${addrCity}`"
                v-model="addrTown"
                :items="towns"
                label="鄉鎮市區"
                :disabled="!addrCity"
                variant="outlined"
                density="compact"
                clearable
                hide-details
              ></v-select>
            </v-col>
            <v-col cols="12">
              <v-text-field label="詳細地址" v-model="coBuyer.mailingAddressDetail" variant="outlined" density="compact" hide-details></v-text-field>
            </v-col>
          </v-row>
        </v-card-text>
      </div>
    </v-expand-transition>
  </v-card>
</template>

<script setup>
// 共同買方編輯卡片：直接就地編輯傳入的 coBuyer 物件（來源為 editableData.coBuyers 陣列內的元素）
import { ref, computed, watch, nextTick } from 'vue';
import TwCitiesData from '@/assets/TwCities.json';

const props = defineProps({
  modelValue: { type: Object, required: true },
});
defineEmits(['remove']);

const coBuyer = computed(() => props.modelValue);

// 沒填姓名（通常是手動新增）預設展開
const expanded = ref(!props.modelValue?.name);

// 電話：多筆 chips ↔ 逗號分隔字串
const phonesList = computed({
  get: () => {
    if (!coBuyer.value.phone) return [];
    return String(coBuyer.value.phone).split(',').map(p => p.trim()).filter(Boolean);
  },
  set: (val) => {
    coBuyer.value.phone = Array.isArray(val) ? val.join(',') : val;
  },
});

// 出生年月日（民國物件）
const rocYear = ref(null);
const rocMonth = ref(null);
const rocDay = ref(null);
const monthOptions = Array.from({ length: 12 }, (_, i) => i + 1);

const isDateValid = computed(() => {
  if (!rocYear.value || !rocMonth.value || !rocDay.value) return true;
  const ceYear = rocYear.value + 1911;
  const date = new Date(ceYear, rocMonth.value - 1, rocDay.value);
  return date.getFullYear() === ceYear &&
    date.getMonth() === rocMonth.value - 1 &&
    date.getDate() === rocDay.value;
});

function syncDob() {
  if (rocYear.value && rocMonth.value && rocDay.value && isDateValid.value) {
    coBuyer.value.dateOfBirth = { year: rocYear.value, month: rocMonth.value, day: rocDay.value };
  } else {
    coBuyer.value.dateOfBirth = null;
  }
}

watch(() => coBuyer.value.dateOfBirth, (newVal) => {
  if (!newVal || typeof newVal !== 'object') {
    rocYear.value = null;
    rocMonth.value = null;
    rocDay.value = null;
    return;
  }
  rocYear.value = newVal.year ?? null;
  rocMonth.value = newVal.month ?? null;
  rocDay.value = newVal.day ?? null;
}, { immediate: true });

// 通訊地址（縣市/鄉鎮/詳細）
const counties = computed(() => TwCitiesData.map(c => c.name));
const towns = ref([]);
const addrCity = ref(null);
const addrTown = ref(null);
let initializingAddr = false;

function loadTowns(cityName) {
  const cityData = TwCitiesData.find(c => c.name === cityName);
  towns.value = cityData ? cityData.districts.map(d => d.name) : [];
}

function initAddress() {
  initializingAddr = true;
  const city = coBuyer.value.mailingAddressCity || null;
  addrCity.value = city;
  loadTowns(city);
  nextTick(() => {
    addrTown.value = coBuyer.value.mailingAddressDistrict || null;
    initializingAddr = false;
  });
}
initAddress();

// 外部（例如導入更新同一筆）改了地址時同步回本地選單
watch(() => [coBuyer.value.mailingAddressCity, coBuyer.value.mailingAddressDistrict], ([city, district]) => {
  if (city !== addrCity.value || district !== addrTown.value) initAddress();
});

watch(addrCity, (newCity) => {
  if (initializingAddr) return;
  coBuyer.value.mailingAddressCity = newCity || '';
  addrTown.value = null;
  loadTowns(newCity);
});

watch(addrTown, (newTown) => {
  if (initializingAddr) return;
  coBuyer.value.mailingAddressDistrict = newTown || '';
});
</script>

<style scoped>
.cobuyer-card {
  border-left: 3px solid #3F51B5 !important;
}
.form-label {
  font-size: 0.85rem;
  color: #555;
  font-weight: 500;
  margin-bottom: 4px;
  display: block;
}
.rotate-180 {
  transform: rotate(180deg);
  transition: transform 0.2s;
}
.cursor-pointer {
  cursor: pointer;
}
</style>
