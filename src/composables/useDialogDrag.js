// 可拖曳對話框指令：把 v-dialog 的標題列當把手，按住拖曳即可移動整個對話框
// 用法：<v-card-title v-dialog-drag>…</v-card-title>（<script setup> 內 import { vDialogDrag }）
// Why: 戶別資訊上再疊一層編輯／選擇車位對話框時，使用者常需要挪開對話框看底下的資料。
//      Vuetify 對話框的位置由 .v-overlay__content 決定，這裡直接對它套 transform，
//      不改 Vuetify 的置中排版；對話框重新掛載（v-if）時位置自動歸零。
// 注意：手機版全螢幕對話框不需要拖曳，指令會在 fullscreen 時自動略過。

const INTERACTIVE_SELECTOR = 'button, a, input, textarea, select, .v-btn, .v-field, .v-chip, [contenteditable="true"]';

function findOverlayContent(el) {
  return el.closest('.v-overlay__content');
}

function setup(el) {
  el.__dialogDrag?.destroy?.();

  const state = { dx: 0, dy: 0, startX: 0, startY: 0, baseX: 0, baseY: 0, active: false, target: null };

  const onPointerDown = (e) => {
    if (e.button !== undefined && e.button !== 0) return; // 只吃左鍵／單指
    if (e.target && e.target.closest(INTERACTIVE_SELECTOR) && e.target !== el) return; // 標題列上的按鈕不當把手
    const target = findOverlayContent(el);
    if (!target) return;
    const overlay = target.closest('.v-overlay');
    if (overlay && overlay.classList.contains('v-overlay--fullscreen')) return; // 手機全螢幕不拖
    if (target.classList.contains('v-dialog--fullscreen') || target.closest('.v-dialog--fullscreen')) return;

    state.active = true;
    state.target = target;
    state.startX = e.clientX;
    state.startY = e.clientY;
    state.baseX = state.dx;
    state.baseY = state.dy;
    el.classList.add('dialog-drag--dragging');
    try { el.setPointerCapture(e.pointerId); } catch { /* ignore */ }
  };

  const onPointerMove = (e) => {
    if (!state.active || !state.target) return;
    const rect = state.target.getBoundingClientRect();
    let nx = state.baseX + (e.clientX - state.startX);
    let ny = state.baseY + (e.clientY - state.startY);
    // 至少留 48px 在視窗內，避免把對話框拖到抓不回來
    const margin = 48;
    const minX = -(rect.left - state.dx) - rect.width + margin;
    const maxX = window.innerWidth - (rect.left - state.dx) - margin;
    const minY = -(rect.top - state.dy);
    const maxY = window.innerHeight - (rect.top - state.dy) - margin;
    nx = Math.min(Math.max(nx, minX), maxX);
    ny = Math.min(Math.max(ny, minY), maxY);
    state.dx = nx;
    state.dy = ny;
    state.target.style.transform = `translate(${nx}px, ${ny}px)`;
    state.target.style.transition = 'none';
  };

  const onPointerUp = (e) => {
    if (!state.active) return;
    state.active = false;
    el.classList.remove('dialog-drag--dragging');
    try { el.releasePointerCapture(e.pointerId); } catch { /* ignore */ }
  };

  el.style.cursor = 'move';
  el.style.touchAction = 'none';
  el.style.userSelect = 'none';
  el.addEventListener('pointerdown', onPointerDown);
  el.addEventListener('pointermove', onPointerMove);
  el.addEventListener('pointerup', onPointerUp);
  el.addEventListener('pointercancel', onPointerUp);

  el.__dialogDrag = {
    destroy() {
      el.removeEventListener('pointerdown', onPointerDown);
      el.removeEventListener('pointermove', onPointerMove);
      el.removeEventListener('pointerup', onPointerUp);
      el.removeEventListener('pointercancel', onPointerUp);
      if (state.target) {
        state.target.style.transform = '';
        state.target.style.transition = '';
      }
      el.style.cursor = '';
      el.style.touchAction = '';
      el.style.userSelect = '';
      delete el.__dialogDrag;
    },
  };
}

export const vDialogDrag = {
  mounted(el) { setup(el); },
  unmounted(el) { el.__dialogDrag?.destroy?.(); },
};

export default vDialogDrag;
