// LINE AI 助理：處理 webhook 事件（lineAiEvents 觸發）
// 訊息、bot 入群／離群、成員異動、收回、加好友／封鎖

const { getStorage } = require('firebase-admin/storage');
const { COL, FieldValue, Timestamp } = require('./db');
const { getChannel, getGlobal, resolveAgent } = require('./settings');
const { clientForChannel, MAX_CONTENT_BYTES } = require('./line');
const C = require('./conversations');
const { updateMemory } = require('./memory');

const MAX_JOIN_MEMBERS = 200;

async function updateIfExists(ref, patch) {
  try { await ref.update(patch); } catch (e) { if (e.code !== 5) throw e; } // NOT_FOUND
}

async function storeContent(client, convId, message) {
  const { buffer, contentType } = await client.content(message.id);
  const path = `lineAi/${convId}/${message.id}`;
  await getStorage().bucket().file(path).save(buffer, { contentType, resumable: false });
  return { path, contentType, size: buffer.length };
}

async function deleteMedia(path) {
  if (!path) return;
  await getStorage().bucket().file(path).delete().catch(e => {
    if (e.code !== 404) console.warn(`[lineAi] 刪除檔案失敗 ${path}: ${e.message}`);
  });
}

async function handleMessage(channel, event, client) {
  const ensured = await C.ensureConversation(channel, event.source, client);
  if (!ensured) return;
  const { ref, conv } = ensured;
  const senderId = event.source.userId || null;
  const member = senderId ? await C.ensureMember(ref, conv, senderId, client) : null;
  const m = event.message || {};
  const doc = {
    lineMessageId: String(m.id),
    type: m.type || 'unknown',
    text: m.type === 'text' ? String(m.text || '') : '',
    senderLineId: senderId,
    senderName: member?.name || '成員',
    senderRole: C.senderRole(conv, senderId),
    createdAt: Timestamp.fromMillis(Number(event.timestamp) || Date.now()),
    quotedMessageId: m.quotedMessageId || null,
  };
  if (m.type === 'sticker') doc.sticker = { packageId: m.packageId || null, stickerId: m.stickerId || null, keywords: (m.keywords || []).slice(0, 5) };
  if (m.type === 'location') doc.location = { title: m.title || '', address: m.address || '', latitude: m.latitude ?? null, longitude: m.longitude ?? null };
  if (['image', 'video', 'audio', 'file'].includes(m.type)) {
    doc.media = { fileName: m.fileName || null, size: m.fileSize || null, contentType: null, path: null };
    if (m.contentProvider?.type === 'external') {
      doc.media.externalUrl = m.contentProvider.originalContentUrl || null;
    } else if (m.type !== 'video' && !(Number(m.fileSize) > MAX_CONTENT_BYTES)) {
      // 影片不下載（檔案大）；其他內容 LINE 只保留一段時間，收到就存
      try { Object.assign(doc.media, await storeContent(client, conv.id, m)); } catch (e) { console.warn(`[lineAi] 下載訊息內容失敗 ${m.id}: ${e.message}`); }
    }
  }

  const msgRef = ref.collection(COL.messages).doc(String(m.id));
  try {
    await msgRef.create(doc);
  } catch (e) {
    if (e.code === 6) return; // LINE 重送同一則
    throw e;
  }

  const [global, agent] = await Promise.all([getGlobal(), resolveAgent(conv, channel)]);
  const patch = {
    lastMessageAt: doc.createdAt,
    lastMessagePreview: C.messagePreview(doc),
    lastSenderName: doc.senderName,
    lastSenderRole: doc.senderRole,
    messageCount: FieldValue.increment(1),
    pendingSummary: FieldValue.increment(1),
    active: true,
  };
  // 客戶私訊官方帳號：等一下再通知，期間的多則訊息合併成一則
  if (conv.type === 'user' && agent && agent.notifyEnabled !== false && !conv.notifyDueAt) {
    patch.notifyDueAt = Timestamp.fromMillis(Date.now() + Math.max(0, Number(global.notifyDelayMinutes) || 0) * 60000);
  }
  await ref.update(patch);

  if (agent && (Number(conv.pendingSummary) || 0) + 1 >= (Number(global.summaryEvery) || 20)) {
    try {
      const fresh = await ref.get();
      await updateMemory(ref, { id: ref.id, ...fresh.data() }, agent);
    } catch (e) {
      console.warn(`[lineAi] 更新對話記憶失敗 ${ref.id}: ${e.message}`);
    }
  }
}

