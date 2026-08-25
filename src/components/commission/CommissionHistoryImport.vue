<template>
  <div class="history-import">
    <!-- 三步驟 -->
    <v-row dense class="mb-1">
      <!-- 步驟 1：下載範本 -->
      <v-col cols="12" md="6">
        <v-card variant="outlined" class="step-card h-100">
          <v-card-text>
            <div class="d-flex align-center mb-2">
              <v-avatar color="primary" size="28" class="mr-2"><span class="text-body-2 font-weight-bold">1</span></v-avatar>
              <span class="text-subtitle-1 font-weight-bold">下載匯入範本</span>
            </div>
            <ul class="step-list text-body-2 text-medium-emphasis mb-3">
              <li>範本含「請佣紀錄」「獎金紀錄」「填寫說明」三個分頁</li>
              <li>可直接貼上舊系統資料：比例欄自動判斷小數（0.5）或百分比（50）格式</li>
              <li>民國日期（115/5/23）自動轉西元；金額未填時以本案銷控現值計算</li>
            </ul>
            <v-btn color="primary" variant="flat" prepend-icon="mdi-file-download-outline" @click="downloadTemplate">下載範本</v-btn>
          </v-card-text>
        </v-card>
      </v-col>

      <!-- 步驟 2：上傳解析 -->
      <v-col cols="12" md="6">
        <v-card variant="outlined" class="step-card h-100">
          <v-card-text>
            <div class="d-flex align-center mb-2">
              <v-avatar :color="parsed ? 'success' : 'primary'" size="28" class="mr-2">
                <v-icon v-if="parsed" size="small">mdi-check</v-icon>
                <span v-else class="text-body-2 font-weight-bold">2</span>
              </v-avatar>
              <span class="text-subtitle-1 font-weight-bold">上傳檔案解析驗證</span>
            </div>
            <v-file-input
              v-model="file"
              label="選擇填好的 Excel 檔案（.xlsx / .xls）"
              accept=".xlsx,.xls"
              variant="outlined" density="comfortable"
              prepend-icon=""
              prepend-inner-icon="mdi-tray-arrow-up"
              :loading="parsing"
              hide-details
              class="mb-2"
              @update:model-value="parseFile"
            ></v-file-input>
            <div class="text-caption text-medium-emphasis">
              上傳後立即逐列驗證（戶別存在、比例累計 ≤100%、人員比對），確認預覽無誤才寫入；
              匯入資料標記為「匯入」，可查詢、作廢、列入統計與匯出。
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <div v-if="parsing" class="text-center py-8">
      <v-progress-circular indeterminate color="primary"></v-progress-circular>
      <div class="text-body-2 mt-2">解析驗證中…</div>
    </div>

    <!-- 步驟 3：驗證結果與匯入 -->
    <template v-if="parsed && !parsing">
      <v-card variant="outlined" class="mt-3">
        <v-card-text class="pb-2">
          <div class="d-flex align-center mb-3 flex-wrap ga-2">
            <v-avatar color="primary" size="28" class="mr-1"><span class="text-body-2 font-weight-bold">3</span></v-avatar>
            <span class="text-subtitle-1 font-weight-bold">確認驗證結果並匯入</span>
            <v-spacer></v-spacer>
            <v-switch
              v-if="errorCount || warnCount"
              v-model="showOnlyIssues"
              label="只看錯誤/警告列"
              color="warning" density="compact" hide-details
            ></v-switch>
          </div>

          <!-- 驗證摘要 -->
          <v-row dense class="mb-2">
            <v-col cols="6" sm="3"><div class="stat-tile"><label>請佣紀錄</label><div>{{ claimRows.length }} <small>列</small></div></div></v-col>
            <v-col cols="6" sm="3"><div class="stat-tile"><label>獎金明細</label><div>{{ bonusRows.length }} <small>列</small></div></div></v-col>
            <v-col cols="6" sm="3"><div class="stat-tile" :class="errorCount ? 'tile-error' : 'tile-ok'"><label>錯誤（不匯入）</label><div>{{ errorCount }} <small>列</small></div></div></v-col>
            <v-col cols="6" sm="3"><div class="stat-tile" :class="warnCount ? 'tile-warn' : ''"><label>警告（仍匯入）</label><div>{{ warnCount }} <small>列</small></div></div></v-col>
          </v-row>

          <!-- 預覽頁籤 -->
          <v-tabs v-model="previewTab" density="compact" color="primary">
            <v-tab value="claims">
              請佣紀錄
              <v-chip size="x-small" class="ml-1" variant="tonal">{{ shownClaimRows.length }}</v-chip>
              <v-icon v-if="claimErrorCount" size="x-small" color="error" class="ml-1">mdi-alert-circle</v-icon>
            </v-tab>
            <v-tab value="bonuses">
              獎金明細
              <v-chip size="x-small" class="ml-1" variant="tonal">{{ shownBonusRows.length }}</v-chip>
              <v-icon v-if="bonusErrorCount" size="x-small" color="error" class="ml-1">mdi-alert-circle</v-icon>
            </v-tab>
            <v-tab value="ratio" v-if="ratioSummary.length">匯入後比例</v-tab>
          </v-tabs>
          <v-divider></v-divider>

          <v-window v-model="previewTab" :touch="false">
            <v-window-item value="claims">
              <div class="table-scroll">
                <v-table density="compact">
                  <thead>
                    <tr><th>#</th><th>狀態</th><th>期別</th><th>戶別</th><th>請佣日期</th>
                      <th class="text-right">請佣比例</th><th class="text-right">佣金比例</th>
                      <th class="text-right">實際請領(元)</th><th class="text-right">本次請佣(元)</th><th>訊息</th></tr>
                  </thead>
                  <tbody>
                    <tr v-for="r in shownClaimRows" :key="r._idx" :class="rowClass(r)">
                      <td>{{ r._idx + 1 }}</td>
                      <td><v-chip size="x-small" :color="statusColor(r.status)" variant="tonal">{{ statusText(r.status) }}</v-chip></td>
                      <td>{{ r.period }}</td><td>{{ r.unitId }}</td><td>{{ r.requestDate || '—' }}</td>
                      <td class="text-right">{{ r.ratioPct }}%</td>
                      <td class="text-right">{{ r.commPct }}%</td>
                      <td class="text-right">{{ money(r.calc?.realClaim || 0) }}</td>
                      <td class="text-right">{{ money(r.calc?.thisClaim || 0) }}</td>
                      <td class="text-caption msg-cell" :class="r.status === 'error' ? 'text-error' : 'text-orange-darken-3'">{{ r.messages.join('；') }}</td>
                    </tr>
                    <tr v-if="!shownClaimRows.length"><td colspan="10" class="text-center text-medium-emphasis py-4">{{ showOnlyIssues ? '沒有錯誤或警告列' : '無資料' }}</td></tr>
                  </tbody>
                </v-table>
              </div>
            </v-window-item>

            <v-window-item value="bonuses">
              <div class="table-scroll">
                <v-table density="compact">
                  <thead>
                    <tr><th>#</th><th>狀態</th><th>期別</th><th>戶別</th><th>人員</th><th>電話(personKey)</th>
                      <th class="text-right">小計</th><th class="text-right">保留款</th><th class="text-right">實發</th><th>訊息</th></tr>
                  </thead>
                  <tbody>
                    <tr v-for="r in shownBonusRows" :key="r._idx" :class="rowClass(r)">
                      <td>{{ r._idx + 1 }}</td>
                      <td><v-chip size="x-small" :color="statusColor(r.status)" variant="tonal">{{ statusText(r.status) }}</v-chip></td>
                      <td>{{ r.period }}</td><td>{{ r.unitId }}</td><td>{{ r.name }}</td><td>{{ r.personKey }}</td>
                      <td class="text-right">{{ money(r.subtotal) }}</td>
                      <td class="text-right">{{ money(r.keep) }}</td>
                      <td class="text-right">{{ money(r.net) }}</td>
                      <td class="text-caption msg-cell" :class="r.status === 'error' ? 'text-error' : 'text-orange-darken-3'">{{ r.messages.join('；') }}</td>
                    </tr>
                    <tr v-if="!shownBonusRows.length"><td colspan="10" class="text-center text-medium-emphasis py-4">{{ showOnlyIssues ? '沒有錯誤或警告列' : '無資料' }}</td></tr>
                  </tbody>
                </v-table>
              </div>
            </v-window-item>

            <v-window-item value="ratio" v-if="ratioSummary.length">
              <div class="pa-3">
                <div class="text-caption text-medium-emphasis mb-2">匯入後每戶「已請比例」變化（既有 → 匯入後）：</div>
                <v-chip v-for="s in ratioSummary" :key="s.unitId" size="small" variant="tonal"
                  :color="s.after > 100.0001 ? 'error' : 'primary'" class="mr-1 mb-1">
                  {{ s.unitId }}：{{ s.before }}% → {{ s.after }}%
                </v-chip>
              </div>
            </v-window-item>
          </v-window>
        </v-card-text>

        <!-- 匯入動作列 -->
        <v-divider></v-divider>
        <v-card-actions class="px-4 py-3 action-bar">
          <v-alert v-if="errorCount" type="warning" variant="tonal" density="compact" class="flex-grow-1 mr-3">
            {{ errorCount }} 列錯誤將被略過，僅匯入通過驗證的資料。
          </v-alert>
          <v-spacer v-else></v-spacer>
          <v-btn color="primary" size="large" variant="flat" prepend-icon="mdi-database-import"
            :loading="importing" :disabled="!validClaimCount" @click="doImport">
            確認匯入（{{ validClaimCount }} 筆請佣／{{ validBonusCount }} 筆獎金）
          </v-btn>
        </v-card-actions>
      </v-card>
    </template>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import * as XLSX from 'xlsx-js-style';
