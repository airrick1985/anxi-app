<template>
  <div class="sales-control-page">
    
    <div class="toolbar d-none d-md-flex">
      <span class="toolbar-title d-none d-sm-inline">{{ pageTitle }} - {{ projectName }}</span>
       <v-btn-toggle
        v-model="displayType"
        color="primary"
        variant="outlined"
        density="compact"
        mandatory
        class="ml-4"
      >
        <v-btn value="住家">住家</v-btn>
        <v-btn value="店面">店面</v-btn>
      </v-btn-toggle>
      
      <v-spacer></v-spacer>

      <v-btn-toggle
        v-if="currentViewMode === 'sales'"
        v-model="priceDisplayMode"
        color="info"
        variant="outlined"
        density="compact"
        mandatory
        class="mr-4"
      >
        <v-btn value="list" size="small">表價</v-btn>
        <v-btn value="floor" size="small">底價</v-btn>
        <v-btn value="transaction" size="small">成交價</v-btn>
      </v-btn-toggle>

      <v-badge
        :content="itemCount"
        :model-value="itemCount > 0"
        color="error"
      >
        <v-btn 
          icon="mdi-file-document-outline"
          @click="isQuoteSidebarOpen = true"
          title="查看報價單"
        ></v-btn>
      </v-badge>
      
     

            <v-btn
        color="info"
        variant="tonal"
        class="ml-4"
        @click="handleOpenActivityMessage"
        title="最新活動訊息"
        prepend-icon="mdi-bullhorn"
      >
      
        活動訊息
      </v-btn>
      
      <!-- 🔄 NEW: 手動刷新按鈕 -->
      <v-btn
        color="blue-grey"
        variant="tonal"
        class="ml-4"
        @click="handleRefreshData"
        :loading="isRefreshing"
        title="重新載入最新資料（忽略緩存）" 
         prepend-icon="mdi-refresh"
      >
        重新載入
      </v-btn>

       <v-btn
      v-if="currentViewMode === 'sales'"
        color="info"
        variant="tonal"
        class="ml-4"
        @click="navigateToParkingControl" 
        :loading="false" title="車位銷控管理"
        prepend-icon="mdi-car-brake-parking"
      >
      車位銷控管理
      </v-btn>

      <v-btn
        v-if="currentViewMode === 'sales'"
        color="deep-purple"
        variant="tonal"
        class="ml-4"
        @click="navigateToSalesSettings"
        title="銷控設定"
        prepend-icon="mdi-cog"
      >
        銷控設定
      </v-btn>
  
      
      <v-btn
        v-if="currentViewMode === 'sales'"
        color="green"
        variant="tonal"
        class="ml-4"
        @click="exportToExcel"
        prepend-icon="mdi-file-excel"
      >
        匯出 EXCEL
      </v-btn>

      <v-btn
        v-if="currentViewMode === 'sales'"
        color="error"
        variant="tonal"
        class="ml-4"
        @click="uploadDialog = true"
        prepend-icon="mdi-upload"
      >
        上傳戶別資料
      </v-btn>
      
    </div>

   <div class="grid-wrapper">
    <div class="layout-grid">
      <div class="header-top-left"></div>
      <div ref="headerTopRef" class="header-top-container">
        <div v-for="building in buildingHeaders" :key="building" class="header-cell">
          {{ building }}
        </div>
      </div>

      <div ref="headerLeftRef" class="header-left-container">
        <div v-for="floor in floorHeaders" :key="floor" class="header-cell">
          {{ floor }}F
        </div>
      </div>

      <div ref="mainGridRef" @scroll="handleScroll" class="main-grid-container">
        <div class="grid-table">
          <div v-for="item in flatGridData" :key="item.key" class="data-cell">
            <div v-if="item.data"
              class="unit-card"
              :class="{ 'in-quote': quoteStore.isItemInQuote(item.data.unitId) }"
              :style="{ backgroundColor: statusColorMap.get(item.data[statusField]) || '#ffffff' }"
              @click="openUnitDetail(item.data)"
            >
              <span class="unit-name">{{ item.data.unitId }}</span>
              <template v-if="statusField === 'salesStatus_quote' && item.data.salesStatus_quote === '已售'">
                <span class="unit-total-price sold-text">已售</span>
                <span class="unit-area">{{ item.data.area_house_ping }} 坪</span>
                <span class="unit-per-price"></span>
              </template>
              <template v-else>
                <span class="unit-total-price">{{ getDisplayTotalPrice(item.data) }} 萬</span>
                <span class="unit-area">{{ item.data.area_house_ping }} 坪</span>
                <span class="unit-per-price">{{ calculateUnitPrice(item.data) }} 萬/坪</span>
              </template>
            </div>
            <div v-else class="unit-card empty"></div>
          </div>
        </div>
      </div>
    </div>
     </div>

   <v-bottom-navigation
      v-if="isMobile"
      :active="true"
      color="primary"
      app
    >
      <v-btn @click="isQuoteSidebarOpen = true">
        <v-badge
          :content="itemCount"
          :model-value="itemCount > 0"
          color="error"
        >
          <v-icon>mdi-file-document-outline</v-icon>
        </v-badge>
        <span>報價單</span>
      </v-btn>

      <v-btn 
        @click="navigateToParkingControl" 
        :loading="isLoadingSlide"> 
        <v-icon>mdi-parking</v-icon>
        <span>車位表</span>
      </v-btn>

      <v-menu top>
        <template v-slot:activator="{ props }">
          <v-btn v-bind="props">
            <v-icon>mdi-home-city-outline</v-icon>
            <span>{{ displayType }}</span>
          </v-btn>
        </template>
        <v-list>
          <v-list-item @click="displayType = '住家'">
            <v-list-item-title>住家</v-list-item-title>
          </v-list-item>
          <v-list-item @click="displayType = '店面'">
            <v-list-item-title>店面</v-list-item-title>
          </v-list-item>
        </v-list>
      </v-menu>
      
      <v-menu top v-if="currentViewMode === 'sales'">
        <template v-slot:activator="{ props }">
          <v-btn v-bind="props">
            <v-icon>mdi-currency-usd</v-icon>
            <span>{{ priceDisplayLabel }}</span>
          </v-btn>
        </template>
        <v-list>
          <v-list-item @click="priceDisplayMode = 'list'">
            <v-list-item-title>顯示表價</v-list-item-title>
          </v-list-item>
          <v-list-item @click="priceDisplayMode = 'floor'">
            <v-list-item-title>顯示底價</v-list-item-title>
          </v-list-item>
          <v-list-item @click="priceDisplayMode = 'transaction'">
            <v-list-item-title>顯示成交價</v-list-item-title>
          </v-list-item>
        </v-list>
      </v-menu>

      <v-menu top v-if="currentViewMode === 'sales'">
        <template v-slot:activator="{ props }">
          <v-btn v-bind="props">
            <v-icon>mdi-dots-vertical</v-icon>
            <span>更多</span>
          </v-btn>
        </template>
        <v-list>
          <!-- 🔄 NEW: 手機版刷新按鈕 -->
          <v-list-item @click="handleRefreshData" :loading="isRefreshing">
            <template v-slot:prepend>
              <v-icon color="blue-grey">mdi-refresh</v-icon>
            </template>
            <v-list-item-title>重新載入資料</v-list-item-title>
          </v-list-item>
          <v-divider></v-divider>
          
          <v-list-item @click="exportToExcel">
            <template v-slot:prepend>
              <v-icon color="green">mdi-file-excel</v-icon>
            </template>
            <v-list-item-title>匯出 EXCEL</v-list-item-title>
          </v-list-item>
           <v-list-item @click="uploadDialog = true">
            <template v-slot:prepend>
              <v-icon color="error">mdi-upload</v-icon>
            </template>
            <v-list-item-title>上傳戶別資料</v-list-item-title>
          </v-list-item>
          <v-divider></v-divider>
          <v-list-item @click="handleOpenActivityMessage">
            <template v-slot:prepend>
              <v-icon>mdi-bullhorn-outline</v-icon>
            </template>
            <v-list-item-title>活動訊息</v-list-item-title>
          </v-list-item>
          <v-list-item @click="navigateToSalesSettings">
            <template v-slot:prepend>
              <v-icon>mdi-cog-outline</v-icon>
            </template>
            <v-list-item-title>銷控設定</v-list-item-title>
          </v-list-item>
        </v-list>
      </v-menu>

    </v-bottom-navigation>

    <UnitDetailModal 
      v-if="isModalVisible"
      v-model:show="isModalVisible" 
      :unit-data="selectedUnitData"
      :view-mode="currentViewMode"
      :project-name="project.name"
      :project-id="projectId"
      :all-data="allDataForModal"
      @request-open-slide="handleOpenSlideViewer" />

    <QuoteSidebar v-model:isOpen="isQuoteSidebarOpen" />

    <v-dialog v-model="isSlideDialogVisible" fullscreen hide-overlay transition="dialog-bottom-transition">
      <v-card class="d-flex flex-column">
        <v-toolbar dark color="primary" density="compact">
          <v-btn icon dark @click="isSlideDialogVisible = false">
            <v-icon>mdi-close</v-icon>
          </v-btn>
          <v-toolbar-title>車位表</v-toolbar-title>
          <v-spacer></v-spacer>
          <v-btn 
            v-if="currentViewMode === 'sales'"
            prepend-icon="mdi-table-edit"
            @click="navigateToParkingControl"
            variant="tonal"
          >
            車位銷控管理
          </v-btn>
          <v-btn 
            icon 
            dark 
            @click="handleRefreshSlide"
            :disabled="isLoadingSlide"
          >
            <v-icon>mdi-refresh</v-icon>
          </v-btn>
        </v-toolbar>
        <div class="flex-grow-1" style="position: relative;">
          <v-overlay
            :model-value="isLoadingSlide"
            class="align-center justify-center"
            persistent
            scrim="rgba(0, 0, 0, 0.6)"
          >
            <div class="text-center">
              <v-progress-circular indeterminate color="#008cff" size="64"></v-progress-circular>
              <p class="mt-4 text-body-1 text-blcak">正在載入最新車位表...</p>
            </div>
          </v-overlay>
          <div v-if="isContentLoaded" class="fill-height">
            <iframe
              v-if="slideEmbedUrl"
              :src="slideEmbedUrl"
              frameborder="0"
              width="100%"
              height="100%"
              allowfullscreen="true"
              style="display: block;"
            ></iframe>
            <div v-else class="d-flex flex-column justify-center align-center fill-height">
              <v-icon size="80" color="grey-lighten-1">mdi-alert-circle-outline</v-icon>
              <p class="mt-4 text-h6 text-grey">無法載入車位表</p>
              <p class="text-body-1 text-grey">點擊右上角關閉按鈕，或手動重新整理。</p>
            </div>
          </div>
        </div>
      </v-card>
    </v-dialog>
    
    <v-dialog v-model="isActivityDialogVisible" fullscreen hide-overlay transition="dialog-bottom-transition">
      <v-card class="d-flex flex-column">
        <v-toolbar dark color="teal" density="compact">
          <v-btn icon dark @click="isActivityDialogVisible = false">
            <v-icon>mdi-close</v-icon>
          </v-btn>
          <v-toolbar-title>活動訊息</v-toolbar-title>
        </v-toolbar>
        <div class="flex-grow-1" style="position: relative;">
          <v-overlay
            :model-value="isActivityLoading"
            class="align-center justify-center"
            persistent
            scrim="rgba(0, 0, 0, 0.6)"
          >
            <div class="text-center">
              <v-progress-circular indeterminate color="#008cff" size="64"></v-progress-circular>
              <p class="mt-4 text-body-1">正在載入活動訊息...</p>
            </div>
          </v-overlay>
          <div v-if="!isActivityLoading" class="fill-height">
            <iframe
              v-if="activitySlideEmbedUrl"
              :src="activitySlideEmbedUrl"
              frameborder="0"
              width="100%"
              height="100%"
              allowfullscreen="true"
              style="display: block;"
            ></iframe>
            <div v-else class="d-flex flex-column justify-center align-center fill-height">
              <v-icon size="80" color="grey-lighten-1">mdi-alert-circle-outline</v-icon>
              <p class="mt-4 text-h6 text-grey">無法載入活動訊息</p>
              <p class="text-body-1 text-grey">請確認後台是否已設定活動訊息 SLIDE ID。</p>
            </div>
          </div>
        </div>
      </v-card>
    </v-dialog>

    <!-- 移除 ParkingControl 的 v-dialog -->
    <!-- 
    <v-dialog v-model="isParkingControlDialogVisible" fullscreen hide-overlay transition="dialog-bottom-transition">
        <ParkingControl @close="isParkingControlDialogVisible = false" />
    </v-dialog>
    -->

    <v-dialog v-model="uploadDialog" max-width="600px" persistent>
      <v-card>
            <v-card-title class="bg-red-darken-2">
          <span class="text-h5">上傳 Excel 更新戶別資料</span>
        </v-card-title>
        <v-card-text class="pt-4">
          <v-alert
            type="warning"
            color="error"
            variant="tonal"
            class="mb-4"
            title="重要提示"
            text="上傳的 Excel 將會根據「戶別」覆蓋現有資料。為避免資料遺失，強烈建議您先匯出目前的資料作為備份。"
          ></v-alert>

          <v-btn 
            color="green" 
            @click="exportToExcel" 
            block 
            class="mb-6"
            prepend-icon="mdi-download"
          >
            匯出目前戶別資料 (備份)
          </v-btn>

          <v-file-input
            v-model="uploadedFile"
            label="選擇 Excel 檔案"
            accept=".xlsx, .xls"
            variant="outlined"
            density="compact"
            :loading="isParsing"
            @change="handleFileChange"
          ></v-file-input>

          <v-alert
            v-if="uploadMessage"
            :type="uploadMessageType"
            variant="tonal"
            class="mt-4 pre-wrap-alert" 
            density="compact"
          >
            {{ uploadMessage }}
          </v-alert>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="grey" variant="text" @click="closeUploadDialog">取消</v-btn>
          <v-btn 
            color="error" 
            variant="flat" 
            @click="uploadData" 
            :loading="isUploading"
            :disabled="parsedData.length === 0"
          >
            確認上傳
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- 🔄 載入狀態顯示 -->
    <div v-if="loading || error" class="status-overlay">
      <div v-if="loading" class="loading-container">
        <span class="loader"></span>
        <p class="loading-text">正在載入銷控資料...</p>
        <p v-if="salesDataStore.isCacheValid(projectId)" class="cache-hint">
          📦 使用緩存數據快速載入中...
        </p>
      </div>
      <p v-if="error" class="error-text">錯誤: {{ error }}</p>
    </div>

    <!-- 🛠️ 開發模式：緩存統計顯示 -->
    <div v-if="isDevelopment && !loading" class="dev-cache-stats">
      <v-expansion-panels variant="accordion" density="compact">
        <v-expansion-panel>
          <v-expansion-panel-title>
            <v-icon start color="info">mdi-database-outline</v-icon>
            緩存統計 ({{ salesDataStore.getCacheStats.cacheHitRate }} 命中率)
          </v-expansion-panel-title>
          <v-expansion-panel-text>
            <div class="cache-stats-content">
              <div class="stats-row">
                <span>📊 總緩存項目：{{ salesDataStore.getCacheStats.totalCached }}</span>
                <span>🔄 活躍監聽器：{{ salesDataStore.getCacheStats.activeListeners }}</span>
              </div>
              <div class="stats-row">
                <span>✅ 健康監聽器：{{ salesDataStore.getCacheStats.healthyListeners }}</span>
                <span>❌ 錯誤監聽器：{{ salesDataStore.getCacheStats.errorListeners }}</span>
              </div>
              <div class="stats-row">
                <span>🎯 緩存命中：{{ salesDataStore.getCacheStats.performance.cacheHits }}</span>
                <span>📤 緩存未命中：{{ salesDataStore.getCacheStats.performance.cacheMisses }}</span>
              </div>
            </div>
          </v-expansion-panel-text>
        </v-expansion-panel>
      </v-expansion-panels>
    </div>
  </div>
