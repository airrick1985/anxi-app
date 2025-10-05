<template>
  <div v-if="editor" class="tiptap-editor" :class="{ 'is-disabled': disabled }">
    <div class="toolbar">
      <v-btn icon="mdi-format-bold" size="small" variant="text" @click="editor.chain().focus().toggleBold().run()" :class="{ 'is-active': editor.isActive('bold') }"></v-btn>
      <v-btn icon="mdi-format-italic" size="small" variant="text" @click="editor.chain().focus().toggleItalic().run()" :class="{ 'is-active': editor.isActive('italic') }"></v-btn>
      <v-btn icon="mdi-format-underline" size="small" variant="text" @click="editor.chain().focus().toggleUnderline().run()" :class="{ 'is-active': editor.isActive('underline') }"></v-btn>
      <v-btn icon="mdi-format-strikethrough" size="small" variant="text" @click="editor.chain().focus().toggleStrike().run()" :class="{ 'is-active': editor.isActive('strike') }"></v-btn>
      
      <v-divider vertical class="mx-1"></v-divider>

      <v-menu offset-y>
        <template v-slot:activator="{ props }">
          <v-btn v-bind="props" icon size="small" variant="text">
            <v-icon :color="currentColor">mdi-format-color-text</v-icon>
          </v-btn>
        </template>
        <v-color-picker
          show-swatches
          :model-value="currentColor"
          @update:model-value="editor.chain().focus().setColor($event).run()"
        ></v-color-picker>
      </v-menu>

      <v-divider vertical class="mx-1"></v-divider>

      <v-btn icon="mdi-format-list-bulleted" size="small" variant="text" @click="editor.chain().focus().toggleBulletList().run()" :class="{ 'is-active': editor.isActive('bulletList') }"></v-btn>
      <v-btn icon="mdi-format-list-numbered" size="small" variant="text" @click="editor.chain().focus().toggleOrderedList().run()" :class="{ 'is-active': editor.isActive('orderedList') }"></v-btn>
      <v-divider vertical class="mx-1"></v-divider>
      <v-btn icon="mdi-link-variant" size="small" variant="text" @click="setLink" :class="{ 'is-active': editor.isActive('link') }"></v-btn>
      <v-btn icon="mdi-link-variant-off" size="small" variant="text" @click="editor.chain().focus().unsetLink().run()" :disabled="!editor.isActive('link')"></v-btn>
      
      <template v-if="placeholders.length > 0">
        <v-divider vertical class="mx-1"></v-divider>
        <v-menu offset-y>
          <template v-slot:activator="{ props }">
            <v-btn v-bind="props" size="small" variant="text" append-icon="mdi-chevron-down">
              <v-icon start>mdi-variable-box</v-icon>
              插入變數
            </v-btn>
          </template>
          <v-list density="compact">
            <v-list-item
              v-for="p in placeholders"
              :key="p.value"
              @click="insertPlaceholder(p.value)"
            >
              <v-list-item-title>{{ p.text }}</v-list-item-title>
              <v-list-item-subtitle>{{ p.value }}</v-list-item-subtitle>
            </v-list-item>
          </v-list>
        </v-menu>
      </template>

    </div>
    <EditorContent :editor="editor" />
  </div>
</template>


<script setup>
import { useEditor, EditorContent } from '@tiptap/vue-3';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import Link from '@tiptap/extension-link';
import { Color } from '@tiptap/extension-color';
import { TextStyle } from '@tiptap/extension-text-style';
import { watch, onBeforeUnmount, computed } from 'vue';

// 1. 定義 props 和 emits
const props = defineProps({
  modelValue: {
    type: String,
    default: '',
  },
  disabled: {
    type: Boolean,
    default: false,
  },
  placeholders: {
    type: Array,
    default: () => [],
  },
});

const emit = defineEmits(['update:modelValue']);

// 2. 初始化 TipTap 編輯器
const editor = useEditor({
  content: props.modelValue,
  editable: !props.disabled,
  extensions: [
    StarterKit,
    Underline,
    Link.configure({
      openOnClick: false,
    }),
    TextStyle,
    Color,
  ],
  onUpdate: ({ editor }) => {
    emit('update:modelValue', editor.getHTML());
  },
});

// 3. 監聽 disabled prop 的變化
watch(() => props.disabled, (newValue) => {
  if (editor.value) {
    editor.value.setEditable(!newValue);
  }
});

// 4. 監聽 modelValue 的變化，從外部更新編輯器內容
watch(() => props.modelValue, (value) => {
  if (editor.value && editor.value.getHTML() !== value) {
    editor.value.commands.setContent(value, false);
  }
});

// 5. 元件銷毀前，銷毀編輯器實例
onBeforeUnmount(() => {
  if (editor.value) {
    editor.value.destroy();
  }
});

// 6. 設定連結函式
function setLink() {
  const previousUrl = editor.value.getAttributes('link').href;
  const url = window.prompt('URL', previousUrl);

  if (url === null) {
    return;
  }

  if (url === '') {
    editor.value.chain().focus().extendMarkRange('link').unsetLink().run();
    return;
  }

  editor.value.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
}

// 7. 插入佔位符函式
function insertPlaceholder(placeholder) {
  if (editor.value) {
    editor.value.chain().focus().insertContent(placeholder).run();
  }
}

// 8. 計算當前文字顏色
const currentColor = computed(() => {
  return editor.value ? editor.value.getAttributes('textStyle').color || '#000000' : '#000000';
});
</script>

<style lang="scss">
.tiptap-editor {
  border: 1px solid #BDBDBD; // Vuetify's grey-lighten-1
  border-radius: 4px;

  .toolbar {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    padding: 4px;
    border-bottom: 1px solid #BDBDBD;
    background-color: #f5f5f5;

    .v-btn {
      &.is-active {
        background-color: rgba(0, 0, 0, 0.1);
      }
    }
  }

  .ProseMirror {
    padding: 8px 12px;
    min-height: 150px;
    outline: none;

    p.is-editor-empty:first-child::before {
      content: attr(data-placeholder);
      float: left;
      color: #adb5bd;
      pointer-events: none;
      height: 0;
    }
  }

  &.is-disabled {
    background-color: #f5f5f5; // Vuetify's grey-lighten-4
    color: rgba(0, 0, 0, 0.38); // Disabled text color

    .toolbar {
      display: none;
    }

    .ProseMirror {
      color: inherit;
    }
  }
}
</style>