import { useToast } from 'vue-toastification';
import { useUserStore } from '@/store/user';
import { importCommissionHistoryAPI } from '@/api';
import {
  toNum, money, computeUnitFinance, calcClaim, formatDateTW, mergeSettings, round2,
} from '@/utils/commissionCalculation';

const props = defineProps({
  projectId: { type: String, required: true },
  projectName: { type: String, default: '' },
  settings: { type: Object, required: true },
  households: { type: Array, default: () => [] },
  parkings: { type: Array, default: () => [] },
  personnel: { type: Array, default: () => [] },
  ledgers: { type: Object, default: () => ({}) },
});
const emit = defineEmits(['imported']);

const toast = useToast();
const userStore = useUserStore();

const file = ref(null);
const parsing = ref(false);
const parsed = ref(false);
const importing = ref(false);
const claimRows = ref([]);
const bonusRows = ref([]);
const previewTab = ref('claims');
const showOnlyIssues = ref(false);

const mergedSettings = computed(() => mergeSettings(props.settings));
const enabledCats = computed(() => (mergedSettings.value.bonusCategories || []).filter(c => c.enabled !== false));

const claimErrorCount = computed(() => claimRows.value.filter(r => r.status === 'error').length);
const bonusErrorCount = computed(() => bonusRows.value.filter(r => r.status === 'error').length);
const errorCount = computed(() => claimErrorCount.value + bonusErrorCount.value);
const warnCount = computed(() => claimRows.value.filter(r => r.status === 'warn').length + bonusRows.value.filter(r => r.status === 'warn').length);

