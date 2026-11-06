<template>
  <div class="mac-form prs">
    <div v-if="loading" class="prs-state">
      <v-progress-circular indeterminate size="24" width="2" color="grey"></v-progress-circular>
    </div>

    <div v-else-if="loadError" class="prs-state prs-state--error">
      <div class="mac-callout mac-callout--error">
        <v-icon size="16">mdi-alert-circle-outline</v-icon><span>{{ loadError }}</span>
      </div>
      <button type="button" class="mac-btn" @click="loadSettings">重試</button>
    </div>

    <template v-else>
      <div class="mac-form-group">
        <label class="mac-form-row prs-enable">
          <span class="mac-form-row-main mac-form-row-title">啟用繳款提醒</span>
          <input v-model="form.enabled" type="checkbox" class="mac-switch" />
        </label>
      </div>

      <div class="mac-form-label">提醒時機</div>
      <div class="mac-form-group">
        <div class="mac-form-row">
          <span class="mac-form-row-label">到期前</span>
          <div class="prs-offsets">
            <span v-for="days in form.offsetDays" :key="days" class="mac-token">
              {{ days === 0 ? '當天' : `${days} 天` }}
              <button type="button" class="mac-token-x" :aria-label="`移除${days === 0 ? '當天' : `${days} 天`}`" @click="removeOffset(days)">
                <v-icon size="14">mdi-close</v-icon>
              </button>
            </span>
            <form v-if="addingOffset" class="prs-offset-add" @submit.prevent="addOffset">
              <input
                ref="offsetInputRef"
                v-model="offsetDraft"
                type="number"
                inputmode="numeric"
                min="0"
                :max="MAX_OFFSET_DAYS"
                class="mac-form-input prs-num"
                aria-label="到期前天數"
              />
              <span>天</span>
              <button type="submit" class="mac-btn mac-btn--sm">加入</button>
              <button type="button" class="mac-icon-btn" title="取消" @click="addingOffset = false">
                <v-icon size="16">mdi-close</v-icon>
              </button>
            </form>
            <button
              v-else
              type="button"
              class="mac-icon-btn prs-add"
              title="新增天數"
              :disabled="form.offsetDays.length >= MAX_OFFSET_COUNT"
              @click="startAddOffset"
            >
              <v-icon size="18">mdi-plus</v-icon>
            </button>
          </div>
        </div>

        <div class="mac-form-row">
          <span class="mac-form-row-label">發送時間</span>
          <select v-model.number="form.sendHour" class="mac-form-input mac-form-select prs-select" aria-label="發送時間">
            <option v-for="hour in hourOptions" :key="hour" :value="hour">{{ String(hour).padStart(2, '0') }}:00</option>
          </select>
        </div>

        <div class="mac-form-row">
          <span class="mac-form-row-label">逾期提醒</span>
          <input v-model="form.overdue.enabled" type="checkbox" class="mac-switch" aria-label="逾期提醒" />
          <span v-if="form.overdue.enabled" class="prs-interval">
            每
            <input
              v-model.number="form.overdue.intervalDays"
              type="number"
              inputmode="numeric"
              min="1"
              :max="MAX_OVERDUE_INTERVAL_DAYS"
              class="mac-form-input prs-num"
              aria-label="逾期提醒間隔天數"
              @blur="normalizeInterval"
            />
            天
          </span>
        </div>
      </div>

      <div class="mac-form-label">通知對象</div>
      <div class="mac-form-group">
        <div class="mac-form-row prs-role">
          <span class="mac-form-row-label">管理人員</span>
          <label v-for="channel in CHANNELS" :key="channel.value" class="prs-check">
            <input
              type="checkbox"
              class="mac-check"
              :checked="form.managers.channels.includes(channel.value)"
              @change="e => toggleChannel('managers', channel.value, e.target.checked)"
            />
            {{ channel.label }}
          </label>
          <button type="button" class="prs-link" :disabled="previewLoading && !preview" @click="peopleOpen = true">
            {{ managerCountText }}<v-icon size="16">mdi-chevron-right</v-icon>
          </button>
        </div>
        <div class="mac-form-row prs-role">
          <span class="mac-form-row-label">銷售人員</span>
          <label v-for="channel in CHANNELS" :key="channel.value" class="prs-check">
            <input
              type="checkbox"
              class="mac-check"
              :checked="form.salespersons.channels.includes(channel.value)"
              @change="e => toggleChannel('salespersons', channel.value, e.target.checked)"
            />
            {{ channel.label }}
          </label>
          <span class="prs-sub">該戶銷售人員</span>
        </div>
        <button v-if="warningText" type="button" class="prs-warning" @click="peopleOpen = true">
          <v-icon size="16">mdi-alert-outline</v-icon>
          <span>{{ warningText }}</span>
          <v-icon size="16" class="prs-warning-arrow">mdi-chevron-right</v-icon>
        </button>
        <div v-if="previewError" class="prs-preview-error">
          <span>{{ previewError }}</span>
          <button type="button" class="mac-link-btn" @click="loadPreview">重試</button>
        </div>
      </div>

      <div class="mac-form-label">測試與紀錄</div>
      <div class="mac-form-group">
        <div class="mac-form-row">
          <button type="button" class="mac-btn" :disabled="sendingTest" @click="sendTest">
            <v-progress-circular v-if="sendingTest" indeterminate size="14" width="2"></v-progress-circular>
            <v-icon v-else size="16">mdi-send-outline</v-icon>
            <span>寄測試通知給我</span>
          </button>
          <button type="button" class="prs-link" @click="openLogs">
            通知紀錄<v-icon size="16">mdi-chevron-right</v-icon>
          </button>
        </div>
        <div v-if="testResult" class="mac-form-pad">
          <div class="mac-callout" :class="testResult.ok ? '' : 'mac-callout--warning'">
            <v-icon size="16">{{ testResult.ok ? 'mdi-check-circle-outline' : 'mdi-alert-outline' }}</v-icon>
            <span>{{ testResult.text }}</span>
          </div>
        </div>
      </div>

      <div v-if="configIssue" class="mac-callout mac-callout--warning prs-issue">
        <v-icon size="16">mdi-alert-outline</v-icon><span>{{ configIssue }}</span>
      </div>

      <div class="prs-foot">
        <button
          type="button"
          class="mac-btn mac-btn--primary mac-btn--lg"
          :disabled="saving || !isDirty || !!configIssue"
          @click="save"
        >
          <v-progress-circular v-if="saving" indeterminate size="14" width="2" color="white"></v-progress-circular>
          <span>儲存</span>
        </button>
      </div>
    </template>

    <!-- 通知人員 -->
    <v-dialog v-model="peopleOpen" max-width="560" scrollable content-class="mac-dialog-fit">
      <v-card class="mac-sheet">
        <div class="mac-sheet-head">
          <v-icon size="18">mdi-account-multiple-outline</v-icon>通知人員
          <button type="button" class="mac-sheet-close" title="關閉" @click="peopleOpen = false">
            <v-icon size="18">mdi-close</v-icon>
          </button>
        </div>
        <v-card-text class="pa-0 mac-form prs-people">
          <div v-if="previewLoading && !preview" class="prs-state">
            <v-progress-circular indeterminate size="24" width="2" color="grey"></v-progress-circular>
          </div>
          <div v-else-if="previewError && !preview" class="prs-state prs-state--error">
            <div class="mac-callout mac-callout--error">
              <v-icon size="16">mdi-alert-circle-outline</v-icon><span>{{ previewError }}</span>
            </div>
            <button type="button" class="mac-btn" @click="loadPreview">重試</button>
          </div>
          <template v-else>
            <div v-if="previewError" class="prs-preview-error prs-preview-error--stale">
              <span>{{ previewError }}</span>
              <button type="button" class="mac-link-btn" @click="loadPreview">重試</button>
            </div>
            <div class="mac-form-label">管理人員</div>
            <div class="mac-form-group">
              <label v-for="person in managers" :key="person.userKey" class="mac-form-row prs-person">
                <input
                  type="checkbox"
                  class="mac-check"
                  :checked="!isExcluded(person.userKey)"
                  @change="e => toggleManager(person.userKey, e.target.checked)"
                />
                <span class="prs-person-name">{{ person.name }}</span>
                <span class="prs-person-tags">
                  <span class="mac-tag" :class="person.hasLine ? 'mac-tag--green' : ''">{{ person.hasLine ? 'LINE' : '未綁 LINE' }}</span>
                  <span class="mac-tag" :class="person.hasEmail ? 'mac-tag--green' : ''">{{ person.hasEmail ? 'Email' : '無 Email' }}</span>
                  <span v-if="!isExcluded(person.userKey) && reachOf(person, form.managers.channels) === 'none'" class="mac-tag mac-tag--red">無法通知</span>
                </span>
              </label>
              <div v-if="!managers.length" class="mac-form-row mac-form-empty">沒有具銷控系統權限的人員</div>
            </div>

            <div class="mac-form-label">該戶銷售人員</div>
            <div class="mac-form-group">
              <div v-for="person in salespersons" :key="person.userKey" class="mac-form-row prs-person">
                <span class="prs-person-name">{{ person.name }}</span>
                <span class="prs-person-tags">
                  <span class="mac-tag" :class="person.hasLine ? 'mac-tag--green' : ''">{{ person.hasLine ? 'LINE' : '未綁 LINE' }}</span>
                  <span class="mac-tag" :class="person.hasEmail ? 'mac-tag--green' : ''">{{ person.hasEmail ? 'Email' : '無 Email' }}</span>
                  <span v-if="person.hasPermission === false" class="mac-tag mac-tag--red">已無權限</span>
                  <span v-else-if="reachOf(person, form.salespersons.channels) === 'none'" class="mac-tag mac-tag--red">無法通知</span>
                </span>
              </div>
              <div v-if="!salespersons.length" class="mac-form-row mac-form-empty">目前沒有</div>
            </div>
          </template>
        </v-card-text>
        <div class="mac-sheet-foot">
          <span class="mac-spacer"></span>
          <button type="button" class="mac-btn mac-btn--primary" @click="peopleOpen = false">完成</button>
        </div>
      </v-card>
    </v-dialog>

    <!-- 通知紀錄 -->
    <v-dialog v-model="logsOpen" max-width="640" scrollable content-class="mac-dialog-fit">
      <v-card class="mac-sheet">
        <div class="mac-sheet-head">
          <v-icon size="18">mdi-history</v-icon>通知紀錄
          <button type="button" class="mac-sheet-close" title="關閉" @click="logsOpen = false">
            <v-icon size="18">mdi-close</v-icon>
          </button>
        </div>
        <v-card-text class="pa-0">
          <div v-if="logsLoading" class="prs-state">
            <v-progress-circular indeterminate size="24" width="2" color="grey"></v-progress-circular>
          </div>
          <div v-else-if="logsError" class="prs-state prs-state--error">
            <div class="mac-callout mac-callout--error">
              <v-icon size="16">mdi-alert-circle-outline</v-icon><span>{{ logsError }}</span>
            </div>
            <button type="button" class="mac-btn" @click="openLogs">重試</button>
          </div>
          <div v-else-if="!logs.length" class="mac-list-empty">尚無紀錄</div>
          <div v-else>
            <div v-for="log in logs" :key="log.id" class="prs-log">
              <button type="button" class="prs-log-head" @click="expandedLogId = expandedLogId === log.id ? '' : log.id">
                <span class="prs-log-date">{{ logDateText(log) }}</span>
                <span v-if="log.type === 'paymentDueTest'" class="mac-tag mac-tag--blue">測試</span>
                <span class="mac-tag" :class="LOG_STATUS[log.status]?.tag">{{ LOG_STATUS[log.status]?.label || log.status }}</span>
                <span class="prs-log-stats">
                  {{ log.itemCount || 0 }} 筆・成功 {{ log.sent || 0 }}<template v-if="log.failed">・失敗 {{ log.failed }}</template><template v-if="log.skipped">・未送達 {{ log.skipped }}</template>
                </span>
                <v-icon size="16" class="prs-log-arrow">{{ expandedLogId === log.id ? 'mdi-chevron-up' : 'mdi-chevron-down' }}</v-icon>
              </button>
              <div v-if="log.noRecipients" class="prs-log-note prs-log-note--warn">有到期項目，但沒有收件人</div>
              <div v-if="log.lastError" class="prs-log-note prs-log-note--error">{{ log.lastError }}</div>
              <div v-if="expandedLogId === log.id" class="prs-attempts">
                <div v-if="!(log.attempts || []).length" class="prs-attempt prs-attempt--empty">沒有發送對象</div>
                <div v-for="(attempt, index) in log.attempts || []" :key="index" class="prs-attempt">
                  <span class="prs-attempt-name">{{ attempt.name || attempt.userKey || '—' }}<template v-if="attempt.unitId">（{{ attempt.unitId }}）</template></span>
                  <span v-if="attempt.channel" class="prs-attempt-channel">{{ channelLabel(attempt.channel) }}<template v-if="attempt.fallbackFrom">（改寄）</template></span>
                  <span class="mac-tag" :class="ATTEMPT_STATUS[attempt.status]?.tag">{{ ATTEMPT_STATUS[attempt.status]?.label || attempt.status }}</span>
                  <span v-if="attempt.error" class="prs-attempt-error">{{ errorLabel(attempt.error) }}</span>
                </div>
              </div>
            </div>
          </div>
        </v-card-text>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup>
