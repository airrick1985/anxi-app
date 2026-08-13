<template>
  <v-dialog :model-value="show" @update:model-value="$emit('update:show', $event)"
    :fullscreen="isMobile" :max-width="isMobile ? '100%' : '1550px'" scrollable
    transition="dialog-bottom-transition">
    <v-card class="d-flex flex-column" :style="{ height: isMobile ? '100dvh' : '95vh' }">
      <v-card-title class="pa-4">
        <v-row align="center" no-gutters>
          <v-col>
            <span class="text-h5">
              <v-icon start>mdi-file-document-edit-outline</v-icon>
              合約製作設定 - {{ unitCtx.unitId }}
            </span>
          </v-col>
          <v-col class="text-right">
            <v-btn icon="mdi-close" variant="text" @click="$emit('update:show', false)" />
          </v-col>
        </v-row>
      </v-card-title>
      <v-divider />

      <v-tabs v-if="isMobile" v-model="mobileTab" grow color="secondary" density="compact">
        <v-tab value="edit"><v-icon start size="small">mdi-pencil-ruler</v-icon>資料編輯</v-tab>
        <v-tab value="preview"><v-icon start size="small">mdi-eye-outline</v-icon>預覽</v-tab>
      </v-tabs>
      <v-divider v-if="isMobile" />

      <v-card-text style="overflow-y: auto; flex-grow: 1;" :class="isMobile ? 'pa-2 bg-grey-lighten-4' : 'pa-4 bg-grey-lighten-4'">
        <!-- 載入中 / 未設定 -->
        <div v-if="loading" class="d-flex justify-center pa-8">
          <v-progress-circular indeterminate color="primary" />
        </div>
        <v-alert v-else-if="!config" type="info" variant="tonal" class="ma-4">
          本建案尚未設定「合約製作範本」。請由超級管理員 / 系統管理員至「銷控設定 → 合約製作範本」建立後再使用。
        </v-alert>

        <v-row v-else :no-gutters="isMobile">
          <!-- ================= 左欄：編輯 ================= -->
          <v-col cols="12" lg="5" v-show="!isMobile || mobileTab === 'edit'" :class="isMobile ? '' : 'pr-3'">

            <!-- 頁面清單 -->
            <v-card elevation="2" class="mb-4">
              <v-card-item class="editor-header">
                <v-card-title class="text-subtitle-1">
                  <v-icon start size="small">mdi-file-multiple-outline</v-icon>
                  匯出頁面（勾選與排序）
                </v-card-title>
              </v-card-item>
              <v-divider />
              <v-card-text class="pa-2">
                <draggable v-model="localPages" item-key="id" handle=".drag-handle">
                  <template #item="{ element: page, index: idx }">
                    <div class="d-flex align-center page-row px-2">
                      <v-icon class="drag-handle cursor-move mr-1 text-grey" size="small">mdi-drag</v-icon>
                      <v-checkbox-btn v-model="page.enabled" density="compact" class="flex-grow-0"
                        :disabled="pageDisabled(page)" />
                      <v-icon size="small" class="mr-1">{{ pageTypeIcon(page.type) }}</v-icon>
                      <span class="text-body-2 mr-1">{{ page.title }}</span>
                      <v-chip size="x-small" variant="tonal" class="mr-1">
                        {{ page.paper?.size }}{{ page.paper?.orientation === 'landscape' ? '橫' : '直' }}
                      </v-chip>
                      <v-chip v-if="(page.repeatCount || 1) > 1" size="x-small" variant="tonal" color="deep-orange">
                        ×{{ page.repeatCount }} 份
                      </v-chip>
                      <v-chip v-if="(page.pageCopies || 1) > 1" size="x-small" variant="tonal" color="indigo" class="ml-1">
                        {{ page.pageCopies }} 頁
                      </v-chip>
                      <v-tooltip v-if="pageDisabled(page)" location="top" text="無合約圖檔可匯出">
                        <template #activator="{ props: tp }">
                          <v-icon v-bind="tp" size="small" color="warning" class="ml-1">mdi-alert-outline</v-icon>
                        </template>
                      </v-tooltip>
                      <v-spacer />
                      <v-btn icon size="x-small" variant="text" :disabled="idx === 0" @click="movePage(idx, -1)">
                        <v-icon>mdi-arrow-up</v-icon>
                      </v-btn>
                      <v-btn icon size="x-small" variant="text" :disabled="idx === localPages.length - 1" @click="movePage(idx, 1)">
                        <v-icon>mdi-arrow-down</v-icon>
                      </v-btn>
                    </div>
                  </template>
                </draggable>
              </v-card-text>
            </v-card>

            <!-- 期款方式 -->
            <v-card elevation="2" class="mb-4" v-if="needsInstallment">
              <v-card-item class="editor-header">
                <v-card-title class="text-subtitle-1">
                  <v-icon start size="small">mdi-format-list-numbered</v-icon>
                  期款方式（拆款表 / 付款明細表）
                </v-card-title>
              </v-card-item>
              <v-divider />
              <v-card-text>
                <v-skeleton-loader v-if="templatesLoading" type="list-item-two-line@2" />
                <template v-else>
                  <v-row dense>
                    <v-col cols="12" sm="5">
                      <v-select v-model="categoryModel" :items="categoryOptions" label="期款類別"
                        variant="outlined" density="compact" hide-details />
                    </v-col>
                    <v-col cols="12" sm="7">
                      <v-select v-model="templateIdModel" :items="templateOptions"
                        item-title="templateName" item-value="id" label="期款範本"
                        variant="outlined" density="compact" hide-details>
                        <template v-slot:item="{ props: itemProps, item }">
                          <v-list-item v-bind="itemProps" :subtitle="item.raw.subtitle" />
                        </template>
                      </v-select>
                    </v-col>
                  </v-row>
                  <div class="d-flex align-center mt-2">
                    <v-chip v-if="isAutoSelected" size="small" color="success" variant="tonal">
                      <v-icon start size="x-small">mdi-auto-fix</v-icon>自動判斷
                    </v-chip>
                    <v-chip v-else size="small" color="orange" variant="tonal">
                      <v-icon start size="x-small">mdi-hand-back-right-outline</v-icon>手動指定
                    </v-chip>
                    <v-btn v-if="!isAutoSelected" size="x-small" variant="text" color="primary" class="ml-2"
                      @click="resetToAuto">還原自動判斷</v-btn>
                  </div>
                  <v-alert v-if="!activeTemplate" type="info" variant="tonal" density="compact" class="mt-3">
                    無適用期款範本（{{ autoConditionText }}），請至「期款方式範本設定」建立，或手動指定範本。
                  </v-alert>

                  <!-- 期款比例/金額微調 -->
                  <template v-if="editRows.length">
                    <v-divider class="my-3" />
                    <v-table density="compact" class="edit-rows-table">
                      <thead>
                        <tr>
                          <th style="width:72px">比例(%)</th>
                          <th>期別名稱</th>
                          <th style="width:110px" class="text-right">金額(萬)</th>
                        </tr>
                      </thead>
                      <tbody>
                        <template v-for="row in editRows" :key="row.key">
                          <tr>
                            <td :rowspan="row.type === 'group' ? row.children.length + 1 : 1">
                              <v-text-field v-model.number="row.percent" type="number" density="compact"
                                variant="outlined" hide-details
                                @change="recalcAmountFromPercent(row)" />
                            </td>
                            <td class="font-weight-bold">{{ row.name }}</td>
                            <td class="text-right">
                              <template v-if="row.type === 'group'">
                                <span class="font-weight-bold">{{ formatNumber(groupAmount(row)) }}</span>
                              </template>
                              <v-text-field v-else v-model.number="row.amount" type="number" density="compact"
                                variant="outlined" hide-details class="amount-input"
                                @change="recalcPercentFromAmount(row)" />
                            </td>
                          </tr>
                          <template v-if="row.type === 'group'">
                            <tr v-for="child in row.children" :key="child.key">
                              <td class="pl-6 text-body-2">
                                <span v-if="child.seq !== null" class="mr-1">{{ child.seq }}.</span>{{ child.name }}
                              </td>
                              <td class="text-right">
                                <v-text-field v-model.number="child.amount" type="number" density="compact"
                                  variant="outlined" hide-details class="amount-input"
                                  @change="recalcPercentFromAmount(row)" />
                              </td>
                            </tr>
                          </template>
                        </template>
                      </tbody>
                    </v-table>

                    <div class="d-flex flex-wrap align-center ga-2 mt-2">
                      <v-chip size="small" :color="percentOk ? 'success' : 'error'" variant="tonal">
                        比例合計 {{ percentSumText }}%
                      </v-chip>
                      <v-chip size="small" :color="amountOk ? 'success' : 'error'" variant="tonal">
                        金額合計 {{ formatNumber(amountSum) }} / {{ formatNumber(mainBase) }} 萬
                      </v-chip>
                    </div>
                    <div v-if="!amountOk || !percentOk" class="d-flex align-center ga-2 mt-2">
                      <v-select v-model="correctionTargetKey" :items="correctionOptions"
                        item-title="label" item-value="key" density="compact" variant="outlined" hide-details
                        label="差額歸入" style="max-width: 220px;" />
                      <v-btn size="small" color="warning" variant="tonal" @click="applyCorrection">
                        一鍵補正差額
                      </v-btn>
                    </div>

                    <!-- 房/土拆分檢核 -->
                    <v-alert v-if="!splitModel.landOk" type="warning" variant="tonal" density="compact" class="mt-3">
                      各期土地款合計 {{ formatNumber(splitModel.landSum) }} 萬 ≠ 土地價款 {{ formatNumber(splitModel.landTarget) }} 萬。
                      請至「合約製作範本 → 期款拆分規則」調整，或確認戶別房/土比例。
                    </v-alert>
                  </template>
                </template>
              </v-card-text>
            </v-card>

            <!-- 拆款表欄位 -->
            <v-card elevation="2" class="mb-4" v-if="breakdownPage">
              <v-card-item class="editor-header">
                <v-card-title class="text-subtitle-1">
                  <v-icon start size="small">mdi-file-table-outline</v-icon>
                  拆款表欄位
                </v-card-title>
              </v-card-item>
              <v-divider />
              <v-card-text>
                <v-row dense>
                  <v-col cols="12" sm="6">
                    <v-text-field v-model="state.signDate" type="date" label="簽約日期"
                      density="compact" variant="outlined" hide-details clearable />
                  </v-col>
                </v-row>

                <template v-if="(breakdownPage.options?.freeFields || []).length">
                  <div class="text-subtitle-2 mt-3 mb-1">自由輸入欄位</div>
                  <v-row dense>
                    <v-col v-for="f in breakdownPage.options.freeFields" :key="f.key" cols="6" sm="3">
                      <v-text-field v-model="state.freeFieldValues[f.key]"
                        :type="f.type === 'number' ? 'number' : 'text'" :label="f.label"
                        density="compact" variant="outlined" hide-details />
                    </v-col>
                  </v-row>
                </template>

                <template v-if="manualSignFields.length">
                  <div class="text-subtitle-2 mt-3 mb-1">簽核欄</div>
                  <v-row dense>
                    <v-col v-for="f in manualSignFields" :key="f.label" cols="6" sm="3">
                      <v-text-field v-model="state.signFieldValues[f.label]" :label="f.label"
                        density="compact" variant="outlined" hide-details />
                    </v-col>
                    <v-col cols="6" sm="3" class="d-flex align-center">
                      <span class="text-caption text-grey">銷售人員：{{ unitCtx.salespersonText }}（系統帶入）</span>
                    </v-col>
                  </v-row>
                </template>

                <v-text-field v-model="state.breakdownRemark" label="備註" density="compact"
                  variant="outlined" hide-details class="mt-3" />

                <!-- 磋商條款 -->
                <template v-if="clauseLibrary.length">
                  <div class="text-subtitle-2 mt-3 mb-1">磋商條款（勾選套用）</div>
                  <v-expansion-panels variant="accordion" density="compact">
                    <v-expansion-panel v-for="c in clauseLibrary" :key="c.id">
                      <v-expansion-panel-title class="py-1">
                        <v-checkbox-btn :model-value="state.selectedClauseIds.includes(c.id)"
                          density="compact" class="flex-grow-0 mr-1" @click.stop="toggleClause(c.id)" />
                        <span class="text-body-2">{{ c.title || '(未命名條款)' }}</span>
                        <v-chip v-if="c.condition" size="x-small" variant="tonal" class="ml-2">{{ c.condition }}</v-chip>
                      </v-expansion-panel-title>
                      <v-expansion-panel-text>
                        <v-textarea :model-value="clauseContent(c)" rows="4" auto-grow density="compact"
                          variant="outlined" hide-details label="本戶套用內容（可微調，不回寫條款庫）"
                          @update:model-value="state.clauseOverrides[c.id] = $event" />
                      </v-expansion-panel-text>
                    </v-expansion-panel>
                  </v-expansion-panels>
                </template>
                <v-alert v-else type="info" variant="tonal" density="compact" class="mt-3">
                  尚未建立磋商條款庫（合約製作範本設定）。
                </v-alert>
              </v-card-text>
            </v-card>

            <!-- 繳款銀行 / QR -->
            <v-card elevation="2" class="mb-4" v-if="bankPages.length">
              <v-card-item class="editor-header">
                <v-card-title class="text-subtitle-1">
                  <v-icon start size="small">mdi-bank-outline</v-icon>
                  繳款銀行頁
                </v-card-title>
              </v-card-item>
              <v-divider />
              <v-card-text>
                <v-text-field v-model="state.qrUrl" label="客戶資料卡 QR 網址（每戶輸入）"
                  density="compact" variant="outlined" hide-details clearable
                  prepend-inner-icon="mdi-qrcode" />
                <div v-if="state.qrUrl" class="mt-2 d-flex align-center ga-3">
                  <qrcode-vue :value="state.qrUrl" :size="72" level="M" />
                  <span class="text-caption text-grey">QR 即時預覽</span>
                </div>
              </v-card-text>
            </v-card>

            <!-- 合約加註 -->
            <v-card elevation="2" class="mb-4" v-if="notesPage">
              <v-card-item class="editor-header">
                <v-card-title class="text-subtitle-1">
                  <v-icon start size="small">mdi-note-text-outline</v-icon>
                  合約加註（預設同步拆款表勾選，可獨立增刪改）
                </v-card-title>
              </v-card-item>
              <v-divider />
              <v-card-text>
                <div class="d-flex align-center mb-2 ga-2">
                  <v-chip v-if="notesDiverged" size="small" color="warning" variant="tonal">與拆款表勾選不同步</v-chip>
                  <v-btn size="small" variant="tonal" prepend-icon="mdi-sync" @click="syncNotesFromClauses(true)">
                    重新同步拆款表條款
                  </v-btn>
                  <v-btn size="small" variant="tonal" prepend-icon="mdi-plus" @click="addNote">新增加註</v-btn>
                </div>
                <v-card v-for="(n, nIdx) in state.contractNotes" :key="n.id" variant="outlined" class="mb-2 pa-2">
                  <div class="d-flex align-center ga-2 mb-1">
                    <v-text-field v-model.number="n.fontSize" type="number" label="字級(pt)" density="compact"
                      variant="outlined" hide-details style="max-width: 110px;" />
                    <v-spacer />
                    <v-btn icon size="x-small" variant="text" color="error" @click="state.contractNotes.splice(nIdx, 1)">
                      <v-icon>mdi-delete-outline</v-icon>
                    </v-btn>
                  </div>
                  <v-textarea v-model="n.content" rows="3" auto-grow density="compact" variant="outlined" hide-details />
                </v-card>
              </v-card-text>
            </v-card>

            <!-- 合約附圖 -->
            <v-card elevation="2" class="mb-4" v-if="attachmentsPage">
              <v-card-item class="editor-header">
                <v-card-title class="text-subtitle-1">
                  <v-icon start size="small">mdi-floor-plan</v-icon>
                  合約附圖
                </v-card-title>
              </v-card-item>
              <v-divider />
              <v-card-text>
                <v-alert v-if="!attachmentSourceUrl" type="warning" variant="tonal" density="compact">
                  目前無合約圖檔可匯出（戶別「合約分戶圖位置」未設定），此頁將不會匯出。
                </v-alert>
                <template v-else>
                  <div class="text-caption mb-2">
                    來源：<a :href="attachmentSourceUrl" target="_blank">{{ attachmentSourceUrl }}</a>
                  </div>
                  <v-btn size="small" variant="tonal" prepend-icon="mdi-refresh" :loading="attachmentsLoading"
                    @click="loadAttachmentFiles">載入檔案清單</v-btn>
                  <v-list v-if="attachmentFiles.length" density="compact" class="mt-2">
                    <v-list-item v-for="f in attachmentFiles" :key="f.id" class="px-1">
                      <template #prepend>
                        <v-checkbox-btn :model-value="isAttachmentSelected(f.id)" density="compact"
                          @update:model-value="toggleAttachment(f, $event)" />
                      </template>
                      <v-list-item-title class="text-body-2">{{ f.name }}</v-list-item-title>
                      <template #append>
                        <v-text-field v-if="isAttachmentSelected(f.id) && isPdfFile(f)"
                          :model-value="attachmentPageRange(f.id)" placeholder="頁碼 如 1-3"
                          density="compact" variant="outlined" hide-details style="width: 120px;"
                          @update:model-value="setAttachmentPageRange(f.id, $event)" />
                      </template>
                    </v-list-item>
                  </v-list>
                  <div v-else-if="attachmentsLoaded" class="text-caption text-grey mt-2">
                    資料夾內無 PDF / 圖片檔。
                  </div>
                </template>
              </v-card-text>
            </v-card>
          </v-col>

          <!-- ================= 右欄：預覽 ================= -->
          <v-col cols="12" lg="7" v-show="!isMobile || mobileTab === 'preview'">
            <div class="preview-wrapper">
              <template v-for="pv in previewPages" :key="pv.renderKey">
                <template v-for="pc in (pv.page.pageCopies || 1)" :key="`${pv.renderKey}_p${pc}`">
                  <div class="preview-sheet" :style="[paperStyle(pv.page), sheetZoomStyle(pv.page)]">
                    <template v-if="pv.page.type === 'contractAttachments'">
                      <AttachmentsPreview :data="pv.data" :style="attInnerStyle(pv.page)" />
                    </template>
                    <template v-else>
                      <template v-for="copy in (pv.page.repeatCount || 1)" :key="copy">
                        <div :class="{ 'repeat-block': (pv.page.repeatCount || 1) > 1 }">
                          <BreakdownPreview v-if="pv.page.type === 'breakdown'" :data="pv.data" />
                          <PaymentDetailPreview v-else-if="pv.page.type === 'paymentDetail'" :data="pv.data" />
                          <BankAccountsPreview v-else-if="pv.page.type === 'bankAccounts'" :data="pv.data" />
                          <ContractNotesPreview v-else-if="pv.page.type === 'contractNotes'" :data="pv.data" />
                        </div>
                      </template>
                    </template>
                    <div class="sheet-label">
                      {{ pv.page.title }}<template v-if="pv.data.total > 1">（附圖 {{ pv.data.index }}/{{ pv.data.total }}）</template>
                      <template v-if="(pv.page.pageCopies || 1) > 1">（{{ pc }}/{{ pv.page.pageCopies }}）</template>
                    </div>
                  </div>
                </template>
              </template>
              <v-alert v-if="!previewPages.length" type="info" variant="tonal" class="ma-4">
                沒有已啟用的頁面可預覽。
              </v-alert>
            </div>
          </v-col>
        </v-row>
      </v-card-text>

      <v-divider />
      <v-card-actions class="pa-3">
        <v-btn color="secondary" variant="tonal" prepend-icon="mdi-content-save" :loading="saving"
          :disabled="!config" @click="saveDocData()">儲存</v-btn>
        <v-spacer />
        <v-menu v-if="config">
          <template #activator="{ props: mp }">
            <v-btn v-bind="mp" variant="text" prepend-icon="mdi-file-export-outline" :disabled="!canDownload">
              單頁匯出
            </v-btn>
          </template>
          <v-list density="compact">
            <v-list-item v-for="p in exportablePages" :key="p.id" :title="p.title"
              @click="download('pdf', p.id)" />
          </v-list>
        </v-menu>
        <v-btn color="error" variant="flat" prepend-icon="mdi-file-pdf-box" :loading="downloading.pdf"
          :disabled="!canDownload" @click="download('pdf')">下載 PDF</v-btn>
        <v-btn color="success" variant="flat" prepend-icon="mdi-file-excel" :loading="downloading.excel"
          :disabled="!canDownload" @click="download('excel')">下載 EXCEL</v-btn>
        <v-btn variant="text" @click="$emit('update:show', false)">關閉</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { ref, computed, watch, reactive } from 'vue';
