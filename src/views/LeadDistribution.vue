<template>
  <v-container fluid class="pa-4 bg-grey-lighten-4 fill-height align-start">
    <v-row>
      <v-col cols="12" class="d-flex align-center pb-0">
      <v-btn 
          v-if="!hideBack"
          icon="mdi-arrow-left" 
          variant="text" 
          @click="router.push({ name: 'LeadDistributionEntry' })" 
          class="me-2"
        ></v-btn>
        <div>
          <h2 class="text-h6 font-weight-bold text-primary">聯絡名單管理</h2>
          <div class="text-caption text-grey">{{ projectName }}</div>
        </div>
        <v-spacer></v-spacer>
        <v-btn 
        v-if="isAdmin || isReceptionist"
        icon="mdi-text-box-plus" 
        variant="text" 
        color="primary" 
        @click="showUploadDialog = true" 
        v-tooltip:bottom="'名單解析與分配'"
      ></v-btn>

<v-btn 
  v-if="isAdmin" 
  icon="mdi-trash-can-outline" 
  variant="text" 
  color="error" 
  @click="showRecycleBin = true" 
  v-tooltip:bottom="'名單垃圾桶'"
></v-btn>

<v-btn 
  v-if="isAdmin || isReceptionist"
  icon="mdi-cog" 
  variant="text" 
  color="grey-darken-1" 
  @click="showSettings = true" 
  v-tooltip:bottom="'聯絡名單系統設定'"
></v-btn>
      </v-col>

      <v-col cols="12">
        <v-tabs v-model="activeTab" color="primary" grow density="compact">
          <v-tab v-if="isReceptionist || isAdmin" value="management">
            <v-icon start>mdi-tray-arrow-down</v-icon>聯絡名單統計
          </v-tab>
          <v-tab value="status">
            <v-icon start>mdi-clipboard-text-clock</v-icon>名單聯絡狀況
          </v-tab>
        </v-tabs>

        <v-window v-model="activeTab" class="mt-4">
          <v-window-item value="management" v-if="isReceptionist || isAdmin">
            <v-row>
              <v-col cols="12" md="6">
                <v-card variant="flat" class="rounded-lg pa-4 fill-height">
                  <div class="text-subtitle-2 font-weight-bold mb-4">處理進度統計</div>
                  <div style="height: 200px; position: relative;" class="d-flex justify-center">
                    <Doughnut :data="progressChartData" :options="chartOptions" />
                    <div class="chart-center-label">
                      <div class="text-h5 font-weight-bold">{{ completionRate }}%</div>
                      <div class="text-caption text-grey">總計 {{ allLeads.length }} 筆</div> 
                    </div>
                  </div>
                  <div class="d-flex justify-space-between mt-4 px-4 text-center"> 
                    <div class="text-left">
                      <div class="text-caption text-grey">已完成</div>
                      <div class="font-weight-bold text-success">{{ leadStats.done }}</div>
                    </div>
                    <div class="text-right">
                      <div class="text-caption text-grey">未處理</div>
                      <div class="font-weight-bold text-error">{{ leadStats.pending }}</div>
                    </div>
                  </div>
                </v-card>
              </v-col>
              <v-col cols="12" md="6">
                <v-card variant="flat" class="rounded-lg pa-4">
                  <div class="text-subtitle-2 font-weight-bold mb-4">人員處理狀況</div> 
                  <div style="position: relative; height: 250px;">
                    <Bar :data="staffLoadChartData" :options="barOptions" />
                  </div>
                </v-card>
              </v-col>

              <v-col cols="12" md="6">
                <v-card variant="flat" class="rounded-lg pa-4 fill-height">
                  <div class="text-subtitle-2 font-weight-bold mb-4">預算佔比統計</div>
                  <div style="height: 250px;">
                    <Pie :data="budgetChartData" :options="pieOptions" />
                  </div>
                </v-card>
              </v-col>

              <v-col cols="12" md="6">
                <v-card variant="flat" class="rounded-lg pa-4 fill-height">
                  <div class="text-subtitle-2 font-weight-bold mb-4">來源管道統計</div>
                  <div style="height: 250px;">
                    <Pie :data="sourceChartData" :options="pieOptions" />
                  </div>
                </v-card>
              </v-col>
                <v-col cols="12" md="6">
                  <v-card variant="flat" class="rounded-lg pa-4 fill-height">
                    <div class="text-subtitle-2 font-weight-bold mb-4">聯絡狀況總計</div>
                    <div v-if="allProjectLogs.length > 0" style="height: 250px;">
                      <Pie :data="statusDistributionChartData" :options="pieOptions" />
                    </div>
                    <div v-else class="d-flex align-center justify-center fill-height text-grey-lighten-1">
                      尚無聯絡回報資料
                    </div>
                  </v-card>
                </v-col>

              <v-col cols="12" md="6">
              <v-card variant="flat" class="rounded-lg pa-4 fill-height">
                <div class="text-subtitle-2 font-weight-bold mb-4">不考慮原因分析</div>
                <div v-if="allProjectLogs.some(log => log.status === '不考慮')" style="height: 250px;">
                  <Pie :data="deniedReasonChartData" :options="pieOptions" />
                </div>
                <div v-else class="d-flex align-center justify-center fill-height text-grey-lighten-1">
                  尚無不考慮名單資料
                </div>
              </v-card>
            </v-col>
            </v-row>
          </v-window-item>

          <v-window-item value="status">
<v-card variant="flat" class="mb-4 pa-4 rounded-xl border bg-white shadow-sm">
  <v-row dense align="center">
    <v-col cols="12" sm="4">
      <v-text-field v-model="namePhoneSearch" label="關鍵字搜尋" prepend-inner-icon="mdi-magnify" variant="outlined" density="comfortable" hide-details clearable rounded="lg"></v-text-field>
    </v-col>
     <v-col v-if="isReceptionist || isAdmin" cols="12" sm="4" >
      <v-select v-model="assignedSearch" :items="salesStaff" item-title="name" item-value="id" label="人員" multiple variant="outlined" density="comfortable" hide-details rounded="lg" prepend-inner-icon="mdi-account-search">
        <template v-slot:selection="{ index }"><span v-if="index === 0" class="text-caption">人員 (+{{ assignedSearch.length }})</span></template>
      </v-select>
    </v-col>
    <v-col cols="12" sm="4">
      <v-select v-model="statusSearch" :items="['未處理', ...statusOptions]" label="狀態" multiple variant="outlined" density="comfortable" hide-details rounded="lg" prepend-inner-icon="mdi-filter-variant">
        <template v-slot:selection="{ index }"><span v-if="index === 0" class="text-caption">狀態 (+{{ statusSearch.length }})</span></template>
      </v-select>
    </v-col>
    <v-col cols="12" sm="4" >
  <v-select 
    v-model="reasonSearch" 
    :items="reasonFilterOptions" 
    label="不考慮原因" 
    multiple 
    variant="outlined" 
    density="comfortable" 
    hide-details 
    rounded="lg" 
    prepend-inner-icon="mdi-comment-question"
  >
    <template v-slot:selection="{ index }">
      <span v-if="index === 0" class="text-caption">原因 (+{{ reasonSearch.length }})</span>
    </template>
  </v-select>
</v-col>
   

    <v-col cols="12" sm="4">
      <v-select v-model="sourceSearch" :items="sourceOptions" label="來源" multiple variant="outlined" density="comfortable" hide-details rounded="lg" prepend-inner-icon="mdi-tray-arrow-down">
        <template v-slot:selection="{ index }"><span v-if="index === 0" class="text-caption">來源 (+{{ sourceSearch.length }})</span></template>
      </v-select>
    </v-col>
    <v-col cols="12" sm="4" >
      <v-select v-model="budgetSearch" :items="budgetOptions" label="預算" multiple variant="outlined" density="comfortable" hide-details rounded="lg" prepend-inner-icon="mdi-currency-usd">
        <template v-slot:selection="{ index }"><span v-if="index === 0" class="text-caption">預算 (+{{ budgetSearch.length }})</span></template>
      </v-select>
    </v-col>
    <v-col cols="6" sm="2" class="mt-sm-2" >
  <v-text-field
    v-model="startDate"
    label="填表日期(起)"
    type="date"
    variant="outlined"
    density="comfortable"
    hide-details
    rounded="lg"
    
    color="primary"
    clearable
  ></v-text-field>
</v-col>

<v-col cols="6" sm="2" class="mt-sm-2">
  <v-text-field
    v-model="endDate"
    label="填表日期(迄)"
    type="date"
    variant="outlined"
    density="comfortable"
    hide-details
    rounded="lg"
   
    color="primary"
    clearable
    :min="startDate" 
  ></v-text-field>
</v-col>

<v-col cols="12" md="4" class="mt-2 d-flex align-center">
      <v-btn
        color="success"
        prepend-icon="mdi-file-excel"
        variant="elevated"
        rounded="lg"
        block
        :loading="isLeadsExporting"
        @click="executeLeadsExport"
        class="font-weight-bold"
      >
        下載聯絡狀況 EXCEL
      </v-btn>
    </v-col>

  </v-row>
</v-card>

  <v-data-table
    :headers="statusHeaders"
    :items="filteredLeads"
    class="rounded-lg elevation-1 d-none d-md-block"
  >
    <template v-slot:item.status="{ item }">
      <v-chip :color="getStatusColor(item.status)" size="small">
        {{ item.status || '未處理' }}
      </v-chip>
    </template>
    <template v-slot:item.actions="{ item }">
      <v-btn icon="mdi-comment-edit" variant="text" color="primary" @click="openReport(item)"></v-btn>
      <v-btn v-if="isReceptionist" icon="mdi-delete" variant="text" color="error" @click="handleSoftDelete(item)"></v-btn>
    </template>
  </v-data-table>

  <div class="d-block d-md-none">
    <v-card 
      v-for="item in filteredLeads" 
      :key="item.id" 
      class="mb-4 rounded-xl elevation-2 overflow-hidden border-0"
    >
      <v-card-text class="pa-4">
        <div class="d-flex align-center justify-space-between mb-3">
          <div class="d-flex align-center">
            <v-avatar color="indigo-darken-4" size="40" class="me-3">
              <v-icon color="white" size="24">mdi-account</v-icon>
            </v-avatar>
            <div>
              <div class="text-subtitle-1 font-weight-bold indigo--text text--darken-4">{{ item.name }}</div>
              <div class="text-caption text-grey-darken-1">{{ item.phone }}</div>
            </div>
          </div>
          <div class="d-flex align-center">
            <v-chip :color="getStatusColor(item.status)" size="x-small" class="font-weight-bold me-2">
              {{ item.status || '未處理' }}
            </v-chip>
            <v-btn icon="mdi-comment-edit" variant="text" color="primary" size="small" @click="openReport(item)"></v-btn>
            <v-btn v-if="isReceptionist" icon="mdi-delete" variant="text" color="error" size="small" @click="handleSoftDelete(item)"></v-btn>
          </div>
        </div>

        <v-card variant="flat" class="bg-indigo-lighten-5 rounded-lg border-indigo-lighten-4 border pa-3">
          <v-row no-gutters class="flex-wrap">
            
            <v-col cols="12" class="mt-2 pt-2 border-top-custom" v-if="item.note">
          <div class="info-label text-indigo-darken-3">備註</div>
          <div class="info-value text-indigo-darken-4">
            <v-icon size="14" class="me-1">mdi-note-text-outline</v-icon>
            {{ item.note }}
          </div>
        </v-col>

            <v-col cols="12" class="mb-2 pb-2 border-bottom-custom">
              <div class="info-label">來源管道</div>
              <div class="info-value">
                <v-icon size="14" class="me-1" color="indigo-darken-2">mdi-tray-arrow-down</v-icon>
                {{ item.source || '未註明' }}
              </div>
            </v-col>

            <v-col cols="12" class="mt-1 pb-2 border-bottom-custom" v-if="item.status === '不考慮'">
              <div class="info-label text-error font-weight-black">不考慮原因</div>
              <div class="info-value text-error font-weight-bold">
                <v-icon size="16" class="me-1" color="error">mdi-alert-circle-outline</v-icon>
                {{ item.reason || '未註明' }}
              </div>
            </v-col>

            <v-col cols="6" class="pe-2 mt-2">
              <div class="info-label">預算範圍</div>
              <div class="info-value">{{ item.budget || '未填寫' }}</div>
            </v-col>

            <v-col cols="6" class="ps-2 border-left-custom mt-2">
              <div class="info-label">填表日期</div>
              <div class="info-value">{{ item.date || '無日期' }}</div>
            </v-col>

          </v-row>
        </v-card>
        
        <div class="mt-2 text-caption text-grey-darken-1 d-flex align-center">
          <v-icon size="14" class="me-1">mdi-account-tie</v-icon>
          負責人：<span class="font-weight-bold text-indigo-darken-2">{{ item.assignedName || '尚未指派' }}</span>
        </div>
      </v-card-text>
    </v-card>
  </div>