/**
 * 建案設定：繳款提醒，規格：docs/SPEC_PaymentDueReminder.md §4.3、§6.7
 * 設定寫入 projects/{projectId}.paymentReminderSettings；SalesSettings 的整包儲存不會帶這個欄位。
 */
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { useToast } from 'vue-toastification';
import { useUserStore } from '@/store/user';
import { getProjectSettings, paymentReminderApi, updateProjectSalesSettings } from '@/api';
import {
  MAX_OFFSET_COUNT,
  MAX_OFFSET_DAYS,
  MAX_OVERDUE_INTERVAL_DAYS,
  MAX_SEND_HOUR,
  MIN_SEND_HOUR,
  REMINDER_CHANNELS,
  normalizePaymentReminderSettings,
} from '@/utils/paymentRecordStatus';

const props = defineProps({
  projectId: { type: String, required: true },
});

const CHANNELS = [{ value: 'email', label: 'Email' }, { value: 'line', label: 'LINE' }];
const LOG_STATUS = {
  running: { label: '發送中', tag: 'mac-tag--blue' },
  done: { label: '完成', tag: 'mac-tag--green' },
  partial: { label: '部分失敗', tag: 'mac-tag--orange' },
  empty: { label: '沒有項目', tag: '' },
  blocked: { label: '試用建案未發送', tag: '' },
};
const ATTEMPT_STATUS = {
  sent: { label: '已送出', tag: 'mac-tag--green' },
  failed: { label: '失敗', tag: 'mac-tag--red' },
  skipped: { label: '未送達', tag: 'mac-tag--orange' },
};
// 其餘是 LINE／寄信的錯誤原文，直接顯示
const ERROR_LABEL = {
  'user-not-found': '找不到使用者',
  'no-permission': '已無此建案權限',
  'no-contact': '沒有 LINE 與 Email',
  'no-email': '未設定 Email',
  'no-user-key': '銷售人員未連結帳號',
  'no-longer-applicable': '重試時已不需通知',
  'missing-line-token': 'LINE 服務未設定',
  'no-line-id': '未綁定 LINE',
  'unknown-channel': '不支援的通知方式',
};

