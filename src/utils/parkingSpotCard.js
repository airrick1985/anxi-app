// 車位資訊卡（ParkingSpotInfo）與編輯視窗（ParkingSpotEditDialog）共用：色調、保留期限標籤
import { classifyCommitment } from '@/utils/salesStatusGroups';
import { diffDays, toDateKey, todayKey } from '@/composables/useParkingRatio';

// 依確定度層級；onSolid 為 solid 底色上的文字色
export const SPOT_TONES = {
  signed: { solid: '#c62828', onSolid: '#fff', soft: '#fde7e5', text: '#a11b12' },
  booked: { solid: '#d35400', onSolid: '#fff', soft: '#ffe8d6', text: '#8f3a00' },
  held: { solid: '#f9b233', onSolid: '#3d2900', soft: '#fff1d1', text: '#7a4d00' },
  guest: { solid: '#1565c0', onSolid: '#fff', soft: '#e3effc', text: '#0d4a94' },
  released: { solid: '#6a1b9a', onSolid: '#fff', soft: '#f1e4f7', text: '#561480' },
  available: { solid: '#2e7d32', onSolid: '#fff', soft: '#e4f4e5', text: '#1f6224' },
  unset: { solid: '#e3e3e8', onSolid: '#3a3a3c', soft: '#f2f2f5', text: '#3a3a3c' },
};

/** 後台狀態的色調；未設定狀態為中性灰 */
export function backendTone(statusBackend, overrides) {
  if (!statusBackend) return SPOT_TONES.unset;
  return SPOT_TONES[classifyCommitment(statusBackend, overrides)] || SPOT_TONES.unset;
}

/** 報價系統狀態的色調 */
export function quoteTone(status) {
  if (!status) return SPOT_TONES.unset;
  if (status === '已售') return SPOT_TONES.signed;
  if (status === '來賓車位') return SPOT_TONES.guest;
  return SPOT_TONES.available;
}

/** 保留期限標籤 { label, tone: normal | warn | danger | muted } */
export function holdDeadline(reservedUntil) {
  const key = toDateKey(reservedUntil);
  if (!key) return { label: '未設到期日', tone: 'muted' };
  const left = diffDays(todayKey(), key);
  if (left < 0) return { label: `已逾期 ${-left} 天`, tone: 'danger' };
  if (left === 0) return { label: '今天到期', tone: 'danger' };
  return { label: `剩 ${left} 天`, tone: left <= 3 ? 'warn' : 'normal' };
}
