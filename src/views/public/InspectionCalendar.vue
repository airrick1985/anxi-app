<template>
  <v-container fluid class="pa-1 pa-sm-4">
    <v-card class="pa-2 pa-sm-4">


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
            teleport
          >
            <template #trigger>
              <div class="range-trigger">
                <v-icon size="18" color="primary" class="flex-shrink-0">mdi-calendar-range</v-icon>
                <span class="range-part"><span class="range-tag">起</span>{{ rangeStartLabel }}</span>
                <v-icon size="16" color="grey" class="flex-shrink-0">mdi-arrow-right-thin</v-icon>
                <span class="range-part"><span class="range-tag range-tag--end">迄</span>{{ rangeEndLabel }}</span>
              </div>
            </template>
          </VueDatePicker>
        </v-col>
        <v-col cols="12" class="d-flex align-center">
          <v-autocomplete
            class="flex-grow-1"
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
          <!-- 與桌機版同一個進階篩選介面（手機自動改為全螢幕版型） -->
          <v-badge :content="advFilterCount" :model-value="advFilterCount > 0" color="error" offset-x="2" offset-y="2" class="ml-2 flex-shrink-0">
            <v-btn
              :color="advFilterCount > 0 ? 'primary' : 'black'"
              :variant="advFilterCount > 0 ? 'flat' : 'tonal'"
              size="small"
              prepend-icon="mdi-filter-variant"
              @click="isAdvFilterDialogVisible = true"
            >篩選</v-btn>
          </v-badge>
        </v-col>
      </v-row>

      <!-- 手機／平板：已套用的進階條件，不用開對話框就能看見並移除 -->
      <div v-if="activeAdvChips.length > 0" class="d-flex d-md-none align-center flex-wrap ga-1 mb-3 px-1">
        <v-chip
          v-for="chip in activeAdvChips"
          :key="chip.id"
          size="small"
          color="primary"
          variant="flat"
          closable
          label
          @click:close="removeAdvChip(chip)"
        >
          <v-icon start size="x-small">{{ chip.icon }}</v-icon>{{ chip.text }}
        </v-chip>
        <v-btn size="x-small" variant="text" color="grey-darken-1" prepend-icon="mdi-broom" @click="clearAdvFilters">全部清除</v-btn>
      </div>

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
      teleport
      multi-calendars
      :preset-dates="datePresets"
    >
      <template #trigger>
        <div class="range-trigger">
          <v-icon size="18" color="primary" class="flex-shrink-0">mdi-calendar-range</v-icon>
          <span class="range-part"><span class="range-tag">起</span>{{ rangeStartLabel }}</span>
          <v-icon size="16" color="grey" class="flex-shrink-0">mdi-arrow-right-thin</v-icon>
          <span class="range-part"><span class="range-tag range-tag--end">迄</span>{{ rangeEndLabel }}</span>
        </div>
      </template>
    </VueDatePicker>
  </v-col>
  
  <v-col cols="12" sm="5" md="4" class="d-flex align-center">
    <v-autocomplete
      class="flex-grow-1"
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
    <v-badge :content="advFilterCount" :model-value="advFilterCount > 0" color="error" offset-x="2" offset-y="2" class="ml-2 flex-shrink-0">
      <v-btn
        :color="advFilterCount > 0 ? 'primary' : 'black'"
        :variant="advFilterCount > 0 ? 'flat' : 'tonal'"
        size="small"
        prepend-icon="mdi-filter-variant"
        @click="isAdvFilterDialogVisible = true"
      >篩選</v-btn>
    </v-badge>
  </v-col>

  <v-col cols="auto" class="flex-grow-1"></v-col>

  <v-col cols="12" md="auto" class="d-flex align-center flex-wrap">

    <v-btn-toggle
      :model-value="desktopViewMode"
      @update:model-value="v => v && setDesktopViewMode(v)"
      mandatory density="compact" color="primary" variant="outlined" divided
      class="mr-2"
    >
      <v-btn value="day" size="small">日</v-btn>
      <v-btn value="week" size="small">週</v-btn>
      <v-btn value="month" size="small">月</v-btn>
    </v-btn-toggle>

    <v-btn icon="mdi-chevron-left" variant="text" size="small" :title="desktopViewMode === 'day' ? '上一日' : desktopViewMode === 'week' ? '上一週' : '上一月'" @click="shiftDesktopRange(-1)"></v-btn>
    <v-btn variant="tonal" color="primary" size="small" prepend-icon="mdi-calendar-today" @click="goToToday">今天</v-btn>
    <v-btn icon="mdi-chevron-right" variant="text" size="small" :title="desktopViewMode === 'day' ? '下一日' : desktopViewMode === 'week' ? '下一週' : '下一月'" class="mr-2" @click="shiftDesktopRange(1)"></v-btn>

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

    <v-tooltip text="驗屋人員排休" location="bottom">
      <template v-slot:activator="{ props }">
        <v-btn
          v-if="canEdit"
          v-bind="props"
          icon="mdi-account-clock"
          variant="text"
          color="black"
          @click="isLeaveManagerVisible = true"
        ></v-btn>
      </template>
    </v-tooltip>

    <v-tooltip text="行事曆備註" location="bottom">
      <template v-slot:activator="{ props }">
        <v-badge :content="calendarNoteRecords.length" :model-value="calendarNoteRecords.length > 0" color="amber-darken-2" offset-x="6" offset-y="6">
          <v-btn
            v-if="canEdit"
            v-bind="props"
            icon="mdi-calendar-text"
            variant="text"
            color="black"
            @click="openCalendarNoteManager()"
          ></v-btn>
        </v-badge>
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
              title="下載日期PNG"
              @click="isDatePngDialogVisible = true"
              :disabled="isDownloadingPdf || isDownloadingExcel"
            >
              <template v-slot:append>
                <v-progress-circular v-if="isDownloadingPdf" indeterminate color="grey" size="20" width="2"></v-progress-circular>
              </template>
            </v-list-item>
            <v-list-item
              prepend-icon="mdi-account-multiple-outline"
              title="下載人員行程表 (PNG)"
              @click="isPersonPngDialogVisible = true"
              :disabled="isDownloadingPdf || isDownloadingExcel"
            ></v-list-item>
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
            <v-list-item
              prepend-icon="mdi-table-arrow-down"
              title="下載EXCEL(列表)"
              @click="isListExportDialogVisible = true"
              :disabled="isDownloadingPdf || isDownloadingExcel"
            ></v-list-item>
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

    <v-tooltip text="資料透視" location="bottom">
      <template v-slot:activator="{ props }">
        <v-btn
          v-bind="props"
          icon="mdi-table-pivot"
          variant="text"
          color="black"
          @click="isPivotDialogVisible = true"
        ></v-btn>
      </template>
    </v-tooltip>

    <v-tooltip :text="isQuotaRowHidden ? '顯示名額列' : '隱藏名額列'" location="bottom">
      <template v-slot:activator="{ props }">
        <v-btn
          v-if="!xs"
          v-bind="props"
          :icon="isQuotaRowHidden ? 'mdi-chart-box-outline' : 'mdi-chart-box'"
          variant="text"
          :color="isQuotaRowHidden ? 'grey' : 'teal-darken-2'"
          @click="isQuotaRowHidden = !isQuotaRowHidden"
        ></v-btn>
      </template>
    </v-tooltip>

    <v-tooltip :text="isNoteRowHidden ? '顯示備註列' : '隱藏備註列'" location="bottom">
      <template v-slot:activator="{ props }">
        <v-btn
          v-if="!xs"
          v-bind="props"
          :icon="isNoteRowHidden ? 'mdi-pin-off-outline' : 'mdi-pin'"
          variant="text"
          :color="isNoteRowHidden ? 'grey' : 'amber-darken-3'"
          @click="isNoteRowHidden = !isNoteRowHidden"
        ></v-btn>
      </template>
    </v-tooltip>

    <v-tooltip text="顯示設定" location="bottom">
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


        
        <!-- 手機版：行事曆式視圖（日 / 週 / 月） -->
        <div v-if="xs" class="mobile-agenda">
          <!-- 檢視切換 + 今天 -->
          <div class="d-flex align-center mb-2">
            <v-btn-toggle
              :model-value="mobileViewMode"
              @update:model-value="v => v && setMobileViewMode(v)"
              mandatory density="compact" color="primary" variant="outlined" divided
            >
              <v-btn value="day" size="small">日</v-btn>
              <v-btn value="week" size="small">週</v-btn>
              <v-btn value="month" size="small">月</v-btn>
            </v-btn-toggle>
            <v-spacer></v-spacer>
            <v-btn v-if="canEdit" icon="mdi-account-clock" variant="text" size="small" title="驗屋人員排休" @click="isLeaveManagerVisible = true"></v-btn>
            <v-btn v-if="canEdit" icon="mdi-calendar-text" variant="text" size="small" title="行事曆備註" @click="openCalendarNoteManager(selectedMobileDate)"></v-btn>
            <v-btn icon="mdi-chevron-left" variant="text" size="small" @click="shiftMobile(-1)"></v-btn>
            <v-btn size="small" variant="tonal" color="primary" prepend-icon="mdi-calendar-today" @click="goToToday">今天</v-btn>
            <v-btn icon="mdi-chevron-right" variant="text" size="small" @click="shiftMobile(1)"></v-btn>
          </div>

          <!-- 日：日期橫條（左右滑動、點選切換日期） -->
          <div v-if="mobileViewMode === 'day'" class="mobile-date-strip">
            <button
              v-for="day in mobileDates"
              :key="day.key"
              type="button"
              class="mobile-date-pill"
              :class="{ active: day.key === selectedMobileDate, today: day.isToday, weekend: day.isWeekend }"
              :data-datekey="day.key"
              @click="selectedMobileDate = day.key"
            >
              <span class="pill-dow">{{ day.dowLabel }}</span>
              <span class="pill-date">{{ day.dateLabel }}</span>
              <span :class="['pill-count', { 'pill-count-empty': day.count === 0 }]">{{ day.count > 0 ? day.count : '–' }}</span>
              <span
                v-if="(calendarNotesByDate[day.key] || []).length"
                class="pill-note-dot"
                :style="{ backgroundColor: getNoteColor(calendarNotesByDate[day.key][0].color).border }"
              ></span>
            </button>
          </div>

          <!-- 月：月曆格 -->
          <template v-if="mobileViewMode === 'month'">
            <div class="mobile-month-nav">
              <v-btn icon="mdi-chevron-left" variant="text" size="small" @click="shiftMobileMonth(-1)"></v-btn>
              <span class="font-weight-bold text-subtitle-1">{{ mobileMonthLabel }}</span>
              <v-btn icon="mdi-chevron-right" variant="text" size="small" @click="shiftMobileMonth(1)"></v-btn>
            </div>
            <div class="mobile-month-grid">
              <div v-for="d in ['一', '二', '三', '四', '五', '六', '日']" :key="d" class="mobile-month-dow">{{ d }}</div>
              <button
                v-for="cell in mobileMonthCells"
                :key="cell.key"
                type="button"
                class="mobile-month-cell"
                :class="{ dim: !cell.inMonth, today: cell.isToday, weekend: cell.isWeekend, active: cell.key === selectedMobileDate }"
                @click="pickMonthDate(cell)"
              >
                <span class="num">{{ cell.dateNum }}</span>
                <span v-if="cell.count > 0" class="cnt">{{ cell.count }}</span>
              </button>
            </div>
          </template>

          <!-- 日 / 月：選定日期的行程列表 -->
          <template v-if="mobileViewMode !== 'week'">
            <div class="mobile-day-header">
              <v-icon size="small" color="primary" class="mr-1">mdi-calendar-today</v-icon>
              <span class="font-weight-bold">{{ selectedMobileDateLabel }}</span>
              <v-chip size="x-small" color="primary" variant="tonal" class="ml-2" label>{{ mobileSelectedDayCount }} 筆</v-chip>
            </div>
            <!-- 每日名額摘要（手機版：點擊開啟明細） -->
            <div v-if="(dailyQuotaByDate[selectedMobileDate] || []).length" class="mobile-quota-strip">
              <button
                v-for="row in dailyQuotaByDate[selectedMobileDate]" :key="row.label"
                type="button" class="mobile-quota-item"
                @click="openQuotaDetail(selectedMobileDate, row.label)"
              >
                <span class="mobile-quota-name">{{ row.label }}</span>
                <span class="mobile-quota-num" :style="{ color: quotaColor(row) }">{{ row.booked }}/{{ row.capacity }}</span>
                <span class="mobile-quota-rest" :style="{ color: quotaColor(row) }">
                  {{ row.remaining <= 0 ? '額滿' : `剩 ${row.remaining}` }}
                </span>
                <v-icon size="13" color="grey-darken-1">mdi-chevron-right</v-icon>
              </button>
            </div>
            <!-- 行事曆備註（手機版：日期標題下一列） -->
            <div v-if="(calendarNotesByDate[selectedMobileDate] || []).length" class="calendar-note-stack mobile-note-stack">
              <div
                v-for="note in calendarNotesByDate[selectedMobileDate]"
                :key="note.id"
                class="calendar-note-chip"
                :class="{ 'is-clickable': canEdit }"
                :style="{
                  backgroundColor: getNoteColor(note.color).bg,
                  color: getNoteColor(note.color).text,
                  borderColor: getNoteColor(note.color).border,
                }"
                @click="canEdit && openCalendarNoteManager(selectedMobileDate)"
              >
                <v-icon size="x-small" class="calendar-note-chip-icon">mdi-pin</v-icon>
                <span class="calendar-note-chip-text">{{ note.note }}</span>
              </div>
            </div>
            <div class="mobile-agenda-list">
              <div v-if="mobileSlotsForSelectedDay.length === 0" class="text-center text-grey py-10">
                <v-icon size="42" color="grey-lighten-1">mdi-calendar-blank-outline</v-icon>
                <p class="mt-2">這一天沒有符合條件的預約</p>
              </div>
              <div v-for="slot in mobileSlotsForSelectedDay" :key="slot.time" class="mobile-slot">
                <div class="mobile-slot-time"><v-icon size="x-small" class="mr-1">mdi-clock-outline</v-icon>{{ slot.time }}</div>
                <div class="mobile-slot-events">
                  <div
                    v-for="event in slot.events"
                    :key="event.id"
                    :class="['event-item', 'mobile-event-card', { 'cancelled-event': event.status === '取消' }]"
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
                    <div v-if="event.highlightParts && event.highlightParts.length" class="event-highlight-wrap">
                      <div
                        v-for="(hp, hpIndex) in event.highlightParts"
                        :key="'hl-' + hpIndex"
                        :class="['event-highlight', HIGHLIGHT_FIELD_META[hp.kind]?.cssClass]"
                      >
                        <v-icon size="x-small" class="event-highlight-icon">{{ HIGHLIGHT_FIELD_META[hp.kind]?.icon }}</v-icon>
                        <span v-if="hp.persons && hp.persons.length">
                          <template v-for="(p, pIdx) in hp.persons" :key="'p-' + pIdx"><span :class="{ 'event-hl-person-leave': p.onLeave }">{{ p.label }}</span><span v-if="pIdx < hp.persons.length - 1">,</span></template>
                        </span>
                        <span v-else>{{ hp.text }}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </template>

          <!-- 週：整週行程列表（類似 Google 行事曆「時間表」） -->
          <div v-else class="mobile-agenda-list">
            <div v-if="mobileTotalCount === 0" class="text-center text-grey py-10">
              <v-icon size="42" color="grey-lighten-1">mdi-calendar-blank-outline</v-icon>
              <p class="mt-2">這一週沒有符合條件的預約</p>
            </div>
            <template v-for="day in mobileDates" :key="day.key">
              <div v-if="day.count > 0 || (calendarNotesByDate[day.key] || []).length || (dailyQuotaByDate[day.key] || []).length" class="mobile-week-day">
                <div class="mobile-week-day-header" :class="{ 'is-today': day.isToday }">
                  <span class="font-weight-bold">{{ day.dateLabel }}（{{ day.dowLabel }}）</span>
                  <v-chip size="x-small" color="primary" variant="tonal" class="ml-2" label>{{ day.count }} 筆</v-chip>
                </div>
                <!-- 每日名額摘要（手機週檢視：點擊開啟明細） -->
                <div v-if="(dailyQuotaByDate[day.key] || []).length" class="mobile-quota-strip">
                  <button
                    v-for="row in dailyQuotaByDate[day.key]" :key="row.label"
                    type="button" class="mobile-quota-item"
                    @click="openQuotaDetail(day.key, row.label)"
                  >
                    <span class="mobile-quota-name">{{ row.label }}</span>
                    <span class="mobile-quota-num" :style="{ color: quotaColor(row) }">{{ row.booked }}/{{ row.capacity }}</span>
                    <span class="mobile-quota-rest" :style="{ color: quotaColor(row) }">
                      {{ row.remaining <= 0 ? '額滿' : `剩 ${row.remaining}` }}
                    </span>
                    <v-icon size="13" color="grey-darken-1">mdi-chevron-right</v-icon>
                  </button>
                </div>
                <!-- 行事曆備註（手機週檢視：日期標題下一列） -->
                <div v-if="(calendarNotesByDate[day.key] || []).length" class="calendar-note-stack mobile-note-stack">
                  <div
                    v-for="note in calendarNotesByDate[day.key]"
                    :key="note.id"
                    class="calendar-note-chip"
                    :class="{ 'is-clickable': canEdit }"
                    :style="{
                      backgroundColor: getNoteColor(note.color).bg,
                      color: getNoteColor(note.color).text,
                      borderColor: getNoteColor(note.color).border,
                    }"
                    @click="canEdit && openCalendarNoteManager(day.key)"
                  >
                    <v-icon size="x-small" class="calendar-note-chip-icon">mdi-pin</v-icon>
                    <span class="calendar-note-chip-text">{{ note.note }}</span>
                  </div>
                </div>
                <div v-for="slot in slotsForDate(day.key)" :key="day.key + slot.time" class="mobile-slot">
                  <div class="mobile-slot-time"><v-icon size="x-small" class="mr-1">mdi-clock-outline</v-icon>{{ slot.time }}</div>
                  <div class="mobile-slot-events">
                    <div
                      v-for="event in slot.events"
                      :key="event.id"
                      :class="['event-item', 'mobile-event-card', { 'cancelled-event': event.status === '取消' }]"
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
                      <div v-if="event.highlightParts && event.highlightParts.length" class="event-highlight-wrap">
                        <div
                          v-for="(hp, hpIndex) in event.highlightParts"
                          :key="'hl-' + hpIndex"
                          :class="['event-highlight', HIGHLIGHT_FIELD_META[hp.kind]?.cssClass]"
                        >
                          <v-icon size="x-small" class="event-highlight-icon">{{ HIGHLIGHT_FIELD_META[hp.kind]?.icon }}</v-icon>
                          <span v-if="hp.persons && hp.persons.length">
                            <template v-for="(p, pIdx) in hp.persons" :key="'p-' + pIdx"><span :class="{ 'event-hl-person-leave': p.onLeave }">{{ p.label }}</span><span v-if="pIdx < hp.persons.length - 1">,</span></template>
                          </span>
                          <span v-else>{{ hp.text }}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </template>
          </div>
        </div>

        <!-- 桌機版：多日時間表 -->
        <div v-else id="custom-calendar-container">
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
                    <div v-if="day.isInRange">{{ day.dateLabel }}</div>
                  </th>
                </tr>
                <!-- 每日名額摘要：日期標題下第一列（該週無批次名額時不顯示；可整列隱藏） -->
                <tr v-if="chunkHasQuota(chunk) && !isQuotaRowHidden" class="quota-row">
                  <th class="quota-label" role="button" :title="isQuotaRowExpanded ? '收合名額列' : '展開名額列'"
                    @click="isQuotaRowExpanded = !isQuotaRowExpanded">
                    <v-icon size="small" color="teal-darken-2">mdi-chart-box-outline</v-icon>
                    <span>名額</span>
                    <v-icon size="14" class="row-toggle-icon">{{ isQuotaRowExpanded ? 'mdi-chevron-up' : 'mdi-chevron-down' }}</v-icon>
                    <v-icon size="14" class="row-hide-icon" title="隱藏整列（可從上方工具列恢復）"
                      @click.stop="isQuotaRowHidden = true">mdi-eye-off-outline</v-icon>
                  </th>
                  <th
                    v-for="day in chunk" :key="'quota-' + day.fullDate"
                    class="quota-cell"
                    :class="{ 'today-column': day.isToday, 'weekend-column': day.isWeekend }"
                  >
                    <template v-if="day.isInRange && (dailyQuotaByDate[day.fullDate] || []).length">
                      <!-- 收合時仍保留全日總計，點擊可看明細 -->
                      <div v-if="!isQuotaRowExpanded" class="quota-collapsed" role="button"
                        title="點擊查看名額明細" @click="openQuotaDetail(day.fullDate)">
                        {{ quotaDayTotal(day.fullDate).booked }}/{{ quotaDayTotal(day.fullDate).capacity }}
                        <span class="quota-total-rest">剩 {{ Math.max(quotaDayTotal(day.fullDate).capacity - quotaDayTotal(day.fullDate).booked, 0) }}</span>
                      </div>
                      <template v-else>
                      <!-- 全日總計 -->
                      <div class="quota-total">
                        {{ quotaDayTotal(day.fullDate).booked }}/{{ quotaDayTotal(day.fullDate).capacity }}
                        <span class="quota-total-rest">剩 {{ Math.max(quotaDayTotal(day.fullDate).capacity - quotaDayTotal(day.fullDate).booked, 0) }}</span>
                      </div>
                      <!-- 各預約項目一條迷你進度條；滑鼠移上顯示明細，點擊開啟明細對話框 -->
                      <v-tooltip
                        v-for="row in dailyQuotaByDate[day.fullDate]" :key="row.label"
                        location="bottom" open-delay="120" content-class="quota-tooltip"
                      >
                        <template v-slot:activator="{ props }">
                          <div v-bind="props" class="quota-item" @click="openQuotaDetail(day.fullDate, row.label)">
                            <div class="quota-item-head">
                              <span class="quota-item-name">{{ row.label }}</span>
                              <span class="quota-item-num" :style="{ color: quotaColor(row) }">{{ row.booked }}/{{ row.capacity }}</span>
                            </div>
                            <div class="quota-bar">
                              <div class="quota-bar-fill" :style="{ width: quotaPercent(row) + '%', backgroundColor: quotaColor(row) }"></div>
                            </div>
                          </div>
                        </template>
                        <div class="quota-tip">
                          <div class="quota-tip-title">
                            {{ row.label }}　已約 {{ row.booked }} / {{ row.capacity }}
                            <span :style="{ color: row.remaining <= 0 ? '#FF8A80' : '#A5D6A7' }">
                              {{ row.remaining <= 0 ? '額滿' : `剩 ${row.remaining}` }}
                            </span>
                          </div>
                          <div v-if="row.methods.length" class="quota-tip-section">
                            <div v-for="m in row.methods" :key="m.name" class="quota-tip-line">
                              <span class="quota-tip-key">{{ m.name }}</span>
                              <span>{{ quotaMethodText(m) }}</span>
                            </div>
                          </div>
                          <div v-if="row.slots.length" class="quota-tip-section">
                            <div v-for="s in row.slots" :key="s.time" class="quota-tip-line">
                              <span class="quota-tip-key">{{ s.time }}</span>
                              <span>{{ s.booked }}/{{ s.capacity }}</span>
                            </div>
                          </div>
                        </div>
                      </v-tooltip>
                      </template>
                    </template>
                  </th>
                </tr>
                <!-- 行事曆備註：緊貼在日期標題下方，整週皆無備註時不顯示；可整列隱藏 -->
                <tr v-if="chunkHasCalendarNote(chunk) && !isNoteRowHidden" class="calendar-note-row">
                  <th class="calendar-note-label" role="button" :title="isNoteRowExpanded ? '收合備註列' : '展開備註列'"
                    @click="isNoteRowExpanded = !isNoteRowExpanded">
                    <v-icon size="small" color="amber-darken-3">mdi-pin</v-icon>
                    <span>備註</span>
                    <v-icon size="14" class="row-toggle-icon">{{ isNoteRowExpanded ? 'mdi-chevron-up' : 'mdi-chevron-down' }}</v-icon>
                    <v-icon size="14" class="row-hide-icon" title="隱藏整列（可從上方工具列恢復）"
                      @click.stop="isNoteRowHidden = true">mdi-eye-off-outline</v-icon>
                  </th>
                  <th
                    v-for="day in chunk" :key="'note-' + day.fullDate"
                    class="calendar-note-cell"
                    :class="{ 'today-column': day.isToday, 'weekend-column': day.isWeekend }"
                  >
                    <!-- 收合時以色點表示該日有幾則備註，點擊即展開 -->
                    <div v-if="day.isInRange && !isNoteRowExpanded" class="note-collapsed" role="button"
                      title="點擊展開備註" @click="isNoteRowExpanded = true">
                      <span
                        v-for="note in (calendarNotesByDate[day.fullDate] || [])"
                        :key="'dot-' + note.id"
                        class="note-collapsed-dot"
                        :style="{ backgroundColor: getNoteColor(note.color).border }"
                      ></span>
                    </div>
                    <div v-else-if="day.isInRange" class="calendar-note-stack">
                      <div
                        v-for="note in (calendarNotesByDate[day.fullDate] || [])"
                        :key="note.id"
                        class="calendar-note-chip"
                        :class="{ 'is-clickable': canEdit }"
                        :style="{
                          backgroundColor: getNoteColor(note.color).bg,
                          color: getNoteColor(note.color).text,
                          borderColor: getNoteColor(note.color).border,
                        }"
                        :title="canEdit ? `${note.note}（點擊可編輯）` : note.note"
                        @click="canEdit && openCalendarNoteManager(day.fullDate)"
                      >
                        <v-icon size="x-small" class="calendar-note-chip-icon">mdi-pin</v-icon>
                        <span class="calendar-note-chip-text">{{ note.note }}</span>
                      </div>
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
                          <!-- 驗屋人員 / 銷售人員 / 備註：獨立醒目區塊（人員類並排同一列） -->
                          <div v-if="event.highlightParts && event.highlightParts.length" class="event-highlight-wrap">
                            <div
                              v-for="(hp, hpIndex) in event.highlightParts"
                              :key="'hl-' + hpIndex"
                              :class="['event-highlight', HIGHLIGHT_FIELD_META[hp.kind]?.cssClass]"
                            >
                              <v-icon size="x-small" class="event-highlight-icon">{{ HIGHLIGHT_FIELD_META[hp.kind]?.icon }}</v-icon>
                              <span v-if="hp.persons && hp.persons.length">
                                <template v-for="(p, pIdx) in hp.persons" :key="'p-' + pIdx"><span :class="{ 'event-hl-person-leave': p.onLeave }">{{ p.label }}</span><span v-if="pIdx < hp.persons.length - 1">,</span></template>
                              </span>
                              <span v-else>{{ hp.text }}</span>
                            </div>
                          </div>
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

    <!-- 手機 PNG 預覽（瀏覽器不支援系統分享時的儲存方式） -->
    <v-dialog :model-value="isPngPreviewVisible" @update:model-value="closePngPreview" max-width="560px" scrollable>
      <v-card>
        <v-card-title class="d-flex align-center bg-primary text-white py-3">
          <v-icon start>mdi-image-area</v-icon>
          <span class="text-subtitle-1">預約時間表圖片</span>
          <v-spacer></v-spacer>
          <v-btn icon="mdi-close" variant="text" color="white" size="small" @click="closePngPreview"></v-btn>
        </v-card-title>
        <v-card-text class="pa-3">
          <v-alert type="info" variant="tonal" density="compact" class="mb-3">
            <strong>長按下方圖片</strong>，選擇「儲存圖片 / 加入相簿」即可存到手機。
          </v-alert>
          <img :src="pngPreviewUrl" alt="預約時間表" style="width: 100%; border: 1px solid #e0e0e0; border-radius: 4px;" />
        </v-card-text>
        <v-card-actions class="pa-3 pt-0">
          <v-btn color="primary" variant="tonal" prepend-icon="mdi-share-variant" @click="sharePngFromPreview">分享 / 儲存</v-btn>
          <v-spacer></v-spacer>
          <v-btn variant="text" @click="closePngPreview">關閉</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

      <AppointmentDetailsDialog
      v-model="isDialogVisible"
      :appointment="selectedEvent"
      :can-edit="canEdit"
      :booking-options="bookingOptions"
      :booking-history="bookingHistory"
      :calendar-data="calendarData"
      :inspector-leave-map="inspectorLeaveMap"
      @save="handleSaveChangesFromDialog"
      @inline-save="handleInlineSaveFromDialog"
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

    <InspectorLeaveManagerDialog
      v-if="isLeaveManagerVisible"
      v-model="isLeaveManagerVisible"
      :project-id="projectId"
      :project-name="projectName"
      :staff-list="bookingOptions.inspectionStaff || []"
      :can-edit="canEdit"
      @staff-updated="handleStaffListUpdated"
      @leaves-changed="fetchInspectorLeavesData"
    />

    <CalendarNoteManagerDialog
      v-if="isCalendarNoteManagerVisible"
      v-model="isCalendarNoteManagerVisible"
      :project-id="projectId"
      :project-name="projectName"
      :can-edit="canEdit"
      :default-date="calendarNoteDefaultDate"
      @notes-changed="fetchCalendarNotesData"
    />

    <!-- 每日名額明細（手機無法 hover，改以點擊開啟；桌機點擊亦可開啟） -->
    <v-dialog v-model="isQuotaDetailVisible" max-width="520px" scrollable :fullscreen="xs">
      <v-card class="d-flex flex-column">
        <v-card-title class="d-flex align-center bg-teal-darken-2 text-white py-3 px-4">
          <v-icon start>mdi-chart-box-outline</v-icon>
          <span class="text-subtitle-1">{{ quotaDetailDateLabel }} 名額明細</span>
          <v-spacer></v-spacer>
          <v-btn icon="mdi-close" variant="text" color="white" size="small" @click="isQuotaDetailVisible = false"></v-btn>
        </v-card-title>

        <v-card-text class="pa-4" style="background-color:#f5f6f8;">
          <div v-if="!quotaDetailRows.length" class="text-center text-grey py-8">
            <v-icon size="42" color="grey-lighten-1">mdi-calendar-remove-outline</v-icon>
            <p class="mt-2 text-body-2">這一天沒有批次名額設定</p>
          </div>

          <div
            v-for="row in quotaDetailRows" :key="row.label"
            class="bg-white rounded-lg pa-3 mb-3"
            :style="{ border: '1px solid #eceff1', borderLeft: `5px solid ${quotaColor(row)}` }"
          >
            <div class="d-flex align-center mb-1">
              <span class="text-subtitle-2 font-weight-bold">{{ row.label }}</span>
              <v-spacer></v-spacer>
              <span class="text-body-2 font-weight-bold" :style="{ color: quotaColor(row) }">
                {{ row.booked }} / {{ row.capacity }}
              </span>
              <v-chip size="x-small" label variant="flat" class="ml-2"
                :style="{ backgroundColor: quotaColor(row), color: '#fff' }">
                {{ row.remaining <= 0 ? '額滿' : `剩 ${row.remaining}` }}
              </v-chip>
            </div>
            <div class="quota-bar mb-3">
              <div class="quota-bar-fill" :style="{ width: quotaPercent(row) + '%', backgroundColor: quotaColor(row) }"></div>
            </div>

            <template v-if="row.methods.length">
              <div class="text-caption font-weight-bold text-grey-darken-1 mb-1">各選擇方式</div>
              <div class="quota-detail-table mb-3">
                <div v-for="m in row.methods" :key="m.name" class="quota-detail-line">
                  <span class="quota-detail-key">{{ m.name }}</span>
                  <span class="font-weight-bold">{{ quotaMethodText(m) }}</span>
                </div>
              </div>
            </template>

            <template v-if="row.slots.length">
              <div class="text-caption font-weight-bold text-grey-darken-1 mb-1">各時段</div>
              <div class="quota-detail-table">
                <div v-for="s in row.slots" :key="s.time" class="quota-detail-line">
                  <span class="quota-detail-key">{{ s.time }}</span>
                  <span class="font-weight-bold">
                    {{ s.booked }}/{{ s.capacity }}
                    <span :style="{ color: s.capacity - s.booked <= 0 ? '#E53935' : '#2E9E6B' }">
                      {{ s.capacity - s.booked <= 0 ? '額滿' : `剩 ${s.capacity - s.booked}` }}
                    </span>
                  </span>
                </div>
              </div>
            </template>
          </div>

          <div class="text-caption text-grey-darken-1">
            <v-icon size="14" class="mr-1">mdi-information-outline</v-icon>
            「已約」計入狀態為「預約中」與「已完成」的預約；方式未設定名額時與其他方式共用時段總名額。
          </div>
        </v-card-text>

        <v-divider></v-divider>
        <v-card-actions class="pa-3 bg-grey-lighten-4">
          <v-spacer></v-spacer>
          <v-btn color="primary" variant="flat" @click="isQuotaDetailVisible = false">關閉</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- 進階篩選：狀態/項目/選擇方式 + 進階條件（自「篩選與顯示設定」拆出的獨立對話框） -->
    <v-dialog v-model="isAdvFilterDialogVisible" max-width="640px" scrollable :fullscreen="smAndDown">
      <v-card class="d-flex flex-column adv-filter-card">
        <v-card-title class="d-flex align-center bg-primary text-white py-3 px-4 flex-shrink-0">
          <v-icon start>mdi-filter-variant</v-icon>
          <span class="text-subtitle-1 font-weight-bold">進階篩選</span>
          <v-chip v-if="advFilterCount > 0" size="x-small" color="error" variant="flat" class="ml-2" label>{{ advFilterCount }} 項條件</v-chip>
          <v-spacer></v-spacer>
          <v-btn icon="mdi-close" variant="text" color="white" size="small" @click="isAdvFilterDialogVisible = false"></v-btn>
        </v-card-title>

        <!-- 已套用條件：手機版看不到全部欄位，這排標籤可一眼掌握並單獨移除 -->
        <div v-if="activeAdvChips.length > 0" class="adv-active-bar flex-shrink-0 px-3 py-2">
          <div class="d-flex align-center flex-wrap ga-1">
            <v-chip
              v-for="chip in activeAdvChips"
              :key="chip.id"
              size="small"
              color="primary"
              variant="flat"
              closable
              label
              @click:close="removeAdvChip(chip)"
            >
              <v-icon start size="x-small">{{ chip.icon }}</v-icon>{{ chip.text }}
            </v-chip>
            <v-btn size="x-small" variant="text" color="grey-darken-1" prepend-icon="mdi-broom" @click="clearAdvFilters">全部清除</v-btn>
          </div>
        </div>

        <v-card-text class="pa-3 pa-sm-4" style="background-color:#f5f6f8;">
          <div class="text-caption text-grey-darken-1 mb-3 d-flex align-start">
            <v-icon size="16" class="mr-1" color="grey">mdi-information-outline</v-icon>
            <span>調整後即時反映在時間表上；狀態／項目／選擇方式會記憶在此裝置，進階條件重新整理後自動重置。</span>
          </div>

          <!-- 狀態 -->
          <div class="bg-white rounded-lg pa-3 mb-3" style="border:1px solid #eceff1;">
            <div class="d-flex align-center mb-2">
              <v-avatar size="30" color="indigo-lighten-1" class="mr-2"><v-icon size="18" color="white">mdi-flag-variant</v-icon></v-avatar>
              <div class="flex-grow-1">
                <div class="text-subtitle-2 font-weight-bold">狀態</div>
                <div class="text-caption text-grey-darken-1">要顯示的預約狀態</div>
              </div>
              <v-btn size="x-small" variant="text" @click="selectedStatuses = ['預約中','取消','已完成']">全選</v-btn>
              <v-btn size="x-small" variant="text" color="grey" @click="selectedStatuses = []">清除</v-btn>
            </div>
            <v-chip-group v-model="selectedStatuses" multiple column selected-class="text-primary">
              <v-chip v-for="s in ['預約中','取消','已完成']" :key="s" :value="s" filter variant="outlined" size="small">{{ s }}</v-chip>
            </v-chip-group>
          </div>

          <!-- 項目 -->
          <div class="bg-white rounded-lg pa-3 mb-3" style="border:1px solid #eceff1;">
            <div class="d-flex align-center mb-2">
              <v-avatar size="30" color="teal" class="mr-2"><v-icon size="18" color="white">mdi-format-list-bulleted-type</v-icon></v-avatar>
              <div class="flex-grow-1">
                <div class="text-subtitle-2 font-weight-bold">項目</div>
                <div class="text-caption text-grey-darken-1">要顯示的預約項目類型（如初驗、複驗）</div>
              </div>
              <v-btn size="x-small" variant="text" @click="selectedTypes = [...currentTypeOptions]">全選</v-btn>
              <v-btn size="x-small" variant="text" color="grey" @click="selectedTypes = []">清除</v-btn>
            </div>
            <v-chip-group v-if="currentTypeOptions.length" v-model="selectedTypes" multiple column selected-class="text-primary">
              <v-chip v-for="t in currentTypeOptions" :key="t" :value="t" filter variant="outlined" size="small">{{ t }}</v-chip>
            </v-chip-group>
            <div v-else class="text-caption text-grey">此建案尚未設定預約項目類型</div>
          </div>

          <!-- 選擇方式 -->
          <div class="bg-white rounded-lg pa-3 mb-3" style="border:1px solid #eceff1;">
            <div class="d-flex align-center mb-2">
              <v-avatar size="30" color="cyan-darken-1" class="mr-2"><v-icon size="18" color="white">mdi-call-split</v-icon></v-avatar>
              <div class="flex-grow-1">
                <div class="text-subtitle-2 font-weight-bold">選擇方式</div>
                <div class="text-caption text-grey-darken-1">篩選特定預約方式（如屋主自驗、委託代驗）</div>
              </div>
              <v-btn size="x-small" variant="text" @click="selectedMethods = [...currentMethodOptions]">全選</v-btn>
              <v-btn size="x-small" variant="text" color="grey" @click="selectedMethods = []">清除</v-btn>
            </div>
            <v-chip-group v-if="currentMethodOptions.length" v-model="selectedMethods" multiple column selected-class="text-primary">
              <v-chip v-for="m in currentMethodOptions" :key="m" :value="m" filter variant="outlined" size="small">{{ m }}</v-chip>
            </v-chip-group>
            <div v-else class="text-caption text-grey">此建案尚未設定選擇方式</div>
          </div>

          <!-- 進階篩選（與「下載EXCEL(列表)」的篩選條件相同，即時套用於時間表） -->
          <div class="bg-white rounded-lg pa-3 mb-3" style="border:1px solid #eceff1;">
            <div class="d-flex align-center mb-2">
              <v-avatar size="30" color="purple" class="mr-2"><v-icon size="18" color="white">mdi-filter-variant</v-icon></v-avatar>
              <div class="flex-grow-1">
                <div class="text-subtitle-2 font-weight-bold">進階條件</div>
                <div class="text-caption text-grey-darken-1">關鍵字、星期、時段、人員等條件；此區不做記憶，重新整理後自動重置</div>
              </div>
              <v-btn v-if="advFilterCount > 0" size="x-small" variant="text" color="grey-darken-1" prepend-icon="mdi-broom" @click="clearAdvFilters">清除</v-btn>
            </div>
            <v-text-field
              v-model="advFilters.keyword"
              placeholder="全域搜尋：戶別、預約人、電話、驗屋人員、備註…（可空白分隔多關鍵字）"
              prepend-inner-icon="mdi-magnify"
              variant="outlined" density="compact" hide-details clearable
              class="mb-2"
            ></v-text-field>
            <v-row dense>
              <v-col cols="12" sm="6">
                <v-select
                  v-model="advFilters.weekdays"
                  :items="advWeekdayOptions"
                  label="星期 (多選)"
                  multiple chips closable-chips
                  variant="outlined" density="compact" hide-details clearable
                ></v-select>
              </v-col>
              <v-col cols="12" sm="6">
                <v-select
                  v-model="advFilters.timeSlots"
                  :items="advTimeSlotOptions"
                  label="時段 (多選)"
                  multiple chips closable-chips
                  variant="outlined" density="compact" hide-details clearable
                  :menu-props="{ maxHeight: 320 }"
                ></v-select>
              </v-col>
              <v-col cols="12" sm="6">
                <v-select
                  v-model="advFilters.sources"
                  :items="ADV_SOURCE_OPTIONS"
                  label="來源 (多選)"
                  multiple chips closable-chips
                  variant="outlined" density="compact" hide-details clearable
                ></v-select>
              </v-col>
              <v-col cols="12" sm="6">
                <v-select
                  v-model="advFilters.checkInStatuses"
                  :items="advCheckInOptions"
                  label="報到狀態 (多選)"
                  multiple chips closable-chips
                  variant="outlined" density="compact" hide-details clearable
                ></v-select>
              </v-col>
              <v-col cols="12" sm="6">
                <v-autocomplete
                  v-model="advFilters.inspectors"
                  :items="advInspectorOptions"
                  label="驗屋人員 (多選)"
                  multiple chips closable-chips
                  variant="outlined" density="compact" hide-details clearable
                ></v-autocomplete>
              </v-col>
              <v-col cols="12" sm="6">
                <v-autocomplete
                  v-model="advFilters.companies"
                  :items="advCompanyOptions"
                  label="代驗公司 (多選)"
                  multiple chips closable-chips
                  variant="outlined" density="compact" hide-details clearable
                ></v-autocomplete>
              </v-col>
              <v-col v-if="advBuildingOptions.length > 0" cols="12" sm="6">
                <v-select
                  v-model="advFilters.buildings"
                  :items="advBuildingOptions"
                  label="棟別 (多選)"
                  multiple chips closable-chips
                  variant="outlined" density="compact" hide-details clearable
                ></v-select>
              </v-col>
              <v-col cols="12" sm="6">
                <v-text-field
                  v-model="advFilters.bookerName"
                  label="預約人姓名"
                  variant="outlined" density="compact" hide-details clearable
                ></v-text-field>
              </v-col>
              <v-col cols="12" sm="6">
                <v-text-field
                  v-model="advFilters.buyerName"
                  label="買方姓名"
                  variant="outlined" density="compact" hide-details clearable
                ></v-text-field>
              </v-col>
            </v-row>
          </div>
        </v-card-text>

        <v-divider></v-divider>
        <v-card-actions class="px-3 px-sm-4 py-2 py-sm-3 flex-shrink-0 adv-filter-actions">
          <div class="d-flex align-center flex-wrap ga-1 w-100">
            <!-- 結果筆數：手機版關閉對話框前就能確認條件是否篩過頭 -->
            <v-chip size="small" label variant="tonal" :color="filteredAppointments.length === 0 ? 'error' : 'primary'">
              <v-icon start size="x-small">mdi-calendar-check</v-icon>
              顯示 {{ filteredAppointments.length }} 筆
            </v-chip>
            <v-btn v-if="advFilterCount > 0" size="small" variant="text" color="grey-darken-1" prepend-icon="mdi-broom" @click="clearAdvFilters">清除條件</v-btn>
            <v-spacer></v-spacer>
            <v-btn color="primary" variant="flat" :block="xs" :class="{ 'mt-2': xs }" @click="isAdvFilterDialogVisible = false">完成</v-btn>
          </div>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- 顯示設定：標題顯示 + 事件顏色（原「篩選與顯示設定」瘦身而來） -->
    <v-dialog v-model="isFilterDialogVisible" max-width="640px" scrollable :fullscreen="xs">
      <v-card class="d-flex flex-column">
        <v-card-title class="d-flex align-center bg-primary text-white py-3 px-4">
          <v-icon start>mdi-tune-variant</v-icon>
          <span class="text-subtitle-1 font-weight-bold">顯示設定</span>
          <v-spacer></v-spacer>
          <v-btn icon="mdi-close" variant="text" color="white" size="small" @click="isFilterDialogVisible = false"></v-btn>
        </v-card-title>

        <v-card-text class="pa-4" style="background-color:#f5f6f8;">
          <div class="text-caption text-grey-darken-1 mb-4 d-flex align-center">
            <v-icon size="16" class="mr-1" color="grey">mdi-information-outline</v-icon>
            勾選或調整後會即時反映在時間表上，設定會記憶在此裝置。
          </div>

          <!-- 標題顯示 -->
          <div class="bg-white rounded-lg pa-3 mb-3" style="border:1px solid #eceff1;">
            <div class="d-flex align-center mb-2">
              <v-avatar size="30" color="blue-grey" class="mr-2"><v-icon size="18" color="white">mdi-text-box-outline</v-icon></v-avatar>
              <div class="flex-grow-1">
                <div class="text-subtitle-2 font-weight-bold">標題顯示</div>
                <div class="text-caption text-grey-darken-1">時間表格子中要顯示的欄位資訊</div>
              </div>
              <v-btn size="x-small" variant="text" @click="selectedDisplayFields = displayFieldOptions.map(f => f.key)">全選</v-btn>
              <v-btn size="x-small" variant="text" color="grey" @click="selectedDisplayFields = []">清除</v-btn>
            </div>
            <v-chip-group v-model="selectedDisplayFields" multiple column selected-class="text-primary">
              <v-chip v-for="field in displayFieldOptions" :key="field.key" :value="field.key" filter variant="outlined" size="small">{{ field.label }}</v-chip>
            </v-chip-group>
          </div>

          <!-- 事件顏色 -->
          <div class="bg-white rounded-lg pa-3" style="border:1px solid #eceff1;">
            <div class="d-flex align-center mb-2">
              <v-avatar size="30" color="deep-orange-lighten-1" class="mr-2"><v-icon size="18" color="white">mdi-palette</v-icon></v-avatar>
              <div class="flex-grow-1">
                <div class="text-subtitle-2 font-weight-bold d-flex align-center">
                  事件顏色
                  <v-chip size="x-small" label class="ml-2" color="indigo-lighten-4">全建案共用</v-chip>
                </div>
                <div class="text-caption text-grey-darken-1">可依「預約項目類型」或「關鍵字／空值規則」指定事件底色與邊框色，留空則沿用系統預設配色</div>
              </div>
              <template v-if="canEdit">
                <v-btn size="x-small" variant="text" color="primary" :disabled="!currentTypeOptions.length" @click="applyDefaultTypeColors">建議配色</v-btn>
                <v-btn size="x-small" variant="text" color="grey" @click="clearAllTypeColors">全部清除</v-btn>
              </template>
            </div>
            <div class="text-caption text-grey-darken-1 mb-2">
              同一項目可依「<strong class="text-deep-orange">後台新增</strong>」與「<strong class="text-blue">前台預約</strong>」來源分別設定不同顏色。
            </div>
            <v-alert v-if="!canEdit" type="info" variant="tonal" density="compact" class="mb-2 text-caption">
              事件顏色為全建案共用設定，僅具「驗屋預約管理-修改」權限者可調整；目前為唯讀檢視。
            </v-alert>
            <div v-if="!currentTypeOptions.length" class="text-caption text-grey">此建案尚未設定預約項目類型</div>
            <div v-else class="d-flex flex-column ga-3">
              <div v-for="t in currentTypeOptions" :key="t" class="pa-3 rounded-lg" style="background-color:#fafafa;border:1px solid #eee;">
                <div class="text-body-2 font-weight-bold mb-2">{{ t }}</div>
                <div class="d-flex flex-wrap ga-4">
                  <div v-for="src in SOURCE_KEYS" :key="src.key" class="d-flex align-center" style="min-width:260px;flex:1 1 260px;">
                    <v-chip size="x-small" label variant="flat" class="mr-2 flex-shrink-0"
                      :color="src.key === 'admin' ? 'deep-orange-lighten-4' : 'blue-lighten-4'">
                      {{ src.label }}
                    </v-chip>
                    <!-- 底色 -->
                    <v-menu v-if="canEdit" :close-on-content-click="false" location="bottom start">
                      <template #activator="{ props }">
                        <div v-bind="props" class="d-flex align-center justify-center mr-1 flex-shrink-0" title="底色"
                          :style="{ width:'32px', height:'32px', borderRadius:'8px', cursor:'pointer',
                            backgroundColor: getTypeColor(src.key, t) || '#ffffff',
                            border: getTypeColor(src.key, t) ? '1px solid rgba(0,0,0,0.15)' : '1px dashed #bdbdbd' }">
                          <v-icon v-if="!getTypeColor(src.key, t)" size="16" color="grey">mdi-format-color-fill</v-icon>
                        </div>
                      </template>
                      <v-card width="280">
                        <div class="text-caption text-grey px-3 pt-2">底色</div>
                        <v-color-picker :model-value="getTypeColor(src.key, t) || (src.key === 'admin' ? '#FFF3E0' : '#E3F2FD')"
                          @update:model-value="setTypeColor(src.key, t, $event)" mode="hex" hide-inputs show-swatches width="100%"></v-color-picker>
                        <v-divider></v-divider>
                        <div class="d-flex pa-2">
                          <v-spacer></v-spacer>
                          <v-btn size="small" variant="text" color="grey" @click="clearTypeColor(src.key, t)">清除（用預設）</v-btn>
                        </div>
                      </v-card>
                    </v-menu>
                    <div v-else class="d-flex align-center justify-center mr-1 flex-shrink-0"
                      :style="{ width:'32px', height:'32px', borderRadius:'8px',
                        backgroundColor: getTypeColor(src.key, t) || '#ffffff',
                        border: getTypeColor(src.key, t) ? '1px solid rgba(0,0,0,0.15)' : '1px dashed #bdbdbd' }">
                      <v-icon v-if="!getTypeColor(src.key, t)" size="16" color="grey">mdi-minus</v-icon>
                    </div>
                    <!-- 邊框色 -->
                    <v-menu v-if="canEdit" :close-on-content-click="false" location="bottom start">
                      <template #activator="{ props }">
                        <div v-bind="props" class="d-flex align-center justify-center mr-2 flex-shrink-0" title="邊框顏色"
                          :style="{ width:'32px', height:'32px', borderRadius:'8px', cursor:'pointer', backgroundColor:'#ffffff',
                            border: getTypeBorder(src.key, t) ? `3px solid ${getTypeBorder(src.key, t)}` : '1px dashed #bdbdbd' }">
                          <v-icon v-if="!getTypeBorder(src.key, t)" size="16" color="grey">mdi-border-color</v-icon>
                        </div>
                      </template>
                      <v-card width="280">
                        <div class="text-caption text-grey px-3 pt-2">邊框顏色</div>
                        <v-color-picker :model-value="getTypeBorder(src.key, t) || '#E53935'"
                          @update:model-value="setTypeBorder(src.key, t, $event)" mode="hex" hide-inputs show-swatches width="100%"></v-color-picker>
                        <v-divider></v-divider>
                        <div class="d-flex pa-2">
                          <v-spacer></v-spacer>
                          <v-btn size="small" variant="text" color="grey" @click="clearTypeBorder(src.key, t)">清除（無邊框）</v-btn>
                        </div>
                      </v-card>
                    </v-menu>
                    <div v-else class="d-flex align-center justify-center mr-2 flex-shrink-0"
                      :style="{ width:'32px', height:'32px', borderRadius:'8px', backgroundColor:'#ffffff',
                        border: getTypeBorder(src.key, t) ? `3px solid ${getTypeBorder(src.key, t)}` : '1px dashed #bdbdbd' }">
                      <v-icon v-if="!getTypeBorder(src.key, t)" size="16" color="grey">mdi-minus</v-icon>
                    </div>
                    <v-chip size="small" label variant="flat" class="flex-shrink-0"
                      :style="{ backgroundColor: getTypeColor(src.key, t) || '#EEEEEE', color: getReadableTextColor(getTypeColor(src.key, t) || '#EEEEEE'),
                        border: getTypeBorder(src.key, t) ? `2px solid ${getTypeBorder(src.key, t)}` : 'none' }">
                      {{ (getTypeColor(src.key, t) || getTypeBorder(src.key, t)) ? '預覽' : '預設' }}
                    </v-chip>
                    <v-btn v-if="canEdit && (getTypeColor(src.key, t) || getTypeBorder(src.key, t))" icon="mdi-close" size="x-small" variant="text" color="grey" class="ml-1 flex-shrink-0"
                      @click="clearTypeColor(src.key, t)" title="清除此來源底色與邊框"></v-btn>
                  </div>
                </div>
              </div>
            </div>
            <!-- 關鍵字顏色規則 -->
            <v-divider class="my-3"></v-divider>
            <div class="d-flex align-center mb-2">
              <v-avatar size="30" color="amber-darken-2" class="mr-2"><v-icon size="18" color="white">mdi-format-color-highlight</v-icon></v-avatar>
              <div class="flex-grow-1">
                <div class="text-subtitle-2 font-weight-bold">關鍵字／空值顏色</div>
                <div class="text-caption text-grey-darken-1">指定欄位「含關鍵字」或「為空值」時的事件底色與邊框色，由上而下第一個符合的規則生效（↑↓ 可調整優先順序）。同一規則可加入多個條件，全部條件都符合才套用。</div>
              </div>
              <v-btn v-if="canEdit" size="x-small" variant="text" color="primary" prepend-icon="mdi-plus" @click="addKeywordRule">新增規則</v-btn>
            </div>
            <div v-if="!keywordColorRules.length" class="text-caption text-grey mb-2">尚未設定規則。例：欄位「選擇方式」含「屋主自驗」→ 黃色底；欄位「驗屋人員」為空值 → 白底紅框；也可組合多個條件（如「初驗」且「驗屋人員為空」）。</div>
            <div v-else class="d-flex flex-column ga-2 mb-2">
              <div v-for="(rule, idx) in keywordColorRules" :key="idx" class="pa-2 rounded-lg" style="background-color:#fafafa;border:1px solid #eee;">
                <!-- 條件列（可多個，全部符合才套用） -->
                <div v-for="(cond, cIdx) in rule.conditions" :key="cIdx" class="d-flex align-center flex-wrap ga-2" :class="{ 'mt-2': cIdx > 0 }">
                  <span v-if="cIdx === 0" class="text-caption text-grey flex-shrink-0" style="width:18px;">{{ idx + 1 }}.</span>
                  <span v-else class="text-caption text-blue-grey flex-shrink-0 font-weight-bold" style="width:18px;">且</span>
                  <v-select :model-value="cond.matchMode || 'contains'" @update:model-value="setRuleConditionMatchMode(idx, cIdx, $event)"
                    :items="[{ key: 'contains', label: '含關鍵字' }, { key: 'empty', label: '欄位為空值' }]"
                    item-title="label" item-value="key" density="compact" hide-details
                    variant="outlined" label="比對方式" style="min-width:118px;max-width:130px;" :disabled="!canEdit"></v-select>
                  <v-select :model-value="cond.field" @update:model-value="updateRuleCondition(idx, cIdx, { field: $event })"
                    :items="cond.matchMode === 'empty' ? keywordFieldOptions.filter(o => o.key !== '*') : keywordFieldOptions"
                    item-title="label" item-value="key" density="compact" hide-details
                    variant="outlined" label="欄位" style="min-width:140px;max-width:170px;" :disabled="!canEdit"></v-select>
                  <v-text-field v-if="cond.matchMode !== 'empty'" :model-value="cond.keyword" @update:model-value="updateRuleCondition(idx, cIdx, { keyword: $event })"
                    density="compact" hide-details variant="outlined" label="關鍵字" placeholder="例：屋主自驗"
                    style="min-width:130px;flex:1 1 130px;" :disabled="!canEdit"></v-text-field>
                  <v-btn v-if="canEdit && rule.conditions.length > 1" icon="mdi-close" size="x-small" variant="text" color="grey" class="flex-shrink-0"
                    @click="removeRuleCondition(idx, cIdx)" title="移除此條件"></v-btn>
                </div>
                <!-- 規則層：新增條件 + 顏色 + 預覽 + 排序/刪除 -->
                <div class="d-flex align-center flex-wrap ga-2 mt-2">
                <span class="flex-shrink-0" style="width:18px;"></span>
                <v-btn v-if="canEdit" size="x-small" variant="tonal" color="blue-grey" prepend-icon="mdi-plus" class="flex-shrink-0"
                  @click="addRuleCondition(idx)" title="加入另一個條件（全部符合才套用）">加條件</v-btn>
                <!-- 底色 -->
                <v-menu v-if="canEdit" :close-on-content-click="false" location="bottom start">
                  <template #activator="{ props }">
                    <div v-bind="props" class="d-flex align-center justify-center flex-shrink-0" title="底色"
                      :style="{ width:'32px', height:'32px', borderRadius:'8px', cursor:'pointer',
                        backgroundColor: rule.color || '#ffffff',
                        border: rule.color ? '1px solid rgba(0,0,0,0.15)' : '1px dashed #bdbdbd' }">
                      <v-icon v-if="!rule.color" size="16" color="grey">mdi-format-color-fill</v-icon>
                    </div>
                  </template>
                  <v-card width="280">
                    <div class="text-caption text-grey px-3 pt-2">底色</div>
                    <v-color-picker :model-value="rule.color || '#FFF59D'"
                      @update:model-value="updateKeywordRule(idx, { color: $event })" mode="hex" hide-inputs show-swatches width="100%"></v-color-picker>
                    <v-divider></v-divider>
                    <div class="d-flex pa-2">
                      <v-spacer></v-spacer>
                      <v-btn size="small" variant="text" color="grey" @click="updateKeywordRule(idx, { color: '' })">清除底色</v-btn>
                    </div>
                  </v-card>
                </v-menu>
                <div v-else class="d-flex align-center justify-center flex-shrink-0"
                  :style="{ width:'32px', height:'32px', borderRadius:'8px',
                    backgroundColor: rule.color || '#ffffff',
                    border: rule.color ? '1px solid rgba(0,0,0,0.15)' : '1px dashed #bdbdbd' }"></div>
                <!-- 邊框色 -->
                <v-menu v-if="canEdit" :close-on-content-click="false" location="bottom start">
                  <template #activator="{ props }">
                    <div v-bind="props" class="d-flex align-center justify-center flex-shrink-0" title="邊框顏色"
                      :style="{ width:'32px', height:'32px', borderRadius:'8px', cursor:'pointer', backgroundColor:'#ffffff',
                        border: rule.borderColor ? `3px solid ${rule.borderColor}` : '1px dashed #bdbdbd' }">
                      <v-icon v-if="!rule.borderColor" size="16" color="grey">mdi-border-color</v-icon>
                    </div>
                  </template>
                  <v-card width="280">
                    <div class="text-caption text-grey px-3 pt-2">邊框顏色</div>
                    <v-color-picker :model-value="rule.borderColor || '#E53935'"
                      @update:model-value="updateKeywordRule(idx, { borderColor: $event })" mode="hex" hide-inputs show-swatches width="100%"></v-color-picker>
                    <v-divider></v-divider>
                    <div class="d-flex pa-2">
                      <v-spacer></v-spacer>
                      <v-btn size="small" variant="text" color="grey" @click="updateKeywordRule(idx, { borderColor: '' })">清除（無邊框）</v-btn>
                    </div>
                  </v-card>
                </v-menu>
                <div v-else class="d-flex align-center justify-center flex-shrink-0"
                  :style="{ width:'32px', height:'32px', borderRadius:'8px', backgroundColor:'#ffffff',
                    border: rule.borderColor ? `3px solid ${rule.borderColor}` : '1px dashed #bdbdbd' }"></div>
                <v-chip size="small" label variant="flat" class="flex-shrink-0"
                  :style="{ backgroundColor: rule.color || '#EEEEEE', color: getReadableTextColor(rule.color || '#EEEEEE'),
                    border: rule.borderColor ? `2px solid ${rule.borderColor}` : 'none' }">
                  {{ ruleSummary(rule) }}
                </v-chip>
                <v-spacer></v-spacer>
                <template v-if="canEdit">
                  <v-btn icon="mdi-arrow-up" size="x-small" variant="text" color="grey" class="flex-shrink-0"
                    :disabled="idx === 0" @click="moveKeywordRule(idx, -1)" title="上移（提高優先）"></v-btn>
                  <v-btn icon="mdi-arrow-down" size="x-small" variant="text" color="grey" class="flex-shrink-0"
                    :disabled="idx === keywordColorRules.length - 1" @click="moveKeywordRule(idx, 1)" title="下移（降低優先）"></v-btn>
                  <v-btn icon="mdi-delete-outline" size="x-small" variant="text" color="grey" class="flex-shrink-0"
                    @click="removeKeywordRule(idx)" title="刪除此規則"></v-btn>
                </template>
                </div>
              </div>
            </div>

            <!-- 優先層級 -->
            <div class="pa-3 rounded-lg" style="background-color:#fafafa;border:1px solid #eee;">
              <div class="text-body-2 font-weight-bold mb-1">顏色優先層級</div>
              <div class="text-caption text-grey-darken-1 mb-2">當事件同時符合「關鍵字／空值規則」與「預約項目類型」顏色時，優先採用：</div>
              <v-btn-toggle :model-value="keywordPriority" @update:model-value="setKeywordPriority"
                mandatory density="compact" color="primary" variant="outlined" :disabled="!canEdit">
                <v-btn value="type" size="small">項目類型優先</v-btn>
                <v-btn value="keyword" size="small">關鍵字／空值規則優先</v-btn>
              </v-btn-toggle>
              <div class="text-caption text-grey mt-2">關鍵字與空值規則同屬一份清單，以 ↑↓ 排序決定彼此的優先順序（由上而下第一個符合者生效）。「取消／已完成」狀態的固定灰色不受此設定影響。</div>
            </div>

            <template v-if="canEdit">
              <v-divider class="my-3"></v-divider>
              <div class="d-flex align-center flex-wrap ga-2">
                <v-chip v-if="colorSettingsDirty" size="small" color="warning" variant="tonal" prepend-icon="mdi-alert-circle-outline">
                  有未儲存的變更
                </v-chip>
                <span v-else class="text-caption text-grey">變更後請按「儲存」才會套用給所有使用者</span>
                <v-spacer></v-spacer>
                <v-btn size="small" variant="text" color="grey" :disabled="!colorSettingsDirty || isSavingColors"
                  @click="syncColorSettingsFromProject(true)">還原</v-btn>
                <v-btn size="small" color="primary" variant="flat" :loading="isSavingColors"
                  :disabled="!colorSettingsDirty" prepend-icon="mdi-content-save" @click="saveEventColorSettings">
                  儲存事件顏色
                </v-btn>
              </div>
            </template>
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

    <!-- 資料透視 -->
    <v-dialog v-model="isPivotDialogVisible" max-width="960px" scrollable>
      <v-card>
        <v-card-title class="text-h6 d-flex align-center bg-blue-grey-lighten-5" v-draggable-dialog>
          <v-icon start>mdi-table-pivot</v-icon>
          <span class="text-subtitle-1 font-weight-bold">
            {{ projectName }} {{ formattedDateRangeTitle }} 資料透視
          </span>
          <v-spacer></v-spacer>
          <v-btn icon="mdi-close" variant="text" @click="isPivotDialogVisible = false"></v-btn>
        </v-card-title>
        <v-divider></v-divider>

        <v-card-text class="pa-4" style="background-color:#f5f6f8;">
          <!-- 維度與範圍設定 -->
          <div class="bg-white rounded-lg pa-3 mb-3" style="border:1px solid #eceff1;">
            <div class="d-flex flex-wrap align-center ga-3">
              <v-select v-model="pivotRowDim" :items="pivotDimensionOptions" item-title="label" item-value="key"
                label="列（分組依據）" density="compact" hide-details variant="outlined"
                prepend-inner-icon="mdi-table-row" style="min-width:200px;max-width:240px;"></v-select>
              <v-icon color="grey">mdi-close</v-icon>
              <v-select v-model="pivotColDim" :items="pivotColDimOptions" item-title="label" item-value="key"
                label="欄（交叉維度，可不選）" density="compact" hide-details variant="outlined"
                prepend-inner-icon="mdi-table-column" style="min-width:200px;max-width:240px;"></v-select>
            </div>
            <div class="d-flex flex-wrap align-center ga-1 mt-2">
              <span class="text-caption text-grey-darken-1 mr-1">
                <v-icon size="14">mdi-flag-variant</v-icon> 狀態：
              </span>
              <v-chip-group v-model="pivotStatuses" multiple column selected-class="text-primary" class="pivot-status-chips">
                <v-chip v-for="s in PIVOT_STATUS_OPTIONS" :key="s" :value="s" filter variant="outlined" size="small">{{ s }}</v-chip>
              </v-chip-group>
            </div>
            <div class="d-flex flex-wrap align-center ga-2 mt-1">
              <v-chip size="small" color="blue-grey" variant="tonal" prepend-icon="mdi-calendar-range">
                共 {{ pivotMatrix.eventCount }} 筆預約
              </v-chip>
              <span class="text-caption text-grey-darken-1">
                狀態可在此獨立勾選（開啟時預設同行事曆）；「項目／選擇方式」篩選與日期區間則跟隨行事曆設定。
              </span>
              <v-chip v-if="pivotHasPersonCount" size="small" color="indigo" variant="tonal" prepend-icon="mdi-account-multiple">
                合計 {{ pivotMatrix.grandTotal }} 人次
              </v-chip>
              <span v-if="pivotHasPersonCount" class="text-caption text-grey-darken-1">
                一筆預約有多位驗屋人員時會分別計入，總計為「人次」而非筆數。
              </span>
            </div>
          </div>

          <!-- 資料透視表 -->
          <v-alert v-if="pivotMatrix.rows.length === 0" type="info" variant="tonal"
            text="目前條件下無任何預約資料可供分析。"></v-alert>
          <div v-else class="bg-white rounded-lg" style="border:1px solid #eceff1;overflow:auto;max-height:60vh;">
            <v-table density="compact">
              <thead>
                <tr class="bg-grey-lighten-4">
                  <th class="text-left font-weight-bold pivot-sortable" style="min-width:140px;position:sticky;left:0;background:#f5f5f5;z-index:1;"
                    @click="togglePivotSort('__name__')" title="點擊排序">
                    {{ pivotDimensionLabel(pivotRowDim) }}
                    <v-icon size="14" :color="pivotSort.key === '__name__' ? 'primary' : 'grey-lighten-1'">{{ pivotSortIcon('__name__') }}</v-icon>
                  </th>
                  <th v-for="c in pivotMatrix.colHeaders" :key="c" class="text-center font-weight-bold pivot-sortable" style="min-width:70px;"
                    @click="togglePivotSort(c)" title="點擊排序">
                    {{ c }}
                    <v-icon size="14" :color="pivotSort.key === c ? 'primary' : 'grey-lighten-1'">{{ pivotSortIcon(c) }}</v-icon>
                  </th>
                  <th v-if="pivotMatrix.useCol" class="text-center font-weight-bold pivot-sortable" style="min-width:70px;"
                    @click="togglePivotSort('__total__')" title="點擊排序">
                    總計
                    <v-icon size="14" :color="pivotSort.key === '__total__' ? 'primary' : 'grey-lighten-1'">{{ pivotSortIcon('__total__') }}</v-icon>
                  </th>
                  <th class="text-center font-weight-bold pivot-sortable" style="min-width:70px;"
                    @click="togglePivotSort('__total__')" title="點擊排序（同總計）">
                    佔比
                    <v-icon size="14" :color="pivotSort.key === '__total__' ? 'primary' : 'grey-lighten-1'">{{ pivotSortIcon('__total__') }}</v-icon>
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="row in sortedPivotRows" :key="row.name">
                  <td class="font-weight-medium" style="position:sticky;left:0;background:#fff;z-index:1;">{{ row.name }}</td>
                  <td v-for="c in pivotMatrix.colHeaders" :key="c" class="text-center">
                    <span :class="row.counts[c] ? '' : 'text-grey-lighten-1'">{{ row.counts[c] || 0 }}</span>
                  </td>
                  <td v-if="pivotMatrix.useCol" class="text-center font-weight-bold text-blue-grey-darken-2">{{ row.total }}</td>
                  <td class="text-center text-grey-darken-1">{{ row.pct }}%</td>
                </tr>
              </tbody>
              <tfoot class="bg-grey-lighten-3">
                <tr class="font-weight-bold">
                  <td style="position:sticky;left:0;background:#eeeeee;z-index:1;">總計</td>
                  <td v-for="c in pivotMatrix.colHeaders" :key="c" class="text-center">{{ pivotMatrix.totals[c] || 0 }}</td>
                  <td v-if="pivotMatrix.useCol" class="text-center text-deep-orange-darken-3">{{ pivotMatrix.grandTotal }}</td>
                  <td class="text-center">100%</td>
                </tr>
              </tfoot>
            </v-table>
          </div>
        </v-card-text>

        <v-divider></v-divider>
        <v-card-actions class="pa-3 bg-grey-lighten-4">
          <v-btn variant="text" color="primary" prepend-icon="mdi-content-copy"
            :disabled="pivotMatrix.rows.length === 0" @click="copyPivotTable">複製表格</v-btn>
          <v-spacer></v-spacer>
          <v-btn color="primary" variant="flat" @click="isPivotDialogVisible = false">完成</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- 下載人員行程表(PNG)：勾選人員後下載（每人一張 / 合併一張） -->
    <v-dialog v-model="isPersonPngDialogVisible" max-width="640px" scrollable :fullscreen="xs">
      <v-card>
        <v-card-title class="text-h6 d-flex align-center bg-blue-grey-lighten-5" v-draggable-dialog>
          <v-icon start>mdi-account-multiple-outline</v-icon>
          <span class="text-subtitle-1 font-weight-bold">下載人員行程表 (PNG)</span>
          <v-spacer></v-spacer>
          <v-btn icon="mdi-close" variant="text" @click="isPersonPngDialogVisible = false"></v-btn>
        </v-card-title>
        <v-divider></v-divider>
        <v-card-text class="pa-4">
          <div class="text-caption text-medium-emphasis mb-2">
            日期區間與篩選條件跟隨時間表目前設定（{{ formattedDateRangeTitle }}），共 {{ personPngEventsInRange.length }} 筆預約；顯示欄位與資料列顏色跟隨「顯示設定」的事件欄位與事件顏色；一筆預約有多位人員時，會在每位人員的行程表各列一次。
          </div>
          <v-alert v-if="personPngEventsInRange.length === 0" type="info" variant="tonal"
            text="目前日期區間與篩選條件下沒有預約資料。"></v-alert>
          <v-row v-else dense>
            <v-col v-for="(meta, groupKey) in PERSON_PNG_GROUP_META" :key="groupKey" cols="12" sm="6">
              <div class="d-flex align-center mb-1">
                <span class="text-subtitle-2 font-weight-bold">{{ meta.label }}</span>
                <span class="text-caption text-medium-emphasis ml-1">（已選 {{ personPngSelected[groupKey].length }}/{{ personPngGroups[groupKey].length }}）</span>
                <v-spacer></v-spacer>
                <v-btn size="x-small" variant="text" color="primary" @click="personPngSelected[groupKey] = personPngGroups[groupKey].map(([n]) => n)">全選</v-btn>
                <v-btn size="x-small" variant="text" color="grey-darken-1" @click="personPngSelected[groupKey] = []">清除</v-btn>
              </div>
              <div class="person-png-list rounded border">
                <v-checkbox
                  v-for="[name, evts] in personPngGroups[groupKey]"
                  :key="name"
                  v-model="personPngSelected[groupKey]"
                  :value="name"
                  :label="`${name}（${evts.length} 筆）`"
                  density="compact" hide-details color="primary"
                ></v-checkbox>
                <div v-if="personPngGroups[groupKey].length === 0" class="text-caption text-medium-emphasis pa-3 text-center">此區間沒有資料</div>
              </div>
            </v-col>
          </v-row>
        </v-card-text>
        <v-divider></v-divider>
        <v-card-actions class="pa-3 bg-grey-lighten-4 flex-wrap">
          <span class="text-caption text-medium-emphasis">已選 {{ personPngSelectedCount }} 人</span>
          <v-spacer></v-spacer>
          <v-btn color="grey-darken-1" variant="text" :disabled="isDownloadingPdf" @click="isPersonPngDialogVisible = false">取消</v-btn>
          <v-btn color="primary" variant="tonal" prepend-icon="mdi-image-area"
            :disabled="personPngSelectedCount === 0 || isDownloadingPdf"
            @click="handleDownloadPersonPngCombined">合併一張</v-btn>
          <v-btn color="primary" variant="flat" prepend-icon="mdi-image-multiple-outline"
            :disabled="personPngSelectedCount === 0" :loading="isDownloadingPdf"
            @click="handleDownloadPersonPngSeparate">每人一張</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- 下載日期PNG：選擇日期區間後下載時間表圖檔 -->
    <v-dialog v-model="isDatePngDialogVisible" max-width="420px">
      <v-card>
        <v-card-title class="text-h6 d-flex align-center bg-blue-grey-lighten-5" v-draggable-dialog>
          <v-icon start>mdi-image-area</v-icon>
          <span class="text-subtitle-1 font-weight-bold">下載日期PNG</span>
          <v-spacer></v-spacer>
          <v-btn icon="mdi-close" variant="text" @click="isDatePngDialogVisible = false"></v-btn>
        </v-card-title>
        <v-divider></v-divider>
        <v-card-text class="pa-4">
          <div class="text-caption text-medium-emphasis mb-2">
            選擇要下載的日期區間（預設為時間表目前檢視範圍）；項目／狀態等篩選條件跟隨時間表目前設定。
          </div>
          <div class="d-flex align-center ga-2">
            <input type="date" v-model="datePngRange.start" class="date-png-input">
            <span class="text-grey">~</span>
            <input type="date" v-model="datePngRange.end" class="date-png-input">
          </div>
          <div class="d-flex align-center mt-3">
            <v-progress-circular v-if="isListExportFetching" indeterminate size="16" width="2" color="primary" class="mr-2"></v-progress-circular>
            <span class="text-caption" :class="isListExportFetching ? 'text-medium-emphasis' : ''">
              {{ isListExportFetching ? '載入區間資料中…' : `此區間共 ${datePngCount} 筆預約` }}
            </span>
          </div>
          <v-alert
            v-if="datePngRange.start && datePngRange.end && datePngRange.start > datePngRange.end"
            type="warning" variant="tonal" density="compact" class="mt-2"
            text="開始日期不可晚於結束日期。"
          ></v-alert>
        </v-card-text>
        <v-divider></v-divider>
        <v-card-actions class="pa-3 bg-grey-lighten-4">
          <v-spacer></v-spacer>
          <v-btn color="grey-darken-1" variant="text" :disabled="isDownloadingPdf" @click="isDatePngDialogVisible = false">取消</v-btn>
          <v-btn color="primary" variant="flat" prepend-icon="mdi-tray-arrow-down"
            :disabled="!datePngRange.start || !datePngRange.end || datePngRange.start > datePngRange.end || isListExportFetching"
            :loading="isDownloadingPdf"
            @click="handleDatePngDownload">下載PNG</v-btn>
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
          <v-divider class="my-3"></v-divider>
          <CancelNotifyPicker v-if="isCancelConfirmDialogVisible && eventToCancel.id"
            :project-id="eventToCancel.projectId"
            :appointment-id="eventToCancel.id"
            v-model="cancelNotifySelection" />
        </v-card-text>

        <v-divider></v-divider>
        <v-card-actions class="pa-3">
          <v-spacer></v-spacer>
          <v-btn variant="text" @click="isCancelConfirmDialogVisible = false">返回</v-btn>
          <v-btn color="red-darken-1" variant="flat" :loading="isCancelling" :disabled="!cancelNotifySelection.ready" @click="handleConfirmCancelBooking">確定取消</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    
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

  <!-- 下載EXCEL(列表)：選日期 + 選欄位/排序（比照銷控「下載指定戶別資料」） -->
  <ScheduleListExportDialog
    v-model="isListExportDialogVisible"
    :items="listExportItems"
    :columns="listExportColumns"
    :project-name="projectName"
    :range-start="listExportRangeStart"
    :range-end="listExportRangeEnd"
    :fetching="isListExportFetching"
    @fetch-range="handleListExportFetchRange"
  />

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

    <v-btn @click="isAdvFilterDialogVisible = true">
      <v-badge :content="advFilterCount" :model-value="advFilterCount > 0" color="error" offset-x="-4" offset-y="-2">
        <v-icon>mdi-filter-variant</v-icon>
      </v-badge>
      <span>篩選</span>
    </v-btn>

    <v-btn v-if="canEdit" @click="isAdminAddDialogVisible = true"> <v-icon>mdi-calendar-plus</v-icon>
      <span>新增</span>
    </v-btn>

    <v-menu location="top">
      <template v-slot:activator="{ props }">
        <v-btn v-bind="props" :loading="isDownloadingPdf || isDownloadingExcel">
          <v-icon>mdi-dots-horizontal</v-icon>
          <span>更多</span>
        </v-btn>
      </template>
      <v-list density="compact">
        <v-list-item
          prepend-icon="mdi-chart-bar"
          title="統計摘要"
          @click="isStatisticsDialogVisible = true"
          :disabled="statisticsMatrix.rows.length === 0"
        ></v-list-item>
        <v-list-item
          prepend-icon="mdi-table-pivot"
          title="資料透視"
          @click="isPivotDialogVisible = true"
        ></v-list-item>
        <v-list-item
          prepend-icon="mdi-cog"
          title="顯示設定"
          @click="isFilterDialogVisible = true"
        ></v-list-item>
        <v-divider></v-divider>
        <v-list-item
          prepend-icon="mdi-image-area"
          title="下載日期PNG"
          @click="isDatePngDialogVisible = true"
          :disabled="isDownloadingPdf || isDownloadingExcel"
        >
          <template v-slot:append>
            <v-progress-circular v-if="isDownloadingPdf" indeterminate color="grey" size="20" width="2"></v-progress-circular>
          </template>
        </v-list-item>
        <v-list-item
          prepend-icon="mdi-account-multiple-outline"
          title="下載人員行程表PNG"
          @click="isPersonPngDialogVisible = true"
          :disabled="isDownloadingPdf || isDownloadingExcel"
        ></v-list-item>
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
        <v-list-item
          prepend-icon="mdi-table-arrow-down"
          title="下載EXCEL(列表)"
          @click="isListExportDialogVisible = true"
          :disabled="isDownloadingPdf || isDownloadingExcel"
        ></v-list-item>
      </v-list>
    </v-menu>
  </v-bottom-navigation>
