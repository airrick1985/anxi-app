<template>
  <div v-if="prospect" class="pd">
    <!-- 頂列：上一筆／下一筆、主要動作、關閉（捲動時固定） -->
    <header class="pd-head">
      <template v-if="nav">
        <button type="button" class="pd-navbtn" :disabled="!nav.hasPrev" title="上一筆（↑）" @click="emit('prev')"><v-icon size="18">mdi-chevron-up</v-icon></button>
        <button type="button" class="pd-navbtn" :disabled="!nav.hasNext" title="下一筆（↓）" @click="emit('next')"><v-icon size="18">mdi-chevron-down</v-icon></button>
        <span v-if="nav.index >= 0" class="pd-navpos">{{ nav.index + 1 }} / {{ nav.total }}</span>
      </template>
      <div class="pd-spacer" />
      <button type="button" class="mac-btn mac-btn--primary" :disabled="!emailContactList.length" :title="emailContactList.length ? '' : '尚無可寄信的聯絡人'" @click="emit('send-email', { prospect, contacts: emailContactList })">
        <v-icon size="16">mdi-email-fast</v-icon>寄送 Email
      </button>
      <v-menu location="bottom end" :offset="6">
        <template #activator="{ props: p }"><button type="button" class="mac-btn mac-btn--icon" v-bind="p" title="更多"><v-icon size="18">mdi-dots-horizontal</v-icon></button></template>
        <v-list density="compact" class="pd-menu">
          <v-list-item prepend-icon="mdi-tag-multiple" title="標籤管理" @click="emit('open-tag-manager')" />
          <v-divider />
          <v-list-item prepend-icon="mdi-delete" title="刪除此筆" class="text-error" @click="deleteDialog = true" />
        </v-list>
      </v-menu>
      <button v-if="showClose" type="button" class="mac-sheet-close" title="關閉（Esc）" @click="emit('close')"><v-icon size="18">mdi-close</v-icon></button>
    </header>

    <div class="pd-body">
      <!-- 標頭 -->
      <div class="pd-title">
        <v-icon size="18" :color="catMeta.color">{{ catMeta.icon }}</v-icon>
        <h2 class="pd-name">{{ prospect.name || '(未命名)' }}</h2>
        <span class="pd-pill" :class="`pd-pill--${catMeta.color}`">{{ catMeta.title }}</span>
        <span v-if="prospect.saleStatus" class="pd-pill">{{ prospect.saleStatus }}</span>
        <span v-if="prospect.resourceType" class="pd-pill">{{ prospect.resourceType }}</span>
        <span class="pd-stars" title="優先度">
          <v-icon v-for="n in 2" :key="n" size="16" :color="(prospect.priority || 0) >= n ? 'amber' : 'grey-lighten-1'" class="cursor-pointer" @click="setPriority(n)">
            {{ (prospect.priority || 0) >= n ? 'mdi-star' : 'mdi-star-outline' }}
          </v-icon>
        </span>
      </div>
      <div v-if="prospect.region || companyProspect || prospect.builder || prospect.phone" class="pd-meta">
        <span v-if="prospect.region"><v-icon size="13">mdi-map-marker</v-icon>{{ prospect.region }}</span>
        <span v-if="prospect.category === 'project' && (companyProspect || prospect.builder)">
          <v-icon size="13">mdi-domain</v-icon>
          <a v-if="companyProspect" href="#" @click.prevent="emit('navigate', companyProspect.id)">{{ companyProspect.name }}</a>
          <template v-else>{{ prospect.builder }}</template>
        </span>
        <span v-if="prospect.phone"><v-icon size="13">mdi-phone</v-icon><a :href="`tel:${prospect.phone}`">{{ prospect.phone }}</a></span>
      </div>
      <div class="pd-meta pd-meta--dim">
        <span>建立 {{ fmt(prospect.createdAt, 'yyyy/MM/dd') }}</span>
        <span v-if="prospect.emailCount">寄信 {{ prospect.emailCount }} 次，最近 {{ fmt(prospect.lastEmailAt, 'MM/dd') }}</span>
        <span v-else>未寄過信</span>
        <span v-if="prospect.lastOpenedAt"><v-icon size="13" color="cyan">mdi-email-open</v-icon>開信 {{ fmt(prospect.lastOpenedAt, 'MM/dd') }}</span>
        <span v-if="prospect.lastClickedAt"><v-icon size="13" color="deep-purple">mdi-cursor-default-click</v-icon>點擊 {{ fmt(prospect.lastClickedAt, 'MM/dd') }}</span>
        <span v-if="prospect.repliedAt"><v-icon size="13" color="cyan">mdi-reply</v-icon>回覆 {{ fmt(prospect.repliedAt, 'MM/dd') }}</span>
      </div>

      <!-- 狀態 / 負責人 / 追蹤日 / 標籤 -->
      <section class="pd-card">
        <v-row dense>
          <v-col cols="12" sm="4">
            <v-select :model-value="prospect.status || 'new'" :items="statusOptions" label="狀態" density="compact" variant="outlined" hide-details :loading="savingStatus" @update:model-value="setStatus">
              <template #selection="{ item }"><span class="pd-dot" :class="`bg-${item.raw.color}`" />{{ item.title }}</template>
              <template #item="{ props: ip, item }"><v-list-item v-bind="ip"><template #prepend><span class="pd-dot" :class="`bg-${item.raw.color}`" /></template></v-list-item></template>
            </v-select>
          </v-col>
          <v-col cols="12" sm="4">
            <v-select :model-value="prospect.owner || null" :items="ownerItems" label="負責人" density="compact" variant="outlined" hide-details clearable :loading="savingOwner" @update:model-value="setOwner" />
          </v-col>
          <v-col cols="12" sm="4">
            <v-text-field v-model="followUpInput" type="date" label="追蹤日" density="compact" variant="outlined" hide-details :loading="savingFollowUp" :class="{ 'followup-overdue': isOverdue }" @change="setFollowUpFromInput" />
          </v-col>
        </v-row>
        <div class="pd-inline mt-2">
          <button v-for="q in followUpQuick" :key="q.days" type="button" class="pd-mini" @click="setFollowUpDays(q.days)">{{ q.label }}</button>
          <button v-if="prospect.followUpAt" type="button" class="pd-mini pd-mini--text" @click="clearFollowUp">清除追蹤日</button>
          <div class="pd-spacer" />
          <v-chip v-for="t in prospectTags" :key="t.name" size="small" :color="t.color" variant="flat" closable @click:close="removeTag(t.name)">{{ t.name }}</v-chip>
          <v-menu location="bottom end" :offset="4">
            <template #activator="{ props: menuProps }">
              <button type="button" class="pd-mini" v-bind="menuProps" :disabled="savingTags"><v-icon size="14">mdi-tag-plus</v-icon>標籤</button>
            </template>
            <v-list density="compact" class="pd-menu">
              <v-list-item v-for="t in availableTags" :key="t.id" @click="addTag(t.name)">
                <template #prepend><v-chip :color="t.color" size="x-small" variant="flat" class="mr-2">&nbsp;</v-chip></template>
                <v-list-item-title>{{ t.name }}</v-list-item-title>
              </v-list-item>
              <v-list-item v-if="!availableTags.length" disabled title="已全部加入" />
            </v-list>
          </v-menu>
        </div>
      </section>

      <!-- 基本資料：唯讀摘要，按「編輯」才展開表單 -->
      <section class="pd-card">
        <div class="pd-card__head">
          <v-icon size="15">mdi-card-account-details</v-icon>基本資料
          <div class="pd-spacer" />
          <template v-if="editingBasic">
            <button type="button" class="mac-btn" :disabled="savingBasic" @click="cancelBasic">取消</button>
            <button type="button" class="mac-btn mac-btn--primary" :disabled="!basicDirty || savingBasic" @click="saveBasic">儲存</button>
          </template>
          <button v-else type="button" class="mac-btn" @click="editingBasic = true"><v-icon size="15">mdi-pencil</v-icon>編輯</button>
        </div>

        <template v-if="!editingBasic">
          <dl v-if="basicSummary.length" class="pd-dl">
            <template v-for="row in basicSummary" :key="row.label">
              <dt>{{ row.label }}</dt>
              <dd>
                <a v-if="row.href" :href="row.href" :target="row.external ? '_blank' : undefined" :rel="row.external ? 'noopener' : undefined">{{ row.value }}</a>
                <template v-else>{{ row.value }}</template>
              </dd>
            </template>
          </dl>
          <div v-else class="pd-empty">尚未填寫</div>
          <div v-if="prospect.category === 'builder' && relatedProjects.length" class="pd-inline mt-2">
            <span class="pd-dl__label">旗下建案</span>
            <v-chip v-for="p in relatedProjects" :key="p.id" size="small" variant="tonal" color="primary" @click="emit('navigate', p.id)">
              {{ p.name }}<span v-if="p.saleStatus" class="text-grey ml-1">{{ p.saleStatus }}</span>
            </v-chip>
          </div>
        </template>

        <v-row v-else dense class="mt-1">
          <v-col cols="12" sm="6"><v-text-field v-model="form.name" label="名稱" density="compact" variant="outlined" hide-details autofocus /></v-col>
          <v-col cols="12" sm="6"><v-select v-model="form.category" :items="categoryOptions" item-title="title" item-value="value" label="類別" density="compact" variant="outlined" hide-details /></v-col>

          <template v-if="form.category === 'project'">
            <v-col cols="12" sm="6"><v-text-field v-model="form.region" label="區域" density="compact" variant="outlined" hide-details /></v-col>
            <v-col cols="12" sm="6"><v-text-field v-model="form.saleStatus" label="銷售狀態" density="compact" variant="outlined" hide-details /></v-col>
            <v-col cols="12" sm="6"><v-autocomplete v-model="form.companyId" :items="builderItems" label="所屬建商" density="compact" variant="outlined" hide-details clearable @update:model-value="onCompanyPicked" /></v-col>
            <v-col cols="12" sm="6"><v-text-field v-model="form.builder" label="建設公司" density="compact" variant="outlined" hide-details /></v-col>
            <v-col cols="12" sm="6"><v-text-field v-model="form.agency" label="代銷" density="compact" variant="outlined" hide-details /></v-col>
            <v-col cols="12" sm="6"><v-text-field v-model="form.phone" label="電話" density="compact" variant="outlined" hide-details /></v-col>
            <v-col cols="12" sm="6"><v-text-field v-model="form.phoneHousetube" label="房地王轉接" density="compact" variant="outlined" hide-details /></v-col>
            <v-col cols="12" sm="6"><v-text-field v-model="form.phone591" label="591 轉接" density="compact" variant="outlined" hide-details /></v-col>
            <v-col cols="12"><v-text-field v-model="form.receptionAddress" label="接待中心" density="compact" variant="outlined" hide-details /></v-col>
            <v-col cols="12"><v-text-field v-model="form.siteAddress" label="基地地址" density="compact" variant="outlined" hide-details /></v-col>
          </template>
          <template v-else>
            <v-col v-if="form.category === 'resource'" cols="12" sm="6"><v-text-field v-model="form.resourceType" label="類型" density="compact" variant="outlined" hide-details /></v-col>
            <v-col cols="12" sm="6"><v-text-field v-model="form.phone" label="電話" density="compact" variant="outlined" hide-details /></v-col>
            <v-col cols="12"><v-text-field v-model="form.siteAddress" label="地址" density="compact" variant="outlined" hide-details /></v-col>
            <v-col v-if="form.category !== 'resource'" cols="12"><v-text-field v-model="form.projectsText" label="在售建案" density="compact" variant="outlined" hide-details /></v-col>
          </template>

          <v-col cols="12" sm="6"><v-text-field v-model="form.facebook" label="FB" density="compact" variant="outlined" hide-details /></v-col>
          <v-col cols="12" sm="6"><v-text-field v-model="form.line" label="LINE" density="compact" variant="outlined" hide-details /></v-col>
          <v-col cols="12" sm="6"><v-text-field v-model="form.website" label="官網" density="compact" variant="outlined" hide-details /></v-col>
          <v-col cols="12" sm="6"><v-text-field v-model="form.instagram" label="IG／其他" density="compact" variant="outlined" hide-details /></v-col>
          <v-col cols="12"><v-text-field v-model="form.note" label="備註" density="compact" variant="outlined" hide-details /></v-col>
        </v-row>
      </section>

      <!-- 聯絡人 -->
      <section class="pd-card">
        <ProspectContactsEditor
          :contacts="prospect.contacts || []"
          @update="saveContacts"
          @send-email="(c) => emit('send-email', { prospect, contacts: [c] })"
        />
      </section>

      <!-- 開發備註（失焦自動儲存） -->
      <section class="pd-card">
        <div class="pd-card__head">
          <v-icon size="15">mdi-notebook-edit</v-icon>開發備註
          <div class="pd-spacer" />
          <span v-if="savingMemo" class="pd-hint">儲存中…</span>
          <button v-else-if="memoInput !== (prospect.memo || '')" type="button" class="mac-btn mac-btn--primary" @click="saveMemo">儲存</button>
        </div>
        <v-textarea v-model="memoInput" placeholder="洽談重點、對方需求…" density="compact" variant="outlined" rows="2" auto-grow hide-details @blur="saveMemo" />
      </section>

      <!-- 活動紀錄 -->
      <section class="pd-card">
        <div class="pd-card__head">
          <v-icon size="15">mdi-timeline-clock</v-icon>活動紀錄
          <div class="pd-spacer" />
          <button v-for="t in manualEventTypes" :key="t" type="button" class="pd-mini" @click="openEvent(t)"><v-icon size="14">{{ eventMeta(t).icon }}</v-icon>{{ eventMeta(t).label }}</button>
        </div>
        <div v-if="!timeline.length" class="pd-empty">尚無活動</div>
        <v-timeline v-else density="compact" side="end" align="start" truncate-line="both" class="pd-timeline">
          <v-timeline-item v-for="item in timeline" :key="item.id" :dot-color="item.color" :icon="item.icon" size="x-small">
            <div class="pd-tl__text">{{ item.label }}<span v-if="item.detail" class="pd-tl__detail">｜{{ item.detail }}</span></div>
            <div class="pd-tl__time">{{ fmt(item.at) }}<span v-if="item.byName">　{{ item.byName }}</span></div>
          </v-timeline-item>
        </v-timeline>
      </section>

      <!-- 寄信紀錄 -->
      <section class="pd-card">
        <div class="pd-card__head"><v-icon size="15">mdi-email-multiple</v-icon>寄信紀錄<span v-if="emailLogs.length" class="pd-hint">{{ emailLogs.length }}</span></div>
        <div v-if="!emailLogs.length" class="pd-empty">尚未寄過信</div>
        <v-table v-else density="compact" class="pd-table">
          <thead>
            <tr><th>時間</th><th>主旨</th><th>收件</th><th>狀態</th><th>開信</th><th>點擊</th></tr>
          </thead>
          <tbody>
            <tr v-for="(l, i) in emailLogs" :key="i">
              <td class="text-no-wrap">{{ fmt(l.sentAt, 'MM/dd HH:mm') }}</td>
              <td><a href="#" class="text-primary" @click.prevent="emit('open-campaign', l.campaignId)">{{ l.subject }}</a></td>
              <td class="text-caption">{{ l.to || '—' }}</td>
              <td><v-chip size="x-small" variant="flat" :color="l.status === 'sent' ? 'success' : 'error'">{{ l.status === 'sent' ? '成功' : '失敗' }}</v-chip></td>
              <td class="text-caption text-no-wrap">
                <template v-if="l.openedAt"><v-icon size="x-small" color="cyan">mdi-email-open</v-icon> {{ fmt(l.openedAt, 'MM/dd HH:mm') }}<span v-if="(l.openCount || 1) > 1">（{{ l.openCount }}）</span></template>
                <span v-else class="text-grey">—</span>
              </td>
              <td class="text-caption text-no-wrap">
                <template v-if="l.clickedAt"><v-icon size="x-small" color="deep-purple">mdi-cursor-default-click</v-icon> {{ fmt(l.clickedAt, 'MM/dd HH:mm') }}<span v-if="(l.clickCount || 1) > 1">（{{ l.clickCount }}）</span></template>
                <span v-else class="text-grey">—</span>
              </td>
            </tr>
          </tbody>
        </v-table>
      </section>
    </div>

    <ProspectEventDialog v-model="eventDialogOpen" :type="eventType" @submit="submitEvent" />

    <v-dialog v-model="deleteDialog" max-width="420">
      <v-card class="mac-sheet">
        <div class="mac-sheet-head"><v-icon size="18">mdi-alert-circle-outline</v-icon>刪除「{{ prospect.name }}」</div>
        <div class="mac-sheet-section mac-sheet-note">聯絡人、活動與寄信紀錄會一併刪除，無法復原。</div>
        <div class="mac-sheet-foot">
          <div class="mac-spacer" />
          <button type="button" class="mac-btn" @click="deleteDialog = false">取消</button>
          <button type="button" class="mac-btn mac-btn--danger-fill" :disabled="deleting" @click="confirmDelete">刪除</button>
        </div>
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
  /** 上一筆／下一筆：{ index, total, hasPrev, hasNext }；null＝不顯示 */
  nav: { type: Object, default: null },
});
const emit = defineEmits(['updated', 'deleted', 'send-email', 'open-tag-manager', 'navigate', 'open-campaign', 'close', 'prev', 'next']);

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
const editingBasic = ref(false);

