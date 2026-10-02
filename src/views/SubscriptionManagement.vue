<template>
  <v-container fluid class="sub-page">
    <v-card class="mx-auto">
      <v-toolbar color="#004383" dark>
        <v-toolbar-title>
          <v-icon left>mdi-calendar-star</v-icon>
          訂閱管理
        </v-toolbar-title>
        <v-spacer></v-spacer>
        <v-btn variant="text" :icon="mobile" @click="settingsDialog = true">
          <v-icon :start="!mobile">mdi-cog-outline</v-icon>
          <span v-if="!mobile">報價單設定</span>
        </v-btn>
        <v-btn color="white" :icon="mobile" @click="openEditDialog()">
          <v-icon :start="!mobile">mdi-plus</v-icon>
          <span v-if="!mobile">新增訂閱</span>
        </v-btn>
      </v-toolbar>

      <!-- 階段卡 -->
      <div class="stage-cards">
        <div
          v-for="card in stageCards"
          :key="card.key"
          class="stage-card"
          :class="{ 'is-active': stageFilter === card.key }"
          @click="stageFilter = card.key"
        >
          <div class="stage-card-label">
            <span v-if="card.color" class="stage-dot" :class="`bg-${card.color}`"></span>{{ card.label }}
          </div>
          <div class="stage-card-count">{{ card.count }}</div>
          <div class="stage-card-sub" :class="{ 'text-red': card.overdue > 0 }">
            {{ card.overdue > 0 ? `逾期 ${card.overdue}` : '' }}
          </div>
        </div>
      </div>

      <v-card-title class="pb-0">
        <v-row dense align="center">
          <v-col cols="12" md="4">
            <v-text-field
              v-model="search"
              label="搜尋建案、系統、買受人或聯絡人..."
              prepend-inner-icon="mdi-magnify"
              variant="outlined"
              density="compact"
              hide-details
              clearable
            ></v-text-field>
          </v-col>
          <v-col cols="6" sm="4" md="3">
            <v-select
              v-model="statusFilter"
              :items="statusFilterOptions"
              label="訂閱狀態"
              variant="outlined"
              density="compact"
              hide-details
              multiple
              clearable
              chips
              closable-chips
            ></v-select>
          </v-col>
          <v-col cols="6" sm="4" md="3">
            <v-select
              v-model="systemFilter"
              :items="masterData.systemFunctions"
              label="系統功能"
              variant="outlined"
              density="compact"
              hide-details
              multiple
              clearable
              chips
              closable-chips
            ></v-select>
          </v-col>
          <v-col cols="12" sm="4" md="2" class="d-flex align-center">
            <span class="text-caption text-grey me-2">共 {{ filteredRows.length }} 筆</span>
            <v-btn
              v-if="hasActiveFilters"
              size="small"
              variant="text"
              color="primary"
              prepend-icon="mdi-filter-off-outline"
              @click="clearFilters"
            >清除篩選</v-btn>
          </v-col>
        </v-row>
      </v-card-title>

      <v-data-table
        :headers="headers"
        :items="filteredRows"
        :sort-by="[{ key: 'stageRank', order: 'asc' }]"
        :loading="loading"
        :items-per-page="25"
        density="comfortable"
        hover
        fixed-header
        class="elevation-1 subscription-table mt-3"
        items-per-page-text="每頁顯示："
        :page-text="`第 {0} - {1} 筆，共 {2} 筆`"
        @click:row="(e, { item }) => openDrawer(item)"
      >
        <template v-slot:item.status="{ item }">
          <v-chip :color="item.color" size="small" label>{{ item.status }}</v-chip>
        </template>

        <template v-slot:item.projectName="{ item }">
          <div class="font-weight-medium">{{ item.projectName }}</div>
          <div v-if="item.billTo?.name" class="text-caption text-grey text-no-wrap">{{ item.billTo.name }}</div>
        </template>

        <template v-slot:item.stageRank="{ item }">
          <div class="d-flex align-center ga-2">
            <v-chip :color="stageMeta(item.pipeline.stage).color" size="small" label variant="flat">
              {{ stageMeta(item.pipeline.stage).label }}
            </v-chip>
            <span v-if="item.cycles.length > 1" class="text-caption text-grey">第{{ item.cycles[item.cycles.length - 1].no }}輪</span>
          </div>
          <div class="progress-bar mt-1" :title="PROGRESS_LABELS.join(' → ')">
            <span
              v-for="(label, i) in PROGRESS_LABELS"
              :key="i"
              :class="{ 'is-on': i < item.pipeline.progress }"
            ></span>
          </div>
        </template>

        <template v-slot:item.nextDate="{ item }">
          <template v-if="item.pipeline.action">
            <div class="text-no-wrap">
              {{ item.pipeline.action }}
              <span v-if="item.pipeline.installment" class="text-caption text-grey">
                {{ item.pipeline.installment.label }} · ${{ (Number(item.pipeline.installment.amount) || 0).toLocaleString() }}
              </span>
            </div>
            <div class="text-caption text-no-wrap" :class="nextHint(item).class">{{ nextHint(item).text }}</div>
          </template>
          <span v-else class="text-caption text-grey">{{ item.pipeline.hint }}</span>
        </template>

        <template v-slot:item.nextFollowUpDate="{ item }">
          <div v-if="item.nextFollowUpDate">
            <div class="text-no-wrap">{{ item.nextFollowUpDate }}</div>
            <div class="text-caption text-no-wrap" :class="followUpHint(item).class">{{ followUpHint(item).text }}</div>
          </div>
          <span v-else class="text-grey">—</span>
        </template>

        <template v-slot:item.currentUserLimit="{ item }">
          <v-chip v-if="item.currentUserLimit" color="primary" size="small" label>
            <v-icon start>mdi-account-group</v-icon>
            {{ item.currentUserLimit }} 人
          </v-chip>
          <span v-else class="text-grey">—</span>
        </template>

        <template v-slot:item.endDate="{ item }">
          <template v-if="item.startDate">
            <div class="text-no-wrap">{{ item.startDate }} ～ {{ item.endDate || '—' }}</div>
            <div v-if="typeof item.durationDays === 'number'" class="text-caption text-grey">共 {{ item.durationDays }} 天</div>
          </template>
          <span v-else class="text-grey">—</span>
        </template>

        <template v-slot:item.contactName="{ item }">
          <div v-if="item.contactName || item.contactPhone">
            <div class="text-no-wrap">{{ item.contactName || '—' }}</div>
            <div class="text-caption text-grey text-no-wrap">{{ item.contactPhone }}</div>
          </div>
          <span v-else class="text-grey">—</span>
        </template>

        <template v-slot:item.earliestAppointmentDate="{ item }">
          <div v-if="item.earliestAppointmentDate">
            <div class="text-no-wrap font-weight-medium">{{ item.earliestAppointmentDate }}</div>
            <div class="text-caption text-grey text-no-wrap">{{ earliestElapsedText(item) }}</div>
            <div v-if="earliestVsDueText(item)" class="text-caption text-blue-grey text-no-wrap">{{ earliestVsDueText(item) }}</div>
          </div>
          <v-progress-circular v-else-if="earliestLoading" size="16" width="2" indeterminate color="grey"></v-progress-circular>
          <span v-else class="text-grey">—</span>
        </template>

        <template v-slot:item.remarks="{ item }">
          <v-tooltip v-if="item.remarks" location="top" max-width="400">
            <template v-slot:activator="{ props }">
              <div v-bind="props" class="remarks-cell">{{ item.remarks }}</div>
            </template>
            <span style="white-space: pre-line;">{{ item.remarks }}</span>
          </v-tooltip>
          <span v-else class="text-grey">—</span>
        </template>

        <template v-slot:item.actions="{ item }">
          <v-icon class="me-2" @click.stop="openEditDialog(item)">mdi-pencil</v-icon>
          <v-icon color="error" @click.stop="openDeleteDialog(item)">mdi-delete</v-icon>
        </template>
        <template v-slot:no-data>
          <div class="pa-4 text-center">
            <p>目前沒有任何訂閱紀錄</p>
          </div>
        </template>
      </v-data-table>
    </v-card>

    <!-- 訂閱資料 -->
    <v-dialog v-model="dialog" persistent max-width="1000px" scrollable>
      <v-card>
        <v-card-title class="bg-blue-darken-4 text-white d-flex align-center">
          <span class="text-h6">{{ isEditing ? '訂閱資料' : '新增訂閱' }}</span>
          <v-spacer></v-spacer>
          <v-btn icon="mdi-close" variant="text" @click="closeDialog"></v-btn>
        </v-card-title>
        <v-card-text>
          <v-row dense class="pt-2">
            <v-col cols="12" sm="6">
              <v-combobox
                v-model="editedItem.projectName"
                :items="masterData.projectNames"
                label="建案名稱*"
                :rules="rules.required"
                variant="outlined"
                density="compact"
              ></v-combobox>
            </v-col>
            <v-col cols="12" sm="6">
              <v-text-field
                v-model="editedItem.projectId"
                label="建案 ID"
                placeholder="啟用時再設定"
                persistent-placeholder
                :rules="!isProjectIdDisabled ? rules.projectId : []"
                :disabled="isProjectIdDisabled"
                variant="outlined"
                density="compact"
              ></v-text-field>
            </v-col>
            <v-col cols="12" sm="6">
              <v-select
                v-model="editedItem.systemFunction"
                :items="masterData.systemFunctions"
                label="系統功能*"
                :rules="rules.requiredArray"
                multiple
                chips
                closable-chips
                :disabled="isEditing"
                variant="outlined"
                density="compact"
              ></v-select>
            </v-col>
            <v-col cols="12" sm="6">
              <v-file-input
                v-model="fileToUpload"
                label="建案圖示"
                accept="image/png, image/jpeg, image/gif"
                prepend-icon=""
                prepend-inner-icon="mdi-image-area"
                variant="outlined"
                density="compact"
                clearable
              >
                <template v-if="iconPreviewUrl" v-slot:append>
                  <v-avatar size="40" rounded><v-img :src="iconPreviewUrl" cover></v-img></v-avatar>
                </template>
              </v-file-input>
            </v-col>

            <v-col cols="12"><div class="form-section">買受人</div></v-col>
            <v-col cols="12" sm="8"><v-text-field v-model="editedItem.billTo.name" label="公司名稱" variant="outlined" density="compact" hide-details></v-text-field></v-col>
            <v-col cols="12" sm="4"><v-text-field v-model="editedItem.billTo.taxId" label="統編" variant="outlined" density="compact" hide-details></v-text-field></v-col>
            <v-col cols="12" sm="4"><v-text-field v-model="editedItem.contactName" label="聯絡人" variant="outlined" density="compact" hide-details></v-text-field></v-col>
            <v-col cols="12" sm="4"><v-text-field v-model="editedItem.contactPhone" label="聯絡人手機" variant="outlined" density="compact" hide-details></v-text-field></v-col>
            <v-col cols="12" sm="4"><v-text-field v-model="editedItem.contactEmail" label="聯絡人Email" :rules="rules.email" variant="outlined" density="compact" hide-details="auto"></v-text-field></v-col>
            <v-col cols="12" sm="4">
              <v-select
                v-model="subscriptionTypeSelection"
                :items="subscriptionTypeOptions"
                label="訂閱類型"
                variant="outlined"
                density="compact"
                hide-details
              ></v-select>
            </v-col>
            <v-col v-if="subscriptionTypeSelection === '其他'" cols="12" sm="4">
              <v-text-field v-model="otherSubscriptionType" label="其他類型" variant="outlined" density="compact" hide-details></v-text-field>
            </v-col>

            <template v-if="isEditing && editedItem.startDate">
              <v-col cols="12"><div class="form-section">訂閱期間</div></v-col>
              <v-col cols="6" sm="4"><v-text-field v-model="editedItem.startDate" label="啟用日期" type="date" variant="outlined" density="compact" hide-details></v-text-field></v-col>
              <v-col cols="6" sm="4"><v-text-field v-model="editedItem.endDate" label="停用日期" type="date" variant="outlined" density="compact" hide-details></v-text-field></v-col>

              <v-col cols="12">
                <div class="form-section d-flex align-center">
                  使用者人數方案
                  <v-spacer></v-spacer>
                  <v-btn size="small" variant="text" color="primary" prepend-icon="mdi-plus" @click="addUserTier">新增方案</v-btn>
                </div>
                <div
                  v-if="!editedItem.userLimitTiers || editedItem.userLimitTiers.length === 0"
                  class="text-center text-grey py-3"
                  style="border: 2px dashed #ccc; border-radius: 8px;"
                >尚未設定</div>
                <div v-for="(tier, index) in editedItem.userLimitTiers" :key="index" class="d-flex flex-wrap ga-2 align-center mb-2">
                  <v-text-field v-model.number="tier.count" label="人數" type="number" variant="outlined" density="compact" hide-details style="max-width: 100px;"></v-text-field>
                  <v-text-field v-model="tier.startDate" label="啟用日期" type="date" variant="outlined" density="compact" hide-details style="max-width: 170px;"></v-text-field>
                  <v-text-field v-model="tier.endDate" label="停用日期" type="date" variant="outlined" density="compact" hide-details style="max-width: 170px;"></v-text-field>
                  <v-chip v-if="tier.cycleId" size="x-small" label>系統啟用</v-chip>
                  <v-btn icon="mdi-delete" color="error" variant="text" size="small" @click="removeUserTier(index)"></v-btn>
                </div>
              </v-col>
            </template>

            <v-col cols="12">
              <div class="form-section">附件</div>
              <AttachmentField
                v-model="editedItem.attachments"
                :path-prefix="`subscriptions/${editedItem.projectId || 'misc'}/attachments`"
                :project-id="editedItem.projectId"
              />
            </v-col>

            <v-col cols="12" class="mt-2">
              <v-textarea v-model="editedItem.remarks" label="備註" rows="2" auto-grow variant="outlined" density="compact" hide-details></v-textarea>
            </v-col>
          </v-row>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="blue-darken-1" variant="text" @click="closeDialog">取消</v-btn>
          <v-btn color="blue-darken-1" variant="flat" @click="save" :loading="saving">{{ isEditing ? '儲存' : '建立並開始報價' }}</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="deleteDialog" persistent max-width="400">
      <v-card>
        <v-card-title class="text-h6 d-flex align-center bg-red-lighten-4">
          <v-icon start color="red-darken-2">mdi-alert-circle-outline</v-icon>
          確認刪除訂閱
        </v-card-title>
        <v-card-text>
          您確定要刪除這筆訂閱紀錄嗎？<br>
          <br>
          <strong>建案:</strong> {{ itemToDelete.projectName }} <br>
          <strong>系統:</strong> {{ itemToDelete.systemFunction }} <br>
          <br>
          此操作無法復原。
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn text @click="closeDeleteDialog">取消</v-btn>
          <v-btn color="error" text @click="confirmDelete" :loading="saving">確認刪除</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <PipelineDrawer
      v-model="drawerOpen"
      :subscription="drawerSub"
      :first-appointment-date="drawerSub ? earliestAppointmentMap[drawerSub.projectId] || '' : ''"
      :settings="quoteSettings"
      :copy-sources="copySources"
      :user="currentUser"
      :admin-key="adminKey"
      :project-id-validator="(id, s) => projectIdError(id, s.projectName, s.id, true)"
      :assign-project-id="assignProjectId"
      @updated="loadData"
      @edit="openEditDialog"
      @settings-saved="quoteSettings = mergeQuoteSettings($event)"
    />

    <QuoteSettingsDialog
      v-model="settingsDialog"
      :settings="quoteSettings"
      :admin-key="adminKey"
      @saved="quoteSettings = mergeQuoteSettings($event)"
    />
  </v-container>
