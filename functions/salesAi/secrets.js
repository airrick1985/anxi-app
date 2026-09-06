// 銷控 AI 智能助理：API 金鑰存取（Secret Manager）
// docs/銷控AI智能助理-spec.md §12.3
// Why: 金鑰由超級管理員在 UI 更新，不能靠部署時綁定的 secrets；
//      執行期讀 Secret Manager 最新版本並快取 10 分鐘，環境變數作為回退（相容既有 SALES_BOT_GEMINI_KEY）。

const { SecretManagerServiceClient } = require('@google-cloud/secret-manager');

const CACHE_TTL_MS = 10 * 60 * 1000;
const cache = new Map(); // name -> { value, at }
let client = null;

function getClient() {
  if (!client) client = new SecretManagerServiceClient();
  return client;
}

function gcpProjectId() {
  return process.env.GCLOUD_PROJECT || process.env.GCP_PROJECT || process.env.PROJECT_ID || '';
}

function secretPath(name) {
  return `projects/${gcpProjectId()}/secrets/${name}`;
}

/** 讀取金鑰：快取 → Secret Manager latest → 環境變數 */
async function getSecret(name) {
  if (!name) return '';
  const hit = cache.get(name);
  if (hit && Date.now() - hit.at < CACHE_TTL_MS) return hit.value;

  let value = '';
  try {
    const [version] = await getClient().accessSecretVersion({ name: `${secretPath(name)}/versions/latest` });
    value = version?.payload?.data ? Buffer.from(version.payload.data).toString('utf8').trim() : '';
  } catch (e) {
    // 找不到或無權限：回退環境變數（部署時 secrets: [...] 綁定者）
    value = (process.env[name] || '').trim();
    if (!value) console.warn(`[salesAi/secrets] 讀取 ${name} 失敗且無環境變數回退: ${e.message}`);
  }
  if (value) cache.set(name, { value, at: Date.now() });
  return value;
}

/** 寫入新版本（不存在則建立密鑰）；成功後停用舊版本並清快取 */
async function setSecret(name, value) {
  if (!/^[A-Za-z0-9_-]{1,255}$/.test(name)) throw new Error('密鑰名稱只能含英數、底線、連字號');
  if (!value || typeof value !== 'string') throw new Error('金鑰內容不可為空');
  const c = getClient();
  const parent = `projects/${gcpProjectId()}`;
  try {
    await c.getSecret({ name: secretPath(name) });
  } catch (e) {
    await c.createSecret({ parent, secretId: name, secret: { replication: { automatic: {} } } });
  }
  const [version] = await c.addSecretVersion({ parent: secretPath(name), payload: { data: Buffer.from(value.trim(), 'utf8') } });
  // 停用舊版本（盡力而為）
  try {
    const [versions] = await c.listSecretVersions({ parent: secretPath(name), filter: 'state:ENABLED' });
    for (const v of versions || []) {
      if (v.name !== version.name) await c.disableSecretVersion({ name: v.name }).catch(() => {});
    }
  } catch (e) { /* ignore */ }
  cache.delete(name);
  return { version: version.name.split('/').pop() };
}

/** 狀態（不回傳內容） */
async function getSecretStatus(name) {
  try {
    const [versions] = await getClient().listSecretVersions({ parent: secretPath(name), filter: 'state:ENABLED' });
    const latest = (versions || [])[0];
    if (latest) {
      const sec = latest.createTime?.seconds ? Number(latest.createTime.seconds) * 1000 : null;
      return { exists: true, source: 'secret-manager', updatedAt: sec ? new Date(sec).toISOString() : null };
    }
  } catch (e) { /* fallthrough */ }
  if (process.env[name]) return { exists: true, source: 'env', updatedAt: null };
  return { exists: false, source: null, updatedAt: null };
}

function clearCache() { cache.clear(); }

module.exports = { getSecret, setSecret, getSecretStatus, clearCache };
