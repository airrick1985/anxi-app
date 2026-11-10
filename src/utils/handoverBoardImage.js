/**
 * 交屋控管表 — 轉成圖片（複製到剪貼簿、下載、分享）
 *
 * 版面與畫面一致：標題、更新時間、圖例戶數、完整矩陣（不受畫面捲動裁切）、店面排、右側統計。
 * 有篩選／搜尋時，不符合的格子同畫面一樣淡化，標題列標出篩選條件。
 * HTML 交給 utils/htmlToPng 以瀏覽器原生排版轉 PNG（樣式全部放在 css 參數，不依賴網站 CSS）。
 */
import { barColor, boardKpis, shortDate, textColorFor } from './handoverBoard.js';
import { formatDateTime } from './handoverBoardExport.js';

const esc = (v) => String(v ?? '')
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;');

// 版面尺寸（CSS px）
const PAD_X = 28;
const CELL_W = 66;
const FLOOR_W = 40;
const GAP_W = 8;
const SPACING = 3;
const STATS_W = 240;
const BODY_GAP = 16;
const SPECIAL_W = 72;

const CSS = `
.hi{padding:22px ${PAD_X}px 26px;background:#fff;color:#1d1d1f;font-size:13px}
.hi-head{display:flex;align-items:baseline;flex-wrap:wrap;gap:4px 10px;margin-bottom:12px}
.hi-title{font-size:22px;font-weight:700;letter-spacing:-0.01em}
.hi-sub{font-size:15px;font-weight:500;color:#6e6e73}
.hi-filter{align-self:center;padding:2px 9px;border-radius:6px;background:rgba(0,113,227,.1);color:#0058b0;font-size:12px;font-weight:600}
.hi-time{margin-left:auto;font-size:12.5px;color:#6e6e73}
.hi-legend{display:flex;flex-wrap:wrap;gap:6px;margin-bottom:14px}
.hi-chip{display:inline-flex;align-items:center;gap:6px;padding:3px 7px 3px 4px;border:1px solid #e5e5ea;border-radius:8px;font-size:12.5px;font-weight:500;white-space:nowrap}
.hi-chip.off{opacity:.45}
.hi-sw{display:inline-block;width:16px;height:16px;border-radius:5px;border:1px solid rgba(0,0,0,.12)}
.hi-n{min-width:18px;padding:0 5px;border-radius:9px;background:#f0f0f3;color:#6e6e73;font-size:11.5px;font-weight:600;text-align:center}
.hi-body{display:flex;align-items:flex-start;gap:${BODY_GAP}px}
.hi-matrix{flex:none;padding:8px 8px 10px;border:1px solid #e5e5ea;border-radius:12px}
.hi-t{border-collapse:separate;border-spacing:${SPACING}px;margin:0 auto}
.hi-t th{font-size:12px;font-weight:600;color:#6e6e73;text-align:center;white-space:nowrap;padding:0}
.hi-tower{color:#1d1d1f !important;height:22px;border-bottom:2px solid #e5e5ea}
.hi-col{color:#1d1d1f !important;height:24px;width:${CELL_W}px}
.hi-floor{width:${FLOOR_W}px}
.hi-gap{width:${GAP_W}px;padding:0}
.hi-c{width:${CELL_W}px;height:40px;padding:2px 3px;border-radius:7px;border:1px solid rgba(0,0,0,.08);text-align:center;vertical-align:middle;font-size:12px;font-weight:600;line-height:1.2;word-break:break-all}
.hi-c small{display:block;font-size:10.5px;font-weight:500;opacity:.8}
.hi-c.dim{opacity:.18}
.hi-empty{padding:0}
.hi-special{display:flex;align-items:flex-start;gap:10px;margin-top:6px;padding:10px 4px 0;border-top:1px solid #ececf0}
.hi-special.only{margin-top:0;padding-top:2px;border-top:0}
.hi-special-label{flex:none;min-width:36px;padding-top:12px;color:#6e6e73;font-size:12px;font-weight:600;text-align:center}
.hi-special-list{display:flex;flex-wrap:wrap;gap:4px}
.hi-s{width:${SPECIAL_W - 4}px;min-height:48px;display:flex;flex-direction:column;align-items:center;justify-content:center}
.hi-s b{font-size:11px;font-weight:700;opacity:.85}
.hi-stats{flex:none;width:${STATS_W}px;display:flex;flex-direction:column;gap:10px}
.hi-card{padding:11px 14px 12px;border:1px solid #e5e5ea;border-radius:12px}
.hi-card-t{margin-bottom:7px;color:#6e6e73;font-size:11.5px;font-weight:600}
.hi-card-t span{color:#8e8e93;font-weight:500;margin-left:5px}
.hi-total{display:flex;align-items:baseline;gap:4px;margin-bottom:7px}
.hi-total b{font-size:27px;font-weight:700;letter-spacing:-0.02em}
.hi-total span{color:#6e6e73}
.hi-row{display:flex;align-items:center;gap:6px;min-height:22px}
.hi-row .l{flex:1 1 auto;min-width:0}
.hi-row b{font-size:14px}
.hi-row .p{min-width:44px;color:#6e6e73;font-size:12px;text-align:right}
.hi-row.sub{color:#6e6e73;font-size:12.5px;min-height:20px}
.hi-row.sub b{font-size:12.5px;color:#1d1d1f;margin-right:50px}
.hi-dot{display:inline-block;width:10px;height:10px;border-radius:3px;border:1px solid rgba(0,0,0,.12)}
.hi-bar{display:flex;height:6px;margin:3px 0 2px;overflow:hidden;border-radius:3px;background:#ececf0}
.hi-bar i{display:block;height:100%}
.hi-bar.split{height:8px;margin-bottom:7px}
.hi-kpi + .hi-kpi{margin-top:7px}
`;

