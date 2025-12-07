<template>
  <div class="sales-control-page">
    
    <div class="toolbar d-none d-md-flex">
      <span class="toolbar-title d-none d-sm-inline">{{ projectName }}-{{ pageTitle }}</span>
      
      <v-btn-toggle
        v-model="viewFormat"
        color="indigo"
        variant="outlined"
        density="compact"
        mandatory
        class="ml-4"
      >
        <v-btn value="grid" prepend-icon="mdi-view-grid">網格</v-btn>
        <v-btn value="list" prepend-icon="mdi-view-list">列表</v-btn>
      </v-btn-toggle>

      

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
        v-if="currentViewMode === 'sales' && viewFormat === 'grid'"
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

      <v-tooltip location="bottom">
        <template v-slot:activator="{ props }">
          <v-btn
            v-bind="props"
            color="black"
            variant="tonal"
            class="ml-4"
            @click="openParkingCanvasEditor"
            icon="mdi-car-side"
          ></v-btn>
        </template>
        <span>車位銷控</span>
      </v-tooltip>

      <v-tooltip location="bottom">
        <template v-slot:activator="{ props }">
          <v-btn
            v-bind="props"
            color="black"
            variant="tonal"
            class="ml-4"
            @click="handleOpenActivityMessage"
            icon="mdi-bullhorn"
          ></v-btn>
        </template>
        <span>最新活動訊息</span>
      </v-tooltip>

      <v-tooltip location="bottom" v-if="currentViewMode === 'sales'">
        <template v-slot:activator="{ props }">
          <v-btn
            v-bind="props"
            color="black"
            variant="tonal"
            class="ml-4"
            @click="navigateToParkingControl" 
            :loading="false"
            icon="mdi-car-cog"
          ></v-btn>
        </template>
        <span>車位銷控管理</span>
      </v-tooltip>
      
      <v-tooltip location="bottom" v-if="currentViewMode === 'sales'">
        <template v-slot:activator="{ props }">
          <v-btn
            v-bind="props"
            color="black"
            variant="tonal"
            class="ml-4"
            @click="exportToExcel"
            icon="mdi-tray-arrow-down"
          ></v-btn>
        </template>
        <span>下載戶別資料EXCEL</span>
      </v-tooltip>

      <v-tooltip location="bottom" v-if="currentViewMode === 'sales'">
        <template v-slot:activator="{ props }">
          <v-btn
            v-bind="props"
            color="black"
            variant="tonal"
            class="ml-4"
            @click="uploadDialog = true"
            icon="mdi-tray-arrow-up"
          ></v-btn>
        </template>
        <span>上傳戶別資料EXCEL</span>
      </v-tooltip>

      <v-tooltip location="bottom" v-if="currentViewMode === 'sales' && project.paymentScheduleFolderUrl">
        <template v-slot:activator="{ props }">
          <v-btn
            v-bind="props"
            color="black"
            variant="tonal"
            class="ml-4"
            :href="project.paymentScheduleFolderUrl"
            target="_blank"
            rel="noopener noreferrer"
            icon="mdi-folder-google-drive"
          ></v-btn>
        </template>
        <span>付款表資料夾</span>
      </v-tooltip>
     
      <v-tooltip location="bottom">
        <template v-slot:activator="{ props }">
          <v-btn
            v-bind="props"
            color="black"
            variant="tonal"
            class="ml-4"
            @click="handleRefreshData"
            :loading="isRefreshing"
            icon="mdi-refresh"
          ></v-btn>
        </template>
        <span>重新載入最新資料</span>
      </v-tooltip>

      <v-tooltip location="bottom" v-if="currentViewMode === 'sales'">
        <template v-slot:activator="{ props }">
          <v-btn
            v-bind="props"
            color="black"
            variant="tonal"
            class="ml-4"
            @click="navigateToSalesSettings"
            icon="mdi-cog"
          ></v-btn>
        </template>
        <span>更多設定</span>
      </v-tooltip>
    </div>

    <div class="content-wrapper">
      
      <div v-if="viewFormat === 'grid'" class="layout-grid">
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

      <div v-else class="list-view-container">
        <v-data-table
          :headers="tableHeaders"
          :items="tableItems"
          :loading="loading"
          fixed-header
          :height="tableHeight" 
          hover
          density="compact"
          class="elevation-1 row-pointer compact-table"
          items-per-page="-1"
          hide-default-footer
          @click:row="handleRowClick"
        >
          <template v-slot:item.status="{ item }">
            <v-chip 
              size="small" 
              label 
              :color="statusColorMap.get(item.status) || 'grey'"
              :class="['font-weight-bold', `text-${getContrastTextColor(statusColorMap.get(item.status))}`]"
              variant="flat"
            >
              {{ item.status }}
            </v-chip>
          </template>

          <template v-slot:item.unitId="{ item }">
            <div class="d-flex align-center">
              <div class="status-indicator mr-2" :style="{ backgroundColor: statusColorMap.get(item.status) || '#ddd' }"></div>
              <span class="font-weight-bold text-primary">{{ item.unitId }}</span>
              <v-icon v-if="quoteStore.isItemInQuote(item.unitId)" color="warning" size="small" class="ml-2">mdi-check-circle</v-icon>
            </div>
          </template>

          <template v-slot:item.quote_mode_total_price="{ item }">
            <span v-if="item.status === '已售'" class="text-red font-weight-bold">已售</span>
            <span v-else class="text-indigo font-weight-medium">
              {{ formatNumber(item.price_list_house_total, 0) }} 萬 
            </span>
          </template>

          <template v-slot:header.quote_mode_total_price="{ column, sort, sortBy }">
            <div class="d-flex align-center ga-2"> 
              
              <div 
                class="d-flex align-center cursor-pointer user-select-none" 
                @click="sort(column)"
              >
                <span>{{ column.title }}</span>
                
                <template v-if="sortBy.some(s => s.key === column.key)">
                   <v-icon 
                     :icon="sortBy.find(s => s.key === column.key).order === 'desc' ? 'mdi-arrow-down' : 'mdi-arrow-up'"
                     size="small"
                     class="ml-1"
                     color="black"
                   ></v-icon>
                </template>
                
                <template v-else>
                   <v-icon 
                     icon="mdi-arrow-up"
                     size="small"
                     class="ml-1 text-disabled"
                     style="opacity: 0.3;"
                   ></v-icon>
                </template>
              </div>
              
              <div @click.stop style="transform: scale(0.8); transform-origin: left center;">
                <v-switch
                  v-model="showSoldItems"
                  label="已售"
                  color="error"
                  density="compact"
                  hide-details
                
                  class="ma-0 pa-0"
                ></v-switch>
              </div>

            </div>
          </template>

          <template v-slot:item.unit_price_value="{ item }">
             <span v-if="item.unit_price_value === null" class="text-grey">-</span>
             
             <span v-else class="text-blue-grey-darken-2 font-weight-medium">
                {{ formatNumber(item.unit_price_value, 2) }} 萬/坪
             </span>
          </template>


          <template v-slot:item.price_list_house_total="{ item }">
            <template v-if="currentViewMode === 'quote'">
              <span v-if="item.status === '已售'" class="text-red font-weight-bold">已售</span>
              <span v-else class="text-indigo font-weight-medium">
                {{ formatNumber(item.price_list_house_total, 0) }} 萬 
              </span>
            </template>
            
            <template v-else>
              <span class="text-grey font-weight-bold"">
                {{ formatNumber(item.price_list_house_total, 0) }}
              </span>
            </template>
          </template>

          <template v-slot:item.unit_price_list="{ item }">
            <span v-if="item.unit_price_list" class="text-grey">
              {{ formatNumber(item.unit_price_list, 2) }}
            </span>
            <span v-else class="text-grey">-</span>
          </template>

          <template v-slot:item.unit_price_floor="{ item }">
            <span v-if="item.unit_price_floor" class="text-red">
              {{ formatNumber(item.unit_price_floor, 2) }}
            </span>
            <span v-else class="text-grey">-</span>
          </template>

          <template v-slot:item.unit_price_transaction="{ item }">
            <span v-if="item.unit_price_transaction" class="text-success font-weight-bold">
              {{ formatNumber(item.unit_price_transaction, 2) }}
            </span>
            <span v-else class="text-grey">-</span>
          </template>


          <template v-slot:item.price_floor_house_total="{ item }">
            <span class="text-red font-weight-bold">
              {{ formatNumber(item.price_floor_house_total, 0) }}
            </span>
          </template>

          <template v-slot:item.parking_floor_total="{ item }">
            <span class="text-red font-weight-bold">
              {{ formatNumber(item.parking_floor_total, 0) }}
            </span>
          </template>

          <template v-slot:item.parking_trans_total="{ item }">
           <span class="font-weight-bold text-success">
              {{ formatNumber(item.parking_trans_total, 0) }}
            </span>
          </template>

          <template v-slot:item.price_transaction_house="{ item }">
          <span class="font-weight-bold text-success">
         {{ formatNumber(item.price_transaction_house, 0) }}
           </span>
          </template>

          <template v-slot:item.total_transaction="{ item }">
            <span class="font-weight-bold text-success">
            {{ formatNumber(item.total_transaction, 0) }}
            </span>
          </template>
         
          <template v-slot:item.total_floor="{ item }">
          <span class="font-weight-bold text-red">
          {{ formatNumber(item.total_floor, 0) }}
          </span>
          </template>
          
          <template v-slot:item.price_diff="{ item }">
            <span :class="item.price_diff >= 0 ? 'text-success font-weight-bold' : 'text-error font-weight-bold'">
              {{ item.price_diff > 0 ? '+' : '' }}{{ formatNumber(item.price_diff, 0) }}
            </span>
          </template>

          <template v-slot:item.payment_deposit_date="{ item }">{{ formatDate(item.payment_deposit_date) }}</template>
          <template v-slot:item.payment_contract_date="{ item }">{{ formatDate(item.payment_contract_date) }}</template>
        </v-data-table>
      </div>

    </div> 
    
    <v-bottom-navigation
      v-if="isMobile"
      :active="true"
      color="primary"
      app
      grow  
    >
    <v-btn @click="viewFormat = viewFormat === 'grid' ? 'list' : 'grid'">
        <v-icon>{{ viewFormat === 'grid' ? 'mdi-view-list' : 'mdi-view-grid' }}</v-icon>
        <span>{{ viewFormat === 'grid' ? '列表' : '網格' }}</span>
      </v-btn>

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
      
      <v-btn @click="openParkingCanvasEditor">
        <v-icon>mdi-car-side</v-icon>
        <span>車位</span>
      </v-btn>

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
          <v-list-item @click="handleRefreshData" :loading="isRefreshing">
            <template v-slot:prepend>
              <v-icon color="black">mdi-refresh</v-icon>
            </template>
            <v-list-item-title>重新載入資料</v-list-item-title>
          </v-list-item>
          <v-divider></v-divider>
          
          <v-list-item @click="exportToExcel">
            <template v-slot:prepend>
              <v-icon color="black">mdi-tray-arrow-down</v-icon>
            </template>
            <v-list-item-title>下載戶別資料EXCEL</v-list-item-title>
          </v-list-item>
           <v-list-item @click="uploadDialog = true">
            <template v-slot:prepend>
              <v-icon color="black">mdi-tray-arrow-up</v-icon>
            </template>
            <v-list-item-title>上傳戶別資料EXCEL</v-list-item-title>
          </v-list-item>
          <v-divider></v-divider>
          <v-list-item @click="handleOpenActivityMessage">
            <template v-slot:prepend>
              <v-icon color="black">mdi-bullhorn-outline</v-icon>
            </template>
            <v-list-item-title>活動訊息</v-list-item-title>
          </v-list-item>
          
          <v-list-item @click="navigateToParkingControl">
            <template v-slot:prepend>
              <v-icon color="black">mdi-car-cog</v-icon>
            </template>
            <v-list-item-title>車位銷控管理</v-list-item-title>
          </v-list-item>
          
         <v-list-item
            v-if="project.paymentScheduleFolderUrl"
            :href="project.paymentScheduleFolderUrl"
            target="_blank"
            rel="noopener noreferrer"
          >
            <template v-slot:prepend>
              <v-icon color="black">mdi-folder-google-drive</v-icon>
            </template>
            <v-list-item-title>付款表資料夾</v-list-item-title>
          </v-list-item>
          <v-list-item @click="navigateToSalesSettings">
            <template v-slot:prepend>
              <v-icon>mdi-cog-outline</v-icon>
            </template>
            <v-list-item-title>更多設定</v-list-item-title>
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
      :contract-types="project.contractTypes || []" @request-open-slide="handleOpenSlideViewer" />

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
        <v-toolbar dark color="#f5f5f7" density="compact">
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

    <v-dialog v-model="isParkingCanvasDialogVisible" fullscreen hide-overlay transition="dialog-bottom-transition" :eager="true">
      <v-card class="d-flex flex-column">
        <v-toolbar dark color="#f5f5f7" density="compact">
          <v-btn icon dark @click="isParkingCanvasDialogVisible = false">
            <v-icon>mdi-close</v-icon>
          </v-btn>
          <v-toolbar-title> {{ projectName }} 車位銷控</v-toolbar-title>
          <v-spacer></v-spacer>
          
        </v-toolbar>
        
        <div class="flex-grow-1" style="position: relative; overflow: hidden; background-color: #f0f2f5;">
          <v-overlay
            :model-value="isParkingCanvasLoading"
            class="align-center justify-center"
            persistent
            scrim="rgba(255, 255, 255, 0.7)"
          >
            <div class="text-center">
              <v-progress-circular indeterminate color="#008cff" size="64"></v-progress-circular>
              <p class="mt-4 text-body-1 text-black">正在載入車位資料...</p>
            </div>
          </v-overlay>
          
         <ParkingCanvas
            v-if="!isParkingCanvasLoading && activeParkingCanvasFloorPlan"
            :project-id="projectId"
            :floor-plan="activeParkingCanvasFloorPlan"
            :preview-mode="true" 
            :show-tools="true"
            v-model:display-mode="parkingCanvasDisplayMode" 
            :allow-import="false" 
            :allow-adjust-all="false" 
            :show-status-toggle="currentViewMode === 'sales'" 
            :text-styles="textStyleStore.styles" 
            :status-colors="statusColorStore.colors" 
            @floor-switched="handleParkingCanvasFloorSwitch"
            @spots-changed="handleParkingCanvasSpotsChanged"
            style="height: 100%; width: 100%;"
          />
        </div>
      </v-card>
    </v-dialog>

    <div v-if="loading || error" class="status-overlay">
      <div v-if="loading" class="loading-container">
        <span class="loader"></span>
        <p class="loading-text">正在載入銷控資料...</p>
      </div>
      <p v-if="error" class="error-text">錯誤: {{ error }}</p>
    </div>

    <div v-if="isDevelopment && !loading" class="dev-cache-stats">
        </div>

  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed, nextTick, defineAsyncComponent } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useSystemPresence } from '@/composables/useSystemPresence'; 
