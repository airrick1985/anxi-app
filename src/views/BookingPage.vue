<template>
  <v-container fluid style="background-color: #F4F4F7; min-height: 100vh;">
    
     <v-overlay
  :model-value="isLoading"
  class="align-center justify-center"
  persistent
>
  <div class="d-flex align-center">
    <v-progress-circular
      color="white"
      indeterminate
      size="50" ></v-progress-circular>

    <div class="text-white ml-4" >{{ loadingText }}</div>
  </div>
</v-overlay>
    
    
    <v-row justify="center">
      <v-col cols="12" md="8" lg="6">

 <v-card v-if="isLoading && !projectConfig" class="mx-auto">
          <v-card-text class="text-center py-8">
            <v-progress-circular
              :size="64"
              :width="4"
              color="primary"
              indeterminate
              class="mb-4"
            ></v-progress-circular>
            <h3 class="text-h6 mb-2">載入中...</h3>
            <p class="text-grey">正在載入建案資訊，請稍候</p>
          </v-card-text>
        </v-card>


        <div v-if="projectConfig && projectConfig.logoUrl" class="d-flex justify-center py-2">
          <img :src="projectConfig.logoUrl" alt="Project Logo" style="max-height: 40px; object-fit: contain;">
        </div>

        <v-card v-if="projectConfig" class="mx-auto" :loading="isLoading">
          <template v-if="isUploadMode">
            <v-card-title 
              class="text-h5 font-weight-bold py-2 d-flex align-center"
              :style="{ backgroundColor: projectConfig.themeColor, color: 'white' }"
            >
              <v-btn
                v-if="!uploadSuccess"
                icon="mdi-arrow-left"
                variant="text"
                @click="isUploadMode = false"
                :disabled="isLoading"
                class="mr-3"
              ></v-btn>
              <span>{{ projectConfig.name }} 上傳驗屋報告</span>
            </v-card-title>
            <v-divider></v-divider>

            <div v-if="!uploadSuccess">
              <v-card-text>
                <div class="prose mb-6" v-html="projectConfig.reportUploadIntro.body"></div>
                <v-alert
                    v-if="projectConfig.reportUploadIntro.alert.show"
                    :color="projectConfig.reportUploadIntro.alert.color"
                    :type="projectConfig.reportUploadIntro.alert.type"
                    class="mb-4"
                    border="start"
                    density="compact"
                >
                    <template v-slot:title>
                      <div v-if="projectConfig.reportUploadIntro.alert.title" class="font-weight-bold">{{ projectConfig.reportUploadIntro.alert.title }}</div>
                    </template>
                    <div v-html="projectConfig.reportUploadIntro.alert.text"></div>
                </v-alert>
                
                <v-form ref="uploadFormRef" @submit.prevent="handleUploadSubmit">
                  <v-select
                    v-model="uploadForm.reportType"
                    :items="['初驗報告', '複驗報告']"
                    label="報告種類"
                    variant="outlined"
                    :rules="[v => !!v || '必填']"
                  ></v-select>
                  <v-text-field v-model="uploadForm.buyerName" label="買方姓名" variant="outlined" :rules="[v => !!v || '必填']"></v-text-field>
                  <v-text-field v-model="uploadForm.phone" label="聯絡電話" variant="outlined" :rules="[v => !!v || '必填']"></v-text-field>
                  <v-text-field v-model="uploadForm.email" label="EMAIL (用於接收確認信)" variant="outlined" :rules="[v => !!v || '必填', v => /.+@.+\..+/.test(v) || 'E-mail 格式不正確']"></v-text-field>
                  <v-select
                      v-model="uploadForm.building"
                      :items="uploadBuildingList"  
                      label="棟別"
                      variant="outlined"
                      :rules="[v => !!v || '必填']"
                      @update:model-value="onUploadBuildingChange"
                    ></v-select>
                  <v-select
                    v-model="uploadForm.unit"
                    :items="uploadUnitList"
                    item-title="unit"
                    item-value="unit"
                    label="戶別"
                    variant="outlined"
                    :rules="[v => !!v || '必填']"
                    :disabled="!uploadForm.building"
                    no-data-text="請先選擇棟別"
                  ></v-select>
                  <v-text-field v-model="uploadForm.companyName" label="代驗公司名稱 (若無免填)" variant="outlined"></v-text-field>

                  <div
                    class="file-drop-zone"
                    :class="{ 'is-active': isDragActive }"
                    @dragover.prevent="isDragActive = true"
                    @dragleave.prevent="isDragActive = false"
                    @drop.prevent="handleFileDrop"
                    @click="triggerFileInput"
                  >
                    <v-icon size="48" color="grey-lighten-1" class="mb-2">mdi-cloud-upload-outline</v-icon>
                    <p v-if="!uploadForm.file" class="text-grey">將 PDF 檔案拖曳至此，或點擊上傳</p>
                    <div v-else class="file-info">
                      <v-icon color="red">mdi-file-pdf-box</v-icon>
                      <span class="ml-2 font-weight-bold">{{ uploadForm.file.name }}</span>
                      <span class="text-grey ml-2">({{ (uploadForm.file.size / 1024 / 1024).toFixed(2) }} MB)</span>
                    </div>
                    <p class="text-caption text-grey mt-2">（檔案大小限制 30MB）</p>
                  </div>
                   <input
                    ref="fileInputRef"
                    type="file"
                    accept=".pdf"
                    hidden
                    @change="handleFileSelect"
                  >
                  
                </v-form>
              </v-card-text>
              <v-card-actions class="pa-4">
                <v-spacer></v-spacer>
                <v-btn :color="projectConfig.themeColor" size="large" @click="handleUploadSubmit" :loading="isLoading" variant="elevated">
                  <v-icon left>mdi-upload</v-icon>
                  確認上傳
                </v-btn>
              </v-card-actions>
            </div>

             <div v-if="uploadSuccess">
              <v-card-text class="text-center py-8">
                <v-icon size="64" color="success" class="mb-4">mdi-check-circle-outline</v-icon>
                <h3 class="text-h5 mb-2">上傳成功！</h3>
                <p class="mb-6">您的驗屋報告已成功上傳，一封確認信已寄送至您的電子信箱。</p>
                <v-btn :color="projectConfig.themeColor" size="large" @click="resetUploadMode" variant="elevated">返回上傳頁面</v-btn>
              </v-card-text>
            </div>
          </template>

          <template v-else>
          <v-card-title 
           class="text-h5 font-weight-bold py-2 d-sm-flex align-center text-center text-sm-left"
            :style="{ backgroundColor: projectConfig.themeColor, color: projectConfig.titleColor }"
          >
              <span>{{ projectConfig.pageTitle }}</span>
              <v-spacer class="d-none d-sm-flex"></v-spacer>
              <v-btn
                v-if="step === 1 && projectConfig.showReportUploadButton"        
                prepend-icon="mdi-file-upload-outline"
                variant="elevated"
                @click="isUploadMode = true"
                class="mt-3 mt-sm-0"
                :block="$vuetify.display.xs"
              >
                上傳驗屋報告
              </v-btn>
            </v-card-title>
            <v-divider></v-divider>

            <v-alert v-if="!projectConfig && !isLoading" type="error" border="start" prominent title="頁面錯誤">
              找不到對應的建案設定，請確認網址是否正確。
            </v-alert>
            <v-alert v-if="projectConfig && !projectConfig.isPublished && !isLoading" type="error" border="start" prominent title="預約未開放">
              此建案的預約尚未開始，請等候通知。
            </v-alert>

            <v-card-text v-if="step < 3">
              <div class="prose">
                <div v-html="projectConfig.intro.greeting"></div>
                <div v-html="projectConfig.intro.body"></div>

                <div v-if="projectConfig.intro.alert.show && projectConfig.intro.alert.showConfirmation">
  
                  <v-btn
                    block
                    variant="outlined"
                    class="mb-2"
                    @click="isInstructionsDialogVisible = true"
                  >
                    <v-icon start>mdi-file-document-outline</v-icon>
                    點此閱讀驗屋說明
                  </v-btn>

                  <v-checkbox
                    v-model="isInstructionsConfirmed"
                    label="我已詳細閱讀並了解以上驗屋說明"
                    :color="projectConfig.themeColor"
                    class="mb-4"
                    hide-details
                    :disabled="!isInstructionsConfirmed"
                  ></v-checkbox>
                </div>

                <v-dialog v-model="isInstructionsDialogVisible" max-width="800px" persistent>
                  <v-card>
                    <v-card-title class="text-h5 font-weight-bold text-center bg-red-darken-2">
                    {{ projectConfig.intro.alert.title }}
                  </v-card-title>
                    <v-divider></v-divider>
                    <v-card-text style="max-height: 60vh; overflow-y: auto;">
                      <div v-html="projectConfig.intro.alert.text" class="prose"></div>
                    </v-card-text>
                    <v-divider></v-divider>
                    <v-card-actions class="pa-4">
                      <v-spacer></v-spacer>
                      <v-btn
                        color="success"
                        variant="elevated"
                        size="large"
                        @click="() => { isInstructionsConfirmed = true; isInstructionsDialogVisible = false; }"
                      >
                        我已閱讀並同意
                      </v-btn>
                    </v-card-actions>
                  </v-card>
                </v-dialog>

                <div v-if="projectConfig.intro.attachments && projectConfig.intro.attachments.length > 0" class="mt-6">
                    <v-list-subheader>相關附件</v-list-subheader>
                    <v-list density="compact">
                      <v-list-item
                          v-for="(file, i) in projectConfig.intro.attachments"
                          :key="i"
                          :href="file.url"
                          target="_blank"
                          prepend-icon="mdi-file-pdf-box"
                          rounded="lg"
                          class="mb-2 border"
                      >
                          <v-list-item-title>{{ file.title }}</v-list-item-title>
                      </v-list-item>
                    </v-list>
                </div>
                
                <div v-if="projectConfig.intro.faq && projectConfig.intro.faq.length > 0" class="mt-6">
                  <v-list-subheader>常見問答</v-list-subheader>
                  <v-expansion-panels variant="inset">
                    <v-expansion-panel
                      v-for="(item, i) in projectConfig.intro.faq"
                      :key="i"
                      :title="item.q"
                      :text="item.a"
                    ></v-expansion-panel>
                  </v-expansion-panels>
                </div>
              </div>
            </v-card-text>
            <v-divider v-if="step < 3"></v-divider>

            <div v-if="!projectConfig.intro.alert.showConfirmation || isInstructionsConfirmed">
              
              <div v-if="step === 1 && !existingBookingInfo">
                <v-card-text>
                  <h3 class="text-h6 mb-2">步驟一：請選擇您的預約項目與戶別</h3>
              <v-form ref="step1Form" @submit.prevent="handleStep1Submit">
              
                <v-select
                  v-model="formStep1.building"
                  :items="initialData.buildings"
                  label="棟別"
                  variant="outlined"
                  :rules="[v => !!v || '棟別為必填項']"
                  :disabled="isLoading || !isBookingActive"
                  @update:model-value="onBuildingChange"
                ></v-select>

                <v-select
                  v-model="formStep1.unit"
                  :items="unitList"
                  item-title="unit"
                  item-value="unit"
                  label="戶別"
                  variant="outlined"
                  :rules="[v => !!v || '戶別為必填項']"
                  :disabled="isLoading || !formStep1.building || !isBookingActive"
                  no-data-text="請先選擇棟別"
                  @update:model-value="onUnitChange"
                ></v-select>

                <v-text-field
                  v-model="formStep1.address"
                  label="門牌"
                  variant="outlined"
                  readonly
                  disabled
                ></v-text-field>

                <v-select
                  v-model="formStep1.bookingType"
                 :items="projectConfig.bookingTypes" 
                  label="預約項目"
                  variant="outlined"
                  :rules="[v => !!v || '預約項目為必填項']"
                  :disabled="isLoading || !formStep1.unit || !isBookingActive"
                  no-data-text="請先選擇戶別"
                ></v-select>
                
                <v-select
                    v-if="projectConfig.showBookingMethod"
                    v-model="formStep1.bookingMethod"
                    :items="projectConfig.bookingMethodOptions"
                    label="驗屋方式"
                    variant="outlined"
                    :rules="[v => !!v || '驗屋方式為必填項']"
                    :disabled="isLoading || !formStep1.unit || !isBookingActive"
                  ></v-select>

                  <v-text-field
                    v-if="formStep1.bookingMethod === '代驗公司'"
                    v-model="formStep1.companyName"
                    label="代驗公司名稱"
                    variant="outlined"
                    :rules="[v => !!v || '請輸入代驗公司名稱']"
                    :disabled="isLoading || !isBookingActive"
                  ></v-text-field>
                  <v-text-field
                    v-model="formStep1.idNumber"
                    :label="isIdValidationRequired ? '輸入身分證字號' : '輸入身分證字號'"
                    :rules="isIdValidationRequired ? [v => !!v || '此戶別預約需驗證身分證'] : []"
                    variant="outlined"
                    :disabled="isLoading || !isBookingActive"
                  ></v-text-field>
                  </v-form>
                </v-card-text>
                <v-card-actions class="pa-4">
                  <v-spacer></v-spacer>
                  <v-btn :color="projectConfig.themeColor" :disabled="!isBookingActive" size="large" @click="handleStep1Submit" :loading="isLoading" variant="elevated">確認戶別，下一步</v-btn>
                </v-card-actions>
              </div>
          
                    <div v-if="existingBookingInfo && step === 1">
            <v-card-text>
    <v-alert type="info" variant="tonal" border="start" class="mb-4">
        <h3 class="text-h6 mb-2">您已完成預約</h3>
        <p>我們查詢到您已有一筆有效的預約紀錄，資訊如下：</p>
    </v-alert>

    <v-list lines="two" class="text-left" density="compact" >
        
        <v-list-item title="預約代碼" :subtitle="existingBookingInfo.bookingCode" prepend-icon="mdi-pound-box-outline">
            <template v-slot:subtitle="{ subtitle }">
                <span class="font-weight-bold text-h6 text-red-darken-2">{{ subtitle }}</span>
            </template>
        </v-list-item>

        <v-list-item 
            title="建案名稱" 
            :subtitle="projectConfig?.name || '載入中...'" 
            prepend-icon="mdi-domain"
        >
        </v-list-item>
        
        <v-list-item title="戶別" :subtitle="existingBookingInfo.unitId" prepend-icon="mdi-home-variant-outline"></v-list-item>
        <v-list-item title="姓名" :subtitle="existingBookingInfo.bookerName" prepend-icon="mdi-account-outline"></v-list-item>
        <v-list-item title="電話" :subtitle="existingBookingInfo.bookerPhone" prepend-icon="mdi-phone-outline"></v-list-item>
        <v-list-item title="EMAIL" :subtitle="existingBookingInfo.bookerEmail" prepend-icon="mdi-email-outline"></v-list-item>
        <v-divider class="my-2"></v-divider>
        <v-list-item title="預約項目" :subtitle="existingBookingInfo.bookingType" prepend-icon="mdi-format-list-checks"></v-list-item>
        <v-list-item title="驗屋方式" :subtitle="existingBookingInfo.inspectionMethod" prepend-icon="mdi-account-search-outline"></v-list-item>
        <v-list-item v-if="existingBookingInfo.inspectionCompanyName" title="代驗公司" :subtitle="existingBookingInfo.inspectionCompanyName" prepend-icon="mdi-office-building"></v-list-item>
        <v-list-item title="預約日期" :subtitle="formatDisplayDate(existingBookingInfo.appointmentDate)" prepend-icon="mdi-calendar-check-outline"></v-list-item>
        <v-list-item title="預約時段" :subtitle="existingBookingInfo.appointmentTimeSlot" prepend-icon="mdi-clock-time-four-outline"></v-list-item>
        <v-list-item title="預約狀態" :subtitle="existingBookingInfo.status" prepend-icon="mdi-list-status">
            <template v-slot:subtitle="{ subtitle }">
                <v-chip color="green" variant="flat" size="small" >{{ subtitle }}</v-chip>
            </template>
        </v-list-item>
    </v-list>
