/**
 * =================================================================
 * 開信追蹤像素：trackEmailOpen
 * =================================================================
 * 規格：docs/SPEC_CustomerProspecting.md §6.4
 *
 * GET ?c={campaignId}&r={recipientIndex}&t={token}
 * - token = sha256(campaignId + index + TRACKING_SALT).slice(0, 16)（由 sendMarketingEmail 產生）
 * - 任何錯誤都回 1x1 透明 gif（不洩漏資訊）
 * - 更新 emailCampaigns/{c}.recipients[r].openedAt / openCount、opened
 * - target === 'prospects' 時同步 prospects/{leadId}：lastOpenedAt、openCount、emailLogs、events（同 campaign 每小時最多 1 筆）
 *
 * 連結點擊追蹤：trackEmailClick（docs/SPEC_CustomerProspecting.md §6.5）
 * GET ?c={campaignId}&r={recipientIndex}&t={token}&l={linkIndex}
 * - 由 sendMarketingEmail 把信內每個 http(s) 連結換成此網址；campaign.links[l].url 為原始目的地
 * - 記錄後 302 轉址到原始網址；token 不符／找不到連結則回 400
 * - 更新 recipients[r].clickedAt / lastClickedAt / clickCount / clicks{l}、campaign.clicked、campaign.linkClicks{l}
 * - prospects：lastClickedAt、clickCount、emailLogs.clickedAt、events email_clicked（同 campaign+連結每小時 1 筆）、
 *   自動加「高優先」標籤、追蹤日提前到隔天（未設或晚於隔天時）
 */

const { onRequest } = require("firebase-functions/v2/https");
const { Firestore, FieldValue, Timestamp } = require("@google-cloud/firestore");
const crypto = require("crypto");

const GIF_1x1 = Buffer.from("R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7", "base64");
const EVENT_THROTTLE_MS = 60 * 60 * 1000;

function makeTrackingToken(campaignId, index, salt) {
  return crypto.createHash("sha256").update(`${campaignId}|${index}|${salt || ""}`).digest("hex").slice(0, 16);
}

function respondGif(res) {
  res.set("Content-Type", "image/gif");
  res.set("Cache-Control", "no-store, no-cache, must-revalidate, private");
  res.set("Pragma", "no-cache");
  res.set("Expires", "0");
  res.status(200).send(GIF_1x1);
}

exports.makeTrackingToken = makeTrackingToken;

/** 台灣時間「明天 09:00」 */
function tomorrowTaipei(now) {
  const ymd = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Taipei", year: "numeric", month: "2-digit", day: "2-digit" })
    .format(new Date(now.toMillis() + 24 * 3600 * 1000));
  return Timestamp.fromDate(new Date(`${ymd}T09:00:00+08:00`));
}

