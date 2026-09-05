/**
 * 銷售圖面編輯器：資訊卡自訂 fabric 類別（fabric.js 5.x）
 * 規格：docs/銷售圖面編輯器-spec.md §4.5
 *
 * - 自行 _render 表格（標題列 + 項目欄／值欄 + 格線）
 * - 四角把手：等比縮放（scale，文字跟隨）
 * - 邊中點把手：改總寬／總高，差值依比例分配到欄寬／列高，文字大小不變
 * - 欄分界把手（卡片頂緣上方）：改欄寬；Shift 拖曳則總寬跟著變
 * - 列分界把手（卡片左緣外側）：改該列列高
 */
import { fabric } from 'fabric';
import { DEFAULT_INFO_CARD_STYLE, DEFAULT_INFO_CARD_LAYOUT } from './drawingSchema';

export const MIN_COL_WIDTH = 40;
export const MIN_ROW_HEIGHT = 18;
export const MIN_CARD_SCALE = 0.2;
export const MAX_CARD_SCALE = 5;
const LINE_HEIGHT_RATIO = 1.35;
const AUTO_COL_MAX = 420;

let _measureCtx = null;
function measureCtx() {
  if (!_measureCtx) _measureCtx = document.createElement('canvas').getContext('2d');
  return _measureCtx;
}

function fontString(style) {
  return `${style.fontWeight || 'normal'} ${style.fontSize}px ${style.fontFamily}`;
}

/** 逐字換行（中英混排皆以字元為單位；保留使用者換行） */
function wrapText(ctx, text, maxWidth) {
  const lines = [];
  for (const para of String(text ?? '').split('\n')) {
    let line = '';
    for (const ch of para) {
      const test = line + ch;
      if (line && ctx.measureText(test).width > maxWidth) { lines.push(line); line = ch; }
      else line = test;
    }
    lines.push(line);
  }
  return lines;
}

function roundRectPath(ctx, x, y, w, h, r) {
  const rr = Math.max(0, Math.min(r || 0, w / 2, h / 2));
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.lineTo(x + w - rr, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + rr);
  ctx.lineTo(x + w, y + h - rr);
  ctx.quadraticCurveTo(x + w, y + h, x + w - rr, y + h);
  ctx.lineTo(x + rr, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - rr);
  ctx.lineTo(x, y + rr);
  ctx.quadraticCurveTo(x, y, x + rr, y);
  ctx.closePath();
}

function drawTextBlock(ctx, lines, x, y, w, h, align, color, fontSize, padding) {
  const lh = fontSize * LINE_HEIGHT_RATIO;
  const totalH = lines.length * lh;
  let ty = y + (h - totalH) / 2 + lh / 2;
  ctx.fillStyle = color;
  ctx.textBaseline = 'middle';
  ctx.textAlign = align;
  const tx = align === 'center' ? x + w / 2 : (align === 'right' ? x + w - padding : x + padding);
  for (const line of lines) {
    ctx.fillText(line, tx, ty);
    ty += lh;
  }
}

/* ---------- 把手 ---------- */

function transformToScreen(obj, localPoint, offset = { x: 0, y: 0 }) {
  // 物件尚未加入畫布時（建構階段 setCoords）沒有 viewportTransform，回傳原點即可
  const vpt = obj.canvas ? obj.canvas.viewportTransform : [1, 0, 0, 1, 0, 0];
  const m = fabric.util.multiplyTransformMatrices(vpt, obj.calcTransformMatrix());
  const p = fabric.util.transformPoint(localPoint, m);
  // 自訂 positionHandler 不會自動套用 offsetX/offsetY，這裡以螢幕像素加上（依物件角度旋轉）
  const rad = fabric.util.degreesToRadians(obj.angle || 0);
  const ox = offset.x * Math.cos(rad) - offset.y * Math.sin(rad);
  const oy = offset.x * Math.sin(rad) + offset.y * Math.cos(rad);
  return new fabric.Point(p.x + ox, p.y + oy);
}

