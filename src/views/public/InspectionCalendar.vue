<template>
  <v-container fluid>
    <v-card class="pa-4">
      <v-card-title class="d-flex align-center justify-space-between text-h5 text-primary mb-4">
        <span>{{ pageTitle }}</span>

        <div id="action-buttons">
          <div class="d-none d-md-flex ga-2 align-center">

         
            
            <v-tooltip text="操作說明" location="bottom">
              <template v-slot:activator="{ props }">
                <v-btn
                  v-bind="props"
                  icon="mdi-help-circle-outline"
                  variant="text"
                  @click="startTour"
                ></v-btn>
              </template>
            </v-tooltip>

            <v-tooltip text="重新整理資料" location="bottom">
              <template v-slot:activator="{ props }">
                <v-btn
                  v-bind="props"
                  icon="mdi-refresh"
                  variant="text"
                  @click="handleRefresh"
                  :loading="isLoading"
                ></v-btn>
              </template>
            </v-tooltip>

            <v-divider vertical class="mx-2"></v-divider>

               <v-btn v-if="canEdit"
              color="indigo"
              @click="handleOpenAddDialog"
              prepend-icon="mdi-calendar-plus"
            >
              新增預約
            </v-btn>

            <v-btn
              color="primary"
              @click="handleDownloadPng"
              :loading="isDownloadingPdf"
              prepend-icon="mdi-image-area"
            >
              下載時間表 (PNG)
            </v-btn>
            <v-btn
              color="teal-darken-1"
              @click="handleDownloadExcel"
              :loading="isDownloadingExcel"
              prepend-icon="mdi-microsoft-excel"
            >
              下載時間表 (Excel)
            </v-btn>
          </div>

          <div class="d-md-none">
            <v-menu location="bottom end">
              <template v-slot:activator="{ props }">
                <v-btn v-bind="props" icon="mdi-dots-vertical" variant="text"></v-btn>
              </template>

              <v-list density="compact">
                <v-list-item  v-if="canEdit"
                  prepend-icon="mdi-calendar-plus"
                  title="新增預約"
                  @click="handleOpenAddDialog"
                ></v-list-item>
                
                <v-list-item
                  prepend-icon="mdi-refresh"
                  title="重新整理"
                  @click="handleRefresh"
                  :disabled="isLoading"
                >
                  <template v-slot:append>
                    <v-progress-circular
                      v-if="isLoading"
                      indeterminate
                      color="grey"
                      size="20"
                      width="2"
                    ></v-progress-circular>
                  </template>
                </v-list-item>
                <v-list-item
                  prepend-icon="mdi-filter-variant"
                  title="篩選"
                  @click="isFilterDrawerVisible = true"
                ></v-list-item>
                <v-list-item
                  prepend-icon="mdi-image-area"
                  title="下載時間表 (PNG)"
                  @click="handleDownloadPng"
                  :disabled="isDownloadingPdf"
                >
                  <template v-slot:append>
                    <v-progress-circular
                      v-if="isDownloadingPdf"
                      indeterminate
                      color="primary"
                      size="20"
                      width="2"
                    ></v-progress-circular>
                  </template>
                </v-list-item>
                <v-list-item
                  prepend-icon="mdi-microsoft-excel"
                  title="下載時間表 (Excel)"
                  @click="handleDownloadExcel"
                  :disabled="isDownloadingExcel"
                >
                  <template v-slot:append>
                    <v-progress-circular
                      v-if="isDownloadingExcel"
                      indeterminate
                      color="teal-darken-1"
                      size="20"
                      width="2"
                    ></v-progress-circular>
                  </template>
                </v-list-item>
              </v-list>
            </v-menu>
          </div>
        </div>
      </v-card-title>

      <v-alert
        v-if="error"
        type="error"
        variant="tonal"
        class="mb-4"
        :text="error"
      ></v-alert>

      <div v-if="isLoading" class="text-center pa-10">
        <v-progress-circular indeterminate color="primary" size="64"></v-progress-circular>
        <div class="mt-4">資料載入中...</div>
      </div>

      <div v-if="!isLoading && !error">
        <v-row id="filter-panel" class="mb-4 align-center bg-grey-lighten-4 pa-3 rounded d-none d-md-flex" dense>
          <v-col cols="12" sm="4" md="2">
            <v-text-field
              v-model="startDateFormatted"
              label="開始日期"
              type="date"
              density="compact"
              hide-details
            ></v-text-field>
          </v-col>
          <v-col cols="12" sm="4" md="2">
            <v-text-field
              v-model="endDateFormatted"
              label="結束日期"
              type="date"
              density="compact"
              hide-details
            ></v-text-field>
          </v-col>
          <v-col cols="12" sm="4" md="3">
            <v-text-field
              v-model="searchQuery"
              label="關鍵字搜尋..."
              prepend-inner-icon="mdi-magnify"
              density="compact"
              hide-details
              clearable
              variant="outlined"
              color="primary"
            ></v-text-field>
          </v-col>
          <v-col cols="12" sm="6" md="auto" class="pl-md-5">
            <div class="d-flex align-center">
              <span class="text-subtitle-2 font-weight-bold mr-2 d-none d-md-inline">狀態:</span>
              <v-checkbox
                v-model="selectedStatuses"
                label="預約中"
                value="預約中"
                density="compact"
                hide-details
                color="primary"
              ></v-checkbox>
              <v-checkbox
                v-model="selectedStatuses"
                label="取消"
                value="取消"
                density="compact"
                hide-details
                color="error"
              ></v-checkbox>
            </div>
          </v-col>
          <v-col cols="12" sm="6" md="auto" class="ml-md-6">
            <div class="d-flex align-center">
              <span class="text-subtitle-2 font-weight-bold mr-2 d-none d-md-inline">項目:</span>
              <v-checkbox
                v-for="itemType in currentTypeOptions"
                :key="itemType"
                v-model="selectedTypes"
                :label="itemType"
                :value="itemType"
                density="compact"
                hide-details
                color="teal-darken-1"
              ></v-checkbox>
            </div>
          </v-col>
           <v-col cols="12" class="mt-2 pt-0">
             <v-divider></v-divider>
            <div id="display-options-panel" class="d-flex align-center flex-wrap">
            <span class="text-subtitle-2 font-weight-bold mr-2 mt-2 d-none d-md-inline">標題顯示:</span>
              <v-checkbox
                v-for="field in displayFieldOptions"
                :key="field.key"
                v-model="selectedDisplayFields"
                :label="field.label"
                :value="field.key"
                density="compact"
                hide-details
                color="indigo"
                class="mt-2"
              ></v-checkbox>
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
                  <th v-for="day in chunk" :key="day.fullDate" class="day-header"
                    :class="{ 
                      'today-column': day.isToday, 
                      'weekend-column': day.isWeekend 
                    }">
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
                  <td v-for="day in chunk" :key="day.fullDate" 
                    :class="['event-cell', { 
                      'disabled-cell': !day.isInRange,
                      'today-column': day.isToday,
                      'weekend-column': day.isWeekend
                    }]">
                    <div v-if="day.isInRange" class="event-cell-content">
                      <div v-if="groupedEvents[day.fullDate] && groupedEvents[day.fullDate][timeSlot]">
                        <div
                          v-for="event in groupedEvents[day.fullDate][timeSlot]"
                          :key="event.id"
                          :class="['event-item', { 'cancelled-event': event['預約狀態'] === '取消' }]"
                          :style="getEventStyle(event)"
                          @click="handleCustomEventClick(event)"
                        >
                          <v-icon
                            v-if="event['預約狀態'] === '取消'"
                            color="red-darken-1"
                            size="small"
                            class="mr-1"
                          >
                            mdi-close-circle-outline
                          </v-icon>
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
        <v-card-title class="text-h6 primary-bg d-flex align-center"  v-draggable-dialog >
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
                    <div class="text-h5 font-weight-bold text-primary">{{ selectedEvent['戶別'] }}</div>
                  </v-col>
                  
                  <v-col cols="12" sm="5">
                      <div class="text-caption text-grey-darken-1">預約日期與時段</div>
                      <div v-if="!isEditMode" class="text-body-1 font-weight-medium">
                          {{ selectedEvent['預約日期'] ? format(new Date(selectedEvent['預約日期']), 'yyyy-MM-dd') : '' }}
                          <v-icon size="small" class="mx-1">mdi-clock-outline</v-icon>
                          {{ selectedEvent['預約時段'] }}
                      </div>
                      <div v-else>
                          <div class="d-flex ga-2">
                            <v-menu 
                            v-model="addDateMenu" 
                            :close-on-content-click="false">
                              <template v-slot:activator="{ props }">
                                <v-text-field
                                  :model-value="safeFormatDate(editableEvent['預約日期'], 'yyyy-MM-dd')"
                                  label="預約日期"
                                  readonly
                                  v-bind="props"
                                  density="compact"
                                  hide-details="auto"
                                  :disabled="!currentBookingRules"
                                  style="min-width: 155px;"
                                ></v-text-field>
                              </template>
                              <v-date-picker
                                v-model="editableEvent['預約日期']"
                                 @update:modelValue="addDateMenu = false"
                                :min="currentBookingRules?.startDate"
                                :max="currentBookingRules?.endDate"
                                :allowed-dates="isDateAllowed"
                                @update:model-value="menu = false"
                                hide-header
                              ></v-date-picker>
                            </v-menu>
                            
                            <v-select
                              v-model="editableEvent['預約時段']"
                              :items="availableTimeSlots"
                              label="預約時段"
                              :disabled="!editableEvent['預約日期'] || !currentBookingRules"
                              density="compact"
                              hide-details="auto"
                              no-data-text="請先選擇日期"
                              style="min-width: 200px;"
                            >
                              <template v-slot:item="{ props, item }">
                                <v-list-item
                                  v-bind="props"
                                  :disabled="item.raw.includes('額滿')"
                                ></v-list-item>
                              </template>
                            </v-select>
                          </div>
                      </div>
                  </v-col>

                  <v-col cols="12" sm="4" class="d-flex flex-wrap ga-2 justify-start justify-sm-end">
                      <v-chip :style="getAppointmentItemStyle(selectedEvent['預約項目'])" size="small" label>
                      {{ selectedEvent['預約項目'] }}
                      </v-chip>
                      <v-chip v-if="selectedEvent['預約狀態'] === '預約中'" color="success" size="small" label variant="flat">
                      <v-icon start icon="mdi-check-circle-outline"></v-icon>
                      {{ selectedEvent['預約狀態'] }}
                      </v-chip>
                      <v-chip v-else-if="selectedEvent['預約狀態'] === '取消'" color="red-darken-1" size="small" label variant="tonal">
                      <v-icon start icon="mdi-close-circle-outline"></v-icon>
                      {{ selectedEvent['預約狀態'] }}
                      </v-chip>
                  </v-col>
              </v-row>
              
              <v-row dense class="mt-3">
                  <v-col cols="12">
                    <div v-if="!isEditMode">
                        <div v-if="selectedEvent['驗屋人員']" class="d-flex flex-wrap align-center ga-2">
                        <div class="text-caption font-weight-bold text-grey-darken-2">驗屋人員:</div>
                        <v-chip
                            v-for="staff in String(selectedEvent['驗屋人員']).split(',').filter(s => s.trim())"
                            :key="staff"
                            color="teal"
                            variant="flat"
                            size="small"
                            label
                        >
                            <v-icon start icon="mdi-account-circle-outline"></v-icon>
                            {{ staff.trim() }}
                        </v-chip>
                        </div>
                    </div>
                    <div v-else>
                        <v-select
                            v-model="editableEvent['驗屋人員']"
                            :items="bookingOptions.inspectionStaff"
                            label="驗屋人員"
                            density="compact"
                            multiple
                            chips
                            clearable
                            hide-details
                            variant="outlined"
                        ></v-select>
                    </div>
                  </v-col>
              </v-row>

              <v-row v-if="!isEditMode" dense class="mt-3">
                  <v-col v-if="selectedEvent['預約備註']" cols="12">
                      <v-alert
                        density="compact"
                        color="blue-lighten-5"
                        class="remark-alert"
                      >
                        <template v-slot:prepend>
                            <v-icon color="blue-darken-2">mdi-information-outline</v-icon>
                        </template>
                        <div class="text-caption font-weight-bold text-blue-darken-3">本次預約備註</div>
                        <div class="alert-content">{{ selectedEvent['預約備註'] }}</div>
                      </v-alert>
                  </v-col>
                  <v-col v-if="selectedEvent['備註']" cols="12">
                      <v-alert
                        density="compact"
                        color="orange-lighten-5"
                        class="remark-alert"
                      >
                        <template v-slot:prepend>
                            <v-icon color="orange-darken-3">mdi-alert-circle-outline</v-icon>
                        </template>
                        <div class="text-caption font-weight-bold text-orange-darken-4">重要備註</div>
                        <div class="alert-content">{{ selectedEvent['備註'] }}</div>
                      </v-alert>
                  </v-col>
              </v-row>

              <v-row v-else dense class="mt-4">
                  <v-col cols="12" md="6">
                      <v-textarea
                        v-model="editableEvent['預約備註']"
                        label="本次預約備註"
                        rows="2"
                        auto-grow
                        density="compact"
                        variant="outlined"
                        hide-details
                      ></v-textarea>
                  </v-col>
                  <v-col cols="12" md="6">
                      <v-textarea
                        v-model="editableEvent['備註']"
                        label="重要備註"
                        rows="2"
                        auto-grow
                        density="compact"
                        variant="outlined"
                        hide-details
                      ></v-textarea>
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
                                {{ item['預約日期'] ? format(new Date(item['預約日期']), 'yyyy-MM-dd') : '無日期' }}
                                <span class="text-caption text-grey-darken-1 ml-2">{{ item['預約時段'] }}</span>
                              </v-list-item-title>
                              <v-list-item-subtitle>{{ item['預約項目'] }}</v-list-item-subtitle>
                              <template v-slot:append>
                                <v-chip v-if="item['預約狀態'] === '預約中'" color="success" size="x-small" label variant="flat">
                                  <v-icon start icon="mdi-check-circle-outline"></v-icon>
                                  {{ item['預約狀態'] }}
                                </v-chip>
                                <v-chip v-else-if="item['預約狀態'] === '取消'" color="red-darken-1" size="x-small" label variant="tonal">
                                  <v-icon start icon="mdi-close-circle-outline"></v-icon>
                                  {{ item['預約狀態'] }}
                                </v-chip>
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
                                            <v-btn v-if="selectedEvent[field.key]" :color="field.key === '驗屋報告' ? 'red-darken-4' : 'primary'" size="small" variant="tonal" @click="openUrl(selectedEvent[field.key])">
                                            <v-icon start icon="mdi-launch"></v-icon>開啟{{ field.label }}
                                            </v-btn>
                                            <span v-else>未提供</span>
                                        </template>
                                        <template v-else-if="field.type === 'date' || field.type === 'datetime'">
                                            {{ safeFormatDate(selectedEvent[field.key], field.type === 'date' ? 'yyyy-MM-dd' : 'yyyy-MM-dd HH:mm:ss') }}
                                        </template>
                                        <template v-else>{{ selectedEvent[field.key] || '無' }}</template>
                                    </v-list-item-title>
                                    
                                    <div v-else class="mt-1">
                                      <v-select
                                          v-if="field.key === '驗屋方式'"
                                          v-model="editableEvent[field.key]"
                                          :items="bookingOptions.inspectionMethods"
                                          :label="field.label"
                                          density="compact"
                                          hide-details
                                      ></v-select>
                                      <v-text-field
                                          v-else-if="field.type === 'date'"
                                          v-model="editableEvent[field.key]"
                                          :label="field.label"
                                          type="date"
                                          density="compact"
                                          hide-details
                                      ></v-text-field>
                                      <v-text-field
                                          v-else
                                          v-model="editableEvent[field.key]"
                                          :label="field.label"
                                          density="compact"
                                          hide-details
                                      ></v-text-field>
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
                                  <v-select v-model="newAppointmentData.戶別" :items="unitOptions" label="戶別" :disabled="!newAppointmentData.building" :rules="[v => !!v || '必須選擇戶別']" density="compact" hide-details="auto" no-data-text="請先選棟別"></v-select>
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
                                                  {{ item['預約日期'] ? format(new Date(item['預約日期']), 'yyyy-MM-dd') : '無日期' }}
                                                  <span class="text-caption text-grey-darken-1 ml-2">{{ item['預約時段'] }}</span>
                                              </v-list-item-title>
                                              <v-list-item-subtitle>{{ item['預約項目'] }}</v-list-item-subtitle>
                                              <template v-slot:append>
                                                  <v-chip v-if="item['預約狀態'] === '預約中'" color="success" size="x-small" label variant="flat"><v-icon start icon="mdi-check-circle-outline"></v-icon>{{ item['預約狀態'] }}</v-chip>
                                                  <v-chip v-else-if="item['預約狀態'] === '取消'" color="red-darken-1" size="x-small" label variant="tonal"><v-icon start icon="mdi-close-circle-outline"></v-icon>{{ item['預約狀態'] }}</v-chip>
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
                                                    v-model="newAppointmentData.預約項目" 
                                                    :items="currentTypeOptions" 
                                                    :label="field.label" 
                                                    :disabled="!newAppointmentData.戶別" 
                                                    :rules="[v => !!v || '必須選擇預約項目']" 
                                                    density="compact" 
                                                    hide-details="auto" 
                                                    no-data-text="請先選戶別">
                                                </v-select>
                                                
                                                <div v-else-if="field.type === 'booking-datetime-select'">
                                                <v-list-item-subtitle class="mb-2">{{ field.label }}</v-list-item-subtitle>
                                                <div class="d-flex flex-column flex-sm-row ga-2">
                                                    <v-menu 
                                                        v-model="addDateMenu" 
                                                        :close-on-content-click="false"
                                                    >
                                                        <template v-slot:activator="{ props }">
                                                            <v-text-field 
                                                                :model-value="safeFormatDate(newAppointmentData['預約日期'], 'yyyy-MM-dd')" 
                                                                label="預約日期" 
                                                                readonly 
                                                                v-bind="props" 
                                                                density="compact" 
                                                                hide-details="auto" 
                                                                :disabled="!currentBookingRules" 
                                                                :rules="[v => !!v || '必須選擇日期']" 
                                                            ></v-text-field>
                                                        </template>
                                                        <v-date-picker 
                                                            v-model="newAppointmentData['預約日期']"
                                                            @update:modelValue="addDateMenu = false"
                                                            :min="currentBookingRules?.startDate" 
                                                            :max="currentBookingRules?.endDate" 
                                                            :allowed-dates="isDateAllowed" 
                                                            hide-header
                                                        ></v-date-picker>
                                                    </v-menu>
                                                    <v-select 
                                                        v-model="newAppointmentData['預約時段']" 
                                                        :items="availableTimeSlots" 
                                                        label="預約時段" 
                                                        :disabled="!newAppointmentData['預約日期'] || !currentBookingRules" 
                                                        :rules="[v => !!v || '必須選擇時段']" 
                                                        density="compact" 
                                                        hide-details="auto" 
                                                        no-data-text="請先選擇日期" 
                                                    >
                                                        <template v-slot:item="{ props, item }"><v-list-item v-bind="props" :disabled="item.raw.includes('額滿')"></v-list-item></template>
                                                    </v-select>
                                                </div>
                                            </div>
                                                
                                                <v-text-field v-else-if="field.key === '門牌' || field.key === '車位'" v-model="newAppointmentData[field.key]" :label="field.label" density="compact" hide-details readonly variant="filled"></v-text-field>
                                                
                                                <div v-else-if="field.type === 'button'" class="pt-2">
                                                    <v-list-item-subtitle class="mb-2">{{ field.label }}</v-list-item-subtitle>
                                                    <v-btn v-if="newAppointmentData[field.key]" :color="field.key === '驗屋報告' ? 'red-darken-4' : 'primary'" size="small" variant="tonal" @click="openUrl(newAppointmentData[field.key])">
                                                        <v-icon start icon="mdi-launch"></v-icon>開啟{{ field.label }}
                                                    </v-btn>
                                                    <span v-else class="text-grey-darken-1">未提供</span>
                                                </div>
                                                <v-select v-else-if="field.key === '驗屋方式'" v-model="newAppointmentData[field.key]" :items="bookingOptions.inspectionMethods" :label="field.label" density="compact" hide-details></v-select>
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
        <v-card-title class="text-h6 d-flex align-center bg-red-lighten-4"  v-draggable-dialog  >
          <v-icon start color="red-darken-2">mdi-alert-circle-outline</v-icon>
          <span>確認取消預約</span>
        </v-card-title>
        
        <v-divider></v-divider>

        <v-card-text class="py-4">
          <p class="mb-4">您確定要取消以下這筆預約紀錄嗎？</p>
          
          <v-list density="compact" class="bg-red-lighten-5 rounded">
            <v-list-item
              :title="`${eventToCancel['戶別']} (${eventToCancel['預約人姓名']})`"
              prepend-icon="mdi-home-account"
            >
              <template v-slot:subtitle>
                <div class="font-weight-medium">{{ eventToCancel['預約項目'] }}</div>
              </template>
            </v-list-item>
            <v-list-item
              prepend-icon="mdi-calendar-clock-outline"
            >
              <template v-slot:title>
                <div>{{ format(new Date(eventToCancel['預約日期']), 'yyyy-MM-dd') }}</div>
              </template>
              <template v-slot:subtitle>
                <div class="font-weight-medium">{{ eventToCancel['預約時段'] }}</div>
              </template>
            </v-list-item>
          </v-list>
          
          <div class="text-red-darken-2 font-weight-bold mt-4">
            此操作無法復原！
          </div>
        </v-card-text>
        
        <v-divider></v-divider>
        
        <v-card-actions class="pa-3">
          <v-spacer></v-spacer>
          <v-btn
            variant="text"
            @click="isCancelConfirmDialogVisible = false"
          >
            返回
          </v-btn>
          <v-btn
            color="red-darken-1"
            variant="flat"
            :loading="isCancelling"
            @click="handleCancelBooking"
          >
            確定取消
          </v-btn>
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
      <v-card-title 
            class="text-h6 d-flex align-center bg-amber-lighten-4"
            v-draggable-dialog 
          >          
          <v-icon start color="amber-darken-3">mdi-alert-outline</v-icon>
          <span>偵測到重複預約</span>
        </v-card-title>
        <v-divider></v-divider>
        <v-card-text class="py-4">
          <p class="mb-4">系統發現一筆與您即將新增的預約資料重複（相同戶別、相同項目），資訊如下：</p>
          <v-list density="compact" class="bg-amber-lighten-5 rounded pa-2">
              <v-list-item v-if="duplicateInfo['戶別']" prepend-icon="mdi-home-outline" title="戶別" :subtitle="duplicateInfo['戶別']"></v-list-item>
              <v-list-item v-if="duplicateInfo['預約人姓名']" prepend-icon="mdi-account-tie-outline" title="預約人姓名" :subtitle="duplicateInfo['預約人姓名']"></v-list-item>
              <v-list-item v-if="duplicateInfo['預約人電話']" prepend-icon="mdi-phone-in-talk-outline" title="預約人電話" :subtitle="duplicateInfo['預約人電話']"></v-list-item>
              <v-list-item v-if="duplicateInfo['預約項目']" prepend-icon="mdi-format-list-checks" title="預約項目" :subtitle="duplicateInfo['預約項目']"></v-list-item>
              <v-list-item v-if="duplicateInfo['預約日期']" prepend-icon="mdi-calendar" title="預約日期" :subtitle="safeFormatDate(duplicateInfo['預約日期'])"></v-list-item>
              <v-list-item v-if="duplicateInfo['預約時段']" prepend-icon="mdi-clock-outline" title="預約時段" :subtitle="duplicateInfo['預約時段']"></v-list-item>
              <v-divider v-if="duplicateInfo['驗屋方式'] || duplicateInfo['代驗公司名稱'] || duplicateInfo['受託人姓名']" class="my-2"></v-divider>
              <v-list-item v-if="duplicateInfo['驗屋方式']" prepend-icon="mdi-account-hard-hat-outline" title="驗屋方式" :subtitle="duplicateInfo['驗屋方式']"></v-list-item>
              <v-list-item v-if="duplicateInfo['代驗公司名稱']" prepend-icon="mdi-domain" title="代驗公司名稱" :subtitle="duplicateInfo['代驗公司名稱']"></v-list-item>
              <v-list-item v-if="duplicateInfo['受託人姓名']" prepend-icon="mdi-account-tie-outline" title="受託人姓名" :subtitle="duplicateInfo['受託人姓名']"></v-list-item>
              <v-list-item v-if="duplicateInfo['受託人電話']" prepend-icon="mdi-phone-in-talk-outline" title="受託人電話" :subtitle="duplicateInfo['受託人電話']"></v-list-item>
          </v-list>
          <p class="font-weight-bold mt-4">請問您要如何處理？</p>
        </v-card-text>
        <v-divider></v-divider>
        <v-card-actions class="pa-3 d-flex flex-wrap ga-2 justify-end">
          <v-btn variant="text" @click="isDuplicateDialogVisible = false">放棄新增</v-btn>
          <v-btn color="primary" variant="outlined" :loading="isSaving" @click="executeAddAppointment(null)">保留舊的並新增</v-btn>
          <v-btn color="red-darken-1" variant="flat" :loading="isSaving" @click="executeAddAppointment(duplicateInfo['預約代碼'])">取消舊的並新增</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
    

  </v-container>
