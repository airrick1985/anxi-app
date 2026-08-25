<template>
  <v-card class="mb-3 unit-card" :id="`comm-card-${entry.id}`" variant="outlined">
    <!-- 標頭 -->
    <div class="card-head d-flex align-center flex-wrap ga-2 px-4 py-2" @click="entry.collapsed = !entry.collapsed">
      <v-icon size="small" :class="{ 'rotate-collapsed': entry.collapsed }">mdi-chevron-down</v-icon>
      <span class="text-subtitle-1 font-weight-bold text-primary">{{ entry.unitId }}</span>
      <v-chip size="x-small" variant="tonal">{{ entry.unit.salesStatus_backend || '—' }}</v-chip>
      <v-chip v-if="entry.unit.isPreferredPayment" size="x-small" color="deep-purple" variant="tonal">優付</v-chip>
      <v-chip v-if="feeHint" size="x-small" color="error" variant="tonal">⚠ 介紹費/贈品</v-chip>
      <v-chip v-else-if="hasNote" size="x-small" color="warning" variant="tonal">含備註</v-chip>
      <v-chip size="x-small" variant="tonal" color="grey-darken-1">折數後總價 {{ money(result.claim.dealAfter * 10000) }} 元</v-chip>
      <v-chip size="x-small" variant="tonal" color="success">本次請佣 {{ money(result.claim.thisClaim) }} 元</v-chip>
      <v-spacer></v-spacer>
      <v-btn icon="mdi-close" size="small" variant="text" color="error" @click.stop="$emit('remove')"></v-btn>
    </div>

    <v-expand-transition>
      <div v-show="!entry.collapsed">
        <v-divider></v-divider>
        <v-card-text>
          <!-- 戶別資訊（唯讀） -->
          <div class="fgroup-h">戶別資訊</div>
          <v-row dense class="mb-1">
            <v-col cols="6" sm="3" md="2"><div class="ro-field"><label>簽約日期</label><div>{{ contractDateText || '—' }}</div></div></v-col>
            <v-col cols="6" sm="3" md="2"><div class="ro-field"><label>小訂日期</label><div>{{ depositDateText || '—' }}</div></div></v-col>
            <v-col cols="6" sm="3" md="2"><div class="ro-field"><label>買方姓名</label><div>{{ entry.unit.buyerName || '—' }}</div></div></v-col>
            <v-col cols="6" sm="3" md="2"><div class="ro-field"><label>持有車位</label><div>{{ entry.finance.parkingSpots || '—' }}</div></div></v-col>
            <v-col cols="6" sm="3" md="2"><div class="ro-field"><label>成交總價(含車)</label><div>{{ money(entry.finance.dealTotal * 10000) }} 元</div></div></v-col>
            <v-col cols="6" sm="3" md="2"><div class="ro-field"><label>溢差價</label><div :class="{ 'text-error': entry.finance.spread < 0 }">{{ money(entry.finance.spread * 10000) }} 元</div></div></v-col>
            <v-col cols="6" sm="3" md="2"><div class="ro-field"><label>繳款比例</label><div :class="paymentRatio === null ? '' : 'text-teal'">{{ paymentRatio === null ? '—' : paymentRatio + '%' }}</div></div></v-col>
          </v-row>
          <v-alert v-if="hasNote" :type="feeHint ? 'error' : 'warning'" variant="tonal" density="compact" class="mb-3">
            <b>{{ feeHint ? '🎁 備註可能提及介紹費/贈品：' : '📝 備註：' }}</b>{{ noteText }}
          </v-alert>

          <!-- 請佣設定 -->
          <div class="fgroup-h">請佣設定</div>
          <v-row dense class="mb-1">
            <v-col cols="6" sm="3" md="2">
              <v-text-field v-model.number="entry.period" label="期別" type="number" variant="outlined" density="compact" hide-details></v-text-field>
            </v-col>
            <v-col cols="6" sm="3" md="2">
              <v-text-field v-model="entry.requestDate" label="請佣日期" placeholder="yyyy/mm/dd" variant="outlined" density="compact" hide-details></v-text-field>
            </v-col>
            <v-col cols="6" sm="3" md="2">
              <div class="ro-field claimed"><label>已請佣金比例</label><div :class="claimedPct > 0 ? 'text-orange-darken-3' : ''">{{ claimedPct }}%</div></div>
            </v-col>
            <v-col cols="6" sm="3" md="2">
              <v-text-field
                :model-value="entry.ratioPct"
                label="本次請佣比例(%)"
                type="number" step="0.1" variant="outlined" density="compact" hide-details
                @update:model-value="onRatioInput"
              ></v-text-field>
            </v-col>
            <v-col cols="6" sm="3" md="2">
              <v-text-field v-model.number="entry.commPct" label="佣金比例(%)" type="number" step="0.01" variant="outlined" density="compact"
                :hint="entry.unit.isPreferredPayment ? '優付戶預設減半' : '折數計算用'" persistent-hint></v-text-field>
            </v-col>
            <v-col cols="6" sm="3" md="2">
              <v-text-field v-model.number="entry.keepPct" label="請佣保留款(%)" type="number" step="1" variant="outlined" density="compact" hide-details></v-text-field>
            </v-col>
            <v-col cols="12" sm="6" md="4">
              <v-text-field v-model.number="entry.partyAFee" :label="`${settings.partyALabel}(元)`" type="number" variant="outlined" density="compact"
                hint="計入獎金折數" persistent-hint></v-text-field>
            </v-col>
            <v-col cols="12" sm="6" md="4">
              <v-text-field v-model.number="entry.partyBFee" :label="`${settings.partyBLabel}(元)`" type="number" variant="outlined" density="compact"
                hint="計入請佣基準、不計折數" persistent-hint></v-text-field>
            </v-col>
            <v-col cols="12" md="4" class="d-flex align-center">
              <v-chip :color="ratioOver ? 'error' : 'success'" variant="tonal">
                {{ ratioOver ? `⚠ 已超過 ${round1(totalPct - 100)}%` : `尚餘 ${round1(100 - totalPct)}% 未請佣` }}
                <span class="text-caption ml-1">（既有 {{ claimedPct }}% ＋ 本次 {{ entry.ratioPct }}%）</span>
              </v-chip>
            </v-col>
          </v-row>

          <!-- 請佣試算 -->
          <div class="fgroup-h">請佣試算（同「匯出請佣總表」，即時更新）</div>
          <div class="table-scroll mb-1">
            <v-table density="compact" class="claim-table">
              <thead>
                <tr>
                  <th>總底價(萬)</th><th>總成交價(萬)</th><th>溢差價(萬)</th><th>介紹費(萬)</th><th>實際溢差價(萬)</th>
                  <th>佣金比例</th><th>獎金折數</th><th>折數後總價(萬)</th><th>實際請領金額(元)</th><th>保留款(元)</th><th>本次請佣(元)</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>{{ fmtWan(entry.finance.totalFloor) }}</td>
                  <td>{{ fmtWan(entry.finance.dealTotal) }}</td>
                  <td :class="{ 'text-error': entry.finance.spread < 0 }">{{ fmtWan(entry.finance.spread) }}</td>
                  <td>{{ fmtWan(result.claim.feeWan, 4) }}</td>
                  <td :class="{ 'text-error': result.claim.realSpread < 0 }">{{ fmtWan(result.claim.realSpread) }}</td>
                  <td>{{ (Number(entry.commPct) || 0).toFixed(2) }}%</td>
                  <td>{{ result.claim.discount.toFixed(2) }}</td>
                  <td>{{ money(result.claim.dealAfter) }}</td>
                  <td class="text-primary font-weight-bold">{{ money(result.claim.realClaim) }}</td>
                  <td>{{ money(result.claim.claimKeep) }}</td>
                  <td class="text-success font-weight-bold">{{ money(result.claim.thisClaim) }}</td>
                </tr>
              </tbody>
            </v-table>
          </div>
          <div class="text-caption text-medium-emphasis mb-3">
            請佣基準＝min(總成交價−介紹費, 總底價)，本戶取 {{ result.claim.baseWan === entry.finance.totalFloor ? '總底價' : '總成交價−介紹費' }}
            {{ fmtWan(result.claim.baseWan) }} 萬；介紹費(萬)＝「{{ settings.partyBLabel }}」÷10,000。
          </div>

          <!-- 團獎案場 -->
          <div class="fgroup-h" v-if="settings.teamGroups.length">團獎案場（勾選後自動帶入符合資格的團獎人員）</div>
          <div class="d-flex flex-wrap ga-1 mb-3" v-if="settings.teamGroups.length">
            <v-chip
              v-for="g in settings.teamGroups"
              :key="g.key"
              size="small"
              :color="entry.teamSiteKeys.includes(g.key) ? 'primary' : undefined"
              :variant="entry.teamSiteKeys.includes(g.key) ? 'flat' : 'outlined'"
              @click="toggleTeamSite(g.key)"
            >{{ g.label }}</v-chip>
          </div>

          <!-- 各類獎金分配 -->
          <div class="fgroup-h">獎金人員與分配</div>
          <AllocationEditor
            v-for="cat in enabledCategories"
            :key="cat.key"
            :category="entry.categories[cat.key]"
            :pool="result.pools[cat.key] || 0"
            :result="result.categoryResults[cat.key] || { amounts: {}, valid: true, error: '', total: 0 }"
            :pool-options="poolOptionsByCat[cat.key] || []"
            :project-id="projectId"
            @add-person="openPicker(cat.key)"
          />

          <!-- 每人明細 -->
          <div class="fgroup-h">獎金明細（每人；保留款/稅金/二代健保比例與備註可覆寫，跨戶共用）</div>
          <div class="table-scroll">
            <v-table density="compact" class="matrix-table">
              <thead>
                <tr>
                  <th>人員</th><th>職務/來源</th>
                  <th v-for="cat in enabledCategories" :key="cat.key" class="text-right">{{ cat.label }}</th>
                  <th class="text-right">小計</th>
                  <th class="text-right">保留款</th><th class="text-right">稅金</th><th class="text-right">二代健保</th>
                  <th class="text-right">實發</th><th>備註</th>
                </tr>
              </thead>
              <tbody>
                <tr v-if="!result.people.length">
                  <td :colspan="enabledCategories.length + 8" class="text-center text-medium-emphasis">尚無勾選人員</td>
                </tr>
                <tr v-for="p in result.people" :key="p.personKey">
                  <td class="font-weight-medium">{{ p.name }}</td>
                  <td>
                    {{ p.role || '—' }}
                    <v-chip v-if="p.sourceProjectId && p.sourceProjectId !== projectId" size="x-small" color="orange" variant="tonal">{{ p.sourceProjectName || p.sourceProjectId }}</v-chip>
                  </td>
                  <td v-for="cat in enabledCategories" :key="cat.key" class="text-right" :class="{ 'text-disabled': !p.amounts[cat.key] }">
                    {{ money(p.amounts[cat.key] || 0) }}
                  </td>
                  <td class="text-right font-weight-medium">{{ money(p.subtotal) }}</td>
                  <td class="text-right">
                    <input class="pct-input" type="number" step="0.01" :value="profileOf(p.personKey).keepPct" @change="e => setProfile(p.personKey, 'keepPct', e.target.value)">%
                    <div class="text-caption text-medium-emphasis">{{ money(p.keep) }}</div>
                  </td>
                  <td class="text-right">
                    <input class="pct-input" type="number" step="0.01" :value="profileOf(p.personKey).taxPct" @change="e => setProfile(p.personKey, 'taxPct', e.target.value)">%
                    <div class="text-caption text-medium-emphasis">{{ money(p.tax) }}</div>
                  </td>
                  <td class="text-right">
                    <input class="pct-input" type="number" step="0.01" :value="profileOf(p.personKey).nhiPct" @change="e => setProfile(p.personKey, 'nhiPct', e.target.value)">%
                    <div class="text-caption text-medium-emphasis">{{ money(p.nhi) }}</div>
                  </td>
                  <td class="text-right text-success font-weight-bold">{{ money(p.net) }}</td>
                  <td>
                    <input class="rmk-input" type="text" :value="profileOf(p.personKey).remark" @change="e => setProfile(p.personKey, 'remark', e.target.value)">
                  </td>
                </tr>
              </tbody>
            </v-table>
          </div>
        </v-card-text>
      </div>
    </v-expand-transition>

    <CrossProjectPersonPicker
      v-model="pickerOpen"
      :project-id="projectId"
      @select="onPickPerson"
    />
  </v-card>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useToast } from 'vue-toastification';
