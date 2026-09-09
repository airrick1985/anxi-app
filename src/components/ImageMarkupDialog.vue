<template>
  <v-dialog
    v-model="open"
    :fullscreen="isMobile"
    :max-width="isMobile ? undefined : 1240"
    persistent
    no-click-animation
    :retain-focus="false"
    content-class="imk-dialog"
  >
    <div class="imk-window" :class="{ 'imk-window--mobile': isMobile }">
      <!-- 標題列（mac 視窗樣式） -->
      <div class="imk-titlebar">
        <div class="imk-lights">
          <button class="imk-light imk-light--close" title="關閉" @click="requestClose">
            <svg viewBox="0 0 12 12"><path d="M3.5 3.5l5 5M8.5 3.5l-5 5" /></svg>
          </button>
          <button class="imk-light imk-light--min" title="適合視窗" @click="fitToStage">
            <svg viewBox="0 0 12 12"><path d="M3 6h6" /></svg>
          </button>
          <button class="imk-light imk-light--max" title="全螢幕" @click="toggleFullscreen">
            <svg viewBox="0 0 12 12"><path d="M3.5 8.5l5-5M5 3.5h3.5V7" /></svg>
          </button>
        </div>
        <div class="imk-title">
          <v-icon size="14" class="mr-1" color="rgba(0,0,0,.55)">mdi-image-outline</v-icon>
          <span class="imk-title-name">{{ name || '圖片' }}</span>
          <span class="imk-title-sub">— 標記</span>
          <span v-if="dirty" class="imk-dirty-dot" title="尚未儲存"></span>
        </div>
        <div class="imk-title-right">
          <span v-if="baseSize.width" class="imk-meta">{{ baseSize.width }} × {{ baseSize.height }}</span>
        </div>
      </div>

      <!-- 工具列 -->
      <div class="imk-toolbar">
        <div class="imk-seg">
          <button class="imk-btn" :disabled="!canUndo" title="復原 (⌘Z)" @click="undo"><v-icon size="18">mdi-undo</v-icon></button>
          <button class="imk-btn" :disabled="!canRedo" title="重做 (⇧⌘Z)" @click="redo"><v-icon size="18">mdi-redo</v-icon></button>
        </div>

        <div class="imk-seg">
          <button
            v-for="t in TOOL_LIST"
            :key="t.id"
            class="imk-btn"
            :class="{ 'imk-btn--active': tool === t.id }"
            :title="`${t.label} (${t.key.toUpperCase()})`"
            @click="setTool(t.id)"
          ><v-icon size="18">{{ t.icon }}</v-icon></button>
        </div>

        <!-- 顏色 -->
        <div class="imk-seg imk-colors">
          <button
            v-for="c in COLORS"
            :key="c.value"
            class="imk-color"
            :class="{ 'imk-color--active': color === c.value }"
            :style="{ '--c': c.value }"
            :title="c.label"
            @click="setColor(c.value)"
          ></button>
        </div>

        <!-- 線寬 -->
        <div class="imk-seg">
          <button
            v-for="w in STROKES"
            :key="w.value"
            class="imk-btn imk-stroke"
            :class="{ 'imk-btn--active': strokeWidth === w.value }"
            :title="w.label"
            @click="setStroke(w.value)"
          ><span class="imk-stroke-dot" :style="{ width: w.dot + 'px', height: w.dot + 'px' }"></span></button>
        </div>

        <div class="imk-seg">
          <button class="imk-btn" :disabled="!hasSelection" title="刪除選取 (⌫)" @click="deleteSelected"><v-icon size="18">mdi-delete-outline</v-icon></button>
          <button class="imk-btn" :disabled="objectCount === 0" title="清除全部標記" @click="clearAll"><v-icon size="18">mdi-eraser</v-icon></button>
        </div>

        <div class="imk-spacer"></div>

        <div class="imk-seg">
          <button class="imk-btn" :disabled="!ready" title="下載圖片" @click="download"><v-icon size="18">mdi-download-outline</v-icon></button>
        </div>
        <template v-if="canSave">
          <button class="imk-push" :disabled="!ready || !dirty || saving" @click="emitSave('new')">另存新圖</button>
          <button class="imk-push imk-push--primary" :disabled="!ready || !dirty || saving" @click="emitSave('replace')">
            <v-progress-circular v-if="saving" indeterminate size="12" width="2" class="mr-1"></v-progress-circular>
            儲存
          </button>
        </template>
      </div>

      <!-- 畫布區 -->
      <div ref="stageRef" class="imk-stage" :class="`imk-stage--${tool}`">
        <div class="imk-canvas-wrap" :style="{ width: canvasCss.width + 'px', height: canvasCss.height + 'px' }">
          <canvas ref="canvasEl"></canvas>
        </div>
        <div v-if="!ready && !loadError" class="imk-overlay">
          <v-progress-circular indeterminate size="28" width="3" color="primary"></v-progress-circular>
          <span class="mt-2">載入圖片中…</span>
        </div>
        <div v-if="loadError" class="imk-overlay imk-overlay--error">
          <v-icon size="28" color="error">mdi-image-broken-variant</v-icon>
          <span class="mt-2">{{ loadError }}</span>
        </div>
      </div>

      <!-- 狀態列 -->
      <div class="imk-statusbar">
        <span>{{ toolHint }}</span>
        <span class="imk-spacer"></span>
        <span v-if="!exportable" class="imk-warn"><v-icon size="12">mdi-alert-outline</v-icon> 此圖片來源不允許跨域，無法輸出</span>
        <span class="imk-meta">{{ Math.round(zoom * 100) }}%</span>
      </div>
    </div>

    <!-- 關閉確認 -->
    <v-dialog v-model="closeConfirm" max-width="360">
      <v-card class="imk-alert">
        <div class="imk-alert-icon"><v-icon size="40" color="warning">mdi-alert-circle-outline</v-icon></div>
        <div class="imk-alert-title">要放棄尚未儲存的標記嗎？</div>
        <div class="imk-alert-text">關閉後這次的標記將不會保留。</div>
        <div class="imk-alert-actions">
          <button class="imk-push" @click="closeConfirm = false">繼續編輯</button>
          <button class="imk-push imk-push--danger" @click="forceClose">放棄變更</button>
        </div>
      </v-card>
    </v-dialog>
  </v-dialog>
