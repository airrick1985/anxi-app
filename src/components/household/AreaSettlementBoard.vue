<template>
  <div class="asb">
    <!-- 工具列 -->
    <div class="asb-toolbar">
      <v-text-field
        v-model="search"
        class="mac-vfield mac-vfield--search asb-search"
        variant="solo" flat density="compact" hide-details clearable
        prepend-inner-icon="mdi-magnify"
        placeholder="戶號或買方"
      ></v-text-field>
      <div class="mac-form-seg asb-filter" role="tablist" aria-label="篩選">
        <button
          v-for="f in filterOptions"
          :key="f.key"
          type="button"
          role="tab"
          class="mac-form-seg-btn"
          :class="{ 'is-active': filter === f.key }"
          :aria-selected="filter === f.key"
          @click="filter = f.key"
        >{{ f.label }}<span class="asb-seg-count">{{ f.count }}</span></button>
      </div>
      <span class="asb-spacer"></span>
      <span v-if="summary.ready > 0" class="asb-sum">
        找補合計 <b :class="{ 'is-neg': summary.amount < 0 }">{{ fmtMoney(summary.amount) }}</b>
        <span class="asb-sum-sep">·</span>
        實收 <b :class="{ 'is-neg': summary.pay < 0 }">{{ fmtMoney(summary.pay) }}</b>
      </span>
      <button type="button" class="mac-btn" title="面積找補設定" @click="settingsOpen = true">
        <v-icon size="16">mdi-tune-variant</v-icon><span class="mac-hide-xs">設定</span>
      </button>
      <button type="button" class="mac-btn" :disabled="!canExportOne || copying" title="把這一戶的單據複製成圖片" @click="copyImage">
        <v-progress-circular v-if="copying" indeterminate size="14" width="2"></v-progress-circular>
        <v-icon v-else size="16">mdi-image-multiple-outline</v-icon><span class="mac-hide-xs">複製圖片</span>
      </button>
      <button v-if="pdfJob.running" type="button" class="mac-btn" title="取消產生 PDF" @click="pdfJob.cancelled = true">
        <v-progress-circular indeterminate size="14" width="2"></v-progress-circular>
        <span>PDF {{ pdfJob.done }}/{{ pdfJob.total }}</span>
        <v-icon size="14">mdi-close</v-icon>
      </button>
      <v-menu v-else location="bottom end" content-class="mac-menu">
        <template #activator="{ props: menuProps }">
          <button type="button" class="mac-btn" v-bind="menuProps" :disabled="summary.ready === 0" title="下載 PDF">
            <v-icon size="16">mdi-file-pdf-box</v-icon><span class="mac-hide-xs">下載 PDF</span><v-icon size="14" class="asb-chevron">mdi-chevron-down</v-icon>
          </button>
        </template>
        <v-list density="compact">
          <v-list-item :disabled="!canExportOne" @click="downloadPdf('one')">
            <v-list-item-title>這一戶{{ selected ? `（${selected.unitId}）` : '' }}</v-list-item-title>
          </v-list-item>
          <v-list-item :disabled="readyInView.length === 0" @click="downloadPdf('all')">
            <v-list-item-title>{{ filter === 'all' && !searchText ? '全部' : '目前清單' }}（{{ readyInView.length }} 戶，每戶一頁）</v-list-item-title>
          </v-list-item>
        </v-list>
      </v-menu>
      <button type="button" class="mac-btn" :disabled="exporting || units.length === 0" title="下載全部戶別一覽表" @click="exportExcel">
        <v-icon size="16">mdi-microsoft-excel</v-icon><span class="mac-hide-xs">下載 Excel</span>
      </button>
    </div>

    <div class="asb-body" :class="{ 'is-narrow': isNarrow, 'show-detail': isNarrow && showDetail }">
      <!-- 戶別清單 -->
      <aside class="asb-card asb-list">
        <div v-if="units.length === 0" class="asb-empty">尚無戶別資料</div>
        <div v-else-if="viewUnits.length === 0" class="asb-empty">沒有符合的戶別</div>
        <template v-for="g in viewGroups" :key="g.name">
          <div v-if="viewGroups.length > 1" class="asb-group">{{ g.name }}</div>
          <button
            v-for="u in g.units"
            :key="u.docId || u.unitId"
            type="button"
            class="asb-row"
            :class="{ 'is-selected': selected && u.docId === selected.docId, 'is-missing': !u.calc }"
            @click="selectUnit(u)"
          >
            <span class="asb-row-main">
              <span class="asb-row-unit">{{ u.unitId }}</span>
              <span class="asb-row-name">{{ u.name || '—' }}</span>
            </span>
            <span v-if="u.calc" class="asb-row-amt" :class="{ 'is-neg': u.calc.sum.amount < 0 }">{{ signed(u.calc.sum.amount) }}</span>
            <span v-else class="asb-row-tag">資料不足</span>
            <v-icon v-if="u.note" size="14" class="asb-row-note" title="有找補備註">mdi-alert-circle</v-icon>
          </button>
        </template>
      </aside>

      <!-- 單據 -->
      <section class="asb-detail">
        <div v-if="isNarrow" class="asb-back">
          <button type="button" class="mac-link-btn" @click="showDetail = false">
            <v-icon size="18">mdi-chevron-left</v-icon>戶別清單
          </button>
          <span v-if="selected" class="asb-back-unit">{{ selected.unitId }}</span>
        </div>

        <div v-if="!selected" class="asb-card asb-empty asb-empty--detail">從左側選擇戶別</div>
        <template v-else>
          <!-- 不匯出的資料列：價格與備註 -->
          <div class="asb-card asb-strip">
            <label class="asb-field">
              <span class="asb-field-label">房地總價</span>
              <span class="mac-form-input mac-form-unit asb-num" :class="{ 'is-missing': selected.missing.includes('房地總價') }">
                <input
                  v-model="draft.total"
                  inputmode="numeric"
                  @focus="onDraftFocus('total', $event)"
                  @blur="commitDraft('total')"
                  @keydown.enter="$event.target.blur()"
                  @keydown.esc="cancelDraft('total', $event)"
                ><span>元</span>
              </span>
            </label>
            <label class="asb-field">
              <span class="asb-field-label">車位價</span>
              <span class="mac-form-input mac-form-unit asb-num">
                <input
                  v-model="draft.parking"
                  inputmode="numeric"
                  @focus="onDraftFocus('parking', $event)"
                  @blur="commitDraft('parking')"
                  @keydown.enter="$event.target.blur()"
                  @keydown.esc="cancelDraft('parking', $event)"
                ><span>元</span>
              </span>
            </label>
            <span class="asb-house">
              房屋價款
              <b>{{ selected.calc ? fmtWan(selected.calc.sum.price, 1) : '—' }}</b> 萬
            </span>
            <label class="asb-field asb-field--note" :class="{ 'has-note': !!draft.note, 'is-nudge': nudging }">
              <span class="asb-field-label">找補備註</span>
              <input
                v-model="draft.note"
                class="mac-form-input"
                @focus="focused = 'note'"
                @blur="commitDraft('note')"
                @keydown.enter="$event.target.blur()"
                @keydown.esc="cancelDraft('note', $event)"
              >
            </label>
          </div>

          <div v-if="selected.missing.length" class="mac-callout mac-callout--warning asb-missing">
            <v-icon size="16">mdi-alert-outline</v-icon>
            <span>缺少：{{ selected.missing.join('、') }}</span>
          </div>

          <!-- A4 單據：點格子直接修改 -->
          <div ref="fitEl" class="asb-fit">
            <div class="asb-paper-box" :style="{ width: `${paperW * scale}px`, height: `${paperH * scale}px` }">
              <!-- eslint-disable-next-line vue/no-v-html -->
              <div ref="paperEl" class="asb-paper" :style="{ transform: `scale(${scale})` }" @click="onPaperClick" v-html="sheetHtml"></div>
            </div>
          </div>
        </template>
      </section>
    </div>

    <!-- 就地修改 -->
    <div
      v-if="editor.key"
      ref="editorEl"
      class="asb-editor"
      :style="{ top: `${editor.y}px`, left: `${editor.x}px` }"
    >
      <div class="asb-editor-label">{{ editor.label }}</div>
      <div class="asb-editor-row">
        <input
          ref="editorInput"
          v-model="editor.value"
          class="mac-form-input"
          :inputmode="editor.numeric ? 'decimal' : 'text'"
          @keydown.enter.prevent="commitEditor"
          @keydown.esc.prevent="closeEditor"
        >
        <button type="button" class="mac-btn mac-btn--primary" :disabled="editor.saving" @click="commitEditor">確定</button>
      </div>
      <div v-if="editor.error" class="asb-editor-error">{{ editor.error }}</div>
    </div>

    <!-- 無法直接寫入剪貼簿時：預覽圖片，可長按／右鍵複製、下載或分享 -->
    <v-dialog v-model="imagePreview.show" max-width="900" scrollable content-class="mac-dialog-fit">
      <v-card class="mac-sheet">
        <div class="mac-sheet-head">
          <v-icon size="18">mdi-image-outline</v-icon>
          <span>面積找補圖片</span>
          <button type="button" class="mac-sheet-close" title="關閉" @click="imagePreview.show = false"><v-icon size="18">mdi-close</v-icon></button>
        </div>
        <div class="asb-preview-body">
          <div class="mac-callout asb-preview-note">
            <v-icon size="16">mdi-information-outline</v-icon>
            <span>{{ isTouchDevice ? '長按圖片可複製或儲存' : '在圖片上按右鍵選「複製圖片」' }}</span>
          </div>
          <img v-if="imagePreview.url" :src="imagePreview.url" class="asb-preview-img" alt="面積找補">
        </div>
        <div class="mac-sheet-foot">
          <span class="mac-spacer"></span>
          <button v-if="canShareImage" type="button" class="mac-btn" @click="shareImage">
            <v-icon size="16">mdi-export-variant</v-icon>分享
          </button>
          <button type="button" class="mac-btn mac-btn--primary" @click="downloadImage">
            <v-icon size="16">mdi-download</v-icon>下載 PNG
          </button>
        </div>
      </v-card>
    </v-dialog>

    <AreaSettlementSettingsDialog
      v-if="settingsOpen"
      v-model="settingsOpen"
      :settings="settings"
      :default-title="defaultTitle"
      @save="saveSettings"
    />
  </div>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue';
