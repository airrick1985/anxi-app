// 銷控 AI 智能助理：主 handler（salesAiAgent）
// docs/銷控AI智能助理-spec.md §4.1–§4.5
// actions: capabilities | chat | answer | execute | cancel

const { HttpsError } = require('firebase-functions/v2/https');
const { Firestore, FieldValue, Timestamp } = require('firebase-admin/firestore');
const { authenticate, computeCapabilities } = require('./auth');
const { getGlobalSettings, getProjectAiSettings, resolveProfiles, estimateCost } = require('./settings');
const { getProvider, ProviderError } = require('./providers');
const { getSecret } = require('./secrets');
const { toolsFor, toolSpecs, TOOL_MAP, ensureData } = require('./tools');
const { buildProposal, diffToText } = require('./validate');
const { applyProposal } = require('./execute');
const { buildSystemPrompt } = require('./prompt');
const D = require('./data');

const DB_ID = 'anxi-app';
let deps = {};
function init(d) { deps = { ...deps, ...(d || {}) }; }

function getDb() { return new Firestore({ databaseId: DB_ID }); }

// ---------------------------------------------------------------
// 共用：建立執行環境
// ---------------------------------------------------------------
async function buildContext(db, data, { impersonateUserKey = null, skipSession = false } = {}) {
  const { projectId, userKey, sessionId } = data || {};
  if (!projectId) throw new HttpsError('invalid-argument', '缺少 projectId');
  let user;
  if (skipSession && impersonateUserKey) {
    const snap = await db.collection('users').doc(String(impersonateUserKey)).get();
    if (!snap.exists) throw new HttpsError('not-found', '找不到要模擬的使用者');
    const u = snap.data() || {};
    const roles = Array.isArray(u.roles) ? u.roles : [];
    user = { userKey: String(impersonateUserKey), sessionId: null, name: u.name || String(impersonateUserKey), roles, isAdmin: roles.some(r => ['超級管理員', '系統管理員'].includes(r)), isSuperAdmin: roles.includes('超級管理員') };
  } else {
    user = await authenticate(db, { userKey, sessionId });
  }
  const [project, global] = await Promise.all([getProjectAiSettings(db, projectId), getGlobalSettings(db)]);
  if (!project.exists) throw new HttpsError('not-found', '找不到建案');
  const { caps, systems } = await computeCapabilities(db, user, projectId, project.ai);
  if (!caps.has('sales.read')) throw new HttpsError('permission-denied', '您沒有此建案的銷控系統權限，無法使用 AI 助理。');
  return { db, projectId, projectName: project.projectName, project, projectAi: project.ai, global, user, caps, systems, data: null };
}

function capsPayload(ctx) {
  const tools = toolsFor(ctx.caps, ctx.global.tools, ctx.projectAi.disabledTools);
  return {
    capabilities: [...ctx.caps],
    tools: tools.map(t => t.name),
    quickPrompts: (ctx.global.prompt.quickPrompts || []).filter(qp => !qp.requires || ctx.caps.has(qp.requires)).map(qp => ({ label: qp.label, text: qp.text })),
    quota: { used: ctx.project.tokenUsed, limit: ctx.project.tokenQuota },
    projectName: ctx.projectName,
    userName: ctx.user.name,
  };
}

// ---------------------------------------------------------------
// 配額與速率
// ---------------------------------------------------------------
function checkQuota(ctx) {
  const { tokenQuota, tokenUsed } = ctx.project;
  if (tokenQuota > 0 && tokenUsed >= tokenQuota) throw new HttpsError('resource-exhausted', '此建案的 AI Token 額度已用完，請聯絡管理員調整。');
}

