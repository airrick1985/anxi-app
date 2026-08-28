<template>
  <div v-if="lead" class="lead-detail">
    <!-- 標頭 -->
    <div class="d-flex align-start flex-wrap ga-2 mb-3">
      <div class="flex-grow-1">
        <div class="text-h6 d-flex align-center flex-wrap ga-2">
          {{ lead.name || '(未填姓名)' }}
          <v-chip size="small" variant="tonal">{{ useTypeLabel(lead.useType) }}</v-chip>
          <v-chip size="small" :color="statusColor(lead.status)" variant="flat">{{ statusLabel(lead.status) }}</v-chip>
        </div>
        <div class="text-body-2 text-grey mt-1">
          <span v-if="lead.company">{{ lead.company }}　</span>
          <span v-if="lead.phone"><v-icon size="x-small">mdi-phone</v-icon> {{ lead.phone }}　</span>
          <span v-if="lead.email"><v-icon size="x-small">mdi-email</v-icon> {{ lead.email }}</span>
        </div>
        <div class="text-caption text-grey mt-1">
          建立 {{ fmt(lead.createdAt) }}　登入 {{ lead.loginCount || 0 }} 次　最近活動 {{ fmt(lastActivityAt) }}
          <span v-if="lead.source">　來源：{{ lead.source }}</span>
          <span v-if="lead.utm?.campaign">　活動：{{ lead.utm.campaign }}</span>
        </div>
      </div>
      <div class="d-flex ga-2 flex-wrap">
        <v-btn size="small" color="primary" variant="flat" prepend-icon="mdi-email-send" :disabled="!lead.email" @click="emit('send-email', lead)">寄送 Email</v-btn>
        <v-btn
          size="small"
          :color="lead.status === 'archived' ? 'secondary' : 'grey'"
          variant="outlined"
          :prepend-icon="lead.status === 'archived' ? 'mdi-archive-arrow-up' : 'mdi-archive'"
          :loading="savingStatus"
          @click="toggleArchive"
        >{{ lead.status === 'archived' ? '取消封存' : '封存' }}</v-btn>
        <v-btn v-if="showClose" icon="mdi-close" size="small" variant="text" @click="emit('close')" />
      </div>
    </div>

    <!-- 基本資料 -->
    <v-card variant="outlined" class="mb-3">
      <v-card-title class="text-subtitle-1 d-flex align-center">
        <v-icon size="small" class="mr-1">mdi-account-box</v-icon>基本資料
        <v-spacer />
        <v-btn size="small" color="primary" variant="text" :disabled="!basicDirty" :loading="savingBasic" @click="saveBasic">儲存</v-btn>
      </v-card-title>
      <v-card-text>
        <v-row dense>
          <v-col cols="12" sm="6">
            <v-text-field v-model="form.name" label="姓名" density="compact" variant="outlined" hide-details />
          </v-col>
          <v-col cols="12" sm="6">
            <v-text-field v-model="form.company" label="公司" density="compact" variant="outlined" hide-details />
          </v-col>
          <v-col cols="12" sm="6">
            <v-select v-model="form.useType" :items="useTypeOptions" label="型態" density="compact" variant="outlined" hide-details />
          </v-col>
          <v-col cols="12" sm="6">
            <v-text-field v-model="form.phone" label="電話" density="compact" variant="outlined" hide-details />
          </v-col>
          <v-col cols="12">
            <v-text-field v-model="form.email" label="Email" density="compact" variant="outlined" hide-details />
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>

    <!-- 標籤 / 狀態 -->
    <v-card variant="outlined" class="mb-3">
      <v-card-text>
        <div class="d-flex align-center flex-wrap ga-2 mb-3">
          <span class="text-subtitle-2 mr-1">標籤：</span>
          <v-chip
            v-for="t in leadTags"
            :key="t.name"
            size="small"
            :color="t.color"
            variant="flat"
            closable
            @click:close="removeTag(t.name)"
          >{{ t.name }}</v-chip>
          <v-menu>
            <template #activator="{ props: menuProps }">
              <v-btn v-bind="menuProps" icon="mdi-plus" size="x-small" variant="tonal" :loading="savingTags" />
            </template>
            <v-list density="compact">
              <v-list-item
                v-for="t in availableTags"
                :key="t.id"
                @click="addTag(t.name)"
              >
                <template #prepend><v-chip :color="t.color" size="x-small" variant="flat" class="mr-2">&nbsp;</v-chip></template>
                <v-list-item-title>{{ t.name }}</v-list-item-title>
              </v-list-item>
              <v-list-item v-if="!availableTags.length" disabled title="已無可加入的標籤" />
              <v-divider />
              <v-list-item prepend-icon="mdi-cog" title="管理標籤…" @click="emit('open-tag-manager')" />
            </v-list>
          </v-menu>
        </div>
        <div class="d-flex align-center flex-wrap ga-2 mb-3">
          <span class="text-subtitle-2 mr-1">狀態：</span>
          <v-select
            :model-value="lead.status || 'new'"
            :items="statusOptions"
            density="compact"
            variant="outlined"
            hide-details
            style="max-width: 200px"
            :loading="savingStatus"
            @update:model-value="setStatus"
          >
            <template #selection="{ item }">
              <v-chip size="x-small" :color="item.raw.color" variant="flat" class="mr-1">&nbsp;</v-chip>{{ item.title }}
            </template>
          </v-select>
        </div>
        <div class="d-flex align-center flex-wrap ga-2">
          <span class="text-subtitle-2 mr-1">感興趣系統：</span>
          <template v-if="interests.length">
            <v-chip v-for="i in interests" :key="i" size="small" variant="tonal" color="primary">{{ i }}</v-chip>
          </template>
          <span v-else class="text-caption text-grey">未填寫</span>
        </div>
      </v-card-text>
    </v-card>

    <!-- 備註 -->
    <v-card variant="outlined" class="mb-3">
      <v-card-title class="text-subtitle-1"><v-icon size="small" class="mr-1">mdi-comment-text-multiple</v-icon>備註</v-card-title>
      <v-card-text>
        <div class="d-flex align-start ga-2 mb-3">
          <v-textarea
            v-model="noteText"
            placeholder="新增備註…（Ctrl+Enter 送出）"
            density="compact"
            variant="outlined"
            rows="2"
            auto-grow
            hide-details
            @keydown.ctrl.enter.prevent="submitNote"
          />
          <v-btn color="primary" variant="flat" :disabled="!noteText.trim()" :loading="savingNote" @click="submitNote">送出</v-btn>
        </div>
        <div v-if="!sortedNotes.length" class="text-caption text-grey">尚無備註</div>
        <div v-for="n in sortedNotes" :key="n.id" class="note-item">
          <div class="d-flex align-center">
            <span class="text-subtitle-2">{{ n.author || '未知' }}</span>
            <span class="text-caption text-grey ml-2">{{ fmt(n.createdAt) }}</span>
            <v-spacer />
            <v-btn
              v-if="canDeleteNote(n)"
              icon="mdi-delete"
              size="x-small"
              variant="text"
              color="error"
              @click="removeNote(n)"
            />
          </div>
          <div class="text-body-2 note-text">{{ n.text }}</div>
        </div>
      </v-card-text>
    </v-card>

    <!-- 活動紀錄 -->
    <v-card variant="outlined">
      <v-card-title class="text-subtitle-1"><v-icon size="small" class="mr-1">mdi-timeline-clock</v-icon>活動紀錄</v-card-title>
      <v-card-text>
        <div v-if="!timeline.length" class="text-caption text-grey">尚無活動</div>
        <v-timeline v-else density="compact" side="end" align="start" truncate-line="both">
          <v-timeline-item
            v-for="item in timeline"
            :key="item.id"
            :dot-color="item.color"
            :icon="item.icon"
            size="small"
          >
            <div class="text-body-2">
              {{ item.label }}
              <span v-if="item.detail" class="text-grey">｜{{ item.detail }}</span>
            </div>
            <div class="text-caption text-grey">{{ fmt(item.at) }}</div>
          </v-timeline-item>
        </v-timeline>
      </v-card-text>
    </v-card>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import { formatInTimeZone } from 'date-fns-tz';
