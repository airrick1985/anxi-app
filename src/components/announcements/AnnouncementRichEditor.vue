<template>
  <div class="are" :class="{ 'are--focused': focused }">
    <div v-if="editor" class="are-toolbar">
      <!-- 文字大小 -->
      <select class="are-select" :value="currentFontSize" title="文字大小" @change="setFontSize($event.target.value)">
        <option v-for="o in fontSizeOptions" :key="o.value" :value="o.value">{{ o.label }}</option>
      </select>

      <span class="are-sep"></span>

      <button type="button" class="are-btn" :class="{ 'are-btn--on': editor.isActive('bold') }" title="粗體（⌘/Ctrl+B）" @mousedown.prevent @click="run(c => c.toggleBold())">
        <v-icon size="17">mdi-format-bold</v-icon>
      </button>
      <button type="button" class="are-btn" :class="{ 'are-btn--on': editor.isActive('italic') }" title="斜體（⌘/Ctrl+I）" @mousedown.prevent @click="run(c => c.toggleItalic())">
        <v-icon size="17">mdi-format-italic</v-icon>
      </button>
      <button type="button" class="are-btn" :class="{ 'are-btn--on': editor.isActive('underline') }" title="底線（⌘/Ctrl+U）" @mousedown.prevent @click="run(c => c.toggleUnderline())">
        <v-icon size="17">mdi-format-underline</v-icon>
      </button>
      <button type="button" class="are-btn" :class="{ 'are-btn--on': editor.isActive('strike') }" title="刪除線" @mousedown.prevent @click="run(c => c.toggleStrike())">
        <v-icon size="17">mdi-format-strikethrough-variant</v-icon>
      </button>

      <span class="are-sep"></span>

      <!-- 文字顏色 -->
      <v-menu v-model="colorMenu" :close-on-content-click="false" location="bottom start" :offset="4">
        <template #activator="{ props: mp }">
          <button type="button" class="are-btn are-btn--color" v-bind="mp" title="文字顏色" @mousedown.prevent>
            <v-icon size="17">mdi-format-color-text</v-icon>
            <span class="are-color-bar" :style="{ background: currentColor || '#1d1d1f' }"></span>
          </button>
        </template>
        <div class="are-palette">
          <div class="are-palette-grid">
            <button
              v-for="c in COLORS"
              :key="c.value"
              type="button"
              class="are-swatch"
              :class="{ 'are-swatch--on': (currentColor || '').toLowerCase() === c.value }"
              :style="{ background: c.value }"
              :title="c.label"
              @click="setColor(c.value)"
            ></button>
            <label class="are-swatch are-swatch--custom" title="自訂顏色">
              <v-icon size="14">mdi-eyedropper-variant</v-icon>
              <input type="color" :value="currentColor || '#1d1d1f'" @input="setColor($event.target.value)" />
            </label>
          </div>
          <button type="button" class="are-palette-clear" @click="clearColor">
            <v-icon size="13" class="mr-1">mdi-format-color-marker-cancel</v-icon>清除顏色
          </button>
        </div>
      </v-menu>

      <span class="are-sep"></span>

      <button type="button" class="are-btn" :class="{ 'are-btn--on': editor.isActive('orderedList') }" title="編號清單" @mousedown.prevent @click="run(c => c.toggleOrderedList())">
        <v-icon size="17">mdi-format-list-numbered</v-icon>
      </button>
      <button type="button" class="are-btn" :class="{ 'are-btn--on': editor.isActive('bulletList') }" title="項目符號" @mousedown.prevent @click="run(c => c.toggleBulletList())">
        <v-icon size="17">mdi-format-list-bulleted</v-icon>
      </button>

      <span class="are-sep"></span>

      <button type="button" class="are-btn" title="清除格式" @mousedown.prevent @click="run(c => c.unsetAllMarks().clearNodes())">
        <v-icon size="17">mdi-format-clear</v-icon>
      </button>

      <span class="are-spacer"></span>

      <button type="button" class="are-btn" title="復原（⌘/Ctrl+Z）" :disabled="!editor.can().undo()" @mousedown.prevent @click="run(c => c.undo())">
        <v-icon size="16">mdi-undo</v-icon>
      </button>
      <button type="button" class="are-btn" title="重做（⌘/Ctrl+Shift+Z）" :disabled="!editor.can().redo()" @mousedown.prevent @click="run(c => c.redo())">
        <v-icon size="16">mdi-redo</v-icon>
      </button>
    </div>
    <EditorContent :editor="editor" class="are-content" />
  </div>
</template>

<script setup>
/**
 * 公告內容富文本編輯器（tiptap）
 * - 工具列：文字大小、粗體、斜體、底線、刪除線、文字顏色、編號／項目符號清單、清除格式、復原／重做
 * - 網址輸入或貼上會自動變成連結；輸出 HTML（顯示端經 announcementContentHtml 清理）
 * - 樣式對齊公告管理視窗（anm-*）的 macOS 風格
 */