import { uploadHouseholds, getFloorPlansAPI, updateSalesData } from '@/api';
import { useToast, POSITION } from 'vue-toastification';
import { useSalesDataStore } from '@/store/salesDataStore';
import * as XLSX from 'xlsx-js-style';
import UnitDetailModal from '@/components/UnitDetailModal.vue';
import { useQuoteStore } from '@/store/quoteStore';
import { useSlideViewer } from '@/composables/useSlideViewer';
import QuoteSidebar from '@/components/QuoteSidebar.vue';
import { useDisplay } from 'vuetify';
import UpdateControl from './UpdateControl.vue'; 
import ParkingCanvas from '@/components/ParkingCanvas.vue';
import { useTextStyleStore } from '@/store/textStyleStore'; 
import { useStatusColorStore } from '@/store/statusColorStore'; 
import { mdiViewDashboardVariantOutline } from '@mdi/js'; 

// [新增] 視圖格式：'grid' | 'list'
const viewFormat = ref('grid'); 

// [新增] 自動判斷背景色亮度，回傳 'black' 或 'white'
const getContrastTextColor = (hexColor) => {
  if (!hexColor || typeof hexColor !== 'string') return 'white';
  
  // 移除 # 號
  const hex = hexColor.replace('#', '');
  
  // 解析 RGB
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);
  
  // 計算亮度 (YIQ 公式)
  const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
  
  // 亮度大於 128 (亮色系) 回傳黑色，否則回傳白色
  return yiq >= 128 ? 'black' : 'white';
};


