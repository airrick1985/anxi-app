<template>
  <v-container fluid>
    <v-card class="pa-4">
      <v-card-title class="d-flex align-center justify-space-between text-h5 text-primary mb-4">
        <span>{{ pageTitle }}</span>

        <div id="action-buttons">
          <div class="d-none d-md-flex ga-2 align-center">
      


            <v-tooltip text="重新整理資料" location="bottom">
              <template v-slot:activator="{ props }">
                <v-btn v-bind="props" icon="mdi-refresh" variant="text" @click="handleRefresh" :loading="isLoading"></v-btn>
              </template>
            </v-tooltip>

            <v-divider vertical class="mx-2"></v-divider>

         
            

            <v-btn v-if="canEdit" color="indigo" @click="handleOpenAddDialog" prepend-icon="mdi-calendar-plus">
              新增預約
            </v-btn>

            <v-btn color="primary" @click="handleDownloadPng" :loading="isDownloadingPdf" prepend-icon="mdi-image-area">
              下載時間表 (PNG)
            </v-btn>
            <v-btn color="teal-darken-1" @click="handleDownloadExcel" :loading="isDownloadingExcel" prepend-icon="mdi-microsoft-excel">
              下載時間表 (Excel)
            </v-btn>
          </div>


        </div>
      </v-card-title>

       <v-overlay
        v-model="isLoading"
        contained
        class="align-center justify-center"
        persistent
      >
        <v-progress-circular
          indeterminate
          color="primary"
          size="64"
        ></v-progress-circular>
        <div class="mt-4 text-white font-weight-bold">資料載入中...</div>
      </v-overlay>
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


      <div v-if="!isLoading && !error">
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

  <v-col cols="12" sm="6" md="auto" class="pl-md-5">
      <div class="d-flex align-center">
          <span class="text-subtitle-2 font-weight-bold mr-2 d-none d-md-inline">狀態:</span>
          <v-checkbox v-model="selectedStatuses" label="預約中" value="預約中" density="compact" hide-details color="primary"></v-checkbox>
          <v-checkbox v-model="selectedStatuses" label="取消" value="取消" density="compact" hide-details color="error"></v-checkbox>
          <v-checkbox v-model="selectedStatuses" label="已完成" value="已完成" density="compact" hide-details color="blue-grey"></v-checkbox>
      </div>
  </v-col>
  <v-col cols="12" sm="6" md="auto" class="ml-md-6">
    <div class="d-flex align-center">
      <span class="text-subtitle-2 font-weight-bold mr-2 d-none d-md-inline">項目:</span>
      <v-checkbox v-for="itemType in currentTypeOptions" :key="itemType" v-model="selectedTypes" :label="itemType" :value="itemType" density="compact" hide-details color="teal-darken-1"></v-checkbox>
    </div>
  </v-col>
   <v-col cols="12" class="mt-2 pt-0">
     <v-divider></v-divider>
    <div id="display-options-panel" class="d-flex align-center flex-wrap">
    <span class="text-subtitle-2 font-weight-bold mr-2 mt-2 d-none d-md-inline">標題顯示:</span>
      <v-checkbox v-for="field in displayFieldOptions" :key="field.key" v-model="selectedDisplayFields" :label="field.label" :value="field.key" density="compact" hide-details color="indigo" class="mt-2"></v-checkbox>
    </div>
  </v-col>
