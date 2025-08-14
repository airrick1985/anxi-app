<template>
  <v-container fluid>
    <v-card class="pa-4">
      <v-card-title class="d-flex align-center justify-space-between text-h5 text-primary mb-4">
        <span>{{ pageTitle }}</span>

        <div>
                <div class="d-none d-md-flex ga-2">
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
        <v-row class="mb-4 align-center bg-grey-lighten-4 pa-3 rounded d-none d-md-flex" dense>
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
             <div class="d-flex align-center flex-wrap">
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

   <v-dialog v-model="isDialogVisible" max-width="800px" persistent>
  <v-card v-if="selectedEvent">
    <v-card-title class="text-h6 primary-bg d-flex align-center">
      <v-icon start>mdi-calendar-text</v-icon>
      <span>預約詳細資訊</span>
      <v-spacer></v-spacer>
      <v-btn variant="text" icon="mdi-close" density="compact" @click="isDialogVisible = false"></v-btn>
    </v-card-title>
    
<v-card-text class="bg-grey-lighten-5 pa-4">
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
      <v-menu :close-on-content-click="false">
        <template v-slot:activator="{ props }">
          <v-text-field
            :model-value="safeFormatDate(editableEvent['預約日期'], 'yyyy-MM-dd')"
            label="預約日期"
            prepend-inner-icon="mdi-calendar"
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
</v-card-text>

    <v-divider></v-divider>

    <v-card-text class="pa-0">
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
    <template v-for="(field, index) in getVisibleFields(panel.fields)" :key="field.key">
      <div v-if="field.type === 'remark'" class="py-2 px-4">
          <p class="text-subtitle-2 font-weight-bold mb-1 text-grey-darken-2">{{ field.label }}</p>
          <div v-if="!isEditMode" :class="selectedEvent[field.key] ? 'remarks-text pa-0' : 'text-grey'">
            <div style="white-space: pre-wrap;">{{ selectedEvent[field.key] || '無' }}</div>
          </div>
          <v-textarea
          v-else
          v-model="editableEvent[field.key]"
          :label="field.label"
          variant="outlined"
          density="compact"
          rows="3"
          auto-grow
          hide-details
          ></v-textarea>
      </div>
      <v-list-item v-else-if="field.type === 'chips'">
        <template v-slot:prepend><v-icon :icon="field.icon"></v-icon></template>
        <v-list-item-title class="font-weight-medium">{{ field.label }}</v-list-item-title>
        <v-list-item-subtitle>
          <div v-if="!isEditMode">
            <div v-if="selectedEvent[field.key]" class="d-flex flex-wrap ga-1 mt-1">
              <v-chip v-for="item in String(selectedEvent[field.key]).split(',').filter(i=>i.trim())" :key="item" size="small" color="primary" variant="elevated">
                {{ item.trim() }}
              </v-chip>
            </div>
            <span v-else>無</span>
          </div>
          <v-select
            v-else
            v-model="editableEvent[field.key]"
            :items="bookingOptions.inspectionStaff"
            :label="field.label"
            density="compact"
            multiple
            chips
            clearable
            hide-details
            class="mt-2"
          ></v-select>
        </v-list-item-subtitle>
      </v-list-item>
      <v-list-item v-else>
        <template v-slot:prepend><v-icon :icon="field.icon"></v-icon></template>
        <v-list-item-subtitle>{{ field.label }}</v-list-item-subtitle>
        
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
      <v-divider v-if="index < getVisibleFields(panel.fields).length -1"></v-divider>
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

    <v-dialog v-model="isCancelConfirmDialogVisible" max-width="500px" persistent>
      <v-card v-if="eventToCancel">
        <v-card-title class="text-h6 d-flex align-center bg-red-lighten-4">
          <v-icon start color="red-darken-2">mdi-alert-circle-outline</v-icon>
          <span>確認取消預約</span>
        </v-card-title>
        
        <v-divider></v-divider>

        <v-card-text class="py-4">
          <p class="mb-4">您確定要取消以下這筆預約紀錄嗎？</p>
          
          <v-list density="compact" class="bg-red-lighten-5 rounded">
            <v-list-item
              :title="`${eventToCancel['戶別']} (${eventToCancel['姓名']})`"
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

    <v-navigation-drawer
      v-model="isFilterDrawerVisible"
      location="right"
      temporary
      width="300"
    >
      <v-sheet class="d-flex flex-column h-100">
        <v-list-item title="篩選條件" subtitle="請選擇您的篩選範圍" class="bg-grey-lighten-3">
          <template v-slot:append>
            <v-btn
              variant="text"
              icon="mdi-close"
              @click="isFilterDrawerVisible = false"
            ></v-btn>
          </template>
        </v-list-item>
        <v-divider></v-divider>

        <div class="pa-4" style="overflow-y: auto;">
          <v-label class="mb-2">日期範圍</v-label>
          <v-text-field
            v-model="startDateFormatted"
            label="開始日期"
            type="date"
            density="compact"
            class="mb-3"
          ></v-text-field>
          <v-text-field
            v-model="endDateFormatted"
            label="結束日期"
            type="date"
            density="compact"
            class="mb-3"
          ></v-text-field>
          
          <v-divider class="my-3"></v-divider>
          
          <v-text-field
            v-model="searchQuery"
            label="關鍵字搜尋..."
            prepend-inner-icon="mdi-magnify"
            density="compact"
            clearable
            variant="outlined"
            color="primary"
            class="mb-3"
          ></v-text-field>

          <v-divider class="my-3"></v-divider>

          <div>
            <v-label class="mb-2">狀態</v-label>
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

          <v-divider class="my-3"></v-divider>
          
          <div>
            <v-label class="mb-2">項目</v-label>
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

          <v-divider class="my-3"></v-divider>

          <div>
            <v-label class="mb-2">標題顯示</v-label>
              <v-checkbox
                v-for="field in displayFieldOptions"
                :key="field.key"
                v-model="selectedDisplayFields"
                :label="field.label"
                :value="field.key"
                density="compact"
                hide-details
                color="indigo"
              ></v-checkbox>
          </div>
        </div>

        <v-spacer></v-spacer>

        <div class="pa-2 bg-grey-lighten-4">
          <v-btn
            color="primary"
            block
            @click="isFilterDrawerVisible = false"
          >
            完成
          </v-btn>
        </div>
      </v-sheet>
    </v-navigation-drawer>
  </v-container>
