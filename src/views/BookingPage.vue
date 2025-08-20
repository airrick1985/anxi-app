<template>
  <v-container>
    <v-row justify="center">
      <v-col cols="12" md="8" lg="6">
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
              <span>{{ projectConfig.projectName }} 上傳驗屋報告</span>
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
                    :items="initialData.buildings"
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
              class="text-h5 font-weight-bold py-2 d-flex align-center"
              :style="{ backgroundColor: projectConfig.themeColor, color: 'white' }"
            >
              <span>{{ projectConfig.pageTitle }}</span>
              <v-spacer></v-spacer>
              <v-btn
                v-if="step === 1"
                prepend-icon="mdi-file-upload-outline"
                variant="outlined"
                @click="isUploadMode = true"
              >
                上傳驗屋報告
              </v-btn>
            </v-card-title>
            <v-divider></v-divider>

            <v-card-text v-if="step < 3">
            <div v-if="!isBookingActive" class="mb-4">
              <v-alert type="error" prominent border="start" title="預約已截止">
                此預約已結束，如有疑問請洽服務人員。
              </v-alert>
            </div>
            <div class="prose">
                <div v-html="projectConfig.intro.greeting"></div>
                <div v-html="projectConfig.intro.body"></div>

                <v-alert
                    v-if="projectConfig.intro.alert.show"
                    :color="projectConfig.intro.alert.color"
                    :type="projectConfig.intro.alert.type"
                    class="mb-4"
                    border="start"
                    density="compact"
                >
                    <template v-slot:title>
                      <div v-if="projectConfig.intro.alert.title" class="font-weight-bold">{{ projectConfig.intro.alert.title }}</div>
                    </template>
                    <div v-html="projectConfig.intro.alert.text"></div>
                </v-alert>

                <div v-html="projectConfig.intro.footer"></div>
                
                <div class="contact-info" v-if="projectConfig.intro.contact">
                  {{ projectConfig.intro.contact.name }}: 
                  <a :href="'tel:' + projectConfig.intro.contact.phone.replace(/-/g, '')">{{ projectConfig.intro.contact.phone }}</a>
                </div>

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
                  v-model="formStep1.address"
                  label="門牌"
                  variant="outlined"
                  readonly
                  disabled
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
       <v-btn prepend-icon="mdi-file-upload-outline" variant="text" @click="isUploadMode = true">上傳驗屋報告</v-btn>
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

<v-list lines="two" class="text-left" density="compact">
    
    <v-list-item title="預約代碼" :subtitle="existingBookingInfo['預約代碼']" prepend-icon="mdi-pound-box-outline">
        <template v-slot:subtitle="{ subtitle }">
            <span class="font-weight-bold text-h6 text-red-darken-2">{{ subtitle }}</span>
        </template>
    </v-list-item>

    <v-list-item title="建案名稱" :subtitle="projectConfig.projectName" prepend-icon="mdi-domain"></v-list-item>
    <v-list-item title="戶別" :subtitle="existingBookingInfo['戶別']" prepend-icon="mdi-home-variant-outline"></v-list-item>
    <v-list-item title="姓名" :subtitle="existingBookingInfo['姓名']" prepend-icon="mdi-account-outline"></v-list-item>
    <v-list-item title="電話" :subtitle="existingBookingInfo['電話']" prepend-icon="mdi-phone-outline"></v-list-item>
    <v-list-item title="EMAIL" :subtitle="existingBookingInfo['EMAIL']" prepend-icon="mdi-email-outline"></v-list-item>
    <v-divider class="my-2"></v-divider>
    <v-list-item title="預約項目" :subtitle="existingBookingInfo['預約項目']" prepend-icon="mdi-format-list-checks"></v-list-item>
    <v-list-item title="預約日期" :subtitle="formatDisplayDate(existingBookingInfo['預約日期'])" prepend-icon="mdi-calendar-check-outline"></v-list-item>
    <v-list-item title="預約時段" :subtitle="existingBookingInfo['預約時段']" prepend-icon="mdi-clock-time-four-outline"></v-list-item>
    <v-list-item title="預約狀態" :subtitle="existingBookingInfo['預約狀態']" prepend-icon="mdi-list-status">
        <template v-slot:subtitle="{ subtitle }">
            <v-chip color="info" size="small" label>{{ subtitle }}</v-chip>
        </template>
    </v-list-item>