</template>


<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useSystemPresence } from '@/composables/useSystemPresence'; // ✅ 1. 匯入 Composable

//  新增：引入上傳 API 和 toast
import { uploadHouseholds } from '@/api';
import { useToast } from 'vue-toastification';

// ===============================================
// 🚀 NEW: 引入智能緩存 Store
// ===============================================
import { useSalesDataStore } from '@/store/salesDataStore';
import * as XLSX from 'xlsx-js-style';
import UnitDetailModal from '@/components/UnitDetailModal.vue';
import { useQuoteStore } from '@/store/quoteStore';
import { useSlideViewer } from '@/composables/useSlideViewer';
import QuoteSidebar from '@/components/QuoteSidebar.vue';
import { useDisplay } from 'vuetify';
// import ParkingControl from './ParkingControl.vue'; // 不再需要，因為改為路由導覽
import UpdateControl from './UpdateControl.vue'; 

//  新增：定義 EXCEL 匯出/上傳的欄位
const COLUMN_DEFINITIONS = [
    { key: 'building', title: '棟別' },
    { key: 'floor', title: '樓層' },
    { key: 'unitId', title: '戶別' },
    { key: 'layout', title: '格局' },
    { key: 'salesStatus_backend', title: '銷控後台狀態' },
    { key: 'salesStatus_quote', title: '報價系統狀態' },
    { key: 'buyerName', title: '買方姓名' },
    { key: 'buyerPhone', title: '買方電話' },
    //  新增：詳細買方資料欄位
    { key: 'buyerIdNumber', title: '身分證字號' },
    { key: 'buyerDateOfBirth', title: '出生年月日' },
    { key: 'buyerEmail', title: 'EMAIL' },
    { key: 'buyerMailingAddressCity', title: '通訊地址_縣市' },
    { key: 'buyerMailingAddressDistrict', title: '通訊地址_區域' },
    { key: 'buyerMailingAddressDetail', title: '通訊地址_詳細' },
    { key: 'buyerPermanentAddressCity', title: '戶籍地址_縣市' },
    { key: 'buyerPermanentAddressDistrict', title: '戶籍地址_區域' },
    { key: 'buyerPermanentAddressDetail', title: '戶籍地址_詳細' },
    { key: 'buyerGender', title: '性別' },
    { key: 'buyerMaritalStatus', title: '婚姻狀況' },
    { key: 'buyerOccupationIndustry', title: '行業別' },
    { key: 'buyerOccupationTitle', title: '職務' },
    { key: 'buyerPurchasePurpose', title: '購買用途' },
    { key: 'buyerHasPurchasedFuyu', title: '已購買富宇房子' },
    { key: 'buyerEmergencyContactName', title: '緊急聯絡人' },
    { key: 'buyerEmergencyContactPhone', title: '緊急聯絡人電話' },
    { key: 'buyerEmergencyContactRelationship', title: '緊急聯絡人關係' },
    { key: 'referrerName', title: '介紹人姓名' },
    { key: 'referrerPhone', title: '介紹人電話' },
    // --- 原有欄位 ---
    { key: 'salesperson', title: '銷售人員' },
    { key: 'contractType', title: '合約方式' },
    { key: 'isFirstTimeBuyer', title: '是否首購' },
    // --- 面積與價格欄位 ---
    { key: 'area_house_sqm', title: '房屋面積(平方公尺)' },
    { key: 'area_house_ping', title: '房屋面積(坪)' },
    { key: 'area_main_sqm', title: '主建物面積(平方公尺)' },
    { key: 'area_main_ping', title: '主建物面積(坪)' },
    { key: 'area_ancillary_sqm', title: '附屬建物面積(平方公尺)' },
    { key: 'area_ancillary_ping', title: '附屬建物面積(坪)' },
    { key: 'area_common_sqm', title: '共用部分面積(平方公尺)' },
    { key: 'area_common_ping', title: '共用部分面積(坪)' },
    { key: 'area_terrace_ping', title: '露臺(坪)' },
    { key: 'common_area_ratio', title: '公設比' },
    { key: 'land_share_sqm', title: '土地持分面積(平方公尺)' },
    { key: 'land_share_ping', title: '土地持分面積(坪)' },
    { key: 'land_share_ratio', title: '土地持分' },
    { key: 'price_list_house_only', title: '房屋表價' },
    { key: 'price_list_terrace', title: '露臺表價' },
    { key: 'price_list_terrace_unit', title: '露臺單價(表價)' },
    { key: 'price_list_ancillary', title: '其他附屬表價' },
    { key: 'price_list_house_total', title: '房屋總表價' },
    { key: 'price_floor_house_only', title: '房屋底價' },
    { key: 'price_floor_terrace', title: '露臺底價' },
    { key: 'price_floor_ancillary', title: '其他附屬底價' },
    { key: 'price_floor_house_total', title: '房屋總底價' },
    { key: 'price_transaction_house', title: '房屋成交價' }, 
    { key: 'price_package_deal', title: '配套房屋總價' },
    { key: 'price_package', title: '配套價格' },
    // --- 其他欄位 ---
    { key: 'payment_deposit_date', title: '小訂日期' },
    { key: 'payment_supplement_date', title: '補足日期' },
    { key: 'payment_contract_date', title: '簽約日期' },
    { key: 'payment_deposit_amount', title: '小訂金額' },
    { key: 'payment_supplement_amount', title: '補足金額' },
    { key: 'payment_contract_amount', title: '簽約金額' },
    { key: 'remarks', title: '備註' },
    { key: 'salesImages', title: '戶別圖片' },
    { key: 'svgName', title: 'SVG圖檔' },
    { key: 'driveFolderUrl', title: '戶別資料夾位置' },
];