</v-row>
        
        <div id="custom-calendar-container">
          <div v-for="(chunk, index) in dateChunks" :key="index" class="mb-8 table-chunk">
            <h3 class="text-h6 mb-2">
              　 {{ projectName }} - 驗屋預約管理: {{ format(chunk[0].dateObj, 'yyyy/MM/dd') }} - {{ format(chunk[chunk.length - 1].dateObj, 'yyyy/MM/dd') }}
            </h3>
            <v-table class="custom-calendar-table">
              <thead>
                <tr>
                  <th class="time-header">
        <v-menu
        v-model="timeSelectorMenu[index]" :close-on-content-click="false"
        location="end"
        transition="scale-transition"
      >
        <template v-slot:activator="{ props }">
          <v-btn v-bind="props" variant="text" size="small" append-icon="mdi-chevron-down">
            時間
          </v-btn>
        </template>


          <v-card max-width="350">
            <v-list style="max-height: 400px" class="overflow-y-auto" density="compact">
              <v-list-item>
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
      @save="handleSaveChangesFromDialog"
      @cancel-appointment="promptCancelBooking"
      @update-inspectors="handleUpdateInspectorsFromDialog"
    />
    
      <v-dialog v-model="isAddDialogVisible" max-width="800px" persistent scrollable>
          <v-card>
              <v-card-title class="text-h6 primary-bg d-flex align-center">
                  <v-icon start>mdi-calendar-plus</v-icon>
                  <span>新增預約</span>
                  <v-spacer></v-spacer>
                  <v-btn variant="text" icon="mdi-close" density="compact" @click="isAddDialogVisible = false"></v-btn>
              </v-card-title>
              
              <v-card-text>
                  <div class="bg-grey-lighten-5 pa-4">
                      <v-form ref="newAppointmentForm">
                          <v-row dense>
                              <v-col cols="12" sm="6">
                                  <v-select v-model="newAppointmentData.building" :items="buildingOptions" label="棟別" :rules="[v => !!v || '必須選擇棟別']" hide-details="auto" variant="outlined"></v-select>
                              </v-col>
                              <v-col cols="12" sm="6">
                                  <v-select v-model="newAppointmentData.unitId" :items="unitOptions" label="戶別" :disabled="!newAppointmentData.building" :rules="[v => !!v || '必須選擇戶別']" hide-details="auto" no-data-text="請先選棟別" variant="outlined"></v-select>
                              </v-col>
                          </v-row>
                        <v-row v-if="newAppointmentData.remarks" dense class="mt-2">
                            <v-col cols="12">
                              <v-alert
                                variant="tonal"
                                color="error"
                                icon="mdi-alert-circle-outline"
                                border="start"
                                style="white-space: pre-wrap; word-wrap: break-word;"
                              >
                                <template v-slot:title>
                                  <div class="font-weight-bold">重要備註</div>
                                </template>
                                {{ newAppointmentData.remarks }}
                              </v-alert>
                            </v-col>
                          </v-row>
                          </v-form>
                  </div>

                  <v-expansion-panels v-model="panels" multiple variant="accordion">
                      <v-expansion-panel v-for="panel in displayPanels" :key="panel.title">
                          <template v-if="panel.isHistoryPanel">
                              <v-expansion-panel-title class="font-weight-bold">
                                  <v-icon start color="grey-darken-1">mdi-history</v-icon>
                                  歷次預約紀錄
                                  <v-chip size="small" color="blue-grey" class="ml-2">{{ bookingHistory.length }}</v-chip>
                              </v-expansion-panel-title>
                              <v-expansion-panel-text class="pa-0">
                                  <v-list lines="one" density="compact">
                                      <template v-for="(item, index) in bookingHistory" :key="item.id">
                                          <v-list-item class="py-3">
                                              <v-list-item-title class="font-weight-medium">
                                                  {{ safeFormatDate(item.appointmentDate, 'yyyy-MM-dd') }}
                                                  <span class="text-caption text-grey-darken-1 ml-2">{{ item.appointmentTimeSlot }}</span>
                                              </v-list-item-title>
                                              <v-list-item-subtitle>{{ item.bookingType }}</v-list-item-subtitle>
                                              <template v-slot:append>
                                              <v-chip v-if="item.status === '預約中'" color="success" size="x-small" label variant="flat"><v-icon start icon="mdi-check-circle-outline"></v-icon>{{ item.status }}</v-chip>
                                              <v-chip v-else-if="item.status === '取消'" color="red-darken-1" size="x-small" label variant="tonal"><v-icon start icon="mdi-close-circle-outline"></v-icon>{{ item.status }}</v-chip>
                                              <v-chip v-else-if="item.status === '已完成'" color="blue-grey" size="x-small" label variant="outlined"><v-icon start icon="mdi-check-all"></v-icon>{{ item.status }}</v-chip>
                                              </template>
                                          </v-list-item>
                                          <v-divider v-if="index < bookingHistory.length - 1"></v-divider>
                                      </template>
                                  </v-list>
                              </v-expansion-panel-text>
                          </template>
                          <template v-else>
                              <v-expansion-panel-title class="font-weight-bold">{{ panel.title }}</v-expansion-panel-title>
                              <v-expansion-panel-text>
                                  <v-list lines="two"> <template v-for="(field, index) in getVisibleFields(panel.fields, true)" :key="field.key">
                                            <v-list-item class="py-3">
                                              <template v-slot:prepend><v-icon :icon="field.icon"></v-icon></template>
                                              <div class="mt-2">
                                                <v-select
                                                  v-if="field.type === 'booking-item-select'"
                                                  v-model="newAppointmentData.bookingType"
                                                  :items="currentTypeOptions"
                                                  :label="field.label"
                                                  :disabled="!newAppointmentData.unitId"
                                                  :rules="[(v) => !!v || '必須選擇預約項目']"
                                                  hide-details="auto"
                                                  no-data-text="請先選戶別"
                                                  variant="outlined"
                                                >
                                                </v-select>
                                                

                                                <div v-else-if="field.type === 'booking-datetime-select'">
                                                  <v-list-item-subtitle class="mb-2">{{ field.label }}</v-list-item-subtitle>
                                                  <div class="d-flex flex-column flex-sm-row ga-2">
                                                    <v-text-field
                                                      v-model="newAppointmentData.appointmentDate"
                                                      label="預約日期"
                                                      type="date"
                                                      hide-details="auto"
                                                      :rules="[(v) => !!v || '必須選擇日期']"
                                                      variant="outlined"
                                                    ></v-text-field>
                                                    <v-combobox
                                                      v-model="newAppointmentData.appointmentTimeSlot"
                                                      :items="timeSlotOptions"
                                                      label="預約時段"
                                                      :placeholder="isDateInBatch ? '請選擇時段' : '格式 HH:mm'"
                                                      :rules="timeSlotRules"
                                                      :loading="isTimeSlotLoading"
                                                      :disabled="!newAppointmentData.appointmentDate"
                                                      hide-details="auto"
                                                      no-data-text="此日期無可用時段"
                                                      variant="outlined"
                                                    >
                                                    </v-combobox>
                                                  </div>
                                                </div>
                                                

                                                <v-text-field
                                                  v-else-if="field.key === 'address' || field.key === 'parkingLots'"
                                                  v-model="newAppointmentData[field.key]"
                                                  :label="field.label"
                                                  hide-details
                                                  readonly
                                                  variant="filled"
                                                ></v-text-field> <div v-else-if="field.key === 'inspectionReportUrl'" class="pt-2">
                                                  <v-list-item-subtitle class="mb-2">{{ field.label }}</v-list-item-subtitle>
                                                  <span v-if="!newAppointmentReportFiles || newAppointmentReportFiles.length === 0" class="text-grey-darken-1">未提供</span>
                                                  <v-btn
                                                    v-else-if="newAppointmentReportFiles.length === 1"
                                                    variant="text"
                                                    size="small"
                                                    :href="newAppointmentReportFiles[0].url"
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    @click.stop
                                                    class="text-none pa-1"
                                                    color="primary"
                                                  >
                                                    <template v-slot:prepend>
                                                      <v-icon color="red" size="20">mdi-file-pdf-box</v-icon>
                                                    </template>
                                                    {{ newAppointmentReportFiles[0].name }}
                                                  </v-btn>
                                                  <v-menu v-else location="bottom">
                                                    <template v-slot:activator="{ props }">
                                                      <v-btn v-bind="props" variant="tonal" color="primary" size="small" append-icon="mdi-menu-down">
                                                        查看報告 ({{ newAppointmentReportFiles.length }})
                                                      </v-btn>
                                                    </template>
                                                    <v-list density="compact">
                                                      <v-list-item
                                                        v-for="(file, index) in newAppointmentReportFiles"
                                                        :key="index"
                                                        :href="file.url"
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        @click.stop
                                                      >
                                                        <template v-slot:prepend>
                                                          <v-icon color="red" size="20">mdi-file-pdf-box</v-icon>
                                                        </template>
                                                        <v-list-item-title>{{ file.name }}</v-list-item-title>
                                                      </v-list-item>
                                                    </v-list>
                                                  </v-menu>
                                                </div>
                                                
                                                <div v-else-if="field.type === 'button'" class="pt-2">
                                                  <v-list-item-subtitle class="mb-2">{{ field.label }}</v-list-item-subtitle>
                                                  <v-btn v-if="newAppointmentData[field.key] && String(newAppointmentData[field.key]).trim() !== ''" color="primary" size="small" variant="tonal" @click="openUrl(newAppointmentData[field.key])">
                                                      <v-icon start icon="mdi-launch"></v-icon>開啟{{ field.label }}
                                                  </v-btn>
                                                  <span v-else class="text-grey-darken-1">未提供</span>
                                                </div>

                                                <v-select
                                                  v-else-if="field.key === 'inspectionMethod'"
                                                  v-model="newAppointmentData[field.key]"
                                                  :items="bookingOptions.inspectionMethods"
                                                  :label="field.label"
                                                  hide-details
                                                  variant="outlined"
                                                ></v-select>

                                                <v-text-field
                                                  v-else-if="field.type === 'date'"
                                                  v-model="newAppointmentData[field.key]"
                                                  :label="field.label"
                                                  type="date"
                                                  hide-details
                                                  variant="outlined"
                                                ></v-text-field>

                                                <v-text-field
                                                  v-else
                                                  v-model="newAppointmentData[field.key]"
                                                  :label="field.label"
                                                  hide-details
                                                  variant="outlined"
                                                ></v-text-field>
                                              </div>
                                          </v-list-item>
                                          <v-divider v-if="index < getVisibleFields(panel.fields, true).length -1"></v-divider>
                                      </template>
                                  </v-list>
                              </v-expansion-panel-text>
                          </template>
                      </v-expansion-panel>
                  </v-expansion-panels>
              </v-card-text>

              <v-divider></v-divider>
              <v-card-actions class="pa-3">
                  <v-spacer></v-spacer>
                  <v-btn color="grey-darken-1" variant="text" @click="isAddDialogVisible = false">取消</v-btn>
                  <v-btn color="success" variant="flat" :loading="isSaving" @click="handleSaveNewAppointment">儲存新增</v-btn>
              </v-card-actions>
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
        <v-checkbox v-model="selectedStatuses" label="預約中" value="預約中" density="compact" hide-details color="primary"></v-checkbox>
        <v-checkbox v-model="selectedStatuses" label="取消" value="取消" density="compact" hide-details color="error"></v-checkbox>
        <v-checkbox v-model="selectedStatuses" label="已完成" value="已完成" density="compact" hide-details color="blue-grey"></v-checkbox>
      </div>
      <v-divider class="my-3"></v-divider>
      <div>
        <v-label class="mb-2">預約項目</v-label>
        <v-checkbox v-for="itemType in currentTypeOptions" :key="itemType" v-model="selectedTypes" :label="itemType" :value="itemType" density="compact" hide-details color="teal-darken-1"></v-checkbox>
      </div>
      <v-divider class="my-3"></v-divider>
      <div>
        <v-label class="mb-2">預約記錄標籤</v-label>
        <v-checkbox v-for="field in displayFieldOptions" :key="field.key" v-model="selectedDisplayFields" :label="field.label" :value="field.key" density="compact" hide-details color="indigo"></v-checkbox>
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
              <v-list-item v-if="duplicateInfo.inspectionMethod" prepend-icon="mdi-account-hard-hat-outline" title="驗屋方式" :subtitle="duplicateInfo.inspectionMethod"></v-list-item>
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
    class="d-md-none"
    grow
    style="position: fixed; z-index: 2400; bottom: 1rem; left: 1rem; right: 1rem; width: auto; border-radius: 16px; box-shadow: 0 4px 12px rgba(0,0,0,0.15);"
  >
    <v-btn @click="handleRefresh" :loading="isLoading">
      <v-icon>mdi-refresh</v-icon>
      <span>重新整理</span>
    </v-btn>

    <v-btn @click="isFilterDrawerVisible = true">
      <v-icon>mdi-filter-variant</v-icon>
      <span>篩選</span>
    </v-btn>

    <v-btn v-if="canEdit" @click="handleOpenAddDialog">
      <v-icon>mdi-calendar-plus</v-icon>
      <span>新增預約</span>
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
import VueDatePicker from '@vuepic/vue-datepicker';
import '@vuepic/vue-datepicker/dist/main.css';