</v-window-item>
        </v-window>
      </v-col>
    </v-row>

   <v-dialog v-model="showReportDialog" fullscreen transition="dialog-bottom-transition">
  <v-card class="bg-grey-lighten-4">
    <v-toolbar color="primary" dark>
      <v-btn icon="mdi-close" @click="showReportDialog = false"></v-btn>
      <v-toolbar-title class="text-subtitle-1 font-weight-bold">
        聯絡回報: {{ currentLead?.name }}
      </v-toolbar-title>
    </v-toolbar>
    
<v-container>
  <v-row justify="center">
    <v-col cols="12" md="8" lg="6">
      
      <v-card class="pa-4 mb-4 rounded-xl elevation-2 bg-indigo-darken-4 text-white">
        <v-row align="center" no-gutters>
          <v-col cols="auto" class="me-4">
            <v-avatar color="white" size="56">
              <v-icon color="indigo-darken-4" size="32">mdi-account</v-icon>
            </v-avatar>
          </v-col>
          <v-col>
            <div class="text-h6 font-weight-bold">{{ currentLead?.name }}</div>
            <div class="text-subtitle-2 opacity-80 d-flex align-center">
              <v-icon size="16" class="me-1">mdi-phone</v-icon>
              {{ currentLead?.phone }}
            </div>
          </v-col>
        </v-row>

        <v-divider class="my-3 border-opacity-25" color="white"></v-divider>

        <v-row dense>
          <v-col cols="6">
            <div class="text-caption opacity-70">來源管道</div>
            <div class="text-body-2 font-weight-bold">{{ currentLead?.source || '未註明' }}</div>
          </v-col>
          <v-col cols="6">
            <div class="text-caption opacity-70">購屋預算</div>
            <div class="text-body-2 font-weight-bold">{{ currentLead?.budget || '未填寫' }}</div>
          </v-col>
          <v-col cols="12" class="mt-2">
            <div class="text-caption opacity-70">填表日期</div>
            <div class="text-body-2 font-weight-bold">{{ currentLead?.date || '無日期' }}</div>
          </v-col>
          
          <v-col cols="12" class="mt-2" v-if="currentLead?.note">
            <v-alert
              density="compact"
              color="indigo-lighten-1"
              icon="mdi-note-text"
              class="text-caption rounded-lg mt-1"
            >
              <div class="font-weight-bold mb-1">備註：</div>
              {{ currentLead.note }}
            </v-alert>
          </v-col>
        </v-row>
      </v-card>

      <v-card class="pa-5 mb-6 rounded-xl elevation-2">
        <div class="section-title mb-3">聯絡狀況回報</div>
        
        <v-select
          v-model="reportForm.status"
          :items="statusOptions"
          label="選擇聯絡結果"
          variant="outlined"
          rounded="lg"
          class="mb-3"
          density="comfortable"
          hide-details
          color="indigo-darken-4"
        ></v-select>

        <template v-if="showReasonField">
          <v-text-field
            v-if="isReasonReadonly"
            v-model="reportForm.reason"
            label="未約原因 (系統自動填入)"
            variant="filled"
            readonly
            rounded="lg"
            class="mb-3"
            density="comfortable"
            hide-details
            bg-color="grey-lighten-3"
          ></v-text-field>

          <v-select
            v-else
            v-model="reportForm.reason"
            :items="reasonOptions"
            label="請選擇未約原因"
            variant="outlined"
            rounded="lg"
            class="mb-3"
            density="comfortable"
            color="indigo-darken-4"
            hide-details
          ></v-select>
        </template>

        <v-btn 
          v-if="reportForm.status === '已約賞屋'"
          block 
          :color="isBookingCompleted ? 'success' : 'primary'" 
          variant="elevated"
          class="mb-4 font-weight-bold"
          :prepend-icon="isBookingCompleted ? 'mdi-check-circle' : 'mdi-calendar-check'"
          @click="openBookingDialog"
        >
          {{ isBookingCompleted ? '預約已完成 (點擊可修改)' : '開啟預約視窗' }}
        </v-btn>

        <v-textarea
          v-model="reportForm.note"
          label="詳細談話紀錄"
          variant="outlined"
          placeholder="請輸入通話內容摘要..."
          rounded="lg"
          rows="3"
          class="mb-4"
          hide-details
          color="indigo-darken-4"
        ></v-textarea>

        <div class="text-center mt-6">
          <v-btn 
            :color="reportForm.status === '已約賞屋' && !isBookingCompleted ? 'grey-darken-1' : 'green'" 
            size="x-large" 
            rounded="lg"
            elevation="2"
            min-width="200"
            :disabled="isSubmitDisabled"
            @click="submitReport"
            class="font-weight-bold"
          >
            {{ submitBtnText }}
          </v-btn>
        </div>
      </v-card>

      <div class="section-title mt-8 mb-3 d-flex align-center">
        <v-icon size="20" class="me-2">mdi-history</v-icon>回報日誌
      </div>
      
      <div v-if="leadLogs.length === 0" class="text-center py-6 text-grey-lighten-1 border-dashed rounded-lg">
        尚無聯絡紀錄
      </div>

      <div v-else class="history-timeline">
        <v-card
          v-for="(log, idx) in leadLogs"
          :key="idx"
          variant="flat"
          class="mb-3 pa-4 rounded-xl history-item shadow-sm"
          :class="`status-${getStatusKey(log.status)}`"
        >
          <div class="d-flex justify-space-between align-start mb-2">
            <v-chip size="small" :color="getStatusColor(log.status)" class="font-weight-bold" variant="flat">
              {{ log.status }}
            </v-chip>
            <span class="text-caption text-grey-darken-1 font-weight-bold">
              {{ formatDateTime(log.createdAt) }}
            </span>
          </div>
          <div v-if="log.reason" class="text-caption text-indigo-darken-4 font-weight-bold mb-1">
            原因：{{ log.reason }}
          </div>
          <div class="text-body-2 font-weight-bold text-grey-darken-3 mb-1" style="white-space: pre-line;">{{ log.note }}</div>
          <div class="text-caption text-grey-darken-1">回報人：{{ log.createdBy }}</div>
        </v-card>
      </div>
    </v-col>
  </v-row>
</v-container>
  </v-card>
</v-dialog>

<ViewingReservationDialog 
  v-if="showBookingDialog"
  v-model="showBookingDialog"
  :project-id="projectId"
  :initial-data="bookingInitialData"
  @saved="onBookingSaved"
/>
    <v-dialog v-model="showRecycleBin" max-width="900" scrollable>
      <v-card class="rounded-xl">
        <v-toolbar color="error" density="compact" class="px-4">
          <v-icon start>mdi-trash-can-outline</v-icon>
          <v-toolbar-title class="text-subtitle-1 font-weight-bold">回收站 (僅管理員可見)</v-toolbar-title>
          <v-spacer></v-spacer>
          <v-btn icon="mdi-close" variant="text" @click="showRecycleBin = false"></v-btn>
        </v-toolbar>
        
        <v-card-text class="pa-0">
          <v-data-table
            :headers="recycleHeaders"
            :items="deletedLeads"
            density="comfortable"
            no-data-text="回收站目前沒有任何名單"
          >
            <template v-slot:item.deletedAt="{ item }">
              <div class="text-caption text-grey">{{ formatDateTime(item.deletedAt) }}</div>
            </template>
            <template v-slot:item.actions="{ item }">
              <div class="d-flex gap-1">
                <v-btn size="x-small" color="success" variant="tonal" @click="restoreLead(item)">還原</v-btn>
                <v-btn size="x-small" color="error" variant="text" @click="permanentlyDeleteLead(item)">永久刪除</v-btn>
              </div>
            </template>
          </v-data-table>
        </v-card-text>
      </v-card>
    </v-dialog>

    <LeadSettingsDialog 
      v-model="showSettings" 
      :project-id="projectId" 
      @settings-updated="onSettingsUpdated"
    />

    <v-dialog v-model="showUploadDialog" max-width="1200" persistent scrollable>
      <v-card class="rounded-xl overflow-hidden">
        <v-toolbar color="primary" density="compact" class="px-4">
          <v-icon start>mdi-auto-fix</v-icon>
          <v-toolbar-title class="text-subtitle-1 font-weight-bold">
            {{ uploadStep === 1 ? '第一步：貼入名單文本' : '第二步：解析與預約分配' }}
          </v-toolbar-title>
          <v-spacer></v-spacer>
          <v-btn icon="mdi-close" variant="text" @click="closeUploadDialog"></v-btn>
        </v-toolbar>

<v-card-text v-if="uploadStep === 1" class="pa-6 bg-grey-lighten-4">
<v-tabs v-model="uploadMode" color="primary" class="mb-4" grow density="compact">
  <v-tab value="text">文本模式</v-tab>
  <v-tab value="excel">EXCEL 模式</v-tab>
  <v-tab value="manual">手動輸入</v-tab>