</template>

<script setup>
import { ref, onMounted, computed, watch } from 'vue';
import { useRoute } from 'vue-router';
import { useUserStore } from '@/store/user';
import { fetchInspectionAppointments, getBookingInitialData, getAllBookingRules, updateBooking, cancelBooking, updateHouseholdData } from '@/api';
import { format, startOfWeek, endOfWeek, addDays, isToday, isSaturday, isSunday, eachDayOfInterval, parseISO } from 'date-fns';
import { zhTW } from 'date-fns/locale';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { useClipboard } from '@vueuse/core';
import * as XLSX from 'xlsx-js-style';

// --- Store 和路由 ---
const route = useRoute();
const userStore = useUserStore();

// --- 定義欄位應更新到哪張工作表 ---
const BOOKING_RECORD_FIELDS = ['姓名', '電話', 'EMAIL', '預約日期', '預約時段', '驗屋方式', '代驗公司名稱', '驗屋人員', '預約備註', '受託人姓名', '受託人電話'];
const HOUSEHOLD_DATA_FIELDS = ['門牌', '車位', '買方姓名', '買方電話', '撥款日期', '銀行', '銀行窗口', '備註', '驗屋文件', '驗屋報告', '初驗批次', '複驗批次', '後陽台門鎖更換批次'];

// --- 響應式狀態 ---
const isLoading = ref(true);
const error = ref(null);
const appointments = ref([]);
const isDialogVisible = ref(false);
const selectedEvent = ref(null);
const isDownloadingPdf = ref(false);

