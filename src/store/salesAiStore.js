// 銷控 AI 智能助理 store（docs/銷控AI智能助理-spec.md §8）
// 負責：面板開關、FAB 位置／收合、對話紀錄（Firestore users/{key}/aiChatHistory/{projectId}）、
//       能力矩陣與配額、草案／問題卡狀態、與後端 salesAiAgent 的往返。
import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { doc, getDoc, setDoc, deleteDoc } from 'firebase/firestore';
import { db } from '@/firebase';
import { salesAiAgentApi } from '@/api';
import { useUserStore } from '@/store/user';

const MAX_MESSAGES = 100;
const newId = () => `m-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

function errorMessage(e) {
  const code = String(e?.code || '');
  const msg = String(e?.message || '');
  if (code.includes('unauthenticated')) return 'Session 已過期，請重新登入。';
  if (code.includes('permission-denied')) return msg.replace(/^.*?:\s*/, '') || '您沒有此操作的權限。';
  if (code.includes('resource-exhausted')) return msg.replace(/^.*?:\s*/, '') || '額度已用完或操作太頻繁。';
  if (code.includes('unavailable')) return 'AI 服務暫時忙碌，請稍後再試。';
  if (code.includes('failed-precondition')) return msg.replace(/^.*?:\s*/, '');
  return msg.replace(/^FirebaseError:\s*/, '') || '發生未知錯誤';
}

export const useSalesAiStore = defineStore('salesAi', () => {
  const userStore = useUserStore();

  // ---- UI 狀態 ----
  const isOpen = ref(false);
  const hidden = ref(false);      // 全螢幕功能開啟時隱藏 FAB
  const collapsed = ref(false);   // FAB 半隱藏到邊緣
  const projectId = ref(null);
  const projectName = ref('');
  const unitContext = ref(null);  // 目前戶別（從戶別 Modal 開啟時）

  // ---- 能力與配額 ----
  const capabilities = ref([]);
  const tools = ref([]);
  const quickPrompts = ref([]);
  const quota = ref({ used: 0, limit: 0 });
  const capsLoaded = ref(false);
  const capsError = ref(null);

  // ---- 對話 ----
  const messages = ref([]);
  const isLoading = ref(false);
  const loadingText = ref('思考中…');
  const lastError = ref(null);
  const historyLoaded = ref(false);

  // ---- 外部掛鉤 ----
  let uiActionHandler = null;
  let notifyHandler = null;

  const canRead = computed(() => capabilities.value.includes('sales.read'));
  const canWrite = computed(() => capabilities.value.includes('sales.write'));
  const canCancel = computed(() => capabilities.value.includes('sales.cancel'));
  const quotaExhausted = computed(() => quota.value.limit > 0 && quota.value.used >= quota.value.limit);
  const pendingCount = computed(() => messages.value.filter(m =>
    (m.type === 'question' && !m.payload?.answered) ||
    (m.type === 'proposal' && m.payload?.proposal?.status === 'pending')
  ).length);
  const fabState = computed(() => {
    if (capsError.value || quotaExhausted.value) return 'disabled';
    if (isLoading.value) return 'thinking';
    if (lastError.value) return 'error';
    if (pendingCount.value > 0) return 'needsInput';
    return 'idle';
  });

  function identity() {
    return { userKey: userStore.user?.key || null, sessionId: userStore.sessionId || null, projectId: projectId.value };
  }

  // 已載入內容所屬的身份（用戶＋建案）。store 是記憶體單例，同一瀏覽器換帳號、
  // 又開同一個建案時 projectId 沒變，必須靠這個判斷強制重載，否則會看到前一位用戶的對話。
  const loadedIdentity = ref(null);
  const currentIdentity = () => `${userStore.user?.key || 'anon'}|${projectId.value || ''}`;

  function resetConversation() {
    messages.value = [];
    historyLoaded.value = false;
    capsLoaded.value = false;
    capsError.value = null;
    lastError.value = null;
    unitContext.value = null;
    capabilities.value = [];
    tools.value = [];
    quickPrompts.value = [];
    quota.value = { used: 0, limit: 0 };
    loadedIdentity.value = null;
  }

  async function setProject(id, name) {
    const userChanged = loadedIdentity.value && loadedIdentity.value !== `${userStore.user?.key || 'anon'}|${id || ''}`;
    if (projectId.value !== id || userChanged) {
      projectId.value = id;
      projectName.value = name || '';
      resetConversation();
    } else if (name) {
      projectName.value = name;
    }
  }

  function setUnitContext(unitId) { unitContext.value = unitId || null; }
  function registerUiActionHandler(fn) { uiActionHandler = fn; }
  function registerNotifyHandler(fn) { notifyHandler = fn; }

  function open() { isOpen.value = true; collapsed.value = false; ensureReady(); }
  function close() { isOpen.value = false; }
  function toggle() { isOpen.value ? close() : open(); }

  async function ensureReady() {
    if (!projectId.value) return;
    // 身份（用戶＋建案）與已載入的不同 → 強制重載，避免沿用前一位用戶的記憶體資料
    if (loadedIdentity.value !== currentIdentity()) resetConversation();
    if (!historyLoaded.value) await loadHistory();
    if (!capsLoaded.value) await loadCapabilities();
    loadedIdentity.value = currentIdentity();
  }

  async function loadCapabilities() {
    if (!projectId.value || !userStore.user?.key) return;
    try {
      const r = await salesAiAgentApi({ action: 'capabilities', ...identity() });
      capabilities.value = r.capabilities || [];
      tools.value = r.tools || [];
      quickPrompts.value = r.quickPrompts || [];
      quota.value = r.quota || { used: 0, limit: 0 };
      if (r.projectName) projectName.value = r.projectName;
      capsError.value = null;
    } catch (e) {
      capsError.value = errorMessage(e);
      capabilities.value = [];
    } finally {
      capsLoaded.value = true;
    }
  }

  // ---- 歷史 ----
  function historyRef() {
    if (!userStore.user?.key || !projectId.value) return null;
    return doc(db, 'users', userStore.user.key, 'aiChatHistory', projectId.value);
  }
  async function loadHistory() {
    const ref_ = historyRef();
    if (!ref_) return;
    try {
      const snap = await getDoc(ref_);
      if (snap.exists()) {
        const data = snap.data();
        const list = Array.isArray(data.messages) ? data.messages : [];
        // 相容舊版 { role, parts:[{text}] }
        messages.value = list.map(m => m.type ? m : ({ id: newId(), role: m.role === 'user' ? 'user' : 'model', type: 'text', text: m.parts?.[0]?.text || '', createdAt: null }));
        // 逾時草案標記
        const now = Date.now();
        for (const m of messages.value) {
          const p = m.payload?.proposal;
          if (m.type === 'proposal' && p && p.status === 'pending' && p.expiresAt && new Date(p.expiresAt).getTime() < now) p.status = 'expired';
        }
      }
    } catch (e) {
      console.error('[salesAi] 載入對話紀錄失敗', e);
    } finally {
      historyLoaded.value = true;
    }
  }
  let saveTimer = null;
  function saveHistory() {
    const ref_ = historyRef();
    if (!ref_) return;
    clearTimeout(saveTimer);
    saveTimer = setTimeout(async () => {
      try {
        const list = messages.value.slice(-MAX_MESSAGES).map(m => JSON.parse(JSON.stringify(m)));
        await setDoc(ref_, { messages: list, updatedAt: new Date() }, { merge: true });
      } catch (e) { console.error('[salesAi] 儲存對話紀錄失敗', e); }
    }, 400);
  }
  async function clearHistory() {
    messages.value = [];
    const ref_ = historyRef();
    if (ref_) { try { await deleteDoc(ref_); } catch (e) { console.error(e); } }
  }

  function push(msg) {
    const m = { id: newId(), createdAt: Date.now(), ...msg };
    messages.value.push(m);
    if (messages.value.length > MAX_MESSAGES) messages.value.splice(0, messages.value.length - MAX_MESSAGES);
    saveHistory();
    return m;
  }

  function buildHistory() {
    return messages.value.slice(-30).map(m => ({ role: m.role === 'user' ? 'user' : 'model', type: m.type, text: m.text || '', payload: m.type === 'text' ? undefined : summarizeForHistory(m) }));
  }
  function summarizeForHistory(m) {
    if (m.type === 'proposal') return { summary: m.payload?.proposal?.summary, status: m.payload?.proposal?.status };
    if (m.type === 'result') return { applied: m.payload?.applied, changeText: m.payload?.changeText };
    if (m.type === 'question') return { questions: (m.payload?.questions || []).map(q => ({ label: q.label })) };
    return undefined;
  }

  // ---- 處理後端回應 ----
  function handleResponse(r, { replaceMessage = null } = {}) {
    if (r.quota) quota.value = r.quota;
    if (r.capabilities) capabilities.value = r.capabilities;
    if (r.reply) push({ role: 'model', type: 'text', text: r.reply });
    if (r.proposal) {
      const payload = { proposal: r.proposal, question: r.question || null };
      if (replaceMessage) { replaceMessage.type = 'proposal'; replaceMessage.payload = payload; saveHistory(); }
      else push({ role: 'model', type: 'proposal', payload });
    } else if (r.question) {
      push({ role: 'model', type: 'question', payload: { ...r.question, answered: false } });
    }
    if (r.result) {
      const payload = r.result;
      if (replaceMessage) { replaceMessage.type = 'result'; replaceMessage.payload = payload; saveHistory(); }
      else push({ role: 'model', type: 'result', payload });
      if (payload.notification?.statusChanged && notifyHandler) notifyHandler(payload);
    }
    for (const a of r.uiActions || []) {
      if (uiActionHandler) uiActionHandler(a);
      push({ role: 'model', type: 'action', payload: a });
    }
  }

  async function sendMessage(text) {
    const t = String(text || '').trim();
    if (!t || isLoading.value) return;
    if (!projectId.value) return;
    lastError.value = null;
    push({ role: 'user', type: 'text', text: t });
    isLoading.value = true;
    loadingText.value = '思考中…';
    try {
      const history = buildHistory().slice(0, -1);
      const r = await salesAiAgentApi({ action: 'chat', ...identity(), message: t, history, context: unitContext.value ? { unitId: unitContext.value } : null });
      handleResponse(r);
    } catch (e) {
      const msg = errorMessage(e);
      lastError.value = msg;
      push({ role: 'model', type: 'text', text: `⚠️ ${msg}`, isError: true });
    } finally {
      isLoading.value = false;
    }
  }

  /** 模型層問題（proposalId 為空）：把答案轉成文字訊息送出 */
  function formatAnswersAsText(questions, answers) {
    const parts = [];
    for (const q of questions) {
      const v = answers[q.field];
      if (v === undefined || v === null || v === '' || (Array.isArray(v) && !v.length)) continue;
      parts.push(`${q.label}：${Array.isArray(v) ? v.join('、') : v}`);
    }
    return parts.join('；');
  }

  async function answerQuestion(message, answers) {
    if (!message || !message.payload) return;
    const q = message.payload;
    const proposalId = q.proposalId || q.question?.proposalId || q.proposal?.proposalId || null;
    if (!proposalId) {
      q.answered = true; q.answers = answers; saveHistory();
      const text = formatAnswersAsText(q.questions || [], answers) || '（略過）';
      await sendMessage(text);
      return;
    }
    // 驗證器層：走 answer
    isLoading.value = true; loadingText.value = '整理草案中…'; lastError.value = null;
    try {
      const r = await salesAiAgentApi({ action: 'answer', ...identity(), proposalId, answers });
      handleResponse(r, { replaceMessage: message });
    } catch (e) {
      lastError.value = errorMessage(e);
      push({ role: 'model', type: 'text', text: `⚠️ ${lastError.value}`, isError: true });
    } finally { isLoading.value = false; }
  }

  async function executeProposal(message, { typedConfirm = null, answers = null } = {}) {
    const p = message?.payload?.proposal;
    if (!p || !p.proposalId) return;
    isLoading.value = true; loadingText.value = '執行中…'; lastError.value = null;
    try {
      const r = await salesAiAgentApi({ action: 'execute', ...identity(), proposalId: p.proposalId, typedConfirm, answers });
      if (r.status === 'blocked') {
        message.payload = { proposal: r.proposal, question: r.question || null };
        saveHistory();
        lastError.value = null;
        return;
      }
      handleResponse(r, { replaceMessage: message });
    } catch (e) {
      lastError.value = errorMessage(e);
      push({ role: 'model', type: 'text', text: `⚠️ ${lastError.value}`, isError: true });
    } finally { isLoading.value = false; }
  }

  async function cancelProposal(message) {
    const p = message?.payload?.proposal;
    if (!p) return;
    if (p.proposalId) { try { await salesAiAgentApi({ action: 'cancel', ...identity(), proposalId: p.proposalId }); } catch (e) { /* ignore */ } }
    p.status = 'cancelled';
    saveHistory();
  }

  function clearError() { lastError.value = null; }

  return {
    isOpen, hidden, collapsed, projectId, projectName, unitContext,
    capabilities, tools, quickPrompts, quota, capsLoaded, capsError,
    messages, isLoading, loadingText, lastError, historyLoaded,
    canRead, canWrite, canCancel, quotaExhausted, pendingCount, fabState,
    setProject, setUnitContext, registerUiActionHandler, registerNotifyHandler,
    open, close, toggle, ensureReady, loadCapabilities, loadHistory, clearHistory,
    sendMessage, answerQuestion, executeProposal, cancelProposal, clearError,
  };
});