import AllocationEditor from './AllocationEditor.vue';
import CrossProjectPersonPicker from './CrossProjectPersonPicker.vue';
import {
  calcUnitBonus, money, toNum, round2, formatDateTW, evenShares, toDateValue, paymentRatioPct,
} from '@/utils/commissionCalculation';

const props = defineProps({
  entry: { type: Object, required: true },
  settings: { type: Object, required: true },
  profiles: { type: Object, required: true },        // personKey -> profile（reactive，跨卡共用）
  projectId: { type: String, required: true },
  projectName: { type: String, default: '' },
  localPersonnel: { type: Array, default: () => [] },
  claimedPct: { type: Number, default: 0 },
});

const emit = defineEmits(['remove']);
const toast = useToast();

const pickerOpen = ref(false);
const pickerTargetCat = ref('');

const enabledCategories = computed(() =>
  (props.settings.bonusCategories || [])
    .filter(c => c.enabled !== false)
    .slice()
    .sort((a, b) => (a.order || 0) - (b.order || 0))
);

const noteText = computed(() => String(props.entry.unit.remarks || ''));
const hasNote = computed(() => noteText.value.trim() !== '');
const feeHint = computed(() => hasNote.value && /介紹|贈品/.test(noteText.value));
const contractDateText = computed(() => formatDateTW(props.entry.unit.payment_contract_date));
const depositDateText = computed(() => formatDateTW(props.entry.unit.payment_deposit_date));
const paymentRatio = computed(() => paymentRatioPct(props.entry.unit, props.entry.finance.dealTotal));

