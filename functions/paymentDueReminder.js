/**
 * 繳款到期：每小時排程與到期清單 API，規格：docs/SPEC_PaymentDueReminder.md §5、§8.2、§8.3
 *
 * - paymentDueReminder：依建案設定的整點，把當天符合條件的預計繳款彙整成每人一則通知
 * - paymentReminderApi：到期清單、批次新增、收件人預覽、測試通知、通知紀錄、立即執行
 *
 * 提醒是否發送每次依紀錄即時計算、不寫回戶別：改預計日自動重算，標記已繳自動停止，
 * 也不會與修改銷控整包覆寫 paymentRecords 互相干擾。
 * 當日通知紀錄 paymentDue_{YYYYMMDD} 同時是防重複鎖，並記錄每人每管道的結果供重試。
 */

const { onCall, HttpsError } = require('firebase-functions/v2/https');
const { onSchedule } = require('firebase-functions/v2/scheduler');
const { Firestore, FieldPath } = require('@google-cloud/firestore');
const {
  taipeiToday,
  isValidYmd,
  splitPaymentRecords,
  recordDueState,
  normalizePaymentReminderSettings,
  shouldRemind,
} = require('./utils/paymentRecordStatus');
const { classifySalesStatus } = require('./utils/salesStatusGroups');
const { normalizeSalespersons } = require('./utils/salesperson');
const { SHEET_SYNC_SKIP_FIELD, newSheetSyncBatchId } = require('./utils/sheetSyncSkip');
const { shouldBlockOutbound } = require('./utils/trialGuard');
const { resolveChannelToken } = require('./viewingReservationReminder');
const {
  buildTransporter, lineRetryKey, sendDigest, summarizeItems,
} = require('./notifications/paymentDueNotifier');

const ADMIN_ROLES = new Set(['系統管理員', '超級管理員']);
const MANAGE_SYSTEM = '銷控系統';
const QUOTE_SYSTEM = '報價系統';
const SEND_CATCH_UP_HOURS = 3; // 排程失敗最多補發的時數，超過就不發，避免深夜通知
const LEASE_MS = 10 * 60 * 1000; // 略長於排程逾時 540 秒
const LOG_TYPES = ['paymentDue', 'paymentDueTest'];
const MAX_LOGS = 30;
const MAX_BATCH_ENTRIES = 500;
const BATCH_CONCURRENCY = 10;
const IN_QUERY_LIMIT = 30;
const MAX_ERROR_LENGTH = 300;
const STATE_ORDER = { overdue: 0, today: 1, soon: 2, upcoming: 3 };
const RUN_INTERRUPTED_MESSAGE = '發送中斷，尚未完成';
const SECRETS = ['SENDER_EMAIL', 'GMAIL_APP_PASSWORD', 'ANXISMART_LINE_CRM_TOKEN'];

function taipeiHour(now = new Date()) {
  const hour = new Intl.DateTimeFormat('en-US', { timeZone: 'Asia/Taipei', hour: 'numeric', hourCycle: 'h23' }).format(now);
  return Number(hour);
}

function isWithinSendWindow(sendHour, hour) {
  return hour >= sendHour && hour <= sendHour + SEND_CATCH_UP_HOURS;
}

function runLogId(today) {
  return `paymentDue_${today.replace(/-/g, '')}`;
}

// 後台狀態為空或屬於退戶類的戶別不提醒；建案自訂狀態照常提醒
function isHouseholdEligible(household) {
  const status = household?.salesStatus_backend;
  return !!status && classifySalesStatus(status) !== 'released';
}

function sortDueItems(items) {
  return [...items].sort((a, b) => (
    (STATE_ORDER[a.state] ?? 9) - (STATE_ORDER[b.state] ?? 9)
    || String(a.expectedDate).localeCompare(String(b.expectedDate))
    || String(a.unitId).localeCompare(String(b.unitId), 'zh-Hant', { numeric: true })
  ));
}

function collectPlannedItems(households, today) {
  const items = [];
  (households || []).forEach(household => {
    if (!isHouseholdEligible(household)) return;
    const salesKeys = normalizeSalespersons(household.salespersonUserKey);
    const salesperson = normalizeSalespersons(household.salesperson);
    splitPaymentRecords(household.paymentRecords).planned.forEach(record => {
      const due = recordDueState(record, today);
      items.push({
        unitId: household.unitId,
        recordId: record.id,
        expectedDate: record.expectedDate,
        expectedAmount: record.expectedAmount ?? null,
        note: record.note || '',
        state: due.state,
        daysLeft: due.daysLeft,
        label: due.label,
        buyerName: household.buyerName ? String(household.buyerName) : '',
        buyerPhone: household.buyerPhone ? String(household.buyerPhone) : '',
        salesperson,
        salesKeys,
      });
    });
  });
  return sortDueItems(items);
}

