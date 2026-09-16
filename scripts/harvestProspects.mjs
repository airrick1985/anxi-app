/**
 * 客戶開發名單網路蒐集腳本（本機版）→ Firestore `prospects`
 * 解析／抓取邏輯共用 functions/prospect/harvestCore.js；前端「網路蒐集」按鈕走同一套規則（Cloud Functions 背景執行）。
 *
 * 用法（專案根目錄）：
 *   node scripts/harvestProspects.mjs --stage sources            # 下載 CSV、抓公會名錄 → cache
 *   node scripts/harvestProspects.mjs --stage enrich [--limit 200] # 找官網／Email（可中斷續跑）
 *   node scripts/harvestProspects.mjs --stage write [--dry-run]  # 去重寫入 Firestore
 *   node scripts/harvestProspects.mjs --stage all
 *
 * 選項：--cities 臺北市,新北市（預設六都）--since 2024-01-01 --categories project,builder,agency
 *       --no-search（不用搜尋引擎）--limit N（enrich 每次處理筆數）--dry-run
 * 找官網需環境變數 GOOGLE_CSE_KEY / GOOGLE_CSE_CX（Google Programmable Search）；沒有就只對已知官網抓信箱。
 *
 * 快取目錄：docs/local/客戶開發/harvest/（已 gitignore）
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, doc, writeBatch } from 'firebase/firestore';

const require = createRequire(import.meta.url);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const core = require(path.join(ROOT, 'functions/prospect/harvestCore.js'));
const CACHE = path.join(ROOT, 'docs/local/客戶開發/harvest');
fs.mkdirSync(CACHE, { recursive: true });

const argv = process.argv.slice(2);
const opt = (name, def) => { const i = argv.indexOf(`--${name}`); return i >= 0 && argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[i + 1] : def; };
const flag = (name) => argv.includes(`--${name}`);
const STAGE = opt('stage', 'all');
const CITIES = opt('cities', core.SIX_CITIES.join(',')).split(',').map((s) => s.replace(/台/g, '臺').trim()).filter((c) => core.CITY_CODES[c]);
const SINCE = opt('since', '2024-01-01');
const CATEGORIES = opt('categories', 'project,builder,agency').split(',').map((s) => s.trim());
const LIMIT = Number(opt('limit', '0')) || 0;
const DRY = flag('dry-run');
const NO_SEARCH = flag('no-search');
const SEARCH = process.env.GOOGLE_CSE_KEY && process.env.GOOGLE_CSE_CX ? { key: process.env.GOOGLE_CSE_KEY, cx: process.env.GOOGLE_CSE_CX } : null;

const log = (...a) => console.log(new Date().toISOString().slice(11, 19), ...a);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const readJson = (f, def) => { const p = path.join(CACHE, f); return fs.existsSync(p) ? JSON.parse(fs.readFileSync(p, 'utf8')) : def; };
const writeJson = (f, data) => fs.writeFileSync(path.join(CACHE, f), JSON.stringify(data, null, 1));
const { nameKey, isCompanyName } = core;

// ---------------------------------------------------------------
async function stageSources() {
  log('=== Stage sources ===', CITIES.join('、'), `since ${SINCE}`);
  const zipPath = path.join(CACHE, 'lvr_buildcasecsv.zip');
  if (!fs.existsSync(zipPath) || Date.now() - fs.statSync(zipPath).mtimeMs > 7 * 86400e3) {
    log('下載內政部預售屋備查建案 CSV…');
    fs.writeFileSync(zipPath, await core.downloadBuildcaseZip());
  }
  const csvs = await core.readBuildcaseCsvs(fs.readFileSync(zipPath), CITIES.map((c) => core.CITY_CODES[c]));
  const { projects, builders, perCity } = core.extractProjects(csvs, core.isoToRoc(SINCE));
  Object.entries(perCity).forEach(([c, n]) => log(`  [${c}] 建案 ${n} 筆`));
  const assoc = await core.scrapeAssociations(CITIES, CATEGORIES.filter((c) => c !== 'project'), (m) => log(`  ${m}`));
  const companies = core.mergeCompanies(CATEGORIES.includes('builder') ? builders : new Map(), assoc.rows).filter((c) => isCompanyName(c.name));
  writeJson('projects.json', CATEGORIES.includes('project') ? projects : []);
  writeJson('companies.json', companies);
  const stat = (cat) => companies.filter((c) => c.category === cat);
  log(`建案 ${projects.length}；建商 ${stat('builder').length}（有 Email ${stat('builder').filter((c) => c.email).length}、有官網 ${stat('builder').filter((c) => c.website).length}）；代銷 ${stat('agency').length}`);
}

// ---------------------------------------------------------------
async function stageEnrich() {
  log('=== Stage enrich ===');
  const companies = readJson('companies.json', []);
  const enrich = readJson('enrich.json', {});
  const useSearch = !NO_SEARCH && !!SEARCH;
  const todo = companies.filter((c) => !c.email && isCompanyName(c.name) && !(enrich[`${c.category}|${nameKey(c.name)}`] || {}).done && (useSearch || c.website));
  log(`待處理 ${todo.length} / ${companies.length} 家${LIMIT ? `（本次 ${LIMIT}）` : ''}${useSearch ? '（Google 搜尋找官網）' : '（僅已知官網，不搜尋）'}`);
  let n = 0; let hits = 0; let lastSearchAt = 0;
  for (const c of todo) {
    if (LIMIT && n >= LIMIT) break;
    const key = `${c.category}|${nameKey(c.name)}`;
    const rec = enrich[key] || { website: c.website || '', emails: [], phone: '' };
    try {
      if (!rec.website && useSearch) {
        const wait = lastSearchAt + 700 - Date.now(); if (wait > 0) await sleep(wait);
        lastSearchAt = Date.now();
        const links = await core.googleSearch(c.name, SEARCH);
        rec.searchLinks = links.slice(0, 6);
        rec.website = core.pickOfficialSite(links);
      }
      if (rec.website) {
        const r = await core.harvestSite(rec.website);
        rec.emails = r.emails; rec.phone = r.phone; rec.siteError = r.error; rec.pages = r.pages;
        if (r.emails.length) hits += 1;
      }
      rec.done = true; rec.at = new Date().toISOString();
    } catch (e) {
      rec.error = String(e.message || e).slice(0, 120);
      if (e.code === 429) { log('搜尋額度用盡／限流，結束本次 enrich'); enrich[key] = rec; break; }
      rec.done = true;
    }
    enrich[key] = rec; n += 1;
    if (n % 10 === 0) { writeJson('enrich.json', enrich); log(`  ${n}/${LIMIT || todo.length}　找到 Email ${hits} 家　最近：${c.name} → ${rec.website || '(無官網)'} ${rec.emails?.join(',') || ''}`); }
  }
  writeJson('enrich.json', enrich);
  const withEmail = companies.filter((c) => c.email || (enrich[`${c.category}|${nameKey(c.name)}`] || {}).emails?.length).length;
  log(`本次處理 ${n} 家，找到 Email ${hits} 家；累計有 Email ${withEmail} / ${companies.length}`);
}

// ---------------------------------------------------------------
// 寫入（client SDK 版；欄位規則同 harvestCore.createWriter）
// ---------------------------------------------------------------
const PROTECTED = new Set(['status', 'tags', 'contacts', 'memo', 'events', 'emailLogs', 'owner', 'ownerName', 'priority', 'followUpAt']);
const genId = (p = '') => `${p}${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
const isValidEmail = (e) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(e || '').trim());

async function stageWrite() {
  log(`=== Stage write ${DRY ? '(DRY-RUN)' : ''} ===`);
  const projects = readJson('projects.json', []);
  const companies = readJson('companies.json', []);
  const enrich = readJson('enrich.json', {});
  const app = initializeApp({ apiKey: 'AIzaSyBdE26vC0UAprsdTgBcmYrVuO67ZbccMTA', projectId: 'apps-script-api-443402' });
  const db = getFirestore(app, 'anxi-app');
  const COL = 'prospects';
  const snap = await getDocs(collection(db, COL));
  const existing = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  log(`目前 prospects：${existing.length} 筆`);
  const byKey = {}; const buildersByKey = {};
  existing.forEach((p) => { const k = p.nameKey || nameKey(p.name); byKey[`${p.category}|${k}`] = p; if (p.category === 'builder') buildersByKey[k] = p.id; });

  const batchId = genId('web_'); const now = new Date(); const OPERATOR = { key: 'script', name: '網路蒐集腳本' };
  const summary = { builder: { created: 0, updated: 0 }, agency: { created: 0, updated: 0 }, project: { created: 0, updated: 0, linked: 0 } };
  let batch = writeBatch(db); let count = 0; let ops = 0;
  const flush = async () => { if (count && !DRY) await batch.commit(); ops += count; batch = writeBatch(db); count = 0; };
  const emptyProspect = (category) => ({
    category, name: '', nameKey: '', companyId: null, companyName: '', region: '', builder: '', agency: '', saleStatus: '',
    phone: '', phoneHousetube: '', phone591: '', receptionAddress: '', siteAddress: '', facebook: '', line: '', website: '', instagram: '',
    resourceType: '', projectsText: '', note: '', contacts: [], status: 'new', tags: [], owner: null, ownerName: '', priority: 0,
    followUpAt: null, memo: '', lastEmailAt: null, lastEmailStatus: null, lastOpenedAt: null, repliedAt: null, emailCount: 0, openCount: 0,
    emailLogs: [], events: [], source: 'web', importBatchId: null,
  });

  const upsert = async (category, fields, emails, refText) => {
    const key = `${category}|${nameKey(fields.name)}`;
    const ex = byKey[key];
    const contacts = emails.filter(isValidEmail).map((e) => ({ id: genId('c_'), name: '', title: '', email: e, phone: '', line: '', note: refText, isPrimary: false }));
    if (ex) {
      const patch = {};
      Object.entries(fields).forEach(([k, v]) => { if (v && !PROTECTED.has(k) && !ex[k]) patch[k] = v; });
      const cur = Array.isArray(ex.contacts) ? [...ex.contacts] : [];
      let changed = false;
      for (const c of contacts) if (!cur.some((x) => String(x.email || '').toLowerCase() === c.email)) { c.isPrimary = cur.length === 0; cur.push(c); changed = true; }
      if (changed) patch.contacts = cur;
      if (fields.companyId && !ex.companyId) { patch.companyId = fields.companyId; patch.companyName = fields.builder || ''; }
      const merged = { ...ex, ...patch, contacts: patch.contacts || cur };
      const tags = core.autoTags(merged);
      if (JSON.stringify(tags) !== JSON.stringify(ex.tags || [])) patch.tags = tags;
      if (!Object.keys(patch).length) return 'skip';
      patch.updatedAt = now; patch.updatedBy = OPERATOR.key;
      batch.update(doc(db, COL, ex.id), patch); count += 1;
      Object.assign(ex, merged);
      return 'updated';
    }
    if (contacts.length) contacts[0].isPrimary = true;
    const data = {
      ...emptyProspect(category), ...fields, nameKey: nameKey(fields.name), contacts, importBatchId: batchId,
      events: [{ id: genId('ev_'), type: 'harvested', at: now, by: OPERATOR.key, byName: OPERATOR.name, text: refText, meta: { batchId, source: 'web', ref: refText } }],
      createdAt: now, createdBy: OPERATOR.key, updatedAt: now, updatedBy: OPERATOR.key,
    };
    data.tags = core.autoTags(data);
    const ref = doc(collection(db, COL));
    batch.set(ref, data); count += 1;
    byKey[key] = { id: ref.id, ...data };
    if (category === 'builder') buildersByKey[data.nameKey] = ref.id;
    return 'created';
  };

  for (const cat of ['builder', 'agency']) {
    for (const c of companies.filter((x) => x.category === cat)) {
      const en = enrich[`${cat}|${nameKey(c.name)}`] || {};
      const { fields, emails, refText } = core.companyFields(c, en);
      const r = await upsert(cat, fields, emails, refText);
      if (r !== 'skip') summary[cat][r] += 1;
      if (count >= 400) await flush();
    }
    await flush();
  }
  for (const p of projects) {
    const { fields, linked } = core.projectFields(p, buildersByKey);
    const r = await upsert('project', fields, [], '內政部預售屋備查');
    if (r !== 'skip') { summary.project[r] += 1; if (linked) summary.project.linked += 1; }
    if (count >= 400) await flush();
  }
  await flush();
  log('結果：', JSON.stringify(summary), `寫入操作 ${ops} 筆${DRY ? '（未實際寫入）' : ''}`);
  if (!DRY) {
    const hist = readJson('write-history.json', []);
    hist.push({ batchId, at: now.toISOString(), source: 'web', summary, cities: CITIES, since: SINCE });
    writeJson('write-history.json', hist);
  }
}

const main = async () => {
  if (STAGE === 'sources' || STAGE === 'all') await stageSources();
  if (STAGE === 'enrich' || STAGE === 'all') await stageEnrich();
  if (STAGE === 'write' || STAGE === 'all') await stageWrite();
  process.exit(0);
};
main().catch((e) => { console.error(e); process.exit(1); });
