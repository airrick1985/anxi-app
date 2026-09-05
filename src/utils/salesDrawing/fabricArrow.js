/**
 * 銷售圖面編輯器：線段／箭頭自訂 fabric 類別（fabric.js 5.x）
 * 規格：docs/銷售圖面編輯器-spec.md §4.6
 *
 * - 以 x1,y1,x2,y2 描述（畫布邏輯座標），自行繪製線身＋兩端箭頭
 * - 兩端各一個把手可直接拖曳端點（Shift 鎖 45 度）
 * - 序列化時以 calcLinePoints + calcTransformMatrix 取絕對端點，移動／群組縮放後仍正確
 */
import { fabric } from 'fabric';
import { applyLockState } from './fabricInfoCard';

function snapAngle(fx, fy, x, y) {
  const dx = x - fx, dy = y - fy;
  const len = Math.hypot(dx, dy);
  if (len === 0) return { x, y };
  const step = Math.PI / 4;
  const a = Math.round(Math.atan2(dy, dx) / step) * step;
  return { x: fx + Math.cos(a) * len, y: fy + Math.sin(a) * len };
}

/** 取得目前絕對端點（含 left/top/scale/angle 與群組變換） */
export function getArrowAbsolutePoints(line) {
  const p = line.calcLinePoints();
  const m = line.calcTransformMatrix();
  const a = fabric.util.transformPoint({ x: p.x1, y: p.y1 }, m);
  const b = fabric.util.transformPoint({ x: p.x2, y: p.y2 }, m);
  return { x1: a.x, y1: a.y, x2: b.x, y2: b.y };
}

function makeEndControl(which) {
  return new fabric.Control({
    positionHandler(dim, finalMatrix, obj) {
      const p = obj.calcLinePoints();
      const pt = which === 'start' ? { x: p.x1, y: p.y1 } : { x: p.x2, y: p.y2 };
      const vpt = obj.canvas ? obj.canvas.viewportTransform : [1, 0, 0, 1, 0, 0];
      const m = fabric.util.multiplyTransformMatrices(vpt, obj.calcTransformMatrix());
      return fabric.util.transformPoint(pt, m);
    },
    actionHandler(eventData, transform, x, y) {
      const line = transform.target;
      const abs = getArrowAbsolutePoints(line);
      let nx = x, ny = y;
      if (eventData.shiftKey) {
        const fixed = which === 'start' ? { x: abs.x2, y: abs.y2 } : { x: abs.x1, y: abs.y1 };
        const s = snapAngle(fixed.x, fixed.y, x, y);
        nx = s.x; ny = s.y;
      }
      if (which === 'start') { abs.x1 = nx; abs.y1 = ny; } else { abs.x2 = nx; abs.y2 = ny; }
      line.setEndpoints(abs);
      return true;
    },
    cursorStyle: 'crosshair',
    actionName: 'modifyLine',
    render(ctx, left, top, styleOverride, fabricObject) {
      fabric.controlsUtils.renderCircleControl.call(this, ctx, left, top, { cornerColor: '#2563eb', cornerStrokeColor: '#fff', cornerSize: 10, transparentCorners: false }, fabricObject);
    },
  });
}

const ARROW_CONTROLS = { start: makeEndControl('start'), end: makeEndControl('end') };

