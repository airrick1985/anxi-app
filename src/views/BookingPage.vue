<template>
  <v-container fluid style="background-color: #F5F5F7; min-height: 100vh;">
    
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
      :icon="uploadStep === 1 ? 'mdi-arrow-left' : undefined"
      variant="text"
      @click="isUploadMode = false"
      :disabled="isLoading"
      class="mr-3"
    ></v-btn>
    <span>{{ projectConfig.name }} 上傳驗屋報告</span>
  </v-card-title>
  <v-divider></v-divider>

  <div v-if="!uploadSuccess">
    <div v-if="uploadStep === 1">
      <v-card-text>
        <div class="prose mb-6" v-html="projectConfig.reportUploadIntro.body"></div>
        <v-alert
            v-if="projectConfig.reportUploadIntro.alert.show"
            :color="projectConfig.reportUploadIntro.alert.color"
            :type="projectConfig.reportUploadIntro.alert.type"
            class="mb-4" border="start" density="compact"
        >
            <template v-slot:title>
              <div v-if="projectConfig.reportUploadIntro.alert.title" class="font-weight-bold">{{ projectConfig.reportUploadIntro.alert.title }}</div>
            </template>
            <div v-html="projectConfig.reportUploadIntro.alert.text"></div>
        </v-alert>
        
        <v-form ref="uploadStep1FormRef" @submit.prevent="handleUploadStep1Submit">
          <v-select
            v-model="uploadForm.reportType"
            :items="['初驗報告', '複驗報告']"
            label="報告種類" variant="outlined"
            :rules="[v => !!v || '必填']"
          ></v-select>
          <v-select
            v-model="uploadForm.building"
            :items="uploadBuildingList"  
            label="棟別" variant="outlined"
            :rules="[v => !!v || '必填']"
            @update:model-value="onUploadBuildingChange"
          ></v-select>
          <v-select
            v-model="uploadForm.unit"
            :items="uploadUnitList"
            item-title="unit" item-value="unit"
            label="戶別" variant="outlined"
            :rules="[v => !!v || '必填']"
            :disabled="!uploadForm.building"
            no-data-text="請先選擇棟別"
          ></v-select>
          <v-text-field
            v-model="uploadForm.idNumber"
            label="身分證字號 (用於驗證)"
            variant="outlined"
            :rules="[v => !!v || '必填']"
          ></v-text-field>
        </v-form>
      </v-card-text>
      <v-card-actions class="pa-4">
        <v-spacer></v-spacer>
        <v-btn :color="projectConfig.themeColor" size="large" @click="handleUploadStep1Submit" :loading="isLoading" variant="elevated">
          確認資料，下一步
        </v-btn>
      </v-card-actions>
    </div>
    <div v-else-if="uploadStep === 2">
      <v-card-text>
        <v-alert type="info" variant="tonal" border="start" class="mb-4">
          <p class="font-weight-bold">資格驗證成功！請填寫以下資訊並上傳檔案。</p>
        </v-alert>
        <v-form ref="uploadStep2FormRef" @submit.prevent="handleUploadSubmit">
          <v-text-field v-model="uploadForm.buyerName" label="買方姓名" variant="outlined" :rules="[v => !!v || '必填']"></v-text-field>
          <v-text-field v-model="uploadForm.phone" label="聯絡電話" variant="outlined" :rules="[v => !!v || '必填']"></v-text-field>
          <v-text-field v-model="uploadForm.email" label="EMAIL (用於接收確認信)" variant="outlined" :rules="[v => !!v || '必填', v => /.+@.+\..+/.test(v) || 'E-mail 格式不正確']"></v-text-field>
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
            ref="fileInputRef" type="file"
            accept=".pdf" hidden
            @change="handleFileSelect"
          >
        </v-form>
      </v-card-text>
      <v-card-actions class="pa-4">
        <v-btn size="large" @click="uploadStep = 1" :disabled="isLoading">返回上一步</v-btn>
        <v-spacer></v-spacer>
        <v-btn :color="projectConfig.themeColor" size="large" @click="handleUploadSubmit" :loading="isLoading" variant="elevated">
          <v-icon left>mdi-upload</v-icon>
          確認上傳
        </v-btn>
      </v-card-actions>
    </div>
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
            <v-alert 
  v-if="projectConfig && systemStatus.code !== 'OPEN' && !isLoading" 
  :type="systemStatus.code === 'NOT_STARTED' ? 'info' : (systemStatus.code === 'ENDED' ? 'error' : 'error')"
  :icon="systemStatus.icon"
  border="start" 
  prominent
  variant="tonal"
  class="mb-4"
