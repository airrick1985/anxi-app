<template>
  <v-container>
    <v-row justify="center">
      <v-col cols="12" md="10" lg="8">

        <v-stepper v-if="!isCustomerMode" :model-value="step" class="mb-5">
        <v-stepper-header>
            <v-stepper-item :value="1" title="銷售人員驗證" :complete="step > 1"></v-stepper-item>
            <v-divider></v-divider>
            <v-stepper-item :value="2" title="選擇建案" :complete="step > 2"></v-stepper-item>
            <v-divider></v-divider>
            <v-stepper-item :value="3" title="選擇客戶" :complete="step > 3"></v-stepper-item>
            <v-divider></v-divider>
            <v-stepper-item :value="4" title="填寫資料"></v-stepper-item>
          </v-stepper-header>
        </v-stepper>

        <v-window v-model="step">
          <v-window-item :value="1">
            <v-card flat>
              <v-card-title>銷售人員登入</v-card-title>
              <v-card-text>
                <v-text-field
                  v-model="salesPhone"
                  label="請輸入您的手機號碼"
                  variant="outlined"
                  :rules="[rules.phone]"
                  @keydown.enter="focusPassword"
                  autofocus
                ></v-text-field>
                
                <v-text-field
                  ref="passwordField"
                  v-model="salesPassword"
                  label="請輸入密碼"
                  variant="outlined"
                  type="password"
                  :rules="[rules.required]"
                  @keydown.enter="handleVerifySales"
                  class="mt-2"
                ></v-text-field>

                <v-alert v-if="step1Error" type="error" variant="tonal" border="start" density="compact">{{ step1Error }}</v-alert>
              </v-card-text>
              <v-card-actions>
                <v-spacer></v-spacer>
                <v-btn color="primary" @click="handleVerifySales" :loading="isLoading">下一步</v-btn>
              </v-card-actions>
            </v-card>
          </v-window-item>

          <v-window-item :value="2">
             <v-card flat>
              <v-card-title>選擇建案</v-card-title>
              <v-card-text>
                <p class="mb-4">您好，{{ salesPerson.name }}！請選擇要操作的建案：</p>
                <v-chip-group v-model="selectedProjectId" column mandatory>
                  <v-chip
                    v-for="proj in salesPerson.projects"
                    :key="proj.id"
                    :value="proj.id"
                    filter
                    variant="outlined"
                    color="primary"
                    size="large"
                  >{{ proj.name }}</v-chip>
                </v-chip-group>
              </v-card-text>
              <v-card-actions>
                <v-btn @click="step = 1">上一步</v-btn>
                <v-spacer></v-spacer>
                <v-btn color="primary" @click="handleProjectSelected()" :disabled="!selectedProjectId" :loading="isLoading">下一步</v-btn>
              </v-card-actions>
            </v-card>
          </v-window-item>

          <v-window-item :value="3">
            <v-card flat>
              <v-card-title>選擇客戶</v-card-title>
                             
                 <v-text-field
                  v-model="guestSearch"
                  label="搜尋姓名或電話"
                  variant="outlined"
                  density="compact"
                  prepend-inner-icon="mdi-magnify"
                  clearable
                  hide-details
                  class="mb-4"
                 ></v-text-field>

                 <v-list lines="one" border rounded style="max-height: 400px; overflow-y: auto;">
                  <v-list-item
                    v-for="guest in filteredVipGuests"
                    :key="guest.id"
                    @click="handleGuestSelected(guest.id)"
                    :title="guest.name"
                    :subtitle="guest.phone"
                  >
                    <template v-slot:prepend>
                      <v-icon color="indigo">mdi-account-circle-outline</v-icon>
                    </template>

                    <template v-slot:append>
                      <div class="text-caption text-grey">
                        {{ formatGuestDate(guest.createdAt) }}
                      </div>
                    </template>
                    </v-list-item>
                  <v-list-item v-if="filteredVipGuests.length === 0">
                    <v-list-item-title class="text-center text-grey">找不到客戶</v-list-item-title>
                  </v-list-item>
                 </v-list>

                  <v-card-text>
                 <p class="mb-4">若無貴賓資料，請選擇「建立新客戶資料」</p>
                 <v-btn
                    color="#005AB6"
                    class="mb-6"
                    block
                    size="large"
                    @click="handleNewCustomer"
                    prepend-icon="mdi-account-plus-outline"
                 >
                    新建立客戶資料
                 </v-btn>

                 
              </v-card-text>
               <v-card-actions>
                <v-btn @click="step = 2">上一步</v-btn>
              </v-card-actions>
            </v-card>
          </v-window-item>
        </v-window>

        <div v-if="step === 4">
          <v-card v-if="showCoverImage && coverImageUrl" class="mb-5" elevation="4">
            <v-img :src="coverImageUrl" aspect-ratio="16/9" cover></v-img>
          </v-card>

          <v-card>
            <v-toolbar color="#f5f5f7" density="compact">
              <v-btn v-if="!isCustomerMode" icon="mdi-arrow-left" @click="step = 3; isSubmitted = false;"></v-btn>
              <v-toolbar-title>{{ pageTitle }}</v-toolbar-title>
              <v-spacer></v-spacer>
              <v-btn v-if="!isCustomerMode" @click="qrDialog = true" icon="mdi-qrcode" title="產生客戶填寫QR Code"></v-btn>
            </v-toolbar>

            <v-card-text v-if="isLoading" class="text-center pa-10">
              <v-progress-circular indeterminate color="primary" size="64"></v-progress-circular>
            </v-card-text>
            
            <v-card-text v-else-if="isSubmitted" class="text-center pa-10">
              <v-icon size="80" color="success">mdi-check-circle-outline</v-icon>
              <h2 class="text-h5 mt-4">資料已送出</h2>
              <p class="text-body-1 mt-2">客戶資料已成功{{ currentDocId ? '更新' : '建立' }}！</p>
              <v-btn color="primary" @click="handleSubmitSuccessAction" class="mt-6">
                {{ isCustomerMode ? '關閉視窗' : '返回客戶列表' }}
              </v-btn>
            </v-card-text>

            <v-card-text v-else class="pa-6">
              <v-alert
                v-if="errorMessage"
                type="error"
                variant="tonal"
                border="start"
                class="mb-6"
                prominent
              >
                {{ errorMessage }}
              </v-alert>

              <v-form ref="formRef" @submit.prevent="handleSubmit">
                <p v-if="!isCustomerMode" class="text-h6 mb-4">銷售資訊</p>
                
                <v-select
                  v-if="!isCustomerMode"
                  v-model="formData['銷售人員']"
                  :items="salespersonOptions"
                  item-title="name"
                  item-value="name"
                  label="銷售人員"
                  variant="filled"
                  :readonly="!isCounter"
                  :rules="[rules.required]"
                  class="mb-2"
                ></v-select>

                <p class="text-h6 mt-6 mb-4">基本資料</p>
                
                <v-text-field
                  v-model="formData['姓名']"
                  label="姓名"
                  variant="outlined"
                  :rules="[rules.required]"
                  class="mb-2"
                ></v-text-field>

                <v-text-field
                  v-model="formData['電話']"
                  label="電話"
                  variant="outlined"
                  :rules="[rules.required, rules.phone]"
                  class="mb-2"
                ></v-text-field>
                
                <dynamic-form-field
                  v-if="systemSettings.fields.age" 
                  :field-config="systemSettings.fields.age"
                  v-model="formData[systemSettings.fields.age.label]"
                ></dynamic-form-field>
     
                <v-row dense>
                  <v-col cols="6">
                    <v-select
                      v-model="selectedCity"
                      :items="cityOptions"
                      label="現居地址"
                      variant="outlined"
                    ></v-select>
                  </v-col>
                  <v-col cols="6">
                    <v-select
                      v-model="formData['居住鄉鎮市區']"
                      :items="districtOptions"
                      label="鄉鎮市區"
                      variant="outlined"
                      :disabled="!selectedCity"
                    ></v-select>
                  </v-col>
                </v-row>
                <v-text-field
                  v-model="formData['居住詳細地址']"
                  label="詳細地址"
                  variant="outlined"
                  class="mb-2"
                ></v-text-field>

                <dynamic-form-field
                  v-if="systemSettings.fields.occupation"
                  :field-config="systemSettings.fields.occupation"
                  v-model="formData[systemSettings.fields.occupation.label]"
                ></dynamic-form-field>

                <v-divider class="my-6"></v-divider>
                <p class="text-h6 mb-4">需求資訊</p>

                <template v-for="field in formFields" :key="field.key">
                  <dynamic-form-field
                    :field-config="field"
                    v-model="formData[field.label]"
                  ></dynamic-form-field>
                </template>
                
                <v-btn
                  type="submit"
                  color="#005AB6" 
                  block
                  size="large"
                  class="mt-6"
                  :loading="isSubmitting"
                >
                  送出資料
                </v-btn>

              </v-form>
            </v-card-text>
          </v-card>
        </div>
        
        <v-dialog v-model="qrDialog" max-width="400">
          <v-card>
            <v-card-title>請客戶掃描 QR Code</v-card-title>
            <v-card-text class="text-center">
              <p>客戶掃描後即可在自己的手機上繼續填寫此份資料。</p>
              <QrCode v-if="currentUrl" :value="currentUrl" :size="300" class="my-4"></QrCode>
              <p class="text-caption">{{ currentUrl }}</p>
            </v-card-text>
            <v-card-actions>
              <v-spacer></v-spacer>

              <v-btn
                :color="copySuccess ? 'success' : 'primary'"
                variant="text"
                @click="copyUrlToClipboard"
                :prepend-icon="copySuccess ? 'mdi-check' : 'mdi-content-copy'"
              >
                {{ copySuccess ? '已複製' : '複製網址' }}
              </v-btn>
              <v-btn color="grey-darken-1" variant="text" @click="qrDialog = false">關閉</v-btn>
            </v-card-actions>
          </v-card>
        </v-dialog>

      </v-col>
    </v-row>
  </v-container>
