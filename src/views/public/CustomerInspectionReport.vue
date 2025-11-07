<template>
  <v-container
    fluid
    class="pa-0"
    style="background-color: #F4F4F7; min-height: 100vh; padding-bottom: 72px;"
  >
    <v-card class="mx-auto" max-width="1200">

      <v-toolbar color="primary" dark flat height="auto" class="py-2">
        <v-toolbar-title class="font-weight-bold mobile-title-scaling">
          {{ pageTitle }}
        </v-toolbar-title>
      </v-toolbar>

      <div v-if="isLoading" class="text-center pa-10">
        <v-progress-circular indeterminate color="primary" size="50"></v-progress-circular>
        <p class="mt-4 text-grey">正在載入驗屋報告...</p>
      </div>

      <div v-else-if="errorLoading" class="text-center pa-10">
         <v-icon size="60" color="error" class="mb-4">mdi-alert-circle-outline</v-icon>
         <p class="text-h6">無法載入報告</p>
         <p class="mt-2 text-grey-darken-1">{{ errorLoading }}</p>
         </div>

      <div v-else>
        <div v-if="filteredRecords.length === 0" class="pa-10 text-center text-grey">
          目前尚無可顯示的驗屋紀錄。
        </div>

        <div v-else>
          <div v-if="viewMode === 'table'">
            <v-data-table
              :headers="headers"
              :items="filteredRecords"
              item-value="id"
              class="elevation-0"
              :items-per-page="10"
              :items-per-page-options="[{ value: 10, title: '10' },{ value: 25, title: '25' },{ value: 50, title: '50' },{ value: -1, title: '全部顯示' }]"
              density="compact"
            >
              <template v-slot:item="{ item }">
                <tr :class="{ 'confirmed-record-bg': !!item.customerConfirmedAt }">
                  <td>{{ formatDate(item.inspectionDate) }}</td>
                  <td>{{ item.phase }}</td>
                  <td>
                    <div class="d-flex ga-1 pa-1">
                      <v-img
                        v-for="(photo, index) in item.photos.slice(0, 4)"
                        :key="index"
                        :src="photo.url"
                        aspect-ratio="1"
                        cover
                        width="40"
                        class="rounded border cursor-pointer"
                        @click="showImagePreview(photo.url)"
                      >
                         </v-img>
                      <div v-if="item.photos.length > 4" class="d-flex align-center justify-center text-caption text-grey" style="width: 40px;">
                        +{{ item.photos.length - 4 }}
                      </div>
                    </div>
                  </td>
                  <td>{{ item.area }}</td>
                  <td>{{ item.category }}</td>
                  <td>{{ item.subCategory }}</td>
                  <td>
                    <ChipRenderer :value="item.status" type="status" :options="optionsForChips.status" size="small" />
                  </td>
                  <td>
                     <span v-if="item.customerConfirmedAt" class="text-caption text-success-darken-1">
                        {{ formatDate(item.customerConfirmedAt) }}
                    </span>
                    <v-chip
                      v-else
                      color="red"
                      text-color="white"
                      size="small"
                      label
                    >
                      買方未確認
                    </v-chip>
                    </td>
                  <td>{{ item.description }}</td>
                  <td>{{ item.inspectorName }}</td>
                  <td>{{ formatDateTime(item.createdAt) }}</td>
                </tr>
              </template>
              </v-data-table>
          </div>

          <div v-if="viewMode === 'card'" class="pa-2 pa-sm-4">
            <v-row dense>
              <v-col v-for="item in filteredRecords" :key="item.id" cols="12" sm="6" md="4" lg="3">
                <v-card
                  class="mb-3 record-card"
                  variant="outlined"
                  :class="{ 'confirmed-record-bg': !!item.customerConfirmedAt }"
                >
                <div v-if="item.photos && item.photos.length > 0" class="d-flex ga-1 pa-2 border-b photo-strip">
                     <v-img
                       v-for="(photo, index) in item.photos.slice(0, 5)" :key="index"
                       :src="photo.url"
                       aspect-ratio="1"
                       cover
                       height="50" class="rounded border cursor-pointer"
                       @click="showImagePreview(photo.url)"
                     >
                       <template v-slot:placeholder>
                         <div class="d-flex align-center justify-center fill-height">
                           <v-progress-circular indeterminate size="20" color="grey-lighten-2"></v-progress-circular>
                         </div>
                       </template>
                       <div v-if="index === 4 && item.photos.length > 5" class="photo-overlay d-flex align-center justify-center">
                         +{{ item.photos.length - 5 }}
                       </div>
                     </v-img>
                   </div>
                   <v-card-item class="pb-1 pt-2">
                     <div>
                       <span class="text-subtitle-1 font-weight-bold mr-2">{{ item.area }}</span>
                       <span class="text-caption text-grey">{{ formatDate(item.inspectionDate) }} - {{ item.phase }}</span>
                     </div>
                     <p class="text-body-2 text-medium-emphasis mt-1">
                       {{ item.category }} / {{ item.subCategory }}
                     </p>
                   </v-card-item>
                   <v-card-text class="py-2">
                     <div class="d-flex ga-1 flex-wrap mb-1">
                       <ChipRenderer size="x-small" :value="item.status" type="status" :options="optionsForChips.status" />
                       </div>
                     <p v-if="item.description" class="text-caption text-medium-emphasis description-truncate mt-1">
                       {{ item.description }}
                     </p>
                   </v-card-text>
                   <v-divider></v-divider>
                   <v-card-actions class="px-3 py-1">
                       <div class="d-flex flex-column" style="width: 100%;">
                           <span class="text-caption text-grey">
                             驗屋人員: {{ item.inspectorName }} @ {{ formatDateTime(item.createdAt) }}
                           </span>
                           <span v-if="item.customerConfirmedAt" class="text-caption text-success-darken-1 mt-1">
                               買方確認：{{ formatDate(item.customerConfirmedAt) }}
                           </span>
                           <v-chip
                             v-else
                             color="red"
                             text-color="white"
                             size="x-small"
                             label
                             class="mt-1"
                           >
                             買方未確認
                           </v-chip>
                       </div>
                     <v-spacer></v-spacer>
                     </v-card-actions>
                </v-card>
              </v-col>
            </v-row>
          </div>
        </div>
      </div>
    </v-card>

  <v-bottom-navigation 
  fixed 
  color="primary" 
  elevation="8" 
  grow 
  mandatory 
  v-model="bottomNavValue" 
  >
      <v-btn value="list" @click="viewMode = 'table'">
        <v-icon>mdi-format-list-bulleted</v-icon>
        <span>列表模式</span>
      </v-btn>
      <v-btn value="card" @click="viewMode = 'card'">
        <v-icon>mdi-view-dashboard-outline</v-icon>
        <span>卡片模式</span>
      </v-btn>
      <v-btn value="confirm" @click="openConfirmDialog">
        <v-icon>mdi-draw</v-icon>
        <span>確認簽名</span>
      </v-btn>
    </v-bottom-navigation>

    <v-dialog v-model="showConfirmDialog" persistent fullscreen transition="dialog-bottom-transition">
      <v-card>
        <v-toolbar dark color="primary">
          <v-btn icon dark @click="closeConfirmDialog">
            <v-icon>mdi-close</v-icon>
          </v-btn>
          <v-toolbar-title>確認驗屋報告</v-toolbar-title>
          <v-spacer></v-spacer>
          </v-toolbar>

        <v-card-text class="pa-4 confirm-scrollable-content">      
        <v-alert type="info" variant="tonal" density="compact" class="mb-4">
      請確認以下資訊無誤，並於下方簽署確認本次驗屋紀錄。
     </v-alert>

          

          <v-row dense>
            <v-col cols="12" md="4">
              <v-text-field
                v-model="buyerInfo.name"
                label="買方姓名 *"
                variant="outlined"
            
                :rules="[rules.required]"
                :loading="isLoadingBuyerInfo"
                :readonly="isSaving"
              ></v-text-field>
            </v-col>
            <v-col cols="12" md="4">
              <v-text-field
                v-model="buyerInfo.phone"
                label="連絡電話 *"
                variant="outlined"
           
                :rules="[rules.required]"
                :loading="isLoadingBuyerInfo"
                :readonly="isSaving"
              ></v-text-field>
            </v-col>
            <v-col cols="12" md="4">
              <v-text-field
                v-model="buyerInfo.email"
                label="Email *"
                variant="outlined"
                hint="請確認 Email 是否正確，以免收不到驗屋報告"
                persistent-hint
                type="email"
                :rules="[rules.required, rules.email]"
                :loading="isLoadingBuyerInfo"
                :readonly="isSaving"
              ></v-text-field>
            </v-col>
          </v-row>

          <v-divider class="my-4"></v-divider>

          <p class="text-subtitle-1 mb-2">請在此處簽名：</p>
           <p class="text-caption text-grey mt-4">
          <v-icon start size="small">mdi-information-outline</v-icon> 
          簽名完成表示同意本次驗屋紀錄做為下次檢驗之依據。
           </p>
          <div class="signature-pad-container border rounded" 
          :class="{ 'shake-animation': shakeSignaturePad }"
          @touchstart.stop.prevent  
          @touchmove.stop.prevent  
          >
         
            <VueSignaturePad
              ref="signaturePad"
              width="100%"
              height="220px"
              :options="{ penColor: '#000', onBegin: handleSignatureBegin }"
              
            />
            
          </div>
             <div class="d-flex justify-end mt-2">
            <v-btn @click="clearSignature" :disabled="isSaving" variant="text" color="grey" size="small">
              清除
            </v-btn>
          </div>
        

         
                
        </v-card-text>

        
        <v-slide-y-transition>
           <v-alert v-if="saveError" type="error" density="compact" class="mx-4 mb-4">
              儲存失敗：{{ saveError }}
           </v-alert>
        </v-slide-y-transition>
