<template>
  <div class="commission-workbench">
    <!-- 工具列 -->
    <div class="d-flex align-center flex-wrap ga-2 mb-3">
      <v-btn color="primary" variant="flat" prepend-icon="mdi-plus" @click="openPicker">新增戶別</v-btn>
      <span class="text-body-2 text-medium-emphasis">下一期別 {{ nextPeriod }}｜已選 {{ entries.length }} 戶<template v-if="refunds.length">｜退佣 {{ refunds.length }} 戶</template></span>
      <v-spacer></v-spacer>
      <template v-if="entries.length || refunds.length">
        <v-btn size="small" variant="text" @click="setAllCollapsed(true)">全部收合</v-btn>
      </template>
    </div>

    <p class="text-body-2 text-medium-emphasis mb-4">選擇戶別後，填寫請佣比例與獎金人員，再預覽送出。</p>

    <v-alert v-if="!entries.length && !refunds.length" type="info" variant="tonal" class="mb-4">
      尚未選擇戶別，請點「新增戶別」（僅列出已成交且有簽約日期的戶別；已請畢 100% 者不可再選）。買方解約需退回佣金時，切到「退佣」頁籤。
    </v-alert>

    <!-- 上下配置：上＝戶別卡片編輯區（全寬）、下＝本次合計（全寬） -->
    <div class="cards-area">
      <CommissionUnitCard
        v-for="e in entries"
        :key="e.id"
        :entry="e"
        :settings="settings"
        :profiles="personProfiles"
        :resolve-profile-key="k => profileKeyFor(k, e.unit?.payment_contract_date)"
        :project-id="projectId"
        :project-name="projectName"
        :local-personnel="personnel"
        :claimed-pct="claimedPctOf(e.unitId)"
        @toggle="toggleCard(e)"
        @remove="removeEntry(e)"
      />
      <CommissionRefundCard
        v-for="e in refunds"
        :key="e.id"
        :entry="e"
        :settings="settings"
        :project-id="projectId"
        :bonus-records="bonusRecords"
        @toggle="toggleCard(e)"
        @remove="removeRefund(e)"
      />
    </div>

    <!-- 彙總 -->
    <v-card v-if="(entries.length || refunds.length) && showSummary" id="comm-summary" variant="outlined" class="mb-4 summary-card">
      <v-card-title class="text-subtitle-1 bg-grey-lighten-4">
        本次合計（{{ entries.length }} 戶<template v-if="refunds.length">、退佣 {{ refunds.length }} 戶</template>）
      </v-card-title>
      <v-card-text>
        <v-row dense class="mb-3">
          <v-col cols="6" md="3"><div class="sum-item"><label>獎金總銷（折數後合計）</label><div>{{ money(summary.grandAfter) }} 元</div></div></v-col>
          <v-col cols="6" md="3"><div class="sum-item"><label>實際請領金額合計</label><div>{{ money(summary.claimSum) }} 元</div></div></v-col>
          <v-col cols="6" md="3"><div class="sum-item"><label>請佣保留款合計</label><div>{{ money(summary.keepSum) }} 元</div></div></v-col>
          <v-col cols="6" md="3"><div class="sum-item highlight"><label>本次請佣合計</label><div>{{ money(summary.thisClaimSum) }} 元</div></div></v-col>
          <v-col v-if="refunds.length" cols="6" md="3"><div class="sum-item refund"><label>退佣合計（已含於本次請佣合計）</label><div>{{ money(summary.refundSum) }} 元</div></div></v-col>
          <v-col v-if="hasHandover" cols="12" md="6">
            <div class="sum-item handover">
              <label>{{ handoverLabel }}暫留（自個獎提撥，本期不發放、不計入下表）</label>
              <div>{{ money(summary.handoverSum) }} 元</div>
            </div>
          </v-col>
        </v-row>
        <div class="text-caption font-weight-bold mb-1">每人獎金彙總（所有戶別加總）</div>
        <div class="table-scroll">
          <v-table density="compact" class="people-table">
            <thead>
              <tr>
                <th class="col-name">人員</th><th class="col-source">來源</th>
                <th class="text-right">小計</th><th class="text-right">保留款</th>
                <th class="text-right">稅金</th><th class="text-right">二代健保</th><th class="text-right">實發</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="p in summary.people" :key="p.personKey">
                <td class="font-weight-medium">{{ p.name }}</td>
                <td>
                  <v-chip v-if="p.sourceProjectId && p.sourceProjectId !== projectId" size="x-small" color="default" variant="tonal">{{ p.sourceProjectName || p.sourceProjectId }}</v-chip>
                  <span v-else class="text-caption text-medium-emphasis">本案</span>
                </td>
                <td class="text-right">{{ money(p.subtotal) }}</td>
                <td class="text-right">{{ money(p.keep) }}</td>
                <td class="text-right">{{ money(p.tax) }}</td>
                <td class="text-right">{{ money(p.nhi) }}</td>
                <td class="text-right text-high-emphasis font-weight-bold">{{ money(p.net) }}</td>
              </tr>
              <tr class="font-weight-bold bg-grey-lighten-4">
                <td>合計</td><td></td>
                <td class="text-right">{{ money(summary.totals.subtotal) }}</td>
                <td class="text-right">{{ money(summary.totals.keep) }}</td>
                <td class="text-right">{{ money(summary.totals.tax) }}</td>
                <td class="text-right">{{ money(summary.totals.nhi) }}</td>
                <td class="text-right text-high-emphasis">{{ money(summary.totals.net) }}</td>
              </tr>
            </tbody>
          </v-table>
        </div>
      </v-card-text>
      <v-divider></v-divider>
    </v-card>

    <div v-if="entries.length || refunds.length" class="submit-bar" aria-label="本次請佣摘要">
      <div>
        <div class="text-caption text-medium-emphasis">請佣 {{ entries.length }} 戶<template v-if="refunds.length">・退佣 {{ refunds.length }} 戶</template></div>
        <span class="text-body-2">本次請佣合計 </span><strong class="submit-total">{{ money(summary.thisClaimSum) }} 元</strong>
      </div>
      <v-btn v-if="totalIssues" variant="text" color="warning" size="small" @click="gotoFirstIssue">{{ totalIssues }} 項待完成</v-btn>
      <span v-else class="text-caption text-medium-emphasis">資料已填妥</span>
      <v-spacer />
      <v-btn variant="text" @click="toggleSummary">{{ showSummary ? '收合彙總' : '查看獎金與金額彙總' }}</v-btn>
      <v-btn color="primary" variant="flat" :loading="submitting" @click="openPreview">預覽並送出</v-btn>
    </div>

    <!-- 戶別選擇 dialog -->
    <v-dialog v-model="pickerOpen" max-width="520">
      <v-card>
        <v-tabs v-model="pickerTab" color="primary" density="compact">
          <v-tab value="claim">請佣</v-tab>
          <v-tab value="refund">退佣</v-tab>
        </v-tabs>
        <v-divider></v-divider>
        <v-card-title class="text-subtitle-1">
          {{ pickerTab === 'refund' ? '選擇退佣戶別（列出有有效請佣紀錄者）' : '選擇戶別（僅列已成交且有簽約日期）' }}
        </v-card-title>
        <v-card-text class="pt-0">
          <v-text-field v-model="pickerSearch" placeholder="搜尋戶別 / 買方…" density="compact" variant="outlined"
            prepend-inner-icon="mdi-magnify" hide-details clearable class="mb-2"></v-text-field>
          <div v-if="pickerTab === 'claim'" class="d-flex align-center flex-wrap ga-1 mb-2">
            <span class="text-caption text-medium-emphasis mr-1">排序</span>
            <v-chip
              v-for="s in PICKER_SORTS"
              :key="s.key"
              size="small"
              :variant="pickerSort.key === s.key ? 'flat' : 'outlined'"
              :color="pickerSort.key === s.key ? 'primary' : undefined"
              @click="setPickerSort(s.key)"
            >
              {{ s.label }}
              <v-icon v-if="pickerSort.key === s.key" end size="x-small">{{ pickerSort.dir === 'asc' ? 'mdi-arrow-up' : 'mdi-arrow-down' }}</v-icon>
            </v-chip>
          </div>
          <div v-if="pickerTab === 'refund'" class="picker-list">
            <v-list density="compact">
              <v-list-item
                v-for="u in filteredRefundUnits"
                :key="u.unitId"
                :disabled="u.disabled"
                @click="!u.disabled && togglePick(u.unitId)"
              >
                <template #prepend>
                  <v-checkbox-btn :model-value="!!pickSel[u.unitId]" :disabled="u.disabled" density="compact" color="error"></v-checkbox-btn>
                </template>
                <v-list-item-title class="d-flex align-center flex-wrap ga-1">
                  {{ u.unitId }}
                  <v-chip size="x-small" variant="tonal" :color="contractTypeColor(u.contractType)">{{ u.contractType }}</v-chip>
                  <v-chip v-if="u.released" size="x-small" color="error" variant="tonal" class="ml-1">{{ u.statusText }}</v-chip>
                  <span v-else class="text-caption ml-1 text-medium-emphasis">{{ u.statusText }}</span>
                </v-list-item-title>
                <v-list-item-subtitle class="text-caption">
                  <span v-if="u.buyerName" class="mr-2">{{ u.buyerName }}</span>
                  <span>已請 {{ u.claimedPct }}%・{{ u.count }} 筆紀錄・可退 {{ money(u.thisClaimSum) }} 元</span>
                </v-list-item-subtitle>
                <template #append>
                  <span v-if="u.isAdded" class="text-caption text-medium-emphasis">已加入</span>
                </template>
              </v-list-item>
            </v-list>
            <div v-if="!filteredRefundUnits.length" class="text-center text-medium-emphasis py-6">沒有可退佣的戶別</div>
          </div>
          <div v-else class="picker-list">
            <v-list density="compact">
              <v-list-item
                v-for="u in filteredPickerUnits"
                :key="u.unitId"
                :disabled="u.disabled"
                @click="!u.disabled && togglePick(u.unitId)"
              >
                <template #prepend>
                  <v-checkbox-btn :model-value="!!pickSel[u.unitId]" :disabled="u.disabled" density="compact"></v-checkbox-btn>
                </template>
                <v-list-item-title class="d-flex align-center flex-wrap ga-1">
                  {{ u.unitId }}
                  <v-chip size="x-small" variant="tonal" :color="contractTypeColor(u.contractType)">{{ u.contractType }}</v-chip>
                  <span v-if="u.claimedPct > 0" class="text-caption ml-1" :class="u.claimedPct >= 100 ? 'text-disabled' : 'text-medium-emphasis'">
                    （已請佣 {{ u.claimedPct }}%）
                  </span>
                </v-list-item-title>
                <v-list-item-subtitle class="text-caption">
                  <span v-if="u.buyerName" class="mr-2">{{ u.buyerName }}</span>
                  <span v-if="u.paymentRatio !== null" class="text-medium-emphasis">繳款 {{ u.paymentRatio }}%</span>
                  <span v-else class="text-medium-emphasis">繳款 —</span>
                </v-list-item-subtitle>
                <template #append>
                  <span class="text-caption text-medium-emphasis">{{ u.statusText }}</span>
                </template>
              </v-list-item>
            </v-list>
            <div v-if="!filteredPickerUnits.length" class="text-center text-medium-emphasis py-6">無符合條件的戶別</div>
          </div>
        </v-card-text>
        <v-divider></v-divider>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn variant="text" @click="pickerOpen = false">關閉</v-btn>
          <v-btn :color="pickerTab === 'refund' ? 'error' : 'primary'" variant="flat" :disabled="!pickCount" @click="confirmPick">
            {{ pickerTab === 'refund' ? '加入退佣' : '加入' }}{{ pickCount ? `（${pickCount}）` : '' }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- 無法送出：阻擋性錯誤 -->
    <v-dialog v-model="blockingOpen" max-width="560" persistent>
      <v-card>
        <v-card-title class="text-subtitle-1 text-error">
          <v-icon start>mdi-close-octagon</v-icon>無法送出，請先修正
        </v-card-title>
        <v-card-text style="max-height: 60vh; overflow: auto">
          <v-alert v-for="(item, j) in blockingItems" :key="j" density="compact" variant="tonal" type="error" class="mb-1">{{ item }}</v-alert>
        </v-card-text>
        <v-divider></v-divider>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn variant="text" @click="blockingOpen = false">返回修改</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- 送出前預覽（與匯出中心同一版面模型） -->
    <v-dialog v-model="previewOpen" fullscreen transition="dialog-bottom-transition" :persistent="submitting">
      <v-card class="preview-dialog">
        <v-toolbar color="primary" density="comfortable">
          <v-btn icon="mdi-close" :disabled="submitting" @click="previewOpen = false"></v-btn>
          <v-toolbar-title class="text-subtitle-1">送出前預覽｜第 {{ previewPeriodsText }} 期</v-toolbar-title>
          <v-spacer></v-spacer>
          <span class="text-body-2 mr-4 d-none d-sm-inline">{{ entries.length }} 戶<template v-if="refunds.length">、退佣 {{ refunds.length }} 戶</template>｜本次請佣 {{ money(summary.thisClaimSum) }} 元</span>
        </v-toolbar>
        <v-card-text class="preview-body">
          <div class="d-flex align-center flex-wrap ga-2 mb-3">
            <v-btn-toggle v-model="previewDocType" mandatory color="primary" variant="outlined" divided density="comfortable">
              <v-btn value="claim" size="small">請佣總表</v-btn>
              <v-btn value="bonus" size="small">獎金表</v-btn>
            </v-btn-toggle>
            <v-select v-model="previewConfigId" :items="previewConfigOptions" item-title="name" item-value="id"
              label="欄位版型" variant="outlined" density="compact" hide-details :loading="previewConfigsLoading" style="max-width: 280px"></v-select>
          </div>

          <div v-for="(sec, i) in previewWarnings" :key="i" class="mb-3">
            <div class="font-weight-bold mb-1">{{ sec.title }}</div>
            <div v-if="sec.subtitle" class="text-caption text-medium-emphasis mb-1">{{ sec.subtitle }}</div>
            <v-alert v-for="(item, j) in sec.items" :key="j" density="compact" variant="tonal" type="warning" class="mb-1">{{ item }}</v-alert>
          </div>

          <CommissionGridPreview :grids="previewGrids" title="送出後匯出的版面" max-height="none" />
        </v-card-text>
        <v-divider></v-divider>
        <v-card-actions class="preview-actions">
          <v-spacer></v-spacer>
          <v-btn variant="text" :disabled="submitting" @click="previewOpen = false">返回修改</v-btn>
          <v-btn color="primary" variant="flat" prepend-icon="mdi-check-bold" :loading="submitting" @click="doSubmit">確認送出</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup>
import { contractTypeColor } from '@/utils/contractTypeColor';
import { computePlanFinance, defaultPriceSource, defaultManualFloor, isNonGeneralContract } from '@/utils/commissionPlans';
import { useCommissionPlan } from '@/composables/useCommissionPlan';
const { plan, planId, belongsToPlan } = useCommissionPlan();
import { ref, reactive, computed, watch, nextTick } from 'vue';
import { useToast } from 'vue-toastification';
import { useUserStore } from '@/store/user';
import CommissionUnitCard from './CommissionUnitCard.vue';
import CommissionRefundCard from './CommissionRefundCard.vue';
import CommissionGridPreview from './CommissionGridPreview.vue';
import { refundableRecordsByUnit, buildRefundEntryPlan } from './refundEntry';
import { submitCommissionEntriesAPI, fetchCommissionExportConfigs } from '@/api';
import { buildClaimModel, buildBonusModel, defaultClaimConfig, defaultBonusConfig, exportProjectNameOf } from '@/utils/commissionExportModel';
import { buildClaimGrid, buildBonusGrids } from '@/services/commissionExcelService';
import { draftClaimRecord, draftRefundRecord, normalizeSalesNames } from '@/utils/commissionDraftRecords';
import {
  calcUnitBonus, computeUnitFinance, resolveCommPct, formatDateTW,
  money, toNum, evenShares, paymentRatioPct, matchesRolePositions, isHandoverCategory, resolveSplitMode,
} from '@/utils/commissionCalculation';
import { classifySalesStatus } from '@/utils/salesStatusGroups';
import { bonusSegments, segmentForDate, segmentId, segmentLabel } from '@/utils/bonusSegments';

const props = defineProps({
  projectId: { type: String, required: true },
  projectName: { type: String, default: '' },
  settings: { type: Object, required: true },
  households: { type: Array, default: () => [] },
  parkings: { type: Array, default: () => [] },
  personnel: { type: Array, default: () => [] },
  ledgers: { type: Object, default: () => ({}) },   // unitId -> claimedRatioPct
  nextPeriod: { type: Number, default: 1 },
  records: { type: Array, default: () => [] },        // 全建案請佣紀錄（退佣來源）
  bonusRecords: { type: Array, default: () => [] },   // 全建案獎金明細（退佣追回原數）
});

const showSummary = ref(false);
const emit = defineEmits(['submitted']);
const toast = useToast();
const userStore = useUserStore();

const entries = ref([]);
const refunds = ref([]);
const personProfiles = reactive({});
let seq = 0;

const pickerOpen = ref(false);
const pickerTab = ref('claim');
const pickerSearch = ref('');
const pickSel = reactive({});
const submitting = ref(false);
const blockingOpen = ref(false);
const blockingItems = ref([]);

// 送出前預覽
const previewOpen = ref(false);
const previewDocType = ref('claim');
const previewWarnings = ref([]);
const previewConfigs = ref([]);
const previewConfigsLoaded = ref(false);
const previewConfigsLoading = ref(false);
const previewConfigId = ref('__default');

const enabledCategories = computed(() =>
  (props.settings.bonusCategories || [])
    .filter(c => c.enabled !== false)
    .slice()
    .sort((a, b) => (a.order || 0) - (b.order || 0))
);
const handoverCategories = computed(() => enabledCategories.value.filter(isHandoverCategory));
const hasHandover = computed(() => handoverCategories.value.length > 0);
const handoverLabel = computed(() => handoverCategories.value.map(c => c.label).join('／') || '交屋團獎');

// ---------- 已請比例（ledger + 本場已送出即時更新由父層 refresh） ----------
function claimedPctOf(unitId) {
  return Math.round(toNum(props.ledgers[unitId]) * 10) / 10;
}

// ---------- 戶別選擇 ----------
const eligibleUnits = computed(() =>
  props.households.filter(u =>
    classifySalesStatus(u.salesStatus_backend) === 'deal' && u.payment_contract_date
    && (plan.value.priceBasis !== 'package' || (isNonGeneralContract(u) && Number(u.price_package_deal) > 0 && computeUnitFinance(u, props.parkings).dealTotal > Number(u.price_package_deal)))
  )
);

const pickerUnits = computed(() => {
  const added = new Set(entries.value.map(e => e.unitId));
  return eligibleUnits.value.map(u => {
    const claimed = claimedPctOf(u.unitId);
    const full = claimed >= 100;
    const isAdded = added.has(u.unitId);
    return {
      unitId: u.unitId,
      contractType: String(u.contractType || '').trim() || '未設定合約方式',
      buyerName: u.buyerName || '',
      claimedPct: claimed,
      paymentRatio: paymentRatioPct(u, computeUnitFinance(u, props.parkings).dealTotal),
      disabled: full || isAdded,
      statusText: isAdded ? '已加入' : (full ? '已請畢' : (claimed > 0 ? `尚餘 ${Math.round((100 - claimed) * 10) / 10}%` : '')),
      _raw: u,
    };
  });
});

const PICKER_SORTS = [
  { key: 'unitId', label: '戶別' },
  { key: 'paymentRatio', label: '繳款比例' },
  { key: 'claimedPct', label: '已請比例' },
];
const pickerSort = ref({ key: 'unitId', dir: 'asc' });
function setPickerSort(key) {
  if (pickerSort.value.key === key) {
    pickerSort.value = { key, dir: pickerSort.value.dir === 'asc' ? 'desc' : 'asc' };
  } else {
    pickerSort.value = { key, dir: key === 'unitId' ? 'asc' : 'desc' };
  }
}
function compareUnitId(a, b) {
  return String(a.unitId).localeCompare(String(b.unitId), 'zh-Hant', { numeric: true });
}
function comparePickerUnits(a, b) {
  const { key, dir } = pickerSort.value;
  const sign = dir === 'asc' ? 1 : -1;
  if (key === 'unitId') return sign * compareUnitId(a, b);
  const av = a[key], bv = b[key];
  // 無法計算（null）者一律排在最後
  if (av === null && bv === null) return compareUnitId(a, b);
  if (av === null) return 1;
  if (bv === null) return -1;
  if (av !== bv) return sign * (av - bv);
  return compareUnitId(a, b);
}

const filteredPickerUnits = computed(() => {
  const f = String(pickerSearch.value || '').trim().toLowerCase();
  const list = f
    ? pickerUnits.value.filter(u =>
        String(u.unitId).toLowerCase().includes(f) || String(u._raw.buyerName || '').toLowerCase().includes(f)
      )
    : pickerUnits.value.slice();
  return list.sort(comparePickerUnits);
});

// ---------- 退佣戶別（有有效請佣紀錄者；解約／退戶排前） ----------
const refundableByUnit = computed(() => refundableRecordsByUnit(props.records));

const refundUnits = computed(() => {
  const added = new Set(refunds.value.map(e => e.unitId));
  return Object.keys(refundableByUnit.value).map(unitId => {
    const recs = refundableByUnit.value[unitId];
    const unit = props.households.find(u => u.unitId === unitId) || null;
    const statusText = unit?.salesStatus_backend || '';
    const released = classifySalesStatus(statusText) === 'released';
    const isAdded = added.has(unitId);
    return {
      unitId,
      contractType: String(unit?.contractType || recs[recs.length - 1]?.snapshot?.contractType || '').trim() || '未設定合約方式',
      buyerName: unit?.buyerName || recs[recs.length - 1]?.snapshot?.buyerName || '',
      statusText: statusText || '—',
      released,
      claimedPct: claimedPctOf(unitId),
      count: recs.length,
      thisClaimSum: recs.reduce((s, r) => s + toNum(r.calc?.thisClaim), 0),
      isAdded,
      disabled: isAdded,
    };
  }).sort((a, b) => (Number(b.released) - Number(a.released))
    || String(a.unitId).localeCompare(String(b.unitId), 'zh-Hant', { numeric: true }));
});

const filteredRefundUnits = computed(() => {
  const f = String(pickerSearch.value || '').trim().toLowerCase();
  if (!f) return refundUnits.value;
  return refundUnits.value.filter(u =>
    String(u.unitId).toLowerCase().includes(f) || String(u.buyerName || '').toLowerCase().includes(f)
  );
});

const pickCount = computed(() => Object.keys(pickSel).filter(k => pickSel[k]).length);

function openPicker() {
  Object.keys(pickSel).forEach(k => delete pickSel[k]);
  pickerSearch.value = '';
  pickerOpen.value = true;
}
watch(pickerTab, () => { Object.keys(pickSel).forEach(k => delete pickSel[k]); });

function togglePick(unitId) {
  if (pickSel[unitId]) delete pickSel[unitId];
  else pickSel[unitId] = true;
}

function confirmPick() {
  if (pickerTab.value === 'refund') {
    const before = refunds.value.length;
    Object.keys(pickSel).forEach(unitId => {
      if (pickSel[unitId] && !refunds.value.some(e => e.unitId === unitId)) addRefund(unitId);
    });
    if (refunds.value.length > before) { setAllCollapsed(true); refunds.value[before].collapsed = false; }
  } else {
    const before = entries.value.length;
    Object.keys(pickSel).forEach(unitId => {
      if (pickSel[unitId] && !entries.value.some(e => e.unitId === unitId)) addUnit(unitId);
    });
    // 只加入一戶時直接展開
    if (entries.value.length > before) { setAllCollapsed(true); entries.value[before].collapsed = false; }
  }
  Object.keys(pickSel).forEach(k => delete pickSel[k]);
  pickerOpen.value = false;
}

// ---------- 建立退佣卡片 ----------
function addRefund(unitId) {
  const candidates = (refundableByUnit.value[unitId] || []).slice();
  if (!candidates.length) return;
  refunds.value.push({
    id: `r${seq++}`,
    kind: 'refund',
    unitId,
    unit: props.households.find(u => u.unitId === unitId) || null,
    period: props.nextPeriod,
    requestDate: formatDateTW(new Date()),
    reason: '買方解約',
    includeKeep: false,
    refundBonus: true,
    candidates,
    selectedIds: candidates.map(r => r.id),
    people: null,           // 逐人調整（null＝原數反向）
    collapsed: true,
  });
}

function removeRefund(e) {
  refunds.value = refunds.value.filter(x => x !== e);
}

function refundPlan(e) {
  return buildRefundEntryPlan(e, props.bonusRecords);
}

function refundIssueCount(e) {
  return (e.selectedIds.length ? 0 : 1) + (toNum(e.period) > 0 ? 0 : 1);
}

// ---------- 建立戶別卡片 ----------
function personKeyOf(p) { return p.phone || `ext:${p.name}`; }

/** profile 鍵：一人多段進退場時以「電話@進場日」區分，同段的戶共用一組費率；單段沿用電話 */
function profileKeyFor(personKey, contractDate) {
  const p = props.personnel.find(x => personKeyOf(x) === personKey);
  const segs = bonusSegments(p?.bonusConfig);
  if (segs.length <= 1) return personKey;
  return `${personKey}@${segmentId(segmentForDate(segs, contractDate).segment)}`;
}

function ensureProfile(personKey, name, contractDate) {
  const key = profileKeyFor(personKey, contractDate);
  if (personProfiles[key]) return;
  const p = props.personnel.find(x => personKeyOf(x) === personKey || x.name === name);
  const segs = bonusSegments(p?.bonusConfig);
  const seg = segmentForDate(segs, contractDate).segment || {};
  personProfiles[key] = {
    name: p?.name || name,
    role: (p?.positions || []).join('、'),
    keepPct: toNum(seg.keepPct),
    taxPct: toNum(seg.taxPct),
    nhiPct: toNum(seg.nhiPct),
    remark: seg.remark || '',
    segmentLabel: segs.length > 1 ? segmentLabel(seg) : '',
    sourceProjectId: props.projectId,
    sourceProjectName: props.projectName,
  };
}

/** 本戶參與人員的 profile（personKey → 依簽約日解析的段落費率） */
function entryProfiles(e) {
  const map = {};
  const contractDate = e.unit?.payment_contract_date;
  Object.values(e.categories).forEach(c => c.allocations.forEach(a => {
    const prof = personProfiles[profileKeyFor(a.personKey, contractDate)] || personProfiles[a.personKey];
    if (prof) map[a.personKey] = prof;
  }));
  return map;
}

function evenAlloc(persons) {
  const allocations = persons.map(p => ({
    personKey: p.personKey,
    name: p.name,
    sourceProjectId: props.projectId,
    sourceProjectName: props.projectName,
    isExternal: !!p.isExternal,
    mode: 'pct',
    sharePct: 0,
    lockedAmount: null,
  }));
  const shares = evenShares(allocations.length);
  allocations.forEach((a, i) => { a.sharePct = shares[i]; });
  return allocations;
}

function addUnit(unitId) {
  const unit = props.households.find(u => u.unitId === unitId);
  if (!unit) return;
  const previous = props.records.filter(r => r.unitId === unitId && r.status === 'active' && r.type !== 'refund' && !r.refundedBy)
    .slice().sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0) || Number(b.period) - Number(a.period))
    .find(r => r.snapshot?.priceSource);
  const priceSource = previous?.snapshot?.priceSource || defaultPriceSource(unit, plan.value);
  const manualFloor = previous?.snapshot?.manualFloor ?? defaultManualFloor(unit, computeUnitFinance(unit, props.parkings).parkFloor, priceSource);
  const claimed = claimedPctOf(unitId);

  const categories = {};
  enabledCategories.value.forEach(cat => {
    let allocations = [];
    if (cat.mode === 'individual') {
      const names = normalizeSalesNames(unit.salesperson);
      const persons = names.map(nm => {
        const p = props.personnel.find(x => x.name === nm);
        const personKey = p ? personKeyOf(p) : `ext:${nm}`;
        ensureProfile(personKey, nm, unit.payment_contract_date);
        return { personKey, name: nm, isExternal: !p };
      });
      allocations = evenAlloc(persons);
    } else if (cat.mode === 'role') {
      const pool = props.personnel.filter(p => matchesRolePositions(p.positions, cat.rolePositions));
      if (pool.length === 1) {
        const personKey = personKeyOf(pool[0]);
        ensureProfile(personKey, pool[0].name, unit.payment_contract_date);
        allocations = evenAlloc([{ personKey, name: pool[0].name }]);
      }
    }
    categories[cat.key] = {
      key: cat.key,
      label: cat.label,
      mode: cat.mode,
      ratePct: toNum(cat.ratePct),
      sourceCatKey: cat.sourceCatKey || '',   // 提撥類別的來源類別（其他類別為空）
      enabled: true,                          // 提撥類別：本戶是否提撥（工作台可關閉）
      splitMode: resolveSplitMode(props.settings, cat),   // 均分尾差處理（建案設定；隨紀錄快照）
      allocations,                            // 提撥類別不分配人員，恆為空
    };
  });

  entries.value.push({
    id: `e${seq++}`,
    unitId,
    unit,
    priceSource,
    manualFloor,
    note: isNonGeneralContract(unit) ? String(unit.contractType).trim() : '',   // 請佣備註：非一般合約先帶合約方式
    get finance() { return computePlanFinance(unit, props.parkings, plan.value, this); },
    period: props.nextPeriod,
    requestDate: formatDateTW(new Date()),
    ratioPct: Math.max(0, Math.round((100 - claimed) * 10) / 10),
    commPct: resolveCommPct(props.settings, !!unit.isPreferredPayment),
    keepPct: toNum(props.settings.defaultKeepPct),
    partyAFee: 0,
    partyBFee: 0,
    teamSiteKeys: [],
    categories,
    collapsed: true,
  });
}