exports.trackEmailClick = onRequest({
  region: "asia-east1",
  memory: "512MiB",
  secrets: ["TRACKING_SALT"],
}, async (req, res) => {
  const functionName = "trackEmailClick";
  res.set("Cache-Control", "no-store, no-cache, must-revalidate, private");
  try {
    const campaignId = String(req.query.c || "").trim();
    const index = Number.parseInt(String(req.query.r || ""), 10);
    const linkIndex = Number.parseInt(String(req.query.l || ""), 10);
    const token = String(req.query.t || "").trim();
    if (!campaignId || !Number.isInteger(index) || index < 0 || !Number.isInteger(linkIndex) || linkIndex < 0 || !token) {
      return res.status(400).send("連結無效");
    }
    if (token !== makeTrackingToken(campaignId, index, process.env.TRACKING_SALT)) {
      console.warn(`[${functionName}] token 不符 c=${campaignId} r=${index}`);
      return res.status(400).send("連結無效");
    }

    const db = new Firestore({ databaseId: "anxi-app" });
    const now = Timestamp.now();
    const campaignRef = db.collection("emailCampaigns").doc(campaignId);
    const snap = await campaignRef.get();
    if (!snap.exists) return res.status(400).send("連結無效");
    const campaign = snap.data() || {};
    const link = Array.isArray(campaign.links) ? campaign.links[linkIndex] : null;
    if (!link || !/^https?:\/\//i.test(String(link.url || ""))) return res.status(400).send("連結無效");

    // 先記錄（Cloud Run 回應後不保證繼續執行），記錄失敗仍轉址
    try {

      const recipients = Array.isArray(campaign.recipients) ? [...campaign.recipients] : [];
      const r = recipients[index];
      if (!r) throw new Error("recipient not found");
      const firstClick = !r.clickedAt;
      const clicks = { ...(r.clicks || {}) };
      clicks[String(linkIndex)] = (Number(clicks[String(linkIndex)]) || 0) + 1;
      recipients[index] = { ...r, clickedAt: r.clickedAt || now, lastClickedAt: now, clickCount: (Number(r.clickCount) || 0) + 1, clicks };
      const clicked = recipients.filter((x) => x.clickedAt).length;
      const linkClicks = { ...(campaign.linkClicks || {}) };
      linkClicks[String(linkIndex)] = (Number(linkClicks[String(linkIndex)]) || 0) + 1;
      await campaignRef.update({ recipients, clicked, linkClicks });

      if (campaign.target === "prospects" && r.leadId) {
        const pRef = db.collection("prospects").doc(r.leadId);
        const pSnap = await pRef.get();
        if (pSnap.exists) {
          const p = pSnap.data() || {};
          const logs = Array.isArray(p.emailLogs) ? p.emailLogs.map((l) => ({ ...l })) : [];
          const log = logs.find((l) => l.campaignId === campaignId && (!l.contactId || !r.contactId || l.contactId === r.contactId));
          if (log) {
            log.clickedAt = log.clickedAt || now;
            log.clickCount = (Number(log.clickCount) || 0) + 1;
          }
          const events = Array.isArray(p.events) ? p.events : [];
          const recent = events
            .filter((e) => e.type === "email_clicked" && e.meta && e.meta.campaignId === campaignId && e.meta.linkIndex === linkIndex)
            .map((e) => (e.at && typeof e.at.toMillis === "function" ? e.at.toMillis() : 0))
            .sort((a, b) => b - a)[0] || 0;
          const patch = {
            emailLogs: logs,
            lastClickedAt: now,
            clickCount: FieldValue.increment(1),
            tags: FieldValue.arrayUnion("高優先"),
            updatedAt: now,
          };
          if (firstClick || now.toMillis() - recent > EVENT_THROTTLE_MS) {
            patch.events = FieldValue.arrayUnion({
              id: `ev_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`,
              type: "email_clicked",
              at: now,
              by: "",
              byName: "",
              text: link.label || link.url,
              meta: { campaignId, subject: campaign.subject || "", to: r.email || "", linkIndex, url: link.url, label: link.label || "" },
            });
          }
          // 追蹤日提前到隔天（已成交／不聯絡不動）
          if (!["won", "do_not_contact"].includes(p.status)) {
            const tomorrow = tomorrowTaipei(now);
            const cur = p.followUpAt && typeof p.followUpAt.toMillis === "function" ? p.followUpAt.toMillis() : 0;
            if (!cur || cur > tomorrow.toMillis()) patch.followUpAt = tomorrow;
          }
          await pRef.update(patch);
        }
      }
      console.log(`[${functionName}] c=${campaignId} r=${index} l=${linkIndex} 已記錄點擊`);
    } catch (err) {
      console.error(`[${functionName}] 記錄失敗：`, err.message);
    }
    return res.redirect(302, link.url);
  } catch (err) {
    console.error(`[${functionName}] 失敗：`, err.message);
    if (!res.headersSent) res.status(400).send("連結無效");
  }
});

exports.trackEmailOpen = onRequest({
  region: "asia-east1",
  memory: "512MiB",
  secrets: ["TRACKING_SALT"],
}, async (req, res) => {
  const functionName = "trackEmailOpen";
  try {
    const campaignId = String(req.query.c || "").trim();
    const index = Number.parseInt(String(req.query.r || ""), 10);
    const token = String(req.query.t || "").trim();
    if (!campaignId || !Number.isInteger(index) || index < 0 || !token) return respondGif(res);
    if (token !== makeTrackingToken(campaignId, index, process.env.TRACKING_SALT)) {
      console.warn(`[${functionName}] token 不符 c=${campaignId} r=${index}`);
      return respondGif(res);
    }

    const db = new Firestore({ databaseId: "anxi-app" });
    const now = Timestamp.now();
    const campaignRef = db.collection("emailCampaigns").doc(campaignId);
    const snap = await campaignRef.get();
    if (!snap.exists) return respondGif(res);
    const campaign = snap.data() || {};
    const recipients = Array.isArray(campaign.recipients) ? [...campaign.recipients] : [];
    const r = recipients[index];
    if (!r) return respondGif(res);

    const firstOpen = !r.openedAt;
    recipients[index] = {
      ...r,
      openedAt: r.openedAt || now,
      lastOpenedAt: now,
      openCount: (Number(r.openCount) || 0) + 1,
    };
    const opened = recipients.filter((x) => x.openedAt).length;
    await campaignRef.update({ recipients, opened });

    if (campaign.target === "prospects" && r.leadId) {
      const pRef = db.collection("prospects").doc(r.leadId);
      const pSnap = await pRef.get();
      if (pSnap.exists) {
        const p = pSnap.data() || {};
        const logs = Array.isArray(p.emailLogs) ? p.emailLogs.map((l) => ({ ...l })) : [];
        const log = logs.find((l) => l.campaignId === campaignId && (!l.contactId || !r.contactId || l.contactId === r.contactId));
        if (log) {
          log.openedAt = log.openedAt || now;
          log.openCount = (Number(log.openCount) || 0) + 1;
        }
        // 事件節流：同 campaign 一小時內只記一次
        const events = Array.isArray(p.events) ? p.events : [];
        const recent = events
          .filter((e) => e.type === "email_opened" && e.meta && e.meta.campaignId === campaignId)
          .map((e) => (e.at && typeof e.at.toMillis === "function" ? e.at.toMillis() : 0))
          .sort((a, b) => b - a)[0] || 0;
        const patch = {
          emailLogs: logs,
          lastOpenedAt: now,
          openCount: FieldValue.increment(1),
          updatedAt: now,
        };
        if (firstOpen || now.toMillis() - recent > EVENT_THROTTLE_MS) {
          patch.events = FieldValue.arrayUnion({
            id: `ev_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`,
            type: "email_opened",
            at: now,
            by: "",
            byName: "",
            text: "",
            meta: { campaignId, subject: campaign.subject || "", to: r.email || "" },
          });
        }
        await pRef.update(patch);
      }
    }
    console.log(`[${functionName}] c=${campaignId} r=${index} 已記錄開信`);
  } catch (err) {
    console.error(`[${functionName}] 失敗：`, err.message);
  }
  return respondGif(res);
});