function collectReminderItems(households, settings, today) {
  return collectPlannedItems(households, today).filter(item => shouldRemind(item.daysLeft, settings));
}

function isAdminUser(contact) {
  return (contact?.roles || []).some(role => ADMIN_ROLES.has(role));
}

function hasSalesPermission(systems, contact) {
  return isAdminUser(contact) || (systems || []).includes(MANAGE_SYSTEM) || (systems || []).includes(QUOTE_SYSTEM);
}

/**
 * 依建案設定組出收件人。
 * - 同時是管理人員與銷售人員：合併為一人（role: both），管道取聯集
 * - 被排除的管理人員若是該戶銷售人員，仍以銷售人員身分收到自己的戶
 * - 銷售人員必須仍有該建案權限（通知含買方電話，避免離職或調案人員繼續收到）
 * @returns {{ recipients: Array<object>, skipped: Array<object> }}
 */
function resolveRecipients({ settings, managerKeys, salesKeys, contacts, permissions }) {
  const excluded = new Set(settings.managers.excludedUserKeys);
  const managerChannels = settings.managers.channels;
  const salesChannels = settings.salespersons.channels;
  const people = new Map();
  const skipped = [];

  const entry = (contact) => {
    if (!people.has(contact.userKey)) {
      people.set(contact.userKey, { ...contact, isManager: false, isSalesperson: false, channels: new Set() });
    }
    return people.get(contact.userKey);
  };

  if (managerChannels.length > 0) {
    (managerKeys || new Set()).forEach(key => {
      if (excluded.has(key)) return;
      const contact = contacts.get(key);
      if (!contact || isAdminUser(contact)) return;
      const person = entry(contact);
      person.isManager = true;
      managerChannels.forEach(channel => person.channels.add(channel));
    });
  }

  if (salesChannels.length > 0) {
    (salesKeys || new Set()).forEach(key => {
      const contact = contacts.get(key);
      if (!contact) {
        skipped.push({ userKey: key, name: key, role: 'salesperson', reason: 'user-not-found' });
        return;
      }
      if (!hasSalesPermission(permissions.get(key), contact)) {
        skipped.push({ userKey: key, name: contact.name, role: 'salesperson', reason: 'no-permission' });
        return;
      }
      const person = entry(contact);
      person.isSalesperson = true;
      salesChannels.forEach(channel => person.channels.add(channel));
    });
  }

  const recipients = [...people.values()].map(person => ({
    ...person,
    channels: [...person.channels],
    role: person.isManager && person.isSalesperson ? 'both' : (person.isManager ? 'manager' : 'salesperson'),
  }));
  return { recipients, skipped };
}

/**
 * 決定實際發送管道：LINE 未綁定時改寄 Email；同一人只寄一封 Email。
 * @returns {{ deliveries: Array<{ channel: string, fallbackFrom: string|null }>, skipReason: string|null }}
 */
function planDeliveries(channels, contact) {
  const wantLine = channels.includes('line');
  const wantEmail = channels.includes('email');
  const hasLine = !!contact.lineId;
  const hasEmail = !!contact.email;
  const deliveries = [];
  if (wantLine && hasLine) deliveries.push({ channel: 'line', fallbackFrom: null });
  if (wantEmail && hasEmail) deliveries.push({ channel: 'email', fallbackFrom: null });
  if (wantLine && !hasLine && !wantEmail && hasEmail) deliveries.push({ channel: 'email', fallbackFrom: 'line' });
  if (deliveries.length > 0) return { deliveries, skipReason: null };
  return { deliveries, skipReason: !hasLine && !hasEmail ? 'no-contact' : 'no-email' };
}

function itemsForRecipient(items, recipient) {
  const own = item => item.salesKeys.includes(recipient.userKey);
  const list = recipient.isManager ? items : items.filter(own);
  return list.map(item => ({ ...item, mine: own(item) }));
}

function summarizeRecipientReach(recipients) {
  const summary = { lineFallback: 0, unreachable: 0 };
  recipients.forEach(recipient => {
    const { deliveries } = planDeliveries(recipient.channels, recipient);
    if (deliveries.length === 0) summary.unreachable += 1;
    else if (deliveries.some(d => d.fallbackFrom === 'line')) summary.lineFallback += 1;
  });
  return summary;
}

// 沒有 userKey 的略過紀錄（只有銷售姓名的戶別）以戶別區分
const attemptKey = attempt => `${attempt.userKey || `unit:${attempt.unitId}`}:${attempt.channel || 'none'}`;

function countAttempts(attempts) {
  const count = status => attempts.filter(attempt => attempt.status === status).length;
  return { sent: count('sent'), failed: count('failed'), skipped: count('skipped') };
}

function errorText(error) {
  const detail = error?.response?.data ? JSON.stringify(error.response.data) : (error?.message || 'unknown');
  return String(detail).slice(0, MAX_ERROR_LENGTH);
}

