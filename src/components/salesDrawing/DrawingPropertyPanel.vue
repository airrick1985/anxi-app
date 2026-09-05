<template>
  <div class="dpp-root">
    <v-tabs v-model="tab" density="compact" color="primary" grow>
      <v-tab value="props"><v-icon start size="18">mdi-tune-variant</v-icon>屬性</v-tab>
      <v-tab value="layers"><v-icon start size="18">mdi-layers-outline</v-icon>圖層 <span class="text-caption ml-1">({{ layers.length }})</span></v-tab>
    </v-tabs>
    <v-divider />

    <!-- ===== 屬性 ===== -->
    <div v-show="tab === 'props'" class="dpp-scroll">
      <!-- 無選取 -->
      <div v-if="!selection.length" class="dpp-empty">
        <v-icon size="36" color="grey-lighten-1">mdi-cursor-default-click-outline</v-icon>
        <div class="text-body-2 text-grey mt-2">點選畫布上的元素以編輯屬性</div>
        <div class="text-caption text-grey mt-3">
          畫布 {{ canvasSize.width }} × {{ canvasSize.height }} px<br />
          滾輪縮放・空白鍵＋拖曳平移<br />
          Ctrl+Z 復原・Del 刪除・Ctrl+D 複製
        </div>
        <v-switch v-model="api.snapEnabled.value" label="對齊吸附" density="compact" hide-details color="primary" class="mt-3" />
      </div>

      <template v-else>
        <!-- 通用操作 -->
        <div class="dpp-section">
          <div class="dpp-section-title">
            {{ selectionLabel }}
            <span class="text-caption text-grey ml-1" v-if="selection.length > 1">（{{ selection.length }} 個）</span>
          </div>
          <div class="dpp-actions">
            <v-btn size="small" variant="tonal" prepend-icon="mdi-content-duplicate" @click="api.duplicateSelected()">複製</v-btn>
            <v-btn size="small" variant="tonal" :prepend-icon="allLocked ? 'mdi-lock-open-variant-outline' : 'mdi-lock-outline'" @click="toggleLock">{{ allLocked ? '解鎖' : '鎖定' }}</v-btn>
            <v-btn size="small" variant="tonal" color="error" prepend-icon="mdi-delete-outline" :disabled="allLocked" @click="api.removeSelected()">刪除</v-btn>
          </div>
          <div class="dpp-actions mt-1">
            <v-btn size="small" variant="text" icon="mdi-arrange-bring-to-front" title="置頂" @click="api.reorder('front')" />
            <v-btn size="small" variant="text" icon="mdi-arrange-bring-forward" title="上移一層" @click="api.reorder('forward')" />
            <v-btn size="small" variant="text" icon="mdi-arrange-send-backward" title="下移一層" @click="api.reorder('backward')" />
            <v-btn size="small" variant="text" icon="mdi-arrange-send-to-back" title="置底" @click="api.reorder('back')" />
          </div>
        </div>

        <!-- ===== 資訊卡 ===== -->
        <template v-if="type === 'infoCard'">
          <v-expansion-panels v-model="cardPanels" multiple variant="accordion" class="dpp-panels">
            <v-expansion-panel value="content" v-if="selection.length === 1">
              <v-expansion-panel-title>內容</v-expansion-panel-title>
              <v-expansion-panel-text>
                <div class="d-flex align-center ga-2 mb-2">
                  <v-switch v-model="card.headerShow" label="標題列" density="compact" hide-details color="primary" @update:model-value="applyCard(o => { o.cardHeader.show = $event; })" />
                  <v-text-field v-model="card.headerText" density="compact" variant="outlined" hide-details placeholder="標題文字" :disabled="!card.headerShow" @update:model-value="applyCardLive(o => { o.cardHeader.text = $event; o.cardHeader.overridden = true; })" @change="api.pushHistory()" />
                </div>
                <div class="text-caption text-grey mb-1">項目名稱／欄位值（修改不影響原始戶別資料）</div>
                <draggable v-model="card.rows" item-key="_k" handle=".dpp-drag" class="dpp-rows" ghost-class="dpp-ghost" @end="commitRows">
                  <template #item="{ element: row, index }">
                    <div class="dpp-row" :class="{ 'is-overridden': row.labelOverridden || row.valueOverridden }">
                      <v-icon size="16" class="dpp-drag text-grey">mdi-drag-vertical</v-icon>
                      <input v-model="row.label" class="dpp-input" placeholder="項目" @input="onRowInput(row, 'label')" @change="commitRows" />
                      <input v-model="row.value" class="dpp-input dpp-input--value" placeholder="值" @input="onRowInput(row, 'value')" @change="commitRows" />
                      <v-btn v-if="row.fieldKey && (row.labelOverridden || row.valueOverridden)" icon="mdi-restore" size="x-small" variant="text" title="還原為戶別資料" @click="restoreRow(index)" />
                      <v-btn icon="mdi-close" size="x-small" variant="text" title="刪除此列" @click="removeRow(index)" />
                    </div>
                  </template>
                </draggable>
                <div class="d-flex ga-1 mt-2">
                  <v-btn size="x-small" variant="tonal" prepend-icon="mdi-plus" @click="addManualRow">新增手動列</v-btn>
                  <v-btn size="x-small" variant="tonal" prepend-icon="mdi-refresh" @click="emit('refresh-data')">重新整理資料</v-btn>
                </div>
              </v-expansion-panel-text>
            </v-expansion-panel>

            <v-expansion-panel value="style">
              <v-expansion-panel-title>樣式</v-expansion-panel-title>
              <v-expansion-panel-text>
                <ColorField v-model="card.style.fill" label="底色" :recent="recentColors" @update:model-value="applyStyle('fill', $event)" />
                <div class="dpp-slider-row">
                  <span class="dpp-label">透明度</span>
                  <v-slider v-model="card.style.opacity" :min="0" :max="1" :step="0.05" density="compact" hide-details @update:model-value="applyStyle('opacity', $event)" />
                  <span class="dpp-num">{{ Math.round(card.style.opacity * 100) }}%</span>
                </div>
                <ColorField v-model="card.style.stroke" label="邊框顏色" :recent="recentColors" @update:model-value="applyStyle('stroke', $event)" />
                <div class="dpp-slider-row">
                  <span class="dpp-label">邊框粗細</span>
                  <v-slider v-model="card.style.strokeWidth" :min="0" :max="10" :step="0.5" density="compact" hide-details @update:model-value="applyStyle('strokeWidth', $event)" />
                  <span class="dpp-num">{{ card.style.strokeWidth }}</span>
                </div>
                <div class="dpp-slider-row">
                  <span class="dpp-label">圓角</span>
                  <v-slider v-model="card.style.borderRadius" :min="0" :max="24" :step="1" density="compact" hide-details @update:model-value="applyStyle('borderRadius', $event)" />
                  <span class="dpp-num">{{ card.style.borderRadius }}</span>
                </div>
                <ColorField v-model="card.style.innerStroke" label="格線顏色" :recent="recentColors" @update:model-value="applyStyle('innerStroke', $event)" />
                <div class="dpp-slider-row">
                  <span class="dpp-label">格線粗細</span>
                  <v-slider v-model="card.style.innerStrokeWidth" :min="0" :max="4" :step="0.5" density="compact" hide-details @update:model-value="applyStyle('innerStrokeWidth', $event)" />
                  <span class="dpp-num">{{ card.style.innerStrokeWidth }}</span>
                </div>
                <v-divider class="my-2" />
                <ColorField v-model="card.style.headerFill" label="標題列底色" :recent="recentColors" @update:model-value="applyStyle('headerFill', $event)" />
                <ColorField v-model="card.style.headerTextColor" label="標題列文字" :recent="recentColors" @update:model-value="applyStyle('headerTextColor', $event)" />
                <ColorField v-model="card.style.labelFill" label="項目欄底色" allow-transparent :recent="recentColors" @update:model-value="applyStyle('labelFill', $event)" />
                <ColorField v-model="card.style.labelTextColor" label="項目欄文字" :recent="recentColors" @update:model-value="applyStyle('labelTextColor', $event)" />
                <ColorField v-model="card.style.valueTextColor" label="值欄文字" :recent="recentColors" @update:model-value="applyStyle('valueTextColor', $event)" />
                <v-divider class="my-2" />
                <div class="dpp-slider-row">
                  <span class="dpp-label">字級</span>
                  <v-slider v-model="card.style.fontSize" :min="8" :max="48" :step="1" density="compact" hide-details @update:model-value="applyStyle('fontSize', $event)" />
                  <span class="dpp-num">{{ card.style.fontSize }}</span>
                </div>
                <div class="d-flex align-center ga-2 mt-1">
                  <v-btn-toggle v-model="card.style.fontWeight" mandatory density="compact" variant="outlined" divided @update:model-value="applyStyle('fontWeight', $event)">
                    <v-btn value="normal" size="x-small">一般</v-btn>
                    <v-btn value="bold" size="x-small" icon="mdi-format-bold" />
                  </v-btn-toggle>
                  <span class="dpp-label">項目</span>
                  <v-btn-toggle v-model="card.style.labelAlign" mandatory density="compact" variant="outlined" divided @update:model-value="applyStyle('labelAlign', $event)">
                    <v-btn value="left" size="x-small" icon="mdi-format-align-left" />
                    <v-btn value="center" size="x-small" icon="mdi-format-align-center" />
                    <v-btn value="right" size="x-small" icon="mdi-format-align-right" />
                  </v-btn-toggle>
                </div>
                <div class="d-flex align-center ga-2 mt-1">
                  <span class="dpp-label">值</span>
                  <v-btn-toggle v-model="card.style.valueAlign" mandatory density="compact" variant="outlined" divided @update:model-value="applyStyle('valueAlign', $event)">
                    <v-btn value="left" size="x-small" icon="mdi-format-align-left" />
                    <v-btn value="center" size="x-small" icon="mdi-format-align-center" />
                    <v-btn value="right" size="x-small" icon="mdi-format-align-right" />
                  </v-btn-toggle>
                </div>
                <div class="d-flex flex-wrap ga-1 mt-3">
                  <v-btn size="x-small" variant="tonal" prepend-icon="mdi-pin-outline" @click="setCardDefault">設為預設</v-btn>
                  <v-btn size="x-small" variant="tonal" prepend-icon="mdi-select-all" @click="applyStyleToAllCards">套用到所有資訊卡</v-btn>
                </div>
              </v-expansion-panel-text>
            </v-expansion-panel>

            <v-expansion-panel value="layout">
              <v-expansion-panel-title>版面</v-expansion-panel-title>
              <v-expansion-panel-text>
                <v-switch v-model="card.showLabelColumn" label="顯示項目欄" density="compact" hide-details color="primary" @update:model-value="applyCard(o => { o.cardLayout.showLabelColumn = $event; o.cardLayout.colWidths = null; })" />
                <div class="dpp-slider-row">
                  <span class="dpp-label">內距</span>
                  <v-slider v-model="card.padding" :min="0" :max="20" :step="1" density="compact" hide-details @update:model-value="applyCard(o => { o.cardLayout.padding = $event; })" />
                  <span class="dpp-num">{{ card.padding }}</span>
                </div>
                <div class="dpp-slider-row">
                  <span class="dpp-label">標題列高</span>
                  <v-slider v-model="card.headerHeight" :min="18" :max="80" :step="1" density="compact" hide-details @update:model-value="applyCard(o => { o.cardLayout.headerHeight = $event; })" />
                  <span class="dpp-num">{{ card.headerHeight }}</span>
                </div>
                <div class="dpp-slider-row">
                  <span class="dpp-label">縮放</span>
                  <v-slider v-model="card.scale" :min="0.2" :max="5" :step="0.05" density="compact" hide-details @update:model-value="applyCard(o => { o.set({ scaleX: $event, scaleY: $event }); })" />
                  <span class="dpp-num">{{ Math.round(card.scale * 100) }}%</span>
                </div>
                <div class="text-caption text-grey mt-1">選取單張卡片時，卡片上方三角把手可調欄寬、左側把手可調列高；四角等比縮放、邊中點拉伸不改字級。</div>
                <div class="d-flex flex-wrap ga-1 mt-2">
                  <v-btn size="x-small" variant="tonal" prepend-icon="mdi-table-refresh" @click="applyCard(o => o.resetLayout())">重設格線</v-btn>
                  <v-btn size="x-small" variant="tonal" prepend-icon="mdi-content-copy" :disabled="selection.length !== 1" @click="emit('use-template')">以此卡為範本套用到其他戶別</v-btn>
                </div>
              </v-expansion-panel-text>
            </v-expansion-panel>
          </v-expansion-panels>
        </template>

        <!-- ===== 線段／箭頭 ===== -->
        <div v-else-if="type === 'arrow'" class="dpp-section">
          <ColorField v-model="line.stroke" label="顏色" :recent="recentColors" @update:model-value="applyLine(o => o.set('stroke', $event))" />
          <div class="dpp-slider-row">
            <span class="dpp-label">粗細</span>
            <v-slider v-model="line.strokeWidth" :min="1" :max="16" :step="1" density="compact" hide-details @update:model-value="applyLine(o => o.set('strokeWidth', $event))" />
            <span class="dpp-num">{{ line.strokeWidth }}</span>
          </div>
          <div class="d-flex align-center ga-2 mt-1">
            <span class="dpp-label">線型</span>
            <v-btn-toggle v-model="line.dashKind" mandatory density="compact" variant="outlined" divided @update:model-value="applyLine(o => o.set('strokeDashArray', dashFor($event, o.strokeWidth)))">
              <v-btn value="solid" size="x-small">實線</v-btn>
              <v-btn value="dashed" size="x-small">虛線</v-btn>
              <v-btn value="dotted" size="x-small">點線</v-btn>
            </v-btn-toggle>
          </div>
          <div class="d-flex align-center ga-3 mt-2">
            <v-switch v-model="line.arrowStart" label="起點箭頭" density="compact" hide-details color="primary" @update:model-value="applyLine(o => { o.arrowStart = $event; })" />
            <v-switch v-model="line.arrowEnd" label="終點箭頭" density="compact" hide-details color="primary" @update:model-value="applyLine(o => { o.arrowEnd = $event; })" />
          </div>
          <div class="dpp-slider-row">
            <span class="dpp-label">箭頭大小</span>
            <v-slider v-model="line.arrowSize" :min="6" :max="40" :step="1" density="compact" hide-details @update:model-value="applyLine(o => { o.arrowSize = $event; })" />
            <span class="dpp-num">{{ line.arrowSize }}</span>
          </div>
          <v-btn size="x-small" variant="tonal" prepend-icon="mdi-pin-outline" class="mt-2" @click="setLineDefault">設為預設</v-btn>
        </div>

        <!-- ===== 文字 ===== -->
        <div v-else-if="type === 'textbox'" class="dpp-section">
          <div class="dpp-slider-row">
            <span class="dpp-label">字級</span>
            <v-slider v-model="text.fontSize" :min="8" :max="120" :step="1" density="compact" hide-details @update:model-value="applyText(o => o.set('fontSize', $event))" />
            <span class="dpp-num">{{ text.fontSize }}</span>
          </div>
          <div class="d-flex align-center ga-2 mt-1">
            <v-btn-toggle v-model="text.fontWeight" mandatory density="compact" variant="outlined" divided @update:model-value="applyText(o => o.set('fontWeight', $event))">
              <v-btn value="normal" size="x-small">一般</v-btn>
              <v-btn value="bold" size="x-small" icon="mdi-format-bold" />
            </v-btn-toggle>
            <v-btn-toggle v-model="text.align" mandatory density="compact" variant="outlined" divided @update:model-value="applyText(o => o.set('textAlign', $event))">
              <v-btn value="left" size="x-small" icon="mdi-format-align-left" />
              <v-btn value="center" size="x-small" icon="mdi-format-align-center" />
              <v-btn value="right" size="x-small" icon="mdi-format-align-right" />
            </v-btn-toggle>
          </div>
          <ColorField v-model="text.color" label="文字顏色" :recent="recentColors" @update:model-value="applyText(o => o.set('fill', $event))" />
          <ColorField v-model="text.background" label="背景色" allow-transparent :recent="recentColors" @update:model-value="applyText(o => o.set('backgroundColor', $event === 'transparent' ? '' : $event))" />
          <v-btn size="x-small" variant="tonal" prepend-icon="mdi-pin-outline" class="mt-2" @click="setTextDefault">設為預設</v-btn>
        </div>

        <!-- ===== 形狀 ===== -->
        <div v-else-if="type === 'rect' || type === 'ellipse'" class="dpp-section">
          <ColorField v-model="shape.fill" label="填色" allow-transparent :recent="recentColors" @update:model-value="applyShape(o => o.set('fill', $event === 'transparent' ? '' : $event))" />
          <ColorField v-model="shape.stroke" label="邊框顏色" :recent="recentColors" @update:model-value="applyShape(o => o.set('stroke', $event))" />
          <div class="dpp-slider-row">
            <span class="dpp-label">邊框粗細</span>
            <v-slider v-model="shape.strokeWidth" :min="0" :max="16" :step="1" density="compact" hide-details @update:model-value="applyShape(o => o.set('strokeWidth', $event))" />
            <span class="dpp-num">{{ shape.strokeWidth }}</span>
          </div>
          <div class="d-flex align-center ga-2 mt-1">
            <span class="dpp-label">線型</span>
            <v-btn-toggle v-model="shape.dashKind" mandatory density="compact" variant="outlined" divided @update:model-value="applyShape(o => o.set('strokeDashArray', dashFor($event, o.strokeWidth)))">
              <v-btn value="solid" size="x-small">實線</v-btn>
              <v-btn value="dashed" size="x-small">虛線</v-btn>
              <v-btn value="dotted" size="x-small">點線</v-btn>
            </v-btn-toggle>
          </div>
          <div v-if="type === 'rect'" class="dpp-slider-row">
            <span class="dpp-label">圓角</span>
            <v-slider v-model="shape.borderRadius" :min="0" :max="80" :step="1" density="compact" hide-details @update:model-value="applyShape(o => o.set({ rx: $event, ry: $event }))" />
            <span class="dpp-num">{{ shape.borderRadius }}</span>
          </div>
          <v-btn size="x-small" variant="tonal" prepend-icon="mdi-pin-outline" class="mt-2" @click="setShapeDefault">設為預設</v-btn>
        </div>

        <div v-else class="dpp-section text-caption text-grey">已選取多種元素，可進行複製／鎖定／刪除／順序調整。</div>
      </template>
    </div>

    <!-- ===== 圖層 ===== -->
    <div v-show="tab === 'layers'" class="dpp-scroll">
      <div v-if="!layers.length" class="dpp-empty text-caption text-grey">尚無元素</div>
      <draggable v-model="layers" item-key="id" handle=".dpp-drag" class="dpp-layers" ghost-class="dpp-ghost" @end="onLayerDrop">
        <template #item="{ element: l }">
          <div class="dpp-layer" :class="{ 'is-active': selectedIds.has(l.id), 'is-hidden': l.hidden }" @click="api.selectById(l.id)">
            <v-icon size="16" class="dpp-drag text-grey">mdi-drag-vertical</v-icon>
            <v-icon size="16" :color="l.color">{{ l.icon }}</v-icon>
            <span class="dpp-layer-name text-truncate">{{ l.name }}</span>
            <v-btn :icon="l.hidden ? 'mdi-eye-off-outline' : 'mdi-eye-outline'" size="x-small" variant="text" @click.stop="api.setHidden(l.obj, !l.hidden)" />
            <v-btn :icon="l.locked ? 'mdi-lock' : 'mdi-lock-open-variant-outline'" size="x-small" variant="text" :color="l.locked ? 'warning' : undefined" @click.stop="api.setLocked(l.obj, !l.locked)" />
          </div>
        </template>
      </draggable>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, watch, inject } from 'vue';