</template>

<script setup>
import { ref, onMounted, computed, nextTick, watch } from 'vue';
import { useDisplay } from 'vuetify';
import { useUserStore } from '@/store/user';
import {
  fetchAllSubscriptions,
  fetchMasterDataForSubscriptionForm,
  fetchEarliestValidAppointmentDates,
  fetchSubscriptionQuoteSettings,
  saveSubscriptionFields,
  addSubscription,
  updateSubscription,
  deleteSubscription,
  uploadSalesImage,
  updateProjectSalesSettings,
} from '@/api.js';
import {
  STAGES, PROGRESS_LABELS, legacyToCycles, currentCycleOf, cycleSummary, createCycle,
  taiwanToday, diffDays,
} from '@/utils/subscriptionPipeline';
import PipelineDrawer from '@/components/subscription/PipelineDrawer.vue';
import QuoteSettingsDialog from '@/components/subscription/QuoteSettingsDialog.vue';
import AttachmentField from '@/components/subscription/AttachmentField.vue';
import { mergeQuoteSettings } from '@/components/subscription/quoteDefaults';

const userStore = useUserStore();
const adminKey = computed(() => userStore.user?.key);
const currentUser = computed(() => ({ key: userStore.user?.key || '', name: userStore.user?.name || '' }));
const { mobile } = useDisplay();

