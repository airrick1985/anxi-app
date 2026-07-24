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
  v-if="isAdmin || isReceptionist"
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
        <v-tabs v-model="activeTab" color="primary" grow density="compact" :touch="false">
          <v-tab value="status">
            <v-icon start>mdi-clipboard-text-clock</v-icon>名單聯絡狀況
          </v-tab>
          <v-tab v-if="isReceptionist || isAdmin" value="management">
            <v-icon start>mdi-tray-arrow-down</v-icon>聯絡名單統計
          </v-tab>
        </v-tabs>

        <v-window v-model="activeTab" class="mt-4" :touch="false">
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
<v-card variant="flat" class="mb-4 pa-3 pa-sm-4 rounded-xl border bg-white shadow-sm">
  <v-row dense align="center">
    <!-- ✅ 優化：手機上全寬，平板以上 1/3 寬 -->
    <v-col cols="12" sm="4">
      <v-text-field v-model="namePhoneSearch" label="關鍵字搜尋" prepend-inner-icon="mdi-magnify" variant="outlined" density="compact" hide-details clearable rounded="lg"></v-text-field>
    </v-col>
    <v-col v-if="isReceptionist || isAdmin" cols="12" sm="4">
      <v-select v-model="assignedSearch" :items="salesStaff" item-title="name" item-value="id" label="人員" multiple variant="outlined" density="compact" hide-details rounded="lg" prepend-inner-icon="mdi-account-search">
        <template v-slot:selection="{ index }"><span v-if="index === 0" class="text-caption">人員 (+{{ assignedSearch.length }})</span></template>
      </v-select>
    </v-col>
    <v-col cols="12" sm="4">
      <v-select v-model="statusSearch" :items="['未處理', ...statusOptions]" label="狀態" multiple variant="outlined" density="compact" hide-details rounded="lg" prepend-inner-icon="mdi-filter-variant">
        <template v-slot:selection="{ index }"><span v-if="index === 0" class="text-caption">狀態 (+{{ statusSearch.length }})</span></template>
      </v-select>
    </v-col>
    <v-col cols="12" sm="4">
      <v-select
        v-model="reasonSearch"
        :items="reasonFilterOptions"
        label="不考慮原因"
        multiple
        variant="outlined"
        density="compact"
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
      <v-select v-model="sourceSearch" :items="sourceOptions" label="來源" multiple variant="outlined" density="compact" hide-details rounded="lg" prepend-inner-icon="mdi-tray-arrow-down">
        <template v-slot:selection="{ index }"><span v-if="index === 0" class="text-caption">來源 (+{{ sourceSearch.length }})</span></template>
      </v-select>
    </v-col>
    <v-col cols="12" sm="4">
      <v-select v-model="budgetSearch" :items="budgetOptions" label="預算" multiple variant="outlined" density="compact" hide-details rounded="lg" prepend-inner-icon="mdi-currency-usd">
        <template v-slot:selection="{ index }"><span v-if="index === 0" class="text-caption">預算 (+{{ budgetSearch.length }})</span></template>
      </v-select>
    </v-col>
    <!-- ✅ 優化：手機上全寬，平板以上並排 -->
    <v-col cols="12" sm="2" class="mt-sm-2">
  <v-text-field
    v-model="startDate"
    label="填表日期(起)"
    type="date"
    variant="outlined"
    density="compact"
    hide-details
    rounded="lg"
    color="primary"
    clearable
    size="small"
  ></v-text-field>
</v-col>

<v-col cols="12" sm="2" class="mt-2 mt-sm-2">
  <v-text-field
    v-model="endDate"
    label="填表日期(迄)"
    type="date"
    variant="outlined"
    density="compact"
    hide-details
    rounded="lg"
    color="primary"
    clearable
    size="small"
    :min="startDate"
  ></v-text-field>
</v-col>

<v-col cols="12" sm="2" class="mt-2 mt-sm-2">
  <v-text-field
    v-model="assignedStartDate"
    label="指派時間(起)"
    type="date"
    variant="outlined"
    density="compact"
    hide-details
    rounded="lg"
    color="primary"
    clearable
    size="small"
  ></v-text-field>
</v-col>

<v-col cols="12" sm="2" class="mt-2 mt-sm-2">
  <v-text-field
    v-model="assignedEndDate"
    label="指派時間(迄)"
    type="date"
    variant="outlined"
    density="compact"
    hide-details
    rounded="lg"
    color="primary"
    clearable
    size="small"
    :min="assignedStartDate"
  ></v-text-field>
</v-col>

<v-col cols="12" class="mt-2">
      <!-- ✅ 優化：手機上縱向排列，平板以上橫向排列 -->
      <v-row no-gutters class="gap-2">
        <v-col cols="12" sm="6" class="flex-grow-1">
          <v-btn
            color="success"
            prepend-icon="mdi-file-excel"
            variant="elevated"
            rounded="lg"
            :loading="isLeadsExporting"
            @click="executeLeadsExport"
            class="font-weight-bold w-100 text-truncate"
            size="small"
          >
            <span class="text-truncate">下載聯絡狀況 EXCEL</span>
          </v-btn>
        </v-col>

        <v-col cols="12" sm="6" class="flex-grow-1">
          <v-btn
            color="blue-grey"
            prepend-icon="mdi-google-spreadsheet"
            variant="elevated"
            rounded="lg"
            :loading="isSyncingToGoogle || googleSheetForm.isLoadingSheets"
            @click="openSyncDialog"
            class="font-weight-bold w-100 text-truncate"
            size="small"
          >
            <span class="text-truncate">同步到 Google Sheet</span>
          </v-btn>
        </v-col>
      </v-row>
    </v-col>

  </v-row>
</v-card>

    <!-- Google Sheet Sync Dialog -->
    <v-dialog v-model="googleSheetDialog" max-width="500px">
      <v-card>
        <v-card-title class="bg-blue-grey text-white">
          <v-icon start>mdi-google-spreadsheet</v-icon>
          同步資料到 Google Sheet
        </v-card-title>
        
        <v-card-text class="pt-6">
          <v-window v-model="googleSheetForm.step">
            <!-- Step 1: Input URL and Fetch Sheets -->
            <v-window-item :value="1">
              <p class="mb-4 text-body-2 text-grey-darken-1">
                請輸入目標 Google Sheet 的完整網址或是 ID。
                <br>
                <span class="text-caption text-red">* 請注意：您需要擁有該試算表的編輯權限。</span>
              </p>
              
              <v-text-field
                v-model="googleSheetForm.url"
                label="Google Sheet 網址 / ID"
                variant="outlined"
                placeholder="https://docs.google.com/spreadsheets/d/..."
                prepend-inner-icon="mdi-link"
                :error="!googleSheetForm.url && googleSheetForm.step === 1"
              ></v-text-field>
              
            </v-window-item>

            <!-- Step 2: Select Sheet and Confirm -->
            <v-window-item :value="2">
              <v-alert
                type="info"
                variant="tonal"
                class="mb-4 text-caption"
                icon="mdi-information"
              >
                為了讓系統能寫入資料，請將您的 Google Sheet 共用給以下 Email (編輯者權限)：
                <div class="font-weight-bold mt-1 text-selectable select-all">
                  {{ googleSheetForm.agentEmail || '讀取中...' }}
                </div>
              </v-alert>

               <v-select
                v-model="googleSheetForm.sheetName"
                :items="googleSheetForm.sheetNames"
                label="選擇要寫入的工作表 (Sheet)"
                variant="outlined"
                prepend-inner-icon="mdi-table"
                required
              ></v-select>

              <v-alert
                type="warning"
                variant="tonal"
                class="mt-2"
                icon="mdi-alert"
              >
                <strong>警告：</strong> 點擊同步後，該工作表 ({{ googleSheetForm.sheetName || '未選擇' }}) 的現有資料將被<strong>清除並覆蓋</strong>。
              </v-alert>

              <v-checkbox
                v-model="googleSheetForm.rememberUrl"
                label="將此網址設為本專案預設 (所有管理員共享)"
                density="compact"
                hide-details
                color="primary"
                class="mt-2"
              ></v-checkbox>
            </v-window-item>
          </v-window>
        </v-card-text>

        <v-card-actions class="pa-4">
          <v-spacer></v-spacer>
          <v-btn variant="text" @click="googleSheetDialog = false">取消</v-btn>
          
          <v-btn
            v-if="googleSheetForm.step === 1"
            color="primary"
            variant="flat"
            @click="fetchSheetNames"
            :loading="googleSheetForm.isLoadingSheets"
            :disabled="!googleSheetForm.url"
          >
            下一步
          </v-btn>
          
          <v-btn
            v-if="googleSheetForm.step === 2"
            color="success"
            variant="flat"
            @click="executeGoogleSync"
            :loading="isSyncingToGoogle"
            :disabled="!googleSheetForm.sheetName"
          >
            確認同步
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

  <v-data-table
    :headers="statusHeaders"
    :items="filteredLeads"
    :row-props="leadRowProps"
    class="rounded-lg elevation-1 d-none d-md-block"
  >
    <template v-slot:item.date="{ item }">
      <span class="text-caption">{{ formatLeadDate(item.date) }}</span>
    </template>

    <template v-slot:item.assignedAt="{ item }">
      <span class="text-caption">{{ item.assignedAt ? formatDateTime(item.assignedAt) : '-' }}</span>
    </template>

    <template v-slot:item.status="{ item }">
      <v-chip
        :color="getStatusColor(item.status)"
        size="small"
        variant="flat"
        :prepend-icon="(!item.status || item.status === '未處理') ? 'mdi-alert-circle' : undefined"
        :class="{ 'chip-unprocessed': !item.status || item.status === '未處理' }"
      >
        {{ item.status || '未處理' }}
      </v-chip>
    </template>

    <!-- ✅ 優化：預約狀態欄位（支援排序且保留樣式） -->
    <template v-slot:item.reservationCount="{ item }">
      <div v-if="getCustomerReservations(item.phone)?.length > 0" class="d-flex align-center gap-1">
        <v-icon size="18" color="success">mdi-calendar-check</v-icon>
        <span class="text-caption font-weight-bold text-success">
          {{ getCustomerReservations(item.phone).length }} 筆
        </span>
        <v-menu>
          <template v-slot:activator="{ props }">
            <v-btn
              size="x-small"
              variant="text"
              color="primary"
              icon="mdi-information-outline"
              v-bind="props"
            ></v-btn>
          </template>
          <v-card max-width="300">
            <v-card-text class="pa-3">
              <div v-for="res in getCustomerReservations(item.phone)" :key="res.id" class="mb-3 pb-3 border-bottom">
                <div class="text-caption font-weight-bold">{{ formatTime(res.reservationTime) }}</div>
                <div class="text-caption text-grey-darken-1">銷售: {{ res.salesName || '未指定' }}</div>
              </div>
            </v-card-text>
          </v-card>
        </v-menu>
      </div>
      <span v-else class="text-caption text-grey-lighten-1">無預約</span>
    </template>

    <template v-slot:item.actions="{ item }">
      <v-btn icon="mdi-comment-edit" variant="text" color="primary" @click="openReport(item)"></v-btn>
      <v-btn v-if="isReceptionist" icon="mdi-delete" variant="text" color="error" @click="handleSoftDelete(item)"></v-btn>
    </template>
  </v-data-table>

  <!-- ✅ 效能優化：手機版改為分批渲染，避免一次渲染全部卡片 -->
  <div class="d-block d-md-none">
    <v-card
      v-for="item in mobileLeads"
      :key="item.id"
      class="mb-4 rounded-xl elevation-2 overflow-hidden"
      :class="(!item.status || item.status === '未處理') ? 'lead-card-unprocessed' : 'border-0'"
    >
      <v-card-text class="pa-3 pa-sm-4">
        <!-- ✅ 優化：分層設計，避免手機上溢出 -->
        <div class="d-flex align-center justify-space-between mb-3 flex-wrap gap-2">
          <div class="d-flex align-center flex-shrink-1 min-width-0">
            <v-avatar color="indigo-darken-4" size="36" size-sm="32" class="me-2 flex-shrink-0">
              <v-icon color="white" size="20">mdi-account</v-icon>
            </v-avatar>
            <div class="min-width-0 flex-grow-1">
              <div class="text-subtitle-2 text-sm-subtitle-1 font-weight-bold indigo--text text--darken-4 text-truncate">
                {{ item.name }}
              </div>
              <div class="text-caption text-grey-darken-1 text-truncate">{{ item.phone }}</div>
            </div>
          </div>
          <div class="d-flex align-center gap-1 flex-shrink-0">
            <v-chip
              :color="getStatusColor(item.status)"
              size="x-small"
              variant="flat"
              :prepend-icon="(!item.status || item.status === '未處理') ? 'mdi-alert-circle' : undefined"
              :class="['font-weight-bold', { 'chip-unprocessed': !item.status || item.status === '未處理' }]"
            >
              {{ item.status || '未處理' }}
            </v-chip>
            <v-btn icon="mdi-comment-edit" variant="text" color="primary" size="x-small" @click="openReport(item)"></v-btn>
            <v-btn v-if="isReceptionist" icon="mdi-delete" variant="text" color="error" size="x-small" @click="handleSoftDelete(item)"></v-btn>
          </div>
        </div>

        <!-- ✅ 新增：顯示現有預約紀錄提示 -->
        <v-card v-if="getCustomerReservations(item.phone)?.length > 0" class="mb-3 pa-2 pa-sm-3 rounded-lg" style="border-left: 4px solid #4caf50; background-color: #f1f8f4; border: 1px solid #c8e6c9;">
          <div class="d-flex align-start gap-2">
            <v-icon size="18" color="success" class="flex-shrink-0 mt-1">mdi-calendar-check</v-icon>
            <div class="flex-grow-1 min-width-0">
              <div class="text-caption font-weight-bold text-success">已預約</div>
              <div class="text-caption text-sm-body-2 font-weight-bold text-grey-darken-3 text-break">
                {{ formatTime(getCustomerReservations(item.phone)[0]?.reservationTime) }}
              </div>
              <div class="text-caption text-grey-darken-1 mt-1 text-break">
                銷售：{{ getCustomerReservations(item.phone)[0]?.salesName || '未指定' }}
              </div>
            </div>
          </div>
        </v-card>

        <v-card variant="flat" class="bg-indigo-lighten-5 rounded-lg border-indigo-lighten-4 border pa-2 pa-sm-3">
          <v-row no-gutters class="flex-wrap">

            <v-col cols="12" class="mt-1 pt-1 border-top-custom" v-if="item.note">
          <div class="info-label text-indigo-darken-3 text-caption">備註</div>
          <div class="info-value text-indigo-darken-4 text-caption text-break">
            <v-icon size="12" class="me-1">mdi-note-text-outline</v-icon>
            {{ item.note }}
          </div>
        </v-col>

            <v-col cols="12" class="mb-1 pb-1 border-bottom-custom">
              <div class="info-label text-caption">來源管道</div>
              <div class="info-value text-caption">
                <v-icon size="12" class="me-1" color="indigo-darken-2">mdi-tray-arrow-down</v-icon>
                {{ item.source || '未註明' }}
              </div>
            </v-col>

            <v-col cols="12" class="mt-1 pb-1 border-bottom-custom" v-if="item.status === '不考慮'">
              <div class="info-label text-error font-weight-black text-caption">不考慮原因</div>
              <div class="info-value text-error font-weight-bold text-caption">
                <v-icon size="14" class="me-1" color="error">mdi-alert-circle-outline</v-icon>
                {{ item.reason || '未註明' }}
              </div>
            </v-col>

            <v-col cols="6" class="pe-1 mt-1">
              <div class="info-label text-caption">預算範圍</div>
              <div class="info-value text-caption text-break">{{ item.budget || '未填寫' }}</div>
            </v-col>

            <v-col cols="6" class="ps-1 border-left-custom mt-1">
              <div class="info-label text-caption">填表日期</div>
              <div class="info-value text-caption">{{ formatLeadDate(item.date) }}</div>
            </v-col>

          </v-row>
        </v-card>
        
        <div class="mt-2 text-caption text-grey-darken-1 d-flex align-center gap-1 flex-wrap">
          <v-icon size="13" class="flex-shrink-0">mdi-account-tie</v-icon>
          <span>負責人：</span><span class="font-weight-bold text-indigo-darken-2 text-truncate">{{ item.assignedName || '尚未指派' }}</span>
        </div>
      </v-card-text>
    </v-card>

    <!-- ✅ 效能優化：載入更多按鈕 -->
    <v-btn
      v-if="filteredLeads.length > mobileVisibleCount"
      block
      variant="tonal"
      color="primary"
      rounded="lg"
      class="mb-4 font-weight-bold"
      prepend-icon="mdi-chevron-down"
      @click="mobileVisibleCount += MOBILE_PAGE_SIZE"
    >
      載入更多 (還有 {{ filteredLeads.length - mobileVisibleCount }} 筆)
    </v-btn>
  </div>
