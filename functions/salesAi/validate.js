// 銷控 AI 智能助理：草案驗證器（純規則，不靠模型）
// docs/銷控AI智能助理-spec.md §4.4、§4.7
//
// 輸入：draft（模型的 propose_* 參數）＋ answers（使用者回答）＋ 目前資料
// 輸出：{ actions, diff, missing, warnings, blockers, resolved }

const D = require('./data');
const { CANCEL_REASONS } = require('./tools');
const { deriveTotalPrice } = require('../utils/priceDerive');

const q = (field, label, type, extra = {}) => ({ field, label, type, options: [], required: true, default: null, hint: null, ...extra });
const opt = v => ({ value: String(v), label: String(v) });

/**
 * 房屋總表價／總底價是衍生欄位（＝房屋＋露臺），模型指定總額時改寫到對應的明細欄位。
 * - 沒有露臺：總額與房屋價等價，直接改寫
 * - 有露臺且為「調整」（每坪／加減／百分比）：只調房屋部分，露臺不動（實務調價作法）
 * - 有露臺且為「指定金額」：無法判斷要動哪一項，擋下請使用者指明
 * @returns {string|null} 實際要寫入的欄位；null = 已擋下
 */
function redirectDerivedTotalField(field, unit, mode, { warnings, blockers, unitId }) {
  const map = D.DERIVED_TOTAL_TO_DETAIL[field];
  if (!map) return field;
  const label = D.FIELD_LABELS[field] || field;
  const onlyLabel = D.FIELD_LABELS[map.only] || map.only;
  if ((D.num(unit.area_terrace_ping) || 0) <= 0) return map.only;
  if (mode === 'set') {
    blockers.push(`${unitId} 有露臺，${label}＝${onlyLabel}＋${D.FIELD_LABELS[map.terrace]}（系統自動計算），請指明要改哪一項`);
    return null;
  }
  warnings.push(`${unitId} 的${label}為自動計算，已改為調整${onlyLabel}（露臺價格不變）`);
  return map.only;
}

function answerFor(answers, field) {
  if (!answers || !(field in answers)) return undefined;
  const v = answers[field];
  if (v === '' || v === null) return null;
  return v;
}

const MAX_BATCH = 30; // 一張草案最多幾戶（§9 批次）
const includesCI = (a, b) => String(a || '').toUpperCase().includes(String(b || '').toUpperCase());
const floorNum = u => { const n = Number(String(u.floor || '').replace(/\D/g, '')); return n > 0 ? n : null; };

/**
 * 解析目標戶別：unitId（單戶）、unitIds（多戶）、filter（棟別／樓層／狀態篩選）。
 * 回傳戶別陣列；完全無法決定時回 null（原因已推入 acc）。
 */