</v-card-text>
             <v-card-actions class="pa-4 d-flex justify-end">
            <v-btn 
        class="mr-2"
        variant="text"
        size="large"
        @click="resetBookingFlow"
      >
        返回預約頁面
      </v-btn>
      <v-btn 
        color="error" 
        size="large" 
        variant="elevated" 
        @click="confirmCancelBooking" 
        :loading="isCanceling" 
        :disabled="!isBookingActive"
      >
        取消預約
      </v-btn>
    </v-card-actions>
          </div>

                    <div v-if="step === 2">
             <v-card-text>
                <h3 class="text-h6 mb-4">步驟二：填寫您的聯絡資訊與預約時段</h3>
                <v-form ref="step2Form" @submit.prevent="handleStep2Submit">
                    <v-text-field label="姓名" v-model="formStep2.姓名" :rules="[v => !!v || '必填']" variant="outlined"></v-text-field>
                    <v-text-field label="電話" v-model="formStep2.電話" :rules="[v => !!v || '必填']" variant="outlined"></v-text-field>
                    <v-text-field label="EMAIL" v-model="formStep2.EMAIL" :rules="[v => !!v || '必填', v => /.+@.+\..+/.test(v) || 'E-mail 格式不正確']" variant="outlined"></v-text-field>
                    <template v-if="formStep1.bookingMethod === '授權驗屋'">
                    <v-divider class="my-4"></v-divider>
                      <p class="mb-2 text-subtitle-1 font-weight-medium">授權驗屋資訊</p>
                      <v-text-field 
                        label="受託人姓名" 
                        v-model="formStep2.受託人姓名" 
                        :rules="[v => !!v || '必填']" 
                        variant="outlined"
                      ></v-text-field>
                      <v-text-field 
                        label="受託人電話" 
                        v-model="formStep2.受託人電話" 
                        :rules="[v => !!v || '必填']" 
                        variant="outlined"
                      ></v-text-field>
                      <v-btn 
                        :color="isAuthLetterGenerated ? 'success' : projectConfig.themeColor" 
                        @click="openAuthDialog" 
                        block 
                        class="mb-4"
                        variant="tonal"
                        size="large"
                      >
                        <v-icon left>{{ isAuthLetterGenerated ? 'mdi-check-circle' : 'mdi-draw' }}</v-icon>
                        {{ isAuthLetterGenerated ? '已填妥授權書 (可重新產生)' : '填寫驗屋授權書' }}
                      </v-btn>

                      <v-divider class="my-4"></v-divider>
                    </template>
                    <v-date-picker
                        v-model="formStep2.預約日期"
                        :min="bookingSlots.startDate"
                        :max="bookingSlots.endDate"
                        :allowed-dates="isDateAllowed"
                        @update:model-value="onDateChange"
                        :color="projectConfig.themeColor"
                        width="100%"
                        title="請選擇預約日期"
                    ></v-date-picker>

                    <v-select
                      label="預約時段"
                      v-model="formStep2.預約時段"
                      :items="availableTimeSlots"
                      :disabled="!formStep2.預約日期"
                      :rules="[v => !!v || '必填']"
                      variant="outlined"
                      no-data-text="請先選擇日期"
                      class="mt-4"
                      item-title="title"
                      item-value="value"
                  >
                      <template v-slot:item="{ props, item }">
                          <v-list-item v-bind="props" :disabled="item.raw.title.includes('已額滿')"></v-list-item>
                      </template>
                  </v-select>
                </v-form>
             </v-card-text>
             <v-card-actions class="pa-4">
                <v-btn size="large" @click="step = 1" :disabled="isLoading">返回上一步</v-btn>
                <v-spacer></v-spacer>
                <v-btn :color="projectConfig.themeColor" size="large" @click="handleStep2Submit" :loading="isLoading" variant="elevated">確認預約資訊</v-btn>
            </v-card-actions>
          </div>

                    <div v-if="step === 3">
              <v-card-text>
                  <v-alert type="info" variant="tonal" border="start" class="mb-4">
                      <h3 class="text-h6 mb-2">請確認您的預約資訊</h3>
                      <p>確認無誤後，請點擊下方的「送出預約」按鈕。</p>
                  </v-alert>
                <v-list lines="two">
                <v-list-item title="建案名稱" :subtitle="projectConfig.name"></v-list-item>
                <v-list-item title="戶別" :subtitle="finalBookingData.戶別"></v-list-item>
                <v-list-item title="門牌" :subtitle="finalBookingData.address"></v-list-item>
                <v-list-item title="姓名" :subtitle="finalBookingData.姓名"></v-list-item>
                <v-list-item title="電話" :subtitle="finalBookingData.電話"></v-list-item>
                <v-list-item title="EMAIL" :subtitle="finalBookingData.EMAIL"></v-list-item>              
                <template v-if="finalBookingData.bookingMethod === '授權驗屋'">                
                  <v-divider class="my-2"></v-divider>
                  <v-list-item title="受託人姓名" :subtitle="finalBookingData.受託人姓名"></v-list-item>
                  <v-list-item title="受託人電話" :subtitle="finalBookingData.受託人電話"></v-list-item>
                </template>
                
                <v-divider class="my-2"></v-divider>
                <v-list-item title="預約項目" :subtitle="finalBookingData.bookingType"></v-list-item>

                <v-list-item title="驗屋方式" :subtitle="finalBookingData.bookingMethod"></v-list-item>
                <v-list-item v-if="finalBookingData.companyName" title="代驗公司" :subtitle="finalBookingData.companyName"></v-list-item>
                <v-list-item title="預約日期" :subtitle="finalBookingData.預約日期"></v-list-item>
                <v-list-item title="預約時段" :subtitle="finalBookingData.預約時段"></v-list-item>
              </v-list>

              </v-card-text>
              <v-card-actions class="pa-4">
                  <v-btn size="large" @click="handleGoBackAndRefresh" :disabled="isLoading">返回修改</v-btn>
                  <v-spacer></v-spacer>
                  <v-btn color="success" size="large" @click="submitBooking" :loading="isLoading" variant="elevated">送出預約</v-btn>
              </v-card-actions>
          </div>

           <div v-if="step === 4">
  <v-card-text class="text-center py-8" ref="bookingResultCard">
      <v-icon size="64" color="success" class="mb-4">mdi-check-circle-outline</v-icon>
      <h3 class="text-h5 mb-2">預約成功！</h3>
      <p class="mb-6">您的預約已確認，相關資訊已寄送至您的電子信箱。</p>
      
      <v-list lines="two" class="text-left" density="compact">

          <v-list-item title="預約代碼" :subtitle="savedBookingCode" prepend-icon="mdi-pound-box-outline">
              <template v-slot:subtitle="{ subtitle }">
                  <span class="font-weight-bold text-h6 text-red-darken-2">{{ subtitle }}</span>
              </template>
          </v-list-item>

          <v-list-item 
              title="建案名稱" 
              :subtitle="projectConfig?.name || '載入中...'" 
              prepend-icon="mdi-domain"
          >
          </v-list-item>
          
          <v-list-item title="戶別" :subtitle="finalBookingData.戶別" prepend-icon="mdi-home-variant-outline"></v-list-item>
          <v-list-item title="門牌" :subtitle="finalBookingData.address" prepend-icon="mdi-map-marker-outline"></v-list-item>
          <v-list-item title="姓名" :subtitle="finalBookingData.姓名" prepend-icon="mdi-account-outline"></v-list-item>
          <v-list-item title="電話" :subtitle="finalBookingData.電話" prepend-icon="mdi-phone-outline"></v-list-item>
          <v-list-item title="EMAIL" :subtitle="finalBookingData.EMAIL" prepend-icon="mdi-email-outline"></v-list-item>
          
          <v-divider class="my-2"></v-divider>
          
          <v-list-item title="預約項目" :subtitle="finalBookingData.bookingType" prepend-icon="mdi-format-list-checks"></v-list-item>
          <v-list-item title="驗屋方式" :subtitle="finalBookingData.bookingMethod" prepend-icon="mdi-account-search-outline"></v-list-item>
          <v-list-item v-if="finalBookingData.companyName" title="代驗公司" :subtitle="finalBookingData.companyName" prepend-icon="mdi-office-building"></v-list-item>
          <v-list-item title="預約日期" :subtitle="finalBookingData.預約日期" prepend-icon="mdi-calendar-check-outline"></v-list-item>
          <v-list-item title="預約時段" :subtitle="finalBookingData.預約時段" prepend-icon="mdi-clock-time-four-outline"></v-list-item>

      </v-list>
      </v-card-text>
    <v-card-actions class="pa-2">
      <v-row dense>
        <v-col cols="12" sm="auto" class="flex-grow-1">
          <v-btn 
            prepend-icon="mdi-arrow-left" 
            :color="projectConfig.themeColor" 
            @click="resetBookingFlow" 
            variant="elevated"
            block
          >
            返回預約頁面
          </v-btn>
        </v-col>
        <v-col cols="6" sm="auto">
          <v-btn 
            prepend-icon="mdi-camera" 
            :color="projectConfig.themeColor" 
            @click="captureAndSave" 
            variant="outlined"
            block
          >
            截圖
          </v-btn>
        </v-col>
        <v-col cols="6" sm="auto">
          <v-btn 
            prepend-icon="mdi-calendar-plus" 
            :color="projectConfig.themeColor" 
            @click="addToCalendar" 
            variant="outlined"
            block
          >
            加入行事曆
          </v-btn>
        </v-col>
      </v-row>
    </v-card-actions>
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
      <v-form ref="authForm">
        <v-row>
          <v-col cols="12" md="6">
            <p class="text-subtitle-1 font-weight-bold mb-2">委託人資訊 (屋主)</p>
            <v-text-field v-model="authFormData.委託人姓名" label="委託人姓名" :rules="[v => !!v || '必填']" variant="outlined" density="compact"></v-text-field>
            <v-text-field v-model="authFormData.委託人身分證" label="委託人身分證" :rules="[v => !!v || '必填']" variant="outlined" density="compact"></v-text-field>
            <v-text-field v-model="authFormData.委託人戶籍地" label="委託人戶籍地" :rules="[v => !!v || '必填']" variant="outlined" density="compact"></v-text-field>
          </v-col>
          <v-col cols="12" md="6">
            <p class="text-subtitle-1 font-weight-bold mb-2">受託人資訊</p>
            <v-text-field v-model="authFormData.受託人姓名" label="受託人姓名" :rules="[v => !!v || '必填']" variant="outlined" density="compact"></v-text-field>
            <v-text-field v-model="authFormData.受託人身分證" label="受託人身分證" :rules="[v => !!v || '必填']" variant="outlined" density="compact"></v-text-field>
            <v-text-field v-model="authFormData.受託人戶籍地" label="受託人戶籍地" :rules="[v => !!v || '必填']" variant="outlined" density="compact"></v-text-field>
            <v-text-field v-model="authFormData.受託人電話" label="受託人電話" :rules="[v => !!v || '必填']" variant="outlined" density="compact"></v-text-field>
          </v-col>
        </v-row>
       <v-row>
  <v-col cols="12" md="6">
    <v-card variant="outlined">
      <div class="d-flex justify-space-between align-center pa-4 pb-0">
        <v-card-title class="text-subtitle-1 pa-0">委託人(屋主)簽名</v-card-title>
        <v-btn variant="tonal" size="small" @click="clearDelegatorSignature">
          <v-icon start>mdi-eraser</v-icon>
          清除
        </v-btn>
      </div>
      <v-card-text>
        <VueSignaturePad ref="delegatorSignaturePad" width="100%" height="200px" :options="{ penColor: '#000' }" />
      </v-card-text>
    </v-card>
  </v-col>
  <v-col cols="12" md="6">
    <v-card variant="outlined">
      <div class="d-flex justify-space-between align-center pa-4 pb-0">
        <v-card-title class="text-subtitle-1 pa-0">受託人簽名</v-card-title>
        <v-btn variant="tonal" size="small" @click="clearDelegateeSignature">
          <v-icon start>mdi-eraser</v-icon>
          清除
        </v-btn>
      </div>
      <v-card-text>
        <VueSignaturePad ref="delegateeSignaturePad" width="100%" height="200px" :options="{ penColor: '#000' }" />
      </v-card-text>
    </v-card>
  </v-col>