/** 估算矩陣寬度（決定圖片寬度） */
function matrixWidth(board) {
  const nCols = board.cols.length;
  if (nCols === 0) return 0;
  const gaps = Math.max(0, board.towers.length - 1);
  const slots = nCols + 2 + gaps;
  return FLOOR_W * 2 + nCols * CELL_W + gaps * GAP_W + (slots + 1) * SPACING + 16 + 2;
}

/**
 * 組圖片 HTML
 * @param {object} board buildHandoverBoard() 結果
 * @param {object} opts
 * @param {string} opts.projectName
 * @param {Date} [opts.updatedAt]
 * @param {(unit) => boolean} [opts.isMatch] 有篩選時判斷是否符合（不符合的格子淡化）
 * @param {string} [opts.filterText] 篩選條件文字（顯示於標題列）
 * @param {string[]} [opts.activeStatuses] 篩選中的狀態（圖例其餘淡化）
 * @returns {{ html: string, css: string, width: number }}
 */
export function buildHandoverImage(board, { projectName = '', updatedAt = new Date(), isMatch = null, filterText = '', activeStatuses = [] } = {}) {
  const label = Object.fromEntries(board.statusList.map(s => [s.key, s.label]));
  const counts = board.stats.statusCounts;
  const dim = (u) => (isMatch && !isMatch(u) ? ' dim' : '');
  const cellStyle = (u) => {
    const bg = board.colors[u.status] || '#FFFFFF';
    return `background:${bg};color:${textColorFor(bg)}`;
  };
  const cellInner = (u) => `${esc(label[u.status] || '')}${u.nextDate ? `<small>${esc(shortDate(u.nextDate))}</small>` : ''}`;

  // 標題列
  const head = `<div class="hi-head">
<span class="hi-title">${esc(projectName)}</span><span class="hi-sub">交屋控管表</span>
${filterText ? `<span class="hi-filter">${esc(filterText)}</span>` : ''}
<span class="hi-time">更新 ${esc(formatDateTime(updatedAt))}</span></div>`;

  // 圖例
  const legend = `<div class="hi-legend">${board.statusList.map(s => {
    const off = activeStatuses.length > 0 && !activeStatuses.includes(s.key) ? ' off' : '';
    return `<span class="hi-chip${off}"><i class="hi-sw" style="background:${board.colors[s.key]}"></i>${esc(s.label)}<span class="hi-n">${counts[s.key] || 0}</span></span>`;
  }).join('')}</div>`;

  // 矩陣
  let table = '';
  if (board.floors.length > 0) {
    const towerRow = board.showTowerHeader
      ? `<tr><th class="hi-floor"></th>${board.towers.map((t, i) => `${i > 0 ? '<th class="hi-gap"></th>' : ''}<th class="hi-tower" colspan="${t.cols.length}">${esc(t.name)} 棟</th>`).join('')}<th class="hi-floor"></th></tr>`
      : '';
    const colRow = `<tr><th class="hi-floor">樓層</th>${board.towers.map((t, i) => `${i > 0 ? '<th class="hi-gap"></th>' : ''}${t.cols.map(c => `<th class="hi-col">${esc(c)}</th>`).join('')}`).join('')}<th class="hi-floor">樓層</th></tr>`;
    const rows = board.floors.map(floor => {
      const cells = board.towers.map((t, i) => `${i > 0 ? '<td class="hi-gap"></td>' : ''}${t.cols.map(col => {
        const u = board.cellMap[`${floor}|${col}`];
        return u ? `<td class="hi-c${dim(u)}" style="${cellStyle(u)}">${cellInner(u)}</td>` : '<td class="hi-empty"></td>';
      }).join('')}`).join('');
      return `<tr><th class="hi-floor">${floor}F</th>${cells}<th class="hi-floor">${floor}F</th></tr>`;
    }).join('');
    table = `<table class="hi-t"><thead>${towerRow}${colRow}</thead><tbody>${rows}</tbody></table>`;
  }
  const special = board.specialUnits.length > 0
    ? `<div class="hi-special${board.floors.length === 0 ? ' only' : ''}"><div class="hi-special-label">${esc(board.specialLabel)}</div><div class="hi-special-list">${board.specialUnits.map(u => `<div class="hi-c hi-s${dim(u)}" style="${cellStyle(u)}"><b>${esc(u.unitId)}</b>${cellInner(u)}</div>`).join('')}</div></div>`
    : '';

  // 統計
  const s = board.stats;
  const row = (l, n, p, extra = '') => `<div class="hi-row${extra}"><span class="l">${l}</span><b>${n}</b>${p === undefined ? '' : `<span class="p">${esc(p)}</span>`}</div>`;
  const bar = (pct, color, cls = '') => `<div class="hi-bar${cls}"><i style="width:${pct}%;background:${color}"></i></div>`;
  const overview = `<div class="hi-card"><div class="hi-card-t">總覽</div>
<div class="hi-total"><b>${s.total}</b><span>戶</span></div>
<div class="hi-bar split"><i style="width:${s.soldPct}%;background:#0A84FF"></i><i style="width:${s.unsoldPct}%;background:${barColor(board.colors.unsold)}"></i></div>
${row('<i class="hi-dot" style="background:#0A84FF"></i> 已售', s.sold, `${s.soldPct}%`)}
${row(`<i class="hi-dot" style="background:${board.colors.unsold}"></i> 未售`, s.unsold, `${s.unsoldPct}%`)}</div>`;
  const kpi = `<div class="hi-card"><div class="hi-card-t">進度<span>占已售</span></div>${boardKpis(board).map(k =>
    `<div class="hi-kpi">${row(esc(k.label), k.count, `${k.pct}%`)}${bar(k.pct, barColor(k.color))}</div>`).join('')}</div>`;
  const stages = `<div class="hi-card"><div class="hi-card-t">各項目</div>${s.stageStats.map(st =>
    `<div class="hi-kpi">${row(`已${esc(st.label)}`, st.done, `${st.donePct}%`)}${bar(st.donePct, barColor(board.colors[`done:${st.key}`]))}${st.virtual ? '' : row(`<i class="hi-dot" style="background:${board.colors[`booked:${st.key}`]}"></i> 已約${esc(st.label)}`, st.booked, undefined, ' sub')}</div>`).join('')}</div>`;
  const extra = s.extra.length > 0
    ? `<div class="hi-card"><div class="hi-card-t">其他</div>${s.extra.map(ex => row(esc(ex.label), ex.count, '戶')).join('')}</div>`
    : '';

  const mw = matrixWidth(board);
  const sw = board.specialUnits.length > 0 ? Math.min(board.specialUnits.length, 10) * SPECIAL_W + 70 : 0;
  const contentW = Math.max(mw, sw, 320);
  const width = Math.max(760, PAD_X * 2 + contentW + 2 + BODY_GAP + STATS_W);

  const html = `<div class="hi">${head}${legend}<div class="hi-body"><div class="hi-matrix" style="min-width:${contentW}px;max-width:${contentW}px">${table}${special}</div><div class="hi-stats">${overview}${kpi}${stages}${extra}</div></div></div>`;
  return { html, css: CSS, width };
}

