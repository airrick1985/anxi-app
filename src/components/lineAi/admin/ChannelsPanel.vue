<template>
  <div>
    <div class="lap-bar">
      <div class="lap-title">官方帳號</div>
      <v-spacer />
      <button class="mac-btn mac-btn--sm mac-btn--primary" @click="openEdit(null)"><v-icon size="15">mdi-plus</v-icon>新增</button>
    </div>
    <div class="lap-copy">
      <span class="lap-copy__label">Webhook URL</span>
      <code>{{ settings.webhookUrl }}</code>
      <button class="mac-icon-btn" title="複製" @click="copy(settings.webhookUrl)"><v-icon size="15">mdi-content-copy</v-icon></button>
    </div>

    <v-table density="compact" class="mac-table">
      <thead><tr><th>名稱</th><th>預設 Agent</th><th>金鑰</th><th>狀態</th><th class="text-right"></th></tr></thead>
      <tbody>
        <tr v-if="!settings.channels.length"><td colspan="5" class="text-center text-grey py-4">尚未新增</td></tr>
        <tr v-for="c in settings.channels" :key="c.id">
          <td>
            <div class="font-weight-medium">{{ c.name }}</div>
            <div class="lap-sub">{{ [c.displayName, c.basicId].filter(Boolean).join('・') }}</div>
          </td>
          <td>{{ agentName(c.defaultAgentId) || '—' }}</td>
          <td>
            <span class="mac-tag" :class="c.hasSecret ? 'lap-ok' : 'lap-bad'">Secret</span>
            <span class="mac-tag ml-1" :class="c.hasToken ? 'lap-ok' : 'lap-bad'">Token</span>
          </td>
          <td><span class="mac-tag" :class="c.enabled ? 'lap-ok' : ''">{{ c.enabled ? '啟用' : '停用' }}</span></td>
          <td class="text-right text-no-wrap">
            <button class="mac-btn mac-btn--sm" @click="openStatus(c)">連線</button>
            <button class="mac-btn mac-btn--sm ml-1" @click="openEdit(c)">編輯</button>
            <button class="mac-icon-btn mac-icon-btn--danger ml-1" title="刪除" @click="remove(c)"><v-icon size="16">mdi-trash-can-outline</v-icon></button>
          </td>
        </tr>
      </tbody>
    </v-table>

    <!-- 編輯 -->
    <v-dialog v-model="edit.show" max-width="560" content-class="mac-dialog-fit">
      <div class="mac-sheet">
        <div class="mac-sheet-head">{{ edit.id ? '編輯官方帳號' : '新增官方帳號' }}<button class="mac-sheet-close" @click="edit.show = false"><v-icon size="18">mdi-close</v-icon></button></div>
        <div class="mac-form lap-form">
          <div class="mac-form-group">
            <div class="mac-form-row"><span class="mac-form-row-label">名稱</span><input v-model="edit.name" class="mac-form-input" placeholder="例：安熙客服" /></div>
            <div class="mac-form-row"><span class="mac-form-row-label">Channel Secret</span><input v-model="edit.channelSecret" type="password" autocomplete="off" class="mac-form-input" :placeholder="edit.hasSecret ? '已設定，留空不變' : ''" /></div>
            <div class="mac-form-row"><span class="mac-form-row-label">Access Token</span><input v-model="edit.accessToken" type="password" autocomplete="off" class="mac-form-input" :placeholder="edit.hasToken ? '已設定，留空不變' : ''" /></div>
            <div class="mac-form-row">
              <span class="mac-form-row-label">預設 Agent</span>
              <select v-model="edit.defaultAgentId" class="mac-form-input mac-form-select">
                <option :value="null">不指定</option>
                <option v-for="a in settings.agents" :key="a.id" :value="a.id">{{ a.name }}</option>
              </select>
            </div>
            <div class="mac-form-row"><span class="mac-form-row-label">啟用</span><span class="mac-spacer" style="flex:1" /><input v-model="edit.enabled" type="checkbox" class="mac-switch" /></div>
          </div>
          <div class="mac-form-label">入群告知訊息</div>
          <textarea v-model="edit.joinMessage" class="mac-form-textarea" rows="3" placeholder="官方帳號被邀進群組時自動送出；留空不送" />
        </div>
        <div class="mac-sheet-foot">
          <span class="mac-spacer" />
          <button class="mac-btn" @click="edit.show = false">取消</button>
          <button class="mac-btn mac-btn--primary" :disabled="edit.saving" @click="save">儲存</button>
        </div>
      </div>
    </v-dialog>

    <!-- 連線狀態 -->
    <v-dialog v-model="status.show" max-width="560" content-class="mac-dialog-fit">
      <div class="mac-sheet">
        <div class="mac-sheet-head">{{ status.channel?.name }}<button class="mac-sheet-close" @click="status.show = false"><v-icon size="18">mdi-close</v-icon></button></div>
        <div class="mac-sheet-section">
          <div v-if="status.loading" class="mac-sheet-note">讀取中…</div>
          <template v-else-if="status.data">
            <div v-if="!status.data.ok" class="mac-callout mac-callout--error"><v-icon size="18">mdi-alert-circle-outline</v-icon>{{ status.data.message }}</div>
            <template v-else>
              <div class="mac-sheet-label">Webhook</div>
              <div class="lap-kv"><span>目前</span><code>{{ status.data.webhook?.endpoint || status.data.webhook?.error || '未設定' }}</code></div>
              <div class="lap-kv"><span>啟用</span><span>{{ status.data.webhook?.active ? '是' : '否' }}</span></div>
              <div v-if="webhookMismatch" class="mac-callout mac-callout--warning mt-2">
                <v-icon size="18">mdi-alert-outline</v-icon>目前指向其他網址，改為本系統後原本的串接會停止接收訊息
              </div>
              <div v-if="status.test" class="mac-callout mt-2" :class="status.test.success ? '' : 'mac-callout--error'">
                <v-icon size="18">{{ status.test.success ? 'mdi-check-circle-outline' : 'mdi-alert-circle-outline' }}</v-icon>
                {{ status.test.success ? '測試成功' : `測試失敗：${status.test.reason || status.test.detail || status.test.statusCode}` }}
              </div>
              <div class="mac-sheet-label mt-4">本月訊息額度</div>
              <div class="lap-kv"><span>已用／上限</span><span>{{ quotaText }}</span></div>
            </template>
          </template>
        </div>
        <div class="mac-sheet-foot">
          <span class="mac-spacer" />
          <button v-if="status.data?.ok" class="mac-btn mac-btn--primary" :disabled="status.setting" @click="setWebhook">設定 Webhook 並測試</button>
        </div>
      </div>
    </v-dialog>
  </div>