</v-tabs>

  <v-window v-model="uploadMode">
    <v-window-item value="text">
      <div v-for="(input, index) in uploadInputs" :key="index" class="mb-3">
        <v-textarea
          v-model="uploadInputs[index]"
          label="請貼入完整的客戶訊息 (系統將自動解析)"
          variant="flat"
          bg-color="white"
          rounded="lg"
          auto-grow
          rows="3"
          density="comfortable"
          prepend-inner-icon="mdi-card-text-outline"
          persistent-placeholder
          hide-details
        ></v-textarea>
      </div>
      <v-btn variant="dashed" color="primary" block class="mt-2 rounded-lg" prepend-icon="mdi-plus" @click="uploadInputs.push('')">
        新增另一組文本內容
      </v-btn>
    </v-window-item>

    <v-window-item value="excel">
      <v-file-input
        v-model="excelFile"
        label="點擊或拖放 EXCEL 檔案至此"
        accept=".xlsx, .xls"
        variant="outlined" 
        bg-color="white"
        prepend-inner-icon="mdi-file-excel"
        rounded="lg"
        show-size
        hide-details
        @update:model-value="handleExcelFileSelect"
      ></v-file-input>
      <v-alert type="info" variant="tonal" density="compact" class="mt-2 text-caption">
        請確保第一列為表頭：客戶姓名、聯絡電話、來源管道、購屋預算、填表日期、**指派銷售(選填)**
      </v-alert>
    </v-window-item>

<v-window-item value="manual">
  <div v-for="(item, index) in manualInputs" :key="index" class="mb-4 pa-4 border rounded-lg bg-white">
    <v-row dense>
      <v-col cols="12" sm="6">
        <v-text-field v-model="item.name" label="客戶姓名" variant="outlined" density="comfortable" hide-details class="mb-2"></v-text-field>
      </v-col>
      <v-col cols="12" sm="6">
        <v-text-field v-model="item.phone" label="聯絡電話" variant="outlined" density="comfortable" hide-details class="mb-2"></v-text-field>
      </v-col>
      
      <v-col cols="12" sm="4">
        <v-text-field 
          v-model="item.source" 
          label="來源管道 (如：公司介紹、跑單介紹..." 
          variant="outlined" 
          density="comfortable" 
          hide-details
          prepend-inner-icon="mdi-tray-arrow-down"
        ></v-text-field>
      </v-col>

      <v-col cols="12" sm="4">
        <v-select v-model="item.budget" :items="budgetOptions" label="預算" variant="outlined" density="comfortable" hide-details></v-select>
      </v-col>
      <v-col cols="12" sm="4">
        <v-text-field v-model="item.date" label="填表日期" type="date" variant="outlined" density="comfortable" hide-details></v-text-field>
      </v-col>
      <v-col cols="12">
        <v-text-field v-model="item.note" label="備註事項" variant="outlined" density="comfortable" hide-details prepend-inner-icon="mdi-note-edit"></v-text-field>
      </v-col>
    </v-row>
    </div>
</v-window-item>


  </v-window>
</v-card-text>

        <v-card-text v-if="uploadStep === 2" class="pa-0">
<div class="bg-primary-lighten-5 pa-3 d-flex align-center gap-4 border-bottom flex-wrap">
  <span class="text-caption font-weight-bold text-primary">解析摘要：</span>
  <v-chip size="x-small" color="primary" variant="flat">總計 {{ previewLeads.length }} 筆</v-chip>
  
  <v-chip size="x-small" color="success" variant="flat">✨ 全新名單 {{ summaryCount.new }} 筆</v-chip>
  
  <v-chip size="x-small" color="error" variant="elevated" class="font-weight-bold" v-if="summaryCount.unassigned">
    ⚠️ 待指派銷售 {{ summaryCount.unassigned }} 筆
  </v-chip>

  <v-chip size="x-small" color="orange-darken-2" variant="flat" v-if="summaryCount.vip">🚩 既有客資 {{ summaryCount.vip }} 筆</v-chip>
  
  <v-chip size="x-small" color="yellow-darken-3" variant="flat" v-if="summaryCount.internalDup">
    🔄 本次名單重複 {{ summaryCount.internalDup }} 筆
  </v-chip>

  <v-chip size="x-small" color="blue-grey-darken-1" variant="flat" v-if="summaryCount.lead">⚠️ 重複名單 {{ summaryCount.lead }} 筆</v-chip>
  
  <v-spacer></v-spacer>
  <v-progress-circular v-if="isCheckingDuplicates" indeterminate size="16" width="2" color="primary" class="me-2"></v-progress-circular>
</div>

          <!-- Desktop View: Table -->
          <v-table v-if="!mobile" density="comfortable" fixed-header height="500px" class="preview-table">
                <thead>
                  <tr class="bg-grey-lighten-4">
                    <th class="text-left" width="15%">客戶資訊</th>
                    <th class="text-left font-weight-bold" width="15%">檢查狀態與日期</th>
                    <th class="text-left" width="25%">指派銷售人員</th> 
                    <th class="text-left" width="40%">名單屬性</th>
                    <th class="text-center" width="50px">操作</th>
                  </tr>
                </thead>
            <tbody>
              <tr 
                  v-for="(lead, idx) in previewLeads" 
                  :key="idx" 
                  :class="[!lead.assignedTo ? 'bg-red-lighten-5' : getRowClass(lead.phone)]"
                >
                <td class="pa-4">
                  <v-text-field
                    v-model="lead.name"
                    variant="underlined"
                    density="compact"
                    hide-details
                    prepend-inner-icon="mdi-account"
                    class="font-weight-bold mb-1"
                  ></v-text-field>
                  <v-text-field
                    v-model="lead.phone"
                    variant="underlined"
                    density="compact"
                    hide-details
                    prepend-inner-icon="mdi-phone"
                    :color="lead.phone.length !== 10 ? 'error' : ''"
                    :hint="lead.phone.length !== 10 ? '電話長度異常' : ''"
                    persistent-hint
                  ></v-text-field>
                </td>

                <td class="text-center pa-2">
                  <div v-if="internalDuplicateMap[lead.phone]?.length > 1" class="mb-2">
                    <v-chip color="warning" size="x-small" variant="flat" class="font-weight-bold w-100">⚠️ 本次名單重複</v-chip>
                  </div>

                  <div v-if="duplicateResults[lead.phone]">
                    <!-- VIP: Existing Customer (Compact Mode) -->
                    <div v-if="duplicateResults[lead.phone].type === 'vip'">
                        <v-chip color="orange-lighten-4" class="text-orange-darken-4 font-weight-bold mb-1" size="small" label>
                            <v-icon start icon="mdi-crown" size="x-small"></v-icon> 既有客資
                        </v-chip>
                        <div class="text-caption text-grey-darken-1 mb-1 d-flex align-center">
                            <span class="font-weight-bold me-2">{{ duplicateResults[lead.phone].data.latestSalesName }}</span>
                            <span class="text-grey">{{ duplicateResults[lead.phone].data.date || '--' }}</span>
                        </div>
                        <v-btn 
                            size="x-small" 
                            variant="tonal" 
                            color="orange-darken-2" 
                            class="px-2"
                            prepend-icon="mdi-magnify"
                            @click="openDetail(lead.phone, duplicateResults[lead.phone], 'vip')"
                        >
                            詳情
                        </v-btn>
                    </div>

                    <!-- Lead: Duplicate (Compact Mode) -->
                    <div v-else-if="duplicateResults[lead.phone].type === 'lead'">
                        <v-chip color="blue-grey-lighten-4" class="text-blue-grey-darken-3 font-weight-bold mb-1" size="small" label>
                            <v-icon start icon="mdi-alert-circle" size="x-small"></v-icon> 重複名單
                        </v-chip>
                        <div class="text-caption text-grey-darken-1 mb-1 d-flex align-center">
                            <span class="font-weight-bold me-2">{{ duplicateResults[lead.phone].data.assignedName }}</span>
                            <span class="text-grey">{{ duplicateResults[lead.phone].data.date || '--' }}</span>
                        </div>
                        <v-btn 
                            size="x-small" 
                            variant="tonal" 
                            color="blue-grey-darken-2" 
                            class="px-2"
                            prepend-icon="mdi-magnify"
                            @click="openDetail(lead.phone, duplicateResults[lead.phone], 'lead')"
                        >
                            詳情
                        </v-btn>
                    </div>

                    <!-- New Lead -->
                    <div v-else class="text-center pt-2">
                        <v-chip color="success" size="small" variant="elevated" prepend-icon="mdi-check-circle">✨ 全新名單</v-chip>
                    </div>
                  </div>

                  <div v-else class="text-center pt-2">
                     <v-progress-circular indeterminate size="20" width="2" color="primary"></v-progress-circular>
                  </div>
                </td>

                  <td>
                <v-select
                      v-model="lead.assignedTo"
                      :items="salesStaffWithCounts" 
                      item-title="displayName"
                      item-value="id"
                      :label="!lead.assignedTo ? '⚠️ 尚未選擇銷售' : '選擇銷售'"
                      :error="!lead.assignedTo"
                      density="compact"
                      hide-details="auto"
                      variant="outlined"
                      class="mt-1 font-weight-bold"
                      style="max-width: 260px;"
                      @update:model-value="(val) => { updateAssignedInfo(lead, val); applySorting(); }"
                    ></v-select>
                  </td>

            <td class="pa-4">
              <v-row dense>
                <v-col cols="6">
                  <v-text-field v-model="lead.source" label="來源" variant="underlined" density="compact" hide-details></v-text-field>
                </v-col>
                <v-col cols="6">
                  <v-text-field v-model="lead.budget" label="預算" variant="underlined" density="compact" hide-details></v-text-field>
                </v-col>
                <v-col cols="12">
                  <v-text-field v-model="lead.date" label="提交日期" variant="underlined" density="compact" hide-details prepend-inner-icon="mdi-calendar-clock"></v-text-field>
                </v-col>
                <v-col cols="12">
                  <v-text-field 
                    v-model="lead.note" 
                    label="備註" 
                    variant="underlined" 
                    density="compact" 
                    hide-details 
                    prepend-inner-icon="mdi-note-text-outline"
                    color="primary"
                  ></v-text-field>
                </v-col>
              </v-row>
            </td>

                            <td class="text-center">
                              <v-btn icon="mdi-trash-can-outline" variant="text" color="grey-lighten-1" size="small" @click="previewLeads.splice(idx, 1)"></v-btn>
                            </td>
                          </tr>
                        </tbody>
                      </v-table>

                      <!-- Mobile View: Card List -->
                      <div v-else class="preview-mobile-list" style="max-height: 500px; overflow-y: auto;">
                        <v-card 
                           v-for="(lead, idx) in previewLeads" 
                           :key="idx" 
                           class="mb-3 mx-1"
                           elevation="1"
                           border
                           :class="[!lead.assignedTo ? 'bg-red-lighten-5' : '']"
                        >
                            <v-card-text class="pa-3">
                                <!-- 1. Header: Name & Phone & Delete -->
                                <div class="d-flex justify-space-between align-center mb-2">
                                    <div class="d-flex align-center gap-2">
                                        <v-icon size="small" color="primary">mdi-account</v-icon>
                                        <span class="font-weight-bold text-subtitle-1">{{ lead.name }}</span>
                                        <span class="text-caption text-grey ml-2">{{ lead.phone }}</span>
                                    </div>
                                    <v-btn icon="mdi-trash-can-outline" variant="text" color="grey" density="compact" @click="previewLeads.splice(idx, 1)"></v-btn>
                                </div>

                                <!-- 2. Status Chips -->
                                <div class="mb-3 d-flex flex-wrap gap-2">
                                     <v-chip v-if="internalDuplicateMap[lead.phone]?.length > 1" color="warning" size="x-small" variant="flat" label>
                                        ⚠️ 本次重複
                                     </v-chip>
                                     <template v-if="duplicateResults[lead.phone]">
                                        <v-chip 
                                            v-if="duplicateResults[lead.phone].type === 'vip'" 
                                            color="orange-lighten-4" 
                                            class="text-orange-darken-4 font-weight-bold" 
                                            size="x-small" 
                                            label
                                            @click="openDetail(lead.phone, duplicateResults[lead.phone], 'vip')"
                                        >
                                            <v-icon start icon="mdi-crown" size="x-small"></v-icon> 既有客資 ({{ duplicateResults[lead.phone].data.latestSalesName }}) 詳情 >
                                        </v-chip>

                                        <v-chip 
                                            v-else-if="duplicateResults[lead.phone].type === 'lead'" 
                                            color="blue-grey-lighten-4" 
                                            class="text-blue-grey-darken-3 font-weight-bold" 
                                            size="x-small" 
                                            label
                                            @click="openDetail(lead.phone, duplicateResults[lead.phone], 'lead')"
                                        >
                                            <v-icon start icon="mdi-alert-circle" size="x-small"></v-icon> 重複名單 ({{ duplicateResults[lead.phone].data.assignedName }}) 詳情 >
                                        </v-chip>
                                         <v-chip v-else color="success" size="x-small" variant="elevated" prepend-icon="mdi-check-circle">✨ 全新名單</v-chip>
                                     </template>
                                      <v-progress-circular v-else indeterminate size="16" width="2" color="primary"></v-progress-circular>
                                </div>

                                <!-- 3. Assign -->
                                <v-select
                                  v-model="lead.assignedTo"
                                  :items="salesStaffWithCounts" 
                                  item-title="displayName"
                                  item-value="id"
                                  :label="!lead.assignedTo ? '⚠️ 尚未選擇銷售' : '選擇銷售'"
                                  :error="!lead.assignedTo"
                                  density="compact"
                                  hide-details="auto"
                                  variant="outlined"
                                  class="mb-3 font-weight-bold"
                                  bg-color="white"
                                  @update:model-value="(val) => { updateAssignedInfo(lead, val); applySorting(); }"
                                ></v-select>

                                <!-- 4. Fields -->
                                <v-row dense>
                                    <v-col cols="6">
                                        <v-text-field v-model="lead.source" label="來源" density="compact" variant="underlined" hide-details></v-text-field>
                                    </v-col>
                                    <v-col cols="6">
                                         <v-text-field v-model="lead.budget" label="預算" density="compact" variant="underlined" hide-details></v-text-field>
                                    </v-col>
                                    <v-col cols="12">
                                         <v-text-field v-model="lead.date" label="提交日期" density="compact" variant="underlined" hide-details></v-text-field>
                                    </v-col>
                                     <v-col cols="12">
                                         <v-text-field v-model="lead.note" label="備註" density="compact" variant="underlined" hide-details></v-text-field>
                                    </v-col>
                                </v-row>
                            </v-card-text>
                        </v-card>
                      </div>
                    </v-card-text>

        <v-divider></v-divider>
        <v-card-actions class="pa-4 bg-white">
        <v-btn v-if="uploadStep === 2" variant="text" color="grey-darken-1" prepend-icon="mdi-arrow-left" @click="uploadStep = 1">返回修改文本</v-btn>
       
          <v-spacer></v-spacer>
          <v-btn 
            v-if="uploadStep === 1" 
            color="primary" 
            variant="elevated" 
            min-width="150" 
            rounded="lg"
            @click="handleParsing"
          >開始解析文本</v-btn>
           <v-btn 
          v-if="uploadStep === 2" 
          color="success" 
          variant="elevated" 
          min-width="250" 
          rounded="lg"
          :disabled="isCheckingDuplicates"
          :loading="isImporting"
          @click="executeBatchImportAndAssign"
        >
          確認無誤並執行分配 ({{ previewLeads.length }}筆)
        </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Lead Detail Dialog -->
    <LeadDetailDialog
        v-model="detailDialog.visible"
        :lead-data="detailDialog.data"
        :type="detailDialog.type"
        @assign="handleQuickAssignFromDialog"
    />

    <v-snackbar v-model="snackbar.show" :color="snackbar.color" timeout="3000">
      {{ snackbar.text }}
    </v-snackbar>
  </v-container>
