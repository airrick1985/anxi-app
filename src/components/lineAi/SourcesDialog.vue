<template>
  <v-dialog :model-value="modelValue" max-width="520" content-class="mac-dialog-fit" @update:model-value="v => $emit('update:modelValue', v)">
    <div class="mac-sheet la-src">
      <div class="mac-sheet-head">
        <v-icon size="18">mdi-folder-key-outline</v-icon>我的資料
        <button class="mac-sheet-close" @click="$emit('update:modelValue', false)"><v-icon size="18">mdi-close</v-icon></button>
      </div>

      <div class="mac-sheet-section">
        <div class="mac-sheet-label">Google Drive</div>
        <div v-if="serviceAccountEmail" class="la-src__email">
          <span>共用給</span>
          <code>{{ serviceAccountEmail }}</code>
          <button class="mac-icon-btn" title="複製" @click="copy(serviceAccountEmail)"><v-icon size="15">mdi-content-copy</v-icon></button>
        </div>
        <div class="la-src__add">
          <input v-model="link" class="mac-form-input" placeholder="資料夾或檔案連結" />
          <button class="mac-btn mac-btn--sm mac-btn--primary" :disabled="adding || !link.trim()" @click="addDrive">新增</button>
        </div>
      </div>

      <div class="mac-sheet-section">
        <div class="mac-sheet-label">Dropbox</div>
        <div v-if="!dropbox.available" class="mac-sheet-note">尚未開放</div>
        <div v-else class="la-src__dbx">
          <span>{{ dropbox.connected ? '已連結' : '未連結' }}</span>
          <v-spacer />
          <button v-if="dropbox.connected" class="mac-btn mac-btn--sm mac-btn--danger" :disabled="busy" @click="disconnect">中斷連結</button>
          <button v-else class="mac-btn mac-btn--sm" :disabled="busy" @click="connect"><v-icon size="15">mdi-dropbox</v-icon>連結 Dropbox</button>
        </div>
      </div>

      <div class="mac-sheet-section">
        <div class="mac-sheet-label">已開放</div>
        <div v-if="loading" class="mac-sheet-note">載入中…</div>
        <div v-else-if="!list.length" class="mac-sheet-note">尚無</div>
        <div v-for="s in list" :key="s.id" class="la-src__row">
          <v-icon size="18">{{ s.type === 'dropbox' ? 'mdi-dropbox' : 'mdi-google-drive' }}</v-icon>
          <span class="la-src__name">{{ s.name }}</span>
          <button v-if="s.type === 'drive'" class="mac-icon-btn mac-icon-btn--danger" title="移除" @click="remove(s)"><v-icon size="16">mdi-trash-can-outline</v-icon></button>
        </div>
      </div>
    </div>
  </v-dialog>
</template>

<script setup>
import { ref, watch } from 'vue';
import { useToast } from 'vue-toastification';
import { lineAiCall, errorText } from './useLineAi';

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  serviceAccountEmail: { type: String, default: '' },
});
const emit = defineEmits(['update:modelValue', 'changed']);
const toast = useToast();

const list = ref([]);
const dropbox = ref({ available: false, connected: false });
const loading = ref(false);
const adding = ref(false);
const busy = ref(false);
const link = ref('');

async function load() {
  loading.value = true;
  try {
    const r = await lineAiCall('listSources');
    list.value = r.sources || [];
    dropbox.value = r.dropbox || dropbox.value;
  } catch (e) {
    toast.error(errorText(e));
  } finally {
    loading.value = false;
  }
}

watch(() => props.modelValue, open => { if (open) load(); }, { immediate: true });

async function addDrive() {
  adding.value = true;
  try {
    await lineAiCall('addDriveSource', { link: link.value.trim() });
    link.value = '';
    toast.success('已新增');
    await load();
    emit('changed');
  } catch (e) {
    toast.error(errorText(e));
  } finally {
    adding.value = false;
  }
}

async function remove(s) {
  try {
    await lineAiCall('removeSource', { sourceId: s.id });
    await load();
    emit('changed');
  } catch (e) {
    toast.error(errorText(e));
  }
}

async function connect() {
  busy.value = true;
  try {
    const r = await lineAiCall('dropboxAuthUrl');
    window.location.href = r.url;
  } catch (e) {
    toast.error(errorText(e));
    busy.value = false;
  }
}

async function disconnect() {
  busy.value = true;
  try {
    await lineAiCall('dropboxDisconnect');
    await load();
    emit('changed');
  } catch (e) {
    toast.error(errorText(e));
  } finally {
    busy.value = false;
  }
}

async function copy(text) {
  try { await navigator.clipboard.writeText(text); toast.success('已複製'); } catch { /* ignore */ }
}
</script>

<style scoped>
.la-src { background: #fff; }
.la-src__email { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; margin-bottom: 8px; font-size: 12.5px; color: #6e6e73; }
.la-src__email code { padding: 2px 6px; border-radius: 5px; background: #f2f2f5; color: #1d1d1f; font-size: 12px; overflow-wrap: anywhere; }
.la-src__add { display: flex; gap: 6px; }
.la-src__dbx { display: flex; align-items: center; gap: 8px; font-size: 13px; }
.la-src__row { display: flex; align-items: center; gap: 8px; padding: 6px 0; font-size: 13.5px; }
.la-src__row + .la-src__row { border-top: 1px solid #f0f0f3; }
.la-src__name { flex: 1 1 auto; min-width: 0; overflow-wrap: anywhere; }
</style>
