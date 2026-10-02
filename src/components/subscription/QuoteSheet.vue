<template>
  <div ref="root" class="quote-sheet">
    <header class="qs-header">
      <div>
        <div class="qs-company">{{ quote.company?.name }}</div>
        <div class="qs-company-en">{{ quote.company?.nameEn }}</div>
      </div>
      <div class="qs-title-block">
        <div class="qs-title">報 價 單</div>
        <div class="qs-date">Date: {{ slashDate(quote.date) }}</div>
        <div v-if="validUntil" class="qs-date">有效期限: {{ slashDate(validUntil) }}</div>
      </div>
    </header>
    <div class="qs-rule-thick"></div>

    <section class="qs-parties">
      <div class="qs-party">
        <div class="qs-label">BILL TO 買受人資訊</div>
        <div class="qs-billto-name">{{ quote.billTo?.name || '—' }}</div>
        <div class="qs-row"><span>統編：</span><span>{{ quote.billTo?.taxId || '-' }}</span></div>
        <div class="qs-row"><span>聯絡人：</span><span>{{ quote.billTo?.contactName || '-' }}</span></div>
        <div class="qs-row"><span>電話：</span><span>{{ quote.billTo?.phone || '-' }}</span></div>
      </div>
      <div class="qs-party">
        <div class="qs-label">FROM 單位資訊</div>
        <div class="qs-row"><span>聯絡人：</span><span>{{ quote.from?.contactName || '-' }}</span></div>
        <div class="qs-row"><span>電話：</span><span>{{ quote.from?.phone || '-' }}</span></div>
        <div class="qs-row"><span>統編：</span><span>{{ quote.from?.taxId || '-' }}</span></div>
      </div>
    </section>

    <section class="qs-items">
      <div class="qs-items-head">
        <span>項目說明 ITEM DESCRIPTION</span>
        <span>金額 AMOUNT</span>
      </div>
      <div v-for="(item, i) in quote.items" :key="i" class="qs-item">
        <div class="qs-item-text">
          <div class="qs-item-name">{{ item.name }}</div>
          <div v-if="item.desc" class="qs-item-desc">{{ item.desc }}</div>
        </div>
        <div class="qs-item-amount">{{ money(item.amount) }}</div>
      </div>
    </section>
    <div class="qs-rule-mid"></div>

    <section class="qs-totals">
      <div class="qs-total-row"><span>小計 Subtotal</span><span>{{ money(totals.subtotal) }}</span></div>
      <div class="qs-total-row qs-tax"><span>營業稅 Tax ({{ taxPercent }}%)</span><span>{{ money(totals.tax) }}</span></div>
      <div class="qs-total-row qs-grand" :class="{ 'is-struck': totals.discounted > 0 }">
        <span class="qs-strike">總計 Grand Total</span><span class="qs-strike">{{ money(totals.total) }}</span>
      </div>
      <div v-if="totals.discounted > 0" class="qs-discount">
        優惠價 Discounted {{ money(totals.discounted) }}
      </div>
    </section>

    <section v-if="quote.notes" class="qs-notes">
      <div class="qs-label">NOTES 備註說明</div>
      <div class="qs-notes-text">{{ quote.notes }}</div>
    </section>

    <div class="qs-spacer"></div>

    <footer class="qs-footer">
      <div class="qs-seals">
        <img
          v-for="(seal, i) in seals"
          :key="seal.url || i"
          :src="seal.url"
          crossorigin="anonymous"
          alt=""
        />
      </div>
      <div class="qs-sign">
        <span>客戶簽名:</span>
      </div>
    </footer>

    <!-- 插入的圖片：疊在最上層，座標以 A4 (794px) 為基準 -->
    <div class="qs-images" :class="{ 'is-editable': editable }" @pointerdown.self="selectedId = null">
      <div
        v-for="img in images"
        :key="img.id"
        class="qs-image"
        :class="{ 'is-selected': editable && selectedId === img.id }"
        :style="imageStyle(img)"
        @pointerdown.stop="editable && startDrag($event, img, 'move')"
      >
        <img :src="img.url" crossorigin="anonymous" alt="" draggable="false" />
        <template v-if="editable && selectedId === img.id">
          <span
            v-for="c in CORNERS"
            :key="c"
            class="qs-handle"
            :class="`is-${c}`"
            :style="handleStyle"
            @pointerdown.stop="startDrag($event, img, 'resize')"
          ></span>
          <span class="qs-rotate-line" :style="rotateLineStyle"></span>
          <span class="qs-handle qs-rotate" :style="rotateHandleStyle" @pointerdown.stop="startDrag($event, img, 'rotate')"></span>
          <button
            type="button"
            class="qs-image-delete"
            :style="deleteStyle"
            title="移除"
            @pointerdown.stop
            @click.stop="removeImage(img.id)"
          ><i class="mdi mdi-delete-outline"></i></button>
        </template>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue';
