<template>
  <v-dialog v-model="dialog" max-width="700px" persistent scrollable>
    <v-card>
      <v-card-title class="bg-grey-darken-4 text-white d-flex align-center">
        <v-icon start>mdi-message-cog</v-icon>
        <span>簡訊提醒功能管理</span>
        <v-spacer></v-spacer>
        <v-chip
          v-if="currentBalance !== null"
          :color="isBalanceLow ? 'error' : 'success'"
          class="mr-4"
          variant="flat"
          size="small"
        >
          <v-icon start size="small">mdi-database</v-icon>
          餘額：{{ currentBalance }} 點
        </v-chip>

        <v-btn icon="mdi-close" variant="text" @click="close"></v-btn>
      </v-card-title>

     <v-card-text class="pa-4">
        <v-tabs v-model="tab" color="primary" grow>
          <v-tab value="settings">設定與範本</v-tab>
          <v-tab value="preview">即時預覽</v-tab>
          <v-tab value="account">帳號餘額管理</v-tab> 
        </v-tabs>

        

        <v-window v-model="tab" class="mt-4">
          <v-window-item value="settings">
            <v-form ref="formRef" v-model="isValid">
              <v-row>
                <v-col cols="12" sm="6">
                  <v-switch
                    v-model="settings.enabled"
                    label="啟用簡訊提醒"
                    color="success"
                    inset
                    hide-details
                  ></v-switch>
                </v-col>
                    <v-col cols="12" sm="8">
                    <v-select
                        v-model="settings.sendStrategy"
                        :items="sendStrategies"
                        label="發送時間模式"
                        variant="outlined"
                        density="compact"
                        @update:model-value="onStrategyChange"
                    ></v-select>
                    </v-col>

                    <v-col cols="12" sm="4" v-if="settings.sendStrategy === 'day_before'">
                    <v-text-field
                        v-model="settings.fixedTime"
                        label="指定時間"
                        type="time"
                        variant="outlined"
                        density="compact"
                    ></v-text-field>
                    </v-col>

              <v-col cols="12" sm="4" v-if="settings.sendStrategy === 'hours_before'">
                <v-select
                  v-model="settings.sendBeforeHours"
                  :items="hourOptions"
                  label="提前小時"
                  variant="outlined"
                  density="compact"
                  suffix="發送"
                ></v-select>
              </v-col>
              </v-row>

              <div class="text-subtitle-2 mb-1 text-primary">簡訊範本編輯</div>
              <v-textarea
                v-model="settings.template"
                variant="outlined"
                rows="6"
                placeholder="輸入簡訊內容..."
                :rules="templateRules"
                counter
              ></v-textarea>
              <div class="d-flex flex-wrap gap-2 mb-4">
                <v-chip v-for="tag in availableTags" :key="tag" size="small" @click="insertTag(tag)" label color="grey-lighten-2">
                  {{ tag }}
                </v-chip>
              </div>

              <v-divider class="my-4"></v-divider>
              
              <div class="text-subtitle-2 mb-2">測試發送</div>
              <v-row align="center">
                <v-col cols="8">
                  <v-text-field v-model="testPhone" label="測試手機號碼" variant="underlined" density="compact" placeholder="09xxxxxxxx"></v-text-field>
                </v-col>
                <v-col cols="4">
                <v-btn
                  color="primary"
                  :loading="sendingTest"
                  @click="testSend"
                >
                  發送測試簡訊
                </v-btn>
                </v-col>
              </v-row>
            </v-form>
          </v-window-item>

          <v-window-item value="preview">
            <div class="phone-preview pa-4 mx-auto">
              <div class="preview-content pa-3">
                {{ previewText }}
              </div>
            </div>
            <div class="text-center text-caption mt-2 text-grey">
              估計字數: {{ previewText.length }} 字 (約 {{ Math.ceil(previewText.length / 70) }} 則點數)
            </div>
          </v-window-item>

          <v-window-item value="logs">
            <v-list lines="two">
              <v-list-item v-for="n in 3" :key="n" :title="'測試客戶 ' + n" :subtitle="'2026-01-06 14:00 | 狀態: 成功(100)'"></v-list-item>
            </v-list>
          </v-window-item>
        </v-window>

        <v-window v-model="tab" class="mt-4">
        <v-window-item value="account">
          <v-alert
            v-if="isBalanceLow"
            type="warning"
            variant="tonal"
            density="compact"
            class="mb-4"
          >
            餘額點數較低，請儘速聯繫業務或於官方平台加值。
          </v-alert>

          <v-list border rounded>
            <v-list-item>
              <template v-slot:prepend>
                <v-icon color="primary">mdi-database</v-icon>
              </template>
              <v-list-item-title>目前帳號點數</v-list-item-title>
              <v-list-item-subtitle>
                <span class="text-h5 font-weight-bold text-primary">{{ currentBalance ?? '---' }}</span> 點
              </v-list-item-subtitle>
              <template v-slot:append>
                <v-btn
                  icon="mdi-refresh"
                  variant="text"
                  :loading="loadingBalance"
                  @click="refreshBalance"
                ></v-btn>
              </template>
            </v-list-item>
          </v-list>
          
          <div class="mt-4 text-caption text-grey">
            * 點數計算方式依 EVERY8D 官方合約為準。
            <br />* 建議每 8 小時系統會自動更新連線憑證。
          </div>
        </v-window-item>
          
          </v-window>

      </v-card-text>

      <v-card-actions class="pa-4">
        <v-btn variant="text" @click="close">取消</v-btn>
        <v-spacer></v-spacer>
        <v-btn color="primary" variant="flat" :loading="saving" @click="save">儲存設定</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import { useProjectStore } from '@/store/projectStore';
