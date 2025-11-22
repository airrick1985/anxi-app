<template>
  <v-container style="background-color: #F5F5F7">
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
                  autocomplete="new-password" ></v-text-field>

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
                  autocomplete="off" ></v-text-field>

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
                      <div class="d-flex align-center">
                        
                        <v-tooltip v-if="guest.submissionsCount > 1" location="top">
                          
                          <template v-slot:activator="{ props }">
                            <div v-bind="props" class="d-flex align-center text-warning">
                              <v-icon 
                                color="warning" 
                                size="small" 
                                class="mr-1"
                              >
                                mdi-alert-circle-outline
                              </v-icon>
                              <span class="text-caption">
                                ({{ guest.latestSalesName || '未知' }})
                              </span>
                            </div>
                          </template>
                          
                          <span>
                            此客戶電話重複
                            <br>
                            最後銷售：{{ guest.latestSalesName || '未知' }}
                          </span>
                        </v-tooltip>
                        
                        <div 
                          class="text-caption text-grey" 
                          :class="{ 'ml-2': guest.submissionsCount > 1 }"
                        >
                          {{ formatGuestDate(guest.createdAt) }}
                        </div>
                      </div>
                    </template>
                    </v-list-item>
                  <v-list-item v-if="filteredVipGuests.length === 0">
                    <v-list-item-title class="text-center text-grey">今日無新增貴賓資料，請使用搜尋過往資料</v-list-item-title>
                  </v-list-item>
                 </v-list>

                  <v-card-text>
                 <p class="mb-4">若查無貴賓資料，請使用「新增客戶資料」</p> <v-btn
                    color="#005AB6"
                    class="mb-6"
                    block
                    size="large"
                    
                    @click="confirmNewCustomerDialog = true" prepend-icon="mdi-account-plus-outline"
                 >
                    新增客戶資料 </v-btn>

                 
              </v-card-text>
               <v-card-actions>
                <v-btn @click="step = 2">上一步</v-btn>
              </v-card-actions>
            </v-card>
          </v-window-item>
        </v-window>

<v-dialog v-model="confirmNewCustomerDialog" max-width="400" persistent>
          <v-card>
            <v-card-title>確認</v-card-title>
            <v-card-text>
              是否新增客戶資料？
            </v-card-text>
            <v-card-actions>
              <v-spacer></v-spacer>
              <v-btn color="grey-darken-1" variant="text" @click="confirmNewCustomerDialog = false">
                取消
              </v-btn>
              <v-btn color="primary" variant="text" @click="executeNewCustomer">
                確認
              </v-btn>
            </v-card-actions>
          </v-card>
        </v-dialog>


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
                clearable
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
                clearable
                  v-model="formData['姓名']"
                  label="姓名"
                  variant="outlined"
                  :rules="[rules.required]"
                  class="mb-2"
                autocomplete="off" ></v-text-field>

                <v-text-field
                clearable
                  v-model="formData['電話']"
                  label="電話"
                  variant="outlined"
                  :rules="[rules.required, rules.phone]"
                  class="mb-2"
                autocomplete="off" ></v-text-field>

                <v-text-field
                  v-if="!isCustomerMode"
                  v-model="formData['拜訪日期']"
                  label="拜訪日期"
                  type="date"
                  variant="outlined"
                  :max="todayInTaiwan"
                  :rules="[rules.required, rules.maxDate]"
                  class="mb-2"
                autocomplete="off" ></v-text-field>
                
                <dynamic-form-field
                  clearable
                  v-if="systemSettings.fields.age" 
                  :field-config="systemSettings.fields.age"
                  v-model="formData[systemSettings.fields.age.label]"
                </dynamic-form-field>
     
                <v-row dense>
                <v-col cols="6">
                    <v-select
                      clearable
                      v-model="formData['居住城市']" 
                      
                      :items="cityOptions"
                      label="現居地址"
                      variant="outlined"
                    ></v-select>
                  </v-col>
                  <v-col cols="6">
                    <v-select
                    clearable
                      v-model="formData['居住鄉鎮市區']"
                      :items="districtOptions"
                      label="鄉鎮市區"
                      variant="outlined"
                      
                      :disabled="!formData['居住城市']"
                      
                    ></v-select>
                  </v-col>
                </v-row>
                <v-text-field
                clearable
                  v-model="formData['居住詳細地址']"
                  label="地址或街道"
                  variant="outlined"
                  class="mb-2"
                autocomplete="off" ></v-text-field>

                <dynamic-form-field
                   clearable
                  v-if="systemSettings.fields.occupation"
                  :field-config="systemSettings.fields.occupation"
                  v-model="formData[systemSettings.fields.occupation.label]"               
                  hint="可選擇其他輸入您的職業"   
                  ></dynamic-form-field>

                  <v-text-field
                  clearable
                  v-model="formData['任職公司']"
                  label="任職公司"
                  variant="outlined"
                  class="mb-2"
                  autocomplete="off"
                ></v-text-field>

                <v-divider class="my-6"></v-divider>
                <p class="text-h6 mb-4">需求資訊</p>

                <template v-for="field in formFields" :key="field.key">
                  <dynamic-form-field
                    clearable
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
            <v-card-title>客戶資料表 QR Code</v-card-title>
            <v-card-text class="text-center">
              <p>請填寫客戶資料表。</p>
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
import { ref, computed, onMounted, watch, h, nextTick, Fragment } from 'vue'; 
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
import { VCombobox, VSelect, VTextField } from 'vuetify/components'; 

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

