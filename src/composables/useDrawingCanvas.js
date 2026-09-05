/**
 * 銷售圖面編輯器：fabric canvas 生命週期、縮放平移、工具繪製、選取、歷史（undo/redo）、對齊線
 * 規格：docs/銷售圖面編輯器-spec.md §4.3 / §4.8
 *
 * 注意：fabric 物件不可放入 Vue reactive（Proxy 會破壞內部狀態），一律 markRaw / shallowRef。
 */
import { ref, shallowRef, computed, markRaw } from 'vue';
import { fabric } from 'fabric';
import { InfoCard, infoCardFromElement, infoCardToElement, applyLockState } from '@/utils/salesDrawing/fabricInfoCard';
import { Arrow, arrowFromElement, arrowToElement } from '@/utils/salesDrawing/fabricArrow';
import { normalizeElement, cloneElement, genElementId, DEFAULT_TEXT_STYLE, DEFAULT_SHAPE_STYLE, DEFAULT_LINE_STYLE } from '@/utils/salesDrawing/drawingSchema';

export const TOOLS = {
  select: 'select',
  pan: 'pan',
  text: 'text',
  line: 'line',
  arrow: 'arrow',
  arrowDouble: 'arrowDouble',
  dashed: 'dashed',
  rect: 'rect',
  ellipse: 'ellipse',
};

const DRAW_TOOLS = new Set([TOOLS.line, TOOLS.arrow, TOOLS.arrowDouble, TOOLS.dashed, TOOLS.rect, TOOLS.ellipse]);
const MIN_ZOOM = 0.05, MAX_ZOOM = 8;
const HISTORY_LIMIT = 50;
const PAGE_ID = '__page__';
const BASE_ID = '__base__';
const SYSTEM_IDS = new Set([PAGE_ID, BASE_ID]);