import { useUserStore } from '@/store/user';
import { useUiStore } from '@/store/uiStore';
import {
  updateTrialLead,
  addTrialLeadNote,
  deleteTrialLeadNote,
  toDate,
  TRIAL_LEAD_STATUS_OPTIONS,
  TRIAL_USE_TYPE_OPTIONS,
  TRIAL_EVENT_LABELS,
} from '@/services/trialLeadsService';

const props = defineProps({
  lead: { type: Object, default: null },
  /** 標籤定義 [{id,name,color}] */
  tagDefs: { type: Array, default: () => [] },
  showClose: { type: Boolean, default: false },
});
const emit = defineEmits(['updated', 'send-email', 'open-tag-manager', 'close']);

const userStore = useUserStore();
const uiStore = useUiStore();

const statusOptions = TRIAL_LEAD_STATUS_OPTIONS;
const useTypeOptions = TRIAL_USE_TYPE_OPTIONS;

const fmt = (v) => {
  const d = toDate(v);
  return d ? formatInTimeZone(d, 'Asia/Taipei', 'yyyy/MM/dd HH:mm') : '—';
};
const statusLabel = (s) => statusOptions.find((o) => o.value === s)?.title || s || '新留資';
const statusColor = (s) => statusOptions.find((o) => o.value === s)?.color || 'primary';
const useTypeLabel = (t) => useTypeOptions.find((o) => o.value === t)?.title || t || '—';