<v-divider></v-divider>
      <v-card-actions class="pa-4 confirm-dialog-footer"> <v-spacer></v-spacer>
        <v-btn
          color="grey-darken-1"
          variant="text"
          @click="closeConfirmDialog"
          :disabled="isSaving"
        >
          關閉
        </v-btn>
        <v-btn
          @click="saveConfirmation"
          :disabled="!isConfirmReady || isSaving"
          :loading="isSaving"
          color="primary"
          variant="elevated"
          size="large"
        >
          確認完成
        </v-btn>
      </v-card-actions>
      </v-card>

    </v-dialog>

  

    <v-dialog v-model="showPreviewDialog" max-width="80vw" max-height="90vh">
      <v-card>
        <v-toolbar dense flat class="border-b">
          <v-spacer></v-spacer>
          <v-btn icon="mdi-close" @click="showPreviewDialog = false"></v-btn>
        </v-toolbar>
        <v-card-text class="pa-0 d-flex justify-center align-center" style="max-height: calc(90vh - 48px);">
          <v-img :src="previewImageUrl" contain max-height="calc(90vh - 48px)"></v-img>
        </v-card-text>
      </v-card>
    </v-dialog>

        <div class="text-caption text-grey text-center mt-4 d-flex align-center justify-center">
  <span>Powered by&nbsp;</span>
  <v-chip
    class="ml-1"
    href="https://airrick1985.wixsite.com/anxi"
    target="_blank"
    rel="noopener noreferrer"
    color="blue-grey"
    variant="tonal"
    size="small"
    pill
  >
    <v-icon start size="x-small">mdi-rocket-launch-outline</v-icon>
    anxismart安熙智慧建案管理系統
  </v-chip>
