<template>
  <div v-if="prospect" class="prospect-detail">
    <!-- 標頭 -->
    <div class="d-flex align-start flex-wrap ga-2 mb-3">
      <div class="flex-grow-1">
        <div class="text-h6 d-flex align-center flex-wrap ga-2">
          <v-icon size="small" :color="catMeta.color">{{ catMeta.icon }}</v-icon>
          {{ prospect.name || '(未命名)' }}
          <v-chip size="small" :color="catMeta.color" variant="tonal">{{ catMeta.title }}</v-chip>
          <v-chip v-if="prospect.saleStatus" size="small" variant="tonal">{{ prospect.saleStatus }}</v-chip>
          <v-chip v-if="prospect.resourceType" size="small" variant="tonal">{{ prospect.resourceType }}</v-chip>
          <span class="priority-stars" title="優先度（點擊切換）">
            <v-icon v-for="n in 2" :key="n" size="small" :color="(prospect.priority || 0) >= n ? 'amber' : 'grey-lighten-1'" class="cursor-pointer" @click="setPriority(n)">
              {{ (prospect.priority || 0) >= n ? 'mdi-star' : 'mdi-star-outline' }}
            </v-icon>
          </span>
        </div>
        <div class="text-body-2 text-grey mt-1 d-flex flex-wrap ga-3">
          <span v-if="prospect.region"><v-icon size="x-small">mdi-map-marker</v-icon> {{ prospect.region }}</span>
          <span v-if="prospect.category === 'project' && (prospect.companyName || prospect.builder)">
            <v-icon size="x-small">mdi-domain</v-icon>
            <a v-if="companyProspect" href="#" class="text-primary" @click.prevent="emit('navigate', companyProspect.id)">{{ companyProspect.name }}</a>
            <span v-else>{{ prospect.builder }}</span>
          </span>
          <span v-if="prospect.phone"><v-icon size="x-small">mdi-phone</v-icon> <a :href="`tel:${prospect.phone}`" class="text-decoration-none">{{ prospect.phone }}</a></span>
        </div>
        <div class="text-caption text-grey mt-1">
          建立 {{ fmt(prospect.createdAt) }}　最後寄信 {{ fmt(prospect.lastEmailAt) }}（{{ prospect.emailCount || 0 }} 次）
          <span v-if="prospect.lastOpenedAt">　最後開信 {{ fmt(prospect.lastOpenedAt) }}</span>
          <span v-if="prospect.repliedAt">　回覆 {{ fmt(prospect.repliedAt) }}</span>
        </div>
      </div>
      <div class="d-flex ga-2 flex-wrap">
        <v-btn size="small" color="primary" variant="flat" prepend-icon="mdi-email-send" :disabled="!emailContactList.length" @click="emit('send-email', { prospect, contacts: emailContactList })">寄送 Email</v-btn>
        <v-btn size="small" color="error" variant="text" icon="mdi-delete" title="刪除" @click="deleteDialog = true" />
        <v-btn v-if="showClose" icon="mdi-close" size="small" variant="text" @click="emit('close')" />
      </div>
    </div>

    <!-- 狀態 / 負責人 / 追蹤日 / 標籤 -->
    <v-card variant="outlined" class="mb-3">
      <v-card-text>
        <v-row dense align="center">
          <v-col cols="12" sm="4">
            <v-select
              :model-value="prospect.status || 'new'"
              :items="statusOptions"
              label="狀態"
              density="compact"
              variant="outlined"
              hide-details
              :loading="savingStatus"
              @update:model-value="setStatus"
            >
              <template #selection="{ item }">
                <v-chip size="x-small" :color="item.raw.color" variant="flat" class="mr-1">&nbsp;</v-chip>{{ item.title }}
              </template>
            </v-select>
          </v-col>
          <v-col cols="12" sm="4">
            <v-select
              :model-value="prospect.owner || null"
              :items="ownerItems"
              label="負責人"
              density="compact"
              variant="outlined"
              hide-details
              clearable
              :loading="savingOwner"
              @update:model-value="setOwner"
            />
          </v-col>
          <v-col cols="12" sm="4">
            <v-text-field
              v-model="followUpInput"
              type="date"
              label="下次追蹤日"
              density="compact"
              variant="outlined"
              hide-details
              :loading="savingFollowUp"
              :class="{ 'followup-overdue': isOverdue }"
              @change="setFollowUpFromInput"
            />
          </v-col>
          <v-col cols="12" class="d-flex flex-wrap ga-1 align-center">
            <span class="text-caption text-grey mr-1">追蹤日快捷：</span>
            <v-btn size="x-small" variant="tonal" @click="setFollowUpDays(1)">明天</v-btn>
            <v-btn size="x-small" variant="tonal" @click="setFollowUpDays(3)">+3 天</v-btn>
            <v-btn size="x-small" variant="tonal" @click="setFollowUpDays(7)">+7 天</v-btn>
            <v-btn size="x-small" variant="tonal" @click="setFollowUpDays(14)">+14 天</v-btn>
            <v-btn size="x-small" variant="text" :disabled="!prospect.followUpAt" @click="clearFollowUp">清除</v-btn>
          </v-col>
        </v-row>
        <div class="d-flex align-center flex-wrap ga-2 mt-3">
          <span class="text-subtitle-2 mr-1">標籤：</span>
          <v-chip v-for="t in prospectTags" :key="t.name" size="small" :color="t.color" variant="flat" closable @click:close="removeTag(t.name)">{{ t.name }}</v-chip>
          <v-menu>
            <template #activator="{ props: menuProps }">
              <v-btn v-bind="menuProps" icon="mdi-plus" size="x-small" variant="tonal" :loading="savingTags" />
            </template>
            <v-list density="compact">
              <v-list-item v-for="t in availableTags" :key="t.id" @click="addTag(t.name)">
                <template #prepend><v-chip :color="t.color" size="x-small" variant="flat" class="mr-2">&nbsp;</v-chip></template>
                <v-list-item-title>{{ t.name }}</v-list-item-title>
              </v-list-item>
              <v-list-item v-if="!availableTags.length" disabled title="已無可加入的標籤" />
              <v-divider />
              <v-list-item prepend-icon="mdi-cog" title="管理標籤…" @click="emit('open-tag-manager')" />
            </v-list>
          </v-menu>
        </div>
      </v-card-text>
    </v-card>

    <!-- 基本資料 -->
    <v-card variant="outlined" class="mb-3">
      <v-card-title class="text-subtitle-1 d-flex align-center">
        <v-icon size="small" class="mr-1">mdi-card-account-details</v-icon>基本資料
        <v-spacer />
        <v-btn size="small" color="primary" variant="text" :disabled="!basicDirty" :loading="savingBasic" @click="saveBasic">儲存</v-btn>
      </v-card-title>
      <v-card-text>
        <v-row dense>
          <v-col cols="12" sm="6"><v-text-field v-model="form.name" label="名稱" density="compact" variant="outlined" hide-details /></v-col>
          <v-col cols="12" sm="6">
            <v-select v-model="form.category" :items="categoryOptions" item-title="title" item-value="value" label="類別" density="compact" variant="outlined" hide-details />
          </v-col>

          <template v-if="form.category === 'project'">
            <v-col cols="12" sm="6"><v-text-field v-model="form.region" label="區域" density="compact" variant="outlined" hide-details /></v-col>
            <v-col cols="12" sm="6"><v-text-field v-model="form.saleStatus" label="銷售狀態（預售／新成屋…）" density="compact" variant="outlined" hide-details /></v-col>
            <v-col cols="12" sm="6">
              <v-autocomplete
                v-model="form.companyId"
                :items="builderItems"
                label="所屬建商（連結）"
                density="compact"
                variant="outlined"
                hide-details
                clearable
                @update:model-value="onCompanyPicked"
              />
            </v-col>
            <v-col cols="12" sm="6"><v-text-field v-model="form.builder" label="建設公司（文字）" density="compact" variant="outlined" hide-details /></v-col>
            <v-col cols="12" sm="6"><v-text-field v-model="form.agency" label="代銷／企劃銷售" density="compact" variant="outlined" hide-details /></v-col>
            <v-col cols="12" sm="6"><v-text-field v-model="form.phone" label="建案直撥電話" density="compact" variant="outlined" hide-details /></v-col>
            <v-col cols="12" sm="6"><v-text-field v-model="form.phoneHousetube" label="房地王轉接" density="compact" variant="outlined" hide-details /></v-col>
            <v-col cols="12" sm="6"><v-text-field v-model="form.phone591" label="591 轉接" density="compact" variant="outlined" hide-details /></v-col>
            <v-col cols="12"><v-text-field v-model="form.receptionAddress" label="接待中心地址" density="compact" variant="outlined" hide-details /></v-col>
            <v-col cols="12"><v-text-field v-model="form.siteAddress" label="基地地址" density="compact" variant="outlined" hide-details /></v-col>
          </template>
          <template v-else>
            <v-col v-if="form.category === 'resource'" cols="12" sm="6"><v-text-field v-model="form.resourceType" label="類型" density="compact" variant="outlined" hide-details /></v-col>
            <v-col cols="12" sm="6"><v-text-field v-model="form.phone" label="電話" density="compact" variant="outlined" hide-details /></v-col>
            <v-col cols="12"><v-text-field v-model="form.siteAddress" label="地址" density="compact" variant="outlined" hide-details /></v-col>
            <v-col v-if="form.category !== 'resource'" cols="12"><v-text-field v-model="form.projectsText" label="在售／負責建案" density="compact" variant="outlined" hide-details /></v-col>
          </template>

          <v-col cols="12" sm="6"><v-text-field v-model="form.facebook" label="FB 粉專" density="compact" variant="outlined" hide-details append-inner-icon="mdi-open-in-new" @click:append-inner="openLink(form.facebook)" /></v-col>
          <v-col cols="12" sm="6"><v-text-field v-model="form.line" label="LINE" density="compact" variant="outlined" hide-details append-inner-icon="mdi-open-in-new" @click:append-inner="openLink(form.line)" /></v-col>
          <v-col cols="12" sm="6"><v-text-field v-model="form.website" label="官網／來源" density="compact" variant="outlined" hide-details append-inner-icon="mdi-open-in-new" @click:append-inner="openLink(form.website)" /></v-col>
          <v-col cols="12" sm="6"><v-text-field v-model="form.instagram" label="IG／其他" density="compact" variant="outlined" hide-details /></v-col>
          <v-col cols="12"><v-text-field v-model="form.note" label="備註（Excel 原值）" density="compact" variant="outlined" hide-details /></v-col>
        </v-row>

        <!-- 建商：旗下建案 -->
        <div v-if="prospect.category === 'builder' && relatedProjects.length" class="mt-3">
          <div class="text-subtitle-2 mb-1">旗下建案（{{ relatedProjects.length }}）</div>
          <div class="d-flex flex-wrap ga-1">
            <v-chip v-for="p in relatedProjects" :key="p.id" size="small" variant="tonal" color="primary" @click="emit('navigate', p.id)">
              {{ p.name }}<span v-if="p.saleStatus" class="text-grey ml-1">{{ p.saleStatus }}</span>
            </v-chip>
          </div>
        </div>
      </v-card-text>
    </v-card>

    <!-- 聯絡人 -->
    <v-card variant="outlined" class="mb-3">
      <v-card-text>
        <ProspectContactsEditor
          :contacts="prospect.contacts || []"
          @update="saveContacts"
          @send-email="(c) => emit('send-email', { prospect, contacts: [c] })"
        />
      </v-card-text>
    </v-card>

    <!-- 開發備註 -->
    <v-card variant="outlined" class="mb-3">
      <v-card-title class="text-subtitle-1 d-flex align-center">
        <v-icon size="small" class="mr-1">mdi-notebook-edit</v-icon>開發備註
        <v-spacer />
        <v-btn size="small" color="primary" variant="text" :disabled="memoInput === (prospect.memo || '')" :loading="savingMemo" @click="saveMemo">儲存</v-btn>
      </v-card-title>
      <v-card-text>
        <v-textarea v-model="memoInput" placeholder="洽談重點、對方需求、注意事項…" density="compact" variant="outlined" rows="3" auto-grow hide-details @blur="saveMemo" />
      </v-card-text>
    </v-card>

    <!-- 活動紀錄 -->
    <v-card variant="outlined" class="mb-3">
      <v-card-title class="text-subtitle-1 d-flex align-center flex-wrap ga-1">
        <v-icon size="small" class="mr-1">mdi-timeline-clock</v-icon>活動紀錄
        <v-spacer />
        <v-btn v-for="t in manualEventTypes" :key="t" size="x-small" variant="tonal" :prepend-icon="eventMeta(t).icon" @click="openEvent(t)">{{ eventMeta(t).label }}</v-btn>
      </v-card-title>
      <v-card-text>
        <div v-if="!timeline.length" class="text-caption text-grey">尚無活動</div>
        <v-timeline v-else density="compact" side="end" align="start" truncate-line="both">
          <v-timeline-item v-for="item in timeline" :key="item.id" :dot-color="item.color" :icon="item.icon" size="small">
            <div class="text-body-2">
              {{ item.label }}
              <span v-if="item.detail" class="text-grey">｜{{ item.detail }}</span>
            </div>
            <div class="text-caption text-grey">{{ fmt(item.at) }}<span v-if="item.byName">　{{ item.byName }}</span></div>
          </v-timeline-item>
        </v-timeline>
      </v-card-text>
    </v-card>

    <!-- 寄信紀錄 -->
    <v-card variant="outlined">
      <v-card-title class="text-subtitle-1"><v-icon size="small" class="mr-1">mdi-email-multiple</v-icon>寄信紀錄（{{ emailLogs.length }}）</v-card-title>
      <v-card-text>
        <div v-if="!emailLogs.length" class="text-caption text-grey">尚未寄過信</div>
        <v-table v-else density="compact">
          <thead>
            <tr><th>時間</th><th>主旨</th><th>收件</th><th>狀態</th><th>開信</th></tr>
          </thead>
          <tbody>
            <tr v-for="(l, i) in emailLogs" :key="i">
              <td class="text-no-wrap">{{ fmt(l.sentAt) }}</td>
              <td><a href="#" class="text-primary" @click.prevent="emit('open-campaign', l.campaignId)">{{ l.subject }}</a></td>
              <td class="text-caption">{{ l.to || '—' }}</td>
              <td><v-chip size="x-small" variant="flat" :color="l.status === 'sent' ? 'success' : 'error'">{{ l.status === 'sent' ? '成功' : '失敗' }}</v-chip></td>
              <td class="text-caption">
                <template v-if="l.openedAt"><v-icon size="x-small" color="cyan">mdi-email-open</v-icon> {{ fmt(l.openedAt) }}（{{ l.openCount || 1 }}）</template>
                <span v-else class="text-grey">—</span>
              </td>
            </tr>
          </tbody>
        </v-table>
      </v-card-text>
    </v-card>

    <ProspectEventDialog v-model="eventDialogOpen" :type="eventType" @submit="submitEvent" />

    <v-dialog v-model="deleteDialog" max-width="420">
      <v-card>
        <v-card-title class="text-error">刪除開發對象</v-card-title>
        <v-card-text>確定要刪除「{{ prospect.name }}」嗎？所有聯絡人、活動與寄信紀錄都會一併刪除且無法復原。</v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="deleteDialog = false">取消</v-btn>
          <v-btn color="error" variant="flat" :loading="deleting" @click="confirmDelete">刪除</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import { formatInTimeZone } from 'date-fns-tz';