import { quoteTotals, addDays } from '@/utils/subscriptionPipeline';

const props = defineProps({
  quote: { type: Object, required: true },
  seals: { type: Array, default: () => [] },
  editable: { type: Boolean, default: false },  // 預覽上可拖曳圖片
  uiScale: { type: Number, default: 1 },        // 預覽縮放比例，讓控制點維持固定螢幕大小
});
const emit = defineEmits(['update:images']);

const totals = computed(() => quoteTotals(props.quote));
const taxPercent = computed(() => Math.round((props.quote.taxRate ?? 0.05) * 100));
const validUntil = computed(() => {
  const days = Number(props.quote.validDays) || 0;
  return days > 0 && props.quote.date ? addDays(props.quote.date, days) : '';
});

function slashDate(s) {
  return (s || '').replace(/-/g, '/');
}

function money(n) {
  return `$${(Number(n) || 0).toLocaleString()}`;
}

// --- 圖片：移動 / 等比縮放 (以中心為基準) / 旋轉 ---
const CORNERS = ['nw', 'ne', 'sw', 'se'];
const root = ref(null);
const selectedId = ref(null);
const images = computed(() => props.quote.images || []);
const px = (n) => `${n / props.uiScale}px`;
const handleStyle = computed(() => ({ width: px(12), height: px(12), margin: px(-6), borderWidth: px(1.5) }));
const rotateHandleStyle = computed(() => ({ ...handleStyle.value, top: px(-34), left: '50%', borderRadius: '50%' }));
const rotateLineStyle = computed(() => ({ top: px(-28), height: px(28), width: px(1.5) }));
const deleteStyle = computed(() => ({ width: px(28), height: px(28), top: px(-36), right: px(-36), fontSize: px(17) }));

function imageStyle(img) {
  return {
    left: `${img.x}px`,
    top: `${img.y}px`,
    width: `${img.w}px`,
    height: `${img.h}px`,
    transform: img.rotate ? `rotate(${img.rotate}deg)` : undefined,
    outlineWidth: px(1.5),
  };
}

let drag = null;
const round1 = (n) => Math.round(n * 10) / 10;

function sheetPoint(e) {
  const rect = root.value.getBoundingClientRect();
  const k = rect.width / 794;
  return { x: (e.clientX - rect.left) / k, y: (e.clientY - rect.top) / k };
}

function startDrag(e, img, mode) {
  e.preventDefault();
  selectedId.value = img.id;
  const p = sheetPoint(e);
  const cx = img.x + img.w / 2;
  const cy = img.y + img.h / 2;
  drag = { mode, id: img.id, start: p, orig: { ...img }, cx, cy, startDist: Math.hypot(p.x - cx, p.y - cy) || 1 };
  window.addEventListener('pointermove', onMove);
  window.addEventListener('pointerup', endDrag, { once: true });
}