function toMillis(value) {
  if (!value) return 0;
  if (typeof value.toMillis === 'function') return value.toMillis();
  const ms = new Date(value).getTime();
  return Number.isNaN(ms) ? 0 : ms;
}

function toIso(value) {
  if (!value) return null;
  if (typeof value.toDate === 'function') return value.toDate().toISOString();
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

// 已完成就不再發；執行中且租約未過期代表另一次排程正在處理；其餘（partial、租約過期）只補未成功的部分
async function acquireRunLease({ db, logRef, today, sendHour, trigger, now }) {
  const nowMs = now.getTime();
  return db.runTransaction(async tx => {
    const snap = await tx.get(logRef);
    const existing = snap.exists ? snap.data() : null;
    if (existing) {
      if (['done', 'empty', 'blocked'].includes(existing.status)) return { acquired: false, existing };
      if (existing.status === 'running' && toMillis(existing.leaseUntil) > nowMs) return { acquired: false, existing };
      tx.update(logRef, { status: 'running', leaseUntil: new Date(nowMs + LEASE_MS), updatedAt: now });
      return { acquired: true, existing };
    }
    tx.set(logRef, {
      type: 'paymentDue',
      date: today,
      trigger,
      sendHour,
      status: 'running',
      leaseUntil: new Date(nowMs + LEASE_MS),
      itemCount: 0,
      overdueCount: 0,
      attempts: [],
      sent: 0,
      failed: 0,
      skipped: 0,
      createdAt: now,
      updatedAt: now,
    });
    return { acquired: true, existing: null };
  });
}

function runResult(status, log = {}) {
  return {
    status,
    itemCount: log.itemCount || 0,
    sent: log.sent || 0,
    failed: log.failed || 0,
    skipped: log.skipped || 0,
    noRecipients: log.noRecipients === true,
    lastError: log.lastError || null,
  };
}

// Firestore 文件 ID 不可含斜線、不可為 . 或 ..、不可為 __x__，也不可超過 1500 bytes
function isValidDocumentId(key) {
  return typeof key === 'string' && key.length > 0 && !key.includes('/')
    && key !== '.' && key !== '..' && !/^__.*__$/.test(key)
    && Buffer.byteLength(key, 'utf8') <= 1500;
}

async function fetchByDocumentIds(db, collectionName, keys) {
  const result = new Map();
  // 戶別資料可能有不合法的 userKey，直接查詢會讓整個建案失敗；濾掉後由呼叫端視為找不到使用者
  const list = [...new Set(keys)].filter(isValidDocumentId);
  for (let i = 0; i < list.length; i += IN_QUERY_LIMIT) {
    const snap = await db.collection(collectionName)
      .where(FieldPath.documentId(), 'in', list.slice(i, i + IN_QUERY_LIMIT))
      .get();
    snap.forEach(doc => result.set(doc.id, doc.data() || {}));
  }
  return result;
}

async function loadHouseholds(db, projectId) {
  const snap = await db.collection('salesHouseholds').where('projectId', '==', projectId).get();
  return snap.docs.map(doc => {
    const data = doc.data() || {};
    return { ...data, unitId: data.unitId || doc.id.slice(projectId.length + 1) };
  });
}

function toContact(userKey, data) {
  const lineId = typeof data.lineId === 'string' && data.lineId.startsWith('U') ? data.lineId : null;
  const email = typeof data.email === 'string' && data.email.trim() ? data.email.trim() : null;
  return { userKey, name: data.name || userKey, lineId, email, roles: Array.isArray(data.roles) ? data.roles : [] };
}

async function loadRecipientContext(db, projectId, salesKeys) {
  const managerSnap = await db.collection('userPermissions')
    .where(new FieldPath('permissions', projectId, 'systems'), 'array-contains', MANAGE_SYSTEM)
    .get();
  const managerKeys = new Set(managerSnap.docs.map(doc => doc.id));

  const salesKeyList = [...(salesKeys || [])];
  const permissionDocs = await fetchByDocumentIds(db, 'userPermissions', salesKeyList);
  const permissions = new Map();
  salesKeyList.forEach(key => {
    permissions.set(key, permissionDocs.get(key)?.permissions?.[projectId]?.systems || []);
  });

  const userDocs = await fetchByDocumentIds(db, 'users', [...managerKeys, ...salesKeyList]);
  const contacts = new Map();
  userDocs.forEach((data, key) => contacts.set(key, toContact(key, data)));

  return { managerKeys, contacts, permissions };
}

// 一次排程共用同一組 LINE Token 與寄信連線
async function createDigestSender({ db, projectId, projectName }) {
  const lineToken = await resolveChannelToken(db, projectId);
  let transporter = null;
  return ({ channel, contact, items, isTest = false, retryKey }) => {
    if (channel === 'email' && !transporter) transporter = buildTransporter();
    return sendDigest({ channel, contact, projectId, projectName, items, isTest, lineToken, retryKey, transporter });
  };
}

// 全量同步的邏輯都在 index.js，由 index.js 載入時注入，避免循環相依（比照 salesAi.init）
let syncSalesSheetImpl = null;
function init({ syncSalesSheet }) {
  syncSalesSheetImpl = syncSalesSheet;
}

const defaultDeps = {
  isBlocked: projectId => shouldBlockOutbound(projectId, 'line/email'),
  loadHouseholds,
  loadRecipientContext,
  createSender: createDigestSender,
  syncSalesSheet: (params) => {
    if (!syncSalesSheetImpl) throw new Error('Sheet 同步尚未初始化');
    return syncSalesSheetImpl(params);
  },
};

// 有銷售姓名但沒有 userKey 的戶別：銷售人員收不到通知，留下紀錄讓管理人員知道要補資料
function noUserKeyAttempts(items, settings) {
  if (settings.salespersons.channels.length === 0) return [];
  const byUnit = new Map();
  items.forEach(item => {
    if (item.salesKeys.length === 0 && item.salesperson.length > 0 && !byUnit.has(item.unitId)) {
      byUnit.set(item.unitId, {
        userKey: '',
        unitId: item.unitId,
        name: item.salesperson.join('、'),
        role: 'salesperson',
        channel: null,
        fallbackFrom: null,
        status: 'skipped',
        error: 'no-user-key',
      });
    }
  });
  return [...byUnit.values()];
}

/**
 * 執行單一建案當日的提醒。單一收件人失敗不影響其他人；每完成一人就更新紀錄，
 * 中途逾時的話下次只補尚未成功的部分。取得租約後的任何例外都會釋放租約並記為 partial，
 * 不會卡在 running 直到租約過期。
 * @returns {Promise<{ status: string, itemCount: number, sent: number, failed: number, skipped: number, noRecipients: boolean, lastError: string|null }>}
 */
async function runProjectReminder({ db, projectId, projectData, now = new Date(), trigger = 'schedule', deps = defaultDeps }) {
  const settings = normalizePaymentReminderSettings(projectData?.paymentReminderSettings);
  const today = taipeiToday(now);
  const logId = runLogId(today);
  const logRef = db.collection('projects').doc(projectId).collection('notificationLogs').doc(logId);

  const lease = await acquireRunLease({ db, logRef, today, sendHour: settings.sendHour, trigger, now });
  if (!lease.acquired) return runResult(lease.existing.status, lease.existing);

  const previousAttempts = lease.existing?.attempts || [];
  const hadAttempts = previousAttempts.length > 0;
  const attemptsByKey = new Map(previousAttempts.map(a => [attemptKey(a), a]));
  let itemCount = 0;
  let overdueCount = 0;
  let noRecipients = false;

  const writeProgress = async (extra = {}) => {
    const counts = countAttempts([...attemptsByKey.values()]);
    await logRef.update({
      attempts: [...attemptsByKey.values()], ...counts, itemCount, overdueCount, updatedAt: new Date(), ...extra,
    });
    return counts;
  };

  const finish = async (status) => {
    const counts = await writeProgress({ status, leaseUntil: null, lastError: null, noRecipients });
    return runResult(status, { ...counts, itemCount, noRecipients });
  };

  // 略過紀錄（channel 為 null）會重新判定；重新判定前發生例外時保留上一次的結果
  const clearSkipRecords = () => {
    attemptsByKey.forEach((attempt, key) => {
      if (!attempt.channel) attemptsByKey.delete(key);
    });
  };

  // 上次失敗、這次已不需要發送的項目（已標記已繳、改了設定等）不再算失敗
  const retireStaleFailures = (plannedKeys) => {
    attemptsByKey.forEach((attempt, key) => {
      if (attempt.status === 'failed' && !plannedKeys.has(key)) {
        attemptsByKey.set(key, { ...attempt, status: 'skipped', error: 'no-longer-applicable' });
      }
    });
  };

  try {
    if (await deps.isBlocked(projectId)) return await finish('blocked');

    const households = await deps.loadHouseholds(db, projectId);
    const items = collectReminderItems(households, settings, today);
    itemCount = items.length;
    overdueCount = summarizeItems(items).overdue;
    if (items.length === 0) {
      clearSkipRecords();
      retireStaleFailures(new Set());
      return await finish(hadAttempts ? 'done' : 'empty');
    }

    const salesKeys = new Set(items.flatMap(item => item.salesKeys));
    const context = await deps.loadRecipientContext(db, projectId, salesKeys);
    const { recipients, skipped } = resolveRecipients({ settings, salesKeys, ...context });

    clearSkipRecords();
    skipped.forEach(person => {
      const attempt = {
        userKey: person.userKey, name: person.name, role: person.role, channel: null, fallbackFrom: null, status: 'skipped', error: person.reason,
      };
      attemptsByKey.set(attemptKey(attempt), attempt);
    });
    noUserKeyAttempts(items, settings).forEach(attempt => attemptsByKey.set(attemptKey(attempt), attempt));

    const targets = recipients
      .map(recipient => ({ recipient, personalItems: itemsForRecipient(items, recipient) }))
      .filter(target => target.personalItems.length > 0);
    // 重試時本輪沒有對象，但上一輪已送出過的，不算沒有收件人
    noRecipients = targets.length === 0 && ![...attemptsByKey.values()].some(attempt => attempt.status === 'sent');

    const plannedKeys = new Set();
    const send = targets.length > 0
      ? await deps.createSender({ db, projectId, projectName: projectData?.name || projectId })
      : null;

    for (const { recipient, personalItems } of targets) {
      const base = { userKey: recipient.userKey, name: recipient.name, role: recipient.role };
      const { deliveries, skipReason } = planDeliveries(recipient.channels, recipient);
      if (skipReason) {
        const attempt = { ...base, channel: null, fallbackFrom: null, status: 'skipped', error: skipReason };
        attemptsByKey.set(attemptKey(attempt), attempt);
      }

      for (const delivery of deliveries) {
        const key = attemptKey({ ...base, channel: delivery.channel });
        plannedKeys.add(key);
        if (attemptsByKey.get(key)?.status === 'sent') continue;
        const attempt = { ...base, channel: delivery.channel, fallbackFrom: delivery.fallbackFrom, status: 'sent', error: null };
        try {
          await send({
            channel: delivery.channel,
            contact: recipient,
            items: personalItems,
            // 含建案代號：同一人同一天可能收到多個建案的提醒，金鑰不可相同
            retryKey: lineRetryKey(`${projectId}:${logId}:${recipient.userKey}`),
          });
        } catch (error) {
          attempt.status = 'failed';
          attempt.error = errorText(error);
          console.error(`[paymentDueReminder] ${projectId} 發送失敗 ${recipient.userKey}/${delivery.channel}:`, attempt.error);
        }
        attemptsByKey.set(key, attempt);
      }

      try {
        await writeProgress();
      } catch (error) {
        console.warn(`[paymentDueReminder] ${projectId} 更新通知紀錄失敗:`, error.message);
      }
    }

    retireStaleFailures(plannedKeys);
    const { failed } = countAttempts([...attemptsByKey.values()]);
    return await finish(failed > 0 ? 'partial' : 'done');
  } catch (error) {
    const lastError = errorText(error);
    console.error(`[paymentDueReminder] ${projectId} 執行失敗:`, lastError);
    let counts = countAttempts([...attemptsByKey.values()]);
    try {
      counts = await writeProgress({ status: 'partial', leaseUntil: null, lastError });
    } catch (writeError) {
      console.error(`[paymentDueReminder] ${projectId} 寫入失敗狀態失敗:`, writeError.message);
    }
    return runResult('partial', { ...counts, itemCount, lastError });
  }
}

async function runScheduledReminders({ db, now = new Date(), deps = defaultDeps }) {
  const snap = await db.collection('projects').where('paymentReminderSettings.enabled', '==', true).get();
  const hour = taipeiHour(now);
  const results = [];
  for (const doc of snap.docs) {
    const projectData = doc.data() || {};
    const { sendHour } = normalizePaymentReminderSettings(projectData.paymentReminderSettings);
    if (!isWithinSendWindow(sendHour, hour)) continue;
    try {
      results.push({ projectId: doc.id, ...await runProjectReminder({ db, projectId: doc.id, projectData, now, deps }) });
    } catch (error) {
      console.error(`[paymentDueReminder] ${doc.id} 執行失敗:`, error);
    }
  }
  return results;
}

async function getProjectAccess(db, userKey, projectId) {
  const key = String(userKey || '');
  if (!key) throw new HttpsError('unauthenticated', '缺少使用者識別 (userKey)。');
  const [userSnap, permissionSnap] = await Promise.all([
    db.collection('users').doc(key).get(),
    db.collection('userPermissions').doc(key).get(),
  ]);
  if (!userSnap.exists) throw new HttpsError('permission-denied', '找不到對應使用者資料。');
  const contact = toContact(key, userSnap.data() || {});
  const isAdmin = isAdminUser(contact);
  const systems = permissionSnap.exists ? (permissionSnap.data()?.permissions?.[projectId]?.systems || []) : [];
  const canManage = isAdmin || systems.includes(MANAGE_SYSTEM);
  return { ...contact, isAdmin, canManage, canView: canManage || systems.includes(QUOTE_SYSTEM) };
}

function requireManage(access) {
  if (!access.canManage) throw new HttpsError('permission-denied', '您沒有此建案的「銷控系統」權限。');
}

async function handleListDue({ db, projectId, access, now = new Date(), deps = defaultDeps }) {
  if (!access.canView) throw new HttpsError('permission-denied', '您沒有此建案的繳款到期清單權限。');
  const today = taipeiToday(now);
  const households = await deps.loadHouseholds(db, projectId);
  const planned = collectPlannedItems(households, today)
    .filter(item => access.canManage || item.salesKeys.includes(access.userKey));

  const unitIds = new Set(planned.map(item => item.unitId));
  const units = {};
  households.filter(household => unitIds.has(household.unitId)).forEach(household => {
    units[household.unitId] = {
      paymentRecords: Array.isArray(household.paymentRecords) ? household.paymentRecords : [],
      driveFolderUrl: household.driveFolderUrl || '',
      buyerName: household.buyerName ? String(household.buyerName) : '',
      buyerPhone: household.buyerPhone ? String(household.buyerPhone) : '',
    };
  });

  const items = planned.map(({ salesKeys, ...item }) => ({ ...item, mine: salesKeys.includes(access.userKey) }));
  return { status: 'success', canManage: access.canManage, today, items, units };
}

function validateBatchInput({ expectedDate, entries }) {
  if (!isValidYmd(expectedDate)) throw new HttpsError('invalid-argument', '預計繳款日格式必須為 YYYY-MM-DD。');
  if (!Array.isArray(entries) || entries.length === 0) throw new HttpsError('invalid-argument', '請至少選擇一戶。');
  if (entries.length > MAX_BATCH_ENTRIES) throw new HttpsError('invalid-argument', `一次最多新增 ${MAX_BATCH_ENTRIES} 戶。`);
  entries.forEach(entry => {
    if (!entry?.unitId) throw new HttpsError('invalid-argument', '戶別資料不完整。');
    const amount = entry.expectedAmount;
    if (amount !== null && amount !== undefined && (!Number.isInteger(Number(amount)) || Number(amount) <= 0)) {
      throw new HttpsError('invalid-argument', `戶別 ${entry.unitId} 的預計金額必須為大於 0 的整數（元）。`);
    }
  });
}

async function addBatchPlan({ db, projectId, unitId, expectedDate, expectedAmount, note, nowIso, skipBatchId }) {
  const docRef = db.collection('salesHouseholds').doc(`${projectId}_${unitId}`);
  return db.runTransaction(async tx => {
    const snap = await tx.get(docRef);
    if (!snap.exists) return 'not-found';
    const existing = Array.isArray(snap.data().paymentRecords) ? snap.data().paymentRecords : [];
    const duplicated = existing.some(r => r && r.expectedDate === expectedDate && String(r.note || '').trim() === note);
    if (duplicated) return 'exists';
    tx.update(docRef, {
      paymentRecords: [...existing, {
        id: `pr_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        expectedDate,
        expectedAmount,
        planSource: 'batch',
        date: '',
        amount: null,
        note,
        file: null,
        paidAt: null,
        paidBy: null,
        createdAt: nowIso,
        updatedAt: nowIso,
      }],
      ...(skipBatchId ? { [SHEET_SYNC_SKIP_FIELD]: skipBatchId } : {}),
    });
    return 'added';
  });
}

// 逐戶交易：單戶失敗不影響其他戶；重新送出時已新增的戶別會以 exists 略過
async function handleBatchAddPlans({ db, projectId, access, expectedDate, note, entries, now = new Date(), deps = defaultDeps }) {
  requireManage(access);
  validateBatchInput({ expectedDate, entries });

  // 有設定 Sheet 同步的建案才需要略過逐戶同步，並在結束時全量同步一次
  const projectSnap = await db.collection('projects').doc(projectId).get();
  const { salesSheetId, salesSheetTabName } = projectSnap.data() || {};
  const skipBatchId = salesSheetId && salesSheetTabName ? newSheetSyncBatchId(now) : null;

  const noteText = String(note || '').trim();
  const nowIso = now.toISOString();
  const skipped = [];
  const seen = new Set();
  const unique = [];
  entries.forEach(entry => {
    const unitId = String(entry.unitId);
    if (seen.has(unitId)) {
      skipped.push({ unitId, reason: 'exists' });
      return;
    }
    seen.add(unitId);
    unique.push({ unitId, expectedAmount: entry.expectedAmount == null ? null : Number(entry.expectedAmount) });
  });

  const added = [];
  const failed = [];
  for (let i = 0; i < unique.length; i += BATCH_CONCURRENCY) {
    const chunk = unique.slice(i, i + BATCH_CONCURRENCY);
    const results = await Promise.allSettled(chunk.map(entry => addBatchPlan({
      db, projectId, unitId: entry.unitId, expectedDate, expectedAmount: entry.expectedAmount, note: noteText, nowIso, skipBatchId,
    })));
    results.forEach((result, index) => {
      const { unitId } = chunk[index];
      if (result.status === 'rejected') {
        failed.push({ unitId, reason: errorText(result.reason) });
        console.error(`[paymentReminderApi] 批次新增 ${projectId}/${unitId} 失敗:`, result.reason);
      } else if (result.value === 'added') {
        added.push(unitId);
      } else {
        skipped.push({ unitId, reason: result.value });
      }
    });
  }

  const result = { status: 'success', added, skipped, failed };
  if (skipBatchId && added.length > 0) {
    try {
      await deps.syncSalesSheet({ db, projectId, spreadsheetId: salesSheetId, sheetName: salesSheetTabName });
    } catch (error) {
      console.error(`[paymentReminderApi] ${projectId} 批次新增後同步 Sheet 失敗:`, error);
      result.sheetSyncWarning = `預計繳款已新增，但 Sheet 同步失敗，請至建案設定手動同步（${errorText(error)}）`;
    }
  }
  return result;
}

async function handlePreviewRecipients({ db, projectId, access, settings: rawSettings, now = new Date(), deps = defaultDeps }) {
  requireManage(access);
  let source = rawSettings;
  if (!source) {
    const projectSnap = await db.collection('projects').doc(projectId).get();
    source = projectSnap.data()?.paymentReminderSettings;
  }
  const settings = normalizePaymentReminderSettings(source);
  const excluded = new Set(settings.managers.excludedUserKeys);

  const households = await deps.loadHouseholds(db, projectId);
  const salesKeys = new Set(collectPlannedItems(households, taipeiToday(now)).flatMap(item => item.salesKeys));
  const context = await deps.loadRecipientContext(db, projectId, salesKeys);

  const reachability = contact => ({ hasLine: !!contact?.lineId, hasEmail: !!contact?.email });
  const managers = [...context.managerKeys]
    .map(key => context.contacts.get(key))
    .filter(contact => contact && !isAdminUser(contact))
    .map(contact => ({ userKey: contact.userKey, name: contact.name, ...reachability(contact), excluded: excluded.has(contact.userKey) }));
  const salespersons = [...salesKeys].map(key => {
    const contact = context.contacts.get(key);
    return {
      userKey: key,
      name: contact?.name || key,
      ...reachability(contact),
      hasPermission: !!contact && hasSalesPermission(context.permissions.get(key), contact),
    };
  });

  const { recipients } = resolveRecipients({ settings, salesKeys, ...context });
  return { status: 'success', managers, salespersons, summary: summarizeRecipientReach(recipients) };
}

// 測試通知只寄給操作者，內容一律是假資料，不含真實買方
function sampleItems(today) {
  return [{
    unitId: 'A1',
    recordId: 'sample',
    expectedDate: today,
    expectedAmount: 300000,
    note: '第 3 期工程款',
    state: 'today',
    daysLeft: 0,
    label: '今天到期',
    buyerName: '範例買方',
    buyerPhone: '0900000000',
    salesperson: [],
    salesKeys: [],
    mine: false,
  }];
}

async function handleSendTest({ db, projectId, projectName, access, channels, now = new Date(), deps = defaultDeps }) {
  requireManage(access);
  const list = Array.isArray(channels) ? ['email', 'line'].filter(channel => channels.includes(channel)) : [];
  if (list.length === 0) throw new HttpsError('invalid-argument', '請選擇 Email 或 LINE。');
  if (await deps.isBlocked(projectId)) return { status: 'success', blocked: true };

  const items = sampleItems(taipeiToday(now));
  const send = await deps.createSender({ db, projectId, projectName });
  const results = [];
  for (const channel of list) {
    try {
      await send({ channel, contact: access, items, isTest: true });
      results.push({ channel, status: 'sent' });
    } catch (error) {
      results.push({ channel, status: 'failed', error: errorText(error) });
    }
  }

  const attempts = results.map(result => ({
    userKey: access.userKey,
    name: access.name,
    role: 'test',
    channel: result.channel,
    fallbackFrom: null,
    status: result.status,
    error: result.error || null,
  }));
  const counts = countAttempts(attempts);
  try {
    await db.collection('projects').doc(projectId).collection('notificationLogs').add({
      type: 'paymentDueTest',
      date: taipeiToday(now),
      trigger: 'manual',
      status: counts.failed > 0 ? 'partial' : 'done',
      itemCount: items.length,
      overdueCount: 0,
      attempts,
      ...counts,
      createdAt: now,
      updatedAt: now,
    });
  } catch (error) {
    console.warn(`[paymentReminderApi] ${projectId} 寫入測試通知紀錄失敗:`, error.message);
  }
  return { status: 'success', attempts: results };
}

// type 與 createdAt 一起查需要複合索引；每個建案一天最多一筆，改成讀回後在記憶體排序
async function handleListLogs({ db, projectId, access, limit, now = new Date() }) {
  requireManage(access);
  const size = Math.min(Number.isInteger(Number(limit)) && Number(limit) > 0 ? Number(limit) : MAX_LOGS, MAX_LOGS);
  const snap = await db.collection('projects').doc(projectId).collection('notificationLogs')
    .where('type', 'in', LOG_TYPES)
    .get();
  const logs = snap.docs
    .map(doc => {
      const data = doc.data() || {};
      // 執行中程序被終止時紀錄會停在 running；租約過期就不是真的還在發送，只調整回傳，不寫回資料庫
      const interrupted = data.status === 'running' && toMillis(data.leaseUntil) <= now.getTime();
      return {
        id: doc.id,
        type: data.type,
        date: data.date || '',
        trigger: data.trigger || '',
        status: interrupted ? 'partial' : (data.status || ''),
        itemCount: data.itemCount || 0,
        overdueCount: data.overdueCount || 0,
        sent: data.sent || 0,
        failed: data.failed || 0,
        skipped: data.skipped || 0,
        noRecipients: data.noRecipients === true,
        lastError: data.lastError || (interrupted ? RUN_INTERRUPTED_MESSAGE : null),
        attempts: Array.isArray(data.attempts) ? data.attempts : [],
        createdAt: toIso(data.createdAt),
      };
    })
    .sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)))
    .slice(0, size);
  return { status: 'success', logs };
}

async function handleRunNow({ db, projectId, access, now = new Date(), deps = defaultDeps }) {
  if (!access.isAdmin) throw new HttpsError('permission-denied', '僅限系統／超級管理員立即執行。');
  const projectSnap = await db.collection('projects').doc(projectId).get();
  if (!projectSnap.exists) throw new HttpsError('not-found', '找不到此建案。');
  const projectData = projectSnap.data() || {};
  if (projectData.paymentReminderSettings?.enabled !== true) {
    throw new HttpsError('failed-precondition', '此建案尚未啟用繳款提醒。');
  }
  // 已啟用時不受發送時段限制，但同樣受當日防重複鎖保護
  const result = await runProjectReminder({
    db, projectId, projectData, now, trigger: 'manual', deps,
  });
  return { status: 'success', result };
}

const paymentDueReminder = onSchedule({
  schedule: '0 * * * *',
  timeZone: 'Asia/Taipei',
  region: 'asia-east1',
  memory: '512MiB',
  timeoutSeconds: 540,
  secrets: SECRETS,
}, async () => {
  const db = new Firestore({ databaseId: 'anxi-app' });
  const results = await runScheduledReminders({ db });
  console.log('[paymentDueReminder] 完成:', JSON.stringify(results));
});

const paymentReminderApi = onCall({
  region: 'asia-east1',
  memory: '512MiB',
  timeoutSeconds: 300,
  cors: true,
  secrets: SECRETS,
}, async (request) => {
  const data = request.data || {};
  const { action, projectId, userKey } = data;
  if (!projectId) throw new HttpsError('invalid-argument', '缺少必要參數 (projectId)。');

  const db = new Firestore({ databaseId: 'anxi-app' });
  try {
    const access = await getProjectAccess(db, userKey, projectId);
    switch (action) {
      case 'listDue':
        return await handleListDue({ db, projectId, access });
      case 'batchAddPlans':
        return await handleBatchAddPlans({
          db, projectId, access, expectedDate: data.expectedDate, note: data.note, entries: data.entries,
        });
      case 'previewRecipients':
        return await handlePreviewRecipients({ db, projectId, access, settings: data.settings });
      case 'sendTest': {
        const projectSnap = await db.collection('projects').doc(projectId).get();
        return await handleSendTest({
          db, projectId, projectName: projectSnap.data()?.name || projectId, access, channels: data.channels,
        });
      }
      case 'listLogs':
        return await handleListLogs({ db, projectId, access, limit: data.limit });
      case 'runNow':
        return await handleRunNow({ db, projectId, access });
      default:
        throw new HttpsError('invalid-argument', `未知的 action: ${action}`);
    }
  } catch (error) {
    if (error instanceof HttpsError) throw error;
    console.error(`[paymentReminderApi] ${action} 失敗:`, error);
    throw new HttpsError('internal', `處理繳款到期資料時發生錯誤: ${error.message}`);
  }
});

module.exports = {
  init,
  paymentDueReminder,
  paymentReminderApi,
  LEASE_MS,
  RUN_INTERRUPTED_MESSAGE,
  isValidDocumentId,
  fetchByDocumentIds,
  loadHouseholds,
  loadRecipientContext,
  createDigestSender,
  taipeiHour,
  isWithinSendWindow,
  runLogId,
  isHouseholdEligible,
  collectPlannedItems,
  collectReminderItems,
  resolveRecipients,
  planDeliveries,
  itemsForRecipient,
  summarizeRecipientReach,
  acquireRunLease,
  runProjectReminder,
  runScheduledReminders,
  getProjectAccess,
  handleListDue,
  handleBatchAddPlans,
  handlePreviewRecipients,
  handleSendTest,
  handleListLogs,
  handleRunNow,
};
