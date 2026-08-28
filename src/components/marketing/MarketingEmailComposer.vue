<template>
  <v-dialog
    :model-value="modelValue"
    :fullscreen="!mdAndUp"
    :max-width="mdAndUp ? 1200 : undefined"
    scrollable
    persistent
    @update:model-value="onDialogToggle"
  >
    <v-card class="composer-card">
      <v-card-title class="d-flex align-center">
        <v-icon class="mr-2" color="primary">mdi-email-edit</v-icon>
        廣告 Email 編輯器
        <v-spacer />
        <v-btn icon="mdi-close" variant="text" size="small" :disabled="sending" @click="close" />
      </v-card-title>
      <v-divider />

      <v-card-text class="pa-0">
        <!-- 寄送進度 -->
        <div v-if="sending || sendResult" class="pa-4">
          <v-alert
            :type="progressAlertType"
            variant="tonal"
            class="mb-3"
          >
            <div class="d-flex align-center flex-wrap ga-2">
              <span v-if="sending && !campaign">正在建立寄送工作…</span>
              <span v-else-if="campaign">
                {{ campaign.status === 'done' ? '寄送完成' : '寄送中' }}：
                成功 {{ campaign.sent || 0 }} / 失敗 {{ campaign.failed || 0 }} / 共 {{ campaign.total || 0 }} 封
              </span>
              <span v-else-if="sendResult">寄送完成：成功 {{ sendResult.sent || 0 }}／失敗 {{ sendResult.failed || 0 }}</span>
            </div>
          </v-alert>
          <v-progress-linear
            :model-value="progressPercent"
            :indeterminate="sending && !campaign"
            color="primary"
            height="10"
            rounded
            class="mb-3"
          />
          <div v-if="failedRecipients.length" class="mb-2">
            <div class="text-subtitle-2 text-error mb-1">失敗清單（{{ failedRecipients.length }}）</div>
            <v-list density="compact" class="bg-transparent">
              <v-list-item v-for="r in failedRecipients" :key="r.leadId || r.email">
                <v-list-item-title>{{ r.name }} &lt;{{ r.email }}&gt;</v-list-item-title>
                <v-list-item-subtitle class="text-error">{{ r.error || '未知錯誤' }}</v-list-item-subtitle>
              </v-list-item>
            </v-list>
          </div>
          <div class="text-caption text-grey">離開此視窗不會中斷後端寄送，可至「寄信紀錄」查看進度。</div>
        </div>

        <!-- 編輯區 -->
        <v-row v-else no-gutters class="composer-body">
          <!-- 左：收件人 / 主旨 / 附件 / 範本 -->
          <v-col cols="12" md="5" class="pa-4 composer-left">
            <!-- 收件人 -->
            <div class="d-flex align-center mb-1">
              <span class="text-subtitle-2">收件人（{{ activeRecipients.length }} 位）</span>
              <v-spacer />
              <v-btn
                v-if="activeRecipients.length"
                size="x-small"
                variant="text"
                color="error"
                @click="removeAllRecipients"
              >全部移除</v-btn>
            </div>
            <div class="recipient-box mb-2">
              <template v-if="activeRecipients.length">
                <v-chip
                  v-for="r in activeRecipients"
                  :key="r.leadId || r.email"
                  size="small"
                  class="ma-1"
                  closable
                  @click:close="removeRecipient(r)"
                >
                  {{ r.name || '(未填姓名)' }} &lt;{{ r.email }}&gt;
                </v-chip>
              </template>
              <div v-else class="text-grey text-caption pa-2">尚無收件人</div>
            </div>
            <v-expansion-panels v-if="excludedRecipients.length" variant="accordion" class="mb-3">
              <v-expansion-panel>
                <v-expansion-panel-title class="text-caption">
                  已排除 {{ excludedRecipients.length }} 位（不聯絡／無 Email／已手動移除），展開可勾回
                </v-expansion-panel-title>
                <v-expansion-panel-text>
                  <div v-for="r in excludedRecipients" :key="r.leadId || r.email || r.name" class="d-flex align-center">
                    <v-checkbox
                      :model-value="false"
                      density="compact"
                      hide-details
                      :disabled="!r.email"
                      @update:model-value="reincludeRecipient(r)"
                    >
                      <template #label>
                        <span class="text-body-2">
                          {{ r.name || '(未填姓名)' }}
                          <span v-if="r.email">&lt;{{ r.email }}&gt;</span>
                          <v-chip size="x-small" class="ml-1" :color="r.reasonColor" variant="tonal">{{ r.reason }}</v-chip>
                        </span>
                      </template>
                    </v-checkbox>
                  </div>
                </v-expansion-panel-text>
              </v-expansion-panel>
            </v-expansion-panels>

            <!-- 主旨 -->
            <v-text-field
              v-model="subject"
              :label="subjectLabel"
              variant="outlined"
              density="comfortable"
              :rules="[(v) => !!(v && v.trim()) || '請輸入主旨']"
              class="mb-2"
            />

            <!-- 附件 -->
            <div class="text-subtitle-2 mb-1">附件（最多 5 個，單檔 ≤ 10MB，總計 ≤ 20MB）</div>
            <v-file-input
              v-model="pendingFiles"
              label="選擇檔案"
              multiple
              chips
              density="compact"
              variant="outlined"
              prepend-icon="mdi-paperclip"
              :loading="uploading"
              :disabled="uploading || attachments.length >= 5"
              hide-details
              class="mb-2"
              @update:model-value="onFilesPicked"
            />
            <v-list v-if="attachments.length" density="compact" class="mb-3 attachment-list">
              <v-list-item v-for="a in attachments" :key="a.url">
                <template #prepend><v-icon size="small">mdi-file</v-icon></template>
                <v-list-item-title class="text-body-2">{{ a.name }}</v-list-item-title>
                <v-list-item-subtitle>{{ formatSize(a.size) }}</v-list-item-subtitle>
                <template #append>
                  <v-btn icon="mdi-close" size="x-small" variant="text" @click="removeAttachment(a)" />
                </template>
              </v-list-item>
            </v-list>
            <div class="text-caption text-grey mb-3">目前附件總計 {{ formatSize(totalAttachmentSize) }}</div>

            <!-- 範本 -->
            <div class="d-flex flex-wrap ga-2">
              <v-menu>
                <template #activator="{ props: menuProps }">
                  <v-btn v-bind="menuProps" variant="outlined" size="small" prepend-icon="mdi-file-document-multiple" :loading="loadingTemplates">
                    載入範本
                    <v-icon end>mdi-menu-down</v-icon>
                  </v-btn>
                </template>
                <v-list density="compact">
                  <v-list-item v-if="!templates.length" disabled title="尚無範本" />
                  <v-list-item v-for="t in templates" :key="t.id" :title="t.name" :subtitle="t.subject" @click="applyTemplate(t)" />
                </v-list>
              </v-menu>
              <v-btn variant="outlined" size="small" prepend-icon="mdi-content-save" @click="openSaveTemplate">另存為範本</v-btn>
            </div>
          </v-col>

          <!-- 右：編輯器 / 預覽 -->
          <v-col cols="12" md="7" class="pa-4 composer-right">
            <div class="d-flex align-center flex-wrap ga-2 mb-2">
              <v-btn-toggle v-model="rightMode" mandatory density="compact" color="primary" variant="outlined">
                <v-btn value="edit" size="small" prepend-icon="mdi-pencil">編輯</v-btn>
                <v-btn value="preview" size="small" prepend-icon="mdi-eye">預覽</v-btn>
              </v-btn-toggle>
              <v-spacer />
              <span class="text-caption text-grey mr-1">插入變數：</span>
              <v-btn
                v-for="v in variableButtons"
                :key="v.token"
                size="x-small"
                variant="tonal"
                :disabled="rightMode !== 'edit'"
                @click="insertVariable(v.token)"
              >{{ v.token }}</v-btn>
            </div>

            <div v-show="rightMode === 'edit'">
              <TiptapEditor v-model="html" />
              <div class="text-caption text-grey mt-1">
                提示：變數會依收件人逐封替換；信尾會自動加上「此信由 ANXI 安熙智慧 寄送｜如不想再收到相關資訊，請回覆此信告知。」
              </div>
            </div>
            <div v-show="rightMode === 'preview'" class="preview-wrapper">
              <div class="text-caption text-grey mb-1">
                以第一位收件人預覽：{{ previewRecipient.name || '(未填姓名)' }} &lt;{{ previewRecipient.email || '—' }}&gt;
              </div>
              <div class="preview-subject">主旨：{{ renderVariables(subject, previewRecipient) }}</div>
              <div class="preview-html" v-html="renderVariables(html, previewRecipient)"></div>
              <div class="preview-footer">此信由 ANXI 安熙智慧 寄送｜如不想再收到相關資訊，請回覆此信告知。</div>
            </div>
          </v-col>
        </v-row>
      </v-card-text>

      <v-divider />
      <v-card-actions class="flex-wrap">
        <template v-if="sending || sendResult">
          <v-spacer />
          <v-btn variant="text" :disabled="sending && !campaign" @click="finish">關閉</v-btn>
        </template>
        <template v-else>
          <v-btn
            variant="text"
            prepend-icon="mdi-email-check"
            :disabled="!canCompose || !currentUserEmail"
            :loading="sendingTest"
            @click="sendTest"
          >寄測試信給我</v-btn>
          <v-spacer />
          <v-btn variant="text" @click="close">取消</v-btn>
          <v-btn
            color="primary"
            variant="flat"
            prepend-icon="mdi-send"
            :disabled="!canCompose || !activeRecipients.length"
            @click="confirmDialog = true"
          >送出（{{ activeRecipients.length }}）</v-btn>
        </template>
      </v-card-actions>
    </v-card>

    <!-- 送出確認 -->
    <v-dialog v-model="confirmDialog" max-width="460">
      <v-card>
        <v-card-title>確認送出</v-card-title>
        <v-card-text>
          <div class="mb-2">主旨：<strong>{{ subject }}</strong></div>
          <div class="mb-2">收件人：<strong>{{ activeRecipients.length }}</strong> 位</div>
          <div class="mb-2">附件：<strong>{{ attachments.length }}</strong> 個（{{ formatSize(totalAttachmentSize) }}）</div>
          <div class="mb-3">預估時間：約 {{ Math.max(1, Math.ceil(activeRecipients.length * 0.6)) }} 秒</div>
          <v-alert type="warning" variant="tonal" density="compact">
            Gmail 每日寄送上限約 500 封，超過請分天寄送。
          </v-alert>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="confirmDialog = false">取消</v-btn>
          <v-btn color="primary" variant="flat" @click="doSend">確定送出</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- 另存為範本 -->
    <v-dialog v-model="saveTemplateDialog" max-width="420">
      <v-card>
        <v-card-title>另存為範本</v-card-title>
        <v-card-text>
          <v-text-field
            v-model="saveTemplateName"
            label="範本名稱"
            variant="outlined"
            density="comfortable"
            autofocus
            @keyup.enter="saveAsTemplate"
          />
          <v-alert v-if="existingTemplateWithName" type="info" variant="tonal" density="compact">
            已有同名範本，儲存後將覆蓋。
          </v-alert>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="saveTemplateDialog = false">取消</v-btn>
          <v-btn color="primary" :disabled="!saveTemplateName.trim()" :loading="savingTemplate" @click="saveAsTemplate">儲存</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-dialog>