// ---------------------------------------------------------------
// 基本資料
// ---------------------------------------------------------------
const form = ref({ name: '', company: '', useType: 'personal', phone: '', email: '' });
const savingBasic = ref(false);

function syncForm() {
  form.value = {
    name: props.lead?.name || '',
    company: props.lead?.company || '',
    useType: props.lead?.useType || 'personal',
    phone: props.lead?.phone || '',
    email: props.lead?.email || '',
  };
}
watch(() => props.lead?.id, syncForm, { immediate: true });

const basicDirty = computed(() => {
  if (!props.lead) return false;
  return ['name', 'company', 'useType', 'phone', 'email'].some((k) => (form.value[k] || '') !== (props.lead[k] || ''));
});

async function persist(patch, { loadingRef, successMsg } = {}) {
  if (!props.lead) return false;
  if (loadingRef) loadingRef.value = true;
  try {
    await updateTrialLead(props.lead.id, patch);
    emit('updated', { id: props.lead.id, ...patch, updatedAt: new Date() });
    if (successMsg) uiStore.showSnackbar(successMsg, 'success', 2000);
    return true;
  } catch (e) {
    console.error(e);
    uiStore.showSnackbar(`儲存失敗：${e.message || e}`, 'error');
    return false;
  } finally {
    if (loadingRef) loadingRef.value = false;
  }
}

async function saveBasic() {
  await persist({
    name: form.value.name.trim(),
    company: form.value.company.trim(),
    useType: form.value.useType,
    phone: form.value.phone.trim(),
    email: form.value.email.trim(),
  }, { loadingRef: savingBasic, successMsg: '基本資料已儲存' });
}

// ---------------------------------------------------------------
// 標籤 / 狀態
// ---------------------------------------------------------------
const savingTags = ref(false);
const savingStatus = ref(false);

const leadTagNames = computed(() => (Array.isArray(props.lead?.tags) ? props.lead.tags : []));
const leadTags = computed(() => leadTagNames.value.map((name) => ({
  name,
  color: props.tagDefs.find((t) => t.name === name)?.color || 'grey',
})));
const availableTags = computed(() => props.tagDefs.filter((t) => !leadTagNames.value.includes(t.name)));
const interests = computed(() => (Array.isArray(props.lead?.interests) ? props.lead.interests : []));

async function addTag(name) {
  const tags = Array.from(new Set([...leadTagNames.value, name]));
  await persist({ tags }, { loadingRef: savingTags });
}
async function removeTag(name) {
  const tags = leadTagNames.value.filter((t) => t !== name);
  await persist({ tags }, { loadingRef: savingTags });
}
async function setStatus(status) {
  if (!status || status === props.lead?.status) return;
  await persist({ status }, { loadingRef: savingStatus });
}
async function toggleArchive() {
  const status = props.lead?.status === 'archived' ? 'new' : 'archived';
  await persist({ status }, { loadingRef: savingStatus, successMsg: status === 'archived' ? '已封存' : '已取消封存' });
}

// ---------------------------------------------------------------
// 備註
// ---------------------------------------------------------------
const noteText = ref('');
const savingNote = ref(false);

const sortedNotes = computed(() => {
  const notes = Array.isArray(props.lead?.notes) ? [...props.lead.notes] : [];
  return notes.sort((a, b) => (toDate(b.createdAt)?.getTime() || 0) - (toDate(a.createdAt)?.getTime() || 0));
});

function canDeleteNote(n) {
  const me = userStore.user;
  if (!me) return false;
  if (n.authorKey && n.authorKey === me.key) return true;
  if (!n.authorKey && n.author && n.author === me.name) return true;
  return false;
}

