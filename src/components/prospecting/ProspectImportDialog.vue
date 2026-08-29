<template>
  <v-dialog :model-value="modelValue" :fullscreen="!mdAndUp" max-width="860" scrollable persistent @update:model-value="onToggle">
    <v-card>
      <v-card-title class="d-flex align-center">
        <v-icon class="mr-2" color="success">mdi-file-excel</v-icon>
        匯入 Excel 名單
        <v-spacer />
        <v-btn icon="mdi-close" variant="text" size="small" :disabled="running" @click="close" />
      </v-card-title>
      <v-divider />

      <v-card-text>
        <!-- Step 1：選檔 -->
        <v-file-input
          v-model="file"
          label="選擇 .xlsx 檔案"
          accept=".xlsx,.xls"
          prepend-icon="mdi-paperclip"
          variant="outlined"
          density="comfortable"
          :disabled="running"
          @update:model-value="onFilePicked"
        />
        <div class="text-caption text-grey mb-3">
          支援工作表：建案清單／建商清單／代銷公司／公會_平台_社群（依名稱自動辨識，辨識不到可手動指定）。
          同類別同名視為同一筆 → 更新；預設只填補空白欄位，不覆蓋已修改的值；狀態／標籤／聯絡人／備註／紀錄一律保留。
        </div>

        <!-- Step 2：工作表對應與預覽 -->
        <template v-if="sheets.length">
          <v-table density="compact" class="mb-3">
            <thead>
              <tr>
                <th>工作表</th>
                <th>資料列</th>
                <th style="width: 180px">匯入為</th>
                <th class="text-right">新增</th>
                <th class="text-right">更新</th>
                <th class="text-right">略過</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="s in sheets" :key="s.name">
                <td class="font-weight-medium">{{ s.name }}</td>
                <td>{{ s.rawRows.length }}</td>
                <td>
                  <v-select
                    v-model="s.category"
                    :items="categoryItems"
                    density="compact"
                    variant="outlined"
                    hide-details
                    :disabled="running"
                    @update:model-value="recompute"
                  />
                </td>
                <td class="text-right text-success">{{ s.category ? s.preview.created : '—' }}</td>
                <td class="text-right text-info">{{ s.category ? s.preview.updated : '—' }}</td>
                <td class="text-right text-grey">{{ s.category ? s.preview.skipped : '—' }}</td>
              </tr>
            </tbody>
          </v-table>

          <v-checkbox
            v-model="overwrite"
            label="更新既有資料時覆蓋已有欄位值（仍不動狀態／標籤／聯絡人／備註／紀錄）"
            density="compact"
            hide-details
            class="mb-2"
            :disabled="running"
          />

          <!-- 前 5 筆對照 -->
          <v-expansion-panels variant="accordion" class="mb-2">
            <v-expansion-panel v-for="s in sheets.filter((x) => x.category)" :key="'pv-' + s.name">
              <v-expansion-panel-title class="text-body-2">{{ s.name }} → {{ categoryTitle(s.category) }}：前 5 筆對照</v-expansion-panel-title>
              <v-expansion-panel-text>
                <v-table density="compact">
                  <thead>
                    <tr><th>名稱</th><th>動作</th><th>主要欄位</th><th>Email</th></tr>
                  </thead>
                  <tbody>
                    <tr v-for="(r, i) in s.mapped.slice(0, 5)" :key="i">
                      <td>{{ r.name }}</td>
                      <td>
                        <v-chip size="x-small" :color="r._action === 'create' ? 'success' : 'info'" variant="flat">{{ r._action === 'create' ? '新增' : '更新' }}</v-chip>
                      </td>
                      <td class="text-caption">{{ summarize(r) }}</td>
                      <td class="text-caption">{{ r._email || '—' }}</td>
                    </tr>
                  </tbody>
                </v-table>
                <div v-if="s.errors.length" class="text-caption text-error mt-2">
                  略過 {{ s.errors.length }} 列：{{ s.errors.slice(0, 5).map((e) => `第${e.row}列 ${e.message}`).join('；') }}{{ s.errors.length > 5 ? '…' : '' }}
                </div>
              </v-expansion-panel-text>
            </v-expansion-panel>
          </v-expansion-panels>
        </template>

        <!-- 結果 -->
        <v-alert v-if="result" :type="result.errors.length ? 'warning' : 'success'" variant="tonal" class="mt-2">
          <div class="font-weight-medium mb-1">匯入完成</div>
          <div v-for="(v, k) in result.summary" :key="k" class="text-body-2">
            {{ categoryTitle(k) }}：新增 {{ v.created }}、更新 {{ v.updated }}、略過 {{ v.skipped }}
          </div>
          <div v-if="result.errors.length" class="text-caption mt-1">略過列：{{ result.errors.map((e) => `${categoryTitle(e.sheet)} 第${e.row}列 ${e.message}`).join('；') }}</div>
        </v-alert>
        <v-progress-linear v-if="running" indeterminate color="primary" class="mt-3" />
      </v-card-text>

      <v-divider />
      <v-card-actions>
        <v-spacer />
        <v-btn variant="text" :disabled="running" @click="close">{{ result ? '關閉' : '取消' }}</v-btn>
        <v-btn
          v-if="!result"
          color="primary"
          variant="flat"
          prepend-icon="mdi-database-import"
          :disabled="!canRun"
          :loading="running"
          @click="run"
        >開始匯入（{{ totalToImport }} 筆）</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useDisplay } from 'vuetify';