import { updateHouseholdData, updateProjectSettings } from '@/api';
import { useUserStore } from '@/store/user';
import {
  AREA_FIELD_MAP, buildAreaUnits, fmtMoney, fmtWan, groupAreaUnits, isAreaNumberField,
  resolveAreaSettings, summarizeAreaUnits, toNumber,
} from '@/utils/areaSettlement';
import {
  AREA_SHEET_CSS, SHEET_WIDTH, areaImageFileName, buildAreaSheetHtml, downloadAreaExcel, downloadAreaPdf, renderAreaSheetPng,
} from '@/utils/areaSettlementExport';
import { canCopyImage, copyPngToClipboard } from '@/utils/handoverBoardImage';
import AreaSettlementSettingsDialog from './AreaSettlementSettingsDialog.vue';

const props = defineProps({
  projectId: { type: String, required: true },
  projectName: { type: String, default: '' },
  projectConfig: { type: Object, default: null },
  households: { type: Array, default: () => [] },
});
const emit = defineEmits(['notify']);
const userStore = useUserStore();

// ───── 設定 ─────
const savedSettings = ref({ ...(props.projectConfig?.areaSettlement || {}) });
watch(() => props.projectConfig?.areaSettlement, (v) => { savedSettings.value = { ...(v || {}) }; });
const settings = computed(() => resolveAreaSettings(savedSettings.value, props.projectName));
const defaultTitle = computed(() => resolveAreaSettings({}, props.projectName).displayTitle);

