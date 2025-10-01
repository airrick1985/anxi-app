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

             <v-btn color="blue-grey" @click="navigateToHouseholdGrid" prepend-icon="mdi-table-large">
              戶別資料管理
            </v-btn>

           <v-btn v-if="canEdit" color="deep-purple-lighten-1" @click="navigateToRuleManager" prepend-icon="mdi-cogs">
              預約批次及系統管理
            </v-btn>
            

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

          <div class="d-md-none">
            <v-menu location="bottom end">
              <template v-slot:activator="{ props }">
                <v-btn v-bind="props" icon="mdi-dots-vertical" variant="text"></v-btn>
              </template>
              <v-list density="compact">
                <v-list-item prepend-icon="mdi-table-large" title="戶別資料管理" @click="navigateToHouseholdGrid"></v-list-item>  
                <v-list-item v-if="canEdit" prepend-icon="mdi-cogs" title="預約批次系統管理" @click="navigateToRuleManager"></v-list-item>
                <v-list-item v-if="canEdit" prepend-icon="mdi-calendar-plus" title="新增預約" @click="handleOpenAddDialog"></v-list-item>
                <v-list-item prepend-icon="mdi-refresh" title="重新整理" @click="handleRefresh" :disabled="isLoading">
                  <template v-slot:append>
                    <v-progress-circular v-if="isLoading" indeterminate color="grey" size="20" width="2"></v-progress-circular>
                  </template>
                </v-list-item>
                <v-list-item prepend-icon="mdi-filter-variant" title="篩選" @click="isFilterDrawerVisible = true"></v-list-item>
                <v-list-item prepend-icon="mdi-image-area" title="下載時間表 (PNG)" @click="handleDownloadPng" :disabled="isDownloadingPdf">
                  <template v-slot:append>
                    <v-progress-circular v-if="isDownloadingPdf" indeterminate color="primary" size="20" width="2"></v-progress-circular>
                  </template>
                </v-list-item>
                <v-list-item prepend-icon="mdi-microsoft-excel" title="下載時間表 (Excel)" @click="handleDownloadExcel" :disabled="isDownloadingExcel">
                   <template v-slot:append>
                    <v-progress-circular v-if="isDownloadingExcel" indeterminate color="teal-darken-1" size="20" width="2"></v-progress-circular>
                  </template>
                </v-list-item>
              </v-list>
            </v-menu>
          </div>
        </div>
      </v-card-title>

      <v-alert v-if="error" type="error" variant="tonal" class="mb-4" :text="error"></v-alert>

      <div v-if="isLoading" class="text-center pa-10">
        <v-progress-circular indeterminate color="primary" size="64"></v-progress-circular>
        <div class="mt-4">資料載入中...</div>
      </div>

      <div v-if="!isLoading && !error">
        <v-row id="filter-panel" class="mb-4 align-center bg-grey-lighten-4 pa-3 rounded d-none d-md-flex" dense>
          <v-col cols="12" sm="4" md="2">
            <v-text-field v-model="startDateFormatted" label="開始日期" type="date" density="compact" hide-details></v-text-field>
          </v-col>
          <v-col cols="12" sm="4" md="2">
            <v-text-field v-model="endDateFormatted" label="結束日期" type="date" density="compact" hide-details></v-text-field>
          </v-col>
          <v-col cols="12" sm="4" md="3">
            <v-text-field v-model="searchQuery" label="關鍵字搜尋..." prepend-inner-icon="mdi-magnify" density="compact" hide-details clearable variant="outlined" color="primary"></v-text-field>
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
                  <th class="time-header" >時間</th>
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

    <v-dialog v-model="isDialogVisible" max-width="800px" persistent scrollable>
      <v-card v-if="selectedEvent">
        <v-card-title class="text-h6 primary-bg d-flex align-center" v-draggable-dialog>
          <v-icon start>mdi-calendar-text</v-icon>
          <span>預約詳細資訊</span>
          <v-spacer></v-spacer>
          <v-btn variant="text" icon="mdi-close" density="compact" @click="isDialogVisible = false"></v-btn>
        </v-card-title>
        
        <v-card-text>
            <div class="bg-grey-lighten-5 pa-4">
              <v-row align="center" dense>
                  <v-col cols="12" sm="2">
                    <div class="text-caption text-grey-darken-1">戶別</div>
                    <div class="text-h5 font-weight-bold text-primary">{{ selectedEvent.unitId }}</div>
                  </v-col>
                  
                  <v-col cols="12" sm="5">
                      <div class="text-caption text-grey-darken-1">預約日期與時段</div>
 <div v-if="!isEditMode" class="text-body-1 font-weight-medium">
                          {{ safeFormatDate(selectedEvent.appointmentDate, 'yyyy-MM-dd') }}
                          <v-icon size="small" class="mx-1">mdi-clock-outline</v-icon>
                          {{ selectedEvent.appointmentTimeSlot }}
                      </div>
                      <div v-else>
                          <!-- [修改] 將原本的 v-text-field 替換為與新增模式相同的元件 -->
                          <div class="d-flex flex-column flex-sm-row ga-2">
                             <v-text-field
                                v-model="editableEvent.appointmentDate"
                                label="預約日期"
                                type="date"
                                density="compact"
                                hide-details="auto"
                                style="min-width: 155px;"
                              ></v-text-field>
                            <v-combobox
                                v-model="editableEvent.appointmentTimeSlot"
                                :items="timeSlotOptions"
                                label="預約時段"
                                :placeholder="isDateInBatch ? '請選擇時段' : '格式 HH:mm'"
                                :rules="timeSlotRules"
                                :loading="isTimeSlotLoading"
                                :disabled="!editableEvent.appointmentDate"
                                density="compact"
                                hide-details="auto"
                                no-data-text="此日期無可用時段"
                                style="min-width: 200px;"
                              ></v-combobox>
                          </div>
                      </div>
                  </v-col>

                  <v-col cols="12" sm="4" class="d-flex flex-wrap ga-2 justify-start justify-sm-end">
                    <v-chip :style="getAppointmentItemStyle(selectedEvent.bookingType)" size="small" label>{{ selectedEvent.bookingType }}</v-chip>
                    <v-chip v-if="selectedEvent.status === '預約中'" color="success" size="small" label variant="flat"><v-icon start icon="mdi-check-circle-outline"></v-icon>{{ selectedEvent.status }}</v-chip>
                    <v-chip v-else-if="selectedEvent.status === '取消'" color="red-darken-1" size="small" label variant="tonal"><v-icon start icon="mdi-close-circle-outline"></v-icon>{{ selectedEvent.status }}</v-chip>
                    <v-chip v-else-if="selectedEvent.status === '已完成'" color="blue-grey" size="small" label variant="outlined"><v-icon start icon="mdi-check-all"></v-icon>{{ selectedEvent.status }}</v-chip>
                </v-col>

              </v-row>
              
              <v-row dense class="mt-3">
              <v-col cols="12">
                <v-select
                  v-model="editableInspectors"
                  :items="bookingOptions.inspectionStaff"
                  label="驗屋人員"
                  multiple
                  chips
                  closable-chips
                  clearable
                  density="compact"
                  variant="outlined"
                  hide-details
                  :loading="isSavingInspectors"
                  @update:model-value="handleInspectorsChange"
                ></v-select>
              </v-col>
          </v-row>
            </div>

            <v-divider></v-divider>
            
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
                            <v-list-item :class="{ 'bg-light-blue-lighten-5': item.id === selectedEvent.id }" class="py-2">
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
  <v-list lines="two" density="compact">
    <template v-for="(field, index) in getVisibleFields(panel.fields, false)" :key="field.key">
      <v-list-item>
        <template v-slot:prepend><v-icon :icon="field.icon"></v-icon></template>
        
        <!-- [重構] 編輯模式的顯示邏輯 -->
        <div v-if="isEditMode && EDITABLE_FIELDS.has(field.key)" class="mt-2">
          <!-- 根據欄位類型顯示不同的輸入元件 -->
          <v-select
            v-if="field.key === 'bookingType'"
            v-model="editableEvent.bookingType"
            :items="currentTypeOptions"
            :label="field.label"
            density="compact"
            hide-details="auto"
            variant="outlined"
          ></v-select>
          <v-select
            v-else-if="field.key === 'inspectionMethod'"
            v-model="editableEvent.inspectionMethod"
            :items="bookingOptions.inspectionMethods"
            :label="field.label"
            density="compact"
            hide-details="auto"
            variant="outlined"
          ></v-select>
          <v-text-field
            v-else-if="field.type === 'date'"
            v-model="editableEvent[field.key]"
            :label="field.label"
            type="date"
            density="compact"
            hide-details="auto"
            variant="outlined"
          ></v-text-field>
          <v-text-field
            v-else
            v-model="editableEvent[field.key]"
            :label="field.label"
            density="compact"
            hide-details="auto"
            variant="outlined"
          ></v-text-field>
        </div>

        <!-- 檢視模式的顯示邏輯 (保持不變或微調) -->
         <div v-else>
          <v-list-item-subtitle>{{ field.label }}</v-list-item-subtitle>
        <v-list-item-title>
            <!-- START: 修改驗屋報告顯示方式 -->
            <template v-if="field.key === 'inspectionReportUrl'">
              <span v-if="!inspectionReportFiles || inspectionReportFiles.length === 0">-</span>
              <v-btn
                v-else-if="inspectionReportFiles.length === 1"
                variant="text"
                size="small"
                :href="inspectionReportFiles[0].url"
                target="_blank"
                rel="noopener noreferrer"
                @click.stop
                class="text-none pa-1"
                color="primary"
              >
                <template v-slot:prepend>
                  <v-icon color="red" size="30">mdi-file-pdf-box</v-icon>
                </template>
                {{ inspectionReportFiles[0].name }}
              </v-btn>
              <v-menu v-else location="bottom">
                <template v-slot:activator="{ props }">
                  <v-btn
                    v-bind="props"
                    variant="tonal"
                    color="primary"
                    size="small"
                    append-icon="mdi-menu-down"
                  >
                    查看報告 ({{ inspectionReportFiles.length }})
                  </v-btn>
                </template>
                <v-list density="compact">
                  <v-list-item
                    v-for="(file, index) in inspectionReportFiles"
                    :key="index"
                    :href="file.url"
                    target="_blank"
                    rel="noopener noreferrer"
                    @click.stop
                  >
                    <template v-slot:prepend>
                      <v-icon color="red" size="30">mdi-file-pdf-box</v-icon>
                    </template>
                    <v-list-item-title>{{ file.name }}</v-list-item-title>
                  </v-list-item>
                </v-list>
              </v-menu>
            </template>
            <!-- END: 修改驗屋報告顯示方式 -->
            <template v-else-if="field.type === 'button'">
              <v-btn v-if="selectedEvent[field.key]" :color="field.key === 'inspectionReportUrl' ? 'red-darken-4' : 'primary'" size="small" variant="tonal" @click="openUrl(selectedEvent[field.key])">
                <v-icon start icon="mdi-launch"></v-icon>開啟{{ field.label }}
              </v-btn>
              <span v-else>未提供</span>
            </template>
            <template v-else-if="field.type === 'booking-datetime-select'">
              <span>
                {{ safeFormatDate(selectedEvent.appointmentDate, 'yyyy-MM-dd') }}
                <v-icon size="x-small" class="mx-1">mdi-clock-time-four-outline</v-icon>
                {{ selectedEvent.appointmentTimeSlot }}
              </span>
            </template>
            <template v-else-if="field.type === 'date'">
              {{ safeFormatDate(selectedEvent[field.key]) }}
            </template>
            <template v-else>{{ selectedEvent[field.key] || '無' }}</template>
          </v-list-item-title>
        </div>
      </v-list-item>
      <v-divider v-if="index < getVisibleFields(panel.fields, false).length -1"></v-divider>
    </template>
  </v-list>
                    </v-expansion-panel-text>
                  </template>
                </v-expansion-panel>
            </v-expansion-panels>
          </v-card-text>
        
        <v-divider></v-divider>
        <v-card-actions class="pa-3">
          <div v-if="!isEditMode" class="d-flex w-100">
            <v-btn v-if="canEdit" color="red" variant="tonal" @click="promptCancelBooking(selectedEvent)">取消此預約</v-btn>
            <v-spacer></v-spacer>
            <v-btn color="grey-darken-1" variant="text" @click="isDialogVisible = false">關閉</v-btn>
            <v-btn v-if="canEdit" color="primary" variant="flat" @click="enterEditMode">編輯</v-btn>
          </div>
          <div v-else class="d-flex w-100">
            <v-spacer></v-spacer>
            <v-btn color="grey-darken-1" variant="text" @click="isEditMode = false">取消</v-btn>
            <v-btn color="success" variant="flat" :loading="isSaving" @click="saveChanges">儲存</v-btn>
          </div>
        </v-card-actions>
      </v-card>
    </v-dialog>
    
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
                                  <v-select v-model="newAppointmentData.building" :items="buildingOptions" label="棟別" :rules="[v => !!v || '必須選擇棟別']" density="compact" hide-details="auto"></v-select>
                              </v-col>
                              <v-col cols="12" sm="6">
                                  <v-select v-model="newAppointmentData.unitId" :items="unitOptions" label="戶別" :disabled="!newAppointmentData.building" :rules="[v => !!v || '必須選擇戶別']" density="compact" hide-details="auto" no-data-text="請先選棟別"></v-select>
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
                                          <v-list-item class="py-2">
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
                                  <v-list lines="two" density="compact">
                                      <template v-for="(field, index) in getVisibleFields(panel.fields, true)" :key="field.key">
                                          <v-list-item>
                                              <template v-slot:prepend><v-icon :icon="field.icon"></v-icon></template>
                                              <div class="mt-1">
                                                <v-select 
                                                    v-if="field.type === 'booking-item-select'"
                                                    v-model="newAppointmentData.bookingType" 
                                                    :items="currentTypeOptions" 
                                                    :label="field.label" 
                                                    :disabled="!newAppointmentData.unitId" 
                                                    :rules="[v => !!v || '必須選擇預約項目']" 
                                                    density="compact" 
                                                    hide-details="auto" 
                                                    no-data-text="請先選戶別">
                                                </v-select>
                                                
                                                <div v-else-if="field.type === 'booking-datetime-select'">
                                                          <v-list-item-subtitle class="mb-2">{{ field.label }}</v-list-item-subtitle>
                                                          <div class="d-flex flex-column flex-sm-row ga-2">
                                                              <v-text-field 
                                                                  v-model="newAppointmentData.appointmentDate"
                                                                  label="預約日期" 
                                                                  type="date"
                                                                  density="compact" 
                                                                  hide-details="auto" 
                                                                  :rules="[v => !!v || '必須選擇日期']" 
                                                              ></v-text-field>
                                                              
                                                                <v-combobox
                                                              v-model="newAppointmentData.appointmentTimeSlot"
                                                              :items="timeSlotOptions"
                                                              label="預約時段"
                                                              :placeholder="isDateInBatch ? '請選擇時段' : '格式 HH:mm'"
                                                              :rules="timeSlotRules"
                                                              :loading="isTimeSlotLoading"
                                                              :disabled="!newAppointmentData.appointmentDate"
                                                              density="compact"
                                                              hide-details="auto"
                                                              no-data-text="此日期無可用時段"
                                                          >
                                                          </v-combobox>
                                                          </div>
                                                      </div>
                                                <v-text-field v-else-if="field.key === 'address' || field.key === 'parkingLots'" v-model="newAppointmentData[field.key]" :label="field.label" density="compact" hide-details readonly variant="filled"></v-text-field>
                                                <div v-else-if="field.type === 'button'" class="pt-2">
                                                    <v-list-item-subtitle class="mb-2">{{ field.label }}</v-list-item-subtitle>
                                                    <v-btn v-if="newAppointmentData[field.key]" :color="field.key === 'inspectionReportUrl' ? 'red-darken-4' : 'primary'" size="small" variant="tonal" @click="openUrl(newAppointmentData[field.key])">
                                                        <v-icon start icon="mdi-launch"></v-icon>開啟{{ field.label }}
                                                    </v-btn>
                                                    <span v-else class="text-grey-darken-1">未提供</span>
                                                </div>
                                                <v-select v-else-if="field.key === 'inspectionMethod'" v-model="newAppointmentData[field.key]" :items="bookingOptions.inspectionMethods" :label="field.label" density="compact" hide-details></v-select>
                                                <v-text-field v-else-if="field.type === 'date'" v-model="newAppointmentData[field.key]" :label="field.label" type="date" density="compact" hide-details></v-text-field>
                                                <v-text-field v-else v-model="newAppointmentData[field.key]" :label="field.label" density="compact" hide-details></v-text-field>
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

    <v-navigation-drawer v-model="isFilterDrawerVisible" location="right" temporary width="300">
      <v-sheet class="d-flex flex-column h-100">
        <v-list-item title="篩選條件" subtitle="請選擇您的篩選範圍" class="bg-grey-lighten-3">
          <template v-slot:append>
            <v-btn variant="text" icon="mdi-close" @click="isFilterDrawerVisible = false"></v-btn>
          </template>
        </v-list-item>
        <v-divider></v-divider>
        <div class="pa-4" style="overflow-y: auto;">
          <v-label class="mb-2">日期範圍</v-label>
          <v-text-field v-model="startDateFormatted" label="開始日期" type="date" density="compact" class="mb-3"></v-text-field>
          <v-text-field v-model="endDateFormatted" label="結束日期" type="date" density="compact" class="mb-3"></v-text-field>
          <v-divider class="my-3"></v-divider>
          <v-text-field v-model="searchQuery" label="關鍵字搜尋..." prepend-inner-icon="mdi-magnify" density="compact" clearable variant="outlined" color="primary" class="mb-3"></v-text-field>
          <v-divider class="my-3"></v-divider>
          <div>
            <v-label class="mb-2">狀態</v-label>
            <v-checkbox v-model="selectedStatuses" label="預約中" value="預約中" density="compact" hide-details color="primary"></v-checkbox>
            <v-checkbox v-model="selectedStatuses" label="取消" value="取消" density="compact" hide-details color="error"></v-checkbox>
          </div>
          <v-divider class="my-3"></v-divider>
          <div>
            <v-label class="mb-2">項目</v-label>
            <v-checkbox v-for="itemType in currentTypeOptions" :key="itemType" v-model="selectedTypes" :label="itemType" :value="itemType" density="compact" hide-details color="teal-darken-1"></v-checkbox>
          </div>
          <v-divider class="my-3"></v-divider>
          <div>
            <v-label class="mb-2">標題顯示</v-label>
            <v-checkbox v-for="field in displayFieldOptions" :key="field.key" v-model="selectedDisplayFields" :label="field.label" :value="field.key" density="compact" hide-details color="indigo"></v-checkbox>
          </div>
        </div>
        <v-spacer></v-spacer>
        <div class="pa-2 bg-grey-lighten-4">
          <v-btn color="primary" block @click="isFilterDrawerVisible = false">完成</v-btn>
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
</template>

