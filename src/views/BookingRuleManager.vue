<template>
  <v-container fluid>
    <v-card>
      <v-card-title class="d-flex align-center text-h5 text-primary">
       
        <v-icon start>mdi-cogs</v-icon>
        <span>驗屋預約系統管理：{{ projectName || '讀取中...' }}</span> 
        <v-spacer></v-spacer>
      </v-card-title>
      <v-divider></v-divider>
      
      <v-tabs v-model="activeTab" bg-color="primary">
        <v-tab value="batches">批次管理</v-tab>
        <v-tab value="settings">驗屋預約設定</v-tab>
        <v-tab value="report-settings">驗屋報告設定</v-tab>
      </v-tabs>

      <div v-if="isLoading" class="text-center pa-10">
        <v-progress-circular indeterminate color="primary" size="64"></v-progress-circular>
      </div>
      <div v-else>
        <v-window v-model="activeTab">
          <v-window-item value="batches" class="pa-4">
  <v-toolbar flat color="transparent">
    <v-text-field
      v-model="searchQuery"
      label="搜尋..."
      prepend-inner-icon="mdi-magnify"
      variant="solo-filled"
      flat
      density="compact"
      hide-details
      clearable
      class="mr-4"
      style="max-width: 350px;"
    ></v-text-field>
    <v-spacer></v-spacer>
    <v-btn color="primary" @click="openBatchDialog()" prepend-icon="mdi-plus">新增批次</v-btn>
  </v-toolbar>

  <div class="d-none d-md-block">
    <v-data-table
      :headers="batchHeaders"
      :items="processedBookingBatches" 
      :loading="isBatchLoading"
      :search="searchQuery"  
      item-value="id"
      class="elevation-1"
    >
      <template v-slot:item.applicationWindow="{ item }">
        <div v-if="item.applicationStart && item.applicationEnd">
          <div class="d-flex align-center">
            <v-chip size="x-small" color="teal-lighten-3" text-color="teal-darken-4" label class="mr-1 font-weight-bold">起</v-chip>
            <span>{{ formatDisplayDateTime(item.applicationStart) }}</span>
          </div>
          <div class="d-flex align-center mt-1">
            <v-chip size="x-small" color="pink-lighten-3" text-color="pink-darken-4" label class="mr-1 font-weight-bold">迄</v-chip>
            <span>{{ formatDisplayDateTime(item.applicationEnd) }}</span>
          </div>
        </div>
        <span v-else class="text-grey">未設定</span>
      </template>
      <template v-slot:item.bookingWindow="{ item }">
        <div>
            <div class="d-flex align-center">
            <v-chip size="x-small" color="teal-lighten-3" text-color="teal-darken-4" label class="mr-1 font-weight-bold">起</v-chip>
            <span>{{ item.bookingStart }}</span>
          </div>
          <div class="d-flex align-center mt-1">
            <v-chip size="x-small" color="pink-lighten-3" text-color="pink-darken-4" label class="mr-1 font-weight-bold">迄</v-chip>
            <span>{{ item.bookingEnd }}</span>
          </div>
        </div>
      </template>
      <template v-slot:item.statusText="{ item }">
        <v-chip :color="getBatchStatus(item).color" size="small">
          {{ item.statusText }}
        </v-chip>
      </template>
      <template v-slot:item.actions="{ item }">
          <v-btn icon="mdi-eye" variant="text" color="info" size="small" class="mr-1" @click="openPreviewDialog(item)"></v-btn>
          <v-btn icon="mdi-pencil" variant="text" color="primary" size="small" class="mr-1" @click="openBatchDialog(item)"></v-btn>
          <v-btn icon="mdi-delete" variant="text" color="error" size="small" @click="openDeleteDialog(item)"></v-btn>
      </template>
    </v-data-table>
  </div>

  <div class="d-md-none mt-4">
    <div v-if="isBatchLoading" class="text-center pa-10">
      <v-progress-circular indeterminate color="primary"></v-progress-circular>
    </div>
    <div v-else>
      <v-card
        v-for="item in filteredBatchesForCards"
        :key="item.id"
        class="mb-3"
        variant="outlined"
      >
        <v-card-title class="d-flex justify-space-between align-center text-body-1 font-weight-bold py-2">
          <span>{{ item.bookingType }}: {{ item.batchCode }}</span>
          <v-chip :color="getBatchStatus(item).color" size="small" label>{{ item.statusText }}</v-chip>
        </v-card-title>
        <v-divider></v-divider>
        <v-card-text class="py-2">
          <div class="mb-2">
            <div class="text-caption text-grey-darken-1">預約開放區間</div>
            <div>
              <span class="font-weight-bold text-teal-darken-2 mr-1">起:</span>
              <span>{{ formatDisplayDateTime(item.applicationStart) || '未設定' }}</span>
            </div>
            <div>
              <span class="font-weight-bold text-pink-darken-2 mr-1">迄:</span>
              <span>{{ formatDisplayDateTime(item.applicationEnd) || '未設定' }}</span>
            </div>
          </div>
          <div>
            <div class="text-caption text-grey-darken-1">可驗屋區間</div>
            <div>
              <span class="font-weight-bold text-teal-darken-2 mr-1">起:</span>
              <span>{{ item.bookingStart || '未設定' }}</span>
            </div>
            <div>
              <span class="font-weight-bold text-pink-darken-2 mr-1">迄:</span>
              <span>{{ item.bookingEnd || '未設定' }}</span>
            </div>
          </div>
        </v-card-text>
        <v-divider></v-divider>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="info" variant="tonal" size="small" @click="openPreviewDialog(item)">預覽</v-btn>
          <v-btn color="primary" variant="tonal" size="small" @click="openBatchDialog(item)">編輯</v-btn>
          <v-btn color="error" variant="tonal" size="small" @click="openDeleteDialog(item)">刪除</v-btn>
        </v-card-actions>
      </v-card>
      <div v-if="filteredBatchesForCards.length === 0" class="text-center text-grey-darken-1 py-10">
        <p>找不到符合條件的批次</p>
      </div>
    </div>
  </div>
</v-window-item>

           <v-window-item value="settings" class="settings-tab-content">
            <div v-if="isSettingsLoading" class="d-flex justify-center align-center flex-grow-1 pa-10">
                <v-progress-circular indeterminate color="primary"></v-progress-circular>
            </div>
            
            <div v-else class="settings-form-container pa-4">
              <v-form>
                <v-switch
                  v-model="projectSettings.isPublished"
                  :label="`開放 ${projectName} 預約系統`"
                  color="success"
                  inset
                  hint="開啟後，客戶即可透過預約系統進行預約"
                  persistent-hint
                ></v-switch>
                <v-divider class="my-6"></v-divider>
                <p class="text-subtitle-1 font-weight-bold mb-2">Logo 上傳</p>
                <v-sheet border rounded class="pa-4 text-center">
                  <v-img :src="projectSettings.logoUrl" height="60" contain class="mb-4 bg-grey-lighten-4">
                    <template v-slot:placeholder>
                      <div class="d-flex align-center justify-center fill-height">
                        <span class="text-grey-darken-1">圖片檔案大小請勿超過 1MB</span>
                      </div>
                    </template>
                  </v-img>
                  <v-file-input
                    label="選擇 Logo 圖片"
                    accept="image/*"
                    variant="outlined"
                    density="compact"
                    prepend-icon="mdi-camera"
                    hide-details
                    @change="handleLogoUpload"
                  ></v-file-input>
                </v-sheet>
                <v-divider class="my-6"></v-divider>
                <v-text-field
                  v-model="projectSettings.pageTitle"
                  label="預約頁面大標題"
                  variant="outlined"
                  density="compact"
                  hint="顯示在預約頁面最上方的標題文字"
                  persistent-hint
                  class="mb-6"
                ></v-text-field>
                <v-combobox
                  v-model="projectSettings.bookingTypes"
                  :items="defaultBookingTypes"  
                  label="預約項目"
                  hint="可從下拉選單快選，或輸入文字後按 Enter 新增"
                  persistent-hint
                  multiple
                  chips
                  closable-chips
                  variant="outlined"
                  density="compact"
                ></v-combobox>
                <v-switch
                  v-model="projectSettings.validateId"
                  label="啟用身分證驗證"
                  true-value="ON"
                  false-value="OFF"
                  color="primary"
                  inset
                  hint="啟用後，客戶在預約時需輸入與產權人相符身分證號，以免預約時戶別及產權人不符"
                  persistent-hint
                ></v-switch>
                <v-switch
                  v-model="projectSettings.checkDuplicate"
                  label="檢查重複預約"
                  true-value="ON"
                  false-value="OFF"
                  color="primary"
                  inset
                  hint="啟用後，系統會檢查同一戶別、同一預約項目是否已有有效預約"
                  persistent-hint
                  class="mt-4"
                ></v-switch>
                
                <v-switch
                  v-model="projectSettings.showBookingMethod"
                  label="顯示驗屋方式選項"
                  color="primary"
                  inset
                  class="mt-4"
                ></v-switch>
                <v-combobox
                  v-model="projectSettings.bookingMethodOptions"
                  :items="defaultBookingMethods"
                  label="編輯驗屋方式選項"
                  multiple
                  chips
                  closable-chips
                  variant="outlined"
                  density="compact"
                  :disabled="!projectSettings.showBookingMethod"
                  hint="可從下拉選單快選，或輸入文字後按 Enter 新增"
                  persistent-hint
                >
                  <template v-slot:selection="{ attrs, item, parent }">
                    <v-chip
                      v-bind="attrs"
                      :model-value="true"
                      closable
                      @click:close="parent.selectItem(item)"
                    >
                      {{ item.title }}
                    </v-chip>
                  </template>
                </v-combobox>

                   <v-combobox
                  v-model="projectSettings.inspectionStaff"
                  label="編輯驗屋人員"
                  multiple
                  chips
                  closable-chips
                  variant="outlined"
                  density="compact"
                  hint="在此新增修改驗屋人員"
                  persistent-hint
                  class="mt-6"
                ></v-combobox>


                <v-divider class="my-6"></v-divider>
                <div class="d-flex align-center"> <label class="v-label text-caption">招呼語</label>
  <v-btn size="x-small" variant="tonal" @click="applyTemplate('greeting')" class="ml-4">套用範本</v-btn> </div>
                <RichTextEditor v-model="projectSettings.intro.greeting" class="mb-4" />
                <div class="d-flex align-center"> <label class="v-label text-caption">內文說明</label>
  <v-btn size="x-small" variant="tonal" @click="applyTemplate('body')" class="ml-4">套用範本</v-btn> </div>
                <RichTextEditor v-model="projectSettings.intro.body" class="mb-4" />