</v-row>
      </v-form>
    </v-card-text>
    <v-card-actions class="pa-4">
      <v-spacer></v-spacer>
      <v-btn color="grey" @click="closeAuthDialog">關閉</v-btn>
      <v-btn color="success" @click="handleGenerateLetter" variant="elevated">確認已填妥並產生授權書</v-btn>
    </v-card-actions>
  </v-card>
</v-dialog>


<div 
  ref="authLetterRenderRef" 
  style="position: absolute; left: -9999px; top: -9999px; width: 794px; background-color: white;"
></div>


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
        <v-btn
          color="primary"
          href="https://www.ilovepdf.com/zh-tw/compress_pdf"
          target="_blank"
          rel="noopener noreferrer"
          prepend-icon="mdi-open-in-new"
        >
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
  <v-chip
    class="ml-1"
    href="https://airrick1985.wixsite.com/anxi"
    target="_blank"
    rel="noopener noreferrer"
    color="blue-grey"
    variant="tonal"
    size="small"
    pill
  >
    <v-icon start size="x-small">mdi-rocket-launch-outline</v-icon>
    anxismart安熙智慧建案管理系統
  </v-chip>
</div>


</v-container>
</template>

<script setup>
import { ref, onMounted, computed, nextTick, watch } from 'vue';
import { useRoute } from 'vue-router';
import { 
 fetchProjectConfig,
  getBookingInitialData,
  fetchAllUnitsForBooking,
  fetchAllUnitsForUpload,
  fetchBuildingListForUpload, 
  checkExistingBooking, 
  validateId, 
  getBookingSlots, 
  saveBooking, 
  uploadAuthLetter,
  cancelBooking,
  uploadReportDirectlyToDrive
} from '@/api';
import { useDate } from 'vuetify'; 
import html2canvas from 'html2canvas';
import { VueSignaturePad } from 'vue-signature-pad';