</teleport>
</template>

<script setup>
import AppointmentDetailsDialog from '@/components/AppointmentDetailsDialog.vue';
import AdminAddBookingDialog from '@/components/AdminAddBookingDialog.vue';
import CancelNotifyPicker from '@/components/CancelNotifyPicker.vue';
import ScheduleListExportDialog from '@/components/ScheduleListExportDialog.vue';
import InspectorLeaveManagerDialog from '@/components/InspectorLeaveManagerDialog.vue';
import CalendarNoteManagerDialog from '@/components/CalendarNoteManagerDialog.vue';
import { buildLeaveMap, annotateInspectorPersons, getLeaveTypeForSlot, LEAVE_TYPE_LABELS } from '@/utils/inspectorLeaveUtils';
import { buildCalendarNoteMap, getNoteColor } from '@/utils/calendarNoteUtils';

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


import { useDisplay } from 'vuetify';
import { format, startOfWeek, endOfWeek, addDays, isToday, isSaturday, isSunday, eachDayOfInterval, parseISO, startOfMonth, endOfMonth, addMonths } from 'date-fns';
import { zhTW } from 'date-fns/locale';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { useClipboard } from '@vueuse/core';
import * as XLSX from 'xlsx-js-style';
import { vDraggableDialog } from '@/directives/vDraggableDialog';
import { useSystemPresence } from '@/composables/useSystemPresence';
import { formatSalespersons, normalizeSalespersons } from '@/utils/salespersonUtils';



