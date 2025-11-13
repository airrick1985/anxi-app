<template>
  <v-container>
    <v-tabs v-model="tab" color="primary" grow>
      <v-tab value="management">客戶資料管理</v-tab>
      <v-tab value="settings" v-if="canManageSettings">客資系統設定</v-tab>
      <v-tab value="vipSettings" v-if="canManageSettings">貴賓資料設定</v-tab>
      <v-tab value="otherSettings" v-if="canManageSettings">其他設定</v-tab>
      <v-tab value="anxiSettings" v-if="isSuperAdmin">ANXI系統設定</v-tab>
      </v-tabs>

    <v-window v-model="tab">
      <v-window-item value="management">
        <v-card>
          <v-toolbar color="grey-lighten-5" >
            <v-toolbar-title class="text-subtitle-1">
              {{ projectName }} 客戶資料列表
            </v-toolbar-title>
          </v-toolbar>

          <v-card-text>
            <v-text-field
              v-model="customerListSearch"
              label="搜尋 (姓名、電話、銷售人員...)"
              prepend-inner-icon="mdi-magnify"
              variant="outlined"
              
              clearable
              hide-details
              class="mb-4"
            ></v-text-field>

            <v-data-table
              :headers="customerTableHeaders"
              :items="customerList"
              :loading="isLoadingCustomerList"
              :search="customerListSearch"
              item-value="submittedAt"
              class="elevation-1"
              
            >
              <template v-slot:item.購屋動機="{ item }">
                <v-chip
                  v-if="Array.isArray(item['購屋動機']) && item['購屋動機'].length"
                  :color="getChipColor(item['購屋動機'][0])"
                  size="small"
                  label
                >
                  {{ item['購屋動機'][0] }}
                </v-chip>
                <span v-if="Array.isArray(item['購屋動機']) && item['購屋動機'].length > 1" class="text-grey-darken-1 ml-1">
                  (+{{ item['購屋動機'].length - 1 }})
                </span>
              </template>

              <template v-slot:item.房型需求="{ item }">
                <div v-if="Array.isArray(item['房型需求'])">
                  {{ item['房型需求'].join(', ') }}
                </div>
              </template>
              
              <template v-slot:item.拜訪日期="{ item }">
                {{ formatDisplayDate(item['拜訪日期']) }}
              </template>

            </v-data-table>
          </v-card-text>
        </v-card>
      </v-window-item>
      <v-window-item value="settings" v-if="canManageSettings">
        <v-card>
          <v-toolbar color="blue-grey-lighten-5" >
            <v-toolbar-title class="text-subtitle-1">
              {{ projectName }} 客資系統欄位設定
            </v-toolbar-title>
            <v-spacer></v-spacer>
            <v-btn
              color="primary"
              variant="flat"
              @click="saveSettings"
              :loading="isSaving || isUploadingCover"
            >
              儲存設定
            </v-btn>
          </v-toolbar>

          <v-card-text v-if="isLoading" class="text-center pa-10">
            <v-progress-circular indeterminate color="primary"></v-progress-circular>
            <p class="mt-3 text-grey">正在載入設定...</p>
          </v-card-text>

          <v-card-text v-else class="pa-5">
            <v-expansion-panels v-model="panel" multiple>
              <v-expansion-panel
                v-for="(field, key) in settings.fields"
                :key="key"
                :title="field.label"
              >
                <v-expansion-panel-text>
                  <v-row dense align="center">
                    <v-col cols="12" md="3">
                      <v-switch
                        v-model="field.isRequired"
                        color="primary"
                        label="是否為必填"
                        
                        inset
                      ></v-switch>
                    </v-col>
                    <v-col cols="12" md="3">
                      <v-switch
                        v-if="field.hasOwnProperty('allowCustom')"
                        v-model="field.allowCustom"
                        color="primary"
                        label="允許自訂輸入"
                        
                        inset
                      ></v-switch>
                    </v-col>
                    <v-col cols="12" md="6">
                      <v-radio-group 
                        v-model="field.selectionMode" 
                        inline 
                         
                        label="選取模式"
                        class="mt-n2"
                      >
                        <v-radio label="單選" value="single"></v-radio>
                        <v-radio label="複選" value="multiple"></v-radio>
                      </v-radio-group>
                    </v-col>
                  </v-row>

                  <v-combobox
                    v-model="field.options"
                    label="編輯選項"
                    hint="按 Enter 新增項目，點擊 X 移除項目"
                    multiple
                    chips
                    deletable-chips
                    clearable
                    variant="outlined"
                    
                  >
                  </v-combobox>
                </v-expansion-panel-text>
              </v-expansion-panel>
            </v-expansion-panels>
          </v-card-text>
        </v-card>
      </v-window-item>

      <v-window-item value="vipSettings" v-if="canManageSettings">
        <v-card>
          <v-toolbar color="teal-lighten-5" >
            <v-toolbar-title class="text-subtitle-1">
              {{ projectName }} 貴賓資料設定
            </v-toolbar-title>
            <v-spacer></v-spacer>
            <v-btn
              color="primary"
              variant="flat"
              @click="saveSettings"
              :loading="isSaving || isUploadingCover" 
            >
              儲存設定
            </v-btn>
          </v-toolbar>

          <v-card-text v-if="isLoading" class="text-center pa-10">
            <v-progress-circular indeterminate color="primary"></v-progress-circular>
            <p class="mt-3 text-grey">正在載入設定...</p>
          </v-card-text>

          <v-card-text v-else class="pa-5">
            <v-alert type="info" variant="tonal" border="start"  class="mb-4">
              此頁面設定的選項，將用於客戶來訪時，在貴賓接待平板上自行填寫的欄位。
            </v-alert>

            <v-card variant="outlined" class="mb-6">
              <v-card-title class="text-subtitle-1 bg-grey-lighten-5">
                封面圖片設定
              </v-card-title>
              <v-card-text class="pt-4">
                <v-row>
                  <v-col cols="12" md="4">
                    <v-switch
                      v-model="settings.vipFormConfig.coverImage.show"
                      color="primary"
                      label="在貴賓表單顯示封面圖片"
                      
                      inset
                    ></v-switch>
                    
                    <v-file-input
                      v-model="coverImageFile"
                      label="上傳新圖片 (1920x1080)"
                      accept="image/png, image/jpeg"
                      variant="outlined"
                      
                      prepend-icon="mdi-image"
                      :loading="isUploadingCover"
                      @click:clear="coverImageFile = null"
                    ></v-file-input>
                    <div class="text-caption text-grey-darken-1 mt-n2 mb-2">
                      建議尺寸 1920x1080 (16:9)，檔案小於 500KB。
                    </div>
                  </v-col>
                  <v-col cols="12" md="8">
                    <v-card variant="tonal" min-height="150" class="pa-2 d-flex align-center justify-center">
                      <v-img
                        v-if="tempCoverImageUrl"
                        :src="tempCoverImageUrl"
                        aspect-ratio="16/9"
                        cover
                      >
                         <v-chip
                            color="warning"
                            size="x-small"
                            class="ma-1"
                            style="position: absolute; top: 0; left: 0;"
                          >
                            待儲存
                          </v-chip>
                      </v-img>
                      <v-img
                        v-else-if="settings.vipFormConfig.coverImage.url"
                        :src="settings.vipFormConfig.coverImage.url"
                        aspect-ratio="16/9"
                        cover
                      >
                        <v-btn
                          icon="mdi-close"
                          color="red"
                          variant="flat"
                          size="x-small"
                          class="ma-1"
                          style="position: absolute; top: 0; right: 0;"
                          @click="removeCoverImage"
                          :loading="isUploadingCover"
                        ></v-btn>
                      </v-img>
                      <span v-else class="text-grey">
                        圖片預覽
                      </span>
                    </v-card>
                  </v-col>
                </v-row>
              </v-card-text>
            </v-card>

            <v-card variant="outlined" class="mb-6">
              <v-card-title class="text-subtitle-1 bg-grey-lighten-5">
                連結設定
              </v-card-title>
              <v-card-text class="pt-4">
                <v-text-field
                  v-model="settings.vipFormConfig.projectWebsiteUrl"
                  label="建案網站"
                  hint="請輸入完整的網址 (例如 https://www.example.com)"
                  persistent-hint
                  variant="outlined"
                  
                  clearable
                ></v-text-field>
              </v-card-text>
            </v-card>
            
            <v-expansion-panels v-model="vipPanel" multiple>
              <v-expansion-panel
                v-for="(field, key) in settings.vipFormFields"
                :key="key"
                :title="field.label"
              >
                <v-expansion-panel-text>
                   <v-row dense align="center">
                    <v-col cols="12" md="3">
                      <v-switch
                        v-model="field.isRequired"
                        color="primary"
                        label="是否為必填"
                        
                        inset
                      ></v-switch>
                    </v-col>
                    <v-col cols="12" md="3">
                      <v-switch
                        v-if="field.hasOwnProperty('allowCustom')"
                        v-model="field.allowCustom"
                        color="primary"
                        label="允許自訂輸入"
                        
                        inset
                      ></v-switch>
                    </v-col>
                    <v-col cols="12" md="6">
                      <v-radio-group 
                        v-model="field.selectionMode" 
                        inline 
                         
                        label="選取模式"
                        class="mt-n2"
                      >
                        <v-radio label="單選" value="single"></v-radio>
                        <v-radio label="複選" value="multiple"></v-radio>
                      </v-radio-group>
                    </v-col>
                  </v-row>
                  <v-combobox
                    v-model="field.options"
                    label="編輯選項"
                    hint="按 Enter 新增項目，點擊 X 移除項目"
                    multiple
                    chips
                    deletable-chips
                    clearable
                    variant="outlined"
                    
                  >
                  </v-combobox>
                </v-expansion-panel-text>
              </v-expansion-panel>
            </v-expansion-panels>
          </v-card-text>
        </v-card>
      </v-window-item>

      <v-window-item value="otherSettings" v-if="canManageSettings">
        <v-card>
          <v-toolbar color="brown-lighten-5" >
            <v-toolbar-title class="text-subtitle-1">
              {{ projectName }} 其他設定
            </v-toolbar-title>
            <v-spacer></v-spacer>
            <v-btn
              color="primary"
              variant="flat"
              @click="saveSettings"
              :loading="isSaving || isUploadingCover"
            >
              儲存設定
            </v-btn>
          </v-toolbar>

          <v-card-text v-if="isLoading" class="text-center pa-10">
            <v-progress-circular indeterminate color="primary"></v-progress-circular>
            <p class="mt-3 text-grey">正在載入設定...</p>
          </v-card-text>

          <v-card-text v-else class="pa-5">
            <v-row>
              <v-col cols="12" md="6">
                <v-sheet border rounded class="pa-4">
                  <p class="text-subtitle-1 font-weight-bold">客資重複提醒-櫃台</p>
                  <v-switch
                    v-model="settings.reminderSettings.counterDuplicate.lineNotify"
                    label="LINE 提醒"
                    color="primary"
                    
                    inset
                  ></v-switch>
                  <v-switch
                    v-model="settings.reminderSettings.counterDuplicate.emailNotify"
                    label="EMAIL 提醒"
                    color="primary"
                    
                    inset
                  ></v-switch>
                </v-sheet>
              </v-col>
              <v-col cols="12" md="6">
                <v-sheet border rounded class="pa-4">
                  <p class="text-subtitle-1 font-weight-bold">客資重複提醒-銷售</p>
                  <v-switch
                    v-model="settings.reminderSettings.salesDuplicate.lineNotify"
                    label="LINE 提醒"
                    color="primary"
                    
                    inset
                  ></v-switch>
                  <v-switch
                    v-model="settings.reminderSettings.salesDuplicate.emailNotify"
                    label="EMAIL 提醒"
                    color="primary"
                    
                    inset
                  ></v-switch>
                </v-sheet>
              </v-col>
            </v-row>
          </v-card-text>
        </v-card>
      </v-window-item>

      <v-window-item value="anxiSettings" v-if="isSuperAdmin">
        <v-card>
          <v-toolbar color="red-lighten-5" >
            <v-toolbar-title class="text-subtitle-1 text-red-darken-2">
              <v-icon start>mdi-cog-sync</v-icon>
              ANXI 系統設定 (限超管、系管使用)
            </v-toolbar-title>
            <v-spacer></v-spacer>
            <v-btn
              color="primary"
              variant="flat"
              @click="saveSettings"
              :loading="isSaving || isUploadingCover"
            >
              儲存設定
            </v-btn>
          </v-toolbar>

          <v-card-text v-if="isLoading" class="text-center pa-10">
            <v-progress-circular indeterminate color="primary"></v-progress-circular>
            <p class="mt-3 text-grey">正在載入設定...</p>
          </v-card-text>

          <v-card-text v-else class="pa-5">
            <v-alert
              type="warning"
              variant="tonal"
              border="start"
              
              class="mb-6"
            >
              警告：此處為高階系統設定，錯誤的修改可能導致客資系統功能（如LINE通知）失效。
            </v-alert>

            <v-text-field
              v-model="settings.anxiSystemConfig.lineCrmChannelAccessTokenSecretName"
              label="客資系統 LINE Channel Access Token 密鑰名稱"
              hint="請輸入在 Google Secret Manager 中的完整密鑰名稱 (例如：CUSTOMER_CRM_LINE_TOKEN)"
              persistent-hint
              variant="outlined"
            ></v-text-field>
          </v-card-text>
        </v-card>
      </v-window-item>

      </v-window>
  </v-container>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { useUserStore } from '@/store/user';
