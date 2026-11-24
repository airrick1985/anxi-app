// 全景圖辨識（銷控圖片）
// - sphere：360° 環景（等距柱狀投影，寬高 2:1，左右邊緣相接）
// - strip：手機橫掃的長條全景（寬高比 3:1 以上的照片）
// 上傳時判斷後存進 salesImages.panorama；沒有這個欄位的舊圖在瀏覽時即時判斷。
// 規則需與 functions/salesImages.js 的 PANORAMA_TYPES／PANORAMA_MIN_RATIO 一致

import { reactive } from 'vue';

export const PANORAMA_SPHERE = 'sphere';
export const PANORAMA_STRIP = 'strip';
export const PANORAMA_NONE = 'none';

export const PANORAMA_OPTIONS = [
  { value: PANORAMA_SPHERE, label: '360° 環景', icon: 'mdi-rotate-360' },
  { value: PANORAMA_STRIP, label: '長條全景', icon: 'mdi-panorama-horizontal-outline' },
  { value: PANORAMA_NONE, label: '一般圖片', icon: 'mdi-image-outline' },
];

// 全景圖的上傳規格：比一般圖片（1MB、長邊 2400）寬鬆，放大才看得清楚
export const PANORAMA_MAX_BYTES = 4 * 1024 * 1024;
export const PANORAMA_MAX_EDGE = 6000;
// iOS Safari 的 canvas 面積上限約 1677 萬像素，超過會畫出空白
export const PANORAMA_MAX_AREA = 16000000;
// 寬高比低於此值不當全景（手動指定也一樣）
export const PANORAMA_MIN_RATIO = 1.9;

const SPHERE_RATIO_TOLERANCE = 0.02;
const STRIP_MIN_RATIO = 2.95;
const STRIP_MAX_RATIO = 14;
const SAMPLE_WIDTH = 256;
// 長條全景假設的垂直視角，用來換算水平涵蓋角度
// （手機全景模式掃 240° 約 4.5:1，換算垂直視角約 50°；實際角度無從得知，只能估）
const STRIP_VERTICAL_FOV = (50 * Math.PI) / 180;

export const isPanoramaType = type => type === PANORAMA_SPHERE || type === PANORAMA_STRIP;
export const panoramaLabel = type => (type === PANORAMA_SPHERE ? '360°' : type === PANORAMA_STRIP ? '全景' : '');

/** 夠寬才可能是全景（上傳視窗的手動切換、後端放寬檔案上限都用這個條件） */
export function isWideImage(width, height) {
  return width > 0 && height > 0 && width / height >= PANORAMA_MIN_RATIO;
}

/** 只看寬高比的初步判斷：'sphere'｜'strip'｜'' */
export function panoramaCandidate(width, height) {
  if (!(width > 0 && height > 0)) return '';
  const ratio = width / height;
  if (Math.abs(ratio - 2) <= SPHERE_RATIO_TOLERANCE) return PANORAMA_SPHERE;
  if (ratio >= STRIP_MIN_RATIO && ratio <= STRIP_MAX_RATIO) return PANORAMA_STRIP;
  return '';
}

/**
 * 長條全景貼在圓柱上的幾何：angle 為水平涵蓋角度（弧度）、height 為圓柱高度（半徑 1）
 * 左右相接（wraps）時視為完整一圈
 */
export function stripGeometry(width, height, wraps = false) {
  const ratio = width > 0 && height > 0 ? width / height : 4;
  const angle = wraps ? Math.PI * 2 : Math.min(Math.PI * 2, ratio * 2 * Math.tan(STRIP_VERTICAL_FOV / 2));
  return { angle, height: angle / ratio, wraps: wraps || angle >= Math.PI * 2 - 1e-6 };
}

/**
 * 分析縮小後的像素（RGBA）：
 * - seamless：左右邊緣相接（全景繞一圈回到原點）
 * - flatEdges：左右邊緣是單一色（白邊、底色），相接不算數
 * - drawing：線稿／白底圖（外框一圈同色，或單一顏色佔一半以上）
 */
