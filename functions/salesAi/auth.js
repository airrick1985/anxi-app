// 銷控 AI 智能助理：身份驗證與能力矩陣（docs/銷控AI智能助理-spec.md §6.1）
// Why: 專案未使用 Firebase Auth（checkInToSystem 自訂驗證），比照 sendCustomEmail 用 userKey + sessionId 驗證；
//      能力由後端算，前端傳來的角色／權限一律不信任。

const { HttpsError } = require('firebase-functions/v2/https');

const ADMIN_ROLES = ['超級管理員', '系統管理員'];

async function authenticate(db, { userKey, sessionId }) {
  if (!userKey || !sessionId) throw new HttpsError('unauthenticated', '缺少身份資訊，請重新登入。');
  const snap = await db.collection('users').doc(String(userKey)).get();
  if (!snap.exists) throw new HttpsError('unauthenticated', '找不到使用者帳號。');
  const u = snap.data() || {};
  if (u.allowMultiLogin !== true && u.activeSessionId !== sessionId) {
    throw new HttpsError('unauthenticated', 'Session 已過期或無效，請重新登入。');
  }
  const roles = Array.isArray(u.roles) ? u.roles : [];
  return {
    userKey: String(userKey),
    sessionId,
    name: u.name || u.displayName || String(userKey),
    roles,
    isAdmin: roles.some(r => ADMIN_ROLES.includes(r)),
    isSuperAdmin: roles.includes('超級管理員'),
    isTrial: u.isTrial === true,
  };
}

/** 讀 userPermissions/{key}.permissions[projectId].systems */
async function loadProjectSystems(db, userKey, projectId) {
  const snap = await db.collection('userPermissions').doc(userKey).get();
  if (!snap.exists) return { systems: [], projectName: null };
  const p = snap.data()?.permissions?.[projectId];
  return { systems: Array.isArray(p?.systems) ? p.systems : [], projectName: p?.projectName || null };
}

/**
 * 能力矩陣
 * @returns {{ caps: Set<string>, systems: string[] }}
 */
async function computeCapabilities(db, user, projectId, projectAi) {
  const { systems } = await loadProjectSystems(db, user.userKey, projectId);
  const caps = new Set();
  const hasSales = user.isAdmin || systems.includes('銷控系統');
  if (hasSales) caps.add('sales.read');
  if (user.isAdmin || systems.includes('報價系統')) caps.add('quote.read');
  if (user.isAdmin || systems.some(s => String(s).startsWith('客資系統'))) caps.add('leads.read');
  if (user.isAdmin || systems.includes('請佣獎金')) caps.add('commission.read');

  if (hasSales && projectAi && projectAi.allowWrite === true) {
    const roles = Array.isArray(projectAi.writeRoles) ? projectAi.writeRoles.filter(Boolean) : [];
    const roleOk = user.isAdmin || roles.length === 0 || roles.some(r => user.roles.includes(r));
    if (roleOk) caps.add('sales.write');
  }
  if (caps.has('sales.write') && (projectAi.allowCancel === true || user.isAdmin)) caps.add('sales.cancel');
  return { caps, systems };
}

function requireSuperAdmin(user) {
  if (!user || !user.isSuperAdmin) throw new HttpsError('permission-denied', '此功能僅限超級管理員。');
}

module.exports = { authenticate, computeCapabilities, loadProjectSystems, requireSuperAdmin, ADMIN_ROLES };
