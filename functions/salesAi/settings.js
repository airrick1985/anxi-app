// 銷控 AI 智能助理：設定讀取（全域 systemSettings/aiAssistant ＋ 建案 projects/{id}.aiAssistant）
// docs/銷控AI智能助理-spec.md §5.1、§5.6

const GLOBAL_DOC = ['systemSettings', 'aiAssistant'];
const CACHE_TTL_MS = 60 * 1000;
let globalCache = { at: 0, value: null };

const DEFAULT_PROFILE = {
  label: 'Gemini 2.5 Flash（預設）',
  provider: 'gemini',
  model: 'gemini-2.5-flash',
  temperature: 0.2,
  maxOutputTokens: 2048,
  thinking: 'off',
  baseUrl: null,
  secretName: 'SALES_BOT_GEMINI_KEY',
  pricePer1MInput: 0.30,
  pricePer1MOutput: 2.50,
  currency: 'USD',
  enabled: true,
};

const DEFAULT_PROMPT = {
  persona: '你是「{{projectName}}」的銷控智能助理，服務對象是本建案的銷售與管理人員。你熟悉戶別、車位、銷控狀態、價格與付款進度，能查詢資料、試算價格，並協助使用者以自然語言修改銷控。',
  style: '回覆使用繁體中文（台灣用語），簡潔、專業、直接給結果；金額單位為「萬」；不描述你的推理或搜尋過程；查無資料就明說，不要編造數字。',
  projectIntroDefault: '',
  extraRules: '',
  quickPrompts: [
    { label: '今日異動', text: '列出今天的銷控狀態異動，以及小訂／補足／簽約日期為今天的戶別', requires: 'sales.read' },
    { label: '可售戶別', text: '目前還有哪些可售戶別？依樓層整理', requires: 'sales.read' },
    { label: '可售車位', text: '目前可售的車位有哪些？依樓層整理', requires: 'sales.read' },
    { label: '本案摘要', text: '給我本建案的銷售摘要（戶數、已售、可售、成交總額）', requires: 'sales.read' },
  ],
  activeVersionId: null,
};

const DEFAULT_LIMITS = {
  perUserPerMinute: 10,
  historyMessages: 20,
  maxToolRounds: 6,
  proposalTtlMinutes: 10,
  maxHistoryChars: 2000,
};

const DEFAULT_GLOBAL = {
  defaultProfileId: 'gemini-flash',
  fallbackProfileId: null,
  profiles: { 'gemini-flash': { ...DEFAULT_PROFILE } },
  prompt: { ...DEFAULT_PROMPT },
  tools: {},
  limits: { ...DEFAULT_LIMITS },
};

const DEFAULT_PROJECT_AI = {
  allowWrite: false,
  allowCancel: false,
  writeRoles: [],
  modelProfileId: null,
  promptOverride: null,
  disabledTools: [],
  dailyProposalLimit: 200,
};

function mergeGlobal(raw) {
  const g = raw && typeof raw === 'object' ? raw : {};
  const profiles = {};
  const rawProfiles = g.profiles && typeof g.profiles === 'object' ? g.profiles : {};
  for (const [id, p] of Object.entries(rawProfiles)) profiles[id] = { ...DEFAULT_PROFILE, ...(p || {}) };
  if (Object.keys(profiles).length === 0) profiles['gemini-flash'] = { ...DEFAULT_PROFILE };
  const defaultProfileId = profiles[g.defaultProfileId] ? g.defaultProfileId : Object.keys(profiles)[0];
  return {
    defaultProfileId,
    fallbackProfileId: profiles[g.fallbackProfileId] ? g.fallbackProfileId : null,
    profiles,
    prompt: { ...DEFAULT_PROMPT, ...(g.prompt || {}) },
    tools: g.tools && typeof g.tools === 'object' ? g.tools : {},
    limits: { ...DEFAULT_LIMITS, ...(g.limits || {}) },
    updatedAt: g.updatedAt || null,
    updatedBy: g.updatedBy || null,
  };
}

async function getGlobalSettings(db, { fresh = false } = {}) {
  if (!fresh && globalCache.value && Date.now() - globalCache.at < CACHE_TTL_MS) return globalCache.value;
  const snap = await db.collection(GLOBAL_DOC[0]).doc(GLOBAL_DOC[1]).get();
  const value = mergeGlobal(snap.exists ? snap.data() : null);
  globalCache = { at: Date.now(), value };
  return value;
}

function invalidateGlobalCache() { globalCache = { at: 0, value: null }; }

function globalDocRef(db) { return db.collection(GLOBAL_DOC[0]).doc(GLOBAL_DOC[1]); }

/** 建案設定：projects/{id} 的 aiAssistant、aiTokenQuota、aiTokenUsed、name */
async function getProjectAiSettings(db, projectId) {
  const snap = await db.collection('projects').doc(projectId).get();
  const d = snap.exists ? snap.data() : {};
  return {
    exists: snap.exists,
    projectName: d.name || d.projectName || projectId,
    ai: { ...DEFAULT_PROJECT_AI, ...(d.aiAssistant || {}) },
    tokenQuota: Number(d.aiTokenQuota) || 0,
    tokenUsed: Number(d.aiTokenUsed) || 0,
  };
}

/** 決定本次使用的 profile 與備援 */
function resolveProfiles(global, projectAi) {
  const primaryId = (projectAi && projectAi.modelProfileId && global.profiles[projectAi.modelProfileId])
    ? projectAi.modelProfileId : global.defaultProfileId;
  const primary = global.profiles[primaryId];
  const fallbackId = global.fallbackProfileId && global.fallbackProfileId !== primaryId ? global.fallbackProfileId : null;
  const fallback = fallbackId ? global.profiles[fallbackId] : null;
  return {
    primary: { id: primaryId, ...primary },
    fallback: fallback && fallback.enabled !== false ? { id: fallbackId, ...fallback } : null,
  };
}

function estimateCost(profile, usage) {
  if (!profile || !usage) return 0;
  const inP = Number(profile.pricePer1MInput) || 0;
  const outP = Number(profile.pricePer1MOutput) || 0;
  return ((usage.inputTokens || 0) * inP + (usage.outputTokens || 0) * outP) / 1e6;
}

module.exports = {
  DEFAULT_PROFILE, DEFAULT_PROMPT, DEFAULT_LIMITS, DEFAULT_GLOBAL, DEFAULT_PROJECT_AI,
  getGlobalSettings, invalidateGlobalCache, globalDocRef, getProjectAiSettings, resolveProfiles, estimateCost, mergeGlobal,
};
