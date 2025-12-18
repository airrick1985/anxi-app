<template>
  <v-container>
    <v-tabs v-model="tab" color="primary" grow>
      <v-tab value="management">客戶資料管理</v-tab>
      <v-tab value="settings" v-if="canManageSettings">客資系統設定</v-tab>
      <v-tab value="vipSettings" v-if="canManageSettings">貴賓資料設定</v-tab>
      <v-tab value="otherSettings" v-if="canManageSettings">其他設定</v-tab>
      <v-tab value="batchUpdate" v-if="canManageSettings">客資批次更新</v-tab>
      <v-tab value="anxiSettings" v-if="isSuperAdmin">ANXI系統設定</v-tab>
      </v-tabs>

    <v-window v-model="tab">
      <v-window-item value="management">
        <v-card class="bg-grey-lighten-5 h-100">
          <v-toolbar color="white" elevation="1" density="compact">
            <v-toolbar-title class="text-subtitle-1 font-weight-bold text-grey-darken-3">
              {{ projectName }} 客戶資料列表
            </v-toolbar-title>
          </v-toolbar>

          <v-card-text>
            <v-text-field
              v-model="customerListSearch"
              label="搜尋 (姓名、電話、銷售人員...)"
              prepend-inner-icon="mdi-magnify"
              variant="outlined"
              density="compact"
              clearable
              hide-details
              class="mb-4 bg-white"
            ></v-text-field>

            <v-data-iterator
              v-if="isMobile"
              :items="customerList"
              :search="customerListSearch"
              :loading="isLoadingCustomerList"
              item-value="submittedAt"
            >
              <template v-slot:default="{ items }">
                <div v-if="isLoadingCustomerList" class="text-center pa-4">
                   <v-progress-circular indeterminate color="primary"></v-progress-circular>
                </div>
                <template v-else>
                  <v-row dense>
                    <v-col v-for="item in items" :key="item.raw.submittedAt" cols="12">
                      <v-card 
                        @click="openInteractionLog($event, { item: item.raw })" 
                        class="mb-2" 
                        elevation="1"
                        border
                      >
                        <v-card-title class="d-flex justify-space-between align-center text-body-1 font-weight-bold pb-1">
                          <div class="d-flex align-center">
                             {{ item.raw['姓名'] }}
                             <v-chip v-if="item.raw['等級研判']" :color="getRatingColor(item.raw['等級研判'])" size="x-small" class="ml-2" label variant="flat">
                               {{ item.raw['等級研判'] }}
                             </v-chip>
                          </div>
                          <span class="text-caption text-grey">{{ formatDisplayDate(item.raw['拜訪日期']) }}</span>
                        </v-card-title>
                        
                        <v-card-subtitle class="text-caption mb-2">
                          <v-icon size="small" start>mdi-phone</v-icon>{{ item.raw['電話'] }}
                          <span class="mx-1">|</span>
                          <v-icon size="small" start>mdi-account-tie</v-icon>{{ item.raw['銷售人員'] }}
                        </v-card-subtitle>
                        
                        <v-divider></v-divider>
                        
                        <v-card-text class="py-2 px-3">
                          <div class="d-flex flex-wrap gap-1 mb-1" v-if="item.raw['未買原因'] && item.raw['未買原因'].length">
                              <span class="text-caption text-grey-darken-1 mr-1">未買:</span>
                              <v-chip v-for="reason in item.raw['未買原因']" :key="reason" size="x-small" color="grey-lighten-2" variant="flat" density="comfortable">
                                {{ reason }}
                              </v-chip>
                          </div>
                          <div class="d-flex flex-wrap gap-1" v-if="item.raw['購屋動機'] && item.raw['購屋動機'].length">
                              <span class="text-caption text-grey-darken-1 mr-1">動機:</span>
                              <v-chip v-for="motive in item.raw['購屋動機']" :key="motive" :color="getChipColor(motive)" size="x-small" variant="tonal" density="comfortable">
                                {{ motive }}
                              </v-chip>
                          </div>
                        </v-card-text>
                      </v-card>
                    </v-col>
                  </v-row>
                  <div v-if="items.length === 0" class="text-center text-grey pa-4">
                    找不到符合的資料
                  </div>
                </template>
              </template>
            </v-data-iterator>

            <v-data-table
              v-else
              :headers="customerTableHeaders"
              :items="customerList"
              :loading="isLoadingCustomerList"
              :search="customerListSearch"
              item-value="submittedAt"
              class="elevation-1 cursor-pointer-row"
              @click:row="openInteractionLog"
              hover
            >
              <template v-slot:item.拜訪日期="{ item }">
                {{ formatDisplayDate(item['拜訪日期']) }}
              </template>

              <template v-slot:item.等級研判="{ item }">
                <v-chip
                  v-if="item['等級研判']"
                  :color="getRatingColor(item['等級研判'])"
                  size="small"
                  label
                  variant="flat"
                  class="font-weight-bold"
                >
                  {{ item['等級研判'] }}
                </v-chip>
              </template>

              <template v-slot:item.未買原因="{ item }">
                <div v-if="Array.isArray(item['未買原因']) && item['未買原因'].length > 0" class="text-caption text-grey-darken-2 text-truncate" style="max-width: 150px;">
                  {{ item['未買原因'].join(', ') }}
                </div>
              </template>

              <template v-slot:item.購屋動機="{ item }">
                <v-chip
                  v-if="Array.isArray(item['購屋動機']) && item['購屋動機'].length"
                  :color="getChipColor(item['購屋動機'][0])"
                  size="small"
                  label
                  variant="tonal"
                >
                  {{ item['購屋動機'][0] }}
                </v-chip>
                <span v-if="Array.isArray(item['購屋動機']) && item['購屋動機'].length > 1" class="text-caption text-grey ml-1">
                  (+{{ item['購屋動機'].length - 1 }})
                </span>
              </template>

              <template v-slot:item.房型需求="{ item }">
                <div v-if="Array.isArray(item['房型需求'])" class="text-caption">
                  {{ item['房型需求'].join(', ') }}
                </div>
              </template>
              
            </v-data-table>
              <CustomerInteractionLog
    v-if="isInteractionDialogVisible"
    v-model:show="isInteractionDialogVisible"
    :project-id="projectId"
    :doc-id="selectedCustomerDocId"
    :settings="settings"
    @data-updated="loadCustomerList"
