// 銷控 AI 智能助理：草案驗證器（純規則，不靠模型）
// docs/銷控AI智能助理-spec.md §4.4、§4.7
//
// 輸入：draft（模型的 propose_* 參數）＋ answers（使用者回答）＋ 目前資料
// 輸出：{ actions, diff, missing, warnings, blockers, resolved }

const D = require('./data');
const { CANCEL_REASONS } = require('./tools');

const q = (field, label, type, extra = {}) => ({ field, label, type, options: [], required: true, default: null, hint: null, ...extra });
const opt = v => ({ value: String(v), label: String(v) });

function answerFor(answers, field) {
  if (!answers || !(field in answers)) return undefined;
  const v = answers[field];
  if (v === '' || v === null) return null;
  return v;
}

/** 主入口 */
async function buildProposal(ctx, draft, answers = {}) {
  const data = ctx.data || (ctx.data = await D.loadProjectData(ctx.db, ctx.projectId));
  const missing = [];
  const warnings = [];
  const blockers = [];
  const diff = [];

  // ---- 1. 戶別 ----
  let unitIdRaw = answerFor(answers, 'unitId') ?? draft.unitId;
  const found = D.findById(data.units, unitIdRaw, 'unitId');
  let unit = found.exact;
  if (!unit) {
    if (found.candidates.length) {
      missing.push(q('unitId', `「${unitIdRaw}」有多個可能的戶別，請選擇`, 'select', { options: found.candidates.map(u => opt(u.unitId)) }));
    } else {
      blockers.push(`查無戶別「${unitIdRaw}」`);
    }
    return finish({ kind: draft.kind, unitId: unitIdRaw, missing, warnings, blockers, diff, actions: [] });
  }
  const unitId = unit.unitId;
  const ownedParkings = data.parkings.filter(p => D.isDealParking(p, unitId));

  if (draft.kind === 'cancel') return validateCancel(ctx, data, unit, ownedParkings, draft, answers, { missing, warnings, blockers, diff });

  // ---- 2. 欄位白名單與正規化 ----
  const changes = {};
  const rawChanges = draft.changes && typeof draft.changes === 'object' ? draft.changes : {};
  for (const [k, v] of Object.entries(rawChanges)) {
    if (D.FORBIDDEN_HINT[k]) { blockers.push(`${D.FORBIDDEN_HINT[k]}不可由 AI 修改，請至戶別資訊操作`); continue; }
    if (!D.WRITABLE_FIELDS.has(k)) { console.warn(`[salesAi/validate] 丟棄非白名單欄位 ${k}`); continue; }
    if (v === undefined) continue;
    changes[k] = v;
  }
  // 使用者回答覆蓋
  for (const f of D.WRITABLE_FIELDS) {
    const a = answerFor(answers, f);
    if (a !== undefined) changes[f] = a;
  }

  // 數值
  for (const f of D.NUMERIC_FIELDS) {
    if (!(f in changes)) continue;
    if (changes[f] === null || changes[f] === '') { changes[f] = null; continue; }
    const n = Number(String(changes[f]).replace(/[,，萬\s]/g, ''));
    if (!Number.isFinite(n) || n < 0) { missing.push(q(f, `${D.FIELD_LABELS[f]} 的數值無法辨識（收到「${changes[f]}」），請輸入`, 'number')); delete changes[f]; }
    else changes[f] = n;
  }
  // 日期
  for (const f of D.DATE_FIELDS) {
    if (!(f in changes)) continue;
    if (changes[f] === null) continue;
    const d = D.parseDateInput(changes[f]);
    if (d === undefined) { missing.push(q(f, `${D.FIELD_LABELS[f]} 無法辨識（收到「${changes[f]}」），請選擇日期`, 'date', { default: D.todayTaipei() })); delete changes[f]; }
    else changes[f] = d;
  }
  // 文字
  for (const f of ['buyerName', 'buyerPhone', 'contractType']) {
    if (f in changes && changes[f] !== null) changes[f] = String(changes[f]).trim() || null;
  }
  // 「清空」但原本就是空 → 不算變更（例如使用者略過選填的買方姓名）
  for (const f of Object.keys(changes)) {
    if (changes[f] === null && (unit[f] === null || unit[f] === undefined || unit[f] === '')) delete changes[f];
  }

  // ---- 3. 狀態 ----
  if ('salesStatus_backend' in changes) {
    const s = changes.salesStatus_backend === null ? '' : String(changes.salesStatus_backend).trim();
    if (!s || ['(無)', '無', '可售', '空', '清空', '未售'].includes(s)) {
      changes.salesStatus_backend = null;
    } else if (!data.statusNames.includes(s)) {
      const fuzzy = data.statusNames.filter(n => n.includes(s) || s.includes(n));
      if (fuzzy.length === 1) { changes.salesStatus_backend = fuzzy[0]; warnings.push(`狀態「${s}」對應為「${fuzzy[0]}」`); }
      else {
        missing.push(q('salesStatus_backend', `狀態「${s}」不在本案清單，請選擇`, 'select', { options: data.statusNames.map(opt) }));
        delete changes.salesStatus_backend;
      }
    }
  }
  const newStatus = 'salesStatus_backend' in changes ? changes.salesStatus_backend : (unit.salesStatus_backend || null);
  const newTier = D.classifyCommitment(newStatus, data.tierOverrides);
  const becomingDeal = newTier === 'signed' || newTier === 'booked';

  // ---- 4. 銷售人員 ----
  let salespersonNames = null;
  if ('salesperson' in changes) {
    const raw = changes.salesperson;
    const names = raw === null ? [] : D.normalizeSalespersons(raw);
    const resolved = [];
    const unresolved = [];
    for (const n of names) {
      const m = D.matchSalesperson(data.personnel, n);
      if (m.exact) { resolved.push(m.exact.name); if (m.exact.name !== n) warnings.push(`銷售人員「${n}」對應為「${m.exact.name}」`); }
      else unresolved.push(n);
    }
    if (unresolved.length) {
      missing.push(q('salesperson', `找不到銷售人員「${unresolved.join('、')}」，請從名單選擇`, 'multiselect', {
        options: data.personnel.map(p => opt(p.name)), hint: resolved.length ? `已辨識：${resolved.join('、')}` : null,
      }));
      delete changes.salesperson;
    } else {
      salespersonNames = [...new Set(resolved)];
      changes.salesperson = salespersonNames;
      changes.salespersonUserKey = salespersonNames.map(n => String((data.personnel.find(p => p.name === n) || {}).phone || '').trim()).filter(Boolean);
    }
  }
  const effectiveSalesperson = salespersonNames ?? D.normalizeSalespersons(unit.salesperson);

  // ---- 5. 成交類狀態的必填 ----
  if (becomingDeal && !missing.some(m => m.field === 'salesperson') && effectiveSalesperson.length === 0) {
    missing.push(q('salesperson', '此戶尚未指定銷售人員，請選擇（可多選）', 'multiselect', { options: data.personnel.map(p => opt(p.name)) }));
  }
  const effectiveBuyer = 'buyerName' in changes ? changes.buyerName : unit.buyerName;
  if (becomingDeal && !effectiveBuyer && answerFor(answers, 'buyerName') === undefined) {
    missing.push(q('buyerName', '買方姓名（可略過）', 'text', { required: false }));
  }
  const dateRules = [
    { key: /小訂|下訂|訂金|預訂/, field: 'payment_deposit_date' },
    { key: /補足/, field: 'payment_supplement_date' },
    { key: /簽約/, field: 'payment_contract_date' },
  ];
  if ('salesStatus_backend' in changes && newStatus) {
    for (const r of dateRules) {
      if (r.key.test(newStatus) && !changes[r.field] && !unit[r.field] && answerFor(answers, r.field) === undefined) {
        missing.push(q(r.field, `${D.FIELD_LABELS[r.field]}（預設今天）`, 'date', { default: D.todayTaipei(), required: false }));
      }
    }
  }

  // ---- 6. 車位配置 ----
  const assign = [];
  for (const item of Array.isArray(draft.assignParkings) ? draft.assignParkings : []) {
    const rawId = item && (item.spotId || item);
    const pickKey = `spot:${D.normalizeId(rawId)}`;
    const picked = answerFor(answers, pickKey);
    const r = D.findById(data.parkings, picked || rawId, 'spotId');
    if (!r.exact) {
      if (r.candidates.length) missing.push(q(pickKey, `車位「${rawId}」有多個可能，請選擇`, 'select', { options: r.candidates.map(p => opt(p.spotId)) }));
      else blockers.push(`查無車位「${rawId}」`);
      continue;
    }
    const p = r.exact;
    const avail = D.parkingAvailability(p, unitId, data.tierOverrides);
    if (!avail.ok) { blockers.push(`車位 ${p.spotId} 無法配置：${avail.reason}`); continue; }
    if (avail.warn) warnings.push(`車位 ${p.spotId} ${avail.warn}，配置後將改為本戶持有`);
    // 價格
    const priceKey = `parking_price:${p.spotId}`;
    let priceRaw = answerFor(answers, priceKey);
    if (priceRaw === undefined) priceRaw = item && item.price !== undefined ? item.price : undefined;
    let price = null; let priceSource = 'input';
    const listP = D.num(p.price_list); const floorP = D.num(p.price_floor);
    if (priceRaw === undefined || priceRaw === null || priceRaw === '') {
      if (avail.reason === 'own' && D.num(p.price_transaction) !== null) { price = D.num(p.price_transaction); priceSource = 'keep'; }
      else {
        missing.push(q(priceKey, `車位 ${p.spotId} 成交價（萬）`, 'number', {
          hint: `表價 ${listP ?? '無'}／底價 ${floorP ?? '無'}`, default: listP,
          options: [{ value: 'list', label: `依表價 ${listP ?? '-'}` }, { value: 'floor', label: `依底價 ${floorP ?? '-'}` }],
        }));
        continue;
      }
    } else {
      const s = String(priceRaw).trim().toLowerCase();
      if (['list', '表價', '依表價'].includes(s)) { price = listP; priceSource = 'list'; if (price === null) blockers.push(`車位 ${p.spotId} 沒有表價資料`); }
      else if (['floor', '底價', '依底價'].includes(s)) { price = floorP; priceSource = 'floor'; if (price === null) blockers.push(`車位 ${p.spotId} 沒有底價資料`); }
      else {
        const n = Number(s.replace(/[,，萬\s]/g, ''));
        if (!Number.isFinite(n) || n < 0) { missing.push(q(priceKey, `車位 ${p.spotId} 成交價無法辨識（收到「${priceRaw}」），請輸入`, 'number', { default: listP })); continue; }
        price = n;
      }
    }
    if (price !== null && floorP !== null && price < floorP) warnings.push(`車位 ${p.spotId} 成交價 ${price} 低於底價 ${floorP}`);
    assign.push({ spotId: p.spotId, docId: p.id, price_transaction: price, priceSource, before: { status_backend: p.status_backend || null, buyerUnitId: p.buyerUnitId || null, price_transaction: D.num(p.price_transaction) } });
  }

  // ---- 7. 解除車位 ----
  const release = [];
  for (const rawId of Array.isArray(draft.releaseParkings) ? draft.releaseParkings : []) {
    const r = D.findById(ownedParkings, rawId, 'spotId');
    if (!r.exact) { blockers.push(`車位「${rawId}」不是 ${unitId} 的持有車位，無法解除`); continue; }
    release.push({ spotId: r.exact.spotId, docId: r.exact.id, before: { status_backend: r.exact.status_backend || null, price_transaction: D.num(r.exact.price_transaction) } });
  }

  // ---- 8. 價格檢查 ----
  const floorHouse = D.num(unit.price_floor_house_total);
  if ('price_transaction_house' in changes && changes.price_transaction_house !== null) {
    if (floorHouse !== null && changes.price_transaction_house < floorHouse) warnings.push(`房屋成交價 ${changes.price_transaction_house} 低於底價 ${floorHouse}`);
    if (D.num(unit.price_transaction_house) !== null && D.num(unit.price_transaction_house) !== changes.price_transaction_house) warnings.push(`房屋成交價變更：${D.num(unit.price_transaction_house)} → ${changes.price_transaction_house}`);
  }

  // ---- 9. 成交總價自動計算 ----
  const houseAfter = 'price_transaction_house' in changes ? changes.price_transaction_house : D.num(unit.price_transaction_house);
  const parkingChanged = assign.length > 0 || release.length > 0;
  if (!('price_transaction_total' in changes) && (('price_transaction_house' in changes) || parkingChanged) && houseAfter !== null) {
    const releasedIds = new Set(release.map(r => r.spotId));
    const assignedIds = new Set(assign.map(a => a.spotId));
    let parkingSum = 0;
    for (const p of ownedParkings) if (!releasedIds.has(p.spotId) && !assignedIds.has(p.spotId)) parkingSum += D.num(p.price_transaction) ?? 0;
    for (const a of assign) parkingSum += a.price_transaction ?? 0;
    changes.price_transaction_total = Math.round((houseAfter + parkingSum) * 100) / 100;
    changes.__autoTotal = true;
  }

  // ---- 10. 備註 ----
  let remark = null;
  if (draft.addRemark && draft.addRemark.content && String(draft.addRemark.content).trim()) {
    remark = { content: String(draft.addRemark.content).trim().slice(0, 1000), category: ['general', 'customer', 'reminder', 'finance', 'contract'].includes(draft.addRemark.category) ? draft.addRemark.category : 'general' };
  }

  // ---- 11. 空草案 ----
  const autoTotal = changes.__autoTotal === true; delete changes.__autoTotal;
  const fieldKeys = Object.keys(changes).filter(k => k !== 'salespersonUserKey');
  if (fieldKeys.length === 0 && assign.length === 0 && release.length === 0 && !remark && missing.length === 0 && blockers.length === 0) {
    blockers.push('沒有任何可套用的變更');
  }

  // ---- 12. diff ----
  for (const k of fieldKeys) {
    const before = k === 'salesperson' ? D.formatSalespersons(unit.salesperson, '、', '') : (D.DATE_FIELDS.has(k) ? D.toDateStr(unit[k]) : (unit[k] ?? null));
    const after = k === 'salesperson' ? (changes[k] || []).join('、') : changes[k];
    if (String(before ?? '') === String(after ?? '')) continue;
    diff.push({ target: `戶別 ${unitId}`, field: k, label: D.FIELD_LABELS[k] || '其他欄位', from: before ?? null, to: after ?? null, auto: k === 'price_transaction_total' && autoTotal });
  }
  for (const a of assign) {
    diff.push({ target: `車位 ${a.spotId}`, field: 'assign', label: '配置給', from: a.before.buyerUnitId, to: unitId });
    diff.push({ target: `車位 ${a.spotId}`, field: 'price_transaction', label: '成交價（萬）', from: a.before.price_transaction, to: a.price_transaction, auto: a.priceSource === 'list' || a.priceSource === 'floor', note: a.priceSource === 'list' ? '依表價' : a.priceSource === 'floor' ? '依底價' : null });
    diff.push({ target: `車位 ${a.spotId}`, field: 'status_backend', label: '狀態', from: a.before.status_backend, to: newStatus });
  }
  for (const r of release) diff.push({ target: `車位 ${r.spotId}`, field: 'release', label: '解除配置', from: unitId, to: null });
  if (remark) diff.push({ target: `戶別 ${unitId}`, field: 'remarkNotes', label: '新增備註留言', from: null, to: remark.content });

  const actions = [];
  if (fieldKeys.length) actions.push({ type: 'unitUpdate', unitId, changes: { ...changes }, before: Object.fromEntries(fieldKeys.map(k => [k, D.DATE_FIELDS.has(k) ? D.toDateStr(unit[k]) : (unit[k] ?? null)])) });
  if (assign.length) actions.push({ type: 'parkingAssign', unitId, parkings: assign });
  if (release.length) actions.push({ type: 'parkingRelease', unitId, parkings: release });
  if (remark) actions.push({ type: 'addRemark', unitId, ...remark });

  return finish({ kind: 'changes', unitId, missing, warnings, blockers, diff, actions, summary: summarize(unitId, actions) });
}