import { useProjectStore } from '@/store/projectStore';
import { 
  fetchCustomerSettings, 
  saveCustomerSettings,
  uploadAttachmentImage,
  deleteAttachmentImage,
  fetchCustomerList // ✓ 引入新的 API
} from '@/api'; 
import { merge } from 'lodash-es'; 

const props = defineProps({
  projectId: {
    type: String,
    required: true,
  },
});

const tab = ref('management');
const userStore = useUserStore();
const projectStore = useProjectStore();

// --- 權限 ---
const projectName = computed(() => projectStore.idToNameMap[props.projectId] || props.projectId);

const canManageSettings = computed(() => 
  userStore.hasProjectPermission('客資系統-櫃台', projectName.value)
);

const isSuperAdmin = computed(() => 
  userStore.currentUserRoles.includes('系統管理員') ||
  userStore.currentUserRoles.includes('超級管理員')
);

// ✓ 獲取當前用戶的資料 (用於 API 呼叫)
const currentUserPhone = computed(() => userStore.user?.key);
const currentUserProjectSystems = computed(() => userStore.user?.permissions?.[props.projectId]?.systems || []);


// --- 設定 Tab 邏輯 (保持不變) ---
const isLoading = ref(false); // 這是「設定頁」的 Loading
const isSaving = ref(false);
const panel = ref([]); 
const vipPanel = ref([]); 
const isUploadingCover = ref(false);
const coverImageFile = ref(null); 
const tempCoverImageUrl = ref(null);
const settings = ref({ 
  fields: {}, 
  vipFormFields: {}, 
  vipFormConfig: {},
  reminderSettings: {
    counterDuplicate: { lineNotify: false, emailNotify: false },
    salesDuplicate: { lineNotify: false, emailNotify: false }
  },
  anxiSystemConfig: {
    lineCrmChannelAccessTokenSecretName: ''
  }
}); 

