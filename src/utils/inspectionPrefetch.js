/**
 * 驗屋預約時間表預載（與 salesPrefetch 同一套做法）
 * 入口頁簽到（checkInToSystem 雲端函式）期間：先下載時間表 chunk，並把建案設定、日期範圍、
 * 本週預約灌進 inspectionCalendarStore，進頁時直接命中。全部 fire-and-forget。
 */
import { startOfWeek, endOfWeek } from 'date-fns';
import { useInspectionCalendarStore } from '@/store/inspectionCalendarStore';

export function prefetchInspectionCalendarChunks() {
  import('@/views/public/InspectionCalendar.vue').catch(() => {});
}

export function prefetchInspectionCalendarData(projectId) {
  if (!projectId) return;
  const store = useInspectionCalendarStore();
  const start = startOfWeek(new Date(), { weekStartsOn: 1 });
  const end = endOfWeek(new Date(), { weekStartsOn: 1 });
  store.prefetch(projectId, start, end);
}

export function prefetchInspectionCalendar(projectId) {
  prefetchInspectionCalendarChunks();
  prefetchInspectionCalendarData(projectId);
}
