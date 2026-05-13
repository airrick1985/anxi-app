<template>
  <v-container fluid>
    <v-card class="pa-4">


      <div v-if="isLoading" class="d-flex flex-column gap-4">
        <!-- 模擬篩選區塊 -->
        <v-skeleton-loader class="mb-4 rounded" type="heading, list-item" height="100"></v-skeleton-loader>
        <!-- 模擬月曆表格 -->
        <v-skeleton-loader class="rounded" type="table-heading, table-row-divider@6" height="600"></v-skeleton-loader>
      </div>

      <v-alert v-if="error" type="error" variant="tonal" class="mb-4" :text="error"></v-alert>

      <div v-if="!projectStore.isLoading && !error && !isLoading">
        <div id="custom-calendar-container">
          </div>
      </div>

      <v-row
        class="mb-4 pa-3 rounded d-flex d-md-none"
        dense
      >
        <v-col cols="12">
          <VueDatePicker
            v-model="dateRange"
            range
            :enable-time-picker="false"
            format="yyyy/MM/dd"
            :min-date="minSelectableDate"
            :max-date="maxSelectableDate"
            locale="zh-TW"
            auto-apply
            :close-on-auto-apply="true"
            placeholder="請選擇日期區間"
          ></VueDatePicker>
        </v-col>
        <v-col cols="12">
          <v-autocomplete
            v-model="selectedSearchResult"
            v-model:search="searchQuery"
            :items="autocompleteItems"
            :loading="isSearchingBackend"
            item-title="title"
            item-value="value"
            label="關鍵字搜尋..."
            prepend-inner-icon="mdi-magnify"
            density="compact"
            hide-details
            clearable
            variant="outlined"
            color="primary"
            no-data-text="沒有符合的預約紀錄"
            return-object
            @update:model-value="handleSearchResultSelection"
            no-filter
          >
            <template v-slot:item="{ props, item }">
              <v-list-item v-bind="props" :title="null" lines="two" class="py-2">
                <v-list-item-title class="d-flex align-center">
                  <v-chip :color="getStatusColor(item.raw.status)" size="x-small" class="mr-2" label variant="flat">
                    {{ item.raw.status }}
                  </v-chip>
                  <span class="font-weight-bold text-primary">{{ item.raw.unitId }}</span>
                  <span class="mx-2">-</span>
                  <span>{{ item.raw.bookerName }}</span>
                </v-list-item-title>
                <v-list-item-subtitle class="mt-1 text-medium-emphasis">
                  <span>{{ item.raw.bookingType }}</span>
                  <span class="mx-2">·</span>
                  <v-icon size="x-small" class="mr-1">mdi-calendar-blank</v-icon>
                  <span>{{ item.raw.date }}</span>
                  <v-icon size="x-small" class="ml-3 mr-1">mdi-clock-outline</v-icon>
                  <span>{{ item.raw.time }}</span>
                </v-list-item-subtitle>
              </v-list-item>
            </template>
          </v-autocomplete>
        </v-col>
      </v-row>

      <v-alert v-if="error" type="error" variant="tonal" class="mb-4" :text="error"></v-alert>


      <div v-show="!isLoading && !error">
       <v-row id="filter-panel" class="mb-4 align-center bg-grey-lighten-4 pa-3 rounded d-none d-md-flex" dense>
  
  <v-col cols="12" sm="8" md="4">
    <VueDatePicker
      v-model="dateRange"
      range
      :enable-time-picker="false"
      format="yyyy/MM/dd"
      :min-date="minSelectableDate"
      :max-date="maxSelectableDate"
      locale="zh-TW"
      auto-apply
      :close-on-auto-apply="true"
      placeholder="請選擇日期區間"
    ></VueDatePicker>
  </v-col>
  
  <v-col cols="12" sm="4" md="3">
    <v-autocomplete
      v-model="selectedSearchResult"
      v-model:search="searchQuery"
      :items="autocompleteItems"
      :loading="isSearchingBackend"
      item-title="title"
      item-value="value"
      label="關鍵字搜尋..."
      prepend-inner-icon="mdi-magnify"
      density="compact"
      hide-details
      clearable
      variant="outlined"
      color="primary"
      no-data-text="沒有符合的預約紀錄"
      return-object
      @update:model-value="handleSearchResultSelection"
      no-filter 
    >
      <template v-slot:item="{ props, item }">
        <v-list-item v-bind="props" :title="null" lines="two" class="py-2">
          <v-list-item-title class="d-flex align-center">
            <v-chip
              :color="getStatusColor(item.raw.status)"
              size="x-small"
              class="mr-2"
              label
              variant="flat"
            >
              {{ item.raw.status }}
            </v-chip>
            <span class="font-weight-bold text-primary">{{ item.raw.unitId }}</span>
            <span class="mx-2">-</span>
            <span>{{ item.raw.bookerName }}</span>
          </v-list-item-title>
          <v-list-item-subtitle class="mt-1 text-medium-emphasis">
            <span>{{ item.raw.bookingType }}</span>
            <span class="mx-2">·</span>
            <v-icon size="x-small" class="mr-1">mdi-calendar-blank</v-icon>
            <span>{{ item.raw.date }}</span>
            <v-icon size="x-small" class="ml-3 mr-1">mdi-clock-outline</v-icon>
            <span>{{ item.raw.time }}</span>
          </v-list-item-subtitle>
        </v-list-item>
      </template>
    </v-autocomplete>
  </v-col>

  <v-col cols="auto" class="flex-grow-1"></v-col> 

  <v-col cols="12" md="auto">
    
    <v-tooltip text="重新整理資料" location="bottom">
      <template v-slot:activator="{ props }">
        <v-btn v-bind="props" icon="mdi-refresh" variant="text" @click="handleRefresh" :loading="isLoading" color="black"></v-btn>
      </template>
    </v-tooltip>

    <v-tooltip text="新增預約" location="bottom">
      <template v-slot:activator="{ props }">
        <v-btn 
          v-if="canEdit" 
          v-bind="props" 
          icon="mdi-calendar-plus" 
          variant="text" 
          color="black" 
          @click="isAdminAddDialogVisible = true"
        ></v-btn>
      </template>
    </v-tooltip>

    <v-tooltip text="下載時間表" location="bottom">
      <template v-slot:activator="{ props: tooltipProps }">
        <v-menu location="bottom end">
          <template v-slot:activator="{ props: menuProps }">
            <v-btn 
              v-bind="{ ...tooltipProps, ...menuProps }" 
              icon="mdi-download" 
              variant="text" 
              color="black"
              :loading="isDownloadingPdf || isDownloadingExcel"
            ></v-btn>
          </template>
          
          <v-list density="compact">
            <v-list-item
              prepend-icon="mdi-image-area"
              title="下載 (PNG)"
              @click="handleDownloadPng"
              :disabled="isDownloadingPdf || isDownloadingExcel"
            >
              <template v-slot:append>
                <v-progress-circular v-if="isDownloadingPdf" indeterminate color="grey" size="20" width="2"></v-progress-circular>
              </template>
            </v-list-item>
            <v-list-item
              prepend-icon="mdi-microsoft-excel"
              title="下載 (Excel)"
              @click="handleDownloadExcel"
              :disabled="isDownloadingPdf || isDownloadingExcel"
            >
              <template v-slot:append>
                <v-progress-circular v-if="isDownloadingExcel" indeterminate color="grey" size="20" width="2"></v-progress-circular>
              </template>
            </v-list-item>
          </v-list>
        </v-menu>
      </template>
    </v-tooltip>

    

    <v-tooltip text="統計摘要" location="bottom">
      <template v-slot:activator="{ props }">
        <v-btn
          v-bind="props"
          icon="mdi-chart-bar"
          variant="text"
          color="black"
          @click="isStatisticsDialogVisible = true"
          :disabled="statisticsMatrix.rows.length === 0"
        ></v-btn>
      </template>
    </v-tooltip>

    <v-tooltip text="篩選設定" location="bottom">
      <template v-slot:activator="{ props }">
        <v-btn
          v-bind="props"
          icon="mdi-cog"
          variant="text"
          color="black"
          @click="isFilterDialogVisible = true"
        ></v-btn>
      </template>
    </v-tooltip>


  </v-col>
