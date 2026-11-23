// src/utils/activityPrint.js
// 活動訊息列印：一律以隱藏 iframe 列印，避免 window.open 被彈窗阻擋、也不會把整個介面印進去
import { ACTIVITY_PAGE_CSS } from '@/utils/activityPage';
import { renderCanvasHtml, normalizeCanvas, CANVAS_WIDTH } from '@/utils/activityCanvas';
import { activityKind } from '@/utils/activityMessage';

function escapeHtml(text) {
  return String(text || '').replace(/[&<>"']/g, (ch) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[ch]));
}

function createPrintFrame() {
  const frame = document.createElement('iframe');
  frame.setAttribute('aria-hidden', 'true');
  // 不可設 0×0 或 visibility:hidden：圖片的 100vh 會以 iframe 高度計算而變 0、PDF 檢視器也不會渲染，皆印出空白
  // 尺寸取 A4 扣除 10mm 邊界的內容區，讓 100vh 剛好一頁
  frame.style.cssText = 'position:fixed;left:-10000px;top:0;width:190mm;height:277mm;border:0;';
  document.body.appendChild(frame);
  return frame;
}

// 列印對話框是同步阻塞的，關掉後才會回來；延遲移除 iframe 以免 Safari 印到一半就被抽掉
function disposePrintFrame(frame, delay = 1000) {
  setTimeout(() => frame.remove(), delay);
}

function triggerPrint(frame) {
  const win = frame.contentWindow;
  if (!win) throw new Error('無法建立列印視窗');
  win.focus();
  win.print();
}

// 圖檔：把圖寫進 iframe 文件後列印（img 不需 CORS，直接吃公開網址即可）
function printImage(item) {
  return new Promise((resolve, reject) => {
    const frame = createPrintFrame();
    const doc = frame.contentDocument;
    doc.open();
    doc.write(`<!DOCTYPE html><html><head><meta charset="utf-8"><title>${escapeHtml(item.title || item.fileName || '活動訊息')}</title>
<style>
  @page { margin: 10mm; }
  html, body { margin: 0; padding: 0; }
  img { display: block; margin: 0 auto; max-width: 100%; max-height: 100vh; }
</style>
</head><body><img src="${escapeHtml(item.downloadURL)}" alt="" decoding="sync"></body></html>`);
    doc.close();

    const img = doc.querySelector('img');
    const done = (err) => {
      disposePrintFrame(frame);
      if (err) reject(err); else resolve();
    };
    waitImageLoaded(img).then(() => {
      if (!img.naturalWidth) {
        done(new Error('圖檔載入失敗'));
        return;
      }
      decodeForPrint(img).then(() => {
        try { triggerPrint(frame); done(); } catch (e) { done(e); }
      });
    });
  });
}

// PDF：先取回 blob（token 網址自帶 CORS），再以同源 blob URL 載入 iframe 列印
async function printPdf(item) {
  const res = await fetch(item.downloadURL);
  if (!res.ok) throw new Error(`取得 PDF 失敗（HTTP ${res.status}）`);
  const blobUrl = URL.createObjectURL(await res.blob());

  await new Promise((resolve, reject) => {
    const frame = createPrintFrame();
    // 部分瀏覽器（如 iOS Safari）不支援 iframe 內嵌 PDF 列印，逾時就走另開分頁的退路
    const timer = setTimeout(() => {
      frame.remove();
      URL.revokeObjectURL(blobUrl);
      reject(new Error('此瀏覽器不支援直接列印 PDF'));
    }, 8000);

    frame.onload = () => {
      clearTimeout(timer);
      // onload 時 PDF 檢視器才剛載入、頁面尚未渲染，稍候再印以免空白
      setTimeout(() => {
        try {
          triggerPrint(frame);
          resolve();
        } catch (e) {
          reject(e);
        } finally {
          // PDF 需保留較久，列印預覽是由外掛非同步接手渲染的
          setTimeout(() => { frame.remove(); URL.revokeObjectURL(blobUrl); }, 60000);
        }
      }, 800);
    };
    frame.src = blobUrl;
  });
}

// 等圖片載入（失敗也算完成，不擋列印）
function waitImageLoaded(img) {
  if (img.complete) return Promise.resolve();
  return new Promise((done) => {
    img.onload = done;
    img.onerror = done;
  });
}

// Safari：畫面外 iframe 裡的大圖列印時會改走非同步解碼，來不及解完就印成空白。
// 指定 decoding="sync" 並先等 decode() 解碼完成再印（失敗不擋列印）
function decodeForPrint(img) {
  img.decoding = 'sync';
  if (!img.naturalWidth || typeof img.decode !== 'function') return Promise.resolve();
  return img.decode().catch(() => {});
}

// 自建頁面：整頁等比縮進一張 A4（套用同一份畫布樣式），等圖片與背景圖載入完再印。
// 不可讓畫布跨頁：圖片不會被切開，跨頁的圖會整張被推到下一頁，累積下推後超出畫布裁切範圍的圖就印成空白。
function printPage(item) {
  return new Promise((resolve, reject) => {
    const frame = createPrintFrame();
    const doc = frame.contentDocument;
    const canvas = normalizeCanvas(item.canvas);
    const printWidth = frame.clientWidth || 718;
    // 少算 2px，避免四捨五入後多出一點點而溢到第二頁
    const printHeight = (frame.clientHeight || 1046) - 2;
    const k = Math.min(1, printWidth / CANVAS_WIDTH, printHeight / canvas.height);
    doc.open();
    doc.write(`<!DOCTYPE html><html><head><meta charset="utf-8"><title>${escapeHtml(item.title || '活動訊息')}</title>
<style>
  @page { size: A4; margin: 10mm; }
  html, body { margin: 0; padding: 0; background: #fff; }
  .print-sizer { position: relative; width: ${Math.floor(CANVAS_WIDTH * k)}px; height: ${Math.floor(canvas.height * k)}px; margin: 0 auto; overflow: hidden; }
  .print-stage { position: absolute; top: 0; left: 0; transform: scale(${k}); transform-origin: 0 0; }
  ${ACTIVITY_PAGE_CSS}
</style>
</head><body><div class="print-sizer"><div class="print-stage">${renderCanvasHtml(canvas)}</div></div></body></html>`);
    doc.close();

    const images = [...doc.images];
    // 背景圖是 CSS 背景、不在 doc.images 裡，另外預載同一網址；沒等它會印出白底
    if (canvas.background.image) {
      const bg = doc.createElement('img');
      bg.src = canvas.background.image;
      images.push(bg);
    }
    const pending = images.map(img => waitImageLoaded(img).then(() => decodeForPrint(img)));
    const timeout = new Promise(done => setTimeout(done, 20000));
    Promise.race([Promise.all(pending), timeout]).then(() => {
      try {
        triggerPrint(frame);
        resolve();
      } catch (e) {
        reject(e);
      } finally {
        disposePrintFrame(frame);
      }
    });
  });
}

/** 列印一則活動訊息（圖片／PDF／自建頁面） */
export function printActivity(item) {
  const kind = activityKind(item);
  if (kind === 'page') return printPage(item);
  if (kind === 'pdf') return printPdf(item);
  return printImage(item);
}