async function checkRate(ctx) {
  const limit = Number(ctx.global.limits.perUserPerMinute) || 10;
  const ref = ctx.db.collection('aiRateLimits').doc(`${ctx.user.userKey}`);
  const now = Date.now();
  await ctx.db.runTransaction(async tx => {
    const snap = await tx.get(ref);
    const stamps = (snap.exists ? snap.data().stamps || [] : []).filter(t => now - t < 60000);
    if (stamps.length >= limit) throw new HttpsError('resource-exhausted', `操作太頻繁，請稍候再試（每分鐘最多 ${limit} 則）。`);
    stamps.push(now);
    tx.set(ref, { stamps, updatedAt: FieldValue.serverTimestamp() });
  });
}

async function recordUsage(ctx, profile, usage) {
  if (!usage || !usage.totalTokens) return;
  const day = D.todayTaipei().replace(/-/g, '');
  const cost = estimateCost(profile, usage);
  const tasks = [
    ctx.db.collection('projects').doc(ctx.projectId).set({ aiTokenUsed: FieldValue.increment(usage.totalTokens) }, { merge: true }),
    ctx.db.collection('aiUsage').doc(ctx.projectId).collection('daily').doc(day).set({
      date: day, projectId: ctx.projectId,
      calls: FieldValue.increment(1), inputTokens: FieldValue.increment(usage.inputTokens || 0), outputTokens: FieldValue.increment(usage.outputTokens || 0),
      totalTokens: FieldValue.increment(usage.totalTokens), estCost: FieldValue.increment(cost),
      byProfile: { [profile.id]: { calls: FieldValue.increment(1), inputTokens: FieldValue.increment(usage.inputTokens || 0), outputTokens: FieldValue.increment(usage.outputTokens || 0), estCost: FieldValue.increment(cost) } },
      updatedAt: FieldValue.serverTimestamp(),
    }, { merge: true }),
  ];
  await Promise.all(tasks.map(t => t.catch(e => console.warn('[salesAi] 用量寫入失敗', e.message))));
  ctx.project.tokenUsed += usage.totalTokens;
}

// ---------------------------------------------------------------
// 模型呼叫（含備援）
// ---------------------------------------------------------------
async function callModel(ctx, req) {
  const { primary, fallback } = resolveProfiles(ctx.global, ctx.projectAi);
  const attempt = async (profile) => {
    const provider = getProvider(profile.provider);
    const apiKey = await getSecret(profile.secretName);
    const res = await provider.chat({ ...req, profile, apiKey });
    return { ...res, profile };
  };
  let lastErr = null;
  for (let i = 0; i < 2; i++) {
    try { return await attempt(primary); } catch (e) {
      lastErr = e;
      if (!(e instanceof ProviderError) || !e.retryable) break;
      await new Promise(r => setTimeout(r, 800));
    }
  }
  if (fallback) {
    console.warn(`[salesAi] 主模型 ${primary.id} 失敗（${lastErr?.message}），改用備援 ${fallback.id}`);
    try { const r = await attempt(fallback); r.usedFallback = true; return r; } catch (e) { lastErr = e; }
  }
  if (lastErr instanceof ProviderError && lastErr.code === 'auth') {
    await ctx.db.collection('aiAdminAlerts').add({ type: 'provider-auth', profileId: primary.id, message: lastErr.message, projectId: ctx.projectId, createdAt: FieldValue.serverTimestamp() }).catch(() => {});
    throw new HttpsError('failed-precondition', 'AI 服務設定異常（金鑰無效），請聯絡系統管理員。');
  }
  if (lastErr instanceof ProviderError && lastErr.retryable) throw new HttpsError('unavailable', 'AI 服務暫時忙碌，請稍後再試。');
  throw new HttpsError('internal', `AI 服務錯誤：${lastErr?.message || '未知'}`);
}