</template>

<script setup>
import LeadDetailDialog from '@/components/LeadDetailDialog.vue'; // Import Component
import { ref, computed, onMounted, reactive, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useUserStore } from '@/store/user';
import { useUiStore } from '@/store/uiStore';
import { db } from '@/firebase';
import { 
  collection, query, where, onSnapshot, orderBy, doc, 
  getDoc, getDocs, updateDoc, deleteDoc, serverTimestamp, addDoc,
  collectionGroup // ✅ 新增此項
} from 'firebase/firestore';

import { checkLeadDuplicates, batchImportAndAssignLeadsAPI } from '@/api'; 
import ChartDataLabels from 'chartjs-plugin-datalabels';

// 修改項目：新增 Pie 圖表註冊
// 修改項目：新增 Pie 圖表註冊
import { Doughnut, Bar, Pie } from 'vue-chartjs';
import { Chart as ChartJS, Title, Tooltip, Legend, ArcElement, CategoryScale, LinearScale, BarElement } from 'chart.js';
import { useDisplay } from 'vuetify'; // Import useDisplay
ChartJS.register(Title, Tooltip, Legend, ArcElement, CategoryScale, LinearScale, BarElement, ChartDataLabels);

// --- Detail Dialog Logic ---
const detailDialog = reactive({
    visible: false,
    type: 'vip',
    data: {}
});

const currentDetailPhone = ref('');
const { mobile } = useDisplay(); // Initialize mobile detection

const openDetail = (phone, result, type) => {
    currentDetailPhone.value = phone;
    detailDialog.type = type;
    detailDialog.data = result.data;
    detailDialog.visible = true;
};

const executeDialogAssign = (salesId) => {
    detailDialog.visible = false;
    if (!salesId || !currentDetailPhone.value) return;
    
    // 執行指派
    let count = 0;
    previewLeads.value.forEach(lead => {
        if (lead.phone === currentDetailPhone.value) {
            // 找到對應業務物件
            const sales = salesStaffWithCounts.value.find(s => s.id === salesId);
            if (sales) {
               updateAssignedInfo(lead, salesId); 
               count++;
            }
        }
    });

    // 強制觸發搜尋排序，確保畫面更新
    applySorting();
    
    if (count > 0) {
        snackbar.color = 'success';
        snackbar.text = `已將名單指派給業務`;
        snackbar.show = true;
    }
};


import LeadSettingsDialog from '@/components/LeadSettingsDialog.vue';


import ViewingReservationDialog from '@/components/ViewingReservationDialog.vue';
import * as XLSX from 'xlsx-js-style';


ChartJS.register(
  Title, Tooltip, Legend, ArcElement, CategoryScale, LinearScale, BarElement,
  ChartDataLabels // ✅ 新增註冊
);

const props = defineProps({
  projectId: {
    type: String,
    required: true
  },
  // ✅ 新增：用來控制是否隱藏返回按鈕
  hideBack: {
    type: Boolean,
    default: false
  }
});
const router = useRouter();
const userStore = useUserStore();
const uiStore = useUiStore();
// 2. 定義儲存所有日誌的變數
const allProjectLogs = ref([]);


// --- 狀態定義 ---
const activeTab = ref('management');
const allLeads = ref([]);
const deletedLeads = ref([]);
const salesStaff = ref([]);
const leadLogs = ref([]);
const currentLead = ref(null);

const showSettings = ref(false);
const showUploadDialog = ref(false);
const showRecycleBin = ref(false);
const showReportDialog = ref(false);

const uploadStep = ref(1);
const uploadInputs = ref(['']); 
const previewLeads = ref([]);   
const duplicateResults = ref({}); 
const isCheckingDuplicates = ref(false);

const reportForm = ref({ status: '', reason: '', note: '' });
const statusOptions = ref(['不考慮', '已約賞屋', '空號', '未接']);
const reasonOptions = ref(['家人討論', '總價太高', '單價太高', '暫不買房', '要找成屋', '號碼錯誤/空號', '未接電話']);
// 1. 新增搜尋變數
const reasonSearch = ref([]);

// 2. 自動提取現有的「不考慮原因」供篩選使用
const reasonFilterOptions = computed(() => {
  const reasons = allLeads.value
    .filter(l => l.status === '不考慮' && l.reason)
    .map(l => l.reason);
  return [...new Set(reasons), '未註明'];
});


const snackbar = reactive({ show: false, text: '', color: '' });

// ... 保持原有 state 定義 ...
const showBookingDialog = ref(false);
const bookingInitialData = ref({});
const isReasonReadonly = ref(false);

// 2. 邏輯連動：當回報狀態改變時 (比照 LeadReport.vue)
const showReasonField = computed(() => {
  return ['還在討論', '空號', '未接', '不考慮'].includes(reportForm.value.status);
});

watch(() => reportForm.value.status, (newStatus) => {

  isBookingCompleted.value = false; // ✅ 切換狀態即重置預約標記

  if (newStatus === '還在討論') {
    reportForm.value.reason = '家人討論';
    isReasonReadonly.value = true;
  } else if (newStatus === '空號') {
    reportForm.value.reason = '號碼錯誤/空號';
    isReasonReadonly.value = true;
  } else if (newStatus === '未接') {
    reportForm.value.reason = '未接電話';
    isReasonReadonly.value = true;
  } else if (newStatus === '不考慮') {
    reportForm.value.reason = '';
    isReasonReadonly.value = false;
  } else {
    reportForm.value.reason = '';
    isReasonReadonly.value = false;
  }
});

// 3. 預約視窗連動方法
const openBookingDialog = () => {
  bookingInitialData.value = {
    customerName: currentLead.value.name,
    customerPhone: currentLead.value.phone,
    source: currentLead.value.source,
    note: ''
  };
  showBookingDialog.value = true;
};

const onBookingSaved = (bookingData) => {
  const rawDate = bookingData.reservationTime;
  const timeStr = rawDate?.toDate ? formatDateTime(rawDate) : new Date(rawDate).toLocaleString('zh-TW', { hour12: false });

  const summary = `【已約賞屋】\n時間：${timeStr}\n類型：${bookingData.type}\n姓名：${bookingData.customerName}\n電話：${bookingData.customerPhone}\n銷售：${bookingData.salesName || '不指定'}\n備註：${bookingData.note || '無'}`;

reportForm.value.note = summary;
  
  isBookingCompleted.value = true; // ✅ 標記預約完成
  showMsg('預約成功，已自動帶入談話紀錄', 'success');
};

// ✅ 新增：按鈕文字計算
const submitBtnText = computed(() => {
  if (reportForm.value.status === '已約賞屋' && !isBookingCompleted.value) {
    return '請先完成賞屋預約';
  }
  return '完成回報';
});

// ✅ 新增：按鈕禁用邏輯
const isSubmitDisabled = computed(() => {
  const baseValidation = !reportForm.value.status || (showReasonField.value && !reportForm.value.reason);
  const bookingValidation = (reportForm.value.status === '已約賞屋' && !isBookingCompleted.value);
  return baseValidation || bookingValidation;
});

