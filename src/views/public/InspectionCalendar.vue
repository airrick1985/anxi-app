<template>
  <v-container fluid>
    <v-card class="pa-4">
      <v-card-title class="d-flex align-center justify-space-between text-h5 text-primary mb-4">
        <span>{{ pageTitle }}</span>

        <div id="action-buttons">
          <div class="d-none d-md-flex ga-2 align-center">
            <v-tooltip text="操作說明" location="bottom">
              <template v-slot:activator="{ props }">
                <v-btn v-bind="props" icon="mdi-help-circle-outline" variant="text" @click="startTour"></v-btn>
              </template>
            </v-tooltip>

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
              預約批次管理
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
                <v-list-item v-if="canEdit" prepend-icon="mdi-cogs" title="預約批次管理" @click="navigateToRuleManager"></v-list-item>
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
              　 {{ projectName }} - 驗屋時間表: {{ format(chunk[0].dateObj, 'yyyy/MM/dd') }} - {{ format(chunk[chunk.length - 1].dateObj, 'yyyy/MM/dd') }}
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
                          <div class="d-flex ga-2">
                             <v-text-field
                                v-model="editableEvent.appointmentDate"
                                label="預約日期"
                                type="date"
                                density="compact"
                                hide-details="auto"
                                style="min-width: 155px;"
                              ></v-text-field>
                            <v-text-field
                                v-model="editableEvent.appointmentTimeSlot"
                                label="預約時段"
                                density="compact"
                                hide-details="auto"
                                style="min-width: 200px;"
                              ></v-text-field>
                          </div>
                      </div>
                  </v-col>

                  <v-col cols="12" sm="4" class="d-flex flex-wrap ga-2 justify-start justify-sm-end">
                      <v-chip :style="getAppointmentItemStyle(selectedEvent.bookingType)" size="small" label>{{ selectedEvent.bookingType }}</v-chip>
                      <v-chip v-if="selectedEvent.status === '預約中'" color="success" size="small" label variant="flat"><v-icon start icon="mdi-check-circle-outline"></v-icon>{{ selectedEvent.status }}</v-chip>
                      <v-chip v-else-if="selectedEvent.status === '取消'" color="red-darken-1" size="small" label variant="tonal"><v-icon start icon="mdi-close-circle-outline"></v-icon>{{ selectedEvent.status }}</v-chip>
                  </v-col>
              </v-row>
              
              <v-row dense class="mt-3">
                  <v-col cols="12">
                    <div v-if="!isEditMode">
                        <div v-if="selectedEvent.inspectors" class="d-flex flex-wrap align-center ga-2">
                        <div class="text-caption font-weight-bold text-grey-darken-2">驗屋人員:</div>
                        <v-chip v-for="staff in String(selectedEvent.inspectors).split(',').filter(s => s.trim())" :key="staff" color="teal" variant="flat" size="small" label>
                            <v-icon start icon="mdi-account-circle-outline"></v-icon>
                            {{ staff.trim() }}
                        </v-chip>
                        </div>
                    </div>
                    <div v-else>
                        <v-select v-model="editableEvent.inspectors" :items="bookingOptions.inspectionStaff" label="驗屋人員" density="compact" multiple chips clearable hide-details variant="outlined"></v-select>
                    </div>
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
                                    <v-list-item-subtitle v-if="!isEditMode">{{ field.label }}</v-list-item-subtitle>
                                    <v-list-item-title v-if="!isEditMode || field.readOnly">
                                        <template v-if="field.type === 'button'">
                                            <v-btn v-if="selectedEvent[field.key]" :color="field.key === 'inspectionReportUrl' ? 'red-darken-4' : 'primary'" size="small" variant="tonal" @click="openUrl(selectedEvent[field.key])">
                                              <v-icon start icon="mdi-launch"></v-icon>開啟{{ field.label }}
                                            </v-btn>
                                            <span v-else>未提供</span>
                                        </template>
                                        <template v-else-if="field.type === 'date'">
                                            {{ safeFormatDate(selectedEvent[field.key]) }}
                                        </template>
                                        <template v-else>{{ selectedEvent[field.key] || '無' }}</template>
                                    </v-list-item-title>
                                    <div v-else class="mt-1">
                                      <v-select v-if="field.key === 'inspectionMethod'" v-model="editableEvent[field.key]" :items="bookingOptions.inspectionMethods" :label="field.label" density="compact" hide-details></v-select>
                                      <v-text-field v-else-if="field.type === 'date'" v-model="editableEvent[field.key]" :label="field.label" type="date" density="compact" hide-details></v-text-field>
                                      <v-text-field v-else v-model="editableEvent[field.key]" :label="field.label" density="compact" hide-details></v-text-field>
                                    </div>
                                    <template v-if="field.copyable && selectedEvent[field.key] && !isEditMode" v-slot:append>
                                      <v-btn icon="mdi-content-copy" variant="text" size="x-small" @click="handleCopy(selectedEvent[field.key])"></v-btn>
                                    </template>
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
                                                        <v-text-field 
                                                            v-model="newAppointmentData.appointmentTimeSlot" 
                                                            label="預約時段" 
                                                            density="compact" 
                                                            hide-details="auto" 
                                                            :rules="[v => !!v || '必須選擇時段']" 
                                                        ></v-text-field>
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
          <p class="mb-4">系統發現一筆與您即將新增的預約資料重複（相同戶別、相同項目），資訊如下：</p>
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
  </v-container>
