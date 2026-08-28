/**
 * =================================================================
 * 廣告 Email 群發：sendMarketingEmail
 * =================================================================
 * 規格：docs/SPEC_LandingTrialLeadsOnboarding.md §6.3
 *
 * - 僅超級管理員可呼叫（以 operatorKey 讀 users 驗證 roles）
 * - 建立 emailCampaigns/{id}，逐位個別寄送（不用 BCC），每封間隔 300ms
 * - 主旨／內文支援 {{姓名}} {{公司}} {{Email}} 變數替換
 * - 每位成功／失敗即時更新 campaign，並寫回 trialLeads/{leadId} 的 emailLogs 與 events
 */

const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { Firestore, FieldValue, Timestamp } = require("@google-cloud/firestore");
const nodemailer = require("nodemailer");
const fetch = require("node-fetch");
const { assertSuperAdmin } = require("../utils/trialGuard");

const gmailSecrets = ["SENDER_EMAIL", "GMAIL_APP_PASSWORD"];

// 每封信之間的間隔（毫秒），避免 Gmail 限流
const SEND_INTERVAL_MS = 300;
// 單次群發收件人上限（安全上限；規格量級 < 500）
const MAX_RECIPIENTS = 500;
// 附件單檔大小上限（bytes）
const MAX_ATTACHMENT_BYTES = 20 * 1024 * 1024;

const FOOTER_TEXT = "此信由 ANXI 安熙智慧 寄送｜如不想再收到相關資訊，請回覆此信告知。";
const FOOTER_HTML = `
  <hr style="border:0;border-top:1px solid #e5e5e5;margin:32px 0 12px;">
  <p style="font-size:12px;color:#888;line-height:1.6;margin:0;">${FOOTER_TEXT}</p>`;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/** 變數替換：{{姓名}} {{公司}} {{Email}}（容忍大括號內空白） */
function applyVariables(text, recipient) {
  if (typeof text !== "string" || !text) return "";
  const map = {
    "姓名": recipient.name || "",
    "公司": recipient.company || "",
    "Email": recipient.email || "",
    "email": recipient.email || "",
  };
  return text.replace(/\{\{\s*(姓名|公司|Email|email)\s*\}\}/g, (_, key) => map[key] ?? "");
}

/**
 * 下載附件為 Buffer（沿用 index.js 驗屋報告附件下載模式）
 * 單一附件失敗只 log、不中斷
 */
async function downloadAttachments(attachments, functionName) {
  const result = [];
  const errors = [];
  if (!Array.isArray(attachments)) return { attachments: result, errors };
  for (const att of attachments) {
    if (!att || typeof att.url !== "string" || !att.url) continue;
    const name = typeof att.name === "string" && att.name ? att.name : "attachment";
    try {
      const response = await fetch(att.url, { timeout: 60 * 1000 });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const buffer = await response.buffer();
      if (buffer.length > MAX_ATTACHMENT_BYTES) {
        throw new Error(`附件超過 ${Math.round(MAX_ATTACHMENT_BYTES / 1024 / 1024)}MB 上限`);
      }
      result.push({ filename: name, content: buffer });
      console.log(`[${functionName}] 附件「${name}」下載完成 (${buffer.length} bytes)`);
    } catch (err) {
      console.error(`[${functionName}] 附件「${name}」下載失敗：`, err.message);
      errors.push({ name, error: err.message });
    }
  }
  return { attachments: result, errors };
}

/** 正規化收件人清單 */
function normalizeRecipients(list) {
  if (!Array.isArray(list)) return [];
  const seen = new Set();
  const out = [];
  for (const r of list) {
    if (!r || typeof r !== "object") continue;
    const email = typeof r.email === "string" ? r.email.trim() : "";
    if (!email || seen.has(email.toLowerCase())) continue;
    seen.add(email.toLowerCase());
    out.push({
      leadId: typeof r.leadId === "string" ? r.leadId : null,
      name: typeof r.name === "string" ? r.name.trim() : "",
      email,
      company: typeof r.company === "string" ? r.company.trim() : "",
      status: "pending",
      error: null,
      sentAt: null,
    });
  }
  return out.slice(0, MAX_RECIPIENTS);
}

