/**
 * =================================================================
 * 試用留資（trialLeads）：送出申請 + 事件追蹤
 * =================================================================
 * 規格：docs/SPEC_LandingTrialLeadsOnboarding.md §3.3、§3.4、§8
 *
 * - submitTrialLead：驗證表單 → 去重 → 寫入 trialLeads → 通知超級管理員 → 回傳試用帳密
 * - trackTrialLeadEvent：寫入 events 並依事件類型更新統計欄位
 */

const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { Firestore, FieldValue, Timestamp } = require("@google-cloud/firestore");
const nodemailer = require("nodemailer");
const { getTrialSettings } = require("../utils/trialGuard");

// 寄信所需 Secret（與 index.js 的 gmailSecrets 相同）
const gmailSecrets = ["SENDER_EMAIL", "GMAIL_APP_PASSWORD"];

// 前台網域（留資管理頁連結用；日後更換網域只需改這裡）
const APP_BASE_URL = "https://anxismart.com";

// 允許的事件類型白名單（§8）
const ALLOWED_EVENT_TYPES = new Set([
  "submitted", "auto_login", "tour_started", "tour_completed", "tour_skipped",
  "enter_system", "email_sent", "landing_cta_click",
]);

// 去重：同手機 60 秒內重複送出視為同一次
const DUPLICATE_WINDOW_MS = 60 * 1000;
// 通知間隔：距上次通知超過 24 小時才再寄
const RENOTIFY_INTERVAL_MS = 24 * 60 * 60 * 1000;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^09\d{8}$/;

function getDb() {
  return new Firestore({ databaseId: "anxi-app" });
}

/** 台灣時間字串（yyyy/MM/dd HH:mm:ss） */
function formatTaipei(date = new Date()) {
  return date.toLocaleString("zh-TW", { timeZone: "Asia/Taipei", hour12: false });
}

