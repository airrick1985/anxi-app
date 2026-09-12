<template>
  <v-dialog
    :model-value="modelValue"
    max-width="960"
    :fullscreen="smAndDown"
    scrollable
    :persistent="importing"
    @update:model-value="v => $emit('update:modelValue', v)"
  >
    <v-card class="import-card">
      <v-toolbar color="primary" density="comfortable">
        <v-icon class="ml-4">mdi-account-multiple-plus-outline</v-icon>
        <v-toolbar-title class="text-subtitle-1 font-weight-bold">從其他建案引入人員</v-toolbar-title>
        <v-spacer></v-spacer>
        <v-btn icon="mdi-close" :disabled="importing" @click="close"></v-btn>
      </v-toolbar>

      <div class="px-4 pt-4 pb-2 bg-grey-lighten-5">
        <div class="text-body-2 text-grey-darken-1 mb-3">
          列出您有「銷控系統」權限之其他建案的銷售人員，勾選後即可引入為本建案的新人員（姓名／電話／Email／職位）。
          以「電話」判斷是否重複：本案已有相同電話的人員會標示且無法再次引入。
        </div>
        <v-row dense>
          <v-col cols="12" sm="5">
            <v-autocomplete
              :disabled="loading || importing"
              v-model="projectFilter"
              :items="projectOptions"
              item-title="name"
              item-value="id"
              label="篩選建案"
              placeholder="全部建案"
              variant="outlined"
              density="compact"
              hide-details
              clearable
              prepend-inner-icon="mdi-office-building-outline"
            ></v-autocomplete>
          </v-col>
          <v-col cols="12" sm="7">
            <v-text-field
              v-model="search"
              :disabled="loading || importing"
              label="搜尋姓名／電話／Email／職位"
              variant="outlined"
              density="compact"
              hide-details
              clearable
              prepend-inner-icon="mdi-magnify"
            ></v-text-field>
          </v-col>
        </v-row>
        <div class="d-flex flex-wrap align-center mt-2" style="gap: 8px 16px">
          <v-checkbox
            v-model="hideExisting"
            :disabled="importing"
            label="隱藏本案已有相同電話的人員"
            density="compact"
            hide-details
            color="primary"
          ></v-checkbox>
          <v-checkbox
            v-model="withBonus"
            :disabled="importing"
            label="一併帶入請佣獎金扣款比例（保留款／稅金／二代健保／備註）"
            density="compact"
            hide-details
            color="primary"
          ></v-checkbox>
        </div>
      </div>

      <v-card-text class="pa-0" style="min-height: 0">
        <div v-if="loading" class="pa-4">
          <v-skeleton-loader type="list-item-two-line@5"></v-skeleton-loader>
        </div>

        <v-alert v-else-if="error" type="error" variant="tonal" density="compact" class="ma-4">
          {{ error }}
          <v-btn variant="text" size="small" @click="load">重新載入</v-btn>
        </v-alert>

        <v-alert
          v-else-if="candidates.length === 0"
          type="info"
          variant="tonal"
          density="compact"
          icon="mdi-information-outline"
          class="ma-4"
        >
          您有銷控權限的其他建案目前沒有任何銷售人員可供引入。
        </v-alert>

        <v-alert
          v-else-if="filteredCandidates.length === 0"
          type="info"
          variant="tonal"
          density="compact"
          icon="mdi-filter-remove-outline"
          class="ma-4"
        >
          沒有符合篩選條件的人員。
        </v-alert>

        <div v-else class="table-scroll">
          <v-table density="compact" hover fixed-header height="45vh">
            <thead>
              <tr>
                <th style="width: 48px">
                  <v-checkbox-btn
                    aria-label="全選本頁可引入人員"
                    title="全選本頁可引入人員"
                    :model-value="allSelectableSelected"
                    :indeterminate="someSelectableSelected && !allSelectableSelected"
                    :disabled="importing || !selectableFiltered.length"
                    density="compact"
                    @update:model-value="toggleAll"
                  ></v-checkbox-btn>
                </th>
                <th>姓名</th>
                <th>電話</th>
                <th>職位</th>
                <th>來源建案</th>
                <th style="width: 190px">狀態</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="c in pagedCandidates"
                :key="c.id"
                :class="{ 'row-disabled': !!blockReason(c), 'row-selected': selectedIds.has(c.id) }"
                @click="toggleRow(c)"
              >
                <td @click.stop>
                  <v-checkbox-btn
                    :aria-label="`選取${c.name}`"
                    :model-value="selectedIds.has(c.id)"
                    :disabled="importing || !!blockReason(c)"
                    density="compact"
                    @update:model-value="v => setSelected(c, v)"
                  ></v-checkbox-btn>
                </td>
                <td class="font-weight-medium">{{ c.name || '—' }}</td>
                <td>{{ c.phone || '—' }}<div class="text-caption text-medium-emphasis">{{ c.email }}</div></td>
                <td>{{ (c.positions || []).join('、') || '—' }}</td>
                <td>
                  <v-chip size="x-small" color="orange" variant="tonal">{{ projectNameOf(c) }}</v-chip>
                </td>
                <td>
                  <v-chip
                    v-if="c.done === 'ok'"
                    size="x-small"
                    color="success"
                    variant="flat"
                    prepend-icon="mdi-check"
                  >已引入</v-chip>
                  <v-chip
                    v-else-if="c.done === 'fail'"
                    size="x-small"
                    color="error"
                    variant="flat"
                    prepend-icon="mdi-close"
                  >{{ c.failMessage || '寫入失敗' }}</v-chip>
                  <v-chip
                    v-else-if="existingByPhone(c)"
                    size="x-small"
                    color="warning"
                    variant="tonal"
                    prepend-icon="mdi-phone-alert-outline"
                  >本案已有相同電話：{{ existingByPhone(c).name }}</v-chip>
                  <v-chip
                    v-else-if="!normPhone(c.phone)"
                    size="x-small"
                    color="grey"
                    variant="tonal"
                    prepend-icon="mdi-phone-off-outline"
                  >無電話，無法引入</v-chip>
                  <v-chip
                    v-else-if="duplicateSelectedPhone(c)"
                    size="x-small"
                    color="warning"
                    variant="tonal"
                    prepend-icon="mdi-content-duplicate"
                  >已勾選相同電話的人員</v-chip>
                  <span v-else class="text-caption text-success">可引入</span>
                </td>
              </tr>
            </tbody>
          </v-table>
        </div>
      </v-card-text>

      <div v-if="!loading && !error && filteredCandidates.length" class="import-pagination px-4 py-2">
        <span class="text-caption">每頁 50 人 · 全選僅勾選本頁</span>
        <v-pagination v-model="page" :length="pageCount" :total-visible="3" density="compact" size="small" :disabled="importing" />
      </div>
      <div v-if="selectedIds.size" class="px-4 pb-2 text-body-2 text-primary" aria-live="polite">
        已選 {{ selectedIds.size }} 人<span v-if="hiddenSelectedCount">（其中 {{ hiddenSelectedCount }} 人不在本頁）</span>
        <v-btn variant="text" size="small" :disabled="importing" @click="selectedIds = new Set()">清除選取</v-btn>
      </div>
      <v-divider></v-divider>
      <v-card-actions class="px-4 import-actions">
        <span class="text-caption text-grey">
          <template v-if="importing">寫入中 {{ progress.done }} / {{ progress.total }}</template>
          <template v-else>
            顯示 {{ filteredCandidates.length }} 人，來自 {{ projectOptions.length }} 個建案
            <span v-if="existingCount"> ・ {{ existingCount }} 人本案已有相同電話</span>
          </template>
        </span>
        <v-spacer></v-spacer>
        <v-btn variant="text" :disabled="importing" @click="close">{{ finished ? '關閉' : '取消' }}</v-btn>
        <v-btn
          color="primary"
          variant="flat"
          prepend-icon="mdi-account-multiple-plus-outline"
          :loading="importing"
          :disabled="loading || !selectedIds.size"
          @click="runImport"
        >
          引入選取人員（{{ selectedIds.size }} 人）
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import { useDisplay } from 'vuetify';
import { useToast } from 'vue-toastification';
import { serverTimestamp } from 'firebase/firestore';
import { listImportableSalesPersonnel, setSalesPersonnel } from '@/api';
import { normPhone } from '@/utils/salesPersonnelExcel';
import { useUserStore } from '@/store/user';
import { useProjectStore } from '@/store/projectStore';

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  projectId: { type: String, required: true },
  /** 本案目前的人員清單（父層 listener 即時資料），用於電話重複比對 */
  personnel: { type: Array, default: () => [] },
});
const emit = defineEmits(['update:modelValue', 'imported']);

