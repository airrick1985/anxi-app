<template>
  <v-container fluid style="background-color: #F5F5F7; min-height: 100vh;">

    <v-overlay :model-value="isLoading" class="align-center justify-center" persistent>
      <div class="d-flex align-center">
        <v-progress-circular color="white" indeterminate size="50"></v-progress-circular>

        <div class="text-white ml-4">{{ loadingText }}</div>
      </div>
    </v-overlay>


    <v-row justify="center">
      <v-col cols="12" md="8" lg="6">

        <v-card v-if="isLoading && !projectConfig" class="mx-auto">
          <v-card-text class="text-center py-8">
            <v-progress-circular :size="64" :width="4" color="primary" indeterminate class="mb-4"></v-progress-circular>
            <h3 class="text-h6 mb-2">載入中...</h3>
            <p class="text-grey">正在載入建案資訊，請稍候</p>
          </v-card-text>
        </v-card>


        <div v-if="projectConfig" class="d-flex justify-center py-2">
          <img v-if="projectConfig.logoUrl" :src="projectConfig.logoUrl" alt="Project Logo"
            style="max-height: 40px; object-fit: contain; cursor: pointer;"
            @click="openWelcomeModal">
          <!-- 無 LOGO 時顯示一個極輕量的可點擊區域，仍供內部人員開啟歡迎視窗 -->
          <div v-else class="welcome-dot-trigger" @click="openWelcomeModal" title=""></div>
        </div>

        <!-- 歡迎視窗：一般客戶見到問候語可關閉；內部人員開啟此視窗後，於背景輸入對應 projectId 即啟用代填模式 -->
        <v-dialog v-model="isWelcomeModalVisible" max-width="420">
          <v-card>
            <v-card-title class="text-h6 font-weight-bold" @click="onDevTitleTap"
              style="user-select: none;">
              {{ projectConfig?.name || '建案' }} 歡迎使用預約系統
            </v-card-title>
            <v-card-text>
              <p class="mb-1">感謝您使用線上預約系統，請依步驟完成預約程序。</p>
              <p class="text-caption text-grey-darken-1 mb-0">如需協助請洽現場服務人員。</p>
              <div v-if="devMode" class="text-caption text-success mt-3">
                <v-icon size="x-small">mdi-check-circle</v-icon>
                目前已啟用代填模式
              </div>
              <!-- 手機啟用器：連點標題達門檻後顯示，輸入對應 projectId 即啟用代填模式 -->
              <div v-if="showDevActivator && !devMode" class="mt-3">
                <v-text-field v-model="devProjectIdInput" label="內部代填啟用碼" variant="outlined"
                  density="compact" hide-details autocomplete="off" autofocus
                  @keyup.enter="activateDevModeFromInput"></v-text-field>
                <div class="d-flex justify-end mt-2">
                  <v-btn size="small" color="primary" variant="elevated"
                    @click="activateDevModeFromInput">啟用代填模式</v-btn>
                </div>
              </div>
            </v-card-text>
            <v-card-actions>
              <v-btn v-if="devMode" variant="text" color="error" @click="exitDevMode">關閉代填模式</v-btn>
              <v-spacer></v-spacer>
              <v-btn color="primary" variant="elevated" @click="closeWelcomeModal">關閉</v-btn>
            </v-card-actions>
          </v-card>
        </v-dialog>

        <!-- DEV 模式：頂部提示橫條 -->
        <v-alert v-if="devMode" type="warning" variant="tonal" density="compact" class="mb-2"
          icon="mdi-shield-account-outline">
          <div class="d-flex align-center">
            <div class="flex-grow-1">
              <strong>代填模式啟用中</strong>
              <span class="text-caption d-block">
                已解除下列限制：未開放 ・ 已截止 ・ 名額已滿 ・ 已預約（等同開啟「可重複預約」）。
              </span>
              <span class="text-caption d-block font-weight-medium">僅供內部人員為客戶代填使用，請審慎操作。</span>
            </div>
            <v-btn size="small" variant="text" color="error" @click="exitDevMode">關閉</v-btn>
          </div>
        </v-alert>

        <v-card v-if="projectConfig" class="mx-auto" :loading="isLoading">
          <template v-if="isUploadMode">
            <v-card-title class="text-h5 font-weight-bold py-2 d-flex align-center"
              :style="{ backgroundColor: projectConfig.themeColor, color: 'white' }">
              <v-btn v-if="!uploadSuccess" :icon="uploadStep === 1 ? 'mdi-arrow-left' : undefined" variant="text"
                @click="isUploadMode = false" :disabled="isLoading" class="mr-3"></v-btn>
              <span>{{ projectConfig.name }} 上傳驗屋報告</span>
            </v-card-title>
            <v-divider></v-divider>

            <div v-if="!uploadSuccess">
              <div v-if="uploadStep === 1">
                <v-card-text>
                  <div class="prose mb-6" v-html="projectConfig.reportUploadIntro.body"></div>
                  <v-alert v-if="projectConfig.reportUploadIntro.alert.show"
                    :color="projectConfig.reportUploadIntro.alert.color"
                    :type="projectConfig.reportUploadIntro.alert.type" class="mb-4" border="start" density="compact">
                    <template v-slot:title>
                      <div v-if="projectConfig.reportUploadIntro.alert.title" class="font-weight-bold">{{
                        projectConfig.reportUploadIntro.alert.title }}</div>
                    </template>
                    <div v-html="projectConfig.reportUploadIntro.alert.text"></div>
                  </v-alert>

                  <v-form ref="uploadStep1FormRef" @submit.prevent="handleUploadStep1Submit">
                    <v-select v-model="uploadForm.reportType" :items="['初驗報告', '複驗報告']" label="報告種類" variant="outlined"
                      :rules="[v => !!v || '必填']"></v-select>
                    <v-select v-model="uploadForm.building" :items="uploadBuildingList" label="棟別" variant="outlined"
                      :rules="[v => !!v || '必填']" @update:model-value="onUploadBuildingChange"></v-select>
                    <v-select v-model="uploadForm.unit" :items="uploadUnitList" item-title="unit" item-value="unit"
                      label="戶別" variant="outlined" :rules="[v => !!v || '必填']" :disabled="!uploadForm.building"
                      no-data-text="請先選擇棟別"></v-select>
                    <v-text-field v-model="uploadForm.idNumber" label="身分證或驗證碼" variant="outlined"
                      :rules="[v => !!v || '必填']"></v-text-field>
                  </v-form>
                </v-card-text>
                <div class="step-nav-actions step-nav-actions--single">
                  <v-btn class="step-next-btn" size="x-large" variant="flat"
                    @click="handleUploadStep1Submit" :loading="isLoading">
                    <v-icon class="step-next-icon" start>mdi-check-circle-outline</v-icon>
                    <span class="step-next-text">確認資料，下一步</span>
                    <v-icon class="step-next-arrow" end>mdi-arrow-right</v-icon>
                  </v-btn>
                </div>
              </div>
              <div v-else-if="uploadStep === 2">
                <v-card-text>
                  <v-alert type="info" variant="tonal" border="start" class="mb-4">
                    <p class="font-weight-bold">資格驗證成功！請填寫以下資訊並上傳檔案。</p>
                  </v-alert>
                  <v-form ref="uploadStep2FormRef" @submit.prevent="handleUploadSubmit">
                    <v-text-field v-model="uploadForm.buyerName" label="買方姓名" variant="outlined"
                      :rules="[v => !!v || '必填']"></v-text-field>
                    <v-text-field v-model="uploadForm.phone" label="聯絡電話" variant="outlined"
                      :rules="[v => !!v || '必填']"></v-text-field>
                    <v-text-field v-model="uploadForm.email" label="EMAIL (用於接收確認信)" variant="outlined"
                      :rules="[v => !!v || '必填', v => /.+@.+\..+/.test(v) || 'E-mail 格式不正確']"></v-text-field>
                    <v-text-field v-model="uploadForm.companyName" label="代驗公司名稱 (若無免填)"
                      variant="outlined"></v-text-field>
                    <div class="file-drop-zone" :class="{ 'is-active': isDragActive }"
                      @dragover.prevent="isDragActive = true" @dragleave.prevent="isDragActive = false"
                      @drop.prevent="handleFileDrop" @click="triggerFileInput">
                      <v-icon size="48" color="grey-lighten-1" class="mb-2">mdi-cloud-upload-outline</v-icon>
                      <p v-if="!uploadForm.file" class="text-grey">將 PDF 檔案拖曳至此，或點擊上傳</p>
                      <div v-else class="file-info">
                        <v-icon color="red">mdi-file-pdf-box</v-icon>
                        <span class="ml-2 font-weight-bold">{{ uploadForm.file.name }}</span>
                        <span class="text-grey ml-2">({{ (uploadForm.file.size / 1024 / 1024).toFixed(2) }} MB)</span>
                      </div>
                      <p class="text-caption text-grey mt-2">（檔案大小限制 30MB）</p>
                    </div>
                    <input ref="fileInputRef" type="file" accept=".pdf" hidden @change="handleFileSelect">
                  </v-form>
                </v-card-text>
                <div class="step-nav-actions">
                  <v-btn class="step-back-btn" size="large" variant="outlined"
                    @click="uploadStep = 1" :disabled="isLoading">
                    <v-icon start>mdi-arrow-left</v-icon>
                    返回上一步
                  </v-btn>
                  <v-btn class="step-next-btn step-next-btn--finish" size="x-large" variant="flat"
                    @click="handleUploadSubmit" :loading="isLoading">
                    <v-icon class="step-next-icon" start>mdi-cloud-upload-outline</v-icon>
                    <span class="step-next-text">確認上傳</span>
                    <v-icon class="step-next-arrow" end>mdi-send</v-icon>
                  </v-btn>
                </div>
              </div>
            </div>

            <div v-if="uploadSuccess">
              <v-card-text class="text-center py-8">
                <v-icon size="64" color="success" class="mb-4">mdi-check-circle-outline</v-icon>
                <h3 class="text-h5 mb-2">上傳成功！</h3>
                <p class="mb-6">您的驗屋報告已成功上傳，一封確認信已寄送至您的電子信箱。</p>
                <v-btn :color="projectConfig.themeColor" size="large" @click="resetUploadMode"
                  variant="elevated">返回上傳頁面</v-btn>
              </v-card-text>
            </div>
          </template>

          <template v-else>
            <v-card-title class="text-h5 font-weight-bold py-2 d-flex align-center"
              :style="{ backgroundColor: projectConfig.themeColor, color: projectConfig.titleColor }">
              <v-btn v-if="step > 0 && step < 3" variant="outlined" :color="projectConfig.titleColor"
                @click="goBackToStep0" class="mr-2 font-weight-bold" size="small" rounded="pill"
                :density="$vuetify.display.xs ? 'comfortable' : 'default'">
                <v-icon start>mdi-arrow-left</v-icon>
                <span>{{ $vuetify.display.xs ? '返回' : '返回預約項目' }}</span>
              </v-btn>
              <span class="text-truncate flex-grow-1" :class="[$vuetify.display.xs ? 'text-subtitle-1' : 'text-h6']"
                :style="{ lineHeight: '1.2' }">
                {{ step === 0 ? (projectConfig.name + " 預約系統") : (currentPageSettings?.pageTitle ||
                  projectConfig.pageTitle) }}
              </span>
              <v-spacer></v-spacer>


            </v-card-title>

            <!-- Customer Message Dialog -->
            <v-dialog v-model="isCustomerMessageDialogOpen" max-width="600px" persistent>
              <v-card>
                <v-card-title class="bg-primary text-white d-flex justify-space-between align-center">
                  {{ currentCustomerMessageConfig?.dialogTitle || '填寫資訊' }}
                  <v-btn icon="mdi-close" variant="text" color="white"
                    @click="isCustomerMessageDialogOpen = false"></v-btn>
                </v-card-title>
                <v-card-text class="pa-4" style="max-height: 80vh; overflow-y: auto;">
                  <v-form ref="customerMessageFormRef" @submit.prevent="submitCustomerMessage">

                    <!-- Selection Section -->
                    <v-row v-if="currentCustomerMessageConfig?.enableBuildingSelect">
                      <v-col cols="12" sm="6">
                        <v-select v-model="customerMessageForm.building" :items="initialData.buildings || []" label="棟別"
                          variant="outlined" density="comfortable" :rules="[v => !!v || '必填']"
                          @update:model-value="onCustomerMessageBuildingChange"></v-select>
                      </v-col>
                      <v-col cols="12" sm="6" v-if="currentCustomerMessageConfig?.enableUnitSelect">
                        <v-select v-model="customerMessageForm.unit" :items="customerMessageUnitList" item-title="unit"
                          item-value="unit" label="戶別" variant="outlined" density="comfortable"
                          :rules="[v => !!v || '必填']" :disabled="!customerMessageForm.building"></v-select>
                      </v-col>
                    </v-row>

                    <!-- ID Verification -->
                    <v-text-field v-if="currentCustomerMessageConfig?.enableIdVerification"
                      v-model="customerMessageForm.idNumber" label="身分證(驗證碼)" variant="outlined"
                      density="comfortable" class="mb-2"></v-text-field>

                    <v-divider class="my-3"></v-divider>

                    <!-- Dynamic Fields -->
                    <div v-if="currentCustomerMessageConfig?.customFields?.length > 0">
                      <DynamicFormRenderer :fields="currentCustomerMessageConfig.customFields"
                        v-model="customerMessageDynamicData" />
                    </div>

                    <!-- File Upload -->
                    <div v-if="currentCustomerMessageConfig?.enableFileUpload" class="mt-4">
                      <p class="text-subtitle-2 font-weight-bold mb-1">附件上傳 (最多10個，單檔30MB)</p>
                      <v-file-input v-model="customerMessageFiles" label="選擇檔案 (圖片或PDF)" multiple chips show-size
                        counter variant="outlined" density="comfortable" accept="image/*,.pdf" :rules="[
                          v => !v || v.length <= 10 || '最多上傳 10 個檔案',
                          v => !v || v.every(f => f.size <= 30 * 1024 * 1024) || '單一檔案不可超過 30MB'
                        ]"></v-file-input>
                    </div>

                  </v-form>
                </v-card-text>
                <v-card-actions class="pa-4 border-t">
                  <v-spacer></v-spacer>
                  <v-btn variant="text" @click="isCustomerMessageDialogOpen = false">取消</v-btn>
                  <v-btn color="primary" variant="elevated" @click="submitCustomerMessage"
                    :loading="isSubmittingCustomerMessage">
                    確認送出
                  </v-btn>
                </v-card-actions>
              </v-card>
            </v-dialog>
            <v-divider></v-divider>

            <v-alert v-if="!projectConfig && !isLoading" type="error" border="start" prominent title="頁面錯誤">
              找不到對應的建案設定，請確認網址是否正確。
            </v-alert>
            <!-- 系統狀態提示（僅 Step 0 時顯示全域狀態，Step 1 由批次提示取代） -->
            <v-alert v-if="projectConfig && systemStatus.code !== 'OPEN' && !isLoading && step === 0"
              :type="systemStatus.code === 'NOT_STARTED' ? 'info' : (systemStatus.code === 'ENDED' ? 'error' : 'error')"
              :icon="systemStatus.icon" border="start" prominent variant="tonal" class="mb-4">
              <template v-slot:title>
                <span class="font-weight-bold">
                  {{ systemStatus.code === 'NOT_STARTED' ? '預約尚未開始' : (systemStatus.code === 'ENDED' ? '預約已截止' :
                    '預約未開放') }}
                </span>
              </template>
              {{ systemStatus.message }}
            </v-alert>

            <v-card-text v-if="step > 0 && step < 3 && currentPageSettings">
              <div class="prose">
                <div v-html="currentPageSettings.intro.greeting"></div>
                <div v-html="currentPageSettings.intro.body"></div>

                <!-- 批次未開放提示（顯示在閒讀說明上方） -->
                <v-alert v-if="step === 1 && !isSelectedTypeActive && nextBatchSchedule" type="warning" variant="tonal"
                  border="start" prominent icon="mdi-clock-alert-outline" class="batch-not-open-alert mb-4">
                  <template v-slot:title>
                    <span class="font-weight-bold text-subtitle-1">
                      目前「{{ selectedBookingType }}」尚未開始
                    </span>
                  </template>
                  <div class="mt-2">
                    <p class="mb-3 text-body-1">
                      <v-icon size="18" class="mr-1">mdi-calendar-range</v-icon>
                      開放時間：
                      <strong>{{ formatScheduleDateTime(nextBatchSchedule.applicationStart) }}</strong>
                      ~
                      <strong>{{ formatScheduleDateTime(nextBatchSchedule.applicationEnd) }}</strong>
                    </p>
                    <div class="d-flex flex-wrap ga-2">
                      <v-btn size="small" variant="outlined" color="primary" prepend-icon="mdi-google"
                        @click="addToGoogleCalendar(nextBatchSchedule)">
                        加入 Google 行事曆
                      </v-btn>
                      <v-btn size="small" variant="outlined" color="primary" prepend-icon="mdi-calendar-export"
                        @click="downloadIcsFile(nextBatchSchedule)">
                        下載行事曆提醒 (.ics)
                      </v-btn>
                    </div>
                  </div>
                </v-alert>

                <!-- 無任何批次可用提示 -->
                <v-alert v-else-if="step === 1 && !isSelectedTypeActive && !nextBatchSchedule" type="info"
                  variant="tonal" border="start" prominent icon="mdi-information-outline" class="mb-4">
                  <template v-slot:title>
                    <span class="font-weight-bold">
                      「{{ selectedBookingType }}」尚未設定開放時間
                    </span>
                  </template>
                  <p class="mt-2">目前該預約服務尚未安排批次，請洽詢服務人員。</p>
                </v-alert>

                <div v-if="currentPageSettings.intro.alert.show">

                  <v-btn
                    block
                    size="large"
                    variant="flat"
                    class="mb-3 instructions-btn"
                    @click="isInstructionsDialogVisible = true"
                  >
                    <v-icon class="instructions-btn-icon" start>mdi-file-document-multiple-outline</v-icon>
                    <span class="instructions-btn-text">點此閱讀預約說明</span>
                    <v-icon class="instructions-btn-arrow" end>mdi-arrow-right</v-icon>
                  </v-btn>

                  <v-checkbox v-if="currentPageSettings.intro.alert.showConfirmation" v-model="isInstructionsConfirmed"
                    label="我已詳細閱讀並了解以上預約說明" :color="projectConfig.themeColor" class="mb-4" hide-details
                    :disabled="!isInstructionsConfirmed"></v-checkbox>
                </div>

                <v-dialog v-model="isInstructionsDialogVisible" :max-width="isMobile ? undefined : '820px'"
                  :fullscreen="isMobile" persistent scrollable
                  class="instructions-dialog" :class="{ 'instructions-dialog--fullscreen': isMobile }">
                  <v-card class="instructions-card" :class="{ 'instructions-card--fullscreen': isMobile }"
                    :rounded="isMobile ? 0 : 'xl'" :elevation="isMobile ? 0 : 24">
                    <!-- 標題列：漸層 + 圖示 -->
                    <div class="instructions-header">
                      <div class="instructions-header-bg"></div>
                      <div class="instructions-header-content">
                        <div class="instructions-header-icon">
                          <v-icon size="32" color="white">mdi-file-document-multiple-outline</v-icon>
                        </div>
                        <div class="instructions-header-text">
                          <div class="instructions-header-title">
                            {{ currentPageSettings.intro.alert.title }}
                          </div>
                          <div class="instructions-header-subtitle">
                            <v-icon size="14" class="mr-1">mdi-information-outline</v-icon>
                            請仔細閱讀以下內容
                          </div>
                        </div>
                      </div>
                    </div>

                    <!-- 內文捲動區 -->
                    <v-card-text
                      ref="instructionsScrollEl"
                      class="instructions-content"
                      @scroll="handleInstructionsScroll"
                    >
                      <div v-html="currentPageSettings.intro.alert.text" class="prose"></div>

                      <!-- 附件下載區塊（僅在有附件時顯示，置於閱讀完畢提示上方） -->
                      <div
                        v-if="currentPageSettings.intro.showAttachments && currentAttachments.length > 0"
                        class="dialog-attachments"
                      >
                        <div class="dialog-attachments-header">
                          <v-icon size="20" class="mr-2" color="primary">mdi-paperclip</v-icon>
                          <span class="dialog-attachments-title">相關附件下載</span>
                          <v-chip size="x-small" color="primary" variant="tonal" class="ml-2">
                            共 {{ currentAttachments.length }} 個
                          </v-chip>
                        </div>
                        <div class="dialog-attachments-hint">
                          <v-icon size="14" class="mr-1">mdi-information-outline</v-icon>
                          請點擊以預覽附件
                        </div>
                        <div class="dialog-attachments-list">
                          <div
                            v-for="(item, i) in currentAttachments"
                            :key="item.url || i"
                            class="dialog-attachment-item"
                            @click="openAttachmentPreview(item)"
                          >
                            <div class="dialog-attachment-icon">
                              <v-icon
                                size="28"
                                color="red"
                                v-if="item.name.toLowerCase().endsWith('.pdf')"
                              >mdi-file-pdf-box</v-icon>
                              <v-icon size="28" color="blue-grey-darken-1" v-else>mdi-file-image-outline</v-icon>
                            </div>
                            <div class="dialog-attachment-name">{{ item.name }}</div>
                          </div>
                        </div>
                      </div>

                      <!-- 末端提示：滑到底時顯示 -->
                      <div v-if="currentPageSettings.intro.alert.showConfirmation" class="instructions-end-anchor">
                        <v-divider class="mb-3"></v-divider>
                        <div class="instructions-end-hint">
                          <v-icon size="18" color="success" class="mr-1">mdi-check-circle</v-icon>
                          您已閱讀完畢，請點擊下方按鈕確認
                        </div>
                      </div>
                    </v-card-text>

                    <!-- 未讀完提示條 -->
                    <transition name="fade-slide">
                      <div
                        v-if="currentPageSettings.intro.alert.showConfirmation && !isInstructionsScrolledBottom"
                        class="instructions-scroll-hint"
                      >
                        <v-icon size="18" class="mr-1 scroll-hint-icon">mdi-arrow-down-circle</v-icon>
                        請向下滑動閱讀完整內容
                      </div>
                    </transition>

                    <!-- 動作區 -->
                    <div class="instructions-actions">
                      <!-- showConfirmation：滑到底才出現「我已閱讀並同意，開始預約」 -->
                      <template v-if="currentPageSettings.intro.alert.showConfirmation">
                        <transition name="cta-rise" mode="out-in">
                          <v-btn
                            v-if="isInstructionsScrolledBottom"
                            block
                            size="x-large"
                            variant="flat"
                            class="instructions-cta-btn"
                            @click="confirmInstructionsAndStartBooking"
                          >
                            <v-icon class="cta-check-icon" start>mdi-check-circle</v-icon>
                            <span class="cta-text">我已閱讀並同意，開始預約</span>
                            <v-icon class="cta-arrow-icon" end>mdi-arrow-right</v-icon>
                          </v-btn>
                          <v-btn
                            v-else
                            block
                            size="x-large"
                            variant="flat"
                            class="instructions-cta-btn instructions-cta-btn--disabled"
                            disabled
                          >
                            <v-icon start>mdi-lock-outline</v-icon>
                            <span class="cta-text">請先閱讀完所有內容</span>
                          </v-btn>
                        </transition>
                      </template>

                      <!-- 純說明模式：直接顯示關閉 -->
                      <v-btn
                        v-else
                        block
                        size="x-large"
                        variant="flat"
                        class="instructions-close-btn"
                        @click="isInstructionsDialogVisible = false"
                      >
                        <v-icon start>mdi-close</v-icon>
                        <span class="cta-text">關閉</span>
                      </v-btn>
                    </div>
                  </v-card>
                </v-dialog>



                <div v-if="currentPageSettings.intro.faq && currentPageSettings.intro.faq.length > 0" class="mt-6">
                  <v-list-subheader>常見問答</v-list-subheader>
                  <v-expansion-panels variant="accordion">
                    <v-expansion-panel v-for="(item, i) in currentPageSettings.intro.faq" :key="i" class="faq-panel">
                      <template v-slot:title>
                        <div v-html="item.q" class="prose faq-title" style="font-weight: 600;"></div>
                      </template>
                      <v-expansion-panel-text>
                        <div v-html="item.a" class="prose"></div>
                      </v-expansion-panel-text>
                    </v-expansion-panel>
                  </v-expansion-panels>
                </div>
                <div v-if="projectConfig && currentPageSettings.intro && currentPageSettings.intro.footer"
                  class="text-caption text-grey text-center mt-4 prose" v-html="currentPageSettings.intro.footer">
                </div>
                <div v-if="currentPageSettings.intro && currentPageSettings.intro.contact" class="contact-info mt-6">
                  <v-list-subheader>聯絡資訊</v-list-subheader>
                  <v-list density="compact">
                    <v-list-item v-if="currentPageSettings.intro.contact.name"
                      prepend-icon="mdi-office-building-outline">
                      <v-list-item-title>{{ currentPageSettings.intro.contact.name }}</v-list-item-title>
                    </v-list-item>
                    <v-list-item v-if="currentPageSettings.intro.contact.phone" prepend-icon="mdi-phone-outline"
                      :href="`tel:${currentPageSettings.intro.contact.phone}`">
                      <v-list-item-title>{{ currentPageSettings.intro.contact.phone }}</v-list-item-title>
                    </v-list-item>
                  </v-list>
                </div>

                <div
                  v-if="currentPageSettings.intro.showAttachments && currentAttachments.length > 0"
                  class="mt-6">
                  <v-list-subheader>附件下載</v-list-subheader>
                  <v-list density="compact">
                    <v-list-item v-for="(item, i) in currentAttachments" :key="item.url || i"
                      @click="openAttachmentPreview(item)" link rounded="lg" class="mb-2 border">
                      <template v-slot:prepend>
                        <v-icon color="red" v-if="item.name.toLowerCase().endsWith('.pdf')">mdi-file-pdf-box</v-icon>
                        <v-icon color="grey-darken-1" v-else>mdi-image-outline</v-icon>
                      </template>
                      <v-list-item-title class="text-primary">{{ item.name }}</v-list-item-title>
                      <template v-slot:append>
                        <v-btn icon="mdi-download-outline" variant="text" color="grey" size="small"
                          @click.stop="downloadAttachment(item)"></v-btn>
                      </template>
                    </v-list-item>
                  </v-list>
                </div>

              </div>
            </v-card-text>
            <v-divider v-if="step < 3"></v-divider>

            <div v-if="step === 0" class="pa-0">
              <!-- 頂部英雄區 -->
              <div class="pa-8 text-center bg-grey-lighten-4 rounded-t-lg">
                <h3 class="text-h4 font-weight-bold mb-2 text-primary">歡迎使用預約系統</h3>
                <p class="text-subtitle-1 text-grey-darken-1">請選擇您要進行的服務項目</p>
              </div>

              <!-- 1. 預約服務區（常駐顯示，不受批次開放狀態限制） -->
              <div class="pa-6">
                <div class="d-flex align-center mb-6">
                  <div class="bg-primary rounded-pill mr-3" style="width: 8px; height: 32px;"></div>
                  <h4 class="text-h5 font-weight-black">選擇您的預約服務</h4>
                </div>

                <div v-if="allBookingTypes && allBookingTypes.length > 0">
                  <v-row>
                    <v-col cols="12" sm="6" v-for="type in allBookingTypes" :key="type">
                      <!-- 開放中：主色按鈕 -->
                      <v-btn v-if="availableBookingTypes.includes(type)" block size="x-large" color="primary"
                        variant="elevated" class="py-8 text-h6 font-weight-bold rounded-xl"
                        @click="selectBookingType(type)">
                        <v-icon start size="32" class="mr-2">mdi-calendar-edit</v-icon>
                        {{ type }}
                      </v-btn>
                      <!-- 未開放：主色淺色 tonal 變體 + 狀態 chip + 開放時間 + 查看說明 CTA -->
                      <v-btn v-else block size="x-large" color="primary" variant="tonal"
                        class="py-4 text-h6 font-weight-bold rounded-xl text-none not-open-btn"
                        style="height: auto; min-height: 96px;" @click="selectBookingType(type)">
                        <div class="d-flex flex-column" style="width: 100%; gap: 6px;">
                          <!-- 第一列：項目標題 + 尚未開放 chip -->
                          <div class="d-flex align-center justify-space-between" style="width: 100%;">
                            <div class="d-flex align-center">
                              <v-icon start size="28" class="mr-2">mdi-calendar-clock</v-icon>
                              <span>{{ type }}</span>
                            </div>
                            <v-chip size="x-small" color="orange" variant="flat">
                              <v-icon start size="12">mdi-clock-outline</v-icon>
                              尚未開放
                            </v-chip>
                          </div>
                          <!-- 第二列：開放時間 -->
                          <div v-if="getNextBatchForType(type)"
                            class="text-caption text-medium-emphasis text-left"
                            style="font-weight: 400; line-height: 1.4;">
                            <v-icon size="14" class="mr-1">mdi-calendar-range</v-icon>
                            開放時間：{{ formatScheduleDateTime(getNextBatchForType(type).applicationStart) }}
                            ~ {{ formatScheduleDateTime(getNextBatchForType(type).applicationEnd) }}
                          </div>
                          <!-- 第三列：引導點擊查看說明 CTA -->
                          <div class="text-body-2 d-flex align-center justify-center text-primary not-open-cta"
                            style="font-weight: 600;">
                            <v-icon size="16" class="mr-1">mdi-book-open-page-variant-outline</v-icon>
                            點此查看預約說明及附件
                            <v-icon size="16" class="ml-1">mdi-arrow-right</v-icon>
                          </div>
                        </div>
                      </v-btn>
                    </v-col>
                  </v-row>
                </div>
                <div v-else class="text-center py-8 text-grey border rounded-xl"
                  style="border-style: dashed !important;">
                  <v-icon size="48" class="mb-2">mdi-calendar-remove</v-icon>
                  <p>目前暫無設定的預約項目</p>
                </div>
              </div>

              <!-- 2. 其他服務區 -->
              <div
                v-if="projectConfig.showReportUploadButton || (projectConfig.customerMessageConfigs && projectConfig.customerMessageConfigs.length > 0)"
                class="pa-6 bg-grey-lighten-5 border-t">

                <div class="d-flex align-center mb-6">
                  <div class="bg-secondary rounded-pill mr-3" style="width: 8px; height: 32px;"></div>
                  <h4 class="text-h5 font-weight-black text-secondary">其他服務</h4>
                </div>

                <v-row>
                  <!-- 報告上傳入口 -->
                  <v-col cols="12" v-if="projectConfig.showReportUploadButton">
                    <v-card variant="outlined"
                      class="rounded-xl pa-4 d-flex align-center flex-sm-row flex-column text-center text-sm-left"
                      color="secondary">
                      <v-icon size="48" color="secondary" class="mr-sm-4 mb-sm-0 mb-4">mdi-file-upload-outline</v-icon>
                      <div class="flex-grow-1">
                        <h5 class="text-h6 font-weight-bold mb-1">我有驗屋報告欲上傳</h5>
                        <p class="text-caption text-grey-darken-1 mb-0">若您已經有驗屋公司完成之驗屋報告需上傳，請由此進入</p>
                      </div>
                      <v-btn color="secondary" variant="elevated"
                        class="ml-sm-4 mt-sm-0 mt-4 px-8 font-weight-bold rounded-pill" @click="isUploadMode = true">
                        立即上傳
                      </v-btn>
                    </v-card>
                  </v-col>

                  <!-- 客戶回傳按鈕網格 -->
                  <v-col cols="12"
                    v-if="projectConfig.customerMessageConfigs && projectConfig.customerMessageConfigs.length > 0">
                    <v-row dense>
                      <v-col cols="12" sm="6" v-for="msgConfig in projectConfig.customerMessageConfigs"
                        :key="msgConfig.id">
                        <v-btn block color="error" variant="elevated"
                          class="py-4 font-weight-bold rounded-lg shimmer-button text-white h-auto"
                          prepend-icon="mdi-message-alert-outline" @click="openCustomerMessageDialog(msgConfig)">
                          {{ msgConfig.buttonText }}
                        </v-btn>
                      </v-col>
                    </v-row>
                  </v-col>
                </v-row>
              </div>
            </div>

            <div v-if="step > 0 && (!currentPageSettings?.intro?.alert?.showConfirmation || isInstructionsConfirmed)">



              <!-- 表單區域（僅批次開放中才顯示） -->
              <div v-if="step === 1 && !existingBookingInfo && isSelectedTypeActive">
                <v-card-text>
                  <div class="mb-4">
                    <h3 class="text-h6 mb-0 font-weight-bold">步驟一：填寫預約資料 ({{ selectedBookingType }})</h3>
                  </div>

                  <v-form ref="step1Form" @submit.prevent="handleStep1Submit">


                    <v-text-field ref="step1IdNumberField" v-model="formStep1.idNumber" :label="fieldLabel('idNumber')"
                      :hint="fieldHint('idNumber')" :persistent-hint="!!fieldHint('idNumber')"
                      :rules="isIdValidationRequired ? [v => !!v || '此戶別預約需輸入正確的驗證碼，若有疑問請洽詢客服'] : []" variant="outlined" class="mt-4"
                      :disabled="isLoading || !isBookingActive"></v-text-field>

                    <v-autocomplete v-model="formStep1.building" :items="initialData.buildings" :label="fieldLabel('building')"
                      :hint="fieldHint('building')" :persistent-hint="!!fieldHint('building')"
                      variant="outlined" :rules="[v => !!v || '棟別為必填項']" :disabled="isLoading || !isBookingActive"
                      @update:model-value="onBuildingChange" clearable></v-autocomplete>

                    <v-select v-model="formStep1.unit" :items="unitList" item-title="unit" item-value="unit" :label="fieldLabel('unit')"
                      :hint="fieldHint('unit')" :persistent-hint="!!fieldHint('unit')"
                      variant="outlined" :rules="[v => !!v || '戶別為必填項']"
                      :disabled="isLoading || !formStep1.building || !isBookingActive" no-data-text="請先選擇棟別"
                      @update:model-value="onUnitChange"></v-select>

                    <v-text-field v-model="formStep1.address" :label="fieldLabel('address')"
                      :hint="fieldHint('address')" :persistent-hint="!!fieldHint('address')"
                      variant="outlined" readonly disabled></v-text-field>



                    <v-select v-if="availableMethodOptions.length > 0" v-model="formStep1.bookingMethod"
                      :items="availableMethodOptions" :label="fieldLabel('bookingMethod')"
                      :hint="fieldHint('bookingMethod')" :persistent-hint="!!fieldHint('bookingMethod')"
                      variant="outlined" :rules="[v => !!v || '選擇方式為必填項']"
                      :disabled="isLoading || !formStep1.unit || !isBookingActive" no-data-text="請先選擇預約項目"></v-select>

                    <!-- 新增：第三層子選項 (例如：銀行選擇) -->
                    <v-select v-if="availableSubOptions.length > 0" v-model="formStep1.subOption"
                      :items="availableSubOptions" :label="fieldLabel('subOption')"
                      :hint="fieldHint('subOption')" :persistent-hint="!!fieldHint('subOption')"
                      variant="outlined" :rules="[v => !!v || '此項為必填']"
                      :disabled="isLoading || !formStep1.bookingMethod || !isBookingActive"></v-select>




                    <v-text-field v-if="formStep1.bookingMethod === '代驗公司'" v-model="formStep1.companyName"
                      :label="fieldLabel('companyName')"
                      :hint="fieldHint('companyName')" :persistent-hint="!!fieldHint('companyName')"
                      variant="outlined" :rules="[v => !!v || '請輸入代驗公司名稱']"
                      :disabled="isLoading || !isBookingActive"></v-text-field>


                    <!-- Dynamic Fields Renderer -->
                    <div v-if="currentDynamicFields.length > 0" class="mt-4 pa-4 border rounded bg-grey-lighten-5">
                      <p class="text-subtitle-1 font-weight-bold mb-3 text-primary">
                        <v-icon start size="small">mdi-pencil-box-outline</v-icon>
                        ({{ formStep1.bookingMethod }})
                      </p>
                      <DynamicFormRenderer :fields="currentDynamicFields" v-model="dynamicFormData" />

                    </div>


                    <!-- 屋主本人是否到場 (依據 askOwnerPresence 設定顯示) -->
                    <v-card v-if="showOwnerPresenceQuestion" variant="tonal" color="warning" class="mt-4 mb-2">
                      <v-card-text>
                        <div class="text-subtitle-1 font-weight-bold mb-2">請問本人是否到場?</div>
                        <v-radio-group v-model="formStep1.isOwnerPresent" inline hide-details>
                          <v-radio label="是 (本人到場)" :value="true" color="primary"></v-radio>
                          <v-radio label="否 (委託或授權)" :value="false" color="error"></v-radio>
                        </v-radio-group>
                      </v-card-text>
                    </v-card>

                  </v-form>
                </v-card-text>
                <div class="step-nav-actions step-nav-actions--single">
                  <v-btn class="step-next-btn" :disabled="!isBookingActive" size="x-large" variant="flat"
                    @click="handleStep1Submit" :loading="isLoading">
                    <v-icon class="step-next-icon" start>mdi-check-circle-outline</v-icon>
                    <span class="step-next-text">確認戶別，下一步</span>
                    <v-icon class="step-next-arrow" end>mdi-arrow-right</v-icon>
                  </v-btn>
                </div>
              </div>

              <div v-if="existingBookingInfoList.length > 0 && step === 1">
                <div v-for="(booking, index) in existingBookingInfoList" :key="booking.bookingCode">
                  <v-card-text>
                    <v-alert :type="index === 0 ? 'info' : 'warning'" variant="tonal" border="start" class="mb-4">
                      <h3 class="text-h6 mb-2">{{ index === 0 ? '您已完成預約' : `第 ${index + 1} 筆預約` }}</h3>
                      <p v-if="index === 0">我們查詢到您已有有效的預約紀錄，資訊如下，若您要修改預約時間請先取消預約。</p>
                    </v-alert>

                    <v-list lines="two" class="text-left" density="compact">

                      <v-list-item title="預約代碼" :subtitle="booking.bookingCode" prepend-icon="mdi-pound-box-outline">
                        <template v-slot:subtitle="{ subtitle }">
                          <span class="font-weight-bold text-h6 text-red-darken-2">{{ subtitle }}</span>
                        </template>
                      </v-list-item>

                      <v-list-item title="建案名稱" :subtitle="projectConfig?.name || '載入中...'" prepend-icon="mdi-domain">
                      </v-list-item>

                      <v-list-item title="戶別" :subtitle="booking.unitId"
                        prepend-icon="mdi-home-variant-outline"></v-list-item>
                      <v-list-item title="姓名" :subtitle="booking.bookerName"
                        prepend-icon="mdi-account-outline"></v-list-item>
                      <v-list-item title="電話" :subtitle="booking.bookerPhone"
                        prepend-icon="mdi-phone-outline"></v-list-item>
                      <v-list-item title="EMAIL" :subtitle="booking.bookerEmail"
                        prepend-icon="mdi-email-outline"></v-list-item>
                      <v-divider class="my-2"></v-divider>
                      <v-list-item title="預約項目" :subtitle="booking.bookingType"
                        prepend-icon="mdi-format-list-checks"></v-list-item>
                      <v-list-item title="選擇方式" :subtitle="booking.inspectionMethod"
                        prepend-icon="mdi-account-search-outline"></v-list-item>
                      <v-list-item v-if="booking.bookingSubOption" title="子選項" :subtitle="booking.bookingSubOption"
                        prepend-icon="mdi-arrow-right-bottom"></v-list-item>
                      <template
                        v-if="booking.bookingMethodDetailsDisplay && booking.bookingMethodDetailsDisplay.length > 0">
                        <v-list-item v-for="field in booking.bookingMethodDetailsDisplay" :key="field.label" title=""
                          :subtitle="field.value" prepend-icon="mdi-information-outline" density="compact">
                          <template v-slot:title>
                            <span class="text-caption text-grey">{{ field.label }}</span>
                          </template>
                          <template v-slot:subtitle="{ subtitle }">
                            <span class="text-body-2 font-weight-medium text-high-emphasis">{{ subtitle }}</span>
                          </template>
                        </v-list-item>
                      </template>
                      <v-list-item v-if="booking.inspectionCompanyName" title="代驗公司"
                        :subtitle="booking.inspectionCompanyName" prepend-icon="mdi-office-building"></v-list-item>
                      <v-list-item title="預約日期" :subtitle="formatDisplayDate(booking.appointmentDate)"
                        prepend-icon="mdi-calendar-check-outline"></v-list-item>
                      <v-list-item title="預約時段" :subtitle="booking.appointmentTimeSlot"
                        prepend-icon="mdi-clock-time-four-outline"></v-list-item>
                      <v-list-item title="預約狀態" :subtitle="booking.status" prepend-icon="mdi-list-status">
                        <template v-slot:subtitle="{ subtitle }">
                          <v-chip color="green" variant="flat" size="small">{{ subtitle }}</v-chip>
                        </template>
                      </v-list-item>
                    </v-list>
                  </v-card-text>
                  <v-card-actions class="pa-4 d-flex justify-end pt-0">
                    <v-btn color="error" size="small" variant="outlined"
                      @click="confirmCancelBookingByCode(booking.bookingCode)"
                      :loading="cancelingCode === booking.bookingCode" :disabled="!isBookingActive">取消此筆預約</v-btn>
                  </v-card-actions>
                  <v-card-text v-if="index < existingBookingInfoList.length - 1" class="pb-0 pt-0">
                    <v-divider></v-divider>
                  </v-card-text>
                </div>

                <v-card-actions class="pa-4 d-flex justify-end">
                  <v-btn class="mr-2" variant="text" size="large" @click="goBackToStep0">
                    返回首頁
                  </v-btn>
                  <v-btn v-if="selectedUnitAllowMultipleBookings" color="success" size="large" variant="elevated"
                    class="mr-2" @click="proceedToNextBooking" :loading="isLoading" :disabled="!isBookingActive">
                    繼續新增預約 (第 {{ existingBookingInfoList.length + 1 }} 筆)
                  </v-btn>
                </v-card-actions>
              </div>

              <div v-if="step === 2">
                <v-card-text>
                  <h3 class="text-h6 mb-4">步驟二：填寫您的聯絡資訊與預約時段</h3>
                  <v-form ref="step2Form" @submit.prevent="handleStep2Submit">
                    <v-text-field ref="step2NameField" :label="fieldLabel('name')" v-model="formStep2.姓名"
                      :hint="fieldHint('name')" :persistent-hint="!!fieldHint('name')"
                      :rules="[v => !!v || '必填']" variant="outlined"></v-text-field>
                    <v-text-field :label="fieldLabel('phone')" v-model="formStep2.電話"
                      :hint="fieldHint('phone')" :persistent-hint="!!fieldHint('phone')"
                      :rules="[v => !!v || '必填']" variant="outlined"></v-text-field>
                    <v-text-field ref="step2EmailField" :label="fieldLabel('email')" v-model="formStep2.EMAIL"
                      :hint="fieldHint('email')" :persistent-hint="!!fieldHint('email')"
                      :rules="[v => !!v || '必填', v => /.+@.+\..+/.test(v) || 'E-mail 格式不正確']"
                      variant="outlined"></v-text-field>

                    <!-- 日期選擇提醒事項 -->
                    <v-alert v-if="datePickerReminderContent" type="warning" variant="tonal" border="start" prominent
                      class="mt-4 mb-2 date-picker-reminder" icon="mdi-calendar-alert">
                      <template v-slot:title>
                        <div class="font-weight-bold">預約提醒事項</div>
                      </template>
                      <div class="prose reminder-content" v-html="datePickerReminderContent"></div>
                    </v-alert>

                    <!-- 無可預約日期：隱藏日期與時段選擇，直接顯示錯誤提示 -->
                    <template v-if="!hasAvailableDates">
                      <v-alert type="error" variant="flat" icon="mdi-calendar-remove-outline"
                        class="my-6 text-center" prominent border="start">
                        <div class="text-h6 font-weight-bold mb-1">無可預約日期</div>
                        <div>{{ noAvailableDatesMessage }}</div>
                      </v-alert>
                    </template>

                    <!-- 有可預約日期：正常顯示日期與時段選擇 -->
                    <template v-else>
                      <v-date-picker v-model="formStep2.預約日期" :min="bookingSlots.startDate" :max="bookingSlots.endDate"
                        :allowed-dates="isDateAllowed" @update:model-value="onDateChange"
                        :color="projectConfig.themeColor" width="100%" title="請選擇預約日期"></v-date-picker>

                      <!-- Owner Presence Question 已移至 Step 1 -->

                      <v-col cols="12">
                        <v-select label="預約時段" v-model="formStep2.預約時段" :items="availableTimeSlots"
                          :disabled="!formStep2.預約日期" :rules="[v => !!v || '必填']" variant="outlined" no-data-text="請先選擇日期"
                          class="mt-4" item-title="title" item-value="value">
                          <template v-slot:item="{ props, item }">
                            <v-list-item v-bind="props" :disabled="item.raw.title.includes('已額滿')"></v-list-item>
                          </template>
                        </v-select>
                      </v-col>
                    </template>
                    <template v-if="shouldShowAuthFlow">
                      <v-divider class="my-4"></v-divider>
                      <p class="mb-2 text-subtitle-1 font-weight-medium">
                        委託驗屋資訊
                      </p>

                      <!-- 已完成授權：顯示唯讀資訊 -->
                      <template v-if="isSigningInitiated">
                        <v-sheet border rounded class="pa-3 mb-3 bg-green-lighten-5">
                          <v-list density="compact" class="bg-transparent">
                            <v-list-item>
                              <template #prepend><v-icon color="green" size="small"
                                  class="mr-2">mdi-account</v-icon></template>
                              <v-list-item-title class="text-body-2"><strong>受託人：</strong>{{ authFormData.受託人姓名
                              }}</v-list-item-title>
                            </v-list-item>
                            <v-list-item>
                              <template #prepend><v-icon color="green" size="small"
                                  class="mr-2">mdi-phone</v-icon></template>
                              <v-list-item-title class="text-body-2"><strong>電話：</strong>{{ authFormData.受託人電話
                              }}</v-list-item-title>
                            </v-list-item>
                            <v-list-item>
                              <template #prepend><v-icon color="green" size="small"
                                  class="mr-2">mdi-account-group</v-icon></template>
                              <v-list-item-title class="text-body-2"><strong>與委託人關係：</strong>{{ authFormData.受託人關係 ===
                                '其他' ?
                                authFormData.受託人關係其他 : authFormData.受託人關係 }}</v-list-item-title>
                            </v-list-item>
                          </v-list>
                          <div class="d-flex align-center mt-2">
                            <v-icon color="green" size="small" class="mr-1">mdi-check-circle</v-icon>
                            <span class="text-caption text-green font-weight-medium">授權書已寄送簽署邀請</span>
                            <v-spacer></v-spacer>
                            <v-btn variant="text" size="x-small" color="orange" @click="resetAuthFlow">
                              <v-icon start size="small">mdi-refresh</v-icon>
                              重新授權
                            </v-btn>
                          </div>
                        </v-sheet>
                      </template>

                      <!-- 未完成授權：顯示按鈕 -->
                      <template v-else>
                        <div class="d-flex flex-column mb-4">
                          <v-btn :color="projectConfig.themeColor" @click="openAuthDialog" block variant="tonal"
                            size="large" :disabled="isLoading">
                            <v-icon left>mdi-draw</v-icon>
                            按此處「驗屋授權書(線上授權)」
                          </v-btn>

                          <div class="text-red text-caption mt-1 animate-pulse"
                            style="font-weight: 500; letter-spacing: 0.5px;">
                            <v-icon size="14" color="red" class="mr-1">mdi-alert-circle-outline</v-icon>
                            需要完成授權書填寫才可進行下一步
                          </div>
                        </div>
                      </template>
                      <v-divider class="my-4"></v-divider>
                    </template>
                  </v-form>
                </v-card-text>
                <div class="step-nav-actions">
                  <v-btn class="step-back-btn" size="large" variant="outlined"
                    @click="step = 1" :disabled="isLoading">
                    <v-icon start>mdi-arrow-left</v-icon>
                    返回上一步
                  </v-btn>
                  <v-btn class="step-next-btn" size="x-large" variant="flat"
                    @click="handleStep2Submit" :loading="isLoading"
                    :disabled="isLoading || (shouldShowAuthFlow && !isSigningInitiated)">
                    <v-icon class="step-next-icon" start>mdi-check-circle-outline</v-icon>
                    <span class="step-next-text">確認預約資訊</span>
                    <v-icon class="step-next-arrow" end>mdi-arrow-right</v-icon>
                  </v-btn>
                </div>
              </div>

              <div v-if="step === 3" class="confirm-step">
                <v-card-text class="confirm-content pa-0">
                  <!-- 標題列：漸層 + 圖示 -->
                  <div class="confirm-header">
                    <div class="confirm-header-bg"></div>
                    <div class="confirm-header-content">
                      <div class="confirm-header-icon">
                        <v-icon size="34" color="white">mdi-clipboard-check-multiple-outline</v-icon>
                      </div>
                      <div class="confirm-header-text">
                        <div class="confirm-header-title">請確認您的預約資訊</div>
                        <div class="confirm-header-subtitle">
                          <v-icon size="14" class="mr-1">mdi-information-outline</v-icon>
                          資料確認無誤後，請點擊下方「送出預約」
                        </div>
                      </div>
                    </div>
                  </div>

                  <div class="confirm-body">
                    <!-- 倒數計時提醒 (置於頂部更明顯) -->
                    <transition name="fade-slide">
                      <div v-if="isTimeoutActive" class="confirm-timer-banner">
                        <div class="confirm-timer-icon">
                          <v-icon size="22" color="white">mdi-timer-sand-complete</v-icon>
                        </div>
                        <div class="confirm-timer-text">
                          <div class="confirm-timer-title">請於時限內完成送出</div>
                          <div class="confirm-timer-hint">逾時將需要重新操作</div>
                        </div>
                        <div class="confirm-timer-clock">
                          <div class="confirm-timer-label">剩餘</div>
                          <div class="confirm-timer-value">
                            {{ Math.floor(remainingSeconds / 60) }}:{{ String(remainingSeconds % 60).padStart(2, '0') }}
                          </div>
                        </div>
                      </div>
                    </transition>

                    <!-- 預約時間 (featured) -->
                    <div class="confirm-section confirm-section--featured">
                      <div class="confirm-section-title">
                        <v-icon size="20" class="mr-2" color="#6c5ce7">mdi-calendar-clock</v-icon>
                        預約時間
                      </div>
                      <div class="confirm-time-grid">
                        <div class="confirm-time-card">
                          <v-icon size="22" color="#6c5ce7" class="mb-1">mdi-calendar-check-outline</v-icon>
                          <div class="confirm-time-label">預約日期</div>
                          <div class="confirm-time-value">{{ finalBookingData.預約日期 }}</div>
                        </div>
                        <div class="confirm-time-card">
                          <v-icon size="22" color="#6c5ce7" class="mb-1">mdi-clock-time-four-outline</v-icon>
                          <div class="confirm-time-label">預約時段</div>
                          <div class="confirm-time-value">{{ finalBookingData.預約時段 }}</div>
                        </div>
                      </div>
                    </div>

                    <!-- 戶別資訊 -->
                    <div class="confirm-section">
                      <div class="confirm-section-title">
                        <v-icon size="20" class="mr-2" color="#1a73e8">mdi-home-city-outline</v-icon>
                        戶別資訊
                      </div>
                      <div class="confirm-section-body">
                        <div class="confirm-item">
                          <div class="confirm-item-label">建案名稱</div>
                          <div class="confirm-item-value">{{ projectConfig.name }}</div>
                        </div>
                        <div class="confirm-item">
                          <div class="confirm-item-label">戶別</div>
                          <div class="confirm-item-value confirm-item-value--highlight">{{ finalBookingData.戶別 }}</div>
                        </div>
                        <div class="confirm-item">
                          <div class="confirm-item-label">門牌</div>
                          <div class="confirm-item-value">{{ finalBookingData.address }}</div>
                        </div>
                      </div>
                    </div>

                    <!-- 預約人資訊 -->
                    <div class="confirm-section">
                      <div class="confirm-section-title">
                        <v-icon size="20" class="mr-2" color="#1a73e8">mdi-account-circle-outline</v-icon>
                        預約人資訊
                      </div>
                      <div class="confirm-section-body">
                        <div class="confirm-item">
                          <div class="confirm-item-label">姓名</div>
                          <div class="confirm-item-value">{{ finalBookingData.姓名 }}</div>
                        </div>
                        <div class="confirm-item">
                          <div class="confirm-item-label">電話</div>
                          <div class="confirm-item-value">{{ finalBookingData.電話 }}</div>
                        </div>
                        <div class="confirm-item">
                          <div class="confirm-item-label">EMAIL</div>
                          <div class="confirm-item-value confirm-item-value--email">{{ finalBookingData.EMAIL }}</div>
                        </div>
                      </div>
                    </div>

                    <!-- 受託人資訊 -->
                    <div v-if="shouldShowAuthFlow" class="confirm-section confirm-section--accent">
                      <div class="confirm-section-title">
                        <v-icon size="20" class="mr-2" color="#a855f7">mdi-account-arrow-right-outline</v-icon>
                        受託人資訊
                      </div>
                      <div class="confirm-section-body">
                        <div class="confirm-item">
                          <div class="confirm-item-label">受託人姓名</div>
                          <div class="confirm-item-value">{{ finalBookingData.受託人姓名 }}</div>
                        </div>
                        <div class="confirm-item">
                          <div class="confirm-item-label">受託人電話</div>
                          <div class="confirm-item-value">{{ finalBookingData.受託人電話 }}</div>
                        </div>
                        <div class="confirm-item">
                          <div class="confirm-item-label">與委託人關係</div>
                          <div class="confirm-item-value">{{ finalBookingData.受託人關係 }}</div>
                        </div>
                      </div>
                    </div>

                    <!-- 預約服務 -->
                    <div class="confirm-section">
                      <div class="confirm-section-title">
                        <v-icon size="20" class="mr-2" color="#1a73e8">mdi-format-list-checks</v-icon>
                        預約服務
                      </div>
                      <div class="confirm-section-body">
                        <div class="confirm-item">
                          <div class="confirm-item-label">預約項目</div>
                          <div class="confirm-item-value confirm-item-value--highlight">{{ finalBookingData.bookingType }}</div>
                        </div>
                        <div class="confirm-item">
                          <div class="confirm-item-label">選擇方式</div>
                          <div class="confirm-item-value">{{ finalBookingData.bookingMethod }}</div>
                        </div>
                        <div v-if="finalBookingData.subOption" class="confirm-item">
                          <div class="confirm-item-label">子選項</div>
                          <div class="confirm-item-value">{{ finalBookingData.subOption }}</div>
                        </div>
                        <div v-if="finalBookingData.companyName" class="confirm-item">
                          <div class="confirm-item-label">代驗公司</div>
                          <div class="confirm-item-value">{{ finalBookingData.companyName }}</div>
                        </div>
                        <template v-if="displayDynamicFields && displayDynamicFields.length > 0">
                          <div v-for="field in displayDynamicFields" :key="field.label" class="confirm-item">
                            <div class="confirm-item-label">{{ field.label }}</div>
                            <div class="confirm-item-value">{{ field.value }}</div>
                          </div>
                        </template>
                      </div>
                    </div>
                  </div>
                </v-card-text>

                <!-- 動作區 -->
                <div class="confirm-actions">
                  <v-btn class="confirm-back-btn" size="large" variant="outlined"
                    @click="handleGoBackAndRefresh" :disabled="isLoading">
                    <v-icon start>mdi-arrow-left</v-icon>
                    返回修改
                  </v-btn>
                  <v-btn class="confirm-submit-btn" size="x-large" variant="flat"
                    @click="submitBooking" :loading="isLoading">
                    <v-icon class="confirm-submit-check" start>mdi-check-decagram</v-icon>
                    <span class="confirm-submit-text">送出預約</span>
                    <v-icon class="confirm-submit-arrow" end>mdi-send</v-icon>
                  </v-btn>
                </div>
              </div>

              <div v-if="step === 4" class="success-step">
                <v-card-text class="success-content pa-0" ref="bookingResultCard">
                  <!-- 慶祝標題列 -->
                  <div class="success-header">
                    <div class="success-header-bg"></div>
                    <div class="success-confetti">
                      <span v-for="n in 12" :key="n" :style="{ '--i': n }"></span>
                    </div>
                    <div class="success-header-content">
                      <div class="success-check-wrap">
                        <div class="success-check-ring"></div>
                        <div class="success-check-circle">
                          <v-icon size="48" color="white">mdi-check-bold</v-icon>
                        </div>
                      </div>
                      <h2 class="success-title">預約成功！</h2>
                      <p class="success-subtitle">
                        <v-icon size="16" class="mr-1">mdi-email-check-outline</v-icon>
                        相關資訊已寄送至您的電子信箱
                      </p>
                    </div>
                  </div>

                  <div class="success-body">
                    <!-- 預約代碼 (Hero 級資訊：給現場人員確認用) -->
                    <div class="success-code-card">
                      <div class="success-code-label">
                        <v-icon size="16" class="mr-1">mdi-shield-check-outline</v-icon>
                        您的預約代碼
                      </div>
                      <div class="success-code-value">{{ savedBookingCode }}</div>
                      
                    </div>

                    <!-- 預約時間 (featured) -->
                    <div class="confirm-section confirm-section--featured">
                      <div class="confirm-section-title">
                        <v-icon size="20" class="mr-2" color="#6c5ce7">mdi-calendar-clock</v-icon>
                        預約時間
                      </div>
                      <div class="confirm-time-grid">
                        <div class="confirm-time-card">
                          <v-icon size="22" color="#6c5ce7" class="mb-1">mdi-calendar-check-outline</v-icon>
                          <div class="confirm-time-label">預約日期</div>
                          <div class="confirm-time-value">{{ finalBookingData.預約日期 }}</div>
                        </div>
                        <div class="confirm-time-card">
                          <v-icon size="22" color="#6c5ce7" class="mb-1">mdi-clock-time-four-outline</v-icon>
                          <div class="confirm-time-label">預約時段</div>
                          <div class="confirm-time-value">{{ finalBookingData.預約時段 }}</div>
                        </div>
                      </div>
                    </div>

                    <!-- 戶別資訊 -->
                    <div class="confirm-section">
                      <div class="confirm-section-title">
                        <v-icon size="20" class="mr-2" color="#1a73e8">mdi-home-city-outline</v-icon>
                        戶別資訊
                      </div>
                      <div class="confirm-section-body">
                        <div class="confirm-item">
                          <div class="confirm-item-label">建案名稱</div>
                          <div class="confirm-item-value">{{ projectConfig?.name || '載入中...' }}</div>
                        </div>
                        <div class="confirm-item">
                          <div class="confirm-item-label">戶別</div>
                          <div class="confirm-item-value confirm-item-value--highlight">{{ finalBookingData.戶別 }}</div>
                        </div>
                        <div class="confirm-item">
                          <div class="confirm-item-label">門牌</div>
                          <div class="confirm-item-value">{{ finalBookingData.address }}</div>
                        </div>
                      </div>
                    </div>

                    <!-- 預約人資訊 -->
                    <div class="confirm-section">
                      <div class="confirm-section-title">
                        <v-icon size="20" class="mr-2" color="#1a73e8">mdi-account-circle-outline</v-icon>
                        預約人資訊
                      </div>
                      <div class="confirm-section-body">
                        <div class="confirm-item">
                          <div class="confirm-item-label">姓名</div>
                          <div class="confirm-item-value">{{ finalBookingData.姓名 }}</div>
                        </div>
                        <div class="confirm-item">
                          <div class="confirm-item-label">電話</div>
                          <div class="confirm-item-value">{{ finalBookingData.電話 }}</div>
                        </div>
                        <div class="confirm-item">
                          <div class="confirm-item-label">EMAIL</div>
                          <div class="confirm-item-value confirm-item-value--email">{{ finalBookingData.EMAIL }}</div>
                        </div>
                      </div>
                    </div>

                    <!-- 受託人資訊 -->
                    <div v-if="shouldShowAuthFlow" class="confirm-section confirm-section--accent">
                      <div class="confirm-section-title">
                        <v-icon size="20" class="mr-2" color="#a855f7">mdi-account-arrow-right-outline</v-icon>
                        受託人資訊
                      </div>
                      <div class="confirm-section-body">
                        <div class="confirm-item">
                          <div class="confirm-item-label">受託人姓名</div>
                          <div class="confirm-item-value">{{ finalBookingData.受託人姓名 }}</div>
                        </div>
                        <div class="confirm-item">
                          <div class="confirm-item-label">受託人電話</div>
                          <div class="confirm-item-value">{{ finalBookingData.受託人電話 }}</div>
                        </div>
                        <div class="confirm-item">
                          <div class="confirm-item-label">與委託人關係</div>
                          <div class="confirm-item-value">{{ finalBookingData.受託人關係 }}</div>
                        </div>
                      </div>
                    </div>

                    <!-- 預約服務 -->
                    <div class="confirm-section">
                      <div class="confirm-section-title">
                        <v-icon size="20" class="mr-2" color="#1a73e8">mdi-format-list-checks</v-icon>
                        預約服務
                      </div>
                      <div class="confirm-section-body">
                        <div class="confirm-item">
                          <div class="confirm-item-label">預約項目</div>
                          <div class="confirm-item-value confirm-item-value--highlight">{{ finalBookingData.bookingType }}</div>
                        </div>
                        <div class="confirm-item">
                          <div class="confirm-item-label">選擇方式</div>
                          <div class="confirm-item-value">{{ finalBookingData.bookingMethod }}</div>
                        </div>
                        <div v-if="finalBookingData.subOption" class="confirm-item">
                          <div class="confirm-item-label">子選項</div>
                          <div class="confirm-item-value">{{ finalBookingData.subOption }}</div>
                        </div>
                        <div v-if="finalBookingData.companyName" class="confirm-item">
                          <div class="confirm-item-label">代驗公司</div>
                          <div class="confirm-item-value">{{ finalBookingData.companyName }}</div>
                        </div>
                        <template v-if="displayDynamicFields && displayDynamicFields.length > 0">
                          <div v-for="field in displayDynamicFields" :key="field.label" class="confirm-item">
                            <div class="confirm-item-label">{{ field.label }}</div>
                            <div class="confirm-item-value">{{ field.value }}</div>
                          </div>
                        </template>
                      </div>
                    </div>

                    <!-- 重要提醒 (動態 HTML 內容) -->
                    <div v-if="dynamicClosingText" class="success-notice">
                      <div class="success-notice-title">
                        <v-icon size="20" class="mr-2" color="#f59e0b">mdi-alert-circle-outline</v-icon>
                        重要提醒
                      </div>
                      <div class="prose success-notice-body" v-html="dynamicClosingText"></div>
                    </div>
                  </div>
                </v-card-text>

                <!-- 動作區 -->
                <div class="success-actions">
                  <v-btn class="success-primary-btn" size="x-large" variant="flat"
                    block @click="goBackToStep0">
                    <v-icon class="success-primary-icon" start>mdi-home</v-icon>
                    <span class="success-primary-text">返回首頁</span>
                  </v-btn>
                  <div class="success-secondary-row">
                    <v-btn class="success-secondary-btn" size="large" variant="outlined" block @click="captureAndSave">
                      <v-icon start>mdi-camera</v-icon>
                      截圖
                    </v-btn>
                    <v-btn class="success-secondary-btn" size="large" variant="outlined" block @click="addToCalendar">
                      <v-icon start>mdi-calendar-plus</v-icon>
                      加入行事曆
                    </v-btn>
                  </div>
                </div>
              </div>
            </div>
          </template>
        </v-card>


      </v-col>
    </v-row>

    <v-dialog v-model="isAuthDialogVisible" persistent max-width="800px">
      <v-card>
        <v-card-title class="text-h5">驗屋授權書內容填寫</v-card-title>
        <v-card-text>
          <v-alert type="info" variant="tonal" border="start" density="compact" class="mb-4">
            <template v-slot:title>
              <div class="font-weight-bold">授權範圍</div>
            </template>
            <div>
              受託人得代理委託人全權處理上述房地產之驗屋、點交相關作業，並有權簽署相關文件。此授權書效力等同委託人親自辦理。
            </div>
          </v-alert>
          <v-form ref="authForm">
            <v-row>
              <v-col cols="12" md="6">
                <p class="text-subtitle-1 font-weight-bold mb-2">委託人資訊 (屋主)</p>
                <v-text-field v-model="authFormData.委託人姓名" label="委託人姓名" :rules="[v => !!v || '必填']" variant="outlined"
                  density="compact"></v-text-field>
                <v-text-field v-model="authFormData.委託人電話" label="委託人電話" :rules="[v => !!v || '必填']" variant="outlined"
                  density="compact"></v-text-field>
                <v-text-field v-model="authFormData.委託人身分證" label="委託人身分證" :rules="[v => !!v || '必填']"
                  variant="outlined" density="compact"></v-text-field>
                <v-text-field v-model="authFormData.委託人戶籍地" label="委託人戶籍地" :rules="[v => !!v || '必填']"
                  variant="outlined" density="compact"></v-text-field>
              </v-col>
              <v-col cols="12" md="6">
                <p class="text-subtitle-1 font-weight-bold mb-2">受託人資訊</p>
                <v-text-field v-model="authFormData.受託人姓名" label="受託人姓名" :rules="[v => !!v || '必填']" variant="outlined"
                  density="compact"></v-text-field>
                <v-text-field v-model="authFormData.受託人Email" label="受託人 Email (用於接收簽署信)"
                  :rules="[v => !!v || '必填', v => /.+@.+\..+/.test(v) || 'E-mail 格式不正確']" variant="outlined"
                  density="compact"></v-text-field>
                <v-text-field v-model="authFormData.受託人身分證" label="受託人身分證" :rules="[v => !!v || '必填']"
                  variant="outlined" density="compact"></v-text-field>
                <v-text-field v-model="authFormData.受託人戶籍地" label="受託人戶籍地" :rules="[v => !!v || '必填']"
                  variant="outlined" density="compact"></v-text-field>
                <v-text-field v-model="authFormData.受託人電話" label="受託人電話" :rules="[v => !!v || '必填']" variant="outlined"
                  density="compact"></v-text-field>
                <v-select v-model="authFormData.受託人關係" :items="['配偶', '父母', '子女', '兄弟姊妹', '其他']" label="與委託人的關係"
                  :rules="[v => !!v || '必填']" variant="outlined" density="compact"></v-select>
                <v-text-field v-if="authFormData.受託人關係 === '其他'" v-model="authFormData.受託人關係其他" label="請輸入關係"
                  :rules="[v => !!v || '必填']" variant="outlined" density="compact"></v-text-field>
              </v-col>
            </v-row>
            <v-row>
              <v-col cols="12">
                <v-card variant="outlined">
                  <div class="d-flex justify-space-between align-center pa-4 pb-0">
                    <v-card-title class="text-subtitle-1 pa-0">委託人(屋主)簽名</v-card-title>
                    <v-btn variant="tonal" size="small" @click="clearDelegatorSignature">
                      <v-icon start>mdi-eraser</v-icon>
                      清除
                    </v-btn>
                  </div>
                  <v-card-text
                    style="touch-action: none; user-select: none; -webkit-user-select: none; -webkit-touch-callout: none;">
                    <VueSignaturePad ref="delegatorSignaturePad" width="100%" height="200px"
                      :options="{ penColor: '#000' }"></VueSignaturePad>
                  </v-card-text>

                </v-card>
                <p class="text-caption text-grey text-center mt-1">完成簽名表示同意授權內容</p>
              </v-col>
            </v-row>
          </v-form>
        </v-card-text>
        <v-card-actions class="pa-4">
          <v-spacer></v-spacer>
          <v-btn color="grey" @click="closeAuthDialog">關閉</v-btn>
          <v-btn color="success" @click="handleInitiateSigning" variant="elevated"
            :loading="isLoading">寄送簽署邀請給受託人</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <div ref="authLetterRenderRef"
      style="position: absolute; left: -9999px; top: -9999px; width: 794px; background-color: white;"></div>


    <v-dialog v-model="isPreviewDialogVisible" max-width="820px">
      <v-card>
        <v-card-title>授權書預覽</v-card-title>
        <v-card-text class="text-center">
          <img :src="generatedAuthLetterUrl" alt="授權書預覽" style="max-width: 100%; border: 1px solid #ccc;" />
        </v-card-text>
        <v-card-actions class="pa-4">
          <v-spacer></v-spacer>
          <v-btn color="grey" @click="isPreviewDialogVisible = false">關閉預覽</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- 附件預覽 Dialog -->
    <v-dialog v-model="isAttachmentPreviewVisible"
      :max-width="isMobile ? undefined : '900px'"
      :height="isMobile ? undefined : '90vh'"
      :fullscreen="isMobile"
      class="attachment-preview-dialog">
      <v-card class="h-100 d-flex flex-column attachment-preview-card">
        <v-card-title class="attachment-preview-toolbar">
          <span class="attachment-preview-name">{{ currentPreviewAttachment?.name }}</span>
          <v-spacer></v-spacer>
          <!-- 圖片縮放工具 -->
          <template v-if="isImagePreview">
            <v-btn icon="mdi-magnify-minus-outline" variant="text" size="small" density="comfortable"
              :disabled="previewZoom <= 0.5" @click="zoomOutPreview"></v-btn>
            <span class="preview-zoom-text">{{ Math.round(previewZoom * 100) }}%</span>
            <v-btn icon="mdi-magnify-plus-outline" variant="text" size="small" density="comfortable"
              :disabled="previewZoom >= 5" @click="zoomInPreview"></v-btn>
            <v-btn icon="mdi-fit-to-page-outline" variant="text" size="small" density="comfortable"
              title="符合畫面" @click="resetPreviewZoom"></v-btn>
            <v-divider vertical class="mx-1"></v-divider>
          </template>
          <!-- PDF 外部開啟（行動裝置或 iframe 無法載入時的備援） -->
          <v-btn v-if="isPdfPreview" icon="mdi-open-in-new" variant="text" size="small" density="comfortable"
            title="在新分頁開啟" :href="currentPreviewAttachment?.url" target="_blank" rel="noopener"></v-btn>
          <v-btn icon="mdi-download" variant="text" color="primary" size="small" density="comfortable"
            @click="downloadAttachment(currentPreviewAttachment)"></v-btn>
          <v-btn icon="mdi-close" variant="text" size="small" density="comfortable"
            @click="isAttachmentPreviewVisible = false"></v-btn>
        </v-card-title>
        <v-divider></v-divider>
        <v-card-text class="flex-grow-1 pa-0 attachment-preview-content">
          <!-- PDF 預覽 -->
          <iframe v-if="isPdfPreview"
            :src="currentPreviewAttachment?.url" type="application/pdf"
            class="attachment-iframe"></iframe>

          <!-- 圖片預覽（含縮放/拖移） -->
          <div v-else-if="isImagePreview"
            class="image-zoom-container"
            :class="{ 'is-zoomed': previewZoom > 1, 'is-panning': isPanningPreview }"
            @wheel="onPreviewWheel"
            @mousedown="onPreviewMouseDown"
            @mousemove="onPreviewMouseMove"
            @mouseup="onPreviewMouseUp"
            @mouseleave="onPreviewMouseUp"
            @touchstart="onPreviewTouchStart"
            @touchmove="onPreviewTouchMove"
            @touchend="onPreviewTouchEnd"
            @touchcancel="onPreviewTouchEnd"
            @dblclick="onPreviewDoubleClick">
            <img :src="currentPreviewAttachment.url"
              class="image-zoom-img"
              :style="previewImageStyle"
              draggable="false"
              @dragstart.prevent />
          </div>

          <div v-else class="d-flex justify-center align-center h-100 text-grey">無法預覽此檔案</div>
        </v-card-text>
      </v-card>
    </v-dialog>

    <v-dialog v-model="isSizeErrorDialogVisible" max-width="500px" persistent>
      <v-card>
        <v-card-title class="d-flex align-center bg-error">
          <v-icon class="mr-3">mdi-alert-circle-outline</v-icon>
          <span class="text-h5">檔案過大</span>
        </v-card-title>
        <v-card-text class="pt-4 text-body-1">
          您上傳的檔案大小已超過 30MB 的限制，請先進行壓縮後再重新上傳。
          <br><br>
          我們推薦使用以下免費的線上工具來壓縮您的 PDF 檔案：
          <div class="my-4 text-center">
            <v-btn color="primary" href="https://www.ilovepdf.com/zh-tw/compress_pdf" target="_blank"
              rel="noopener noreferrer" prepend-icon="mdi-open-in-new">
              前往 iLovePDF 進行壓縮
            </v-btn>
          </div>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="grey-darken-1" variant="text" @click="isSizeErrorDialogVisible = false">
            關閉
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="isUploadErrorDialogVisible" max-width="500px" persistent>
      <v-card>
        <v-card-title class="d-flex align-center bg-warning">
          <v-icon class="mr-3">mdi-alert-outline</v-icon>
          <span class="text-h5">無法上傳</span>
        </v-card-title>
        <v-card-text class="pt-4 text-body-1" v-html="uploadErrorDialogMessage">
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="grey-darken-1" variant="text" @click="isUploadErrorDialogVisible = false">
            關閉
          </v-btn>
        </v-card-actions>
      </v-card>


    </v-dialog>

    <div class="text-caption text-grey text-center mt-4 d-flex align-center justify-center">
      <span>Powered by&nbsp;</span>
      <v-chip class="ml-1" href="https://anxismart.com/" target="_blank" rel="noopener noreferrer" color="blue-grey"
        variant="tonal" size="small" pill>
        <v-icon start size="x-small">mdi-rocket-launch-outline</v-icon>
        anxismart安熙智慧建案管理系統
      </v-chip>
    </div>


    <!-- 預約詳情確認對話框 -->
    <v-dialog v-model="isConfirmationDialogVisible" max-width="600px" persistent>
      <v-card>
        <v-card-title class="d-flex align-center bg-blue-grey-lighten-5">
          <v-icon class="mr-3" color="info">mdi-clipboard-check-outline</v-icon>
          <span class="text-h6">
            {{ appointmentDetails ? '請確認預約詳情' : '請確認' }}
          </span>
        </v-card-title>

        <!-- 顯示預約詳情（如果有） -->
        <v-card-text v-if="appointmentDetails" class="pt-6">
          <v-alert type="info" variant="tonal" class="mb-6">
            <span class="font-weight-bold">系統已找到您的預約紀錄，請確認以下資訊無誤後再開始上傳報告：</span>
          </v-alert>

          <div class="appointment-details">
            <v-divider class="mb-4"></v-divider>
            <div class="detail-row">
              <span class="detail-label">預約項目：</span>
              <span class="detail-value font-weight-bold">{{ appointmentDetails.bookingType }}</span>
            </div>
            <v-divider class="my-3"></v-divider>

            <div class="detail-row">
              <span class="detail-label">選擇方式：</span>
              <span class="detail-value">{{ appointmentDetails.inspectionMethod }}</span>
            </div>
            <v-divider class="my-3"></v-divider>

            <div class="detail-row">
              <span class="detail-label">代驗公司：</span>
              <span class="detail-value">{{ appointmentDetails.inspectionCompanyName || '(未提供)' }}</span>
            </div>
            <v-divider class="my-3"></v-divider>

            <div class="detail-row">
              <span class="detail-label">預約日期：</span>
              <span class="detail-value">{{ appointmentDetails.appointmentDate }}</span>
            </div>
            <v-divider class="my-3"></v-divider>

            <div class="detail-row">
              <span class="detail-label">預約人姓名：</span>
              <span class="detail-value">{{ appointmentDetails.bookerName }}</span>
            </div>
            <v-divider class="my-3"></v-divider>

            <div class="detail-row">
              <span class="detail-label">預約人郵箱：</span>
              <span class="detail-value text-truncate" :title="appointmentDetails.bookerEmail">
                {{ appointmentDetails.bookerEmail }}
              </span>
            </div>
            <v-divider class="mt-4"></v-divider>
          </div>
        </v-card-text>

        <!-- 顯示通用確認訊息（如果沒有預約詳情） -->
        <v-card-text v-else class="pt-4 text-body-1" v-html="confirmationMessage">
        </v-card-text>

        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="grey-darken-1" variant="text" @click="isConfirmationDialogVisible = false">
            取消
          </v-btn>
          <v-btn
            color="primary"
            variant="elevated"
            @click="proceedWithUpload"
            :prepend-icon="appointmentDetails ? 'mdi-check' : undefined"
          >
            {{ appointmentDetails ? '確認無誤，繼續上傳' : '是，繼續上傳' }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="isTimeoutDialogVisible" max-width="400px" persistent>
      <v-card>
        <v-card-title class="text-h5 text-center bg-warning">
          <v-icon start>mdi-alert-circle-outline</v-icon>
          操作逾時
        </v-card-title>
        <v-card-text class="pt-4 text-center">
          您停留在確認頁面已超過 5 分鐘，為確保預約資料的有效性，請重新操作。
        </v-card-text>
        <v-card-actions class="justify-center pa-4">
          <v-btn color="primary" variant="elevated" @click="handleTimeoutDialogClose">
            重新預約
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- 表單驗證失敗提示 Snackbar -->
    <v-snackbar v-model="validationSnackbar.show" :timeout="4000" color="error" location="top" variant="elevated"
      class="validation-snackbar">
      <div class="d-flex align-center">
        <v-icon class="mr-2">mdi-alert-circle-outline</v-icon>
        <span class="font-weight-bold">{{ validationSnackbar.message }}</span>
      </div>
      <template v-slot:actions>
        <v-btn variant="text" @click="validationSnackbar.show = false">關閉</v-btn>
      </template>
    </v-snackbar>

  </v-container>
</template>

<script setup>
import { ref, onMounted, computed, nextTick, watch, onUnmounted } from 'vue'; // <--- 在這裡加入 onUnmounted
import { useRoute, useRouter } from 'vue-router';
import { useProjectStore } from '@/store/projectStore';
import {
  // fetchProjectConfig, // <--- 不再需要
  // getBookingInitialData, // <--- 不再需要
  // fetchAllUnitsForBooking, // <--- 不再需要
  // fetchAllUnitsForUpload, // <--- 不再需要
  // fetchBuildingListForUpload, // <--- 不再需要
  checkExistingBooking,
  validateId,
  getBookingSlots,
  saveBooking,
  uploadAuthLetter,
  cancelBooking,
  verifyUploadPrerequisites,
  uploadReportDirectlyToDrive,
  initiateAuthSigningProcess,
  initiateBookingConfirmation
} from '@/api';
import { useDate, useDisplay } from 'vuetify';
import html2canvas from 'html2canvas';
import { VueSignaturePad } from 'vue-signature-pad';

// --- Customer Message Imports ---
import { functions, storage } from '@/firebase';
import { httpsCallable } from 'firebase/functions';
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import DynamicFormRenderer from '@/components/DynamicFormRenderer.vue'; // Import DynamicFormRenderer
import { resolveFieldLabel, resolveFieldHint } from '@/utils/bookingFieldLabels';



const loadingText = ref('處理中...');

// [新增] 用於即時比對時間的變數
const currentTime = ref(new Date());
let timerInterval = null;

// [修改] 輔助函式：強力解析各種格式的日期
const parseDateValue = (val) => {
  if (!val) return null;

  // 情況 A: Cloud Function 序列化物件 (帶底線 _seconds) <--- 這是您目前缺少的關鍵
  if (typeof val === 'object' && typeof val._seconds === 'number') {
    return new Date(val._seconds * 1000);
  }

  // 情況 B: 標準 Firestore Timestamp (帶 seconds)
  if (typeof val === 'object' && typeof val.seconds === 'number') {
    return new Date(val.seconds * 1000);
  }

  // 情況 C: Firestore Client SDK 物件 (有 toDate 方法)
  if (val.toDate && typeof val.toDate === 'function') {
    return val.toDate();
  }

  // 情況 D: 字串或 Date 物件
  const d = new Date(val);
  return isNaN(d.getTime()) ? null : d;
};

// [修改] 計算目前的系統預約狀態
const systemStatus = computed(() => {
  // 載入中
  if (!projectConfig.value) return { code: 'LOADING', message: '載入中...' };

  // 1. 檢查手動總開關
  if (projectConfig.value.isPublished === false) {
    // 注意：如果是被後端排程關閉的，後端可能已經把 isPublished 改為 false 了
    // 這裡我們直接顯示關閉即可
    return { code: 'CLOSED_MANUALLY', message: '此建案的預約功能目前已關閉。', color: 'error', icon: 'mdi-close-circle' };
  }

  // 2. 前端再次檢查排程 (為了即時倒數顯示)
  if (projectConfig.value.enableScheduledPublish) {
    const start = parseDateValue(projectConfig.value.publishStartTime);
    const end = parseDateValue(projectConfig.value.publishEndTime);
    const nowTime = currentTime.value.getTime(); // 取得當前毫秒數

    // 除錯用：您可以在 Console 看到實際比對的時間
    // console.log('Now:', new Date(nowTime), 'Start:', start, 'End:', end);

    // 檢查是否尚未開始
    if (start && nowTime < start.getTime()) {
      const startStr = start.toLocaleString('zh-TW', { hour12: false });
      return {
        code: 'NOT_STARTED',
        message: `預約尚未開放，系統將於 ${startStr} 開啟。`,
        color: 'info',
        icon: 'mdi-clock-start'
      };
    }

    // 檢查是否已截止
    if (end && nowTime > end.getTime()) {
      const endStr = end.toLocaleString('zh-TW', { hour12: false });
      return {
        code: 'ENDED',
        message: `預約已於 ${endStr} 截止。`,
        color: 'warning',
        icon: 'mdi-clock-end'
      };
    }
  }

  // 3. 通過所有檢查 -> 開放中
  return { code: 'OPEN', message: '', color: 'success' };
});

// ---  新增: 上傳報告相關 state ---
const isUploadMode = ref(false);
const isDragActive = ref(false);
const uploadSuccess = ref(false);
const uploadStep2FormRef = ref(null); // 原本是 uploadFormRef
const fileInputRef = ref(null);
const uploadUnitList = ref([]);
const isSizeErrorDialogVisible = ref(false);
const isUploadErrorDialogVisible = ref(false);
const uploadErrorDialogMessage = ref('');

const router = useRouter();
const goHome = () => {
  router.push('/');
};
const initialUploadFormState = {
  reportType: null,
  buyerName: '',
  phone: '',
  email: '',
  building: null,
  unit: null,
  companyName: '',
  file: null,
  idNumber: '',
};
const uploadForm = ref({ ...initialUploadFormState });

// ✓ START: 新增 - 報告上傳新流程所需的狀態變數
const uploadStep = ref(1); // 控制目前在步驟一還是步驟二
const verifiedBookingCode = ref(null); // 用於儲存從步驟一驗證成功後取得的 bookingCode
const isConfirmationDialogVisible = ref(false); // 控制確認對話框的顯示
const confirmationMessage = ref(''); // 確認對話框要顯示的訊息
const appointmentDetails = ref(null); // 預約詳情（用於驗證成功時顯示）
const uploadStep1FormRef = ref(null); // 給步驟一的 v-form 一個 ref
// ✓ END: 新增

// ✓ START: 新增 - 處理上傳流程步驟一的送出邏輯
const handleUploadStep1Submit = async () => {
  const { valid } = await uploadStep1FormRef.value.validate();
  if (!valid) return;

  loadingText.value = '正在驗證上傳資格...';
  isLoading.value = true;
  try {
    const payload = {
      projectId: projectId.value,
      unitId: uploadForm.value.unit,
      reportType: uploadForm.value.reportType,
      idNumber: uploadForm.value.idNumber, // 假設身分證欄位 v-model="uploadForm.idNumber"
    };
    const result = await verifyUploadPrerequisites(payload);

    if (result.status === 'success') {
      verifiedBookingCode.value = result.bookingCode;
      appointmentDetails.value = result.appointmentDetails || null; // 保存預約詳情

      // 如果有預約詳情，顯示確認對話框讓用戶確認，否則直接進入步驟二
      if (result.appointmentDetails) {
        isConfirmationDialogVisible.value = true; // 顯示預約詳情確認對話框
      } else {
        uploadStep.value = 2; // 驗證成功，前往步驟二
      }
    } else if (result.status === 'needs_confirmation') {
      confirmationMessage.value = result.message;
      appointmentDetails.value = null; // 清空預約詳情
      isConfirmationDialogVisible.value = true; // 跳出確認對話框
    }
  } catch (error) {
    alert(`驗證失敗：${error.message}`);
  } finally {
    isLoading.value = false;
  }
};

const proceedWithUpload = () => {
  // 只在「無預約記錄」的情況下設為 null（appointmentDetails 為空）
  // 如果已驗證到預約，則保留 bookingCode
  if (!appointmentDetails.value) {
    verifiedBookingCode.value = null;
  }
  uploadStep.value = 2;
  isConfirmationDialogVisible.value = false;
};
// ✓ END: 新增



// 儲存上傳後的 URL
const finalAuthLetterUrl = ref('');

//  新增一個 ref 來追蹤勾選狀態
const isInstructionsConfirmed = ref(false);

//  在 isInstructionsConfirmed 下方新增一個 ref
const isInstructionsDialogVisible = ref(false);

// 預約說明彈窗：偵測使用者是否已將內容捲動至底部
const isInstructionsScrolledBottom = ref(false);
const instructionsScrollEl = ref(null);

const handleInstructionsScroll = (e) => {
  const el = e.target;
  if (!el) return;
  if (el.scrollTop + el.clientHeight >= el.scrollHeight - 16) {
    isInstructionsScrolledBottom.value = true;
  }
};

// 彈窗開啟時重設狀態；若內容過短無需捲動則直接視為已讀
watch(isInstructionsDialogVisible, (visible) => {
  if (visible) {
    isInstructionsScrolledBottom.value = false;
    nextTick(() => {
      // v-card-text 是 Vue 元件，需透過 $el 取得實際 DOM
      const ref = instructionsScrollEl.value;
      const el = ref?.$el || ref;
      if (el && el.scrollHeight <= el.clientHeight + 16) {
        isInstructionsScrolledBottom.value = true;
      }
    });
  }
});

// 確認預約說明後：關閉彈窗並將焦點移至步驟一身分證輸入欄位
const confirmInstructionsAndStartBooking = () => {
  isInstructionsConfirmed.value = true;
  isInstructionsDialogVisible.value = false;
  // 等待彈窗關閉動畫結束、表單渲染完成後再聚焦
  nextTick(() => {
    setTimeout(() => {
      const field = step1IdNumberField.value;
      if (!field) return;
      const el = field.$el;
      if (el?.scrollIntoView) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      field.focus?.();
    }, 350);
  });
};

const route = useRoute();
const dateAdapter = useDate();
const { smAndDown: isMobile } = useDisplay();
const projectStore = useProjectStore();
const step1Form = ref(null);
const step2Form = ref(null);
const step1IdNumberField = ref(null);
const step2NameField = ref(null);
const step2EmailField = ref(null);
const bookingResultCard = ref(null);

// 表單驗證失敗提示 Snackbar 狀態
const validationSnackbar = ref({
  show: false,
  message: ''
});

/**
 * 輔助函式：捲動到第一個驗證失敗的欄位，並顯示提示
 * @param {string} formSelector - 表單區域的 CSS 選擇器（可選，預設爲整個頁面）
 */
const scrollToFirstError = async (formSelector = null) => {
  await nextTick();
  // Vuetify v-input 驗證失敗時會加上 .v-input--error class
  const scope = formSelector ? document.querySelector(formSelector) : document;
  if (!scope) return;
  const firstError = scope.querySelector('.v-input--error');
  if (firstError) {
    firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
    // 嘗試聚焦到該欄位的 input 元素
    const inputEl = firstError.querySelector('input, textarea, select');
    if (inputEl) {
      setTimeout(() => inputEl.focus(), 400);
    }
  }
  validationSnackbar.value = {
    show: true,
    message: '請填寫所有必填欄位後再繼續'
  };
};


// 代表「今天」的常數，並將時間設為午夜
const today = new Date();
today.setHours(0, 0, 0, 0); // 將時間部分歸零，以便進行日期比較


// --- State ---
const isLoading = ref(true);
const isCanceling = ref(false);
const step = ref(0);
const selectedBookingType = ref(null);

// DEV（內部代填）模式：點頂部 LOGO 開啟歡迎視窗，於視窗顯示時於背景輸入對應 projectId 即啟用
const isWelcomeModalVisible = ref(false);
const devMode = ref(false);
const DEV_MODE_STORAGE_KEY = 'bookingDevMode';

// 背景按鍵 buffer：每次按鍵累積至 buffer，比對是否等於 projectId
let devKeyBuffer = '';
let devKeyResetTimer = null;

// 手機啟用：連點歡迎視窗標題達門檻 → 顯示隱藏輸入欄，輸入對應 projectId 後啟用
// （電腦維持原本的背景按鍵方式，手機無實體鍵盤時改走此路徑）
const DEV_TITLE_TAP_THRESHOLD = 5;
const showDevActivator = ref(false);
const devProjectIdInput = ref('');
let devTitleTapCount = 0;
let devTitleTapTimer = null;

function _resetDevActivator() {
  devTitleTapCount = 0;
  if (devTitleTapTimer) { clearTimeout(devTitleTapTimer); devTitleTapTimer = null; }
  showDevActivator.value = false;
  devProjectIdInput.value = '';
}

// 共用啟用邏輯：背景按鍵與手機輸入兩條路徑皆呼叫此函式
function _activateDevMode() {
  devMode.value = true;
  try { sessionStorage.setItem(DEV_MODE_STORAGE_KEY, projectId.value); } catch (_) { /* ignore */ }
  devKeyBuffer = '';
  _teardownDevHotkey();
  _resetDevActivator();
  isWelcomeModalVisible.value = false;
}

function _handleDevKeydown(e) {
  if (!e || typeof e.key !== 'string') return;
  if (e.key.length !== 1) return;                 // 只接受可印字元
  if (e.ctrlKey || e.metaKey || e.altKey) return; // 忽略含修飾鍵的組合
  // 若使用者正在某個輸入欄位中輸入，不要攔截（避免影響正常欄位）— 此情境下 modal 內也已無輸入欄
  const tag = (e.target?.tagName || '').toUpperCase();
  if (tag === 'INPUT' || tag === 'TEXTAREA' || e.target?.isContentEditable) return;

  if (devKeyResetTimer) clearTimeout(devKeyResetTimer);

  devKeyBuffer += e.key;
  const pid = projectId.value || '';
  if (pid.length > 0) {
    if (devKeyBuffer.length > pid.length) {
      devKeyBuffer = devKeyBuffer.slice(-pid.length);
    }
    if (devKeyBuffer === pid) {
      _activateDevMode();
      return;
    }
  }
  // 3 秒無新按鍵自動清空 buffer，避免殘留
  devKeyResetTimer = setTimeout(() => { devKeyBuffer = ''; }, 3000);
}

function _setupDevHotkey() {
  devKeyBuffer = '';
  window.addEventListener('keydown', _handleDevKeydown);
}
function _teardownDevHotkey() {
  window.removeEventListener('keydown', _handleDevKeydown);
  if (devKeyResetTimer) {
    clearTimeout(devKeyResetTimer);
    devKeyResetTimer = null;
  }
  devKeyBuffer = '';
}

function openWelcomeModal() {
  isWelcomeModalVisible.value = true;
  if (!devMode.value) _setupDevHotkey();
}
function closeWelcomeModal() {
  isWelcomeModalVisible.value = false;
  _teardownDevHotkey();
  _resetDevActivator();
}
function exitDevMode() {
  devMode.value = false;
  try { sessionStorage.removeItem(DEV_MODE_STORAGE_KEY); } catch (_) { /* ignore */ }
  isWelcomeModalVisible.value = false;
  _teardownDevHotkey();
  _resetDevActivator();
}

// 手機路徑：連點視窗標題達門檻 → 顯示隱藏的代填啟用輸入欄
function onDevTitleTap() {
  if (devMode.value || showDevActivator.value) return;
  devTitleTapCount += 1;
  if (devTitleTapTimer) clearTimeout(devTitleTapTimer);
  if (devTitleTapCount >= DEV_TITLE_TAP_THRESHOLD) {
    showDevActivator.value = true;
    devTitleTapCount = 0;
    return;
  }
  // 2 秒內未達門檻則重置計數
  devTitleTapTimer = setTimeout(() => { devTitleTapCount = 0; }, 2000);
}

// 手機路徑：比對輸入框內容是否等於 projectId，相符才啟用
function activateDevModeFromInput() {
  if ((devProjectIdInput.value || '').trim() === (projectId.value || '')) {
    _activateDevMode();
  } else {
    devProjectIdInput.value = '';
  }
}

// 根據選取的預約項目，動態回傳對應的頁面設定
const currentPageSettings = computed(() => {
  if (!projectConfig.value) return null;
  if (!selectedBookingType.value) return projectConfig.value; // fallback 到全域設定
  return projectConfig.value.pageSettingsByItem?.[selectedBookingType.value] || projectConfig.value;
});

// 解析目前預約項目要顯示的附件：
// 新邏輯為「建案共用附件庫 (projectConfig.attachmentLibrary)」+「各項目勾選 (intro.selectedAttachmentPaths)」；
// 若為舊資料（尚無 selectedAttachmentPaths 或附件庫）則回退使用 intro.attachments，確保向下相容。
const currentAttachments = computed(() => {
  const intro = currentPageSettings.value?.intro;
  if (!intro) return [];
  const library = projectConfig.value?.attachmentLibrary || [];
  if (Array.isArray(intro.selectedAttachmentPaths) && library.length > 0) {
    const byPath = new Map(library.filter(a => a && a.path).map(a => [a.path, a]));
    return intro.selectedAttachmentPaths.map(p => byPath.get(p)).filter(Boolean);
  }
  // 舊資料回退
  return Array.isArray(intro.attachments) ? intro.attachments : [];
});

// 預約欄位標籤自訂：依 fieldLabels 動態解析；空值沿用預設
const fieldLabel = (key) => resolveFieldLabel(projectConfig.value?.fieldLabels, key);
const fieldHint = (key) => resolveFieldHint(projectConfig.value?.fieldLabels, key);
const savedBookingCode = ref('');
const existingBookingInfoList = ref([]); // Support multiple bookings
const cancelingCode = ref(null); // Track which booking code is currently being canceled
const projectId = ref('');
const projectConfig = ref(null);

const initialData = ref({ buildings: [], checkDuplicate: 'OFF', bookingTypes: [], validateId: 'OFF' });
const uploadBuildingList = ref([]); // ✓ 為上傳表單新增一個專用的棟別列表
const allUnitsData = ref({});
const allUnitsDataForUpload = ref({});
const unitList = ref([]);
const bookingSlots = ref({ startDate: null, endDate: null, unavailableDates: [], timeSlotsByDate: {}, bookingOptions: {} });
const formStep1 = ref({
  building: null,
  unit: null,
  bookingType: null,
  bookingMethod: null,
  subOption: null, // 新增：第三層子選項
  companyName: '',
  address: '',
  idNumber: '',
  idNumber: '',
  isOwnerPresent: true
});

const dynamicFormData = ref({}); // [New] Store dynamic field values

// --- Booking Menu Logic (Parent-Child) ---
const currentDynamicFields = ref([]);
// 判斷當前選的方式是否需要授權流程
const isAuthFlowRequired = computed(() => {
  if (!projectConfig.value?.bookingMenu?.length) return false;
  const selectedItem = projectConfig.value.bookingMenu.find(item => item.title === formStep1.value.bookingType && !item.deleted);
  if (!selectedItem?.methods) return false;
  const methodObj = selectedItem.methods.find(m => m.title === formStep1.value.bookingMethod && !m.deleted);
  return !!(methodObj && methodObj.triggerAuthFlow);
});

// 判斷是否需要顯示「屋主本人是否到場」問答（依據選單 askOwnerPresence 設定）
const showOwnerPresenceQuestion = computed(() => {
  if (!projectConfig.value?.bookingMenu?.length) return false;
  const selectedItem = projectConfig.value.bookingMenu.find(item => item.title === formStep1.value.bookingType && !item.deleted);
  if (!selectedItem?.methods) return false;
  const methodObj = selectedItem.methods.find(m => m.title === formStep1.value.bookingMethod && !m.deleted);
  return !!(methodObj && methodObj.askOwnerPresence);
});

// 判斷 Step 2 是否要顯示授權流程
// 邏輯：triggerAuthFlow 啟用 + (若有問答則要回答「否」，若沒問答則直接顯示)
const shouldShowAuthFlow = computed(() => {
  if (!isAuthFlowRequired.value) return false;
  if (showOwnerPresenceQuestion.value) {
    // 有問答 → 只有回答「否」才顯示授權
    return formStep1.value.isOwnerPresent === false;
  }
  // 沒問答 → triggerAuthFlow 啟用就直接顯示
  return true;
});

// Watcher: 進入 STEP2 時，自動捲動到表單區域並聚焦「姓名」欄位
watch(step, async (newStep) => {
  if (newStep === 2) {
    await nextTick();
    // 延遲以確保 loading overlay 消失、DOM 完全渲染
    setTimeout(() => {
      if (step2NameField.value) {
        // 先捲動到姓名欄位位置
        const el = step2NameField.value.$el;
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
        // 聚焦到姓名 input
        step2NameField.value.focus();
      }
    }, 500);
  }

  // 進入「請確認您的預約資訊」或「預約成功」頁時，將視窗捲動至頂部
  if (newStep === 3 || newStep === 4) {
    await nextTick();
    setTimeout(() => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      // 同時處理可能的內層滾動容器（保險作法）
      document.documentElement?.scrollTo?.({ top: 0, behavior: 'smooth' });
    }, 100);
  }
});



