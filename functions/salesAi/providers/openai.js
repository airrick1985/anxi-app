// OpenAI / OpenAI-compatible adapter（chat/completions，axios 直呼，不加 SDK）
const axios = require('axios');
const { ProviderError, errorFromAxios, safeJsonParse, clampNumber } = require('./base');

const DEFAULT_BASE = 'https://api.openai.com/v1';

function baseUrl(profile) {
  const b = (profile.baseUrl || '').trim().replace(/\/+$/, '');
  return b || DEFAULT_BASE;
}

function toMessages(system, messages) {
  const out = [];
  if (system) out.push({ role: 'system', content: system });
  for (const m of messages) {
    if (m.role === 'user') out.push({ role: 'user', content: m.content || '' });
    else if (m.role === 'assistant') {
      const msg = { role: 'assistant', content: m.content || null };
      if (m.toolCalls && m.toolCalls.length) {
        msg.tool_calls = m.toolCalls.map(tc => ({ id: tc.id, type: 'function', function: { name: tc.name, arguments: JSON.stringify(tc.args || {}) } }));
      }
      out.push(msg);
    } else if (m.role === 'tool') {
      out.push({ role: 'tool', tool_call_id: m.toolCallId, content: JSON.stringify(m.result ?? null) });
    }
  }
  return out;
}

async function chat({ system, messages, tools, profile, apiKey }) {
  if (!apiKey && profile.provider !== 'openai-compatible') throw new ProviderError('OpenAI 金鑰未設定', { code: 'auth' });
  const isCompat = profile.provider === 'openai-compatible';
  const body = {
    model: profile.model,
    messages: toMessages(system, messages),
  };
  const maxTokens = clampNumber(profile.maxOutputTokens, 256, 65536, 2048);
  if (isCompat) body.max_tokens = maxTokens; else body.max_completion_tokens = maxTokens;
  const thinking = profile.thinking || 'off';
  const isReasoning = /^(o\d|gpt-5)/.test(profile.model || '');
  if (thinking !== 'off' && !isCompat) body.reasoning_effort = thinking;
  // 推理模型不接受 temperature；一般模型才帶
  if (!isReasoning || isCompat) body.temperature = clampNumber(profile.temperature, 0, 2, 0.2);
  if (tools && tools.length) {
    body.tools = tools.map(t => ({ type: 'function', function: { name: t.name, description: t.description, parameters: t.parameters } }));
    body.tool_choice = 'auto';
  }
  const label = isCompat ? '相容端點' : 'OpenAI';
  let r;
  try {
    r = await axios.post(`${baseUrl(profile)}/chat/completions`, body, {
      headers: { Authorization: `Bearer ${apiKey || 'none'}`, 'Content-Type': 'application/json' },
      timeout: 55000,
    });
  } catch (e) {
    throw errorFromAxios(e, label);
  }
  const choice = r.data?.choices?.[0] || {};
  const msg = choice.message || {};
  const toolCalls = (msg.tool_calls || []).map(tc => ({ id: tc.id, name: tc.function?.name, args: safeJsonParse(tc.function?.arguments, {}) }));
  const usage = r.data?.usage || {};
  const fr = choice.finish_reason || '';
  let stop = 'end';
  if (toolCalls.length || fr === 'tool_calls') stop = 'tool';
  else if (fr === 'length') stop = 'length';
  else if (fr === 'content_filter') stop = 'safety';
  return {
    text: typeof msg.content === 'string' ? msg.content.trim() || null : null,
    toolCalls,
    usage: {
      inputTokens: usage.prompt_tokens || 0,
      outputTokens: usage.completion_tokens || 0,
      totalTokens: usage.total_tokens || ((usage.prompt_tokens || 0) + (usage.completion_tokens || 0)),
    },
    stop,
  };
}

async function validateKey(apiKey, profile = {}) {
  try {
    const r = await axios.get(`${baseUrl(profile)}/models`, { headers: { Authorization: `Bearer ${apiKey || 'none'}` }, timeout: 15000 });
    const models = (r.data?.data || []).map(m => m.id).filter(Boolean).sort();
    return { ok: true, models: models.slice(0, 200) };
  } catch (e) {
    return { ok: false, message: e?.response?.data?.error?.message || e.message };
  }
}

module.exports = { chat, validateKey };