</template>

<script setup>
import { ref, computed, watch, onBeforeUnmount } from 'vue';
import { useDisplay } from 'vuetify';
import TiptapEditor from '@/components/TiptapEditor.vue';
import { useUserStore } from '@/store/user';
import { useUiStore } from '@/store/uiStore';
import { sendMarketingEmailAPI, uploadMarketingAttachment } from '@/api';
import {
  fetchEmailTemplates,
  saveEmailTemplate,
  subscribeCampaign,
  subscribeCampaignsByCreator,
  toDate,
} from '@/services/trialLeadsService';

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  /** [{ leadId|id, name, email, company, tags }] */
  recipients: { type: Array, default: () => [] },
  /** { subject, html, attachments } */
  preset: { type: Object, default: null },
});
const emit = defineEmits(['update:modelValue', 'sent', 'template-saved']);

const { mdAndUp } = useDisplay();
const userStore = useUserStore();
const uiStore = useUiStore();

const currentUserEmail = computed(() => userStore.user?.email || '');
const operatorKey = computed(() => userStore.user?.key || '');

// ---------------------------------------------------------------
// 收件人
// ---------------------------------------------------------------
const DO_NOT_CONTACT_TAG = '不聯絡';
const allRecipients = ref([]); // 正規化後的收件人（含 excluded 旗標）