const toast = useToast();
const userStore = useUserStore();

const loading = ref(true);
const loadError = ref('');
const saving = ref(false);
const form = ref(normalizePaymentReminderSettings());
const savedSnapshot = ref('');

const addingOffset = ref(false);
const offsetDraft = ref('');
const offsetInputRef = ref(null);

const preview = ref(null);
const previewLoading = ref(false);
const previewError = ref('');
const peopleOpen = ref(false);

const sendingTest = ref(false);
const testResult = ref(null);

const logsOpen = ref(false);
const logsLoading = ref(false);
const logsError = ref('');
const logs = ref([]);
const expandedLogId = ref('');

const hourOptions = Array.from({ length: MAX_SEND_HOUR - MIN_SEND_HOUR + 1 }, (_, i) => MIN_SEND_HOUR + i);
const apiBase = computed(() => ({ projectId: props.projectId, userKey: userStore.user?.key }));

// 逾期間隔：小數取整、超出範圍夾到上下限；清空時回到上一個有效值
let lastValidInterval = form.value.overdue.intervalDays;
function clampInterval(raw) {
  const days = raw === '' || raw === null || raw === undefined ? NaN : Math.round(Number(raw));
  return Number.isFinite(days) ? Math.min(MAX_OVERDUE_INTERVAL_DAYS, Math.max(1, days)) : lastValidInterval;
}