</template>

<script setup>
import { ref, computed, onMounted, watch, h, nextTick } from 'vue'; 
import { useRoute, useRouter } from 'vue-router'; 
import {
  verifySalesPerson,
  fetchVipGuests,
  fetchCustomerSheetSettings, 
  submitCustomerSheet,
  fetchUserManagementInitialData, 
  fetchSingleVipGuest 
} from '@/api';
import QrCode from 'qrcode.vue';
import twCitiesData from '@/assets/TwCities.json'; 
import { VCombobox, VSelect } from 'vuetify/components'; 

const props = defineProps({
  projectId: {
    type: String,
    default: null
  },
  docId: {
    type: String,
    default: null
  }
});

const router = useRouter();
const route = useRoute();

// --- 動態表單元件 (保持不變) ---
const DynamicFormField = {
  props: ['fieldConfig', 'modelValue'],
  emits: ['update:modelValue'],
  setup(props, { emit }) {
    const value = computed({
      get: () => props.modelValue,
      set: (val) => emit('update:modelValue', val)
    });

    if (!props.fieldConfig || !props.fieldConfig.options || props.fieldConfig.options.length === 0) {
      return () => null; 
    }

    const rules = {
      required: (v) => !!v || '此欄位為必填',
      requiredArray: (v) => (Array.isArray(v) && v.length > 0) || '此欄位為必填',
    };
    const fieldRules = props.fieldConfig.isRequired 
      ? (props.fieldConfig.selectionMode === 'multiple' ? [rules.requiredArray] : [rules.required]) 
      : [];

    return () => {
      const commonProps = {
        modelValue: value.value, 
        'onUpdate:modelValue': (val) => value.value = val, 
        label: props.fieldConfig.label,
        items: props.fieldConfig.options,
        variant: 'outlined',
        rules: fieldRules,
        class: 'mb-2'
      };

      if (props.fieldConfig.selectionMode === 'single') {
        if (props.fieldConfig.allowCustom) {
          const comboboxProps = {
            ...commonProps,
            hint: '選擇或輸入',
            persistentHint: true
          };
          return h(VCombobox, comboboxProps);
        } else {
          return h(VSelect, commonProps);
        }
      }
      
      if (props.fieldConfig.selectionMode === 'multiple') {
        const multiProps = {
          ...commonProps,
          multiple: true,
          chips: true,
          closableChips: true
        };
        
        if (props.fieldConfig.allowCustom) {
          const comboboxMultiProps = {
            ...multiProps,
            hint: '選擇或輸入 (可多選)',
            persistentHint: true
          };
          return h(VCombobox, comboboxMultiProps);
        } else {
          return h(VSelect, multiProps);
        }
      }
      return null;
    }
  }
};
// --- END 動態表單元件 ---