<div class="d-flex align-center"> <label class="v-label text-caption">頁尾文字</label>
  <v-btn size="x-small" variant="tonal" @click="applyTemplate('footer')" class="ml-4">套用範本</v-btn> </div>
                <RichTextEditor v-model="projectSettings.intro.footer" class="mb-4" />
                <div class="d-flex align-center"> <label class="v-label text-caption">結束語</label>
  <v-btn size="x-small" variant="tonal" @click="applyTemplate('closingText')" class="ml-4">套用範本</v-btn> </div>
                <RichTextEditor v-model="projectSettings.intro.closingText" class="mb-4" />
                <v-divider class="my-6"></v-divider>
                <p class="text-subtitle-1 font-weight-bold mb-2">聯絡資訊設定</p>
                <v-text-field                  v-model="projectSettings.intro.contact.name"
                  label="聯絡單位名稱"
                  variant="outlined"
                  density="compact"
                ></v-text-field>
                <v-text-field
                  v-model="projectSettings.intro.contact.phone"
                  label="聯絡電話"
                  variant="outlined"
                  density="compact"
                  class="mt-2"
                ></v-text-field>
                <v-divider class="my-6"></v-divider>
                <p class="text-subtitle-1 font-weight-bold mb-2">驗屋說明設定</p>
                <v-switch
                  v-model="projectSettings.intro.alert.show"
                  label="顯示驗屋說明"
                  color="primary"
                  inset
                ></v-switch>
                <v-switch
                  v-model="projectSettings.intro.alert.showConfirmation"
                  label="須勾選「我已閱讀」後才可開始預約"
                  color="primary"
                  inset
                  persistent-hint
                  :disabled="!projectSettings.intro.alert.show"
                ></v-switch>
                <v-text-field
                  v-model="projectSettings.intro.alert.title"
                  label="驗屋說明標題"
                  variant="outlined"
                  density="compact"
                  class="mt-2"
                  :disabled="!projectSettings.intro.alert.show"
                ></v-text-field>
                <div class="d-flex align-center"> <label class="v-label text-caption">提示框內容</label>
  <v-btn size="x-small" variant="tonal" @click="applyTemplate('alertText')" :disabled="!projectSettings.intro.alert.show" class="ml-4">套用範本</v-btn> </div>
                <RichTextEditor v-model="projectSettings.intro.alert.text" class="mb-4" :disabled="!projectSettings.intro.alert.show"/>
                <v-divider class="my-6"></v-divider>
                <div class="d-flex justify-space-between align-center mb-2">
                    <p class="text-subtitle-1 font-weight-bold">常見問答 (FAQ) 設定</p>
                    <v-btn color="primary" size="small" @click="addFaqItem" prepend-icon="mdi-plus">新增問答</v-btn>
                </div>
                <div v-if="projectSettings.intro.faq.length === 0" class="text-center text-grey pa-4 border rounded">
                    點擊「新增問答」來建立 FAQ
                </div>
                <div v-else>
                    <v-sheet v-for="(item, index) in projectSettings.intro.faq" :key="index" border rounded class="pa-4 mb-4">
                        <div class="d-flex justify-space-between align-center mb-3">
                            <span class="font-weight-bold">問題 {{ index + 1 }}</span>
                            <v-btn icon="mdi-delete-outline" variant="text" color="error" size="small" @click="removeFaqItem(index)"></v-btn>
                        </div>
                        <v-text-field
                            v-model="item.q"
                            label="問題 (Q)"
                            variant="outlined"
                            density="compact"
                        ></v-text-field>
                        <div class="d-flex justify-space-between align-center mt-2">
                          <label class="v-label text-caption">回答 (A)</label>
                        </div>
                        <v-textarea
                            v-model="item.a"
                            variant="outlined"
                            density="compact"
                            class="mt-1"
                            rows="3"
                            auto-grow
                        ></v-textarea>
                    </v-sheet>
                </div>
              </v-form>
            </div>

            <v-card-actions class="sticky-actions pa-4">
              <v-spacer></v-spacer>
              <v-btn 
                color="primary" 
                variant="elevated"
                @click="saveSettings"
                :loading="isSavingSettings"
                size="large"
              >
                儲存設定
              </v-btn>
            </v-card-actions>
          </v-window-item>

