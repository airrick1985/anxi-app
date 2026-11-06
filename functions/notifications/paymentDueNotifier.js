// 繳款到期通知：LINE Flex／Email 彙整訊息組裝與寄送，規格：docs/SPEC_PaymentDueReminder.md §5.4、§5.5
//
// altText 會出現在手機通知預覽、Email 主旨會出現在收件匣，這兩處都不放買方資料。

const crypto = require('crypto');
const axios = require('axios');
const nodemailer = require('nodemailer');
const { formatMonthDay } = require('../utils/paymentRecordStatus');

const LINE_PUSH_URL = 'https://api.line.me/v2/bot/message/push';
// 客資系統入口與洽談紀錄共用的 LIFF（src/utils/liffApps.js 的 customerManagement）
const CUSTOMER_MANAGEMENT_LIFF_ID = '2008257338-n5Gp6pT3';
const WEB_ORIGIN = 'https://anxismart.com';

const MAX_FLEX_ITEMS = 10;
const MAX_NOTE_LENGTH = 40;
const MAX_BUYER_LENGTH = 30;
const MAX_UNIT_LENGTH = 30;
const MAX_PROJECT_NAME_LENGTH = 60;
const MAX_ALT_TEXT_LENGTH = 400;
const MAX_LINE_RETRIES = 3;
const MAIL_TIMEOUT_MS = 20000;

const COLOR_OVERDUE = '#d62d20';
const COLOR_SOON = '#c27400';
const COLOR_NORMAL = '#0071e3';
const COLOR_MUTED = '#6e6e73';

const STATE_COLORS = { overdue: COLOR_OVERDUE, today: COLOR_SOON, soon: COLOR_SOON, upcoming: COLOR_MUTED };

// 目標放 query，參數名對應 src/utils/liffApps.js。不可用 liff.line.me/{ID}/路徑：
// LIFF SDK 會轉成 anxismart.com/路徑，GitHub Pages 沒有 SPA rewrite 會 404
function lineDueUrl(projectId) {
  return `https://liff.line.me/${CUSTOMER_MANAGEMENT_LIFF_ID}?paymentDueProjectId=${encodeURIComponent(projectId)}`;
}

function emailDueUrl(projectId) {
  return `${WEB_ORIGIN}/#/payment-due-entry/${encodeURIComponent(projectId)}`;
}

function clip(value, max) {
  const text = String(value ?? '').trim();
  return text.length > max ? `${text.slice(0, max)}…` : text;
}

function formatAmount(value) {
  const n = Number(value);
  return n > 0 ? `${n.toLocaleString('en-US')} 元` : '金額未填';
}

