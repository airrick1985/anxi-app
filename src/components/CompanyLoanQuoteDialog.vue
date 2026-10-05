<template>
  <v-dialog v-model="show" :fullscreen="smAndDown" max-width="1120" scrollable>
    <!-- macOS sheet：左側輸入、右側即時攤還表；手機上下堆疊 -->
    <v-card class="mac-sheet">
      <div class="mac-sheet-head">
        <v-icon size="18">mdi-bank-outline</v-icon>
        <span>公司借貸報價單</span>
        <button type="button" class="mac-sheet-close" aria-label="關閉" @click="show = false">
          <v-icon size="18">mdi-close</v-icon>
        </button>
      </div>
      <v-progress-linear v-if="loadingTemplates" indeterminate color="#0071e3" height="2"></v-progress-linear>

      <v-card-text class="mac-form lq-body">
        <div class="lq-layout">
          <!-- 左：輸入 -->
          <div class="lq-form">
            <div class="mac-form-label">客戶</div>
            <div class="mac-form-group">
              <label class="mac-form-row">
                <span class="mac-form-row-label">客戶姓名</span>
                <input v-model.trim="form.customerName" class="mac-form-input" />
              </label>
              <label class="mac-form-row">
                <span class="mac-form-row-label">戶別</span>
                <input v-model.trim="form.unitId" class="mac-form-input" list="loan-quote-unit-options" />
                <datalist id="loan-quote-unit-options">
                  <option v-for="u in unitOptions" :key="u" :value="u"></option>
                </datalist>
              </label>
              <label class="mac-form-row">
                <span class="mac-form-row-label">報價日期</span>
                <input v-model="quoteDate" type="date" class="mac-form-input" />
              </label>
            </div>

            <div class="mac-form-label">借款條件</div>
            <div class="mac-form-group">
              <!-- 借貸範本：帶入借款條件＋費用；銷控管理權限可存為範本／刪除 -->
              <div v-if="templates.length || canManageTemplates" class="mac-form-row lq-tpl-row">
                <span class="mac-form-row-label">借貸範本</span>
                <select v-model="templateSelect" class="mac-form-input mac-form-select lq-tpl-select">
                  <option value="">不使用</option>
                  <option v-for="t in templates" :key="t.id" :value="t.id">{{ t.name }}</option>
                </select>
                <template v-if="canManageTemplates">
                  <button type="button" class="mac-btn mac-btn--sm" @click="openSaveTemplate">
                    <v-icon size="14">mdi-content-save-outline</v-icon><span>存為範本</span>
                  </button>
                  <button
                    v-if="form.templateId"
                    type="button"
                    class="mac-icon-btn mac-icon-btn--danger"
                    aria-label="刪除範本"
                    title="刪除範本"
                    @click="deleteTplVisible = true"
                  >
                    <v-icon size="16">mdi-trash-can-outline</v-icon>
                  </button>
                </template>
              </div>
              <label class="mac-form-row">
                <span class="mac-form-row-label">借款金額</span>
                <span class="mac-form-input mac-form-unit">
                  <input v-model.number="form.loanAmountWan" type="number" min="0" inputmode="decimal" />
                  <span>萬</span>
                </span>
              </label>
              <label class="mac-form-row">
                <span class="mac-form-row-label">年利率</span>
                <span class="mac-form-input mac-form-unit">
                  <input v-model.number="form.annualRate" type="number" min="0" step="0.01" inputmode="decimal" />
                  <span>%</span>
                </span>
              </label>
              <label class="mac-form-row">
                <span class="mac-form-row-label">年數</span>
                <span class="mac-form-input mac-form-unit">
                  <input v-model.number="form.years" type="number" min="0" inputmode="decimal" />
                  <span>年</span>
                </span>
              </label>
              <label class="mac-form-row">
                <span class="mac-form-row-label">期數</span>
                <span v-if="intervalText" class="lq-row-sub">{{ intervalText }}</span>
                <span class="mac-form-input mac-form-unit">
                  <input v-model.number="form.periods" type="number" min="1" step="1" inputmode="numeric" />
                  <span>期</span>
                </span>
              </label>
              <div class="mac-form-row">
                <span class="mac-form-row-label">攤還方式</span>
                <div class="mac-form-seg lq-seg-right">
                  <button
                    v-for="t in LOAN_AMORTIZATION_TYPES"
                    :key="t"
                    type="button"
                    class="mac-form-seg-btn"
                    :class="{ 'is-active': form.amortizationType === t }"
                    @click="form.amortizationType = t"
                  >{{ t.replace('攤還', '') }}</button>
                </div>
              </div>
            </div>

            <div class="mac-form-label">
              費用
              <span class="mac-spacer"></span>
              <button type="button" class="mac-btn mac-btn--sm" @click="addFee">
                <v-icon size="15">mdi-plus</v-icon><span>新增</span>
              </button>
            </div>
            <div class="mac-form-group">
              <div v-if="form.fees.length === 0" class="mac-form-row mac-form-empty">無費用</div>
              <div v-for="(fee, i) in form.fees" :key="fee.id" class="mac-form-row lq-fee-row">
                <input v-model="fee.name" class="mac-form-input lq-fee-name" placeholder="費用名稱" />
                <div class="mac-form-seg">
                  <button
                    type="button"
                    class="mac-form-seg-btn lq-fee-seg"
                    :class="{ 'is-active': fee.mode === FEE_MODE_RATIO }"
                    @click="fee.mode = FEE_MODE_RATIO"
                  >千分之</button>
                  <button
                    type="button"
                    class="mac-form-seg-btn lq-fee-seg"
                    :class="{ 'is-active': fee.mode === FEE_MODE_FIXED }"
                    @click="fee.mode = FEE_MODE_FIXED"
                  >金額</button>
                </div>
                <span class="mac-form-input mac-form-unit lq-fee-value">
                  <input v-model.number="fee.value" type="number" min="0" inputmode="decimal" />
                  <span>{{ fee.mode === FEE_MODE_RATIO ? '‰' : '元' }}</span>
                </span>
                <span class="lq-fee-amount">{{ fmt(quote.fees[i]?.amount) }}</span>
                <button type="button" class="mac-icon-btn mac-icon-btn--danger" aria-label="移除" @click="form.fees.splice(i, 1)">
                  <v-icon size="16">mdi-trash-can-outline</v-icon>
                </button>
              </div>
              <div v-if="form.fees.length" class="mac-form-row lq-fee-total">
                <span class="mac-form-row-label">費用合計</span>
                <span class="lq-fee-amount">{{ fmt(quote.feeTotal) }} 元</span>
              </div>
            </div>

            <div class="mac-form-label">
              備註
              <span class="mac-spacer"></span>
              <button
                type="button"
                class="mac-btn mac-btn--sm"
                :disabled="!form.note.trim() || isOptimizing"
                @click="optimizeNote"
              >
                <v-progress-circular v-if="isOptimizing" indeterminate size="12" width="2" color="#6e6e73"></v-progress-circular>
                <v-icon v-else size="14">mdi-magic-staff</v-icon>
                <span>AI 優化</span>
              </button>
            </div>
            <div class="mac-form-group mac-form-pad">
              <textarea v-model="form.note" class="mac-form-textarea" rows="3"></textarea>
            </div>
          </div>

          <!-- 右：即時攤還表 -->
          <div class="lq-result">
            <template v-if="schedule">
              <div class="lq-tiles">
                <div class="lq-tile lq-tile--main">
                  <span class="lq-tile-label">每期金額</span>
                  <span class="lq-tile-value">{{ paymentText }}</span>
                </div>
                <div class="lq-tile">
                  <span class="lq-tile-label">借款金額</span>
                  <span class="lq-tile-value">{{ fmt(quote.loanAmount) }}</span>
                </div>
                <div class="lq-tile">
                  <span class="lq-tile-label">利息合計</span>
                  <span class="lq-tile-value">{{ fmt(schedule.totals.interest) }}</span>
                </div>
                <div class="lq-tile">
                  <span class="lq-tile-label">費用合計</span>
                  <span class="lq-tile-value">{{ fmt(quote.feeTotal) }}</span>
                </div>
                <div class="lq-tile lq-tile--total">
                  <span class="lq-tile-label">總計（本利＋費用）</span>
                  <span class="lq-tile-value">{{ fmt(quote.grandTotal) }}</span>
                </div>
              </div>

              <div class="lq-table-wrap">
                <table class="lq-table">
                  <thead>
                    <tr><th>期別</th><th>本金</th><th>利息</th><th>每期金額</th><th>剩餘本金</th></tr>
                  </thead>
                  <tbody>
                    <tr v-for="r in schedule.rows" :key="r.period">
                      <td>{{ r.period }}</td>
                      <td>{{ fmt(r.principal) }}</td>
                      <td>{{ fmt(r.interest) }}</td>
                      <td class="lq-pay">{{ fmt(r.payment) }}</td>
                      <td class="lq-rem">{{ fmt(r.remaining) }}</td>
                    </tr>
                  </tbody>
                  <tfoot>
                    <tr>
                      <td>合計</td>
                      <td>{{ fmt(schedule.totals.principal) }}</td>
                      <td>{{ fmt(schedule.totals.interest) }}</td>
                      <td class="lq-pay">{{ fmt(schedule.totals.payment) }}</td>
                      <td></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </template>
            <div v-else class="lq-empty">
              <v-icon size="44" color="#c7c7cc">mdi-table-large</v-icon>
              <span>請輸入借款金額、年利率、年數、期數</span>
            </div>
          </div>
        </div>
      </v-card-text>

      <div class="mac-sheet-foot lq-foot">
        <button type="button" class="mac-btn" @click="resetForm">
          <v-icon size="15">mdi-restore</v-icon><span>重設</span>
        </button>
        <span class="mac-spacer"></span>
        <button type="button" class="mac-btn lq-act" :disabled="!schedule" @click="openPreview">
          <v-icon size="15">mdi-eye-outline</v-icon><span>預覽</span>
        </button>
        <button type="button" class="mac-btn lq-act" :disabled="!schedule || isDownloadingPdf" @click="downloadPdf">
          <v-progress-circular v-if="isDownloadingPdf" indeterminate size="14" width="2" color="#6e6e73"></v-progress-circular>
          <v-icon v-else size="15">mdi-file-pdf-box</v-icon>
          <span>下載 PDF</span>
        </button>
        <button type="button" class="mac-btn mac-btn--primary lq-act" :disabled="!schedule" @click="handlePrint">
          <v-icon size="15">mdi-printer</v-icon><span>列印</span>
        </button>
      </div>
    </v-card>
  </v-dialog>

  <!-- 預覽（與列印／PDF 同一份版面） -->
  <v-dialog v-model="isPreviewVisible" fullscreen transition="dialog-bottom-transition">
    <v-card class="d-flex flex-column">
      <div class="mac-sheet-head lq-preview-head">
        <button type="button" class="mac-sheet-close lq-preview-close" aria-label="關閉預覽" @click="isPreviewVisible = false">
          <v-icon size="18">mdi-close</v-icon>
        </button>
        <span>公司借貸報價單預覽</span>
        <div class="lq-preview-actions">
          <button type="button" class="mac-btn" :disabled="isDownloadingPdf" @click="downloadPdf">
            <v-progress-circular v-if="isDownloadingPdf" indeterminate size="14" width="2" color="#6e6e73"></v-progress-circular>
            <v-icon v-else size="15">mdi-file-pdf-box</v-icon>
            <span>下載 PDF</span>
          </button>
          <button type="button" class="mac-btn mac-btn--primary" @click="handlePrint">
            <v-icon size="15">mdi-printer</v-icon><span>列印</span>
          </button>
        </div>
      </div>
      <iframe class="lq-preview-frame flex-grow-1" :srcdoc="previewHtml" title="公司借貸報價單預覽"></iframe>
    </v-card>
  </v-dialog>

  <!-- 存為範本：輸入名稱，同名覆蓋 -->
  <v-dialog v-model="saveTplVisible" max-width="420">
    <v-card class="mac-sheet">
      <div class="mac-sheet-head">
        <v-icon size="18">mdi-content-save-outline</v-icon>
        <span>存為範本</span>
      </div>
      <div class="mac-form lq-dlg-body">
        <div class="mac-form-group">
          <label class="mac-form-row">
            <span class="mac-form-row-label">範本名稱</span>
            <input v-model="saveTplName" class="mac-form-input" maxlength="40" autofocus />
          </label>
        </div>
      </div>
      <div class="mac-sheet-foot">
        <span class="mac-spacer"></span>
        <button type="button" class="mac-btn" @click="saveTplVisible = false">取消</button>
        <button
          type="button"
          class="mac-btn mac-btn--primary"
          :disabled="!saveTplName.trim() || savingTemplate"
          @click="saveTemplate"
        >
          <v-progress-circular v-if="savingTemplate" indeterminate size="14" width="2" color="#fff"></v-progress-circular>
          <span>{{ saveTplExists ? '覆蓋' : '儲存' }}</span>
        </button>
      </div>
    </v-card>
  </v-dialog>

  <!-- AI 優化備註：原文／優化後對照，確認後才替換 -->
  <v-dialog v-model="optimizeVisible" max-width="560" scrollable>
    <v-card class="mac-sheet">
      <div class="mac-sheet-head">
        <v-icon size="18">mdi-magic-staff</v-icon>
        <span>AI 優化備註</span>
        <button type="button" class="mac-sheet-close" aria-label="關閉" @click="optimizeVisible = false">
          <v-icon size="18">mdi-close</v-icon>
        </button>
      </div>
      <v-card-text class="mac-form lq-dlg-body">
        <div class="mac-form-label">原文</div>
        <div class="mac-form-group mac-form-pad lq-ai-orig">{{ form.note }}</div>
        <div class="mac-form-label">優化後</div>
        <div class="mac-form-group mac-form-pad">
          <textarea v-model="optimizedNote" class="mac-form-textarea" rows="7"></textarea>
        </div>
      </v-card-text>
      <div class="mac-sheet-foot">
        <button type="button" class="mac-btn" :disabled="isOptimizing" @click="optimizeNote">
          <v-progress-circular v-if="isOptimizing" indeterminate size="14" width="2" color="#6e6e73"></v-progress-circular>
          <v-icon v-else size="15">mdi-refresh</v-icon>
          <span>重新優化</span>
        </button>
        <span class="mac-spacer"></span>
        <button type="button" class="mac-btn" @click="optimizeVisible = false">取消</button>
        <button type="button" class="mac-btn mac-btn--primary" :disabled="!optimizedNote.trim()" @click="applyOptimizedNote">
          <v-icon size="15">mdi-check</v-icon><span>替換並使用</span>
        </button>
      </div>
    </v-card>
  </v-dialog>

  <!-- 刪除範本 確認 -->
  <v-dialog v-model="deleteTplVisible" max-width="400">
    <v-card class="mac-sheet">
      <div class="mac-sheet-head">
        <v-icon size="18">mdi-trash-can-outline</v-icon>
        <span>刪除範本</span>
      </div>
      <div class="mac-sheet-section">確定刪除「{{ selectedTemplateName }}」？</div>
      <div class="mac-sheet-foot">
        <span class="mac-spacer"></span>
        <button type="button" class="mac-btn" @click="deleteTplVisible = false">取消</button>
        <button type="button" class="mac-btn mac-btn--danger-fill" :disabled="deletingTemplate" @click="deleteTemplate">
          <v-progress-circular v-if="deletingTemplate" indeterminate size="14" width="2" color="#fff"></v-progress-circular>
          <span>刪除</span>
        </button>
      </div>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { ref, computed, watch, nextTick } from 'vue';