</div>

    

   
  </v-container>
</template>

<script setup>
import { ref, onMounted, computed, reactive, watch } from 'vue';
import { useRoute } from 'vue-router';
import {
  validateReportTokenAPI,
  getInspectionRecordsFB, // ✅ 注意: 這裡的 API 名稱是 getInspectionRecordsFB
  getCustomerAppointmentDetails,
  saveCustomerConfirmation,
  getInspectionOptionsForProjectFB // ✅ 注意: 這裡的 API 名稱是 getInspectionOptionsForProjectFB
} from '@/api';
import { VDataTable } from 'vuetify/components/VDataTable';
import { useDisplay } from 'vuetify';
import { useProjectStore } from '@/store/projectStore';
import ChipRenderer from '@/components/ChipRenderer.vue';
import { VueSignaturePad } from 'vue-signature-pad';
import { format, parseISO } from 'date-fns';
import { zhTW } from 'date-fns/locale';

const route = useRoute();
const { mobile } = useDisplay();
const projectStore = useProjectStore();

// --- State ---
const isLoading = ref(true);
const errorLoading = ref(null);
const projectId = ref(null);
const unitId = ref(null);
const pageTitle = ref('驗屋報告');
const viewMode = ref('card');
const allRecords = ref([]);
const optionsForChips = reactive({ status: [] });
const showPreviewDialog = ref(false);
const previewImageUrl = ref('');
const bottomNavValue = ref('card');