/>
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

      <v-window-item value="batchUpdate">
        <v-container fluid class="h-100 bg-grey-lighten-5 pa-4">
          <v-row>
            <v-col cols="12" md="6">
              <v-card class="mb-4" elevation="2">
                <v-card-item>
                  <v-card-title class="text-h6 font-weight-bold text-primary">
                    <v-icon start>mdi-download</v-icon> 資料匯出 (Export)
                  </v-card-title>
                  <v-card-subtitle>下載完整客資與互動紀錄</v-card-subtitle>
                </v-card-item>
                
                <v-card-text>
                  <v-alert type="info" variant="tonal" density="compact" class="mb-4">
                    系統將產生 Excel 檔案，包含兩個工作表：<br>
                    1. <b>CustomerProfiles</b>: 客戶基本資料<br>
                    2. <b>InteractionLogs</b>: 互動歷史紀錄
                  </v-alert>
                  <v-btn 
                    block 
                    color="primary" 
                    size="large" 
                    :loading="batchState.isExporting"
                    @click="executeBatchExport"
                  >
                    下載 Excel 報表
                  </v-btn>
                </v-card-text>
              </v-card>
            </v-col>

            <v-col cols="12" md="6">
              <v-card elevation="2">
                <v-card-item>
                  <v-card-title class="text-h6 font-weight-bold text-red-darken-1">
                    <v-icon start>mdi-upload</v-icon> 資料匯入 (Import)
                  </v-card-title>
                  <v-card-subtitle>批次新增或更新資料</v-card-subtitle>
                </v-card-item>

                <v-card-text>
                  <v-alert type="warning" variant="tonal" density="compact" class="mb-4">
                    <v-icon start size="small">mdi-alert</v-icon> 
                    <b>注意：</b> 匯入將以「電話」為主鍵。<br>
                    若電話存在，系統將<b>覆蓋</b>現有資料 (包含互動紀錄)。
                  </v-alert>

                  <v-file-input
                    v-model="batchState.uploadFile"
                    label="選擇 Excel 檔案 (.xlsx)"
                    accept=".xlsx, .xls"
                    variant="outlined"
                    prepend-icon=""
                    prepend-inner-icon="mdi-file-excel"
                    show-size
                    dense
                  ></v-file-input>

                  <v-btn 
                    block 
                    color="red-darken-1" 
                    size="large"
                    :disabled="!batchState.uploadFile"
                    :loading="batchState.isImporting"
                    @click="executeBatchImport"
                  >
                    開始匯入更新
                  </v-btn>

                  <div v-if="batchState.logs.length > 0" class="mt-4 pa-2 bg-grey-lighten-4 rounded border" style="max-height: 200px; overflow-y: auto; font-size: 12px;">
                    <div v-for="(log, idx) in batchState.logs" :key="idx" :class="log.type === 'error' ? 'text-red' : 'text-success'">
                      {{ log.msg }}
                    </div>
                  </div>
                </v-card-text>
              </v-card>
            </v-col>
          </v-row>
        </v-container>
      </v-window-item>

      </v-window>

    <v-dialog v-model="batchUploadDialog" max-width="600px" persistent>
      <v-card>
        <v-card-title class="bg-primary text-white">
          <v-icon start>mdi-cloud-upload</v-icon>
          客資批次更新
        </v-card-title>
        <v-card-text class="pt-6">
          <v-alert
            type="warning"
            variant="tonal"
            class="mb-4"
            icon="mdi-alert"
            border="start"
          >
            <strong>注意：</strong> 上傳後將直接寫入資料庫。請確保 Excel 中的「電話」欄位正確無誤。
          </v-alert>

          <v-file-input
            v-model="batchUploadFile"
            label="選擇 Excel 檔案 (.xlsx)"
            accept=".xlsx, .xls"
            variant="outlined"
            density="compact"
            prepend-icon="mdi-file-excel"
            :loading="isParsingExcel"
            @update:model-value="handleBatchUploadFile"
            show-size
          ></v-file-input>

          <v-expand-transition>
            <div v-if="uploadStatusMessage">
              <v-alert
                :type="uploadStatusType"
                variant="tonal"
                class="mt-2 text-pre-wrap"
                density="compact"
              >
                {{ uploadStatusMessage }}
              </v-alert>
            </div>
          </v-expand-transition>

        </v-card-text>
        <v-card-actions class="pa-4">
          <v-spacer></v-spacer>
          <v-btn color="grey-darken-1" variant="text" @click="closeBatchUploadDialog">取消</v-btn>
          <v-btn 
            color="primary" 
            variant="flat" 
            @click="submitBatchUpdate"
            :loading="isBatchUpdating"
            :disabled="!parsedBatchData.length"
          >
            確認執行更新
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

  </v-container>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { useUserStore } from '@/store/user';
