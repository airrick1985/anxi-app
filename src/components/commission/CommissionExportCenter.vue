<template>
  <div>
    <v-alert type="info" variant="tonal" density="compact" class="mb-3">請佣、獎金可各自選擇方案分檔或合併。「合併同一 Sheet」依方案分區；獎金表另可選「合併列」，將一般與配套戶別接續編號、合計獎金（不同請佣比例分頁），使用目前所選版型；目前方案使用下方所選版型，其他方案沿用自己的設定與預設版型。個人明細仍依目前方案匯出。</v-alert>
    <div v-if="loading" class="text-center py-10">
      <v-progress-circular indeterminate color="primary"></v-progress-circular>
    </div>

    <template v-if="!loading">
      <!-- 設定列 -->
      <v-card variant="outlined" class="mb-3">
        <v-card-text class="pb-2">
          <v-row dense align="center">
            <v-col cols="12" sm="auto">
              <v-btn-toggle v-model="docType" mandatory color="primary" variant="outlined" divided density="comfortable">
                <v-btn value="claim" size="small">請佣總表</v-btn>
                <v-btn value="bonus" size="small">獎金表</v-btn>
                <v-btn value="person" size="small" prepend-icon="mdi-account-cash-outline">個人明細</v-btn>
              </v-btn-toggle>
            </v-col>

            <v-col v-if="!isPerson" cols="12" sm="4">
              <v-select v-model="groupingMode" :items="groupingOptions" :label="docType === 'claim' ? '請佣匯出方式' : '獎金匯出方式'"
                variant="outlined" density="compact" hide-details />
            </v-col>
            <v-col v-if="!isPerson && groupingMode !== 'current'" cols="12">
              <v-select v-model="selectedPlanIds" :items="plans" item-title="name" item-value="id" label="包含方案（以相同期別合併）"
                multiple chips variant="outlined" density="compact" hide-details />
              <div class="text-caption mt-1">此瀏覽器會分別記住本建案的請佣與獎金匯出方式。未選方案或本期無資料的方案不會匯出。</div>
              <v-progress-linear v-if="groupingLoading" indeterminate color="primary" class="mt-2" />
              <v-alert v-if="groupingError" type="error" density="compact" class="mt-2">{{ groupingError }}</v-alert>
            </v-col>

            <!-- 期別：總表/獎金表單期；個人明細可多期 -->
            <v-col v-if="!isPerson" cols="6" sm="3" md="2">
              <v-select v-model="period" :items="availablePeriods" label="期別" variant="outlined" density="compact" hide-details>
                <template #selection="{ item }">第 {{ item.value }} 期</template>
                <template #item="{ item, props: p }"><v-list-item v-bind="p" :title="`第 ${item.value} 期`"></v-list-item></template>
              </v-select>
            </v-col>
            <v-col v-else cols="12" sm="4" md="3">
              <v-select v-model="periods" :items="availablePeriods" label="期別（可多選）" variant="outlined" density="compact" hide-details
                multiple chips closable-chips>
                <template #chip="{ item, props: p }"><v-chip v-bind="p" size="small">第 {{ item.value }} 期</v-chip></template>
                <template #item="{ item, props: p }"><v-list-item v-bind="p" :title="`第 ${item.value} 期`"></v-list-item></template>
              </v-select>
            </v-col>

            <template v-if="!isPerson">
              <v-col cols="6" sm="4" md="3">
                <v-select v-model="selectedConfigId" :items="configOptions" item-title="name" item-value="id"
                  label="欄位版型" variant="outlined" density="compact" hide-details></v-select>
              </v-col>
              <v-col cols="12" sm="auto" class="d-flex ga-1 flex-wrap">
                <v-btn size="small" variant="tonal" prepend-icon="mdi-pencil" @click="editTemplate">
                  {{ selectedConfigId === '__default' ? '以此為底新增版型' : '編輯版型' }}
                </v-btn>
                <v-menu>
                  <template #activator="{ props: p }">
                    <v-btn v-bind="p" size="small" variant="tonal" prepend-icon="mdi-dots-vertical">更多</v-btn>
                  </template>
                  <v-list density="compact">
                    <v-list-item prepend-icon="mdi-import" title="套用全域範本…" @click="openGlobalPicker"></v-list-item>
                    <v-list-item v-if="isAdmin" prepend-icon="mdi-folder-cog-outline" title="全域範本管理頁" @click="goTemplateManager"></v-list-item>
                    <v-list-item v-if="isAdmin && selectedConfigId !== '__default'" prepend-icon="mdi-export" title="另存為全域範本" @click="saveAsGlobal"></v-list-item>
                    <v-list-item v-if="selectedConfigId !== '__default'" prepend-icon="mdi-star-outline" title="設為預設版型" @click="setAsDefault"></v-list-item>
                    <v-list-item v-if="selectedConfigId !== '__default'" prepend-icon="mdi-delete-outline" title="刪除此版型" class="text-error" @click="deleteConfig"></v-list-item>
                  </v-list>
                </v-menu>
              </v-col>
            </template>

            <!-- 個人明細：人員選擇 -->
            <template v-else>
              <v-col cols="12" sm="5" md="4">
                <v-select v-model="selectedPersonKeys" :items="personOptions" item-title="title" item-value="value"
                  label="人員（可多選，批次產出）" variant="outlined" density="compact" hide-details multiple chips closable-chips
                  :no-data-text="periods.length ? '所選期別沒有獎金紀錄' : '請先選擇期別'">
                  <template #chip="{ item, props: p }"><v-chip v-bind="p" size="small">{{ item.raw.name }}</v-chip></template>
                  <template #item="{ item, props: p }">
                    <v-list-item v-bind="p" :title="item.raw.title" :subtitle="item.raw.subtitle"></v-list-item>
                  </template>
                  <template #prepend-item>
                    <v-list-item density="compact" @click="toggleAllPersons">
                      <template #prepend>
                        <v-checkbox-btn :model-value="allPersonsSelected" :indeterminate="somePersonsSelected && !allPersonsSelected" density="compact"></v-checkbox-btn>
                      </template>
                      <v-list-item-title>全選（{{ personOptions.length }} 人）</v-list-item-title>
                    </v-list-item>
                    <v-divider></v-divider>
                  </template>
                </v-select>
              </v-col>
            </template>

            <v-spacer></v-spacer>
            <v-col cols="12" sm="4" md="3">
              <v-text-field v-model="fileName" :label="isPerson && personModels.length > 1 ? '批次檔名（ZIP，免副檔名）' : '下載檔名（免副檔名）'"
                variant="outlined" density="compact" hide-details prepend-inner-icon="mdi-file-document-outline"></v-text-field>
            </v-col>
            <v-col cols="12" sm="auto" class="d-flex ga-2">
              <v-btn color="success" variant="flat" prepend-icon="mdi-microsoft-excel" :disabled="!grids.length" @click="downloadExcel">Excel</v-btn>
              <v-btn color="error" variant="flat" prepend-icon="mdi-file-pdf-box" :loading="pdfLoading" :disabled="!grids.length" @click="downloadPdf">PDF</v-btn>
              <v-btn v-if="isPerson" color="primary" variant="flat" prepend-icon="mdi-email-fast-outline" :disabled="!grids.length" @click="openEmail">寄送 Email</v-btn>
            </v-col>
          </v-row>

          <!-- 個人明細：PDF 加密設定 -->
          <v-row v-if="isPerson" dense align="center" class="mt-1">
            <v-col cols="12" sm="4" md="3">
              <v-select v-model="encryptMode" :items="encryptOptions" label="PDF 加密" variant="outlined" density="compact" hide-details
                prepend-inner-icon="mdi-lock-outline"></v-select>
            </v-col>
            <v-col v-if="encryptMode === 'custom'" cols="12" sm="4" md="3">
              <v-text-field v-model="customPassword" label="自訂密碼（所有人員相同）" variant="outlined" density="compact" hide-details
                :type="showPassword ? 'text' : 'password'" :append-inner-icon="showPassword ? 'mdi-eye-off' : 'mdi-eye'"
                @click:append-inner="showPassword = !showPassword"></v-text-field>
            </v-col>
            <v-col cols="12" sm="auto">
              <span class="text-caption text-medium-emphasis">
                <template v-if="encryptMode === 'userKey'">每份 PDF 以該人員的 USERKEY（電話）作為開啟密碼。</template>
                <template v-else-if="encryptMode === 'custom'">所有 PDF 使用同一組密碼；寄信時不會將密碼寫入信件內容。</template>
                <template v-else>PDF 不加密。Excel 檔一律不加密。</template>
              </span>
            </v-col>
          </v-row>
        </v-card-text>
      </v-card>

      <v-alert v-if="!activeRecords.length" type="info" variant="tonal" class="mb-3">
        <template v-if="isPerson">所選期別沒有有效（未作廢）的請佣紀錄。</template>
        <template v-else>目前沒有可預覽的請佣紀錄；可先設定本方案的版型。</template>
      </v-alert>
      <v-alert v-else-if="isPerson && !selectedPersonKeys.length" type="info" variant="tonal" class="mb-3">
        請選擇要產出明細的人員（可多選；選多人時 Excel／PDF 會打包成 ZIP，每人一檔）。
      </v-alert>

      <!-- 預覽 -->
      <CommissionGridPreview v-else :grids="grids" caption="與下載之 Excel / PDF 同一版面模型" :unit-label="isPerson ? '人' : '張分頁'"
        :sortable="docType === 'bonus'" @reorder="onReorderPersons"
        :unit-sortable="!isPerson && groupingMode === 'current'" @reorder-units="onReorderUnits"
        :editable="!isPerson" :edit-values="editValues" @edit="onTextEdit">
        <template #actions>
          <template v-if="hasTextEdits">
            <v-btn size="x-small" variant="text" class="ml-2" @click="revertTextEdits">還原</v-btn>
            <v-btn size="x-small" variant="flat" color="primary" :loading="savingText" @click="saveTextEdits">儲存文字</v-btn>
          </template>
        </template>
      </CommissionGridPreview>
    </template>

    <!-- 版型編輯 -->
    <CommissionTemplateEditor
      v-model="editorOpen"
      :doc-type="docType"
      :editing="editorTarget"
      :settings="exportSettings"
      @save="saveConfig"
    />

    <!-- 全域範本選擇 -->
    <v-dialog v-model="globalPickerOpen" max-width="480">
      <v-card>
        <v-card-title class="text-subtitle-1">套用全域範本（{{ docType === 'claim' ? '請佣總表' : '獎金表' }}）</v-card-title>
        <v-card-text>
          <div v-if="globalLoading" class="text-center py-4"><v-progress-circular indeterminate size="28"></v-progress-circular></div>
          <v-list v-else density="compact">
            <v-list-item v-for="t in globalTemplatesOfType" :key="t.id" :title="t.name" :subtitle="t.description || ''"
              @click="applyGlobal(t)">
              <template #append><v-icon color="primary">mdi-import</v-icon></template>
            </v-list-item>
          </v-list>
          <v-alert v-if="!globalLoading && !globalTemplatesOfType.length" type="info" variant="tonal" density="compact">
            尚無全域範本。超管/系管可於「請佣獎金版型範本管理」建立，或在此用「另存為全域範本」上傳。
          </v-alert>
        </v-card-text>
        <v-card-actions><v-spacer></v-spacer><v-btn variant="text" @click="globalPickerOpen = false">關閉</v-btn></v-card-actions>
      </v-card>
    </v-dialog>

    <!-- 個人明細 Email 寄送 -->
    <v-dialog v-model="emailOpen" max-width="760" :persistent="emailSending">
      <v-card>
        <v-card-title class="text-subtitle-1 d-flex align-center">
          <v-icon start>mdi-email-fast-outline</v-icon>寄送個人獎金明細（第 {{ periodsText }} 期）
          <v-spacer></v-spacer>
          <v-chip size="small" variant="tonal" :color="encryptMode === 'none' ? 'default' : 'warning'" prepend-icon="mdi-lock-outline">
            {{ encryptLabel }}
          </v-chip>
        </v-card-title>
        <v-card-text>
          <v-text-field v-model="emailSubject" label="主旨" variant="outlined" density="compact" class="mb-2"></v-text-field>
          <v-textarea v-model="emailBody" label="信件內容（{姓名} 會替換為各收件人姓名）" variant="outlined" density="compact" rows="6" auto-grow class="mb-2"></v-textarea>

          <div class="text-subtitle-2 mb-1">收件人（{{ emailRecipients.length }} 人）</div>
          <v-table density="compact" class="recipient-table">
            <thead>
              <tr><th style="width:120px">姓名</th><th>Email</th><th style="width:150px">狀態</th></tr>
            </thead>
            <tbody>
              <tr v-for="r in emailRecipients" :key="r.personKey">
                <td>{{ r.name }}<div class="text-caption text-medium-emphasis">{{ r.personKey }}</div></td>
                <td>
                  <v-text-field v-model="r.email" variant="underlined" density="compact" hide-details placeholder="請輸入 Email"
                    :disabled="emailSending || r.status === 'sent'" :error="r.email !== '' && !isValidEmail(r.email)"></v-text-field>
                </td>
                <td>
                  <v-chip v-if="r.status === 'sent'" size="small" color="success" variant="tonal">已寄出</v-chip>
                  <v-chip v-else-if="r.status === 'sending'" size="small" color="primary" variant="tonal"><v-progress-circular indeterminate size="12" width="2" class="mr-1"></v-progress-circular>寄送中</v-chip>
                  <v-tooltip v-else-if="r.status === 'error'" :text="r.error" location="top">
                    <template #activator="{ props: p }"><v-chip v-bind="p" size="small" color="error" variant="tonal">失敗</v-chip></template>
                  </v-tooltip>
                  <v-chip v-else-if="!isValidEmail(r.email)" size="small" color="warning" variant="tonal">缺 Email，將略過</v-chip>
                  <span v-else class="text-caption text-medium-emphasis">待寄送</span>
                </td>
              </tr>
            </tbody>
          </v-table>
          <v-alert v-if="encryptMode === 'custom'" type="info" variant="tonal" density="compact" class="mt-3">
            自訂密碼不會寫入信件，請另行告知收件人。
          </v-alert>
        </v-card-text>
        <v-card-actions>
          <span class="text-caption text-medium-emphasis ml-2">此處修改的 Email 只用於本次寄送，不會回寫人員名冊。</span>
          <v-spacer></v-spacer>
          <v-btn variant="text" :disabled="emailSending" @click="emailOpen = false">{{ emailDone ? '關閉' : '取消' }}</v-btn>
          <v-btn color="primary" variant="flat" prepend-icon="mdi-send" :loading="emailSending" :disabled="!sendableCount || emailDone" @click="sendEmails">
            寄送（{{ sendableCount }} 人）
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup>
import { combineCommissionGrids } from '@/utils/commissionExportGrouping';
import { planIdOf } from '@/utils/commissionPlans';
import { mergeSettings } from '@/utils/commissionCalculation';
import { useCommissionPlan } from '@/composables/useCommissionPlan';
const { plan, planId, belongsToPlan } = useCommissionPlan();
import { ref, computed, watch, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useToast } from 'vue-toastification';
import JSZip from 'jszip';
import { useUserStore } from '@/store/user';
import CommissionTemplateEditor from './CommissionTemplateEditor.vue';
import CommissionGridPreview from './CommissionGridPreview.vue';
import {
  fetchCommissionSettings, fetchCommissionExportConfigs, setCommissionExportConfig, deleteCommissionExportConfig,
  fetchCommissionExportTemplates, setCommissionExportTemplate, fetchRetentionPayouts,
  generateCommissionPdfAPI, sendCommissionPersonEmailAPI, setCommissionPersonOrder, setCommissionSettings, setCommissionUnitOrder,
} from '@/api';
import {
  buildClaimModel, buildBonusModel, buildMergedBonusModel, buildPersonModel,
  defaultClaimConfig, defaultBonusConfig, defaultPersonConfig,
  periodsLabel, listPersonsInPeriods, withProjectName, exportProjectNameOf,
} from '@/utils/commissionExportModel';
import {
  buildClaimGrid, buildBonusGrids, buildPersonGrid, buildPersonExcelGrids,
  exportGridsToExcel, gridsToExcelBlob,
} from '@/services/commissionExcelService';
import { toNum, fillPattern } from '@/utils/commissionCalculation';