const availableBookingTypes = computed(() => {
  if (!projectConfig.value) return [];

  // 內部代填模式：所有未刪除的項目都視為開放
  if (devMode.value) {
    if (projectConfig.value.bookingMenu && projectConfig.value.bookingMenu.length > 0) {
      return projectConfig.value.bookingMenu.filter(item => !item.deleted).map(item => item.title);
    }
    return projectConfig.value.bookingTypes || [];
  }

  // 當後端有回傳開放中的批次分類時，就只顯示這些項目；若是舊快取則先維持全部顯示
  const activeTypesArray = initialData.value?.activeBookingTypes;
  console.log('[DEBUG] BookingPage activeTypesArray:', activeTypesArray);
  const hasActiveTypesData = Array.isArray(activeTypesArray);
  const activeTypeSet = hasActiveTypesData ? new Set(activeTypesArray) : null;

  // New Structure
  if (projectConfig.value.bookingMenu && projectConfig.value.bookingMenu.length > 0) {
    let menuItems = projectConfig.value.bookingMenu.filter(item => !item.deleted);
    if (hasActiveTypesData) {
      menuItems = menuItems.filter(item => activeTypeSet.has(item.title));
    }
    const result = menuItems.map(item => item.title);
    console.log('[DEBUG] BookingPage computed mapping result:', result);
    return result;
  }

  // Fallback Legacy
  const types = projectConfig.value.bookingTypes || [];
  if (hasActiveTypesData) {
    return types.filter(t => activeTypeSet.has(t));
  }
  return types;
});