</v-window-item>
        </v-window>
      </v-col>
    </v-row>

   <!-- ✅ 效能優化：聯絡回報 Dialog 抽成獨立子元件，
        表單輸入只重繪 Dialog 本身，不再連動整份名單列表 -->
   <LeadReportDialog
     v-model="showReportDialog"
     :lead="currentLead"
     :project-id="projectId"
     :status-options="statusOptions"
     :reason-options="reasonOptions"
     :reservations="currentLead ? getCustomerReservations(currentLead.phone) : []"
     @notify="showMsg"
   />

    <v-dialog v-model="showSoftDeleteDialog" max-width="480" persistent>
      <v-card class="rounded-xl">
        <v-toolbar color="error" density="compact" class="px-4">
          <v-icon start>mdi-alert-circle-outline</v-icon>
          <v-toolbar-title class="text-subtitle-1 font-weight-bold">確認移至回收站</v-toolbar-title>
          <v-spacer></v-spacer>
          <v-btn icon="mdi-close" variant="text" @click="showSoftDeleteDialog = false" :disabled="softDeleteLoading"></v-btn>
        </v-toolbar>
        <v-card-text class="pt-4">
          <div class="text-body-2 mb-3">
            此操作會將以下名單移至回收站，請輸入下方文件 ID 以確認刪除。
          </div>
          <div v-if="softDeleteTarget" class="mb-3 pa-3 rounded bg-grey-lighten-4">
            <div class="text-caption text-grey mb-1">客戶姓名</div>
            <div class="text-body-2 font-weight-medium mb-2">{{ softDeleteTarget.name || '—' }}</div>
            <div class="text-caption text-grey mb-1">電話</div>
            <div class="text-body-2 mb-2">{{ softDeleteTarget.phone || '—' }}</div>
            <div class="text-caption text-grey mb-1">文件 ID</div>
            <div class="d-flex align-center">
              <code class="text-caption flex-grow-1 text-truncate" :title="softDeleteTarget.id">{{ softDeleteTarget.id }}</code>
              <v-btn
                icon="mdi-content-copy"
                size="x-small"
                variant="text"
                @click="copySoftDeleteId"
                v-tooltip:bottom="'複製文件 ID'"
              ></v-btn>
            </div>
          </div>
          <v-text-field
            v-model="softDeleteInputId"
            label="請輸入文件 ID 以確認"
            placeholder="貼上上方文件 ID"
            variant="outlined"
            density="compact"
            hide-details="auto"
            autofocus
            :disabled="softDeleteLoading"
          ></v-text-field>
        </v-card-text>
        <v-card-actions class="px-4 pb-4">
          <v-spacer></v-spacer>
          <v-btn variant="text" @click="showSoftDeleteDialog = false" :disabled="softDeleteLoading">取消</v-btn>
          <v-btn
            color="error"
            variant="flat"
            :loading="softDeleteLoading"
            :disabled="!softDeleteTarget || softDeleteInputId.trim() !== softDeleteTarget.id"
            @click="confirmSoftDelete"
          >
            確認移至回收站
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="showPermDeleteDialog" max-width="480" persistent>
      <v-card class="rounded-xl">
        <v-toolbar color="error" density="compact" class="px-4">
          <v-icon start>mdi-alert-octagon-outline</v-icon>
          <v-toolbar-title class="text-subtitle-1 font-weight-bold">確認永久刪除</v-toolbar-title>
          <v-spacer></v-spacer>
          <v-btn icon="mdi-close" variant="text" @click="showPermDeleteDialog = false" :disabled="permDeleteLoading"></v-btn>
        </v-toolbar>
        <v-card-text class="pt-4">
          <v-alert type="error" variant="tonal" density="compact" class="mb-3">
            此操作將永久刪除資料且無法復原，請輸入下方文件 ID 以確認。
          </v-alert>
          <div v-if="permDeleteTarget" class="mb-3 pa-3 rounded bg-grey-lighten-4">
            <div class="text-caption text-grey mb-1">客戶姓名</div>
            <div class="text-body-2 font-weight-medium mb-2">{{ permDeleteTarget.name || '—' }}</div>
            <div class="text-caption text-grey mb-1">電話</div>
            <div class="text-body-2 mb-2">{{ permDeleteTarget.phone || '—' }}</div>
            <div class="text-caption text-grey mb-1">文件 ID</div>
            <div class="d-flex align-center">
              <code class="text-caption flex-grow-1 text-truncate" :title="permDeleteTarget.id">{{ permDeleteTarget.id }}</code>
              <v-btn
                icon="mdi-content-copy"
                size="x-small"
                variant="text"
                @click="copyPermDeleteId"
                v-tooltip:bottom="'複製文件 ID'"
              ></v-btn>
            </div>
          </div>
          <v-text-field
            v-model="permDeleteInputId"
            label="請輸入文件 ID 以確認"
            placeholder="貼上上方文件 ID"
            variant="outlined"
            density="compact"
            hide-details="auto"
            autofocus
            :disabled="permDeleteLoading"
          ></v-text-field>
        </v-card-text>
        <v-card-actions class="px-4 pb-4">
          <v-spacer></v-spacer>
          <v-btn variant="text" @click="showPermDeleteDialog = false" :disabled="permDeleteLoading">取消</v-btn>
          <v-btn
            color="error"
            variant="flat"
            :loading="permDeleteLoading"
            :disabled="!permDeleteTarget || permDeleteInputId.trim() !== permDeleteTarget.id"
            @click="confirmPermDelete"
          >
            確認永久刪除
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="showRecycleBin" max-width="900" scrollable>
      <v-card class="rounded-xl">
        <v-toolbar color="error" density="compact" class="px-4">
          <v-icon start>mdi-trash-can-outline</v-icon>
          <v-toolbar-title class="text-subtitle-1 font-weight-bold">回收站</v-toolbar-title>
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
      :staff-list="salesStaff"
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
          label="請貼入完整的客戶訊息 (系統將自動偵測格式並解析)"
          variant="flat"
          bg-color="white"
          rounded="lg"
          auto-grow
          rows="3"
          density="comfortable"
          prepend-inner-icon="mdi-card-text-outline"
          persistent-placeholder
          hide-details
          @update:model-value="(val) => onTextInput(index, val)"
        ></v-textarea>
        <!-- ✅ 即時偵測結果提示（每個文本框獨立） -->
        <v-slide-y-transition>
          <v-alert
            v-if="input && input.trim() && detectedTemplateInfoMap[index]"
            :type="detectedTemplateInfoMap[index].type"
            variant="tonal"
            density="compact"
            class="mt-1 text-caption"
            :icon="detectedTemplateInfoMap[index].icon"
          >
            {{ detectedTemplateInfoMap[index].message }}
          </v-alert>
        </v-slide-y-transition>
      </div>
      <v-btn variant="dashed" color="primary" block class="mt-2 rounded-lg" prepend-icon="mdi-plus" @click="uploadInputs.push('')">
        新增另一組文本內容
      </v-btn>

      <!-- ✅ 手動指定範本（可選覆蓋） -->
      <v-expansion-panels variant="accordion" class="mt-3">
        <v-expansion-panel>
          <v-expansion-panel-title class="text-caption py-2">
            <v-icon size="small" class="me-2">mdi-tune-variant</v-icon>
            進階：手動指定解析範本（覆蓋自動偵測）
          </v-expansion-panel-title>
          <v-expansion-panel-text>
            <v-select
              v-model="selectedTemplateId"
              :items="templateOptions"
              item-title="title"
              item-value="value"
              label="選擇解析範本"
              variant="outlined"
              density="compact"
              bg-color="white"
              rounded="lg"
              hide-details
              prepend-inner-icon="mdi-file-document-check-outline"
            >
              <template v-slot:item="{ item, props: itemProps }">
                <v-list-item v-bind="itemProps">
                  <template v-slot:subtitle v-if="item.value !== 'auto'">
                    <span class="text-caption text-grey">
                      關鍵字：{{ customParsingRules.find(r => r.id === item.value)?.keywords?.join('、') || '未設定' }}
                    </span>
                  </template>
                </v-list-item>
              </template>
            </v-select>
            <v-alert v-if="selectedTemplateId !== 'auto'" type="warning" variant="tonal" density="compact" class="mt-2 text-caption">
              ⚠️ 已手動指定範本「{{ customParsingRules.find(r => r.id === selectedTemplateId)?.templateName }}」，
              將忽略自動偵測結果。
              <v-btn size="x-small" variant="text" color="warning" class="ms-2" @click="selectedTemplateId = 'auto'">清除手動指定</v-btn>
            </v-alert>
          </v-expansion-panel-text>
        </v-expansion-panel>
      </v-expansion-panels>
    </v-window-item>

    <v-window-item value="excel">
      <!-- ✅ 匯出目前名單（供下載後編輯再回匯入） -->
      <v-card variant="tonal" color="blue-grey-lighten-5" class="pa-4 mb-4 rounded-lg">
        <div class="d-flex align-center mb-2">
          <v-icon color="blue-grey-darken-2" class="me-2">mdi-download</v-icon>
          <span class="text-subtitle-2 font-weight-bold text-blue-grey-darken-2">步驟一：先下載目前的聯絡名單</span>
        </div>
        <div class="text-caption text-grey-darken-1 mb-3">
          下載的 EXCEL 檔案使用與匯入相同的表頭格式，您可以在此基礎上新增資料後再上傳匯入。
        </div>
        <v-btn
          color="blue-grey-darken-1"
          variant="elevated"
          prepend-icon="mdi-file-download"
          rounded="lg"
          :loading="isTemplateExporting"
          @click="exportLeadsForImport"
          class="font-weight-bold"
        >
          下載目前名單 EXCEL ({{ allLeads.length }} 筆)
        </v-btn>
      </v-card>

      <v-divider class="mb-4"></v-divider>

      <!-- ✅ 上傳匯入區塊 -->
      <div class="d-flex align-center mb-2">
        <v-icon color="primary" class="me-2">mdi-upload</v-icon>
        <span class="text-subtitle-2 font-weight-bold text-primary">步驟二：上傳 EXCEL 檔案匯入名單</span>
      </div>
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
        請確保第一列為表頭：客戶姓名、聯絡電話、來源管道、購屋預算、填表日期、指派銷售(選填)、備註(選填)
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

  <v-chip size="x-small" color="green-darken-3" variant="elevated" class="font-weight-bold" v-if="summaryCount.purchased">
    ✅ 本案已購戶 {{ summaryCount.purchased }} 筆
  </v-chip>

  <v-chip size="x-small" color="orange-darken-2" variant="flat" v-if="summaryCount.vip">🚩 既有客資 {{ summaryCount.vip }} 筆</v-chip>
  
  <v-chip size="x-small" color="yellow-darken-3" variant="flat" v-if="summaryCount.internalDup">
    🔄 本次名單重複 {{ summaryCount.internalDup }} 筆
  </v-chip>

  <v-chip size="x-small" color="blue-grey-darken-1" variant="flat" v-if="summaryCount.lead">⚠️ 重複名單 {{ summaryCount.lead }} 筆</v-chip>

  <v-chip size="x-small" color="purple-darken-1" variant="flat" v-if="summaryCount.reservation">📅 賞屋預約 {{ summaryCount.reservation }} 筆</v-chip>

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
                    </div> <!-- Added missing closing div for 'lead' -->

                    <!-- Reservation: Viewing Reservation (Compact Mode) -->
                    <div v-else-if="duplicateResults[lead.phone].type === 'reservation'">
                        <v-chip color="purple-lighten-4" class="text-purple-darken-3 font-weight-bold mb-1" size="small" label>
                            <v-icon start icon="mdi-calendar-check" size="x-small"></v-icon> 已有賞屋預約
                        </v-chip>
                        <div class="text-caption text-grey-darken-1 mb-1 d-flex align-center text-left flex-wrap">
                            <span class="font-weight-bold me-2">{{ duplicateResults[lead.phone].data.assignedName }}</span>
                            <span class="text-grey">{{ duplicateResults[lead.phone].data.date || '--' }}</span>
                        </div>
                        <v-btn
                            size="x-small"
                            variant="tonal"
                            color="purple-darken-2"
                            class="px-2"
                            prepend-icon="mdi-magnify"
                            @click="openDetail(lead.phone, duplicateResults[lead.phone], 'reservation')"
                        >
                            詳情
                        </v-btn>
                    </div>

                    <!-- Purchased: Existing Household (Compact Mode) -->
                    <div v-else-if="duplicateResults[lead.phone].type === 'purchased'">
                        <v-chip color="green-lighten-4" class="text-green-darken-4 font-weight-bold mb-1" size="small" label>
                            <v-icon start icon="mdi-check-bold" size="x-small"></v-icon> 本案已購戶
                        </v-chip>
                        <div class="text-caption text-grey-darken-1 mb-1 d-flex align-center text-left flex-wrap">
                            <span class="font-weight-bold me-1">{{ duplicateResults[lead.phone].data.name }}</span>
                            <span class="text-grey me-1">({{ duplicateResults[lead.phone].data.unitId || '--' }})</span>
                            <span class="mx-1 text-grey">|</span>
                            <span class="text-grey">銷售: {{ duplicateResults[lead.phone].data.assignedName }}</span>
                        </div>
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

                                        <v-chip
                                            v-else-if="duplicateResults[lead.phone].type === 'reservation'"
                                            color="purple-lighten-4"
                                            class="text-purple-darken-3 font-weight-bold"
                                            size="x-small"
                                            label
                                            @click="openDetail(lead.phone, duplicateResults[lead.phone], 'reservation')"
                                        >
                                            <v-icon start icon="mdi-calendar-check" size="x-small"></v-icon> 已有賞屋預約 ({{ duplicateResults[lead.phone].data.assignedName }}) 詳情 >
                                        </v-chip>

                                        <v-chip
                                            v-else-if="duplicateResults[lead.phone].type === 'purchased'"
                                            color="green-lighten-4"
                                            class="text-green-darken-4 font-weight-bold"
                                            size="x-small"
                                            label
                                        >
                                            <v-icon start icon="mdi-home-heart" size="x-small"></v-icon> 本案已購戶 ({{ duplicateResults[lead.phone].data.name }} | {{ duplicateResults[lead.phone].data.unitId || '未知戶別' }} | 銷售: {{ duplicateResults[lead.phone].data.assignedName }})
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
        <v-card-actions class="pa-4 bg-white flex-wrap">
        <v-btn v-if="uploadStep === 2" variant="text" color="grey-darken-1" prepend-icon="mdi-arrow-left" @click="uploadStep = 1">返回修改文本</v-btn>
        
        <v-btn
          v-if="isAdmin && uploadStep === 1"
          color="info"
          variant="tonal"
          prepend-icon="mdi-robot-outline"
          class="mr-2"
          @click="showAITemplateDialog = true"
        >
          AI 解析範本管理
        </v-btn>

          <v-spacer></v-spacer>

          <!-- ✅ LINE 通知開關（僅在 Step 2 預覽階段顯示） -->
          <div v-if="uploadStep === 2" class="d-flex align-center me-4">
            <v-switch
              v-model="sendLineNotify"
              color="green"
              density="compact"
              hide-details
              inset
              class="me-1"
            ></v-switch>
            <div class="d-flex flex-column">
              <span class="text-caption font-weight-bold" :class="sendLineNotify ? 'text-green-darken-2' : 'text-grey'">
                <v-icon size="14" class="me-1">{{ sendLineNotify ? 'mdi-bell-ring' : 'mdi-bell-off' }}</v-icon>
                {{ sendLineNotify ? '分配後發送 LINE 通知' : 'LINE 通知已關閉' }}
              </span>
              <span class="text-caption text-grey-darken-1" style="font-size: 10px;">
                {{ sendLineNotify ? '銷售人員將收到名單推播' : '僅寫入資料庫，不推播通知' }}
              </span>
            </div>
          </div>

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
          :color="summaryCount.unassigned > 0 ? 'grey' : 'success'"
          variant="elevated"
          min-width="250"
          rounded="lg"
          :disabled="isCheckingDuplicates || summaryCount.unassigned > 0"
          :loading="isImporting"
          @click="executeBatchImportAndAssign"
        >
          {{ summaryCount.unassigned > 0 ? `尚未處理 (待指派 ${summaryCount.unassigned}筆)` : `確認無誤並執行分配 (${previewLeads.length}筆)` }}
        </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- ✅ Excel 匯入重複名單比對 Dialog -->
    <v-dialog v-model="excelDuplicateDialog" max-width="1000" persistent scrollable>
      <v-card class="rounded-xl overflow-hidden">
        <v-toolbar color="orange-darken-2" density="compact" class="px-4">
          <v-icon start>mdi-file-compare</v-icon>
          <v-toolbar-title class="text-subtitle-1 font-weight-bold">
            偵測到重複名單 — 請選擇處理方式
          </v-toolbar-title>
          <v-spacer></v-spacer>
          <v-btn icon="mdi-close" variant="text" @click="cancelExcelDuplicates"></v-btn>
        </v-toolbar>

        <div class="bg-orange-lighten-5 pa-3 d-flex align-center gap-3 flex-wrap border-bottom">
          <v-chip size="small" color="orange" variant="flat" class="font-weight-bold">
            ⚠️ 重複 {{ excelDuplicates.length }} 筆
          </v-chip>
          <v-chip size="small" color="success" variant="flat" class="font-weight-bold">
            ✨ 全新 {{ excelParsedNewLeads.length }} 筆
          </v-chip>
          <v-spacer></v-spacer>
          <v-btn size="small" variant="tonal" color="orange-darken-3" prepend-icon="mdi-select-all" @click="setAllDuplicateAction('overwrite')">
            全部覆蓋
          </v-btn>
          <v-btn size="small" variant="tonal" color="blue-grey" prepend-icon="mdi-select-remove" @click="setAllDuplicateAction('skip')">
            全部跳過
          </v-btn>
        </div>

        <v-card-text class="pa-0" style="max-height: 500px; overflow-y: auto;">
          <v-table density="comfortable" fixed-header class="d-none d-md-block">
            <thead>
              <tr class="bg-grey-lighten-4">
                <th width="80">處理</th>
                <th>客戶姓名</th>
                <th>聯絡電話</th>
                <th>來源管道</th>
                <th>購屋預算</th>
                <th>指派銷售</th>
                <th>備註</th>
              </tr>
            </thead>
            <tbody>
              <template v-for="(dup, idx) in excelDuplicates" :key="idx">
                <!-- 舊資料列 -->
                <tr class="bg-red-lighten-5">
                  <td rowspan="2" class="text-center" style="vertical-align: middle;">
                    <v-btn-toggle v-model="dup.action" mandatory density="compact" color="orange-darken-2" rounded="lg" class="flex-column">
                      <v-btn value="overwrite" size="x-small" class="font-weight-bold px-2">覆蓋</v-btn>
                      <v-btn value="skip" size="x-small" class="font-weight-bold px-2">跳過</v-btn>
                    </v-btn-toggle>
                  </td>
                  <td>
                    <div class="d-flex align-center">
                      <v-chip size="x-small" color="red-lighten-1" variant="flat" class="me-2 text-white">舊</v-chip>
                      {{ dup.existing.name }}
                    </div>
                  </td>
                  <td class="text-caption">{{ dup.existing.phone }}</td>
                  <td class="text-caption">{{ dup.existing.source || '—' }}</td>
                  <td class="text-caption">{{ dup.existing.budget || '—' }}</td>
                  <td class="text-caption">{{ dup.existing.assignedName || '—' }}</td>
                  <td class="text-caption">{{ dup.existing.note || '—' }}</td>
                </tr>
                <!-- 新資料列 -->
                <tr :class="dup.action === 'overwrite' ? 'bg-green-lighten-5' : 'bg-grey-lighten-4'">
                  <td>
                    <div class="d-flex align-center">
                      <v-chip size="x-small" color="green" variant="flat" class="me-2 text-white">新</v-chip>
                      <span :class="dup.incoming.name !== dup.existing.name ? 'font-weight-bold text-orange-darken-3' : ''">
                        {{ dup.incoming.name }}
                      </span>
                    </div>
                  </td>
                  <td class="text-caption">{{ dup.incoming.phone }}</td>
                  <td class="text-caption" :class="dup.incoming.source !== dup.existing.source ? 'font-weight-bold text-orange-darken-3' : ''">
                    {{ dup.incoming.source || '—' }}
                  </td>
                  <td class="text-caption" :class="dup.incoming.budget !== dup.existing.budget ? 'font-weight-bold text-orange-darken-3' : ''">
                    {{ dup.incoming.budget || '—' }}
                  </td>
                  <td class="text-caption" :class="dup.incoming.assignedName !== dup.existing.assignedName ? 'font-weight-bold text-orange-darken-3' : ''">
                    {{ dup.incoming.assignedName || '—' }}
                  </td>
                  <td class="text-caption" :class="dup.incoming.note !== (dup.existing.note || '') ? 'font-weight-bold text-orange-darken-3' : ''">
                    {{ dup.incoming.note || '—' }}
                  </td>
                </tr>
                <!-- 分隔線 -->
                <tr v-if="idx < excelDuplicates.length - 1"><td colspan="7" class="pa-0"><v-divider></v-divider></td></tr>
              </template>
            </tbody>
          </v-table>

          <!-- 手機版卡片 -->
          <div class="d-block d-md-none pa-3">
            <v-card v-for="(dup, idx) in excelDuplicates" :key="idx" class="mb-3 rounded-lg" border elevation="1">
              <v-card-text class="pa-3">
                <div class="d-flex justify-space-between align-center mb-2">
                  <div class="font-weight-bold">{{ dup.existing.phone }}</div>
                  <v-btn-toggle v-model="dup.action" mandatory density="compact" color="orange-darken-2" rounded="lg">
                    <v-btn value="overwrite" size="x-small" class="font-weight-bold">覆蓋</v-btn>
                    <v-btn value="skip" size="x-small" class="font-weight-bold">跳過</v-btn>
                  </v-btn-toggle>
                </div>
                <v-row dense>
                  <v-col cols="6">
                    <div class="text-caption text-red font-weight-bold mb-1">舊資料</div>
                    <div class="text-caption">姓名：{{ dup.existing.name }}</div>
                    <div class="text-caption">來源：{{ dup.existing.source || '—' }}</div>
                    <div class="text-caption">預算：{{ dup.existing.budget || '—' }}</div>
                    <div class="text-caption">銷售：{{ dup.existing.assignedName || '—' }}</div>
                  </v-col>
                  <v-col cols="6">
                    <div class="text-caption text-green font-weight-bold mb-1">新資料</div>
                    <div class="text-caption">姓名：{{ dup.incoming.name }}</div>
                    <div class="text-caption">來源：{{ dup.incoming.source || '—' }}</div>
                    <div class="text-caption">預算：{{ dup.incoming.budget || '—' }}</div>
                    <div class="text-caption">銷售：{{ dup.incoming.assignedName || '—' }}</div>
                  </v-col>
                </v-row>
              </v-card-text>
            </v-card>
          </div>
        </v-card-text>

        <v-divider></v-divider>
        <v-card-actions class="pa-4 bg-white">
          <v-btn variant="text" color="grey-darken-1" @click="cancelExcelDuplicates">取消匯入</v-btn>
          <v-spacer></v-spacer>
          <v-btn
            color="primary"
            variant="elevated"
            rounded="lg"
            prepend-icon="mdi-check-bold"
            class="font-weight-bold"
            :loading="isResolvingDuplicates"
            @click="resolveExcelDuplicates"
          >
            確認並繼續 (匯入 {{ excelResolvedCount }} 筆)
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="showAITemplateDialog" max-width="800">
      <v-card class="rounded-xl">
        <v-toolbar color="info" title="🤖 AI 解析範本管理 (限管理員)" dark>
          <v-btn icon="mdi-close" @click="showAITemplateDialog = false"></v-btn>
        </v-toolbar>
        <v-card-text class="pa-4 bg-grey-lighten-4">
          <v-window v-model="aiTab">
            <v-window-item value="list">
              <div class="d-flex justify-space-between align-center mb-4">
                <div class="text-subtitle-1 font-weight-bold">已儲存的解析範本 ({{ customParsingRules.length }})</div>
                <v-btn color="primary" prepend-icon="mdi-plus" @click="startAddTemplate">新增範本</v-btn>
              </div>
              <v-card v-for="(rule, idx) in customParsingRules" :key="idx" class="mb-3 pa-3 rounded-lg elevation-1 bg-white">
                 <div class="d-flex justify-space-between align-center">
                     <div class="font-weight-bold text-primary">📋 {{ rule.templateName }}</div>
                     <div class="d-flex gap-1">
                       <v-btn icon="mdi-pencil" size="small" color="info" variant="text" @click="editAITemplate(rule)" v-tooltip:bottom="'編輯範本'"></v-btn>
                       <v-btn icon="mdi-delete" size="small" color="error" variant="text" @click="deleteAITemplate(rule.id)" v-tooltip:bottom="'刪除範本'"></v-btn>
                     </div>
                 </div>
                 <!-- ✅ 顯示識別關鍵字 -->
                 <div v-if="rule.keywords && rule.keywords.length" class="mt-1 mb-1 d-flex flex-wrap gap-1">
                     <v-chip v-for="kw in rule.keywords" :key="kw" size="x-small" color="info" variant="tonal" label class="font-weight-bold">
                         🔑 {{ kw }}
                     </v-chip>
                 </div>
                 <v-divider class="my-2"></v-divider>
                 <div style="font-size: 11px" class="text-grey-darken-2">
                     <div>姓名 > {{ rule.nameRegex }}</div>
                     <div>電話 > {{ rule.phoneRegex }}</div>
                     <div>預算 > {{ rule.budgetRegex || '未設定' }}</div>
                     <div>來源 > {{ rule.sourceRegex || '未設定' }}</div>
                     <div>日期 > {{ rule.dateRegex }}</div>
                     <div v-if="rule.noteRegex">備註 > {{ rule.noteRegex }}</div>
                 </div>
              </v-card>
              <div v-if="customParsingRules.length === 0" class="text-center py-6 text-grey">
                 尚未建立任何自訂範本，請點擊右上方新增。
              </div>
            </v-window-item>
            <v-window-item value="add">
              <v-btn variant="text" prepend-icon="mdi-arrow-left" class="mb-2" @click="cancelTemplateEdit">返回列表</v-btn>
              
              <v-alert v-if="editingTemplateId" type="info" variant="tonal" density="compact" class="mb-3 text-caption">
                ✏️ 正在編輯範本，修改後請測試並儲存
              </v-alert>

              <v-text-field v-model="newAITemplate.name" label="範本名稱 (例如: 樂居留單)" variant="outlined" density="compact" bg-color="white" class="mb-3"></v-text-field>
              <v-textarea v-model="newAITemplate.sampleText" label="貼上範例文字" rows="5" variant="outlined" bg-color="white" class="mb-3" hint="請貼上完整的一筆客戶留單文字" persistent-hint></v-textarea>
              
              <div class="d-flex gap-2 mb-4">
                <v-btn color="info" @click="generateRegexWithAI" :loading="isGeneratingRegex" :disabled="!newAITemplate.sampleText" prepend-icon="mdi-auto-fix" class="flex-grow-1">
                  1. 使用 AI 產生解析規則
                </v-btn>
              </div>
              
              <v-card v-if="newAITemplate.regexResult" class="pa-3 mb-4 rounded-lg border bg-white">
                 <div class="text-subtitle-2 font-weight-bold mb-2 text-primary">AI 產生的 Regex 規則 (可手動微調)：</div>
                 <v-row dense>
                     <v-col cols="12"><v-text-field v-model="newAITemplate.regexResult.nameRegex" label="姓名 Regex" density="compact" variant="underlined" hide-details></v-text-field></v-col>
                     <v-col cols="12"><v-text-field v-model="newAITemplate.regexResult.phoneRegex" label="電話 Regex" density="compact" variant="underlined" hide-details></v-text-field></v-col>
                     <v-col cols="12"><v-text-field v-model="newAITemplate.regexResult.budgetRegex" label="預算 Regex" density="compact" variant="underlined" hide-details></v-text-field></v-col>
                     <v-col cols="12"><v-text-field v-model="newAITemplate.regexResult.sourceRegex" label="來源 Regex" density="compact" variant="underlined" hide-details></v-text-field></v-col>
                     <v-col cols="12"><v-text-field v-model="newAITemplate.regexResult.dateRegex" label="日期 Regex" density="compact" variant="underlined" hide-details></v-text-field></v-col>
                     <v-col cols="12"><v-text-field v-model="newAITemplate.regexResult.noteRegex" label="備註 Regex" density="compact" variant="underlined" hide-details></v-text-field></v-col>
                 </v-row>

                 <!-- ✅ 識別關鍵字設定 -->
                 <v-divider class="my-3"></v-divider>
                 <div class="text-subtitle-2 font-weight-bold mb-2 text-info">
                   🔑 識別關鍵字 <span class="text-caption text-grey font-weight-regular">(用於自動匹配範本，文本中包含任一關鍵字即自動選擇此範本)</span>
                 </div>
                 <v-combobox
                   v-model="newAITemplate.keywords"
                   label="輸入關鍵字後按 Enter 新增"
                   variant="outlined"
                   density="compact"
                   bg-color="white"
                   multiple
                   chips
                   closable-chips
                   hide-details
                   class="mb-2"
                   prepend-inner-icon="mdi-key-variant"
                   hint="例如：【樂居用戶留單通知】、【591】、官網 提交了"
                   persistent-hint
                 ></v-combobox>

                 <div class="mt-3 text-center">
                     <v-btn color="secondary" variant="tonal" @click="testRegexExtraction" size="small">2. 測試擷取結果</v-btn>
                 </div>
              </v-card>
              
              <v-card v-if="newAITemplate.testResult" class="pa-3 mb-4 rounded-lg bg-green-lighten-5 border-success">
                  <div class="text-subtitle-2 font-weight-bold text-success mb-2">測試結果預覽：</div>
                  <div class="text-body-2">
                     <div><span class="font-weight-bold">姓名：</span>{{ newAITemplate.testResult.name }}</div>
                     <div><span class="font-weight-bold">電話：</span>{{ newAITemplate.testResult.phone }}</div>
                     <div><span class="font-weight-bold">預算：</span>{{ newAITemplate.testResult.budget }}</div>
                     <div><span class="font-weight-bold">來源：</span>{{ newAITemplate.testResult.source }}</div>
                     <div><span class="font-weight-bold">日期：</span>{{ newAITemplate.testResult.date }}</div>
                     <div v-if="newAITemplate.testResult.note"><span class="font-weight-bold">備註：</span>{{ newAITemplate.testResult.note }}</div>
                  </div>
              </v-card>
            </v-window-item>
          </v-window>
        </v-card-text>
        <v-card-actions class="pa-3 bg-white" v-if="aiTab === 'add'">
            <v-spacer></v-spacer>
            <v-btn 
              :color="editingTemplateId ? 'info' : 'success'" 
              variant="elevated" 
              @click="saveAITemplate" 
              :disabled="!newAITemplate.name || (!newAITemplate.testResult && !editingTemplateId)" 
              :loading="isSavingAITemplate"
              :prepend-icon="editingTemplateId ? 'mdi-content-save-edit' : 'mdi-content-save'"
            >
                {{ editingTemplateId ? '更新範本' : '3. 確認無誤並儲存' }}
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
import { ref, computed, onMounted, onUnmounted, reactive, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useUserStore } from '@/store/user';
import { useUiStore } from '@/store/uiStore';
import { db } from '@/firebase';
import {
  getFirestore,
  query,
  where,
  getDocs,
  addDoc,
  collection,
  serverTimestamp,
  orderBy,
  limit,
  deleteDoc,  
  doc,        
  updateDoc,  
  getDoc,    
  collectionGroup,
  onSnapshot // ✅ 補回
} from 'firebase/firestore';