// --- Store 和路由 ---
// projectId 支援兩種來源：路由參數（主版本入口），或由父層以 prop 傳入
// （LIFF 預約時間表 LiffInspectionCalendar.vue 以薄包裝方式共用本元件，兩處介面與功能永遠一致）
const props = defineProps({
  projectId: { type: String, default: null },
});
const route = useRoute();
const router = useRouter(); // 驗屋預約管理 【新增】獲取 router 實例
const userStore = useUserStore();
const pageContextStore = usePageContextStore();
const projectStore = useProjectStore(); // 驗屋預約管理 2. 建立 store 實例
const projectId = ref(props.projectId || route.params.projectId);

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
const isLeaveManagerVisible = ref(false); // 驗屋人員排休管理
const inspectorLeaveRecords = ref([]); // 目前日期範圍內的排休/備註
const inspectorLeaveMap = computed(() => buildLeaveMap(inspectorLeaveRecords.value).leaveMap);
// 行事曆備註（獨立於排休備註，顯示於時間表日期標題下一列）
const isCalendarNoteManagerVisible = ref(false);
const calendarNoteDefaultDate = ref('');
const calendarNoteRecords = ref([]); // 目前日期範圍內的行事曆備註
const calendarNotesByDate = computed(() => buildCalendarNoteMap(calendarNoteRecords.value));
// 每日名額摘要：{ 'yyyy-MM-dd': [{ label, capacity, booked, remaining, methods[], slots[] }] }
// 由後端彙整批次設定（dateRules）與已約筆數（預約中＋已完成）後回傳
const dailyQuotaByDate = ref({});
// 桌機時間表的「名額」「備註」列收合狀態（預設展開，記憶在此裝置、依建案區分）
const isQuotaRowExpanded = useStorage(`inspection_calendar_quota_row_expanded_${projectId.value}`, true);
const isNoteRowExpanded = useStorage(`inspection_calendar_note_row_expanded_${projectId.value}`, true);
// 桌機時間表的「名額」「備註」整列隱藏狀態（隱藏後連列位都不顯示，記憶在此裝置、依建案區分）
const isQuotaRowHidden = useStorage(`inspection_calendar_quota_row_hidden_${projectId.value}`, false);
const isNoteRowHidden = useStorage(`inspection_calendar_note_row_hidden_${projectId.value}`, false);
const selectedEvent = ref(null);
const calendarData = ref([]); // ★ 2. 新增 ref 來儲存日期標記
const bookingHistory = ref([]); // ★ 3. 新增 ref 來儲存歷史紀錄
const isDownloadingPdf = ref(false);
const isDownloadingExcel = ref(false);
const isFilterDialogVisible = ref(false);
const isStatisticsDialogVisible = ref(false); // ✅ 新增這一行
const isListExportDialogVisible = ref(false); // 下載EXCEL(列表) 對話框
const isAdvFilterDialogVisible = ref(false); // 進階篩選對話框（自「篩選與顯示設定」拆出）
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
// 需醒目呈現的欄位：在事件中以獨立色塊顯示，而非混入串接文字
const HIGHLIGHT_FIELD_META = {
  inspectors: { icon: 'mdi-account-hard-hat', label: '驗屋人員', cssClass: 'event-hl-inspectors' },
  salesperson: { icon: 'mdi-account-tie', label: '銷售人員', cssClass: 'event-hl-salesperson' },
  remarks: { icon: 'mdi-alert-circle', label: '重要備註', cssClass: 'event-hl-remarks' },
  bookingRemarks: { icon: 'mdi-note-text-outline', label: '預約備註', cssClass: 'event-hl-booking-remarks' },
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
    { key: 'salesperson', label: '銷售人員' },
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
  // 銷售人員（陣列，容忍舊字串）：格式化為「、」分隔字串，空值回傳 null 以跳過顯示
  if (fieldOption.key === 'salesperson') {
    const s = formatSalespersons(eventData.salesperson, '、', '');
    return s || null;
  }
  return eventData[fieldOption.key] ?? null;
}

