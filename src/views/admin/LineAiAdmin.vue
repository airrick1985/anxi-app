<template>
  <v-container fluid class="la-admin">
    <div class="la-admin__head">
      <v-icon size="28" color="#06c755">mdi-chat-processing-outline</v-icon>
      <h1 class="la-admin__title">LINE AI 助理管理</h1>
      <v-spacer />
      <button class="mac-btn mac-btn--sm" :disabled="loading" @click="refresh"><v-icon size="15">mdi-refresh</v-icon>重新整理</button>
    </div>

    <div class="la-admin__layout" :class="{ 'la-admin__layout--stack': smAndDown }">
      <nav class="la-admin__nav">
        <v-tabs v-model="tab" :direction="smAndDown ? 'horizontal' : 'vertical'" color="primary" density="compact" :show-arrows="smAndDown">
          <v-tab v-for="t in tabs" :key="t.key" :value="t.key" class="justify-start text-none"><v-icon start size="18">{{ t.icon }}</v-icon>{{ t.label }}</v-tab>
        </v-tabs>
      </nav>
      <div class="la-admin__content">
        <v-skeleton-loader v-if="!settings" type="article, table" />
        <template v-else>
          <ChannelsPanel v-if="tab === 'channels'" />
          <AgentsPanel v-else-if="tab === 'agents'" />
          <StylesPanel v-else-if="tab === 'styles'" />
          <KeysPanel v-else-if="tab === 'keys'" />
          <ConversationsPanel v-else-if="tab === 'conversations'" />
          <SourcesPanel v-else-if="tab === 'sources'" />
          <GeneralPanel v-else-if="tab === 'general'" />
          <UsagePanel v-else-if="tab === 'usage'" />
        </template>
      </div>
    </div>
  </v-container>
</template>

<script setup>
// LINE AI 助理後台（僅超級管理員）：官方帳號、Agent、風格、API Key、對話、雲端資料、一般設定、用量
import { ref, onMounted } from 'vue';
import { useDisplay } from 'vuetify';
import { useLineAiAdmin } from '@/components/lineAi/admin/useLineAiAdmin';
import ChannelsPanel from '@/components/lineAi/admin/ChannelsPanel.vue';
import AgentsPanel from '@/components/lineAi/admin/AgentsPanel.vue';
import StylesPanel from '@/components/lineAi/admin/StylesPanel.vue';
import KeysPanel from '@/components/lineAi/admin/KeysPanel.vue';
import ConversationsPanel from '@/components/lineAi/admin/ConversationsPanel.vue';
import SourcesPanel from '@/components/lineAi/admin/SourcesPanel.vue';
import GeneralPanel from '@/components/lineAi/admin/GeneralPanel.vue';
import UsagePanel from '@/components/lineAi/admin/UsagePanel.vue';

const { smAndDown } = useDisplay();
const { settings, loading, refresh } = useLineAiAdmin();
const tab = ref('channels');
const tabs = [
  { key: 'channels', label: '官方帳號', icon: 'mdi-message-badge-outline' },
  { key: 'agents', label: 'Agent', icon: 'mdi-robot-outline' },
  { key: 'styles', label: '回覆風格', icon: 'mdi-palette-swatch-outline' },
  { key: 'keys', label: 'API Key', icon: 'mdi-key-variant' },
  { key: 'conversations', label: '對話', icon: 'mdi-forum-outline' },
  { key: 'sources', label: '雲端資料', icon: 'mdi-folder-network-outline' },
  { key: 'general', label: '一般設定', icon: 'mdi-cog-outline' },
  { key: 'usage', label: '用量與紀錄', icon: 'mdi-chart-bar' },
];

onMounted(refresh);
</script>

<style scoped>
.la-admin { font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", "Helvetica Neue", "PingFang TC", "Noto Sans TC", sans-serif; color: #1d1d1f; }
/* 左側留給全站浮動選單鈕 */
.la-admin__head { display: flex; align-items: center; gap: 10px; min-height: 44px; padding-left: 44px; margin-bottom: 12px; }
.la-admin__title { font-size: 20px; font-weight: 700; margin: 0; }
.la-admin__layout { display: grid; grid-template-columns: 180px minmax(0, 1fr); gap: 16px; align-items: start; }
.la-admin__layout--stack { grid-template-columns: minmax(0, 1fr); }
.la-admin__nav { position: sticky; top: 16px; }
.la-admin__layout--stack .la-admin__nav { position: static; }
.la-admin__content { min-width: 0; min-height: 60vh; padding: 16px; border-radius: 12px; background: #fff; box-shadow: 0 0 0 0.5px rgba(0, 0, 0, 0.08), 0 1px 3px rgba(0, 0, 0, 0.05); }
@media (max-width: 600px) { .la-admin__content { padding: 12px; } }
</style>
