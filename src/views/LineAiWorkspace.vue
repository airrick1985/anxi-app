<template>
  <div class="la-ws" :class="{ 'la-ws--mobile': mobile, 'la-ws--wide': wide }">
    <ConversationList
      v-show="!mobile || !selectedId"
      class="la-ws__list"
      :conversations="conversations"
      :selected-id="selectedId"
      :loading="loadingList"
      :can-claim="!!init?.canClaim"
      :avoid-menu="!liff"
      @select="select"
      @refresh="loadList"
    />

    <section v-if="selectedId" class="la-ws__main">
      <header class="la-head" :class="{ 'la-head--menu': mobile && !liff }">
        <button v-if="mobile" class="mac-icon-btn la-head__back" title="返回" @click="back"><v-icon size="22">mdi-chevron-left</v-icon></button>
        <LineAvatar :src="current?.pictureUrl" :icon="TYPE_ICON[current?.type] || 'mdi-account'" :size="34" />
        <div class="la-head__title">
          <div class="la-head__name">{{ current?.name || '' }}</div>
          <div class="la-head__sub">{{ subtitle }}</div>
        </div>
        <v-spacer />
        <button v-if="!wide && detail" class="mac-btn mac-btn--sm" title="記憶與客戶" @click="panelOpen = true">
          <v-icon size="16">mdi-brain</v-icon><span class="mac-hide-xs">記憶</span>
        </button>
      </header>
      <div v-if="detailError" class="mac-callout mac-callout--error la-ws__error">
        <v-icon size="18">mdi-alert-circle-outline</v-icon>{{ detailError }}
      </div>
      <div v-else-if="!detail" class="mac-list-loading la-ws__grow">載入中…</div>
      <template v-else>
        <MessageThread
          ref="thread"
          :messages="messages"
          :has-more="hasMore"
          :loading-more="loadingMore"
          :conversation-id="selectedId"
          @load-more="loadMore"
          @open-media="openMedia"
        />
        <AiComposer
          :conversation-id="selectedId"
          :agent="detail.agent"
          :styles="detail.styles"
          :default-style-id="detail.defaultStyleId"
          :sources="detail.sources"
          :active="detail.conversation.active"
          @sent="onSent"
          @manage-sources="sourcesOpen = true"
        />
      </template>
    </section>
    <section v-else-if="!mobile" class="la-ws__main la-ws__empty">
      <v-icon size="40" color="#c7c7cc">mdi-message-text-outline</v-icon>
      <div>{{ init && !init.me.lineBound && !init.me.isSuperAdmin ? '尚未綁定 LINE，只會看到指派給你的對話' : '選擇一段對話' }}</div>
    </section>

    <aside v-if="wide && detail" class="la-ws__side">
      <ContextPanel :detail="detail" @changed="reloadDetail" @memory="applyMemory" />
    </aside>

    <v-dialog v-if="!wide" v-model="panelOpen" max-width="440" :fullscreen="mobile" content-class="mac-dialog-fit">
      <div class="mac-sheet la-ws__sheet" :class="{ 'la-ws__sheet--full': mobile }">
        <div class="mac-sheet-head">
          {{ current?.name }}
          <button class="mac-sheet-close" @click="panelOpen = false"><v-icon size="18">mdi-close</v-icon></button>
        </div>
        <ContextPanel v-if="detail" :detail="detail" class="la-ws__sheet-body" @changed="reloadDetail" @memory="applyMemory" />
      </div>
    </v-dialog>

    <SourcesDialog v-model="sourcesOpen" :service-account-email="init?.serviceAccountEmail || ''" @changed="reloadDetail" />
  </div>
</template>

<script setup>
// LINE AI 助理工作台：對話清單 → 訊息 → AI 建議回覆／潤稿；右側（或彈窗）為記憶、客戶、成員
import { ref, computed, onMounted, onBeforeUnmount, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useDisplay } from 'vuetify';
import { useToast } from 'vue-toastification';
import ConversationList from '@/components/lineAi/ConversationList.vue';
import MessageThread from '@/components/lineAi/MessageThread.vue';
import AiComposer from '@/components/lineAi/AiComposer.vue';
import ContextPanel from '@/components/lineAi/ContextPanel.vue';
import SourcesDialog from '@/components/lineAi/SourcesDialog.vue';
import LineAvatar from '@/components/lineAi/LineAvatar.vue';
import { lineAiCall, errorText, TYPE_ICON, TYPE_LABEL } from '@/components/lineAi/useLineAi';

