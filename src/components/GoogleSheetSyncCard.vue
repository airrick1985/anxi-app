<template>
  <div class="gsc">
    <div v-if="isLoading" class="mac-form-group mac-form-pad gsc-muted">讀取中…</div>

    <!-- 已綁定：顯示工作表、自動同步開關、上次同步＋立即同步 -->
    <template v-else-if="isBound && !editing">
      <div class="mac-form-group">
        <div class="mac-form-row">
          <v-icon size="22" class="gsc-sheet-icon">mdi-google-spreadsheet</v-icon>
          <div class="mac-form-row-main">
            <div class="mac-form-row-title gsc-wrap">{{ binding.title || 'Google 試算表' }}</div>
            <div class="gsc-sub">工作表：{{ binding.tab }}</div>
          </div>
          <a class="mac-btn mac-btn--sm" :href="sheetUrl" target="_blank" rel="noopener">開啟</a>
          <button type="button" class="mac-btn mac-btn--sm" @click="startEdit">變更</button>
        </div>
        <label class="mac-form-row gsc-click">
          <span class="mac-form-row-main">自動同步</span>
          <input type="checkbox" class="mac-switch" :checked="binding.auto" :disabled="isSavingAuto" @change="toggleAuto($event.target.checked)">
        </label>
        <div class="mac-form-row">
          <span class="mac-form-row-main">上次同步</span>
          <span class="gsc-muted">{{ lastSyncText }}</span>
        </div>
        <div v-if="binding.lastError" class="mac-form-pad">
          <div class="mac-callout mac-callout--error"><v-icon size="16">mdi-alert-circle</v-icon><span>{{ binding.lastError }}</span></div>
        </div>
      </div>
      <div class="gsc-actions">
        <span v-if="resultText" class="gsc-ok"><v-icon size="15">mdi-check-circle</v-icon>{{ resultText }}</span>
        <span class="mac-spacer"></span>
        <button type="button" class="mac-btn mac-btn--primary" :disabled="isSyncing" @click="syncNow">
          <v-progress-circular v-if="isSyncing" indeterminate size="14" width="2"></v-progress-circular>
          <v-icon v-else size="16">mdi-sync</v-icon>立即同步
        </button>
      </div>
    </template>

    <!-- 設定：貼網址 → 讀取 → 選工作表 → 綁定並同步 -->
    <template v-else>
      <div class="mac-form-group">
        <div class="mac-form-pad">
          <div class="mac-sheet-label">試算表網址</div>
          <div class="gsc-url">
            <input
              v-model.trim="form.url"
              class="mac-form-input"
              type="url"
              placeholder="https://docs.google.com/spreadsheets/d/…"
              @keydown.enter.prevent="loadSheets"
            >
            <button type="button" class="mac-btn" :disabled="!form.url || isReading" @click="loadSheets">
              <v-progress-circular v-if="isReading" indeterminate size="14" width="2"></v-progress-circular>讀取
            </button>
          </div>
        </div>
        <template v-if="form.sheetNames.length">
          <div v-if="form.title" class="mac-form-row">
            <span class="mac-form-row-label">試算表</span>
            <span class="mac-form-row-main gsc-wrap">{{ form.title }}</span>
          </div>
          <div class="mac-form-row">
            <span class="mac-form-row-label">工作表</span>
            <select v-model="form.tab" class="mac-form-input mac-form-select gsc-select">
              <option value="" disabled>選擇工作表</option>
              <option v-for="name in form.sheetNames" :key="name" :value="name">{{ name }}</option>
            </select>
          </div>
          <label class="mac-form-row gsc-click">
            <span class="mac-form-row-main">自動同步</span>
            <input v-model="form.auto" type="checkbox" class="mac-switch">
          </label>
        </template>
      </div>

      <div v-if="readError" class="mac-callout mac-callout--error gsc-gap"><v-icon size="16">mdi-alert-circle</v-icon><span>{{ readError }}</span></div>
      <div v-if="agentEmail" class="mac-callout gsc-gap">
        <v-icon size="16">mdi-share-variant</v-icon>
        <span class="gsc-share">
          以「編輯者」共用給 <b class="gsc-email">{{ agentEmail }}</b>
          <button type="button" class="mac-link-btn" @click="copyEmail">{{ copied ? '已複製' : '複製' }}</button>
        </span>
      </div>
      <div v-if="form.tab" class="mac-callout mac-callout--warning gsc-gap">
        <v-icon size="16">mdi-alert</v-icon><span>同步會覆蓋「{{ form.tab }}」的所有內容</span>
      </div>

      <div class="gsc-actions">
        <button v-if="isBound" type="button" class="mac-btn" @click="editing = false">取消</button>
        <span class="mac-spacer"></span>
        <button type="button" class="mac-btn mac-btn--primary" :disabled="!form.tab || isSyncing" @click="bindAndSync">
          <v-progress-circular v-if="isSyncing" indeterminate size="14" width="2"></v-progress-circular>
          <v-icon v-else size="16">mdi-link-variant</v-icon>綁定並同步
        </button>
      </div>
      <div v-if="syncError" class="mac-callout mac-callout--error gsc-gap"><v-icon size="16">mdi-alert-circle</v-icon><span>{{ syncError }}</span></div>
    </template>

    <div v-if="isBound && !editing && syncError" class="mac-callout mac-callout--error gsc-gap"><v-icon size="16">mdi-alert-circle</v-icon><span>{{ syncError }}</span></div>
  </div>
