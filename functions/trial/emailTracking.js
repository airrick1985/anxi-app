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