// ---------------------------------------------------------------
// 歷史訊息整理
// ---------------------------------------------------------------
function normalizeHistory(history, limits) {
  const max = Number(limits.historyMessages) || 20;
  const maxChars = Number(limits.maxHistoryChars) || 2000;
  const out = [];
  for (const h of Array.isArray(history) ? history : []) {
    if (!h || typeof h !== 'object') continue;
    const role = h.role === 'user' ? 'user' : 'assistant';
    let text = typeof h.text === 'string' ? h.text : (h.parts && h.parts[0] && typeof h.parts[0].text === 'string' ? h.parts[0].text : '');
    if (h.type === 'proposal' && h.payload?.summary) text = `[系統] 已建立變更草案：${h.payload.summary}${h.payload.status ? `（${h.payload.status}）` : ''}`;
    if (h.type === 'result' && (h.payload?.applied || h.payload?.changeText)) {
      text = `[系統] 已執行：${(h.payload.applied || []).join('；')}${h.payload.changeText ? `\n修改前後：\n${String(h.payload.changeText).slice(0, 1500)}` : ''}`;
    }
    if (h.type === 'question' && h.payload?.questions) text = `[系統] 向使用者提問：${h.payload.questions.map(x => x.label).join('；')}`;
    if (!text) continue;
    out.push({ role, content: text.slice(0, maxChars) });
  }
  // 合併連續同角色（部分供應商要求交替）
  const merged = [];
  for (const m of out.slice(-max)) {
    const last = merged[merged.length - 1];
    if (last && last.role === m.role) last.content += `\n${m.content}`; else merged.push({ ...m });
  }
  return merged;
}

// ---------------------------------------------------------------
// 草案儲存
// ---------------------------------------------------------------
function proposalPayload(id, doc, validated, extra = {}) {
  return {
    proposalId: id, kind: validated.kind, unitId: validated.unitId, unitIds: validated.unitIds || [],
    diff: validated.diff, missing: validated.missing, warnings: validated.warnings, blockers: validated.blockers,
    executable: validated.executable, requireTypedConfirm: validated.requireTypedConfirm, summary: validated.summary,
    status: doc.status, expiresAt: doc.expiresAt instanceof Timestamp ? doc.expiresAt.toDate().toISOString() : doc.expiresAt,
    ...extra,
  };
}

async function storeProposal(ctx, draft, validated, sourceMessage, answers = {}) {
  const ttl = (Number(ctx.global.limits.proposalTtlMinutes) || 10) * 60 * 1000;
  const doc = {
    projectId: ctx.projectId, userKey: ctx.user.userKey, sessionId: ctx.user.sessionId || null, userName: ctx.user.name,
    status: 'pending', createdAt: FieldValue.serverTimestamp(), expiresAt: Timestamp.fromMillis(Date.now() + ttl), executedAt: null,
    sourceMessage: String(sourceMessage || '').slice(0, 2000), draft, answers, validated,
  };
  const ref = await ctx.db.collection('aiProposals').add(doc);
  return proposalPayload(ref.id, doc, validated);
}

async function loadProposal(ctx, proposalId) {
  if (!proposalId) throw new HttpsError('invalid-argument', '缺少 proposalId');
  const ref = ctx.db.collection('aiProposals').doc(String(proposalId));
  const snap = await ref.get();
  if (!snap.exists) throw new HttpsError('not-found', '找不到草案');
  const doc = snap.data();
  if (doc.userKey !== ctx.user.userKey || doc.projectId !== ctx.projectId) throw new HttpsError('permission-denied', '此草案不屬於您');
  if (doc.sessionId && ctx.user.sessionId && doc.sessionId !== ctx.user.sessionId) throw new HttpsError('failed-precondition', '此草案來自其他登入工作階段，請重新描述');
  return { ref, doc };
}

function applyOptionalDefaults(validated, answers) {
  const out = { ...answers };
  for (const m of validated.missing || []) {
    if (m.required === false && !(m.field in out)) out[m.field] = m.default ?? null;
  }
  return out;
}