import draggable from 'vuedraggable';
import ColorField from './ColorField.vue';

const props = defineProps({
  recentColors: { type: Array, default: () => [] },
  infoCardDefault: { type: Object, default: null },
});
const emit = defineEmits(['refresh-data', 'use-template', 'set-card-default']);

const api = inject('drawingCanvas');
const tab = ref('props');
const cardPanels = ref(['content', 'style']);

const selection = computed(() => { void api.selectionVersion.value; return api.selected.value; });
const type = computed(() => api.selectionType.value);
const canvasSize = computed(() => api.canvasSize.value);
const first = computed(() => selection.value[0] || null);
const allLocked = computed(() => selection.value.length > 0 && selection.value.every(o => o.locked));
const selectedIds = computed(() => new Set(selection.value.map(o => o.elementId)));

const TYPE_LABELS = { infoCard: '資訊卡', arrow: '線段／箭頭', textbox: '文字', rect: '矩形', ellipse: '橢圓', mixed: '多種元素' };
const selectionLabel = computed(() => {
  if (type.value === 'infoCard' && selection.value.length === 1) return `資訊卡 ${first.value.unitId || ''}`;
  return TYPE_LABELS[type.value] || '元素';
});

/* ---- 本地表單（自 fabric 物件複製，避免直接綁定非響應式物件） ---- */
const card = reactive({ headerShow: true, headerText: '', rows: [], style: {}, showLabelColumn: true, padding: 6, headerHeight: 32, scale: 1 });
const line = reactive({ stroke: '#000', strokeWidth: 3, dashKind: 'solid', arrowStart: false, arrowEnd: true, arrowSize: 14 });
const text = reactive({ fontSize: 24, fontWeight: 'bold', align: 'left', color: '#000', background: '' });
const shape = reactive({ fill: '', stroke: '#000', strokeWidth: 2, dashKind: 'solid', borderRadius: 0 });
let syncing = false;
let rowKeySeq = 0;