import { useUserStore } from '@/store/user';

const props = defineProps({ modelValue: Boolean, projectId: String });
const emit = defineEmits(['update:modelValue']);

const projectStore = useProjectStore();
const userStore = useUserStore();
const dialog = computed({ get: () => props.modelValue, set: (v) => emit('update:modelValue', v) });

const currentBalance = computed(() => projectStore.smsBalance);
const isBalanceLow = computed(() => (currentBalance.value !== null && currentBalance.value < 50));


const tab = ref('settings');
const saving = ref(false);
const isValid = ref(false);
const testPhone = ref('');
const sendStrategies = [
  { title: '預約前 X 小時', value: 'hours_before' },
  { title: '預約前一天 (固定時間)', value: 'day_before' }
];

const hourOptions = [1, 2, 4, 8, 24];

// 初始化設定資料結構
const settings = ref({
  enabled: false,
  template: '',
  sendStrategy: 'day_before', // 預設改為前一天
  sendBeforeHours: 2,
  fixedTime: '12:00'          // 預設 12:00
});

const onStrategyChange = (val) => {
  if (val === 'day_before' && !settings.value.fixedTime) {
    settings.value.fixedTime = '12:00';
  }
};

// 更新預覽文字中的時間說明 (僅供介面參考)
const previewSendTime = computed(() => {
  if (settings.value.sendStrategy === 'day_before') {
    return `預約前一天的 ${settings.value.fixedTime}`;
  }
  return `預約時間前 ${settings.value.sendBeforeHours} 小時`;
});

const timeOptions = [
  { title: '1 小時前', value: 1 },
  { title: '2 小時前', value: 2 },
  { title: '4 小時前', value: 4 },
  { title: '24 小時前', value: 24 }
];

const availableTags = ['{customerName}', '{projectName}', '{reservationTime}', '{salesName}'];

const templateRules = [
  v => !!v || '內文不可為空',
  v => v.includes('{reservationTime}') || '必須包含 {reservationTime} 變數'
];

const previewText = computed(() => {
  let text = settings.value.template || '請輸入內文';
  const mockData = {
    '{customerName}': '王小明',
    '{projectName}': projectStore.idToNameMap[props.projectId] || '測試建案',
    '{reservationTime}': '2026年12月27日下午3:00',
    '{salesName}': userStore.user.name
  };
  Object.keys(mockData).forEach(key => {
    text = text.replace(new RegExp(key, 'g'), mockData[key]);
  });
  return text;
});




// 2. 新增餘額獲取函式
const loadingBalance = ref(false);

const refreshBalance = async () => {
  loadingBalance.value = true;
  try {
    await projectStore.fetchSmsBalance();
  } catch (e) {
    // 這裡可以串接你的 useSnackbar 或 alert
    console.error('更新餘額失敗');
  } finally {
    loadingBalance.value = false;
  }
};

// 3. 監控分頁切換
watch(tab, (newTab) => {
  if (newTab === 'account') {
    refreshBalance();
  }
});

// 4. 修改原本的 watch(dialog)，開啟時順便抓餘額
watch(() => props.modelValue, async (val) => {
  if (val) {
    refreshBalance(); // 開啟時獲取最新餘額
    const data = await projectStore.fetchProjectSettings(props.projectId);
    if (data?.smsReminder) settings.value = { ...data.smsReminder };
    dialog.value = true;
  } else {
    dialog.value = false;
  }
});

const insertTag = (tag) => { settings.value.template += tag; };

const save = async () => {
  if (!isValid.value) return;
  saving.value = true;
  try {
    const payload = {
      smsReminder: {
        ...settings.value,
        updatedAt: new Date().toISOString(), // 雲端將轉換為台灣時間
        updatedBy: userStore.user.name
      }
    };
    await projectStore.updateProjectSettings(props.projectId, payload);
    dialog.value = false;
  } catch (e) {
    alert('儲存失敗');
  } finally {
    saving.value = false;
  }
};

const sendingTest = ref(false);

const testSend = async () => {
  if (!testPhone.value) return alert('請輸入測試手機號碼');
  
  sendingTest.value = true;
  try {
    const result = await projectStore.sendTestSms({
      phoneNumber: testPhone.value,
      message: previewText.value, // 使用即時預覽轉換後的文字
      subject: `測試-${projectStore.idToNameMap[props.projectId]}`
    });
    
    alert(`發送成功！剩餘點數：${result.credit}`);
  } catch (e) {
    alert('發送測試簡訊失敗：' + e.message);
  } finally {
    sendingTest.value = false;
  }
};

const close = () => { dialog.value = false; };
</script>

<style scoped>
.phone-preview {
  width: 250px;
  height: 400px;
  background: #f0f0f0;
  border-radius: 30px;
  border: 8px solid #333;
  position: relative;
  overflow: hidden;
}
.preview-content {
  background: #fff;
  border-radius: 10px;
  margin-top: 50px;
  font-size: 13px;
  white-space: pre-wrap;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}
</style>