// [新增] 取得所有設定的預約服務類型（不過濾開放狀態，用於 Step 0 常駐顯示）
const allBookingTypes = computed(() => {
  if (!projectConfig.value) return [];

  // 從 bookingMenu 取得所有未刪除的項目
  if (projectConfig.value.bookingMenu && projectConfig.value.bookingMenu.length > 0) {
    return projectConfig.value.bookingMenu
      .filter(item => !item.deleted)
      .map(item => item.title);
  }

  // Fallback Legacy
  return projectConfig.value.bookingTypes || [];
});

// [新增] 判斷使用者選取的預約服務是否在開放中的批次列表裡
const isSelectedTypeActive = computed(() => {
  if (!selectedBookingType.value) return false;
  return availableBookingTypes.value.includes(selectedBookingType.value);
});

// [新增] 計算該服務對應「距當下最近的未來批次」的起訖時段
const nextBatchSchedule = computed(() => {
  if (!selectedBookingType.value) return null;

  const allSchedules = initialData.value?.allBatchSchedules;
  if (!allSchedules) return null;

  const schedules = allSchedules[selectedBookingType.value];
  if (!schedules || schedules.length === 0) return null;

  const now = currentTime.value;

  // 找到最近的未來批次（applicationStart > now）
  const futureSchedules = schedules
    .filter(s => {
      const start = parseDateValue(s.applicationStart);
      return start && start > now;
    })
    .sort((a, b) => {
      const aStart = parseDateValue(a.applicationStart);
      const bStart = parseDateValue(b.applicationStart);
      return aStart - bStart;
    });

  return futureSchedules.length > 0 ? futureSchedules[0] : null;
});