const loading = ref(true);
const saving = ref(false);
const search = ref('');
const subscriptions = ref([]);
const masterData = ref({ projectNames: [], systemFunctions: [] });
const projects = ref([]);
const quoteSettings = ref(mergeQuoteSettings(null));

// --- 篩選 ---
const statusFilter = ref([]);
const systemFilter = ref([]);
const stageFilter = ref('all');
const statusFilterOptions = ['啟用中', '即將到期', '已到期', '尚未啟用', '未啟用'];

const hasActiveFilters = computed(() =>
  statusFilter.value.length > 0 || systemFilter.value.length > 0 || !!search.value || stageFilter.value !== 'all'
);

function clearFilters() {
  statusFilter.value = [];
  systemFilter.value = [];
  stageFilter.value = 'all';
  search.value = '';
}

function stageMeta(key) {
  return STAGES.find(s => s.key === key) || STAGES[0];
}

// --- 最早有效驗屋預約 ---
const earliestLoading = ref(false);
const earliestAppointmentMap = ref({});

const rows = computed(() => subscriptions.value.map(sub => {
  const pipeline = cycleSummary(currentCycleOf(sub.cycles), { firstAppointmentDate: earliestAppointmentMap.value[sub.projectId] || '' });
  return {
    ...sub,
    pipeline,
    stageRank: STAGES.findIndex(s => s.key === pipeline.stage),
    nextDate: pipeline.date,
    earliestAppointmentDate: earliestAppointmentMap.value[sub.projectId] || '',
  };
}));