// --- ✓ START: 動態表單元件 (已修正 BUG 1 & 2) ---
const DynamicFormField = {
  props: ['fieldConfig', 'modelValue', 'hint'],
  emits: ['update:modelValue'],
  setup(props, { emit }) {
    
    // 內部狀態
    const internalSelectValue = ref(props.fieldConfig.selectionMode === 'multiple' ? [] : null);
    const customValue = ref('');
    // ✓ 檢查：使用 .value 確保響應性
    const options = computed(() => props.fieldConfig.options || []);

    // VSelect 的選項
    const computedOptions = computed(() => {
      // ✓ 檢查：使用 .value
      const optionsList = options.value || []; 
      if (props.fieldConfig.allowCustom) {
        return [...optionsList, '其他'];
      }
      return optionsList;
    });

    // 是否顯示 "其他" 輸入框
    const showCustomField = computed(() => {
      if (!props.fieldConfig.allowCustom) return false;
      if (props.fieldConfig.selectionMode === 'multiple') {
        return Array.isArray(internalSelectValue.value) && internalSelectValue.value.includes('其他');
      } else {
        return internalSelectValue.value === '其他';
      }
    });

    // 監聽來自父層的 v-model 變更 (例如載入資料)
    // ✓ 檢查：此 watch 僅更新內部 state，不 emit，避免循環
    watch(() => props.modelValue, (newModelValue) => {
      // ✓ 檢查：使用 .value
      const currentOptions = options.value || []; 
      
      if (!props.fieldConfig.allowCustom) {
        internalSelectValue.value = newModelValue;
        return;
      }

      if (props.fieldConfig.selectionMode === 'multiple') {
        const modelArray = Array.isArray(newModelValue) ? newModelValue : [];
        const predefined = modelArray.filter(v => currentOptions.includes(v));
        // ✓ 檢查：修復 BUG 2 - 允許空字串作為自訂值
        const custom = modelArray.filter(v => v !== null && v !== undefined && !currentOptions.includes(v));
        
        const newSelectValue = [...predefined];
        let newCustomValue = '';
        if (custom.length > 0) {
          newSelectValue.push('其他');
          // ✓ 檢查：修復 BUG 2 - 即使 custom[0] 是 '' (空字串)，也應被設定
          newCustomValue = custom[0];
        }
        
        // 只有在內部狀態與計算結果不同時才更新，避免循環
        if (JSON.stringify(internalSelectValue.value) !== JSON.stringify(newSelectValue)) {
            internalSelectValue.value = newSelectValue;
        }
        if (customValue.value !== newCustomValue) {
            customValue.value = newCustomValue;
        }
        
      } else { // Single selection
        if (newModelValue && !currentOptions.includes(newModelValue)) {
          internalSelectValue.value = '其他';
          customValue.value = newModelValue;
        } else {
          // ✓ 檢查：修復 BUG 1 
          // 當 newModelValue 為 null (清空輸入框觸發) 且 VSelect 仍在 "其他" 時
          if (newModelValue === null && internalSelectValue.value === '其他') {
            // 保持 VSelect 在 "其他" 狀態，只清空 customValue
            customValue.value = '';
          } else {
            // 否則，正常同步
            internalSelectValue.value = newModelValue;
            customValue.value = '';
          }
        }
      }
    }, { immediate: true });

    // 組合最終值並 emit 給父層
    const emitUpdate = () => {
      if (!props.fieldConfig.allowCustom) {
         emit('update:modelValue', internalSelectValue.value);
         return;
      }
      
      if (props.fieldConfig.selectionMode === 'multiple') {
        const selectArray = Array.isArray(internalSelectValue.value) ? internalSelectValue.value : [];
        const baseValues = selectArray.filter(v => v !== '其他');
        const custom = customValue.value || '';
        
        // ✓ 檢查：修復 BUG 2
        if (showCustomField.value) {
            // 如果 "其他" 被選中，則發送 [選項..., 自訂值]
            // 即使自訂值是 '' (空字串)，也要發送 [''] 或 ['選項A', '']
            emit('update:modelValue', [...baseValues, custom]);
        } else {
            // "其他" 未被選中，只發送 baseValues
            emit('update:modelValue', baseValues);
        }

      } else { // Single selection
        if (internalSelectValue.value === '其他') {
          emit('update:modelValue', customValue.value || null);
        } else {
          emit('update:modelValue', internalSelectValue.value);
        }
      }
    };
    
    // ✓ 檢查：新增兩個 watch 來監聽內部狀態變化並觸發 emit
    // 監聽 VSelect 的變化
    watch(internalSelectValue, (newSelectVal, oldSelectVal) => {
        // 如果 "其他" 被取消選取，則清空自訂值
        if (props.fieldConfig.selectionMode === 'multiple') {
            if (Array.isArray(oldSelectVal) && oldSelectVal.includes('其他') && (!Array.isArray(newSelectVal) || !newSelectVal.includes('其他'))) {
                customValue.value = '';
            }
        } else { // Single
            if (oldSelectVal === '其他' && newSelectVal !== '其他') {
                customValue.value = '';
            }
        }
        emitUpdate(); // VSelect 變更時，觸發 emit
    });
    
    // 監聽 VTextField (customValue) 的變化
    watch(customValue, () => {
        // 只有在 "其他" 模式啟用時，VTextField 的變更才需要觸發 emit
        if (showCustomField.value) {
            emitUpdate();
        }
    });
    
    // --- Render Function (使用事件處理器) ---
    // ✓ 檢查：允許 options 為空陣列
    if (!props.fieldConfig || !props.fieldConfig.options) { 
      return () => null; 
    }

    const rules = {
      required: (v) => !!v || '此欄位為必填',
      requiredArray: (v) => (Array.isArray(v) && v.length > 0) || '此欄位為必填',
    };
    
    const isRequired = props.fieldConfig.isRequired;
    const isMultiple = props.fieldConfig.selectionMode === 'multiple';
    
    // 驗證規則
    const fieldRules = computed(() => {
        if (!isRequired) return [];
        
        if (isMultiple) {
            const selectedCount = Array.isArray(internalSelectValue.value) ? internalSelectValue.value.filter(v => v !== '其他').length : 0;
            if (showCustomField.value) {
                return (selectedCount > 0 || !!customValue.value) ? true : '此欄位為必填';
            }
            return (selectedCount > 0) ? true : '此欄位為必填';
        } else {
            if (showCustomField.value) {
                return !!customValue.value ? true : '此欄位為必填';
            }
            return !!internalSelectValue.value ? true : '此欄位為必填';
        }
    });

    return () => {
      const commonProps = {
        label: props.fieldConfig.label,
        items: computedOptions.value, 
        variant: 'outlined',
        rules: isRequired ? [fieldRules.value] : [],
        class: 'mb-2',
        autocomplete: 'off',
        hint: props.hint || '',
        persistentHint: !!props.hint
      };

      // "其他" 輸入框
      const vTextField = h(VTextField, { 
        modelValue: customValue.value,
        // ✓ 檢查：onUpdate:modelValue 只更新內部 state，不 emit
        'onUpdate:modelValue': (val) => {
          customValue.value = val;
        },
        label: '請輸入其他項目',
        variant: 'outlined',
        class: 'mb-2 mt-n1',
        autocomplete: 'off',
        rules: (isRequired && showCustomField.value) ? [rules.required] : [], 
      });

      // 單選模式
      if (props.fieldConfig.selectionMode === 'single') {
        const vSelectProps = {
          ...commonProps,
          modelValue: internalSelectValue.value,
          // ✓ 檢查：onUpdate:modelValue 只更新內部 state，不 emit
          'onUpdate:modelValue': (val) => {
            internalSelectValue.value = val;
          },
        };
        
        if (props.fieldConfig.allowCustom) {
          return h(Fragment, [
            h(VSelect, vSelectProps),
            showCustomField.value ? vTextField : null,
          ]);
        } else {
          return h(VSelect, vSelectProps);
        }
      }
      
      // 多選模式
      if (props.fieldConfig.selectionMode === 'multiple') {
        const multiProps = {
          ...commonProps,
          modelValue: internalSelectValue.value,
          // ✓ 檢查：onUpdate:modelValue 只更新內部 state，不 emit
          'onUpdate:modelValue': (val) => {
            internalSelectValue.value = val;
          },
          multiple: true,
          chips: true,
          closableChips: true
        };
        
        if (props.fieldConfig.allowCustom) {
           return h(Fragment, [
             h(VSelect, multiProps),
             showCustomField.value ? vTextField : null,
           ]);
        } else {
          return h(VSelect, multiProps);
        }
      }
      return null;
    }
  }
};
// --- ✓ END: 動態表單元件 (已修正) ---


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

