<template>
  <v-dialog v-model="show" max-width="640" scrollable>
    <v-card>
      <v-card-title class="d-flex align-center bg-teal-darken-1 text-white py-3">
        <v-icon start>mdi-printer-outline</v-icon>
        列印報價單(含期款)
        <v-spacer></v-spacer>
        <v-btn icon="mdi-close" variant="text" size="small" @click="show = false"></v-btn>
      </v-card-title>

      <!-- ✅ 固定區：說明、銷售顧問資訊、全選（不隨戶別清單捲動） -->
      <div class="px-4 pt-3 pb-1">
        <div class="text-body-2 text-grey-darken-1">
          請勾選要列印的戶別，每一戶將產生一頁 A4 直式報價單：
        </div>

        <!-- 銷售顧問資訊；未選擇時警示 -->
        <div
          class="d-flex align-center mt-2 text-body-2"
          :class="personnelName ? 'text-grey-darken-2' : 'text-orange-darken-3'"
        >
          <v-icon size="small" class="mr-1">{{ personnelName ? 'mdi-account-tie' : 'mdi-alert' }}</v-icon>
          <template v-if="personnelName">
            銷售顧問：{{ personnelName }}／聯絡電話：{{ personnelPhone || '—' }}
          </template>
          <template v-else>
            尚未選擇報價人員，頁尾將印出「—」；請先回頁面選擇報價人員。
          </template>
        </div>

        <div class="d-flex align-center mt-1">
          <v-checkbox
            :model-value="isAllSelected"
            :indeterminate="isSomeSelected && !isAllSelected"
            label="全選"
            color="teal-darken-1"
            density="compact"
            hide-details
            @update:model-value="toggleAll"
          ></v-checkbox>
          <span class="text-caption text-grey-darken-1 ml-2">
            已選 {{ selectedIds.length }}／共 {{ quoteStore.items.length }} 戶
          </span>
        </div>
      </div>

      <v-divider></v-divider>

      <!-- 捲動區：戶別清單 -->
      <v-card-text class="pa-2">
        <v-list density="compact" class="py-0">
          <v-list-item
            v-for="item in quoteStore.items"
            :key="item.internalId"
            class="px-1"
            @click="toggleItem(item.internalId)"
          >
            <template v-slot:prepend>
              <v-checkbox-btn
                :model-value="selectedIds.includes(item.internalId)"
                color="teal-darken-1"
                density="compact"
                @click.stop="toggleItem(item.internalId)"
              ></v-checkbox-btn>
            </template>
            <v-list-item-title class="d-flex align-center flex-wrap ga-1">
              <span class="font-weight-bold text-primary mr-1">{{ item.unitId }}</span>
              <span class="text-caption text-grey-darken-1 mr-1">
                {{ item.unitDetails?.propertyType || item.unitDetails?.layout || '-' }}
              </span>
              <!-- ✅ 設定摘要 chips：列印前一眼核對每戶設定 -->
              <v-chip size="x-small" variant="tonal" :color="item.isFirstTimeBuyer === '是' ? 'blue' : 'grey'">
                {{ item.isFirstTimeBuyer === '是' ? '首購' : '非首購' }}
              </v-chip>
              <v-chip v-if="item.printPaymentData?.generalIsPreferred" size="x-small" variant="tonal" color="amber-darken-3">
                優付
              </v-chip>
              <v-chip v-if="item.usePackageDeal" size="x-small" variant="tonal" color="green">配套</v-chip>
              <v-chip v-if="item.printPaymentData?.companyLoan" size="x-small" variant="tonal" color="brown">
                借貸{{ item.printPaymentData.companyLoan.ratioPercent }}%
              </v-chip>
              <v-chip v-if="(item.selectedParking || []).length" size="x-small" variant="tonal" color="indigo">
                車位×{{ item.selectedParking.length }}
              </v-chip>
              <!-- ✅ 缺期款範本警示：避免印出空白期款頁 -->
              <v-chip
                v-if="!hasPaymentTemplate(item)"
                size="x-small"
                variant="flat"
                color="orange-darken-2"
                prepend-icon="mdi-alert"
              >
                缺期款範本
              </v-chip>
            </v-list-item-title>
            <template v-slot:append>
              <span class="text-body-2 font-weight-medium ml-2">
                {{ quoteStore.getFinalTotalPrice(item.internalId).toLocaleString() }} 萬
              </span>
            </template>
          </v-list-item>
        </v-list>
      </v-card-text>

      <v-divider></v-divider>

      <!-- ✅ 列印選項（固定）：開關一列、日期欄位一列，整齊對齊 -->
      <div class="px-4 py-2">
        <div class="d-flex align-center flex-wrap">
          <v-switch
            v-model="optShowNegotiation"
            label="顯示議價資訊"
            color="teal-darken-1"
            density="compact"
            hide-details
            class="mr-8"
          ></v-switch>
          <v-switch
            v-model="optShowNotes"
            label="列印期款說明"
            color="teal-darken-1"
            density="compact"
            hide-details
            class="mr-8"
          ></v-switch>
          <!-- ✅ [新增] 顯示採用方案（方案編輯器功能） -->
          <v-switch
            v-model="optShowPlans"
            label="顯示採用方案"
            color="teal-darken-1"
            density="compact"
            hide-details
            class="mr-8"
          ></v-switch>
          <!-- 公司借貸攤還表（僅對有附掛借貸的戶別生效） -->
          <v-switch
            v-model="optShowLoan"
            label="公司借貸攤還表"
            color="teal-darken-1"
            density="compact"
            hide-details
            class="mr-8"
          ></v-switch>
          <!-- ✅ [新增] 主管簽核／用印欄 -->
          <v-switch
            v-model="optShowApproval"
            label="主管簽核欄"
            color="teal-darken-1"
            density="compact"
            hide-details
            :class="{ 'mr-8': hasIntroQr }"
          ></v-switch>
          <!-- ✅ [新增] 建案簡介 QR Code：僅在該建案已設定簡介網址時出現 -->
          <v-switch
            v-if="hasIntroQr"
            v-model="optShowQr"
            label="建案簡介 QR Code"
            color="teal-darken-1"
            density="compact"
            hide-details
          ></v-switch>
        </div>
        <div class="d-flex align-center ga-3 mt-2">
          <v-text-field
            v-model="optQuoteDate"
            type="date"
            label="報價日期"
            density="compact"
            variant="outlined"
            hide-details
            class="flex-grow-1"
            style="max-width: 220px;"
          ></v-text-field>
          <v-text-field
            v-model="optValidUntil"
            type="date"
            label="有效期限（選填）"
            density="compact"
            variant="outlined"
            hide-details
            clearable
            class="flex-grow-1"
            style="max-width: 220px;"
          ></v-text-field>
        </div>
      </div>

      <v-divider></v-divider>

      <!-- ✅ 報價單備註：預設收合（唯讀；編輯入口在報價設定頁工具列） -->
      <div class="remark-panel">
        <div class="d-flex align-center px-4 py-2 remark-toggle" @click="isRemarkExpanded = !isRemarkExpanded">
          <v-icon size="small" color="blue-grey-darken-2" class="mr-1">mdi-note-text-outline</v-icon>
          <span class="text-body-2 font-weight-medium text-blue-grey-darken-2">
            報價單備註（{{ remarkLoadError ? '載入失敗' : (remarkHtml ? '有內容' : '無') }}）
          </span>
          <v-spacer></v-spacer>
          <v-icon size="small" color="blue-grey-darken-2">
            {{ isRemarkExpanded ? 'mdi-chevron-up' : 'mdi-chevron-down' }}
          </v-icon>
        </div>
        <v-expand-transition>
          <div v-show="isRemarkExpanded" class="px-4 pb-3">
            <div v-if="remarkLoadError" class="text-caption text-red">備註載入失敗，列印時將不含備註。</div>
            <div v-else-if="remarkHtml" class="remark-preview" v-html="remarkHtml"></div>
            <div v-else class="text-caption text-grey">尚無備註內容。</div>
          </div>
        </v-expand-transition>
      </div>

      <v-divider></v-divider>

      <!-- ✅ [新增] 列印前底價守門（規格 docs/SPEC_QuoteFloorPriceApproval.md §6）：不顯示任何金額 -->
      <div v-if="floorCheck.loading" class="px-4 py-2">
        <v-progress-linear indeterminate color="teal-darken-1" height="3"></v-progress-linear>
        <div class="text-caption text-grey-darken-1 mt-1">正在核對報價…</div>
      </div>
      <v-alert
        v-else-if="floorCheck.error"
        type="error"
        variant="tonal"
        density="compact"
        class="mx-4 my-2"
      >
        <div class="d-flex align-center flex-wrap ga-2">
          <span>報價核對失敗，無法列印：{{ floorCheck.error }}</span>
          <v-btn size="small" variant="outlined" color="error" prepend-icon="mdi-refresh" @click="runFloorCheck(true)">重新核對</v-btn>
        </div>
      </v-alert>
      <template v-else>
        <v-alert
          v-if="missingUnitItems.length > 0"
          type="error"
          variant="tonal"
          density="compact"
          class="mx-4 my-2"
        >
          {{ missingUnitItems.map(i => i.unitId).join('、') }} 已不存在於銷控資料，請移除後重新加入。
        </v-alert>
        <v-alert
          v-if="floorWarningText"
          type="warning"
          variant="tonal"
          density="compact"
          class="mx-4 my-2"
        >
          {{ floorWarningText }}
        </v-alert>

        <div v-if="approvalItems.length > 0" class="approval-panel mx-4 my-2">
          <div class="d-flex align-center text-red-darken-2 font-weight-bold mb-2">
            <v-icon size="small" class="mr-1">mdi-alert</v-icon>
            以下戶別價格須經專案主管確認後才可生效
          </div>
          <div v-for="entry in approvalItems" :key="entry.item.internalId" class="approval-row">
            <span class="approval-unit">{{ entry.item.unitId }}</span>
            <span v-if="entry.notified" class="text-caption text-green-darken-2">
              已通知 {{ entry.supervisorText }}　{{ entry.notifiedAtText }}
            </span>
            <span v-else class="text-caption text-red-darken-2">尚未通知</span>
          </div>

          <div class="d-flex align-center flex-wrap ga-2 mt-3">
            <v-select
              v-model="selectedSupervisorKeys"
              :items="supervisorOptions"
              item-title="name"
              item-value="userKey"
              label="通知主管"
              multiple
              chips
              closable-chips
              density="compact"
              variant="outlined"
              hide-details
              :loading="supervisorsLoading"
              class="flex-grow-1 approval-select"
            >
              <template v-slot:item="{ props: itemProps, item }">
                <v-list-item v-bind="itemProps" :disabled="!supervisorChannel(item.raw)">
                  <template v-slot:append>
                    <v-chip :color="supervisorChip(item.raw).color" size="x-small" label>{{ supervisorChip(item.raw).text }}</v-chip>
                  </template>
                </v-list-item>
              </template>
              <template v-slot:chip="{ props: chipProps, item }">
                <v-chip v-bind="chipProps" :color="supervisorChip(item.raw).color" size="small" label>{{ item.raw.name }}</v-chip>
              </template>
            </v-select>
            <v-btn
              color="red-darken-2"
              variant="flat"
              prepend-icon="mdi-send"
              :loading="notifying"
              :disabled="selectedSupervisorKeys.length === 0 || supervisorsLoading"
              :block="smAndDown"
              @click="notifySupervisors"
            >
              {{ pendingApprovalItems.length > 0 ? '通知主管' : '再次通知' }}
            </v-btn>
          </div>
          <div v-if="supervisorOptions.length === 0 && !supervisorsLoading" class="text-caption text-red-darken-2 mt-2">
            本案沒有可通知的主管（未綁定 LINE 且無 Email），請先完成綁定或洽系統管理員。
          </div>

          <v-alert v-if="lastNotice" type="success" variant="tonal" density="compact" class="mt-3">
            通知已發送給 {{ lastNotice.names }}（{{ lastNotice.at }}）{{ lastNotice.simulated ? '（測試建案：僅模擬，未實際發送）' : '' }}。<br>
            <strong>請確認主管已核對金額後再繼續列印。</strong>
          </v-alert>
        </div>
      </template>

      <v-divider></v-divider>

      <v-card-actions class="pa-3 flex-wrap justify-end ga-1">
        <v-btn variant="text" @click="show = false">取消</v-btn>
        <v-spacer></v-spacer>
        <!-- ✅ [新增] 預覽：iframe 渲染與列印完全相同的版面 -->
        <span v-if="actionBlockReason" class="text-caption text-red-darken-2 mr-2">{{ actionBlockReason }}</span>
        <v-btn
          color="teal-darken-1"
          variant="outlined"
          prepend-icon="mdi-eye-outline"
          :disabled="actionsDisabled"
          @click="openPdfPreview"
        >
          預覽
        </v-btn>
        <!-- ✅ [新增] 下載 PDF：逐頁轉圖嵌入 A4 PDF 下載 -->
        <v-btn
          color="red-darken-1"
          variant="tonal"
          prepend-icon="mdi-file-pdf-box"
          :disabled="actionsDisabled"
          :loading="isDownloadingPdf"
          @click="downloadPdf"
        >
          下載PDF
        </v-btn>
        <v-btn
          color="teal-darken-1"
          variant="flat"
          prepend-icon="mdi-printer"
          :disabled="actionsDisabled"
          @click="handlePrint"
        >
          列印 ({{ selectedIds.length }})
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>

  <!-- ✅ [新增] 報價單預覽（與列印/PDF 同一份版面），可直接下載 PDF -->
  <v-dialog v-model="isPdfPreviewVisible" fullscreen transition="dialog-bottom-transition">
    <v-card class="d-flex flex-column">
      <v-toolbar color="teal-darken-1" density="compact">
        <v-btn icon="mdi-close" variant="text" @click="isPdfPreviewVisible = false"></v-btn>
        <v-toolbar-title>報價單預覽（{{ selectedIds.length }} 戶）</v-toolbar-title>
        <v-spacer></v-spacer>
        <!-- ✅ [新增] 預覽完可直接列印（與「列印」按鈕同一份版面） -->
        <v-btn
          variant="text"
          prepend-icon="mdi-printer"
          @click="handlePrint"
        >
          列印
        </v-btn>
        <v-btn
          variant="text"
          prepend-icon="mdi-file-pdf-box"
          :loading="isDownloadingPdf"
          @click="downloadPdf"
        >
          下載PDF
        </v-btn>
      </v-toolbar>
      <iframe class="pdf-preview-frame flex-grow-1" :srcdoc="previewHtml" title="報價單預覽"></iframe>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import { useToast } from 'vue-toastification';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { useDisplay } from 'vuetify';