</v-row>


        
        <div id="custom-calendar-container">
          <div v-for="(chunk, index) in dateChunks" :key="index" class="mb-8 table-chunk">
            <h3 class="text-h6 mb-2">
              　 {{ projectName }} - 時間表: {{ format(chunk[0].dateObj, 'yyyy/MM/dd') }} - {{ format(chunk[chunk.length - 1].dateObj, 'yyyy/MM/dd') }}
            </h3>
            <v-table class="custom-calendar-table">
              <thead>
                <tr>
                  <th class="time-header">
        <v-menu
        v-model="timeSelectorMenu[index]" :close-on-content-click="false"
        location="end"
        transition="scale-transition"
        @update:model-value="(val) => { if(val) dismissTimeSlotHint(); }"
      >
        <template v-slot:activator="{ props }">
          <v-tooltip :model-value="!hasSeenTimeSlotHint && index === 0" location="bottom" content-class="time-hint-tooltip">
            <template v-slot:activator="{ props: tooltipProps }">
              <v-btn v-bind="{ ...props, ...tooltipProps }" variant="text" size="small" append-icon="mdi-chevron-down" class="time-selector-btn">
                時間
                <v-badge v-if="!hasSeenTimeSlotHint && index === 0" dot color="info" floating class="time-hint-badge">
                </v-badge>
              </v-btn>
            </template>
            <div class="d-flex align-center">
              <v-icon size="small" class="mr-1">mdi-gesture-tap</v-icon>
              <span>點擊此處可篩選要顯示的時段</span>
            </div>
          </v-tooltip>
        </template>


          <v-card max-width="380">
            <v-list density="compact">
              <v-list-item class="px-3 py-2">
                <div class="d-flex align-center justify-space-between">
                  <v-btn-toggle v-model="autoTimeSlotMode" mandatory density="compact" color="primary" variant="outlined" class="flex-grow-1">
                    <v-btn :value="true" size="small" prepend-icon="mdi-auto-fix" class="flex-grow-1">自動顯示</v-btn>
                    <v-btn :value="false" size="small" prepend-icon="mdi-tune-variant" class="flex-grow-1">手動選擇</v-btn>
                  </v-btn-toggle>
                </div>
                <div class="text-caption text-grey-darken-1 mt-1">
                  {{ autoTimeSlotMode ? '根據預約資料自動顯示有資料的時段' : '自行勾選要顯示的時段' }}
                </div>
              </v-list-item>
            </v-list>
            <v-divider></v-divider>

            <v-expand-transition>
              <v-list v-if="!autoTimeSlotMode" style="max-height: 350px" class="overflow-y-auto" density="compact">
                <v-list-item class="px-3 py-1">
                  <div class="d-flex justify-space-between">
                    <v-btn size="small" variant="text" @click="selectAllTimeSlots">全選</v-btn>
                    <v-btn size="small" variant="text" @click="clearAllTimeSlots">清空</v-btn>
                  </div>
                </v-list-item>
                <v-divider></v-divider>
                
                <v-row no-gutters>
                  <v-col v-for="time in allPossibleTimeSlots" :key="time" cols="6">
                    <v-checkbox
                      v-model="selectedTimeSlots"
                      :label="time"
                      :value="time"
                      density="compact"
                      hide-details
                      class="pa-2"
                    ></v-checkbox>
                  </v-col>
                </v-row>
              </v-list>
            </v-expand-transition>

            <v-expand-transition>
              <div v-if="autoTimeSlotMode" class="pa-3">
                <v-alert v-if="dataBasedTimeSlots.length === 0" type="info" variant="tonal" density="compact">
                  目前日期範圍內無預約資料
                </v-alert>
                <div v-else>
                  <div class="text-caption text-grey-darken-1 mb-2">目前偵測到 {{ dataBasedTimeSlots.length }} 個時段有預約資料：</div>
                  <v-chip-group column>
                    <v-chip v-for="slot in dataBasedTimeSlots" :key="slot" size="small" variant="tonal" color="primary">
                      <v-icon start size="x-small">mdi-clock-outline</v-icon>
                      {{ slot }}
                    </v-chip>
                  </v-chip-group>
                </div>
              </div>
            </v-expand-transition>

            <v-divider></v-divider>
            <v-card-actions>
              <v-spacer></v-spacer>
              <v-btn color="primary" variant="text" @click="timeSelectorMenu[index] = false">
                完成
              </v-btn>
            </v-card-actions>
          </v-card>
        </v-menu>
      </th>
                  <th v-for="day in chunk" :key="day.fullDate" class="day-header" :class="{ 'today-column': day.isToday, 'weekend-column': day.isWeekend }">
                    <div v-if="day.isInRange">
                      <div>{{ day.dayName }}</div>
                      <div>{{ day.date }}</div>
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="timeSlot in timeSlots" :key="timeSlot">
                  <td class="time-cell">{{ timeSlot }}</td>
                  <td v-for="day in chunk" :key="day.fullDate" :class="['event-cell', { 'disabled-cell': !day.isInRange, 'today-column': day.isToday, 'weekend-column': day.isWeekend }]">
                    <div v-if="day.isInRange" class="event-cell-content">
                      <div v-if="groupedEvents[day.fullDate] && groupedEvents[day.fullDate][timeSlot]">
                        <div
                          v-for="event in groupedEvents[day.fullDate][timeSlot]"
                          :key="event.id"
                          :class="['event-item', { 'cancelled-event': event.status === '取消' }]"
                          :style="getEventStyle(event)"
                          @click="handleCustomEventClick(event)"
                        >
                          <v-icon v-if="event.status === '取消'" color="red-darken-1" size="small" class="mr-1">mdi-close-circle-outline</v-icon>
                          <v-icon v-if="event.status === '已完成'" color="blue-grey" size="small" class="mr-1">mdi-check-all</v-icon>
                          <template v-for="(part, partIndex) in event.displayParts" :key="partIndex">
                            <strong v-if="part.isHousehold" class="event-household">{{ part.text }}</strong>
                            <span v-else>{{ part.text }}</span>
                            <span v-if="partIndex < event.displayParts.length - 1"> - </span>
                          </template>
                        </div>
                      </div>
                    </div>
                  </td>
                </tr>
              </tbody>
            </v-table>
          </div>
        </div>
      </div>
    </v-card>

    <v-snackbar v-model="snackbar" :timeout="2000" color="success">
      {{ snackbarText }}
    </v-snackbar>

      <AppointmentDetailsDialog
      v-model="isDialogVisible"
      :appointment="selectedEvent"
      :can-edit="canEdit"
      :booking-options="bookingOptions"
      :booking-history="bookingHistory"
      :calendar-data="calendarData"
      @save="handleSaveChangesFromDialog"
      @cancel-appointment="promptCancelBooking"
      @update-inspectors="handleUpdateInspectorsFromDialog"
      @request-calendar-data="handleRequestCalendarData"
    />
    
       <AdminAddBookingDialog
      v-if="isAdminAddDialogVisible"
      v-model="isAdminAddDialogVisible"
      :project-id="projectId"
      @booking-success="handleBookingSuccess"
    />

    <v-dialog v-model="isFilterDialogVisible" max-width="500px">
      <v-card>
        <v-card-title class="text-h6 d-flex align-center bg-grey-lighten-3">
          <v-icon start>mdi-cog</v-icon>
          篩選設定
        </v-card-title>
        <v-divider></v-divider>
        
        <v-card-text class="pa-4">
          <!-- 功能說明區塊 -->
          <v-alert type="info" variant="tonal" density="compact" class="mb-4" border="start">
            <div class="text-body-2">
              透過以下篩選條件，您可以自訂時間表上要顯示的預約紀錄及其標籤內容。勾選的項目會即時反映在行事曆上。
            </div>
          </v-alert>

          <div class="mb-3">
            <v-label class="text-subtitle-1 font-weight-bold mb-1">狀態</v-label>
            <div class="text-caption text-grey-darken-1 mb-2">選擇要在時間表上顯示的預約狀態</div>
            <div class="d-flex align-center flex-wrap ga-2">
              <v-checkbox v-model="selectedStatuses" label="預約中" value="預約中" density="compact" hide-details color="black"></v-checkbox>
              <v-checkbox v-model="selectedStatuses" label="取消" value="取消" density="compact" hide-details color="black"></v-checkbox>
              <v-checkbox v-model="selectedStatuses" label="已完成" value="已完成" density="compact" hide-details color="black"></v-checkbox>
            </div>
          </div>
          <v-divider class="my-3"></v-divider>
          
          <div class="mb-3">
            <v-label class="text-subtitle-1 font-weight-bold mb-1">項目</v-label>
            <div class="text-caption text-grey-darken-1 mb-2">選擇要顯示哪些預約項目類型（如初驗、複驗等）</div>
            <div class="d-flex align-center flex-wrap ga-2">
              <v-checkbox v-for="itemType in currentTypeOptions" :key="itemType" v-model="selectedTypes" :label="itemType" :value="itemType" density="compact" hide-details color="black"></v-checkbox>
            </div>
          </div>
          <v-divider class="my-3"></v-divider>

          <div class="mb-3">
            <v-label class="text-subtitle-1 font-weight-bold mb-1">選擇方式</v-label>
            <div class="text-caption text-grey-darken-1 mb-2">篩選特定的預約方式（如屋主自驗、委託代驗等）</div>
            <div class="d-flex align-center flex-wrap ga-2">
              <v-checkbox v-for="method in currentMethodOptions" :key="method" v-model="selectedMethods" :label="method" :value="method" density="compact" hide-details color="black"></v-checkbox>
            </div>
          </div>
          <v-divider class="my-3"></v-divider>

          <div>
            <v-label class="text-subtitle-1 font-weight-bold mb-1">標題顯示</v-label>
            <div class="text-caption text-grey-darken-1 mb-2">設定每筆預約紀錄在時間表格子中要顯示的欄位資訊</div>
            <div class="d-flex align-center flex-wrap ga-2">
              <v-checkbox v-for="field in displayFieldOptions" :key="field.key" v-model="selectedDisplayFields" :label="field.label" :value="field.key" density="compact" hide-details color="black"></v-checkbox>
            </div>
          </div>
        </v-card-text>

        <v-divider></v-divider>
        <v-card-actions class="pa-3 bg-grey-lighten-4">
          <v-spacer></v-spacer>
          <v-btn color="primary" variant="flat" @click="isFilterDialogVisible = false">
            完成
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="isStatisticsDialogVisible" max-width="700px">
      <v-card>
        <v-card-title class="text-h6 d-flex align-center bg-blue-grey-lighten-5" v-draggable-dialog>
          <v-icon start>mdi-chart-bar</v-icon>
          <span class="text-subtitle-1 font-weight-bold">
            {{ projectName }} {{ formattedDateRangeTitle }} 預約統計
          </span>
          <v-spacer></v-spacer>
          <v-btn icon="mdi-close" variant="text" @click="isStatisticsDialogVisible = false"></v-btn>
        </v-card-title>
        <v-divider></v-divider>

        <v-card-text class="pa-4">
          <v-alert
            v-if="statisticsMatrix.rows.length === 0"
            type="info"
            variant="tonal"
            text="目前篩選條件下無任何預約資料可供統計。"
          ></v-alert>

          <v-table v-else density="compact" class="border rounded-lg">
            <thead>
              <tr class="bg-grey-lighten-4">
                <th class="text-left font-weight-bold" style="width: 150px;">
                  <v-checkbox
                    v-model="selectAllStatisticsTypes"
                    label="項目"
                    density="compact"
                    hide-details
                    class="font-weight-bold"
                  ></v-checkbox>
                </th>
                
                <th v-for="header in statisticsMatrix.headers" :key="header" class="text-center font-weight-bold">
                  
                  <v-checkbox
                    v-if="header !== '總計'"
                    v-model="selectedStatisticsStatuses"
                    :value="header"
                    :label="header"
                    density="compact"
                    hide-details
                    class="font-weight-bold justify-center"
                  ></v-checkbox>
                  
                  <span v-else>{{ header }}</span>
                </th>
              </tr>
            </thead>
            
            <tbody>
              <tr v-for="row in statisticsMatrix.rows" :key="row.type">
                <td class="font-weight-medium">
                  <v-checkbox
                    v-model="selectedStatisticsTypes"
                    :label="row.type"
                    :value="row.type"
                    density="compact"
                    hide-details
                    class="d-inline-flex"
                  ></v-checkbox>
                </td>
                <td v-for="header in statisticsMatrix.headers" :key="header" class="text-center">
                  <span 
                    v-if="header === '總計'" 
                    :class="selectedStatisticsTypes.includes(row.type) ? 'font-weight-bold text-blue-grey-darken-2' : 'text-grey'"
                  >
                    {{ row.counts.rowTotal }}
                  </span>
                  <span 
                    v-else 
                    :class="!selectedStatisticsTypes.includes(row.type) || !selectedStatisticsStatuses.includes(header) ? 'text-grey' : ''"
                  >
                    {{ row.counts[header] || 0 }}
                  </span>
                </td>
              </tr>
            </tbody>
            <tfoot class="bg-grey-lighten-3">
              <tr class="font-weight-bold">
                <td class="text-left">總計</td>
                <td v-for="header in statisticsMatrix.headers" :key="header" class="text-center">
                  <strong v-if="header === '總計'" class="text-deep-orange-darken-3">
                    {{ statisticsMatrix.totals.grandTotal }}
                  </strong>
                  <span 
                    v-else 
                    :class="!selectedStatisticsStatuses.includes(header) ? 'text-grey' : ''"
                  >
                    {{ statisticsMatrix.totals[header] || 0 }}
                  </span>
                </td>
              </tr>
            </tfoot>
          </v-table>
        </v-card-text>
      </v-card>
    </v-dialog>
    



     <v-dialog v-model="isCancelConfirmDialogVisible" max-width="500px" persistent>
      <v-card v-if="eventToCancel">
        <v-card-title class="text-h6 d-flex align-center bg-red-lighten-4" v-draggable-dialog>
          <v-icon start color="red-darken-2">mdi-alert-circle-outline</v-icon>
          <span>確認取消預約</span>
        </v-card-title>
        
        <v-divider></v-divider>

        <v-card-text class="py-4">
          <p class="mb-4">您確定要取消以下這筆預約紀錄嗎？</p>
          <v-list density="compact" class="bg-red-lighten-5 rounded">
            <v-list-item :title="`${eventToCancel.unitId} (${eventToCancel.bookerName})`" prepend-icon="mdi-home-account">
              <template v-slot:subtitle>
                <div class="font-weight-medium">{{ eventToCancel.bookingType }}</div>
              </template>
            </v-list-item>
            <v-list-item prepend-icon="mdi-calendar-clock-outline">
              <template v-slot:title><div>{{ safeFormatDate(eventToCancel.appointmentDate, 'yyyy-MM-dd') }}</div></template>
              <template v-slot:subtitle><div class="font-weight-medium">{{ eventToCancel.appointmentTimeSlot }}</div></template>
            </v-list-item>
          </v-list>
          <div class="text-red-darken-2 font-weight-bold mt-4">此操作無法復原！</div>
        </v-card-text>
        
        <v-divider></v-divider>
        <v-card-actions class="pa-3">
          <v-spacer></v-spacer>
          <v-btn variant="text" @click="isCancelConfirmDialogVisible = false">返回</v-btn>
          <v-btn color="red-darken-1" variant="flat" :loading="isCancelling" @click="handleConfirmCancelBooking">確定取消</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-navigation-drawer
  v-model="isFilterDrawerVisible"
  location="right"
  temporary
  width="300"
>
  <v-sheet class="d-flex flex-column h-100">
    <v-list-item
      title="篩選條件"
      subtitle="請選擇行事曆要顯示的項目"
      class="bg-grey-lighten-3"
    >
      <template v-slot:append>
        <v-btn
          variant="text"
          icon="mdi-close"
          @click="isFilterDrawerVisible = false"
        ></v-btn>
      </template>
    </v-list-item>
    <v-divider></v-divider>
    <div class="pa-4" style="overflow-y: auto">
      <div>
        <v-label class="mb-2">預約狀態</v-label>
        <v-checkbox v-model="selectedStatuses" label="預約中" value="預約中" density="compact" hide-details color="black"></v-checkbox>
        <v-checkbox v-model="selectedStatuses" label="取消" value="取消" density="compact" hide-details color="black"></v-checkbox>
        <v-checkbox v-model="selectedStatuses" label="已完成" value="已完成" density="compact" hide-details color="black"></v-checkbox>
      </div>
      <v-divider class="my-3"></v-divider>
      <div>
        <v-label class="mb-2">預約項目</v-label>
        <v-checkbox v-for="itemType in currentTypeOptions" :key="itemType" v-model="selectedTypes" :label="itemType" :value="itemType" density="compact" hide-details color="black"></v-checkbox>
      </div>
      <v-divider class="my-3"></v-divider>
      <div>
        <v-label class="mb-2">選擇方式</v-label>
        <v-checkbox v-for="method in currentMethodOptions" :key="method" v-model="selectedMethods" :label="method" :value="method" density="compact" hide-details color="black"></v-checkbox>
      </div>
      <v-divider class="my-3"></v-divider>
      <div>
        <v-label class="mb-2">預約記錄標籤</v-label>
        <v-checkbox v-for="field in displayFieldOptions" :key="field.key" v-model="selectedDisplayFields" :label="field.label" :value="field.key" density="compact" hide-details color="black"></v-checkbox>
      </div>
    </div>
    <v-spacer></v-spacer>
    <div class="pa-2 bg-grey-lighten-4">
      <v-btn color="primary" block @click="isFilterDrawerVisible = false"
        >完成</v-btn
      >
    </div>
  </v-sheet>