/** 產生 PNG（動態載入轉圖工具） */
export async function renderHandoverPng(board, opts = {}) {
  const { renderHtmlToPngBlob } = await import('./htmlToPng.js');
  const { html, css, width } = buildHandoverImage(board, opts);
  return renderHtmlToPngBlob(html, { width, css, scale: 2 });
}

export function handoverImageFileName(projectName, d = new Date()) {
  const p = (n) => String(n).padStart(2, '0');
  return `${projectName || '建案'}_交屋控管表_${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}.png`;
}

/** 瀏覽器是否能寫入圖片到剪貼簿 */
export function canCopyImage() {
  return typeof window !== 'undefined'
    && window.isSecureContext !== false
    && typeof window.ClipboardItem === 'function'
    && typeof navigator?.clipboard?.write === 'function';
}

/**
 * 寫入剪貼簿。必須在點擊事件內「立即」呼叫（Safari 要求），
 * 所以傳入的是還在產生中的 PNG Promise；舊版 Chromium 不接受 Promise 時改等圖片產生後再寫。
 */
export async function copyPngToClipboard(pngPromise) {
  let item;
  try {
    item = new window.ClipboardItem({ 'image/png': pngPromise });
  } catch (_) {
    item = new window.ClipboardItem({ 'image/png': await pngPromise });
  }
  await navigator.clipboard.write([item]);
}
