// LINE AI 助理：工作台 API（lineAiApi）
// actions：init | listConversations | getConversation | loadMessages | markRead | generate | send
//          listProjects | searchCustomers | linkCustomer | claim | updateMemory | refreshMemory | mediaUrl
//          listSources | addDriveSource | removeSource | dropboxAuthUrl | dropboxDisconnect

const { HttpsError } = require('firebase-functions/v2/https');
const { getStorage } = require('firebase-admin/storage');
const { getDb, COL, FieldValue, Timestamp, toIso } = require('./db');
const S = require('./settings');
const { authenticate, canView, hasCrmAccess, loadPermissions } = require('./auth');
const C = require('./conversations');
const { generate, stylesFor } = require('./assist');
const { updateMemory } = require('./memory');
const { checkRate } = require('./models');
const { clientForChannel, friendlySendError } = require('./line');
const { getCustomer, customerBrief, searchCustomers } = require('./customers');
const sources = require('./sources');

const PAGE_SIZE = 50;
const MAX_SEND_CHARS = 5000;

function str(v, max = 200) { return String(v ?? '').trim().slice(0, max); }

async function loadConversation(user, global, conversationId) {
  const id = str(conversationId, 300);
  if (!id || id.includes('/')) throw new HttpsError('invalid-argument', '缺少對話');
  const ref = C.conversationRef(id);
  const snap = await ref.get();
  const conv = snap.exists ? { id: snap.id, ...snap.data() } : null;
  if (!conv || !canView(user, conv, global)) throw new HttpsError('permission-denied', '找不到對話或沒有權限');
  const channel = await S.getChannel(conv.channelId);
  const agent = await S.resolveAgent(conv, channel);
  return { ref, conv, channel, agent };
}

async function loadMessages(ref, user, before) {
  let q = ref.collection(COL.messages).orderBy('createdAt', 'desc');
  if (before) {
    const ms = new Date(before).getTime();
    if (!Number.isNaN(ms)) q = q.where('createdAt', '<', Timestamp.fromMillis(ms));
  }
  const snap = await q.limit(PAGE_SIZE + 1).get();
  const docs = snap.docs.slice(0, PAGE_SIZE).map(d => ({ id: d.id, ...d.data() })).reverse();
  return { messages: docs.map(m => C.serializeMessage(m, user)), hasMore: snap.size > PAGE_SIZE };
}

function viewerKeysOf(conv, assignedKey) {
  return [...new Set([...(conv.manualViewerKeys || []), assignedKey].filter(Boolean))];
}

async function crmProjects(user) {
  const snap = await getDb().collection('projects').get();
  const all = snap.docs.map(d => ({ id: d.id, name: d.data().name || d.data().projectName || d.id }));
  if (user.isAdmin) return all;
  const perms = await loadPermissions(user);
  return all.filter(p => (perms?.[p.id]?.systems || []).some(s => String(s).startsWith('客資系統')));
}

async function conversationDetail(user, global, { ref, conv, channel, agent }) {
  await C.refreshStaffMapping(ref, conv);
  const [page, styles, available, customer, project, projects] = await Promise.all([
    loadMessages(ref, user, null),
    agent ? stylesFor(agent) : [],
    agent ? sources.availableFor(user, agent) : [],
    conv.customerId ? getCustomer(conv.customerId) : null,
    conv.projectId ? getDb().collection('projects').doc(conv.projectId).get() : null,
    crmProjects(user),
  ]);
  const members = Object.entries(conv.members || {})
    .map(([lineId, m]) => ({ lineId, name: m?.name || '成員', pictureUrl: m?.pictureUrl || null, isStaff: !!m?.userKey, isMe: !!user.lineId && lineId === user.lineId }))
    .sort((a, b) => Number(b.isStaff) - Number(a.isStaff) || a.name.localeCompare(b.name, 'zh-Hant'));
  return {
    conversation: C.serializeConversation(conv, user, {
      channelName: channel?.displayName || channel?.name || '',
      summary: conv.summary || '',
      facts: conv.facts || [],
      summaryUpdatedAt: toIso(conv.summaryUpdatedAt),
      projectName: project?.exists ? (project.data().name || conv.projectId) : null,
      customer: customer ? customerBrief(customer) : null,
      members: conv.type === 'user' ? [] : members,
    }),
    ...page,
    agent: agent ? { id: agent.id, name: agent.name, sendMode: agent.sendMode || 'manual' } : null,
    styles: styles.map(s => ({ id: s.id, name: s.name })),
    defaultStyleId: agent?.defaultStyleId || null,
    sources: available.map(sources.serializeSource),
    projects,
    canClaim: conv.type === 'user' && conv.assignState !== 'assigned' && (user.isSuperAdmin || global.claimerKeys.includes(user.userKey)),
  };
}