// -- Confirmation Dialog State --
const showConfirmDialog = ref(false);
const isLoadingBuyerInfo = ref(false);
const buyerInfo = reactive({ name: '', phone: '', email: '' });
const signaturePad = ref(null);
const isSigned = ref(false);
const isSaving = ref(false);
const saveError = ref(null);
const shakeSignaturePad = ref(false);

// --- Computed ---
const projectName = computed(() => {
    return projectId.value ? (projectStore.idToNameMap[projectId.value] || projectId.value) : '';
});

const filteredRecords = computed(() => {
  if (!projectId.value || !unitId.value) return [];
  return allRecords.value.filter(record => record.customerView !== false);
});

// ✅ 修改 headers 計算屬性
const headers = computed(() => [
  { title: '日期', key: 'inspectionDate', sortable: true },
  { title: '階段', key: 'phase', sortable: true },
  { title: '照片', key: 'photos', sortable: false },
  { title: '區域', key: 'area', sortable: true },
  { title: '種類', key: 'category', sortable: true },
  { title: '細項', key: 'subCategory', sortable: true },
  { title: '狀態', key: 'status', sortable: true },
  { title: '買方確認', key: 'customerConfirmedAt', sortable: true }, // ✅ 新增欄位
  { title: '說明', key: 'description', sortable: false },
  { title: '人員', key: 'inspectorName', sortable: true },
  { title: '時間', key: 'createdAt', sortable: true },
]);

const isConfirmReady = computed(() => {
  return !!projectId.value && !!unitId.value && buyerInfo.name && buyerInfo.phone && buyerInfo.email && isSigned.value && isValidEmail(buyerInfo.email);
});

const rules = {
  required: value => !!value || '此欄位為必填',
  email: value => /.+@.+\..+/.test(value) || 'Email 格式無效',
};

// --- Watchers ---
watch(bottomNavValue, (newValue) => {
  if (newValue === 'list') viewMode.value = 'table';
  else if (newValue === 'card') viewMode.value = 'card';
});

watch([projectName, unitId], ([newName, newUnitId]) => {
    if (newName && newUnitId) {
        pageTitle.value = `${newName} ${newUnitId} 驗屋報告`;
    } else {
        pageTitle.value = '驗屋報告';
    }
}, { immediate: true });

// --- Methods ---
onMounted(async () => {
  isLoading.value = true;
  errorLoading.value = null;
  const token = route.query.token;

  if (!token) {
    errorLoading.value = '無效的連結或缺少驗證資訊。';
    isLoading.value = false;
    return;
  }

  try {
    console.log("正在驗證 Token...");
    const validationResult = await validateReportTokenAPI({ token: token });

    if (validationResult.status === 'success' && validationResult.data) {
      projectId.value = validationResult.data.projectId;
      unitId.value = validationResult.data.unitId;
      console.log(`Token 驗證成功: projectId=${projectId.value}, unitId=${unitId.value}`);

      if (projectStore.projectsList.length === 0) {
        await projectStore.fetchProjects();
      }

      await loadInspectionRecords();
      await loadOptions();

    } else {
      throw new Error(validationResult.message || '連結驗證失敗');
    }
  } catch (error) {
    console.error("Token 驗證或資料載入失敗:", error);
    errorLoading.value = `無法載入報告: ${error.message}`;
    projectId.value = null;
    unitId.value = null;
  } finally {
    isLoading.value = false;
  }
});

