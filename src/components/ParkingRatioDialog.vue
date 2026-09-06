<template>
  <v-dialog v-model="dialogOpen" max-width="860" :fullscreen="mobile" scrollable>
    <v-card class="parking-ratio-dialog">
      <v-card-title class="text-white d-flex align-center" :class="`bg-${meta.color}`">
        <v-icon class="mr-2">{{ meta.icon }}</v-icon>
        <span class="text-subtitle-1 font-weight-bold">房車比速覽</span>
        <span v-if="projectName" class="text-body-2 ml-2 opacity-90">{{ projectName }}</span>
        <v-spacer />
        <v-btn icon="mdi-close" variant="text" size="small" @click="dialogOpen = false" />
      </v-card-title>

      <v-card-text class="pt-4">
        <!-- 全案概況（常駐，不受計算條件影響） -->
        <div class="overview-strip mb-4">
          <div class="overview-item">
            <div class="overview-item__label">全案戶數</div>
            <div class="overview-item__value">{{ stats.overview.households }}<span class="overview-item__unit">戶</span></div>
          </div>
          <div class="overview-item">
            <div class="overview-item__label"><v-icon size="14" class="mr-1">mdi-home-outline</v-icon>住家</div>
            <div class="overview-item__value">{{ stats.overview.home }}<span class="overview-item__unit">戶</span></div>
          </div>
          <div class="overview-item">
            <div class="overview-item__label"><v-icon size="14" class="mr-1">mdi-storefront-outline</v-icon>店面</div>
            <div class="overview-item__value">{{ stats.overview.store }}<span class="overview-item__unit">戶</span></div>
          </div>
          <div class="overview-item">
            <div class="overview-item__label"><v-icon size="14" class="mr-1">mdi-home-lock</v-icon>已售戶數</div>
            <div class="overview-item__value">{{ stats.overview.householdsSold }}<span class="overview-item__unit">戶</span></div>
            <div class="overview-item__sub">住家 {{ stats.overview.homeSold }}・店面 {{ stats.overview.storeSold }}<template v-if="stats.overview.householdsHeld > 0">・另保留 {{ stats.overview.householdsHeld }}</template></div>
          </div>
          <div class="overview-item">
            <div class="overview-item__label"><v-icon size="14" class="mr-1">mdi-car-multiple</v-icon>車位總數</div>
            <div class="overview-item__value">{{ stats.overview.parkings }}<span class="overview-item__unit">個</span></div>
            <div v-if="stats.overview.parkingsNonSale > 0" class="overview-item__sub">可售用 {{ stats.overview.parkingsSellable }}・非銷售用 {{ stats.overview.parkingsNonSale }}</div>
          </div>
          <div class="overview-item">
            <div class="overview-item__label"><v-icon size="14" class="mr-1">mdi-car-key</v-icon>已售車位</div>
            <div class="overview-item__value">{{ stats.overview.parkingsSold }}<span class="overview-item__unit">個</span></div>
            <div class="overview-item__sub">已簽約＋已訂未簽<template v-if="stats.overview.parkingsHeld > 0">・另保留 {{ stats.overview.parkingsHeld }}</template></div>
          </div>
          <div class="overview-item">
            <div class="overview-item__label"><v-icon size="14" class="mr-1">mdi-scale-balance</v-icon>整體房車比</div>
            <div class="overview-item__value">{{ fmtRatio(stats.overview.households > 0 ? stats.overview.parkingsSellable / stats.overview.households : null) }}</div>
            <div class="overview-item__sub">車位 ÷ 全案戶數</div>
          </div>
        </div>

        <!-- 結論 -->
        <v-alert :type="alertType" variant="tonal" density="comfortable" class="mb-4" :icon="meta.icon">
          <div class="font-weight-bold mb-1">{{ meta.label }}</div>
          <div class="text-body-2">{{ summaryText }}</div>
        </v-alert>

        <!-- 計算條件 -->
        <div class="ratio-options mb-4">
          <v-switch
            v-model="includeStore"
            label="店面戶別納入計算"
            color="primary"
            density="compact"
            hide-details
            inset
          />
          <v-text-field
            v-model.number="parkingPerUnit"
            type="number"
            min="0"
            step="0.5"
            label="每戶預期配車數"
            variant="outlined"
            density="compact"
            hide-details
            class="ratio-options__ppu"
            suffix="車"
          />
        </div>

        <!-- 三格統計 -->
        <div class="ratio-tiles mb-4">
          <div class="ratio-tile">
            <div class="ratio-tile__title"><v-icon size="18" class="mr-1">mdi-home-outline</v-icon>戶別{{ includeStore ? '（含店面）' : '（住家）' }}</div>
            <div class="ratio-tile__main">{{ stats.households.remaining }}<span class="ratio-tile__unit">戶可售</span></div>
            <div class="ratio-tile__sub">總數 {{ stats.households.total }}・已去化 {{ stats.households.occupied }}<template v-if="stats.households.byTier.held > 0">・含保留 {{ stats.households.byTier.held }}</template></div>
          </div>
          <div class="ratio-tile">
            <div class="ratio-tile__title"><v-icon size="18" class="mr-1">mdi-car-multiple</v-icon>車位</div>
            <div class="ratio-tile__main" :class="`text-${meta.color}`">{{ stats.parkings.remaining }}<span class="ratio-tile__unit">個可售</span></div>
            <div class="ratio-tile__sub">總數 {{ stats.parkings.total }}・已去化 {{ stats.parkings.occupied }}<template v-if="stats.parkings.byTier.held > 0">・含保留 {{ stats.parkings.byTier.held }}</template><template v-if="stats.parkings.nonSale > 0">・非銷售用 {{ stats.parkings.nonSale }}</template></div>
          </div>
          <div class="ratio-tile">
            <div class="ratio-tile__title"><v-icon size="18" class="mr-1">mdi-car-arrow-right</v-icon>車位餘裕</div>
            <div class="ratio-tile__main" :class="stats.surplus < 0 ? 'text-error' : 'text-success'">
              {{ stats.surplus < 0 ? '缺' : '餘裕' }} {{ Math.abs(stats.surplus) }}<span class="ratio-tile__unit">車</span>
            </div>
            <div class="ratio-tile__sub">
              剩餘 {{ stats.households.remaining }} 戶各配 {{ stats.parkingPerUnit }} 車後{{ stats.surplus < 0 ? '不足' : '多出' }}的車位<template v-if="stats.surplus > 0">，可供加購</template>
            </div>
          </div>
        </div>

        <!-- 車位去化拆解（確定度層級） -->
        <div class="text-subtitle-2 font-weight-bold mb-2">車位確定度（暫時保留視為未售，不計入已去化）</div>
        <div class="tier-bar mb-2" v-if="tierTotal > 0">
          <div
            v-for="t in tierSegments"
            :key="t.key"
            class="tier-bar__seg"
            :style="{ width: t.pct + '%', background: t.color }"
            :title="`${t.label} ${t.count}`"
          ></div>
        </div>
        <div class="tier-chips mb-4">
          <v-chip v-for="t in tierSegments" :key="t.key" size="small" variant="flat" :color="t.color" class="text-white">
            {{ t.label }} {{ t.count }}
          </v-chip>
          <span v-if="tierTotal === 0" class="text-caption text-grey">尚無已去化或保留中的車位</span>
        </div>

        <!-- 兩種情境的缺口 -->
        <div class="text-subtitle-2 font-weight-bold mb-2">車位缺口</div>
        <div class="scenario-grid mb-4">
          <div class="scenario scenario--main" :class="`scenario--${gapLevel(stats.scenarios.heldReleased.gap)}`">
            <div class="scenario__title">目前計算（暫時保留視為未售）</div>
            <div class="scenario__row"><span>剩餘可售 {{ stats.households.remaining }} 戶 × 每戶 {{ stats.parkingPerUnit }} 車</span><span class="font-weight-bold">需 {{ stats.scenarios.heldReleased.required }} 個</span></div>
            <div class="scenario__row"><span>可用車位</span><span class="font-weight-bold">{{ stats.scenarios.heldReleased.available }} 個</span></div>
            <div class="scenario__row scenario__result">
              <span>{{ stats.scenarios.heldReleased.gap > 0 ? '缺口' : '餘裕' }}</span>
              <span class="font-weight-bold">{{ Math.abs(stats.scenarios.heldReleased.gap) }} 個</span>
            </div>
          </div>
          <div class="scenario" :class="`scenario--${gapLevel(stats.scenarios.heldSold.gap)}`">
            <div class="scenario__title">若保留戶與保留車位全部成交</div>
            <div class="scenario__row"><span>剩餘 {{ Math.max(0, stats.households.remaining - stats.households.byTier.held) }} 戶 × 每戶 {{ stats.parkingPerUnit }} 車</span><span class="font-weight-bold">需 {{ stats.scenarios.heldSold.required }} 個</span></div>
            <div class="scenario__row"><span>可用車位</span><span class="font-weight-bold">{{ stats.scenarios.heldSold.available }} 個</span></div>
            <div class="scenario__row scenario__result">
              <span>{{ stats.scenarios.heldSold.gap > 0 ? '缺口' : '餘裕' }}</span>
              <span class="font-weight-bold">{{ Math.abs(stats.scenarios.heldSold.gap) }} 個</span>
            </div>
          </div>
        </div>

        <!-- 暫時保留清單 -->
        <div class="d-flex align-center flex-wrap mb-2" style="gap: 8px;">
          <span class="text-subtitle-2 font-weight-bold">暫時保留車位（{{ stats.parkings.heldList.length }}）</span>
          <v-chip v-if="stats.parkings.overdueCount > 0" size="x-small" color="error" variant="flat" class="text-white">逾期 {{ stats.parkings.overdueCount }}</v-chip>
          <v-chip v-if="stats.parkings.noDeadlineCount > 0" size="x-small" color="grey" variant="tonal">未設到期日 {{ stats.parkings.noDeadlineCount }}</v-chip>
          <v-spacer />
          <v-btn size="small" variant="text" color="primary" prepend-icon="mdi-car-cog" @click="emit('go-parking-control')">前往車位管理</v-btn>
        </div>
        <v-table density="compact" class="ratio-table held-table mb-4">
          <thead>
            <tr>
              <th>車位</th>
              <th>形式</th>
              <th>狀態</th>
              <th>保留人</th>
              <th>到期日</th>
              <th class="text-right">已保留</th>
              <th>備註</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="h in stats.parkings.heldList"
              :key="h.id || h.spotId"
              class="held-row"
              :class="{ 'held-row--overdue': h.overdue }"
              @click="emit('open-parking', h)"
              title="點擊前往車位管理"
            >
              <td class="font-weight-bold">{{ h.spotId }}</td>
              <td>{{ h.type2 || '-' }}</td>
              <td>{{ h.status || '-' }}</td>
              <td>{{ h.reservedBy || h.buyerName || '-' }}</td>
              <td>
                <template v-if="h.reservedUntil">
                  {{ h.reservedUntil }}
                  <span v-if="h.overdue" class="text-error font-weight-bold">（逾期 {{ h.daysOverdue }} 天）</span>
                </template>
                <span v-else class="text-grey">未設定</span>
              </td>
              <td class="text-right">{{ h.daysHeld !== null ? `${h.daysHeld} 天` : '-' }}</td>
              <td class="held-note">{{ h.reservedNote || '' }}</td>
            </tr>
            <tr v-if="stats.parkings.heldList.length === 0">
              <td colspan="7" class="text-center text-grey">目前沒有暫時保留的車位</td>
            </tr>
          </tbody>
        </v-table>

        <!-- 依車位形式 -->
        <div class="text-subtitle-2 font-weight-bold mb-2">依車位形式</div>
        <v-table density="compact" class="ratio-table mb-4">
          <thead>
            <tr>
              <th>車位形式</th>
              <th class="text-right">總數</th>
              <th class="text-right">已去化</th>
              <th class="text-right">可售</th>
              <th class="text-right">其中保留</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="t in stats.byParkingType" :key="t.label">
              <td>{{ t.label }}</td>
              <td class="text-right">{{ t.total }}</td>
              <td class="text-right">{{ t.occupied }}</td>
              <td class="text-right" :class="t.remaining === 0 ? 'text-error font-weight-bold' : ''">{{ t.remaining }}</td>
              <td class="text-right">{{ t.held }}</td>
            </tr>
            <tr v-if="stats.byParkingType.length === 0">
              <td colspan="5" class="text-center text-grey">尚無車位資料</td>
            </tr>
          </tbody>
        </v-table>

        <!-- 依住家／店面 -->
        <div class="text-subtitle-2 font-weight-bold mb-2">依戶別類型</div>
        <v-table density="compact" class="ratio-table mb-4">
          <thead>
            <tr>
              <th>類型</th>
              <th class="text-right">總數</th>
              <th class="text-right">已簽約</th>
              <th class="text-right">已訂未簽</th>
              <th class="text-right">可售</th>
              <th class="text-right">其中保留</th>
              <th class="text-right">已去化未配車</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(s, label) in stats.byPropertyType" :key="label">
              <td>{{ label }}<span v-if="label === '店面' && !includeStore" class="text-caption text-grey ml-1">（未納入）</span></td>
              <td class="text-right">{{ s.total }}</td>
              <td class="text-right">{{ s.byTier.signed }}</td>
              <td class="text-right">{{ s.byTier.booked }}</td>
              <td class="text-right">{{ s.remaining }}</td>
              <td class="text-right">{{ s.byTier.held }}</td>
              <td class="text-right">{{ s.occupiedWithoutParking }}</td>
            </tr>
          </tbody>
        </v-table>

        <!-- 提醒事項 -->
        <div class="ratio-notes">
          <div v-if="stats.households.occupiedWithoutParking > 0" class="ratio-note">
            <v-icon size="16" color="warning" class="mr-1">mdi-alert-circle-outline</v-icon>
            已去化但尚未配車位：{{ stats.households.occupiedWithoutParking }} 戶，之後若加購車位會再吃掉可售車位
          </div>
          <div v-if="stats.parkings.standalone > 0" class="ratio-note">
            <v-icon size="16" color="info" class="mr-1">mdi-information-outline</v-icon>
            已占用但未綁定戶別的車位：{{ stats.parkings.standalone }} 個（單獨售出、保留中或尚未指定購買戶別）
          </div>
          <div class="ratio-note text-grey">
            <v-icon size="16" class="mr-1">mdi-help-circle-outline</v-icon>
            確定度依狀態名稱自動判斷（簽約／已售／成交＝已簽約；小訂／補足＝已訂未簽；保留／銷控＝暫時保留；來賓＝非銷售用），可在銷控設定的狀態參數指定層級覆蓋。暫時保留的戶別與車位一律視為未售、計入剩餘可售。統計依目前載入的銷控資料即時計算。
          </div>
        </div>
      </v-card-text>

      <v-card-actions>
        <v-spacer />
        <v-btn variant="text" @click="dialogOpen = false">關閉</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { computed, ref } from 'vue';