function syncForm() {
  const p = props.prospect || {};
  const f = {};
  BASIC_FIELDS.forEach((k) => { f[k] = p[k] ?? (k === 'companyId' ? null : ''); });
  form.value = f;
}
watch(() => props.prospect?.id, () => { syncForm(); editingBasic.value = false; }, { immediate: true });
function cancelBasic() { syncForm(); editingBasic.value = false; }

/** 網址正規化（FB／LINE／官網可直接點開） */
function toUrl(v) {
  const s = String(v || '').trim();
  if (!s) return '';
  if (/^https?:\/\//i.test(s)) return s;
  if (s.startsWith('@')) return `https://line.me/R/ti/p/${encodeURIComponent(s)}`;
  return `https://${s}`;
}
/** 唯讀摘要：只列有填值的欄位；區域／建商／電話已在標頭顯示，不重複 */
const basicSummary = computed(() => {
  const p = props.prospect || {};
  const rows = [];
  const add = (label, value, extra = {}) => { const v = String(value || '').trim(); if (v) rows.push({ label, value: v, ...extra }); };
  const link = (label, value) => add(label, value, { href: toUrl(value), external: true });
  if (p.category === 'project') {
    add('代銷', p.agency);
    add('房地王轉接', p.phoneHousetube, { href: `tel:${p.phoneHousetube}` });
    add('591 轉接', p.phone591, { href: `tel:${p.phone591}` });
    add('接待中心', p.receptionAddress);
    add('基地', p.siteAddress);
  } else {
    add('地址', p.siteAddress);
    if (p.category !== 'resource') add('在售建案', p.projectsText);
  }
  link('FB', p.facebook);
  link('LINE', p.line);
  link('官網', p.website);
  add('IG／其他', p.instagram);
  add('備註', p.note);
  return rows;
});
const followUpQuick = [
  { days: 1, label: '明天' }, { days: 3, label: '+3 天' }, { days: 7, label: '+7 天' }, { days: 14, label: '+14 天' },
];

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
  const ok = await persist(patch, { loadingRef: savingBasic, successMsg: '已儲存' });
  if (ok) editingBasic.value = false;
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
      if (e.type === 'email_clicked') detail = [e.meta?.label || e.text, e.meta?.subject].filter(Boolean).join('｜');
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
/* macOS 檢視器：淡灰底、白色卡片區塊、細邊框 */
.pd {
  --pd-text: #1d1d1f;
  --pd-secondary: #6e6e73;
  --pd-accent: #0071e3;
  --pd-line: rgba(0, 0, 0, 0.08);
  font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", "Helvetica Neue", "PingFang TC", "Noto Sans TC", sans-serif;
  color: var(--pd-text);
  min-height: 100%;
}
.pd-spacer { flex: 1 1 auto; }
.pd-head {
  position: sticky;
  top: 0;
  z-index: 3;
  display: flex;
  align-items: center;
  gap: 6px;
  min-height: 46px;
  padding: 6px 10px;
  background: rgba(246, 246, 248, 0.92);
  -webkit-backdrop-filter: blur(10px);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid var(--pd-line);
}
.pd-navbtn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border: 0;
  border-radius: 7px;
  background: transparent;
  color: var(--pd-secondary);
  cursor: pointer;
}
.pd-navbtn:hover:not(:disabled) { background: rgba(0, 0, 0, 0.06); color: var(--pd-text); }
.pd-navbtn:disabled { opacity: 0.3; cursor: default; }
.pd-navpos { font-size: 12px; color: var(--pd-secondary); font-variant-numeric: tabular-nums; margin-left: 2px; }
.pd-body { padding: 12px 12px 20px; }