//  新增：從唯一定義來源，動態產生所有需要的變數
const exportableColumns = computed(() => COLUMN_DEFINITIONS.filter(c => c.exportable !== false));
const fieldMapping = computed(() => Object.fromEntries(exportableColumns.value.map(col => [col.key, col.title])));
const chineseHeaders = computed(() => exportableColumns.value.map(c => c.title));
const exportOrder = computed(() => exportableColumns.value.map(c => c.key));


// const isParkingControlDialogVisible = ref(false); // 不再需要
const { mobile: isMobile } = useDisplay();
const router = useRouter();
const quoteStore = useQuoteStore();
const route = useRoute();
const toast = useToast();

// ===============================================
// 🚀 NEW: 初始化智能緩存 Store
// ===============================================
const salesDataStore = useSalesDataStore(); 

// ✅ 2. 呼叫 Composable，傳入必要的參數
const projectIdForPresence = computed(() => route.params.projectName);
const systemNameForPresence = computed(() => route.meta.viewMode === 'quote' ? '報價系統' : '銷控系統');
useSystemPresence(projectIdForPresence.value, systemNameForPresence.value);

const { 
  isSlideDialogVisible, 
  slideEmbedUrl, 
  isLoadingSlide,
  isContentLoaded,
  openSlideViewer, 
  refreshSlide
} = useSlideViewer();

