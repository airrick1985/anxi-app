/**
 * 客戶開發：網路蒐集核心（純邏輯 + Firestore 寫入），供 Cloud Functions 與本機腳本共用。
 *
 * 來源：
 *   1. 內政部「預售屋備查建案」全國 CSV（建案＋起造人＝建商）
 *   2. 各縣市不動產開發／代銷公會公開會員名錄（建商／代銷）
 *   3. 公司官網（Google Programmable Search 找官網 → 抓首頁／聯絡頁公開信箱）
 *
 * 規格：docs/SPEC_CustomerProspecting.md §2（prospects 資料模型）；寫入規則同 Excel 匯入（同名只補空欄）。
 */
const JSZip = require('jszip');
const iconv = require('iconv-lite');

const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36';
const FETCH_TIMEOUT = 12000;

const CITY_NAMES = {
  a: '臺北市', b: '臺中市', c: '基隆市', d: '臺南市', e: '高雄市', f: '新北市', g: '宜蘭縣', h: '桃園市', i: '嘉義市', j: '新竹縣',
  k: '苗栗縣', m: '南投縣', n: '彰化縣', o: '新竹市', p: '雲林縣', q: '嘉義縣', t: '屏東縣', u: '花蓮縣', v: '臺東縣', w: '金門縣', x: '澎湖縣', z: '連江縣',
};
const CITY_CODES = Object.fromEntries(Object.entries(CITY_NAMES).map(([k, v]) => [v, k]));
const SIX_CITIES = ['臺北市', '新北市', '桃園市', '臺中市', '臺南市', '高雄市'];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const normCity = (s) => String(s || '').replace(/台/g, '臺').trim();