const persistSettings = async (patch) => {
  const prev = savedSettings.value;
  const next = { ...prev, ...patch };
  savedSettings.value = next;
  const res = await updateProjectSettings(props.projectId, {
    areaSettlement: { ...next, updatedAt: new Date(), updatedBy: userStore.user?.name || '' },
  });
  if (res?.status !== 'success') {
    savedSettings.value = prev;
    emit('notify', `儲存失敗：${res?.message || '未知錯誤'}`, 'error');
    return false;
  }
  return true;
};
const settingsOpen = ref(false);
const saveSettings = async (patch) => {
  if (await persistSettings(patch)) emit('notify', '已儲存面積找補設定', 'success');
};

// ───── 戶別與篩選 ─────
const units = computed(() => buildAreaUnits(props.households, settings.value));
const summary = computed(() => summarizeAreaUnits(units.value));
const search = ref('');
const filter = ref('all');
const searchText = computed(() => String(search.value || '').trim().toLowerCase());
const filterOptions = computed(() => [
  { key: 'all', label: '全部', count: summary.value.total },
  { key: 'ready', label: '資料齊全', count: summary.value.ready },
  { key: 'missing', label: '資料不足', count: summary.value.missing },
]);
const viewUnits = computed(() => units.value.filter((u) => {
  if (filter.value === 'ready' && !u.calc) return false;
  if (filter.value === 'missing' && u.calc) return false;
  if (!searchText.value) return true;
  return u.unitId.toLowerCase().includes(searchText.value) || u.name.toLowerCase().includes(searchText.value);
}));
const viewGroups = computed(() => groupAreaUnits(viewUnits.value));
const readyInView = computed(() => viewUnits.value.filter(u => u.calc));

const selectedId = ref('');
const showDetail = ref(false);
const selected = computed(() => units.value.find(u => u.docId === selectedId.value) || null);
const canExportOne = computed(() => !!selected.value?.calc);
const selectUnit = (u) => {
  closeEditor();
  selectedId.value = u.docId;
  showDetail.value = true;
};
// 預設選第一戶；選取的戶別被刪除時改選第一戶
watch(units, (list) => {
  if (!list.some(u => u.docId === selectedId.value)) selectedId.value = list[0]?.docId || '';
}, { immediate: true });

const signed = (n) => (n > 0 ? `+${fmtMoney(n)}` : fmtMoney(n));