</v-navigation-drawer>
    
    <v-dialog v-model="isDuplicateDialogVisible" max-width="600px" persistent>
      <v-card v-if="duplicateInfo">
        <v-card-title class="text-h6 d-flex align-center bg-amber-lighten-4" v-draggable-dialog>          
          <v-icon start color="amber-darken-3">mdi-alert-outline</v-icon>
          <span>偵測到重複預約</span>
        </v-card-title>
        <v-divider></v-divider>
        <v-card-text class="py-4">
          <p class="mb-4">系統發現一筆與您即將新增的預約資料重複，資訊如下：</p>
          <v-list density="compact" class="bg-amber-lighten-5 rounded pa-2">
              <v-list-item v-if="duplicateInfo.unitId" prepend-icon="mdi-home-outline" title="戶別" :subtitle="duplicateInfo.unitId"></v-list-item>
              <v-list-item v-if="duplicateInfo.bookerName" prepend-icon="mdi-account-tie-outline" title="預約人姓名" :subtitle="duplicateInfo.bookerName"></v-list-item>
              <v-list-item v-if="duplicateInfo.bookerPhone" prepend-icon="mdi-phone-in-talk-outline" title="預約人電話" :subtitle="duplicateInfo.bookerPhone"></v-list-item>
              <v-list-item v-if="duplicateInfo.bookingType" prepend-icon="mdi-format-list-checks" title="預約項目" :subtitle="duplicateInfo.bookingType"></v-list-item>
              <v-list-item v-if="duplicateInfo.appointmentDate" prepend-icon="mdi-calendar" title="預約日期" :subtitle="safeFormatDate(duplicateInfo.appointmentDate)"></v-list-item>
              <v-list-item v-if="duplicateInfo.appointmentTimeSlot" prepend-icon="mdi-clock-outline" title="預約時段" :subtitle="duplicateInfo.appointmentTimeSlot"></v-list-item>
              <v-divider v-if="duplicateInfo.inspectionMethod || duplicateInfo.inspectionCompanyName || duplicateInfo.agentName" class="my-2"></v-divider>
              <v-list-item v-if="duplicateInfo.inspectionMethod" prepend-icon="mdi-account-hard-hat-outline" title="選擇方式" :subtitle="duplicateInfo.inspectionMethod"></v-list-item>
              <v-list-item v-if="duplicateInfo.inspectionCompanyName" prepend-icon="mdi-domain" title="代驗公司名稱" :subtitle="duplicateInfo.inspectionCompanyName"></v-list-item>
              <v-list-item v-if="duplicateInfo.agentName" prepend-icon="mdi-account-tie-outline" title="受託人姓名" :subtitle="duplicateInfo.agentName"></v-list-item>
              <v-list-item v-if="duplicateInfo.agentPhone" prepend-icon="mdi-phone-in-talk-outline" title="受託人電話" :subtitle="duplicateInfo.agentPhone"></v-list-item>
          </v-list>
          <p class="font-weight-bold mt-4">請問您要如何處理？</p>
        </v-card-text>
        <v-divider></v-divider>
        <v-card-actions class="pa-3 d-flex flex-wrap ga-2 justify-end">
          <v-btn variant="text" @click="isDuplicateDialogVisible = false">放棄新增</v-btn>
          <v-btn color="primary" variant="outlined" :loading="isSaving" @click="executeAddAppointment(null)">保留舊的並新增</v-btn>
          <v-btn color="red-darken-1" variant="flat" :loading="isSaving" @click="executeAddAppointment(duplicateInfo.bookingCode)">取消舊的並新增</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="isForceSaveDialogVisible" max-width="500px" persistent>
  <v-card>
    <v-card-title class="text-h6 d-flex align-center bg-amber-lighten-4">
      <v-icon start color="amber-darken-3">mdi-alert-outline</v-icon>
      <span>請確認操作</span>
    </v-card-title>
    <v-card-text class="pt-4">
      <p class="font-weight-bold text-error">{{ validationErrorReason }}</p>
      <p class="mt-2">您確定要忽略此提示並強制儲存這筆預約嗎？</p>
    </v-card-text>
    <v-card-actions>
      <v-spacer></v-spacer>
      <v-btn color="grey-darken-1" variant="text" @click="isForceSaveDialogVisible = false">返回修改</v-btn>
      <v-btn color="amber-darken-3" variant="flat" :loading="isSaving" @click="handleConfirmForceSave">強制儲存</v-btn>
    </v-card-actions>
  </v-card>
</v-dialog>
    
  
  <v-dialog v-model="isBatchMismatchDialogVisible" max-width="500px" persistent>
  <v-card>
    <v-card-title class="text-h6 d-flex align-center bg-orange-lighten-4">
      <v-icon start color="orange-darken-3">mdi-information-outline</v-icon>
      <span>請確認操作</span>
    </v-card-title>
    <v-card-text class="pt-4">
      <p class="font-weight-bold">{{ batchMismatchReason }}</p>
      <p class="mt-2">您確定要繼續新增這筆預約嗎？</p>
    </v-card-text>
    <v-card-actions>
      <v-spacer></v-spacer>
      <v-btn color="grey-darken-1" variant="text" @click="isBatchMismatchDialogVisible = false">取消</v-btn>
      <v-btn color="orange-darken-3" variant="flat" :loading="isSaving" @click="handleConfirmBatchMismatch">繼續新增</v-btn>
    </v-card-actions>
  </v-card>
</v-dialog>



  </v-container>

<teleport to="body">
  <v-bottom-navigation
    v-if="!isAnyOverlayActive"
    class="d-md-none"
    grow
    style="position: fixed; z-index: 2400; bottom: 1rem; left: 1rem; right: 1rem; width: auto; border-radius: 16px; box-shadow: 0 4px 12px rgba(0,0,0,0.15);"
  >
    <v-btn @click="handleRefresh" :loading="isLoading">
      <v-icon>mdi-refresh</v-icon>
      <span>重整</span>
    </v-btn>

    <v-btn @click="isFilterDrawerVisible = true">
      <v-icon>mdi-filter-variant</v-icon>
      <span>篩選</span>
    </v-btn>

    <v-btn v-if="canEdit" @click="isAdminAddDialogVisible = true"> <v-icon>mdi-calendar-plus</v-icon>
      <span>新增</span>
    </v-btn>

    <v-btn
      @click="isStatisticsDialogVisible = true"
      :disabled="statisticsMatrix.rows.length === 0"
    >
      <v-icon>mdi-chart-bar</v-icon>
      <span>統計</span>
    </v-btn>


    <v-menu location="top">
      <template v-slot:activator="{ props }">
        <v-btn v-bind="props" :loading="isDownloadingPdf || isDownloadingExcel">
          <v-icon>mdi-download</v-icon>
          <span>下載</span>
        </v-btn>
      </template>
      <v-list density="compact">
        <v-list-item
          prepend-icon="mdi-image-area"
          title="下載PNG"
          @click="handleDownloadPng"
          :disabled="isDownloadingPdf || isDownloadingExcel"
        >
          <template v-slot:append>
            <v-progress-circular v-if="isDownloadingPdf" indeterminate color="grey" size="20" width="2"></v-progress-circular>
          </template>
        </v-list-item>
        <v-list-item
          prepend-icon="mdi-microsoft-excel"
          title="下載Excel"
          @click="handleDownloadExcel"
          :disabled="isDownloadingPdf || isDownloadingExcel"
        >
          <template v-slot:append>
            <v-progress-circular v-if="isDownloadingExcel" indeterminate color="grey" size="20" width="2"></v-progress-circular>
          </template>
        </v-list-item>
      </v-list>
    </v-menu>
  </v-bottom-navigation>
</teleport>
</template>

<script setup>
import AppointmentDetailsDialog from '@/components/AppointmentDetailsDialog.vue';
import AdminAddBookingDialog from '@/components/AdminAddBookingDialog.vue';

import VueDatePicker from '@vuepic/vue-datepicker';
import '@vuepic/vue-datepicker/dist/main.css';


import { usePageContextStore } from '@/store/pageContextStore';
import { useProjectStore } from '@/store/projectStore'; 
import Shepherd from 'shepherd.js';
import 'shepherd.js/dist/css/shepherd.css';
import { ref, onMounted, computed, watch, reactive, onUnmounted ,nextTick} from 'vue';
import { useRoute, useRouter } from 'vue-router'; 
import { useUserStore } from '@/store/user';
import { watchDebounced, useStorage } from '@vueuse/core'; //
import { getAuth } from 'firebase/auth';

// ✅ 1. 引入新的 API 函數
import { 
  inspectionCalendarApiRouter, 
  listenToHouseholdsForCalendar // ✅ 引入監聽器
} from '@/api';
// ✅ 2. 引入 Cloud Function 相關工具
import { httpsCallable } from 'firebase/functions';
import { functions } from '@/firebase';


import { format, startOfWeek, endOfWeek, addDays, isToday, isSaturday, isSunday, eachDayOfInterval, parseISO } from 'date-fns';
import { zhTW } from 'date-fns/locale';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { useClipboard } from '@vueuse/core';
import * as XLSX from 'xlsx-js-style';
import { vDraggableDialog } from '@/directives/vDraggableDialog';
import { useSystemPresence } from '@/composables/useSystemPresence';



// --- Store 和路由 ---
const route = useRoute();
const router = useRouter(); // 驗屋預約管理 【新增】獲取 router 實例
const userStore = useUserStore();
const pageContextStore = usePageContextStore();
const projectStore = useProjectStore(); // 驗屋預約管理 2. 建立 store 實例
const projectId = ref(route.params.projectId);

const systemName = '驗屋預約管理';
useSystemPresence(projectId.value, systemName);

// --- 定義欄位應更新到哪個集合 ---
const APPOINTMENT_FIELDS = ['bookerName', 'bookerPhone', 'bookerIdNumber' ,'bookerEmail', 'appointmentDate', 'appointmentTimeSlot', 'inspectionMethod', 'inspectionCompanyName', 'inspectors', 'bookingRemarks', 'agentName', 'agentIdNumber', 'agentPhone', 'bookingType', 'status', 'checkInStatus', 'handoverTime', 'createdByName', 'lastModifiedByName'];
const HOUSEHOLD_FIELDS = ['address', 'parkingLots', 'buyerName', 'buyerPhone', 'buyerEmail', 'buyerIdNumber','appropriationDate', 'bank', 'bankContact', 'remarks', 'inspectionDocsUrl', 'inspectionReportUrl', 'initialInspectionBatch', 'reInspectionBatch'];

// [新增] 建立一個 Set 來集中管理所有可編輯的欄位，方便維護
const EDITABLE_FIELDS = new Set([
  
  'agentAddress',
  'agentIdNumber',
  'agentName',
  'agentPhone',
  'appointmentDate',
  'appointmentTimeSlot',
  'bookerEmail',
  'bookerName',
  'bookerPhone',
  'bookingType',
  'bookingRemarks',
  'inspectionCompanyName',
  'inspectionMethod',
  'principalAddress',
  'principalIdNumber',
  'principalName'
]);

// --- 響應式狀態 ---
// ✅【修改】取消註解 isLoading
const isLoading = ref(true);
const error = ref(null);
const projectSettings = ref(null); // [新增] 用於儲存專案的詳細設定

// 產生一個從 00:00 到 23:30，間隔 30 分鐘的完整時間列表
const allPossibleTimeSlots = Array.from({ length: 48 }, (_, i) => {
  const hour = Math.floor(i / 2).toString().padStart(2, '0');
  const minute = (i % 2 === 0) ? '00' : '30';
  return `${hour}:${minute}`;
});

// 2. 用於儲存使用者勾選的時間 (手動模式使用)
const selectedTimeSlots = useStorage(`inspection_calendar_time_slots_${projectId.value}`, [...allPossibleTimeSlots]);

// 2-1. 自動/手動時段模式切換 (預設自動)
const autoTimeSlotMode = useStorage(`inspection_calendar_auto_time_mode_${projectId.value}`, true);

// 2-2. 從實際預約資料中提取有資料的時段
const dataBasedTimeSlots = computed(() => {
  const timeSet = new Set();
  allAppointments.value.forEach(appt => {
    if (!appt.appointmentTimeSlot) return;
    const timeSlotStr = String(appt.appointmentTimeSlot);
    const timeMatch = timeSlotStr.match(/(\d{1,2}[:：]\d{2})/);
    if (timeMatch) {
      const normalizedTime = timeMatch[0].replace(/：/g, ':');
      // 直接使用實際預約時間，支援任意分鐘數（09:10, 09:15, 09:20 等）
      const [h, m] = normalizedTime.split(':').map(Number);
      timeSet.add(`${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`);
    }
  });
  return [...timeSet].sort();
});

// 3. 控制時間選擇器選單的開關
const timeSelectorMenu = ref({});

// 5. 時段篩選引導提示（僅首次顯示）
const hasSeenTimeSlotHint = useStorage(`inspection_calendar_seen_time_hint_${projectId.value}`, false);
const dismissTimeSlotHint = () => {
  hasSeenTimeSlotHint.value = true;
};

// 4. 全選/清空時間的輔助函式
function selectAllTimeSlots() {
  selectedTimeSlots.value = [...allPossibleTimeSlots];
}
function clearAllTimeSlots() {
  selectedTimeSlots.value = [];
}


// 驗屋預約管理 --- 分頁狀態管理 ---
const allAppointments = ref([]);
const allHouseholdData = ref(new Map());
const householdListenerUnsubscribe = ref(null);
const loadedWeeks = ref(new Set()); // 用來記錄哪些週的開始日期已經被載入

const isDialogVisible = ref(false);
const isAdminAddDialogVisible = ref(false); 
const selectedEvent = ref(null);
const calendarData = ref([]); // ★ 2. 新增 ref 來儲存日期標記
const bookingHistory = ref([]); // ★ 3. 新增 ref 來儲存歷史紀錄
const isDownloadingPdf = ref(false);
const isDownloadingExcel = ref(false);
const isFilterDialogVisible = ref(false);
const isStatisticsDialogVisible = ref(false); // ✅ 新增這一行
const selectedStatisticsTypes = ref([]); // 儲存 Dialog 中被勾選的項目 (e.g., ['初驗', '複驗'])
const selectedStatisticsStatuses = ref([]); // 儲存 Dialog 中被勾選的狀態 (e.g., ['預約中', '已完成'])

// 驗屋預約管理 --- 搜尋狀態管理 ---
const searchQuery = ref('');
const selectedSearchResult = ref(null);
const isSearchingBackend = ref(false); // 後端搜尋的讀取狀態
const backendSearchResults = ref([]); // 存放後端回傳的結果

// 新增：根據狀態回傳對應顏色的輔助函式
const getStatusColor = (status) => {
  if (status === '取消') return 'error';
  if (status === '已完成') return 'blue-grey';
  return 'success'; // 預約中
};

const autocompleteItems = computed(() => {
  return backendSearchResults.value.map(appt => ({
    // 修改：將需要的欄位直接傳給模板，而不是組合成一個長字串
    status: appt.status,
    unitId: appt.unitId,
    bookerName: appt.bookerName,
    bookingType: appt.bookingType,
    date: safeFormatDate(appt.appointmentDate, 'yyyy-MM-dd'),
    time: appt.appointmentTimeSlot,
    inspectionMethod: appt.inspectionMethod,
    inspectionCompanyName: appt.inspectionCompanyName,
    
    // value 保持不變
    value: appt 
  }));
});

