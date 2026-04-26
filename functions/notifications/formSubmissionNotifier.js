// 自訂表單提交通知：LINE Flex / Email HTML 組裝與寄送
//
// 對外 API:
//   sendFormSubmissionNotifications(params) → { sent, failed, attempts }
//   buildLineFlex(params) / buildEmailHtml(params) (純函式)

const axios = require('axios');
const nodemailer = require('nodemailer');
const { Firestore, FieldPath } = require('@google-cloud/firestore');

const LINE_PUSH_URL = 'https://api.line.me/v2/bot/message/push';
const PUBLIC_HOST = 'https://anxismart.com';
const HEADER_COLOR = '#1A237E';

function formatTimestamp(d) {
  const date = d instanceof Date ? d : (d && typeof d.toDate === 'function' ? d.toDate() : new Date());
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Taipei',
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', hour12: false,
  }).formatToParts(date);
  const get = (type) => parts.find(p => p.type === type)?.value || '';
  return `${get('year')}/${get('month')}/${get('day')} ${get('hour')}:${get('minute')}`;
}

function safeText(v, fallback = '') {
  if (v === null || v === undefined) return fallback;
  return String(v);
}

function buildViewUrl(submissionId) {
  return `${PUBLIC_HOST}/#/form-view/${encodeURIComponent(submissionId)}`;
}

function buildLineFlex({ projectName, formTitle, unitId, buyerName, buyerPhone, timestampText, viewUrl }) {
  const submitter = [safeText(buyerName).trim(), safeText(buyerPhone).trim()].filter(Boolean).join(' ');
  const bodyContents = [
    {
      type: 'text',
      text: safeText(formTitle, '自訂表單'),
      weight: 'bold',
      size: 'lg',
      color: '#212121',
      wrap: true,
    },
    { type: 'separator', margin: 'md' },
  ];

  if (unitId) {
    bodyContents.push({
      type: 'text',
      text: `戶別：${unitId}`,
      weight: 'bold',
      size: 'md',
      color: HEADER_COLOR,
      margin: 'md',
    });
  }

  bodyContents.push(
    { type: 'text', text: `提交者：${submitter || '（未填）'}`, color: '#444444', size: 'sm', margin: 'sm', wrap: true },
    { type: 'text', text: `提交時間：${timestampText}`, color: '#666666', size: 'sm', margin: 'xs' },
  );

  return {
    type: 'flex',
    altText: `[${safeText(projectName, '建案')}] ${safeText(formTitle, '表單')} - 新表單提交`,
    contents: {
      type: 'bubble',
      header: {
        type: 'box',
        layout: 'vertical',
        backgroundColor: HEADER_COLOR,
        contents: [
          { type: 'text', text: `[${safeText(projectName, '建案')}] 表單通知`, weight: 'bold', color: '#FFFFFF', size: 'md' },
        ],
      },
      body: { type: 'box', layout: 'vertical', contents: bodyContents },
      footer: {
        type: 'box',
        layout: 'vertical',
        contents: [{
          type: 'button',
          style: 'primary',
          color: HEADER_COLOR,
          action: { type: 'uri', label: '查看 / 修改回覆', uri: viewUrl },
        }],
      },
    },
  };
}

