<template>
  <v-container>
    <v-row justify="center">
      <v-col cols="12" md="8" lg="6">
                <v-card v-if="projectConfig" class="mx-auto" :loading="isLoading">
                    <v-card-title class="text-h5 font-weight-bold text-center py-4">
            {{ projectConfig.pageTitle }}
          </v-card-title>
          
          <v-divider></v-divider>

                    <v-card-text v-if="step < 3">
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
            <div v-html="projectConfig.intro.alert.text"></div>
        </v-alert>

        <div v-html="projectConfig.intro.footer"></div>
        <div v-html="projectConfig.intro.contact"></div>
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
                  :disabled="isLoading"
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
                  :disabled="isLoading || !formStep1.building"
                  no-data-text="請先選擇棟別"
                  @update:model-value="onUnitChange"
                ></v-select>

                <v-select
                  v-model="formStep1.bookingType"
                  :items="initialData.bookingTypes"
                  label="預約項目"
                  variant="outlined"
                  :rules="[v => !!v || '預約項目為必填項']"
                  :disabled="isLoading || !formStep1.unit"
                  no-data-text="請先選擇戶別"
                ></v-select>
                
                <v-select
                  v-if="false"
                  v-model="formStep1.bookingMethod"
                  :items="['屋主自驗', '設計師陪驗', '授權驗屋', '代驗公司']"
                  label="驗屋方式"
                  variant="outlined"
                  :rules="[v => !!v || '驗屋方式為必填項']"
                  :disabled="isLoading || !formStep1.unit"
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
                  label="輸入身分證字號 (非必填)"
                  variant="outlined"
                  :disabled="isLoading"
                  hint=""
                ></v-text-field>
              </v-form>
            </v-card-text>
            <v-card-actions class="pa-4">
              <v-spacer></v-spacer>
              <v-btn color="primary" size="large" @click="handleStep1Submit" :loading="isLoading" variant="elevated">確認戶別，下一步</v-btn>
            </v-card-actions>
          </div>
          
                    <div v-if="existingBookingInfo && step === 1">
            <v-card-text>
              <v-alert type="info" variant="tonal" border="start" class="mb-4">
                <h3 class="text-h6 mb-2">您已完成預約</h3>
                <p>我們查詢到您已有一筆有效的預約紀錄，資訊如下：</p>
              </v-alert>
              <v-list lines="two" class="text-left" density="compact">
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
              <v-btn color="error" size="large" variant="elevated" @click="confirmCancelBooking" :loading="isCanceling">取消預約</v-btn>
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
                        color="primary"
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
                <v-btn color="primary" size="large" @click="handleStep2Submit" :loading="isLoading" variant="elevated">確認預約資訊</v-btn>
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
                    <v-list-item title="建案名稱" :subtitle="projectConfig.projectName" prepend-icon="mdi-domain"></v-list-item>
                    <v-list-item title="戶別" :subtitle="finalBookingData.戶別" prepend-icon="mdi-home-variant-outline"></v-list-item>
                    <v-list-item title="姓名" :subtitle="finalBookingData.姓名" prepend-icon="mdi-account-outline"></v-list-item>
                    <v-list-item title="電話" :subtitle="finalBookingData.電話" prepend-icon="mdi-phone-outline"></v-list-item>
                    <v-list-item title="EMAIL" :subtitle="finalBookingData.EMAIL" prepend-icon="mdi-email-outline"></v-list-item>
                    <v-divider class="my-2"></v-divider>
                    <v-list-item title="預約項目" :subtitle="finalBookingData.bookingType" prepend-icon="mdi-format-list-checks"></v-list-item>
                    <v-list-item title="預約日期" :subtitle="finalBookingData.預約日期" prepend-icon="mdi-calendar-check-outline"></v-list-item>
                    <v-list-item title="預約時段" :subtitle="finalBookingData.預約時段" prepend-icon="mdi-clock-time-four-outline"></v-list-item>
                  </v-list>
              </v-card-text>
              <v-card-actions class="pa-4 d-flex justify-space-around">
                  <v-btn prepend-icon="mdi-camera" color="primary" @click="captureAndSave" variant="outlined">截圖預約紀錄</v-btn>
                  <v-btn prepend-icon="mdi-calendar-plus" color="primary" @click="addToCalendar" variant="outlined">加入行事曆</v-btn>
              </v-card-actions>
          </div>
        </v-card>

        <v-alert v-if="!projectConfig && !isLoading" type="error" border="start" prominent>
          錯誤：找不到對應的建案設定，請確認網址是否正確。
        </v-alert>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { useRoute } from 'vue-router';
