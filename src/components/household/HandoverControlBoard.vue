<template>
  <div class="hb">
    <!-- 工具列：搜尋、符合筆數、設定、下載 -->
    <div class="hb-toolbar">
      <v-text-field
        v-model="search"
        class="mac-vfield mac-vfield--search hb-search"
        variant="solo" flat density="compact" hide-details clearable
        prepend-inner-icon="mdi-magnify"
        placeholder="戶號或買方"
      ></v-text-field>
      <span v-if="isFiltering" class="hb-match">符合 {{ matchCount }} 戶</span>
      <button v-if="isFiltering" type="button" class="mac-link-btn" @click="clearFilters">清除篩選</button>
      <span class="hb-spacer"></span>
      <span class="hb-updated">更新 {{ updatedText }}</span>
      <button type="button" class="mac-btn" title="控管表設定" @click="settingsOpen = true">
        <v-icon size="16">mdi-tune-variant</v-icon><span class="mac-hide-xs">設定</span>
      </button>
      <button type="button" class="mac-btn" :disabled="copying" title="複製成圖片，可直接貼到 LINE、Email、文件" @click="copyImage">
        <v-progress-circular v-if="copying" indeterminate size="14" width="2"></v-progress-circular>
        <v-icon v-else size="16">mdi-image-multiple-outline</v-icon><span class="mac-hide-xs">複製圖片</span>
      </button>
      <button type="button" class="mac-btn" :disabled="exporting" title="下載 Excel" @click="exportExcel">
        <v-icon size="16">mdi-microsoft-excel</v-icon><span class="mac-hide-xs">下載 Excel</span>
      </button>
    </div>

    <!-- 圖例：點名稱篩選、點色點改顏色 -->
    <div class="hb-legend">
      <div
        v-for="s in board.statusList"
        :key="s.key"
        class="hb-legend-item"
        :class="{ 'is-active': activeStatuses.includes(s.key), 'is-muted': activeStatuses.length > 0 && !activeStatuses.includes(s.key) }"
      >
        <button
          type="button"
          class="hb-swatch"
          :style="{ background: board.colors[s.key] }"
          :title="`更換「${s.label}」顏色`"
          @click.stop="openColorPop($event, s.key)"
        ></button>
        <button type="button" class="hb-legend-btn" @click="toggleStatus(s.key)">
          {{ s.label }}<span class="hb-legend-count">{{ board.stats.statusCounts[s.key] || 0 }}</span>
        </button>
      </div>
    </div>

    <div ref="bodyEl" class="hb-body" :class="{ 'is-stacked': statsStacked }">
      <!-- 矩陣 -->
      <section class="hb-card hb-matrix-card">
        <div v-if="board.units.length === 0" class="hb-empty">尚無戶別資料</div>
        <div v-else-if="board.floors.length > 0" class="hb-scroll">
          <table ref="tableEl" class="hb-table">
            <thead>
              <tr v-if="board.showTowerHeader" class="hb-tower-row">
                <th class="hb-floor hb-sticky-left"></th>
                <template v-for="(t, ti) in board.towers" :key="`t-${t.name}`">
                  <th v-if="ti > 0" class="hb-gap"></th>
                  <th :colspan="t.cols.length" class="hb-tower">{{ t.name }} 棟</th>
                </template>
                <th class="hb-floor hb-sticky-right"></th>
              </tr>
              <tr class="hb-col-row">
                <th class="hb-floor hb-sticky-left">樓層</th>
                <template v-for="(t, ti) in board.towers" :key="`h-${t.name}`">
                  <th v-if="ti > 0" class="hb-gap"></th>
                  <th v-for="col in t.cols" :key="col" class="hb-col">{{ col }}</th>
                </template>
                <th class="hb-floor hb-sticky-right">樓層</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="floor in board.floors" :key="floor">
                <th class="hb-floor hb-sticky-left">{{ floor }}F</th>
                <template v-for="(t, ti) in board.towers" :key="`r-${floor}-${t.name}`">
                  <td v-if="ti > 0" class="hb-gap"></td>
                  <td v-for="col in t.cols" :key="col" class="hb-td">
                    <button
                      v-if="board.cellMap[`${floor}|${col}`]"
                      type="button"
                      class="hb-cell"
                      :class="cellClass(board.cellMap[`${floor}|${col}`])"
                      :style="cellStyle(board.cellMap[`${floor}|${col}`])"
                      :title="board.cellMap[`${floor}|${col}`].unitId"
                      @click="openUnit(board.cellMap[`${floor}|${col}`])"
                      @mouseenter="showHover($event, board.cellMap[`${floor}|${col}`])"
                      @mouseleave="hideHover"
                    >
                      <span class="hb-cell-label">{{ statusLabel[board.cellMap[`${floor}|${col}`].status] }}</span>
                      <span v-if="board.cellMap[`${floor}|${col}`].nextDate" class="hb-cell-date">{{ shortDate(board.cellMap[`${floor}|${col}`].nextDate) }}</span>
                    </button>
                  </td>
                </template>
                <th class="hb-floor hb-sticky-right">{{ floor }}F</th>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- 店面／其他 -->
        <div v-if="board.specialUnits.length > 0" class="hb-special" :class="{ 'is-only': board.floors.length === 0 }">
          <div class="hb-special-label">{{ board.specialLabel }}</div>
          <div class="hb-special-list">
            <button
              v-for="u in board.specialUnits"
              :key="u.docId || u.unitId"
              type="button"
              class="hb-cell hb-cell--special"
              :class="cellClass(u)"
              :style="cellStyle(u)"
              :title="u.unitId"
              @click="openUnit(u)"
              @mouseenter="showHover($event, u)"
              @mouseleave="hideHover"
            >
              <span class="hb-cell-unit">{{ u.unitId }}</span>
              <span class="hb-cell-label">{{ statusLabel[u.status] }}</span>
              <span v-if="u.nextDate" class="hb-cell-date">{{ shortDate(u.nextDate) }}</span>
            </button>
          </div>
        </div>
      </section>

      <!-- 統計 -->
      <aside class="hb-stats">
        <section class="hb-card hb-stat-card">
          <div class="hb-stat-title">總覽</div>
          <div class="hb-total"><b>{{ stats.total }}</b><span>戶</span></div>
          <div class="hb-bar hb-bar--split">
            <span :style="{ width: `${stats.soldPct}%`, background: '#0A84FF' }"></span>
            <span :style="{ width: `${stats.unsoldPct}%`, background: barColor(board.colors.unsold) }"></span>
          </div>
          <div class="hb-stat-row">
            <span class="hb-dot" style="background:#0A84FF"></span><span class="hb-stat-label">已售</span>
            <b>{{ stats.sold }}</b><span class="hb-pct">{{ stats.soldPct }}%</span>
          </div>
          <div class="hb-stat-row">
            <span class="hb-dot" :style="{ background: board.colors.unsold }"></span><span class="hb-stat-label">未售</span>
            <b>{{ stats.unsold }}</b><span class="hb-pct">{{ stats.unsoldPct }}%</span>
          </div>
        </section>

        <section class="hb-card hb-stat-card">
          <div class="hb-stat-title">進度<span class="hb-stat-sub">占已售</span></div>
          <div v-for="k in kpis" :key="k.label" class="hb-kpi">
            <div class="hb-stat-row">
              <span class="hb-stat-label">{{ k.label }}</span>
              <b>{{ k.count }}</b><span class="hb-pct">{{ k.pct }}%</span>
            </div>
            <div class="hb-bar"><span :style="{ width: `${k.pct}%`, background: barColor(k.color) }"></span></div>
          </div>
        </section>

        <section class="hb-card hb-stat-card">
          <div class="hb-stat-title">各項目</div>
          <div v-for="st in stats.stageStats" :key="st.key" class="hb-kpi">
            <div class="hb-stat-row">
              <span class="hb-stat-label">已{{ st.label }}</span>
              <b>{{ st.done }}</b><span class="hb-pct">{{ st.donePct }}%</span>
            </div>
            <div class="hb-bar"><span :style="{ width: `${st.donePct}%`, background: barColor(board.colors[`done:${st.key}`]) }"></span></div>
            <div v-if="!st.virtual" class="hb-stat-row hb-stat-row--sub">
              <span class="hb-dot" :style="{ background: board.colors[`booked:${st.key}`] }"></span>
              <span class="hb-stat-label">已約{{ st.label }}</span>
              <b>{{ st.booked }}</b>
            </div>
          </div>
        </section>

        <section v-if="stats.extra.length > 0" class="hb-card hb-stat-card">
          <div class="hb-stat-title">其他</div>
          <div v-for="ex in stats.extra" :key="ex.key" class="hb-stat-row">
            <span class="hb-stat-label">{{ ex.label }}</span>
            <b>{{ ex.count }}</b><span class="hb-pct">戶</span>
          </div>
        </section>
      </aside>
    </div>

    <!-- 滑過格子：該戶摘要 -->
    <div v-if="hover.unit" class="hb-hover" :style="{ top: `${hover.y}px`, left: `${hover.x}px` }">
      <div class="hb-hover-head">
        <b>{{ hover.unit.unitId }}</b>
        <span v-if="hover.unit.buyerName">{{ hover.unit.buyerName }}</span>
      </div>
      <div class="hb-hover-status">
        <span class="hb-dot" :style="{ background: board.colors[hover.unit.status] }"></span>{{ statusLabel[hover.unit.status] }}
      </div>
      <div v-for="st in board.stages" :key="st.key" class="hb-hover-row">
        <span>{{ st.label }}</span>
        <span>{{ progressText(hover.unit, st) }}</span>
      </div>
    </div>

    <!-- 就地改顏色 -->
    <div
      v-if="colorPop.key"
      ref="colorPopEl"
      class="hb-color-pop"
      :style="{ top: `${colorPop.y}px`, left: `${colorPop.x}px` }"
    >
      <div class="hb-color-pop-title">
        <span class="hb-dot" :style="{ background: board.colors[colorPop.key] }"></span>{{ statusLabel[colorPop.key] }}
      </div>
      <HandoverColorPalette
        :model-value="board.colors[colorPop.key]"
        :default-color="defaultColors[colorPop.key]"
        @update:model-value="(hex) => setColor(colorPop.key, hex)"
        @commit="flushSave"
      />
    </div>

    <!-- 無法直接寫入剪貼簿時：預覽圖片，可長按／右鍵複製、下載或分享 -->
    <v-dialog v-model="imagePreview.show" max-width="1100" scrollable content-class="mac-dialog-fit">
      <v-card class="mac-sheet">
        <div class="mac-sheet-head">
          <v-icon size="18">mdi-image-outline</v-icon>
          <span>交屋控管表圖片</span>
          <button type="button" class="mac-sheet-close" title="關閉" @click="imagePreview.show = false"><v-icon size="18">mdi-close</v-icon></button>
        </div>
        <div class="hb-preview-body">
          <div class="mac-callout hb-preview-note">
            <v-icon size="16">mdi-information-outline</v-icon>
            <span>{{ isTouchDevice ? '長按圖片可複製或儲存' : '在圖片上按右鍵選「複製圖片」' }}</span>
          </div>
          <img v-if="imagePreview.url" :src="imagePreview.url" class="hb-preview-img" alt="交屋控管表">
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

    <HandoverBoardSettingsDialog
      v-if="settingsOpen"
      v-model="settingsOpen"
      :project-config="projectConfig"
      :custom-field-defs="customFieldDefs"
      :status-counts="stats.statusCounts"
      @save="saveSettings"
    />
  </div>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue';
