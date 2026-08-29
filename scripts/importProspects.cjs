/**
 * 客戶開發名單 Excel → Firestore `prospects` 匯入腳本（docs/SPEC_CustomerProspecting.md §5.1 同邏輯的 Node 版）
 *
 * 用法（專案根目錄）：
 *   NODE_PATH=functions/node_modules node scripts/importProspects.cjs "docs/local/廣告投放/新竹建案廣告投放名單.xlsx" [--dry-run] [--overwrite]
 *
 * 需要 Application Default Credentials（gcloud auth application-default login）。
 * 同類別同名 → 更新（預設只填補空欄位）；狀態／標籤／聯絡人／備註／紀錄不覆蓋。
 */
const path = require('path');
const XLSX = require('xlsx');
const { Firestore, FieldValue } = require('@google-cloud/firestore');

const args = process.argv.slice(2);
const file = args.find((a) => !a.startsWith('--'));
const dryRun = args.includes('--dry-run');
const overwrite = args.includes('--overwrite');
if (!file) { console.error('請指定 xlsx 路徑'); process.exit(1); }

const db = new Firestore({ projectId: 'apps-script-api-443402', databaseId: 'anxi-app' });
const COL = 'prospects';
const OPERATOR = { key: 'script', name: '匯入腳本' };
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// ---- 與 prospectService.js 相同的工具 ----
const toHalfWidth = (s) => String(s || '').replace(/[！-～]/g, (ch) => String.fromCharCode(ch.charCodeAt(0) - 0xFEE0)).replace(/　/g, ' ');
const nameKey = (name) => toHalfWidth(name).replace(/[（(]/g, '(').replace(/[）)]/g, ')').replace(/[\s·．・•]/g, '').toLowerCase();
const stripParens = (n) => String(n || '').replace(/[（(][^）)]*[）)]/g, '').trim();
const parenContent = (n) => { const m = String(n || '').match(/[（(]([^）)]*)[）)]/); return m ? m[1].trim() : ''; };
const genId = (p = '') => `${p}${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
const isValidEmail = (e) => EMAIL_RE.test(String(e || '').trim());

function detectSheetCategory(n) {
  n = String(n || '');
  if (/建案/.test(n)) return 'project';
  if (/建商|建設/.test(n)) return 'builder';
  if (/代銷/.test(n)) return 'agency';
  if (/公會|平台|社群/.test(n)) return 'resource';
  return null;
}

const SHEET_COLUMN_MAP = {
  project: [
    ['建案名稱', 'name'], ['區域', 'region'], ['建設公司', 'builder'], ['代銷/企劃銷售', 'agency'], ['代銷', 'agency'],
    ['狀態_銷售', 'saleStatus'], ['銷售狀態', 'saleStatus'], ['狀態', 'saleStatus'], ['建案直撥電話', 'phone'], ['電話', 'phone'], ['房地王轉接', 'phoneHousetube'], ['591轉接', 'phone591'],
    ['接待中心地址', 'receptionAddress'], ['基地地址', 'siteAddress'], ['FB 粉專', 'facebook'], ['FB粉專', 'facebook'], ['FB', 'facebook'],
    ['LINE', 'line'], ['Email', '_email'], ['官網/來源', 'website'], ['官網', 'website'], ['備註', 'note'],
  ],
  builder: [
    ['建設公司', 'name'], ['公司名稱', 'name'], ['名稱', 'name'], ['電話', 'phone'], ['地址', 'siteAddress'], ['Email', '_email'],
    ['FB 粉專', 'facebook'], ['FB粉專', 'facebook'], ['FB', 'facebook'], ['LINE', 'line'], ['IG / 其他', 'instagram'], ['IG', 'instagram'],
    ['官網', 'website'], ['在售新竹建案', 'projectsText'], ['在售建案', 'projectsText'], ['備註', 'note'],
  ],
  agency: [
    ['代銷/企劃銷售公司', 'name'], ['代銷公司', 'name'], ['公司名稱', 'name'], ['名稱', 'name'], ['電話', 'phone'],
    ['LINE / 官網', '_lineOrWeb'], ['LINE', 'line'], ['官網', 'website'], ['Email', '_email'],
    ['負責新竹建案', 'projectsText'], ['負責建案', 'projectsText'], ['備註', 'note'],
  ],
  resource: [
    ['名稱', 'name'], ['類型', 'resourceType'], ['電話', 'phone'], ['Email', '_email'], ['地址', 'siteAddress'],
    ['連結', 'website'], ['官網', 'website'], ['說明', 'note'], ['備註', 'note'], ['FB', 'facebook'], ['LINE', 'line'],
  ],
};
const PROTECTED = new Set(['status', 'tags', 'contacts', 'memo', 'events', 'emailLogs', 'owner', 'ownerName', 'priority', 'followUpAt']);

function mapSheetRows(category, rows) {
  const map = SHEET_COLUMN_MAP[category];
  const out = []; const errors = [];
  rows.forEach((raw, idx) => {
    const rec = {}; let email = ''; let lineOrWeb = '';
    for (const [header, field] of map) {
      const key = Object.keys(raw).find((k) => nameKey(k) === nameKey(header));
      if (key == null) continue;
      const val = String(raw[key] ?? '').trim();
      if (!val) continue;
      if (field === '_email') email = val;
      else if (field === '_lineOrWeb') lineOrWeb = val;
      else if (rec[field] == null) rec[field] = val;
    }
    if (lineOrWeb) {
      lineOrWeb.split(/[；;]/).map((s) => s.trim()).filter(Boolean).forEach((p) => {
        if (/^https?:\/\//i.test(p) || /\.(tw|com|net|org)/i.test(p)) { if (!rec.website) rec.website = p; } else if (!rec.line) rec.line = p;
      });
    }
    if (!rec.name) { errors.push({ row: idx + 2, message: '缺少名稱' }); return; }
    rec.category = category; rec._email = email;
    out.push(rec);
  });
  return { rows: out, errors };
}

function resolveCompanyId(builderText, buildersByKey) {
  if (!builderText) return null;
  const candidates = [builderText, stripParens(builderText), parenContent(builderText)].map(nameKey).filter(Boolean);
  for (const k of candidates) if (buildersByKey[k]) return buildersByKey[k];
  for (const [k, id] of Object.entries(buildersByKey)) {
    if (k.length >= 3 && candidates.some((c) => c.includes(k) || k.includes(c))) return id;
  }
  return null;
}

function emailContacts(p) { return (Array.isArray(p.contacts) ? p.contacts : []).filter((c) => isValidEmail(c.email)); }
function autoTags(p) {
  const tags = new Set(Array.isArray(p.tags) ? p.tags : []);
  const hasEmail = emailContacts(p).length > 0; const hasFb = !!p.facebook;
  hasEmail ? tags.add('有 Email') : tags.delete('有 Email');
  hasFb ? tags.add('有 FB') : tags.delete('有 FB');
  (!p.phone && !hasEmail && !hasFb) ? tags.add('名單不完整') : tags.delete('名單不完整');
  return Array.from(tags);
}

function emptyProspect(category) {
  return {
    category, name: '', nameKey: '', companyId: null, companyName: '', region: '', builder: '', agency: '', saleStatus: '',
    phone: '', phoneHousetube: '', phone591: '', receptionAddress: '', siteAddress: '', facebook: '', line: '', website: '', instagram: '',
    resourceType: '', projectsText: '', note: '', contacts: [], status: 'new', tags: [], owner: null, ownerName: '', priority: 0,
    followUpAt: null, memo: '', lastEmailAt: null, lastEmailStatus: null, lastOpenedAt: null, repliedAt: null, emailCount: 0, openCount: 0,
    emailLogs: [], events: [], source: 'excel', importBatchId: null,
  };
}

async function main() {
  const wb = XLSX.readFile(path.resolve(file));
  const sheets = wb.SheetNames.map((name) => {
    const category = detectSheetCategory(name);
    if (!category) return null;
    const raw = XLSX.utils.sheet_to_json(wb.Sheets[name], { defval: '' });
    const { rows, errors } = mapSheetRows(category, raw);
    return { name, category, rows, errors };
  }).filter(Boolean);
  const order = ['builder', 'agency', 'resource', 'project'];
  sheets.sort((a, b) => order.indexOf(a.category) - order.indexOf(b.category));

  const snap = await db.collection(COL).get();
  const existing = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  console.log(`目前 prospects：${existing.length} 筆；檔案：${file}；${dryRun ? 'DRY-RUN' : '寫入'}${overwrite ? '（覆蓋既有欄位）' : ''}`);

  const byKey = {}; const buildersByKey = {};
  existing.forEach((p) => {
    const k = p.nameKey || nameKey(p.name);
    byKey[`${p.category}|${k}`] = p;
    if (p.category === 'builder') buildersByKey[k] = p.id;
  });

  const batchId = genId('imp_');
  const now = new Date();
  const summary = {};
  let batch = db.batch(); let count = 0;
  const flush = async () => { if (count && !dryRun) await batch.commit(); batch = db.batch(); count = 0; };

  for (const s of sheets) {
    summary[s.category] = { created: 0, updated: 0, skipped: s.errors.length, linked: 0 };
    for (const row of s.rows) {
      const key = `${s.category}|${nameKey(row.name)}`;
      const { _email, ...fields } = row;
      const ex = byKey[key];
      if (s.category === 'project') {
        const cid = resolveCompanyId(fields.builder, buildersByKey);
        if (cid) { fields.companyId = cid; summary.project.linked += 1; }
      }
      const contact = _email && isValidEmail(_email) ? { id: genId('c_'), name: '', title: '', email: _email, phone: '', line: '', note: '', isPrimary: true } : null;

      if (ex) {
        const patch = {};
        Object.entries(fields).forEach(([k, v]) => { if (!PROTECTED.has(k) && (overwrite || !ex[k])) patch[k] = v; });
        const contacts = Array.isArray(ex.contacts) ? [...ex.contacts] : [];
        if (contact && !contacts.some((c) => String(c.email || '').toLowerCase() === _email.toLowerCase())) {
          contact.isPrimary = contacts.length === 0; contacts.push(contact); patch.contacts = contacts;
        }
        if (fields.companyId && !ex.companyId) patch.companyId = fields.companyId;
        if (patch.companyId) patch.companyName = fields.builder || ex.builder || '';
        const merged = { ...ex, ...patch, contacts: patch.contacts || contacts };
        patch.tags = autoTags(merged);
        patch.nameKey = nameKey(ex.name);
        patch.updatedAt = now; patch.updatedBy = OPERATOR.key; patch.importBatchId = batchId;
        batch.update(db.collection(COL).doc(ex.id), patch);
        summary[s.category].updated += 1;
        Object.assign(ex, merged);
      } else {
        const data = {
          ...emptyProspect(s.category), ...fields,
          nameKey: nameKey(row.name),
          companyName: s.category === 'project' ? (fields.builder || '') : '',
          contacts: contact ? [contact] : [],
          importBatchId: batchId,
          events: [{ id: genId('ev_'), type: 'imported', at: now, by: OPERATOR.key, byName: OPERATOR.name, text: '', meta: { batchId, file: path.basename(file) } }],
          createdAt: now, createdBy: OPERATOR.key, updatedAt: now, updatedBy: OPERATOR.key,
        };
        data.tags = autoTags(data);
        const ref = db.collection(COL).doc();
        batch.set(ref, data);
        summary[s.category].created += 1;
        byKey[key] = { id: ref.id, ...data };
        if (s.category === 'builder') buildersByKey[data.nameKey] = ref.id;
      }
      count += 1;
      if (count >= 400) await flush();
    }
    await flush();
    s.errors.forEach((e) => console.warn(`  [${s.name}] 第 ${e.row} 列略過：${e.message}`));
  }

  if (!dryRun) {
    await db.collection('prospectImports').add({
      id: batchId, fileName: path.basename(file), sheetSummary: summary, errors: sheets.flatMap((s) => s.errors.map((e) => ({ sheet: s.category, ...e }))),
      overwrite, createdBy: OPERATOR.key, createdByName: OPERATOR.name, createdAt: now,
    });
  }
  console.table(summary);
  console.log(dryRun ? 'DRY-RUN 完成（未寫入）' : `匯入完成，batchId=${batchId}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