// --- State (保持不變) ---
const step = ref(1);
const isLoading = ref(false);
const isSubmitting = ref(false);
const isSubmitted = ref(false);
const errorMessage = ref(null);
const step1Error = ref(null);
const isCustomerMode = ref(false);
const salesPhone = ref('');
const salesPassword = ref('');
const passwordField = ref(null);
const salesPerson = ref({ name: '', phone: null, roles: [], projects: [], isCounter: false });
const isCounter = ref(false);
const selectedProjectId = ref(null);
const vipGuests = ref([]);
const guestSearch = ref('');
const selectedGuestId = ref(null);
const formRef = ref(null);
const currentDocId = ref(null); 
const projectName = ref('');
const coverImageUrl = ref(null);
const showCoverImage = ref(false);
const systemSettings = ref({ fields: {} }); 
const formFields = ref([]); 
const formData = ref({});
const qrDialog = ref(false);

const copySuccess = ref(false);

async function copyUrlToClipboard() {
  if (!currentUrl.value) return;
  try {
    await navigator.clipboard.writeText(currentUrl.value);
    copySuccess.value = true;
    setTimeout(() => {
      copySuccess.value = false;
    }, 2000); // 2秒後恢復
  } catch (err) {
    console.error('複製網址失敗:', err);
    alert('複製失敗，請手動複製。');
  }
}