// 下載EXCEL(列表) 的可匯出欄位：預約欄位 + 動態自訂欄位（key 前綴 dyn:）+ 戶別欄位
const listExportColumns = computed(() => {
  const dynamic = displayFieldOptions.value
    .filter(f => f.isDynamic)
    .map(f => ({ key: `dyn:${f.key}`, title: f.label }));
  return [
    { key: 'date', title: '日期' },
    { key: 'weekday', title: '星期' },
    { key: 'appointmentTimeSlot', title: '時段' },
    { key: 'unitId', title: '戶別' },
    { key: 'bookingType', title: '預約項目' },
    { key: 'inspectionMethod', title: '選擇方式' },
    { key: 'bookingSubOption', title: '子項目' },
    ...dynamic,
    { key: 'status', title: '狀態' },
    { key: 'checkInStatus', title: '報到狀態' },
    { key: 'source', title: '來源' },
    { key: 'bookerName', title: '預約人姓名' },
    { key: 'bookerPhone', title: '預約人電話' },
    { key: 'bookerEmail', title: '預約人EMAIL' },
    { key: 'bookerIdNumber', title: '預約人身分證(驗證碼)' },
    { key: 'inspectors', title: '驗屋人員' },
    { key: 'salesperson', title: '銷售人員' },
    { key: 'inspectionCompanyName', title: '代驗公司' },
    { key: 'agentName', title: '受託人姓名' },
    { key: 'agentPhone', title: '受託人電話' },
    { key: 'bookingRemarks', title: '預約備註' },
    { key: 'remarks', title: '重要備註' },
    { key: 'address', title: '門牌' },
    { key: 'parkingLots', title: '車位' },
    { key: 'buyerName', title: '買方姓名' },
    { key: 'buyerPhone', title: '買方電話' },
    { key: 'buyerEmail', title: '買方EMAIL' },
    { key: 'appropriationDate', title: '撥款日期' },
    { key: 'bank', title: '銀行' },
    { key: 'bankContact', title: '銀行窗口' },
    { key: 'initialInspectionBatch', title: '初驗批次' },
    { key: 'reInspectionBatch', title: '複驗批次' },
    { key: 'handoverTime', title: '交屋時間' },
    { key: 'createdByName', title: '建立人' },
    { key: 'lastModifiedByName', title: '最後修改人' },
  ];
});

// 下載EXCEL(列表) 的資料來源：不受頁面篩選影響，交由對話框內部自行篩選
const listExportItems = computed(() => processAppointments(allAppointments.value));

// ── 進階篩選（移植自「下載EXCEL(列表)」對話框的篩選條件，即時套用於時間表月曆） ──
// 刻意不做本機記憶：重新整理即重置，避免看不見的舊條件造成「時間表怎麼沒資料」的困惑
const ADV_EMPTY_OPTION = '(無)';
const advFilters = reactive({
  keyword: '',
  weekdays: [],
  timeSlots: [],
  sources: [],
  checkInStatuses: [],
  inspectors: [],
  companies: [],
  buildings: [],
  bookerName: '',
  buyerName: '',
});
const clearAdvFilters = () => {
  advFilters.keyword = '';
  advFilters.weekdays = [];
  advFilters.timeSlots = [];
  advFilters.sources = [];
  advFilters.checkInStatuses = [];
  advFilters.inspectors = [];
  advFilters.companies = [];
  advFilters.buildings = [];
  advFilters.bookerName = '';
  advFilters.buyerName = '';
};
const advFilterCount = computed(() => {
  let n = 0;
  if (advFilters.keyword && advFilters.keyword.trim()) n++;
  if (advFilters.weekdays.length > 0) n++;
  if (advFilters.timeSlots.length > 0) n++;
  if (advFilters.sources.length > 0) n++;
  if (advFilters.checkInStatuses.length > 0) n++;
  if (advFilters.inspectors.length > 0) n++;
  if (advFilters.companies.length > 0) n++;
  if (advFilters.buildings.length > 0) n++;
  if (advFilters.bookerName) n++;
  if (advFilters.buyerName) n++;
  return n;
});

const ADV_DOW_LABELS = ['日', '一', '二', '三', '四', '五', '六'];
const advWeekdayOptions = [1, 2, 3, 4, 5, 6, 0].map(d => ({ value: d, title: `星期${ADV_DOW_LABELS[d]}` }));
const ADV_SOURCE_OPTIONS = ['前台預約', '後台新增'];

// 已套用的進階條件攤平成可單獨移除的標籤（手機版看不到全部欄位，靠這排標籤掌握目前條件）
const ADV_CHIP_GROUPS = [
  { field: 'weekdays', icon: 'mdi-calendar-week', label: (v) => `星期${ADV_DOW_LABELS[v]}` },
  { field: 'timeSlots', icon: 'mdi-clock-outline', label: (v) => v },
  { field: 'sources', icon: 'mdi-import', label: (v) => v },
  { field: 'checkInStatuses', icon: 'mdi-account-check-outline', label: (v) => v },
  { field: 'inspectors', icon: 'mdi-account-hard-hat', label: (v) => v },
  { field: 'companies', icon: 'mdi-domain', label: (v) => v },
  { field: 'buildings', icon: 'mdi-office-building-outline', label: (v) => `${v} 棟` },
];
const activeAdvChips = computed(() => {
  const chips = [];
  if (advFilters.keyword && advFilters.keyword.trim()) {
    chips.push({ id: 'keyword', field: 'keyword', icon: 'mdi-magnify', text: `「${advFilters.keyword.trim()}」` });
  }
  for (const g of ADV_CHIP_GROUPS) {
    for (const v of advFilters[g.field]) {
      chips.push({ id: `${g.field}:${v}`, field: g.field, value: v, icon: g.icon, text: g.label(v) });
    }
  }
  if (advFilters.bookerName) {
    chips.push({ id: 'bookerName', field: 'bookerName', icon: 'mdi-account-outline', text: `預約人:${advFilters.bookerName}` });
  }
  if (advFilters.buyerName) {
    chips.push({ id: 'buyerName', field: 'buyerName', icon: 'mdi-account-star-outline', text: `買方:${advFilters.buyerName}` });
  }
  return chips;
});
function removeAdvChip(chip) {
  const current = advFilters[chip.field];
  if (Array.isArray(current)) {
    const i = current.indexOf(chip.value);
    if (i !== -1) current.splice(i, 1);
  } else {
    advFilters[chip.field] = '';
  }
}

// 時段字串正規化為 HH:mm（資料可能是「09:30」或含後綴文字）
function normalizeTimeSlotStr(raw) {
  const s = raw ? String(raw) : '';
  const m = s.match(/(\d{1,2}[:：]\d{2})/);
  return m ? m[0].replace(/：/g, ':') : s;
}
// 驗屋人員：陣列或分隔字串 → 姓名陣列
function splitInspectors(raw) {
  const list = Array.isArray(raw) ? raw : String(raw || '').split(/[,、，;；/]+/);
  return list.map(s => String(s).trim()).filter(Boolean);
}

const zhOptSort = (arr) => arr.sort((a, b) => String(a).localeCompare(String(b), 'zh-Hant', { numeric: true, sensitivity: 'base' }));
const collectAdvOption = (getter, { withEmpty = false } = {}) => {
  const set = new Set();
  let hasEmpty = false;
  listExportItems.value.forEach(item => {
    const v = getter(item);
    if (v === null || v === undefined || v === '') { hasEmpty = true; return; }
    set.add(String(v));
  });
  const list = zhOptSort(Array.from(set));
  if (withEmpty && hasEmpty) list.push(ADV_EMPTY_OPTION);
  return list;
};
const advTimeSlotOptions = computed(() => collectAdvOption(i => normalizeTimeSlotStr(i.appointmentTimeSlot)).sort());
const advCheckInOptions = computed(() => collectAdvOption(i => i.checkInStatus, { withEmpty: true }));
const advCompanyOptions = computed(() => collectAdvOption(i => i.inspectionCompanyName, { withEmpty: true }));
const advBuildingOptions = computed(() => collectAdvOption(i => i.building));
const advInspectorOptions = computed(() => {
  const set = new Set();
  listExportItems.value.forEach(i => splitInspectors(i.inspectors).forEach(n => set.add(n)));
  return zhOptSort(Array.from(set));
});

// 全域關鍵字搜尋用：把事件依可匯出欄位攤平成文字（與下載EXCEL(列表)的搜尋範圍一致）
function advCellText(evt, key) {
  if (key.startsWith('dyn:')) {
    const v = evt.bookingMethodDetails?.[key.slice(4)];
    if (v === null || v === undefined) return '';
    return Array.isArray(v) ? v.join('、') : String(v);
  }
  switch (key) {
    case 'date': return evt.start ? format(evt.start, 'yyyy-MM-dd') : '';
    case 'weekday': return evt.start ? `星期${ADV_DOW_LABELS[evt.start.getDay()]}` : '';
    case 'appointmentTimeSlot': return normalizeTimeSlotStr(evt.appointmentTimeSlot);
    case 'inspectors': return splitInspectors(evt.inspectors).join('、');
    case 'salesperson': return formatSalespersons(evt.salesperson, '、', '');
    case 'source': return resolveSourceKey(evt.source) === 'admin' ? '後台新增' : '前台預約';
  }
  const value = evt[key];
  if (value === null || value === undefined) return '';
  if (Array.isArray(value)) return value.join('、');
  if (typeof value === 'object') return '';
  return String(value);
}

const advMatchEmptyable = (selected, value) => {
  if (selected.length === 0) return true;
  const isEmpty = value === null || value === undefined || value === '';
  return selected.includes(String(value)) || (selected.includes(ADV_EMPTY_OPTION) && isEmpty);
};