import { useProjectStore } from '@/store/projectStore';
import { useDisplay } from 'vuetify';
import * as XLSX from 'xlsx-js-style';

import { 
  collection, 
  query, 
  where, 
  getDocs, 
  doc, 
  setDoc, 
  Timestamp 
} from 'firebase/firestore';

// 請確認引入了 db 實例 (依據您的專案路徑可能有所不同，通常是這樣)
import { db } from '@/firebase';


import { 
  fetchCustomerSettings, 
  saveCustomerSettings,
  uploadAttachmentImage,
  deleteAttachmentImage,
  fetchCustomerList,
  batchUpdateCustomers,
  fetchCustomersForExport,
  fetchFullCustomersForExport,
  batchImportCustomers
} from '@/api';
import { merge } from 'lodash-es'; 
import CustomerInteractionLog from '@/components/CustomerInteractionLog.vue'; // 引入組件

const props = defineProps({
  projectId: {
    type: String,
    required: true,
  },
});

const tab = ref('management');
const userStore = useUserStore();
const projectStore = useProjectStore();

// ✅ [新增] 取得手機模式狀態
const { mobile: isMobile } = useDisplay();

// --- 權限 ---
const projectName = computed(() => projectStore.idToNameMap[props.projectId] || props.projectId);

// ===============================================
// ✅ [新增] 客資批次更新相關邏輯
// ===============================================

// ✅ [修正] 欄位對照表 (確保 Key 與後端邏輯一致)
const EXCEL_COLUMN_MAP = [
  // --- 1. 系統根目錄欄位 (後端會寫入 latestName 等) ---
  { header: '電話', key: 'phone', type: 'string', required: true },
  { header: '姓名', key: 'name', type: 'string' },
  { header: '銷售人員', key: 'salesName', type: 'string' },
  { header: '銷售人員電話', key: 'salesPhone', type: 'string' },

  // --- 2. Profile 欄位 (後端會寫入 profile Map) ---
  // 注意：這裡加上 'profile.' 前綴，解析時會自動處理
 { header: '互動方式', key: 'profile.互動方式', type: 'string' },
  { header: '來人數', key: 'profile.來人數', type: 'string' },
  { header: '等級研判', key: 'profile.rating', type: 'string' },
  { header: '重點標籤', key: 'profile.keyTags', type: 'array' },
  { header: '未買原因', key: 'profile.noPurchaseReason', type: 'array' },

  { header: '性別', key: 'profile.性別', type: 'string' }, // 保持中文Key以配合資料庫現狀
  { header: '年齡', key: 'profile.年齡', type: 'string' },
  { header: '職業', key: 'profile.職業', type: 'array' },
  { header: '任職公司', key: 'profile.任職公司', type: 'string' },
  
  { header: '居住城市', key: 'profile.居住城市', type: 'string' },
  { header: '居住鄉鎮市區', key: 'profile.居住鄉鎮市區', type: 'string' },
  { header: '居住詳細地址', key: 'profile.居住詳細地址', type: 'string' },
  
  { header: '購屋動機', key: 'profile.購屋動機', type: 'array' },
  { header: '房型需求', key: 'profile.房型需求', type: 'array' },
  { header: '坪數需求', key: 'profile.坪數需求', type: 'array' },
  { header: '購屋預算', key: 'profile.購屋預算', type: 'string' },
  { header: '從何得知本建案', key: 'profile.從何得知本建案', type: 'array' },
  
  { header: '備註', key: 'profile.備註', type: 'string' },

  // --- 3. 唯讀/不匯入欄位 (避免上傳時覆蓋錯誤) ---
  // 雖然 Excel 有這些欄位方便查看，但上傳時通常不寫入，或視為 profile 的一部分
  // 若您希望透過 Excel 更新最後洽談摘要，可保留以下設定：
  { header: '最新洽談-日期', key: 'profile.lastInteractionDate', type: 'string' }, 
  { header: '最新洽談-內容', key: 'profile.lastInteractionContent', type: 'string' },
];