// ───── 單據預覽與縮放 ─────
const sheetHtml = computed(() => buildAreaSheetHtml(selected.value, settings.value, { editable: true }));
const fitEl = ref(null);
const paperEl = ref(null);
const paperW = SHEET_WIDTH;
const paperH = ref(1000);
const scale = ref(1);
const measurePaper = () => {
  const box = fitEl.value;
  const paper = paperEl.value;
  if (!box || !paper) return;
  const cs = getComputedStyle(box);
  const avail = box.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
  if (avail > 0) scale.value = Math.min(1, avail / paperW);
  if (paper.offsetHeight > 0) paperH.value = paper.offsetHeight;
};
let resizeObserver = null;
const observePaper = () => {
  resizeObserver?.disconnect();
  if (typeof ResizeObserver !== 'function') return;
  resizeObserver = new ResizeObserver(() => requestAnimationFrame(measurePaper));
  if (fitEl.value) resizeObserver.observe(fitEl.value);
  if (paperEl.value) resizeObserver.observe(paperEl.value);
};
watch([fitEl, paperEl], () => nextTick(() => { observePaper(); measurePaper(); }));
watch(sheetHtml, () => nextTick(() => {
  measurePaper();
  reattachEditingCell();
}));

// 單據樣式放進 <head>（v-html 內容不吃 scoped style）
const STYLE_ID = 'area-settlement-sheet-css';
const ensureSheetStyle = () => {
  if (document.getElementById(STYLE_ID)) return;
  const el = document.createElement('style');
  el.id = STYLE_ID;
  el.textContent = AREA_SHEET_CSS;
  document.head.appendChild(el);
};

// ───── 窄螢幕：清單與單據切換 ─────
const NARROW_QUERY = '(max-width: 760px)';
const mq = typeof window !== 'undefined' ? window.matchMedia?.(NARROW_QUERY) : null;
const isNarrow = ref(!!mq?.matches);
const onMqChange = (e) => { isNarrow.value = e.matches; };

// ───── 價格與備註（單據上方，不匯出） ─────
const DRAFT_FIELDS = {
  total: { key: 'areaSettleTotalPrice', numeric: true },
  parking: { key: 'areaSettleParkingPrice', numeric: true },
  note: { key: 'areaSettleNote', numeric: false },
};
const draft = reactive({ total: '', parking: '', note: '' });
const focused = ref('');
const moneyText = (n) => (n === null || n === undefined ? '' : fmtMoney(n));
const draftFromUnit = (name) => {
  const u = selected.value;
  if (!u) return '';
  if (name === 'total') return moneyText(u.totalPrice);
  if (name === 'parking') return moneyText(u.parkingPrice);
  return u.note;
};
const syncDrafts = () => {
  for (const name of Object.keys(DRAFT_FIELDS)) {
    if (focused.value !== name) draft[name] = draftFromUnit(name);
  }
};
watch(selected, syncDrafts, { immediate: true });

const saveHouseholdField = async (u, key, raw) => {
  let value;
  if (isAreaNumberField(key)) {
    const s = String(raw ?? '').trim();
    value = s === '' ? null : toNumber(s);
    if (s !== '' && value === null) throw new Error('請輸入數字');
  } else {
    value = String(raw ?? '').trim();
  }
  const current = u.household?.[key];
  const same = isAreaNumberField(key)
    ? toNumber(current) === value
    : String(current ?? '').trim() === value;
  if (same) return false;
  await updateHouseholdData(u.docId, { [key]: value });
  return true;
};

// 數字欄聚焦時全選，直接輸入新金額（Safari 點擊後 mouseup 會取消選取，延後一幀）
const onDraftFocus = (name, e) => {
  focused.value = name;
  const el = e.target;
  requestAnimationFrame(() => { if (document.activeElement === el) el.select(); });
};

const commitDraft = async (name) => {
  if (focused.value === name) focused.value = '';
  const u = selected.value;
  if (!u) return;
  const { key } = DRAFT_FIELDS[name];
  try {
    if (await saveHouseholdField(u, key, draft[name])) {
      emit('notify', `已更新 ${u.unitId} 的${AREA_FIELD_MAP[key].label.replace(/\(.*\)$/, '')}`, 'success');
    }
    draft[name] = draftFromUnit(name);
  } catch (err) {
    emit('notify', `${AREA_FIELD_MAP[key].label}：${err.message || err}`, 'error');
    draft[name] = draftFromUnit(name);
  }
};
const cancelDraft = (name, e) => {
  draft[name] = draftFromUnit(name);
  focused.value = '';
  e.target.blur();
};