watch(qrDialog, (newVal) => {
  if (!newVal) {
    copySuccess.value = false;
  }
});

const cityOptions = ref(twCitiesData.map(c => c.name));
const selectedCity = ref(null);
const districtOptions = ref([]);
const allManageableUsers = ref([]);
const allUserPermissionsMap = ref({});

// --- Computed ---
const pageTitle = computed(() => `${projectName.value} 客戶資料表`);

// ✓ START: 修正 currentUrl
const currentUrl = computed(() => {
  if (!selectedProjectId.value) return ''; 

  const path = router.resolve({
    name: 'CustomerDataSheetForm', 
    params: {
      projectId: selectedProjectId.value, 
      docId: currentDocId.value || undefined 
    },
    query: {
      // ✓ 1. 將登入的銷售人員電話(salesPhone) 作為 'sp' 參數加入
      sp: salesPhone.value || undefined, 
      // ✓ 2. 將登入的銷售人員姓名(salesPerson.name) 作為 'sn' 參數加入
      sn: salesPerson.value.name || undefined
    }
  }).href;
  
  return `${window.location.origin}${path}`;
});
// ✓ END: 修正

const filteredVipGuests = computed(() => {
  if (!guestSearch.value) {
    return vipGuests.value;
  }
  const lowerSearch = guestSearch.value.toLowerCase();
  return vipGuests.value.filter(guest => 
    guest.name.toLowerCase().includes(lowerSearch) ||
    guest.phone.includes(lowerSearch)
  );
});

const salespersonOptions = computed(() => {
  if (!isCounter.value) {
    return [salesPerson.value]; 
  }
  const options = [salesPerson.value];
  const filteredSalesStaff = allManageableUsers.value.filter(user => {
    if (user.phone === salesPhone.value) return false;
    const perms = allUserPermissionsMap.value[user.phone];
    if (!perms) return false;
    const projectPerms = perms[selectedProjectId.value];
    if (!projectPerms || !projectPerms.systems) return false;
    return projectPerms.systems.includes('客資系統-銷售');
  });
  return [...options, ...filteredSalesStaff];
});

// --- Validation Rules (保持不變) ---
const rules = {
  required: (v) => !!v || '此欄位為必填',
  requiredArray: (v) => (Array.isArray(v) && v.length > 0) || '此欄位為必填',
  phone: (v) => (v && v.length === 10 && v.startsWith('09')) || '請輸入有效的 10 碼手機號碼',
};

// --- Watchers (保持不變) ---
watch(selectedCity, (newCity) => {
  formData.value['居住鄉鎮市區'] = null;
  if (newCity) {
    const cityData = twCitiesData.find(c => c.name === newCity);
    districtOptions.value = cityData ? cityData.districts.map(d => d.name) : [];
  } else {
    districtOptions.value = [];
  }
});

// --- Methods ---

// (focusPassword 保持不變)
async function focusPassword() {
  await nextTick();
  passwordField.value?.focus();
}

