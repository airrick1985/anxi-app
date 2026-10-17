// src/utils/activityCanvas.js
// 活動訊息「自建頁面」自由畫布：資料清理、渲染 HTML（燈箱閱讀與列印共用）、拖放幾何計算
import { sanitizeActivityPageHtml } from '@/utils/activityPage';

export const CANVAS_WIDTH = 800;
export const CANVAS_DEFAULT_HEIGHT = 1100;
export const CANVAS_MIN_HEIGHT = 300;
export const CANVAS_MAX_HEIGHT = 8000;
export const ITEM_MIN_SIZE = 20;

export const DEFAULT_BUTTON_COLOR = '#0071e3';

export function newItemId() {
  return Math.random().toString(36).slice(2, 10);
}

export function createCanvas() {
  return {
    width: CANVAS_WIDTH,
    height: CANVAS_DEFAULT_HEIGHT,
    background: { color: '#ffffff', image: '', imagePath: '' },
    items: [],
  };
}

const HEX_RE = /^#[0-9a-f]{3,8}$/i;
const safeColor = (c, fallback) => (typeof c === 'string' && HEX_RE.test(c) ? c : fallback);
const safeLink = u => (typeof u === 'string' && /^(https?:|mailto:|tel:)/i.test(u.trim()) ? u.trim() : '');
const safeImage = u => (typeof u === 'string' && /^https:\/\//i.test(u) ? u : '');
const safeText = (s, max) => (typeof s === 'string' ? s.slice(0, max) : '');
function num(v, fallback, min, max) {
  const n = Number(v);
  if (!Number.isFinite(n)) return fallback;
  return Math.round(Math.min(max, Math.max(min, n)) * 10) / 10;
}

/** 清理畫布資料（存檔前與渲染前都會跑）：數值夾在合理範圍、網址與顏色驗證，不留 undefined */
export function normalizeCanvas(raw) {
  const src = raw && typeof raw === 'object' ? raw : {};
  const height = num(src.height, CANVAS_DEFAULT_HEIGHT, CANVAS_MIN_HEIGHT, CANVAS_MAX_HEIGHT);
  const bg = src.background || {};
  const items = (Array.isArray(src.items) ? src.items : []).slice(0, 300).map((it) => {
    const base = {
      id: safeText(it?.id, 20) || newItemId(),
      type: ['text', 'image', 'button'].includes(it?.type) ? it.type : 'text',
      x: num(it?.x, 0, -CANVAS_WIDTH, CANVAS_WIDTH * 2),
      y: num(it?.y, 0, -CANVAS_MAX_HEIGHT, CANVAS_MAX_HEIGHT * 2),
      w: num(it?.w, 200, ITEM_MIN_SIZE, CANVAS_WIDTH * 3),
      h: num(it?.h, 40, 1, CANVAS_MAX_HEIGHT),
      rotation: num(it?.rotation, 0, -360, 360),
      link: safeLink(it?.link),
    };
    if (base.type === 'text') return { ...base, html: safeText(it?.html, 50000) };
    if (base.type === 'image') return { ...base, src: safeImage(it?.src), path: safeText(it?.path, 300) };
    return {
      ...base,
      label: safeText(it?.label, 60),
      color: safeColor(it?.color, DEFAULT_BUTTON_COLOR),
      fontSize: num(it?.fontSize, 16, 10, 60),
    };
  }).filter(it => it.type !== 'image' || it.src);
  return {
    width: CANVAS_WIDTH,
    height,
    background: {
      color: safeColor(bg.color, '#ffffff'),
      image: safeImage(bg.image),
      imagePath: safeText(bg.imagePath, 300),
    },
    items,
  };
}

/** 依底色亮度決定按鈕字色 */
export function readableTextColor(hex) {
  const h = safeColor(hex, DEFAULT_BUTTON_COLOR).slice(1);
  const full = h.length === 3 ? h.split('').map(c => c + c).join('') : h.slice(0, 6);
  const [r, g, b] = [0, 2, 4].map(i => parseInt(full.slice(i, i + 2), 16));
  return (0.299 * r + 0.587 * g + 0.114 * b) > 170 ? '#1d1d1f' : '#ffffff';
}

// ---------- 樣式（編輯器與閱讀共用，確保所見即所得） ----------
export function canvasStyle(canvas) {
  const style = {
    width: `${CANVAS_WIDTH}px`,
    height: `${canvas.height}px`,
    backgroundColor: canvas.background?.color || '#ffffff',
  };
  if (canvas.background?.image) style.backgroundImage = `url("${canvas.background.image}")`;
  return style;
}

export function itemStyle(item) {
  const style = {
    left: `${item.x}px`,
    top: `${item.y}px`,
    width: `${item.w}px`,
  };
  if (item.type !== 'text') style.height = `${item.h}px`;
  if (item.rotation) style.transform = `rotate(${item.rotation}deg)`;
  if (item.type === 'button') {
    style.backgroundColor = item.color;
    style.color = readableTextColor(item.color);
    style.fontSize = `${item.fontSize}px`;
  }
  return style;
}

function styleString(obj) {
  return Object.entries(obj)
    .map(([k, v]) => `${k.replace(/[A-Z]/g, m => `-${m.toLowerCase()}`)}:${v}`)
    .join(';');
}

function escapeHtml(text) {
  return String(text ?? '').replace(/[&<>"']/g, ch => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[ch]));
}

/** 文字方塊內容：清理 HTML；整個方塊有連結時拿掉內部連結（避免巢狀 a） */
export function textItemHtml(item) {
  const clean = sanitizeActivityPageHtml(item.html);
  if (!item.link || typeof document === 'undefined') return clean;
  const tpl = document.createElement('template');
  tpl.innerHTML = clean;
  tpl.content.querySelectorAll('a').forEach((a) => {
    const span = document.createElement('span');
    span.innerHTML = a.innerHTML;
    a.replaceWith(span);
  });
  return tpl.innerHTML;
}

/** 渲染整張畫布為 HTML（燈箱閱讀、列印） */
export function renderCanvasHtml(rawCanvas) {
  const canvas = normalizeCanvas(rawCanvas);
  const items = canvas.items.map((item) => {
    let inner = '';
    if (item.type === 'text') inner = `<div class="ap-content ac-text-inner">${textItemHtml(item)}</div>`;
    else if (item.type === 'image') inner = `<img src="${escapeHtml(item.src)}" alt="" draggable="false">`;
    else inner = `<span class="ac-btn-label">${escapeHtml(item.label)}</span>`;
    const cls = `ac-item ac-${item.type}${item.link ? ' ac-linked' : ''}`;
    const style = escapeHtml(styleString(itemStyle(item)));
    return item.link
      ? `<a class="${cls}" style="${style}" href="${escapeHtml(item.link)}" target="_blank" rel="noopener noreferrer">${inner}</a>`
      : `<div class="${cls}" style="${style}">${inner}</div>`;
  }).join('');
  return `<div class="ac-canvas" style="${escapeHtml(styleString(canvasStyle(canvas)))}">${items}</div>`;
}

/** 頁面用到的所有圖片（Storage 路徑）與縮圖網址 */
export function canvasAssets(canvas) {
  const images = (canvas.items || []).filter(it => it.type === 'image' && it.src);
  const paths = [...images.map(it => it.path), canvas.background?.imagePath].filter(Boolean);
  const largest = [...images].sort((a, b) => b.w * b.h - a.w * a.h)[0];
  return {
    imagePaths: [...new Set(paths)],
    coverURL: canvas.background?.image || largest?.src || '',
  };
}

// ---------- 幾何 ----------
export function rotateVector(x, y, deg) {
  const r = (deg * Math.PI) / 180;
  const cos = Math.cos(r);
  const sin = Math.sin(r);
  return { x: x * cos - y * sin, y: x * sin + y * cos };
}

/**
 * 拖控制點縮放：handle = { sx, sy }（-1／0／1），dx/dy 為畫布座標位移
 * 在物件自身座標系計算新尺寸，再把對角固定點換回畫布座標，旋轉後縮放也不會飄
 */
export function resizeBox(start, handle, dx, dy, keepRatio) {
  const local = rotateVector(dx, dy, -start.rotation);
  let w = start.w + handle.sx * local.x;
  let h = start.h + handle.sy * local.y;
  if (keepRatio && handle.sx && handle.sy) {
    const f = 1 + ((handle.sx * local.x) * start.w + (handle.sy * local.y) * start.h) / (start.w ** 2 + start.h ** 2);
    w = start.w * f;
    h = start.h * f;
    if (w < ITEM_MIN_SIZE || h < ITEM_MIN_SIZE) {
      const k = Math.max(ITEM_MIN_SIZE / start.w, ITEM_MIN_SIZE / start.h);
      w = start.w * k;
      h = start.h * k;
    }
  }
  w = Math.max(ITEM_MIN_SIZE, w);
  h = Math.max(ITEM_MIN_SIZE, h);
  const shift = rotateVector(handle.sx * (w - start.w) / 2, handle.sy * (h - start.h) / 2, start.rotation);
  const cx = start.x + start.w / 2 + shift.x;
  const cy = start.y + start.h / 2 + shift.y;
  return { x: Math.round(cx - w / 2), y: Math.round(cy - h / 2), w: Math.round(w), h: Math.round(h) };
}

/** 旋轉後的外框寬高（靠左／置中／靠右用） */
export function boundingSize(item) {
  const r = (item.rotation * Math.PI) / 180;
  const cos = Math.abs(Math.cos(r));
  const sin = Math.abs(Math.sin(r));
  return { w: item.w * cos + item.h * sin, h: item.w * sin + item.h * cos };
}

/**
 * 拖曳吸附：對齊畫布左右邊／中線與其他物件的邊緣、中線
 * 回傳修正後的 x/y 與要畫的參考線
 */
export function snapMove(box, others, canvasHeight, threshold) {
  const xs = [0, CANVAS_WIDTH / 2, CANVAS_WIDTH];
  const ys = [0, canvasHeight / 2, canvasHeight];
  others.forEach((o) => {
    xs.push(o.x, o.x + o.w / 2, o.x + o.w);
    ys.push(o.y, o.y + o.h / 2, o.y + o.h);
  });
  const pick = (points, candidates) => {
    let best = null;
    points.forEach((p, i) => {
      candidates.forEach((c) => {
        const d = c - p;
        if (Math.abs(d) <= threshold && (!best || Math.abs(d) < Math.abs(best.d))) best = { d, pos: c, i };
      });
    });
    return best;
  };
  const bx = pick([box.x, box.x + box.w / 2, box.x + box.w], xs);
  const by = pick([box.y, box.y + box.h / 2, box.y + box.h], ys);
  const guides = [];
  if (bx) guides.push({ type: 'v', pos: bx.pos });
  if (by) guides.push({ type: 'h', pos: by.pos });
  return { x: box.x + (bx ? bx.d : 0), y: box.y + (by ? by.d : 0), guides };
}
