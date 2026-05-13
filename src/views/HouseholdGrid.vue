<template>
<v-container fluid>
<v-card class="pa-4">
<v-card-title class="d-flex align-center justify-space-between text-h6 text-primary" >
  <span>{{ pageTitle }}</span>
  <div class="d-flex align-center ga-2">


    <v-tooltip text="新增資料欄位" location="bottom">

  <template v-slot:activator="{ props }">
    <v-btn 
      v-bind="props"
      color="black" 
      variant="text" 
      icon="mdi-table-column-plus-after"
      @click="openFieldDefinitionDialog"
    ></v-btn>
  </template>
</v-tooltip>

<v-tooltip text="下載戶別資料" location="bottom">
  <template v-slot:activator="{ props }">
    <v-btn 
      v-bind="props"
      color="black" 
      variant="text" 
      icon="mdi-download"
      @click="exportToExcel"
    ></v-btn>
  </template>
</v-tooltip>

<v-tooltip text="上傳戶別資料" location="bottom">
  <template v-slot:activator="{ props }">
    <v-btn 
      v-bind="props"
      color="black" 
      variant="text" 
      icon="mdi-upload"
      @click="uploadDialog = true"
    ></v-btn>
  </template>
</v-tooltip>
  </div>
</v-card-title>

<v-alert v-if="error" type="error" variant="tonal" class="mb-4" :text="error"></v-alert>

<div v-if="isLoading" class="text-center pa-10">
  <v-progress-circular indeterminate color="primary" size="64"></v-progress-circular>
  <div class="mt-4">戶別資料載入中...</div>
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
    :enableRangeSelection="true"
    @grid-ready="onGridReady"
    @cell-value-changed="onCellValueChanged"
  >
  </ag-grid-vue>
