<template>
<v-container fluid>
<v-card class="pa-4 hg-card">
<div class="hg-head">
  <div class="hg-title">
    <span class="hg-title-project">{{ projectName }}</span>
    <span class="hg-title-sheet">{{ activeSheet === 'handover' ? '交屋控管表' : activeSheet === 'area' ? '面積找補' : '戶別資料總表' }}</span>
  </div>
  <div class="mac-form-seg hg-seg" role="tablist" aria-label="切換工作表">
    <button
      type="button"
      role="tab"
      class="mac-form-seg-btn"
      :class="{ 'is-active': activeSheet === 'grid' }"
      :aria-selected="activeSheet === 'grid'"
      @click="activeSheet = 'grid'"
    ><v-icon size="15">mdi-table-large</v-icon>戶別資料總表</button>
    <button
      type="button"
      role="tab"
      class="mac-form-seg-btn"
      :class="{ 'is-active': activeSheet === 'handover' }"
      :aria-selected="activeSheet === 'handover'"
      @click="activeSheet = 'handover'"
    ><v-icon size="15">mdi-view-grid-outline</v-icon>交屋控管表</button>
    <button
      type="button"
      role="tab"
      class="mac-form-seg-btn"
      :class="{ 'is-active': activeSheet === 'area' }"
      :aria-selected="activeSheet === 'area'"
      @click="activeSheet = 'area'"
    ><v-icon size="15">mdi-ruler-square</v-icon>面積找補</button>
  </div>
  <div class="hg-actions">
    <template v-if="activeSheet === 'grid'">
      <button type="button" class="mac-icon-btn" title="自訂欄位" aria-label="自訂欄位" @click="openFieldDefinitionDialog">
        <v-icon size="20">mdi-table-column-plus-after</v-icon>
      </button>
      <button type="button" class="mac-icon-btn" title="下載戶別資料" aria-label="下載戶別資料" @click="exportToExcel">
        <v-icon size="20">mdi-download</v-icon>
      </button>
      <button type="button" class="mac-icon-btn" title="上傳戶別資料" aria-label="上傳戶別資料" @click="uploadDialog = true">
        <v-icon size="20">mdi-upload</v-icon>
      </button>
    </template>
    <BookingGuideButton section="households" color="black" size="small" />
  </div>
</div>

<v-alert v-if="error" type="error" variant="tonal" class="mb-4" :text="error"></v-alert>

<div v-if="isLoading" class="text-center pa-10">
  <v-progress-circular indeterminate color="primary" size="64"></v-progress-circular>
  <div class="mt-4">戶別資料載入中...</div>
</div>

<div v-show="activeSheet === 'grid'">
<!-- 資料數量統計列：篩選後即時更新 -->
<div v-if="!isLoading && !error && hasInitialDataLoaded" class="d-flex align-center flex-wrap ga-2 mb-2">
  <v-chip color="primary" size="small" label variant="tonal">
    <v-icon start size="small">mdi-home-group</v-icon>
    資料總數：{{ totalRowCount.toLocaleString() }} 筆
  </v-chip>
  <v-chip v-if="isGridFiltered" color="orange-darken-2" size="small" label variant="flat">
    <v-icon start size="small">mdi-filter</v-icon>
    篩選結果：{{ displayedRowCount.toLocaleString() }} / {{ totalRowCount.toLocaleString() }} 筆
  </v-chip>

  <!-- 已套用的篩選條件明細：可逐一移除 -->
  <v-chip
    v-for="f in activeFilterChips"
    :key="f.colId"
    color="orange-darken-2"
    size="small"
    label
    variant="outlined"
    closable
    @click:close="clearColumnFilter(f.colId)"
  >
    <v-icon start size="small">mdi-filter-variant</v-icon>
    {{ f.text }}
  </v-chip>

  <v-btn
    v-if="isGridFiltered"
    size="x-small"
    variant="text"
    color="grey-darken-1"
    prepend-icon="mdi-filter-remove"
    @click="clearAllFilters"
  >清除全部篩選</v-btn>
</div>

<div v-if="!isLoading && !error" style="height: 75vh;">
  <ag-grid-vue
    v-if="hasInitialDataLoaded"
    class="ag-theme-alpine"
    style="width: 100%; height: 100%;"
    :columnDefs="finalColDefs"
    :rowData="rowData"
    :defaultColDef="defaultColDef"
    :sideBar="sideBarConfig"
    :localeText="AG_GRID_LOCALE_TW"
    :getRowId="getRowId"
    :context="gridContext"
    :enableRangeSelection="true"
    @grid-ready="onGridReady"
    @cell-value-changed="onCellValueChanged"
    @model-updated="updateRowCounts"
    @filter-changed="updateRowCounts"
  >
  </ag-grid-vue>
</div>
</div>

<!-- 交屋控管表：第一次切換時才建立，之後以 v-show 保留篩選狀態 -->
<HandoverControlBoard
  v-if="boardMounted && !isLoading && !error && hasInitialDataLoaded"
  v-show="activeSheet === 'handover'"
  :project-id="projectId"
  :project-name="projectName"
  :project-config="projectConfig"
  :households="rowData"
  :custom-field-defs="customFieldDefs"
  @open-unit="openHouseholdDetail"
  @update:settings="onBoardSettingsUpdate"
  @notify="notify"
/>

<!-- 面積找補：第一次切換時才建立 -->
<AreaSettlementBoard
  v-if="areaMounted && !isLoading && !error && hasInitialDataLoaded"
  v-show="activeSheet === 'area'"
  :project-id="projectId"
  :project-name="projectName"
  :project-config="projectConfig"
  :households="rowData"
  @notify="notify"
/>

</v-card>
<v-dialog v-model="uploadDialog" max-width="600px" persistent>
   <v-card>
     <v-card-title class="bg-red-darken-2">
       <span class="text-h5">上傳 Excel 更新戶別資料</span>
     </v-card-title>
     <v-card-text class="pt-4">
       <v-alert
         type="warning"
         color="error"
         variant="tonal"
         class="mb-4"
         title="重要提示"
         text="此操作將根據「文件ID」更新現有資料，或根據「戶號」建立新資料。支援部分欄位上傳：只需保留「文件ID（或戶號）」加上想更新的欄位，檔案中未出現的欄位不會被更動；但表頭有出現的欄位，儲存格空白會清空該戶既有資料。為避免資料遺失，強烈建議先下載目前的資料作為備份與範本。"
       ></v-alert>

       <v-file-input
         v-model="uploadedFile"
         label="選擇 Excel 檔案"
         accept=".xlsx, .xls"
         variant="outlined"
         density="compact"
         :loading="isParsing"
          @change="handleFileChange"
         @click:clear="closeUploadDialog(false)"
       ></v-file-input>

       <v-alert
         v-if="uploadMessage"
         :type="uploadMessageType"
         variant="tonal"
         class="mt-4"
         style="white-space: pre-wrap;"
         density="compact"
       >
         {{ uploadMessage }}
       </v-alert>
     </v-card-text>
     <v-card-actions>
       <v-spacer></v-spacer>
       <v-btn color="grey" variant="text" @click="closeUploadDialog(true)">取消</v-btn>
       <v-btn
         color="red"
         variant="flat"
         @click="uploadData"
         :loading="isUploading"
         :disabled="parsedData.length === 0"
       >
         確認上傳
       </v-btn>
     </v-card-actions>
   </v-card>
 </v-dialog>

 <!-- 自訂欄位管理（新增／修改／刪除／排序／匯入資料） -->
 <CustomFieldManager
   v-if="customFieldManagerMounted"
   v-model="isCustomFieldManagerOpen"
   :project-id="projectId"
   :defs="customFieldDefs"
   :households="rowData"
   :reserved-names="reservedFieldInfo.names"
   :reserved-keys="reservedFieldInfo.keys"
   @notify="showCustomFieldNotice"
 />


 <!-- Customer Message View Dialog -->
 <v-dialog v-model="isMessageDialogVisible" max-width="800px" scrollable content-class="mac-dialog-fit">
    <v-card class="mac-sheet">
       <div class="mac-sheet-head">
          <v-icon size="18">mdi-message-text-outline</v-icon>
          <span class="hg-sheet-title">戶別 {{ selectedHouseholdUnit }} 客戶回傳訊息（{{ activeMessageCount }}）</span>
          <label class="hg-inline-switch">
             <input v-model="showDeletedMessages" type="checkbox" class="mac-switch">
             <span>顯示已刪除</span>
          </label>
          <button type="button" class="mac-sheet-close hg-close" title="關閉" @click="isMessageDialogVisible = false"><v-icon size="18">mdi-close</v-icon></button>
       </div>
       <div class="mac-form hg-sheet-body">
          <div v-if="filteredMessages.length === 0" class="hg-empty">
             <v-icon size="40" color="#c7c7cc">mdi-email-open-outline</v-icon>
             <div>{{ showDeletedMessages ? '沒有任何訊息' : '沒有有效訊息' }}</div>
          </div>
          <div
             v-for="msg in filteredMessages"
             :key="msg.id"
             class="mac-form-group hg-msg-card"
             :class="{ 'is-deleted': msg.isDeleted }"
          >
             <div class="mac-form-row hg-msg-head">
                <div class="mac-form-row-main">
                   <div class="hg-msg-title">
                      <span>{{ msg.functionName || '未命名功能' }}</span>
                      <span v-if="msg.isDeleted" class="mac-tag mac-tag--red">已刪除</span>
                      <span v-if="!msg.isDeleted && msg.status === 'new'" class="mac-tag mac-tag--red">新訊息</span>
                      <span v-if="msg.createdByAdmin" class="mac-tag">後台建立</span>
                   </div>
                   <div class="hg-msg-date">
                      {{ formatMessageDate(msg.createdAt) }}
                      <span v-if="msg.isDeleted && msg.deletedAt">（刪除於 {{ formatMessageDate(msg.deletedAt) }}）</span>
                   </div>
                </div>
                <button
                   v-if="!msg.isDeleted"
                   type="button"
                   class="mac-icon-btn mac-icon-btn--danger"
                   title="刪除此訊息"
                   :disabled="messageActionLoading === msg.id"
                   @click.stop="softDeleteMessage(msg)"
                ><v-icon size="18">mdi-delete-outline</v-icon></button>
                <button
                   v-if="msg.isDeleted"
                   type="button"
                   class="mac-icon-btn hdm-ok-btn"
                   title="復原此訊息"
                   :disabled="messageActionLoading === msg.id"
                   @click.stop="restoreMessage(msg)"
                ><v-icon size="18">mdi-undo-variant</v-icon></button>
                <button
                   v-if="msg.isDeleted"
                   type="button"
                   class="mac-icon-btn mac-icon-btn--danger"
                   title="永久刪除"
                   :disabled="messageActionLoading === msg.id"
                   @click.stop="confirmHardDeleteMessage(msg)"
                ><v-icon size="18">mdi-delete-forever-outline</v-icon></button>
             </div>
             <div class="mac-form-pad">
                <div v-for="(value, key) in msg.data" :key="key" class="hdm-kv">
                   <span class="hdm-kv-key">{{ getFieldLabel(msg, key) }}</span>
                   <span class="hdm-kv-val">{{ getFieldDisplayValue(msg, key, value) }}</span>
                </div>
                <div v-if="msg.attachments && msg.attachments.length > 0" class="hdm-attachments">
                   <a v-for="file in msg.attachments" :key="file.path" :href="file.url" target="_blank" rel="noopener noreferrer" class="mac-tag mac-tag--blue hdm-attachment">
                      <v-icon size="12">mdi-paperclip</v-icon>{{ file.name }}
                   </a>
                </div>
             </div>
          </div>
       </div>
    </v-card>
 </v-dialog>

 <!-- 永久刪除確認 Dialog -->
 <v-dialog v-model="isConfirmingHardDeleteMsg" max-width="420" persistent content-class="mac-dialog-fit">
    <v-card class="mac-sheet">
       <div class="mac-sheet-head">
          <v-icon size="18" color="#d62d20">mdi-delete-forever-outline</v-icon>
          <span>永久刪除訊息</span>
       </div>
       <div class="mac-sheet-section">
          <div class="hdm-kv"><span class="hdm-kv-key">功能名稱</span><span class="hdm-kv-val">{{ hardDeleteMsgTarget?.functionName || '未命名' }}</span></div>
          <div class="hdm-kv"><span class="hdm-kv-key">提交時間</span><span class="hdm-kv-val">{{ formatMessageDate(hardDeleteMsgTarget?.createdAt) }}</span></div>
          <div class="mac-callout mac-callout--error mt-3"><v-icon size="16">mdi-alert-circle-outline</v-icon><span>刪除後無法復原。</span></div>
       </div>
       <div class="mac-sheet-foot">
          <span class="mac-spacer"></span>
          <button type="button" class="mac-btn" :disabled="messageActionLoading !== null" @click="isConfirmingHardDeleteMsg = false">取消</button>
          <button type="button" class="mac-btn mac-btn--danger-fill" :disabled="messageActionLoading !== null" @click="executeHardDeleteMessage">
             {{ messageActionLoading !== null ? '刪除中…' : '永久刪除' }}
          </button>
       </div>
    </v-card>
 </v-dialog>


  <v-dialog v-model="isConfirmingDeleteReport" max-width="440" persistent content-class="mac-dialog-fit">
   <v-card class="mac-sheet">
     <div class="mac-sheet-head">
       <v-icon size="18" color="#d62d20">mdi-file-remove-outline</v-icon>
       <span>作廢驗屋報告</span>
     </div>
     <div class="mac-sheet-section">
       <div class="hg-confirm-target">戶別 <b>{{ deleteReportRowData?.unitId }}</b>「{{ deleteReportTarget?.name }}」</div>
       <ul class="hg-confirm-list">
         <li>雲端資料夾名稱加註（作廢），檔案保留</li>
         <li>報告從清單移除，無法復原</li>
       </ul>
     </div>
     <div class="mac-sheet-foot">
       <span class="mac-spacer"></span>
       <button type="button" class="mac-btn" :disabled="isDeletingReport" @click="isConfirmingDeleteReport = false">取消</button>
       <button type="button" class="mac-btn mac-btn--danger-fill" :disabled="isDeletingReport" @click="executeDeleteReport">
         {{ isDeletingReport ? '處理中…' : '確認作廢' }}
       </button>
     </div>
   </v-card>
 </v-dialog>

  <v-dialog v-model="isConfirmingMarkDownloaded" max-width="440" persistent content-class="mac-dialog-fit">
   <v-card class="mac-sheet">
     <div class="mac-sheet-head">
       <v-icon size="18" color="#1f7a36">mdi-check-circle-outline</v-icon>
       <span>標記驗屋報告為已下載</span>
     </div>
     <div class="mac-sheet-section">
       <div class="hg-confirm-target">戶別 <b>{{ markDownloadedRowData?.unitId }}</b>「{{ markDownloadedTarget?.name }}」</div>
       <ul class="hg-confirm-list">
         <li>雲端檔案加註（已下載）</li>
         <li>LINE 小助理不再提醒未下載</li>
       </ul>
     </div>
     <div class="mac-sheet-foot">
       <span class="mac-spacer"></span>
       <button type="button" class="mac-btn" :disabled="isMarkingDownloaded" @click="isConfirmingMarkDownloaded = false">取消</button>
       <button type="button" class="mac-btn mac-btn--primary" :disabled="isMarkingDownloaded" @click="executeMarkDownloaded">
         {{ isMarkingDownloaded ? '處理中…' : '確認標記' }}
       </button>
     </div>
   </v-card>
 </v-dialog>

 <v-snackbar v-model="snackbar.show" :timeout="2000" :color="snackbar.color">
  {{ snackbar.text }}
</v-snackbar>

<!-- 戶別整合資訊 Modal（macOS 視窗風格；電腦版可拖移、不阻擋 grid 背景操作；手機全螢幕） -->
<div
   v-if="isHouseholdDetailVisible && selectedHouseholdForDetail"
   class="household-detail-modal"
   :class="{ 'is-edit-mode': isModalEditMode, 'hdm-wide': isHdmDesktopLayout, 'hdm-mobile': isHdmMobile }"
   :style="isHdmMobile ? null : { top: detailModalPos.y + 'px', left: detailModalPos.x + 'px' }"
   role="dialog"
   aria-label="戶別整合資訊"
