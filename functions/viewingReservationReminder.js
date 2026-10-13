const { Firestore } = require('@google-cloud/firestore');
const { onSchedule } = require('firebase-functions/v2/scheduler');
const line = require('@line/bot-sdk');
const { shouldBlockOutbound } = require('./utils/trialGuard');

// 賞屋預約 LINE 預約前提醒
// - lineReminder { enabled, offsets }：前端設定，offsets 為提前分鐘數（規則同 src/utils/viewingReminder.js）
// - lineReminderNextAt／lineReminderSent：後端維護。onViewingReservationChange 依目前資料重算，排程發送後推進
// - 發送紀錄以「提前分鐘@預約時間」記錄，改預約時間後舊紀錄自然失效、提醒重新排程
const MAX_REMINDERS = 3;
const MAX_OFFSET_MINUTES = 30 * 24 * 60;
// 到期後仍可補發的時間：排程每 5 分鐘一次，避免期間的編輯把剛到期的提醒略過
const GRACE_MS = 15 * 60 * 1000;
// 賞屋預約 LIFF（src/utils/liffApps.js 的 viewingReservation）；入口頁依 reservationId 開啟該筆預約
const VIEWING_LIFF_ID = '2008257338-FCbKJ8bB';

function toMillis(value) {
  if (!value) return null;
  if (typeof value.toMillis === 'function') return value.toMillis();
  const ms = new Date(value).getTime();
  return Number.isNaN(ms) ? null : ms;
}

function normalizeOffsets(offsets) {
  if (!Array.isArray(offsets)) return [];
  return [...new Set(offsets.map(Number))]
    .filter(n => Number.isInteger(n) && n > 0 && n <= MAX_OFFSET_MINUTES)
    .sort((a, b) => b - a)
    .slice(0, MAX_REMINDERS);
}

const reminderKey = (offset, timeMs) => `${offset}@${timeMs}`;

// 尚未發送、仍在有效期內的提醒，依發送時間排序
function pendingReminders(data, nowMs) {
  const timeMs = toMillis(data?.reservationTime);
  if (data?.status !== 'active' || !data.lineReminder?.enabled || !timeMs || timeMs <= nowMs) return [];
  const sent = new Set(data.lineReminderSent || []);
  return normalizeOffsets(data.lineReminder.offsets)
    .map(offset => ({ offset, at: timeMs - offset * 60 * 1000, key: reminderKey(offset, timeMs) }))
    .filter(r => !sent.has(r.key) && r.at > nowMs - GRACE_MS)
    .sort((a, b) => a.at - b.at);
}

function nextReminderAt(data, nowMs) {
  const pending = pendingReminders(data, nowMs);
  return pending.length ? new Date(pending[0].at) : null;
}

// 只保留目前預約時間的發送紀錄
function currentSentKeys(data) {
  const timeMs = toMillis(data?.reservationTime);
  if (!timeMs) return [];
  return (data.lineReminderSent || []).filter(key => key.endsWith(`@${timeMs}`));
}

// 依目前資料應有的排程欄位；與現值相同時回傳 null（不寫入，避免觸發器循環）
function reminderScheduleUpdate(data, nowMs) {
  const next = nextReminderAt(data, nowMs);
  const sent = currentSentKeys(data);
  const sameNext = (next ? next.getTime() : null) === toMillis(data.lineReminderNextAt);
  const sameSent = sent.length === (data.lineReminderSent || []).length;
  return sameNext && sameSent ? null : { lineReminderNextAt: next, lineReminderSent: sent };
}

/**
 * 預約寫入後重算下次提醒時間。
 * 觸發器收到的可能是較舊的快照，寫入前在交易內重讀，避免覆蓋排程剛記下的發送紀錄。
 */
