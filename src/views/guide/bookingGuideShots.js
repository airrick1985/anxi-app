// 預約系統使用說明的截圖對照表
// 截圖放在 public/guide/booking/，在對應的 key 填入檔名（例如 'batch-dialog.png'）即改顯示截圖；留空顯示示意圖。
// 示意圖上有紅色編號的（menu-items、households-grid、page-preview、open-general、calendar-toolbar、reports-cell），截圖請標上相同編號。
export const bookingGuideShots = {
  'start-nav': '',
  'menu-items': '',
  'menu-method': '',
  'batch-list': '',
  'batch-dialog': '',
  'households-grid': '',
  'page-preview': '',
  'open-general': '',
  'calendar-toolbar': '',
  'calendar-detail': '',
  'reports-cell': '',
  'reports-manager': '',
  'feedback-editor': '',
};

export const bookingGuideShotSrc = (id) => {
  const file = bookingGuideShots[id];
  return file ? `${import.meta.env.BASE_URL}guide/booking/${file}` : '';
};