// [新增] 依服務類型取得最近的未來批次（供 Step 0 按鈕顯示開放時間）
const getNextBatchForType = (typeName) => {
  const allSchedules = initialData.value?.allBatchSchedules;
  if (!allSchedules) return null;

  const schedules = allSchedules[typeName];
  if (!schedules || schedules.length === 0) return null;

  const now = currentTime.value;

  const futureSchedules = schedules
    .filter(s => {
      const start = parseDateValue(s.applicationStart);
      return start && start > now;
    })
    .sort((a, b) => {
      const aStart = parseDateValue(a.applicationStart);
      const bStart = parseDateValue(b.applicationStart);
      return aStart - bStart;
    });

  return futureSchedules.length > 0 ? futureSchedules[0] : null;
};

// [新增] 格式化批次時段的日期時間顯示 (YYYY/M/DD HH:MM)
const formatScheduleDateTime = (isoString) => {
  if (!isoString) return '未設定';
  const d = new Date(isoString);
  if (isNaN(d.getTime())) return '未設定';
  const y = d.getFullYear();
  const m = d.getMonth() + 1;
  const day = d.getDate();
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  return `${y}/${m}/${day} ${hh}:${mm}`;
};

// [新增] 將批次開放時間加入 Google 行事曆
const addToGoogleCalendar = (schedule) => {
  const start = parseDateValue(schedule.applicationStart);
  const end = parseDateValue(schedule.applicationEnd);
  if (!start) return;

  const projectName = projectConfig.value?.name || '預約系統';
  const typeName = selectedBookingType.value || '預約';

  const title = encodeURIComponent(`${projectName} - ${typeName} 預約開放`);
  const details = encodeURIComponent(`${projectName}「${typeName}」預約系統已開放，請把握時間完成預約。`);

  // Google Calendar 格式：YYYYMMDDTHHmmssZ
  const formatGCal = (d) => d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');

  const startStr = formatGCal(start);
  // 若無結束時間，預設為開始後 1 小時
  const endDate = end || new Date(start.getTime() + 60 * 60 * 1000);
  const endStr = formatGCal(endDate);

  const url = `https://calendar.google.com/calendar/event?action=TEMPLATE&text=${title}&dates=${startStr}/${endStr}&details=${details}`;
  window.open(url, '_blank');
};