const toast = useToast();
const { smAndDown } = useDisplay();
const userStore = useUserStore();
const projectStore = useProjectStore();

const loading = ref(false);
const error = ref('');
const candidates = ref([]);
const projects = ref([]);
const projectFilter = ref(null);
const search = ref('');
const page = ref(1);
const pageSize = 50;
const hideExisting = ref(false);
const withBonus = ref(true);
const selectedIds = ref(new Set());
const importing = ref(false);
const finished = ref(false);
const progress = ref({ done: 0, total: 0 });

watch(() => props.modelValue, (v) => { if (v) open(); }, { immediate: true });

async function open() {
  page.value = 1;
  projectFilter.value = null;
  search.value = '';
  selectedIds.value = new Set();
  importing.value = false;
  finished.value = false;
  progress.value = { done: 0, total: 0 };
  await load();
}

function close() {
  if (importing.value) return;
  emit('update:modelValue', false);
}

async function load() {
  candidates.value = [];
  projects.value = [];
  const userKey = userStore.user?.key;
  if (!userKey) {
    error.value = '無法取得登入資訊，請重新登入後再試';
    return;
  }
  loading.value = true;
  error.value = '';
  try {
    // 後端以 userPermissions 為準，僅回傳使用者具「銷控系統」權限之其他建案的人員
    const res = await listImportableSalesPersonnel({ userKey, currentProjectId: props.projectId });
    candidates.value = (Array.isArray(res?.personnel) ? res.personnel : []).map(p => ({ ...p, done: null, failMessage: '' }));
    projects.value = Array.isArray(res?.projects) ? res.projects : [];
  } catch (e) {
    console.error('[SalesPersonnelCrossProjectImportDialog] 載入失敗:', e);
    error.value = '載入其他建案人員失敗，請稍後再試';
    candidates.value = [];
    projects.value = [];
  } finally {
    loading.value = false;
  }
}