async function dailyProposalGuard(ctx) {
  const limit = Number(ctx.projectAi.dailyProposalLimit) || 200;
  const day = D.todayTaipei().replace(/-/g, '');
  const ref = ctx.db.collection('aiUsage').doc(ctx.projectId).collection('daily').doc(day);
  const snap = await ref.get();
  const n = snap.exists ? Number(snap.data().proposals) || 0 : 0;
  if (n >= limit) throw new HttpsError('resource-exhausted', `今日草案數已達上限（${limit}）`);
  await ref.set({ date: day, projectId: ctx.projectId, proposals: FieldValue.increment(1) }, { merge: true });
}

// ---------------------------------------------------------------
// chat
// ---------------------------------------------------------------
async function handleChat(ctx, data, { dryRun = false } = {}) {
  const message = String(data.message || '').trim();
  if (!message) throw new HttpsError('invalid-argument', '訊息不可為空');
  if (message.length > 4000) throw new HttpsError('invalid-argument', '訊息過長');
  checkQuota(ctx);
  if (!dryRun) await checkRate(ctx);

  await ensureData(ctx);
  const tools = toolsFor(ctx.caps, ctx.global.tools, ctx.projectAi.disabledTools);
  const unitContext = data.context && data.context.unitId ? D.normalizeId(data.context.unitId) : null;
  const system = buildSystemPrompt({ global: ctx.global, projectAi: ctx.projectAi, projectName: ctx.projectName, user: ctx.user, caps: ctx.caps, data: ctx.data, unitContext });
  const messages = normalizeHistory(data.history, ctx.global.limits);
  messages.push({ role: 'user', content: message });

  const maxRounds = Number(ctx.global.limits.maxToolRounds) || 6;
  const usageSum = { inputTokens: 0, outputTokens: 0, totalTokens: 0 };
  const toolTrace = [];
  const uiActions = [];
  let usedProfile = null;
  let usedFallback = false;

  for (let round = 0; round <= maxRounds; round++) {
    const res = await callModel(ctx, { system, messages, tools: toolSpecs(tools) });
    usedProfile = res.profile; usedFallback = usedFallback || !!res.usedFallback;
    usageSum.inputTokens += res.usage.inputTokens; usageSum.outputTokens += res.usage.outputTokens; usageSum.totalTokens += res.usage.totalTokens;

    if (!res.toolCalls.length) {
      await finalizeUsage();
      const reply = res.text || (res.stop === 'length' ? '（回覆過長被截斷）' : '（沒有回覆內容）');
      return { status: 'success', reply: usedFallback ? `${reply}\n\n（備援模型）` : reply, uiActions, usage: usageSum, quota: quota(), toolTrace: dryRun ? toolTrace : undefined };
    }

    messages.push({ role: 'assistant', content: res.text || undefined, toolCalls: res.toolCalls, rawParts: res.rawParts });
    for (const call of res.toolCalls) {
      const tool = TOOL_MAP[call.name];
      let result;
      if (!tool || !tools.includes(tool)) {
        result = { error: '此工具不可用或您沒有權限' };
      } else {
        try { result = await tool.handler(ctx, call.args || {}); }
        catch (e) { result = { error: e.code === 'permission' ? '您沒有此操作的權限' : `工具執行失敗：${e.message}` }; }
      }
      toolTrace.push({ name: call.name, args: call.args, ok: !result?.error });

      if (result && result.__question) {
        await finalizeUsage();
        return { status: 'success', reply: res.text || null, question: { proposalId: null, questions: result.__question }, uiActions, usage: usageSum, quota: quota(), toolTrace: dryRun ? toolTrace : undefined };
      }
      if (result && result.__proposal) {
        if (!dryRun) await dailyProposalGuard(ctx);
        const validated = await buildProposal(ctx, result.__proposal, {});
        await finalizeUsage();
        const proposal = dryRun
          ? proposalPayload('dry-run', { status: 'dry-run', expiresAt: null }, validated)
          : await storeProposal(ctx, result.__proposal, validated, message);
        const needQ = validated.missing.filter(m => m.required !== false).length > 0;
        return {
          status: 'success', reply: res.text || null,
          proposal,
          question: needQ ? { proposalId: proposal.proposalId, questions: validated.missing } : null,
          uiActions, usage: usageSum, quota: quota(), toolTrace: dryRun ? toolTrace : undefined,
        };
      }
      if (result && result.__uiAction) { uiActions.push(result.__uiAction); delete result.__uiAction; }
      messages.push({ role: 'tool', toolCallId: call.id, name: call.name, result });
    }
  }
  await finalizeUsage();
  return { status: 'success', reply: '這個問題需要的步驟太多，請把需求拆小一點再試一次。', uiActions, usage: usageSum, quota: quota() };

  async function finalizeUsage() { if (!dryRun && usedProfile) await recordUsage(ctx, usedProfile, usageSum); }
  function quota() { return { used: ctx.project.tokenUsed, limit: ctx.project.tokenQuota }; }
}