// (handleVerifySales 保持不變)
async function handleVerifySales() {
  step1Error.value = null;
  if (rules.phone(salesPhone.value) !== true) {
    step1Error.value = "請輸入有效的 10 碼手機號碼";
    return;
  }
  if (rules.required(salesPassword.value) !== true) {
    step1Error.value = "請輸入密碼";
    return;
  }

  isLoading.value = true;
  try {
    const result = await verifySalesPerson(salesPhone.value, salesPassword.value);
    salesPerson.value = result; 
    
    if (result.projects.length === 0) {
      step1Error.value = "您沒有操作任何建案的客資系統權限。";
    } else {
      isCounter.value = result.isCounter; 
      step.value = 2;
    }
  } catch (error) {
    console.error("驗證銷售人員失敗:", error);
    step1Error.value = error.message; 
  } finally {
    isLoading.value = false;
  }
}

// (handleProjectSelected 保持不變)
async function handleProjectSelected(isUrlEntry = false) {
  isLoading.value = true;
  try {
    const [guests, settings] = await Promise.all([
      fetchVipGuests(selectedProjectId.value),
      fetchCustomerSheetSettings(selectedProjectId.value) 
    ]);
    
    vipGuests.value = guests; 
    
    if (settings.status === 'success') {
      projectName.value = settings.projectName;
      showCoverImage.value = settings.vipFormConfig?.coverImage?.show || false;
      coverImageUrl.value = settings.vipFormConfig?.coverImage?.url || null;
      systemSettings.value = { fields: settings.customerFieldSettings || {} }; 
      formFields.value = processFormFields(settings.vipFormFields); 
    } else {
      throw new Error(settings.message);
    }
    
    if (!isUrlEntry) {
      step.value = 3;
    }
  } catch (error) {
    console.error("載入建案資料失敗:", error);
    errorMessage.value = error.message; 
  } finally {
    isLoading.value = false;
  }
}

// (processFormFields 保持不變)
function processFormFields(dynamicFields = {}) {
  const processedFields = [];
  const sortedKeys = Object.keys(dynamicFields).sort((a, b) => {
    return (dynamicFields[a].order || 99) - (dynamicFields[b].order || 99);
  });

  for (const key of sortedKeys) {
    const field = dynamicFields[key];
    if (field.options && field.options.length > 0) {
      processedFields.push({ key: key, ...field });
    }
  }
  return processedFields;
}

// (handleGuestSelected 保持不變)
function handleGuestSelected(guestId) {
  selectedGuestId.value = guestId;
  currentDocId.value = guestId; 
  loadForm(); 
  step.value = 4;
}

// (handleNewCustomer 保持不變)
function handleNewCustomer() {
  selectedGuestId.value = null;
  currentDocId.value = null; 
  loadForm(); 
  step.value = 4;
}

// ✓ START: 修正 loadForm
async function loadForm(isUrlEntry = false, salesPhoneFromUrl = null, salesNameFromUrl = null) {
  isLoading.value = true;
  errorMessage.value = null;
  isSubmitted.value = false;
  
  allManageableUsers.value = [];
  allUserPermissionsMap.value = {};

  try {
    // ✓ 3. 直接使用 URL 傳入的參數
    let initialFormData = {
      '姓名': '',
      '電話': '',
      '銷售人員': isUrlEntry ? salesNameFromUrl : salesPerson.value.name, 
      '銷售人員電話': isUrlEntry ? salesPhoneFromUrl : salesPerson.value.phone,
      '居住鄉鎮市區': null,
      '居住詳細地址': '',
    };
    
    // (初始化 systemSettings 欄位 - 保持不變)
    if (systemSettings.value.fields.age) {
      const field = systemSettings.value.fields.age;
      initialFormData[field.label] = field.selectionMode === 'multiple' ? [] : null;
    }
    if (systemSettings.value.fields.occupation) {
      const field = systemSettings.value.fields.occupation;
      initialFormData[field.label] = field.selectionMode === 'multiple' ? [] : null;
    }

    // (初始化 vipFormFields 欄位 - 保持不變)
    formFields.value.forEach(field => {
      initialFormData[field.label] = field.selectionMode === 'multiple' ? [] : null;
    });

    // (載入既有資料 - 保持不變)
    if (currentDocId.value) {
      const result = await fetchSingleVipGuest(currentDocId.value);
      if (result.status === 'success') {
        const existingData = result.data;
        initialFormData = { 
          ...initialFormData, 
          ...existingData,
          '銷售人員': initialFormData['銷售人員'], 
          '銷售人員電話': initialFormData['銷售人員電話'] 
        };
        
        if (existingData['居住鄉鎮市區']) {
          const city = twCitiesData.find(c => 
            c.districts.some(d => d.name === existingData['居住鄉鎮市區'])
          );
          if (city) {
            selectedCity.value = city.name;
            const cityData = twCitiesData.find(c => c.name === city.name);
            districtOptions.value = cityData ? cityData.districts.map(d => d.name) : [];
          }
        }
      } else {
        throw new Error(result.message);
      }
    }
    
    formData.value = initialFormData;
    
    // (載入銷售人員列表 - 保持不變)
    if (!isUrlEntry) {
      if (isCounter.value) {
        const result = await fetchUserManagementInitialData(salesPhone.value);
        
        if (result.status === 'success' && result.data) {
          allManageableUsers.value = result.data.manageableUsers || [];
          allUserPermissionsMap.value = result.data.allUserPermissionsMap || {};
        }
      }
    }

  } catch (error) {
    console.error("載入表單失敗:", error);
    errorMessage.value = `載入表單資料失敗: ${error.message}`;
  } finally {
    isLoading.value = false;
  }
}
// ✓ END: 修正

