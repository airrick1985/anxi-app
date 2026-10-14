// LINE AI 助理：對話（群組／多人聊天／一對一）與成員
// 文件 id：{官方帳號 id}_{groupId|roomId|userId}
// - members：{ [LINE userId]: { name, pictureUrl, userKey, at } }，userKey 有值代表是已綁定 LINE 的員工
// - memberLineIds：群組成員（含客戶），用來判斷員工是否在群組裡；一對一不放，改由 viewerKeys（負責業務）決定

const { getDb, COL, FieldValue, toIso, toMillis } = require('./db');

const STAFF_CACHE_MS = 10 * 60 * 1000;
const PROFILE_REFRESH_MS = 7 * 24 * 60 * 60 * 1000;
const staffCache = new Map(); // lineId -> { at, value: { userKey, name } | null }

function sourceOf(source) {
  const type = source?.type === 'group' ? 'group' : source?.type === 'room' ? 'room' : 'user';
  const id = source?.groupId || source?.roomId || source?.userId || '';
  return { type, id };
}

function conversationId(channelId, sourceId) { return `${channelId}_${sourceId}`; }

function conversationRef(id) { return getDb().collection(COL.conversations).doc(id); }

async function staffByLineId(lineId) {
  if (!lineId) return null;
  const hit = staffCache.get(lineId);
  if (hit && Date.now() - hit.at < STAFF_CACHE_MS) return hit.value;
  const snap = await getDb().collection('users').where('lineId', '==', lineId).limit(2).get();
  const value = snap.size === 1 ? { userKey: snap.docs[0].id, name: snap.docs[0].data().name || snap.docs[0].id } : null;
  staffCache.set(lineId, { at: Date.now(), value });
  return value;
}

async function fetchProfile(client, type, sourceId, userId) {
  try {
    const p = type === 'user' ? await client.userProfile(userId) : await client.memberProfile(type, sourceId, userId);
    return { name: p.displayName || '', pictureUrl: p.pictureUrl || null };
  } catch (e) {
    console.warn(`[lineAi] 讀取成員資料失敗 ${type}/${sourceId}/${userId}: ${e.message}`);
    return null;
  }
}

async function ensureConversation(channel, source, client) {
  const { type, id } = sourceOf(source);
  if (!id) return null;
  const ref = conversationRef(conversationId(channel.id, id));
  const snap = await ref.get();
  if (snap.exists) return { ref, conv: { id: ref.id, ...snap.data() }, created: false };

  let name = '';
  let pictureUrl = null;
  try {
    if (type === 'group') {
      const s = await client.groupSummary(id);
      name = s.groupName || '';
      pictureUrl = s.pictureUrl || null;
    } else if (type === 'user') {
      const p = await client.userProfile(id);
      name = p.displayName || '';
      pictureUrl = p.pictureUrl || null;
    }
  } catch (e) {
    console.warn(`[lineAi] 讀取對話資料失敗 ${type}/${id}: ${e.message}`);
  }
  const data = {
    channelId: channel.id,
    type,
    lineSourceId: id,
    name: name || (type === 'group' ? '群組' : type === 'room' ? '多人聊天' : 'LINE 使用者'),
    pictureUrl,
    agentId: null,
    projectId: null,
    customerId: null,
    customerName: null,
    members: {},
    memberLineIds: [],
    viewerKeys: [],
    assignState: type === 'user' ? 'unassigned' : null,
    customerLineId: type === 'user' ? id : null,
    active: true,
    summary: '',
    facts: [],
    summaryUpdatedAt: null,
    pendingSummary: 0,
    messageCount: 0,
    readAt: {},
    lastMessageAt: null,
    lastMessagePreview: '',
    lastSenderName: '',
    lastSenderRole: null,
    notifyDueAt: null,
    createdAt: FieldValue.serverTimestamp(),
  };
  if (type === 'user') data.members = { [id]: { name: data.name, pictureUrl, userKey: null, at: Date.now() } };
  try {
    await ref.create(data);
  } catch (e) {
    if (e.code !== 6) throw e; // ALREADY_EXISTS：同時有兩個事件建立
  }
  const fresh = await ref.get();
  return { ref, conv: { id: ref.id, ...fresh.data() }, created: true };
}

/** 確保成員資料存在（7 天內不重抓），回傳成員 */
async function ensureMember(ref, conv, userId, client) {
  if (!userId) return null;
  const existing = conv.members?.[userId];
  if (existing && Date.now() - (existing.at || 0) < PROFILE_REFRESH_MS) return existing;
  const [profile, staff] = await Promise.all([
    fetchProfile(client, conv.type, conv.lineSourceId, userId),
    staffByLineId(userId),
  ]);
  const member = {
    name: profile?.name || existing?.name || staff?.name || '成員',
    pictureUrl: profile?.pictureUrl ?? existing?.pictureUrl ?? null,
    userKey: staff?.userKey || null,
    at: Date.now(),
  };
  const patch = { [`members.${userId}`]: member };
  if (conv.type !== 'user') patch.memberLineIds = FieldValue.arrayUnion(userId);
  // 一對一尚未綁客戶時，名稱跟著 LINE 顯示名稱
  if (conv.type === 'user' && !conv.customerId && profile?.name) patch.name = profile.name;
  await ref.update(patch);
  conv.members = { ...(conv.members || {}), [userId]: member };
  if (conv.type !== 'user' && !(conv.memberLineIds || []).includes(userId)) conv.memberLineIds = [...(conv.memberLineIds || []), userId];
  return member;
}