const confirmNewCustomerDialog = ref(false); 

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

const districtOptions = ref([]);
const allManageableUsers = ref([]);
const allUserPermissionsMap = ref({});

// --- Computed ---
const pageTitle = computed(() => `${projectName.value} 客戶資料表`);

// ✓ 檢查：新增 computed 屬性 (用於 :max)
const getTodayInTaiwan = () => {
  // 'sv-SE' 語系格式為 YYYY-MM-DD
  return new Date().toLocaleDateString('sv-SE', { timeZone: 'Asia/Taipei' });
};
const todayInTaiwan = computed(() => getTodayInTaiwan());
// ✓ 檢查：新增結束

// ✓ START: 修正 currentUrl
const currentUrl = computed(() => {
  if (!selectedProjectId.value) return ''; 

  // 1. 從 formData 獲取當前在下拉選單中選定的「銷售人員名稱」
  const selectedSalesName = formData.value['銷售人員'];
  
  // 2. 使用此名稱去 salespersonOptions 陣列中反查完整的銷售人員物件
  //    (salespersonOptions 是您用於 v-select 的 computed 屬性)
  const selectedSalesPersonObject = salespersonOptions.value.find(p => p.name === selectedSalesName);

  // 3. 從該物件中獲取電話號碼
  const selectedSalesPhone = selectedSalesPersonObject ? selectedSalesPersonObject.phone : undefined;

  const path = router.resolve({
    name: 'CustomerDataSheetForm', 
    params: {
      projectId: selectedProjectId.value, 
      docId: currentDocId.value || undefined 
    },
    query: {
      // 4. 將 sp 和 sn 參數改用上面找到的變數
      sp: selectedSalesPhone, 
      sn: selectedSalesName || undefined
    }
  }).href;
  
  return `${window.location.origin}${path}`;
});
// ✓ END: 修正

