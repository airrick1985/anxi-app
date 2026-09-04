/**
 * 驗屋預約時間表資料 Store
 *
 * 目的（與 salesDataStore 同一套思路）：
 *  1. 純查詢類資料改前端直讀 Firestore，失敗自動退回 inspectionCalendarApi（utils/directFirestore）
 *     - 建案設定 projects/{id}（含排程發布覆寫，與後端 _handleGetProjectConfig 相同邏輯）
 *     - 預約可選日期範圍（appointments where projectId orderBy appointmentDate，後端已在用同一組索引）
 *     - 區間預約（appointments where projectId + appointmentDate 範圍）→ 改為即時監聽並跨頁保留
 *     - 排休 inspectorLeaves / 行事曆備註 calendarNotes（where projectId，區間在前端過濾，輸出格式對齊後端）
 *  2. session 內快取：入口頁簽到期間先 prefetch，進頁直接命中；同建案回到時間表不必重抓
 *  3. 每日名額摘要需跨四個集合聚合，維持走後端
 *
 * 不動 Cloud Function 的冷啟動設定（minInstances / 拆分），只減少往返次數並把等待重疊。
 */
import { defineStore } from 'pinia';
import { reactive } from 'vue';
import { collection, doc, getDoc, getDocs, onSnapshot, orderBy, query, where, limit } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { db, functions } from '@/firebase';
import { withDirectFallback, isDirectDenied, markDirectDenied } from '@/utils/directFirestore';

const STATIC_TTL_MS = 5 * 60 * 1000;      // 建案設定 / 日期範圍快取時間
const MAX_APPOINTMENT_LISTENERS = 4;      // 同時保留的區間監聽數（LRU）
const CALENDAR_NOTE_COLORS = ['amber', 'red', 'blue', 'green', 'purple'];
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

const callApi = (action, data) => httpsCallable(functions, 'inspectionCalendarApi')({ action, data });

const toIso = (v) => (v && typeof v.toDate === 'function') ? v.toDate().toISOString() : null;
const toDate = (v) => (v instanceof Date ? v : new Date(v));
const rangeKey = (projectId, start, end) => `${projectId}|${toDate(start).toISOString()}|${toDate(end).toISOString()}`;

/** 與後端 _handleGetProjectConfig 相同：排程發布時間外 → isPublished 覆寫為 false */
function applyPublishWindow(projectData) {
  if (!projectData) return projectData;
  if (projectData.isPublished && projectData.enableScheduledPublish) {
    const now = new Date();
    const parseDate = (val) => {
      if (!val) return null;
      if (val.toDate) return val.toDate();
      if (val.seconds) return new Date(val.seconds * 1000);
      if (val._seconds) return new Date(val._seconds * 1000);
      return new Date(val);
    };
    const start = parseDate(projectData.publishStartTime);
    const end = parseDate(projectData.publishEndTime);
    if ((start && now.getTime() < start.getTime()) || (end && now.getTime() > end.getTime())) {
      projectData.isPublished = false;
    }
  }
  return projectData;
}