const props = defineProps({
  liff: { type: Boolean, default: false },
  initialConversationId: { type: String, default: null },
});

const route = useRoute();
const router = useRouter();
const toast = useToast();
const { width } = useDisplay();
const mobile = computed(() => width.value < 760);
const wide = computed(() => width.value >= 1200);

const MESSAGE_POLL_MS = 15000;
const LIST_POLL_MS = 45000;

const init = ref(null);
const conversations = ref([]);
const loadingList = ref(false);
const selectedId = ref(null);
const detail = ref(null);
const detailError = ref('');
const messages = ref([]);
const hasMore = ref(false);
const loadingMore = ref(false);
const panelOpen = ref(false);
const sourcesOpen = ref(false);
const thread = ref(null);
let messageTimer = null;
let listTimer = null;
let loadSeq = 0;

const current = computed(() => detail.value?.conversation || conversations.value.find(c => c.id === selectedId.value) || null);
const subtitle = computed(() => {
  const c = current.value;
  if (!c) return '';
  return [
    TYPE_LABEL[c.type],
    c.type !== 'user' && c.memberCount ? `${c.memberCount} 人` : '',
    c.projectName,
    detail.value?.agent?.name,
    !c.active ? (c.type === 'user' ? '已封鎖' : '官方帳號已離開') : '',
  ].filter(Boolean).join('・');
});

async function loadList() {
  loadingList.value = true;
  try {
    const r = await lineAiCall('listConversations');
    conversations.value = (r.conversations || []).map(c => (c.id === selectedId.value ? { ...c, unread: false } : c));
  } catch (e) {
    toast.error(errorText(e));
  } finally {
    loadingList.value = false;
  }
}

function patchListItem(id, patch) {
  const i = conversations.value.findIndex(c => c.id === id);
  if (i >= 0) conversations.value[i] = { ...conversations.value[i], ...patch };
}

async function markRead(id) {
  patchListItem(id, { unread: false });
  try { await lineAiCall('markRead', { conversationId: id }); } catch { /* 已讀失敗不影響操作 */ }
}

async function loadDetail(id, { keepMessages = false } = {}) {
  const seq = ++loadSeq;
  if (!keepMessages) { detail.value = null; messages.value = []; }
  detailError.value = '';
  try {
    const r = await lineAiCall('getConversation', { conversationId: id });
    if (seq !== loadSeq) return;
    detail.value = r;
    messages.value = r.messages || [];
    hasMore.value = !!r.hasMore;
  } catch (e) {
    if (seq === loadSeq) detailError.value = errorText(e);
  }
}

function select(id) {
  if (!id) return;
  if (id !== selectedId.value) {
    selectedId.value = id;
    loadDetail(id);
  }
  markRead(id);
  if (!props.liff && route.query.c !== id) router.replace({ query: { ...route.query, c: id } });
}

function back() {
  selectedId.value = null;
  detail.value = null;
  panelOpen.value = false;
  if (!props.liff && route.query.c) {
    const { c, ...rest } = route.query;
    router.replace({ query: rest });
  }
  loadList();
}

function reloadDetail() {
  if (selectedId.value) loadDetail(selectedId.value, { keepMessages: true });
  loadList();
}

function applyMemory(m) {
  if (!detail.value) return;
  detail.value.conversation = { ...detail.value.conversation, ...m };
}

/** 新訊息：取最新一頁合併 */
async function pollMessages() {
  const id = selectedId.value;
  if (!id || !detail.value || document.hidden) return;
  try {
    const r = await lineAiCall('loadMessages', { conversationId: id });
    if (id !== selectedId.value) return;
    const known = new Set(messages.value.map(m => m.id));
    const fresh = (r.messages || []).filter(m => !known.has(m.id));
    if (!fresh.length) return;
    messages.value = [...messages.value, ...fresh].sort((a, b) => String(a.createdAt).localeCompare(String(b.createdAt)));
    markRead(id);
  } catch { /* 下次再試 */ }
}

async function loadMore() {
  if (!messages.value.length) return;
  loadingMore.value = true;
  const id = selectedId.value;
  try {
    const r = await lineAiCall('loadMessages', { conversationId: id, before: messages.value[0].createdAt });
    if (id !== selectedId.value) return;
    const known = new Set(messages.value.map(m => m.id));
    thread.value?.keepPosition(() => {
      messages.value = [...(r.messages || []).filter(m => !known.has(m.id)), ...messages.value];
    });
    hasMore.value = !!r.hasMore;
  } catch (e) {
    toast.error(errorText(e));
  } finally {
    loadingMore.value = false;
  }
}