import { checkLeadDuplicates, batchImportAndAssignLeadsAPI,
  listGoogleSheets,
  exportToGoogleSheet
} from '@/api';
import { getFunctions, httpsCallable } from 'firebase/functions'; 
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


import LeadReportDialog from '@/components/LeadReportDialog.vue';
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
const activeTab = ref('status'); // 進入時預設停留在「名單聯絡狀況」
const allLeads = ref([]);
const deletedLeads = ref([]);
const salesStaff = ref([]);
const allReservations = ref([]); // ✅ 新增：存儲所有預約記錄
const currentLead = ref(null);

const showSettings = ref(false);
const showUploadDialog = ref(false);
const showRecycleBin = ref(false);
const showReportDialog = ref(false);

const showSoftDeleteDialog = ref(false);
const softDeleteTarget = ref(null);
const softDeleteInputId = ref('');
const softDeleteLoading = ref(false);

const showPermDeleteDialog = ref(false);
const permDeleteTarget = ref(null);
const permDeleteInputId = ref('');
const permDeleteLoading = ref(false);

const uploadStep = ref(1);
const uploadInputs = ref(['']);

// --- AI 解析範本管理 --- 
const showAITemplateDialog = ref(false);
const aiTab = ref('list');
const customParsingRules = ref([]);
const isGeneratingRegex = ref(false);
const isSavingAITemplate = ref(false);
const newAITemplate = ref({ name: '', sampleText: '', regexResult: null, testResult: null, keywords: [] });
const editingTemplateId = ref(null); // ✅ 編輯中的範本 ID（null = 新增模式）

