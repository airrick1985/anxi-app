<template>
  <div>
    <div class="lap-bar">
      <div class="lap-title">一般設定</div>
      <v-spacer />
      <button class="mac-btn mac-btn--sm mac-btn--primary" :disabled="saving" @click="save">儲存</button>
    </div>
    <div class="mac-form lap-form lap-flat">
      <div class="mac-form-label">LINE 內入口（LIFF）</div>
      <div class="mac-form-group">
        <div class="mac-form-row"><span class="mac-form-row-label">LIFF ID</span><input v-model="g.liffId" class="mac-form-input" placeholder="2008257338-xxxxxxxx" /></div>
        <div class="mac-form-row"><span class="mac-form-row-label">LINE Login Channel</span><input v-model="g.liffChannelId" class="mac-form-input" /></div>
        <div class="mac-form-row"><span class="mac-form-row-label">系統網址</span><input v-model="g.appUrl" class="mac-form-input" /></div>
        <div class="mac-form-row"><span class="mac-form-row-label">Endpoint</span><code class="lap-code">{{ endpoint }}</code></div>
      </div>

      <div class="mac-form-label">來訊通知</div>
      <div class="mac-form-group">
        <div class="mac-form-row">
          <span class="mac-form-row-label">通知帳號</span>
          <select v-model="g.notifyChannelId" class="mac-form-input mac-form-select">
            <option :value="null">系統預設官方帳號</option>
            <option v-for="c in settings.channels" :key="c.id" :value="c.id">{{ c.name }}</option>
          </select>
        </div>
        <div class="mac-form-row"><span class="mac-form-row-label">合併等待</span><span class="lap-inline"><input v-model.number="g.notifyDelayMinutes" type="number" min="0" max="60" class="mac-form-input lap-num" />分鐘</span></div>
      </div>

      <div class="mac-form-label">待認領的一對一對話</div>
      <v-autocomplete
        v-model="g.claimerKeys"
        :items="users"
        item-title="name"
        item-value="userKey"
        multiple
        chips
        closable-chips
        placeholder="可認領的人"
        variant="solo"
        flat
        density="compact"
        hide-details
        class="mac-vfield"
        :menu-props="{ contentClass: 'mac-menu' }"
      />

      <div class="mac-form-label">記憶與限制</div>
      <div class="mac-form-group">
        <div class="mac-form-row"><span class="mac-form-row-label">原文保留</span><span class="lap-inline"><input v-model.number="g.retentionMonths" type="number" min="1" max="120" class="mac-form-input lap-num" />個月</span></div>
        <div class="mac-form-row"><span class="mac-form-row-label">整理記憶</span><span class="lap-inline">每<input v-model.number="g.summaryEvery" type="number" min="5" max="200" class="mac-form-input lap-num" />則</span></div>
        <div class="mac-form-row"><span class="mac-form-row-label">撰稿參考</span><span class="lap-inline">最近<input v-model.number="g.historyMessages" type="number" min="5" max="80" class="mac-form-input lap-num" />則</span></div>
        <div class="mac-form-row"><span class="mac-form-row-label">使用頻率</span><span class="lap-inline">每人每分鐘<input v-model.number="g.perUserPerMinute" type="number" min="1" max="120" class="mac-form-input lap-num" />次</span></div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { reactive, ref, computed, watch, onMounted } from 'vue';
import { useLineAiAdmin } from './useLineAiAdmin';

const { settings, refresh, run, users, loadUsers } = useLineAiAdmin();
const saving = ref(false);
const g = reactive({});

watch(() => settings.value?.global, v => { if (v) Object.assign(g, JSON.parse(JSON.stringify(v))); }, { immediate: true });

const endpoint = computed(() => `${String(g.appUrl || '').replace(/\/+$/, '')}/?liff_path=line-ai-entry`);

async function save() {
  saving.value = true;
  try {
    await run('saveGlobal', { global: { ...g } }, { success: '已儲存' });
    await refresh();
  } catch { /* 已提示 */ } finally {
    saving.value = false;
  }
}

onMounted(loadUsers);
</script>

<style scoped src="./adminPanel.css"></style>
<style scoped>
.lap-flat { padding: 0; background: transparent; }
.lap-num { width: 80px; flex: 0 0 auto; max-width: 80px !important; }
.lap-inline { display: inline-flex; align-items: center; gap: 6px; margin-left: auto; color: #6e6e73; font-size: 12.5px; white-space: nowrap; }
.lap-code { font-size: 12px; overflow-wrap: anywhere; }
</style>