import { useDisplay } from 'vuetify';
import { useToast } from 'vue-toastification';
import draggable from 'vuedraggable';
import QrcodeVue from 'qrcode.vue';
import QRCode from 'qrcode';
import { saveAs } from 'file-saver';
import { formatInTimeZone } from 'date-fns-tz';
import { useProjectStore } from '@/store/projectStore';
import {
  fetchContractDocConfig, fetchPaymentTermTemplates, updateContractDocData,
  generateContractDocument, driveProxyList,
} from '@/api.js';
import { runNewCalculationEngine } from '@/utils/paymentCalculation';
import { buildUnitDocContext } from '@/utils/unitDocContext';
import { PAGE_TYPE_MAP } from '@/utils/contractDocDefaults';
import {
  buildPriceModel, buildSplitModel, defaultSelectedClauseIds,
  buildBreakdownPageData, buildPaymentDetailPageData,
  buildBankAccountsPageData, buildContractNotesPageData,
  mergePagesWithOverrides, pagesToOverrides,
} from '@/utils/contractDocModel';
import BreakdownPreview from './BreakdownPreview.vue';
import PaymentDetailPreview from './PaymentDetailPreview.vue';
import BankAccountsPreview from './BankAccountsPreview.vue';
import ContractNotesPreview from './ContractNotesPreview.vue';
import AttachmentsPreview from './AttachmentsPreview.vue';