const loadingText = ref('處理中...');

// ---  新增: 上傳報告相關 state ---
const isUploadMode = ref(false);
const isDragActive = ref(false);
const uploadSuccess = ref(false);
const uploadFormRef = ref(null);
const fileInputRef = ref(null);
const uploadUnitList = ref([]);
const isSizeErrorDialogVisible = ref(false); 
const isUploadErrorDialogVisible = ref(false); 
const uploadErrorDialogMessage = ref(''); 
const initialUploadFormState = {
  reportType: null,
  buyerName: '',
  phone: '',
  email: '',
  building: null,
  unit: null,
  companyName: '',
  file: null, // { name, size, type, base64 }
};
const uploadForm = ref({ ...initialUploadFormState });

// 儲存上傳後的 URL
const finalAuthLetterUrl = ref('');

//  新增一個 ref 來追蹤勾選狀態
const isInstructionsConfirmed = ref(false);

//  在 isInstructionsConfirmed 下方新增一個 ref
const isInstructionsDialogVisible = ref(false);

const route = useRoute();
const dateAdapter = useDate();
const step1Form = ref(null);
const step2Form = ref(null);
const bookingResultCard = ref(null);

// 代表「今天」的常數，並將時間設為午夜
const today = new Date();
today.setHours(0, 0, 0, 0); // 將時間部分歸零，以便進行日期比較


