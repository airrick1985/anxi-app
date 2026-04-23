#!/usr/bin/env node
// 抓取國土測繪中心「代碼服務－地段清單」API，依縣市切片寫入 src/constants/landSections/
//
// API 文件：
//   https://maps.nlsc.gov.tw/demo/COM_005_代碼服務_地段清單_OAS2_V1.yml
// API 端點：
//   GET https://api.nlsc.gov.tw/other/ListLandSection/{cityCode}/{cityCode}{townCode}
//   例：https://api.nlsc.gov.tw/other/ListLandSection/B/B01
// 回傳 XML：
//   <sectItems>
//     <sectItem>
//       <office>BA</office>           地政事務所代碼
//       <officestr>中山</officestr>    事務所名
//       <sectcode>0001</sectcode>     段代碼 4 碼
//       <sectstr>繼光段一小段</sectstr> 段小段名
//     </sectItem>
//   </sectItems>
//
// 使用方式：
//   node scripts/fetch-land-sections.mjs                     # 增量更新（只補缺）
//   node scripts/fetch-land-sections.mjs --force             # 全量重抓
//   node scripts/fetch-land-sections.mjs --city A            # 只抓單一縣市
//   node scripts/fetch-land-sections.mjs --delay 200         # 每筆之間等待毫秒 (預設 150)

import { writeFile, mkdir, readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { pathToFileURL } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const REPO_ROOT = resolve(__dirname, '..');
const OUT_DIR = resolve(REPO_ROOT, 'src/constants/landSections');
const CODE_TABLE_PATH = resolve(REPO_ROOT, 'src/constants/landOfficeCodeTable.js');
const API_BASE = 'https://api.nlsc.gov.tw/other/ListLandSection';
const REQUEST_TIMEOUT_MS = 30_000;
const MAX_RETRY = 3;

function log(...args) { console.log('[fetch-land-sections]', ...args); }
function warn(...args) { console.warn('[fetch-land-sections]', ...args); }

function getArgValue(flag) {
  const i = process.argv.indexOf(flag);
  return i >= 0 ? process.argv[i + 1] : null;
}

async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function fetchXml(url, attempt = 1) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), REQUEST_TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'anxi-app/fetch-land-sections',
        'Accept': 'application/xml, text/xml, */*',
      },
      signal: ctrl.signal,
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.text();
  } catch (err) {
    if (attempt < MAX_RETRY) {
      const backoff = 500 * attempt;
      warn(`  retry (${attempt}/${MAX_RETRY}) after ${backoff}ms: ${err.message}`);
      await sleep(backoff);
      return fetchXml(url, attempt + 1);
    }
    throw err;
  } finally {
    clearTimeout(timer);
  }
}

// 極簡 XML 解析：結構固定，用 regex 夠用
function parseSectionXml(xml) {
  const items = [];
  const re = /<sectItem>([\s\S]*?)<\/sectItem>/g;
  const tag = (chunk, t) => {
    const m = chunk.match(new RegExp(`<${t}>([\\s\\S]*?)<\\/${t}>`));
    return m ? m[1].trim() : '';
  };
  let m;
  while ((m = re.exec(xml))) {
    const chunk = m[1];
    items.push({
      office: tag(chunk, 'office'),
      officeName: tag(chunk, 'officestr'),
      sectCode: tag(chunk, 'sectcode'),
      section: tag(chunk, 'sectstr'),
    });
  }
  return items;
}

async function loadCodeTable() {
  const url = pathToFileURL(CODE_TABLE_PATH).href;
  const mod = await import(url);
  return { CITIES: mod.CITIES, TOWNS: mod.TOWNS };
}