function onSent(message) {
  if (message) messages.value = [...messages.value, message];
  patchListItem(selectedId.value, { lastMessagePreview: message?.text?.slice(0, 80) || '', lastSenderName: message?.senderName || '', lastMessageAt: message?.createdAt || new Date().toISOString() });
}

async function openMedia(m) {
  // 先開視窗再填網址，避免手機瀏覽器擋住非使用者觸發的彈窗
  const win = props.liff ? null : window.open('', '_blank');
  try {
    const r = await lineAiCall('mediaUrl', { conversationId: selectedId.value, messageId: m.id });
    if (win) win.location.href = r.url; else window.location.href = r.url;
  } catch (e) {
    win?.close();
    toast.error(errorText(e));
  }
}

function handleDropboxReturn() {
  const { dropbox, reason, ...rest } = route.query;
  if (!dropbox) return;
  if (dropbox === 'connected') { toast.success('Dropbox 已連結'); sourcesOpen.value = true; }
  else toast.error(reason ? String(reason) : 'Dropbox 連結失敗');
  router.replace({ query: rest });
}

function onVisible() {
  if (!document.hidden) { pollMessages(); loadList(); }
}

onMounted(async () => {
  handleDropboxReturn();
  try {
    init.value = await lineAiCall('init');
  } catch (e) {
    toast.error(errorText(e));
  }
  await loadList();
  const initial = props.initialConversationId || route.query.c;
  if (initial) select(String(initial));
  messageTimer = setInterval(pollMessages, MESSAGE_POLL_MS);
  listTimer = setInterval(() => { if (!document.hidden) loadList(); }, LIST_POLL_MS);
  document.addEventListener('visibilitychange', onVisible);
});

onBeforeUnmount(() => {
  clearInterval(messageTimer);
  clearInterval(listTimer);
  document.removeEventListener('visibilitychange', onVisible);
});

watch(() => route.query.c, c => { if (!props.liff && c && c !== selectedId.value) select(String(c)); });
</script>

<style scoped>
.la-ws {
  display: grid;
  grid-template-columns: 320px minmax(0, 1fr);
  height: 100vh;
  height: 100dvh;
  background: #fff;
  color: #1d1d1f;
  font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", "Helvetica Neue", "PingFang TC", "Noto Sans TC", sans-serif;
  overflow: hidden;
}
.la-ws--wide { grid-template-columns: 320px minmax(0, 1fr) 320px; }
.la-ws--mobile { grid-template-columns: minmax(0, 1fr); position: fixed; inset: 0; height: auto; } /* 手機版固定在視窗內，點按鈕時頁面不會被捲動 */
.la-ws__list { border-right: 1px solid rgba(0, 0, 0, 0.08); min-height: 0; }
.la-ws--mobile .la-ws__list { border-right: 0; }
.la-ws__main { display: flex; flex-direction: column; min-width: 0; min-height: 0; }
.la-ws__grow { flex: 1 1 auto; }
.la-ws__empty { align-items: center; justify-content: center; gap: 10px; color: #8e8e93; font-size: 14px; background: #f5f5f7; text-align: center; padding: 24px; }
.la-ws__error { margin: 16px; }
.la-ws__side { min-height: 0; border-left: 1px solid rgba(0, 0, 0, 0.08); }
.la-ws__sheet { display: flex; flex-direction: column; height: 100%; max-height: 80vh; background: #f5f5f7; }
.la-ws__sheet--full { max-height: none; border-radius: 0 !important; }
.la-ws__sheet-body { flex: 1 1 auto; min-height: 0; }
.la-head { flex-shrink: 0; display: flex; align-items: center; gap: 10px; min-height: 56px; padding: 8px 14px; border-bottom: 1px solid rgba(0, 0, 0, 0.08); background: #fff; }
.la-head--menu { padding-left: 54px; }
.la-head__back { width: 30px; height: 30px; margin-right: -4px; }
.la-head__title { min-width: 0; }
.la-head__name { font-size: 15.5px; font-weight: 600; overflow-wrap: anywhere; }
.la-head__sub { font-size: 12px; color: #6e6e73; overflow-wrap: anywhere; }
</style>
