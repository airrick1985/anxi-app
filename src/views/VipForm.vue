<template>
  <v-container style="background-color: #F5F5F7">
    <v-row justify="center">
      <v-col cols="12" md="10" lg="8">
        
        <v-card v-if="showCoverImage && coverImageUrl" class="mb-5" elevation="4">
          <v-img
            :src="coverImageUrl"
            aspect-ratio="16/9"
            cover
          ></v-img>
        </v-card>

       
        <v-card>
          <v-toolbar  color="white" density="compact">
            <v-toolbar-title> {{ pageTitle }}</v-toolbar-title>
  
          
          </v-toolbar>

            <v-row v-if="!isLoading" class="mb-2" >
           <v-spacer></v-spacer>
           <v-btn 
             variant="text" 
             color="black" 
             prepend-icon="mdi-qrcode-scan"
             @click="qrDialog = true"
           >
                     </v-btn>
        </v-row>

          <v-card-text v-if="isLoading" class="text-center pa-10">
            <v-progress-circular indeterminate color="primary" size="64"></v-progress-circular>
            <p class="mt-4 text-grey">正在載入資料...</p>
          </v-card-text>

          <v-card-text v-else-if="isSubmitted" class="text-center pa-10">
           <v-icon size="80" color="success">mdi-check-circle-outline</v-icon>
            <h2 class="text-h5 mt-4">感謝您</h2>
            <p class="text-body-1 mt-2">資料已成功送出，請洽現場服務人員。</p>
            
            <v-btn
              v-if="projectWebsiteUrl"
              color="primary"
              variant="flat"
              class="mt-6"
              :href="projectWebsiteUrl"
              target="_blank"
              prepend-icon="mdi-web"
            >
              {{ projectName }} 建案介紹
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
              <p class="text-h6 mb-4">基本資料</p>
              
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

              <v-divider class="my-6"></v-divider>

              <p class="text-h6 mb-4">需求資訊</p>

              <template v-for="field in formFields" :key="field.key">
                
                <v-select
                  v-if="field.selectionMode === 'single' && !field.allowCustom"
                  v-model="formData[field.label]"
                  :label="field.label"
                  :items="field.options"
                  variant="outlined"
                  :rules="field.isRequired ? [rules.required] : []"
                  class="mb-2"
                ></v-select>

                <v-combobox
                  v-if="field.selectionMode === 'single' && field.allowCustom"
                  v-model="formData[field.label]"
                  :label="field.label"
                  :items="field.options"
                  variant="outlined"
                  :rules="field.isRequired ? [rules.required] : []"
                  class="mb-2"
                ></v-combobox>

                <v-select
                  v-if="field.selectionMode === 'multiple' && !field.allowCustom"
                  v-model="formData[field.label]"
                  :label="field.label"
                  :items="field.options"
                  variant="outlined"
                  multiple
                  chips
                  closable-chips
                  :rules="field.isRequired ? [rules.requiredArray] : []"
                  class="mb-2"
                ></v-select>

                <v-combobox
                  v-if="field.selectionMode === 'multiple' && field.allowCustom"
                  v-model="formData[field.label]"
                  :label="field.label"
                  :items="field.options"
                  variant="outlined"
                  multiple
                  chips
                  closable-chips
                  :rules="field.isRequired ? [rules.requiredArray] : []"
                  class="mb-2"
                ></v-combobox>

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

        <v-dialog v-model="qrDialog" max-width="400" >
          <v-card >
            <v-card-title>貴賓資料表</v-card-title>
            <v-card-text class="text-center">
              <p>請掃描填寫，感謝您。</p>
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
import { ref, computed, onMounted, watch } from 'vue';
import { fetchVipFormSettings, submitVipForm } from '@/api';
import QrCode from 'qrcode.vue';

const props = defineProps({
  projectId: {
    type: String,
    required: true,
  },
});

// --- State ---
const isLoading = ref(true);
const isSubmitting = ref(false);
const isSubmitted = ref(false);
const errorMessage = ref(null);

const formRef = ref(null);
const projectName = ref('');
const coverImageUrl = ref(null);
const showCoverImage = ref(false);
const projectWebsiteUrl = ref(null);

const formFields = ref([]); // 動態欄位
const formData = ref({});   // 表單資料
const qrDialog = ref(false);
const copySuccess = ref(false);


// --- Computed ---
const pageTitle = computed(() => `${projectName.value} 貴賓資料表`);
const currentUrl = computed(() => window.location.href);

// --- Validation Rules ---
const rules = {
  required: (v) => !!v || '此欄位為必填',
  requiredArray: (v) => (Array.isArray(v) && v.length > 0) || '此欄位為必填',
  phone: (v) => /^09\d{8}$/.test(v) || '請輸入有效的 10 碼手機號碼',
};

watch(qrDialog, (newVal) => {
  if (!newVal) {
    copySuccess.value = false;
  }
});

// --- Methods ---
onMounted(async () => {
  if (!props.projectId) {
    errorMessage.value = "錯誤：缺少建案 ID。";
    isLoading.value = false;
    return;
  }
  
  try {
    const result = await fetchVipFormSettings(props.projectId);
    
    if (result.status !== 'success') {
      throw new Error(result.message);
    }
    
    projectName.value = result.projectName || props.projectId;
    
    // 處理封面圖
    if (result.vipFormConfig?.coverImage) {
      showCoverImage.value = result.vipFormConfig.coverImage.show || false;
      coverImageUrl.value = result.vipFormConfig.coverImage.url || null;
    }

    // ✓ 檢查：(新增) 儲存網站 URL
    if (result.vipFormConfig?.projectWebsiteUrl) {
      projectWebsiteUrl.value = result.vipFormConfig.projectWebsiteUrl;
    }

    // 處理動態欄位
    const dynamicFields = result.vipFormFields || {};
    const processedFields = [];
    const initialFormData = {
      '姓名': '',
      '電話': '',
    };

    // 依照 order 排序欄位
    const sortedKeys = Object.keys(dynamicFields).sort((a, b) => {
      return (dynamicFields[a].order || 99) - (dynamicFields[b].order || 99);
    });

    for (const key of sortedKeys) {
      const field = dynamicFields[key];
      
      // ✓ 檢查：如果選項為空，則不渲染
      if (!field.options || field.options.length === 0) {
        continue; 
      }

      processedFields.push({
        key: key,
        ...field
      });

      // 初始化 formData
      initialFormData[field.label] = (field.selectionMode === 'multiple') ? [] : null;
    }
    
    formFields.value = processedFields;
    formData.value = initialFormData;

  } catch (error) {
    console.error("載入貴賓表單設定失敗:", error);
    errorMessage.value = `載入設定失敗: ${error.message}`;
  } finally {
    isLoading.value = false;
  }
});

const handleSubmit = async () => {
  errorMessage.value = null;
  const { valid } = await formRef.value.validate();

  if (!valid) {
    return;
  }

  isSubmitting.value = true;
  
  try {
    const result = await submitVipForm(props.projectId, formData.value);
    
    if (result.status !== 'success') {
      throw new Error(result.message);
    }

    isSubmitted.value = true; // 顯示成功訊息

  } catch (error) {
    console.error("提交貴賓表單失敗:", error);
    errorMessage.value = `提交失敗: ${error.message}`;
  } finally {
    isSubmitting.value = false;
  }
};

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

</script>

<style scoped>
/* (您可以添加自訂樣式) */
</style>