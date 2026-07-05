<template>
  <v-dialog v-model="show" max-width="720" persistent scrollable>
    <v-card>
      <v-card-title class="d-flex align-center bg-blue-grey-darken-2 text-white py-3">
        <v-icon start>mdi-note-edit-outline</v-icon>
        編輯報價單備註
        <v-spacer></v-spacer>
        <v-btn icon="mdi-close" variant="text" size="small" @click="close"></v-btn>
      </v-card-title>

      <v-card-text class="pa-4">
        <div class="text-body-2 text-grey-darken-1 mb-3">
          此備註將渲染於「列印報價單(含期款)」每一戶報價單的最下方。
        </div>

        <!-- 工具列 -->
        <div class="editor-toolbar d-flex align-center flex-wrap ga-1 pa-1">
          <v-btn v-for="tool in textTools" :key="tool.cmd"
            :icon="tool.icon" size="small" variant="text" density="comfortable"
            :title="tool.title" @mousedown.prevent @click="exec(tool.cmd)"></v-btn>

          <v-divider vertical class="mx-1"></v-divider>

          <!-- 字級 -->
          <v-btn size="small" variant="text" density="comfortable" title="小字" @mousedown.prevent @click="exec('fontSize', '2')">
            <span style="font-size: 11px;">A</span>
          </v-btn>
          <v-btn size="small" variant="text" density="comfortable" title="正常" @mousedown.prevent @click="exec('fontSize', '3')">
            <span style="font-size: 14px;">A</span>
          </v-btn>
          <v-btn size="small" variant="text" density="comfortable" title="大字" @mousedown.prevent @click="exec('fontSize', '5')">
            <span style="font-size: 18px;">A</span>
          </v-btn>

          <v-divider vertical class="mx-1"></v-divider>

          <!-- 文字顏色 -->
          <v-btn v-for="color in colorSwatches" :key="color"
            icon size="x-small" variant="text" :title="`文字顏色`"
            @mousedown.prevent @click="exec('foreColor', color)">
            <v-icon size="18" :color="color">mdi-circle</v-icon>
          </v-btn>

          <v-divider vertical class="mx-1"></v-divider>

          <v-btn icon="mdi-format-list-bulleted" size="small" variant="text" density="comfortable"
            title="項目符號" @mousedown.prevent @click="exec('insertUnorderedList')"></v-btn>
          <v-btn icon="mdi-format-list-numbered" size="small" variant="text" density="comfortable"
            title="編號清單" @mousedown.prevent @click="exec('insertOrderedList')"></v-btn>

          <v-divider vertical class="mx-1"></v-divider>

          <v-btn icon="mdi-format-clear" size="small" variant="text" density="comfortable"
            title="清除格式" @mousedown.prevent @click="exec('removeFormat')"></v-btn>
          <v-btn icon="mdi-undo" size="small" variant="text" density="comfortable"
            title="復原" @mousedown.prevent @click="exec('undo')"></v-btn>
          <v-btn icon="mdi-redo" size="small" variant="text" density="comfortable"
            title="重做" @mousedown.prevent @click="exec('redo')"></v-btn>
        </div>

        <!-- 編輯區 -->
        <div
          ref="editorEl"
          class="editor-body"
          contenteditable="true"
          data-placeholder="輸入備註內容，例如：本報價單僅供參考，實際金額以正式合約為準…"
        ></div>

        <div v-if="updatedInfo" class="text-caption text-grey mt-2">{{ updatedInfo }}</div>
      </v-card-text>

      <v-divider></v-divider>

      <v-card-actions class="pa-3">
        <v-btn
          v-if="hasExisting"
          color="red-darken-1"
          variant="text"
          prepend-icon="mdi-delete-outline"
          :loading="deleting"
          @click="handleDelete"
        >
          刪除備註
        </v-btn>
        <v-spacer></v-spacer>
        <v-btn variant="text" @click="close">取消</v-btn>
        <v-btn
          color="blue-grey-darken-2"
          variant="flat"
          prepend-icon="mdi-content-save-outline"
          :loading="saving"
          @click="handleSave"
        >
          儲存
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { ref, computed, watch, nextTick } from 'vue';
import { useToast } from 'vue-toastification';
import { useUserStore } from '@/store/user';
import { fetchQuoteRemark, saveQuoteRemark, deleteQuoteRemark } from '@/api';

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  projectId: { type: String, default: '' },
});
const emit = defineEmits(['update:modelValue', 'saved']);