const baseFilteredRows = computed(() => {
  const keyword = (search.value || '').trim().toLowerCase();
  return rows.value.filter(item => {
    if (keyword) {
      const text = [item.projectName, item.systemFunction, item.contactName, item.contactPhone, item.billTo?.name, item.remarks]
        .filter(Boolean).join(' ').toLowerCase();
      if (!text.includes(keyword)) return false;
    }
    if (statusFilter.value.length > 0) {
      const matched = statusFilter.value.some(f =>
        f === '即將到期' ? (item.status || '').startsWith('即將到期') : item.status === f
      );
      if (!matched) return false;
    }
    if (systemFilter.value.length > 0 && !systemFilter.value.includes(item.systemFunction)) return false;
    return true;
  });
});

const filteredRows = computed(() => (
  stageFilter.value === 'all'
    ? baseFilteredRows.value
    : baseFilteredRows.value.filter(r => r.pipeline.stage === stageFilter.value)
));

const stageCards = computed(() => {
  const list = baseFilteredRows.value;
  return [
    { key: 'all', label: '全部', color: '', count: list.length, overdue: list.filter(r => r.pipeline.overdue).length },
    ...STAGES.map(s => {
      const inStage = list.filter(r => r.pipeline.stage === s.key);
      return { ...s, count: inStage.length, overdue: inStage.filter(r => r.pipeline.overdue).length };
    }),
  ];
});