const props = defineProps({
  projectId: { type: String, required: true },
  projectName: { type: String, default: '' },
  settings: { type: Object, required: true },
  records: { type: Array, default: () => [] },
  bonusRecords: { type: Array, default: () => [] },
  personnel: { type: Array, default: () => [] },
  loading: { type: Boolean, default: false },
  bonusSourceRecords: { type: Array, default: () => [] },
  periodNotes: { type: Array, default: () => [] },
  allRecords: { type: Array, default: () => [] },
  allBonusRecords: { type: Array, default: () => [] },
  plans: { type: Array, default: () => [] },
  presetDocType: { type: String, default: 'claim' },
  presetPeriod: { type: Number, default: null },   // 由父層指定要帶入的期別（送出後跳轉）
  personOrder: { type: Array, default: () => [] },   // 建案層級：獎金表人員欄排序（personKey 清單）
  unitOrders: { type: Object, default: () => ({}) },   // 戶別列順序 { [planId]: { [period]: [unitId] } }
});
const emit = defineEmits(['update:personOrder', 'update:unitOrders', 'settings-saved']);

const router = useRouter();
const toast = useToast();
// ---------- 文字自訂就地編輯（即時預覽點格子修改；按「儲存文字」才寫入） ----------
const TEXT_EDIT_KEYS = ['claimTitlePattern', 'note1', 'note2', 'kiloLabel', 'youfuLabelPattern', 'partyALabel'];
const TEXT_KEY_TO_CONFIG = { claimTitlePattern: 'titlePattern', kiloLabel: 'kiloLabel', youfuLabelPattern: 'youfuLabelPattern' };
const textOverrides = ref({});
const savingText = ref(false);
const hasTextEdits = computed(() => Object.keys(textOverrides.value).length > 0);
const exportSettings = computed(() => ({ ...props.settings, ...textOverrides.value, priceBasis: plan.value.priceBasis }));

