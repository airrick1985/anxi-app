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

      <v-card-actions class="pa-3">
        <v-spacer></v-spacer>
        <v-btn variant="text" @click="show = false">取消</v-btn>
        <v-btn
          color="teal-darken-1"
          variant="flat"
          prepend-icon="mdi-printer"
          :disabled="selectedIds.length === 0"
          @click="handlePrint"
        >
          列印 ({{ selectedIds.length }})
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import { useToast } from 'vue-toastification';
import { useQuoteStore } from '@/store/quoteStore';
import { fetchQuoteRemark } from '@/api';

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

const show = computed({
  get: () => props.modelValue,
  set: (v) => emit('update:modelValue', v),
});

// --- 列印選項 ---
const optShowNegotiation = ref(true); // 顯示議價資訊（原價/優惠額），預設開啟
const optShowNotes = ref(true);        // 列印期款說明（applyNote）
const optQuoteDate = ref('');          // 報價日期（可自訂）
const optValidUntil = ref('');         // 有效期限（選填）

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
  optQuoteDate.value = isoTodayTW();
  optValidUntil.value = '';
  isRemarkExpanded.value = false;
  loadRemark();
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

// --- 單一戶別 → 一頁 A4 ---
function renderSheet(item, pageIndex, pageTotal) {
  const id = item.internalId;
  const ud = item.unitDetails || {};
  const type = ud.propertyType || ud.layout || '-';
  const area = ud.area_house_ping;

  // 詳細面積資訊：獨立橫列（每項目一小欄：上標籤、下數值）
  const areaDetailItems = [
    ['主建物(室內)', ud.area_main_ping, '坪'],
    ['附屬建物(陽台)', ud.area_ancillary_ping, '坪'],
    ['共用部分(公設)', ud.area_common_ping, '坪'],
    ['露臺(不計坪)', ud.area_terrace_ping, '坪'],
  ]
    .filter(([, v]) => v !== null && v !== undefined && v !== '')
    .map(([label, v, unit]) => ({ label, text: `${fmt(v, 2)} ${unit}` }));
  const ratio = parseFloat(ud.common_area_ratio);
  if (!isNaN(ratio)) {
    areaDetailItems.push({ label: '公設比', text: `${(ratio * 100).toFixed(2)} %` });
  }
  const areaStrip = areaDetailItems.length ? `
    <section class="wide-strip">
      <span class="lbl">詳細面積</span>
      ${areaDetailItems.map(it => `
      <span class="strip-item"><em>${esc(it.label)}</em><b>${esc(it.text)}</b></span>`).join('')}
    </section>` : '';

  const housePrice = quoteStore.getRawDisplayHousePrice(id);
  const unitPrice = quoteStore.getDisplayUnitPrice(id);
  const usePackage = !!item.usePackageDeal;
  const packagePrice = quoteStore.getPackagePrice(id);
  const total = quoteStore.getFinalTotalPrice(id);
  const pay = item.printPaymentData || {};

  // ✅ [選項] 議價資訊：原價（刪除線）＋已優惠金額（僅非配套且確有調價時）；總價與單價都呈現
  let housePriceVal = `${fmt(housePrice)} 萬`;
  let unitPriceVal = `${fmt(unitPrice, 2)} 萬/坪`;
  if (optShowNegotiation.value && !usePackage) {
    const orig = Number(item.negotiationState?.originalPrice);
    const cur = Number(ud.price_list_house_total) || 0;
    if (!isNaN(orig) && orig > 0 && orig !== cur) {
      const delta = orig - cur;
      housePriceVal += delta > 0
        ? `<span class="orig-price">${fmt(orig)}萬</span><span class="disc">已優惠 ${fmt(delta)}萬</span>`
        : `<span class="orig-price">${fmt(orig)}萬</span><span class="disc up">調整 +${fmt(-delta)}萬</span>`;

      // 單價的優惠資訊：以原價/現價除以面積換算
      const areaNum = Number(area);
      if (areaNum > 0) {
        const origUnit = orig / areaNum;
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
  const parkingStrip = useParkingStrip ? `
    <section class="wide-strip">
      <span class="lbl">車位明細</span>
      ${parkingList.map(p => {
        const price = Number(p.price_list) || 0;
        return `
      <span class="strip-item"><em>${esc(p['車位編號'])}</em><b>${price > 0 ? `${fmt(price)} 萬` : '—'}</b></span>`;
      }).join('')}
    </section>` : '';

  // 配套未勾選時不渲染「配套／配套價」欄位
  const infoCells = [
    ['戶別', `<b>${esc(item.unitId)}</b>`],
    ['物件類型', esc(type)],
    ['面積', `${fmt(area, 2)} 坪`],
    ['首購', item.isFirstTimeBuyer === '是' ? '首購' : '非首購'],
    ['房屋總價', housePriceVal],
    ['房屋單價', unitPriceVal],
    ['車位', parkingCellVal],
    ['車位價格', parkingPrice > 0 ? `${parkingList.length > 1 ? '合計 ' : ''}${fmt(parkingPrice)} 萬` : '—'],
    ...(usePackage ? [
      ['配套', '是'],
      ['配套價', `${fmt(packagePrice)} 萬`],
    ] : []),
  ].map(([lbl, val]) => `
      <div class="cell"><span class="lbl">${lbl}</span><span class="val">${val}</span></div>`).join('');

  // 期款版型：僅渲染前端實際採用的期款（總價期款或優付期款擇一；配套期款依前端顯示）
  const generalTitle = pay.generalIsPreferred ? '優付期款' : '總價期款';
  const generalAccent = pay.generalIsPreferred ? '#8a6d1c' : '#1a3c6e';
  const hasPackageBlock = !!pay.package;
  const bothBlocks = !!pay.general && hasPackageBlock;
  // 兩表並存時一律左右並排（頁面高度取兩者較高者，遠低於上下堆疊的相加高度）
  const payBlocks = [
    renderPayBlock(pay.general, generalAccent, generalTitle, '總價', total, !hasPackageBlock),
    renderPayBlock(pay.package, '#2e7d32', '配套期款', '配套金額', packagePrice, !pay.general),
  ].filter(Boolean);
  const payFlexClass = bothBlocks ? 'pay-flex pair' : 'pay-flex';

  const notes = optShowNotes.value ? (pay.notes || []).filter(Boolean) : [];
  const notesHtml = notes.length ? `
      <div class="notes">
        <div class="notes-title">期款說明</div>
        <ol>${notes.map(n => `<li>${esc(n)}</li>`).join('')}</ol>
      </div>` : '';

  // 報價單備註（銷控權限用戶編輯的富文本，渲染於最下方、頁尾之上）
  const remarkBlock = remarkHtml.value ? `
      <div class="remark">
        <div class="remark-title">備註</div>
        <div class="remark-body">${remarkHtml.value}</div>
      </div>` : '';

  const validText = optValidUntil.value ? `　有效期限至：${fmtDate(optValidUntil.value)}` : '';

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

    <div class="sec-title">付款方式</div>
    <div class="${payFlexClass}">
      ${payBlocks.length ? payBlocks.join('') : '<div class="no-pay">尚無適用的期款資料，請確認期款範本設定。</div>'}
    </div>
    ${notesHtml}
    ${remarkBlock}

    <footer class="foot">
      <div class="foot-person">銷售顧問：<b>${esc(props.personnelName || '—')}</b>　聯絡電話：<b>${esc(props.personnelPhone || '—')}</b></div>
      <div class="foot-meta">第 ${pageIndex + 1} 頁／共 ${pageTotal} 頁</div>
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
    margin: 5mm auto; padding: 12mm 14mm;
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
  .head .proj { font-size: 17pt; font-weight: 700; letter-spacing: 1px; }
  .head .sub { font-size: 9pt; opacity: .85; margin-top: 1.5mm; }
  .head .doc-title { font-size: 13.5pt; font-weight: 700; letter-spacing: 5px; margin-right: -5px; }
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
    font-size: 9.5pt; padding: 2.6mm 3mm; flex-shrink: 0;
  }
  .val { flex: 1; padding: 2.6mm 3mm; font-size: 10.5pt; }
  .val b { font-size: 11.5pt; color: #1a3c6e; }
  .val .pk-price { font-size: 8.5pt; color: #78909c; }
  .val .orig-price { text-decoration: line-through; color: #90a4ae; font-size: 8.5pt; margin-left: 1.5mm; }
  .val .disc { color: #2e7d32; font-size: 8.5pt; font-weight: 700; margin-left: 1mm; }
  .val .disc.up { color: #c62828; }
  .wide-strip {
    display: flex; align-items: stretch;
    border: 1px solid #cfd8dc; border-radius: 1.5mm; overflow: hidden;
    margin-top: 1.5mm;
  }
  .wide-strip .lbl {
    width: 25mm; flex-shrink: 0; display: flex; align-items: center;
    background: #f4f7fa; color: #546e7a; font-size: 9.5pt; padding: 2.6mm 3mm;
  }
  .strip-item {
    flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center;
    padding: 1.8mm 1mm; text-align: center;
  }
  .strip-item + .strip-item { border-left: 1px solid #eceff1; }
  .strip-item em { font-style: normal; font-size: 8pt; color: #78909c; white-space: nowrap; }
  .strip-item b { font-size: 10pt; color: #263238; margin-top: .6mm; font-weight: 600; white-space: nowrap; }
  .total-band {
    display: flex; justify-content: space-between; align-items: center;
    background: #eef4fb; border: 1px solid #b4cdec; border-radius: 1.5mm;
    margin-top: 4mm; padding: 3mm 6mm;
  }
  .total-band .t-label { font-size: 12pt; font-weight: 700; color: #1a3c6e; letter-spacing: 4px; margin-right: -4px; }
  .total-band .tvals { display: flex; align-items: baseline; gap: 3mm; }
  .total-band .tvals > b { font-size: 17pt; color: #c62828; }
  .total-band .tvals > b i { font-style: normal; font-size: 10pt; }
  .total-band .pkg-extra { font-size: 10.5pt; font-weight: 700; color: #2e7d32; white-space: nowrap; }
  .total-band .pkg-extra b { font-size: 13pt; }
  .total-band .pkg-extra small { font-size: 8pt; font-weight: 400; color: #607d8b; }
  .sec-title {
    margin-top: 6mm; margin-bottom: 3mm;
    font-size: 11.5pt; font-weight: 700; color: #1a3c6e;
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
  .pay-flex.pair .prow { font-size: 9.5pt; }
  .pay-flex.pair .prow.child { font-size: 8.5pt; }
  .pay-head {
    display: flex; justify-content: space-between; align-items: baseline; gap: 2mm;
    padding: 2.4mm 3.5mm; color: #fff; font-size: 10.5pt; font-weight: 700;
  }
  .pay-head small { font-weight: 400; font-size: 8.5pt; opacity: .92; text-align: right; }
  .pay-rows { padding: 1mm 3.5mm 2mm; }
  .prow { display: flex; align-items: baseline; padding: 1.7mm 0; border-bottom: 1px dashed #e0e6ea; font-size: 10pt; }
  .pgroup:last-child .prow:last-child { border-bottom: none; }
  .prow:not(.child) .pname { font-weight: 600; }
  .prow.child { font-size: 9pt; }
  .prow.child .pname { padding-left: 5mm; color: #78909c; }
  .prow .hint { font-size: 8pt; color: #78909c; margin-left: 1.5mm; }
  .prow .lead { flex: 1; border-bottom: 1px dotted #b0bec5; margin: 0 2mm; transform: translateY(-1mm); }
  .prow .pval { font-weight: 700; color: #263238; white-space: nowrap; }
  .prow .pval i { font-style: normal; font-size: 8pt; color: #78909c; margin-left: .5mm; }
  .prow.child .pval { font-weight: 400; font-style: italic; color: #90a4ae; font-size: 8.5pt; }
  .child-note { padding: 0 3.5mm 2mm; font-size: 7.5pt; color: #90a4ae; }
  .ptotal {
    display: flex; justify-content: space-between;
    padding: 2.2mm 3.5mm; border-top: 1px solid #cfd8dc;
    background: #fafbfc; font-weight: 700; font-size: 10.5pt;
  }
  .no-pay { width: 100%; text-align: center; color: #b71c1c; font-size: 10pt; padding: 6mm 0; }
  .notes { margin-top: 5mm; background: #fffdf3; border: 1px solid #efe6c1; border-radius: 1.5mm; padding: 3mm 4mm; }
  .notes-title { font-size: 9.5pt; font-weight: 700; color: #8a6d1c; margin-bottom: 1.5mm; }
  .notes ol { padding-left: 5mm; }
  .notes li { font-size: 9pt; color: #5d4f1e; line-height: 1.7; }
  .remark { margin-top: 5mm; border: 1px solid #cfd8dc; border-radius: 1.5mm; overflow: hidden; }
  .remark-title {
    background: #eceff1; color: #37474f;
    font-size: 9.5pt; font-weight: 700; padding: 2mm 4mm;
  }
  .remark-body { padding: 2.5mm 4mm; font-size: 9.5pt; line-height: 1.8; color: #37474f; }
  .remark-body ul, .remark-body ol { padding-left: 6mm; }
  .foot {
    margin-top: auto; padding-top: 3mm; border-top: 1px solid #cfd8dc;
    display: flex; justify-content: space-between; align-items: baseline;
    font-size: 8.5pt; color: #78909c;
  }
  .foot .foot-person { font-size: 11pt; color: #263238; }
  .foot .foot-person b { font-weight: 700; color: #1a3c6e; }
  .foot .foot-meta { white-space: nowrap; }

  /* ✅ 階梯式壓縮第一段：緊湊模式（間距與字級小幅收斂） */
  .sheet.compact .head { padding: 3.5mm 6mm; }
  .sheet.compact .info { margin-top: 3mm; }
  .sheet.compact .lbl { padding: 1.7mm 3mm; font-size: 9pt; }
  .sheet.compact .val { padding: 1.7mm 3mm; font-size: 9.5pt; }
  .sheet.compact .strip-item { padding: 1.1mm 1mm; }
  .sheet.compact .total-band { margin-top: 2.5mm; padding: 2mm 5mm; }
  .sheet.compact .sec-title { margin-top: 3.5mm; margin-bottom: 2mm; }
  .sheet.compact .pay-flex { gap: 3mm; }
  .sheet.compact .pay-rows { padding: 0.5mm 3mm 1.5mm; }
  .sheet.compact .prow { padding: 0.9mm 0; font-size: 9pt; }
  .sheet.compact .prow.child { font-size: 8.5pt; }
  .sheet.compact .ptotal { padding: 1.6mm 3.5mm; font-size: 10pt; }
  .sheet.compact .notes { margin-top: 3mm; padding: 2mm 3mm; }
  .sheet.compact .notes li { font-size: 8.5pt; line-height: 1.55; }
  .sheet.compact .remark { margin-top: 3mm; }
  .sheet.compact .remark-body { padding: 2mm 4mm; font-size: 8.5pt; line-height: 1.6; }

  @page { size: A4 portrait; margin: 0; }
  @media print {
    html, body { background: #fff; }
    .sheet { margin: 0 auto; box-shadow: none; page-break-after: always; }
    .sheet:last-child { page-break-after: auto; }
  }
`;

function handlePrint() {
  const items = quoteStore.items.filter(i => selectedIds.value.includes(i.internalId));
  if (items.length === 0) return;

  const sheets = items.map((item, idx) => renderSheet(item, idx, items.length)).join('\n');
  const html = `<!DOCTYPE html>
<html lang="zh-Hant">
<head>
<meta charset="utf-8">
<title>${esc(props.projectName)} 報價單</title>
<style>${SHEET_CSS}</style>
</head>
<body>
${sheets}
<script>
// ✅ 絕對單頁排版：1) 緊湊模式先收斂間距字級 → 2) 仍超出則等比縮放到剛好一頁（不分頁）
window.onload = function () {
  document.querySelectorAll('.sheet').forEach(function (sheet) {
    var inner = sheet.querySelector('.inner');
    if (!inner) return;
    var cs = getComputedStyle(sheet);
    var avail = sheet.clientHeight - parseFloat(cs.paddingTop) - parseFloat(cs.paddingBottom);

    // 階梯 1：緊湊模式
    if (inner.scrollHeight > avail + 1) {
      sheet.classList.add('compact');
    }

    // 階梯 2：等比縮放至剛好塞滿一頁（無下限，保證絕不產生第二頁）
    var natural = inner.scrollHeight;
    if (natural > avail + 1) {
      var s = avail / natural;
      inner.style.transform = 'scale(' + s + ')';
      inner.style.width = (100 / s) + '%';
      inner.style.minHeight = (avail / s) + 'px';
    }
  });
  window.focus();
  window.print();
};
<\/script>
</body>
</html>`;

  const win = window.open('', '_blank');
  if (!win) {
    toast.error('無法開啟列印視窗，請允許彈出視窗後再試一次。');
    return;
  }
  win.document.open();
  win.document.write(html);
  win.document.close();
}
</script>

<style scoped>
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