function matchesAdvFilters(evt) {
  const f = advFilters;
  if (f.weekdays.length > 0 && (!evt.start || !f.weekdays.includes(evt.start.getDay()))) return false;
  if (f.timeSlots.length > 0 && !f.timeSlots.includes(normalizeTimeSlotStr(evt.appointmentTimeSlot))) return false;
  if (f.sources.length > 0) {
    const label = resolveSourceKey(evt.source) === 'admin' ? '後台新增' : '前台預約';
    if (!f.sources.includes(label)) return false;
  }
  if (!advMatchEmptyable(f.checkInStatuses, evt.checkInStatus)) return false;
  if (!advMatchEmptyable(f.companies, evt.inspectionCompanyName)) return false;
  if (f.buildings.length > 0 && !f.buildings.includes(String(evt.building ?? ''))) return false;
  if (f.inspectors.length > 0) {
    const list = splitInspectors(evt.inspectors);
    if (!list.some(n => f.inspectors.includes(n))) return false;
  }
  if (f.bookerName && !(evt.bookerName || '').includes(f.bookerName)) return false;
  if (f.buyerName && !(evt.buyerName || '').includes(f.buyerName)) return false;
  const kwTokens = (f.keyword || '').trim().toLowerCase().split(/\s+/).filter(Boolean);
  if (kwTokens.length > 0) {
    const blob = listExportColumns.value.map(c => advCellText(evt, c.key)).join(' ').toLowerCase();
    if (!kwTokens.every(tk => blob.includes(tk))) return false;
  }
  return true;
}

// 下載EXCEL(列表)：日期區間預設與時間表目前檢視範圍同步
const listExportRangeStart = computed(() => (startDate.value ? format(startDate.value, 'yyyy-MM-dd') : null));
const listExportRangeEnd = computed(() => (endDate.value ? format(endDate.value, 'yyyy-MM-dd') : null));

// 對話框調整日期區間時，載入該區間的預約資料並合併進 allAppointments
// （時間表僅載入目前檢視範圍，超出範圍的日期需在此補抓，否則匯出會缺資料）
const isListExportFetching = ref(false);
async function handleListExportFetchRange({ start, end }) {
  if (!start || !end || start > end) return;
  isListExportFetching.value = true;
  try {
    const result = await inspectionApi('fetchCalendarData', {
      projectId: projectId.value,
      startDate: parseISO(`${start}T00:00:00`),
      endDate: parseISO(`${end}T23:59:59`),
    });
    if (result.data && Array.isArray(result.data)) {
      const appointmentsWithDates = result.data.map(appt => convertFirestoreTimestampsToDates(appt));
      const appointmentsMap = new Map(allAppointments.value.map(item => [item.id, item]));
      appointmentsWithDates.forEach(item => appointmentsMap.set(item.id, item));
      allAppointments.value = Array.from(appointmentsMap.values());
    }
  } catch (err) {
    console.error('載入匯出日期區間資料失敗:', err);
    showSnackbar(`載入日期區間資料失敗: ${err.message}`, 'error');
  } finally {
    isListExportFetching.value = false;
  }
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
// 時間表事件底色設定：依「來源」再依「預約項目類型」分別設定。
// 結構：{ admin: { 類型: hex }, bookingPage: { 類型: hex } }
//  - admin       → 後台新增（appointment.source === 'admin'）
//  - bookingPage  → 前台預約（其餘皆視為前台，含舊資料無 source）
// 本機儲存、依建案區分，由使用者在「篩選設定」中自訂；未設色者沿用系統預設配色。
const SOURCE_KEYS = [
  { key: 'admin', label: '後台新增' },
  { key: 'bookingPage', label: '前台預約' },
];
// 明確標記 'admin' 才算後台；其餘（含 'bookingPage' 與舊資料 undefined）一律視為前台
function resolveSourceKey(source) {
  return source === 'admin' ? 'admin' : 'bookingPage';
}
// 事件顏色設定改為「資料庫共用」：讀取自 projects 文件、寫入需「驗屋預約管理-修改」權限。
// 本地 ref 為編輯/顯示用的工作副本；按下「儲存」才寫回資料庫並套用給所有使用者。
// adminBorder / bookingPageBorder 為各來源的「邊框顏色」對照表（選填，與底色獨立）。
const bookingTypeColorMap = ref({ admin: {}, bookingPage: {}, adminBorder: {}, bookingPageBorder: {} });
// 顏色規則：[{ conditions:[{ field, matchMode:'contains'|'empty', keyword }], color, borderColor }]
// 由上而下第一個符合的規則生效；同一規則內可有多個條件，「全部條件都符合」才算符合（AND）
//  - contains：欄位內容包含關鍵字（field 可為 '*' 任一欄位）
//  - empty：欄位值為空（須指定特定欄位）
// 舊格式（單一 field/matchMode/keyword 直接放在規則層）會於 normalize 時自動轉為單條件規則
const keywordColorRules = ref([]);
// 關鍵字/空值規則 vs 預約項目類型 的優先層級：'type'（預設，項目類型優先）或 'keyword'
const keywordPriority = ref('type');
const colorSettingsDirty = ref(false); // 是否有未儲存的變更
const isSavingColors = ref(false);

function normalizeColorSettings(raw) {
  const pick = (m) => (m && typeof m === 'object' ? { ...m } : {});
  return {
    admin: pick(raw?.admin),
    bookingPage: pick(raw?.bookingPage),
    adminBorder: pick(raw?.adminBorder),
    bookingPageBorder: pick(raw?.bookingPageBorder),
  };
}
function normalizeRuleConditions(r) {
  // 新格式取 conditions 陣列；舊格式（field 在規則層）視為單一條件
  const src = Array.isArray(r?.conditions) && r.conditions.length ? r.conditions : [r];
  return src
    .filter(c => c && typeof c === 'object' && typeof c.field === 'string' && c.field)
    .map(c => ({
      field: c.field,
      matchMode: c.matchMode === 'empty' ? 'empty' : 'contains',
      keyword: typeof c.keyword === 'string' ? c.keyword : '',
    }));
}
function normalizeKeywordRules(raw) {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter(r => r && typeof r === 'object')
    .map(r => ({
      conditions: normalizeRuleConditions(r),
      color: typeof r.color === 'string' ? r.color : '',
      borderColor: typeof r.borderColor === 'string' ? r.borderColor : '',
    }))
    .filter(r => r.conditions.length);
}
// 從已載入的建案設定同步顏色；除非 force，否則不覆蓋尚未儲存的編輯
function syncColorSettingsFromProject(force = false) {
  if (colorSettingsDirty.value && !force) return;
  const raw = projectSettings.value?.eventColorSettings;
  bookingTypeColorMap.value = normalizeColorSettings(raw);
  keywordColorRules.value = normalizeKeywordRules(raw?.keywordRules);
  keywordPriority.value = raw?.keywordPriority === 'keyword' ? 'keyword' : 'type';
  colorSettingsDirty.value = false;
}
function getTypeColor(srcKey, typeName) {
  return bookingTypeColorMap.value?.[srcKey]?.[typeName] || '';
}
function getTypeBorder(srcKey, typeName) {
  return bookingTypeColorMap.value?.[`${srcKey}Border`]?.[typeName] || '';
}
function setTypeColor(srcKey, typeName, color) {
  if (!srcKey || !typeName || !color) return;
  const cur = bookingTypeColorMap.value || {};
  bookingTypeColorMap.value = {
    ...cur,
    [srcKey]: { ...(cur[srcKey] || {}), [typeName]: color },
  };
  colorSettingsDirty.value = true;
}
function setTypeBorder(srcKey, typeName, color) {
  if (!srcKey || !typeName || !color) return;
  const mapKey = `${srcKey}Border`;
  const cur = bookingTypeColorMap.value || {};
  bookingTypeColorMap.value = {
    ...cur,
    [mapKey]: { ...(cur[mapKey] || {}), [typeName]: color },
  };
  colorSettingsDirty.value = true;
}
function clearTypeBorder(srcKey, typeName) {
  const mapKey = `${srcKey}Border`;
  const cur = bookingTypeColorMap.value || {};
  const sub = { ...(cur[mapKey] || {}) };
  delete sub[typeName];
  bookingTypeColorMap.value = { ...cur, [mapKey]: sub };
  colorSettingsDirty.value = true;
}
function clearTypeColor(srcKey, typeName) {
  // 清除該來源此類型的底色與邊框色
  const cur = bookingTypeColorMap.value || {};
  const sub = { ...(cur[srcKey] || {}) };
  delete sub[typeName];
  const borderKey = `${srcKey}Border`;
  const borderSub = { ...(cur[borderKey] || {}) };
  delete borderSub[typeName];
  bookingTypeColorMap.value = { ...cur, [srcKey]: sub, [borderKey]: borderSub };
  colorSettingsDirty.value = true;
}
function clearAllTypeColors() {
  bookingTypeColorMap.value = { admin: {}, bookingPage: {}, adminBorder: {}, bookingPageBorder: {} };
  colorSettingsDirty.value = true;
}
// --- 關鍵字顏色規則操作 ---
// 規則可選的欄位：任一欄位 + 全部「標題顯示」欄位；若既有規則的欄位已失效，仍列出讓使用者辨識
const keywordFieldOptions = computed(() => {
  const opts = [{ key: '*', label: '任一欄位' }, ...displayFieldOptions.value.map(f => ({ key: f.key, label: f.label }))];
  const known = new Set(opts.map(o => o.key));
  for (const rule of keywordColorRules.value) {
    for (const cond of (rule.conditions || [])) {
      if (cond.field && !known.has(cond.field)) {
        known.add(cond.field);
        opts.push({ key: cond.field, label: `${cond.field}（欄位已移除）` });
      }
    }
  }
  return opts;
});
function addKeywordRule() {
  keywordColorRules.value = [...keywordColorRules.value, {
    conditions: [{ field: '*', matchMode: 'contains', keyword: '' }],
    color: '#FFF59D', borderColor: '',
  }];
  colorSettingsDirty.value = true;
}
function updateKeywordRule(index, patch) {
  const rules = [...keywordColorRules.value];
  if (!rules[index]) return;
  rules[index] = { ...rules[index], ...patch };
  keywordColorRules.value = rules;
  colorSettingsDirty.value = true;
}
// --- 規則內的條件操作（一項規則可有多個條件，全部符合才套用） ---
function addRuleCondition(ruleIdx) {
  const rule = keywordColorRules.value[ruleIdx];
  if (!rule) return;
  updateKeywordRule(ruleIdx, { conditions: [...(rule.conditions || []), { field: '*', matchMode: 'contains', keyword: '' }] });
}
function removeRuleCondition(ruleIdx, condIdx) {
  const rule = keywordColorRules.value[ruleIdx];
  if (!rule || (rule.conditions || []).length <= 1) return; // 至少保留一個條件
  updateKeywordRule(ruleIdx, { conditions: rule.conditions.filter((_, i) => i !== condIdx) });
}
function updateRuleCondition(ruleIdx, condIdx, patch) {
  const rule = keywordColorRules.value[ruleIdx];
  if (!rule || !rule.conditions?.[condIdx]) return;
  const conditions = [...rule.conditions];
  conditions[condIdx] = { ...conditions[condIdx], ...patch };
  updateKeywordRule(ruleIdx, { conditions });
}
// 切換比對方式；改成「欄位為空值」時，欄位不可為「任一欄位」，自動改選第一個具體欄位
function setRuleConditionMatchMode(ruleIdx, condIdx, mode) {
  const cond = keywordColorRules.value[ruleIdx]?.conditions?.[condIdx];
  if (!cond) return;
  const patch = { matchMode: mode === 'empty' ? 'empty' : 'contains' };
  if (patch.matchMode === 'empty' && (!cond.field || cond.field === '*')) {
    const firstField = keywordFieldOptions.value.find(o => o.key !== '*');
    if (firstField) patch.field = firstField.key;
  }
  updateRuleCondition(ruleIdx, condIdx, patch);
}
function keywordFieldLabel(key) {
  return keywordFieldOptions.value.find(o => o.key === key)?.label || key || '欄位';
}
// 規則摘要（預覽 chip 用）：各條件以「＋」串接
function ruleSummary(rule) {
  const parts = (rule.conditions || []).map(c =>
    c.matchMode === 'empty' ? `${keywordFieldLabel(c.field)}為空` : (c.keyword || '…')
  );
  return parts.join('＋') || '預覽';
}
function removeKeywordRule(index) {
  keywordColorRules.value = keywordColorRules.value.filter((_, i) => i !== index);
  colorSettingsDirty.value = true;
}
function moveKeywordRule(index, delta) {
  const target = index + delta;
  const rules = [...keywordColorRules.value];
  if (!rules[index] || target < 0 || target >= rules.length) return;
  [rules[index], rules[target]] = [rules[target], rules[index]];
  keywordColorRules.value = rules;
  colorSettingsDirty.value = true;
}
function setKeywordPriority(value) {
  if (!value) return;
  keywordPriority.value = value === 'keyword' ? 'keyword' : 'type';
  colorSettingsDirty.value = true;
}
// 取得規則要比對的欄位文字（'*' 表任一標題顯示欄位）
function getRuleFieldText(event, field) {
  if (field === '*') {
    return displayFieldOptions.value.map(f => getFieldValue(event, f)).filter(Boolean).join(' ');
  }
  const opt = displayFieldOptions.value.find(f => f.key === field);
  if (opt) return getFieldValue(event, opt) ?? '';
  // 欄位定義已移除時的退路：先找靜態欄位，再找動態欄位
  return event[field] ?? event.bookingMethodDetails?.[field] ?? '';
}
// 單一條件是否符合（含關鍵字 / 欄位為空值）
function ruleConditionMatches(event, cond) {
  if (cond.matchMode === 'empty') {
    // 空值條件須指定特定欄位（「任一欄位」為空無意義）
    if (!cond.field || cond.field === '*') return false;
    return String(getRuleFieldText(event, cond.field) ?? '').trim() === '';
  }
  if (!cond.keyword) return false;
  return String(getRuleFieldText(event, cond.field)).includes(cond.keyword);
}
// 依顏色規則比對事件，回傳第一個「全部條件皆符合」的規則；無符合回傳 null
function matchKeywordRule(event) {
  for (const rule of keywordColorRules.value) {
    if (!rule.color && !rule.borderColor) continue;
    const conds = rule.conditions || [];
    if (!conds.length) continue;
    if (conds.every(c => ruleConditionMatches(event, c))) return rule;
  }
  return null;
}
// 兩組可辨識的建議色票：前台偏冷色淺底、後台偏暖色淺底，方便一眼分辨來源
const PALETTE_BOOKINGPAGE = ['#E3F2FD', '#E1F5FE', '#E0F7FA', '#E8F5E9', '#F1F8E9', '#EDE7F6', '#E8EAF6', '#E0F2F1'];
const PALETTE_ADMIN = ['#FFF3E0', '#FFEBEE', '#FCE4EC', '#FFF8E1', '#FBE9E7', '#FFFDE7', '#F3E5F5', '#EFEBE9'];
function applyDefaultTypeColors() {
  const adminMap = {};
  const pageMap = {};
  currentTypeOptions.value.forEach((t, i) => {
    pageMap[t] = PALETTE_BOOKINGPAGE[i % PALETTE_BOOKINGPAGE.length];
    adminMap[t] = PALETTE_ADMIN[i % PALETTE_ADMIN.length];
  });
  // 只套用建議底色，保留使用者已設定的邊框色
  bookingTypeColorMap.value = { ...bookingTypeColorMap.value, admin: adminMap, bookingPage: pageMap };
  colorSettingsDirty.value = true;
}
// 儲存到資料庫（共用、套用給所有使用者）；僅具「驗屋預約管理-修改」權限者可用
async function saveEventColorSettings() {
  if (!canEdit.value) {
    snackbarText.value = '您沒有「驗屋預約管理-修改」權限，無法儲存事件顏色。';
    snackbar.value = true;
    return;
  }
  isSavingColors.value = true;
  try {
    const payload = {
      ...normalizeColorSettings(bookingTypeColorMap.value),
      keywordRules: normalizeKeywordRules(keywordColorRules.value)
        .map(r => ({
          ...r,
          // 只保留完整的條件（含關鍵字需有關鍵字；空值需指定具體欄位）
          conditions: r.conditions.filter(c =>
            c.matchMode === 'empty' ? (c.field && c.field !== '*') : c.keyword
          ),
        }))
        .filter(r => (r.color || r.borderColor) && r.conditions.length),
      keywordPriority: keywordPriority.value === 'keyword' ? 'keyword' : 'type',
    };
    const res = await inspectionApi('saveEventColorSettings', {
      projectId: projectId.value,
      userKey: userStore.user?.key,
      eventColorSettings: payload,
    });
    const savedRaw = res?.data?.eventColorSettings || payload;
    const saved = {
      ...normalizeColorSettings(savedRaw),
      keywordRules: normalizeKeywordRules(savedRaw?.keywordRules),
      keywordPriority: savedRaw?.keywordPriority === 'keyword' ? 'keyword' : 'type',
    };
    bookingTypeColorMap.value = {
      admin: saved.admin,
      bookingPage: saved.bookingPage,
      adminBorder: saved.adminBorder,
      bookingPageBorder: saved.bookingPageBorder,
    };
    keywordColorRules.value = saved.keywordRules;
    keywordPriority.value = saved.keywordPriority;
    if (projectSettings.value) projectSettings.value.eventColorSettings = saved;
    colorSettingsDirty.value = false;
    snackbarText.value = '事件顏色已儲存，並套用給所有使用者。';
    snackbar.value = true;
  } catch (err) {
    console.error('儲存事件顏色失敗:', err);
    snackbarText.value = `儲存失敗：${err?.message || '未知錯誤'}`;
    snackbar.value = true;
  } finally {
    isSavingColors.value = false;
  }
}
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
         isFilterDialogVisible.value ||
         isAdvFilterDialogVisible.value ||
         isStatisticsDialogVisible.value ||
         isPivotDialogVisible.value ||
         isListExportDialogVisible.value ||
         isPngPreviewVisible.value ||
         isLeaveManagerVisible.value;
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

// 以台灣時間 (Asia/Taipei) 取得 yyyy-MM-dd 日期字串：
// 預約日期的「屬於哪一天」一律以台灣時間為準，不受瀏覽器所在時區影響
const TAIPEI_DATE_FMT = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Asia/Taipei', year: 'numeric', month: '2-digit', day: '2-digit',
});
function toTaipeiDateStr(date) {
  return TAIPEI_DATE_FMT.format(date); // en-CA 輸出即為 yyyy-MM-dd
}

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

        // 一律以台灣時間判定日期，避免瀏覽器時區不同造成日期偏移
        const dateStr = toTaipeiDateStr(date);

        const timeSlotString = combinedData.appointmentTimeSlot ? String(combinedData.appointmentTimeSlot) : '';
        const timeMatch = timeSlotString.match(/(\d{1,2}[:：]\d{2})/); 
        const startTime = timeMatch ? timeMatch[0].replace(/：/g, ':') : '00:00';
        
        // 驗屋人員與備註改以獨立醒目區塊呈現（highlightParts），不再混入串接文字
        const displayParts = [];
        const highlightParts = [];
        displayFieldOptions.value
          .filter(option => selectedDisplayFields.value.includes(option.key))
          .forEach(option => {
            const value = getFieldValue(combinedData, option); // ✅ 使用輔助函式取值（支援動態欄位）
            if (value === null || value === undefined || value === '') return; // 修正：允許 0

            // ✅ 修正：確保日期被正確格式化
            const text = (value instanceof Date)
              ? safeFormatDate(value, 'yyyy-MM-dd')
              : String(value);

            if (HIGHLIGHT_FIELD_META[option.key]) {
              if (option.key === 'inspectors') {
                // 標註每位人員的排休狀態：排休者顯示「小明(休假)」並於畫面高亮提醒
                const persons = annotateInspectorPersons(value, inspectorLeaveMap.value, dateStr, startTime);
                highlightParts.push({ kind: option.key, text: persons.map(p => p.label).join(','), persons });
              } else {
                highlightParts.push({ kind: option.key, text });
              }
              return;
            }

            const formattedValue = option.formatter ? option.formatter(value) : text;
            displayParts.push({ text: formattedValue, isHousehold: option.key === 'unitId' });
          });

        const finalStartObject = parseISO(`${dateStr}T${startTime}`);

        if (isNaN(finalStartObject.getTime())) {
          console.warn('產生無效的日期物件，已略過此筆預約:', combinedData);
          return null;
        }

        return { ...combinedData, start: finalStartObject, displayParts, highlightParts };

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
  const processed = processAppointments(filteredAppts);

  // 3. 進階篩選（關鍵字/星期/時段/來源/報到狀態/人員等；需合併戶別資料後才過濾）
  if (advFilterCount.value === 0) return processed;
  return processed.filter(matchesAdvFilters);
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
        // 單行日期標題（8/10(一)），較兩行「星期一 / 8/10」省列高
        dateLabel: `${format(date, 'M/d')}(${'日一二三四五六'[date.getDay()]})`,
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

// --- 手機版行事曆式視圖（日期橫條 + 當日行程） ---
// smAndDown：手機與小平板；篩選對話框在此區間改為全螢幕版型（與底部導覽列 d-md-none 的斷點一致）
const { xs, smAndDown } = useDisplay();
const selectedMobileDate = ref('');

const mobileDates = computed(() => {
  if (!startDate.value || !endDate.value) return [];
  try {
    return eachDayOfInterval({ start: startDate.value, end: endDate.value }).map(d => {
      const key = format(d, 'yyyy-MM-dd');
      const slots = groupedEvents.value[key] || {};
      const count = Object.values(slots).reduce((sum, arr) => sum + arr.length, 0);
      return {
        key,
        dowLabel: '日一二三四五六'[d.getDay()],
        dateLabel: format(d, 'M/d'),
        isToday: isToday(d),
        isWeekend: isSaturday(d) || isSunday(d),
        count,
      };
    });
  } catch (e) {
    return [];
  }
});

// 日期範圍變動時，維持選取日；不在範圍內則優先選今天，否則選第一天
watch(mobileDates, (days) => {
  if (!days.length) { selectedMobileDate.value = ''; return; }
  if (days.some(d => d.key === selectedMobileDate.value)) return;
  const today = days.find(d => d.isToday);
  selectedMobileDate.value = (today || days[0]).key;
}, { immediate: true });

// 選定日期後，讓日期橫條自動捲動到該日期
watch(selectedMobileDate, async (key) => {
  if (!key) return;
  await nextTick();
  const el = document.querySelector(`.mobile-date-pill[data-datekey="${key}"]`);
  if (el && el.scrollIntoView) el.scrollIntoView({ inline: 'center', block: 'nearest', behavior: 'smooth' });
});

const selectedMobileDateLabel = computed(() => {
  if (!selectedMobileDate.value) return '';
  try {
    return format(parseISO(selectedMobileDate.value), 'M月d日 EEEE', { locale: zhTW });
  } catch (e) {
    return selectedMobileDate.value;
  }
});

function slotsForDate(dateKey) {
  const daySlots = groupedEvents.value[dateKey] || {};
  return timeSlots.value
    .filter(t => (daySlots[t] || []).length > 0)
    .map(t => ({ time: t, events: daySlots[t] }));
}

const mobileSlotsForSelectedDay = computed(() => slotsForDate(selectedMobileDate.value));

const mobileSelectedDayCount = computed(() =>
  mobileSlotsForSelectedDay.value.reduce((sum, s) => sum + s.events.length, 0)
);

const mobileTotalCount = computed(() =>
  mobileDates.value.reduce((sum, d) => sum + d.count, 0)
);

// --- 日 / 週 / 月 檢視模式 ---
const mobileViewMode = ref('day'); // day | week | month

function setRange(start, end) {
  dateRange.value = [start, end]; // watch(dateRange) 會同步 startDate / endDate 並觸發抓資料
}