const snapshotOf = settings => JSON.stringify(normalizePaymentReminderSettings({
  ...settings,
  overdue: { ...settings.overdue, intervalDays: clampInterval(settings.overdue?.intervalDays) },
}));
const isDirty = computed(() => snapshotOf(form.value) !== savedSnapshot.value);

const configIssue = computed(() => {
  if (!form.value.enabled) return '';
  if (!form.value.offsetDays.length && !form.value.overdue.enabled) return '請至少設定一個提醒時機';
  if (!form.value.managers.channels.length && !form.value.salespersons.channels.length) return '請至少勾選一種通知方式';
  return '';
});

const managers = computed(() => preview.value?.managers || []);
const salespersons = computed(() => preview.value?.salespersons || []);
const excludedSet = computed(() => new Set(form.value.managers.excludedUserKeys));
const isExcluded = userKey => excludedSet.value.has(userKey);

const managerCountText = computed(() => {
  if (!preview.value) return '人員';
  const total = managers.value.length;
  const selected = managers.value.filter(m => !isExcluded(m.userKey)).length;
  return selected === total ? `${total} 位` : `${selected}／${total} 位`;
});

const warningText = computed(() => {
  const summary = preview.value?.summary;
  if (!summary) return '';
  const parts = [];
  if (summary.lineFallback > 0) parts.push(`${summary.lineFallback} 人未綁 LINE，改寄 Email`);
  if (summary.unreachable > 0) parts.push(`${summary.unreachable} 人無法通知`);
  return parts.join('；');
});

