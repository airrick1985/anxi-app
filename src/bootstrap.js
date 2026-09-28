import { isLeadLiffLaunch, readLeadReportId, legacyLeadReportRedirect, pendingLeadReportCallback, LEAD_REPORT_LIFF_ID } from './utils/leadReportLink';

async function bootstrap() {
  const legacyRedirect = legacyLeadReportRedirect(window.location.href);
  if (legacyRedirect) {
    window.location.replace(legacyRedirect);
    return;
  }
  let pendingId;
  try {
    pendingId = pendingLeadReportCallback(window.location.href, localStorage.getItem('pendingLeadReportId'));
  } catch { /* storage 不可用不影響帶有名單 ID 的連結 */ }
  // LIFF 必須先處理 OAuth / primary redirect，之後才能建立會改寫 hash 的 Vue Router。
  // 一般頁面不下載 LINE SDK。
  if (isLeadLiffLaunch(window.location.href) || pendingId) {
    const leadId = readLeadReportId(window.location.href) || pendingId;
    const { initializeLiff } = await import('./utils/liffAuth');
    try {
      await initializeLiff(import.meta.env.VITE_LIFF_ID_LEAD_REPORT || LEAD_REPORT_LIFF_ID);
    } catch {
      // 頁面會顯示可重試錯誤；啟動不會永遠被 SDK 阻塞。
    }
    if (leadId) {
      const url = new URL(window.location.href);
      url.hash = `/contact?id=${encodeURIComponent(leadId)}`;
      for (const key of ['liff_path', 'liff.state', 'leadReportId']) url.searchParams.delete(key);
      window.history.replaceState(window.history.state, '', url);
    }
  }
  await import('./main');
}
bootstrap().catch(() => window.__anxiStartup?.fail());