import { useUserStore } from '@/store/user';
import { useUiStore } from '@/store/uiStore';
import ProspectContactsEditor from './ProspectContactsEditor.vue';
import ProspectEventDialog from './ProspectEventDialog.vue';
import {
  updateProspect,
  appendProspectEvent,
  deleteProspect,
  makeEvent,
  emailContacts,
  toDate,
  daysFromNowTaipei,
  isDueForFollowUp,
  categoryMeta,
  statusMeta,
  PROSPECT_STATUS_OPTIONS,
  PROSPECT_CATEGORY_OPTIONS,
  PROSPECT_EVENT_LABELS,
  MANUAL_EVENT_TYPES,
} from '@/services/prospectService';

const props = defineProps({
  prospect: { type: Object, default: null },
  tagDefs: { type: Array, default: () => [] },
  /** 超管清單 [{key,name,email}] */
  admins: { type: Array, default: () => [] },
  /** 全部 prospects（建商連結／旗下建案） */
  allProspects: { type: Array, default: () => [] },
  showClose: { type: Boolean, default: false },
});
const emit = defineEmits(['updated', 'deleted', 'send-email', 'open-tag-manager', 'navigate', 'open-campaign', 'close']);

const userStore = useUserStore();
const uiStore = useUiStore();

const statusOptions = PROSPECT_STATUS_OPTIONS;
const categoryOptions = PROSPECT_CATEGORY_OPTIONS;
const manualEventTypes = MANUAL_EVENT_TYPES;
const eventMeta = (t) => PROSPECT_EVENT_LABELS[t] || PROSPECT_EVENT_LABELS.note;
const operatorKey = computed(() => userStore.user?.key || '');
const operatorName = computed(() => userStore.user?.name || userStore.user?.key || '');