// ✅ 重置表單
const resetTemplateForm = () => {
  newAITemplate.value = { name: '', sampleText: '', regexResult: null, testResult: null, keywords: [] };
  editingTemplateId.value = null;
};

// ✅ 開始新增範本
const startAddTemplate = () => {
  resetTemplateForm();
  aiTab.value = 'add';
};

// ✅ 取消編輯 / 返回列表
const cancelTemplateEdit = () => {
  resetTemplateForm();
  aiTab.value = 'list';
};

// ✅ 編輯現有範本
const editAITemplate = (rule) => {
  editingTemplateId.value = rule.id;
  newAITemplate.value = {
    name: rule.templateName || '',
    sampleText: rule.sampleText || '',
    keywords: rule.keywords ? [...rule.keywords] : [],
    regexResult: {
      nameRegex: rule.nameRegex || '',
      phoneRegex: rule.phoneRegex || '',
      budgetRegex: rule.budgetRegex || '',
      sourceRegex: rule.sourceRegex || '',
      dateRegex: rule.dateRegex || '',
      noteRegex: rule.noteRegex || ''
    },
    testResult: null // 編輯模式不強制要求重新測試
  };
  aiTab.value = 'add';
};

// ✅ 統一收集 Firestore 監聽器的 unsubscribe，於 onUnmounted 一併釋放
const snapshotUnsubs = [];