// 依固定內容算出 UUID 格式的 LINE 重試金鑰：回應逾時但其實已送達時，重送會收到 409 而不會重複推播
function lineRetryKey(seed) {
  const hex = crypto.createHash('sha256').update(String(seed)).digest('hex');
  const variant = (8 + (parseInt(hex[16], 16) % 4)).toString(16);
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-5${hex.slice(13, 16)}-${variant}${hex.slice(17, 20)}-${hex.slice(20, 32)}`;
}

function telUri(phone) {
  const digits = String(phone ?? '').replace(/[\s()-]/g, '');
  return /^\+?\d{6,15}$/.test(digits) ? `tel:${digits}` : '';
}

function summarizeItems(items) {
  const count = state => items.filter(item => item.state === state).length;
  const overdue = count('overdue');
  const today = count('today');
  return { total: items.length, overdue, today, upcoming: items.length - overdue - today };
}

function summaryText({ overdue, today, upcoming }) {
  return `逾期 ${overdue} 筆・今天 ${today} 筆・即將到期 ${upcoming} 筆`;
}

function digestTitle(projectName, isTest) {
  return `[${projectName}] 繳款提醒${isTest ? '（測試）' : ''}`;
}

function buildFlexItem(item) {
  const buyer = [clip(item.buyerName, MAX_BUYER_LENGTH) || '買方未填', clip(item.buyerPhone, MAX_BUYER_LENGTH)]
    .filter(Boolean)
    .join('　');
  const tel = telUri(item.buyerPhone);
  const buyerText = { type: 'text', text: buyer, size: 'sm', color: '#1d1d1f', wrap: true };
  if (tel) buyerText.action = { type: 'uri', label: '撥打電話', uri: tel };

  return {
    type: 'box',
    layout: 'vertical',
    margin: 'md',
    spacing: 'xs',
    contents: [
      {
        type: 'box',
        layout: 'baseline',
        contents: [
          { type: 'text', text: `${clip(item.unitId, MAX_UNIT_LENGTH)}${item.mine ? '（我的）' : ''}`, weight: 'bold', size: 'md', color: '#1d1d1f', flex: 3, wrap: true },
          { type: 'text', text: item.label, weight: 'bold', size: 'sm', color: STATE_COLORS[item.state] || COLOR_MUTED, flex: 2, align: 'end', wrap: true },
        ],
      },
      { type: 'text', text: clip(item.note, MAX_NOTE_LENGTH) || '未填期別', size: 'sm', color: '#1d1d1f', wrap: true },
      { type: 'text', text: `預計 ${formatMonthDay(item.expectedDate)}・${formatAmount(item.expectedAmount)}`, size: 'sm', color: COLOR_MUTED, wrap: true },
      buyerText,
    ],
  };
}

function buildLineFlex({ projectId, projectName, items, isTest = false }) {
  const summary = summarizeItems(items);
  const shown = items.slice(0, MAX_FLEX_ITEMS);
  const hidden = items.length - shown.length;
  const title = digestTitle(clip(projectName, MAX_PROJECT_NAME_LENGTH), isTest);

  const bodyContents = [
    { type: 'text', text: summaryText(summary), size: 'sm', weight: 'bold', color: '#1d1d1f', wrap: true },
  ];
  shown.forEach(item => {
    bodyContents.push({ type: 'separator', margin: 'md' }, buildFlexItem(item));
  });
  if (hidden > 0) {
    bodyContents.push(
      { type: 'separator', margin: 'md' },
      { type: 'text', text: `另有 ${hidden} 筆，請查看到期清單`, size: 'sm', color: COLOR_MUTED, margin: 'md', wrap: true },
    );
  }

  return {
    type: 'flex',
    altText: clip(`${title}：共 ${summary.total} 筆（逾期 ${summary.overdue} 筆）`, MAX_ALT_TEXT_LENGTH - 1),
    contents: {
      type: 'bubble',
      header: {
        type: 'box',
        layout: 'vertical',
        backgroundColor: summary.overdue > 0 ? COLOR_OVERDUE : COLOR_NORMAL,
        contents: [{ type: 'text', text: title, weight: 'bold', color: '#ffffff', size: 'md', wrap: true }],
      },
      body: { type: 'box', layout: 'vertical', contents: bodyContents },
      footer: {
        type: 'box',
        layout: 'vertical',
        contents: [{
          type: 'button',
          style: 'primary',
          height: 'sm',
          color: COLOR_NORMAL,
          action: { type: 'uri', label: '查看到期清單', uri: lineDueUrl(projectId) },
        }],
      },
    },
  };
}

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function buildEmailSubject({ projectName, items, isTest = false }) {
  const { total, overdue } = summarizeItems(items);
  const overdueText = overdue > 0 ? `（逾期 ${overdue} 筆）` : '';
  return `[${projectName}] 繳款到期提醒 ${total} 筆${overdueText}${isTest ? '（測試）' : ''}`;
}

function buildEmailRow(item) {
  const color = STATE_COLORS[item.state] || COLOR_MUTED;
  const tel = telUri(item.buyerPhone);
  const phone = item.buyerPhone
    ? (tel ? `<a href="${escapeHtml(tel)}" style="color:#0071e3;text-decoration:none;">${escapeHtml(item.buyerPhone)}</a>` : escapeHtml(item.buyerPhone))
    : '—';
  const cell = 'padding:8px 6px;border-bottom:1px solid #eeeeee;vertical-align:top;';
  return `<tr>
    <td style="${cell}color:${color};font-weight:600;white-space:nowrap;">${escapeHtml(item.label)}</td>
    <td style="${cell}font-weight:600;white-space:nowrap;">${escapeHtml(item.unitId)}${item.mine ? '<span style="color:#0071e3;font-weight:500;">（我的）</span>' : ''}</td>
    <td style="${cell}">${escapeHtml(item.note) || '未填期別'}</td>
    <td style="${cell}white-space:nowrap;">${escapeHtml(formatMonthDay(item.expectedDate))}</td>
    <td style="${cell}text-align:right;white-space:nowrap;">${escapeHtml(formatAmount(item.expectedAmount))}</td>
    <td style="${cell}">${escapeHtml(item.buyerName) || '—'}</td>
    <td style="${cell}white-space:nowrap;">${phone}</td>
  </tr>`;
}

function buildEmailHtml({ projectId, projectName, items, isTest = false }) {
  const summary = summarizeItems(items);
  const title = escapeHtml(digestTitle(projectName, isTest));
  const headColor = summary.overdue > 0 ? COLOR_OVERDUE : COLOR_NORMAL;
  const th = 'padding:8px 6px;text-align:left;font-weight:600;color:#6e6e73;border-bottom:2px solid #d9d9de;white-space:nowrap;';

  return `<!doctype html><html><body style="margin:0;background:#f5f5f7;font-family:-apple-system,'Segoe UI',Roboto,'Microsoft JhengHei',sans-serif;color:#1d1d1f;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f7;padding:24px 0;">
  <tr><td align="center">
    <table role="presentation" width="720" cellpadding="0" cellspacing="0" style="max-width:720px;width:100%;background:#ffffff;border-radius:10px;overflow:hidden;">
      <tr><td style="background:${headColor};color:#ffffff;padding:16px 24px;font-weight:700;font-size:16px;">${title}</td></tr>
      <tr><td style="padding:16px 24px 8px;font-size:14px;font-weight:600;">${escapeHtml(summaryText(summary))}</td></tr>
      <tr><td style="padding:0 24px 16px;">
        <div style="overflow-x:auto;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;font-size:13px;">
            <thead><tr>
              <th style="${th}">狀態</th><th style="${th}">戶別</th><th style="${th}">期別</th><th style="${th}">預計日</th>
              <th style="${th}text-align:right;">金額</th><th style="${th}">買方</th><th style="${th}">電話</th>
            </tr></thead>
            <tbody>${items.map(buildEmailRow).join('')}</tbody>
          </table>
        </div>
      </td></tr>
      <tr><td align="center" style="padding:8px 24px 24px;">
        <a href="${escapeHtml(emailDueUrl(projectId))}" style="display:inline-block;padding:10px 22px;background:#0071e3;color:#ffffff;text-decoration:none;border-radius:8px;font-weight:600;font-size:14px;">查看到期清單</a>
      </td></tr>
      <tr><td style="background:#fafafa;padding:12px 24px;color:#8e8e93;font-size:12px;text-align:center;">本郵件由系統自動發送，請勿直接回覆</td></tr>
    </table>
  </td></tr>
</table>
</body></html>`;
}

const defaultSleep = ms => new Promise(resolve => setTimeout(resolve, ms));

async function pushLine(token, to, message, { retryKey, sleep = defaultSleep } = {}) {
  const headers = { Authorization: `Bearer ${token}` };
  if (retryKey) headers['X-Line-Retry-Key'] = retryKey;
  for (let attempt = 1; ; attempt += 1) {
    try {
      return await axios.post(LINE_PUSH_URL, { to, messages: [message] }, { headers, timeout: 10000 });
    } catch (error) {
      const status = error.response?.status;
      // 409：同一把金鑰先前已被接受，代表訊息已送達
      if (status === 409 && retryKey) return error.response;
      if (status !== 429 || attempt >= MAX_LINE_RETRIES) throw error;
      await sleep(1000 * attempt);
    }
  }
}

function buildTransporter() {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: { user: process.env.SENDER_EMAIL, pass: process.env.GMAIL_APP_PASSWORD },
    connectionTimeout: MAIL_TIMEOUT_MS,
    greetingTimeout: MAIL_TIMEOUT_MS,
    socketTimeout: MAIL_TIMEOUT_MS,
  });
}

/**
 * 寄出一則彙整訊息；失敗時丟出錯誤，由呼叫端記錄到通知紀錄。
 * @param {object} params
 * @param {'line'|'email'} params.channel
 * @param {{ lineId?: string, email?: string }} params.contact
 * @param {string} params.projectId
 * @param {string} params.projectName
 * @param {Array<object>} params.items
 * @param {boolean} [params.isTest]
 * @param {string} [params.lineToken]
 * @param {string} [params.retryKey] LINE 重試金鑰；測試通知不帶，每次都要實際送出
 * @param {object} [params.transporter] nodemailer transporter
 * @param {Function} [params.push] 測試時替換 LINE 推播
 */
async function sendDigest({
  channel, contact, projectId, projectName, items, isTest = false, lineToken, retryKey, transporter, push = pushLine,
}) {
  if (channel === 'line') {
    if (!lineToken) throw new Error('missing-line-token');
    if (!contact?.lineId) throw new Error('no-line-id');
    await push(lineToken, contact.lineId, buildLineFlex({ projectId, projectName, items, isTest }), { retryKey });
    return;
  }
  if (channel === 'email') {
    if (!contact?.email) throw new Error('no-email');
    await transporter.sendMail({
      from: `"安熙智慧建案管理系統" <${process.env.SENDER_EMAIL}>`,
      to: contact.email,
      subject: buildEmailSubject({ projectName, items, isTest }),
      html: buildEmailHtml({ projectId, projectName, items, isTest }),
    });
    return;
  }
  throw new Error('unknown-channel');
}

module.exports = {
  MAX_FLEX_ITEMS,
  MAIL_TIMEOUT_MS,
  lineRetryKey,
  pushLine,
  lineDueUrl,
  emailDueUrl,
  summarizeItems,
  buildLineFlex,
  buildEmailSubject,
  buildEmailHtml,
  buildTransporter,
  sendDigest,
};