/** 已存版型有自己的標題／條文／千4／優付文字時，預覽期間以就地修改的值覆蓋（儲存時一併寫回該版型） */
function applyTextOverrides(cfg) {
  const o = textOverrides.value;
  if (!cfg || !Object.keys(o).length) return cfg;
  const c = JSON.parse(JSON.stringify(cfg));
  Object.entries(TEXT_KEY_TO_CONFIG).forEach(([sk, ck]) => { if (o[sk] !== undefined && c[ck] !== undefined) c[ck] = o[sk]; });
  if ((o.note1 !== undefined || o.note2 !== undefined) && Array.isArray(c.notes)) {
    c.notes = [o.note1 ?? c.notes[0] ?? '', o.note2 ?? c.notes[1] ?? ''];
  }
  return c;
}
function onTextEdit({ key, value }) {
  if (!TEXT_EDIT_KEYS.includes(key)) return;
  textOverrides.value = { ...textOverrides.value, [key]: value };
}
function revertTextEdits() { textOverrides.value = {}; }
async function saveTextEdits() {
  const o = textOverrides.value;
  const patch = {};
  TEXT_EDIT_KEYS.forEach(k => { if (o[k] !== undefined) patch[k] = o[k]; });
  if (!Object.keys(patch).length) return;
  savingText.value = true;
  try {
    await setCommissionSettings(props.projectId, { ...patch, updatedBy: userStore.user?.name || '' }, planId.value);
    // 目前選用的已存版型若有同名文字欄位，一併寫回，讓匯出與預覽一致
    if (selectedConfigId.value !== '__default') {
      const found = configs.value.find(c => c.id === selectedConfigId.value);
      if (found?.config) {
        const cfg = applyTextOverrides(found.config);
        await setCommissionExportConfig(found.id, { config: cfg });
        found.config = cfg;
      }
    }
    textOverrides.value = {};
    emit('settings-saved');
    toast.success('文字自訂已儲存');
  } catch (e) {
    console.error('[CommissionExportCenter] 儲存文字自訂失敗:', e);
    toast.error(`儲存失敗：${e.message}`);
  } finally {
    savingText.value = false;
  }
}
const exportProjectName = computed(() => exportProjectNameOf(props.projectName, plan.value));
const userStore = useUserStore();