// [新增] 產生 .ics 行事曆檔並下載（含鬧鐘提醒：提前30分鐘 + 提前1天）
const downloadIcsFile = (schedule) => {
  const start = parseDateValue(schedule.applicationStart);
  const end = parseDateValue(schedule.applicationEnd);
  if (!start) return;

  const projectName = projectConfig.value?.name || '預約系統';
  const typeName = selectedBookingType.value || '預約';

  // ICS 格式日期
  const formatICS = (d) => d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');

  const startStr = formatICS(start);
  const endDate = end || new Date(start.getTime() + 60 * 60 * 1000);
  const endStr = formatICS(endDate);

  const icsContent = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//AnxiSmart//BookingReminder//ZH',
    'BEGIN:VEVENT',
    `DTSTART:${startStr}`,
    `DTEND:${endStr}`,
    `SUMMARY:${projectName} - ${typeName} 預約開放`,
    `DESCRIPTION:${projectName}「${typeName}」預約系統已開放，請把握時間完成預約。`,
    'BEGIN:VALARM',
    'TRIGGER:-PT30M',
    'ACTION:DISPLAY',
    `DESCRIPTION:${typeName}預約即將開放！`,
    'END:VALARM',
    'BEGIN:VALARM',
    'TRIGGER:-P1D',
    'ACTION:DISPLAY',
    `DESCRIPTION:明天${typeName}預約將開放`,
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR'
  ].join('\r\n');

  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `${typeName}_預約提醒.ics`;
  link.click();
  URL.revokeObjectURL(link.href);
};
const availableMethodOptions = computed(() => {
  if (!projectConfig.value || !formStep1.value.bookingType) return [];

  // New Structure
  if (projectConfig.value.bookingMenu && projectConfig.value.bookingMenu.length > 0) {
    const selectedItem = projectConfig.value.bookingMenu.find(item => item.title === formStep1.value.bookingType && !item.deleted);
    if (selectedItem && selectedItem.methods) {
      return selectedItem.methods.filter(m => !m.deleted).map(m => m.title);
    }
    return [];
  }

  // Fallback Legacy
  return projectConfig.value.bookingMethodOptions || [];
});

// 新增：子選項 computed
const availableSubOptions = computed(() => {
  if (!projectConfig.value?.bookingMenu?.length || !formStep1.value.bookingMethod) return [];
  const selectedItem = projectConfig.value.bookingMenu.find(item => item.title === formStep1.value.bookingType && !item.deleted);
  if (!selectedItem?.methods) return [];
  const methodObj = selectedItem.methods.find(m => m.title === formStep1.value.bookingMethod && !m.deleted);
  if (methodObj && methodObj.subOptions && Array.isArray(methodObj.subOptions) && methodObj.subOptions.length > 0) {
    return methodObj.subOptions;
  }
  return [];
});

// Watcher: Type Change -> Reset Method
watch(() => formStep1.value.bookingType, (newVal) => {
  formStep1.value.bookingMethod = null;
  formStep1.value.subOption = null; // 新增
  currentDynamicFields.value = [];
  dynamicFormData.value = {};
});

// Watcher: Method Change -> Update Fields
watch(() => formStep1.value.bookingMethod, (newMethodName) => {
  currentDynamicFields.value = [];
  formStep1.value.subOption = null; // 新增：切換方式時清空子選項
  if (!newMethodName) return;

  if (!projectConfig.value) return;

  // 1. Try New Structure
  if (projectConfig.value.bookingMenu && projectConfig.value.bookingMenu.length > 0) {
    const selectedItem = projectConfig.value.bookingMenu.find(item => item.title === formStep1.value.bookingType && !item.deleted);
    if (selectedItem && selectedItem.methods) {
      const methodObj = selectedItem.methods.find(m => m.title === newMethodName && !m.deleted);
      if (methodObj && methodObj.customFields) {
        currentDynamicFields.value = methodObj.customFields;
      }
      // 授權流程由 isAuthFlowRequired computed 自動判斷，此處不需額外處理
      return;
    }
  }

  // 2. Try Legacy Configs (if any exist independently)
  if (projectConfig.value.bookingMethodConfigs && projectConfig.value.bookingMethodConfigs[newMethodName]) {
    currentDynamicFields.value = projectConfig.value.bookingMethodConfigs[newMethodName];
  }
});

const formStep2 = ref({ 姓名: '', 電話: '', EMAIL: '', 預約日期: null, 預約時段: null, 受託人姓名: '', 受託人電話: '' });
const existingBookingInfo = ref(null);


// --- START: 預約逾時機制所需狀態 ---
// 用於儲存 setTimeout 的 ID，以便清除計時器
const timeoutTimerId = ref(null);
// 用於儲存顯示倒數計時的 setInterval 的 ID
const countdownTimerId = ref(null);
// 標記計時器是否正在運行
const isTimeoutActive = ref(false);
// 顯示剩餘的秒數 (初始 5 分鐘 = 300 秒)
const remainingSeconds = ref(300);
// 儲存從後端獲取的確認階段 Token
const confirmationToken = ref(null);
// 控制逾時提示 Dialog 的顯示
const isTimeoutDialogVisible = ref(false);
// --- END: 預約逾時機制所需狀態 ---