// --- State ---
const isLoading = ref(true);
const isCanceling = ref(false);
const step = ref(1);
const savedBookingCode = ref(''); 
const projectId = ref('');
const projectConfig = ref(null);

const initialData = ref({ buildings: [], checkDuplicate: 'OFF', bookingTypes: [], validateId: 'OFF' });
const uploadBuildingList = ref([]); // ✓ 為上傳表單新增一個專用的棟別列表
const allUnitsData = ref({});
const allUnitsDataForUpload = ref({}); 
const unitList = ref([]);
const bookingSlots = ref({ startDate: null, endDate: null, unavailableDates: [], timeSlotsByDate: {}, bookingOptions: {} });
const formStep1 = ref({ building: null, unit: null, bookingType: null, bookingMethod: null, companyName: '', address: '', idNumber: '' });
const formStep2 = ref({ 姓名: '', 電話: '', EMAIL: '', 預約日期: null, 預約時段: null, 受託人姓名: '', 受託人電話: '' });
const existingBookingInfo = ref(null);

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

// --- Computed Properties ---
const isBookingActive = computed(() => {
  if (!projectConfig.value) return false;
  if (!projectConfig.value.isPublished) return false;
  if (projectConfig.value.bookingDeadline) {
    return new Date() < new Date(projectConfig.value.bookingDeadline);
  }
  return true;
});

