// LINE AI 助理：模型呼叫（沿用 salesAi 的供應商程式，金鑰清單與設定獨立）、工具迴圈、用量、速率限制
const axios = require('axios');
const { HttpsError } = require('firebase-functions/v2/https');
const { getProvider, ProviderError } = require('../salesAi/providers');
const secrets = require('../salesAi/secrets');
const { getDb, COL, FieldValue, todayTaipei } = require('./db');

const SUGGESTED_MODELS = {
  gemini: ['gemini-2.5-flash', 'gemini-2.5-pro', 'gemini-3-flash-preview'],
  openai: ['gpt-5', 'gpt-5-mini', 'gpt-4.1'],
  anthropic: ['claude-opus-5-5', 'claude-sonnet-5-5', 'claude-haiku-5-5', 'claude-fable-5-1'],
  'openai-compatible': [],
};

function profileOf(agent) {
  return {
    id: agent.id,
    provider: agent.provider,
    model: agent.model,
    temperature: agent.temperature,
    maxOutputTokens: agent.maxOutputTokens,
    thinking: agent.thinking || 'off',
    baseUrl: agent.baseUrl || null,
    secretName: agent.secretName,
  };
}

async function chat(agent, req) {
  const profile = profileOf(agent);
  const provider = getProvider(profile.provider);
  const apiKey = profile.secretName ? await secrets.getSecret(profile.secretName) : '';
  if (!apiKey && profile.provider !== 'openai-compatible') {
    throw new ProviderError(`Agent「${agent.name}」尚未設定 API Key`, { code: 'auth' });
  }
  let lastErr;
  for (let i = 0; i < 2; i++) {
    try { return await provider.chat({ ...req, profile, apiKey }); } catch (e) {
      lastErr = e;
      if (!(e instanceof ProviderError) || !e.retryable) break;
      await new Promise(r => setTimeout(r, 800));
    }
  }
  throw lastErr;
}

function addUsage(total, u) {
  if (!u) return total;
  total.inputTokens += u.inputTokens || 0;
  total.outputTokens += u.outputTokens || 0;
  total.totalTokens += u.totalTokens || 0;
  return total;
}

/**
 * 呼叫模型；handlers 有值時開放工具，最多 maxRounds 輪
 * @returns {{ text: string|null, usage, toolCalls: number }}
 */
async function run(agent, { system, messages, tools = [], handlers = {}, maxRounds = 4 }) {
  const usage = { inputTokens: 0, outputTokens: 0, totalTokens: 0 };
  const convo = [...messages];
  let toolCalls = 0;
  // 最後一輪仍帶工具定義：Anthropic 的對話歷史有 tool_use 時必須附 tools
  for (let round = 0; ; round++) {
    const res = await chat(agent, { system, messages: convo, tools });
    addUsage(usage, res.usage);
    if (!res.toolCalls?.length || round >= maxRounds) return { text: res.text, usage, toolCalls, stop: res.stop };
    convo.push({ role: 'assistant', content: res.text || null, toolCalls: res.toolCalls, rawParts: res.rawParts, rawContent: res.rawContent });
    for (const tc of res.toolCalls) {
      toolCalls += 1;
      const fn = handlers[tc.name];
      let result;
      try { result = fn ? await fn(tc.args || {}) : { error: `未知的工具：${tc.name}` }; } catch (e) { result = { error: e.message }; }
      convo.push({ role: 'tool', toolCallId: tc.id, name: tc.name, result });
    }
  }
}

function friendlyModelError(e) {
  if (e instanceof ProviderError) {
    if (e.code === 'auth') return new HttpsError('failed-precondition', `AI 金鑰無效或未設定：${e.message}`);
    if (e.retryable) return new HttpsError('unavailable', 'AI 服務暫時忙碌，請稍後再試。');
    return new HttpsError('internal', `AI 產生失敗：${e.message}`);
  }
  return e instanceof HttpsError ? e : new HttpsError('internal', `AI 產生失敗：${e.message}`);
}

