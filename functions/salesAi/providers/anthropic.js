// Anthropic Messages API adapter（axios 直呼，不加 SDK）
const axios = require('axios');
const { ProviderError, errorFromAxios, clampNumber } = require('./base');

const API = 'https://api.anthropic.com/v1';
const VERSION = '2023-06-01';

/**
 * 模型世代：claude-{family}-{major}[-{minor}]
 * - legacy（4.5 以前，如 haiku-4-5）：固定思考預算 budget_tokens、可設 temperature
 * - 4.6：自適應思考＋effort，仍可設 temperature
 * - 4.7 以後（含 5.x）：自適應思考＋effort；budget_tokens、temperature 會被拒絕（400）
 */
function generation(model) {
  const m = /^claude-(?:opus|sonnet|haiku|fable|mythos)-(\d+)(?:-(\d{1,2}))?(?!\d)/.exec(String(model || ''));
  if (!m) return 'legacy';
  const v = Number(m[1]) + (m[2] ? Number(m[2]) / 10 : 0);
  if (v >= 4.7) return 'modern';
  if (v >= 4.6) return 'adaptive';
  return 'legacy';
}

function toMessages(messages) {
  const out = [];
  for (const m of messages) {
    if (m.role === 'user') {
      out.push({ role: 'user', content: [{ type: 'text', text: m.content || '(空白)' }] });
    } else if (m.role === 'assistant') {
      // 開啟思考時，帶工具呼叫的回合要把原始內容（含 thinking 區塊）原封不動送回
      if (Array.isArray(m.rawContent) && m.rawContent.length) { out.push({ role: 'assistant', content: m.rawContent }); continue; }
      const content = [];
      if (m.content) content.push({ type: 'text', text: m.content });
      for (const tc of m.toolCalls || []) content.push({ type: 'tool_use', id: tc.id, name: tc.name, input: tc.args || {} });
      if (content.length) out.push({ role: 'assistant', content });
    } else if (m.role === 'tool') {
      const block = { type: 'tool_result', tool_use_id: m.toolCallId, content: JSON.stringify(m.result ?? null) };
      const last = out[out.length - 1];
      if (last && last.role === 'user' && last.content.every(c => c.type === 'tool_result')) last.content.push(block);
      else out.push({ role: 'user', content: [block] });
    }
  }
  // Anthropic 要求首則為 user
  if (out.length && out[0].role !== 'user') out.unshift({ role: 'user', content: [{ type: 'text', text: '（對話開始）' }] });
  return out;
}

async function chat({ system, messages, tools, profile, apiKey }) {
  if (!apiKey) throw new ProviderError('Anthropic 金鑰未設定', { code: 'auth' });
  const maxTokens = clampNumber(profile.maxOutputTokens, 256, 65536, 2048);
  const body = {
    model: profile.model,
    max_tokens: maxTokens,
    messages: toMessages(messages),
  };
  if (system) body.system = system;
  const thinking = ['low', 'medium', 'high'].includes(profile.thinking) ? profile.thinking : 'off';
  const gen = generation(profile.model);
  if (gen === 'legacy') {
    if (thinking !== 'off') {
      const budget = { low: 1024, medium: 4096, high: 16000 }[thinking];
      body.thinking = { type: 'enabled', budget_tokens: Math.min(budget, Math.max(1024, maxTokens - 512)) };
      if (body.max_tokens <= body.thinking.budget_tokens) body.max_tokens = body.thinking.budget_tokens + 1024;
      // 開啟 thinking 時不可設 temperature
    } else {
      body.temperature = clampNumber(profile.temperature, 0, 1, 0.2);
    }
  } else {
    // 「關」：不送 thinking、effort 用 low（Opus 5.5／Sonnet 5.5 等新模型無法完全關閉思考）
    if (thinking !== 'off') {
      body.thinking = { type: 'adaptive' };
      // 思考 token 也算在 max_tokens 內，留足空間避免回覆被截斷
      body.max_tokens = Math.max(maxTokens, 16000);
    }
    body.output_config = { effort: thinking === 'off' ? 'low' : thinking };
    if (gen === 'adaptive' && thinking === 'off') body.temperature = clampNumber(profile.temperature, 0, 1, 0.2);
  }
  if (tools && tools.length) {
    body.tools = tools.map(t => ({ name: t.name, description: t.description, input_schema: t.parameters || { type: 'object', properties: {} } }));
  }
  let r;
  try {
    r = await axios.post(`${API}/messages`, body, {
      headers: { 'x-api-key': apiKey, 'anthropic-version': VERSION, 'Content-Type': 'application/json' },
      timeout: 55000,
    });
  } catch (e) {
    throw errorFromAxios(e, 'Anthropic');
  }
  const blocks = r.data?.content || [];
  const textParts = [];
  const toolCalls = [];
  for (const b of blocks) {
    if (b.type === 'text' && b.text) textParts.push(b.text);
    if (b.type === 'tool_use') toolCalls.push({ id: b.id, name: b.name, args: b.input || {} });
  }
  const usage = r.data?.usage || {};
  const sr = r.data?.stop_reason || '';
  let stop = 'end';
  if (toolCalls.length || sr === 'tool_use') stop = 'tool';
  else if (sr === 'max_tokens') stop = 'length';
  else if (sr === 'refusal') stop = 'safety';
  return {
    text: textParts.join('\n').trim() || null,
    toolCalls,
    rawContent: toolCalls.length ? blocks : undefined,
    usage: {
      inputTokens: usage.input_tokens || 0,
      outputTokens: usage.output_tokens || 0,
      totalTokens: (usage.input_tokens || 0) + (usage.output_tokens || 0),
    },
    stop,
  };
}

async function validateKey(apiKey) {
  try {
    const r = await axios.get(`${API}/models`, { headers: { 'x-api-key': apiKey, 'anthropic-version': VERSION }, params: { limit: 100 }, timeout: 15000 });
    const models = (r.data?.data || []).map(m => m.id).filter(Boolean);
    return { ok: true, models };
  } catch (e) {
    return { ok: false, message: e?.response?.data?.error?.message || e.message };
  }
}

module.exports = { chat, validateKey, generation };