function resolveTargets(data, draft, answers, acc) {
  const { missing, blockers } = acc;
  const ids = [];
  const single = answerFor(answers, 'unitId') ?? draft.unitId;
  if (single) ids.push(single);
  for (const x of Array.isArray(draft.unitIds) ? draft.unitIds : []) if (x) ids.push(x);
  const units = []; const seen = new Set();
  const add = u => { if (u && !seen.has(u.unitId)) { seen.add(u.unitId); units.push(u); } };
  for (const raw of ids) {
    const f = D.findById(data.units, raw, 'unitId');
    if (f.exact) add(f.exact);
    else if (f.candidates.length) {
      if (ids.length === 1) missing.push(q('unitId', `「${raw}」有多個可能的戶別，請選擇`, 'select', { options: f.candidates.map(u => opt(u.unitId)) }));
      else blockers.push(`「${raw}」有多個可能的戶別：${f.candidates.map(u => u.unitId).join('、')}，請指明`);
    } else blockers.push(`查無戶別「${raw}」`);
  }
  const filter = draft.filter && typeof draft.filter === 'object' ? draft.filter : null;
  const hasFilter = filter && Object.values(filter).some(v => v !== undefined && v !== null && v !== '' && !(Array.isArray(v) && v.length === 0));
  if (hasFilter) {
    let list = data.units.slice();
    if (filter.building) {
      const b = String(filter.building).trim().toUpperCase().replace(/棟$/, '');
      list = list.filter(u => includesCI(u.building, b) || String(u.unitId).toUpperCase().split(/[-－]/)[0] === b);
    }
    if (Array.isArray(filter.floors) && filter.floors.length) {
      const set = new Set(filter.floors.map(f => Number(String(f).replace(/\D/g, ''))).filter(n => n > 0));
      list = list.filter(u => set.has(floorNum(u)));
    }
    if (filter.floorFrom !== undefined && filter.floorFrom !== null && filter.floorFrom !== '') { const n = Number(String(filter.floorFrom).replace(/\D/g, '')); list = list.filter(u => floorNum(u) !== null && floorNum(u) >= n); }
    if (filter.floorTo !== undefined && filter.floorTo !== null && filter.floorTo !== '') { const n = Number(String(filter.floorTo).replace(/\D/g, '')); list = list.filter(u => floorNum(u) !== null && floorNum(u) <= n); }
    if (filter.status) {
      const s = String(filter.status).trim();
      if (['可售', '空', '未售'].includes(s)) list = list.filter(u => !u.salesStatus_backend);
      else if (['已售', '成交'].includes(s)) list = list.filter(u => ['signed', 'booked'].includes(D.classifyCommitment(u.salesStatus_backend, data.tierOverrides)));
      else list = list.filter(u => includesCI(u.salesStatus_backend, s));
    }
    if (list.length === 0) blockers.push('篩選條件沒有符合的戶別');
    list.sort((a, b) => String(a.unitId).localeCompare(String(b.unitId), 'zh-Hant', { numeric: true }));
    for (const u of list) add(u);
  }
  if (units.length > MAX_BATCH) { blockers.push(`符合 ${units.length} 戶，超過單次上限 ${MAX_BATCH} 戶，請縮小範圍（例如指定樓層）`); return null; }
  if (units.length === 0) { if (!missing.length && !blockers.length) blockers.push('未指定戶別'); return null; }
  return units;
}

/** 主入口 */
async function buildProposal(ctx, draft, answers = {}) {
  const data = ctx.data || (ctx.data = await D.loadProjectData(ctx.db, ctx.projectId));
  const acc = { missing: [], warnings: [], blockers: [], diff: [] };
  const { missing, blockers, diff } = acc;

  // ---- 1. 目標戶別（單戶／多戶）----
  const targets = resolveTargets(data, draft, answers, acc);
  if (!targets) return finish({ kind: draft.kind, unitId: draft.unitId || null, ...acc, actions: [] });

  if (draft.kind === 'cancel') {
    if (targets.length !== 1) { blockers.push('退戶一次只能處理一戶'); return finish({ kind: 'cancel', unitId: null, ...acc, actions: [] }); }
    const unit = targets[0];
    return validateCancel(ctx, data, unit, data.parkings.filter(p => D.isDealParking(p, unit.unitId)), draft, answers, acc);
  }

  const isBatch = targets.length > 1;
  if (isBatch && ((Array.isArray(draft.assignParkings) && draft.assignParkings.length) || (Array.isArray(draft.releaseParkings) && draft.releaseParkings.length))) {
    blockers.push('多戶草案不支援車位配置／解除，請針對單一戶別處理');
  }
  const actions = [];
  for (const unit of targets) {
    const r = await validateUnitChanges(ctx, data, unit, draft, answers, acc, { isBatch });
    actions.push(...r.actions);
  }
  if (actions.length === 0 && missing.length === 0 && blockers.length === 0) blockers.push('沒有任何可套用的變更');
  const unitIds = targets.map(u => u.unitId);
  if (isBatch && diff.length) acc.warnings.unshift(`此草案將一次修改 ${unitIds.length} 戶，請逐戶核對`);
  return finish({ kind: 'changes', unitId: isBatch ? null : unitIds[0], unitIds, ...acc, actions, summary: summarize(unitIds, actions, draft) });
}

