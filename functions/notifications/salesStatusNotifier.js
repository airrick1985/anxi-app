// 銷控狀態通知：LINE Flex / Email HTML 組裝與寄送
//
// 對外 API:
//   sendSalesStatusNotifications(params) → { sent, failed, attempts }
//   buildLineFlex(params) / buildEmailHtml(params) (純函式，便於測試與前端預覽)

const axios = require('axios');
const nodemailer = require('nodemailer');
const { STATUS_STYLE, classifySalesStatus } = require('../utils/salesStatusGroups');

const LINE_PUSH_URL = 'https://api.line.me/v2/bot/message/push';

function formatTimestamp(d = new Date()) {
  // ⚠️ 一律以台灣時間 (Asia/Taipei, UTC+8) 呈現。
  // Cloud Functions 預設時區為 UTC，直接用 getHours() 會比台灣慢 8 小時。
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Taipei',
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(d);
  const p = Object.fromEntries(parts.map(x => [x.type, x.value]));
  return `${p.year}/${p.month}/${p.day} ${p.hour}:${p.minute}`;
}

function safeText(v, fallback = '') {
  if (v === null || v === undefined) return fallback;
  return String(v);
}

function buildLineFlex({ projectName, unitId, oldStatus, newStatus, operatorName, statusClass, timestampText, customTag, remark }) {
  const style = STATUS_STYLE[statusClass] || STATUS_STYLE.neutral;
  const displayStatus = newStatus || '（已清空）';
  const ts = timestampText || formatTimestamp();
  // 自訂加註優先；若前端未提供則使用預設 STATUS_STYLE.tag
  const tagText = (typeof customTag === 'string') ? customTag.trim() : style.tag;

  const bodyContents = [
    {
      type: 'text',
      text: `建案：${safeText(projectName, '（未命名）')}`,
      weight: 'bold',
      size: 'md',
      color: style.color,
      wrap: true,
    },
    { type: 'text', text: `戶別：${safeText(unitId)}`, weight: 'bold', size: 'xl', margin: 'sm' },
    {
      type: 'text',
      text: `狀態：${displayStatus}`,
      weight: 'bold',
      size: 'lg',
      color: style.color,
      margin: 'md',
      wrap: true,
    },
  ];

  if (tagText) {
    bodyContents.push({
      type: 'text',
      text: `${style.emoji} ${tagText}`,
      color: style.color,
      size: 'sm',
      margin: 'sm',
      wrap: true,
    });
  }

  bodyContents.push(
    { type: 'separator', margin: 'md' },
    { type: 'text', text: `原狀態：${oldStatus || '（無）'}`, color: '#999999', size: 'xs', margin: 'md' },
    { type: 'text', text: `操作者：${safeText(operatorName, '系統')}`, color: '#666666', size: 'sm', margin: 'sm' },
    { type: 'text', text: `時間：${ts}`, color: '#666666', size: 'sm' },
  );

  if (remark && String(remark).trim()) {
    bodyContents.push(
      { type: 'separator', margin: 'md' },
      { type: 'text', text: '備註', color: '#999999', size: 'xs', margin: 'md' },
      { type: 'text', text: String(remark).trim(), color: '#212121', size: 'sm', wrap: true, margin: 'xs' },
    );
  }

  return {
    type: 'flex',
    altText: `[${projectName}] 銷控通知 - ${unitId} ${displayStatus}`,
    contents: {
      type: 'bubble',
      header: {
        type: 'box',
        layout: 'vertical',
        backgroundColor: style.color,
        contents: [
          { type: 'text', text: `[${safeText(projectName, '建案')}] 銷控通知`, weight: 'bold', color: '#FFFFFF', size: 'md' },
        ],
      },
      body: { type: 'box', layout: 'vertical', contents: bodyContents },
    },
  };
}