function renderTriangle(ctx, left, top, styleOverride, fabricObject) {
  const size = 10;
  ctx.save();
  ctx.translate(left, top);
  ctx.rotate(fabric.util.degreesToRadians(fabricObject.angle));
  ctx.beginPath();
  ctx.moveTo(0, size / 2);
  ctx.lineTo(-size / 2, -size / 2);
  ctx.lineTo(size / 2, -size / 2);
  ctx.closePath();
  ctx.fillStyle = '#2563eb';
  ctx.fill();
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.restore();
}

function renderRowHandle(ctx, left, top, styleOverride, fabricObject) {
  const size = 10;
  ctx.save();
  ctx.translate(left, top);
  ctx.rotate(fabric.util.degreesToRadians(fabricObject.angle));
  ctx.beginPath();
  ctx.moveTo(size / 2, 0);
  ctx.lineTo(-size / 2, -size / 2);
  ctx.lineTo(-size / 2, size / 2);
  ctx.closePath();
  ctx.fillStyle = '#2563eb';
  ctx.fill();
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.restore();
}

function isSoloSelected(obj) {
  return !!obj.canvas && obj.canvas.getActiveObject() === obj;
}

function changeCardWidth(eventData, transform, x, y) {
  const t = transform.target;
  const local = fabric.controlsUtils.getLocalPoint(transform, transform.originX, transform.originY, x, y);
  const centered = transform.originX === 'center' && transform.originY === 'center';
  const newWidth = Math.abs(local.x * (centered ? 2 : 1) / t.scaleX);
  return t.setTotalWidth(newWidth);
}

function changeCardHeight(eventData, transform, x, y) {
  const t = transform.target;
  const local = fabric.controlsUtils.getLocalPoint(transform, transform.originX, transform.originY, x, y);
  const centered = transform.originX === 'center' && transform.originY === 'center';
  const newHeight = Math.abs(local.y * (centered ? 2 : 1) / t.scaleY);
  return t.setTotalHeight(newHeight);
}

const { wrapWithFireEvent, wrapWithFixedAnchor, scaleCursorStyleHandler } = fabric.controlsUtils;
const widthHandler = wrapWithFireEvent('resizing', wrapWithFixedAnchor(changeCardWidth));
const heightHandler = wrapWithFireEvent('resizing', wrapWithFixedAnchor(changeCardHeight));