import { useQuoteStore } from '@/store/quoteStore';
import { useProjectStore } from '@/store/projectStore';
import { useParkingStore } from '@/store/parkingStore';
import { useUserStore } from '@/store/user';
import { fetchQuoteRemark, checkQuoteFloor, notifyQuoteApproval, listQuoteSupervisors } from '@/api';
import { generateQrDataUrl } from '@/utils/quoteQrCode';

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  projectId: { type: String, default: '' },
  projectName: { type: String, default: '' },
  personnelName: { type: String, default: '' },
  personnelPhone: { type: String, default: '' },
});
const emit = defineEmits(['update:modelValue']);

const toast = useToast();
const quoteStore = useQuoteStore();
const projectStore = useProjectStore();
const parkingStore = useParkingStore();
const userStore = useUserStore();
const { smAndDown } = useDisplay();

const show = computed({
  get: () => props.modelValue,
  set: (v) => emit('update:modelValue', v),
});

// =================================================================
// ✅ [新增] 列印前底價守門（規格 docs/SPEC_QuoteFloorPriceApproval.md §3、§4、§6）
//   - 開啟對話框即背景核對全部戶別（後端讀最新底價；回應不含任何金額）
//   - 有需確認戶別 → 選主管 → 通知 → 直接解鎖（不需勾選確認框）
//   - 簽章（後端計算）不符 → 視為未通知，需重新通知
// =================================================================
const CHECK_CACHE_MS = 10 * 60 * 1000;
const floorCheck = ref({ loading: false, error: '', results: {}, checkedAt: 0 }); // results: { [internalId]: { needsApproval, missingUnit, missingHouseFloor, missingParking, signature, localKey } }
const supervisorOptions = ref([]);       // [{ userKey, name, hasLine, hasEmail }]
const supervisorsLoading = ref(false);
const selectedSupervisorKeys = ref([]);
const notifying = ref(false);
const lastNotice = ref(null);            // { names, at, simulated }

const spotIdsOf = (item) => [...new Set((item.selectedParking || []).map(p => String(p?.spotId || p?.['車位編號'] || '').trim()).filter(Boolean))].sort();
// 核對金額 = 買方實付總價（配套：配套價＋配套金額；非配套：總價）
const payableOf = (item) => Math.round(quoteStore.getPayableTotalPrice(item.internalId));
const localKeyOf = (item) => `${item.unitId}|${payableOf(item)}|${spotIdsOf(item).join(',')}`;

function buildCheckItems(items) {
  return items.map(item => ({
    internalId: item.internalId,
    unitId: item.unitId,
    quoteTotal: payableOf(item),
    parkingSpotIds: spotIdsOf(item),
  }));
}

function isCacheValid(item) {
  const r = floorCheck.value.results[item.internalId];
  if (!r) return false;
  if (r.localKey !== localKeyOf(item)) return false;
  return (Date.now() - (r.checkedAt || 0)) < CHECK_CACHE_MS;
}

async function runFloorCheck(force = false) {
  const targets = force ? quoteStore.items : quoteStore.items.filter(i => !isCacheValid(i));
  if (targets.length === 0) return;
  if (!userStore.user?.key) {
    floorCheck.value.error = '尚未登入，無法核對';
    return;
  }
  floorCheck.value.loading = true;
  floorCheck.value.error = '';
  try {
    const res = await checkQuoteFloor({
      projectId: props.projectId,
      operatorKey: userStore.user.key,
      items: buildCheckItems(targets),
    });
    if (res.status !== 'success') throw new Error(res.message || '核對失敗');
    const now = Date.now();
    const byId = new Map(targets.map(i => [i.internalId, i]));
    const next = { ...floorCheck.value.results };
    (res.results || []).forEach(r => {
      const item = byId.get(r.internalId);
      if (!item) return;
      next[r.internalId] = { ...r, localKey: localKeyOf(item), checkedAt: now };
    });
    floorCheck.value.results = next;
    floorCheck.value.checkedAt = now;
  } catch (e) {
    console.error('[QuotePrintDialog] 底價核對失敗:', e);
    floorCheck.value.error = e.message || '未知錯誤';
  } finally {
    floorCheck.value.loading = false;
  }
}

const resultOf = (item) => floorCheck.value.results[item.internalId] || null;

// 需主管確認的戶別（全部報價項目，不限勾選）
const approvalItems = computed(() => quoteStore.items
  .filter(item => resultOf(item)?.needsApproval)
  .map(item => {
    const r = resultOf(item);
    const fa = item.floorApproval || {};
    const notified = !!fa.signature && fa.signature === r.signature;
    return {
      item,
      result: r,
      notified,
      supervisorText: (fa.supervisors || []).map(s => `${s.name}（${s.channel === 'email' ? 'Email' : 'LINE'}）`).join('、'),
      notifiedAtText: fa.notifiedAt ? fmtTaipei(fa.notifiedAt) : '',
    };
  }));
// 尚未通知（或簽章已變）的戶別
const pendingApprovalItems = computed(() => approvalItems.value.filter(e => !e.notified));
const missingUnitItems = computed(() => quoteStore.items.filter(item => resultOf(item)?.missingUnit));
const floorWarningText = computed(() => {
  const noFloor = quoteStore.items.filter(item => resultOf(item)?.missingHouseFloor).map(i => i.unitId);
  const noParking = [...new Set(quoteStore.items.flatMap(item => resultOf(item)?.missingParking || []))];
  const parts = [];
  if (noFloor.length) parts.push(`${noFloor.join('、')} 未設定房屋底價，無法核對，請通知銷控補登`);
  if (noParking.length) parts.push(`車位 ${noParking.join('、')} 查無銷控資料，未納入核對`);
  return parts.join('；');
});