// computed 方便判斷是否需要驗證
const isIdValidationRequired = computed(() => {
  return initialData.value.validateId === 'ON';
});

// 將兩個表單資料合併，並進行必要的轉換
const finalBookingData = computed(() => ({
  ...formStep1.value,
  ...formStep2.value,
  戶別: formStep1.value.unit,
  預約日期: formStep2.value.預約日期 ? dateAdapter.format(formStep2.value.預約日期, 'keyboardDate') : null,
}));

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
  
  // 條件三 (新)：該日期必須存在至少一個可預約的時段 (無論是否額滿)
  // 使用 ?. (Optional Chaining) 語法安全地檢查屬性是否存在且長度大於 0
  const hasDefinedSlots = (bookingSlots.value.timeSlotsByDate[dateStr]?.length || 0) > 0;
  
  // 必須同時滿足條件二和條件三
  return isGenerallyAvailable && hasDefinedSlots;
};

 // 授權書對話框狀態
 const isAuthDialogVisible = ref(false);
 const isAuthLetterGenerated = ref(false); // 用於追蹤授權書是否已產生
 const generatedAuthLetterUrl = ref(''); // 用於存放產生的授權書圖片 URL 以供預覽
 const authForm = ref(null); // 為 v-form 建立 ref
 const authLetterRenderRef = ref(null); // 為渲染授權書的隱藏 div 建立 ref
 const isPreviewDialogVisible = ref(false); // 控制預覽對話框的顯示

 // 獲取民國年日期
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
   委託人身分證: '',
   委託人戶籍地: '',
   受託人姓名: '',
   受託人身分證: '',
   受託人戶籍地: '',
   受託人電話: ''
 });

 // 簽名版元件的 ref
 const delegatorSignaturePad = ref(null);
 const delegateeSignaturePad = ref(null);


 // 打開授權書對話框
 const openAuthDialog = () => {
   // 自動帶入已填寫的受託人資訊
   authFormData.value.受託人姓名 = formStep2.value.受託人姓名;
   authFormData.value.受託人電話 = formStep2.value.受託人電話;
   isAuthDialogVisible.value = true;
 };

 // 關閉對話框
 const closeAuthDialog = () => {
   isAuthDialogVisible.value = false;
 };

 //清除委託人簽名
 const clearDelegatorSignature = () => {
  if (delegatorSignaturePad.value) {
    delegatorSignaturePad.value.clearSignature();
  }
};

