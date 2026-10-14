// LINE AI 助理：超級管理員後台 API（lineAiAdmin）
const { HttpsError } = require('firebase-functions/v2/https');
const { getDb, COL, FieldValue, toIso, adminLog } = require('./db');
const S = require('./settings');
const { authenticate, requireSuperAdmin } = require('./auth');
const { LineClient } = require('./line');
const C = require('./conversations');
const { syncMemberIds } = require('./processor');
const { chat, listModels, SUGGESTED_MODELS } = require('./models');
const { getProvider, PROVIDER_META, ProviderError } = require('../salesAi/providers');
const secrets = require('../salesAi/secrets');
const sources = require('./sources');
const { viewerKeysOf } = require('./api');

const NAME_RE = /^[A-Za-z0-9_-]{1,120}$/;
const SEND_MODES = ['manual', 'bot', 'both'];

function str(v, max = 200) { return String(v ?? '').trim().slice(0, max); }
function num(v, min, max, fallback) { const n = Number(v); return Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : fallback; }
function ids(v, max = 200) { return Array.isArray(v) ? [...new Set(v.map(x => str(x, 200)).filter(Boolean))].slice(0, max) : []; }

async function keyStatus(names) {
  const out = {};
  await Promise.all([...new Set(names.filter(Boolean))].map(async n => { out[n] = await secrets.getSecretStatus(n); }));
  return out;
}

function cleanAgent(a, global) {
  const provider = PROVIDER_META[a.provider] ? a.provider : null;
  if (!provider) throw new HttpsError('invalid-argument', '供應商不正確');
  const agent = {
    name: str(a.name, 40),
    enabled: a.enabled !== false,
    provider,
    model: str(a.model, 120),
    secretName: str(a.secretName, 120),
    baseUrl: str(a.baseUrl, 300) || null,
    temperature: num(a.temperature, 0, 2, 0.6),
    maxOutputTokens: num(a.maxOutputTokens, 256, 32768, 2048),
    thinking: ['off', 'low', 'medium', 'high'].includes(a.thinking) ? a.thinking : 'off',
    instructions: str(a.instructions, 6000),
    styleIds: ids(a.styleIds, 50),
    defaultStyleId: str(a.defaultStyleId, 100) || null,
    sendMode: SEND_MODES.includes(a.sendMode) ? a.sendMode : 'manual',
    notifyEnabled: a.notifyEnabled !== false,
    useCustomerData: a.useCustomerData !== false,
    sharedSourceIds: ids(a.sharedSourceIds, 50),
    allowUserSources: a.allowUserSources !== false,
    pricePer1MInput: num(a.pricePer1MInput, 0, 1000, 0),
    pricePer1MOutput: num(a.pricePer1MOutput, 0, 1000, 0),
  };
  if (!agent.name) throw new HttpsError('invalid-argument', '請輸入 Agent 名稱');
  if (!agent.model) throw new HttpsError('invalid-argument', '請輸入模型');
  if (agent.secretName && !global.keys.some(k => k.name === agent.secretName)) throw new HttpsError('invalid-argument', '請從 API Key 清單選擇');
  if (!agent.secretName && provider !== 'openai-compatible') throw new HttpsError('invalid-argument', '請選擇 API Key');
  return agent;
}

function serializeAgent(a) { return { ...a, id: a.id }; }

async function serializeChannel(c) {
  const names = S.channelSecretNames(c.id);
  const status = await keyStatus([names.token, names.secret]);
  return { ...c, hasToken: !!status[names.token]?.exists, hasSecret: !!status[names.secret]?.exists };
}