import { updateProjectSettings } from '@/api';
import { useUserStore } from '@/store/user';
import {
  barColor, boardKpis, buildHandoverBoard, defaultStatusColors, handoverStageKey, isHandoverOn, normalizeHex, shortDate, textColorFor,
} from '@/utils/handoverBoard';
import { downloadHandoverExcel, formatDateTime } from '@/utils/handoverBoardExport';
import { canCopyImage, copyPngToClipboard, handoverImageFileName, renderHandoverPng } from '@/utils/handoverBoardImage';
import HandoverColorPalette from './HandoverColorPalette.vue';
import HandoverBoardSettingsDialog from './HandoverBoardSettingsDialog.vue';

const props = defineProps({
  projectId: { type: String, required: true },
  projectName: { type: String, default: '' },
  projectConfig: { type: Object, default: null },
  households: { type: Array, default: () => [] },
  customFieldDefs: { type: Array, default: () => [] },
});
const emit = defineEmits(['open-unit', 'update:settings', 'notify']);
const userStore = useUserStore();

// 今天（跨日時重算已約／已完成）
const today = ref(new Date());
let todayTimer = null;

const board = computed(() => buildHandoverBoard(props.households, props.projectConfig, today.value, props.customFieldDefs));
const stats = computed(() => board.value.stats);
const statusLabel = computed(() => Object.fromEntries(board.value.statusList.map(s => [s.key, s.label])));
const defaultColors = computed(() => defaultStatusColors(board.value.stages));

