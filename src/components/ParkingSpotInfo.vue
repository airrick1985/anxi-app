<template>
  <div class="psi">
    <template v-if="isSales">
      <!-- 狀態 -->
      <section class="psi-section">
        <h4 class="psi-title">狀態</h4>
        <div class="psi-grid psi-grid--2">
          <div v-for="c in statusCells" :key="c.label" class="psi-cell">
            <span class="psi-label">{{ c.label }}</span>
            <span class="psi-value" :class="{ 'is-empty': !c.value }">{{ c.value || '—' }}</span>
          </div>
        </div>
      </section>

      <!-- 保留資訊：暫時保留層級才顯示 -->
      <section v-if="hold" class="psi-section">
        <h4 class="psi-title">
          保留資訊
          <span class="psi-badge" :class="`psi-badge--${deadline.tone}`">{{ deadline.label }}</span>
        </h4>
        <div class="psi-grid psi-grid--2 psi-grid--hold" :class="{ 'is-overdue': hold.overdue }">
          <div v-for="c in holdCells" :key="c.label" class="psi-cell" :class="{ 'psi-cell--wide': c.wide }">
            <span class="psi-label">{{ c.label }}</span>
            <span class="psi-value" :class="{ 'is-empty': !c.value, 'is-danger': c.danger }">{{ c.value || c.empty || '—' }}</span>
          </div>
        </div>
      </section>
    </template>

    <!-- 價格 -->
    <section class="psi-section">
      <h4 class="psi-title">價格資訊</h4>
      <div v-if="isSales" class="psi-prices">
        <div v-for="p in prices" :key="p.label" class="psi-price" :class="[`psi-price--${p.tone}`, { 'is-empty': !p.value }]">
          <span class="psi-label">{{ p.label }}</span>
          <span class="psi-price-value">
            <template v-if="p.value">{{ p.value }}<small>萬</small></template>
            <template v-else>—</template>
          </span>
        </div>
      </div>
      <div v-else-if="isQuoteSold" class="psi-quote" :class="parking.status === '來賓車位' ? 'psi-quote--guest' : 'psi-quote--sold'">{{ parking.status }}</div>
      <div v-else class="psi-prices psi-prices--single">
        <div class="psi-price psi-price--list" :class="{ 'is-empty': !money(parking.price_list) }">
          <span class="psi-label">車位價格</span>
          <span class="psi-price-value">
            <template v-if="money(parking.price_list)">{{ money(parking.price_list) }}<small>萬</small></template>
            <template v-else>未設定</template>
          </span>
        </div>
      </div>
    </section>

    <template v-if="isSales">
      <!-- 備註 -->
      <section class="psi-section">
        <h4 class="psi-title">備註</h4>
        <div class="psi-remark" :class="{ 'is-empty': !text(parking.remarks) }">{{ text(parking.remarks) || '—' }}</div>
      </section>

      <!-- 銷控資訊：車位文件欄位一律顯示；電話、戶別狀態、日期取自關聯戶別 -->
      <section class="psi-section">
        <h4 class="psi-title">
          銷控資訊
          <span v-if="householdLoading" class="psi-title-hint">讀取戶別資料…</span>
        </h4>
        <div class="psi-grid psi-grid--2">
          <div v-for="c in salesCells" :key="c.label" class="psi-cell" :class="{ 'psi-cell--wide': c.wide }">
            <span class="psi-label">{{ c.label }}</span>
            <a v-if="c.value && c.href" class="psi-value psi-link" :href="c.href">{{ c.value }}</a>
            <span v-else class="psi-value" :class="{ 'is-empty': !c.value, 'is-accent': c.accent }">{{ c.value || '—' }}</span>
          </div>
        </div>
        <div v-if="timeline.length" class="psi-steps">
          <div v-for="s in timeline" :key="s.key" class="psi-step" :class="{ 'is-done': s.date }">
            <span class="psi-step-label"><i></i>{{ s.label }}</span>
            <span class="psi-step-date">{{ s.date || '未填' }}</span>
          </div>
        </div>
      </section>
    </template>

    <!-- 基本資料 -->
    <section class="psi-section">
      <h4 class="psi-title">基本資料</h4>
      <div class="psi-grid">
        <div v-for="c in specCells" :key="c.label" class="psi-cell">
          <span class="psi-label">{{ c.label }}</span>
          <span class="psi-value" :class="{ 'is-empty': !c.value }">{{ c.value || '—' }}</span>
        </div>
      </div>
    </section>

    <div v-if="isSales && updatedText" class="psi-updated">最後更新 {{ updatedText }}</div>
  </div>
