// LINE AI 助理：加密存放在 Firestore 的第三方 token（Dropbox refresh token）
// 金鑰放 Secret Manager（LINEAI_ENC_KEY），第一次使用時自動產生。
const crypto = require('crypto');
const secrets = require('../salesAi/secrets');

const KEY_NAME = 'LINEAI_ENC_KEY';
let keyPromise = null;

async function loadKey() {
  let b64 = await secrets.getSecret(KEY_NAME);
  if (!b64) {
    b64 = crypto.randomBytes(32).toString('base64');
    await secrets.setSecret(KEY_NAME, b64);
  }
  const key = Buffer.from(b64, 'base64');
  if (key.length !== 32) throw new Error(`${KEY_NAME} 格式不正確`);
  return key;
}

function getKey() {
  if (!keyPromise) {
    keyPromise = loadKey();
    keyPromise.catch(() => { keyPromise = null; });
  }
  return keyPromise;
}

async function encrypt(text) {
  const key = await getKey();
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const data = Buffer.concat([cipher.update(String(text), 'utf8'), cipher.final()]);
  return Buffer.concat([iv, cipher.getAuthTag(), data]).toString('base64');
}

async function decrypt(payload) {
  const key = await getKey();
  const buf = Buffer.from(String(payload), 'base64');
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, buf.subarray(0, 12));
  decipher.setAuthTag(buf.subarray(12, 28));
  return Buffer.concat([decipher.update(buf.subarray(28)), decipher.final()]).toString('utf8');
}

module.exports = { encrypt, decrypt };