>
   <div class="hdm-header" @mousedown="startDetailDrag">
      <div class="hdm-titles">
         <div class="hdm-title-main">
            <span class="hdm-unit">{{ selectedHouseholdForDetail.unitId }}</span>
            <span v-if="selectedHouseholdForDetail.buyerName" class="hdm-buyer">{{ selectedHouseholdForDetail.buyerName }}</span>
            <span v-if="isModalEditMode" class="mac-tag mac-tag--orange">編輯中</span>
         </div>
         <div class="hdm-title-sub">{{ projectName }} · 戶別整合資訊</div>
      </div>
      <div class="hdm-actions" @mousedown.stop>
         <button
            type="button"
            class="mac-btn"
            :class="{ 'mac-btn--primary': isModalEditMode }"
            :disabled="_isSavingModalEdits"
            :title="isModalEditMode ? '儲存所有變更並退出編輯' : '進入編輯模式'"
            @click.stop="isModalEditMode ? exitModalEditMode() : enterModalEditMode()"
         >
            <v-progress-circular v-if="_isSavingModalEdits" indeterminate size="14" width="2"></v-progress-circular>
            <v-icon v-else size="16">{{ isModalEditMode ? 'mdi-content-save-outline' : 'mdi-pencil-outline' }}</v-icon>
            <span>{{ isModalEditMode ? '儲存並退出' : '進入編輯' }}</span>
         </button>
         <button type="button" class="mac-btn" title="為此戶別新增預約（後台代填）" @click.stop="openAdminAddBookingForCurrentHousehold">
            <v-icon size="16">mdi-calendar-plus</v-icon><span>新增預約</span>
         </button>
      </div>
      <button type="button" class="mac-sheet-close hdm-close" title="關閉" aria-label="關閉" @click.stop="closeHouseholdDetail" @mousedown.stop>
         <v-icon size="18">mdi-close</v-icon>
      </button>
   </div>

   <div class="hdm-body" :class="{ 'hdm-body-split': isHdmDesktopLayout }">
      <!-- 電腦版左側「項目」導覽（系統設定風格）；窄螢幕隱藏、內容直向堆疊 -->
      <nav v-if="isHdmDesktopLayout" class="hdm-nav">
         <button
            v-for="s in hdmSections"
            :key="s.id"
            type="button"
            class="hdm-nav-item"
            :class="{ 'is-active': effectiveHdmSection === s.id }"
            @click.stop="hdmActiveSection = s.id"
            @mousedown.stop
         >
            <span class="hdm-icon" :style="{ background: s.color }"><v-icon size="15" color="#fff">{{ s.icon }}</v-icon></span>
            <span class="hdm-nav-texts">
               <span class="hdm-nav-label">{{ s.label }}</span>
               <span v-if="s.bookingType" class="hdm-nav-caption" :class="{ 'is-empty': detailBookingsForType(s.bookingType).length === 0 }">
                  {{ detailBookingsForType(s.bookingType).length > 0
                     ? (formatDetailDate(detailBookingInfo[s.bookingType]?.date) || '未填日期')
                     : '未預約' }}
               </span>
               <span v-else-if="s.id === 'auth'" class="hdm-nav-caption" :class="{ 'is-empty': authLetters.length === 0 }">
                  {{ authLetters.length > 0 ? `已授權 ${authLetters.length} 份` : '未授權' }}
               </span>
               <span v-else-if="s.id === 'messages'" class="hdm-nav-caption" :class="{ 'is-empty': modalCustomerMessages.length === 0 }">
                  {{ modalCustomerMessages.length > 0 ? `${modalCustomerMessages.length} 則訊息` : '無訊息' }}
               </span>
               <span v-else-if="s.id === 'reports'" class="hdm-nav-caption" :class="{ 'is-empty': inspectionReports.length === 0 }">
                  {{ inspectionReports.length > 0 ? `報告 ${inspectionReports.length} 份` : '無報告' }}
               </span>
            </span>
            <span
               v-if="s.bookingType && detailBookingsForType(s.bookingType).length > 1"
               class="hdm-nav-badge"
               title="此項目同時有多筆有效預約">
               {{ detailBookingsForType(s.bookingType).length }}
            </span>
         </button>
      </nav>

      <div class="hdm-content">
      <!-- 功能開關 -->
      <section v-show="isHdmSectionVisible('switches')" class="hdm-section">
         <div class="hdm-sec-head">
            <span class="hdm-icon" :style="{ background: HDM_SECTION_COLORS.switches }"><v-icon size="15" color="#fff">mdi-toggle-switch-outline</v-icon></span>
            <span class="hdm-sec-title">功能開關</span>
         </div>
         <div class="mac-form-group">
            <label v-for="sw in HDM_SWITCHES" :key="sw.field" class="mac-form-row hdm-switch-row">
               <span class="mac-form-row-main">{{ sw.label }}</span>
               <input
                  v-model="selectedHouseholdForDetail[sw.field]"
                  type="checkbox"
                  class="mac-switch"
                  :disabled="!isModalEditMode"
               >
            </label>
         </div>
      </section>

      <!-- 基本資料 -->
      <section v-show="isHdmSectionVisible('basic')" class="hdm-section">
         <div class="hdm-sec-head">
            <span class="hdm-icon" :style="{ background: HDM_SECTION_COLORS.basic }"><v-icon size="15" color="#fff">mdi-account-outline</v-icon></span>
            <span class="hdm-sec-title">基本資料</span>
         </div>
         <div class="mac-form-group">
            <div class="mac-form-row hdm-field">
               <span class="hdm-label">目前狀態</span>
               <input v-if="isModalEditMode" v-model="selectedHouseholdForDetail.currentStatus" class="hdm-input" placeholder="—">
               <span v-else class="hdm-value" :class="{ 'is-empty': !selectedHouseholdForDetail.currentStatus }">{{ selectedHouseholdForDetail.currentStatus || '—' }}</span>
            </div>
            <div class="mac-form-row hdm-field">
               <span class="hdm-label">銷售人員</span>
               <input v-if="isModalEditMode" v-model="_salespersonEditText" class="hdm-input" placeholder="多位請以空白或逗號分隔">
               <span v-else class="hdm-value" :class="{ 'is-empty': !formatSalespersons(selectedHouseholdForDetail.salesperson, '、', '') }">{{ formatSalespersons(selectedHouseholdForDetail.salesperson, '、', '') || '—' }}</span>
            </div>
            <div class="mac-form-row hdm-field">
               <span class="hdm-label">買方姓名</span>
               <input v-if="isModalEditMode" v-model="selectedHouseholdForDetail.buyerName" class="hdm-input" placeholder="—">
               <span v-else class="hdm-value" :class="{ 'is-empty': !selectedHouseholdForDetail.buyerName }">{{ selectedHouseholdForDetail.buyerName || '—' }}</span>
            </div>
            <div class="mac-form-row hdm-field">
               <span class="hdm-label">買方電話</span>
               <input v-if="isModalEditMode" v-model="selectedHouseholdForDetail.buyerPhone" class="hdm-input" type="tel" placeholder="—">
               <span v-else class="hdm-value" :class="{ 'is-empty': !selectedHouseholdForDetail.buyerPhone }">{{ selectedHouseholdForDetail.buyerPhone || '—' }}</span>
            </div>
            <div class="mac-form-row hdm-field">
               <span class="hdm-label">買方 Email</span>
               <input v-if="isModalEditMode" v-model="selectedHouseholdForDetail.buyerEmail" class="hdm-input" type="email" placeholder="—">
               <span v-else class="hdm-value" :class="{ 'is-empty': !selectedHouseholdForDetail.buyerEmail }">{{ selectedHouseholdForDetail.buyerEmail || '—' }}</span>
            </div>
            <div class="mac-form-row hdm-field">
               <span class="hdm-label">買方身分證(驗證碼)</span>
               <input v-if="isModalEditMode" v-model="selectedHouseholdForDetail.buyerIdNumber" class="hdm-input" placeholder="—">
               <span v-else class="hdm-value" :class="{ 'is-empty': !selectedHouseholdForDetail.buyerIdNumber }">{{ selectedHouseholdForDetail.buyerIdNumber || '—' }}</span>
            </div>
            <div class="mac-form-row hdm-field">
               <span class="hdm-label">車位</span>
               <input v-if="isModalEditMode" v-model="selectedHouseholdForDetail.parkingLots" class="hdm-input" placeholder="—">
               <span v-else class="hdm-value" :class="{ 'is-empty': !selectedHouseholdForDetail.parkingLots }">{{ selectedHouseholdForDetail.parkingLots || '—' }}</span>
            </div>
            <div class="mac-form-row hdm-field">
               <span class="hdm-label">門牌</span>
               <input v-if="isModalEditMode" v-model="selectedHouseholdForDetail.address" class="hdm-input" placeholder="—">
               <span v-else class="hdm-value" :class="{ 'is-empty': !selectedHouseholdForDetail.address }">{{ selectedHouseholdForDetail.address || '—' }}</span>
            </div>
            <div class="mac-form-row hdm-field">
               <span class="hdm-label">撥款日</span>
               <input
                  v-if="isModalEditMode"
                  type="date"
                  class="hdm-input hdm-input--date"
                  :value="toDateInputValue(selectedHouseholdForDetail.appropriationDate)"
                  @input="(e) => selectedHouseholdForDetail.appropriationDate = e.target.value"
               >
               <span v-else class="hdm-value" :class="{ 'is-empty': !formatDetailDate(selectedHouseholdForDetail.appropriationDate) }">
                  {{ formatDetailDate(selectedHouseholdForDetail.appropriationDate) || '—' }}
               </span>
            </div>
            <div class="mac-form-pad hdm-remarks">
               <span class="hdm-label">備註</span>
               <textarea
                  v-if="isModalEditMode"
                  v-model="selectedHouseholdForDetail.remarks"
                  class="mac-form-textarea hdm-textarea"
                  rows="4"
                  placeholder="請輸入備註…"
               ></textarea>
               <div v-else class="hdm-remarks-text" :class="{ 'is-empty': !selectedHouseholdForDetail.remarks }">{{ selectedHouseholdForDetail.remarks || '—' }}</div>
            </div>
         </div>
      </section>

      <!-- 預約資訊（依 type） -->
      <section
         v-for="type in detailBookingTypes"
         v-show="isHdmSectionVisible(`booking:${type}`)"
         :key="`bt-${type}`"
         class="hdm-section"
      >
         <div class="hdm-sec-head">
            <span class="hdm-icon" :style="{ background: HDM_SECTION_COLORS.booking }"><v-icon size="15" color="#fff">mdi-calendar-clock-outline</v-icon></span>
            <span class="hdm-sec-title">{{ type }} 預約資訊</span>
            <span
               v-if="detailBookingsForType(type).length > 1"
               class="mac-tag mac-tag--orange-fill"
               title="此項目同時有多筆有效預約">
               <v-icon size="12">mdi-alert-circle-outline</v-icon>{{ detailBookingsForType(type).length }} 筆預約
            </span>
            <span class="mac-spacer"></span>
            <button
               v-if="detailBookingsForType(type).length === 1"
               type="button"
               class="mac-btn mac-btn--sm mac-btn--danger"
               title="取消此筆預約（將通知預約人）"
               @click.stop="openCancelApptDialog(type, detailBookingsForType(type)[0])" @mousedown.stop
            ><v-icon size="15">mdi-calendar-remove</v-icon>取消預約</button>
         </div>

         <div v-if="detailBookingsForType(type).length === 0" class="mac-form-group">
            <div class="mac-form-row mac-form-empty">尚無有效預約</div>
         </div>

         <!-- 每筆有效預約一個群組（同一項目重複預約時全部並列） -->
         <div
            v-for="(bk, bkIdx) in detailBookingsForType(type)"
            :key="bk.appointmentId || `bk-${type}-${bkIdx}`"
            class="mac-form-group hdm-booking"
            :class="{ 'hdm-booking-multi': detailBookingsForType(type).length > 1 }"
         >
            <div v-if="detailBookingsForType(type).length > 1" class="mac-form-row hdm-booking-head">
               <span class="mac-tag mac-tag--orange">第 {{ bkIdx + 1 }} 筆</span>
               <span class="mac-tag" :class="bk.status === '已完成' ? 'mac-tag--green' : 'mac-tag--blue'">{{ bk.status || '預約中' }}</span>
               <span class="hdm-booking-head-date">
                  {{ formatDetailDate(bk.date) || '未填日期' }}<template v-if="bk.timeSlot">・{{ bk.timeSlot }}</template>
               </span>
               <span class="mac-spacer"></span>
               <button
                  v-if="bk.appointmentId"
                  type="button"
                  class="mac-btn mac-btn--sm mac-btn--danger"
                  title="取消這一筆預約（將通知預約人）"
                  @click.stop="openCancelApptDialog(type, bk)" @mousedown.stop
               ><v-icon size="15">mdi-calendar-remove</v-icon>取消</button>
            </div>
            <div class="mac-form-row hdm-field">
               <span class="hdm-label">預約日期</span>
               <span class="hdm-value">
                  {{ formatDetailDate(bk.date) || '—' }}
                  <span v-if="detailBookingsForType(type).length === 1 && bk.status" class="mac-tag hdm-inline-tag" :class="bk.status === '已完成' ? 'mac-tag--green' : 'mac-tag--blue'">{{ bk.status }}</span>
               </span>
            </div>
            <div class="mac-form-row hdm-field">
               <span class="hdm-label">時段</span>
               <span class="hdm-value">{{ bk.timeSlot || '—' }}</span>
            </div>
            <div class="mac-form-row hdm-field">
               <span class="hdm-label">選擇方式</span>
               <span class="hdm-value">{{ bk.method || '—' }}</span>
            </div>
            <div v-if="typesWithSubOptions.has(type)" class="mac-form-row hdm-field">
               <span class="hdm-label">子項目</span>
               <span class="hdm-value">{{ bk.subOption || '—' }}</span>
            </div>
            <div
               v-for="f in (detailExtraFieldsByType[type] || [])"
               :key="`mf-${bk.appointmentId || bkIdx}-${f.id}`"
               class="mac-form-row hdm-field"
            >
               <span class="hdm-label">{{ f.label }}</span>
               <input
                  v-if="isModalEditMode && _bookingEditDrafts[bk.appointmentId]"
                  v-model="_bookingEditDrafts[bk.appointmentId].bookingMethodDetails[f.id]"
                  class="hdm-input"
                  placeholder="—"
               >
               <span v-else class="hdm-value">{{ bk.bookingMethodDetails?.[f.id] || '—' }}</span>
            </div>
            <!-- 預約人聯絡資訊 -->
            <div class="mac-form-row hdm-field hdm-row-sep">
               <span class="hdm-label">預約人姓名</span>
               <input
                  v-if="isModalEditMode && _bookingEditDrafts[bk.appointmentId]"
                  v-model="_bookingEditDrafts[bk.appointmentId].bookerName"
                  class="hdm-input"
                  placeholder="—"
               >
               <span v-else class="hdm-value" :class="{ 'is-empty': !bk.bookerName }">{{ bk.bookerName || '—' }}</span>
            </div>
            <div class="mac-form-row hdm-field">
               <span class="hdm-label">預約人電話</span>
               <input
                  v-if="isModalEditMode && _bookingEditDrafts[bk.appointmentId]"
                  v-model="_bookingEditDrafts[bk.appointmentId].bookerPhone"
                  class="hdm-input"
                  type="tel"
                  placeholder="—"
               >
               <span v-else class="hdm-value" :class="{ 'is-empty': !bk.bookerPhone }">
                  <a v-if="bk.bookerPhone" :href="`tel:${bk.bookerPhone}`">{{ bk.bookerPhone }}</a>
                  <template v-else>—</template>
               </span>
            </div>
            <div class="mac-form-row hdm-field">
               <span class="hdm-label">預約人 Email</span>
               <input
                  v-if="isModalEditMode && _bookingEditDrafts[bk.appointmentId]"
                  v-model="_bookingEditDrafts[bk.appointmentId].bookerEmail"
                  class="hdm-input"
                  type="email"
                  placeholder="—"
               >
               <span v-else class="hdm-value" :class="{ 'is-empty': !bk.bookerEmail }">
                  <a v-if="bk.bookerEmail" :href="`mailto:${bk.bookerEmail}`">{{ bk.bookerEmail }}</a>
                  <template v-else>—</template>
               </span>
            </div>
            <!-- 驗屋報告未上傳提醒通知：未上傳天數 + 發送 + 寄出紀錄（逐筆預約獨立） -->
            <div v-if="shouldShowReminderBlock(type, bk)" class="mac-form-pad hdm-reminder">
               <div class="hdm-reminder-title">
                  <v-icon size="16" color="#c27400">mdi-email-alert-outline</v-icon>
                  <span>未上傳驗屋報告提醒</span>
                  <span v-if="getReminderRecords(bk).length > 0" class="mac-tag mac-tag--orange">已寄 {{ getReminderRecords(bk).length }} 次</span>
               </div>
               <div v-if="daysSinceNoUpload(bk) !== null" class="hdm-reminder-head">
                  <div class="hdm-reminder-days" :class="{ 'is-overdue': daysSinceNoUpload(bk) >= 0 }">
                     <v-icon size="15">mdi-clock-alert-outline</v-icon>
                     <template v-if="daysSinceNoUpload(bk) >= 0">
                        驗屋後 <strong>{{ daysSinceNoUpload(bk) }}</strong> 天未上傳報告
                     </template>
                     <template v-else>尚未到驗屋日</template>
                  </div>
                  <button
                     v-if="isTypeReminderEligible(type, bk)"
                     type="button"
                     class="mac-btn mac-btn--sm"
                     title="預覽通知內容後寄送給預約人"
                     @click.stop="openReminderDialog(type, bk)" @mousedown.stop
                  ><v-icon size="15">mdi-email-fast-outline</v-icon>發送提醒通知</button>
               </div>
               <div class="hdm-reminder-list">
                  <div v-if="getReminderRecords(bk).length === 0" class="hdm-reminder-empty">
                     {{ bk.reportUploaded ? '報告已上傳，無提醒紀錄' : '尚未寄送提醒' }}
                  </div>
                  <div
                     v-for="(sentAt, idx) in getReminderRecords(bk)"
                     :key="`rmd-${bk.appointmentId || bkIdx}-${idx}`"
                     class="hdm-reminder-item">
                     <v-icon size="13">mdi-email-fast-outline</v-icon>
                     <span>{{ sentAt }}</span>
                  </div>
               </div>
            </div>
         </div>

         <!-- 批次（戶別層級，每個項目一組，與筆數無關） -->
         <div class="mac-form-group">
            <div class="mac-form-row hdm-field">
               <span class="hdm-label">{{ type }}批次</span>
               <input
                  v-if="isModalEditMode"
                  class="hdm-input"
                  :value="getBatchCodeForType(type)"
                  placeholder="—"
                  @input="(e) => setBatchCodeForType(type, e.target.value)"
               >
               <span v-else class="hdm-value" :class="{ 'is-empty': !getBatchCodeForType(type) }">{{ getBatchCodeForType(type) || '—' }}</span>
            </div>
         </div>
      </section>

      <!-- 報告 / 其他 -->
      <section v-show="isHdmSectionVisible('reports')" class="hdm-section">
         <div class="hdm-sec-head">
            <span class="hdm-icon" :style="{ background: HDM_SECTION_COLORS.reports }"><v-icon size="15" color="#fff">mdi-file-document-outline</v-icon></span>
            <span class="hdm-sec-title">報告 / 其他</span>
         </div>
         <div class="hdm-group-label">驗屋報告<span v-if="inspectionReports.length > 0" class="hdm-group-count">{{ inspectionReports.length }}</span></div>
         <div class="mac-form-group">
            <div v-if="inspectionReports.length === 0" class="mac-form-row mac-form-empty">尚無驗屋報告</div>
            <div v-for="(file, idx) in inspectionReports" :key="`rpt-${idx}`" class="mac-form-row hdm-file-row">
               <a :href="file.url" target="_blank" rel="noopener noreferrer" class="hdm-file-link" :class="{ 'is-downloaded': file.isDownloaded }">
                  <v-icon size="18" :color="file.isDownloaded ? '#8e8e93' : '#d62d20'">mdi-file-pdf-box</v-icon>
                  <span>{{ file.name }}</span>
               </a>
               <button
                  v-if="!file.isDownloaded"
                  type="button"
                  class="mac-icon-btn hdm-ok-btn"
                  title="標記為已下載"
                  aria-label="標記為已下載"
                  @click.stop="onModalMarkReportDownloaded(file)"
               ><v-icon size="18">mdi-check-circle-outline</v-icon></button>
               <span v-else class="mac-tag mac-tag--green" title="已下載"><v-icon size="12">mdi-check</v-icon>已下載</span>
               <button
                  type="button"
                  class="mac-icon-btn mac-icon-btn--danger"
                  title="刪除"
                  aria-label="刪除"
                  @click.stop="onModalDeleteReport(file)"
               ><v-icon size="18">mdi-delete-outline</v-icon></button>
            </div>
         </div>
         <template v-if="selectedHouseholdForDetail.inspectionReportFolderUrl || selectedHouseholdForDetail.inspectionDocsUrl">
            <div class="hdm-group-label">連結</div>
            <div class="mac-form-group">
               <a
                  v-if="selectedHouseholdForDetail.inspectionReportFolderUrl"
                  :href="selectedHouseholdForDetail.inspectionReportFolderUrl"
                  target="_blank" rel="noopener"
                  class="mac-form-row mac-form-link hdm-link-row"
               >
                  <v-icon size="18" color="#0a84ff">mdi-folder-outline</v-icon>
                  <span class="mac-form-row-main">報告資料夾</span>
                  <v-icon size="16" color="#8e8e93">mdi-open-in-new</v-icon>
               </a>
               <a
                  v-if="selectedHouseholdForDetail.inspectionDocsUrl"
                  :href="selectedHouseholdForDetail.inspectionDocsUrl"
                  target="_blank" rel="noopener"
                  class="mac-form-row mac-form-link hdm-link-row"
               >
                  <v-icon size="18" color="#0a84ff">mdi-file-document-multiple-outline</v-icon>
                  <span class="mac-form-row-main">驗屋文件</span>
                  <v-icon size="16" color="#8e8e93">mdi-open-in-new</v-icon>
               </a>
            </div>
         </template>
      </section>

      <!-- 驗屋授權書 -->
      <section v-show="isHdmSectionVisible('auth')" class="hdm-section">
         <div class="hdm-sec-head">
            <span class="hdm-icon" :style="{ background: HDM_SECTION_COLORS.auth }"><v-icon size="15" color="#fff">mdi-file-sign</v-icon></span>
            <span class="hdm-sec-title">驗屋授權書</span>
            <span class="mac-tag" :class="authLetters.length > 0 ? 'mac-tag--green' : ''">
               {{ authLetters.length > 0 ? `已授權 ${authLetters.length}` : '未授權' }}
            </span>
         </div>
         <div class="mac-form-group">
            <div v-if="authLetters.length === 0" class="mac-form-row mac-form-empty">尚未上傳驗屋授權書</div>
            <div v-for="(file, idx) in authLetters" :key="`al-${idx}`" class="mac-form-pad hdm-auth-item">
               <a :href="file.url" target="_blank" rel="noopener noreferrer" class="hdm-file-link">
                  <v-icon size="18" color="#30b0c7">mdi-file-sign</v-icon>
                  <span>{{ formatAuthLetterName(file, selectedHouseholdForDetail.unitId) }}</span>
                  <v-icon size="14" color="#8e8e93">mdi-open-in-new</v-icon>
               </a>
               <div class="hdm-auth-meta">
                  <div class="hdm-auth-meta-row">
                     <span>受託人姓名</span>
                     <b :class="{ 'is-empty': !file.agentName }">{{ file.agentName || '—' }}</b>
                  </div>
                  <div class="hdm-auth-meta-row">
                     <span>與委託人關係</span>
                     <b :class="{ 'is-empty': !file.agentRelationship }">{{ file.agentRelationship || '—' }}</b>
                  </div>
                  <div class="hdm-auth-meta-row">
                     <span>受託人電話</span>
                     <b :class="{ 'is-empty': !file.agentPhone }">
                        <a v-if="file.agentPhone" :href="`tel:${file.agentPhone}`">{{ file.agentPhone }}</a>
                        <template v-else>—</template>
                     </b>
                  </div>
               </div>
            </div>
         </div>
      </section>

      <!-- 客戶回傳訊息 -->
      <section v-show="isHdmSectionVisible('messages')" class="hdm-section">
         <div class="hdm-sec-head">
            <span class="hdm-icon" :style="{ background: HDM_SECTION_COLORS.messages }"><v-icon size="15" color="#fff">mdi-message-text-outline</v-icon></span>
            <span class="hdm-sec-title">客戶回傳訊息</span>
            <span class="mac-tag" :class="modalCustomerMessages.length > 0 ? 'mac-tag--blue' : ''">{{ modalCustomerMessages.length }}</span>
            <span class="mac-spacer"></span>
            <button type="button" class="mac-btn mac-btn--sm" @click="openAddMessageDialog">
               <v-icon size="15">mdi-message-plus-outline</v-icon>新增
            </button>
            <button v-if="modalCustomerMessages.length > 0" type="button" class="mac-btn mac-btn--sm" @click="openMessageDialog(selectedHouseholdForDetail)">
               <v-icon size="15">mdi-open-in-new</v-icon>完整檢視
            </button>
         </div>
         <div class="mac-form-group">
            <div v-if="modalCustomerMessages.length === 0" class="mac-form-row mac-form-empty">尚無客戶回傳訊息</div>
            <details v-for="msg in modalCustomerMessages" :key="msg.id" class="hdm-msg">
               <summary class="hdm-msg-sum">
                  <v-icon size="16" class="hdm-msg-chev">mdi-chevron-right</v-icon>
                  <span class="hdm-msg-title">{{ msg.functionName || '未命名功能' }}</span>
                  <span v-if="msg.status === 'new'" class="mac-tag mac-tag--red">新</span>
                  <span v-if="msg.createdByAdmin" class="mac-tag">後台建立</span>
                  <span v-if="msg.attachments && msg.attachments.length > 0" class="mac-tag mac-tag--blue">
                     <v-icon size="12">mdi-paperclip</v-icon>{{ msg.attachments.length }}
                  </span>
                  <span class="hdm-msg-date">{{ formatMessageDate(msg.createdAt) }}</span>
               </summary>
               <div class="hdm-msg-body">
                  <div v-for="(value, key) in msg.data" :key="key" class="hdm-kv">
                     <span class="hdm-kv-key">{{ getFieldLabel(msg, key) }}</span>
                     <span class="hdm-kv-val">{{ getFieldDisplayValue(msg, key, value) }}</span>
                  </div>
                  <div v-if="msg.attachments && msg.attachments.length > 0" class="hdm-attachments">
                     <a v-for="file in msg.attachments" :key="file.path" :href="file.url" target="_blank" rel="noopener noreferrer" class="mac-tag mac-tag--blue hdm-attachment">
                        <v-icon size="12">mdi-paperclip</v-icon>{{ file.name }}
                     </a>
                  </div>
               </div>
            </details>
         </div>
      </section>
      </div>
   </div>