// ---------------------------------------------------------------
// 與 prospectService.js 相同的工具
// ---------------------------------------------------------------
const toHalfWidth = (s) => String(s || '').replace(/[！-～]/g, (ch) => String.fromCharCode(ch.charCodeAt(0) - 0xFEE0)).replace(/　/g, ' ');
const nameKey = (name) => toHalfWidth(name).replace(/[（(]/g, '(').replace(/[）)]/g, ')').replace(/[\s·．・•]/g, '').toLowerCase();
const stripParens = (n) => String(n || '').replace(/[（(][^）)]*[）)]/g, '').trim();
const parenContent = (n) => { const m = String(n || '').match(/[（(]([^）)]*)[）)]/); return m ? m[1].trim() : ''; };
const genId = (p = '') => `${p}${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const isValidEmail = (e) => EMAIL_RE.test(String(e || '').trim());
const COMPANY_RE = /(公司|企業|建設|開發|實業|事業|集團|營造|廣告|行銷|地產|不動產|資產|投資|置業|興業|工程|機構|股份|有限)/;
const NOT_COMPANY_RE = /(政府|公所|工程局|管理局|管理處|事務所|國軍|建字|字第|議會|大學|學校|醫院|基金會|合作社|農會|國有|署$|部$|局$|等\d+名)/;
const isCompanyName = (n) => { const s = String(n || ''); return s.length >= 3 && COMPANY_RE.test(s) && !NOT_COMPANY_RE.test(s); };

/** 起造人欄位正規化：去負責人、拆多起造人、清掉殘缺括號 */
function parseBuilders(raw) {
  const s = toHalfWidth(raw).replace(/負責人[:：]?.*$/g, '').replace(/代表人[:：]?.*$/g, '').trim();
  const clean = (x) => x.replace(/[（(]\s*$/, '').replace(/[（(]\s*[）)]/g, '').replace(/^[）)]\s*/, '').trim();
  const parts = s.split(/[、;；,，/／]|\s{2,}/).map((x) => clean(x)).filter(Boolean);
  const companies = parts.filter(isCompanyName);
  return { primary: companies[0] || '', all: companies, text: parts.join('、') };
}
const cleanLocation = (s) => String(s || '').replace(/\s*共\s*\d+\s*筆.*$/, '').replace(/\s*詳見附表.*$/, '').replace(/\?/g, '').trim();
/** 民國 7 碼 → yyyy/mm/dd */
const rocDateText = (d) => (/^\d{7}$/.test(d) ? `${Number(d.slice(0, 3)) + 1911}/${d.slice(3, 5)}/${d.slice(5, 7)}` : d);
/** ISO yyyy-mm-dd → 民國 7 碼 */
function isoToRoc(iso) {
  const m = String(iso || '').match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!m) return /^\d{7}$/.test(String(iso)) ? String(iso) : '1130101';
  return `${String(Number(m[1]) - 1911).padStart(3, '0')}${m[2]}${m[3]}`;
}

// ---------------------------------------------------------------
// HTTP
// ---------------------------------------------------------------
async function fetchRaw(url, { timeout = FETCH_TIMEOUT, headers = {} } = {}) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeout);
  try {
    const res = await fetch(url, { headers: { 'User-Agent': UA, 'Accept-Language': 'zh-TW,zh;q=0.9,en;q=0.5', Accept: 'text/html,*/*', ...headers }, redirect: 'follow', signal: ctrl.signal });
    const buf = Buffer.from(await res.arrayBuffer());
    return { status: res.status, buf, contentType: res.headers.get('content-type') || '', url: res.url };
  } finally { clearTimeout(t); }
}
function decodeHtml(buf, contentType = '') {
  let cs = (contentType.match(/charset=([\w-]+)/i) || [])[1];
  if (!cs) cs = (buf.subarray(0, 4096).toString('latin1').match(/charset=["']?([\w-]+)/i) || [])[1];
  cs = (cs || 'utf-8').toLowerCase();
  if (/big5|cp950/.test(cs)) return iconv.decode(buf, 'big5');
  if (/gb/.test(cs)) return iconv.decode(buf, 'gbk');
  return buf.toString('utf8');
}
async function fetchHtml(url, o) { const r = await fetchRaw(url, o); return { ...r, html: decodeHtml(r.buf, r.contentType) }; }

const unesc = (s) => String(s || '').replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n))).replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCharCode(parseInt(h, 16)))
  .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&nbsp;/g, ' ');
const stripTags = (s) => unesc(String(s || '').replace(/<script[\s\S]*?<\/script>/gi, ' ').replace(/<style[\s\S]*?<\/style>/gi, ' ').replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim();

// ---------------------------------------------------------------
// CSV
// ---------------------------------------------------------------
function parseCsv(text) {
  const rows = []; let row = []; let cell = ''; let q = false;
  for (let i = 0; i < text.length; i += 1) {
    const ch = text[i];
    if (q) {
      if (ch === '"') { if (text[i + 1] === '"') { cell += '"'; i += 1; } else q = false; } else cell += ch;
    } else if (ch === '"') q = true;
    else if (ch === ',') { row.push(cell); cell = ''; }
    else if (ch === '\n' || ch === '\r') { if (ch === '\r' && text[i + 1] === '\n') i += 1; row.push(cell); rows.push(row); row = []; cell = ''; }
    else cell += ch;
  }
  if (cell || row.length) { row.push(cell); rows.push(row); }
  return rows;
}

// ---------------------------------------------------------------
// 來源 1：內政部預售屋備查建案
// ---------------------------------------------------------------
const BUILDCASE_URL = 'https://plvr.land.moi.gov.tw/Download?type=zip&PayType=saleremark&fileName=lvr_buildcasecsv.zip';

async function downloadBuildcaseZip() {
  const r = await fetchRaw(BUILDCASE_URL, { timeout: 120000, headers: { Referer: 'https://plvr.land.moi.gov.tw/DownloadOpenData' } });
  if (r.status !== 200 || r.buf.length < 10000) throw new Error(`內政部 CSV 下載失敗 http=${r.status} size=${r.buf.length}`);
  return r.buf;
}

/** @param {Buffer} zipBuf @param {string[]} cityCodes */
async function readBuildcaseCsvs(zipBuf, cityCodes) {
  const zip = await JSZip.loadAsync(zipBuf);
  const out = {};
  for (const code of cityCodes) {
    const f = zip.file(`${code}_lvr_buildcase.csv`);
    if (f) out[code] = parseCsv((await f.async('string')).replace(/^﻿/, ''));
  }
  return out;
}

/** CSV → 建案清單 + 建商 Map；since 為民國 7 碼 */
function extractProjects(csvByCity, since = '1130101') {
  const projects = []; const builders = new Map(); const perCity = {};
  for (const [code, rows] of Object.entries(csvByCity)) {
    const city = CITY_NAMES[code] || code;
    const header = (rows[0] || []).map((h) => h.trim());
    const idx = (h) => header.indexOf(h);
    const I = { town: idx('鄉鎮市區'), name: idx('建案名稱'), loc: idx('坐落街道'), builder: idx('起造人'), hh: idx('層棟戶數'), use: idx('主要用途'), date: idx('申報備查日期'), period: idx('銷售期間'), permit: idx('建造執照'), no: idx('編號') };
    let kept = 0;
    for (const r of rows.slice(2)) {
      if (!r[I.name]) continue;
      let date = (r[I.date] || '').trim();
      if (!/^\d{7}$/.test(date)) date = r.find((v) => /^\d{7}$/.test(String(v).trim()) && Number(v) > 1100000) || '';
      if (!date || date < since) continue;
      const b = parseBuilders(r[I.builder]);
      const period = (r[I.period] || '').replace(/\s+/g, ' ').trim();
      projects.push({
        cityCode: code, city, town: (r[I.town] || '').trim(), name: toHalfWidth(r[I.name]).trim(), location: cleanLocation(r[I.loc]),
        builderText: b.text, builder: b.primary, households: (r[I.hh] || '').trim(), use: (r[I.use] || '').trim(), date, period,
        viaAgency: /代銷[:：](?!無)/.test(period), permit: (r[I.permit] || '').trim(), refNo: (r[I.no] || '').trim(),
      });
      kept += 1;
      for (const c of b.all) {
        const k = nameKey(c);
        if (!builders.has(k)) builders.set(k, { name: c, category: 'builder', city, phone: '', address: '', email: '', website: '', refs: ['內政部備查'] });
      }
    }
    perCity[city] = kept;
  }
  // 同名建案去重（同建商保留最新備查；不同建商加區名）
  const byKey = new Map();
  for (const p of projects) {
    const k = nameKey(p.name);
    const ex = byKey.get(k);
    if (!ex) { byKey.set(k, p); continue; }
    if (nameKey(ex.builder) === nameKey(p.builder) || !p.builder || !ex.builder) { if (p.date > ex.date) byKey.set(k, { ...p, name: ex.name }); continue; }
    const alt = `${p.name}（${p.town}）`; const ak = nameKey(alt);
    if (!byKey.has(ak)) byKey.set(ak, { ...p, name: alt });
  }
  return { projects: Array.from(byKey.values()), builders, perCity };
}

// ---------------------------------------------------------------
// 來源 2：公會會員名錄
// ---------------------------------------------------------------
const ASSOC = {
  redat: { city: '臺北市', category: 'builder', ref: '台北市開發公會' },
  tnh: { city: '臺南市', category: 'builder', ref: '大台南開發公會' },
  edat: { city: '臺南市', category: 'builder', ref: '台南市開發公會' },
  kaoarch: { city: '高雄市', category: 'builder', ref: '高雄市開發公會' },
  ntcsa: { city: '新北市', category: 'agency', ref: '新北市代銷公會' },
  txg: { city: '臺中市', category: 'agency', ref: '台中市代銷公會' },
};

async function scrapeRedat(onPage) {
  const out = [];
  const first = await fetchHtml('https://www.redat.org.tw/about/member');
  const pages = Math.max(1, ...Array.from(first.html.matchAll(/member\?page=(\d+)/g)).map((m) => Number(m[1])));
  for (let p = 1; p <= pages; p += 1) {
    const html = p === 1 ? first.html : (await fetchHtml(`https://www.redat.org.tw/about/member?page=${p}`)).html;
    for (const m of html.matchAll(/<li class="card member-card[\s\S]*?<\/li>\s*<\/ul>[\s\S]*?<\/li>/g)) {
      const card = m[0];
      const name = stripTags((card.match(/card__title">([^<]+)</) || [])[1]);
      if (!name) continue;
      const website = (card.match(/member-card__link[\s\S]*?href="([^"]+)"/) || [])[1] || '';
      const address = stripTags((card.match(/地址 ｜<\/span>\s*([^<]+)</) || [])[1]);
      const email = unesc((card.match(/mailto:([^"?]+)/) || [])[1] || '');
      out.push({ name, website: /google/.test(website) ? '' : website, address, email, phone: '' });
    }
    if (onPage) onPage(p, pages);
    await sleep(250);
  }
  return out;
}
async function scrapeTnh() {
  const out = []; const seen = new Set();
  for (let p = 1; p <= 60; p += 1) {
    const { html } = await fetchHtml(`https://tnh.org.tw/members.asp?iPage=${p}`);
    const blocks = html.split('Num-t2').slice(1);
    let added = 0;
    for (const b of blocks) {
      const name = stripTags((b.match(/<\/span>\.&nbsp;([^<]+)</) || [])[1]);
      if (!name || seen.has(name)) continue;
      seen.add(name);
      const tels = Array.from(b.matchAll(/href="tel:([^"]+)"/g)).map((m) => m[1]);
      const emailM = b.match(/fa-envelope[\s\S]*?<a[^>]*>([^<]+)<\/a>/);
      const email = emailM ? unesc(emailM[1]).replace(/\s+/g, '') : '';
      const address = stripTags((b.match(/maps\.google\.com[^>]*>([^<]+)</) || [])[1]);
      const website = (Array.from(b.matchAll(/href="(https?:\/\/[^"]+)"/g)).map((m) => m[1]).find((u) => !/google\.com|tel:/.test(u))) || '';
      out.push({ name, phone: tels[0] || '', email, address, website }); added += 1;
    }
    if (!added) break;
    await sleep(250);
  }
  return out;
}
async function scrapeEdat() {
  const { html } = await fetchHtml('http://www.edat.org.tw/zh-tw/member_directory.php?page=1');
  const out = [];
  for (const m of html.matchAll(/<div class="box">\s*<a href="([^"]*)"[^>]*title="([^"]+)"[\s\S]*?<div class="tel">([^<]*)<\/div>/g)) {
    out.push({ name: stripTags(m[2]), website: /^https?:/.test(m[1]) ? m[1] : '', phone: m[3].replace(/\s/g, ''), email: '', address: '' });
  }
  return out;
}
async function scrapeKaoarch() {
  const { html } = await fetchHtml('https://www.kaoarch.org.tw/a09.php');
  const out = [];
  for (const m of html.matchAll(/<p class="a02-text"[^>]*>\s*<a([^>]*)>([^<]+)<\/a>/g)) {
    out.push({ name: stripTags(m[2]), website: (m[1].match(/href="([^"]+)"/) || [])[1] || '', phone: '', email: '', address: '' });
  }
  return out;
}
async function scrapeNtcsa() {
  const out = [];
  for (let p = 1; p <= 20; p += 1) {
    const { html } = await fetchHtml(`http://www.ntcsa.org.tw/a/table_blogs/index/22430?page=${p}`);
    const rows = Array.from(html.matchAll(/<tr>([\s\S]*?)<\/tr>/g)).map((m) => Array.from(m[1].matchAll(/<td>[\s\S]*?<a[^>]*>([\s\S]*?)<\/a>/g)).map((x) => stripTags(x[1]))).filter((c) => c.length >= 5);
    if (!rows.length) break;
    for (const c of rows) {
      let phone = c[3] || '';
      if (/^\d{4}-\d{4}$/.test(phone)) phone = `02-${phone}`;
      out.push({ name: c[2], phone, address: c[4] || '', email: '', website: '' });
    }
    await sleep(250);
  }
  return out;
}
async function scrapeTxg() {
  const out = []; const seen = new Set();
  for (let p = 1; p <= 60; p += 1) {
    const { html } = await fetchHtml(`http://www.txgestate.org.tw/a06.php?A_1=57&go_page=${p}`);
    const names = Array.from(html.matchAll(/<span class="label">編號[:：]\s*\d+<\/span>([^<]+)<span/g)).map((m) => stripTags(m[1])).filter((n) => n && !seen.has(n));
    if (!names.length) break;
    for (const name of names) { seen.add(name); out.push({ name, phone: '', address: '', email: '', website: '' }); }
    await sleep(250);
  }
  return out;
}
const ASSOC_FNS = { redat: scrapeRedat, tnh: scrapeTnh, edat: scrapeEdat, kaoarch: scrapeKaoarch, ntcsa: scrapeNtcsa, txg: scrapeTxg };

/**
 * 抓指定縣市／類別的公會名錄
 * @param {string[]} cities 縣市名（臺 字）
 * @param {string[]} categories builder / agency
 * @param {(msg:string)=>void} [onLog]
 */
async function scrapeAssociations(cities, categories, onLog) {
  const all = []; const stats = {};
  for (const [key, meta] of Object.entries(ASSOC)) {
    if (!cities.includes(meta.city) || !categories.includes(meta.category)) continue;
    try {
      const rows = await ASSOC_FNS[key]();
      stats[meta.ref] = rows.length;
      if (onLog) onLog(`${meta.ref}：${rows.length} 筆`);
      for (const r of rows) all.push({ ...r, ...meta, name: toHalfWidth(r.name).trim() });
    } catch (e) { stats[meta.ref] = `失敗：${e.message}`; if (onLog) onLog(`${meta.ref} 失敗：${e.message}`); }
  }
  return { rows: all, stats };
}

/** 合併 CSV 起造人與公會名錄 → 公司清單 */
function mergeCompanies(builders, assocRows) {
  const companies = new Map();
  for (const b of builders.values()) companies.set(`builder|${nameKey(b.name)}`, { ...b, refs: [...b.refs] });
  for (const a of assocRows) {
    if (!a.name || a.name.length < 2) continue;
    const key = `${a.category}|${nameKey(a.name)}`;
    const ex = companies.get(key);
    if (ex) {
      ex.phone = ex.phone || a.phone; ex.address = ex.address || a.address; ex.email = ex.email || a.email; ex.website = ex.website || a.website;
      if (!ex.refs.includes(a.ref)) ex.refs.push(a.ref);
    } else companies.set(key, { name: a.name, category: a.category, city: a.city, phone: a.phone || '', address: a.address || '', email: a.email || '', website: a.website || '', refs: [a.ref] });
  }
  return Array.from(companies.values());
}

// ---------------------------------------------------------------
// 來源 3：官網／Email
// ---------------------------------------------------------------
const BLOCK_HOSTS = /(twincn|alltwcompany|twypage|mygov\.tw|technews|zhupiter|1111\.com|104\.com|518\.com|yes123|aibee|findcompany|opengov|gcis|g0v|591\.com|housefun|rakuya|leju|yungching|sinyi|hbhousing|facebook|instagram|youtube|linkedin|wikipedia|wikiwand|google|apple\.com|yahoo|pchome|ruten|shopee|momo|twitter|threads|tiktok|pixnet|blogspot|wordpress\.com|medium\.com|ltn\.com|udn\.com|chinatimes|ettoday|cna\.com|setn|tvbs|businessweekly|cw\.com|bnext|moneydj|cnyes|twse|mops|ctee|storm\.mg|thenewslens|mirrormedia|upmedia|nownews|amazon|ebay|\.gov\.tw|\.edu\.tw|\.org\.tw|iyp\.com|web66|tnn\.tw|bizpo|compbase|vocus|dcard|ptt\.cc|mobile01|cmoney|wantgoo|goodinfo|histock|agoda|booking\.com|tripadvisor|foodpanda|alibaba|baike|zi\.media|taxid|vat\.tw|companyinfo|twcompany|bizinfo|jobs|hiring|line\.me|zipko|ezprice|kingnet|ihouse|cbay|twyp|yellowpage|taiwanbuying|law\.moj|judicial|tw\.bid|stock\.|blog\.|forum|ipeen|newtalk|rti\.org|pts\.org|ftvnews|ctitv|ebc\.net|nextapple|epochtimes|peoplenews|books\.com|kkday|klook|zhihu|baidu|sohu|163\.com|qq\.com|weibo|xuite|accupass|kktix|gamer)/i;
const BAD_EMAIL = /(example|sentry|wixpress|wix\.com|\.png|\.jpg|\.jpeg|\.gif|\.svg|\.webp|\.js$|\.css$|noreply|no-reply|@localhost|domain\.com|email\.com|yourmail|test@|@\d|\.min\.|webpack|w3\.org|schema|godaddy|cloudflare|googleapis|gstatic|jquery|bootstrap|fontawesome|@2x|@3x|@media|@import|@font|@keyframes|@page|@charset)/i;

function extractEmails(html, hostHint = '') {
  const text = `${html}\n${stripTags(html)}`.replace(/\s*\[at\]\s*|\s*\(at\)\s*/gi, '@').replace(/&#64;|%40/g, '@');
  const found = new Set();
  for (const m of text.matchAll(/[A-Za-z0-9._%+-]+@[A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+)*\.[A-Za-z]{2,6}/g)) {
    const e = m[0].toLowerCase().replace(/^[._-]+/, '');
    if (!isValidEmail(e) || BAD_EMAIL.test(e) || e.length > 60) continue;
    found.add(e);
  }
  const list = Array.from(found);
  const root = hostHint.replace(/^www\./, '').split('.').slice(0, 2).join('.');
  list.sort((a, b) => Number(b.includes(root) && root.length > 3) - Number(a.includes(root) && root.length > 3));
  return list.slice(0, 3);
}

/** Google Programmable Search JSON API */
async function googleSearch(q, { key, cx }) {
  const url = `https://www.googleapis.com/customsearch/v1?key=${encodeURIComponent(key)}&cx=${encodeURIComponent(cx)}&q=${encodeURIComponent(q)}&num=8&gl=tw&hl=zh-TW`;
  const r = await fetchRaw(url, { timeout: 20000, headers: { Accept: 'application/json' } });
  const body = JSON.parse(r.buf.toString('utf8') || '{}');
  if (r.status === 429 || body.error?.code === 429) { const e = new Error('搜尋額度用盡或被限流（429）'); e.code = 429; throw e; }
  if (r.status !== 200) throw new Error(`Google 搜尋 http ${r.status}：${body.error?.message || ''}`.slice(0, 160));
  return (body.items || []).map((it) => it.link).filter(Boolean);
}

function pickOfficialSite(links) {
  for (const u of links) {
    try { const { hostname, protocol } = new URL(u); if (BLOCK_HOSTS.test(hostname) || BLOCK_HOSTS.test(u)) continue; return `${protocol}//${hostname}/`; } catch { /* ignore */ }
  }
  return '';
}

const CONTACT_LINK_RE = /(contact|about|company|service|聯絡|連絡|聯繫|關於|公司簡介|企業|服務)/i;
/** 抓官網首頁＋聯絡頁的公開信箱／電話 */
async function harvestSite(website) {
  const out = { emails: [], phone: '', pages: 0, error: '' };
  let base;
  try { base = new URL(/^https?:/.test(website) ? website : `http://${website.replace(/^\/\//, '')}`); } catch { out.error = 'bad url'; return out; }
  const seen = new Set(); const queue = [base.href];
  while (queue.length && out.pages < 4) {
    const u = queue.shift(); if (seen.has(u)) continue; seen.add(u);
    try {
      const r = await fetchHtml(u, { timeout: FETCH_TIMEOUT });
      if (r.status >= 400) { if (out.pages === 0) out.error = `http ${r.status}`; continue; }
      out.pages += 1;
      for (const e of extractEmails(r.html, base.hostname)) if (!out.emails.includes(e)) out.emails.push(e);
      if (!out.phone) { const pm = stripTags(r.html).match(/(?:\(0\d{1,2}\)|0\d{1,2})[-\s]?\d{3,4}[-\s]?\d{4}/); if (pm) out.phone = pm[0].replace(/\s/g, ''); }
      if (out.emails.length >= 2) break;
      if (out.pages === 1) {
        const cands = [];
        for (const m of r.html.matchAll(/<a[^>]+href="([^"#]+)"[^>]*>([\s\S]*?)<\/a>/g)) {
          if (!CONTACT_LINK_RE.test(`${m[1]} ${stripTags(m[2])}`)) continue;
          try { const abs = new URL(m[1], r.url || u); if (abs.hostname.replace(/^www\./, '') !== base.hostname.replace(/^www\./, '')) continue; if (/\.(pdf|jpg|png|zip)$/i.test(abs.pathname)) continue; cands.push(abs.href); } catch { /* ignore */ }
        }
        for (const c of Array.from(new Set(cands)).slice(0, 3)) queue.push(c);
      }
      await sleep(400);
    } catch (e) { if (out.pages === 0) out.error = e.name === 'AbortError' ? 'timeout' : (e.cause?.code || e.message || '').slice(0, 60); }
  }
  return out;
}

// ---------------------------------------------------------------
// Firestore 寫入（Admin SDK；同名只補空欄，狀態／標籤／聯絡人／備註／紀錄不覆蓋）
// ---------------------------------------------------------------
const PROTECTED = new Set(['status', 'tags', 'contacts', 'memo', 'events', 'emailLogs', 'owner', 'ownerName', 'priority', 'followUpAt']);
function emptyProspect(category) {
  return {
    category, name: '', nameKey: '', companyId: null, companyName: '', region: '', builder: '', agency: '', saleStatus: '',
    phone: '', phoneHousetube: '', phone591: '', receptionAddress: '', siteAddress: '', facebook: '', line: '', website: '', instagram: '',
    resourceType: '', projectsText: '', note: '', contacts: [], status: 'new', tags: [], owner: null, ownerName: '', priority: 0,
    followUpAt: null, memo: '', lastEmailAt: null, lastEmailStatus: null, lastOpenedAt: null, repliedAt: null, emailCount: 0, openCount: 0,
    emailLogs: [], events: [], source: 'web', importBatchId: null,
  };
}
const emailContacts = (p) => (Array.isArray(p.contacts) ? p.contacts : []).filter((c) => isValidEmail(c.email));
function autoTags(p) {
  const tags = new Set(Array.isArray(p.tags) ? p.tags : []);
  const hasEmail = emailContacts(p).length > 0; const hasFb = !!p.facebook;
  if (hasEmail) tags.add('有 Email'); else tags.delete('有 Email');
  if (hasFb) tags.add('有 FB'); else tags.delete('有 FB');
  if (!p.phone && !hasEmail && !hasFb) tags.add('名單不完整'); else tags.delete('名單不完整');
  return Array.from(tags);
}
function resolveCompanyId(builderText, buildersByKey) {
  if (!builderText) return null;
  const candidates = [builderText, stripParens(builderText), parenContent(builderText)].map(nameKey).filter(Boolean);
  for (const k of candidates) if (buildersByKey[k]) return buildersByKey[k];
  for (const [k, id] of Object.entries(buildersByKey)) if (k.length >= 3 && candidates.some((c) => c.includes(k) || k.includes(c))) return id;
  return null;
}

/**
 * 建立寫入器：載入既有 prospects，提供 upsert／flush。
 * @param {import('@google-cloud/firestore').Firestore} db
 * @param {{batchId:string, operator:{key:string,name:string}}} ctx
 */
async function createWriter(db, ctx) {
  const COL = 'prospects';
  const snap = await db.collection(COL).get();
  const byKey = {}; const buildersByKey = {};
  snap.docs.forEach((d) => {
    const p = { id: d.id, ...d.data() };
    const k = p.nameKey || nameKey(p.name);
    byKey[`${p.category}|${k}`] = p;
    if (p.category === 'builder') buildersByKey[k] = p.id;
  });
  const now = new Date();
  let batch = db.batch(); let count = 0; let ops = 0;
  const summary = { builder: { created: 0, updated: 0 }, agency: { created: 0, updated: 0 }, project: { created: 0, updated: 0, linked: 0 } };

  const flush = async () => { if (count) await batch.commit(); ops += count; batch = db.batch(); count = 0; };

  const upsert = async (category, fields, emails, refText) => {
    const key = `${category}|${nameKey(fields.name)}`;
    const ex = byKey[key];
    const contacts = (emails || []).filter(isValidEmail).map((e) => ({ id: genId('c_'), name: '', title: '', email: e, phone: '', line: '', note: refText, isPrimary: false }));
    let result;
    if (ex) {
      const patch = {};
      Object.entries(fields).forEach(([k, v]) => { if (v && !PROTECTED.has(k) && !ex[k]) patch[k] = v; });
      const cur = Array.isArray(ex.contacts) ? [...ex.contacts] : [];
      let changed = false;
      for (const c of contacts) if (!cur.some((x) => String(x.email || '').toLowerCase() === c.email)) { c.isPrimary = cur.length === 0; cur.push(c); changed = true; }
      if (changed) patch.contacts = cur;
      if (fields.companyId && !ex.companyId) { patch.companyId = fields.companyId; patch.companyName = fields.builder || ''; }
      const merged = { ...ex, ...patch, contacts: patch.contacts || cur };
      const tags = autoTags(merged);
      if (JSON.stringify(tags) !== JSON.stringify(ex.tags || [])) patch.tags = tags;
      if (!Object.keys(patch).length) return 'skip';
      patch.updatedAt = now; patch.updatedBy = ctx.operator.key;
      batch.update(db.collection(COL).doc(ex.id), patch); count += 1;
      Object.assign(ex, merged);
      result = 'updated';
    } else {
      if (contacts.length) contacts[0].isPrimary = true;
      const data = {
        ...emptyProspect(category), ...fields, nameKey: nameKey(fields.name), contacts, importBatchId: ctx.batchId,
        events: [{ id: genId('ev_'), type: 'harvested', at: now, by: ctx.operator.key, byName: ctx.operator.name, text: refText, meta: { batchId: ctx.batchId, source: 'web', ref: refText } }],
        createdAt: now, createdBy: ctx.operator.key, updatedAt: now, updatedBy: ctx.operator.key,
      };
      data.tags = autoTags(data);
      const ref = db.collection(COL).doc();
      batch.set(ref, data); count += 1;
      byKey[key] = { id: ref.id, ...data };
      if (category === 'builder') buildersByKey[data.nameKey] = ref.id;
      result = 'created';
    }
    if (summary[category] && result !== 'skip') summary[category][result] += 1;
    if (count >= 400) await flush();
    return result;
  };

  return { upsert, flush, summary, buildersByKey, existingCount: snap.size, ops: () => ops };
}

/** 公司 → prospects 欄位 */
function companyFields(c, extra = {}) {
  const refs = [...(c.refs || [])]; if (extra.emails?.length) refs.push('官網');
  const website = String(c.website || extra.website || '').trim().replace(/^\/\//, 'http://');
  const emails = Array.from(new Set([c.email, ...(extra.emails || [])].filter(Boolean).map((e) => String(e).toLowerCase())));
  return {
    fields: { name: c.name, region: c.city || '', phone: c.phone || extra.phone || '', siteAddress: c.address || '', website, note: `來源：${refs.join('、')}` },
    emails, refText: refs.join('、'),
  };
}
/** 建案 → prospects 欄位 */
function projectFields(p, buildersByKey) {
  const cid = resolveCompanyId(p.builder || p.builderText, buildersByKey);
  const notes = [`備查 ${rocDateText(p.date)}`, p.households ? `戶數 ${p.households}` : '', p.use ? `用途 ${p.use}` : '', p.permit ? `建照 ${p.permit}` : '', p.period ? `銷售期間 ${p.period}` : '', p.builderText !== p.builder ? `起造人 ${p.builderText}` : ''].filter(Boolean);
  return {
    fields: {
      name: p.name, region: `${p.city}${p.town}`, builder: p.builder || p.builderText, companyId: cid, companyName: p.builder || p.builderText,
      agency: p.viaAgency ? '（代銷，名稱未公開）' : '', saleStatus: '預售', siteAddress: p.location ? `${p.city}${p.town}${p.location}` : '', note: notes.join('；'),
    },
    linked: !!cid,
  };
}

/**
 * 階段 1：來源 → 寫入 prospects
 * @param {import('@google-cloud/firestore').Firestore} db
 * @param {{cities:string[], since:string, categories:string[], operator:{key:string,name:string}, batchId:string}} params
 * @param {(patch:object)=>Promise<void>} [report] 進度回報
 */
async function runSources(db, params, report = async () => {}) {
  const cities = params.cities.map(normCity).filter((c) => CITY_CODES[c]);
  const categories = params.categories;
  const since = isoToRoc(params.since);
  const wantProjects = categories.includes('project');
  const wantBuilders = categories.includes('builder');
  const wantAgencies = categories.includes('agency');
  const progress = { stage: 'sources', step: '下載內政部備查建案', perCity: {}, assoc: {} };
  await report({ progress });

  let projects = []; let builders = new Map();
  if (wantProjects || wantBuilders) {
    const zip = await downloadBuildcaseZip();
    const csvs = await readBuildcaseCsvs(zip, cities.map((c) => CITY_CODES[c]));
    const r = extractProjects(csvs, since);
    projects = wantProjects ? r.projects : []; builders = wantBuilders ? r.builders : new Map(); progress.perCity = r.perCity;
  }
  progress.step = '抓公會名錄';
  await report({ progress });
  const assoc = await scrapeAssociations(cities, [wantBuilders && 'builder', wantAgencies && 'agency'].filter(Boolean), null);
  progress.assoc = assoc.stats;
  const companies = mergeCompanies(builders, assoc.rows).filter((c) => isCompanyName(c.name));
  progress.step = '寫入資料庫';
  progress.counts = { projects: projects.length, builders: companies.filter((c) => c.category === 'builder').length, agencies: companies.filter((c) => c.category === 'agency').length };
  await report({ progress });

  const w = await createWriter(db, { batchId: params.batchId, operator: params.operator });
  for (const cat of ['builder', 'agency']) {
    for (const c of companies.filter((x) => x.category === cat)) {
      const { fields, emails, refText } = companyFields(c);
      await w.upsert(cat, fields, emails, refText);
    }
    await w.flush();
  }
  for (const p of projects) {
    const { fields, linked } = projectFields(p, w.buildersByKey);
    const r = await w.upsert('project', fields, [], '內政部預售屋備查');
    if (linked && r !== 'skip') w.summary.project.linked += 1;
  }
  await w.flush();
  progress.step = '完成';
  progress.write = w.summary;
  await report({ progress });
  return { summary: w.summary, counts: progress.counts };
}

/**
 * 階段 2：補官網／Email（分批；每批受時間預算限制）
 * 對象：category builder/agency、無 Email 聯絡人、尚未檢查（harvest.checkedAt 空）。
 * @param {import('@google-cloud/firestore').Firestore} db
 * @param {{cities:string[], categories:string[], operator:{key:string,name:string}, search:{key:string,cx:string}|null, budgetMs:number, searchIntervalMs:number}} params
 * @param {{shouldStop:()=>Promise<boolean>, report:(patch:object)=>Promise<void>}} hooks
 */
async function runEnrichBatch(db, params, hooks) {
  const cities = params.cities.map(normCity);
  const cats = params.categories.filter((c) => c === 'builder' || c === 'agency');
  const started = Date.now();
  const snap = await db.collection('prospects').where('source', '==', 'web').get();
  const targets = snap.docs.map((d) => ({ id: d.id, ...d.data() }))
    .filter((p) => cats.includes(p.category) && cities.includes(normCity(p.region)) && !emailContacts(p).length && !p.harvest?.checkedAt);
  const total = targets.length;
  let done = 0; let found = 0; let lastSearchAt = 0; let stopped = false; let quotaExceeded = false;
  const report = async () => hooks.report({ progress: { stage: 'enrich', total, done, found, searchEnabled: !!params.search, quotaExceeded } });
  await report();

  for (const p of targets) {
    if (Date.now() - started > params.budgetMs) break;
    if (done % 10 === 0 && await hooks.shouldStop()) { stopped = true; break; }
    const harvest = { checkedAt: new Date(), website: p.website || '', emails: [], phone: '', error: '' };
    try {
      if (!harvest.website && params.search && !quotaExceeded) {
        const wait = lastSearchAt + params.searchIntervalMs - Date.now();
        if (wait > 0) await sleep(wait);
        lastSearchAt = Date.now();
        try {
          const links = await googleSearch(p.name, params.search);
          harvest.website = pickOfficialSite(links);
        } catch (e) { if (e.code === 429) { quotaExceeded = true; harvest.error = e.message; } else harvest.error = e.message; }
      }
      if (harvest.website) {
        const r = await harvestSite(harvest.website);
        harvest.emails = r.emails; harvest.phone = r.phone; harvest.error = r.error || harvest.error;
      }
    } catch (e) { harvest.error = String(e.message || e).slice(0, 120); }

    const patch = { harvest, updatedAt: new Date(), updatedBy: params.operator.key };
    if (harvest.website && !p.website) patch.website = harvest.website;
    if (harvest.phone && !p.phone) patch.phone = harvest.phone;
    if (harvest.emails.length) {
      const cur = Array.isArray(p.contacts) ? [...p.contacts] : [];
      harvest.emails.forEach((e, i) => { if (!cur.some((c) => String(c.email || '').toLowerCase() === e)) cur.push({ id: genId('c_'), name: '', title: '', email: e, phone: '', line: '', note: '官網', isPrimary: cur.length === 0 && i === 0 }); });
      patch.contacts = cur;
      patch.tags = autoTags({ ...p, ...patch });
      found += 1;
    }
    await db.collection('prospects').doc(p.id).update(patch);
    done += 1;
    if (done % 10 === 0) await report();
    if (quotaExceeded && !harvest.website) { /* 沒搜尋就沒官網，之後的都跳過搜尋但仍標記已檢查 */ }
  }
  await report();
  const remaining = total - done;
  return { total, done, found, remaining: stopped ? remaining : (Date.now() - started > params.budgetMs ? remaining : 0), stopped, quotaExceeded };
}

module.exports = {
  CITY_NAMES, CITY_CODES, SIX_CITIES,
  nameKey, isCompanyName, parseBuilders, parseCsv, isoToRoc, rocDateText,
  downloadBuildcaseZip, readBuildcaseCsvs, extractProjects, scrapeAssociations, mergeCompanies,
  googleSearch, pickOfficialSite, harvestSite, extractEmails,
  createWriter, companyFields, projectFields, autoTags,
  runSources, runEnrichBatch,
};