// 勾 LINE 但沒綁定時可改寄 Email；只勾 Email 且沒有 Email 時不會反向改發 LINE
function reachOf(person, channels) {
  const line = channels.includes('line') && person.hasLine;
  const email = person.hasEmail && (channels.includes('email') || channels.includes('line'));
  return line || email ? 'ok' : 'none';
}

const channelLabel = channel => CHANNELS.find(c => c.value === channel)?.label || channel || '';
const errorLabel = code => ERROR_LABEL[code] || code;

function toggleChannel(role, channel, checked) {
  const next = new Set(form.value[role].channels);
  if (checked) next.add(channel);
  else next.delete(channel);
  form.value[role].channels = REMINDER_CHANNELS.filter(c => next.has(c));
}

function toggleManager(userKey, checked) {
  const next = new Set(form.value.managers.excludedUserKeys);
  if (checked) next.delete(userKey);
  else next.add(userKey);
  form.value.managers.excludedUserKeys = [...next];
}

function startAddOffset() {
  offsetDraft.value = '';
  addingOffset.value = true;
  nextTick(() => offsetInputRef.value?.focus());
}

function addOffset() {
  const days = Number(offsetDraft.value);
  if (offsetDraft.value === '' || !Number.isInteger(days) || days < 0 || days > MAX_OFFSET_DAYS) {
    toast.warning(`請輸入 0 到 ${MAX_OFFSET_DAYS} 的整數`);
    return;
  }
  form.value.offsetDays = normalizePaymentReminderSettings({ offsetDays: [...form.value.offsetDays, days] }).offsetDays;
  addingOffset.value = false;
}

function removeOffset(days) {
  form.value.offsetDays = form.value.offsetDays.filter(d => d !== days);
}

function normalizeInterval() {
  lastValidInterval = clampInterval(form.value.overdue.intervalDays);
  form.value.overdue.intervalDays = lastValidInterval;
}