<v-window-item value="report-settings" class="settings-tab-content">
            <div v-if="isSettingsLoading" class="d-flex justify-center align-center flex-grow-1 pa-10">
              <v-progress-circular indeterminate color="primary"></v-progress-circular>
            </div>
            <div v-else-if="projectSettings.reportSettings" class="settings-form-container pa-4">
              <v-form>
                <p class="text-h6 font-weight-bold mb-4">上傳頁面設定</p>

                <v-switch
                  v-model="projectSettings.showReportUploadButton"
                  label="啟用上傳驗屋報告功能"
                  color="primary"
                  inset
                  hint="啟用後，客戶在預約頁面可以看到「上傳驗屋報告」的按鈕"
                  persistent-hint
                  class="mt-4"
                ></v-switch>

                <p class="text-subtitle-1 font-weight-bold mt-6 mb-2">驗屋報告上傳網址</p>
                <v-text-field
                  v-model="projectSettings.reportSettings.uploadReminderEmail.uploadUrl"
                  variant="outlined"
                  density="compact"
                  class="mt-1"
                   placeholder="輸入驗屋報告上傳網址"
                ></v-text-field>

                 <p class="text-subtitle-1 font-weight-bold mt-6 mb-2">驗屋報告資料夾</p>
                <v-text-field
                  v-model="projectSettings.reportSettings.reportDataFolderUrl"
                  variant="outlined"
                  density="compact"
                  class="mt-1"
                  placeholder="輸入驗屋報告雲端資料夾位置"
                ></v-text-field>

                <p class="text-subtitle-1 font-weight-bold mb-2">上傳頁說明</p>
                <RichTextEditor v-model="projectSettings.reportUploadIntro.body" class="mb-6" />

                <v-divider class="my-6"></v-divider>

                <div class="d-flex align-center mb-2">
                  <p class="text-subtitle-1 font-weight-bold">上傳須知提示框</p>
                  <v-btn size="small" variant="tonal" class="ml-4" @click="isAlertPreviewDialogVisible = true" prepend-icon="mdi-eye-outline">預覽</v-btn>
                </div>
                <v-switch
                  v-model="projectSettings.reportUploadIntro.alert.show"
                  label="顯示提示框"
                  color="primary"
                  inset
                ></v-switch>
                <v-text-field
                  v-model="projectSettings.reportUploadIntro.alert.title"
                  label="提示框標題"
                  variant="outlined"
                  density="compact"
                  class="mt-4"
                  :disabled="!projectSettings.reportUploadIntro.alert.show"
                ></v-text-field>
                <v-row class="mt-2">
                  <v-col cols="12" sm="6">
                    <v-select
                      v-model="projectSettings.reportUploadIntro.alert.type"
                      :items="['info', 'success', 'warning', 'error']"
                      label="提示框樣式 (Type)"
                      variant="outlined"
                      density="compact"
                      :disabled="!projectSettings.reportUploadIntro.alert.show"
                    ></v-select>
                  </v-col>
                  <v-col cols="12" sm="6">
                     <v-select
                      v-model="projectSettings.reportUploadIntro.alert.color"
                      :items="['primary', 'info', 'success', 'warning', 'error', 'red', 'blue']"
                      label="提示框顏色 (Color)"
                      variant="outlined"
                      density="compact"
                      :disabled="!projectSettings.reportUploadIntro.alert.show"
                    ></v-select>
                  </v-col>
                </v-row>
                <label class="v-label text-caption mt-2">提示框內容</label>
                <RichTextEditor v-model="projectSettings.reportUploadIntro.alert.text" class="mt-2 mb-6" :disabled="!projectSettings.reportUploadIntro.alert.show" />

                <v-divider class="my-8"></v-divider>

                <p class="text-h6 font-weight-bold mb-4">自動化提醒設定</p>
                
                <p class="text-subtitle-1 font-weight-bold mb-2">提醒上傳驗屋報告</p>
                <v-combobox
                  v-model="projectSettings.reportSettings.uploadReminderDays"
                  :items="[7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20]"
                  label="驗屋完成後，間隔幾天後發送通知"
                  hint="可多選或手動輸入天數後按 Enter"
                  persistent-hint
                  multiple
                  chips
                  closable-chips
                  variant="outlined"
                  density="compact"
                ></v-combobox>

                <p class="text-subtitle-1 font-weight-bold mt-6 mb-2">通知方式</p>
                <div>
                  <v-checkbox
                    v-model="projectSettings.reportSettings.uploadReminderMethods"
                    label="Email"
                    value="EMAIL"
                    density="compact"
                    hide-details
                    class="d-inline-block mr-4"
                  ></v-checkbox>
                  <v-checkbox
                    v-model="projectSettings.reportSettings.uploadReminderMethods"
                    label="LINE"
                    value="LINE"
                    density="compact"
                    hide-details
                    class="d-inline-block"
                  ></v-checkbox>
                </div>

                

                <p class="text-subtitle-1 font-weight-bold mt-6 mb-2">未上傳報告 - 每日提醒排程</p>
                <p class="text-body-2 text-medium-emphasis mb-4">
                  設定每日自動檢查並發送提醒的固定時間點。函式會每小時檢查一次，當下時間符合此處設定時，才會執行任務。
                </p>
                <v-sheet border rounded class="pa-4">
                  <v-switch
                    v-model="projectSettings.reportSettings.uploadReminderSchedule.enabled"
                    label="啟用每日提醒排程"
                    color="primary"
                    inset
                    hide-details
                    class="mb-2"
                  ></v-switch>
                  <v-text-field
                    v-model="projectSettings.reportSettings.uploadReminderSchedule.time"
                    label="每日提醒時間"
                    type="time"
                    density="compact"
                    variant="outlined"
                    hide-details
                    :disabled="!projectSettings.reportSettings.uploadReminderSchedule.enabled"
                    style="max-width: 150px;"
                  ></v-text-field>
                </v-sheet>

                <v-btn 
                  @click="runManualTrigger" 
                  :loading="isTesting"
                  color="error"
                  variant="elevated"
                  class="ma-4"
                >
                  <v-icon start>mdi-send-clock-outline</v-icon>
                  手動提醒
                </v-btn>
                
                <v-divider class="my-6"></v-divider>

                <p class="text-subtitle-1 font-weight-bold mb-2">未上傳驗屋報告 EMAIL 通知格式</p>
                <div class="d-flex align-center">
                  <label class="v-label text-caption">主旨</label>
                  <v-btn size="x-small" variant="tonal" @click="applyTemplate('uploadReminderEmailSubject')" class="ml-4">套用範本</v-btn>
                </div>
                <v-text-field
                  v-model="projectSettings.reportSettings.uploadReminderEmail.subject"
                  variant="outlined"
                  density="compact"
                  class="mt-1"
                ></v-text-field>

                <div class="d-flex align-center mt-4">
                  <label class="v-label text-caption">內文</label>
                  <v-btn size="x-small" variant="tonal" @click="applyTemplate('uploadReminderEmailBody')" class="ml-4">套用範本</v-btn>
                </div>
                <RichTextEditor 
                  v-model="projectSettings.reportSettings.uploadReminderEmail.body" 
                  class="mt-1"
                  :placeholders="emailPlaceholders"
                />

                <div class="d-flex align-center mt-4">
                  <label class="v-label text-caption">提醒</label>
                  <v-btn size="x-small" variant="tonal" @click="applyTemplate('uploadReminderEmailReminder')" class="ml-4">套用範本</v-btn>
                </div>
                <RichTextEditor 
                  v-model="projectSettings.reportSettings.uploadReminderEmail.reminder" 
                  class="mt-1"
                  :placeholders="emailPlaceholders"
                /> 
        
                
         
           

                <v-divider class="my-8"></v-divider>

                <p class="text-h6 font-weight-bold mb-4">排程設定</p>
                  <p class="text-subtitle-1 font-weight-bold mb-2">驗屋報告未下載通知</p>
                  <p class="text-body-2 text-medium-emphasis mb-4">
                    設定系統每週固定檢查的時間點。當系統發現有報告未下載時，將會觸發通知。
                  </p>
                  <v-sheet border rounded class="pa-4">
                    <div v-for="day in weekDays" :key="day.key" class="d-flex align-center my-2">
                      <v-checkbox
                        v-model="projectSettings.reportSettings.notDownloadedReminderSchedule[day.key].enabled"
                        :label="day.label"
                        density="compact"
                        hide-details
                        class="flex-shrink-0"
                        style="width: 120px;"
                      ></v-checkbox>
                      
                      <v-select
                        v-model="projectSettings.reportSettings.notDownloadedReminderSchedule[day.key].time"
                        :items="scheduleTimeOptions"
                        density="compact"
                        variant="outlined"
                        hide-details
                        :disabled="!projectSettings.reportSettings.notDownloadedReminderSchedule[day.key].enabled"
                        style="max-width: 150px;"
                      ></v-select>
                      </div>
                  </v-sheet>

                <v-btn
      @click="handleManualLineNotification"
      :loading="isSendingLineNotification"
      color="green"
      variant="elevated"
      class="ma-4"
    >
      <v-icon start>mdi-chat</v-icon>
      手動通知 (LINE)
    </v-btn>




              </v-form>
            </div>
            <v-card-actions class="sticky-actions pa-4">
              <v-spacer></v-spacer>
              <v-btn 
                color="primary" 
                variant="elevated"
                @click="saveSettings"
                :loading="isSavingSettings"
                size="large"
              >
                儲存設定
              </v-btn>
            </v-card-actions>
         
         
         
         
          </v-window-item>
        </v-window>
      </div>
    </v-card>

    <v-dialog v-model="isPreviewDialogVisible" max-width="800px">
      <v-card v-if="batchToPreview">
        <v-card-title class="d-flex align-center primary-bg">
          <v-icon start>mdi-calendar-search</v-icon>
          <span>預覽批次設定</span>
          <v-spacer></v-spacer>
          <v-btn variant="text" icon="mdi-close" @click="isPreviewDialogVisible = false"></v-btn>
        </v-card-title>
        <v-card-subtitle class="pa-3 bg-grey-lighten-4">
          <strong>{{ projectName }}</strong> / 「<strong>{{ batchToPreview.bookingType }}</strong>」批次 - <strong>{{ batchToPreview.batchCode }}</strong>
        </v-card-subtitle>
        <v-divider></v-divider>
        <v-card-text style="max-height: 70vh; overflow-y: auto;">
          <div v-if="isPreviewLoading" class="text-center pa-8">
            <v-progress-circular indeterminate color="primary"></v-progress-circular>
            <p class="mt-2 text-grey-darken-1">正在讀取規則...</p>
          </div>
          <div v-else>
            <div v-if="Object.keys(previewData).length === 0" class="text-center pa-8 text-grey-darken-1">
              <v-icon size="48">mdi-calendar-remove-outline</v-icon>
              <p class="mt-2">此批次未設定「可驗屋區間」。</p>
            </div>
            <v-list v-else lines="two">
              <template v-for="(dayData, date) in previewData" :key="date">
                <v-list-subheader class="font-weight-bold text-primary">{{ formatDateWithWeekday(date) }}</v-list-subheader>
                <v-list-item>
                  <div v-if="dayData.length > 0">
                    <div v-for="slot in dayData" :key="slot.time" class="mb-2">
                        <v-chip color="indigo" variant="tonal" label class="mb-1">
                          <v-icon start>mdi-clock-time-four-outline</v-icon>
                          <strong>{{ slot.time }}</strong>
                          <v-divider vertical class="mx-2"></v-divider>
                          <span class="font-weight-regular">{{ slot.capacity }} 名</span>
                        </v-chip>
                        <div class="pl-2 d-flex flex-wrap ga-2">
                     <v-chip
                              v-for="method in projectSettings.bookingMethodOptions"
                              :key="method"
                              :variant="slot.methods.includes(method) ? 'elevated' : 'outlined'"
                              :color="slot.methods.includes(method) ? 'green' : 'grey'"
                              size="x-small"
                              label
                            >
                              {{ method }}
                            </v-chip>
                      <span v-if="slot.methods.length === 0" class="text-caption text-grey">未指定方式</span>
                    </div>
                    </div>
                  </div>
                  <div v-else class="text-grey-darken-1">
                    <v-icon size="small" class="mr-1">mdi-calendar-blank-outline</v-icon>
                    <span>無設定時段</span>
                  </div>
                </v-list-item>
                <v-divider class="mt-2"></v-divider>
              </template>
            </v-list>
            </div>
        </v-card-text>
        <v-card-actions class="bg-grey-lighten-5 pa-3">
          <v-spacer></v-spacer>
          <v-btn color="primary" variant="tonal" @click="isPreviewDialogVisible = false">關閉</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>                                                      

    <v-dialog v-model="isDeleteDialogVisible" max-width="500px" persistent>
      <v-card v-if="batchToDelete">
        <v-card-title class="text-h6 d-flex align-center bg-red-lighten-4">
          <v-icon start color="red-darken-2">mdi-alert-circle-outline</v-icon>
          確認刪除批次
        </v-card-title>
        <v-card-text class="pt-4">
          您確定要永久刪除「<strong>{{ batchToDelete.bookingType }}</strong>」批次「<strong>{{ batchToDelete.batchCode }}</strong>」嗎？
          <v-divider class="my-3"></v-divider>
          <div v-if="isDeleteDatesLoading" class="text-center pa-4">
            <v-progress-circular indeterminate color="grey"></v-progress-circular>
            <p class="text-caption mt-2">正在讀取相關日期...</p>
          </div>
          <div v-else>
            <p v-if="deleteBatchDates.length > 0" class="mb-2">
              此操作將一併移除此批次與以下 <strong>{{ deleteBatchDates.length }}</strong> 天預約規則的**關聯**：
            </p>
            <p v-else class="text-grey-darken-1">
              此批次目前沒有設定任何可預約日期。
            </p>
            <v-list v-if="deleteBatchDates.length > 0" dense class="border rounded" style="max-height: 200px; overflow-y: auto;">
              <v-list-item v-for="day in deleteBatchDates" :key="day">
                <v-list-item-title>
                  <span :class="{ 'weekend-highlight': isWeekend(day) }">
                    {{ formatDateWithWeekday(day) }}
                  </span>
                </v-list-item-title>
              </v-list-item>
            </v-list>
          </div>
          <p class="mt-4">此操作無法復原。</p>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="grey-darken-1" variant="text" @click="closeDeleteDialog">取消</v-btn>
          <v-btn color="error" variant="flat" :loading="isDeleting" @click="handleConfirmDelete">確定刪除</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="isBatchDialogVisible" max-width="1200px" persistent>
      <v-card>
        <v-card-title class="primary-bg">
          <span class="text-h6">{{ editedBatch.id ? '編輯' : '新增' }}預約批次</span>
        </v-card-title>
        <v-card-text style="max-height: 80vh; overflow-y: auto;">
          <v-form ref="batchForm">
            <v-row>
              <v-col cols="12" sm="6" md="3">
                <v-text-field 
                  v-model="editedBatch.batchCode" 
                  label="批次代號" 
                  :rules="[v => !!v || '必填', batchUniquenessRule]"
                  :readonly="!!editedBatch.id"
                  :variant="editedBatch.id ? 'filled' : 'outlined'"
                ></v-text-field>
              </v-col>
              <v-col cols="12" sm="6" md="3">
                <v-select 
                  v-model="editedBatch.bookingType" 
                  :items="bookingTypeOptions" 
                  label="預約項目" 
                  :rules="[v => !!v || '必填', batchUniquenessRule]"
                  :readonly="!!editedBatch.id"
                  :variant="editedBatch.id ? 'filled' : 'outlined'"
                ></v-select>
              </v-col>
              <v-col v-if="editedBatch.bookingType === '其他'" cols="12" sm="6" md="3">
                <v-text-field
                  v-model="customBookingType"
                  label="請輸入自訂項目名稱"
                  :rules="[v => !!v || '自訂項目為必填', batchUniquenessRule]"
                  :readonly="!!editedBatch.id"
                  :variant="editedBatch.id ? 'filled' : 'outlined'"
                ></v-text-field>
              </v-col>
            </v-row>
            <v-divider class="my-2"></v-divider>
            <v-row>
              <v-col cols="12" sm="6" md="3">
                <v-menu v-model="menuAppStart" :close-on-content-click="false" location="bottom" transition="scale-transition">
                  <template v-slot:activator="{ props }">
                    <v-text-field
                      :model-value="formatDisplayDateTime(editedBatch.applicationStart)"
                      label="預約開放時間"
                      prepend-inner-icon="mdi-calendar-clock"
                      readonly
                      v-bind="props"
                      :rules="[v => !!v || '必填']"
                      variant="outlined"
                    ></v-text-field>
                  </template>
                  <v-card min-width="300">
                    <v-tabs v-model="activePickerTabStart" grow>
                      <v-tab><v-icon start>mdi-calendar</v-icon>日期</v-tab>
                      <v-tab><v-icon start>mdi-clock-outline</v-icon>時間</v-tab>
                    </v-tabs>
                    <v-window v-model="activePickerTabStart">
                      <v-window-item :value="0">
                        <v-date-picker v-model="tempDateStart" @update:model-value="activePickerTabStart = 1" hide-header></v-date-picker>
                      </v-window-item>
                      <v-window-item :value="1">
                        <v-time-picker v-model="tempTimeStart" format="24hr"></v-time-picker>
                      </v-window-item>
                    </v-window>
                    <v-divider></v-divider>
                    <v-card-actions>
                      <v-spacer></v-spacer>
                      <v-btn variant="text" @click="menuAppStart = false">取消</v-btn>
                      <v-btn color="primary" @click="saveApplicationStart">確定</v-btn>
                    </v-card-actions>
                  </v-card>
                </v-menu>
              </v-col>
              <v-col cols="12" sm="6" md="3">
                <v-menu v-model="menuAppEnd" :close-on-content-click="false" location="bottom" transition="scale-transition">
                  <template v-slot:activator="{ props }">
                    <v-text-field
                      :model-value="formatDisplayDateTime(editedBatch.applicationEnd)"
                      label="預約結束時間"
                      prepend-inner-icon="mdi-calendar-clock"
                      readonly
                      v-bind="props"
                      :rules="[v => !!v || '必填']"
                      variant="outlined"
                    ></v-text-field>
                  </template>
                   <v-card min-width="300">
                    <v-tabs v-model="activePickerTabEnd" grow>
                      <v-tab><v-icon start>mdi-calendar</v-icon>日期</v-tab>
                      <v-tab><v-icon start>mdi-clock-outline</v-icon>時間</v-tab>
                    </v-tabs>
                    <v-window v-model="activePickerTabEnd">
                      <v-window-item :value="0">
                        <v-date-picker v-model="tempDateEnd" @update:model-value="activePickerTabEnd = 1" hide-header></v-date-picker>
                      </v-window-item>
                      <v-window-item :value="1">
                        <v-time-picker v-model="tempTimeEnd" format="24hr"></v-time-picker>
                      </v-window-item>
                    </v-window>
                    <v-divider></v-divider>
                    <v-card-actions>
                      <v-spacer></v-spacer>
                      <v-btn variant="text" @click="menuAppEnd = false">取消</v-btn>
                      <v-btn color="primary" @click="saveApplicationEnd">確定</v-btn>
                    </v-card-actions>
                  </v-card>
                </v-menu>
              </v-col>
              <v-col cols="12" sm="6" md="3">
                 <v-menu v-model="menuBookingStart" :close-on-content-click="false" location="bottom" transition="scale-transition">
                  <template v-slot:activator="{ props }">
                    <v-text-field
                      v-model="editedBatch.bookingStart"
                      label="可驗屋起始日"
                      prepend-inner-icon="mdi-calendar"
                      readonly
                      v-bind="props"
                      :rules="[v => !!v || '必填']"
                       variant="outlined"
                    ></v-text-field>
                  </template>
                  <v-date-picker v-model="tempBookingStartDate" @update:model-value="menuBookingStart = false" title="選擇起始日" hide-header></v-date-picker>
                </v-menu>
              </v-col>
              <v-col cols="12" sm="6" md="3">
                <v-menu v-model="menuBookingEnd" :close-on-content-click="false" location="bottom" transition="scale-transition">
                  <template v-slot:activator="{ props }">
                    <v-text-field
                      v-model="editedBatch.bookingEnd"
                      label="可驗屋結束日"
                      prepend-inner-icon="mdi-calendar"
                      readonly
                      v-bind="props"
                      :rules="[v => !!v || '必填']"
                      variant="outlined"
                    ></v-text-field>
                  </template>
                  <v-date-picker v-model="tempBookingEndDate" @update:model-value="menuBookingEnd = false" title="選擇結束日" hide-header></v-date-picker>
                </v-menu>
              </v-col>
            </v-row>
          </v-form>
          <v-divider class="my-4"></v-divider>
          <div v-if="!editedBatch.bookingStart || !editedBatch.bookingEnd">
             <p class="text-center text-grey-darken-1 pa-4">請先設定可驗屋的起訖日期</p>
          </div>
          <v-row v-else>
            <v-col cols="12" md="4">
              <v-date-picker
                v-model="selectedDaysForEditing"
                :min="editedBatch.bookingStart"
                :max="editedBatch.bookingEnd"
                show-adjacent-months
                hide-header
                color="primary"
                class="w-100"
                multiple
              ></v-date-picker>
            </v-col>
            <v-col cols="12" md="8">
              <div v-if="selectedDaysForEditing.length === 0" class="d-flex align-center justify-center h-100 text-grey">
                <div><v-icon size="48">mdi-calendar-cursor</v-icon><p>請從左側日曆選擇一天或多天來設定</p></div>
              </div>
              <div v-else>
                <h3 class="text-h6 mb-4 d-flex justify-space-between align-center">
                  <span v-if="selectedDaysForEditing.length === 1">設定 {{ formatDateWithWeekday(selectedDaysForEditing[0]) }} 的時段</span>
                  <span v-else>批次設定 {{ selectedDaysForEditing.length }} 個已選日期的時段</span>
                  <v-chip v-if="selectedDaysForEditing.length === 1" size="small" :color="isDayConfigured(selectedDaysForEditing[0]) ? 'green' : 'grey'" variant="tonal">
                    {{ isDayConfigured(selectedDaysForEditing[0]) ? '已設定' : '未設定' }}
                  </v-chip>
                </h3>
                <v-combobox
                  v-model="currentDaySlots"
                  :items="timeSlotPresets"
                  :rules="[timeArrayRule]"
                  label="選擇或輸入時段 (例如: 09:00)"
                  chips
                  clearable
                  multiple
                  closable-chips  
                  hint="輸入後按 Enter 新增"
                  persistent-hint
                ></v-combobox>
                <v-divider class="my-4"></v-divider>
                <p class="text-subtitle-1 mb-2">設定各時段名額與可預約方式</p>
                <div style="max-height: 400px; overflow-y: auto;" class="pr-2">
                  <div v-if="sortedCurrentDaySlots.length === 0" class="text-center text-grey pa-4">
                      請先在上方輸入時段
                  </div>
                  <v-sheet v-for="slot in sortedCurrentDaySlots" :key="slot" border rounded class="pa-3 mb-3">
                    <div class="d-flex justify-space-between align-center">
                      <span class="font-weight-bold text-h6 text-grey-darken-2">{{ slot }}</span>
                      <v-combobox
                        label="名額"
                        :model-value="getCapacityForSlot(slot)"
                        @update:model-value="setCapacityForSlot(slot, $event)"
                        :items="capacityPresets"
                        type="number"
                        min="0"
                        variant="outlined"
                        density="compact"
                        hide-details
                        style="max-width: 120px;"
                      ></v-combobox>
                    </div>
                    <v-divider class="my-2"></v-divider>
                    <div>
                      <div class="text-caption mb-1 ml-1">可預約方式</div>
                      <div class="d-flex flex-wrap align-center">
                      <v-checkbox
                        :model-value="getSelectAllState(slot).checked"
                        :indeterminate="getSelectAllState(slot).indeterminate"
                        label="全選"
                        density="compact"
                        hide-details
                        class="d-inline-block mr-2 font-weight-bold"
                        @update:model-value="handleSelectAll($event, slot)"
                      ></v-checkbox>
                      <v-divider vertical class="mx-2 d-none d-sm-flex"></v-divider>
                      <v-checkbox
                        v-for="method in projectSettings.bookingMethodOptions"
                        :key="method"
                        :model-value="isMethodSelectedForSlot(slot, method)"
                        @update:model-value="updateMethodsForSlot(slot, method, $event)"
                        :label="method"
                        density="compact"
                        hide-details
                        class="d-inline-block mr-2"
                      ></v-checkbox>
                      </div>
                    </div>
                  </v-sheet>
                </div>
              </div>
            </v-col>
          </v-row>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="grey-darken-1" variant="text" @click="isBatchDialogVisible = false">取消</v-btn>
          <v-btn color="success" variant="flat" @click="initiateSaveProcess" :loading="isSaving">儲存</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="isConflictDialogVisible" max-width="800px" persistent>
      <v-card>
        <v-card-title class="text-h6 d-flex align-center primary-bg">
          <v-icon start>mdi-source-fork</v-icon>
          日期規則設定
        </v-card-title>
           <v-card-text style="max-height: 70vh; overflow-y: auto;">
          <div v-if="conflictData.conflictingDates.length > 0">
              <h3 class="text-subtitle-1 font-weight-bold mb-2 text-error d-flex align-center">
                <v-icon start>mdi-alert-circle-outline</v-icon>
                已有設定的日期
              </h3>            
              <p class="text-body-2 mb-4">
              以下 {{ conflictData.conflictingDates.length }} 天已有設定日期，請選擇 <strong>沿用</strong> 或 <strong>覆蓋</strong> ：
            </p>
            <v-sheet border rounded class="pa-4">
            <div v-for="(dateInfo, index) in conflictData.conflictingDates" :key="dateInfo.date">
              <p class="font-weight-bold">
                <span :class="{ 'weekend-highlight': isWeekend(dateInfo.date) }">
                  {{ formatDateWithWeekday(dateInfo.date) }}
                </span>
              </p>

              <p class="text-caption text-grey-darken-1 mb-2">
                <span class="font-weight-bold">舊有時段名額：</span>
                <v-chip v-for="(slotData, time) in dateInfo.existingRule.rule" :key="time" size="x-small" label class="mr-1">
                  {{ extractBookingType(dateInfo.existingRule.sharedBy) }} {{ time }} ({{ slotData.capacity }}名)
                </v-chip>
              </p>

              <p class="text-caption text-error mb-3">
                <span class="font-weight-bold">本次時段名額：</span>
                <span v-if="!editedBatch.dailyRules[dateInfo.date] || Object.keys(editedBatch.dailyRules[dateInfo.date].slots).length === 0" class="font-italic">
                  (清除所有時段)
                </span>
                <template v-else>
                <v-chip
                  v-for="(slotData, time) in editedBatch.dailyRules[dateInfo.date].slots"
                  :key="time"
                  size="x-small"
                  label
                  class="mr-1"
                  variant="tonal"
                  color="error"
                >
                  {{ editedBatch.bookingType === '其他' ? customBookingType : editedBatch.bookingType }} {{ time }} ({{ slotData.capacity }}名)
                </v-chip>
                </template>
              </p>

              <v-radio-group v-model="dateResolutions[dateInfo.date].mode">
              <v-radio value="link" class="mb-4">
                <template v-slot:label>
                  <div>
                    <div class="font-weight-bold">沿用</div>
                    <div class="text-caption">本批次沿用其他舊有批次的時段名額。</div>
                  </div>
                </template>
              </v-radio>
              
              
              <v-radio value="create_independent" class="mb-4" v-if="false"> // 暫時隱藏此選項
                <template v-slot:label>
                  <div>
                    <div class="font-weight-bold">建立獨立規則 (獨立)</div>
                    <div class="text-caption">為您的批次『建立』一套全新的、獨立的規則。<br/>結果：您的批次擁有自己的時段與名額，與其他批次完全無關。</div>
                  </div>
                </template>
              </v-radio>
        
              <v-radio value="update_shared" class="text-error ">
                <template v-slot:label>
                  <div>
                    <div class="font-weight-bold">覆蓋</div>
                    <div class="text-caption">本批次覆蓋其他舊有批次的時段名額。</div>
                  </div>
                </template>
              </v-radio>
            </v-radio-group>

              <v-divider v-if="index < conflictData.conflictingDates.length - 1" class="my-4"></v-divider>
            </div>
          </v-sheet>
          </div>
            <div v-if="conflictData.nonConflictingDates.length > 0" class="mt-6">
          <h3 class="text-subtitle-1 font-weight-bold mb-2">尚無設定的日期</h3>
          <p class="text-body-2">
            以下 {{ conflictData.nonConflictingDates.length }} 天將直接套用您本次設定的規則：
          </p>
          
          <div class="mb-3">
            <v-chip v-for="date in conflictData.nonConflictingDates" :key="date" label class="mr-2 mb-2">
              {{ formatDateWithWeekday(date) }}
            </v-chip>
          </div>

          <div v-if="conflictData.nonConflictingDates.length > 0">
            <p class="text-caption text-primary">
              <span class="font-weight-bold">本次時段名額：</span>
              <template v-if="editedBatch.dailyRules[conflictData.nonConflictingDates[0]]">
                <v-chip
                  v-for="(slotData, time) in editedBatch.dailyRules[conflictData.nonConflictingDates[0]].slots"
                  :key="time"
                  size="x-small"
                  label
                  class="mr-1"
                  variant="tonal"
                  color="primary"
                >
                  {{ editedBatch.bookingType === '其他' ? customBookingType : editedBatch.bookingType }} {{ time }} ({{ slotData.capacity }}名)
                </v-chip>
              </template>
            </p>
          </div>
        </div>
        </v-card-text>
        <v-card-actions class="bg-grey-lighten-5 pa-3">
          <v-spacer></v-spacer>
          <v-btn color="grey-darken-1" variant="text" @click="isConflictDialogVisible = false">取消</v-btn>
          <v-btn color="success" variant="flat" :loading="isSaving" @click="executeSave">確認並儲存</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="isPreviewTemplateDialogVisible" max-width="800px" persistent>
      <v-card>
        <v-card-title class="d-flex align-center primary-bg">
          <v-icon start>mdi-file-find-outline</v-icon>
          <span>預覽範本內容：{{ templatePreviewTitle }}</span>
          <v-spacer></v-spacer>
          <v-btn variant="text" icon="mdi-close" @click="isPreviewTemplateDialogVisible = false"></v-btn>
        </v-card-title>
        
        <v-card-text class="pa-4">
          <p class="mb-4">以下是「{{ templatePreviewTitle }}」的範本內容，您確定要套用嗎？目前欄位中的內容將會被覆蓋。</p>
          <v-sheet border rounded class="pa-4 bg-grey-lighten-5" style="max-height: 50vh; overflow-y: auto;">
            <div v-html="templatePreviewContent"></div>
          </v-sheet>
        </v-card-text>
        
        <v-divider></v-divider>
        <v-card-actions class="pa-3">
          <v-spacer></v-spacer>
          <v-btn color="grey-darken-1" variant="text" @click="isPreviewTemplateDialogVisible = false">
            取消
          </v-btn>
          <v-btn color="primary" variant="flat" @click="handleConfirmApplyTemplate">
            確認套用
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="isAlertPreviewDialogVisible" max-width="800px">
      <v-card>
        <v-card-title class="d-flex align-center primary-bg">
          <v-icon start>mdi-alert-box-outline</v-icon>
          <span>上傳須知提示框預覽</span>
          <v-spacer></v-spacer>
          <v-btn variant="text" icon="mdi-close" @click="isAlertPreviewDialogVisible = false"></v-btn>
        </v-card-title>
        <v-card-text class="pa-6">
          <p class="text-caption mb-4">以下是根據您目前設定所呈現的預覽效果：</p>
          <v-alert
            :model-value="true"
            :title="projectSettings.reportUploadIntro.alert.title"
            :color="projectSettings.reportUploadIntro.alert.color"
            :type="projectSettings.reportUploadIntro.alert.type"
            variant="tonal"
            border="start"
            prominent
          >
            <div v-html="projectSettings.reportUploadIntro.alert.text"></div>
          </v-alert>
        </v-card-text>
        <v-divider></v-divider>
        <v-card-actions class="pa-3">
          <v-spacer></v-spacer>
          <v-btn color="primary" variant="tonal" @click="isAlertPreviewDialogVisible = false">
            關閉
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>


       
  </v-container>
