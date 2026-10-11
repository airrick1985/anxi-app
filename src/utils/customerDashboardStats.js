// 客戶資料儀表板：統計計算（純函式，不含 UI）
// 資料來源：fetchFullCustomersForExport 回傳的完整客資（含 interactionLogs、profile）
// 定義：
//   來訪 = 一筆「現場介紹」洽談紀錄；客戶在本案的第一筆現場介紹為「新客」，其後為「回訪」
//   追蹤互動 = 現場介紹以外的洽談紀錄（電話、LINE、簡訊…）
//   客戶等級 = 最新一筆有填等級的洽談紀錄

export const ON_SITE = '現場介紹';
export const RATING_BUCKETS = ['A', 'B', 'C', 'D', '未定級'];
const PURCHASED_REASON = '已下訂'; // 屬於成交，不列入未買原因排行

const pad2 = (n) => String(n).padStart(2, '0');
export const toYmd = (d) => `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
export const fromYmd = (s) => {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d);
};
const addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
export const daysBetween = (a, b) => Math.round((fromYmd(b) - fromYmd(a)) / 86400000);

// 洽談紀錄日期正規化為 YYYY-MM-DD（相容 'YYYY/MM/DD'、ISO、Timestamp、{_seconds}）
export const normDate = (v) => {
  if (!v) return '';
  if (typeof v === 'string') {
    const m = v.trim().match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})/);
    if (m) return `${m[1]}-${pad2(m[2])}-${pad2(m[3])}`;
  }
  let d = null;
  if (typeof v?.toDate === 'function') d = v.toDate();
  else if (v?._seconds !== undefined) d = new Date(v._seconds * 1000);
  else if (v?.seconds !== undefined) d = new Date(v.seconds * 1000);
  else d = new Date(v);
  return d && !isNaN(d.getTime()) ? toYmd(d) : '';
};

// 多選值正規化（相容 JSON 字串、逗號分隔、巢狀陣列），與客戶列表一致
export const normValues = (raw) => {
  const out = [];
  const push = (v) => {
    if (v === null || v === undefined) return;
    if (Array.isArray(v)) { v.forEach(push); return; }
    const s = String(v).trim();
    if (!s) return;
    if ((s.startsWith('[') && s.endsWith(']')) || (s.startsWith('"') && s.endsWith('"'))) {
      try {
        const parsed = JSON.parse(s);
        if (Array.isArray(parsed) || typeof parsed === 'string') { push(parsed); return; }
      } catch (e) { /* 非 JSON，當純字串處理 */ }
    }
    if (s.includes(',')) { s.split(',').forEach(push); return; }
    out.push(s);
  };
  push(raw);
  return [...new Set(out)];
};
// 單選欄位：陣列取最後一個值（與客資報表 getP 一致）
const singleValue = (raw) => {
  const vals = normValues(raw);
  return vals.length ? vals[vals.length - 1] : '';
};

const firstValue = (raw) => (Array.isArray(raw) ? raw.find(Boolean) : raw) || '';
export const ratingBucket = (rating) => {
  const r = String(rating || '').trim();
  const letter = r.charAt(0).toUpperCase();
  return ['A', 'B', 'C', 'D'].includes(letter) ? letter : '未定級';
};

const durationMinutes = (start, end) => {
  if (!start || !end) return 0;
  const [sH, sM] = String(start).split(':').map(Number);
  const [eH, eM] = String(end).split(':').map(Number);
  if ([sH, sM, eH, eM].some(n => Number.isNaN(n))) return 0;
  const diff = (eH * 60 + eM) - (sH * 60 + sM);
  return diff > 0 && diff <= 600 ? diff : 0; // 超過 10 小時視為誤填
};
const visitorCount = (v) => {
  const n = parseInt(firstValue(v), 10);
  return Number.isFinite(n) && n > 0 ? n : 0;
};

/**
 * 預先整理每位客戶：只保留本案的洽談紀錄、標記新客／回訪、最新等級、最後聯絡日
 * @param {Array} rawList fetchFullCustomersForExport 結果
 * @param {string} projectId
 */
export function prepareCustomers(rawList, projectId) {
  const out = [];
  (rawList || []).forEach(item => {
    if (!item || item.isAllSalesDeleted) return; // 所有銷售皆已冷刪除，與客資列表一致不列入
    const homeProject = item.projectId || projectId;
    const logs = (item.interactionLogs || [])
      .filter(l => l && (l.sourceProjectId || homeProject) === projectId)
      .map(l => ({
        date: normDate(l.date),
        type: firstValue(l.tags?.interactionType) || '其他',
        startTime: l.startTime || '',
        endTime: l.endTime || '',
        rating: firstValue(l.tags?.rating),
        reasons: normValues(l.tags?.noPurchaseReason),
        visitors: visitorCount(l.tags?.visitors),
      }))
      .filter(l => l.date)
      .sort((a, b) => (a.date + a.startTime).localeCompare(b.date + b.startTime));

    let onSiteIndex = 0;
    logs.forEach(l => { if (l.type === ON_SITE) l.isNew = onSiteIndex++ === 0; });

    const rated = [...logs].reverse().find(l => l.rating);
    const rating = rated?.rating || firstValue(item.profile?.['等級研判']) || '';

    out.push({
      id: item.id,
      name: item.latestName || '未填姓名',
      phone: item.phone || '',
      sales: item.activeSalesName ?? item.latestSalesName ?? '',
      salesPhone: item.latestSalesPhone || '',
      submissions: item.submissions || [],
      profile: item.profile || {},
      logs,
      rating,
      bucket: ratingBucket(rating),
      lastContact: logs.length ? logs[logs.length - 1].date : '',
    });
  });
  return out;
}

// --- 期間 ---
export const PERIODS = [
  { value: 'week', label: '本週' },
  { value: 'month', label: '本月' },
  { value: 'lastMonth', label: '上個月' },
  { value: 'last30', label: '近 30 天' },
  { value: 'last90', label: '近 90 天' },
  { value: 'year', label: '今年' },
  { value: 'custom', label: '自訂' },
];

/** 期間起訖（含）＋同長度的上一期，皆為 YYYY-MM-DD */
export function resolveRange(period, custom = {}, today = new Date()) {
  const t = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  let from; let to = t;
  switch (period) {
    case 'week': from = addDays(t, -((t.getDay() + 6) % 7)); break; // 週一起
    case 'lastMonth':
      from = new Date(t.getFullYear(), t.getMonth() - 1, 1);
      to = new Date(t.getFullYear(), t.getMonth(), 0);
      break;
    case 'last30': from = addDays(t, -29); break;
    case 'last90': from = addDays(t, -89); break;
    case 'year': from = new Date(t.getFullYear(), 0, 1); break;
    case 'custom': {
      const f = custom.from ? fromYmd(custom.from) : addDays(t, -29);
      const e = custom.to ? fromYmd(custom.to) : t;
      from = f <= e ? f : e;
      to = f <= e ? e : f;
      break;
    }
    case 'month':
    default: from = new Date(t.getFullYear(), t.getMonth(), 1);
  }
  const span = Math.round((to - from) / 86400000) + 1;
  const prevTo = addDays(from, -1);
  const prevFrom = addDays(prevTo, -(span - 1));
  return { from: toYmd(from), to: toYmd(to), prevFrom: toYmd(prevFrom), prevTo: toYmd(prevTo), days: span };
}

const inRange = (d, from, to) => d >= from && d <= to;

/** 期間摘要指標 */
export function summarize(customers, from, to) {
  let visits = 0; let newVisits = 0; let followUps = 0; let visitors = 0;
  let durSum = 0; let durCount = 0;
  const active = new Set();
  const hot = new Set();
  customers.forEach(c => {
    c.logs.forEach(l => {
      if (!inRange(l.date, from, to)) return;
      active.add(c.id);
      if (c.bucket === 'A' || c.bucket === 'B') hot.add(c.id);
      if (l.type === ON_SITE) {
        visits++;
        if (l.isNew) newVisits++;
        visitors += l.visitors;
        const m = durationMinutes(l.startTime, l.endTime);
        if (m) { durSum += m; durCount++; }
      } else {
        followUps++;
      }
    });
  });
  return {
    visits,
    newVisits,
    returnVisits: visits - newVisits,
    returnRate: visits ? (visits - newVisits) / visits : 0,
    followUps,
    visitors,
    activeCustomers: active.size,
    hotCustomers: hot.size,
    avgDuration: durCount ? Math.round(durSum / durCount) : 0,
  };
}

/** 來訪趨勢：期間 ≤45 天按日、≤210 天按週（週一起）、其餘按月 */
export function visitTrend(customers, from, to) {
  const span = daysBetween(from, to) + 1;
  const unit = span <= 45 ? 'day' : (span <= 210 ? 'week' : 'month');
  const keyOf = (ymd) => {
    if (unit === 'day') return ymd;
    const d = fromYmd(ymd);
    if (unit === 'week') return toYmd(addDays(d, -((d.getDay() + 6) % 7)));
    return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}`;
  };
  const buckets = new Map();
  let cursor = fromYmd(from);
  const end = fromYmd(to);
  while (cursor <= end) {
    const k = keyOf(toYmd(cursor));
    if (!buckets.has(k)) buckets.set(k, { key: k, newVisits: 0, returnVisits: 0 });
    cursor = addDays(cursor, 1);
  }
  customers.forEach(c => c.logs.forEach(l => {
    if (l.type !== ON_SITE || !inRange(l.date, from, to)) return;
    const b = buckets.get(keyOf(l.date));
    if (b) b[l.isNew ? 'newVisits' : 'returnVisits']++;
  }));
  const label = (k) => {
    if (unit === 'month') return `${k.slice(0, 4)}/${k.slice(5, 7)}`;
    const [, m, d] = k.split('-');
    return `${Number(m)}/${Number(d)}`;
  };
  return { unit, rows: [...buckets.values()].map(b => ({ ...b, label: label(b.key) })) };
}