// ---------------------------------------------------------------
// answer / execute / cancel
// ---------------------------------------------------------------
async function handleAnswer(ctx, data) {
  const { ref, doc } = await loadProposal(ctx, data.proposalId);
  if (doc.status !== 'pending') throw new HttpsError('failed-precondition', `此草案已${doc.status === 'executed' ? '執行' : '失效'}，請重新描述`);
  if (doc.expiresAt && doc.expiresAt.toMillis() < Date.now()) { await ref.set({ status: 'expired' }, { merge: true }); throw new HttpsError('failed-precondition', '草案已逾時，請重新描述'); }
  const answers = { ...(doc.answers || {}), ...(data.answers && typeof data.answers === 'object' ? data.answers : {}) };
  await ensureData(ctx);
  const validated = await buildProposal(ctx, doc.draft, answers);
  await ref.set({ answers, validated, updatedAt: FieldValue.serverTimestamp() }, { merge: true });
  const needQ = validated.missing.filter(m => m.required !== false).length > 0;
  return {
    status: 'success',
    proposal: proposalPayload(ref.id, doc, validated),
    question: needQ ? { proposalId: ref.id, questions: validated.missing } : null,
    quota: { used: ctx.project.tokenUsed, limit: ctx.project.tokenQuota },
  };
}