async function submitNote() {
  const text = noteText.value.trim();
  if (!text || !props.lead) return;
  savingNote.value = true;
  try {
    const note = await addTrialLeadNote(props.lead.id, {
      text,
      author: userStore.user?.name || userStore.user?.key || '',
      authorKey: userStore.user?.key || '',
    });
    const notes = [...(Array.isArray(props.lead.notes) ? props.lead.notes : []), note];
    emit('updated', { id: props.lead.id, notes, updatedAt: new Date() });
    noteText.value = '';
  } catch (e) {
    console.error(e);
    uiStore.showSnackbar(`新增備註失敗：${e.message || e}`, 'error');
  } finally {
    savingNote.value = false;
  }
}

async function removeNote(n) {
  if (!props.lead) return;
  try {
    await deleteTrialLeadNote(props.lead.id, n.id);
    const notes = (props.lead.notes || []).filter((x) => x.id !== n.id);
    emit('updated', { id: props.lead.id, notes, updatedAt: new Date() });
  } catch (e) {
    console.error(e);
    uiStore.showSnackbar(`刪除備註失敗：${e.message || e}`, 'error');
  }
}

// ---------------------------------------------------------------
// 活動紀錄
// ---------------------------------------------------------------
const EVENT_ICONS = {
  submitted: 'mdi-form-select',
  auto_login: 'mdi-login',
  tour_started: 'mdi-map-marker-path',
  tour_completed: 'mdi-check-decagram',
  tour_skipped: 'mdi-skip-next',
  enter_system: 'mdi-view-dashboard',
  email_sent: 'mdi-email',
  landing_cta_click: 'mdi-cursor-default-click',
};
const EVENT_COLORS = {
  submitted: 'primary',
  auto_login: 'blue',
  tour_started: 'teal',
  tour_completed: 'green',
  tour_skipped: 'grey',
  enter_system: 'indigo',
  email_sent: 'purple',
  landing_cta_click: 'orange',
};

const timeline = computed(() => {
  const items = [];
  const events = Array.isArray(props.lead?.events) ? props.lead.events : [];
  events.forEach((ev, idx) => {
    const at = toDate(ev.at);
    let detail = '';
    if (ev.type === 'enter_system' && ev.meta?.system) detail = ev.meta.system;
    else if (ev.type === 'email_sent' && ev.meta?.subject) detail = ev.meta.subject;
    else if (ev.type === 'landing_cta_click' && ev.meta?.cta) detail = ev.meta.cta;
    items.push({
      id: `ev_${idx}_${at?.getTime() || 0}`,
      at,
      label: TRIAL_EVENT_LABELS[ev.type] || ev.type || '事件',
      detail,
      icon: EVENT_ICONS[ev.type] || 'mdi-circle-small',
      color: EVENT_COLORS[ev.type] || 'grey',
    });
  });
  const logs = Array.isArray(props.lead?.emailLogs) ? props.lead.emailLogs : [];
  logs.forEach((log, idx) => {
    const at = toDate(log.sentAt);
    // 若 events 已有同 campaign 的 email_sent 則不重複
    const dup = events.some((ev) => ev.type === 'email_sent' && ev.meta?.campaignId && ev.meta.campaignId === log.campaignId);
    if (dup) return;
    items.push({
      id: `log_${log.campaignId || idx}_${at?.getTime() || 0}`,
      at,
      label: log.status === 'failed' ? 'Email 寄送失敗' : '收到 Email',
      detail: log.subject || '',
      icon: log.status === 'failed' ? 'mdi-email-alert' : 'mdi-email',
      color: log.status === 'failed' ? 'error' : 'purple',
    });
  });
  return items.sort((a, b) => (b.at?.getTime() || 0) - (a.at?.getTime() || 0));
});

const lastActivityAt = computed(() => {
  const candidates = [props.lead?.lastSeenAt, props.lead?.lastLoginAt, props.lead?.updatedAt, timeline.value[0]?.at]
    .map(toDate)
    .filter(Boolean);
  if (!candidates.length) return props.lead?.createdAt;
  return candidates.sort((a, b) => b.getTime() - a.getTime())[0];
});
</script>

<style scoped>
.note-item {
  padding: 8px 0;
  border-top: 1px solid rgba(0, 0, 0, 0.08);
}
.note-text {
  white-space: pre-wrap;
  word-break: break-word;
}
</style>
