// 銷控 AI 智能助理：工具定義（通用 JSON Schema）與查詢類 handler
// docs/銷控AI智能助理-spec.md §4.3
// 規則：每個工具都有 requires（能力）；agent 依能力註冊；handler 內再檢查一次。
//       propose_* 只回草案（由 validate.js 驗證），不寫資料。

const D = require('./data');

const CANCEL_REASONS = [
  '總價太高', '單價太高', '自備款不足', '貸款成數太少', '地點不符', '家人反對', '家人意外、重病', '資金斷鏈',
  '神明指示', '風水忌諱', '生活機能不足', '環境不喜歡', '換戶', '景氣不好', '工期太久', '財務規劃暫不買房',
];

function requireCap(ctx, cap) {
  if (!ctx.caps.has(cap)) {
    const err = new Error(`沒有 ${cap} 能力`);
    err.code = 'permission';
    throw err;
  }
}

async function ensureData(ctx) {
  if (!ctx.data) ctx.data = await D.loadProjectData(ctx.db, ctx.projectId);
  return ctx.data;
}

const limitNum = (v, max) => Math.max(1, Math.min(max, Number(v) || max));
const includesCI = (a, b) => String(a || '').toUpperCase().includes(String(b || '').toUpperCase());

// ---------------------------------------------------------------
// 工具定義
// ---------------------------------------------------------------
const TOOLS = [
  {
    name: 'find_units',
    requires: 'sales.read',
    description: '依條件查詢本建案戶別（住宅單位，如 A-3）。可用棟別、樓層、銷控狀態、銷售人員、買方姓名、關鍵字、價格上限篩選。狀態「可售」代表銷控狀態為空。回傳最多 limit 筆。',
    parameters: {
      type: 'object',
      properties: {
        building: { type: 'string', description: '棟別，例如 A' },
        floor: { type: 'string', description: '樓層，例如 3 或 3F' },
        status: { type: 'string', description: '銷控狀態名稱；「可售」代表空狀態；「已售」代表任何成交類狀態（小訂/補足/簽約等）' },
        salesperson: { type: 'string', description: '銷售人員姓名（部分比對）' },
        buyerName: { type: 'string', description: '買方姓名（部分比對）' },
        keyword: { type: 'string', description: '戶別編號或備註關鍵字' },
        priceMax: { type: 'number', description: '房屋總表價上限（萬）' },
        sortBy: { type: 'string', enum: ['unitId', 'price_list_asc', 'price_list_desc', 'floor_asc', 'floor_desc', 'updated_desc'], description: '排序' },
        limit: { type: 'integer', description: '最多筆數（預設 30，上限 60）' },
      },
    },
    async handler(ctx, args) {
      requireCap(ctx, 'sales.read');
      const data = await ensureData(ctx);
      let list = data.units.slice();
      if (args.building) list = list.filter(u => includesCI(u.building, args.building));
      if (args.floor) {
        const f = String(args.floor).replace(/[Ff樓]/g, '');
        list = list.filter(u => String(u.floor || '').replace(/[Ff樓]/g, '') === f);
      }
      if (args.status) {
        const s = String(args.status).trim();
        if (s === '可售' || s === '空' || s === '未售') list = list.filter(u => !u.salesStatus_backend);
        else if (s === '已售' || s === '成交') list = list.filter(u => ['signed', 'booked'].includes(D.classifyCommitment(u.salesStatus_backend, data.tierOverrides)));
        else list = list.filter(u => includesCI(u.salesStatus_backend, s));
      }
      if (args.salesperson) list = list.filter(u => D.normalizeSalespersons(u.salesperson).some(n => includesCI(n, args.salesperson)));
      if (args.buyerName) list = list.filter(u => includesCI(u.buyerName, args.buyerName));
      if (args.keyword) list = list.filter(u => includesCI(u.unitId, args.keyword) || includesCI(u.remarks, args.keyword));
      if (args.priceMax) list = list.filter(u => D.num(u.price_list_house_total) !== null && D.num(u.price_list_house_total) <= Number(args.priceMax));
      const cmpId = (a, b) => String(a.unitId).localeCompare(String(b.unitId), 'zh-Hant', { numeric: true });
      const floorNum = u => Number(String(u.floor || '').replace(/\D/g, '')) || 0;
      switch (args.sortBy) {
        case 'price_list_asc': list.sort((a, b) => (D.num(a.price_list_house_total) ?? 1e12) - (D.num(b.price_list_house_total) ?? 1e12)); break;
        case 'price_list_desc': list.sort((a, b) => (D.num(b.price_list_house_total) ?? -1) - (D.num(a.price_list_house_total) ?? -1)); break;
        case 'floor_asc': list.sort((a, b) => floorNum(a) - floorNum(b) || cmpId(a, b)); break;
        case 'floor_desc': list.sort((a, b) => floorNum(b) - floorNum(a) || cmpId(a, b)); break;
        case 'updated_desc': list.sort((a, b) => (D.toDateStr(b.updatedAt) || '').localeCompare(D.toDateStr(a.updatedAt) || '')); break;
        default: list.sort(cmpId);
      }
      const total = list.length;
      const lim = limitNum(args.limit, 60);
      return { total, returned: Math.min(total, lim), units: list.slice(0, lim).map(u => D.slimUnit(u, data.parkings)) };
    },
  },
  {
    name: 'get_unit',
    requires: 'sales.read',
    description: '取得單一戶別的完整銷控資料（狀態、價格、買方、銷售人員、付款進度、持有車位）。找不到時回傳候選清單。',
    parameters: { type: 'object', properties: { unitId: { type: 'string', description: '戶別編號，例如 A-3' } }, required: ['unitId'] },
    async handler(ctx, args) {
      requireCap(ctx, 'sales.read');
      const data = await ensureData(ctx);
      const { exact, candidates } = D.findById(data.units, args.unitId, 'unitId');
      if (!exact) return { found: false, candidates: candidates.map(u => u.unitId), message: candidates.length ? '有多個或近似的戶別，請確認' : '查無此戶別' };
      return { found: true, unit: D.slimUnit(exact, data.parkings) };
    },
  },
  {
    name: 'find_parkings',
    requires: 'sales.read',
    description: '依條件查詢本建案車位（如 B6-18）。available=true 只列可配置的車位（狀態為空）。',
    parameters: {
      type: 'object',
      properties: {
        floor: { type: 'string', description: '樓層，例如 B3' },
        status: { type: 'string', description: '狀態名稱；「可售」代表空狀態' },
        available: { type: 'boolean', description: '只列可配置（無綁定、狀態為空）' },
        buyerUnitId: { type: 'string', description: '對應戶別' },
        keyword: { type: 'string', description: '車位編號關鍵字' },
        type: { type: 'string', description: '類型／尺寸關鍵字，例如 大車位、機械' },
        limit: { type: 'integer', description: '最多筆數（預設 40，上限 80）' },
      },
    },
    async handler(ctx, args) {
      requireCap(ctx, 'sales.read');
      const data = await ensureData(ctx);
      let list = data.parkings.slice();
      if (args.floor) list = list.filter(p => includesCI(p.floor, args.floor) || includesCI(p.spotId, args.floor));
      if (args.available === true) list = list.filter(p => !p.status_backend && !p.buyerUnitId);
      if (args.status) {
        const s = String(args.status).trim();
        if (s === '可售' || s === '空') list = list.filter(p => !p.status_backend);
        else list = list.filter(p => includesCI(p.status_backend, s));
      }
      if (args.buyerUnitId) {
        const keys = D.idKeys(args.buyerUnitId);
        list = list.filter(p => keys.has(D.normalizeId(p.buyerUnitId)) || keys.has(D.normalizeId(p.buyerUnitId).replace(/-/g, '')));
      }
      if (args.keyword) list = list.filter(p => includesCI(p.spotId, args.keyword));
      if (args.type) list = list.filter(p => includesCI(p.type, args.type) || includesCI(p.size, args.type));
      list.sort((a, b) => String(a.spotId).localeCompare(String(b.spotId), 'zh-Hant', { numeric: true }));
      const total = list.length;
      const lim = limitNum(args.limit, 80);
      return { total, returned: Math.min(total, lim), parkings: list.slice(0, lim).map(p => D.slimParking(p, data.tierOverrides)) };
    },
  },
  {
    name: 'get_parking',
    requires: 'sales.read',
    description: '取得單一車位資料（狀態、底價、表價、成交價、對應戶別）。',
    parameters: { type: 'object', properties: { spotId: { type: 'string', description: '車位編號，例如 B6-18' } }, required: ['spotId'] },
    async handler(ctx, args) {
      requireCap(ctx, 'sales.read');
      const data = await ensureData(ctx);
      const { exact, candidates } = D.findById(data.parkings, args.spotId, 'spotId');
      if (!exact) return { found: false, candidates: candidates.map(p => p.spotId), message: candidates.length ? '有多個或近似的車位，請確認' : '查無此車位' };
      return { found: true, parking: D.slimParking(exact, data.tierOverrides) };
    },
  },
  {
    name: 'get_project_summary',
    requires: 'sales.read',
    description: '本建案銷售摘要：戶數、各狀態戶數、可售戶數、成交總額（房屋＋車位）、車位可售數、各銷售人員成交戶數。',
    parameters: { type: 'object', properties: {} },
    async handler(ctx) {
      requireCap(ctx, 'sales.read');
      const data = await ensureData(ctx);
      const byStatus = {};
      let sold = 0, available = 0, houseTotal = 0, listTotalAvailable = 0;
      const bySales = {};
      for (const u of data.units) {
        const s = u.salesStatus_backend || '可售';
        byStatus[s] = (byStatus[s] || 0) + 1;
        const tier = D.classifyCommitment(u.salesStatus_backend, data.tierOverrides);
        if (tier === 'signed' || tier === 'booked') {
          sold += 1;
          houseTotal += D.num(u.price_transaction_house) ?? D.num(u.price_floor_house_total) ?? 0;
          for (const n of D.normalizeSalespersons(u.salesperson)) bySales[n] = (bySales[n] || 0) + 1;
        } else if (!u.salesStatus_backend) {
          available += 1;
          listTotalAvailable += D.num(u.price_list_house_total) ?? 0;
        }
      }
      let parkingSold = 0, parkingAvail = 0, parkingTotal = 0;
      for (const p of data.parkings) {
        if (D.isDealParking(p)) { parkingSold += 1; parkingTotal += D.num(p.price_transaction) ?? D.num(p.price_floor) ?? 0; }
        else if (!p.status_backend && !p.buyerUnitId) parkingAvail += 1;
      }
      return {
        戶數: data.units.length, 已售戶數: sold, 可售戶數: available, 各狀態戶數: byStatus,
        成交總額_萬: { 房屋: Math.round(houseTotal), 車位: Math.round(parkingTotal), 合計: Math.round(houseTotal + parkingTotal) },
        可售戶表價合計_萬: Math.round(listTotalAvailable),
        車位: { 總數: data.parkings.length, 已售: parkingSold, 可售: parkingAvail },
        各銷售人員成交戶數: bySales,
        統計時間: D.nowTaipeiText(),
        註: '成交價為空的戶別以底價估算',
      };
    },
  },
  {
    name: 'find_status_changes',
    requires: 'sales.read',
    description: '查詢某日期區間內的「銷控狀態異動」（誰在何時把哪一戶改成什麼狀態），以及付款日期（小訂／補足／簽約）落在區間內的戶別。問「今天／昨天／本週成交了什麼」「最近有什麼異動」一律用此工具，不可用其他工具推測。',
    parameters: {
      type: 'object',
      properties: {
        from: { type: 'string', description: '起日 YYYY-MM-DD；也接受 今天／昨天' },
        to: { type: 'string', description: '迄日 YYYY-MM-DD（含）；省略 = 與起日相同' },
        unitId: { type: 'string', description: '只看某戶（選填）' },
      },
      required: ['from'],
    },
    async handler(ctx, args) {
      requireCap(ctx, 'sales.read');
      const data = await ensureData(ctx);
      const from = D.parseDateInput(args.from) || D.todayTaipei();
      const to = args.to ? (D.parseDateInput(args.to) || from) : from;
      if (to < from) return { error: '迄日早於起日' };
      const { Timestamp } = require('firebase-admin/firestore');
      const startTs = Timestamp.fromDate(new Date(`${from}T00:00:00+08:00`));
      const endTs = Timestamp.fromDate(new Date(`${to}T23:59:59.999+08:00`));
      // 主要來源：salesStatusLogs（每次狀態變更後端自動寫）；相容來源：notificationLogs（通知對話框才寫，較舊資料只有這份）
      const projRef = ctx.db.collection('projects').doc(ctx.projectId);
      const [logSnap, notifSnap] = await Promise.all([
        projRef.collection('salesStatusLogs').where('createdAt', '>=', startTs).where('createdAt', '<=', endTs).orderBy('createdAt', 'desc').limit(300).get(),
        projRef.collection('notificationLogs').where('createdAt', '>=', startTs).where('createdAt', '<=', endTs).orderBy('createdAt', 'desc').limit(200).get(),
      ]);
      const unitFilter = args.unitId ? D.idKeys(args.unitId) : null;
      const matchUnit = id => !unitFilter || unitFilter.has(D.normalizeId(id)) || unitFilter.has(D.normalizeId(id).replace(/-/g, ''));
      const changes = [];
      const seen = new Set(); // 同戶同分鐘同新狀態視為同一筆（兩份日誌可能重複）
      const pushChange = (x, isCancel) => {
        if (!matchUnit(x.unitId)) return;
        const time = D.toDateTimeStr(x.createdAt);
        const key = `${x.unitId}|${time}|${x.newStatus || ''}`;
        if (seen.has(key)) return;
        seen.add(key);
        changes.push({
          時間: time, 戶別: x.unitId, 舊狀態: x.oldStatus || '可售', 新狀態: x.newStatus || '可售',
          異動類型: isCancel ? '退戶' : (x.statusClass === 'deal' ? '成交類' : x.statusClass === 'released' ? '釋出類' : (x.newStatus ? '其他' : '清空')),
          操作人員: x.operatorName || null,
        });
      };
      logSnap.forEach(d => { const x = d.data(); pushChange(x, x.source === 'cancelPurchase'); });
      notifSnap.forEach(d => { const x = d.data(); if (x.type && x.type !== 'salesStatus') return; pushChange(x, x.triggerType === 'cancel'); });
      changes.sort((a, b) => String(b.時間).localeCompare(String(a.時間)));
      const inRange = v => { const s = D.toDateStr(v); return s && s >= from && s <= to; };
      const paymentHits = [];
      const modified = [];
      for (const u of data.units) {
        if (!matchUnit(u.unitId)) continue;
        const hits = [];
        if (inRange(u.payment_deposit_date)) hits.push(`小訂 ${D.toDateStr(u.payment_deposit_date)}`);
        if (inRange(u.payment_supplement_date)) hits.push(`補足 ${D.toDateStr(u.payment_supplement_date)}`);
        if (inRange(u.payment_contract_date)) hits.push(`簽約 ${D.toDateStr(u.payment_contract_date)}`);
        if (hits.length) paymentHits.push({ 戶別: u.unitId, 目前狀態: u.salesStatus_backend || '可售', 付款日期: hits, 銷售人員: D.formatSalespersons(u.salesperson, '、', ''), 房屋成交價_萬: D.num(u.price_transaction_house) });
        if (inRange(u.updatedAt)) modified.push(u.unitId);
      }
      return {
        區間: `${from} ～ ${to}`,
        狀態異動紀錄: changes,
        付款日期落在區間的戶別: paymentHits,
        資料有修改的戶別_不代表成交: modified,
        註: changes.length === 0 && paymentHits.length === 0 ? '此區間沒有狀態異動與付款日期紀錄' : '狀態異動紀錄來自系統狀態異動日誌（含通知日誌）；付款日期來自戶別資料；「資料有修改」只是任何欄位被編輯過，不可解讀為成交。回答時只能列出這裡出現的戶別與欄位值，不可補上未回傳的金額、車位或人名',
      };
    },
  },
  {
    name: 'list_salespersons',
    requires: 'sales.read',
    description: '列出本建案銷售人員名單。',
    parameters: { type: 'object', properties: {} },
    async handler(ctx) {
      requireCap(ctx, 'sales.read');
      const data = await ensureData(ctx);
      return { salespersons: data.personnel.map(p => p.name) };
    },
  },
  {
    name: 'list_status_options',
    requires: 'sales.read',
    description: '列出本建案可用的銷控狀態名稱（含確定度層級：signed 已簽約／booked 已訂未簽／held 暫時保留／released 已釋出）。',
    parameters: { type: 'object', properties: {} },
    async handler(ctx) {
      requireCap(ctx, 'sales.read');
      const data = await ensureData(ctx);
      return { statuses: data.statusNames.map(s => ({ name: s, tier: D.classifyCommitment(s, data.tierOverrides) })), note: '「可售」= 狀態為空' };
    },
  },
  {
    name: 'calc_price_gap',
    requires: 'sales.read',
    description: '價格試算：某戶出價（可含車位）與底價的差額。回傳房屋底價、車位底價、總底價、差額與算式。',
    parameters: {
      type: 'object',
      properties: {
        unitId: { type: 'string', description: '戶別' },
        offer: { type: 'number', description: '客戶出價總額（萬）' },
        spotIds: { type: 'array', items: { type: 'string' }, description: '出價包含的車位編號' },
      },
      required: ['unitId', 'offer'],
    },
    async handler(ctx, args) {
      requireCap(ctx, 'sales.read');
      const data = await ensureData(ctx);
      const { exact } = D.findById(data.units, args.unitId, 'unitId');
      if (!exact) return { found: false, message: '查無此戶別' };
      const houseFloor = D.num(exact.price_floor_house_total) ?? 0;
      const parts = [];
      let parkingFloor = 0;
      for (const sid of args.spotIds || []) {
        const r = D.findById(data.parkings, sid, 'spotId');
        if (r.exact) { const f = D.num(r.exact.price_floor) ?? 0; parkingFloor += f; parts.push({ 車位: r.exact.spotId, 底價_萬: f }); }
        else parts.push({ 車位: sid, 底價_萬: null, 註: '查無此車位' });
      }
      const totalFloor = houseFloor + parkingFloor;
      const gap = Number(args.offer) - totalFloor;
      return {
        戶別: exact.unitId, 房屋底價_萬: houseFloor, 車位: parts, 總底價_萬: totalFloor, 出價_萬: Number(args.offer),
        差額_萬: gap, 結論: gap >= 0 ? `出價高於底價 ${gap} 萬` : `出價低於底價 ${Math.abs(gap)} 萬`,
        算式: `${args.offer} − (${houseFloor}${parkingFloor ? ` + ${parkingFloor}` : ''}) = ${gap}`,
      };
    },
  },
  {
    name: 'ask_user',
    requires: null,
    description: '當缺少必要資訊或有多個可能對象時，向使用者提問並提供選項。一次可問多題。使用者回答後你會收到答案。',
    parameters: {
      type: 'object',
      properties: {
        questions: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              field: { type: 'string', description: '欄位鍵，例如 salesperson、unitId、buyerName、payment_deposit_date' },
              label: { type: 'string', description: '題目文字' },
              type: { type: 'string', enum: ['select', 'multiselect', 'text', 'number', 'date', 'confirm'] },
              options: { type: 'array', items: { type: 'string' }, description: '選項（select/multiselect）' },
              required: { type: 'boolean' },
              hint: { type: 'string' },
            },
            required: ['field', 'label', 'type'],
          },
        },
      },
      required: ['questions'],
    },
    async handler(ctx, args) {
      const qs = Array.isArray(args.questions) ? args.questions.slice(0, 6) : [];
      return { __question: qs.map(q => ({
        field: String(q.field || '').slice(0, 60), label: String(q.label || '').slice(0, 200),
        type: ['select', 'multiselect', 'text', 'number', 'date', 'confirm'].includes(q.type) ? q.type : 'text',
        options: Array.isArray(q.options) ? q.options.slice(0, 40).map(o => ({ value: String(o), label: String(o) })) : [],
        required: q.required !== false, hint: q.hint ? String(q.hint).slice(0, 200) : null, default: null,
      })) };
    },
  },
  {
    name: 'open_unit_dialog',
    requires: 'sales.read',
    description: '在畫面上為使用者開啟某戶別的戶別資訊視窗。',
    parameters: { type: 'object', properties: { unitId: { type: 'string' } }, required: ['unitId'] },
    async handler(ctx, args) {
      requireCap(ctx, 'sales.read');
      const data = await ensureData(ctx);
      const { exact } = D.findById(data.units, args.unitId, 'unitId');
      if (!exact) return { ok: false, message: '查無此戶別' };
      return { ok: true, __uiAction: { type: 'openUnit', unitId: exact.unitId } };
    },
  },
  // ---- 寫入（草案）----
  {
    name: 'propose_changes',
    requires: 'sales.write',
    description: '為某戶別建立「變更草案」（不會直接寫入，使用者會在畫面確認）。可同時：修改銷控欄位、配置車位、解除車位、新增備註留言。缺少的必填資訊（如銷售人員）系統會自動向使用者詢問，你不必先問。可寫欄位：salesStatus_backend（銷控狀態）、price_transaction_house（房屋成交價，萬）、price_transaction_total（成交總價含車位，萬，未提供會自動計算）、buyerName、buyerPhone、salesperson（銷售人員姓名，可多人）、contractType、payment_deposit_date/amount（小訂）、payment_supplement_date/amount（補足）、payment_contract_date/amount（簽約）、payment_complete_date。表價、底價、面積不可修改。',
    parameters: {
      type: 'object',
      properties: {
        unitId: { type: 'string', description: '戶別編號' },
        changes: {
          type: 'object',
          description: '要修改的欄位與新值（鍵為欄位名）',
          properties: {
            salesStatus_backend: { type: 'string' }, price_transaction_house: { type: 'number' }, price_transaction_total: { type: 'number' },
            buyerName: { type: 'string' }, buyerPhone: { type: 'string' },
            salesperson: { type: 'array', items: { type: 'string' } }, contractType: { type: 'string' },
            payment_deposit_date: { type: 'string' }, payment_deposit_amount: { type: 'number' },
            payment_supplement_date: { type: 'string' }, payment_supplement_amount: { type: 'number' },
            payment_contract_date: { type: 'string' }, payment_contract_amount: { type: 'number' },
            payment_complete_date: { type: 'string' },
          },
        },
        assignParkings: {
          type: 'array',
          description: '要配置給此戶的車位',
          items: {
            type: 'object',
            properties: {
              spotId: { type: 'string' },
              price: { type: 'string', description: '成交價：數字（萬）、"list"（依表價）或 "floor"（依底價）；未提供會詢問使用者' },
            },
            required: ['spotId'],
          },
        },
        releaseParkings: { type: 'array', items: { type: 'string' }, description: '要從此戶解除的車位編號' },
        addRemark: {
          type: 'object',
          properties: { content: { type: 'string' }, category: { type: 'string', enum: ['general', 'customer', 'reminder', 'finance', 'contract'] } },
        },
      },
      required: ['unitId'],
    },
    async handler(ctx, args) {
      requireCap(ctx, 'sales.write');
      return { __proposal: { kind: 'changes', unitId: args.unitId, changes: args.changes || {}, assignParkings: args.assignParkings || [], releaseParkings: args.releaseParkings || [], addRemark: args.addRemark || null } };
    },
  },
  {
    name: 'propose_cancel_purchase',
    requires: 'sales.cancel',
    description: '為某戶別建立「退戶草案」（清除買方資料與車位關聯，備份至退戶資料；不可逆，使用者需二次確認）。',
    parameters: {
      type: 'object',
      properties: {
        unitId: { type: 'string' },
        reasons: { type: 'array', items: { type: 'string' }, description: `退戶原因，可多選：${CANCEL_REASONS.join('、')}；未提供會詢問使用者` },
        date: { type: 'string', description: '退戶日期 YYYY-MM-DD，預設今天' },
      },
      required: ['unitId'],
    },
    async handler(ctx, args) {
      requireCap(ctx, 'sales.cancel');
      return { __proposal: { kind: 'cancel', unitId: args.unitId, reasons: args.reasons || [], date: args.date || null } };
    },
  },
];

const TOOL_MAP = Object.fromEntries(TOOLS.map(t => [t.name, t]));

/** 依能力與開關取得可註冊工具 */
function toolsFor(caps, globalTools = {}, disabledTools = []) {
  const disabled = new Set(Array.isArray(disabledTools) ? disabledTools : []);
  return TOOLS.filter(t => {
    if (t.requires && !caps.has(t.requires)) return false;
    if (globalTools[t.name] && globalTools[t.name].enabled === false) return false;
    if (disabled.has(t.name)) return false;
    return true;
  });
}

function toolSpecs(tools) {
  return tools.map(t => ({ name: t.name, description: t.description, parameters: t.parameters }));
}

module.exports = { TOOLS, TOOL_MAP, toolsFor, toolSpecs, ensureData, CANCEL_REASONS };