</div>

<!-- 後台新增預約對話框（從戶別整合資訊 Modal 觸發，自動預填戶別） -->
<AdminAddBookingDialog
   v-if="isAdminAddDialogVisible"
   v-model="isAdminAddDialogVisible"
   :project-id="projectId"
   :preselected-unit-id="presetUnitIdForBooking"
   @booking-success="handleAdminBookingSuccess"
/>

<!-- 後台代客戶建立回傳訊息對話框（從戶別整合資訊 Modal 觸發） -->
<v-dialog v-model="isAddMessageDialogOpen" max-width="640px" persistent scrollable content-class="mac-dialog-fit">
   <v-card class="mac-sheet">
      <div class="mac-sheet-head">
         <v-icon size="18">mdi-message-plus-outline</v-icon>
         <span>新增客戶回傳訊息</span>
         <button type="button" class="mac-sheet-close" title="關閉" :disabled="isSavingNewMessage" @click="isAddMessageDialogOpen = false"><v-icon size="18">mdi-close</v-icon></button>
      </div>
      <div class="mac-sheet-section hg-sheet-body">
         <div v-if="customerMessageConfigList.length === 0" class="mac-callout mac-callout--warning">
            <v-icon size="16">mdi-alert-outline</v-icon>
            <span>此建案尚未設定「客戶回傳功能」，請先到預約設定建立。</span>
         </div>
         <template v-else>
            <div class="mac-sheet-note mb-3">戶別 <b>{{ selectedHouseholdForDetail?.unitId }}</b>・不會通知客戶</div>
            <div class="mac-sheet-label">回傳功能</div>
            <v-select
               v-model="addMessageConfigId"
               :items="customerMessageConfigList"
               item-title="functionName"
               item-value="id"
               variant="solo" flat density="compact" class="mac-vfield mb-3" hide-details
               :menu-props="{ contentClass: 'mac-menu' }"></v-select>
            <v-form ref="addMessageFormRef">
               <DynamicFormRenderer
                  v-if="addMessageSelectedConfig && addMessageSelectedConfig.customFields && addMessageSelectedConfig.customFields.length > 0"
                  :key="addMessageConfigId"
                  :fields="addMessageSelectedConfig.customFields"
                  v-model="addMessageDynamicData" />
               <div v-else class="mac-sheet-note mb-2">此功能沒有需要填寫的欄位。</div>

               <div v-if="addMessageSelectedConfig && addMessageSelectedConfig.enableFileUpload" class="mt-2">
                  <div class="mac-sheet-label">附件（最多 10 個，單檔 30MB）</div>
                  <v-file-input v-model="addMessageFiles" placeholder="選擇圖片或 PDF" multiple chips show-size counter
                     prepend-icon="" prepend-inner-icon="mdi-paperclip"
                     variant="solo" flat density="compact" class="mac-vfield" accept="image/*,.pdf"
                     :rules="[
                        v => !v || v.length <= 10 || '最多上傳 10 個檔案',
                        v => !v || v.every(f => f.size <= 30 * 1024 * 1024) || '單一檔案不可超過 30MB'
                     ]"></v-file-input>
               </div>
            </v-form>
         </template>
      </div>
      <div class="mac-sheet-foot">
         <span class="mac-spacer"></span>
         <button type="button" class="mac-btn" :disabled="isSavingNewMessage" @click="isAddMessageDialogOpen = false">取消</button>
         <button type="button" class="mac-btn mac-btn--primary" :disabled="!addMessageSelectedConfig || isSavingNewMessage" @click="saveNewCustomerMessage">
            <v-icon size="16">mdi-content-save-outline</v-icon>{{ isSavingNewMessage ? '儲存中…' : '儲存' }}
         </button>
      </div>
   </v-card>
</v-dialog>

<!-- 未上傳驗屋報告提醒：預覽後送出 -->
<v-dialog v-model="reminderDialog.show" max-width="900px" persistent scrollable content-class="mac-dialog-fit">
   <v-card class="mac-sheet">
      <div class="mac-sheet-head">
         <v-icon size="18">mdi-email-fast-outline</v-icon>
         <span>發送「未上傳驗屋報告」提醒</span>
         <button type="button" class="mac-sheet-close" title="關閉" :disabled="reminderDialog.sending" @click="reminderDialog.show = false"><v-icon size="18">mdi-close</v-icon></button>
      </div>
      <div class="mac-sheet-section hg-sheet-body">
         <div class="mac-callout mb-4">
            <v-icon size="16">mdi-account-outline</v-icon>
            <div>
               收件人（預約人）：<b>{{ reminderDialog.bookerName || '—' }}</b>
               <span v-if="reminderDialog.bookerEmail"> &lt;{{ reminderDialog.bookerEmail }}&gt;</span>
               <span v-else class="hg-text-danger">（缺少 Email，無法寄送）</span>
               <br>預約項目：<b>{{ reminderDialog.type }}</b>
               <span v-if="reminderDialog.appointmentDate">　驗屋日：{{ reminderDialog.appointmentDate }}</span>
               <div class="mac-sheet-note">副本以密件副本（BCC）寄出，不會顯示給客戶。</div>
            </div>
         </div>

         <v-row>
            <!-- 編輯區 -->
            <v-col cols="12" md="6">
               <div class="mac-sheet-label">主旨</div>
               <v-text-field v-model="reminderDialog.subject" variant="solo" flat density="compact"
                  class="mac-vfield mb-3" hide-details></v-text-field>
               <div class="mac-sheet-label">內文</div>
               <RichTextEditor v-model="reminderDialog.body" class="mb-3" :placeholders="reminderEmailPlaceholders" />
               <div class="mac-sheet-label">提醒事項</div>
               <RichTextEditor v-model="reminderDialog.reminder" :placeholders="reminderEmailPlaceholders" />
            </v-col>
            <!-- 預覽區 -->
            <v-col cols="12" md="6">
               <div class="mac-sheet-label">即時預覽</div>
               <div class="mac-sheet-note mb-1">主旨：{{ reminderPreviewSubject }}</div>
               <div class="reminder-preview-frame" v-html="reminderPreviewHtml"></div>
            </v-col>
         </v-row>
      </div>
      <div class="mac-sheet-foot">
         <span class="mac-spacer"></span>
         <button type="button" class="mac-btn" :disabled="reminderDialog.sending" @click="reminderDialog.show = false">取消</button>
         <button type="button" class="mac-btn mac-btn--primary" :disabled="!reminderDialog.bookerEmail || reminderDialog.sending" @click="sendReminderNow">
            <v-icon size="16">mdi-send</v-icon>{{ reminderDialog.sending ? '寄送中…' : '確認送出' }}
         </button>
      </div>
   </v-card>
</v-dialog>

<!-- 取消預約確認 -->
<v-dialog v-model="cancelApptDialog.show" max-width="480px" persistent scrollable content-class="mac-dialog-fit">
   <v-card class="mac-sheet">
      <div class="mac-sheet-head">
         <v-icon size="18" color="#d62d20">mdi-calendar-remove</v-icon>
         <span>確認取消預約</span>
      </div>
      <div class="mac-sheet-section hg-sheet-body">
         <div class="mac-callout mac-callout--warning mb-3">
            <v-icon size="16">mdi-alert-outline</v-icon>
            <span>預約改為「取消」並清除戶別的驗屋日期／方式，依下方勾選寄送取消通知，無法復原。</span>
         </div>
         <div class="mac-form-group mb-3">
            <div class="mac-form-row hdm-field"><span class="hdm-label">預約項目</span><span class="hdm-value">{{ cancelApptDialog.type }}</span></div>
            <div class="mac-form-row hdm-field"><span class="hdm-label">預約日期</span><span class="hdm-value">{{ cancelApptDialog.date }}</span></div>
            <div class="mac-form-row hdm-field"><span class="hdm-label">時段</span><span class="hdm-value">{{ cancelApptDialog.timeSlot }}</span></div>
            <div class="mac-form-row hdm-field"><span class="hdm-label">預約人</span><span class="hdm-value">{{ cancelApptDialog.bookerName || '—' }}</span></div>
         </div>
         <CancelNotifyPicker v-if="cancelApptDialog.show && cancelApptDialog.appointmentId"
            :project-id="projectId"
            :appointment-id="cancelApptDialog.appointmentId"
            v-model="cancelNotifySelection" />
      </div>
      <div class="mac-sheet-foot">
         <span class="mac-spacer"></span>
         <button type="button" class="mac-btn" :disabled="cancelApptDialog.cancelling" @click="cancelApptDialog.show = false">返回</button>
         <button type="button" class="mac-btn mac-btn--danger-fill" :disabled="!cancelNotifySelection.ready || cancelApptDialog.cancelling" @click="confirmCancelAppt">
            <v-icon size="16">mdi-calendar-remove</v-icon>{{ cancelApptDialog.cancelling ? '取消中…' : '確認取消預約' }}
         </button>
      </div>
   </v-card>
</v-dialog>
</v-container>
</template>


<script setup>
import { ref, onMounted, onUnmounted, computed, reactive, watch, defineAsyncComponent } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useProjectStore } from '@/store/projectStore';
import { useUserStore } from '@/store/user';
import { listenToAllHouseholds, updateHouseholdData, batchUpdateHouseholds, uploadInspectionHouseholds, listenToFieldDefinitions, deprecateInspectionReport, markInspectionReportDownloaded, listenToAppointments, cancelAppointment, updateAppointment } from '@/api';
import CancelNotifyPicker from '@/components/CancelNotifyPicker.vue';
import BookingGuideButton from '@/components/BookingGuideButton.vue';
import SwitchHeaderRenderer from '@/components/household/SwitchHeaderRenderer.vue';
import SwitchRenderer from '@/components/household/SwitchRenderer.vue';
import CustomerMessageRenderer from '@/components/household/CustomerMessageRenderer.vue';
import * as XLSX from 'xlsx-js-style';
import "ag-grid-community/styles/ag-theme-alpine.css";
import { ModuleRegistry } from "ag-grid-community";
import { AllEnterpriseModule } from "ag-grid-enterprise";
import { AgGridVue } from "ag-grid-vue3";
// 將 AG Grid 模組註冊延後至此（原本在 main.js）：只有進入到本頁時才會載入 ag-grid 相關 chunk
ModuleRegistry.registerModules([AllEnterpriseModule]);
import { AG_GRID_LOCALE_TW } from '@/utils/agGridLocale';
import { format } from 'date-fns';
import UrlArrayRenderer from '@/components/grid/UrlArrayRenderer.vue';
import AuthLetterArrayRenderer from '@/components/grid/AuthLetterArrayRenderer.vue';
import { formatAuthLetterName, extractAuthLetterDate, getLatestAgentInfo } from '@/utils/authLetterName.js';
import { formatSalespersons, parseSalespersonsInput } from '@/utils/salespersonUtils';
import AdminAddBookingDialog from '@/components/AdminAddBookingDialog.vue';
import RichTextEditor from '@/components/RichTextEditor.vue';
import { functions, storage } from '@/firebase';
import { httpsCallable } from 'firebase/functions';
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import { Timestamp } from 'firebase/firestore';
import { AREA_FIELDS, isAreaNumberField, toNumber as toAreaNumber, fmtFixed, fmtMoney } from '@/utils/areaSettlement';
import DynamicFormRenderer from '@/components/DynamicFormRenderer.vue';
import CustomFieldManager from '@/components/household/CustomFieldManager.vue';
import { buildCustomFieldColDef, customFieldKey, isNumericFieldType, excelNumberFormat, parseNumberInput, coerceCellForField } from '@/utils/customFields';
// 交屋控管表：切換到該分頁才載入
const HandoverControlBoard = defineAsyncComponent(() => import('@/components/household/HandoverControlBoard.vue'));
// 面積找補：切換到該分頁才載入
const AreaSettlementBoard = defineAsyncComponent(() => import('@/components/household/AreaSettlementBoard.vue'));


// --- Store 和路由 ---
const route = useRoute();
const router = useRouter();
const projectStore = useProjectStore();
const userStore = useUserStore(); // Initialize User Store
const projectId = ref(route.params.projectId);

// --- AG Grid 狀態 ---
const gridApi = ref(null);
const rowData = ref([]);
const hasInitialDataLoaded = ref(false); // ✓ 用此旗標控制 Grid 的渲染

// --- 頁面狀態 ---
const isLoading = ref(true);
const error = ref(null);
const snackbar = reactive({ show: false, text: '', color: 'success' });
const notify = (text, color = 'success') => {
  snackbar.text = text;
  snackbar.color = color;
  snackbar.show = true;
};

// --- 工作表切換：戶別資料總表 / 交屋控管表（寫在網址 ?sheet=<key>，重新整理仍停在同一張） ---
// 新增分頁：把 key 加進 SHEET_KEYS；grid 為預設，不寫入網址
const SHEET_KEYS = ['grid', 'handover', 'area'];
const normalizeSheet = (value) => (SHEET_KEYS.includes(value) ? value : 'grid');
const activeSheet = ref(normalizeSheet(route.query.sheet));
const boardMounted = ref(activeSheet.value === 'handover'); // 第一次切換才建立控管表
const areaMounted = ref(activeSheet.value === 'area'); // 第一次切換才建立面積找補
watch(activeSheet, (sheet) => {
  if (sheet === 'handover') boardMounted.value = true;
  if (sheet === 'area') areaMounted.value = true;
  if (normalizeSheet(route.query.sheet) === sheet) return; // 已由網址切換（例：左側選單）
  const query = { ...route.query };
  if (sheet === 'grid') delete query.sheet;
  else query.sheet = sheet;
  router.replace({ query });
});
// 左側選單「交屋控管表」／「戶別資料管理」是同一頁，只改網址 ?sheet，頁面不重建，這裡跟著切換
watch(() => route.query.sheet, (sheet) => {
  activeSheet.value = normalizeSheet(sheet);
});
// 控管表設定（顏色、進度項目）變更：同步本地建案設定，控管表即時重算
const onBoardSettingsUpdate = (settings) => {
  projectConfig.value = { ...(projectConfig.value || {}), handoverBoard: settings };
};
let unsubscribeHouseholds = null;
let unsubscribeFields = null;
let unsubscribeAppointments = null;

// --- 預約資料 ---
const appointments = ref([]);
const appointmentsByUnitAndType = ref({});

// --- 權限與 Grid 設定 ---
const isAdmin = computed(() => {
  const adminRoles = ['超級管理員', '系統管理員'];
  return userStore.currentUserRoles.some(role => adminRoles.includes(role));
});

// 側邊欄：保留「欄位」「篩選器」兩個面板，但預設全部收合（不設 defaultToolPanel）
const sideBarConfig = ref({
  toolPanels: [
    { id: 'columns', labelDefault: 'Columns', labelKey: 'columns', iconKey: 'columns', toolPanel: 'agColumnsToolPanel' },
    { id: 'filters', labelDefault: 'Filters', labelKey: 'filters', iconKey: 'filter', toolPanel: 'agFiltersToolPanel' },
  ],
});

// 上傳功能狀態 ---
const uploadDialog = ref(false);
const uploadedFile = ref(null);// v-file-input v-model 建議使用陣列
const parsedData = ref([]);
const isParsing = ref(false);
const isUploading = ref(false);
const uploadMessage = ref('');
const uploadMessageType = ref('success');

// --- 作廢驗屋報告狀態 ---
const isConfirmingDeleteReport = ref(false);
const isDeletingReport = ref(false);
const deleteReportTarget = ref(null);
const deleteReportRowData = ref(null);

const confirmDeleteReport = (file, rowData) => {
  deleteReportTarget.value = file;
  deleteReportRowData.value = rowData;
  isConfirmingDeleteReport.value = true;
};

const executeDeleteReport = async () => {
  if (!deleteReportTarget.value || !deleteReportRowData.value) return;
  isDeletingReport.value = true;
  
  try {
    const operatorName = userStore.user?.name || '未知使用者';
    const response = await deprecateInspectionReport({
      projectId: projectId.value,
      unitId: deleteReportRowData.value._docId,
      fileUrl: deleteReportTarget.value.url,
      operatorName: operatorName
    });
    
    if (response.status === 'success') {
      snackbar.text = '報告已成功作廢並移除';
      snackbar.color = 'success';
      snackbar.show = true;
    } else {
      throw new Error(response.message || '作廢失敗');
    }
  } catch (err) {
    console.error(err);
    snackbar.text = `作廢報告失敗: ${err.message}`;
    snackbar.color = 'error';
    snackbar.show = true;
  } finally {
    isDeletingReport.value = false;
    isConfirmingDeleteReport.value = false;
    deleteReportTarget.value = null;
    deleteReportRowData.value = null;
  }
};

// --- 標記已下載狀態 ---
const isConfirmingMarkDownloaded = ref(false);
const isMarkingDownloaded = ref(false);
const markDownloadedTarget = ref(null);
const markDownloadedRowData = ref(null);

const confirmMarkDownloaded = (file, rowData) => {
  markDownloadedTarget.value = file;
  markDownloadedRowData.value = rowData;
  isConfirmingMarkDownloaded.value = true;
};

const executeMarkDownloaded = async () => {
  if (!markDownloadedTarget.value || !markDownloadedRowData.value) return;
  isMarkingDownloaded.value = true;
  
  try {
    const operatorName = userStore.user?.name || '未知使用者';
    let fileUrl = markDownloadedTarget.value.url;
    
    // 如果網址沒有附帶協議，預防性補上
    if (!fileUrl.startsWith('http')) {
        fileUrl = 'https://' + fileUrl;
    }
    
    const response = await markInspectionReportDownloaded({
      projectId: projectId.value,
      unitId: markDownloadedRowData.value._docId,
      fileUrl: fileUrl,
      operatorName: operatorName
    });
    
    if (response.status === 'success') {
      snackbar.text = '報告已成功標記為已下載';
      snackbar.color = 'success';
      snackbar.show = true;
    } else {
      throw new Error(response.message || '標記失敗');
    }
  } catch (err) {
    console.error(err);
    snackbar.text = `標記報告失敗: ${err.message}`;
    snackbar.color = 'error';
    snackbar.show = true;
  } finally {
    isMarkingDownloaded.value = false;
    isConfirmingMarkDownloaded.value = false;
    markDownloadedTarget.value = null;
    markDownloadedRowData.value = null;
  }
};

// 動態欄位相關狀態 ---
const projectConfig = ref(null); // [新增] 用於查找客戶回傳功能的設定
const customFieldDefs = ref([]);
const hasFieldsLoaded = ref(false);
// 自訂欄位管理視窗（第一次開啟才建立）
const isCustomFieldManagerOpen = ref(false);
const customFieldManagerMounted = ref(false);

// --- 處理預約資料的函數 ---
/**
 * 將 appointments 資料轉換為按 unitId × bookingType 索引的 Map
 * 頂層欄位維持「appointmentDate 最新的一筆」（供 grid 欄位/匯出沿用），
 * 另以 all 陣列保留該單位 × 類型的「所有」有效預約（依日期由舊→新排序），
 * 供戶別整合 Modal 完整檢視同一項目的重複預約
 */
const buildAppointmentMap = (appointmentsList) => {
  const map = {};

  const toEntry = (appt) => ({
    date: appt.appointmentDate || null,
    timeSlot: appt.appointmentTimeSlot || '',
    method: appt.inspectionMethod || '',                       // 純方式（不再與 subOption 合併）
    subOption: appt.bookingSubOption || '',                    // 子項目獨立屬性
    bookingMethodDetails: appt.bookingMethodDetails || {},     // 方式額外資訊（依 method.customFields）
    // 預約人聯絡資訊
    bookerName: appt.bookerName || '',
    bookerPhone: appt.bookerPhone || '',
    bookerEmail: appt.bookerEmail || '',
    // 驗屋報告未上傳提醒通知：寄出紀錄（Firestore Timestamp 陣列）與目前上傳狀態
    reminderSentAt: Array.isArray(appt.reminderSentAt) ? appt.reminderSentAt : [],
    reportUploaded: appt.reportUploaded === true,
    status: appt.status || '',
    appointmentId: appt._docId || null
  });

  appointmentsList.forEach(appt => {
    const unitId = appt.unitId;
    const bookingType = appt.bookingType;

    if (!unitId || !bookingType) return; // 跳過無效資料

    if (!map[unitId]) map[unitId] = {};
    if (!map[unitId][bookingType]) map[unitId][bookingType] = { all: [] };
    map[unitId][bookingType].all.push(toEntry(appt));
  });

  // 各桶排序（日期由舊→新，無日期排最後），並將「日期最新的一筆」攤平到頂層欄位（維持既有讀取介面）
  for (const unitId of Object.keys(map)) {
    for (const type of Object.keys(map[unitId])) {
      const bucket = map[unitId][type];
      bucket.all.sort((a, b) => {
        const ta = a.date instanceof Date ? a.date.getTime() : Infinity;
        const tb = b.date instanceof Date ? b.date.getTime() : Infinity;
        return ta - tb;
      });
      const dated = bucket.all.filter(e => e.date instanceof Date);
      const primary = dated.length > 0 ? dated[dated.length - 1] : bucket.all[0];
      Object.assign(bucket, primary);
    }
  }

  return map;
};



// --- 計算屬性 ---
const projectName = computed(() => projectStore.idToNameMap[projectId.value] || '讀取中...');
const pageTitle = computed(() => `${projectName.value} - 戶別資料總表`);
const getRowId = (params) => params.data._docId;
// 讓 Grid 內的元件（如表頭全選開關）能顯示頁面提示訊息
const gridContext = {
  notify: (text, color = 'success') => {
    snackbar.text = text;
    snackbar.color = color;
    snackbar.show = true;
  },
};