function validateCancel(ctx, data, unit, ownedParkings, draft, answers, acc) {
  const { missing, warnings, blockers, diff } = acc;
  const unitId = unit.unitId;
  if (!unit.salesStatus_backend && !unit.buyerName) blockers.push(`${unitId} 目前沒有銷控狀態與買方資料，無需退戶`);
  let reasons = answerFor(answers, 'cancelReasons');
  if (reasons === undefined) reasons = Array.isArray(draft.reasons) ? draft.reasons : [];
  reasons = (Array.isArray(reasons) ? reasons : String(reasons || '').split(/[,，、]/)).map(s => String(s).trim()).filter(Boolean);
  if (reasons.length === 0) {
    missing.push(q('cancelReasons', '退戶原因（可多選）', 'multiselect', { options: CANCEL_REASONS.map(opt) }));
  }
  let date = answerFor(answers, 'cancellationDate');
  if (date === undefined) date = draft.date || null;
  const parsed = date ? D.parseDateInput(date) : D.todayTaipei();
  if (parsed === undefined) { missing.push(q('cancellationDate', '退戶日期', 'date', { default: D.todayTaipei() })); }
  warnings.push('不可逆：買方資料、付款進度、銷售人員與車位關聯將清空並備份至退戶資料');
  diff.push({ target: `戶別 ${unitId}`, field: 'salesStatus_backend', label: '銷控狀態', from: unit.salesStatus_backend || null, to: null });
  diff.push({ target: `戶別 ${unitId}`, field: 'buyerName', label: '買方姓名', from: unit.buyerName || null, to: null });
  for (const p of ownedParkings) diff.push({ target: `車位 ${p.spotId}`, field: 'release', label: '解除配置', from: unitId, to: null });
  const actions = [{ type: 'cancelPurchase', unitId, reasons, cancellationDate: parsed || D.todayTaipei(), parkingCount: ownedParkings.length, before: { salesStatus_backend: unit.salesStatus_backend || null, buyerName: unit.buyerName || null } }];
  return finish({ kind: 'cancel', unitId, missing, warnings, blockers, diff, actions, requireTypedConfirm: unitId, summary: `退戶 ${unitId}（原因：${reasons.join('、') || '待填'}）` });
}