</template>

<script setup>
import { usePageContextStore } from '@/store/pageContextStore';
import Shepherd from 'shepherd.js';
import 'shepherd.js/dist/css/shepherd.css';
import { ref, onMounted, computed, watch, reactive, onUnmounted } from 'vue';
import { useRoute } from 'vue-router';
import { useUserStore } from '@/store/user';
import { 
  fetchInspectionAppointments, 
  getBookingInitialData, 
  getAllBookingRules, 
  updateBooking, 
  cancelBooking, 
  updateHouseholdData,
  fetchBuildingsAndUnitsAdmin,
  checkDuplicateAdmin,
  addAppointmentAdmin,
  fetchSpecifiedHouseDetails
} from '@/api'; 
import { format, startOfWeek, endOfWeek, addDays, isToday, isSaturday, isSunday, eachDayOfInterval, parseISO } from 'date-fns';
import { zhTW } from 'date-fns/locale';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { useClipboard } from '@vueuse/core';
import * as XLSX from 'xlsx-js-style';

// --- Store 和路由 ---
const route = useRoute();
const userStore = useUserStore();
const pageContextStore = usePageContextStore();

// --- 定義欄位應更新到哪張工作表 ---
const BOOKING_RECORD_FIELDS = ['預約人姓名', '預約人電話', '預約人身分證' ,'預約人EMAIL', '預約日期', '預約時段', '驗屋方式', '代驗公司名稱', '驗屋人員', '預約備註', '受託人姓名', '受託人電話'];
const HOUSEHOLD_DATA_FIELDS = ['門牌', '車位', '買方姓名', '買方電話',  '買方身分證', '買方EMAIL','撥款日期', '銀行', '銀行窗口', '備註', '驗屋文件', '驗屋報告', '初驗批次', '複驗批次', '後陽台門鎖更換批次'];