async function removeMembers(ref, userIds) {
  if (!userIds.length) return;
  const patch = { memberLineIds: FieldValue.arrayRemove(...userIds) };
  for (const id of userIds) patch[`members.${id}`] = FieldValue.delete();
  await ref.update(patch);
}

/** 員工後來才綁定 LINE：讀取時補上成員的 userKey */
async function refreshStaffMapping(ref, conv) {
  const patch = {};
  for (const [lineId, m] of Object.entries(conv.members || {})) {
    if (m?.userKey) continue;
    const staff = await staffByLineId(lineId);
    if (staff) {
      patch[`members.${lineId}.userKey`] = staff.userKey;
      conv.members[lineId] = { ...m, userKey: staff.userKey };
    }
  }
  if (Object.keys(patch).length) await ref.update(patch).catch(() => {});
}

function senderRole(conv, lineUserId) {
  if (!lineUserId) return 'customer';
  if (conv.type === 'user') return 'customer';
  return conv.members?.[lineUserId]?.userKey ? 'staff' : 'customer';
}

function messagePreview(m) {
  switch (m.type) {
    case 'text': return String(m.text || '').slice(0, 80);
    case 'image': return '[圖片]';
    case 'video': return '[影片]';
    case 'audio': return '[語音]';
    case 'file': return `[檔案] ${m.media?.fileName || ''}`.trim();
    case 'sticker': return '[貼圖]';
    case 'location': return `[位置] ${m.location?.title || m.location?.address || ''}`.trim();
    default: return '[訊息]';
  }
}

function serializeConversation(conv, user, extras = {}) {
  const readMs = toMillis(conv.readAt?.[user.userKey]);
  const lastMs = toMillis(conv.lastMessageAt);
  return {
    id: conv.id,
    channelId: conv.channelId,
    type: conv.type,
    name: conv.type === 'user' ? (conv.customerName || conv.name) : conv.name,
    lineName: conv.name,
    pictureUrl: conv.pictureUrl || null,
    projectId: conv.projectId || null,
    customerId: conv.customerId || null,
    customerName: conv.customerName || null,
    agentId: conv.agentId || null,
    assignState: conv.assignState || null,
    active: conv.active !== false,
    lastMessageAt: toIso(conv.lastMessageAt),
    lastMessagePreview: conv.lastMessagePreview || '',
    lastSenderName: conv.lastSenderName || '',
    unread: !!lastMs && (!readMs || readMs < lastMs) && conv.lastSenderRole !== 'bot',
    memberCount: conv.type === 'user' ? 1 : (conv.memberLineIds || []).length,
    ...extras,
  };
}

function serializeMessage(m, user) {
  return {
    id: m.id,
    type: m.type,
    text: m.text || '',
    senderName: m.senderName || '',
    senderRole: m.senderRole || 'customer',
    isMe: (!!m.sentByUserKey && m.sentByUserKey === user.userKey) || (!!user.lineId && m.senderLineId === user.lineId),
    sentByName: m.sentByName || null,
    createdAt: toIso(m.createdAt),
    media: m.media ? { contentType: m.media.contentType || null, fileName: m.media.fileName || null, size: m.media.size || null, stored: !!m.media.path } : null,
    sticker: m.sticker || null,
    location: m.location || null,
    quotedMessageId: m.quotedMessageId || null,
  };
}

/** 使用者可看的對話（群組成員、指定檢視者、待認領、超級管理員全部） */
async function listVisible(user, global) {
  const col = getDb().collection(COL.conversations);
  const docs = new Map();
  const add = snap => snap.forEach(d => docs.set(d.id, { id: d.id, ...d.data() }));
  if (user.isSuperAdmin) {
    // 不用 orderBy：剛加入、還沒有訊息的群組（lastMessageAt 為 null）也要列出
    add(await col.limit(500).get());
  } else {
    const queries = [col.where('viewerKeys', 'array-contains', user.userKey).get()];
    if (user.lineId) queries.push(col.where('memberLineIds', 'array-contains', user.lineId).get());
    if ((global.claimerKeys || []).includes(user.userKey)) queries.push(col.where('assignState', '==', 'unassigned').get());
    (await Promise.all(queries)).forEach(add);
  }
  return [...docs.values()]
    .filter(c => c.type === 'user' || c.active !== false || c.lastMessageAt)
    .sort((a, b) => (toMillis(b.lastMessageAt) || 0) - (toMillis(a.lastMessageAt) || 0));
}

module.exports = {
  sourceOf, conversationId, conversationRef, ensureConversation, ensureMember, removeMembers, refreshStaffMapping,
  staffByLineId, senderRole, messagePreview, serializeConversation, serializeMessage, listVisible,
};