</template>

<script setup>
// 車位資訊卡內容（車位銷控畫布點選車位後顯示）
// 區塊順序與欄位需與 ParkingSpotEditDialog 一致：編輯視窗新增欄位時，這裡要一併補上。
import { computed } from 'vue';
import { formatSalespersons } from '@/utils/salespersonUtils';
import { holdDeadline } from '@/utils/parkingSpotCard';

const props = defineProps({
  parking: { type: Object, required: true },
  contextMode: { type: String, default: 'sales' },
  // buildHeldEntry 結果；非「暫時保留」層級為 null
  hold: { type: Object, default: null },
  // 購買戶別的戶別文件
  household: { type: Object, default: null },
  householdLoading: { type: Boolean, default: false },
  // [{ key, label, date }]
  timeline: { type: Array, default: () => [] },
  updatedText: { type: String, default: '' },
});

const text = (v) => (v === undefined || v === null ? '' : String(v).trim());
const money = (v) => {
  if (!text(v) || Number(v) === 0) return '';
  const n = Number(v);
  return Number.isFinite(n) ? n.toLocaleString('zh-TW', { maximumFractionDigits: 4 }) : text(v);
};
const withUnit = (v, unit) => (text(v) && Number(v) !== 0 ? `${text(v)} ${unit}` : '');

const isSales = computed(() => props.contextMode === 'sales');
const isQuoteSold = computed(() => ['已售', '來賓車位'].includes(props.parking.status));

const statusCells = computed(() => [
  { label: '後台狀態', value: text(props.parking.status_backend) },
  { label: '報價系統狀態', value: text(props.parking.status) },
]);

const prices = computed(() => [
  { label: '表價', value: money(props.parking.price_list), tone: 'list' },
  { label: '底價', value: money(props.parking.price_floor), tone: 'floor' },
  { label: '成交價', value: money(props.parking.price_transaction), tone: 'deal' },
]);

const specCells = computed(() => {
  const p = props.parking;
  return [
    { label: '類型', value: text(p.type) },
    { label: '形式', value: text(p.type2) },
    { label: '尺寸', value: text(p.size) },
    { label: '面積（m²）', value: withUnit(p.area, 'm²') },
    { label: '面積（坪）', value: withUnit(p.area_ping, '坪') },
    { label: '樓層／編號', value: [text(p.floor), text(p.spotId) || text(p.number)].filter(Boolean).join('／') },
  ];
});

const salesCells = computed(() => {
  const p = props.parking;
  const h = props.household;
  const cells = [
    { label: '購買戶別', value: text(p.buyerUnitId), accent: true },
    { label: '買方姓名', value: text(p.buyerName) || text(h?.buyerName) },
    { label: '銷售人員', value: formatSalespersons(p.salesperson, '、', '') || formatSalespersons(h?.salesperson, '、', ''), wide: true },
  ];
  if (text(h?.buyerPhone)) cells.push({ label: '買方電話', value: text(h.buyerPhone), href: `tel:${text(h.buyerPhone)}` });
  if (text(h?.status_backend)) cells.push({ label: '戶別狀態', value: text(h.status_backend) });
  return cells;
});

const deadline = computed(() => holdDeadline(props.hold?.reservedUntil));

const holdCells = computed(() => {
  const h = props.hold;
  if (!h) return [];
  return [
    { label: '保留人／保留客戶', value: text(h.reservedBy), wide: true },
    { label: '保留到期', value: text(h.reservedUntil), empty: '未設定', danger: h.overdue },
    { label: '已保留', value: h.daysHeld !== null ? `${h.daysHeld} 天` : '' },
    { label: '保留備註', value: text(h.reservedNote), wide: true },
  ];
});
</script>

<style scoped src="../styles/parkingSpotCard.css"></style>