async function loadSettings() {
  loading.value = true;
  loadError.value = '';
  try {
    const project = await getProjectSettings(props.projectId);
    const settings = normalizePaymentReminderSettings(project?.paymentReminderSettings);
    form.value = settings;
    lastValidInterval = settings.overdue.intervalDays;
    savedSnapshot.value = snapshotOf(settings);
    loadPreview();
  } catch (error) {
    loadError.value = `載入設定失敗：${error.message}`;
  } finally {
    loading.value = false;
  }
}

const previewKeyOf = () => JSON.stringify([form.value.managers, form.value.salespersons]);
let lastPreviewKey = '';
let previewToken = 0;
async function loadPreview() {
  const token = ++previewToken;
  lastPreviewKey = previewKeyOf();
  previewLoading.value = true;
  previewError.value = '';
  const res = await paymentReminderApi({
    action: 'previewRecipients',
    ...apiBase.value,
    settings: normalizePaymentReminderSettings(form.value),
  });
  if (token !== previewToken) return;
  previewLoading.value = false;
  if (res?.status === 'success') {
    preview.value = res;
  } else {
    previewError.value = `讀取通知人員失敗：${res?.message || '請稍後再試'}`;
  }
}

// 調整管道或人員後重算未綁定人數
let previewTimer = null;
watch(previewKeyOf, key => {
  clearTimeout(previewTimer);
  if (key !== lastPreviewKey) previewTimer = setTimeout(loadPreview, 400);
});
onBeforeUnmount(() => clearTimeout(previewTimer));

async function save() {
  normalizeInterval();
  saving.value = true;
  try {
    const settings = normalizePaymentReminderSettings(form.value);
    await updateProjectSalesSettings(props.projectId, {
      paymentReminderSettings: {
        ...settings,
        updatedAt: new Date().toISOString(),
        updatedBy: userStore.user?.name || '',
      },
    });
    form.value = settings;
    savedSnapshot.value = snapshotOf(settings);
    toast.success('繳款提醒設定已儲存');
  } catch (error) {
    toast.error(`儲存失敗：${error.message}`);
  } finally {
    saving.value = false;
  }
}

async function sendTest() {
  sendingTest.value = true;
  testResult.value = null;
  const res = await paymentReminderApi({ action: 'sendTest', ...apiBase.value, channels: ['email', 'line'] });
  sendingTest.value = false;

  if (res?.status !== 'success') {
    testResult.value = { ok: false, text: `測試失敗：${res?.message || '請稍後再試'}` };
    return;
  }
  if (res.blocked) {
    testResult.value = { ok: false, text: '試用建案不發送通知' };
    return;
  }
  const attempts = res.attempts || [];
  const text = attempts
    .map(a => `${channelLabel(a.channel)}：${ATTEMPT_STATUS[a.status]?.label || a.status}${a.error ? `（${errorLabel(a.error)}）` : ''}`)
    .join('；');
  testResult.value = {
    ok: attempts.length > 0 && attempts.every(a => a.status === 'sent'),
    text: text || '沒有可發送的管道',
  };
}

async function openLogs() {
  logsOpen.value = true;
  logsLoading.value = true;
  logsError.value = '';
  expandedLogId.value = '';
  const res = await paymentReminderApi({ action: 'listLogs', ...apiBase.value });
  logsLoading.value = false;
  if (res?.status === 'success') {
    logs.value = res.logs || [];
  } else {
    logsError.value = `讀取紀錄失敗：${res?.message || '請稍後再試'}`;
  }
}