// ✓ START: 新增「客戶資料管理」Tab 的狀態
const isLoadingCustomerList = ref(false); // 這是「列表頁」的 Loading
const customerListSearch = ref('');
const customerList = ref([]); // 儲存後端回傳的扁平化列表
const customerTableHeaders = ref([
  // 欄位：拜訪日期, 姓名, 電話, 購屋動機, 房型需求, 購屋預算, 銷售人員
  { title: '拜訪日期', key: '拜訪日期', width: '120px' },
  { title: '姓名', key: '姓名', width: '120px' },
  { title: '電話', key: '電話', width: '120px' },
  { title: '銷售', key: '銷售人員', width: '120px' },
  { title: '購屋動機', key: '購屋動機', width: '120px' },
  { title: '房型需求', key: '房型需求', width: '120px' },
  { title: '購屋預算', key: '購屋預算', width: '120px' },
]);
// ✓ END: 新增

// ✓ START: 新增：載入客戶列表的函式
async function loadCustomerList() {
  if (!props.projectId || !currentUserPhone.value) {
    console.warn("無法載入客戶列表：缺少 projectId 或 userPhone");
    return;
  }
  
  isLoadingCustomerList.value = true;
  try {
    const list = await fetchCustomerList(
      props.projectId, 
      currentUserPhone.value, 
      currentUserProjectSystems.value
    );
    customerList.value = list;
  } catch (error) {
    console.error("載入客戶列表失敗:", error);
    alert(`載入客戶列表失敗: ${error.message}`);
  } finally {
    isLoadingCustomerList.value = false;
  }
}
// ✓ END: 新增