</template>

<script setup>
import { usePageContextStore } from '@/store/pageContextStore';
import { useProjectStore } from '@/store/projectStore'; // ✅ 1. 引入 projectStore
import Shepherd from 'shepherd.js';
import 'shepherd.js/dist/css/shepherd.css';
import { ref, onMounted, computed, watch, reactive, onUnmounted } from 'vue';
import { useRoute, useRouter } from 'vue-router'; 
import { useUserStore } from '@/store/user';
import { 
  fetchCalendarData,
  fetchBookingOptions,
  updateAppointment,
  cancelAppointment,
  addAppointmentAdmin,
  getAllBookingRules,
} from '@/api'; 
import { format, startOfWeek, endOfWeek, addDays, isToday, isSaturday, isSunday, eachDayOfInterval, parseISO } from 'date-fns';
import { zhTW } from 'date-fns/locale';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { useClipboard } from '@vueuse/core';
import * as XLSX from 'xlsx-js-style';
import { vDraggableDialog } from '@/directives/vDraggableDialog';

// --- Store 和路由 ---
const route = useRoute();
const router = useRouter(); // ✅ 【新增】獲取 router 實例
const userStore = useUserStore();
const pageContextStore = usePageContextStore();
const projectStore = useProjectStore(); // ✅ 2. 建立 store 實例
const projectId = ref(route.params.projectId);

// --- 定義欄位應更新到哪個集合 ---
const APPOINTMENT_FIELDS = ['bookerName', 'bookerPhone', 'bookerIdNumber' ,'bookerEmail', 'appointmentDate', 'appointmentTimeSlot', 'inspectionMethod', 'inspectionCompanyName', 'inspectors', 'bookingRemarks', 'agentName', 'agentIdNumber', 'agentPhone', 'bookingType', 'status', 'checkInStatus', 'specialRemarks', 'specialRemarks2', 'handoverTime'];
const HOUSEHOLD_FIELDS = ['address', 'parkingLots', 'buyerName', 'buyerPhone', 'buyerEmail', 'buyerIdNumber','appropriationDate', 'bank', 'bankContact', 'remarks', 'inspectionDocsUrl', 'inspectionReportUrl', 'initialInspectionBatch', 'reInspectionBatch'];

