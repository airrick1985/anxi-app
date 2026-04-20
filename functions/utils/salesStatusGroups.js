// 銷控狀態分類（functions CJS 版本）
// 前端對應檔案：src/utils/salesStatusGroups.js（請保持一致）

const DEAL_STATUSES = ['小訂', '補足', '簽約', '成交', '已售', '保留', '售出', '銷控'];
const RELEASED_STATUSES = ['退戶', '退訂', '解約', '取消', '刪除', '釋出', '退簽約', '退小訂', '退補足'];

function classifySalesStatus(status) {
  if (!status) return 'neutral';
  if (DEAL_STATUSES.includes(status)) return 'deal';
  if (RELEASED_STATUSES.includes(status)) return 'released';
  return 'neutral';
}

const STATUS_STYLE = {
  deal:     { color: '#2E7D32', tag: '已售出，請勿重複介紹', emoji: '🈲' },
  released: { color: '#C62828', tag: '已釋出，可開放介紹',     emoji: '✅' },
  neutral:  { color: '#616161', tag: '',                     emoji: 'ℹ️'  },
};

module.exports = { DEAL_STATUSES, RELEASED_STATUSES, classifySalesStatus, STATUS_STYLE };