// ✓ START: 新增：監聽 Tab 變化
watch(tab, (newTab) => {
  if (newTab === 'management' && customerList.value.length === 0) {
    // 第一次點擊「客戶資料管理」時載入
    loadCustomerList();
  } else if (newTab === 'settings' && Object.keys(settings.value.fields).length === 0) {
    // 第一次點擊「設定」時載入 (保持原有邏輯)
    loadSettings();
  }
}, { immediate: true }); // immediate: true 確保一開始就觸發
// ✓ END: 新增

// ✓ START: 新增：日期格式化輔助函式
function formatDisplayDate(dateString) {
  if (!dateString) return 'N/A';
  try {
    // 假設日期字串格式為 "YYYY-MM-DD"
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString; // 如果格式錯誤，返回原字串
    // 轉為 YYYY/MM/DD
    return date.toLocaleDateString('zh-TW', { year: 'numeric', month: '2-digit', day: '2-digit' });
  } catch (e) {
    return dateString; // 出錯時返回原字串
  }
}
// ✓ END: 新增

// ✓ START: 新增：Chip 顏色輔助函式 (範例)
function getChipColor(motive) {
  if (motive && motive.includes('自住')) return 'blue';
  if (motive && motive.includes('投資')) return 'green';
  if (motive && motive.includes('置產')) return 'orange';
  return 'grey';
}
// ✓ END: 新增