async function handleExecute(ctx, data) {
  const { ref, doc } = await loadProposal(ctx, data.proposalId);
  if (doc.status !== 'pending') throw new HttpsError('failed-precondition', `此草案已${doc.status === 'executed' ? '執行過' : '失效'}`);
  if (doc.expiresAt && doc.expiresAt.toMillis() < Date.now()) { await ref.set({ status: 'expired' }, { merge: true }); throw new HttpsError('failed-precondition', '草案已逾時，請重新描述'); }
  // 能力再驗（草案建立後設定可能已變）
  const needCap = doc.draft?.kind === 'cancel' ? 'sales.cancel' : 'sales.write';
  if (!ctx.caps.has(needCap)) throw new HttpsError('permission-denied', '您目前沒有執行此草案的權限');

  // 以最新資料重新驗證
  ctx.data = null; await ensureData(ctx);
  const answers = applyOptionalDefaults(doc.validated || {}, { ...(doc.answers || {}), ...(data.answers || {}) });
  const validated = await buildProposal(ctx, doc.draft, answers);
  if (!validated.executable) {
    await ref.set({ validated, status: validated.blockers.length ? 'stale' : 'pending', updatedAt: FieldValue.serverTimestamp() }, { merge: true });
    return { status: 'blocked', proposal: proposalPayload(ref.id, { ...doc, status: validated.blockers.length ? 'stale' : 'pending' }, validated, { stale: validated.blockers.length > 0 }), question: validated.missing.length ? { proposalId: ref.id, questions: validated.missing } : null };
  }
  if (validated.requireTypedConfirm) {
    const typed = D.normalizeId(data.typedConfirm || '');
    if (!typed || typed !== D.normalizeId(validated.requireTypedConfirm)) throw new HttpsError('failed-precondition', `請輸入戶別「${validated.requireTypedConfirm}」以確認退戶`);
  }

  // 一次性：先標記 executing 防重複
  await ctx.db.runTransaction(async tx => {
    const s = await tx.get(ref);
    if (s.data().status !== 'pending') throw new HttpsError('failed-precondition', '此草案正在執行或已執行');
    tx.set(ref, { status: 'executing', updatedAt: FieldValue.serverTimestamp() }, { merge: true });
  });

  let result;
  try {
    result = await applyProposal(ctx, validated, deps);
  } catch (e) {
    await ref.set({ status: 'pending', lastError: e.message, updatedAt: FieldValue.serverTimestamp() }, { merge: true });
    await writeLog(ctx, ref.id, doc, validated, 'failed', e.message);
    throw new HttpsError('internal', `執行失敗：${e.message}`);
  }
  // 修改前後差異：草案執行前以最新資料重算的 diff 就是「修改前 → 修改後」，轉成文字一併回給使用者與對話歷史
  const changeText = diffToText(validated.diff);
  await ref.set({ status: 'executed', executedAt: FieldValue.serverTimestamp(), validated, answers, result: { applied: result.applied, changeText } }, { merge: true });
  await writeLog(ctx, ref.id, doc, validated, 'success', null);
  const unitCount = (result.unitIds || []).length;
  const headline = validated.kind === 'cancel'
    ? `已完成退戶 ${result.unitId}`
    : `已完成修改${unitCount > 1 ? `（共 ${unitCount} 戶）` : result.unitId ? ` ${result.unitId}` : ''}`;
  return {
    status: 'success',
    result: {
      proposalId: ref.id, unitId: result.unitId, unitIds: result.unitIds || [], applied: result.applied, diff: validated.diff,
      notification: result.notification, summary: validated.summary, headline, changeText,
    },
  };
}

async function handleCancel(ctx, data) {
  const { ref, doc } = await loadProposal(ctx, data.proposalId);
  if (doc.status === 'pending') await ref.set({ status: 'cancelled', updatedAt: FieldValue.serverTimestamp() }, { merge: true });
  return { status: 'success' };
}

async function writeLog(ctx, proposalId, doc, validated, result, error) {
  try {
    await ctx.db.collection('projects').doc(ctx.projectId).collection('aiActionLogs').add({
      projectId: ctx.projectId, userKey: ctx.user.userKey, userName: ctx.user.name, proposalId,
      sourceMessage: doc.sourceMessage || '', kind: validated.kind, unitId: validated.unitId, unitIds: validated.unitIds || [], summary: validated.summary,
      actions: validated.actions, diff: validated.diff, result, error: error || null, createdAt: FieldValue.serverTimestamp(),
    });
    if (result === 'success') {
      const day = D.todayTaipei().replace(/-/g, '');
      await ctx.db.collection('aiUsage').doc(ctx.projectId).collection('daily').doc(day).set({ executed: FieldValue.increment(1) }, { merge: true });
    }
  } catch (e) { console.error('[salesAi] 稽核紀錄寫入失敗', e); }
}

// ---------------------------------------------------------------
// 入口
// ---------------------------------------------------------------
async function handleAgent(request) {
  const data = request.data || {};
  const db = getDb();
  const ctx = await buildContext(db, data);
  switch (data.action) {
    case 'capabilities': return { status: 'success', ...capsPayload(ctx) };
    case 'chat': return { ...(await handleChat(ctx, data)), capabilities: [...ctx.caps] };
    case 'answer': return handleAnswer(ctx, data);
    case 'execute': return handleExecute(ctx, data);
    case 'cancel': return handleCancel(ctx, data);
    default: throw new HttpsError('invalid-argument', `未知的 action：${data.action}`);
  }
}

module.exports = { handleAgent, handleChat, buildContext, capsPayload, init, getDb };