// 預覽列（帶原始索引；可切換只看錯誤/警告）
const shownClaimRows = computed(() => {
  const rows = claimRows.value.map((r, i) => ({ ...r, _idx: i }));
  return showOnlyIssues.value ? rows.filter(r => r.status !== 'ok') : rows;
});
const shownBonusRows = computed(() => {
  const rows = bonusRows.value.map((r, i) => ({ ...r, _idx: i }));
  return showOnlyIssues.value ? rows.filter(r => r.status !== 'ok') : rows;
});
const validClaimCount = computed(() => claimRows.value.filter(r => r.status !== 'error').length);
const validBonusCount = computed(() => bonusRows.value.filter(r => r.status !== 'error').length);

const ratioSummary = computed(() => {
  const add = {};
  claimRows.value.filter(r => r.status !== 'error').forEach(r => {
    add[r.unitId] = (add[r.unitId] || 0) + toNum(r.ratioPct);
  });
  return Object.keys(add).map(unitId => {
    const before = Math.round(toNum(props.ledgers[unitId]) * 10) / 10;
    return { unitId, before, after: Math.round((before + add[unitId]) * 10) / 10 };
  });
});

// ---------- 範本 ----------
const CLAIM_HEADERS = computed(() => ([
  '期別', '戶別', '請佣日期', '請佣比例', '佣金比例',
  mergedSettings.value.partyALabel, mergedSettings.value.partyBLabel, '保留款(%)',
  '成交總價(含車)', '總底價', '溢差價', '房屋成交價', '車位成交總價', '房屋總底價', '車位底價',
  '買方姓名', '簽約日期', '小訂日期', '持有車位', '銷售人員',
]));