import { usePageContextStore } from '@/store/pageContextStore';
import { useProjectStore } from '@/store/projectStore'; 
import Shepherd from 'shepherd.js';
import 'shepherd.js/dist/css/shepherd.css';
import { ref, onMounted, computed, watch, reactive, onUnmounted ,nextTick} from 'vue';
import { useRoute, useRouter } from 'vue-router'; 
import { useUserStore } from '@/store/user';
import { watchDebounced } from '@vueuse/core'; //
import { getAuth } from 'firebase/auth';



import { 
  fetchCalendarData,
  fetchBookingOptions,
  updateAppointment,
  cancelAppointment,
  addAppointmentAdmin,
  getAllBookingRules,
  searchAppointmentsAndHouseholds,
  updateAppointmentInspectors,
  fetchAllHouseholdsForProject,
  getSlotsForAdmin, 
  fetchProjectConfig, 
  fetchAppointmentDateRange, 
} from '@/api'; 
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
const isLoading = ref(true);
const error = ref(null);
const projectSettings = ref(null); // [新增] 用於儲存專案的詳細設定

// 產生一個從 00:00 到 23:30，間隔 30 分鐘的完整時間列表
const allPossibleTimeSlots = Array.from({ length: 48 }, (_, i) => {
  const hour = Math.floor(i / 2).toString().padStart(2, '0');
  const minute = (i % 2 === 0) ? '00' : '30';
  return `${hour}:${minute}`;
});

// 2. 用於儲存使用者勾選的時間
const selectedTimeSlots = ref([]);

// 3. 控制時間選擇器選單的開關
const timeSelectorMenu = ref({});

// 4. 全選/清空時間的輔助函式
function selectAllTimeSlots() {
  selectedTimeSlots.value = [...allPossibleTimeSlots];
}
function clearAllTimeSlots() {
  selectedTimeSlots.value = [];
}


// 驗屋預約管理 --- 分頁狀態管理 ---
const allAppointments = ref([]);
const loadedWeeks = ref(new Set()); // 用來記錄哪些週的開始日期已經被載入

const allHouseholdData = ref({});
const isDialogVisible = ref(false);
const isAddDialogVisible = ref(false);
const selectedEvent = ref(null);
const isDownloadingPdf = ref(false);
const isDownloadingExcel = ref(false);





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

// 驗屋預約管理 --- 新增狀態管理 ---
const isDuplicateDialogVisible = ref(false);// 偵測到重複預約對話框顯示狀態
const isForceSaveDialogVisible = ref(false);// 強制儲存對話框顯示狀態
const isBatchMismatchDialogVisible = ref(false); // 批次不符對話框顯示狀態
const validationErrorReason = ref(''); // 強制儲存對話框中顯示的驗證錯誤原因
const batchMismatchReason = ref(''); // 批次不符對話框中顯示的原因
const tempCancelBookingCode = ref(null); // 用來暫存要取消的預約代碼
const pendingSavePayload = ref(null); // 用來暫存待強制儲存的資料