export function useDrawingCanvas() {
  let canvas = null;
  let containerEl = null;
  let resizeObserver = null;
  let pageRect = null;
  let baseImg = null;

  const ready = ref(false);
  const readOnly = ref(false);
  const zoom = ref(1);
  const tool = ref(TOOLS.select);
  const canvasSize = ref({ width: 1920, height: 1080 });
  const selected = shallowRef([]);          // markRaw fabric objects
  const selectionVersion = ref(0);          // 屬性面板重新讀取用
  const objectsVersion = ref(0);            // 圖層面板重新讀取用
  const dirty = ref(false);
  const snapEnabled = ref(true);
  const baseImageLoaded = ref(false);
  const baseImageError = ref('');

  const history = [];
  let historyIndex = -1;
  const canUndo = ref(false);
  const canRedo = ref(false);
  let suspendHistory = false;
  let clipboard = [];
  let defaults = { text: { ...DEFAULT_TEXT_STYLE }, shape: { ...DEFAULT_SHAPE_STYLE }, line: { ...DEFAULT_LINE_STYLE } };

  const listeners = { change: [], selection: [] };
  function on(evt, fn) { listeners[evt]?.push(fn); }
  function emit(evt, ...args) { listeners[evt]?.forEach(fn => fn(...args)); }

  /* ---------- 初始化 ---------- */

  function init(canvasEl, container, opts = {}) {
    dispose();
    containerEl = container;
    readOnly.value = !!opts.readOnly;
    canvas = new fabric.Canvas(canvasEl, {
      selection: !readOnly.value,
      preserveObjectStacking: true,
      uniformScaling: true,
      stopContextMenu: true,
      fireRightClick: true,
      fireMiddleClick: true,
      backgroundColor: '#374151',
      enableRetinaScaling: true,
      selectionColor: 'rgba(37,99,235,0.12)',
      selectionBorderColor: '#2563eb',
      selectionLineWidth: 1,
    });
    canvas.upperCanvasEl.removeAttribute('tabindex');
    fitToContainer();
    resizeObserver = new ResizeObserver(() => fitToContainer());
    resizeObserver.observe(containerEl);
    bindEvents();
    ready.value = true;
  }

  function dispose() {
    if (resizeObserver) { resizeObserver.disconnect(); resizeObserver = null; }
    if (canvas) { try { canvas.dispose(); } catch (e) { /* ignore */ } canvas = null; }
    ready.value = false;
    selected.value = [];
    history.length = 0;
    historyIndex = -1;
  }

  function fitToContainer() {
    if (!canvas || !containerEl) return;
    const w = Math.max(50, containerEl.clientWidth);
    const h = Math.max(50, containerEl.clientHeight);
    canvas.setDimensions({ width: w, height: h });
    canvas.requestRenderAll();
  }

  /* ---------- 畫布尺寸／底圖 ---------- */

  function setCanvasSize(width, height, background = '#ffffff') {
    canvasSize.value = { width, height };
    if (!canvas) return;
    if (pageRect) canvas.remove(pageRect);
    pageRect = new fabric.Rect({
      left: 0, top: 0, width, height, fill: background,
      selectable: false, evented: false, hasControls: false, hasBorders: false,
      excludeFromExport: false, objectCaching: false, hoverCursor: 'default',
      shadow: new fabric.Shadow({ color: 'rgba(0,0,0,0.35)', blur: 24, offsetX: 0, offsetY: 6 }),
    });
    pageRect.elementId = PAGE_ID;
    canvas.add(pageRect);
    ensureSystemOrder();
    canvas.requestRenderAll();
  }

  /** 頁面矩形固定最底、底圖其次 */
  function ensureSystemOrder() {
    if (!canvas) return;
    if (baseImg) canvas.sendToBack(baseImg);
    if (pageRect) canvas.sendToBack(pageRect);
  }
  function systemCount() { return (pageRect ? 1 : 0) + (baseImg ? 1 : 0); }

  /**
   * 載入底圖（crossOrigin anonymous；失敗時以非跨域模式重試供檢視，並標記不可匯出）
   */
  function setBaseImage(url) {
    baseImageLoaded.value = false;
    baseImageError.value = '';
    if (!canvas) return Promise.resolve(false);
    if (baseImg) { canvas.remove(baseImg); baseImg = null; }
    if (!url) { canvas.requestRenderAll(); return Promise.resolve(true); }
    const load = (crossOrigin) => new Promise((resolve) => {
      fabric.Image.fromURL(url, (img, isError) => {
        if (!img || isError || !img.width) return resolve(null);
        resolve(img);
      }, crossOrigin ? { crossOrigin: 'anonymous' } : {});
    });
    return load(true).then(async (img) => {
      let tainted = false;
      if (!img) { img = await load(false); tainted = true; }
      if (!img) { baseImageError.value = '底圖載入失敗'; return false; }
      img.set({
        left: 0, top: 0, originX: 'left', originY: 'top',
        selectable: false, evented: false, hasControls: false, hasBorders: false, hoverCursor: 'default',
        objectCaching: false,
      });
      img.elementId = BASE_ID;
      baseImg = img;
      canvas.add(img);
      ensureSystemOrder();
      canvas.requestRenderAll();
      baseImageLoaded.value = true;
      if (tainted) baseImageError.value = 'tainted';
      return true;
    });
  }

  /* ---------- element ↔ fabric ---------- */

  function fromElement(el) {
    switch (el.type) {
      case 'infoCard': return infoCardFromElement(el);
      case 'line': return arrowFromElement(el);
      case 'text': {
        const s = el.style;
        const t = new fabric.Textbox(el.text || '', {
          left: el.x, top: el.y, width: el.width,
          scaleX: el.scale ?? 1, scaleY: el.scale ?? 1, angle: el.angle || 0,
          fontSize: s.fontSize, fontFamily: s.fontFamily, fontWeight: s.fontWeight,
          fill: s.color, backgroundColor: s.background || '', textAlign: s.align || 'left',
          lineHeight: 1.25, splitByGrapheme: true,
          lockUniScaling: true, transparentCorners: false, cornerColor: '#2563eb', cornerStrokeColor: '#fff', cornerSize: 9, borderColor: '#2563eb',
        });
        t.elementId = el.id; t.locked = !!el.locked;
        t.setControlsVisibility({ mt: false, mb: false });
        return applyLockState(t);
      }
      case 'shape': {
        const s = el.style;
        const common = {
          left: el.x, top: el.y, angle: el.angle || 0,
          fill: s.fill, stroke: s.stroke, strokeWidth: s.strokeWidth,
          strokeDashArray: Array.isArray(s.dash) && s.dash.length ? [...s.dash] : null,
          strokeUniform: true, transparentCorners: false, cornerColor: '#2563eb', cornerStrokeColor: '#fff', cornerSize: 9, borderColor: '#2563eb',
        };
        const o = el.shape === 'ellipse'
          ? new fabric.Ellipse({ ...common, rx: el.width / 2, ry: el.height / 2 })
          : new fabric.Rect({ ...common, width: el.width, height: el.height, rx: s.borderRadius || 0, ry: s.borderRadius || 0 });
        o.elementId = el.id; o.locked = !!el.locked; o.shapeKind = el.shape;
        return applyLockState(o);
      }
      default: return null;
    }
  }

  function toElement(obj) {
    if (!obj || SYSTEM_IDS.has(obj.elementId)) return null;
    if (obj.type === 'infoCard') return infoCardToElement(obj);
    if (obj.type === 'arrow') return arrowToElement(obj);
    if (obj.type === 'textbox') {
      return {
        id: obj.elementId, type: 'text', locked: !!obj.locked,
        x: r2(obj.left), y: r2(obj.top), width: r2(obj.width), angle: r2(obj.angle || 0),
        scale: Math.round(((obj.scaleX + obj.scaleY) / 2) * 1000) / 1000,
        text: obj.text || '',
        style: {
          fontSize: obj.fontSize, fontFamily: obj.fontFamily, fontWeight: obj.fontWeight,
          color: obj.fill, background: obj.backgroundColor || '', padding: 4, align: obj.textAlign || 'left',
        },
      };
    }
    if (obj.type === 'rect' || obj.type === 'ellipse') {
      const w = obj.type === 'ellipse' ? obj.rx * 2 : obj.width;
      const h = obj.type === 'ellipse' ? obj.ry * 2 : obj.height;
      return {
        id: obj.elementId, type: 'shape', shape: obj.type === 'ellipse' ? 'ellipse' : 'rect', locked: !!obj.locked,
        x: r2(obj.left), y: r2(obj.top), width: r2(w * obj.scaleX), height: r2(h * obj.scaleY), angle: r2(obj.angle || 0),
        style: {
          fill: obj.fill, stroke: obj.stroke, strokeWidth: obj.strokeWidth,
          dash: Array.isArray(obj.strokeDashArray) && obj.strokeDashArray.length ? [...obj.strokeDashArray] : null,
          borderRadius: obj.type === 'rect' ? (obj.rx || 0) : 0,
        },
      };
    }
    return null;
  }

  function r2(v) { return Math.round((Number(v) || 0) * 100) / 100; }

  /* ---------- 載入／序列化 ---------- */

  function getObjects() {
    return canvas ? canvas.getObjects().filter(o => !SYSTEM_IDS.has(o.elementId)) : [];
  }

  function toElements() {
    return getObjects().map(toElement).filter(Boolean);
  }

  function loadDrawing(drawing) {
    if (!canvas) return;
    defaults = {
      text: { ...DEFAULT_TEXT_STYLE, ...(drawing.defaults?.text || {}) },
      shape: { ...DEFAULT_SHAPE_STYLE, ...(drawing.defaults?.shape || {}) },
      line: { ...DEFAULT_LINE_STYLE, ...(drawing.defaults?.line || {}) },
    };
    setCanvasSize(drawing.canvas.width, drawing.canvas.height, drawing.canvas.background);
    loadElements(drawing.elements, { resetHistory: true });
    zoomToFit();
  }

  function loadElements(elements, { resetHistory = false } = {}) {
    if (!canvas) return;
    suspendHistory = true;
    canvas.discardActiveObject();
    getObjects().forEach(o => canvas.remove(o));
    for (const el of elements) {
      const obj = fromElement(el);
      if (obj) { if (readOnly.value) makeReadOnly(obj); canvas.add(obj); }
    }
    canvas.requestRenderAll();
    suspendHistory = false;
    bumpObjects();
    if (resetHistory) {
      history.length = 0;
      historyIndex = -1;
      pushHistory(true);
      dirty.value = false;
    }
  }

  function makeReadOnly(obj) {
    obj.set({ selectable: false, evented: true, hoverCursor: 'default', hasControls: false, hasBorders: false });
  }

  function getDefaults() { return JSON.parse(JSON.stringify(defaults)); }
  function setDefault(kind, style) { defaults[kind] = { ...defaults[kind], ...style }; }

  /* ---------- 歷史 ---------- */

  function snapshot() { return JSON.stringify(toElements()); }

  function pushHistory(force = false) {
    if (suspendHistory || !canvas) return;
    const snap = snapshot();
    if (!force && historyIndex >= 0 && history[historyIndex] === snap) return;
    history.splice(historyIndex + 1);
    history.push(snap);
    if (history.length > HISTORY_LIMIT) history.shift();
    historyIndex = history.length - 1;
    updateHistoryFlags();
    if (!force) markDirty();
  }

  function updateHistoryFlags() {
    canUndo.value = historyIndex > 0;
    canRedo.value = historyIndex < history.length - 1;
  }

  function applyHistory(index) {
    const snap = history[index];
    if (snap == null) return;
    historyIndex = index;
    const elements = JSON.parse(snap).map(e => normalizeElement(e)).filter(Boolean);
    loadElements(elements);
    updateHistoryFlags();
    markDirty();
  }

  function undo() { if (canUndo.value) applyHistory(historyIndex - 1); }
  function redo() { if (canRedo.value) applyHistory(historyIndex + 1); }

  function markDirty() { dirty.value = true; emit('change'); }
  function markClean() { dirty.value = false; }
  function bumpObjects() { objectsVersion.value++; }
  function bumpSelection() { selectionVersion.value++; }

  /* ---------- 選取 ---------- */

  function syncSelection() {
    if (!canvas) return;
    const active = canvas.getActiveObjects().filter(o => !SYSTEM_IDS.has(o.elementId));
    selected.value = active.map(o => markRaw(o));
    bumpSelection();
    emit('selection', selected.value);
  }

  function selectById(id) {
    const obj = getObjects().find(o => o.elementId === id);
    if (!obj || !canvas) return;
    canvas.setActiveObject(obj);
    canvas.requestRenderAll();
    syncSelection();
  }

  function selectAll() {
    if (!canvas || readOnly.value) return;
    const objs = getObjects().filter(o => o.selectable !== false);
    if (!objs.length) return;
    canvas.discardActiveObject();
    const sel = new fabric.ActiveSelection(objs, { canvas });
    canvas.setActiveObject(sel);
    canvas.requestRenderAll();
    syncSelection();
  }

  function deselect() {
    if (!canvas) return;
    canvas.discardActiveObject();
    canvas.requestRenderAll();
    syncSelection();
  }

  /* ---------- 元素操作 ---------- */

  function addElement(el, { select = true, history: pushH = true } = {}) {
    if (!canvas) return null;
    const norm = normalizeElement(el);
    const obj = fromElement(norm);
    if (!obj) return null;
    canvas.add(obj);
    if (select) { canvas.setActiveObject(obj); syncSelection(); }
    canvas.requestRenderAll();
    bumpObjects();
    if (pushH) pushHistory();
    return obj;
  }

  function addElements(els, { select = true, history: pushH = true } = {}) {
    if (!canvas) return [];
    const objs = [];
    for (const el of els) {
      const obj = fromElement(normalizeElement(el));
      if (obj) { canvas.add(obj); objs.push(obj); }
    }
    if (select) selectObjects(objs);
    canvas.requestRenderAll();
    syncSelection();
    bumpObjects();
    if (pushH) pushHistory();
    return objs;
  }

  /** 選取指定物件（多個時建立 ActiveSelection）；物件座標必須在建立群組前設定完成 */
  function selectObjects(objs) {
    if (!canvas) return;
    canvas.discardActiveObject();
    if (objs.length === 1) canvas.setActiveObject(objs[0]);
    else if (objs.length > 1) canvas.setActiveObject(new fabric.ActiveSelection(objs, { canvas }));
    canvas.requestRenderAll();
    syncSelection();
  }

  function removeSelected() {
    if (!canvas || readOnly.value) return;
    const objs = canvas.getActiveObjects().filter(o => !SYSTEM_IDS.has(o.elementId) && !o.locked);
    if (!objs.length) return;
    canvas.discardActiveObject();
    objs.forEach(o => canvas.remove(o));
    canvas.requestRenderAll();
    syncSelection();
    bumpObjects();
    pushHistory();
  }

  function removeById(id) {
    const obj = getObjects().find(o => o.elementId === id);
    if (!obj || !canvas) return;
    canvas.discardActiveObject();
    canvas.remove(obj);
    canvas.requestRenderAll();
    syncSelection();
    bumpObjects();
    pushHistory();
  }

  function copy() {
    clipboard = selected.value.map(toElement).filter(Boolean);
    return clipboard.length;
  }

  function paste() {
    if (!clipboard.length || readOnly.value) return;
    const els = clipboard.map(el => cloneElement(el, 24));
    clipboard = els; // 連續貼上持續位移
    addElements(els);
  }

  function duplicateSelected() {
    if (!selected.value.length || readOnly.value) return;
    const els = selected.value.map(toElement).filter(Boolean).map(el => cloneElement(el, 24));
    addElements(els);
  }

  function nudge(dx, dy) {
    if (!canvas || readOnly.value) return;
    const active = canvas.getActiveObject();
    if (!active || active.locked) return;
    active.set({ left: active.left + dx, top: active.top + dy });
    active.setCoords();
    canvas.requestRenderAll();
    pushHistory();
  }

  function reorder(action) {
    if (!canvas || readOnly.value) return;
    const objs = canvas.getActiveObjects().filter(o => !SYSTEM_IDS.has(o.elementId));
    if (!objs.length) return;
    const active = canvas.getActiveObject();
    const target = active?.type === 'activeSelection' ? active : objs[0];
    switch (action) {
      case 'front': canvas.bringToFront(target); break;
      case 'back': canvas.sendToBack(target); break;
      case 'forward': canvas.bringForward(target); break;
      case 'backward': canvas.sendBackwards(target); break;
      default: break;
    }
    ensureSystemOrder();
    canvas.requestRenderAll();
    bumpObjects();
    pushHistory();
  }

  function moveToIndex(id, newIndex) {
    const objs = getObjects();
    const obj = objs.find(o => o.elementId === id);
    if (!obj || !canvas) return;
    // 圖層面板由上到下顯示，index 0 為最上層；fabric index 越大越上層
    const sys = systemCount();
    const fabricIndex = Math.max(sys, Math.min(canvas.getObjects().length - 1, (objs.length - 1 - newIndex) + sys));
    canvas.moveTo(obj, fabricIndex);
    ensureSystemOrder();
    canvas.requestRenderAll();
    bumpObjects();
    pushHistory();
  }

  function setLocked(obj, locked) {
    if (!obj) return;
    obj.locked = !!locked;
    applyLockState(obj);
    if (obj.type === 'arrow' && !locked) obj.set({ hasControls: true });
    obj.setCoords();
    canvas?.requestRenderAll();
    bumpSelection();
    bumpObjects();
    pushHistory();
  }

  function setHidden(obj, hidden) {
    if (!obj) return;
    obj.visible = !hidden;
    obj.evented = !hidden;
    if (hidden && canvas?.getActiveObjects().includes(obj)) deselect();
    canvas?.requestRenderAll();
    bumpObjects();
  }

  /** 對選取物件套用屬性（fabric 屬性），並重繪；資訊卡需另外 recalc */
  function applyToSelected(fn, { history: pushH = true } = {}) {
    if (!canvas) return;
    const objs = canvas.getActiveObjects().filter(o => !SYSTEM_IDS.has(o.elementId));
    objs.forEach(o => { fn(o); if (o.type === 'infoCard') o.recalc(); o.dirty = true; o.setCoords(); });
    canvas.requestRenderAll();
    bumpSelection();
    if (pushH) pushHistory(); else markDirty();
  }

  /** 對指定物件清單套用（例如「套用到所有資訊卡」） */
  function applyToObjects(objs, fn) {
    if (!canvas) return;
    objs.forEach(o => { fn(o); if (o.type === 'infoCard') o.recalc(); o.dirty = true; o.setCoords(); });
    canvas.requestRenderAll();
    bumpSelection();
    pushHistory();
  }

  function refresh() {
    canvas?.requestRenderAll();
    bumpSelection();
    pushHistory();
  }

  /* ---------- 縮放／平移 ---------- */

  function setZoom(z, point) {
    if (!canvas) return;
    const nz = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, z));
    if (point) canvas.zoomToPoint(point, nz);
    else {
      const center = new fabric.Point(canvas.getWidth() / 2, canvas.getHeight() / 2);
      canvas.zoomToPoint(center, nz);
    }
    zoom.value = nz;
    canvas.requestRenderAll();
  }

  function zoomIn() { setZoom(zoom.value * 1.2); }
  function zoomOut() { setZoom(zoom.value / 1.2); }

  function zoomToFit(paddingPx = 32) {
    if (!canvas) return;
    const { width, height } = canvasSize.value;
    const cw = canvas.getWidth(), ch = canvas.getHeight();
    const z = Math.min((cw - paddingPx * 2) / width, (ch - paddingPx * 2) / height);
    const nz = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, z));
    const tx = (cw - width * nz) / 2, ty = (ch - height * nz) / 2;
    canvas.setViewportTransform([nz, 0, 0, nz, tx, ty]);
    zoom.value = nz;
    canvas.requestRenderAll();
  }

  function zoomTo100() {
    if (!canvas) return;
    const { width, height } = canvasSize.value;
    const cw = canvas.getWidth(), ch = canvas.getHeight();
    canvas.setViewportTransform([1, 0, 0, 1, (cw - width) / 2, (ch - height) / 2]);
    zoom.value = 1;
    canvas.requestRenderAll();
  }

  /** 目前可視區中心（畫布邏輯座標） */
  function getViewCenter() {
    if (!canvas) return { x: canvasSize.value.width / 2, y: canvasSize.value.height / 2 };
    const inv = fabric.util.invertTransform(canvas.viewportTransform);
    return fabric.util.transformPoint({ x: canvas.getWidth() / 2, y: canvas.getHeight() / 2 }, inv);
  }

  function getViewRect() {
    if (!canvas) return { left: 0, top: 0, width: canvasSize.value.width, height: canvasSize.value.height };
    const inv = fabric.util.invertTransform(canvas.viewportTransform);
    const tl = fabric.util.transformPoint({ x: 0, y: 0 }, inv);
    const br = fabric.util.transformPoint({ x: canvas.getWidth(), y: canvas.getHeight() }, inv);
    return { left: tl.x, top: tl.y, width: br.x - tl.x, height: br.y - tl.y };
  }

  /* ---------- 工具與事件 ---------- */

  let spaceDown = false;
  let panning = false;
  let lastPan = null;
  let drawing = null; // { type, start, obj }

  function setTool(name) {
    tool.value = name;
    if (!canvas) return;
    const isSelect = name === TOOLS.select;
    canvas.selection = isSelect && !readOnly.value;
    canvas.defaultCursor = name === TOOLS.pan ? 'grab' : (isSelect ? 'default' : 'crosshair');
    canvas.hoverCursor = isSelect ? 'move' : canvas.defaultCursor;
    getObjects().forEach(o => { o.evented = isSelect; });
    if (!isSelect) canvas.discardActiveObject();
    canvas.requestRenderAll();
    syncSelection();
  }

  function setSpaceDown(v) {
    spaceDown = v;
    if (canvas) canvas.defaultCursor = v ? 'grab' : (tool.value === TOOLS.pan ? 'grab' : (tool.value === TOOLS.select ? 'default' : 'crosshair'));
  }

  function bindEvents() {
    canvas.on('selection:created', syncSelection);
    canvas.on('selection:updated', syncSelection);
    canvas.on('selection:cleared', syncSelection);
    canvas.on('object:modified', () => { bumpSelection(); pushHistory(); });
    canvas.on('text:changed', () => { bumpSelection(); markDirty(); });
    canvas.on('text:editing:exited', () => { pushHistory(); });
    canvas.on('object:moving', onObjectMoving);
    canvas.on('after:render', drawGuides);

    canvas.on('mouse:wheel', (opt) => {
      const e = opt.e;
      e.preventDefault();
      e.stopPropagation();
      const delta = e.deltaY;
      let z = zoom.value * Math.pow(0.999, delta);
      setZoom(z, new fabric.Point(e.offsetX, e.offsetY));
    });

    canvas.on('mouse:down', (opt) => {
      const e = opt.e;
      const isPanTrigger = spaceDown || tool.value === TOOLS.pan || e.button === 1;
      if (isPanTrigger) {
        panning = true;
        lastPan = { x: e.clientX, y: e.clientY };
        canvas.setCursor('grabbing');
        canvas.selection = false;
        return;
      }
      if (readOnly.value) return;
      if (tool.value === TOOLS.text) {
        const p = canvas.getPointer(e);
        startText(p);
        return;
      }
      if (DRAW_TOOLS.has(tool.value)) {
        const p = canvas.getPointer(e);
        startDraw(tool.value, p);
      }
    });

    canvas.on('mouse:move', (opt) => {
      const e = opt.e;
      if (panning && lastPan) {
        const dx = e.clientX - lastPan.x, dy = e.clientY - lastPan.y;
        lastPan = { x: e.clientX, y: e.clientY };
        canvas.relativePan(new fabric.Point(dx, dy));
        return;
      }
      if (drawing) {
        const p = canvas.getPointer(e);
        updateDraw(p, e.shiftKey);
      }
    });

    canvas.on('mouse:up', (opt) => {
      if (guides.length) { guides = []; canvas.requestRenderAll(); }
      if (panning) {
        panning = false;
        lastPan = null;
        canvas.setCursor(tool.value === TOOLS.pan || spaceDown ? 'grab' : 'default');
        canvas.selection = tool.value === TOOLS.select && !readOnly.value;
        return;
      }
      if (drawing) finishDraw(opt.e);
    });
  }

  function startText(p) {
    const s = defaults.text;
    const el = normalizeElement({
      id: genElementId(), type: 'text', x: p.x, y: p.y, width: Math.max(120, s.fontSize * 8),
      text: '', style: { ...s },
    });
    setTool(TOOLS.select);
    const obj = addElement(el, { select: true, history: false });
    if (obj) {
      obj.enterEditing();
      obj.hiddenTextarea?.focus();
    }
  }

  function startDraw(kind, p) {
    const s = defaults.line;
    const sh = defaults.shape;
    let obj = null;
    if (kind === TOOLS.rect || kind === TOOLS.ellipse) {
      const el = normalizeElement({
        id: genElementId(), type: 'shape', shape: kind === TOOLS.ellipse ? 'ellipse' : 'rect',
        x: p.x, y: p.y, width: 2, height: 2, style: { ...sh },
      });
      obj = fromElement(el);
    } else {
      const style = { ...s };
      if (kind === TOOLS.line) { style.arrowStart = false; style.arrowEnd = false; style.dash = null; }
      if (kind === TOOLS.arrow) { style.arrowStart = false; style.arrowEnd = true; style.dash = null; }
      if (kind === TOOLS.arrowDouble) { style.arrowStart = true; style.arrowEnd = true; style.dash = null; }
      if (kind === TOOLS.dashed) { style.arrowStart = false; style.arrowEnd = false; style.dash = [Math.max(6, style.strokeWidth * 4), Math.max(4, style.strokeWidth * 3)]; }
      const el = normalizeElement({ id: genElementId(), type: 'line', x1: p.x, y1: p.y, x2: p.x, y2: p.y, style });
      obj = fromElement(el);
    }
    if (!obj) return;
    obj.evented = false;
    canvas.add(obj);
    drawing = { kind, start: p, obj };
  }

  function updateDraw(p, shiftKey) {
    const { kind, start, obj } = drawing;
    if (kind === TOOLS.rect || kind === TOOLS.ellipse) {
      let w = p.x - start.x, h = p.y - start.y;
      if (shiftKey) { const m = Math.max(Math.abs(w), Math.abs(h)); w = Math.sign(w || 1) * m; h = Math.sign(h || 1) * m; }
      const left = Math.min(start.x, start.x + w), top = Math.min(start.y, start.y + h);
      const aw = Math.max(2, Math.abs(w)), ah = Math.max(2, Math.abs(h));
      if (obj.type === 'ellipse') obj.set({ left, top, rx: aw / 2, ry: ah / 2 });
      else obj.set({ left, top, width: aw, height: ah });
    } else {
      let x2 = p.x, y2 = p.y;
      if (shiftKey) {
        const dx = x2 - start.x, dy = y2 - start.y, len = Math.hypot(dx, dy), step = Math.PI / 4;
        const a = Math.round(Math.atan2(dy, dx) / step) * step;
        x2 = start.x + Math.cos(a) * len; y2 = start.y + Math.sin(a) * len;
      }
      obj.set({ x2, y2 });
    }
    obj.setCoords();
    canvas.requestRenderAll();
  }

  function finishDraw() {
    const { kind, start, obj } = drawing;
    drawing = null;
    let tooSmall = false;
    if (kind === TOOLS.rect || kind === TOOLS.ellipse) {
      const w = obj.type === 'ellipse' ? obj.rx * 2 : obj.width;
      const h = obj.type === 'ellipse' ? obj.ry * 2 : obj.height;
      tooSmall = w < 4 && h < 4;
    } else {
      tooSmall = Math.hypot(obj.x2 - start.x, obj.y2 - start.y) < 4;
    }
    if (tooSmall) { canvas.remove(obj); canvas.requestRenderAll(); setTool(TOOLS.select); return; }
    obj.evented = true;
    setTool(TOOLS.select);
    canvas.setActiveObject(obj);
    canvas.requestRenderAll();
    syncSelection();
    bumpObjects();
    pushHistory();
  }

  /* ---------- 對齊參考線 ---------- */

  let guides = [];

  function onObjectMoving(opt) {
    guides = [];
    if (!snapEnabled.value || !canvas) return;
    const target = opt.target;
    if (!target || SYSTEM_IDS.has(target.elementId)) return;
    const threshold = 6 / zoom.value;
    const tb = target.getBoundingRect(true, true);
    const tCenterX = tb.left + tb.width / 2, tCenterY = tb.top + tb.height / 2;
    const candidates = getObjects().filter(o => o !== target && o.visible !== false && !(target.type === 'activeSelection' && target.contains(o)));
    // 畫布邊界與中心線也納入
    const { width: W, height: H } = canvasSize.value;
    const xs = [0, W / 2, W], ys = [0, H / 2, H];
    for (const o of candidates) {
      const b = o.getBoundingRect(true, true);
      xs.push(b.left, b.left + b.width / 2, b.left + b.width);
      ys.push(b.top, b.top + b.height / 2, b.top + b.height);
    }
    let dx = null, dy = null, gx = null, gy = null;
    for (const x of xs) {
      for (const tx of [tb.left, tCenterX, tb.left + tb.width]) {
        const d = x - tx;
        if (Math.abs(d) <= threshold && (dx === null || Math.abs(d) < Math.abs(dx))) { dx = d; gx = x; }
      }
    }
    for (const y of ys) {
      for (const ty of [tb.top, tCenterY, tb.top + tb.height]) {
        const d = y - ty;
        if (Math.abs(d) <= threshold && (dy === null || Math.abs(d) < Math.abs(dy))) { dy = d; gy = y; }
      }
    }
    if (dx !== null) { target.set('left', target.left + dx); guides.push({ axis: 'x', pos: gx }); }
    if (dy !== null) { target.set('top', target.top + dy); guides.push({ axis: 'y', pos: gy }); }
    if (dx !== null || dy !== null) target.setCoords();
  }

  function drawGuides() {
    if (!canvas || !guides.length) return;
    const ctx = canvas.contextTop;
    if (!ctx) return;
    const vpt = canvas.viewportTransform;
    ctx.save();
    ctx.strokeStyle = '#f43f5e';
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    for (const g of guides) {
      ctx.beginPath();
      if (g.axis === 'x') { const x = g.pos * vpt[0] + vpt[4]; ctx.moveTo(x, 0); ctx.lineTo(x, canvas.getHeight()); }
      else { const y = g.pos * vpt[3] + vpt[5]; ctx.moveTo(0, y); ctx.lineTo(canvas.getWidth(), y); }
      ctx.stroke();
    }
    ctx.restore();
  }

  function clearGuides() { guides = []; canvas?.requestRenderAll(); }

  /* ---------- 匯出用 ---------- */

  function getCanvas() { return canvas; }

  const selectionType = computed(() => {
    const s = selected.value;
    if (!s.length) return null;
    const types = new Set(s.map(o => o.type));
    return types.size === 1 ? [...types][0] : 'mixed';
  });

  return {
    // state
    ready, readOnly, zoom, tool, canvasSize, selected, selectionType, selectionVersion, objectsVersion,
    dirty, canUndo, canRedo, snapEnabled, baseImageLoaded, baseImageError,
    // lifecycle
    init, dispose, fitToContainer, getCanvas, on,
    // drawing
    loadDrawing, loadElements, toElements, setBaseImage, setCanvasSize, getDefaults, setDefault,
    // objects
    getObjects, toElement, addElement, addElements, removeSelected, removeById, copy, paste, duplicateSelected,
    nudge, reorder, moveToIndex, setLocked, setHidden, applyToSelected, applyToObjects, refresh,
    selectById, selectObjects, selectAll, deselect,
    // history
    undo, redo, pushHistory, markClean, markDirty,
    // view
    setZoom, zoomIn, zoomOut, zoomToFit, zoomTo100, getViewCenter, getViewRect,
    // tools
    setTool, setSpaceDown, clearGuides,
    TOOLS,
  };
}