</div>

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
         text="此操作將根據「文件ID」覆蓋現有資料，或根據「戶別」建立新資料。為避免資料遺失，強烈建議您先下載目前的資料作為備份與範本。"
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

 <v-dialog v-model="fieldDialog.show" max-width="500px" persistent>
   <v-card>
          <v-form ref="fieldForm" @submit.prevent="handleSaveFieldDefinition">
       <v-card-title class="bg-blue-darken-2">
         <span class="text-h5">新增自訂欄位</span>
       </v-card-title>
       <v-card-text class="pt-4">
         <v-text-field
           v-model="fieldDialog.data.fieldName"
           label="欄位顯示名稱"
           :rules="[v => !!v || '此為必填欄位']"
           required
           variant="outlined"
           density="compact"
         ></v-text-field>

         <v-select
           v-model="fieldDialog.data.fieldType"
           :items="fieldDialogItems"
           label="欄位格式"
           item-title="title"
           item-value="value"
           :rules="[v => !!v || '請選擇一種格式']"
           required
           variant="outlined"
           density="compact"
         ></v-select>

         <v-combobox
           v-if="fieldDialog.data.fieldType === 'select'"
           v-model="fieldDialog.data.options"
           label="請輸入下拉選單的選項 (按 Enter 新增)"
           multiple
           chips
           variant="outlined"
           density="compact"
                      :rules="[v => (v && v.length > 0) || '請至少輸入一個選項']"
           required
         ></v-combobox>

         <v-alert v-if="fieldDialog.error" type="error" variant="tonal" density="compact" class="mt-2">
           {{ fieldDialog.error }}
         </v-alert>

       </v-card-text>
       <v-card-actions>
         <v-spacer></v-spacer>
         <v-btn color="grey" variant="text" @click="fieldDialog.show = false">取消</v-btn>
         <v-btn
           type="submit"
           color="blue"
           variant="flat"
           :loading="fieldDialog.loading"
         >
           儲存
         </v-btn>
       </v-card-actions>
     </v-form>
   </v-card>
 </v-dialog>


 <!-- Customer Message View Dialog -->
 <v-dialog v-model="isMessageDialogVisible" max-width="800px">
    <v-card>
       <v-card-title class="bg-info text-white d-flex justify-space-between align-center">
          <span>戶別 {{ selectedHouseholdUnit }} - 客戶回傳訊息 ({{ activeMessageCount }})</span>
          <div class="d-flex align-center">
             <v-switch
                v-model="showDeletedMessages"
                label="顯示已刪除"
                color="white"
                hide-details
                density="compact"
                class="mr-2"
             ></v-switch>
             <v-btn icon="mdi-close" variant="text" color="white" @click="isMessageDialogVisible = false"></v-btn>
          </div>
       </v-card-title>
       <v-card-text class="pa-0" style="max-height: 80vh; overflow-y: auto; background-color: #f5f5f5;">
          <v-container>
             <div v-if="filteredMessages.length === 0" class="text-center pa-6 text-grey">
                <v-icon size="48" class="mb-2">mdi-email-open-outline</v-icon>
                <div>{{ showDeletedMessages ? '沒有任何訊息' : '沒有有效訊息' }}</div>
             </div>
             <v-card
                v-for="msg in filteredMessages"
                :key="msg.id"
                class="mb-4"
                border
                variant="outlined"
                :style="msg.isDeleted ? 'opacity: 0.5; border-left: 4px solid #e53935;' : ''"
             >
                <v-card-item>
                   <template v-slot:default>
                      <v-card-title class="text-subtitle-1 font-weight-bold" :class="msg.isDeleted ? 'text-grey text-decoration-line-through' : 'text-primary'">
                         {{ msg.functionName || '未命名功能' }}
                         <v-chip v-if="msg.isDeleted" color="error" size="x-small" variant="flat" class="ml-2">已刪除</v-chip>
                      </v-card-title>
                      <v-card-subtitle>
                         {{ formatMessageDate(msg.createdAt) }}
                         <span v-if="msg.isDeleted && msg.deletedAt" class="text-error ml-2">
                            (刪除於 {{ formatMessageDate(msg.deletedAt) }})
                         </span>
                      </v-card-subtitle>
                   </template>
                   <template v-slot:append>
                      <v-chip v-if="!msg.isDeleted && msg.status === 'new'" color="error" size="small" class="mr-2">新訊息</v-chip>
                      <!-- 冷刪除按鈕 -->
                      <v-btn
                         v-if="!msg.isDeleted"
                         icon="mdi-delete-outline"
                         variant="text"
                         color="error"
                         size="small"
                         :loading="messageActionLoading === msg.id"
                         @click.stop="softDeleteMessage(msg)"
                      >
                         <v-icon>mdi-delete-outline</v-icon>
                         <v-tooltip activator="parent" location="top">刪除此訊息</v-tooltip>
                      </v-btn>
                      <!-- 復原按鈕 -->
                      <v-btn
                         v-if="msg.isDeleted"
                         icon="mdi-undo-variant"
                         variant="text"
                         color="success"
                         size="small"
                         :loading="messageActionLoading === msg.id"
                         @click.stop="restoreMessage(msg)"
                      >
                         <v-icon>mdi-undo-variant</v-icon>
                         <v-tooltip activator="parent" location="top">復原此訊息</v-tooltip>
                      </v-btn>
                      <!-- 硬刪除按鈕 -->
                      <v-btn
                         v-if="msg.isDeleted"
                         icon="mdi-delete-forever-outline"
                         variant="text"
                         color="error"
                         size="small"
                         :loading="messageActionLoading === msg.id"
                         @click.stop="confirmHardDeleteMessage(msg)"
                      >
                         <v-icon>mdi-delete-forever-outline</v-icon>
                         <v-tooltip activator="parent" location="top">永久刪除</v-tooltip>
                      </v-btn>
                   </template>
                </v-card-item>
                <v-divider></v-divider>
                
                <v-card-text class="pt-3">
                   <!-- Dynamic Data Key-Values -->
                   <v-table density="compact" class="mb-3 border rounded">
                      <tbody>
                         <tr v-for="(value, key) in msg.data" :key="key">
                            <td class="bg-grey-lighten-4 font-weight-bold" style="width: 150px;">{{ getFieldLabel(msg, key) }}</td>
                            <td>{{ getFieldDisplayValue(msg, key, value) }}</td>
                         </tr>
                      </tbody>
                   </v-table>

                   <!-- Attachments -->
                   <div v-if="msg.attachments && msg.attachments.length > 0">
                      <div class="text-subtitle-2 font-weight-bold mb-1">附件 ({{ msg.attachments.length }})</div>
                      <div class="d-flex flex-wrap gap-2">
                         <v-chip
                            v-for="file in msg.attachments"
                            :key="file.path"
                            prepend-icon="mdi-paperclip"
                            :href="file.url"
                            target="_blank"
                            color="primary"
                            variant="outlined"
                            label
                         >
                            {{ file.name }}
                         </v-chip>
                      </div>
                   </div>
                </v-card-text>
             </v-card>
          </v-container>
       </v-card-text>
    </v-card>
 </v-dialog>

 <!-- 永久刪除確認 Dialog -->
 <v-dialog v-model="isConfirmingHardDeleteMsg" width="auto" persistent>
    <v-card>
       <v-card-title class="text-h5 text-error">
          ⚠️ 確認永久刪除訊息
       </v-card-title>
       <v-card-text>
          您確定要永久刪除此訊息嗎？<br><br>
          <strong>功能名稱：</strong>{{ hardDeleteMsgTarget?.functionName || '未命名' }}<br>
          <strong>提交時間：</strong>{{ formatMessageDate(hardDeleteMsgTarget?.createdAt) }}<br><br>
          <v-alert type="error" variant="tonal" density="compact">
             此操作無法復原，訊息將被完全移除。
          </v-alert>
       </v-card-text>
       <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="grey-darken-1" variant="text" @click="isConfirmingHardDeleteMsg = false" :disabled="messageActionLoading !== null">取消</v-btn>
          <v-btn color="error" variant="flat" @click="executeHardDeleteMessage" :loading="messageActionLoading !== null">確認永久刪除</v-btn>
       </v-card-actions>
    </v-card>
 </v-dialog>

  <v-dialog v-model="isConfirmingSave" width="auto" persistent>
   <v-card>
     <v-card-title class="text-h5">
       ⚠️ 請注意
     </v-card-title>
     <v-card-text>
       新增欄位後不可刪除或修改欄位名稱，確定要繼續嗎？
     </v-card-text>
     <v-card-actions>
       <v-spacer></v-spacer>
       <v-btn color="grey-darken-1" variant="text" @click="isConfirmingSave = false">取消</v-btn>
       <v-btn color="warning" variant="flat" @click="confirmAndSave">確認新增</v-btn>
     </v-card-actions>
   </v-card>
 </v-dialog>


  <v-dialog v-model="isConfirmingDeleteReport" width="auto" persistent>
   <v-card>
     <v-card-title class="text-h5 text-error">
       ⚠️ 確認刪除驗屋報告
     </v-card-title>
     <v-card-text>
       您確定要將戶別 <strong>{{ deleteReportRowData?.unitId }}</strong> 的驗屋報告「{{ deleteReportTarget?.name }}」作廢嗎？<br><br>
       此操作會：<br>
       1. 將 Google Drive 上的資料夾名稱加上(作廢)標記以保留檔案。<br>
       2. 報告將從清單中移除，無法復原。
     </v-card-text>
     <v-card-actions>
       <v-spacer></v-spacer>
       <v-btn color="grey-darken-1" variant="text" @click="isConfirmingDeleteReport = false" :disabled="isDeletingReport">取消</v-btn>
       <v-btn color="error" variant="flat" @click="executeDeleteReport" :loading="isDeletingReport">確認作廢</v-btn>
     </v-card-actions>
   </v-card>
 </v-dialog>

  <v-dialog v-model="isConfirmingMarkDownloaded" width="auto" persistent>
   <v-card>
     <v-card-title class="text-h5 text-success">
       ✅ 標記驗屋報告為已下載
     </v-card-title>
     <v-card-text>
       您確定要將戶別 <strong>{{ markDownloadedRowData?.unitId }}</strong> 的驗屋報告「{{ markDownloadedTarget?.name }}」標記為已下載嗎？<br><br>
       此操作會：<br>
       1. 將 Google Drive 上的檔案加註(已下載)。<br>
       2. LINE小助理將不再提醒未下載<br>
     </v-card-text>
     <v-card-actions>
       <v-spacer></v-spacer>
       <v-btn color="grey-darken-1" variant="text" @click="isConfirmingMarkDownloaded = false" :disabled="isMarkingDownloaded">取消</v-btn>
       <v-btn color="success" variant="flat" @click="executeMarkDownloaded" :loading="isMarkingDownloaded">確認標記</v-btn>
     </v-card-actions>
   </v-card>
 </v-dialog>

 <v-snackbar v-model="snackbar.show" :timeout="2000" :color="snackbar.color">
  {{ snackbar.text }}
</v-snackbar>

<!-- 戶別整合資訊 Modal（可拖移、不阻擋 grid 背景操作） -->
<div
   v-if="isHouseholdDetailVisible && selectedHouseholdForDetail"
   class="household-detail-modal"
   :class="{ 'is-edit-mode': isModalEditMode }"
   :style="{ top: detailModalPos.y + 'px', left: detailModalPos.x + 'px' }"