</template>

<script setup>
import { ref, reactive, computed, onMounted, watch } from 'vue';
import RichTextEditor from '@/components/RichTextEditor.vue'; 
import { useRoute, useRouter } from 'vue-router'; 
import { useProjectStore } from '@/store/projectStore';
import { eachDayOfInterval, parseISO } from 'date-fns';

//  將所有來自 '@/api' 的引入合併成這一個
import {
  updateProjectSettings,   
  fetchProjectConfig,      
  checkDateConflicts,
  saveBatchWithRules,
  fetchRulesForBatch,
  fetchBookingBatches,
  deleteBookingBatch,
  manualTriggerSendReminders,
  triggerNotDownloadedReportReminder,
} from '@/api';


const isTesting = ref(false);
const isSendingLineNotification = ref(false);

const scheduleTimeOptions = computed(() => {
  const options = [];
  for (let hour = 8; hour < 18; hour++) {
    const hourStr = hour.toString().padStart(2, '0');
    options.push(`${hourStr}:00`);
    options.push(`${hourStr}:30`);
  }
  options.push('18:00');
  return options;
});

const runManualTrigger = async () => {
  if (!confirm('您確定要手動觸發一次「未上傳報告提醒」任務嗎？')) {
    return;
  }
  isTesting.value = true;
  try {
    const result = await manualTriggerSendReminders();
    alert(`觸發成功：${result.message}`); // 顯示成功訊息
  } catch (error) {
    alert(`觸發失敗：${error.message}`);
  } finally {
    isTesting.value = false;
  }
};