// 狀態變數
const isExporting = ref(false);
const batchUploadDialog = ref(false);
const batchUploadFile = ref(null);
const isParsingExcel = ref(false);
const parsedBatchData = ref([]); // 儲存解析後的資料
const uploadStatusMessage = ref('');
const uploadStatusType = ref('info');
const isBatchUpdating = ref(false);

// 下載 Excel (修正版：針對 vipGuests 集合 + 雙 Sheet)
async function downloadCustomerExcel() {
  if (!props.projectId) return;
  isExporting.value = true;

  try {
    // 1. 直接查詢 vipGuests 集合
    // 注意：這裡假設你的集合名稱確實是 'vipGuests'
    const q = query(collection(db, 'vipGuests'), where('projectId', '==', props.projectId));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      alert("此建案目前沒有任何客資資料 (vipGuests)");
      isExporting.value = false;
      return;
    }

    const profileRows = [];
    const logRows = [];

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      // ID 格式為 projectId_phone，我們拆解或直接取用 data.phone
      const phone = data.phone || doc.id.split('_')[1] || doc.id; 
      const p = data.profile || {};

      // --- Sheet 1: 客戶資料 (Profiles) ---
      // 將 profile 內的陣列轉為字串
      const formatVal = (val) => Array.isArray(val) ? val.join(',') : (val || '');

      profileRows.push({
        '電話': phone,
        '姓名': data.latestName || formatVal(p['姓名']),
        '銷售人員': data.latestSalesName || '',
        '等級研判': formatVal(p['rating']),
        '互動方式': formatVal(p['互動方式']),
        '來人數': formatVal(p['來人數']),
        '性別': formatVal(p['性別']),
        '年齡': formatVal(p['年齡']),
        '職業': formatVal(p['職業']),
        '任職公司': formatVal(p['任職公司']),
        '居住城市': formatVal(p['居住城市']),
        '居住鄉鎮市區': formatVal(p['居住鄉鎮市區']),
        '居住詳細地址': formatVal(p['居住詳細地址']),
        '購屋動機': formatVal(p['購屋動機']),
        '房型需求': formatVal(p['房型需求']),
        '坪數需求': formatVal(p['坪數需求']),
        '購屋預算': formatVal(p['購屋預算']),
        '從何得知本建案': formatVal(p['從何得知本建案']),
        '備註': formatVal(p['備註']),
        '未買原因': formatVal(p['noPurchaseReason']),
        '重點標籤': formatVal(p['keyTags']),
        '建案ID': props.projectId // 系統識別用
      });

      // --- Sheet 2: 互動紀錄 (Interaction Logs) ---
      if (data.interactionLogs && Array.isArray(data.interactionLogs)) {
        data.interactionLogs.forEach(log => {
          logRows.push({
            '客戶電話(關聯)': phone, // 這是與 Sheet 1 關聯的 Key
            '日期': log.date || '',
            '開始時間': log.startTime || '',
            '結束時間': log.endTime || '',
            '互動類型': log.interactionType || '',
            '內容': log.content || '',
            '記錄人員': log.recorderName || '',
            '當下等級': log.rating || '',
            '訪客數': log.visitors || '',
            '未購原因': Array.isArray(log.tags?.noPurchaseReason) ? log.tags.noPurchaseReason.join(',') : '',
            '重點標籤': Array.isArray(log.tags?.keyTags) ? log.tags.keyTags.join(',') : '',
            '紀錄ID': log.logId || '' // 系統識別用
          });
        });
      }
    });

    // 2. 建立 Workbook 與 Sheets
    const wb = XLSX.utils.book_new();

    // Sheet 1: CustomerProfiles
    const wsProfile = XLSX.utils.json_to_sheet(profileRows);
    // 設定 Sheet 1 欄寬
    wsProfile['!cols'] = [
      { wch: 15 }, { wch: 12 }, { wch: 12 }, { wch: 10 }, { wch: 12 }, // 電話~互動方式
      { wch: 8 }, { wch: 6 }, { wch: 10 }, { wch: 15 }, { wch: 20 },   // 來人~任職公司
      { wch: 10 }, { wch: 10 }, { wch: 25 }, // 居住地
      { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, // 需求~預算
      { wch: 20 }, { wch: 30 } // 來源, 備註
    ];
    XLSX.utils.book_append_sheet(wb, wsProfile, "CustomerProfiles");

    // Sheet 2: InteractionLogs
    if (logRows.length > 0) {
      const wsLogs = XLSX.utils.json_to_sheet(logRows);
      // 設定 Sheet 2 欄寬
      wsLogs['!cols'] = [
        { wch: 15 }, { wch: 12 }, { wch: 10 }, { wch: 10 }, { wch: 12 }, // 電話~類型
        { wch: 50 }, // 內容 (寬一點)
        { wch: 12 }, { wch: 10 }, { wch: 8 }, // 人員~訪客數
        { wch: 20 }, { wch: 20 }, { wch: 30 } // 原因, 標籤, ID
      ];
      XLSX.utils.book_append_sheet(wb, wsLogs, "InteractionLogs");
    } else {
      // 就算沒有紀錄，也要建立一個空的 Sheet 包含標頭，避免匯入時報錯
      const emptyLogHeader = [['客戶電話(關聯)', '日期', '內容', '互動類型', '記錄人員']];
      const wsLogs = XLSX.utils.aoa_to_sheet(emptyLogHeader);
      XLSX.utils.book_append_sheet(wb, wsLogs, "InteractionLogs");
    }

    // 3. 處理檔名 (確保顯示專案名稱)
    // 嘗試從 projectStore 獲取名稱，若失敗則用 projectId
    const safeProjectName = projectStore.idToNameMap?.[props.projectId] || props.projectId;
    const dateStr = new Date().toISOString().slice(0, 10);
    const fileName = `${safeProjectName}_客資匯出_${dateStr}.xlsx`;

    // 4. 下載
    XLSX.writeFile(wb, fileName);

  } catch (error) {
    console.error("匯出 Excel 失敗:", error);
    alert(`匯出失敗: ${error.message}`);
  } finally {
    isExporting.value = false;
  }
}