// --- 日期選擇器：起/迄顯示標籤與快速區間 ---
function formatRangeLabel(d) {
  if (!d) return '選擇日期';
  const date = d instanceof Date ? d : new Date(d);
  if (isNaN(date.getTime())) return '選擇日期';
  return `${format(date, 'yyyy/MM/dd')}（${format(date, 'EEEEE', { locale: zhTW })}）`;
}
const rangeStartLabel = computed(() => formatRangeLabel(dateRange.value?.[0]));
const rangeEndLabel = computed(() => formatRangeLabel(dateRange.value?.[1] ?? dateRange.value?.[0]));
// 快速區間：超出可選範圍的部分自動夾在 min/max 內；完全超出者不顯示
function clampPresetRange(start, end) {
  const min = minSelectableDate.value ? new Date(minSelectableDate.value) : null;
  const max = maxSelectableDate.value ? new Date(maxSelectableDate.value) : null;
  let s = start, e = end;
  if (min && e < min) return null;
  if (max && s > max) return null;
  if (min && s < min) s = min;
  if (max && e > max) e = max;
  return [s, e];
}
const datePresets = computed(() => {
  const today = new Date();
  const raw = [
    { label: '今天', range: [today, today] },
    { label: '本週', range: [startOfWeek(today, { weekStartsOn: 1 }), endOfWeek(today, { weekStartsOn: 1 })] },
    { label: '下週', range: [startOfWeek(addDays(today, 7), { weekStartsOn: 1 }), endOfWeek(addDays(today, 7), { weekStartsOn: 1 })] },
    { label: '本月', range: [startOfMonth(today), endOfMonth(today)] },
    { label: '下月', range: [startOfMonth(addMonths(today, 1)), endOfMonth(addMonths(today, 1))] },
  ];
  return raw
    .map(p => {
      const clamped = clampPresetRange(p.range[0], p.range[1]);
      return clamped ? { label: p.label, value: clamped } : null;
    })
    .filter(Boolean);
});

function mobileAnchorDate() {
  if (selectedMobileDate.value) {
    const d = parseISO(selectedMobileDate.value);
    if (!isNaN(d.getTime())) return d;
  }
  return startDate.value || new Date();
}

function setMobileViewMode(mode) {
  if (mobileViewMode.value === mode) return;
  mobileViewMode.value = mode;
  const anchor = mobileAnchorDate();
  if (mode === 'month') {
    setRange(startOfMonth(anchor), endOfMonth(anchor));
  } else {
    setRange(startOfWeek(anchor, { weekStartsOn: 1 }), endOfWeek(anchor, { weekStartsOn: 1 }));
  }
}

// --- 桌機 日 / 週 / 月 檢視模式 ---
const desktopViewMode = ref('week'); // day | week | month

function applyDesktopRange(anchor) {
  if (desktopViewMode.value === 'day') {
    setRange(anchor, anchor);
  } else if (desktopViewMode.value === 'month') {
    setRange(startOfMonth(anchor), endOfMonth(anchor));
  } else {
    setRange(startOfWeek(anchor, { weekStartsOn: 1 }), endOfWeek(anchor, { weekStartsOn: 1 }));
  }
}

function setDesktopViewMode(mode) {
  if (desktopViewMode.value === mode) return;
  desktopViewMode.value = mode;
  applyDesktopRange(startDate.value || new Date());
}

// 桌機 ‹ ›：依檢視模式切換上一/下一 日、週、月
function shiftDesktopRange(delta) {
  const anchor = startDate.value || new Date();
  let next;
  if (desktopViewMode.value === 'day') next = addDays(anchor, delta);
  else if (desktopViewMode.value === 'month') next = addMonths(anchor, delta);
  else next = addDays(anchor, delta * 7);
  applyDesktopRange(next);
}

// 手機 ‹ ›：日模式切上一/下一日（跨週自動換範圍）、週模式切上一/下一週、月模式切月份
function shiftMobile(delta) {
  if (mobileViewMode.value === 'month') {
    shiftMobileMonth(delta);
    return;
  }
  if (mobileViewMode.value === 'week') {
    if (!startDate.value || !endDate.value) return;
    setRange(addDays(startDate.value, delta * 7), addDays(endDate.value, delta * 7));
    return;
  }
  // 日模式
  const cur = selectedMobileDate.value ? parseISO(selectedMobileDate.value) : new Date();
  const next = addDays(cur, delta);
  if (startDate.value && endDate.value && (next < startDate.value || next > endDate.value)) {
    setRange(startOfWeek(next, { weekStartsOn: 1 }), endOfWeek(next, { weekStartsOn: 1 }));
  }
  selectedMobileDate.value = format(next, 'yyyy-MM-dd');
}

// 「今天」：把焦點快速切回今天（依目前檢視模式調整範圍；桌機並捲動到今天欄位）
function goToToday() {
  const today = new Date();
  if (xs.value) {
    if (mobileViewMode.value === 'month') {
      setRange(startOfMonth(today), endOfMonth(today));
    } else {
      setRange(startOfWeek(today, { weekStartsOn: 1 }), endOfWeek(today, { weekStartsOn: 1 }));
    }
  } else {
    applyDesktopRange(today);
  }
  selectedMobileDate.value = format(today, 'yyyy-MM-dd');
  nextTick(() => {
    const el = document.querySelector('#custom-calendar-container .day-header.today-column');
    if (el && el.scrollIntoView) el.scrollIntoView({ inline: 'center', block: 'nearest', behavior: 'smooth' });
  });
}

// --- 月檢視：月曆格 ---
const mobileMonthLabel = computed(() => (startDate.value ? format(startDate.value, 'yyyy年M月') : ''));

const mobileMonthCells = computed(() => {
  if (mobileViewMode.value !== 'month' || !startDate.value) return [];
  const monthStart = startOfMonth(startDate.value);
  const gridStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const gridEnd = endOfWeek(endOfMonth(monthStart), { weekStartsOn: 1 });
  return eachDayOfInterval({ start: gridStart, end: gridEnd }).map(d => {
    const key = format(d, 'yyyy-MM-dd');
    const slots = groupedEvents.value[key] || {};
    const count = Object.values(slots).reduce((sum, arr) => sum + arr.length, 0);
    return {
      key,
      dateNum: format(d, 'd'),
      inMonth: d.getMonth() === monthStart.getMonth(),
      isToday: isToday(d),
      isWeekend: isSaturday(d) || isSunday(d),
      count,
    };
  });
});

function shiftMobileMonth(delta) {
  const cur = startDate.value ? startOfMonth(startDate.value) : startOfMonth(new Date());
  const next = addMonths(cur, delta);
  setRange(startOfMonth(next), endOfMonth(next)); // 選取日由 watch(mobileDates) 自動修正（今天優先）
}

function pickMonthDate(cell) {
  if (!cell.inMonth) {
    const d = parseISO(cell.key);
    if (!isNaN(d.getTime())) setRange(startOfMonth(d), endOfMonth(d));
  }
  selectedMobileDate.value = cell.key;
}

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

// --- 資料透視：對目前日期區間的預約資料做靈活的交叉統計 ---
const isPivotDialogVisible = ref(false);
const pivotRowDim = ref('inspectors');     // 列維度
const pivotColDim = ref('none');           // 欄維度（'none' = 只算數量）
const PIVOT_EMPTY_LABEL = '（未填寫）';
const PIVOT_WEEKDAY_ORDER = ['星期一', '星期二', '星期三', '星期四', '星期五', '星期六', '星期日'];

// 可選維度：基礎欄位 + 動態自訂欄位（與「標題顯示」同源）
const pivotDimensionOptions = computed(() => {
  const base = [
    { key: 'bookingType', label: '預約項目' },
    { key: 'inspectionMethod', label: '選擇方式' },
    { key: 'bookingSubOption', label: '子項目' },
    { key: 'status', label: '狀態' },
    { key: 'inspectors', label: '驗屋人員（每人分計）' },
    { key: 'salesperson', label: '銷售人員（每人分計）' },
    { key: 'source', label: '來源' },
    { key: 'date', label: '日期' },
    { key: 'weekday', label: '星期' },
    { key: 'unitId', label: '戶別' },
    { key: 'bookerName', label: '預約人' },
  ];
  const dynamic = displayFieldOptions.value
    .filter(f => f.isDynamic)
    .map(f => ({ key: `dyn:${f.key}`, label: f.label }));
  return [...base, ...dynamic];
});
const pivotColDimOptions = computed(() => [
  { key: 'none', label: '（無，只計數量）' },
  ...pivotDimensionOptions.value.filter(o => o.key !== pivotRowDim.value),
]);
function pivotDimensionLabel(key) {
  return pivotDimensionOptions.value.find(o => o.key === key)?.label || key;
}
// 取得事件在某維度下的值（陣列；驗屋人員一筆可拆多人，各計一次）
function getPivotValues(evt, dimKey) {
  if (dimKey.startsWith('dyn:')) {
    const v = evt.bookingMethodDetails?.[dimKey.slice(4)];
    return (v === null || v === undefined || v === '') ? [PIVOT_EMPTY_LABEL] : [String(v)];
  }
  switch (dimKey) {
    case 'inspectors': {
      const raw = evt.inspectors;
      const list = Array.isArray(raw) ? raw : String(raw || '').split(/[,、，;；/]+/);
      const cleaned = list.map(s => String(s).trim()).filter(Boolean);
      return cleaned.length ? cleaned : [PIVOT_EMPTY_LABEL];
    }
    case 'salesperson': {
      const list = normalizeSalespersons(evt.salesperson);
      return list.length ? list : [PIVOT_EMPTY_LABEL];
    }
    case 'source':
      return [resolveSourceKey(evt.source) === 'admin' ? '後台新增' : '前台預約'];
    case 'date':
      return [evt.start ? format(evt.start, 'yyyy-MM-dd') : PIVOT_EMPTY_LABEL];
    case 'weekday':
      return [evt.start ? format(evt.start, 'EEEE', { locale: zhTW }) : PIVOT_EMPTY_LABEL];
    default: {
      const v = evt[dimKey];
      return (v === null || v === undefined || v === '') ? [PIVOT_EMPTY_LABEL] : [String(v)];
    }
  }
}
// 資料透視的狀態篩選：開啟對話框時預設帶入行事曆目前的狀態勾選，可在對話框內獨立調整
const PIVOT_STATUS_OPTIONS = ['預約中', '取消', '已完成'];
const pivotStatuses = ref([...PIVOT_STATUS_OPTIONS]);
watch(isPivotDialogVisible, (open) => {
  if (open) pivotStatuses.value = [...selectedStatuses.value];
});
// 分析資料來源：目前日期區間 + 行事曆的「項目/選擇方式」篩選 + 對話框內的狀態勾選
// （並以可見日期範圍再過濾一次，未顯示在行事曆網格上的預約一律不納入）
const pivotSourceEvents = computed(() => {
  const appts = allAppointments.value.filter(appt => {
    const statusMatch = pivotStatuses.value.includes(appt.status);
    const typeMatch = selectedTypes.value.includes(appt.bookingType);
    const methodMatch = selectedMethods.value.length === 0 || selectedMethods.value.includes(appt.inspectionMethod);
    return statusMatch && typeMatch && methodMatch;
  });
  const processed = processAppointments(appts);
  const s = startDate.value;
  const e = endDate.value;
  if (!s || !e) return processed;
  const sKey = format(s, 'yyyy-MM-dd');
  const eKey = format(e, 'yyyy-MM-dd');
  return processed.filter(ev => {
    if (!ev.start) return false;
    const k = format(ev.start, 'yyyy-MM-dd');
    return k >= sKey && k <= eKey;
  });
});
// 維度鍵值排序：日期/星期依序、其餘依數量多→少（同數量依筆劃/字典序）
function sortPivotKeys(keys, dimKey, getTotal) {
  if (dimKey === 'date') return [...keys].sort();
  if (dimKey === 'weekday') {
    return [...keys].sort((a, b) => PIVOT_WEEKDAY_ORDER.indexOf(a) - PIVOT_WEEKDAY_ORDER.indexOf(b));
  }
  return [...keys].sort((a, b) => (getTotal(b) - getTotal(a)) || a.localeCompare(b, 'zh-Hant'));
}
const pivotMatrix = computed(() => {
  const events = pivotSourceEvents.value;
  const rowDim = pivotRowDim.value;
  const colDim = pivotColDim.value;
  const useCol = colDim && colDim !== 'none';

  const rowMap = new Map();   // rowKey -> { total, cols: Map(colKey -> count) }
  const colTotals = new Map();
  let grandTotal = 0;

  for (const evt of events) {
    const rowVals = getPivotValues(evt, rowDim);
    const colVals = useCol ? getPivotValues(evt, colDim) : ['__count__'];
    for (const r of rowVals) {
      let row = rowMap.get(r);
      if (!row) { row = { total: 0, cols: new Map() }; rowMap.set(r, row); }
      for (const c of colVals) {
        row.cols.set(c, (row.cols.get(c) || 0) + 1);
        colTotals.set(c, (colTotals.get(c) || 0) + 1);
        row.total++;
        grandTotal++;
      }
    }
  }

  const rowKeys = sortPivotKeys([...rowMap.keys()], rowDim, k => rowMap.get(k).total);
  const colHeaders = useCol
    ? sortPivotKeys([...colTotals.keys()], colDim, k => colTotals.get(k) || 0)
    : ['數量'];
  const rows = rowKeys.map(name => {
    const row = rowMap.get(name);
    const counts = {};
    if (useCol) {
      for (const c of colHeaders) counts[c] = row.cols.get(c) || 0;
    } else {
      counts['數量'] = row.total;
    }
    return {
      name,
      counts,
      total: row.total,
      pct: grandTotal ? Math.round((row.total / grandTotal) * 1000) / 10 : 0,
    };
  });
  const totals = {};
  if (useCol) {
    for (const c of colHeaders) totals[c] = colTotals.get(c) || 0;
  } else {
    totals['數量'] = grandTotal;
  }
  return { rows, colHeaders, totals, grandTotal, useCol, eventCount: events.length };
});
// 列維度變更時，若與欄維度相同則重設欄維度，避免同維度交叉
watch(pivotRowDim, (newDim) => {
  if (newDim === pivotColDim.value) pivotColDim.value = 'none';
});
// 是否有「人次」計算（驗屋人員一筆多人會分別計入，總計會大於筆數）
const pivotHasPersonCount = computed(() =>
  pivotRowDim.value === 'inspectors' || pivotColDim.value === 'inspectors'
);
// --- 資料透視表欄位排序：點表頭切換 升冪 → 降冪 → 回復預設 ---
// key: '__name__'（列名稱欄）| '__total__'（總計/佔比欄）| 欄維度的各欄名
const pivotSort = ref({ key: null, dir: 'asc' });
watch([pivotRowDim, pivotColDim], () => {
  pivotSort.value = { key: null, dir: 'asc' };
});
function togglePivotSort(key) {
  if (pivotSort.value.key === key) {
    pivotSort.value = pivotSort.value.dir === 'asc'
      ? { key, dir: 'desc' }
      : { key: null, dir: 'asc' }; // 第三次點擊回復預設排序
  } else {
    // 名稱欄預設 A→Z，數值欄預設大→小
    pivotSort.value = { key, dir: key === '__name__' ? 'asc' : 'desc' };
  }
}
function pivotSortIcon(key) {
  if (pivotSort.value.key !== key) return 'mdi-unfold-more-horizontal';
  return pivotSort.value.dir === 'asc' ? 'mdi-arrow-up' : 'mdi-arrow-down';
}
const sortedPivotRows = computed(() => {
  const { key, dir } = pivotSort.value;
  const rows = pivotMatrix.value.rows;
  if (!key) return rows;
  const mul = dir === 'asc' ? 1 : -1;
  return [...rows].sort((a, b) => {
    if (key === '__name__') {
      const rowDim = pivotRowDim.value;
      if (rowDim === 'weekday') {
        return (PIVOT_WEEKDAY_ORDER.indexOf(a.name) - PIVOT_WEEKDAY_ORDER.indexOf(b.name)) * mul;
      }
      // 日期為 yyyy-MM-dd 字串，字典序即時間序
      return a.name.localeCompare(b.name, 'zh-Hant') * mul;
    }
    const av = key === '__total__' ? a.total : (a.counts[key] || 0);
    const bv = key === '__total__' ? b.total : (b.counts[key] || 0);
    return ((av - bv) * mul) || a.name.localeCompare(b.name, 'zh-Hant');
  });
});
// 將目前資料透視表複製為 TSV（可直接貼進 Excel / Google Sheets）
function copyPivotTable() {
  const m = pivotMatrix.value;
  const lines = [];
  lines.push([
    pivotDimensionLabel(pivotRowDim.value),
    ...(m.useCol ? m.colHeaders : ['數量']),
    '總計', '佔比',
  ].join('\t'));
  for (const row of sortedPivotRows.value) {
    lines.push([
      row.name,
      ...m.colHeaders.map(c => row.counts[c] || 0),
      row.total, `${row.pct}%`,
    ].join('\t'));
  }
  lines.push(['總計', ...m.colHeaders.map(c => m.totals[c] || 0), m.grandTotal, '100%'].join('\t'));
  handleCopy(lines.join('\n'));
}

// 讀取目前日期範圍的驗屋人員排休（供事件人員標籤與詳細資訊 chips 標記）
async function fetchInspectorLeavesData() {
  if (!projectId.value || !startDate.value || !endDate.value) return;
  try {
    const res = await inspectionApi('fetchInspectorLeaves', {
      projectId: projectId.value,
      startDate: format(startDate.value, 'yyyy-MM-dd'),
      endDate: format(endDate.value, 'yyyy-MM-dd'),
    });
    inspectorLeaveRecords.value = res.data?.data || [];
  } catch (err) {
    console.warn('讀取驗屋人員排休失敗:', err);
  }
}

// 讀取目前日期範圍的行事曆備註（顯示於時間表日期標題下一列）
async function fetchCalendarNotesData() {
  if (!projectId.value || !startDate.value || !endDate.value) return;
  try {
    const res = await inspectionApi('fetchCalendarNotes', {
      projectId: projectId.value,
      startDate: format(startDate.value, 'yyyy-MM-dd'),
      endDate: format(endDate.value, 'yyyy-MM-dd'),
    });
    calendarNoteRecords.value = res.data?.data || [];
  } catch (err) {
    console.warn('讀取行事曆備註失敗:', err);
  }
}

// 讀取目前日期範圍的每日名額摘要（顯示於時間表日期標題下方第一列）
async function fetchDailyQuotaData() {
  if (!projectId.value || !startDate.value || !endDate.value) return;
  try {
    const res = await inspectionApi('fetchDailyQuotaSummary', {
      projectId: projectId.value,
      startDate: format(startDate.value, 'yyyy-MM-dd'),
      endDate: format(endDate.value, 'yyyy-MM-dd'),
    });
    dailyQuotaByDate.value = res.data?.data || {};
  } catch (err) {
    console.warn('讀取每日名額摘要失敗:', err);
  }
}

// 該週（chunk）是否有任何名額資料 → 決定是否顯示名額摘要列
function chunkHasQuota(chunk) {
  return (chunk || []).some(day => day.isInRange && (dailyQuotaByDate.value[day.fullDate] || []).length > 0);
}

// 該日全部項目加總（顯示於摘要列最上方）
function quotaDayTotal(dateKey) {
  const rows = dailyQuotaByDate.value[dateKey] || [];
  return rows.reduce((acc, r) => {
    acc.capacity += r.capacity || 0;
    acc.booked += r.booked || 0;
    return acc;
  }, { capacity: 0, booked: 0 });
}

// 進度條寬度百分比（已約 / 總名額）
function quotaPercent(row) {
  if (!row.capacity) return row.booked > 0 ? 100 : 0;
  return Math.min(Math.round((row.booked / row.capacity) * 100), 100);
}

// 依剩餘名額決定顏色：額滿紅、剩 1–2 橘、其餘綠；未設名額（capacity=0）灰
function quotaColor(row) {
  if (!row.capacity) return '#90A4AE';
  const remaining = Math.max(row.capacity - row.booked, 0);
  if (remaining <= 0) return '#E53935';
  if (remaining <= 2) return '#FB8C00';
  return '#2E9E6B';
}

// --- 每日名額明細對話框（手機無 hover，改以點擊開啟） ---
const isQuotaDetailVisible = ref(false);
const quotaDetailDate = ref('');
const quotaDetailFocusLabel = ref('');
const quotaDetailRows = computed(() => {
  const rows = dailyQuotaByDate.value[quotaDetailDate.value] || [];
  // 被點選的項目排在最前面，其餘維持原順序
  if (!quotaDetailFocusLabel.value) return rows;
  return [...rows].sort((a, b) => {
    if (a.label === quotaDetailFocusLabel.value) return -1;
    if (b.label === quotaDetailFocusLabel.value) return 1;
    return 0;
  });
});
const quotaDetailDateLabel = computed(() => {
  if (!quotaDetailDate.value) return '';
  try {
    const d = parseISO(quotaDetailDate.value);
    return `${format(d, 'M/d')}(${'日一二三四五六'[d.getDay()]})`;
  } catch (e) {
    return quotaDetailDate.value;
  }
});
function openQuotaDetail(dateKey, focusLabel = '') {
  if (!dateKey) return;
  quotaDetailDate.value = dateKey;
  quotaDetailFocusLabel.value = focusLabel;
  isQuotaDetailVisible.value = true;
}

// tooltip 內方式名額文字：未設方式名額時顯示「共用」
function quotaMethodText(m) {
  if (m.limit === null || m.limit === undefined) return `已約 ${m.booked}・共用`;
  if (m.limit - m.booked <= 0) return `${m.booked}/${m.limit} 額滿`;
  return `${m.booked}/${m.limit} 剩 ${m.limit - m.booked}`;
}

// 開啟行事曆備註管理（帶入預設日期，新增時直接選好該日）
function openCalendarNoteManager(dateStr = '') {
  calendarNoteDefaultDate.value = dateStr || '';
  isCalendarNoteManagerVisible.value = true;
}

// 該週（chunk）是否有任何行事曆備註 → 決定是否顯示備註列
function chunkHasCalendarNote(chunk) {
  return (chunk || []).some(day => day.isInRange && (calendarNotesByDate.value[day.fullDate] || []).length > 0);
}

// 排休管理彈窗更新名單後，同步回人員選單（與「編輯人員」共用）
function handleStaffListUpdated(newList) {
  bookingOptions.value = { ...bookingOptions.value, inspectionStaff: newList };
}