const props = defineProps({
  show: Boolean,
  projectId: { type: String, required: true },
  projectName: { type: String, required: true },
  unitData: { type: Object, default: () => null },
  allData: { type: Object, default: () => ({}) },
});
defineEmits(['update:show']);

const { mobile: isMobile, width: windowWidth } = useDisplay();
const toast = useToast();
const projectStore = useProjectStore();

const mobileTab = ref('edit');
const loading = ref(true);
const saving = ref(false);
const config = ref(null);

/* ---------- 戶別 context ---------- */
const unitCtx = computed(() => buildUnitDocContext(props.unitData, {
  personnelList: props.allData?.['銷售人員'] || [],
  allParkings: props.allData?.['車位'] || [],
}));

const householdDocId = computed(() =>
  props.unitData?.id || `${props.projectId}_${unitCtx.value.unitId}`);

/* ---------- 本戶填寫狀態 ---------- */
const state = reactive({
  signDate: '',              // yyyy-MM-dd（空 = 用戶別簽約日期）
  freeFieldValues: {},
  signFieldValues: {},
  selectedClauseIds: [],
  clauseOverrides: {},       // { clauseId: 本戶內容微調 }
  contractNotes: [],         // [{ id, content, fontSize }]
  notesEdited: false,        // 使用者是否編輯過合約加註（未編輯則自動跟隨拆款表勾選）
  breakdownRemark: '',
  qrUrl: '',
  attachmentSelection: [],   // [{ fileId, fileName, pageRange }]
});

