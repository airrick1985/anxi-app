// src/directives/vFileDrop.js
// 讓任一區塊成為「拖曳檔案上傳」放置區（銷控系統所有上傳功能共用）。
//
// 用法：
//   <div v-file-drop>…<input type="file" @change="…"></div>
//       自動尋找區塊內的 input[type=file]（含 v-file-input 內部 input），
//       放下後把檔案注入該 input 並觸發 change，原本的 @change／v-model 流程完全不用改。
//   <div v-file-drop="fileInputRef">          input 不在區塊內時，直接指定 input 元素
//   <div v-file-drop="files => handle(files)"> 自訂處理函式，收到 File 陣列
//   <div v-file-drop="false">                 停用（例如唯讀／上傳中）
//   <div v-file-drop="{ input, onFiles, accept, multiple, disabled }">
//
// 會依 input 的 accept／multiple（或 options）過濾：格式全部不符時提示、非 multiple 只取第一個。
// 拖曳進入時加上 .file-drop--over（樣式見 src/styles/fileDrop.css）。
// 只要頁面上有任一放置區，就會攔截整個視窗的檔案拖放，避免拖錯位置時瀏覽器直接開啟檔案離開系統。

import { useToast, POSITION } from 'vue-toastification';

const OVER_CLASS = 'file-drop--over';
const ATTR = 'data-file-drop';
const states = new WeakMap();
let guardCount = 0;

function hasFiles(e) {
  const types = e.dataTransfer?.types;
  return !!types && Array.from(types).includes('Files');
}

function preventWindowDrop(e) {
  if (hasFiles(e)) e.preventDefault();
}
function addGuard() {
  if (guardCount++ === 0) {
    window.addEventListener('dragover', preventWindowDrop);
    window.addEventListener('drop', preventWindowDrop);
  }
}
function removeGuard() {
  if (--guardCount <= 0) {
    guardCount = 0;
    window.removeEventListener('dragover', preventWindowDrop);
    window.removeEventListener('drop', preventWindowDrop);
  }
}

function isElement(v) {
  return typeof HTMLElement !== 'undefined' && v instanceof HTMLElement;
}

// 解析 binding.value → { input, onFiles, accept, multiple } 或 null（停用）
function resolveConfig(el, value) {
  if (value === false) return null;
  const cfg = { input: null, onFiles: null, accept: undefined, multiple: undefined };

  if (typeof value === 'function') {
    cfg.onFiles = value;
  } else if (isElement(value)) {
    cfg.input = value;
  } else if (value && typeof value === 'object') {
    if (isElement(value.value)) {
      cfg.input = value.value; // 傳入未解包的 ref
    } else {
      if (value.disabled) return null;
      if (typeof value.onFiles === 'function') cfg.onFiles = value.onFiles;
      const inp = isElement(value.input) ? value.input : (isElement(value.input?.value) ? value.input.value : null);
      if (inp) cfg.input = inp;
      if (typeof value.accept === 'string') cfg.accept = value.accept;
      if (typeof value.multiple === 'boolean') cfg.multiple = value.multiple;
    }
  }

  if (!cfg.input && !cfg.onFiles) {
    cfg.input = el.querySelector('input[type="file"]');
  }
  if (cfg.input) {
    if (cfg.input.disabled || cfg.input.closest('.v-input--disabled, .v-input--readonly')) return null;
    if (cfg.accept === undefined) cfg.accept = cfg.input.accept || '';
    if (cfg.multiple === undefined) cfg.multiple = !!cfg.input.multiple;
  } else if (!cfg.onFiles) {
    return null;
  }
  if (cfg.multiple === undefined) cfg.multiple = true;
  return cfg;
}

function parseAccept(accept) {
  return String(accept || '')
    .split(',')
    .map(t => t.trim().toLowerCase())
    .filter(Boolean);
}

function fileMatches(file, tokens) {
  if (tokens.length === 0) return true;
  const name = (file.name || '').toLowerCase();
  const type = (file.type || '').toLowerCase();
  return tokens.some(t => {
    if (t.startsWith('.')) return name.endsWith(t);
    if (t.endsWith('/*')) return type.startsWith(t.slice(0, -1));
    return type === t;
  });
}

