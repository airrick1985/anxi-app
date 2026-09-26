// 退戶紀錄共用格式化／計價工具：退戶記錄管理與戶別資訊「退戶紀錄」分頁共用，避免兩份算法漂移

export function formatCancelDateTime(timestamp) {
  if (!timestamp) return '—';
  if (timestamp._seconds) {
    return new Date(timestamp._seconds * 1000).toLocaleString('zh-TW', { timeZone: 'Asia/Taipei' });
  }
  if (timestamp instanceof Date) {
    return timestamp.toLocaleString('zh-TW', { timeZone: 'Asia/Taipei' });
  }
  return String(timestamp);
}

export function formatDateOnly(value) {
  if (!value) return '—';
  let date;
  if (value._seconds) {
    date = new Date(value._seconds * 1000);
  } else if (value instanceof Date) {
    date = value;
  } else {
    const str = String(value);
    if (/^\d{4}-\d{2}-\d{2}/.test(str)) return str.slice(0, 10);
    date = new Date(str);
    if (isNaN(date.getTime())) return str;
  }
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function formatPrice(val) {
  if (val === null || val === undefined || val === '') return '—';
  return Number(val).toLocaleString();
}

export function formatNum(val) {
  if (val === null || val === undefined || val === '') return '—';
  return Number(val).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 });
}

// 車位成交價／底價加總
export function calculateParkingPrices(item) {
  const parkingDetails = item?.parkingDetails || [];
  const parkingTransactionSum = parkingDetails.reduce((sum, p) => sum + (Number(p.price_transaction) || 0), 0);
  const parkingFloorSum = parkingDetails.reduce((sum, p) => sum + (Number(p.price_floor) || 0), 0);
  return { parkingTransactionSum, parkingFloorSum };
}

// 成交總價 = 房屋成交價 + 車位成交價
export function calculateTotalTransactionPrice(item) {
  const housePrice = Number(item?.price_transaction_house) || 0;
  const { parkingTransactionSum } = calculateParkingPrices(item);
  return housePrice + parkingTransactionSum;
}

// 溢差價 = 成交總價 - 房屋底價 - 車位底價
export function calculatePremiumPrice(item) {
  const totalTransactionPrice = calculateTotalTransactionPrice(item);
  const houseFloorPrice = Number(item?.price_floor_house_total) || 0;
  const { parkingFloorSum } = calculateParkingPrices(item);
  return totalTransactionPrice - houseFloorPrice - parkingFloorSum;
}
