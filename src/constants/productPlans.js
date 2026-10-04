/**
 * 各系統方案價格（自 LandingPage.vue 抽出，供首頁「方案價格」與產品簡報 /deck 共用，改價只需改這裡）。
 *
 * - pricing：方案卡（isRecommended 為主推方案，badge 為角標文字）
 * - notes：方案備註
 */
export const PRODUCT_PLANS = {
  sales: {
    pricing: [
      { name: '彈性月繳方案', subName: '單一帳號費用', price: 'NT$ 2,500', unit: '月', desc: '適合短期專案或小型團隊，資金運用更靈活。', isRecommended: false },
      { name: '超值年繳優惠', subName: '單一帳號費用', price: 'NT$ 25,000', unit: '年', priceNote: '平均每月僅 NT$ 2,083', desc: '一次訂閱享整年優惠，現省 NT$ 5,000！', badge: '年度首選', isRecommended: true },
    ],
    notes: ['訂閱費為一個帳號費用，帳號無法共用。', '公司多人訂閱另有優惠，請聯繫我們。', '以上金額未含稅。'],
  },
  customer: {
    pricing: [
      { name: '彈性月繳方案', subName: '單一帳號費用', price: 'NT$ 1,000', unit: '月', desc: '輕鬆入門，適合個人或小型銷售團隊使用。', isRecommended: false },
      { name: '超值年繳優惠', subName: '單一帳號費用', price: 'NT$ 10,000', unit: '年', priceNote: '平均每月僅 NT$ 833', desc: '長期訂閱更划算，現省 NT$ 2,000！', badge: '超值推薦', isRecommended: true },
    ],
    notes: ['訂閱費為一個帳號費用，帳號無法共用。', '如需整合 LINE 官方帳號通知功能，需額外設定。', '以上金額未含稅。'],
  },
  booking: {
    pricing: [
      { name: '短期彈性方案', subName: '月繳 (Monthly)', price: 'NT$ 100', unit: '戶 / 月', desc: '適合短期專案使用，隨需訂閱。', isRecommended: false },
      { name: '中期優惠方案', subName: '季繳 (Quarterly)', price: 'NT$ 80', unit: '戶 / 月', desc: '一次繳納 3 個月費用，取得更佳費率。', isRecommended: false },
      { name: '年度超值方案', subName: '年繳 (Yearly)', price: 'NT$ 50', unit: '戶 / 月', desc: '一次繳納 12 個月費用，省下 50% 成本！', badge: 'CP 值最高', isRecommended: true },
    ],
    notes: ['計費說明：以上費用以建案「總戶數」為計算基準。', '大量戶別訂閱另有優惠，請聯繫我們。', '款項付清後，系統將於 1-3 個工作日內完成建置並開通。', '以上金額未含稅。'],
  },
  inspection: {
    pricing: [
      { name: '驗屋系統計價方案', subName: '按戶計費 (Per Unit)', price: 'NT$ 500', unit: '戶', desc: '透明靈活的計價方式，依實際建案總戶數計算，用多少算多少。', badge: '交屋階段', isRecommended: true },
      { name: '修繕系統計價方案', subName: '售後服務階段', price: '請洽詢報價', unit: '', desc: '依建案規模與服務範圍客製報價。', isRecommended: false },
    ],
    notes: ['費用包含完整的驗屋系統功能與無限組數管理帳號。', '住戶端查詢介面不另收費。', '以上金額未含稅。'],
  },
  website: {
    pricing: [
      { name: '形象網站方案', subName: '線上行銷首選', price: 'NT$ 50,000', unit: '案', desc: '含一次預告階段以及正式公開階段網站、LINE／Email 預約名單即時通知功能。', isRecommended: false },
      { name: '電子表板方案', subName: '案場解說利器', price: 'NT$ 150,000', unit: '案', desc: '雲端／離線皆可使用的互動式電子表板，提升案場解說效率與專業形象。', isRecommended: true, badge: '案場人氣' },
    ],
    notes: ['網站與表板內容資料（如圖檔、文案）由客戶提供。', '形象網站包含首年伺服器空間與網址費用。', 'LINE 通知功能需搭配建案官方帳號權限。', '以上金額未含稅。'],
  },
};
