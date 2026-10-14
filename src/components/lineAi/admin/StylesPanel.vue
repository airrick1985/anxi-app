<template>
  <div>
    <div class="lap-bar">
      <div class="lap-title">回覆風格</div>
      <v-spacer />
      <button class="mac-btn mac-btn--sm mac-btn--primary" @click="openEdit(null)"><v-icon size="15">mdi-plus</v-icon>新增</button>
    </div>

    <div class="mac-form-group lap-styles">
      <div v-if="!list.length" class="lap-empty">尚未建立</div>
      <div v-for="(s, i) in list" :key="s.id" class="mac-form-row">
        <div class="lap-order">
          <button class="mac-icon-btn" :disabled="i === 0" title="上移" @click="move(i, -1)"><v-icon size="16">mdi-chevron-up</v-icon></button>
          <button class="mac-icon-btn" :disabled="i === list.length - 1" title="下移" @click="move(i, 1)"><v-icon size="16">mdi-chevron-down</v-icon></button>
        </div>
        <div class="mac-form-row-main">
          <div class="mac-form-row-title">{{ s.name }}<span v-if="s.enabled === false" class="mac-tag ml-2">停用</span></div>
          <div class="mac-form-row-sub">{{ s.instruction }}</div>
        </div>
        <button class="mac-btn mac-btn--sm" @click="openEdit(s)">編輯</button>
        <button class="mac-icon-btn mac-icon-btn--danger" title="刪除" @click="remove(s)"><v-icon size="16">mdi-trash-can-outline</v-icon></button>
      </div>
    </div>

    <v-dialog v-model="edit.show" max-width="560" content-class="mac-dialog-fit">
      <div class="mac-sheet">
        <div class="mac-sheet-head">{{ edit.id ? '編輯風格' : '新增風格' }}<button class="mac-sheet-close" @click="edit.show = false"><v-icon size="18">mdi-close</v-icon></button></div>
        <div class="mac-form lap-form">
          <div class="mac-form-group">
            <div class="mac-form-row"><span class="mac-form-row-label">名稱</span><input v-model="edit.name" class="mac-form-input" placeholder="例：親切、正式、簡短、促成交" /></div>
            <div class="mac-form-row"><span class="mac-form-row-label">啟用</span><span style="flex:1" /><input v-model="edit.enabled" type="checkbox" class="mac-switch" /></div>
          </div>
          <div class="mac-form-label">風格說明</div>
          <textarea v-model="edit.instruction" class="mac-form-textarea" rows="4" placeholder="例：語氣溫暖、稱呼對方「您」，句子短，結尾提出下一步（約看屋、留電話）。" />
          <div class="mac-form-label">範例</div>
          <textarea v-model="edit.example" class="mac-form-textarea" rows="4" placeholder="選填：一則符合這個風格的訊息" />
        </div>
        <div class="mac-sheet-foot">
          <span class="mac-spacer" />
          <button class="mac-btn" @click="edit.show = false">取消</button>
          <button class="mac-btn mac-btn--primary" :disabled="edit.saving" @click="save">儲存</button>
        </div>
      </div>
    </v-dialog>
  </div>
</template>

<script setup>
import { reactive, ref, watch } from 'vue';
import { useLineAiAdmin } from './useLineAiAdmin';

const { settings, refresh, run } = useLineAiAdmin();
const list = ref([]);
watch(() => settings.value?.styles, v => { list.value = [...(v || [])]; }, { immediate: true });

const edit = reactive({ show: false, saving: false, id: null, name: '', instruction: '', example: '', enabled: true });

function openEdit(s) {
  Object.assign(edit, { show: true, saving: false, id: s?.id || null, name: s?.name || '', instruction: s?.instruction || '', example: s?.example || '', enabled: s ? s.enabled !== false : true });
}

async function save() {
  edit.saving = true;
  try {
    await run('saveStyle', { styleId: edit.id, style: { name: edit.name, instruction: edit.instruction, example: edit.example, enabled: edit.enabled } }, { success: '已儲存' });
    edit.show = false;
    await refresh();
  } catch { /* 已提示 */ } finally {
    edit.saving = false;
  }
}

async function remove(s) {
  if (!confirm(`刪除風格「${s.name}」？`)) return;
  try { await run('deleteStyle', { styleId: s.id }, { success: '已刪除' }); await refresh(); } catch { /* 已提示 */ }
}

async function move(i, dir) {
  const next = [...list.value];
  [next[i], next[i + dir]] = [next[i + dir], next[i]];
  list.value = next;
  try { await run('reorderStyles', { styleIds: next.map(s => s.id) }); } catch { await refresh(); }
}
</script>

<style scoped src="./adminPanel.css"></style>
<style scoped>
.lap-order { display: flex; flex-direction: column; }
.lap-styles .mac-form-row-sub { white-space: pre-wrap; overflow: visible; overflow-wrap: anywhere; }
</style>