// --- 名稱／篩選 ---
const idToNameMap = computed(() => projectStore.idToNameMap || {});
const projectNameOf = (c) => idToNameMap.value[c.projectId] || c.projectName || c.projectId;

const projectOptions = computed(() =>
  projects.value
    .map(p => ({ id: p.id, name: idToNameMap.value[p.id] || p.name || p.id }))
    .sort((a, b) => a.name.localeCompare(b.name, 'zh-Hant-TW'))
);

/** 本案現有人員：電話（正規化）→ 人員 */
const existingPhoneMap = computed(() => {
  const m = new Map();
  (props.personnel || []).forEach(p => {
    const k = normPhone(p.phone);
    if (k && !m.has(k)) m.set(k, p);
  });
  return m;
});
const existingByPhone = (c) => existingPhoneMap.value.get(normPhone(c.phone)) || null;
const existingCount = computed(() => candidates.value.filter(c => existingByPhone(c)).length);

const filteredCandidates = computed(() => {
  const kw = String(search.value || '').trim().toLowerCase();
  const kwPhone = normPhone(kw);
  return candidates.value.filter(c => {
    if (projectFilter.value && c.projectId !== projectFilter.value) return false;
    if (hideExisting.value && existingByPhone(c) && c.done !== 'ok') return false;
    if (!kw) return true;
    return String(c.name || '').toLowerCase().includes(kw)
      || (kwPhone && normPhone(c.phone).includes(kwPhone))
      || String(c.email || '').toLowerCase().includes(kw)
      || (c.positions || []).some(pos => String(pos).toLowerCase().includes(kw))
      || projectNameOf(c).toLowerCase().includes(kw);
  });
});

const pageCount = computed(() => Math.max(1, Math.ceil(filteredCandidates.value.length / pageSize)));
const pagedCandidates = computed(() => filteredCandidates.value.slice((page.value - 1) * pageSize, page.value * pageSize));
const hiddenSelectedCount = computed(() => selectedIds.value.size - pagedCandidates.value.filter(c => selectedIds.value.has(c.id)).length);
watch([search, projectFilter, hideExisting], () => { page.value = 1; });
watch(pageCount, count => { page.value = Math.min(page.value, count); });

// --- 勾選 ---
const selectedCandidates = computed(() => candidates.value.filter(c => selectedIds.value.has(c.id)));

/** 已勾選其他候選人且電話相同（同一人出現在多個建案時，只允許引入一筆） */
function duplicateSelectedPhone(c) {
  const k = normPhone(c.phone);
  if (!k || selectedIds.value.has(c.id)) return false;
  return selectedCandidates.value.some(s => normPhone(s.phone) === k);
}

/** 不可勾選的原因；null 表示可引入 */
function blockReason(c) {
  if (c.done === 'ok') return '已引入';
  if (!normPhone(c.phone)) return '無電話';
  const ex = existingByPhone(c);
  if (ex) return `本案已有相同電話的人員「${ex.name}」，無法再次引入`;
  if (duplicateSelectedPhone(c)) return '已勾選相同電話的人員';
  return null;
}

