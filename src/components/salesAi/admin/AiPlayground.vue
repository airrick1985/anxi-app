<template>
  <div class="pg">
    <div class="text-subtitle-1 font-weight-bold">Playground</div>
    <div class="text-caption text-grey mb-3">以指定建案與使用者身份測試（能力矩陣照該使用者計算）。寫入工具只會產生草案、永不執行；不計配額、不受速率限制。</div>
    <v-row dense class="mb-2">
      <v-col cols="12" md="4"><v-select v-model="projectId" :items="projects" item-title="name" item-value="id" variant="outlined" density="compact" hide-details label="建案" @update:model-value="loadUsers"></v-select></v-col>
      <v-col cols="12" md="4"><v-select v-model="asUserKey" :items="users" :item-title="u => `${u.name}（${(u.roles || []).join('、') || '一般'}）`" item-value="userKey" variant="outlined" density="compact" hide-details label="以誰的身份" :loading="usersLoading"></v-select></v-col>
      <v-col cols="12" md="4"><v-select v-model="profileId" :items="[{ title: '（依建案／全域）', value: null }, ...profileItems]" variant="outlined" density="compact" hide-details label="Profile"></v-select></v-col>
    </v-row>

    <div class="pg__log">
      <div v-for="(m, i) in log" :key="i" class="pg__msg" :class="`pg__msg--${m.role}`">
        <div class="pg__bubble">
          <div v-if="m.text" class="pg__text">{{ m.text }}</div>
          <pre v-if="m.json" class="pg__json">{{ m.json }}</pre>
        </div>
      </div>
      <div v-if="!log.length" class="text-caption text-grey text-center py-6">選好建案與身份後輸入訊息測試</div>
    </div>
    <div class="d-flex ga-2 align-end mt-2">
      <v-textarea v-model="input" variant="outlined" density="compact" hide-details auto-grow rows="1" max-rows="4" placeholder="例：把 A-3 改小訂，配 B6-18，房價 3450" @keydown.enter.exact.prevent="send"></v-textarea>
      <v-btn color="primary" :loading="sending" :disabled="!projectId || !asUserKey || !input.trim()" @click="send">送出</v-btn>
      <v-btn variant="text" @click="log = []; history = []">清除</v-btn>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useAiAdmin } from './useAiAdmin';

const props = defineProps({ data: { type: Object, required: true } });
const { run } = useAiAdmin();
const projects = ref([]);
const users = ref([]);
const usersLoading = ref(false);
const projectId = ref(null);
const asUserKey = ref(null);
const profileId = ref(null);
const profileItems = computed(() => Object.entries(props.data.global.profiles || {}).map(([id, p]) => ({ title: `${p.label}（${p.model}）`, value: id })));
const input = ref('');
const sending = ref(false);
const log = ref([]);
let history = [];

onMounted(async () => { try { const r = await run('listProjects'); projects.value = r.projects || []; } catch { /* ignore */ } });
async function loadUsers() {
  users.value = []; asUserKey.value = null; usersLoading.value = true;
  try { const r = await run('listProjectUsers', { projectId: projectId.value }); users.value = r.users || []; } catch { /* ignore */ } finally { usersLoading.value = false; }
}
async function send() {
  const t = input.value.trim(); if (!t || sending.value) return;
  input.value = ''; sending.value = true;
  log.value.push({ role: 'user', text: t });
  try {
    const r = await run('playground', { projectId: projectId.value, asUserKey: asUserKey.value, profileId: profileId.value, message: t, history });
    history.push({ role: 'user', text: t });
    if (r.reply) { log.value.push({ role: 'model', text: r.reply }); history.push({ role: 'model', text: r.reply }); }
    if (r.question) log.value.push({ role: 'model', text: '【提問】', json: JSON.stringify(r.question.questions, null, 2) });
    if (r.proposal) log.value.push({ role: 'model', text: `【草案（不執行）】${r.proposal.summary || ''}`, json: JSON.stringify({ diff: r.proposal.diff, missing: r.proposal.missing, warnings: r.proposal.warnings, blockers: r.proposal.blockers }, null, 2) });
    log.value.push({ role: 'meta', text: `身份：${r.asUser}｜能力：${(r.capabilities || []).join('、')}｜tokens ${r.usage?.totalTokens || 0}｜工具：${(r.toolTrace || []).map(x => `${x.name}${x.ok ? '' : '✗'}`).join(' → ') || '無'}` });
  } catch (e) {
    log.value.push({ role: 'meta', text: `錯誤：${e.message}` });
  } finally { sending.value = false; }
}
</script>

<style scoped>
.pg__log { min-height: 260px; max-height: 55vh; overflow-y: auto; background: #F6F8FC; border: 1px solid #E3E8F0; border-radius: 10px; padding: 10px; display: flex; flex-direction: column; gap: 8px; }
.pg__msg { display: flex; }
.pg__msg--user { justify-content: flex-end; }
.pg__msg--meta .pg__bubble { background: transparent; color: #78909C; font-size: 11.5px; box-shadow: none; }
.pg__bubble { max-width: 90%; background: #fff; border-radius: 12px; padding: 8px 12px; font-size: 13px; box-shadow: 0 1px 2px rgba(16, 32, 58, 0.08); }
.pg__msg--user .pg__bubble { background: #2F6BFF; color: #fff; }
.pg__text { white-space: pre-wrap; }
.pg__json { font-size: 11.5px; white-space: pre-wrap; margin: 6px 0 0; color: #37474F; }
</style>