const BONUS_FIXED_HEADERS = ['期別', '戶別', '請佣日期', '人員姓名', '人員電話', '職務'];
const BONUS_TAIL_HEADERS = ['獎金小計', '保留款', '稅金', '二代健保', '實發金額', '備註', '來源建案'];

function downloadTemplate() {
  const wb = XLSX.utils.book_new();
  const catLabels = enabledCats.value.map(c => c.label);
  const claimWs = XLSX.utils.aoa_to_sheet([CLAIM_HEADERS.value]);
  const bonusWs = XLSX.utils.aoa_to_sheet([[...BONUS_FIXED_HEADERS, ...catLabels, ...BONUS_TAIL_HEADERS]]);
  const helpWs = XLSX.utils.aoa_to_sheet([
    ['請佣獎金 歷史資料匯入範本 — 填寫說明'],
    [''],
    ['【請佣紀錄】'],
    ['・必填：期別（數字）、戶別（需存在於本案銷控資料）、請佣比例'],
    ['・請佣比例／佣金比例：可填小數（0.5、0.022，沿用舊表）或百分比（50、2.2），系統自動判斷（≤1 視為小數）'],
    ['・金額欄位（成交總價等）單位為「萬」，介紹費為「元」；未填時以本案銷控現值計算'],
    ['・日期格式 yyyy/mm/dd；未填保留款(%) 預設 10'],
    [''],
    ['【獎金紀錄】'],
    ['・必填：期別、戶別、人員姓名；(期別,戶別) 需對應到「請佣紀錄」分頁中的一列'],
    ['・人員電話：跨案識別鍵，未填時以姓名比對本案銷售人員名單'],
    ['・各獎金類別金額為「該次實際發放金額（元）」；請佣比例非 100% 時系統自動回推 100% 金額供獎金表匯出'],
    ['・保留款／稅金／二代健保／實發金額未填時視為 0／自動計算'],
    [''],
    ['※ 匯入後每戶「已請比例」自動累計且不可超過 100%；匯入資料標記為「匯入」，可於歷期總覽作廢。'],
  ]);
  XLSX.utils.book_append_sheet(wb, claimWs, '請佣紀錄');
  XLSX.utils.book_append_sheet(wb, bonusWs, '獎金紀錄');
  XLSX.utils.book_append_sheet(wb, helpWs, '填寫說明');
  XLSX.writeFile(wb, `${props.projectName || props.projectId}_請佣獎金歷史匯入範本.xlsx`);
}

// ---------- 解析 ----------
function cellDate(v) {
  if (v instanceof Date) return formatDateTW(v);
  const s = String(v || '').trim();
  if (!s) return '';
  // 民國格式 115/5/23 → 2026/05/23
  const m = s.match(/^(\d{2,3})\/(\d{1,2})\/(\d{1,2})$/);
  if (m && Number(m[1]) < 1000) {
    return `${Number(m[1]) + 1911}/${String(m[2]).padStart(2, '0')}/${String(m[3]).padStart(2, '0')}`;
  }
  return s;
}

/** 比例欄位：≤1 視為小數（舊表格式），否則視為 % */
function pctOf(v, fallback = 0) {
  if (v === '' || v === null || v === undefined) return fallback;
  const n = Number(v);
  if (Number.isNaN(n)) return fallback;
  return n <= 1 ? round2(n * 100) : round2(n);
}