// ... (所有既有的 Helper Functions, Computed Properties, Methods 省略以保持簡潔) ...
// --- Helper Functions  ---
const formatDateToYYYYMMDD = (date) => {
  if (!date) return '';
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// 用於顯示給使用者看的日期格式
const formatDisplayDate = (dateString) => {
  if (!dateString) return '';
  return dateAdapter.format(new Date(dateString), 'keyboardDate');
};

// [修改] 更新原本的 isBookingActive computed
const isBookingActive = computed(() => {
  // 內部代填模式下繞過所有未開放/已截止判斷
  if (devMode.value) return true;
  // 只有當狀態碼為 OPEN 時，才允許預約
  return systemStatus.value.code === 'OPEN';
});

// computed 方便判斷是否需要驗證
const isIdValidationRequired = computed(() => {
  return initialData.value.validateId === 'ON';
});

// 計算目前選擇的戶別是否允許重複預約
const selectedUnitAllowMultipleBookings = computed(() => {
  // 內部代填模式：一律視為可重複預約，繞過已預約檢查
  if (devMode.value) return true;
  if (!formStep1.value.unit || !unitList.value) return false;
  const selectedUnitData = unitList.value.find(u => u.unit === formStep1.value.unit);
  return selectedUnitData && selectedUnitData.allowMultipleBookings === true;
});

// 將兩個表單資料合併，並進行必要的轉換
const finalBookingData = computed(() => {
  const agentRel = authFormData.value.受託人關係 === '其他'
    ? authFormData.value.受託人關係其他
    : authFormData.value.受託人關係;

  return {
    ...formStep1.value,
    ...formStep2.value,
    bookingMethodDetails: dynamicFormData.value,
    戶別: formStep1.value.unit,
    預約日期: formStep2.value.預約日期 ? dateAdapter.format(formStep2.value.預約日期, 'keyboardDate') : null,
    受託人關係: agentRel || '未填寫',
  };
});

// 根據選中的預約項目動態取得對應的 closingText
const dynamicClosingText = computed(() => {
  const selectedType = finalBookingData.value?.bookingType;
  // 優先從預約項目專屬設定取得
  if (selectedType && projectConfig.value?.pageSettingsByItem?.[selectedType]?.intro?.closingText) {
    return projectConfig.value.pageSettingsByItem[selectedType].intro.closingText;
  }
  // 回退到全域預設
  return projectConfig.value?.intro?.closingText || '';
});

// 日期選擇提醒事項：根據選中的預約項目動態取得
const datePickerReminderContent = computed(() => {
  const reminder = currentPageSettings.value?.intro?.datePickerReminder;
  if (reminder?.show && reminder?.content) {
    return reminder.content;
  }
  return null;
});

// 是否有可預約日期（用於 Step 2 日期選擇器遮罩判斷）
const hasAvailableDates = computed(() => {
  return Object.keys(bookingSlots.value.timeSlotsByDate || {}).length > 0;
});

// 無可預約日期時的提示文字
const noAvailableDatesMessage = computed(() => {
  const method = formStep1.value.bookingMethod || '';
  const sub = formStep1.value.subOption || '';
  const label = sub ? `${method} - ${sub}` : method;
  return `您選擇的「${label}」目前無可預約的日期，請回上一步改選其他項目`;
});

// 依據所選日期，動態產生可用的時間選項
const availableTimeSlots = computed(() => {
  if (!formStep2.value.預約日期) return [];
  const dateKey = formatDateToYYYYMMDD(formStep2.value.預約日期);
  const slots = bookingSlots.value.timeSlotsByDate[dateKey] || [];

  return slots.map(slotString => {
    // 使用正規表示式提取時間部分，例如 "09:00"
    const timeMatch = slotString.match(/(\d{1,2}:\d{2}(?::\d{2})?)/);
    const timeValue = timeMatch ? timeMatch[0] : '';

    return {
      title: slotString, // 完整的字串，用於下拉選單顯示，例如 "09:00 (尚餘4位)"
      value: timeValue,    // 只有時間，作為選取後的值，例如 "09:00"
    };
  });
});


// --- Methods ---
const isDateAllowed = (date) => {
  // 條件一：日期必須在今天之後
  if (date <= today) {
    return false;
  }

  const dateStr = formatDateToYYYYMMDD(date);

  // 條件二：日期不能在後端提供的「不可預約日」清單中
  const isGenerallyAvailable = !bookingSlots.value.unavailableDates.includes(dateStr);
  if (!isGenerallyAvailable) return false;

  const slots = bookingSlots.value.timeSlotsByDate[dateStr] || [];
  const hasDefinedSlots = slots.length > 0;
  if (!hasDefinedSlots) return false;

  // 至少要有一個非「已額滿」的時段，否則禁選整日（DEV 代填模式亦同）
  return slots.some(s => !String(s).includes('已額滿'));
};

// 授權書對話框狀態
const isAuthDialogVisible = ref(false);
const isSigningInitiated = ref(false);

const isAuthLetterGenerated = ref(false); // 用於追蹤授權書是否已產生
const generatedAuthLetterUrl = ref(''); // 用於存放產生的授權書圖片 URL 以供預覽
const authForm = ref(null); // 為 v-form 建立 ref
const authLetterRenderRef = ref(null); // 為渲染授權書的隱藏 div 建立 ref
const isPreviewDialogVisible = ref(false); // 控制預覽對話框的顯示

// 獲取民國年日期
const confirmCancelBookingByCode = async (bookingCode) => {
  if (!bookingCode) return;
  if (confirm("即將取消這筆預約，您確定嗎？")) {
    cancelingCode.value = bookingCode; // 設定特定代碼載入狀態
    try {
      const res = await cancelBooking({
        projectId: projectId.value,
        bookingCode: bookingCode
      }); // API 需要支援取消特定 Code

      if (res.status === 'success') {
        alert('您的預約已取消成功。');
        // 移除已取消的預約
        existingBookingInfoList.value = existingBookingInfoList.value.filter(b => b.bookingCode !== bookingCode);
        if (existingBookingInfoList.value.length === 0) {
          step.value = 1;
        }
      } else {
        alert(`取消失敗: ${res.message}`);
      }
    } catch (error) {
      console.error("取消預約失敗:", error);
      alert("系統忙碌中，取消失敗，請稍後再試或聯繫客服。");
    } finally {
      cancelingCode.value = null;
    }
  }
};

const getMinguoDate = () => {
  const date = new Date();
  const year = date.getFullYear() - 1911;
  const month = date.getMonth() + 1;
  const day = date.getDate();
  return `中華民國 ${year} 年 ${month} 月 ${day} 日`;
};

// 授權書表單資料
const authFormData = ref({
  委託人姓名: '',
  委託人電話: '',
  委託人身分證: '',
  委託人戶籍地: '',
  受託人姓名: '',
  受託人Email: '',
  受託人身分證: '',
  受託人戶籍地: '',
  受託人電話: '',
  受託人關係: '',
  受託人關係其他: ''
});

// 簽名版元件的 ref
const delegatorSignaturePad = ref(null);


const isAttachmentPreviewVisible = ref(false); // 附件預覽 Dialog
const currentPreviewAttachment = ref(null); // 當前預覽的附件

// 附件預覽：縮放/拖移狀態
const previewZoom = ref(1);
const previewTranslateX = ref(0);
const previewTranslateY = ref(0);
const isPanningPreview = ref(false);
const panStartPreview = { x: 0, y: 0, tx: 0, ty: 0 };
const pinchStartPreview = { distance: 0, zoom: 1 };

const PREVIEW_ZOOM_MIN = 0.5;
const PREVIEW_ZOOM_MAX = 5;

const isPdfPreview = computed(() =>
  !!currentPreviewAttachment.value?.name?.toLowerCase().endsWith('.pdf')
);
const isImagePreview = computed(() =>
  !!currentPreviewAttachment.value?.url && !isPdfPreview.value
);

const previewImageStyle = computed(() => ({
  transform: `translate3d(${previewTranslateX.value}px, ${previewTranslateY.value}px, 0) scale(${previewZoom.value})`,
  transition: isPanningPreview.value ? 'none' : 'transform 0.18s ease',
}));

const clampZoom = (z) => Math.max(PREVIEW_ZOOM_MIN, Math.min(PREVIEW_ZOOM_MAX, z));

const resetPreviewZoom = () => {
  previewZoom.value = 1;
  previewTranslateX.value = 0;
  previewTranslateY.value = 0;
};

const applyZoom = (newZoom) => {
  const z = clampZoom(newZoom);
  if (z <= 1) {
    resetPreviewZoom();
  } else {
    previewZoom.value = z;
  }
};

const zoomInPreview = () => applyZoom(previewZoom.value * 1.25);
const zoomOutPreview = () => applyZoom(previewZoom.value / 1.25);

const onPreviewWheel = (e) => {
  e.preventDefault();
  const factor = e.deltaY < 0 ? 1.1 : 1 / 1.1;
  applyZoom(previewZoom.value * factor);
};

const onPreviewDoubleClick = () => {
  if (previewZoom.value > 1) {
    resetPreviewZoom();
  } else {
    applyZoom(2);
  }
};

const onPreviewMouseDown = (e) => {
  if (previewZoom.value <= 1) return;
  isPanningPreview.value = true;
  panStartPreview.x = e.clientX;
  panStartPreview.y = e.clientY;
  panStartPreview.tx = previewTranslateX.value;
  panStartPreview.ty = previewTranslateY.value;
};

const onPreviewMouseMove = (e) => {
  if (!isPanningPreview.value) return;
  previewTranslateX.value = panStartPreview.tx + (e.clientX - panStartPreview.x);
  previewTranslateY.value = panStartPreview.ty + (e.clientY - panStartPreview.y);
};

const onPreviewMouseUp = () => {
  isPanningPreview.value = false;
};

const getTouchDistance = (touches) => {
  const dx = touches[0].clientX - touches[1].clientX;
  const dy = touches[0].clientY - touches[1].clientY;
  return Math.hypot(dx, dy);
};

const onPreviewTouchStart = (e) => {
  if (e.touches.length === 2) {
    pinchStartPreview.distance = getTouchDistance(e.touches);
    pinchStartPreview.zoom = previewZoom.value;
    isPanningPreview.value = false;
  } else if (e.touches.length === 1 && previewZoom.value > 1) {
    isPanningPreview.value = true;
    panStartPreview.x = e.touches[0].clientX;
    panStartPreview.y = e.touches[0].clientY;
    panStartPreview.tx = previewTranslateX.value;
    panStartPreview.ty = previewTranslateY.value;
  }
};

const onPreviewTouchMove = (e) => {
  if (e.touches.length === 2 && pinchStartPreview.distance > 0) {
    e.preventDefault();
    const newDistance = getTouchDistance(e.touches);
    const scale = newDistance / pinchStartPreview.distance;
    applyZoom(pinchStartPreview.zoom * scale);
  } else if (e.touches.length === 1 && isPanningPreview.value) {
    e.preventDefault();
    previewTranslateX.value = panStartPreview.tx + (e.touches[0].clientX - panStartPreview.x);
    previewTranslateY.value = panStartPreview.ty + (e.touches[0].clientY - panStartPreview.y);
  }
};

const onPreviewTouchEnd = (e) => {
  if (!e.touches || e.touches.length < 2) {
    pinchStartPreview.distance = 0;
  }
  if (!e.touches || e.touches.length === 0) {
    isPanningPreview.value = false;
  }
};

// 切換附件或關閉 Dialog 時重置縮放
watch(currentPreviewAttachment, () => {
  resetPreviewZoom();
});
watch(isAttachmentPreviewVisible, (val) => {
  if (!val) resetPreviewZoom();
});

// 打開授權書對話框
const openAuthDialog = () => {
  // 自動帶入已填寫的委託人 (預約人) 資訊
  authFormData.value.委託人姓名 = authFormData.value.委託人姓名 || formStep2.value.姓名 || '';
  authFormData.value.委託人電話 = authFormData.value.委託人電話 || formStep2.value.電話 || '';
  // 自動帶入已填寫的受託人資訊
  authFormData.value.受託人姓名 = formStep2.value.受託人姓名;
  authFormData.value.受託人電話 = formStep2.value.受託人電話;
  isAuthDialogVisible.value = true;
};

// 關閉對話框
const closeAuthDialog = () => {
  isAuthDialogVisible.value = false;
};

// 重新進行授權流程
const resetAuthFlow = () => {
  if (!confirm('確定要重新授權嗎？這將清除目前的授權資料，需要重新填寫並寄送簽署邀請。')) return;
  isSigningInitiated.value = false;
  authFormData.value = {
    委託人姓名: '',
    委託人電話: '',
    委託人身分證: '',
    委託人戶籍地: '',
    受託人姓名: '',
    受託人Email: '',
    受託人身分證: '',
    受託人戶籍地: '',
    受託人電話: '',
    受託人關係: '',
    受託人關係其他: ''
  };
};

//清除委託人簽名
const clearDelegatorSignature = () => {
  if (delegatorSignaturePad.value) {
    delegatorSignaturePad.value.clearSignature();
  }
};

//  START: 新增 - 發起簽署流程的函式
const handleInitiateSigning = async () => {
  // 1. 表單與簽名驗證
  const { valid } = await authForm.value.validate();
  if (!valid) {
    alert('所有欄位皆為必填，請檢查後再試。');
    return;
  }
  if (delegatorSignaturePad.value.isEmpty()) {
    alert('委託人(屋主)必須簽名。');
    return;
  }

  loadingText.value = '正在產生簽署邀請...';
  isLoading.value = true;

  try {
    // 2. 準備傳送給後端的資料
    const payload = {
      projectId: projectId.value,
      unitId: formStep1.value.unit,
      formData: authFormData.value,
      // 只傳送委託人(第一位)的簽名
      delegatorSignature: delegatorSignaturePad.value.saveSignature('image/png').data
    };

    // 3. 呼叫新的 API 函式 (下一步會建立)
    const result = await initiateAuthSigningProcess(payload);

    if (result.status === 'success') {
      isSigningInitiated.value = true;
      // 回寫 formStep2 以供最終提交使用
      formStep2.value.受託人姓名 = authFormData.value.受託人姓名;
      formStep2.value.受託人電話 = authFormData.value.受託人電話;
      closeAuthDialog();
      alert('簽署邀請已成功寄出！請通知受託人至 Email 收信並完成簽署。');
    } else {
      throw new Error(result.message);
    }
  } catch (error) {
    console.error('發起簽署邀請失敗:', error);
    alert(`發起邀請失敗：${error.message}`);
  } finally {
    isLoading.value = false;
  }
};
//  END: 新增函式


// --- START: 預約逾時機制所需函數 ---

// 清除所有計時器並重設狀態
const clearTimeoutTimer = () => {
  if (timeoutTimerId.value) {
    clearTimeout(timeoutTimerId.value);
    timeoutTimerId.value = null;
  }
  if (countdownTimerId.value) {
    clearInterval(countdownTimerId.value);
    countdownTimerId.value = null;
  }
  isTimeoutActive.value = false;
  confirmationToken.value = null; // 清除 Token
  remainingSeconds.value = 300; // 重置秒數顯示 (可選)
};

// 啟動 5 分鐘倒數計時器
const startTimeoutTimer = (token) => {
  clearTimeoutTimer(); // 先清除舊的計時器
  confirmationToken.value = token; // 保存從後端拿到的 Token
  isTimeoutActive.value = true;
  remainingSeconds.value = 300; // 重設為 300 秒

  // 設定 5 分鐘後執行的主要逾時邏輯
  timeoutTimerId.value = setTimeout(() => {
    if (isTimeoutActive.value) { // 再次檢查計時器是否仍然有效
      isTimeoutActive.value = false; // 標記為非活動
      isTimeoutDialogVisible.value = true; // 顯示逾時提示框
      // Dialog 關閉後會自動調用 resetBookingFlow
    }
  }, 300 * 1000); // 300 秒 * 1000 毫秒

  // 設定每秒更新剩餘秒數顯示 (可選)
  countdownTimerId.value = setInterval(() => {
    if (remainingSeconds.value > 0) {
      remainingSeconds.value--;
    } else {
      clearInterval(countdownTimerId.value); // 時間到，停止更新秒數
    }
  }, 1000);
};

// 處理逾時提示框關閉事件
const handleTimeoutDialogClose = () => {
  isTimeoutDialogVisible.value = false;
  resetBookingFlow(); // 關閉提示框後重置流程
};

// 開啟附件預覽
const openAttachmentPreview = (item) => {
  currentPreviewAttachment.value = item;
  isAttachmentPreviewVisible.value = true;
};

// 下載附件
const downloadAttachment = (item) => {
  if (!item || !item.url) return;
  const link = document.createElement('a');
  link.href = item.url;
  link.target = '_blank'; // 開啟新分頁下載
  link.download = item.name || 'download';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

// --- END: 預約逾時機制所需函數 ---

// 重置預約流程的函式
const resetBookingFlow = () => {
  clearTimeoutTimer();
  step.value = 1;
  savedBookingCode.value = '';
  existingBookingInfo.value = null;

  // 重置表單資料
  formStep1.value = { building: null, unit: null, bookingType: null, bookingMethod: null, subOption: null, companyName: '', address: '', idNumber: '', isOwnerPresent: true };
  dynamicFormData.value = {}; // [New] Reset dynamic data
  formStep2.value = { 姓名: '', 電話: '', EMAIL: '', 預約日期: null, 預約時段: null, 受託人姓名: '', 受託人電話: '' };

  // 重置授權書相關狀態
  isAuthLetterGenerated.value = false;
  generatedAuthLetterUrl.value = '';
  finalAuthLetterUrl.value = '';

  // 重置表單驗證狀態
  if (step1Form.value) {
    step1Form.value.resetValidation();
  }
  if (step2Form.value) {
    step2Form.value.resetValidation();
  }
};

// --- START: ✓ 新增 watch 監聽 bookingType ---
// 監聽預約項目的變化，特別處理「對保」情況
watch(() => formStep1.value.bookingType, (newType) => {
  if (newType === '對保') {
    // 選擇「對保」，強制設定為本人到場
    formStep1.value.isOwnerPresent = true;
  } else {
    // 從「對保」切換為其他項目時，根據當前的 bookingMethod 重新判斷
    const currentMethod = formStep1.value.bookingMethod;
    if (currentMethod === '授權驗屋') {
      formStep1.value.isOwnerPresent = false;
    } else { // 包括 '屋主自驗' 或 其他方法 (如 '代驗公司')
      formStep1.value.isOwnerPresent = true; // 預設或強制為 true
    }
  }
  // 無論如何，切換預約項目時都重設授權書寄送狀態
  isSigningInitiated.value = false;
});
// --- END: ✓ 新增 watch 監聽 bookingType ---

// --- START: ✓ 修改 watch 監聽 bookingMethod ---
// 監聽驗屋方式的變化，自動調整 isOwnerPresent 狀態 (排除對保)
watch(() => formStep1.value.bookingMethod, (newMethod, oldMethod) => {
  // 切換方式時，一律清空上一個方式殘留的動態欄位資料與授權狀態
  isSigningInitiated.value = false;
  dynamicFormData.value = {};

  // 如果預約項目是「對保」，則 isOwnerPresent 始終為 true，不受 bookingMethod 影響
  if (formStep1.value.bookingType === '對保') {
    formStep1.value.isOwnerPresent = true; // 再次確保是 true
  }
});
// --- END: ✓ 修改 watch 監聯 bookingMethod ---



const displayDynamicFields = computed(() => {
  const data = dynamicFormData.value;
  if (!data || Object.keys(data).length === 0) return [];

  const flatten = (fields) => {
    let res = [];
    if (!fields) return res;
    for (const f of fields) {
      res.push(f);
      if (f.options) {
        for (const opt of f.options) {
          if (opt.subFields) {
            res = res.concat(flatten(opt.subFields));
          }
        }
      }
    }
    return res;
  };

  const allFields = flatten(currentDynamicFields.value);

  return Object.entries(data)
    .map(([key, val]) => {
      const fieldParam = allFields.find(f => f.id === key);
      if (!fieldParam) return null; // 欄位已不屬於目前方式（殘留資料），略過不顯示
      let displayVal = val;
      if (Array.isArray(val)) displayVal = val.join(', ');
      return {
        label: fieldParam.label,
        value: displayVal
      };
    })
    .filter(Boolean);
});



// ✅ 3. 大幅簡化 onMounted 邏輯
onMounted(async () => {
  projectId.value = route.params.projectId;
  isLoading.value = true;
  loadingText.value = '正在載入建案資訊...';

  // 還原內部代填模式（同個 session 內保留設定，避免 reload 後失效）
  try {
    const savedDev = sessionStorage.getItem(DEV_MODE_STORAGE_KEY);
    if (savedDev && savedDev === projectId.value) {
      devMode.value = true;
    }
  } catch (e) { /* ignore */ }

  try {
    // 呼叫 Pinia action 來獲取資料 (傳入 true 強制更新快取)
    const data = await projectStore.fetchProjectStaticData(projectId.value, true);

    // 將 Pinia store 回傳的資料指派給 local refs
    projectConfig.value = data.projectConfig;

    // --- START: ✓ 排序邏輯 (保持不變) ---
    if (Array.isArray(data.initialData.buildings)) {
      data.initialData.buildings.sort((a, b) =>
        String(a).localeCompare(String(b), 'zh-Hant-TW', { numeric: true, sensitivity: 'base' })
      );
    }
    initialData.value = data.initialData;
    // --- END: ✓ 排序邏輯 ---

    if (Array.isArray(data.uploadBuildingList)) {
      data.uploadBuildingList.sort((a, b) =>
        String(a).localeCompare(String(b), 'zh-Hant-TW', { numeric: true, sensitivity: 'base' })
      );
    }
    uploadBuildingList.value = data.uploadBuildingList;

    allUnitsData.value = data.allUnitsData;
    allUnitsDataForUpload.value = data.allUnitsDataForUpload;

  } catch (error) {
    console.error("頁面初始化失敗:", error);
    alert("系統忙碌中，無法讀取預約資料，請稍後再試。");
  } finally {
    isLoading.value = false;
  }


  // [新增] 啟動每秒更新時間的計時器
  timerInterval = setInterval(() => {
    currentTime.value = new Date();
  }, 1000);
});

const onBuildingChange = (building) => {
  formStep1.value.unit = null;
  formStep1.value.address = '';
  existingBookingInfo.value = null;
  step.value = 1;

  // --- START: ✓ 新增清空步驟二 ---
  // 正體中文註解：切換棟別時，清空步驟二的自動帶入資料
  formStep2.value.姓名 = '';
  formStep2.value.電話 = '';
  formStep2.value.EMAIL = '';
  // --- END: ✓ 新增清空步驟二 ---

  if (!building) {
    unitList.value = [];
    return;
  }

  unitList.value = allUnitsData.value[building] || [];
};

const onUnitChange = (unitValue) => {
  const selectedUnit = unitList.value.find(u => u.unit === unitValue);
  if (selectedUnit) {
    formStep1.value.address = selectedUnit.address;

    // --- START: ✓ 新增自動帶入 ---
    // 正體中文註解：自動帶入 `households` 集合中的買方資料到步驟二的表單
    formStep2.value.姓名 = selectedUnit.buyerName || '';
    formStep2.value.電話 = selectedUnit.buyerPhone || '';
    formStep2.value.EMAIL = selectedUnit.buyerEmail || '';
    // --- END: ✓ 新增自動帶入 ---

  }
  existingBookingInfoList.value = [];
  step.value = 1;
};
const onDateChange = () => { formStep2.value.預約時段 = null; };

const proceedToNextBooking = async () => {
  loadingText.value = '正在獲取可預約時段...';
  isLoading.value = true;
  try {
    const res = await getBookingSlots(
      projectConfig.value.name,
      formStep1.value.unit,
      formStep1.value.bookingType,
      formStep1.value.bookingMethod,
      projectId.value,
      formStep1.value.subOption, // 新增：傳遞子選項
      devMode.value ? projectId.value : null
    );

    if (res.status === 'success' && res.data) {
      bookingSlots.value = res.data;
      step.value = 2;
    } else {
      throw new Error(res.message || '無法獲取可預約時段');
    }
  } catch (error) {
    console.error("獲取時段失敗:", error);
    alert(`操作失敗：${error.message}`);
  } finally {
    isLoading.value = false;
  }
};

const handleStep1Submit = async () => {
  const { valid } = await step1Form.value.validate();
  if (!valid) {
    scrollToFirstError();
    return;
  }

  loadingText.value = '正在驗證戶別資訊...';
  isLoading.value = true;
  existingBookingInfoList.value = [];


  try {
    // --- 步驟 1: 身分驗證 (如果需要) ---
    if (isIdValidationRequired.value) {
      const validationRes = await validateId(
        projectConfig.value.projectName,
        formStep1.value.unit,
        formStep1.value.idNumber,
        projectId.value // 傳入 projectId
      );
      if (validationRes.status !== 'success') {
        throw new Error(validationRes.message || '身分驗證失敗');
      }
    }



    // --- 步驟 2: 檢查現有預約 ---
    if (initialData.value.checkDuplicate === 'ON') {
      const res = await checkExistingBooking(
        projectId.value,
        formStep1.value.unit,
        formStep1.value.bookingType
      );

      if (res.status === 'success' && res.data.status === 'found') {
        // 支援多筆預約列表
        existingBookingInfoList.value = res.data.bookings || [];
        isLoading.value = false;
        return;
      }
    }

    // --- 步驟 3: 獲取可預約時段 ---
    const res = await getBookingSlots(
      projectConfig.value.name,
      formStep1.value.unit,
      formStep1.value.bookingType,
      formStep1.value.bookingMethod,
      projectId.value, // 傳入 projectId
      formStep1.value.subOption, // 新增：傳遞子選項
      devMode.value ? projectId.value : null
    );



    if (res.status === 'success' && res.data) {
      bookingSlots.value = res.data;
      step.value = 2;
    } else {
      throw new Error(res.message || '無法獲取可預約時段');
    }
  } catch (error) { //  確保 catch 區塊存在
    console.error("步驟一處理失敗:", error);
    alert(`操作失敗：${error.message}`);
  } finally { //  確保 finally 區塊存在
    isLoading.value = false;
  }
};

// 在 handleStep2Submit 中，修改檢查的旗標
const handleStep2Submit = async () => {

  // --- START: ✓ 新增授權書完成檢查 (放在最前面) ---
  // 檢查是否需要授權流程，且尚未完成寄送邀請
  if (shouldShowAuthFlow.value && !isSigningInitiated.value) {
    alert('此方式需要授權流程，請務必先完成「填寫驗屋授權書」並寄送簽署邀請。');
    return;
  }
  // --- END: ✓ 授權書完成檢查 ---

  const { valid } = await step2Form.value.validate();
  if (!valid) {
    scrollToFirstError();
    return;
  }

  // --- START: 修改點 ---
  loadingText.value = '準備確認頁面...';
  isLoading.value = true;
  try {
    // 1. 呼叫新的後端函數以獲取有時效性的 Token
    const tokenPayload = {
      projectId: projectId.value,
      unitId: formStep1.value.unit,
      // 可以考慮加入其他需要驗證的資料, 例如 bookingType
      bookingType: formStep1.value.bookingType,
    };
    // 假設 api.js 中有 initiateBookingConfirmation 函數 (下一步會建立)
    const tokenRes = await initiateBookingConfirmation(tokenPayload);

    if (tokenRes.status === 'success' && tokenRes.token) {
      // 2. 獲取 Token 成功，啟動前端計時器
      startTimeoutTimer(tokenRes.token);
      // 3. 才跳轉到步驟三
      step.value = 3;
    } else {
      // 獲取 Token 失敗，顯示錯誤
      throw new Error(tokenRes.message || '無法初始化確認步驟，請稍後再試。');
    }
  } catch (error) {
    console.error("初始化確認步驟失敗:", error);
    alert(`操作失敗：${error.message}`);
  } finally {
    isLoading.value = false;
  }
  // --- END: 修改點 ---
};

const handleGoBackAndRefresh = async () => {
  clearTimeoutTimer();
  loadingText.value = '正在重新整理時段...';
  isLoading.value = true;
  try {
    //  修正：加入 projectId 參數
    const res = await getBookingSlots(
      projectConfig.value.name,
      formStep1.value.unit,
      formStep1.value.bookingType,
      formStep1.value.bookingMethod,
      projectId.value, //  加入缺少的 projectId 參數
      formStep1.value.subOption,
      devMode.value ? projectId.value : null
    );

    if (res.status === 'success' && res.data) {
      bookingSlots.value = res.data;
      step.value = 2;
    } else {
      throw new Error(res.message || '無法刷新預約時段');
    }
  } catch (error) {
    console.error("返回刷新失敗:", error);
    alert(`操作失敗：${error.message}`);
  } finally {
    isLoading.value = false;
  }
};

const submitBooking = async () => {
  // --- START: 修改點 1 ---
  // 檢查計時器是否仍在活動，如果已逾時則阻止提交
  if (!isTimeoutActive.value) {
    alert('操作已逾時或憑證已失效，請返回上一步重新操作。');
    // 可以選擇直接重置流程
    // resetBookingFlow();
    return;
  }

  loadingText.value = '正在為您送出預約...';
  isLoading.value = true;
  let authLetterFinalUrl = '';

  try {
    if (isAuthLetterGenerated.value && generatedAuthLetterUrl.value) {
      const today = new Date();
      const yyyymmdd = `${today.getFullYear()}${(today.getMonth() + 1).toString().padStart(2, '0')}${today.getDate().toString().padStart(2, '0')}`;
      const fileName = `${formStep1.value.unit}驗屋授權書${yyyymmdd}.png`;

      //* 上傳授權書
      const uploadRes = await uploadAuthLetter(
        generatedAuthLetterUrl.value,
        fileName,
        projectId.value,
        formStep1.value.unit
      );

      // 檢查上傳結果
      if (uploadRes.status !== 'success') {
        throw new Error(uploadRes.message || '授權書上傳失敗');
      }

      authLetterFinalUrl = uploadRes.url;
      finalAuthLetterUrl.value = uploadRes.url;
    }

    // 準備預約資料
    const payload = {
      projectId: projectId.value,
      // 內部代填模式：傳入 projectId 作為鑰匙，後端比對通過則繞過已預約檢查（等同可重複預約）
      devBypass: devMode.value ? projectId.value : null,
      bookingData: {
        projectName: projectConfig.value.name,
        unitId: finalBookingData.value.戶別,
        address: finalBookingData.value.address,
        name: finalBookingData.value.姓名,
        phone: finalBookingData.value.電話,
        email: finalBookingData.value.EMAIL,
        idNumber: finalBookingData.value.idNumber,
        bookingType: finalBookingData.value.bookingType, // '初驗' 或 '複驗'
        bookingDate: finalBookingData.value.預約日期, // YYYY/MM/DD
        bookingTimeSlot: finalBookingData.value.預約時段, // '09:00-10:00 (尚餘 X 位)'
        bookingMethod: finalBookingData.value.bookingMethod,
        subOption: finalBookingData.value.subOption || '',
        companyName: finalBookingData.value.companyName,
        // 授權書相關
        principalName: authFormData.value.委託人姓名,
        principalPhone: authFormData.value.委託人電話,
        principalIdNumber: authFormData.value.委託人身分證,
        principalAddress: authFormData.value.委託人戶籍地,
        agentName: finalBookingData.value.受託人姓名,
        agentPhone: finalBookingData.value.受託人電話,
        agentRelationship: finalBookingData.value.受託人關係,
        agentIdNumber: authFormData.value.受託人身分證,
        agentAddress: authFormData.value.受託人戶籍地,
        authorizationLetterUrl: authLetterFinalUrl,
        // 加入從後端獲取的確認 Token
        confirmationToken: confirmationToken.value,
        // [New] Dynamic Data
        bookingMethodDetails: finalBookingData.value.bookingMethodDetails,
        bookingMethodDetailsDisplay: displayDynamicFields.value,
        bookingMethodDetails: dynamicFormData.value
      }
    };

    //  提交預約
    const res = await saveBooking(payload);

    if (res.status === 'success') {
      if (res.data && res.data.bookingCode) {
        savedBookingCode.value = res.data.bookingCode;
      }

      // 預約成功後，自動刷新時段列表以更新其他使用者的可見容量
      try {
        const refreshRes = await getBookingSlots(
          projectConfig.value.name,
          formStep1.value.unit,
          formStep1.value.bookingType,
          formStep1.value.bookingMethod,
          projectId.value,
          formStep1.value.subOption,
          devMode.value ? projectId.value : null
        );
        if (refreshRes.status === 'success' && refreshRes.data) {
          bookingSlots.value = refreshRes.data;
        }
      } catch (refreshError) {
        console.warn('時段列表刷新失敗，但預約已成功:', refreshError);
        // 時段列表刷新失敗不應影響預約成功的體驗
      }

      step.value = 4;
    } else {
      // --- START: 修正點 ---
      // 檢查後端回傳的 res.message
      if (res.message && (res.message.includes('deadline-exceeded') || res.message.includes('unauthenticated') || res.message.includes('invalid-argument'))) { // ✓ 改用 res.message
        alert(`操作逾時或憑證無效，請返回第一步重新預約。`);
        resetBookingFlow();
      } else {
        // 如果不是特定錯誤，則拋出通用錯誤，讓外層 catch 處理
        // (或者您可以直接在此處 alert(res.message))
        throw new Error(res.message || '預約失敗，未提供原因');
      }
      // --- END: 修改點 3 ---
    }
  } catch (error) { // catch 區塊維持，但上面 if/else 處理了部分錯誤
    console.error("儲存預約失敗:", error);
    // 檢查後端回傳的特定錯誤訊息
    if (error.message.includes("已有有效預約")) {
      alert(`預約失敗：${error.message}`);
      // 引導使用者返回第一步重新選擇
      resetBookingFlow();
    } else if (error.message.includes("名額剛好額滿")) {
      alert(`預約失敗：${error.message}`);
      // 引導使用者返回第二步重新選擇時段
      handleGoBackAndRefresh();
    } else {
      // 其他一般錯誤
      alert(`預約失敗：${error.message}`);
    }
  } finally { //  END: 修改 catch 區塊
    isLoading.value = false;
    clearTimeoutTimer(); // <--- 將清除計時器移到 finally 區塊
  }
};

// 取消預約相關 methods
const confirmCancelBooking = () => {
  if (confirm("您確定要取消這個預約嗎？此操作無法復原。")) handleCancelBooking();
};

// 取消預約的實際處理函式
const handleCancelBooking = async () => {
  isCanceling.value = true;
  try {
    //  修改此處，將 '預約代碼' 改為 'bookingCode'
    const res = await cancelBooking({
      projectId: projectId.value,
      bookingCode: existingBookingInfo.value.bookingCode
    });

    if (res.status === 'success') {
      alert("預約已成功取消！");
      existingBookingInfo.value = null;
      // 可選：刷新頁面或回到第一步
      step.value = 1;
      formStep1.value = { building: null, unit: null, bookingType: null, bookingMethod: null, companyName: '', address: '', idNumber: '' };

    } else {
      throw new Error(res.message || '取消失敗');
    }
  } catch (error) {
    console.error("取消預約失敗:", error);
    alert(`取消失敗：${error.message}`);
  } finally {
    isCanceling.value = false;
  }
};

// 下載預約結果截圖
const captureAndSave = async () => {
  if (!bookingResultCard.value) return;
  try {
    const canvas = await html2canvas(bookingResultCard.value.$el);
    const imageURL = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.href = imageURL;
    link.download = `${projectConfig.value.name}預約紀錄_${finalBookingData.value.戶別}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } catch (error) {
    console.error('截圖失敗:', error);
    alert('截圖失敗，請手動截圖保存。');
  }
};

// 產生並打開 Google 行事曆連結
const addToCalendar = () => {
  const subLabel = finalBookingData.value.subOption ? `-${finalBookingData.value.subOption}` : '';
  const title = `${projectConfig.value.name}-${finalBookingData.value.bookingType}${subLabel}預約 (${finalBookingData.value.戶別})`;
  const dateStr = finalBookingData.value.預約日期;

  const timeMatch = finalBookingData.value.預約時段.match(/(\d{1,2}:\d{2})/);
  const rawTimeStr = timeMatch ? timeMatch[0] : '';
  const timeStr = rawTimeStr.replace(/：/g, ':');

  const startDate = new Date(`${dateStr.replace(/\//g, '-')}T${timeStr}`);

  if (isNaN(startDate.getTime())) {
    alert('無法產生行事曆連結，預約的時間格式可能有誤。');
    console.error('Invalid startDate created:', `${dateStr.replace(/\//g, '-')}T${timeStr}`);
    return;
  }

  const endDate = new Date(startDate.getTime() + 60 * 60 * 1000);
  const formatDate = (date) => date.toISOString().replace(/-|:|\.\d\d\d/g, "");

  // ✓ START: 組合完整的預約資訊作為備註內容
  let eventDetails = `預約資訊摘要：\n\n`;
  eventDetails += `建案：${projectConfig.value.name}\n`;
  eventDetails += `戶別：${finalBookingData.value.戶別}\n`;
  eventDetails += `門牌：${finalBookingData.value.address}\n\n`;
  eventDetails += `預約項目：${finalBookingData.value.bookingType}\n`;
  eventDetails += `選擇方式：${finalBookingData.value.bookingMethod}\n`;
  if (finalBookingData.value.subOption) {
    eventDetails += `子選項：${finalBookingData.value.subOption}\n`;
  }
  if (finalBookingData.value.companyName) {
    eventDetails += `代驗公司：${finalBookingData.value.companyName}\n`;
  }
  eventDetails += `\n預約人：${finalBookingData.value.姓名}\n`;
  eventDetails += `電話：${finalBookingData.value.電話}\n`;
  eventDetails += `Email：${finalBookingData.value.EMAIL}\n`;

  if (finalBookingData.value.受託人姓名) {
    eventDetails += `\n受託人：${finalBookingData.value.受託人姓名}\n`;
    eventDetails += `受託人電話：${finalBookingData.value.受託人電話}\n`;
    eventDetails += `與委託人關係：${finalBookingData.value.受託人關係}\n`;
  }
  // ✓ END: 組合備註內容

  const googleCalendarUrl = `https://www.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(title)}&dates=${formatDate(startDate)}/${formatDate(endDate)}&details=${encodeURIComponent(eventDetails)}&location=${encodeURIComponent(finalBookingData.value.address)}`;

  window.open(googleCalendarUrl, '_blank');
};

// ---  新增: 上傳報告相關 methods ---
const onUploadBuildingChange = (building) => {
  uploadForm.value.unit = null;
  if (!building) {
    uploadUnitList.value = [];
    return;
  }
  // ✓ 從 allUnitsDataForUpload 讀取資料
  uploadUnitList.value = allUnitsDataForUpload.value[building] || [];
};

const triggerFileInput = () => {
  fileInputRef.value.click();
};

const handleFileDrop = (event) => {
  isDragActive.value = false;
  const files = event.dataTransfer.files;
  if (files.length > 0) {
    processFile(files[0]);
  }
};
// 檔案拖放處理
const handleFileSelect = (event) => {
  const files = event.target.files;
  if (files.length > 0) {
    processFile(files[0]);
  }
};

// 處理檔案的邏輯
const processFile = (file) => {
  if (file.type !== 'application/pdf') {
    alert('檔案格式錯誤，僅限上傳 PDF 檔案。');
    return;
  }
  if (file.size > 30 * 1024 * 1024) { // 30MB
    isSizeErrorDialogVisible.value = true;
    return;
  }

  // ✓ 直接儲存原始的 File 物件
  uploadForm.value.file = file;
};

// 處理拖放區的拖曳狀態
const handleUploadSubmit = async () => {
  const { valid } = await uploadStep2FormRef.value.validate(); // 注意 ref 名稱已改
  if (!valid) {
    alert('請填寫所有必填欄位。');
    return;
  }
  if (!uploadForm.value.file) {
    alert('請選擇要上傳的 PDF 檔案。');
    return;
  }

  loadingText.value = '檔案上傳與處理中...';
  isLoading.value = true;
  try {
    const payload = {
      projectId: projectId.value,
      projectName: projectConfig.value.name,
      reportType: uploadForm.value.reportType,
      buyerName: uploadForm.value.buyerName,
      phone: uploadForm.value.phone,
      email: uploadForm.value.email,
      building: uploadForm.value.building,
      unit: uploadForm.value.unit,
      companyName: uploadForm.value.companyName,
      bookingCode: verifiedBookingCode.value, // <-- 新增此行，傳入驗證過的 bookingCode
    };

    const res = await uploadReportDirectlyToDrive(payload, uploadForm.value.file);

    if (res.status === 'success') {
      uploadSuccess.value = true;
    } else {
      uploadErrorDialogMessage.value = res.message.replace(/\n/g, '<br>');
      isUploadErrorDialogVisible.value = true;
    }
  } catch (error) {
    console.error('上傳報告失敗:', error);
    uploadErrorDialogMessage.value = `上傳失敗：${error.message}`;
    isUploadErrorDialogVisible.value = true;
  } finally {
    isLoading.value = false;
  }
};

const resetUploadMode = () => {
  uploadSuccess.value = false;
  uploadForm.value = { ...initialUploadFormState };

  // 新增的重置項目
  uploadStep.value = 1;
  verifiedBookingCode.value = null;

  // 重置兩個表單的驗證狀態
  if (uploadStep1FormRef.value) uploadStep1FormRef.value.resetValidation();
  if (uploadStep2FormRef.value) uploadStep2FormRef.value.resetValidation(); // 注意 ref 名稱已改
};

// 組件卸載時清除計時器，防止內存洩漏
// --- Customer Message Logic ---
const isCustomerMessageDialogOpen = ref(false);
const currentCustomerMessageConfig = ref(null);
const customerMessageForm = ref({
  building: null,
  unit: null,
  idNumber: ''
});
const customerMessageDynamicData = ref({});
const customerMessageFiles = ref([]);
const customerMessageUnitList = ref([]);
const isSubmittingCustomerMessage = ref(false);
const customerMessageFormRef = ref(null);

const openCustomerMessageDialog = (config) => {
  currentCustomerMessageConfig.value = config;
  // Initialize form
  customerMessageForm.value = {
    building: null,
    unit: null,
    idNumber: ''
  };
  customerMessageDynamicData.value = {}; // Reset dynamic data
  customerMessageFiles.value = [];
  customerMessageUnitList.value = [];
  isCustomerMessageDialogOpen.value = true;
};

const onCustomerMessageBuildingChange = (building) => {
  customerMessageForm.value.unit = null;
  if (!building) {
    customerMessageUnitList.value = [];
    return;
  }
  // Try to use allUnitsData (from booking init step) or allUnitsDataForUpload (from upload init step)
  // Assuming booking data is loaded. If not, we might need to fetch it.
  // But initialData.buildings is populated, so allUnitsData should be populated if Step 1 loaded.
  // However, check if allUnitsData is keyed by building.
  // Code at 1347: :items="unitList" which comes from onBuildingChange -> unitList.value = allUnitsData.value[building]
  customerMessageUnitList.value = allUnitsData.value[building] || [];
};

const submitCustomerMessage = async () => {
  const { valid } = await customerMessageFormRef.value.validate();
  if (!valid) return;

  isSubmittingCustomerMessage.value = true;
  try {
    const config = currentCustomerMessageConfig.value;
    const uploadedAttachments = [];

    // 1. Upload Files
    if (config.enableFileUpload && customerMessageFiles.value.length > 0) {
      for (const file of customerMessageFiles.value) {
        const uniqueId = Date.now() + Math.floor(Math.random() * 1000);
        const storagePath = `customer-messages/${projectId.value}/${config.id}/${uniqueId}_${file.name}`;
        const fileRef = storageRef(storage, storagePath);
        const snapshot = await uploadBytes(fileRef, file);
        const downloadUrl = await getDownloadURL(snapshot.ref);

        uploadedAttachments.push({
          name: file.name,
          url: downloadUrl,
          path: storagePath,
          size: file.size,
          type: file.type
        });
      }
    }

    // 2. Prepare Payload
    const payload = {
      projectId: projectId.value,
      building: customerMessageForm.value.building, // Require building/unit usually logic-dependent but we enforce if enabled
      unit: customerMessageForm.value.unit,
      idNumber: customerMessageForm.value.idNumber,
      configId: config.id,
      dynamicData: customerMessageDynamicData.value,
      attachments: uploadedAttachments
    };

    // If building/select is disabled in config, we might not have building/unit. 
    // But submitCustomerMessage backend REQUIRES building/unit to find household.
    // Design implicit: It's tied to a household. So building/unit selection is practically required for now.
    // (The UI code enables loops v-if enableBuildingSelect, so if disabled, these are null)
    // If disabled, user can't select, so backend fails. 
    // Admin config "enableBuildingSelect (必要)" confirms this.

    const res = await httpsCallable(functions, 'bookingApi')({
      action: 'submitCustomerMessage',
      data: payload
    });

    if (res.data.status === 'success') {
      alert('提交成功！');
      isCustomerMessageDialogOpen.value = false;
    } else {
      throw new Error(res.data.message || 'Unknown error');
    }

  } catch (error) {
    console.error('Submit Message Error:', error);
    alert(`提交失敗: ${error.message}`);
  } finally {
    isSubmittingCustomerMessage.value = false;
  }
};

onUnmounted(() => {
  clearTimeoutTimer();
  // [新增] 清除計時器
  if (timerInterval) clearInterval(timerInterval);
  _teardownDevHotkey();
});



const selectBookingType = (type) => {
  selectedBookingType.value = type;
  formStep1.value.bookingType = type;
  step.value = 1;
};

const goBackToStep0 = () => {
  step.value = 0;
  selectedBookingType.value = null;
  formStep1.value.bookingType = null;
  isInstructionsConfirmed.value = false;
};
</script>

<style scoped>
.prose {
  line-height: 1.8;
  font-size: 1rem;
}

.prose p {
  margin-bottom: 1rem;
}

/* TipTap 在後台以空白 <p></p> 表示空白列，前台 v-html 渲染時空段落會塌陷成 0 高度，
   補一個不換行空白讓空白列維持一行高度，保留後台編輯時的排版效果。
   v-html 內容不帶 scoped 屬性，需用 :deep() 才能套到渲染出的段落 */
.prose :deep(p:empty::before) {
  content: "\00a0";
}

.contact-info {
  margin-top: 1.5rem;
  padding-top: 1rem;
  border-top: 1px solid #e0e0e0;
  font-size: 0.9rem;
  color: #555;
}

.contact-info a {
  text-decoration: none;
  color: inherit;
}

/*  新增: 上傳元件樣式 */
.file-drop-zone {
  border: 2px dashed #ccc;
  border-radius: 8px;
  padding: 32px;
  text-align: center;
  cursor: pointer;
  transition: background-color 0.2s ease-in-out, border-color 0.2s ease-in-out;
}

.file-drop-zone:hover,
.file-drop-zone.is-active {
  background-color: #f8f9fa;
  border-color: #007bff;
}

.file-info {
  display: flex;
  align-items: center;
  justify-content: center;
}

/* 常見問答 (FAQ) 漸層標題樣式 */
.faq-panel :deep(.v-expansion-panel-title) {
  transition: background-color 0.3s ease;
}

.faq-panel :deep(.v-expansion-panel-title--active) .faq-title {
  background: linear-gradient(135deg, #1a73e8 0%, #6c5ce7 50%, #a855f7 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.faq-panel :deep(.v-expansion-panel-title--active) {
  background-color: rgba(106, 92, 231, 0.04);
}

/* 未開放預約項目按鈕：hover 時箭頭動一下，提示可點擊 */
.not-open-btn :deep(.v-btn__content) {
  width: 100%;
}

.not-open-btn .not-open-cta {
  transition: opacity 0.2s ease;
  opacity: 0.85;
}

.not-open-btn:hover .not-open-cta {
  opacity: 1;
}

.not-open-btn:hover .not-open-cta .mdi-arrow-right {
  transform: translateX(4px);
  transition: transform 0.2s ease;
}

/* 預約說明按鈕：漸層 + 呼吸光暈 + hover 浮升，提升質感與引導性 */
.instructions-btn {
  background: linear-gradient(135deg, #1a73e8 0%, #6c5ce7 50%, #a855f7 100%) !important;
  color: #fff !important;
  height: 56px !important;
  border-radius: 14px !important;
  letter-spacing: 1px;
  box-shadow:
    0 6px 18px rgba(106, 92, 231, 0.35),
    0 2px 4px rgba(0, 0, 0, 0.05);
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1),
              box-shadow 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
  animation: instructions-pulse 2.8s ease-in-out infinite;
}

/* 高光斜掃效果（hover 時觸發） */
.instructions-btn::before {
  content: '';
  position: absolute;
  top: 0;
  left: -75%;
  width: 50%;
  height: 100%;
  background: linear-gradient(
    120deg,
    transparent 0%,
    rgba(255, 255, 255, 0.25) 50%,
    transparent 100%
  );
  transform: skewX(-20deg);
  pointer-events: none;
}

.instructions-btn:hover {
  transform: translateY(-2px);
  box-shadow:
    0 10px 24px rgba(106, 92, 231, 0.5),
    0 4px 8px rgba(0, 0, 0, 0.08);
  animation: none;
}

.instructions-btn:hover::before {
  animation: instructions-shine 0.9s ease forwards;
}

.instructions-btn:active {
  transform: translateY(0);
  box-shadow: 0 4px 12px rgba(106, 92, 231, 0.4);
}

.instructions-btn-icon {
  font-size: 22px !important;
  filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.15));
}

.instructions-btn-text {
  font-size: 1rem;
  font-weight: 600;
}

.instructions-btn-arrow {
  font-size: 20px !important;
  transition: transform 0.3s ease;
}

.instructions-btn:hover .instructions-btn-arrow {
  transform: translateX(5px);
}

/* 呼吸光暈：未 hover 時持續吸引使用者目光 */
@keyframes instructions-pulse {
  0%, 100% {
    box-shadow:
      0 6px 18px rgba(106, 92, 231, 0.35),
      0 0 0 0 rgba(106, 92, 231, 0.35),
      0 2px 4px rgba(0, 0, 0, 0.05);
  }
  50% {
    box-shadow:
      0 6px 18px rgba(106, 92, 231, 0.45),
      0 0 0 8px rgba(106, 92, 231, 0),
      0 2px 4px rgba(0, 0, 0, 0.05);
  }
}

/* 高光斜掃動畫 */
@keyframes instructions-shine {
  0% {
    left: -75%;
  }
  100% {
    left: 125%;
  }
}

/* ===== 預約說明彈窗 ===== */
.instructions-dialog :deep(.v-overlay__content) {
  border-radius: 24px;
  overflow: hidden;
}

/* 手機全螢幕：取消圓角、占滿視窗 */
.instructions-dialog--fullscreen :deep(.v-overlay__content) {
  border-radius: 0;
  max-height: 100dvh;
  margin: 0;
}

.instructions-card {
  overflow: hidden;
  background: #fafbff;
}

.instructions-card--fullscreen {
  display: flex;
  flex-direction: column;
  height: 100dvh;
  min-height: 100dvh;
  border-radius: 0 !important;
}

.instructions-card--fullscreen .instructions-header {
  flex: 0 0 auto;
  padding: 18px 18px;
}

.instructions-card--fullscreen .instructions-header-icon {
  width: 44px;
  height: 44px;
  border-radius: 12px;
}

.instructions-card--fullscreen .instructions-header-title {
  font-size: 1.1rem;
}

.instructions-card--fullscreen .instructions-header-subtitle {
  font-size: 0.78rem;
}

.instructions-card--fullscreen .instructions-content {
  flex: 1 1 auto;
  max-height: none;
  padding: 20px 18px !important;
  /* iOS 安全區左右內距 */
  padding-left: max(18px, env(safe-area-inset-left)) !important;
  padding-right: max(18px, env(safe-area-inset-right)) !important;
  -webkit-overflow-scrolling: touch;
}

.instructions-card--fullscreen .instructions-scroll-hint {
  flex: 0 0 auto;
  padding: 10px 16px;
}

.instructions-card--fullscreen .instructions-actions {
  flex: 0 0 auto;
  padding: 14px 18px;
  /* iOS 安全區（含底部 home indicator） */
  padding-left: max(18px, env(safe-area-inset-left));
  padding-right: max(18px, env(safe-area-inset-right));
  padding-bottom: max(14px, env(safe-area-inset-bottom));
}

/* 標題列：漸層 + 裝飾光暈 */
.instructions-header {
  position: relative;
  padding: 28px 32px;
  background: linear-gradient(135deg, #1a73e8 0%, #6c5ce7 50%, #a855f7 100%);
  overflow: hidden;
}

.instructions-header-bg {
  position: absolute;
  inset: 0;
  background:
    radial-gradient(circle at 85% 20%, rgba(255, 255, 255, 0.25) 0%, transparent 50%),
    radial-gradient(circle at 15% 80%, rgba(255, 255, 255, 0.15) 0%, transparent 50%);
  pointer-events: none;
}

.instructions-header-content {
  position: relative;
  display: flex;
  align-items: center;
  gap: 18px;
}

.instructions-header-icon {
  width: 56px;
  height: 56px;
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.18);
  backdrop-filter: blur(8px);
  border: 1px solid rgba(255, 255, 255, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.instructions-header-text {
  flex: 1;
  min-width: 0;
}

.instructions-header-title {
  color: #fff;
  font-size: 1.35rem;
  font-weight: 700;
  letter-spacing: 0.5px;
  line-height: 1.4;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
}

.instructions-header-subtitle {
  color: rgba(255, 255, 255, 0.88);
  font-size: 0.85rem;
  font-weight: 500;
  margin-top: 4px;
  display: flex;
  align-items: center;
}

/* 內文捲動區 */
.instructions-content {
  max-height: 58vh;
  overflow-y: auto;
  padding: 28px 32px 24px !important;
  background: #fff;
  scrollbar-width: thin;
  scrollbar-color: #c5c7e0 transparent;
}

.instructions-content::-webkit-scrollbar {
  width: 8px;
}

.instructions-content::-webkit-scrollbar-track {
  background: transparent;
}

.instructions-content::-webkit-scrollbar-thumb {
  background: #c5c7e0;
  border-radius: 4px;
}

.instructions-content::-webkit-scrollbar-thumb:hover {
  background: #9a9cc4;
}

.instructions-end-anchor {
  margin-top: 24px;
}

/* Dialog 內附件下載區塊 */
.dialog-attachments {
  margin-top: 28px;
  padding: 18px 18px 16px;
  background: linear-gradient(135deg, #f4f1ff 0%, #eef2ff 100%);
  border: 1px solid #d8d2f5;
  border-radius: 14px;
}

.dialog-attachments-header {
  display: flex;
  align-items: center;
  margin-bottom: 6px;
}

.dialog-attachments-title {
  font-size: 1rem;
  font-weight: 700;
  color: #4a3fb8;
  letter-spacing: 0.5px;
}

.dialog-attachments-hint {
  display: flex;
  align-items: center;
  font-size: 0.8rem;
  color: #6b6b8a;
  margin-bottom: 12px;
}

.dialog-attachments-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.dialog-attachment-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  background: #fff;
  border: 1px solid #e5e0f7;
  border-radius: 10px;
  cursor: pointer;
  transition: background 0.18s ease, border-color 0.18s ease, transform 0.18s ease;
}

.dialog-attachment-item:hover {
  background: #faf8ff;
  border-color: #b9aee8;
  transform: translateY(-1px);
}

.dialog-attachment-icon {
  flex: 0 0 auto;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
}

.dialog-attachment-name {
  flex: 1 1 auto;
  font-size: 0.95rem;
  font-weight: 600;
  color: #2d2d44;
  word-break: break-all;
  line-height: 1.4;
}

@media (max-width: 480px) {
  .dialog-attachments {
    padding: 14px 12px;
  }

  .dialog-attachment-item {
    padding: 10px;
    gap: 8px;
  }

  .dialog-attachment-name {
    font-size: 0.9rem;
  }
}

/* ===== 附件預覽 Dialog ===== */
.attachment-preview-card {
  background: #1f1f23;
}

.attachment-preview-toolbar {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 6px 12px !important;
  background: #f5f5f7 !important;
  min-height: 52px;
}

.attachment-preview-name {
  flex: 1 1 auto;
  min-width: 0;
  font-size: 0.95rem;
  font-weight: 600;
  color: #2d2d44;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin-right: 8px;
}

.preview-zoom-text {
  min-width: 46px;
  text-align: center;
  font-size: 0.82rem;
  font-weight: 600;
  color: #4a4a6a;
  user-select: none;
}

.attachment-preview-content {
  background: #2c2c30;
  position: relative;
  overflow: hidden;
}

.attachment-iframe {
  width: 100%;
  height: 100%;
  border: none;
  background: #fff;
  display: block;
}

.image-zoom-container {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  touch-action: none;
  user-select: none;
  -webkit-user-select: none;
  cursor: zoom-in;
}

.image-zoom-container.is-zoomed {
  cursor: grab;
}

.image-zoom-container.is-zoomed.is-panning {
  cursor: grabbing;
}

.image-zoom-img {
  max-width: 100%;
  max-height: 100%;
  width: auto;
  height: auto;
  object-fit: contain;
  transform-origin: center center;
  will-change: transform;
  pointer-events: none;
  -webkit-user-drag: none;
}

@media (max-width: 600px) {
  .attachment-preview-toolbar {
    padding: 6px 8px !important;
    min-height: 48px;
  }

  .attachment-preview-name {
    font-size: 0.88rem;
    margin-right: 4px;
  }

  .preview-zoom-text {
    min-width: 40px;
    font-size: 0.75rem;
  }
}

.instructions-end-hint {
  text-align: center;
  color: #16a34a;
  font-size: 0.9rem;
  font-weight: 600;
  padding: 8px 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* 未讀完提示條 */
.instructions-scroll-hint {
  background: linear-gradient(180deg, rgba(255, 255, 255, 0) 0%, rgba(106, 92, 231, 0.08) 100%);
  color: #6c5ce7;
  font-size: 0.85rem;
  font-weight: 600;
  text-align: center;
  padding: 8px 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-top: 1px dashed rgba(106, 92, 231, 0.25);
}

.scroll-hint-icon {
  animation: scroll-hint-bounce 1.5s ease-in-out infinite;
}

@keyframes scroll-hint-bounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(4px); }
}

/* 動作區 */
.instructions-actions {
  padding: 20px 32px 28px;
  background: linear-gradient(180deg, #ffffff 0%, #f3f4ff 100%);
  border-top: 1px solid rgba(106, 92, 231, 0.12);
}

/* CTA 按鈕：我已閱讀並同意，開始預約 */
.instructions-cta-btn {
  height: 60px !important;
  border-radius: 16px !important;
  font-size: 1.05rem !important;
  font-weight: 700 !important;
  letter-spacing: 1px;
  background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%) !important;
  color: #fff !important;
  box-shadow:
    0 8px 24px rgba(17, 153, 142, 0.4),
    0 2px 4px rgba(0, 0, 0, 0.06);
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1),
              box-shadow 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
  animation: cta-pulse 2.5s ease-in-out infinite;
}

.instructions-cta-btn::before {
  content: '';
  position: absolute;
  top: 0;
  left: -75%;
  width: 50%;
  height: 100%;
  background: linear-gradient(
    120deg,
    transparent 0%,
    rgba(255, 255, 255, 0.3) 50%,
    transparent 100%
  );
  transform: skewX(-20deg);
  pointer-events: none;
}

.instructions-cta-btn:hover {
  transform: translateY(-2px);
  box-shadow:
    0 12px 28px rgba(17, 153, 142, 0.55),
    0 4px 8px rgba(0, 0, 0, 0.08);
  animation: none;
}

.instructions-cta-btn:hover::before {
  animation: instructions-shine 0.9s ease forwards;
}

.instructions-cta-btn:active {
  transform: translateY(0);
}

.cta-check-icon {
  font-size: 24px !important;
  filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.15));
}

.cta-arrow-icon {
  font-size: 22px !important;
  transition: transform 0.3s ease;
}

.instructions-cta-btn:hover .cta-arrow-icon {
  transform: translateX(6px);
}

.cta-text {
  font-weight: 700;
}

/* CTA 呼吸動畫 */
@keyframes cta-pulse {
  0%, 100% {
    box-shadow:
      0 8px 24px rgba(17, 153, 142, 0.4),
      0 0 0 0 rgba(17, 153, 142, 0.4),
      0 2px 4px rgba(0, 0, 0, 0.06);
  }
  50% {
    box-shadow:
      0 8px 24px rgba(17, 153, 142, 0.5),
      0 0 0 10px rgba(17, 153, 142, 0),
      0 2px 4px rgba(0, 0, 0, 0.06);
  }
}

/* 鎖定狀態按鈕 */
.instructions-cta-btn--disabled {
  background: #e0e3f0 !important;
  color: #8a8fa8 !important;
  box-shadow: none !important;
  animation: none !important;
  cursor: not-allowed;
}

.instructions-cta-btn--disabled::before {
  display: none;
}

/* 純關閉按鈕 */
.instructions-close-btn {
  height: 56px !important;
  border-radius: 14px !important;
  font-size: 1rem !important;
  font-weight: 600 !important;
  letter-spacing: 0.5px;
  background: linear-gradient(135deg, #6c5ce7 0%, #a855f7 100%) !important;
  color: #fff !important;
  box-shadow: 0 6px 18px rgba(106, 92, 231, 0.35);
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1),
              box-shadow 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.instructions-close-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 22px rgba(106, 92, 231, 0.5);
}

/* CTA 出現動畫 */
.cta-rise-enter-active,
.cta-rise-leave-active {
  transition: opacity 0.4s ease, transform 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

.cta-rise-enter-from,
.cta-rise-leave-to {
  opacity: 0;
  transform: translateY(12px) scale(0.98);
}

/* 滑動提示淡入淡出 */
.fade-slide-enter-active,
.fade-slide-leave-active {
  transition: opacity 0.3s ease, transform 0.3s ease;
}

.fade-slide-enter-from,
.fade-slide-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}

/* ===== 預約資訊確認頁 (step 3) ===== */
.confirm-step {
  background: linear-gradient(180deg, #fafbff 0%, #f3f4ff 100%);
}

.confirm-content {
  background: transparent;
}

/* 標題列 */
.confirm-header {
  position: relative;
  padding: 28px 28px;
  background: linear-gradient(135deg, #1a73e8 0%, #6c5ce7 50%, #a855f7 100%);
  overflow: hidden;
}

.confirm-header-bg {
  position: absolute;
  inset: 0;
  background:
    radial-gradient(circle at 85% 20%, rgba(255, 255, 255, 0.25) 0%, transparent 50%),
    radial-gradient(circle at 15% 80%, rgba(255, 255, 255, 0.12) 0%, transparent 55%);
  pointer-events: none;
}

.confirm-header-content {
  position: relative;
  display: flex;
  align-items: center;
  gap: 16px;
}

.confirm-header-icon {
  width: 58px;
  height: 58px;
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.18);
  backdrop-filter: blur(8px);
  border: 1px solid rgba(255, 255, 255, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.confirm-header-title {
  color: #fff;
  font-size: 1.3rem;
  font-weight: 700;
  letter-spacing: 0.5px;
  line-height: 1.4;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
}

.confirm-header-subtitle {
  color: rgba(255, 255, 255, 0.88);
  font-size: 0.85rem;
  font-weight: 500;
  margin-top: 4px;
  display: flex;
  align-items: center;
}

/* 內文容器 */
.confirm-body {
  padding: 20px 20px 8px;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

/* 倒數計時 banner */
.confirm-timer-banner {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 14px 16px;
  background: linear-gradient(135deg, #f97316 0%, #ef4444 100%);
  border-radius: 14px;
  box-shadow: 0 6px 18px rgba(239, 68, 68, 0.3);
  color: #fff;
  animation: timer-glow 2s ease-in-out infinite;
}

@keyframes timer-glow {
  0%, 100% { box-shadow: 0 6px 18px rgba(239, 68, 68, 0.3); }
  50% { box-shadow: 0 6px 22px rgba(239, 68, 68, 0.5); }
}

.confirm-timer-icon {
  width: 40px;
  height: 40px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.confirm-timer-text {
  flex: 1;
  min-width: 0;
}

.confirm-timer-title {
  font-size: 0.95rem;
  font-weight: 700;
  letter-spacing: 0.3px;
}

.confirm-timer-hint {
  font-size: 0.75rem;
  opacity: 0.9;
  margin-top: 2px;
}

.confirm-timer-clock {
  text-align: center;
  padding: 4px 12px;
  background: rgba(0, 0, 0, 0.15);
  border-radius: 10px;
  flex-shrink: 0;
}

.confirm-timer-label {
  font-size: 0.65rem;
  opacity: 0.85;
  letter-spacing: 0.5px;
}

.confirm-timer-value {
  font-size: 1.25rem;
  font-weight: 800;
  font-variant-numeric: tabular-nums;
  letter-spacing: 1px;
}

/* 區塊卡片 */
.confirm-section {
  background: #fff;
  border-radius: 16px;
  padding: 16px 18px;
  box-shadow:
    0 2px 8px rgba(26, 115, 232, 0.06),
    0 1px 2px rgba(0, 0, 0, 0.04);
  border: 1px solid rgba(26, 115, 232, 0.08);
  transition: box-shadow 0.3s ease, transform 0.3s ease;
}

.confirm-section:hover {
  box-shadow:
    0 6px 16px rgba(26, 115, 232, 0.1),
    0 2px 4px rgba(0, 0, 0, 0.05);
  transform: translateY(-1px);
}

.confirm-section--featured {
  background: linear-gradient(135deg, #fff 0%, #f5f3ff 100%);
  border: 1px solid rgba(168, 85, 247, 0.2);
  box-shadow:
    0 4px 14px rgba(106, 92, 231, 0.12),
    0 1px 2px rgba(0, 0, 0, 0.04);
}

.confirm-section--accent {
  background: linear-gradient(135deg, #fff 0%, #fdf4ff 100%);
  border: 1px solid rgba(168, 85, 247, 0.2);
}

.confirm-section-title {
  display: flex;
  align-items: center;
  font-size: 0.9rem;
  font-weight: 700;
  color: #475569;
  letter-spacing: 0.5px;
  padding-bottom: 10px;
  margin-bottom: 4px;
  border-bottom: 1px dashed rgba(100, 116, 139, 0.15);
}

.confirm-section-body {
  display: flex;
  flex-direction: column;
}

/* 單筆項目 */
.confirm-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 10px 0;
  border-bottom: 1px dashed rgba(100, 116, 139, 0.1);
}

.confirm-item:last-child {
  border-bottom: none;
}

.confirm-item-label {
  display: flex;
  align-items: center;
  color: #64748b;
  font-size: 0.85rem;
  font-weight: 500;
  flex-shrink: 0;
}

.confirm-item-value {
  color: #1e293b;
  font-size: 0.95rem;
  font-weight: 600;
  text-align: right;
  word-break: break-all;
}

.confirm-item-value--highlight {
  color: #6c5ce7;
  font-size: 1rem;
  font-weight: 700;
  letter-spacing: 0.5px;
}

.confirm-item-value--email {
  font-family: 'Menlo', 'Consolas', monospace;
  font-size: 0.85rem;
  font-weight: 500;
}

/* 預約時間：雙卡片網格 */
.confirm-time-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  margin-top: 6px;
}

.confirm-time-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 14px 10px;
  background: #fff;
  border-radius: 12px;
  border: 1px solid rgba(168, 85, 247, 0.18);
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.confirm-time-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(106, 92, 231, 0.15);
}

.confirm-time-label {
  font-size: 0.75rem;
  color: #64748b;
  font-weight: 500;
  margin-bottom: 4px;
  letter-spacing: 0.5px;
}

.confirm-time-value {
  font-size: 1.05rem;
  font-weight: 700;
  color: #1e293b;
  letter-spacing: 0.5px;
}

/* 動作區 */
.confirm-actions {
  display: flex;
  gap: 12px;
  padding: 20px;
  background: linear-gradient(180deg, transparent 0%, rgba(255, 255, 255, 0.9) 30%, #fff 100%);
  border-top: 1px solid rgba(26, 115, 232, 0.08);
}

.confirm-back-btn {
  height: 56px !important;
  border-radius: 14px !important;
  font-size: 0.95rem !important;
  font-weight: 600 !important;
  letter-spacing: 0.5px;
  border: 1.5px solid #cbd5e1 !important;
  color: #475569 !important;
  background: #fff !important;
  flex-shrink: 0;
  transition: all 0.25s ease;
}

.confirm-back-btn:hover {
  border-color: #94a3b8 !important;
  background: #f8fafc !important;
  transform: translateY(-1px);
}

.confirm-submit-btn {
  flex: 1;
  height: 60px !important;
  border-radius: 16px !important;
  font-size: 1.05rem !important;
  font-weight: 700 !important;
  letter-spacing: 1px;
  background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%) !important;
  color: #fff !important;
  box-shadow:
    0 8px 24px rgba(17, 153, 142, 0.4),
    0 2px 4px rgba(0, 0, 0, 0.06);
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1),
              box-shadow 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
  animation: cta-pulse 2.5s ease-in-out infinite;
}

.confirm-submit-btn::before {
  content: '';
  position: absolute;
  top: 0;
  left: -75%;
  width: 50%;
  height: 100%;
  background: linear-gradient(
    120deg,
    transparent 0%,
    rgba(255, 255, 255, 0.3) 50%,
    transparent 100%
  );
  transform: skewX(-20deg);
  pointer-events: none;
}

.confirm-submit-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow:
    0 12px 28px rgba(17, 153, 142, 0.55),
    0 4px 8px rgba(0, 0, 0, 0.08);
  animation: none;
}

.confirm-submit-btn:hover:not(:disabled)::before {
  animation: instructions-shine 0.9s ease forwards;
}

.confirm-submit-btn:active {
  transform: translateY(0);
}

.confirm-submit-check {
  font-size: 22px !important;
  filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.15));
}

.confirm-submit-arrow {
  font-size: 20px !important;
  transition: transform 0.3s ease;
}

.confirm-submit-btn:hover .confirm-submit-arrow {
  transform: translateX(5px);
}

.confirm-submit-text {
  font-weight: 700;
}

/* 響應式：手機版調整 */
@media (max-width: 600px) {
  .confirm-header {
    padding: 22px 18px;
  }

  .confirm-header-title {
    font-size: 1.15rem;
  }

  .confirm-header-icon {
    width: 50px;
    height: 50px;
  }

  .confirm-body {
    padding: 16px 14px 8px;
  }

  .confirm-section {
    padding: 14px 14px;
  }

  .confirm-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 4px;
  }

  .confirm-item-value {
    text-align: left;
  }

  .confirm-actions {
    flex-direction: column-reverse;
    padding: 16px 14px;
  }

  .confirm-back-btn,
  .confirm-submit-btn {
    width: 100%;
    height: 64px !important;
    min-height: 64px !important;
    font-size: 1.05rem !important;
    border-radius: 16px !important;
    padding: 0 20px !important;
  }

  /* 強制覆寫 Vuetify v-btn 內層高度與內距 */
  .confirm-back-btn :deep(.v-btn__content),
  .confirm-submit-btn :deep(.v-btn__content) {
    min-height: 64px;
    padding: 8px 0;
    line-height: 1.2;
  }

  .confirm-submit-btn .confirm-submit-check {
    font-size: 22px !important;
  }

  .confirm-submit-btn .confirm-submit-arrow {
    font-size: 20px !important;
  }

  .confirm-submit-btn .confirm-submit-text {
    font-size: 1.05rem;
    letter-spacing: 1px;
  }

  .confirm-timer-banner {
    padding: 12px 14px;
    gap: 10px;
  }

  .confirm-timer-value {
    font-size: 1.1rem;
  }
}

/* ===== 流程步驟導航區 (Step 1 / Step 2 / Upload Step 1 / Upload Step 2) ===== */
/* 與「確認預約」「預約成功」頁面動作區風格一致 */
.step-nav-actions {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 20px;
  background: linear-gradient(180deg, transparent 0%, rgba(255, 255, 255, 0.9) 30%, #fff 100%);
  border-top: 1px solid rgba(26, 115, 232, 0.08);
}

.step-nav-actions--single {
  justify-content: flex-end;
}

.step-back-btn {
  height: 56px !important;
  border-radius: 14px !important;
  font-size: 0.95rem !important;
  font-weight: 600 !important;
  letter-spacing: 0.5px;
  border: 1.5px solid #cbd5e1 !important;
  color: #475569 !important;
  background: #fff !important;
  flex-shrink: 0;
  transition: all 0.25s ease;
}

.step-back-btn:hover {
  border-color: #94a3b8 !important;
  background: #f8fafc !important;
  transform: translateY(-1px);
}

.step-next-btn {
  flex: 1;
  height: 60px !important;
  border-radius: 16px !important;
  font-size: 1.05rem !important;
  font-weight: 700 !important;
  letter-spacing: 1px;
  background: linear-gradient(135deg, #1a73e8 0%, #6c5ce7 50%, #a855f7 100%) !important;
  color: #fff !important;
  box-shadow:
    0 8px 24px rgba(106, 92, 231, 0.4),
    0 2px 4px rgba(0, 0, 0, 0.06);
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1),
              box-shadow 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
}

.step-next-btn::before {
  content: '';
  position: absolute;
  top: 0;
  left: -75%;
  width: 50%;
  height: 100%;
  background: linear-gradient(
    120deg,
    transparent 0%,
    rgba(255, 255, 255, 0.3) 50%,
    transparent 100%
  );
  transform: skewX(-20deg);
  pointer-events: none;
}

.step-next-btn:hover:not(:disabled):not(.v-btn--disabled) {
  transform: translateY(-2px);
  box-shadow:
    0 12px 28px rgba(106, 92, 231, 0.55),
    0 4px 8px rgba(0, 0, 0, 0.08);
}

.step-next-btn:hover:not(:disabled):not(.v-btn--disabled)::before {
  animation: instructions-shine 0.9s ease forwards;
}

.step-next-btn:active {
  transform: translateY(0);
}

.step-next-btn.v-btn--disabled {
  opacity: 0.55 !important;
  filter: grayscale(0.25);
}

/* 上傳模式：完成動作改用綠色漸層 (送出感) */
.step-next-btn--finish {
  background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%) !important;
  box-shadow:
    0 8px 24px rgba(17, 153, 142, 0.4),
    0 2px 4px rgba(0, 0, 0, 0.06);
}

.step-next-btn--finish:hover:not(:disabled):not(.v-btn--disabled) {
  box-shadow:
    0 12px 28px rgba(17, 153, 142, 0.55),
    0 4px 8px rgba(0, 0, 0, 0.08);
}

.step-next-icon {
  font-size: 22px !important;
  filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.15));
}