const fetchAITemplates = async () => {
  try {
    const unsub = onSnapshot(query(collection(db, 'aiLeadTemplates'), where('projectId', '==', props.projectId), orderBy('createdAt', 'desc')), (snap) => {
      customParsingRules.value = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    });
    snapshotUnsubs.push(unsub);
  } catch (err) {
    console.error('獲取 AI 範本失敗', err);
  }
};

const generateRegexWithAI = async () => {
  if (!newAITemplate.value.sampleText) return;
  try {
    isGeneratingRegex.value = true;
    const generateLeadParsingRegex = httpsCallable(getFunctions(undefined, 'asia-east1'), 'generateLeadParsingRegex');
    const result = await generateLeadParsingRegex({ sampleText: newAITemplate.value.sampleText });
    if (result.data.status === 'success') {
      newAITemplate.value.regexResult = result.data.data;

      // ✅ 自動從範例文本提取識別關鍵字
      const sampleText = newAITemplate.value.sampleText;
      const autoKeywords = [];
      const bracketMatches = sampleText.match(/【[^】]+】/g);
      if (bracketMatches) autoKeywords.push(...bracketMatches);
      const submitMatch = sampleText.match(/(\S+\s*提交了[「「].*?[」」])/); 
      if (submitMatch) autoKeywords.push(submitMatch[1]);
      if (sampleText.includes('樂居')) autoKeywords.push('樂居');
      if (sampleText.includes('591')) autoKeywords.push('591');
      if (sampleText.includes('官網')) autoKeywords.push('官網');
      // 去重，保留現有的關鍵字
      const existing = newAITemplate.value.keywords || [];
      newAITemplate.value.keywords = [...new Set([...existing, ...autoKeywords])];

      showMsg('✅ 成功產生規則與關鍵字，請確認後測試', 'success');
    }
  } catch (err) {
    showMsg('❌ AI 產生規則失敗：' + err.message, 'error');
  } finally {
    isGeneratingRegex.value = false;
  }
};

const testRegexExtraction = () => {
  if (!newAITemplate.value.regexResult || !newAITemplate.value.sampleText) return;
  const text = newAITemplate.value.sampleText;
  const rules = newAITemplate.value.regexResult;
  
  const extract = (regexStr) => {
      if (!regexStr) return '';
      if (!regexStr.includes('(')) return regexStr;

      try {
          const match = text.match(new RegExp(regexStr, 'm'));
          return match ? match[1].trim() : '';
      } catch (e) {
          console.warn('Invalid regex:', regexStr);
          return '正則錯誤';
      }
  };

  // noteRegex 特殊處理：支援多筆備註串聯成「標題：內容|標題：內容」
  const extractNote = (regexStr) => {
      if (!regexStr) return '';
      if (!regexStr.includes('(')) return regexStr;
      try {
          const matches = [...text.matchAll(new RegExp(regexStr, 'gm'))];
          if (matches.length === 0) return '';
          if (matches[0].length >= 3) {
              return matches.map(m => `${m[1]}：${m[2].trim()}`).join('|');
          }
          return matches.map(m => m[1].trim()).join('|');
      } catch (e) {
          console.warn('Invalid noteRegex:', regexStr);
          return '正則錯誤';
      }
  };

  newAITemplate.value.testResult = {
      name: extract(rules.nameRegex),
      phone: normalizePhone(extract(rules.phoneRegex)),
      budget: extract(rules.budgetRegex),
      source: normalizeSource(extract(rules.sourceRegex)),
      date: extract(rules.dateRegex) || normalizeDate(new Date()),
      note: extractNote(rules.noteRegex)
  };
};

const saveAITemplate = async () => {
  if (!newAITemplate.value.name) return;
  // ✅ 新增模式必須有測試結果，編輯模式可以沒有
  if (!editingTemplateId.value && !newAITemplate.value.testResult) return;
  // ✅ 驗證至少要有一個關鍵字
  if (!newAITemplate.value.keywords || newAITemplate.value.keywords.length === 0) {
    showMsg('⚠️ 請至少設定一個識別關鍵字，以便自動匹配範本', 'warning');
    return;
  }
  // ✅ 驗證必須有 regex 規則
  if (!newAITemplate.value.regexResult) {
    showMsg('⚠️ 請先產生或填寫解析規則', 'warning');
    return;
  }
  try {
      isSavingAITemplate.value = true;
      
      const templateData = {
          projectId: props.projectId,
          templateName: newAITemplate.value.name,
          sampleText: newAITemplate.value.sampleText,
          keywords: newAITemplate.value.keywords,
          ...newAITemplate.value.regexResult,
          updatedBy: userStore.user?.name || '管理員',
          updatedAt: serverTimestamp()
      };

      if (editingTemplateId.value) {
        // ✅ 編輯模式：更新現有範本
        await updateDoc(doc(db, 'aiLeadTemplates', editingTemplateId.value), templateData);
        showMsg('✅ 範本已更新', 'success');
      } else {
        // ✅ 新增模式：建立新範本
        templateData.createdBy = userStore.user?.name || '管理員';
        templateData.createdAt = serverTimestamp();
        await addDoc(collection(db, 'aiLeadTemplates'), templateData);
        showMsg('✅ 成功儲存解析範本', 'success');
      }

      cancelTemplateEdit();
  } catch (err) {
      showMsg('❌ 儲存失敗：' + err.message, 'error');
  } finally {
      isSavingAITemplate.value = false;
  }
};

const deleteAITemplate = async (id) => {
   if (!confirm('確定要刪除這組解析範本嗎？')) return;
   try {
       await deleteDoc(doc(db, 'aiLeadTemplates', id));
       showMsg('已刪除範本', 'info');
   } catch (err) {
       showMsg('刪除失敗', 'error');
   }
};

// --- AI 解析範本管理結束 --- 
const previewLeads = ref([]);   
const duplicateResults = ref({}); 
const isCheckingDuplicates = ref(false);
const sendLineNotify = ref(true); // ✅ LINE 通知開關（預設開啟）

// --- Excel 匯入重複比對 ---
const excelDuplicateDialog = ref(false);
const excelDuplicates = ref([]); // { existing, incoming, action: 'skip'|'overwrite' }
const excelParsedNewLeads = ref([]);
const isResolvingDuplicates = ref(false);

const excelResolvedCount = computed(() => {
  const overwriteCount = excelDuplicates.value.filter(d => d.action === 'overwrite').length;
  return excelParsedNewLeads.value.length + overwriteCount;
});

const setAllDuplicateAction = (action) => {
  excelDuplicates.value.forEach(d => { d.action = action; });
};

const cancelExcelDuplicates = () => {
  excelDuplicateDialog.value = false;
  excelDuplicates.value = [];
  excelParsedNewLeads.value = [];
};