// --- 響應式狀態 ---
const isLoading = ref(true);
const error = ref(null);
const allAppointments = ref([]);
const allHouseholdData = ref({});
const isDialogVisible = ref(false);
const isAddDialogVisible = ref(false);
const selectedEvent = ref(null);
const isDownloadingPdf = ref(false);
const isDownloadingExcel = ref(false);
const searchQuery = ref('');
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
const isCancelling = ref(false);
const bookingOptions = ref({
  inspectionMethods: [],
  inspectionStaff: [],
  buildingsAndUnits: {}
});
const allBookingRules = ref(null);
const newAppointmentForm = ref(null);
const duplicateInfo = ref(null);
const isDuplicateDialogVisible = ref(false);
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

// --- 常數與計算屬性 ---
// PROJECT_NAME_MAP = { fuyu56: '富宇上城', fuyu61: '富宇富御', fuyu1750: '富宇首馥' };
const PROJECT_TIME_SLOTS = {
  '富宇上城': ['09:00', '10:00', '11:00', '13:00', '14:00', '15:00', '16:00'],
  '富宇富御': ['09:30', '10:00', '11:00', '13:30', '14:00','14:30'],
  'default': ['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00']
};
const PROJECT_TYPE_OPTIONS = {
  '富宇上城': ['初驗', '複驗', '後陽台門鎖更換'],
  '富宇富御': ['初驗', '複驗', ],
  '富宇首馥': ['初驗', '複驗'],
  'default': ['初驗', '複驗']
};
const fieldConfig = {
  default: [
    { title: '基本資料', fields: [ { key: 'address', label: '門牌', icon: 'mdi-map-marker-outline' }, { key: 'parkingLots', label: '車位', icon: 'mdi-car-outline' }, { key: 'buyerName', label: '買方姓名', icon: 'mdi-account-star-outline' }, { key: 'buyerPhone', label: '買方電話', icon: 'mdi-phone-outline', copyable: true }, { key: 'buyerEmail', label: '買方EMAIL', icon: 'mdi-email-outline', copyable: true }, { key: 'buyerIdNumber', label: '買方身分證', icon: 'mdi-card-account-details-outline' } ]},
    { title: '預約人資料', fields: [ { key: 'bookerName', label: '預約人姓名', icon: 'mdi-account-outline' }, { key: 'bookerPhone', label: '預約人電話', icon: 'mdi-cellphone', copyable: true }, { key: 'bookerEmail', label: '預約人EMAIL', icon: 'mdi-email-outline', copyable: true }, { key: 'bookerIdNumber', label: '預約人身分證', icon: 'mdi-card-account-details-outline' } ]},
    { title: '驗屋與預約詳情', fields: [ { key: 'bookingType', label: '預約項目', icon: 'mdi-format-list-checks', type: 'booking-item-select' }, { key: 'inspectionMethod', label: '驗屋方式', icon: 'mdi-cog-outline' }, { key: 'appointmentDate', label: '預約日期與時段', icon: 'mdi-calendar-clock', type: 'booking-datetime-select' }, { key: 'inspectionCompanyName', label: '代驗公司', icon: 'mdi-domain' }, { key: 'agentName', label: '受託人姓名', icon: 'mdi-account-tie-outline' }, { key: 'agentPhone', label: '受託人電話', icon: 'mdi-phone-in-talk-outline', copyable: true }, { key: 'bookingRemarks', label: '預約備註', icon: 'mdi-note-text-outline' }, ]},
    { title: '相關文件與批次', fields: [ { key: 'appropriationDate', label: '撥款日期', icon: 'mdi-cash-check', type: 'date' }, { key: 'bank', label: '銀行', icon: 'mdi-bank-outline' }, { key: 'bankContact', label: '銀行窗口', icon: 'mdi-account-tie-outline' }, { key: 'inspectionDocsUrl', label: '驗屋文件', icon: 'mdi-file-document-outline', type: 'button', readOnly: true }, { key: 'inspectionReportUrl', label: '驗屋報告', icon: 'mdi-file-chart-outline', type: 'button', readOnly: true }, { key: 'remarks', label: '重要備註', icon: 'mdi-alert-circle-outline', type: 'remark' }, { key: 'initialInspectionBatch', label: '初驗批次', icon: 'mdi-numeric-1-box-multiple-outline' }, { key: 'reInspectionBatch', label: '複驗批次', icon: 'mdi-numeric-2-box-multiple-outline' }, ]}
  ]
};
const displayFieldOptions = ref([ { key: 'unitId', label: '戶別' }, { key: 'bookerName', label: '預約人姓名' }, { key: 'bookingType', label: '預約項目' }, { key: 'inspectionMethod', label: '驗屋方式' }, { key: 'inspectionCompanyName', label: '代驗公司名稱' }, { key: 'specialRemarks', label: '特殊備註' }, { key: 'specialRemarks2', label: '特殊備註2' }, { key: 'inspectors', label: '驗屋人員', formatter: (val) => val ? `【${val}】` : null }, ]);
const CSS_KEYWORD_COLOR_MAP = [ { keyword: '已撥款', backgroundColor: '#ffc107', color: '#212529' }, { keyword: '交屋', backgroundColor: '#ffc107', color: '#212529' }, { keyword: '初驗', backgroundColor: '#d4edda', color: '#155724' }, { keyword: '複驗', backgroundColor: '#f8d7da', color: '#721c24' }, ];
const EXCEL_KEYWORD_COLOR_MAP = [ { keyword: '已撥款', backgroundColor: 'ffc107', textColor: '212529' }, { keyword: '交屋', backgroundColor: 'ffc107', textColor: '212529' }, { keyword: '初驗', backgroundColor: 'd4edda', textColor: '155724' }, { keyword: '複驗', backgroundColor: 'f8d7da', textColor: '721c24' }, ];
const selectedDisplayFields = ref(['unitId', 'bookingType', 'inspectors']);
const projectName = computed(() => projectStore.idToNameMap[projectId.value] || '讀取中...');
const pageTitle = computed(() => `${projectName.value} - 驗屋預約時間表`);
const currentTypeOptions = computed(() => PROJECT_TYPE_OPTIONS[projectName.value] || PROJECT_TYPE_OPTIONS.default);
const selectedTypes = ref(currentTypeOptions.value);
const selectedStatuses = ref(['預約中']);
const canEdit = computed(() => userStore.hasProjectPermission('驗屋時間表-修改', projectName.value));