// ✓ START: 修正 handleSubmit
async function handleSubmit() {
  errorMessage.value = null;
  const { valid } = await formRef.value.validate();

  if (!valid) {
    return;
  }

  isSubmitting.value = true;
  
  try {
    // ✓ 修正：確保銷售人員電話在提交時被正確設定
    if (isCounter.value && !isCustomerMode.value) {
      // (櫃台操作) 根據選中的姓名反查電話
      const selectedSalesName = formData.value['銷售人員'];
      const selectedSalesPersonObject = salespersonOptions.value.find(p => p.name === selectedSalesName);
      formData.value['銷售人員電話'] = selectedSalesPersonObject ? selectedSalesPersonObject.phone : null;
    }
    // (如果是客戶模式，loadForm 時已從 URL 帶入電話)
    // (如果是一般銷售，loadForm 時已帶入自己的電話)

    const result = await submitCustomerSheet(
      selectedProjectId.value, 
      formData.value, 
      currentDocId.value 
    );
    
    if (result.status !== 'success') {
      throw new Error(result.message);
    }
    
    const updatedData = {
      id: result.docId, 
      name: formData.value['姓名'], 
      phone: formData.value['電話']
    };

    if (!currentDocId.value) { 
      vipGuests.value.unshift(updatedData);
    } else { 
      const index = vipGuests.value.findIndex(g => g.id === currentDocId.value);
      if (index > -1) {
        vipGuests.value[index].name = updatedData.name;
        vipGuests.value[index].phone = updatedData.phone;
      }
    }

    isSubmitted.value = true; 

  } catch (error) {
    console.error("提交客戶資料表失敗:", error);
    errorMessage.value = `提交失敗: ${error.message}`;
  } finally {
    isSubmitting.value = false;
  }
}
// ✓ END: 修正

// (handleSubmitSuccessAction 保持不變)
function handleSubmitSuccessAction() {
  if (isCustomerMode.value) {
    window.close(); 
  } else {
    step.value = 3;
    isSubmitted.value = false;
  }
}

// (formatGuestDate 保持不變)
function formatGuestDate(dateObj) { 
  if (!dateObj || typeof dateObj.toLocaleDateString !== 'function') {
    return '未知日期';
  }
  try {
    if (isNaN(dateObj.getTime())) return '無效日期'; 
    return dateObj.toLocaleDateString('zh-TW', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  } catch (e) {
    console.warn("Error formatting guest date:", e);
    return '日期格式錯誤';
  }
}

// ✓ START: 修正 onMounted
onMounted(() => {
  if (props.projectId) {
    // 這是客戶/QR Code 流程
    isCustomerMode.value = true; 
    step.value = 4;
    selectedProjectId.value = props.projectId;
    currentDocId.value = props.docId; 
    
    // ✓ 4. 從路由 query 讀取銷售人員電話 (sp) 和姓名 (sn)
    const salesPhoneFromUrl = route.query.sp;
    const salesNameFromUrl = route.query.sn;
    
    handleProjectSelected(true); 
    loadForm(true, salesPhoneFromUrl, salesNameFromUrl); // ✓ 5. 將電話和姓名傳入 loadForm
  } else {
    // 這是銷售人員的正常登入流程
    isCustomerMode.value = false; 
    step.value = 1;
  }
});
// ✓ END: 修正

</script>