async function loadInspectionRecords() {
  errorLoading.value = null;
  if (!projectId.value || !unitId.value) {
      console.warn('loadInspectionRecords: projectId 或 unitId 尚未從 Token 載入，跳過執行。');
      allRecords.value = [];
      return;
  }
  try {
    // ✅ 注意: 使用 getInspectionRecordsFB API
    const result = await getInspectionRecordsFB(projectId.value, unitId.value);
    if (result.status === 'success') {
      allRecords.value = result.data;
      console.log("載入的 Records 範例:", allRecords.value.slice(0, 2)); // 增加 Log 檢查資料
    } else {
      throw new Error(result.message || '無法載入驗屋紀錄');
    }
  } catch (error) {
    console.error("載入驗屋紀錄失敗:", error);
    errorLoading.value = `載入紀錄失敗: ${error.message}`;
    allRecords.value = [];
  }
}

async function loadOptions() {
  if (!projectId.value) {
      console.warn('loadOptions: projectId 尚未從 Token 載入，跳過執行。');
      return;
  }
  try {
    // ✅ 注意: 使用 getInspectionOptionsForProjectFB API
    const result = await getInspectionOptionsForProjectFB(projectId.value);
    if (result.status === 'success' && result.data?.status) {
      optionsForChips.status = result.data.status;
    } else {
      console.warn("無法載入狀態選項");
    }
  } catch (error) {
    console.error("載入選項失敗:", error);
  }
}

async function loadBuyerInfo() {
  isLoadingBuyerInfo.value = true;
  saveError.value = null;
  buyerInfo.name = '';
  buyerInfo.phone = '';
  buyerInfo.email = '';

  if (!projectId.value || !unitId.value) {
      console.warn('loadBuyerInfo: projectId 或 unitId 尚未從 Token 載入，跳過執行。');
      isLoadingBuyerInfo.value = false;
      return;
  }

  try {
    const result = await getCustomerAppointmentDetails({ projectId: projectId.value, unitId: unitId.value });
    if (result.status === 'success' && result.data) {
      buyerInfo.name = result.data.bookerName || '';
      buyerInfo.phone = result.data.bookerPhone || '';
      buyerInfo.email = result.data.bookerEmail || '';
      console.log('成功載入預設買方資訊。');
    } else {
      console.warn("無法獲取預設買方資訊:", result.message || 'API 回傳非成功狀態');
    }
  } catch (error) {
    console.error("載入預設買方資訊時發生 API 錯誤:", error);
  } finally {
    isLoadingBuyerInfo.value = false;
  }
}

function showImagePreview(url) {
  previewImageUrl.value = url;
  showPreviewDialog.value = true;
}

// ✅ 修改 formatDate，增加對 Firestore Timestamp 的處理
function formatDate(dateInput) {
  if (!dateInput) return '';
  try {
    let dateToFormat;
    // 檢查是否是 Firestore Timestamp 物件 (可能有 toDate 方法)
    if (typeof dateInput === 'object' && dateInput !== null && typeof dateInput.toDate === 'function') {
      dateToFormat = dateInput.toDate();
    }
    // 檢查是否是 ISO 8601 字串
    else if (typeof dateInput === 'string' && dateInput.includes('T') && dateInput.includes('Z')) {
       dateToFormat = parseISO(dateInput);
    }
    // 假設是 'YYYY-MM-DD' 格式 (來自 inspectionDate)
    else if (typeof dateInput === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateInput)) {
        dateToFormat = parseISO(dateInput + 'T00:00:00Z'); // 假設為 UTC 日期
    }
    else {
        // 嘗試直接轉換
        dateToFormat = new Date(dateInput);
    }

    if (isNaN(dateToFormat.getTime())) {
        throw new Error("Invalid date value");
    }

    return format(dateToFormat, 'yyyy/MM/dd', { locale: zhTW });
  } catch (e) {
    console.warn("無法格式化日期:", dateInput, e);
    return String(dateInput); // 返回原始值或某個錯誤標記
  }
}