// ✅ 狀態 Key 對應 (用於 CSS Class)
const getStatusKey = (s) => ({ '已約賞屋': 'success', '不考慮': 'error', '未接': 'warning' }[s] || 'default');

// --- 計算屬性 ---
const userUid = computed(() => userStore.user?.key || userStore.user?.phone || '');
const projectName = computed(() => userStore.user?.permissions?.[props.projectId]?.projectName || props.projectId);
const userSystems = computed(() => userStore.user?.permissions?.[props.projectId]?.systems || []);

const isReceptionist = computed(() => userSystems.value.includes('客資系統-櫃台'));
const isAdmin = computed(() => userStore.user?.roles?.includes('系統管理員') || userStore.user?.roles?.includes('超級管理員'));
const leadStats = computed(() => { 
  const done = allLeads.value.filter(l => l.status && l.status !== '').length;
  const pending = allLeads.value.length - done;
  return { total: allLeads.value.length, done, pending };
});

const completionRate = computed(() => {
  if (leadStats.value.total === 0) return 0;
  return Math.round((leadStats.value.done / leadStats.value.total) * 100);
});

const progressChartData = computed(() => ({
  labels: ['已完成', '未處理'],
  datasets: [{
    data: [leadStats.value.done, leadStats.value.pending],
    backgroundColor: ['#4CAF50', '#F44336'], 
    borderWidth: 0
  }]
}));

//儀表計算圖選項
// 修改項目：新增 Budget 與 Source 統計邏輯
const budgetChartData = computed(() => {
  const counts = {};
  allLeads.value.forEach(l => {
    const key = l.budget || '未填寫';
    counts[key] = (counts[key] || 0) + 1;
  });
  return {
    labels: Object.keys(counts),
    datasets: [{
      data: Object.values(counts),
      backgroundColor: ['#42A5F5', '#66BB6A', '#FFA726', '#EF5350', '#AB47BC', '#26A69A', '#78909C']
    }]
  };
});

const sourceChartData = computed(() => {
  const counts = {};
  allLeads.value.forEach(l => {
    // 1. 取得原始來源並去除首尾空格
    const rawSource = (l.source || '未知來源').trim();
    const upper = rawSource.toUpperCase();
    
    let normalizedSource = rawSource;

    // 🚩 [優化點]：合併邏輯
    // 只要包含「官網」兩字，一律視為目前的動態專案官網
    if (rawSource.includes('官網')) {
      normalizedSource = `${projectName.value}官網`;
    } else if (upper === 'FB' || rawSource.includes('臉書')) {
      normalizedSource = 'FB';
    } else if (upper === 'IG' || rawSource.includes('Instagram')) {
      normalizedSource = 'IG';
    } else if (upper === 'LINE') {
      normalizedSource = 'LINE';
    }

    // 2. 執行統計
    counts[normalizedSource] = (counts[normalizedSource] || 0) + 1;
  });

  return {
    labels: Object.keys(counts),
    datasets: [{
      data: Object.values(counts),
      backgroundColor: ['#EC407A', '#5C6BC0', '#26C6DA', '#9CCC65', '#FFEE58', '#FF7043', '#8D6E63']
    }]
  };
});
// 修改項目結束

const staffLoadChartData = computed(() => { 
  // 輔助函式：計算特定人員或全案的統計數據
  const getCounts = (staffId = null) => {
    const leads = staffId ? allLeads.value.filter(l => l.assignedTo === staffId) : allLeads.value;
    const total = leads.length;
    const done = leads.filter(l => l.status && l.status !== '').length;
    const pending = total - done;
    return { total, done, pending };
  };

  // 🚩 1. 先計算所有銷售人員的數據並存入陣列
  const staffListWithStats = salesStaff.value.map(s => ({
    name: s.name,
    stats: getCounts(s.id)
  }));

  // 🚩 2. 依照「總名單數量 (total)」進行遞減排序 (大 -> 小)
  staffListWithStats.sort((a, b) => b.stats.total - a.stats.total);

  // 🚩 3. 組合最終的標籤與數據
  // 第一位始終保留「全案總計」
  const projectTotal = getCounts();
  const labels = ['全案總計', ...staffListWithStats.map(s => s.name)];
  const finalStats = [projectTotal, ...staffListWithStats.map(s => s.stats)];

  return {
    labels,
    datasets: [
      { 
        label: '總名單', 
        data: finalStats.map(s => s.total), 
        backgroundColor: '#90A4AE', 
        borderRadius: 4 
      },
      { 
        label: '已完成', 
        data: finalStats.map(s => s.done), 
        backgroundColor: '#43A047', 
        borderRadius: 4 
      },
      { 
        label: '未處理', 
        data: finalStats.map(s => s.pending), 
        backgroundColor: '#E53935', 
        borderRadius: 4 
      }
    ]
  };
});

// --- 新增：不考慮狀態與原因統計邏輯 ---


const statusDistributionChartData = computed(() => {
  const counts = {};
  // 顏色對照表
  const colorMap = {
    '不考慮': '#F44336', 
    '已約賞屋': '#4CAF50', 
    '還在討論': '#2196F3', 
    '未接': '#FF9800',     
    '空號': '#9E9E9E',     
    '未處理': '#E0E0E0'    
  };

  // 1. 初始化統計：包含自定義選項與「未處理」
  statusOptions.value.forEach(opt => { counts[opt] = 0; });
  counts['未處理'] = 0;

  // 2. 改從 allLeads.value (目前顯示的名單) 進行統計
  allLeads.value.forEach(lead => {
    const key = lead.status || '未處理'; // 若無狀態則歸類為未處理
    counts[key] = (counts[key] || 0) + 1;
  });

  // 3. 過濾掉筆數為 0 的項目，確保圖表乾淨
  const labels = Object.keys(counts).filter(k => counts[k] > 0);
  
  if (labels.length === 0) {
    return { 
      labels: ['尚無資料'], 
      datasets: [{ data: [1], backgroundColor: ['#E0E0E0'] }] 
    };
  }

  const bgColors = labels.map(label => colorMap[label] || '#3949AB');

  return {
    labels: labels,
    datasets: [{
      data: labels.map(l => counts[l]),
      backgroundColor: bgColors,
      hoverOffset: 4
    }]
  };
});


const deniedReasonChartData = computed(() => {
  const counts = {};
  
  // 1. 取得所有「目前狀態」為「不考慮」的名單 (基準點與狀況總計一致)
  const deniedLeads = allLeads.value.filter(l => l.status === '不考慮');
  
  // 2. 預處理日誌：將日誌按 leadId 索引，取出每個客戶最新的不考慮原因
  const latestLogMap = {};
  allProjectLogs.value.forEach(log => {
    if (log.status === '不考慮' && log.leadId) {
      const logDate = log.createdAt?.toDate?.() || new Date(0);
      if (!latestLogMap[log.leadId] || logDate > latestLogMap[log.leadId].date) {
        latestLogMap[log.leadId] = { reason: log.reason, date: logDate };
      }
    }
  });

  deniedLeads.forEach(lead => {
    // 優先權：名單主表欄位 > 最新日誌原因 > 未註明原因
    const reason = lead.reason || latestLogMap[lead.id]?.reason || '未註明原因';
    counts[reason] = (counts[reason] || 0) + 1;
  });

  const labels = Object.keys(counts);
  if (labels.length === 0) {
    return { labels: ['無原因資料'], datasets: [{ data: [1], backgroundColor: ['#EEEEEE'] }] };
  }

  return {
    labels: labels,
    datasets: [{
      data: labels.map(l => counts[l]),
      backgroundColor: ['#E91E63', '#9C27B0', '#673AB7', '#3F51B5', '#009688', '#FF9800', '#795548']
    }]
  };
});

// ✅ 優化後的計算屬性：結合資料庫現有量與本次分配量
const salesStaffWithCounts = computed(() => {
  return salesStaff.value.map(staff => {
    // A. 統計資料庫中已有的名單數量
    const dbCount = allLeads.value.filter(l => l.assignedTo === staff.id).length;
    
    // B. 即時統計本次預覽表格中已選擇該銷售人員的數量
    const previewCount = previewLeads.value.filter(l => l.assignedTo === staff.id).length;
    
    // 總計 = 現有 + 預計
    const totalCount = dbCount + previewCount;

    return {
      ...staff,
      totalCount,
      // 顯示格式：姓名 (現有+本次)
      displayName: `${staff.name} (${totalCount})` 
    };
  }).sort((a, b) => {
    // 🚩 這裡可以決定排序邏輯：
    // a. 數量少到多 (推薦)：讓負載輕的人排在上面，方便櫃檯平均分配
    return a.totalCount - b.totalCount; 
    
    // b. 數量多到少： return b.totalCount - a.totalCount;
  });
});




// 1. 更新表格欄位定義 (新增 來源、預算、填表日期)
const statusHeaders = [
  { title: '姓名', key: 'name' },
  { title: '電話', key: 'phone' },
  { title: '來源', key: 'source' },
  { title: '預算', key: 'budget' },
  { title: '填表日期', key: 'date' },
  { title: '指派給', key: 'assignedName' },
  { title: '狀態', key: 'status' },
  { title: '不考慮原因', key: 'reason' }, 
  { title: '備註', key: 'note' }, // ✅ [新增] 備註欄位
  { title: '動作', key: 'actions', sortable: false }
];


// 1. 新增搜尋與過濾的響應式變數
const namePhoneSearch = ref('');
const statusSearch = ref([]);
const assignedSearch = ref([]);
// 2. 新增搜尋變數
const sourceSearch = ref([]);
const budgetSearch = ref([]);
const startDate = ref(null);
const endDate = ref(null);
const dateSearch = ref([]);

// 3. 自動從資料中提取現有的過濾選項 (確保勾選清單準確)
const sourceOptions = computed(() => {
  const sources = allLeads.value.map(l => {
    const raw = (l.source || '未註明').trim();

    
    
    // 🚩 若包含官網，統一回傳目前的動態名稱
    if (raw.includes('官網')) return `${projectName.value}官網`;
    
    const upper = raw.toUpperCase();
    if (upper === 'FB' || raw.includes('臉書')) return 'FB';
    if (upper === 'IG' || raw.includes('Instagram')) return 'IG';
    if (upper === 'LINE') return 'LINE';
    
    return raw;
  });
  // 使用 Set 去除重複項
  return [...new Set(sources)];
});



const budgetOptions = computed(() => [...new Set(allLeads.value.map(l => l.budget || '未填寫'))]);