import { useDisplay } from 'vuetify';
import { useParkingRatio, PARKING_RATIO_LEVEL_META, DEFAULT_PARKING_PER_UNIT } from '@/composables/useParkingRatio';
import { COMMITMENT_TIERS } from '@/utils/salesStatusGroups';

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  households: { type: Array, default: () => [] },
  parkings: { type: Array, default: () => [] },
  // 銷控狀態參數（含 commitmentTier 覆蓋）
  parameters: { type: Array, default: () => [] },
  projectName: { type: String, default: '' },
});
const emit = defineEmits(['update:modelValue', 'open-parking', 'go-parking-control']);

const { mobile } = useDisplay();

const dialogOpen = computed({
  get: () => props.modelValue,
  set: (v) => emit('update:modelValue', v),
});

// 計算條件：面板內即時調整，不寫入設定（店面預設納入）
const includeStore = ref(true);
const parkingPerUnit = ref(DEFAULT_PARKING_PER_UNIT);

const options = computed(() => ({
  includeStore: includeStore.value,
  parkingPerUnit: Number(parkingPerUnit.value) > 0 ? Number(parkingPerUnit.value) : DEFAULT_PARKING_PER_UNIT,
  parameters: props.parameters,
}));

const { stats, level, summaryText } = useParkingRatio(
  computed(() => props.households),
  computed(() => props.parkings),
  options
);

