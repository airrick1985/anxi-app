// =================================================================
// 報價單列印前底價守門與主管確認通知
// 規格：docs/SPEC_QuoteFloorPriceApproval.md §4、§5、§7、§8
//
// 對外 API（由 index.js 的 quoteApprovalApi onCall router 呼叫）:
//   handleQuoteApprovalAction(action, data) → 回傳物件；錯誤以 HttpsError 拋出
//
// 設計要點：
//   - 底價一律由 Firestore 即時讀取（salesHouseholds / salesParkings），不信任前端快照
//   - check 回應「不含任何金額」，金額只出現在主管訊息與 quoteApprovalRequests 紀錄
//   - 試用建案（TrialGuard 命中）不對外推播／寄信，回傳 simulated: true，紀錄照寫
// =================================================================

const crypto = require('crypto');
const axios = require('axios');
const nodemailer = require('nodemailer');
const { Firestore, FieldPath, Timestamp } = require('@google-cloud/firestore');
const { HttpsError } = require('firebase-functions/v2/https');
const { shouldBlockOutbound } = require('./utils/trialGuard');
const { getEligibleRecipients } = require('./utils/getEligibleRecipients');

const LINE_PUSH_URL = 'https://api.line.me/v2/bot/message/push';
const SUPERVISOR_SYSTEMS = ['銷控系統'];
const EXCLUDED_ROLES = ['超級管理員'];
const OPERATOR_SYSTEMS = ['報價系統', '銷控系統'];
const ADMIN_ROLES = ['超級管理員', '系統管理員'];
const MAX_BUBBLES_PER_CAROUSEL = 10;

let _db = null;
function getDb() {
  if (!_db) _db = new Firestore({ databaseId: 'anxi-app' });
  return _db;
}

// ---------- 共用工具 ----------

function formatTaipei(d = new Date()) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Taipei',
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(d);
  const p = Object.fromEntries(parts.map(x => [x.type, x.value]));
  return `${p.year}/${p.month}/${p.day} ${p.hour}:${p.minute}`;
}

const toNum = v => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};
const fmtWan = v => `${Math.round(toNum(v)).toLocaleString('en-US')} 萬`;
// 溢差價單價 = 溢差價 ÷ 房屋面積（坪），固定兩位小數；面積為 0 時回傳 null
const diffPerPing = (diff, area) => {
  const a = toNum(area);
  if (a <= 0) return null;
  return toNum(diff) / a;
};
const fmtWanPerPing = v => `${v < 0 ? '−' : ''}${Math.abs(v).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} 萬/坪`;
const fmtPing = v => {
  const n = toNum(v);
  return n > 0 ? `${n.toLocaleString('en-US', { maximumFractionDigits: 2 })} 坪` : '—';
};
const safeText = (v, fallback = '') => (v === null || v === undefined || v === '' ? fallback : String(v));
const escapeHtml = s => String(s || '')
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;').replace(/'/g, '&#39;');

function normalizeSpotIds(list) {
  return [...new Set((Array.isArray(list) ? list : []).map(s => String(s || '').trim()).filter(Boolean))].sort();
}

function buildSignature({ unitId, quoteTotal, spotIds, tolerance }) {
  const raw = `${unitId}|${Math.round(toNum(quoteTotal))}|${normalizeSpotIds(spotIds).join(',')}|${toNum(tolerance)}`;
  return crypto.createHash('sha1').update(raw).digest('hex');
}

async function getDocsByIds(collectionName, ids) {
  const db = getDb();
  const result = new Map();
  const unique = [...new Set(ids.filter(Boolean))];
  for (let i = 0; i < unique.length; i += 30) {
    const chunk = unique.slice(i, i + 30);
    const snap = await db.collection(collectionName).where(FieldPath.documentId(), 'in', chunk).get();
    snap.forEach(d => result.set(d.id, d.data() || {}));
  }
  return result;
}

// ---------- 權限 ----------

async function loadUser(userKey) {
  if (!userKey) return null;
  const snap = await getDb().collection('users').doc(String(userKey)).get();
  return snap.exists ? { key: snap.id, ...(snap.data() || {}) } : null;
}