// --- 響應式狀態 ---
const isLoading = ref(true);
const error = ref(null);
const appointments = ref([]);
const isDialogVisible = ref(false); // For View/Edit Dialog
const isAddDialogVisible = ref(false); // For Add Dialog
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

// --- 編輯模式相關狀態 ---
const isEditMode = ref(false);
const editableEvent = ref(null);
const isSaving = ref(false);
const isCancelling = ref(false);
const bookingOptions = ref({
  inspectionMethods: [],
  inspectionStaff: []
});

// --- 預約規則相關狀態 ---
const allBookingRules = ref(null);

// --- 新增預約功能相關狀態 ---
const newAppointmentForm = ref(null);
const buildingsAndUnits = ref({});
const allHouseholdData = ref({}); 
const duplicateInfo = ref(null);
const isDuplicateDialogVisible = ref(false);
const newAppointmentData = reactive({
  building: null,
  戶別: null,
  預約項目: null,
  預約人姓名: '', 預約人電話: '', 預約人EMAIL: '', 預約人身分證: '', 預約日期: null, 預約時段: '',
  驗屋方式: '', 代驗公司名稱: '', 驗屋人員: [], 預約備註: '',
  受託人姓名: '', 受託人電話: '', 門牌: '', 車位: '', 買方姓名: '',
  買方電話: '', 買方EMAIL: '', 買方身分證: '', 撥款日期: '', 銀行: '', 銀行窗口: '', 備註: '',
  驗屋文件: '', 驗屋報告: '', 初驗批次: '', 複驗批次: '', 後陽台門鎖更換批次: ''
});