// ✅ 8. 修改 fetchData 函數
async function fetchData() {
  fetchInspectorLeavesData(); // 排休資料獨立載入，不阻塞預約主流程
  fetchCalendarNotesData();   // 行事曆備註同樣獨立載入
  fetchDailyQuotaData();      // 每日名額摘要同樣獨立載入
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

// 對話框內快速編輯「預約備註／重要備註」走 inline-save（不關閉對話框、已直接寫入後端）：
// 先記錄有變更，待對話框關閉時再重新載入資料，讓時間表立即顯示剛修改的備註
const hasPendingInlineChanges = ref(false);
function handleInlineSaveFromDialog() {
  hasPendingInlineChanges.value = true;
}
watch(isDialogVisible, (visible) => {
  if (!visible && hasPendingInlineChanges.value) {
    hasPendingInlineChanges.value = false;
    fetchData();
  }
});

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
    fetchInspectorLeavesData(); // 排休資料獨立載入
    fetchCalendarNotesData();   // 行事曆備註獨立載入
    fetchDailyQuotaData();      // 每日名額摘要獨立載入

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
  selectedMobileDate.value = format(targetDate, 'yyyy-MM-dd'); // 手機視圖同步跳到該日期

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

// 取消通知信收件對象勾選結果（由 CancelNotifyPicker 以 v-model 回傳）
const cancelNotifySelection = ref({ ready: false, toBooker: false, cc: [] });

function promptCancelBooking(event) {
  eventToCancel.value = event;
  cancelNotifySelection.value = { ready: false, toBooker: false, cc: [] };
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
            bookingType,
            notify: { toBooker: cancelNotifySelection.value.toBooker, cc: cancelNotifySelection.value.cc }
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
    // 初始載入即填入人員/選擇方式選單（先前僅在「重新整理」時載入，導致排休管理的人員名單為空）
    bookingOptions.value = {
      ...bookingOptions.value,
      inspectionMethods: projectConfig?.bookingMethodOptions || bookingOptions.value.inspectionMethods,
      inspectionStaff: Array.isArray(projectConfig?.inspectionStaff) ? projectConfig.inspectionStaff : bookingOptions.value.inspectionStaff,
    };
    syncColorSettingsFromProject(); // 由建案設定載入共用的事件顏色
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
// 依背景色明暗自動取得可讀的文字色（深底配白字、淺底配深字）
function getReadableTextColor(bgHex) {
  if (!bgHex) return '#212121';
  let hex = String(bgHex).trim().replace('#', '');
  if (hex.length === 3) hex = hex.split('').map(c => c + c).join('');
  if (hex.length !== 6 || /[^0-9a-fA-F]/.test(hex)) return '#212121';
  const r = parseInt(hex.slice(0, 2), 16);
  const g = parseInt(hex.slice(2, 4), 16);
  const b = parseInt(hex.slice(4, 6), 16);
  // 相對亮度（sRGB 加權），> 0.6 視為淺色
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.6 ? '#212121' : '#FFFFFF';
}
// 依優先層級決定事件底色/邊框色：取消/已完成的固定灰色最優先，
// 之後依 keywordPriority 決定「顏色規則（關鍵字/空值）」與「來源+項目類型」誰先套用。
// 回傳 { bg, border }（皆可為空字串）或 null（無任何自訂設定符合）
function resolveCustomEventColor(event) {
  const srcKey = resolveSourceKey(event.source);
  const typeBg = getTypeColor(srcKey, event.bookingType);
  const typeBorder = getTypeBorder(srcKey, event.bookingType);
  const typeHit = (typeBg || typeBorder) ? { bg: typeBg, border: typeBorder } : null;
  const rule = matchKeywordRule(event);
  const ruleHit = rule ? { bg: rule.color || '', border: rule.borderColor || '' } : null;
  return keywordPriority.value === 'keyword' ? (ruleHit || typeHit) : (typeHit || ruleHit);
}
function getEventStyle(event) {
  if (!event || Object.keys(event).length === 0) return { backgroundColor: '#FFFFFF', color: '#000000' };
  if (event.status === '取消') return { backgroundColor: '#F5F5F5', color: '#9E9E9E' };
  if (event.status === '已完成') return { backgroundColor: '#ECEFF1', color: '#546E7A' };
  // 使用者自訂顏色（顏色規則 / 來源+項目類型，依優先層級）
  const custom = resolveCustomEventColor(event);
  let style = null;
  if (custom?.bg) {
    style = { backgroundColor: custom.bg, color: getReadableTextColor(custom.bg) };
  } else {
    // 未設定自訂底色 → 沿用原本關鍵字配色（向下相容）
    const textToSearch = [ event.bookingType, event.inspectionMethod, event.specialRemarks, event.specialRemarks2 ].filter(Boolean).join(' ');
    for (const config of CSS_KEYWORD_COLOR_MAP) {
      if (config.keyword && textToSearch.includes(config.keyword)) { style = { backgroundColor: config.backgroundColor, color: config.color }; break; }
    }
    if (!style) style = { backgroundColor: '#EEEEEE', color: '#212121' };
  }
  if (custom?.border) style.border = `2px solid ${custom.border}`;
  return style;
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
  // 使用者自訂顏色（顏色規則 / 來源+項目類型，依優先層級；Excel 色碼不含 #）
  const custom = resolveCustomEventColor(event);
  const borderColor = custom?.border ? custom.border.replace('#', '').toUpperCase() : '';
  if (custom?.bg) {
    return {
      backgroundColor: custom.bg.replace('#', '').toUpperCase(),
      textColor: getReadableTextColor(custom.bg).replace('#', ''),
      borderColor,
    };
  }
  // ✅ 修正：確保 textToSearch 的欄位存在
  const textToSearch = [ event.bookingType, event.inspectionMethod, event.specialRemarks, event.specialRemarks2 ].filter(Boolean).join(' ');
  for (const config of EXCEL_KEYWORD_COLOR_MAP) {
    if (config.keyword && textToSearch.includes(config.keyword)) return { backgroundColor: config.backgroundColor, textColor: config.textColor, borderColor };
  }
  return { backgroundColor: 'EEEEEE', textColor: '212121', borderColor };
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

// --- 下載輔助（手機支援系統分享 / 長按儲存） ---
const isPngPreviewVisible = ref(false);
const pngPreviewUrl = ref('');
const pngPreviewBlob = ref(null);
const pngPreviewFileName = ref('');

function isMobileLike() {
  return /Android|iPhone|iPad|iPod/i.test(navigator.userAgent) || window.innerWidth < 600;
}

// 取得台灣時間 (Asia/Taipei) 的「月/日－時:分」標註字串
function getTaiwanTimestampStamp() {
  const parts = new Intl.DateTimeFormat('zh-TW', {
    timeZone: 'Asia/Taipei',
    month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', hour12: false,
  }).formatToParts(new Date());
  const get = (t) => parts.find(p => p.type === t)?.value || '';
  return `${get('month')}/${get('day')}－${get('hour')}:${get('minute')}`;
}

// 透過系統分享面板送出檔案（手機可存到相簿/檔案 App 或分享到 LINE）
async function shareFileViaSystem(blob, fileName, mimeType) {
  try {
    // 桌面作業系統（含縮小視窗或未變更 UA 的裝置模擬）不走系統分享：
    // Windows/macOS 的桌面分享面板對檔案支援很差，直接退回預覽/傳統下載。
    // 注意 iPad 桌面模式 UA 會偽裝成 Macintosh，但其 maxTouchPoints > 0，不會被誤判。
    const ua = navigator.userAgent;
    const isDesktopOS = /Windows NT|Macintosh|CrOS|X11/.test(ua)
      && !/Android|iPhone|iPad|iPod/i.test(ua)
      && (navigator.maxTouchPoints || 0) === 0;
    if (isDesktopOS) return false;
    const file = new File([blob], fileName, { type: mimeType });
    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      await navigator.share({ files: [file], title: fileName });
      return true;
    }
  } catch (e) {
    if (e && e.name === 'AbortError') return true; // 使用者自行取消分享面板，視為已處理
    console.warn('系統分享失敗，改用其他下載方式:', e);
  }
  return false;
}

function triggerLinkDownload(url, fileName) {
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

function closePngPreview() {
  isPngPreviewVisible.value = false;
  if (pngPreviewUrl.value) {
    URL.revokeObjectURL(pngPreviewUrl.value);
    pngPreviewUrl.value = '';
  }
  pngPreviewBlob.value = null;
}

async function sharePngFromPreview() {
  if (!pngPreviewBlob.value) return;
  const ok = await shareFileViaSystem(pngPreviewBlob.value, pngPreviewFileName.value, 'image/png');
  if (!ok) showSnackbar('此瀏覽器不支援分享，請直接長按圖片儲存', 'info');
}

// rangeStart / rangeEnd 未指定時，使用時間表目前檢視範圍（「下載日期PNG」對話框會傳入自選區間）
async function handleDownloadPng(rangeStart, rangeEnd) {
 isDownloadingPdf.value = true;

 const chunkArray = (array, size) => {
  const chunkedArr = [];
  for (let i = 0; i < array.length; i += size) {
    chunkedArr.push(array.slice(i, i + size));
  }
  return chunkedArr;
 };

 try {
  const start = rangeStart instanceof Date ? rangeStart : startDate.value;
  const end = rangeEnd instanceof Date ? rangeEnd : endDate.value;

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

  const dateStampElement = document.createElement('div');
  dateStampElement.textContent = `${getTaiwanTimestampStamp()} 更新`;
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
      dayHeaderCell.textContent = `${format(date, 'M/d')}(${'日一二三四五六'[date.getDay()]})`;
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

    // 行事曆備註列：接在星期/日期標題下方（整個 chunk 皆無備註則不輸出此列）
    const chunkNoteDates = chunk.filter(date => (calendarNotesByDate.value[format(date, 'yyyy-MM-dd')] || []).length > 0);
    if (chunkNoteDates.length > 0) {
      const noteRow = document.createElement('tr');
      chunk.forEach(date => {
        const labelCell = document.createElement('th');
        labelCell.textContent = '備註';
        Object.assign(labelCell.style, {
          border: '1px solid #dee2e6', padding: '6px', textAlign: 'center',
          backgroundColor: '#fff8e1', color: '#7a4f01', fontWeight: 'bold', fontSize: '12px',
          borderTop: '2px solid #f0a500',
        });
        noteRow.appendChild(labelCell);

        const noteCell = document.createElement('th');
        Object.assign(noteCell.style, {
          border: '1px solid #dee2e6', padding: '4px', verticalAlign: 'top',
          backgroundColor: '#fffdf5', borderTop: '2px solid #f0a500',
        });
        const notes = calendarNotesByDate.value[format(date, 'yyyy-MM-dd')] || [];
        notes.forEach(note => {
          const cfg = getNoteColor(note.color);
          const noteItem = document.createElement('div');
          noteItem.textContent = `📌 ${note.note}`;
          Object.assign(noteItem.style, {
            backgroundColor: cfg.bg, color: cfg.text,
            border: `1px solid ${cfg.border}`, borderLeft: `5px solid ${cfg.border}`,
            borderRadius: '5px', padding: '3px 6px', marginBottom: '3px',
            fontSize: '12px', fontWeight: 'bold', lineHeight: '1.3',
            textAlign: 'left', whiteSpace: 'pre-wrap', wordBreak: 'break-word',
          });
          noteCell.appendChild(noteItem);
        });
        noteRow.appendChild(noteCell);
      });
      thead.appendChild(noteRow);
    }

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
          const escapeHtml = (str) => String(str).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
          const titleHTML = event.displayParts.map(part => {
            if (part.isHousehold) {
              return `<strong style="font-size: 1.1em;">${escapeHtml(part.text)}</strong>`;
            }
            return escapeHtml(part.text);
          }).join(' - ');
          // 驗屋人員 / 銷售人員 / 備註：醒目區塊（與畫面上的樣式一致）
          // 色塊統一放進 flex 容器：人員類（驗屋/銷售）並排同一列，備註類獨占整列
          const HL_FULL_ROW = 'flex:0 0 100%;';
          const HL_INLINE_STYLES = {
            inspectors: 'width:fit-content;background-color:#E8EAF6;color:#283593;border:1px solid #9FA8DA;',
            salesperson: 'width:fit-content;background-color:#F3E5F5;color:#6A1B9A;border:1px solid #CE93D8;',
            remarks: `${HL_FULL_ROW}background-color:#FFEBEE;color:#B71C1C;border:1px solid #EF9A9A;`,
            bookingRemarks: `${HL_FULL_ROW}background-color:#FFF8E1;color:#6D4C41;border:1px solid #FFE082;`,
          };
          const highlightHTML = (event.highlightParts || []).map(hp => {
            const meta = HIGHLIGHT_FIELD_META[hp.kind];
            if (!meta) return '';
            // 驗屋人員/銷售人員不顯示標籤文字，只顯示人名（並排時保持精簡，以顏色區分）
            const labelPrefix = (hp.kind === 'inspectors' || hp.kind === 'salesperson') ? '' : `${meta.label}：`;
            // 驗屋人員：排休者以粉紅標記（與畫面一致）
            let contentHTML;
            if (hp.kind === 'inspectors' && Array.isArray(hp.persons) && hp.persons.length) {
              const LEAVE_PERSON_STYLE = 'display:inline-block;background-color:#FCE4EC;color:#C2185B;border:1px solid #F48FB1;border-radius:3px;padding:0 3px;font-weight:800;';
              contentHTML = hp.persons.map(p =>
                p.onLeave ? `<span style="${LEAVE_PERSON_STYLE}">${escapeHtml(p.label)}</span>` : escapeHtml(p.label)
              ).join(',');
            } else {
              contentHTML = escapeHtml(hp.text);
            }
            return `<div style="${HL_INLINE_STYLES[hp.kind] || ''}margin-top:3px;padding:2px 5px;border-radius:4px;font-weight:700;line-height:1.35;">`
              + `${labelPrefix}${contentHTML}</div>`;
          }).join('');
          // flex 容器：讓驗屋人員與銷售人員色塊落在同一列，備註類換整列
          const highlightWrapped = highlightHTML
            ? `<div style="display:flex;flex-wrap:wrap;align-items:flex-start;column-gap:4px;">${highlightHTML}</div>`
            : '';
          eventItem.innerHTML = titleHTML + highlightWrapped;
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

  const fileName = `${projectName.value}_驗屋預約表_${format(start, 'yyyyMMdd')}-${format(end, 'yyyyMMdd')}.png`;
  const blob = await new Promise((resolve, reject) =>
    canvas.toBlob(b => (b ? resolve(b) : reject(new Error('圖片轉檔失敗'))), 'image/png')
  );

  if (isMobileLike()) {
    // 手機：優先叫出系統分享面板（可儲存到相簿/檔案或分享到 LINE）
    const shared = await shareFileViaSystem(blob, fileName, 'image/png');
    if (!shared) {
      // 不支援分享（如 LINE 內建瀏覽器）→ 顯示預覽，長按圖片即可儲存
      pngPreviewBlob.value = blob;
      pngPreviewFileName.value = fileName;
      pngPreviewUrl.value = URL.createObjectURL(blob);
      isPngPreviewVisible.value = true;
    }
  } else {
    const url = URL.createObjectURL(blob);
    triggerLinkDownload(url, fileName);
    setTimeout(() => URL.revokeObjectURL(url), 10000);
  }

 } catch (err) {
  console.error("圖片產生失敗:", err);
  error.value = `產生圖片失敗: ${err.message}`;
 } finally {
  isDownloadingPdf.value = false;
 }
}

// ── 下載日期PNG：選擇日期區間後下載時間表圖檔 ──
const isDatePngDialogVisible = ref(false);
const datePngRange = reactive({ start: null, end: null }); // yyyy-MM-dd

// 開啟對話框時預設帶入時間表目前檢視範圍
watch(isDatePngDialogVisible, (open) => {
  if (open) {
    datePngRange.start = startDate.value ? format(startDate.value, 'yyyy-MM-dd') : null;
    datePngRange.end = endDate.value ? format(endDate.value, 'yyyy-MM-dd') : null;
  }
});

// 調整區間時補抓該區間的預約資料（沿用列表匯出的載入機制，合併進 allAppointments）
watchDebounced(
  () => [datePngRange.start, datePngRange.end],
  ([start, end]) => {
    if (!isDatePngDialogVisible.value || !start || !end || start > end) return;
    handleListExportFetchRange({ start, end });
  },
  { debounce: 600 }
);

// 選定區間內符合目前篩選條件的筆數（提示用）
const datePngCount = computed(() => {
  if (!datePngRange.start || !datePngRange.end) return 0;
  return filteredAppointments.value.filter(evt => {
    if (!evt.start) return false;
    const k = format(evt.start, 'yyyy-MM-dd');
    return k >= datePngRange.start && k <= datePngRange.end;
  }).length;
});

async function handleDatePngDownload() {
  if (!datePngRange.start || !datePngRange.end || datePngRange.start > datePngRange.end) return;
  const start = parseISO(`${datePngRange.start}T00:00:00`);
  const end = parseISO(`${datePngRange.end}T00:00:00`);
  await handleDownloadPng(start, end);
  isDatePngDialogVisible.value = false;
}

// ── 下載人員行程表(PNG)：對話框勾選人員後下載，每人一張或合併一張 ──
// 資料範圍與篩選條件跟隨時間表目前設定；一筆預約有多位人員時會在每位人員底下各列一次
const isPersonPngDialogVisible = ref(false);
const personPngSelected = reactive({ inspectors: [], salesperson: [] });
const PERSON_PNG_GROUP_META = {
  inspectors: { label: '驗屋人員', theme: { headerBg: '#E8EAF6', headerText: '#283593' } },
  salesperson: { label: '銷售人員', theme: { headerBg: '#F3E5F5', headerText: '#6A1B9A' } },
};

// 目前日期區間＋篩選條件下的預約（依開始時間排序）
const personPngEventsInRange = computed(() => {
  if (!startDate.value || !endDate.value) return [];
  const sKey = format(startDate.value, 'yyyy-MM-dd');
  const eKey = format(endDate.value, 'yyyy-MM-dd');
  return filteredAppointments.value
    .filter(evt => {
      if (!evt.start) return false;
      const k = format(evt.start, 'yyyy-MM-dd');
      return k >= sKey && k <= eKey;
    })
    .sort((a, b) => a.start - b.start);
});

// 依人員拆分：拆人邏輯與資料透視相同（getPivotValues）；未填寫歸到最後，其餘依筆數多→少
function groupPersonPngEvents(dimKey) {
  const map = new Map();
  personPngEventsInRange.value.forEach(evt => {
    getPivotValues(evt, dimKey).forEach(name => {
      if (!map.has(name)) map.set(name, []);
      map.get(name).push(evt);
    });
  });
  return Array.from(map.entries()).sort((a, b) => {
    const aEmpty = a[0] === PIVOT_EMPTY_LABEL ? 1 : 0;
    const bEmpty = b[0] === PIVOT_EMPTY_LABEL ? 1 : 0;
    return (aEmpty - bEmpty) || (b[1].length - a[1].length) || a[0].localeCompare(b[0], 'zh-Hant');
  });
}
const personPngGroups = computed(() => ({
  inspectors: groupPersonPngEvents('inspectors'),
  salesperson: groupPersonPngEvents('salesperson'),
}));
const personPngSelectedCount = computed(() =>
  personPngSelected.inspectors.length + personPngSelected.salesperson.length
);

// 開啟對話框時預設全選
watch(isPersonPngDialogVisible, (open) => {
  if (open) {
    personPngSelected.inspectors = personPngGroups.value.inspectors.map(([name]) => name);
    personPngSelected.salesperson = personPngGroups.value.salesperson.map(([name]) => name);
  }
});

const escapePngHtml = (str) => String(str).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const PERSON_PNG_DOW = ['日', '一', '二', '三', '四', '五', '六'];
// 平均分配欄寬（table-layout:fixed 且不設個別寬度）、允許文字換行
const PERSON_PNG_TD = 'border:1px solid #e0e0e0;padding:5px 8px;vertical-align:top;word-break:break-word;overflow-wrap:anywhere;';
const PERSON_PNG_TH = 'border:1px solid #dee2e6;padding:6px 8px;background:#f8f9fa;font-weight:bold;text-align:left;word-break:break-word;';

// 醒目欄位色塊：與事件卡片上的驗屋人員/銷售人員/備註樣式一致
const PERSON_PNG_HL_STYLES = {
  inspectors: 'background-color:#E8EAF6;color:#283593;border:1px solid #9FA8DA;',
  salesperson: 'background-color:#F3E5F5;color:#6A1B9A;border:1px solid #CE93D8;',
  remarks: 'background-color:#FFEBEE;color:#B71C1C;border:1px solid #EF9A9A;',
  bookingRemarks: 'background-color:#FFF8E1;color:#6D4C41;border:1px solid #FFE082;',
};

// 行程表欄位＝「顯示設定」目前勾選的事件顯示欄位（含動態自訂欄位），前面固定日期/時段、最後為狀態
const personPngColumns = computed(() =>
  displayFieldOptions.value.filter(option => selectedDisplayFields.value.includes(option.key))
);

// 單一儲存格：取值與事件顯示相同（getFieldValue＋formatter）；醒目欄位以事件同款色塊呈現
function buildPersonPngCellHTML(evt, option) {
  const raw = getFieldValue(evt, option);
  if (raw === null || raw === undefined || raw === '') return '';
  const text = raw instanceof Date ? safeFormatDate(raw, 'yyyy-MM-dd') : String(raw);
  const hlStyle = PERSON_PNG_HL_STYLES[option.key];
  if (option.key === 'inspectors') {
    // 驗屋人員：沿用事件的排休標註（排休者粉紅標記）
    const persons = annotateInspectorPersons(text, inspectorLeaveMap.value, format(evt.start, 'yyyy-MM-dd'), format(evt.start, 'HH:mm'));
    const LEAVE_STYLE = 'display:inline-block;background-color:#FCE4EC;color:#C2185B;border:1px solid #F48FB1;border-radius:3px;padding:0 3px;font-weight:800;';
    const content = persons.map(p =>
      p.onLeave ? `<span style="${LEAVE_STYLE}">${escapePngHtml(p.label)}</span>` : escapePngHtml(p.label)
    ).join(',');
    return `<span style="${hlStyle}display:inline-block;border-radius:4px;padding:1px 5px;font-weight:700;">${content}</span>`;
  }
  if (hlStyle) {
    return `<span style="${hlStyle}display:inline-block;border-radius:4px;padding:1px 5px;font-weight:700;">${escapePngHtml(text)}</span>`;
  }
  const formatted = option.formatter ? option.formatter(raw) : text;
  return escapePngHtml(formatted ?? '');
}

function buildPersonPngRowsHTML(person, events, isInspectorBlock) {
  const columns = personPngColumns.value;
  return events.map(evt => {
    const dateKey = format(evt.start, 'yyyy-MM-dd');
    const time = format(evt.start, 'HH:mm');
    const dateLabel = `${format(evt.start, 'MM/dd')}（${PERSON_PNG_DOW[evt.start.getDay()]}）`;
    // 驗屋人員區塊：該人員於該日該時段排休時，於時段旁標註提醒
    let leaveBadge = '';
    if (isInspectorBlock && person !== PIVOT_EMPTY_LABEL) {
      const leaveType = getLeaveTypeForSlot(inspectorLeaveMap.value, dateKey, time, person);
      if (leaveType) {
        leaveBadge = `<span style="margin-left:4px;background:#FCE4EC;color:#C2185B;border:1px solid #F48FB1;border-radius:3px;padding:0 4px;font-weight:800;">${LEAVE_TYPE_LABELS[leaveType]}</span>`;
      }
    }
    // 資料列底色/文字色沿用畫面上的事件顏色設定（取消/已完成→自訂顏色→關鍵字顏色→預設）
    const style = getEventStyle(evt);
    const cancelled = evt.status === '取消';
    const rowStyle = `background-color:${style.backgroundColor};color:${style.color};${style.border ? `border:${style.border};` : ''}${cancelled ? 'text-decoration:line-through;opacity:.8;' : ''}`;
    const cells = columns.map(option => `<td style="${PERSON_PNG_TD}">${buildPersonPngCellHTML(evt, option)}</td>`).join('');
    return `<tr style="${rowStyle}">
      <td style="${PERSON_PNG_TD}">${escapePngHtml(dateLabel)}</td>
      <td style="${PERSON_PNG_TD}font-weight:700;">${escapePngHtml(time)}${leaveBadge}</td>
      ${cells}
      <td style="${PERSON_PNG_TD}text-align:center;">${escapePngHtml(evt.status || '')}</td>
    </tr>`;
  }).join('');
}

// 單一人員的卡片區塊（標題色依驗屋/銷售人員區分）
function buildPersonPngBlockHTML(person, events, groupKey) {
  const meta = PERSON_PNG_GROUP_META[groupKey];
  const headCells = ['日期', '時段', ...personPngColumns.value.map(o => o.label), '狀態']
    .map(label => `<th style="${PERSON_PNG_TH}">${escapePngHtml(label)}</th>`).join('');
  return `
    <div style="border:1px solid #dee2e6;border-radius:8px;margin-bottom:14px;overflow:hidden;">
      <div style="background:${meta.theme.headerBg};color:${meta.theme.headerText};padding:6px 12px;font-size:16px;font-weight:800;">
        ${escapePngHtml(person)}<span style="font-weight:600;font-size:13px;margin-left:8px;">${events.length} 筆</span>
      </div>
      <table style="border-collapse:collapse;width:100%;table-layout:fixed;font-size:14px;">
        <thead><tr>${headCells}</tr></thead>
        <tbody>${buildPersonPngRowsHTML(person, events, groupKey === 'inspectors')}</tbody>
      </table>
    </div>`;
}

// 將 HTML 內容渲染成 PNG blob（頂部加紅字更新時間戳記）
async function renderPersonPngBlob(innerHTML) {
  const tempContainer = document.createElement('div');
  Object.assign(tempContainer.style, {
    position: 'absolute', left: '-9999px', width: '1123px',
    padding: '20px', backgroundColor: 'white',
  });
  tempContainer.innerHTML = `<div style="font-size:3em;font-weight:bold;color:red;margin-bottom:8px;">${escapePngHtml(getTaiwanTimestampStamp())} 更新</div>` + innerHTML;
  document.body.appendChild(tempContainer);
  try {
    await new Promise(resolve => setTimeout(resolve, 100));
    const canvas = await html2canvas(tempContainer, { scale: 2, useCORS: true });
    return await new Promise((resolve, reject) =>
      canvas.toBlob(b => (b ? resolve(b) : reject(new Error('圖片轉檔失敗'))), 'image/png')
    );
  } finally {
    document.body.removeChild(tempContainer);
  }
}

// 已勾選的人員清單 [{ groupKey, person, events }]（依驗屋→銷售、各組原本排序）
function selectedPersonPngEntries() {
  const entries = [];
  for (const groupKey of Object.keys(PERSON_PNG_GROUP_META)) {
    for (const [person, events] of personPngGroups.value[groupKey]) {
      if (personPngSelected[groupKey].includes(person)) entries.push({ groupKey, person, events });
    }
  }
  return entries;
}

const sanitizePngFileName = (name) => String(name).replace(/[\\/:*?"<>|]/g, '_');

// 每人一張：逐一產圖後下載；手機優先以系統分享面板一次分享全部圖檔
async function handleDownloadPersonPngSeparate() {
  if (personPngSelectedCount.value === 0) return;
  isDownloadingPdf.value = true;
  try {
    const rangeLabel = `${format(startDate.value, 'yyyy/MM/dd')} - ${format(endDate.value, 'yyyy/MM/dd')}`;
    const rangeFile = `${format(startDate.value, 'yyyyMMdd')}-${format(endDate.value, 'yyyyMMdd')}`;

    const files = [];
    for (const { groupKey, person, events } of selectedPersonPngEntries()) {
      const meta = PERSON_PNG_GROUP_META[groupKey];
      const innerHTML = `
        <h3 style="font-size:1.25rem;margin:0 0 10px;">${escapePngHtml(projectName.value)} - ${escapePngHtml(person)}（${meta.label}）行程表: ${rangeLabel}</h3>
        ${buildPersonPngBlockHTML(person, events, groupKey)}`;
      const blob = await renderPersonPngBlob(innerHTML);
      files.push({ blob, fileName: `${projectName.value}_${meta.label}_${sanitizePngFileName(person)}_${rangeFile}.png` });
    }

    if (isMobileLike()) {
      // 手機：優先一次分享多張（可存到相簿或傳到 LINE）
      try {
        const fileObjs = files.map(f => new File([f.blob], f.fileName, { type: 'image/png' }));
        if (navigator.canShare && navigator.canShare({ files: fileObjs })) {
          await navigator.share({ files: fileObjs, title: '人員行程表' });
          isPersonPngDialogVisible.value = false;
          return;
        }
      } catch (e) {
        if (e && e.name === 'AbortError') return; // 使用者自行取消分享面板
        console.warn('多檔分享失敗，改用逐張下載:', e);
      }
      // 不支援多檔分享：單張退回既有預覽（長按儲存），多張改逐張下載
      if (files.length === 1) {
        pngPreviewBlob.value = files[0].blob;
        pngPreviewFileName.value = files[0].fileName;
        pngPreviewUrl.value = URL.createObjectURL(files[0].blob);
        isPngPreviewVisible.value = true;
        return;
      }
    }

    for (const f of files) {
      const url = URL.createObjectURL(f.blob);
      triggerLinkDownload(url, f.fileName);
      setTimeout(() => URL.revokeObjectURL(url), 10000);
      // 逐張間隔，避免瀏覽器擋下連續多個下載
      await new Promise(resolve => setTimeout(resolve, 400));
    }
    isPersonPngDialogVisible.value = false;
  } catch (err) {
    console.error('人員行程表圖片產生失敗:', err);
    error.value = `產生圖片失敗: ${err.message}`;
  } finally {
    isDownloadingPdf.value = false;
  }
}

// 合併一張：兩區塊總表版型，僅包含勾選的人員
async function handleDownloadPersonPngCombined() {
  if (personPngSelectedCount.value === 0) return;
  isDownloadingPdf.value = true;
  try {
    const rangeLabel = `${format(startDate.value, 'yyyy/MM/dd')} - ${format(endDate.value, 'yyyy/MM/dd')}`;
    const sections = Object.entries(PERSON_PNG_GROUP_META).map(([groupKey, meta]) => {
      const blocks = personPngGroups.value[groupKey]
        .filter(([person]) => personPngSelected[groupKey].includes(person))
        .map(([person, events]) => buildPersonPngBlockHTML(person, events, groupKey))
        .join('');
      if (!blocks) return '';
      return `
        <div style="margin-top:24px;">
          <h3 style="font-size:1.25rem;margin:0 0 4px;">${escapePngHtml(projectName.value)} - ${meta.label}行程表: ${rangeLabel}</h3>
          <div style="font-size:12px;color:#757575;margin-bottom:10px;">一筆預約有多位人員時，會在每位人員底下各列一次。</div>
          ${blocks}
        </div>`;
    }).join('');

    const blob = await renderPersonPngBlob(sections);
    const fileName = `${projectName.value}_人員行程表_${format(startDate.value, 'yyyyMMdd')}-${format(endDate.value, 'yyyyMMdd')}.png`;

    if (isMobileLike()) {
      // 手機：優先叫出系統分享面板（可儲存到相簿/檔案或分享到 LINE）
      const shared = await shareFileViaSystem(blob, fileName, 'image/png');
      if (!shared) {
        pngPreviewBlob.value = blob;
        pngPreviewFileName.value = fileName;
        pngPreviewUrl.value = URL.createObjectURL(blob);
        isPngPreviewVisible.value = true;
        return;
      }
    } else {
      const url = URL.createObjectURL(blob);
      triggerLinkDownload(url, fileName);
      setTimeout(() => URL.revokeObjectURL(url), 10000);
    }
    isPersonPngDialogVisible.value = false;
  } catch (err) {
    console.error('人員行程表圖片產生失敗:', err);
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

    // --- 4. 寫入總標題 (A1:E1 合併)，附台灣時間更新標註 ---
    ws['A1'] = { v: `${projectName.value} - 預約時間表（${getTaiwanTimestampStamp()} 更新）`, t: 's', s: mainTitleStyle };
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
              if (rowStyle.borderColor) {
                const edge = { style: "medium", color: { rgb: rowStyle.borderColor } };
                finalCellStyle.border = { top: edge, bottom: edge, left: edge, right: edge };
              }
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
    const excelMime = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
    const blob = new Blob([wbout], { type: excelMime });

    if (isMobileLike()) {
      // 手機：優先叫出系統分享面板（可儲存到檔案 App 或分享到 LINE）
      const shared = await shareFileViaSystem(blob, fileName, excelMime);
      if (shared) return;
      showSnackbar('此瀏覽器不支援直接儲存檔案，已嘗試傳統下載；若無反應請改用 Chrome / Safari 開啟本頁', 'info');
    }
    const url = URL.createObjectURL(blob);
    triggerLinkDownload(url, fileName);
    setTimeout(() => URL.revokeObjectURL(url), 10000);

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
/* --- 日期區間選擇器：起/迄 觸發器 --- */
.range-trigger {
  display: flex;
  align-items: center;
  gap: 6px;
  width: 100%;
  min-height: 38px;
  padding: 4px 12px;
  background-color: #fff;
  border: 1px solid #c4c9cf;
  border-radius: 8px;
  cursor: pointer;
  user-select: none;
  transition: border-color 0.15s, box-shadow 0.15s;
}
.range-trigger:hover {
  border-color: #1867c0;
  box-shadow: 0 0 0 1px rgba(24, 103, 192, 0.2);
}
.range-part {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 0.875rem;
  color: #212121;
  white-space: nowrap;
}
.range-tag {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 20px;
  height: 20px;
  padding: 0 4px;
  border-radius: 4px;
  font-size: 0.7rem;
  font-weight: 700;
  background-color: #e3f2fd;
  color: #1565c0;
}
.range-tag--end {
  background-color: #fff3e0;
  color: #e65100;
}
/* teleport 到 body 的日期選單置頂，避免被其他元素遮住 */
.dp__outer_menu_wrap {
  z-index: 3000 !important;
}

/* --- 資料透視：狀態勾選列高度收斂 --- */
.pivot-status-chips .v-chip-group__content,
.pivot-status-chips {
  padding-top: 0;
  padding-bottom: 0;
}

/* --- 資料透視：可排序表頭 --- */
.pivot-sortable {
  cursor: pointer;
  white-space: nowrap;
  user-select: none;
}
.pivot-sortable:hover {
  background-color: #eceff1 !important;
}

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
  height: 24px !important; /* 配合緊湊的日期標題列（v-btn small 預設 28px） */
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
  --v-table-header-height: 28px; /* 日期標題列更緊湊（Vuetify 預設 56px；內容較高的名額/備註列仍會自動撐開） */
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
/* 日期標題列更緊湊：縮小上下留白與字級 */
.custom-calendar-table thead tr:first-child th {
  padding-top: 1px;
  padding-bottom: 1px;
}
.custom-calendar-table .day-header div {
  font-size: 0.9rem;
  font-weight: 600;
  line-height: 1.3;
  white-space: nowrap;
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

/* --- 每日名額摘要列（日期標題下第一列） --- */
.custom-calendar-table thead tr.quota-row th {
  position: static;
  top: auto;
  z-index: 1;
  background-color: #f7fbfa;
  padding: 3px 5px;
  vertical-align: top;
  border-top: 2px solid #2e9e6b;
}
.custom-calendar-table thead tr.quota-row th.quota-label {
  position: sticky;
  left: 0;
  top: auto;
  z-index: 3;
  background-color: #e8f5f0;
  text-align: center;
  font-size: 0.72rem;
  font-weight: 700;
  color: #1b5e4a;
  white-space: nowrap;
  box-shadow: 2px 0 5px -2px rgba(0, 0, 0, 0.1);
}
.quota-row th.quota-cell.weekend-column {
  background-color: #f6f9f5;
}
.quota-row th.quota-cell.today-column {
  background-color: #eef8f4;
}
.quota-total {
  font-size: 0.74rem;
  font-weight: 800;
  color: #37474f;
  text-align: left;
  letter-spacing: -0.2px;
  margin-bottom: 2px;
}
.quota-total-rest {
  font-weight: 700;
  color: #78909c;
  margin-left: 4px;
}
.quota-item {
  margin-bottom: 3px;
  cursor: pointer;
}
.quota-item:hover {
  filter: brightness(0.97);
}
/* 收合狀態：只留一行全日總計 */
.quota-collapsed {
  font-size: 0.74rem;
  font-weight: 800;
  color: #37474f;
  text-align: left;
  letter-spacing: -0.2px;
  cursor: pointer;
}
/* 「名額」「備註」列標題的收合切換 */
.custom-calendar-table thead tr.quota-row th.quota-label,
.custom-calendar-table thead tr.calendar-note-row th.calendar-note-label {
  cursor: pointer;
  user-select: none;
}
.row-toggle-icon {
  margin-left: 1px;
  opacity: 0.75;
}
/* 「名額」「備註」列標題的整列隱藏按鈕 */
.row-hide-icon {
  margin-left: 3px;
  opacity: 0.5;
}
.row-hide-icon:hover {
  opacity: 1;
}
/* 備註收合狀態：以色點提示該日備註數量 */
.note-collapsed {
  display: flex;
  flex-wrap: wrap;
  gap: 3px;
  min-height: 10px;
  cursor: pointer;
}
.note-collapsed-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}
/* 名額明細對話框內的表列 */
.quota-detail-table {
  border: 1px solid #eceff1;
  border-radius: 6px;
  overflow: hidden;
}
.quota-detail-line {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  padding: 4px 8px;
  font-size: 0.82rem;
}
.quota-detail-line:nth-child(odd) {
  background-color: #fafafa;
}
.quota-detail-key {
  color: #607d8b;
  font-weight: 600;
}
.quota-item-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 4px;
  font-size: 0.72rem;
  line-height: 1.25;
}
.quota-item-name {
  font-weight: 700;
  color: #37474f;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.quota-item-num {
  font-weight: 800;
  flex-shrink: 0;
  letter-spacing: -0.2px;
}
.quota-bar {
  height: 4px;
  border-radius: 2px;
  background-color: #dfe6e9;
  overflow: hidden;
}
.quota-bar-fill {
  height: 100%;
  border-radius: 2px;
  transition: width 0.2s ease;
}
/* tooltip 明細 */
.quota-tip {
  font-size: 0.78rem;
  line-height: 1.5;
}
.quota-tip-title {
  font-weight: 800;
  margin-bottom: 2px;
}
.quota-tip-section {
  border-top: 1px solid rgba(255, 255, 255, 0.25);
  margin-top: 3px;
  padding-top: 3px;
}
.quota-tip-line {
  display: flex;
  justify-content: space-between;
  gap: 12px;
}
.quota-tip-key {
  opacity: 0.85;
}

/* --- 行事曆備註列（緊接在日期標題下方） --- */
/* thead 內的第二列不跟著垂直凍結，避免與日期標題列重疊；仍保留左側「備註」欄的水平凍結 */
.custom-calendar-table thead tr.calendar-note-row th {
  position: static;
  top: auto;
  z-index: 1;
  background-color: #fffdf5;
  padding: 3px 4px;
  vertical-align: top;
  border-top: 2px solid #f0a500;
}
.custom-calendar-table thead tr.calendar-note-row th.calendar-note-label {
  position: sticky;
  left: 0;
  top: auto;
  z-index: 3;
  background-color: #fff8e1;
  text-align: center;
  font-size: 0.72rem;
  font-weight: 700;
  color: #7a4f01;
  white-space: nowrap;
  box-shadow: 2px 0 5px -2px rgba(0, 0, 0, 0.1);
}
.calendar-note-row th.calendar-note-cell.weekend-column {
  background-color: #fdf7ef;
}
.calendar-note-row th.calendar-note-cell.today-column {
  background-color: #fdf6e3;
}
.calendar-note-stack {
  display: flex;
  flex-direction: column;
  gap: 3px;
}
.calendar-note-chip {
  display: flex;
  align-items: flex-start;
  gap: 3px;
  border: 1px solid;
  border-left-width: 5px;
  border-radius: 5px;
  padding: 3px 6px;
  font-size: 0.78rem;
  font-weight: 700;
  line-height: 1.3;
  text-align: left;
  white-space: pre-wrap;
  word-break: break-word;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.12);
}
.calendar-note-chip.is-clickable {
  cursor: pointer;
}
.calendar-note-chip.is-clickable:hover {
  filter: brightness(0.96);
}
.calendar-note-chip-icon {
  flex: 0 0 auto;
  margin-top: 1px;
}
.calendar-note-chip-text {
  flex: 1 1 auto;
  min-width: 0;
}
/* 手機版備註（日期標題下一列） */
.mobile-note-stack {
  margin: 0 0 8px;
}
/* 手機版每日名額摘要 */
.mobile-quota-strip {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin: 0 0 8px;
}
.mobile-quota-item {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  background: #f1f7f5;
  border: 1px solid #cfe3dc;
  border-radius: 999px;
  padding: 4px 8px 4px 12px;
  font: inherit;
  font-size: 0.76rem;
  color: inherit;
  cursor: pointer;
}
.mobile-quota-item:active {
  background: #e3efeb;
}
.mobile-quota-name {
  font-weight: 700;
  color: #37474f;
}
.mobile-quota-num {
  font-weight: 800;
}
.mobile-quota-rest {
  font-weight: 700;
  opacity: 0.85;
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

/* 驗屋人員 / 備註 醒目區塊 */
.event-highlight {
  display: flex;
  align-items: flex-start;
  gap: 3px;
  margin-top: 3px;
  padding: 2px 5px;
  border-radius: 4px;
  font-weight: 700;
  line-height: 1.35;
  white-space: normal;
  word-break: break-word;
}
.event-highlight-icon {
  margin-top: 2px;
  flex-shrink: 0;
}
/* 排休人員：在驗屋人員標籤中以粉紅高亮提醒（該人員排休卻被編排） */
.event-hl-person-leave {
  display: inline-block;
  background-color: #FCE4EC; /* pink lighten-5 */
  color: #C2185B; /* pink darken-2 */
  border: 1px solid #F48FB1;
  border-radius: 3px;
  padding: 0 3px;
  margin: 1px 0;
  font-weight: 800;
}
.event-hl-inspectors {
  width: fit-content; /* 僅佔內容寬度，不整條填滿 */
  background-color: #E8EAF6; /* indigo lighten-5 */
  color: #283593; /* indigo darken-3 */
  border: 1px solid #9FA8DA;
  font-weight: 600;
}
.event-hl-salesperson {
  width: fit-content; /* 僅佔內容寬度，不整條填滿 */
  background-color: #F3E5F5; /* purple lighten-5 */
  color: #6A1B9A; /* purple darken-3 */
  border: 1px solid #CE93D8;
  font-weight: 600;
}
/* 下載人員行程表：人員勾選清單 */
.person-png-list {
  max-height: 300px;
  overflow-y: auto;
  padding: 4px 8px;
}
/* 下載日期PNG：日期區間輸入框 */
.date-png-input {
  border: 1px solid #ccc;
  border-radius: 4px;
  padding: 6px 8px;
  font-size: 0.95rem;
  width: 100%;
  color: #333;
}
.date-png-input:focus {
  outline: 2px solid #1976D2;
  border-color: transparent;
}
/* 醒目色塊容器：驗屋人員與銷售人員並排同一列，備註類獨占整列 */
.event-highlight-wrap {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  column-gap: 4px;
}
.event-highlight-wrap .event-hl-remarks,
.event-highlight-wrap .event-hl-booking-remarks {
  flex: 0 0 100%;
}
.event-hl-remarks {
  background-color: #FFEBEE;
  color: #B71C1C;
  border: 1px solid #EF9A9A;
}
.event-hl-booking-remarks {
  background-color: #FFF8E1;
  color: #6D4C41;
  border: 1px solid #FFE082;
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

/* --- 手機版行事曆式視圖（日期橫條 + 當日行程） --- */
.mobile-date-strip {
  display: flex;
  gap: 6px;
  overflow-x: auto;
  padding: 6px 2px 10px;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none;
}
.mobile-date-strip::-webkit-scrollbar {
  display: none;
}
.mobile-date-pill {
  flex: 0 0 auto;
  min-width: 58px;
  padding: 6px 4px;
  border-radius: 14px;
  border: 1px solid #e0e0e0;
  background: #fafafa;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  cursor: pointer;
  font: inherit;
  color: inherit;
}
.mobile-date-pill.weekend {
  background: #fff5f5;
}
/* 有行事曆備註的日期，在日期橫條上加註色點 */
.pill-note-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  margin-top: 1px;
}
.mobile-date-pill.today {
  border: 2px solid #1976d2;
}
.mobile-date-pill.active {
  background: #1976d2;
  border-color: #1976d2;
  color: #fff;
}
.pill-dow {
  font-size: 0.7rem;
  opacity: 0.75;
}
.pill-date {
  font-size: 0.95rem;
  font-weight: 700;
  line-height: 1.1;
}
.pill-count {
  font-size: 0.68rem;
  line-height: 1.3;
  background: #e3f2fd;
  color: #1565c0;
  border-radius: 8px;
  padding: 0 6px;
  font-weight: 700;
}
.pill-count-empty {
  background: transparent;
  color: #bdbdbd;
  font-weight: 400;
}
.mobile-date-pill.active .pill-count {
  background: rgba(255, 255, 255, 0.3);
  color: #fff;
}
.mobile-day-header {
  display: flex;
  align-items: center;
  padding: 8px 4px;
  border-bottom: 2px solid #1976d2;
  font-size: 1rem;
}
.mobile-agenda-list {
  padding-bottom: 96px; /* 預留底部浮動工具列空間 */
}
/* 時間改為事件群組上方的小標籤，讓事件卡片佔滿整個手機寬度 */
.mobile-slot {
  display: block;
  padding: 6px 0 8px;
  border-bottom: 1px solid #eeeeee;
}
.mobile-slot-time {
  display: flex;
  align-items: center;
  font-weight: 700;
  color: #1976d2;
  font-size: 0.85rem;
  padding: 2px 0;
}
.mobile-slot-events {
  width: 100%;
  min-width: 0;
}
.mobile-event-card {
  font-size: 0.95em;
  padding: 8px 10px;
  border: 1px solid rgba(0, 0, 0, 0.08);
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.06);
}

/* 月檢視 */
.mobile-month-nav {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 2px 0;
}
.mobile-month-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 4px;
  padding: 4px 0 10px;
}
.mobile-month-dow {
  text-align: center;
  font-size: 0.72rem;
  color: #888;
  padding: 2px 0;
}
.mobile-month-cell {
  border: 1px solid #eeeeee;
  border-radius: 10px;
  background: #fff;
  padding: 4px 0 3px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1px;
  min-height: 46px;
  cursor: pointer;
  font: inherit;
  color: inherit;
}
.mobile-month-cell.dim {
  opacity: 0.35;
}
.mobile-month-cell.weekend {
  background: #fff8f8;
}
.mobile-month-cell.today .num {
  color: #1976d2;
  font-weight: 900;
}
.mobile-month-cell.active {
  background: #1976d2;
  border-color: #1976d2;
  color: #fff;
}
.mobile-month-cell.active .cnt {
  background: rgba(255, 255, 255, 0.3);
  color: #fff;
}
.mobile-month-cell.active.today .num {
  color: #fff;
}
.mobile-month-cell .num {
  font-size: 0.9rem;
  font-weight: 600;
  line-height: 1.1;
}
.mobile-month-cell .cnt {
  font-size: 0.65rem;
  background: #e3f2fd;
  color: #1565c0;
  border-radius: 8px;
  padding: 0 5px;
  font-weight: 700;
}

/* 週檢視 */
.mobile-week-day-header {
  display: flex;
  align-items: center;
  padding: 8px 4px 4px;
  margin-top: 6px;
  border-bottom: 2px solid #e0e0e0;
}
.mobile-week-day-header.is-today {
  border-bottom-color: #1976d2;
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