async function syncReminderSchedule(ref, data, nowMs = Date.now()) {
  if (!reminderScheduleUpdate(data, nowMs)) return;
  await ref.firestore.runTransaction(async tx => {
    const current = (await tx.get(ref)).data();
    const update = current && reminderScheduleUpdate(current, nowMs);
    if (update) tx.update(ref, update);
  });
}

function formatOffset(minutes) {
  if (minutes % 1440 === 0) return `${minutes / 1440} 天`;
  if (minutes % 60 === 0) return `${minutes / 60} 小時`;
  return `${minutes} 分鐘`;
}

function formatTime(ms) {
  return new Date(ms).toLocaleString('zh-TW', {
    timeZone: 'Asia/Taipei',
    month: '2-digit', day: '2-digit', weekday: 'short', hour: '2-digit', minute: '2-digit', hour12: false,
  });
}

const infoRow = (label, value, extra = {}) => ({
  type: 'box',
  layout: 'baseline',
  contents: [
    { type: 'text', text: label, color: '#aaaaaa', size: 'sm', flex: 2 },
    { type: 'text', text: String(value), wrap: true, color: '#666666', size: 'sm', flex: 5, ...extra },
  ],
});

function reservationLiffUrl(docId, projectId, action) {
  const params = new URLSearchParams({ reservationId: docId });
  if (projectId) params.set('projectId', projectId);
  if (action) params.set('action', action);
  return `https://liff.line.me/${VIEWING_LIFF_ID}?${params}`;
}

// LINE 訊息底部「取消預約」「查看預約」：開啟系統中的該筆預約，取消需在系統內再確認
function reservationActionFooter(docId, projectId) {
  return {
    type: 'box',
    layout: 'horizontal',
    spacing: 'sm',
    contents: [
      { type: 'button', style: 'secondary', height: 'sm', action: { type: 'uri', label: '取消預約', uri: reservationLiffUrl(docId, projectId, 'cancel') } },
      { type: 'button', style: 'primary', height: 'sm', color: '#0071E3', action: { type: 'uri', label: '查看預約', uri: reservationLiffUrl(docId, projectId) } },
    ],
  };
}

function buildReminderMessage(docId, data, projectName, offset) {
  const title = `⏰ 預約提醒｜${formatOffset(offset)}後`;
  const rows = [
    infoRow('建案', projectName),
    infoRow('時間', formatTime(toMillis(data.reservationTime)), { weight: 'bold', color: '#1d1d1f' }),
    infoRow('客戶', `${data.customerName || ''} (${data.type || ''})`),
    data.customerPhone && infoRow('電話', data.customerPhone, {
      color: '#007bff',
      action: { type: 'uri', label: '撥打', uri: `tel:${data.customerPhone}` },
    }),
    infoRow('銷售', data.salesName || '不指定', { weight: 'bold' }),
    data.unitId && infoRow('戶別', data.unitId),
    data.note && infoRow('備註', data.note, { color: '#D32F2F' }),
  ].filter(Boolean);

  return {
    type: 'flex',
    altText: `${title}｜${data.customerName || ''}`,
    contents: {
      type: 'bubble',
      size: 'mega',
      body: {
        type: 'box',
        layout: 'vertical',
        contents: [
          { type: 'text', text: title, weight: 'bold', size: 'xl', color: '#007AFF', wrap: true },
          { type: 'separator', margin: 'md' },
          { type: 'box', layout: 'vertical', margin: 'md', spacing: 'sm', contents: rows },
        ],
      },
      footer: reservationActionFooter(docId, data.projectId),
    },
  };
}

// 與 onViewingReservationChange 相同：預設客資 LINE 官方帳號，建案有設定專屬 Token 時改用
async function resolveChannelToken(db, projectId) {
  let token = process.env.ANXISMART_LINE_CRM_TOKEN;
  const settings = await db.collection('customerFieldSettings').doc(projectId).get();
  const secretName = settings.data()?.anxiSystemConfig?.lineCrmChannelAccessTokenSecretName;
  if (secretName && process.env[secretName]) token = process.env[secretName];
  return token;
}