async function settingsPayload() {
  S.invalidate();
  const [global, channels, agents, styles, shared, email, dbxApp] = await Promise.all([
    S.getGlobal({ fresh: true }), S.listChannels(), S.listAgents(), S.listStyles(), sources.listShared(),
    sources.drive.serviceAccountEmail(), sources.dropbox.appCredentials(),
  ]);
  return {
    global,
    keyStatus: await keyStatus(global.keys.map(k => k.name)),
    channels: await Promise.all(channels.map(serializeChannel)),
    agents: agents.map(serializeAgent).sort((a, b) => String(a.name).localeCompare(String(b.name), 'zh-Hant')),
    styles,
    sharedSources: shared.map(sources.serializeSource),
    providers: Object.fromEntries(Object.entries(PROVIDER_META).map(([k, v]) => [k, { label: v.label, suggestedModels: SUGGESTED_MODELS[k] || [] }])),
    webhookUrl: S.WEBHOOK_URL,
    dropboxRedirectUri: S.DROPBOX_REDIRECT_URI,
    dropboxReady: dbxApp.ready,
    serviceAccountEmail: email,
  };
}

async function fetchBotInfo(channelId) {
  const token = await secrets.getSecret(S.channelSecretNames(channelId).token);
  const info = await new LineClient(token).botInfo();
  return { botUserId: info.userId || null, basicId: info.basicId || null, displayName: info.displayName || null, pictureUrl: info.pictureUrl || null };
}

async function adminConversations() {
  const [snap, channels, agents] = await Promise.all([getDb().collection(COL.conversations).limit(1000).get(), S.listChannels(), S.listAgents()]);
  const chName = new Map(channels.map(c => [c.id, c.displayName || c.name]));
  const agentName = new Map(agents.map(a => [a.id, a.name]));
  return snap.docs.map(d => {
    const c = { id: d.id, ...d.data() };
    const staff = Object.values(c.members || {}).filter(m => m?.userKey).length;
    return {
      id: c.id, channelId: c.channelId, channelName: chName.get(c.channelId) || '', type: c.type, name: c.type === 'user' ? (c.customerName || c.name) : c.name, lineName: c.name,
      agentId: c.agentId || null, agentName: c.agentId ? agentName.get(c.agentId) || '' : '', active: c.active !== false,
      memberCount: c.type === 'user' ? 1 : (c.memberLineIds || []).length, staffCount: staff,
      manualViewerKeys: c.manualViewerKeys || [], assignedKey: c.assignedKey || null, assignState: c.assignState || null,
      projectId: c.projectId || null, customerName: c.customerName || null,
      lastMessageAt: toIso(c.lastMessageAt), createdAt: toIso(c.createdAt),
    };
  }).sort((a, b) => String(b.lastMessageAt || b.createdAt || '').localeCompare(String(a.lastMessageAt || a.createdAt || '')));
}