// --- AG Grid 設定 ---
const defaultColDef = {
  sortable: true,
  resizable: true,
  filter: true,
  floatingFilter: true,
  flex: 1,
  minWidth: 150,
};
const dateFormatter = (params) => {
  if (!params.value) return '';
  try { return format(new Date(params.value), 'yyyy/MM/dd'); }
  catch (e) { return ''; }
};
const linkRenderer = (params) => {
  if (!params.value) return '<span>-</span>';
  // 將文字替換為 Material Design Icon 的 HTML 標籤
  return `<a href="${params.value}" target="_blank" rel="noopener noreferrer" style="color: #1976D2; font-size: 1.2rem; text-decoration: none;">
            <i class="mdi mdi-folder"></i>
          </a>`;
};

// --- Customer Message Dialog Logic ---
const isMessageDialogVisible = ref(false);
const selectedHouseholdMessages = ref([]); // 完整陣列 (含已刪除)
const selectedHouseholdUnit = ref('');
const selectedHouseholdDocId = ref(''); // 用於寫回 Firestore
const showDeletedMessages = ref(false); // 是否顯示已刪除訊息
const messageActionLoading = ref(null); // 正在操作的訊息 ID
const isConfirmingHardDeleteMsg = ref(false);
const hardDeleteMsgTarget = ref(null);

// --- 後台代客戶建立回傳訊息 ---
const isAddMessageDialogOpen = ref(false);
const addMessageConfigId = ref(null);
const addMessageDynamicData = ref({});      // 動態表單值（依 config.customFields，鍵為 field.id）
const addMessageFiles = ref([]);
const isSavingNewMessage = ref(false);
const addMessageFormRef = ref(null);

// 此建案可用的客戶回傳功能設定（與客戶端 BookingPage 一致：列出全部）
const customerMessageConfigList = computed(() => {
   const arr = projectConfig.value?.customerMessageConfigs;
   return Array.isArray(arr) ? arr.filter(c => c && c.id) : [];
});
const addMessageSelectedConfig = computed(() =>
   customerMessageConfigList.value.find(c => c.id === addMessageConfigId.value) || null
);

// 切換回傳功能時清空已填欄位，避免殘留上一個功能的值
watch(addMessageConfigId, () => {
   addMessageDynamicData.value = {};
   addMessageFiles.value = [];
});

// 正體中文註解：過濾後的訊息列表（依據 showDeletedMessages 開關決定是否顯示已刪除項目）
const filteredMessages = computed(() => {
   if (showDeletedMessages.value) return selectedHouseholdMessages.value;
   return selectedHouseholdMessages.value.filter(m => !m.isDeleted);
});

// 正體中文註解：僅計算未刪除的訊息數量
const activeMessageCount = computed(() => {
   return selectedHouseholdMessages.value.filter(m => !m.isDeleted).length;
});

const openMessageDialog = (householdData) => {
   const msgs = householdData.customerMessages || [];
   if (msgs.length === 0) return;

   // 正體中文註解：依日期排序（含已刪除），最新的在前面
   selectedHouseholdMessages.value = [...msgs].sort((a, b) => {
      const tA = a.createdAt?.seconds || 0;
      const tB = b.createdAt?.seconds || 0;
      return tB - tA;
   });
   selectedHouseholdUnit.value = householdData.unitId;
   selectedHouseholdDocId.value = householdData._docId;
   showDeletedMessages.value = false; // 每次開啟時重置
   isMessageDialogVisible.value = true;
};

// ───────────── 戶別詳情可拖移 Modal ─────────────
const isHouseholdDetailVisible = ref(false);
const selectedHouseholdForDetail = ref(null);
const detailModalPos = ref({ x: 120, y: 80 });
// 電腦版左右分欄排版：左側「項目」導覽、右側顯示選中項目的「內容」；窄螢幕維持直向堆疊
const _hdmViewportWidth = ref(typeof window !== 'undefined' ? window.innerWidth : 1280);
const _onHdmResize = () => { _hdmViewportWidth.value = window.innerWidth; };
const isHdmDesktopLayout = computed(() => _hdmViewportWidth.value >= 900);
const isHdmMobile = computed(() => _hdmViewportWidth.value < 600); // 手機：全螢幕、不可拖移
const hdmActiveSection = ref('basic');
const isModalEditMode = ref(false); // 編輯模式總開關（預設關閉，避免誤觸修改）
const _editModeSnapshot = ref(null); // 進入編輯時的原值快照（用於退出時 diff）
const _isSavingModalEdits = ref(false);
// 預約資訊 inline 編輯草稿（依 appointmentId，同一項目多筆重複預約可各自編輯；只含可編輯欄位：預約人聯絡資訊＋方式額外資訊）
// 不直接綁 detailBookingInfo（那是共用的 appointments map），避免污染原始資料
const _bookingEditDrafts = ref({});   // { [appointmentId]: { appointmentId, type, bookerName, bookerPhone, bookerEmail, bookingMethodDetails:{...} } }
const _bookingEditSnapshot = ref({}); // 進入編輯時的預約原值快照（退出時 diff，只寫有變更的 type）
let _detailDragStart = null;

const openHouseholdDetail = (clickedRow) => {
   if (!clickedRow) return;
   // 從最新的 rowData 重新查回該戶（避免 ag-grid cellRenderer 拿到的 row 是舊版本、缺 _bookingInfo）
   const docId = clickedRow._docId;
   let base = clickedRow;
   if (docId && Array.isArray(rowData.value)) {
      const found = rowData.value.find(r => r && r._docId === docId);
      if (found) base = found;
   }
   // 做 shallow clone（含 customBatches 內層 clone），避免使用者編輯時 v-model 雙向綁定污染 rowData / appointments
   const fresh = {
      ...base,
      customBatches: { ...(base.customBatches || {}) },
      _bookingInfo: base._bookingInfo || appointmentsByUnitAndType.value[base.unitId] || {}
   };
   selectedHouseholdForDetail.value = fresh;
   isModalEditMode.value = false; // 每次開啟都重置為「檢視模式」，避免延續上次設定
   _editModeSnapshot.value = null;
   _bookingEditDrafts.value = {};
   _bookingEditSnapshot.value = {};
   hdmActiveSection.value = 'basic'; // 電腦版分欄：每次開啟預設停在「基本資料」
   isHouseholdDetailVisible.value = true;
   // 預設位置：水平置中、距頂 80px
   if (typeof window !== 'undefined') {
      const modalWidth = isHdmDesktopLayout.value ? 1000 : 720;
      detailModalPos.value = {
         x: Math.max(20, Math.floor((window.innerWidth - modalWidth) / 2)),
         y: 80
      };
   }
};

// modal 開啟期間若 appointments / rowData 有更新，同步替換顯示的戶別資料
watch([rowData, appointmentsByUnitAndType], () => {
   if (!isHouseholdDetailVisible.value) return;
   const cur = selectedHouseholdForDetail.value;
   if (!cur) return;
   const docId = cur._docId;
   if (docId && Array.isArray(rowData.value)) {
      const found = rowData.value.find(r => r && r._docId === docId);
      if (found) {
         const merged = found._bookingInfo
            ? found
            : { ...found, _bookingInfo: appointmentsByUnitAndType.value[found.unitId] || {} };
         selectedHouseholdForDetail.value = merged;
         return;
      }
   }
   // fallback：直接合併最新 _bookingInfo
   if (cur.unitId) {
      selectedHouseholdForDetail.value = { ...cur, _bookingInfo: appointmentsByUnitAndType.value[cur.unitId] || {} };
   }
}, { deep: false });
const closeHouseholdDetail = () => {
   // 點 X 關閉 = 捨棄所有未儲存變更（不寫入 Firestore；本地 shallow clone 物件會在關閉時被丟掉，rowData 不受影響）
   if (isModalEditMode.value) {
      snackbar.text = '已捨棄未儲存的變更';
      snackbar.color = 'info';
      snackbar.show = true;
   }
   isModalEditMode.value = false;
   _editModeSnapshot.value = null;
   _bookingEditDrafts.value = {};
   _bookingEditSnapshot.value = {};
   isHouseholdDetailVisible.value = false;
   selectedHouseholdForDetail.value = null;
};
const onDetailDragMove = (e) => {
   if (!_detailDragStart) return;
   const dx = e.clientX - _detailDragStart.mouseX;
   const dy = e.clientY - _detailDragStart.mouseY;
   detailModalPos.value = {
      x: _detailDragStart.modalX + dx,
      y: Math.max(0, _detailDragStart.modalY + dy)
   };
};
const onDetailDragEnd = () => {
   _detailDragStart = null;
   window.removeEventListener('mousemove', onDetailDragMove);
   window.removeEventListener('mouseup', onDetailDragEnd);
};
const startDetailDrag = (e) => {
   if (!e || e.button !== 0 || isHdmMobile.value) return; // 只接受左鍵；手機全螢幕不拖移
   _detailDragStart = {
      mouseX: e.clientX,
      mouseY: e.clientY,
      modalX: detailModalPos.value.x,
      modalY: detailModalPos.value.y
   };
   window.addEventListener('mousemove', onDetailDragMove);
   window.addEventListener('mouseup', onDetailDragEnd);
   e.preventDefault();
};

// modal 顯示用的 _bookingInfo：優先讀 appointmentsByUnitAndType，缺資料再從原始 appointments.value 即時重算
const detailBookingInfo = computed(() => {
   const h = selectedHouseholdForDetail.value;
   if (!h || !h.unitId) return {};
   const fromMap = appointmentsByUnitAndType.value?.[h.unitId];
   if (fromMap && Object.keys(fromMap).length > 0) return fromMap;
   if (Array.isArray(appointments.value) && appointments.value.length > 0) {
      const subset = appointments.value.filter(a => a && a.unitId === h.unitId);
      if (subset.length > 0) {
         return buildAppointmentMap(subset)[h.unitId] || {};
      }
   }
   return h._bookingInfo || {};
});

// 某預約項目的「所有」有效預約（同一項目重複預約時全部列出；由舊→新排序）
// 舊資料的 _bookingInfo 可能沒有 all 陣列，fallback 以頂層那筆包成單元素陣列
const detailBookingsForType = (type) => {
   const info = detailBookingInfo.value?.[type];
   if (!info) return [];
   if (Array.isArray(info.all) && info.all.length > 0) return info.all;
   return info.appointmentId ? [info] : [];
};

// 哪些 type 至少有一個未刪除 method 設了 subOptions（用於判斷是否要顯示「子項目」欄位）
const typesWithSubOptions = computed(() => {
   const result = new Set();
   if (!projectConfig.value || !Array.isArray(projectConfig.value.bookingMenu)) return result;
   for (const item of projectConfig.value.bookingMenu) {
      if (!item || item.deleted || !item.title) continue;
      const hasSubs = Array.isArray(item.methods)
         && item.methods.some(m => m && !m.deleted && Array.isArray(m.subOptions) && m.subOptions.length > 0);
      if (hasSubs) result.add(item.title);
   }
   return result;
});

// 依目前 projectConfig 的 bookingMenu 推出 modal 內可顯示的 type 清單 + 各 type 的「方式額外資訊」欄位定義
const detailBookingTypes = computed(() => {
   if (!projectConfig.value || !Array.isArray(projectConfig.value.bookingMenu)) return [];
   return projectConfig.value.bookingMenu
      .filter(i => i && !i.deleted && i.title)
      .map(i => i.title);
});

const detailExtraFieldsByType = computed(() => {
   const result = {};
   if (!projectConfig.value || !Array.isArray(projectConfig.value.bookingMenu)) return result;
   for (const item of projectConfig.value.bookingMenu) {
      if (!item || item.deleted || !item.title) continue;
      const seenLabels = new Set();
      const fields = [];
      if (Array.isArray(item.methods)) {
         for (const method of item.methods) {
            if (!method || method.deleted || !Array.isArray(method.customFields)) continue;
            for (const cf of method.customFields) {
               if (!cf || !cf.expanded || !cf.label || !cf.id) continue;
               if (seenLabels.has(cf.label)) continue;
               seenLabels.add(cf.label);
               fields.push({ id: cf.id, label: cf.label });
            }
         }
      }
      result[item.title] = fields;
   }
   return result;
});

// 各區塊圖示底色（macOS 系統設定風格的彩色圓角圖示）
const HDM_SECTION_COLORS = {
   switches: '#34C759',
   basic: '#0A84FF',
   booking: '#FF9F0A',
   reports: '#FF453A',
   auth: '#30B0C7',
   messages: '#5E5CE6',
};
// 功能開關（檢視模式唯讀，進入編輯才可切換；退出編輯時一併寫入）
const HDM_SWITCHES = [
   { field: 'showInMenu', label: '預約系統開關' },
   { field: '交屋', label: '交屋' },
   { field: 'initialReportUploadSwitch', label: '初驗報告上傳' },
   { field: 'reInspectionReportUploadSwitch', label: '複驗報告上傳' },
   { field: 'allowMultipleBookings', label: '允許重複預約' },
];

// 電腦版左右分欄：左側導覽的「項目」清單（固定區塊 + 動態預約項目）
const hdmSections = computed(() => ([
   { id: 'switches', label: '功能開關', icon: 'mdi-toggle-switch-outline', color: HDM_SECTION_COLORS.switches },
   { id: 'basic', label: '基本資料', icon: 'mdi-account-outline', color: HDM_SECTION_COLORS.basic },
   ...detailBookingTypes.value.map(t => ({
      id: `booking:${t}`, label: `${t} 預約`, icon: 'mdi-calendar-clock-outline', color: HDM_SECTION_COLORS.booking, bookingType: t
   })),
   { id: 'reports', label: '報告 / 其他', icon: 'mdi-file-document-outline', color: HDM_SECTION_COLORS.reports },
   { id: 'auth', label: '驗屋授權書', icon: 'mdi-file-sign', color: HDM_SECTION_COLORS.auth },
   { id: 'messages', label: '客戶回傳訊息', icon: 'mdi-message-text-outline', color: HDM_SECTION_COLORS.messages },
]));

// 目前選中的項目（若因 bookingMenu 變動導致 id 失效，退回「基本資料」）
const effectiveHdmSection = computed(() =>
   hdmSections.value.some(s => s.id === hdmActiveSection.value) ? hdmActiveSection.value : 'basic');

// 各內容卡片是否顯示：窄螢幕全部顯示（直向堆疊）；電腦版只顯示選中的項目
const isHdmSectionVisible = (id) => !isHdmDesktopLayout.value || effectiveHdmSection.value === id;

const formatDetailDate = (val) => {
   if (!val) return '';
   try {
      const d = val instanceof Date ? val : new Date(val);
      if (isNaN(d.getTime())) return '';
      return format(d, 'yyyy/MM/dd');
   } catch (_) {
      return '';
   }
};

// 將各種時間型別（Firestore Timestamp / Date / 字串 / 秒數物件）轉為 JS Date
const toJsDate = (val) => {
   if (!val) return null;
   try {
      if (val?.toDate && typeof val.toDate === 'function') return val.toDate();
      if (val instanceof Date) return val;
      if (typeof val?.seconds === 'number') return new Date(val.seconds * 1000);
      const d = new Date(val);
      return isNaN(d.getTime()) ? null : d;
   } catch (_) {
      return null;
   }
};

// 驗屋報告未上傳提醒通知 — 取某一筆預約的寄出紀錄（由新→舊，附完整時間字串）
const getReminderRecords = (bk) => {
   const arr = bk?.reminderSentAt;
   if (!Array.isArray(arr) || arr.length === 0) return [];
   return arr
      .map(ts => toJsDate(ts))
      .filter(d => d instanceof Date && !isNaN(d.getTime()))
      .sort((a, b) => b.getTime() - a.getTime())
      .map(d => format(d, 'yyyy/MM/dd HH:mm'));
};

// 建案的「提醒上傳條件」設定（uploadReminderConditions: [{ bookingType, methods:[..] }]）
const uploadReminderConditions = computed(() => {
   const c = projectConfig.value?.reportSettings?.uploadReminderConditions;
   return Array.isArray(c) ? c : [];
});

// 某一筆預約（含驗屋方式）是否落在「未上傳提醒」條件設定範圍內
const isTypeConfiguredForReminder = (type, bk) => {
   if (!bk) return false;
   return uploadReminderConditions.value.some(c =>
      c && c.bookingType === type &&
      Array.isArray(c.methods) && c.methods.includes(bk.method)
   );
};

// 是否可實際寄送提醒（符合條件 + 尚未上傳 + 未交屋 + 有預約人 Email）
const isTypeReminderEligible = (type, bk) => {
   if (!bk) return false;
   if (bk.reportUploaded === true) return false; // 已上傳不需提醒
   if (selectedHouseholdForDetail.value?.['交屋'] === true) return false; // 已交屋不再提醒
   if (!bk.bookerEmail) return false; // 無收件人
   return isTypeConfiguredForReminder(type, bk);
};

// 是否要顯示「未上傳提醒」區塊（符合條件設定，或曾經寄送過）
const shouldShowReminderBlock = (type, bk) =>
   isTypeConfiguredForReminder(type, bk) || getReminderRecords(bk).length > 0;

// 某一筆預約「驗屋後幾天未上傳報告」（以預約日為基準，僅在未上傳時計算）
const daysSinceNoUpload = (bk) => {
   const info = bk;
   if (!info || info.reportUploaded === true) return null;
   const d = toJsDate(info.date);
   if (!d) return null;
   const today = new Date();
   today.setHours(0, 0, 0, 0);
   const base = new Date(d);
   base.setHours(0, 0, 0, 0);
   const diff = Math.floor((today.getTime() - base.getTime()) / (1000 * 3600 * 24));
   return diff;
};

// === 未上傳驗屋報告提醒：預覽後送出 ===
const reminderEmailPlaceholders = [
   { value: '{projectName}', text: '建案名稱' },
   { value: '{unitId}', text: '戶別' },
   { value: '{bookerName}', text: '預約人姓名' },
   { value: '{appointmentDate}', text: '驗屋日期' },
];
const reminderDialog = reactive({
   show: false,
   sending: false,
   type: '',
   appointmentId: null,
   bookerEmail: '',
   bookerName: '',
   appointmentDate: '',
   subject: '',
   body: '',
   reminder: ''
});

// 將範本變數套入該戶實際資料
const fillReminderVars = (tpl) => String(tpl || '')
   .replace(/{projectName}/g, projectName.value || '')
   .replace(/{unitId}/g, selectedHouseholdForDetail.value?.unitId || '')
   .replace(/{bookerName}/g, reminderDialog.bookerName || '')
   .replace(/{appointmentDate}/g, reminderDialog.appointmentDate || '');

// 預覽用的完整 HTML（與後端信件外觀一致）
const reminderPreviewHtml = computed(() => {
   const pName = projectName.value || '';
   const body = fillReminderVars(reminderDialog.body);
   const reminder = fillReminderVars(reminderDialog.reminder);
   const uploadUrl = projectConfig.value?.reportSettings?.uploadReminderEmail?.uploadUrl || '#';
   const uploadBtn = `<p style="margin-top:25px;padding-top:20px;border-top:1px solid #eeeeee;text-align:center;"><a href="${uploadUrl}" target="_blank" style="display:inline-block;padding:10px 20px;background-color:#007bff;color:#ffffff;text-decoration:none;border-radius:5px;font-weight:bold;">點此前往上傳報告</a></p>`;
   return `
      <div style="font-family:'Helvetica Neue',Helvetica,Arial,'PingFang TC','Microsoft JhengHei',sans-serif;background-color:#f4f4f7;padding:20px;">
        <div style="max-width:600px;margin:0 auto;background-color:#ffffff;border-radius:8px;border:1px solid #e0e0e0;overflow:hidden;">
          <div style="background-color:#ab0300;color:#ffffff;padding:20px;text-align:center;"><h2 style="margin:0;font-size:24px;">驗屋報告上傳提醒</h2></div>
          <div style="padding:24px;line-height:1.6;color:#333333;">
            ${body}
            <div style="margin-top:20px;padding:15px;background-color:#f8f9fa;border-left:4px solid #17a2b8;">${reminder}</div>
            ${uploadBtn}
          </div>
          <div style="background-color:#f4f4f7;padding:16px;text-align:center;font-size:12px;color:#777777;">
            <p style="margin:0;">此為系統自動發送郵件，請勿直接回覆。</p>
            <p style="margin:5px 0 0 0;">${pName} 驗屋報告系統</p>
          </div>
        </div>
      </div>`;
});

const reminderPreviewSubject = computed(() => fillReminderVars(reminderDialog.subject));

// 開啟「預覽後送出」對話框，預填建案範本（針對指定的那一筆預約）
const openReminderDialog = (type, bk) => {
   const info = bk;
   if (!info) return;
   const tpl = projectConfig.value?.reportSettings?.uploadReminderEmail || {};
   reminderDialog.type = type;
   reminderDialog.appointmentId = info.appointmentId || null;
   reminderDialog.bookerEmail = info.bookerEmail || '';
   reminderDialog.bookerName = info.bookerName || '';
   reminderDialog.appointmentDate = formatDetailDate(info.date) || '';
   reminderDialog.subject = tpl.subject || '{projectName} {unitId} 未收到驗屋報告提醒';
   reminderDialog.body = tpl.body || '<p>您已完成驗屋，但尚未收到您的驗屋報告。</p>';
   reminderDialog.reminder = tpl.reminder || '';
   reminderDialog.sending = false;
   reminderDialog.show = true;
};