async function pushWithRetry(client, to, message) {
  const MAX_RETRIES = 3;
  for (let attempt = 1; ; attempt++) {
    try {
      return await client.pushMessage(to, [message]);
    } catch (error) {
      if (error.statusCode !== 429 || attempt >= MAX_RETRIES) throw error;
      await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
    }
  }
}

// 發給負責銷售；不指定銷售時發給建立者
async function sendReminder(db, docId, data, offset) {
  if (await shouldBlockOutbound(data.projectId, 'line')) return; // [TrialGuard]

  const recipientId = data.salesId || data.salesPhone || data.creatorId || data.operatorId;
  if (!recipientId) return;
  const userDoc = await db.collection('users').doc(recipientId).get();
  const lineId = String(userDoc.data()?.lineId || '').trim();
  if (!lineId.startsWith('U')) {
    console.log(`[viewingReservationReminder] ${docId} 提醒對象 ${recipientId} 未綁定 LINE，略過`);
    return;
  }

  const [projectDoc, token] = await Promise.all([
    db.collection('projects').doc(data.projectId).get(),
    resolveChannelToken(db, data.projectId),
  ]);
  if (!token) {
    console.warn(`[viewingReservationReminder] 找不到可用的 LINE Channel Token：${data.projectId}`);
    return;
  }
  const projectName = projectDoc.data()?.name || data.projectId;
  const client = new line.Client({ channelAccessToken: token });
  await pushWithRetry(client, lineId, buildReminderMessage(docId, data, projectName, offset));
  console.log(`[viewingReservationReminder] ${docId} 已提醒 ${recipientId}（${formatOffset(offset)}前）`);
}

// 先以交易標記已發送再推播，避免重複發送；同時到期多則（例如排程延誤）只發最接近預約時間的一則
async function processReservation(db, ref, nowMs) {
  const claimed = await db.runTransaction(async tx => {
    const snap = await tx.get(ref);
    const data = snap.data();
    if (!data) return null;
    const pending = pendingReminders(data, nowMs);
    const due = pending.filter(r => r.at <= nowMs);
    const upcoming = pending.filter(r => r.at > nowMs);
    tx.update(ref, {
      lineReminderSent: [...currentSentKeys(data), ...due.map(r => r.key)],
      lineReminderNextAt: upcoming.length ? new Date(upcoming[0].at) : null,
    });
    return due.length ? { data, offset: Math.min(...due.map(r => r.offset)) } : null;
  });
  if (claimed) await sendReminder(db, ref.id, claimed.data, claimed.offset);
}

exports.viewingReservationReminder = onSchedule({
  schedule: '*/5 * * * *',
  timeZone: 'Asia/Taipei',
  region: 'asia-east1',
  memory: '512MiB',
  secrets: ['ANXISMART_LINE_CRM_TOKEN'],
}, async () => {
  const db = new Firestore({ databaseId: 'anxi-app' });
  const nowMs = Date.now();
  const snapshot = await db.collection('viewing_reservations')
    .where('lineReminderNextAt', '<=', new Date(nowMs))
    .limit(200)
    .get();

  for (const doc of snapshot.docs) {
    try {
      await processReservation(db, doc.ref, nowMs);
    } catch (error) {
      const detail = error?.originalError?.response?.data || error.message;
      console.error(`[viewingReservationReminder] ${doc.id} 提醒失敗:`, detail);
    }
  }
});

exports.syncReminderSchedule = syncReminderSchedule;
exports.pendingReminders = pendingReminders;
exports.nextReminderAt = nextReminderAt;
exports.currentSentKeys = currentSentKeys;
exports.normalizeOffsets = normalizeOffsets;
exports.formatOffset = formatOffset;
exports.buildReminderMessage = buildReminderMessage;
exports.reservationActionFooter = reservationActionFooter;
