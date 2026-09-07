// 銷控 AI 智能助理：草案執行（docs/銷控AI智能助理-spec.md §4.5、§4.7）
// Why: 不重用 updateSalesData（它會把未提供的數值／日期欄位設 null），這裡只 merge 草案內欄位；
//      車位配置／解除與持有車位同步比照 UnitDetailModal.commitParkingChanges／handleQuickParkingConfirm；
//      退戶呼叫 index.js 注入的 performCancelPurchase（與退戶對話框同一份邏輯）。

const { FieldValue, Timestamp } = require('firebase-admin/firestore');
const D = require('./data');
const { classifySalesStatus } = require('../utils/salesStatusGroups');
const { getEligibleRecipients } = require('../utils/getEligibleRecipients');
const { applyDerivedPrices } = require('../utils/priceDerive');

function dateToTs(s) {
  if (!s) return null;
  const d = new Date(`${s}T00:00:00+08:00`);
  return isNaN(d.getTime()) ? null : Timestamp.fromDate(d);
}

function ownedParkingEntry(p) {
  return {
    spotId: p.spotId,
    '車位編號': p.spotId,
    '車位底價': D.num(p.price_floor) ?? 0,
    '車位成交價': D.num(p.price_transaction) ?? D.num(p.price_list) ?? 0,
    '車位尺寸': p.size || '標準',
  };
}

function simpleRemarksSummary(notes) {
  const list = (Array.isArray(notes) ? notes : []).filter(n => n && typeof n.content === 'string');
  return list.map(n => `[${n.authorName || ''}] ${n.content}`).join('\n');
}

/**
 * @param ctx { db, projectId, projectName, user, data }
 * @param proposal { kind, unitId, actions[] }
 * @param deps { performCancelPurchase, buildRemarksSummary }
 */
async function applyProposal(ctx, proposal, deps = {}) {
  const { db, projectId, user } = ctx;
  const actions = Array.isArray(proposal.actions) ? proposal.actions : [];

  // ---- 退戶（單戶）----
  const cancelAction = actions.find(a => a.type === 'cancelPurchase');
  if (cancelAction) {
    const unitId = cancelAction.unitId || proposal.unitId;
    if (typeof deps.performCancelPurchase !== 'function') throw new Error('退戶功能未注入');
    const r = await deps.performCancelPurchase({
      projectId, unitId, operatorName: `${user.name}（AI 助理）`,
      cancelReasons: cancelAction.reasons || [], cancellationDate: cancelAction.cancellationDate || null,
    }, db);
    const notification = r.notification || { statusChanged: true, oldStatus: cancelAction.before?.salesStatus_backend || null, newStatus: '退戶', triggerType: 'cancel', eligibleRecipients: [] };
    return { applied: [`${unitId} 已退戶（清除 ${r.clearedParkingCount || 0} 個車位）`], notification, unitId, unitIds: [unitId] };
  }

  // ---- 戶別變更：逐戶套用（多戶草案一張卡多戶，見 validate.js resolveTargets）----
  const unitIds = [...new Set(actions.map(a => a.unitId).filter(Boolean))];
  if (unitIds.length === 0 && proposal.unitId) unitIds.push(proposal.unitId);
  // 車位全案只讀一次；每戶寫入後同步更新本地副本，避免同一車位被重複判定
  const parkSnap = await db.collection('salesParkings').where('projectId', '==', projectId).get();
  const parkings = parkSnap.docs.map(d => ({ id: d.id, ...d.data() }));

  const applied = [];
  const notifications = [];
  for (const unitId of unitIds) {
    const r = await applyUnit(ctx, unitId, actions.filter(a => a.unitId === unitId), parkings, deps);
    applied.push(...r.applied);
    if (r.notification?.statusChanged) notifications.push({ unitId, ...r.notification });
  }
  // 通知對話框只支援單戶；多戶狀態異動仍寫入異動紀錄，但不開通知
  const notification = unitIds.length === 1 ? (notifications[0] || { statusChanged: false }) : { statusChanged: false, batch: true, changedUnits: notifications.map(n => n.unitId) };
  return { applied, notification, unitId: unitIds.length === 1 ? unitIds[0] : null, unitIds };
}