/* ---------- 頁面（config + 本戶 overrides） ---------- */
const localPages = ref([]);

function pageTypeIcon(type) { return PAGE_TYPE_MAP[type]?.icon || 'mdi-file-outline'; }

function movePage(idx, dir) {
  const target = idx + dir;
  if (target < 0 || target >= localPages.value.length) return;
  const arr = localPages.value;
  [arr[idx], arr[target]] = [arr[target], arr[idx]];
  localPages.value = [...arr];
}

const breakdownPage = computed(() => localPages.value.find(p => p.type === 'breakdown' && p.enabled) || null);
const bankPages = computed(() => localPages.value.filter(p => p.type === 'bankAccounts' && p.enabled));
const notesPage = computed(() => localPages.value.find(p => p.type === 'contractNotes' && p.enabled) || null);
const attachmentsPage = computed(() => localPages.value.find(p => p.type === 'contractAttachments') || null);
const needsInstallment = computed(() =>
  localPages.value.some(p => (p.type === 'breakdown' || p.type === 'paymentDetail') && p.enabled));

const manualSignFields = computed(() =>
  (breakdownPage.value?.options?.signFields || []).filter(f => f.source !== 'salesperson'));

/* ---------- 磋商條款 ---------- */
const clauseLibrary = computed(() => config.value?.clauseLibrary || []);

function toggleClause(id) {
  const i = state.selectedClauseIds.indexOf(id);
  if (i >= 0) state.selectedClauseIds.splice(i, 1);
  else state.selectedClauseIds.push(id);
}

function clauseContent(c) {
  return state.clauseOverrides[c.id] ?? c.content;
}

// 拆款表用：套用微調後的條款庫
const effectiveClauseLibrary = computed(() =>
  clauseLibrary.value.map(c => ({ ...c, content: clauseContent(c) })));

/* ---------- 合約加註（預設同步拆款表勾選） ---------- */
function notesFromClauses() {
  const fontSize = Number(notesPage.value?.options?.defaultFontSize) || 10;
  return effectiveClauseLibrary.value
    .filter(c => state.selectedClauseIds.includes(c.id))
    .map(c => ({ id: `clause_${c.id}`, content: c.content, fontSize }));
}

function syncNotesFromClauses(confirmFirst = false) {
  if (confirmFirst && state.notesEdited && state.contractNotes.length) {
    if (!window.confirm('重新同步將以拆款表勾選的條款覆蓋目前的合約加註內容，確認？')) return;
  }
  state.contractNotes = notesFromClauses();
  state.notesEdited = false;
}

function addNote() {
  const fontSize = Number(notesPage.value?.options?.defaultFontSize) || 10;
  state.contractNotes.push({ id: `manual_${Date.now().toString(36)}`, content: '', fontSize });
  state.notesEdited = true;
}

const notesDiverged = computed(() => {
  if (!state.notesEdited) return false;
  const synced = notesFromClauses().map(n => n.content).join('\n---\n');
  const current = state.contractNotes.map(n => n.content).join('\n---\n');
  return synced !== current;
});