// ───── 就地修改單據格子 ─────
const EDIT_LABELS = {
  address: '門牌',
  '@title': '單據標題',
  '@publicArea': '大公面積(㎡)',
  '@shareDen': '持分分母',
};
const editor = reactive({ key: '', label: '', value: '', numeric: false, x: 0, y: 0, error: '', saving: false, unitDocId: '' });
const editorEl = ref(null);
const editorInput = ref(null);
let editingCell = null;
let editingIndex = 0; // 同一欄位可能出現兩格（例如權狀主建物上下兩表），記住是第幾格

const cellsOf = (key) => [...(paperEl.value?.querySelectorAll('td[data-edit]') || [])].filter(td => td.dataset.edit === key);

// 資料更新後單據重新產生：找回正在修改的格子
const reattachEditingCell = () => {
  if (!editor.key || editingCell?.isConnected) return;
  const cells = cellsOf(editor.key);
  editingCell = cells[editingIndex] || cells[0] || null;
  if (!editingCell) {
    closeEditor();
    return;
  }
  editingCell.classList.add('is-editing');
  placeEditor(editingCell);
};

const rawEditValue = (key) => {
  const s = settings.value;
  if (key === '@title') return s.title || s.displayTitle;
  if (key === '@publicArea') return s.publicArea ?? '';
  if (key === '@shareDen') return s.shareDen;
  const v = selected.value?.household?.[key];
  return v === null || v === undefined ? '' : String(v);
};

const onPaperClick = (e) => {
  const td = e.target.closest?.('td[data-edit]');
  if (!td || !selected.value) return;
  const key = td.dataset.edit;
  openEditor(td, key);
};

// 彈出框貼在格子下方（放不下時改到上方）
const placeEditor = (td) => {
  const rect = td.getBoundingClientRect();
  const w = 240;
  const h = 96;
  let x = rect.left;
  let y = rect.bottom + 6;
  if (x + w > window.innerWidth - 8) x = window.innerWidth - w - 8;
  if (y + h > window.innerHeight - 8) y = rect.top - h - 6;
  editor.x = Math.max(8, x);
  editor.y = Math.max(8, y);
};

const openEditor = (td, key) => {
  closeEditor();
  placeEditor(td);
  editor.key = key;
  editor.label = EDIT_LABELS[key] || AREA_FIELD_MAP[key]?.label || key;
  editor.value = rawEditValue(key);
  editor.numeric = key.startsWith('@') ? key !== '@title' : isAreaNumberField(key);
  editor.error = '';
  editor.unitDocId = selected.value.docId;
  editingCell = td;
  editingIndex = Math.max(0, cellsOf(key).indexOf(td));
  td.classList.add('is-editing');
  nextTick(() => {
    editorInput.value?.focus();
    editorInput.value?.select();
  });
};

const closeEditor = () => {
  editingCell?.classList.remove('is-editing');
  editingCell = null;
  editor.key = '';
  editor.saving = false;
};

const commitEditor = async () => {
  if (!editor.key || editor.saving) return;
  const key = editor.key;
  const raw = String(editor.value ?? '').trim();
  editor.saving = true;
  editor.error = '';
  try {
    if (key.startsWith('@')) {
      const name = key.slice(1);
      let value = raw;
      if (name !== 'title') {
        value = raw === '' ? null : toNumber(raw);
        if (raw !== '' && (value === null || value <= 0)) throw new Error('請輸入大於 0 的數字');
        if (name === 'shareDen' && value === null) throw new Error('請輸入持分分母');
      } else if (raw === defaultTitle.value) {
        value = '';
      }
      if (String(savedSettings.value[name] ?? '') !== String(value ?? '')) {
        if (await persistSettings({ [name]: value })) emit('notify', `已更新${EDIT_LABELS[key]}`, 'success');
      }
    } else {
      const u = units.value.find(x => x.docId === editor.unitDocId);
      if (!u) throw new Error('找不到戶別');
      if (await saveHouseholdField(u, key, raw)) {
        emit('notify', `已更新 ${u.unitId} 的${(EDIT_LABELS[key] || AREA_FIELD_MAP[key].label).replace(/\(.*\)$/, '')}`, 'success');
      }
    }
    closeEditor();
  } catch (err) {
    editor.error = err.message || String(err);
    editor.saving = false;
    nextTick(() => editorInput.value?.focus());
  }
};

const onDocPointerDown = (e) => {
  if (!editor.key) return;
  if (editorEl.value?.contains(e.target)) return;
  if (e.target.closest?.('td[data-edit]')) return; // 點另一格由 onPaperClick 處理
  closeEditor();
};
// 捲動或視窗大小改變（手機鍵盤彈出）時跟著格子移動；格子已不在畫面上才關閉
const followCell = () => {
  if (!editor.key) return;
  if (!editingCell?.isConnected) {
    closeEditor();
    return;
  }
  placeEditor(editingCell);
};