// --- Computed Properties ---
const projectName = computed(() => projectStore.idToNameMap[projectId.value] || '');


// --- Component State ---
const route = useRoute();
const router = useRouter();
const projectStore = useProjectStore();
const projectId = ref(route.params.projectId);
const isLoading = ref(true);
const isSaving = ref(false);
const activeTab = ref('batches');
const snackbar = reactive({ show: false, text: '', color: 'success' });
const isBatchLoading = ref(false);
const isBatchDialogVisible = ref(false);
const batchForm = ref(null);
const bookingBatches = ref([]);

//  建立 computed 屬性，動態產生預約項目選項
const bookingTypeOptions = computed(() => {
  // 確保 projectSettings.bookingTypes 是陣列，避免出錯
  const types = Array.isArray(projectSettings.value.bookingTypes) ? projectSettings.value.bookingTypes : [];
  // 將設定中的項目與固定的「其他」選項合併
  return [...types];
});

//  將 defaultSettings 從 const 常數改為 computed 屬性
const defaultSettings = computed(() => ({
    pageTitle: `${projectName.value} 線上預約系統`, 
    titleColor: '#FFFFFF',
    themeColor: '#0D47A1',
    logoUrl: '', 
    checkDuplicate: "OFF",
    validateId: "OFF",
    bookingTypes: [],
    showBookingMethod: false,
    showReportUploadButton: false, 
    bookingMethodOptions: [],
    inspectionStaff: [], 
    //  intro 物件中的 "富宇富御" 全部替換為 ${projectName.value}
    intro: {
      greeting: `<p>親愛的 <strong>${projectName.value }</strong> 貴賓您好：</p>`,
      body: `<p>歡迎使用「${projectName.value}」線上驗屋預約系統，請依下方步驟完成您的預約。</p>`,
      alert: {
        show: true,
        showConfirmation: false,
        color: 'error',
        type: 'info',
        title: '驗屋說明',
        text: `
          <p>親愛的客戶，感謝您承購「${projectName.value}」，本案已於2025/XX/XX取得使用執照，並於室內屋況完成後進行驗收。</p>
          <p>因驗屋時段分別，請盡早填妥以下資訊預約，以便為您事先安排服務人員，謝謝您的配合。</p>
          <ul class="pl-5 mt-4" style="list-style-type: none;">
            <li class="mb-2"><strong>⚠️</strong> 代驗公司因驗屋時間需求僅開放預約9:30或13:30。</li>
            <li class="mb-2"><strong>⚠️</strong> 若有代驗公司請於預約系統填寫代驗公司名稱。</li>
            <li class="mb-2"><strong>⚠️</strong> 代驗公司-自行檢測水電及弱電。</li>
            <li class="mb-2"><strong>⚠️</strong> 屋主自驗或設計師陪驗 - 水電及弱電驗屋流程將由建設公司提供專業測試流程。</li>
            <li class="mb-2"><strong>⚠️</strong> 產權人若無法親自驗屋,需填寫授權書屋主及受託人雙方均需簽名。</li>
            <li class="mb-2"><strong>⚠️</strong> 非屋主關係或驗屋人員謝絕參與。</li>
            <li class="mb-2"><strong>⚠️</strong> 針對陽台及浴室基於合理使用房屋之正常狀況，不同意進行淹水測試，驗屋方式請以房屋使用合理性為原則。</li>
            <li class="mb-2"><strong>⚠️</strong> 如有相關廠商(廚具、空調、衛浴等)/ 設計師丈量需求，請安排於初驗時一同前來，之後不另開放。</li>
          </ul>
          <p class="mt-6"><strong>有關買賣合約特記事項提醒 :</strong></p>
          <ol class="pl-5 mt-4">
            <li class="mb-3">石材為天然化石積壓而生，切割後表面易出現結晶體及放射狀紋或裂紋之天然色澤紋路，因季節變化或時間因素致使有受潮含水、自然裂紋變形等情況係自然現象，選擇天然石材為鋪面應有認知，如有上述情形，非賣方之故意，買方同意應以施工當時色澤紋為主；亦不得將上列情形視為瑕疵而作任何主張或請求。</li>
            <li class="mb-3">本案所使用之拋光石英磚及地壁磚建材因釉料及高溫窯燒，製程中因熱脹冷縮產生細微翹曲，無法達到每一片接合之平整性，及地壁磚微量之色差，另因石英磚地坪施作工法改良後，為因增加黏著點而使用鋸齒狀刮刀，致使產生水泥收縮後黏著微量不平均，以致在敲打時會有些微不同之聲音，（單片敲打不同之聲音不得超過三分之一以上），係屬無法抗拒之正常現象，如有上述情形，非賣方之故意，買方同意亦不得將上列情形視為瑕疵而作任何主張或請求。</li>
            <li class="mb-3">室內隔間採用輕質隔間牆，其與樑下或不同構造之建材相接處做退縮處理，以降低因建築物產生自然載量及層間變位等因素，而造成牆面不規則龜裂情形，係屬正常施工規範。</li>
          </ol>
        `
      },
      footer: '<p>如有任何疑問，請洽您的專屬服務人員或撥打以下電話：</p>',
      closingText: '<p>請於預約時段準時抵達，並至社區大廳櫃檯完成報到，感謝您的配合。</p>',
      contact: { name: "XX建設", phone: "" },
      attachments: [],
      faq: [
        { q: "整個驗屋流程大約需要多久？", a: "依據不同房型，完整的初驗流程預計需要 1.5 至 2.5 小時。" },
        { q: "驗屋時可以找親友或設計師陪同嗎？", a: "當然可以，歡迎您邀請親友或您的設計師一同前來，但請以兩人為限，以維持現場驗屋品質。" }
      ]
    },
    reportUploadIntro: {
      body: '<p>請填寫以下資訊並上傳您的驗屋報告電子檔(PDF)。</p>',
      alert: {
        show: true,
        title: '上傳須知',
        text: '初驗報告及複驗報告每戶僅限上傳一份，若報告有修改需重新上傳，請洽服務電話：<a href="tel:03-6588882">03-658-8882</a>。如果您的檔案超過30MB，請先至 <a href="https://www.ilovepdf.com/zh-tw/compress_pdf" target="_blank">ilovepdf.com</a> 進行壓縮。',
        color: 'error',
        type: 'info',
      }
    },
    reportSettings: {
      uploadReminderDays: [7, 14],
      uploadReminderMethods: ['EMAIL'],
      uploadReminderSchedule: {
        enabled: false,
        time: '10:00'
      },


      uploadReminderEmail: {
        subject: `{projectName} {unitId} 未收到驗屋報告提醒`,
        body: `<p>親愛的 {bookerName} 貴賓您好，</p><p>您已於 {appointmentDate} 完成 {unitId} 驗屋，由於我們尚未收到您的驗屋報告，目前無法進行後續的修繕作業。</p><p>請您在收到本通知後的 7 日內，上傳您的驗屋報告。</p>`,
        reminder: `<p>1.驗屋報告請以 PDF 檔方式製作，並且檔案大小限制為 30MB 以內。<br>2.初驗報告與複驗報告每戶僅限上傳一份，如需更換內容，請洽客服協助處理。</p>`,
        uploadUrl: ''
      },
      reportDataFolderUrl: '', 
      notDownloadedReminderSchedule: {
        monday: { enabled: false, time: '10:00' },
        tuesday: { enabled: false, time: '10:00' },
        wednesday: { enabled: false, time: '10:00' },
        thursday: { enabled: false, time: '10:00' },
        friday: { enabled: false, time: '10:00' },
        saturday: { enabled: false, time: '10:00' },
        sunday: { enabled: false, time: '10:00' },
      }
    }
}));