.step-next-arrow {
  font-size: 20px !important;
  transition: transform 0.3s ease;
}

.step-next-btn:hover:not(.v-btn--disabled) .step-next-arrow {
  transform: translateX(5px);
}

.step-next-text {
  font-weight: 700;
}

/* 響應式：手機版 */
@media (max-width: 600px) {
  .step-nav-actions {
    flex-direction: column-reverse;
    padding: 16px 14px;
    gap: 10px;
  }

  .step-nav-actions--single {
    flex-direction: column;
  }

  .step-back-btn,
  .step-next-btn {
    width: 100%;
    height: 60px !important;
    min-height: 60px !important;
    font-size: 1rem !important;
    border-radius: 16px !important;
    padding: 0 20px !important;
  }

  .step-back-btn :deep(.v-btn__content),
  .step-next-btn :deep(.v-btn__content) {
    min-height: 60px;
    padding: 8px 0;
    line-height: 1.2;
  }

  .step-next-text {
    font-size: 1rem;
    letter-spacing: 0.8px;
  }

  .step-next-icon {
    font-size: 20px !important;
  }

  .step-next-arrow {
    font-size: 18px !important;
  }
}

/* ===== 預約成功頁 (step 4) ===== */
.success-step {
  background: linear-gradient(180deg, #fafbff 0%, #f3f4ff 100%);
}

.success-content {
  background: transparent;
}

/* 慶祝標題列：綠色漸層 + 紙花動畫 */
.success-header {
  position: relative;
  padding: 36px 24px 32px;
  background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%);
  overflow: hidden;
  text-align: center;
}