// 未手動編輯過時，拆款表勾選變更自動跟隨
watch(() => [state.selectedClauseIds.slice(), state.clauseOverrides], () => {
  if (!state.notesEdited) state.contractNotes = notesFromClauses();
}, { deep: true });

// 使用者直接改加註內容 → 標記已編輯
watch(() => state.contractNotes.map(n => `${n.content}|${n.fontSize}`).join('¶'), (nv, ov) => {
  if (ov === undefined) return;
  const synced = notesFromClauses().map(n => `${n.content}|${Number(notesPage.value?.options?.defaultFontSize) || 10}`).join('¶');
  if (nv !== synced && nv !== '') state.notesEdited = true;
});

/* ---------- 期款範本（自動 + 手動） ---------- */
const templates = ref([]);
const templatesLoading = ref(false);
const manualCategory = ref(null);
const manualTemplateId = ref(null);

const mainBase = computed(() => Math.round(Number(unitCtx.value.totalPrice) || 0));

async function loadTemplates() {
  templatesLoading.value = true;
  try {
    const result = await fetchPaymentTermTemplates(props.projectId);
    templates.value = result.status === 'success' ? (result.data || []) : [];
    if (result.status !== 'success') toast.error(`載入期款範本失敗: ${result.message}`);
  } finally {
    templatesLoading.value = false;
  }
}

const autoConditionText = computed(() => {
  const c = unitCtx.value;
  const buyerType = c.isFirstTimeBuyer ? '首購' : '非首購';
  const category = c.usePreferredPayment ? '優付期款' : '一般期款';
  return `${category}／${c.propertyType || '住家'}／${buyerType}／基準 ${formatNumber(mainBase.value)} 萬`;
});

const autoTemplate = computed(() => {
  const c = unitCtx.value;
  if (templates.value.length === 0) return null;
  const base = mainBase.value;
  const buyerType = c.isFirstTimeBuyer ? '首購' : '非首購';
  const currentPropertyType = c.propertyType || '住家';
  const targetCategory = c.usePreferredPayment ? '優付期款' : '一般期款';
  const applicable = templates.value.filter(t => {
    const tPropType = t.propertyType || '住家';
    if (tPropType !== currentPropertyType) return false;
    return t.paymentCategory === targetCategory && t.minPrice <= base && base <= t.maxPrice && t.buyerType === buyerType;
  });
  return applicable.length > 0 ? applicable[0] : null;
});

const activeTemplate = computed(() => {
  if (manualTemplateId.value) return templates.value.find(t => t.id === manualTemplateId.value) || null;
  return autoTemplate.value;
});

const isAutoSelected = computed(() => !manualTemplateId.value);

const categoryOptions = computed(() => {
  const set = new Set();
  templates.value.forEach(t => {
    if (t.paymentCategory && t.paymentCategory !== '配套期款') set.add(t.paymentCategory);
  });
  return Array.from(set);
});

const categoryModel = computed({
  get: () => manualCategory.value || activeTemplate.value?.paymentCategory || null,
  set: (value) => {
    manualCategory.value = value;
    const candidates = templates.value.filter(t => t.paymentCategory === value);
    manualTemplateId.value = candidates.length === 1 ? candidates[0].id : null;
  },
});

function templateSubtitle(t) {
  const range = (t.minPrice || t.maxPrice)
    ? `${t.minPrice ? `${t.minPrice}萬` : '0'}~${t.maxPrice ? `${t.maxPrice}萬` : '無上限'}`
    : '不限總價';
  return `${t.propertyType || '住家'}｜${t.buyerType || '非首購'}｜${range}`;
}

const templateOptions = computed(() => {
  const category = categoryModel.value;
  if (!category) return [];
  return templates.value
    .filter(t => t.paymentCategory === category)
    .map(t => ({ id: t.id, templateName: t.templateName, subtitle: templateSubtitle(t) }));
});

const templateIdModel = computed({
  get: () => manualTemplateId.value || activeTemplate.value?.id || null,
  set: (value) => { manualTemplateId.value = value; },
});

function resetToAuto() {
  manualCategory.value = null;
  manualTemplateId.value = null;
}

/* ---------- 期款編輯列 ---------- */
const editRows = ref([]);
const correctionTargetKey = ref(null);
let restoringRows = false;   // 還原已存列時避免 rebuild 蓋掉

function buildRowsFromTemplate(template, baseValue) {
  if (!template || !Array.isArray(template.items) || baseValue <= 0) return [];
  const items = template.items;
  const results = runNewCalculationEngine(items, baseValue, '總價');
  const parents = items.filter(i => !i.parentId);
  return parents.map(p => {
    const children = items.filter(i => i.parentId === p.id);
    const percent = Number(p.conditionalValue) || 0;
    const base = { key: p.id, name: p.name, percent };
    if (children.length > 0) {
      const useSeq = children.length >= 3;
      return {
        ...base, type: 'group',
        verticalLabel: useSeq ? p.name : null,
        children: children.map((c, idx) => ({
          key: c.id, seq: useSeq ? idx + 1 : null, name: c.name,
          amount: Math.round(Number(results[c.name]?.value) || 0),
        })),
      };
    }
    return { ...base, type: 'single', amount: Math.round(Number(results[p.name]?.value) || 0) };
  });
}

function rebuildRows() {
  if (restoringRows) return;
  editRows.value = buildRowsFromTemplate(activeTemplate.value, mainBase.value);
  correctionTargetKey.value = editRows.value.length ? editRows.value[editRows.value.length - 1].key : null;
}

watch(activeTemplate, () => rebuildRows());

/* ---------- 雙向連動 / 驗證（單頁版，同付款表邏輯） ---------- */
function groupAmount(row) {
  return (row.children || []).reduce((s, c) => s + (Math.round(Number(c.amount)) || 0), 0);
}

function recalcAmountFromPercent(row) {
  const base = mainBase.value;
  const percent = Number(row.percent) || 0;
  const target = Math.round(percent / 100 * base);
  if (row.type === 'group') {
    const children = row.children || [];
    if (!children.length) return;
    const currentSum = groupAmount(row);
    let allocated = 0;
    children.forEach((child, idx) => {
      if (idx === children.length - 1) {
        child.amount = target - allocated;
      } else {
        const weight = currentSum > 0 ? (Math.round(Number(child.amount)) || 0) / currentSum : 1 / children.length;
        const val = Math.round(target * weight);
        child.amount = val;
        allocated += val;
      }
    });
  } else {
    row.amount = target;
  }
}

function recalcPercentFromAmount(row) {
  const base = mainBase.value;
  const sum = row.type === 'group' ? groupAmount(row) : (Math.round(Number(row.amount)) || 0);
  row.percent = base > 0 ? Math.round(sum / base * 10000) / 100 : 0;
}