function dashKindOf(arr) {
  if (!Array.isArray(arr) || !arr.length) return 'solid';
  return arr[0] <= arr[1] ? 'dotted' : 'dashed';
}
function dashFor(kind, sw) {
  const w = Math.max(1, sw || 1);
  if (kind === 'dashed') return [Math.max(6, w * 4), Math.max(4, w * 3)];
  if (kind === 'dotted') return [Math.max(1, w), Math.max(3, w * 2.5)];
  return null;
}

function syncFromSelection() {
  syncing = true;
  const o = first.value;
  if (o && o.type === 'infoCard') {
    card.headerShow = !!o.cardHeader.show;
    card.headerText = o.cardHeader.text || '';
    card.rows = o.cardRows.map(r => ({ ...r, _k: `r${rowKeySeq++}` }));
    card.style = { ...o.cardStyle };
    card.showLabelColumn = o.cardLayout.showLabelColumn !== false;
    card.padding = o.cardLayout.padding ?? 6;
    card.headerHeight = o.cardLayout.headerHeight ?? 32;
    card.scale = Math.round(o.scaleX * 100) / 100;
  } else if (o && o.type === 'arrow') {
    line.stroke = o.stroke; line.strokeWidth = o.strokeWidth; line.dashKind = dashKindOf(o.strokeDashArray);
    line.arrowStart = !!o.arrowStart; line.arrowEnd = !!o.arrowEnd; line.arrowSize = o.arrowSize;
  } else if (o && o.type === 'textbox') {
    text.fontSize = o.fontSize; text.fontWeight = o.fontWeight === 'bold' || Number(o.fontWeight) >= 600 ? 'bold' : 'normal';
    text.align = o.textAlign || 'left'; text.color = o.fill; text.background = o.backgroundColor || 'transparent';
  } else if (o && (o.type === 'rect' || o.type === 'ellipse')) {
    shape.fill = o.fill || 'transparent'; shape.stroke = o.stroke; shape.strokeWidth = o.strokeWidth;
    shape.dashKind = dashKindOf(o.strokeDashArray); shape.borderRadius = o.rx || 0;
  }
  syncing = false;
}
watch(() => api.selectionVersion.value, syncFromSelection, { immediate: true });