const fmt = (v, pattern = 'yyyy/MM/dd HH:mm') => {
  const d = toDate(v);
  return d ? formatInTimeZone(d, 'Asia/Taipei', pattern) : '—';
};

const catMeta = computed(() => categoryMeta(props.prospect?.category));
const emailContactList = computed(() => emailContacts(props.prospect));
const isOverdue = computed(() => isDueForFollowUp(props.prospect));

const companyProspect = computed(() => {
  const id = props.prospect?.companyId;
  return id ? props.allProspects.find((p) => p.id === id) || null : null;
});
const relatedProjects = computed(() => {
  if (props.prospect?.category !== 'builder') return [];
  return props.allProspects.filter((p) => p.category === 'project' && p.companyId === props.prospect.id);
});
const builderItems = computed(() => props.allProspects
  .filter((p) => p.category === 'builder')
  .map((p) => ({ title: p.name, value: p.id }))
  .sort((a, b) => a.title.localeCompare(b.title, 'zh-Hant')));
const ownerItems = computed(() => props.admins.map((a) => ({ title: a.name, value: a.key })));

// ---------------------------------------------------------------
// 通用寫入
// ---------------------------------------------------------------
async function persist(patch, { loadingRef, successMsg, event } = {}) {
  if (!props.prospect) return false;
  if (loadingRef) loadingRef.value = true;
  try {
    if (event) {
      await appendProspectEvent(props.prospect.id, event, patch, operatorKey.value);
      const events = [...(Array.isArray(props.prospect.events) ? props.prospect.events : []), event];
      emit('updated', { id: props.prospect.id, ...patch, events, updatedAt: new Date() });
    } else {
      await updateProspect(props.prospect.id, patch, operatorKey.value);
      emit('updated', { id: props.prospect.id, ...patch, updatedAt: new Date() });
    }
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
const ev = (type, extra = {}) => makeEvent(type, { by: operatorKey.value, byName: operatorName.value, ...extra });

// ---------------------------------------------------------------
// 基本資料
// ---------------------------------------------------------------
const BASIC_FIELDS = ['name', 'category', 'region', 'saleStatus', 'companyId', 'builder', 'agency', 'phone', 'phoneHousetube', 'phone591',
  'receptionAddress', 'siteAddress', 'resourceType', 'projectsText', 'facebook', 'line', 'website', 'instagram', 'note'];
const form = ref({});
const savingBasic = ref(false);

function syncForm() {
  const p = props.prospect || {};
  const f = {};
  BASIC_FIELDS.forEach((k) => { f[k] = p[k] ?? (k === 'companyId' ? null : ''); });
  form.value = f;
}
watch(() => props.prospect?.id, syncForm, { immediate: true });

const basicDirty = computed(() => {
  if (!props.prospect) return false;
  return BASIC_FIELDS.some((k) => (form.value[k] ?? '') !== (props.prospect[k] ?? (k === 'companyId' ? null : '')));
});

function onCompanyPicked(id) {
  const c = props.allProspects.find((p) => p.id === id);
  if (c && !form.value.builder) form.value.builder = c.name;
}

async function saveBasic() {
  const patch = {};
  BASIC_FIELDS.forEach((k) => { patch[k] = typeof form.value[k] === 'string' ? form.value[k].trim() : form.value[k]; });
  if (!patch.name) { uiStore.showSnackbar('名稱不可空白', 'warning'); return; }
  const company = patch.companyId ? props.allProspects.find((p) => p.id === patch.companyId) : null;
  patch.companyName = company ? company.name : (patch.category === 'project' ? patch.builder : '');
  await persist(patch, { loadingRef: savingBasic, successMsg: '基本資料已儲存' });
}

function openLink(v) {
  const s = String(v || '').trim();
  if (!s) return;
  const url = /^https?:\/\//i.test(s) ? s : (s.startsWith('@') ? `https://line.me/R/ti/p/${encodeURIComponent(s)}` : `https://${s}`);
  window.open(url, '_blank', 'noopener');
}

// ---------------------------------------------------------------
// 狀態 / 負責人 / 追蹤日 / 優先度 / 標籤
// ---------------------------------------------------------------
const savingStatus = ref(false);
const savingOwner = ref(false);
const savingFollowUp = ref(false);
const savingTags = ref(false);

async function setStatus(status) {
  if (!status || status === (props.prospect?.status || 'new')) return;
  await persist({ status }, {
    loadingRef: savingStatus,
    event: ev('status_changed', { text: `${statusMeta(props.prospect?.status).title} → ${statusMeta(status).title}`, meta: { from: props.prospect?.status || 'new', to: status } }),
  });
}
async function setOwner(key) {
  const admin = props.admins.find((a) => a.key === key);
  await persist({ owner: key || null, ownerName: admin?.name || '' }, { loadingRef: savingOwner });
}
async function setPriority(n) {
  const cur = props.prospect?.priority || 0;
  const next = cur === n ? n - 1 : n;
  await persist({ priority: next });
}

const followUpInput = ref('');
watch(() => props.prospect?.followUpAt, (v) => { followUpInput.value = v ? fmt(v, 'yyyy-MM-dd') : ''; }, { immediate: true });

async function saveFollowUp(date, text) {
  await persist({ followUpAt: date }, {
    loadingRef: savingFollowUp,
    event: ev('followup_set', { text, meta: { followUpAt: date ? date.toISOString() : null } }),
  });
}
function setFollowUpFromInput() {
  if (!followUpInput.value) return clearFollowUp();
  const d = new Date(`${followUpInput.value}T09:00:00+08:00`);
  if (Number.isNaN(d.getTime())) return;
  saveFollowUp(d, `追蹤日設為 ${followUpInput.value}`);
}
function setFollowUpDays(days) {
  const d = daysFromNowTaipei(days);
  followUpInput.value = fmt(d, 'yyyy-MM-dd');
  saveFollowUp(d, `追蹤日設為 ${followUpInput.value}`);
}
function clearFollowUp() {
  followUpInput.value = '';
  saveFollowUp(null, '清除追蹤日');
}

const tagNames = computed(() => (Array.isArray(props.prospect?.tags) ? props.prospect.tags : []));
const prospectTags = computed(() => tagNames.value.map((name) => ({ name, color: props.tagDefs.find((t) => t.name === name)?.color || 'grey' })));
const availableTags = computed(() => props.tagDefs.filter((t) => !tagNames.value.includes(t.name)));
async function addTag(name) { await persist({ tags: Array.from(new Set([...tagNames.value, name])) }, { loadingRef: savingTags }); }
async function removeTag(name) { await persist({ tags: tagNames.value.filter((t) => t !== name) }, { loadingRef: savingTags }); }

// ---------------------------------------------------------------
// 聯絡人 / 備註
// ---------------------------------------------------------------
async function saveContacts(list) {
  await persist({ contacts: list }, { successMsg: '聯絡人已更新' });
}

const memoInput = ref('');
const savingMemo = ref(false);
watch(() => props.prospect?.id, () => { memoInput.value = props.prospect?.memo || ''; }, { immediate: true });
async function saveMemo() {
  if (!props.prospect || memoInput.value === (props.prospect.memo || '')) return;
  await persist({ memo: memoInput.value }, { loadingRef: savingMemo, successMsg: '備註已儲存' });
}

// ---------------------------------------------------------------
// 活動紀錄
// ---------------------------------------------------------------
const eventDialogOpen = ref(false);
const eventType = ref('note');
function openEvent(t) { eventType.value = t; eventDialogOpen.value = true; }

async function submitEvent({ type, at, text }) {
  const patch = {};
  if (type === 'reply') {
    patch.repliedAt = at;
    if (['new', 'emailed'].includes(props.prospect?.status || 'new')) patch.status = 'replied';
  }
  await persist(patch, { event: ev(type, { at, text }), successMsg: `已新增${eventMeta(type).label}` });
}

const timeline = computed(() => {
  const events = Array.isArray(props.prospect?.events) ? props.prospect.events : [];
  return events
    .map((e, i) => {
      const meta = eventMeta(e.type);
      let detail = e.text || '';
      if (e.type === 'email_sent' || e.type === 'email_failed') detail = `${e.meta?.subject || e.text || ''}${e.meta?.to ? ` → ${e.meta.to}` : ''}${e.meta?.error ? `（${e.meta.error}）` : ''}`;
      if (e.type === 'email_opened') detail = e.meta?.subject || '';
      return { id: e.id || `${e.type}_${i}`, label: meta.label, icon: meta.icon, color: meta.color, detail, at: toDate(e.at), byName: e.byName || '' };
    })
    .sort((a, b) => (b.at?.getTime() || 0) - (a.at?.getTime() || 0));
});

const emailLogs = computed(() => {
  const logs = Array.isArray(props.prospect?.emailLogs) ? [...props.prospect.emailLogs] : [];
  return logs.sort((a, b) => (toDate(b.sentAt)?.getTime() || 0) - (toDate(a.sentAt)?.getTime() || 0));
});

// ---------------------------------------------------------------
// 刪除
// ---------------------------------------------------------------
const deleteDialog = ref(false);
const deleting = ref(false);
async function confirmDelete() {
  if (!props.prospect) return;
  deleting.value = true;
  try {
    await deleteProspect(props.prospect.id);
    uiStore.showSnackbar('已刪除', 'success');
    deleteDialog.value = false;
    emit('deleted', props.prospect.id);
  } catch (e) {
    console.error(e);
    uiStore.showSnackbar(`刪除失敗：${e.message || e}`, 'error');
  } finally {
    deleting.value = false;
  }
}
</script>

<style scoped>
.cursor-pointer { cursor: pointer; }
.followup-overdue :deep(input) { color: #D32F2F; font-weight: 600; }
</style>