function openBatchUploadDialog() {
  batchUploadDialog.value = true;
  batchUploadFile.value = null;
  parsedBatchData.value = [];
  uploadStatusMessage.value = '';
}

function closeBatchUploadDialog() {
  batchUploadDialog.value = false;
}

// 處理檔案選擇與解析
async function handleBatchUploadFile(files) {
  uploadStatusMessage.value = '';
  parsedBatchData.value = [];
  
  if (!files || (Array.isArray(files) && files.length === 0)) return;
  const file = Array.isArray(files) ? files[0] : files;

  isParsingExcel.value = true;

  const reader = new FileReader();
  reader.onload = (e) => {
        try {
            const data = new Uint8Array(e.target.result);
            const workbook = XLSX.read(data, { type: 'array' });
            const firstSheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[firstSheetName];

            // 讀取資料 (跳過第 1 列警語)
            const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1, range: 1 });

            if (jsonData.length < 1) throw new Error("檔案內容為空或格式錯誤。");

            // 取得標頭 (Excel 的第二列)
            const headers = jsonData[0].map(h => String(h || '').trim());
            const rows = jsonData.slice(1);

            if (!headers.includes('電話')) throw new Error("找不到「電話」欄位，請確保使用正確的範本。");

            const processedRows = [];
            let validCount = 0;

            rows.forEach((row) => {
                if (row.length === 0) return; // 跳過空行

                const rowData = {
                    profile: {} // 預先建立 profile 物件
                };
                let hasPhone = false;

                headers.forEach((header, colIndex) => {
                    // 找到該標頭對應的設定
                    const mapConfig = EXCEL_COLUMN_MAP.find(m => m.header === header);
                    
                    // 取得 Excel 儲存格的值
                    let cellValue = row[colIndex];

                    // 只有當設定存在且值有效時才處理
                    if (mapConfig && cellValue !== undefined && cellValue !== null && String(cellValue).trim() !== '') {
                        let strValue = String(cellValue).trim();

                        // [建議新增] 簡單處理 Excel 日期序列 (針對拜訪日期等欄位)
                      // 如果 key 是日期相關，且值是純數字 (例如 45xxx)，嘗試轉換
                      if ((mapConfig.key.includes('Date') || mapConfig.header.includes('日期')) && /^\d{5}$/.test(strValue)) {
                          // Excel 日期轉 JS Date 的簡易算法
                          const excelDate = parseInt(strValue);
                          const jsDate = new Date((excelDate - (25567 + 1)) * 86400 * 1000);
                          // 轉回 YYYY-MM-DD
                          strValue = jsDate.toISOString().split('T')[0];
                      }


                        const configKey = mapConfig.key; // 例如 'name' 或 'profile.rating'

                        // --- 邏輯 A: 處理電話 (主 Key) ---
                        if (configKey === 'phone') {
                            rowData.phone = strValue;
                            hasPhone = true;
                        }
                        
                        // --- 邏輯 B: 處理根目錄欄位 (name, salesName, salesPhone) ---
                        else if (!configKey.includes('.')) {
                            rowData[configKey] = strValue;
                        }
                        
                        // --- 邏輯 C: 處理 Profile 欄位 (profile.xxx) ---
                        else if (configKey.startsWith('profile.')) {
                            // 去除前綴，取得實際 Key (例如 'rating' 或 '購屋動機')
                            const cleanKey = configKey.split('.')[1];

                            if (mapConfig.type === 'array') {
                                // 陣列處理：逗號分隔轉陣列
                                const arrayVal = strValue.split(/[,，、]/).map(s => s.trim()).filter(Boolean);
                                rowData.profile[cleanKey] = arrayVal;
                            } else {
                                // 字串處理
                                rowData.profile[cleanKey] = strValue;
                            }
                        }
                    }
                });

                if (hasPhone) {
                    // 如果 profile 是空的，後端 merge 時不會有副作用，但也沒必要傳
                    if (Object.keys(rowData.profile).length === 0) {
                        delete rowData.profile;
                    }
                    processedRows.push(rowData);
                    validCount++;
                }
            });

            parsedBatchData.value = processedRows;
            uploadStatusType.value = 'success';
            uploadStatusMessage.value = `解析成功！共找到 ${validCount} 筆有效資料，準備上傳。`;

        } catch (error) {
            console.error("解析 Excel 失敗:", error);
            uploadStatusType.value = 'error';
            uploadStatusMessage.value = `解析失敗: ${error.message}`;
            parsedBatchData.value = [];
        } finally {
            isParsingExcel.value = false;
        }
    };
  reader.readAsArrayBuffer(file);
}