const percentSum = computed(() => editRows.value.reduce((s, r) => s + (Number(r.percent) || 0), 0));
const percentSumText = computed(() => (Math.round(percentSum.value * 100) / 100).toString());
const percentOk = computed(() => Math.abs(percentSum.value - 100) <= 0.01);
const amountSum = computed(() =>
  editRows.value.reduce((s, r) => s + (r.type === 'group' ? groupAmount(r) : (Math.round(Number(r.amount)) || 0)), 0));
const amountOk = computed(() => amountSum.value === mainBase.value);

const correctionOptions = computed(() => editRows.value.map(r => ({ key: r.key, label: r.name })));

function applyCorrection() {
  const row = editRows.value.find(r => r.key === correctionTargetKey.value);
  if (!row) return;
  const diff = mainBase.value - amountSum.value;
  if (row.type === 'group') {
    const children = row.children || [];
    if (!children.length) return;
    const last = children[children.length - 1];
    last.amount = (Math.round(Number(last.amount)) || 0) + diff;
  } else {
    row.amount = (Math.round(Number(row.amount)) || 0) + diff;
  }
  recalcPercentFromAmount(row);
  const pDiff = Math.round((100 - percentSum.value) * 100) / 100;
  if (Math.abs(pDiff) > 0.01) {
    row.percent = Math.round((Number(row.percent) + pDiff) * 100) / 100;
  }
}

/* ---------- 價款 / 拆分模型 ---------- */
const priceModel = computed(() => buildPriceModel(
  props.unitData || {},
  projectStore.getProjectById(props.projectId)?.priceFormulaSettings || null,
  config.value,
));

const splitModel = computed(() => buildSplitModel(editRows.value, config.value, priceModel.value.fullContext));

/* ---------- 合約附圖 ---------- */
const attachmentsLoading = ref(false);
const attachmentsLoaded = ref(false);
const attachmentFiles = ref([]);

const attachmentSourceUrl = computed(() => {
  const field = attachmentsPage.value?.options?.sourceField || 'contractDrawingFolderUrl';
  return (props.unitData?.[field] || '').trim();
});

function isPdfFile(f) {
  return (f.mimeType || '').includes('pdf') || /\.pdf$/i.test(f.name || '');
}

function isImageFile(f) {
  return (f.mimeType || '').startsWith('image/') || /\.(png|jpe?g|webp)$/i.test(f.name || '');
}

function extractDriveFileId(url) {
  const m1 = url.match(/\/d\/([a-zA-Z0-9_-]+)/);
  if (m1) return m1[1];
  const m2 = url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (m2) return m2[1];
  return null;
}

function extractDriveFolderId(url) {
  const m = url.match(/\/folders\/([a-zA-Z0-9_-]+)/);
  return m ? m[1] : null;
}

async function loadAttachmentFiles() {
  const url = attachmentSourceUrl.value;
  if (!url) return;
  attachmentsLoading.value = true;
  try {
    // 連結可能是 /folders/、/d/、open?id= 等格式；ID 是資料夾或檔案交由後端判別（resolveId）
    const driveId = extractDriveFolderId(url) || extractDriveFileId(url);
    if (driveId) {
      const result = await driveProxyList({ folderId: driveId, resolveId: true });
      const files = (result?.files || result?.data?.files || [])
        .filter(f => !f.isFolder)
        .filter(f => isPdfFile(f) || isImageFile(f));
      attachmentFiles.value = files.map(f => ({
        id: f.id, name: f.name, mimeType: f.mimeType || '', thumbnail: f.thumbnail || null,
      }));
      if (!files.length) {
        toast.warning('合約附圖來源沒有可用的 PDF/圖檔');
      }
    } else {
      toast.warning('無法解析合約附圖連結（非 Google Drive 資料夾/檔案連結）');
      attachmentFiles.value = [];
    }
    attachmentsLoaded.value = true;
    // 清掉已不存在的勾選（例如先前誤存的資料夾 ID、或已被移除的檔案）
    const validIds = new Set(attachmentFiles.value.map(f => f.id));
    state.attachmentSelection = state.attachmentSelection.filter(a => validIds.has(a.fileId));
    // 沒有既存勾選時，預設全選
    if (!state.attachmentSelection.length && attachmentFiles.value.length) {
      state.attachmentSelection = attachmentFiles.value.map(f => ({ fileId: f.id, fileName: f.name, pageRange: null }));
    }
  } catch (e) {
    console.error('載入合約附圖清單失敗:', e);
    toast.error(`載入合約附圖清單失敗：${e.message}`);
  } finally {
    attachmentsLoading.value = false;
  }
}

function isAttachmentSelected(fileId) {
  return state.attachmentSelection.some(a => a.fileId === fileId);
}
function toggleAttachment(f, on) {
  const i = state.attachmentSelection.findIndex(a => a.fileId === f.id);
  if (on && i < 0) state.attachmentSelection.push({ fileId: f.id, fileName: f.name, pageRange: null });
  if (!on && i >= 0) state.attachmentSelection.splice(i, 1);
}
function attachmentPageRange(fileId) {
  return state.attachmentSelection.find(a => a.fileId === fileId)?.pageRange || '';
}
function setAttachmentPageRange(fileId, val) {
  const a = state.attachmentSelection.find(x => x.fileId === fileId);
  if (a) a.pageRange = (val || '').trim() || null;
}

function pageDisabled(page) {
  return page.type === 'contractAttachments' && !attachmentSourceUrl.value;
}

/* ---------- 簽約日期 ---------- */
const signDateText = computed(() => {
  if (state.signDate) {
    const d = new Date(`${state.signDate}T00:00:00`);
    if (!isNaN(d.getTime())) return formatInTimeZone(d, 'Asia/Taipei', 'yyyy年M月d日');
  }
  if (unitCtx.value.contractDate) {
    return formatInTimeZone(unitCtx.value.contractDate, 'Asia/Taipei', 'yyyy年M月d日');
  }
  return '';
});

/* ---------- 預覽 ---------- */
// 96dpi 紙張像素
const PAPER_PX = { A4: [794, 1123], A3: [1123, 1587], B4: [972, 1375], Letter: [816, 1056] };

function pageDims(page) {
  const [w, h] = PAPER_PX[page.paper?.size] || PAPER_PX.A4;
  const landscape = page.paper?.orientation === 'landscape';
  return { w: landscape ? h : w, h: landscape ? w : h };
}

function paperStyle(page) {
  const { w, h } = pageDims(page);
  return {
    width: `${w}px`,
    minHeight: `${h}px`,
  };
}