// ✨ 修改：新增 Excel 下載狀態的響應式變數。
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

// --- 編輯模式相關狀態 ---
const isEditMode = ref(false);
const editableEvent = ref(null);
const isSaving = ref(false);
const isCancelling = ref(false);
const bookingOptions = ref({
  inspectionMethods: [],
  inspectionStaff: []
});

// --- 新的預約規則相關狀態 ---
const allBookingRules = ref(null);

// --- 常數與計算屬性 ---
const PROJECT_NAME_MAP = { fuyu56: '富宇上城', fuyu61: '富宇富御', fuyu1750: '富宇首馥' };
const PROJECT_TIME_SLOTS = {
  '富宇上城': ['09:00', '10:00', '11:00', '13:00', '14:00', '15:00', '16:00'],
  '富宇富御': ['09:30', '10:00', '11:00', '13:30', '14:00','14:30'],
  'default': ['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00']
};
// --- ✨ 新增：標題顯示選項 ---
const displayFieldOptions = ref([
  { key: '戶別', label: '戶別' },
  { key: '買方姓名', label: '買方姓名' },
  { key: '預約項目', label: '預約項目' },
  { key: '驗屋方式', label: '驗屋方式' },
  { key: '代驗公司名稱', label: '代驗公司名稱' },
  { key: '特殊備註', label: '特殊備註' },
  { key: '特殊備註2', label: '特殊備註2' },
  { key: '驗屋人員', label: '驗屋人員', formatter: (val) => val ? `【${val}】` : null },
]);
// --- ✨ 新增：儲存使用者勾選的標題欄位，並設定預設值 ---
const selectedDisplayFields = ref(['戶別', '預約項目', '驗屋人員']);

// ✨ 修改：建立專門給 CSS 使用的顏色設定 (包含 #)
const CSS_KEYWORD_COLOR_MAP = [
  { keyword: '已撥款', backgroundColor: '#ffc107', color: '#212529' },
  { keyword: '交屋', backgroundColor: '#ffc107', color: '#212529' },
  { keyword: '初驗', backgroundColor: '#d4edda', color: '#155724' },
  { keyword: '複驗', backgroundColor: '#f8d7da', color: '#721c24' },
];

// ✨ 修改：建立專門給 Excel 使用的顏色設定 (不含 #)
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
    { title: '基本資料', fields: [ { key: '門牌', label: '門牌', icon: 'mdi-map-marker-outline' }, { key: '車位', label: '車位', icon: 'mdi-car-outline' }, { key: '買方姓名', label: '買方姓名', icon: 'mdi-account-star-outline' }, { key: '買方電話', label: '買方電話', icon: 'mdi-phone-outline', copyable: true }, ]},
    { title: '預約人資料', fields: [ { key: '姓名', label: '姓名', icon: 'mdi-account-outline' }, { key: '電話', label: '電話', icon: 'mdi-cellphone', copyable: true }, { key: 'EMAIL', label: 'EMAIL', icon: 'mdi-email-outline', copyable: true }, { key: '身分證', label: '身分證', icon: 'mdi-card-account-details-outline' }, ]},
    { title: '驗屋與預約詳情', fields: [ { key: '初驗批次', label: '初驗批次', icon: 'mdi-numeric-1-box-multiple-outline' }, { key: '複驗批次', label: '複驗批次', icon: 'mdi-numeric-2-box-multiple-outline' }, { key: '驗屋方式', label: '驗屋方式', icon: 'mdi-cog-outline' }, { key: '代驗公司名稱', label: '代驗公司', icon: 'mdi-domain' }, { key: '受託人姓名', label: '受託人姓名', icon: 'mdi-account-tie-outline' }, { key: '受託人電話', label: '受託人電話', icon: 'mdi-phone-in-talk-outline', copyable: true }, { key: '預約代碼', label: '預約代碼', icon: 'mdi-barcode-scan', copyable: true, readOnly: true }, { key: '填表時間', label: '填表時間', icon: 'mdi-calendar-edit', type: 'datetime' ,readOnly: true}, ]},
    { title: '相關文件', fields: [ { key: '撥款日期', label: '撥款日期', icon: 'mdi-cash-check', type: 'date' }, { key: '銀行', label: '銀行', icon: 'mdi-bank-outline' }, { key: '銀行窗口', label: '銀行窗口', icon: 'mdi-account-tie-outline' }, { key: '驗屋文件', label: '驗屋文件', icon: 'mdi-file-document-outline', type: 'button', readOnly: true }, { key: '驗屋報告', label: '驗屋報告', icon: 'mdi-file-chart-outline', type: 'button', readOnly: true }, ]},
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