export function analyzePixels(data, w, h) {
  const at = (x, y) => (y * w + x) * 4;
  const luma = i => data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114;
  const colDiff = (xa, xb) => {
    let sum = 0;
    for (let y = 0; y < h; y += 1) {
      const a = at(xa, y);
      const b = at(xb, y);
      sum += (Math.abs(data[a] - data[b]) + Math.abs(data[a + 1] - data[b + 1]) + Math.abs(data[a + 2] - data[b + 2])) / 3;
    }
    return sum / h;
  };
  const deviation = (values) => {
    const mean = values.reduce((s, v) => s + v, 0) / values.length;
    return Math.sqrt(values.reduce((s, v) => s + (v - mean) ** 2, 0) / values.length);
  };

  // 左右邊緣的差異，與相鄰兩欄的差異（全圖平均、邊緣附近）相比：
  // 真正相接的全景兩者差不多；只是左右長得像的照片（海灘、天空）會差到 3 倍以上
  const seamDiff = colDiff(0, w - 1);
  let adjacent = 0;
  for (let x = 0; x < w - 1; x += 1) adjacent += colDiff(x, x + 1);
  adjacent /= w - 1;
  const local = (colDiff(0, 1) + colDiff(1, 2) + colDiff(w - 3, w - 2) + colDiff(w - 2, w - 1)) / 4;

  const edgeLuma = [];
  for (let y = 0; y < h; y += 1) edgeLuma.push(luma(at(0, y)), luma(at(w - 1, y)));
  const flatEdges = deviation(edgeLuma) < 6;

  const ringLuma = edgeLuma.slice();
  for (let x = 0; x < w; x += 1) ringLuma.push(luma(at(x, 0)), luma(at(x, h - 1)));
  const flatRing = deviation(ringLuma) < 5;

  // 每色 4 bit 分桶，找出佔比最高的顏色
  const buckets = new Map();
  let top = 0;
  for (let i = 0; i < w * h * 4; i += 4) {
    const key = ((data[i] >> 4) << 8) | ((data[i + 1] >> 4) << 4) | (data[i + 2] >> 4);
    const n = (buckets.get(key) || 0) + 1;
    buckets.set(key, n);
    if (n > top) top = n;
  }
  const dominant = top / (w * h);

  return {
    seamless: !flatEdges && seamDiff < 40 && seamDiff <= Math.max(6, Math.max(adjacent, local) * 1.6),
    flatEdges,
    drawing: flatRing || dominant > 0.5,
    seamDiff,
    adjacent,
    dominant,
  };
}

/** 依寬高與像素內容判斷：回傳 { type: 'sphere'|'strip'|'none', wraps } */
export function classifyPanorama(width, height, stats) {
  const candidate = panoramaCandidate(width, height);
  if (candidate === PANORAMA_SPHERE && stats.seamless) return { type: PANORAMA_SPHERE, wraps: true };
  if (candidate === PANORAMA_STRIP && !stats.drawing) return { type: PANORAMA_STRIP, wraps: stats.seamless };
  return { type: PANORAMA_NONE, wraps: false };
}

/** 把圖片（ImageBitmap／HTMLImageElement）縮小後取樣分析；讀不到像素（跨網域）時回傳 null */
export function sampleImageStats(source, width, height) {
  const w = SAMPLE_WIDTH;
  const h = Math.max(24, Math.round((SAMPLE_WIDTH * height) / width));
  try {
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    ctx.drawImage(source, 0, 0, w, h);
    return analyzePixels(ctx.getImageData(0, 0, w, h).data, w, h);
  } catch (e) {
    return null;
  }
}