function goTemplateManager() {
  router.push({ name: 'CommissionTemplateManager', query: { priceBasis: plan.value.priceBasis } });
}

const docType = ref(props.presetDocType);
watch(() => props.presetDocType, value => { docType.value = value; });
const groupingOptions = computed(() => [
  { title: '目前方案（單獨一份）', value: 'current' },
  { title: '所選方案分開檔案（ZIP）', value: 'separate' },
  { title: '所選方案合併同一 Sheet', value: 'combined' },
  ...(docType.value === 'bonus' ? [{ title: '所選方案獎金合併列（接續編號）', value: 'mergedRows' }] : []),
]);
const preferenceKey = computed(() => `commission-export-grouping:${userStore.user?.key || userStore.user?.phone || 'local'}:${props.projectId}`);
function readGrouping() {
  try { return JSON.parse(localStorage.getItem(preferenceKey.value) || '{}') || {}; } catch { return {}; }
}
const savedGrouping = readGrouping();
const groupingModes = ref({ claim: savedGrouping.claim || 'current', bonus: savedGrouping.bonus || 'current' });
const selectedPlanIds = ref(props.plans.map(p => p.id));
const groupingMode = computed({
  get: () => groupingModes.value[docType.value] || 'current',
  set: value => { groupingModes.value[docType.value] = value; },
});
watch(groupingModes, value => {
  try { localStorage.setItem(preferenceKey.value, JSON.stringify(value)); } catch { /* private browsing */ }
}, { deep: true });
const groupingSettings = ref({});
const allExportConfigs = ref([]);
const groupingError = ref('');
const groupingLoading = ref(false);
let groupingLoadId = 0;
watch(() => props.plans, async plans => {
  const loadId = ++groupingLoadId;
  groupingLoading.value = true;
  groupingError.value = '';
  try {
    const [settingsRows, templates] = await Promise.all([
      Promise.all(plans.map(async p => [p.id, mergeSettings(await fetchCommissionSettings(props.projectId, p.id))])),
      fetchCommissionExportConfigs(props.projectId),
    ]);
    if (loadId !== groupingLoadId) return;
    groupingSettings.value = Object.fromEntries(settingsRows);
    allExportConfigs.value = templates;
  } catch (e) {
    if (loadId === groupingLoadId) groupingError.value = `方案設定載入失敗：${e.message}，請重新開啟匯出中心。`;
  } finally { if (loadId === groupingLoadId) groupingLoading.value = false; }
}, { immediate: true });
const period = ref(null);          // claim / bonus：單期
const periods = ref([]);           // person：多期
const fileName = ref('');
const pdfLoading = ref(false);

const configs = ref([]);          // 建案版型
const selectedConfigId = ref('__default');
const editorOpen = ref(false);
const editorTarget = ref(null);
const globalPickerOpen = ref(false);
const globalLoading = ref(false);
const globalTemplates = ref([]);

// 個人明細
const selectedPersonKeys = ref([]);
const encryptMode = ref('none');
const customPassword = ref('');
const showPassword = ref(false);
const payouts = ref([]);
const encryptOptions = [
  { title: '不加密', value: 'none' },
  { title: '自訂密碼', value: 'custom' },
  { title: '人員 USERKEY（電話）', value: 'userKey' },
];

const isPerson = computed(() => docType.value === 'person');

const isAdmin = computed(() => {
  const roles = userStore.user?.roles || [];
  return roles.includes('超級管理員') || roles.includes('系統管理員');
});

const allSourceRecords = computed(() => docType.value === 'claim' ? props.allRecords : props.bonusSourceRecords);
const currentSourceRecords = computed(() => docType.value === 'claim' ? props.records : props.bonusSourceRecords.filter(belongsToPlan));

const availablePeriods = computed(() => {
  const set = new Set();
  (isPerson.value || groupingMode.value === 'current' ? currentSourceRecords.value : allSourceRecords.value.filter(r => selectedPlanIds.value.includes(planIdOf(r)))).forEach(r => { if (r.status !== 'voided') set.add(toNum(r.period)); });
  return [...set].sort((a, b) => b - a);
});

watch(availablePeriods, (list) => {
  if (!list.length) { period.value = null; periods.value = []; return; }
  if (period.value === null || !list.includes(period.value)) period.value = list[0];
  periods.value = periods.value.filter(p => list.includes(p));
  if (!periods.value.length) periods.value = [list[0]];
}, { immediate: true });

const activePeriodSet = computed(() => new Set(isPerson.value ? periods.value.map(toNum) : [toNum(period.value)]));
const activeRecords = computed(() =>
  (isPerson.value || groupingMode.value === 'current' ? currentSourceRecords.value : allSourceRecords.value.filter(r => selectedPlanIds.value.includes(planIdOf(r)))).filter(r => r.status !== 'voided' && activePeriodSet.value.has(toNum(r.period)))
);
const activeBonusRows = computed(() =>
  props.bonusRecords.filter(b => b.status !== 'voided' && activePeriodSet.value.has(toNum(b.period)))
);

// ---------- 版型 ----------
const typeConfigs = computed(() => configs.value.filter(c => c.docType === docType.value));
const configOptions = computed(() => ([
  { id: '__default', name: '系統預設版型' },
  ...typeConfigs.value.map(c => ({ id: c.id, name: c.isDefault ? `★ ${c.name}` : c.name })),
]));