// 勾選中的戶別是否仍被阻擋
const blockedSelectedIds = computed(() => selectedIds.value.filter(id => {
  const item = quoteStore.items.find(i => i.internalId === id);
  if (!item) return false;
  const r = resultOf(item);
  if (!r) return true;                       // 尚未核對
  if (r.missingUnit) return true;
  if (!r.needsApproval) return false;
  return !approvalItems.value.find(e => e.item.internalId === id)?.notified;
}));
const actionBlockReason = computed(() => {
  if (selectedIds.value.length === 0) return '';
  if (floorCheck.value.loading) return '核對中…';
  if (floorCheck.value.error) return '核對失敗，請重新核對';
  const blocked = blockedSelectedIds.value
    .map(id => quoteStore.items.find(i => i.internalId === id)?.unitId)
    .filter(Boolean);
  if (blocked.length === 0) return '';
  const hasMissing = blocked.some(u => missingUnitItems.value.some(m => m.unitId === u));
  return hasMissing ? `${blocked.join('、')} 需移除後重新加入` : `${blocked.join('、')} 價格須經主管確認，請先通知主管`;
});
const actionsDisabled = computed(() =>
  selectedIds.value.length === 0 || floorCheck.value.loading || !!floorCheck.value.error || blockedSelectedIds.value.length > 0
);

function fmtTaipei(iso) {
  try {
    return new Intl.DateTimeFormat('zh-TW', {
      timeZone: 'Asia/Taipei', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false,
    }).format(new Date(iso));
  } catch { return ''; }
}

const supervisorChannel = (s) => (s?.hasLine ? 'line' : (s?.hasEmail ? 'email' : null));
function supervisorChip(s) {
  const ch = supervisorChannel(s);
  if (ch === 'line') return { color: 'success', text: 'LINE' };
  if (ch === 'email') return { color: 'info', text: 'Email' };
  return { color: 'grey', text: '無法通知' };
}

async function loadSupervisors() {
  if (supervisorsLoading.value) return;
  supervisorsLoading.value = true;
  try {
    const res = await listQuoteSupervisors({ projectId: props.projectId, operatorKey: userStore.user?.key });
    if (res.status !== 'success') throw new Error(res.message || '載入主管名單失敗');
    supervisorOptions.value = (res.supervisors || []).filter(s => supervisorChannel(s));
    // 預設全選可通知者
    selectedSupervisorKeys.value = supervisorOptions.value.map(s => s.userKey);
  } catch (e) {
    console.error('[QuotePrintDialog] 載入主管名單失敗:', e);
    toast.error(`載入主管名單失敗：${e.message}`);
    supervisorOptions.value = [];
    selectedSupervisorKeys.value = [];
  } finally {
    supervisorsLoading.value = false;
  }
}
// 出現需確認戶別時才載入主管名單（每次開啟對話框重新載入）
watch(() => approvalItems.value.length, (n, prev) => {
  if (n > 0 && (prev === 0 || prev === undefined) && supervisorOptions.value.length === 0) loadSupervisors();
});

function buildNotifyUnits(entries) {
  return entries.map(({ item }) => ({
    internalId: item.internalId,
    unitId: item.unitId,
    quoteTotal: payableOf(item),
    areaHousePing: Number(item.unitDetails?.area_house_ping) || 0,
    usePackageDeal: !!item.usePackageDeal,
    packageDeal: item.usePackageDeal ? Math.round(Number(item.unitDetails?.price_package_deal) || 0) : 0,   // 配套價（一般期款）
    packageAmount: item.usePackageDeal ? Math.round(quoteStore.getPackagePrice(item.internalId)) : 0,     // 配套金額（配套期款）
    houseListPrice: quoteStore.getListHousePrice(item.internalId),
    houseNegotiatedPrice: quoteStore.getNegotiatedHousePrice(item.internalId),
    parking: (item.selectedParking || []).map(p => ({
      spotId: String(p?.spotId || p?.['車位編號'] || '').trim(),
      priceList: Number(p?.price_list) || 0,
    })).filter(p => p.spotId),
  }));
}

async function notifySupervisors() {
  if (notifying.value) return;
  let targets = pendingApprovalItems.value;
  if (targets.length === 0) {
    // O4：全部已通知 → 再次通知需確認
    targets = approvalItems.value;
    if (targets.length === 0) return;
    const latest = targets.map(e => e.item.floorApproval?.notifiedAt).filter(Boolean).sort().pop();
    const ok = confirm(`已於 ${latest ? fmtTaipei(latest) : '稍早'} 通知過，是否再次發送？`);
    if (!ok) return;
  }
  if (selectedSupervisorKeys.value.length === 0) {
    toast.warning('請至少選擇一位主管');
    return;
  }

  notifying.value = true;
  try {
    const res = await notifyQuoteApproval({
      projectId: props.projectId,
      projectName: props.projectName,
      operatorKey: userStore.user?.key,
      operatorName: userStore.user?.name || '',
      salesName: props.personnelName || userStore.user?.name || '',
      salesPhone: props.personnelPhone || '',
      supervisorKeys: selectedSupervisorKeys.value,
      units: buildNotifyUnits(targets),
    });
    if (res.status !== 'success') throw new Error(res.message || '通知失敗');
    if (res.skipped === 'no-breach') {
      // 後端以最新底價核對已不需確認 → 重新核對以解鎖
      toast.info('依最新底價核對，這些戶別已不需主管確認');
      await runFloorCheck(true);
      return;
    }
    const okSupervisors = (res.supervisors || []).filter(s => s.status === 'sent' || s.status === 'simulated');
    const failed = (res.supervisors || []).filter(s => s.status === 'failed');
    if (okSupervisors.length === 0) {
      throw new Error(failed.map(f => `${f.name}：${f.error || '發送失敗'}`).join('；') || '所有主管皆發送失敗');
    }
    const notifiedAt = res.notifiedAt || new Date().toISOString();
    (res.requests || []).forEach(r => {
      quoteStore.setFloorApproval(r.internalId, {
        signature: r.signature,
        requestId: r.requestId,
        notifiedAt,
        supervisors: okSupervisors.map(s => ({ userKey: s.userKey, name: s.name, channel: s.channel })),
      });
      // 同步本地核對結果簽章（後端 notify 時以最新資料重算）
      const item = quoteStore.items.find(i => i.internalId === r.internalId);
      if (item && floorCheck.value.results[r.internalId]) {
        floorCheck.value.results[r.internalId] = { ...floorCheck.value.results[r.internalId], signature: r.signature, localKey: localKeyOf(item) };
      }
    });
    lastNotice.value = {
      names: okSupervisors.map(s => s.name).join('、'),
      at: res.notifiedAtTaipei || fmtTaipei(notifiedAt),
      simulated: !!res.simulated,
    };
    if (failed.length > 0) {
      toast.warning(`部分主管通知失敗：${failed.map(f => f.name).join('、')}`);
    }
    toast.success('通知已發送，請確認主管已核對金額後再繼續列印');
  } catch (e) {
    console.error('[QuotePrintDialog] 通知主管失敗:', e);
    toast.error(`通知主管失敗：${e.message}`);
  } finally {
    notifying.value = false;
  }
}

// 動作前最後防線（按鈕本身已 disabled）
function ensureCanProceed() {
  if (actionsDisabled.value) {
    if (actionBlockReason.value) toast.warning(actionBlockReason.value);
    return false;
  }
  return true;
}

// --- 列印選項 ---
const optShowNegotiation = ref(true); // 顯示議價資訊（原價/優惠額），預設開啟
const optShowNotes = ref(true);        // 列印期款說明（applyNote）
const optShowPlans = ref(true);        // ✅ [新增] 顯示採用方案（方案名稱＋所選付款方式），預設開啟
const optShowLoan = ref(true);         // 公司借貸攤還表（有附掛借貸的戶別），預設開啟
const optShowApproval = ref(true);     // ✅ [新增] 主管簽核／用印欄，預設開啟
const optShowQr = ref(true);           // ✅ [新增] 建案簡介 QR Code（僅在有設定網址時可切換）
const optQuoteDate = ref('');          // 報價日期（可自訂）
const optValidUntil = ref('');         // 有效期限（選填）

// --- 建案簡介 QR Code（網址由銷控權限人員於「報價單設定」維護；未設定則整塊不渲染） ---
const introQrDataUrl = ref('');
const hasIntroQr = computed(() => !!introQrDataUrl.value);

// 讀取該建案的簡介網址並產生中央帶建案名稱的 QR Code；失敗或未設定時一律不印
async function loadIntroQr() {
  introQrDataUrl.value = '';
  try {
    const data = await projectStore.fetchProjectSettings(props.projectId);
    const url = String(data?.quoteIntroUrl || '').trim();
    if (!url) return;
    introQrDataUrl.value = await generateQrDataUrl(url, props.projectName, { size: 512 });
  } catch (e) {
    console.error('[QuotePrintDialog] 建案簡介 QR Code 產生失敗:', e);
    introQrDataUrl.value = '';
  }
}

// --- 報價單備註（渲染於每戶報價單最下方；每次開啟對話框時重新載入） ---
const remarkHtml = ref('');
const remarkLoadError = ref(false);
const isRemarkExpanded = ref(false);

// 基本淨化：移除 script 等危險標籤與 on* 事件屬性
function sanitizeHtml(html) {
  if (!html) return '';
  const tpl = document.createElement('template');
  tpl.innerHTML = html;
  tpl.content.querySelectorAll('script, style, iframe, object, embed, link, meta').forEach(el => el.remove());
  tpl.content.querySelectorAll('*').forEach(el => {
    [...el.attributes].forEach(attr => {
      if (/^on/i.test(attr.name)) el.removeAttribute(attr.name);
      if (attr.name === 'href' && /^\s*javascript:/i.test(attr.value)) el.removeAttribute(attr.name);
    });
  });
  return tpl.innerHTML;
}

// ✅ 含錯誤處理：失敗時清空並標示，避免停留在上次內容或 unhandled rejection
async function loadRemark() {
  remarkLoadError.value = false;
  try {
    const res = await fetchQuoteRemark(props.projectId);
    if (res.status === 'success') {
      remarkHtml.value = res.data?.content ? sanitizeHtml(res.data.content) : '';
    } else {
      remarkHtml.value = '';
      remarkLoadError.value = true;
    }
  } catch (e) {
    console.error('[QuotePrintDialog] loadRemark error:', e);
    remarkHtml.value = '';
    remarkLoadError.value = true;
  }
}