>
   <div class="hdm-header" @mousedown="startDetailDrag">
      <v-icon size="small" class="mr-2">mdi-drag</v-icon>
      <span class="hdm-title">
         {{ projectName }}
         <span v-if="selectedHouseholdForDetail.unitId" class="title-sep">-</span>
         <span v-if="selectedHouseholdForDetail.unitId">{{ selectedHouseholdForDetail.unitId }}</span>
         <span v-if="selectedHouseholdForDetail.buyerName" class="title-sep">-</span>
         <span v-if="selectedHouseholdForDetail.buyerName">{{ selectedHouseholdForDetail.buyerName }}</span>
         <span class="hdm-subtitle">戶別整合資訊</span>
      </span>
      <v-spacer></v-spacer>
      <v-btn
         class="mr-2"
         size="small"
         :variant="isModalEditMode ? 'flat' : 'outlined'"
         :color="isModalEditMode ? 'warning' : 'white'"
         :prepend-icon="isModalEditMode ? 'mdi-content-save-outline' : 'mdi-pencil-outline'"
         :loading="_isSavingModalEdits"
         @click.stop="isModalEditMode ? exitModalEditMode() : enterModalEditMode()"
         @mousedown.stop
         :title="isModalEditMode ? '點此儲存所有變更並退出編輯' : '點此進入編輯模式'"
      >
         {{ isModalEditMode ? '儲存並退出' : '進入編輯' }}
      </v-btn>
      <v-btn
         class="mr-2"
         size="small"
         variant="flat"
         color="success"
         prepend-icon="mdi-calendar-plus"
         @click.stop="openAdminAddBookingForCurrentHousehold"
         @mousedown.stop
         title="為此戶別新增預約（後台代填）"
      >
         新增預約
      </v-btn>
      <v-btn icon="mdi-close" variant="text" size="small" color="white" @click.stop="closeHouseholdDetail" @mousedown.stop></v-btn>
   </div>
   <div class="hdm-body">
      <!-- 功能開關 -->
      <v-card variant="outlined" class="mb-3">
         <v-card-title class="text-subtitle-2 font-weight-bold py-2 bg-green-lighten-5">
            <v-icon size="small" class="mr-1" color="success">mdi-toggle-switch-outline</v-icon>功能開關
         </v-card-title>
         <v-card-text class="pt-2 pb-2">
            <div class="hdm-switch-row">
               <label>預約系統開關</label>
               <v-switch v-model="selectedHouseholdForDetail.showInMenu"
                  color="success" inset hide-details density="compact"
               ></v-switch>
            </div>
            <div class="hdm-switch-row">
               <label>交屋</label>
               <v-switch v-model="selectedHouseholdForDetail['交屋']"
                  color="success" inset hide-details density="compact"
               ></v-switch>
            </div>
            <div class="hdm-switch-row">
               <label>初驗報告上傳</label>
               <v-switch v-model="selectedHouseholdForDetail.initialReportUploadSwitch"
                  color="success" inset hide-details density="compact"
               ></v-switch>
            </div>
            <div class="hdm-switch-row">
               <label>複驗報告上傳</label>
               <v-switch v-model="selectedHouseholdForDetail.reInspectionReportUploadSwitch"
                  color="success" inset hide-details density="compact"
               ></v-switch>
            </div>
            <div class="hdm-switch-row">
               <label>允許重複預約</label>
               <v-switch v-model="selectedHouseholdForDetail.allowMultipleBookings"
                  color="success" inset hide-details density="compact"
               ></v-switch>
            </div>
         </v-card-text>
      </v-card>

      <!-- 基本資料 -->
      <v-card variant="outlined" class="mb-3">
         <v-card-title class="text-subtitle-2 font-weight-bold py-2 bg-grey-lighten-4">
            <v-icon size="small" class="mr-1" color="primary">mdi-account-outline</v-icon>基本資料
         </v-card-title>
         <v-card-text class="pt-2 pb-2">
            <div class="hdm-row hdm-row-edit">
               <label>目前狀態</label>
               <v-text-field v-model="selectedHouseholdForDetail.currentStatus"
                  :readonly="!isModalEditMode"
                  variant="plain" density="compact" hide-details class="hdm-edit-field"
                  placeholder="—"></v-text-field>
            </div>
            <div class="hdm-row hdm-row-edit">
               <label>買方姓名</label>
               <v-text-field v-model="selectedHouseholdForDetail.buyerName"
                  :readonly="!isModalEditMode"
                  variant="plain" density="compact" hide-details class="hdm-edit-field"
                  placeholder="—"></v-text-field>
            </div>
            <div class="hdm-row hdm-row-edit">
               <label>買方電話</label>
               <v-text-field v-model="selectedHouseholdForDetail.buyerPhone"
                  :readonly="!isModalEditMode"
                  variant="plain" density="compact" hide-details class="hdm-edit-field"
                  placeholder="—"></v-text-field>
            </div>
            <div class="hdm-row hdm-row-edit">
               <label>買方 Email</label>
               <v-text-field v-model="selectedHouseholdForDetail.buyerEmail"
                  :readonly="!isModalEditMode"
                  variant="plain" density="compact" hide-details class="hdm-edit-field"
                  placeholder="—"></v-text-field>
            </div>
            <div class="hdm-row hdm-row-edit">
               <label>買方身分證</label>
               <v-text-field v-model="selectedHouseholdForDetail.buyerIdNumber"
                  :readonly="!isModalEditMode"
                  variant="plain" density="compact" hide-details class="hdm-edit-field"
                  placeholder="—"></v-text-field>
            </div>
            <div class="hdm-row hdm-row-edit">
               <label>車位</label>
               <v-text-field v-model="selectedHouseholdForDetail.parkingLots"
                  :readonly="!isModalEditMode"
                  variant="plain" density="compact" hide-details class="hdm-edit-field"
                  placeholder="—"></v-text-field>
            </div>
            <div class="hdm-row hdm-row-edit">
               <label>門牌</label>
               <v-text-field v-model="selectedHouseholdForDetail.address"
                  :readonly="!isModalEditMode"
                  variant="plain" density="compact" hide-details class="hdm-edit-field"
                  placeholder="—"></v-text-field>
            </div>
            <div class="hdm-row hdm-row-edit">
               <label>撥款日</label>
               <v-text-field type="date"
                  :model-value="toDateInputValue(selectedHouseholdForDetail.appropriationDate)"
                  @update:model-value="(v) => selectedHouseholdForDetail.appropriationDate = v"
                  :readonly="!isModalEditMode"
                  variant="plain" density="compact" hide-details class="hdm-edit-field"></v-text-field>
            </div>
            <div class="hdm-remarks-block">
               <div class="hdm-remarks-label">
                  <v-icon size="small" color="grey-darken-1" class="mr-1">mdi-note-text-outline</v-icon>
                  備註
               </div>
               <v-textarea v-model="selectedHouseholdForDetail.remarks"
                  :readonly="!isModalEditMode"
                  :variant="isModalEditMode ? 'outlined' : 'plain'"
                  :rows="isModalEditMode ? 4 : 2"
                  auto-grow hide-details density="compact"
                  :placeholder="isModalEditMode ? '請輸入備註…' : '—'"
                  class="hdm-edit-textarea"></v-textarea>
            </div>
         </v-card-text>
      </v-card>

      <!-- 預約資訊（依 type） -->
      <v-card
         v-for="type in detailBookingTypes"
         :key="`bt-${type}`"
         variant="outlined"
         class="mb-3"
      >
         <v-card-title class="text-subtitle-2 font-weight-bold py-2 bg-blue-lighten-5">
            <v-icon size="small" class="mr-1" color="primary">mdi-calendar-clock-outline</v-icon>
            {{ type }} 預約資訊
         </v-card-title>
         <v-card-text class="pt-2 pb-2">
            <div class="hdm-row">
               <label>預約日期</label>
               <span>{{ formatDetailDate(detailBookingInfo[type]?.date) || '—' }}</span>
            </div>
            <div class="hdm-row">
               <label>時段</label>
               <span>{{ detailBookingInfo[type]?.timeSlot || '—' }}</span>
            </div>
            <div class="hdm-row">
               <label>選擇方式</label>
               <span>{{ detailBookingInfo[type]?.method || '—' }}</span>
            </div>
            <div v-if="typesWithSubOptions.has(type)" class="hdm-row">
               <label>子項目</label>
               <span>{{ detailBookingInfo[type]?.subOption || '—' }}</span>
            </div>
            <div
               v-for="f in (detailExtraFieldsByType[type] || [])"
               :key="`mf-${type}-${f.id}`"
               class="hdm-row"
            >
               <label>{{ f.label }}</label>
               <span>{{ detailBookingInfo[type]?.bookingMethodDetails?.[f.id] || '—' }}</span>
            </div>
            <!-- 預約人聯絡資訊 -->
            <div class="hdm-booker-divider"></div>
            <div class="hdm-row">
               <label>預約人姓名</label>
               <span :class="{ 'text-grey': !detailBookingInfo[type]?.bookerName }">
                  {{ detailBookingInfo[type]?.bookerName || '—' }}
               </span>
            </div>
            <div class="hdm-row">
               <label>預約人電話</label>
               <span :class="{ 'text-grey': !detailBookingInfo[type]?.bookerPhone }">
                  <a v-if="detailBookingInfo[type]?.bookerPhone" :href="`tel:${detailBookingInfo[type].bookerPhone}`">
                     {{ detailBookingInfo[type].bookerPhone }}
                  </a>
                  <template v-else>—</template>
               </span>
            </div>
            <div class="hdm-row">
               <label>預約人 Email</label>
               <span :class="{ 'text-grey': !detailBookingInfo[type]?.bookerEmail }">
                  <a v-if="detailBookingInfo[type]?.bookerEmail" :href="`mailto:${detailBookingInfo[type].bookerEmail}`">
                     {{ detailBookingInfo[type].bookerEmail }}
                  </a>
                  <template v-else>—</template>
               </span>
            </div>
            <div class="hdm-row hdm-row-edit">
               <label>{{ type }}批次</label>
               <v-text-field
                  :model-value="getBatchCodeForType(type)"
                  @update:model-value="(v) => setBatchCodeForType(type, v)"
                  :readonly="!isModalEditMode"
                  variant="plain" density="compact" hide-details class="hdm-edit-field"
                  placeholder="—"></v-text-field>
            </div>
         </v-card-text>
      </v-card>

      <!-- 報告 / 其他 -->
      <v-card variant="outlined" class="mb-3">
         <v-card-title class="text-subtitle-2 font-weight-bold py-2 bg-grey-lighten-4">
            <v-icon size="small" class="mr-1" color="primary">mdi-file-document-outline</v-icon>報告 / 其他
         </v-card-title>
         <v-card-text class="pt-2 pb-2">
            <!-- 驗屋報告（多筆）-->
            <div class="hdm-row hdm-row-block">
               <label>
                  驗屋報告
                  <v-chip v-if="inspectionReports.length > 0" size="x-small" color="red" variant="tonal" class="ml-1">{{ inspectionReports.length }}</v-chip>
               </label>
               <div class="hdm-report-list">
                  <div v-if="inspectionReports.length === 0" class="text-grey">—</div>
                  <div v-for="(file, idx) in inspectionReports" :key="`rpt-${idx}`" class="hdm-report-item">
                     <a :href="file.url" target="_blank" rel="noopener noreferrer" class="hdm-report-link" :class="{ 'is-downloaded': file.isDownloaded }">
                        <v-icon size="small" :color="file.isDownloaded ? 'grey' : 'red'" class="mr-1">mdi-file-pdf-box</v-icon>
                        <span>{{ file.name }}</span>
                     </a>
                     <div class="hdm-report-actions">
                        <v-btn v-if="!file.isDownloaded" icon="mdi-check-circle-outline"
                           variant="text" color="success" size="x-small" density="comfortable"
                           @click.stop="onModalMarkReportDownloaded(file)" title="標記為已下載"></v-btn>
                        <v-icon v-else color="success" size="small" class="mx-2" title="已下載">mdi-check-circle</v-icon>
                        <v-btn icon="mdi-delete-outline"
                           variant="text" color="error" size="x-small" density="comfortable"
                           @click.stop="onModalDeleteReport(file)" title="刪除"></v-btn>
                     </div>
                  </div>
               </div>
            </div>
            <div v-if="selectedHouseholdForDetail.inspectionReportFolderUrl" class="hdm-row">
               <label>報告資料夾</label>
               <span><a :href="selectedHouseholdForDetail.inspectionReportFolderUrl" target="_blank" rel="noopener">開啟</a></span>
            </div>
            <div v-if="selectedHouseholdForDetail.inspectionDocsUrl" class="hdm-row">
               <label>驗屋文件</label>
               <span><a :href="selectedHouseholdForDetail.inspectionDocsUrl" target="_blank" rel="noopener">開啟</a></span>
            </div>
         </v-card-text>
      </v-card>

      <!-- 驗屋授權書 -->
      <v-card variant="outlined" class="mb-3">
         <v-card-title class="text-subtitle-2 font-weight-bold py-2 bg-teal-lighten-5 d-flex align-center">
            <v-icon size="small" class="mr-1" color="teal-darken-2">mdi-file-sign</v-icon>
            <span>驗屋授權書</span>
            <v-chip size="x-small" :color="authLetters.length > 0 ? 'teal' : 'grey'" variant="tonal" class="ml-2">
               {{ authLetters.length > 0 ? `已授權 ${authLetters.length}` : '未授權' }}
            </v-chip>
         </v-card-title>
         <v-card-text class="pt-2 pb-2">
            <div v-if="authLetters.length === 0" class="text-caption text-grey text-center py-3">
               尚未上傳驗屋授權書（受託人完成簽署後將自動歸檔於此）
            </div>
            <div v-else class="hdm-auth-list">
               <div v-for="(file, idx) in authLetters" :key="`al-${idx}`" class="hdm-auth-item">
                  <a :href="file.url" target="_blank" rel="noopener noreferrer" class="hdm-auth-link">
                     <v-icon size="small" color="teal-darken-2" class="mr-1">mdi-file-sign</v-icon>
                     <span>{{ formatAuthLetterName(file, selectedHouseholdForDetail.unitId) }}</span>
                     <v-icon size="x-small" color="grey" class="ml-1">mdi-open-in-new</v-icon>
                  </a>
                  <div class="hdm-auth-meta">
                     <div class="hdm-auth-meta-row">
                        <label>受託人姓名</label>
                        <span :class="{ 'text-grey': !file.agentName }">{{ file.agentName || '—' }}</span>
                     </div>
                     <div class="hdm-auth-meta-row">
                        <label>與委託人關係</label>
                        <span :class="{ 'text-grey': !file.agentRelationship }">{{ file.agentRelationship || '—' }}</span>
                     </div>
                     <div class="hdm-auth-meta-row">
                        <label>受託人電話</label>
                        <span :class="{ 'text-grey': !file.agentPhone }">
                           <a v-if="file.agentPhone" :href="`tel:${file.agentPhone}`">{{ file.agentPhone }}</a>
                           <template v-else>—</template>
                        </span>
                     </div>
                  </div>
               </div>
            </div>
         </v-card-text>
      </v-card>

      <!-- 客戶回傳訊息 -->
      <v-card variant="outlined" class="mb-3">
         <v-card-title class="text-subtitle-2 font-weight-bold py-2 bg-info-lighten-5 d-flex align-center">
            <v-icon size="small" class="mr-1" color="info">mdi-message-text-outline</v-icon>
            <span>客戶回傳訊息</span>
            <v-chip size="x-small" :color="modalCustomerMessages.length > 0 ? 'info' : 'grey'" variant="tonal" class="ml-2">
               {{ modalCustomerMessages.length }}
            </v-chip>
            <v-spacer></v-spacer>
            <v-btn v-if="modalCustomerMessages.length > 0" size="x-small" variant="text" color="info"
               prepend-icon="mdi-open-in-new"
               @click="openMessageDialog(selectedHouseholdForDetail)">
               完整檢視
            </v-btn>
         </v-card-title>
         <v-card-text class="pt-2 pb-2">
            <div v-if="modalCustomerMessages.length === 0" class="text-caption text-grey text-center py-3">
               尚無客戶回傳訊息
            </div>
            <v-expansion-panels v-else variant="accordion" multiple density="compact">
               <v-expansion-panel v-for="msg in modalCustomerMessages" :key="msg.id">
                  <v-expansion-panel-title class="py-2">
                     <div class="d-flex align-center flex-grow-1 ga-2">
                        <span class="font-weight-bold text-body-2">{{ msg.functionName || '未命名功能' }}</span>
                        <v-chip v-if="msg.status === 'new'" size="x-small" color="error" variant="flat">新</v-chip>
                        <v-chip v-if="msg.attachments && msg.attachments.length > 0" size="x-small" color="primary" variant="outlined">
                           <v-icon size="x-small">mdi-paperclip</v-icon>{{ msg.attachments.length }}
                        </v-chip>
                        <v-spacer></v-spacer>
                        <span class="text-caption text-grey">{{ formatMessageDate(msg.createdAt) }}</span>
                     </div>
                  </v-expansion-panel-title>
                  <v-expansion-panel-text>
                     <v-table density="compact" class="hdm-msg-table">
                        <tbody>
                           <tr v-for="(value, key) in msg.data" :key="key">
                              <td class="bg-grey-lighten-4 font-weight-bold" style="width: 140px;">{{ getFieldLabel(msg, key) }}</td>
                              <td>{{ getFieldDisplayValue(msg, key, value) }}</td>
                           </tr>
                        </tbody>
                     </v-table>
                     <div v-if="msg.attachments && msg.attachments.length > 0" class="mt-2 d-flex flex-wrap ga-1">
                        <v-chip v-for="file in msg.attachments" :key="file.path"
                           size="x-small" :href="file.url" target="_blank" rel="noopener noreferrer"
                           color="primary" variant="outlined" prepend-icon="mdi-paperclip">
                           {{ file.name }}
                        </v-chip>
                     </div>
                  </v-expansion-panel-text>
               </v-expansion-panel>
            </v-expansion-panels>
         </v-card-text>
      </v-card>
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
</v-container>
</template>