// --- 常數與計算屬性 ---
const PROJECT_NAME_MAP = { fuyu56: '富宇上城', fuyu61: '富宇富御', fuyu1750: '富宇首馥' };
const PROJECT_TIME_SLOTS = {
  '富宇上城': ['09:00', '10:00', '11:00', '13:00', '14:00', '15:00', '16:00'],
  '富宇富御': ['09:30', '10:00', '11:00', '13:30', '14:00','14:30'],
  'default': ['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00']
};
const displayFieldOptions = ref([
  { key: '戶別', label: '戶別' },
  { key: '預約人姓名', label: '預約人姓名' },
  { key: '預約項目', label: '預約項目' },
  { key: '驗屋方式', label: '驗屋方式' },
  { key: '代驗公司名稱', label: '代驗公司名稱' },
  { key: '特殊備註', label: '特殊備註' },
  { key: '特殊備註2', label: '特殊備註2' },
  { key: '驗屋人員', label: '驗屋人員', formatter: (val) => val ? `【${val}】` : null },
]);
const selectedDisplayFields = ref(['戶別', '預約項目', '驗屋人員']);
const CSS_KEYWORD_COLOR_MAP = [
  { keyword: '已撥款', backgroundColor: '#ffc107', color: '#212529' },
  { keyword: '交屋', backgroundColor: '#ffc107', color: '#212529' },
  { keyword: '初驗', backgroundColor: '#d4edda', color: '#155724' },
  { keyword: '複驗', backgroundColor: '#f8d7da', color: '#721c24' },
];
const EXCEL_KEYWORD_COLOR_MAP = [
  { keyword: '已撥款', backgroundColor: 'ffc107', textColor: '212529' },
  { keyword: '交屋', backgroundColor: 'ffc107', textColor: '212529' },
  { keyword: '初驗', backgroundColor: 'd4edda', textColor: '155724' },
  { keyword: '複驗', backgroundColor: 'f8d7da', textColor: '721c24' },
];
const PROJECT_TYPE_OPTIONS = {
  '富宇上城': ['初驗', '複驗', '後陽台門鎖更換'],
  '富宇富御': ['初驗', '複驗', ],
  '富宇首馥': ['初驗', '複驗'],
  'default': ['初驗', '複驗']
};
const fieldConfig = {
  default: [
    { 
      title: '基本資料', 
      fields: [ 
        { key: '門牌', label: '門牌', icon: 'mdi-map-marker-outline' }, 
        { key: '車位', label: '車位', icon: 'mdi-car-outline' }, 
        { key: '買方姓名', label: '買方姓名', icon: 'mdi-account-star-outline' }, 
        { key: '買方電話', label: '買方電話', icon: 'mdi-phone-outline', copyable: true }, 
        { key: '買方EMAIL', label: '買方EMAIL', icon: 'mdi-email-outline', copyable: true }, 
        { key: '買方身分證', label: '買方身分證', icon: 'mdi-card-account-details-outline' }
      ]
    },
    { 
      title: '預約人資料', 
      fields: [ 
        { key: '預約人姓名', label: '預約人姓名', icon: 'mdi-account-outline' }, 
        { key: '預約人電話', label: '預約人電話', icon: 'mdi-cellphone', copyable: true }, 
        { key: '預約人EMAIL', label: '預約人EMAIL', icon: 'mdi-email-outline', copyable: true }, 
        { key: '預約人身分證', label: '預約人身分證', icon: 'mdi-card-account-details-outline' }, 
      ]
    },
      { 
      title: '驗屋與預約詳情', 
      fields: [ 
        // ✨ 欄位已根據您的需求重新排序 ✨
        { key: '初驗批次', label: '初驗批次', icon: 'mdi-numeric-1-box-multiple-outline' }, 
        { key: '複驗批次', label: '複驗批次', icon: 'mdi-numeric-2-box-multiple-outline' }, 
        // ✨ 新增 type，讓模板可以渲染互動元件 ✨
        { key: '預約項目', label: '預約項目', icon: 'mdi-format-list-checks', type: 'booking-item-select' },
        { key: '驗屋方式', label: '驗屋方式', icon: 'mdi-cog-outline' }, 
        // ✨ 新增 type，讓模板可以渲染互動元件 ✨
        { key: '預約日期時段', label: '預約日期與時段', icon: 'mdi-calendar-clock', type: 'booking-datetime-select' },
        { key: '代驗公司名稱', label: '代驗公司', icon: 'mdi-domain' }, 
        { key: '受託人姓名', label: '受託人姓名', icon: 'mdi-account-tie-outline' }, 
        { key: '受託人電話', label: '受託人電話', icon: 'mdi-phone-in-talk-outline', copyable: true }, 
        { key: '預約備註', label: '預約備註', icon: 'mdi-note-text-outline' },
      ]
    },
    { 
      title: '相關文件', 
      fields: [ 
        { key: '撥款日期', label: '撥款日期', icon: 'mdi-cash-check', type: 'date' }, 
        { key: '銀行', label: '銀行', icon: 'mdi-bank-outline' }, 
        { key: '銀行窗口', label: '銀行窗口', icon: 'mdi-account-tie-outline' }, 
        { key: '驗屋文件', label: '驗屋文件', icon: 'mdi-file-document-outline', type: 'button', readOnly: true }, 
        { key: '驗屋報告', label: '驗屋報告', icon: 'mdi-file-chart-outline', type: 'button', readOnly: true },
        { key: '備註', label: '重要備註', icon: 'mdi-alert-circle-outline', type: 'remark' },
      ]
    },
  ]
};
const projectId = ref(route.params.projectId);
const projectName = computed(() => PROJECT_NAME_MAP[projectId.value] || '未知建案');
const pageTitle = computed(() => `${projectName.value} - 驗屋預約總表`);
const currentTypeOptions = computed(() => PROJECT_TYPE_OPTIONS[projectName.value] || PROJECT_TYPE_OPTIONS.default);
const selectedTypes = ref(currentTypeOptions.value);
const selectedStatuses = ref(['預約中', '取消']);
const projectFieldConfig = computed(() => fieldConfig[projectName.value] || fieldConfig.default);
const canEdit = computed(() => userStore.hasProjectPermission('驗屋時間表-修改', projectName.value));