// ───── 匯出前提醒：有找補備註時晃一下 ─────
const nudging = ref(false);
const nudge = () => {
  if (!selected.value?.note) return;
  nudging.value = false;
  requestAnimationFrame(() => { nudging.value = true; });
  setTimeout(() => { nudging.value = false; }, 500);
};

// ───── 複製圖片 ─────
const canHover = typeof window !== 'undefined' && window.matchMedia?.('(hover: hover)').matches;
const isTouchDevice = typeof window !== 'undefined' && (navigator.maxTouchPoints || 0) > 0 && !canHover;
const copying = ref(false);
const imagePreview = reactive({ show: false, url: '', blob: null, name: '' });
const imageFile = () => new File([imagePreview.blob], imagePreview.name, { type: 'image/png' });
const canShareImage = computed(() => {
  if (!imagePreview.blob || !isTouchDevice || typeof navigator.canShare !== 'function') return false;
  try { return navigator.canShare({ files: [imageFile()] }); } catch (_) { return false; }
});
const openImagePreview = (blob, name) => {
  if (imagePreview.url) URL.revokeObjectURL(imagePreview.url);
  imagePreview.blob = blob;
  imagePreview.name = name;
  imagePreview.url = URL.createObjectURL(blob);
  imagePreview.show = true;
};
const copyImage = async () => {
  const u = selected.value;
  if (!u?.calc || copying.value) return;
  copying.value = true;
  closeEditor();
  nudge();
  // 點擊當下就呼叫剪貼簿（Safari 要求在使用者操作內寫入）
  const pngPromise = renderAreaSheetPng(u, settings.value);
  pngPromise.catch(() => {});
  try {
    if (!canCopyImage()) throw new Error('瀏覽器不支援複製圖片');
    await copyPngToClipboard(pngPromise);
    emit('notify', `已複製 ${u.unitId} 的單據圖片，可直接貼上`, 'success');
  } catch (err) {
    console.warn('寫入剪貼簿失敗，改開預覽:', err);
    try {
      openImagePreview(await pngPromise, areaImageFileName(props.projectName, u));
    } catch (renderErr) {
      console.error('產生面積找補圖片失敗:', renderErr);
      emit('notify', `產生圖片失敗：${renderErr.message || renderErr}`, 'error');
    }
  } finally {
    copying.value = false;
  }
};
const downloadImage = () => {
  if (!imagePreview.url) return;
  const a = document.createElement('a');
  a.href = imagePreview.url;
  a.download = imagePreview.name;
  document.body.appendChild(a);
  a.click();
  a.remove();
};
const shareImage = async () => {
  try {
    await navigator.share({ files: [imageFile()], title: imagePreview.name });
  } catch (err) {
    if (err?.name !== 'AbortError') emit('notify', `分享失敗：${err.message || err}`, 'error');
  }
};
watch(() => imagePreview.show, (open) => {
  if (open || !imagePreview.url) return;
  URL.revokeObjectURL(imagePreview.url);
  imagePreview.url = '';
  imagePreview.blob = null;
});

// ───── PDF ─────
const pdfJob = reactive({ running: false, done: 0, total: 0, cancelled: false });
const downloadPdf = async (scope) => {
  if (pdfJob.running) return;
  const list = scope === 'one' ? (selected.value?.calc ? [selected.value] : []) : [...readyInView.value];
  if (list.length === 0) return;
  closeEditor();
  if (scope === 'one') nudge();
  Object.assign(pdfJob, { running: true, done: 0, total: list.length, cancelled: false });
  try {
    const finished = await downloadAreaPdf(list, settings.value, {
      projectName: props.projectName,
      onProgress: (done) => { pdfJob.done = done; },
      isCancelled: () => pdfJob.cancelled,
    });
    if (!finished) emit('notify', '已取消產生 PDF', 'info');
  } catch (err) {
    console.error('產生面積找補 PDF 失敗:', err);
    emit('notify', `產生 PDF 失敗：${err.message || err}`, 'error');
  } finally {
    pdfJob.running = false;
  }
};

// ───── Excel ─────
const exporting = ref(false);
const exportExcel = async () => {
  exporting.value = true;
  try {
    await downloadAreaExcel(units.value, settings.value, { projectName: props.projectName });
  } catch (err) {
    console.error('下載面積找補 Excel 失敗:', err);
    emit('notify', `下載失敗：${err.message || err}`, 'error');
  } finally {
    exporting.value = false;
  }
};

onMounted(() => {
  ensureSheetStyle();
  mq?.addEventListener?.('change', onMqChange);
  document.addEventListener('pointerdown', onDocPointerDown, true);
  window.addEventListener('scroll', followCell, true);
  window.addEventListener('resize', followCell);
  nextTick(() => { observePaper(); measurePaper(); });
});
onBeforeUnmount(() => {
  resizeObserver?.disconnect();
  mq?.removeEventListener?.('change', onMqChange);
  document.removeEventListener('pointerdown', onDocPointerDown, true);
  window.removeEventListener('scroll', followCell, true);
  window.removeEventListener('resize', followCell);
  pdfJob.cancelled = true;
});
</script>