import { ref, computed, watch, onBeforeUnmount } from 'vue';
import { useEditor, EditorContent } from '@tiptap/vue-3';
import StarterKit from '@tiptap/starter-kit';
import { TextStyle, Color, FontSize } from '@tiptap/extension-text-style';
import { Placeholder } from '@tiptap/extensions';

const props = defineProps({
  modelValue: { type: String, default: '' },
  placeholder: { type: String, default: '' },
  disabled: { type: Boolean, default: false },
});
const emit = defineEmits(['update:modelValue']);

const FONT_SIZES = [
  { value: '', label: '預設' },
  { value: '12px', label: '小' },
  { value: '16px', label: '中' },
  { value: '20px', label: '大' },
  { value: '24px', label: '特大' },
  { value: '30px', label: '巨大' },
];
const COLORS = [
  { value: '#1d1d1f', label: '黑' },
  { value: '#8e8e93', label: '灰' },
  { value: '#ff3b30', label: '紅' },
  { value: '#ff9500', label: '橘' },
  { value: '#d4a800', label: '黃' },
  { value: '#34c759', label: '綠' },
  { value: '#00a3a3', label: '青' },
  { value: '#0a84ff', label: '藍' },
  { value: '#5856d6', label: '靛' },
  { value: '#af52de', label: '紫' },
  { value: '#ff2d55', label: '粉' },
  { value: '#a2845e', label: '棕' },
];

const focused = ref(false);
const colorMenu = ref(false);

const editor = useEditor({
  content: props.modelValue,
  editable: !props.disabled,
  extensions: [
    StarterKit.configure({
      // 公告不需要標題／程式碼／引言／分隔線，關閉以免 Markdown 快捷輸入（# 、``` 、> 、---）誤觸
      heading: false,
      codeBlock: false,
      code: false,
      blockquote: false,
      horizontalRule: false,
      link: { openOnClick: false, autolink: true, linkOnPaste: true, defaultProtocol: 'https' },
    }),
    TextStyle,
    Color,
    FontSize,
    Placeholder.configure({ placeholder: () => props.placeholder }),
  ],
  onUpdate: ({ editor: ed }) => emit('update:modelValue', ed.getHTML()),
  onFocus: () => { focused.value = true; },
  onBlur: () => { focused.value = false; },
});

function run(fn) {
  if (!editor.value) return;
  fn(editor.value.chain().focus()).run();
}

const textStyleAttrs = computed(() => (editor.value ? editor.value.getAttributes('textStyle') : {}));
const currentFontSize = computed(() => textStyleAttrs.value.fontSize || '');
const currentColor = computed(() => textStyleAttrs.value.color || '');

// 目前選取的字級若不在預設清單（例如貼上來的內容），暫時加進選單以正確顯示
const fontSizeOptions = computed(() => {
  const cur = currentFontSize.value;
  if (!cur || FONT_SIZES.some(o => o.value === cur)) return FONT_SIZES;
  return [...FONT_SIZES, { value: cur, label: cur }];
});

function setFontSize(size) {
  if (!editor.value) return;
  const chain = editor.value.chain().focus();
  if (size) chain.setFontSize(size).run();
  else chain.unsetFontSize().run();
}
function setColor(color) {
  run(c => c.setColor(color));
}
function clearColor() {
  run(c => c.unsetColor());
  colorMenu.value = false;
}

watch(() => props.modelValue, (value) => {
  if (!editor.value) return;
  if (editor.value.getHTML() === value) return;
  editor.value.commands.setContent(value || '', { emitUpdate: false });
});
watch(() => props.disabled, (v) => { editor.value?.setEditable(!v); });

onBeforeUnmount(() => { editor.value?.destroy(); });
</script>

<style scoped>
.are {
  --f: -apple-system, BlinkMacSystemFont, "SF Pro Text", "PingFang TC", "Helvetica Neue", "Noto Sans TC", sans-serif;
  --blue: #0a7aff;
  font-family: var(--f);
  border: 1px solid rgba(0, 0, 0, .18);
  border-radius: 7px;
  background: #fff;
  overflow: hidden;
  transition: box-shadow .12s, border-color .12s;
}
.are--focused { border-color: var(--blue); box-shadow: 0 0 0 3px rgba(10, 122, 255, .25); }

