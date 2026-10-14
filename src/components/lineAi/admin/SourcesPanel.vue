<template>
  <div>
    <div class="lap-bar"><div class="lap-title">雲端資料</div></div>

    <div class="mac-form-label">Google Drive 服務帳號</div>
    <div class="lap-copy">
      <code>{{ settings.serviceAccountEmail || '讀取失敗' }}</code>
      <button v-if="settings.serviceAccountEmail" class="mac-icon-btn" title="複製" @click="copy(settings.serviceAccountEmail)"><v-icon size="15">mdi-content-copy</v-icon></button>
    </div>

    <div class="mac-form-label">共用資料</div>
    <div class="mac-form-group">
      <div v-if="!settings.sharedSources.length" class="lap-empty">尚無</div>
      <div v-for="s in settings.sharedSources" :key="s.id" class="mac-form-row">
        <v-icon size="18">{{ s.type === 'dropbox' ? 'mdi-dropbox' : 'mdi-google-drive' }}</v-icon>
        <div class="mac-form-row-main"><div class="mac-form-row-title">{{ s.name }}</div></div>
        <button class="mac-icon-btn mac-icon-btn--danger" title="移除" @click="removeShared(s)"><v-icon size="16">mdi-trash-can-outline</v-icon></button>
      </div>
      <div class="mac-form-pad lap-add">
        <input v-model="driveLink" class="mac-form-input" placeholder="Google Drive 資料夾連結" />
        <input v-model="driveName" class="mac-form-input lap-name" placeholder="名稱（選填）" />
        <button class="mac-btn mac-btn--sm mac-btn--primary" :disabled="adding || !driveLink.trim()" @click="addDrive">新增</button>
      </div>
    </div>

    <div class="mac-form-label">Dropbox 應用程式</div>
    <div class="mac-form-group">
      <div class="mac-form-row">
        <span class="mac-form-row-label">狀態</span>
        <span class="mac-tag" :class="settings.dropboxReady ? 'lap-ok' : ''">{{ settings.dropboxReady ? '已設定' : '未設定' }}</span>
      </div>
      <div class="mac-form-row">
        <span class="mac-form-row-label">Redirect URI</span>
        <code class="lap-code">{{ settings.dropboxRedirectUri }}</code>
        <button class="mac-icon-btn" title="複製" @click="copy(settings.dropboxRedirectUri)"><v-icon size="15">mdi-content-copy</v-icon></button>
      </div>
      <div class="mac-form-row"><span class="mac-form-row-label">App key</span><input v-model="dbx.key" type="password" autocomplete="off" class="mac-form-input" :placeholder="settings.dropboxReady ? '已設定，留空不變' : ''" /></div>
      <div class="mac-form-row"><span class="mac-form-row-label">App secret</span><input v-model="dbx.secret" type="password" autocomplete="off" class="mac-form-input" :placeholder="settings.dropboxReady ? '已設定，留空不變' : ''" /></div>
      <div class="mac-form-pad lap-right">
        <button class="mac-btn mac-btn--sm mac-btn--primary" :disabled="dbx.saving || (!dbx.key && !dbx.secret)" @click="saveDropbox">儲存</button>
      </div>
    </div>

    <div class="mac-form-label">我的 Dropbox</div>
    <div class="mac-form-group">
      <div v-if="!mine.dropbox.connected" class="mac-form-row">
        <div class="mac-form-row-main">未連結</div>
        <button class="mac-btn mac-btn--sm" :disabled="!settings.dropboxReady" @click="connect"><v-icon size="15">mdi-dropbox</v-icon>連結</button>
      </div>
      <div v-for="s in mine.sources.filter(x => x.type === 'dropbox')" :key="s.id" class="mac-form-row">
        <v-icon size="18">mdi-dropbox</v-icon>
        <div class="mac-form-row-main"><div class="mac-form-row-title">{{ s.name }}</div></div>
        <span class="lap-sub">共用給 Agent</span>
        <input type="checkbox" class="mac-switch" :checked="s.shared" @change="e => setShared(s, e.target.checked)" />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';
import { useToast } from 'vue-toastification';
import { useLineAiAdmin } from './useLineAiAdmin';
import { lineAiCall, errorText } from '../useLineAi';

const { settings, refresh, run } = useLineAiAdmin();
const toast = useToast();

const driveLink = ref('');
const driveName = ref('');
const adding = ref(false);
const dbx = reactive({ key: '', secret: '', saving: false });
const mine = reactive({ sources: [], dropbox: { available: false, connected: false } });

async function loadMine() {
  try {
    const r = await run('listMySources', {}, { silent: true });
    mine.sources = r.sources || [];
    mine.dropbox = r.dropbox || mine.dropbox;
  } catch { /* ignore */ }
}

async function addDrive() {
  adding.value = true;
  try {
    await run('addSharedDrive', { link: driveLink.value.trim(), name: driveName.value.trim() }, { success: '已新增' });
    driveLink.value = '';
    driveName.value = '';
    await refresh();
  } catch { /* 已提示 */ } finally {
    adding.value = false;
  }
}

async function removeShared(s) {
  if (!confirm(`移除「${s.name}」？`)) return;
  try { await run('removeSharedSource', { sourceId: s.id }, { success: '已移除' }); await refresh(); await loadMine(); } catch { /* 已提示 */ }
}

async function saveDropbox() {
  dbx.saving = true;
  try {
    if (dbx.key) await run('setSecret', { secretName: 'LINEAI_DROPBOX_APP_KEY', value: dbx.key });
    if (dbx.secret) await run('setSecret', { secretName: 'LINEAI_DROPBOX_APP_SECRET', value: dbx.secret });
    toast.success('已儲存');
    dbx.key = '';
    dbx.secret = '';
    await refresh();
  } catch { /* 已提示 */ } finally {
    dbx.saving = false;
  }
}

async function connect() {
  try {
    const r = await lineAiCall('dropboxAuthUrl');
    window.location.href = r.url;
  } catch (e) {
    toast.error(errorText(e));
  }
}

async function setShared(s, shared) {
  try { await run('setSourceShared', { sourceId: s.id, shared }); await refresh(); await loadMine(); } catch { /* 已提示 */ }
}

async function copy(text) {
  try { await navigator.clipboard.writeText(text); toast.success('已複製'); } catch { /* ignore */ }
}

onMounted(loadMine);
</script>

<style scoped src="./adminPanel.css"></style>
<style scoped>
.lap-add { display: flex; flex-wrap: wrap; gap: 6px; }
.lap-add > .mac-form-input { flex: 1 1 220px; }
.lap-add > .lap-name { flex: 0 1 160px; }
.lap-code { flex: 1 1 auto; min-width: 0; font-size: 12px; overflow-wrap: anywhere; }
.lap-right { display: flex; justify-content: flex-end; }
</style>