export const useInspectionCalendarStore = defineStore('inspectionCalendar', () => {
  // ---- 靜態資料快取：projectId → { data, ts, promise } ----
  const configCache = new Map();
  const rangeCache = new Map();

  function cached(cache, projectId, force, loader) {
    const hit = cache.get(projectId);
    const fresh = hit && (Date.now() - hit.ts < STATIC_TTL_MS);
    if (!force && hit && (fresh || hit.promise)) {
      return hit.promise || Promise.resolve(hit.data);
    }
    const promise = loader().then((data) => {
      cache.set(projectId, { data, ts: Date.now(), promise: null });
      return data;
    }).catch((e) => {
      cache.delete(projectId);
      throw e;
    });
    cache.set(projectId, { data: hit?.data, ts: hit?.ts || 0, promise });
    return promise;
  }

  /** 建案設定（= inspectionApi('getProjectConfig') 回傳的 res.data） */
  function getProjectConfig(projectId, { force = false } = {}) {
    return cached(configCache, projectId, force, () => withDirectFallback(
      'inspection:projectConfig',
      async () => {
        const snap = await getDoc(doc(db, 'projects', projectId));
        if (!snap.exists()) throw Object.assign(new Error(`找不到 ID 為 ${projectId} 的建案設定。`), { code: 'not-found' });
        return applyPublishWindow({ ...snap.data() });
      },
      async () => (await callApi('getProjectConfig', { projectId })).data
    ));
  }

  /** 可選日期範圍（= inspectionApi('getAppointmentDateRange') 的 res.data.data → { minDate, maxDate }） */
  function getAppointmentDateRange(projectId, { force = false } = {}) {
    return cached(rangeCache, projectId, force, () => withDirectFallback(
      'inspection:dateRange',
      async () => {
        const col = collection(db, 'appointments');
        const [first, last] = await Promise.all([
          getDocs(query(col, where('projectId', '==', projectId), orderBy('appointmentDate', 'asc'), limit(1))),
          getDocs(query(col, where('projectId', '==', projectId), orderBy('appointmentDate', 'desc'), limit(1))),
        ]);
        if (first.empty) {
          const y = new Date().getFullYear();
          return { minDate: `${y}-01-01`, maxDate: `${y}-12-31` };
        }
        const y1 = first.docs[0].data().appointmentDate.toDate().getFullYear();
        const y2 = last.docs[0].data().appointmentDate.toDate().getFullYear();
        return { minDate: `${y1}-01-01`, maxDate: `${y2}-12-31` };
      },
      async () => (await callApi('getAppointmentDateRange', { projectId })).data.data
    ));
  }

  // ---- 區間預約：即時監聽（直讀）或一次性抓取（退回 Cloud Function）----
  /**
   * appointmentsByKey[key] = 該區間最新的預約陣列（原始 Firestore 資料，Timestamp 交由頁面轉換）
   * entries: key → { unsub, mode: 'listen'|'callable', ready: Promise, lastUsed }
   */
  const appointmentsByKey = reactive({});
  const entries = new Map();

  async function fetchAppointmentsViaCallable(projectId, start, end) {
    const res = await callApi('fetchCalendarData', { projectId, startDate: toDate(start), endDate: toDate(end) });
    return Array.isArray(res.data) ? res.data : [];
  }

  function evictOldListeners() {
    if (entries.size <= MAX_APPOINTMENT_LISTENERS) return;
    const sorted = [...entries.entries()].sort((a, b) => a[1].lastUsed - b[1].lastUsed);
    while (entries.size > MAX_APPOINTMENT_LISTENERS && sorted.length) {
      const [key, entry] = sorted.shift();
      try { if (entry.unsub) entry.unsub(); } catch (_) { /* ignore */ }
      entries.delete(key);
      delete appointmentsByKey[key];
    }
  }

  /**
   * 訂閱某區間的預約。回傳 { key, ready }：ready 在第一批資料到達後 resolve。
   * 直讀模式下之後的異動會自動更新 appointmentsByKey[key]；退回模式下每次呼叫都重抓一次（與原行為相同）。
   */
  function subscribeAppointments(projectId, start, end) {
    const key = rangeKey(projectId, start, end);
    const existing = entries.get(key);
    if (existing) {
      existing.lastUsed = Date.now();
      if (existing.mode === 'callable') {
        existing.ready = fetchAppointmentsViaCallable(projectId, start, end)
          .then((list) => { appointmentsByKey[key] = list; })
          .catch((e) => { console.warn('[inspectionCalendarStore] 重抓預約失敗:', e?.message || e); });
      }
      return { key, ready: existing.ready };
    }

    const entry = { unsub: null, mode: 'listen', ready: null, lastUsed: Date.now() };
    entries.set(key, entry);
    const startD = toDate(start);
    const endD = toDate(end);

    const fallbackOnce = () => {
      entry.mode = 'callable';
      entry.unsub = null;
      return fetchAppointmentsViaCallable(projectId, startD, endD).then((list) => { appointmentsByKey[key] = list; });
    };

    if (isDirectDenied('inspection:appointments')) {
      entry.ready = fallbackOnce();
    } else {
      entry.ready = new Promise((resolve, reject) => {
        let settled = false;
        const q = query(
          collection(db, 'appointments'),
          where('projectId', '==', projectId),
          where('appointmentDate', '>=', startD),
          where('appointmentDate', '<=', endD)
        );
        entry.unsub = onSnapshot(q, (snap) => {
          appointmentsByKey[key] = snap.docs.map(d => ({ id: d.id, ...d.data() }));
          if (!settled) { settled = true; resolve(); }
        }, (err) => {
          console.warn('[inspectionCalendarStore] 預約直讀監聽失敗，退回 Cloud Function:', err?.code || err?.message);
          if (err?.code === 'permission-denied') markDirectDenied('inspection:appointments');
          try { if (entry.unsub) entry.unsub(); } catch (_) { /* ignore */ }
          fallbackOnce()
            .then(() => { if (!settled) { settled = true; resolve(); } })
            .catch((e) => { if (!settled) { settled = true; reject(e); } });
        });
      });
    }
    evictOldListeners();
    return { key, ready: entry.ready };
  }

  /** 一次性抓某區間的預約（匯出對話框補抓用），不建立監聽 */
  function fetchAppointmentsOnce(projectId, start, end) {
    return withDirectFallback(
      'inspection:appointments',
      async () => {
        const snap = await getDocs(query(
          collection(db, 'appointments'),
          where('projectId', '==', projectId),
          where('appointmentDate', '>=', toDate(start)),
          where('appointmentDate', '<=', toDate(end))
        ));
        return snap.docs.map(d => ({ id: d.id, ...d.data() }));
      },
      () => fetchAppointmentsViaCallable(projectId, start, end)
    );
  }

  // ---- 排休 / 行事曆備註（輸出格式對齊後端 _handleFetchInspectorLeaves / _handleFetchCalendarNotes）----
  function fetchInspectorLeaves(projectId, startDate, endDate) {
    return withDirectFallback(
      'inspection:leaves',
      async () => {
        const snap = await getDocs(query(collection(db, 'inspectorLeaves'), where('projectId', '==', projectId)));
        const results = [];
        snap.forEach((d0) => {
          const d = d0.data();
          if (startDate && DATE_RE.test(startDate) && d.date < startDate) return;
          if (endDate && DATE_RE.test(endDate) && d.date > endDate) return;
          results.push({
            id: d0.id, projectId: d.projectId, date: d.date, kind: d.kind || 'leave',
            staffName: d.staffName || '', type: d.type || 'full', note: d.note || '',
            createdByName: d.createdByName || '', createdAt: toIso(d.createdAt),
            updatedByName: d.updatedByName || '', updatedAt: toIso(d.updatedAt),
          });
        });
        return results;
      },
      async () => (await callApi('fetchInspectorLeaves', { projectId, startDate, endDate })).data?.data || []
    );
  }

  function fetchCalendarNotes(projectId, startDate, endDate) {
    return withDirectFallback(
      'inspection:notes',
      async () => {
        const snap = await getDocs(query(collection(db, 'calendarNotes'), where('projectId', '==', projectId)));
        const results = [];
        snap.forEach((d0) => {
          const d = d0.data();
          if (startDate && DATE_RE.test(startDate) && d.date < startDate) return;
          if (endDate && DATE_RE.test(endDate) && d.date > endDate) return;
          results.push({
            id: d0.id, projectId: d.projectId, date: d.date, note: d.note || '',
            color: CALENDAR_NOTE_COLORS.includes(d.color) ? d.color : 'amber',
            groupId: d.groupId || d0.id,
            createdByName: d.createdByName || '', createdAt: toIso(d.createdAt),
            updatedByName: d.updatedByName || '', updatedAt: toIso(d.updatedAt),
          });
        });
        results.sort((a, b) => (a.date === b.date ? String(a.id).localeCompare(String(b.id)) : a.date.localeCompare(b.date)));
        return results;
      },
      async () => (await callApi('fetchCalendarNotes', { projectId, startDate, endDate })).data?.data || []
    );
  }

  /** 每日名額摘要：跨集合聚合，維持走後端 */
  async function fetchDailyQuotaSummary(projectId, startDate, endDate) {
    return (await callApi('fetchDailyQuotaSummary', { projectId, startDate, endDate })).data?.data || {};
  }

  /** 入口頁簽到期間預載：全部 fire-and-forget */
  function prefetch(projectId, start, end) {
    if (!projectId) return;
    const swallow = (label) => (e) => {
      if (import.meta.env.DEV) console.warn(`[inspectionCalendarStore] prefetch ${label} 失敗（忽略）:`, e?.message || e);
    };
    getProjectConfig(projectId).catch(swallow('config'));
    getAppointmentDateRange(projectId).catch(swallow('range'));
    if (start && end) {
      try { subscribeAppointments(projectId, start, end).ready.catch(swallow('appointments')); } catch (e) { swallow('appointments')(e); }
    }
  }

  return {
    appointmentsByKey,
    getProjectConfig,
    getAppointmentDateRange,
    subscribeAppointments,
    fetchAppointmentsOnce,
    fetchInspectorLeaves,
    fetchCalendarNotes,
    fetchDailyQuotaSummary,
    prefetch,
    get activeListenerCount() { return entries.size; },
  };
});