async function handleAdmin(request) {
  const data = request.data || {};
  const user = await authenticate(data);
  requireSuperAdmin(user);
  const db = getDb();
  const touch = { updatedAt: FieldValue.serverTimestamp(), updatedBy: user.userKey };

  switch (data.action) {
    case 'getSettings':
      return { status: 'success', ...(await settingsPayload()) };

    case 'saveGlobal': {
      const g = data.global || {};
      const patch = {
        appUrl: str(g.appUrl, 200).replace(/\/+$/, '') || S.DEFAULT_GLOBAL.appUrl,
        liffId: str(g.liffId, 60),
        liffChannelId: str(g.liffChannelId, 30) || S.DEFAULT_GLOBAL.liffChannelId,
        notifyChannelId: str(g.notifyChannelId, 100) || null,
        notifyDelayMinutes: num(g.notifyDelayMinutes, 0, 60, 2),
        claimerKeys: ids(g.claimerKeys, 50),
        retentionMonths: num(g.retentionMonths, 1, 120, 12),
        summaryEvery: num(g.summaryEvery, 5, 200, 20),
        historyMessages: num(g.historyMessages, 5, 80, 30),
        perUserPerMinute: num(g.perUserPerMinute, 1, 120, 20),
      };
      await S.globalRef().set({ ...patch, ...touch }, { merge: true });
      S.invalidate();
      await adminLog(user, 'saveGlobal', patch);
      return { status: 'success' };
    }

    // ---------- 官方帳號 ----------
    case 'saveChannel': {
      const c = data.channel || {};
      const id = str(data.channelId, 60) || db.collection(COL.channels).doc().id;
      if (!/^[A-Za-z0-9]{6,60}$/.test(id)) throw new HttpsError('invalid-argument', '官方帳號 id 不正確');
      const names = S.channelSecretNames(id);
      try {
        if (str(data.accessToken, 2000)) await secrets.setSecret(names.token, str(data.accessToken, 2000));
        if (str(data.channelSecret, 200)) await secrets.setSecret(names.secret, str(data.channelSecret, 200));
      } catch (e) {
        throw new HttpsError('internal', `寫入 Secret Manager 失敗：${e.message}`);
      }
      const patch = {
        name: str(c.name, 40),
        enabled: c.enabled !== false,
        defaultAgentId: str(c.defaultAgentId, 100) || null,
        joinMessage: str(c.joinMessage, 1000),
        ...touch,
      };
      let info = null;
      try { info = await fetchBotInfo(id); } catch (e) {
        if (str(data.accessToken, 2000)) throw new HttpsError('failed-precondition', `Channel Access Token 無法使用：${e.message}`);
      }
      if (info) {
        const dup = (await S.listChannels()).find(x => x.id !== id && x.botUserId === info.botUserId);
        if (dup) throw new HttpsError('already-exists', `這個官方帳號已經登記為「${dup.name || dup.displayName}」`);
        Object.assign(patch, info);
        if (!patch.name) patch.name = info.displayName || '';
      }
      if (!patch.name) throw new HttpsError('invalid-argument', '請輸入名稱');
      await db.collection(COL.channels).doc(id).set(patch, { merge: true });
      S.invalidate();
      await adminLog(user, 'saveChannel', { id, name: patch.name, tokenUpdated: !!data.accessToken, secretUpdated: !!data.channelSecret });
      return { status: 'success', channelId: id };
    }

    case 'deleteChannel': {
      const id = str(data.channelId, 60);
      await db.collection(COL.channels).doc(id).delete();
      S.invalidate();
      await adminLog(user, 'deleteChannel', { id });
      return { status: 'success' };
    }

    case 'channelStatus': {
      const id = str(data.channelId, 60);
      const token = await secrets.getSecret(S.channelSecretNames(id).token);
      if (!token) return { status: 'success', ok: false, message: '尚未設定 Channel Access Token' };
      const client = new LineClient(token);
      const [webhook, quota] = await Promise.all([
        client.getWebhook().catch(e => ({ error: e.message })),
        client.quota().catch(e => ({ error: e.message })),
      ]);
      return { status: 'success', ok: true, webhook, quota, expectedWebhook: S.WEBHOOK_URL };
    }

    case 'setChannelWebhook': {
      const id = str(data.channelId, 60);
      const client = new LineClient(await secrets.getSecret(S.channelSecretNames(id).token));
      try {
        await client.setWebhook(S.WEBHOOK_URL);
        const test = await client.testWebhook(S.WEBHOOK_URL);
        await adminLog(user, 'setChannelWebhook', { id, success: test?.success });
        return { status: 'success', test };
      } catch (e) {
        throw new HttpsError('failed-precondition', e.message);
      }
    }

    // ---------- Agent ----------
    case 'saveAgent': {
      const global = await S.getGlobal({ fresh: true });
      const agent = cleanAgent(data.agent || {}, global);
      const ref = data.agentId ? db.collection(COL.agents).doc(str(data.agentId, 100)) : db.collection(COL.agents).doc();
      await ref.set({ ...agent, ...touch }, { merge: true });
      S.invalidate();
      await adminLog(user, 'saveAgent', { id: ref.id, name: agent.name, provider: agent.provider, model: agent.model });
      return { status: 'success', agentId: ref.id };
    }

    case 'deleteAgent': {
      const id = str(data.agentId, 100);
      const usedBy = (await S.listChannels()).filter(c => c.defaultAgentId === id);
      if (usedBy.length) throw new HttpsError('failed-precondition', `「${usedBy[0].name}」的預設 Agent 是它，請先更換`);
      const convs = await db.collection(COL.conversations).where('agentId', '==', id).get();
      const batch = db.batch();
      convs.forEach(d => batch.update(d.ref, { agentId: null }));
      batch.delete(db.collection(COL.agents).doc(id));
      await batch.commit();
      S.invalidate();
      await adminLog(user, 'deleteAgent', { id, conversations: convs.size });
      return { status: 'success' };
    }

    case 'listModels': {
      const global = await S.getGlobal({ fresh: true });
      const key = global.keys.find(k => k.name === str(data.secretName, 120));
      if (!key) return { status: 'success', ok: false, message: '請先選擇 API Key' };
      const apiKey = await secrets.getSecret(key.name);
      if (!apiKey && key.provider !== 'openai-compatible') return { status: 'success', ok: false, message: '這把 API Key 尚未設定金鑰' };
      try {
        const models = await listModels({ provider: key.provider, apiKey, baseUrl: data.baseUrl });
        return { status: 'success', ok: true, models: models.slice(0, 300) };
      } catch (e) {
        return { status: 'success', ok: false, message: e.message };
      }
    }

    case 'testAgent': {
      const global = await S.getGlobal({ fresh: true });
      const agent = { id: 'test', ...cleanAgent(data.agent || {}, global) };
      const t0 = Date.now();
      try {
        const r = await chat(agent, { system: '你是測試助理。', messages: [{ role: 'user', content: '請只回覆「連線正常」四個字。' }], tools: [] });
        return { status: 'success', ok: true, latencyMs: Date.now() - t0, reply: r.text };
      } catch (e) {
        return { status: 'success', ok: false, latencyMs: Date.now() - t0, message: e.message, code: e instanceof ProviderError ? e.code : 'unknown' };
      }
    }

    // ---------- 風格 ----------
    case 'saveStyle': {
      const s = data.style || {};
      const style = { name: str(s.name, 30), instruction: str(s.instruction, 2000), example: str(s.example, 2000), enabled: s.enabled !== false };
      if (!style.name) throw new HttpsError('invalid-argument', '請輸入風格名稱');
      if (!style.instruction) throw new HttpsError('invalid-argument', '請輸入風格說明');
      let ref;
      if (data.styleId) {
        ref = db.collection(COL.styles).doc(str(data.styleId, 100));
      } else {
        ref = db.collection(COL.styles).doc();
        style.order = (await S.listStyles()).length;
      }
      await ref.set({ ...style, ...touch }, { merge: true });
      S.invalidate();
      await adminLog(user, 'saveStyle', { id: ref.id, name: style.name });
      return { status: 'success', styleId: ref.id };
    }

    case 'deleteStyle': {
      const id = str(data.styleId, 100);
      await db.collection(COL.styles).doc(id).delete();
      S.invalidate();
      await adminLog(user, 'deleteStyle', { id });
      return { status: 'success' };
    }

    case 'reorderStyles': {
      const order = ids(data.styleIds, 100);
      const batch = db.batch();
      order.forEach((id, i) => batch.update(db.collection(COL.styles).doc(id), { order: i }));
      await batch.commit();
      S.invalidate();
      return { status: 'success' };
    }

    // ---------- API Key ----------
    case 'saveKey': {
      const name = str(data.name, 120);
      if (!NAME_RE.test(name)) throw new HttpsError('invalid-argument', '名稱只能含英數、底線、連字號');
      const provider = PROVIDER_META[data.provider] ? data.provider : null;
      if (!provider) throw new HttpsError('invalid-argument', '供應商不正確');
      const global = await S.getGlobal({ fresh: true });
      const keys = global.keys.filter(k => k.name !== name);
      keys.push({ name, provider, label: str(data.label, 40) || name });
      await S.globalRef().set({ keys, ...touch }, { merge: true });
      S.invalidate();
      await adminLog(user, 'saveKey', { name, provider });
      return { status: 'success' };
    }

    case 'removeKey': {
      const name = str(data.name, 120);
      const used = (await S.listAgents()).filter(a => a.secretName === name);
      if (used.length) throw new HttpsError('failed-precondition', `Agent「${used[0].name}」正在使用`);
      const global = await S.getGlobal({ fresh: true });
      await S.globalRef().set({ keys: global.keys.filter(k => k.name !== name), ...touch }, { merge: true });
      S.invalidate();
      await adminLog(user, 'removeKey', { name });
      return { status: 'success' };
    }

    case 'setSecret': {
      const name = str(data.secretName, 120);
      const global = await S.getGlobal({ fresh: true });
      const allowed = global.keys.some(k => k.name === name) || [sources.dropbox.APP_KEY, sources.dropbox.APP_SECRET].includes(name);
      if (!allowed) throw new HttpsError('invalid-argument', '只能更新 LINE AI 助理的金鑰');
      const value = String(data.value || '').trim();
      if (!value) throw new HttpsError('invalid-argument', '金鑰不可為空');
      try {
        const r = await secrets.setSecret(name, value);
        await adminLog(user, 'setSecret', { name, version: r.version });
        return { status: 'success', version: r.version };
      } catch (e) {
        throw new HttpsError('internal', `寫入 Secret Manager 失敗：${e.message}`);
      }
    }

    case 'validateSecret': {
      const name = str(data.secretName, 120);
      const providerName = PROVIDER_META[data.provider] ? data.provider : 'gemini';
      const apiKey = data.value ? String(data.value) : await secrets.getSecret(name);
      if (!apiKey) return { status: 'success', ok: false, message: '尚未設定金鑰' };
      const r = await getProvider(providerName).validateKey(apiKey, { provider: providerName, baseUrl: data.baseUrl || null });
      return { status: 'success', ...r };
    }

    // ---------- 對話 ----------
    case 'listConversations':
      return { status: 'success', conversations: await adminConversations() };

    case 'updateConversation': {
      const ref = C.conversationRef(str(data.conversationId, 300));
      const snap = await ref.get();
      if (!snap.exists) throw new HttpsError('not-found', '找不到對話');
      const conv = snap.data();
      const patch = {};
      if (data.agentId !== undefined) patch.agentId = str(data.agentId, 100) || null;
      if (data.manualViewerKeys !== undefined) {
        patch.manualViewerKeys = ids(data.manualViewerKeys, 50);
        patch.viewerKeys = viewerKeysOf({ ...conv, manualViewerKeys: patch.manualViewerKeys }, conv.assignedKey);
      }
      if (data.assignedKey !== undefined && conv.type === 'user') {
        const assignedKey = str(data.assignedKey, 100) || null;
        patch.assignedKey = assignedKey;
        patch.assignState = assignedKey ? 'assigned' : 'unassigned';
        patch.viewerKeys = viewerKeysOf({ ...conv, ...patch }, assignedKey);
      }
      if (!Object.keys(patch).length) return { status: 'success' };
      await ref.update(patch);
      await adminLog(user, 'updateConversation', { id: snap.id, ...patch });
      return { status: 'success' };
    }

    case 'syncMembers': {
      const ref = C.conversationRef(str(data.conversationId, 300));
      const snap = await ref.get();
      if (!snap.exists) throw new HttpsError('not-found', '找不到對話');
      const conv = { id: snap.id, ...snap.data() };
      if (conv.type === 'user') return { status: 'success', ok: true, count: 1 };
      const client = new LineClient(await secrets.getSecret(S.channelSecretNames(conv.channelId).token));
      if (conv.type === 'group') {
        const summary = await client.groupSummary(conv.lineSourceId).catch(() => null);
        if (summary?.groupName) await ref.update({ name: summary.groupName, pictureUrl: summary.pictureUrl || null });
      }
      const r = await syncMemberIds(ref, conv, client);
      await C.refreshStaffMapping(ref, conv);
      return { status: 'success', ...r };
    }

    case 'listUsers': {
      const snap = await db.collection('users').select('name', 'lineId', 'disabled', 'isTrial').get();
      const users = snap.docs
        .map(d => ({ userKey: d.id, name: d.data().name || d.id, lineBound: String(d.data().lineId || '').startsWith('U'), disabled: d.data().disabled === true, isTrial: d.data().isTrial === true }))
        .filter(u => !u.disabled && !u.isTrial)
        .sort((a, b) => a.name.localeCompare(b.name, 'zh-Hant'));
      return { status: 'success', users };
    }

    // ---------- 共用雲端資料 ----------
    case 'addSharedDrive': {
      try {
        const s = await sources.addDrive({ ownerKey: user.userKey, link: data.link, name: data.name, shared: true });
        await adminLog(user, 'addSharedDrive', { id: s.id, name: s.name });
        return { status: 'success', source: sources.serializeSource(s) };
      } catch (e) {
        throw new HttpsError('failed-precondition', e.message);
      }
    }

    case 'setSourceShared': {
      const ref = db.collection(COL.sources).doc(str(data.sourceId, 100));
      const snap = await ref.get();
      if (!snap.exists) throw new HttpsError('not-found', '找不到資料來源');
      if (snap.data().ownerKey !== user.userKey) throw new HttpsError('permission-denied', '只能共用自己連結的資料來源');
      await ref.update({ shared: data.shared === true });
      return { status: 'success' };
    }

    case 'removeSharedSource': {
      const id = str(data.sourceId, 100);
      await db.collection(COL.sources).doc(id).delete();
      const agents = (await S.listAgents()).filter(a => (a.sharedSourceIds || []).includes(id));
      await Promise.all(agents.map(a => db.collection(COL.agents).doc(a.id).update({ sharedSourceIds: FieldValue.arrayRemove(id) })));
      S.invalidate();
      await adminLog(user, 'removeSharedSource', { id });
      return { status: 'success' };
    }

    case 'listMySources': {
      const own = await sources.listOwn(user.userKey);
      return { status: 'success', sources: own.map(sources.serializeSource), dropbox: await sources.dropbox.status(user.userKey) };
    }

    // ---------- 用量 ----------
    case 'getUsage': {
      const from = str(data.from, 10).replace(/-/g, '');
      const to = str(data.to, 10).replace(/-/g, '');
      let q = db.collection(COL.usage);
      if (from) q = q.where('date', '>=', from);
      if (to) q = q.where('date', '<=', to);
      const snap = await q.limit(400).get();
      const rows = snap.docs.map(d => { const x = d.data(); return { date: x.date, calls: x.calls || 0, inputTokens: x.inputTokens || 0, outputTokens: x.outputTokens || 0, totalTokens: x.totalTokens || 0, estCost: x.estCost || 0, byAgent: x.byAgent || {}, byKind: x.byKind || {} }; });
      rows.sort((a, b) => a.date.localeCompare(b.date));
      return { status: 'success', rows };
    }

    case 'listAdminLogs': {
      const snap = await db.collection(COL.adminLogs).orderBy('createdAt', 'desc').limit(100).get();
      return { status: 'success', logs: snap.docs.map(d => ({ id: d.id, ...d.data(), createdAt: toIso(d.data().createdAt) })) };
    }

    default:
      throw new HttpsError('invalid-argument', `未知的 action：${data.action}`);
  }
}

module.exports = { handleAdmin };
