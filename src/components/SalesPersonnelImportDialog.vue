<template>
  <v-dialog :model-value="modelValue" max-width="1100" scrollable :persistent="importing" @update:model-value="v => $emit('update:modelValue', v)">
    <v-card>
      <v-card-title class="d-flex align-center">
        <v-icon start>mdi-file-excel-outline</v-icon>匯入 Excel 更新銷售人員
        <v-spacer></v-spacer>
        <v-btn icon="mdi-close" variant="text" :disabled="importing" @click="close"></v-btn>
      </v-card-title>
      <v-divider></v-divider>

      <v-card-text>
        <v-alert type="info" variant="tonal" density="compact" class="mb-3">
          請使用「匯出 Excel」產生的格式編輯後上傳。以「人員ID」或「電話」比對：相符者更新、不相符者新增；Excel 內沒有的人員不會被刪除。
          寫入前會先顯示預覽，確認後才更新資料。
        </v-alert>

        <v-file-input
          v-model="file"
          label="選擇 Excel 檔案（.xlsx / .xls）"
          accept=".xlsx,.xls"
          variant="outlined" density="comfortable"
          prepend-icon="" prepend-inner-icon="mdi-tray-arrow-up"
          :loading="parsing" :disabled="importing" hide-details class="mb-3"
          @update:model-value="parseFile"
        ></v-file-input>

        <v-alert v-if="parseError" type="error" variant="tonal" density="compact" class="mb-3">{{ parseError }}</v-alert>

        <template v-if="plan">
          <div class="d-flex flex-wrap ga-2 mb-3 align-center">
            <v-chip color="success" variant="tonal" size="small">新增 {{ plan.summary.new }}</v-chip>
            <v-chip color="primary" variant="tonal" size="small">更新 {{ plan.summary.update }}</v-chip>
            <v-chip variant="tonal" size="small">無變更 {{ plan.summary.same }}</v-chip>
            <v-chip color="error" variant="tonal" size="small">錯誤 {{ plan.summary.error }}</v-chip>
            <v-spacer></v-spacer>
            <v-switch v-model="hideSame" label="隱藏無變更" density="compact" hide-details color="primary"></v-switch>
          </div>

          <div class="table-scroll">
            <v-table density="compact">
              <thead>
                <tr>
                  <th style="width:56px">列</th>
                  <th style="width:90px">結果</th>
                  <th>姓名</th>
                  <th>電話</th>
                  <th>職位</th>
                  <th>變更內容 / 錯誤</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="it in visibleItems" :key="it.row.line" :class="{ 'row-error': it.status === 'error' }">
                  <td class="text-caption text-medium-emphasis">{{ it.row.line }}</td>
                  <td>
                    <v-chip size="x-small" :color="statusColor(it.status)" variant="tonal">{{ statusText(it.status) }}</v-chip>
                    <v-chip v-if="it.done === 'ok'" size="x-small" color="success" class="ml-1">✓</v-chip>
                    <v-chip v-else-if="it.done === 'fail'" size="x-small" color="error" class="ml-1">✕</v-chip>
                  </td>
                  <td>{{ it.row.name || '—' }}</td>
                  <td>{{ it.row.phone || '—' }}</td>
                  <td>{{ (it.payload?.positions || it.row.positions || []).join('、') }}</td>
                  <td class="text-caption">
                    <template v-if="it.status === 'error'"><span class="text-error">{{ it.errors.join('；') }}</span></template>
                    <template v-else-if="it.status === 'new'">新增人員<span v-if="it.payload?.bonusConfig">（含請佣獎金設定）</span></template>
                    <template v-else-if="it.status === 'update'">
                      <div v-for="(c, i) in it.changes" :key="i">{{ c }}</div>
                    </template>
                    <template v-else>—</template>
                    <div v-if="it.failMessage" class="text-error">{{ it.failMessage }}</div>
                  </td>
                </tr>
              </tbody>
            </v-table>
          </div>
          <v-alert v-if="plan.summary.error" type="warning" variant="tonal" density="compact" class="mt-3">
            有 {{ plan.summary.error }} 列錯誤，這些列會被略過，其餘列仍可匯入。
          </v-alert>
        </template>
      </v-card-text>

      <v-divider></v-divider>
      <v-card-actions>
        <span v-if="importing" class="text-caption text-medium-emphasis ml-2">寫入中 {{ progress.done }} / {{ progress.total }}</span>
        <v-spacer></v-spacer>
        <v-btn variant="text" :disabled="importing" @click="close">{{ finished ? '關閉' : '取消' }}</v-btn>
        <v-btn color="primary" variant="flat" prepend-icon="mdi-database-import-outline"
          :loading="importing" :disabled="!writableCount || finished" @click="runImport">
          確認匯入（{{ writableCount }} 筆）
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import { useToast } from 'vue-toastification';
import * as XLSX from 'xlsx-js-style';
import { serverTimestamp } from 'firebase/firestore';
import { setSalesPersonnel } from '@/api';
import { parsePersonnelSheet, diffPersonnelRows } from '@/utils/salesPersonnelExcel';

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  projectId: { type: String, required: true },
  personnel: { type: Array, default: () => [] },
  teamGroups: { type: Array, default: () => [] },
});
const emit = defineEmits(['update:modelValue', 'imported']);
const toast = useToast();