<script setup>
import { ref, onMounted, onUnmounted, computed, reactive, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useProjectStore } from '@/store/projectStore';
import { useUserStore } from '@/store/user';
import { listenToAllHouseholds, updateHouseholdData, batchUpdateHouseholds, uploadInspectionHouseholds, listenToFieldDefinitions, saveFieldDefinition, deprecateInspectionReport, markInspectionReportDownloaded, listenToAppointments } from '@/api';
import * as XLSX from 'xlsx-js-style';
import "ag-grid-community/styles/ag-theme-alpine.css";
import "ag-grid-enterprise";
import { AgGridVue } from "ag-grid-vue3";
import { AG_GRID_LOCALE_TW } from '@/utils/agGridLocale';
import { format } from 'date-fns';
import UrlArrayRenderer from '@/components/grid/UrlArrayRenderer.vue';
import AuthLetterArrayRenderer from '@/components/grid/AuthLetterArrayRenderer.vue';
import { formatAuthLetterName, extractAuthLetterDate, getLatestAgentInfo } from '@/utils/authLetterName.js';
import AdminAddBookingDialog from '@/components/AdminAddBookingDialog.vue';


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

const sideBarConfig = ref(true); // Maintain default sidebar as requested, visibility controlled by render

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
const fieldDialog = reactive({
  show: false,
  loading: false,
  error: '',
  data: {
    fieldName: '',
    fieldType: 'checkbox',
    options: []
  }
});