// ✅ 修改 formatDateTime，增加對 Firestore Timestamp 的處理
function formatDateTime(dateTimeInput) {
    if (!dateTimeInput) return '';
    try {
        let dateToFormat;
        // 檢查是否是 Firestore Timestamp 物件
        if (typeof dateTimeInput === 'object' && dateTimeInput !== null && typeof dateTimeInput.toDate === 'function') {
            dateToFormat = dateTimeInput.toDate();
        }
        // 檢查是否是 ISO 8601 字串
        else if (typeof dateTimeInput === 'string' && dateTimeInput.includes('T') && dateTimeInput.includes('Z')) {
            dateToFormat = parseISO(dateTimeInput);
        }
        else {
            // 嘗試直接轉換
            dateToFormat = new Date(dateTimeInput);
        }

        if (isNaN(dateToFormat.getTime())) {
            throw new Error("Invalid date time value");
        }

        return format(dateToFormat, 'yyyy/MM/dd HH:mm', { locale: zhTW });
    } catch (e) {
        console.warn("無法格式化日期時間:", dateTimeInput, e);
        return String(dateTimeInput); // 返回原始值
    }
}


async function openConfirmDialog() {
  if (!projectId.value || !unitId.value) {
      alert('頁面尚未完全載入或連結無效，無法開啟簽名。');
      return;
  }
  showConfirmDialog.value = true;
  isSigned.value = false;
  saveError.value = null;
  clearSignature();
  try {
    await loadBuyerInfo();
    console.log("買方資訊載入完成 (或無預設資料)。");
  } catch (error) {
    console.error("在 openConfirmDialog 中捕捉到 loadBuyerInfo 的錯誤:", error);
  }
}

function closeConfirmDialog() {
  if (isSaving.value) return;
  showConfirmDialog.value = false;
}

function clearSignature() {
  signaturePad.value?.clearSignature();
  isSigned.value = false;
}

function handleSignatureBegin() {
  isSigned.value = true;
  shakeSignaturePad.value = false;
}

async function saveConfirmation() {
  if (!projectId.value || !unitId.value) {
      saveError.value = '頁面資料不完整，無法儲存。';
      return;
  }
  if (!isConfirmReady.value || isSaving.value) {
    if (!isSigned.value) {
        shakeSignaturePad.value = true;
        setTimeout(() => shakeSignaturePad.value = false, 500);
    }
    return;
  }

  isSaving.value = true;
  saveError.value = null;
  const { isEmpty, data } = signaturePad.value.saveSignature();

  if (isEmpty) {
      saveError.value = '簽名不可為空';
      isSaving.value = false;
      shakeSignaturePad.value = true;
      setTimeout(() => shakeSignaturePad.value = false, 500);
      return;
  }

  const signatureImageBase64 = data.split(',')[1];
  const confirmationBatchId = format(new Date(), 'yyyyMMddHHmmss');

  try {
    const payload = {
      projectId: projectId.value,
      unitId: unitId.value,
      confirmationBatchId: confirmationBatchId,
      buyerInfo: { name: buyerInfo.name, phone: buyerInfo.phone, email: buyerInfo.email },
      signatureImageBase64: signatureImageBase64,
    };
    const result = await saveCustomerConfirmation(payload);

    if (result.status === 'success') {
      console.log('確認儲存成功:', result.confirmationId);
      closeConfirmDialog();
      // 重新載入紀錄以更新顯示狀態
      await loadInspectionRecords();
      alert('驗屋報告確認完成！');
    } else {
      throw new Error(result.message || '儲存時發生未知的後端錯誤');
    }
  } catch (error) {
    console.error("儲存確認失敗:", error);
    saveError.value = error.message;
  } finally {
    isSaving.value = false;
  }
}

function isValidEmail(email) {
    return /.+@.+\..+/.test(email);
}

</script>