const file = ref(null);
const parsing = ref(false);
const parseError = ref('');
const plan = ref(null);
const hideSame = ref(true);
const importing = ref(false);
const finished = ref(false);
const progress = ref({ done: 0, total: 0 });

watch(() => props.modelValue, (v) => { if (v) reset(); });

function reset() {
  file.value = null; parseError.value = ''; plan.value = null;
  importing.value = false; finished.value = false; progress.value = { done: 0, total: 0 };
}
function close() { emit('update:modelValue', false); }

const visibleItems = computed(() => (plan.value?.items || []).filter(i => !hideSame.value || i.status !== 'same'));
const writableCount = computed(() => (plan.value?.items || []).filter(i => i.status === 'new' || i.status === 'update').length);

function statusColor(s) { return { new: 'success', update: 'primary', same: 'default', error: 'error' }[s]; }
function statusText(s) { return { new: '新增', update: '更新', same: '無變更', error: '錯誤' }[s]; }

async function parseFile(f) {
  const target = Array.isArray(f) ? f[0] : f;
  plan.value = null; parseError.value = ''; finished.value = false;
  if (!target) return;
  parsing.value = true;
  try {
    const buf = await target.arrayBuffer();
    const wb = XLSX.read(buf, { type: 'array', cellDates: true });
    const ws = wb.Sheets['銷售人員'] || wb.Sheets[wb.SheetNames[0]];
    const rows = parsePersonnelSheet(ws);
    if (!rows.length) throw new Error('檔案中沒有任何人員資料列。');
    plan.value = diffPersonnelRows(rows, props.personnel, props.teamGroups || [], props.projectId);
  } catch (e) {
    console.error('[SalesPersonnelImportDialog] 解析失敗:', e);
    parseError.value = `解析失敗：${e.message}`;
  } finally {
    parsing.value = false;
  }
}

async function runImport() {
  const targets = (plan.value?.items || []).filter(i => i.status === 'new' || i.status === 'update');
  if (!targets.length) return;
  importing.value = true;
  progress.value = { done: 0, total: targets.length };
  let ok = 0, fail = 0;
  for (const it of targets) {
    try {
      const payload = { ...it.payload };
      if (it.status === 'new') payload.createdAt = serverTimestamp();
      await setSalesPersonnel(it.docId, payload);
      it.done = 'ok'; ok++;
    } catch (e) {
      it.done = 'fail'; it.failMessage = e.message || '寫入失敗'; fail++;
    }
    progress.value.done++;
  }
  importing.value = false;
  finished.value = true;
  if (fail) toast.warning(`匯入完成：成功 ${ok} 筆，失敗 ${fail} 筆`);
  else toast.success(`已匯入 ${ok} 筆人員資料`);
  emit('imported', { ok, fail });
}
</script>

<style scoped>
.table-scroll { overflow-x: auto; max-height: 55vh; }
.row-error td { background: rgba(244, 67, 54, 0.06); }
</style>
