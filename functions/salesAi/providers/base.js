// 供應商抽象層共用（docs/銷控AI智能助理-spec.md §12.2）
//
// 內部訊息格式（與供應商無關）：
//   { role: 'user', content: string }
//   { role: 'assistant', content?: string, toolCalls?: [{ id, name, args }] }
//   { role: 'tool', toolCallId, name, result: object }
// 工具格式：{ name, description, parameters: JSONSchema }
// 回應：{ text, toolCalls: [{ id, name, args }], usage: { inputTokens, outputTokens, totalTokens }, stop: 'end'|'tool'|'length'|'safety'|'other', raw }

class ProviderError extends Error {
  constructor(message, { retryable = false, code = 'provider', status = null } = {}) {
    super(message);
    this.name = 'ProviderError';
    this.retryable = retryable;
    this.code = code;
    this.status = status;
  }
}

function isRetryableStatus(status) {
  return status === 429 || status === 500 || status === 502 || status === 503 || status === 504 || status === 529;
}

function errorFromAxios(e, providerLabel) {
  const status = e?.response?.status || null;
  const body = e?.response?.data;
  const detail = body?.error?.message || body?.message || (typeof body === 'string' ? body.slice(0, 300) : '') || e.message;
  if (status === 401 || status === 403) return new ProviderError(`${providerLabel} 金鑰無效或無權限：${detail}`, { code: 'auth', status });
  if (isRetryableStatus(status) || e.code === 'ECONNABORTED' || e.code === 'ETIMEDOUT') {
    return new ProviderError(`${providerLabel} 暫時無法服務（${status || e.code}）：${detail}`, { retryable: true, code: 'unavailable', status });
  }
  return new ProviderError(`${providerLabel} 錯誤（${status || e.code || '?'}）：${detail}`, { code: 'provider', status });
}

function safeJsonParse(s, fallback = {}) {
  if (s === null || s === undefined) return fallback;
  if (typeof s === 'object') return s;
  try { return JSON.parse(s); } catch { return fallback; }
}

function clampNumber(v, min, max, fallback) {
  const n = Number(v);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, n));
}

let idSeq = 0;
function newCallId(prefix = 'call') {
  idSeq += 1;
  return `${prefix}_${Date.now().toString(36)}_${idSeq}`;
}

module.exports = { ProviderError, errorFromAxios, safeJsonParse, clampNumber, newCallId, isRetryableStatus };