const resolveExcelDuplicates = async () => {
  isResolvingDuplicates.value = true;
  try {
    // 1. 處理「覆蓋」的名單：直接更新 Firestore 現有文件
    const overwriteItems = excelDuplicates.value.filter(d => d.action === 'overwrite');
    let updatedCount = 0;
    for (const dup of overwriteItems) {
      const updateData = {
        name: dup.incoming.name || dup.existing.name,
        source: dup.incoming.source || dup.existing.source,
        budget: dup.incoming.budget || dup.existing.budget,
        date: dup.incoming.date || dup.existing.date,
        note: dup.incoming.note ?? dup.existing.note,
        updatedAt: serverTimestamp(),
        updatedBy: userStore.user?.name || '系統'
      };
      // 若 Excel 有指定銷售且比對成功，也一併更新
      if (dup.incoming.assignedTo) {
        updateData.assignedTo = dup.incoming.assignedTo;
        updateData.assignedName = dup.incoming.assignedName;
      }
      await updateDoc(doc(db, 'leads', dup.existing.id), updateData);
      updatedCount++;
    }

    if (updatedCount > 0) {
      showMsg(`已覆蓋更新 ${updatedCount} 筆現有名單`, 'info');
    }

    // 2. 將全新名單送入預覽流程
    const newLeads = excelParsedNewLeads.value;
    excelDuplicateDialog.value = false;

    if (newLeads.length === 0) {
      const skippedCount = excelDuplicates.value.filter(d => d.action === 'skip').length;
      showMsg(`處理完成！覆蓋 ${updatedCount} 筆${skippedCount > 0 ? `，跳過 ${skippedCount} 筆` : ''}，無新名單需匯入`, 'success');
      excelDuplicates.value = [];
      excelParsedNewLeads.value = [];
      return;
    }

    // 繼續原有的預覽流程
    previewLeads.value = newLeads;
    uploadStep.value = 2;
    await runCheck(newLeads.map(l => l.phone).filter(p => p));

    // 自動指派
    previewLeads.value.forEach(lead => {
      if (!lead.assignedTo) {
        const res = duplicateResults.value[lead.phone];
        if (res?.data?.latestSalesPhone || res?.data?.assignedTo) {
          quickAssignInPreview(lead, res.data.latestSalesPhone || res.data.assignedTo);
        }
      }
    });
    applySorting();

    excelDuplicates.value = [];
    excelParsedNewLeads.value = [];
  } catch (err) {
    showMsg('處理重複名單失敗：' + err.message, 'error');
  } finally {
    isResolvingDuplicates.value = false;
  }
};

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

// ✅ 效能優化：回報表單相關邏輯已移至 LeadReportDialog.vue 子元件

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
// 將時間戳格式化為 YYYY-MM-DD HH:MM
const formatYMDHM = (ms) => {
  if (!ms) return null;
  const d = new Date(ms);
  if (isNaN(d.getTime())) return null;
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;
};

const salesStaffWithCounts = computed(() => {
  return salesStaff.value.map(staff => {
    // A. 統計資料庫中已有的名單數量
    const dbLeads = allLeads.value.filter(l => l.assignedTo === staff.id);
    const dbCount = dbLeads.length;

    // B. 即時統計本次預覽表格中已選擇該銷售人員的數量
    const previewCount = previewLeads.value.filter(l => l.assignedTo === staff.id).length;

    // 總計 = 現有 + 預計
    const totalCount = dbCount + previewCount;

    // C. 取得該銷售名下所有名單中「最後一次被分配」的時間
    let lastAssignedMs = 0;
    dbLeads.forEach(l => {
      const ms = l.assignedAt?.toMillis ? l.assignedAt.toMillis()
               : (l.assignedAt?.toDate ? l.assignedAt.toDate().getTime() : 0);
      if (ms > lastAssignedMs) lastAssignedMs = ms;
    });
    const lastAssignedText = lastAssignedMs ? formatYMDHM(lastAssignedMs) : '尚未分配';

    return {
      ...staff,
      totalCount,
      lastAssignedMs,
      // 顯示格式：姓名 (現有+本次) · 最後分配 YYYY-MM-DD HH:MM
      displayName: `${staff.name} (${totalCount}) · 最後分配 ${lastAssignedText}`
    };
  }).sort((a, b) => {
    // 🚩 排序邏輯：被分配的時間最早的排最前面
    //（尚未分配者 lastAssignedMs = 0，視為最久未分配，最優先）
    if (a.lastAssignedMs !== b.lastAssignedMs) {
      return a.lastAssignedMs - b.lastAssignedMs;
    }
    // 時間相同時，再以數量少到多作為次要排序
    return a.totalCount - b.totalCount;
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
  { title: '指派時間', key: 'assignedAt' },
  { title: '狀態', key: 'status' },
  { title: '預約紀錄', key: 'reservationCount' }, // ✅ [優化] 使用 reservationCount 欄位支援排序
  { title: '不考慮原因', key: 'reason' },
  { title: '備註', key: 'note' },
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
const assignedStartDate = ref(null);
const assignedEndDate = ref(null);

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
  //    ✅ 先用 formatLeadDate 將任意格式（含「2026年6月11日 下午9:46」）正規化為
  //       yyyy/mm/dd 再比較，避免中文格式與 yyyy/mm/dd 字串比對錯誤
  if (startDate.value) {
    const sDate = startDate.value.replace(/-/g, '/');
    list = list.filter(l => {
      const d = formatLeadDate(l.date);
      return /^\d{4}\/\d{2}\/\d{2}$/.test(d) && d >= sDate;
    });
  }

  if (endDate.value) {
    const eDate = endDate.value.replace(/-/g, '/');
    list = list.filter(l => {
      const d = formatLeadDate(l.date);
      return /^\d{4}\/\d{2}\/\d{2}$/.test(d) && d <= eDate;
    });
  }

  // 8. 不考慮原因過濾
  if (reasonSearch.value.length > 0) {
    list = list.filter(l => reasonSearch.value.includes(l.reason || '未註明'));
  }

  // 9. 指派時間範圍過濾
  if (assignedStartDate.value) {
    const sMs = new Date(assignedStartDate.value + 'T00:00:00').getTime();
    list = list.filter(l => {
      const ts = l.assignedAt?.toMillis ? l.assignedAt.toMillis() : 0;
      return ts >= sMs;
    });
  }
  if (assignedEndDate.value) {
    const eMs = new Date(assignedEndDate.value + 'T23:59:59.999').getTime();
    list = list.filter(l => {
      const ts = l.assignedAt?.toMillis ? l.assignedAt.toMillis() : 0;
      return ts > 0 && ts <= eMs;
    });
  }

  // ✅ 為每筆記錄添加預約計數欄位
  const enriched = list.map(item => ({
    ...item,
    reservationCount: getCustomerReservations(item.phone)?.length || 0
  }));

  // ✅ 預設排序：「未處理」優先，未處理之間按分配日期由舊到新
  const isUnprocessed = (l) => !l.status || l.status === '未處理';
  return enriched.sort((a, b) => {
    const au = isUnprocessed(a);
    const bu = isUnprocessed(b);
    if (au !== bu) return au ? -1 : 1;
    if (au) {
      const ta = a.assignedAt && a.assignedAt.toMillis ? a.assignedAt.toMillis() : 0;
      const tb = b.assignedAt && b.assignedAt.toMillis ? b.assignedAt.toMillis() : 0;
      return ta - tb;
    }
    return 0;
  });
});

// ✅ 效能優化：手機版分批渲染（一次 20 筆，按「載入更多」續載）
const MOBILE_PAGE_SIZE = 20;
const mobileVisibleCount = ref(MOBILE_PAGE_SIZE);
const mobileLeads = computed(() => filteredLeads.value.slice(0, mobileVisibleCount.value));

// 篩選條件變動時重置分批數量
watch(
  [namePhoneSearch, statusSearch, assignedSearch, sourceSearch, budgetSearch, reasonSearch, startDate, endDate, assignedStartDate, assignedEndDate],
  () => { mobileVisibleCount.value = MOBILE_PAGE_SIZE; }
);

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

  const unsub = onSnapshot(q, (snap) => {
    deletedLeads.value = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  });
  snapshotUnsubs.push(unsub);
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

const permanentlyDeleteLead = (item) => {
  permDeleteTarget.value = item;
  permDeleteInputId.value = '';
  showPermDeleteDialog.value = true;
};

const copyPermDeleteId = async () => {
  const id = permDeleteTarget.value?.id;
  if (!id) return;
  try {
    await navigator.clipboard.writeText(id);
    showMsg('已複製文件 ID', 'success');
  } catch {
    showMsg('複製失敗，請手動複製', 'error');
  }
};

const confirmPermDelete = async () => {
  const item = permDeleteTarget.value;
  if (!item) return;
  if (permDeleteInputId.value.trim() !== item.id) {
    showMsg('輸入的文件 ID 不相符', 'error');
    return;
  }
  permDeleteLoading.value = true;
  try {
    await deleteDoc(doc(db, 'leads', item.id));
    showMsg('已永久刪除名單', 'info');
    showPermDeleteDialog.value = false;
    permDeleteTarget.value = null;
    permDeleteInputId.value = '';
  } catch (err) {
    showMsg('刪除失敗：' + err.message, 'error');
  } finally {
    permDeleteLoading.value = false;
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
  const counts = { vip: 0, lead: 0, reservation: 0, new: 0, internalDup: 0, unassigned: 0, purchased: 0 };

  previewLeads.value.forEach(l => {
    // 1. 檢查查重狀態 (已有客資/重複名單/賞屋預約/全新/已購戶)
    const res = duplicateResults.value[l.phone];
    if (res?.type === 'vip') counts.vip++;
    else if (res?.type === 'lead') counts.lead++;
    else if (res?.type === 'reservation') counts.reservation++;
    else if (res?.type === 'purchased') counts.purchased++;
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
  if (res?.type === 'purchased') return 'bg-green-lighten-5';
  if (res?.type === 'vip') return 'bg-orange-lighten-5';
  if (res?.type === 'lead') return 'bg-blue-grey-lighten-5';
  if (res?.type === 'reservation') return 'bg-purple-lighten-5';
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
    assignedTo: null, assignedName: '', note: ''
  };
  const cleanText = text.trim();

  // 內部輔助函式：標準化日期為 yyyy/mm/dd
  const formatDate = (y, m, d) => `${y}/${m.toString().padStart(2, '0')}/${d.toString().padStart(2, '0')}`;

  // ✅ 內部輔助函式：用指定的範本規則解析文本
  const applyRule = (rule) => {
    try {
      const nameMatch = cleanText.match(new RegExp(rule.nameRegex, 'm'));
      const phoneMatch = cleanText.match(new RegExp(rule.phoneRegex, 'm'));
      
      if (nameMatch && phoneMatch) {
        result.name = nameMatch[1].trim();
        result.phone = normalizePhone(phoneMatch[1]);
        
        if (rule.sourceRegex) {
          if (!rule.sourceRegex.includes('(')) {
            result.source = rule.sourceRegex.trim();
          } else {
            const sourceMatch = cleanText.match(new RegExp(rule.sourceRegex, 'm'));
            if (sourceMatch) result.source = sourceMatch[1].trim();
          }
        }
        if (rule.budgetRegex) {
          if (!rule.budgetRegex.includes('(')) {
            result.budget = rule.budgetRegex.trim();
          } else {
            const budgetMatch = cleanText.match(new RegExp(rule.budgetRegex, 'm'));
            if (budgetMatch) result.budget = budgetMatch[1].trim();
          }
        }
        if (rule.noteRegex) {
          if (!rule.noteRegex.includes('(')) {
            result.note = rule.noteRegex.trim();
          } else {
            try {
              const noteMatches = [...cleanText.matchAll(new RegExp(rule.noteRegex, 'gm'))];
              if (noteMatches.length > 0) {
                if (noteMatches[0].length >= 3) {
                  result.note = noteMatches.map(m => `${m[1]}：${m[2].trim()}`).join('|');
                } else {
                  result.note = noteMatches.map(m => m[1].trim()).join('|');
                }
              }
            } catch (e) {
              console.warn('Invalid noteRegex:', rule.noteRegex);
            }
          }
        }
        if (rule.dateRegex) {
          if (!rule.dateRegex.includes('(')) {
            result.date = rule.dateRegex.trim();
          } else {
            const dateMatch = cleanText.match(new RegExp(rule.dateRegex, 'm'));
            if (dateMatch) {
              const d = dateMatch[1].trim().replace(/[-\.]/g, '/');
              result.date = d;
            }
          }
        }
        return true; // 解析成功
      }
    } catch (e) {
      console.warn('Skip invalid regex in rule:', rule.templateName, e);
    }
    return false; // 解析失敗
  };

  // 0. 根據範本策略進行解析
  if (selectedTemplateId.value !== 'auto') {
    // ✅ 用戶手動指定了特定範本，直接使用
    const selectedRule = customParsingRules.value.find(r => r.id === selectedTemplateId.value);
    if (selectedRule) {
      applyRule(selectedRule);
    }
  } else {
    // ✅ 自動偵測模式：先依關鍵字匹配範本
    const detectedRule = autoDetectTemplate(cleanText);
    if (detectedRule) {
      applyRule(detectedRule);
    } else {
      // 如果關鍵字沒匹配到，嘗試所有範本的 regex（向下相容）
      for (const rule of customParsingRules.value) {
        if (applyRule(rule)) {
          break;
        }
      }
    }
  }

  if (!result.name || !result.phone) {
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
      } else if (res.type === 'reservation' && res.data.assignedTo) {
        // 情況 C：賞屋預約，自動選擇「預約時的業務」(對應 assignedTo)
        quickAssignInPreview(lead, res.data.assignedTo);
      }
    }
  });
  // --- 修改結束 ---
};

const isImporting = ref(false);

const executeBatchImportAndAssign = async () => {
  // ⚠️ 檢查是否有尚未選擇銷售的名單，若有則提醒用戶並中止分配流程
  const unassignedLeads = previewLeads.value.filter(l => !l.assignedTo);
  if (unassignedLeads.length > 0) {
    applySorting(); // 將未指派的名單排到最前面，方便用戶快速找到
    showMsg(`⚠️ 尚有 ${unassignedLeads.length} 筆名單未選擇銷售，請先完成指派再執行分配`, 'warning');
    return;
  }

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
      } else if (res?.type === 'purchased') {
        const salesName = res.data?.assignedName || '未知';
        statusText = `🏡 本案已購戶 (銷售: ${salesName} | 戶別: ${res.data?.unitId || '未知'})`;
      } else if (res?.type === 'reservation') {
        const salesName = res.data?.assignedName || '不指定';
        statusText = `📅 已有賞屋預約 (業務: ${salesName} | 預約時間: ${res.data?.date || '--'})`;
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
      operator: userStore.user?.name || "櫃檯人員",
      sendLineNotify: sendLineNotify.value // ✅ 傳入 LINE 通知開關
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
  sendLineNotify.value = true; // ✅ 重置 LINE 通知開關
  selectedTemplateId.value = 'auto'; // ✅ 重置範本選擇
  // ✅ 清空所有偵測結果
  Object.keys(detectedTemplateInfoMap).forEach(k => delete detectedTemplateInfoMap[k]);
};

// ✅ 效能優化：立即開啟 Dialog，日誌由 LeadReportDialog 子元件非同步載入
const openReport = (item) => {
  currentLead.value = item;
  showReportDialog.value = true;

  // 檢查專案設定 (若 options 為空則重新讀取)：改為非阻塞背景補載
  if (statusOptions.value.length <= 4) {
    getDoc(doc(db, 'projectSettings', props.projectId)).then(setSnap => {
      if (setSnap.exists()) {
        statusOptions.value = setSnap.data().statusOptions || statusOptions.value;
        reasonOptions.value = setSnap.data().reasonOptions || reasonOptions.value;
      }
    }).catch(err => console.error('載入專案設定失敗', err));
  }
};

const handleSoftDelete = (item) => {
  softDeleteTarget.value = item;
  softDeleteInputId.value = '';
  showSoftDeleteDialog.value = true;
};

const copySoftDeleteId = async () => {
  const id = softDeleteTarget.value?.id;
  if (!id) return;
  try {
    await navigator.clipboard.writeText(id);
    showMsg('已複製文件 ID', 'success');
  } catch {
    showMsg('複製失敗，請手動複製', 'error');
  }
};

const confirmSoftDelete = async () => {
  const item = softDeleteTarget.value;
  if (!item) return;
  if (softDeleteInputId.value.trim() !== item.id) {
    showMsg('輸入的文件 ID 不相符', 'error');
    return;
  }
  softDeleteLoading.value = true;
  try {
    await updateDoc(doc(db, 'leads', item.id), {
      isDeleted: true,
      deletedAt: serverTimestamp(),
      deletedBy: userStore.user?.name
    });
    showMsg('已移至回收站', 'info');
    showSoftDeleteDialog.value = false;
    softDeleteTarget.value = null;
    softDeleteInputId.value = '';
  } catch (err) {
    showMsg('操作失敗', 'error');
  } finally {
    softDeleteLoading.value = false;
  }
};

const getStatusColor = (s) => {
  const colors = {
    '已約賞屋': '#4CAF50', // success
    '不考慮': '#F44336',   // error
    '未接': '#FF9800',     // warning
    '空號': '#9E9E9E',     // grey
    '未處理': '#FF5722'    // 警示橘紅，最顯眼
  };
  if (!s) return colors['未處理']; // 空字串/null/undefined 視為「未處理」
  return colors[s] || '#3949AB';   // 其他自定狀態預設為 indigo
};

// ✅ 桌面 v-data-table 整列強調：未處理時套用 lead-row-unprocessed
const leadRowProps = ({ item }) => {
  if (!item.status || item.status === '未處理') {
    return { class: 'lead-row-unprocessed' };
  }
  return {};
};

// ✅ 效能優化：以電話為 key 預建索引 (computed 快取)，
// 原本每次渲染每張卡片都對全部預約 filter + sort，改為 O(1) 查表
const reservationsByPhone = computed(() => {
  const map = new Map();
  const now = Date.now();
  for (const res of allReservations.value) {
    if (!res.customerPhone || !(res.reservationTime > now)) continue;
    const arr = map.get(res.customerPhone);
    if (arr) arr.push(res);
    else map.set(res.customerPhone, [res]);
  }
  for (const arr of map.values()) {
    arr.sort((a, b) => a.reservationTime - b.reservationTime);
  }
  return map;
});

// 根據電話號碼取得該客戶的有效預約記錄
const getCustomerReservations = (phone) => {
  if (!phone) return [];
  return reservationsByPhone.value.get(phone) || [];
};

// ✅ 新增：格式化時間顯示
const formatTime = (date) => {
  if (!date) return '';
  const d = date instanceof Date ? date : new Date(date);
  return d.toLocaleString('zh-TW', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });
};