function summarize(unitId, actions) {
  const parts = [];
  for (const a of actions) {
    if (a.type === 'unitUpdate') parts.push(Object.keys(a.changes).filter(k => k !== 'salespersonUserKey').map(k => `${D.FIELD_LABELS[k] || '其他欄位'}→${Array.isArray(a.changes[k]) ? a.changes[k].join('、') : (a.changes[k] ?? '清空')}`).join('、'));
    if (a.type === 'parkingAssign') parts.push(`配置車位 ${a.parkings.map(p => `${p.spotId}(${p.price_transaction ?? '-'})`).join('、')}`);
    if (a.type === 'parkingRelease') parts.push(`解除車位 ${a.parkings.map(p => p.spotId).join('、')}`);
    if (a.type === 'addRemark') parts.push('新增備註');
  }
  return `${unitId}：${parts.join('；')}`;
}

function finish(p) {
  const dedupe = arr => [...new Set(arr)];
  return {
    kind: p.kind, unitId: p.unitId, actions: p.actions || [], diff: p.diff || [],
    missing: p.missing || [], warnings: dedupe(p.warnings || []), blockers: dedupe(p.blockers || []),
    requireTypedConfirm: p.requireTypedConfirm || null, summary: p.summary || '',
    executable: (p.blockers || []).length === 0 && (p.missing || []).filter(m => m.required !== false).length === 0,
  };
}

module.exports = { buildProposal };