// ===============================================
// 📊 State Management (Updated to use Store)
// ===============================================
const loading = ref(true);
const error = ref(null);

// 🔄 NEW: 使用 Store 的緩存數據替代本地 refs
// 這些 computed 屬性會自動響應 Store 中的數據變化
const projectData = computed(() => salesDataStore.getProjectData(projectId.value));
const project = computed(() => projectData.value.project);
const salesParameters = computed(() => projectData.value.parameters);
const salesHouseholds = computed(() => projectData.value.households);
const salesParkings = computed(() => projectData.value.parkings);
const salesImages = computed(() => projectData.value.images);

// 🎯 Performance: 手動刷新功能
const isRefreshing = ref(false);

// 🛠️ 開發模式檢查
const isDevelopment = computed(() => import.meta.env.DEV);



const headerTopRef = ref(null);
const headerLeftRef = ref(null);
const mainGridRef = ref(null);
const isModalVisible = ref(false);
const selectedUnitData = ref(null);
const isQuoteSidebarOpen = ref(false);
const displayType = ref('住家');
const priceDisplayMode = ref('list');

const isActivityDialogVisible = ref(false);
const isActivityLoading = ref(false);

//  新增：上傳相關 state
const uploadDialog = ref(false);
const uploadedFile = ref(null);
const parsedData = ref([]);
const isParsing = ref(false);
const isUploading = ref(false);
const uploadMessage = ref('');
const uploadMessageType = ref('success');