const sendReminderNow = async () => {
   const h = selectedHouseholdForDetail.value;
   if (!h || !h.unitId || !reminderDialog.type) return;
   if (!reminderDialog.bookerEmail) {
      snackbar.text = '此預約缺少預約人 Email，無法寄送';
      snackbar.color = 'error';
      snackbar.show = true;
      return;
   }
   reminderDialog.sending = true;
   try {
      const fn = httpsCallable(functions, 'sendUploadReminderForUnit');
      const res = await fn({
         projectId: projectId.value,
         unitId: h.unitId,
         bookingType: reminderDialog.type,
         appointmentId: reminderDialog.appointmentId,
         subject: reminderDialog.subject,
         body: reminderDialog.body,
         reminder: reminderDialog.reminder
      });
      snackbar.text = res?.data?.message || `已寄送提醒至 ${reminderDialog.bookerEmail}`;
      snackbar.color = 'success';
      snackbar.show = true;
      reminderDialog.show = false;
   } catch (err) {
      console.error('寄送未上傳報告提醒失敗:', err);
      snackbar.text = `寄送失敗: ${err.message || err}`;
      snackbar.color = 'error';
      snackbar.show = true;
   } finally {
      reminderDialog.sending = false;
   }
};

// === 取消預約（沿用既有後端 cancelAppointment：狀態改「取消」、清空戶別驗屋欄位、寄送取消通知信） ===
const cancelApptDialog = reactive({
   show: false,
   cancelling: false,
   type: '',
   appointmentId: null,
   date: '',
   timeSlot: '',
   bookerName: '',
   bookerEmail: ''
});

// 取消通知信收件對象勾選結果（由 CancelNotifyPicker 以 v-model 回傳）
const cancelNotifySelection = ref({ ready: false, toBooker: false, cc: [] });

const openCancelApptDialog = (type, bk) => {
   const info = bk;
   if (!info || !info.appointmentId) return;
   cancelApptDialog.type = type;
   cancelApptDialog.appointmentId = info.appointmentId;
   cancelApptDialog.date = formatDetailDate(info.date) || '—';
   cancelApptDialog.timeSlot = info.timeSlot || '—';
   cancelApptDialog.bookerName = info.bookerName || '';
   cancelApptDialog.bookerEmail = info.bookerEmail || '';
   cancelApptDialog.cancelling = false;
   cancelNotifySelection.value = { ready: false, toBooker: false, cc: [] };
   cancelApptDialog.show = true;
};

const confirmCancelAppt = async () => {
   const h = selectedHouseholdForDetail.value;
   if (!h || !h.unitId || !cancelApptDialog.appointmentId) return;
   cancelApptDialog.cancelling = true;
   try {
      const res = await cancelAppointment(
         cancelApptDialog.appointmentId,
         projectId.value,
         h.unitId,
         cancelApptDialog.type,
         { toBooker: cancelNotifySelection.value.toBooker, cc: cancelNotifySelection.value.cc }
      );
      if (res && res.status === 'error') {
         throw new Error(res.message || '取消預約失敗');
      }
      snackbar.text = `已取消 [${h.unitId}] 的「${cancelApptDialog.type}」預約`;
      snackbar.color = 'success';
      snackbar.show = true;
      cancelApptDialog.show = false;
      // listenToAppointments 的 onSnapshot 會自動更新 grid 與 modal 的預約資訊
   } catch (err) {
      console.error('取消預約失敗:', err);
      snackbar.text = `取消預約失敗: ${err.message || err}`;
      snackbar.color = 'error';
      snackbar.show = true;
   } finally {
      cancelApptDialog.cancelling = false;
   }
};

// 把 Date / Timestamp / 字串 轉為 input[type=date] 所需的 yyyy-MM-dd 字串
const toDateInputValue = (val) => {
   if (!val) return '';
   try {
      let d = val;
      if (val?.toDate && typeof val.toDate === 'function') d = val.toDate();
      else if (!(val instanceof Date)) d = new Date(val);
      if (!(d instanceof Date) || isNaN(d.getTime())) return '';
      return format(d, 'yyyy-MM-dd');
   } catch (_) {
      return '';
   }
};

// 戶別整合 Modal — 驗屋報告（可能多筆）
const inspectionReports = computed(() => {
   const arr = selectedHouseholdForDetail.value?.inspectionReportUrl;
   if (!Array.isArray(arr)) return [];
   return arr.filter(f => f && typeof f.name === 'string' && typeof f.url === 'string');
});

// 戶別整合 Modal — 驗屋授權書（可能多筆，依名稱中的日期由新→舊排序）
const authLetters = computed(() => {
   const arr = selectedHouseholdForDetail.value?.authorizationLetterUrl;
   if (!Array.isArray(arr)) return [];
   const list = arr.filter(f => f && typeof f.name === 'string' && typeof f.url === 'string');
   // 後端產生的檔名格式可能含日期，從中抽出排序（由新→舊）
   return list.slice().sort((a, b) => {
      const da = extractAuthLetterDate(a.name);
      const db = extractAuthLetterDate(b.name);
      return db.localeCompare(da);
   });
});
const onModalMarkReportDownloaded = (file) => {
   if (!selectedHouseholdForDetail.value) return;
   confirmMarkDownloaded(file, selectedHouseholdForDetail.value);
};
const onModalDeleteReport = (file) => {
   if (!selectedHouseholdForDetail.value) return;
   confirmDeleteReport(file, selectedHouseholdForDetail.value);
};

// 戶別整合 Modal — 客戶回傳訊息（未刪除筆數，依時間新→舊）
const modalCustomerMessages = computed(() => {
   const arr = selectedHouseholdForDetail.value?.customerMessages;
   if (!Array.isArray(arr)) return [];
   return arr
      .filter(m => m && !m.isDeleted)
      .sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
});

// 戶別整合 Modal — 為當前戶別新增預約（沿用 AdminAddBookingDialog）
const isAdminAddDialogVisible = ref(false);
const presetUnitIdForBooking = ref('');
const openAdminAddBookingForCurrentHousehold = () => {
   const h = selectedHouseholdForDetail.value;
   if (!h || !h.unitId) return;
   presetUnitIdForBooking.value = h.unitId;
   isAdminAddDialogVisible.value = true;
};
const handleAdminBookingSuccess = () => {
   // listenToAppointments 會自動更新 grid + modal 的預約資訊；此處只給使用者一個成功提示
   snackbar.text = `戶別 [${presetUnitIdForBooking.value}] 的預約已新增`;
   snackbar.color = 'success';
   snackbar.show = true;
};

// 戶別整合 Modal — 銷售人員編輯用文字（陣列 ↔ 「、」分隔字串）
const _salespersonEditText = ref('');

// 戶別整合 Modal — 進入編輯模式：拍一份原值快照供退出時 diff
const enterModalEditMode = () => {
   if (!selectedHouseholdForDetail.value) return;
   try {
      _editModeSnapshot.value = JSON.parse(JSON.stringify(selectedHouseholdForDetail.value));
   } catch (_) {
      _editModeSnapshot.value = { ...selectedHouseholdForDetail.value };
   }
   _salespersonEditText.value = formatSalespersons(selectedHouseholdForDetail.value.salesperson, '、', '');
   // 為每一筆「已有實際預約」建立可編輯草稿（同一項目多筆重複預約各自一份；沒有 appointmentId 的不可編輯）
   const drafts = {};
   for (const type of detailBookingTypes.value) {
      for (const bi of detailBookingsForType(type)) {
         if (!bi || !bi.appointmentId) continue;
         const bmd = { ...(bi.bookingMethodDetails || {}) };
         // 預先補上此 type 所有方式額外資訊欄位的鍵，確保 v-model 有對應槽位
         for (const f of (detailExtraFieldsByType.value[type] || [])) {
            if (!(f.id in bmd)) bmd[f.id] = '';
         }
         drafts[bi.appointmentId] = {
            appointmentId: bi.appointmentId,
            type,
            bookerName: bi.bookerName || '',
            bookerPhone: bi.bookerPhone || '',
            bookerEmail: bi.bookerEmail || '',
            bookingMethodDetails: bmd
         };
      }
   }
   _bookingEditDrafts.value = drafts;
   _bookingEditSnapshot.value = JSON.parse(JSON.stringify(drafts));
   isModalEditMode.value = true;
};

// 戶別整合 Modal — 退出編輯模式：diff 與快照、批次寫入 Firestore；無變更時直接離開
const exitModalEditMode = async () => {
   if (!isModalEditMode.value) return;
   const h = selectedHouseholdForDetail.value;
   const snap = _editModeSnapshot.value;
   if (!h || !snap || !h._docId) {
      _editModeSnapshot.value = null;
      isModalEditMode.value = false;
      return;
   }

   const boolFields = new Set(['showInMenu', '交屋', 'initialReportUploadSwitch', 'reInspectionReportUploadSwitch', 'allowMultipleBookings']);
   const textFields = ['currentStatus', 'buyerName', 'buyerPhone', 'buyerEmail', 'buyerIdNumber',
      'parkingLots', 'address', 'remarks', 'initialInspectionBatch', 'reInspectionBatch'];

   const payload = {};

   // 一般文字欄位
   for (const f of textFields) {
      const oldV = (snap[f] === '' || snap[f] === undefined) ? null : (snap[f] ?? null);
      let newV = h[f];
      if (newV === '' || newV === undefined) newV = null;
      if (oldV !== newV) payload[f] = newV;
   }

   // 布林（開關）欄位
   for (const f of boolFields) {
      const oldV = !!snap[f];
      const newV = !!h[f];
      if (oldV !== newV) payload[f] = newV;
   }

   // 銷售人員（編輯文字 → 解析為陣列，與快照比較）
   const spOld = formatSalespersons(snap.salesperson, '、', '');
   const spNewArr = parseSalespersonsInput(_salespersonEditText.value);
   const spNew = spNewArr.join('、');
   if (spOld !== spNew) payload.salesperson = spNewArr;

   // 撥款日（input type=date 字串 vs 原始 Date/Timestamp）
   const dateOld = toDateInputValue(snap.appropriationDate);
   let dateNew = h.appropriationDate;
   if (dateNew && typeof dateNew === 'object') dateNew = toDateInputValue(dateNew);
   else if (typeof dateNew === 'string' && dateNew) dateNew = dateNew.substring(0, 10);
   else dateNew = '';
   if ((dateOld || '') !== (dateNew || '')) payload.appropriationDate = dateNew || null;

   // customBatches diff（dot notation 個別欄位）
   const oldCB = snap.customBatches || {};
   const newCB = h.customBatches || {};
   const allCBKeys = new Set([...Object.keys(oldCB), ...Object.keys(newCB)]);
   for (const k of allCBKeys) {
      const o = oldCB[k] || null;
      const n = newCB[k] || null;
      if (o !== n) payload[`customBatches.${k}`] = n;
   }

   // 預約資訊 diff（寫回 appointments；以 appointmentId 逐筆處理，只寫實際有變更的預約）
   const bookingUpdates = [];
   const drafts = _bookingEditDrafts.value || {};
   const bSnap = _bookingEditSnapshot.value || {};
   for (const apptId of Object.keys(drafts)) {
      const cur = drafts[apptId];
      const old = bSnap[apptId];
      if (!cur || !cur.appointmentId || !old) continue;
      const type = cur.type;
      const bp = {};
      // 預約人聯絡資訊（純文字）
      for (const f of ['bookerName', 'bookerPhone', 'bookerEmail']) {
         if (String(old[f] ?? '') !== String(cur[f] ?? '')) bp[f] = cur[f] ?? '';
      }
      // 方式額外資訊（bookingMethodDetails）
      const oldD = old.bookingMethodDetails || {};
      const newD = cur.bookingMethodDetails || {};
      const dKeys = new Set([...Object.keys(oldD), ...Object.keys(newD)]);
      const detailChanged = [...dKeys].some(k => String(oldD[k] ?? '') !== String(newD[k] ?? ''));
      if (detailChanged) {
         bp.bookingMethodDetails = { ...newD };
         // 同步 display 陣列（與 AppointmentDetailsDialog 一致，供日曆/查詢頁顯示）
         const labelMap = {};
         for (const f of (detailExtraFieldsByType.value[type] || [])) labelMap[f.id] = f.label;
         bp.bookingMethodDetailsDisplay = Object.entries(newD).map(([id, val]) => ({
            label: labelMap[id] || id,
            value: val
         }));
      }
      if (Object.keys(bp).length > 0) {
         bookingUpdates.push({ type, appointmentId: cur.appointmentId, bookingPayload: bp });
      }
   }

   const hasHouseholdChanges = Object.keys(payload).length > 0;
   const hasBookingChanges = bookingUpdates.length > 0;

   if (!hasHouseholdChanges && !hasBookingChanges) {
      snackbar.text = '無變更';
      snackbar.color = 'info';
      snackbar.show = true;
      _editModeSnapshot.value = null;
      _bookingEditDrafts.value = {};
      _bookingEditSnapshot.value = {};
      isModalEditMode.value = false;
      return;
   }

   _isSavingModalEdits.value = true;
   try {
      if (hasHouseholdChanges) {
         await updateHouseholdData(h._docId, payload);
         // 銷售人員經獨立編輯文字解析，需手動同步回本地顯示（其餘欄位由 v-model 直接綁定）
         if ('salesperson' in payload) {
            selectedHouseholdForDetail.value = { ...selectedHouseholdForDetail.value, salesperson: payload.salesperson };
         }
      }
      // 逐筆寫回預約（僅聯絡資訊／方式額外資訊，不動日期時段，不會觸發排程衝突）
      // silent=true：此 Modal 編輯一律不寄「預約異動通知」email 給預約人
      for (const u of bookingUpdates) {
         await updateAppointment(u.appointmentId, u.bookingPayload, h._docId, {}, false, true);
      }
      const parts = [];
      if (hasHouseholdChanges) parts.push(`${Object.keys(payload).length} 個戶別欄位`);
      if (hasBookingChanges) parts.push(`${bookingUpdates.length} 筆預約`);
      snackbar.text = `已儲存 ${parts.join('、')}變更`;
      snackbar.color = 'success';
      snackbar.show = true;
   } catch (err) {
      console.error('Modal 批次儲存失敗:', err);
      snackbar.text = `儲存失敗: ${err.message}`;
      snackbar.color = 'error';
      snackbar.show = true;
      // 回滾本地至快照值（戶別欄位；預約欄位由 listener 自動還原顯示）
      try {
         selectedHouseholdForDetail.value = { ...selectedHouseholdForDetail.value, ...snap };
      } catch (_) { /* ignore */ }
   } finally {
      _isSavingModalEdits.value = false;
      _editModeSnapshot.value = null;
      _bookingEditDrafts.value = {};
      _bookingEditSnapshot.value = {};
      isModalEditMode.value = false;
   }
};

// 戶別整合 Modal — 一般欄位 inline 編輯（與 grid editable=true 的文字/日期欄位同步寫入 Firestore）
const onModalSaveField = async (field, newValue) => {
   const h = selectedHouseholdForDetail.value;
   if (!h || !h._docId) return;
   const oldValue = h[field];
   const normalised = (newValue === '' || newValue === undefined) ? null : newValue;
   if ((oldValue ?? null) === normalised) return; // 未變動就不寫
   try {
      await updateHouseholdData(h._docId, { [field]: normalised });
      selectedHouseholdForDetail.value = { ...h, [field]: normalised };
      snackbar.text = `已更新 [${field}]`;
      snackbar.color = 'success';
      snackbar.show = true;
   } catch (err) {
      console.error('Modal 編輯儲存失敗:', err);
      snackbar.text = `更新失敗: ${err.message}`;
      snackbar.color = 'error';
      snackbar.show = true;
   }
};

// 戶別整合 Modal — 將輸入值寫到 selectedHouseholdForDetail 對應位置（純本地，由退出編輯時 batch 寫入 Firestore）
const setBatchCodeForType = (type, value) => {
   const h = selectedHouseholdForDetail.value;
   if (!h) return;
   const normalised = (value === '' || value === undefined) ? null : value;
   if (type === '初驗') h.initialInspectionBatch = normalised;
   else if (type === '複驗') h.reInspectionBatch = normalised;
   else {
      if (!h.customBatches) h.customBatches = {};
      h.customBatches[type] = normalised;
   }
};

// 戶別整合 Modal — 取得 type 對應目前的批次代碼（與 grid 顯示一致：customBatches 優先、再 fallback 到 initial/reInspectionBatch）
const getBatchCodeForType = (type) => {
   const h = selectedHouseholdForDetail.value;
   if (!h) return '';
   const custom = h.customBatches?.[type];
   if (custom != null && custom !== '') return custom;
   if (type === '初驗') return h.initialInspectionBatch || '';
   if (type === '複驗') return h.reInspectionBatch || '';
   return '';
};

// 戶別整合 Modal — 批次代碼 inline 編輯（依 type 決定寫入 initialInspectionBatch / reInspectionBatch / customBatches.{type}）
const onModalSaveBatchCode = async (type, newValue) => {
   const h = selectedHouseholdForDetail.value;
   if (!h || !h._docId) return;
   const normalised = (newValue === '' || newValue === undefined) ? null : newValue;

   let payload;
   let oldValue;
   if (type === '初驗') {
      oldValue = h.initialInspectionBatch ?? null;
      payload = { initialInspectionBatch: normalised };
   } else if (type === '複驗') {
      oldValue = h.reInspectionBatch ?? null;
      payload = { reInspectionBatch: normalised };
   } else {
      oldValue = (h.customBatches && h.customBatches[type]) ?? null;
      payload = { [`customBatches.${type}`]: normalised };
   }
   if (oldValue === normalised) return;

   try {
      await updateHouseholdData(h._docId, payload);
      const next = { ...h };
      if (type === '初驗') next.initialInspectionBatch = normalised;
      else if (type === '複驗') next.reInspectionBatch = normalised;
      else next.customBatches = { ...(h.customBatches || {}), [type]: normalised };
      selectedHouseholdForDetail.value = next;
      snackbar.text = `已更新 [${type}批次]`;
      snackbar.color = 'success';
      snackbar.show = true;
   } catch (err) {
      console.error('Modal 批次儲存失敗:', err);
      snackbar.text = `更新失敗: ${err.message}`;
      snackbar.color = 'error';
      snackbar.show = true;
   }
};

// 戶別整合 Modal — 切換開關（與 grid SwitchRenderer 同步寫入 Firestore）
const onModalToggleSwitch = async (field, newValue) => {
   const h = selectedHouseholdForDetail.value;
   if (!h || !h._docId) return;
   try {
      await updateHouseholdData(h._docId, { [field]: newValue });
      // 樂觀更新本地 selectedHouseholdForDetail，避免等 onSnapshot 慢半拍
      selectedHouseholdForDetail.value = { ...h, [field]: newValue };
      snackbar.text = `戶別 [${h.unitId}] 的開關已更新`;
      snackbar.color = 'success';
      snackbar.show = true;
   } catch (err) {
      console.error('Modal 切換開關失敗:', err);
      snackbar.text = `更新失敗: ${err.message}`;
      snackbar.color = 'error';
      snackbar.show = true;
   }
};

/**
 * 正體中文註解：冷刪除 - 標記訊息為已刪除（不從陣列中移除）
 */
const softDeleteMessage = async (msg) => {
   if (!confirm(`確定要刪除「${msg.functionName || '未命名'}」的訊息嗎？`)) return;
   messageActionLoading.value = msg.id;
   try {
      // 正體中文註解：在本地陣列中找到目標訊息並標記為已刪除
      const targetMsg = selectedHouseholdMessages.value.find(m => m.id === msg.id);
      if (targetMsg) {
         targetMsg.isDeleted = true;
         targetMsg.deletedAt = { seconds: Math.floor(Date.now() / 1000), nanoseconds: 0 };
      }
      // 正體中文註解：寫回 Firestore
      await updateHouseholdData(selectedHouseholdDocId.value, {
         customerMessages: selectedHouseholdMessages.value
      });
      snackbar.text = '訊息已標記為刪除';
      snackbar.color = 'info';
      snackbar.show = true;
   } catch (err) {
      console.error('冷刪除訊息失敗:', err);
      // 正體中文註解：失敗時還原本地狀態
      const targetMsg = selectedHouseholdMessages.value.find(m => m.id === msg.id);
      if (targetMsg) {
         delete targetMsg.isDeleted;
         delete targetMsg.deletedAt;
      }
      snackbar.text = `刪除失敗: ${err.message}`;
      snackbar.color = 'error';
      snackbar.show = true;
   } finally {
      messageActionLoading.value = null;
   }
};

/**
 * 正體中文註解：復原 - 移除已刪除標記
 */
const restoreMessage = async (msg) => {
   messageActionLoading.value = msg.id;
   try {
      const targetMsg = selectedHouseholdMessages.value.find(m => m.id === msg.id);
      if (targetMsg) {
         delete targetMsg.isDeleted;
         delete targetMsg.deletedAt;
      }
      await updateHouseholdData(selectedHouseholdDocId.value, {
         customerMessages: selectedHouseholdMessages.value
      });
      snackbar.text = '訊息已成功復原';
      snackbar.color = 'success';
      snackbar.show = true;
   } catch (err) {
      console.error('復原訊息失敗:', err);
      // 正體中文註解：失敗時還原本地狀態
      const targetMsg = selectedHouseholdMessages.value.find(m => m.id === msg.id);
      if (targetMsg) {
         targetMsg.isDeleted = true;
         targetMsg.deletedAt = { seconds: Math.floor(Date.now() / 1000), nanoseconds: 0 };
      }
      snackbar.text = `復原失敗: ${err.message}`;
      snackbar.color = 'error';
      snackbar.show = true;
   } finally {
      messageActionLoading.value = null;
   }
};

/**
 * 正體中文註解：確認永久刪除 - 打開確認 Dialog
 */
const confirmHardDeleteMessage = (msg) => {
   hardDeleteMsgTarget.value = msg;
   isConfirmingHardDeleteMsg.value = true;
};