//範本預覽 Dialog 相關狀態
const isPreviewTemplateDialogVisible = ref(false);
const templatePreviewTitle = ref('');
const templatePreviewContent = ref('');
const currentTargetField = ref(null);

//  修改 projectSettings 的初始值，加上 .value
const projectSettings = ref({}); 


//  --- 新增：預約設定抽屜相關的狀態與邏輯 ---
const isSettingsLoading = ref(false);
const isSavingSettings = ref(false);

const customBookingType = ref('');
const searchQuery = ref('');

// Dialog states
const isDeleteDialogVisible = ref(false);
const isPreviewDialogVisible = ref(false);
const isConflictDialogVisible = ref(false);
const isAlertPreviewDialogVisible = ref(false); // 新增預覽 Dialog 狀態


const batchToDelete = ref(null);
const batchToPreview = ref(null);
const previewData = ref({});
const isPreviewLoading = ref(false);
const isDeleting = ref(false);

// 新增：定義 Email 範本可用的佔位符
const emailPlaceholders = [
  { value: '{projectName}', text: '建案名稱' },
  { value: '{unitId}', text: '戶別' },
  { value: '{bookerName}', text: '預約人姓名' },
  { value: '{appointmentDate}', text: '驗屋日期' },
];


// 新增星期幾的設定
const weekDays = [
  { key: 'monday', label: '星期一' },
  { key: 'tuesday', label: '星期二' },
  { key: 'wednesday', label: '星期三' },
  { key: 'thursday', label: '星期四' },
  { key: 'friday', label: '星期五' },
  { key: 'saturday', label: '星期六' },
  { key: 'sunday', label: '星期日' },
];


// Conflict resolution state
const conflictData = ref({ conflictingDates: [], nonConflictingDates: [] });
const dateResolutions = reactive({});

// Delete dialog state
const deleteBatchDates = ref([]);
const isDeleteDatesLoading = ref(false);


// Date Time Picker states
const menuAppStart = ref(false);
const menuAppEnd = ref(false);
const menuBookingStart = ref(false);
const menuBookingEnd = ref(false);
const activePickerTabStart = ref(0);
const tempDateStart = ref(null);
const tempTimeStart = ref(null);
const activePickerTabEnd = ref(0);
const tempDateEnd = ref(null);
const tempTimeEnd = ref(null);

//  --- 新增：公開預約設定選項 ---
const defaultBookingTypes = ref(['初驗', '複驗']);
const defaultBookingMethods = ref(['屋主自驗', '設計師陪驗', '授權驗屋', '代驗公司']);



// Default batch object
const defaultBatch = {
  id: null,
  batchCode: '',
  bookingType: null,
  applicationStart: '', 
  applicationEnd: '',   
  bookingStart: '',     
  bookingEnd: '',       
  dailyRules: {}, 
};
const editedBatch = ref({ ...defaultBatch });
const selectedDaysForEditing = ref([]); 



const batchHeaders = [
  { title: '批次代號', key: 'batchCode' },
  { title: '預約項目', key: 'bookingType' },
  { title: '預約開放區間', key: 'applicationWindow', sortable: false },
  { title: '可驗屋區間', key: 'bookingWindow', sortable: false },
  { title: '狀態', key: 'statusText', sortable: true }, 
  { title: '操作', key: 'actions', sortable: false, align: 'end' },
];


const processedBookingBatches = computed(() => {
  return bookingBatches.value.map(item => ({
    ...item,
    statusText: getBatchStatus(item).text 
  }));
});

// 用於過濾卡片列表
const filteredBatchesForCards = computed(() => {
  if (!searchQuery.value) {
    return processedBookingBatches.value;
  }
  const lowerQuery = searchQuery.value.toLowerCase().trim();
  return processedBookingBatches.value.filter(item => 
    Object.values(item).some(val => 
      String(val).toLowerCase().includes(lowerQuery)
    )
  );
});

const tempBookingStartDate = computed({
    get: () => editedBatch.value.bookingStart ? new Date(editedBatch.value.bookingStart) : null,
    set: (val) => { if (val) editedBatch.value.bookingStart = formatDate(val); }
});

const tempBookingEndDate = computed({
    get: () => editedBatch.value.bookingEnd ? new Date(editedBatch.value.bookingEnd) : null,
    set: (val) => { if (val) editedBatch.value.bookingEnd = formatDate(val); }
});

const capacityPresets = Array.from({ length: 9 }, (_, i) => i + 1);
const timeSlotPresets = Array.from({ length: 24 }, (_, i) => {
  const hour = i.toString().padStart(2, '0');
  return [`${hour}:00`, `${hour}:30`];
}).flat().slice(18, 35); 

// --- Validation Rules ---
const timeArrayRule = (values) => {
  const pattern = /^([01]\d|2[0-3]):([0-5]\d)$/;
  return values.every(v => pattern.test(v)) || '格式錯誤，請移除不符合 HH:MM 格式的項目';
};

const batchUniquenessRule = (value) => {
  const currentCode = value;
  const currentType = editedBatch.value.bookingType === '其他' 
    ? customBookingType.value 
    : editedBatch.value.bookingType;

  if (!currentCode || !currentType) return true;
  
  const isDuplicate = bookingBatches.value.some(batch => 
    batch.id !== editedBatch.value.id && 
    batch.bookingType === currentType && 
    batch.batchCode === currentCode
  );

  return !isDuplicate || `⚠️「${currentType}」批次代號重複。`;
};



