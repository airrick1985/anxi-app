<template>
  <div>
    <div class="lap-bar">
      <div class="lap-title">對話</div>
      <span class="lap-sub">{{ shown.length }} 個</span>
      <v-spacer />
      <button class="mac-btn mac-btn--sm" :disabled="loading" @click="load"><v-icon size="15">mdi-refresh</v-icon>重新整理</button>
    </div>
    <div class="lap-filter">
      <v-text-field v-model="q" placeholder="搜尋" prepend-inner-icon="mdi-magnify" variant="solo" flat density="compact" hide-details clearable class="mac-vfield mac-vfield--search" />
      <div class="mac-form-seg">
        <button v-for="f in FILTERS" :key="f.key" type="button" class="mac-form-seg-btn" :class="{ 'is-active': type === f.key }" @click="type = f.key">{{ f.label }}</button>
      </div>
    </div>

    <v-table density="compact" class="mac-table">
      <thead><tr><th>對話</th><th>成員</th><th>Agent</th><th>可看的人</th><th class="text-right"></th></tr></thead>
      <tbody>
        <tr v-if="loading && !list.length"><td colspan="5" class="text-center text-grey py-4">載入中…</td></tr>
        <tr v-else-if="!shown.length"><td colspan="5" class="text-center text-grey py-4">沒有對話</td></tr>
        <tr v-for="c in shown" :key="c.id">
          <td>
            <div class="font-weight-medium">{{ c.name }}</div>
            <div class="lap-sub">{{ [TYPE_LABEL[c.type], c.channelName, !c.active && (c.type === 'user' ? '已封鎖' : '已離開')].filter(Boolean).join('・') }}</div>
          </td>
          <td class="text-no-wrap">{{ c.type === 'user' ? '—' : `${c.memberCount} 人（同仁 ${c.staffCount}）` }}</td>
          <td style="min-width: 160px">
            <select :value="c.agentId || ''" class="mac-form-input mac-form-select lap-agent" @change="e => setAgent(c, e.target.value)">
              <option value="">官方帳號預設</option>
              <option v-for="a in settings.agents" :key="a.id" :value="a.id">{{ a.name }}</option>
            </select>
          </td>
          <td>
            <div v-if="c.type === 'user'" class="lap-sub">負責：{{ userName(c.assignedKey) || '待認領' }}</div>
            <div class="lap-sub">{{ c.type === 'user' ? '' : '群組成員＋' }}指定 {{ c.manualViewerKeys.length }} 人</div>
          </td>
          <td class="text-right text-no-wrap">
            <button v-if="c.type !== 'user'" class="mac-btn mac-btn--sm" :disabled="syncing === c.id" @click="sync(c)">同步成員</button>
            <button class="mac-btn mac-btn--sm ml-1" @click="openPeople(c)">設定</button>
          </td>
        </tr>
      </tbody>
    </v-table>

    <v-dialog v-model="people.show" max-width="520" content-class="mac-dialog-fit">
      <div class="mac-sheet">
        <div class="mac-sheet-head">{{ people.conv?.name }}<button class="mac-sheet-close" @click="people.show = false"><v-icon size="18">mdi-close</v-icon></button></div>
        <div class="mac-sheet-section">
          <template v-if="people.conv?.type === 'user'">
            <div class="mac-sheet-label">負責人</div>
            <v-autocomplete
              v-model="people.assignedKey"
              :items="users"
              item-title="name"
              item-value="userKey"
              placeholder="待認領"
              variant="solo"
              flat
              density="compact"
              hide-details
              clearable
              class="mac-vfield mb-4"
              :menu-props="{ contentClass: 'mac-menu' }"
            />
          </template>
          <div class="mac-sheet-label">另外指定可看的人</div>
          <v-autocomplete
            v-model="people.viewers"
            :items="users"
            item-title="name"
            item-value="userKey"
            multiple
            chips
            closable-chips
            variant="solo"
            flat
            density="compact"
            hide-details
            class="mac-vfield"
            :menu-props="{ contentClass: 'mac-menu' }"
          />
        </div>
        <div class="mac-sheet-foot">
          <span class="mac-spacer" />
          <button class="mac-btn" @click="people.show = false">取消</button>
          <button class="mac-btn mac-btn--primary" :disabled="people.saving" @click="savePeople">儲存</button>
        </div>
      </div>
    </v-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue';
import { useToast } from 'vue-toastification';
import { useLineAiAdmin } from './useLineAiAdmin';
import { TYPE_LABEL } from '../useLineAi';

const { settings, run, users, loadUsers } = useLineAiAdmin();
const toast = useToast();

const FILTERS = [{ key: 'all', label: '全部' }, { key: 'group', label: '群組' }, { key: 'user', label: '一對一' }];
const list = ref([]);
const loading = ref(false);
const syncing = ref(null);
const q = ref('');
const type = ref('all');
const people = reactive({ show: false, saving: false, conv: null, viewers: [], assignedKey: null });

const shown = computed(() => {
  const term = (q.value || '').trim().toLowerCase();
  return list.value.filter(c => {
    if (type.value === 'group' && c.type === 'user') return false;
    if (type.value === 'user' && c.type !== 'user') return false;
    return !term || [c.name, c.lineName, c.channelName].some(v => String(v || '').toLowerCase().includes(term));
  });
});

const userName = key => users.value.find(u => u.userKey === key)?.name || key || '';

async function load() {
  loading.value = true;
  try { list.value = (await run('listConversations')).conversations || []; } catch { /* 已提示 */ } finally { loading.value = false; }
}

async function setAgent(c, agentId) {
  try {
    await run('updateConversation', { conversationId: c.id, agentId: agentId || null });
    c.agentId = agentId || null;
    toast.success('已更新');
  } catch { await load(); }
}

async function sync(c) {
  syncing.value = c.id;
  try {
    const r = await run('syncMembers', { conversationId: c.id });
    toast[r.ok ? 'success' : 'info'](r.ok ? `已同步 ${r.count} 位成員` : '未認證的官方帳號無法取得成員清單');
    await load();
  } catch { /* 已提示 */ } finally {
    syncing.value = null;
  }
}

async function openPeople(c) {
  await loadUsers();
  Object.assign(people, { show: true, saving: false, conv: c, viewers: [...c.manualViewerKeys], assignedKey: c.assignedKey });
}

async function savePeople() {
  people.saving = true;
  try {
    const payload = { conversationId: people.conv.id, manualViewerKeys: people.viewers };
    if (people.conv.type === 'user') payload.assignedKey = people.assignedKey || null;
    await run('updateConversation', payload, { success: '已儲存' });
    people.show = false;
    await load();
  } catch { /* 已提示 */ } finally {
    people.saving = false;
  }
}

onMounted(() => { load(); loadUsers(); });
</script>

<style scoped src="./adminPanel.css"></style>
<style scoped>
.lap-filter { display: flex; align-items: center; flex-wrap: wrap; gap: 8px; margin-bottom: 10px; }
.lap-filter > .mac-vfield { flex: 1 1 240px; max-width: 360px; }
.lap-agent { width: 100%; }
</style>