const startDate = ref(startOfWeek(new Date(), { weekStartsOn: 1 }));
const endDate = ref(endOfWeek(new Date(), { weekStartsOn: 1 }));

const minSelectableDate = ref(null);
const maxSelectableDate = ref(null);
// 新增一個 ref 來管理日期區間，它會是一個包含兩個日期的陣列
const dateRange = ref([]);

const isCancelConfirmDialogVisible = ref(false);
const eventToCancel = ref(null);
const isFilterDrawerVisible = ref(false);
const snackbar = ref(false);
const snackbarText = ref('');
const panels = ref([]);
const addDateMenu = ref(false); 

// 修正：補上缺少的對話框狀態 ref
const isDuplicateDialogVisible = ref(false);
const isForceSaveDialogVisible = ref(false);
const isBatchMismatchDialogVisible = ref(false);
const validationErrorReason = ref(''); // ✅ 補上
const batchMismatchReason = ref(''); // ✅ 補上
const pendingSavePayload = ref(null); // ✅ 補上
const tempCancelBookingCode = ref(null); // ✅ 補上
const isSaving = ref(false); // ✅ 補上

const isSavingInspectors = ref(false); // 專門給驗屋人員選擇框用的讀取狀態
const editableInspectors = ref([]); // 狀態來處理 inspectors 的陣列格式
const isCancelling = ref(false);
const bookingOptions = ref({
  inspectionMethods: [],
  inspectionStaff: [],
  buildingsAndUnits: {}
});
const allBookingRules = ref(null);
const newAppointmentForm = ref(null);
const duplicateInfo = ref(null);

// ✅ 補上 newAppointmentData (AdminAddBookingDialog 會用到)
const newAppointmentData = reactive({
  building: null, unitId: null, bookingType: null,
  bookerName: '', bookerPhone: '', bookerEmail: '', bookerIdNumber: '', appointmentDate: null, appointmentTimeSlot: '',
  inspectionMethod: '', inspectionCompanyName: '', inspectors: [], bookingRemarks: '',
  agentName: '', agentPhone: '', address: '', parkingLots: '', buyerName: '',
  buyerPhone: '', buyerEmail: '', buyerIdNumber: '', appropriationDate: '', bank: '', bankContact: '', remarks: '',
  inspectionDocsUrl: '', inspectionReportUrl: '', initialInspectionBatch: '', reInspectionBatch: '',
  status: '預約中', checkInStatus: '', specialRemarks: '', specialRemarks2: '', handoverTime: null
});


const timeSlotOptions = ref([]);// 時段選項
const isTimeSlotLoading = ref(false);// 時段選項載入狀態
const isDateInBatch = ref(false);

const timeSlotRules = computed(() => {
    // 無論是否在批次內，都應檢查是否有輸入，並驗證格式
    return [
        v => !!v || '必須輸入時段', // 確保有值
        // [修改] 驗證規則應只允許 HH:mm 格式，因為後綴會在選擇時被移除
        v => /^([01]\d|2[0-3]):([0-5]\d)$/.test(v) || '格式必須為 HH:mm (例如 09:30)',
    ];
});

// --- 常數與計算屬性 ---
const PROJECT_TIME_SLOTS = {
  '富宇上城': ['09:00', '10:00', '11:00', '13:00', '14:00', '15:00', '16:00'],
  '富宇富御': ['09:30', '10:00', '11:00', '13:30', '14:00','14:30'],
  '富宇天玥': ['09:30', '10:00','14:00','14:30'],
  'default': ['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00']
};

const fieldConfig = {
  default: [
    { title: '基本資料', fields: [ { key: 'address', label: '門牌', icon: 'mdi-map-marker-outline' }, { key: 'parkingLots', label: '車位', icon: 'mdi-car-outline' }, { key: 'buyerName', label: '買方姓名', icon: 'mdi-account-star-outline' }, { key: 'buyerPhone', label: '買方電話', icon: 'mdi-phone-outline', copyable: true }, { key: 'buyerEmail', label: '買方EMAIL', icon: 'mdi-email-outline', copyable: true }, { key: 'buyerIdNumber', label: '買方身分證(驗證碼)', icon: 'mdi-card-account-details-outline' } ]},
    { title: '預約人資料', fields: [ { key: 'bookerName', label: '預約人姓名', icon: 'mdi-account-outline' }, { key: 'bookerPhone', label: '預約人電話', icon: 'mdi-cellphone', copyable: true }, { key: 'bookerEmail', label: '預約人EMAIL', icon: 'mdi-email-outline', copyable: true }, { key: 'bookerIdNumber', label: '預約人身分證(驗證碼)', icon: 'mdi-card-account-details-outline' } ]},
    { title: '預約詳情', fields: [ { key: 'bookingType', label: '預約項目', icon: 'mdi-format-list-checks', type: 'booking-item-select' }, { key: 'inspectionMethod', label: '選擇方式', icon: 'mdi-cog-outline' }, { key: 'appointmentDate', label: '預約日期與時段', icon: 'mdi-calendar-clock', type: 'booking-datetime-select' }, { key: 'inspectionCompanyName', label: '代驗公司', icon: 'mdi-domain' }, { key: 'agentName', label: '受託人姓名', icon: 'mdi-account-tie-outline' }, { key: 'agentPhone', label: '受託人電話', icon: 'mdi-phone-in-talk-outline', copyable: true }, { key: 'bookingRemarks', label: '預約備註', icon: 'mdi-note-text-outline' }, ]},
    { title: '相關文件與批次', fields: [ { key: 'appropriationDate', label: '撥款日期', icon: 'mdi-cash-check', type: 'date' }, { key: 'bank', label: '銀行', icon: 'mdi-bank-outline' }, { key: 'bankContact', label: '銀行窗口', icon: 'mdi-account-tie-outline' }, { key: 'inspectionDocsUrl', label: '驗屋文件', icon: 'mdi-file-document-outline', type: 'button', readOnly: true }, { key: 'inspectionReportUrl', label: '驗屋報告', icon: 'mdi-file-chart-outline', type: 'button', readOnly: true }, { key: 'remarks', label: '重要備註', icon: 'mdi-alert-circle-outline', type: 'remark' }, { key: 'initialInspectionBatch', label: '初驗批次', icon: 'mdi-numeric-1-box-multiple-outline' }, { key: 'reInspectionBatch', label: '複驗批次', icon: 'mdi-numeric-2-box-multiple-outline' }, ]}
  ]
};
// 動態顯示欄位選項：基礎欄位 + 從 bookingMenu 的 customFields (expanded: true) 動態掃描
const displayFieldOptions = computed(() => {
  const baseFields = [
    { key: 'unitId', label: '戶別' },
    { key: 'bookerName', label: '預約人姓名' },
    { key: 'bookingType', label: '預約項目' },
    { key: 'inspectionMethod', label: '選擇方式' },
    { key: 'bookingSubOption', label: '子項目' },
    { key: 'remarks', label: '重要備註' },
    { key: 'bookingRemarks', label: '預約備註' },
    { key: 'inspectors', label: '驗屋人員', formatter: (val) => val ? `【${val}】` : null },
  ];
  // 動態掃描 bookingMenu 中所有 methods 的 customFields，篩選 expanded === true
  const dynamicFields = [];
  const menu = projectSettings.value?.bookingMenu;
  if (Array.isArray(menu)) {
    const seenLabels = new Set(baseFields.map(f => f.label));
    for (const item of menu) {
      if (!Array.isArray(item.methods)) continue;
      for (const method of item.methods) {
        if (method.deleted) continue;
        if (!Array.isArray(method.customFields)) continue;
        for (const cf of method.customFields) {
          if (cf.expanded && cf.label && !seenLabels.has(cf.label)) {
            seenLabels.add(cf.label);
            // isDynamic 標記為動態欄位，取值時從 bookingMethodDetails[key] 讀取
            dynamicFields.push({ key: cf.id, label: cf.label, isDynamic: true });
          }
        }
      }
    }
  }
  // 將動態欄位插入到「選擇方式」之後
  const insertIndex = baseFields.findIndex(f => f.key === 'inspectionMethod') + 1;
  const result = [...baseFields];
  result.splice(insertIndex, 0, ...dynamicFields);
  return result;
});

// 從事件資料中取得欄位值的輔助函式
// 靜態欄位直接從 event[key] 讀取，動態欄位從 event.bookingMethodDetails[key] 讀取
function getFieldValue(eventData, fieldOption) {
  if (fieldOption.isDynamic) {
    return eventData.bookingMethodDetails?.[fieldOption.key] ?? null;
  }
  return eventData[fieldOption.key] ?? null;
}

const CSS_KEYWORD_COLOR_MAP = [ { keyword: '已撥款', backgroundColor: '#ffc107', color: '#212529' }, { keyword: '交屋', backgroundColor: '#ffc107', color: '#212529' }, { keyword: '初驗', backgroundColor: '#d4edda', color: '#155724' }, { keyword: '複驗', backgroundColor: '#f8d7da', color: '#721c24' }, ];
const EXCEL_KEYWORD_COLOR_MAP = [ { keyword: '已撥款', backgroundColor: 'ffc107', textColor: '212529' }, { keyword: '交屋', backgroundColor: 'ffc107', textColor: '212529' }, { keyword: '初驗', backgroundColor: 'd4edda', textColor: '155724' }, { keyword: '複驗', backgroundColor: 'f8d7da', textColor: '721c24' }, ];

const projectName = computed(() => projectStore.idToNameMap[projectId.value] || '讀取中...');

// 優化：使用 useStorage 記住使用者的標題顯示選項設定，key 加入 projectId 區分不同建案
const selectedDisplayFields = useStorage(
  `inspection_calendar_display_fields_${projectId.value}`, 
  []
);
// 當 displayFieldOptions 變化時，同步更新 selectedDisplayFields
// - 若快取為空：全選
// - 若已有快取：清除已不存在的 key，並自動加入所有新出現的欄位（含基礎欄位與動態欄位）
watch(displayFieldOptions, (newOptions) => {
  const validKeys = new Set(newOptions.map(f => f.key));
  if (selectedDisplayFields.value.length === 0 && newOptions.length > 0) {
    // 首次使用或快取為空，預設全選
    selectedDisplayFields.value = newOptions.map(f => f.key);
  } else if (newOptions.length > 0) {
    // 清除已不存在的舊 key
    const cleaned = selectedDisplayFields.value.filter(k => validKeys.has(k));
    // 找出新出現的欄位 key，自動加入（包含新增的 baseField 與 dynamicField）
    const existingKeys = new Set(selectedDisplayFields.value);
    const newKeys = newOptions
      .filter(f => !existingKeys.has(f.key))
      .map(f => f.key);
    selectedDisplayFields.value = [...cleaned, ...newKeys];
  }
}, { immediate: true });
const pageTitle = computed(() => `${projectName.value} - 預約時間表`);
const currentTypeOptions = computed(() => {
  // 從 bookingMenu 陣列取用 title 欄位，不論 deleted 是否為 true
  if (projectSettings.value && Array.isArray(projectSettings.value.bookingMenu) && projectSettings.value.bookingMenu.length > 0) {
    return projectSettings.value.bookingMenu.map(item => item.title).filter(Boolean);
  }
  return []; 
});
// 從 bookingMenu 取得所有選擇方式選項
const currentMethodOptions = computed(() => {
  const menu = projectSettings.value?.bookingMenu;
  if (!Array.isArray(menu)) return [];
  const methods = new Set();
  for (const item of menu) {
    if (!Array.isArray(item.methods)) continue;
    for (const m of item.methods) {
      if (m.title && !m.deleted) methods.add(m.title);
    }
  }
  return [...methods];
});
// 優化：使用 useStorage 記住使用者的篩選設定
const selectedTypes = useStorage(`inspection_calendar_selected_types_${projectId.value}`, []);
const selectedMethods = useStorage(`inspection_calendar_selected_methods_${projectId.value}`, []);
const selectedStatuses = useStorage(`inspection_calendar_selected_statuses_${projectId.value}`, ['預約中', '取消', '已完成']);
const canEdit = computed(() => userStore.hasProjectPermission('驗屋預約管理-修改', projectName.value));

const isAnyOverlayActive = computed(() => {
  return isDialogVisible.value || 
         isAdminAddDialogVisible.value || 
         isCancelConfirmDialogVisible.value || 
         isDuplicateDialogVisible.value || 
         isForceSaveDialogVisible.value || 
         isBatchMismatchDialogVisible.value ||
         isFilterDrawerVisible.value;
});

const buildingOptions = computed(() => Object.keys(bookingOptions.value.buildingsAndUnits).sort((a, b) => a.localeCompare(b, 'zh-Hant', { numeric: true })));
const unitOptions = computed(() => newAppointmentData.building ? (bookingOptions.value.buildingsAndUnits[newAppointmentData.building] || []) : []);
const timeSlots = computed(() => {
  if (autoTimeSlotMode.value) {
    // 自動模式：顯示有預約資料的時段，若無資料則回退顯示預設工作時段
    if (dataBasedTimeSlots.value.length > 0) {
      return dataBasedTimeSlots.value;
    }
    // 無資料時顯示預設工作時段 08:00 ~ 18:00
    return allPossibleTimeSlots.filter(t => t >= '08:00' && t <= '18:00');
  }
  // 手動模式：使用者自選
  return [...selectedTimeSlots.value].sort();
});