const selectableFiltered = computed(() => pagedCandidates.value.filter(c => !blockReason(c) || selectedIds.value.has(c.id)));
const allSelectableSelected = computed(() =>
  selectableFiltered.value.length > 0 && selectableFiltered.value.every(c => selectedIds.value.has(c.id))
);
const someSelectableSelected = computed(() => selectableFiltered.value.some(c => selectedIds.value.has(c.id)));

function setSelected(c, v) {
  if (importing.value) return;
  const next = new Set(selectedIds.value);
  if (v) {
    const reason = blockReason(c);
    if (reason) { toast.warning(reason); return; }
    next.add(c.id);
  } else {
    next.delete(c.id);
  }
  selectedIds.value = next;
}

function toggleRow(c) {
  if (importing.value) return;
  if (selectedIds.value.has(c.id)) { setSelected(c, false); return; }
  const reason = blockReason(c);
  if (reason) { toast.warning(reason); return; }
  setSelected(c, true);
}

function toggleAll(v) {
  if (importing.value) return;
  const next = new Set(selectedIds.value);
  if (v) {
    // 逐一加入，同電話只保留第一筆
    const seen = new Set(selectedCandidates.value.map(s => normPhone(s.phone)));
    pagedCandidates.value.forEach(c => {
      const k = normPhone(c.phone);
      if (!k || c.done === 'ok' || existingByPhone(c) || seen.has(k)) return;
      seen.add(k);
      next.add(c.id);
    });
  } else {
    pagedCandidates.value.forEach(c => next.delete(c.id));
  }
  selectedIds.value = next;
}

// --- 引入 ---
function buildPayload(c, order) {
  const payload = {
    projectId: props.projectId,
    name: String(c.name || '').trim(),
    phone: normPhone(c.phone),
    email: String(c.email || '').trim(),
    positions: Array.isArray(c.positions) && c.positions.length ? [...c.positions] : ['銷售'],
    order,
    createdAt: serverTimestamp(),
  };
  // 團獎分組與進場／結案時間為各建案獨立設定，不跨案帶入；僅帶入扣款比例與備註
  if (withBonus.value && c.bonusConfig) {
    payload.bonusConfig = {
      keepPct: Number(c.bonusConfig.keepPct) || 0,
      taxPct: Number(c.bonusConfig.taxPct) || 0,
      nhiPct: Number(c.bonusConfig.nhiPct) || 0,
      teamGroupKeys: [],
      inDate: '',
      outDate: '',
      remark: String(c.bonusConfig.remark || ''),
    };
  }
  return payload;
}

async function runImport() {
  if (importing.value) return;
  const targets = selectedCandidates.value;
  if (!targets.length) return;

  // 寫入前再次以「電話」比對本案即時清單，避免視窗開啟期間他人已新增相同電話
  const blocked = targets.filter(c => existingByPhone(c) || !normPhone(c.phone));
  if (blocked.length) {
    toast.error(`有 ${blocked.length} 位人員的電話已存在於本案或無電話，請取消勾選後再引入：${blocked.map(c => c.name).join('、')}`);
    return;
  }

  importing.value = true;
  progress.value = { done: 0, total: targets.length };
  let order = (props.personnel || []).reduce((m, p) => Math.max(m, Number(p.order) || 0), 0);
  const ids = [];
  let ok = 0, fail = 0;
  for (const c of targets) {
    try {
      order += 10;
      const payload = buildPayload(c, order);
      if (!payload.name) throw new Error('缺少姓名');
      const docId = `${props.projectId}_${payload.name}_${payload.phone}`;
      await setSalesPersonnel(docId, payload);
      ids.push(docId);
      c.done = 'ok'; ok++;
    } catch (e) {
      c.done = 'fail'; c.failMessage = e.message || '寫入失敗'; fail++;
    }
    progress.value.done++;
  }
  importing.value = false;
  finished.value = true;
  selectedIds.value = new Set();
  if (fail) toast.warning(`引入完成：成功 ${ok} 人，失敗 ${fail} 人`);
  else toast.success(`已引入 ${ok} 位人員`);
  emit('imported', { ok, fail, ids });
}
</script>

<style scoped>
.table-scroll { overflow-x: auto; }
.import-pagination { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 8px; }
.import-actions { flex-wrap: wrap; gap: 8px; }
.import-card > :not(.v-card-text) { flex-shrink: 0; }
.table-scroll th { white-space: nowrap; }
.table-scroll td { min-width: 100px; }
.table-scroll td:first-child { min-width: 48px; }
.table-scroll tbody tr { cursor: pointer; }
.row-disabled td { color: rgba(0, 0, 0, 0.45); }
.row-disabled { cursor: not-allowed !important; }
.row-selected td { background: rgba(var(--v-theme-primary), 0.06); }
</style>