export const Arrow = fabric.util.createClass(fabric.Line, {
  type: 'arrow',
  cacheProperties: fabric.Line.prototype.cacheProperties.concat(['arrowStart', 'arrowEnd', 'arrowSize']),

  initialize(points, options = {}) {
    this.callSuper('initialize', points, options);
    this.elementId = options.elementId || null;
    this.locked = !!options.locked;
    this.arrowStart = !!options.arrowStart;
    this.arrowEnd = !!options.arrowEnd;
    this.arrowSize = Number(options.arrowSize) || 14;
    this.set({
      hasBorders: false,
      strokeLineCap: 'round',
      strokeLineJoin: 'round',
      objectCaching: false,
      padding: 8,
      perPixelTargetFind: true,
      strokeUniform: true,
    });
    this.controls = ARROW_CONTROLS;
  },

  /** 以絕對端點重設（並清除 scale/angle），端點把手與面板數值輸入共用 */
  setEndpoints({ x1, y1, x2, y2 }) {
    this.set({ scaleX: 1, scaleY: 1, angle: 0, skewX: 0, skewY: 0 });
    this.set({ x1, y1, x2, y2 });
    this.setCoords();
    this.dirty = true;
    return this;
  },

  _headSize() {
    return this.arrowSize + (this.strokeWidth || 1) * 1.2;
  },

  _drawHead(ctx, x, y, angle) {
    const s = this._headSize();
    ctx.save();
    ctx.setLineDash([]);
    ctx.translate(x, y);
    ctx.rotate(angle);
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(-s, s * 0.45);
    ctx.lineTo(-s, -s * 0.45);
    ctx.closePath();
    ctx.fillStyle = this.stroke;
    ctx.fill();
    ctx.restore();
  },

  _render(ctx) {
    const p = this.calcLinePoints();
    const angle = Math.atan2(p.y2 - p.y1, p.x2 - p.x1);
    // 有箭頭的一端線身縮短，避免線尾穿出箭頭側翼
    const shorten = this._headSize() * 0.6;
    const len = Math.hypot(p.x2 - p.x1, p.y2 - p.y1);
    const ux = len ? (p.x2 - p.x1) / len : 0, uy = len ? (p.y2 - p.y1) / len : 0;
    const sx = this.arrowStart ? p.x1 + ux * shorten : p.x1;
    const sy = this.arrowStart ? p.y1 + uy * shorten : p.y1;
    const ex = this.arrowEnd ? p.x2 - ux * shorten : p.x2;
    const ey = this.arrowEnd ? p.y2 - uy * shorten : p.y2;

    ctx.beginPath();
    ctx.moveTo(sx, sy);
    ctx.lineTo(ex, ey);
    ctx.lineWidth = this.strokeWidth;
    this._renderStroke(ctx);

    if (this.arrowEnd) this._drawHead(ctx, p.x2, p.y2, angle);
    if (this.arrowStart) this._drawHead(ctx, p.x1, p.y1, angle + Math.PI);
  },

  toObject(propertiesToInclude = []) {
    return fabric.util.object.extend(this.callSuper('toObject', propertiesToInclude), {
      elementId: this.elementId,
      locked: this.locked,
      arrowStart: this.arrowStart,
      arrowEnd: this.arrowEnd,
      arrowSize: this.arrowSize,
    });
  },
});

Arrow.fromObject = function (object, callback) {
  const a = new Arrow([object.x1, object.y1, object.x2, object.y2], object);
  if (callback) callback(a);
  return a;
};
fabric.Arrow = Arrow;

/* ---------- element ↔ fabric ---------- */

export function arrowFromElement(el) {
  const s = el.style || {};
  const a = new Arrow([el.x1, el.y1, el.x2, el.y2], {
    elementId: el.id,
    locked: !!el.locked,
    stroke: s.stroke,
    strokeWidth: s.strokeWidth,
    strokeDashArray: Array.isArray(s.dash) && s.dash.length ? [...s.dash] : null,
    arrowStart: !!s.arrowStart,
    arrowEnd: !!s.arrowEnd,
    arrowSize: s.arrowSize || 14,
  });
  applyLockState(a);
  if (a.locked) a.set({ hasControls: false });
  return a;
}

export function arrowToElement(a) {
  const abs = getArrowAbsolutePoints(a);
  const r = (v) => Math.round(v * 100) / 100;
  return {
    id: a.elementId,
    type: 'line',
    x1: r(abs.x1), y1: r(abs.y1), x2: r(abs.x2), y2: r(abs.y2),
    locked: !!a.locked,
    style: {
      stroke: a.stroke,
      strokeWidth: a.strokeWidth,
      dash: Array.isArray(a.strokeDashArray) && a.strokeDashArray.length ? [...a.strokeDashArray] : null,
      arrowStart: !!a.arrowStart,
      arrowEnd: !!a.arrowEnd,
      arrowSize: a.arrowSize,
    },
  };
}