// 逐頁縮放：依該頁紙張寬度計算（橫向頁不會爆版）
function sheetZoomStyle(page) {
  const { w } = pageDims(page);
  const available = isMobile.value
    ? Math.max(300, (windowWidth.value || 375) - 24)
    : 800;   // 桌機右欄可視寬度概估
  return { zoom: Math.min(1, available / w) };
}

// 附圖滿版預覽的內容高度（紙張高 - 上下 padding）
function attInnerStyle(page) {
  const { h } = pageDims(page);
  return { height: `${h - 56}px` };
}

const builderState = computed(() => ({
  projectName: props.projectName,
  signDateText: signDateText.value,
  freeFieldValues: state.freeFieldValues,
  signFieldValues: state.signFieldValues,
  selectedClauseIds: state.selectedClauseIds,
  clauseLibrary: effectiveClauseLibrary.value,
  configPriceFormulas: config.value?.priceFormulas || [],
  breakdownRemark: state.breakdownRemark,
  contractNotes: state.contractNotes,
  qrUrl: state.qrUrl,
}));

function buildPageData(page) {
  const ctx = unitCtx.value;
  if (page.type === 'breakdown') {
    return buildBreakdownPageData(page, ctx, priceModel.value, splitModel.value, editRows.value, builderState.value);
  }
  if (page.type === 'paymentDetail') {
    return buildPaymentDetailPageData(page, ctx, splitModel.value, editRows.value, builderState.value);
  }
  if (page.type === 'bankAccounts') {
    return buildBankAccountsPageData(page, ctx, config.value, builderState.value, props.unitData);
  }
  if (page.type === 'contractNotes') {
    return buildContractNotesPageData(page, builderState.value);
  }
  if (page.type === 'contractAttachments') {
    return {
      sourceUrl: attachmentSourceUrl.value,
      files: attachmentFiles.value,
      selection: state.attachmentSelection,
    };
  }
  return {};
}

/** Drive 縮圖放大（=s220 → =s1200），供附圖滿版預覽 */
function largeThumb(url) {
  if (!url) return null;
  return url.replace(/=s\d+(-c)?$/, '=s1200');
}

const previewPages = computed(() => {
  if (!config.value) return [];
  const out = [];
  localPages.value
    .filter(p => p.enabled && !pageDisabled(p))
    .forEach((p, idx) => {
      if (p.type === 'contractAttachments') {
        // 合約附圖：每個勾選檔案獨立一張紙、滿版呈現
        const sel = state.attachmentSelection;
        if (!sel.length) {
          out.push({ page: p, data: { empty: true }, renderKey: `${p.id}_${idx}_empty` });
        } else {
          sel.forEach((a, i) => {
            const f = attachmentFiles.value.find(x => x.id === a.fileId);
            out.push({
              page: p,
              data: {
                file: {
                  name: a.fileName || f?.name || '',
                  pageRange: a.pageRange || null,
                  mimeType: f?.mimeType || '',
                  thumbnail: largeThumb(f?.thumbnail),
                },
                index: i + 1,
                total: sel.length,
              },
              renderKey: `${p.id}_${idx}_att${a.fileId}`,
            });
          });
        }
      } else {
        out.push({ page: p, data: buildPageData(p), renderKey: `${p.id}_${idx}` });
      }
    });
  return out;
});

const exportablePages = computed(() => localPages.value.filter(p => p.enabled && !pageDisabled(p)));

/* ---------- 驗證（可否下載） ---------- */
const canDownload = computed(() => {
  if (!config.value || !exportablePages.value.length) return false;
  if (needsInstallment.value) {
    if (!editRows.value.length || mainBase.value <= 0) return false;
    if (!percentOk.value || !amountOk.value) return false;
    if (!splitModel.value.landOk) return false;
  }
  return true;
});

/* ---------- 開啟時載入 ---------- */
watch(() => props.show, async (val) => {
  if (!val) return;
  loading.value = true;
  mobileTab.value = 'edit';
  attachmentFiles.value = [];
  attachmentsLoaded.value = false;
  try {
    projectStore.setCurrentProject(props.projectId);
    const [cfg] = await Promise.all([
      fetchContractDocConfig(props.projectId),
      loadTemplates(),
    ]);
    config.value = cfg;
    if (cfg) restoreDocData(cfg);
    // 有合約附圖頁且戶別有連結時，自動載入檔案清單（不阻塞開啟）
    if (cfg && attachmentsPage.value && attachmentSourceUrl.value) {
      loadAttachmentFiles();
    }
  } catch (e) {
    console.error('載入合約製作設定失敗:', e);
    toast.error(`載入合約製作設定失敗：${e.message}`);
    config.value = null;
  } finally {
    loading.value = false;
  }
}, { immediate: true });

function restoreDocData(cfg) {
  const saved = props.unitData?.contractDocData || {};

  // 頁面（config + overrides）
  localPages.value = mergePagesWithOverrides(cfg.pages || [], saved.pageOverrides || {});

  // 拆款表欄位預設值
  const bd = (cfg.pages || []).find(p => p.type === 'breakdown');
  const freeDefaults = {};
  (bd?.options?.freeFields || []).forEach(f => { freeDefaults[f.key] = f.default ?? ''; });
  const signDefaults = {};
  (bd?.options?.signFields || []).filter(f => f.source !== 'salesperson')
    .forEach(f => { signDefaults[f.label] = f.default ?? ''; });

  state.signDate = saved.signDate || '';
  state.freeFieldValues = { ...freeDefaults, ...(saved.freeFieldValues || {}) };
  state.signFieldValues = { ...signDefaults, ...(saved.signFieldValues || {}) };
  state.clauseOverrides = { ...(saved.clauseOverrides || {}) };
  state.breakdownRemark = saved.breakdownRemark || '';
  state.qrUrl = saved.qrUrl || '';
  state.attachmentSelection = Array.isArray(saved.attachmentSelection) ? [...saved.attachmentSelection] : [];

  // 磋商條款：有存檔用存檔，否則依條件自動預選
  state.selectedClauseIds = Array.isArray(saved.selectedClauseIds)
    ? saved.selectedClauseIds.filter(id => (cfg.clauseLibrary || []).some(c => c.id === id))
    : defaultSelectedClauseIds(cfg.clauseLibrary || [], unitCtx.value);

  // 合約加註
  if (Array.isArray(saved.contractNotes) && saved.contractNotes.length) {
    state.contractNotes = saved.contractNotes.map(n => ({ ...n }));
    state.notesEdited = saved.notesEdited !== false;
  } else {
    state.notesEdited = false;
    state.contractNotes = notesFromClauses();
  }

  // 期款範本手動覆蓋 + 手動調整列
  resetToAuto();
  if (saved.paymentTemplateId && templates.value.some(t => t.id === saved.paymentTemplateId)) {
    manualTemplateId.value = saved.paymentTemplateId;
  }
  rebuildRows();
  if (Array.isArray(saved.manualRows) && saved.manualRows.length
    && saved.manualRowsTemplateId === (activeTemplate.value?.id || null)) {
    // 結構相符才還原（名稱逐一比對）
    const currentNames = JSON.stringify(editRows.value.map(r => [r.name, (r.children || []).map(c => c.name)]));
    const savedNames = JSON.stringify(saved.manualRows.map(r => [r.name, (r.children || []).map(c => c.name)]));
    if (currentNames === savedNames) {
      restoringRows = true;
      editRows.value = saved.manualRows.map(r => ({ ...r, children: (r.children || []).map(c => ({ ...c })) }));
      correctionTargetKey.value = editRows.value.length ? editRows.value[editRows.value.length - 1].key : null;
      restoringRows = false;
    } else {
      toast.info('期款範本結構已變更，已重新以範本計算（先前手動調整未套用）。');
    }
  }
}