</v-list>
            </v-card-text>
            <v-card-actions class="pa-4">
              <v-btn prepend-icon="mdi-file-upload-outline" variant="text" @click="isUploadMode = true">上傳驗屋報告</v-btn>
              <v-spacer></v-spacer>
              <v-btn color="error" size="large" variant="elevated" @click="confirmCancelBooking" :loading="isCanceling" :disabled="!isBookingActive">取消預約</v-btn>
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
                    >
                        <template v-slot:item="{ props, item }">
                            <v-list-item v-bind="props" :disabled="item.raw.includes('已額滿')"></v-list-item>
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
                <v-list-item title="建案名稱" :subtitle="projectConfig.projectName"></v-list-item>
                <v-list-item title="戶別" :subtitle="finalBookingData.戶別"></v-list-item>
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

                    <v-list-item title="建案名稱" :subtitle="projectConfig.projectName" prepend-icon="mdi-domain"></v-list-item>
                    <v-list-item title="戶別" :subtitle="finalBookingData.戶別" prepend-icon="mdi-home-variant-outline"></v-list-item>
                    <v-list-item title="姓名" :subtitle="finalBookingData.姓名" prepend-icon="mdi-account-outline"></v-list-item>
                    <v-list-item title="電話" :subtitle="finalBookingData.電話" prepend-icon="mdi-phone-outline"></v-list-item>
                    <template v-if="finalBookingData.bookingMethod === '授權驗屋'">
                    <v-list-item title="受託人姓名" :subtitle="finalBookingData.受託人姓名" prepend-icon="mdi-account-tie"></v-list-item>
                    <v-list-item title="受託人電話" :subtitle="finalBookingData.受託人電話" prepend-icon="mdi-phone-forward"></v-list-item>
                    </template>
                    <v-list-item title="EMAIL" :subtitle="finalBookingData.EMAIL" prepend-icon="mdi-email-outline"></v-list-item>
                    <v-divider class="my-2"></v-divider>

                   <v-list-item v-if="finalAuthLetterUrl">
                      <v-btn :href="finalAuthLetterUrl" target="_blank" color="teal" variant="outlined" block>
                        <v-icon left>mdi-file-check-outline</v-icon>
                        查看已上傳的授權書
                      </v-btn>
                    </v-list-item>


                    <v-list-item title="預約項目" :subtitle="finalBookingData.bookingType" prepend-icon="mdi-format-list-checks"></v-list-item>
                    <v-list-item title="預約日期" :subtitle="finalBookingData.預約日期" prepend-icon="mdi-calendar-check-outline"></v-list-item>
                    <v-list-item title="預約時段" :subtitle="finalBookingData.預約時段" prepend-icon="mdi-clock-time-four-outline"></v-list-item>
                </v-list>
            </v-card-text>
              <v-card-actions class="pa-4 d-flex justify-space-around">
                  <v-btn prepend-icon="mdi-camera" :color="projectConfig.themeColor" @click="captureAndSave" variant="outlined">截圖預約紀錄</v-btn>
                  <v-btn prepend-icon="mdi-calendar-plus" :color="projectConfig.themeColor" @click="addToCalendar" variant="outlined">加入行事曆</v-btn>
              </v-card-actions>
          </div>
          </template>
        </v-card>

        <v-alert v-if="!projectConfig && !isLoading" type="error" border="start" prominent title="頁面錯誤">
          找不到對應的建案設定，請確認網址是否正確。
        </v-alert>
        <v-alert v-if="projectConfig && !projectConfig.isPublished && !isLoading" type="warning" border="start" prominent title="預約未開放">
          此建案的預約活動尚未開始或已關閉，請静候通知。
        </v-alert>
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
        <v-card-title class="text-subtitle-1 pa-0">委託人簽名</v-card-title>
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