// ✅ 4. 新增輔助函數：用於將後端傳來的 (Timestamp / ISO String) 轉為 (Date / null)
const convertFirestoreTimestampsToDates = (obj) => {
  if (!obj) return obj;
  const newObj = { ...obj };
  
  // 定義所有可能的日期欄位 (包含 appointments 和 households)
  const dateFields = [
    // appointments
    'appointmentDate', 'createdAt', 'updatedAt', 'cancelledAt',
    'handoverTime', 'uploadReportTime',
    // households
    'appropriationDate', 'initialInspectionDate', 'reInspectionDate',
    'statusDate'
  ];

  for (const field of dateFields) {
    const value = newObj[field];
    if (!value) continue;

    if (typeof value.toDate === 'function') {
      // 情況 1: 這是個 Firestore Timestamp (來自監聽器)
      newObj[field] = value.toDate();
    } else if (typeof value === 'string') {
      // 情況 2: 這是個 ISO String (來自 API)
      const date = new Date(value);
      if (!isNaN(date.getTime())) {
        newObj[field] = date;
      }
    } else if (typeof value === 'object' && value !== null && value._seconds !== undefined && value._nanoseconds !== undefined) {
      // 情況 3: 這是個序列化的 Timestamp (來自 onCall 回傳)
      const date = new Date(value._seconds * 1000);
      if (!isNaN(date.getTime())) {
        newObj[field] = date;
      }
    }
  }
  return newObj;
};

// ✅ 新增：用於 Dialog 標題的日期區間格式化
const formattedDateRangeTitle = computed(() => {
  // 優先使用 dateRange (篩選器) 的值
  if (dateRange.value && dateRange.value.length === 2 && dateRange.value[0] && dateRange.value[1]) {
    const start = format(dateRange.value[0], 'MM/dd');
    const end = format(dateRange.value[1], 'MM/dd');
    return `${start} - ${end}`;
  }
  // 如果篩選器為空，則使用總表的起訖日期作為備案
  if (minSelectableDate.value && maxSelectableDate.value) {
    const start = format(new Date(minSelectableDate.value), 'MM/dd');
    const end = format(new Date(maxSelectableDate.value), 'MM/dd');
    return `${start} - ${end}`;
  }
  return '日期區間'; // 最終備案
});

// ✅ 5. 修改 processAppointments，現在它負責合併資料
function processAppointments(rawAppointments) {
  if (!Array.isArray(rawAppointments)) return [];

  return rawAppointments.map(appt => {
      // ✅ 1. 從快取 Map 中獲取戶別資料
      const householdKey = `${appt.projectId}_${appt.unitId}`;
      const householdData = allHouseholdData.value.get(householdKey) || {};

      // ✅ 2. 合併資料 (appt 在後，確保 appt.id 優先)
      const combinedData = { ...householdData, ...appt, id: appt.id };
      
      try {
        if (!combinedData.appointmentDate) return null;
        
        // ✅ 3. 確保 appointmentDate 是 Date 物件 (因為它可能來自 appt 或 householdData)
        const date = (combinedData.appointmentDate instanceof Date) 
          ? combinedData.appointmentDate 
          : new Date(combinedData.appointmentDate);

        if (isNaN(date.getTime())) return null;

        const dateStr = format(date, 'yyyy-MM-dd');
        
        const timeSlotString = combinedData.appointmentTimeSlot ? String(combinedData.appointmentTimeSlot) : '';
        const timeMatch = timeSlotString.match(/(\d{1,2}[:：]\d{2})/); 
        const startTime = timeMatch ? timeMatch[0].replace(/：/g, ':') : '00:00';
        
        const displayParts = displayFieldOptions.value
          .filter(option => selectedDisplayFields.value.includes(option.key))
          .map(option => {
            const value = getFieldValue(combinedData, option); // ✅ 使用輔助函式取值（支援動態欄位）
            if (value === null || value === undefined) return null; // 修正：允許 0
            
            // ✅ 修正：確保日期被正確格式化
            if (value instanceof Date) {
               const formattedDate = safeFormatDate(value, 'yyyy-MM-dd'); // 使用 safeFormatDate
               return { text: formattedDate, isHousehold: option.key === 'unitId' };
            }

            const formattedValue = option.formatter ? option.formatter(value) : String(value);
            return { text: formattedValue, isHousehold: option.key === 'unitId' };
          }).filter(Boolean);
        
        const finalStartObject = parseISO(`${dateStr}T${startTime}`);

        if (isNaN(finalStartObject.getTime())) {
          console.warn('產生無效的日期物件，已略過此筆預約:', combinedData);
          return null;
        }
        
        return { ...combinedData, start: finalStartObject, displayParts };

      } catch (e) {
        console.warn(`處理預約資料時發生錯誤: ${e.message}`, combinedData);
        return null;
      }
    }).filter(Boolean);
}



// ✅ 6. 修改 filteredAppointments Computed 屬性
const filteredAppointments = computed(() => {
  // 1. 先過濾 appointments
  const filteredAppts = allAppointments.value.filter(appt => {
    const statusMatch = selectedStatuses.value.includes(appt.status);
    const typeMatch = selectedTypes.value.includes(appt.bookingType);
    const methodMatch = selectedMethods.value.length === 0 || selectedMethods.value.includes(appt.inspectionMethod);
    return statusMatch && typeMatch && methodMatch;
  });

  // 2. 合併戶別資料並處理顯示
  return processAppointments(filteredAppts);
});


const dateChunks = computed(() => {
  // ( ... 保持不變 ...)
  if (!startDate.value || !endDate.value) return [];
  const chunks = [];
  let current = startOfWeek(new Date(startDate.value), { weekStartsOn: 1 });
  while (current <= endDate.value) {
    const chunk = [];
    for (let i = 0; i < 7; i++) {
      const date = addDays(current, i);
      const isInRange = date >= startDate.value && date <= endDate.value;
      chunk.push({
        dateObj: date,
        dayName: format(date, 'EEEE', { locale: zhTW }),
        date: format(date, 'M/d'),
        fullDate: format(date, 'yyyy-MM-dd'),
        isInRange: isInRange,
        isToday: isToday(date),
        isWeekend: isSaturday(date) || isSunday(date)
      });
    }
    chunks.push(chunk);
    current = addDays(current, 7);
  }
  return chunks;
});



const groupedEvents = computed(() => {
  // ( ... 保持不變 ...)
  const grouped = {};
  filteredAppointments.value.forEach(event => {
    if (!event.start) return;
    const dateKey = format(event.start, 'yyyy-MM-dd');
    const eventStartTime = format(event.start, 'HH:mm');
    // 精確匹配時段，如果不存在則使用第一個時段
    const timeKey = timeSlots.value.find(slot => slot === eventStartTime) || timeSlots.value[0];
    if (!grouped[dateKey]) grouped[dateKey] = {};
    if (!grouped[dateKey][timeKey]) grouped[dateKey][timeKey] = [];
    grouped[dateKey][timeKey].push(event);
});
  return grouped;
});

// ✅ 7. 修改 inspectionApi 函數定義
const inspectionApi = (action, data) => {
  const callable = httpsCallable(functions, 'inspectionCalendarApi');
  return callable({ action, data });
};

// ✅ START: 替換 statisticsMatrix computed 屬性
const statisticsMatrix = computed(() => {
  // 1. 取得已經被日期、狀態、項目過濾後的預約資料
  const appointments = filteredAppointments.value;

  // 2. 取得使用者當前勾選的欄(狀態)和列(項目)
  const colHeaders = [...selectedStatuses.value].sort();
  const rowHeaders = [...selectedTypes.value].sort();

  // 3. 初始化資料結構 (儲存所有儲存格的數字)
  const matrix = {};
  rowHeaders.forEach(type => {
    matrix[type] = { rowTotal: 0 }; // ✅ 每個項目(列)的總計
    colHeaders.forEach(status => {
      matrix[type][status] = 0;
    });
  });

  // 4. 初始化底部總計 (將被選擇性計算)
  const colTotals = {};
  colHeaders.forEach(status => {
    colTotals[status] = 0; // ✅ 每個狀態(欄)的總計
  });
  let grandTotal = 0; // ✅ 總計

  // 5. 遍歷已過濾的預約並計數
  for (const appt of appointments) {
    const type = appt.bookingType;
    const status = appt.status;

    // 5a. 【儲存格計數】：無論是否勾選，都要計算儲存格內的數字
    if (matrix[type] && matrix[type].hasOwnProperty(status)) {
      matrix[type][status]++;
    }

    // 5b. 【"總計" (欄) 計數】：只計算 Dialog 中被勾選的「狀態」
    if (selectedStatisticsStatuses.value.includes(status) && 
        matrix[type] && matrix[type].hasOwnProperty(status))
    {
      matrix[type].rowTotal++;
    }
    
    // 5c. 【"總計" (列) 計數】：只計算 Dialog 中被勾選的「項目」
    if (selectedStatisticsTypes.value.includes(type) &&
        matrix[type] && matrix[type].hasOwnProperty(status)) 
    {
      colTotals[status]++;
    }
    
    // 5d. 【右下角總計 計數】：只計算「項目」和「狀態」都被勾選的
    if (selectedStatisticsTypes.value.includes(type) &&
        selectedStatisticsStatuses.value.includes(status) &&
        matrix[type] && matrix[type].hasOwnProperty(status))
    {
      grandTotal++;
    }
  }

  // 6. 格式化為 v-table 需要的陣列
  const finalRows = rowHeaders.map(type => ({
    type: type,
    counts: matrix[type], // e.g., { '預約中': 10, '已完成': 5, 'rowTotal': 15 }
  }));

  const finalTotals = {
    ...colTotals,
    grandTotal: grandTotal,
  };

  // 7. 組合最終表頭 (加上"總計"欄)
  const finalColHeaders = colHeaders.length > 0 ? [...colHeaders, '總計'] : [];

  return {
    headers: finalColHeaders, // e.g., ['預約中', '已完成', '總計']
    rows: finalRows,          // e.g., [{ type: '初驗', counts: {...} }, ...]
    totals: finalTotals,      // e.g., { '預約中': 15, 'grandTotal': 30 }
  };
});
// ✅ END: 替換 statisticsMatrix

// ✅ 8. 修改 fetchData 函數
async function fetchData() {
  if (allHouseholdData.value.size === 0) {
    console.warn("fetchData: 戶別快取為空，暫停獲取預約。");
    // isLoading.value = false; // 讓 isLoading 保持 true，直到戶別資料載入
    return;
  }
  
  isLoading.value = true;
  error.value = null;
  try {
    // 1. 【優化】只向後端請求 appointments
    const result = await inspectionApi('fetchCalendarData', {
      projectId: projectId.value,
      startDate: startDate.value,
      endDate: endDate.value
    });

    if (result.data) {
        // 2. 將後端回傳的 ISO 字串轉回 Date 物件
        const appointmentsWithDates = result.data.map(appt => 
          convertFirestoreTimestampsToDates(appt) // ✅ 使用新的輔助函數
        );

        // 3. 【修改】合併邏輯
        const appointmentsMap = new Map(allAppointments.value.map(item => [item.id, item]));
        appointmentsWithDates.forEach(item => appointmentsMap.set(item.id, item));
        allAppointments.value = Array.from(appointmentsMap.values());
        
        console.log(`[fetchData] 成功獲取 ${appointmentsWithDates.length} 筆預約。`);

    } else {
        allAppointments.value = [];
    }

  } catch (err) {
    console.error('獲取行事曆資料失敗:', err);
    error.value = err.message;
  } finally {
    isLoading.value = false;
  }
}

// (loadAppointmentsForDateRange 函數保持不變)
async function loadAppointmentsForDateRange(start, end) {
  // ... (此函數似乎未被使用，但保持原樣)
}

function navigateToRuleManager() {
  router.push({ 
    name: 'BookingRuleManager', 
    params: { projectId: projectId.value } 
  });
}

function showSnackbar(text, color = 'success') {
  snackbarText.value = text;
  snackbar.value = true; 
}

// ✅ 9. 修改 handleSaveChangesFromDialog
async function handleSaveChangesFromDialog(payload) {
  try {
    const { appointmentId, bookingPayload, householdPayload } = payload;
    
    if (Object.keys(bookingPayload).length > 0 || Object.keys(householdPayload).length > 0) {
        bookingPayload.lastModifiedByName = userStore.user?.name || '未知使用者';
    }

    // ✅ 呼叫 inspectionApi
    const response = await inspectionApi('updateAppointment', {
        appointmentId,
        bookingPayload,
        householdDocId: payload.householdDocId,
        householdPayload,
        force: payload.force || false
    });

    if (response.data.status === 'no_changes') {
        showSnackbar('沒有偵測到任何變更。', 'info');
    } else {
        showSnackbar('儲存成功！', 'success');
        // ✅ 保持 fetchData()，它會獲取最新的 appointments
        // 監聽器會自動處理 households 的更新
        await fetchData(); 
    }
  } catch (err) {
      showSnackbar(`儲存失敗: ${err.message}`, 'error');
  } finally {
      isDialogVisible.value = false;
  }
}

// ✅ 10. 修改 handleUpdateInspectorsFromDialog
async function handleUpdateInspectorsFromDialog(payload) {
    const { appointmentId, inspectors } = payload;
    try {
        // ✅ 呼叫 inspectionApi
        await inspectionApi('updateAppointmentInspectors', { appointmentId, inspectors });

        // (前端更新邏輯保持不變)
        const index = allAppointments.value.findIndex(appt => appt.id === appointmentId);
        if (index !== -1) {
            const tempUpdatedAppointment = {
                ...allAppointments.value[index],
                inspectors: inspectors.join(',')
            };
            const fullyProcessedAppointment = processAppointments([tempUpdatedAppointment])[0];
            allAppointments.value[index] = fullyProcessedAppointment;
        }
        if (selectedEvent.value && selectedEvent.value.id === appointmentId) {
            selectedEvent.value.inspectors = inspectors.join(',');
        }
        showSnackbar('驗屋人員已更新', 'success');
    } catch (err) {
        showSnackbar(`更新驗屋人員失敗: ${err.message}`, 'error');
    }
}