const totalPct = computed(() => props.claimedPct + toNum(props.entry.ratioPct));
const ratioOver = computed(() => totalPct.value > 100.0001);

/** 即時計算（分配/比例/介紹費任一變動即重算） */
const result = computed(() => calcUnitBonus(props.entry.finance, {
  ratioPct: toNum(props.entry.ratioPct),
  commPct: toNum(props.entry.commPct),
  keepPct: toNum(props.entry.keepPct),
  partyAFee: toNum(props.entry.partyAFee),
  partyBFee: toNum(props.entry.partyBFee),
  categories: props.entry.categories,
}, props.profiles));

defineExpose({ result });

function round1(n) { return Math.round((Number(n) || 0) * 10) / 10; }
function fmtWan(n, d = 2) {
  return (Number(n) || 0).toLocaleString('en-US', { maximumFractionDigits: d });
}

function onRatioInput(v) {
  const maxPct = Math.max(0, round1(100 - props.claimedPct));
  let val = Number(v) || 0;
  if (val > maxPct) {
    val = maxPct;
    toast.warning(`已請＋本次不可超過 100%，已調整為 ${val}%`);
  }
  props.entry.ratioPct = val;
}

// ---------- 候選人員 ----------
function personKeyOf(p) { return p.phone || `ext:${p.name}`; }