// 送出更新
async function submitBatchUpdate() {
  if (parsedBatchData.value.length === 0) return;

  isBatchUpdating.value = true;
  uploadStatusMessage.value = '正在上傳並更新資料庫，請稍候... (資料量大時可能需要一點時間)';
  uploadStatusType.value = 'info';

  try {
    const result = await batchUpdateCustomers(props.projectId, parsedBatchData.value);

    if (result.status === 'success') {
      uploadStatusType.value = 'success';
      uploadStatusMessage.value = result.message || `更新成功！共處理 ${result.processedCount} 筆資料。`;
      
      // 更新成功後，重新載入列表
      setTimeout(() => {
        closeBatchUploadDialog();
        loadCustomerList(); // 重新整理列表
      }, 1500);
    } else {
      throw new Error(result.message);
    }
  } catch (error) {
    console.error("批次更新失敗:", error);
    uploadStatusType.value = 'error';
    uploadStatusMessage.value = `更新失敗: ${error.message}`;
  } finally {
    isBatchUpdating.value = false;
  }
}

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
  { title: '拜訪日期', key: '拜訪日期', width: '110px', sortable: true },
  { title: '等級', key: '等級研判', width: '90px', sortable: true }, // 新增
  { title: '未購原因', key: '未買原因', width: '160px', sortable: false }, // 新增
  { title: '姓名', key: '姓名', width: '100px' },
  { title: '電話', key: '電話', width: '120px' },
  { title: '銷售', key: '銷售人員', width: '100px' },
  { title: '購屋動機', key: '購屋動機', width: '110px' },
  { title: '房型需求', key: '房型需求', width: '120px' },
 { title: '購屋預算', key: '購屋預算', width: '120px' }, // 空間不足可隱藏
]);
// ✓ END: 新增

const isInteractionDialogVisible = ref(false);
const selectedCustomerDocId = ref(null);

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

// 批次處理狀態管理
const batchState = ref({
  isExporting: false,
  isImporting: false,
  uploadFile: null,
  logs: [] // 紀錄匯入結果
});