function buildControls(card) {
  const base = fabric.Object.prototype.controls;
  const controls = {
    tl: base.tl, tr: base.tr, bl: base.bl, br: base.br, mtr: base.mtr,
    ml: new fabric.Control({ x: -0.5, y: 0, cursorStyleHandler: scaleCursorStyleHandler, actionHandler: widthHandler, actionName: 'resizing' }),
    mr: new fabric.Control({ x: 0.5, y: 0, cursorStyleHandler: scaleCursorStyleHandler, actionHandler: widthHandler, actionName: 'resizing' }),
    mt: new fabric.Control({ x: 0, y: -0.5, cursorStyleHandler: scaleCursorStyleHandler, actionHandler: heightHandler, actionName: 'resizing' }),
    mb: new fabric.Control({ x: 0, y: 0.5, cursorStyleHandler: scaleCursorStyleHandler, actionHandler: heightHandler, actionName: 'resizing' }),
  };

  // 欄分界把手
  controls.colDiv = new fabric.Control({
    positionHandler(dim, finalMatrix, obj) {
      return transformToScreen(obj, { x: -obj.width / 2 + obj.cardLayout.colWidths[0], y: -obj.height / 2 }, { x: 0, y: -12 });
    },
    cursorStyle: 'col-resize',
    actionName: 'colResize',
    actionHandler(eventData, transform, x, y) {
      const t = transform.target;
      const local = fabric.controlsUtils.getLocalPoint(transform, 'left', 'top', x, y);
      const [c0, c1] = t.cardLayout.colWidths;
      const total = c0 + c1;
      if (eventData.shiftKey) {
        const n0 = Math.max(MIN_COL_WIDTH, local.x / t.scaleX);
        t.cardLayout.colWidths = [n0, c1];
      } else {
        const n0 = Math.max(MIN_COL_WIDTH, Math.min(total - MIN_COL_WIDTH, local.x / t.scaleX));
        t.cardLayout.colWidths = [n0, total - n0];
      }
      t.recalc();
      return true;
    },
    render: renderTriangle,
    getVisibility(obj) { return obj.cardLayout.showLabelColumn && isSoloSelected(obj); },
  });

  // 列分界把手（每列一個）
  const rowCount = card.cardRows.length;
  for (let i = 0; i < rowCount; i++) {
    controls[`rowDiv${i}`] = new fabric.Control({
      positionHandler(dim, finalMatrix, obj) {
        const y = -obj.height / 2 + obj._headerH + obj._rowTops[i] + obj._rowHeights[i];
        return transformToScreen(obj, { x: -obj.width / 2, y }, { x: -12, y: 0 });
      },
      cursorStyle: 'row-resize',
      actionName: 'rowResize',
      actionHandler(eventData, transform, x, y) {
        const t = transform.target;
        const local = fabric.controlsUtils.getLocalPoint(transform, 'left', 'top', x, y);
        const top = t._headerH + t._rowTops[i];
        const h = Math.max(MIN_ROW_HEIGHT, local.y / t.scaleY - top);
        const rh = t._ensureRowHeightsArray();
        rh[i] = Math.round(h);
        t.recalc();
        return true;
      },
      render: renderRowHandle,
      getVisibility(obj) { return i < obj.cardRows.length && isSoloSelected(obj); },
    });
  }
  return controls;
}

/* ---------- 類別 ---------- */

const CUSTOM_PROPS = ['elementId', 'unitDocId', 'unitId', 'cardHeader', 'cardRows', 'cardLayout', 'cardStyle', 'locked'];