//  新增一個 computed 屬性，將 modal 需要的所有資料打包
const allDataForModal = computed(() => {
  // 🛠️ DEBUG: 添加調試信息
  if (import.meta.env.DEV) {
    console.log('📊 [SalesControlSystem] Modal 數據準備:', {
      參數數量: salesParameters.value.length,
      車位數量: salesParkings.value.length,
      銷控圖片數量: salesImages.value.length,
      銷控圖片樣本: salesImages.value.slice(0, 3).map(img => ({
        imageName: img.imageName,
        hasDownloadURL: !!img.downloadURL
      }))
    });
  }

  return {
    '參數': salesParameters.value,
    '車位': salesParkings.value,
    '銷控圖片': salesImages.value,
    // 未來如果 modal 需要其他資料，也可以從這裡加入
  };
});

const activitySlideEmbedUrl = computed(() => {
  const slideId = project.value.activityMessageSlideId;
  if (!slideId) return '';
  return `https://docs.google.com/presentation/d/${slideId}/embed?start=true&loop=true&delayms=3000`;
});

// --- Computed Properties ---
const projectId = computed(() => route.params.projectName);
const currentViewMode = computed(() => route.meta.viewMode || 'sales');
const pageTitle = computed(() => (currentViewMode.value === 'quote' ? '報價系統' : '銷控系統') + ` (${displayType.value})`);
const itemCount = computed(() => quoteStore.itemCount);
const projectName = computed(() => project.value.name);

const filteredHouseholds = computed(() => {
  if (displayType.value === '店面') {
    return salesHouseholds.value.filter(item => item.layout === '店面');
  }
  return salesHouseholds.value.filter(item => item.layout !== '店面');
});

const buildingHeaders = computed(() => {
  const buildings = new Set(filteredHouseholds.value.map(item => item.building));
  return Array.from(buildings).sort((a, b) => String(a).localeCompare(String(b), undefined, { numeric: true, sensitivity: 'base' }));
});

const floorHeaders = computed(() => {
  const floors = new Set(filteredHouseholds.value.map(item => parseInt(item.floor, 10)));
  return Array.from(floors).sort((a, b) => b - a);
});

const gridData = computed(() => {
  const dataMap = {};
  for (const household of filteredHouseholds.value) {
    const floor = household.floor;
    const building = household.building;
    if (!dataMap[floor]) dataMap[floor] = {};
    dataMap[floor][building] = household;
  }
  return dataMap;
});

const flatGridData = computed(() => {
  const items = [];
  floorHeaders.value.forEach(floor => {
    buildingHeaders.value.forEach(building => {
      items.push({
        key: `${floor}-${building}`,
        data: gridData.value[floor]?.[building] || null,
      });
    });
  });
  return items;
});

const statusField = computed(() => currentViewMode.value === 'quote' ? 'salesStatus_quote' : 'salesStatus_backend');

const statusColorMap = computed(() => {
  const map = new Map();
  salesParameters.value.forEach(item => {
    map.set(item.statusName, item.colorCode);
  });
  return map;
});

const priceDisplayLabel = computed(() => {
  if (priceDisplayMode.value === 'list') return '表價';
  if (priceDisplayMode.value === 'floor') return '底價';
  if (priceDisplayMode.value === 'transaction') return '成交價';
  return '價格';
});

// --- Methods ---
const getDisplayTotalPrice = (itemData) => {
  const formatPrice = (price) => Math.round(price || 0);

  if (currentViewMode.value !== 'sales') {
    return formatPrice(itemData.price_list_house_total);
  }
  switch (priceDisplayMode.value) {
    case 'floor':
      return formatPrice(itemData.price_floor_house_total || itemData.price_list_house_total);
    case 'transaction':
      const canShow = ['小訂', '補足', '簽約'].includes(itemData.salesStatus_backend) && itemData.price_transaction_house;
      return canShow ? formatPrice(itemData.price_transaction_house) : formatPrice(itemData.price_list_house_total);
    default: // list
      return formatPrice(itemData.price_list_house_total);
  }
};