async function loadProjectSystems(userKey, projectId) {
  const snap = await getDb().collection('userPermissions').doc(String(userKey)).get();
  if (!snap.exists) return [];
  const systems = snap.data()?.permissions?.[projectId]?.systems;
  return Array.isArray(systems) ? systems : [];
}

async function assertOperator(projectId, operatorKey) {
  if (!projectId || !operatorKey) {
    throw new HttpsError('invalid-argument', '缺少 projectId / operatorKey');
  }
  const user = await loadUser(operatorKey);
  if (!user) throw new HttpsError('permission-denied', '找不到操作者帳號');
  const roles = Array.isArray(user.roles) ? user.roles : [];
  if (roles.some(r => ADMIN_ROLES.includes(r))) return user;
  const systems = await loadProjectSystems(operatorKey, projectId);
  if (!systems.some(s => OPERATOR_SYSTEMS.includes(s))) {
    throw new HttpsError('permission-denied', '無此建案報價系統權限');
  }
  return user;
}

// ---------- 建案設定 ----------

async function loadProjectApprovalSettings(projectId) {
  const snap = await getDb().collection('projects').doc(projectId).get();
  const data = snap.exists ? (snap.data() || {}) : {};
  const tolerance = Math.max(0, toNum(data.quoteFloorTolerance));
  const approvers = Array.isArray(data.quoteApprovers)
    ? data.quoteApprovers.map(k => String(k || '').trim()).filter(Boolean)
    : [];
  return { tolerance, approvers, projectName: data.name || data.projectName || '' };
}

// ---------- 底價核對 ----------

/**
 * 逐戶核對（內部共用；回傳含金額的完整結果，對外 check 需再遮蔽）
 * @param {string} projectId
 * @param {Array<{internalId, unitId, quoteTotal, parkingSpotIds}>} items
 * @param {number} tolerance
 */
async function evaluateItems(projectId, items, tolerance) {
  const unitIds = items.map(i => String(i.unitId || '').trim()).filter(Boolean);
  const spotIds = items.flatMap(i => normalizeSpotIds(i.parkingSpotIds));
  const [households, parkings] = await Promise.all([
    getDocsByIds('salesHouseholds', unitIds.map(u => `${projectId}_${u}`)),
    getDocsByIds('salesParkings', spotIds.map(s => `${projectId}_${s}`)),
  ]);

  return items.map(item => {
    const unitId = String(item.unitId || '').trim();
    const quoteTotal = Math.round(toNum(item.quoteTotal));
    const spots = normalizeSpotIds(item.parkingSpotIds);
    const house = households.get(`${projectId}_${unitId}`);
    const missingUnit = !house;
    const houseFloorRaw = house ? house.price_floor_house_total : null;
    const missingHouseFloor = !missingUnit && !(toNum(houseFloorRaw) > 0);
    const houseFloor = toNum(houseFloorRaw);

    const missingParking = [];
    const parkingDetail = [];
    let parkingFloor = 0;
    spots.forEach(spotId => {
      const p = parkings.get(`${projectId}_${spotId}`);
      if (!p) {
        missingParking.push(spotId);
        parkingDetail.push({ spotId, priceFloor: 0, missing: true });
        return;
      }
      const floor = toNum(p.price_floor ?? p['底價'] ?? p['車位底價']);
      parkingFloor += floor;
      parkingDetail.push({ spotId, priceFloor: floor, missing: false });
    });

    const floorTotal = houseFloor + parkingFloor;
    const diff = quoteTotal - floorTotal;
    const needsApproval = !missingUnit && !missingHouseFloor && diff < -tolerance;
    const signature = buildSignature({ unitId, quoteTotal, spotIds: spots, tolerance });

    return {
      internalId: item.internalId || null,
      unitId, quoteTotal, spotIds,
      houseFloor, parkingFloor, floorTotal, diff, tolerance,
      missingUnit, missingHouseFloor, missingParking, parkingDetail,
      needsApproval, signature,
      areaHousePing: house ? toNum(house.area_house_ping) : 0,
    };
  });
}