/** 銷售人員排行（依來訪組數） */
export function salesRanking(customers, from, to) {
  const map = new Map();
  const row = (name) => {
    if (!map.has(name)) map.set(name, { name, visits: 0, newVisits: 0, followUps: 0, hot: new Set(), durSum: 0, durCount: 0 });
    return map.get(name);
  };
  customers.forEach(c => {
    const name = c.sales || '未指派';
    c.logs.forEach(l => {
      if (!inRange(l.date, from, to)) return;
      const r = row(name);
      if (c.bucket === 'A' || c.bucket === 'B') r.hot.add(c.id);
      if (l.type === ON_SITE) {
        r.visits++;
        if (l.isNew) r.newVisits++;
        const m = durationMinutes(l.startTime, l.endTime);
        if (m) { r.durSum += m; r.durCount++; }
      } else {
        r.followUps++;
      }
    });
  });
  return [...map.values()]
    .map(r => ({
      name: r.name,
      visits: r.visits,
      newVisits: r.newVisits,
      returnVisits: r.visits - r.newVisits,
      returnRate: r.visits ? (r.visits - r.newVisits) / r.visits : 0,
      followUps: r.followUps,
      hotCustomers: r.hot.size,
      avgDuration: r.durCount ? Math.round(r.durSum / r.durCount) : 0,
    }))
    .sort((a, b) => b.visits - a.visits || b.followUps - a.followUps || a.name.localeCompare(b.name));
}