// --- Helper Functions ---
function formatDate(date) {
  if (!date) return '';
  const d = new Date(date);
  const year = d.getFullYear();
  const month = (d.getMonth() + 1).toString().padStart(2, '0');
  const day = d.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function formatDateWithWeekday(dateInput) {
  if (!dateInput) return '';
  const date = new Date(dateInput);
  const weekday = new Intl.DateTimeFormat('zh-TW', { weekday: 'short' }).format(date);
  return `${formatDate(date)} (${weekday})`;
}

// ✓ START: 修正 formatDisplayDateTime 函式，使其能處理 Timestamp 物件
function formatDisplayDateTime(dateTime) {
  if (!dateTime) return '';

  let d;
  // 檢查傳入的是否為 Firestore Timestamp 物件 (特徵是有 seconds 屬性)
  if (typeof dateTime === 'object' && dateTime !== null && typeof dateTime.seconds === 'number') {
    // 從秒數建立 Date 物件
    d = new Date(dateTime.seconds * 1000);
  } else {
    // 如果不是，則照原樣處理 (可能是 Date 物件或字串)
    d = new Date(dateTime);
  }

  // 驗證轉換後的日期是否有效
  if (isNaN(d.getTime())) {
    return ''; 
  }

  // 手動格式化為 'YYYY-MM-DD HH:mm'
  const pad = (num) => num.toString().padStart(2, '0');
  const year = d.getFullYear();
  const month = pad(d.getMonth() + 1);
  const day = pad(d.getDate());
  const hours = pad(d.getHours());
  const minutes = pad(d.getMinutes());
  
  return `${year}-${month}-${day} ${hours}:${minutes}`;
}

function isWeekend(dateInput) {
  if (!dateInput) return false;
  const day = new Date(dateInput).getDay();
  return day === 0 || day === 6;
}

function showSnackbar(text, color = 'success') {
  snackbar.text = text;
  snackbar.color = color;
  snackbar.show = true;
}



// --- Data Loading & Main Logic ---
async function loadDataForProject() {
  isLoading.value = true;
  await projectStore.fetchProjects();
  if (projectName.value) {
// ✓ START: 將載入設定的邏輯提前
    // 使用 Promise.all 同時執行兩項載入任務，效率更高
    isBatchLoading.value = true;
    isSettingsLoading.value = true; // 也觸發設定的載入狀態
    try {
      const [batches, settings] = await Promise.all([
        fetchBookingBatches(projectId.value),
        fetchProjectConfig(projectId.value)
      ]);
      
      bookingBatches.value = batches;

      // 載入成功後，合併遠端設定與預設值
      if (settings) {
        projectSettings.value.logoUrl = settings.logoUrl || ''; 
        projectSettings.value.pageTitle = settings.pageTitle || defaultSettings.value.pageTitle; 
        projectSettings.value.titleColor = settings.titleColor || defaultSettings.value.titleColor;
        projectSettings.value.themeColor = settings.themeColor || defaultSettings.value.themeColor; 
        projectSettings.value.isPublished = settings.isPublished || false;
        projectSettings.value.checkDuplicate = settings.checkDuplicate || "OFF";
        projectSettings.value.validateId = settings.validateId || "OFF";
        projectSettings.value.bookingTypes = settings.bookingTypes || [];
        projectSettings.value.showBookingMethod = settings.showBookingMethod || false;
        projectSettings.value.showReportUploadButton = settings.showReportUploadButton || false; 
        projectSettings.value.bookingMethodOptions = settings.bookingMethodOptions || [];
        projectSettings.value.inspectionStaff = settings.inspectionStaff || []; 
        projectSettings.value.intro = {
          ...defaultSettings.value.intro,
          ...(settings.intro || {}),
          alert: { ...defaultSettings.value.intro.alert, ...(settings.intro?.alert || {}) },
          contact: { ...defaultSettings.value.intro.contact, ...(settings.intro?.contact || {}) }
        };
        projectSettings.value.reportUploadIntro = {
          ...defaultSettings.value.reportUploadIntro,
          ...(settings.reportUploadIntro || {}),
          alert: { ...defaultSettings.value.reportUploadIntro.alert, ...(settings.reportUploadIntro?.alert || {}) },
        };
        projectSettings.value.reportSettings = {
          ...defaultSettings.value.reportSettings,
          ...(settings.reportSettings || {}),
        
          uploadReminderSchedule: {
            ...defaultSettings.value.reportSettings.uploadReminderSchedule,
            ...(settings.reportSettings?.uploadReminderSchedule || {})
          },


          uploadReminderEmail: {
            ...defaultSettings.value.reportSettings.uploadReminderEmail,
            ...(settings.reportSettings?.uploadReminderEmail || {})
          },
          notDownloadedReminderSchedule: {
            ...defaultSettings.value.reportSettings.notDownloadedReminderSchedule,
            ...(settings.reportSettings?.notDownloadedReminderSchedule || {})
          }
        };
      } else {
        // 如果從後端沒有讀取到任何設定，則使用預設值
        projectSettings.value = JSON.parse(JSON.stringify(defaultSettings.value));
      }

    } catch (error) {
      showSnackbar(`載入頁面資料失敗: ${error.message}`, 'error');
      // 載入失敗時也使用預設值，確保頁面可以基本運作
      projectSettings.value = JSON.parse(JSON.stringify(defaultSettings.value));
    } finally {
      isBatchLoading.value = false;
      isSettingsLoading.value = false; // 結束載入狀態
    }
// ✓ END: 載入邏輯修改完成
  } else {
    showSnackbar(`錯誤：找不到建案 ID ${projectId.value}`, 'error');
  }
  isLoading.value = false;
}

// --- Dialog Open/Close Functions ---
async function openBatchDialog(item = null) {
  customBookingType.value = '';
  if (item) {
    // ✓ START: 處理從後端讀取的時間物件
    // 1. 深度複製一份從 props 傳來的 item 物件，避免直接修改
    const itemFromServer = JSON.parse(JSON.stringify(item));

    // 2. Firebase SDK v9 會自動將 Timestamp 轉為 JS Date 物件，
    //    但如果資料是舊的字串格式，我們手動將其轉換為 Date 物件以確保相容性
    if (itemFromServer.applicationStart && typeof itemFromServer.applicationStart === 'string') {
        itemFromServer.applicationStart = new Date(itemFromServer.applicationStart);
    }
    if (itemFromServer.applicationEnd && typeof itemFromServer.applicationEnd === 'string') {
        itemFromServer.applicationEnd = new Date(itemFromServer.applicationEnd);
    }

    const dailyRules = await fetchRulesForBatch(item.id);

    for (const date in dailyRules) {
      const slots = dailyRules[date].slots;
      for (const time in slots) {
        if (typeof slots[time] === 'number') {
          slots[time] = { capacity: slots[time], methods: [] }; 
        }
      }
    }
    // 3. 使用處理過後的 itemFromServer
    editedBatch.value = { ...itemFromServer, dailyRules };
    
    if (!bookingTypeOptions.value.includes(item.bookingType)) {
      editedBatch.value.bookingType = '其他';
      customBookingType.value = item.bookingType;
    }
  } else {
    editedBatch.value = { ...defaultBatch, dailyRules: {} };
  }
  selectedDaysForEditing.value = []; 
  isBatchDialogVisible.value = true;
}

async function openDeleteDialog(item) {
  batchToDelete.value = item;
  isDeleteDialogVisible.value = true;
  isDeleteDatesLoading.value = true;
  deleteBatchDates.value = [];

  try {
    //  [修改] 使用新的 API 函式
    const dailyRules = await fetchRulesForBatch(item.id);
    deleteBatchDates.value = Object.keys(dailyRules).sort();
  } catch (error) {
    showSnackbar(`讀取批次關聯日期失敗: ${error.message}`, 'error');
  } finally {
    isDeleteDatesLoading.value = false;
  }
}

function closeDeleteDialog() {
  batchToDelete.value = null;
  deleteBatchDates.value = [];
  isDeleteDialogVisible.value = false;
}

async function openPreviewDialog(item) {
  batchToPreview.value = item;
  isPreviewDialogVisible.value = true;
  isPreviewLoading.value = true;
  try {
    //  [修改] 使用新的 API 函式
    const dailyRules = await fetchRulesForBatch(item.id);
    
    // Ensure data structure is consistent
    for (const date in dailyRules) {
      const slots = dailyRules[date].slots;
      for (const time in slots) {
        if (typeof slots[time] === 'number') {
          slots[time] = { capacity: slots[time], methods: [] };
        }
      }
    }
    
    const formattedData = {};
    if (item.bookingStart && item.bookingEnd) {
      const intervalDates = eachDayOfInterval({
        start: parseISO(item.bookingStart),
        end: parseISO(item.bookingEnd)
      });

      for (const dateObj of intervalDates) {
        const dateKey = formatDate(dateObj); 
        const ruleForDay = dailyRules[dateKey];
        const slotsData = [];
        if (ruleForDay && ruleForDay.slots) {
          for (const time of Object.keys(ruleForDay.slots).sort()) {
            const slotInfo = ruleForDay.slots[time];
            slotsData.push({
              time: time,
              capacity: slotInfo.capacity || 0,
              methods: slotInfo.methods || []
            });
          }
        }
        formattedData[dateKey] = slotsData;
      }
    }
    previewData.value = formattedData;
  } catch (error) {
    showSnackbar(`讀取預覽資料失敗: ${error.message}`, 'error');
  } finally {
    isPreviewLoading.value = false;
  }
}

// --- Save & Delete Process ---
async function initiateSaveProcess() {
  const { valid } = await batchForm.value.validate();
  if (!valid) return;

  isSaving.value = true;
  await checkConflictsAndShowDialog();
  isSaving.value = false;
}

//  在 BookingRuleManager.vue 中，用這個新版本取代舊的函式
async function checkConflictsAndShowDialog() {
  //  [關鍵修改] 直接使用 datepicker 中選定的日期作為要處理的列表
  const datesToCheck = selectedDaysForEditing.value.map(d => formatDate(d));

  if (datesToCheck.length === 0) {
      showSnackbar('您尚未在日曆中選擇任何要設定的日期', 'warning');
      isSaving.value = false;
      return;
  }

  const currentBatchId = editedBatch.value.id || null;
  const conflictResult = await checkDateConflicts(projectId.value, datesToCheck, currentBatchId);

  //  [修正] 將排序程式碼加回來
  conflictResult.conflictingDates.sort((a, b) => a.date.localeCompare(b.date));


  conflictData.value = conflictResult;
  Object.keys(dateResolutions).forEach(key => delete dateResolutions[key]);

  conflictResult.conflictingDates.forEach(d => {
    dateResolutions[d.date] = { 
      mode: 'link', 
      targetRuleId: d.existingRule.ruleId 
    };
  });

  conflictResult.nonConflictingDates.forEach(date => {
    dateResolutions[date] = {
      mode: 'create_shared'
    };
  });

  if (conflictData.value.conflictingDates.length > 0) {
    isConflictDialogVisible.value = true;
  } else {
    await executeSave();
  }
}

//  在 BookingRuleManager.vue 中，用這個新版本取代舊的函式
async function executeSave() {
  isSaving.value = true;

  //  [關鍵修改] 再次根據 selectedDaysForEditing 過濾，確保只提交勾選日期的資料
  const selectedDateKeys = selectedDaysForEditing.value.map(d => formatDate(d));

  const filteredDailyRules = {};
  const filteredResolutions = {};

  selectedDateKeys.forEach(dateKey => {
    if (editedBatch.value.dailyRules[dateKey]) {
      filteredDailyRules[dateKey] = editedBatch.value.dailyRules[dateKey];
    }
    if (dateResolutions[dateKey]) {
      filteredResolutions[dateKey] = dateResolutions[dateKey];
    }
  });

  const dataToSave = JSON.parse(JSON.stringify(editedBatch.value));

  // 將 applicationStart/End 從字串 'YYYY-MM-DDTHH:mm' 轉換為 JS Date 物件
  if (dataToSave.applicationStart && typeof dataToSave.applicationStart === 'string') {
      dataToSave.applicationStart = new Date(dataToSave.applicationStart);
  }
  if (dataToSave.applicationEnd && typeof dataToSave.applicationEnd === 'string') {
      dataToSave.applicationEnd = new Date(dataToSave.applicationEnd);
  }

 const finalPayload = {
    batchData: { 
      ...dataToSave, // 使用轉換過後的 dataToSave
      dailyRules: filteredDailyRules
    },
    resolutions: filteredResolutions
  };

  if (finalPayload.batchData.bookingType === '其他') {
    finalPayload.batchData.bookingType = customBookingType.value;
  }
  finalPayload.batchData.projectId = projectId.value;
  finalPayload.batchData.projectName = projectName.value;

  try {
    // Firebase SDK 會自動將 Date 物件轉換為 Timestamp 存入資料庫
    const res = await saveBatchWithRules(finalPayload); 
    if (res.status !== 'success') throw new Error(res.message);

    showSnackbar('儲存成功！');
    isConflictDialogVisible.value = false;
    isBatchDialogVisible.value = false;

    await loadDataForProject();
  } catch(error) {
    showSnackbar(`儲存失敗: ${error.message || '未知錯誤'}`, 'error');
  } finally {
    isSaving.value = false;
  }
}

async function handleConfirmDelete() {
  if (!batchToDelete.value) return;
  isDeleting.value = true;
  try {
    const res = await deleteBookingBatch(batchToDelete.value.id);
    if (res.status !== 'success') throw new Error(res.message);

    const index = bookingBatches.value.findIndex(b => b.id === batchToDelete.value.id);
    if (index > -1) bookingBatches.value.splice(index, 1);
    
    showSnackbar('批次已成功刪除');
    closeDeleteDialog();
  } catch (error) {
    showSnackbar(`刪除失敗: ${error.message}`, 'error');
  } finally {
    isDeleting.value = false;
  }
}

// --- Daily Rule Editor Functions ---
const currentDaySlots = computed({
  get() {
    if (selectedDaysForEditing.value.length === 0) return [];
    const firstDateKey = formatDate(selectedDaysForEditing.value[0]);
    const slots = editedBatch.value.dailyRules[firstDateKey]?.slots || {};
    return Object.keys(slots);
  },
  set(newSlots) {
    if (selectedDaysForEditing.value.length === 0) return;

    selectedDaysForEditing.value.forEach(day => {
        const dateKey = formatDate(day);
        if (!editedBatch.value.dailyRules[dateKey]) {
            editedBatch.value.dailyRules[dateKey] = { slots: {} };
        }
        
        const oldSlotsData = editedBatch.value.dailyRules[dateKey].slots;
        const newSlotsData = {};

        newSlots.forEach(slot => {
            newSlotsData[slot] = oldSlotsData[slot] || { capacity: 1, methods: [] };
        });
        editedBatch.value.dailyRules[dateKey].slots = newSlotsData;
    });
  }
});

const sortedCurrentDaySlots = computed(() => [...currentDaySlots.value].sort());

function getCapacityForSlot(slot) {
  if (selectedDaysForEditing.value.length === 0) return 0;
  const firstDateKey = formatDate(selectedDaysForEditing.value[0]);
  return editedBatch.value.dailyRules[firstDateKey]?.slots?.[slot]?.capacity || 0;
}

function setCapacityForSlot(slot, capacity) {
  const cap = Number(capacity) || 0;
  selectedDaysForEditing.value.forEach(day => {
    const slots = editedBatch.value.dailyRules[formatDate(day)]?.slots;
    if (slots && slots[slot]) slots[slot].capacity = cap;
  });
}

function isMethodSelectedForSlot(slot, method) {
    if (selectedDaysForEditing.value.length === 0) return false;
    const firstDateKey = formatDate(selectedDaysForEditing.value[0]);
    return editedBatch.value.dailyRules[firstDateKey]?.slots?.[slot]?.methods.includes(method) || false;
}

function updateMethodsForSlot(slot, method, isSelected) {
  selectedDaysForEditing.value.forEach(day => {
    const daySlot = editedBatch.value.dailyRules[formatDate(day)]?.slots?.[slot];
    if (!daySlot || !daySlot.methods) return;

    const methods = daySlot.methods;
    const index = methods.indexOf(method);

    if (isSelected && index === -1) methods.push(method);
    else if (!isSelected && index > -1) methods.splice(index, 1);
  });
  editedBatch.value.dailyRules = { ...editedBatch.value.dailyRules };
}

const isDayConfigured = (day) => {
    const slots = editedBatch.value.dailyRules[formatDate(day)]?.slots;
    return slots && Object.keys(slots).length > 0;
}

function handleSelectAll(isChecked, slot) {
  selectedDaysForEditing.value.forEach(day => {
    const daySlot = editedBatch.value.dailyRules[formatDate(day)]?.slots?.[slot];
    //  將 allMethodOptions 改為 projectSettings.bookingMethodOptions
    if (daySlot) daySlot.methods = isChecked ? [...projectSettings.value.bookingMethodOptions] : [];
  });
  editedBatch.value.dailyRules = { ...editedBatch.value.dailyRules };
}

function getSelectAllState(slot) {
  if (selectedDaysForEditing.value.length === 0) return { checked: false, indeterminate: false };
  const firstDateKey = formatDate(selectedDaysForEditing.value[0]);
  const methodsArray = editedBatch.value.dailyRules[firstDateKey]?.slots?.[slot]?.methods;
  if (!methodsArray) return { checked: false, indeterminate: false };

  const selectedCount = methodsArray.length;
  //  將 allMethodOptions 改為從 projectSettings 中讀取，並加上 .value
  const totalCount = projectSettings.value.bookingMethodOptions.length;

  return {
    checked: selectedCount === totalCount && totalCount > 0,
    indeterminate: selectedCount > 0 && selectedCount < totalCount,
  };
}

// --- DateTime Picker Functions ---
function saveApplicationStart() {
  if (tempDateStart.value && tempTimeStart.value) {
    editedBatch.value.applicationStart = `${formatDate(tempDateStart.value)}T${tempTimeStart.value}`;
  }
  menuAppStart.value = false;
}

function saveApplicationEnd() {
  if (tempDateEnd.value && tempTimeEnd.value) {
    editedBatch.value.applicationEnd = `${formatDate(tempDateEnd.value)}T${tempTimeEnd.value}`;
  }
  menuAppEnd.value = false;
}

// ✓ START: 同步修正 getBatchStatus 函式，使其也能處理 Timestamp 物件
function getBatchStatus(item) {
  if (!item.applicationStart || !item.applicationEnd) return { text: '時間未設定', color: 'grey-darken-2' };
  
  const now = new Date();
  let start, end;

  // 穩健地處理起始時間
  if (typeof item.applicationStart === 'object' && item.applicationStart !== null && typeof item.applicationStart.seconds === 'number') {
    start = new Date(item.applicationStart.seconds * 1000);
  } else {
    start = new Date(item.applicationStart);
  }

  // 穩健地處理結束時間
  if (typeof item.applicationEnd === 'object' && item.applicationEnd !== null && typeof item.applicationEnd.seconds === 'number') {
    end = new Date(item.applicationEnd.seconds * 1000);
  } else {
    end = new Date(item.applicationEnd);
  }
  
  // 驗證日期有效性
  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return { text: '時間格式錯誤', color: 'orange' };
  }

  if (now < start) return { text: '尚未開放', color: 'blue-grey' };
  if (now > end) return { text: '已截止', color: 'red-darken-1' };
  return { text: '開放中', color: 'green' };
}