function qualified(p, contractDate) {
  const sign = toDateValue(contractDate);
  if (!sign) return true;
  const bc = p.bonusConfig || {};
  const inD = toDateValue(bc.inDate);
  const outD = toDateValue(bc.outDate);
  if (inD && sign < inD) return false;
  if (outD && sign > outD) return false;
  return true;
}

const poolOptionsByCat = computed(() => {
  const map = {};
  const contractDate = props.entry.unit.payment_contract_date;
  enabledCategories.value.forEach(cat => {
    let list = [];
    if (cat.mode === 'role') {
      const roles = cat.rolePositions || [];
      list = props.localPersonnel
        .filter(p => (p.positions || []).some(pos => roles.some(r => String(pos).includes(r) || String(r).includes(pos))))
        .map(p => ({ personKey: personKeyOf(p), name: p.name, hint: '', disabled: false }));
    } else if (cat.mode === 'team') {
      list = props.localPersonnel
        .filter(p => (p.positions || []).some(pos => ['專案', '副專', '銷售'].some(r => String(pos).includes(r))))
        .map(p => {
          const ok = qualified(p, contractDate);
          const bc = p.bonusConfig || {};
          return {
            personKey: personKeyOf(p), name: p.name,
            hint: `${bc.inDate || '?'}~${bc.outDate || '在案中'}${ok ? '' : '・資格不符'}`,
            disabled: !ok,
          };
        });
    } else {
      // individual：本案「銷售」職務人員；該戶銷售人員標記
      const unitSales = normalizeNames(props.entry.unit.salesperson);
      list = props.localPersonnel
        .filter(p => (p.positions || []).some(pos => String(pos).includes('銷售')))
        .map(p => ({
          personKey: personKeyOf(p), name: p.name,
          hint: unitSales.includes(p.name) ? '本戶銷售' : '',
          disabled: false,
        }));
      // 該戶銷售人員若不在名單中，也列為候選（以姓名為 key）
      unitSales.forEach(nm => {
        if (!list.some(o => o.name === nm)) {
          list.push({ personKey: `ext:${nm}`, name: nm, hint: '本戶銷售（未在人員名單）', disabled: false });
        }
      });
    }
    // 註冊 profile（供計算扣款）
    list.forEach(o => ensureLocalProfile(o.personKey, o.name));
    map[cat.key] = list;
  });
  return map;
});