const lastUpdated = ref(new Date());
watch(() => props.households, () => { lastUpdated.value = new Date(); });
const updatedText = computed(() => formatDateTime(lastUpdated.value).slice(5));

// ───── 篩選 ─────
const search = ref('');
const activeStatuses = ref([]);
const searchText = computed(() => String(search.value || '').trim().toLowerCase());
const isFiltering = computed(() => !!searchText.value || activeStatuses.value.length > 0);
const matches = (u) => {
  if (activeStatuses.value.length > 0 && !activeStatuses.value.includes(u.status)) return false;
  if (!searchText.value) return true;
  return u.unitId.toLowerCase().includes(searchText.value) || u.buyerName.toLowerCase().includes(searchText.value);
};
const matchCount = computed(() => board.value.units.filter(matches).length);
const toggleStatus = (key) => {
  const list = activeStatuses.value;
  activeStatuses.value = list.includes(key) ? list.filter(k => k !== key) : [...list, key];
};
const clearFilters = () => {
  search.value = '';
  activeStatuses.value = [];
};
// 狀態因設定變動消失時，移除失效的篩選
watch(() => board.value.statusList, (list) => {
  const keys = new Set(list.map(s => s.key));
  activeStatuses.value = activeStatuses.value.filter(k => keys.has(k));
});