//清除受託人簽名
const clearDelegateeSignature = () => {
  if (delegateeSignaturePad.value) {
    delegateeSignaturePad.value.clearSignature();
  }
};


 // 處理產生授權書的邏輯 (此為下一階段的預留函式)
const handleGenerateLetter = async () => {
  // 1. 表單驗證
  const { valid } = await authForm.value.validate();
  if (!valid) {
    alert('所有欄位皆為必填，請檢查後再試。');
    return;
  }

  // 2. 簽名驗證
  if (delegatorSignaturePad.value.isEmpty() || delegateeSignaturePad.value.isEmpty()) {
    alert('委託人與受託人皆須簽名。');
    return;
  }

  // 3. 儲存簽名為 Base64
  const delegatorSignature = delegatorSignaturePad.value.saveSignature('image/png');
  const delegateeSignature = delegateeSignaturePad.value.saveSignature('image/png');

  // 4. 準備填充範本
  let template = projectConfig.value.authLetterTemplate;
  if (!template) {
    alert('此建案未設定授權書範本。');
    return;
  }
  
  const populatedHtml = template
    .replace(/{logoUrl}/g, projectConfig.value.logoUrl)
    .replace(/{委託人姓名}/g, authFormData.value.委託人姓名)
    .replace(/{建案名稱}/g, projectConfig.value.name)
    .replace(/{戶別}/g, formStep1.value.unit)
    .replace(/{受託人姓名}/g, authFormData.value.受託人姓名)
    .replace(/{委託人簽名圖檔}/g, delegatorSignature.data)
    .replace(/{委託人身分證字號}/g, authFormData.value.委託人身分證)
    .replace(/{委託人戶籍地址}/g, authFormData.value.委託人戶籍地)
    .replace(/{受託人簽名圖檔}/g, delegateeSignature.data)
    .replace(/{受託人身分證字號}/g, authFormData.value.受託人身分證)
    .replace(/{受託人戶籍地址}/g, authFormData.value.受託人戶籍地)
    .replace(/{TODAY}/g, getMinguoDate());

  // 5. 將內容渲染至隱藏的 div，並使用 html2canvas 產生圖片
  authLetterRenderRef.value.innerHTML = populatedHtml;
  
  await nextTick(); // 等待 DOM 更新

  try {
    const canvas = await html2canvas(authLetterRenderRef.value, { 
      scale: 2, // 提高解析度
      useCORS: true // 允許跨域圖片 (如果有的話)
    });
    generatedAuthLetterUrl.value = canvas.toDataURL('image/png');
    isAuthLetterGenerated.value = true;
    closeAuthDialog(); // 關閉填寫視窗
    isPreviewDialogVisible.value = true; // 打開預覽視窗
  } catch (error) {
    console.error('產生授權書失敗:', error);
    alert('產生授權書圖片失敗，請稍後再試。');
  } finally {
    authLetterRenderRef.value.innerHTML = ''; // 清空隱藏的 div
  }
};