export const InfoCard = fabric.util.createClass(fabric.Object, {
  type: 'infoCard',
  cacheProperties: fabric.Object.prototype.cacheProperties.concat(['cardRows', 'cardLayout', 'cardStyle', 'cardHeader']),
  stateProperties: fabric.Object.prototype.stateProperties.concat(['cardRows', 'cardLayout', 'cardStyle', 'cardHeader']),

  initialize(options = {}) {
    const opts = { ...options };
    this.callSuper('initialize', opts);
    this.elementId = opts.elementId || null;
    this.unitDocId = opts.unitDocId || null;
    this.unitId = opts.unitId || '';
    this.locked = !!opts.locked;
    this.cardHeader = { show: true, text: this.unitId, overridden: false, ...(opts.cardHeader || {}) };
    this.cardRows = Array.isArray(opts.cardRows) ? opts.cardRows.map(r => ({ ...r })) : [];
    this.cardLayout = { ...DEFAULT_INFO_CARD_LAYOUT, ...(opts.cardLayout || {}) };
    if (Array.isArray(this.cardLayout.colWidths)) this.cardLayout.colWidths = [...this.cardLayout.colWidths];
    if (Array.isArray(this.cardLayout.rowHeights)) this.cardLayout.rowHeights = [...this.cardLayout.rowHeights];
    this.cardStyle = { ...DEFAULT_INFO_CARD_STYLE, ...(opts.cardStyle || {}) };
    this.cardFormat = { shortLabel: true, priceUnit: 'wan', ...(opts.cardFormat || {}) };
    this.set({
      strokeWidth: 0,
      objectCaching: true,
      lockUniScaling: true,
      lockScalingFlip: true,
      transparentCorners: false,
      cornerColor: '#2563eb',
      cornerStrokeColor: '#ffffff',
      cornerSize: 9,
      borderColor: '#2563eb',
      padding: 0,
    });
    this._controlRowCount = -1;
    this.recalc();
  },

  /** 重新計算欄寬（自動）、每列高度與整體尺寸；資料變更後必呼叫 */
  recalc() {
    const S = this.cardStyle;
    const L = this.cardLayout;
    const ctx = measureCtx();
    ctx.font = fontString(S);
    const pad = L.padding ?? 6;
    const lh = S.fontSize * LINE_HEIGHT_RATIO;

    // 欄寬（null → 依內容自動）
    if (!Array.isArray(L.colWidths) || L.colWidths.length !== 2) {
      let maxLabel = 0, maxValue = 0;
      for (const r of this.cardRows) {
        maxLabel = Math.max(maxLabel, ctx.measureText(String(r.label ?? '')).width);
        maxValue = Math.max(maxValue, ctx.measureText(String(r.value ?? '')).width);
      }
      const headerW = this.cardHeader.show ? ctx.measureText(String(this.cardHeader.text ?? '')).width + pad * 2 : 0;
      let c0 = Math.min(AUTO_COL_MAX, Math.max(MIN_COL_WIDTH, Math.ceil(maxLabel) + pad * 2 + 2));
      let c1 = Math.min(AUTO_COL_MAX, Math.max(MIN_COL_WIDTH, Math.ceil(maxValue) + pad * 2 + 2));
      if (!L.showLabelColumn) c0 = 0;
      if (c0 + c1 < headerW) c1 = headerW - c0;
      L.colWidths = [Math.max(L.showLabelColumn ? MIN_COL_WIDTH : 0, c0), c1];
    }
    const showLabel = L.showLabelColumn !== false;
    const c0 = showLabel ? Math.max(MIN_COL_WIDTH, L.colWidths[0]) : 0;
    const c1 = Math.max(MIN_COL_WIDTH, L.colWidths[1]);
    const width = c0 + c1;

    // 每列文字換行與高度
    const rows = this.cardRows;
    const rh = Array.isArray(L.rowHeights) ? L.rowHeights : [];
    this._lines = [];
    this._rowHeights = [];
    this._rowTops = [];
    let y = 0;
    for (let i = 0; i < rows.length; i++) {
      const r = rows[i];
      const labelLines = showLabel ? wrapText(ctx, r.label, Math.max(4, c0 - pad * 2)) : [];
      const valueLines = wrapText(ctx, r.value, Math.max(4, c1 - pad * 2));
      const autoH = Math.max(labelLines.length, valueLines.length, 1) * lh + pad * 2;
      const fixed = rh[i];
      const h = (typeof fixed === 'number' && fixed > 0) ? Math.max(MIN_ROW_HEIGHT, fixed) : Math.ceil(autoH);
      this._lines.push({ label: labelLines, value: valueLines });
      this._rowTops.push(y);
      this._rowHeights.push(h);
      y += h;
    }
    this._headerH = this.cardHeader.show ? Math.max(MIN_ROW_HEIGHT, L.headerHeight || 32) : 0;
    const height = this._headerH + y;
    this.set({ width: Math.max(width, MIN_COL_WIDTH), height: Math.max(height, MIN_ROW_HEIGHT) });

    if (this._controlRowCount !== rows.length) {
      this.controls = buildControls(this);
      this._controlRowCount = rows.length;
    }
    this.dirty = true;
    if (this.canvas) this.setCoords();
    return this;
  },

  _ensureRowHeightsArray() {
    const L = this.cardLayout;
    if (!Array.isArray(L.rowHeights) || L.rowHeights.length !== this.cardRows.length) {
      L.rowHeights = this._rowHeights.map((h, i) => (Array.isArray(L.rowHeights) && typeof L.rowHeights[i] === 'number' ? L.rowHeights[i] : null));
    }
    return L.rowHeights;
  },

  /** 改總寬：差值依比例分配至各欄 */
  setTotalWidth(newWidth) {
    const L = this.cardLayout;
    const showLabel = L.showLabelColumn !== false;
    const cols = showLabel ? 2 : 1;
    const min = MIN_COL_WIDTH * cols;
    const target = Math.max(min, newWidth);
    const cur = this.width;
    if (Math.abs(target - cur) < 0.5) return false;
    if (showLabel) {
      const [c0, c1] = L.colWidths;
      const ratio = c0 / (c0 + c1);
      let n0 = Math.max(MIN_COL_WIDTH, target * ratio);
      let n1 = Math.max(MIN_COL_WIDTH, target - n0);
      L.colWidths = [n0, n1];
    } else {
      L.colWidths = [L.colWidths[0], target];
    }
    this.recalc();
    return true;
  },

  /** 改總高：先把自動列轉固定，再依比例分配 */
  setTotalHeight(newHeight) {
    const rows = this.cardRows.length;
    if (rows === 0) return false;
    const rh = this._ensureRowHeightsArray();
    for (let i = 0; i < rows; i++) if (typeof rh[i] !== 'number') rh[i] = this._rowHeights[i];
    const bodyCur = rh.reduce((s, h) => s + h, 0);
    const bodyTarget = Math.max(MIN_ROW_HEIGHT * rows, newHeight - this._headerH);
    if (Math.abs(bodyTarget - bodyCur) < 0.5) return false;
    const scale = bodyTarget / bodyCur;
    this.cardLayout.rowHeights = rh.map(h => Math.max(MIN_ROW_HEIGHT, Math.round(h * scale)));
    this.recalc();
    return true;
  },

  /** 重設格線：欄寬與列高恢復自動 */
  resetLayout() {
    this.cardLayout.colWidths = null;
    this.cardLayout.rowHeights = null;
    this.recalc();
  },

  _render(ctx) {
    const S = this.cardStyle;
    const L = this.cardLayout;
    const w = this.width, h = this.height;
    const x0 = -w / 2, y0 = -h / 2;
    const pad = L.padding ?? 6;
    const showLabel = L.showLabelColumn !== false;
    const c0 = showLabel ? Math.max(MIN_COL_WIDTH, L.colWidths[0]) : 0;
    const c1 = w - c0;
    const radius = S.borderRadius || 0;

    // 背景（透明度只作用於底色）
    ctx.save();
    roundRectPath(ctx, x0, y0, w, h, radius);
    ctx.clip();
    ctx.save();
    ctx.globalAlpha = ctx.globalAlpha * (S.opacity ?? 1);
    ctx.fillStyle = S.fill || '#ffffff';
    ctx.fillRect(x0, y0, w, h);
    ctx.restore();

    ctx.font = fontString(S);

    // 標題列
    let y = y0;
    if (this.cardHeader.show) {
      ctx.fillStyle = S.headerFill || '#1e3a8a';
      ctx.fillRect(x0, y, w, this._headerH);
      ctx.save();
      ctx.font = `bold ${S.fontSize}px ${S.fontFamily}`;
      drawTextBlock(ctx, [String(this.cardHeader.text ?? '')], x0, y, w, this._headerH, 'center', S.headerTextColor || '#fff', S.fontSize, pad);
      ctx.restore();
      y += this._headerH;
    }

    // 列
    for (let i = 0; i < this.cardRows.length; i++) {
      const rh = this._rowHeights[i];
      const lines = this._lines[i];
      if (showLabel) {
        if (S.labelFill && S.labelFill !== 'transparent') {
          ctx.fillStyle = S.labelFill;
          ctx.fillRect(x0, y, c0, rh);
        }
        drawTextBlock(ctx, lines.label, x0, y, c0, rh, S.labelAlign || 'left', S.labelTextColor || '#374151', S.fontSize, pad);
      }
      drawTextBlock(ctx, lines.value, x0 + c0, y, c1, rh, S.valueAlign || 'right', S.valueTextColor || '#111827', S.fontSize, pad);
      y += rh;
    }

    // 格線
    if ((S.innerStrokeWidth || 0) > 0 && S.innerStroke) {
      ctx.strokeStyle = S.innerStroke;
      ctx.lineWidth = S.innerStrokeWidth;
      ctx.beginPath();
      let ly = y0 + this._headerH;
      for (let i = 0; i < this.cardRows.length - 1; i++) {
        ly += this._rowHeights[i];
        ctx.moveTo(x0, ly);
        ctx.lineTo(x0 + w, ly);
      }
      if (showLabel && this.cardRows.length) {
        ctx.moveTo(x0 + c0, y0 + this._headerH);
        ctx.lineTo(x0 + c0, y0 + h);
      }
      ctx.stroke();
    }
    ctx.restore();

    // 外框
    if ((S.strokeWidth || 0) > 0 && S.stroke) {
      ctx.strokeStyle = S.stroke;
      ctx.lineWidth = S.strokeWidth;
      roundRectPath(ctx, x0, y0, w, h, radius);
      ctx.stroke();
    }
  },

  toObject(propertiesToInclude = []) {
    return fabric.util.object.extend(this.callSuper('toObject', propertiesToInclude), {
      elementId: this.elementId,
      unitDocId: this.unitDocId,
      unitId: this.unitId,
      locked: this.locked,
      cardHeader: { ...this.cardHeader },
      cardRows: this.cardRows.map(r => ({ ...r })),
      cardLayout: { ...this.cardLayout, colWidths: [...(this.cardLayout.colWidths || [])], rowHeights: this.cardLayout.rowHeights ? [...this.cardLayout.rowHeights] : null },
      cardStyle: { ...this.cardStyle },
      cardFormat: { ...this.cardFormat },
    });
  },
});

