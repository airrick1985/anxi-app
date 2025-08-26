<template>
  <div v-if="editor" class="editor-container">
    <div class="toolbar">
      <v-btn
        icon="mdi-format-bold"
        size="small"
        variant="text"
        :class="{ 'is-active': editor.isActive('bold') }"
        @click="editor.chain().focus().toggleBold().run()"
      ></v-btn>
      <v-btn
        icon="mdi-format-italic"
        size="small"
        variant="text"
        :class="{ 'is-active': editor.isActive('italic') }"
        @click="editor.chain().focus().toggleItalic().run()"
      ></v-btn>
      <v-btn
        icon="mdi-format-list-bulleted"
        size="small"
        variant="text"
        :class="{ 'is-active': editor.isActive('bulletList') }"
        @click="editor.chain().focus().toggleBulletList().run()"
      ></v-btn>
      
      <v-divider vertical class="mx-2"></v-divider>

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

      <v-menu offset-y>
        <template v-slot:activator="{ props }">
          <v-btn v-bind="props" size="small" variant="text" class="px-2">
            字體大小
            <v-icon end>mdi-menu-down</v-icon>
          </v-btn>
        </template>
        <v-list density="compact">
          <v-list-item @click="editor.chain().focus().unsetFontSize().run()">
            <v-list-item-title>預設</v-list-item-title>
          </v-list-item>
          <v-list-item @click="editor.chain().focus().setFontSize('14px').run()">
            <v-list-item-title>小</v-list-item-title>
          </v-list-item>
          <v-list-item @click="editor.chain().focus().setFontSize('18px').run()">
            <v-list-item-title>中</v-list-item-title>
          </v-list-item>
          <v-list-item @click="editor.chain().focus().setFontSize('24px').run()">
            <v-list-item-title>大</v-list-item-title>
          </v-list-item>
        </v-list>
      </v-menu>
    </div>

    <editor-content :editor="editor" class="editor-content" />
  </div>
</template>

<script setup>
import { useEditor, EditorContent } from '@tiptap/vue-3';
import StarterKit from '@tiptap/starter-kit';
import { Color } from '@tiptap/extension-color';
import { TextStyle } from '@tiptap/extension-text-style'; 
import { FontSize } from './tiptap-fontsize.js'; 

import { watch, onBeforeUnmount, computed } from 'vue';

// 1. 定義 props 和 emits，以支援 v-model
const props = defineProps({
  modelValue: {
    type: String,
    default: '',
  },
});

const emit = defineEmits(['update:modelValue']);

// 2. 初始化 TipTap 編輯器
const editor = useEditor({
  content: props.modelValue,
  extensions: [
    StarterKit,
    TextStyle,
    Color,
    FontSize, // 註冊字體大小擴充
  ],
  // 3. 當編輯器內容更新時，觸發 update:modelValue 事件
  onUpdate: ({ editor }) => {
    emit('update:modelValue', editor.getHTML());
  },
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

// 6. 計算當前文字顏色，用於工具列圖示
const currentColor = computed(() => {
  return editor.value ? editor.value.getAttributes('textStyle').color || '#000000' : '#000000';
});
</script>

<style>
/* TipTap 編輯器的基本樣式 */
.editor-container {
  border: 1px solid #ccc;
  border-radius: 4px;
}

.toolbar {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  padding: 4px;
  border-bottom: 1px solid #ccc;
  background-color: #f5f5f5;
}

.toolbar .is-active {
  background-color: rgba(0, 0, 0, 0.1);
}

.editor-content .ProseMirror {
  padding: 8px 12px;
  min-height: 150px;
  outline: none;
}

.editor-content .ProseMirror p.is-editor-empty:first-child::before {
  content: attr(data-placeholder);
  float: left;
  color: #adb5bd;
  pointer-events: none;
  height: 0;
}
</style>