function logDateText(log) {
  const time = log.createdAt ? new Date(log.createdAt) : null;
  if (!time || Number.isNaN(time.getTime())) return log.date || '—';
  return time.toLocaleString('zh-TW', {
    timeZone: 'Asia/Taipei',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}

watch(() => props.projectId, loadSettings);
onMounted(loadSettings);
</script>

<style scoped>
.prs {
  max-width: 720px;
  margin: 0 auto;
  padding: 16px;
  border-radius: 12px;
}
.prs-state {
  display: flex;
  justify-content: center;
  padding: 40px 16px;
}
.prs-state--error {
  flex-direction: column;
  align-items: flex-start;
  gap: 12px;
  padding: 16px;
}
.prs-enable { cursor: pointer; }

.prs-offsets {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  flex: 1;
  min-width: 0;
  gap: 6px;
}
.prs-offset-add { display: inline-flex; align-items: center; gap: 6px; color: #6e6e73; }
.prs-num { flex: 0 0 64px; width: 64px; text-align: center; }
.prs-select { flex: 0 1 140px; max-width: 140px; }
.prs-add:disabled { opacity: 0.35; cursor: default; }
.prs-interval { display: inline-flex; align-items: center; gap: 6px; color: #6e6e73; }

.prs-role { flex-wrap: wrap; }
.prs-check { display: inline-flex; align-items: center; gap: 6px; margin-right: 8px; cursor: pointer; }
.prs-sub { margin-left: auto; font-size: 12.5px; color: #6e6e73; }
.prs-link {
  display: inline-flex;
  align-items: center;
  gap: 2px;
  margin-left: auto;
  padding: 2px 0 2px 6px;
  border: 0;
  background: none;
  color: #0071e3;
  font: inherit;
  font-weight: 500;
  white-space: nowrap;
  cursor: pointer;
}
.prs-link .v-icon { color: inherit; }
.prs-link:disabled { color: #8e8e93; cursor: default; }

.prs-warning {
  display: flex;
  align-items: flex-start;
  gap: 6px;
  width: 100%;
  padding: 10px 14px;
  border: 0;
  border-top: 1px solid #ececf0;
  background: rgba(255, 159, 10, 0.1);
  color: #9a5b00;
  font: inherit;
  text-align: left;
  cursor: pointer;
}
.prs-warning .v-icon { flex-shrink: 0; color: inherit; margin-top: 1px; }
.prs-warning-arrow { margin-left: auto; }
.prs-preview-error {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 6px;
  padding: 8px 14px;
  border-top: 1px solid #ececf0;
  color: #b3261b;
  font-size: 12.5px;
}

.prs-preview-error--stale { padding: 12px 4px 0; border-top: 0; }

.prs-issue { margin-top: 14px; }
.prs-foot { display: flex; justify-content: flex-end; margin-top: 16px; }

.prs-people { padding: 0 14px 14px !important; }
.prs-person { cursor: pointer; flex-wrap: wrap; }
div.prs-person { cursor: default; }
.prs-person-name { flex: 1 1 auto; min-width: 0; font-weight: 500; overflow-wrap: anywhere; }
.prs-person-tags { display: inline-flex; flex-wrap: wrap; gap: 4px; }

.prs-log { border-bottom: 1px solid #ececf0; }
.prs-log-head {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 4px 8px;
  width: 100%;
  padding: 10px 14px;
  border: 0;
  background: none;
  color: #1d1d1f;
  font: inherit;
  font-size: 13px;
  text-align: left;
  cursor: pointer;
}
.prs-log-head:hover { background: #f7f7f9; }
.prs-log-date { font-weight: 500; font-variant-numeric: tabular-nums; }
.prs-log-stats { color: #6e6e73; font-size: 12.5px; }
.prs-log-arrow { margin-left: auto; color: #8e8e93; }
.prs-log-note { padding: 0 14px 10px; font-size: 12.5px; line-height: 1.5; overflow-wrap: anywhere; }
.prs-log-note--warn { color: #9a5b00; }
.prs-log-note--error { color: #b3261b; }
.prs-attempts { padding: 0 14px 10px; background: #fafafb; }
.prs-attempt {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 4px 8px;
  padding: 7px 0;
  font-size: 12.5px;
}
.prs-attempt + .prs-attempt { border-top: 1px solid #f0f0f3; }
.prs-attempt--empty { color: #8e8e93; }
.prs-attempt-name { flex: 1 1 96px; min-width: 0; font-weight: 500; overflow-wrap: anywhere; }
.prs-attempt-channel { color: #6e6e73; }
.prs-attempt-error { flex: 1 1 100%; color: #b3261b; overflow-wrap: anywhere; }

@media (max-width: 600px) {
  .prs { padding: 12px; border-radius: 0; }
  .prs-num, .prs-select { height: 34px; font-size: 16px; }
  .prs-select { flex: 1 1 100%; max-width: none; }
  .prs-sub { margin-left: 0; flex: 1 1 100%; }
}
</style>