/**
 * 正體中文註解：永久刪除 - 從陣列中完全移除訊息
 */
const executeHardDeleteMessage = async () => {
   if (!hardDeleteMsgTarget.value) return;
   const msgId = hardDeleteMsgTarget.value.id;
   messageActionLoading.value = msgId;
   try {
      // 正體中文註解：從本地陣列中移除
      const idx = selectedHouseholdMessages.value.findIndex(m => m.id === msgId);
      if (idx !== -1) {
         selectedHouseholdMessages.value.splice(idx, 1);
      }
      // 正體中文註解：寫回 Firestore
      await updateHouseholdData(selectedHouseholdDocId.value, {
         customerMessages: selectedHouseholdMessages.value
      });
      snackbar.text = '訊息已永久刪除';
      snackbar.color = 'warning';
      snackbar.show = true;
   } catch (err) {
      console.error('永久刪除訊息失敗:', err);
      snackbar.text = `永久刪除失敗: ${err.message}`;
      snackbar.color = 'error';
      snackbar.show = true;
   } finally {
      messageActionLoading.value = null;
      isConfirmingHardDeleteMsg.value = false;
      hardDeleteMsgTarget.value = null;
   }
};

// 後台代客戶建立回傳訊息 — 開啟對話框（預設選第一個功能）
const openAddMessageDialog = () => {
   addMessageConfigId.value = customerMessageConfigList.value[0]?.id || null;
   addMessageDynamicData.value = {};
   addMessageFiles.value = [];
   isAddMessageDialogOpen.value = true;
};

// 後台代客戶建立回傳訊息 — 寫回 households.customerMessages（不通知客戶）
const saveNewCustomerMessage = async () => {
   const h = selectedHouseholdForDetail.value;
   const config = addMessageSelectedConfig.value;
   if (!h || !h._docId || !config) return;

   // 動態表單必填驗證
   if (addMessageFormRef.value) {
      const { valid } = await addMessageFormRef.value.validate();
      if (!valid) return;
   }

   isSavingNewMessage.value = true;
   try {
      // 1. 上傳附件（若該功能有開啟）
      const uploadedAttachments = [];
      if (config.enableFileUpload && Array.isArray(addMessageFiles.value) && addMessageFiles.value.length > 0) {
         for (const file of addMessageFiles.value) {
            const uniqueId = Date.now() + Math.floor(Math.random() * 1000);
            const storagePath = `customer-messages/${projectId.value}/${config.id}/${uniqueId}_${file.name}`;
            const fileRef = storageRef(storage, storagePath);
            const snapshot = await uploadBytes(fileRef, file);
            const downloadUrl = await getDownloadURL(snapshot.ref);
            uploadedAttachments.push({ name: file.name, url: downloadUrl, path: storagePath, size: file.size, type: file.type });
         }
      }

      // 2. 組訊息物件（與客戶端提交格式一致，另加 createdByAdmin 標記；status 用 read 不充當未讀新訊息）
      const newMsg = {
         id: crypto.randomUUID(),
         createdAt: Timestamp.now(),
         configId: config.id,
         functionName: config.functionName || config.buttonText || '未命名功能',
         data: { ...(addMessageDynamicData.value || {}) },
         attachments: uploadedAttachments,
         status: 'read',
         createdByAdmin: true
      };

      // 3. 附加到陣列並寫回（建立新陣列，避免污染共用的 rowData）
      const existing = Array.isArray(h.customerMessages) ? h.customerMessages : [];
      const newArr = [...existing, newMsg];
      await updateHouseholdData(h._docId, { customerMessages: newArr });

      // 4. 本地即時更新（households 監聽稍後也會回填）
      selectedHouseholdForDetail.value = { ...h, customerMessages: newArr };

      snackbar.text = '已新增客戶回傳訊息';
      snackbar.color = 'success';
      snackbar.show = true;
      isAddMessageDialogOpen.value = false;
   } catch (err) {
      console.error('新增客戶回傳訊息失敗:', err);
      snackbar.text = `新增失敗: ${err.message || err}`;
      snackbar.color = 'error';
      snackbar.show = true;
   } finally {
      isSavingNewMessage.value = false;
   }
};

const formatMessageDate = (timestamp) => {
   if (!timestamp) return '';
   // Firestore Timestamp to JS Date
   const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp.seconds * 1000);
   return format(date, 'yyyy/MM/dd HH:mm');
};

// --- 動態欄位相關方法 ---
// [新增] 取得欄位顯示名稱 (將 ID 轉為 Label)
// 遞迴搜尋欄位定義（涵蓋第一層 customFields、radio options 下的 subFields、以及任何巢狀 subFields）
const findFieldDef = (fields, fieldKey) => {
   if (!Array.isArray(fields)) return null;
   for (const f of fields) {
      if (!f) continue;
      if (f.id === fieldKey) return f;
      if (Array.isArray(f.options)) {
         for (const opt of f.options) {
            const subDef = findFieldDef(opt?.subFields, fieldKey);
            if (subDef) return subDef;
         }
      }
      if (Array.isArray(f.subFields)) {
         const subDef = findFieldDef(f.subFields, fieldKey);
         if (subDef) return subDef;
      }
   }
   return null;
};

const getFieldLabel = (msg, fieldKey) => {
   // 如果還沒載入設定，直接回傳 key
   if (!projectConfig.value || !projectConfig.value.customerMessageConfigs) return fieldKey;

   // 1. 找到對應的功能設定
   const config = projectConfig.value.customerMessageConfigs.find(c => c.id === msg.configId);
   if (!config || !Array.isArray(config.customFields)) return fieldKey;

   // 2. 遞迴搜尋整顆欄位樹（含 options.subFields）
   const field = findFieldDef(config.customFields, fieldKey);
   return field?.label || fieldKey;
};

// 取得 radio / select 欄位的選項 label（若 value 是 option.id 則轉為 option.label）
const getFieldDisplayValue = (msg, fieldKey, value) => {
   if (value === null || value === undefined || value === '') return value;
   if (!projectConfig.value || !projectConfig.value.customerMessageConfigs) return value;
   const config = projectConfig.value.customerMessageConfigs.find(c => c.id === msg.configId);
   if (!config || !Array.isArray(config.customFields)) return value;
   const field = findFieldDef(config.customFields, fieldKey);
   if (!field || !Array.isArray(field.options)) return value;
   const matched = field.options.find(o => o?.id === value || o?.value === value || o?.label === value);
   return matched?.label || value;
};

// 面積找補欄位（放在總表最後；欄名即 Excel 上傳表頭，數字欄存成數字）
const areaSettleColDefs = AREA_FIELDS.map((f) => {
  const numeric = isAreaNumberField(f.key);
  const def = {
    headerName: f.label,
    field: f.key,
    editable: true,
    width: f.key === 'areaSettleNote' ? 200 : 130,
    headerClass: 'hg-area-head',
    headerTooltip: '面積找補',
  };
  if (!numeric) return def;
  return {
    ...def,
    type: 'rightAligned',
    filter: 'agNumberColumnFilter',
    valueParser: (p) => {
      const s = String(p.newValue ?? '').trim();
      if (s === '') return null;
      const n = toAreaNumber(s);
      return n === null ? p.oldValue : n;
    },
    valueFormatter: (p) => {
      const n = toAreaNumber(p.value);
      if (n === null) return p.value ?? '';
      if (f.kind === 'money') return fmtMoney(n);
      if (f.kind === 'sqm') return fmtFixed(n, 2);
      return String(n);
    },
  };
});

const baseColDefs = computed(() => {
  const isUserAdmin = isAdmin.value;

  const cols = [
    { headerName: '預約系統開關', field: 'showInMenu', pinned: 'left', width: 180, editable: true, cellRenderer: SwitchRenderer, headerComponent: SwitchHeaderRenderer },
    { headerName: '交屋', field: '交屋', pinned: 'left', width: 180, editable: true, cellRenderer: SwitchRenderer, headerComponent: SwitchHeaderRenderer, valueGetter: params => !!params.data?.['交屋'] },
    { headerName: '棟別', field: 'building', width: 100, enableRowGroup: true },
    {
      headerName: '戶號',
      field: 'unitId',
      pinned: 'left',
      width: 120,
      filter: 'agTextColumnFilter',
      cellRenderer: (params) => {
        const link = document.createElement('a');
        link.textContent = params.value || '';
        link.style.cssText = 'cursor: pointer; color: #1976d2; text-decoration: underline; font-weight: 600;';
        link.title = '點擊查看戶別整合資訊';
        link.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          openHouseholdDetail(params.data);
        });
        return link;
      }
    },
    { headerName: '目前狀態', field: 'currentStatus', width: 130, editable: true },
    {
      headerName: '銷售人員', field: 'salesperson', editable: true, width: 140,
      // 存陣列、顯示以「、」串接；編輯時輸入空白/逗號/頓號分隔的多人姓名
      valueFormatter: (params) => formatSalespersons(params.value, '、', ''),
    },
    { headerName: '買方姓名', field: 'buyerName', editable: true },
     { headerName: '備註', field: 'remarks', editable: true, minWidth: 250 },
    { headerName: '買方電話', field: 'buyerPhone', editable: true, minWidth: 160 },
    { headerName: '買方Email', field: 'buyerEmail', editable: true, minWidth: 200 },
    { headerName: '買方身分證(驗證碼)', field: 'buyerIdNumber', editable: true },
    { headerName: '車位', field: 'parkingLots', editable: true },
    { headerName: '門牌', field: 'address', editable: true, minWidth: 250 },
    { headerName: '撥款日', field: 'appropriationDate', filter: 'agDateColumnFilter', valueFormatter: dateFormatter, editable: true, cellEditor: 'agDateCellEditor' },
    { headerName: '初驗批次', field: 'initialInspectionBatch', editable: true },
    { headerName: '複驗批次', field: 'reInspectionBatch', editable: true },
    { headerName: '初驗報告上傳開關', field: 'initialReportUploadSwitch', editable: true, width: 180, cellRenderer: SwitchRenderer, headerComponent: SwitchHeaderRenderer },
    { headerName: '複驗報告上傳開關', field: 'reInspectionReportUploadSwitch', editable: true, width: 180, cellRenderer: SwitchRenderer, headerComponent: SwitchHeaderRenderer },
     { headerName: '驗屋報告', field: 'inspectionReportUrl', cellRenderer: UrlArrayRenderer, minWidth: 500, flex: 3, editable: false, cellRendererParams: { onDelete: confirmDeleteReport, onDownloadMark: confirmMarkDownloaded } } ,
    { headerName: '驗屋報告資料夾', field: 'inspectionReportFolderUrl', cellRenderer: linkRenderer, minWidth: 150, flex: 1.5, editable: false },
    { headerName: '驗屋文件', field: 'inspectionDocsUrl', cellRenderer: linkRenderer, minWidth: 150, flex: 1.5, editable: false },
    { headerName: '驗屋授權書', field: 'authorizationLetterUrl', cellRenderer: AuthLetterArrayRenderer, minWidth: 220, flex: 2, editable: false },
    {
      headerName: '授權狀態',
      field: 'authorizationLetterUrl',
      colId: 'authStatus',
      width: 110,
      editable: false,
      valueGetter: (params) => {
        const arr = params.data?.authorizationLetterUrl;
        return Array.isArray(arr) ? arr.filter(f => f && f.url).length : 0;
      },
      cellRenderer: (params) => {
        const n = params.value || 0;
        if (n === 0) return '<span style="color:#9e9e9e;">未授權</span>';
        return `<span style="background-color:#e0f2f1;color:#00695c;padding:2px 8px;border-radius:10px;font-weight:500;">已授權 ×${n}</span>`;
      },
    },
    {
      headerName: '受託人姓名',
      colId: 'agentName',
      width: 130,
      editable: false,
      valueGetter: (params) => getLatestAgentInfo(params.data?.authorizationLetterUrl).agentName,
    },
    {
      headerName: '與委託人關係',
      colId: 'agentRelationship',
      width: 130,
      editable: false,
      valueGetter: (params) => getLatestAgentInfo(params.data?.authorizationLetterUrl).agentRelationship,
    },
    {
      headerName: '受託人電話',
      colId: 'agentPhone',
      width: 140,
      editable: false,
      valueGetter: (params) => getLatestAgentInfo(params.data?.authorizationLetterUrl).agentPhone,
    },
    { 
       headerName: '客戶回傳', 
       field: 'customerMessages', 
       width: 130, 
       cellRenderer: CustomerMessageRenderer,
       cellRendererParams: { onClick: (data) => openMessageDialog(data) },
       editable: false
    },

    { headerName: '允許重複預約', field: 'allowMultipleBookings', width: 140, editable: true, cellRenderer: SwitchRenderer, headerComponent: SwitchHeaderRenderer },
    ...areaSettleColDefs,
  ];

  return cols;
});

// 2. 根據從 Firestore 獲取的自訂欄位定義，動態生成 AG-Grid 欄位
const dynamicColDefs = computed(() => {
  // 自訂欄位：資料 key 用 fieldKey（舊欄位＝fieldName），數字／％ 依格式顯示並解析輸入
  const _customFieldCols = customFieldDefs.value.map(def => buildCustomFieldColDef(def, {
    switchRenderer: SwitchRenderer,
    onInvalidInput: onInvalidCustomNumber,
  }));

  // [新增] 根據專案設定中的預約項目，動態產生對應的自訂批次欄位
  const _customBatchCols = [];
  if (projectConfig.value) {
    let availableTypes = [];
    if (Array.isArray(projectConfig.value.bookingMenu) && projectConfig.value.bookingMenu.length > 0) {
      availableTypes = projectConfig.value.bookingMenu.map(item => item.title);
    } else if (Array.isArray(projectConfig.value.bookingTypes)) {
      availableTypes = projectConfig.value.bookingTypes;
    }

    // 排除已獨立硬編碼的 '初驗' 和 '複驗'
    const customTypes = availableTypes.filter(t => t !== '初驗' && t !== '複驗' && t);
    customTypes.forEach(type => {
      _customBatchCols.push({
        headerName: `${type}批次`,
        field: `customBatches.${type}`, // 使用 dot notation，AG-Grid 支援巢狀讀寫，也能直接送給 Firestore Update 處理
        editable: true,
        width: 150,
        valueGetter: params => {
          return params.data?.customBatches?.[type] || '';
        },
        valueSetter: params => {
          const newVal = params.newValue || '';
          if (!params.data.customBatches) {
            params.data.customBatches = {};
          }
          if (params.data.customBatches[type] !== newVal) {
            params.data.customBatches[type] = newVal;
            return true; // 告知 AG-Grid 資料有更新，這會觸發 onCellValueChanged
          }
          return false;
        }
      });
    });
  }

  // [新增] 根據預約項目（bookingMenu）動態產生預約資訊欄位（預約日期、時段、選擇方式）
  const _bookingInfoCols = [];
  if (projectConfig.value) {
    let availableTypes = [];
    if (Array.isArray(projectConfig.value.bookingMenu) && projectConfig.value.bookingMenu.length > 0) {
      availableTypes = projectConfig.value.bookingMenu.map(item => item.title);
    } else if (Array.isArray(projectConfig.value.bookingTypes)) {
      availableTypes = projectConfig.value.bookingTypes;
    }

    availableTypes.forEach(type => {
      // 預約日期欄位（同一項目有多筆有效預約時，於日期後加 +N 徽章提示；篩選/匯出仍用最新一筆的日期值）
      _bookingInfoCols.push({
        headerName: `${type}(預約日期)`,
        field: `_booking_${type}_date`,
        width: 140,
        editable: false,
        valueGetter: params => {
          return params.data?._bookingInfo?.[type]?.date || '';
        },
        valueFormatter: dateFormatter,
        cellRenderer: params => {
          const formatted = params.valueFormatted ?? dateFormatter(params);
          const count = params.data?._bookingInfo?.[type]?.all?.length || 0;
          if (count > 1) {
            return `${formatted} <span title="此項目同時有 ${count} 筆有效預約，開啟戶別整合資訊可檢視全部" style="display:inline-block;margin-left:4px;padding:0 6px;border-radius:10px;background:#ff7043;color:#fff;font-size:0.7rem;font-weight:700;line-height:1.5;vertical-align:middle;">+${count - 1}</span>`;
          }
          return formatted;
        },
        filter: 'agDateColumnFilter',
      });

      // 時段欄位
      _bookingInfoCols.push({
        headerName: `${type}(時段)`,
        field: `_booking_${type}_timeSlot`,
        width: 120,
        editable: false,
        valueGetter: params => {
          return params.data?._bookingInfo?.[type]?.timeSlot || '';
        },
      });

      // 選擇方式欄位（純方式）
      _bookingInfoCols.push({
        headerName: `${type}(選擇方式)`,
        field: `_booking_${type}_method`,
        width: 160,
        editable: false,
        valueGetter: params => {
          return params.data?._bookingInfo?.[type]?.method || '';
        },
      });

      // 子項目欄位（緊接著父項目「選擇方式」之後顯示；該 type 下無任何 method 設定 subOptions 時不產生此欄）
      if (typesWithSubOptions.value.has(type)) {
        _bookingInfoCols.push({
          headerName: `${type}(子項目)`,
          field: `_booking_${type}_subOption`,
          width: 160,
          editable: false,
          valueGetter: params => {
            return params.data?._bookingInfo?.[type]?.subOption || '';
          },
        });
      }

      // 方式額外資訊欄位（依 bookingMenu[type].methods[*].customFields，只取 expanded === true，於此 type 內以 label 去重）
      const menuItem = Array.isArray(projectConfig.value.bookingMenu)
        ? projectConfig.value.bookingMenu.find(i => i && !i.deleted && i.title === type)
        : null;
      if (menuItem && Array.isArray(menuItem.methods)) {
        const seenLabels = new Set();
        for (const method of menuItem.methods) {
          if (!method || method.deleted) continue;
          if (!Array.isArray(method.customFields)) continue;
          for (const cf of method.customFields) {
            if (!cf || !cf.expanded || !cf.label || !cf.id) continue;
            if (seenLabels.has(cf.label)) continue;
            seenLabels.add(cf.label);
            const fieldId = cf.id;
            const fieldType = type;
            _bookingInfoCols.push({
              headerName: `${type}(${cf.label})`,
              field: `_methodDetail_${type}_${fieldId}`,
              width: 160,
              editable: false,
              valueGetter: params => {
                const val = params.data?._bookingInfo?.[fieldType]?.bookingMethodDetails?.[fieldId];
                return val === undefined || val === null ? '' : val;
              },
            });
          }
        }
      }
    });
  }

  return [..._customFieldCols, ..._customBatchCols, ..._bookingInfoCols];
});

// 3. 組合基礎欄位和動態欄位，成為最終要在 Grid 中顯示的欄位
const finalColDefs = computed(() => {
  const baseCols = baseColDefs.value;
  const insertIndex = baseCols.findIndex(col => col.field === 'initialReportUploadSwitch');
  
  if (insertIndex !== -1) {
    return [
      ...baseCols.slice(0, insertIndex),
      ...dynamicColDefs.value,
      ...baseCols.slice(insertIndex)
    ];
  }
  
  return [...baseCols, ...dynamicColDefs.value];
});