/* ---- 套用 ---- */
function applyCard(fn) { if (!syncing) api.applyToSelected(fn); }
function applyCardLive(fn) { if (!syncing) api.applyToSelected(fn, { history: false }); }
function applyStyle(key, value) {
  if (syncing) return;
  api.applyToSelected(o => { if (o.type === 'infoCard') o.cardStyle[key] = value; });
}
function applyLine(fn) { if (!syncing) api.applyToSelected(o => { if (o.type === 'arrow') fn(o); }); }
function applyText(fn) { if (!syncing) api.applyToSelected(o => { if (o.type === 'textbox') fn(o); }); }
function applyShape(fn) { if (!syncing) api.applyToSelected(o => { if (o.type === 'rect' || o.type === 'ellipse') fn(o); }); }

/* 資訊卡列編輯 */
function stripRows() { return card.rows.map(({ _k, ...r }) => ({ ...r })); }
function onRowInput(row, field) {
  if (field === 'label') row.labelOverridden = true; else row.valueOverridden = true;
  const rows = stripRows();
  api.applyToSelected(o => { o.cardRows = rows.map(r => ({ ...r })); }, { history: false });
}
function commitRows() {
  const rows = stripRows();
  api.applyToSelected(o => { o.cardRows = rows.map(r => ({ ...r })); });
}
function addManualRow() {
  card.rows.push({ fieldKey: null, label: '項目', value: '', labelOverridden: true, valueOverridden: true, _k: `r${rowKeySeq++}` });
  commitRows();
}
function removeRow(i) {
  card.rows.splice(i, 1);
  api.applyToSelected(o => {
    const rh = o.cardLayout.rowHeights;
    if (Array.isArray(rh)) rh.splice(i, 1);
    o.cardRows = stripRows();
  });
}
function restoreRow(i) {
  card.rows[i].labelOverridden = false;
  card.rows[i].valueOverridden = false;
  commitRows();
  emit('refresh-data');
}

