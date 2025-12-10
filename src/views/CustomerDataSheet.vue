<template>
  <v-container style="background-color: #F5F5F7">
    <v-row justify="center">
      <v-col cols="12" md="10" lg="8">

        <v-stepper 
          v-if="!isCustomerMode" 
          :model-value="step" 
          class="mb-5"
          :alt-labels="isMobile"
          :class="{ 'mobile-stepper': isMobile }"
        >
          <v-stepper-header>
            <v-stepper-item :value="1" title="身份驗證" :complete="step > 1"></v-stepper-item>
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
            <v-card flat class="text-center pa-10">
              <div v-if="isLoading">
                <v-progress-circular indeterminate color="primary" size="64" class="mb-4"></v-progress-circular>
                <div class="text-h6 text-grey-darken-1">正在驗證身份...</div>
                <div class="text-caption text-grey mt-2">請稍候，正在連接 LINE 帳號</div>
              </div>

              <div v-else-if="step1Error">
                <v-icon icon="mdi-alert-circle" size="64" color="error" class="mb-4"></v-icon>
                <h3 class="text-h5 font-weight-bold mb-2">驗證失敗</h3>
                <p class="text-body-1 text-grey-darken-1 mb-6">{{ step1Error }}</p>
                
                <v-btn 
                  v-if="showBindButton"
                  color="success" 
                  block 
                  size="large" 
                  @click="goToBinding"
                  prepend-icon="mdi-link-variant"
                  class="mb-3"
                >
                  前往帳號綁定
                </v-btn>
                
                <v-btn color="primary" variant="outlined" @click="initializeLiff">
                  重試
                </v-btn>
              </div>
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
                <v-spacer></v-spacer>
                <v-btn color="primary" @click="handleProjectSelected()" :disabled="!selectedProjectId" :loading="isLoading">下一步</v-btn>
              </v-card-actions>
            </v-card>
          </v-window-item>

          <v-window-item :value="3">
            <v-card flat>
              <v-card-title class="d-flex justify-space-between align-center">
                <span>選擇客戶</span>
                
                <v-btn-toggle
                  v-model="filterRange"
                  mandatory
                  density="compact"
                  color="primary"
                  variant="outlined"
                  class="ml-4"
                >
                  <v-btn value="today" size="small">今天</v-btn>
                  <v-btn value="week" size="small">7天內</v-btn>
                </v-btn-toggle>
              </v-card-title>
                             
                 <v-text-field
                  v-model="guestSearch"
                  label="搜尋姓名或電話"
                  variant="outlined"
                  density="compact"
                  prepend-inner-icon="mdi-magnify"
                  clearable
                  hide-details
                  class="mb-4 mt-2" 
                  autocomplete="off" ></v-text-field>

                 <v-list lines="one" border rounded style="max-height: 400px; overflow-y: auto;">
                  <v-list-item
                    v-for="guest in filteredVipGuests"
                    :key="guest.id"
                    @click="handleGuestSelected(guest.id)"
                    :subtitle="guest.phone"
                    :disabled="!!guest.latestSalesName && guest.submissionsCount <= 1"
                    :class="{ 'opacity-60 bg-grey-lighten-5': !!guest.latestSalesName && guest.submissionsCount <= 1 }"
                  >
                    <template v-slot:prepend>
                      <v-icon 
                        :color="guest.gender === '男' ? 'blue' : (guest.gender === '女' ? 'pink' : 'indigo')"
                        class="mr-3"
                      >
                        {{ guest.gender === '女' ? 'mdi-face-woman' : (guest.gender === '男' ? 'mdi-face-man' : 'mdi-account-circle-outline') }}
                      </v-icon>
                    </template>

                    <template v-slot:title>
                      <div class="d-flex align-center mb-1">
                        <span class="text-subtitle-1 font-weight-bold">{{ guest.name }}</span>
                        
                        <v-chip
                          v-if="guest.gender"
                          size="x-small"
                          variant="flat"
                          class="ml-2 font-weight-bold"
                          :color="guest.gender === '男' ? 'blue-lighten-5' : (guest.gender === '女' ? 'pink-lighten-5' : 'grey-lighten-4')"
                          :class="guest.gender === '男' ? 'text-blue-darken-2' : (guest.gender === '女' ? 'text-pink-darken-2' : 'text-grey-darken-2')"
                          label
                        >
                          {{ guest.gender === '男' ? '先生' : (guest.gender === '女' ? '女士' : guest.gender) }}
                        </v-chip>
                      </div>
                    </template>

                    <template v-slot:append>
                      <div class="d-flex flex-column align-end justify-center">
                        
                        <div class="mb-1 d-flex align-center">
                          <v-icon 
                            v-if="!!guest.latestSalesName && guest.submissionsCount <= 1"
                            size="small" 
                            color="grey" 
                            class="mr-1"
                          >
                            mdi-lock
                          </v-icon>

                          <v-chip
                            size="x-small"
                            variant="tonal"
                            :color="guest.latestSalesName ? 'primary' : 'grey'"
                            label
                          >
                            <v-icon start size="small">mdi-account-tie</v-icon>
                            {{ guest.latestSalesName || '無銷售人員' }}
                          </v-chip>
                        </div>

                        <div class="d-flex align-center">
                          <v-tooltip v-if="guest.submissionsCount > 1" location="top">
                            <template v-slot:activator="{ props }">
                              <v-icon 
                                v-bind="props" 
                                color="warning" 
                                size="small" 
                                class="mr-1"
                              >
                                mdi-alert-circle-outline
                              </v-icon>
                            </template>
                            <span>
                              此客戶電話重複 (共 {{ guest.submissionsCount }} 筆)<br>
                              最後銷售：{{ guest.latestSalesName || '未知' }}
                            </span>
                          </v-tooltip>
                          
                          <span class="text-caption text-grey">
                            {{ formatGuestDate(guest.lastSubmittedAt) }}
                          </span>
                        </div>

                      </div>
                    </template>
                  </v-list-item>
                  <v-list-item v-if="filteredVipGuests.length === 0">
                    <v-list-item-title class="text-center text-grey">此期間內無新增資料，請使用搜尋</v-list-item-title>
                  </v-list-item>
                 </v-list>

                  <v-card-text class="text-center pt-2 pb-6">
                     <div class="text-caption text-grey mb-2">
                       找不到客戶資料嗎？
                     </div>
                     <v-btn
                        variant="text"
                        color="grey-darken-1"
                        size="small"
                        class="text-decoration-underline"
                        @click="confirmNewCustomerDialog = true" 
                        prepend-icon="mdi-account-plus-outline"
                     >
                        新增客戶資料
                     </v-btn>
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
                      :rules="[rules.required]"
                      :items="cityOptions"
                      label="現居地址"
                      variant="outlined"
                    ></v-select>
                  </v-col>
                  <v-col cols="6">
                    <v-select
                    clearable
                      v-model="formData['居住鄉鎮市區']"
                       :rules="[rules.required]"
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
import { useDisplay } from 'vuetify'; 
import { ref, computed, onMounted, watch, h, nextTick, Fragment } from 'vue'; 
import { useRoute, useRouter } from 'vue-router'; 
import {
  fetchVipGuests,
  fetchCustomerSheetSettings, 
  submitCustomerSheet,
  fetchUserManagementInitialData, 
  fetchSingleVipGuest,
  getLiffUserData // ✅ 引入 LIFF 驗證 API
} from '@/api';
import liff from '@line/liff'; // ✅ 引入 LIFF SDK
import QrCode from 'qrcode.vue';
import twCitiesData from '@/assets/TwCities.json'; 
import { VCombobox, VSelect, VTextField } from 'vuetify/components'; 