// (handleCustomEventClick 函數保持不變)
function handleCustomEventClick(event) {
  selectedEvent.value = event;
  calendarData.value = []; 
  
  bookingHistory.value = allAppointments.value
    .filter(appt => appt.unitId === event.unitId)
    .sort((a, b) => b.start - a.start);

  isDialogVisible.value = true;
}

// ✅ 11. 修改 handleRequestCalendarData
async function handleRequestCalendarData(payload) {
  const { unitId } = payload;
  if (!projectId.value || !unitId) {
    showSnackbar('缺少專案或戶別資訊，無法載入行事曆標記', 'error');
    return;
  }
  try {
    // ✅ 呼叫 inspectionApi
    const result = await inspectionApi('getAdminBookingCalendarData', {
      projectId: projectId.value,
      unitId: unitId 
    });
    
    if (result.data.status === 'success') {
      calendarData.value = result.data.data;
    } else {
      throw new Error(result.data.message);
    }
  } catch (err) {
    console.error('獲取行事曆標記失敗:', err);
    showSnackbar(`讀取行事曆標記失敗: ${err.message}`, 'error');
  }
}

function resetNewAppointmentForm() {
    Object.assign(newAppointmentData, {
        building: null, unitId: null, bookingType: null,
        bookerName: '', bookerPhone: '', bookerEmail: '', bookerIdNumber: '', appointmentDate: null, appointmentTimeSlot: '',
        inspectionMethod: '', inspectionCompanyName: '', inspectors: [], bookingRemarks: '',
        agentName: '', agentPhone: '', address: '', parkingLots: '', buyerName: '',
        buyerPhone: '', buyerEmail: '', buyerIdNumber: '', appropriationDate: '', bank: '', bankContact: '', remarks: '',
        inspectionDocsUrl: '', inspectionReportUrl: '', initialInspectionBatch: '', reInspectionBatch: '',
        status: '預約中', checkInStatus: '', specialRemarks: '', specialRemarks2: '', handoverTime: null
    });
}

// (loadDataForProject 函數保持不變)
async function loadDataForProject() {
  isLoading.value = true;
  error.value = null;
  try {
    // 重新整理時，我們也需要重新獲取所有資料，以確保一致性
    const [calendarData, optionsData, rulesData, allHouseholds] = await Promise.all([
      fetchCalendarData(projectId.value, startDate.value, endDate.value),
      fetchBookingOptions(projectId.value),
      getAllBookingRules(projectId.value),
      fetchAllHouseholdsForProject(projectId.value)
    ]);
    
    // 將重新獲取的資料賦值給對應的 ref
    allAppointments.value = calendarData;
    bookingOptions.value = optionsData;
    allBookingRules.value = rulesData.status === 'success' ? rulesData.data : null;
    allHouseholdData.value = allHouseholds.reduce((acc, curr) => {
        const householdId = `${curr.projectId}_${curr.unitId}`;
        acc[householdId] = { id: householdId, ...curr };
        return acc;
    }, {});

  } catch (err) {
    console.error('重新整理資料失敗:', err);
    error.value = err.message;
    showSnackbar(`重新整理資料失敗: ${err.message}`, 'error');
  } finally {
    isLoading.value = false;
  }
}

/* 移除舊版 userStore 偏好設定同步邏輯，改用 useStorage */

// 監聽 Dialog 開啟，開啟時預設勾選所有當前篩選的項目
watch(isStatisticsDialogVisible, (newValue) => {
  if (newValue) {
    // 項目 (Types) 邏輯保持不變：預設勾選所有當前篩選的項目
    selectedStatisticsTypes.value = [...selectedTypes.value];
    
    // ✅ 修正點：預設勾選的「狀態」，應排除 "取消"
    // 1. 取得主篩選器的所有狀態 (e.g., ['預約中', '已完成', '取消'])
    const allFilteredStatuses = [...selectedStatuses.value];
    
    // 2. 篩選掉 "取消"
    selectedStatisticsStatuses.value = allFilteredStatuses.filter(status => status !== '取消');
  }
});

// "全選" 勾選框的計算屬性 (項目)
const selectAllStatisticsTypes = computed({
  // ... (此段代碼 保持不變)
  get() {
    const allAvailableTypes = statisticsMatrix.value.rows.map(r => r.type);
    if (allAvailableTypes.length === 0) return false;
    return allAvailableTypes.every(type => selectedStatisticsTypes.value.includes(type));
  },
  set(value) {
    const allAvailableTypes = statisticsMatrix.value.rows.map(r => r.type);
    if (value) {
      selectedStatisticsTypes.value = [...allAvailableTypes];
    } else {
      selectedStatisticsTypes.value = [];
    }
  }
});

// ✅ START: 新增「狀態」的 "全選" 勾選框計算屬性
const selectAllStatisticsStatuses = computed({
  get() {
    // 取得所有可見的狀態 (不包含 '總計')
    const allAvailableStatuses = statisticsMatrix.value.headers.filter(h => h !== '總計');
    if (allAvailableStatuses.length === 0) return false;
    // 檢查是否所有可見狀態都已被勾選
    return allAvailableStatuses.every(status => selectedStatisticsStatuses.value.includes(status));
  },
  set(value) {
    const allAvailableStatuses = statisticsMatrix.value.headers.filter(h => h !== '總計');
    if (value) {
      // 勾選所有
      selectedStatisticsStatuses.value = [...allAvailableStatuses];
    } else {
      // 全部取消
      selectedStatisticsStatuses.value = [];
    }
  }
});

// 監聽搜尋框輸入，觸發後端搜尋
watchDebounced(searchQuery, async (newQuery) => {
  // 1. 清除舊的搜尋結果
  backendSearchResults.value = [];

  // 2. 檢查輸入長度
  if (!newQuery || newQuery.length < 2) {
    isSearchingBackend.value = false;
    return; // 如果查詢太短或被清空，停止
  }
  
  // 3. 設定讀取狀態
  isSearchingBackend.value = true;

  try {
      // 4. 呼叫 API (使用 inspectionApi 路由)
      const result = await inspectionApi('searchAppointmentsAndHouseholds', { 
          projectId: projectId.value, 
          keyword: newQuery 
      });

      // 5. 處理成功回傳
      if (result.data.status === 'success') {
          // 6. 將後端回傳的 ISO 日期字串轉回 Date 物件
          backendSearchResults.value = result.data.data.map(appt => ({
              ...appt,
              // 主要轉換 appointmentDate 供顯示使用
              appointmentDate: appt.appointmentDate ? new Date(appt.appointmentDate) : null,
              // 也轉換其他日期欄位以保持資料一致性
              createdAt: appt.createdAt ? new Date(appt.createdAt) : null,
              cancelledAt: appt.cancelledAt ? new Date(appt.cancelledAt) : null
          }));
      } else {
          // 7. 處理後端回報的錯誤
          console.error("後端搜尋失敗:", result.data.message);
          backendSearchResults.value = [];
          showSnackbar(`搜尋失敗: ${result.data.message}`, 'error');
      }
  } catch (err) {
      // 8. 處理 API 呼叫的例外錯誤
      console.error("執行搜尋時發生例外:", err);
      backendSearchResults.value = [];
      showSnackbar(`搜尋時發生錯誤: ${err.message}`, 'error');
  } finally {
      // 9. 結束讀取狀態
      isSearchingBackend.value = false;
  }
}, { debounce: 500 } // 延遲 500ms 觸發
);

/* 移除舊版 watchDebounced 同步 backend 的邏輯，因為已經由 useStorage 管理自動寫入 localStorage */


// (watch dateRange 函數保持不變)
watch(dateRange, (newRange) => {
  if (newRange && newRange.length === 2 && newRange[0] && newRange[1]) {
    startDate.value = newRange[0];
    endDate.value = newRange[1];
  }
});

// (watch [startDate, endDate] 函數保持不變)
watch([startDate, endDate], async ([newStart, newEnd], [oldStart, oldEnd]) => {
  const hasChanged = !oldStart || !oldEnd || newStart.getTime() !== oldStart.getTime() || newEnd.getTime() !== oldEnd.getTime();
  if (newStart && newEnd && hasChanged) {
    loadedWeeks.value.clear();
    await fetchData();
  }
});

function handleSearchResultSelection(selectedItem) { 
  if (!selectedItem) return;
  // ✅ [修改] 變數改名，更清晰
  const selectedAppointmentFromSearch = selectedItem.value; 

  if (!selectedAppointmentFromSearch || !selectedAppointmentFromSearch.appointmentDate) {
    showSnackbar('此筆搜尋結果無有效日期，無法跳轉。', 'warning');
    return;
  }
  
  // ✅ [修改] 確保日期是 Date 物件
  const targetDate = (selectedAppointmentFromSearch.appointmentDate instanceof Date)
    ? selectedAppointmentFromSearch.appointmentDate
    : new Date(selectedAppointmentFromSearch.appointmentDate);

  if (isNaN(targetDate.getTime())) {
    showSnackbar('此筆搜尋結果的日期格式錯誤，無法跳轉。', 'error');
    return;
  }
  
  const newStartDate = startOfWeek(targetDate, { weekStartsOn: 1 });
  const newEndDate = endOfWeek(targetDate, { weekStartsOn: 1 });

  startDate.value = newStartDate;
  endDate.value = newEndDate;

  nextTick(() => {
    // ✅✅✅ 【BUG 修正點】 ✅✅✅
    // 1. 從前端的戶別快取中，撈出完整的 household 資料
    const householdKey = `${selectedAppointmentFromSearch.projectId}_${selectedAppointmentFromSearch.unitId}`;
    const householdData = allHouseholdData.value.get(householdKey) || {};

    // 2. 手動將 "戶別資料" 和 "搜尋到的預約資料" 合併
    //    (householdData 在前, selectedAppointmentFromSearch 在後, 確保預約資料(如id)優先)
    const fullyCombinedAppointment = { 
      ...householdData, 
      ...selectedAppointmentFromSearch 
    };
    
    // 3. 傳入 "完整合併" 後的物件
    handleCustomEventClick(fullyCombinedAppointment);
    // ✅✅✅ 【修正結束】 ✅✅✅

    // 清空搜尋框
    selectedSearchResult.value = null;
    searchQuery.value = '';
    backendSearchResults.value = [];
  });
}

// ✅ 14. 修改 handleBookingSuccess
async function handleBookingSuccess() { // ✅ 設為 async
  snackbarText.value = '新增預約成功！';
  snackbar.value = true;
  // ✅ 等待 fetchData() 完成
  await fetchData(); 
}

// (watch currentTypeOptions 函數保持不變)
watch(currentTypeOptions, (newOptions) => {
  selectedTypes.value = [...newOptions];
});
watch(currentMethodOptions, (newOptions) => {
  if (selectedMethods.value.length === 0 && newOptions.length > 0) {
    selectedMethods.value = [...newOptions];
  }
});

// (handleSaveNewAppointment, handleConfirmBatchMismatch, proceedWithSaveChecks, handleConfirmForceSave 函數保持不變)
// ...
async function handleSaveNewAppointment() {
    // ...
}
function handleConfirmBatchMismatch() {
    // ...
}
function proceedWithSaveChecks(cancelBookingCode = null) {
    // ...
}
function handleConfirmForceSave() {
    // ...
}

// ✅ 15. 修改 executeAddAppointment
async function executeAddAppointment(cancelBookingCode = null, force = false) {
    isSaving.value = true;
    try {
        const payload = { ...newAppointmentData };
        if (Array.isArray(payload.inspectors)) payload.inspectors = payload.inspectors.join(',');
        const userName = userStore.user?.name || '未知使用者';
        payload.createdByName = userName;
        payload.lastModifiedByName = userName;

        // ✅ 呼叫 inspectionApi
        await inspectionApi('addAppointmentAdmin', {
            projectId: projectId.value,
            newBookingData: payload,
            cancelBookingCode: cancelBookingCode,
            force: force
        });
        
        snackbarText.value = '新增預約成功！';
        snackbar.value = true;
        // isAddDialogVisible.value = false; // <-- 這個變數在您提供的檔案中不存在
        isAdminAddDialogVisible.value = false; // <-- 應該是這個
        isDuplicateDialogVisible.value = false;
        isForceSaveDialogVisible.value = false; 
        await fetchData();

    } catch (err) {
        if (err.message.includes('VALIDATION_FAILED:') || err.message.includes('SLOT_FULL:')) {
            validationErrorReason.value = err.message.split(': ')[1]; 
            tempCancelBookingCode.value = cancelBookingCode; 
            isForceSaveDialogVisible.value = true; 
        } else {
            error.value = `儲存失敗: ${err.message}`;
            alert(`儲存失敗: ${err.message}`);
        }
    } finally {
        isSaving.value = false;
    }
}

// (promptCancelBooking 函數保持不變)
function promptCancelBooking(event) { 
  eventToCancel.value = event; 
  isCancelConfirmDialogVisible.value = true; 
}

// ✅ 16. 修改 handleConfirmCancelBooking
async function handleConfirmCancelBooking() {
    isCancelling.value = true;
    try {
        const { id, projectId, unitId, bookingType } = eventToCancel.value;
        // ✅ 呼叫 inspectionApi
        await inspectionApi('cancelAppointment', {
            appointmentId: id,
            projectId,
            unitId,
            bookingType
        });
        
        snackbarText.value = '預約已成功取消！';
        snackbar.value = true;
        isCancelConfirmDialogVisible.value = false;
        await fetchData();
    } catch (err) {
        alert(`取消預約失敗: ${err.message}`);
    } finally {
        isCancelling.value = false;
    }
}