// --- 戶別勾選 ---
const selectedIds = ref([]);

// 該戶是否有適用的期款範本（printPaymentData.general 由 QuoteItem 同步）
function hasPaymentTemplate(item) {
  return !!item.printPaymentData?.general;
}

// 開啟對話框：載入備註、重設選項；預設只勾選「有期款範本」的戶別
watch(show, (visible) => {
  if (!visible) return;
  selectedIds.value = quoteStore.items
    .filter(i => hasPaymentTemplate(i))
    .map(i => i.internalId);
  optShowNegotiation.value = true;
  optShowApproval.value = true;
  optShowQr.value = true;
  optShowPlans.value = true; // ✅ [新增] 顯示採用方案預設開啟
  optShowLoan.value = true;  // 公司借貸攤還表預設開啟
  optQuoteDate.value = isoTodayTW();
  optValidUntil.value = '';
  isRemarkExpanded.value = false;
  loadRemark();
  loadIntroQr();
  // ✅ [新增] 開啟即背景核對底價（每次開啟重新核對全部戶別；主管名單重新載入）
  floorCheck.value = { loading: false, error: '', results: {}, checkedAt: 0 };
  supervisorOptions.value = [];
  selectedSupervisorKeys.value = [];
  lastNotice.value = null;
  runFloorCheck(true);
});

const isAllSelected = computed(() =>
  quoteStore.items.length > 0 && selectedIds.value.length === quoteStore.items.length
);
const isSomeSelected = computed(() => selectedIds.value.length > 0);

function toggleAll(value) {
  selectedIds.value = value ? quoteStore.items.map(i => i.internalId) : [];
}

function toggleItem(internalId) {
  const idx = selectedIds.value.indexOf(internalId);
  if (idx === -1) selectedIds.value.push(internalId);
  else selectedIds.value.splice(idx, 1);
}

// --- 格式化工具 ---
const esc = (v) => String(v ?? '')
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&#39;');

const fmt = (n, frac = 0) => {
  const num = Number(n);
  if (isNaN(num)) return '-';
  return num.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: frac });
};

// 台灣時區今日（YYYY-MM-DD，供 date input 預設值）
const isoTodayTW = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Taipei' }).format(new Date());
// YYYY-MM-DD → YYYY/MM/DD
const fmtDate = (iso) => (iso ? String(iso).replace(/-/g, '/') : '');

// --- 期款區塊 HTML ---
// isFull: 滿版區塊；項目多時自動雙欄。父項與其子項包成群組，雙欄分欄時不會被拆開
function renderPayBlock(block, accent, title, totalLabel, totalValue, isFull = false) {
  if (!block) return '';
  const rowList = block.rows || [];
  const twoCol = isFull && rowList.length >= 10;
  const hasChild = rowList.some(r => r.isChild);

  // 將父項＋其後連續的子項組成群組
  const groups = [];
  rowList.forEach(r => {
    if (!r.isChild || groups.length === 0) groups.push([r]);
    else groups[groups.length - 1].push(r);
  });

  // 子項目金額以括號＋灰字呈現，與父項目粗體深色明確區隔，避免人工計算時重複累加
  const rowsHtml = groups.map(group => `
        <div class="pgroup">${group.map(r => `
          <div class="prow${r.isChild ? ' child' : ''}">
            <span class="pname">${esc(r.name)}${r.hint ? `<span class="hint">${esc(r.hint)}</span>` : ''}</span>
            <span class="lead"></span>
            <span class="pval">${r.isChild ? `(${fmt(r.value)}<i>萬</i>)` : `${fmt(r.value)}<i>萬</i>`}</span>
          </div>`).join('')}
        </div>`).join('');

  const childNote = hasChild
    ? '<div class="child-note">（ ）內金額為所屬期款之內含明細，已包含於上方項目金額中，請勿重複累加</div>'
    : '';

  return `
      <div class="pay-block${isFull ? ' full' : ''}">
        <div class="pay-head" style="background:${accent};">
          <span>${esc(title)}</span>
          <small>${esc(block.templateName || '')}</small>
        </div>
        <div class="pay-rows${twoCol ? ' two-col' : ''}">${rowsHtml}
        </div>${childNote}
        <div class="ptotal" style="color:${accent};">
          <span>${esc(totalLabel)}</span>
          <span>${fmt(totalValue)} 萬</span>
        </div>
      </div>`;
}

// --- 公司借貸攤還表區塊 HTML ---
// 全寬模式：期數多時（>12）自動左右分成兩欄表格控制頁高
// singleColumn：與付款方式左右並排時，右欄寬度有限，一律單欄表格
function renderLoanBlock(loan, { singleColumn = false } = {}) {
  if (!loan) return '';

  const makeTable = (rows) => `
      <table class="loan-tbl">
        <thead>
          <tr><th>期別</th><th>本金(元)</th><th>利息(元)</th><th>每期金額(元)</th><th>剩餘本金(元)</th></tr>
        </thead>
        <tbody>${rows.map(r => `
          <tr>
            <td>${r.period}</td>
            <td>${fmt(r.principal)}</td>
            <td>${fmt(r.interest)}</td>
            <td class="pay">${fmt(r.payment)}</td>
            <td class="rem">${fmt(r.remaining)}</td>
          </tr>`).join('')}
        </tbody>
      </table>`;

  const rows = loan.rows || [];
  let tablesHtml;
  if (!singleColumn && rows.length > 12) {
    const mid = Math.ceil(rows.length / 2);
    tablesHtml = `<div class="loan-cols">${makeTable(rows.slice(0, mid))}${makeTable(rows.slice(mid))}</div>`;
  } else {
    tablesHtml = makeTable(rows);
  }

  const interval = Number(loan.intervalMonths) || 0;
  const intervalText = Number.isInteger(interval) ? String(interval) : interval.toFixed(1);

  return `
    <div class="loan-block">
      <div class="loan-head">
        <span>${esc(loan.loanName || '')}</span>
        <small>借貸金額 ${fmt(loan.loanAmount)} 元（總價×${esc(loan.ratioPercent)}%）｜年利率 ${esc(loan.annualRate)}%｜${esc(loan.years)}年${esc(loan.periods)}期（每期約${intervalText}個月）｜${esc(loan.amortizationType || '')}</small>
      </div>
      ${tablesHtml}
      <div class="loan-totals">
        <span>本金合計 <b>${fmt(loan.totals?.principal)}</b> 元</span>
        <span>利息合計 <b>${fmt(loan.totals?.interest)}</b> 元</span>
        <span>本利合計 <b class="grand">${fmt(loan.totals?.payment)}</b> 元</span>
      </div>
      ${loan.note ? `<div class="loan-note">${esc(loan.note)}</div>` : ''}
    </div>`;
}