function setCardDefault() { emit('set-card-default', { ...card.style }); }
function applyStyleToAllCards() {
  const style = { ...card.style };
  const cards = api.getObjects().filter(o => o.type === 'infoCard');
  api.applyToObjects(cards, o => { o.cardStyle = { ...o.cardStyle, ...style }; });
}
function setLineDefault() {
  api.setDefault('line', { stroke: line.stroke, strokeWidth: line.strokeWidth, arrowSize: line.arrowSize });
  api.markDirty();
}
function setTextDefault() {
  api.setDefault('text', { fontSize: text.fontSize, fontWeight: text.fontWeight, align: text.align, color: text.color, background: text.background === 'transparent' ? '' : text.background });
  api.markDirty();
}
function setShapeDefault() {
  api.setDefault('shape', { fill: shape.fill === 'transparent' ? '' : shape.fill, stroke: shape.stroke, strokeWidth: shape.strokeWidth, dash: dashFor(shape.dashKind, shape.strokeWidth), borderRadius: shape.borderRadius });
  api.markDirty();
}

function toggleLock() {
  const target = !allLocked.value;
  selection.value.forEach(o => api.setLocked(o, target));
}

/* ---- 圖層 ---- */
const LAYER_META = {
  infoCard: { icon: 'mdi-card-text-outline', color: 'indigo' },
  arrow: { icon: 'mdi-arrow-top-right', color: 'pink' },
  textbox: { icon: 'mdi-format-text', color: 'grey-darken-2' },
  rect: { icon: 'mdi-rectangle-outline', color: 'blue' },
  ellipse: { icon: 'mdi-ellipse-outline', color: 'blue' },
};
const layers = ref([]);
function rebuildLayers() {
  const objs = api.getObjects().slice().reverse(); // 上層在前
  layers.value = objs.map(o => ({
    id: o.elementId,
    obj: o,
    name: layerName(o),
    icon: LAYER_META[o.type]?.icon || 'mdi-shape-outline',
    color: LAYER_META[o.type]?.color,
    hidden: o.visible === false,
    locked: !!o.locked,
  }));
}
function layerName(o) {
  if (o.type === 'infoCard') return `資訊卡 ${o.unitId || ''}`;
  if (o.type === 'textbox') return `文字 ${(o.text || '').slice(0, 12) || '(空白)'}`;
  if (o.type === 'arrow') return o.arrowStart || o.arrowEnd ? '箭頭' : '線段';
  if (o.type === 'rect') return '矩形';
  if (o.type === 'ellipse') return '橢圓';
  return o.type;
}
watch(() => [api.objectsVersion.value, api.selectionVersion.value], rebuildLayers, { immediate: true });
function onLayerDrop(evt) {
  const l = layers.value[evt.newIndex];
  if (l) api.moveToIndex(l.id, evt.newIndex);
}
</script>