// 優化計算屬性，將 processAppointments 移入，確保過濾的資料來源永遠是最新且格式一致的。
const filteredAppointments = computed(() => {
    return processAppointments(appointments.value).filter(appt => {
    const statusMatch = selectedStatuses.value.length === 0 ? false : selectedStatuses.value.includes(appt['預約狀態']);
    const typeMatch = selectedTypes.value.length === 0 ? false : selectedTypes.value.includes(appt['預約項目']);
    const query = searchQuery.value ? searchQuery.value.toLowerCase().trim() : '';
    const queryMatch = !query || [
      appt['戶別'], appt['門牌'], appt['姓名'], appt['電話'], appt['預約項目'],
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
  if (!selectedEvent.value) return [];
  const householdId = selectedEvent.value['戶別'];
  return appointments.value
    .filter(appt => appt['戶別'] === householdId)
    .sort((a, b) => new Date(a['預約日期']) - new Date(b['預約日期']));
});

const displayPanels = computed(() => {
  const panels = [...projectFieldConfig.value];
  if (bookingHistory.value.length > 0) {
    panels.push({ title: '歷次預約紀錄', isHistoryPanel: true });
  }
  return panels;
});
// --- 新的計算屬性，用於即時計算可用的預約規則 ---
const currentBookingRules = computed(() => {
    if (!isEditMode.value || !editableEvent.value || !allBookingRules.value) return null;
    const { '戶別': unitId, '預約項目': bookingType, '驗屋方式': bookingMethod } = editableEvent.value;
    const { batchRules, timeSlotRules } = allBookingRules.value;
    if (!unitId || !bookingType || !bookingMethod || !batchRules || !timeSlotRules) return null;
    const batchKey = `${bookingType}批次`;
    const batchName = editableEvent.value[batchKey];
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
// --- 新的計算屬性，用於提供時段下拉選單的選項 ---
const availableTimeSlots = computed(() => {
    if (!isEditMode.value || !editableEvent.value?.['預約日期'] || !currentBookingRules.value) return [];
    const selectedDate = format(new Date(editableEvent.value['預約日期']), 'yyyy-MM-dd');
    return currentBookingRules.value.timeSlotsByDate[selectedDate] || [];
});

// --- 方法 ---
function processAppointments(rawAppointments) {
  return rawAppointments
    .map(appt => {
      try {
        if (!appt['預約日期']) return null;
        const rawDateObject = new Date(appt['預約日期']);
        if (isNaN(rawDateObject.getTime())) return null;

        const date = format(rawDateObject, 'yyyy-MM-dd');
        const timeSlot = appt['預約時段'] ? String(appt['預約時段']).replace(/：/g, ':') : '00:00';
        const startTime = timeSlot.split('-')[0]?.trim() || '00:00';
         // --- ✨ 核心修改處：產生 displayParts 陣列 ---
        const displayParts = displayFieldOptions.value
          .filter(option => selectedDisplayFields.value.includes(option.key))
          .map(option => {
            const value = appt[option.key];
            if (!value) return null;
            const formattedValue = option.formatter ? option.formatter(value) : String(value);
            return {
              text: formattedValue,
              isHousehold: option.key === '戶別',
            };
          })
          .filter(Boolean);

        return { 
            ...appt, 
            id: `${appt['填表時間']}_${appt['戶別']}`, 
            start: parseISO(`${date}T${startTime}`), 
            displayParts: displayParts,
        };
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
          if (BOOKING_RECORD_FIELDS.includes(key)) {
            bookingUpdatePayload[key] = editedValue;
          } else if (HOUSEHOLD_DATA_FIELDS.includes(key)) {
            householdUpdatePayload[key] = editedValue;
          }
        }
      }
    }
    const apiPromises = [];
    if (Object.keys(bookingUpdatePayload).length > 0) {
      apiPromises.push(updateBooking(projectName.value, editableEvent.value['預約代碼'], bookingUpdatePayload));
    }
    if (Object.keys(householdUpdatePayload).length > 0) {
      apiPromises.push(updateHouseholdData(projectName.value, editableEvent.value['戶別'], householdUpdatePayload));
    }
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
    const [appointmentsResponse, optionsResponse, rulesResponse] = await Promise.all([
      fetchInspectionAppointments(projectName.value),
      getBookingInitialData(projectName.value),
      getAllBookingRules(projectName.value)
    ]);
    if (appointmentsResponse.status === 'success') {
      appointments.value = appointmentsResponse.data;
    } else {
      throw new Error(appointmentsResponse.message || '無法獲取預約資料');
    }
    if (optionsResponse.status === 'success') {
      bookingOptions.value.inspectionMethods = optionsResponse.data.inspectionMethods || [];
      bookingOptions.value.inspectionStaff = optionsResponse.data.inspectionStaff || [];
    } else {
      console.warn('無法獲取表單選項資料:', optionsResponse.message);
    }
    if (rulesResponse.status === 'success') {
        allBookingRules.value = rulesResponse.data;
    } else {
        console.warn('無法獲取預約規則資料:', rulesResponse.message);
        allBookingRules.value = null; 
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
  if (isEditMode.value && newDate !== oldDate && editableEvent.value) {
      editableEvent.value['預約時段'] = '';
  }
});

watch(currentTypeOptions, (newOptions) => {
  selectedTypes.value = [...newOptions];
}, { immediate: true });


onMounted(() => {
  if (PROJECT_NAME_MAP[projectId.value]) {
    fetchData();
  } else {
    error.value = `無效的建案ID: ${projectId.value}`;
    isLoading.value = false;
  }
});


// --- 其他輔助函式 ---
function promptCancelBooking(event) { eventToCancel.value = event; isCancelConfirmDialogVisible.value = true; }
function handleCopy(value) { const { copy } = useClipboard({ source: value }); copy(value); snackbarText.value = '已複製到剪貼簿！'; snackbar.value = true; }
function openUrl(url) { if (url) window.open(url, '_blank', 'noopener,noreferrer'); }

// ✨ 修改：讓 getEventStyle 只使用 CSS_KEYWORD_COLOR_MAP
function getEventStyle(event) {
  if (!event || Object.keys(event).length === 0) {
    return { backgroundColor: '#FFFFFF', color: '#000000' };
  }
  if (event['預約狀態'] === '取消') {
    return { backgroundColor: '#F5F5F5', color: '#9E9E9E' };
  }
  
  const textToSearch = [
    event['預約項目'], event['驗屋方式'],
    event['特殊備註'], event['特殊備註2']
  ].join(' ');

  for (const config of CSS_KEYWORD_COLOR_MAP) {
    if (config.keyword && textToSearch.includes(config.keyword)) {
      // 直接回傳 CSS 可用的顏色物件
      return { 
        backgroundColor: config.backgroundColor, 
        color: config.color
      };
    }
  }

  return { backgroundColor: '#EEEEEE', color: '#212121' };
}

// ✨ 修改：讓 getAppointmentItemStyle 只使用 CSS_KEYWORD_COLOR_MAP
function getAppointmentItemStyle(itemText) {
  if (!itemText) return {};
  const found = CSS_KEYWORD_COLOR_MAP.find(config => itemText.includes(config.keyword));
  if (found) {
    return { backgroundColor: found.backgroundColor, color: found.color };
  }
  return { backgroundColor: '#E0E0E0', color: '#212121'};
}

// ✨ 修改：新增一個專門為 Excel 判斷顏色的輔助函式
function getExcelRowStyle(event) {
  if (!event || Object.keys(event).length === 0) {
    return { backgroundColor: 'FFFFFF', textColor: '000000' };
  }
  if (event['預約狀態'] === '取消') {
    return { backgroundColor: 'F5F5F5', textColor: '9E9E9E' };
  }

  const textToSearch = [
    event['預約項目'], event['驗屋方式'], 
    event['特殊備註'], event['特殊備註2']
  ].join(' ');

  for (const config of EXCEL_KEYWORD_COLOR_MAP) {
    if (config.keyword && textToSearch.includes(config.keyword)) {
      return { 
        backgroundColor: config.backgroundColor, 
        textColor: config.textColor 
      };
    }
  }
  
  return { backgroundColor: 'EEEEEE', textColor: '212121' };
}




function safeFormatDate(value, formatString = 'yyyy-MM-dd') {
  if (!value || String(value).trim() === '') return '無';
  const date = new Date(value);
  if (isNaN(date.getTime())) return value;
  return format(date, formatString);
}
const getVisibleFields = (fields) => {
  if (isEditMode.value) return fields;
  return fields.filter(field => {
    if (['受託人姓名', '受託人電話'].includes(field.key)) return selectedEvent.value && selectedEvent.value[field.key];
    return true;
  });
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

/**
 * 最簡化的顏色測試函式
 * @description 建立一個 A1:A3 分別為紅黃藍背景的 Excel 檔
 */
async function handleDownloadSimpleColorTest() {
  try {
    // 1. 建立一個新的空白活頁簿 (Workbook) 和工作表 (Worksheet)
    const wb = XLSX.utils.book_new();
    const ws = {}; // 使用稀疏模式建立工作表

    // 2. 定義三種顏色樣式，包含最關鍵的 patternType: 'solid'
    const redStyle = {
      fill: { patternType: 'solid', fgColor: { rgb: 'FF0000' } }
    };
    const yellowStyle = {
      fill: { patternType: 'solid', fgColor: { rgb: 'FFFF00' } }
    };
    const blueStyle = {
      fill: { patternType: 'solid', fgColor: { rgb: '0000FF' } }
    };

    // 3. 建立儲存格物件，並直接賦予樣式
    //    v: value (值), t: type (類型 's'為字串), s: style (樣式)
    ws['A1'] = { v: '紅色背景', t: 's', s: redStyle };
    ws['A2'] = { v: '黃色背景', t: 's', s: yellowStyle };
    ws['A3'] = { v: '藍色背景', t: 's', s: blueStyle };

    // 4. 定義工作表的有效範圍，這一步非常重要！
    const range = { s: { c: 0, r: 0 }, e: { c: 0, r: 2 } }; // 從 A1 到 A3
    ws['!ref'] = XLSX.utils.encode_range(range);

    // 5. 將工作表加入到活頁簿中
    XLSX.utils.book_append_sheet(wb, ws, "顏色測試");

    // 6. 使用最穩定的方式產生並下載檔案
    const fileName = "SimpleColorTest.xlsx";
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
    console.error("簡單顏色測試 Excel 產生失敗:", err);
  }
}

/**
 * 處理重新整理按鈕點擊事件
 */
async function handleRefresh() {
  // 直接呼叫既有的 fetchData 函式，它會處理所有載入狀態和API請求
  await fetchData();

  // (可選) 透過 snackbar 給予使用者明確的回饋
  snackbarText.value = '日曆資料已更新';
  snackbar.value = true;
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

</style>