</template>

<script setup>
import { ref, computed, watch, nextTick, onBeforeUnmount } from 'vue';
import { useDisplay } from 'vuetify';
import { fabric } from 'fabric';
import { useToast, POSITION } from 'vue-toastification';
import { Arrow } from '@/utils/salesDrawing/fabricArrow';

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  src: { type: String, default: '' },
  name: { type: String, default: '' },
  mimeType: { type: String, default: '' },
  canSave: { type: Boolean, default: true },
  saving: { type: Boolean, default: false },
});
const emit = defineEmits(['update:modelValue', 'save']);

const toast = useToast();
const { smAndDown } = useDisplay();
const isMobile = computed(() => smAndDown.value);

const open = computed({
  get: () => props.modelValue,
  set: (v) => emit('update:modelValue', v),
});

// ---------- 常數 ----------
const TOOL_LIST = [
  { id: 'select', icon: 'mdi-cursor-default-outline', label: '選取／移動', key: 'v', hint: '點選物件可移動、縮放、旋轉；⌫ 刪除' },
  { id: 'pen', icon: 'mdi-pencil-outline', label: '畫筆', key: 'p', hint: '按住拖曳自由繪製' },
  { id: 'highlighter', icon: 'mdi-marker', label: '螢光筆', key: 'h', hint: '半透明粗線，適合強調區塊' },
  { id: 'line', icon: 'mdi-minus', label: '直線', key: 'l', hint: '拖曳畫直線' },
  { id: 'arrow', icon: 'mdi-arrow-top-right', label: '箭頭', key: 'a', hint: '拖曳畫箭頭，選取後可拖端點調整' },
  { id: 'rect', icon: 'mdi-rectangle-outline', label: '矩形', key: 'r', hint: '拖曳畫矩形' },
  { id: 'ellipse', icon: 'mdi-ellipse-outline', label: '圓圈', key: 'o', hint: '拖曳畫圓圈／橢圓' },
  { id: 'text', icon: 'mdi-format-text', label: '文字', key: 't', hint: '點一下放置文字，輸入完點空白處結束' },
  { id: 'number', icon: 'mdi-numeric-1-circle-outline', label: '編號', key: 'n', hint: '點一下放置編號圓點（自動遞增）' },
  { id: 'mosaic', icon: 'mdi-blur', label: '馬賽克', key: 'm', hint: '拖曳框選要遮蔽的區域（身分證、電話等）' },
];
const COLORS = [
  { value: '#ff3b30', label: '紅' },
  { value: '#ff9500', label: '橘' },
  { value: '#ffcc00', label: '黃' },
  { value: '#34c759', label: '綠' },
  { value: '#0a84ff', label: '藍' },
  { value: '#af52de', label: '紫' },
  { value: '#1c1c1e', label: '黑' },
  { value: '#ffffff', label: '白' },
];
const STROKES = [
  { value: 2, dot: 4, label: '細' },
  { value: 4, dot: 7, label: '中' },
  { value: 8, dot: 11, label: '粗' },
];
const MAX_BASE_DIM = 2400;
const HISTORY_LIMIT = 60;