// 4. 更新過濾邏輯
const filteredLeads = computed(() => {
  let list = allLeads.value;

  // 1. 權限過濾：判斷是管理端還是銷售個人端
  if (!(isReceptionist.value || isAdmin.value)) {
    if (!userUid.value) return []; 
    list = list.filter(l => l.assignedTo === userUid.value);
  }

  // 2. 關鍵字搜尋：支援姓名與電話模糊比對
if (namePhoneSearch.value) {
  const s = namePhoneSearch.value.toLowerCase();
  list = list.filter(l => 
    (l.name && l.name.toLowerCase().includes(s)) || 
    (l.phone && l.phone.includes(s)) ||
    // ✅ 新增：支援搜尋銷售人員姓名
    (l.assignedName && l.assignedName.toLowerCase().includes(s)) ||
    // ✅ 新增：支援搜尋狀態 (如：已約、未接)
    ((l.status || '未處理').toLowerCase().includes(s)) ||
    // ✅ 新增：支援搜尋不考慮原因
    (l.reason && l.reason.toLowerCase().includes(s)) ||
    // ✅ 新增：支援搜尋備註內容
    (l.note && l.note.toLowerCase().includes(s))||
    (l.source && l.source.toLowerCase().includes(s)) // 新增：支援搜尋來源管道
  );
}

  // 3. 狀態勾選過濾
  if (statusSearch.value.length > 0) {
    list = list.filter(l => statusSearch.value.includes(l.status || '未處理'));
  }

  // 4. 指派人員過濾
  if (assignedSearch.value && assignedSearch.value.length > 0) {
    list = list.filter(l => assignedSearch.value.includes(l.assignedTo));
  }

  // 🚩 5. 來源管道過濾 (關鍵優化：支援新舊名稱合併)
  if (sourceSearch.value.length > 0) {
    list = list.filter(l => {
      const raw = (l.source || '未註明').trim();
      
      // 將資料庫原始資料進行「即時標準化」
      let normalized = raw;
      if (raw.includes('官網')) {
        normalized = `${projectName.value}官網`; // 統一轉化為當前專案官網名稱
      } else {
        const upper = raw.toUpperCase();
        if (upper === 'FB' || raw.includes('臉書')) normalized = 'FB';
        else if (upper === 'IG' || raw.includes('Instagram')) normalized = 'IG';
        else if (upper === 'LINE') normalized = 'LINE';
      }

      // 判斷標準化後的結果是否在用戶勾選的篩選清單中
      return sourceSearch.value.includes(normalized);
    });
  }

  // 6. 購屋預算過濾
  if (budgetSearch.value.length > 0) {
    list = list.filter(l => budgetSearch.value.includes(l.budget || '未填寫'));
  }

  // 7. 填表日期範圍過濾
  if (startDate.value) {
    const sDate = startDate.value.replace(/-/g, '/');
    list = list.filter(l => l.date && l.date >= sDate);
  }
  
  if (endDate.value) {
    const eDate = endDate.value.replace(/-/g, '/');
    list = list.filter(l => l.date && l.date <= eDate);
  }

  // 8. 不考慮原因過濾
  if (reasonSearch.value.length > 0) {
    list = list.filter(l => reasonSearch.value.includes(l.reason || '未註明'));
  }

  return list;
});

const recycleHeaders = [
  { title: '客戶姓名', key: 'name' },
  { title: '電話', key: 'phone' },
  { title: '刪除人', key: 'deletedBy' },
  { title: '刪除時間', key: 'deletedAt' },
  { title: '操作', key: 'actions', sortable: false }
];

// --- 回收站邏輯 ---

const fetchDeletedLeads = () => {
  const q = query(
    collection(db, 'leads'),
    where('projectId', '==', props.projectId),
    where('isDeleted', '==', true), 
    orderBy('deletedAt', 'desc')     
  );
  
  onSnapshot(q, (snap) => {
    deletedLeads.value = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  });
};

const restoreLead = async (item) => {
  try {
    uiStore.setLoading(true);
    await updateDoc(doc(db, 'leads', item.id), {
      isDeleted: false,
      restoredAt: serverTimestamp(),
      restoredBy: userStore.user?.name
    });
    showMsg('名單已還原', 'success');
  } catch (err) {
    showMsg('還原失敗：' + err.message, 'error');
  } finally {
    uiStore.setLoading(false);
  }
};

const permanentlyDeleteLead = async (item) => {
  if (!confirm(`確定要永久刪除「${item.name}」嗎？此操作無法復原。`)) return;
  try {
    uiStore.setLoading(true);
    await deleteDoc(doc(db, 'leads', item.id));
    showMsg('已永久刪除名單', 'info');
  } catch (err) {
    showMsg('刪除失敗：' + err.message, 'error');
  } finally {
    uiStore.setLoading(false);
  }
};

// --- 核心方法 ---

const runCheck = async (phones) => {
  if (phones.length === 0) return;
  isCheckingDuplicates.value = true;
  try {
    const res = await checkLeadDuplicates(props.projectId, phones);
    duplicateResults.value = { ...duplicateResults.value, ...res.results };
  } catch (err) {
    console.error("查重 API 異常:", err);
  } finally {
    isCheckingDuplicates.value = false;
  }
};

const quickAssignInPreview = (lead, salesId) => {
  if (!salesId) return;
  lead.assignedTo = salesId;
  updateAssignedInfo(lead, salesId);
};

const updateAssignedInfo = (lead, salesId) => {
  const staff = salesStaff.value.find(s => s.id === salesId);
  lead.assignedName = staff ? staff.name : '';
};

const summaryCount = computed(() => {
  const counts = { vip: 0, lead: 0, new: 0, internalDup: 0, unassigned: 0 };
  
  previewLeads.value.forEach(l => {
    // 1. 檢查查重狀態 (已有客資/重複名單/全新)
    const res = duplicateResults.value[l.phone];
    if (res?.type === 'vip') counts.vip++;
    else if (res?.type === 'lead') counts.lead++;
    else counts.new++;

    // 2. 統計內部重複 (本次名單重複)
    if (internalDuplicateMap.value[l.phone]?.length > 1) {
      counts.internalDup++;
    }

    // 3. 統計尚未選擇銷售
    if (!l.assignedTo) {
      counts.unassigned++;
    }
  });
  return counts;
});

// ✅ 新增：計算預覽名單中內部電話重複的情況
const internalDuplicateMap = computed(() => {
  const map = {};
  previewLeads.value.forEach((lead, index) => {
    if (!lead.phone) return;
    const phone = lead.phone;
    if (!map[phone]) map[phone] = [];
    map[phone].push(index + 1); // 存入行號 (index + 1)
  });
  return map;
});

const getRowClass = (phone) => {
  // 🚩 優先檢查本次名單內部重複
  if (internalDuplicateMap.value[phone]?.length > 1) {
    return 'bg-yellow-lighten-5'; 
  }
  
  const res = duplicateResults.value[phone];
  if (res?.type === 'vip') return 'bg-orange-lighten-5';
  if (res?.type === 'lead') return 'bg-blue-grey-lighten-5';
  return '';
};

const normalizePhone = (p) => {
  if (!p) return '';
  let clean = p.toString().replace(/[\s-()]/g, ''); // 移除符號
  
  // 處理國碼
  if (clean.startsWith('+886')) clean = '0' + clean.slice(4);
  else if (clean.startsWith('886')) clean = '0' + clean.slice(3);
  
  clean = clean.replace(/\D/g, ''); // 僅留數字
  
  // 🚩 [優化] 自動補 0：處理 Excel 數值化導致的開頭遺失 (如 912345678 補為 0912345678)
  if (clean.length === 9 && !clean.startsWith('0')) {
    clean = '0' + clean;
  }
  
  return clean;
};