</template>

<script setup>
import { reactive, computed } from 'vue';
import { useToast } from 'vue-toastification';
import { useLineAiAdmin } from './useLineAiAdmin';

const { settings, refresh, run } = useLineAiAdmin();
const toast = useToast();

const edit = reactive({ show: false, saving: false, id: null, name: '', channelSecret: '', accessToken: '', defaultAgentId: null, joinMessage: '', enabled: true, hasSecret: false, hasToken: false });
const status = reactive({ show: false, loading: false, setting: false, channel: null, data: null, test: null });

const agentName = id => settings.value.agents.find(a => a.id === id)?.name || '';
const webhookMismatch = computed(() => {
  const ep = status.data?.webhook?.endpoint;
  return !!ep && ep !== status.data.expectedWebhook;
});
const quotaText = computed(() => {
  const q = status.data?.quota;
  if (!q || q.error) return q?.error || '—';
  return `${q.used ?? '—'}／${q.type === 'none' ? '無上限' : q.limit ?? '—'}`;
});

function openEdit(c) {
  Object.assign(edit, {
    show: true, saving: false, id: c?.id || null, name: c?.name || '', channelSecret: '', accessToken: '',
    defaultAgentId: c?.defaultAgentId || null, joinMessage: c?.joinMessage || '', enabled: c ? c.enabled !== false : true,
    hasSecret: !!c?.hasSecret, hasToken: !!c?.hasToken,
  });
}

async function save() {
  if (!edit.id && (!edit.channelSecret || !edit.accessToken)) { toast.error('請輸入 Channel Secret 與 Access Token'); return; }
  edit.saving = true;
  try {
    await run('saveChannel', {
      channelId: edit.id,
      channel: { name: edit.name, defaultAgentId: edit.defaultAgentId, joinMessage: edit.joinMessage, enabled: edit.enabled },
      channelSecret: edit.channelSecret || undefined,
      accessToken: edit.accessToken || undefined,
    }, { success: '已儲存' });
    edit.show = false;
    await refresh();
  } catch { /* 已提示 */ } finally {
    edit.saving = false;
  }
}

async function remove(c) {
  if (!confirm(`刪除「${c.name}」？對話紀錄會保留，但不再接收新訊息。`)) return;
  try { await run('deleteChannel', { channelId: c.id }, { success: '已刪除' }); await refresh(); } catch { /* 已提示 */ }
}

async function openStatus(c) {
  Object.assign(status, { show: true, loading: true, channel: c, data: null, test: null });
  try { status.data = await run('channelStatus', { channelId: c.id }); } catch { status.show = false; } finally { status.loading = false; }
}

async function setWebhook() {
  status.setting = true;
  try {
    const r = await run('setChannelWebhook', { channelId: status.channel.id });
    status.test = r.test || { success: true };
    status.data = await run('channelStatus', { channelId: status.channel.id });
  } catch { /* 已提示 */ } finally {
    status.setting = false;
  }
}

async function copy(text) {
  try { await navigator.clipboard.writeText(text); toast.success('已複製'); } catch { /* ignore */ }
}
</script>

<style scoped src="./adminPanel.css"></style>
