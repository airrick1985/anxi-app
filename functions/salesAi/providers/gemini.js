// Gemini adapter（既有 @google/generative-ai SDK）
const axios = require('axios');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { ProviderError, safeJsonParse, clampNumber, newCallId } = require('./base');

const TYPE_MAP = { string: 'STRING', number: 'NUMBER', integer: 'INTEGER', boolean: 'BOOLEAN', array: 'ARRAY', object: 'OBJECT' };

/** JSON Schema → Gemini FunctionDeclaration schema（大寫 type、移除不支援鍵） */
function toGeminiSchema(schema) {
  if (!schema || typeof schema !== 'object') return undefined;
  const out = {};
  if (schema.type) out.type = TYPE_MAP[String(schema.type).toLowerCase()] || 'STRING';
  if (schema.description) out.description = schema.description;
  if (Array.isArray(schema.enum)) out.enum = schema.enum.map(String);
  if (schema.format) out.format = schema.format;
  if (schema.nullable) out.nullable = true;
  if (schema.properties) {
    out.properties = {};
    for (const [k, v] of Object.entries(schema.properties)) out.properties[k] = toGeminiSchema(v);
  }
  if (Array.isArray(schema.required) && schema.required.length) out.required = schema.required;
  if (schema.items) out.items = toGeminiSchema(schema.items);
  return out;
}

function toContents(messages) {
  const contents = [];
  for (const m of messages) {
    if (m.role === 'user') {
      contents.push({ role: 'user', parts: [{ text: m.content || '' }] });
    } else if (m.role === 'assistant') {
      // Gemini 3：functionCall 需帶回原始 thoughtSignature，直接回放模型原始 parts
      if (Array.isArray(m.rawParts) && m.rawParts.length) { contents.push({ role: 'model', parts: m.rawParts }); continue; }
      const parts = [];
      if (m.content) parts.push({ text: m.content });
      for (const tc of m.toolCalls || []) parts.push({ functionCall: { name: tc.name, args: tc.args || {} } });
      if (parts.length) contents.push({ role: 'model', parts });
    } else if (m.role === 'tool') {
      const part = { functionResponse: { name: m.name, response: wrapResponse(m.result) } };
      // 連續的 tool 結果併入同一則 user 訊息
      const last = contents[contents.length - 1];
      if (last && last.role === 'user' && last.parts.every(p => p.functionResponse)) last.parts.push(part);
      else contents.push({ role: 'user', parts: [part] });
    }
  }
  return contents;
}

// Gemini 要求 functionResponse.response 是物件
function wrapResponse(result) {
  if (result && typeof result === 'object' && !Array.isArray(result)) return result;
  return { result };
}

async function chat({ system, messages, tools, profile, apiKey }) {
  if (!apiKey) throw new ProviderError('Gemini 金鑰未設定', { code: 'auth' });
  const genAI = new GoogleGenerativeAI(apiKey);
  const generationConfig = {
    temperature: clampNumber(profile.temperature, 0, 2, 0.2),
    maxOutputTokens: clampNumber(profile.maxOutputTokens, 256, 65536, 2048),
  };
  const thinking = profile.thinking || 'off';
  // thinkingBudget 只適用 2.5 系列；Gemini 3 改用 thinkingLevel，這裡不強制設定
  if (/gemini-2\.5/.test(profile.model || '')) {
    const budget = { off: 0, low: 512, medium: 2048, high: 8192 }[thinking];
    if (budget !== undefined && !/pro/.test(profile.model)) generationConfig.thinkingConfig = { thinkingBudget: budget };
  }
  const model = genAI.getGenerativeModel({
    model: profile.model,
    systemInstruction: system ? { role: 'system', parts: [{ text: system }] } : undefined,
    generationConfig,
    tools: tools && tools.length
      ? [{ functionDeclarations: tools.map(t => ({ name: t.name, description: t.description, parameters: toGeminiSchema(t.parameters) })) }]
      : undefined,
  });

  let result;
  try {
    result = await model.generateContent({ contents: toContents(messages) });
  } catch (e) {
    const msg = e?.message || String(e);
    const status = e?.status || (/\[(\d{3})/.exec(msg) || [])[1];
    const code = Number(status);
    if (code === 401 || code === 403 || /API key/i.test(msg)) throw new ProviderError(`Gemini 金鑰無效：${msg}`, { code: 'auth', status: code });
    if (code === 429 || code === 503 || code === 500 || /overloaded|High demand|Too Many/i.test(msg)) {
      throw new ProviderError(`Gemini 暫時無法服務：${msg}`, { retryable: true, code: 'unavailable', status: code });
    }
    throw new ProviderError(`Gemini 錯誤：${msg}`, { code: 'provider', status: code });
  }

  const resp = result.response;
  const cand = resp?.candidates?.[0];
  const parts = cand?.content?.parts || [];
  const textParts = [];
  const toolCalls = [];
  for (const p of parts) {
    if (p.text && !p.thought) textParts.push(p.text);
    if (p.functionCall) toolCalls.push({ id: newCallId('gm'), name: p.functionCall.name, args: safeJsonParse(p.functionCall.args, {}) });
  }
  const usage = resp?.usageMetadata || {};
  const finish = cand?.finishReason || '';
  let stop = 'end';
  if (toolCalls.length) stop = 'tool';
  else if (finish === 'MAX_TOKENS') stop = 'length';
  else if (finish === 'SAFETY' || finish === 'RECITATION') stop = 'safety';
  return {
    text: textParts.join('\n').trim() || null,
    toolCalls,
    rawParts: parts,
    usage: {
      inputTokens: usage.promptTokenCount || 0,
      outputTokens: (usage.candidatesTokenCount || 0) + (usage.thoughtsTokenCount || 0),
      totalTokens: usage.totalTokenCount || 0,
    },
    stop,
    raw: undefined,
  };
}

async function validateKey(apiKey) {
  try {
    const r = await axios.get('https://generativelanguage.googleapis.com/v1beta/models', { params: { key: apiKey, pageSize: 50 }, timeout: 15000 });
    const models = (r.data?.models || []).map(m => String(m.name || '').replace(/^models\//, '')).filter(n => /gemini/.test(n));
    return { ok: true, models };
  } catch (e) {
    return { ok: false, message: e?.response?.data?.error?.message || e.message };
  }
}

module.exports = { chat, validateKey };