let toastInstance = null;
function notifyRejected() {
  try {
    if (!toastInstance) toastInstance = useToast();
    toastInstance.warning('不支援的檔案格式', { position: POSITION.BOTTOM_CENTER, timeout: 2500 });
  } catch (e) { /* toast 未安裝時略過 */ }
}

// 事件是否該交給更內層的放置區、或 v-file-input 自己的欄位處理
function shouldSkip(el, e) {
  const target = e.target instanceof Element ? e.target : null;
  if (!target) return false;
  const nearest = target.closest(`[${ATTR}]`);
  if (nearest && nearest !== el) return true; // 內層放置區優先
  if (target.closest('.v-file-input .v-field')) return true; // Vuetify 欄位本身已支援拖放
  return false;
}

function setOver(el, on) {
  const st = states.get(el);
  if (!st) return;
  if (on) {
    el.classList.add(OVER_CLASS);
    clearTimeout(st.timer);
    st.timer = setTimeout(() => { st.depth = 0; el.classList.remove(OVER_CLASS); }, 600);
  } else {
    clearTimeout(st.timer);
    st.depth = 0;
    el.classList.remove(OVER_CLASS);
  }
}

function makeHandlers(el) {
  const onDragenter = (e) => {
    const st = states.get(el);
    if (!st || !hasFiles(e) || shouldSkip(el, e)) return;
    if (!resolveConfig(el, st.value)) return;
    st.depth += 1;
    setOver(el, true);
  };
  const onDragover = (e) => {
    const st = states.get(el);
    if (!st || !hasFiles(e) || shouldSkip(el, e)) return;
    if (!resolveConfig(el, st.value)) return;
    e.preventDefault();
    if (e.dataTransfer) e.dataTransfer.dropEffect = 'copy';
    setOver(el, true);
  };
  const onDragleave = (e) => {
    const st = states.get(el);
    if (!st || !hasFiles(e)) return;
    st.depth = Math.max(0, st.depth - 1);
    if (st.depth === 0) setOver(el, false);
  };
  const onDrop = (e) => {
    const st = states.get(el);
    if (!st) return;
    if (shouldSkip(el, e)) { setOver(el, false); return; }
    if (!hasFiles(e)) return;
    setOver(el, false);
    const cfg = resolveConfig(el, st.value);
    if (!cfg) return;
    e.preventDefault();
    e.stopPropagation();

    const files = Array.from(e.dataTransfer?.files || []);
    if (files.length === 0) return;
    const tokens = parseAccept(cfg.accept);
    let accepted = files.filter(f => fileMatches(f, tokens));
    if (accepted.length === 0) { notifyRejected(); return; }
    if (!cfg.multiple) accepted = accepted.slice(0, 1);

    if (cfg.onFiles) {
      cfg.onFiles(accepted, e);
      return;
    }
    try {
      const dt = new DataTransfer();
      accepted.forEach(f => dt.items.add(f));
      cfg.input.files = dt.files;
      cfg.input.dispatchEvent(new Event('change', { bubbles: true }));
    } catch (err) {
      console.error('[v-file-drop] 無法注入檔案', err);
    }
  };
  return { onDragenter, onDragover, onDragleave, onDrop };
}

export const vFileDrop = {
  mounted(el, binding) {
    const handlers = makeHandlers(el);
    states.set(el, { value: binding.value, depth: 0, timer: null, handlers });
    el.setAttribute(ATTR, '');
    // 用 capture 讓內層元件（如 v-file-input）即使 stopPropagation 也能正確維護高亮狀態
    el.addEventListener('dragenter', handlers.onDragenter, true);
    el.addEventListener('dragover', handlers.onDragover, true);
    el.addEventListener('dragleave', handlers.onDragleave, true);
    el.addEventListener('drop', handlers.onDrop, true);
    addGuard();
  },
  updated(el, binding) {
    const st = states.get(el);
    if (st) st.value = binding.value;
  },
  unmounted(el) {
    const st = states.get(el);
    if (!st) return;
    clearTimeout(st.timer);
    el.removeEventListener('dragenter', st.handlers.onDragenter, true);
    el.removeEventListener('dragover', st.handlers.onDragover, true);
    el.removeEventListener('dragleave', st.handlers.onDragleave, true);
    el.removeEventListener('drop', st.handlers.onDrop, true);
    el.classList.remove(OVER_CLASS);
    el.removeAttribute(ATTR);
    states.delete(el);
    removeGuard();
  },
};

export default vFileDrop;