function escapeHtml(s) {
  return String(s || '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function buildEmailHtml({ projectName, unitId, oldStatus, newStatus, operatorName, statusClass, timestampText, customTag, remark }) {
  const style = STATUS_STYLE[statusClass] || STATUS_STYLE.neutral;
  const displayStatus = newStatus || '（已清空）';
  const ts = timestampText || formatTimestamp();
  const tagText = (typeof customTag === 'string') ? customTag.trim() : style.tag;
  const tagRow = tagText
    ? `<tr><td style="padding:8px 24px 16px;color:${style.color};font-size:14px;">${style.emoji} ${escapeHtml(tagText)}</td></tr>`
    : '';
  const remarkText = (remark && String(remark).trim()) ? String(remark).trim() : '';
  const remarkRow = remarkText
    ? `<tr><td style="border-top:1px dashed #eee;padding:14px 24px;color:#212121;font-size:13px;line-height:1.7;">
         <div style="color:#999;font-size:12px;margin-bottom:4px;">備註</div>
         ${escapeHtml(remarkText).replace(/\n/g, '<br>')}
       </td></tr>`
    : '';

  return `<!doctype html><html><body style="margin:0;background:#f5f5f5;font-family:-apple-system,'Segoe UI',Roboto,'Microsoft JhengHei',sans-serif;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f5;padding:24px 0;">
  <tr><td align="center">
    <table role="presentation" width="520" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,.1);">
      <tr><td style="background:${style.color};color:#fff;padding:16px 24px;font-weight:bold;font-size:16px;">
        [${escapeHtml(safeText(projectName, '建案'))}] 銷控通知
      </td></tr>
      <tr><td style="padding:24px 24px 8px;">
        <div style="font-size:15px;font-weight:bold;color:${style.color};">建案：${escapeHtml(safeText(projectName, '（未命名）'))}</div>
        <div style="font-size:20px;font-weight:bold;color:#212121;margin-top:6px;">戶別：${escapeHtml(safeText(unitId))}</div>
        <div style="font-size:18px;font-weight:bold;color:${style.color};margin-top:8px;">狀態：${escapeHtml(displayStatus)}</div>
      </td></tr>
      ${tagRow}
      <tr><td style="border-top:1px solid #eee;padding:16px 24px;color:#666;font-size:13px;line-height:1.8;">
        原狀態：${escapeHtml(oldStatus || '（無）')}<br>
        操作者：${escapeHtml(safeText(operatorName, '系統'))}<br>
        時間：${escapeHtml(ts)}
      </td></tr>
      ${remarkRow}
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

/**
 * 寄送銷控狀態通知
 * @param {Object} params
 * @param {string} params.projectName
 * @param {string} params.projectId
 * @param {string} params.unitId
 * @param {string|null} params.oldStatus
 * @param {string|null} params.newStatus
 * @param {string} params.operatorName
 * @param {'update'|'cancel'} params.triggerType
 * @param {Array<{userKey:string, channels:string[]}>} params.recipients - 來自前端勾選結果
 * @param {Object} params.userMap - { [userKey]: { name, email, lineId } } (後端二次驗證後重新讀取)
 * @returns {Promise<{ sent:number, failed:number, attempts:Array }>}
 */
async function sendSalesStatusNotifications(params) {
  const {
    projectName, unitId, oldStatus, newStatus, operatorName,
    recipients, userMap, customTag, remark, adminLineId,
  } = params;

  const statusClass = classifySalesStatus(newStatus);
  const timestampText = formatTimestamp();
  const flex = buildLineFlex({
    projectName, unitId, oldStatus, newStatus, operatorName, statusClass, timestampText, customTag, remark,
  });
  const html = buildEmailHtml({
    projectName, unitId, oldStatus, newStatus, operatorName, statusClass, timestampText, customTag, remark,
  });
  const subject = `[${safeText(projectName, '建案')}] 銷控通知 - ${unitId} ${newStatus || '已清空'}`;

  const lineToken = process.env.ANXISMART_LINE_CRM_TOKEN || '';
  let transporter = null;
  const attempts = [];

  for (const r of recipients) {
    const u = userMap[r.userKey];
    if (!u) {
      attempts.push({ userKey: r.userKey, channel: 'unknown', status: 'failed', error: 'user-not-found' });
      continue;
    }

    for (const channel of (r.channels || [])) {
      if (channel === 'line') {
        if (!lineToken) {
          attempts.push({ userKey: r.userKey, channel, status: 'failed', error: 'missing-line-token' });
          continue;
        }
        if (!u.lineId || !u.lineId.startsWith('U')) {
          attempts.push({ userKey: r.userKey, channel, status: 'failed', error: 'no-line-id' });
          continue;
        }
        try {
          await pushLine(lineToken, u.lineId, flex);
          attempts.push({ userKey: r.userKey, channel, status: 'sent' });
        } catch (e) {
          const msg = e.response?.data ? JSON.stringify(e.response.data) : (e.message || 'unknown');
          attempts.push({ userKey: r.userKey, channel, status: 'failed', error: msg });
        }
      } else if (channel === 'email') {
        if (!u.email) {
          attempts.push({ userKey: r.userKey, channel, status: 'failed', error: 'no-email' });
          continue;
        }
        try {
          if (!transporter) transporter = buildTransporter();
          await transporter.sendMail({
            from: `"安熙智慧建案管理系統" <${process.env.SENDER_EMAIL}>`,
            to: u.email,
            subject,
            html,
          });
          attempts.push({ userKey: r.userKey, channel, status: 'sent' });
        } catch (e) {
          attempts.push({ userKey: r.userKey, channel, status: 'failed', error: e.message || 'unknown' });
        }
      } else {
        attempts.push({ userKey: r.userKey, channel, status: 'failed', error: 'unknown-channel' });
      }
    }
  }

  // 系統管理員一律副本 LINE 通知（所有建案）
  if (adminLineId && typeof adminLineId === 'string' && adminLineId.startsWith('U')) {
    if (!lineToken) {
      attempts.push({ userKey: '__admin__', channel: 'line', status: 'failed', error: 'missing-line-token' });
    } else {
      try {
        await pushLine(lineToken, adminLineId, flex);
        attempts.push({ userKey: '__admin__', channel: 'line', status: 'sent' });
      } catch (e) {
        const msg = e.response?.data ? JSON.stringify(e.response.data) : (e.message || 'unknown');
        attempts.push({ userKey: '__admin__', channel: 'line', status: 'failed', error: msg });
      }
    }
  }

  const sent = attempts.filter(a => a.status === 'sent').length;
  const failed = attempts.filter(a => a.status === 'failed').length;
  return { sent, failed, attempts };
}

module.exports = {
  buildLineFlex,
  buildEmailHtml,
  sendSalesStatusNotifications,
};