function escapeHtml(s) {
  return String(s ?? "")
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

function trimStr(v, max = 500) {
  return typeof v === "string" ? v.trim().slice(0, max) : "";
}

/**
 * 驗證並正規化表單資料（§3.2）
 * @returns {{ ok: true, data: object } | { ok: false, message: string }}
 */
function validateLeadInput(raw) {
  const data = raw || {};
  const name = trimStr(data.name, 100);
  const phone = trimStr(data.phone, 30).replace(/[\s-]/g, "");
  const email = trimStr(data.email, 200);
  const company = trimStr(data.company, 200);
  const useType = trimStr(data.useType, 20);
  const interests = Array.isArray(data.interests)
    ? data.interests.filter(x => typeof x === "string").map(x => x.trim()).filter(Boolean).slice(0, 20)
    : [];

  if (name.length < 2 || name.length > 30) return { ok: false, message: "姓名需為 2–30 字。" };
  if (!PHONE_RE.test(phone)) return { ok: false, message: "手機格式錯誤，請輸入 09 開頭共 10 碼。" };
  if (!EMAIL_RE.test(email)) return { ok: false, message: "Email 格式錯誤。" };
  if (company.length < 1 || company.length > 60) return { ok: false, message: "服務公司需為 1–60 字。" };
  if (useType !== "personal" && useType !== "company") return { ok: false, message: "使用型態錯誤。" };

  const utmRaw = data.utm && typeof data.utm === "object" ? data.utm : {};
  const utm = {
    source: trimStr(utmRaw.source, 100),
    medium: trimStr(utmRaw.medium, 100),
    campaign: trimStr(utmRaw.campaign, 100),
  };

  return {
    ok: true,
    data: {
      name, phone, email, company, useType, interests,
      source: trimStr(data.source, 50) || "trial-page",
      utm,
      userAgent: trimStr(data.userAgent, 500),
      referrer: trimStr(data.referrer, 500),
    },
  };
}

/**
 * 寄送「新試用申請」通知給所有超級管理員（失敗只 log，不影響回傳）
 */
async function notifySuperAdmins(db, leadId, lead, nowDate) {
  try {
    const usersSnap = await db.collection("users").where("roles", "array-contains", "超級管理員").get();
    const recipients = [];
    usersSnap.forEach(doc => {
      const email = doc.data()?.email;
      if (typeof email === "string" && email.trim()) recipients.push(email.trim());
    });
    if (recipients.length === 0) {
      console.warn("[submitTrialLead] 找不到具 Email 的超級管理員，略過通知。");
      return false;
    }

    const adminUrl = `${APP_BASE_URL}/#/admin/trial-leads?lead=${encodeURIComponent(leadId)}`;
    const rows = [
      ["姓名", lead.name],
      ["手機", lead.phone],
      ["Email", lead.email],
      ["服務公司", lead.company],
      ["使用型態", lead.useType === "company" ? "公司使用" : "個人使用"],
      ["想了解的系統", (lead.interests || []).join("、") || "（未選）"],
      ["來源", lead.source],
      ["UTM", [lead.utm?.source, lead.utm?.medium, lead.utm?.campaign].filter(Boolean).join(" / ") || "（無）"],
      ["Referrer", lead.referrer || "（無）"],
      ["送出次數", String(lead.submitCount || 1)],
      ["送出時間（台灣）", formatTaipei(nowDate)],
      ["User-Agent", lead.userAgent || "（無）"],
    ];
    const tableHtml = rows.map(([k, v]) => `
      <tr style="border-bottom:1px solid #eee;">
        <td style="padding:8px 12px;font-weight:bold;color:#555;white-space:nowrap;vertical-align:top;">${escapeHtml(k)}</td>
        <td style="padding:8px 12px;word-break:break-all;">${escapeHtml(v)}</td>
      </tr>`).join("");

    const html = `
      <div style="font-family:Arial,'Microsoft JhengHei',sans-serif;line-height:1.6;color:#333;max-width:640px;">
        <h2 style="color:#2F6BFF;margin:0 0 12px;">新試用申請</h2>
        <p style="margin:0 0 16px;">有新的客戶透過官網送出試用申請，資料如下：</p>
        <table style="width:100%;border-collapse:collapse;background:#fafafa;border:1px solid #eee;">${tableHtml}</table>
        <div style="text-align:center;margin:28px 0;">
          <a href="${adminUrl}" target="_blank"
             style="background:#2F6BFF;color:#fff;padding:12px 28px;text-decoration:none;border-radius:6px;font-weight:bold;display:inline-block;">
            前往試用留資管理
          </a>
        </div>
        <p style="font-size:12px;color:#888;margin:0;">此為 ANXI 安熙智慧系統自動發送的通知信。</p>
      </div>`;

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: { user: process.env.SENDER_EMAIL, pass: process.env.GMAIL_APP_PASSWORD },
    });
    await transporter.sendMail({
      from: `"ANXI 安熙智慧" <${process.env.SENDER_EMAIL}>`,
      to: recipients.join(", "),
      subject: `【ANXI】新試用申請：${lead.name}／${lead.company}`,
      html,
    });
    console.log(`[submitTrialLead] 已通知超級管理員 ${recipients.length} 位（lead=${leadId}）`);
    return true;
  } catch (err) {
    console.error("[submitTrialLead] 寄送超管通知失敗（不影響回傳）：", err.message);
    return false;
  }
}

/**
 * submitTrialLead：官網「開始試用」留資（§3.3）
 */