const buildingOptions = computed(() => {
  // 對從物件中取出的 key 陣列進行排序
  return Object.keys(buildingsAndUnits.value).sort((a, b) => a.localeCompare(b, 'zh-Hant', { numeric: true }));
});
const unitOptions = computed(() => newAppointmentData.building ? (buildingsAndUnits.value[newAppointmentData.building] || []) : []);

const filteredAppointments = computed(() => {
    return processAppointments(appointments.value).filter(appt => {
    const statusMatch = selectedStatuses.value.length === 0 ? false : selectedStatuses.value.includes(appt['預約狀態']);
    const typeMatch = selectedTypes.value.length === 0 ? false : selectedTypes.value.includes(appt['預約項目']);
    const query = searchQuery.value ? searchQuery.value.toLowerCase().trim() : '';
    const queryMatch = !query || [
      appt['戶別'], appt['門牌'], appt['預約人姓名'], appt['買方姓名'], appt['買方電話'], appt['預約人電話'], appt['預約人身分證'], appt['買方身分證'], appt['預約項目'],
      appt['驗屋方式'], appt['代驗公司名稱'], appt['驗屋人員'], appt['備註'],
      appt['車位'], appt['銀行'], appt['銀行窗口'],appt['預約代碼'],appt['預約日期'],appt['預約狀態'],appt['特殊備註'],appt['特殊備註2']
    ].some(field => field && String(field).toLowerCase().includes(query));
    return statusMatch && typeMatch && queryMatch;
  });
});