>
  <template v-slot:title>
    <span class="font-weight-bold">
      {{ systemStatus.code === 'NOT_STARTED' ? '預約尚未開始' : (systemStatus.code === 'ENDED' ? '預約已截止' : '預約未開放') }}
    </span>
  </template>
  {{ systemStatus.message }}
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
                    點此閱讀預約說明
                  </v-btn>

                  <v-checkbox
                    v-model="isInstructionsConfirmed"
                    label="我已詳細閱讀並了解以上預約說明"
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

                
                
                <div v-if="projectConfig.intro.faq && projectConfig.intro.faq.length > 0" class="mt-6">
                  <v-list-subheader>常見問答</v-list-subheader>
              <v-expansion-panels variant="inset">
                    <v-expansion-panel
                      v-for="(item, i) in projectConfig.intro.faq"
                      :key="i"
                    >
                      <template v-slot:title>
                        <div v-html="item.q" class="prose" style="font-weight: 500;"></div>
                      </template>
                      <v-expansion-panel-text>
                        <div v-html="item.a" class="prose"></div>
                      </v-expansion-panel-text>
                    </v-expansion-panel>
                  </v-expansion-panels>
                </div>
                <div v-if="projectConfig.intro.showAttachments && projectConfig.intro.attachments?.length > 0" class="mt-6">
                  <v-list-subheader>附件下載</v-list-subheader>
                  <v-list density="compact">
                    <v-list-item
                      v-for="(item, i) in projectConfig.intro.attachments"
                      :key="item.url || i"
                      @click="openAttachmentPreview(item)"
                      link
                      rounded="lg"
                      class="mb-2 border"
                    >
                       <template v-slot:prepend>
                        <v-icon color="red" v-if="item.name.toLowerCase().endsWith('.pdf')">mdi-file-pdf-box</v-icon>
                        <v-icon color="grey-darken-1" v-else>mdi-image-outline</v-icon>
                      </template>
                      <v-list-item-title class="text-primary">{{ item.name }}</v-list-item-title>
                      <template v-slot:append>
                        <v-btn
                          icon="mdi-download-outline"
                          variant="text"
                          color="grey"
                          size="small"
                          @click.stop="downloadAttachment(item)"
                        ></v-btn>
                      </template>
                    </v-list-item>
                  </v-list>
                </div>



               <div v-if="projectConfig && projectConfig.intro && projectConfig.intro.footer" class="text-caption text-grey text-center mt-4 prose" v-html="projectConfig.intro.footer">
                </div>
                <div v-if="projectConfig.intro && projectConfig.intro.contact" class="contact-info mt-6">
                  <v-list-subheader>聯絡資訊</v-list-subheader>
                  <v-list density="compact">
                    <v-list-item v-if="projectConfig.intro.contact.name" prepend-icon="mdi-office-building-outline">
                      <v-list-item-title>{{ projectConfig.intro.contact.name }}</v-list-item-title>
                    </v-list-item>
                    <v-list-item v-if="projectConfig.intro.contact.phone" prepend-icon="mdi-phone-outline" :href="`tel:${projectConfig.intro.contact.phone}`">
                      <v-list-item-title>{{ projectConfig.intro.contact.phone }}</v-list-item-title>
                    </v-list-item>
                  </v-list>
                </div>

              </div>
            </v-card-text>
            <v-divider v-if="step < 3"></v-divider>

            <div v-if="!projectConfig.intro.alert.showConfirmation || isInstructionsConfirmed">
              
              <div v-if="step === 1 && !existingBookingInfo">
                <v-card-text>
                  <h3 class="text-h6 mb-2">步驟一：請選擇您的預約項目與戶別</h3>
              <v-form ref="step1Form" @submit.prevent="handleStep1Submit">
              
                <v-autocomplete
                      v-model="formStep1.building"
                      :items="initialData.buildings"
                      label="棟別(選擇或輸入)" 
                      variant="outlined"
                      :rules="[v => !!v || '棟別為必填項']"
                      :disabled="isLoading || !isBookingActive"
                      @update:model-value="onBuildingChange"
                      clearable 
                    ></v-autocomplete>

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
                  label="選擇方式"
                  variant="outlined"
                  :rules="[v => !!v || '選擇方式為必填項']"
                  :disabled="isLoading || !formStep1.unit || !isBookingActive"
                  ></v-select>

                      <div v-if="formStep1.bookingMethod && formStep1.bookingMethod !== '屋主自驗' && formStep1.bookingMethod !== '授權驗屋' && formStep1.bookingType !== '對保'" class="mb-4">                      
                      <p class="text-subtitle-1 mb-2">屋主本人是否到場？</p>
                        <v-chip-group
                          v-model="formStep1.isOwnerPresent"
                          mandatory
                          :color="projectConfig.themeColor || 'primary'"
                          variant="outlined"
                          @update:model-value="() => { isSigningInitiated = false; }"
                        >
                          <v-chip :value="true" filter>是，本人到場</v-chip>
                          <v-chip :value="false" filter>否，委託他人</v-chip>
                        </v-chip-group>
                        <div v-if="formStep1.isOwnerPresent === false" class="text-caption text-orange-darken-2 mt-1">
                          提醒：選擇「否」將需要在下一步進行「驗屋授權書」網路流程。
                        </div>
                      </div>

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
        <p>我們查詢到您已有一筆有效的預約紀錄，資訊如下，若您要修改預約時間請先取消預約。</p>
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
        <v-list-item title="選擇方式" :subtitle="existingBookingInfo.inspectionMethod" prepend-icon="mdi-account-search-outline"></v-list-item>
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
                   <template v-if="formStep1.bookingMethod !== '屋主自驗' && formStep1.isOwnerPresent === false">
                    <v-divider class="my-4"></v-divider>
                      <p class="mb-2 text-subtitle-1 font-weight-medium">
                        委託驗屋資訊 (請填寫受託人資料)
                      </p>
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
                  <div class="d-flex flex-column mb-4">
                    <v-btn
                      :color="isSigningInitiated ? 'success' : projectConfig.themeColor"
                      @click="openAuthDialog"
                      block
                      variant="tonal"
                      size="large"
                      :disabled="isLoading"
                    >
                      <v-icon left>{{ isSigningInitiated ? 'mdi-email-check-outline' : 'mdi-draw' }}</v-icon>
                      {{ isSigningInitiated ? '已寄送簽署邀請' : '按此處「驗屋授權書(線上授權)」' }}
                    </v-btn>

                    <div 
                      v-if="!isSigningInitiated" 
                      class="text-red text-caption mt-1 animate-pulse"
                      style="font-weight: 500; letter-spacing: 0.5px;"
                    >
                      <v-icon size="14" color="red" class="mr-1">mdi-alert-circle-outline</v-icon>
                      需要完成授權書填寫才可進行下一步
                    </div>
                  </div>
                      <v-divider class="my-4"></v-divider>
                    </template>
                </v-form>
             </v-card-text>
             <v-card-actions class="pa-4">
                <v-btn size="large" @click="step = 1" :disabled="isLoading">返回上一步</v-btn>
                <v-spacer></v-spacer>
                  <v-btn
                    :color="projectConfig.themeColor"
                    size="large"
                    @click="handleStep2Submit"
                    :loading="isLoading"
                    variant="elevated"
                    :disabled="isLoading || (formStep1.bookingMethod !== '屋主自驗' && formStep1.isOwnerPresent === false && !isSigningInitiated)"
                  >
                    確認預約資訊
                  </v-btn>
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

                <v-list-item title="選擇方式" :subtitle="finalBookingData.bookingMethod"></v-list-item>
                <v-list-item v-if="finalBookingData.companyName" title="代驗公司" :subtitle="finalBookingData.companyName"></v-list-item>
                <v-list-item title="預約日期" :subtitle="finalBookingData.預約日期"></v-list-item>
                <v-list-item title="預約時段" :subtitle="finalBookingData.預約時段"></v-list-item>
                 <v-alert
                v-if="isTimeoutActive"
                type="info"
                variant="tonal"
                border="start"
                
                class="mb-4"
                icon="mdi-timer-sand"
              >
                請於 <span class="font-weight-bold">{{ Math.floor(remainingSeconds / 60) }}:{{ String(remainingSeconds % 60).padStart(2, '0') }}</span> 分鐘內確認送出，逾時將需要重新操作。
              </v-alert>
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
          <v-list-item title="選擇方式" :subtitle="finalBookingData.bookingMethod" prepend-icon="mdi-account-search-outline"></v-list-item>
          <v-list-item v-if="finalBookingData.companyName" title="代驗公司" :subtitle="finalBookingData.companyName" prepend-icon="mdi-office-building"></v-list-item>
          <v-list-item title="預約日期" :subtitle="finalBookingData.預約日期" prepend-icon="mdi-calendar-check-outline"></v-list-item>
          <v-list-item title="預約時段" :subtitle="finalBookingData.預約時段" prepend-icon="mdi-clock-time-four-outline"></v-list-item>

         <div v-if="projectConfig?.intro?.closingText" class="mt-4">
            <v-alert
              border="start"
              variant="tonal"
              color="info"
              icon="mdi-information-outline"
              class="pa-4"
              prominent
            >
              <template v-slot:title>
                <div class="font-weight-bold">重要提醒</div>
              </template>
              <div class="prose" v-html="projectConfig.intro.closingText"></div>
            </v-alert>
          </div>

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
      <v-alert
            type="info"
            variant="tonal"
            border="start"
            density="compact"
            class="mb-4"
          >
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
            <v-text-field v-model="authFormData.委託人姓名" label="委託人姓名" :rules="[v => !!v || '必填']" variant="outlined" density="compact"></v-text-field>
            <v-text-field v-model="authFormData.委託人身分證" label="委託人身分證" :rules="[v => !!v || '必填']" variant="outlined" density="compact"></v-text-field>
            <v-text-field v-model="authFormData.委託人戶籍地" label="委託人戶籍地" :rules="[v => !!v || '必填']" variant="outlined" density="compact"></v-text-field>
          </v-col>
          <v-col cols="12" md="6">
            <p class="text-subtitle-1 font-weight-bold mb-2">受託人資訊</p>
            <v-text-field v-model="authFormData.受託人姓名" label="受託人姓名" :rules="[v => !!v || '必填']" variant="outlined" density="compact"></v-text-field>
            <v-text-field v-model="authFormData.受託人Email" label="受託人 Email (用於接收簽署信)" :rules="[v => !!v || '必填', v => /.+@.+\..+/.test(v) || 'E-mail 格式不正確']" variant="outlined" density="compact"></v-text-field>
            <v-text-field v-model="authFormData.受託人身分證" label="受託人身分證" :rules="[v => !!v || '必填']" variant="outlined" density="compact"></v-text-field>
            <v-text-field v-model="authFormData.受託人戶籍地" label="受託人戶籍地" :rules="[v => !!v || '必填']" variant="outlined" density="compact"></v-text-field>
            <v-text-field v-model="authFormData.受託人電話" label="受託人電話" :rules="[v => !!v || '必填']" variant="outlined" density="compact"></v-text-field>
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
            <v-card-text>
              <VueSignaturePad ref="delegatorSignaturePad" width="100%" height="200px" :options="{ penColor: '#000' }"></VueSignaturePad>
              
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
      <v-btn color="success" @click="handleInitiateSigning" variant="elevated" :loading="isLoading">寄送簽署邀請給受託人</v-btn>
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