exports.submitTrialLead = onCall({
  region: "asia-east1",
  memory: "512MiB",
  secrets: gmailSecrets,
}, async (request) => {
  const functionName = "submitTrialLead";
  const raw = request.data || {};

  // honeypot：隱藏欄位有值 → 視為機器人，靜默回成功但不寫入
  if (typeof raw.website === "string" && raw.website.trim() !== "") {
    console.log(`[${functionName}] honeypot 命中，靜默丟棄。`);
    return { status: "success", leadId: null, trial: null, ignored: true };
  }

  const validated = validateLeadInput(raw);
  if (!validated.ok) {
    throw new HttpsError("invalid-argument", validated.message);
  }
  const input = validated.data;

  const settings = await getTrialSettings();
  if (settings.enabled !== true) {
    throw new HttpsError("failed-precondition", "試用功能暫停");
  }

  const db = getDb();
  const nowDate = new Date();
  const now = Timestamp.fromDate(nowDate);
  const trialCredential = { key: settings.accountKey, password: settings.password };

  try {
    // 去重：以手機查既有留資
    const dupSnap = await db.collection("trialLeads").where("phone", "==", input.phone).limit(1).get();

    if (!dupSnap.empty) {
      const existingDoc = dupSnap.docs[0];
      const existing = existingDoc.data() || {};
      const leadId = existingDoc.id;
      const lastSeenMs = existing.lastSeenAt?.toMillis ? existing.lastSeenAt.toMillis() : 0;

      // 60 秒內重複送出 → 直接回既有 leadId，不做任何更新
      if (nowDate.getTime() - lastSeenMs < DUPLICATE_WINDOW_MS) {
        console.log(`[${functionName}] 60 秒內重複送出，回傳既有 leadId=${leadId}`);
        return { status: "success", leadId, trial: trialCredential, duplicate: true };
      }

      // 已存在 → 覆蓋基本資料、累加 submitCount；保留 tags/notes/status/events/emailLogs
      const updatePayload = {
        name: input.name,
        email: input.email,
        company: input.company,
        useType: input.useType,
        interests: input.interests,
        source: input.source,
        utm: input.utm,
        userAgent: input.userAgent,
        referrer: input.referrer,
        submitCount: FieldValue.increment(1),
        lastSeenAt: now,
        updatedAt: now,
        events: FieldValue.arrayUnion({ type: "submitted", at: now, meta: { repeat: true } }),
      };

      const lastNotifiedMs = existing.lastNotifiedAt?.toMillis ? existing.lastNotifiedAt.toMillis() : 0;
      const shouldNotify = nowDate.getTime() - lastNotifiedMs > RENOTIFY_INTERVAL_MS;
      if (shouldNotify) {
        const sent = await notifySuperAdmins(db, leadId, {
          ...existing, ...input, submitCount: (existing.submitCount || 1) + 1,
        }, nowDate);
        if (sent) updatePayload.lastNotifiedAt = now;
      }

      await existingDoc.ref.update(updatePayload);
      console.log(`[${functionName}] 既有留資更新 leadId=${leadId}（通知：${shouldNotify ? "已寄" : "略過"}）`);
      return { status: "success", leadId, trial: trialCredential, duplicate: true };
    }

    // 不存在 → 新建（§3.4）
    const leadRef = db.collection("trialLeads").doc();
    const leadId = leadRef.id;
    const newLead = {
      name: input.name,
      phone: input.phone,
      email: input.email,
      company: input.company,
      useType: input.useType,
      interests: input.interests,
      status: "new",
      tags: ["未聯絡"],
      notes: [],
      source: input.source,
      utm: input.utm,
      userAgent: input.userAgent,
      referrer: input.referrer,
      submitCount: 1,
      loginCount: 0,
      tourCompleted: false,
      events: [{ type: "submitted", at: now, meta: {} }],
      emailLogs: [],
      createdAt: now,
      updatedAt: now,
      lastSeenAt: now,
      lastLoginAt: null,
      lastNotifiedAt: null,
    };

    const notified = await notifySuperAdmins(db, leadId, newLead, nowDate);
    if (notified) newLead.lastNotifiedAt = now;

    await leadRef.set(newLead);
    console.log(`[${functionName}] 新建留資 leadId=${leadId}（${input.name}／${input.company}）`);
    return { status: "success", leadId, trial: trialCredential };
  } catch (error) {
    console.error(`[${functionName}] 執行失敗：`, error);
    if (error instanceof HttpsError) throw error;
    throw new HttpsError("internal", `送出試用申請時發生錯誤：${error.message}`);
  }
});

/**
 * trackTrialLeadEvent：試用者行為事件追蹤（§8）
 */
exports.trackTrialLeadEvent = onCall({
  region: "asia-east1",
  memory: "512MiB",
}, async (request) => {
  const functionName = "trackTrialLeadEvent";
  const { leadId, type } = request.data || {};
  const meta = request.data?.meta && typeof request.data.meta === "object" ? request.data.meta : {};

  if (!leadId || typeof leadId !== "string") {
    return { status: "ignored", reason: "missing-leadId" };
  }
  if (!ALLOWED_EVENT_TYPES.has(type)) {
    throw new HttpsError("invalid-argument", `不支援的事件類型：${type}`);
  }

  const db = getDb();
  const leadRef = db.collection("trialLeads").doc(leadId);

  try {
    const snap = await leadRef.get();
    if (!snap.exists) {
      return { status: "ignored", reason: "lead-not-found" };
    }

    const now = Timestamp.now();
    const payload = {
      events: FieldValue.arrayUnion({ type, at: now, meta }),
      lastSeenAt: now,
      updatedAt: now,
    };
    if (type === "auto_login") {
      payload.loginCount = FieldValue.increment(1);
      payload.lastLoginAt = now;
    }
    if (type === "tour_completed") {
      payload.tourCompleted = true;
    }

    await leadRef.update(payload);
    return { status: "success" };
  } catch (error) {
    console.error(`[${functionName}] 寫入事件失敗（leadId=${leadId}, type=${type}）：`, error);
    if (error instanceof HttpsError) throw error;
    throw new HttpsError("internal", `寫入事件時發生錯誤：${error.message}`);
  }
});