const foundDates = computed(() => {
  if (!searchQuery.value) return [];
  const dates = filteredAppointments.value.map(appt => format(appt.start, 'yyyy-MM-dd'));
  return [...new Set(dates)];
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

const startDateFormatted = computed({
  get: () => format(startDate.value, 'yyyy-MM-dd'),
  set: (val) => { const [y, m, d] = val.split('-').map(Number); startDate.value = new Date(y, m - 1, d); }
});

const endDateFormatted = computed({
  get: () => format(endDate.value, 'yyyy-MM-dd'),
  set: (val) => { const [y, m, d] = val.split('-').map(Number); endDate.value = new Date(y, m - 1, d); }
});

const timeSlots = computed(() => PROJECT_TIME_SLOTS[projectName.value] || PROJECT_TIME_SLOTS.default);

const groupedEvents = computed(() => {
  const grouped = {};
  filteredAppointments.value.forEach(event => {
    const dateKey = format(event.start, 'yyyy-MM-dd');
    const eventStartTime = format(event.start, 'HH:mm');
    const timeKey = timeSlots.value.find((slot, index) => {
        const nextSlot = timeSlots.value[index + 1] || '23:59';
        return eventStartTime >= slot && eventStartTime < nextSlot;
    }) || timeSlots.value[0];

    if (!grouped[dateKey]) grouped[dateKey] = {};
    if (!grouped[dateKey][timeKey]) grouped[dateKey][timeKey] = [];
    grouped[dateKey][timeKey].push(event);
  });
  return grouped;
});

const bookingHistory = computed(() => {
    let householdId = isAddDialogVisible.value ? newAppointmentData.戶別 : (selectedEvent.value ? selectedEvent.value['戶別'] : null);
    if (!householdId) return [];
    return appointments.value.filter(appt => appt['戶別'] === householdId).sort((a, b) => new Date(a['預約日期']) - new Date(b['預約日期']));
});

const displayPanels = computed(() => {
  const panels = [...projectFieldConfig.value];
  if (bookingHistory.value.length > 0) panels.push({ title: '歷次預約紀錄', isHistoryPanel: true });
  return panels;
});

const currentBookingRules = computed(() => {
    const isAdding = isAddDialogVisible.value;
    const currentData = isAdding ? newAppointmentData : editableEvent.value;
    if (!currentData || !allBookingRules.value) return null;
    const { '戶別': unitId, '預約項目': bookingType, '驗屋方式': bookingMethod } = currentData;
    const { batchRules, timeSlotRules } = allBookingRules.value;
    if (!unitId || !bookingType || !bookingMethod || !batchRules || !timeSlotRules) return null;
    const householdDetails = allHouseholdData.value[unitId];
    if (!householdDetails) return null;
    const batchKey = `${bookingType}批次`;
    const batchName = isAdding ? householdDetails[batchKey] : currentData[batchKey];
    if (!batchName) return null;
    const dateRule = batchRules[batchName];
    if (!dateRule) return null;
    const simplifiedMethod = (bookingMethod === '代驗公司') ? '代驗' : '自驗';
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
    if (!currentData?.['預約日期'] || !currentBookingRules.value) return [];
    const selectedDate = format(new Date(currentData['預約日期']), 'yyyy-MM-dd');
    return currentBookingRules.value.timeSlotsByDate[selectedDate] || [];
});

// --- 方法 ---
function resetNewAppointmentForm() {
    Object.assign(newAppointmentData, {
        building: null, 戶別: null, 預約項目: null, 預約人姓名: '',預約人電話: '', 預約人EMAIL: '', 預約日期: null, 預約時段: '',
        驗屋方式: '', 代驗公司名稱: '', 驗屋人員: [], 預約備註: '', 受託人姓名: '', 受託人電話: '', 門牌: '',
        車位: '', 買方姓名: '', 買方電話: '', 買方身分證: '', 買方EMAIL: '', 撥款日期: '', 銀行: '', 銀行窗口: '', 備註: '',
        驗屋文件: '', 驗屋報告: '', 初驗批次: '', 複驗批次: '', 後陽台門鎖更換批次: ''
    });
}
function handleOpenAddDialog() {
    resetNewAppointmentForm();
    isEditMode.value = false;
    isAddDialogVisible.value = true;
}
watch(() => newAppointmentData.building, () => {
    newAppointmentData.戶別 = null;
    newAppointmentData.預約項目 = null;
});
// 選擇戶別後，從【預先載入好】的資料中查找並填入
watch(() => newAppointmentData.戶別, (newUnit) => {
    // 先重置所有可能因戶別變更而失效的欄位
    const fieldsToReset = { 預約人姓名: '', 預約人電話: '', 預約人EMAIL: '', 預約日期: null, 預約時段: '', 驗屋方式: '', 代驗公司名稱: '', 驗屋人員: [], 預約備註: '', 受託人姓名: '', 受託人電話: ''};
    Object.assign(newAppointmentData, fieldsToReset);
    newAppointmentData.預約項目 = null;
    
    // ✨ 核心邏輯：直接從已存在的 allHouseholdData 中同步查找，無需 await
    if (newUnit && allHouseholdData.value[newUnit]) {
        const data = allHouseholdData.value[newUnit];
        
        // 因為 key 都已對應好，直接遍歷複製
        Object.keys(data).forEach(key => {
            if (newAppointmentData.hasOwnProperty(key)) {
                newAppointmentData[key] = data[key] || '';
            }
        });

        // 另外將買方姓名/電話也預填到預約人欄位
        newAppointmentData.預約人姓名 = data['買方姓名'] || '';
        newAppointmentData.預約人電話 = data['買方電話'] || '';
        newAppointmentData.預約人EMAIL = data['買方EMAIL'] || '';
         newAppointmentData.預約人身分證 = data['買方身分證'] || '';

        // 自動展開面板
        panels.value = [0, 1, 2, 3];

    } else {
        // 如果取消選擇，重置表單
        const building = newAppointmentData.building;
        resetNewAppointmentForm();
        newAppointmentData.building = building;
    }
});


async function handleSaveNewAppointment() {
   
    const { valid, errors } = await newAppointmentForm.value.validate();

  
    if (!valid) {
        snackbarText.value = '請檢查表單，有必填欄位尚未填寫。';
        snackbar.value = true;
        return;
    }

    isSaving.value = true;

    try {
        const projectNameValue = projectName.value;
        const unitValue = newAppointmentData.戶別;
        const itemValue = newAppointmentData.預約項目;

      
        const checkRes = await checkDuplicateAdmin(projectNameValue, unitValue, itemValue);
        
      

        if (checkRes.status === 'success' && checkRes.data.status === 'found') {   
            duplicateInfo.value = checkRes.data.record;
            isDuplicateDialogVisible.value = true;
        } else if (checkRes.status === 'success') {
         
            await executeAddAppointment(null);
        } else {
           
            throw new Error(checkRes.message || '檢查重複預約時發生錯誤');
        }

    } catch(err) {
       
        error.value = `儲存失敗: ${err.message}`;
    } finally {
        isSaving.value = false;
    }
}

async function executeAddAppointment(cancelCode = null) {
    isSaving.value = true;
    try {
        const payload = { ...newAppointmentData };

        // --- ✨ 新增的程式碼段落 ✨ ---
        // 在發送到後端前，將預約日期格式化為 'yyyy-MM-dd'
        // format 函式會自動使用瀏覽器的本地時區 (台灣)，正確地將 UTC 時間轉換
        if (payload['預約日期']) {
            payload['預約日期'] = format(new Date(payload['預約日期']), 'yyyy-MM-dd');
        }
        // --- ✨ 修改結束 ✨ ---

        if (Array.isArray(payload.驗屋人員)) payload.驗屋人員 = payload.驗屋人員.join(',');
        const res = await addAppointmentAdmin(projectName.value, payload, cancelCode);
        if (res.status === 'success') {
            snackbarText.value = '新增預約成功！';
            snackbar.value = true;
            isAddDialogVisible.value = false;
            isDuplicateDialogVisible.value = false;
            await fetchData();
        } else {
            throw new Error(res.message || '新增預約時後端發生錯誤');
        }
    } catch (err) {
        error.value = `儲存失敗: ${err.message}`;
    } finally {
        isSaving.value = false;
    }
}

function processAppointments(rawAppointments) {
  return rawAppointments.map(appt => {
      try {
        if (!appt['預約日期']) return null;
        const rawDateObject = new Date(appt['預約日期']);
        if (isNaN(rawDateObject.getTime())) return null;
        const date = format(rawDateObject, 'yyyy-MM-dd');
        const timeSlot = appt['預約時段'] ? String(appt['預約時段']).replace(/：/g, ':') : '00:00';
        const startTime = timeSlot.split('-')[0]?.trim() || '00:00';
        const displayParts = displayFieldOptions.value
          .filter(option => selectedDisplayFields.value.includes(option.key))
          .map(option => {
            const value = appt[option.key];
            if (!value) return null;
            const formattedValue = option.formatter ? option.formatter(value) : String(value);
            return { text: formattedValue, isHousehold: option.key === '戶別' };
          }).filter(Boolean);
        return { ...appt, id: `${appt['填表時間']}_${appt['戶別']}`, start: parseISO(`${date}T${startTime}`), displayParts };
      } catch (e) {
        console.warn(`處理預約資料時發生錯誤: ${e.message}`, appt);
        return null;
      }
    }).filter(event => event !== null);
}
function handleCustomEventClick(event) {
  selectedEvent.value = event;
  isEditMode.value = false;
  panels.value = [];
  isDialogVisible.value = true;
}
function enterEditMode() {
  const eventCopy = JSON.parse(JSON.stringify(selectedEvent.value));
  const dateFields = ['預約日期', '撥款日期'];
  dateFields.forEach(key => {
    if (eventCopy[key] && !isNaN(new Date(eventCopy[key]).getTime())) {
      eventCopy[key] = format(new Date(eventCopy[key]), 'yyyy-MM-dd');
    } else {
      eventCopy[key] = '';
    }
  });
  const multiSelectFields = ['驗屋人員'];
  multiSelectFields.forEach(key => {
    if (eventCopy[key] && typeof eventCopy[key] === 'string') {
      eventCopy[key] = eventCopy[key].split(',').map(name => name.trim()).filter(Boolean);
    } else if (!eventCopy[key]) {
      eventCopy[key] = [];
    }
  });
  editableEvent.value = eventCopy;
  isEditMode.value = true;
}
async function saveChanges() {
    // This function now ONLY handles UPDATING an existing event.
    if (!isEditMode.value) return;

    isSaving.value = true;
    error.value = null;

    try {
        const bookingUpdatePayload = {};
        const householdUpdatePayload = {};
        const allEditableFields = [...BOOKING_RECORD_FIELDS, ...HOUSEHOLD_DATA_FIELDS];
        for (const key of allEditableFields) {
            if (editableEvent.value.hasOwnProperty(key)) {
                let originalValue = selectedEvent.value[key];
                let editedValue = editableEvent.value[key];
                if (key === '驗屋人員') {
                    editedValue = Array.isArray(editableEvent.value[key]) ? editableEvent.value[key].join(',') : editableEvent.value[key];
                }
                if (originalValue !== editedValue) {
                    if (BOOKING_RECORD_FIELDS.includes(key)) bookingUpdatePayload[key] = editedValue;
                    else if (HOUSEHOLD_DATA_FIELDS.includes(key)) householdUpdatePayload[key] = editedValue;
                }
            }
        }

        // --- ✨ 新增的程式碼段落 ✨ ---
        // 如果預約日期有被修改，同樣進行格式化
        if (bookingUpdatePayload['預約日期']) {
            bookingUpdatePayload['預約日期'] = format(new Date(bookingUpdatePayload['預約日期']), 'yyyy-MM-dd');
        }
        // --- ✨ 修改結束 ✨ ---

        const apiPromises = [];
        if (Object.keys(bookingUpdatePayload).length > 0) apiPromises.push(updateBooking(projectName.value, editableEvent.value['預約代碼'], bookingUpdatePayload));
        if (Object.keys(householdUpdatePayload).length > 0) apiPromises.push(updateHouseholdData(projectName.value, editableEvent.value['戶別'], householdUpdatePayload));
        
        if (apiPromises.length > 0) {
            const responses = await Promise.all(apiPromises);
            const failedResponse = responses.find(res => res.status !== 'success');
            if (failedResponse) throw new Error(failedResponse.message || '部分或全部資料更新失敗');
            snackbarText.value = '儲存成功！';
            snackbar.value = true;
        } else {
            snackbarText.value = '沒有偵測到任何變更。';
            snackbar.value = true;
        }
        isDialogVisible.value = false;
        isEditMode.value = false;
        await fetchData();
    } catch (err) {
        error.value = `儲存失敗: ${err.message}`;
    } finally {
        isSaving.value = false;
    }
}
async function handleCancelBooking() {
  if (!eventToCancel.value) return;
  isCancelling.value = true;
  error.value = null;
  try {
    const response = await cancelBooking(projectName.value, eventToCancel.value['預約代碼']);
    if (response.status === 'success') {
      alert('預約已成功取消！');
      isDialogVisible.value = false;
      isCancelConfirmDialogVisible.value = false;
      await fetchData();
    } else {
      throw new Error(response.message || '取消失敗');
    }
  } catch (err) {
    error.value = `取消預約失敗: ${err.message}`;
    alert(`取消預約失敗: ${err.message}`);
  } finally {
    isCancelling.value = false;
    eventToCancel.value = null;
  }
}
async function fetchData() {
  isLoading.value = true;
  error.value = null;
  try {
    // ✨ 在這裡定義前端需要的所有欄位
    const fieldsToFetch = [
        '戶別', '棟別', '買方姓名', '買方電話', '買方EMAIL', '買方身分證', '車位', '門牌', 
        '驗屋報告', '驗屋文件', '初驗批次', '複驗批次', '後陽台門鎖更換批次', 
        '撥款日期', '銀行', '銀行窗口', '備註'
    ];

    const [appointmentsResponse, optionsResponse, rulesResponse, buildingsUnitsResponse, specifiedDetailsResponse] = await Promise.all([
      fetchInspectionAppointments(projectName.value),
      getBookingInitialData(projectName.value),
      getAllBookingRules(projectName.value),
      fetchBuildingsAndUnitsAdmin(projectName.value),
      fetchSpecifiedHouseDetails(projectName.value, fieldsToFetch) // ✨ 改為呼叫新 API
    ]);

    if (appointmentsResponse.status === 'success') {
      appointments.value = appointmentsResponse.data;
      
      // ✨ --- 3. 核心修改：在設定情境前，預先處理日期 --- ✨
      const contextForAI = appointments.value.map(appt => {
        // 確保 '預約日期' 存在且有效
        const appointmentDate = appt['預約日期'] ? new Date(appt['預約日期']) : null;
        
        return {
          戶別: appt['戶別'],
          預約項目: appt['預約項目'],
          // 如果日期有效，就格式化為 'yyyy-MM-dd' 的台灣日期字串
          預約日期: appointmentDate && !isNaN(appointmentDate) 
                      ? format(appointmentDate, 'yyyy-MM-dd') 
                      : '無效日期',
          預約時段: appt['預約時段'],
          預約狀態: appt['預約狀態'],
          買方姓名: appt['買方姓名'],
          買方電話: appt['買方電話'],
          買方EMAIL: appt['買方EMAIL'],
          買方身分證: appt['買方身分證'], 
          預約人姓名: appt['預約人姓名'],
          預約人電話: appt['預約人電話'],
          預約人EMAIL: appt['預約人EMAIL'],
          預約人身分證: appt['預約人身分證'],
          車位: appt['車位'],
          門牌: appt['門牌'],
          撥款日期: appt['撥款日期'] ? format(new Date(appt['撥款日期']), 'yyyy-MM-dd') : '',
          銀行: appt['銀行'],
          銀行窗口: appt['銀行窗口'],
          驗屋報告: appt['驗屋報告'],
          驗屋文件: appt['驗屋文件'],
          初驗批次: appt['初驗批次'],
          複驗批次: appt['複驗批次'],
          後陽台門鎖更換批次: appt['後陽台門鎖更換批次'],
          備註: appt['備註'],
          預約代碼: appt['預約代碼'],
          驗屋方式: appt['驗屋方式'],
          代驗公司名稱: appt['代驗公司名稱'],
          受託人姓名: appt['受託人姓名'],
          受託人電話: appt['受託人電話'],     
          驗屋人員: appt['驗屋人員'],
          預約備註: appt['預約備註']
        };
      });
      pageContextStore.setContext('驗屋行事曆', contextForAI);
      // ✨ --- 修改結束 --- ✨

    } else throw new Error(appointmentsResponse.message || '無法獲取預約資料');

    if (optionsResponse.status === 'success') {
      bookingOptions.value.inspectionMethods = optionsResponse.data.inspectionMethods || [];
      bookingOptions.value.inspectionStaff = optionsResponse.data.inspectionStaff || [];
    } else console.warn('無法獲取表單選項資料:', optionsResponse.message);

    if (rulesResponse.status === 'success') {
        allBookingRules.value = rulesResponse.data;
    } else {
        console.warn('無法獲取預約規則資料:', rulesResponse.message);
        allBookingRules.value = null; 
    }
    if (buildingsUnitsResponse.status === 'success') {
        buildingsAndUnits.value = buildingsUnitsResponse.data;
    } else console.warn('無法獲取棟別戶別資料:', buildingsUnitsResponse.message);
 
     if (specifiedDetailsResponse.status === 'success') {
        allHouseholdData.value = specifiedDetailsResponse.data;
    } else {
        console.warn('無法獲取指定的戶別詳細資料:', specifiedDetailsResponse.message);
    }

  } catch (err) {
    console.error('獲取資料失敗:', err);
    error.value = err.message;
  } finally {
    isLoading.value = false;
  }
}

const isDateAllowed = (date) => {
  if (!currentBookingRules.value) return false;
  const dateStr = format(date, 'yyyy-MM-dd');
  return !currentBookingRules.value.unavailableDates.includes(dateStr);
};
watch(() => editableEvent.value?.['預約日期'], (newDate, oldDate) => {
  if (isEditMode.value && newDate !== oldDate && editableEvent.value) editableEvent.value['預約時段'] = '';
});
watch(() => newAppointmentData.預約日期, (newDate, oldDate) => {
    if (isAddDialogVisible.value && newDate !== oldDate) newAppointmentData.預約時段 = '';
});
watch(currentTypeOptions, (newOptions) => {
  selectedTypes.value = [...newOptions];
}, { immediate: true });

onMounted(() => {
  if (PROJECT_NAME_MAP[projectId.value]) fetchData();
  else {
    error.value = `無效的建案ID: ${projectId.value}`;
    isLoading.value = false;
  }
});

// ✨ --- 在元件卸載時，清除情境 --- ✨
onUnmounted(() => {
  pageContextStore.clearContext();
});

// --- 其他輔助函式 ---
function promptCancelBooking(event) { eventToCancel.value = event; isCancelConfirmDialogVisible.value = true; }
function handleCopy(value) { const { copy } = useClipboard({ source: value }); copy(value); snackbarText.value = '已複製到剪貼簿！'; snackbar.value = true; }
function openUrl(url) { if (url) window.open(url, '_blank', 'noopener,noreferrer'); }
function getEventStyle(event) {
  if (!event || Object.keys(event).length === 0) return { backgroundColor: '#FFFFFF', color: '#000000' };
  if (event['預約狀態'] === '取消') return { backgroundColor: '#F5F5F5', color: '#9E9E9E' };
  const textToSearch = [ event['預約項目'], event['驗屋方式'], event['特殊備註'], event['特殊備註2'] ].join(' ');
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
  if (event['預約狀態'] === '取消') return { backgroundColor: 'F5F5F5', textColor: '9E9E9E' };
  const textToSearch = [ event['預約項目'], event['驗屋方式'], event['特殊備註'], event['特殊備註2'] ].join(' ');
  for (const config of EXCEL_KEYWORD_COLOR_MAP) {
    if (config.keyword && textToSearch.includes(config.keyword)) return { backgroundColor: config.backgroundColor, textColor: config.textColor };
  }
  return { backgroundColor: 'EEEEEE', textColor: '212121' };
}
function safeFormatDate(value, formatString = 'yyyy-MM-dd') {
  if (!value || String(value).trim() === '') return '';
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
      { key: '預約時段', label: '時間', wch: 12 },
      ...selectedOptions.map(option => ({
        key: option.key,
        label: option.label,
        wch: 20
      })),
      { key: '預約狀態', label: '狀態', wch: 12 },
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
// --- ✨ 新增：操作說明的邏輯 ✨ ---

// 建立一個導覽實體
const tour = new Shepherd.Tour({
  useModalOverlay: true, // 讓背景變暗，凸顯目標
  defaultStepOptions: {
    cancelIcon: {
      enabled: true
    },
    classes: 'shepherd-theme-arrows',
    scrollTo: { behavior: 'smooth', block: 'center' }
  }
});

// 定義導覽的步驟 (將我們先前的說明文字放入)
const tourSteps = [
  {
    id: 'step1-overview',
    title: '總覽與基本操作',
    text: '這裡是預約總覽日曆，您可以一目了然地看到每日的排程。直接點擊任一則預約，即可彈出視窗查看完整資訊。',
    attachTo: {
      element: '#custom-calendar-container', // 附加到日曆容器上
      on: 'bottom'
    },
    buttons: [{ text: '下一步', action: tour.next }]
  },
  {
    id: 'step2-filters',
    title: '篩選與搜尋功能',
    text: '透過上方的篩選列，可以快速精準地找到您需要的資料，包含：日期範圍、關鍵字、預約狀態與項目。',
    attachTo: {
      element: '#filter-panel', // 附加到篩選面板上
      on: 'bottom'
    },
    buttons: [
      { text: '上一步', action: tour.back },
      { text: '下一步', action: tour.next }
    ]
  },
  {
    id: 'step3-display-options',
    title: '自訂日曆顯示內容',
    text: '透過勾選「標題顯示」的項目，您可以自由決定要在日曆的預約方塊上顯示哪些資訊，讓畫面更符合您的需求。',
    attachTo: {
      element: '#display-options-panel', // 附加到標題顯示區塊上
      on: 'top'
    },
    buttons: [
      { text: '上一步', action: tour.back },
      { text: '下一步', action: tour.next }
    ]
  },
  {
    id: 'step4-actions',
    title: '功能按鈕',
    text: '這裡提供了重新整理、下載圖片(PNG)和下載客製化報表(Excel)等實用功能。',
    attachTo: {
      element: '#action-buttons', // 附加到功能按鈕區塊上
      on: 'bottom'
    },
    buttons: [
      { text: '上一步', action: tour.back },
      { text: '完成', action: tour.complete }
    ]
  }
];

// 將步驟加入導覽實體
tour.addSteps(tourSteps);

// 建立一個啟動導覽的函式
function startTour() {
  tour.start();
}
// --- ✨ 操作說明邏輯結束 ✨ ---


// --- 最終版：整合平滑度、防選取、加速度的拖曳指令 ---
const vDraggableDialog = {
  mounted: (el) => {
    el.style.cursor = 'move';
    const dialog = el.closest('.v-dialog');
    if (!dialog) return;

    // ▼▼▼ 在此處定義靈敏度 ▼▼▼
    const sensitivity = 2.2; // 可調整此數值，例如 0.8 (較慢) 或 1.2 (較快)

    let isDragging = false;
    let startX, startY, initialLeft, initialTop;
    let latestMouseX, latestMouseY;
    let animationFrameId = null;

    const onMouseDown = (e) => {
      if (e.button !== 0) return;
      isDragging = true;
      startX = e.clientX;
      startY = e.clientY;
      latestMouseX = e.clientX;
      latestMouseY = e.clientY;
      const style = window.getComputedStyle(dialog);
      initialLeft = parseFloat(style.left);
      initialTop = parseFloat(style.top);
      
      document.body.classList.add('is-dragging');
      document.addEventListener('mousemove', onMouseMove);
      document.addEventListener('mouseup', onMouseUp);
      animationFrameId = requestAnimationFrame(updatePosition);
    };

    const onMouseMove = (e) => {
      if (!isDragging) return;
      e.preventDefault();
      latestMouseX = e.clientX;
      latestMouseY = e.clientY;
    };
    
    const updatePosition = () => {
      if (!isDragging) return;

      // ▼▼▼ 在計算位移時加入 sensitivity 乘數 ▼▼▼
      const dx = (latestMouseX - startX) * sensitivity;
      const dy = (latestMouseY - startY) * sensitivity;
      
      dialog.style.left = `${initialLeft + dx}px`;
      dialog.style.top = `${initialTop + dy}px`;
      animationFrameId = requestAnimationFrame(updatePosition);
    };

    const onMouseUp = () => {
      isDragging = false;
      document.body.classList.remove('is-dragging');
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
      cancelAnimationFrame(animationFrameId);
    };

    el.addEventListener('mousedown', onMouseDown);
  }
};
// --- 指令結束 ---

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