// 對外 check：遮蔽所有金額
function maskResult(r) {
  return {
    internalId: r.internalId,
    unitId: r.unitId,
    needsApproval: r.needsApproval,
    missingUnit: r.missingUnit,
    missingHouseFloor: r.missingHouseFloor,
    missingParking: r.missingParking,
    signature: r.signature,
  };
}

async function actionCheck(data) {
  const { projectId, operatorKey, items } = data || {};
  await assertOperator(projectId, operatorKey);
  if (!Array.isArray(items) || items.length === 0) {
    throw new HttpsError('invalid-argument', '缺少 items');
  }
  const { tolerance } = await loadProjectApprovalSettings(projectId);
  const results = await evaluateItems(projectId, items, tolerance);
  return {
    status: 'success',
    tolerance_applied: tolerance > 0,
    checkedAt: new Date().toISOString(),
    results: results.map(maskResult),
  };
}

// ---------- 主管候選 ----------

async function listSupervisorCandidates(projectId) {
  const base = await getEligibleRecipients(projectId, getDb(), { systems: SUPERVISOR_SYSTEMS, excludeRoles: EXCLUDED_ROLES, includeUnreachable: true });
  return base.map(r => ({ userKey: r.userKey, name: r.name, hasLine: !!r.hasLine, hasEmail: !!r.hasEmail }));
}

async function actionListApprovers(data) {
  const { projectId, operatorKey } = data || {};
  await assertOperator(projectId, operatorKey);
  const { approvers } = await loadProjectApprovalSettings(projectId);
  const candidates = await listSupervisorCandidates(projectId);
  candidates.sort((a, b) => String(a.name).localeCompare(String(b.name), 'zh-Hant'));
  return { status: 'success', candidates, configured: approvers };
}

/**
 * 列印時可選的主管清單：已設定 quoteApprovers → 只列這些人；否則退回全部候選
 */
async function resolveSelectableSupervisors(projectId) {
  const { approvers } = await loadProjectApprovalSettings(projectId);
  const candidates = await listSupervisorCandidates(projectId);
  if (approvers.length === 0) return { supervisors: candidates, fallback: true };
  const byKey = new Map(candidates.map(c => [c.userKey, c]));
  const selected = approvers.map(k => byKey.get(k)).filter(Boolean);
  // 設定名單全數失效（權限被移除）時退回全部候選
  if (selected.length === 0) return { supervisors: candidates, fallback: true };
  return { supervisors: selected, fallback: false };
}

async function actionListSupervisors(data) {
  const { projectId, operatorKey } = data || {};
  await assertOperator(projectId, operatorKey);
  const { supervisors, fallback } = await resolveSelectableSupervisors(projectId);
  supervisors.sort((a, b) => String(a.name).localeCompare(String(b.name), 'zh-Hant'));
  return { status: 'success', supervisors, fallback };
}

// ---------- 訊息組裝 ----------

function row(label, value, opts = {}) {
  return {
    type: 'box', layout: 'horizontal', margin: opts.margin || 'sm',
    contents: [
      { type: 'text', text: label, color: '#888888', size: 'sm', flex: 3 },
      { type: 'text', text: safeText(value, '—'), color: opts.color || '#333333', size: opts.size || 'sm', weight: opts.weight || 'regular', flex: 7, wrap: true, align: 'end' },
    ],
  };
}