function defaultConfigOf(type) {
  if (type === 'claim') return defaultClaimConfig(exportSettings.value);
  if (type === 'bonus') return defaultBonusConfig(exportSettings.value);
  return defaultPersonConfig(props.settings);
}

const currentConfig = computed(() => {
  if (selectedConfigId.value === '__default') return defaultConfigOf(docType.value);
  const found = configs.value.find(c => c.id === selectedConfigId.value);
  return found?.config ? applyTextOverrides(found.config) : defaultConfigOf(docType.value);
});

/** 即時預覽就地編輯用：各文字自訂目前的原始值（已存版型有自訂者以版型為準） */
const editValues = computed(() => {
  const cfg = currentConfig.value || {};
  const s = exportSettings.value;
  return {
    claimTitlePattern: cfg.titlePattern ?? s.claimTitlePattern ?? '',
    note1: Array.isArray(cfg.notes) ? (cfg.notes[0] ?? '') : (s.note1 ?? ''),
    note2: Array.isArray(cfg.notes) ? (cfg.notes[1] ?? '') : (s.note2 ?? ''),
    kiloLabel: cfg.kiloLabel ?? s.kiloLabel ?? '',
    youfuLabelPattern: cfg.youfuLabelPattern ?? s.youfuLabelPattern ?? '',
    partyALabel: s.partyALabel ?? '',
  };
});

// 切換文件類型時：優先選該類型的預設版型
watch(docType, (t) => {
  const def = typeConfigs.value.find(c => c.isDefault);
  selectedConfigId.value = def ? def.id : '__default';
  if (t === 'person' && !payouts.value.length) loadPayouts();
});

async function loadConfigs() {
  try {
    configs.value = (await fetchCommissionExportConfigs(props.projectId)).filter(belongsToPlan);
    const def = typeConfigs.value.find(c => c.isDefault);
    if (def) selectedConfigId.value = def.id;
  } catch (e) {
    console.error('[CommissionExportCenter] 載入版型失敗:', e);
  }
}
async function loadPayouts() {
  try {
    payouts.value = (await fetchRetentionPayouts(props.projectId)).filter(belongsToPlan);
  } catch (e) {
    console.error('[CommissionExportCenter] 載入保留款發還失敗:', e);
  }
}
onMounted(loadConfigs);

// ---------- model / grids ----------
const personnelOrder = computed(() => props.personnel.map(p => p.name));

/** 某方案某期別已儲存的戶別列順序 */
function unitOrderOf(pid, per) {
  const list = props.unitOrders?.[pid]?.[String(per)];
  return Array.isArray(list) ? list : [];
}
const currentUnitOrder = computed(() => unitOrderOf(planId.value, period.value));

/** 即時預覽拖曳戶別列後：儲存目前方案＋期別的戶別順序（請佣總表與獎金表共用） */
async function onReorderUnits({ unitIds }) {
  const ids = (unitIds || []).map(String).filter(Boolean);
  if (!ids.length || !period.value) return;
  const pid = planId.value;
  const per = String(period.value);
  const prev = props.unitOrders || {};
  const next = { ...prev, [pid]: { ...(prev[pid] || {}), [per]: ids } };
  emit('update:unitOrders', next);   // 先更新預覽，再寫入
  try {
    await setCommissionUnitOrder(props.projectId, pid, per, ids, userStore.user?.name || '');
    toast.success('戶別順序已儲存');
  } catch (e) {
    console.error('[CommissionExportCenter] 儲存戶別順序失敗:', e);
    toast.error(`儲存戶別順序失敗：${e.message}`);
    emit('update:unitOrders', prev);
  }
}

/**
 * 即時預覽拖曳人員欄後：把該區人員的新順序併入建案層級排序並立即儲存。
 * 併入方式：先移除清單中該區所有人員，再於原本第一位出現的位置整段插回，其餘人員相對順序不變。
 */
async function onReorderPersons({ personKeys }) {
  const subset = (personKeys || []).map(String).filter(Boolean);
  if (!subset.length) return;
  const saved = (props.personOrder || []).map(String);
  const set = new Set(subset);
  const firstIdx = saved.findIndex(k => set.has(k));
  const rest = saved.filter(k => !set.has(k));
  const pos = firstIdx < 0 ? rest.length : saved.slice(0, firstIdx).filter(k => !set.has(k)).length;
  const next = [...rest.slice(0, pos), ...subset, ...rest.slice(pos)];
  const prev = saved;
  emit('update:personOrder', next);   // 先更新預覽，再寫入
  try {
    await setCommissionPersonOrder(props.projectId, next, userStore.user?.name || '');
    toast.success('人員欄排序已儲存');
  } catch (e) {
    console.error('[CommissionExportCenter] 儲存人員欄排序失敗:', e);
    toast.error(`儲存人員欄排序失敗：${e.message}`);
    emit('update:personOrder', prev);
  }
}

const claimModel = computed(() => {
  if (isPerson.value || !props.records.some(r => r.status !== 'voided' && toNum(r.period) === toNum(period.value))) return null;
  const cfg = docType.value === 'claim' ? currentConfig.value : projectDefaultClaimConfig();
  return buildClaimModel(props.records.filter(r => r.status !== 'voided' && toNum(r.period) === toNum(period.value)), {
    settings: exportSettings.value, config: cfg, period: period.value, projectName: exportProjectName.value,
    unitOrder: currentUnitOrder.value,
  });
});

function projectDefaultClaimConfig() {
  const def = configs.value.find(c => c.docType === 'claim' && c.isDefault);
  return def?.config || defaultClaimConfig(exportSettings.value);
}

const bonusModel = computed(() => {
  if (docType.value !== 'bonus' || !activeRecords.value.length) return null;
  return buildBonusModel({
    periodNotes: props.periodNotes,
    records: activeRecords.value.filter(belongsToPlan),
    bonusRecords: activeBonusRows.value,
    settings: exportSettings.value,
    config: currentConfig.value,
    period: period.value,
    projectName: exportProjectName.value,
    projectId: props.projectId,
    personnelOrder: personnelOrder.value,
    personOrder: props.personOrder,
    unitOrder: currentUnitOrder.value,
  });
});