/** 期間內有互動客戶的等級分布 */
export function ratingDistribution(customers, from, to) {
  const counts = Object.fromEntries(RATING_BUCKETS.map(k => [k, 0]));
  customers.forEach(c => {
    if (c.logs.some(l => inRange(l.date, from, to))) counts[c.bucket]++;
  });
  const total = Object.values(counts).reduce((s, n) => s + n, 0);
  return { total, rows: RATING_BUCKETS.map(k => ({ key: k, count: counts[k], share: total ? counts[k] / total : 0 })) };
}

/** 未買原因排行：期間內有來訪的客戶，每位客戶同一原因只算一次 */
export function noPurchaseReasons(customers, from, to, limit = 8) {
  const counts = new Map();
  let base = 0;
  customers.forEach(c => {
    const inPeriod = c.logs.filter(l => inRange(l.date, from, to));
    if (!inPeriod.some(l => l.type === ON_SITE)) return;
    base++;
    const reasons = new Set(inPeriod.flatMap(l => l.reasons));
    reasons.delete(PURCHASED_REASON);
    reasons.forEach(r => counts.set(r, (counts.get(r) || 0) + 1));
  });
  const rows = [...counts.entries()]
    .map(([label, count]) => ({ label, count, share: base ? count / base : 0 }))
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));
  return { base, rows: rows.slice(0, limit), more: Math.max(rows.length - limit, 0) };
}

// --- 來客輪廓 ---
// order：依設定選項排序的序數欄位（年齡、預算…）；其餘依人數排序
export const PROFILE_DIMENSIONS = [
  { key: 'source', label: '從何得知', field: '從何得知本建案', multi: true },
  { key: 'area', label: '居住區域', field: '居住城市', area: true },
  { key: 'age', label: '年齡', field: '年齡', optionsFrom: 'fields.age' },
  { key: 'gender', label: '性別', field: '性別' },
  { key: 'job', label: '職業', field: '職業' },
  { key: 'motive', label: '購屋動機', field: '購屋動機', multi: true },
  { key: 'room', label: '房型需求', field: '房型需求', multi: true, optionsFrom: 'vip.房型需求' },
  { key: 'size', label: '坪數需求', field: '坪數需求', multi: true, optionsFrom: 'vip.坪數需求' },
  { key: 'budget', label: '購屋預算', field: '購屋預算', optionsFrom: 'vip.購屋預算' },
];