const showMsg = (t, c = 'info') => { snackbar.text = t; snackbar.color = c; snackbar.show = true; };

const fetchProjectStaff = async () => {
  try {
    const permSnap = await getDocs(query(collection(db, "userPermissions")));
    const authorizedIds = [];
    permSnap.forEach(d => {
      // ✅ 修復：支持新的權限命名規則（客資系統-銷售 或 客資系統-櫃台）
      const systems = d.data().permissions?.[props.projectId]?.systems || [];
      const hasRole = systems.some(s =>
        s === '客資系統-銷售' ||
        s === '客資系統-櫃台' ||
        s.includes('客資系統')
      );
      if (hasRole) {
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
  fetchAITemplates();

  // 1. 設定監聽名單資料
  const unsubLeads = onSnapshot(query(collection(db, 'leads'), where('projectId', '==', props.projectId), where('isDeleted', '==', false), orderBy('createdAt', 'desc')), (snap) => {
    allLeads.value = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  });
  snapshotUnsubs.push(unsubLeads);

  // ✅ 新增：監聽預約記錄資料
  const unsubReservations = onSnapshot(query(collection(db, 'viewing_reservations'), where('projectId', '==', props.projectId), where('status', '==', 'active')), (snap) => {
    allReservations.value = snap.docs.map(d => {
      const data = d.data();
      return {
        id: d.id,
        ...data,
        reservationTime: data.reservationTime?.toDate ? data.reservationTime.toDate() : new Date(data.reservationTime)
      };
    });
    console.log('📋 預約記錄已加載，共', allReservations.value.length, '筆');
  });
  snapshotUnsubs.push(unsubReservations);

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

  // ✅ 新增：權限檢查 - 防止非櫃檯/管理員通過滑動切換進入受保護TAB
  // ✅ 效能優化：contactLogs (collectionGroup 全專案回報紀錄) 只有統計圖表用得到，
  //    改為第一次切到「聯絡名單統計」分頁時才訂閱，一般銷售人員不再載入
  let logsSubscribed = false;
  const subscribeProjectLogs = () => {
    if (logsSubscribed) return;
    logsSubscribed = true;

    const logsQuery = query(
      collectionGroup(db, 'contactLogs'),
      where('projectId', '==', props.projectId)
    );

    const unsubLogs = onSnapshot(logsQuery, (snap) => {
      // 在 map 時加入 leadId，方便後續與名單對接
      allProjectLogs.value = snap.docs.map(d => ({
        ...d.data(),
        leadId: d.ref.parent.parent.id // 取得父文件 (leads/{id}) 的 ID
      }));
    });
    snapshotUnsubs.push(unsubLogs);
  };

  watch(activeTab, (newTab) => {
    const restrictedTabs = ['management'];

    if (restrictedTabs.includes(newTab) && !isReceptionist.value && !isAdmin.value) {
      // 非櫃檯或管理員試圖進入受保護區域，強制重定向回聯絡狀況頁面
      activeTab.value = 'status';
      return;
    }

    if (newTab === 'management') {
      subscribeProjectLogs();
    }
  }, { immediate: true });


  if (isAdmin.value || isReceptionist.value) {
    fetchDeletedLeads();
  }

  await fetchProjectStaff();
  
  const setSnap = await getDoc(doc(db, 'projectSettings', props.projectId));
  if (setSnap.exists()) {
    statusOptions.value = setSnap.data().statusOptions || statusOptions.value;
    reasonOptions.value = setSnap.data().reasonOptions || reasonOptions.value;
  }
});

// ✅ 元件卸載時釋放所有 Firestore 監聽器，避免切換建案後舊監聽器仍在背景運作
onUnmounted(() => {
  snapshotUnsubs.forEach(unsub => {
    try { unsub(); } catch (e) { /* noop */ }
  });
  snapshotUnsubs.length = 0;
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
// ✓ 共用資料準備邏輯
const getLeadsExportData = () => {
  return filteredLeads.value.map((item) => {
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
};

const executeLeadsExport = async () => {
  if (filteredLeads.value.length === 0) {
    return alert('目前列表無資料可供匯出');
  }

  isLeadsExporting.value = true;

  try {
    const exportRows = getLeadsExportData();

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

// ✅ 匯出名單（使用與匯入相同的表頭格式，方便下載→編輯→再匯入）
const isTemplateExporting = ref(false);

const exportLeadsForImport = async () => {
  isTemplateExporting.value = true;
  try {
    // 使用與匯入解析完全對應的中文表頭
    const exportRows = allLeads.value.map((item) => ({
      '客戶姓名': item.name || '',
      '聯絡電話': item.phone || '',
      '來源管道': item.source || '',
      '購屋預算': item.budget || '',
      '填表日期': item.date || '',
      '指派銷售': item.assignedName || '',
      '備註': item.note || ''
    }));

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(exportRows);

    // 設定欄寬，提升可讀性
    ws['!cols'] = [
      { wch: 12 }, // 客戶姓名
      { wch: 14 }, // 聯絡電話
      { wch: 14 }, // 來源管道
      { wch: 14 }, // 購屋預算
      { wch: 14 }, // 填表日期
      { wch: 12 }, // 指派銷售
      { wch: 20 }  // 備註
    ];

    XLSX.utils.book_append_sheet(wb, ws, '聯絡名單');

    const dateTag = new Date().toISOString().split('T')[0];
    const fileName = `${projectName.value}_聯絡名單_${dateTag}.xlsx`;
    XLSX.writeFile(wb, fileName);

    showMsg(`已匯出 ${exportRows.length} 筆名單`, 'success');
  } catch (err) {
    console.error('匯出失敗:', err);
    showMsg('匯出失敗: ' + err.message, 'error');
  } finally {
    isTemplateExporting.value = false;
  }
};

// --- Google Sheet Sync Logic ---
const googleSheetDialog = ref(false);
const isSyncingToGoogle = ref(false);
const googleSheetForm = reactive({
  url: '',
  sheetName: '',
  sheetNames: [],
  isLoadingSheets: false,
  agentEmail: '',
  spreadsheetId: '', // Store ID
  step: 1,
  rememberUrl: true // ✅ 新增：控制是否記住網址
});

const openSyncDialog = async () => {
  // ✅ 移除：允許即使沒資料也能打開對話框設定網址
  // if (filteredLeads.value.length === 0) { ... }
  
  googleSheetForm.url = '';
  
  // 嘗試從專案設定 (Firestore) 讀取上次使用的 URL
  try {
    const projectRef = doc(db, 'projects', props.projectId);
    const projectSnap = await getDoc(projectRef);
    if (projectSnap.exists()) {
      const data = projectSnap.data();
      if (data.googleSheetUrl) {
        googleSheetForm.url = data.googleSheetUrl;
      }
    }
  } catch (err) {
    console.error('讀取專案設定失敗:', err);
    // 降級使用 localStorage 或忽略
  }
  
  googleSheetForm.sheetName = '';
  googleSheetForm.sheetNames = [];
  googleSheetForm.step = 1;
  googleSheetDialog.value = true;
};

const fetchSheetNames = async () => {
  if (!googleSheetForm.url) return;
  googleSheetForm.isLoadingSheets = true;
  try {
    const res = await listGoogleSheets(googleSheetForm.url);
    
    // ✅ 移除：這裡不再自動儲存，改在確認同步時
    
    googleSheetForm.sheetNames = res.sheetNames || [];
    googleSheetForm.agentEmail = res.agentEmail || '';
    googleSheetForm.spreadsheetId = res.spreadsheetId;
    googleSheetForm.step = 2; 
  } catch (error) {
    alert('讀取失敗: ' + error.message);
  } finally {
    googleSheetForm.isLoadingSheets = false;
  }
};

const executeGoogleSync = async () => {
  if (!googleSheetForm.sheetName) return;
  
  isSyncingToGoogle.value = true;
  try {
    // 1. 準備資料
    console.log('[Debug] allLeads:', allLeads.value.length);
    console.log('[Debug] filteredLeads:', filteredLeads.value.length);
    
    const exportRows = getLeadsExportData();
    console.log('[Debug] exportRows:', exportRows.length);
    
    // ✅ 新增：檢查是否有資料
    if (exportRows.length === 0) {
      alert('目前列表無資料可供同步 (但網址設定已保留)'); // 提示用戶
      // 如果用戶勾選了儲存，即使沒資料同步，也可以順便存網址 (看需求，這裡假設沒資料就不執行寫入 Google Sheet，但可以更新設定)
      // 為了邏輯簡單，這裡如果沒資料就不往下執行 exportToGoogleSheet
    }

    // ✅ 新增：檢查是否要儲存網址設定
    if (googleSheetForm.rememberUrl && googleSheetForm.url) {
       updateDoc(doc(db, 'projects', props.projectId), {
        googleSheetUrl: googleSheetForm.url
      }).catch(e => console.error('更新專案設定失敗:', e));
    }

    // 若無資料，存完設定後就中止
    if (exportRows.length === 0) {
        isSyncingToGoogle.value = false;
        return;
    }

    // 2. 轉換為二維陣列 (Header + Data)
    // 定義 Header 順序
    const headers = [
      '建檔日期', '填表日期', '分配銷售', '客戶姓名', '客戶電話',
      '名單來源', '預算', '聯絡狀況', '不考慮原因', '名單狀態'
    ];
    
    const values = [headers];
    exportRows.forEach(row => {
      values.push([
        row['建檔日期'], row['填表日期'], row['分配銷售'], row['客戶姓名'], row['客戶電話'],
        row['名單來源'], row['預算'], row['聯絡狀況'], row['不考慮原因'], row['名單狀態']
      ]);
    });

    // 3. 呼叫後端同步
    await exportToGoogleSheet({
      spreadsheetId: googleSheetForm.spreadsheetId || googleSheetForm.url,
      sheetName: googleSheetForm.sheetName,
      values: values
    });

    alert('同步成功！');
    googleSheetDialog.value = false;

  } catch (error) {
    console.error(error);
    alert('同步失敗: ' + error.message);
  } finally {
    isSyncingToGoogle.value = false;
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

// ✅ [新增] 填表日期顯示專用：將任意日期格式統一轉為 yyyy/mm/dd
// 支援：2026年6月11日 下午9:46、2026/1/2、2026-01-02、Date 可解析字串…
const formatLeadDate = (raw) => {
  if (!raw) return '無日期';
  const str = raw.toString().trim();

  // 1. 中文格式：2026年6月11日（忽略後面的時間，如「下午9:46」）
  const zh = str.match(/(\d{4})\s*年\s*(\d{1,2})\s*月\s*(\d{1,2})\s*日/);
  if (zh) {
    return `${zh[1]}/${zh[2].padStart(2, '0')}/${zh[3].padStart(2, '0')}`;
  }

  // 2. 數字分隔格式：2026/1/2、2026-01-02、2026.1.2
  const ymd = str.match(/(\d{4})[\/\-.](\d{1,2})[\/\-.](\d{1,2})/);
  if (ymd) {
    return `${ymd[1]}/${ymd[2].padStart(2, '0')}/${ymd[3].padStart(2, '0')}`;
  }

  // 3. 退而求其次：交給 Date 解析
  const d = new Date(str.replace(/-/g, '/'));
  if (!isNaN(d.getTime())) {
    const y = d.getFullYear();
    const m = (d.getMonth() + 1).toString().padStart(2, '0');
    const day = d.getDate().toString().padStart(2, '0');
    return `${y}/${m}/${day}`;
  }

  // 4. 無法解析則原樣呈現，避免遺失資訊
  return str;
};

// ✓ [新增] 模式與檔案控制變數
const uploadMode = ref('text');
const excelFile = ref(null);

// ✅ 用戶選擇的解析範本 ID（'auto' = 自動偵測關鍵字匹配）
const selectedTemplateId = ref('auto');

// ✅ 自動偵測到的範本資訊（每個文本框獨立儲存）
const detectedTemplateInfoMap = reactive({});

// ✅ 範本選擇下拉選單的選項（手動覆蓋用）
const templateOptions = computed(() => {
  const options = [{ title: '🔍 自動偵測 (根據關鍵字)', value: 'auto' }];
  customParsingRules.value.forEach(rule => {
    const kwStr = rule.keywords?.length ? ` [${rule.keywords.join(', ')}]` : '';
    options.push({ title: `📋 ${rule.templateName}${kwStr}`, value: rule.id });
  });
  return options;
});

// ✅ 根據文本內容的關鍵字自動偵測匹配的範本
const autoDetectTemplate = (text) => {
  if (!text || !text.trim()) return null;
  const cleanText = text.trim();
  
  // 計算每個範本的關鍵字匹配數，選擇匹配最多的
  let bestMatch = null;
  let bestScore = 0;
  
  for (const rule of customParsingRules.value) {
    if (!rule.keywords || rule.keywords.length === 0) continue;
    
    let score = 0;
    for (const kw of rule.keywords) {
      if (cleanText.includes(kw)) {
        score++;
      }
    }
    
    if (score > 0 && score > bestScore) {
      bestScore = score;
      bestMatch = rule;
    }
  }
  
  return bestMatch;
};

// ✅ 文本輸入時即時偵測範本（每個文本框獨立偵測）
const onTextInput = (index, newValue) => {
  const text = (newValue || '').trim();
  
  if (!text) {
    delete detectedTemplateInfoMap[index];
    return;
  }
  
  const matched = autoDetectTemplate(text);
  
  if (matched) {
    const matchedKws = matched.keywords.filter(kw => text.includes(kw));
    detectedTemplateInfoMap[index] = {
      type: 'success',
      icon: 'mdi-check-circle',
      message: `✅ 自動識別為「${matched.templateName}」格式 (匹配關鍵字：${matchedKws.join('、')})`
    };
  } else {
    // 檢查是否匹配內建格式
    if (text.includes('【新名單】')) {
      detectedTemplateInfoMap[index] = { type: 'info', icon: 'mdi-format-list-bulleted', message: '📋 偵測為【新名單】內建格式' };
    } else if (text.includes('官網 提交了')) {
      detectedTemplateInfoMap[index] = { type: 'info', icon: 'mdi-web', message: '📋 偵測為「官網預約賞屋」內建格式' };
    } else if (text.includes('【591】')) {
      detectedTemplateInfoMap[index] = { type: 'info', icon: 'mdi-home-search', message: '📋 偵測為【591】內建格式' };
    } else {
      detectedTemplateInfoMap[index] = { type: 'warning', icon: 'mdi-help-circle', message: '⚠️ 未識別到匹配的範本，將嘗試自動解析或使用內建格式' };
    }
  }
};

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

// ✓ [打勾] 完整的 Excel 解析與多層級排序優化（含重複偵測）
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
          note: (row['備註'] || '').toString().trim(), // ✅ 支援匯入備註欄位
          rawText: 'EXCEL匯入',
          assignedTo,
          assignedName
        };
      });

      const validLeads = mappedLeads.filter(l => l.phone);

      // ✅ 重複偵測：以電話號碼比對現有名單
      const existingPhoneMap = {};
      allLeads.value.forEach(lead => {
        if (lead.phone) existingPhoneMap[lead.phone] = lead;
      });

      const newLeads = [];
      const duplicates = [];

      validLeads.forEach(lead => {
        const existing = existingPhoneMap[lead.phone];
        if (existing) {
          duplicates.push({
            existing: existing,
            incoming: lead,
            action: 'skip' // 預設保留舊資料
          });
        } else {
          newLeads.push(lead);
        }
      });

      // ✅ 有重複 → 顯示比對 Dialog，讓用戶決定
      if (duplicates.length > 0) {
        excelDuplicates.value = duplicates;
        excelParsedNewLeads.value = newLeads;
        excelDuplicateDialog.value = true;
      } else {
        // 無重複，直接進入預覽
        previewLeads.value = newLeads;
        uploadStep.value = 2;
        await runCheck(newLeads.map(l => l.phone).filter(p => p));

        // 自動指派與多層級排序
        previewLeads.value.forEach(lead => {
          if (!lead.assignedTo) {
            const res = duplicateResults.value[lead.phone];
            if (res?.data?.latestSalesPhone || res?.data?.assignedTo) {
              quickAssignInPreview(lead, res.data.latestSalesPhone || res.data.assignedTo);
            }
          }
        });
        applySorting();
      }

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

/* ✅ 未處理 chip：加粗 + 脈動光環，桌面與手機通用 */
.chip-unprocessed {
  font-weight: 700 !important;
  animation: chip-pulse 2.2s ease-in-out infinite;
}
@keyframes chip-pulse {
  0%, 100% { box-shadow: 0 0 0 0 rgba(255, 87, 34, 0.55); }
  50%      { box-shadow: 0 0 0 6px rgba(255, 87, 34, 0); }
}

/* ✅ 未處理 桌面整列強調（v-data-table 子元素需 :deep 套用） */
:deep(.lead-row-unprocessed) {
  background-color: #FFF8F5 !important;
}
:deep(.lead-row-unprocessed > td:first-child) {
  border-left: 4px solid #FF5722 !important;
}

/* ✅ 未處理 手機卡片強調 */
.lead-card-unprocessed {
  border-left: 5px solid #FF5722 !important;
  background-color: #FFF8F5 !important;
}

</style>