function buildUnitBubble(ctx, u) {
  const parkingText = u.parking.length > 0
    ? `${u.parking.map(p => p.spotId).join('、')}（${u.parking.length} 個）`
    : '無';
  const salesText = [safeText(ctx.salesName), safeText(ctx.salesPhone)].filter(Boolean).join(' ') || '—';
  const body = [
    row('建案', ctx.projectName, { weight: 'bold' }),
    row('戶別', u.unitId, { weight: 'bold', size: 'lg' }),
    row('銷售', salesText),
    row('房屋面積', fmtPing(u.areaHousePing)),
    row('車位', parkingText),
    { type: 'separator', margin: 'md' },
    row('報價金額', `${fmtWan(u.quoteTotal)}${u.usePackageDeal ? '（配套）' : ''}`, { weight: 'bold', margin: 'md' }),
    ...(u.usePackageDeal ? [{ type: 'text', text: `配套價 ${fmtWan(u.packageDeal)} ＋ 配套金額 ${fmtWan(u.packageAmount)}`, size: 'xs', color: '#999999', align: 'end' }] : []),
    row('底價金額', fmtWan(u.floorTotal), { weight: 'bold' }),
    { type: 'text', text: `房屋 ${fmtWan(u.houseFloor)} ＋ 車位 ${fmtWan(u.parkingFloor)}`, size: 'xs', color: '#999999', align: 'end' },
    row('溢差價', `${u.diff < 0 ? '−' : ''}${fmtWan(Math.abs(u.diff))}`, { weight: 'bold', color: '#C62828', size: 'lg' }),
  ];
  const perPing = diffPerPing(u.diff, u.areaHousePing);
  if (perPing !== null) body.push(row('溢差價單價', fmtWanPerPing(perPing), { weight: 'bold', color: '#C62828' }));
  if (u.tolerance > 0) body.push(row('授權額度', fmtWan(u.tolerance)));
  body.push({ type: 'separator', margin: 'md' });
  if (u.hasNegotiation) {
    body.push({ type: 'text', text: `表價 ${fmtWan(u.houseListPrice)} → 議價後 ${fmtWan(u.houseNegotiatedPrice)}`, size: 'xs', color: '#666666', margin: 'md', wrap: true });
  }
  if (u.missingParking && u.missingParking.length > 0) {
    body.push({ type: 'text', text: `⚠ 車位 ${u.missingParking.join('、')} 查無底價資料，以 0 計`, size: 'xs', color: '#E65100', margin: 'sm', wrap: true });
  }
  body.push(row('時間', ctx.timestampText, { margin: 'md' }));
  if (ctx.operatorName && ctx.operatorName !== ctx.salesName) {
    body.push(row('操作帳號', ctx.operatorName));
  }

  return {
    type: 'bubble',
    header: {
      type: 'box', layout: 'vertical', backgroundColor: '#C62828',
      contents: [
        { type: 'text', text: '⚠ 報價低於底價，請主管確認', weight: 'bold', color: '#FFFFFF', size: 'md', wrap: true },
      ],
    },
    body: { type: 'box', layout: 'vertical', contents: body },
  };
}

function buildFlexMessages(ctx, units) {
  const bubbles = units.map(u => buildUnitBubble(ctx, u));
  const first = units[0];
  const altText = units.length === 1
    ? `[${ctx.projectName}] ${first.unitId} 報價低於底價，請主管確認`
    : `[${ctx.projectName}] ${first.unitId} 等 ${units.length} 戶報價低於底價，請主管確認`;
  const messages = [];
  for (let i = 0; i < bubbles.length; i += MAX_BUBBLES_PER_CAROUSEL) {
    const chunk = bubbles.slice(i, i + MAX_BUBBLES_PER_CAROUSEL);
    messages.push({
      type: 'flex',
      altText,
      contents: chunk.length === 1 ? chunk[0] : { type: 'carousel', contents: chunk },
    });
  }
  return messages;
}