// --- 匯出 Excel 功能 ---
const exportToExcel = () => {
  // 1. 從 colDefs 提取欄位和標頭，並在開頭加入 _docId
  //    對於只有 colId 沒有 field 的欄位（例如「受託人姓名/與委託人關係/受託人電話」），
  //    用 colId 作為 key；兩者都缺則過濾掉避免後續 key.startsWith() crash
   const exportableColDefs = finalColDefs.value.filter(def => def && (def.field || def.colId));
   const exportFields = ['_docId', ...exportableColDefs.map(def => def.field || def.colId)];
   const chineseHeaders = ['文件ID', ...exportableColDefs.map(def => def.headerName)];


  // 2. 排序資料
  const sortedItems = [...rowData.value].sort((a, b) => {
    const buildingCompare = String(a.building).localeCompare(String(b.building), 'zh-TW', { numeric: true });
    if (buildingCompare !== 0) return buildingCompare;
    return String(a.unitId).localeCompare(String(b.unitId), 'zh-TW', { numeric: true });
  });

  // 3. 轉換資料格式
  const dataAsArray = sortedItems.map(item => {
    return exportFields.map(key => {
      let value;

      // [新增] 處理預約資訊欄位（_booking_*_date, _booking_*_timeSlot, _booking_*_method）
      if (key.startsWith('_booking_') && key.endsWith('_date')) {
        // 抽取預約類型，例如從 "_booking_對保_date" 抽取 "對保"
        const typeMatch = key.match(/_booking_(.+)_date/);
        if (typeMatch) {
          const type = typeMatch[1];
          value = item._bookingInfo?.[type]?.date;
        }
      } else if (key.startsWith('_booking_') && key.endsWith('_timeSlot')) {
        const typeMatch = key.match(/_booking_(.+)_timeSlot/);
        if (typeMatch) {
          const type = typeMatch[1];
          value = item._bookingInfo?.[type]?.timeSlot;
        }
      } else if (key.startsWith('_booking_') && key.endsWith('_method')) {
        const typeMatch = key.match(/_booking_(.+)_method/);
        if (typeMatch) {
          const type = typeMatch[1];
          value = item._bookingInfo?.[type]?.method;
        }
      } else if (key.startsWith('_booking_') && key.endsWith('_subOption')) {
        const typeMatch = key.match(/_booking_(.+)_subOption/);
        if (typeMatch) {
          const type = typeMatch[1];
          value = item._bookingInfo?.[type]?.subOption;
        }
      } else if (key.startsWith('_methodDetail_')) {
        // 形如 _methodDetail_{type}_{uuid}，UUID 不含底線，從尾端切出 fieldId 即可
        const rest = key.substring('_methodDetail_'.length);
        const lastIdx = rest.lastIndexOf('_');
        if (lastIdx > 0) {
          const type = rest.substring(0, lastIdx);
          const fieldId = rest.substring(lastIdx + 1);
          value = item._bookingInfo?.[type]?.bookingMethodDetails?.[fieldId];
        }
      } else if (key === 'agentName' || key === 'agentPhone' || key === 'agentRelationship') {
        // 受託人三欄：從 authorizationLetterUrl 陣列最新一筆取出
        value = getLatestAgentInfo(item.authorizationLetterUrl)[key];
      } else if (key === 'authStatus') {
        // 授權狀態欄位（colId）：取陣列長度
        const arr = item.authorizationLetterUrl;
        const n = Array.isArray(arr) ? arr.filter(f => f && f.url).length : 0;
        value = n > 0 ? `已授權 ×${n}` : '未授權';
      } else if (key === 'salesperson') {
        // 銷售人員（陣列）：以「、」串接匯出，重新上傳時可解析回陣列
        value = formatSalespersons(item.salesperson, '、', '');
      } else if (key.includes('.')) {
        // 原有的巢狀欄位處理邏輯
        const parts = key.split('.');
        value = item;
        for (const p of parts) {
          if (value === null || value === undefined) break;
          value = value[p];
        }
      } else {
        value = item[key];
      }

      if (value instanceof Date) {
        return format(value, 'yyyy/MM/dd');
      }
      //  修正：確保 item[key] 存在才進行判斷
      if (typeof value === 'boolean') {
        return value ? 'TRUE' : 'FALSE';
      }
      if (value && typeof value.toDate === 'function') {
        return format(value.toDate(), 'yyyy/MM/dd');
      }
      return value ?? ''; // 使用空值合併運算符處理 null 和 undefined
    });
  });

  // 4. 建立 Excel 工作表
  const warningRow = ['注意：為確保資料能正確重新上傳，請勿修改第二列的標頭名稱 (特別是第一欄的 文件ID)。'];
  const dataWithHeader = [warningRow, chineseHeaders, ...dataAsArray];
  const ws = XLSX.utils.aoa_to_sheet(dataWithHeader);

  // 5. 設定樣式與格式
  const warningStyle = { font: { color: { rgb: "FFFF0000" }, bold: true }, fill: { fgColor: { rgb: "FFFFFF00" } } };
  ws['A1'].s = warningStyle;
  if (!ws['!merges']) ws['!merges'] = [];
  ws['!merges'].push({ s: { r: 0, c: 0 }, e: { r: 0, c: exportFields.length - 1 } });

  const headerStyle = { font: { bold: true }, fill: { fgColor: { rgb: "FFD3D3D3" } } };
  const range = XLSX.utils.decode_range(ws['!ref']);
  for (let C = range.s.c; C <= range.e.c; ++C) {
    const address = XLSX.utils.encode_cell({ r: 1, c: C });
    if(ws[address]) ws[address].s = headerStyle;
  }
  ws['!freeze'] = { ySplit: 2 };

  // 5-1. 電話欄位設為「文字格式」，避免使用者用 Excel 開檔／編輯時把開頭 0 去掉
  const phoneHeaderNames = ['買方電話', '受託人電話'];
  const phoneColIndexes = chineseHeaders
    .map((h, i) => (phoneHeaderNames.includes(h) ? i : -1))
    .filter(i => i !== -1);
  for (const C of phoneColIndexes) {
    // 資料列從第 3 列（索引 2）開始（第 1 列警語、第 2 列標頭）
    for (let R = 2; R <= range.e.r; ++R) {
      const address = XLSX.utils.encode_cell({ r: R, c: C });
      const cell = ws[address];
      if (!cell || cell.v === null || cell.v === undefined || cell.v === '') continue;
      cell.t = 's';           // 強制為文字型
      cell.v = String(cell.v);
      cell.z = '@';           // 儲存格數值格式設為文字，Excel 才會保留開頭 0
    }
  }

  // 5-2. 自訂數字／％ 欄：寫成真數字（可加總），顯示千分位、小數、單位或 %
  customFieldDefs.value.forEach(def => {
    if (!isNumericFieldType(def.fieldType)) return;
    const C = exportFields.indexOf(customFieldKey(def));
    if (C === -1) return;
    const numFmt = excelNumberFormat(def);
    for (let R = 2; R <= range.e.r; ++R) {
      const cell = ws[XLSX.utils.encode_cell({ r: R, c: C })];
      if (!cell || cell.v === null || cell.v === undefined || cell.v === '') continue;
      const r = parseNumberInput(cell.v);
      if (!r.ok) continue; // 讀不出數字的舊資料照原文
      cell.t = 'n';
      cell.v = r.value;
      cell.z = numFmt;
      cell.s = { ...(cell.s || {}), numFmt };
    }
  });

  // 6. 產生並下載檔案
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, '戶別資料總表');
  const exportFileName = `${projectName.value || '建案'}_戶別資料總表_${format(new Date(), 'yyyy-MM-dd')}.xlsx`;
  XLSX.writeFile(wb, exportFileName);
};

//  --- START: 上傳功能方法 ---

// 關閉並重置上傳對話框
const closeUploadDialog = (isManualClose = true) => {
  uploadDialog.value = false;
  if (isManualClose) {
      uploadedFile.value = null; 
      parsedData.value = [];
      uploadMessage.value = '';
  }
};


// 處理檔案選擇與解析
// 處理檔案選擇與解析
const handleFileChange = () => {
  console.log('handleFileChange triggered.');
  uploadMessage.value = '';
  const file = uploadedFile.value;
  if (!file) {
    parsedData.value = [];
    return;
  }
  isParsing.value = true;
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const data = new Uint8Array(e.target.result);
      const workbook = XLSX.read(data, { type: 'array', cellDates: true });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];

      const dataAsArrays = XLSX.utils.sheet_to_json(worksheet, { header: 1, range: 1 });

      if (dataAsArrays.length < 1) {
        throw new Error(`檔案缺少標頭列。`);
      }

      // 建立標頭對應表（白名單制：僅接受「可編輯欄位＋識別欄位」，唯讀/衍生欄位一律忽略，
      // 避免授權狀態、驗屋報告、預約資訊等顯示用欄位被寫回資料庫覆蓋原始資料）
      const uploadedHeaders = dataAsArrays[0].map(h => String(h || '').trim());
      const headerMap = new Map();
      headerMap.set('文件ID', '_docId');
      headerMap.set('戶號', 'unitId');
      headerMap.set('棟別', 'building'); // 非編輯欄位，但新增戶別時需要
      // 驗屋報告資料夾／驗屋文件：Grid 內唯讀（避免誤點誤改），但開放透過 Excel 上傳批次設定連結
      headerMap.set('驗屋報告資料夾', 'inspectionReportFolderUrl');
      headerMap.set('驗屋文件', 'inspectionDocsUrl');
      finalColDefs.value.forEach(def => {
        if (def && def.editable === true && def.field) headerMap.set(def.headerName, def.field);
      });

      // 驗證標頭：支援「部分欄位上傳」——只更新檔案中有出現的欄位，其餘欄位不受影響。
      // 最低要求：「文件ID」或「戶號」至少其一（定位資料），且至少一個可更新的資料欄位。
      if (!uploadedHeaders.includes('文件ID') && !uploadedHeaders.includes('戶號')) {
        throw new Error('檔案缺少識別欄位：表頭至少需要「文件ID」或「戶號」其中一欄。');
      }
      const updatableHeaders = uploadedHeaders.filter(h =>
        headerMap.has(h) && h !== '文件ID' && h !== '戶號'
      );
      if (updatableHeaders.length === 0) {
        throw new Error('檔案中沒有任何可更新的資料欄位，請至少包含一個欄位（例如：銷售人員）。');
      }
      const ignoredHeaders = uploadedHeaders.filter(h => h && !headerMap.has(h));

      const dataRows = dataAsArrays.slice(1);
      const nonEmptyRows = dataRows.filter(row => row.some(cell => cell !== null && cell !== undefined && cell !== ''));

      // 自訂開關／數字／％ 欄：依格式轉換；％ 需要 Excel 顯示文字判斷是 5 還是 0.05
      const typedCustomDefs = new Map(customFieldDefs.value
        .filter(d => d.fieldType === 'checkbox' || isNumericFieldType(d.fieldType))
        .map(d => [customFieldKey(d), d]));
      const formattedArrays = typedCustomDefs.size
        ? XLSX.utils.sheet_to_json(worksheet, { header: 1, range: 1, raw: false })
        : [];
      const formattedByRow = new Map(dataRows.map((row, i) => [row, formattedArrays[i + 1] || []]));
      let invalidCustomCells = 0;

      const jsonDataWithEnglishKeys = nonEmptyRows.map(rowArray => {
        const newRow = {};
        uploadedHeaders.forEach((header, index) => {
          const key = headerMap.get(header);
          if (key) {
            let val = rowArray[index] ?? null;

            if (key === 'allowMultipleBookings' || key === 'showInMenu' || key === 'initialReportUploadSwitch' || key === 'reInspectionReportUploadSwitch' || key === '交屋') {
              if (typeof val === 'string') {
                const upperVal = val.toUpperCase().trim();
                if (upperVal === 'TRUE') val = true;
                if (upperVal === 'FALSE') val = false;
              }
            }

            // 銷售人員：上傳字串（空白/逗號/頓號分隔多人）→ 解析為陣列
            if (key === 'salesperson') {
              val = parseSalespersonsInput(val);
            }

            // 電話欄位救援：Excel 常把開頭 0 的電話當成數字，導致前導 0 被去掉。
            // 台灣電話號碼皆為 0 開頭，且只會掉最前面那一個 0，故對「純數字」的電話補回一個 0。
            if (key === 'buyerPhone' || key === 'agentPhone') {
              if (typeof val === 'number' && Number.isFinite(val)) {
                // 數字型 → Excel 已去掉開頭 0，補回
                val = '0' + String(val);
              } else if (typeof val === 'string') {
                const trimmed = val.trim();
                // 純數字字串但沒有 0 開頭（例如被當數字貼上）也補回；其餘（含分隔符、已 0 開頭）保持原樣
                if (/^\d+$/.test(trimmed) && !trimmed.startsWith('0')) {
                  val = '0' + trimmed;
                } else {
                  val = trimmed;
                }
              }
            }

            const customDef = typedCustomDefs.get(key);
            if (customDef) {
              const r = coerceCellForField(customDef, { v: val, w: formattedByRow.get(rowArray)?.[index] });
              if (r.empty) val = null;
              else if (r.ok) val = r.value;
              else { invalidCustomCells++; return; } // 讀不出數字：這格不更新
            }

            if (key === '_docId' && (val === null || val === undefined || val === '')) {
                 newRow[key] = null;
            } else if (key.includes('.')) {
                 const parts = key.split('.');
                 let current = newRow;
                 for (let i = 0; i < parts.length - 1; i++) {
                     if (!current[parts[i]]) current[parts[i]] = {};
                     current = current[parts[i]];
                 }
                 current[parts[parts.length - 1]] = val;
            } else {
                 newRow[key] = val;
            }
          }
        });
        if (!newRow._docId && !newRow.unitId) {
            throw new Error("資料驗證失敗：新增的資料行必須包含『戶號』。請檢查上傳的檔案。");
        }
        return newRow;
      });

      parsedData.value = jsonDataWithEnglishKeys;
      uploadMessageType.value = 'success';
      const msgLines = [
        `成功解析 ${jsonDataWithEnglishKeys.length} 筆資料，可以開始上傳。`,
        `本次將更新欄位：${updatableHeaders.join('、')}`,
        '（表頭有出現的欄位，儲存格空白會「清空」該戶的既有資料；未出現的欄位不受影響）',
      ];
      const newRowCount = jsonDataWithEnglishKeys.filter(r => !r._docId).length;
      if (newRowCount > 0) msgLines.push(`其中 ${newRowCount} 筆為「新增」戶別（無文件ID）。`);
      if (ignoredHeaders.length > 0) msgLines.push(`已忽略唯讀或無法辨識的欄位：${ignoredHeaders.join('、')}`);
      if (invalidCustomCells > 0) msgLines.push(`自訂欄位有 ${invalidCustomCells} 格格式不符，這些格子不更新。`);
      uploadMessage.value = msgLines.join('\n');
    } catch (err) {
      uploadMessageType.value = 'error';
      uploadMessage.value = err.message || '解析檔案失敗，請使用系統匯出的範本。';
      parsedData.value = [];
    } finally {
      isParsing.value = false;
    }
  };
  reader.readAsArrayBuffer(file);
};

// 執行上傳
const uploadData = async () => {
  if (parsedData.value.length === 0) {
    uploadMessageType.value = 'warning';
    uploadMessage.value = '沒有可上傳的資料。';
    return;
  }
  isUploading.value = true;
  uploadMessage.value = '';
  try {
    const result = await uploadInspectionHouseholds(projectId.value, parsedData.value);
    if (result.status === 'success') {
      uploadMessageType.value = 'success';
      uploadMessage.value = result.message || '戶別資料已成功上傳更新！';
      setTimeout(() => closeUploadDialog(true), 2000);
      snackbar.text = '資料上傳成功！畫面將自動更新。';
      snackbar.color = 'success';
      snackbar.show = true;
    } else {
      throw new Error(result.message || '發生未知錯誤');
    }
  } catch (err) {
    uploadMessageType.value = 'error';
    uploadMessage.value = `上傳失敗: ${err.message}`;
  } finally {
    isUploading.value = false;
  }
};

// 「自訂欄位」管理 ---
const openFieldDefinitionDialog = () => {
  customFieldManagerMounted.value = true;
  isCustomFieldManagerOpen.value = true;
};

const showCustomFieldNotice = (text, color = 'success') => {
  snackbar.text = text;
  snackbar.color = color;
  snackbar.show = true;
};

// 系統欄位的名稱與資料 key：自訂欄位不可同名，新欄位的 key 也要避開
const reservedFieldInfo = computed(() => {
  const customKeys = new Set(customFieldDefs.value.map(customFieldKey));
  const names = new Set(['文件ID', '戶號', '棟別', '驗屋報告資料夾', '驗屋文件']);
  const keys = new Set(['_docId', '_bookingInfo', 'projectId', 'unitId', 'building', 'inspectionReportFolderUrl', 'inspectionDocsUrl', 'customBatches', 'customerMessages']);
  for (const col of finalColDefs.value) {
    if (!col) continue;
    const key = col.field || col.colId;
    if (key && customKeys.has(key)) continue;
    if (col.headerName) names.add(col.headerName);
    if (key) keys.add(key);
  }
  return { names: [...names], keys: [...keys] };
});

// 數字／％ 欄打了讀不出數字的內容
let invalidNumberNoticeTimer = null;
const onInvalidCustomNumber = (def) => {
  clearTimeout(invalidNumberNoticeTimer);
  invalidNumberNoticeTimer = setTimeout(() => {
    showCustomFieldNotice(`「${def.fieldName}」請輸入數字`, 'warning');
  }, 50);
};


// ✓ 【修改】簡化 onGridReady，只用來獲取 gridApi
const onGridReady = (params) => {
  console.log("AG Grid 已就緒");
  gridApi.value = params.api;
  updateRowCounts();
};

// --- 資料數量統計（顯示於表格頂部，篩選後即時重算） ---
const displayedRowCount = ref(0);
const isGridFiltered = ref(false);
const activeFilterChips = ref([]); // [{ colId, text }] 已套用的篩選條件明細
const totalRowCount = computed(() => rowData.value.length);

// 篩選條件類型的中文對照
const FILTER_TYPE_LABELS = {
  contains: '包含', notContains: '不包含', equals: '等於', notEqual: '不等於',
  startsWith: '開頭是', endsWith: '結尾是', blank: '為空白', notBlank: '不為空白',
  greaterThan: '大於', greaterThanOrEqual: '≥', lessThan: '小於', lessThanOrEqual: '≤',
  inRange: '介於', true: '為開啟', false: '為關閉',
};

// 將日期字串 "2026-07-16 00:00:00" 簡化為 "2026-07-16"
const shortDate = (val) => (typeof val === 'string' ? val.split(' ')[0] : val);

// 將單一篩選條件轉成人類可讀文字
const describeFilterCondition = (cond) => {
  if (!cond) return '';
  // 集合篩選 (勾選值)：列出前 3 個值
  if (cond.filterType === 'set') {
    const values = (cond.values || []).map(v => (v === null || v === '' ? '(空白)' : v));
    const shown = values.slice(0, 3).join('、');
    const more = values.length > 3 ? ` …等 ${values.length} 項` : '';
    return `= ${shown}${more}`;
  }
  const label = FILTER_TYPE_LABELS[cond.type] || cond.type || '';
  if (cond.type === 'blank' || cond.type === 'notBlank') return label;
  if (cond.type === 'inRange') {
    const from = cond.filter ?? shortDate(cond.dateFrom) ?? '';
    const to = cond.filterTo ?? shortDate(cond.dateTo) ?? '';
    return `${label} ${from} ~ ${to}`;
  }
  const value = cond.filter ?? shortDate(cond.dateFrom) ?? '';
  return `${label}「${value}」`;
};

// 從 filterModel 建立各欄位的篩選明細 chips
const buildFilterChips = () => {
  const model = gridApi.value?.getFilterModel() || {};
  return Object.entries(model).map(([colId, colModel]) => {
    const headerName = gridApi.value.getColumn(colId)?.getColDef()?.headerName || colId;
    let desc;
    if (Array.isArray(colModel?.conditions)) {
      // 多條件組合 (AND / OR)
      const joiner = colModel.operator === 'OR' ? ' 或 ' : ' 且 ';
      desc = colModel.conditions.map(describeFilterCondition).join(joiner);
    } else {
      desc = describeFilterCondition(colModel);
    }
    return { colId, text: `${headerName}：${desc}` };
  });
};

// model-updated 於資料載入、篩選、排序後皆會觸發
const updateRowCounts = () => {
  if (!gridApi.value) return;
  displayedRowCount.value = gridApi.value.getDisplayedRowCount();
  isGridFiltered.value = gridApi.value.isAnyFilterPresent();
  activeFilterChips.value = isGridFiltered.value ? buildFilterChips() : [];
};

// 移除單一欄位的篩選
const clearColumnFilter = (colId) => {
  if (!gridApi.value) return;
  const model = gridApi.value.getFilterModel() || {};
  delete model[colId];
  gridApi.value.setFilterModel(Object.keys(model).length > 0 ? model : null);
};

// 清除全部篩選
const clearAllFilters = () => {
  gridApi.value?.setFilterModel(null);
};


// 旗標：是否正在進行批次動作
const isBatchProcessing = ref(false);


// 處理批次貼上的防抖/收集機制
let pasteTimer = null;
function handleBatchPaste(api) {
  if (pasteTimer) clearTimeout(pasteTimer);
  isBatchProcessing.value = true;
  
  pasteTimer = setTimeout(async () => {
    try {
      console.log('開始收集並執行批次貼上更新...');
      const updates = [];
      
      // 遍歷所有已變動的 nodes
      // 注意：在貼上後，變動的資料已經在 rowData 中，但我們需要找出哪些變動了
      // 這裡簡單的做法是收集所有處於「已修改」狀態的資料，或者直接利用 AG-Grid 的 cellValueChanged 累積的資料
      // 但最精準的方法是監聽貼上事件起迄。
      // 由於 AG-Grid node.data 已經是最新值，我們直接對所有 data 進行一次性同步（這取決於使用者選取的範圍）
      
      // 實際上最簡單且穩健的方式是：利用 AG-Grid 的 getRenderedNodes 或 API 找出變動列
      // 在此範案中，我們針對所有變動的列進行檢查
      api.forEachNode(node => {
        // 如果資料存在且含有 _docId
        if (node.data && node.data._docId) {
          // 這裡我們無法輕易得知哪些欄位變了，除非我們紀錄 oldValue
          // 優化策略：直接使用 AG-Grid 的回呼函式累積更新
        }
      });
      
      // 重新修正策略：因為貼上會觸發多次 onCellValueChanged
      // 我們在第一次觸發時開啟 isBatchProcessing，並開始收集 updatePayload
      // 等待貼上結束後一次送出。
      
      if (collectedUpdates.length > 0) {
        // 合併相同 docId 的更新
        const mergedUpdates = {};
        collectedUpdates.forEach(u => {
          if (!mergedUpdates[u.docId]) {
            mergedUpdates[u.docId] = {};
          }
          Object.assign(mergedUpdates[u.docId], u.data);
        });
        
        const finalUpdates = Object.entries(mergedUpdates).map(([docId, data]) => ({ docId, data }));
        
        await batchUpdateHouseholds(finalUpdates);
        snackbar.text = `成功批次更新 ${finalUpdates.length} 筆戶別資料！`;
        snackbar.color = 'success';
        snackbar.show = true;
      }
    } catch (err) {
      console.error("批次更新失敗:", err);
      snackbar.text = `批次更新失敗: ${err.message}`;
      snackbar.color = 'error';
      snackbar.show = true;
    } finally {
      isBatchProcessing.value = false;
      collectedUpdates = [];
      pasteTimer = null;
    }
  }, 200); // 200ms 確保所有 paste 產生的 cellValueChanged 都已觸發
}

let collectedUpdates = [];