// --- 預設欄位結構 (保持不變) ---
const DEFAULT_SETTINGS = {
  fields: {
    gender: {
      label: "性別", order: 1, isRequired: true, allowCustom: false, selectionMode: 'single',
      options: ["男", "女"]
    },
    age: {
      label: "年齡", order: 2, isRequired: false, allowCustom: false, selectionMode: 'single',
      options: ["30以下", "31~35", "36~40", "41~45", "46~50", "51~55", "56~60", "60以上"]
    },
    visitors: {
      label: "來人(位)", order: 3, isRequired: false, allowCustom: true, selectionMode: 'single',
      options: ["1", "2", "3", "4位以上"]
    },
    interactionType: {
      label: "互動方式", order: 4, isRequired: true, allowCustom: true, selectionMode: 'single',
      options: ["現場介紹", "客戶來電", "電話", "LINE", "簡訊"]
    },
    mediaSource: {
      label: "來客媒體", order: 5, isRequired: false, allowCustom: true, selectionMode: 'single',
      options: ["接待中心", "定點", "介紹", "網路", "NP", "海報", "老客戶", "MG", "RD", "SP"]
    },
    region: {
      label: "來客區域", order: 6, isRequired: false, allowCustom: true, selectionMode: 'single',
      options: ["新竹市", "竹北", "竹東", "湖口", "新豐", "二重埔", "寶山", "芎林", "竹縣以北", "竹縣以南"]
    },
    occupation: {
      label: "職業", order: 7, isRequired: false, allowCustom: true, selectionMode: 'single',
      options: ["公務人員", "台元科技", "竹科園區", "園區外圍", "自營商", "工業區", "醫院相關", "上班族", "投資客", "家管"]
    },
  
    noPurchaseReason: {
      label: "未買原因", order: 9, isRequired: false, allowCustom: true, selectionMode: 'multiple', 
      options: ["已下訂", "還要討論比較", "預算不符", "格局不符", "座向不符", "單價不認同", "坪數太大", "坪數太小", "喜歡的戶型樓層沒了", "需要雙車位", "沒有高樓層可選", "沒有低樓層可選", "生活機能不理想", "要問神明或老師", "家人反對", "環境不喜歡"]
    },
    keyTags: {
      label: "重點標籤", order: 10, isRequired: false, allowCustom: true, selectionMode: 'multiple', 
      options: ["在意學區", "關心貸款成數", "首購", "換屋", "需雙車位", "需B1車位", "高樓層偏好", "低樓層偏好", "邊間", "衛浴開窗", "前後陽台", "採光通風", "需家人同意", "需風水老師", "急需入住", "長期置產"]
    },
    rating: {
      label: "等級研判", order: 11, isRequired: true, allowCustom: false, selectionMode: 'single',
      options: ["A意願高", "B有機會", "C需考慮", "D無希望"]
    },
    taskType: {
      label: "任務類型", order: 12, isRequired: true, allowCustom: true, selectionMode: 'single',
      options: ["電話回訪", "LINE回訪", "簡訊回訪", "寄送DM", "寄送格局圖", "提供報價單", "邀約來訪", "安排二次帶看", "提醒下訂", "提醒簽約", "追蹤貸款進度", "客變洽談", "通知驗屋", "生日祝福", "節慶問候"]
    },
    taskStatus: {
      label: "任務狀態", order: 13, isRequired: true, allowCustom: false, selectionMode: 'single',
      options: ["待處理", "已完成", "已逾期"]
    }
  },
  vipFormFields: {
    motivation: {
      label: "購屋動機", order: 1, isRequired: true, allowCustom: false, selectionMode: 'multiple', 
      options: ["自住", "投資", "贈與置產", "幫親友看房"]
    },
    roomType: {
      label: "房型需求", order: 2, isRequired: true, allowCustom: false, selectionMode: 'multiple', 
      options: ["1房", "2房", "3房", "4房", "4房以上", "店面"]
    },
    size: {
      label: "坪數需求", order: 3, isRequired: false, allowCustom: false, selectionMode: 'multiple', 
      options: ["20坪以下", "21~30坪", "31~40坪", "41~50坪", "51~60坪", "61~70坪", "71~80坪", "81~90坪", "90~100坪", "100坪以上"]
    },
    budget: {
      label: "購屋預算", order: 4, isRequired: false, allowCustom: false, selectionMode: 'single',
      options: ["3000萬以下", "3001~3500萬", "3501~4000萬", "4000萬以上"]
    },
    source: {
      label: "從何得知本建案", order: 5, isRequired: true, allowCustom: true, selectionMode: 'multiple', 
      options: ["591網站", "樂居網站", "facebook", "Instagram", "廣告看板", "親友介紹", "基地附近", "富宇已購客戶", "路過接待中心"]
    }
  },
  vipFormConfig: {
    coverImage: {
      show: true,
      url: null,
      storagePath: null
    },
    projectWebsiteUrl: null
  },
  reminderSettings: { 
    counterDuplicate: {
      lineNotify: false,
      emailNotify: false
    },
    salesDuplicate: {
      lineNotify: false,
      emailNotify: false
    }
  },
  anxiSystemConfig: { 
    lineCrmChannelAccessTokenSecretName: ''
  }
};
// --- END: 預設欄位結構 ---