// 1. 新增一個靜態陣列來定義選項，取代 fieldTypeLabels
const fieldDialogItems = [
  { value: 'checkbox', title: '核取/開關' },
  { value: 'text', title: '純文字' },
  { value: 'select', title: '下拉選單' },
];

// 用於表單驗證與確認對話框
const fieldForm = ref(null);
const isConfirmingSave = ref(false);

// --- 處理預約資料的函數 ---
/**
 * 將 appointments 資料轉換為按 unitId × bookingType 索引的 Map
 * 每個單位 × 類型只保留 appointmentDate 最新的一筆有效預約
 */
const buildAppointmentMap = (appointmentsList) => {
  const map = {};

  appointmentsList.forEach(appt => {
    const unitId = appt.unitId;
    const bookingType = appt.bookingType;

    if (!unitId || !bookingType) return; // 跳過無效資料

    // 初始化該 unitId 的對象
    if (!map[unitId]) {
      map[unitId] = {};
    }

    // 取得當前該類型的最新預約（依 appointmentDate 比較）
    const current = map[unitId][bookingType];
    const currentDate = current?.appointmentDate instanceof Date ? current.appointmentDate : null;
    const newDate = appt.appointmentDate instanceof Date ? appt.appointmentDate : null;

    // 若無當前預約，或新預約的日期更新，則更新該類型的預約
    if (!current || (newDate && (!currentDate || newDate > currentDate))) {
      map[unitId][bookingType] = {
        date: appt.appointmentDate || null,
        timeSlot: appt.appointmentTimeSlot || '',
        method: appt.inspectionMethod || '',                       // 純方式（不再與 subOption 合併）
        subOption: appt.bookingSubOption || '',                    // 子項目獨立屬性
        bookingMethodDetails: appt.bookingMethodDetails || {},     // 方式額外資訊（依 method.customFields）
        // 預約人聯絡資訊
        bookerName: appt.bookerName || '',
        bookerPhone: appt.bookerPhone || '',
        bookerEmail: appt.bookerEmail || ''
      };
    }
  });

  return map;
};



