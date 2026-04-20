// 取得可接收銷控通知的候選人員清單
// 條件：擁有指定 projectId 的「銷控系統」或「報價系統」權限，且至少有 lineId 或 email

const { Firestore, FieldPath } = require('@google-cloud/firestore');

// 系統管理員帳號，不列入銷控通知候選名單
const EXCLUDED_USER_KEYS = new Set(['60763998']);

async function getEligibleRecipients(projectId, dbInstance) {
  const db = dbInstance || new Firestore({ databaseId: 'anxi-app' });

  const permSnap = await db.collection('userPermissions')
    .where(`permissions.${projectId}.systems`, 'array-contains-any', ['銷控系統', '報價系統'])
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
      return {
        userKey: d.id,
        name: data.name || d.id,
        email: email || null,
        hasLine: lineId.startsWith('U'),
        hasEmail: !!email,
      };
    })
    .filter(r => r.hasLine || r.hasEmail);
}

module.exports = { getEligibleRecipients };