<!-- 附件預覽 Dialog -->
<v-dialog v-model="isAttachmentPreviewVisible" max-width="900px" height="90vh">
  <v-card class="h-100 d-flex flex-column">
    <v-card-title class="d-flex align-center bg-grey-lighten-4 py-2">
      <span class="text-truncate">{{ currentPreviewAttachment?.name }}</span>
      <v-spacer></v-spacer>
      <v-btn icon="mdi-download" variant="text" color="primary" @click="downloadAttachment(currentPreviewAttachment)"></v-btn>
      <v-btn icon="mdi-close" variant="text" @click="isAttachmentPreviewVisible = false"></v-btn>
    </v-card-title>
    <v-divider></v-divider>
    <v-card-text class="flex-grow-1 pa-0 d-flex justify-center align-center bg-grey-lighten-3" style="min-height: 300px; position: relative;">
      <!-- PDF 預覽 -->
      <iframe
        v-if="currentPreviewAttachment?.name.toLowerCase().endsWith('.pdf')"
        :src="currentPreviewAttachment?.url"
        type="application/pdf"
        width="100%"
        height="100%"
        style="border: none;"
      ></iframe>
      
      <!-- 圖片預覽 -->
      <v-img
        v-else-if="currentPreviewAttachment?.url"
        :src="currentPreviewAttachment?.url"
        contain
        max-height="100%"
        max-width="100%"
      ></v-img>

      <div v-else class="text-grey">無法預覽此檔案</div>
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
    href="https://anxismart.com/"
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