// ✅ [修改] 控制是否顯示「已售」的資料列 (預設 true: 顯示全部)
const showSoldItems = ref(true);


// (原有變數定義保持不變)
const isListView = ref(false); // 這好像是沒用的舊變數，可忽略或移除
// ... (COLUMN_DEFINITIONS, exportableColumns 等... 保持不變) ...
const COLUMN_DEFINITIONS = [
    { key: 'building', title: '棟別' },
    { key: 'floor', title: '樓層' },
    { key: 'unitId', title: '戶別' },
    { key: 'propertyType', title: '物件類型' },
    { key: 'layout', title: '格局' },
    
    { key: 'salesStatus_backend', title: '銷控後台狀態' },
    { key: 'salesStatus_quote', title: '報價系統狀態' },
    { key: 'buyerName', title: '買方姓名' },
    { key: 'buyerPhone', title: '買方電話' },
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
    { key: 'salesperson', title: '銷售人員' },
    { key: 'contractType', title: '合約方式' },
    { key: 'isFirstTimeBuyer', title: '是否首購' },
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
   { key: 'landBankName', title: '土地款匯款銀行' },
    { key: 'landBankAccount', title: '土地款匯款帳號' },
    { key: 'landBankAccountName', title: '土地款戶名' },
    { key: 'houseBankName', title: '房屋款匯款銀行' },
    { key: 'houseBankAccount', title: '房屋款匯款帳號' },
    { key: 'houseBankAccountName', title: '房屋款戶名' },
    { key: 'packageBankName', title: '配套款匯款銀行' },
    { key: 'packageBankAccount', title: '配套款匯款帳號' },
    { key: 'packageBankAccountName', title: '配套款戶名' },
    { key: 'constructionMethod', title: '興建方式' },
    
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
const exportableColumns = computed(() => COLUMN_DEFINITIONS.filter(c => c.exportable !== false));
const fieldMapping = computed(() => Object.fromEntries(exportableColumns.value.map(col => [col.key, col.title])));
const chineseHeaders = computed(() => exportableColumns.value.map(c => c.title));
const exportOrder = computed(() => exportableColumns.value.map(c => c.key));

const { mobile: isMobile } = useDisplay();
const router = useRouter();
const quoteStore = useQuoteStore();
const route = useRoute();
const toast = useToast();

const salesDataStore = useSalesDataStore(); 
const projectIdForPresence = computed(() => route.params.projectName);
const systemNameForPresence = computed(() => route.meta.viewMode === 'quote' ? '報價系統' : '銷控系統');
useSystemPresence(projectIdForPresence.value, systemNameForPresence.value);

// ✅ [新增] 動態計算表格高度
const tableHeight = computed(() => {
  if (isMobile.value) {
    // 手機版：扣除 Header + Padding + Bottom Navigation (約 56px + padding)
    // 建議扣除 230px 左右 (視實際標頭高度而定，寧可多扣一點也不要被切到)
    return 'calc(100vh - 230px)';
  } else {
    // 電腦版：扣除 Toolbar + Padding
    // 原本是 140px，稍微增加一點緩衝到 150px
    return 'calc(100vh - 150px)';
  }
});

const { 
  isSlideDialogVisible, 
  slideEmbedUrl, 
  isLoadingSlide,
  isContentLoaded,
  openSlideViewer, 
  refreshSlide
} = useSlideViewer();

const textStyleStore = useTextStyleStore(); 
const statusColorStore = useStatusColorStore(); 

// State
const loading = ref(true);
const error = ref(null);

const projectData = computed(() => salesDataStore.getProjectData(projectId.value));
const project = computed(() => projectData.value.project);
const salesParameters = computed(() => projectData.value.parameters);
const salesHouseholds = computed(() => projectData.value.households);
const salesParkings = computed(() => projectData.value.parkings);
const salesImages = computed(() => projectData.value.images);
const salesPersonnel = computed(() => projectData.value.personnel);

const isRefreshing = ref(false);
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
const isParkingCanvasDialogVisible = ref(false);
const parkingCanvasFloorPlans = ref([]);
const activeParkingCanvasFloorPlan = ref(null);
const isParkingCanvasLoading = ref(false);
const parkingCanvasDisplayMode = ref('backend'); 

const uploadDialog = ref(false);
const uploadedFile = ref(null);
const parsedData = ref([]);
const isParsing = ref(false);
const isUploading = ref(false);
const uploadMessage = ref('');
const uploadMessageType = ref('success');

const allDataForModal = computed(() => {
  return {
    '參數': salesParameters.value,
    '車位': salesParkings.value,
    '銷控圖片': salesImages.value,
    '銷售人員': salesPersonnel.value, 
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
const pageTitle = computed(() => (currentViewMode.value === 'quote' ? '報價系統' : '銷控系統'));
const itemCount = computed(() => quoteStore.itemCount);
const projectName = computed(() => project.value.name);

// [Grid Computed]
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

// =====================================================
// 🚀 [新增] 列表模式相關 Computed 屬性與邏輯
// =====================================================

// 1. 戶別自然排序輔助函式
const naturalSort = (a, b) => {
  return String(a).localeCompare(String(b), undefined, { numeric: true, sensitivity: 'base' });
};

// 2. 日期格式化輔助函式
const formatDate = (val) => {
  if (!val) return '';
  if (val instanceof Date) return val.toLocaleDateString('zh-TW');
  if (val && typeof val.toDate === 'function') return val.toDate().toLocaleDateString('zh-TW');
  // 嘗試解析字串
  const d = new Date(val);
  if (!isNaN(d.getTime())) return d.toLocaleDateString('zh-TW');
  return val;
};

// 修改 tableHeaders computed
const tableHeaders = computed(() => {
  // [報價模式] (保持不變)
  if (currentViewMode.value === 'quote') {
    return [
      { title: '戶別', key: 'unitId', align: 'start', fixed: true, sortable: true },
      { title: '房屋總面積(坪)', key: 'area_house_ping', align: 'start' },
      { title: '房屋總價', key: 'quote_mode_total_price', align: 'start', sort: customPriceSort },
      { title: '房屋單價', key: 'unit_price_value', align: 'start', sort: customPriceSort },
    ];
  } 
  // ✅ [修改] 銷控模式 (櫃台)
  else {
    return [
      { title: '銷控狀態', key: 'status', align: 'center' },
      { title: '戶別', key: 'unitId', align: 'start', fixed: true, sortable: true },
      { title: '房屋總面積(坪)', key: 'area_house_ping', align: 'start' },
      
      // 表價組
      { title: '房價(表價)', key: 'price_list_house_total', align: 'start' },
      { title: '表價單價', key: 'unit_price_list', align: 'start', sort: customPriceSort }, // 新增
      
      // 底價組
      { title: '底價', key: 'price_floor_house_total', align: 'start' },
      { title: '底價單價', key: 'unit_price_floor', align: 'start', sort: customPriceSort }, // 新增
      
      // 成交價組
      { title: '成交價', key: 'price_transaction_house', align: 'start' },
      { title: '成交單價', key: 'unit_price_transaction', align: 'start', sort: customPriceSort }, // 新增
      
      { title: '車位底價', key: 'parking_floor_total', align: 'start' },
      { title: '車位成交', key: 'parking_trans_total', align: 'start' },
      
      { title: '成交總價(含車)', key: 'total_transaction', align: 'start' },
      { title: '合計底價(含車)', key: 'total_floor', align: 'start' },
      { title: '溢差價', key: 'price_diff', align: 'start' },
      { title: '銷售人員', key: 'salesperson', align: 'start' },
      { title: '買方姓名', key: 'buyerName', align: 'start' },
      { title: '小訂日期', key: 'payment_deposit_date', align: 'center' },
      { title: '簽約日期', key: 'payment_contract_date', align: 'center' },
      { title: '備註', key: 'remarks', align: 'start' },
    ];
  }
});

// [新增] 自定義價格排序：讓 null (已售) 排在最後
const customPriceSort = (a, b) => {
  // 如果兩個都是 null，視為相等
  if (a === null && b === null) return 0;
  // 如果 a 是 null，讓它排在 b 後面 (視為最大)
  if (a === null) return 1;
  // 如果 b 是 null，讓它排在 a 後面
  if (b === null) return -1;
  // 正常的數字比較
  return a - b;
};


// 修改 tableItems computed
const tableItems = computed(() => {
  // 🔴 [修正重點] 這裡必須用 'let'，因為下面會重新賦值
  let units = filteredHouseholds.value;
  
  // ✅ [新增] 過濾邏輯
  if (currentViewMode.value === 'quote' && !showSoldItems.value) {
    // 這裡會對 units 重新賦值，所以上面必須是 let
    units = units.filter(u => u.salesStatus_quote !== '已售');
  }

  const parkings = salesParkings.value || [];

  const parkingMap = {};
  parkings.forEach(p => {
    if (p.buyerUnitId) {
      if (!parkingMap[p.buyerUnitId]) parkingMap[p.buyerUnitId] = [];
      parkingMap[p.buyerUnitId].push(p);
    }
  });

  return units.map(unit => {
    // ... (原本的 map 內部邏輯保持不變) ...
    const item = { ...unit };
    item.status = currentViewMode.value === 'quote' ? unit.salesStatus_quote : unit.salesStatus_backend;

    const mySpots = parkingMap[unit.unitId] || [];
    const parkingTransTotal = mySpots.reduce((sum, p) => sum + (Number(p.price_transaction) || 0), 0);
    const parkingFloorTotal = mySpots.reduce((sum, p) => sum + (Number(p.price_floor) || 0), 0);

    // 新增：將車位計算結果存入 item
    item.parking_trans_total = parkingTransTotal;
    item.parking_floor_total = parkingFloorTotal;
    
    // 房屋成交價
    const houseTrans = Number(unit.price_transaction_house) || 0;
    
    // 成交總價
    item.total_transaction = houseTrans + parkingTransTotal;

    // 合計底價
    const houseFloor = Number(unit.price_floor_house_total) || 0;
    item.total_floor = houseFloor + parkingFloorTotal;

    // 溢差價計算
    if (houseTrans > 0) {
        item.price_diff = item.total_transaction - item.total_floor;
    } else {
        item.price_diff = null;
    }

    // 單價計算
    const areaVal = Number(item.area_house_ping) || 0;
    const calcUnit = (totalPrice) => {
        const price = Number(totalPrice) || 0;
        if (price <= 0 || areaVal === 0) return null;
        return price / areaVal;
    };

    item.unit_price_list = calcUnit(item.price_list_house_total);
    item.unit_price_floor = calcUnit(item.price_floor_house_total);
    item.unit_price_transaction = calcUnit(item.price_transaction_house);

    // 報價模式專用
    if (item.status === '已售') {
        item.unit_price_value = null;
        item.quote_mode_total_price = null;
    } else {
        item.unit_price_value = item.unit_price_list;
        item.quote_mode_total_price = Number(item.price_list_house_total) || 0;
    }

    return item;
  }).sort((a, b) => naturalSort(a.unitId, b.unitId));
});

// 5. 處理列表行點擊
const handleRowClick = (event, { item }) => {
  // Vuetify 的 item 包裝在 Proxy 或物件中，視版本而定
  // openUnitDetail 需要原始數據物件
  openUnitDetail(item); 
};
// =====================================================

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

const formatNumber = (val, precision = 0) => {
  if (val === undefined || val === null || val === '') return '-';
  const num = Number(val);
  return isNaN(num) ? '-' : num.toLocaleString('zh-TW', { minimumFractionDigits: precision, maximumFractionDigits: precision });
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

function navigateToParkingControl() {
  if (projectId.value) {
    router.push({
      name: 'ParkingControl',
      params: { projectId: projectId.value }
    });
  }
}

const openParkingCanvasEditor = async () => {
  if (!projectId.value) {
    toast.error('未提供專案 ID，無法開啟編輯器。', { position: POSITION.BOTTOM_CENTER });
    return;
  }

  isParkingCanvasLoading.value = true;
  isParkingCanvasDialogVisible.value = true;

  if (currentViewMode.value === 'quote') {
    parkingCanvasDisplayMode.value = 'sales'; 
  } else { 
    parkingCanvasDisplayMode.value = 'backend'; 
  }

  activeParkingCanvasFloorPlan.value = null;
  parkingCanvasFloorPlans.value = [];

  try {
    const result = await getFloorPlansAPI(projectId.value);
    if (result.status === 'success' && result.data && result.data.length > 0) {
      result.data.sort((a, b) => 
        (a.floor || '').localeCompare(b.floor || '', 'zh-Hant', { numeric: true })
      );
      parkingCanvasFloorPlans.value = result.data;
      activeParkingCanvasFloorPlan.value = parkingCanvasFloorPlans.value[0]; 
    } else {
      toast.error('此專案沒有可編輯的車位樓層平面圖。', { position: POSITION.BOTTOM_CENTER });
      isParkingCanvasDialogVisible.value = false;
    }
  } catch (error) {
    toast.error(`載入樓層資料失敗: ${error.message}`, { position: POSITION.BOTTOM_CENTER });
    isParkingCanvasDialogVisible.value = false;
  } finally {
    isParkingCanvasLoading.value = false;
  }
};

const handleParkingCanvasFloorSwitch = (plan) => {
  activeParkingCanvasFloorPlan.value = plan;
};

const handleParkingCanvasSpotsChanged = () => {
  console.log('ParkingCanvas 偵測到畫布變更，需處理 [自動保存] 或 [標記為未保存]');
  toast.info('偵測到畫布變更 (尚未自動保存)', { 
    timeout: 2000,
    position: POSITION.BOTTOM_CENTER
  });
};


const handleUnitListUpdate = async (payload, onSuccess, onError) => {
  const { unitId, data } = payload;
  console.log(`[ListUpdate] 更新 ${unitId}:`, data);
  try {
    const apiPayload = {
        projectName: projectName.value,
        projectId: projectId.value,
        unitId: unitId,
        data: data
    };
    const result = await updateSalesData(apiPayload);
    if (result.status === 'success') {
      toast.success(`${unitId} 資料已更新`, { 
        timeout: 1500,
        position: POSITION.BOTTOM_CENTER
      });
      if (onSuccess) onSuccess();
    } else {
      throw new Error(result.message);
    }
  } catch (error) {
    console.error("更新失敗:", error);
    toast.error(`更新失敗: ${error.message}`, { position: POSITION.BOTTOM_CENTER });
    if (onError) onError(error);
  }
};

const handleRefreshData = async () => {
  console.log('🔄 [Manual Refresh] 用戶要求刷新數據');
  isRefreshing.value = true;
  try {
    await salesDataStore.loadProjectData(projectId.value, true);
    toast.success(' 資料已更新到最新版本', { position: POSITION.BOTTOM_CENTER });
    console.log(` [Manual Refresh] 刷新完成，戶別數量: ${salesHouseholds.value.length}`);
  } catch (err) {
    toast.error('❌ 資料更新失敗: ' + err.message, { position: POSITION.BOTTOM_CENTER });
    console.error('❌ [Manual Refresh] 刷新失敗:', err);
  } finally {
    isRefreshing.value = false;
  }
};

onMounted(async () => {
  console.log('🏗️ [SalesControlSystem] 開始載入銷控資料...');
  loading.value = true;
  try {
    await salesDataStore.loadProjectData(projectId.value);
    await textStyleStore.fetchStyles(projectId.value);
    await statusColorStore.fetchColors(projectId.value);
    console.log(` [SalesControlSystem] 數據載入完成，戶別數量: ${salesHouseholds.value.length}`);
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
    if (salesDataStore.getProjectData(projectId.value).households.length > 0) {
      console.log('⚠️ [SalesControlSystem] 使用緩存數據作為備用');
      error.value = null; 
    }
  } finally {
    loading.value = false;
  }
});

onUnmounted(() => {
  console.log('🧹 [SalesControlSystem] 組件卸載');
});

// Export/Upload methods (Keeping same)
const exportToExcel = () => {
    if (salesHouseholds.value.length === 0) {
        toast.info('目前沒有資料可匯出。', { position: POSITION.BOTTOM_CENTER });
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
                return value.join(','); 
            }
            if (value instanceof Date) {
                return value.toISOString().split('T')[0];
            }
            if (typeof value === 'boolean') {
                return value ? 'TRUE' : 'FALSE';
            }
            if (value && typeof value.toDate === 'function') { 
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
            const headerToKeyMap = new Map(COLUMN_DEFINITIONS.map(col => [col.title.trim(), col.key]));
            const requiredHeaders = new Set(headerToKeyMap.keys());
            const data = new Uint8Array(e.target.result);
            const workbook = XLSX.read(data, { type: 'array', cellDates: true });
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            const dataAsArrays = XLSX.utils.sheet_to_json(worksheet, { header: 1, range: 1 });

            if (dataAsArrays.length < 1) {
                 throw new Error(`檔案缺少標頭列 (應在第 2 行)。`);
            }
            const uploadedHeaders = dataAsArrays[0].map(h => String(h || '').trim());
            const uploadedHeadersSet = new Set(uploadedHeaders);
            const missingHeaders = [];
            for (const requiredHeader of requiredHeaders) {
                if (!uploadedHeadersSet.has(requiredHeader)) {
                    missingHeaders.push(requiredHeader);
                }
            }
            if (missingHeaders.length > 0) {
                throw new Error(`檔案缺少必要的欄位標頭: ${missingHeaders.join('、')}`);
            }
            const indexToKeyMap = new Map();
            uploadedHeaders.forEach((headerTitle, index) => {
                const englishKey = headerToKeyMap.get(headerTitle);
                if (englishKey) {
                    indexToKeyMap.set(index, englishKey);
                }
            });
            const dataRows = dataAsArrays.slice(1);
            const nonEmptyRows = dataRows.filter(row => row.some(cell => cell !== null && cell !== undefined && cell !== ''));
            const jsonDataWithEnglishKeys = nonEmptyRows.map(rowArray => {
                const newRow = {};
                for (const [colIndex, englishKey] of indexToKeyMap.entries()) {
                    newRow[englishKey] = rowArray[colIndex] ?? null;
                }
                return newRow;
            });
            if (jsonDataWithEnglishKeys.some(row => !row.unitId)) {
                throw new Error("資料驗證失敗：每一列都必須包含『戶別』。請檢查上傳的檔案。");
            }
            parsedData.value = jsonDataWithEnglishKeys;
            uploadMessageType.value = 'success';
            uploadMessage.value = `成功解析 ${jsonDataWithEnglishKeys.length} 筆資料 (欄位順序已自動匹配)，可以開始上傳。`;
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
/* (原本的 CSS 樣式全部保留) */
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
  
  /* ✅ [修改] 寬度設定 */
  /* width: 100%;  <-- 移除或註解掉原本的 100% */
  width: fit-content;  /* 讓寬度根據內容自動縮放 */
  max-width: 100%;     /* 限制最大寬度不超過螢幕 (原本有設 95vw 也可維持) */
  
  /* ✅ [新增] 水平置中 */
  margin: 0 auto;      
  
  /* 高度維持填滿，確保背景色與捲動功能正常 */
  height: 100%; 
}
.content-wrapper {
  flex-grow: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden; /* 防止內容溢出導致外層滾動 */
  
  /* ✅ [建議新增] 確保 wrapper 也是填滿的狀態 */
  height: 100%; 
  position: relative; 
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
.pre-wrap-alert {
   white-space: pre-wrap;
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

/* 手動刷新按鈕動畫效果 */
.v-btn:has(.mdi-refresh) {
  transition: transform 0.2s ease;
}

.v-btn:has(.mdi-refresh):hover {
  transform: scale(1.05);
}


/* ------------------------------------------
   🚀 NEW: 列表模式優化 (修正對齊版)
   ------------------------------------------ */

.list-view-container {
  width: 100%;
  height: 100%;
  background-color: white;
  border-radius: 8px;
  
  /* ✅ [新增] 底部增加內距，防止最後一列貼底或被切到 */
  padding-bottom: 10px; 
  
  /* 確保內容溢出時的處理方式 */
  display: flex;
  flex-direction: column;
}


/* 強制單元格內容不換行 (這會自然撐開欄位寬度) */
.compact-table :deep(th),
.compact-table :deep(td) {
  white-space: nowrap !important; /* 關鍵：讓內容撐開寬度 */
  padding: 0 12px !important;     /* 保持緊湊間距 */
}

/* 備註欄位：允許換行，並設定最大寬度，避免把表格撐太寬 */
.compact-table :deep(td:last-child) {
  white-space: normal !important; 
  min-width: 150px;
  max-width: 300px;
  line-height: 1.4;
  font-size: 0.9rem;
}

/* 表頭樣式微調 */
.list-view-container :deep(.v-data-table-header th) {
  background-color: #f5f5f7 !important;
  font-weight: bold;
  color: #1a3a6e;
  height: 44px !important;
  /* 移除 text-align: left !important，讓 JS 的 align: 'start' 生效 */
}

/* 內容行樣式微調 */
.list-view-container :deep(tbody tr td) {
  height: 40px !important;
  /* 移除 text-align: left !important */
}

/* 數字欄位字體優化 (可選) */
.text-indigo, .text-success, .text-error {
  font-family: 'Roboto', sans-serif; /* 數字用無襯線字體比較好看 */
}

/* 微調表頭開關的樣式 */
.compact-table :deep(.v-switch .v-label) {
  font-size: 0.85rem; /* 縮小標籤文字 */
  color: #666;
  white-space: nowrap;
}

/* 確保表頭游標正確 */
.cursor-pointer {
  cursor: pointer;
}

/* ✅ [新增] 防止文字被選取 */
.user-select-none {
  user-select: none;
}
</style>