async function main() {
  const force = process.argv.includes('--force');
  const onlyCity = getArgValue('--city');
  const delayMs = Number(getArgValue('--delay')) || 150;

  const { CITIES, TOWNS } = await loadCodeTable();
  log(`載入代碼表: ${CITIES.length} 縣市, ${TOWNS.length} 鄉鎮（含跨所重複）`);

  // 去重 (cityCode, code) — 同一行政區跨多個地政事務所時避免重複呼叫
  const pairSet = new Map();
  for (const t of TOWNS) {
    const key = `${t.cityCode}${t.code}`;
    if (!pairSet.has(key)) pairSet.set(key, { cityCode: t.cityCode, townCode: t.code, townName: t.name });
  }
  let pairs = [...pairSet.values()];
  if (onlyCity) pairs = pairs.filter(p => p.cityCode === onlyCity);
  log(`去重後需查詢: ${pairs.length} 個 (縣市,鄉鎮) 組合`);

  if (!existsSync(OUT_DIR)) await mkdir(OUT_DIR, { recursive: true });

  // 載入既有資料（增量模式用）
  const existing = {};
  if (!force) {
    for (const c of CITIES) {
      const fp = resolve(OUT_DIR, `${c.code}.json`);
      if (existsSync(fp)) {
        try { existing[c.code] = JSON.parse(await readFile(fp, 'utf-8')); }
        catch { existing[c.code] = []; }
      } else {
        existing[c.code] = [];
      }
    }
  }

  // 以 cityCode 分組聚合
  const byCity = new Map();
  for (const c of CITIES) byCity.set(c.code, []);

  let done = 0, failed = 0, skipped = 0;
  const failedList = [];
  const t0 = Date.now();

  for (const p of pairs) {
    done++;
    const url = `${API_BASE}/${p.cityCode}/${p.cityCode}${p.townCode}`;

    // 增量模式：若該鄉鎮已有資料則跳過
    if (!force && existing[p.cityCode]?.some(r => r.townCode === p.townCode)) {
      skipped++;
      byCity.get(p.cityCode).push(...existing[p.cityCode].filter(r => r.townCode === p.townCode));
      continue;
    }

    try {
      const xml = await fetchXml(url);
      const items = parseSectionXml(xml);
      for (const it of items) {
        byCity.get(p.cityCode).push({
          townCode: p.townCode,
          townName: p.townName,
          office: it.office,
          officeName: it.officeName,
          sectCode: it.sectCode,
          section: it.section,
        });
      }
      if (done % 20 === 0 || items.length > 0) {
        const pct = ((done / pairs.length) * 100).toFixed(1);
        log(`  [${done}/${pairs.length}] ${pct}%  ${p.cityCode}${p.townCode} ${p.townName} → ${items.length} 段`);
      }
    } catch (err) {
      failed++;
      failedList.push({ ...p, error: err.message });
      warn(`  FAIL ${p.cityCode}${p.townCode} ${p.townName}: ${err.message}`);
    }

    if (delayMs > 0) await sleep(delayMs);
  }

  const summary = [];
  for (const c of CITIES) {
    const items = byCity.get(c.code) || [];
    items.sort((a, b) =>
      a.townCode.localeCompare(b.townCode) ||
      a.sectCode.localeCompare(b.sectCode));
    const body = JSON.stringify(items);
    await writeFile(resolve(OUT_DIR, `${c.code}.json`), body + '\n', 'utf-8');
    summary.push({ city: `${c.code} ${c.name}`, sections: items.length, sizeKB: +(body.length / 1024).toFixed(1) });
  }

  const metaOut = {
    source: 'NLSC 國土測繪中心 - 代碼服務·地段清單',
    apiBase: API_BASE,
    fetchedAt: new Date().toISOString(),
    totalSections: summary.reduce((s, x) => s + x.sections, 0),
    pairsQueried: pairs.length,
    pairsFailed: failed,
    pairsSkipped: skipped,
    failedPairs: failedList,
    cities: summary,
  };
  await writeFile(resolve(OUT_DIR, '_meta.json'), JSON.stringify(metaOut, null, 2) + '\n', 'utf-8');

  const elapsed = ((Date.now() - t0) / 1000).toFixed(1);
  log(`--- summary (耗時 ${elapsed}s) ---`);
  console.table(summary);
  log(`完成: 總 ${metaOut.totalSections} 筆段小段，寫入 ${OUT_DIR}`);
  if (failed > 0) log(`失敗 ${failed} 筆，詳見 _meta.json 的 failedPairs`);
}

main().catch((err) => {
  console.error('[fetch-land-sections] FAILED:', err?.message || err);
  if (err?.stack) console.error(err.stack.split('\n').slice(1, 4).join('\n'));
  process.exit(1);
});