// --- 單一戶別 → 一頁 A4 ---
function renderSheet(item) {
  const id = item.internalId;
  const ud = item.unitDetails || {};
  const type = ud.propertyType || ud.layout || '-';
  const area = ud.area_house_ping;

  // 詳細面積資訊：坪／m² 雙列表格（欄＝項目，列＝單位）
  // 坪列為主值（粗體深藍、淡藍底），m² 列為資料庫平方公尺欄位值（不做換算）以正常字重深灰顯示；
  // 單位只在最左欄標示一次，各格只放數字，坪與 m² 上下對齊便於對照
  const pingWithSqm = (ping, sqm) => {
    const s = Number(sqm);
    const hasSqm = sqm !== null && sqm !== undefined && sqm !== '' && !isNaN(s);
    return { ping: fmt(ping, 2), sqm: hasSqm ? fmt(s, 2) : '' };
  };
  const areaDetailItems = [
    ['主建物(室內)', ud.area_main_ping, ud.area_main_sqm],
    ['附屬建物(陽台)', ud.area_ancillary_ping, ud.area_ancillary_sqm],
    ['共用部分(公設)', ud.area_common_ping, ud.area_common_sqm],
    ['露臺(不計坪)', ud.area_terrace_ping, null],
    ['土地持分面積', ud.land_share_ping, ud.land_share_sqm],
  ]
    .filter(([, v]) => v !== null && v !== undefined && v !== '')
    .map(([label, ping, sqm]) => ({ label, ...pingWithSqm(ping, sqm) }));
  const buildAreaStrip = () => areaDetailItems.length ? `
    <section class="area-tbl-wrap">
      <table class="area-tbl">
        <thead><tr><th class="corner">詳細面積</th>${areaDetailItems.map(it => `<th>${esc(it.label)}</th>`).join('')}</tr></thead>
        <tbody>
          <tr class="row-ping"><th>坪</th>${areaDetailItems.map(it => it.ratio
            ? `<td class="ratio" rowspan="2">${esc(it.ratio)}</td>`
            : `<td>${esc(it.ping)}</td>`).join('')}</tr>
          <tr class="row-sqm"><th>m²</th>${areaDetailItems.map(it => it.ratio
            ? ''
            : (it.sqm ? `<td>${esc(it.sqm)}</td>` : `<td class="empty">—</td>`)).join('')}</tr>
        </tbody>
      </table>
    </section>` : '';

  const housePrice = quoteStore.getRawDisplayHousePrice(id);
  const unitPrice = quoteStore.getDisplayUnitPrice(id);
  // ✅ [新增] 露臺戶：房屋單價與露臺單價分開計算
  const hasTerraceSplit = quoteStore.hasTerraceSplit(id);
  const terracePrice = quoteStore.getTerraceListPrice(id);
  const terraceUnitPrice = quoteStore.getTerraceUnitPrice(id);
  const usePackage = !!item.usePackageDeal;
  const packagePrice = quoteStore.getPackagePrice(id);
  const total = quoteStore.getFinalTotalPrice(id);
  const pay = item.printPaymentData || {};

  // ✅ [選項] 議價資訊：原價（刪除線）＋已優惠金額（僅非配套且確有調價時）；總價與單價都呈現
  let housePriceVal = `${fmt(housePrice)} 萬`;
  let unitPriceVal = `${fmt(unitPrice, 2)} 萬/坪`;
  if (optShowNegotiation.value && !usePackage) {
    // ✅ [重構] 原價 = 表價（unitDetails 唯讀）、現價 = 議價後房屋總價（由 store 推導）
    const orig = quoteStore.getListHousePrice(id);
    const cur = quoteStore.getNegotiatedHousePrice(id);
    if (quoteStore.hasNegotiation(id) && orig > 0 && orig !== cur) {
      const delta = orig - cur;
      housePriceVal += delta > 0
        ? `<span class="orig-price">${fmt(orig)}萬</span><span class="disc">已優惠 ${fmt(delta)}萬</span>`
        : `<span class="orig-price">${fmt(orig)}萬</span><span class="disc up">調整 +${fmt(-delta)}萬</span>`;

      // 單價的優惠資訊：以原價/現價除以面積換算（露臺價不計入，與房屋單價定義一致）
      const areaNum = Number(area);
      if (areaNum > 0) {
        const origUnit = (orig - terracePrice) / areaNum;
        const deltaUnit = delta / areaNum;
        unitPriceVal += delta > 0
          ? `<span class="orig-price">${fmt(origUnit, 2)}萬/坪</span><span class="disc">已優惠 ${fmt(deltaUnit, 2)}萬/坪</span>`
          : `<span class="orig-price">${fmt(origUnit, 2)}萬/坪</span><span class="disc up">調整 +${fmt(-deltaUnit, 2)}萬/坪</span>`;
      }
    }
  }

  // 車位：≤2 個時逐一列在資訊格內（編號＋單價）；>2 個改獨立橫列，避免撐爆資訊格
  const parkingList = item.selectedParking || [];
  const parkingPrice = quoteStore.getParkingTotalPrice(id);
  const parkingInline = parkingList.length
    ? parkingList.map(p => {
        const price = Number(p.price_list) || 0;
        return price > 0
          ? `${esc(p['車位編號'])}<span class="pk-price">（${fmt(price)}萬）</span>`
          : esc(p['車位編號']);
      }).join('、')
    : '—';
  const useParkingStrip = parkingList.length > 2;
  const parkingCellVal = useParkingStrip ? `共 ${parkingList.length} 個（明細見下）` : parkingInline;

  // ✅ [新增] 車位持分面積：坪優先取車位資料 area_ping，未填時以 m²(area) × 0.3025 換算；加總所有已選車位
  // 報價單內的車位物件若未帶面積（舊資料），以車位編號回查車位總表補齊
  const parkingMaster = parkingStore.parkingData || [];
  const spotKey = p => String(p?.spotId ?? p?.['車位編號'] ?? '').trim();
  const masterSpot = p => {
    const k = spotKey(p);
    return k ? parkingMaster.find(m => spotKey(m) === k) : null;
  };
  const pickArea = (p, field) => {
    const own = Number(p?.[field]);
    if (own > 0) return own;
    const mv = Number(masterSpot(p)?.[field]);
    return mv > 0 ? mv : 0;
  };
  const spotSqm = p => pickArea(p, 'area');
  const spotPing = p => pickArea(p, 'area_ping') || Math.round(spotSqm(p) * 0.3025 * 100) / 100;
  const parkingAreaPing = parkingList.reduce((sum, p) => sum + spotPing(p), 0);
  const parkingAreaSqm = parkingList.reduce((sum, p) => sum + spotSqm(p), 0);
  const hasParkingArea = parkingAreaPing > 0 || parkingAreaSqm > 0;
  // ✅ [新增] 詳細面積列最後一格：車位持分面積 坪(m²)（多車位加總）
  if (hasParkingArea) {
    areaDetailItems.push({ label: '車位持分面積', ...pingWithSqm(parkingAreaPing, parkingAreaSqm > 0 ? parkingAreaSqm : null) });
  }
  // ✅ [優化] 公設比固定為詳細面積列最後一格
  const ratio = parseFloat(ud.common_area_ratio);
  if (!isNaN(ratio)) {
    areaDetailItems.push({ label: '公設比', ratio: `${(ratio * 100).toFixed(2)} %` });
  }
  const areaStrip = buildAreaStrip();

  const parkingStrip = useParkingStrip ? `
    <section class="wide-strip">
      <span class="lbl">車位明細</span>
      ${parkingList.map(p => {
        const price = Number(p.price_list) || 0;
        const ping = spotPing(p);
        const sqm = spotSqm(p);
        const areaNote = ping > 0 || sqm > 0
          ? `<span class="sqm">${fmt(ping, 2)} 坪${sqm > 0 ? `(${fmt(sqm, 2)}m²)` : ''}</span>`
          : '';
        return `
      <span class="strip-item"><em>${esc(p['車位編號'])}</em><b>${price > 0 ? `${fmt(price)} 萬` : '—'}${areaNote}</b></span>`;
      }).join('')}
    </section>` : '';

  // 配套未勾選時不渲染「配套／配套價」欄位
  const infoCells = [
    ['戶別', `<b>${esc(item.unitId)}</b>`],
    ['物件類型', esc(type)],
    ['面積', (() => { const a = pingWithSqm(area, ud.area_house_sqm); return `<b>${esc(a.ping)} 坪</b>${a.sqm ? `<span class="sqm-inline">／ ${esc(a.sqm)} m²</span>` : ''}`; })()],
    ['首購', item.isFirstTimeBuyer === '是' ? '首購' : '非首購'],
    ['房屋總價', housePriceVal],
    [hasTerraceSplit ? '房屋單價(不含露臺)' : '房屋單價', unitPriceVal],
    // ✅ [新增] 露臺戶：獨立列出露臺價與露臺單價
    ...(hasTerraceSplit ? [
      ['露臺價', `${fmt(terracePrice)} 萬<span class="sub-note">${fmt(ud.area_terrace_ping, 2)} 坪</span>`],
      ['露臺單價', `${fmt(terraceUnitPrice, 2)} 萬/坪`],
    ] : []),
    ['車位', parkingCellVal],
    ['車位價格', parkingPrice > 0 ? `${parkingList.length > 1 ? '合計 ' : ''}${fmt(parkingPrice)} 萬` : '—'],
    ...(usePackage ? [
      ['配套', '是'],
      // ✅ 配套模式議價：折讓自配套金額扣除，顯示原配套金額（刪除線）＋已優惠
      ['配套價', (() => {
        const listPkg = quoteStore.getListPackagePrice(id);
        const disc = listPkg - packagePrice;
        if (optShowNegotiation.value && quoteStore.hasNegotiation(id) && disc !== 0) {
          return `${fmt(packagePrice)} 萬` + (disc > 0
            ? `<span class="orig-price">${fmt(listPkg)}萬</span><span class="disc">已優惠 ${fmt(disc)}萬</span>`
            : `<span class="orig-price">${fmt(listPkg)}萬</span><span class="disc up">調整 +${fmt(-disc)}萬</span>`);
        }
        return `${fmt(packagePrice)} 萬`;
      })()],
    ] : []),
  ].map(([lbl, val]) => `
      <div class="cell"><span class="lbl">${lbl}</span><span class="val">${val}</span></div>`).join('');

  // 期款版型：僅渲染前端實際採用的期款（總價期款或優付期款擇一；配套期款依前端顯示）
  const generalTitle = pay.generalIsPreferred ? '優付期款' : '總價期款';
  const generalAccent = pay.generalIsPreferred ? '#8a6d1c' : '#1a3c6e';
  const hasPackageBlock = !!pay.package;
  const bothBlocks = !!pay.general && hasPackageBlock;
  const payFlexClass = bothBlocks ? 'pay-flex pair' : 'pay-flex';

  // 公司借貸：有附掛時付款方式靠左、攤還表靠右並排，省下縱向空間維持大字級
  const loanHtml = optShowLoan.value ? renderLoanBlock(pay.companyLoan, { singleColumn: true }) : '';
  const hasLoanSide = !!loanHtml;

  // 兩表並存時一律左右並排（頁面高度取兩者較高者，遠低於上下堆疊的相加高度）
  // 與借貸並排時，期款表在左欄內上下堆疊（isFull=false 避免項目雙欄拆分）
  const payBlocks = [
    renderPayBlock(pay.general, generalAccent, generalTitle, '總價', total, hasLoanSide ? false : !hasPackageBlock),
    renderPayBlock(pay.package, '#2e7d32', '配套期款', '配套金額', packagePrice, hasLoanSide ? false : !pay.general),
  ].filter(Boolean);
  const payBlocksHtml = payBlocks.length
    ? payBlocks.join('')
    : '<div class="no-pay">尚無適用的期款資料，請確認期款範本設定。</div>';

  const payArea = hasLoanSide ? `
    <div class="pay-loan-grid">
      <div class="pl-col pl-left">
        <div class="sec-title">付款方式</div>
        ${payBlocksHtml}
      </div>
      <div class="pl-col pl-right">
        <div class="sec-title loan-title">公司借貸</div>
        ${loanHtml}
      </div>
    </div>` : `
    <div class="sec-title">付款方式</div>
    <div class="${payFlexClass}">
      ${payBlocksHtml}
    </div>`;

  // ✅ [新增] 採用方案帶：完整方案名稱＋所選付款方式，一目了然本報價單採用的方案組合
  const appliedPlans = optShowPlans.value ? (item.appliedPlans || []) : [];
  const planBand = appliedPlans.length ? `
    <section class="plan-band">
      <span class="plan-lbl">採用方案</span>
      ${appliedPlans.map(p => `
      <span class="plan-item"><b>${esc(p.planName)}</b>${p.selectedPaymentTemplateName ? `<em>付款方式：${esc(p.selectedPaymentTemplateName)}</em>` : ''}</span>`).join(`
      <span class="plan-plus">＋</span>`)}
    </section>` : '';

  const notes = optShowNotes.value ? (pay.notes || []).filter(Boolean) : [];
  const notesHtml = notes.length ? `
      <div class="notes">
        <div class="notes-title">備註</div>
        <ol>${notes.map(n => `<li>${esc(n)}</li>`).join('')}</ol>
      </div>` : '';

  // 報價單備註（銷控權限用戶編輯的富文本，渲染於最下方、頁尾之上）
  const remarkBlock = remarkHtml.value ? `
      <div class="remark">
        <div class="remark-title">備註</div>
        <div class="remark-body">${remarkHtml.value}</div>
      </div>` : '';

  // ✅ [新增] 主管簽核／用印欄：留白供實體簽名或蓋章，置於頁尾之上
  const approvalBlock = optShowApproval.value ? `
      <section class="approval">
        <span class="ap-label">主管簽核<br><span class="ap-sub">／用印</span></span>
        <span class="ap-area"></span>
      </section>
      <div class="ap-warn">⚠️ 本報價單須經主管簽核或用印始生效力，未經簽核用印者一律視為無效。</div>` : '';

  const validText = optValidUntil.value ? `　有效期限至：${fmtDate(optValidUntil.value)}` : '';

  // ✅ [新增] 建案簡介 QR Code：未設定網址（或關閉選項）時完全不渲染，頁尾維持原本版面
  const showQr = optShowQr.value && !!introQrDataUrl.value;
  const qrBlock = showQr ? `
      <div class="foot-qr">
        <img src="${introQrDataUrl.value}" alt="建案簡介 QR Code">
        <span class="qr-cap">掃描看建案簡介</span>
      </div>` : '';

  return `
  <div class="sheet">
   <div class="inner">
    <header class="head">
      <div>
        <div class="proj">${esc(props.projectName)}</div>
        <div class="sub">報價日期：${fmtDate(optQuoteDate.value) || '—'}${validText}</div>
      </div>
      <div class="doc-title">房屋報價單</div>
    </header>

    <section class="info">${infoCells}
    </section>
    ${areaStrip}
    ${parkingStrip}

    <section class="total-band">
      <span class="t-label">總　價</span>
      <div class="tvals">
        <b>${fmt(total)} <i>萬</i></b>${usePackage && packagePrice > 0 ? `
        <span class="pkg-extra">＋ 配套價 <b>${fmt(packagePrice)}</b> 萬<small>（另依配套期款支付，未含於總價）</small></span>` : ''}
      </div>
    </section>

    ${planBand}

    ${payArea}
    ${notesHtml}
    ${remarkBlock}
    ${approvalBlock}

    <footer class="foot">
      <div class="foot-person">銷售顧問：<b>${esc(props.personnelName || '—')}</b>　聯絡電話：<b>${esc(props.personnelPhone || '—')}</b></div>${qrBlock}
    </footer>
   </div>
  </div>`;
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
  .sheet {
    width: 210mm; height: 296mm;
    /* ✅ [優化] 頁邊界縮小（12/14mm → 7/8mm），讓內容有更多空間等比放大 */
    margin: 5mm auto; padding: 7mm 8mm;
    background: #fff; box-shadow: 0 2px 10px rgba(0,0,0,.25);
    overflow: hidden;
  }
  .sheet .inner {
    display: flex; flex-direction: column;
    min-height: 100%;
    transform-origin: top left;
  }
  .head {
    display: flex; justify-content: space-between; align-items: center;
    background: #1a3c6e; color: #fff;
    padding: 5mm 7mm; border-radius: 1.5mm;
  }
  .head .proj { font-size: 18pt; font-weight: 700; letter-spacing: 1px; }
  .head .sub { font-size: 9.5pt; opacity: .85; margin-top: 1.5mm; }
  .head .doc-title { font-size: 14.5pt; font-weight: 700; letter-spacing: 5px; margin-right: -5px; }
  .info {
    display: grid; grid-template-columns: 1fr 1fr;
    border: 1px solid #cfd8dc; border-radius: 1.5mm; overflow: hidden;
    margin-top: 5mm;
  }
  .cell { display: flex; align-items: center; border-bottom: 1px solid #eceff1; }
  .cell:nth-last-child(-n+2) { border-bottom: none; }
  .cell:nth-child(odd) { border-right: 1px solid #eceff1; }
  .lbl {
    width: 25mm; align-self: stretch; display: flex; align-items: center;
    background: #f4f7fa; color: #546e7a;
    font-size: 10pt; padding: 2.6mm 3mm; flex-shrink: 0;
  }
  .val { flex: 1; padding: 2.6mm 3mm; font-size: 11pt; }
  .val b { font-size: 12.5pt; color: #1a3c6e; }
  .val .pk-price { font-size: 9pt; color: #78909c; }
  .val .orig-price { text-decoration: line-through; color: #90a4ae; font-size: 9pt; margin-left: 1.5mm; }
  .val .disc { color: #2e7d32; font-size: 9pt; font-weight: 700; margin-left: 1mm; }
  .val .disc.up { color: #c62828; }
  .val .sub-note { color: #90a4ae; font-size: 9pt; margin-left: 1.5mm; }
  .wide-strip {
    display: flex; align-items: stretch;
    border: 1px solid #cfd8dc; border-radius: 1.5mm; overflow: hidden;
    margin-top: 1.5mm;
  }
  .wide-strip .lbl {
    width: 25mm; flex-shrink: 0; display: flex; align-items: center;
    background: #f4f7fa; color: #546e7a; font-size: 10pt; padding: 2.6mm 3mm;
  }
  .strip-item {
    flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center;
    padding: 1.8mm 1mm; text-align: center;
  }
  .strip-item + .strip-item { border-left: 1px solid #eceff1; }
  .strip-item em { font-style: normal; font-size: 8.5pt; color: #78909c; white-space: nowrap; }
  .strip-item b { font-size: 11pt; color: #263238; margin-top: .6mm; font-weight: 700; white-space: nowrap; }
  /* 平方公尺：獨立一行，9pt 深灰藍（#546e7a）確保列印可讀；坪數主值仍以 11pt 粗體深色凸顯層級 */
  .sqm { display: block; font-size: 9pt; color: #546e7a; font-weight: 400; line-height: 1.25; margin-top: .3mm; letter-spacing: .1px; }
  /* 基本資訊列「面積」：坪粗體主值 ／ m² 正常字重並排 */
  .sqm-inline { font-size: 9.5pt; color: #546e7a; font-weight: 400; margin-left: 1mm; white-space: nowrap; }
  /* 詳細面積：坪／m² 雙列表格（欄＝項目、列＝單位；坪列淡藍底粗體深藍為主值，m² 列白底深灰） */
  .area-tbl-wrap { margin-top: 1.5mm; border: 1px solid #cfd8dc; border-radius: 1.5mm; overflow: hidden; }
  .area-tbl { width: 100%; border-collapse: collapse; table-layout: fixed; }
  .area-tbl th, .area-tbl td {
    text-align: center; padding: 1.3mm 1mm; border-left: 1px solid #e3e8ec; white-space: nowrap; line-height: 1.25;
  }
  .area-tbl tr > :first-child { border-left: 0; }
  /* ✅ [修復] 列分隔線改畫在儲存格（th/td）而非 tr：html2canvas 產 PDF 時會把 tr 邊框整列畫滿，
     導致跨兩列的公設比儲存格被中線切斷；改為儲存格邊框後瀏覽器預覽與 PDF 皆一致 */
  .area-tbl tbody th, .area-tbl tbody td { border-top: 1px solid #e3e8ec; }
  .area-tbl thead th { background: #f4f7fa; color: #546e7a; font-size: 8.5pt; font-weight: 600; }
  .area-tbl th.corner { width: 22mm; font-size: 10pt; text-align: left; padding-left: 3mm; }
  .area-tbl tbody th { background: #f4f7fa; color: #546e7a; font-size: 9.5pt; font-weight: 700; text-align: left; padding-left: 3mm; }
  .area-tbl .row-ping th { background: #e3edf8; color: #1a3c6e; }
  .area-tbl .row-ping td { background: #eef4fb; font-size: 11pt; font-weight: 700; color: #1a3c6e; }
  .area-tbl .row-sqm td { font-size: 10pt; font-weight: 400; color: #37474f; }
  .area-tbl td.ratio { background: #fff; vertical-align: middle; font-size: 11pt; font-weight: 700; color: #263238; }
  .area-tbl td.empty { color: #b0bec5; font-weight: 400; }
  .total-band {
    display: flex; justify-content: space-between; align-items: center;
    background: #eef4fb; border: 1px solid #b4cdec; border-radius: 1.5mm;
    margin-top: 4mm; padding: 3mm 6mm;
  }
  .total-band .t-label { font-size: 13pt; font-weight: 700; color: #1a3c6e; letter-spacing: 4px; margin-right: -4px; }
  .total-band .tvals { display: flex; align-items: baseline; gap: 3mm; }
  .total-band .tvals > b { font-size: 19pt; color: #c62828; }
  .total-band .tvals > b i { font-style: normal; font-size: 11pt; }
  .total-band .pkg-extra { font-size: 11pt; font-weight: 700; color: #2e7d32; white-space: nowrap; }
  .total-band .pkg-extra b { font-size: 14pt; }
  .total-band .pkg-extra small { font-size: 8.5pt; font-weight: 400; color: #607d8b; }
  .sec-title {
    margin-top: 6mm; margin-bottom: 3mm;
    font-size: 12.5pt; font-weight: 700; color: #1a3c6e;
    border-left: 4px solid #1a3c6e; padding-left: 2.5mm;
  }
  .pay-flex { display: flex; flex-wrap: wrap; gap: 5mm; align-items: flex-start; }
  .pay-block {
    flex: 1 1 46%; min-width: 46%;
    border: 1px solid #cfd8dc; border-radius: 1.5mm; overflow: hidden;
  }
  .pay-block.full { flex-basis: 100%; }
  .pay-rows.two-col { column-count: 2; column-gap: 8mm; }
  .pgroup { break-inside: avoid; }
  /* 並排模式：字級略降，避免窄欄折行 */
  .pay-flex.pair .prow { font-size: 10.5pt; }
  .pay-flex.pair .prow.child { font-size: 9.5pt; }
  .pay-head {
    display: flex; justify-content: space-between; align-items: baseline; gap: 2mm;
    padding: 2.4mm 3.5mm; color: #fff; font-size: 12pt; font-weight: 700;
  }
  .pay-head small { font-weight: 400; font-size: 9.5pt; opacity: .92; text-align: right; }
  .pay-rows { padding: 1mm 3.5mm 2mm; }
  .prow { display: flex; align-items: baseline; padding: 1.7mm 0; border-bottom: 1px dashed #e0e6ea; font-size: 11.5pt; }
  .pgroup:last-child .prow:last-child { border-bottom: none; }
  .prow:not(.child) .pname { font-weight: 600; }
  .prow.child { font-size: 10pt; }
  .prow.child .pname { padding-left: 5mm; color: #78909c; }
  .prow .hint { font-size: 9pt; color: #78909c; margin-left: 1.5mm; }
  .prow .lead { flex: 1; border-bottom: 1px dotted #b0bec5; margin: 0 2mm; transform: translateY(-1mm); }
  .prow .pval { font-weight: 700; color: #263238; white-space: nowrap; }
  .prow .pval i { font-style: normal; font-size: 9pt; color: #78909c; margin-left: .5mm; }
  .prow.child .pval { font-weight: 400; font-style: italic; color: #90a4ae; font-size: 9.5pt; }
  .child-note { padding: 0 3.5mm 2mm; font-size: 8.5pt; color: #90a4ae; }
  .ptotal {
    display: flex; justify-content: space-between;
    padding: 2.2mm 3.5mm; border-top: 1px solid #cfd8dc;
    background: #fafbfc; font-weight: 700; font-size: 12pt;
  }
  .no-pay { width: 100%; text-align: center; color: #b71c1c; font-size: 10pt; padding: 6mm 0; }
  /* 付款方式（左）＋公司借貸（右）並排：省縱向空間、維持大字級 */
  .pay-loan-grid { display: flex; gap: 4mm; align-items: flex-start; margin-top: 6mm; }
  .pay-loan-grid .pl-col { min-width: 0; }
  .pay-loan-grid .pl-left { flex: 1 1 42%; }
  .pay-loan-grid .pl-right { flex: 1.35 1 58%; }
  .pay-loan-grid .sec-title { margin-top: 0; }
  .pl-left .pay-block { width: 100%; margin-bottom: 3mm; }
  .pl-left .pay-block:last-child { margin-bottom: 0; }
  /* 公司借貸攤還表：棕色系區塊 */
  .sec-title.loan-title { color: #6d4c41; border-left-color: #6d4c41; margin-top: 4mm; }
  .loan-block { border: 1px solid #d7ccc8; border-radius: 1.5mm; overflow: hidden; }
  .loan-head {
    display: flex; justify-content: space-between; align-items: baseline; gap: 2mm; flex-wrap: wrap;
    background: #6d4c41; color: #fff; padding: 2.4mm 3.5mm;
    font-size: 11.5pt; font-weight: 700;
  }
  .loan-head small { font-weight: 400; font-size: 9.5pt; opacity: .92; }
  .loan-cols { display: flex; align-items: flex-start; }
  .loan-cols .loan-tbl { flex: 1; }
  .loan-cols .loan-tbl + .loan-tbl { border-left: 1px solid #d7ccc8; }
  .loan-tbl { width: 100%; border-collapse: collapse; font-size: 10pt; }
  .loan-tbl th {
    background: #efebe9; color: #5d4037;
    padding: 1.5mm 1.8mm; border-bottom: 1px solid #d7ccc8;
    font-weight: 700; text-align: right; white-space: nowrap;
  }
  .loan-tbl th:first-child { text-align: center; }
  .loan-tbl td { padding: 1.2mm 1.8mm; border-bottom: 1px dashed #eceff1; text-align: right; white-space: nowrap; }
  .loan-tbl td:first-child { text-align: center; color: #8d6e63; }
  .loan-tbl td.pay { font-weight: 700; color: #263238; }
  .loan-tbl td.rem { color: #90a4ae; }
  .loan-totals {
    display: flex; justify-content: flex-end; gap: 5mm; flex-wrap: wrap;
    padding: 2.2mm 3.5mm; background: #fafbfc; border-top: 1px solid #d7ccc8;
    font-size: 11.5pt; font-weight: 700;
  }
  .loan-totals b { color: #4e342e; font-size: 12pt; }
  .loan-totals b.grand { color: #c62828; }
  .loan-note { padding: 1.5mm 3.5mm; font-size: 9pt; color: #8d6e63; border-top: 1px dashed #e0e0e0; }
  .sheet.compact .loan-tbl { font-size: 9pt; }
  .sheet.compact .loan-tbl td { padding: 0.8mm 1.4mm; }
  .sheet.compact .loan-totals { padding: 1.6mm 3mm; font-size: 10.5pt; }
  /* ✅ [新增] 採用方案帶：紫色系醒目條，完整列出方案名稱與所選付款方式 */
  .plan-band {
    display: flex; align-items: center; flex-wrap: wrap; gap: 2mm;
    margin-top: 4mm; padding: 2.4mm 3.5mm;
    background: #f6f2fb; border: 1px solid #d1c4e9; border-left: 4px solid #5e35b1;
    border-radius: 1.5mm;
  }
  .plan-band .plan-lbl {
    font-size: 9.5pt; font-weight: 700; color: #5e35b1; margin-right: 1.5mm; white-space: nowrap;
  }
  .plan-band .plan-item {
    display: inline-flex; align-items: baseline; gap: 1.5mm;
    background: #fff; border: 1px solid #d1c4e9; border-radius: 1mm;
    padding: 1mm 2.5mm;
  }
  .plan-band .plan-item b { font-size: 10pt; color: #311b92; }
  .plan-band .plan-item em {
    font-style: normal; font-size: 8.5pt; color: #7e57c2; white-space: nowrap;
  }
  .plan-band .plan-plus { font-size: 10pt; font-weight: 700; color: #5e35b1; }
  .notes { margin-top: 5mm; background: #fffdf3; border: 1px solid #efe6c1; border-radius: 1.5mm; padding: 3mm 4mm; }
  .notes-title { font-size: 10.5pt; font-weight: 700; color: #8a6d1c; margin-bottom: 1.5mm; }
  .notes ol { padding-left: 5mm; }
  .notes li { font-size: 10pt; color: #5d4f1e; line-height: 1.7; }
  .remark { margin-top: 5mm; border: 1px solid #cfd8dc; border-radius: 1.5mm; overflow: hidden; }
  .remark-title {
    background: #eceff1; color: #37474f;
    font-size: 10.5pt; font-weight: 700; padding: 2mm 4mm;
  }
  .remark-body { padding: 2.5mm 4mm; font-size: 10.5pt; line-height: 1.8; color: #37474f; }
  .remark-body ul, .remark-body ol { padding-left: 6mm; }
  /* ✅ [修復] 備註富文本樣式：編輯器輸出 legacy font 標籤，明確定義使
     手機預覽 / 列印 / PDF 截圖皆一致渲染（不依賴瀏覽器 UA 樣式） */
  .remark-body b, .remark-body strong { font-weight: 700; }
  .remark-body i, .remark-body em { font-style: italic; }
  .remark-body u { text-decoration: underline; }
  .remark-body s, .remark-body strike { text-decoration: line-through; }
  .remark-body font[size="1"] { font-size: 7.5pt; }
  .remark-body font[size="2"] { font-size: 9pt; }
  .remark-body font[size="3"] { font-size: 10.5pt; }
  .remark-body font[size="4"] { font-size: 12pt; }
  .remark-body font[size="5"] { font-size: 14pt; }
  .remark-body font[size="6"] { font-size: 18pt; }
  .remark-body font[size="7"] { font-size: 24pt; }
  /* ✅ [新增] 主管簽核／用印欄：右側大面積留白，供簽名或蓋章 */
  .approval {
    display: flex; align-items: stretch;
    border: 1px solid #cfd8dc; border-radius: 1.5mm; overflow: hidden;
    margin-top: 4mm; min-height: 24mm;
  }
  .approval .ap-label {
    width: 25mm; flex-shrink: 0;
    display: flex; flex-direction: column; align-items: center; justify-content: center;
    background: #f4f7fa; color: #546e7a;
    font-size: 9.5pt; line-height: 1.5; text-align: center;
    border-right: 1px solid #cfd8dc;
  }
  .approval .ap-label .ap-sub { font-size: 8.5pt; color: #78909c; }
  .approval .ap-area { flex: 1; background: #fff; }
  .ap-warn {
    margin-top: 1.5mm;
    font-size: 9pt; font-weight: 700; line-height: 1.5;
    color: #c62828; text-align: center;
    letter-spacing: 0.2pt;
  }
  .foot {
    margin-top: auto; padding-top: 3mm; border-top: 1px solid #cfd8dc;
    display: flex; justify-content: space-between; align-items: center; gap: 4mm;
    font-size: 8.5pt; color: #78909c;
  }
  .foot .foot-person { flex: 1; font-size: 11.5pt; color: #263238; }
  .foot .foot-person b { font-weight: 700; color: #1a3c6e; }
  /* ✅ [新增] 建案簡介 QR Code（右下角）；未設定網址時此區塊不輸出，不佔版面 */
  .foot-qr {
    flex-shrink: 0;
    display: flex; flex-direction: column; align-items: center;
  }
  .foot-qr img { width: 20mm; height: 20mm; display: block; }
  .foot-qr .qr-cap {
    margin-top: .6mm; font-size: 7.5pt; color: #546e7a; white-space: nowrap; letter-spacing: .2pt;
  }

  /* ✅ 階梯式壓縮第一段：緊湊模式（間距與字級小幅收斂） */
  .sheet.compact .head { padding: 3.5mm 6mm; }
  .sheet.compact .info { margin-top: 3mm; }
  .sheet.compact .lbl { padding: 1.7mm 3mm; font-size: 9.5pt; }
  .sheet.compact .val { padding: 1.7mm 3mm; font-size: 10.5pt; }
  .sheet.compact .strip-item { padding: 1.1mm 1mm; }
  .sheet.compact .sqm { font-size: 8.5pt; }
  .sheet.compact .area-tbl th, .sheet.compact .area-tbl td { padding: .8mm 1mm; }
  .sheet.compact .area-tbl .row-ping td, .sheet.compact .area-tbl td.ratio { font-size: 10.5pt; }
  .sheet.compact .area-tbl .row-sqm td { font-size: 9pt; }
  .sheet.compact .total-band { margin-top: 2.5mm; padding: 2mm 5mm; }
  .sheet.compact .sec-title { margin-top: 3.5mm; margin-bottom: 2mm; }
  .sheet.compact .pay-loan-grid { margin-top: 3.5mm; gap: 3mm; }
  .sheet.compact .pay-loan-grid .sec-title { margin-top: 0; }
  .sheet.compact .pay-flex { gap: 3mm; }
  .sheet.compact .pay-rows { padding: 0.5mm 3mm 1.5mm; }
  .sheet.compact .prow { padding: 0.9mm 0; font-size: 10.5pt; }
  .sheet.compact .prow.child { font-size: 9.5pt; }
  .sheet.compact .ptotal { padding: 1.6mm 3.5mm; font-size: 11pt; }
  .sheet.compact .plan-band { margin-top: 2.5mm; padding: 1.6mm 3mm; }
  .sheet.compact .plan-band .plan-item b { font-size: 9pt; }
  .sheet.compact .plan-band .plan-item em { font-size: 8pt; }
  .sheet.compact .notes { margin-top: 3mm; padding: 2mm 3mm; }
  .sheet.compact .notes li { font-size: 9.5pt; line-height: 1.55; }
  .sheet.compact .remark { margin-top: 3mm; }
  .sheet.compact .remark-body { padding: 2mm 4mm; font-size: 9.5pt; line-height: 1.6; }
  .sheet.compact .approval { margin-top: 2.5mm; min-height: 18mm; }
  .sheet.compact .approval .ap-label { font-size: 9pt; }
  .sheet.compact .ap-warn { margin-top: 1mm; font-size: 8.5pt; }
  .sheet.compact .foot-qr img { width: 17mm; height: 17mm; }
  .sheet.compact .foot-qr .qr-cap { font-size: 7pt; }

  @page { size: A4 portrait; margin: 0; }
  @media print {
    html, body { background: #fff; }
    .sheet { margin: 0 auto; box-shadow: none; page-break-after: always; }
    .sheet:last-child { page-break-after: auto; }
  }
`;

// ✅ [重構] 組出完整報價單 HTML（列印視窗、預覽 iframe、PDF 截圖共用同一份版面）
// autoPrint：載入後自動叫出列印；fitZoom：預覽用，頁寬超出視窗時整體縮放至可視大小
function buildSheetsHtml({ autoPrint = false, fitZoom = false } = {}) {
  const items = quoteStore.items.filter(i => selectedIds.value.includes(i.internalId));
  if (items.length === 0) return '';

  const sheets = items.map(item => renderSheet(item)).join('\n');
  const printScript = autoPrint ? '\n  window.focus();\n  window.print();' : '';
  // ✅ [修復] 預覽縮放改用 transform scale：純視覺縮放不觸發重排，
  // 手機預覽版面與電腦/列印完全一致（zoom 會 reflow 導致期款區移位）
  const zoomScript = fitZoom ? `
  (function () {
    var first = document.querySelector('.sheet');
    if (!first) return;
    var w = first.getBoundingClientRect().width + 16;
    var z = Math.min(1, window.innerWidth / w);
    if (z < 1) {
      document.body.style.transformOrigin = 'top left';
      document.body.style.transform = 'scale(' + z + ')';
      document.body.style.width = (100 / z) + '%';
    }
  })();` : '';

  return `<!DOCTYPE html>
<html lang="zh-Hant">
<head>
<meta charset="utf-8">
<title>${esc(props.projectName)} 報價單</title>
<style>${SHEET_CSS}</style>
</head>
<body>
${sheets}
<script>
// ✅ 絕對單頁排版：1) 超出時先進緊湊模式收斂間距字級 → 2) 等比縮放到剛好塞滿一頁
//    （超出則縮小、保證不分頁；有餘裕則放大，上限 MAX_UP，讓內容填滿縮小後的頁邊界）
window.onload = function () {
  var MAX_UP = 1.45, MIN_DOWN = 0.3;
  document.querySelectorAll('.sheet').forEach(function (sheet) {
    var inner = sheet.querySelector('.inner');
    if (!inner) return;
    var cs = getComputedStyle(sheet);
    var avail = sheet.clientHeight - parseFloat(cs.paddingTop) - parseFloat(cs.paddingBottom);

    // 以縮放比 s 排版（寬度反向放大 → 縮放後恰為頁寬），回傳縮放後的內容高度
    function measure(s) {
      inner.style.minHeight = '0';
      inner.style.width = (100 / s) + '%';
      inner.style.transform = 'scale(' + s + ')';
      return inner.scrollHeight * s;
    }
    function apply(s) {
      measure(s);
      inner.style.minHeight = (avail / s) + 'px';
    }

    // 階梯 1：原始尺寸超出 → 緊湊模式
    if (measure(1) > avail + 1) {
      sheet.classList.add('compact');
    }

    // 階梯 2：二分搜尋最大可容納的縮放比（寬度改變會重排，故需實測而非單純比例）
    if (measure(MAX_UP) <= avail + 0.5) { apply(MAX_UP); return; }
    var lo = MIN_DOWN, hi = MAX_UP;
    for (var i = 0; i < 12; i++) {
      var mid = (lo + hi) / 2;
      if (measure(mid) <= avail + 0.5) lo = mid; else hi = mid;
    }
    apply(lo);
  });${zoomScript}${printScript}
};
<\/script>
</body>
</html>`;
}

function handlePrint() {
  if (!ensureCanProceed()) return;
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

// --- ✅ [新增] 預覽 + 下載 PDF ---
const isPdfPreviewVisible = ref(false);
const previewHtml = ref('');
const isDownloadingPdf = ref(false);

function openPdfPreview() {
  if (!ensureCanProceed()) return;
  const html = buildSheetsHtml({ fitZoom: true });
  if (!html) return;
  previewHtml.value = html;
  isPdfPreviewVisible.value = true;
}

// ✅ [新增] PDF 檔名：YYYYMMDD-建案名稱-戶別-報價人員-報價單.pdf
// 戶別依頁面順序以「、」串接；超過 3 戶改為「首戶等N戶」避免檔名過長
function sanitizeFileNamePart(text, fallback = '未填') {
  const cleaned = String(text ?? '')
    .replace(/[\\/:*?"<>|]/g, '_')   // Windows / macOS 不允許的檔名字元
    .replace(/[\u0000-\u001f]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  return cleaned || fallback;
}

function buildPdfFileName(sheetCount = 0) {
  const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Taipei' }).format(new Date()).replace(/-/g, '');
  const items = quoteStore.items.filter(i => selectedIds.value.includes(i.internalId));
  const unitIds = items.map(i => sanitizeFileNamePart(i.unitId, '')).filter(Boolean);
  const total = unitIds.length || sheetCount;
  const unitPart = unitIds.length === 0
    ? '未指定戶別'
    : unitIds.length <= 3
      ? unitIds.join('、')
      : `${unitIds[0]}等${total}戶`;
  const projectPart = sanitizeFileNamePart(props.projectName, '未命名建案');
  const personnelPart = sanitizeFileNamePart(props.personnelName, '未選擇報價人員');
  return `${today}-${projectPart}-${unitPart}-${personnelPart}-報價單.pdf`;
}

// A4 pt 尺寸（jsPDF）
const A4_W_PT = 595.28;
const A4_H_PT = 841.89;

// 逐頁 html2canvas 截圖 → 嵌入 A4 PDF；以隱藏 iframe 全新渲染（不受預覽縮放影響）
async function downloadPdf() {
  if (!ensureCanProceed()) return;
  const html = buildSheetsHtml({});
  if (!html) return;
  if (isDownloadingPdf.value) return;
  isDownloadingPdf.value = true;

  const iframe = document.createElement('iframe');
  iframe.style.cssText = 'position:fixed;left:-10000px;top:0;width:900px;height:1400px;border:0;';
  document.body.appendChild(iframe);

  try {
    await new Promise((resolve) => {
      iframe.onload = () => resolve();
      iframe.srcdoc = html;
    });
    // 等 iframe 內的單頁自適應腳本與版面繪製完成
    await new Promise((r) => setTimeout(r, 500));

    const doc = iframe.contentDocument;
    const sheetEls = Array.from(doc?.querySelectorAll('.sheet') || []);
    if (sheetEls.length === 0) throw new Error('無可輸出的報價單頁面');

    const pdf = new jsPDF({ unit: 'pt', format: 'a4', orientation: 'portrait' });
    for (let i = 0; i < sheetEls.length; i++) {
      const canvas = await html2canvas(sheetEls[i], {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: false,
      });
      if (i > 0) pdf.addPage();
      // 等比放入 A4（sheet 為 210×296mm，高度略短於 A4 屬正常，底部留白）
      const imgH = A4_W_PT * (canvas.height / canvas.width);
      pdf.addImage(canvas.toDataURL('image/jpeg', 0.92), 'JPEG', 0, 0, A4_W_PT, Math.min(imgH, A4_H_PT));
    }

    pdf.save(buildPdfFileName(sheetEls.length));
    toast.success('報價單 PDF 已下載');
  } catch (e) {
    console.error('[QuotePrintDialog] 下載 PDF 失敗:', e);
    toast.error('報價單 PDF 產生失敗，請稍後重試。');
  } finally {
    iframe.remove();
    isDownloadingPdf.value = false;
  }
}
</script>

<style scoped>
/* ✅ [新增] 報價單預覽 iframe：填滿剩餘空間 */
.pdf-preview-frame {
  width: 100%;
  min-height: 0;
  border: 0;
  background: #e3e6e8;
}

/* ✅ [新增] 列印前底價守門區塊 */
.approval-panel {
  border: 1px solid rgba(198, 40, 40, 0.5);
  background: rgba(198, 40, 40, 0.04);
  border-radius: 6px;
  padding: 12px 14px;
}
.approval-row {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 6px 12px;
  padding: 4px 0;
  border-bottom: 1px dashed rgba(0, 0, 0, 0.08);
}
.approval-row:last-of-type { border-bottom: none; }
.approval-unit {
  font-weight: 700;
  min-width: 72px;
}
.approval-select { min-width: 220px; }

.remark-panel {
  background: #fafbfc;
}

.remark-toggle {
  cursor: pointer;
  user-select: none;
}

.remark-preview {
  max-height: 140px;
  overflow-y: auto;
  border: 1px solid #eceff1;
  border-radius: 4px;
  padding: 8px 12px;
  font-size: 13px;
  line-height: 1.7;
  background: #fff;
}

.remark-preview :deep(ul),
.remark-preview :deep(ol) {
  padding-left: 20px;
}
</style>
