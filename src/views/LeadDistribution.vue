<template>
  <v-container fluid class="pa-4 bg-grey-lighten-4 fill-height align-start">
    <v-row>
      <v-col cols="12" class="d-flex align-center pb-0">
        <v-btn icon="mdi-arrow-left" variant="text" @click="router.push({ name: 'LeadDistributionEntry' })" class="me-2"></v-btn>
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
            <v-icon start>mdi-tray-arrow-down</v-icon>名單分配管理
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
      <v-text-field v-model="namePhoneSearch" label="搜尋姓名或電話" prepend-inner-icon="mdi-magnify" variant="outlined" density="comfortable" hide-details clearable rounded="lg"></v-text-field>
    </v-col>
    <v-col cols="12" sm="4">
      <v-select v-model="statusSearch" :items="['未處理', ...statusOptions]" label="狀態" multiple variant="outlined" density="comfortable" hide-details rounded="lg" prepend-inner-icon="mdi-filter-variant">
        <template v-slot:selection="{ index }"><span v-if="index === 0" class="text-caption">狀態 (+{{ statusSearch.length }})</span></template>
      </v-select>
    </v-col>
    <v-col v-if="isReceptionist || isAdmin" cols="12" sm="4">
      <v-select v-model="assignedSearch" :items="salesStaff" item-title="name" item-value="id" label="人員" multiple variant="outlined" density="comfortable" hide-details rounded="lg" prepend-inner-icon="mdi-account-search">
        <template v-slot:selection="{ index }"><span v-if="index === 0" class="text-caption">人員 (+{{ assignedSearch.length }})</span></template>
      </v-select>
    </v-col>

    <v-col cols="12" sm="4" class="mt-sm-2">
      <v-select v-model="sourceSearch" :items="sourceOptions" label="來源 (如 FB)" multiple variant="outlined" density="comfortable" hide-details rounded="lg" prepend-inner-icon="mdi-tray-arrow-down">
        <template v-slot:selection="{ index }"><span v-if="index === 0" class="text-caption">來源 (+{{ sourceSearch.length }})</span></template>
      </v-select>
    </v-col>
    <v-col cols="12" sm="4" class="mt-sm-2">
      <v-select v-model="budgetSearch" :items="budgetOptions" label="預算" multiple variant="outlined" density="comfortable" hide-details rounded="lg" prepend-inner-icon="mdi-currency-usd">
        <template v-slot:selection="{ index }"><span v-if="index === 0" class="text-caption">預算 (+{{ budgetSearch.length }})</span></template>
      </v-select>
    </v-col>
    <v-col cols="6" sm="2" class="mt-sm-2">
  <v-text-field
    v-model="startDate"
    label="填表日期(起)"
    type="date"
    variant="outlined"
    density="comfortable"
    hide-details
    rounded="lg"
    prepend-inner-icon="mdi-calendar-start"
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
    prepend-inner-icon="mdi-calendar-end"
    color="primary"
    clearable
    :min="startDate" 
  ></v-text-field>
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
          <v-row no-gutters>
            <v-col cols="4" class="pe-2">
              <div class="info-label">來源</div>
              <div class="info-value text-truncate">
                <v-icon size="12" class="me-1">mdi-tray-arrow-down</v-icon>{{ item.source || '未註明' }}
              </div>
            </v-col>
            <v-col cols="4" class="px-2 border-left-custom">
              <div class="info-label">預算</div>
              <div class="info-value text-truncate">
                <v-icon size="12" class="me-1">mdi-currency-usd</v-icon>{{ item.budget || '未填寫' }}
              </div>
            </v-col>
            <v-col cols="4" class="ps-2 border-left-custom">
              <div class="info-label">填表日期</div>
              <div class="info-value text-truncate">
                <v-icon size="12" class="me-1">mdi-calendar-clock</v-icon>{{ item.date || '無日期' }}
              </div>
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
          
          <v-card class="pa-5 mb-6 rounded-xl elevation-2">
            <div class="section-title mb-3">聯絡狀況</div>
            
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
              color="primary" 
              variant="elevated"
              class="mb-4 font-weight-bold"
              prepend-icon="mdi-calendar-check"
              @click="openBookingDialog"
            >
              開啟預約視窗
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
                color="green" 
                size="x-large" 
                rounded="lg"
                elevation="2"
                min-width="200"
                :disabled="!reportForm.status || (showReasonField && !reportForm.reason)"
                @click="submitReport"
                class="font-weight-bold"
              >
                完成回報
              </v-btn>
            </div>
          </v-card>

          <div class="section-title mt-8 mb-3 d-flex align-center">
            <v-icon size="20" class="me-2">mdi-history</v-icon>回報日誌
          </div>
          
          <div v-if="leadLogs.length === 0" class="text-center py-6 text-grey-lighten-1 border-dashed rounded-lg">
            無紀錄
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
              <div class="text-body-2 font-weight-bold text-grey-darken-3 mb-1">{{ log.note }}</div>
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
          <div v-for="(input, index) in uploadInputs" :key="index" class="mb-3">
            <v-textarea
              v-model="uploadInputs[index]"
              label="請貼入完整的客戶訊息 (系統將自動解析)"
              variant="flat"
              bg-color="white"
              rounded="lg"
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
        </v-card-text>

        <v-card-text v-if="uploadStep === 2" class="pa-0">
          <div class="bg-primary-lighten-5 pa-3 d-flex align-center gap-4 border-bottom">
            <span class="text-caption font-weight-bold text-primary">解析摘要：</span>
            <v-chip size="x-small" color="primary" variant="flat">總計 {{ previewLeads.length }} 筆</v-chip>
            <v-chip size="x-small" color="orange-darken-2" variant="flat" v-if="summaryCount.vip">🚩 已有客資 {{ summaryCount.vip }} 筆</v-chip>
            <v-chip size="x-small" color="blue-grey-darken-1" variant="flat" v-if="summaryCount.lead">⚠️ 重複名單 {{ summaryCount.lead }} 筆</v-chip>
            <v-spacer></v-spacer>
            <v-progress-circular v-if="isCheckingDuplicates" indeterminate size="16" width="2" color="primary" class="me-2"></v-progress-circular>
            <span v-if="isCheckingDuplicates" class="text-caption text-primary">系統檢查重複中...</span>
          </div>

          <v-table density="comfortable" fixed-header height="500px" class="preview-table">
            <thead>
              <tr class="bg-grey-lighten-4">
                <th class="text-left" width="220">客戶資訊</th>
                <th class="text-center" width="160">檢查狀態與日期</th>
                <th class="text-left" width="180">指派銷售人員</th>
                <th class="text-left">名單屬性</th>
                <th class="text-center" width="60">操作</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(lead, idx) in previewLeads" :key="idx" :class="getRowClass(lead.phone)">
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
                    :color="!lead.phone ? 'error' : ''"
                  ></v-text-field>
                </td>

                <td class="text-center">
                  <div v-if="duplicateResults[lead.phone]">
                    <div v-if="duplicateResults[lead.phone].type === 'vip'" class="d-flex flex-column align-center">
                      <v-chip color="orange-darken-2" size="x-small" class="font-weight-bold mb-1">🚩 已有客資</v-chip>
                      <div class="text-caption font-weight-bold text-orange-darken-4">{{ duplicateResults[lead.phone].data.latestSalesName }}</div>
                      <div class="text-grey text-caption" style="font-size: 10px !important;">
                        {{ duplicateResults[lead.phone].data.visitDate || '無日期' }}
                      </div>
                      <v-btn size="x-small" color="orange-darken-2" variant="tonal" class="mt-1" @click="quickAssignInPreview(lead, duplicateResults[lead.phone].data.latestSalesPhone)">選擇</v-btn>
                    </div>

                    <div v-else-if="duplicateResults[lead.phone].type === 'lead'" class="d-flex flex-column align-center">
                      <v-chip color="blue-grey-darken-1" size="x-small" class="mb-1">⚠️ 重複</v-chip>
                      <div class="text-caption font-weight-bold">{{ duplicateResults[lead.phone].data.assignedName }}</div>
                      <div class="text-grey text-caption" style="font-size: 10px !important;">
                        {{ duplicateResults[lead.phone].data.assignedAt }}
                      </div>
                      <v-btn size="x-small" color="blue-grey-darken-1" variant="tonal" class="mt-1" @click="quickAssignInPreview(lead, duplicateResults[lead.phone].data.assignedTo)">選擇</v-btn>
                    </div>

                    <v-chip v-else color="success" size="small" variant="outlined">✨ 全新名單</v-chip>
                  </div>
                  <v-progress-circular v-else indeterminate size="14" width="2" color="grey"></v-progress-circular>
                </td>

                <td>
                  <v-select
                  v-model="lead.assignedTo"
                  :items="salesStaffWithCounts"
                  item-title="displayName"
                  item-value="id"
                  label="選擇銷售"
                  density="compact"
                  hide-details
                  variant="outlined"
                  class="mt-1"
                  @update:model-value="(val) => updateAssignedInfo(lead, val)"
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
                  </v-row>
                </td>

                <td class="text-center">
                  <v-btn icon="mdi-trash-can-outline" variant="text" color="grey-lighten-1" size="small" @click="previewLeads.splice(idx, 1)"></v-btn>
                </td>
              </tr>
            </tbody>
          </v-table>
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

    <v-snackbar v-model="snackbar.show" :color="snackbar.color" timeout="3000">
      {{ snackbar.text }}
    </v-snackbar>
  </v-container>