const cellStyle = (u) => {
  const bg = board.value.colors[u.status] || '#FFFFFF';
  return { background: bg, color: textColorFor(bg) };
};
const cellClass = (u) => ({
  'is-dim': isFiltering.value && !matches(u),
  'is-hit': isFiltering.value && matches(u),
  'is-booked': u.status.startsWith('booked:'),
});

const openUnit = (u) => {
  hideHover();
  emit('open-unit', u.household);
};

// ───── 滑過摘要（只在有滑鼠的裝置） ─────
const canHover = typeof window !== 'undefined' && window.matchMedia?.('(hover: hover)').matches;
const hover = reactive({ unit: null, x: 0, y: 0 });
const showHover = (e, u) => {
  if (!canHover || colorPop.key) return;
  const rect = e.currentTarget.getBoundingClientRect();
  const w = 220;
  const h = 70 + board.value.stages.length * 20;
  let x = rect.right + 8;
  if (x + w > window.innerWidth - 8) x = rect.left - w - 8;
  let y = rect.top;
  if (y + h > window.innerHeight - 8) y = window.innerHeight - h - 8;
  hover.unit = u;
  hover.x = Math.max(8, x);
  hover.y = Math.max(8, y);
};
const hideHover = () => { hover.unit = null; };
const progressText = (u, st) => {
  if (st.key === handoverStageKey(board.value.stages) && isHandoverOn(u.household)) return '交屋開關已開';
  const p = u.progress[st.key];
  if (!p) return '—';
  const parts = [];
  if (p.done) parts.push(`已完成${p.lastDate ? ` ${shortDate(p.lastDate)}` : ''}`);
  if (p.booked) parts.push(`已約${p.nextDate ? ` ${shortDate(p.nextDate)}` : ''}`);
  return parts.join('・') || '—';
};

// ───── 設定儲存 ─────
const currentSettings = () => ({ ...(props.projectConfig?.handoverBoard || {}) });
let saveTimer = null;
let pendingSettings = null;
let lastSavedSettings = null;

const persist = async (settings) => {
  const payload = { ...settings, updatedAt: new Date(), updatedBy: userStore.user?.name || '' };
  const res = await updateProjectSettings(props.projectId, { handoverBoard: payload });
  if (res?.status !== 'success') {
    if (lastSavedSettings) emit('update:settings', lastSavedSettings);
    emit('notify', `儲存失敗：${res?.message || '未知錯誤'}`, 'error');
    return false;
  }
  lastSavedSettings = payload;
  return true;
};

const flushSave = async () => {
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = null;
  if (!pendingSettings) return;
  const s = pendingSettings;
  pendingSettings = null;
  if (await persist(s)) emit('notify', '已儲存顏色', 'success');
};

/** 就地改色：立即套用畫面，停手 0.8 秒後寫入 */
const setColor = (key, hex) => {
  const color = normalizeHex(hex);
  if (!color) return;
  if (!lastSavedSettings) lastSavedSettings = currentSettings();
  const s = currentSettings();
  const colors = { ...(s.colors || {}) };
  if (color === defaultColors.value[key]) delete colors[key];
  else colors[key] = color;
  const next = { ...s, colors };
  emit('update:settings', next);
  pendingSettings = next;
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = setTimeout(flushSave, 800);
};