const meta = computed(() => PARKING_RATIO_LEVEL_META[level.value] || PARKING_RATIO_LEVEL_META.none);
const alertType = computed(() => {
  if (level.value === 'danger') return 'error';
  if (level.value === 'warn') return 'warning';
  if (level.value === 'ok') return 'success';
  return 'info';
});

// 確定度色條：已簽約／已訂未簽（已去化）＋ 暫時保留（視為未售，僅供辨識）
const tierTotal = computed(() => {
  const t = stats.value.parkings.byTier;
  return (t.signed || 0) + (t.booked || 0) + (t.held || 0);
});
const tierSegments = computed(() => {
  const total = tierTotal.value;
  return ['signed', 'booked', 'held'].map((key) => {
    const count = stats.value.parkings.byTier[key] || 0;
    return {
      key,
      label: key === 'held' ? `${COMMITMENT_TIERS[key].label}（視為未售）` : COMMITMENT_TIERS[key].label,
      color: COMMITMENT_TIERS[key].color,
      count,
      pct: total > 0 ? (count / total) * 100 : 0,
    };
  });
});

const gapLevel = (gap) => (gap > 0 ? 'danger' : 'ok');
const fmtRatio = (v) => (v === null || v === undefined || !Number.isFinite(v)) ? '-' : v.toFixed(2);
</script>