import { useToast } from 'vue-toastification';
import { useDisplay } from 'vuetify';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { useProjectStore } from '@/store/projectStore';
import { useUserStore } from '@/store/user';
import { PREVIEW_FIT_SCRIPT } from '@/utils/previewFitScript';
import { optimizeInteractionLog } from '@/api';
import {
  LOAN_AMORTIZATION_TYPES,
  FEE_MODE_RATIO,
  FEE_MODE_FIXED,
  DEFAULT_LOAN_TERMS,
  normalizeLoanTerms,
  normalizeLoanQuoteTemplates,
  buildLoanQuote,
  summarizePayments,
  describeFeeMode,
} from '@/utils/companyLoanQuote';

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  projectId: { type: String, default: '' },
  projectName: { type: String, default: '' },
  personnelName: { type: String, default: '' },
  personnelPhone: { type: String, default: '' },
  unitOptions: { type: Array, default: () => [] },         // 目前報價清單的戶別
  canManageTemplates: { type: Boolean, default: false },   // 銷控管理權限：可存／刪借貸範本
});
const emit = defineEmits(['update:modelValue']);

const toast = useToast();
const { smAndDown } = useDisplay();
const projectStore = useProjectStore();
const userStore = useUserStore();

const show = computed({
  get: () => props.modelValue,
  set: (v) => emit('update:modelValue', v),
});