</v-container>
</template>

<script setup>
import { ref, onMounted, computed, nextTick } from 'vue'; 
import { useRoute } from 'vue-router';
import { 
  getBookingInitialData, 
  fetchAllUnitsForBooking,
  checkExistingBooking, 
  validateId, 
  getBookingSlots, 
  saveBooking, 
  cancelBooking,
  uploadAuthLetter,
  uploadInspectionReport // <-- ✅ 引入新的 API 函式
} from '@/api';
import { useDate } from 'vuetify'; 
import html2canvas from 'html2canvas';
import { VueSignaturePad } from 'vue-signature-pad';

// --- ✅ 新增: 上傳報告相關 state ---
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

// --- 模組化核心：建案設定檔 ---
const projectConfigurations = {
  'fuyu56': {
    isPublished: true,
    bookingDeadline: '2025-08-30T23:00:00+08:00',//截止日期設定
    themeColor: '#005A9E',
    projectName: '富宇上城',
    pageTitle: '富宇上城 後陽台門鎖更換預約',
    bookingTypes: ['初驗','複驗'], 
    showBookingMethod: true,// 是否顯示驗屋方式
    bookingMethodOptions: ['屋主自驗', '設計師陪驗', '授權驗屋', '代驗公司'],
    logoUrl: '/anxi-app/img/logo_fuyu.png',
 // --- 驗屋授權書開始 ---
    authLetterTemplate: `
       <div style="font-family: 'kaiu', 'BiauKai', '標楷體', serif; color: black; padding: 40px; text-align: center;">
        
       <div style="text-align: left; margin-bottom: 10px;">
          <img src="{logoUrl}" alt="Project Logo" style="max-height: 30px; object-fit: contain;" />
        </div>
        <h1 style="font-size: 28px; font-weight: bold; margin-bottom: 40px;">授 &nbsp; 權 &nbsp; 書</h1>
        <div style="text-align: left; font-size: 18px; line-height: 2.5; margin-bottom: 40px;">
          <p style="text-indent: 2em;">
            立書人 {委託人姓名} 玆就購買富宇建設興建之【{建案名稱}】編號 {戶別} 房地壹戶，因故無法親自辦理房屋驗屋相關事宜，特此委任 {受託人姓名} 代為簽署上述事務之有關一切文件，本人亦同意日後不對受託人所簽署之文件提出任何異議，特立此授權書以資證明。
          </p>
          <p style="margin-top: 40px;">此 致</p>
          <p>富宇建設股份有限公司</p>
        </div>
        <table style="width: 100%; margin-top: 60px; font-size: 18px; text-align: left; border-collapse: collapse;">
          <tr>
            <td style="width: 120px;"><strong>委託人:</strong></td>
            <td><img src="{委託人簽名圖檔}" alt="委託人簽名" style="height: 50px;"/></td>
          </tr>
          <tr>
            <td><strong>身分證字號:</strong></td>
            <td>{委託人身分證字號}</td>
          </tr>
          <tr>
            <td><strong>戶籍地址:</strong></td>
            <td>{委託人戶籍地址}</td>
          </tr>
          <tr>
            <td colspan="2" style="padding: 20px 0;"></td>
          </tr>
          <tr>
            <td><strong>受託人:</strong></td>
            <td><img src="{受託人簽名圖檔}" alt="受託人簽名" style="height: 50px;"/></td>
          </tr>
          <tr>
            <td><strong>身分證字號:</strong></td>
            <td>{受託人身分證字號}</td>
          </tr>
          <tr>
            <td><strong>戶籍地址:</strong></td>
            <td>{受託人戶籍地址}</td>
          </tr>
        </table>
        <div style="text-align: right; font-size: 18px; margin-top: 80px;">{TODAY}</div>
      </div>
    `,
    // 驗屋授權書結束    
    intro: {
      greeting: '<p>親愛的<strong>富宇上城1至3樓住戶</strong>您好：</p>',
      body: '<p>為強化社區安全，本公司將辦理後陽台門鎖頭更換作業，敬請貴戶儘速預約施工時段。</p>',
      alert: {
        show: true,
        type: 'warning',
        color: '#C51162',
        title: '預約截止時間',
        text: `<strong>7月30日(星期二)晚間 23:00</strong>。<br>逾期未預約者，視同自動放棄．若需更換則自行聯繫配合廠商安排施工，並自付相關費用。`
      },
      footer: `<p><strong>提醒您</strong>，完成預約後，請於預約時段內<strong>全時段留在室內</strong>，靜候廠商上門更換。</p><p>感謝您的配合與支持！如有任何疑問，請洽：</p>`,
      contact: { name: "富宇建設-新竹辦公室", phone: "03-658-8882" },
       attachments: [
        { title: "初驗注意事項.pdf", url: "/anxi-app/downloads/fuyu1750-inspection-notes.pdf" },
        { title: "標準建材配置表.pdf", url: "/anxi-app/downloads/fuyu1750-materials.pdf" }
      ],
      faq: [
        { q: "更換門鎖需要花費多久時間？", a: "預計每戶施工時間約為 10-20 分鐘。" },
        { q: "如果預約時段臨時有事怎麼辦？", a: "您可直接取消預約後重新預約時間，或洽詢03-658-8882為您服務。" },
        { q: "自行聯繫廠商聯絡方式？", a: "廠商聯絡窗口 : 永欣鋁窗  曾建維 0930302923" }
      ]
    },
    // ✅ 新增: 上傳報告頁面的說明文字
    reportUploadIntro: {
      body: '<p>請填寫以下資訊並上傳您的驗屋報告電子檔(PDF)。</p>',
      alert: {
        show: true,
        type: 'info',
        color: 'primary',
        title: '上傳須知',
        text: '初驗報告及複驗報告每戶僅限上傳一份，若報告有修改需重新上傳，請洽服務電話：<a href="tel:03-6588882">03-658-8882</a>。如果您的檔案超過30MB，請先至 <a href="https://www.ilovepdf.com/zh-tw/compress_pdf" target="_blank">ilovepdf.com</a> 進行壓縮。'
      }
    }
  },

  'fuyu61': {
    isPublished: true,
    bookingDeadline: null,
    themeColor: '#005A9E',
    projectName: '富宇富御',
    pageTitle: '富宇富御 貴賓驗屋預約',
    bookingTypes: ['初驗','複驗'], 
    showBookingMethod: true,
    bookingMethodOptions: ['屋主自驗', '設計師陪驗', '授權驗屋', '代驗公司'],
    logoUrl: '/anxi-app/img/logo_fuyu.png',
    intro: {
       greeting: '<p>親愛的<strong>富宇富御貴賓</strong>您好：</p>',
       body: '<p>歡迎使用「富宇富御」線上驗屋預約系統，請依下方步驟完成您的預約。</p>',
       alert: {
            show: true,
            color: '#C51162',
            type: 'info',
            title: '驗屋說明',
            text: `
              <p>親愛的客戶，感謝您承購「富宇富御」，本案已於114/03/06取得使用執照，並於室內屋況完成後進行驗收。</p>
              <p>因驗屋時段分別，請盡早填妥以下資訊預約，以便為您事先安排服務人員，謝謝您的配合。</p>
              
              <ul class="pl-5 mt-4" style="list-style-type: none;">
                <li class="mb-2"><strong>⚠️</strong> 驗屋公司因驗屋時間需求僅開放預約9:30或13:30。</li>
                <li class="mb-2"><strong>⚠️</strong> 若有驗屋公司請於驗屋系統填寫驗屋公司名稱。</li>
                <li class="mb-2"><strong>⚠️</strong> 驗屋公司-自行檢測水電及弱電。</li>
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
      contact: { name: "富宇建設-新竹辦公室", phone: "03-658-8882" },
      attachments: [
       //無附件
      ],
      faq: [
        { q: "整個驗屋流程大約需要多久？", a: "依據不同房型，完整的初驗流程預計需要 1.5 至 2.5 小時。" },
        { q: "驗屋時可以找親友或設計師陪同嗎？", a: "當然可以，歡迎您邀請親友或您的設計師一同前來，但請以兩人為限，以維持現場驗屋品質。" }
      ]
    },
     // ✅ 新增: 上傳報告頁面的說明文字
    reportUploadIntro: {
      body: '<p>請填寫以下資訊並上傳您的驗屋報告電子檔(PDF)。</p>',
      alert: {
        show: true,
        type: 'info',
        color: 'red-darken-4',
        title: '上傳須知',
        text: '初驗與複驗報告若有修改皆可重新上傳，系統將以最新版本為主。若檔案超過30MB，請先至 <a href="https://www.ilovepdf.com/zh-tw/compress_pdf" target="_blank">ilovepdf.com</a> 進行壓縮。'
      }
    }
  }
};

const route = useRoute();
const dateAdapter = useDate();
const step1Form = ref(null);
const step2Form = ref(null);
const bookingResultCard = ref(null);

// --- State ---
const isLoading = ref(true);
const isCanceling = ref(false);
const step = ref(1);
const savedBookingCode = ref(''); 
const projectId = ref('');
const projectConfig = ref(null);

const initialData = ref({ buildings: [], checkDuplicate: 'OFF', bookingTypes: [], validateId: 'OFF' });
const allUnitsData = ref({});
const unitList = ref([]);
const bookingSlots = ref({ startDate: null, endDate: null, unavailableDates: [], timeSlotsByDate: {}, bookingOptions: {} });
const formStep1 = ref({ building: null, unit: null, bookingType: null, bookingMethod: '屋主自驗', address: '', idNumber: '' });
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

const finalBookingData = computed(() => ({
  ...formStep1.value,
  ...formStep2.value,
  戶別: formStep1.value.unit,
  預約日期: formStep2.value.預約日期 ? dateAdapter.format(formStep2.value.預約日期, 'keyboardDate') : null,
}));
const availableTimeSlots = computed(() => {
  if (!formStep2.value.預約日期) return [];
  const dateKey = formatDateToYYYYMMDD(formStep2.value.預約日期);
  return bookingSlots.value.timeSlotsByDate[dateKey] || [];
});

// --- Methods ---
const isDateAllowed = (date) => {
  const dateStr = formatDateToYYYYMMDD(date);
  return !bookingSlots.value.unavailableDates.includes(dateStr);
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
    .replace(/{建案名稱}/g, projectConfig.value.projectName)
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

onMounted(async () => {
  projectId.value = route.params.projectId;
  const config = projectConfigurations[projectId.value];
  if (config) {
    projectConfig.value = config;
    if (config.isPublished) {
      try {
          const [initialRes, unitsRes] = await Promise.all([
            getBookingInitialData(projectConfig.value.projectName),
            fetchAllUnitsForBooking(projectConfig.value.projectName)
          ]);
          if (initialRes && initialRes.status === 'success' && initialRes.data) {
                      if (Array.isArray(initialRes.data.buildings)) {
                        initialRes.data.buildings.sort((a, b) => a.localeCompare(b, 'zh-Hant-TW'));
                      }
                      initialData.value = initialRes.data;}          
                    else throw new Error(initialRes.message || '無法獲取建案資料');
          if (unitsRes && unitsRes.status === 'success' && unitsRes.data) allUnitsData.value = unitsRes.data;
          else throw new Error(unitsRes.message || '無法獲取戶別資料');
      } catch (error) {
        console.error("讀取初始資料失敗:", error);
        alert("系統忙碌中，無法讀取預約資料，請稍後再試。");
      } finally {
        isLoading.value = false;
      }
    } else {
      isLoading.value = false;
    }
  } else {
    isLoading.value = false;
  }
});

const onBuildingChange = (building) => {
  formStep1.value.unit = null;
  formStep1.value.address = '';
  formStep1.value.bookingType = null;
  existingBookingInfo.value = null;
  step.value = 1;
  if (!building) { unitList.value = []; return; }
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

 isLoading.value = true;
 existingBookingInfo.value = null;

 try {
    // --- 步驟 1: 身分驗證 (如果需要) ---
    if (isIdValidationRequired.value) {
      const validationRes = await validateId(
        projectConfig.value.projectName,
        formStep1.value.unit,
        formStep1.value.idNumber
      );
      // 如果驗證失敗，就拋出錯誤並中斷流程
      if (validationRes.status !== 'success') {
        throw new Error(validationRes.message || '身分驗證失敗');
      }
    }

    // --- 步驟 2: 檢查現有預約 (身分驗證通過後執行) ---
  if (initialData.value.checkDuplicate === 'ON') {
const res = await checkExistingBooking(
        projectConfig.value.projectName, 
        formStep1.value.unit, 
        formStep1.value.bookingType,
        formStep1.value.idNumber
      );
      
if (res.status === 'success' && res.data.status === 'found') {
    existingBookingInfo.value = res.data.booking;
        isLoading.value = false; // 找到預約，結束 loading
    return; // 中斷流程
   }
  }

    // --- 步驟 3: 獲取可預約時段 (前面都通過後執行) ---
  const res = await getBookingSlots(projectConfig.value.projectName, formStep1.value.unit, formStep1.value.bookingType, formStep1.value.bookingMethod);
  if (res.status === 'success' && res.data) {
   bookingSlots.value = res.data;
   step.value = 2;
  } else {
   throw new Error(res.message || '無法獲取可預約時段');
  }
 } catch (error) {
  console.error("步驟一處理失敗:", error);
  alert(`操作失敗：${error.message}`);
 } finally {
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
  isLoading.value = true;
  try {
    const res = await getBookingSlots(projectConfig.value.projectName, formStep1.value.unit, formStep1.value.bookingType, formStep1.value.bookingMethod);
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
  isLoading.value = true;
  let authLetterFinalUrl = ''; 

  try {
    if (isAuthLetterGenerated.value && generatedAuthLetterUrl.value) {
      const today = new Date();
      const yyyymmdd = `${today.getFullYear()}${(today.getMonth() + 1).toString().padStart(2, '0')}${today.getDate().toString().padStart(2, '0')}`;
      const fileName = `${formStep1.value.unit}驗屋授權書${yyyymmdd}.png`;
      
      const uploadRes = await uploadAuthLetter(
        generatedAuthLetterUrl.value,
        fileName,
        projectConfig.value.projectName,
        formStep1.value.unit 
      );
      
      if (uploadRes.status !== 'success') {
        throw new Error(uploadRes.message || '授權書上傳失敗');
      }

      authLetterFinalUrl = uploadRes.url; 
      finalAuthLetterUrl.value = uploadRes.url; 
    }

    const payload = {
      action: 'save_booking',
      projectName: projectConfig.value.projectName,
      bookingData: {
        戶別: finalBookingData.value.戶別,
        門牌: finalBookingData.value.address,
        姓名: finalBookingData.value.姓名,
        電話: finalBookingData.value.電話,
        EMAIL: finalBookingData.value.EMAIL,
        身分證: finalBookingData.value.idNumber, 
        預約項目: finalBookingData.value.bookingType,
        預約日期: finalBookingData.value.預約日期,
        預約時段: finalBookingData.value.預約時段,
        驗屋方式: finalBookingData.value.bookingMethod,
        受託人姓名: finalBookingData.value.受託人姓名,
        受託人電話: finalBookingData.value.受託人電話,
        授權書路徑: authLetterFinalUrl,
      }
    };
    
    const res = await saveBooking(projectConfig.value.projectName, payload.bookingData);

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

const confirmCancelBooking = () => {
  if (confirm("您確定要取消這個預約嗎？此操作無法復原。")) handleCancelBooking();
};

const handleCancelBooking = async () => {
  isCanceling.value = true;
  try {
    const res = await cancelBooking(
        projectConfig.value.projectName, 
        existingBookingInfo.value['預約代碼']
    );

    if (res.status === 'success') {
      alert("預約已成功取消！");
      existingBookingInfo.value = null;
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
const captureAndSave = async () => {
  if (!bookingResultCard.value) return;
  try {
    const canvas = await html2canvas(bookingResultCard.value.$el);
    const imageURL = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.href = imageURL;
    link.download = `${projectConfig.value.projectName}預約紀錄_${finalBookingData.value.戶別}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } catch (error) {
    console.error('截圖失敗:', error);
    alert('截圖失敗，請手動截圖保存。');
  }
};

const addToCalendar = () => {
    const title = `${projectConfig.value.projectName}-${finalBookingData.value.bookingType}預約 (${finalBookingData.value.戶別})`;
    const dateStr = finalBookingData.value.預約日期;
    const rawTimeStr = finalBookingData.value.預約時段.split('-')[0].trim();
    const timeStr = rawTimeStr.replace(/：/g, ':'); 

    const startDate = new Date(`${dateStr.replace(/\//g, '-')}T${timeStr}`);
    
    if (isNaN(startDate.getTime())) {
      alert('無法產生行事曆連結，預約的時間格式可能有誤。');
      console.error('Invalid startDate created:', `${dateStr.replace(/\//g, '-')}T${timeStr}`);
      return;
    }

    const endDate = new Date(startDate.getTime() + 60 * 60 * 1000); 
    const formatDate = (date) => date.toISOString().replace(/-|:|\.\d\d\d/g, "");

    const googleCalendarUrl = `https://www.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(title)}&dates=${formatDate(startDate)}/${formatDate(endDate)}&details=${encodeURIComponent(`戶別：${finalBookingData.value.戶別}`)}&location=${encodeURIComponent(projectConfig.value.projectName)}`;
    
    window.open(googleCalendarUrl, '_blank');
};


// --- ✅ 新增: 上傳報告相關 methods ---
const onUploadBuildingChange = (building) => {
  uploadForm.value.unit = null;
  if (!building) {
    uploadUnitList.value = [];
    return;
  }
  uploadUnitList.value = allUnitsData.value[building] || [];
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

const handleFileSelect = (event) => {
  const files = event.target.files;
  if (files.length > 0) {
    processFile(files[0]);
  }
};

const processFile = (file) => {
  if (file.type !== 'application/pdf') {
    alert('檔案格式錯誤，僅限上傳 PDF 檔案。');
    return;
  }
  if (file.size > 30 * 1024 * 1024) { // 30MB
    isSizeErrorDialogVisible.value = true; 
    return;
  }

  const reader = new FileReader();
  reader.onload = (e) => {
    uploadForm.value.file = {
      name: file.name,
      size: file.size,
      type: file.type,
      base64: e.target.result,
    };
  };
  reader.readAsDataURL(file);
};

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

  isLoading.value = true;
  try {
    const payload = {
      projectName: projectConfig.value.projectName,
      reportType: uploadForm.value.reportType,
      buyerName: uploadForm.value.buyerName,
      phone: uploadForm.value.phone,
      email: uploadForm.value.email,
      building: uploadForm.value.building,
      unit: uploadForm.value.unit,
      companyName: uploadForm.value.companyName,
      file: {
        base64: uploadForm.value.file.base64,
        name: uploadForm.value.file.name,
        type: uploadForm.value.file.type,
      },
    };
    
    const res = await uploadInspectionReport(payload);

    if (res.status === 'success') {
      uploadSuccess.value = true;
    } else {
      throw new Error(res.message || '上傳失敗，請稍後再試。');
    }
  } catch (error) {
    console.error('上傳報告失敗:', error);
    alert(`上傳失敗：${error.message}`);
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
/* ✅ 新增: 上傳元件樣式 */
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