import * as XLSX from 'xlsx';
import { useUserStore } from '@/store/user';
import { useUiStore } from '@/store/uiStore';
import {
  PROSPECT_CATEGORY_OPTIONS,
  detectSheetCategory,
  mapSheetRows,
  runProspectImport,
  saveProspectImport,
  nameKey,
  genId,
} from '@/services/prospectService';

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  /** 目前所有 prospects（比對新增／更新用） */
  existing: { type: Array, default: () => [] },
});
const emit = defineEmits(['update:modelValue', 'imported']);

const { mdAndUp } = useDisplay();
const userStore = useUserStore();
const uiStore = useUiStore();

const file = ref(null);
const sheets = ref([]); // { name, rawRows, category, mapped, errors, preview }
const overwrite = ref(false);
const running = ref(false);
const result = ref(null);

const categoryItems = [
  { title: '（略過）', value: null },
  ...PROSPECT_CATEGORY_OPTIONS.map((c) => ({ title: c.title, value: c.value })),
];
const categoryTitle = (v) => PROSPECT_CATEGORY_OPTIONS.find((c) => c.value === v)?.title || v || '—';

const existingKeys = computed(() => {
  const set = new Set();
  props.existing.forEach((p) => set.add(`${p.category}|${p.nameKey || nameKey(p.name)}`));
  return set;
});

function summarize(r) {
  const parts = [];
  if (r.region) parts.push(r.region);
  if (r.builder) parts.push(r.builder);
  if (r.phone) parts.push(r.phone);
  if (r.facebook) parts.push('FB');
  if (r.line) parts.push('LINE');
  return parts.join('｜') || '—';
}

async function onFilePicked(f) {
  result.value = null;
  sheets.value = [];
  const picked = Array.isArray(f) ? f[0] : f;
  if (!picked) return;
  try {
    const buf = await picked.arrayBuffer();
    const wb = XLSX.read(buf, { type: 'array' });
    sheets.value = wb.SheetNames.map((name) => {
      const ws = wb.Sheets[name];
      const rawRows = XLSX.utils.sheet_to_json(ws, { defval: '' });
      return { name, rawRows, category: detectSheetCategory(name), mapped: [], errors: [], preview: { created: 0, updated: 0, skipped: 0 } };
    }).filter((s) => s.rawRows.length > 0);
    recompute();
  } catch (e) {
    console.error(e);
    uiStore.showSnackbar(`讀取 Excel 失敗：${e.message || e}`, 'error');
  }
}

function recompute() {
  const seenInFile = new Set();
  sheets.value.forEach((s) => {
    if (!s.category) { s.mapped = []; s.errors = []; s.preview = { created: 0, updated: 0, skipped: 0 }; return; }
    const { rows, errors } = mapSheetRows(s.category, s.rawRows);
    let created = 0; let updated = 0;
    rows.forEach((r) => {
      const key = `${s.category}|${nameKey(r.name)}`;
      if (existingKeys.value.has(key) || seenInFile.has(key)) { r._action = 'update'; updated += 1; } else { r._action = 'create'; created += 1; }
      seenInFile.add(key);
    });
    s.mapped = rows;
    s.errors = errors;
    s.preview = { created, updated, skipped: errors.length };
  });
}

const totalToImport = computed(() => sheets.value.filter((s) => s.category).reduce((n, s) => n + s.mapped.length, 0));
const canRun = computed(() => totalToImport.value > 0 && !running.value);

async function run() {
  if (!canRun.value) return;
  running.value = true;
  const batchId = genId('imp_');
  try {
    const payload = sheets.value.filter((s) => s.category).map((s) => ({ category: s.category, rows: s.mapped, errors: s.errors }));
    const res = await runProspectImport(payload, props.existing, {
      overwrite: overwrite.value,
      batchId,
      operator: { key: userStore.user?.key || '', name: userStore.user?.name || '' },
    });
    result.value = res;
    try {
      await saveProspectImport({
        id: batchId,
        fileName: file.value?.name || (Array.isArray(file.value) ? file.value[0]?.name : '') || '',
        sheetSummary: res.summary,
        errors: res.errors,
        overwrite: overwrite.value,
        createdBy: userStore.user?.key || '',
        createdByName: userStore.user?.name || '',
      });
    } catch (e) {
      console.warn('寫入匯入紀錄失敗', e);
    }
    const total = Object.values(res.summary).reduce((n, v) => n + v.created + v.updated, 0);
    uiStore.showSnackbar(`匯入完成，共處理 ${total} 筆`, 'success');
    emit('imported', res);
  } catch (e) {
    console.error(e);
    uiStore.showSnackbar(`匯入失敗：${e.message || e}`, 'error');
  } finally {
    running.value = false;
  }
}

function reset() {
  file.value = null;
  sheets.value = [];
  overwrite.value = false;
  result.value = null;
}
function close() {
  if (running.value) return;
  reset();
  emit('update:modelValue', false);
}
function onToggle(v) {
  if (!v) close();
}
</script>
