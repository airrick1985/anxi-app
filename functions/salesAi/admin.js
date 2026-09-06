// 銷控 AI 智能助理：超級管理員管理後台 API（salesAiAdmin）
// docs/銷控AI智能助理-spec.md §12.5

const { HttpsError } = require('firebase-functions/v2/https');
const { FieldValue } = require('firebase-admin/firestore');
const { authenticate, requireSuperAdmin } = require('./auth');
const S = require('./settings');
const { getProvider, PROVIDER_META, ProviderError } = require('./providers');
const secrets = require('./secrets');
const { TOOLS } = require('./tools');
const { FIXED_A, FIXED_B, FIXED_C } = require('./prompt');
const { getDb, buildContext, handleChat } = require('./agent');
const D = require('./data');

const PROFILE_FIELDS = ['label', 'provider', 'model', 'temperature', 'maxOutputTokens', 'thinking', 'baseUrl', 'secretName', 'pricePer1MInput', 'pricePer1MOutput', 'currency', 'enabled'];

function cleanProfile(p) {
  const out = {};
  for (const k of PROFILE_FIELDS) if (p[k] !== undefined) out[k] = p[k];
  if (!PROVIDER_META[out.provider]) throw new HttpsError('invalid-argument', '供應商不正確');
  if (!out.model || typeof out.model !== 'string') throw new HttpsError('invalid-argument', '模型 id 不可為空');
  out.label = String(out.label || out.model).slice(0, 80);
  out.temperature = Number.isFinite(Number(out.temperature)) ? Number(out.temperature) : 0.2;
  out.maxOutputTokens = Number.isFinite(Number(out.maxOutputTokens)) ? Number(out.maxOutputTokens) : 2048;
  out.thinking = ['off', 'low', 'medium', 'high'].includes(out.thinking) ? out.thinking : 'off';
  out.baseUrl = out.baseUrl ? String(out.baseUrl).trim() : null;
  out.secretName = String(out.secretName || PROVIDER_META[out.provider].defaultSecret).trim();
  if (!/^[A-Za-z0-9_-]{1,255}$/.test(out.secretName)) throw new HttpsError('invalid-argument', '密鑰名稱格式不正確');
  out.pricePer1MInput = Number(out.pricePer1MInput) || 0;
  out.pricePer1MOutput = Number(out.pricePer1MOutput) || 0;
  out.currency = String(out.currency || 'USD').slice(0, 8);
  out.enabled = out.enabled !== false;
  return out;
}

async function adminLog(db, user, action, detail) {
  try { await db.collection('aiAdminLogs').add({ action, detail: detail || null, userKey: user.userKey, userName: user.name, createdAt: FieldValue.serverTimestamp() }); } catch (e) { /* ignore */ }
}

async function getSettingsPayload(db) {
  const global = await S.getGlobalSettings(db, { fresh: true });
  const secretNames = new Set(Object.values(global.profiles).map(p => p.secretName).filter(Boolean));
  for (const meta of Object.values(PROVIDER_META)) secretNames.add(meta.defaultSecret);
  const secretStatus = {};
  await Promise.all([...secretNames].map(async n => { secretStatus[n] = await secrets.getSecretStatus(n); }));
  return {
    global,
    providers: PROVIDER_META,
    secretStatus,
    tools: TOOLS.map(t => ({ name: t.name, description: t.description, requires: t.requires, enabled: !(global.tools[t.name] && global.tools[t.name].enabled === false) })),
    fixedPrompt: { A: FIXED_A, B: FIXED_B, C: FIXED_C },
    defaults: { profile: S.DEFAULT_PROFILE, prompt: S.DEFAULT_PROMPT, limits: S.DEFAULT_LIMITS },
  };
}