</template>

<script setup>
// Google Sheet 同步卡片（客資資料／聯絡名單共用）
// 綁定存在 projects/{projectId}：{prefix}SheetId / TabName / Title / AutoSync / LastSyncAt / LastError
// 未綁定時以舊版欄位（記住的網址、上次同步的工作表）預填設定
// 「立即同步」與自動同步都由後端同一支全量函式寫入，內容一致、不受畫面篩選影響
import { ref, reactive, computed, watch } from 'vue';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { format } from 'date-fns';
import { db } from '@/firebase';
import { listGoogleSheets, syncBoundSheetNow } from '@/api';

const props = defineProps({
  projectId: { type: String, required: true },
  target: { type: String, required: true, validator: v => ['customers', 'leads'].includes(v) },
});

const FIELDS = {
  customers: {
    id: 'customerSheetId', tab: 'customerSheetTabName', title: 'customerSheetTitle', auto: 'customerSheetAutoSync',
    last: 'customerSheetLastSyncAt', error: 'customerSheetLastError', legacyUrl: 'customerExportSheetUrl',
    legacyId: 'customerExportSheetId', legacyTab: 'customerExportSheetTabName',
  },
  leads: {
    id: 'leadsSheetId', tab: 'leadsSheetTabName', title: 'leadsSheetTitle', auto: 'leadsSheetAutoSync',
    last: 'leadsSheetLastSyncAt', error: 'leadsSheetLastError', legacyUrl: 'googleSheetUrl',
    legacyId: 'leadsExportSheetId', legacyTab: 'leadsExportSheetTabName',
  },
};
const f = computed(() => FIELDS[props.target]);

const isLoading = ref(true);
const binding = reactive({ id: '', tab: '', title: '', auto: true, lastSyncAt: null, lastError: '' });
const legacy = reactive({ url: '', tab: '' }); // 舊版「記住網址／上次手動同步」用來預填設定
const isBound = computed(() => !!(binding.id && binding.tab));
const sheetUrl = computed(() => `https://docs.google.com/spreadsheets/d/${binding.id}/edit`);

const editing = ref(false);
const form = reactive({ url: '', spreadsheetId: '', title: '', sheetNames: [], tab: '', auto: true });
const isReading = ref(false);
const readError = ref('');
const agentEmail = ref('');
const copied = ref(false);

const isSyncing = ref(false);
const isSavingAuto = ref(false);
const syncError = ref('');
const resultText = ref('');

const parseSpreadsheetId = (input) => {
  const m = String(input || '').match(/\/d\/([a-zA-Z0-9-_]+)/);
  return m ? m[1] : String(input || '').trim();
};

const toDate = (ts) => (ts?.toDate ? ts.toDate() : (ts ? new Date(ts) : null));
const lastSyncText = computed(() => {
  const d = toDate(binding.lastSyncAt);
  return d && !isNaN(d.getTime()) ? format(d, 'yyyy/MM/dd HH:mm') : '尚未同步';
});

async function loadBinding() {
  if (!props.projectId) return;
  isLoading.value = true;
  try {
    const snap = await getDoc(doc(db, 'projects', props.projectId));
    const data = snap.exists() ? snap.data() : {};
    const k = f.value;
    binding.id = data[k.id] || '';
    binding.tab = data[k.tab] || '';
    binding.title = data[k.title] || '';
    binding.auto = data[k.auto] !== false;
    binding.lastSyncAt = data[k.last] || null;
    binding.lastError = data[k.error] || '';
    legacy.url = data[k.legacyUrl] || data[k.legacyId] || '';
    legacy.tab = data[k.legacyTab] || '';
  } catch (e) {
    console.error('讀取同步設定失敗:', e);
  } finally {
    isLoading.value = false;
    if (!isBound.value) resetForm();
  }
}

function resetForm() {
  form.url = isBound.value ? sheetUrl.value : legacy.url;
  form.spreadsheetId = '';
  form.title = '';
  form.sheetNames = [];
  form.tab = '';
  form.auto = isBound.value ? binding.auto : true;
  readError.value = '';
  syncError.value = '';
  resultText.value = '';
}

function startEdit() {
  resetForm();
  editing.value = true;
}