// --- 輔助函式：處理 Excel 日期 ---
const parseExcelDate = (excelVal) => {
  if (!excelVal) return null;
  // 處理 Excel 序列號 (e.g. 45678)
  if (typeof excelVal === 'number') {
    const date = new Date(Math.round((excelVal - 25569) * 86400 * 1000));
    return date.toISOString().split('T')[0]; // 回傳 YYYY-MM-DD
  }
  // 處理字串 (e.g. "2025/12/16")
  return String(excelVal).replace(/\//g, '-').split('T')[0];
};

// [輔助函式] 日期格式化 (YYYY/MM/DD HH:mm:ss)
const formatDateStr = (val) => {
  if (!val) return '';
  // 支援 Firestore Timestamp (有 toDate 方法) 或一般 Date/String
  const date = val.toDate ? val.toDate() : new Date(val);
  
  if (isNaN(date.getTime())) return ''; // 無效日期回傳空

  const pad = (n) => (n < 10 ? '0' + n : n);
  const YYYY = date.getFullYear();
  const MM = pad(date.getMonth() + 1);
  const DD = pad(date.getDate());
  const HH = pad(date.getHours());
  const mm = pad(date.getMinutes());
  const ss = pad(date.getSeconds());

  return `${YYYY}/${MM}/${DD} ${HH}:${mm}:${ss}`;
};

// [主函式] 執行匯出
const executeBatchExport = async () => {
  if (!props.projectId) return alert("無專案 ID");
  batchState.value.isExporting = true;
  
  try {
    const customers = await fetchFullCustomersForExport(props.projectId, currentUserPhone.value, currentUserProjectSystems.value);

    const profileRows = []; // 客戶資料
    const logRows = [];     // 洽談紀錄
    const subRows = [];     // 系統提交紀錄 (所有欄位)

    // 解決 Invalid Date 的格式化工具
   const safeFormatDate = (dateVal) => {
  if (!dateVal) return '';
  // ✅ 修正：支援 _seconds 格式的顯示，避免 Invalid Date
  if (typeof dateVal === 'object' && dateVal._seconds !== undefined) {
    return new Date(dateVal._seconds * 1000).toLocaleString('zh-TW', { hour12: false });
  }
  const d = new Date(dateVal);
  return isNaN(d.getTime()) ? dateVal : d.toLocaleString('zh-TW', { hour12: false });
};

    // 取得時間秒數的工具 (用於精準匹配)
const getSeconds = (val) => {
  if (!val) return 0;
  // ✅ 修正：優先處理包含底線的 _seconds (資料庫原始格式)
  if (typeof val === 'object' && val._seconds !== undefined) return val._seconds;
  // 處理標準 Firebase Timestamp 物件
  if (val.seconds !== undefined) return val.seconds;
  // 處理 ISO 字串
  const d = new Date(val);
  return isNaN(d.getTime()) ? 0 : d.getTime() / 1000;
};

    customers.forEach((data) => {
      const phone = data.phone;
      const p = data.profile || {};
      const formatArr = (val) => Array.isArray(val) ? val.join(',') : (val || '');

      // --- Sheet 1: 客戶資料 ---
      const logs = data.interactionLogs || [];
      const latestLog = logs.length > 0 ? logs[logs.length - 1] : {};
      
      profileRows.push({
        '建案ID': data.projectId,
        '電話(主鍵)': phone,
        '姓名': data.latestName,
        '銷售人員': data.latestSalesName,
        '銷售人員PHONE': data.latestSalesPhone,
        '等級': latestLog.tags?.rating || '',
        '居住城市': formatArr(p['居住城市']),
        '居住區域': formatArr(p['居住鄉鎮市區']),
        '居住地址': formatArr(p['居住詳細地址']),
        '購屋預算': formatArr(p['購屋預算']),
        '房型需求': formatArr(p['房型需求']),
        '職業': formatArr(p['職業']),
        '最後更新': safeFormatDate(data.updatedAt)
      });

      // --- Sheet 2: 洽談紀錄 ---
      logs.forEach((log, idx) => {
        // ✅ 解決記錄人員電話：比對秒數匹配 submissions
        const logTime = getSeconds(log.createdAt);
        const matchedSub = (data.submissions || []).find(s => Math.abs(logTime - getSeconds(s.submittedAt)) < 2) || {};

        logRows.push({
          '客戶電話(關聯)': phone,
          '洽談日期': log.date || '',
          '互動類型': log.tags?.interactionType || '',
          '詳細內容': log.content || '',
          '記錄人員': log.recorderName || '',
          '記錄人員電話': formatArr(matchedSub['銷售人員電話']) || '', // ✅ 從 submissions 抓取
          '當下等級': log.tags?.rating || '',
          '訪客數': log.tags?.visitors || '',
          '未買原因': formatArr(log.tags?.noPurchaseReason),
          '提交時間': safeFormatDate(log.createdAt) // ✅ 修正 Invalid Date
        });
      });

      // --- Sheet 3: 系統提交紀錄 (所有欄位) ---
      (data.submissions || []).forEach(sub => {
        subRows.push({
          '客戶電話(關聯)': phone,
          '提交時間': safeFormatDate(sub.submittedAt),
          '來源': sub.submissionSource || '',
          '當時姓名': sub.姓名 || '',
          '當時銷售': sub.銷售人員 || '',
          '預算需求': formatArr(sub.購屋預算),
          '房型需求': formatArr(sub.房型需求),
          '任職公司': sub.任職公司 || ''
        });
      });
    });

    // 產生 Excel 分頁
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(profileRows), "客戶資料");
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(logRows), "洽談紀錄");
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(subRows), "系統提交紀錄");
    
    const fileName = `${projectName.value || props.projectId}_全欄位客資匯出_${new Date().toISOString().slice(0,10)}.xlsx`;
    XLSX.writeFile(wb, fileName);

  } catch (err) {
    console.error("匯出失敗:", err);
    alert('匯出發生錯誤: ' + err.message);
  } finally {
    batchState.value.isExporting = false;
  }
};