InfoCard.fromObject = function (object, callback) {
  const card = new InfoCard(object);
  if (callback) callback(card);
  return card;
};
fabric.InfoCard = InfoCard;

/* ---------- element ↔ fabric ---------- */

export function infoCardFromElement(el) {
  const card = new InfoCard({
    left: el.x, top: el.y,
    scaleX: el.scale ?? 1, scaleY: el.scale ?? 1,
    angle: el.angle || 0,
    elementId: el.id,
    unitDocId: el.unitDocId,
    unitId: el.unitId,
    locked: !!el.locked,
    cardHeader: el.header,
    cardRows: el.rows,
    cardLayout: el.layout,
    cardStyle: el.style,
    cardFormat: el.format,
  });
  applyLockState(card);
  return card;
}

export function infoCardToElement(card) {
  const L = card.cardLayout;
  return {
    id: card.elementId,
    type: 'infoCard',
    x: round2(card.left), y: round2(card.top),
    scale: round3(card.scaleX),
    angle: round2(card.angle || 0),
    locked: !!card.locked,
    unitDocId: card.unitDocId || null,
    unitId: card.unitId || '',
    header: { ...card.cardHeader },
    rows: card.cardRows.map(r => ({ ...r })),
    layout: {
      colWidths: (L.colWidths || []).map(v => Math.round(v)),
      rowHeights: Array.isArray(L.rowHeights) ? L.rowHeights.map(v => (typeof v === 'number' ? Math.round(v) : null)) : null,
      headerHeight: L.headerHeight,
      showLabelColumn: L.showLabelColumn !== false,
      padding: L.padding,
    },
    format: { ...card.cardFormat },
    style: { ...card.cardStyle },
  };
}

export function applyLockState(obj) {
  const locked = !!obj.locked;
  obj.set({
    lockMovementX: locked, lockMovementY: locked,
    lockScalingX: locked, lockScalingY: locked,
    lockRotation: locked,
    hasControls: !locked,
    hoverCursor: locked ? 'not-allowed' : 'move',
  });
  return obj;
}

function round2(v) { return Math.round((Number(v) || 0) * 100) / 100; }
function round3(v) { return Math.round((Number(v) || 1) * 1000) / 1000; }