/** 單一戶別的變更驗證（多戶草案逐戶呼叫，missing／warnings／blockers／diff 累積在 acc） */
async function validateUnitChanges(ctx, data, unit, draft, answers, acc, { isBatch = false } = {}) {
  const { missing, warnings, blockers, diff } = acc;
  const unitId = unit.unitId;
  const ownedParkings = data.parkings.filter(p => D.isDealParking(p, unitId));

  // ---- 2. 欄位白名單與正規化 ----
  // 可寫欄位＝使用者本人在戶別資訊表單能編輯的欄位（AI 是使用者的分身，見 data.js FIELD_DEFS）
  const writable = D.writableFieldsFor(ctx.caps);
  const changes = {};
  const autoFields = new Set(); // 由系統自動補齊的欄位（草案卡標示「自動計算」）
  const adjustNotes = {}; // 規則式調價的說明（草案卡括號顯示）
  const rawChanges = { ...(draft.changes && typeof draft.changes === 'object' ? draft.changes : {}) };

  // 2a. 規則式調價（每坪加價／加減金額／百分比／設定）：由系統依該戶現值計算，模型不自行算術
  for (const adj of Array.isArray(draft.adjustments) ? draft.adjustments : []) {
    if (!adj || typeof adj !== 'object') continue;
    const mode = String(adj.mode || 'delta');
    // 總額欄位為衍生值：改寫到對應明細欄位後再依現值計算
    const field = redirectDerivedTotalField(
      D.FIELD_ALIASES[adj.field] || adj.field, unit, mode, { warnings, blockers, unitId });
    if (field === null) continue;
    const label = D.FIELD_LABELS[field] || String(adj.field);
    if (!D.NUMERIC_FIELDS.has(field)) { blockers.push(`「${label}」不是可調整的金額欄位`); continue; }
    const value = Number(String(adj.value ?? '').replace(/[,，萬%％坪\s]/g, ''));
    if (!Number.isFinite(value)) { blockers.push(`${label} 的調整值「${adj.value}」無法辨識`); continue; }
    const base = D.num(unit[field]);
    const sign = value >= 0 ? '+' : '−';
    const absV = Math.abs(value);
    let next; let note = null;
    if (mode === 'set') { next = value; }
    else {
      if (base === null) { warnings.push(`${unitId} 目前沒有${label}，無法依現值調整，已略過`); continue; }
      if (mode === 'perPing') {
        const area = D.num(unit.area_house_ping);
        if (!area) { warnings.push(`${unitId} 沒有房屋總面積，無法每坪調整，已略過`); continue; }
        next = base + value * area; note = `每坪${sign}${absV}萬 × ${area}坪`;
      } else if (mode === 'percent') { next = base * (1 + value / 100); note = `${sign}${absV}%`; }
      else { next = base + value; note = `${sign}${absV}萬`; }
    }
    const decimals = Number.isInteger(Number(adj.decimals)) ? Math.min(2, Math.max(0, Number(adj.decimals))) : 0;
    next = Number(next.toFixed(decimals));
    if (next < 0) { blockers.push(`${unitId} ${label}調整後為負數（${next}）`); continue; }
    rawChanges[field] = next;
    if (note) adjustNotes[field] = note;
  }

  for (const [k0, v] of Object.entries(rawChanges)) {
    // 模型直接指定總表價／總底價 → 改寫到明細欄位（有露臺時擋下請它指明）
    const k = redirectDerivedTotalField(
      D.FIELD_ALIASES[k0] || k0, unit, 'set', { warnings, blockers, unitId });
    if (k === null) continue;
    if (D.FORBIDDEN_HINT[k]) { blockers.push(D.FORBIDDEN_HINT[k]); continue; }
    if (!writable.has(k)) { console.warn(`[salesAi/validate] 丟棄非白名單欄位 ${k0}`); continue; }
    if (v === undefined) continue;
    changes[k] = v;
  }
  // 使用者回答覆蓋
  for (const f of writable) {
    const a = answerFor(answers, f);
    if (a !== undefined) changes[f] = a;
  }

  // 數值
  for (const f of D.NUMERIC_FIELDS) {
    if (!(f in changes)) continue;
    if (changes[f] === null || changes[f] === '') { changes[f] = null; continue; }
    const n = Number(String(changes[f]).replace(/[,，萬%％\s]/g, ''));
    if (!Number.isFinite(n) || n < 0) { missing.push(q(f, `${D.FIELD_LABELS[f]} 的數值無法辨識（收到「${changes[f]}」），請輸入`, 'number')); delete changes[f]; }
    else if ((f === 'housePriceRatio' || f === 'landPriceRatio') && n > 100) { missing.push(q(f, `${D.FIELD_LABELS[f]} 須介於 0～100（收到 ${n}），請輸入`, 'number')); delete changes[f]; }
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
  // 布林（優付、是否首購）
  for (const f of D.BOOL_FIELDS) {
    if (!(f in changes)) continue;
    const b = D.parseBool(changes[f]);
    if (b === undefined) { missing.push(q(f, `${D.FIELD_LABELS[f]}（收到「${changes[f]}」無法辨識）`, 'select', { options: [{ value: 'true', label: '是' }, { value: 'false', label: '否' }] })); delete changes[f]; }
    else changes[f] = b;
  }
  // 生日（民國物件）
  if ('buyerDateOfBirth' in changes) {
    const dob = D.parseRocDate(changes.buyerDateOfBirth);
    if (dob === undefined) { missing.push(q('buyerDateOfBirth', `出生年月日無法辨識（收到「${changes.buyerDateOfBirth}」），請輸入民國 YY/MM/DD`, 'text')); delete changes.buyerDateOfBirth; }
    else changes.buyerDateOfBirth = dob;
  }
  // 文字
  for (const f of D.TEXT_FIELDS) {
    if (!(f in changes) || changes[f] === null) continue;
    const v = Array.isArray(changes[f]) ? changes[f].map(s => String(s).trim()).filter(Boolean).join(',') : String(changes[f]).trim();
    changes[f] = v || null;
  }
  // 合約方式須在本案清單內（與 SalesInfoForm 下拉一致）
  const contractTypes = Array.isArray(ctx.project?.contractTypes) ? ctx.project.contractTypes.map(s => String(s).trim()).filter(Boolean) : [];
  if ('contractType' in changes && changes.contractType !== null && contractTypes.length) {
    const s = changes.contractType;
    if (!contractTypes.includes(s)) {
      const fuzzy = contractTypes.filter(c => c.includes(s) || s.includes(c));
      if (fuzzy.length === 1) { changes.contractType = fuzzy[0]; warnings.push(`合約方式「${s}」對應為「${fuzzy[0]}」`); }
      else { missing.push(q('contractType', `合約方式「${s}」不在本案清單，請選擇`, 'select', { options: contractTypes.map(opt) })); delete changes.contractType; }
    }
  }
  // 露臺相關欄位只有有露臺的戶別才存在（與編輯表單 v-if 一致）
  if ((D.num(unit.area_terrace_ping) || 0) <= 0) {
    for (const f of D.TERRACE_ONLY_FIELDS) {
      if (f in changes) { blockers.push(`${unitId} 沒有露臺面積，無「${D.FIELD_LABELS[f]}」欄位`); delete changes[f]; }
    }
  }
  // 房土比：只給一個就自動補另一個；兩個都給則加總必須 100（與 UnitDetailModal.saveChanges 相同規則）
  if ('housePriceRatio' in changes || 'landPriceRatio' in changes) {
    const hIn = 'housePriceRatio' in changes; const lIn = 'landPriceRatio' in changes;
    const h = hIn ? changes.housePriceRatio : D.num(unit.housePriceRatio);
    const l = lIn ? changes.landPriceRatio : D.num(unit.landPriceRatio);
    const r2 = x => Math.round(x * 100) / 100;
    if (hIn && !lIn) { changes.landPriceRatio = h === null ? null : r2(100 - h); autoFields.add('landPriceRatio'); }
    else if (lIn && !hIn) { changes.housePriceRatio = l === null ? null : r2(100 - l); autoFields.add('housePriceRatio'); }
    else if (h !== null && l !== null && Math.abs(r2(h + l) - 100) > 0.001) blockers.push(`房土比加總 ${r2(h + l)}% 不等於 100%，請調整房屋或土地價款比例`);
    else if ((h === null) !== (l === null)) blockers.push('房土比須同時填寫或同時清空');
  }
  // 「清空」但原本就是空 → 不算變更（例如使用者略過選填的買方姓名）
  for (const f of Object.keys(changes)) {
    if (changes[f] === null && (unit[f] === null || unit[f] === undefined || unit[f] === '')) { delete changes[f]; autoFields.delete(f); }
  }
  // 房屋總表價／總底價：明細有異動就重算總額並列入草案（草案卡標示「自動計算」）
  for (const [totalKey, m] of Object.entries(D.DERIVED_TOTAL_TO_DETAIL)) {
    if (!(m.only in changes) && !(m.terrace in changes)) continue;
    const next = deriveTotalPrice(
      m.only in changes ? changes[m.only] : D.num(unit[m.only]),
      m.terrace in changes ? changes[m.terrace] : D.num(unit[m.terrace]),
    );
    if (next === D.num(unit[totalKey])) continue;
    changes[totalKey] = next;
    autoFields.add(totalKey);
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
      // 略過選填的銷售人員（答 null）且原本就空 → 不算變更
      if (salespersonNames.length === 0 && D.normalizeSalespersons(unit.salesperson).length === 0) { delete changes.salesperson; delete changes.salespersonUserKey; salespersonNames = null; }
    }
  }
  const effectiveSalesperson = salespersonNames ?? D.normalizeSalespersons(unit.salesperson);

  // ---- 5. 成交類狀態的必填 ----
  // 只在「本次草案把狀態改成成交類」時補問銷售人員／買方；使用者只改表價、底價等其他欄位時，
  // 即使該戶原本就是成交狀態且銷售人員空白，也不反問（那不是使用者這次要處理的事）。
  const statusChanging = 'salesStatus_backend' in changes;
  // 銷售人員比照前端表單：不強制（required: false，可略過），只在狀態改為成交類時提醒補上
  if (statusChanging && becomingDeal && !missing.some(m => m.field === 'salesperson') && effectiveSalesperson.length === 0 && answerFor(answers, 'salesperson') === undefined) {
    missing.push(q('salesperson', '此戶尚未指定銷售人員（可多選，可略過）', 'multiselect', { options: data.personnel.map(p => opt(p.name)), required: false }));
  }
  const effectiveBuyer = 'buyerName' in changes ? changes.buyerName : unit.buyerName;
  if (statusChanging && becomingDeal && !effectiveBuyer && answerFor(answers, 'buyerName') === undefined) {
    missing.push(q('buyerName', '買方姓名（可略過）', 'text', { required: false }));
  }
  const dateRules = [
    { key: /小訂|下訂|訂金|預訂/, field: 'payment_deposit_date' },
    { key: /補足/, field: 'payment_complete_date' }, // 前端「補足日期」實際綁 payment_complete_date
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
  const listHouse = 'price_list_house_total' in changes ? changes.price_list_house_total : D.num(unit.price_list_house_total);
  const floorHouse = 'price_floor_house_total' in changes ? changes.price_floor_house_total : D.num(unit.price_floor_house_total);
  if ('price_transaction_house' in changes && changes.price_transaction_house !== null) {
    if (floorHouse !== null && changes.price_transaction_house < floorHouse) warnings.push(`房屋成交價 ${changes.price_transaction_house} 低於底價 ${floorHouse}`);
    if (D.num(unit.price_transaction_house) !== null && D.num(unit.price_transaction_house) !== changes.price_transaction_house) warnings.push(`房屋成交價變更：${D.num(unit.price_transaction_house)} → ${changes.price_transaction_house}`);
  }
  // 表價／底價變更：比照 UnitDetailModal 儲存前的「確認變更價格」提醒（總額為衍生值，看明細欄位）
  const priceListChanged = ['price_list_house_only', 'price_list_terrace'].some(f => f in changes);
  const priceFloorChanged = ['price_floor_house_only', 'price_floor_terrace'].some(f => f in changes);
  if (priceListChanged || priceFloorChanged) {
    warnings.push(`您正在修改房屋${priceListChanged && priceFloorChanged ? '表價與底價' : priceListChanged ? '表價' : '底價'}，會影響報價系統與銷控表，請確認`);
    if (listHouse !== null && floorHouse !== null && listHouse < floorHouse) warnings.push(`房屋表價 ${listHouse} 低於底價 ${floorHouse}`);
    if (listHouse !== null && listHouse > 0 && D.num(unit.price_transaction_house) !== null && !('price_transaction_house' in changes) && D.num(unit.price_transaction_house) !== D.num(unit.price_list_house_total)) {
      warnings.push(`${unitId} 已有成交價 ${D.num(unit.price_transaction_house)}，表價／底價變更不會影響既有成交價`);
    }
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
    autoFields.add('price_transaction_total');
  }

  // ---- 10. 備註 ----
  let remark = null;
  if (draft.addRemark && draft.addRemark.content && String(draft.addRemark.content).trim()) {
    remark = { content: String(draft.addRemark.content).trim().slice(0, 1000), category: ['general', 'customer', 'reminder', 'finance', 'contract'].includes(draft.addRemark.category) ? draft.addRemark.category : 'general' };
  }

  // ---- 11. 空草案 ----
  const fieldKeys = Object.keys(changes).filter(k => k !== 'salespersonUserKey');
  if (!isBatch && fieldKeys.length === 0 && assign.length === 0 && release.length === 0 && !remark && missing.length === 0 && blockers.length === 0) {
    blockers.push('沒有任何可套用的變更');
  }

  // ---- 12. diff ----
  for (const k of fieldKeys) {
    const before = D.displayValue(k, unit[k]);
    const after = D.displayValue(k, changes[k]);
    if (String(before ?? '') === String(after ?? '')) continue;
    diff.push({ target: `戶別 ${unitId}`, field: k, label: D.FIELD_LABELS[k] || '其他欄位', from: before ?? null, to: after ?? null, auto: autoFields.has(k), note: adjustNotes[k] || null });
  }
  for (const a of assign) {
    diff.push({ target: `車位 ${a.spotId}`, field: 'assign', label: '配置給', from: a.before.buyerUnitId, to: unitId });
    diff.push({ target: `車位 ${a.spotId}`, field: 'price_transaction', label: '成交價（萬）', from: a.before.price_transaction, to: a.price_transaction, auto: a.priceSource === 'list' || a.priceSource === 'floor', note: a.priceSource === 'list' ? '依表價' : a.priceSource === 'floor' ? '依底價' : null });
    diff.push({ target: `車位 ${a.spotId}`, field: 'status_backend', label: '狀態', from: a.before.status_backend, to: newStatus });
  }
  for (const r of release) diff.push({ target: `車位 ${r.spotId}`, field: 'release', label: '解除配置', from: unitId, to: null });
  if (remark) diff.push({ target: `戶別 ${unitId}`, field: 'remarkNotes', label: '新增備註留言', from: null, to: remark.content });

  const actions = [];
  if (fieldKeys.length) actions.push({ type: 'unitUpdate', unitId, changes: { ...changes }, before: Object.fromEntries(fieldKeys.map(k => [k, D.displayValue(k, unit[k])])) });
  if (assign.length) actions.push({ type: 'parkingAssign', unitId, parkings: assign });
  if (release.length) actions.push({ type: 'parkingRelease', unitId, parkings: release });
  if (remark) actions.push({ type: 'addRemark', unitId, ...remark });

  return { actions };
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

function summarize(unitIds, actions, draft = {}) {
  if (unitIds.length === 1) {
    const parts = [];
    for (const a of actions) {
      if (a.type === 'unitUpdate') parts.push(Object.keys(a.changes).filter(k => k !== 'salespersonUserKey').map(k => `${D.FIELD_LABELS[k] || '其他欄位'}→${D.displayValue(k, a.changes[k]) ?? '清空'}`).join('、'));
      if (a.type === 'parkingAssign') parts.push(`配置車位 ${a.parkings.map(p => `${p.spotId}(${p.price_transaction ?? '-'})`).join('、')}`);
      if (a.type === 'parkingRelease') parts.push(`解除車位 ${a.parkings.map(p => p.spotId).join('、')}`);
      if (a.type === 'addRemark') parts.push('新增備註');
    }
    return `${unitIds[0]}：${parts.join('；')}`;
  }
  // 多戶：列出調整規則與欄位，不逐值列出
  const parts = [];
  const MODE_TEXT = { perPing: '每坪', percent: '', delta: '', set: '設為' };
  for (const adj of Array.isArray(draft.adjustments) ? draft.adjustments : []) {
    if (!adj || !adj.field) continue;
    const label = D.FIELD_LABELS[D.FIELD_ALIASES[adj.field] || adj.field] || adj.field;
    const v = Number(String(adj.value ?? '').replace(/[,，萬%％坪\s]/g, ''));
    const sign = v >= 0 ? '+' : '−';
    parts.push(`${label}${MODE_TEXT[adj.mode] ?? ''}${adj.mode === 'set' ? v : `${sign}${Math.abs(v)}${adj.mode === 'percent' ? '%' : '萬'}`}`);
  }
  const labels = new Set();
  for (const a of actions) if (a.type === 'unitUpdate') Object.keys(a.changes).filter(k => k !== 'salespersonUserKey').forEach(k => labels.add(D.FIELD_LABELS[k] || '其他欄位'));
  if (actions.some(a => a.type === 'addRemark')) labels.add('備註留言');
  const touched = unitIds.filter(id => actions.some(a => a.unitId === id));
  const head = `${touched.length} 戶（${touched.slice(0, 6).join('、')}${touched.length > 6 ? '…' : ''}）`;
  return `${head}：${parts.length ? parts.join('、') : [...labels].join('、')}`;
}

/**
 * 差異 → 人可讀文字（執行結果回覆、對話歷史、稽核）。
 * 例：戶別 A-3：房屋表價（萬）3,567 → 3,615（每坪+1萬 × 47.64坪）；銷控狀態 （空） → 保留
 */
function diffToText(diff, { maxTargets = 30 } = {}) {
  const fmt = v => {
    if (v === null || v === undefined || v === '') return '（空）';
    if (typeof v === 'number') return v.toLocaleString('zh-TW');
    if (Array.isArray(v)) return v.join('、');
    return String(v).replace(/^(\d{4})-(\d{2})-(\d{2})$/, '$1/$2/$3');
  };
  const groups = new Map();
  for (const d of Array.isArray(diff) ? diff : []) {
    if (!groups.has(d.target)) groups.set(d.target, []);
    groups.get(d.target).push(d);
  }
  const lines = [];
  let i = 0;
  for (const [target, rows] of groups) {
    if (i++ >= maxTargets) { lines.push(`…另有 ${groups.size - maxTargets} 個項目`); break; }
    const parts = rows.map(d => {
      if (d.field === 'assign') return `配置給 ${fmt(d.to)}${d.from ? `（原 ${fmt(d.from)}）` : ''}`;
      if (d.field === 'release') return `解除配置（原 ${fmt(d.from)}）`;
      const tail = d.note ? `（${d.note}）` : d.auto ? '（自動計算）' : '';
      return `${d.label} ${fmt(d.from)} → ${fmt(d.to)}${tail}`;
    });
    lines.push(`${target}：${parts.join('；')}`);
  }
  return lines.join('\n');
}

function finish(p) {
  const dedupe = arr => [...new Set(arr)];
  // 多戶時同一欄位的問題只問一次（答案套用到全部戶別）
  const seenQ = new Set();
  const missing = (p.missing || []).filter(m => { if (seenQ.has(m.field)) return false; seenQ.add(m.field); return true; });
  return {
    kind: p.kind, unitId: p.unitId, unitIds: p.unitIds || (p.unitId ? [p.unitId] : []), actions: p.actions || [], diff: p.diff || [],
    missing, warnings: dedupe(p.warnings || []), blockers: dedupe(p.blockers || []),
    requireTypedConfirm: p.requireTypedConfirm || null, summary: p.summary || '',
    executable: (p.blockers || []).length === 0 && missing.filter(m => m.required !== false).length === 0 && (p.actions || []).length > 0,
  };
}

module.exports = { buildProposal, diffToText };