async function handleApi(request) {
  const data = request.data || {};
  const user = await authenticate(data);
  if (user.isTrial) throw new HttpsError('permission-denied', '試用帳號無法使用 LINE AI 助理。');
  const global = await S.getGlobal();

  switch (data.action) {
    case 'init': {
      const [dbx, email] = await Promise.all([sources.dropbox.status(user.userKey), sources.drive.serviceAccountEmail()]);
      return {
        status: 'success',
        me: { userKey: user.userKey, name: user.name, lineBound: !!user.lineId, isSuperAdmin: user.isSuperAdmin },
        canClaim: user.isSuperAdmin || global.claimerKeys.includes(user.userKey),
        dropbox: dbx,
        serviceAccountEmail: email,
      };
    }

    case 'listConversations': {
      const [convs, channels] = await Promise.all([C.listVisible(user, global), S.listChannels()]);
      const names = new Map(channels.map(c => [c.id, c.displayName || c.name]));
      return { status: 'success', conversations: convs.slice(0, 300).map(c => C.serializeConversation(c, user, { channelName: names.get(c.channelId) || '' })) };
    }

    case 'getConversation': {
      const ctx = await loadConversation(user, global, data.conversationId);
      return { status: 'success', ...(await conversationDetail(user, global, ctx)) };
    }

    case 'loadMessages': {
      const { ref } = await loadConversation(user, global, data.conversationId);
      return { status: 'success', ...(await loadMessages(ref, user, data.before)) };
    }

    case 'markRead': {
      const { ref } = await loadConversation(user, global, data.conversationId);
      await ref.update({ [`readAt.${user.userKey}`]: FieldValue.serverTimestamp() });
      return { status: 'success' };
    }

    case 'generate': {
      const { conv, agent } = await loadConversation(user, global, data.conversationId);
      await checkRate(user, Math.max(1, Number(global.perUserPerMinute) || 20));
      const mode = data.mode === 'polish' ? 'polish' : 'suggest';
      const r = await generate({
        me: user, conv, agent, mode, global,
        styleId: str(data.styleId, 60) || null,
        text: str(data.text, 4000),
        instruction: str(data.instruction, 1000),
        sourceIds: Array.isArray(data.sourceIds) ? data.sourceIds.slice(0, 10).map(String) : [],
      });
      return { status: 'success', text: r.text, styleId: r.styleId, cited: r.cited };
    }

    case 'send': {
      const { ref, conv, channel, agent } = await loadConversation(user, global, data.conversationId);
      if (!agent || !['bot', 'both'].includes(agent.sendMode)) throw new HttpsError('failed-precondition', '這段對話不開放由官方帳號代發。');
      if (!channel || channel.enabled === false) throw new HttpsError('failed-precondition', '官方帳號已停用。');
      if (conv.active === false) throw new HttpsError('failed-precondition', conv.type === 'user' ? '對方已封鎖官方帳號。' : '官方帳號已不在這個群組。');
      const text = String(data.text || '').trim();
      if (!text) throw new HttpsError('invalid-argument', '訊息不可空白。');
      if (text.length > MAX_SEND_CHARS) throw new HttpsError('invalid-argument', `訊息最多 ${MAX_SEND_CHARS} 字。`);
      try {
        const client = await clientForChannel(channel.id);
        await client.push(conv.lineSourceId, [{ type: 'text', text }]);
      } catch (e) {
        throw new HttpsError('failed-precondition', friendlySendError(e));
      }
      const now = Timestamp.now();
      const msgRef = ref.collection(COL.messages).doc(`sent_${now.toMillis()}_${user.userKey}`);
      const msg = { type: 'text', text, senderLineId: null, senderName: channel.displayName || channel.name || '官方帳號', senderRole: 'bot', sentByUserKey: user.userKey, sentByName: user.name, createdAt: now };
      await msgRef.set(msg);
      await ref.update({
        lastMessageAt: now, lastMessagePreview: C.messagePreview(msg), lastSenderName: msg.senderName, lastSenderRole: 'bot',
        messageCount: FieldValue.increment(1), pendingSummary: FieldValue.increment(1), notifyDueAt: null,
        [`readAt.${user.userKey}`]: now,
      });
      return { status: 'success', message: C.serializeMessage({ id: msgRef.id, ...msg }, user) };
    }

    case 'listProjects':
      return { status: 'success', projects: await crmProjects(user) };

    case 'searchCustomers': {
      const projectId = str(data.projectId, 100);
      if (!(await hasCrmAccess(user, projectId))) throw new HttpsError('permission-denied', '沒有這個建案的客資權限');
      return { status: 'success', customers: await searchCustomers(projectId, str(data.q, 50)) };
    }

    case 'linkCustomer': {
      const { ref, conv } = await loadConversation(user, global, data.conversationId);
      const projectId = str(data.projectId, 100) || null;
      const customerId = str(data.customerId, 200) || null;
      if (projectId && !(await hasCrmAccess(user, projectId))) throw new HttpsError('permission-denied', '沒有這個建案的客資權限');
      const patch = { projectId, customerId: null, customerName: null };
      if (customerId) {
        if (!projectId) throw new HttpsError('invalid-argument', '請先選擇建案');
        const c = await getCustomer(customerId);
        if (!c || !(c.allProjectIds || [c.projectId]).includes(projectId)) throw new HttpsError('not-found', '找不到這位客戶');
        patch.customerId = c.id;
        patch.customerName = c.latestName || null;
        // 一對一：負責業務自動成為可看的人
        if (conv.type === 'user' && c.latestSalesPhone) {
          patch.assignedKey = String(c.latestSalesPhone);
          patch.viewerKeys = viewerKeysOf(conv, patch.assignedKey);
          patch.assignState = 'assigned';
        }
      }
      await ref.update(patch);
      return { status: 'success' };
    }

    case 'claim': {
      const { ref, conv } = await loadConversation(user, global, data.conversationId);
      if (conv.type !== 'user') throw new HttpsError('failed-precondition', '只有一對一對話需要認領');
      if (!(user.isSuperAdmin || global.claimerKeys.includes(user.userKey))) throw new HttpsError('permission-denied', '沒有認領權限');
      const assignedKey = data.assignTo ? str(data.assignTo, 100) : user.userKey;
      await ref.update({ assignedKey, viewerKeys: viewerKeysOf(conv, assignedKey), assignState: 'assigned' });
      return { status: 'success' };
    }

    case 'updateMemory': {
      const { ref } = await loadConversation(user, global, data.conversationId);
      const facts = (Array.isArray(data.facts) ? data.facts : []).map(f => str(f, 200)).filter(Boolean).slice(0, 20);
      await ref.update({ summary: str(data.summary, 1500), facts, memoryEditedBy: user.name, memoryEditedAt: FieldValue.serverTimestamp() });
      return { status: 'success' };
    }

    case 'refreshMemory': {
      const { ref, conv, agent } = await loadConversation(user, global, data.conversationId);
      if (!agent) throw new HttpsError('failed-precondition', '這段對話尚未指定 AI Agent');
      await checkRate(user, Math.max(1, Number(global.perUserPerMinute) || 20));
      try {
        const updated = await updateMemory(ref, conv, agent);
        const fresh = (await ref.get()).data();
        return { status: 'success', updated, summary: fresh.summary || '', facts: fresh.facts || [], summaryUpdatedAt: toIso(fresh.summaryUpdatedAt) };
      } catch (e) {
        throw new HttpsError('internal', `整理記憶失敗：${e.message}`);
      }
    }

    case 'mediaUrl': {
      const { ref } = await loadConversation(user, global, data.conversationId);
      const snap = await ref.collection(COL.messages).doc(str(data.messageId, 100)).get();
      const path = snap.exists ? snap.data().media?.path : null;
      if (!path) throw new HttpsError('not-found', '檔案已不存在');
      const [url] = await getStorage().bucket().file(path).getSignedUrl({ action: 'read', expires: Date.now() + 15 * 60 * 1000 });
      return { status: 'success', url };
    }

    case 'listSources': {
      const [own, dbx] = await Promise.all([sources.listOwn(user.userKey), sources.dropbox.status(user.userKey)]);
      return { status: 'success', sources: own.map(sources.serializeSource), dropbox: dbx };
    }

    case 'addDriveSource': {
      try {
        const s = await sources.addDrive({ ownerKey: user.userKey, link: data.link, name: data.name });
        return { status: 'success', source: sources.serializeSource(s) };
      } catch (e) {
        throw new HttpsError('failed-precondition', e.message);
      }
    }

    case 'removeSource': {
      const ref = getDb().collection(COL.sources).doc(str(data.sourceId, 100));
      const snap = await ref.get();
      if (!snap.exists) return { status: 'success' };
      if (snap.data().ownerKey !== user.userKey && !user.isSuperAdmin) throw new HttpsError('permission-denied', '只能移除自己的資料來源');
      if (snap.data().type === 'dropbox' && snap.data().ownerKey === user.userKey && snap.data().shared !== true) {
        await sources.dropbox.disconnect(user.userKey);
      } else {
        await ref.delete();
      }
      return { status: 'success' };
    }

    case 'dropboxAuthUrl': {
      try {
        return { status: 'success', url: await sources.dropbox.authUrl(user.userKey) };
      } catch (e) {
        throw new HttpsError('failed-precondition', e.message);
      }
    }

    case 'dropboxDisconnect':
      await sources.dropbox.disconnect(user.userKey);
      return { status: 'success' };

    default:
      throw new HttpsError('invalid-argument', `未知的 action：${data.action}`);
  }
}

module.exports = { handleApi, viewerKeysOf };