function sheetToObjects(ws) {
  const aoa = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });
  // 標頭列偵測：前 5 列中含「期別」與「戶別」者
  let headerIdx = -1;
  for (let i = 0; i < Math.min(5, aoa.length); i++) {
    const cells = aoa[i].map(c => String(c).trim());
    if (cells.includes('期別') && cells.includes('戶別')) { headerIdx = i; break; }
  }
  if (headerIdx < 0) return { headers: [], rows: [] };
  const headers = aoa[headerIdx].map(c => String(c).trim());
  const rows = aoa.slice(headerIdx + 1)
    .filter(r => r.some(c => String(c).trim() !== ''))
    .map(r => {
      const o = {};
      headers.forEach((h, i) => { if (h) o[h] = r[i]; });
      return o;
    });
  return { headers, rows };
}

function findSheet(wb, keyword) {
  const name = wb.SheetNames.find(n => n.includes(keyword));
  return name ? wb.Sheets[name] : null;
}

async function parseFile(f) {
  const target = Array.isArray(f) ? f[0] : f;
  if (!target) { parsed.value = false; return; }
  parsing.value = true;
  parsed.value = false;
  try {
    const data = await target.arrayBuffer();
    const wb = XLSX.read(data, { type: 'array', cellDates: true });
    const claimWs = findSheet(wb, '請佣紀錄') || wb.Sheets[wb.SheetNames[0]];
    const bonusWs = findSheet(wb, '獎金紀錄') || (wb.SheetNames[1] ? wb.Sheets[wb.SheetNames[1]] : null);

    parseClaims(sheetToObjects(claimWs).rows);
    parseBonuses(bonusWs ? sheetToObjects(bonusWs).rows : []);
    parsed.value = true;
    // 解析後：有錯誤預設只看問題列，並切到有錯誤的頁籤
    showOnlyIssues.value = errorCount.value > 0 || warnCount.value > 0;
    previewTab.value = claimErrorCount.value === 0 && bonusErrorCount.value > 0 ? 'bonuses' : 'claims';
    if (!claimRows.value.length) toast.warning('「請佣紀錄」分頁沒有可解析的資料列');
  } catch (e) {
    console.error('[CommissionHistoryImport] 解析失敗:', e);
    toast.error(`解析失敗：${e.message}`);
  } finally {
    parsing.value = false;
  }
}