// --- 格式化 ---
const esc = (v) => String(v ?? '')
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&#39;');
const fmt = (n, frac = 0) => {
  const num = Number(n);
  if (n === '' || n === null || n === undefined || isNaN(num)) return '-';
  return num.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: frac });
};
const isoTodayTW = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Taipei' }).format(new Date());
const fmtDate = (iso) => (iso ? String(iso).replace(/-/g, '/') : '');

// --- 表單狀態 ---
let feeSeq = 0;
const withId = (fee) => ({ ...fee, id: ++feeSeq });

// 新表單：欄位空白、帶入預設費用；借款條件與費用可由借貸範本帶入
const emptyForm = () => ({
  customerName: '',
  unitId: '',
  templateId: '',
  loanAmountWan: '',
  ...DEFAULT_LOAN_TERMS,
  fees: DEFAULT_LOAN_TERMS.fees.map(withId),
  note: '',
});

const form = ref(emptyForm());
const quoteDate = ref('');

// 建案借貸範本（projects/{id}.companyLoanQuoteTemplates）
const templates = ref([]);
const loadingTemplates = ref(false);

// --- 草稿（本機瀏覽器，依建案分開；讀寫失敗不影響使用） ---
const draftKey = () => `anxi:companyLoanQuote:${props.projectId}`;
function readDraft() {
  try {
    const raw = localStorage.getItem(draftKey());
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}
function writeDraft() {
  try {
    const { fees, ...rest } = form.value;
    localStorage.setItem(draftKey(), JSON.stringify({ ...rest, fees: fees.map(({ id, ...f }) => f) }));
  } catch { /* 無痕模式或儲存空間被封鎖 */ }
}
function clearDraft() {
  try { localStorage.removeItem(draftKey()); } catch { /* ignore */ }
}

// 程式設定表單時暫停草稿寫入
let suppressDraft = false;
async function setForm(next) {
  suppressDraft = true;
  form.value = next;
  await nextTick();
  suppressDraft = false;
}
watch(form, () => {
  if (!suppressDraft) writeDraft();
}, { deep: true });

// 借款條件（範本內容）：年利率／年數／期數／攤還方式／費用
const pickTerms = (src) => ({
  annualRate: src.annualRate,
  years: src.years,
  periods: src.periods,
  amortizationType: src.amortizationType,
  fees: (src.fees || []).map(({ id, ...fee }) => ({ ...fee })),
});
function applyTerms(terms) {
  const t = normalizeLoanTerms(terms);
  Object.assign(form.value, {
    annualRate: t.annualRate,
    years: t.years,
    periods: t.periods,
    amortizationType: t.amortizationType,
    fees: t.fees.map(withId),
  });
}
// 從「不使用」切到範本前記下原本的條件；改回「不使用」時還原（無記錄則回新表單條件）
let preTemplateTerms = null;

function formFromDraft(draft) {
  const t = normalizeLoanTerms(draft);
  return {
    ...emptyForm(),
    customerName: String(draft.customerName ?? ''),
    unitId: String(draft.unitId ?? ''),
    templateId: String(draft.templateId ?? ''),
    loanAmountWan: draft.loanAmountWan ?? '',
    note: String(draft.note ?? ''),
    ...t,
    fees: t.fees.map(withId),
  };
}

async function loadTemplates() {
  loadingTemplates.value = true;
  try {
    const data = await projectStore.fetchProjectSettings(props.projectId);
    templates.value = normalizeLoanQuoteTemplates(data?.companyLoanQuoteTemplates);
    // 草稿選著的範本已被刪除 → 改為不使用（保留目前數值）
    if (form.value.templateId && !templates.value.some(t => t.id === form.value.templateId)) {
      form.value.templateId = '';
    }
  } catch (e) {
    console.error('[CompanyLoanQuoteDialog] 載入借貸範本失敗:', e);
    templates.value = [];
  } finally {
    loadingTemplates.value = false;
  }
}

// 開啟：有草稿 → 還原；否則空白表單。範本清單每次重新讀取
watch(show, async (visible) => {
  if (!visible) return;
  quoteDate.value = isoTodayTW();
  preTemplateTerms = null;
  const draft = readDraft();
  await setForm(draft ? formFromDraft(draft) : emptyForm());
  loadTemplates();
}, { immediate: true });

async function resetForm() {
  clearDraft();
  preTemplateTerms = null;
  await setForm(emptyForm());
}

function addFee() {
  form.value.fees.push(withId({ name: '', mode: FEE_MODE_FIXED, value: '' }));
}

// v-model 綁定：範本清單增刪時選取狀態仍與 templateId 同步
const templateSelect = computed({
  get: () => form.value.templateId,
  set: (id) => applyTemplate(id),
});
function applyTemplate(id) {
  const t = templates.value.find(x => x.id === id);
  if (t && !form.value.templateId) preTemplateTerms = pickTerms(form.value);
  form.value.templateId = t ? id : '';
  applyTerms(t || preTemplateTerms || DEFAULT_LOAN_TERMS);
  if (!t) preTemplateTerms = null;
}

// --- 借貸範本管理（銷控管理權限）：讀最新清單 → 修改 → 寫回建案文件 ---
async function writeTemplates(mutate) {
  const data = await projectStore.fetchProjectSettings(props.projectId);
  const next = mutate(normalizeLoanQuoteTemplates(data?.companyLoanQuoteTemplates));
  await projectStore.updateProjectSettings(props.projectId, { companyLoanQuoteTemplates: next });
  templates.value = normalizeLoanQuoteTemplates(next);
}

const saveTplVisible = ref(false);
const saveTplName = ref('');
const savingTemplate = ref(false);
const saveTplExists = computed(() => templates.value.some(t => t.name === saveTplName.value.trim()));
function openSaveTemplate() {
  saveTplName.value = templates.value.find(t => t.id === form.value.templateId)?.name || '';
  saveTplVisible.value = true;
}
async function saveTemplate() {
  const name = saveTplName.value.trim();
  if (!name || savingTemplate.value) return;
  savingTemplate.value = true;
  try {
    const record = {
      ...pickTerms(form.value),
      updatedBy: userStore.user?.name || '',
      updatedAt: new Date().toISOString(),
    };
    let savedId = '';
    await writeTemplates((list) => {
      const same = list.find(t => t.name === name);
      savedId = same ? same.id : `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
      return [...list.filter(t => t.id !== savedId), { ...record, id: savedId, name }];
    });
    // 從「不使用」狀態存檔：記下目前條件，之後改回「不使用」仍是這組數值
    if (!form.value.templateId) preTemplateTerms = pickTerms(form.value);
    form.value.templateId = savedId;
    toast.success(`已儲存範本「${name}」`);
    saveTplVisible.value = false;
  } catch (e) {
    toast.error(`儲存失敗：${e.message}`);
  } finally {
    savingTemplate.value = false;
  }
}

const deleteTplVisible = ref(false);
const deletingTemplate = ref(false);
const selectedTemplateName = computed(() => templates.value.find(t => t.id === form.value.templateId)?.name || '');
async function deleteTemplate() {
  const id = form.value.templateId;
  if (!id || deletingTemplate.value) return;
  deletingTemplate.value = true;
  try {
    await writeTemplates(list => list.filter(t => t.id !== id));
    // 刪除後改為不使用，保留目前數值
    form.value.templateId = '';
    preTemplateTerms = null;
    toast.success('已刪除範本');
    deleteTplVisible.value = false;
  } catch (e) {
    toast.error(`刪除失敗：${e.message}`);
  } finally {
    deletingTemplate.value = false;
  }
}

// --- AI 優化備註（Gemini，Cloud Function optimizeInteractionLog 的 quoteNote 用途） ---
const isOptimizing = ref(false);
const optimizeVisible = ref(false);
const optimizedNote = ref('');
async function optimizeNote() {
  const text = String(form.value.note || '').trim();
  if (!text || isOptimizing.value) return;
  isOptimizing.value = true;
  try {
    const res = await optimizeInteractionLog({ text, purpose: 'quoteNote' });
    if (res.data?.status === 'success' && res.data.optimizedText) {
      optimizedNote.value = res.data.optimizedText;
      optimizeVisible.value = true;
    } else {
      toast.error('優化失敗，請稍後再試');
    }
  } catch (e) {
    console.error('[CompanyLoanQuoteDialog] AI 優化失敗:', e);
    toast.error(e.message || 'AI 服務暫時無法使用');
  } finally {
    isOptimizing.value = false;
  }
}
function applyOptimizedNote() {
  form.value.note = optimizedNote.value.trim();
  optimizeVisible.value = false;
  toast.success('備註已更新');
}

// --- 計算 ---
const quote = computed(() => buildLoanQuote(form.value));
const schedule = computed(() => quote.value.schedule);

const intervalText = computed(() => {
  const m = Number(schedule.value?.intervalMonths) || 0;
  if (m <= 0) return '';
  return `每 ${Number.isInteger(m) ? m : m.toFixed(1)} 個月一期`;
});

const paymentSummary = computed(() => summarizePayments(schedule.value?.rows));
const paymentText = computed(() => {
  const s = paymentSummary.value;
  if (!s) return '—';
  if (s.fixed !== undefined) return `${fmt(s.fixed)}${s.last !== null ? `（末期 ${fmt(s.last)}）` : ''}`;
  return `${fmt(s.first)} → ${fmt(s.last)}`;
});

// =================================================================
// A4 直式報價單：內容以區塊排入，攤還表逐列分頁（每頁重印表頭）
// =================================================================
function buildSheetBlocks() {
  const f = form.value;
  const q = quote.value;
  const s = q.schedule;
  const ps = paymentSummary.value;

  const payBand = ps.fixed !== undefined
    ? `<b>${fmt(ps.fixed)}</b><i>元</i>${ps.last !== null ? `<small>末期 ${fmt(ps.last)} 元</small>` : ''}`
    : `<small>首期</small><b>${fmt(ps.first)}</b><i>元</i><small>逐期遞減至末期 ${fmt(ps.last)} 元</small>`;

  const fees = q.fees.filter(fee => String(fee.name || '').trim() || fee.amount > 0);
  const totals = `
    <div class="totals">
      <div class="tot"><span>借款本金</span><b>${fmt(s.totals.principal)}</b></div>
      <div class="tot"><span>利息合計</span><b>${fmt(s.totals.interest)}</b></div>
      <div class="tot"><span>費用合計</span><b>${fmt(q.feeTotal)}</b></div>
      <div class="tot grand"><span>總計（本利＋費用）</span><b>${fmt(q.grandTotal)}</b></div>
    </div>`;
  // 有費用：費用明細靠左、總計直排靠右；無費用：總計橫排
  const feeTotalsBlock = fees.length ? `
  <section class="blk fee-wrap">
    <div>
      <div class="sec-title">費用明細<span class="sec-sub">一次付清，不含於每期金額</span></div>
      <table class="tbl fee-tbl">
        <thead><tr><th>項目</th><th>計算方式</th><th>金額(元)</th></tr></thead>
        <tbody>${fees.map(fee => `
          <tr><td>${esc(String(fee.name || '').trim() || '其他費用')}</td><td>${esc(describeFeeMode(fee))}</td><td class="num">${fmt(fee.amount)}</td></tr>`).join('')}
          <tr class="sum"><td colspan="2">費用合計</td><td class="num">${fmt(q.feeTotal)}</td></tr>
        </tbody>
      </table>
    </div>
    ${totals.replace('class="totals"', 'class="totals stack"')}
  </section>` : `
  <section class="blk">${totals}</section>`;

  const interval = Number(s.intervalMonths) || 0;
  const intervalLabel = Number.isInteger(interval) ? interval : interval.toFixed(1);

  return `
  <header class="blk head">
    <div>
      <div class="proj">${esc(props.projectName)}</div>
      <div class="sub">報價日期：${fmtDate(quoteDate.value) || '—'}</div>
    </div>
    <div class="doc-title">公司借貸報價單</div>
  </header>

  <section class="blk">
    <div class="grid">
      <div class="cell"><span class="lbl">客戶姓名</span><span class="val">${esc(f.customerName)}</span></div>
      <div class="cell"><span class="lbl">戶別</span><span class="val">${esc(f.unitId)}</span></div>
      <div class="cell"><span class="lbl">借款金額</span><span class="val">${fmt(f.loanAmountWan, 4)} 萬<small>（${fmt(q.loanAmount)} 元）</small></span></div>
      <div class="cell"><span class="lbl">年利率</span><span class="val">${fmt(f.annualRate, 4)} %</span></div>
      <div class="cell"><span class="lbl">年數／期數</span><span class="val">${fmt(f.years, 2)} 年 ${s.rows.length} 期<small>（每 ${intervalLabel} 個月一期）</small></span></div>
      <div class="cell"><span class="lbl">攤還方式</span><span class="val">${esc(f.amortizationType)}</span></div>
    </div>
    <div class="pay-band"><span class="pb-label">每期金額</span><span class="pb-val">${payBand}</span></div>
  </section>
  ${feeTotalsBlock}

  <section class="blk split">
    <div class="sec-title">攤還表<span class="sec-sub">單位：元</span></div>
    <table class="tbl loan-tbl">
      <thead><tr><th>期別</th><th>本金</th><th>利息</th><th>每期金額</th><th>剩餘本金</th></tr></thead>
      <tbody>${s.rows.map(r => `
        <tr><td>${r.period}</td><td class="num">${fmt(r.principal)}</td><td class="num">${fmt(r.interest)}</td><td class="num pay">${fmt(r.payment)}</td><td class="num rem">${fmt(r.remaining)}</td></tr>`).join('')}
        <tr class="sum"><td>合計</td><td class="num">${fmt(s.totals.principal)}</td><td class="num">${fmt(s.totals.interest)}</td><td class="num pay">${fmt(s.totals.payment)}</td><td></td></tr>
      </tbody>
    </table>
  </section>
  ${String(f.note || '').trim() ? `
  <section class="blk">
    <div class="sec-title">備註</div>
    <div class="note">${esc(String(f.note).trim())}</div>
  </section>` : ''}`;
}

const SHEET_CSS = `
  * { margin: 0; padding: 0; box-sizing: border-box; }
  html, body { background: #e3e6e8; }
  body {
    font-family: "Noto Sans TC", "Microsoft JhengHei", "PingFang TC", sans-serif;
    color: #263238;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  #src { display: none; }
  .sheet {
    width: 210mm; height: 296mm;
    margin: 5mm auto; padding: 12mm 13mm 9mm;
    background: #fff; box-shadow: 0 2px 10px rgba(0,0,0,.25);
    display: flex; flex-direction: column;
    overflow: hidden;
  }
  .content { flex: 1 1 auto; min-height: 0; overflow: hidden; }
  .inner { transform-origin: top left; }
  .blk { margin-bottom: 4mm; }
  .head {
    display: flex; justify-content: space-between; align-items: flex-end;
    padding-bottom: 3mm; border-bottom: 2.5px solid #1a3c6e;
  }
  .proj { font-size: 18pt; font-weight: 700; color: #1a3c6e; line-height: 1.25; }
  .sub { margin-top: 1mm; font-size: 10pt; color: #607d8b; }
  .doc-title { font-size: 17pt; font-weight: 700; letter-spacing: 2px; color: #1a3c6e; white-space: nowrap; }
  .sec-title {
    display: flex; align-items: baseline; gap: 3mm;
    margin-bottom: 2mm; padding-left: 2.5mm;
    border-left: 4px solid #1a3c6e;
    font-size: 12pt; font-weight: 700; color: #1a3c6e;
  }
  .sec-title.cont::after { content: '（續）'; font-weight: 500; }
  .sec-sub { font-size: 9pt; font-weight: 400; color: #78909c; }
  .grid {
    display: grid; grid-template-columns: 1fr 1fr;
    border: 1px solid #cfd8dc; border-bottom: 0; border-radius: 4px; overflow: hidden;
  }
  .cell { display: flex; min-height: 8.5mm; border-bottom: 1px solid #cfd8dc; }
  .cell:nth-child(odd) { border-right: 1px solid #cfd8dc; }
  .cell .lbl {
    display: flex; align-items: center; flex-shrink: 0; width: 27mm; padding: 0 3mm;
    background: #f3f6f8; font-size: 10pt; color: #546e7a;
  }
  .cell .val { display: flex; align-items: center; flex-wrap: wrap; gap: 1mm; padding: 1mm 3mm; font-size: 11.5pt; font-weight: 600; }
  .cell .val small { font-size: 9.5pt; font-weight: 400; color: #607d8b; }
  .pay-band {
    display: flex; align-items: center; justify-content: space-between; gap: 4mm;
    margin-top: 2.5mm; padding: 2.5mm 5mm;
    background: #1a3c6e; color: #fff; border-radius: 4px;
  }
  .pb-label { font-size: 12pt; font-weight: 700; letter-spacing: 2px; }
  .pb-val { display: flex; align-items: baseline; flex-wrap: wrap; justify-content: flex-end; gap: 1.5mm; }
  .pb-val b { font-size: 19pt; line-height: 1.2; }
  .pb-val i { font-style: normal; font-size: 11pt; }
  .pb-val small { font-size: 9.5pt; opacity: .85; }
  .tbl { width: 100%; border-collapse: collapse; font-size: 10.5pt; line-height: 1.35; }
  .tbl th {
    padding: 1.2mm 2.5mm; background: #eef2f5; color: #455a64;
    font-size: 9.5pt; font-weight: 600; border: 1px solid #cfd8dc;
  }
  .tbl td { padding: 1mm 2.5mm; border: 1px solid #cfd8dc; text-align: center; }
  .loan-tbl th, .loan-tbl td { white-space: nowrap; }
  .loan-cols { display: flex; align-items: flex-start; gap: 3mm; }
  .loan-col { flex: 1 1 0; min-width: 0; }
  .sheet .content .loan-cols .loan-tbl th,
  .sheet .content .loan-cols .loan-tbl td { padding-left: 1.6mm; padding-right: 1.6mm; }
  .tbl td.num { text-align: right; font-variant-numeric: tabular-nums; }
  .tbl td.pay { font-weight: 700; color: #1a3c6e; }
  .tbl td.rem { color: #607d8b; }
  .tbl tr.sum td { background: #f3f6f8; font-weight: 700; }
  .fee-tbl td:first-child { text-align: left; }
  .fee-tbl td:nth-child(2) { color: #607d8b; font-size: 9.5pt; }
  .fee-wrap { display: grid; grid-template-columns: minmax(0, 1fr) 60mm; gap: 4mm; align-items: end; }
  .totals { display: grid; grid-template-columns: repeat(4, 1fr); gap: 2.5mm; }
  .totals.stack { grid-template-columns: 1fr; gap: 1.5mm; }
  .tot {
    display: flex; flex-direction: column; gap: 0.5mm;
    padding: 2mm 3mm; border: 1px solid #cfd8dc; border-radius: 4px;
  }
  .totals.stack .tot { flex-direction: row; justify-content: space-between; align-items: baseline; gap: 2mm; padding: 1.6mm 3mm; }
  .totals.stack .tot span { white-space: nowrap; }
  .tot span { font-size: 9pt; color: #607d8b; }
  .tot b { font-size: 13pt; font-variant-numeric: tabular-nums; }
  .tot.grand { background: #fdf6e3; border-color: #e0c27a; }
  .tot.grand b { color: #8a5a00; }
  .note {
    padding: 2.5mm 4mm; border: 1px solid #cfd8dc; border-radius: 4px;
    font-size: 10.5pt; line-height: 1.7; white-space: pre-wrap;
  }
  .foot {
    flex-shrink: 0; display: flex; justify-content: space-between; align-items: center;
    padding-top: 2.5mm; border-top: 1px solid #cfd8dc;
    font-size: 10pt; color: #546e7a;
  }
  .foot b { color: #263238; }

  /* 緊湊模式：原尺寸放不下時收斂間距與字級，讓縮放比盡量維持大字 */
  .sheet.compact .blk { margin-bottom: 2.5mm; }
  .sheet.compact .head { padding-bottom: 2mm; }
  .sheet.compact .proj { font-size: 16pt; }
  .sheet.compact .doc-title { font-size: 15pt; }
  .sheet.compact .sec-title { margin-bottom: 1.2mm; font-size: 11pt; }
  .sheet.compact .cell { min-height: 7mm; }
  .sheet.compact .cell .val { padding: 0.6mm 3mm; font-size: 11pt; }
  .sheet.compact .pay-band { margin-top: 2mm; padding: 1.8mm 5mm; }
  .sheet.compact .pb-val b { font-size: 17pt; }
  .sheet.compact .tbl th { padding: 0.8mm 2mm; }
  .sheet.compact .tbl td { padding: 0.6mm 2mm; }
  .sheet.compact .tot { padding: 1.4mm 3mm; }
  .sheet.compact .totals.stack .tot { padding: 1.1mm 3mm; }
  .sheet.compact .note { padding: 1.5mm 3mm; line-height: 1.5; }
  @page { size: A4 portrait; margin: 0; }
  @media print {
    html, body { background: #fff; }
    .sheet { margin: 0 auto; box-shadow: none; page-break-after: always; }
    .sheet:last-child { page-break-after: auto; }
  }
`;

// 排版腳本：盡量單頁
//   1) 依序嘗試攤還表 1／2／3 欄；原尺寸放不下先進緊湊模式，再二分搜尋可容納的最大縮放比
//      （寬度反向放大 → 縮放後恰為頁寬；表格橫向撐破也算放不下）
//   2) 取縮放比最大者（多欄需明顯勝出才採用）；縮到 MIN_ONE 仍放不下才分頁（多欄＋縮放，每頁重印表頭）
const LAYOUT_SCRIPT = `
  var MAX_UP = 1.25, MIN_ONE = 0.6;
  var src = document.getElementById('src');
  var pages = document.getElementById('pages');
  var footHtml = document.getElementById('foot').innerHTML;
  var blocks = Array.prototype.slice.call(src.children);
  var splitBlk = src.querySelector('.split');
  var allRows = Array.prototype.slice.call(splitBlk.querySelectorAll('tbody > tr'));
  var tpl = splitBlk.cloneNode(true);
  tpl.querySelector('tbody').innerHTML = '';
  var sheet, content, inner;

  function newSheet(compact) {
    sheet = document.createElement('div');
    sheet.className = compact ? 'sheet compact' : 'sheet';
    sheet.innerHTML = '<div class="content"><div class="inner"></div></div><div class="foot"><span>' + footHtml + '</span><span class="pno"></span></div>';
    pages.appendChild(sheet);
    content = sheet.querySelector('.content');
    inner = sheet.querySelector('.inner');
  }

  // --- 單頁：攤還表分 c 欄（合計列放在最後一欄） ---
  function buildSingle(c, compact) {
    pages.innerHTML = '';
    newSheet(compact);
    blocks.forEach(function (blk) {
      if (blk !== splitBlk) { inner.appendChild(blk.cloneNode(true)); return; }
      var part = tpl.cloneNode(true);
      var table = part.querySelector('table');
      var per = Math.ceil(allRows.length / c);
      var cols = document.createElement('div');
      cols.className = 'loan-cols';
      for (var i = 0; i < c; i++) {
        var slice = allRows.slice(i * per, (i + 1) * per);
        if (!slice.length) break;
        var col = document.createElement('div');
        col.className = 'loan-col';
        var t = table.cloneNode(true);
        var body = t.querySelector('tbody');
        slice.forEach(function (r) { body.appendChild(r.cloneNode(true)); });
        col.appendChild(t);
        cols.appendChild(col);
      }
      table.parentNode.replaceChild(cols, table);
      inner.appendChild(part);
    });
  }
  function measure(s) {
    inner.style.width = (100 / s) + '%';
    inner.style.transform = 'scale(' + s + ')';
    return inner.scrollHeight * s;
  }
  function fits(s) {
    if (measure(s) > content.clientHeight + 0.5) return false;
    var ts = inner.querySelectorAll('table');
    for (var i = 0; i < ts.length; i++) {
      if (ts[i].offsetWidth > ts[i].parentElement.clientWidth + 1) return false;
    }
    return true;
  }
  function bestScale() {
    if (fits(MAX_UP)) return MAX_UP;
    if (!fits(MIN_ONE)) return 0;
    var lo = MIN_ONE, hi = MAX_UP;
    for (var i = 0; i < 12; i++) {
      var mid = (lo + hi) / 2;
      if (fits(mid)) lo = mid; else hi = mid;
    }
    return lo;
  }
  function trySingle(c) {
    buildSingle(c, false);
    var compact = !fits(1);
    if (compact) buildSingle(c, true);
    return { c: c, compact: compact, s: bestScale() };
  }

  // --- 分頁（單頁縮到下限仍放不下時）：沿用多欄與縮放，逐頁填滿各欄，換頁重印標題與表頭 ---
  function setScale(sc) {
    inner.style.width = (100 / sc) + '%';
    inner.style.transform = 'scale(' + sc + ')';
  }
  // 頁尾字級隨內容縮小（最小 0.8 倍），避免頁尾比內容大太多
  function scaleFoot(sc) {
    sheet.querySelector('.foot').style.fontSize = (10 * Math.min(1, Math.max(sc, 0.8))) + 'pt';
  }
  function paginate(c, sc) {
    pages.innerHTML = '';
    function page() { newSheet(true); setScale(sc); scaleFoot(sc); }
    function over() { return inner.scrollHeight * sc > content.clientHeight + 0.5; }
    page();
    blocks.forEach(function (blk) {
      if (blk !== splitBlk) {
        inner.appendChild(blk.cloneNode(true));
        if (over() && inner.children.length > 1) {
          inner.removeChild(inner.lastChild);
          page();
          inner.appendChild(blk.cloneNode(true));
        }
        return;
      }
      var idx = 0;
      while (idx < allRows.length) {
        var part = tpl.cloneNode(true);
        if (idx > 0) { var t = part.querySelector('.sec-title'); if (t) t.classList.add('cont'); }
        var table = part.querySelector('table');
        var cols = document.createElement('div');
        cols.className = 'loan-cols';
        var bodies = [];
        for (var i = 0; i < c; i++) {
          var col = document.createElement('div');
          col.className = 'loan-col';
          var tc = table.cloneNode(true);
          bodies.push(tc.querySelector('tbody'));
          col.appendChild(tc);
          cols.appendChild(col);
        }
        table.parentNode.replaceChild(cols, table);
        inner.appendChild(part);
        // 每欄容量：先填第一欄到超出為止
        var m = 0;
        while (idx + m < allRows.length) {
          bodies[0].appendChild(allRows[idx + m].cloneNode(true));
          if (over()) { bodies[0].removeChild(bodies[0].lastChild); break; }
          m++;
        }
        if (m === 0) {
          inner.removeChild(part);
          if (inner.children.length === 0) m = 1; // 空白頁仍放不下一列：強制放一列避免無限迴圈
          else { page(); continue; }
          inner.appendChild(part);
        }
        // 剩餘列數放得下本頁 → 各欄平均；否則每欄放滿 m 列
        var remaining = allRows.length - idx;
        var per = remaining <= c * m ? Math.ceil(remaining / c) : m;
        bodies[0].innerHTML = '';
        for (var k = 0; k < c; k++) {
          for (var j = 0; j < per && idx < allRows.length; j++) {
            bodies[k].appendChild(allRows[idx].cloneNode(true));
            idx++;
          }
        }
        // 移除沒有資料的欄
        bodies.forEach(function (b) { if (!b.children.length) cols.removeChild(b.closest('.loan-col')); });
        if (idx < allRows.length) page();
      }
    });
  }
  // 分頁時的欄數與縮放：欄數取 3（列數夠多時），縮放取表格不橫向撐破的最大值（上限 1）
  function widthOk(sc) {
    setScale(sc);
    var ts = inner.querySelectorAll('table');
    for (var i = 0; i < ts.length; i++) {
      if (ts[i].offsetWidth > ts[i].parentElement.clientWidth + 1) return false;
    }
    return true;
  }
  function paginateFallback() {
    var c = allRows.length >= 21 ? 3 : 1;
    buildSingle(c, true);
    var sc = 1;
    if (!widthOk(1)) {
      var lo = MIN_ONE, hi = 1;
      for (var i = 0; i < 10; i++) {
        var mid = (lo + hi) / 2;
        if (widthOk(mid)) lo = mid; else hi = mid;
      }
      sc = lo;
    }
    paginate(c, sc);
  }

  var best = trySingle(1);
  [2, 3].forEach(function (c) {
    if (allRows.length < c * 7) return; // 每欄至少 7 列才分欄
    var r = trySingle(c);
    if (r.s > best.s + 0.04) best = r;
  });
  if (best.s > 0) {
    buildSingle(best.c, best.compact);
    measure(best.s);
    scaleFoot(best.s);
  } else {
    paginateFallback();
  }

  var sheets = pages.querySelectorAll('.sheet');
  if (sheets.length > 1) {
    Array.prototype.forEach.call(sheets, function (s, i) {
      s.querySelector('.pno').textContent = '第 ' + (i + 1) + ' / ' + sheets.length + ' 頁';
    });
  }`;

// autoPrint：載入後自動叫出列印；fitZoom：預覽用，整頁縮放到符合視窗寬與高
function buildSheetsHtml({ autoPrint = false, fitZoom = false } = {}) {
  if (!schedule.value) return '';
  // 預覽：transform 等比縮放到符合視窗寬與高（不重排，版面與列印一致），視窗大小改變時重算
  const zoomScript = fitZoom ? PREVIEW_FIT_SCRIPT : '';
  const printScript = autoPrint ? '\n  window.focus();\n  window.print();' : '';
  const foot = `銷售顧問：<b>${esc(props.personnelName || '—')}</b>　聯絡電話：<b>${esc(props.personnelPhone || '—')}</b>`;

  return `<!DOCTYPE html>
<html lang="zh-Hant">
<head>
<meta charset="utf-8">
<title>${esc(props.projectName)} 公司借貸報價單</title>
<style>${SHEET_CSS}</style>
</head>
<body>
<div id="src">${buildSheetBlocks()}</div>
<div id="pages"></div>
<template id="foot">${foot}</template>
<script>
window.onload = function () {${LAYOUT_SCRIPT}${zoomScript}${printScript}
};
<\/script>
</body>
</html>`;
}

function handlePrint() {
  const html = buildSheetsHtml({ autoPrint: true });
  if (!html) return;
  const win = window.open('', '_blank');
  if (!win) {
    toast.error('無法開啟列印視窗，請允許彈出視窗後再試一次。');
    return;
  }
  win.document.open();
  win.document.write(html);
  win.document.close();
}

const isPreviewVisible = ref(false);
const previewHtml = ref('');
function openPreview() {
  const html = buildSheetsHtml({ fitZoom: true });
  if (!html) return;
  previewHtml.value = html;
  isPreviewVisible.value = true;
}

// PDF 檔名：YYYYMMDD-建案-戶別(或客戶)-報價人員-公司借貸報價單.pdf
const safeName = (text, fallback) => String(text ?? '')
  .replace(/[\\/:*?"<>|]/g, '_')
  .replace(/[\u0000-\u001f]/g, '')
  .replace(/\s+/g, ' ')
  .trim() || fallback;
function buildPdfFileName() {
  const day = (quoteDate.value || isoTodayTW()).replace(/-/g, '');
  const who = safeName(form.value.unitId || form.value.customerName, '未指定');
  return `${day}-${safeName(props.projectName, '未命名建案')}-${who}-${safeName(props.personnelName, '未選擇報價人員')}-公司借貸報價單.pdf`;
}

const A4_W_PT = 595.28;
const A4_H_PT = 841.89;
const isDownloadingPdf = ref(false);

// 以隱藏 iframe 重新渲染（不受預覽縮放影響），逐頁截圖嵌入 A4 PDF
async function downloadPdf() {
  const html = buildSheetsHtml({});
  if (!html || isDownloadingPdf.value) return;
  isDownloadingPdf.value = true;

  const iframe = document.createElement('iframe');
  iframe.style.cssText = 'position:fixed;left:-10000px;top:0;width:900px;height:1400px;border:0;';
  document.body.appendChild(iframe);

  try {
    await new Promise((resolve) => {
      iframe.onload = () => resolve();
      iframe.srcdoc = html;
    });
    await new Promise((r) => setTimeout(r, 300));

    const sheetEls = Array.from(iframe.contentDocument?.querySelectorAll('.sheet') || []);
    if (sheetEls.length === 0) throw new Error('無可輸出的頁面');

    const pdf = new jsPDF({ unit: 'pt', format: 'a4', orientation: 'portrait' });
    for (let i = 0; i < sheetEls.length; i++) {
      const canvas = await html2canvas(sheetEls[i], {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: false,
      });
      if (i > 0) pdf.addPage();
      const imgH = A4_W_PT * (canvas.height / canvas.width);
      pdf.addImage(canvas.toDataURL('image/jpeg', 0.92), 'JPEG', 0, 0, A4_W_PT, Math.min(imgH, A4_H_PT));
    }
    pdf.save(buildPdfFileName());
    toast.success('公司借貸報價單 PDF 已下載');
  } catch (e) {
    console.error('[CompanyLoanQuoteDialog] 下載 PDF 失敗:', e);
    toast.error('PDF 產生失敗，請稍後重試。');
  } finally {
    iframe.remove();
    isDownloadingPdf.value = false;
  }
}
</script>

<style scoped>
.lq-body { padding: 0 !important; }
.lq-layout {
  display: grid;
  grid-template-columns: minmax(0, 500px) minmax(0, 1fr);
  height: min(72vh, 760px);
}
.lq-form {
  overflow-y: auto;
  padding: 0 16px 16px;
  border-right: 1px solid rgba(0, 0, 0, 0.08);
}
.lq-result {
  display: flex;
  flex-direction: column;
  min-height: 0;
  padding: 16px;
  background: #fff;
}
.lq-row-sub { font-size: 12px; color: #6e6e73; white-space: nowrap; }
.lq-tpl-row { flex-wrap: wrap; }
.lq-tpl-row > .lq-tpl-select { flex: 1 1 140px; max-width: none; margin-left: 0; }
.lq-dlg-body { padding: 4px 16px 16px; }
.lq-ai-orig {
  max-height: 140px;
  font-size: 13px;
  overflow-y: auto;
  color: #6e6e73;
  line-height: 1.6;
  white-space: pre-wrap;
}
.lq-seg-right { margin-left: auto; }

/* 費用列：名稱｜千分之/金額｜數值｜計算金額｜移除；窄螢幕自動換行 */
.lq-fee-row { flex-wrap: wrap; gap: 8px; }
.lq-fee-name { flex: 1 1 96px; }
.lq-fee-seg { min-width: 0; padding: 0 9px; font-size: 12px; }
.lq-fee-row > .lq-fee-value { flex: 0 0 92px; max-width: 92px; margin-left: 0; }
.lq-fee-amount {
  min-width: 70px;
  margin-left: auto;
  text-align: right;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
}
.lq-fee-total { background: #fafafc; }

.lq-tiles {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 8px;
  margin-bottom: 12px;
}
.lq-tile {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 8px 10px;
  border-radius: 8px;
  background: #f5f5f7;
}
.lq-tile--main {
  grid-column: 1 / -1;
  background: #1a3c6e;
  color: #fff;
}
.lq-tile--main .lq-tile-label { color: rgba(255, 255, 255, 0.75); }
.lq-tile--main .lq-tile-value { font-size: 22px; }
.lq-tile--total { background: #fdf6e3; }
.lq-tile--total .lq-tile-value { color: #8a5a00; }
.lq-tile-label { font-size: 11.5px; color: #6e6e73; }
.lq-tile-value { font-size: 15px; font-weight: 700; font-variant-numeric: tabular-nums; }

.lq-table-wrap {
  flex: 1 1 auto;
  min-height: 0;
  overflow: auto;
  border: 1px solid #e5e5ea;
  border-radius: 8px;
}
.lq-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}
.lq-table th {
  position: sticky;
  top: 0;
  z-index: 1;
  padding: 7px 10px;
  background: #f6f6f8;
  color: #6e6e73;
  font-size: 12px;
  font-weight: 600;
  text-align: right;
  border-bottom: 1px solid #e5e5ea;
}
.lq-table td {
  padding: 6px 10px;
  text-align: right;
  border-bottom: 1px solid #f0f0f3;
}
.lq-table th:first-child,
.lq-table td:first-child { text-align: center; }
.lq-table tfoot td {
  position: sticky;
  bottom: 0;
  background: #f6f6f8;
  font-weight: 700;
  border-top: 1px solid #e5e5ea;
  border-bottom: 0;
}
.lq-pay { font-weight: 700; color: #1a3c6e; }
.lq-rem { color: #8e8e93; }

.lq-empty {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  color: #8e8e93;
  font-size: 13px;
}

.lq-preview-head { flex-shrink: 0; padding-left: 8px; }
.lq-preview-close { margin-left: 0; }
.lq-preview-actions { display: flex; align-items: center; gap: 8px; margin-left: auto; }
.lq-preview-frame {
  width: 100%;
  min-height: 0;
  border: 0;
  background: #e3e6e8;
}

@media (max-width: 960px) {
  .lq-layout {
    grid-template-columns: minmax(0, 1fr);
    height: auto;
  }
  .lq-form { overflow: visible; border-right: 0; }
  .lq-result { padding-top: 4px; }
  .lq-tiles { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .lq-table-wrap { max-height: 60vh; }
}
/* 手機：費用名稱獨佔一行；重設／存預設一列，預覽／PDF／列印一列平分 */
@media (max-width: 600px) {
  .lq-fee-name { flex-basis: 100%; }
  .lq-table { font-size: 12px; }
  .lq-table th, .lq-table td { padding-left: 6px; padding-right: 6px; }
  .lq-fee-total .mac-form-row-label { width: auto; }
  .lq-foot .mac-spacer { flex-basis: 100%; height: 0; }
  .lq-foot .lq-act { flex: 1 1 0; }
}
</style>
