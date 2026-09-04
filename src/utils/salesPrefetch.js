/**
 * 銷控 / 報價系統預載工具
 *
 * 目的：使用者在「選建案 → 簽到（checkInToSystem 雲端函式）→ 進入頁面」流程中，
 * 簽到那一步可能要等 Cloud Function 冷啟動；這段時間本來是純等待，
 * 現在拿來同時：
 *   1. 下載頁面的 JS chunk（SalesControlSystem / QuoteSettings）
 *   2. 建立 Firestore 監聽並把戶別等資料灌進 salesDataStore 快取
 *   3. 讀取文字樣式與狀態顏色
 * 進到頁面時 loadProjectData 直接命中快取，整體時間從「簽到 + 載資料」變成「兩者取最大值」。
 *
 * 所有呼叫皆為 fire-and-forget，失敗只記 log，不影響原本流程（頁面仍會照常自行載入）。
 */
import { useSalesDataStore } from '@/store/salesDataStore';
import { useTextStyleStore } from '@/store/textStyleStore';
import { useStatusColorStore } from '@/store/statusColorStore';

const swallow = (label) => (e) => {
  if (import.meta.env.DEV) console.warn(`[Prefetch] ${label} 失敗（忽略）:`, e?.message || e);
};

/** 預先下載頁面 chunk（不需要 projectId，可在選建案頁掛載時就開始） */
export function prefetchSalesChunks(mode = 'sales') {
  import('@/views/SalesControlSystem.vue').catch(swallow('SalesControlSystem chunk'));
  if (mode === 'quote') {
    import('@/views/QuoteFunctionSelect.vue').catch(swallow('QuoteFunctionSelect chunk'));
    import('@/views/QuoteSettings.vue').catch(swallow('QuoteSettings chunk'));
  }
}

/** 預先載入建案資料（戶別/車位/參數/人員/圖片）與樣式、顏色設定 */
export function prefetchSalesData(projectId) {
  if (!projectId) return;
  const salesDataStore = useSalesDataStore();
  const textStyleStore = useTextStyleStore();
  const statusColorStore = useStatusColorStore();
  Promise.resolve(salesDataStore.loadProjectData(projectId)).catch(swallow('salesDataStore'));
  Promise.resolve(textStyleStore.fetchStyles(projectId)).catch(swallow('textStyles'));
  Promise.resolve(statusColorStore.fetchColors(projectId)).catch(swallow('statusColors'));
}

/** chunk + 資料一起預載 */
export function prefetchSalesSystem(projectId, mode = 'sales') {
  prefetchSalesChunks(mode);
  prefetchSalesData(projectId);
}