function normalizeRecipient(r) {
  const tags = Array.isArray(r.tags) ? r.tags : [];
  const email = String(r.email || '').trim();
  let reason = '';
  let reasonColor = 'grey';
  if (!email) { reason = '無 Email'; reasonColor = 'grey'; } else if (tags.includes(DO_NOT_CONTACT_TAG)) { reason = '不聯絡'; reasonColor = 'red'; }
  return {
    leadId: r.leadId || r.id || '',
    name: r.name || '',
    email,
    company: r.company || '',
    tags,
    excluded: !!reason,
    reason,
    reasonColor,
  };
}

const activeRecipients = computed(() => allRecipients.value.filter((r) => !r.excluded));
const excludedRecipients = computed(() => allRecipients.value.filter((r) => r.excluded));
const previewRecipient = computed(() => activeRecipients.value[0] || allRecipients.value[0] || { name: '', email: '', company: '' });

function removeRecipient(r) {
  const target = allRecipients.value.find((x) => x === r);
  if (target) { target.excluded = true; target.reason = target.reason || '手動移除'; }
}
function removeAllRecipients() {
  allRecipients.value.forEach((r) => { r.excluded = true; r.reason = r.reason || '手動移除'; });
}
function reincludeRecipient(r) {
  if (!r.email) return;
  r.excluded = false;
}