function estimateCost(agent, usage) {
  return ((usage.inputTokens || 0) * (Number(agent.pricePer1MInput) || 0) + (usage.outputTokens || 0) * (Number(agent.pricePer1MOutput) || 0)) / 1e6;
}

/** lineAiUsage/{yyyymmdd}：總量、各 Agent、各用途（suggest／polish／summary／notify） */
async function recordUsage(agent, usage, kind) {
  if (!usage?.totalTokens) return;
  const day = todayTaipei();
  const cost = estimateCost(agent, usage);
  const inc = n => FieldValue.increment(n);
  const block = { calls: inc(1), inputTokens: inc(usage.inputTokens || 0), outputTokens: inc(usage.outputTokens || 0), totalTokens: inc(usage.totalTokens || 0), estCost: inc(cost) };
  try {
    await getDb().collection(COL.usage).doc(day).set({
      date: day,
      ...block,
      byAgent: { [agent.id]: { name: agent.name, ...block } },
      byKind: { [kind]: { calls: inc(1), totalTokens: inc(usage.totalTokens || 0) } },
      updatedAt: FieldValue.serverTimestamp(),
    }, { merge: true });
  } catch (e) {
    console.warn('[lineAi] 用量寫入失敗', e.message);
  }
}

async function checkRate(user, limit) {
  const ref = getDb().collection(COL.rateLimits).doc(user.userKey);
  const now = Date.now();
  await getDb().runTransaction(async tx => {
    const snap = await tx.get(ref);
    const stamps = (snap.exists ? snap.data().stamps || [] : []).filter(t => now - t < 60000);
    if (stamps.length >= limit) throw new HttpsError('resource-exhausted', `操作太頻繁，請稍候再試（每分鐘最多 ${limit} 次）。`);
    stamps.push(now);
    tx.set(ref, { stamps, updatedAt: FieldValue.serverTimestamp() });
  });
}

// 文字對話用不到的模型（嵌入、語音、影像生成等）
const NON_CHAT = /embed|tts|whisper|transcribe|realtime|audio|dall-e|image|imagen|veo|moderation|aqa|search|instruct|babbage|davinci|computer-use/i;

function apiError(e) {
  const d = e?.response?.data;
  return d?.error?.message || d?.message || e.message;
}

/** 向供應商查詢這把金鑰可用的模型（新到舊） */
async function listModels({ provider, apiKey, baseUrl }) {
  try {
    if (provider === 'anthropic') {
      const r = await axios.get('https://api.anthropic.com/v1/models', { headers: { 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' }, params: { limit: 100 }, timeout: 15000 });
      return (r.data?.data || []).map(m => ({ id: m.id, label: m.display_name || m.id }));
    }
    if (provider === 'gemini') {
      const r = await axios.get('https://generativelanguage.googleapis.com/v1beta/models', { params: { key: apiKey, pageSize: 1000 }, timeout: 15000 });
      return (r.data?.models || [])
        .filter(m => (m.supportedGenerationMethods || []).includes('generateContent'))
        .map(m => ({ id: String(m.name || '').replace(/^models\//, ''), label: m.displayName || '' }))
        .filter(m => /gemini/.test(m.id) && !NON_CHAT.test(m.id))
        .sort((a, b) => b.id.localeCompare(a.id, 'en', { numeric: true }));
    }
    const base = String(baseUrl || '').trim().replace(/\/+$/, '') || 'https://api.openai.com/v1';
    const r = await axios.get(`${base}/models`, { headers: { Authorization: `Bearer ${apiKey || 'none'}` }, timeout: 15000 });
    return (r.data?.data || [])
      .filter(m => provider !== 'openai' || (/^(gpt-|o\d|chatgpt-)/.test(m.id) && !NON_CHAT.test(m.id)))
      .sort((a, b) => (b.created || 0) - (a.created || 0) || String(b.id).localeCompare(String(a.id)))
      .map(m => ({ id: m.id, label: m.id }));
  } catch (e) {
    throw new Error(apiError(e));
  }
}

module.exports = { run, chat, recordUsage, checkRate, friendlyModelError, profileOf, listModels, SUGGESTED_MODELS };
