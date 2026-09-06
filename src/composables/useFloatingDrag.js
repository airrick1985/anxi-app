// 浮動元素拖曳（FAB 用）：Pointer Events、位移 < 6px 視為點擊、放開後吸附左右邊緣、位置記憶
// docs/銷控AI智能助理-spec.md §3.1
import { ref, reactive, onMounted, onBeforeUnmount, computed } from 'vue';

const CLICK_THRESHOLD = 6;

/**
 * @param elRef 目標元素 ref（position: fixed）
 * @param opts { storageKey, onClick, onDoubleClick, margin = 16, bottomOffset = 0, defaultSide = 'right', defaultYPct = 0.8 }
 */
export function useFloatingDrag(elRef, opts = {}) {
  const margin = opts.margin ?? 16;
  const pos = reactive({ side: opts.defaultSide || 'right', yPct: opts.defaultYPct ?? 0.8 });
  const dragging = ref(false);
  const dragXY = reactive({ x: 0, y: 0 });
  let start = null;
  let lastTap = 0;

  function load() {
    if (!opts.storageKey) return;
    try {
      const raw = localStorage.getItem(opts.storageKey);
      if (raw) { const p = JSON.parse(raw); if (p && (p.side === 'left' || p.side === 'right')) { pos.side = p.side; pos.yPct = Math.min(1, Math.max(0, Number(p.yPct) || 0)); } }
    } catch { /* ignore */ }
  }
  function save() {
    if (!opts.storageKey) return;
    try { localStorage.setItem(opts.storageKey, JSON.stringify({ side: pos.side, yPct: pos.yPct })); } catch { /* ignore */ }
  }

  function bottomOffset() {
    const v = typeof opts.bottomOffset === 'function' ? opts.bottomOffset() : (opts.bottomOffset || 0);
    return Number(v) || 0;
  }
  function elSize() {
    const el = elRef.value;
    return el ? { w: el.offsetWidth || 56, h: el.offsetHeight || 56 } : { w: 56, h: 56 };
  }
  function restingTop() {
    const { h } = elSize();
    const usable = Math.max(0, window.innerHeight - bottomOffset() - h - margin * 2);
    return margin + usable * pos.yPct;
  }

  const style = computed(() => {
    if (dragging.value) return { left: `${dragXY.x}px`, top: `${dragXY.y}px`, right: 'auto', transition: 'none' };
    const top = `${restingTop()}px`;
    return pos.side === 'left'
      ? { left: `${margin}px`, right: 'auto', top }
      : { right: `${margin}px`, left: 'auto', top };
  });

  function onPointerDown(e) {
    if (e.button !== undefined && e.button !== 0) return;
    const el = elRef.value; if (!el) return;
    const rect = el.getBoundingClientRect();
    start = { x: e.clientX, y: e.clientY, left: rect.left, top: rect.top, moved: false };
    try { el.setPointerCapture(e.pointerId); } catch { /* ignore */ }
    el.addEventListener('pointermove', onPointerMove);
    el.addEventListener('pointerup', onPointerUp);
    el.addEventListener('pointercancel', onPointerUp);
  }
  function onPointerMove(e) {
    if (!start) return;
    const dx = e.clientX - start.x, dy = e.clientY - start.y;
    if (!start.moved && Math.hypot(dx, dy) < CLICK_THRESHOLD) return;
    start.moved = true;
    dragging.value = true;
    const { w, h } = elSize();
    dragXY.x = Math.min(window.innerWidth - w - 4, Math.max(4, start.left + dx));
    dragXY.y = Math.min(window.innerHeight - h - 4, Math.max(4, start.top + dy));
  }
  function onPointerUp(e) {
    const el = elRef.value;
    if (el) {
      el.removeEventListener('pointermove', onPointerMove);
      el.removeEventListener('pointerup', onPointerUp);
      el.removeEventListener('pointercancel', onPointerUp);
      try { el.releasePointerCapture(e.pointerId); } catch { /* ignore */ }
    }
    if (!start) return;
    const moved = start.moved;
    start = null;
    if (moved) {
      const { w, h } = elSize();
      const centerX = dragXY.x + w / 2;
      pos.side = centerX < window.innerWidth / 2 ? 'left' : 'right';
      const usable = Math.max(1, window.innerHeight - bottomOffset() - h - margin * 2);
      pos.yPct = Math.min(1, Math.max(0, (dragXY.y - margin) / usable));
      dragging.value = false;
      save();
      return;
    }
    dragging.value = false;
    const now = Date.now();
    if (now - lastTap < 350 && typeof opts.onDoubleClick === 'function') { lastTap = 0; opts.onDoubleClick(); return; }
    lastTap = now;
    if (typeof opts.onClick === 'function') opts.onClick();
  }

  onMounted(() => {
    load();
    const el = elRef.value;
    if (el) { el.addEventListener('pointerdown', onPointerDown); el.style.touchAction = 'none'; }
  });
  onBeforeUnmount(() => {
    const el = elRef.value;
    if (el) el.removeEventListener('pointerdown', onPointerDown);
  });

  return { style, dragging, pos };
}