async function handleUnsend(channel, event) {
  const { id } = C.sourceOf(event.source);
  const ref = C.conversationRef(C.conversationId(channel.id, id));
  const msgRef = ref.collection(COL.messages).doc(String(event.unsend?.messageId || ''));
  const snap = await msgRef.get();
  if (!snap.exists) return;
  await deleteMedia(snap.data().media?.path);
  await msgRef.delete();
  await updateIfExists(ref, { messageCount: FieldValue.increment(-1) });
}

async function addMembers(ref, conv, ids, client) {
  for (let i = 0; i < ids.length; i += 10) {
    await Promise.all(ids.slice(i, i + 10).map(uid => C.ensureMember(ref, conv, uid, client).catch(e => console.warn(`[lineAi] 新增成員失敗: ${e.message}`))));
  }
}

/** 認證官方帳號才拿得到成員清單；其他帳號只認得發言過或新加入的人 */
async function syncMemberIds(ref, conv, client) {
  try {
    const ids = await client.memberIds(conv.type, conv.lineSourceId, MAX_JOIN_MEMBERS);
    await addMembers(ref, conv, ids, client);
    return { ok: true, count: ids.length };
  } catch (e) {
    if (e.status === 403) return { ok: false, reason: 'unverified' };
    throw e;
  }
}

async function handleJoin(channel, event, client) {
  const ensured = await C.ensureConversation(channel, event.source, client);
  if (!ensured) return;
  const { ref, conv } = ensured;
  if (!ensured.created) await ref.update({ active: true });
  await syncMemberIds(ref, conv, client).catch(e => console.warn(`[lineAi] 讀取群組成員失敗 ${ref.id}: ${e.message}`));
  const text = String(channel.joinMessage || '').trim();
  if (text && event.replyToken) {
    // reply 不計入官方帳號訊息額度
    await client.reply(event.replyToken, [{ type: 'text', text: text.slice(0, 5000) }]).catch(e => console.warn(`[lineAi] 入群告知失敗: ${e.message}`));
  }
}

async function handleMemberJoined(channel, event, client) {
  const ensured = await C.ensureConversation(channel, event.source, client);
  if (!ensured) return;
  const ids = (event.joined?.members || []).map(m => m.userId).filter(Boolean);
  await addMembers(ensured.ref, ensured.conv, ids, client);
}

async function handleMemberLeft(channel, event) {
  const { id } = C.sourceOf(event.source);
  const ref = C.conversationRef(C.conversationId(channel.id, id));
  const ids = (event.left?.members || []).map(m => m.userId).filter(Boolean);
  try { await C.removeMembers(ref, ids); } catch (e) { if (e.code !== 5) throw e; }
}

async function handleFollow(channel, event, client) {
  const ensured = await C.ensureConversation(channel, event.source, client);
  if (!ensured) return;
  if (!ensured.created) await ensured.ref.update({ active: true });
  await C.ensureMember(ensured.ref, ensured.conv, event.source.userId, client).catch(() => {});
}

async function setInactive(channel, event) {
  const { id } = C.sourceOf(event.source);
  await updateIfExists(C.conversationRef(C.conversationId(channel.id, id)), { active: false });
}

async function processEvent({ channelId, event }) {
  const channel = await getChannel(channelId);
  if (!channel || channel.enabled === false) return;
  const client = await clientForChannel(channel.id);
  switch (event.type) {
    case 'message': return handleMessage(channel, event, client);
    case 'unsend': return handleUnsend(channel, event);
    case 'join': return handleJoin(channel, event, client);
    case 'leave': return setInactive(channel, event);
    case 'memberJoined': return handleMemberJoined(channel, event, client);
    case 'memberLeft': return handleMemberLeft(channel, event);
    case 'follow': return handleFollow(channel, event, client);
    case 'unfollow': return setInactive(channel, event);
    default: return undefined;
  }
}

module.exports = { processEvent, syncMemberIds, deleteMedia };