<v-dialog v-model="isConfirmationDialogVisible" max-width="500px" persistent>
  <v-card>
    <v-card-title class="d-flex align-center bg-blue-grey-lighten-5">
      <v-icon class="mr-3" color="info">mdi-help-circle-outline</v-icon>
      <span class="text-h6">請確認</span>
    </v-card-title>
    <v-card-text class="pt-4 text-body-1" v-html="confirmationMessage">
    </v-card-text>
    <v-card-actions>
      <v-spacer></v-spacer>
      <v-btn color="grey-darken-1" variant="text" @click="isConfirmationDialogVisible = false">
        取消
      </v-btn>
      <v-btn color="primary" variant="elevated" @click="proceedWithUpload">
        是，繼續上傳
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

</v-container>
</template>

<script setup>
import { ref, onMounted, computed, nextTick, watch, onUnmounted } from 'vue'; // <--- 在這裡加入 onUnmounted
import { useRoute } from 'vue-router';
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
import { useDate } from 'vuetify'; 
import html2canvas from 'html2canvas';
import { VueSignaturePad } from 'vue-signature-pad';


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
      uploadStep.value = 2; // 驗證成功，前往步驟二
    } else if (result.status === 'needs_confirmation') {
      confirmationMessage.value = result.message;
      isConfirmationDialogVisible.value = true; // 跳出確認對話框
    }
  } catch (error) {
    alert(`驗證失敗：${error.message}`);
  } finally {
    isLoading.value = false;
  }
};

