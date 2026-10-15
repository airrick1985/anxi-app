// 預約驗屋系統使用狀況報表：由原始預約／批次資料計算報表數字（訂閱管理）

export const VALID_STATUSES = ['預約中', '已完成'];
// 需上傳驗屋報告的預約項目（與後端 BOOKING_TYPES_ALLOW_REPORT_UPLOAD 一致）
export const REPORT_UPLOAD_TYPES = ['初驗', '複驗', '驗屋'];
// 改期會先取消舊單再建新單：取消時間與同戶同項目新單建立時間相差在此內視為改期
const RESCHEDULE_WINDOW_MS = 60 * 1000;

export const SOURCE_LABELS = { bookingPage: '客戶自助', admin: '後台建立' };
export const sourceLabel = (source) => SOURCE_LABELS[source] || '未記錄';

const DAY_MS = 24 * 60 * 60 * 1000;

export function daysBetween(start, end) {
  if (!start || !end) return 0;
  return Math.round((new Date(`${end}T00:00:00Z`) - new Date(`${start}T00:00:00Z`)) / DAY_MS) + 1;
}

export function percent(part, whole) {
  return whole > 0 ? Math.round((part / whole) * 1000) / 10 : null;
}

/** 姓名遮罩：王小明 → 王○明、王明 → 王○ */
export function maskName(name) {
  const chars = Array.from(String(name || '').trim());
  if (chars.length <= 1) return chars.join('');
  if (chars.length === 2) return `${chars[0]}○`;
  return `${chars[0]}${'○'.repeat(chars.length - 2)}${chars[chars.length - 1]}`;
}

/** 統計期間：最早批次的開放預約日 ～ 產製日 */
export function reportPeriod(batches, today) {
  const starts = batches.map(b => b.bookingStart).filter(Boolean).sort();
  const start = starts[0] || '';
  return {
    start,
    end: today,
    days: start && start <= today ? daysBetween(start, today) : 0,
    notStarted: !!start && start > today,
  };
}

/** 標記每筆預約的報表狀態：預約中／已完成／取消／改期 */
export function classifyAppointments(appointments) {
  const createdByKey = new Map();
  appointments.forEach((a) => {
    if (!a.createdAt) return;
    const key = `${a.unitId}|${a.bookingType}`;
    if (!createdByKey.has(key)) createdByKey.set(key, []);
    createdByKey.get(key).push({ id: a.id, createdAt: a.createdAt });
  });

  return appointments.map((a) => {
    if (VALID_STATUSES.includes(a.status)) return { ...a, reportStatus: a.status };
    const siblings = createdByKey.get(`${a.unitId}|${a.bookingType}`) || [];
    const rescheduled = !!a.cancelledAt && siblings.some(s => (
      s.id !== a.id && Math.abs(s.createdAt - a.cancelledAt) <= RESCHEDULE_WINDOW_MS
    ));
    return { ...a, reportStatus: rescheduled ? '改期' : '取消' };
  });
}

function countBy(list, keyFn) {
  const map = new Map();
  list.forEach((item) => {
    const key = keyFn(item);
    map.set(key, (map.get(key) || 0) + 1);
  });
  return map;
}

function summarize(list, householdCount) {
  const valid = list.filter(a => VALID_STATUSES.includes(a.reportStatus));
  const units = new Set(valid.map(a => a.unitId).filter(Boolean)).size;
  return {
    total: list.length,
    active: list.filter(a => a.reportStatus === '預約中').length,
    completed: list.filter(a => a.reportStatus === '已完成').length,
    cancelled: list.filter(a => a.reportStatus === '取消').length,
    rescheduled: list.filter(a => a.reportStatus === '改期').length,
    units,
    coverage: percent(units, householdCount),
  };
}

/**
 * @param {object} data { project, batches, appointments, householdCount }（fetchBookingUsageReportData）
 * @param {object} quotaByDate fetchQuotaSummaryForReport 結果
 * @param {string} today 產製日 YYYY-MM-DD
 */
export function buildBookingUsageReport(data, quotaByDate, today) {
  const { project, batches, householdCount } = data;
  const appointments = classifyAppointments(data.appointments);
  const valid = appointments.filter(a => VALID_STATUSES.includes(a.reportStatus));

  // 預約項目：依預約設定順序，再補上僅出現在批次或預約中的項目
  const typeOrder = [...project.bookingItems];
  [...batches.map(b => b.bookingType), ...appointments.map(a => a.bookingType)].forEach((t) => {
    if (t && !typeOrder.includes(t)) typeOrder.push(t);
  });
  const items = typeOrder
    .map((type) => {
      const typeBatches = batches.filter(b => b.bookingType === type);
      const starts = typeBatches.map(b => b.bookingStart).filter(Boolean).sort();
      const ends = typeBatches.map(b => b.bookingEnd).filter(Boolean).sort();
      return {
        type,
        batchCount: typeBatches.length,
        openStart: starts[0] || '',
        openEnd: ends[ends.length - 1] || '',
        ...summarize(appointments.filter(a => a.bookingType === type), householdCount),
      };
    })
    .filter(item => item.batchCount > 0 || item.total > 0);

  const sourceCounts = countBy(valid, a => sourceLabel(a.source));
  const sources = ['客戶自助', '後台建立', '未記錄']
    .map(label => ({ label, count: sourceCounts.get(label) || 0 }))
    .filter(s => s.count > 0 || s.label !== '未記錄');

  // 預約方式：依預約項目分開統計，方式依該項目設定順序，未設定的依筆數排在後、「未填」最後
  const methodsByItem = items
    .map(({ type }) => {
      const list = valid.filter(a => a.bookingType === type);
      const counts = countBy(list, a => a.method || '未填');
      const configured = (project.bookingMethods?.[type] || []).filter(m => counts.has(m));
      const others = [...counts.keys()]
        .filter(m => !configured.includes(m) && m !== '未填')
        .sort((a, b) => counts.get(b) - counts.get(a));
      const order = [...configured, ...others, ...(counts.has('未填') ? ['未填'] : [])];
      return { type, total: list.length, methods: order.map(label => ({ label, count: counts.get(label) })) };
    })
    .filter(item => item.total > 0);

  // 名額：統計期間內（至產製日）已開放的日期
  const period = reportPeriod(batches, today);
  const quota = { days: 0, capacity: 0, booked: 0, rate: null };
  Object.entries(quotaByDate || {}).forEach(([date, rows]) => {
    if (!period.start || date < period.start || date > today) return;
    const capacity = rows.reduce((sum, r) => sum + (Number(r.capacity) || 0), 0);
    if (capacity <= 0) return;
    quota.days += 1;
    quota.capacity += capacity;
    quota.booked += rows.reduce((sum, r) => sum + (Number(r.booked) || 0), 0);
  });
  quota.rate = percent(quota.booked, quota.capacity);

  const reportTargets = valid.filter(a => REPORT_UPLOAD_TYPES.includes(a.bookingType) && a.appointmentDate && a.appointmentDate <= today);
  const uploaded = reportTargets.filter(a => a.reportUploaded);
  const reports = {
    required: reportTargets.length,
    uploaded: uploaded.length,
    units: new Set(uploaded.map(a => a.unitId)).size,
    rate: percent(uploaded.length, reportTargets.length),
    reminders: appointments.reduce((sum, a) => sum + (a.reminderCount || 0), 0),
  };

  return {
    period,
    householdCount,
    overview: summarize(appointments, householdCount),
    items,
    sources,
    methodsByItem,
    validCount: valid.length,
    quota,
    reports,
    appointments,
  };
}