// --- 計算屬性 ---
const projectName = computed(() => projectStore.idToNameMap[projectId.value] || '讀取中...');
const pageTitle = computed(() => `${projectName.value} - 戶別資料總表`);
const getRowId = (params) => params.data._docId;

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
const SwitchHeaderRenderer = {
  template: `
    <div class="d-flex flex-column align-center justify-center w-100 h-100">
      <span>{{ params.displayName }}</span>
      <div class="d-flex align-center mt-n2">
        <span class="mr-1 text-caption">全選</span>
        <v-switch
          v-model="checked"
          :indeterminate="indeterminate"
          @update:modelValue="onToggle"
          color="success"
          hide-details
          density="compact"
        ></v-switch>
      </div>
    </div>
  `,
  data() {
    return {
      checked: false,
      indeterminate: false,
    };
  },
  methods: {
    async onToggle(newValue) {
      const field = this.params.column.getColDef().field;
      const updates = [];
      
      this.params.api.forEachNode(node => {
        if (node.data) {
          updates.push({
            docId: node.data._docId,
            data: { [field]: newValue }
          });
        }
      });

      if (updates.length > 0) {
        try {
          await batchUpdateHouseholds(updates);
          this.params.api.forEachNode(node => {
            node.setDataValue(field, newValue);
          });
          this.updateHeaderState();
        } catch (e) {
          console.error('批次更新失敗', e);
        }
      }
    },
    updateHeaderState() {
      const field = this.params.column.getColDef().field;
      let trueCount = 0;
      let totalCount = 0;
      this.params.api.forEachNode(node => {
        if (node.data) {
          if (node.data[field] === true) {
            trueCount++;
          }
          totalCount++;
        }
      });

      if (totalCount === 0) {
        this.checked = false;
        this.indeterminate = false;
      } else if (trueCount === totalCount) {
        this.checked = true;
        this.indeterminate = false;
      } else if (trueCount === 0) {
        this.checked = false;
        this.indeterminate = false;
      } else {
        this.checked = false;
        this.indeterminate = true;
      }
    },
  },
  onModelUpdated() {
    this.updateHeaderState();
  },
  mounted() {
    this.params.api.addEventListener('modelUpdated', this.onModelUpdated);
    this.updateHeaderState();
  },
  beforeUnmount() {
    this.params.api.removeEventListener('modelUpdated', this.onModelUpdated);
  }
};

// v-switch 顯示組件 (可直接互動)
const SwitchRenderer = {
  template: `
    <div class="d-flex justify-center align-center w-100 h-100" @click.stop>
      <v-switch
        :model-value="params.value"
        @update:modelValue="toggleValue"
        color="success"
        inset
        hide-details
        density="compact"
      ></v-switch>
    </div>
  `,
  methods: {
    // 當 switch 被點擊時，直接更新 AG Grid 的資料
    toggleValue(newValue) {
      // 呼叫 AG Grid 的 API 來設定新值，這會觸發 onCellValueChanged
      this.params.setValue(newValue);
    },
  },
};