function escapeHtml(s) {
  return String(s || '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function buildEmailHtml({ projectName, formTitle, unitId, buyerName, buyerPhone, timestampText, viewUrl }) {
  const submitter = [safeText(buyerName).trim(), safeText(buyerPhone).trim()].filter(Boolean).join(' ');
  const unitRow = unitId
    ? `<div style="font-size:16px;font-weight:bold;color:${HEADER_COLOR};margin-top:8px;">戶別：${escapeHtml(unitId)}</div>`
    : '';

  return `<!doctype html><html><body style="margin:0;background:#f5f5f5;font-family:-apple-system,'Segoe UI',Roboto,'Microsoft JhengHei',sans-serif;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f5;padding:24px 0;">
  <tr><td align="center">
    <table role="presentation" width="520" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,.1);">
      <tr><td style="background:${HEADER_COLOR};color:#fff;padding:16px 24px;font-weight:bold;font-size:16px;">
        [${escapeHtml(safeText(projectName, '建案'))}] 表單通知
      </td></tr>
      <tr><td style="padding:24px;">
        <div style="font-size:18px;font-weight:bold;color:#212121;">${escapeHtml(safeText(formTitle, '自訂表單'))}</div>
        ${unitRow}
        <div style="border-top:1px solid #eee;margin-top:16px;padding-top:14px;color:#666;font-size:13px;line-height:1.8;">
          提交者：${escapeHtml(submitter || '（未填）')}<br>
          提交時間：${escapeHtml(timestampText)}
        </div>
        <div style="margin-top:20px;text-align:center;">
          <a href="${escapeHtml(viewUrl)}" style="display:inline-block;background:${HEADER_COLOR};color:#fff;text-decoration:none;padding:10px 28px;border-radius:6px;font-weight:bold;font-size:14px;">查看 / 修改回覆</a>
        </div>
      </td></tr>
      <tr><td style="background:#fafafa;padding:12px 24px;color:#999;font-size:12px;text-align:center;">
        本郵件由系統自動發送，請勿直接回覆
      </td></tr>
    </table>
  </td></tr>
</table>
</body></html>`;
}

async function pushLine(token, to, flexMessage) {
  return axios.post(LINE_PUSH_URL, {
    to,
    messages: [flexMessage],
  }, {
    headers: { Authorization: `Bearer ${token}` },
    timeout: 10000,
  });
}

function buildTransporter() {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.SENDER_EMAIL,
      pass: process.env.GMAIL_APP_PASSWORD,
    },
  });
}

async function fetchUserContacts(db, userKeys) {
  if (!userKeys.length) return new Map();
  const map = new Map();
  for (let i = 0; i < userKeys.length; i += 30) {
    const chunk = userKeys.slice(i, i + 30);
    const snap = await db.collection('users')
      .where(FieldPath.documentId(), 'in', chunk)
      .get();
    snap.forEach(d => {
      const data = d.data() || {};
      const lineId = typeof data.lineId === 'string' ? data.lineId : '';
      const email = typeof data.email === 'string' ? data.email : '';
      map.set(d.id, {
        userKey: d.id,
        name: data.name || d.id,
        lineId: lineId.startsWith('U') ? lineId : null,
        email: email || null,
        roles: Array.isArray(data.roles) ? data.roles : [],
      });
    });
  }
  return map;
}

/**
 * 收集應通知的人員（合併銷控管理員 + 該戶銷售人員，套用抑制名單，去重）
 * @returns {Promise<Array<{userKey, name, lineId, email, source}>>}
 */
async function resolveRecipients({
  db, projectId, unitId,
  notifySalesAdmins, notifyUnitSalesPerson,
  excludedUserKeys,
}) {
  const ADMIN_ROLES = new Set(['系統管理員', '超級管理員']);
  const exclusionSet = new Set(excludedUserKeys || []);
  // userKey → source；同人多來源時 unitSalesPerson 優先
  const candidateKeys = new Set();
  const sourceByKey = new Map();

  if (notifySalesAdmins) {
    const permSnap = await db.collection('userPermissions')
      .where(`permissions.${projectId}.systems`, 'array-contains-any', ['銷控系統', '報價系統'])
      .get();
    permSnap.forEach(d => {
      const k = d.id;
      if (exclusionSet.has(k)) return;
      candidateKeys.add(k);
      if (!sourceByKey.has(k)) sourceByKey.set(k, 'salesAdmin');
    });
  }

  if (notifyUnitSalesPerson && unitId) {
    try {
      const householdDoc = await db.collection('salesHouseholds').doc(`${projectId}_${unitId}`).get();
      const salesKey = householdDoc.exists ? (householdDoc.data().salespersonUserKey || '') : '';
      if (salesKey && !exclusionSet.has(salesKey)) {
        candidateKeys.add(salesKey);
        sourceByKey.set(salesKey, 'unitSalesPerson');  // 覆蓋 salesAdmin 標記
      }
    } catch (e) {
      console.warn('[formSubmissionNotifier] 查詢戶別銷售人員失敗:', e.message);
    }
  }

  if (candidateKeys.size === 0) return [];

  const userMap = await fetchUserContacts(db, Array.from(candidateKeys));
  const result = [];
  for (const k of candidateKeys) {
    const u = userMap.get(k);
    if (!u) continue;
    if (Array.isArray(u.roles) && u.roles.some(r => ADMIN_ROLES.has(r))) continue;  // 排除系統/超級管理員
    result.push({ ...u, source: sourceByKey.get(k) });
  }
  return result;
}