// ---- 個人明細 ----
const personOptions = computed(() =>
  listPersonsInPeriods(props.bonusRecords, periods.value, personnelOrder.value, props.personOrder).map(p => ({
    value: p.personKey,
    name: p.name,
    title: p.sourceProjectName && p.sourceProjectId !== props.projectId ? `${p.name}（${p.sourceProjectName}）` : p.name,
    subtitle: `${p.role || '—'}・${p.count} 筆・實發 ${Math.round(p.net).toLocaleString('en-US')} 元`,
  }))
);
// 期別變動後，移除已不在名單內的人員
watch(personOptions, (opts) => {
  const keys = new Set(opts.map(o => o.value));
  selectedPersonKeys.value = selectedPersonKeys.value.filter(k => keys.has(k));
});
const allPersonsSelected = computed(() => personOptions.value.length > 0 && selectedPersonKeys.value.length === personOptions.value.length);
const somePersonsSelected = computed(() => selectedPersonKeys.value.length > 0);
function toggleAllPersons() {
  selectedPersonKeys.value = allPersonsSelected.value ? [] : personOptions.value.map(o => o.value);
}

const personModels = computed(() => {
  if (!isPerson.value || !activeRecords.value.length) return [];
  const order = personOptions.value.map(o => o.value);
  return selectedPersonKeys.value
    .slice()
    .sort((a, b) => order.indexOf(a) - order.indexOf(b))
    .map(personKey => buildPersonModel({
      periodNotes: props.periodNotes,
      records: currentSourceRecords.value,
      bonusRecords: props.bonusRecords,
      payouts: payouts.value,
      personnel: props.personnel,
      settings: exportSettings.value,
      config: currentConfig.value,
      periods: periods.value,
      personKey,
      projectName: exportProjectName.value,
      projectId: props.projectId,
    }));
});

const periodsText = computed(() => periodsLabel(periods.value));

const groupedDocuments = computed(() => {
  if (isPerson.value || groupingMode.value === 'current' || groupingLoading.value || groupingError.value) return [];
  return props.plans.filter(p => selectedPlanIds.value.includes(p.id)).flatMap(p => {
    const records = activeRecords.value.filter(r => planIdOf(r) === p.id);
    if (!records.length) return [];
    const settings = { ...(p.id === planId.value ? props.settings : groupingSettings.value[p.id]), priceBasis: p.priceBasis };
    const configOf = type => {
      if (p.id === planId.value && type === docType.value) return currentConfig.value;
      const configsForPlan = p.id === planId.value ? configs.value : allExportConfigs.value;
      return configsForPlan.find(c => planIdOf(c) === p.id && c.docType === type && c.isDefault)?.config
        || (type === 'claim' ? defaultClaimConfig(settings) : defaultBonusConfig(settings));
    };
    const projectName = `${props.projectName}・${p.name}`;
    const unitOrder = unitOrderOf(p.id, period.value);
    const claimRecords = props.allRecords.filter(r => planIdOf(r) === p.id && r.status !== 'voided' && toNum(r.period) === toNum(period.value));
    const claim = buildClaimModel(claimRecords, { settings, config: configOf('claim'), period: period.value, projectName, unitOrder });
    if (docType.value === 'claim') return [{ plan: p, model: claim, grids: [buildClaimGrid(claim)] }];
    const bonus = buildBonusModel({ records, periodNotes: props.periodNotes,
      bonusRecords: props.allBonusRecords.filter(b => b.status !== 'voided' && planIdOf(b) === p.id && toNum(b.period) === toNum(period.value)),
      settings, config: configOf('bonus'), period: period.value, projectName, projectId: props.projectId,
      personnelOrder: personnelOrder.value,
      personOrder: props.personOrder,
      unitOrder,
    });
    return [{ plan: p, model: bonus, grids: [...(bonus.includeClaimSheet && claimRecords.length ? [buildClaimGrid(claim)] : []), ...buildBonusGrids(bonus)] }];
  });
});

const mergedBonusModel = computed(() => {
  if (docType.value !== 'bonus' || groupingMode.value !== 'mergedRows' || groupingLoading.value || groupingError.value) return null;
  const sources = props.plans.filter(p => selectedPlanIds.value.includes(p.id)).map(p => ({
    plan: p,
    records: activeRecords.value.filter(r => planIdOf(r) === p.id),
    bonusRecords: props.allBonusRecords.filter(b => b.status !== 'voided' && planIdOf(b) === p.id && toNum(b.period) === toNum(period.value)),
    settings: p.id === planId.value ? exportSettings.value : (groupingSettings.value[p.id] || {}),
    unitOrder: unitOrderOf(p.id, period.value),
  })).filter(source => source.records.length);
  return buildMergedBonusModel({ sources, periodNotes: props.periodNotes, settings: exportSettings.value, config: currentConfig.value,
    period: period.value, projectName: props.projectName, projectId: props.projectId,
    personnelOrder: personnelOrder.value, personOrder: props.personOrder,
  });
});

const grids = computed(() => {
  try {
    if (!activeRecords.value.length) return [];
    if (isPerson.value) return personModels.value.map(m => buildPersonGrid(m));
    if (groupingMode.value !== 'current') {
      if (groupingMode.value === 'mergedRows') return mergedBonusModel.value ? buildBonusGrids(mergedBonusModel.value) : [];
      const documents = groupedDocuments.value;
      if (groupingMode.value === 'combined') {
        const combined = combineCommissionGrids(documents.flatMap(d => d.grids), docType.value === 'claim' ? '合併請佣總表' : '合併獎金表');
        return combined ? [combined] : [];
      }
      return documents.flatMap(d => d.grids.map(g => ({ ...g, name: `${d.plan.name}・${g.name}` })));
    }
    if (docType.value === 'claim') {
      return claimModel.value ? [buildClaimGrid(claimModel.value)] : [];
    }
    if (!bonusModel.value) return [];
    const list = [];
    if (bonusModel.value.includeClaimSheet && claimModel.value) list.push(buildClaimGrid(claimModel.value));
    list.push(...buildBonusGrids(bonusModel.value));
    return list;
  } catch (e) {
    console.error('[CommissionExportCenter] 版面產生失敗:', e);
    return [];
  }
});