const filteredVipGuests = computed(() => {
  const lowerSearch = guestSearch.value ? guestSearch.value.trim().toLowerCase() : null;

  // 1. 如果使用者正在搜尋 (有輸入關鍵字)
  if (lowerSearch) {
    return vipGuests.value.filter(guest => 
      guest.name.toLowerCase().includes(lowerSearch) ||
      guest.phone.includes(lowerSearch)
    );
  }

  // 2. 如果使用者沒有搜尋 (預設情況)
  // 則只顯示 createdAt 是今天的客戶
  const todayStr = getTodayInTaiwan();
  
  return vipGuests.value.filter(guest => {
    // 確保 guest.createdAt 是一個有效的 Date 物件
    if (!guest.createdAt || typeof guest.createdAt.toLocaleDateString !== 'function') {
      return false;
    }
    
    // 將客戶的建立日期 (Date 物件) 轉換為台灣時區的 YYYY-MM-DD 字串
    const guestDateStr = guest.createdAt.toLocaleDateString('sv-SE', { timeZone: 'Asia/Taipei' });
    
    // 比較日期字串是否相符
    return guestDateStr === todayStr;
  });
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
  
  // ✓ 檢查：新增 maxDate 規則
  maxDate: (v) => {
    if (!v) return true; // 'required' 規則會處理空值
    const today = getTodayInTaiwan();
    // 比較 YYYY-MM-DD 字串
    return v <= today || `日期不可大於今天 (${today})`;
  }
  // ✓ 檢查：新增結束
};

// --- Watchers (保持不變) ---
watch(() => formData.value['居住城市'], (newCity) => {
  // 先取得當前選中的鄉鎮市區
  const currentDistrict = formData.value['居住鄉鎮市區'];
  let newOptions = [];

  // 根據新城市產生新的鄉鎮市區選項
  if (newCity) {
    const cityData = twCitiesData.find(c => c.name === newCity);
    newOptions = cityData ? cityData.districts.map(d => d.name) : [];
  }
  
  // 1. 先更新選項列表
  districtOptions.value = newOptions;

  // 2. 檢查當前的值是否還存在於新選項中
  if (currentDistrict && newOptions.includes(currentDistrict)) {
    // 如果值依然有效 (例如：載入時 "臺北市" -> "信義區")，則不變
  } else {
    // 如果值無效 (例如：從 "臺北市" 改為 "新北市"，"信義區" 不在新選項中)
    // 或者新城市為空，則重設為 null
    formData.value['居住鄉鎮市區'] = null;
  }
});

// --- Methods ---


async function focusPassword() {
  await nextTick();
  passwordField.value?.focus();
}


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
    
    // ✓ 檢查：在這裡注入登入者的電話號碼
    // 這樣 salesPerson.value 物件就會包含 phone
    result.phone = salesPhone.value; 
    
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


function handleGuestSelected(guestId) {
  selectedGuestId.value = guestId;
  currentDocId.value = guestId; 
  loadForm(); 
  step.value = 4;
}


function handleNewCustomer() {
  selectedGuestId.value = null;
  currentDocId.value = null; 
  loadForm(); 
  step.value = 4;
}

function executeNewCustomer() {
  handleNewCustomer(); // 呼叫原本的函式
  confirmNewCustomerDialog.value = false; // 關閉對話框
}


async function loadForm(isUrlEntry = false, salesPhoneFromUrl = null, salesNameFromUrl = null) {
  isLoading.value = true;
  errorMessage.value = null;
  isSubmitted.value = false;
  
  allManageableUsers.value = [];
  allUserPermissionsMap.value = {};

  try {
    let initialFormData = {
      '姓名': '',
      '電話': '',
      
      // ✓ 檢查：銷售人員名稱不變
      '銷售人員': isUrlEntry ? salesNameFromUrl : salesPerson.value.name, 
      
      // ✓ 檢查：銷售人員電話改用 salesPhone.value (登入時的 v-model)
      '銷售人員電話': isUrlEntry ? salesPhoneFromUrl : salesPhone.value, 

      '拜訪日期': getTodayInTaiwan(), // ✓ 檢查：新增欄位並設定預設值
      
      '居住城市': null, 
      '居住鄉鎮市區': null,
      '居住詳細地址': '',
      '任職公司': '',
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
          '拜訪日期': existingData['拜訪日期'] || getTodayInTaiwan(),
          '銷售人員': initialFormData['銷售人員'], 
          '銷售人員電話': initialFormData['銷售人員電話'] 
        };
        
        if (existingData['居住鄉鎮市區']) {
          const city = twCitiesData.find(c => 
            c.districts.some(d => d.name === existingData['居住鄉鎮市區'])
          );
          if (city) {
            
            // initialFormData['居住城市'] = city.name; 
            
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



async function handleSubmit() {
  errorMessage.value = null;
  const { valid } = await formRef.value.validate();

  if (!valid) {
    return;
  }

  isSubmitting.value = true;
  
  try {
    // ✓ 檢查：確保銷售人員電話在提交時被正確設定
    
    // ✓ 檢查：將 (isCounter.value && !isCustomerMode.value) 的判斷
    // ✓      擴大為 (!isCustomerMode.value)
    if (!isCustomerMode.value) { 
      // 只要不是客戶模式 (即為櫃台或一般銷售)
      
      if (isCounter.value) {
        // (櫃台操作) 根據選中的姓名反查電話
        const selectedSalesName = formData.value['銷售人員'];
        const selectedSalesPersonObject = salespersonOptions.value.find(p => p.name === selectedSalesName);
        formData.value['銷售人員電話'] = selectedSalesPersonObject ? selectedSalesPersonObject.phone : null;
      } else {
        // ✓ 檢查：新增 else 區塊
        // (一般銷售操作) 強制將電話設為當前登入者
        formData.value['銷售人員電話'] = salesPerson.value.phone;
      }
    }
    // (如果是客戶模式，loadForm 時已從 URL 帶入電話，此處不需動作)
    

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


function handleSubmitSuccessAction() {
  if (isCustomerMode.value) {
    window.close(); 
  } else {
    step.value = 3;
    isSubmitted.value = false;
  }
}


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

</script>