</template>

<script setup>
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
import { Doughnut, Bar, Pie } from 'vue-chartjs';
import { Chart as ChartJS, Title, Tooltip, Legend, ArcElement, CategoryScale, LinearScale, BarElement } from 'chart.js';
import LeadSettingsDialog from '@/components/LeadSettingsDialog.vue';


import ViewingReservationDialog from '@/components/ViewingReservationDialog.vue';

ChartJS.register(
  Title, Tooltip, Legend, ArcElement, CategoryScale, LinearScale, BarElement,
  ChartDataLabels // ✅ 新增註冊
);

const props = defineProps(['projectId']);
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
const reasonOptions = ref(['家人討論', '總價太高', '單價太高', '暫不買房', '要找成屋', '號碼錯誤/空號']);

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
  if (newStatus === '還在討論') {
    reportForm.value.reason = '家人討論';
    isReasonReadonly.value = true;
  } else if (newStatus === '空號') {
    reportForm.value.reason = '號碼錯誤/空號';
    isReasonReadonly.value = true;
  } else if (newStatus === '未接') {
    reportForm.value.reason = '號碼錯誤/空號';
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
  showMsg('預約成功，已自動帶入談話紀錄', 'success');
};

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
    const key = l.source || '未知來源';
    counts[key] = (counts[key] || 0) + 1;
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
  const labels = ['全案總計', ...salesStaff.value.map(s => s.name)];
  
  const getCounts = (staffId = null) => {
    const leads = staffId ? allLeads.value.filter(l => l.assignedTo === staffId) : allLeads.value;
    const total = leads.length;
    const done = leads.filter(l => l.status && l.status !== '').length;
    const pending = total - done;
    return { total, done, pending };
  };

  const stats = [getCounts(), ...salesStaff.value.map(s => getCounts(s.id))];

  return {
    labels,
    datasets: [
      { label: '總名單', data: stats.map(s => s.total), backgroundColor: '#9E9E9E' },
      { label: '已完成', data: stats.map(s => s.done), backgroundColor: 'green' },
      { label: '未處理', data: stats.map(s => s.pending), backgroundColor: 'red' }
    ]
  };
});