async function handleAdmin(request) {
  const data = request.data || {};
  const db = getDb();
  const user = await authenticate(db, { userKey: data.userKey, sessionId: data.sessionId });
  requireSuperAdmin(user);
  const ref = S.globalDocRef(db);
  const touch = { updatedAt: FieldValue.serverTimestamp(), updatedBy: user.userKey };

  switch (data.action) {
    case 'getSettings':
      return { status: 'success', ...(await getSettingsPayload(db)) };

    case 'saveProfile': {
      const id = String(data.profileId || '').trim();
      if (!/^[A-Za-z0-9_-]{1,40}$/.test(id)) throw new HttpsError('invalid-argument', 'Profile id 只能含英數、底線、連字號');
      const profile = cleanProfile(data.profile || {});
      await ref.set({ profiles: { [id]: profile }, ...touch }, { merge: true });
      S.invalidateGlobalCache();
      await adminLog(db, user, 'saveProfile', { id, provider: profile.provider, model: profile.model });
      return { status: 'success' };
    }
    case 'deleteProfile': {
      const id = String(data.profileId || '');
      const g = await S.getGlobalSettings(db, { fresh: true });
      if (!g.profiles[id]) throw new HttpsError('not-found', '找不到 profile');
      if (g.defaultProfileId === id) throw new HttpsError('failed-precondition', '不能刪除預設 profile，請先更換預設');
      const projSnap = await db.collection('projects').where('aiAssistant.modelProfileId', '==', id).get();
      if (!projSnap.empty) throw new HttpsError('failed-precondition', `仍有 ${projSnap.size} 個建案使用此 profile`);
      const patch = { [`profiles.${id}`]: FieldValue.delete(), ...touch };
      if (g.fallbackProfileId === id) patch.fallbackProfileId = null;
      await ref.update(patch);
      S.invalidateGlobalCache();
      await adminLog(db, user, 'deleteProfile', { id });
      return { status: 'success' };
    }
    case 'setDefaultProfile': {
      const g = await S.getGlobalSettings(db, { fresh: true });
      const patch = { ...touch };
      if (data.defaultProfileId !== undefined) { if (!g.profiles[data.defaultProfileId]) throw new HttpsError('invalid-argument', '找不到 profile'); patch.defaultProfileId = data.defaultProfileId; }
      if (data.fallbackProfileId !== undefined) { if (data.fallbackProfileId && !g.profiles[data.fallbackProfileId]) throw new HttpsError('invalid-argument', '找不到備援 profile'); patch.fallbackProfileId = data.fallbackProfileId || null; }
      await ref.set(patch, { merge: true });
      S.invalidateGlobalCache();
      await adminLog(db, user, 'setDefaultProfile', patch);
      return { status: 'success' };
    }
    case 'testProfile': {
      const g = await S.getGlobalSettings(db, { fresh: true });
      const profile = data.profile ? cleanProfile(data.profile) : g.profiles[data.profileId];
      if (!profile) throw new HttpsError('not-found', '找不到 profile');
      const provider = getProvider(profile.provider);
      const apiKey = await secrets.getSecret(profile.secretName);
      const t0 = Date.now();
      try {
        const res = await provider.chat({
          system: '你是測試助理。', messages: [{ role: 'user', content: '請只回覆「連線正常」四個字。' }], tools: [], profile, apiKey,
        });
        return { status: 'success', ok: true, latencyMs: Date.now() - t0, reply: res.text, usage: res.usage };
      } catch (e) {
        return { status: 'success', ok: false, latencyMs: Date.now() - t0, message: e.message, code: e instanceof ProviderError ? e.code : 'unknown' };
      }
    }
    case 'setSecret': {
      const name = String(data.secretName || '').trim();
      const value = String(data.value || '');
      if (!value.trim()) throw new HttpsError('invalid-argument', '金鑰不可為空');
      try {
        const r = await secrets.setSecret(name, value);
        await adminLog(db, user, 'setSecret', { name, version: r.version });
        return { status: 'success', version: r.version, note: '最遲 10 分鐘內生效' };
      } catch (e) {
        throw new HttpsError('internal', `寫入 Secret Manager 失敗：${e.message}（請確認 Cloud Functions 服務帳號具有 Secret Manager Admin 角色）`);
      }
    }
    case 'validateSecret': {
      const name = String(data.secretName || '').trim();
      const providerName = String(data.provider || 'gemini');
      const provider = getProvider(providerName);
      const apiKey = data.value ? String(data.value) : await secrets.getSecret(name);
      if (!apiKey) return { status: 'success', ok: false, message: '尚未設定金鑰' };
      const r = await provider.validateKey(apiKey, { provider: providerName, baseUrl: data.baseUrl || null });
      return { status: 'success', ...r };
    }
    case 'savePrompt': {
      const p = data.prompt && typeof data.prompt === 'object' ? data.prompt : {};
      const g = await S.getGlobalSettings(db, { fresh: true });
      const next = {
        persona: String(p.persona ?? g.prompt.persona).slice(0, 4000),
        style: String(p.style ?? g.prompt.style).slice(0, 2000),
        projectIntroDefault: String(p.projectIntroDefault ?? g.prompt.projectIntroDefault).slice(0, 4000),
        extraRules: String(p.extraRules ?? g.prompt.extraRules).slice(0, 4000),
        quickPrompts: Array.isArray(p.quickPrompts) ? p.quickPrompts.slice(0, 20).map(x => ({ label: String(x.label || '').slice(0, 20), text: String(x.text || '').slice(0, 300), requires: x.requires || null })).filter(x => x.label && x.text) : g.prompt.quickPrompts,
      };
      const vref = await db.collection('aiPromptVersions').add({ prompt: next, note: String(data.note || '').slice(0, 200), createdAt: FieldValue.serverTimestamp(), createdBy: user.userKey, createdByName: user.name });
      next.activeVersionId = vref.id;
      await ref.set({ prompt: next, ...touch }, { merge: true });
      S.invalidateGlobalCache();
      await adminLog(db, user, 'savePrompt', { versionId: vref.id, note: data.note || '' });
      // 只保留最近 50 版
      const old = await db.collection('aiPromptVersions').orderBy('createdAt', 'desc').offset(50).get();
      const batch = db.batch(); old.docs.forEach(d => batch.delete(d.ref)); if (!old.empty) await batch.commit();
      return { status: 'success', versionId: vref.id };
    }
    case 'listPromptVersions': {
      const snap = await db.collection('aiPromptVersions').orderBy('createdAt', 'desc').limit(50).get();
      return { status: 'success', versions: snap.docs.map(d => { const x = d.data(); return { id: d.id, note: x.note, createdAt: x.createdAt?.toDate?.().toISOString() || null, createdByName: x.createdByName, prompt: x.prompt }; }) };
    }
    case 'restorePromptVersion': {
      const snap = await db.collection('aiPromptVersions').doc(String(data.versionId || '')).get();
      if (!snap.exists) throw new HttpsError('not-found', '找不到版本');
      const next = { ...snap.data().prompt, activeVersionId: snap.id };
      await ref.set({ prompt: next, ...touch }, { merge: true });
      S.invalidateGlobalCache();
      await adminLog(db, user, 'restorePromptVersion', { versionId: snap.id });
      return { status: 'success' };
    }
    case 'saveTools': {
      const tools = {};
      for (const [name, v] of Object.entries(data.tools || {})) if (TOOLS.some(t => t.name === name)) tools[name] = { enabled: v && v.enabled !== false };
      await ref.set({ tools, ...touch }, { merge: true });
      S.invalidateGlobalCache();
      await adminLog(db, user, 'saveTools', tools);
      return { status: 'success' };
    }
    case 'saveLimits': {
      const l = data.limits || {};
      const limits = {
        perUserPerMinute: Math.max(1, Math.min(120, Number(l.perUserPerMinute) || S.DEFAULT_LIMITS.perUserPerMinute)),
        historyMessages: Math.max(0, Math.min(60, Number(l.historyMessages) || S.DEFAULT_LIMITS.historyMessages)),
        maxToolRounds: Math.max(1, Math.min(12, Number(l.maxToolRounds) || S.DEFAULT_LIMITS.maxToolRounds)),
        proposalTtlMinutes: Math.max(1, Math.min(120, Number(l.proposalTtlMinutes) || S.DEFAULT_LIMITS.proposalTtlMinutes)),
        maxHistoryChars: Math.max(200, Math.min(8000, Number(l.maxHistoryChars) || S.DEFAULT_LIMITS.maxHistoryChars)),
      };
      await ref.set({ limits, ...touch }, { merge: true });
      S.invalidateGlobalCache();
      await adminLog(db, user, 'saveLimits', limits);
      return { status: 'success' };
    }
    case 'listProjects': {
      const snap = await db.collection('projects').get();
      const projects = snap.docs.map(d => { const x = d.data(); return { id: d.id, name: x.name || x.projectName || d.id, aiAssistant: { ...S.DEFAULT_PROJECT_AI, ...(x.aiAssistant || {}) }, aiTokenQuota: Number(x.aiTokenQuota) || 0, aiTokenUsed: Number(x.aiTokenUsed) || 0 }; });
      projects.sort((a, b) => String(a.name).localeCompare(String(b.name), 'zh-Hant'));
      return { status: 'success', projects };
    }
    case 'saveProjectOverride': {
      const pid = String(data.projectId || '');
      if (!pid) throw new HttpsError('invalid-argument', '缺少 projectId');
      const a = data.aiAssistant || {};
      const g = await S.getGlobalSettings(db);
      const aiAssistant = {
        allowWrite: a.allowWrite === true,
        allowCancel: a.allowCancel === true,
        writeRoles: Array.isArray(a.writeRoles) ? a.writeRoles.map(String).slice(0, 10) : [],
        modelProfileId: a.modelProfileId && g.profiles[a.modelProfileId] ? a.modelProfileId : null,
        promptOverride: a.promptOverride && typeof a.promptOverride === 'object' ? { projectIntro: String(a.promptOverride.projectIntro || '').slice(0, 4000), extraRules: String(a.promptOverride.extraRules || '').slice(0, 4000) } : null,
        disabledTools: Array.isArray(a.disabledTools) ? a.disabledTools.filter(n => TOOLS.some(t => t.name === n)) : [],
        dailyProposalLimit: Math.max(1, Math.min(5000, Number(a.dailyProposalLimit) || 200)),
      };
      const patch = { aiAssistant };
      if (data.aiTokenQuota !== undefined) patch.aiTokenQuota = Math.max(0, Number(data.aiTokenQuota) || 0);
      await db.collection('projects').doc(pid).set(patch, { merge: true });
      await adminLog(db, user, 'saveProjectOverride', { projectId: pid, ...aiAssistant });
      return { status: 'success' };
    }
    case 'getUsage': {
      const from = String(data.from || '').replace(/-/g, '') || D.todayTaipei().replace(/-/g, '').slice(0, 6) + '01';
      const to = String(data.to || '').replace(/-/g, '') || D.todayTaipei().replace(/-/g, '');
      let projectIds = data.projectId ? [String(data.projectId)] : null;
      if (!projectIds) { const ps = await db.collection('projects').select('name').get(); projectIds = ps.docs.map(d => d.id); }
      const rows = [];
      await Promise.all(projectIds.map(async pid => {
        const snap = await db.collection('aiUsage').doc(pid).collection('daily').where('date', '>=', from).where('date', '<=', to).get();
        snap.forEach(d => { const x = d.data(); rows.push({ projectId: pid, date: x.date, calls: x.calls || 0, inputTokens: x.inputTokens || 0, outputTokens: x.outputTokens || 0, totalTokens: x.totalTokens || 0, estCost: x.estCost || 0, proposals: x.proposals || 0, executed: x.executed || 0, byProfile: x.byProfile || {} }); });
      }));
      rows.sort((a, b) => a.date.localeCompare(b.date) || a.projectId.localeCompare(b.projectId));
      return { status: 'success', rows, from, to };
    }
    case 'listActionLogs': {
      const pid = String(data.projectId || '');
      if (!pid) throw new HttpsError('invalid-argument', '缺少 projectId');
      const snap = await db.collection('projects').doc(pid).collection('aiActionLogs').orderBy('createdAt', 'desc').limit(Math.min(200, Number(data.limit) || 100)).get();
      return { status: 'success', logs: snap.docs.map(d => { const x = d.data(); return { id: d.id, ...x, createdAt: x.createdAt?.toDate?.().toISOString() || null }; }) };
    }
    case 'listAdminLogs': {
      const snap = await db.collection('aiAdminLogs').orderBy('createdAt', 'desc').limit(100).get();
      return { status: 'success', logs: snap.docs.map(d => { const x = d.data(); return { id: d.id, ...x, createdAt: x.createdAt?.toDate?.().toISOString() || null }; }) };
    }
    case 'listAlerts': {
      const snap = await db.collection('aiAdminAlerts').orderBy('createdAt', 'desc').limit(50).get();
      return { status: 'success', alerts: snap.docs.map(d => { const x = d.data(); return { id: d.id, ...x, createdAt: x.createdAt?.toDate?.().toISOString() || null }; }) };
    }
    case 'listProjectUsers': {
      const pid = String(data.projectId || '');
      const snap = await db.collection('userPermissions').where(`permissions.${pid}.systems`, 'array-contains-any', ['銷控系統', '報價系統']).get();
      const keys = snap.docs.map(d => d.id);
      const users = [];
      for (let i = 0; i < keys.length; i += 30) {
        const chunk = keys.slice(i, i + 30);
        const us = await db.collection('users').where('__name__', 'in', chunk).get();
        us.forEach(d => { const x = d.data(); users.push({ userKey: d.id, name: x.name || d.id, roles: x.roles || [] }); });
      }
      users.sort((a, b) => String(a.name).localeCompare(String(b.name), 'zh-Hant'));
      return { status: 'success', users };
    }
    case 'playground': {
      // 以指定使用者身份模擬（能力矩陣照該使用者算），dryRun：不寫草案、不計配額、不速率限制
      const ctx = await buildContext(db, { projectId: data.projectId }, { impersonateUserKey: data.asUserKey || user.userKey, skipSession: true });
      if (data.profileId) {
        const g = await S.getGlobalSettings(db, { fresh: true });
        if (g.profiles[data.profileId]) ctx.projectAi = { ...ctx.projectAi, modelProfileId: data.profileId };
      }
      const res = await handleChat(ctx, { message: data.message, history: data.history, context: data.context }, { dryRun: true });
      return { ...res, capabilities: [...ctx.caps], asUser: ctx.user.name };
    }
    default:
      throw new HttpsError('invalid-argument', `未知的 action：${data.action}`);
  }
}

module.exports = { handleAdmin };