// 修改後的 onCellValueChanged 輔助邏輯
async function onCellValueChanged(event) {
  const { data, colDef, newValue, oldValue, source } = event;
  if (oldValue === newValue) return;

  const field = colDef.field;
  const householdDocId = data?._docId;
  if (!householdDocId) return;

  // 銷售人員：輸入字串（空白/逗號/頓號分隔多人）→ 解析為陣列後儲存
  // 自訂數字／％ 欄：事件帶的是輸入原文（例 "5%"），存 valueSetter 解析後寫回 data 的數字
  const isNumericCustom = customFieldDefs.value.some(d => isNumericFieldType(d.fieldType) && customFieldKey(d) === field);
  const valueToSave = field === 'salesperson'
    ? parseSalespersonsInput(newValue)
    : (isNumericCustom ? (data[field] ?? null) : newValue);

  // 如果是貼上動作
  if (source === 'paste') {
    collectedUpdates.push({
      docId: householdDocId,
      data: { [field]: valueToSave }
    });
    handleBatchPaste(event.api);
    return;
  }

  // 一般手動修改動作
  if (isBatchProcessing.value) return;

  console.log('單一單元格更新:', householdDocId, field, valueToSave);
  try {
    await updateHouseholdData(householdDocId, { [field]: valueToSave });
    snackbar.text = `戶別 [${data.unitId}] 的 [${colDef.headerName}] 已更新成功！`;
    snackbar.color = 'success';
    snackbar.show = true;
  } catch (err) {
    console.error("更新戶別資料時發生錯誤:", err);
    snackbar.text = `更新失敗: ${err.message}`;
    snackbar.color = 'error';
    snackbar.show = true;
  }
}

// 修改生命週期鉤子以載入兩種資料 ---
onMounted(async () => {
  window.addEventListener('resize', _onHdmResize);
  if (projectId.value) {
    await projectStore.fetchProjects();

    // [新增] 載入專案設定以取得客戶回傳功能的欄位定義
    try {
      projectConfig.value = await projectStore.fetchProjectSettings(projectId.value);
    } catch (e) {
      console.error("Failed to load project settings:", e);
    }

    // 1. 監聽戶別資料
    unsubscribeHouseholds = listenToAllHouseholds(
      projectId.value,
      (households) => {
        console.log('接收到 Firestore 戶別資料更新...');
        // 將已有的預約資訊合併到新的 households 資料
        rowData.value = households.map(household => ({
          ...household,
          _bookingInfo: appointmentsByUnitAndType.value[household.unitId] || {}
        }));
      },
      (err) => {
        error.value = `戶別資料監聽失敗: ${err.message}`;
      }
    );

    // 2. 監聽自訂欄位定義
    unsubscribeFields = listenToFieldDefinitions(
      projectId.value,
      'households',
      (definitions) => {
        console.log('接收到 Firestore 欄位定義更新...');
        customFieldDefs.value = definitions;
        if (!hasFieldsLoaded.value) hasFieldsLoaded.value = true;
      },
      (err) => {
        error.value = `欄位定義監聽失敗: ${err.message}`;
      }
    );

    // 3. [新增] 監聽預約資料
    unsubscribeAppointments = listenToAppointments(
      projectId.value,
      (appointmentsList) => {
        console.log('接收到 Firestore 預約資料更新...');
        appointments.value = appointmentsList;
        // 重建 appointments map
        appointmentsByUnitAndType.value = buildAppointmentMap(appointmentsList);
        // 將 _bookingInfo 合併至 rowData
        rowData.value = rowData.value.map(household => ({
          ...household,
          _bookingInfo: appointmentsByUnitAndType.value[household.unitId] || {}
        }));
      },
      (err) => {
        console.error(`預約資料監聽失敗: ${err.message}`);
        // 不阻止頁面載入，只記錄錯誤
      }
    );

  } else {
    error.value = "未提供建案 ID";
    isLoading.value = false;
  }
});

// 監聽 isLoading 狀態，當所有資料都載入完畢時才停止
watch([rowData, hasFieldsLoaded], ([newRowData, newFieldsLoaded]) => {
  if (newRowData.length > 0 && newFieldsLoaded && !hasInitialDataLoaded.value) {
    hasInitialDataLoaded.value = true;
    isLoading.value = false;
  } else if (newRowData.length === 0 && newFieldsLoaded && isLoading.value) {
    // 處理沒有戶別資料但欄位定義已載入的情況
    hasInitialDataLoaded.value = true;
    isLoading.value = false;
  }
});


onUnmounted(() => {
  window.removeEventListener('resize', _onHdmResize);
  if (unsubscribeHouseholds) {
    console.log('停止監聽戶別總表');
    unsubscribeHouseholds();
  }
  if (unsubscribeFields) {
    console.log('停止監聽欄位定義');
    unsubscribeFields();
  }
  if (unsubscribeAppointments) {
    console.log('停止監聽預約資料');
    unsubscribeAppointments();
  }

});

</script>

<style scoped>
/* ───────── 頁首：標題＋工作表切換＋動作 ───────── */
.hg-card {
   border-radius: 14px !important;
   box-shadow: 0 0 0 0.5px rgba(0, 0, 0, 0.08), 0 1px 3px rgba(0, 0, 0, 0.05) !important;
}
.hg-head {
   display: flex;
   align-items: center;
   flex-wrap: wrap;
   gap: 10px 14px;
   margin-bottom: 14px;
   font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", "Helvetica Neue", "PingFang TC", "Noto Sans TC", sans-serif;
   color: #1d1d1f;
}
.hg-title {
   display: flex;
   align-items: baseline;
   flex-wrap: wrap;
   gap: 2px 8px;
   min-width: 0;
   margin-right: auto;
}
.hg-title-project { font-size: 20px; font-weight: 700; letter-spacing: -0.01em; line-height: 1.25; }
.hg-title-sheet { font-size: 14px; font-weight: 500; color: #6e6e73; white-space: nowrap; }
.hg-seg .mac-form-seg-btn { height: 28px; padding: 0 14px; }
.hg-actions { display: flex; align-items: center; gap: 2px; }
.hg-actions .mac-icon-btn { width: 32px; height: 32px; color: #1d1d1f; }
/* 面積找補欄位：表頭淡藍底，和其他欄位區分 */
:deep(.ag-header-cell.hg-area-head) { background: #eaf3ff; }

/* ───────── 戶別整合資訊：macOS 視窗 ───────── */
.household-detail-modal {
   --hdm-text: #1d1d1f;
   --hdm-sub: #6e6e73;
   --hdm-line: #ececf0;
   --hdm-accent: #0071e3;
   position: fixed;
   width: 720px;
   max-width: calc(100vw - 24px);
   max-height: calc(100vh - 100px);
   display: flex;
   flex-direction: column;
   overflow: hidden;
   background: #f5f5f7;
   border-radius: 12px;
   box-shadow: 0 22px 70px rgba(0, 0, 0, 0.28), 0 0 0 0.5px rgba(0, 0, 0, 0.2);
   z-index: 2400; /* 在 ag-grid 之上、Vuetify v-overlay 之下（v-overlay 預設 2400 開始，個別 dialog overlay 開到 ~2400+） */
   color: var(--hdm-text);
   font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", "Helvetica Neue", "PingFang TC", "Noto Sans TC", sans-serif;
   font-size: 13px;
}
/* 電腦版：加寬＋固定高度，左右分欄切換項目時視窗不跳動 */
.household-detail-modal.hdm-wide {
   width: 1000px;
   height: min(720px, calc(100vh - 100px));
}
.hdm-header {
   display: flex;
   align-items: center;
   gap: 10px;
   min-height: 56px;
   padding: 8px 10px 8px 18px;
   flex-shrink: 0;
   background: #f6f6f8;
   border-bottom: 1px solid rgba(0, 0, 0, 0.1);
   cursor: move;
   user-select: none;
}
.hdm-titles { flex: 1 1 auto; min-width: 0; }
.hdm-title-main { display: flex; align-items: baseline; flex-wrap: wrap; gap: 2px 8px; }
.hdm-unit { font-size: 17px; font-weight: 700; letter-spacing: -0.01em; }
.hdm-buyer { font-size: 14px; font-weight: 500; overflow-wrap: anywhere; }
.hdm-title-main .mac-tag { align-self: center; }
.hdm-title-sub { margin-top: 1px; font-size: 12px; color: var(--hdm-sub); overflow-wrap: anywhere; }
.hdm-actions { display: flex; align-items: center; gap: 6px; flex-shrink: 0; cursor: default; }
.hdm-close { margin-left: 0; flex-shrink: 0; }

.hdm-body { flex: 1 1 auto; min-height: 0; overflow-y: auto; }
.hdm-body-split { display: flex; overflow: hidden; }
.hdm-body-split .hdm-content { flex: 1 1 auto; min-width: 0; overflow-y: auto; }
.hdm-content { padding: 2px 20px 20px; }

/* 左側項目導覽（系統設定側欄） */
.hdm-nav {
   flex: 0 0 216px;
   display: flex;
   flex-direction: column;
   gap: 2px;
   padding: 10px 8px;
   overflow-y: auto;
   background: #ececf0;
   border-right: 1px solid rgba(0, 0, 0, 0.08);
}
.hdm-nav-item {
   display: flex;
   align-items: center;
   gap: 9px;
   width: 100%;
   padding: 6px 8px;
   border: 0;
   border-radius: 7px;
   background: transparent;
   color: var(--hdm-text);
   font-family: inherit;
   text-align: left;
   cursor: pointer;
   transition: background-color 0.12s;
}
.hdm-nav-item:hover { background: rgba(0, 0, 0, 0.05); }
.hdm-nav-item.is-active { background: var(--hdm-accent); color: #fff; }
.hdm-icon {
   display: inline-grid;
   place-content: center;
   width: 24px;
   height: 24px;
   flex-shrink: 0;
   border-radius: 6px;
   box-shadow: inset 0 0 0 0.5px rgba(0, 0, 0, 0.12), 0 0.5px 1px rgba(0, 0, 0, 0.1);
}
.hdm-nav-texts { display: flex; flex-direction: column; flex: 1 1 auto; min-width: 0; }
.hdm-nav-label { font-size: 13px; font-weight: 500; line-height: 1.3; overflow-wrap: anywhere; }
.hdm-nav-caption { font-size: 11.5px; line-height: 1.3; color: var(--hdm-sub); }
.hdm-nav-caption.is-empty { color: #a1a1a6; }
.hdm-nav-item.is-active .hdm-nav-caption { color: rgba(255, 255, 255, 0.82); }
.hdm-nav-badge {
   display: inline-grid;
   place-content: center;
   min-width: 20px;
   height: 20px;
   padding: 0 6px;
   flex-shrink: 0;
   border-radius: 10px;
   background: #ff9f0a;
   color: #fff;
   font-size: 11.5px;
   font-weight: 700;
}
.hdm-nav-item.is-active .hdm-nav-badge { background: #fff; color: var(--hdm-accent); }

/* 區塊標題 */
.hdm-sec-head {
   display: flex;
   align-items: center;
   flex-wrap: wrap;
   gap: 6px 8px;
   min-height: 30px;
   margin: 16px 2px 8px;
}
.hdm-sec-title { font-size: 15px; font-weight: 700; }
.hdm-sec-head .mac-spacer { flex: 1 1 auto; }
.hdm-group-label {
   display: flex;
   align-items: center;
   gap: 6px;
   margin: 12px 4px 6px;
   font-size: 11.5px;
   font-weight: 600;
   color: var(--hdm-sub);
   letter-spacing: 0.02em;
}
.hdm-group-count {
   min-width: 18px;
   padding: 0 5px;
   border-radius: 9px;
   background: rgba(0, 0, 0, 0.07);
   text-align: center;
}
.hdm-section .mac-form-group + .mac-form-group { margin-top: 10px; }

/* 欄位列：左標籤、右內容 */
.hdm-field { gap: 12px; }
.hdm-label {
   flex: 0 0 128px;
   color: var(--hdm-sub);
   font-size: 13px;
   line-height: 1.35;
   overflow-wrap: anywhere;
}
.hdm-value {
   flex: 1 1 auto;
   min-width: 0;
   line-height: 1.45;
   overflow-wrap: anywhere;
}
.hdm-value.is-empty, .is-empty { color: #a1a1a6; }
.hdm-value a, .hdm-auth-meta-row a { color: var(--hdm-accent); text-decoration: none; }
.hdm-value a:hover, .hdm-auth-meta-row a:hover { text-decoration: underline; }
.hdm-inline-tag { margin-left: 6px; vertical-align: 1px; }
.hdm-row-sep { border-top: 1px solid #dcdce1 !important; }

.hdm-input {
   flex: 1 1 auto;
   min-width: 0;
   height: 28px;
   padding: 0 9px;
   border: 1px solid transparent;
   border-radius: 6px;
   background: transparent;
   color: var(--hdm-text);
   font-family: inherit;
   font-size: 13px;
   outline: none;
   transition: border-color 0.12s, box-shadow 0.12s, background-color 0.12s;
}
.hdm-input:read-only { padding-left: 0; cursor: default; }
.hdm-input::placeholder { color: #a1a1a6; }
.household-detail-modal.is-edit-mode .hdm-input:not(:read-only) {
   border-color: rgba(0, 0, 0, 0.14);
   background: #fff;
   box-shadow: inset 0 0.5px 1px rgba(0, 0, 0, 0.05);
}
.household-detail-modal.is-edit-mode .hdm-input:not(:read-only):focus {
   border-color: var(--hdm-accent);
   box-shadow: 0 0 0 3px rgba(0, 113, 227, 0.22);
}
.hdm-input--date { max-width: 200px; }

/* 開關：檢視模式不可點，但保留顏色狀態（綠色=開、灰色=關） */
.hdm-switch-row { cursor: default; }
.household-detail-modal:not(.is-edit-mode) .hdm-switch-row .mac-switch:disabled { opacity: 1; cursor: default; }
.household-detail-modal.is-edit-mode .hdm-switch-row { cursor: pointer; }

/* 備註 */
.hdm-remarks .hdm-label { display: block; margin-bottom: 6px; }
.hdm-remarks-text { white-space: pre-wrap; overflow-wrap: anywhere; line-height: 1.6; }
.hdm-textarea { min-height: 100px; }

/* 預約（多筆時每筆一個群組，左側橘色標示） */
.hdm-booking-multi {
   box-shadow: inset 3px 0 0 #ff9f0a, 0 0 0 0.5px rgba(0, 0, 0, 0.08), 0 0.5px 1.5px rgba(0, 0, 0, 0.05);
}
.hdm-booking-head { flex-wrap: wrap; gap: 6px; background: #fffaf2; }
.hdm-booking-head-date { font-weight: 600; font-variant-numeric: tabular-nums; }
.hdm-booking-head .mac-spacer { flex: 1 1 auto; }

/* 未上傳驗屋報告提醒 */
.hdm-reminder { background: #fffaf0; }
.hdm-reminder-title { display: flex; align-items: center; flex-wrap: wrap; gap: 6px; margin-bottom: 6px; font-weight: 600; }
.hdm-reminder-head { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 8px; margin-bottom: 6px; }
.hdm-reminder-days { display: flex; align-items: center; gap: 4px; font-size: 12.5px; color: var(--hdm-sub); }
.hdm-reminder-days.is-overdue { color: #b3261b; }
.hdm-reminder-days strong { font-size: 14px; }
.hdm-reminder-list { display: flex; flex-direction: column; gap: 3px; }
.hdm-reminder-item { display: flex; align-items: center; gap: 6px; font-size: 12.5px; color: var(--hdm-sub); font-variant-numeric: tabular-nums; }
.hdm-reminder-empty { font-size: 12px; color: #8e8e93; }

/* 報告／授權書檔案列 */
.hdm-file-row { gap: 6px; }
.hdm-file-link {
   display: flex;
   align-items: center;
   gap: 6px;
   flex: 1 1 auto;
   min-width: 0;
   color: var(--hdm-accent);
   text-decoration: none;
   line-height: 1.4;
   overflow-wrap: anywhere;
}
.hdm-file-link > span { min-width: 0; }
.hdm-file-link:hover > span { text-decoration: underline; }
.hdm-file-link.is-downloaded { color: var(--hdm-sub); }
.hdm-file-link .v-icon { flex-shrink: 0; }
.hdm-ok-btn { color: #1f7a36; }
.hdm-ok-btn:hover { background: rgba(52, 199, 89, 0.12); color: #1f7a36; }
.hdm-link-row { color: var(--hdm-text); text-decoration: none; }
.hdm-auth-item + .hdm-auth-item { border-top: 1px solid var(--hdm-line); }
.hdm-auth-meta {
   display: grid;
   grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
   gap: 6px 14px;
   margin-top: 8px;
   padding-left: 24px;
}
.hdm-auth-meta-row { display: flex; flex-direction: column; gap: 1px; min-width: 0; }
.hdm-auth-meta-row > span { font-size: 11.5px; color: var(--hdm-sub); }
.hdm-auth-meta-row > b { font-weight: 500; overflow-wrap: anywhere; }

/* 客戶回傳訊息：展開列 */
.hdm-msg + .hdm-msg { border-top: 1px solid var(--hdm-line); }
.hdm-msg-sum {
   display: flex;
   align-items: center;
   flex-wrap: wrap;
   gap: 6px 8px;
   min-height: 44px;
   padding: 8px 14px;
   list-style: none;
   cursor: pointer;
}
.hdm-msg-sum::-webkit-details-marker { display: none; }
.hdm-msg-sum:hover { background: #f7f7f9; }
.hdm-msg-chev { color: #8e8e93; transition: transform 0.15s; }
.hdm-msg[open] .hdm-msg-chev { transform: rotate(90deg); }
.hdm-msg-title { font-weight: 600; overflow-wrap: anywhere; }
.hdm-msg-date { margin-left: auto; color: var(--hdm-sub); font-size: 12px; font-variant-numeric: tabular-nums; }
.hdm-msg-body { padding: 0 14px 12px 36px; }
.hdm-kv {
   display: flex;
   gap: 12px;
   padding: 6px 0;
   border-top: 1px solid #f0f0f3;
   font-size: 12.5px;
   line-height: 1.5;
}
.hdm-kv:first-child { border-top: 0; }
.hdm-kv-key { flex: 0 0 128px; color: #6e6e73; overflow-wrap: anywhere; }
.hdm-kv-val { flex: 1 1 auto; min-width: 0; white-space: pre-wrap; overflow-wrap: anywhere; }
.hdm-attachments { display: flex; flex-wrap: wrap; gap: 5px; margin-top: 8px; }
.hdm-attachment { text-decoration: none; white-space: normal; overflow-wrap: anywhere; }
.hdm-attachment:hover { filter: brightness(0.96); }

/* ───────── 子視窗（訊息檢視、確認框、提醒） ───────── */
.hg-sheet-title { flex: 1 1 auto; min-width: 0; overflow-wrap: anywhere; }
.hg-close { margin-left: 4px; }
.hg-inline-switch {
   display: inline-flex;
   align-items: center;
   gap: 6px;
   font-size: 12.5px;
   font-weight: 500;
   color: #1d1d1f;
   white-space: nowrap;
   cursor: pointer;
}
.hg-sheet-body { max-height: 75vh; overflow-y: auto; }
.mac-form.hg-sheet-body { padding: 4px 16px 16px; }
.hg-empty { display: flex; flex-direction: column; align-items: center; gap: 6px; padding: 40px 16px; color: #8e8e93; }
.hg-msg-card { margin-top: 12px; }
.hg-msg-card.is-deleted { opacity: 0.6; box-shadow: inset 3px 0 0 #d62d20, 0 0 0 0.5px rgba(0, 0, 0, 0.08); }
.hg-msg-card.is-deleted .hg-msg-title > span:first-child { text-decoration: line-through; }
.hg-msg-head { gap: 4px; }
.hg-msg-title { display: flex; align-items: center; flex-wrap: wrap; gap: 6px; font-weight: 600; overflow-wrap: anywhere; }
.hg-msg-date { margin-top: 2px; font-size: 12px; color: #6e6e73; }
.hg-confirm-target { line-height: 1.6; overflow-wrap: anywhere; }
.hg-confirm-list { margin: 8px 0 0 18px; color: #6e6e73; font-size: 12.5px; line-height: 1.7; }
.hg-text-danger { color: #d62d20; }

/* Email 預覽框 */
.reminder-preview-frame {
   border: 1px solid #e0e0e0;
   border-radius: 8px;
   max-height: 60vh;
   overflow-y: auto;
   background: #f4f4f7;
}

/* ───────── 手機 ───────── */
@media (max-width: 599.98px) {
   .hg-title-project { font-size: 18px; }
   .hg-seg { order: 3; display: flex; width: 100%; }
   .hg-seg .mac-form-seg-btn { flex: 1 1 0; min-width: 0; padding: 0 8px; height: 30px; }
   .hg-seg .mac-form-seg-btn .v-icon { display: none; } /* 三個分頁，手機版只留文字避免擠壓 */

   .household-detail-modal.hdm-mobile {
      top: 0;
      left: 0;
      width: 100vw;
      max-width: 100vw;
      height: 100vh;
      height: 100dvh;
      max-height: none;
      border-radius: 0;
   }
   .hdm-header { flex-wrap: wrap; padding: 8px 8px 8px 14px; cursor: default; }
   .hdm-close { order: 2; }
   .hdm-actions { order: 3; width: 100%; justify-content: flex-end; }
   .hdm-content { padding: 0 12px 28px; }
   .hdm-field { flex-wrap: wrap; gap: 2px 12px; }
   .hdm-field > .hdm-label { flex-basis: 100%; font-size: 12px; }
   .hdm-input { height: 36px; font-size: 16px; }
   .hdm-input:read-only { height: auto; min-height: 24px; }
   .hdm-textarea { font-size: 16px; }
   .hdm-msg-body { padding-left: 14px; }
   .hdm-kv-key { flex-basis: 96px; }
   .hdm-auth-meta { padding-left: 0; }
}
</style>