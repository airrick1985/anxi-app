import { liffLinkLayers } from './leadReportLink.js';

// LINE 訊息「查看預約／取消預約」按鈕：https://liff.line.me/{viewingReservation}?reservationId=…&projectId=…&action=cancel
// （functions/viewingReservationReminder.js 產生）。LIFF 開啟時參數可能在 liff.state 內，需逐層解析。
export function readViewingReservationLink(href) {
  for (const url of liffLinkLayers(href)) {
    const reservationId = url.searchParams.get('reservationId');
    if (reservationId && /^[A-Za-z0-9]{10,40}$/.test(reservationId)) {
      return {
        reservationId,
        projectId: url.searchParams.get('projectId') || '',
        action: url.searchParams.get('action') === 'cancel' ? 'cancel' : 'view',
      };
    }
  }
  return null;
}

// 帶到行事曆的路由 query（行事曆開啟該筆預約後會清除）
export function viewingReservationLinkQuery(link) {
  return link.action === 'cancel'
    ? { reservationId: link.reservationId, action: 'cancel' }
    : { reservationId: link.reservationId };
}