function buildEmail(ctx, units) {
  const first = units[0];
  const subject = units.length === 1
    ? `[${ctx.projectName}] 報價低於底價待確認：${first.unitId}`
    : `[${ctx.projectName}] 報價低於底價待確認：${first.unitId} 等 ${units.length} 戶`;
  const salesText = [safeText(ctx.salesName), safeText(ctx.salesPhone)].filter(Boolean).join(' ') || '—';
  const tr = (label, value, style = '') => `<tr><td style="padding:6px 12px;color:#888;font-size:13px;white-space:nowrap;">${escapeHtml(label)}</td><td style="padding:6px 12px;font-size:14px;text-align:right;${style}">${value}</td></tr>`;

  const sections = units.map(u => {
    const parkingText = u.parking.length > 0 ? `${u.parking.map(p => p.spotId).join('、')}（${u.parking.length} 個）` : '無';
    const rows = [
      tr('建案', escapeHtml(ctx.projectName), 'font-weight:bold;'),
      tr('戶別', escapeHtml(u.unitId), 'font-weight:bold;font-size:18px;'),
      tr('銷售', escapeHtml(salesText)),
      tr('房屋面積', escapeHtml(fmtPing(u.areaHousePing))),
      tr('車位', escapeHtml(parkingText)),
      tr('報價金額', `${escapeHtml(fmtWan(u.quoteTotal))}${u.usePackageDeal ? `（配套）<div style="font-size:12px;color:#999;">配套價 ${escapeHtml(fmtWan(u.packageDeal))} ＋ 配套金額 ${escapeHtml(fmtWan(u.packageAmount))}</div>` : ''}`, 'font-weight:bold;border-top:1px solid #eee;'),
      tr('底價金額', `${escapeHtml(fmtWan(u.floorTotal))}<div style="font-size:12px;color:#999;">房屋 ${escapeHtml(fmtWan(u.houseFloor))} ＋ 車位 ${escapeHtml(fmtWan(u.parkingFloor))}</div>`, 'font-weight:bold;'),
      tr('溢差價', `${u.diff < 0 ? '−' : ''}${escapeHtml(fmtWan(Math.abs(u.diff)))}`, 'font-weight:bold;color:#C62828;font-size:18px;'),
    ];
    const perPing = diffPerPing(u.diff, u.areaHousePing);
    if (perPing !== null) rows.push(tr('溢差價單價', escapeHtml(fmtWanPerPing(perPing)), 'font-weight:bold;color:#C62828;'));
    if (u.tolerance > 0) rows.push(tr('授權額度', escapeHtml(fmtWan(u.tolerance))));
    if (u.hasNegotiation) rows.push(tr('議價', `表價 ${escapeHtml(fmtWan(u.houseListPrice))} → 議價後 ${escapeHtml(fmtWan(u.houseNegotiatedPrice))}`, 'color:#666;font-size:12px;border-top:1px solid #eee;'));
    if (u.missingParking && u.missingParking.length > 0) rows.push(tr('提醒', `車位 ${escapeHtml(u.missingParking.join('、'))} 查無底價資料，以 0 計`, 'color:#E65100;font-size:12px;'));
    rows.push(tr('時間', escapeHtml(ctx.timestampText), 'border-top:1px solid #eee;'));
    if (ctx.operatorName && ctx.operatorName !== ctx.salesName) rows.push(tr('操作帳號', escapeHtml(ctx.operatorName)));
    return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #eee;border-radius:6px;margin:0 0 16px;">${rows.join('')}</table>`;
  }).join('');

  const html = `<!doctype html><html><body style="margin:0;background:#f5f5f5;font-family:-apple-system,'Segoe UI',Roboto,'Microsoft JhengHei',sans-serif;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f5;padding:24px 0;">
  <tr><td align="center">
    <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,.1);">
      <tr><td style="background:#C62828;color:#fff;padding:16px 24px;font-weight:bold;font-size:16px;">⚠ 報價低於底價，請主管確認</td></tr>
      <tr><td style="padding:20px 24px 8px;">${sections}</td></tr>
      <tr><td style="background:#fafafa;padding:12px 24px;color:#999;font-size:12px;text-align:center;">本郵件由系統自動發送，請勿直接回覆</td></tr>
    </table>
  </td></tr>
</table>
</body></html>`;
  return { subject, html };
}

// ---------- 發送 ----------

async function pushLineWithRetry(token, to, messages) {
  const MAX_RETRIES = 3;
  let lastErr = null;
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      if (attempt > 1) await new Promise(r => setTimeout(r, 1000 * (attempt - 1)));
      await axios.post(LINE_PUSH_URL, { to, messages }, {
        headers: { Authorization: `Bearer ${token}` },
        timeout: 10000,
      });
      return;
    } catch (e) {
      lastErr = e;
      const status = e.response?.status;
      if (status !== 429 && status !== 500 && status !== 503) break;
    }
  }
  const msg = lastErr?.response?.data ? JSON.stringify(lastErr.response.data) : (lastErr?.message || 'unknown');
  throw new Error(msg);
}