function parseClaims(rows) {
  const s = mergedSettings.value;
  const unitMap = {};
  props.households.forEach(u => { unitMap[String(u.unitId).trim()] = u; });
  const cumulative = {};   // 檔內累計比例

  claimRows.value = rows.map(row => {
    const messages = [];
    let status = 'ok';
    const unitId = String(row['戶別'] ?? '').trim();
    const period = toNum(row['期別']);
    const ratioPct = pctOf(row['請佣比例']);

    if (!unitId) { messages.push('缺少戶別'); status = 'error'; }
    if (!period || period <= 0) { messages.push('期別須為正整數'); status = 'error'; }
    if (!(ratioPct > 0 && ratioPct <= 100)) { messages.push('請佣比例須介於 0～100'); status = 'error'; }

    const unit = unitMap[unitId];
    if (unitId && !unit) { messages.push('戶別不存在於本案銷控資料'); status = 'error'; }

    // 財務數字：表格值優先，未填以現值計算
    let finance = null;
    if (unit) {
      finance = computeUnitFinance(unit, props.parkings);
      const ovr = (key, header) => {
        const v = row[header];
        if (v !== '' && v !== null && v !== undefined && !Number.isNaN(Number(v))) finance[key] = Number(v);
      };
      ovr('dealTotal', '成交總價(含車)');
      ovr('totalFloor', '總底價');
      ovr('spread', '溢差價');
      ovr('houseDeal', '房屋成交價');
      ovr('parkDeal', '車位成交總價');
      ovr('houseFloor', '房屋總底價');
      ovr('parkFloor', '車位底價');
      if (row['溢差價'] === '' || row['溢差價'] === undefined) finance.spread = finance.dealTotal - finance.totalFloor;
    }

    const isPreferred = !!unit?.isPreferredPayment;
    const defaultComm = isPreferred
      ? round2(toNum(s.defaultCommissionPct) * toNum(s.preferredPaymentFactor ?? 0.5))
      : toNum(s.defaultCommissionPct);
    const commPct = pctOf(row['佣金比例'], defaultComm);
    const keepPct = row['保留款(%)'] === '' || row['保留款(%)'] === undefined ? toNum(s.defaultKeepPct) : pctOf(row['保留款(%)']);
    const partyAFee = toNum(row[s.partyALabel]);
    const partyBFee = toNum(row[s.partyBLabel]);

    let calcResult = null;
    if (finance && status !== 'error') {
      calcResult = calcClaim(finance, { commPct, keepPct, partyAFee, partyBFee });
    }

    // 比例累計檢查（既有 ledger + 檔內累計）
    if (status !== 'error' && unitId) {
      const before = toNum(props.ledgers[unitId]) + (cumulative[unitId] || 0);
      if (before + ratioPct > 100.0001) {
        messages.push(`累計比例將達 ${Math.round((before + ratioPct) * 10) / 10}%，超過 100%`);
        status = 'error';
      } else {
        cumulative[unitId] = (cumulative[unitId] || 0) + ratioPct;
      }
    }

    const snapshot = unit ? {
      buyerName: String(row['買方姓名'] ?? '').trim() || unit.buyerName || '',
      salesperson: String(row['銷售人員'] ?? '').trim()
        ? String(row['銷售人員']).split(/[、,，\/\s]+/).filter(Boolean)
        : (Array.isArray(unit.salesperson) ? unit.salesperson : []),
      parkingSpots: String(row['持有車位'] ?? '').trim() || finance?.parkingSpots || '',
      isPreferredPayment: isPreferred,
      contractDate: cellDate(row['簽約日期']) || formatDateTW(unit.payment_contract_date),
      depositDate: cellDate(row['小訂日期']) || formatDateTW(unit.payment_deposit_date),
      salesStatus: unit.salesStatus_backend || '',
      remarks: unit.remarks || '',
      dealTotal: finance?.dealTotal || 0, totalFloor: finance?.totalFloor || 0, spread: finance?.spread || 0,
      houseDeal: finance?.houseDeal || 0, parkDeal: finance?.parkDeal || 0,
      houseFloor: finance?.houseFloor || 0, parkFloor: finance?.parkFloor || 0,
    } : {};

    return {
      status, messages,
      unitId, period, requestDate: cellDate(row['請佣日期']),
      ratioPct, commPct, keepPct, partyAFee, partyBFee,
      snapshot, calc: calcResult || {},
    };
  });
}

function parseBonuses(rows) {
  const cats = enabledCats.value;
  const personByName = {};
  props.personnel.forEach(p => { personByName[p.name] = p; });

  bonusRows.value = rows.map(row => {
    const messages = [];
    let status = 'ok';
    const unitId = String(row['戶別'] ?? '').trim();
    const period = toNum(row['期別']);
    const name = String(row['人員姓名'] ?? '').trim();
    if (!unitId || !period) { messages.push('缺少期別或戶別'); status = 'error'; }
    if (!name) { messages.push('缺少人員姓名'); status = 'error'; }

    // 對應請佣紀錄列
    const claimIndex = claimRows.value.findIndex(c => c.status !== 'error' && c.unitId === unitId && toNum(c.period) === period);
    if (status !== 'error' && claimIndex < 0) {
      messages.push('找不到對應的請佣紀錄（期別＋戶別）');
      status = 'error';
    }
    const claim = claimIndex >= 0 ? claimRows.value[claimIndex] : null;

    // personKey：電話優先，其次比對本案人員名單
    let personKey = String(row['人員電話'] ?? '').trim();
    if (!personKey && name) {
      const p = personByName[name];
      if (p?.phone) personKey = p.phone;
      else { personKey = `ext:${name}`; if (status !== 'error') { messages.push('查無電話，以姓名識別（無法跨案彙總）'); status = 'warn'; } }
    }

    // 各類別金額（實際發放）＋回推 100%
    const amounts = {};
    const amountsFull = {};
    const ratio = toNum(claim?.ratioPct) || 100;
    cats.forEach(c => {
      const v = toNum(row[c.label]);
      if (v) {
        amounts[c.key] = Math.round(v);
        amountsFull[c.key] = ratio < 100 ? Math.round(v * 100 / ratio) : Math.round(v);
      }
    });
    const amountSum = Object.values(amounts).reduce((s, v) => s + v, 0);
    const subtotal = row['獎金小計'] !== '' && row['獎金小計'] !== undefined ? Math.round(toNum(row['獎金小計'])) : amountSum;
    if (status !== 'error' && subtotal !== amountSum && amountSum > 0) {
      messages.push(`獎金小計(${money(subtotal)})與各類合計(${money(amountSum)})不一致，以表格小計為準`);
      if (status === 'ok') status = 'warn';
    }
    const keep = Math.round(toNum(row['保留款']));
    const tax = Math.round(toNum(row['稅金']));
    const nhi = Math.round(toNum(row['二代健保']));
    const net = row['實發金額'] !== '' && row['實發金額'] !== undefined
      ? Math.round(toNum(row['實發金額']))
      : subtotal - keep - tax - nhi;

    return {
      status, messages, claimIndex,
      unitId, period, requestDate: cellDate(row['請佣日期']) || claim?.requestDate || '',
      personKey, name, role: String(row['職務'] ?? '').trim(),
      sourceProjectName: String(row['來源建案'] ?? '').trim(),
      amounts, amountsFull,
      subtotal,
      keepPct: subtotal ? round2(keep / subtotal * 100) : 0,
      taxPct: subtotal ? round2(tax / subtotal * 100) : 0,
      nhiPct: subtotal ? round2(nhi / subtotal * 100) : 0,
      keep, tax, nhi, net,
      remark: String(row['備註'] ?? '').trim(),
    };
  });
}