// ✅ 17. 修改 onMounted
onMounted(async () => {
  pageContextStore.$patch({
    title: '驗屋預約管理',
    path: route.path,
  });
  
  // ✅ [新增] 強制從後端讀取最新的使用者偏好設定 (確保重整頁面也能拿到最新時段)
  if (userStore.isLoggedIn) {
    console.log('正在重新同步使用者偏好設定...');
    await userStore.loadUserPreferencesFromDatabase();
  }

  isLoading.value = true;
  error.value = null;

  try {
    if (!userStore.isLoggedIn) {
      router.push({ name: 'Login' });
      return;
    }
    
    // 1. 獲取靜態設定 (不包含 households)
    // ✅ 呼叫 inspectionApi
    const [projectConfig, dateRangeData] = await Promise.all([
      inspectionApi('getProjectConfig', { projectId: projectId.value }).then(res => res.data),
      inspectionApi('getAppointmentDateRange', { projectId: projectId.value }).then(res => res.data.data),
      
      // ✅✅✅ 【修改點】✅✅✅
      // 將 'fetchProjectData' 改為您在 BookingPage 中使用的 'fetchProjectStaticData'
      projectStore.fetchProjectStaticData(projectId.value, inspectionApi) 
      // ✅✅✅ 【修改點結束】✅✅✅
    ]);

    // 2. 儲存靜態資料
    projectSettings.value = projectConfig;
    minSelectableDate.value = dateRangeData.minDate;
    maxSelectableDate.value = dateRangeData.maxDate; // ✅ 修正了這裡的變數名稱
    dateRange.value = [startDate.value, endDate.value]; 
    
    // ✅ 3. 啟動戶別資料的即時監聽
    if (householdListenerUnsubscribe.value) {
      householdListenerUnsubscribe.value(); // 先停止舊的監聽
    }
    householdListenerUnsubscribe.value = listenToHouseholdsForCalendar(
      projectId.value,
      (householdsArray) => { // ✅ 監聽器回傳的是陣列
        const newHouseholds = new Map();
        householdsArray.forEach(docData => { // ✅ 您的 API 回傳的是已 .data() 的陣列
          // ✅ 修正：使用 docData.id (來自您的 api.js) 而不是 _docId
          const key = `${docData.projectId}_${docData.unitId}`;
          newHouseholds.set(key, convertFirestoreTimestampsToDates(docData)); // ✅ 轉換日期
        });
        allHouseholdData.value = newHouseholds;
        console.log(`[REALTIME] Households cache updated with ${newHouseholds.size} items.`);

        // ✅ 首次載入時，觸發 fetchData
        if (isLoading.value) {
          fetchData(); // fetchData 會處理 isLoading.value = false
        }
      },
      (err) => {
        error.value = `監聽戶別資料失敗: ${err.message}`;
        isLoading.value = false; // 監聽失敗也應停止 loading
      }
    );

    // 4. (fetchData 已被移到監聽器回呼中)

  } catch (err) {
    console.error('初始化頁面失敗:', err);
    error.value = `無法載入預約資料：${err.message}`;
    isLoading.value = false; // 確保出錯時停止 loading
  } 
});


// ✅ 18. 修改 onUnmounted
onUnmounted(() => {
  pageContextStore.clearContext();
  if (householdListenerUnsubscribe.value) {
    console.log('Stopping household listener...');
    householdListenerUnsubscribe.value();
    householdListenerUnsubscribe.value = null;
  }
});


// --- 其他輔助函式 (保持不變) ---
function handleCopy(value) { const { copy } = useClipboard({ source: value }); copy(value); snackbarText.value = '已複製到剪貼簿！'; snackbar.value = true; }
function openUrl(url) { if (url) window.open(url, '_blank', 'noopener,noreferrer'); }
function getEventStyle(event) {
  if (!event || Object.keys(event).length === 0) return { backgroundColor: '#FFFFFF', color: '#000000' };
  if (event.status === '取消') return { backgroundColor: '#F5F5F5', color: '#9E9E9E' };
  if (event.status === '已完成') return { backgroundColor: '#ECEFF1', color: '#546E7A' };
  // ✅ 修正：確保 textToSearch 的欄位存在
  const textToSearch = [ event.bookingType, event.inspectionMethod, event.specialRemarks, event.specialRemarks2 ].filter(Boolean).join(' ');
  for (const config of CSS_KEYWORD_COLOR_MAP) {
    if (config.keyword && textToSearch.includes(config.keyword)) return { backgroundColor: config.backgroundColor, color: config.color };
  }
  return { backgroundColor: '#EEEEEE', color: '#212121' };
}
function getAppointmentItemStyle(itemText) {
  if (!itemText) return {};
  const found = CSS_KEYWORD_COLOR_MAP.find(config => itemText.includes(config.keyword));
  if (found) return { backgroundColor: found.backgroundColor, color: found.color };
  return { backgroundColor: '#E0E0E0', color: '#212121'};
}
function getExcelRowStyle(event) {
  if (!event || Object.keys(event).length === 0) return { backgroundColor: 'FFFFFF', textColor: '000000' };
  if (event.status === '取消') return { backgroundColor: 'F5F5F5', textColor: '9E9E9E' };
  // ✅ 修正：確保 textToSearch 的欄位存在
  const textToSearch = [ event.bookingType, event.inspectionMethod, event.specialRemarks, event.specialRemarks2 ].filter(Boolean).join(' ');
  for (const config of EXCEL_KEYWORD_COLOR_MAP) {
    if (config.keyword && textToSearch.includes(config.keyword)) return { backgroundColor: config.backgroundColor, textColor: config.textColor };
  }
  return { backgroundColor: 'EEEEEE', textColor: '212121' };
}

// (safeFormatDate 函數保持不變)
function safeFormatDate(value, formatString = 'yyyy-MM-dd') {
  if (!value) return '';
  if (typeof value.toDate === 'function') {
    return format(value.toDate(), formatString);
  }
  if (typeof value === 'object' && value !== null && typeof value.seconds === 'number') {
    return format(new Date(value.seconds * 1000), formatString);
  }
  const date = new Date(value);
  if (isNaN(date.getTime())) {
    return String(value); 
  }
  return format(date, formatString);
}


// (getVisibleFields 函數保持不變)
const getVisibleFields = (fields, isAdding = false) => {
    // ...
};