const normalizeDate = (val) => {
  if (!val) return new Date().toLocaleDateString('zh-TW', { year: 'numeric', month: '2-digit', day: '2-digit' }).replace(/\//g, '/');

  let date;

  // 1. 處理 Excel 的數值型日期 (例如: 45659)
  if (typeof val === 'number') {
    date = new Date((val - 25569) * 86400 * 1000);
  } else {
    // 2. 處理字串格式 (如 2026-01-20 或 2026/1/2)
    const cleanStr = val.toString().trim().replace(/-/g, '/');
    date = new Date(cleanStr);
  }

  // 3. 檢查日期有效性，若無效則回傳今天
  if (isNaN(date.getTime())) {
    date = new Date();
  }

  // 4. 統一轉化為 YYYY/MM/DD 並補零
  const y = date.getFullYear();
  const m = (date.getMonth() + 1).toString().padStart(2, '0');
  const d = date.getDate().toString().padStart(2, '0');

  return `${y}/${m}/${d}`;
};

const normalizeSource = (s) => {
  if (!s) return '未註明';
  
  const raw = s.toString().trim();
  const upper = raw.toUpperCase();
  
  // 標準化常見管道名稱
  if (upper === 'FB' || raw.includes('臉書') || raw.includes('Facebook')) return 'FB';
  if (upper === 'IG' || raw.includes('Instagram')) return 'IG';
  if (upper === 'LINE') return 'LINE';
  if (raw.includes('591')) return '591平台';
  
  // ✓ [修改] 自動帶入當前建案名稱，例如：「富宇天賦官網」或「首馥官網」
  if (raw.includes('官網')) {
    return `${projectName.value}官網`;
  }
  
  return raw;
};

const parseLeadText = (text) => {
  let result = { 
    name: '', phone: '', date: '', source: '', budget: '', rawText: text, 
    assignedTo: null, assignedName: '' 
  };
  const cleanText = text.trim();

  // 內部輔助函式：標準化日期為 yyyy/mm/dd
  const formatDate = (y, m, d) => `${y}/${m.toString().padStart(2, '0')}/${d.toString().padStart(2, '0')}`;

  // 1. 解析 【新名單】 格式
  if (cleanText.includes('【新名單】')) {
    result.name = cleanText.match(/^姓名：(.*?)$/m)?.[1]?.trim() || '';
    result.phone = normalizePhone(cleanText.match(/^連絡電話：(.*?)$/m)?.[1]);
    result.source = cleanText.match(/^平台途徑：(.*?)$/m)?.[1]?.trim() || '廠商名單';
    
    // 擷取日期: 2025年12月29日
    const dateMatch = cleanText.match(/^日期：(\d{4})年(\d{1,2})月(\d{1,2})日/m);
    if (dateMatch) result.date = formatDate(dateMatch[1], dateMatch[2], dateMatch[3]);
  } 
  
  // 2. 解析 富宇首馥官網 格式 (包含多行內容)
  else if (cleanText.includes('官網 提交了「預約賞屋」')) {
    // 針對多行格式，擷取標籤下一行的內容
    result.name = cleanText.match(/姓名：\s*\n\s*([^\n\r]+)/)?.[1]?.trim() || '';
    result.phone = normalizePhone(cleanText.match(/電話：\s*\n\s*([^\n\r]+)/)?.[1]);
    result.source = `${projectName.value}官網`;
    
    // 擷取提交時間: 2025年12月29日
    const dateMatch = cleanText.match(/提交時間:\s*(\d{4})年(\d{1,2})月(\d{1,2})日/);
    if (dateMatch) result.date = formatDate(dateMatch[1], dateMatch[2], dateMatch[3]);

    // 擷取預算 (優先從多行欄位中擷取)
    const budgetMatch = cleanText.match(/購屋預算：\s*\n\s*([^\n\r]+)/);
    if (budgetMatch) result.budget = budgetMatch[1].trim();
  } 
  
  // 3. 解析 【591】 格式
  else if (cleanText.includes('【591】')) {
    result.name = cleanText.match(/^顧客姓名：(.*?)$/m)?.[1]?.trim() || '';
    result.phone = normalizePhone(cleanText.match(/^行動電話：(.*?)$/m)?.[1]);
    result.source = '591平台';
    
    // 擷取提交時間: 2025/12/27
    const dateMatch = cleanText.match(/提交時間：(\d{4})[/-](\d{1,2})[/-](\d{1,2})/);
    if (dateMatch) result.date = formatDate(dateMatch[1], dateMatch[2], dateMatch[3]);
  }

  // 通用邏輯：若特定格式未抓到預算，則嘗試從全文本搜尋「xx萬」關鍵字
  if (!result.budget) {
    const budgetMatch = cleanText.match(/(\d+[-~、\d]*萬[以上下]*)/);
    if (budgetMatch) result.budget = budgetMatch[1];
  }

  // 🚩 在 return 之前加入「來源標準化」邏輯
  if (result.source) {
    const s = result.source.trim();
    const upper = s.toUpperCase();
    
    if (upper === 'FB') result.source = 'FB';
    else if (upper === 'IG') result.source = 'IG';
    else if (upper === 'LINE') result.source = 'LINE';
    // 如果有其他需要統一的來源，可以在此繼續添加
  }

  
result.source = normalizeSource(result.source);
  
  return result;
};

// ✅ 新增：手動輸入的響應式變數 (預設帶入台灣今日日期)
const today = new Date().toISOString().split('T')[0];
const manualInputs = ref([{ 
  name: '', 
  phone: '', 
  source: '', // ✅ 取消預設字串
  budget: '', 
  date: today, 
  note: '' 
}]);

const addManualRow = () => {
  manualInputs.value.push({ 
    name: '', 
    phone: '', 
    source: '', // ✅ 保持乾淨
    budget: '', 
    date: today, 
    note: '' 
  });
};

const handleParsing = async () => {
  let leads = [];

  if (uploadMode.value === 'text') {
    leads = uploadInputs.value
      .filter(txt => txt && txt.trim() !== '')
      .map(txt => parseLeadText(txt));
  } else if (uploadMode.value === 'manual') {
    // 🚩 處理手動輸入資料
    leads = manualInputs.value
      .filter(item => item.name || item.phone)
      .map(item => ({
        ...item,
       source: item.source.trim() || "手動輸入", 
        phone: normalizePhone(item.phone),
        date: item.date.replace(/-/g, '/'),
        rawText: '手動輸入模式' 
      }));
  }

  if (leads.length === 0) {
    showMsg('請先輸入名單資料', 'warning');
    return;
  }
  
  previewLeads.value = leads;
  uploadStep.value = 2;
  await runCheck(leads.map(l => l.phone).filter(p => p));

  // --- 修改段落：查重後自動指派銷售人員 ---
  previewLeads.value.forEach(lead => {
    const res = duplicateResults.value[lead.phone];
    if (res) {
      if (res.type === 'vip' && res.data.latestSalesPhone) {
        // 情況 A：成交客戶，自動選擇「原成交銷售」(對應 latestSalesPhone)
        quickAssignInPreview(lead, res.data.latestSalesPhone);
      } else if (res.type === 'lead' && res.data.assignedTo) {
        // 情況 B：重複名單，自動選擇「最後指派銷售」(對應 assignedTo)
        quickAssignInPreview(lead, res.data.assignedTo);
      }
    }
  });
  // --- 修改結束 ---
};

const isImporting = ref(false);

const executeBatchImportAndAssign = async () => {
  try {
    // ✓ [打勾] 修正：手動開啟按鈕的 loading 狀態，解決看不到 LOADING 的問題
    isImporting.value = true; 
    uiStore.setLoading(true);

// 在 map 處理時，加入 source 的標準化檢查
    const leadsWithStatus = previewLeads.value.map(l => {
      // 🚩 強制標準化來源 (處理手動修改的大小寫不一問題)
      let normalizedSource = (l.source || '未註明').trim();
      const upper = normalizedSource.toUpperCase();
      if (upper === 'FB') normalizedSource = 'FB';
      else if (upper === 'IG') normalizedSource = 'IG';
      else if (upper === 'LINE') normalizedSource = 'LINE';

      const res = duplicateResults.value[l.phone];
      let statusText = "✨ 全新名單"; 
      
      if (res?.type === 'vip') {
        const salesName = res.data?.latestSalesName || '未知';
        statusText = `🚩 既有客資 (來客: ${res.data?.name || '無名'} / 銷售: ${salesName})`; 
      } else if (res?.type === 'lead') {
        statusText = `⚠️ 重複名單 (共 ${res.data?.count || 0} 筆)`;
      }

        return { 
            ...l, 
            source: normalizedSource,
            statusText,
            note: l.note || "", // ✅ 確保傳出備註
            rawText: l.rawText || "未註明來源" 
          }; 
        });

    const res = await batchImportAndAssignLeadsAPI({
      projectId: props.projectId,
      leads: leadsWithStatus, 
      operator: userStore.user?.name || "櫃檯人員"
    });

    if (res.status === 'success') {
      showMsg(`成功匯入並指派 ${previewLeads.value.length} 筆名單`, 'success');
      closeUploadDialog();
    } else {
      throw new Error(res.message);
    }
  } catch (err) {
    // 這裡會捕捉到之前的 "salesName is not defined" 錯誤
    showMsg('執行失敗：' + err.message, 'error');
  } finally {
    // ✓ [打勾] 確保在最後關閉所有載入狀態
    isImporting.value = false;
    uiStore.setLoading(false);
  }
};

const closeUploadDialog = () => {
  showUploadDialog.value = false;
  uploadStep.value = 1;
  uploadMode.value = 'text'; // 重置為文本模式
  uploadInputs.value = [''];
  previewLeads.value = [];
  excelFile.value = null;
};

// ✅ 新增：追蹤預約是否完成
const isBookingCompleted = ref(false);

// 4. 修改原本的 openReport 函式，確保開啟時重置狀態
const openReport = async (item) => {
  currentLead.value = item;
  reportForm.value = { status: item.status || '', reason: item.reason || '', note: '' };
  isBookingCompleted.value = false; // 每次開啟時重置

  // 讀取紀錄
  const logsSnap = await getDocs(query(
    collection(db, `leads/${item.id}/contactLogs`),
    orderBy('createdAt', 'desc')
  ));
  leadLogs.value = logsSnap.docs.map(d => d.data());
  
  // 檢查專案設定 (若 options 為空則重新讀取)
  if (statusOptions.value.length <= 4) {
    const setSnap = await getDoc(doc(db, 'projectSettings', props.projectId));
    if (setSnap.exists()) {
      statusOptions.value = setSnap.data().statusOptions || statusOptions.value;
      reasonOptions.value = setSnap.data().reasonOptions || reasonOptions.value;
    }
  }
  
  showReportDialog.value = true;
};

const submitReport = async () => {
  if (reportForm.value.status === '不考慮' && !reportForm.value.reason) {
    showMsg('請選擇未約原因', 'error');
    return;
  }
  try {
    uiStore.setLoading(true);
    // 更新主名單狀態
    await updateDoc(doc(db, 'leads', currentLead.value.id), {
      status: reportForm.value.status,
      reason: reportForm.value.reason,
      lastReportedAt: serverTimestamp()
    });

    // ✅ 關鍵：存入 contactLogs 時，務必確保有 projectId
    await addDoc(collection(db, `leads/${currentLead.value.id}/contactLogs`), {
      ...reportForm.value,
      projectId: props.projectId, // 👈 供 collectionGroup 統計使用
      createdBy: userStore.user?.name || '系統人員',
      createdAt: serverTimestamp()
    });

    showMsg('回報成功', 'success');
    showReportDialog.value = false;
    reportForm.value = { status: '', reason: '', note: '' }; // 重置表單
  } catch (err) {
    showMsg(err.message, 'error');
  } finally {
    uiStore.setLoading(false);
  }
};

const handleSoftDelete = async (item) => {
  if (!confirm('將此名單移至回收站？')) return;
  try {
    await updateDoc(doc(db, 'leads', item.id), {
      isDeleted: true,
      deletedAt: serverTimestamp(),
      deletedBy: userStore.user?.name
    });
    showMsg('已移至回收站', 'info');
  } catch (err) {
    showMsg('操作失敗', 'error');
  }
};

const getStatusColor = (s) => {
  const colors = {
    '已約賞屋': '#4CAF50', // success
    '不考慮': '#F44336',   // error
    '未接': '#FF9800',     // warning
    '空號': '#9E9E9E'      // grey
  };
  return colors[s] || '#3949AB'; // 預設為 indigo
};

const showMsg = (t, c = 'info') => { snackbar.text = t; snackbar.color = c; snackbar.show = true; };

const fetchProjectStaff = async () => {
  try {
    const permSnap = await getDocs(query(collection(db, "userPermissions")));
    const authorizedIds = [];
    permSnap.forEach(d => {
      if (d.data().permissions?.[props.projectId]?.systems?.some(s => s.includes('客資系統'))) {
        authorizedIds.push(d.id);
      }
    });
    
    if (authorizedIds.length === 0) return;
    
    const staff = [];
    const userSnap = await getDocs(query(collection(db, "users"), where("__name__", "in", authorizedIds.slice(0, 30))));
    
    userSnap.forEach(uDoc => {
      const userData = uDoc.data();
      if (!userData.roles?.includes('超級管理員')) {
        staff.push({ 
          id: uDoc.id, 
          name: userData.name || uDoc.id, 
          lineId: userData.lineId || '' 
        });
      }
    });
    
    salesStaff.value = staff.sort((a, b) => a.name.localeCompare(b.name));
  } catch (err) { 
    console.error(err); 
  }
};
const onSettingsUpdated = (s) => {
  statusOptions.value = s.statusOptions;
  reasonOptions.value = s.reasonOptions;
};



onMounted(async () => {
  // 1. 設定監聽名單資料
  onSnapshot(query(collection(db, 'leads'), where('projectId', '==', props.projectId), where('isDeleted', '==', false), orderBy('createdAt', 'desc')), (snap) => {
    allLeads.value = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  });

  // ✅ 修改：改用 watch 確保使用者權限載入後才執行切換，避免 onMounted 執行時 userStore 還在載入
  watch(() => userStore.user, (newUser) => {
    if (newUser && !isReceptionist.value && !isAdmin.value) {
      activeTab.value = 'status';
    }
  }, { immediate: true });

  // 2. ✅ 修正點：如果不是櫃檯或管理員，強制將預設分頁設為 'status' (聯絡狀況)
  if (!isReceptionist.value && !isAdmin.value) {
    activeTab.value = 'status';
  }

  const logsQuery = query(
    collectionGroup(db, 'contactLogs'),
    where('projectId', '==', props.projectId)
  );

onSnapshot(logsQuery, (snap) => {
  // ✓ [打勾] 修改：在 map 時加入 leadId，方便後續與名單對接
  allProjectLogs.value = snap.docs.map(d => ({
    ...d.data(),
    leadId: d.ref.parent.parent.id // 取得父文件 (leads/{id}) 的 ID
  }));
});


  if (isAdmin.value) {
    fetchDeletedLeads(); 
  }

  await fetchProjectStaff();
  
  const setSnap = await getDoc(doc(db, 'projectSettings', props.projectId));
  if (setSnap.exists()) {
    statusOptions.value = setSnap.data().statusOptions || statusOptions.value;
    reasonOptions.value = setSnap.data().reasonOptions || reasonOptions.value;
  }
});

// 修改項目：圖表設定優化
const chartOptions = { 
  cutout: '80%', 
  responsive: true,
  maintainAspectRatio: false,
 plugins: { 
    datalabels: { display: false } // 在不需要的圖表關閉它
  }
};

// 修改項目：圖表設定優化，加入 datalabels 設定
const pieOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: { 
    legend: { 
      display: true, 
      position: 'right',
      labels: { boxWidth: 12, font: { size: 11 } }
    },
    // ✅ 新增 datalabels 配置
    datalabels: {
      color: '#fff', // 數字顏色
      font: {
        weight: 'bold',
        size: 14
      },
      
      // 也可以顯示百分比，若需要請改用以下邏輯：
  
      formatter: (value, ctx) => {
        let sum = 0;
        let dataArr = ctx.chart.data.datasets[0].data;
        dataArr.map(data => { sum += data; });
        let percentage = (value * 100 / sum).toFixed(0) + "%";
        return value > 0 ? `${value}\n(${percentage})` : '';
      }
    
    }
  }
};

