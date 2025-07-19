<template>
  <div v-if="editor" class="tiptap-editor-border">
    <div class="toolbar">
      <v-btn-toggle v-model="toggleFormatting" multiple dense rounded="0">
        <v-btn @click="editor.chain().focus().toggleBold().run()" :class="{ 'is-active': editor.isActive('bold') }">
          <v-icon>mdi-format-bold</v-icon>
        </v-btn>
        <v-btn @click="editor.chain().focus().toggleItalic().run()" :class="{ 'is-active': editor.isActive('italic') }">
          <v-icon>mdi-format-italic</v-icon>
        </v-btn>
        <v-btn @click="editor.chain().focus().toggleUnderline().run()" :class="{ 'is-active': editor.isActive('underline') }">
          <v-icon>mdi-format-underline</v-icon>
        </v-btn>
      </v-btn-toggle>

      <v-btn-toggle v-model="toggleAlign" dense rounded="0" class="ml-2">
         <v-btn @click="editor.chain().focus().setTextAlign('left').run()" :class="{ 'is-active': editor.isActive({ textAlign: 'left' }) }">
          <v-icon>mdi-format-align-left</v-icon>
        </v-btn>
        <v-btn @click="editor.chain().focus().setTextAlign('center').run()" :class="{ 'is-active': editor.isActive({ textAlign: 'center' }) }">
          <v-icon>mdi-format-align-center</v-icon>
        </v-btn>
        <v-btn @click="editor.chain().focus().setTextAlign('right').run()" :class="{ 'is-active': editor.isActive({ textAlign: 'right' }) }">
          <v-icon>mdi-format-align-right</v-icon>
        </v-btn>
      </v-btn-toggle>
      
      <input
        type="color"
        @input="editor.chain().focus().setColor($event.target.value).run()"
        :value="editor.getAttributes('textStyle').color || '#000000'"
        class="ml-2"
      >
    </div>
    <editor-content :editor="editor" />
  </div>
</template>

<script setup>
import { useEditor, EditorContent } from '@tiptap/vue-3';
import StarterKit from '@tiptap/starter-kit';

// ✅【核心修改】將 Tiptap 擴充功能改為具名導入
import { Underline } from '@tiptap/extension-underline';
import { TextAlign } from '@tiptap/extension-text-align';
import { TextStyle } from '@tiptap/extension-text-style';
import { Color } from '@tiptap/extension-color';

import { ref, watch, onBeforeUnmount, defineProps, defineEmits } from 'vue';

const props = defineProps({
  modelValue: {
    type: String,
    default: '',
  },
});

const emit = defineEmits(['update:modelValue']);

const editor = useEditor({
  content: props.modelValue,
  extensions: [
    StarterKit,
    Underline,
    TextStyle,
    Color,
    TextAlign.configure({
      types: ['heading', 'paragraph'],
    }),
  ],
  onUpdate: () => {
    emit('update:modelValue', editor.value.getHTML());
  },
});

watch(() => props.modelValue, (value) => {
  if (editor.value && editor.value.getHTML() !== value) {
    editor.value.commands.setContent(value, false);
  }
});

onBeforeUnmount(() => {
  if (editor.value) {
    editor.value.destroy();
  }
});

// These are for Vuetify's v-btn-toggle visuals, not for functionality
const toggleFormatting = ref([]);
const toggleAlign = ref([]);
</script>

<style>
.tiptap-editor-border {
  border: 1px solid #ccc;
  border-radius: 4px;
}
.toolbar {
  display: flex;
  align-items: center;
  padding: 8px;
  border-bottom: 1px solid #ccc;
  background-color: #f5f5f5;
}
.ProseMirror {
  padding: 16px;
  min-height: 200px;
}
.ProseMirror:focus {
  outline: none;
}
.toolbar input[type="color"] {
  width: 30px;
  height: 30px;
  border: none;
  background: none;
  cursor: pointer;
}
</style>