const settingsOpen = ref(false);
const saveSettings = async (settings) => {
  lastSavedSettings = currentSettings();
  emit('update:settings', settings);
  if (await persist(settings)) emit('notify', '已儲存交屋控管表設定', 'success');
};

// ───── 改色彈出框 ─────
const colorPop = reactive({ key: null, x: 0, y: 0 });
const colorPopEl = ref(null);
const openColorPop = (e, key) => {
  hideHover();
  if (colorPop.key === key) { closeColorPop(); return; }
  const rect = e.currentTarget.getBoundingClientRect();
  const w = 268;
  colorPop.key = key;
  colorPop.x = Math.max(8, Math.min(rect.left - 8, window.innerWidth - w - 8));
  colorPop.y = Math.min(rect.bottom + 8, window.innerHeight - 260);
};
const closeColorPop = () => {
  if (!colorPop.key) return;
  colorPop.key = null;
  flushSave();
};
const onDocPointerDown = (e) => {
  if (!colorPop.key) return;
  if (colorPopEl.value?.contains(e.target)) return;
  if (e.target.closest?.('.hb-swatch')) return;
  closeColorPop();
};
const onKeydown = (e) => { if (e.key === 'Escape') closeColorPop(); };

// ───── 複製圖片 ─────
const isTouchDevice = typeof window !== 'undefined' && (navigator.maxTouchPoints || 0) > 0 && !canHover;
const copying = ref(false);
const imagePreview = reactive({ show: false, url: '', blob: null });
const filterText = computed(() => {
  const parts = [];
  if (activeStatuses.value.length > 0) parts.push(`篩選：${activeStatuses.value.map(k => statusLabel.value[k]).join('、')}`);
  if (searchText.value) parts.push(`搜尋：${String(search.value).trim()}`);
  return parts.join('　');
});
const imageFile = () => new File([imagePreview.blob], handoverImageFileName(props.projectName), { type: 'image/png' });
const canShareImage = computed(() => {
  if (!imagePreview.blob || !isTouchDevice || typeof navigator.canShare !== 'function') return false;
  try { return navigator.canShare({ files: [imageFile()] }); } catch (_) { return false; }
});
const openImagePreview = (blob) => {
  if (imagePreview.url) URL.revokeObjectURL(imagePreview.url);
  imagePreview.blob = blob;
  imagePreview.url = URL.createObjectURL(blob);
  imagePreview.show = true;
};
const copyImage = async () => {
  if (copying.value) return;
  copying.value = true;
  hideHover();
  // 先開始產生圖片，並在點擊當下就呼叫剪貼簿（Safari 要求在使用者操作內寫入）
  const pngPromise = renderHandoverPng(board.value, {
    projectName: props.projectName,
    updatedAt: lastUpdated.value,
    isMatch: isFiltering.value ? matches : null,
    filterText: filterText.value,
    activeStatuses: [...activeStatuses.value],
  });
  pngPromise.catch(() => {}); // 錯誤在下方處理，避免未處理的 rejection
  try {
    if (!canCopyImage()) throw new Error('瀏覽器不支援複製圖片');
    await copyPngToClipboard(pngPromise);
    emit('notify', '已複製圖片，可直接貼上', 'success');
  } catch (err) {
    console.warn('寫入剪貼簿失敗，改開預覽:', err);
    try {
      openImagePreview(await pngPromise);
    } catch (renderErr) {
      console.error('產生交屋控管表圖片失敗:', renderErr);
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
  a.download = handoverImageFileName(props.projectName);
  document.body.appendChild(a);
  a.click();
  a.remove();
};
const shareImage = async () => {
  try {
    await navigator.share({ files: [imageFile()], title: `${props.projectName} 交屋控管表` });
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

// ───── 下載 Excel ─────
const exporting = ref(false);
const exportExcel = async () => {
  exporting.value = true;
  try {
    await downloadHandoverExcel(board.value, { projectName: props.projectName, updatedAt: new Date() });
  } catch (err) {
    console.error('下載交屋控管表失敗:', err);
    emit('notify', `下載失敗：${err.message || err}`, 'error');
  } finally {
    exporting.value = false;
  }
};

// ───── 版面：統計放右側或下方 ─────
// 依實際可用寬度判斷（左側選單展開／收合會改變寬度）：右側放不下矩陣、移到下方就能完整顯示時，統計排到下方
const STATS_SIDE_W = 260 + 14;
const bodyEl = ref(null);
const tableEl = ref(null);
const statsStacked = ref(false);
let layoutObserver = null;
const measureLayout = () => {
  const body = bodyEl.value;
  if (!body) return;
  const avail = body.clientWidth;
  const need = (tableEl.value?.offsetWidth || 0) + 12;
  statsStacked.value = window.innerWidth < 1100 || (need + STATS_SIDE_W > avail && need <= avail);
};

onMounted(() => {
  if (typeof ResizeObserver === 'function') {
    // 下一幀才量測，避免在 ResizeObserver 回呼中改版面造成循環警告
    layoutObserver = new ResizeObserver(() => requestAnimationFrame(measureLayout));
    if (bodyEl.value) layoutObserver.observe(bodyEl.value);
  }
  measureLayout();
  document.addEventListener('pointerdown', onDocPointerDown, true);
  document.addEventListener('keydown', onKeydown);
  window.addEventListener('scroll', hideHover, true);
  todayTimer = setInterval(() => {
    const now = new Date();
    if (now.toDateString() !== today.value.toDateString()) today.value = now;
  }, 10 * 60 * 1000);
});
// 欄數或樓層數變動（設定、資料更新）後重新量測
watch(() => [board.value.cols.length, board.value.floors.length], () => nextTick(measureLayout));

onBeforeUnmount(() => {
  layoutObserver?.disconnect();
  document.removeEventListener('pointerdown', onDocPointerDown, true);
  document.removeEventListener('keydown', onKeydown);
  window.removeEventListener('scroll', hideHover, true);
  if (todayTimer) clearInterval(todayTimer);
  flushSave();
});

// 統計：進度 KPI（與圖片共用）
const kpis = computed(() => boardKpis(board.value));

</script>

<style scoped>
.hb {
  --hb-text: #1d1d1f;
  --hb-sub: #6e6e73;
  --hb-line: rgba(0, 0, 0, 0.08);
  --hb-bg: #f5f5f7;
  color: var(--hb-text);
  font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", "Helvetica Neue", "PingFang TC", "Noto Sans TC", sans-serif;
  font-size: 13px;
}

/* 工具列 */
.hb-toolbar {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 10px;
}
.hb-search { flex: 0 1 260px; min-width: 180px; }
.hb-match { font-size: 12.5px; font-weight: 600; color: #0058b0; white-space: nowrap; }
.hb-spacer { flex: 1 1 auto; }
.hb-updated { font-size: 12px; color: var(--hb-sub); white-space: nowrap; }

/* 圖例 */
.hb-legend {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 12px;
}
.hb-legend-item {
  display: inline-flex;
  align-items: center;
  gap: 2px;
  padding: 2px 4px 2px 3px;
  border-radius: 8px;
  background: #fff;
  box-shadow: 0 0 0 0.5px rgba(0, 0, 0, 0.1), 0 0.5px 1px rgba(0, 0, 0, 0.05);
  transition: opacity 0.15s, box-shadow 0.15s;
}
.hb-legend-item.is-active { box-shadow: 0 0 0 2px #0071e3; }
.hb-legend-item.is-muted { opacity: 0.5; }
.hb-swatch {
  width: 20px;
  height: 20px;
  flex-shrink: 0;
  border: 0;
  border-radius: 6px;
  box-shadow: inset 0 0 0 0.5px rgba(0, 0, 0, 0.18);
  cursor: pointer;
  transition: transform 0.12s;
}
.hb-swatch:hover { transform: scale(1.12); }
.hb-legend-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 3px 6px;
  border: 0;
  border-radius: 6px;
  background: transparent;
  color: var(--hb-text);
  font-family: inherit;
  font-size: 12.5px;
  font-weight: 500;
  line-height: 1.3;
  white-space: nowrap;
  cursor: pointer;
}
.hb-legend-btn:hover { background: rgba(0, 0, 0, 0.05); }
.hb-legend-count {
  min-width: 18px;
  padding: 0 5px;
  border-radius: 9px;
  background: rgba(0, 0, 0, 0.06);
  color: var(--hb-sub);
  font-size: 11.5px;
  font-weight: 600;
  text-align: center;
}

/* 版面：矩陣＋統計 */
.hb-body {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 260px;
  gap: 14px;
  align-items: start;
}
.hb-card {
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 0 0 0.5px rgba(0, 0, 0, 0.1), 0 1px 3px rgba(0, 0, 0, 0.05);
}
.hb-matrix-card { min-width: 0; overflow: hidden; }
.hb-empty { padding: 48px 16px; text-align: center; color: #8e8e93; }
.hb-scroll {
  overflow: auto;
  max-height: calc(100vh - 260px);
  min-height: 200px;
  -webkit-overflow-scrolling: touch;
}

/* 矩陣表格 */
.hb-table {
  border-collapse: separate;
  border-spacing: 3px;
  margin: 0 auto;
  padding: 0 4px 6px;
}
.hb-table th {
  position: sticky;
  top: 0;
  z-index: 2;
  background: #fff;
  color: var(--hb-sub);
  font-size: 12px;
  font-weight: 600;
  white-space: nowrap;
  text-align: center;
}
.hb-tower-row th { height: 24px; color: var(--hb-text); font-size: 12.5px; }
.hb-tower-row + .hb-col-row th { top: 27px; }
.hb-tower {
  border-bottom: 2px solid #e5e5ea;
}
.hb-col-row th { height: 28px; }
.hb-col { min-width: 66px; color: var(--hb-text) !important; }
tbody .hb-floor {
  position: sticky;
  z-index: 1;
  top: auto;
  padding: 0 6px;
}
.hb-sticky-left { left: 0; }
.hb-sticky-right { right: 0; }
thead .hb-sticky-left, thead .hb-sticky-right { z-index: 3; }
.hb-floor { min-width: 40px; font-variant-numeric: tabular-nums; }
.hb-gap { width: 8px; min-width: 8px; padding: 0; background: transparent !important; }
.hb-td { padding: 0; }

.hb-cell {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1px;
  width: 100%;
  min-width: 66px;
  min-height: 40px;
  padding: 3px 4px;
  border: 0;
  border-radius: 7px;
  box-shadow: inset 0 0 0 0.5px rgba(0, 0, 0, 0.1);
  font-family: inherit;
  line-height: 1.2;
  text-align: center;
  cursor: pointer;
  transition: transform 0.12s, opacity 0.15s, box-shadow 0.12s;
  -webkit-tap-highlight-color: transparent;
}
.hb-cell:hover { transform: scale(1.06); box-shadow: inset 0 0 0 0.5px rgba(0, 0, 0, 0.1), 0 3px 10px rgba(0, 0, 0, 0.16); position: relative; z-index: 1; }
.hb-cell:focus-visible { outline: 2px solid #0071e3; outline-offset: 1px; }
.hb-cell.is-dim { opacity: 0.18; }
.hb-cell.is-hit { box-shadow: inset 0 0 0 0.5px rgba(0, 0, 0, 0.1), 0 0 0 2px #0071e3; }
.hb-cell-label { font-size: 12px; font-weight: 600; overflow-wrap: anywhere; }
.hb-cell-date { font-size: 10.5px; font-weight: 500; opacity: 0.8; font-variant-numeric: tabular-nums; }
.hb-cell-unit { font-size: 11px; font-weight: 700; opacity: 0.85; }

/* 店面／其他 */
.hb-special {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 10px 12px 12px;
  border-top: 1px solid var(--hb-line);
}
.hb-special.is-only { border-top: 0; }
.hb-special-label {
  flex-shrink: 0;
  min-width: 40px;
  padding-top: 12px;
  color: var(--hb-sub);
  font-size: 12px;
  font-weight: 600;
  text-align: center;
}
.hb-special-list { display: flex; flex-wrap: wrap; gap: 4px; min-width: 0; }
.hb-cell--special { width: auto; min-width: 70px; min-height: 48px; }

/* 統計 */
.hb-stats { display: flex; flex-direction: column; gap: 10px; }
.hb-stat-card { padding: 12px 14px; }
.hb-stat-title {
  display: flex;
  align-items: baseline;
  gap: 6px;
  margin-bottom: 8px;
  color: var(--hb-sub);
  font-size: 11.5px;
  font-weight: 600;
  letter-spacing: 0.02em;
}
.hb-stat-sub { font-weight: 500; color: #8e8e93; }
.hb-total { display: flex; align-items: baseline; gap: 4px; margin-bottom: 8px; }
.hb-total b { font-size: 28px; font-weight: 700; letter-spacing: -0.02em; font-variant-numeric: tabular-nums; }
.hb-total span { color: var(--hb-sub); }
.hb-stat-row {
  display: flex;
  align-items: center;
  gap: 6px;
  min-height: 24px;
}
.hb-stat-row b { font-size: 14px; font-variant-numeric: tabular-nums; }
.hb-stat-label { flex: 1 1 auto; min-width: 0; overflow-wrap: anywhere; }
.hb-pct { min-width: 44px; color: var(--hb-sub); font-size: 12px; text-align: right; font-variant-numeric: tabular-nums; }
.hb-stat-row--sub { min-height: 22px; color: var(--hb-sub); font-size: 12.5px; }
.hb-stat-row--sub b { font-size: 12.5px; color: var(--hb-text); margin-right: 50px; }
.hb-kpi + .hb-kpi { margin-top: 8px; }
.hb-dot {
  display: inline-block;
  width: 10px;
  height: 10px;
  flex-shrink: 0;
  border-radius: 3px;
  box-shadow: inset 0 0 0 0.5px rgba(0, 0, 0, 0.18);
}
.hb-bar {
  display: flex;
  height: 6px;
  margin: 3px 0 2px;
  overflow: hidden;
  border-radius: 3px;
  background: rgba(0, 0, 0, 0.06);
}
.hb-bar span { display: block; height: 100%; border-radius: 3px; transition: width 0.3s; box-shadow: inset 0 0 0 0.5px rgba(0, 0, 0, 0.1); }
.hb-bar--split { height: 8px; margin-bottom: 8px; }
.hb-bar--split span { border-radius: 0; }

/* 滑過摘要 */
.hb-hover {
  position: fixed;
  z-index: 2300;
  width: 220px;
  padding: 10px 12px;
  border-radius: 10px;
  background: rgba(250, 250, 252, 0.97);
  -webkit-backdrop-filter: saturate(180%) blur(20px);
  backdrop-filter: saturate(180%) blur(20px);
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.18), 0 0 0 0.5px rgba(0, 0, 0, 0.12);
  pointer-events: none;
  font-size: 12.5px;
}
.hb-hover-head { display: flex; align-items: baseline; gap: 8px; margin-bottom: 4px; }
.hb-hover-head b { font-size: 14px; }
.hb-hover-head span { color: var(--hb-sub); overflow-wrap: anywhere; }
.hb-hover-status { display: flex; align-items: center; gap: 6px; padding-bottom: 6px; margin-bottom: 4px; border-bottom: 1px solid var(--hb-line); font-weight: 600; }
.hb-hover-row { display: flex; justify-content: space-between; gap: 8px; min-height: 20px; color: var(--hb-sub); }
.hb-hover-row span:last-child { color: var(--hb-text); text-align: right; }

/* 改色彈出框 */
.hb-color-pop {
  position: fixed;
  z-index: 2350;
  width: 268px;
  padding: 10px;
  border-radius: 12px;
  background: rgba(250, 250, 252, 0.98);
  -webkit-backdrop-filter: saturate(180%) blur(20px);
  backdrop-filter: saturate(180%) blur(20px);
  box-shadow: 0 12px 36px rgba(0, 0, 0, 0.2), 0 0 0 0.5px rgba(0, 0, 0, 0.12);
}
.hb-color-pop-title { display: flex; align-items: center; gap: 6px; margin-bottom: 8px; font-size: 13px; font-weight: 600; }

/* 圖片預覽 */
.hb-preview-body { max-height: 75vh; overflow: auto; padding: 12px 16px 16px; background: #f5f5f7; }
.hb-preview-note { margin-bottom: 10px; }
.hb-preview-img {
  display: block;
  max-width: 100%;
  height: auto;
  margin: 0 auto;
  border-radius: 8px;
  box-shadow: 0 0 0 0.5px rgba(0, 0, 0, 0.12), 0 4px 14px rgba(0, 0, 0, 0.08);
  -webkit-touch-callout: default;
}

/* 統計排到矩陣下方（寬度不足時，由 measureLayout 判斷） */
.hb-body.is-stacked { grid-template-columns: minmax(0, 1fr); }
.hb-body.is-stacked .hb-stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); align-items: start; }
@media (max-width: 600px) {
  .hb-toolbar { gap: 6px; }
  .hb-search { flex: 1 1 140px; min-width: 0; }
  .hb-toolbar > .mac-btn { padding: 0 9px; }
  .hb-updated { display: none; }
  .hb-scroll { max-height: 70vh; }
  .hb-col { min-width: 60px; }
  .hb-cell { min-width: 60px; }
  .hb-stats { grid-template-columns: minmax(0, 1fr); }
}
</style>