const calculateUnitPrice = (itemData) => {
  const totalPriceInWan = parseFloat(getDisplayTotalPrice(itemData));
  const area = parseFloat(itemData.area_house_ping);
  if (isNaN(totalPriceInWan) || isNaN(area) || area === 0) return '-';
  return (totalPriceInWan / area).toFixed(1);
};

function handleScroll(event) {
  if (headerTopRef.value) headerTopRef.value.scrollLeft = event.target.scrollLeft;
  if (headerLeftRef.value) headerLeftRef.value.scrollTop = event.target.scrollTop;
}

function openUnitDetail(unitData) {
  if (unitData) {
    selectedUnitData.value = { ...unitData };
    isModalVisible.value = true;
  }
}

function handleOpenSlideViewer() {
  const slideId = currentViewMode.value === 'quote' ? project.value.parkingSlideId_quote : project.value.parkingSlideId_sales;
  openSlideViewer(slideId);
}

function handleRefreshSlide() {
  refreshSlide(currentViewMode.value);
}

function handleOpenActivityMessage() {
  isActivityLoading.value = true;
  isActivityDialogVisible.value = true;
  
  setTimeout(() => {
    isActivityLoading.value = false;
  }, 1200);
}

function navigateToSalesSettings() {
  if (projectId.value) {
    router.push({
      name: 'SalesSettings',
      params: { projectId: projectId.value }
    });
  }
}

// 新增：導覽至車位銷控管理頁面
function navigateToParkingControl() {
  if (projectId.value) {
    router.push({
      name: 'ParkingControl',
      params: { projectId: projectId.value }
    });
  }
}

// ===============================================
// 🔄 NEW: 手動刷新功能
// ===============================================

/**
 * 手動刷新銷控資料
 * 強制從 Firestore 重新載入最新數據，忽略緩存
 */
const handleRefreshData = async () => {
  console.log('🔄 [Manual Refresh] 用戶要求刷新數據');
  
  isRefreshing.value = true;
  
  try {
    // 強制刷新：忽略緩存，直接從 Firestore 載入最新數據
    await salesDataStore.loadProjectData(projectId.value, true);
    
    toast.success('✅ 資料已更新到最新版本');
    console.log(`✅ [Manual Refresh] 刷新完成，戶別數量: ${salesHouseholds.value.length}`);
    
  } catch (err) {
    toast.error('❌ 資料更新失敗: ' + err.message);
    console.error('❌ [Manual Refresh] 刷新失敗:', err);
  } finally {
    isRefreshing.value = false;
  }
};

// ===============================================
// 🚀 Lifecycle Hooks (智能緩存版本)
// ===============================================

onMounted(async () => {
  console.log('🏗️ [SalesControlSystem] 開始載入銷控資料...');
  
  // 清理報價數據
  quoteStore.clearQuote();
  loading.value = true;
  
  try {
    // ⚡ 使用智能緩存載入數據（30分鐘緩存 + 即時監聽）
    // 如果5分鐘內重新進入此頁面，將使用緩存數據，載入速度提升90%+
    await salesDataStore.loadProjectData(projectId.value);
    
    console.log(`✅ [SalesControlSystem] 數據載入完成，戶別數量: ${salesHouseholds.value.length}`);
    
    // 開發模式下顯示緩存統計
    if (import.meta.env.DEV) {
      const stats = salesDataStore.getCacheStats;
      console.group('📊 銷控系統緩存統計');
      console.log('Cache Hit Rate:', stats.cacheHitRate);
      console.log('Active Listeners:', stats.activeListeners);
      console.log('Cache Details:', stats.cacheDetails);
      console.groupEnd();
    }
    
  } catch (err) {
    error.value = `讀取銷控資料時發生錯誤: ${err.message}`;
    console.error('❌ [SalesControlSystem] 銷控資料載入失敗:', err);
    
    // 嘗試顯示緩存的數據（如果有的話）
    if (salesDataStore.getProjectData(projectId.value).households.length > 0) {
      console.log('⚠️ [SalesControlSystem] 使用緩存數據作為備用');
      error.value = null; // 清除錯誤，因為我們有備用數據
    }
  } finally {
    loading.value = false;
  }
});

onUnmounted(() => {
  console.log('🧹 [SalesControlSystem] 組件卸載');
  
  // 注意：我們不立即清理緩存，這樣用戶再次進入時可以使用緩存
  // 緩存會在30分鐘後自動過期，或者可以通過手動刷新強制更新
  
  // 如果需要立即清理特定項目的緩存，取消註釋下面這行：
  // salesDataStore.clearProjectData(projectId.value);
});


// 新增：匯出與上傳相關的所有方法
const exportToExcel = () => {
    // 確保無論當前顯示的是「住家」還是「店面」，都能匯出完整的戶別資料。
    if (salesHouseholds.value.length === 0) {
        toast.info('目前沒有資料可匯出。');
        return;
    }
    const sortedItems = [...salesHouseholds.value].sort((a, b) => {
        const buildingCompare = String(a.building).localeCompare(String(b.building), 'zh-TW', { numeric: true });
        if (buildingCompare !== 0) return buildingCompare;
        return String(a.unitId).localeCompare(String(b.unitId), 'zh-TW', { numeric: true });
    });

    const dataAsArray = sortedItems.map(item => {
        return exportOrder.value.map(key => {
            const value = item[key];
            if (key === 'salesImages' && Array.isArray(value)) {
                return value.join(','); // 將圖片陣列轉成逗號分隔的字串
            }
            if (value instanceof Date) {
                return value.toISOString().split('T')[0];
            }
            if (typeof value === 'boolean') {
                return value ? 'TRUE' : 'FALSE';
            }
            if (value && typeof value.toDate === 'function') { // Firestore Timestamp
                return value.toDate().toISOString().split('T')[0];
            }
            return value;
        });
    });

    const warningRow = ['注意：為確保資料能正確重新上傳，請勿修改第二列的標頭名稱。'];
    const dataWithHeader = [warningRow, chineseHeaders.value, ...dataAsArray];
    const ws = XLSX.utils.aoa_to_sheet(dataWithHeader);

    const warningStyle = { font: { color: { rgb: "FFFF0000" }, bold: true }, fill: { fgColor: { rgb: "FFFFFF00" } } };
    ws['A1'].s = warningStyle;
    
    if (!ws['!merges']) ws['!merges'] = [];
    ws['!merges'].push({ s: { r: 0, c: 0 }, e: { r: 0, c: exportOrder.value.length - 1 } });

    const headerStyle = { font: { bold: true }, fill: { fgColor: { rgb: "FFD3D3D3" } } };
    const range = XLSX.utils.decode_range(ws['!ref']);
    for (let C = range.s.c; C <= range.e.c; ++C) {
        const address = XLSX.utils.encode_cell({ r: 1, c: C });
        if(ws[address]) ws[address].s = headerStyle;
    }
    ws['!freeze'] = { ySplit: 2 };
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, '戶別資料');
    const exportFileName = projectName.value || 'unknown-project';
    XLSX.writeFile(wb, `${exportFileName}_戶別資料備份_${new Date().toISOString().slice(0, 10)}.xlsx`);
};

