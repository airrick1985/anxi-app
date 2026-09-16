// 用法：node scripts/cleanProspectJunkEmails.mjs [--dry-run]
// 清除誤抓的名錄／平台信箱：移除聯絡人、清掉錯誤官網、重設 harvest 讓下次重跑
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, doc, writeBatch } from 'firebase/firestore';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const core = require('../functions/prospect/harvestCore.js');
const DRY = process.argv.includes('--dry-run');
const app = initializeApp({ apiKey: 'AIzaSyBdE26vC0UAprsdTgBcmYrVuO67ZbccMTA', projectId: 'apps-script-api-443402' });
const db = getFirestore(app, 'anxi-app');
const s = await getDocs(collection(db, 'prospects'));
const junkEmail = (e) => core.BAD_EMAIL.test(String(e || '').toLowerCase());
let affected = 0, removedContacts = 0, clearedSites = 0, requeued = 0;
let batch = writeBatch(db), n = 0;
const flush = async () => { if (n && !DRY) await batch.commit(); batch = writeBatch(db); n = 0; };
const removed = {};
for (const d of s.docs) {
  const p = d.data();
  const contacts = Array.isArray(p.contacts) ? p.contacts : [];
  const keep = contacts.filter((c) => !junkEmail(c.email));
  const siteJunk = core.isDirectorySite(p.website || '') || core.isDirectorySite(p.harvest?.website || '');
  if (keep.length === contacts.length && !siteJunk) continue;
  affected += 1;
  const patch = { updatedAt: new Date(), updatedBy: 'cleanJunkEmails' };
  if (keep.length !== contacts.length) {
    contacts.filter((c) => junkEmail(c.email)).forEach((c) => { removed[c.email] = (removed[c.email] || 0) + 1; });
    removedContacts += contacts.length - keep.length;
    if (keep.length && !keep.some((c) => c.isPrimary)) keep[0].isPrimary = true;
    patch.contacts = keep;
  }
  if (siteJunk) { patch.website = ''; clearedSites += 1; }
  if (p.source === 'web') { patch.harvest = { ...(p.harvest || {}), checkedAt: null, website: '', emails: [], error: 'junk-site' }; requeued += 1; }
  patch.tags = core.autoTags({ ...p, ...patch, contacts: patch.contacts || contacts });
  batch.update(doc(db, 'prospects', d.id), patch); n += 1;
  if (n >= 400) await flush();
}
await flush();
console.log(`${DRY ? '[DRY-RUN] ' : ''}影響名單 ${affected} 筆；移除聯絡人 ${removedContacts}；清掉錯誤官網 ${clearedSites}；重設待補 Email ${requeued}`);
console.log(Object.entries(removed).sort((a, b) => b[1] - a[1]).slice(0, 12));
process.exit(0);