// --- 排序 ---
function compareDatesEmptyLast(a, b) {
  if (a === b) return 0;
  if (!a) return 1;
  if (!b) return -1;
  return a < b ? -1 : 1;
}

function statusRank(item) {
  const s = item.status || '';
  if (s.startsWith('即將到期')) return 0;
  if (s === '啟用中') return 1;
  if (s === '尚未啟用') return 2;
  if (s === '未啟用') return 3;
  if (s === '已到期') return 4;
  return 5;
}

const headers = [
  { title: '狀態', key: 'status', width: 110, sortRaw: (a, b) => (statusRank(a) - statusRank(b)) || compareDatesEmptyLast(a.endDate, b.endDate) },
  { title: '建案名稱', key: 'projectName', minWidth: 130 },
  { title: '系統功能', key: 'systemFunction', minWidth: 100 },
  { title: '進度', key: 'stageRank', minWidth: 150, sortRaw: (a, b) => (a.stageRank - b.stageRank) || compareDatesEmptyLast(a.nextDate, b.nextDate) },
  { title: '下一步', key: 'nextDate', minWidth: 170, sort: compareDatesEmptyLast },
  { title: '下次跟進', key: 'nextFollowUpDate', minWidth: 110, sort: compareDatesEmptyLast },
  { title: '使用者上限', key: 'currentUserLimit', align: 'center', width: 100 },
  { title: '訂閱期間', key: 'endDate', minWidth: 190, sort: compareDatesEmptyLast },
  { title: '聯絡人', key: 'contactName', minWidth: 110 },
  { title: '最早有效預約', key: 'earliestAppointmentDate', minWidth: 140, sort: compareDatesEmptyLast },
  { title: '備註', key: 'remarks', minWidth: 140 },
  { title: '操作', key: 'actions', sortable: false, align: 'center', width: 100 },
];

function relativeText(dateStr) {
  const d = diffDays(dateStr, taiwanToday());
  if (d === null) return { text: '', class: 'text-grey' };
  if (d < 0) return { text: `逾期 ${-d} 天`, class: 'text-red' };
  if (d === 0) return { text: '今天', class: 'text-red' };
  return { text: `${d} 天後`, class: d <= 30 ? 'text-orange' : 'text-grey' };
}

function nextHint(item) {
  const p = item.pipeline;
  if (p.date) {
    const rel = relativeText(p.date);
    return { text: `${p.hint ? `${p.hint} ` : ''}${p.date} · ${rel.text}`, class: rel.class };
  }
  return { text: p.hint, class: p.overdue ? 'text-red' : 'text-grey' };
}

function followUpHint(item) {
  return relativeText(item.nextFollowUpDate);
}

function earliestElapsedText(item) {
  const diff = diffDays(item.earliestAppointmentDate, taiwanToday());
  if (diff > 0) return `${diff} 天後`;
  if (diff === 0) return '就是今天';
  return `已過 ${-diff} 天`;
}

// 「最早有效預約」與目前款項預計繳款日的差異
function earliestVsDueText(item) {
  const due = item.pipeline.installment?.dueDate;
  if (!due || !item.earliestAppointmentDate) return '';
  const diff = diffDays(due, item.earliestAppointmentDate);
  if (diff === 0) return '與繳款日同日';
  return diff > 0 ? `繳款日晚 ${diff} 天` : `繳款日早 ${-diff} 天`;
}

// --- 抽屜 ---
const drawerOpen = ref(false);
const drawerSubId = ref(null);
const drawerSub = computed(() => rows.value.find(r => r.id === drawerSubId.value) || null);

function openDrawer(item) {
  drawerSubId.value = item.id;
  drawerOpen.value = true;
}

// 報價單「從其他報價複製」來源
const copySources = computed(() => {
  const list = [];
  subscriptions.value.forEach(s => {
    s.cycles.forEach(c => {
      if (c.quote) {
        list.push({ title: `${s.projectName} · ${s.systemFunction} · 第${c.no}輪 · ${c.quote.date}`, quote: c.quote });
      }
    });
  });
  return list.sort((a, b) => (b.quote.date || '').localeCompare(a.quote.date || ''));
});

// --- 資料載入 ---
function userLimitOf(tiers) {
  const today = taiwanToday();
  return (tiers || []).reduce((sum, t) => (
    t.startDate && t.endDate && t.startDate <= today && today <= t.endDate ? sum + (Number(t.count) || 0) : sum
  ), 0);
}