// 重置預約流程的函式
const resetBookingFlow = () => {
  step.value = 1;
  savedBookingCode.value = '';
  existingBookingInfo.value = null;
  
  // 重置表單資料
  formStep1.value = { building: null, unit: null, bookingType: null, bookingMethod: null, companyName: '', address: '', idNumber: '' };
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

// 在 onMounted 函數中修正
onMounted(async () => {
  projectId.value = route.params.projectId;
  isLoading.value = true;
  loadingText.value = '正在載入建案資訊...';

  try {
    const config = await fetchProjectConfig(projectId.value);
    projectConfig.value = config;

    // ✓ 將 Promise.all 擴展為包含所有需要的 API 呼叫
    const [
      initialRes,
      uploadBuildingsRes,
      unitsRes,
      uploadUnitsRes // ✓ 新增
    ] = await Promise.all([
      getBookingInitialData(config.projectName, projectId.value),
      fetchBuildingListForUpload(projectId.value),
      fetchAllUnitsForBooking(config.projectName, projectId.value),
      fetchAllUnitsForUpload(projectId.value) // ✓ 新增
    ]);

    if (initialRes?.status === 'success') initialData.value = initialRes.data;
    if (uploadBuildingsRes?.status === 'success') uploadBuildingList.value = uploadBuildingsRes.data.buildings;
    if (unitsRes?.status === 'success') allUnitsData.value = unitsRes.data;
    if (uploadUnitsRes?.status === 'success') allUnitsDataForUpload.value = uploadUnitsRes.data; // ✓ 儲存資料

  } catch (error) {
    console.error("頁面初始化失敗:", error);
    alert("系統忙碌中，無法讀取預約資料，請稍後再試。");
  } finally {
    isLoading.value = false;
  }
});

const onBuildingChange = (building) => {
  formStep1.value.unit = null;
  formStep1.value.address = '';
  formStep1.value.bookingType = null;
  existingBookingInfo.value = null;
  step.value = 1;
  
  if (!building) { 
    unitList.value = [];
    return; 
  }
  
  unitList.value = allUnitsData.value[building] || [];
};

const onUnitChange = (unitValue) => {
  const selectedUnit = unitList.value.find(u => u.unit === unitValue);
  if (selectedUnit) formStep1.value.address = selectedUnit.address;
  formStep1.value.bookingType = null;
  existingBookingInfo.value = null;
  step.value = 1;
};
const onDateChange = () => { formStep2.value.預約時段 = null; };

const handleStep1Submit = async () => {
 const { valid } = await step1Form.value.validate();
 if (!valid) return;

 loadingText.value = '正在驗證戶別資訊...';
 isLoading.value = true;
 existingBookingInfo.value = null;

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
// ✓ START: 修正參數傳遞錯誤
      const res = await checkExistingBooking(
          projectId.value, 
          formStep1.value.unit, 
          formStep1.value.bookingType
        );
        
      if (res.status === 'success' && res.data.status === 'found') {
          existingBookingInfo.value = res.data.booking;
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
        projectId.value // 傳入 projectId
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

const handleStep2Submit = async () => {
  const { valid } = await step2Form.value.validate();
  if (!valid) return;

  // 檢查：如果選擇了「授權驗屋」，則必須先完成授權書的產生
  if (formStep1.value.bookingMethod === '授權驗屋' && !isAuthLetterGenerated.value) {
    alert('您選擇了「授權驗屋」，請務必先完成「填寫驗屋授權書」。');
    return; // 中斷執行，停留在步驟二
  }

  step.value = 3; // 所有檢查都通過，才前往步驟三
};

const handleGoBackAndRefresh = async () => {
  loadingText.value = '正在重新整理時段...';
  isLoading.value = true;
  try {
    //  修正：加入 projectId 參數
    const res = await getBookingSlots(
      projectConfig.value.name, 
      formStep1.value.unit, 
      formStep1.value.bookingType, 
      formStep1.value.bookingMethod,
      projectId.value //  加入缺少的 projectId 參數
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
        companyName: finalBookingData.value.companyName,
        // 授權書相關
        principalName: authFormData.value.委託人姓名,
        principalIdNumber: authFormData.value.委託人身分證,
        principalAddress: authFormData.value.委託人戶籍地,
        agentName: finalBookingData.value.受託人姓名,
        agentPhone: finalBookingData.value.受託人電話,
        agentIdNumber: authFormData.value.受託人身分證,
        agentAddress: authFormData.value.受託人戶籍地,
        authorizationLetterUrl: authLetterFinalUrl,

      }
    };
    
    // ✅ 提交預約
    const res = await saveBooking(payload);

    if (res.status === 'success') {
      if (res.data && res.data.bookingCode) {
        savedBookingCode.value = res.data.bookingCode;
      }
      step.value = 4;
    } else {
      throw new Error(res.message || '預約失敗');
    }
  } catch (error) {
    console.error("儲存預約失敗:", error);
    alert(`預約失敗：${error.message}`);
  } finally {
    isLoading.value = false;
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
    // ✅ 修改此處，將 '預約代碼' 改為 'bookingCode'
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
    const title = `${projectConfig.value.name}-${finalBookingData.value.bookingType}預約 (${finalBookingData.value.戶別})`;
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
    eventDetails += `驗屋方式：${finalBookingData.value.bookingMethod}\n`;
    if (finalBookingData.value.companyName) {
        eventDetails += `代驗公司：${finalBookingData.value.companyName}\n`;
    }
    eventDetails += `\n預約人：${finalBookingData.value.姓名}\n`;
    eventDetails += `電話：${finalBookingData.value.電話}\n`;
    eventDetails += `Email：${finalBookingData.value.EMAIL}\n`;

    if (finalBookingData.value.受託人姓名) {
        eventDetails += `\n受託人：${finalBookingData.value.受託人姓名}\n`;
        eventDetails += `受託人電話：${finalBookingData.value.受託人電話}\n`;
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
  const { valid } = await uploadFormRef.value.validate();
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
    };
    
    // ✅ 【修改】改為呼叫新的代理上傳函式
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
  if(uploadFormRef.value) uploadFormRef.value.resetValidation();
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
.file-drop-zone:hover, .file-drop-zone.is-active {
  background-color: #f8f9fa;
  border-color: #007bff;
}
.file-info {
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>