// ---------- 狀態 ----------
const stageRef = ref(null);
const canvasEl = ref(null);
const ready = ref(false);
const loadError = ref('');
const exportable = ref(true);
const dirty = ref(false);
const tool = ref('select');
const color = ref(COLORS[0].value);
const strokeWidth = ref(STROKES[1].value);
const zoom = ref(1);
const baseSize = ref({ width: 0, height: 0 });
const canvasCss = ref({ width: 0, height: 0 });
const hasSelection = ref(false);
const objectCount = ref(0);
const canUndo = ref(false);
const canRedo = ref(false);
const closeConfirm = ref(false);

let canvas = null;
let resizeObserver = null;
let drawing = null;       // 進行中的形狀 { obj, x, y }
let numberCounter = 1;
let history = [];
let historyIndex = -1;
let restoring = false;

const toolHint = computed(() => TOOL_LIST.find(t => t.id === tool.value)?.hint || '');

/** 依圖片解析度放大線寬／字級，讓輸出後比例一致 */
function unit() {
  const m = Math.max(baseSize.value.width, baseSize.value.height) || 1000;
  return Math.min(3, Math.max(1, m / 1000));
}
function px(v) { return v * unit(); }

function hexToRgba(hex, alpha) {
  const h = hex.replace('#', '');
  const n = parseInt(h.length === 3 ? h.split('').map(c => c + c).join('') : h, 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${alpha})`;
}

// ---------- 初始化 / 銷毀 ----------
function disposeCanvas() {
  if (resizeObserver) { resizeObserver.disconnect(); resizeObserver = null; }
  if (canvas) { try { canvas.dispose(); } catch (e) { /* noop */ } canvas = null; }
  ready.value = false;
  loadError.value = '';
  exportable.value = true;
  dirty.value = false;
  hasSelection.value = false;
  objectCount.value = 0;
  history = [];
  historyIndex = -1;
  canUndo.value = false;
  canRedo.value = false;
  numberCounter = 1;
  drawing = null;
  tool.value = 'select';
}

function loadImage(url) {
  const attempt = (crossOrigin) => new Promise((resolve) => {
    fabric.Image.fromURL(url, (img, isError) => {
      if (isError || !img || !img.width) resolve(null);
      else resolve(img);
    }, crossOrigin ? { crossOrigin: 'anonymous' } : {});
  });
  return attempt(true).then(img => {
    if (img) return { img, exportable: true };
    return attempt(false).then(img2 => (img2 ? { img: img2, exportable: false } : null));
  });
}

async function initCanvas() {
  disposeCanvas();
  await nextTick();
  if (!canvasEl.value || !props.src) return;

  canvas = new fabric.Canvas(canvasEl.value, {
    selection: true,
    preserveObjectStacking: true,
    stopContextMenu: true,
    backgroundColor: '#ffffff',
  });
  canvas.freeDrawingBrush = new fabric.PencilBrush(canvas);

  const loaded = await loadImage(props.src);
  if (!canvas) return; // 已被關閉
  if (!loaded) {
    loadError.value = '圖片載入失敗';
    return;
  }
  const { img } = loaded;
  exportable.value = loaded.exportable;

  const scaleDown = Math.min(1, MAX_BASE_DIM / Math.max(img.width, img.height));
  img.set({ scaleX: scaleDown, scaleY: scaleDown, selectable: false, evented: false, originX: 'left', originY: 'top' });
  baseSize.value = { width: Math.round(img.width * scaleDown), height: Math.round(img.height * scaleDown) };
  canvas.setBackgroundImage(img, () => {});

  bindEvents();
  fitToStage();
  resizeObserver = new ResizeObserver(() => fitToStage());
  if (stageRef.value) resizeObserver.observe(stageRef.value);

  ready.value = true;
  pushHistory(); // 初始狀態
}

function fitToStage() {
  if (!canvas || !stageRef.value || !baseSize.value.width) return;
  const pad = 24;
  const sw = Math.max(100, stageRef.value.clientWidth - pad * 2);
  const sh = Math.max(100, stageRef.value.clientHeight - pad * 2);
  const s = Math.min(sw / baseSize.value.width, sh / baseSize.value.height, 2);
  zoom.value = s;
  const w = Math.round(baseSize.value.width * s);
  const h = Math.round(baseSize.value.height * s);
  canvasCss.value = { width: w, height: h };
  canvas.setDimensions({ width: w, height: h });
  canvas.setZoom(s);
  canvas.requestRenderAll();
}

function toggleFullscreen() {
  const el = stageRef.value?.closest('.imk-window');
  if (!el) return;
  if (document.fullscreenElement) document.exitFullscreen?.();
  else el.requestFullscreen?.();
}

// ---------- 工具 ----------
function isDrawTool(t) { return ['line', 'arrow', 'rect', 'ellipse', 'mosaic'].includes(t); }

function setTool(t) {
  tool.value = t;
  if (!canvas) return;
  canvas.isDrawingMode = t === 'pen' || t === 'highlighter';
  if (canvas.isDrawingMode) configureBrush();
  const interactive = t === 'select';
  canvas.selection = interactive;
  canvas.forEachObject(o => { o.selectable = interactive; o.evented = interactive; });
  if (!interactive) canvas.discardActiveObject();
  canvas.defaultCursor = interactive ? 'default' : 'crosshair';
  canvas.hoverCursor = interactive ? 'move' : 'crosshair';
  canvas.requestRenderAll();
}

function configureBrush() {
  if (!canvas) return;
  const b = canvas.freeDrawingBrush;
  if (tool.value === 'highlighter') {
    b.color = hexToRgba(color.value, 0.35);
    b.width = px(strokeWidth.value * 4);
  } else {
    b.color = color.value;
    b.width = px(strokeWidth.value);
  }
  b.strokeLineCap = 'round';
  b.strokeLineJoin = 'round';
}

function setColor(c) {
  color.value = c;
  configureBrush();
  applyToSelection(o => {
    if (o.type === 'i-text' || o.type === 'text') o.set('fill', c);
    else if (o.type === 'group' && o.isNumberStamp) o.item(0).set('fill', c);
    else if (o.type === 'path' && o.isHighlighter) o.set('stroke', hexToRgba(c, 0.35));
    else if (o.stroke) o.set('stroke', c);
  });
}

function setStroke(w) {
  strokeWidth.value = w;
  configureBrush();
  applyToSelection(o => {
    if (o.type === 'i-text' || o.type === 'text') o.set('fontSize', px(fontSizeFor(w)));
    else if (o.type === 'path' && o.isHighlighter) o.set('strokeWidth', px(w * 4));
    else if (o.stroke && !(o.type === 'group')) o.set('strokeWidth', px(w));
  });
}

function fontSizeFor(w) { return { 2: 18, 4: 26, 8: 40 }[w] || 26; }

function applyToSelection(fn) {
  if (!canvas) return;
  const active = canvas.getActiveObjects();
  if (active.length === 0) return;
  active.forEach(fn);
  canvas.requestRenderAll();
  pushHistory();
}

// ---------- 事件 ----------
function bindEvents() {
  canvas.on('mouse:down', onMouseDown);
  canvas.on('mouse:move', onMouseMove);
  canvas.on('mouse:up', onMouseUp);
  canvas.on('path:created', (e) => {
    if (tool.value === 'highlighter' && e.path) e.path.isHighlighter = true;
    if (e.path) e.path.set({ selectable: false, evented: false });
    pushHistory();
  });
  canvas.on('object:modified', () => pushHistory());
  canvas.on('text:editing:exited', (e) => {
    const t = e.target;
    if (t && !t.text.trim()) { canvas.remove(t); }
    pushHistory();
  });
  const syncSel = () => { hasSelection.value = canvas.getActiveObjects().length > 0; };
  canvas.on('selection:created', syncSel);
  canvas.on('selection:updated', syncSel);
  canvas.on('selection:cleared', syncSel);
}

function onMouseDown(e) {
  if (!canvas || canvas.isDrawingMode) return;
  const t = tool.value;
  if (t === 'select') return;
  const p = canvas.getPointer(e.e);
  if (!p || Number.isNaN(p.x)) return;

  if (t === 'text') { placeText(p); return; }
  if (t === 'number') { placeNumber(p); return; }
  if (!isDrawTool(t)) return;

  const common = { stroke: color.value, strokeWidth: px(strokeWidth.value), fill: 'transparent', strokeUniform: true, selectable: false, evented: false, strokeLineCap: 'round', strokeLineJoin: 'round' };
  let obj = null;
  if (t === 'line') obj = new fabric.Line([p.x, p.y, p.x, p.y], common);
  else if (t === 'arrow') obj = new Arrow([p.x, p.y, p.x, p.y], { ...common, arrowEnd: true, arrowSize: px(strokeWidth.value * 3 + 8) });
  else if (t === 'rect') obj = new fabric.Rect({ ...common, left: p.x, top: p.y, width: 0, height: 0, rx: px(2), ry: px(2) });
  else if (t === 'ellipse') obj = new fabric.Ellipse({ ...common, left: p.x, top: p.y, rx: 0, ry: 0 });
  else if (t === 'mosaic') obj = new fabric.Rect({ left: p.x, top: p.y, width: 0, height: 0, fill: 'rgba(0,0,0,0.25)', stroke: '#ffffff', strokeWidth: 1, strokeDashArray: [4, 4], strokeUniform: true, selectable: false, evented: false });
  if (!obj) return;
  canvas.add(obj);
  drawing = { obj, x: p.x, y: p.y, kind: t };
}

function onMouseMove(e) {
  if (!drawing || !canvas) return;
  const p = canvas.getPointer(e.e);
  const { obj, x, y, kind } = drawing;
  let ex = p.x, ey = p.y;
  if (e.e.shiftKey && (kind === 'rect' || kind === 'ellipse' || kind === 'mosaic')) {
    const d = Math.max(Math.abs(ex - x), Math.abs(ey - y));
    ex = x + Math.sign(ex - x || 1) * d;
    ey = y + Math.sign(ey - y || 1) * d;
  }
  if (kind === 'line') obj.set({ x2: ex, y2: ey });
  else if (kind === 'arrow') obj.setEndpoints({ x1: x, y1: y, x2: ex, y2: ey });
  else if (kind === 'ellipse') {
    obj.set({ left: Math.min(x, ex), top: Math.min(y, ey), rx: Math.abs(ex - x) / 2, ry: Math.abs(ey - y) / 2 });
  } else {
    obj.set({ left: Math.min(x, ex), top: Math.min(y, ey), width: Math.abs(ex - x), height: Math.abs(ey - y) });
  }
  obj.setCoords();
  canvas.requestRenderAll();
}

async function onMouseUp() {
  if (!drawing || !canvas) return;
  const { obj, x, y, kind } = drawing;
  drawing = null;
  const w = obj.width * (obj.scaleX || 1), h = obj.height * (obj.scaleY || 1);
  const tiny = kind === 'line' || kind === 'arrow'
    ? Math.hypot(obj.x2 - obj.x1, obj.y2 - obj.y1) < 4
    : (w < 4 && h < 4);
  if (tiny) { canvas.remove(obj); canvas.requestRenderAll(); return; }

  if (kind === 'mosaic') {
    const rect = { left: obj.left, top: obj.top, width: obj.width, height: obj.height };
    canvas.remove(obj);
    try {
      const img = await buildMosaic(rect);
      if (!canvas) return;
      canvas.add(img);
      finishShape(img);
    } catch (err) {
      console.warn('馬賽克失敗:', err);
      exportable.value = false;
      toast.error('此圖片來源不允許跨域，無法產生馬賽克', { position: POSITION.BOTTOM_CENTER });
      canvas.requestRenderAll();
    }
    return;
  }
  void x; void y;
  finishShape(obj);
}

function finishShape(obj) {
  setTool('select');
  canvas.setActiveObject(obj);
  canvas.requestRenderAll();
  pushHistory();
}

function placeText(p) {
  const t = new fabric.IText('', {
    left: p.x, top: p.y,
    fill: color.value,
    fontSize: px(fontSizeFor(strokeWidth.value)),
    fontFamily: '-apple-system, "PingFang TC", "Noto Sans TC", "Microsoft JhengHei", sans-serif',
    fontWeight: '600',
    stroke: color.value === '#ffffff' ? 'rgba(0,0,0,0.6)' : 'rgba(255,255,255,0.85)',
    strokeWidth: px(0.8),
    paintFirst: 'stroke',
    padding: 4,
  });
  canvas.add(t);
  setTool('select');
  canvas.setActiveObject(t);
  t.enterEditing();
  canvas.requestRenderAll();
}

function placeNumber(p) {
  const r = px(14);
  const circle = new fabric.Circle({ radius: r, fill: color.value, stroke: '#ffffff', strokeWidth: px(2), originX: 'center', originY: 'center', shadow: new fabric.Shadow({ color: 'rgba(0,0,0,0.3)', blur: px(4), offsetY: px(1) }) });
  const label = new fabric.Text(String(numberCounter++), { fontSize: r * 1.25, fill: '#ffffff', fontWeight: 'bold', fontFamily: '-apple-system, "Helvetica Neue", Arial, sans-serif', originX: 'center', originY: 'center' });
  const group = new fabric.Group([circle, label], { left: p.x, top: p.y, originX: 'center', originY: 'center', selectable: false, evented: false });
  group.isNumberStamp = true;
  canvas.add(group);
  canvas.requestRenderAll();
  pushHistory();
}

/** 由底圖對應區域產生馬賽克影像 */
function buildMosaic(rect) {
  return new Promise((resolve, reject) => {
    const bg = canvas.backgroundImage;
    const el = bg?._element;
    if (!el) return reject(new Error('no base image'));
    const s = bg.scaleX || 1;
    const w = Math.max(1, Math.round(rect.width)), h = Math.max(1, Math.round(rect.height));
    const block = Math.max(6, Math.round(px(12)));
    const small = document.createElement('canvas');
    small.width = Math.max(1, Math.ceil(w / block));
    small.height = Math.max(1, Math.ceil(h / block));
    const sctx = small.getContext('2d');
    sctx.imageSmoothingEnabled = true;
    sctx.drawImage(el, rect.left / s, rect.top / s, w / s, h / s, 0, 0, small.width, small.height);
    const out = document.createElement('canvas');
    out.width = w; out.height = h;
    const octx = out.getContext('2d');
    octx.imageSmoothingEnabled = false;
    octx.drawImage(small, 0, 0, small.width, small.height, 0, 0, w, h);
    let dataUrl;
    try { dataUrl = out.toDataURL('image/png'); } catch (e) { return reject(e); }
    fabric.Image.fromURL(dataUrl, (img, isError) => {
      if (isError || !img) return reject(new Error('mosaic image failed'));
      img.set({ left: rect.left, top: rect.top, selectable: false, evented: false, lockUniScaling: false });
      img.isMosaic = true;
      resolve(img);
    });
  });
}

// ---------- 選取操作 ----------
function deleteSelected() {
  if (!canvas) return;
  const active = canvas.getActiveObjects();
  if (active.length === 0) return;
  if (active.length === 1 && active[0].isEditing) return;
  canvas.discardActiveObject();
  active.forEach(o => canvas.remove(o));
  canvas.requestRenderAll();
  pushHistory();
}

function clearAll() {
  if (!canvas || objectCount.value === 0) return;
  canvas.discardActiveObject();
  canvas.getObjects().forEach(o => canvas.remove(o));
  numberCounter = 1;
  canvas.requestRenderAll();
  pushHistory();
}

// ---------- 歷史 ----------
function snapshot() {
  return JSON.stringify({
    objects: canvas.toJSON(['isHighlighter', 'isNumberStamp', 'isMosaic', 'arrowStart', 'arrowEnd', 'arrowSize']).objects,
    numberCounter,
  });
}

function pushHistory() {
  if (!canvas || restoring) return;
  const snap = snapshot();
  if (historyIndex >= 0 && history[historyIndex] === snap) return;
  history = history.slice(0, historyIndex + 1);
  history.push(snap);
  if (history.length > HISTORY_LIMIT) history.shift();
  historyIndex = history.length - 1;
  syncHistoryFlags();
}

function syncHistoryFlags() {
  canUndo.value = historyIndex > 0;
  canRedo.value = historyIndex < history.length - 1;
  dirty.value = historyIndex > 0;
  objectCount.value = canvas ? canvas.getObjects().length : 0;
}

function restore(index) {
  if (!canvas || index < 0 || index >= history.length) return;
  restoring = true;
  const { objects, numberCounter: nc } = JSON.parse(history[index]);
  canvas.discardActiveObject();
  canvas.getObjects().forEach(o => canvas.remove(o));
  fabric.util.enlivenObjects(objects, (objs) => {
    if (!canvas) { restoring = false; return; }
    const interactive = tool.value === 'select';
    objs.forEach(o => { o.set({ selectable: interactive, evented: interactive }); canvas.add(o); });
    numberCounter = nc || 1;
    historyIndex = index;
    canvas.requestRenderAll();
    restoring = false;
    syncHistoryFlags();
  });
}

function undo() { if (canUndo.value) restore(historyIndex - 1); }
function redo() { if (canRedo.value) restore(historyIndex + 1); }

// ---------- 輸出 ----------
function outputMime() {
  return props.mimeType === 'image/jpeg' ? 'image/jpeg' : 'image/png';
}

function outputFilename() {
  const base = (props.name || 'image').replace(/\.[^.]+$/, '');
  return `${base}_標記.${outputMime() === 'image/jpeg' ? 'jpg' : 'png'}`;
}

function exportBlob() {
  return new Promise((resolve, reject) => {
    if (!canvas) return reject(new Error('canvas not ready'));
    canvas.discardActiveObject();
    canvas.requestRenderAll();
    let el;
    try {
      el = canvas.toCanvasElement(1 / zoom.value);
    } catch (e) { return reject(e); }
    try {
      el.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('toBlob failed'))), outputMime(), 0.92);
    } catch (e) { reject(e); }
  });
}

async function emitSave(mode) {
  if (!ready.value || props.saving) return;
  try {
    const blob = await exportBlob();
    emit('save', { blob, mode, filename: outputFilename(), mimeType: outputMime() });
  } catch (e) {
    console.error('輸出標記圖片失敗:', e);
    exportable.value = false;
    toast.error('無法輸出圖片：圖片來源不允許跨域存取', { position: POSITION.BOTTOM_CENTER });
  }
}

async function download() {
  try {
    const blob = await exportBlob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = outputFilename();
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
  } catch (e) {
    console.error('下載標記圖片失敗:', e);
    exportable.value = false;
    toast.error('無法輸出圖片：圖片來源不允許跨域存取', { position: POSITION.BOTTOM_CENTER });
  }
}

// ---------- 關閉 ----------
function requestClose() {
  if (dirty.value) { closeConfirm.value = true; return; }
  forceClose();
}
function forceClose() {
  closeConfirm.value = false;
  if (document.fullscreenElement) document.exitFullscreen?.();
  open.value = false;
}

/** 儲存成功後由父層呼叫：重設為未變更並關閉 */
function markSavedAndClose() {
  dirty.value = false;
  forceClose();
}
defineExpose({ markSavedAndClose });

// ---------- 鍵盤 ----------
function onKeydown(e) {
  if (!open.value || !canvas) return;
  const target = e.target;
  const typing = target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable);
  const editingText = canvas.getActiveObject()?.isEditing;
  if (typing || editingText) return;
  const meta = e.metaKey || e.ctrlKey;
  if (meta && e.key.toLowerCase() === 'z') {
    e.preventDefault();
    if (e.shiftKey) redo(); else undo();
    return;
  }
  if (meta && e.key.toLowerCase() === 'y') { e.preventDefault(); redo(); return; }
  if (e.key === 'Delete' || e.key === 'Backspace') { e.preventDefault(); deleteSelected(); return; }
  if (e.key === 'Escape') {
    e.preventDefault();
    if (closeConfirm.value) { closeConfirm.value = false; return; }
    if (tool.value !== 'select') setTool('select');
    else if (canvas.getActiveObjects().length) { canvas.discardActiveObject(); canvas.requestRenderAll(); }
    else requestClose();
    return;
  }
  if (!meta && !e.altKey) {
    const t = TOOL_LIST.find(x => x.key === e.key.toLowerCase());
    if (t) { e.preventDefault(); setTool(t.id); }
  }
}

watch(() => props.modelValue, (v) => {
  if (v) {
    window.addEventListener('keydown', onKeydown);
    nextTick(() => initCanvas());
  } else {
    window.removeEventListener('keydown', onKeydown);
    disposeCanvas();
  }
});

onBeforeUnmount(() => {
  window.removeEventListener('keydown', onKeydown);
  disposeCanvas();
});
</script>

<style scoped>
.imk-window {
  --imk-font: -apple-system, BlinkMacSystemFont, "SF Pro Text", "PingFang TC", "Helvetica Neue", "Noto Sans TC", sans-serif;
  --imk-blue: #0a7aff;
  font-family: var(--imk-font);
  font-size: 13px;
  color: #1d1d1f;
  background: #f5f5f7;
  border-radius: 12px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  height: 88vh;
  box-shadow: 0 30px 80px rgba(0, 0, 0, 0.35), 0 0 0 1px rgba(0, 0, 0, 0.12);
  user-select: none;
}
.imk-window--mobile {
  height: 100vh;
  height: 100dvh;
  border-radius: 0;
}
.imk-window:fullscreen {
  height: 100vh;
  border-radius: 0;
}

/* 標題列 */
.imk-titlebar {
  position: relative;
  height: 40px;
  display: flex;
  align-items: center;
  padding: 0 12px;
  background: linear-gradient(#ececec, #e2e2e2);
  border-bottom: 1px solid rgba(0, 0, 0, 0.14);
  flex-shrink: 0;
}
.imk-lights {
  display: flex;
  gap: 8px;
  z-index: 1;
}
.imk-light {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  border: 1px solid rgba(0, 0, 0, 0.15);
  padding: 0;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}
.imk-light svg {
  width: 8px;
  height: 8px;
  stroke: rgba(0, 0, 0, 0.55);
  stroke-width: 1.5;
  fill: none;
  stroke-linecap: round;
  opacity: 0;
  transition: opacity 0.12s;
}
.imk-lights:hover .imk-light svg { opacity: 1; }
.imk-light--close { background: #ff5f57; }
.imk-light--min { background: #febc2e; }
.imk-light--max { background: #28c840; }
.imk-title {
  position: absolute;
  left: 0;
  right: 0;
  text-align: center;
  pointer-events: none;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 2px;
  font-weight: 600;
  font-size: 13px;
  color: #3a3a3c;
}
.imk-title-name {
  max-width: 40vw;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.imk-title-sub { color: rgba(0, 0, 0, 0.45); font-weight: 500; }
.imk-dirty-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #3a3a3c;
  margin-left: 6px;
}
.imk-title-right {
  margin-left: auto;
  z-index: 1;
}
.imk-meta {
  font-size: 11px;
  color: rgba(0, 0, 0, 0.5);
  font-variant-numeric: tabular-nums;
}

/* 工具列 */
.imk-toolbar {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 10px;
  background: rgba(246, 246, 246, 0.92);
  backdrop-filter: saturate(180%) blur(20px);
  border-bottom: 1px solid rgba(0, 0, 0, 0.1);
  flex-shrink: 0;
  overflow-x: auto;
  scrollbar-width: none;
}
.imk-toolbar::-webkit-scrollbar { display: none; }
.imk-seg {
  display: flex;
  align-items: center;
  gap: 2px;
  padding: 2px;
  background: rgba(0, 0, 0, 0.05);
  border-radius: 8px;
  flex-shrink: 0;
}
.imk-btn {
  width: 30px;
  height: 28px;
  border: none;
  border-radius: 6px;
  background: transparent;
  color: #3a3a3c;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.12s, color 0.12s;
}
.imk-btn:hover:not(:disabled) { background: rgba(0, 0, 0, 0.07); }
.imk-btn:disabled { opacity: 0.35; cursor: default; }
.imk-btn--active {
  background: #ffffff;
  color: var(--imk-blue);
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.15), 0 0 0 0.5px rgba(0, 0, 0, 0.08);
}
.imk-stroke-dot {
  border-radius: 50%;
  background: currentColor;
}
.imk-colors { gap: 5px; padding: 4px 6px; }
.imk-color {
  width: 18px;
  height: 18px;
  border-radius: 50%;
  border: none;
  padding: 0;
  cursor: pointer;
  background: var(--c);
  box-shadow: inset 0 0 0 1px rgba(0, 0, 0, 0.18);
  transition: transform 0.12s;
}
.imk-color:hover { transform: scale(1.12); }
.imk-color--active {
  box-shadow: inset 0 0 0 1px rgba(0, 0, 0, 0.18), 0 0 0 2px #f5f5f7, 0 0 0 3.5px var(--imk-blue);
}
.imk-spacer { flex: 1; }
.imk-push {
  height: 28px;
  padding: 0 14px;
  border-radius: 7px;
  border: 1px solid rgba(0, 0, 0, 0.16);
  background: linear-gradient(#ffffff, #f2f2f2);
  color: #1d1d1f;
  font-family: var(--imk-font);
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  white-space: nowrap;
  display: inline-flex;
  align-items: center;
  box-shadow: 0 1px 1px rgba(0, 0, 0, 0.06);
  flex-shrink: 0;
}
.imk-push:hover:not(:disabled) { background: linear-gradient(#fafafa, #e9e9e9); }
.imk-push:disabled { opacity: 0.45; cursor: default; }
.imk-push--primary {
  background: linear-gradient(#2f8dff, var(--imk-blue));
  border-color: #0a6ae0;
  color: #fff;
  font-weight: 600;
}
.imk-push--primary:hover:not(:disabled) { background: linear-gradient(#2a82ee, #0a6ae0); }
.imk-push--danger {
  background: linear-gradient(#ff6259, #ff3b30);
  border-color: #e0342a;
  color: #fff;
  font-weight: 600;
}

/* 畫布區 */
.imk-stage {
  flex: 1;
  min-height: 0;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: auto;
  background:
    linear-gradient(45deg, rgba(0,0,0,0.035) 25%, transparent 25%, transparent 75%, rgba(0,0,0,0.035) 75%),
    linear-gradient(45deg, rgba(0,0,0,0.035) 25%, transparent 25%, transparent 75%, rgba(0,0,0,0.035) 75%);
  background-size: 20px 20px;
  background-position: 0 0, 10px 10px;
  background-color: #e8e8ea;
  touch-action: none;
}
.imk-stage--select { cursor: default; }
.imk-canvas-wrap {
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.25);
  background: #fff;
  flex-shrink: 0;
}
.imk-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: rgba(0, 0, 0, 0.55);
  font-size: 12px;
  background: rgba(232, 232, 234, 0.85);
}
.imk-overlay--error { color: #d32f2f; }

/* 狀態列 */
.imk-statusbar {
  height: 26px;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 0 12px;
  font-size: 11px;
  color: rgba(0, 0, 0, 0.55);
  background: #ececec;
  border-top: 1px solid rgba(0, 0, 0, 0.1);
  flex-shrink: 0;
  white-space: nowrap;
  overflow: hidden;
}
.imk-warn { color: #b7791f; display: inline-flex; align-items: center; gap: 3px; }

/* mac 風格警示視窗 */
.imk-alert {
  font-family: var(--imk-font);
  border-radius: 12px !important;
  padding: 20px 20px 16px;
  text-align: center;
  background: #f5f5f7;
}
.imk-alert-icon { margin-bottom: 8px; }
.imk-alert-title { font-size: 14px; font-weight: 700; color: #1d1d1f; }
.imk-alert-text { font-size: 12px; color: rgba(0, 0, 0, 0.6); margin-top: 4px; }
.imk-alert-actions { display: flex; gap: 8px; justify-content: center; margin-top: 16px; }
.imk-alert-actions .imk-push { flex: 1; justify-content: center; }
</style>

<style>
.imk-dialog {
  box-shadow: none !important;
  overflow: visible !important;
}
.imk-dialog .imk-window .canvas-container {
  margin: 0 auto;
}
</style>
