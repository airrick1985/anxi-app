// Anthropic Messages API adapter（axios 直呼，不加 SDK）
const axios = require('axios');
const { ProviderError, errorFromAxios, clampNumber } = require('./base');

const API = 'https://api.anthropic.com/v1';
const VERSION = '2023-06-01';

function toMessages(messages) {
  const out = [];
  for (const m of messages) {
    if (m.role === 'user') {
      out.push({ role: 'user', content: [{ type: 'text', text: m.content || '(空白)' }] });
    } else if (m.role === 'assistant') {
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
  const thinking = profile.thinking || 'off';
  if (thinking !== 'off') {
    const budget = { low: 1024, medium: 4096, high: 16000 }[thinking] || 1024;
    body.thinking = { type: 'enabled', budget_tokens: Math.min(budget, Math.max(1024, maxTokens - 512)) };
    if (body.max_tokens <= body.thinking.budget_tokens) body.max_tokens = body.thinking.budget_tokens + 1024;
    // 開啟 thinking 時不可設 temperature
  } else {
    body.temperature = clampNumber(profile.temperature, 0, 1, 0.2);
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

module.exports = { chat, validateKey };