import { getBookingInitialData, fetchAllUnitsForBooking, checkExistingBooking, getBookingSlots, saveBooking, cancelBooking } from '@/api';
import { useDate } from 'vuetify'; 
import html2canvas from 'html2canvas';

// --- 模組化核心：建案設定檔 ---
const projectConfigurations = {
  'fuyu56': {
    projectName: '富宇上城',
    pageTitle: '富宇上城 後陽台門鎖更換預約',
    intro: {
      greeting: '<p>親愛的<strong>富宇上城1至3樓住戶</strong>您好：</p>',
      body: `
        <p>為強化社區安全，本公司將辦理後陽台門鎖頭更換作業，敬請貴戶儘速預約施工時段。</p>
      `,
         alert: {
        show: true, // 控制是否顯示
        color: '#C51162',
        type: 'warning',
        text: `
          預約截止時間為 <strong>7月30日(星期二)晚間 23:00</strong>。
          <br>
          逾期未預約者，將需自行聯繫配合廠商安排施工，並須自付相關更換費用。
        `
      },
      footer: `
        <p><strong>提醒您</strong>，完成預約後，請於預約時段內<strong>全時段留在室內</strong>，靜候廠商上門更換。</p>
        <p>感謝您的配合與支持！</p>
      `,
      contact: '<p class="contact-info">富宇建設新竹辦公室 03-6588882</p>'
    }
  },
  'fuyu1750': {
    projectName: '富宇首馥',
    pageTitle: '富宇首馥 貴賓驗屋預約',
    intro: {
      greeting: '<p>親愛的<strong>富宇首馥貴賓</strong>您好：</p>',
      body: `
        <p>歡迎使用「富宇首馥」線上驗屋預約系統，請依下方步驟完成您的預約。</p>
      `,
   
      alert: {
        show: true,
        color: 'info',
        type: 'info',
        text: '請注意，此處的公告文字可以為每個建案完全客製化。'
      },
      footer: `
        <p>如有任何疑問，請洽您的專屬服務人員。</p>
      `,
      contact: '<p class="contact-info">富宇建設 總部 04-2258-XXXX</p>'
    }
  }
  // 未來可在此處擴充更多建案
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
const projectId = ref('');
const projectConfig = ref(null); // 存放當前建案的設定

const initialData = ref({
  buildings: [],
  checkDuplicate: 'OFF',
  bookingTypes: [],
});

const allUnitsData = ref({});
const unitList = ref([]);

const bookingSlots = ref({
    startDate: null,
    endDate: null,
    unavailableDates: [],
    timeSlotsByDate: {},
    bookingOptions: {}
});

const formStep1 = ref({
  building: null,
  unit: null,
  bookingType: null,
  bookingMethod: '屋主自驗',
  address: '',
  idNumber: ''
});

const formStep2 = ref({
    姓名: '',
    電話: '',
    EMAIL: '',
    預約日期: null,
    預約時段: null,
});
const existingBookingInfo = ref(null);

// --- Helper Functions ---
const formatDateToYYYYMMDD = (date) => {
    if (!date) return '';
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
}

const formatDisplayDate = (dateString) => {
  if (!dateString) return '';
  return dateAdapter.format(new Date(dateString), 'keyboardDate');
};

// --- Computed Properties ---
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
}