// --- Customer Message Renderer ---
const CustomerMessageRenderer = {
  template: `
    <div class="d-flex justify-center align-center h-100">
       <v-btn v-if="messageCount > 0"
          color="info" size="small" variant="tonal"
          @click.stop="onClick"
          class="px-2"
          style="min-width: 60px;"
       >
          {{ messageCount }} 則
       </v-btn>
       <span v-else class="text-grey-lighten-1">-</span>
    </div>
  `,
  setup(props) {
     const messageCount = computed(() => {
        const msgs = props.params.value;
        if (!Array.isArray(msgs)) return 0;
        // 正體中文註解：只計算未被冷刪除的訊息數量
        return msgs.filter(m => !m.isDeleted).length;
     });
     const onClick = () => {
        if (props.params.colDef.cellRendererParams && props.params.colDef.cellRendererParams.onClick) {
           props.params.colDef.cellRendererParams.onClick(props.params.data);
        }
     };
     return { messageCount, onClick };
  }
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
const isModalEditMode = ref(false); // 編輯模式總開關（預設關閉，避免誤觸修改）
const _editModeSnapshot = ref(null); // 進入編輯時的原值快照（用於退出時 diff）
const _isSavingModalEdits = ref(false);
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
   isHouseholdDetailVisible.value = true;
   // 預設位置：水平置中、距頂 80px
   if (typeof window !== 'undefined') {
      const modalWidth = 600;
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
   if (!e || e.button !== 0) return; // 只接受左鍵
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

// 戶別整合 Modal — 進入編輯模式：拍一份原值快照供退出時 diff
const enterModalEditMode = () => {
   if (!selectedHouseholdForDetail.value) return;
   try {
      _editModeSnapshot.value = JSON.parse(JSON.stringify(selectedHouseholdForDetail.value));
   } catch (_) {
      _editModeSnapshot.value = { ...selectedHouseholdForDetail.value };
   }
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

   if (Object.keys(payload).length === 0) {
      snackbar.text = '無變更';
      snackbar.color = 'info';
      snackbar.show = true;
      _editModeSnapshot.value = null;
      isModalEditMode.value = false;
      return;
   }

   _isSavingModalEdits.value = true;
   try {
      await updateHouseholdData(h._docId, payload);
      snackbar.text = `已儲存 ${Object.keys(payload).length} 個欄位變更`;
      snackbar.color = 'success';
      snackbar.show = true;
   } catch (err) {
      console.error('Modal 批次儲存失敗:', err);
      snackbar.text = `儲存失敗: ${err.message}`;
      snackbar.color = 'error';
      snackbar.show = true;
      // 回滾本地至快照值
      try {
         selectedHouseholdForDetail.value = { ...selectedHouseholdForDetail.value, ...snap };
      } catch (_) { /* ignore */ }
   } finally {
      _isSavingModalEdits.value = false;
      _editModeSnapshot.value = null;
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
    { headerName: '買方姓名', field: 'buyerName', editable: true },
     { headerName: '備註', field: 'remarks', editable: true, minWidth: 250 },
    { headerName: '買方電話', field: 'buyerPhone', editable: true, minWidth: 160 },
    { headerName: '買方Email', field: 'buyerEmail', editable: true, minWidth: 200 },
    { headerName: '買方身分證', field: 'buyerIdNumber', editable: true },
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
  ];

  return cols;
});

// 2. 根據從 Firestore 獲取的自訂欄位定義，動態生成 AG-Grid 欄位
const dynamicColDefs = computed(() => {
  const _customFieldCols = customFieldDefs.value.map(def => {
    const colDef = {
      headerName: def.fieldName,
      field: def.fieldName, // 直接使用中文欄位名作為 field key
      editable: true,
      valueGetter: params => { // 「延遲更新」策略核心
        if (params.data && params.data.hasOwnProperty(def.fieldName)) {
          return params.data[def.fieldName];
        }
        return def.fieldType === 'checkbox' ? false : ""; // 提供預設值
      }
    };

    switch (def.fieldType) {
      case 'checkbox':
        colDef.cellRenderer = SwitchRenderer;
        break;
      case 'select':
        colDef.cellEditor = 'agSelectCellEditor';
        colDef.cellEditorParams = {
          values: def.options || [],
        };
        break;
      case 'text':
      default:
        // 使用預設的文字編輯器
        break;
    }
    return colDef;
  });

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
      // 預約日期欄位
      _bookingInfoCols.push({
        headerName: `${type}(預約日期)`,
        field: `_booking_${type}_date`,
        width: 140,
        editable: false,
        valueGetter: params => {
          return params.data?._bookingInfo?.[type]?.date || '';
        },
        valueFormatter: dateFormatter,
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

      // 建立標頭對應表
      const uploadedHeaders = dataAsArrays[0].map(h => String(h || '').trim());
       const requiredHeaders = ['文件ID', ...finalColDefs.value.map(def => def.headerName)];
      const headerMap = new Map();
       finalColDefs.value.forEach(def => headerMap.set(def.headerName, def.field));
      headerMap.set('文件ID', '_docId');

      // 驗證標頭
      const missingHeaders = requiredHeaders.filter(h => !uploadedHeaders.includes(h));
      if (missingHeaders.length > 0) {
        throw new Error(`檔案標頭不符，缺少必要欄位: \n${missingHeaders.join('、')}`);
      }

      const dataRows = dataAsArrays.slice(1);
      const nonEmptyRows = dataRows.filter(row => row.some(cell => cell !== null && cell !== undefined && cell !== ''));

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
      uploadMessage.value = `成功解析 ${jsonDataWithEnglishKeys.length} 筆資料，可以開始上傳。`;
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

// 「動態欄位」相關方法 ---
const openFieldDefinitionDialog = () => {
  // 重置對話框狀態
  fieldDialog.data.fieldName = '';
  fieldDialog.data.fieldType = 'checkbox';
  fieldDialog.data.options = [];
  fieldDialog.error = '';
  fieldDialog.loading = false;
  fieldDialog.show = true;
};

const handleSaveFieldDefinition = async () => {
  if (!fieldForm.value) return;

  const { valid } = await fieldForm.value.validate();
  if (valid) {
    // 表單驗證通過後，開啟確認對話框
    isConfirmingSave.value = true;
  }
};

 // 3. 新增一個函式，用於處理使用者確認後真正的儲存邏輯
const confirmAndSave = async () => {
  isConfirmingSave.value = false; // 先關閉確認框
  fieldDialog.loading = true;
  fieldDialog.error = '';
  
  try {
    const payload = {
      ...fieldDialog.data,
      projectId: projectId.value,
      collectionName: 'households',
      order: 100 + (customFieldDefs.value.length || 0),
    };
    const result = await saveFieldDefinition(payload);

    if (result.status === 'success') {
      snackbar.text = result.message;
      snackbar.color = 'success';
      snackbar.show = true;
      fieldDialog.show = false; // 成功後關閉主對話框
    } else {
      throw new Error(result.message);
    }
  } catch (err) {
    fieldDialog.error = err.message || '儲存失敗，請重試。';
  } finally {
    fieldDialog.loading = false;
  }
};


// ✓ 【修改】簡化 onGridReady，只用來獲取 gridApi
const onGridReady = (params) => {
  console.log("AG Grid 已就緒");
  gridApi.value = params.api;
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

  // 如果是貼上動作
  if (source === 'paste') {
    collectedUpdates.push({
      docId: householdDocId,
      data: { [field]: newValue }
    });
    handleBatchPaste(event.api);
    return;
  }

  // 一般手動修改動作
  if (isBatchProcessing.value) return;

  console.log('單一單元格更新:', householdDocId, field, newValue);
  try {
    await updateHouseholdData(householdDocId, { [field]: newValue });
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
.household-detail-modal {
   position: fixed;
   width: 720px;
   max-width: calc(100vw - 24px);
   max-height: calc(100vh - 100px);
   background: #ffffff;
   border-radius: 8px;
   box-shadow: 0 10px 32px rgba(0, 0, 0, 0.25);
   z-index: 2400; /* 在 ag-grid 之上、Vuetify v-overlay 之下（v-overlay 預設 2400 開始，個別 dialog overlay 開到 ~2400+） */
   overflow: hidden;
   display: flex;
   flex-direction: column;
}
.hdm-header {
   background: linear-gradient(90deg, #1976d2 0%, #1565c0 100%);
   color: #ffffff;
   padding: 8px 12px;
   cursor: move;
   user-select: none;
   display: flex;
   align-items: center;
}
.hdm-title {
   font-weight: 600;
   font-size: 0.95rem;
}
.hdm-subtitle {
   font-weight: 400;
   font-size: 0.8rem;
   opacity: 0.85;
   margin-left: 8px;
}
.hdm-title .title-sep {
   opacity: 0.6;
   margin: 0 4px;
   font-weight: 400;
}
.hdm-body {
   padding: 12px;
   overflow-y: auto;
   background: #fafafa;
}
.hdm-row {
   display: flex;
   align-items: flex-start;
   padding: 4px 0;
   border-bottom: 1px dashed #e0e0e0;
   font-size: 0.875rem;
   line-height: 1.5;
}
.hdm-row:last-child {
   border-bottom: none;
}
.hdm-row label {
   flex: 0 0 110px;
   color: #616161;
   font-weight: 500;
}
.hdm-row span {
   flex: 1 1 auto;
   word-break: break-all;
   color: #212121;
}
/* 驗屋報告 list（多筆） */
.hdm-row-block {
   align-items: stretch;
   flex-direction: column;
}
.hdm-row-block > label {
   flex: 0 0 auto;
   margin-bottom: 4px;
   display: flex;
   align-items: center;
}
.hdm-report-list {
   display: flex;
   flex-direction: column;
   gap: 4px;
   width: 100%;
}
.hdm-report-item {
   display: flex;
   align-items: center;
   justify-content: space-between;
   padding: 4px 6px;
   background: #ffffff;
   border: 1px solid #e0e0e0;
   border-radius: 4px;
}
.hdm-report-link {
   display: flex;
   align-items: center;
   flex: 1 1 auto;
   min-width: 0;
   color: #1976d2;
   text-decoration: none;
   font-size: 0.875rem;
}
.hdm-report-link:hover { text-decoration: underline; }
.hdm-report-link.is-downloaded { color: #9e9e9e; }
.hdm-report-link span {
   overflow: hidden;
   text-overflow: ellipsis;
   white-space: nowrap;
}
.hdm-report-actions {
   display: flex;
   align-items: center;
   flex: 0 0 auto;
   margin-left: 8px;
}
/* 預約資訊卡片內：將預約人聯絡資訊與上方欄位視覺區隔 */
.hdm-booker-divider {
   height: 1px;
   background: #eeeeee;
   margin: 6px 0 4px;
}
.hdm-row a {
   color: #1976d2;
   text-decoration: none;
}
.hdm-row a:hover { text-decoration: underline; }
/* 驗屋授權書清單（每筆含受託人 meta 區塊） */
.hdm-auth-list {
   display: flex;
   flex-direction: column;
   gap: 8px;
   width: 100%;
}
.hdm-auth-item {
   padding: 8px 10px;
   background: #ffffff;
   border: 1px solid #e0e0e0;
   border-left: 3px solid #00796b;
   border-radius: 4px;
}
.hdm-auth-link {
   display: flex;
   align-items: center;
   color: #00695c;
   text-decoration: none;
   font-size: 0.875rem;
   font-weight: 500;
   margin-bottom: 4px;
}
.hdm-auth-link:hover { text-decoration: underline; }
.hdm-auth-meta {
   display: grid;
   grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
   gap: 2px 12px;
   padding-left: 22px;
   padding-top: 4px;
   border-top: 1px dashed #eeeeee;
   margin-top: 4px;
}
.hdm-auth-meta-row {
   display: flex;
   align-items: center;
   font-size: 0.8125rem;
   gap: 6px;
}
.hdm-auth-meta-row label {
   color: #757575;
   min-width: 90px;
   flex-shrink: 0;
}
.hdm-auth-meta-row span,
.hdm-auth-meta-row a {
   color: #424242;
   word-break: break-all;
}
.hdm-auth-meta-row a {
   color: #1976d2;
   text-decoration: none;
}
.hdm-auth-meta-row a:hover { text-decoration: underline; }
/* 開關 row */
.hdm-switch-row {
   display: flex;
   align-items: center;
   padding: 2px 0;
   font-size: 0.875rem;
}
.hdm-switch-row label {
   flex: 0 0 140px;
   color: #424242;
   font-weight: 500;
}
.hdm-switch-row :deep(.v-switch) {
   margin: 0;
}
/* 客戶回傳訊息表格內部稍微緊湊 */
.hdm-msg-table :deep(td) {
   font-size: 0.825rem !important;
   padding: 6px 8px !important;
}
/* inline 編輯欄位（plain variant 視覺接近純文字，hover/focus 時加底線提示） */
.hdm-row-edit {
   align-items: center;
}
.hdm-row-edit > label {
   align-self: center;
}
.hdm-edit-field {
   flex: 1 1 auto;
   font-size: 0.875rem;
}
.hdm-edit-field :deep(.v-field) {
   padding: 0;
}
.hdm-edit-field :deep(.v-field__input) {
   min-height: 28px;
   padding: 0;
   font-size: 0.875rem;
   color: #212121;
}
/* 只在「編輯模式」下顯示 hover/focus 的可編輯提示，避免檢視模式誤以為可點 */
.household-detail-modal.is-edit-mode .hdm-edit-field :deep(.v-field__input:hover) {
   background: rgba(25, 118, 210, 0.04);
   border-radius: 3px;
}
.household-detail-modal.is-edit-mode .hdm-edit-field :deep(.v-field--focused) {
   background: rgba(25, 118, 210, 0.07);
   border-radius: 3px;
}
/* 檢視模式下文字顏色稍深、cursor 預設、視覺接近純文字 */
.household-detail-modal:not(.is-edit-mode) .hdm-edit-field :deep(.v-field__input) {
   cursor: default;
}
/* 檢視模式：開關不可點，但保留顏色狀態（綠色=開、灰色=關），不要整顆變灰 */
.household-detail-modal:not(.is-edit-mode) .hdm-switch-row :deep(.v-switch),
.household-detail-modal:not(.is-edit-mode) .hdm-switch-row :deep(.v-switch__control) {
   pointer-events: none;
}
.household-detail-modal:not(.is-edit-mode) .hdm-switch-row :deep(.v-selection-control) {
   opacity: 1;
}
.hdm-row-block.hdm-row-edit > label {
   align-self: flex-start;
   margin-top: 4px;
}
/* 備註區塊：獨立 block，標籤在上、textarea 佔滿全寬 */
.hdm-remarks-block {
   padding: 8px 0 4px;
   border-top: 1px dashed #e0e0e0;
   margin-top: 4px;
}
.hdm-remarks-label {
   display: flex;
   align-items: center;
   color: #616161;
   font-weight: 500;
   font-size: 0.85rem;
   margin-bottom: 6px;
}
.hdm-edit-textarea {
   width: 100%;
   font-size: 0.875rem;
}
.hdm-edit-textarea :deep(.v-field) {
   width: 100%;
}
.hdm-edit-textarea :deep(.v-field--variant-outlined) {
   border-radius: 6px;
}
.hdm-edit-textarea :deep(.v-field--variant-outlined .v-field__input) {
   min-height: 110px;
   padding: 10px 12px;
   font-size: 0.9rem;
   color: #212121;
   line-height: 1.6;
}
.hdm-edit-textarea :deep(.v-field--variant-outlined textarea) {
   min-height: 90px;
}
.hdm-edit-textarea :deep(.v-field--variant-plain .v-field__input) {
   padding: 4px 0;
   min-height: 24px;
   line-height: 1.6;
   color: #212121;
   white-space: pre-wrap;
}
</style>