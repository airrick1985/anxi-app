<template>
  <LineAiWorkspace v-if="ready" liff :initial-conversation-id="conversationId" />
  <div v-else class="la-entry">
    <template v-if="error">
      <v-icon size="40" color="#d62d20">mdi-alert-circle-outline</v-icon>
      <div class="la-entry__msg">{{ error }}</div>
      <button v-if="retryable" class="mac-btn mac-btn--primary" @click="start">重試</button>
    </template>
    <template v-else>
      <v-progress-circular indeterminate color="primary" size="28" width="3" />
      <div class="la-entry__msg">{{ status }}</div>
    </template>
  </div>
</template>

<script setup>
// LINE 內開啟（官方帳號選單、來訊通知按鈕）：LIFF 驗證身分，不另外登入系統
import { ref, onMounted } from 'vue';
import LineAiWorkspace from './LineAiWorkspace.vue';
import { LIFF_IDS } from '@/utils/liffApps';
import { liffLinkLayers } from '@/utils/leadReportLink';
import { initLiffAndEnsureLogin, getLiffProfileOrRelogin, getLiffAccessToken, buildLiffRedirectUri } from '@/utils/liffAuth';
import { useLiffAuth, lineAiCall, errorText } from '@/components/lineAi/useLineAi';

const ready = ref(false);
const status = ref('連接 LINE…');
const error = ref('');
const retryable = ref(false);
const conversationId = ref(null);

function readConversationId() {
  for (const url of liffLinkLayers(window.location.href)) {
    const c = url.searchParams.get('c');
    if (c && /^[A-Za-z0-9_-]{5,300}$/.test(c)) return c;
  }
  return null;
}

async function start() {
  error.value = '';
  retryable.value = false;
  if (!LIFF_IDS.lineAi) {
    error.value = '尚未設定 LINE 入口';
    return;
  }
  conversationId.value = readConversationId();
  const redirectUri = buildLiffRedirectUri(`line-ai-entry${conversationId.value ? `?c=${encodeURIComponent(conversationId.value)}` : ''}`);
  try {
    if (!(await initLiffAndEnsureLogin(LIFF_IDS.lineAi, { redirectUri }))) return;
    if (!(await getLiffProfileOrRelogin({ redirectUri }))) return;
    useLiffAuth(getLiffAccessToken);
    status.value = '確認身分…';
    await lineAiCall('init');
    ready.value = true;
  } catch (e) {
    const msg = errorText(e);
    error.value = msg;
    // 未綁定／無權限不必重試；連線或驗證逾時可重試
    retryable.value = !/綁定|停用|試用|權限/.test(msg);
  }
}

onMounted(start);
</script>

<style scoped>
.la-entry { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 14px; min-height: 100vh; min-height: 100dvh; padding: 24px; background: #f5f5f7; color: #1d1d1f; text-align: center; font-family: -apple-system, BlinkMacSystemFont, "PingFang TC", "Noto Sans TC", sans-serif; }
.la-entry__msg { font-size: 15px; line-height: 1.6; max-width: 320px; }
</style>