// 檔名：依文件/期別/版型自動帶入，可改
watch([docType, period, periods, claimModel, bonusModel, personModels, groupingMode, groupedDocuments], () => {
  if (!isPerson.value && groupingMode.value !== 'current') {
    fileName.value = withProjectName(`第${period.value || ""}期_${docType.value === "claim" ? "請佣" : "獎金"}_${groupingMode.value === "mergedRows" ? "合併列" : groupingMode.value === "combined" ? "合併" : "分檔"}`, props.projectName);
    return;
  }
  if (isPerson.value) {
    if (personModels.value.length === 1) fileName.value = personModels.value[0].fileName || '';
    else {
      const pattern = String(currentConfig.value.fileNamePattern || '').replace(/[-_－ ]?\{姓名\}/g, '');
      fileName.value = withProjectName(fillPattern(pattern, {
        projectName: exportProjectName.value, shortName: props.settings.projectShortName || '', period: periodsLabel(periods.value, true),
      }) || '獎金明細', exportProjectName.value);
    }
    return;
  }
  const model = groupingMode.value === 'mergedRows' ? mergedBonusModel.value : docType.value === 'claim' ? claimModel.value : bonusModel.value;
  if (model) fileName.value = model.fileName || '';
}, { immediate: true });

// ---------- 下載 ----------
function saveBlob(blob, name) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

function base64ToBlob(base64, mimeType) {
  const bin = atob(base64);
  const arr = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
  return new Blob([arr], { type: mimeType || 'application/pdf' });
}

/** 加密設定：回傳 payload.encrypt 或 null；custom 模式未填密碼回傳 false */
function encryptFor(model) {
  if (!isPerson.value || encryptMode.value === 'none') return null;
  if (encryptMode.value === 'userKey') {
    const key = String(model.person.personKey || '').trim();
    return key ? { userPassword: key } : null;
  }
  const pwd = String(customPassword.value || '');
  return pwd ? { userPassword: pwd } : false;
}

function checkEncryptReady() {
  if (isPerson.value && encryptMode.value === 'custom' && !String(customPassword.value || '').trim()) {
    toast.warning('請輸入自訂密碼，或改選「不加密」。');
    return false;
  }
  return true;
}

async function downloadExcel() {
  try {
    if (isPerson.value) {
      const models = personModels.value;
      if (models.length === 1) {
        await exportGridsToExcel(buildPersonExcelGrids(models[0]), models[0].fileName || fileName.value || 'export');
      } else {
        const zip = new JSZip();
        models.forEach(m => zip.file(`${m.fileName}.xlsx`, gridsToExcelBlob(buildPersonExcelGrids(m))));
        saveBlob(await zip.generateAsync({ type: 'blob' }), `${fileName.value || 'export'}.zip`);
      }
      toast.success(models.length > 1 ? `已下載 ZIP（${models.length} 份 Excel）` : 'Excel 已下載');
      return;
    }
    if (groupingMode.value === 'separate') {
      const zip = new JSZip();
      groupedDocuments.value.forEach(d => zip.file(`${withProjectName(fileName.value || 'export', `${d.plan.name}_${d.plan.id}`)}.xlsx`, gridsToExcelBlob(d.grids)));
      saveBlob(await zip.generateAsync({ type: 'blob' }), `${fileName.value || 'export'}.zip`);
      toast.success(`已下載 ZIP（${groupedDocuments.value.length} 份 Excel）`);
      return;
    }
    await exportGridsToExcel(grids.value, fileName.value || 'export');
    toast.success('Excel 已下載');
  } catch (e) {
    console.error('[CommissionExportCenter] Excel 匯出失敗:', e);
    toast.error(`Excel 匯出失敗：${e.message}`);
  }
}

async function personPdfPayload(model) {
  const encrypt = encryptFor(model);
  return {
    fileName: model.fileName || 'export',
    paper: model.paper || 'A4',
    orientation: model.orientation || 'portrait',
    grids: [buildPersonGrid(model)],
    ...(encrypt ? { encrypt } : {}),
  };
}

async function downloadPdf() {
  if (!checkEncryptReady()) return;
  pdfLoading.value = true;
  try {
    if (isPerson.value) {
      const models = personModels.value;
      const results = [];
      for (const m of models) {
        const res = await generateCommissionPdfAPI({ projectId: props.projectId, planId: planId.value, docType: 'person', payload: await personPdfPayload(m) });
        if (!res?.ok) throw new Error(`${m.person.name} PDF 產製失敗`);
        results.push({ name: res.fileName || `${m.fileName}.pdf`, blob: base64ToBlob(res.base64, res.mimeType) });
      }
      if (results.length === 1) {
        saveBlob(results[0].blob, results[0].name);
      } else {
        const zip = new JSZip();
        results.forEach(r => zip.file(r.name, r.blob));
        saveBlob(await zip.generateAsync({ type: 'blob' }), `${fileName.value || 'export'}.zip`);
      }
      toast.success(results.length > 1 ? `已下載 ZIP（${results.length} 份 PDF）` : 'PDF 已下載');
      return;
    }
    if (groupingMode.value === 'separate') {
      const zip = new JSZip();
      for (const d of groupedDocuments.value) {
        const name = withProjectName(fileName.value || 'export', `${d.plan.name}_${d.plan.id}`);
        const res = await generateCommissionPdfAPI({ projectId: props.projectId, planId: d.plan.id, docType: docType.value,
          payload: { fileName: name, paper: d.model.paper || 'A4', orientation: d.model.orientation || 'landscape', grids: d.grids } });
        if (!res?.ok) throw new Error(`${d.plan.name} PDF 產製失敗`);
        zip.file(`${name}.pdf`, base64ToBlob(res.base64, res.mimeType));
      }
      saveBlob(await zip.generateAsync({ type: 'blob' }), `${fileName.value || 'export'}.zip`);
      toast.success('PDF 分檔 ZIP 已下載');
      return;
    }
    const model = groupingMode.value === 'mergedRows' ? mergedBonusModel.value : docType.value === 'claim' ? claimModel.value : bonusModel.value;
    const res = await generateCommissionPdfAPI({
      projectId: props.projectId,
      planId: planId.value,
      docType: docType.value,
      payload: {
        fileName: fileName.value || 'export',
        paper: model?.paper || 'A4',
        orientation: model?.orientation || 'landscape',
        grids: grids.value,
      },
    });
    if (res?.ok) {
      saveBlob(base64ToBlob(res.base64, res.mimeType), res.fileName || `${fileName.value}.pdf`);
      toast.success('PDF 已下載');
    }
  } catch (e) {
    console.error('[CommissionExportCenter] PDF 產製失敗:', e);
    toast.error(`PDF 產製失敗：${e.message}`);
  } finally {
    pdfLoading.value = false;
  }
}

// ---------- Email 寄送 ----------
const emailOpen = ref(false);
const emailSending = ref(false);
const emailSubject = ref('');
const emailBody = ref('');
const emailRecipients = ref([]);