.pd-title { display: flex; align-items: center; flex-wrap: wrap; gap: 6px; }
.pd-name { font-size: 17px; font-weight: 700; letter-spacing: -0.01em; margin: 0; line-height: 1.3; }
.pd-pill {
  display: inline-flex;
  align-items: center;
  height: 20px;
  padding: 0 8px;
  border-radius: 10px;
  background: rgba(0, 0, 0, 0.06);
  color: var(--pd-secondary);
  font-size: 11.5px;
  font-weight: 600;
}
.pd-pill--primary { background: rgba(0, 113, 227, 0.12); color: #0a5bb5; }
.pd-pill--teal { background: rgba(0, 137, 123, 0.14); color: #00695c; }
.pd-pill--orange { background: rgba(245, 124, 0, 0.14); color: #b45309; }
.pd-stars { display: inline-flex; margin-left: 2px; }
.pd-meta { display: flex; align-items: center; flex-wrap: wrap; gap: 4px 12px; margin-top: 6px; font-size: 13px; color: var(--pd-secondary); }
.pd-meta > span { display: inline-flex; align-items: center; gap: 4px; }
.pd-meta a { color: var(--pd-accent); text-decoration: none; }
.pd-meta a:hover { text-decoration: underline; }
.pd-meta--dim { font-size: 12px; color: #8e8e93; margin-top: 4px; margin-bottom: 12px; }

.pd-card {
  background: #fff;
  border: 1px solid var(--pd-line);
  border-radius: 10px;
  padding: 10px 12px 12px;
  margin-bottom: 10px;
}
.pd-card__head {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 5px;
  min-height: 30px;
  margin-bottom: 6px;
  font-size: 12.5px;
  font-weight: 600;
  color: var(--pd-secondary);
}
.pd-card__head .v-icon { color: var(--pd-secondary); }
.pd-hint { font-size: 12px; color: #8e8e93; font-weight: 400; }
.pd-empty { font-size: 12.5px; color: #a1a1a6; padding: 2px 0 4px; }
.pd-inline { display: flex; align-items: center; flex-wrap: wrap; gap: 4px; }
.pd-mini {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  height: 24px;
  padding: 0 8px;
  border: 0;
  border-radius: 6px;
  background: rgba(0, 0, 0, 0.05);
  color: var(--pd-text);
  font-size: 12px;
  font-weight: 500;
  white-space: nowrap;
  cursor: pointer;
  transition: background-color 0.12s;
}
.pd-mini .v-icon { color: var(--pd-secondary); }
.pd-mini:hover:not(:disabled) { background: rgba(0, 0, 0, 0.09); }
.pd-mini:disabled { opacity: 0.45; cursor: default; }
.pd-mini--text { background: transparent; color: var(--pd-accent); }
.pd-dot { display: inline-block; width: 9px; height: 9px; border-radius: 50%; margin-right: 6px; }

.pd-dl { display: grid; grid-template-columns: max-content 1fr; gap: 4px 12px; margin: 0; font-size: 13px; }
.pd-dl dt, .pd-dl__label { color: var(--pd-secondary); font-size: 12.5px; white-space: nowrap; }
.pd-dl dd { margin: 0; min-width: 0; overflow-wrap: anywhere; }
.pd-dl a { color: var(--pd-accent); text-decoration: none; }
.pd-dl a:hover { text-decoration: underline; }

.pd-timeline { --v-timeline-line-inset: 0; }
.pd-tl__text { font-size: 13px; }
.pd-tl__detail { color: var(--pd-secondary); }
.pd-tl__time { font-size: 11.5px; color: #8e8e93; }
.pd-table { font-size: 12.5px; }
.pd-table :deep(th) { font-size: 11.5px !important; color: var(--pd-secondary) !important; }
.pd-menu { border-radius: 10px !important; }

.cursor-pointer { cursor: pointer; }
.followup-overdue :deep(input) { color: #D32F2F; font-weight: 600; }
</style>