function normalizeNames(v) {
  if (Array.isArray(v)) return v.map(s => String(s).trim()).filter(Boolean);
  if (typeof v === 'string') return v.split(/[、,，\/\s]+/).map(s => s.trim()).filter(Boolean);
  return [];
}

function ensureLocalProfile(personKey, name) {
  if (props.profiles[personKey]) return;
  const p = props.localPersonnel.find(x => personKeyOf(x) === personKey || x.name === name);
  const bc = p?.bonusConfig || {};
  props.profiles[personKey] = {
    name: p?.name || name,
    role: (p?.positions || []).join('、'),
    keepPct: toNum(bc.keepPct),
    taxPct: toNum(bc.taxPct),
    nhiPct: toNum(bc.nhiPct),
    remark: bc.remark || '',
    sourceProjectId: props.projectId,
    sourceProjectName: props.projectName,
  };
}

function profileOf(personKey) {
  if (!props.profiles[personKey]) ensureLocalProfile(personKey, personKey);
  return props.profiles[personKey];
}

function setProfile(personKey, field, value) {
  const prof = profileOf(personKey);
  if (field === 'remark') prof.remark = String(value || '');
  else prof[field] = round2(Number(value) || 0);
}

// ---------- 團獎案場 ----------
function toggleTeamSite(key) {
  const idx = props.entry.teamSiteKeys.indexOf(key);
  if (idx >= 0) props.entry.teamSiteKeys.splice(idx, 1);
  else props.entry.teamSiteKeys.push(key);
  applyTeamDefaults();
}