exports.sendMarketingEmail = onCall({
  region: "asia-east1",
  memory: "512MiB",
  secrets: gmailSecrets,
  timeoutSeconds: 540,
}, async (request) => {
  const functionName = "sendMarketingEmail";
  const { operatorKey, subject, html, attachments } = request.data || {};

  const db = new Firestore({ databaseId: "anxi-app" });
  const operator = await assertSuperAdmin(db, operatorKey);

  if (typeof subject !== "string" || !subject.trim()) {
    throw new HttpsError("invalid-argument", "缺少主旨。");
  }
  if (typeof html !== "string" || !html.trim()) {
    throw new HttpsError("invalid-argument", "缺少信件內容。");
  }
  const recipients = normalizeRecipients(request.data?.recipients);
  if (recipients.length === 0) {
    throw new HttpsError("invalid-argument", "沒有有效的收件人。");
  }

  const attachmentMeta = Array.isArray(attachments)
    ? attachments
      .filter(a => a && typeof a.url === "string")
      .map(a => ({ name: a.name || "attachment", url: a.url, size: Number(a.size) || 0 }))
    : [];

  // 1. 建立 campaign 文件（§6.3）
  const campaignRef = db.collection("emailCampaigns").doc();
  const campaignId = campaignRef.id;
  const createdAt = Timestamp.now();
  await campaignRef.set({
    subject: subject.trim(),
    html,
    attachments: attachmentMeta,
    recipients,
    total: recipients.length,
    sent: 0,
    failed: 0,
    status: "running",
    createdBy: operatorKey,
    createdByName: operator.name || "",
    createdAt,
    finishedAt: null,
  });
  console.log(`[${functionName}] 建立 campaign ${campaignId}，收件人 ${recipients.length} 位，操作人 ${operatorKey}`);

  // 2. 下載附件（一次下載、全員共用）
  const { attachments: mailAttachments, errors: attachmentErrors } = await downloadAttachments(attachmentMeta, functionName);
  if (attachmentErrors.length > 0) {
    await campaignRef.update({ attachmentErrors });
  }

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: { user: process.env.SENDER_EMAIL, pass: process.env.GMAIL_APP_PASSWORD },
  });

  let sent = 0;
  let failed = 0;

  // 3. 逐位寄送
  for (let i = 0; i < recipients.length; i++) {
    const r = recipients[i];
    const sentAt = Timestamp.now();

    if (!EMAIL_RE.test(r.email)) {
      r.status = "failed";
      r.error = "Email 格式錯誤";
      failed++;
    } else {
      try {
        const personalSubject = applyVariables(subject.trim(), r);
        const personalHtml = applyVariables(html, r) + FOOTER_HTML;
        const mailOptions = {
          from: `"ANXI 安熙智慧" <${process.env.SENDER_EMAIL}>`,
          to: r.email,
          subject: personalSubject,
          html: personalHtml,
        };
        if (mailAttachments.length > 0) mailOptions.attachments = mailAttachments;

        await transporter.sendMail(mailOptions);
        r.status = "sent";
        r.error = null;
        r.sentAt = sentAt;
        sent++;
      } catch (err) {
        r.status = "failed";
        r.error = err.message || String(err);
        r.sentAt = sentAt;
        failed++;
        console.error(`[${functionName}] 寄給 ${r.email} 失敗：`, err.message);
      }
    }

    // 3a. 即時更新 campaign 進度（量級 < 500，直接覆寫整個 recipients 陣列）
    try {
      await campaignRef.update({ recipients, sent, failed });
    } catch (err) {
      console.error(`[${functionName}] 更新 campaign 進度失敗：`, err.message);
    }

    // 3b. 寫回 trialLeads（leadId 不存在或非字串則略過）
    if (r.leadId) {
      try {
        const leadRef = db.collection("trialLeads").doc(r.leadId);
        const leadSnap = await leadRef.get();
        if (leadSnap.exists) {
          await leadRef.update({
            emailLogs: FieldValue.arrayUnion({
              campaignId, subject: subject.trim(), sentAt, status: r.status,
            }),
            events: FieldValue.arrayUnion({
              type: "email_sent", at: sentAt, meta: { campaignId, status: r.status },
            }),
            updatedAt: sentAt,
          });
        }
      } catch (err) {
        console.error(`[${functionName}] 寫回 trialLeads/${r.leadId} 失敗：`, err.message);
      }
    }

    if (i < recipients.length - 1) await sleep(SEND_INTERVAL_MS);
  }

  // 4. 完成
  await campaignRef.update({
    status: "done",
    sent,
    failed,
    finishedAt: Timestamp.now(),
  });
  console.log(`[${functionName}] campaign ${campaignId} 完成：成功 ${sent}、失敗 ${failed}`);

  return { status: "success", campaignId, sent, failed };
});