/**
 * 寄送表單提交通知
 * @param {Object} params
 * @param {string} params.projectId
 * @param {string} params.projectName
 * @param {string} params.formId
 * @param {string} params.formTitle
 * @param {string} params.submissionId
 * @param {string|null} params.unitId
 * @param {string} params.buyerName
 * @param {string} params.buyerPhone
 * @param {Date|FirebaseTimestamp} params.submittedAt
 * @param {boolean} params.notifySalesAdmins
 * @param {boolean} params.notifyUnitSalesPerson
 * @param {string[]} params.excludedUserKeys
 * @param {Firestore} [params.dbInstance]
 * @returns {Promise<{ sent:number, failed:number, attempts:Array, recipients:Array }>}
 */
async function sendFormSubmissionNotifications(params) {
  const {
    projectId, projectName, formId, formTitle, submissionId,
    unitId, buyerName, buyerPhone, submittedAt,
    notifySalesAdmins, notifyUnitSalesPerson, excludedUserKeys,
    dbInstance,
  } = params;

  const db = dbInstance || new Firestore({ databaseId: 'anxi-app' });

  const recipients = await resolveRecipients({
    db, projectId, unitId: unitId || null,
    notifySalesAdmins, notifyUnitSalesPerson,
    excludedUserKeys: excludedUserKeys || [],
  });

  const timestampText = formatTimestamp(submittedAt);
  const viewUrl = buildViewUrl(submissionId);

  const flex = buildLineFlex({
    projectName, formTitle, unitId: unitId || null,
    buyerName, buyerPhone, timestampText, viewUrl,
  });
  const html = buildEmailHtml({
    projectName, formTitle, unitId: unitId || null,
    buyerName, buyerPhone, timestampText, viewUrl,
  });
  const subject = `[${safeText(projectName, '建案')}] ${safeText(formTitle, '表單')} - 新表單提交`;

  const lineToken = process.env.ANXISMART_LINE_CRM_TOKEN || '';
  let transporter = null;
  const attempts = [];

  for (const r of recipients) {
    let channel;
    if (r.lineId) channel = 'line';
    else if (r.email) channel = 'email';
    else {
      attempts.push({
        userKey: r.userKey, name: r.name, channel: 'none',
        success: false, error: 'no_contact', source: r.source,
      });
      continue;
    }

    if (channel === 'line') {
      if (!lineToken) {
        attempts.push({
          userKey: r.userKey, name: r.name, channel,
          success: false, error: 'missing-line-token', source: r.source,
        });
        continue;
      }
      try {
        await pushLine(lineToken, r.lineId, flex);
        attempts.push({
          userKey: r.userKey, name: r.name, channel,
          success: true, source: r.source,
        });
      } catch (e) {
        const msg = e.response?.data ? JSON.stringify(e.response.data) : (e.message || 'unknown');
        attempts.push({
          userKey: r.userKey, name: r.name, channel,
          success: false, error: msg, source: r.source,
        });
      }
    } else if (channel === 'email') {
      try {
        if (!transporter) transporter = buildTransporter();
        await transporter.sendMail({
          from: `"安熙智慧建案管理系統" <${process.env.SENDER_EMAIL}>`,
          to: r.email,
          subject,
          html,
        });
        attempts.push({
          userKey: r.userKey, name: r.name, channel,
          success: true, source: r.source,
        });
      } catch (e) {
        attempts.push({
          userKey: r.userKey, name: r.name, channel,
          success: false, error: e.message || 'unknown', source: r.source,
        });
      }
    }
  }

  const sent = attempts.filter(a => a.success).length;
  const failed = attempts.filter(a => !a.success).length;
  return { sent, failed, attempts, recipients };
}

module.exports = {
  buildLineFlex,
  buildEmailHtml,
  buildViewUrl,
  resolveRecipients,
  sendFormSubmissionNotifications,
};
