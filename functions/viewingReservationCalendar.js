const { Firestore } = require('@google-cloud/firestore');
const { onRequest } = require('firebase-functions/v2/https');

// 賞屋預約「加入行事曆」：同一網址供一鍵加入與 QR Code 掃描使用，
// Apple 裝置回傳 .ics（內建行事曆），其他裝置轉到 Google 日曆。
const EVENT_MINUTES = 60;
const APPLE_UA = /iPhone|iPad|iPod|Macintosh/i;

function toDate(value) {
  if (!value) return null;
  if (typeof value.toDate === 'function') return value.toDate();
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function buildEvent(reservation, projectName) {
  const start = toDate(reservation.reservationTime);
  if (!start) return null;
  const lines = [
    reservation.customerPhone && `電話：${reservation.customerPhone}`,
    `建案：${projectName}`,
    `負責銷售：${reservation.salesName || '不指定'}`,
    reservation.unitId && `戶別：${reservation.unitId}`,
    reservation.note && `備註：${reservation.note}`,
  ].filter(Boolean);
  return {
    title: `【${projectName}】${reservation.customerName || ''} ${reservation.type || ''}`.trim(),
    description: lines.join('\n'),
    start,
    end: new Date(start.getTime() + EVENT_MINUTES * 60 * 1000),
  };
}

const formatUtc = date => date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');

const escapeIcsText = text => String(text)
  .replace(/\\/g, '\\\\')
  .replace(/;/g, '\\;')
  .replace(/,/g, '\\,')
  .replace(/\r?\n/g, '\\n');

// RFC 5545：每行不超過 75 位元組，續行以空白開頭；中文為多位元組，需逐字計算避免切斷字元。
function foldLine(line) {
  const parts = [];
  let current = '';
  let bytes = 0;
  for (const char of line) {
    const size = Buffer.byteLength(char);
    if (bytes + size > 75) {
      parts.push(current);
      current = ' ';
      bytes = 1;
    }
    current += char;
    bytes += size;
  }
  parts.push(current);
  return parts.join('\r\n');
}

function buildIcs(id, event, { now = new Date(), sequence = 0 } = {}) {
  const alarm = trigger => [
    'BEGIN:VALARM', `TRIGGER:${trigger}`, 'ACTION:DISPLAY', `DESCRIPTION:${escapeIcsText(event.title)}`, 'END:VALARM',
  ];
  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//AnxiSmart//ViewingReservation//ZH',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${id}@viewing-reservation.anxismart`,
    `DTSTAMP:${formatUtc(now)}`,
    `SEQUENCE:${sequence}`,
    `DTSTART:${formatUtc(event.start)}`,
    `DTEND:${formatUtc(event.end)}`,
    `SUMMARY:${escapeIcsText(event.title)}`,
    `DESCRIPTION:${escapeIcsText(event.description)}`,
    ...alarm('-P1D'),
    ...alarm('-PT1H'),
    'END:VEVENT',
    'END:VCALENDAR',
  ].map(foldLine).join('\r\n');
}

function googleCalendarUrl(event) {
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: event.title,
    dates: `${formatUtc(event.start)}/${formatUtc(event.end)}`,
    details: event.description,
    ctz: 'Asia/Taipei',
  });
  return `https://calendar.google.com/calendar/event?${params}`;
}

function sendMessage(res, status, message) {
  res.status(status).set('Content-Type', 'text/html; charset=utf-8').send(
    `<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">`
    + `<title>賞屋預約</title><p style="font:16px sans-serif;text-align:center;margin-top:40vh">${message}</p>`);
}

exports.viewingReservationCalendar = onRequest({ region: 'asia-east1', memory: '512MiB' }, async (req, res) => {
  res.set('Cache-Control', 'no-store');
  const id = String(req.query.id || '');
  if (!/^[A-Za-z0-9]{10,40}$/.test(id)) return sendMessage(res, 400, '連結無效');

  const db = new Firestore({ databaseId: 'anxi-app' });
  const snapshot = await db.collection('viewing_reservations').doc(id).get();
  const reservation = snapshot.data();
  if (!reservation || reservation.status !== 'active') return sendMessage(res, 404, '此預約不存在或已取消');

  const project = await db.collection('projects').doc(reservation.projectId).get();
  const event = buildEvent(reservation, project.data()?.name || reservation.projectId);
  if (!event) return sendMessage(res, 404, '此預約沒有預約時間');

  // target 可由前端指定（Mac 讓使用者選 Apple／Google），未指定時依裝置判斷
  const target = req.query.target || (APPLE_UA.test(req.get('user-agent') || '') ? 'apple' : 'google');
  if (target !== 'apple') return res.redirect(302, googleCalendarUrl(event));

  // 以最後更新時間作為 SEQUENCE，重新加入同一預約時行事曆可辨識為較新版本
  const updatedAt = toDate(reservation.updatedAt);
  const sequence = updatedAt ? Math.floor(updatedAt.getTime() / 1000) : 0;
  res.set('Content-Type', 'text/calendar; charset=utf-8')
    .set('Content-Disposition', 'attachment; filename="viewing-reservation.ics"')
    .send(buildIcs(id, event, { sequence }));
});

exports.buildEvent = buildEvent;
exports.buildIcs = buildIcs;
exports.googleCalendarUrl = googleCalendarUrl;
exports.foldLine = foldLine;