function buildTransporter() {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: { user: process.env.SENDER_EMAIL, pass: process.env.GMAIL_APP_PASSWORD },
  });
}

async function actionNotify(data) {
  const {
    projectId, projectName: projectNameFromClient, operatorKey, operatorName,
    salesName, salesPhone, supervisorKeys, units,
  } = data || {};
  const operator = await assertOperator(projectId, operatorKey);
  if (!Array.isArray(units) || units.length === 0) throw new HttpsError('invalid-argument', '缺少 units');
  if (!Array.isArray(supervisorKeys) || supervisorKeys.length === 0) throw new HttpsError('invalid-argument', '請至少選擇一位主管');

  const settings = await loadProjectApprovalSettings(projectId);
  const projectName = safeText(projectNameFromClient) || settings.projectName || projectId;

  // 1) 後端重新核對（底價、額度皆取後端）
  const evaluated = await evaluateItems(projectId, units.map(u => ({
    internalId: u.internalId, unitId: u.unitId, quoteTotal: u.quoteTotal,
    parkingSpotIds: (Array.isArray(u.parking) ? u.parking : []).map(p => p?.spotId),
  })), settings.tolerance);
  const breached = evaluated.filter(r => r.needsApproval);
  if (breached.length === 0) {
    return { status: 'success', skipped: 'no-breach', requests: [], supervisors: [] };
  }

  // 2) 驗證主管
  const { supervisors: selectable } = await resolveSelectableSupervisors(projectId);
  const selectableMap = new Map(selectable.map(s => [s.userKey, s]));
  const requestedKeys = [...new Set(supervisorKeys.map(k => String(k || '').trim()).filter(Boolean))];
  const invalid = requestedKeys.filter(k => !selectableMap.has(k));
  if (invalid.length > 0) {
    throw new HttpsError('failed-precondition', `所選主管不在可通知名單內：${invalid.join('、')}`);
  }
  const userDocs = await getDocsByIds('users', requestedKeys);
  const supervisors = requestedKeys.map(k => {
    const u = userDocs.get(k) || {};
    const lineId = typeof u.lineId === 'string' && u.lineId.startsWith('U') ? u.lineId : '';
    const email = typeof u.email === 'string' && u.email.includes('@') ? u.email : '';
    return { userKey: k, name: u.name || selectableMap.get(k)?.name || k, lineId, email, channel: lineId ? 'line' : (email ? 'email' : null) };
  });
  if (supervisors.every(s => !s.channel)) {
    throw new HttpsError('failed-precondition', '所選主管皆未綁定 LINE 且無 Email，請先完成綁定或洽系統管理員');
  }

  // 3) 組訊息資料
  const unitInput = new Map(units.map(u => [String(u.internalId || u.unitId), u]));
  const timestampText = formatTaipei();
  const ctx = {
    projectName, salesName: safeText(salesName), salesPhone: safeText(salesPhone),
    operatorName: safeText(operatorName) || operator.name || '', timestampText,
  };
  const unitPayloads = breached.map(r => {
    const src = unitInput.get(String(r.internalId || r.unitId)) || {};
    const parking = (Array.isArray(src.parking) ? src.parking : []).map(p => {
      const spotId = String(p?.spotId || '').trim();
      const detail = r.parkingDetail.find(d => d.spotId === spotId);
      return { spotId, priceList: toNum(p?.priceList), priceFloor: detail ? detail.priceFloor : 0 };
    }).filter(p => p.spotId);
    const houseListPrice = toNum(src.houseListPrice);
    const houseNegotiatedPrice = toNum(src.houseNegotiatedPrice);
    return {
      ...r,
      usePackageDeal: !!src.usePackageDeal,
      // 配套：quoteTotal（實付總價）= packageDeal（配套價，一般期款）＋ packageAmount（配套金額，配套期款）
      packageDeal: toNum(src.packageDeal ?? src.packagePrice),
      packageAmount: toNum(src.packageAmount),
      houseListPrice, houseNegotiatedPrice,
      hasNegotiation: houseListPrice > 0 && houseNegotiatedPrice > 0 && houseListPrice !== houseNegotiatedPrice,
      areaHousePing: r.areaHousePing || toNum(src.areaHousePing),
      parking,
    };
  });

  // 4) 發送（每位主管一次；LINE 優先，無 LINE 用 Email）
  const simulated = await shouldBlockOutbound(projectId, 'line/email');
  const lineToken = process.env.ANXISMART_LINE_CRM_TOKEN || '';
  const flexMessages = buildFlexMessages(ctx, unitPayloads);
  const { subject, html } = buildEmail(ctx, unitPayloads);
  let transporter = null;
  const supervisorResults = [];
  for (const s of supervisors) {
    if (!s.channel) {
      supervisorResults.push({ userKey: s.userKey, name: s.name, channel: null, status: 'failed', error: 'no-channel' });
      continue;
    }
    if (simulated) {
      supervisorResults.push({ userKey: s.userKey, name: s.name, channel: s.channel, status: 'simulated' });
      continue;
    }
    try {
      if (s.channel === 'line') {
        if (!lineToken) throw new Error('missing-line-token');
        await pushLineWithRetry(lineToken, s.lineId, flexMessages);
      } else {
        if (!transporter) transporter = buildTransporter();
        await transporter.sendMail({
          from: `"安熙智慧建案管理系統" <${process.env.SENDER_EMAIL}>`,
          to: s.email, subject, html,
        });
      }
      supervisorResults.push({ userKey: s.userKey, name: s.name, channel: s.channel, status: 'sent' });
    } catch (e) {
      console.error(`[quoteApprovalApi] 通知主管 ${s.userKey} 失敗:`, e.message);
      supervisorResults.push({ userKey: s.userKey, name: s.name, channel: s.channel, status: 'failed', error: e.message || 'unknown' });
    }
  }

  // 5) 寫紀錄（每戶一筆）
  const db = getDb();
  const col = db.collection('projects').doc(projectId).collection('quoteApprovalRequests');
  const requests = [];
  for (const u of unitPayloads) {
    const ref = col.doc();
    await ref.set({
      unitId: u.unitId, projectName,
      salesName: ctx.salesName, salesPhone: ctx.salesPhone,
      operatorKey: String(operatorKey), operatorName: ctx.operatorName,
      quoteTotal: u.quoteTotal, floorTotal: u.floorTotal, houseFloor: u.houseFloor, parkingFloor: u.parkingFloor,
      diff: u.diff, tolerance: u.tolerance,
      diffPerPing: (() => { const v = diffPerPing(u.diff, u.areaHousePing); return v === null ? null : Math.round(v * 100) / 100; })(),
      areaHousePing: u.areaHousePing, usePackageDeal: u.usePackageDeal,
      packageDeal: u.packageDeal, packageAmount: u.packageAmount,   // quoteTotal 為實付總價（配套價＋配套金額）
      houseListPrice: u.houseListPrice, houseNegotiatedPrice: u.houseNegotiatedPrice,
      parking: u.parking,
      supervisors: supervisorResults.map(s => ({ userKey: s.userKey, name: s.name, channel: s.channel, status: s.status })),
      signature: u.signature, status: 'notified', source: 'quotePrint',
      simulated,
      createdAt: Timestamp.now(), createdAtTaipei: timestampText,
    });
    requests.push({ internalId: u.internalId, unitId: u.unitId, requestId: ref.id, signature: u.signature });
  }

  return {
    status: 'success',
    simulated,
    notifiedAt: new Date().toISOString(),
    notifiedAtTaipei: timestampText,
    requests,
    supervisors: supervisorResults,
  };
}

// ---------- Router ----------

async function handleQuoteApprovalAction(action, data) {
  switch (action) {
    case 'check': return actionCheck(data);
    case 'notify': return actionNotify(data);
    case 'listApprovers': return actionListApprovers(data);
    case 'listSupervisors': return actionListSupervisors(data);
    default:
      throw new HttpsError('invalid-argument', `未知的 action: ${action}`);
  }
}

module.exports = {
  handleQuoteApprovalAction,
  buildSignature,
  buildFlexMessages,
  buildEmail,
};