const toast = useToast();
const userStore = useUserStore();

const show = computed({
  get: () => props.modelValue,
  set: (v) => emit('update:modelValue', v),
});

const editorEl = ref(null);
const hasExisting = ref(false);
const updatedInfo = ref('');
const saving = ref(false);
const deleting = ref(false);

const textTools = [
  { cmd: 'bold', icon: 'mdi-format-bold', title: '粗體' },
  { cmd: 'italic', icon: 'mdi-format-italic', title: '斜體' },
  { cmd: 'underline', icon: 'mdi-format-underline', title: '底線' },
  { cmd: 'strikeThrough', icon: 'mdi-format-strikethrough', title: '刪除線' },
];
const colorSwatches = ['#212121', '#c62828', '#1565c0', '#2e7d32', '#e65100'];

function exec(cmd, value = null) {
  editorEl.value?.focus();
  document.execCommand(cmd, false, value);
}

// 開啟時載入現有備註
watch(show, async (visible) => {
  if (!visible) return;
  updatedInfo.value = '';
  hasExisting.value = false;
  await nextTick();
  if (editorEl.value) editorEl.value.innerHTML = '';

  const res = await fetchQuoteRemark(props.projectId);
  if (res.status === 'success' && res.data) {
    hasExisting.value = true;
    if (editorEl.value) editorEl.value.innerHTML = res.data.content || '';
    const when = res.data.updatedAt?.toDate
      ? new Intl.DateTimeFormat('zh-TW', {
          timeZone: 'Asia/Taipei', year: 'numeric', month: '2-digit', day: '2-digit',
          hour: '2-digit', minute: '2-digit',
        }).format(res.data.updatedAt.toDate())
      : '';
    if (res.data.updatedBy || when) {
      updatedInfo.value = `最後更新：${res.data.updatedBy || '—'}${when ? `（${when}）` : ''}`;
    }
  } else if (res.status === 'error') {
    toast.error(`載入備註失敗：${res.message}`);
  }
});

async function handleSave() {
  const html = editorEl.value?.innerHTML || '';
  // 內容全空（僅空白/換行）時視同清空
  const isEmpty = !editorEl.value?.textContent?.trim();
  saving.value = true;
  const res = await saveQuoteRemark(
    props.projectId,
    isEmpty ? '' : html,
    userStore.user?.name || ''
  );
  saving.value = false;
  if (res.status === 'success') {
    toast.success('報價單備註已儲存');
    emit('saved');
    show.value = false;
  } else {
    toast.error(`儲存失敗：${res.message}`);
  }
}

async function handleDelete() {
  deleting.value = true;
  const res = await deleteQuoteRemark(props.projectId);
  deleting.value = false;
  if (res.status === 'success') {
    toast.success('報價單備註已刪除');
    emit('saved');
    show.value = false;
  } else {
    toast.error(`刪除失敗：${res.message}`);
  }
}

function close() {
  show.value = false;
}
</script>

<style scoped>
.editor-toolbar {
  border: 1px solid #cfd8dc;
  border-bottom: none;
  border-radius: 4px 4px 0 0;
  background: #f5f7f8;
}

.editor-body {
  min-height: 180px;
  max-height: 360px;
  overflow-y: auto;
  border: 1px solid #cfd8dc;
  border-radius: 0 0 4px 4px;
  padding: 12px 14px;
  font-size: 14px;
  line-height: 1.8;
  outline: none;
}

.editor-body:focus {
  border-color: #546e7a;
}

.editor-body:empty::before {
  content: attr(data-placeholder);
  color: #b0bec5;
  pointer-events: none;
}

.editor-body :deep(ul),
.editor-body :deep(ol) {
  padding-left: 24px;
}
</style>
