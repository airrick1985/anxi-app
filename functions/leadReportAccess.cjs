// LINE 名單回報：身分一律由 LINE token 驗證取得，不採信前端傳入的 lineId / userKey。
const CHANNEL_ID = '2008257338';
const DEFAULT_STATUSES = ['不考慮', '已約賞屋', '還在討論', '空號', '未接'];

function canReportLead(userKey, user, permissions, lead) {
  if (!lead || lead.isDeleted || user.disabled === true) return false;
  const roles = user.roles || [];
  if (roles.includes('系統管理員') || roles.includes('超級管理員')) return true;
  const systems = permissions?.[lead.projectId]?.systems || [];
  if (systems.includes('客資系統-櫃台')) return true;
  return (systems.includes('客資系統-銷售') || systems.includes('客資系統')) && lead.assignedTo === userKey;
}
function serialize(value) {
  if (value?.toDate) return value.toDate().toISOString();
  if (value instanceof Date) return value.toISOString();
  if (Array.isArray(value)) return value.map(serialize);
  if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).map(([key, val]) => [key, serialize(val)]));
  return value;
}
function createLeadReportHandler({ db, axios, HttpsError, FieldValue }) {
  return async ({ data = {} }) => {
    const { leadId, accessToken, action = 'load' } = data;
    if (typeof leadId !== 'string' || !leadId || leadId.length > 200 || leadId.includes('/') ||
        typeof accessToken !== 'string' || !accessToken || accessToken.length > 4096 || !['load', 'submit'].includes(action)) {
      throw new HttpsError('invalid-argument', '名單連結或 LINE 驗證資料不完整。');
    }
    let lineId;
    try {
      const verified = await axios.get('https://api.line.me/oauth2/v2.1/verify', {
        params: { access_token: accessToken }, timeout: 8000,
      });
      if (String(verified.data.client_id) !== CHANNEL_ID || !(verified.data.expires_in > 0)) {
        throw new HttpsError('unauthenticated', 'LINE 登入已失效，請重新從通知開啟。');
      }
      const profile = await axios.get('https://api.line.me/v2/profile', {
        headers: { Authorization: `Bearer ${accessToken}` }, timeout: 8000,
      });
      lineId = profile.data.userId;
      if (typeof lineId !== 'string' || !lineId.startsWith('U')) throw new HttpsError('unauthenticated', '無法驗證 LINE 身分。');
    } catch (error) {
      if (error instanceof HttpsError) throw error;
      // 不記錄 axios error：它的 config 包含 access token。
      if ([400, 401, 403].includes(error.response?.status)) throw new HttpsError('unauthenticated', 'LINE 登入已失效，請重新從通知開啟。');
      throw new HttpsError('unavailable', 'LINE 驗證服務暫時無法連線，請稍後重試。');
    }
    const users = await db.collection('users').where('lineId', '==', lineId).limit(2).get();
    if (users.size !== 1) throw new HttpsError('permission-denied', '此 LINE 尚未綁定唯一的員工帳號，請聯絡管理員。');
    const userDoc = users.docs[0];
    const user = userDoc.data();
    const userKey = userDoc.id;
    const leadRef = db.collection('leads').doc(leadId);
    const permissionRef = db.collection('userPermissions').doc(userKey);
    const [leadSnap, permissionSnap] = await Promise.all([leadRef.get(), permissionRef.get()]);
    const lead = leadSnap.data();
    const permissions = permissionSnap.data()?.permissions || {};
    if (!canReportLead(userKey, user, permissions, lead)) {
      throw new HttpsError('permission-denied', '您目前無權回報此名單，名單可能已重新分配或移除。');
    }
    const settingsSnap = await db.collection('projectSettings').doc(lead.projectId).get();
    const settings = settingsSnap.data() || {};
    const statuses = settings.statusOptions?.length ? settings.statusOptions : DEFAULT_STATUSES;
    if (action === 'submit') {
      const { report, requestId } = data;
      if (!report || !statuses.includes(report.status) || typeof report.note !== 'string' || report.note.length > 10000 ||
          typeof report.reason !== 'string' || report.reason.length > 500 || !/^[a-zA-Z0-9-]{16,80}$/.test(requestId || '')) {
        throw new HttpsError('invalid-argument', '請確認聯絡結果與回報內容。');
      }
      const logRef = leadRef.collection('contactLogs').doc(requestId);
      await db.runTransaction(async tx => {
        // 送出前重新確認名單歸屬、LINE 綁定與權限；回報與更新狀態一次完成。
        const [currentLead, currentUser, currentPermissions, existing] = await Promise.all([
          tx.get(leadRef), tx.get(userDoc.ref), tx.get(permissionRef), tx.get(logRef),
        ]);
        if (!currentUser.exists || currentUser.data().lineId !== lineId ||
            !canReportLead(userKey, currentUser.data(), currentPermissions.data()?.permissions, currentLead.data())) {
          throw new HttpsError('permission-denied', '此名單的權限已變更，請重新開啟通知。');
        }
        if (existing.exists) return; // 網路重試不重複寫入日誌
        tx.update(leadRef, { status: report.status, reason: report.reason, lastReportedAt: FieldValue.serverTimestamp() });
        tx.set(logRef, { status: report.status, reason: report.reason, note: report.note,
          createdBy: user.name || userKey, createdByKey: userKey, createdAt: FieldValue.serverTimestamp() });
      });
      return { status: 'saved' };
    }
    // 次要資訊失败不阻擋已驗證的回報表單，也不要求額外複合索引。
    const [logs, reservations] = await Promise.allSettled([
      leadRef.collection('contactLogs').orderBy('createdAt', 'desc').limit(100).get(),
      lead.phone ? db.collection('viewing_reservations').where('projectId', '==', lead.projectId).where('customerPhone', '==', lead.phone).get() : Promise.resolve({ docs: [] }),
    ]);
    const safeLead = Object.fromEntries(['name', 'phone', 'projectId', 'source', 'budget', 'date', 'note'].map(key => [key, lead[key] ?? '']));
    return serialize({
      lead: { ...safeLead, id: leadId },
      user: { key: userKey, phone: user.phone || userKey, name: user.name || '', roles: user.roles || [], permissions: { [lead.projectId]: permissions[lead.projectId] || {} } },
      projectName: permissions[lead.projectId]?.projectName || lead.projectName || lead.projectId,
      statusOptions: statuses, reasonOptions: settings.reasonOptions || [],
      logs: logs.status === 'fulfilled' ? logs.value.docs.map(doc => doc.data()) : [],
      reservations: reservations.status === 'fulfilled' ? reservations.value.docs.map(doc => ({ ...doc.data(), id: doc.id })).filter(item => item.status === 'active') : [],
      detailsIncomplete: logs.status === 'rejected' || reservations.status === 'rejected',
    });
  };
}
module.exports = { canReportLead, createLeadReportHandler };