const closeUploadDialog = () => {
    uploadDialog.value = false;
    uploadedFile.value = null;
    parsedData.value = [];
    uploadMessage.value = '';
};

const handleFileChange = () => {
    uploadMessage.value = ''; 
    const file = uploadedFile.value;
    if (!file) {
        parsedData.value = [];
        return;
    }
    isParsing.value = true;
    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const data = new Uint8Array(e.target.result);
            const workbook = XLSX.read(data, { type: 'array', cellDates: true });
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            
            const dataAsArrays = XLSX.utils.sheet_to_json(worksheet, { header: 1, range: 1 });

            if (dataAsArrays.length < 1) {
                 throw new Error(`檔案缺少所有必要標頭: ${chineseHeaders.value.join('、')}`);
            }
            
            const uploadedHeaders = dataAsArrays[0].map(h => String(h || '').trim());
            const requiredHeaders = chineseHeaders.value;
            const missingHeaders = requiredHeaders.filter(h => !uploadedHeaders.includes(h));
            const extraHeaders = uploadedHeaders.filter(h => h && !requiredHeaders.includes(h));

            if (missingHeaders.length > 0 || extraHeaders.length > 0) {
                let errorMessage = '檔案標頭不符。';
                if (missingHeaders.length > 0) errorMessage += `\n缺少必要標頭: ${missingHeaders.join('、')}`;
                if (extraHeaders.length > 0) errorMessage += `\n發現非預期標頭: ${extraHeaders.join('、')}`;
                throw new Error(errorMessage);
            }

            const dataRows = dataAsArrays.slice(1);
            const nonEmptyRows = dataRows.filter(row => row.some(cell => cell !== null && cell !== undefined && cell !== ''));
            
            const jsonDataWithEnglishKeys = nonEmptyRows.map(rowArray => {
                const newRow = {};
                exportOrder.value.forEach((key, index) => {
                    newRow[key] = rowArray[index] ?? null;
                });
                return newRow;
            });
            
            if (jsonDataWithEnglishKeys.some(row => !row.unitId)) {
                throw new Error("資料驗證失敗：每一列都必須包含『戶別』。請檢查上傳的檔案。");
            }

            parsedData.value = jsonDataWithEnglishKeys;
            uploadMessageType.value = 'success';
            uploadMessage.value = `成功解析 ${jsonDataWithEnglishKeys.length} 筆資料，可以開始上傳。`;
            
        } catch (err) {
            uploadMessageType.value = 'error';
            uploadMessage.value = err.message || '解析檔案失敗，請使用系統匯出的範本。';
            parsedData.value = [];
        } finally {
            isParsing.value = false;
        }
    };
    reader.readAsArrayBuffer(file);
};

const uploadData = async () => {
    if (parsedData.value.length === 0) {
        uploadMessageType.value = 'warning';
        uploadMessage.value = '沒有可上傳的資料。';
        return;
    }
    isUploading.value = true;
    uploadMessage.value = '';
    try {
        const result = await uploadHouseholds(projectId.value, parsedData.value);
        
        if (result.status === 'success') {
          uploadMessageType.value = 'success';
          uploadMessage.value = result.message || '戶別資料已成功上傳更新！';
          setTimeout(() => {
            closeUploadDialog();
          }, 2000); 
        } else {
          throw new Error(result.message || '發生未知錯誤');
        }
    } catch (err) {
        uploadMessageType.value = 'error';
        uploadMessage.value = `上傳失敗: ${err.message}`;
    } finally {
        isUploading.value = false;
    }
};

</script>