<style scoped>
.overview-strip {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 0;
  padding: 8px 4px;
  border-radius: 12px;
  background: #eceff1;
  border: 1px solid #cfd8dc;
}
/* 每格依內容自然寬度排列、放不下就換行；不再用等寬欄位硬擠，避免文字重疊 */
.overview-item {
  flex: 1 1 auto;
  min-width: 0;
  padding: 2px 14px;
  border-right: 1px solid #cfd8dc;
}
.overview-item:last-child { border-right: 0; }
@media (max-width: 600px) {
  .overview-item {
    flex: 1 1 calc(50% - 1px);
    max-width: 50%;
  }
  .overview-item:nth-child(2n) { border-right: 0; }
}
.overview-item__label {
  display: flex;
  align-items: center;
  font-size: 0.75rem;
  color: #607d8b;
  white-space: nowrap;
}
.overview-item__value {
  font-size: 1.25rem;
  font-weight: 700;
  color: #263238;
  line-height: 1.3;
  white-space: nowrap;
}
.overview-item__unit {
  font-size: 0.75rem;
  font-weight: 500;
  color: #78909c;
  margin-left: 2px;
}
.overview-item__sub {
  font-size: 0.7rem;
  color: #78909c;
  line-height: 1.3;
  word-break: keep-all;
  overflow-wrap: anywhere;
}
.ratio-options {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px 24px;
}
.ratio-options__ppu {
  max-width: 180px;
}
.ratio-tiles {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
}
.scenario-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}
@media (max-width: 600px) {
  .ratio-tiles, .scenario-grid { grid-template-columns: 1fr; }
}
.ratio-tile {
  border: 1px solid #e0e0e0;
  border-radius: 12px;
  padding: 12px 14px;
  background: #fafafa;
  min-width: 0;
}
.ratio-tile__title {
  display: flex;
  align-items: center;
  font-size: 0.85rem;
  color: #616161;
  margin-bottom: 4px;
}
.ratio-tile__main {
  font-size: 1.8rem;
  font-weight: 700;
  line-height: 1.2;
  color: #263238;
}
.ratio-tile__unit {
  font-size: 0.85rem;
  font-weight: 500;
  color: #757575;
  margin-left: 4px;
}
.ratio-tile__sub {
  font-size: 0.8rem;
  color: #757575;
  margin-top: 4px;
}
.tier-bar {
  display: flex;
  height: 12px;
  border-radius: 6px;
  overflow: hidden;
  background: #eeeeee;
}
.tier-bar__seg { height: 100%; }
.tier-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  align-items: center;
}
.scenario {
  border-radius: 12px;
  padding: 12px 14px;
  border: 1px solid #e0e0e0;
  background: #f5f5f5;
}
.scenario--main { box-shadow: inset 0 0 0 1px rgba(0,0,0,0.06); }
.scenario--danger { background: #ffebee; border-color: #ef9a9a; }
.scenario--ok { background: #e8f5e9; border-color: #a5d6a7; }
.scenario__title {
  font-size: 0.85rem;
  font-weight: 600;
  color: #455a64;
  margin-bottom: 6px;
}
.scenario__row {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  font-size: 0.9rem;
  color: #37474f;
  padding: 2px 0;
}
.scenario__result { font-size: 1rem; }
.ratio-table :deep(th) { white-space: nowrap; }
.held-row { cursor: pointer; }
.held-row:hover { background: #f5f5f5; }
.held-row--overdue td:first-child { border-left: 3px solid #c62828; }
.held-note {
  max-width: 180px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.ratio-notes { display: flex; flex-direction: column; gap: 6px; }
.ratio-note {
  display: flex;
  align-items: flex-start;
  font-size: 0.82rem;
  color: #455a64;
  line-height: 1.5;
}
</style>