function onMove(e) {
  if (!drag) return;
  const p = sheetPoint(e);
  const o = drag.orig;
  let patch;
  if (drag.mode === 'move') {
    patch = { x: round1(o.x + p.x - drag.start.x), y: round1(o.y + p.y - drag.start.y) };
  } else if (drag.mode === 'resize') {
    const minRatio = 16 / Math.min(o.w, o.h);
    const ratio = Math.max(minRatio, Math.hypot(p.x - drag.cx, p.y - drag.cy) / drag.startDist);
    const w = o.w * ratio;
    const h = o.h * ratio;
    patch = { w: round1(w), h: round1(h), x: round1(drag.cx - w / 2), y: round1(drag.cy - h / 2) };
  } else {
    let deg = Math.atan2(p.y - drag.cy, p.x - drag.cx) * 180 / Math.PI + 90;
    deg = ((deg % 360) + 360) % 360;
    const snap = Math.round(deg / 15) * 15;
    if (Math.abs(deg - snap) < 3) deg = snap % 360;
    patch = { rotate: round1(deg) };
  }
  emit('update:images', images.value.map(i => (i.id === drag.id ? { ...i, ...patch } : i)));
}

function endDrag() {
  drag = null;
  window.removeEventListener('pointermove', onMove);
}

function removeImage(id) {
  selectedId.value = null;
  emit('update:images', images.value.filter(i => i.id !== id));
}

function onKeydown(e) {
  if (!props.editable || !selectedId.value) return;
  if (e.key !== 'Delete' && e.key !== 'Backspace') return;
  if (/^(INPUT|TEXTAREA|SELECT)$/.test(e.target?.tagName) || e.target?.isContentEditable) return;
  e.preventDefault();
  removeImage(selectedId.value);
}

// 插入後由編輯器指定選取
function select(id) {
  selectedId.value = id;
}
defineExpose({ select });

onMounted(() => {
  if (props.editable) window.addEventListener('keydown', onKeydown);
});
onBeforeUnmount(() => {
  window.removeEventListener('keydown', onKeydown);
  endDrag();
});
</script>