.are-toolbar {
  display: flex; align-items: center; flex-wrap: wrap; gap: 2px;
  padding: 4px 6px; border-bottom: 1px solid rgba(0, 0, 0, .1); background: #f5f5f7;
}
.are-btn {
  position: relative; width: 28px; height: 26px; border: none; border-radius: 6px; background: transparent;
  color: #3a3a3c; cursor: pointer; display: inline-flex; align-items: center; justify-content: center; padding: 0;
}
.are-btn:hover:not(:disabled) { background: rgba(0, 0, 0, .07); }
.are-btn:disabled { opacity: .35; cursor: default; }
.are-btn--on { background: #fff; color: var(--blue); box-shadow: 0 1px 2px rgba(0, 0, 0, .15), 0 0 0 .5px rgba(0, 0, 0, .08); }
.are-btn--color { width: 30px; }
.are-color-bar { position: absolute; left: 6px; right: 6px; bottom: 3px; height: 3px; border-radius: 2px; }
.are-sep { width: 1px; height: 18px; background: rgba(0, 0, 0, .12); margin: 0 4px; flex-shrink: 0; }
.are-spacer { flex: 1; }
.are-select {
  height: 26px; padding: 0 22px 0 8px; border: 1px solid rgba(0, 0, 0, .16); border-radius: 6px; background: #fff;
  font-family: var(--f); font-size: 12px; color: #1d1d1f; cursor: pointer; outline: none;
  appearance: none; -webkit-appearance: none;
  background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='10' height='6' viewBox='0 0 10 6'><path d='M1 1l4 4 4-4' fill='none' stroke='%233a3a3c' stroke-width='1.5' stroke-linecap='round'/></svg>");
  background-repeat: no-repeat; background-position: right 7px center;
}
.are-select:focus { border-color: var(--blue); }

/* 調色盤（v-menu 內容會掛到 body，變數需在此重新宣告） */
.are-palette {
  --f: -apple-system, BlinkMacSystemFont, "SF Pro Text", "PingFang TC", "Helvetica Neue", "Noto Sans TC", sans-serif;
  --blue: #0a7aff;
  font-family: var(--f); padding: 8px; border-radius: 10px; background: #f5f5f7;
  box-shadow: 0 10px 30px rgba(0, 0, 0, .25), 0 0 0 .5px rgba(0, 0, 0, .12);
}
.are-palette-grid { display: grid; grid-template-columns: repeat(7, 24px); gap: 6px; }
.are-swatch {
  position: relative; width: 24px; height: 24px; border-radius: 50%; border: none; padding: 0; cursor: pointer;
  box-shadow: inset 0 0 0 1px rgba(0, 0, 0, .12); display: inline-flex; align-items: center; justify-content: center;
}
.are-swatch:hover { transform: scale(1.1); }
.are-swatch--on { box-shadow: inset 0 0 0 1px rgba(0, 0, 0, .12), 0 0 0 2px #fff, 0 0 0 3.5px var(--blue); }
.are-swatch--custom { background: conic-gradient(#ff3b30, #ff9500, #ffcc00, #34c759, #0a84ff, #af52de, #ff3b30); color: #fff; overflow: hidden; }
.are-swatch--custom input { position: absolute; inset: 0; opacity: 0; cursor: pointer; width: 100%; height: 100%; }
.are-palette-clear {
  width: 100%; margin-top: 8px; height: 24px; border: 1px solid rgba(0, 0, 0, .14); border-radius: 6px; background: #fff;
  font-family: var(--f); font-size: 11px; color: #3a3a3c; cursor: pointer; display: inline-flex; align-items: center; justify-content: center;
}
.are-palette-clear:hover { background: #f0f0f2; }

/* 編輯區（ProseMirror 由 tiptap 產生，需 :deep） */
.are-content :deep(.ProseMirror) {
  min-height: 150px; max-height: 45vh; overflow-y: auto; padding: 8px 12px; outline: none;
  font-size: 14px; line-height: 1.65; color: #1d1d1f; word-break: break-word; overflow-wrap: anywhere;
}
.are-content :deep(.ProseMirror p) { margin: 0 0 .45em; }
.are-content :deep(.ProseMirror p:last-child) { margin-bottom: 0; }
.are-content :deep(.ProseMirror ul),
.are-content :deep(.ProseMirror ol) { padding-left: 1.6em; margin: 0 0 .45em; }
.are-content :deep(.ProseMirror ul) { list-style-type: disc; }
.are-content :deep(.ProseMirror ol) { list-style-type: decimal; }
.are-content :deep(.ProseMirror li) { margin: .15em 0; }
.are-content :deep(.ProseMirror li p) { margin: 0; }
.are-content :deep(.ProseMirror u) { text-decoration: underline; }
.are-content :deep(.ProseMirror s) { text-decoration: line-through; }
.are-content :deep(.ProseMirror a) { color: var(--blue); text-decoration: underline; }
.are-content :deep(.ProseMirror p.is-editor-empty:first-child::before) {
  content: attr(data-placeholder); float: left; height: 0; pointer-events: none; color: rgba(0, 0, 0, .35);
}

@media (max-width: 600px) {
  .are-toolbar { padding: 4px; }
  .are-sep { margin: 0 2px; }
  .are-content :deep(.ProseMirror) { max-height: 38vh; }
}
</style>