async function loadSheets() {
  if (!form.url || isReading.value) return;
  isReading.value = true;
  readError.value = '';
  form.sheetNames = [];
  form.tab = '';
  try {
    const res = await listGoogleSheets(form.url);
    form.spreadsheetId = res.spreadsheetId || parseSpreadsheetId(form.url);
    form.title = res.title || '';
    form.sheetNames = res.sheetNames || [];
    agentEmail.value = res.agentEmail || agentEmail.value;
    // 預選原本綁定或上次同步的工作表（同一份試算表且仍存在）
    const prevTab = form.spreadsheetId === binding.id ? binding.tab : legacy.tab;
    if (form.sheetNames.includes(prevTab)) form.tab = prevTab;
    else if (form.sheetNames.length === 1) form.tab = form.sheetNames[0];
  } catch (e) {
    readError.value = e.message || '讀取失敗';
    if (e.details?.agentEmail) agentEmail.value = e.details.agentEmail;
  } finally {
    isReading.value = false;
  }
}

async function runSync() {
  isSyncing.value = true;
  syncError.value = '';
  resultText.value = '';
  try {
    const res = await syncBoundSheetNow(props.projectId, props.target);
    resultText.value = `已同步 ${res?.count ?? 0} 筆`;
  } catch (e) {
    syncError.value = e.message || '同步失敗';
  } finally {
    isSyncing.value = false;
    await loadBinding();
  }
}

async function syncNow() {
  if (isSyncing.value) return;
  await runSync();
}

async function bindAndSync() {
  if (!form.tab || isSyncing.value) return;
  const k = f.value;
  const spreadsheetId = form.spreadsheetId || parseSpreadsheetId(form.url);
  isSyncing.value = true;
  syncError.value = '';
  try {
    await updateDoc(doc(db, 'projects', props.projectId), {
      [k.id]: spreadsheetId,
      [k.tab]: form.tab,
      [k.title]: form.title || '',
      [k.auto]: !!form.auto,
      // 舊版「記住網址／上次同步的工作表」一併更新，與綁定保持一致
      [k.legacyUrl]: form.url,
      [k.legacyId]: spreadsheetId,
      [k.legacyTab]: form.tab,
    });
  } catch (e) {
    syncError.value = '儲存設定失敗：' + (e.message || e);
    isSyncing.value = false;
    return;
  }
  binding.id = spreadsheetId;
  binding.tab = form.tab;
  binding.title = form.title || '';
  binding.auto = !!form.auto;
  editing.value = false;
  await runSync();
}

async function toggleAuto(val) {
  isSavingAuto.value = true;
  const prev = binding.auto;
  binding.auto = val;
  try {
    await updateDoc(doc(db, 'projects', props.projectId), { [f.value.auto]: val });
  } catch (e) {
    binding.auto = prev;
    syncError.value = '儲存失敗：' + (e.message || e);
  } finally {
    isSavingAuto.value = false;
  }
}

async function copyEmail() {
  try {
    await navigator.clipboard.writeText(agentEmail.value);
    copied.value = true;
    setTimeout(() => { copied.value = false; }, 1500);
  } catch (e) { /* 不支援剪貼簿時使用者可手動選取 */ }
}

watch(() => [props.projectId, props.target], () => {
  editing.value = false;
  loadBinding();
}, { immediate: true });
</script>

<style scoped>
.gsc { font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", "Helvetica Neue", "PingFang TC", "Noto Sans TC", sans-serif; color: #1d1d1f; }
.gsc-sheet-icon { color: #0f9d58; flex-shrink: 0; }
.gsc-wrap { overflow-wrap: anywhere; }
.gsc-sub { font-size: 12px; color: #6e6e73; overflow-wrap: anywhere; }
.gsc-muted { font-size: 13px; color: #6e6e73; }
.gsc-click { cursor: pointer; }
.gsc-url { display: flex; gap: 8px; }
.gsc-url .mac-form-input { height: 30px; }
.gsc-select { max-width: none !important; height: 30px; }
.gsc-gap { margin-top: 10px; }
.gsc-share { overflow-wrap: anywhere; }
.gsc-email { font-weight: 600; user-select: all; }
.gsc-actions { display: flex; align-items: center; flex-wrap: wrap; gap: 8px; margin-top: 12px; }
.gsc-actions .mac-spacer { flex: 1 1 auto; }
.gsc-ok { display: inline-flex; align-items: center; gap: 4px; font-size: 12.5px; color: #248a3d; }
.gsc-ok .v-icon { color: #34c759; }
@media (max-width: 600px) {
  .gsc-url .mac-form-input, .gsc-select { height: 38px; font-size: 16px; }
  .gsc-actions .mac-spacer { display: none; }
  .gsc-actions .mac-btn--primary { flex: 1 1 auto; height: 38px; }
}
</style>