// (handleDownloadPng 函數保持不變)
async function handleDownloadPng() {
 isDownloadingPdf.value = true;

 const chunkArray = (array, size) => {
  const chunkedArr = [];
  for (let i = 0; i < array.length; i += size) {
    chunkedArr.push(array.slice(i, i + size));
  }
  return chunkedArr;
 };

 try {
  const start = startDate.value;
  const end = endDate.value;

  if (!start || !end) {
   throw new Error("請先選擇有效的開始與結束日期。");
  }

  const allDates = eachDayOfInterval({ start, end });
  const dateChunks = chunkArray(allDates, 3);

  const eventsInRange = filteredAppointments.value.filter(event => {
    const eventDate = new Date(event.start); eventDate.setHours(0,0,0,0);
    const startDateNormalized = new Date(start); startDateNormalized.setHours(0,0,0,0);
    const endDateNormalized = new Date(end); endDateNormalized.setHours(0,0,0,0);
    return eventDate >= startDateNormalized && eventDate <= endDateNormalized;
  });
  const groupedEventsInRange = {};
  eventsInRange.forEach(event => {
    const dateKey = format(event.start, 'yyyy-MM-dd');
    const eventStartTime = format(event.start, 'HH:mm');
    // 精確匹配時段，如果不存在則使用第一個時段
    const timeKey = timeSlots.value.find(slot => slot === eventStartTime) || timeSlots.value[0];

    if (!groupedEventsInRange[dateKey]) groupedEventsInRange[dateKey] = {};
    if (!groupedEventsInRange[dateKey][timeKey]) groupedEventsInRange[dateKey][timeKey] = [];
    groupedEventsInRange[dateKey][timeKey].push(event);
  });

  const tempContainer = document.createElement('div');
  Object.assign(tempContainer.style, {
    position: 'absolute', left: '-9999px', width: '1123px',
    padding: '20px', backgroundColor: 'white'
  });

  const todayStr = format(new Date(), 'MM/dd');
  const dateStampElement = document.createElement('div');
  dateStampElement.textContent = `${todayStr} 更新`;
  Object.assign(dateStampElement.style, {
    fontSize: '3em', fontWeight: 'bold', color: 'red', marginBottom: '20px'
  });
  tempContainer.appendChild(dateStampElement);

  dateChunks.forEach(chunk => {
    const firstDate = chunk[0];
    const lastDate = chunk[chunk.length - 1];
    const titleElement = document.createElement('h3');
    Object.assign(titleElement.style, {
      fontSize: '1.25rem', marginBottom: '1rem', marginTop: '2rem'
    });
    titleElement.textContent = `${projectName.value} - 預約時間表: ${format(firstDate, 'yyyy/MM/dd')} - ${format(lastDate, 'yyyy/MM/dd')}`;
    tempContainer.appendChild(titleElement);

    const table = document.createElement('table');
    Object.assign(table.style, {
      borderCollapse: 'collapse', width: '100%', tableLayout: 'fixed', fontSize: '14px'
    });
    const thead = document.createElement('thead');
    const headerRow = document.createElement('tr');

    chunk.forEach(date => {
      const timeHeaderCell = document.createElement('th');
      timeHeaderCell.textContent = '時間';
      Object.assign(timeHeaderCell.style, {
        width: '70px',
        border: '1px solid #dee2e6', padding: '8px',
        backgroundColor: '#f8f9fa', fontWeight: 'bold', textAlign: 'center'
      });
      headerRow.appendChild(timeHeaderCell);

      const dayHeaderCell = document.createElement('th');
      dayHeaderCell.innerHTML = `<div>${format(date, 'EEEE', { locale: zhTW })}</div><div>${format(date, 'M/d')}</div>`;
      Object.assign(dayHeaderCell.style, {
        width: 'auto',
        border: '1px solid #dee2e6', padding: '8px',
        backgroundColor: '#f8f9fa', fontWeight: 'bold', textAlign: 'center'
      });
      if (isToday(date)) dayHeaderCell.style.backgroundColor = '#e3f2fd';
      if (isSaturday(date) || isSunday(date)) dayHeaderCell.style.backgroundColor = '#fce4e4';
      headerRow.appendChild(dayHeaderCell);
    });
    thead.appendChild(headerRow);
    table.appendChild(thead);

    const tbody = document.createElement('tbody');
    timeSlots.value.forEach(timeSlot => {
      const bodyRow = document.createElement('tr');
      chunk.forEach(date => {
        const timeCell = document.createElement('td');
        timeCell.textContent = timeSlot;
        Object.assign(timeCell.style, {
          border: '1px solid #dee2e6', padding: '8px', textAlign: 'center',
          fontWeight: 'bold', backgroundColor: '#f8f9fa'
        });
        bodyRow.appendChild(timeCell);
        const eventCell = document.createElement('td');
        Object.assign(eventCell.style, {
          border: '1px solid #dee2e6', padding: '4px', verticalAlign: 'top', minHeight: '10px',
        });
        const dateKey = format(date, 'yyyy-MM-dd');
        const events = groupedEventsInRange[dateKey]?.[timeSlot] || [];
        events.forEach(event => {
          const eventItem = document.createElement('div');
          const styles = getEventStyle(event);
          Object.assign(eventItem.style, styles, {
            whiteSpace: 'normal', wordWrap: 'break-word', padding: '4px 6px',
            marginTop: '4px', borderRadius: '4px', fontSize: '0.9em',
          });
          if (event['預約狀態'] === '取消') {
           eventItem.style.textDecoration = 'line-through';
           eventItem.style.opacity = '0.7';
          }
          
          // --- ✨ 修改後：使用 displayParts 產生 HTML 字串 ---
          const titleHTML = event.displayParts.map(part => {
            if (part.isHousehold) {
              return `<strong style="font-size: 1.1em;">${part.text}</strong>`;
            }
            return part.text;
          }).join(' - ');
          eventItem.innerHTML = titleHTML;
          // --- ✨ 修改結束 ---

          eventCell.appendChild(eventItem);
        });
        bodyRow.appendChild(eventCell);
      });
      tbody.appendChild(bodyRow);
    });
    table.appendChild(tbody);
    tempContainer.appendChild(table);
  });

  document.body.appendChild(tempContainer);

  await new Promise(resolve => setTimeout(resolve, 100));

  const canvas = await html2canvas(tempContainer, { scale: 2, useCORS: true });

  document.body.removeChild(tempContainer);

  const imageURL = canvas.toDataURL('image/png');
  const link = document.createElement('a');
  link.href = imageURL;

  const fileName = `${projectName.value}_驗屋預約表_${format(start, 'yyyyMMdd')}-${format(end, 'yyyyMMdd')}.png`;
  link.download = fileName;

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

 } catch (err) {
  console.error("圖片產生失敗:", err);
  error.value = `產生圖片失敗: ${err.message}`;
 } finally {
  isDownloadingPdf.value = false;
 }
}
async function handleDownloadExcel() {
  isDownloadingExcel.value = true;
  try {
    const start = startDate.value;
    const end = endDate.value;
    if (!start || !end) throw new Error("請先選擇有效的開始與結束日期。");

    const allDates = eachDayOfInterval({ start, end });
    if (allDates.length === 0) throw new Error("沒有有效的日期範圍可供匯出。");

    // --- 1. 動態決定要匯出的欄位 ---
    const selectedOptions = displayFieldOptions.value
      .filter(option => selectedDisplayFields.value.includes(option.key));

    const excelHeaders = [
      { key: 'appointmentTimeSlot', label: '時間', wch: 12 },
      ...selectedOptions.map(option => ({
        key: option.key,
        label: option.label,
        isDynamic: option.isDynamic || false,
        wch: 20
      })),
      { key: 'status', label: '狀態', wch: 12 },
    ];
    const headerLabels = excelHeaders.map(h => h.label);
    const numColumns = excelHeaders.length;

    // --- 2. 準備 Workbook 和 Worksheet ---
    const wb = XLSX.utils.book_new();
    const ws = {};
    const merges = [];

    // --- 3. 樣式定義 ---
    const mainTitleStyle = {
      font: { name: '標楷體', bold: true, sz: 16, color: { rgb: "FFFFFF" } },
      fill: { patternType: "solid", fgColor: { rgb: "005B9A" } },
      alignment: { horizontal: 'center', vertical: 'center' }
    };
    const headerStyle = {
      font: { name: '標楷體', bold: true, sz: 12 },
      fill: { patternType: "solid", fgColor: { rgb: "E0E0E0" } },
      alignment: { horizontal: 'center', vertical: 'center' },
      border: { top: { style: 'thin' }, bottom: { style: 'thin' }, left: { style: 'thin' }, right: { style: 'thin' } }
    };
    const defaultCellStyle = {
      font: { name: '標楷體' },
      alignment: { vertical: 'center', wrapText: true },
      border: { top: { style: 'thin' }, bottom: { style: 'thin' }, left: { style: 'thin' }, right: { style: 'thin' } }
    };

    // --- 4. 寫入總標題 (A1:E1 合併) ---
    ws['A1'] = { v: `${projectName.value} - 預約時間表`, t: 's', s: mainTitleStyle };
    merges.push({ s: { r: 0, c: 0 }, e: { r: 0, c: 4 } });
    
    let currentRow = 1; // 內容從第 2 列開始
    let maxCol = 0;

    // --- 5. 遍歷資料並寫入儲存格 ---
    const dateChunks = allDates.reduce((acc, _, i) => (i % 3 ? acc : [...acc, allDates.slice(i, i + 3)]), []);
    
    dateChunks.forEach((chunk) => {
      let currentColumn = 0;
      let maxAppointmentsInChunk = 0;
      chunk.forEach(date => {
        const appointmentsForDay = filteredAppointments.value.filter(a => format(a.start, 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd'));
        if (appointmentsForDay.length > maxAppointmentsInChunk) {
          maxAppointmentsInChunk = appointmentsForDay.length;
        }
      });
      const blockHeight = 1 + 1 + maxAppointmentsInChunk;

      chunk.forEach(date => {
        // 寫入每日標頭
        ws[XLSX.utils.encode_cell({ r: currentRow, c: currentColumn })] = { v: format(date, 'yyyy/MM/dd (EEE)', { locale: zhTW }), t: 's', s: headerStyle };
        merges.push({ s: { r: currentRow, c: currentColumn }, e: { r: currentRow, c: currentColumn + numColumns - 1 } });
        
        // 寫入資料欄位標頭
        headerLabels.forEach((label, idx) => {
          ws[XLSX.utils.encode_cell({ r: currentRow + 1, c: currentColumn + idx })] = { v: label, t: 's', s: headerStyle };
        });

        // 寫入每日的預約資料
        const appointmentsForDay = filteredAppointments.value
          .filter(a => format(a.start, 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd'))
          .sort((a, b) => a.start - b.start);
        
        for (let i = 0; i < maxAppointmentsInChunk; i++) {
          const event = appointmentsForDay[i];
          excelHeaders.forEach((header, idx) => {
            const cellRef = XLSX.utils.encode_cell({ r: currentRow + 2 + i, c: currentColumn + idx });
            if (event) {
              const rowStyle = getExcelRowStyle(event);
              let finalCellStyle = JSON.parse(JSON.stringify(defaultCellStyle));
              finalCellStyle.fill = { patternType: "solid", fgColor: { rgb: rowStyle.backgroundColor } };
              finalCellStyle.font.color = { rgb: rowStyle.textColor };
              // 使用 getFieldValue 輔助函式取值，支援動態 customField 欄位
              const cellValue = getFieldValue(event, header);
              ws[cellRef] = { v: cellValue || '', t: 's', s: finalCellStyle };
            } else {
              ws[cellRef] = { v: '', t: 's', s: defaultCellStyle };
            }
          });
        }
        currentColumn += numColumns;
      });
      
      if (currentColumn > maxCol) maxCol = currentColumn;
      currentRow += blockHeight;
    });

    // --- 6. 設定工作表範圍與欄寬 ---
    ws['!ref'] = XLSX.utils.encode_range({ s: { c: 0, r: 0 }, e: { c: maxCol - 1, r: currentRow -1 } });
    ws['!merges'] = merges;
      // =================> 最終版：自動計算欄寬的邏輯 <=================

      // 1. 建立一個陣列，用來儲存工作表中「每一個」欄位的實際最大內容寬度
      const colWidths = [];

      // 2. 遍歷所有儲存格，找出每一欄的最大寬度
      Object.keys(ws).forEach(cellRef => {
        // 忽略所有非儲存格的特殊屬性 (例如 !ref, !merges)
        if (cellRef.startsWith('!')) return;

        const decodedCell = XLSX.utils.decode_cell(cellRef);
        const colIndex = decodedCell.c;

        // 判斷此儲存格是否為合併儲存格 (用來排除最上方的總標題和每日標題)
        const isMerged = merges.some(m => 
          colIndex >= m.s.c && colIndex <= m.e.c && 
          decodedCell.r >= m.s.r && decodedCell.r <= m.e.r
        );
        // 如果是合併儲存格，就跳過，不參與寬度計算
        if (isMerged) return;

        const cellValue = ws[cellRef].v || '';
        // 將中文字元算為2個字元寬度，計算更準確
        const contentLength = cellValue.toString().replace(/[^\x00-\xff]/g, "xx").length;

        // 如果目前儲存格的內容長度 > 該欄已記錄的最大長度，就更新它
        if (!colWidths[colIndex] || contentLength > colWidths[colIndex]) {
          colWidths[colIndex] = contentLength;
        }
      });

      // 3. 將計算出的寬度陣列，轉換成 xlsx 需要的格式
      const newCols = colWidths.map(width => {
        // 在最大內容寬度的基礎上，再加 2 個字元的邊距，避免文字太貼邊
        return { wch: width + 2 };
      });

      // 4. 將新的、動態計算出的欄寬設定賦予工作表
      ws['!cols'] = newCols;

      // =================>↑↑↑↑最終版：自動計算欄寬的邏輯↑↑↑ <=================

    // --- 7. 產生並下載檔案 ---
    XLSX.utils.book_append_sheet(wb, ws, "預約時間表");
    const fileName = `${projectName.value}_預約時間表_${format(new Date(), 'yyyyMMdd')}.xlsx`;
    const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([wbout], { type: 'application/octet-stream' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', fileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

  } catch (err) {
    console.error("Excel 產生失敗:", err);
    error.value = `產生 Excel 失敗: ${err.message}`;
  } finally {
    isDownloadingExcel.value = false;
  }
}

// ✅ 19. 修改 handleRefresh
async function handleRefresh() {
  isLoading.value = true;
  
  // 停止舊的監聽器
  if (householdListenerUnsubscribe.value) {
    householdListenerUnsubscribe.value();
    householdListenerUnsubscribe.value = null;
  }
  allHouseholdData.value.clear();
  
  // 重新啟動監聽器
  householdListenerUnsubscribe.value = listenToHouseholdsForCalendar(
    projectId.value,
    (householdsArray) => { // ✅ 監聽器回傳陣列
      const newHouseholds = new Map();
      householdsArray.forEach(docData => { // ✅ 迭代陣列
        const key = `${docData.projectId}_${docData.unitId}`;
        newHouseholds.set(key, convertFirestoreTimestampsToDates(docData)); // ✅ 轉換日期
      });
      allHouseholdData.value = newHouseholds;

      // 在監聽器首次回傳時（或更新時）觸發 fetchData
      fetchData(); 
    },
    (err) => {
      error.value = `監聽戶別資料失敗: ${err.message}`;
      isLoading.value = false;
    }
  );
  
  snackbarText.value = '資料已重新整理';
  snackbar.value = true;
}

// (Tour 函數保持不變)
const tour = new Shepherd.Tour({ /* ... */ });
const tourSteps = [ /* ... */ ];
tour.addSteps(tourSteps);
function startTour() { tour.start(); }

// (navigateToHouseholdGrid 函數保持不變)
function navigateToHouseholdGrid() {
  router.push({ 
    name: 'HouseholdGrid', 
    params: { projectId: projectId.value } 
  });
}
</script>




<style>
/* --- 時段篩選引導提示動畫 --- */
.time-hint-badge .v-badge__badge {
  animation: pulse-hint 1.5s ease-in-out infinite;
}

@keyframes pulse-hint {
  0%, 100% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.6); opacity: 0.5; }
}

.time-hint-tooltip {
  font-size: 13px !important;
  background-color: rgba(33, 150, 243, 0.95) !important;
  padding: 8px 12px !important;
  border-radius: 8px !important;
}

.time-selector-btn {
  position: relative;
}
/* --- 全局樣式 --- */
.primary-bg { background-color: #1a73e8; color: white; }

/* --- 自訂週視圖樣式 (手動實現凍結版) --- */

:root {
  --day-column-width: 220px;
  --header-bg-color: #f5f5f5;
  --time-col-bg-color: #f9f9f9;
  --today-highlight-bg: #e3f2fd;
  --today-highlight-text: #1976d2;
  --weekend-bg-color: #fce4e4;
  --border-color: #e0e0e0;
}

/* 1. 建立滾動容器 */
#custom-calendar-container {
  overflow: auto;
  border: 1px solid var(--border-color);
  border-radius: 4px;
  max-height: 75vh; 
}

.custom-calendar-table {
  table-layout: fixed;
  border-collapse: collapse;
}

/* 基礎儲存格 */
.custom-calendar-table th, 
.custom-calendar-table td {
  border: 1px solid var(--border-color);
  padding: 4px;
}
.time-header, .time-cell, .day-header {
  vertical-align: middle;
  
}
.time-header, .time-cell {
  width: 100px;
  min-width: 100px;
  text-align: center;
  font-weight: bold;
}
.day-header, .event-cell {
  width: var(--day-column-width);
  min-width: var(--day-column-width);
}

/* --- 手動實現凍結窗格 --- */

/* 2. 凍結上方日期列 */
.custom-calendar-table thead th {
  position: sticky;
  top: 0;
  z-index: 2;
  background-color: var(--header-bg-color);
  box-shadow: 0 2px 5px -2px rgba(0,0,0,0.1);
}

/* 3. 凍結左側整個時間欄 */
.custom-calendar-table th:first-child,
.custom-calendar-table td:first-child {
  position: sticky;
  left: 0;
  z-index: 3;
  background-color: var(--time-col-bg-color);
  box-shadow: 2px 0 5px -2px rgba(0,0,0,0.1);
}

/* 4. 將左上角"時間"格的層級設為最高 */
.custom-calendar-table thead th:first-child {
  z-index: 4;
  box-shadow: 2px 2px 5px -2px rgba(0,0,0,0.15);
}

/* --- 視覺優化樣式 (維持不變) --- */
.event-cell {
  height: 120px;
  vertical-align: top;
}
.day-header.weekend-column {
  background-color: var(--weekend-bg-color) !important;
}
.day-header.today-column {
  background-color: var(--today-highlight-bg) !important;
}
.day-header.today-column div {
  color: var(--today-highlight-text);
  font-weight: 900;
}
.event-item {
  white-space: normal;
  word-wrap: break-word;
  padding: 4px 6px;
  margin-top: 4px;
  margin-bottom: 4px;
  border-radius: 4px;
  font-size: 0.85em;
  cursor: pointer;
  transition: opacity 0.2s;
}
.event-item:hover {
  opacity: 0.8;
}
.table-chunk {
  page-break-inside: avoid;
}
.disabled-cell {
  background-color: #f8f9fa;
}

/* --- 文字置中最終修正 --- */
/* 透過提高 CSS Selector 的優先級，強制覆蓋 Vuetify 的預設靠左對齊 */
.custom-calendar-table .time-header,
.custom-calendar-table .day-header {
  text-align: center !important;
}

.event-household {
  font-size: 1.2em; /* 讓字體比周圍文字大 10% */
}

/* 請將此段 CSS 加入到 <style> 區塊 */
.remarks-text {
  color: #C62828; /* 深紅色文字 */
  background-color: #FFEBEE; /* 淡紅色背景 */
  padding: 12px;
  border-radius: 4px;
  font-weight: 500;
  border-left: 5px solid #D32F2F; /* 左側加上紅色粗線，更醒目 */
  line-height: 1.6;
}

/* --- 手機版按鈕響應式優化 --- */
/* 當螢幕寬度小於 600px 時 (Vuetify 的 xs 尺寸) */
@media (max-width: 599px) {
  .btn-text {
    display: none; /* 隱藏按鈕內的文字 */
  }
}
.cancelled-event {
  text-decoration: line-through;
  opacity: 0.8; /* 稍微降低透明度，讓視覺效果更柔和 */
}

.remark-alert {
  border: 1px solid rgba(0,0,0,0.1);
}

.remark-alert .alert-content {
  white-space: pre-wrap; /* 讓換行符號 (\n) 生效 */
  word-wrap: break-word; /* 讓過長的單字或網址可以換行 */
  color: #212121;
  font-size: 0.9em;
  line-height: 1.6;
}

.is-dragging {
  /* 禁止使用者選取頁面上的任何文字 */
  user-select: none;
  -webkit-user-select: none; /* 兼容 Safari */
  -moz-user-select: none;    /* 兼容 Firefox */
  -ms-user-select: none;     /* 兼容 IE */
}


</style>