<style scoped>
.dpp-root { display: flex; flex-direction: column; height: 100%; min-height: 0; background: #fff; }
.dpp-scroll { flex: 1; min-height: 0; overflow: auto; }
.dpp-empty { padding: 28px 16px; text-align: center; }
.dpp-section { padding: 10px 12px; border-bottom: 1px solid rgba(0,0,0,0.06); }
.dpp-section-title { font-weight: 600; font-size: 13px; margin-bottom: 6px; }
.dpp-actions { display: flex; flex-wrap: wrap; gap: 4px; }
.dpp-panels :deep(.v-expansion-panel-title) { min-height: 38px; padding: 0 12px; font-size: 13px; font-weight: 600; }
.dpp-panels :deep(.v-expansion-panel-text__wrapper) { padding: 6px 12px 12px; }
.dpp-slider-row { display: flex; align-items: center; gap: 6px; }
.dpp-label { font-size: 12px; color: #4b5563; min-width: 56px; }
.dpp-num { font-size: 11px; color: #6b7280; min-width: 34px; text-align: right; font-family: monospace; }
.dpp-rows { display: flex; flex-direction: column; gap: 3px; }
.dpp-row { display: flex; align-items: center; gap: 3px; }
.dpp-row.is-overridden .dpp-input { border-color: #f59e0b; background: #fffbeb; }
.dpp-input { flex: 1; min-width: 0; font-size: 12px; padding: 4px 6px; border: 1px solid rgba(0,0,0,0.18); border-radius: 4px; }
.dpp-input--value { flex: 1.4; }
.dpp-drag { cursor: grab; flex-shrink: 0; }
.dpp-ghost { opacity: .4; }
.dpp-layers { display: flex; flex-direction: column; }
.dpp-layer { display: flex; align-items: center; gap: 4px; padding: 3px 6px 3px 4px; font-size: 12px; cursor: pointer; border-bottom: 1px solid rgba(0,0,0,0.05); }
.dpp-layer:hover { background: #f3f4f6; }
.dpp-layer.is-active { background: #eef2ff; }
.dpp-layer.is-hidden .dpp-layer-name { color: #9ca3af; text-decoration: line-through; }
.dpp-layer-name { flex: 1; min-width: 0; }
</style>