// --- 功能 B: 執行匯入 ---
const executeBatchImport = async () => {
  const file = batchState.value.uploadFile;
  const actualFile = Array.isArray(file) ? file[0] : file;
  if (!actualFile) return alert("請選擇檔案");
  
  batchState.value.isImporting = true;
  try {
    const data = await actualFile.arrayBuffer();
    const workbook = XLSX.read(data);
    
    // 支援中文分頁名稱
    const profileSheet = workbook.Sheets["客戶資料"] || workbook.Sheets["CustomerProfiles"];
    if (!profileSheet) throw new Error("找不到『客戶資料』工作表");

    const profilesRaw = XLSX.utils.sheet_to_json(profileSheet);
    const payloadCustomers = profilesRaw.map(row => ({
      phone: String(row['電話(主鍵)']).trim(),
      latestName: row['姓名'] || '',
      latestSalesName: row['銷售人員'] || '',
      latestSalesPhone: String(row['銷售人員PHONE'] || ''), // 對應寫回根目錄
      profile: {
        '姓名': [row['姓名']],
        '居住城市': [row['居住城市']],
        '居住鄉鎮市區': [row['居住區域']],
        '購屋預算': [row['購屋預算']]
      }
    }));

    await batchImportCustomers(props.projectId, payloadCustomers, 'ExcelAdminUpdate');
    alert(`成功更新 ${payloadCustomers.length} 筆客戶資料`);
    loadCustomerList();
  } catch (err) {
    alert('匯入失敗: ' + err.message);
  } finally {
    batchState.value.isImporting = false;
  }
};


// ✅ [新增] 等級顏色輔助函式
function getRatingColor(rating) {
    if (!rating) return 'grey-lighten-2';
    if (rating.includes('A')) return 'red-lighten-4 text-red-darken-4'; // A級 紅色
    if (rating.includes('B')) return 'orange-lighten-4 text-orange-darken-4'; // B級 橘色
    if (rating.includes('C')) return 'green-lighten-4 text-green-darken-4'; // C級 綠色
    if (rating.includes('D')) return 'grey-lighten-3 text-grey-darken-2'; // D級 灰色
    return 'blue-grey-lighten-4';
}

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

// ... methods
const openInteractionLog = (event, { item }) => {
    // 🔍 Debug: 先印出來看看 item 的結構
    console.log("Clicked Item:", item);

    // ✅ [修正] 嘗試從 item 或 item.raw 獲取 docId
    // Vuetify 3 的 item 有時是 Proxy 物件，資料可能在 item.columns 或 item.raw 裡
    const docId = item.docId || (item.raw && item.raw.docId);

    if (!docId) {
        console.error("錯誤：無法從列表項目中獲取 docId");
        alert("系統錯誤：找不到該客戶的文件 ID");
        return;
    }

    selectedCustomerDocId.value = docId; 
    isInteractionDialogVisible.value = true;
};

</script>

<style scoped>
/* 加入滑鼠手勢樣式 */
:deep(.cursor-pointer-row tbody tr) {
    cursor: pointer !important;
}
:deep(.cursor-pointer-row tbody tr:hover) {
    background-color: #f5f5f5 !important;
}

.text-pre-wrap {
  white-space: pre-wrap;
}

</style>