// ✅ [打勾] 請在此填入您的 LIFF ID
const LIFF_ID = '2008257338-8AWzYeNQ'; 

const { mobile: isMobile } = useDisplay();

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

// --- DynamicFormField Component ---
const DynamicFormField = {
  props: ['fieldConfig', 'modelValue', 'hint'],
  emits: ['update:modelValue'],
  setup(props, { emit }) {
    const internalSelectValue = ref(props.fieldConfig.selectionMode === 'multiple' ? [] : null);
    const customValue = ref('');
    const options = computed(() => props.fieldConfig.options || []);

    const computedOptions = computed(() => {
      const optionsList = options.value || []; 
      if (props.fieldConfig.allowCustom) {
        return [...optionsList, '其他'];
      }
      return optionsList;
    });

    const showCustomField = computed(() => {
      if (!props.fieldConfig.allowCustom) return false;
      if (props.fieldConfig.selectionMode === 'multiple') {
        return Array.isArray(internalSelectValue.value) && internalSelectValue.value.includes('其他');
      } else {
        return internalSelectValue.value === '其他';
      }
    });

    watch(() => props.modelValue, (newModelValue) => {
      const currentOptions = options.value || []; 
      if (!props.fieldConfig.allowCustom) {
        internalSelectValue.value = newModelValue;
        return;
      }
      if (props.fieldConfig.selectionMode === 'multiple') {
        const modelArray = Array.isArray(newModelValue) ? newModelValue : [];
        const predefined = modelArray.filter(v => currentOptions.includes(v));
        const custom = modelArray.filter(v => v !== null && v !== undefined && !currentOptions.includes(v));
        const newSelectValue = [...predefined];
        let newCustomValue = '';
        if (custom.length > 0) {
          newSelectValue.push('其他');
          newCustomValue = custom[0];
        }
        if (JSON.stringify(internalSelectValue.value) !== JSON.stringify(newSelectValue)) {
            internalSelectValue.value = newSelectValue;
        }
        if (customValue.value !== newCustomValue) {
            customValue.value = newCustomValue;
        }
      } else { 
        if (newModelValue && !currentOptions.includes(newModelValue)) {
          internalSelectValue.value = '其他';
          customValue.value = newModelValue;
        } else {
          if (newModelValue === null && internalSelectValue.value === '其他') {
            customValue.value = '';
          } else {
            internalSelectValue.value = newModelValue;
            customValue.value = '';
          }
        }
      }
    }, { immediate: true });

    const emitUpdate = () => {
      if (!props.fieldConfig.allowCustom) {
         emit('update:modelValue', internalSelectValue.value);
         return;
      }
      if (props.fieldConfig.selectionMode === 'multiple') {
        const selectArray = Array.isArray(internalSelectValue.value) ? internalSelectValue.value : [];
        const baseValues = selectArray.filter(v => v !== '其他');
        const custom = customValue.value || '';
        if (showCustomField.value) {
            emit('update:modelValue', [...baseValues, custom]);
        } else {
            emit('update:modelValue', baseValues);
        }
      } else { 
        if (internalSelectValue.value === '其他') {
          emit('update:modelValue', customValue.value || null);
        } else {
          emit('update:modelValue', internalSelectValue.value);
        }
      }
    };
    
    watch(internalSelectValue, (newSelectVal, oldSelectVal) => {
        if (props.fieldConfig.selectionMode === 'multiple') {
            if (Array.isArray(oldSelectVal) && oldSelectVal.includes('其他') && (!Array.isArray(newSelectVal) || !newSelectVal.includes('其他'))) {
                customValue.value = '';
            }
        } else { 
            if (oldSelectVal === '其他' && newSelectVal !== '其他') {
                customValue.value = '';
            }
        }
        emitUpdate(); 
    });
    
    watch(customValue, () => {
        if (showCustomField.value) {
            emitUpdate();
        }
    });
    
    if (!props.fieldConfig || !props.fieldConfig.options) { 
      return () => null; 
    }

    const rules = {
      required: (v) => !!v || '此欄位為必填',
      requiredArray: (v) => (Array.isArray(v) && v.length > 0) || '此欄位為必填',
    };
    
    const isRequired = props.fieldConfig.isRequired;
    const isMultiple = props.fieldConfig.selectionMode === 'multiple';
    
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

      const vTextField = h(VTextField, { 
        modelValue: customValue.value,
        'onUpdate:modelValue': (val) => {
          customValue.value = val;
        },
        label: '請輸入其他項目',
        variant: 'outlined',
        class: 'mb-2 mt-n1',
        autocomplete: 'off',
        rules: (isRequired && showCustomField.value) ? [rules.required] : [], 
      });

      if (props.fieldConfig.selectionMode === 'single') {
        const vSelectProps = {
          ...commonProps,
          modelValue: internalSelectValue.value,
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
      
      if (props.fieldConfig.selectionMode === 'multiple') {
        const multiProps = {
          ...commonProps,
          modelValue: internalSelectValue.value,
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

// --- State ---
const step = ref(1);
const isLoading = ref(false);
const isSubmitting = ref(false);
const isSubmitted = ref(false);
const errorMessage = ref(null);
const step1Error = ref(null);
const isCustomerMode = ref(false);
// ✅ [修改] 移除 salesPassword 等輸入框 ref
const showBindButton = ref(false);

const salesPhone = ref(''); // ✅ 仍需保留，用於 loadForm 中過濾
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



const cityOptions = ref(twCitiesData.map(c => c.name));
const districtOptions = ref([]);
const allManageableUsers = ref([]);
const allUserPermissionsMap = ref({});

// --- Computed ---
const pageTitle = computed(() => `${projectName.value} 客戶資料表`);

const getTodayInTaiwan = () => {
  return new Date().toLocaleDateString('sv-SE', { timeZone: 'Asia/Taipei' });
};
const todayInTaiwan = computed(() => getTodayInTaiwan());

const currentUrl = computed(() => {
  if (!selectedProjectId.value) return ''; 
  const selectedSalesName = formData.value['銷售人員'];
  const selectedSalesPersonObject = salespersonOptions.value.find(p => p.name === selectedSalesName);
  const selectedSalesPhone = selectedSalesPersonObject ? selectedSalesPersonObject.phone : undefined;

  const path = router.resolve({
    name: 'CustomerDataSheetForm', 
    params: {
      projectId: selectedProjectId.value, 
      docId: currentDocId.value || undefined 
    },
    query: {
      sp: selectedSalesPhone, 
      sn: selectedSalesName || undefined
    }
  }).href;
  return `${window.location.origin}${path}`;
});

const filterRange = ref('week');

const filteredVipGuests = computed(() => {
  let list = [...vipGuests.value];
  const lowerSearch = guestSearch.value ? guestSearch.value.trim().toLowerCase() : null;
  if (lowerSearch) {
    list = list.filter(guest => 
      guest.name.toLowerCase().includes(lowerSearch) ||
      guest.phone.includes(lowerSearch)
    );
  } else {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekStart = new Date(todayStart);
    weekStart.setDate(weekStart.getDate() - 6);

    list = list.filter(guest => {
      const dateToCompare = parseTimestamp(guest.lastSubmittedAt);
      if (!dateToCompare) return false;
      if (filterRange.value === 'today') {
        return dateToCompare >= todayStart;
      } else { 
        return dateToCompare >= weekStart;
      }
    });
  }
  list.sort((a, b) => {
    const timeA = parseTimestamp(a.lastSubmittedAt)?.getTime() || 0;
    const timeB = parseTimestamp(b.lastSubmittedAt)?.getTime() || 0;
    return timeB - timeA;
  });
  return list;
});

const parseTimestamp = (t) => {
    if (!t) return null;
    if (typeof t.toDate === 'function') return t.toDate(); 
    if (t._seconds !== undefined) return new Date(t._seconds * 1000); 
    const d = new Date(t); 
    return isNaN(d.getTime()) ? null : d;
};

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

const rules = {
  required: (v) => !!v || '此欄位為必填',
  requiredArray: (v) => (Array.isArray(v) && v.length > 0) || '此欄位為必填',
  phone: (v) => (v && v.length === 10 && v.startsWith('09')) || '請輸入有效的 10 碼手機號碼',
  maxDate: (v) => {
    if (!v) return true; 
    const today = getTodayInTaiwan();
    return v <= today || `日期不可大於今天 (${today})`;
  }
};

watch(() => formData.value['居住城市'], (newCity) => {
  const currentDistrict = formData.value['居住鄉鎮市區'];
  let newOptions = [];
  if (newCity) {
    const cityData = twCitiesData.find(c => c.name === newCity);
    newOptions = cityData ? cityData.districts.map(d => d.name) : [];
  }
  districtOptions.value = newOptions;
  if (currentDistrict && newOptions.includes(currentDistrict)) {
  } else {
    formData.value['居住鄉鎮市區'] = null;
  }
});

async function copyUrlToClipboard() {
  if (!currentUrl.value) return;
  try {
    await navigator.clipboard.writeText(currentUrl.value);
    copySuccess.value = true;
    setTimeout(() => {
      copySuccess.value = false;
    }, 2000);
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

// --- Methods ---

// ✅ [新增] LIFF 初始化邏輯 (取代舊的 handleVerifySales)
async function initializeLiff() {
  isLoading.value = true;
  step1Error.value = null;
  showBindButton.value = false;

  try {
    await liff.init({ liffId: LIFF_ID });

    if (!liff.isLoggedIn()) {
      liff.login();
      return;
    }

    const profile = await liff.getProfile();
    const lineId = profile.userId;

    // 呼叫後端 API
    const response = await getLiffUserData({ lineId });

    if (response.status === 'not_bound') {
      step1Error.value = '您的 LINE 帳號尚未綁定系統，請先進行綁定。';
      showBindButton.value = true;
    } else if (response.status === 'bound') {
      // 成功登入
      
      // 1. 篩選有權限的專案
      const validProjects = (response.projects || []).filter(p => {
        const systems = p.systems || [];
        return systems.includes('客資系統-銷售') || systems.includes('客資系統-櫃台') || systems.includes('超級管理員');
      });

      if (validProjects.length === 0) {
        step1Error.value = "您沒有操作任何建案的客資系統權限。";
      } else {
        // 2. 判斷是否為櫃台
        // 如果使用者在任一專案擁有櫃台權限，視為有櫃台能力 (後續選專案會再細分)
        // 嚴謹一點應該在選完專案後判斷，但這裡先做個大概標記
        const hasCounterRole = validProjects.some(p => p.systems.includes('客資系統-櫃台') || p.systems.includes('超級管理員'));
        isCounter.value = hasCounterRole;

        // 3. 設定 SalesPerson 資料
        salesPerson.value = {
          name: response.userName,
          // 注意：如果後端沒回傳電話，這裡會是空值。若為空，一般銷售人員提交表單時可能會漏掉電話欄位
          // 建議確保後端 getLiffUserData 回傳 userKey (phone)
          phone: response.userKey || '', 
          projects: validProjects.map(p => ({ id: p.projectId, name: p.projectName })),
          isCounter: hasCounterRole
        };
        
        // 設定 salesPhone 以便後續 loadForm 邏輯使用
        salesPhone.value = response.userKey || ''; 

        // 自動跳轉到步驟 2
        step.value = 2;
      }
    } else {
      throw new Error('未知的回應狀態');
    }

  } catch (error) {
    console.error('LIFF Init Error:', error);
    step1Error.value = error.message || '初始化過程發生錯誤，請稍後再試。';
  } finally {
    isLoading.value = false;
  }
}

const goToBinding = () => {
  router.push({ name: 'LineBindingPage' }); 
};

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
  handleNewCustomer(); 
  confirmNewCustomerDialog.value = false; 
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
      '銷售人員': isUrlEntry ? salesNameFromUrl : salesPerson.value.name, 
      '銷售人員電話': isUrlEntry ? salesPhoneFromUrl : salesPhone.value, 
      '拜訪日期': getTodayInTaiwan(),
      '居住城市': null, 
      '居住鄉鎮市區': null,
      '居住詳細地址': '',
      '任職公司': '',
    };    
    
    if (systemSettings.value.fields.age) {
      const field = systemSettings.value.fields.age;
      initialFormData[field.label] = field.selectionMode === 'multiple' ? [] : null;
    }
    if (systemSettings.value.fields.occupation) {
      const field = systemSettings.value.fields.occupation;
      initialFormData[field.label] = field.selectionMode === 'multiple' ? [] : null;
    }
    formFields.value.forEach(field => {
      initialFormData[field.label] = field.selectionMode === 'multiple' ? [] : null;
    });

    if (currentDocId.value) {
      const result = await fetchSingleVipGuest(currentDocId.value);
      if (result.status === 'success') {
        const data = result.data;
        let sourceData = {};

        if (data.submissions && Array.isArray(data.submissions) && data.submissions.length > 0) {
            sourceData = data.submissions[data.submissions.length - 1];
        } 
        else if (data.profile) {
            sourceData = data.profile;
        } 
        else {
            sourceData = data;
        }

        initialFormData = { 
          ...initialFormData, 
          ...sourceData,
          '拜訪日期': sourceData['拜訪日期'] || getTodayInTaiwan(),
          '銷售人員': initialFormData['銷售人員'], 
          '銷售人員電話': initialFormData['銷售人員電話'] 
        };
        
        if (sourceData['居住鄉鎮市區']) {
          const city = twCitiesData.find(c => 
            c.districts.some(d => d.name === sourceData['居住鄉鎮市區'])
          );
          if (city) {
            const cityData = twCitiesData.find(c => c.name === city.name);
            districtOptions.value = cityData ? cityData.districts.map(d => d.name) : [];
          }
        }
      } else {
        throw new Error(result.message);
      }
    }
    
    formData.value = initialFormData;
    
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
    if (!isCustomerMode.value) { 
      if (isCounter.value) {
        const selectedSalesName = formData.value['銷售人員'];
        const selectedSalesPersonObject = salespersonOptions.value.find(p => p.name === selectedSalesName);
        formData.value['銷售人員電話'] = selectedSalesPersonObject ? selectedSalesPersonObject.phone : null;
      } else {
        formData.value['銷售人員電話'] = salesPerson.value.phone;
      }
    }

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

function formatGuestDate(val) {
  if (!val) return '未知日期';
  let dateObj;
  if (typeof val.toDate === 'function') {
    dateObj = val.toDate();
  }
  else if (val._seconds !== undefined) {
    dateObj = new Date(val._seconds * 1000);
  }
  else {
    dateObj = new Date(val);
  }
  if (isNaN(dateObj.getTime())) {
    return '無效日期';
  }
  try {
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
    
    const salesPhoneFromUrl = route.query.sp;
    const salesNameFromUrl = route.query.sn;
    
    handleProjectSelected(true); 
    loadForm(true, salesPhoneFromUrl, salesNameFromUrl); 
  } else {
    // ✅ [修改] 銷售人員流程：初始化 LIFF
    isCustomerMode.value = false; 
    step.value = 1;
    initializeLiff(); // 啟動 LIFF
  }
});

</script>

<style scoped>
.mobile-stepper :deep(.v-stepper-item__title) {
  font-size: 12px !important; 
  line-height: 1.2;           
  white-space: nowrap;        
}

.mobile-stepper :deep(.v-stepper-item__avatar) {
  width: 24px !important;
  height: 24px !important;
  font-size: 12px !important;
  margin-bottom: 8px !important;
}
</style>