const resolveOptionOrder = (dim, settings) => {
  if (!dim.optionsFrom || !settings) return null;
  if (dim.optionsFrom.startsWith('fields.')) return settings.fields?.[dim.optionsFrom.slice(7)]?.options || null;
  const label = dim.optionsFrom.slice(4);
  const field = Object.values(settings.vipFormFields || {}).find(f => f.label === label);
  return field?.options || null;
};

/** 期間內有來訪的客戶（每位一次）在指定維度的分布 */
export function profileBreakdown(customers, from, to, dim, settings, limit = 10) {
  const counts = new Map();
  let base = 0; let missing = 0;
  customers.forEach(c => {
    if (!c.logs.some(l => l.type === ON_SITE && inRange(l.date, from, to))) return;
    base++;
    let values;
    if (dim.area) {
      const city = singleValue(c.profile['居住城市']);
      const district = singleValue(c.profile['居住鄉鎮市區']);
      values = city ? [`${city}${district && !district.startsWith(city) ? district : ''}`] : [];
    } else {
      values = dim.multi ? normValues(c.profile[dim.field]) : [singleValue(c.profile[dim.field])].filter(Boolean);
    }
    if (!values.length) { missing++; return; }
    values.forEach(v => counts.set(v, (counts.get(v) || 0) + 1));
  });
  const order = resolveOptionOrder(dim, settings);
  let rows = [...counts.entries()].map(([label, count]) => ({ label, count, share: base ? count / base : 0 }));
  if (order) {
    const idx = (l) => { const i = order.indexOf(l); return i === -1 ? order.length : i; };
    rows.sort((a, b) => idx(a.label) - idx(b.label) || b.count - a.count);
  } else {
    rows.sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));
  }
  let other = null;
  if (!order && rows.length > limit) {
    const rest = rows.slice(limit - 1);
    const count = rest.reduce((s, r) => s + r.count, 0);
    other = { label: `其他 ${rest.length} 項`, count, share: base ? count / base : 0, isOther: true };
    rows = rows.slice(0, limit - 1);
  }
  return { base, missing, rows: other ? [...rows, other] : rows };
}

/** 來訪時段熱度：星期（一～日）× 整點，依現場介紹的開始時間 */
export function visitHeatmap(customers, from, to) {
  const grid = Array.from({ length: 7 }, () => new Map());
  let noTime = 0; let minH = 24; let maxH = -1; let max = 0;
  customers.forEach(c => c.logs.forEach(l => {
    if (l.type !== ON_SITE || !inRange(l.date, from, to)) return;
    const h = parseInt(String(l.startTime).split(':')[0], 10);
    if (!Number.isFinite(h) || h < 0 || h > 23) { noTime++; return; }
    const wd = (fromYmd(l.date).getDay() + 6) % 7; // 0 = 週一
    const n = (grid[wd].get(h) || 0) + 1;
    grid[wd].set(h, n);
    max = Math.max(max, n);
    minH = Math.min(minH, h);
    maxH = Math.max(maxH, h);
  }));
  const startH = Math.min(minH, 9);
  const endH = Math.max(maxH, 20);
  const hours = [];
  for (let h = startH; h <= endH; h++) hours.push(h);
  const rows = ['一', '二', '三', '四', '五', '六', '日'].map((label, i) => ({
    label,
    cells: hours.map(h => ({ hour: h, count: grid[i].get(h) || 0 })),
  }));
  return { hours, rows, max, noTime };
}

/** 待追蹤：A／B 級、超過 N 天沒有任何洽談紀錄的客戶（不受期間影響） */
export function staleHotCustomers(customers, days, today = new Date()) {
  const todayYmd = toYmd(today);
  return customers
    .filter(c => (c.bucket === 'A' || c.bucket === 'B') && c.lastContact)
    .map(c => ({ ...c, idleDays: daysBetween(c.lastContact, todayYmd) }))
    .filter(c => c.idleDays >= days)
    .sort((a, b) => a.bucket.localeCompare(b.bucket) || b.idleDays - a.idleDays);
}

/** 銷售人員個人視角：只保留自己負責的客戶 */
export function filterOwnCustomers(customers, user) {
  const name = user?.name || '';
  const phone = user?.key || '';
  return customers.filter(c =>
    (name && c.sales === name) ||
    (phone && c.salesPhone === phone) ||
    (phone && c.submissions.some(s => s?.['銷售人員電話'] === phone))
  );
}