<script setup>
import { usePageContextStore } from '@/store/pageContextStore';
import { useProjectStore } from '@/store/projectStore'; 
import Shepherd from 'shepherd.js';
import 'shepherd.js/dist/css/shepherd.css';
import { ref, onMounted, computed, watch, reactive, onUnmounted ,nextTick} from 'vue';
import { useRoute, useRouter } from 'vue-router'; 
import { useUserStore } from '@/store/user';
import { 
  fetchCalendarData,
  fetchBookingOptions,
  updateAppointment,
  cancelAppointment,
  addAppointmentAdmin,
  getAllBookingRules,
  searchAppointments,
  updateAppointmentInspectors,
  fetchAllHouseholdsForProject,
  getSlotsForAdmin, 
  fetchProjectConfig, 
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
const APPOINTMENT_FIELDS = ['bookerName', 'bookerPhone', 'bookerIdNumber' ,'bookerEmail', 'appointmentDate', 'appointmentTimeSlot', 'inspectionMethod', 'inspectionCompanyName', 'inspectors', 'bookingRemarks', 'agentName', 'agentIdNumber', 'agentPhone', 'bookingType', 'status', 'checkInStatus', 'specialRemarks', 'specialRemarks2', 'handoverTime'];
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
const isSearching = ref(false);
const searchResults = ref(null); // null 代表不在搜尋模式，[] 代表搜尋但沒結果


 // 新增 foundDates computed 屬性，用來從搜尋結果中提取日期
 const foundDates = computed(() => {
  if (searchResults.value && searchResults.value.length > 0) {
    const dates = new Set(
      searchResults.value.map(event => safeFormatDate(event.appointmentDate, 'yyyy-MM-dd'))
    );
    return Array.from(dates);
  }
  return [];
 });



const startDate = ref(startOfWeek(new Date(), { weekStartsOn: 1 }));
const endDate = ref(endOfWeek(new Date(), { weekStartsOn: 1 }));
const isCancelConfirmDialogVisible = ref(false);
const eventToCancel = ref(null);
const isFilterDrawerVisible = ref(false);
const snackbar = ref(false);
const snackbarText = ref('');
const panels = ref([]);
const addDateMenu = ref(false); 
const isEditMode = ref(false);
const editableEvent = ref(null);
const isSaving = ref(false);
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
const timeSlots = computed(() => PROJECT_TIME_SLOTS[projectName.value] || PROJECT_TIME_SLOTS.default);

// 核心修改 filteredAppointments 現在會優先顯示搜尋結果
const filteredAppointments = computed(() => {
  // 如果處於搜尋模式 (searchResults 不是 null)
  if (searchResults.value !== null) {
    return processAppointments(searchResults.value);
  }

  // 否則，使用舊的篩選邏輯，但作用於已載入的 allAppointments
  return processAppointments(allAppointments.value).filter(appt => {
    const statusMatch = selectedStatuses.value.includes(appt.status);
    const typeMatch = selectedTypes.value.includes(appt.bookingType);
    return statusMatch && typeMatch;
  });
});

const dateChunks = computed(() => { 
  const query = searchQuery.value ? searchQuery.value.trim() : '';
  if (query && foundDates.value.length > 0) {
    const startOfWeeks = [...new Set(foundDates.value.map(dateStr => format(startOfWeek(new Date(dateStr), { weekStartsOn: 1 }), 'yyyy-MM-dd')))].sort();
    return startOfWeeks.map(weekStartStr => {
      const chunk = [];
      const current = new Date(weekStartStr);
      for (let i = 0; i < 7; i++) {
        const date = addDays(current, i);
        chunk.push({
          dateObj: date, dayName: format(date, 'EEEE', { locale: zhTW }),
          date: format(date, 'M/d'), fullDate: format(date, 'yyyy-MM-dd'),
          isInRange: true, isToday: isToday(date), isWeekend: isSaturday(date) || isSunday(date)
        });
      }
      return chunk;
    });
  } else {
    if (!startDate.value || !endDate.value) return [];
    const chunks = [];
    let current = startOfWeek(new Date(startDate.value), { weekStartsOn: 1 });
    while (current <= endDate.value) {
      const chunk = [];
      for (let i = 0; i < 7; i++) {
        const date = addDays(current, i);
        const isInRange = date >= startDate.value && date <= endDate.value;
        chunk.push({
          dateObj: date, dayName: format(date, 'EEEE', { locale: zhTW }),
          date: format(date, 'M/d'), fullDate: format(date, 'yyyy-MM-dd'),
          isInRange: isInRange, isToday: isToday(date), isWeekend: isSaturday(date) || isSunday(date)
        });
      }
      chunks.push(chunk);
      current = addDays(current, 7);
    }
    return chunks;
  }
});

// 解析搜尋關鍵字中的日期，支援多個日期
const startDateFormatted = computed({ 
  get: () => format(startDate.value, 'yyyy-MM-dd'), 
  //  START: 修改此處
  set: (val) => { 
    if (!val) return;
    // 將 'YYYY-MM-DD' 字串拆開，手動建立一個本地時區的 Date 物件
    // 這樣可以避免瀏覽器將其錯誤地解析為 UTC 時間
    const [year, month, day] = val.split('-').map(Number);
    startDate.value = new Date(year, month - 1, day); 
  }
  //  END: 修改結束
});

// 解析搜尋關鍵字中的日期，支援多個日期
const endDateFormatted = computed({ 
  get: () => format(endDate.value, 'yyyy-MM-dd'), 
  //  START: 修改此處
  set: (val) => { 
    if (!val) return;
    const [year, month, day] = val.split('-').map(Number);
    endDate.value = new Date(year, month - 1, day); 
  }
  //  END: 修改結束
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

const inspectionReportFiles = computed(() => {
  if (!selectedEvent.value || !selectedEvent.value.inspectionReportUrl) {
    return [];
  }
  const value = selectedEvent.value.inspectionReportUrl;
  if (Array.isArray(value)) {
    // 確保陣列中的每個項目都符合 { name, url } 的格式
    return value.filter(item => item && typeof item.name === 'string' && typeof item.url === 'string');
  }
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
    console.log(`Week starting ${weekStartStr} is already loaded.`);
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
    // 首先，確保 projectStore 已載入所有專案資料
    await projectStore.fetchProjects();

    // 從 store 直接獲取並驗證建案名稱 (保留上次的修正)
    const currentProjectName = projectStore.idToNameMap[projectId.value];
    if (!currentProjectName) {
      throw new Error(`在專案列表中找不到 ID 為 "${projectId.value}" 的建案名稱。`);
    }

    // 當 projectStore 準備好後，再繼續獲取日曆頁面需要的其他資料
    const [calendarData, optionsData, rulesData] = await Promise.all([
      // 驗屋預約管理 START: 新增修改處
      // 傳入當前元件狀態中已有的 startDate.value 和 endDate.value
      fetchCalendarData(projectId.value, startDate.value, endDate.value),
      // 驗屋預約管理 END: 新增修改處
      fetchBookingOptions(projectId.value),
      // 使用剛剛驗證過的變數 (保留上次的修正)
      getAllBookingRules(currentProjectName) 
    ]);
    
    allAppointments.value = calendarData;
    
    bookingOptions.value = optionsData;

    if (rulesData.status === 'success') {
      allBookingRules.value = rulesData.data;
    } else {
      console.warn('無法獲取預約規則資料:', rulesData.message);
      allBookingRules.value = null; 
    }

  } catch (err) {
    console.error('獲取資料失敗:', err);
    error.value = err.message;
  } finally {
    isLoading.value = false;
  }
}

// 驗屋預約管理 --- 獲取所有戶別資料 ---
function processAppointments(rawAppointments) {
  return rawAppointments.map(appt => {
      try {
        if (!appt.appointmentDate || !appt.appointmentDate.toDate) return null;
        
        const date = appt.appointmentDate.toDate();
        const dateStr = format(date, 'yyyy-MM-dd');
        
        //  START: 修改此處的錯誤處理邏輯
        const timeSlotString = appt.appointmentTimeSlot ? String(appt.appointmentTimeSlot) : '';
        
        // 使用正規表示式安全地匹配 HH:mm 或 HH：mm 格式的時間
        const timeMatch = timeSlotString.match(/(\d{1,2}[:：]\d{2})/); 
        
        // 如果成功匹配到時間，就使用它；如果沒有，則給一個安全的預設值 '00:00'
        const startTime = timeMatch ? timeMatch[0].replace(/：/g, ':') : '00:00';
        //  END: 修改結束

        const displayParts = displayFieldOptions.value
          .filter(option => selectedDisplayFields.value.includes(option.key))
          .map(option => {
            const value = appt[option.key];
            if (!value) return null;
            const formattedValue = option.formatter ? option.formatter(value) : String(value);
            return { text: formattedValue, isHousehold: option.key === 'unitId' };
          }).filter(Boolean);
        
        const finalStartObject = parseISO(`${dateStr}T${startTime}`);

        // 再次驗證最終產生的日期物件是否有效
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

function handleCustomEventClick(event) {
  selectedEvent.value = event;
  isEditMode.value = false;
  panels.value = [];

  // 驗屋預約管理 START: 新增邏輯，將 inspectors 欄位安全地轉換為陣列
  const currentInspectors = selectedEvent.value?.inspectors;
  if (typeof currentInspectors === 'string' && currentInspectors) {
    // 如果是字串，以逗號分割成陣列
    editableInspectors.value = currentInspectors.split(',').map(name => name.trim()).filter(Boolean);
  } else if (Array.isArray(currentInspectors)) {
    // 如果已經是陣列，直接使用
    editableInspectors.value = currentInspectors;
  } else {
    // 如果是 null 或 undefined，給一個空陣列
    editableInspectors.value = [];
  }
  // 驗屋預約管理 END: 新增邏輯結束

  isDialogVisible.value = true;
}

// START: 新增處理即時儲存的函式
async function handleInspectorsChange(newInspectorsArray) {
  if (!selectedEvent.value) return;
  
  isSavingInspectors.value = true;
  try {
    // 步驟 1: 呼叫 API 更新後端資料庫 (這部分不變)
    await updateAppointmentInspectors(selectedEvent.value.id, newInspectorsArray);

    // 步驟 2: 手動更新前端的主資料陣列，以觸發畫面即時刷新
    const appointmentId = selectedEvent.value.id;
    const index = allAppointments.value.findIndex(appt => appt.id === appointmentId);

    if (index !== -1) {
      // 找到了對應的預約，直接更新它的 inspectors 欄位
      allAppointments.value[index].inspectors = newInspectorsArray.join(',');
    }

    // 步驟 3: 更新彈出視窗內的資料 (可選，但能確保一致性)
    selectedEvent.value.inspectors = newInspectorsArray.join(',');

    showSnackbar('驗屋人員已更新', 'success');

  } catch (err) {
    showSnackbar(`更新失敗: ${err.message}`, 'error');
  } finally {
    isSavingInspectors.value = false;
  }
}
// END: 新增函式結束


// START: 新增一個 showSnackbar 輔助函式 (如果您的檔案中還沒有的話)
function showSnackbar(text, color = 'success') {
  snackbarText.value = text;
  snackbar.value = true; // 假設您的 snackbar v-model 綁定的是 snackbar
}
// END: 新增函式結束


function enterEditMode() {
  // [重構] 使用更穩健的方式建立可編輯的事件複本
  const cleanCopy = {};
  for (const key in selectedEvent.value) {
    const value = selectedEvent.value[key];
    
    // 針對日期欄位進行安全格式化
    if (['appointmentDate', 'appropriationDate'].includes(key)) {
      cleanCopy[key] = safeFormatDate(value, 'yyyy-MM-dd');
    } 
    // 針對驗屋人員欄位，確保是陣列格式
    else if (key === 'inspectors') {
      if (typeof value === 'string' && value) {
        cleanCopy[key] = value.split(',').map(name => name.trim()).filter(Boolean);
      } else if (Array.isArray(value)) {
        cleanCopy[key] = value;
      } else {
        cleanCopy[key] = [];
      }
    } 
    // 其他欄位，確保 null/undefined 變為空字串
    else {
      cleanCopy[key] = value ?? '';
    }
  }
  
  editableEvent.value = cleanCopy;
  isEditMode.value = true;
}

async function saveChanges() {
    isSaving.value = true;
    error.value = null;
    try {
        const bookingPayload = {};
        const householdPayload = {};
        const allKeys = new Set([...Object.keys(selectedEvent.value), ...Object.keys(editableEvent.value)]);
        
        allKeys.forEach(key => {
            let originalValue = selectedEvent.value[key];
            let editedValue = editableEvent.value[key];

            if (key === 'inspectors' && Array.isArray(editedValue)) {
                editedValue = editedValue.join(',');
            }
            if (originalValue?.toDate) {
                originalValue = format(originalValue.toDate(), 'yyyy-MM-dd');
            }

            if (String(originalValue ?? '') !== String(editedValue ?? '')) {
                if (APPOINTMENT_FIELDS.includes(key)) {
                    bookingPayload[key] = editedValue;
                } else if (HOUSEHOLD_FIELDS.includes(key)) {
                    householdPayload[key] = editedValue;
                }
            }
        });

        const householdDocId = `${projectId.value}_${selectedEvent.value.unitId}`;
        const response = await updateAppointment(selectedEvent.value.id, bookingPayload, householdDocId, householdPayload);

        if (response.status === 'no_changes') {
            snackbarText.value = '沒有偵測到任何變更。';
        } else {
            snackbarText.value = '儲存成功！';
            await fetchData();
        }
        snackbar.value = true;
        isDialogVisible.value = false;
        isEditMode.value = false;
    } catch (err) {
        error.value = `儲存失敗: ${err.message}`;
        alert(`儲存失敗: ${err.message}`);
    } finally {
        isSaving.value = false;
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

// 驗屋預約管理【新增】監聽日期範圍的變化，自動載入新資料
watch([startDate, endDate], async ([newStart, newEnd], [oldStart, oldEnd]) => {
  // 只有當日期實際發生變化時才觸發
  // 檢查日期物件的 getTime() 值，確保是實質性的日期變更
  if (newStart && newEnd && (newStart.getTime() !== oldStart.getTime() || newEnd.getTime() !== oldEnd.getTime())) {
    console.log('日期範圍變更，重新載入資料...');
    // 清空已載入的週記錄，確保 fetchData 重新獲取所有資料
    loadedWeeks.value.clear();
    // 呼叫 fetchData 重新載入所有相關資料，包括日曆事件
    await fetchData();
  }
});

// 驗屋預約管理【新增】監聽搜尋框的變化，觸發後端搜尋
let searchTimeout = null;
watch(searchQuery, (newQuery) => {
  clearTimeout(searchTimeout);
  
  if (!newQuery) {
    // 如果搜尋框清空，退出搜尋模式
    searchResults.value = null;
    isSearching.value = false;
    return;
  }

  // Debounce: 延遲 500ms 後執行搜尋，避免使用者每打一個字就發一次請求
  searchTimeout = setTimeout(async () => {
    isSearching.value = true;
    const result = await searchAppointments(projectId.value, newQuery);
    if (result.status === 'success') {
      searchResults.value = result.data;
    } else {
      error.value = result.message;
      searchResults.value = []; // 搜尋出錯時，顯示空結果
    }
    isSearching.value = false;
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
            //  START: 修改此處，明確地將資料庫欄位對應到表單欄位
            
            // 1. 自動帶入與戶別直接相關的固定欄位
            newAppointmentData.address = data.address || '';
            newAppointmentData.parkingLots = data.parkingLots || '';
            newAppointmentData.initialInspectionBatch = data.initialInspectionBatch || '';
            newAppointmentData.reInspectionBatch = data.reInspectionBatch || '';

            // 2. 將「買方資料」預設填入為「預約人資料」
            newAppointmentData.bookerName = data.buyerName || '';
            newAppointmentData.bookerPhone = data.buyerPhone || '';
            newAppointmentData.bookerEmail = data.buyerEmail || '';
            newAppointmentData.bookerIdNumber = data.buyerIdNumber || '';
            
            // 3. 也可以帶入其他 households 集合中的欄位
            newAppointmentData.buyerName = data.buyerName || ''; // 假設 newAppointmentData 也有 buyerName
            newAppointmentData.buyerPhone = data.buyerPhone || '';
            newAppointmentData.buyerEmail = data.buyerEmail || '';
            newAppointmentData.buyerIdNumber = data.buyerIdNumber || '';
            newAppointmentData.appropriationDate = data.appropriationDate || '';
            newAppointmentData.bank = data.bank || '';
            newAppointmentData.remarks = data.remarks || '';
            
            //  END: 修改結束

            panels.value = [0, 1, 2, 3]; // 自動展開所有面板
        }
    } else {
        const building = newAppointmentData.building;
        resetNewAppointmentForm();
        newAppointmentData.building = building;
    }
});

// [新增] 監聽【編輯模式】下預約時段的變化，自動清除後綴
watch(
    () => editableEvent.value?.appointmentTimeSlot,
    (newValue) => {
        // 只有在編輯模式下才觸發
        if (!isEditMode.value) return;

        if (typeof newValue === 'string' && newValue.includes('(')) {
            const match = newValue.match(/^(\d{1,2}:\d{2})/);
            if (match) {
                nextTick(() => {
                    if (editableEvent.value) {
                        editableEvent.value.appointmentTimeSlot = match[1];
                    }
                });
            }
        }
    }
);

// [新增] 監聽【編輯模式】下預約日期的變化，自動載入該日的可用時段
watch(
    () => editableEvent.value?.appointmentDate,
    async (date) => {
        // 只有在編輯模式下且有日期值時才觸發
        if (!isEditMode.value || !date) return;

        // 與新增模式共用相同的狀態 ref
        timeSlotOptions.value = [];
        isDateInBatch.value = false;
        isTimeSlotLoading.value = true;

        try {
            const dateStr = format(new Date(date), 'yyyy-MM-dd');
            const options = await getSlotsForAdmin(projectId.value, dateStr);
            
            if (options.length > 0) {
                isDateInBatch.value = true;
                timeSlotOptions.value = options;
            }
        } catch (error) {
            showSnackbar(`讀取時段失敗: ${error.message}`, 'error');
        } finally {
            isTimeSlotLoading.value = false;
        }
    }
);

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
    projectSettings.value = await fetchProjectConfig(projectId.value);

    // 確保 projectStore 也已載入
    await projectStore.fetchProjects();

  try {
    // 使用 Promise.all 並行處理所有初始資料載入，提升速度
    const [optionsData, allHouseholds, rulesData] = await Promise.all([
      fetchBookingOptions(projectId.value),
      fetchAllHouseholdsForProject(projectId.value),
      getAllBookingRules(projectId.value) //  將規則獲取合併到此處
    ]);

    // 處理選項資料
    bookingOptions.value = optionsData;
    
    // 處理戶別資料
    allHouseholdData.value = allHouseholds.reduce((acc, curr) => {
        const householdId = `${curr.projectId}_${curr.unitId}`;
        if (!acc[householdId]) { 
            acc[householdId] = { id: householdId, ...curr }; 
        }
        return acc;
    }, {});

    //  新增：處理 allBookingRules 的回傳資料
    if (rulesData.status === 'success') {
      allBookingRules.value = rulesData.data;
    } else {
      console.warn('無法獲取預約規則資料:', rulesData.message);
      allBookingRules.value = null; 
    }

  } catch(e) {
      error.value = `載入基礎資料失敗: ${e.message}`;
      showSnackbar(`載入基礎資料失敗: ${e.message}`, 'error');
  }

  // 在所有基礎資料載入完成後，才載入預設可見範圍的預約事件
  await loadAppointmentsForDateRange(startDate.value, endDate.value);
  isLoading.value = false;

  } catch (err) {
    console.error('初始化頁面失敗:', err);
    error.value = '無法載入預約資料，請稍後再試。';
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