// ---------- 匯入 ----------
async function doImport() {
  importing.value = true;
  try {
    const validClaims = claimRows.value.filter(r => r.status !== 'error');
    // claimIndex 需對應過濾後的陣列
    const idxMap = {};
    let newIdx = 0;
    claimRows.value.forEach((r, i) => { if (r.status !== 'error') idxMap[i] = newIdx++; });
    const validBonuses = bonusRows.value
      .filter(r => r.status !== 'error' && idxMap[r.claimIndex] !== undefined)
      .map(r => ({ ...r, claimIndex: idxMap[r.claimIndex], status: undefined, messages: undefined }));

    const res = await importCommissionHistoryAPI({
      projectId: props.projectId,
      createdBy: userStore.user?.name || '',
      claims: validClaims.map(r => ({ ...r, status: undefined, messages: undefined })),
      bonuses: validBonuses,
    });
    if (res?.ok) {
      toast.success(`匯入完成：${res.claims} 筆請佣紀錄、${res.bonuses} 筆獎金明細`);
      claimRows.value = [];
      bonusRows.value = [];
      parsed.value = false;
      file.value = null;
      emit('imported');
    }
  } catch (e) {
    console.error('[CommissionHistoryImport] 匯入失敗:', e);
    toast.error(`匯入失敗：${e.message}`);
  } finally {
    importing.value = false;
  }
}

// ---------- UI 輔助 ----------
function statusColor(s) { return s === 'error' ? 'error' : s === 'warn' ? 'warning' : 'success'; }
function statusText(s) { return s === 'error' ? '錯誤' : s === 'warn' ? '警告' : '通過'; }
function rowClass(r) { return r.status === 'error' ? 'row-error' : ''; }
</script>

<style scoped>
.table-scroll { overflow-x: auto; max-height: 420px; overflow-y: auto; }
.row-error td { background: #fff5f5; }
.step-card { border-radius: 12px; }
.step-list { padding-left: 18px; line-height: 1.8; }
.stat-tile {
  background: #f4f6fb; border-radius: 10px; padding: 8px 14px;
}
.stat-tile label { display: block; font-size: 11px; color: #789; }
.stat-tile div { font-size: 20px; font-weight: 700; }
.stat-tile small { font-size: 12px; font-weight: 400; color: #789; }
.stat-tile.tile-error { background: #fdecec; }
.stat-tile.tile-error div { color: #c62828; }
.stat-tile.tile-warn { background: #fff7e6; }
.stat-tile.tile-warn div { color: #b45309; }
.stat-tile.tile-ok { background: #e9f7ef; }
.stat-tile.tile-ok div { color: #2e7d32; }
.msg-cell { max-width: 320px; white-space: normal; }
.action-bar { background: #fafbfe; }
</style>
