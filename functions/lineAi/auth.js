// LINE AI 助理：身分驗證與權限
// 網頁版：userKey + sessionId（與 salesAi 相同）；LINE 內頁面：LIFF access token → users.lineId
// 前端傳來的角色、權限一律不信任。

const axios = require('axios');
const { HttpsError } = require('firebase-functions/v2/https');
const { getDb } = require('./db');
const { getGlobal } = require('./settings');

const ADMIN_ROLES = ['超級管理員', '系統管理員'];

function toUser(userKey, u, sessionId = null) {
  const roles = Array.isArray(u.roles) ? u.roles : [];
  return {
    userKey: String(userKey),
    sessionId,
    name: u.name || u.displayName || String(userKey),
    roles,
    lineId: typeof u.lineId === 'string' && u.lineId.startsWith('U') ? u.lineId : null,
    isAdmin: roles.some(r => ADMIN_ROLES.includes(r)),
    isSuperAdmin: roles.includes('超級管理員'),
    isTrial: u.isTrial === true,
  };
}

async function authenticateSession(db, userKey, sessionId) {
  if (!userKey || !sessionId) throw new HttpsError('unauthenticated', '缺少身分資訊，請重新登入。');
  const snap = await db.collection('users').doc(String(userKey)).get();
  if (!snap.exists) throw new HttpsError('unauthenticated', '找不到使用者帳號。');
  const u = snap.data() || {};
  if (u.disabled === true) throw new HttpsError('permission-denied', '帳號已停用。');
  if (u.allowMultiLogin !== true && u.activeSessionId !== sessionId) {
    throw new HttpsError('unauthenticated', '登入已過期，請重新登入。');
  }
  return toUser(snap.id, u, sessionId);
}

async function authenticateLiff(db, accessToken) {
  if (typeof accessToken !== 'string' || accessToken.length > 4096) throw new HttpsError('unauthenticated', 'LINE 驗證資料不完整。');
  const g = await getGlobal();
  let lineId;
  try {
    const verified = await axios.get('https://api.line.me/oauth2/v2.1/verify', { params: { access_token: accessToken }, timeout: 8000 });
    if (String(verified.data.client_id) !== String(g.liffChannelId) || !(verified.data.expires_in > 0)) {
      throw new HttpsError('unauthenticated', 'LINE 登入已失效，請重新開啟。');
    }
    const profile = await axios.get('https://api.line.me/v2/profile', { headers: { Authorization: `Bearer ${accessToken}` }, timeout: 8000 });
    lineId = profile.data.userId;
  } catch (e) {
    if (e instanceof HttpsError) throw e;
    // 不記錄 axios error：config 內含 access token
    if ([400, 401, 403].includes(e.response?.status)) throw new HttpsError('unauthenticated', 'LINE 登入已失效，請重新開啟。');
    throw new HttpsError('unavailable', 'LINE 驗證服務暫時無法連線，請稍後再試。');
  }
  if (typeof lineId !== 'string' || !lineId.startsWith('U')) throw new HttpsError('unauthenticated', '無法驗證 LINE 身分。');
  const users = await db.collection('users').where('lineId', '==', lineId).limit(2).get();
  if (users.size !== 1) throw new HttpsError('permission-denied', '這個 LINE 尚未綁定唯一的員工帳號。');
  const doc = users.docs[0];
  if (doc.data()?.disabled === true) throw new HttpsError('permission-denied', '帳號已停用。');
  return toUser(doc.id, doc.data());
}

async function authenticate(data) {
  const db = getDb();
  if (data && data.liffAccessToken) return authenticateLiff(db, data.liffAccessToken);
  return authenticateSession(db, data?.userKey, data?.sessionId);
}

function requireSuperAdmin(user) {
  if (!user?.isSuperAdmin) throw new HttpsError('permission-denied', '此功能僅限超級管理員。');
}

/** userPermissions/{key}.permissions：{ [projectId]: { projectName, systems[] } } */
async function loadPermissions(user) {
  if (user._permissions) return user._permissions;
  const snap = await getDb().collection('userPermissions').doc(user.userKey).get();
  user._permissions = (snap.exists && snap.data()?.permissions) || {};
  return user._permissions;
}

async function hasCrmAccess(user, projectId) {
  if (user.isAdmin) return true;
  const perms = await loadPermissions(user);
  const systems = perms?.[projectId]?.systems || [];
  return systems.some(s => String(s).startsWith('客資系統'));
}

/** 可看這段對話：超級管理員；群組成員；指定的檢視者（含一對一的負責業務）；待認領的一對一給認領人員 */
function canView(user, conv, global) {
  if (!conv) return false;
  if (user.isSuperAdmin) return true;
  if (user.lineId && conv.type !== 'user' && (conv.memberLineIds || []).includes(user.lineId)) return true;
  if ((conv.viewerKeys || []).includes(user.userKey)) return true;
  if (conv.type === 'user' && conv.assignState !== 'assigned' && (global.claimerKeys || []).includes(user.userKey)) return true;
  return false;
}

module.exports = { authenticate, requireSuperAdmin, loadPermissions, hasCrmAccess, canView, ADMIN_ROLES };