// --- 載入/儲存/圖片處理 函式 (保持不變) ---

watch(coverImageFile, (newFile) => { 
  if (tempCoverImageUrl.value) {
    URL.revokeObjectURL(tempCoverImageUrl.value);
    tempCoverImageUrl.value = null;
  }
  if (newFile) { 
    tempCoverImageUrl.value = URL.createObjectURL(newFile);
  }
});

async function loadSettings() {
  if (!props.projectId) return;
  isLoading.value = true;
  try {
    const data = await fetchCustomerSettings(props.projectId);
    const cleanDefaults = JSON.parse(JSON.stringify(DEFAULT_SETTINGS));
    settings.value = merge(cleanDefaults, data);

    panel.value = Object.keys(settings.value.fields);
    vipPanel.value = Object.keys(settings.value.vipFormFields);
    
  } catch (error) {
    console.error("載入客資系統設定失敗:", error);
    alert(`載入設定失敗: ${error.message}`);
    settings.value = JSON.parse(JSON.stringify(DEFAULT_SETTINGS)); 
  } finally {
    isLoading.value = false;
  }
}

async function saveSettings(performUpload = true) {
  isSaving.value = true;
  try {
    const file = coverImageFile.value; 
    if (file && performUpload) {
      isUploadingCover.value = true;
      const oldPath = settings.value.vipFormConfig?.coverImage?.storagePath;
      if (oldPath) {
        try {
          await deleteAttachmentImage(oldPath);
        } catch (deleteError) {
          console.warn("刪除舊封面圖片失敗 (可能不存在):", deleteError.message);
        }
      }
      try {
        const { url, path } = await uploadAttachmentImage(props.projectId, file);
        settings.value.vipFormConfig.coverImage.url = url;
        settings.value.vipFormConfig.coverImage.storagePath = path;
      } catch (uploadError) {
        throw new Error(`圖片上傳失敗: ${uploadError.message}`);
      } finally {
        isUploadingCover.value = false;
        coverImageFile.value = null; 
      }
    }
    const dataToSave = { ...settings.value, projectId: props.projectId };
    await saveCustomerSettings(props.projectId, dataToSave);
    alert('設定儲存成功！');
  } catch (error) {
    console.error("儲存客資系統設定失敗:", error);
    alert(`儲存設定失敗: ${error.message}`);
  } finally {
    isSaving.value = false;
    isUploadingCover.value = false; 
  }
}

async function removeCoverImage() {
  const oldPath = settings.value.vipFormConfig?.coverImage?.storagePath;
  coverImageFile.value = null;
  settings.value.vipFormConfig.coverImage.url = null;
  settings.value.vipFormConfig.coverImage.storagePath = null;
  if (oldPath) {
    isUploadingCover.value = true; 
    try {
      await deleteAttachmentImage(oldPath);
      await saveSettings(false); 
      alert('封面圖片已移除');
    } catch (deleteError) {
      console.error("刪除封面圖片失敗:", deleteError.message);
      alert(`刪除封面圖片失敗: ${deleteError.message}`);
    } finally {
      isUploadingCover.value = false;
    }
  } else {
    await saveSettings(false);
  }
}

// 監聽 projectId 變化 (保持不變)
watch(() => props.projectId, (newId) => {
  if (newId) {
    // 當建案 ID 變化時，清空列表並重新載入
    customerList.value = [];
    if (tab.value === 'management') {
      loadCustomerList();
    }
    // (設定頁的載入會由 tab watch 處理)
    loadSettings(); // ✓ 確保建案切換時，設定頁也會更新
  }
}, { immediate: true }); // immediate: true 確保一開始就觸發

</script>