/* ---------- 儲存 ---------- */
function buildDocDataPayload() {
  return {
    signDate: state.signDate || null,
    freeFieldValues: { ...state.freeFieldValues },
    signFieldValues: { ...state.signFieldValues },
    selectedClauseIds: [...state.selectedClauseIds],
    clauseOverrides: { ...state.clauseOverrides },
    contractNotes: state.contractNotes.map(n => ({ ...n })),
    notesEdited: state.notesEdited,
    breakdownRemark: state.breakdownRemark || '',
    qrUrl: state.qrUrl || '',
    paymentTemplateId: manualTemplateId.value || null,
    manualRowsTemplateId: activeTemplate.value?.id || null,
    manualRows: editRows.value.map(r => ({ ...r, children: (r.children || []).map(c => ({ ...c })) })),
    pageOverrides: pagesToOverrides(localPages.value, config.value?.pages || []),
    attachmentSelection: state.attachmentSelection.map(a => ({ ...a })),
  };
}

async function saveDocData(silent = false) {
  saving.value = true;
  try {
    await updateContractDocData(householdDocId.value, buildDocDataPayload());
    if (!silent) toast.success('合約製作資料已儲存');
    return true;
  } catch (e) {
    console.error('儲存合約製作資料失敗:', e);
    toast.error(`儲存失敗：${e.message}`);
    return false;
  } finally {
    saving.value = false;
  }
}

/* ---------- 下載 ---------- */
const downloading = reactive({ pdf: false, excel: false });

function base64ToBlob(base64, mimeType) {
  const byteChars = atob(base64);
  const byteNumbers = new Array(byteChars.length);
  for (let i = 0; i < byteChars.length; i++) byteNumbers[i] = byteChars.charCodeAt(i);
  return new Blob([new Uint8Array(byteNumbers)], { type: mimeType });
}

async function download(format, onlyPageId = null) {
  if (!canDownload.value) return;
  downloading[format] = true;
  try {
    await saveDocData(true);

    // 附圖頁要匯出但清單尚未載入時，先載入並預設全選（避免靜默漏掉附圖）
    const includesAttachments = exportablePages.value
      .some(p => p.type === 'contractAttachments' && (!onlyPageId || p.id === onlyPageId));
    if (format === 'pdf' && includesAttachments && attachmentSourceUrl.value && !attachmentsLoaded.value) {
      await loadAttachmentFiles();
    }
    if (format === 'pdf' && includesAttachments && !state.attachmentSelection.length) {
      toast.warning('合約附圖尚未勾選任何檔案，本次匯出將不含附圖');
    }

    let qrDataUrl = null;
    if (state.qrUrl) {
      qrDataUrl = await QRCode.toDataURL(state.qrUrl, { width: 300, margin: 1, errorCorrectionLevel: 'M' });
    }

    const pagesPayload = exportablePages.value
      .filter(p => !onlyPageId || p.id === onlyPageId)
      .filter(p => !(format === 'excel' && p.type === 'contractAttachments'))
      .map(p => ({
        id: p.id,
        type: p.type,
        title: p.title,
        paper: { size: p.paper?.size || 'A4', orientation: p.paper?.orientation || 'portrait' },
        repeatCount: p.repeatCount || 1,
        pageCopies: p.pageCopies || 1,
        data: p.type === 'bankAccounts'
          ? { ...buildPageData(p), qrDataUrl }
          : buildPageData(p),
      }));

    if (!pagesPayload.length) {
      toast.warning('沒有可匯出的頁面（EXCEL 不含合約附圖頁）。');
      return;
    }

    const payload = {
      projectId: props.projectId,
      format,
      fileNameParts: {
        projectName: props.projectName,
        unitId: unitCtx.value.unitId,
        salesperson: unitCtx.value.salespersonText,
        pageTitle: onlyPageId ? pagesPayload[0]?.title : null,
      },
      pages: pagesPayload,
    };

    const result = await generateContractDocument(payload);
    if (result.status === 'success' && result.base64) {
      saveAs(base64ToBlob(result.base64, result.mimeType), result.fileName);
      if (Array.isArray(result.warnings) && result.warnings.length) {
        toast.warning(`部分附圖無法載入：${result.warnings.join('、')}`);
      }
      toast.success(`合約製作 ${format === 'pdf' ? 'PDF' : 'EXCEL'} 已下載`);
    } else {
      throw new Error(result.message || '後端發生未知錯誤');
    }
  } catch (e) {
    console.error('下載合約製作文件失敗:', e);
    toast.error(`下載失敗：${e.message}`);
  } finally {
    downloading[format] = false;
  }
}

/* ---------- 顯示工具 ---------- */
function formatNumber(value) {
  const num = Number(value) || 0;
  return num.toLocaleString('en-US', { maximumFractionDigits: 2 });
}
</script>

<style scoped>
.editor-header {
  background-color: #f5f5f5;
  border-bottom: 1px solid #e0e0e0;
}
.page-row {
  border-bottom: 1px dashed #eee;
  min-height: 40px;
}
.cursor-move { cursor: move; }
.edit-rows-table :deep(td) { padding: 2px 6px !important; }
.amount-input { max-width: 110px; margin-left: auto; }
.preview-wrapper {
  overflow-x: auto;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  padding-bottom: 24px;
}
.preview-sheet {
  position: relative;
  background: #fff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.25);
  padding: 28px 32px;
  font-family: 'Noto Serif TC', 'Times New Roman', serif;
  flex-shrink: 0;
}
.repeat-block {
  border-bottom: 1px dashed #999;
  padding-bottom: 12px;
  margin-bottom: 12px;
}
.repeat-block:last-child { border-bottom: none; margin-bottom: 0; }
.sheet-label {
  position: absolute;
  top: -10px;
  left: 8px;
  background: #616161;
  color: #fff;
  font-size: 11px;
  border-radius: 4px;
  padding: 1px 8px;
}
</style>