const proceedWithUpload = () => {
  verifiedBookingCode.value = null; // 在沒有代驗紀錄的情況下繼續，bookingCode 設為 null
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

const route = useRoute();
const dateAdapter = useDate();
const projectStore = useProjectStore();
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
const formStep1 = ref({
  building: null,
  unit: null,
  bookingType: null,
  bookingMethod: null,
  companyName: '',
  address: '',
  idNumber: '',
  isOwnerPresent: true // 新增此行，預設為 true (屋主本人到場)
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
  // 只有當狀態碼為 OPEN 時，才允許預約
  return systemStatus.value.code === 'OPEN';
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
 const isSigningInitiated = ref(false); 

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
   受託人Email: '',
   受託人身分證: '',
   受託人戶籍地: '',
   受託人電話: ''
 });

 // 簽名版元件的 ref
 const delegatorSignaturePad = ref(null);


const isAttachmentPreviewVisible = ref(false); // 附件預覽 Dialog
const currentPreviewAttachment = ref(null); // 當前預覽的附件

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
  formStep1.value = { building: null, unit: null, bookingType: null, bookingMethod: null, companyName: '', address: '', idNumber: '',isOwnerPresent: true };
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
  // 如果預約項目是「對保」，則 isOwnerPresent 始終為 true，不受 bookingMethod 影響
  if (formStep1.value.bookingType === '對保') {
    formStep1.value.isOwnerPresent = true; // 再次確保是 true
    isSigningInitiated.value = false; // 但仍然重設授權狀態
    return; // 不執行後續判斷
  }

  // 處理非「對保」時的情況
  if (newMethod === '授權驗屋') {
    formStep1.value.isOwnerPresent = false; // 選擇授權驗屋，強制設為 false
  } else if (newMethod === '屋主自驗') {
    formStep1.value.isOwnerPresent = true; // 選擇屋主自驗，強制設為 true
  } else if (oldMethod === '授權驗屋' || oldMethod === '屋主自驗') {
      // 從“授權”或“自驗”切換到其他方式（例如代驗），預設回 true，讓 chip group 顯示“是”
      formStep1.value.isOwnerPresent = true;
  }
  // 如果 newMethod 是 '代驗公司' 且 oldMethod 也是 '代驗公司' 或 null/undefined，
  // isOwnerPresent 的值由 chip group 控制，此處不變

  // 切換驗屋方式時，重設授權書寄送狀態
  isSigningInitiated.value = false;
});
// --- END: ✓ 修改 watch 監聽 bookingMethod ---


