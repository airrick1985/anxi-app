// 取得可接收通知的候選人員清單
// 預設條件：擁有指定 projectId 的「銷控系統」或「報價系統」權限，且至少有 lineId 或 email
//
// options（皆選填，預設行為與舊版相同）:
//   systems: string[]            以 array-contains-any 查詢的系統權限清單（預設 ['銷控系統','報價系統']）
//   excludeRoles: string[]       users.roles 含任一者即排除（例如 ['超級管理員']）
//   includeUnreachable: boolean  true 時連「無 LINE 也無 Email」者也回傳（供前端標示「無法通知」）

const { Firestore, FieldPath } = require('@google-cloud/firestore');

// 系統管理員帳號，不列入通知候選名單
const EXCLUDED_USER_KEYS = new Set(['60763998']);

async function getEligibleRecipients(projectId, dbInstance, options = {}) {
  const db = dbInstance || new Firestore({ databaseId: 'anxi-app' });
  const systems = Array.isArray(options.systems) && options.systems.length > 0
    ? options.systems
    : ['銷控系統', '報價系統'];
  const excludeRoles = Array.isArray(options.excludeRoles) ? options.excludeRoles : [];
  const includeUnreachable = options.includeUnreachable === true;

  const permSnap = await db.collection('userPermissions')
    .where(`permissions.${projectId}.systems`, 'array-contains-any', systems)
    .get();

  if (permSnap.empty) return [];

  const userKeys = permSnap.docs
    .map(d => d.id)
    .filter(k => !EXCLUDED_USER_KEYS.has(k));

  if (userKeys.length === 0) return [];

  // documentId in (...) 上限 30 個，分批查
  const chunks = [];
  for (let i = 0; i < userKeys.length; i += 30) {
    chunks.push(userKeys.slice(i, i + 30));
  }

  const userDocs = [];
  for (const chunk of chunks) {
    const snap = await db.collection('users')
      .where(FieldPath.documentId(), 'in', chunk)
      .get();
    snap.forEach(d => userDocs.push(d));
  }

  return userDocs
    .filter(d => d.exists)
    .map(d => {
      const data = d.data() || {};
      const lineId = typeof data.lineId === 'string' ? data.lineId : '';
      const email = typeof data.email === 'string' ? data.email : '';
      const roles = Array.isArray(data.roles) ? data.roles : [];
      return {
        userKey: d.id,
        name: data.name || d.id,
        email: email || null,
        hasLine: lineId.startsWith('U'),
        hasEmail: !!email,
        roles,
      };
    })
    .filter(r => excludeRoles.length === 0 || !r.roles.some(role => excludeRoles.includes(role)))
    .filter(r => includeUnreachable || r.hasLine || r.hasEmail)
    .map(({ roles, ...rest }) => rest);
}

module.exports = { getEligibleRecipients };