onMounted(async () => {
  projectId.value = route.params.projectId;
  const config = projectConfigurations[projectId.value];

  if (config) {
    projectConfig.value = config;
    try {
        const [initialRes, unitsRes] = await Promise.all([
            getBookingInitialData(projectConfig.value.projectName),
            fetchAllUnitsForBooking(projectConfig.value.projectName)
        ]);

        if (initialRes && initialRes.status === 'success' && initialRes.data) {
          initialData.value = initialRes.data;
        } else {
          throw new Error(initialRes.message || '無法獲取建案資料');
        }

        if (unitsRes && unitsRes.status === 'success' && unitsRes.data) {
          allUnitsData.value = unitsRes.data;
        } else {
          throw new Error(unitsRes.message || '無法獲取戶別資料');
        }

    } catch (error) {
      console.error("讀取初始資料失敗:", error);
      alert("系統忙碌中，無法讀取預約資料，請稍後再試。");
    } finally {
      isLoading.value = false;
    }
  } else {
    alert("無效的建案預約路徑");
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
  if (selectedUnit) {
    formStep1.value.address = selectedUnit.address;
  }
  formStep1.value.bookingType = null;
  existingBookingInfo.value = null;
  step.value = 1;
};

const onDateChange = () => {
    formStep2.value.預約時段 = null;
}

const handleStep1Submit = async () => {
    const { valid } = await step1Form.value.validate();
    if (!valid) return;
    isLoading.value = true;
    existingBookingInfo.value = null;
    try {
        if (initialData.value.checkDuplicate === 'ON') {
            const res = await checkExistingBooking(projectConfig.value.projectName, formStep1.value.unit, formStep1.value.bookingType);
            if (res.status === 'success' && res.data.status === 'found') {
                existingBookingInfo.value = res.data.booking;
                return;
            }
        }
        const res = await getBookingSlots(
          projectConfig.value.projectName, 
          formStep1.value.unit, 
          formStep1.value.bookingType, 
          formStep1.value.bookingMethod
        );
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
    step.value = 3;
}

const handleGoBackAndRefresh = async () => {
    isLoading.value = true;
    try {
        const res = await getBookingSlots(
            projectConfig.value.projectName, 
            formStep1.value.unit, 
            formStep1.value.bookingType, 
            formStep1.value.bookingMethod
        );
        if (res.status === 'success' && res.data) {
            bookingSlots.value = res.data;
            step.value = 2;
        } else {
            throw new Error(res.message || '無法刷新預約時段，請稍後再試');
        }
    } catch (error) {
        console.error("返回並刷新時段失敗:", error);
        alert(`操作失敗：${error.message}`);
    } finally {
        isLoading.value = false;
    }
}

const submitBooking = async () => {
    isLoading.value = true;
    try {
        const payload = {
            戶別: finalBookingData.value.戶別,
            姓名: finalBookingData.value.姓名,
            電話: finalBookingData.value.電話,
            EMAIL: finalBookingData.value.EMAIL,
            預約項目: finalBookingData.value.bookingType,
            預約日期: finalBookingData.value.預約日期,
            預約時段: finalBookingData.value.預約時段,
            驗屋方式: finalBookingData.value.bookingMethod,
            受託人姓名: '',
            受託人電話: '',
        }
        const res = await saveBooking(projectConfig.value.projectName, payload);
        if (res.status === 'success') {
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
}

const confirmCancelBooking = () => {
    if (confirm("您確定要取消這個預約嗎？此操作無法復原。")) {
        handleCancelBooking();
    }
}

const handleCancelBooking = async () => {
    isCanceling.value = true;
    try {
        const res = await cancelBooking(projectConfig.value.projectName, formStep1.value.unit, existingBookingInfo.value['預約項目']);
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
}

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
}

const addToCalendar = () => {
    const title = `${projectConfig.value.projectName}-${finalBookingData.value.bookingType}預約 (${finalBookingData.value.戶別})`;
    const dateStr = finalBookingData.value.預約日期;
    const timeStr = finalBookingData.value.預約時段.split('-')[0].trim();
    const startDate = new Date(`${dateStr.replace(/\//g, '-')}T${timeStr}`);
    const endDate = new Date(startDate.getTime() + 60 * 60 * 1000);
    const formatDate = (date) => date.toISOString().replace(/-|:|\.\d\d\d/g, "");
    const googleCalendarUrl = `https://www.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(title)}&dates=${formatDate(startDate)}/${formatDate(endDate)}&details=${encodeURIComponent(`戶別：${finalBookingData.value.戶別}`)}&location=${encodeURIComponent(projectConfig.value.projectName)}`;
    window.open(googleCalendarUrl, '_blank');
}
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
</style>