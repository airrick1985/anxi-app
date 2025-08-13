<template>
 <v-container>
  <v-row justify="center">
   <v-col cols="12" md="8" lg="6">
        <div v-if="projectConfig && projectConfig.logoUrl" class="d-flex justify-center py-2">
          <img :src="projectConfig.logoUrl" alt="Project Logo" style="max-height: 40px; object-fit: contain;">
        </div>

    <v-card v-if="projectConfig" class="mx-auto" :loading="isLoading">
               <v-card-title 
            class="text-h5 font-weight-bold text-center py-2"
            :style="{ backgroundColor: projectConfig.themeColor, color: 'white' }"
          >
      {{ projectConfig.pageTitle }}
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
              <h3 class="text-h6 mb-4">步驟一：請選擇您的預約項目與戶別</h3>
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
        </v-card>

        <v-alert v-if="!projectConfig && !isLoading" type="error" border="start" prominent title="頁面錯誤">
          找不到對應的建案設定，請確認網址是否正確。
        </v-alert>
        <v-alert v-if="projectConfig && !projectConfig.isPublished && !isLoading" type="warning" border="start" prominent title="預約未開放">
          此建案的預約活動尚未開始或已關閉，請靜候通知。
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

</v-container>
</template>

<script setup>
import { ref, onMounted, computed, nextTick } from 'vue'; 
import { useRoute } from 'vue-router';
import { getBookingInitialData, 
  fetchAllUnitsForBooking,
  checkExistingBooking, 
  validateId, 
  getBookingSlots, 
  saveBooking, 
  cancelBooking,
  uploadAuthLetter } from '@/api';
import { useDate } from 'vuetify'; 
import html2canvas from 'html2canvas';
import { VueSignaturePad } from 'vue-signature-pad';

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
    showBookingMethod: true, // 是否顯示驗屋方式
    bookingMethodOptions: ['屋主自驗', '設計師陪驗', '授權驗屋', '代驗公司'],  //可新增選項
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
      faq: [
        { q: "更換門鎖需要花費多久時間？", a: "預計每戶施工時間約為 10-20 分鐘。" },
        { q: "如果預約時段臨時有事怎麼辦？", a: "您可直接取消預約後重新預約時間，或洽詢03-658-8882為您服務。" },
        { q: "自行聯繫廠商聯絡方式？", a: "廠商聯絡窗口 : 永欣鋁窗  曾建維 0930302923" }
      ]
    }
  },
  'fuyu1750': {
    isPublished: true,
    bookingDeadline: null,
    themeColor: '#005A9E',
    projectName: '富宇首馥',
    pageTitle: '富宇首馥 貴賓驗屋預約',
    showBookingMethod: true, // 富宇首馥需要顯示
    bookingMethodOptions: ['屋主自驗', '設計師陪驗', '授權驗屋', '代驗公司'], // 並提供完整的選項
    logoUrl: '/anxi-app/img/logo_fuyu.png',
    intro: {
      greeting: '<p>親愛的<strong>富宇首馥貴賓</strong>您好：</p>',
      body: '<p>歡迎使用「富宇首馥」線上驗屋預約系統，請依下方步驟完成您的預約。</p>',
      alert: {
        show: true, color: 'info', type: 'info', title: '預約須知',
        text: '為確保驗屋流程順暢，請詳閱我們提供的附件說明，並準時於預約時段抵達。'
      },
      footer: '<p>如有任何疑問，請洽您的專屬服務人員或撥打以下電話：</p>',
      contact: { name: "富宇建設 總部", phone: "04-2258-8888" },
      attachments: [
        { title: "初驗注意事項.pdf", url: "/anxi-app/downloads/fuyu1750-inspection-notes.pdf" },
        { title: "標準建材配置表.pdf", url: "/anxi-app/downloads/fuyu1750-materials.pdf" }
      ],
      faq: [
        { q: "整個驗屋流程大約需要多久？", a: "依據不同房型，完整的初驗流程預計需要 1.5 至 2.5 小時。" },
        { q: "驗屋時可以找親友或設計師陪同嗎？", a: "當然可以，歡迎您邀請親友或您的設計師一同前來，但請以兩人為限，以維持現場驗屋品質。" }
      ]
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
          if (initialRes && initialRes.status === 'success' && initialRes.data) initialData.value = initialRes.data;
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
  // --- 新增結束 ---

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
    // --- 步驟 A: 如果有產生授權書，先上傳檔案 ---
    if (isAuthLetterGenerated.value && generatedAuthLetterUrl.value) {
      // 1. 產生檔案名稱
      const today = new Date();
      const yyyymmdd = `${today.getFullYear()}${(today.getMonth() + 1).toString().padStart(2, '0')}${today.getDate().toString().padStart(2, '0')}`;
      const fileName = `${formStep1.value.unit}驗屋授權書${yyyymmdd}.png`;
      
  
  // 呼叫 API 時，補上 projectConfig.value.projectName 和 formStep1.value.unit
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

    // --- 步驟 B: 組合預約資料並送出 (此部分不變) ---
    const payload = {
      action: 'save_booking', // 這是儲存預約資料的 action
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
        授權書路徑: authLetterFinalUrl, // 將上傳後的 URL 加入 payload
      }
    };
    
    // 呼叫原本的 save_booking API
    // (這裡假設您有一個通用的 API 呼叫函式，如果沒有，請比照 uploadFile 的 fetch 寫法)
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
    // 【修改】這裡的參數要與新的 api.js 函式匹配
    const res = await cancelBooking(
        projectConfig.value.projectName, 
        existingBookingInfo.value['預約代碼'] // 使用 '預約代碼' 作為唯一的 KEY
    );

    if (res.status === 'success') {
      alert("預約已成功取消！");
      existingBookingInfo.value = null; // 成功後清空現有預約資訊，畫面會自動更新
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

//加入行事曆
const addToCalendar = () => {
    const title = `${projectConfig.value.projectName}-${finalBookingData.value.bookingType}預約 (${finalBookingData.value.戶別})`;
    const dateStr = finalBookingData.value.預約日期;
    
    // 增加一行來修正時間格式
    const rawTimeStr = finalBookingData.value.預約時段.split('-')[0].trim();
    // 將可能的全形冒號 '：' 替換為半形 ':'
    const timeStr = rawTimeStr.replace(/：/g, ':'); 

    // 使用修正後的 timeStr 來建立日期
    const startDate = new Date(`${dateStr.replace(/\//g, '-')}T${timeStr}`);
    
    // 檢查 startDate 是否有效，以防萬一
    if (isNaN(startDate.getTime())) {
      alert('無法產生行事曆連結，預約的時間格式可能有誤。');
      console.error('Invalid startDate created:', `${dateStr.replace(/\//g, '-')}T${timeStr}`);
      return;
    }

    const endDate = new Date(startDate.getTime() + 60 * 60 * 1000); // 假設為一小時
    const formatDate = (date) => date.toISOString().replace(/-|:|\.\d\d\d/g, "");

    const googleCalendarUrl = `https://www.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(title)}&dates=${formatDate(startDate)}/${formatDate(endDate)}&details=${encodeURIComponent(`戶別：${finalBookingData.value.戶別}`)}&location=${encodeURIComponent(projectConfig.value.projectName)}`;
    
    window.open(googleCalendarUrl, '_blank');
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
</style>