async function loadData() {
  if (!adminKey.value) {
    alert('無法獲取管理者資訊，請重新登入。');
    return;
  }
  if (subscriptions.value.length === 0) loading.value = true;
  try {
    const [subs, mData, settings] = await Promise.all([
      fetchAllSubscriptions(adminKey.value),
      fetchMasterDataForSubscriptionForm(adminKey.value),
      fetchSubscriptionQuoteSettings().catch(() => null),
    ]);

    subscriptions.value = subs.map(sub => {
      const cycles = legacyToCycles(sub);
      const days = sub.startDate && sub.endDate ? (diffDays(sub.endDate, sub.startDate) + 1) : null;
      return {
        ...sub,
        billTo: { name: '', taxId: '', ...(sub.billTo || {}) },
        // 無任何紀錄的訂閱給一個固定 id 的第 1 輪，首次操作時寫入
        cycles: cycles.length ? cycles : [{ ...createCycle(1), id: 'CYC-1' }],
        durationDays: days,
        currentUserLimit: userLimitOf(sub.userLimitTiers),
      };
    });

    projects.value = mData.projects;
    const pendingNames = subs.map(s => s.projectName).filter(Boolean);
    masterData.value = {
      projectNames: [...new Set([...mData.projects.map(p => p.name), ...pendingNames])],
      systemFunctions: mData.systemFunctions,
    };
    quoteSettings.value = mergeQuoteSettings(settings);

    loadEarliestAppointments();
  } catch (error) {
    console.error('載入資料失敗:', error);
    alert('載入資料失敗: ' + error.message);
  } finally {
    loading.value = false;
  }
}

async function loadEarliestAppointments() {
  earliestLoading.value = true;
  try {
    earliestAppointmentMap.value = await fetchEarliestValidAppointmentDates(subscriptions.value.map(s => s.projectId));
  } catch (e) {
    console.warn('載入最早有效預約日失敗:', e);
  } finally {
    earliestLoading.value = false;
  }
}

onMounted(loadData);

// --- 訂閱資料 Dialog ---
const dialog = ref(false);
const deleteDialog = ref(false);
const isEditing = ref(false);
const settingsDialog = ref(false);

const defaultItem = {
  id: null,
  projectName: '',
  projectId: '',
  iconUrl: '',
  systemFunction: [],
  userLimitTiers: [],
  contactName: '',
  contactEmail: '',
  contactPhone: '',
  billTo: { name: '', taxId: '' },
  subscriptionType: '',
  startDate: '',
  endDate: '',
  remarks: '',
  attachments: [],
};
const editedItem = ref({ ...defaultItem });
const itemToDelete = ref({});

const fileToUpload = ref(null);
const newIconPreview = ref(null);
const iconPreviewUrl = computed(() => newIconPreview.value || editedItem.value.iconUrl);

watch(fileToUpload, (newFile) => {
  if (newIconPreview.value) {
    URL.revokeObjectURL(newIconPreview.value);
    newIconPreview.value = null;
  }
  const file = Array.isArray(newFile) ? newFile[0] : newFile;
  if (file) newIconPreview.value = URL.createObjectURL(file);
});

const subscriptionTypeOptions = ['月繳', '年繳', '季繳', '試用', '其他'];
const subscriptionTypeSelection = ref('');
const otherSubscriptionType = ref('');

// 已建立的建案，或尚在報價中 (僅存在於訂閱) 的建案
function knownProjectByName(name) {
  const project = projects.value.find(p => p.name === name);
  if (project) return { id: project.id, iconUrl: project.iconUrl || '' };
  const pending = subscriptions.value.find(s => s.projectName === name && s.projectId);
  return pending ? { id: pending.projectId, iconUrl: pending.projectIconUrl || '' } : null;
}

// 新建案的建案 ID 檢核；未啟用前可留空 (required 用於系統啟用時)
function projectIdError(id, projectName, selfId = null, required = false) {
  if (!id) return required ? '請填寫建案 ID' : '';
  if (!/^[a-zA-Z0-9]+$/.test(id)) return '建案 ID 僅能輸入半形英文及數字。';
  const project = projects.value.find(p => p.id === id);
  if (project && project.name !== projectName) return `此建案 ID 已被「${project.name}」使用。`;
  if (subscriptions.value.some(s => s.id !== selfId && s.projectId === id && s.projectName !== projectName)) {
    return '此建案 ID 已被其他建案使用。';
  }
  return '';
}

// 同建案名稱、尚未啟用且未設定 (或沿用舊暫定) ID 的其他訂閱一起套用
async function assignProjectId(sub, projectId, oldId = '') {
  const siblings = subscriptions.value.filter(s => (
    s.id !== sub.id && s.projectName === sub.projectName && !s.startDate
    && (!s.projectId || (oldId && s.projectId === oldId))
  ));
  await Promise.all(siblings.map(s => saveSubscriptionFields(s.id, { projectId }, adminKey.value)));
}

