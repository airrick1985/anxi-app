<template>
  <v-container fluid class="ai-admin">
    <div class="d-flex align-center flex-wrap ga-2 mb-3">
      <AiOrbIcon :size="36" state="idle" />
      <div>
        <h1 class="text-h5 mb-0">AI 助理管理</h1>
        <div class="text-caption text-grey">模型供應商、API 金鑰、提示詞、功能開關、建案覆蓋、用量與稽核（僅超級管理員）</div>
      </div>
      <v-spacer></v-spacer>
      <v-btn size="small" variant="text" prepend-icon="mdi-refresh" :loading="loading" @click="refresh">重新整理</v-btn>
    </div>

    <v-alert v-if="alerts.length" type="warning" variant="tonal" density="compact" class="mb-3">
      最近有 {{ alerts.length }} 筆 AI 服務告警（例如金鑰無效）：{{ alerts[0].message }}
    </v-alert>

    <div class="ai-admin__layout" :class="{ 'ai-admin__layout--stack': smAndDown }">
      <nav class="ai-admin__nav">
        <v-tabs v-model="tab" :direction="smAndDown ? 'horizontal' : 'vertical'" color="primary" density="compact" :show-arrows="smAndDown">
          <v-tab v-for="t in tabs" :key="t.key" :value="t.key" class="justify-start"><v-icon start size="18">{{ t.icon }}</v-icon>{{ t.label }}</v-tab>
        </v-tabs>
      </nav>
      <v-card class="ai-admin__content pa-4" elevation="1">
        <v-skeleton-loader v-if="!settings" type="article, table"></v-skeleton-loader>
        <template v-else>
          <ModelProfileEditor v-if="tab === 'models'" :data="settings" @changed="refresh" />
          <SecretManager v-else-if="tab === 'secrets'" :data="settings" @changed="refresh" />
          <PromptEditor v-else-if="tab === 'prompt'" :data="settings" @changed="refresh" />
          <ToolToggleTable v-else-if="tab === 'tools'" :data="settings" @changed="refresh" />
          <ProjectOverrides v-else-if="tab === 'projects'" :data="settings" />
          <AiUsageChart v-else-if="tab === 'usage'" />
          <AiPlayground v-else-if="tab === 'playground'" :data="settings" />
          <div v-else-if="tab === 'logs'">
            <div class="d-flex align-center mb-2">
              <div class="text-subtitle-1 font-weight-bold">管理操作紀錄</div>
              <v-spacer></v-spacer>
              <v-btn size="small" variant="text" prepend-icon="mdi-refresh" @click="loadLogs">重新整理</v-btn>
            </div>
            <v-table density="compact">
              <thead><tr><th>時間</th><th>操作</th><th>操作者</th><th>內容</th></tr></thead>
              <tbody>
                <tr v-if="!adminLogs.length"><td colspan="4" class="text-center text-grey py-3">尚無紀錄</td></tr>
                <tr v-for="l in adminLogs" :key="l.id">
                  <td class="text-caption text-no-wrap">{{ l.createdAt ? new Date(l.createdAt).toLocaleString('zh-TW', { timeZone: 'Asia/Taipei' }) : '' }}</td>
                  <td><code>{{ l.action }}</code></td>
                  <td>{{ l.userName }}</td>
                  <td class="text-caption"><span class="detail">{{ JSON.stringify(l.detail) }}</span></td>
                </tr>
              </tbody>
            </v-table>
            <div class="text-subtitle-1 font-weight-bold mt-5 mb-2">服務告警</div>
            <v-table density="compact">
              <thead><tr><th>時間</th><th>類型</th><th>Profile</th><th>訊息</th></tr></thead>
              <tbody>
                <tr v-if="!alerts.length"><td colspan="4" class="text-center text-grey py-3">無告警</td></tr>
                <tr v-for="a in alerts" :key="a.id"><td class="text-caption text-no-wrap">{{ a.createdAt ? new Date(a.createdAt).toLocaleString('zh-TW', { timeZone: 'Asia/Taipei' }) : '' }}</td><td>{{ a.type }}</td><td>{{ a.profileId }}</td><td class="text-caption">{{ a.message }}</td></tr>
              </tbody>
            </v-table>
          </div>
        </template>
      </v-card>
    </div>
  </v-container>
</template>

<script setup>
// 超級管理員 AI 管理後台（docs/銷控AI智能助理-spec.md §12.1）左項目右內容
import { ref, onMounted } from 'vue';
import { useDisplay } from 'vuetify';
import { useAiAdmin } from '@/components/salesAi/admin/useAiAdmin';
import AiOrbIcon from '@/components/salesAi/AiOrbIcon.vue';
import ModelProfileEditor from '@/components/salesAi/admin/ModelProfileEditor.vue';
import SecretManager from '@/components/salesAi/admin/SecretManager.vue';
import PromptEditor from '@/components/salesAi/admin/PromptEditor.vue';
import ToolToggleTable from '@/components/salesAi/admin/ToolToggleTable.vue';
import ProjectOverrides from '@/components/salesAi/admin/ProjectOverrides.vue';
import AiUsageChart from '@/components/salesAi/admin/AiUsageChart.vue';
import AiPlayground from '@/components/salesAi/admin/AiPlayground.vue';

const { smAndDown } = useDisplay();
const { settings, loading, refresh, run } = useAiAdmin();
const tab = ref('models');
const tabs = [
  { key: 'models', label: '模型設定', icon: 'mdi-chip' },
  { key: 'secrets', label: 'API 金鑰', icon: 'mdi-key-variant' },
  { key: 'prompt', label: '提示詞', icon: 'mdi-text-box-edit-outline' },
  { key: 'tools', label: '功能開關', icon: 'mdi-toggle-switch-outline' },
  { key: 'projects', label: '建案覆蓋', icon: 'mdi-office-building-outline' },
  { key: 'usage', label: '用量與成本', icon: 'mdi-chart-bar' },
  { key: 'logs', label: '稽核與告警', icon: 'mdi-clipboard-text-clock-outline' },
  { key: 'playground', label: 'Playground', icon: 'mdi-flask-outline' },
];
const adminLogs = ref([]);
const alerts = ref([]);
async function loadLogs() {
  try { const [l, a] = await Promise.all([run('listAdminLogs'), run('listAlerts')]); adminLogs.value = l.logs || []; alerts.value = a.alerts || []; } catch { /* ignore */ }
}
onMounted(async () => { await refresh(); loadLogs(); });
</script>

<style scoped>
.ai-admin__layout { display: grid; grid-template-columns: 200px 1fr; gap: 16px; align-items: start; }
.ai-admin__layout--stack { grid-template-columns: 1fr; }
.ai-admin__nav { position: sticky; top: 72px; }
.ai-admin__layout--stack .ai-admin__nav { position: static; }
.ai-admin__content { min-height: 60vh; overflow-x: auto; }
.detail { display: inline-block; max-width: 520px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; vertical-align: bottom; }
</style>