async function applyUnit(ctx, unitId, unitActions, parkings, deps) {
  const { db, projectId, user } = ctx;
  const unitRef = db.collection('salesHouseholds').doc(`${projectId}_${unitId}`);
  const applied = [];
  let notification = { statusChanged: false };

  const unitSnap = await unitRef.get();
  if (!unitSnap.exists) throw new Error(`戶別 ${unitId} 不存在`);
  const unitBefore = unitSnap.data() || {};
  const oldStatus = unitBefore.salesStatus_backend || null;

  const updateAction = unitActions.find(a => a.type === 'unitUpdate');
  const assignAction = unitActions.find(a => a.type === 'parkingAssign');
  const releaseAction = unitActions.find(a => a.type === 'parkingRelease');
  const remarkAction = unitActions.find(a => a.type === 'addRemark');

  // ---- 戶別欄位 ----
  const unitPatch = {};
  if (updateAction) {
    // 執行時再驗一次能力（草案建立後 allowWrite／角色可能已變）
    const writable = D.writableFieldsFor(ctx.caps);
    for (const [k, v] of Object.entries(updateAction.changes || {})) {
      if (k === 'salespersonUserKey') { unitPatch[k] = Array.isArray(v) ? v : []; continue; }
      if (!writable.has(k)) continue;
      if (D.DATE_FIELDS.has(k)) unitPatch[k] = dateToTs(v);
      else if (k === 'salesperson') unitPatch[k] = D.normalizeSalespersons(v);
      else if (k === 'buyerDateOfBirth') unitPatch[k] = v && typeof v === 'object' && v.year ? { year: Number(v.year), month: Number(v.month), day: Number(v.day) } : null;
      else if (D.BOOL_FIELDS.has(k)) unitPatch[k] = v === true;
      else if (D.NUMERIC_FIELDS.has(k)) unitPatch[k] = D.num(v);
      else unitPatch[k] = v === undefined ? null : v;
    }
    // 衍生欄位：與 SalesInfoForm／UnitDetailModal 儲存流程一致
    if ('salesStatus_backend' in unitPatch) {
      unitPatch.status = unitPatch.salesStatus_backend;
      unitPatch.salesStatus_quote = unitPatch.salesStatus_backend ? '已售' : '';
    }
    // 💰 房屋總表價／總底價一律由明細（房屋＋露臺）衍生，露臺單價(表價)同步重算。
    //    validate 已算過並列入草案，此處是寫入前的保底（見 functions/utils/priceDerive.js）
    applyDerivedPrices(unitPatch, unitBefore);
  }
  const newStatus = 'salesStatus_backend' in unitPatch ? unitPatch.salesStatus_backend : oldStatus;
  const salespersonAfter = 'salesperson' in unitPatch ? unitPatch.salesperson : D.normalizeSalespersons(unitBefore.salesperson);
  const salespersonKeyAfter = 'salespersonUserKey' in unitPatch ? unitPatch.salespersonUserKey : D.normalizeSalespersons(unitBefore.salespersonUserKey);
  const buyerAfter = 'buyerName' in unitPatch ? unitPatch.buyerName : (unitBefore.buyerName || null);

  // ---- 車位 ----
  const batch = db.batch();
  const releasedIds = new Set((releaseAction?.parkings || []).map(p => p.spotId));
  const assignedIds = new Set((assignAction?.parkings || []).map(p => p.spotId));

  for (const r of releaseAction?.parkings || []) {
    const p = parkings.find(x => x.spotId === r.spotId && D.isDealParking(x, unitId));
    if (!p) throw new Error(`車位 ${r.spotId} 已不是 ${unitId} 的持有車位（資料已變動）`);
    batch.set(db.collection('salesParkings').doc(p.id), {
      buyerUnitId: null, buyerName: null, price_transaction: null, status: null, status_backend: null,
      salesperson: [], salespersonUserKey: [], remarks: null, updatedAt: FieldValue.serverTimestamp(),
    }, { merge: true });
    Object.assign(p, { buyerUnitId: null, buyerName: null, price_transaction: null, status: null, status_backend: null });
    applied.push(`車位 ${r.spotId} 已解除`);
  }
  for (const a of assignAction?.parkings || []) {
    const p = parkings.find(x => x.spotId === a.spotId);
    if (!p) throw new Error(`車位 ${a.spotId} 不存在`);
    const avail = D.parkingAvailability(p, unitId, ctx.data?.tierOverrides);
    if (!avail.ok) throw new Error(`車位 ${a.spotId} 無法配置：${avail.reason}（資料已變動）`);
    batch.set(db.collection('salesParkings').doc(p.id), {
      buyerUnitId: unitId, buyerName: buyerAfter, price_transaction: a.price_transaction ?? null,
      status: '已售', status_backend: newStatus, salesperson: salespersonAfter, salespersonUserKey: salespersonKeyAfter,
      updatedAt: FieldValue.serverTimestamp(),
    }, { merge: true });
    p.price_transaction = a.price_transaction ?? null; p.buyerUnitId = unitId; p.status_backend = newStatus;
    applied.push(`車位 ${a.spotId} 已配置（${a.price_transaction ?? '-'} 萬）`);
  }
  // 既有持有車位同步戶別欄位（狀態／銷售人員／買方）
  const syncFields = ['salesStatus_backend', 'salesperson', 'buyerName'].some(k => k in unitPatch);
  const ownedAfter = parkings.filter(p => (D.isDealParking(p, unitId) && !releasedIds.has(p.spotId)) || assignedIds.has(p.spotId));
  if (syncFields) {
    for (const p of ownedAfter) {
      if (assignedIds.has(p.spotId)) continue;
      batch.set(db.collection('salesParkings').doc(p.id), {
        status_backend: newStatus, salesperson: salespersonAfter, salespersonUserKey: salespersonKeyAfter, buyerName: buyerAfter,
        updatedAt: FieldValue.serverTimestamp(),
      }, { merge: true });
    }
  }
  if (assignedIds.size || releasedIds.size) {
    unitPatch['持有車位'] = ownedAfter.map(ownedParkingEntry);
  }

  // ---- 備註留言 ----
  if (remarkAction) {
    const notes = Array.isArray(unitBefore.remarkNotes) ? unitBefore.remarkNotes.slice() : [];
    const now = Timestamp.now();
    notes.push({
      noteId: `note-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`,
      type: 'user', category: remarkAction.category || 'general', content: remarkAction.content, images: [],
      authorName: user.name, authorKey: user.userKey, createdAt: now, updatedAt: now, pinned: false,
    });
    unitPatch.remarkNotes = notes;
    unitPatch.remarks = typeof deps.buildRemarksSummary === 'function' ? deps.buildRemarksSummary(notes) : simpleRemarksSummary(notes);
    applied.push('已新增備註留言');
  }

  if (Object.keys(unitPatch).length) {
    unitPatch.updatedAt = FieldValue.serverTimestamp();
    if (newStatus !== oldStatus) unitPatch.salesStatusChangedAt = FieldValue.serverTimestamp();
    batch.set(unitRef, unitPatch, { merge: true });
    // 只列使用者看得懂的中文欄位；內部欄位（時間戳、連動欄位、關聯陣列）一律不顯示
    const HIDDEN = new Set(['updatedAt', 'salesStatusChangedAt', 'status', 'salesStatus_quote', 'price_list_terrace_unit', 'salespersonUserKey', '持有車位', 'remarkNotes', 'remarks']);
    const labels = Object.keys(unitPatch).filter(k => !HIDDEN.has(k) && D.FIELD_LABELS[k]).map(k => D.FIELD_LABELS[k]);
    if (labels.length) applied.unshift(`${unitId} 已更新：${labels.join('、')}`);
  }
  await batch.commit();

  // ---- 狀態異動紀錄（與通知脫鉤）＋ 通知 ----
  if (newStatus !== oldStatus) {
    if (typeof deps.recordSalesStatusChange === 'function') {
      await deps.recordSalesStatusChange(db, { projectId, unitId, oldStatus, newStatus, source: 'aiAssistant', operatorName: `${user.name}（AI 助理）`, stampUnit: false });
    }
    try {
      const eligibleRecipients = await getEligibleRecipients(projectId, db);
      notification = { statusChanged: true, oldStatus, newStatus, statusClass: classifySalesStatus(newStatus), triggerType: 'update', eligibleRecipients };
    } catch (e) {
      console.error('[salesAi/execute] 通知候選查詢失敗', e);
      notification = { statusChanged: true, oldStatus, newStatus, triggerType: 'update', eligibleRecipients: [] };
    }
  }
  return { applied, notification, unitId };
}

module.exports = { applyProposal };