// --- 新增：不考慮狀態與原因統計邏輯 ---


const statusDistributionChartData = computed(() => {
  const counts = {};
  // 顏色對照表
  const colorMap = {
    '不考慮': '#F44336', // 紅
    '已約賞屋': '#4CAF50', // 綠
    '還在討論': '#2196F3', // 藍
    '未接': '#FF9800',     // 橘
    '空號': '#9E9E9E',     // 灰
    '未處理': '#E0E0E0'    // 淺灰
  };

  // 1. 初始化統計 (確保顯示所有選項)
  statusOptions.value.forEach(opt => { counts[opt] = 0; });

  // 2. 從所有專案日誌中進行統計
  allProjectLogs.value.forEach(log => {
    const key = log.status;
    if (key) {
      counts[key] = (counts[key] || 0) + 1;
    }
  });

  // 3. 過濾掉筆數為 0 的項目，並取得標籤 (讓圖表更乾淨)
  const labels = Object.keys(counts).filter(k => counts[k] > 0);
  
  // 💡 安全檢查：若完全無資料，回傳空物件結構防止 Chart.js 報錯
  if (labels.length === 0) {
    return { 
      labels: ['尚無資料'], 
      datasets: [{ data: [1], backgroundColor: ['#E0E0E0'] }] 
    };
  }

  // 4. 對應顏色陣列
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
  // 僅篩選不考慮的日誌
  const deniedLogs = allProjectLogs.value.filter(log => log.status === '不考慮');
  
  deniedLogs.forEach(log => {
    const key = log.reason || '未註明原因';
    counts[key] = (counts[key] || 0) + 1;
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

// --- 新增：銷售員選單內容與排序邏輯 ---
const salesStaffWithCounts = computed(() => {
  return salesStaff.value.map(staff => {
    // 從 allLeads 中計算該人員目前被指派的名單數量 (排除已刪除的)
    const count = allLeads.value.filter(l => l.assignedTo === staff.id).length;
    return {
      ...staff,
      displayName: `${staff.name} (${count})`, // 選單顯示的名稱後綴數量
      leadCount: count
    };
  }).sort((a, b) => b.leadCount - a.leadCount); // 依照數量 多 > 少 排序
});




// 1. 更新表格欄位定義 (新增 來源、預算、填表日期)
const statusHeaders = [
  { title: '姓名', key: 'name' },
  { title: '電話', key: 'phone' },
  { title: '來源', key: 'source' },       // 新增
  { title: '預算', key: 'budget' },       // 新增
  { title: '填表日期', key: 'date' },     // 新增
  { title: '指派給', key: 'assignedName' },
  { title: '狀態', key: 'status' },
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
const sourceOptions = computed(() => [...new Set(allLeads.value.map(l => l.source || '未註明'))]);
const budgetOptions = computed(() => [...new Set(allLeads.value.map(l => l.budget || '未填寫'))]);


// 4. 更新過濾邏輯
const filteredLeads = computed(() => {
  let list = allLeads.value;

  // 1. 權限過濾
  if (isReceptionist.value || isAdmin.value) {
    // 管理端：看全部，不需過濾指派人
  } else {
    // 銷售端：僅看指派給自己的
    // ✅ 增加安全檢查：若 userUid 尚未載入，先不顯示或顯示空陣列，避免比對錯誤
    if (!userUid.value) return []; 
    list = list.filter(l => l.assignedTo === userUid.value);
  }

  // 2. 關鍵字搜尋 (姓名/電話)
  if (namePhoneSearch.value) {
    const s = namePhoneSearch.value.toLowerCase();
    list = list.filter(l => 
      (l.name && l.name.toLowerCase().includes(s)) || 
      (l.phone && l.phone.includes(s))
    );
  }

  // 3. 狀態勾選過濾
  if (statusSearch.value.length > 0) {
    list = list.filter(l => statusSearch.value.includes(l.status || '未處理'));
  }

  if (assignedSearch.value && assignedSearch.value.length > 0) {
    list = list.filter(l => assignedSearch.value.includes(l.assignedTo));
  }

  // 4. 其他屬性過濾 (來源、預算、日期)
  if (sourceSearch.value.length > 0) {
    list = list.filter(l => sourceSearch.value.includes(l.source || '未註明'));
  }
  if (budgetSearch.value.length > 0) {
    list = list.filter(l => budgetSearch.value.includes(l.budget || '未填寫'));
  }
  if (dateSearch.value.length > 0) {
    list = list.filter(l => dateSearch.value.includes(l.date || '無日期'));
  }

if (startDate.value) {
    // 將 HTML5 date input 的 YYYY-MM-DD 轉為 YYYY/MM/DD 以匹配資料庫格式
    const sDate = startDate.value.replace(/-/g, '/');
    list = list.filter(l => l.date && l.date >= sDate);
  }
  
  if (endDate.value) {
    const eDate = endDate.value.replace(/-/g, '/');
    list = list.filter(l => l.date && l.date <= eDate);
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
  const counts = { vip: 0, lead: 0, none: 0 };
  previewLeads.value.forEach(l => {
    const res = duplicateResults.value[l.phone];
    if (res?.type === 'vip') counts.vip++;
    else if (res?.type === 'lead') counts.lead++;
    else counts.none++;
  });
  return counts;
});

const getRowClass = (phone) => {
  const res = duplicateResults.value[phone];
  if (res?.type === 'vip') return 'bg-orange-lighten-5';
  if (res?.type === 'lead') return 'bg-blue-grey-lighten-5';
  return '';
};

const normalizePhone = (p) => {
  if (!p) return '';
  let clean = p.toString().replace(/[\s-()]/g, '');
  if (clean.startsWith('+886')) clean = '0' + clean.slice(4);
  else if (clean.startsWith('886')) clean = '0' + clean.slice(3);
  return clean.replace(/\D/g, ''); 
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
    result.source = '首馥官網';
    
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
  
  return result;
};

const handleParsing = async () => {
  const leads = uploadInputs.value
    .filter(txt => txt && txt.trim() !== '')
    .map(txt => parseLeadText(txt));
  
  if (leads.length === 0) {
    showMsg('請先貼入有效的名單文本', 'warning');
    return;
  }
  previewLeads.value = leads;
  uploadStep.value = 2;
  const phones = leads.map(l => l.phone).filter(p => p);
  
  // 執行查重 API
  await runCheck(phones);

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

    const leadsWithStatus = previewLeads.value.map(l => {
      const res = duplicateResults.value[l.phone];
      let statusText = "✨ 全新名單"; 
      
      if (res?.type === 'vip') {
        // ✓ [打勾] 確保 salesName 在此處正確宣告，並處理 null 值
        const salesName = res.data?.latestSalesName || '未知';
        statusText = `🚩 已有客資 (來客: ${res.data?.name || '無名'} / 銷售: ${salesName})`; 
      } else if (res?.type === 'lead') {
        statusText = `⚠️ 重複名單 (共 ${res.data?.count || 0} 筆)`;
      }
      return { ...l, statusText }; 
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
  uploadInputs.value = [''];
  previewLeads.value = [];
};

// 4. 修改原本的 openReport 函式，確保開啟時重置狀態
const openReport = async (item) => {
  currentLead.value = item;
  reportForm.value = { status: item.status || '', reason: item.reason || '', note: '' };
  
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

const formatDateTime = (ts) => ts ? (ts.toDate ? ts.toDate() : new Date(ts)).toLocaleString('zh-TW', { hour12: false }) : '-';
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
  // ✅ 加入 Debug Log
  console.log(`[Debug] 收到日誌快照，資料筆數: ${snap.size}`);
  
  if (snap.size > 0) {
    console.log(`[Debug] 第一筆日誌內容範例:`, snap.docs[0].data());
  } else {
    console.warn(`[Debug] 警告：目前查無任何符合 projectId 為 "${props.projectId}" 的日誌。`);
  }

  allProjectLogs.value = snap.docs.map(d => d.data());
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
  scales: { 
    x: { stacked: false }, 
    y: { beginAtZero: true, ticks: { precision: 0 } } 
  },
  plugins: { legend: { display: true, position: 'bottom' } } 
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
.info-label {
  font-size: 0.65rem;
  color: #5c6bc0;
  font-weight: 800;
  margin-bottom: 2px;
}

.info-value {
  font-size: 0.8rem;
  font-weight: 800;
  color: #1a237e;
  line-height: 1.2;
}

/* 垂直分隔線 */
.border-left-custom {
  border-left: 1px solid rgba(63, 81, 181, 0.15);
}

/* 讓手機版文字截斷防止撐開 */
.text-truncate {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

</style>