// ✅ 3. 大幅簡化 onMounted 邏輯
onMounted(async () => {
  projectId.value = route.params.projectId;
  isLoading.value = true;
  loadingText.value = '正在載入建案資訊...';

  try {
    // 呼叫 Pinia action 來獲取資料 (它會自動處理快取)
    const data = await projectStore.fetchProjectStaticData(projectId.value);

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
  formStep1.value.bookingType = null;
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

  } else {
    // 正體中文註解：如果清空選項，也清空步驟二的表單
    formStep2.value.姓名 = '';
    formStep2.value.電話 = '';
    formStep2.value.EMAIL = '';
  }
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

// 在 handleStep2Submit 中，修改檢查的旗標
const handleStep2Submit = async () => {

// --- START: ✓ 新增授權書完成檢查 (放在最前面) ---
  // 檢查是否需要授權流程，且尚未完成寄送邀請
  if (formStep1.value.bookingMethod !== '屋主自驗' &&
      formStep1.value.isOwnerPresent === false &&
      !isSigningInitiated.value)
  {
      alert('您選擇了「屋主本人不到場」，請務必完成「填寫驗屋授權書」流程。');
      return; // 阻止繼續執行
  }
  // --- END: ✓ 新增授權書完成檢查 ---

  const { valid } = await step2Form.value.validate();
  if (!valid) return;

  // 檢查：如果選擇了「授權驗屋」，則必須先完成「發起簽署」(維持不變)
  if (formStep1.value.bookingMethod === '授權驗屋' && !isSigningInitiated.value) {
    alert('您選擇了「授權驗屋」，請務必先完成「填寫驗屋授權書」並寄送邀請。');
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
        // 加入從後端獲取的確認 Token
        confirmationToken: confirmationToken.value,

      }
    };
    
    //  提交預約
     const res = await saveBooking(payload);

    if (res.status === 'success') {
      if (res.data && res.data.bookingCode) {
        savedBookingCode.value = res.data.bookingCode;
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
    eventDetails += `選擇方式：${finalBookingData.value.bookingMethod}\n`;
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
  if(uploadStep1FormRef.value) uploadStep1FormRef.value.resetValidation();
  if(uploadStep2FormRef.value) uploadStep2FormRef.value.resetValidation(); // 注意 ref 名稱已改
};

// 組件卸載時清除計時器，防止內存洩漏
onUnmounted(() => {
  clearTimeoutTimer();
// [新增] 清除計時器
  if (timerInterval) clearInterval(timerInterval);
});


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