const barOptions = { 
  responsive: true, 
  maintainAspectRatio: false, 
  // 🚩 第一層防護：增加佈局頂部內邊距，為標籤留出物理空間
  layout: {
    padding: {
      top: 35 
    }
  },
  scales: { 
    x: { 
      stacked: false,
      grid: { display: false } 
    }, 
    y: { 
      beginAtZero: true, 
      ticks: { precision: 0 },
      // 🚩 第二層防護：使用 grace 屬性。它會自動在最大值上方增加 15% 的空間
      // 這樣無論最大值是多少，頂部永遠會有餘裕
      grace: '15%', 
      grid: { color: '#ECEFF1' }
    } 
  },
  plugins: { 
    legend: { 
      display: true, 
      position: 'bottom',
      labels: { boxWidth: 12, usePointStyle: true }
    },
    datalabels: {
      anchor: 'end',      // 錨點在長條末端
      align: 'top',       // 對齊長條上方
      offset: 5,          // 數值與長條頂端的間距
      color: '#263238',   // 高對比深色文字
      font: {
        weight: 'bold',
        size: 12
      },
      // 🚩 第三層防護：禁用裁切。確保即使超出繪圖區，標籤仍會被繪製出來
      clip: false, 
      formatter: (value) => value > 0 ? value : ''
    },
    tooltip: {
      backgroundColor: 'rgba(33, 33, 33, 0.9)',
      padding: 10
    }
  } 
};

// ✓ [打勾] 在 script setup 內加入此變數宣告
const isLeadsExporting = ref(false);

// ✓ [打勾] 修正：專用於「聯絡名單」的匯出函數
const executeLeadsExport = async () => {
  if (filteredLeads.value.length === 0) {
    return alert('目前列表無資料可供匯出');
  }

  isLeadsExporting.value = true;

  try {
    const exportRows = filteredLeads.value.map((item) => {
      return {
        '建檔日期': formatDateTime(item.createdAt), // ✓ [共用] 格式化 YYYY/MM/DD HH:mm:ss
        '填表日期': item.date || '',                // ✓ [原始字串] 如 2026/01/02
        '分配銷售': item.assignedName || '',
        '客戶姓名': item.name || '',
        '客戶電話': item.phone || '',
        '名單來源': item.source || '',
        '預算': item.budget || '',
        '聯絡狀況': item.status || '未處理',
        '不考慮原因': item.reason || '',
        '名單狀態': item.statusText || ''
      };
    });

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(exportRows);
    XLSX.utils.book_append_sheet(wb, ws, "聯絡狀況報表");
    
    const dateTag = new Date().toISOString().split('T')[0];
    const fileName = `${projectName.value}_聯絡名單狀況_${dateTag}.xlsx`;
    XLSX.writeFile(wb, fileName);

  } catch (err) {
    console.error("匯出失敗:", err);
    alert('匯出失敗: ' + err.message);
  } finally {
    isLeadsExporting.value = false;
  }
};

// ✓ [打勾] 修改後的共用函數：確保兩位數補零 (2-digit)
const formatDateTime = (ts) => {
  if (!ts) return '-';
  const date = ts.toDate ? ts.toDate() : new Date(ts);
  if (isNaN(date.getTime())) return '-';
  
  return date.toLocaleString('zh-TW', {
    year: 'numeric',
    month: '2-digit', // 確保月份為兩位數
    day: '2-digit',   // 確保日期為兩位數
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false     // 24小時制
  }).replace(/\//g, '/'); // 確保斜線分隔
};

// ✓ [新增] 模式與檔案控制變數
const uploadMode = ref('text');
const excelFile = ref(null);

const applySorting = () => {
  previewLeads.value.sort((a, b) => {
    // 1. 待指派最優先 (Priority 0)
    const aUn = !a.assignedTo ? 0 : 1;
    const bUn = !b.assignedTo ? 0 : 1;
    if (aUn !== bUn) return aUn - bUn;

    // 2. 既有客資次之 (Priority 1)
    const aVip = duplicateResults.value[a.phone]?.type === 'vip' ? 0 : 1;
    const bVip = duplicateResults.value[b.phone]?.type === 'vip' ? 0 : 1;
    if (aVip !== bVip) return aVip - bVip;

    // 3. 本次內部重複 (Priority 2)
    const aInt = (internalDuplicateMap.value[a.phone]?.length > 1) ? 0 : 1;
    const bInt = (internalDuplicateMap.value[b.phone]?.length > 1) ? 0 : 1;
    if (aInt !== bInt) return aInt - bInt;

    return 0;
  });
};

// ✓ [打勾] 完整的 Excel 解析與多層級排序優化
const handleExcelFileSelect = async (input) => {
  const file = Array.isArray(input) ? input[0] : input;
  if (!file) return;

  const reader = new FileReader();
  reader.onload = async (e) => {
    try {
      uiStore.setLoading(true);
      const data = new Uint8Array(e.target.result);
      const workbook = XLSX.read(data, { type: 'array' });
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);
      
      const mappedLeads = jsonData.map(row => {
        // 1. 解析指派人員
        const excelSalesName = (row['指派銷售'] || row['銷售人員'] || row['業務'] || '').toString().trim();
        let assignedTo = null;
        let assignedName = '';
        if (excelSalesName) {
          const foundStaff = salesStaff.value.find(s => s.name === excelSalesName);
          if (foundStaff) {
            assignedTo = foundStaff.id;
            assignedName = foundStaff.name;
          }
        }

        return {
          name: (row['客戶姓名'] || row['姓名'] || '').toString().trim(),
          phone: normalizePhone(row['聯絡電話'] || row['電話']), // 自動補0
          source: normalizeSource(row['來源管道'] || row['來源']), // ✅ 統一來源格式
          budget: (row['購屋預算'] || row['預算'] || '').toString().trim(),
          date: normalizeDate(row['填表日期'] || row['日期']),   // 統一日期 YYYY/MM/DD
          rawText: 'EXCEL匯入',
          assignedTo,
          assignedName
        };
      });

      previewLeads.value = mappedLeads.filter(l => l.phone);
      uploadStep.value = 2;
      
      await runCheck(previewLeads.value.map(l => l.phone));
      
      // 自動指派與多層級排序邏輯
      previewLeads.value.forEach(lead => {
        if (!lead.assignedTo) {
          const res = duplicateResults.value[lead.phone];
          if (res?.data?.latestSalesPhone || res?.data?.assignedTo) {
            quickAssignInPreview(lead, res.data.latestSalesPhone || res.data.assignedTo);
          }
        }
      });

      applySorting(); // 執行排序：未指派 > 既有客資 > 本次重複

    } catch (err) {
      showMsg('解析失敗: ' + err.message, 'error');
    } finally {
      uiStore.setLoading(false);
      excelFile.value = null;
    }
  };
  reader.readAsArrayBuffer(file);
};



</script>

<style scoped>
.chart-center-label {
  position: absolute;
  top: 50%; /* 修改：精準置中 */
  left: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
  pointer-events: none;
}
.gap-2 { gap: 8px; }
.border-s-lg { border-left: 6px solid !important; }

.v-btn--variant-dashed {
  border: 2px dashed rgba(var(--v-theme-primary), 0.3);
  background: transparent;
}

.preview-table :deep(table) {
  border-spacing: 0;
}
.preview-table :deep(tbody tr) {
  transition: background-color 0.2s;
}
.preview-table :deep(tbody tr:hover) {
  background-color: #f5f5f5 !important;
}

.border-bottom {
  border-bottom: 1px solid #e0e0e0;
}

.bg-orange-lighten-5 {
  background-color: #FFF3E0 !important;
}
.bg-blue-grey-lighten-5 {
  background-color: #ECEFF1 !important;
}

.section-title { 
  font-size: 0.9rem; 
  font-weight: 800; 
  color: #3949ab; 
  border-left: 4px solid #3949ab; 
  padding-left: 10px; 
}

.history-item {
  /* 基礎側邊粗線 (您目前的樣式) */
  border-left: 6px solid #bdbdbd; 
  
  /* ✅ 加入全框線：淡灰色 */
  border: 1px solid #e0e0e0 !important; 
  
  /* ✅ 加入細緻陰影 */
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.05) !important;
  
  transition: transform 0.2s ease-in-out;
}

/* 滑鼠經過或點擊時的微互動 (選配) */
.history-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 15px rgba(0, 0, 0, 0.1) !important;
}

/* ✅ 依照狀態顯示邊框顏色 */
.status-success { border-left-color: #4caf50 !important; }
.status-error { border-left-color: #f44336 !important; }
.status-warning { border-left-color: #ff9800 !important; }

.border-dashed { border: 2px dashed #e0e0e0; }

/* 資訊卡片內的標籤與數值樣式 */
/* 調整標籤字體大小 */
.info-label {
  font-size: 0.7rem;
  color: #5c6bc0;
  font-weight: 800;
  margin-bottom: 2px;
}

.info-value {
  font-size: 0.85rem; /* 稍微調大一點點，更易讀 */
  font-weight: 800;
  color: #1a237e;
  line-height: 1.3;
  display: flex;      /* 使用 flex 確保圖標與文字對齊 */
  align-items: center;
  white-space: normal; /* 允許換行 */
  word-break: break-all; /* 強制長字串換行 */
}

/* 新增：水平分割線，用於區分來源與下方的預算/日期 */
.border-bottom-custom {
  border-bottom: 1px solid rgba(63, 81, 181, 0.1);
}


/* 調整：原本的垂直分割線 */
.border-left-custom {
  border-left: 1px solid rgba(63, 81, 181, 0.15);
}



.bg-yellow-lighten-5 {
  background-color: #FFFDE7 !important; /* 淡黃色警告 */
  border-left: 4px solid #FBC02D !important; /* 左側加入黃色邊框加強識別 */
}

/* ✓ [打勾] 在 <style scoped> 中新增 */
.bg-red-lighten-5 {
  background-color: #FFEBEE !important;
  border-left: 4px solid #FF5252 !important;
}

</style>