// 全景相機（Insta360、Theta、Google 相機…）會在檔頭的 XMP 標記投影方式
async function hasPanoramaTag(file) {
  try {
    const head = await file.slice(0, 256 * 1024).text();
    return /GPano:ProjectionType(?:="|>)\s*equirectangular/i.test(head);
  } catch (e) {
    return false;
  }
}

/** 上傳前判斷檔案是否為全景；無法解碼時回傳 null */
export async function detectPanoramaFromFile(file) {
  let bmp;
  try {
    bmp = await createImageBitmap(file);
  } catch (e) {
    return null;
  }
  const { width, height } = bmp;
  let type = PANORAMA_NONE;
  if (panoramaCandidate(width, height)) {
    const stats = sampleImageStats(bmp, width, height);
    if (stats) type = classifyPanorama(width, height, stats).type;
  }
  if (type !== PANORAMA_SPHERE && Math.abs(width / height - 2) <= 0.1 && await hasPanoramaTag(file)) type = PANORAMA_SPHERE;
  bmp.close?.();
  return { type, width, height, wide: isWideImage(width, height) };
}

// ── 圖庫圖片（已上傳）的全景類型 ──
// 以圖片網址為鍵快取；每次上傳都是新網址，替換檔案後會重新判斷
const detected = reactive(new Map());
const pending = new Set();
const queue = [];
let running = 0;
const MAX_PARALLEL = 2;

function loadImage(url, crossOrigin) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    if (crossOrigin) img.crossOrigin = 'anonymous';
    img.decoding = 'async';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('圖片載入失敗'));
    img.src = url;
  });
}

async function detectUrl(url, width, height) {
  let w = width;
  let h = height;
  if (!(w > 0 && h > 0)) {
    // 舊資料沒有記錄寬高：先讀尺寸（與頁面上的縮圖共用瀏覽器快取）
    const probe = await loadImage(url, false);
    w = probe.naturalWidth;
    h = probe.naturalHeight;
  }
  if (!panoramaCandidate(w, h)) return PANORAMA_NONE;
  const img = await loadImage(url, true);
  const stats = sampleImageStats(img, img.naturalWidth, img.naturalHeight);
  return stats ? classifyPanorama(img.naturalWidth, img.naturalHeight, stats).type : PANORAMA_NONE;
}

function pump() {
  while (running < MAX_PARALLEL && queue.length) {
    const job = queue.shift();
    running += 1;
    detectUrl(job.url, job.width, job.height)
      .catch(() => PANORAMA_NONE)
      .then((type) => {
        detected.set(job.url, type);
        pending.delete(job.url);
        running -= 1;
        pump();
      });
  }
}

function lookup(image) {
  const url = image?.downloadURL;
  if (!url) return { type: '', pending: false };
  if (image.panorama === PANORAMA_SPHERE || image.panorama === PANORAMA_STRIP) {
    // 手動指定也要夠寬才算（已知寬高時）
    const narrow = image.width > 0 && image.height > 0 && !isWideImage(image.width, image.height);
    return { type: narrow ? '' : image.panorama, pending: false };
  }
  if (image.panorama === PANORAMA_NONE) return { type: '', pending: false };

  const known = detected.get(url);
  if (known !== undefined) return { type: isPanoramaType(known) ? known : '', pending: false };
  const hasSize = image.width > 0 && image.height > 0;
  if (hasSize && !panoramaCandidate(image.width, image.height)) return { type: '', pending: false };
  if (!pending.has(url)) {
    pending.add(url);
    queue.push({ url, width: image.width || 0, height: image.height || 0 });
    // 不在算繪過程中同步改動響應式狀態
    queueMicrotask(pump);
  }
  return { type: '', pending: true };
}

/** 圖庫圖片的全景類型：'sphere'｜'strip'｜''（一般圖片或還在判斷中）；在 computed／template 內使用會自動更新 */
export function panoramaTypeOf(image) {
  return lookup(image).type;
}

/** 還在判斷中（舊圖第一次瀏覽） */
export function isPanoramaPending(image) {
  return lookup(image).pending;
}