<style scoped>
.photo-strip .v-img {
  max-width: calc(20% - 4px); /* 讓 5 張圖剛好佔滿寬度 (考慮間隔 ga-1) */
  flex-basis: calc(20% - 4px);
  position: relative; /* 為了讓 overlay 定位 */
}
.photo-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  color: white;
  font-size: 0.9rem;
  font-weight: bold;
}

/* 保持 InspectionConsole 的樣式 */
.cursor-pointer { cursor: pointer; }
.record-card { transition: box-shadow 0.2s ease-in-out; }
.record-card:hover { box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
.description-truncate { display: -webkit-box; -webkit-line-clamp: 2; line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; text-overflow: ellipsis; min-height: 1.5em; /* 根據字體大小調整 */}
.border-b { border-bottom: 1px solid rgba(0, 0, 0, 0.12); }
.position-relative { position: relative; }

/* 手機版標題換行 (同 InspectionConsole) */
.mobile-title-scaling { white-space: normal !important; overflow: visible !important; text-overflow: clip !important; line-height: 1.35rem !important; font-size: inherit !important; height: auto !important; min-height: 0 !important; }

/* 簽名版容器樣式 */
.signature-pad-container {
  width: 100%;
  max-width: 600px; /* 可選：限制最大寬度 */
  margin: 0 auto;
  touch-action: none; /* 防止在簽名時滾動頁面 */
  background-color: #fff;
  user-select: none; /* 阻止內容選擇 */
}
/* 簽名版抖動動畫 */
.shake-animation {
  animation: shake 0.5s cubic-bezier(.36,.07,.19,.97) both;
  border-color: red !important; /* 抖動時變紅框 */
}
@keyframes shake {
  10%, 90% { transform: translate3d(-1px, 0, 0); }
  20%, 80% { transform: translate3d(2px, 0, 0); }
  30%, 50%, 70% { transform: translate3d(-4px, 0, 0); }
  40%, 60% { transform: translate3d(4px, 0, 0); }
}

/* ✅ START: 新增背景色 Class */
.confirmed-record-bg {
  background-color: #f5f5f5 !important; /* 使用 !important 確保覆蓋 Vuetify 預設樣式 */
}
/* ✅ END: 新增背景色 Class */

.confirm-fab {
  position: fixed;
  bottom: 28px; /* 位於底部導航列 (約 56px) 之上，與 InspectionConsole.vue 中的 FAB 相似 */
  right: 16px; /* 靠右對齊 */
  z-index: 100 !important; /* 確保在 v-bottom-navigation (z-index 8) 之上 */
}

.v-bottom-navigation {
  bottom: env(safe-area-inset-bottom) !important;
  margin-bottom: env(safe-area-inset-bottom) !important;
  padding: env(safe-area-inset-top) env(safe-area-inset-right) env(safe-area-inset-bottom) env(safe-area-inset-left) !important;
  position: fixed !important; bottom: 0; left: 0; right: 0; width: 100%; z-index: 1000;
}

.confirm-scrollable-content {
  /* Footer 預估高度約 56px (v-card-actions) + pa-4 (16px) = 72px */
  /* 我們用 80px 作為安全基數，加上手機安全區 */
  padding-bottom: calc(80px + env(safe-area-inset-bottom, 0px)) !important; 
}

.confirm-dialog-footer {
  position: fixed; /* 固定在視窗底部 */
  bottom: 0;
  left: 0;
  right: 0;
  width: 100%;
  background-color: white; /* 確保背景為白色 */
  box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.1); /* 添加陰影分隔 */
  z-index: 2001; /* 確保它在 v-dialog (z-index 約 2000) 之上 */
  
  /* 處理底部安全區域 (特別是 iPhone) */
  padding-bottom: calc(16px + env(safe-area-inset-bottom, 0px)) !important; 
}

/* 確保主要內容區域不會被固定的 footer 遮蓋 */
.confirm-dialog-content {
  /* 預設 pa-4 (16px) + footer 高度 (約 56px) + 安全區域 */
  /* 確保底部有足夠的內距，讓內容在 footer 上方結束 */
  padding-bottom: calc(72px + env(safe-area-inset-bottom, 0px)) !important;
}
</style>