<style scoped>
/* (您的 CSS 樣式維持不變) */
.sales-control-page {
  height: calc(100vh - 56px);
  background-color: #f0f2f5;
  padding: 16px;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding-bottom: 20px; 
}
.grid-wrapper {
  flex-grow: 1;
  display: flex;
  justify-content: center;
  overflow: hidden;
}
.toolbar {
  display: flex;
  align-items: center;
  padding: 0 8px;
  flex-shrink: 0;
}
.toolbar-title {
  font-size: 1.2rem;
  font-weight: 600;
  color: #37474f;
}
.layout-grid {
  display: grid;
  grid-template-columns: 0px 40px 1fr;
  grid-template-rows: 50px 1fr;
  overflow: hidden;
  max-width: 95vw;
}
.header-top-left {
  grid-column: 2;
  grid-row: 1;
  background-color: #f0f2f5;
  z-index: 3;
}
.header-top-container {
  grid-column: 3;
  grid-row: 1;
  background-color: #f0f2f5;
  overflow: hidden;
  z-index: 2;
  display: flex;
  align-items: center;
  padding-right: 17px;
  box-sizing: content-box;
}
.header-left-container {
  grid-column: 2;
  grid-row: 2;
  background-color: #f0f2f5;
  overflow: hidden;
  z-index: 2;
  box-sizing: border-box;
  padding-bottom: 17px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding-top: 5px;
}
.main-grid-container {
  grid-column: 3;
  grid-row: 2;
  overflow: auto;
  z-index: 1;
}
.header-cell {
  background-color: #1a3a6e;
  color: white;
  display: flex;
  justify-content: center;
  align-items: center;
  font-weight: bold;
  border-radius: 6px;
  flex-shrink: 0;
}
.header-top-container .header-cell {
  width: 120px;
  height: 40px;
  margin-left: 12px;
}
.header-left-container .header-cell {
  width: 40px;
  height: 90px;
}
.grid-table {
  display: grid;
  gap: 10px 12px;
  padding: 5px 16px 5px 12px;
  width: max-content;
  grid-template-columns: repeat(v-bind('buildingHeaders.length'), 120px);
  grid-auto-rows: 90px;
}
.unit-card {
  position: relative;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  width: 100%;
  height: 100%;
  border-radius: 6px;
  border: 2px solid transparent;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  padding: 6px 4px;
  box-sizing: border-box;
  cursor: pointer;
  transition: all 0.2s ease-in-out;
  text-align: center;
}
.unit-card.in-quote {
  border-color: #ff9800;
  box-shadow: 0 0 10px rgba(255, 152, 0, 0.5);
}
.unit-card.in-quote::after {
  content: '✔';
  position: absolute;
  top: 2px;
  right: 5px;
  color: white;
  background-color: #ff9800;
  border-radius: 50%;
  width: 18px;
  height: 18px;
  font-size: 12px;
  line-height: 18px;
  text-align: center;
  font-weight: bold;
}
.unit-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
}
.unit-card.empty {
  background-color: #e9ecef;
  box-shadow: none;
  cursor: default;
}
.unit-name {
  font-size: 0.95rem;
  font-weight: 600;
  color: #1a237e;
}
.unit-total-price {
  font-size: 0.95rem;
  font-weight: 700;
  color: #d81b60;
}
.unit-area {
  font-size: 0.8rem;
  font-weight: 700;
  color: #37474f;
}
.unit-per-price {
  font-size: 0.8rem;
  font-weight: 400;
  color: #546e7a;
}
.sold-text {
  font-weight: 700;
  color: #424242;
  letter-spacing: 2px;
}
.status-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: rgba(240, 242, 245, 0.9);
  z-index: 10;
  transition: opacity 0.3s ease;
}
.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
}
.loading-text {
  font-size: 1rem;
  font-weight: 500;
  color: #37474f;
}
.error-text {
  font-size: 1.2rem;
  color: #d32f2f;
  font-weight: bold;
  padding: 16px;
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.15);
}
.loader {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  position: relative;
  animation: rotate 1s linear infinite
}
.loader::before {
  content: "";
  box-sizing: border-box;
  position: absolute;
  inset: 0px;
  border-radius: 50%;
  border: 5px solid #008cff;
  animation: prixClipFix 2s linear infinite ;
}
@keyframes rotate {
  100% {transform: rotate(360deg)}
}
@keyframes prixClipFix {
  0% {clip-path:polygon(50% 50%,0 0,0 0,0 0,0 0,0 0)}
  25% {clip-path:polygon(50% 50%,0 0,100% 0,100% 0,100% 0,100% 0)}
  50% {clip-path:polygon(50% 50%,0 0,100% 0,100% 100%,100% 100%,100% 100%)}
  75% {clip-path:polygon(50% 50%,0 0,100% 0,100% 100%,0 100%,0 100%)}
  100% {clip-path:polygon(50% 50%,0 0,100% 0,100% 100%,0 100%,0 0)}
}

.iframe-container {
  width: 100%;
  height: calc(100vh - 48px);
  overflow: hidden;
}
.iframe-container iframe {
  width: 100%;
  height: 100%;
  border: none;
}

.v-bottom-navigation {
  background-color: rgba(255, 255, 255, 0.75) !important;
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  height: calc(56px + 20px) !important; 
  padding-bottom: 20px !important; 
}

.v-bottom-navigation .v-btn > .v-btn__content > span {
    font-size: 0.8rem;
}
/*  新增：上傳提示框的樣式 */
.pre-wrap-alert {
   white-space: pre-wrap;
}

/* ===============================================
   🚀 NEW: 智能緩存相關樣式
   =============================================== */

/* 緩存提示文字 */
.cache-hint {
  font-size: 0.9rem;
  color: #666;
  margin-top: 8px;
  font-style: italic;
}

/* 開發模式緩存統計 */
.dev-cache-stats {
  position: fixed;
  bottom: 20px;
  right: 20px;
  width: 320px;
  z-index: 1000;
  opacity: 0.9;
}

.cache-stats-content {
  display: flex;
  flex-direction: column;
  gap: 8px;
  font-size: 0.85rem;
}

.stats-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 4px 0;
  border-bottom: 1px solid #eee;
}

.stats-row:last-child {
  border-bottom: none;
}

/* 手動刷新按鈕動畫效果 */
.v-btn:has(.mdi-refresh) {
  transition: transform 0.2s ease;
}

.v-btn:has(.mdi-refresh):hover {
  transform: scale(1.05);
}

/* 載入狀態改進 */
.loading-container {
  text-align: center;
  padding: 20px;
}

.loading-text {
  margin-top: 16px;
  font-size: 1.1rem;
  font-weight: 500;
  color: #37474f;
}

/* 響應式設計：手機版不顯示緩存統計 */
@media (max-width: 768px) {
  .dev-cache-stats {
    display: none;
  }
}
</style>