// 驗屋預約管理 --- 新增表單資料 ---
const newAppointmentData = reactive({
  building: null,
  unitId: null,
  bookingType: null,
  bookerName: '', bookerPhone: '', bookerEmail: '', bookerIdNumber: '', appointmentDate: null, appointmentTimeSlot: '',
  inspectionMethod: '', inspectionCompanyName: '', inspectors: [], bookingRemarks: '',
  agentName: '', agentPhone: '', address: '', parkingLots: '', buyerName: '',
  buyerPhone: '', buyerEmail: '', buyerIdNumber: '', appropriationDate: '', bank: '', bankContact: '', remarks: '',
  inspectionDocsUrl: '', inspectionReportUrl: '', initialInspectionBatch: '', reInspectionBatch: '',
  status: '預約中',
  checkInStatus: '',
  specialRemarks: '',
  specialRemarks2: '',
  handoverTime: null
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
// PROJECT_NAME_MAP = { fuyu56: '富宇上城', fuyu61: '富宇富御', fuyu1750: '富宇首馥' };
const PROJECT_TIME_SLOTS = {
  '富宇上城': ['09:00', '10:00', '11:00', '13:00', '14:00', '15:00', '16:00'],
  '富宇富御': ['09:30', '10:00', '11:00', '13:30', '14:00','14:30'],
  '富宇天玥': ['09:30', '10:00','14:00','14:30'],
  'default': ['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00']
};

const fieldConfig = {
  default: [
    { title: '基本資料', fields: [ { key: 'address', label: '門牌', icon: 'mdi-map-marker-outline' }, { key: 'parkingLots', label: '車位', icon: 'mdi-car-outline' }, { key: 'buyerName', label: '買方姓名', icon: 'mdi-account-star-outline' }, { key: 'buyerPhone', label: '買方電話', icon: 'mdi-phone-outline', copyable: true }, { key: 'buyerEmail', label: '買方EMAIL', icon: 'mdi-email-outline', copyable: true }, { key: 'buyerIdNumber', label: '買方身分證', icon: 'mdi-card-account-details-outline' } ]},
    { title: '預約人資料', fields: [ { key: 'bookerName', label: '預約人姓名', icon: 'mdi-account-outline' }, { key: 'bookerPhone', label: '預約人電話', icon: 'mdi-cellphone', copyable: true }, { key: 'bookerEmail', label: '預約人EMAIL', icon: 'mdi-email-outline', copyable: true }, { key: 'bookerIdNumber', label: '預約人身分證', icon: 'mdi-card-account-details-outline' } ]},
    { title: '驗屋與預約詳情', fields: [ { key: 'bookingType', label: '預約項目', icon: 'mdi-format-list-checks', type: 'booking-item-select' }, { key: 'inspectionMethod', label: '驗屋方式', icon: 'mdi-cog-outline' }, { key: 'appointmentDate', label: '預約日期與時段', icon: 'mdi-calendar-clock', type: 'booking-datetime-select' }, { key: 'inspectionCompanyName', label: '代驗公司', icon: 'mdi-domain' }, { key: 'agentName', label: '受託人姓名', icon: 'mdi-account-tie-outline' }, { key: 'agentPhone', label: '受託人電話', icon: 'mdi-phone-in-talk-outline', copyable: true }, { key: 'bookingRemarks', label: '預約備註', icon: 'mdi-note-text-outline' }, ]},
    { title: '相關文件與批次', fields: [ { key: 'appropriationDate', label: '撥款日期', icon: 'mdi-cash-check', type: 'date' }, { key: 'bank', label: '銀行', icon: 'mdi-bank-outline' }, { key: 'bankContact', label: '銀行窗口', icon: 'mdi-account-tie-outline' }, { key: 'inspectionDocsUrl', label: '驗屋文件', icon: 'mdi-file-document-outline', type: 'button', readOnly: true }, { key: 'inspectionReportUrl', label: '驗屋報告', icon: 'mdi-file-chart-outline', type: 'button', readOnly: true }, { key: 'remarks', label: '重要備註', icon: 'mdi-alert-circle-outline', type: 'remark' }, { key: 'initialInspectionBatch', label: '初驗批次', icon: 'mdi-numeric-1-box-multiple-outline' }, { key: 'reInspectionBatch', label: '複驗批次', icon: 'mdi-numeric-2-box-multiple-outline' }, ]}
  ]
};
const displayFieldOptions = ref([ { key: 'unitId', label: '戶別' }, { key: 'bookerName', label: '預約人姓名' }, { key: 'bookingType', label: '預約項目' }, { key: 'inspectionMethod', label: '驗屋方式' }, { key: 'inspectionCompanyName', label: '代驗公司名稱' }, { key: 'bookingRemarks', label: '預約備註' }, { key: 'inspectors', label: '驗屋人員', formatter: (val) => val ? `【${val}】` : null }, ]);
const CSS_KEYWORD_COLOR_MAP = [ { keyword: '已撥款', backgroundColor: '#ffc107', color: '#212529' }, { keyword: '交屋', backgroundColor: '#ffc107', color: '#212529' }, { keyword: '初驗', backgroundColor: '#d4edda', color: '#155724' }, { keyword: '複驗', backgroundColor: '#f8d7da', color: '#721c24' }, ];
const EXCEL_KEYWORD_COLOR_MAP = [ { keyword: '已撥款', backgroundColor: 'ffc107', textColor: '212529' }, { keyword: '交屋', backgroundColor: 'ffc107', textColor: '212529' }, { keyword: '初驗', backgroundColor: 'd4edda', textColor: '155724' }, { keyword: '複驗', backgroundColor: 'f8d7da', textColor: '721c24' }, ];
const selectedDisplayFields = ref(displayFieldOptions.value.map(field => field.key));
const projectName = computed(() => projectStore.idToNameMap[projectId.value] || '讀取中...');
const pageTitle = computed(() => `${projectName.value} - 驗屋預約時間表`);
const currentTypeOptions = computed(() => {
  if (projectSettings.value && Array.isArray(projectSettings.value.bookingTypes)) {
    return projectSettings.value.bookingTypes;
  }
  return []; // 當資料尚未載入或 bookingTypes 不存在時，回傳空陣列
});
const selectedTypes = ref([]);
const selectedStatuses = ref(['預約中', '取消', '已完成']);
const canEdit = computed(() => userStore.hasProjectPermission('驗屋預約管理-修改', projectName.value));

const buildingOptions = computed(() => Object.keys(bookingOptions.value.buildingsAndUnits).sort((a, b) => a.localeCompare(b, 'zh-Hant', { numeric: true })));
const unitOptions = computed(() => newAppointmentData.building ? (bookingOptions.value.buildingsAndUnits[newAppointmentData.building] || []) : []);
const timeSlots = computed(() => {
  return [...selectedTimeSlots.value].sort();
});

// 核心修改 filteredAppointments 現在會優先顯示搜尋結果
const filteredAppointments = computed(() => {
  //  直接過濾 allAppointments，完全移除對 searchResults 的判斷
  return processAppointments(allAppointments.value).filter(appt => {
    const statusMatch = selectedStatuses.value.includes(appt.status);
    const typeMatch = selectedTypes.value.includes(appt.bookingType);
    return statusMatch && typeMatch;
  });
});

const dateChunks = computed(() => {
  // 直接根據 startDate 和 endDate 產生日期區塊，移除所有與 query 和 foundDates 相關的邏輯
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
  const grouped = {};
  filteredAppointments.value.forEach(event => {
    if (!event.start) return;
    const dateKey = format(event.start, 'yyyy-MM-dd');
    const eventStartTime = format(event.start, 'HH:mm');

    // 驗屋預約管理 【核心修改點 2】使用倒序迴圈來查找正確的時間區間
    let timeKey = timeSlots.value[0]; // 預設為第一個時段，以防萬一
    for (let i = timeSlots.value.length - 1; i >= 0; i--) {
      const slot = timeSlots.value[i];
      if (eventStartTime >= slot) {
        timeKey = slot;
        break; // 從後面找到第一個比自己小的時段，就是正確的區間，然後跳出迴圈
      }
    }
    
    if (!grouped[dateKey]) grouped[dateKey] = {};
    if (!grouped[dateKey][timeKey]) grouped[dateKey][timeKey] = [];
    grouped[dateKey][timeKey].push(event);
});
  return grouped;
});

const bookingHistory = computed(() => {
    let currentUnitId = isAddDialogVisible.value ? newAppointmentData.unitId : (selectedEvent.value ? selectedEvent.value.unitId : null);
    if (!currentUnitId) return [];
    return allAppointments.value
      .filter(appt => appt.unitId === currentUnitId)
      .sort((a, b) => {
        const dateA = a.appointmentDate?.toDate() || 0;
        const dateB = b.appointmentDate?.toDate() || 0;
        return dateA - dateB;
      });
});

const displayPanels = computed(() => {
  const panels = [...(fieldConfig[projectName.value] || fieldConfig.default)];
  if (bookingHistory.value.length > 0) panels.push({ title: '歷次預約紀錄', isHistoryPanel: true });
  return panels;
});

const inspectionDocsFiles = computed(() => {
  if (!selectedEvent.value || !selectedEvent.value.inspectionDocsUrl) {
    return [];
  }
  const value = selectedEvent.value.inspectionDocsUrl;
  if (Array.isArray(value)) {
    return value.filter(item => item && typeof item.name === 'string' && typeof item.url === 'string');
  }
  // 如果不是陣列，就當作沒有檔案處理
  return [];
});

const inspectionReportFiles = computed(() => {
  if (!selectedEvent.value || !selectedEvent.value.inspectionReportUrl) {
    return [];
  }
  const value = selectedEvent.value.inspectionReportUrl;
  if (Array.isArray(value)) {
    return value.filter(item => item && typeof item.name === 'string' && typeof item.url === 'string');
  }
  return [];
});

const newAppointmentReportFiles = computed(() => {
  const rawValue = newAppointmentData.inspectionReportUrl;
  
  // 日誌點二：觀察 computed 屬性接收到的值和處理後的結果
  console.log('[日誌 2] newAppointmentReportFiles computed 接收到的原始值:', rawValue);

  if (!rawValue) {
    console.log('[日誌 2] 結果: 因原始值為空，回傳空陣列 []');
    return [];
  }
  if (Array.isArray(rawValue)) {
    const filtered = rawValue.filter(item => item && typeof item.name === 'string' && typeof item.url === 'string');
    console.log('[日誌 2] 結果: 處理陣列後，回傳的檔案列表:', filtered);
    return filtered;
  }
  
  console.log('[日誌 2] 結果: 因原始值不是陣列，回傳空陣列 []');
  return [];
});


const currentBookingRules = computed(() => {
    const isAdding = isAddDialogVisible.value;
    const currentData = isAdding ? newAppointmentData : editableEvent.value;
    if (!currentData || !allBookingRules.value) return null;
    const { unitId, bookingType, inspectionMethod } = currentData; // 改用英文 key
    const { batchRules, timeSlotRules } = allBookingRules.value;
    if (!unitId || !bookingType || !inspectionMethod || !batchRules || !timeSlotRules) return null;

    const householdDocId = `${projectId.value}_${unitId}`;
    const householdDetails = allHouseholdData.value[householdDocId];
    if (!householdDetails) return null;

    const batchKey = `${bookingType}批次`; // e.g., '初驗批次'
    const batchName = householdDetails[batchKey];
    if (!batchName) return null;

    const dateRule = batchRules[batchName];
    if (!dateRule) return null;

    const simplifiedMethod = (inspectionMethod === '代驗公司') ? '代驗' : '自驗';
    const timeSlotKey = `${bookingType}-${simplifiedMethod}`;
    const timeSlotsByDate = timeSlotRules[timeSlotKey] || {};
    
    return {
        startDate: dateRule.startDate,
        endDate: dateRule.endDate,
        unavailableDates: dateRule.unavailableDates || [],
        timeSlotsByDate: timeSlotsByDate,
    };
});

const availableTimeSlots = computed(() => {
    const currentData = isAddDialogVisible.value ? newAppointmentData : editableEvent.value;
    if (!currentData?.appointmentDate || !currentBookingRules.value) return [];
    const selectedDate = format(new Date(currentData.appointmentDate), 'yyyy-MM-dd');
    return currentBookingRules.value.timeSlotsByDate[selectedDate] || [];
});

// 驗屋預約管理【新增】用於分頁讀取的新函式
async function loadAppointmentsForDateRange(start, end) {
  const weekStartStr = format(startOfWeek(start, { weekStartsOn: 1 }), 'yyyy-MM-dd');

  // 如果這一週已經載入過，就直接返回，不再重複讀取
  if (loadedWeeks.value.has(weekStartStr)) {
    return;
  }

  isLoading.value = true;
  error.value = null;
  try {
    const newAppointments = await fetchCalendarData(projectId.value, start, end);
    
    // 使用 Map 合併新舊資料，避免重複
    const appointmentsMap = new Map(allAppointments.value.map(appt => [appt.id, appt]));
    newAppointments.forEach(appt => appointmentsMap.set(appt.id, appt));
    allAppointments.value = Array.from(appointmentsMap.values());

    // 標記這一週為已載入
    loadedWeeks.value.add(weekStartStr);
    
  } catch (err) {
    console.error(`獲取 [${format(start, 'yyyy-MM-dd')}] 範圍的資料失敗:`, err);
    error.value = err.message;
  } finally {
    isLoading.value = false;
  }
}

//導航到規則管理頁面的函式
function navigateToRuleManager() {
  router.push({ 
    name: 'BookingRuleManager', 
    params: { projectId: projectId.value } 
  });
}
// 驗屋預約管理 --- 主要資料獲取函式 ---
async function fetchData() {
  isLoading.value = true;
  error.value = null;
  try {


    const [rawCalendarData, optionsData, rulesData, allHouseholds] = await Promise.all([
      fetchCalendarData(projectId.value, startDate.value, endDate.value),
      fetchBookingOptions(projectId.value),
      getAllBookingRules(projectId.value),
      fetchAllHouseholdsForProject(projectId.value)
    ]);
    
    //  新增：資料驗證與過濾層
    // 在將資料存入 state 前，先檢查 appointmentDate 的格式
    const calendarData = rawCalendarData.filter(appt => {
        // 確保 appointmentDate 存在，並且是一個擁有 toDate 方法的物件 (Firestore Timestamp 的特徵)
        if (appt.appointmentDate && typeof appt.appointmentDate.toDate === 'function') {
            return true; // 格式正確，保留這筆資料
        }
        // 如果格式不正確，在 console 中印出警告，並過濾掉這筆資料
        console.warn('發現無效或缺失的 appointmentDate 格式，已過濾此筆預約:', appt);
        return false;
    });

    allAppointments.value = calendarData;
    
    bookingOptions.value = optionsData;

    if (rulesData.status === 'success') {
      allBookingRules.value = rulesData.data;
    } else {
      console.warn('無法獲取預約規則資料:', rulesData.message);
      allBookingRules.value = null; 
    }

    allHouseholdData.value = allHouseholds.reduce((acc, curr) => {
        const householdId = `${curr.projectId}_${curr.unitId}`;
        acc[householdId] = { id: householdId, ...curr };
        return acc;
    }, {});

  } catch (err) {
    console.error('獲取資料失敗:', err);
    error.value = err.message;
    showSnackbar(`獲取資料失敗: ${err.message}`, 'error');
  } finally {
    isLoading.value = false;
  }
}

// 驗屋預約管理 --- 獲取所有戶別資料 ---
function processAppointments(rawAppointments) {
  if (!Array.isArray(rawAppointments)) return []; // 防呆

  return rawAppointments.map(appt => {
      // ... (此函式內部所有邏輯維持不變)
      try {
        if (!appt.appointmentDate || !appt.appointmentDate.toDate) return null;
        
        const date = appt.appointmentDate.toDate();
        const dateStr = format(date, 'yyyy-MM-dd');
        
        const timeSlotString = appt.appointmentTimeSlot ? String(appt.appointmentTimeSlot) : '';
        const timeMatch = timeSlotString.match(/(\d{1,2}[:：]\d{2})/); 
        const startTime = timeMatch ? timeMatch[0].replace(/：/g, ':') : '00:00';
        
        const displayParts = displayFieldOptions.value
          .filter(option => selectedDisplayFields.value.includes(option.key))
          .map(option => {
            // ✅ 【關鍵修正】這裡要讀取 appt 物件的資料來產生 displayParts
            const value = appt[option.key]; 
            if (!value) return null;
            const formattedValue = option.formatter ? option.formatter(value) : String(value);
            return { text: formattedValue, isHousehold: option.key === 'unitId' };
          }).filter(Boolean);
        
        const finalStartObject = parseISO(`${dateStr}T${startTime}`);

        if (isNaN(finalStartObject.getTime())) {
          console.warn('產生無效的日期物件，已略過此筆預約:', appt);
          return null;
        }
        
        return { ...appt, start: finalStartObject, displayParts };

      } catch (e) {
        console.warn(`處理預約資料時發生錯誤: ${e.message}`, appt);
        return null;
      }
    }).filter(Boolean);
}



// START: 新增一個 showSnackbar 輔助函式 (如果您的檔案中還沒有的話)
function showSnackbar(text, color = 'success') {
  snackbarText.value = text;
  snackbar.value = true; // 假設您的 snackbar v-model 綁定的是 snackbar
}
// END: 新增函式結束

//  新增：處理子組件 'save' 事件的函式
async function handleSaveChangesFromDialog(payload) {
    const { appointmentId, bookingPayload, householdPayload } = payload;
    try {
        // 在 bookingPayload 中加入最後修改者姓名
        if (Object.keys(bookingPayload).length > 0 || Object.keys(householdPayload).length > 0) {
            bookingPayload.lastModifiedByName = userStore.user?.name || '未知使用者';
        }

        const response = await updateAppointment(appointmentId, bookingPayload, payload.householdDocId, householdPayload);

        if (response.status === 'no_changes') {
            showSnackbar('沒有偵測到任何變更。', 'info');
        } else {
            showSnackbar('儲存成功！', 'success');
            await fetchData(); // 重新整理資料
        }
        isDialogVisible.value = false; // 關閉對話框
    } catch (err) {
        showSnackbar(`儲存失敗: ${err.message}`, 'error');
    }
}

//  新增：處理子組件 'update-inspectors' 事件的函式
async function handleUpdateInspectorsFromDialog(payload) {
    const { appointmentId, inspectors } = payload;
    try {
        // 1. 呼叫 API 更新後端 (維持不變)
        await updateAppointmentInspectors(appointmentId, inspectors);

        // 2. 在前端主資料陣列中找到對應的預約紀錄 (維持不變)
        const index = allAppointments.value.findIndex(appt => appt.id === appointmentId);

        if (index !== -1) {
            // ✅ 建立一個臨時的、已更新的物件
            const tempUpdatedAppointment = {
                ...allAppointments.value[index],
                inspectors: inspectors.join(',')
            };
            
            // ✅ 【關鍵步驟】手動對這個臨時物件執行一次 processAppointments
            // 這會回傳一個包含全新 `displayParts` 的完整物件
            const fullyProcessedAppointment = processAppointments([tempUpdatedAppointment])[0];

            // ✅ 用這個經過完整處理、帶有新畫面的物件，去替換陣列中的舊物件
            allAppointments.value[index] = fullyProcessedAppointment;
        }
        
        // 3. 更新彈出視窗內的資料 (維持不變)
        if (selectedEvent.value && selectedEvent.value.id === appointmentId) {
            selectedEvent.value.inspectors = inspectors.join(',');
        }

        showSnackbar('驗屋人員已更新', 'success');

    } catch (err) {
        showSnackbar(`更新驗屋人員失敗: ${err.message}`, 'error');
    }
}



function handleCustomEventClick(event) {
  selectedEvent.value = event;
  isDialogVisible.value = true;
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

function handleOpenAddDialog() {
    resetNewAppointmentForm();
    isEditMode.value = false;
    panels.value = [];
    isAddDialogVisible.value = true;
}


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


// 修改 watch 邏輯，新增一個標記來避免初始化時的循環
const isInitializing = ref(false);

// 監聽 projectName 變化並初始化時間選擇設定
watch([
  projectName, 
  () => userStore.currentUserPreferences
], ([newName, preferences]) => {
  // 確保 projectName 有效
  if (newName && newName !== '讀取中...') {
    const savedTimeSlots = preferences?.calendarTimeSlots;
    

    // 檢查是否真的需要更新（避免不必要的觸發）
    const currentSelectionStr = JSON.stringify([...selectedTimeSlots.value].sort());
    const savedSlotsStr = savedTimeSlots ? JSON.stringify([...savedTimeSlots].sort()) : null;

    if (savedTimeSlots && savedTimeSlots.length > 0) {
      // 只有當儲存的設定與目前選擇不同時，才更新
      if (currentSelectionStr !== savedSlotsStr) {
        isInitializing.value = true;
        selectedTimeSlots.value = [...savedTimeSlots];
        nextTick(() => {
          isInitializing.value = false;
        });
      }
    } else if (selectedTimeSlots.value.length === 0) {
      // 如果沒有儲存過的設定，且目前是空的，才使用專案預設值
      const defaultSlots = PROJECT_TIME_SLOTS[newName] || PROJECT_TIME_SLOTS.default;
      isInitializing.value = true;
      selectedTimeSlots.value = [...defaultSlots];
      nextTick(() => {
        isInitializing.value = false;
      });
    }
  }
}, { immediate: true, deep: true });
// 修改 watchDebounced，只有在非初始化狀態時才儲存
watchDebounced(
  selectedTimeSlots,
  (newSelection) => {
    // 只有在非初始化狀態時才儲存偏好設定
    if (!isInitializing.value) {
      userStore.updateUserPreferences({ calendarTimeSlots: newSelection });
    }
  },
  { debounce: 1000, maxWait: 5000 }
);


// 新增 watch 來監聽 dateRange 的變化
watch(dateRange, (newRange) => {
  // 確保使用者選取了完整的開始和結束日期
  if (newRange && newRange.length === 2 && newRange[0] && newRange[1]) {
    // 當區間選擇完成後，更新我們原有的 startDate 和 endDate
    // 這將會自動觸發原本監聽這兩個變數的 watch，去後端重新載入資料
    startDate.value = newRange[0];
    endDate.value = newRange[1];
  }
});

// 驗屋預約管理【新增】監聽日期範圍的變化，自動載入新資料
watch([startDate, endDate], async ([newStart, newEnd], [oldStart, oldEnd]) => {
  //  修正條件判斷，確保 oldStart 和 oldEnd 存在時才進行比較
  // 這樣可以避免在首次載入時因 oldStart 為 undefined 而出錯
  const hasChanged = !oldStart || !oldEnd || newStart.getTime() !== oldStart.getTime() || newEnd.getTime() !== oldEnd.getTime();

  if (newStart && newEnd && hasChanged) {
    // 清空已載入的週記錄，確保 fetchData 重新獲取所有資料
    loadedWeeks.value.clear();
    // 呼叫 fetchData 重新載入所有相關資料，包括日曆事件
    await fetchData();
  }
});

// =================================================================
// / 前端即時搜尋邏輯
// =================================================================



// 當使用者從下拉選單中選擇一個項目時觸發此函式
function handleSearchResultSelection(selectedItem) { // 為了清晰，將參數改名為 selectedItem
  // 如果沒有選擇任何東西，直接返回
  if (!selectedItem) return;

  //  核心修改：從傳入的整個選項物件中，取出我們真正需要的 'value' 屬性
  const selectedAppointment = selectedItem.value;

  // 現在，後續的檢查和操作邏輯就可以完全保持不變，並且能正常運作了
  if (!selectedAppointment || !selectedAppointment.appointmentDate) {
    console.warn("選擇的搜尋結果缺少有效的 appointmentDate，操作已中斷。", selectedItem);
    showSnackbar('此筆搜尋結果無有效日期，無法跳轉。', 'warning');
    return;
  }

  const targetDate = selectedAppointment.appointmentDate;

  if (!(targetDate instanceof Date) || isNaN(targetDate.getTime())) {
    console.error("搜尋結果中的 appointmentDate 不是一個有效的日期物件。", targetDate);
    showSnackbar('此筆搜尋結果的日期格式錯誤，無法跳轉。', 'error');
    return;
  }
  
  const newStartDate = startOfWeek(targetDate, { weekStartsOn: 1 });
  const newEndDate = endOfWeek(targetDate, { weekStartsOn: 1 });

  startDate.value = newStartDate;
  endDate.value = newEndDate;

  nextTick(() => {
    // [關鍵修正] 使用搜尋結果的 id，從 allAppointments 主資料陣列中找到最完整的物件
    const eventInCalendar = allAppointments.value.find(e => e.id === selectedAppointment.id);
    
    if (eventInCalendar) {
      // 如果找到了，就使用這個完整的物件來開啟對話框
      handleCustomEventClick(eventInCalendar);
    } else {
      // 如果因為某些原因（例如，該事件不在當前載入的日期範圍內）沒找到
      // 則仍然使用搜尋結果的物件作為備用方案，但可能會缺少部分資料
      console.warn('在目前的行事曆資料中未找到對應的預約，將使用搜尋結果的資料開啟。', selectedAppointment);
      handleCustomEventClick(selectedAppointment);
    }
  });

  nextTick(() => {
    selectedSearchResult.value = null;
    searchQuery.value = '';
    backendSearchResults.value = [];
  });
}


// 監聽搜尋框輸入，觸發後端搜尋
let searchTimeout = null;
watch(searchQuery, (newQuery) => {
  clearTimeout(searchTimeout);
  
  if (!newQuery || newQuery.length < 2) {
    backendSearchResults.value = [];
    isSearchingBackend.value = false;
    return;
  }
  
  isSearchingBackend.value = true;
  searchTimeout = setTimeout(async () => {
    try {
      const result = await searchAppointmentsAndHouseholds(projectId.value, newQuery);
      if (result.status === 'success') {
        backendSearchResults.value = result.data;
        

      } else {
        console.error("後端搜尋失敗:", result.message);
        backendSearchResults.value = [];
        showSnackbar(`搜尋失敗: ${result.message}`, 'error');
      }
    } catch (err) {
      console.error("執行搜尋時發生例外:", err);
      backendSearchResults.value = [];
      showSnackbar(`搜尋時發生錯誤`, 'error');
    } finally {
      isSearchingBackend.value = false;
    }
  }, 500);
});


watch(() => newAppointmentData.building, () => {
    newAppointmentData.unitId = null;
    newAppointmentData.bookingType = null;
});

watch(() => newAppointmentData.unitId, (newUnit) => {
    const fieldsToReset = { bookingType: null, bookerName: '', bookerPhone: '', bookerEmail: '', bookerIdNumber: '', appointmentDate: null, appointmentTimeSlot: '', inspectionMethod: '', inspectionCompanyName: '', inspectors: [], bookingRemarks: '', agentName: '', agentPhone: ''};
    Object.assign(newAppointmentData, fieldsToReset);
    
    if (newUnit) {
        const householdDocId = `${projectId.value}_${newUnit}`;
        const data = allHouseholdData.value[householdDocId];
        if (data) {
            newAppointmentData.address = data.address || '';
            newAppointmentData.parkingLots = data.parkingLots || '';
            newAppointmentData.initialInspectionBatch = data.initialInspectionBatch || '';
            newAppointmentData.reInspectionBatch = data.reInspectionBatch || '';
            newAppointmentData.bookerName = data.buyerName || '';
            newAppointmentData.bookerPhone = data.buyerPhone || '';
            newAppointmentData.bookerEmail = data.buyerEmail || '';
            newAppointmentData.bookerIdNumber = data.buyerIdNumber || '';
            newAppointmentData.buyerName = data.buyerName || '';
            newAppointmentData.buyerPhone = data.buyerPhone || '';
            newAppointmentData.buyerEmail = data.buyerEmail || '';
            newAppointmentData.buyerIdNumber = data.buyerIdNumber || '';
            newAppointmentData.appropriationDate = data.appropriationDate || '';
            newAppointmentData.bank = data.bank || '';
            newAppointmentData.remarks = data.remarks || '';

            newAppointmentData.inspectionDocsUrl = data.inspectionDocsUrl || [];
            
            // 日誌點一：觀察從戶別資料中讀取到的原始 inspectionReportUrl 值
            console.log('[日誌 1] 從 allHouseholdData 讀取到的 inspectionReportUrl:', data.inspectionReportUrl);
            newAppointmentData.inspectionReportUrl = data.inspectionReportUrl || []; // 確保預設值為空陣列
            
            panels.value = [0, 1, 2, 3];
        }
    } else {
        const building = newAppointmentData.building;
        resetNewAppointmentForm();
        newAppointmentData.building = building;
    }
});



// [新增] 監聽預約時段的變化，自動清除後綴
watch(
    () => newAppointmentData.appointmentTimeSlot,
    (newValue) => {
        // 只有當值是字串且包含後綴時才處理
        if (typeof newValue === 'string' && newValue.includes('(')) {
            const match = newValue.match(/^(\d{1,2}:\d{2})/);
            // 如果成功匹配到時間格式，就更新 model
            if (match) {
                // 使用 nextTick 確保在 DOM 更新後再修改值，避免衝突
                nextTick(() => {
                    newAppointmentData.appointmentTimeSlot = match[1];
                });
            }
        }
    }
);


// 驗屋預約管理【新增】監聽預約日期的變化，自動載入該日的可用時段
watch(
    () => newAppointmentData.appointmentDate,
    async (date) => {
        newAppointmentData.appointmentTimeSlot = '';
        timeSlotOptions.value = [];
        isDateInBatch.value = false;

        if (!date) return;

        isTimeSlotLoading.value = true;
        try {
            const dateStr = format(new Date(date), 'yyyy-MM-dd');
            // 呼叫修改後的 API，不再需要 unit 和 type
            const options = await getSlotsForAdmin(projectId.value, dateStr);
            
            if (options.length > 0) {
                isDateInBatch.value = true;
                // [修改] 直接使用 API 回傳的字串陣列，不再轉換成物件
                timeSlotOptions.value = options;
            }
        } catch (error) {
            showSnackbar(`讀取時段失敗: ${error.message}`, 'error');
        } finally {
            isTimeSlotLoading.value = false;
        }
    }
);

// 監聽可用的預約項目，並在載入後預設全部選取
watch(currentTypeOptions, (newOptions) => {
  // 當選項從 API 載入完成後，將 selectedTypes 的值設定為所有可用的選項
  selectedTypes.value = [...newOptions];
});



// 驗屋預約管理【新增】處理新增預約的函式
async function handleSaveNewAppointment() {
    const { valid } = await newAppointmentForm.value.validate();
    if (!valid) {
        showSnackbar('請檢查表單，有必填欄位尚未填寫。', 'error');
        return;
    }

    // --- 步驟 1: 執行新的「批次不符」檢查 ---
    const { unitId, bookingType, appointmentDate } = newAppointmentData;
    const household = allHouseholdData.value[`${projectId.value}_${unitId}`];
    const batchCodeField = bookingType === '初驗' ? 'initialInspectionBatch' : 'reInspectionBatch';
    const batchCode = household?.[batchCodeField];

    if (!batchCode) {
        batchMismatchReason.value = '此戶別尚未被指派任何預約批次。';
        pendingSavePayload.value = { cancelBookingCode: null };
        isBatchMismatchDialogVisible.value = true;
        return; // 中斷流程，等待使用者確認
    }

    const batchRule = Object.values(allBookingRules.value.batchRules).find(r => r.batchCode === batchCode && r.bookingType === bookingType);
    if (!batchRule || !(appointmentDate >= batchRule.bookingStart && appointmentDate <= batchRule.bookingEnd)) {
        batchMismatchReason.value = `所選日期 (${appointmentDate}) 與此戶別指派的批次區間 (${batchRule?.bookingStart} ~ ${batchRule?.bookingEnd}) 不符。`;
        pendingSavePayload.value = { cancelBookingCode: null };
        isBatchMismatchDialogVisible.value = true;
        return; // 中斷流程，等待使用者確認
    }
    
    // 如果檢查通過，直接進入下一步
    proceedWithSaveChecks(null);
}

// 驗屋預約管理【新增】進行儲存前的其他檢查
function handleConfirmBatchMismatch() {
    // 使用者確認後，從暫存的 payload 繼續執行
    proceedWithSaveChecks(pendingSavePayload.value?.cancelBookingCode);
}

// 實際執行儲存前的檢查與新增動作
function proceedWithSaveChecks(cancelBookingCode = null) {
    isBatchMismatchDialogVisible.value = false; // 關閉確認視窗

    // --- 步驟 2: 執行既有的「重複預約」檢查 ---
    const isDuplicate = allAppointments.value.some(appt => 
        appt.unitId === newAppointmentData.unitId &&
        appt.bookingType === newAppointmentData.bookingType &&
        appt.status === '預約中' &&
        appt.bookingCode !== cancelBookingCode // 避免比對到自己
    );
    
    if (isDuplicate) {
        const duplicate = allAppointments.value.find(appt => 
            appt.unitId === newAppointmentData.unitId && 
            appt.bookingType === newAppointmentData.bookingType && 
            appt.status === '預約中'
        );
        duplicateInfo.value = duplicate;
        isDuplicateDialogVisible.value = true;
    } else {
        // --- 步驟 3: 執行最終的「名額」檢查與儲存 ---
        executeAddAppointment(cancelBookingCode, false);
    }
}


// 使用者在重複預約詢問視窗中選擇「取消舊預約並新增」
function handleConfirmForceSave() {
    executeAddAppointment(tempCancelBookingCode.value, true);
}

// 驗屋預約管理【新增】執行真正的新增動作
async function executeAddAppointment(cancelBookingCode = null, force = false) {
    isSaving.value = true;
    try {
        const payload = { ...newAppointmentData };
        if (Array.isArray(payload.inspectors)) payload.inspectors = payload.inspectors.join(',');

      //  在 payload 中加入建立者與最後修改者姓名
          const userName = userStore.user?.name || '未知使用者';
          payload.createdByName = userName;
            payload.lastModifiedByName = userName;

        
        // 呼叫我們修改過的 API 函式
        await addAppointmentAdmin(projectId.value, payload, cancelBookingCode, force);
        
        snackbarText.value = '新增預約成功！';
        snackbar.value = true;
        isAddDialogVisible.value = false;
        isDuplicateDialogVisible.value = false;
        isForceSaveDialogVisible.value = false; // 關閉強制儲存視窗
        await fetchData();

    } catch (err) {
        // 檢查是否為我們自訂的驗證錯誤
        if (err.message.includes('VALIDATION_FAILED:') || err.message.includes('SLOT_FULL:')) {
            validationErrorReason.value = err.message.split(': ')[1]; // 提取錯誤原因
            tempCancelBookingCode.value = cancelBookingCode; // 暫存 booking code
            isForceSaveDialogVisible.value = true; // 彈出強制儲存視窗
        } else {
            error.value = `儲存失敗: ${err.message}`;
            alert(`儲存失敗: ${err.message}`);
        }
    } finally {
        isSaving.value = false;
    }
}

function promptCancelBooking(event) { 
  eventToCancel.value = event; 
  isCancelConfirmDialogVisible.value = true; 
}

async function handleConfirmCancelBooking() {
    isCancelling.value = true;
    try {
        // 從 eventToCancel.value 中獲取所需的參數
        const appointmentId = eventToCancel.value.id;
        const projectId = eventToCancel.value.projectId;
        const unitId = eventToCancel.value.unitId;
        const bookingType = eventToCancel.value.bookingType;

        // 呼叫修改後的 cancelAppointment 函式，傳遞所有必要參數
        await cancelAppointment(appointmentId, projectId, unitId, bookingType);
        
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

// --- 生命週期與初始資料載入 ---
onMounted(async () => {
  pageContextStore.$patch({
    title: '驗屋預約管理',
    path: route.path,
  });
  
  isLoading.value = true;
  
  try {
    // 步驟 1: 直接檢查您自己的登入系統狀態
    if (!userStore.isLoggedIn) {
      console.warn('使用者未登入 (根據 userStore)，將重導向至登入頁面。');
      router.push({ name: 'Login' });
      // 拋出錯誤以中斷後續的所有資料載入
      throw new Error('使用者未登入');
    }

    
    await Promise.all([
      projectStore.fetchProjects(),
      userStore.loadUserPreferencesFromDatabase()
    ]);

    const dateRangeData = await fetchAppointmentDateRange(projectId.value);
    minSelectableDate.value = dateRangeData.minDate;
    maxSelectableDate.value = dateRangeData.maxDate;
    
    dateRange.value = [startDate.value, endDate.value];

    projectSettings.value = await fetchProjectConfig(projectId.value);
    
    // 初始載入行事曆資料
    await fetchData();

  } catch (err) {
    // 只有在不是「使用者未登入」這個我們自己拋出的錯誤時，才顯示錯誤訊息
    if (err.message !== '使用者未登入') {
        console.error('初始化頁面失敗:', err);
        error.value = `無法載入預約資料：${err.message}`;
    }
  } finally {
    isLoading.value = false;
  }
});


// 清理頁面上下文
onUnmounted(() => {
  pageContextStore.clearContext();
});


// --- 其他輔助函式 ---

function handleCopy(value) { const { copy } = useClipboard({ source: value }); copy(value); snackbarText.value = '已複製到剪貼簿！'; snackbar.value = true; }
function openUrl(url) { if (url) window.open(url, '_blank', 'noopener,noreferrer'); }
function getEventStyle(event) {
  if (!event || Object.keys(event).length === 0) return { backgroundColor: '#FFFFFF', color: '#000000' };
  if (event.status === '取消') return { backgroundColor: '#F5F5F5', color: '#9E9E9E' };
  if (event.status === '已完成') return { backgroundColor: '#ECEFF1', color: '#546E7A' };
  const textToSearch = [ event.bookingType, event.inspectionMethod, event.specialRemarks, event.specialRemarks2 ].join(' ');
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
  const textToSearch = [ event.bookingType, event.inspectionMethod, event.specialRemarks, event.specialRemarks2 ].join(' ');
  for (const config of EXCEL_KEYWORD_COLOR_MAP) {
    if (config.keyword && textToSearch.includes(config.keyword)) return { backgroundColor: config.backgroundColor, textColor: config.textColor };
  }
  return { backgroundColor: 'EEEEEE', textColor: '212121' };
}

// 安全格式化日期的輔助函式
function safeFormatDate(value, formatString = 'yyyy-MM-dd') {
  if (!value) return '';

  // 情況 1: 這是個標準的 Firestore Timestamp 物件，有 .toDate() 方法
  if (typeof value.toDate === 'function') {
    return format(value.toDate(), formatString);
  }

  // 情況 2: 這是一個看起來像 Timestamp 的普通物件 (有 seconds 屬性)
  if (typeof value === 'object' && value !== null && typeof value.seconds === 'number') {
    // 從秒數建立一個新的 Date 物件
    return format(new Date(value.seconds * 1000), formatString);
  }
  
  // 情況 3: 這是一個普通的 JS Date 物件或可以被解析的日期字串
  const date = new Date(value);
  if (isNaN(date.getTime())) {
    // 如果解析失敗，直接回傳原始值，避免畫面崩潰
    return String(value); 
  }
  
  return format(date, formatString);
}


const getVisibleFields = (fields, isAdding = false) => {
    if (isAdding || isEditMode.value) {
        let fieldsToHide = ['填表時間'];
        if (isAdding) {
            fieldsToHide.push('預約代碼');
        }
        return fields.filter(field => !fieldsToHide.includes(field.key));
    }

    if (selectedEvent.value) {
        return fields.filter(field => {
            if (['受託人姓名', '受託人電話'].includes(field.key)) {
                return selectedEvent.value[field.key];
            }
            return true;
        });
    }

    return [];
};


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
    const timeKey = timeSlots.value.find((slot, index) => {
        const nextSlot = timeSlots.value[index + 1] || '23:59';
        return eventStartTime >= slot && eventStartTime < nextSlot;
    }) || timeSlots.value[0];

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
    titleElement.textContent = `${projectName.value} - 驗屋時間表: ${format(firstDate, 'yyyy/MM/dd')} - ${format(lastDate, 'yyyy/MM/dd')}`;
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
      { key: 'appointmentTimeSlot', label: '時間', wch: 12 }, // [修正] 將 key 從 '預約時段' 改為 'appointmentTimeSlot'
      ...selectedOptions.map(option => ({
        key: option.key,
        label: option.label,
        wch: 20
      })),
      { key: 'status', label: '狀態', wch: 12 }, // [修正] 將 key 從 '預約狀態' 改為 'status'
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
    ws['A1'] = { v: `${projectName.value} - 驗屋時間表`, t: 's', s: mainTitleStyle };
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
              ws[cellRef] = { v: event[header.key] || '', t: 's', s: finalCellStyle };
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
    XLSX.utils.book_append_sheet(wb, ws, "驗屋時間表");
    const fileName = `${projectName.value}_驗屋預約表_${format(new Date(), 'yyyyMMdd')}.xlsx`;
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

async function handleRefresh() {
  await fetchData();
  snackbarText.value = '日曆資料已更新';
  snackbar.value = true;
}
// --- 操作說明邏輯 ---
const tour = new Shepherd.Tour({ /* ... */ });
const tourSteps = [ /* ... */ ];
tour.addSteps(tourSteps);
function startTour() { tour.start(); }
// --- 操作說明邏輯結束 ---

// 驗屋預約管理【新增】導航到戶別資料 Grid 頁面的函式
function navigateToHouseholdGrid() {
  router.push({ 
    name: 'HouseholdGrid', 
    params: { projectId: projectId.value } 
  });
}


</script>



<style>
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