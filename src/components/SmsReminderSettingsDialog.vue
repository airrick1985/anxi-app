<template>
  <v-dialog v-model="dialog" max-width="640px" persistent scrollable content-class="mac-dialog-fit">
    <v-card class="mac-sheet">
      <div class="mac-sheet-head sms-head">
        <v-icon size="18">mdi-message-cog</v-icon>
        <span class="sms-title">簡訊提醒功能管理</span>
        <span v-if="currentBalance !== null" class="sms-balance" :class="{ 'is-low': isBalanceLow }">
          <v-icon size="13">mdi-database</v-icon>餘額：{{ currentBalance }} 點
        </span>
        <button type="button" class="mac-sheet-close" title="關閉" @click="close">
          <v-icon size="18">mdi-close</v-icon>
        </button>
      </div>

      <div class="sms-tabs">
        <div class="mac-form-seg mac-form-seg--block">
          <button
            v-for="t in TABS"
            :key="t.value"
            type="button"
            class="mac-form-seg-btn"
            :class="{ 'is-active': tab === t.value }"
            @click="tab = t.value"
          >{{ t.label }}</button>
        </div>
      </div>

      <v-card-text class="mac-form sms-body">
        <v-form v-show="tab === 'settings'" ref="formRef" v-model="isValid">
          <div class="mac-form-group">
            <div class="sms-row">
              <span class="sms-label">啟用簡訊提醒</span>
              <v-switch
                v-model="settings.enabled"
                color="#34c759"
                inset
                hide-details
                density="compact"
                class="sms-switch"
              ></v-switch>
            </div>
            <div class="sms-row">
              <span class="sms-label">發送時間模式</span>
              <v-select
                v-model="settings.sendStrategy"
                :items="sendStrategies"
                variant="solo"
                flat
                density="compact"
                hide-details="auto"
                class="mac-vfield sms-field"
                menu-icon="mdi-unfold-more-horizontal"
                :menu-props="{ contentClass: 'mac-menu' }"
                @update:model-value="onStrategyChange"
              ></v-select>
            </div>
            <div v-if="settings.sendStrategy === 'day_before'" class="sms-row">
              <span class="sms-label">指定時間</span>
              <v-text-field
                v-model="settings.fixedTime"
                type="time"
                variant="solo"
                flat
                density="compact"
                hide-details="auto"
                class="mac-vfield sms-field"
              ></v-text-field>
            </div>
            <div v-if="settings.sendStrategy === 'hours_before'" class="sms-row">
              <span class="sms-label">提前小時</span>
              <v-select
                v-model="settings.sendBeforeHours"
                :items="hourOptions"
                suffix="發送"
                variant="solo"
                flat
                density="compact"
                hide-details="auto"
                class="mac-vfield sms-field"
                menu-icon="mdi-unfold-more-horizontal"
                :menu-props="{ contentClass: 'mac-menu' }"
              ></v-select>
            </div>
          </div>

          <div class="mac-form-label">簡訊範本</div>
          <div class="mac-form-group mac-form-pad">
            <v-textarea
              v-model="settings.template"
              rows="6"
              placeholder="輸入簡訊內容..."
              :rules="templateRules"
              counter
              variant="solo"
              flat
              density="compact"
              hide-details="auto"
              class="mac-vfield"
            ></v-textarea>
            <div class="sms-tags">
              <button v-for="tag in availableTags" :key="tag" type="button" class="mac-btn mac-btn--sm" @click="insertTag(tag)">
                {{ tag }}
              </button>
            </div>
          </div>

          <div class="mac-form-label">測試發送</div>
          <div class="mac-form-group">
            <div class="sms-row sms-row--test">
              <v-text-field
                v-model="testPhone"
                placeholder="測試手機號碼 09xxxxxxxx"
                type="tel"
                variant="solo"
                flat
                density="compact"
                hide-details
                class="mac-vfield"
              ></v-text-field>
              <button type="button" class="mac-btn mac-btn--primary" :disabled="sendingTest" @click="testSend">
                <v-progress-circular v-if="sendingTest" indeterminate size="14" width="2"></v-progress-circular>
                發送測試簡訊
              </button>
            </div>
          </div>
        </v-form>

        <div v-show="tab === 'preview'" class="sms-preview-wrap">
          <div class="phone-preview pa-4 mx-auto">
            <div class="preview-content pa-3">
              {{ previewText }}
            </div>
          </div>
          <div class="sms-preview-count">
            估計字數: {{ previewText.length }} 字 (約 {{ Math.ceil(previewText.length / 70) }} 則點數)
          </div>
        </div>

        <div v-show="tab === 'account'">
          <div v-if="isBalanceLow" class="mac-callout mac-callout--warning sms-low">
            <v-icon size="16">mdi-alert</v-icon>
            <div>餘額點數較低，請儘速聯繫業務或於官方平台加值。</div>
          </div>

          <div class="mac-form-group">
            <div class="sms-row">
              <v-icon size="22" class="sms-db-icon">mdi-database</v-icon>
              <div class="sms-balance-main">
                <div class="sms-balance-label">目前帳號點數</div>
                <div class="sms-balance-num">{{ currentBalance ?? '---' }} <span>點</span></div>
              </div>
              <button type="button" class="mac-icon-btn sms-refresh" title="更新餘額" :disabled="loadingBalance" @click="refreshBalance">
                <v-progress-circular v-if="loadingBalance" indeterminate size="16" width="2"></v-progress-circular>
                <v-icon v-else size="18">mdi-refresh</v-icon>
              </button>
            </div>
          </div>

          <div class="sms-footnote">
            * 點數計算方式依 EVERY8D 官方合約為準。
            <br />* 建議每 8 小時系統會自動更新連線憑證。
          </div>
        </div>
      </v-card-text>

      <div class="mac-sheet-foot">
        <button type="button" class="mac-btn" @click="close">取消</button>
        <span class="mac-spacer"></span>
        <button type="button" class="mac-btn mac-btn--primary" :disabled="saving" @click="save">
          <v-progress-circular v-if="saving" indeterminate size="14" width="2"></v-progress-circular>
          儲存設定
        </button>
      </div>
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
const TABS = [
  { value: 'settings', label: '設定與範本' },
  { value: 'preview', label: '即時預覽' },
  { value: 'account', label: '帳號餘額管理' }
];
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
.sms-head { flex-wrap: wrap; row-gap: 4px; padding-top: 8px; padding-bottom: 8px; }
.sms-title { flex: 1 1 auto; min-width: 0; line-height: 1.35; overflow-wrap: anywhere; }
.sms-balance {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px 9px;
  border-radius: 10px;
  background: rgba(52, 199, 89, 0.14);
  color: #1e6b33;
  font-size: 12px;
  font-weight: 600;
  white-space: nowrap;
}
.sms-balance .v-icon { color: inherit !important; }
.sms-balance.is-low { background: rgba(255, 59, 48, 0.12); color: #c4261c; }
.sms-tabs { padding: 10px 16px; background: #f5f5f7; border-bottom: 1px solid rgba(0, 0, 0, 0.06); }
.sms-tabs .mac-form-seg-btn { height: 28px; }
.sms-body { padding: 4px 16px 16px !important; }
.sms-body > form > .mac-form-group:first-child,
.sms-body > div > .mac-form-group:first-child { margin-top: 12px; }

.sms-row {
  display: flex;
  align-items: center;
  gap: 12px;
  min-height: 48px;
  padding: 7px 14px;
}
.sms-row + .sms-row { border-top: 1px solid #ececf0; }
.sms-label { flex: 0 0 auto; min-width: 96px; font-size: 13.5px; font-weight: 500; }
.sms-field { flex: 1 1 auto; max-width: 280px; margin-left: auto; }
.sms-switch { flex: 0 0 auto; margin-left: auto; }
.sms-row--test .mac-vfield { flex: 1 1 auto; }
.sms-row--test .mac-btn { flex-shrink: 0; }
.sms-tags { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 10px; }

.sms-preview-wrap { padding-top: 16px; }
.sms-preview-count { margin-top: 10px; text-align: center; font-size: 12px; color: #6e6e73; }

.sms-low { margin: 12px 0 0; }
.sms-low + .mac-form-group { margin-top: 12px; }
.sms-db-icon { color: #0071e3 !important; }
.sms-balance-main { flex: 1 1 auto; min-width: 0; }
.sms-balance-label { font-size: 12px; color: #6e6e73; }
.sms-balance-num { font-size: 24px; font-weight: 700; color: #0071e3; line-height: 1.25; }
.sms-balance-num span { font-size: 13px; font-weight: 500; color: #6e6e73; }
.sms-refresh { width: 32px; height: 32px; }
.sms-footnote { margin: 12px 4px 0; font-size: 12px; line-height: 1.6; color: #8e8e93; }

@media (max-width: 600px) {
  .sms-tabs { padding: 8px 12px; }
  .sms-tabs .mac-form-seg-btn { height: 32px; font-size: 13px; }
  .sms-body { padding: 4px 12px 14px !important; }
  .sms-row { flex-wrap: wrap; padding: 9px 12px; }
  .sms-field { max-width: none; flex-basis: 100%; }
  .sms-row--test .mac-btn { flex-basis: 100%; height: 36px; font-size: 14px; }
}

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