/** 依勾選的團獎分組 + 進退場資格，重設 team 類別的預設名單（均分） */
function applyTeamDefaults() {
  const contractDate = props.entry.unit.payment_contract_date;
  enabledCategories.value.filter(c => c.mode === 'team').forEach(cat => {
    const sel = [];
    props.localPersonnel.forEach(p => {
      const bc = p.bonusConfig || {};
      const groups = Array.isArray(bc.teamGroupKeys) ? bc.teamGroupKeys : [];
      const inSite = groups.some(g => props.entry.teamSiteKeys.includes(g));
      if (inSite && qualified(p, contractDate)) sel.push(p);
    });
    const allocations = sel.map(p => {
      ensureLocalProfile(personKeyOf(p), p.name);
      return {
        personKey: personKeyOf(p), name: p.name,
        sourceProjectId: props.projectId, sourceProjectName: props.projectName,
        isExternal: false, mode: 'pct', sharePct: 0, lockedAmount: null,
      };
    });
    const shares = evenShares(allocations.length);
    allocations.forEach((a, i) => { a.sharePct = shares[i]; });
    props.entry.categories[cat.key].allocations = allocations;
  });
}

// ---------- 跨案人員 ----------
function openPicker(catKey) {
  pickerTargetCat.value = catKey;
  pickerOpen.value = true;
}

function onPickPerson(person) {
  const cat = props.entry.categories[pickerTargetCat.value];
  if (!cat) return;
  if (cat.allocations.some(a => a.personKey === person.personKey)) {
    toast.warning(`${person.name} 已在此類別名單中`);
    return;
  }
  // 註冊 profile（帶入原案扣款設定，可覆寫）
  if (!props.profiles[person.personKey]) {
    props.profiles[person.personKey] = {
      name: person.name,
      role: person.role || '',
      keepPct: toNum(person.profile?.keepPct),
      taxPct: toNum(person.profile?.taxPct),
      nhiPct: toNum(person.profile?.nhiPct),
      remark: person.profile?.remark || '',
      sourceProjectId: person.sourceProjectId,
      sourceProjectName: person.sourceProjectName,
    };
  }
  cat.allocations.push({
    personKey: person.personKey,
    name: person.name,
    sourceProjectId: person.sourceProjectId,
    sourceProjectName: person.sourceProjectName,
    isExternal: !!person.isExternal,
    mode: 'pct',
    sharePct: 0,
    lockedAmount: null,
  });
  // 均分 pct 模式
  const pcts = cat.allocations.filter(a => a.mode !== 'locked');
  const shares = evenShares(pcts.length);
  pcts.forEach((a, i) => { a.sharePct = shares[i]; });
}
</script>

<style scoped>
.unit-card { border-radius: 12px; overflow: hidden; }
.card-head { cursor: pointer; background: linear-gradient(180deg, #fafbff, #fff); }
.rotate-collapsed { transform: rotate(-90deg); }
.fgroup-h {
  font-size: 12px; font-weight: 700; color: #556; margin: 10px 0 6px;
  display: flex; align-items: center; gap: 6px;
}
.fgroup-h::before { content: ''; width: 3px; height: 12px; background: rgb(var(--v-theme-primary)); border-radius: 2px; }
.ro-field { background: #f8fafc; border-radius: 6px; padding: 4px 8px; min-height: 46px; }
.ro-field label { display: block; font-size: 11px; color: #789; }
.ro-field div { font-weight: 600; font-size: 13px; }
.table-scroll { overflow-x: auto; }
.claim-table th, .claim-table td { white-space: nowrap; text-align: right; }
.claim-table th { text-align: center; }
.matrix-table th, .matrix-table td { white-space: nowrap; }
.pct-input { width: 58px; border: 1px solid #cdd8ec; border-radius: 4px; padding: 1px 4px; text-align: right; font-size: 12px; }
.rmk-input { width: 130px; border: 1px solid #cdd8ec; border-radius: 4px; padding: 1px 6px; font-size: 12px; }
</style>