const buildingOptions = computed(() => Object.keys(bookingOptions.value.buildingsAndUnits).sort((a, b) => a.localeCompare(b, 'zh-Hant', { numeric: true })));
const unitOptions = computed(() => newAppointmentData.building ? (bookingOptions.value.buildingsAndUnits[newAppointmentData.building] || []) : []);
const timeSlots = computed(() => PROJECT_TIME_SLOTS[projectName.value] || PROJECT_TIME_SLOTS.default);

const filteredAppointments = computed(() => {
    return processAppointments(allAppointments.value).filter(appt => {
    const statusMatch = selectedStatuses.value.includes(appt.status);
    const typeMatch = selectedTypes.value.includes(appt.bookingType);
    const query = searchQuery.value ? searchQuery.value.toLowerCase().trim() : '';
    const queryMatch = !query || [
      appt.unitId, appt.address, appt.bookerName, appt.buyerName, appt.buyerPhone, appt.bookerPhone, appt.bookerIdNumber, appt.buyerIdNumber, appt.bookingType,
      appt.inspectionMethod, appt.inspectionCompanyName, appt.inspectors, appt.remarks,
      appt.parkingLots, appt.bank, appt.bankContact, appt.bookingCode, appt.appointmentDate, appt.status, appt.specialRemarks, appt.specialRemarks2
    ].some(field => field && String(field).toLowerCase().includes(query));
    return statusMatch && typeMatch && queryMatch;
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

const startDateFormatted = computed({ get: () => format(startDate.value, 'yyyy-MM-dd'), set: (val) => { startDate.value = new Date(val); }});
const endDateFormatted = computed({ get: () => format(endDate.value, 'yyyy-MM-dd'), set: (val) => { endDate.value = new Date(val); }});

const groupedEvents = computed(() => { 
  const grouped = {};
  filteredAppointments.value.forEach(event => {
    if (!event.start) return;
    const dateKey = format(event.start, 'yyyy-MM-dd');
    const eventStartTime = format(event.start, 'HH:mm');

    // ✅ 【核心修改點 2】使用倒序迴圈來查找正確的時間區間
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

//導航到規則管理頁面的函式
function navigateToRuleManager() {
  router.push({ 
    name: 'BookingRuleManager', 
    params: { projectId: projectId.value } 
  });
}

async function fetchData() {
  isLoading.value = true;
  error.value = null;
  try {
    // 首先，確保 projectStore 已載入所有專案資料
    await projectStore.fetchProjects();

    // 當 projectStore 準備好後，projectName.value 就會有正確的值
    // 然後再繼續獲取日曆頁面需要的其他資料
    const [calendarData, optionsData, rulesData] = await Promise.all([
      fetchCalendarData(projectId.value),
      fetchBookingOptions(projectId.value),
      getAllBookingRules(projectName.value)
    ]);
    allAppointments.value = calendarData;
    
    allHouseholdData.value = calendarData.reduce((acc, curr) => {
        const householdId = `${curr.projectId}_${curr.unitId}`;
        if (!acc[householdId]) {
            acc[householdId] = { id: householdId, ...curr };
        }
        return acc;
    }, {});
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


function processAppointments(rawAppointments) {
  return rawAppointments.map(appt => {
      try {
        if (!appt.appointmentDate || !appt.appointmentDate.toDate) return null;
        
        const date = appt.appointmentDate.toDate();
        const dateStr = format(date, 'yyyy-MM-dd');
        
        // ✅ 【核心修改點 1】統一將全形冒號轉為半形
        const timeSlot = appt.appointmentTimeSlot ? String(appt.appointmentTimeSlot).replace(/：/g, ':') : '00:00';
        const startTime = timeSlot.split('-')[0]?.trim() || '00:00';

        const displayParts = displayFieldOptions.value
          .filter(option => selectedDisplayFields.value.includes(option.key))
          .map(option => {
            const value = appt[option.key];
            if (!value) return null;
            const formattedValue = option.formatter ? option.formatter(value) : String(value);
            return { text: formattedValue, isHousehold: option.key === 'unitId' };
          }).filter(Boolean);
        
        return { ...appt, start: parseISO(`${dateStr}T${startTime}`), displayParts };
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
  isDialogVisible.value = true;
}


function enterEditMode() {
  editableEvent.value = JSON.parse(JSON.stringify(selectedEvent.value));
  if (editableEvent.value.inspectors && typeof editableEvent.value.inspectors === 'string') {
    editableEvent.value.inspectors = editableEvent.value.inspectors.split(',').map(name => name.trim()).filter(Boolean);
  } else if (!editableEvent.value.inspectors) {
    editableEvent.value.inspectors = [];
  }
  ['appointmentDate', 'appropriationDate'].forEach(key => {
    if (editableEvent.value[key] && editableEvent.value[key].seconds) {
      editableEvent.value[key] = format(editableEvent.value[key].toDate(), 'yyyy-MM-dd');
    } else {
       editableEvent.value[key] = '';
    }
  });
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
            Object.keys(data).forEach(key => {
                if (newAppointmentData.hasOwnProperty(key)) {
                    newAppointmentData[key] = data[key] || '';
                }
            });
            newAppointmentData.bookerName = data.buyerName || '';
            newAppointmentData.bookerPhone = data.buyerPhone || '';
            newAppointmentData.bookerEmail = data.buyerEmail || '';
            newAppointmentData.bookerIdNumber = data.buyerIdNumber || '';
            panels.value = [0, 1, 2, 3];
        }
    } else {
        const building = newAppointmentData.building;
        resetNewAppointmentForm();
        newAppointmentData.building = building;
    }
});

async function handleSaveNewAppointment() {
    const { valid } = await newAppointmentForm.value.validate();
    if (!valid) {
        snackbarText.value = '請檢查表單，有必填欄位尚未填寫。';
        snackbar.value = true;
        return;
    }
    isSaving.value = true;

    // ✅ 【核心修改點】直接在前端對已載入的 allAppointments 陣列進行檢查
    try {
        const isDuplicate = allAppointments.value.some(appt => 
            appt.unitId === newAppointmentData.unitId &&
            appt.bookingType === newAppointmentData.bookingType &&
            appt.status === '預約中'
        );
        
        if (isDuplicate) {
            // 如果找到重複，找出那筆重複的資料
            const duplicate = allAppointments.value.find(appt => 
                appt.unitId === newAppointmentData.unitId && 
                appt.bookingType === newAppointmentData.bookingType && 
                appt.status === '預約中'
            );
            duplicateInfo.value = duplicate;
            isDuplicateDialogVisible.value = true; // 彈出詢問視窗
        } else {
            // 如果沒有重複，直接執行新增
            await executeAddAppointment(null);
        }
    } catch (err) {
        error.value = `儲存失敗: ${err.message}`;
        alert(`儲存失敗: ${err.message}`);
    } finally {
        isSaving.value = false;
    }
}

async function executeAddAppointment(cancelBookingCode = null) {
    isSaving.value = true;
    try {
        const payload = { ...newAppointmentData };
        if (Array.isArray(payload.inspectors)) payload.inspectors = payload.inspectors.join(',');
        
        // 注意：這裡的 projectName 還是舊的中文名，API 需要 projectId
        await addAppointmentAdmin(projectId.value, payload, cancelBookingCode);
        
        snackbarText.value = '新增預約成功！';
        snackbar.value = true;
        isAddDialogVisible.value = false;
        isDuplicateDialogVisible.value = false;
        await fetchData();

    } catch (err) {
        error.value = `儲存失敗: ${err.message}`;
        alert(`儲存失敗: ${err.message}`);
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
        await cancelAppointment(eventToCancel.value.id);
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

onMounted(() => {
  if (projectId.value) {
    fetchData();
  } else {
    error.value = `未提供建案ID`;
    isLoading.value = false;
  }
});

onUnmounted(() => {
  pageContextStore.clearContext();
});


// --- 其他輔助函式 ---

function handleCopy(value) { const { copy } = useClipboard({ source: value }); copy(value); snackbarText.value = '已複製到剪貼簿！'; snackbar.value = true; }
function openUrl(url) { if (url) window.open(url, '_blank', 'noopener,noreferrer'); }
function getEventStyle(event) {
  if (!event || Object.keys(event).length === 0) return { backgroundColor: '#FFFFFF', color: '#000000' };
  if (event.status === '取消') return { backgroundColor: '#F5F5F5', color: '#9E9E9E' };
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
function safeFormatDate(value, formatString = 'yyyy-MM-dd') {
  if (!value) return '';
  if (typeof value.toDate === 'function') {
    return format(value.toDate(), formatString);
  }
  const date = new Date(value);
  if (isNaN(date.getTime())) return value; 
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
 // ... (rest of the download function)
}
async function handleDownloadExcel() {
  isDownloadingExcel.value = true;
  // ... (rest of the download function)
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

// ✅【新增】導航到戶別資料 Grid 頁面的函式
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