const encryptLabel = computed(() => encryptOptions.find(o => o.value === encryptMode.value)?.title || '');
function isValidEmail(s) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(s || '').trim());
}
const sendableCount = computed(() => emailRecipients.value.filter(r => r.status !== 'sent' && isValidEmail(r.email)).length);
const emailDone = computed(() => emailRecipients.value.length > 0 && emailRecipients.value.every(r => r.status === 'sent' || !isValidEmail(r.email)));

function openEmail() {
  if (!checkEncryptReady()) return;
  const pText = periodsText.value;
  emailSubject.value = `【${props.projectName}】第 ${pText} 期獎金明細`;
  const lines = [
    '{姓名} 您好：',
    '',
    `附件為「${props.projectName}」第 ${pText} 期獎金明細（PDF），請審閱。`,
  ];
  if (encryptMode.value === 'userKey') lines.push('PDF 開啟密碼為您登記於系統的手機號碼。');
  else if (encryptMode.value === 'custom') lines.push('PDF 已加密，開啟密碼將另行通知。');
  lines.push('', '如有疑問請與專案聯繫，謝謝。');
  emailBody.value = lines.join('\n');
  emailRecipients.value = personModels.value.map(m => ({
    personKey: m.person.personKey,
    name: m.person.name,
    email: m.person.email || '',
    status: '',
    error: '',
  }));
  emailOpen.value = true;
}

async function sendEmails() {
  emailSending.value = true;
  let ok = 0, fail = 0;
  try {
    for (const r of emailRecipients.value) {
      if (r.status === 'sent' || !isValidEmail(r.email)) continue;
      const model = personModels.value.find(m => m.person.personKey === r.personKey);
      if (!model) continue;
      r.status = 'sending';
      try {
        await sendCommissionPersonEmailAPI({
          projectId: props.projectId,
      planId: planId.value,
          projectName: exportProjectName.value,
          to: r.email.trim(),
          personName: r.name,
          subject: emailSubject.value,
          body: emailBody.value.replace(/\{姓名\}/g, r.name),
          payload: await personPdfPayload(model),
        });
        r.status = 'sent';
        ok++;
      } catch (e) {
        r.status = 'error';
        r.error = e.message || '寄送失敗';
        fail++;
      }
    }
    if (fail) toast.warning(`寄送完成：成功 ${ok} 人，失敗 ${fail} 人`);
    else toast.success(`已寄出 ${ok} 封獎金明細`);
  } finally {
    emailSending.value = false;
  }
}

// ---------- 版型 CRUD ----------
function editTemplate() {
  if (selectedConfigId.value === '__default') {
    editorTarget.value = null;   // 以預設為底新增
  } else {
    editorTarget.value = configs.value.find(c => c.id === selectedConfigId.value) || null;
  }
  editorOpen.value = true;
}

async function saveConfig(data) {
  try {
    const docId = data.id || `${props.projectId}_${planId.value}_${docType.value}_${Date.now()}`;
    // 同 docType 只能有一個預設
    if (data.isDefault) {
      for (const c of typeConfigs.value) {
        if (c.isDefault && c.id !== docId) {
          await setCommissionExportConfig(c.id, { isDefault: false });
        }
      }
    }
    await setCommissionExportConfig(docId, {
      projectId: props.projectId,
      planId: planId.value,
      docType: docType.value,
      name: data.name,
      isDefault: !!data.isDefault,
      config: data.config,
    });
    await loadConfigs();
    selectedConfigId.value = docId;
    toast.success(`版型「${data.name}」已儲存`);
  } catch (e) {
    console.error('[CommissionExportCenter] 版型儲存失敗:', e);
    toast.error(`版型儲存失敗：${e.message}`);
  }
}

async function setAsDefault() {
  const target = configs.value.find(c => c.id === selectedConfigId.value);
  if (!target) return;
  await saveConfig({ id: target.id, name: target.name, isDefault: true, config: target.config });
}

async function deleteConfig() {
  const target = configs.value.find(c => c.id === selectedConfigId.value);
  if (!target) return;
  if (!window.confirm(`確定刪除版型「${target.name}」？`)) return;
  try {
    await deleteCommissionExportConfig(target.id);
    await loadConfigs();
    selectedConfigId.value = '__default';
    toast.success('版型已刪除');
  } catch (e) {
    toast.error(`刪除失敗：${e.message}`);
  }
}

// ---------- 全域範本 ----------
const globalTemplatesOfType = computed(() => globalTemplates.value.filter(t => t.docType === docType.value && (t.priceBasis || 'house') === plan.value.priceBasis));

async function openGlobalPicker() {
  globalPickerOpen.value = true;
  globalLoading.value = true;
  try {
    globalTemplates.value = await fetchCommissionExportTemplates();
  } catch (e) {
    toast.error(`載入全域範本失敗：${e.message}`);
  } finally {
    globalLoading.value = false;
  }
}

/** 套用即複製：以範本 config 建立一組新的建案版型 */
async function applyGlobal(template) {
  globalPickerOpen.value = false;
  await saveConfig({
    id: null,
    name: template.name,
    isDefault: false,
    config: JSON.parse(JSON.stringify(template.config || {})),
  });
}

async function saveAsGlobal() {
  const target = configs.value.find(c => c.id === selectedConfigId.value);
  if (!target) return;
  const name = window.prompt('全域範本名稱：', target.name);
  if (!name) return;
  try {
    await setCommissionExportTemplate(`${docType.value}_${Date.now()}`, {
      docType: docType.value,
      name,
      priceBasis: plan.value.priceBasis,
      description: `由「${props.projectName}／${plan.value.name}」上傳`,
      config: JSON.parse(JSON.stringify(target.config)),
      createdBy: userStore.user?.name || '',
    });
    toast.success(`已另存為全域範本「${name}」`);
  } catch (e) {
    toast.error(`另存失敗：${e.message}`);
  }
}

// ---------- 對外 ----------
function selectPeriod(p) {
  if (!availablePeriods.value.includes(toNum(p))) return;
  period.value = toNum(p);
  periods.value = [toNum(p)];
}
watch([() => props.presetPeriod, availablePeriods], ([p]) => { if (p !== null && p !== undefined) selectPeriod(p); }, { immediate: true });
defineExpose({ selectPeriod, hasDraft: computed(() => editorOpen.value || hasTextEdits.value) });
</script>

<style scoped>
.recipient-table :deep(td) {
  vertical-align: middle;
}
</style>