.success-header-bg {
  position: absolute;
  inset: 0;
  background:
    radial-gradient(circle at 80% 15%, rgba(255, 255, 255, 0.3) 0%, transparent 50%),
    radial-gradient(circle at 20% 85%, rgba(255, 255, 255, 0.15) 0%, transparent 55%);
  pointer-events: none;
}

/* 紙花裝飾 */
.success-confetti {
  position: absolute;
  inset: 0;
  pointer-events: none;
  overflow: hidden;
}

.success-confetti span {
  position: absolute;
  top: -10px;
  width: 8px;
  height: 8px;
  background: #fff;
  opacity: 0;
  animation: confetti-fall 3s ease-in calc(var(--i) * 0.2s) infinite;
}

.success-confetti span:nth-child(1)  { left: 8%;  background: #fde047; }
.success-confetti span:nth-child(2)  { left: 18%; background: #f9a8d4; border-radius: 50%; }
.success-confetti span:nth-child(3)  { left: 28%; background: #93c5fd; }
.success-confetti span:nth-child(4)  { left: 38%; background: #fff;    border-radius: 50%; }
.success-confetti span:nth-child(5)  { left: 48%; background: #fde047; }
.success-confetti span:nth-child(6)  { left: 58%; background: #f9a8d4; border-radius: 50%; }
.success-confetti span:nth-child(7)  { left: 68%; background: #93c5fd; }
.success-confetti span:nth-child(8)  { left: 78%; background: #fff;    border-radius: 50%; }
.success-confetti span:nth-child(9)  { left: 88%; background: #fde047; }
.success-confetti span:nth-child(10) { left: 33%; background: #f9a8d4; }
.success-confetti span:nth-child(11) { left: 63%; background: #93c5fd; border-radius: 50%; }
.success-confetti span:nth-child(12) { left: 83%; background: #fde047; }

@keyframes confetti-fall {
  0% {
    transform: translateY(0) rotate(0deg);
    opacity: 0;
  }
  10% {
    opacity: 1;
  }
  100% {
    transform: translateY(220px) rotate(720deg);
    opacity: 0;
  }
}

.success-header-content {
  position: relative;
  z-index: 1;
}

/* 打勾圖示：擴散光環 + 漸入 */
.success-check-wrap {
  position: relative;
  width: 92px;
  height: 92px;
  margin: 0 auto 16px;
}

.success-check-ring {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.25);
  animation: success-ring-pulse 2s ease-out infinite;
}

@keyframes success-ring-pulse {
  0% {
    transform: scale(0.85);
    opacity: 0.8;
  }
  100% {
    transform: scale(1.4);
    opacity: 0;
  }
}

.success-check-circle {
  position: relative;
  width: 92px;
  height: 92px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(8px);
  border: 2px solid rgba(255, 255, 255, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow:
    0 8px 24px rgba(0, 0, 0, 0.15),
    inset 0 2px 8px rgba(255, 255, 255, 0.3);
  animation: success-check-pop 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
}

@keyframes success-check-pop {
  0% {
    transform: scale(0);
    opacity: 0;
  }
  60% {
    transform: scale(1.15);
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
}

.success-title {
  color: #fff;
  font-size: 1.75rem;
  font-weight: 800;
  letter-spacing: 2px;
  margin: 0 0 8px;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.15);
  animation: success-fade-up 0.6s ease-out 0.2s both;
}

.success-subtitle {
  color: rgba(255, 255, 255, 0.95);
  font-size: 0.9rem;
  margin: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  animation: success-fade-up 0.6s ease-out 0.35s both;
}

@keyframes success-fade-up {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* 內文容器 */
.success-body {
  padding: 20px 20px 8px;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

/* 預約代碼卡片 (Hero 級資訊) */
.success-code-card {
  position: relative;
  padding: 22px 20px;
  background:
    linear-gradient(135deg, #fffbeb 0%, #fff 60%, #ecfeff 100%);
  border-radius: 18px;
  border: 2px dashed rgba(245, 158, 11, 0.4);
  text-align: center;
  box-shadow: 0 6px 20px rgba(245, 158, 11, 0.12);
  overflow: hidden;
}

.success-code-card::before {
  content: '';
  position: absolute;
  top: -40%;
  right: -10%;
  width: 140px;
  height: 140px;
  background: radial-gradient(circle, rgba(245, 158, 11, 0.15) 0%, transparent 70%);
  border-radius: 50%;
  pointer-events: none;
}

.success-code-card::after {
  content: '';
  position: absolute;
  bottom: -40%;
  left: -10%;
  width: 140px;
  height: 140px;
  background: radial-gradient(circle, rgba(6, 182, 212, 0.12) 0%, transparent 70%);
  border-radius: 50%;
  pointer-events: none;
}

.success-code-label {
  display: flex;
  align-items: center;
  justify-content: center;
  color: #92400e;
  font-size: 0.85rem;
  font-weight: 600;
  letter-spacing: 1px;
  margin-bottom: 8px;
  position: relative;
}

.success-code-value {
  font-size: 2rem;
  font-weight: 800;
  letter-spacing: 3px;
  background: linear-gradient(135deg, #d97706 0%, #dc2626 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  font-variant-numeric: tabular-nums;
  font-family: 'Menlo', 'Consolas', monospace;
  line-height: 1.2;
  margin-bottom: 8px;
  position: relative;
  text-shadow: 0 2px 8px rgba(220, 38, 38, 0.15);
}

.success-code-hint {
  display: flex;
  align-items: center;
  justify-content: center;
  color: #78716c;
  font-size: 0.75rem;
  font-weight: 500;
  position: relative;
}

/* 重要提醒 */
.success-notice {
  background: linear-gradient(135deg, #fffbeb 0%, #fefce8 100%);
  border: 1px solid rgba(245, 158, 11, 0.25);
  border-left: 4px solid #f59e0b;
  border-radius: 14px;
  padding: 16px 18px;
  box-shadow: 0 2px 8px rgba(245, 158, 11, 0.08);
}

.success-notice-title {
  display: flex;
  align-items: center;
  color: #92400e;
  font-size: 0.95rem;
  font-weight: 700;
  letter-spacing: 0.5px;
  margin-bottom: 8px;
}

.success-notice-body {
  color: #44403c;
  font-size: 0.9rem;
  line-height: 1.7;
}

/* 動作區 */
.success-actions {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 20px;
  background: linear-gradient(180deg, transparent 0%, rgba(255, 255, 255, 0.9) 30%, #fff 100%);
  border-top: 1px solid rgba(26, 115, 232, 0.08);
}

.success-primary-btn {
  height: 58px !important;
  border-radius: 16px !important;
  font-size: 1.05rem !important;
  font-weight: 700 !important;
  letter-spacing: 1px;
  background: linear-gradient(135deg, #1a73e8 0%, #6c5ce7 50%, #a855f7 100%) !important;
  color: #fff !important;
  box-shadow:
    0 8px 22px rgba(106, 92, 231, 0.4),
    0 2px 4px rgba(0, 0, 0, 0.06);
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1),
              box-shadow 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
}

.success-primary-btn::before {
  content: '';
  position: absolute;
  top: 0;
  left: -75%;
  width: 50%;
  height: 100%;
  background: linear-gradient(
    120deg,
    transparent 0%,
    rgba(255, 255, 255, 0.3) 50%,
    transparent 100%
  );
  transform: skewX(-20deg);
  pointer-events: none;
}

.success-primary-btn:hover {
  transform: translateY(-2px);
  box-shadow:
    0 12px 28px rgba(106, 92, 231, 0.55),
    0 4px 8px rgba(0, 0, 0, 0.08);
}

.success-primary-btn:hover::before {
  animation: instructions-shine 0.9s ease forwards;
}

.success-primary-btn:active {
  transform: translateY(0);
}

.success-primary-icon {
  font-size: 22px !important;
  filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.15));
}

.success-primary-text {
  font-weight: 700;
}

/* 次要動作 (截圖 / 加入行事曆) */
.success-secondary-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}

.success-secondary-btn {
  height: 50px !important;
  border-radius: 14px !important;
  font-size: 0.95rem !important;
  font-weight: 600 !important;
  letter-spacing: 0.5px;
  border: 1.5px solid #cbd5e1 !important;
  color: #475569 !important;
  background: #fff !important;
  transition: all 0.25s ease;
}

.success-secondary-btn:hover {
  border-color: #6c5ce7 !important;
  color: #6c5ce7 !important;
  background: #faf5ff !important;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(106, 92, 231, 0.12);
}

/* 響應式：手機版 */
@media (max-width: 600px) {
  .success-header {
    padding: 30px 18px 26px;
  }

  .success-check-wrap {
    width: 78px;
    height: 78px;
  }

  .success-check-circle {
    width: 78px;
    height: 78px;
  }

  .success-title {
    font-size: 1.5rem;
    letter-spacing: 1.5px;
  }

  .success-body {
    padding: 16px 14px 8px;
  }

  .success-code-value {
    font-size: 1.6rem;
    letter-spacing: 2px;
  }

  .success-actions {
    padding: 16px 14px;
  }

  .success-primary-btn {
    height: 54px !important;
  }
}

.not-open-btn .not-open-cta .mdi-arrow-right {
  transition: transform 0.2s ease;
}

/* 聯絡/資訊按鈕的反光掃過動畫 (Shimmer Effect) */
.shimmer-button {
  position: relative;
  overflow: hidden;
}

.shimmer-button::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 50%;
  height: 100%;
  background: linear-gradient(to right,
      rgba(255, 255, 255, 0) 0%,
      rgba(255, 255, 255, 0.4) 50%,
      rgba(255, 255, 255, 0) 100%);
  transform: skewX(-20deg);
  animation: shimmer 4s infinite;
  /* 總時間長度包含間歇 */
}

@keyframes shimmer {
  0% {
    left: -100%;
  }

  80% {
    left: 200%;
  }

  /* 反光掃過時間佔比 */
  100% {
    left: 200%;
  }

  /* 剩餘時間為間歇停頓 */
}

/* 日期選擇提醒事項的樣式 */
.date-picker-reminder {
  border-radius: 8px !important;
}

.date-picker-reminder .reminder-content {
  font-size: 0.95rem;
  line-height: 1.7;
}

.date-picker-reminder .reminder-content :deep(ul),
.date-picker-reminder .reminder-content :deep(ol) {
  padding-left: 1.5em;
  margin-top: 4px;
}

.date-picker-reminder .reminder-content :deep(li) {
  margin-bottom: 4px;
}

.date-picker-reminder .reminder-content :deep(strong) {
  color: #e65100;
  /* 深橘色，加重提醒感 */
}

/* 表單驗證失敗時的欄位強化樣式 */
:deep(.v-input--error) {
  animation: shake 0.4s ease-in-out;
}

:deep(.v-input--error .v-field) {
  background-color: rgba(244, 67, 54, 0.04) !important;
  border-color: #F44336 !important;
}

:deep(.v-input--error .v-field__outline) {
  --v-field-border-opacity: 1;
}

/* 搖晃動畫 - 驗證失敗時吸引注意力 */
@keyframes shake {

  0%,
  100% {
    transform: translateX(0);
  }

  20% {
    transform: translateX(-6px);
  }

  40% {
    transform: translateX(6px);
  }

  60% {
    transform: translateX(-4px);
  }

  80% {
    transform: translateX(4px);
  }
}

/* Snackbar 驗證提示的樣式 */
.validation-snackbar :deep(.v-snackbar__content) {
  font-size: 1rem;
}

/* 批次未開放提示區塊 */
.batch-not-open-alert {
  animation: fadeSlideIn 0.4s ease-out;
}

@keyframes fadeSlideIn {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* 預約詳情確認對話框樣式 */
.appointment-details {
  padding: 0 8px;
}

.detail-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 0;
}

.detail-label {
  flex: 0 0 auto;
  font-weight: 600;
  color: #555;
  min-width: 120px;
}

.detail-value {
  flex: 1;
  text-align: right;
  color: #333;
  word-break: break-word;
  margin-left: 16px;
}
</style>