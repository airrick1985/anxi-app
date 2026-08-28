// src/utils/trialTracking.js
// 試用留資事件追蹤（docs/SPEC_LandingTrialLeadsOnboarding.md §8）
// - leadId 存在 sessionStorage['anxi-trial-lead']（TrialSignup 送出成功後寫入）
// - 沒有 leadId 時 no-op；呼叫皆為 fire-and-forget，不阻塞 UI
import { trackTrialLeadEventAPI } from '@/api';

export const TRIAL_LEAD_STORAGE_KEY = 'anxi-trial-lead';

export function setTrialLeadId(leadId) {
  try {
    if (leadId) sessionStorage.setItem(TRIAL_LEAD_STORAGE_KEY, String(leadId));
  } catch (e) { /* ignore */ }
}

export function getTrialLeadId() {
  try {
    return sessionStorage.getItem(TRIAL_LEAD_STORAGE_KEY) || null;
  } catch (e) {
    return null;
  }
}

export function clearTrialLeadId() {
  try { sessionStorage.removeItem(TRIAL_LEAD_STORAGE_KEY); } catch (e) { /* ignore */ }
}

/**
 * 記錄試用事件
 * @param {'auto_login'|'tour_started'|'tour_completed'|'tour_skipped'|'enter_system'|'landing_cta_click'} type
 * @param {object} [meta]
 */
export function trackTrialEvent(type, meta = {}) {
  const leadId = getTrialLeadId();
  if (!leadId || !type) return;
  trackTrialLeadEventAPI({ leadId, type, meta }).catch((err) => {
    console.warn('[trialTracking] 事件記錄失敗（忽略）:', type, err?.message || err);
  });
}
