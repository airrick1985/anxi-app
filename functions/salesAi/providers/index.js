// 供應商工廠
const gemini = require('./gemini');
const openai = require('./openai');
const anthropic = require('./anthropic');
const { ProviderError } = require('./base');

const PROVIDERS = {
  gemini,
  openai,
  'openai-compatible': openai,
  anthropic,
};

const PROVIDER_META = {
  gemini: { label: 'Google Gemini', defaultSecret: 'SALES_BOT_GEMINI_KEY', suggestedModels: ['gemini-2.5-flash', 'gemini-2.5-pro', 'gemini-3-flash-preview'] },
  openai: { label: 'OpenAI', defaultSecret: 'OPENAI_API_KEY', suggestedModels: ['gpt-5', 'gpt-5-mini', 'gpt-4.1', 'gpt-4.1-mini'] },
  anthropic: { label: 'Anthropic Claude', defaultSecret: 'ANTHROPIC_API_KEY', suggestedModels: ['claude-sonnet-5', 'claude-opus-5', 'claude-haiku-4-5-20251001'] },
  'openai-compatible': { label: 'OpenAI 相容端點（自架／代理）', defaultSecret: 'OPENAI_COMPAT_API_KEY', suggestedModels: [] },
};

function getProvider(name) {
  const p = PROVIDERS[name];
  if (!p) throw new ProviderError(`不支援的供應商：${name}`, { code: 'config' });
  return p;
}

module.exports = { getProvider, PROVIDER_META, ProviderError };