// ---------------------------------------------------------------
// 內容 / 附件
// ---------------------------------------------------------------
const subject = ref('');
const subjectLabel = '主旨（必填，支援 {{姓名}} {{公司}} {{Email}} 變數）';
const html = ref('');
const attachments = ref([]);
const pendingFiles = ref([]);
const uploading = ref(false);
const rightMode = ref('edit');

const MAX_FILES = 5;
const MAX_FILE_SIZE = 10 * 1024 * 1024;
const MAX_TOTAL_SIZE = 20 * 1024 * 1024;

const totalAttachmentSize = computed(() => attachments.value.reduce((s, a) => s + (Number(a.size) || 0), 0));
const canCompose = computed(() => !!subject.value.trim() && !!stripHtml(html.value).trim());

function stripHtml(s) {
  return String(s || '').replace(/<[^>]*>/g, '');
}
function formatSize(bytes) {
  const n = Number(bytes) || 0;
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / 1024 / 1024).toFixed(2)} MB`;
}

async function onFilesPicked(files) {
  const list = Array.isArray(files) ? files : (files ? [files] : []);
  if (!list.length) return;
  const accepted = [];
  let runningTotal = totalAttachmentSize.value;
  for (const f of list) {
    if (attachments.value.length + accepted.length >= MAX_FILES) {
      uiStore.showSnackbar(`附件最多 ${MAX_FILES} 個`, 'warning');
      break;
    }
    if (f.size > MAX_FILE_SIZE) {
      uiStore.showSnackbar(`「${f.name}」超過 10MB，已略過`, 'warning');
      continue;
    }
    if (runningTotal + f.size > MAX_TOTAL_SIZE) {
      uiStore.showSnackbar(`加入「${f.name}」後總計會超過 20MB，已略過`, 'warning');
      continue;
    }
    runningTotal += f.size;
    accepted.push(f);
  }
  pendingFiles.value = [];
  if (!accepted.length) return;
  uploading.value = true;
  try {
    for (const f of accepted) {
      const meta = await uploadMarketingAttachment(f);
      attachments.value.push({ name: meta.name, url: meta.url, size: meta.size });
    }
  } catch (e) {
    console.error(e);
    uiStore.showSnackbar(`附件上傳失敗：${e.message || e}`, 'error');
  } finally {
    uploading.value = false;
  }
}
function removeAttachment(a) {
  attachments.value = attachments.value.filter((x) => x.url !== a.url);
}

// ---------------------------------------------------------------
// 變數
// ---------------------------------------------------------------
const variableButtons = [
  { token: '{{姓名}}' },
  { token: '{{公司}}' },
  { token: '{{Email}}' },
];

function insertVariable(token) {
  const current = html.value || '';
  const idx = current.lastIndexOf('</p>');
  if (idx >= 0) {
    html.value = `${current.slice(0, idx)}${token}${current.slice(idx)}`;
  } else {
    html.value = `${current}<p>${token}</p>`;
  }
}

function escapeHtml(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function renderVariables(text, r) {
  const rec = r || {};
  return String(text || '')
    .replace(/\{\{\s*姓名\s*\}\}/g, escapeHtml(rec.name || ''))
    .replace(/\{\{\s*公司\s*\}\}/g, escapeHtml(rec.company || ''))
    .replace(/\{\{\s*Email\s*\}\}/gi, escapeHtml(rec.email || ''));
}

// ---------------------------------------------------------------
// 範本
// ---------------------------------------------------------------
const templates = ref([]);
const loadingTemplates = ref(false);
const saveTemplateDialog = ref(false);
const saveTemplateName = ref('');
const savingTemplate = ref(false);

const existingTemplateWithName = computed(() =>
  templates.value.find((t) => t.name === saveTemplateName.value.trim()) || null);

async function loadTemplates() {
  loadingTemplates.value = true;
  try {
    templates.value = await fetchEmailTemplates();
  } catch (e) {
    console.error(e);
  } finally {
    loadingTemplates.value = false;
  }
}

function applyTemplate(t) {
  subject.value = t.subject || '';
  html.value = t.html || '';
  attachments.value = Array.isArray(t.attachments) ? t.attachments.map((a) => ({ ...a })) : [];
  uiStore.showSnackbar(`已載入範本「${t.name}」`, 'info', 2000);
}

function openSaveTemplate() {
  saveTemplateName.value = '';
  saveTemplateDialog.value = true;
}

async function saveAsTemplate() {
  const name = saveTemplateName.value.trim();
  if (!name) return;
  savingTemplate.value = true;
  try {
    const existing = existingTemplateWithName.value;
    await saveEmailTemplate({
      id: existing?.id,
      name,
      subject: subject.value,
      html: html.value,
      attachments: attachments.value,
    }, userStore.user?.name || operatorKey.value);
    uiStore.showSnackbar('範本已儲存', 'success');
    saveTemplateDialog.value = false;
    await loadTemplates();
    emit('template-saved');
  } catch (e) {
    console.error(e);
    uiStore.showSnackbar(`儲存範本失敗：${e.message || e}`, 'error');
  } finally {
    savingTemplate.value = false;
  }
}

// ---------------------------------------------------------------
// 送出
// ---------------------------------------------------------------
const confirmDialog = ref(false);
const sending = ref(false);
const sendingTest = ref(false);
const sendResult = ref(null);
const campaign = ref(null);
let unsubCampaign = null;
let unsubCreator = null;
let sendStartedAt = 0;

const progressPercent = computed(() => {
  const c = campaign.value;
  if (!c || !c.total) return sendResult.value ? 100 : 0;
  return Math.round(((c.sent || 0) + (c.failed || 0)) / c.total * 100);
});
const progressAlertType = computed(() => {
  if (sending.value) return 'info';
  if ((campaign.value?.failed || sendResult.value?.failed || 0) > 0) return 'warning';
  return 'success';
});
const failedRecipients = computed(() =>
  (campaign.value?.recipients || []).filter((r) => r.status === 'failed'));

function stopSubscriptions() {
  if (unsubCampaign) { unsubCampaign(); unsubCampaign = null; }
  if (unsubCreator) { unsubCreator(); unsubCreator = null; }
}

function watchCampaignById(id) {
  if (!id) return;
  if (unsubCreator) { unsubCreator(); unsubCreator = null; }
  if (unsubCampaign) unsubCampaign();
  unsubCampaign = subscribeCampaign(id, (c) => {
    if (c) campaign.value = c;
  });
}

/** 送出後尚未取得 campaignId：先訂閱本人建立的 campaigns，找出送出後新建的那一筆 */
function watchNewestCampaign(expectedSubject) {
  if (!operatorKey.value) return;
  unsubCreator = subscribeCampaignsByCreator(operatorKey.value, (list) => {
    if (unsubCampaign) return;
    const candidates = list
      .filter((c) => (toDate(c.createdAt)?.getTime() || 0) >= sendStartedAt - 60 * 1000)
      .filter((c) => !expectedSubject || c.subject === expectedSubject)
      .sort((a, b) => (toDate(b.createdAt)?.getTime() || 0) - (toDate(a.createdAt)?.getTime() || 0));
    if (candidates[0]) watchCampaignById(candidates[0].id);
  });
}

function buildPayload(recipients) {
  return {
    operatorKey: operatorKey.value,
    subject: subject.value.trim(),
    html: html.value,
    attachments: attachments.value.map((a) => ({ name: a.name, url: a.url, size: a.size })),
    recipients: recipients.map((r) => ({
      leadId: r.leadId || null,
      name: r.name || '',
      email: r.email,
      company: r.company || '',
    })),
  };
}

async function doSend() {
  confirmDialog.value = false;
  if (!activeRecipients.value.length) return;
  sending.value = true;
  sendResult.value = null;
  campaign.value = null;
  sendStartedAt = Date.now();
  watchNewestCampaign(subject.value.trim());
  try {
    const res = await sendMarketingEmailAPI(buildPayload(activeRecipients.value));
    sendResult.value = res || {};
    if (res?.campaignId) watchCampaignById(res.campaignId);
    uiStore.showSnackbar(`寄送完成：成功 ${res?.sent ?? 0}，失敗 ${res?.failed ?? 0}`, (res?.failed || 0) > 0 ? 'warning' : 'success');
    emit('sent', res);
  } catch (e) {
    console.error(e);
    uiStore.showSnackbar(`寄送失敗：${e.message || e}`, 'error');
    if (!campaign.value) {
      sendResult.value = null;
      stopSubscriptions();
    } else {
      sendResult.value = { sent: campaign.value.sent || 0, failed: campaign.value.failed || 0, error: e.message };
    }
  } finally {
    sending.value = false;
  }
}

async function sendTest() {
  if (!currentUserEmail.value) {
    uiStore.showSnackbar('目前登入者沒有 Email，無法寄測試信', 'warning');
    return;
  }
  sendingTest.value = true;
  try {
    const me = {
      leadId: null,
      name: userStore.user?.name || '測試',
      email: currentUserEmail.value,
      company: '（測試）',
    };
    const res = await sendMarketingEmailAPI({
      ...buildPayload([me]),
      subject: `[測試] ${subject.value.trim()}`,
    });
    if ((res?.failed || 0) > 0) {
      uiStore.showSnackbar('測試信寄送失敗，請至「寄信紀錄」查看原因', 'error');
    } else {
      uiStore.showSnackbar(`測試信已寄至 ${currentUserEmail.value}`, 'success');
    }
  } catch (e) {
    console.error(e);
    uiStore.showSnackbar(`測試信寄送失敗：${e.message || e}`, 'error');
  } finally {
    sendingTest.value = false;
  }
}

// ---------------------------------------------------------------
// 開關 / 初始化
// ---------------------------------------------------------------
function resetState() {
  allRecipients.value = (props.recipients || []).map(normalizeRecipient);
  subject.value = props.preset?.subject || '';
  html.value = props.preset?.html || '';
  attachments.value = Array.isArray(props.preset?.attachments) ? props.preset.attachments.map((a) => ({ ...a })) : [];
  pendingFiles.value = [];
  rightMode.value = 'edit';
  sending.value = false;
  sendResult.value = null;
  campaign.value = null;
  stopSubscriptions();
}

watch(() => props.modelValue, (open) => {
  if (open) {
    resetState();
    loadTemplates();
  } else {
    stopSubscriptions();
  }
}, { immediate: true });

function onDialogToggle(v) {
  if (!v && !sending.value) close();
}
function close() {
  if (sending.value) return;
  stopSubscriptions();
  emit('update:modelValue', false);
}
function finish() {
  stopSubscriptions();
  emit('update:modelValue', false);
}

onBeforeUnmount(stopSubscriptions);
</script>

<style scoped>
.composer-card {
  min-height: 70vh;
}
.composer-body {
  min-height: 60vh;
}
.composer-left {
  border-right: 1px solid rgba(0, 0, 0, 0.08);
}
@media (max-width: 959px) {
  .composer-left {
    border-right: none;
    border-bottom: 1px solid rgba(0, 0, 0, 0.08);
  }
}
.recipient-box {
  border: 1px solid rgba(0, 0, 0, 0.2);
  border-radius: 4px;
  min-height: 56px;
  max-height: 220px;
  overflow-y: auto;
  padding: 4px;
}
.attachment-list {
  border: 1px solid rgba(0, 0, 0, 0.12);
  border-radius: 4px;
}
.preview-wrapper {
  border: 1px solid rgba(0, 0, 0, 0.2);
  border-radius: 4px;
  padding: 12px 16px;
  min-height: 300px;
  background: #fff;
}
.preview-subject {
  font-weight: 600;
  padding-bottom: 8px;
  margin-bottom: 12px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.12);
}
.preview-html {
  line-height: 1.7;
  word-break: break-word;
}
.preview-html :deep(img) {
  max-width: 100%;
}
.preview-footer {
  margin-top: 24px;
  padding-top: 8px;
  border-top: 1px solid rgba(0, 0, 0, 0.12);
  font-size: 12px;
  color: #757575;
}
</style>