const rules = {
  required: [value => !!value || '此欄位為必填項。'],
  requiredArray: [value => (value && value.length > 0) || '請至少選擇一個項目。'],
  email: [value => !value || /.+@.+\..+/.test(value) || 'E-mail 格式不正確。'],
  projectId: [v => projectIdError(v, editedItem.value.projectName, editedItem.value.id) || true],
};

// 編輯時：已啟用或建案已建立則鎖定；新增時：既有建案自動帶入並鎖定
const originalProjectId = ref('');
const originalActivated = ref(false);
const isProjectIdDisabled = computed(() => {
  if (isEditing.value) {
    return originalActivated.value || (!!originalProjectId.value && projects.value.some(p => p.id === originalProjectId.value));
  }
  return !!knownProjectByName(editedItem.value.projectName);
});

watch(() => editedItem.value.projectName, (newName) => {
  if (isEditing.value) return;
  const known = knownProjectByName(newName);
  editedItem.value.projectId = known ? known.id : '';
  editedItem.value.iconUrl = known ? known.iconUrl : '';
});

function openEditDialog(item) {
  isEditing.value = !!item;
  fileToUpload.value = null;
  if (newIconPreview.value) {
    URL.revokeObjectURL(newIconPreview.value);
    newIconPreview.value = null;
  }

  if (item) {
    editedItem.value = {
      ...item,
      billTo: { name: '', taxId: '', ...(item.billTo || {}) },
      userLimitTiers: (item.userLimitTiers || []).map(t => ({ ...t })),
      attachments: (item.attachments || []).map(att => ({ ...att })),
    };
    if (typeof editedItem.value.systemFunction === 'string') {
      editedItem.value.systemFunction = [editedItem.value.systemFunction];
    }
    editedItem.value.iconUrl = knownProjectByName(item.projectName)?.iconUrl || item.projectIconUrl || '';
    originalProjectId.value = item.projectId || '';
    originalActivated.value = !!item.startDate;
  } else {
    editedItem.value = { ...defaultItem, billTo: { name: '', taxId: '' }, userLimitTiers: [], attachments: [], systemFunction: [] };
  }

  const currentType = item ? item.subscriptionType : '';
  if (currentType && subscriptionTypeOptions.includes(currentType)) {
    subscriptionTypeSelection.value = currentType;
    otherSubscriptionType.value = '';
  } else if (currentType) {
    subscriptionTypeSelection.value = '其他';
    otherSubscriptionType.value = currentType;
  } else {
    subscriptionTypeSelection.value = '';
    otherSubscriptionType.value = '';
  }
  dialog.value = true;
}

function closeDialog() {
  dialog.value = false;
}

function openDeleteDialog(item) {
  itemToDelete.value = { ...item };
  deleteDialog.value = true;
}

function closeDeleteDialog() {
  deleteDialog.value = false;
  nextTick(() => {
    itemToDelete.value = {};
  });
}

function addUserTier() {
  const today = taiwanToday();
  editedItem.value.userLimitTiers.push({ count: 1, paymentAmount: 0, paymentDate: today, startDate: today, endDate: today });
}

function removeUserTier(index) {
  editedItem.value.userLimitTiers.splice(index, 1);
}

const fileToBase64 = (file) => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.readAsDataURL(file);
  reader.onload = () => resolve(reader.result.split(',')[1]);
  reader.onerror = error => reject(error);
});

// 表格衍生欄位，不寫入 Firestore
const DERIVED_FIELDS = [
  'pipeline', 'stageRank', 'nextDate', 'earliestAppointmentDate', 'nextAgreedDate',
  'status', 'color', 'durationDays', 'currentUserLimit', 'iconUrl', 'cycles',
];