<style scoped>
.quote-sheet {
  position: relative;
  width: 794px;
  min-height: 1123px;
  box-sizing: border-box;
  padding: 58px 76px 52px;
  background: #ffffff;
  color: #111827;
  font-family: 'Noto Sans TC', 'PingFang TC', 'Microsoft JhengHei', 'Helvetica Neue', Arial, sans-serif;
  display: flex;
  flex-direction: column;
  text-align: left;
}
.qs-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
}
.qs-company {
  font-size: 30px;
  font-weight: 900;
  letter-spacing: 1px;
  line-height: 1.2;
}
.qs-company-en {
  margin-top: 6px;
  font-size: 13px;
  color: #6b7280;
  letter-spacing: 0.8px;
}
.qs-title-block {
  text-align: right;
}
.qs-title {
  font-size: 24px;
  font-weight: 900;
  letter-spacing: 0.35em;
  margin-right: -0.35em;
}
.qs-date {
  margin-top: 6px;
  font-size: 10px;
  color: #9ca3af;
}
.qs-rule-thick {
  margin-top: 28px;
  height: 4px;
  background: #111827;
}
.qs-parties {
  display: flex;
  gap: 48px;
  margin-top: 34px;
}
.qs-party {
  flex: 1;
}
.qs-label {
  font-size: 9.5px;
  font-weight: 700;
  letter-spacing: 1.5px;
  color: #6b7280;
  padding-bottom: 8px;
  border-bottom: 1px solid #e5e7eb;
  margin-bottom: 12px;
}
.qs-billto-name {
  font-size: 17px;
  font-weight: 900;
  margin-bottom: 8px;
}
.qs-row {
  display: flex;
  font-size: 13px;
  line-height: 1.6;
  color: #374151;
}
.qs-row span:first-child {
  width: 68px;
  flex-shrink: 0;
}
.qs-items {
  margin-top: 40px;
}
.qs-items-head {
  display: flex;
  justify-content: space-between;
  background: #111827;
  color: #ffffff;
  font-size: 10.5px;
  font-weight: 700;
  letter-spacing: 1px;
  padding: 13px 16px;
}
.qs-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 24px;
  padding: 18px 16px;
  border-bottom: 1px solid #eef0f3;
}
.qs-item-name {
  font-size: 15px;
  font-weight: 900;
}
.qs-item-desc {
  margin-top: 4px;
  font-size: 9.5px;
  color: #9ca3af;
}
.qs-item-amount {
  font-family: 'JetBrains Mono', 'SFMono-Regular', Menlo, Consolas, monospace;
  font-size: 13.5px;
  font-weight: 700;
  white-space: nowrap;
}
.qs-rule-mid {
  margin-top: 32px;
  height: 2px;
  background: #111827;
}
.qs-totals {
  align-self: flex-end;
  width: 262px;
  margin-top: 18px;
}
.qs-total-row {
  display: flex;
  justify-content: space-between;
  font-size: 14px;
  color: #4b5563;
  line-height: 2;
}
.qs-tax {
  border-bottom: 1px solid #e5e7eb;
  padding-bottom: 4px;
}
.qs-grand {
  margin-top: 6px;
  font-weight: 700;
  color: #111827;
}
/* 刪除線以元素繪製：html2canvas 不支援 text-decoration: line-through */
.qs-grand.is-struck {
  color: #9ca3af;
}
.qs-grand.is-struck .qs-strike {
  position: relative;
}
.qs-grand.is-struck .qs-strike::after {
  content: '';
  position: absolute;
  left: 0;
  right: 0;
  top: 52%;
  border-top: 1.5px solid #9ca3af;
}
.qs-discount {
  margin-top: 8px;
  text-align: right;
  font-size: 20px;
  font-weight: 900;
  color: #dc2626;
  white-space: nowrap;
}
.qs-notes {
  margin-top: 44px;
}
.qs-notes-text {
  white-space: pre-line;
  font-size: 12px;
  line-height: 1.75;
  color: #374151;
}
.qs-spacer {
  flex: 1;
  min-height: 32px;
}
.qs-footer {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}
.qs-seals {
  display: flex;
  align-items: center;
  gap: 16px;
  min-height: 112px;
  padding-left: 20px;
}
.qs-seals img {
  max-height: 116px;
  max-width: 130px;
  object-fit: contain;
}
.qs-sign {
  width: 262px;
  margin-top: 28px;
  font-size: 12px;
  font-weight: 700;
  padding-bottom: 4px;
  border-bottom: 1px solid #6b7280;
}
.qs-images {
  position: absolute;
  inset: 0;
  overflow: hidden;
  pointer-events: none;
}
.qs-images.is-editable {
  overflow: visible;
  pointer-events: auto;
}
.qs-image {
  position: absolute;
  touch-action: none;
}
.qs-image img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: fill;
  user-select: none;
  -webkit-user-drag: none;
}
.qs-images.is-editable .qs-image {
  cursor: move;
}
.qs-image.is-selected {
  outline: solid #1e88e5;
}
.qs-handle {
  position: absolute;
  box-sizing: border-box;
  background: #ffffff;
  border: solid #1e88e5;
  border-radius: 2px;
  touch-action: none;
}
.qs-handle.is-nw { top: 0; left: 0; cursor: nwse-resize; }
.qs-handle.is-ne { top: 0; right: 0; cursor: nesw-resize; }
.qs-handle.is-sw { bottom: 0; left: 0; cursor: nesw-resize; }
.qs-handle.is-se { bottom: 0; right: 0; cursor: nwse-resize; }
.qs-handle.qs-rotate {
  cursor: grab;
}
.qs-rotate-line {
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  background: #1e88e5;
}
.qs-image-delete {
  position: absolute;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: #e53935;
  color: #ffffff;
  border: 0;
  cursor: pointer;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.3);
}
</style>