//  [新增] 從 sharedBy 陣列中提取預約項目的函式
function extractBookingType(sharedByArray) {
  if (!sharedByArray || sharedByArray.length === 0) {
    return '';
  }
  // 假設格式為 "預約項目(批次代號)"，例如 "初驗(1)"
  const firstItem = sharedByArray[0];
  // 找到第一個 '(' 符號並取其前面的部分
  const separatorIndex = firstItem.indexOf('(');
  if (separatorIndex !== -1) {
    return firstItem.substring(0, separatorIndex);
  }
  return firstItem; // 如果沒有 '('，則返回整個字串
}



function addFaqItem() {
  if (!projectSettings.value.intro.faq) {
    projectSettings.value.intro.faq = [];
  }
  projectSettings.value.intro.faq.push({ q: '', a: '' });
}

function removeFaqItem(index) {
  projectSettings.value.intro.faq.splice(index, 1);
}


async function saveSettings() {
    if (!projectId.value) {
        showSnackbar("請先選擇一個建案！", 'error');
        return;
    }
    isSavingSettings.value = true;
    try {
        const result = await updateProjectSettings(projectId.value, projectSettings.value);
        if (result.status === 'success') {
            showSnackbar("設定儲存成功！", 'success');
            isSettingsDrawerOpen.value = false; // 成功後關閉抽屜
        } else {
            throw new Error(result.message);
        }
    } catch (error) {
        showSnackbar(`儲存失敗: ${error.message}`, 'error');
    } finally {
        isSavingSettings.value = false;
    }
}


// applyTemplate 函式，讓它打開預覽視窗
function applyTemplate(fieldName) {
  const sourceIntro = defaultSettings.value.intro;
  const sourceReportSettings = defaultSettings.value.reportSettings;
  currentTargetField.value = fieldName; // 記住要修改哪個欄位

  switch(fieldName) {
    case 'greeting':
      templatePreviewTitle.value = '招呼語';
      templatePreviewContent.value = sourceIntro.greeting;
      break;
    case 'body':
      templatePreviewTitle.value = '內文說明';
      templatePreviewContent.value = sourceIntro.body;
      break;
    case 'footer':
      templatePreviewTitle.value = '頁尾文字';
      templatePreviewContent.value = sourceIntro.footer;
      break;
    case 'closingText':
      templatePreviewTitle.value = '結束語';
      templatePreviewContent.value = sourceIntro.closingText;
      break;
    case 'alertText':
      templatePreviewTitle.value = '提示框內容';
      templatePreviewContent.value = sourceIntro.alert.text;
      break;
    case 'uploadReminderEmailSubject':
      templatePreviewTitle.value = '未上傳報告-主旨';
      templatePreviewContent.value = sourceReportSettings.uploadReminderEmail.subject;
      break;
    case 'uploadReminderEmailBody':
      templatePreviewTitle.value = '未上傳報告-內文';
      templatePreviewContent.value = sourceReportSettings.uploadReminderEmail.body;
      break;
    case 'uploadReminderEmailReminder':
      templatePreviewTitle.value = '未上傳報告-提醒';
      templatePreviewContent.value = sourceReportSettings.uploadReminderEmail.reminder;
      break;
    default:
      return; // 如果找不到對應的欄位，則不執行
  }
  isPreviewTemplateDialogVisible.value = true;
}

// 使用者在 Dialog 按下確認後，才真正執行的函式
function handleConfirmApplyTemplate() {
  const targetIntro = projectSettings.value.intro;
  const targetReportSettings = projectSettings.value.reportSettings;

  switch(currentTargetField.value) {
    case 'greeting':
      targetIntro.greeting = templatePreviewContent.value;
      break;
    case 'body':
      targetIntro.body = templatePreviewContent.value;
      break;
    case 'footer':
      targetIntro.footer = templatePreviewContent.value;
      break;
    case 'closingText':
      targetIntro.closingText = templatePreviewContent.value;
      break;
    case 'alertText':
      targetIntro.alert.text = templatePreviewContent.value;
      break;
    case 'uploadReminderEmailSubject':
      targetReportSettings.uploadReminderEmail.subject = templatePreviewContent.value;
      break;
    case 'uploadReminderEmailBody':
      targetReportSettings.uploadReminderEmail.body = templatePreviewContent.value;
      break;
     case 'uploadReminderEmailReminder':
      targetReportSettings.uploadReminderEmail.reminder = templatePreviewContent.value;
      break;
  }
  
  // 關閉 Dialog 並清除暫存資料
  isPreviewTemplateDialogVisible.value = false;
  templatePreviewContent.value = '';
  currentTargetField.value = null;
}


//  新增處理圖片上傳的函式
function handleLogoUpload(event) {
  const file = event.target.files[0];
  if (!file) {
    return;
  }

  // 限制檔案類型為圖片
  if (!file.type.startsWith('image/')) {
    showSnackbar('請選擇圖片檔案 (jpg, png, gif, svg)', 'error');
    return;
  }

  // 限制檔案大小 (例如 1MB)
  if (file.size > 1 * 1024 * 1024) {
    showSnackbar('圖片檔案大小請勿超過 1MB', 'error');
    return;
  }

  const reader = new FileReader();
  reader.onload = (e) => {
    // 將讀取的 Base64 字串存入 projectSettings
    projectSettings.value.logoUrl = e.target.result;
  };
  reader.readAsDataURL(file);
}

async function handleManualLineNotification() {
  if (!confirm(`您確定要手動發送「${projectName.value}」的驗屋報告未下載 LINE 提醒嗎？`)) {
    return;
  }
  isSendingLineNotification.value = true;
  try {
    const result = await triggerNotDownloadedReportReminder({ projectId: projectId.value });
    showSnackbar(result.message, 'success'); // 假設您已有 showSnackbar 函式
  } catch (error) {
    showSnackbar(`發送失敗：${error.message}`, 'error');
  } finally {
    isSendingLineNotification.value = false;
  }
}

// --- Lifecycle & Watchers ---
onMounted(loadDataForProject);

watch(() => [editedBatch.value.bookingStart, editedBatch.value.bookingEnd], () => {
    selectedDaysForEditing.value = [];
});

watch(() => editedBatch.value.bookingType, () => {
  if (batchForm.value) batchForm.value.validate();
});

watch(customBookingType, () => {
  if (batchForm.value) batchForm.value.validate();
});

watch(menuAppStart, (isOpen) => {
  if (isOpen) {
    activePickerTabStart.value = 0;
    const startValue = editedBatch.value.applicationStart;
    if (startValue) {
      // 無論 startValue 是 Date 物件還是字串，都建立一個新的 Date 物件
      const startDate = new Date(startValue);
      // 驗證日期是否有效
      if (!isNaN(startDate.getTime())) {
        tempDateStart.value = startDate;
        // 從 Date 物件中提取 'HH:mm' 格式的時間
        tempTimeStart.value = startDate.toLocaleTimeString('sv-SE', { hour: '2-digit', minute: '2-digit' });
      }
    } else {
      // 如果沒有值，設定為預設值
      tempDateStart.value = new Date();
      tempTimeStart.value = '00:00';
    }
  }
});

watch(menuAppEnd, (isOpen) => {
  if (isOpen) {
    activePickerTabEnd.value = 0;
    const endValue = editedBatch.value.applicationEnd;
    if (endValue) {
      const endDate = new Date(endValue);
      if (!isNaN(endDate.getTime())) {
        tempDateEnd.value = endDate;
        tempTimeEnd.value = endDate.toLocaleTimeString('sv-SE', { hour: '2-digit', minute: '2-digit' });
      }
    } else {
      tempDateEnd.value = new Date();
      tempTimeEnd.value = '00:00';
    }
  }
});

</script>

<style scoped>
.primary-bg {
  background-color: #1a73e8;
  color: white;
}
.weekend-highlight {
  color: red;
  font-weight: bold;
}

.settings-tab-content {
  display: flex;
  flex-direction: column;
  /* 計算高度：100vh - (頂部導覽列高度 + 卡片標題高度 + Tabs 高度) */
  /* 您可以根據實際情況微調 180px 這個值 */
  height: calc(100vh - 180px); 
}

.settings-form-container {
  flex-grow: 1;
  overflow-y: auto; /* 讓表單內容可以滾動 */
}

.sticky-actions {
  position: sticky;
  bottom: 0;
  z-index: 1;
  background-color: white; /* 設定背景色以遮擋下方滾動的內容 */
  border-top: 1px solid #e0e0e0; /* 加上分隔線，視覺效果更好 */
  box-shadow: 0 -2px 5px rgba(0,0,0,0.05); /* 加上陰影 */
}
</style>