function removeEntry(e) {
  entries.value = entries.value.filter(x => x !== e);
}

function setAllCollapsed(v) {
  entries.value.forEach(e => { e.collapsed = v; });
  refunds.value.forEach(e => { e.collapsed = v; });
}

async function toggleSummary() {
  showSummary.value = !showSummary.value;
  if (showSummary.value) {
    await nextTick();
    document.getElementById('comm-summary')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}
function toggleCard(e) {
  const open = e.collapsed;
  setAllCollapsed(true);
  e.collapsed = !open;
}
function gotoFirstIssue() {
  const entry = entries.value.find(e => entryIssueCount(e)) || refunds.value.find(e => refundIssueCount(e));
  if (entry) gotoCard(entry);
}
function gotoCard(e) {
  setAllCollapsed(true);
  e.collapsed = false;
  requestAnimationFrame(() => {
    const el = document.getElementById(`comm-card-${e.id}`);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
}

// ---------- 計算 ----------
function entryInput(e) {
  return {
    ratioPct: toNum(e.ratioPct),
    commPct: toNum(e.commPct),
    keepPct: toNum(e.keepPct),
    partyAFee: toNum(e.partyAFee),
    partyBFee: toNum(e.partyBFee),
    categories: e.categories,
  };
}

function entryResult(e) {
  return calcUnitBonus(e.finance, entryInput(e), entryProfiles(e));
}

/** 該戶待處理項目數（與卡片標頭一致）：未選人類別 + 分配錯誤 + 比例問題 */
function entryIssueCount(e) {
  const r = entryResult(e);
  const claimed = claimedPctOf(e.unitId);
  const missing = enabledCategories.value.filter(cat => {
    if (isHandoverCategory(cat)) return false;
    const c = e.categories[cat.key];
    return c && toNum(c.ratePct) > 0 && c.allocations.length === 0;
  }).length;
  const ratioBad = (claimed + toNum(e.ratioPct) > 100.0001) || !(toNum(e.ratioPct) > 0);
  return missing + r.errors.length + e.finance.errors.length + (ratioBad ? 1 : 0);
}
const totalIssues = computed(() =>
  entries.value.reduce((s, e) => s + entryIssueCount(e), 0) + refunds.value.reduce((s, e) => s + refundIssueCount(e), 0)
);

const summary = computed(() => {
  let grandAfter = 0, claimSum = 0, keepSum = 0, thisClaimSum = 0, handoverSum = 0, refundSum = 0;
  const byPerson = {};
  const order = [];
  const addPerson = p => {
    if (!byPerson[p.personKey]) {
      byPerson[p.personKey] = {
        personKey: p.personKey, name: p.name,
        sourceProjectId: p.sourceProjectId, sourceProjectName: p.sourceProjectName,
        subtotal: 0, keep: 0, tax: 0, nhi: 0, net: 0,
      };
      order.push(p.personKey);
    }
    const b = byPerson[p.personKey];
    b.subtotal += p.subtotal; b.keep += p.keep; b.tax += p.tax; b.nhi += p.nhi; b.net += p.net;
  };
  entries.value.forEach(e => {
    const r = entryResult(e);
    grandAfter += r.claim.dealAfter * 10000;
    claimSum += r.claim.realClaim;
    keepSum += r.claim.claimKeep;
    thisClaimSum += r.claim.thisClaim;
    handoverSum += toNum(r.handoverTotal);
    r.people.forEach(addPerson);
  });
  // 退佣：金額為負值，直接併入合計
  refunds.value.forEach(e => {
    const pl = refundPlan(e);
    grandAfter += pl.calc.dealAfter * 10000;
    claimSum += pl.calc.realClaim;
    keepSum += pl.calc.claimKeep;
    thisClaimSum += pl.calc.thisClaim;
    refundSum += pl.calc.thisClaim;
    handoverSum += toNum(pl.handover.total);
    pl.people.forEach(addPerson);
  });
  const people = order.map(k => byPerson[k]);
  const totals = people.reduce((t, p) => ({
    subtotal: t.subtotal + p.subtotal, keep: t.keep + p.keep,
    tax: t.tax + p.tax, nhi: t.nhi + p.nhi, net: t.net + p.net,
  }), { subtotal: 0, keep: 0, tax: 0, nhi: 0, net: 0 });
  return { grandAfter, claimSum, keepSum, thisClaimSum, handoverSum, refundSum, people, totals };
});

// ---------- 送出 ----------
function collectIssues() {
  const blocking = [];
  const warnings = [];
  const feeMiss = [];

  entries.value.forEach(e => {
    e.finance.errors.forEach(message => blocking.push(`${e.unitId}：${message}`));
    const claimed = claimedPctOf(e.unitId);
    if (claimed + toNum(e.ratioPct) > 100.0001) {
      blocking.push(`${e.unitId}：已請 ${claimed}% ＋ 本次 ${e.ratioPct}% 超過 100%`);
    }
    if (!(toNum(e.ratioPct) > 0)) {
      blocking.push(`${e.unitId}：本次請佣比例須大於 0`);
    }
    const r = entryResult(e);
    r.errors.forEach(err => {
      const label = e.categories[err.catKey]?.label || err.catKey;
      blocking.push(`${e.unitId}／${label}：${err.error}`);
    });

    // 提醒：類別無人勾選（僅提醒有候選人的類別）
    const missCats = [];
    enabledCategories.value.forEach(cat => {
      if (isHandoverCategory(cat)) return;   // 提撥類別不勾人
      const c = e.categories[cat.key];
      if (c && c.allocations.length === 0 && toNum(c.ratePct) > 0) missCats.push(cat.label);
    });
    if (missCats.length) warnings.push(`${e.unitId}：${missCats.join('、')} 尚未勾選人員`);
    if (props.settings.teamGroups.length && e.teamSiteKeys.length === 0) {
      const hasTeamCat = enabledCategories.value.some(c => c.mode === 'team');
      if (hasTeamCat) warnings.push(`${e.unitId}：未勾選團獎案場`);
    }

    const note = String(e.unit.remarks || '');
    if (/介紹|贈品/.test(note) && toNum(e.partyAFee) === 0 && toNum(e.partyBFee) === 0) {
      feeMiss.push(`${e.unitId}：${note}`);
    }
  });

  const refundNotes = [];
  refunds.value.forEach(e => {
    if (!e.selectedIds.length) blocking.push(`退佣 ${e.unitId}：未勾選要退回的原請佣紀錄`);
    if (!(toNum(e.period) > 0)) blocking.push(`退佣 ${e.unitId}：期別須為正整數`);
    const pl = refundPlan(e);
    const status = e.unit?.salesStatus_backend || '';
    const released = classifySalesStatus(status) === 'released';
    const bonusText = e.refundBonus ? `追回獎金 ${money(pl.people.reduce((s, p) => s + p.net, 0))} 元` : '不追回獎金';
    refundNotes.push(`${e.unitId}（${status || '狀態不明'}）：退回 ${money(pl.calc.thisClaim)} 元、${bonusText}${released ? '' : '；⚠ 銷控狀態非解約／退戶'}`);
  });

  return { blocking, warnings, feeMiss, refundNotes };
}

// ---------- 送出前預覽 ----------
const exportSettings = computed(() => ({ ...props.settings, priceBasis: plan.value.priceBasis }));
const exportProjectName = computed(() => exportProjectNameOf(props.projectName, plan.value));

/** 草稿組成與後端寫入相同形狀的暫存紀錄，供匯出 model 使用 */
const draftData = computed(() => {
  const common = { projectId: props.projectId, planId: planId.value, plan: plan.value, createdBy: userStore.user?.name || '' };
  const records = [];
  const bonusRecords = [];
  entries.value.forEach(entry => {
    const d = draftClaimRecord({ entry, result: entryResult(entry), ...common });
    records.push(d.record);
    bonusRecords.push(...d.bonusRecords);
  });
  refunds.value.forEach(entry => {
    const d = draftRefundRecord({ entry, refundPlan: refundPlan(entry), ...common });
    records.push(d.record);
    bonusRecords.push(...d.bonusRecords);
  });
  return { records, bonusRecords };
});

const draftPeriods = computed(() => [...new Set(draftData.value.records.map(r => toNum(r.period)))].sort((a, b) => a - b));
const previewPeriodsText = computed(() => draftPeriods.value.join('、'));

const previewTypeConfigs = computed(() => previewConfigs.value.filter(c => c.docType === previewDocType.value));
const previewConfigOptions = computed(() => ([
  { id: '__default', name: '系統預設版型' },
  ...previewTypeConfigs.value.map(c => ({ id: c.id, name: c.isDefault ? `★ ${c.name}` : c.name })),
]));
function pickDefaultPreviewConfig() {
  const def = previewTypeConfigs.value.find(c => c.isDefault);
  previewConfigId.value = def ? def.id : '__default';
}
watch(previewDocType, pickDefaultPreviewConfig);

function previewConfigOf(type) {
  const fallback = type === 'claim' ? defaultClaimConfig(exportSettings.value) : defaultBonusConfig(exportSettings.value);
  if (previewDocType.value !== type) {
    const def = previewConfigs.value.find(c => c.docType === type && c.isDefault);
    return def?.config || fallback;
  }
  if (previewConfigId.value === '__default') return fallback;
  return previewConfigs.value.find(c => c.id === previewConfigId.value)?.config || fallback;
}

const previewGrids = computed(() => {
  if (!previewOpen.value) return [];
  try {
    const { records, bonusRecords } = draftData.value;
    const multi = draftPeriods.value.length > 1;
    const list = [];
    draftPeriods.value.forEach(period => {
      const recs = records.filter(r => toNum(r.period) === period);
      if (!recs.length) return;
      const ids = new Set(recs.map(r => r.id));
      const base = { settings: exportSettings.value, period, projectName: exportProjectName.value };
      let grids;
      if (previewDocType.value === 'claim') {
        grids = [buildClaimGrid(buildClaimModel(recs, { ...base, config: previewConfigOf('claim') }))];
      } else {
        grids = buildBonusGrids(buildBonusModel({
          ...base,
          records: recs,
          bonusRecords: bonusRecords.filter(b => ids.has(b.commissionRecordId)),
          config: previewConfigOf('bonus'),
          projectId: props.projectId,
          personnelOrder: props.personnel.map(p => p.name),
        }));
      }
      if (multi) grids.forEach(g => { g.name = `第${period}期 ${g.name}`; });
      list.push(...grids);
    });
    return list;
  } catch (e) {
    console.error('[CommissionWorkbench] 預覽版面產生失敗:', e);
    return [];
  }
});

async function loadPreviewConfigs() {
  if (previewConfigsLoaded.value) return;
  previewConfigsLoading.value = true;
  try {
    previewConfigs.value = (await fetchCommissionExportConfigs(props.projectId)).filter(belongsToPlan);
    previewConfigsLoaded.value = true;
  } catch (e) {
    console.error('[CommissionWorkbench] 載入版型失敗:', e);
  } finally {
    previewConfigsLoading.value = false;
    pickDefaultPreviewConfig();
  }
}

function openPreview() {
  const { blocking, warnings, feeMiss, refundNotes } = collectIssues();
  if (blocking.length) {
    blockingItems.value = blocking;
    blockingOpen.value = true;
    return;
  }
  const sections = [];
  if (refundNotes.length) sections.push({ title: '↩ 退佣戶別', subtitle: '送出後原紀錄標記「已退佣」、已請比例回溯，可於歷期總覽作廢退佣紀錄還原：', items: refundNotes });
  if (warnings.length) sections.push({ title: '⚠ 有項目尚未勾選人員', subtitle: '確認是否刻意留空：', items: warnings });
  if (feeMiss.length) sections.push({ title: '🎁 可能有介紹費/贈品尚未填寫', subtitle: '備註提到介紹/贈品但金額為 0：', items: feeMiss });
  previewWarnings.value = sections;
  previewDocType.value = 'claim';
  previewOpen.value = true;
  loadPreviewConfigs();
}

async function doSubmit() {
  submitting.value = true;
  try {
    const payloadEntries = entries.value.map(e => {
      // 只帶本戶有參與的人員 profile（依本戶簽約日解析段落費率；鍵仍為 personKey）
      const profiles = {};
      Object.entries(entryProfiles(e)).forEach(([k, v]) => {
        const { segmentLabel: _label, ...rest } = v;
        profiles[k] = { ...rest };
      });
      return {
        unitId: e.unitId,
        priceSource: e.priceSource,
        manualFloor: e.finance.manualFloorRequired ? e.manualFloor : null,
        note: String(e.note || '').trim(),
        period: Number(e.period) || 0,
        requestDate: e.requestDate,
        ratioPct: toNum(e.ratioPct),
        commPct: toNum(e.commPct),
        keepPct: toNum(e.keepPct),
        partyAFee: toNum(e.partyAFee),
        partyBFee: toNum(e.partyBFee),
        teamSiteKeys: [...e.teamSiteKeys],
        categories: JSON.parse(JSON.stringify(e.categories)),
        personProfiles: profiles,
      };
    });

    const payloadRefunds = refunds.value.map(e => ({
      unitId: e.unitId,
      period: Number(e.period) || 0,
      requestDate: e.requestDate,
      reason: String(e.reason || ''),
      includeKeep: !!e.includeKeep,
      refundBonus: e.refundBonus !== false,
      sourceRecordIds: [...e.selectedIds],
      people: e.people ? JSON.parse(JSON.stringify(e.people)) : null,
    }));

    const res = await submitCommissionEntriesAPI({
      projectId: props.projectId,
      planId: planId.value,
      createdBy: userStore.user?.name || userStore.user?.phone || '',
      entries: payloadEntries,
      refunds: payloadRefunds,
    });
    if (res?.ok) {
      const nRefund = res.results.filter(r => r.refund).length;
      const nClaim = res.results.length - nRefund;
      toast.success(`已寫入 ${nClaim} 戶請佣紀錄${nRefund ? `、${nRefund} 戶退佣紀錄` : ''}`);
      const period = res.results.reduce((m, r) => Math.max(m, toNum(r.period)), 0);
      entries.value = [];
      refunds.value = [];
      previewOpen.value = false;
      emit('submitted', { period: period || null });
    } else {
      toast.error('寫入失敗，請重試');
    }
  } catch (e) {
    console.error('[CommissionWorkbench] 送出失敗:', e);
    toast.error(`送出失敗：${e.message}`);
  } finally {
    submitting.value = false;
  }
}
defineExpose({ hasDraft: computed(() => entries.value.length > 0 || refunds.value.length > 0) });
</script>

<style scoped>
.picker-list { max-height: 50vh; overflow-y: auto; border: 1px solid rgba(0,0,0,.08); border-radius: 8px; }
.sum-item { background: #f5f5f5; border-radius: 8px; padding: 8px 12px; }
.sum-item label { font-size: 11px; color: #789; display: block; }
.sum-item div { font-size: 17px; font-weight: 700; color: #263238; }
.sum-item.highlight div { color: #263238; }
.sum-item.handover { background: #f5f5f5; }
.sum-item.handover div { color: #263238; }
.sum-item.refund { background: #f5f5f5; }
.sum-item.refund div { color: #c62828; }
.summary-card { scroll-margin-top: 80px; }
.table-scroll { overflow-x: auto; }
/* 送出前預覽：全螢幕，預覽區佔滿剩餘高度 */
.preview-dialog { display: flex; flex-direction: column; height: 100%; }
.preview-body { flex: 1; overflow: auto; background: #fafafa; }
.preview-actions { background: #fff; }
/* 每人彙總表：人員／來源欄固定合理寬度，其餘金額欄平均分配 */
.people-table th, .people-table td { white-space: nowrap; }
.people-table .col-name { min-width: 110px; }
.people-table .col-source { min-width: 90px; }
.submit-bar { position: sticky; bottom: 12px; z-index: 6; display: flex; align-items: center; flex-wrap: wrap; gap: 12px; padding: 16px; background: #fff; border: 1px solid #ddd; border-radius: 10px; box-shadow: 0 2px 12px #00000012; }
.submit-total { font-size: 20px; font-variant-numeric: tabular-nums; }
.commission-workbench { padding-bottom: 16px; }
@media (max-width: 600px) { .submit-bar { bottom: 0; gap: 8px; padding: 12px; } .submit-total { font-size: 18px; } }
</style>