<style scoped>
.asb {
  --asb-text: #1d1d1f;
  --asb-sub: #6e6e73;
  --asb-line: rgba(0, 0, 0, 0.08);
  color: var(--asb-text);
  font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", "Helvetica Neue", "PingFang TC", "Noto Sans TC", sans-serif;
  font-size: 13px;
}

/* 工具列 */
.asb-toolbar {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 12px;
}
.asb-search { flex: 0 1 220px; min-width: 160px; }
.asb-seg-count {
  margin-left: 4px;
  color: var(--asb-sub);
  font-size: 11.5px;
  font-weight: 500;
  font-variant-numeric: tabular-nums;
}
.asb-spacer { flex: 1 1 auto; }
.asb-sum { font-size: 12.5px; color: var(--asb-sub); white-space: nowrap; }
.asb-sum b { color: var(--asb-text); font-variant-numeric: tabular-nums; }
.asb-sum b.is-neg { color: #d70015; }
.asb-sum-sep { margin: 0 4px; }
.asb-chevron { margin-left: -2px; opacity: 0.7; }

/* 版面 */
.asb-body {
  display: grid;
  grid-template-columns: 260px minmax(0, 1fr);
  gap: 14px;
  align-items: start;
}
.asb-card {
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 0 0 0.5px rgba(0, 0, 0, 0.1), 0 1px 3px rgba(0, 0, 0, 0.05);
}
.asb-empty { padding: 40px 16px; text-align: center; color: #8e8e93; }
.asb-empty--detail { padding: 80px 16px; }

/* 清單 */
.asb-list {
  position: sticky;
  top: 8px;
  max-height: calc(100vh - 220px);
  min-height: 240px;
  overflow-y: auto;
  padding: 6px;
  -webkit-overflow-scrolling: touch;
}
.asb-group {
  position: sticky;
  top: -6px;
  z-index: 1;
  margin: 0 -6px;
  padding: 8px 14px 4px;
  background: rgba(255, 255, 255, 0.96);
  -webkit-backdrop-filter: blur(8px);
  backdrop-filter: blur(8px);
  color: var(--asb-sub);
  font-size: 11.5px;
  font-weight: 600;
  letter-spacing: 0.02em;
}
.asb-row {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  min-height: 40px;
  padding: 6px 10px;
  border: 0;
  border-radius: 7px;
  background: transparent;
  color: inherit;
  font-family: inherit;
  text-align: left;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
}
.asb-row:hover { background: rgba(0, 0, 0, 0.045); }
.asb-row:focus-visible { outline: 2px solid #0071e3; outline-offset: -2px; }
.asb-row-main { display: flex; flex-direction: column; flex: 1 1 auto; min-width: 0; line-height: 1.25; }
.asb-row-unit { font-size: 13.5px; font-weight: 600; overflow-wrap: anywhere; }
.asb-row-name { font-size: 12px; color: var(--asb-sub); overflow-wrap: anywhere; }
.asb-row-amt { font-size: 12.5px; font-weight: 600; font-variant-numeric: tabular-nums; white-space: nowrap; }
.asb-row-amt.is-neg { color: #d70015; }
.asb-row-tag {
  padding: 1px 6px;
  border-radius: 5px;
  background: rgba(255, 159, 10, 0.16);
  color: #9a5b00;
  font-size: 11px;
  font-weight: 600;
  white-space: nowrap;
}
.asb-row-note { color: #f5a623; flex-shrink: 0; }
.asb-row.is-missing .asb-row-unit { color: var(--asb-sub); }
.asb-row.is-selected { background: #0071e3; color: #fff; }
.asb-row.is-selected .asb-row-name,
.asb-row.is-selected .asb-row-unit,
.asb-row.is-selected .asb-row-amt,
.asb-row.is-selected .asb-row-note { color: #fff; }
.asb-row.is-selected .asb-row-tag { background: rgba(255, 255, 255, 0.22); color: #fff; }

/* 單據區 */
.asb-detail { min-width: 0; }
.asb-back { display: flex; align-items: center; gap: 8px; margin-bottom: 8px; }
.asb-back .mac-link-btn { display: inline-flex; align-items: center; padding-left: 0; }
.asb-back-unit { font-weight: 600; }

.asb-strip {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px 16px;
  padding: 10px 14px;
  margin-bottom: 10px;
}
.asb-field { display: inline-flex; align-items: center; gap: 8px; }
.asb-field-label { color: var(--asb-sub); font-size: 12.5px; white-space: nowrap; }
.asb-num { width: 150px; flex: 0 0 auto; }
.asb-num input { text-align: right; font-variant-numeric: tabular-nums; }
.asb-num.is-missing { border-color: rgba(255, 159, 10, 0.75); }
.asb-house { color: var(--asb-sub); font-size: 12.5px; white-space: nowrap; }
.asb-house b { color: var(--asb-text); font-size: 13.5px; font-variant-numeric: tabular-nums; }
.asb-field--note { flex: 1 1 260px; min-width: 0; }
.asb-field--note .mac-form-input { flex: 1 1 auto; }
.asb-field--note.has-note .mac-form-input {
  background: #fff4d1;
  border-color: #f5c443;
  color: #7a4a00;
  font-weight: 600;
}
.asb-field--note.is-nudge .mac-form-input { animation: asb-shake 0.4s; }
@keyframes asb-shake {
  20%, 60% { transform: translateX(-5px); }
  40%, 80% { transform: translateX(5px); }
}
.asb-missing { margin-bottom: 10px; }

.asb-fit {
  width: 100%;
  min-width: 0;
  padding: 20px;
  border-radius: 12px;
  background: #f2f2f5;
}
.asb-paper-box { margin: 0 auto; overflow: hidden; }
.asb-paper {
  width: 794px;
  transform-origin: top left;
  border-radius: 4px;
  box-shadow: 0 0 0 0.5px rgba(0, 0, 0, 0.1), 0 2px 6px rgba(0, 0, 0, 0.05), 0 14px 36px rgba(0, 0, 0, 0.08);
  overflow: hidden;
}

/* 就地修改彈出框 */
.asb-editor {
  position: fixed;
  z-index: 2350;
  width: 240px;
  padding: 10px;
  border-radius: 12px;
  background: rgba(250, 250, 252, 0.98);
  -webkit-backdrop-filter: saturate(180%) blur(20px);
  backdrop-filter: saturate(180%) blur(20px);
  box-shadow: 0 12px 36px rgba(0, 0, 0, 0.2), 0 0 0 0.5px rgba(0, 0, 0, 0.12);
}
.asb-editor-label { margin-bottom: 6px; font-size: 12px; font-weight: 600; color: var(--asb-sub); }
.asb-editor-row { display: flex; gap: 6px; }
.asb-editor-row .mac-form-input { flex: 1 1 auto; min-width: 0; }
.asb-editor-error { margin-top: 6px; color: #d70015; font-size: 12px; }

/* 圖片預覽 */
.asb-preview-body { max-height: 75vh; overflow: auto; padding: 12px 16px 16px; background: #f5f5f7; }
.asb-preview-note { margin-bottom: 10px; }
.asb-preview-img {
  display: block;
  max-width: 100%;
  height: auto;
  margin: 0 auto;
  border-radius: 6px;
  box-shadow: 0 0 0 0.5px rgba(0, 0, 0, 0.12), 0 4px 14px rgba(0, 0, 0, 0.08);
  -webkit-touch-callout: default;
}

/* 窄螢幕：清單、單據擇一顯示 */
.asb-body.is-narrow { grid-template-columns: minmax(0, 1fr); }
.asb-body.is-narrow .asb-list { position: static; max-height: none; }
.asb-body.is-narrow .asb-detail { display: none; }
.asb-body.is-narrow.show-detail .asb-list { display: none; }
.asb-body.is-narrow.show-detail .asb-detail { display: block; }

@media (max-width: 600px) {
  .asb-toolbar { gap: 6px; }
  .asb-search { flex: 1 1 140px; min-width: 0; }
  .asb-toolbar > .mac-btn { padding: 0 9px; }
  .asb-sum { order: 10; width: 100%; }
  .asb-fit { padding: 10px; }
  .asb-editor .mac-form-input { height: 36px; font-size: 16px; }
  .asb-num { width: 140px; }
  .asb-num input { font-size: 16px; }
  .asb-field--note .mac-form-input { font-size: 16px; }
}
</style>

<!-- 單據可修改格子（v-html 內容，不能用 scoped） -->
<style>
.asb-paper .as-sheet td.ed { cursor: text; transition: background-color 0.12s, box-shadow 0.12s; }
.asb-paper .as-sheet td.ed:hover { background: rgba(0, 113, 227, 0.07); box-shadow: inset 0 0 0 1.5px rgba(0, 113, 227, 0.5); }
.asb-paper .as-sheet td.ed.is-editing { background: rgba(0, 113, 227, 0.12); box-shadow: inset 0 0 0 2px #0071e3; }
.asb-paper .as-sheet td.ed-empty { background: repeating-linear-gradient(135deg, #fafafc 0 6px, #f2f2f5 6px 12px); }
.asb-paper .as-sheet td.ed-empty::after { content: '＋'; color: #b0b0b8; font-weight: 400; }
</style>