async function save() {
  saving.value = true;
  try {
    if (!editedItem.value.projectName) throw new Error('請填寫建案名稱。');
    const projectId = (editedItem.value.projectId || '').trim();
    editedItem.value.projectId = projectId;
    if (!isProjectIdDisabled.value) {
      const idError = projectIdError(projectId, editedItem.value.projectName, editedItem.value.id);
      if (idError) throw new Error(idError);
    }
    const projectExists = !!projectId && projects.value.some(p => p.id === projectId);

    // 建案圖示：建案已存在 → 更新建案；尚未建立 → 暫存於訂閱，啟用時帶入
    let uploadedIconUrl = null;
    const iconFile = Array.isArray(fileToUpload.value) ? fileToUpload.value[0] : fileToUpload.value;
    if (iconFile) {
      const ext = iconFile.name.split('.').pop();
      const iconPath = projectId ? `projects/${projectId}/icon.${ext}` : `subscriptions/pending/icon_${Date.now()}.${ext}`;
      const { downloadURL } = await uploadSalesImage(iconPath, iconFile.name, await fileToBase64(iconFile), projectId || 'subscription');
      uploadedIconUrl = downloadURL;
    }

    const basePayload = { ...editedItem.value };
    DERIVED_FIELDS.forEach(k => delete basePayload[k]);
    basePayload.attachments = editedItem.value.attachments || [];
    basePayload.billTo = { ...(basePayload.billTo || {}) };
    basePayload.userLimitTiers = (basePayload.userLimitTiers || []).map(tier => ({
      ...tier,
      count: Number(tier.count) || 0,
      paymentAmount: Number(tier.paymentAmount) || 0,
    })).filter(tier => tier.startDate && tier.endDate);
    basePayload.subscriptionType = subscriptionTypeSelection.value === '其他' ? otherSubscriptionType.value : subscriptionTypeSelection.value;
    if (uploadedIconUrl && !projectExists) basePayload.projectIconUrl = uploadedIconUrl;

    let openId = null;
    if (isEditing.value) {
      basePayload.systemFunction = basePayload.systemFunction[0] || '';
      await updateSubscription(basePayload.id, basePayload, adminKey.value);
      if (projectId && projectId !== originalProjectId.value) {
        await assignProjectId(basePayload, projectId, originalProjectId.value);
      }
    } else {
      const systems = basePayload.systemFunction || [];
      if (systems.length === 0) throw new Error('請至少選擇一個系統功能。');
      const duplicate = systems.find(system => subscriptions.value.some(s =>
        ((projectId && s.projectId === projectId) || s.projectName === basePayload.projectName) && s.systemFunction === system
      ));
      if (duplicate) throw new Error(`「${basePayload.projectName}」的「${duplicate}」已有訂閱，續約請在該筆訂閱「開新一輪」。`);

      const stamp = Date.now();
      await Promise.all(systems.map((system, index) => {
        const id = `SUB-${stamp}-${index}`;
        if (index === 0) openId = id;
        return addSubscription(id, {
          ...basePayload,
          systemFunction: system,
          startDate: '',
          endDate: '',
          userLimitTiers: [],
          cycles: [createCycle(1)],
        }, adminKey.value);
      }));
      if (projectId) await assignProjectId({ id: null, projectName: basePayload.projectName }, projectId);
    }

    if (uploadedIconUrl && projectExists) {
      await updateProjectSalesSettings(projectId, { iconUrl: uploadedIconUrl });
    }

    closeDialog();
    await loadData();
    if (openId) openDrawer({ id: openId });
  } catch (error) {
    console.error('儲存失敗:', error);
    alert('儲存失敗: ' + error.message);
  } finally {
    saving.value = false;
  }
}

async function confirmDelete() {
  saving.value = true;
  try {
    await deleteSubscription(itemToDelete.value.id, adminKey.value);
    if (drawerSubId.value === itemToDelete.value.id) drawerOpen.value = false;
    closeDeleteDialog();
    await loadData();
  } catch (error) {
    console.error('刪除失敗:', error);
    alert('刪除失敗: ' + error.message);
  } finally {
    saving.value = false;
  }
}
</script>

<style scoped>
.subscription-table :deep(thead th) {
  white-space: nowrap;
  background-color: #f5f7fa !important;
  font-weight: 600 !important;
}
.subscription-table :deep(tbody td) {
  vertical-align: middle;
  padding-top: 6px !important;
  padding-bottom: 6px !important;
}
.subscription-table :deep(tbody tr) {
  cursor: pointer;
}
.remarks-cell {
  max-width: 220px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* 階段卡 */
.stage-cards {
  display: flex;
  gap: 8px;
  padding: 12px 16px 4px;
  overflow-x: auto;
}
.stage-card {
  flex: 1 0 96px;
  padding: 8px 12px;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  cursor: pointer;
  background: #fff;
  transition: border-color 0.15s, background-color 0.15s;
}
.stage-card:hover {
  border-color: #90a4ae;
}
.stage-card.is-active {
  border-color: #004383;
  background: #eef4fb;
}
.stage-card-label {
  font-size: 12px;
  color: #546e7a;
  display: flex;
  align-items: center;
  white-space: nowrap;
}
.stage-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  margin-right: 6px;
  display: inline-block;
}
.stage-card-count {
  font-size: 22px;
  font-weight: 700;
  line-height: 1.3;
}
.stage-card-sub {
  font-size: 11px;
  min-height: 15px;
}

/* 7 段進度條 */
.progress-bar {
  display: flex;
  gap: 2px;
  width: 112px;
}
.progress-bar span {
  flex: 1;
  height: 5px;
  border-radius: 2px;
  background: #e0e0e0;
}
.progress-bar span.is-on {
  background: #43a047;
}

.form-section {
  font-size: 13px;
  font-weight: 700;
  color: #004383;
  margin-top: 8px;
}

@media (max-width: 959.98px) {
  /* 避開全站左上角漢堡鈕 */
  .sub-page {
    padding-top: 58px;
  }
}
</style>
