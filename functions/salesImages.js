/**
 * 銷控圖片管理後端（建案設定「銷控圖片管理」）
 *
 * - saveSalesImage：新增或替換一張圖片（上傳檔案＋寫入中繼資料；替換時刪除舊檔）
 * - renameSalesImage：更名，並同步更新戶別 salesImages 引用的名稱
 * - setSalesImagePanorama：手動指定全景類型（自動辨識錯誤時）
 * - updateSalesImageUnits：批次加入／移出戶別引用
 * - deleteSalesImages：批次刪除（中繼資料＋檔案）
 *
 * 戶別以「圖片名稱」引用圖片（salesHouseholds.salesImages），文件 ID 為 {projectId}_{imageName}。
 * 每次上傳都寫入新的檔案路徑，網址不重複，可長期快取；替換後各頁不會再看到舊圖。
 *
 * 一次改到很多戶時不逐戶同步 Google Sheet（每戶 3 次 API 會超過配額，且每失敗一戶就寄一封通知信），
 * 改在戶別留標記讓觸發器略過，寫完全量同步一次（utils/sheetSyncSkip.js）。
 */

const { HttpsError } = require('firebase-functions/v2/https');
// onCall 執行前先擋下已停用的操作者（人員管理一鍵停用）
const { onCall } = require('./utils/accountGuard');
const { Firestore, FieldValue } = require('@google-cloud/firestore');
const admin = require('firebase-admin');
const { SHEET_SYNC_SKIP_FIELD, newSheetSyncBatchId } = require('./utils/sheetSyncSkip');

const MAX_BYTES = 1024 * 1024;
// 全景圖（360° 環景／長條全景）放寬上限，放大瀏覽才看得清楚；規則需與 src/utils/panorama.js 一致
const PANORAMA_MAX_BYTES = 4 * 1024 * 1024;
const PANORAMA_TYPES = ['sphere', 'strip', 'none'];
const PANORAMA_MIN_RATIO = 1.9;
const MAX_NAME_LENGTH = 80;
const MAX_BATCH_DELETE = 200;
const BATCH_WRITE_LIMIT = 450;
const MAX_UNIT_CHANGES = 5000;
const MAX_NAMES_PER_UNIT = 200;
const MAX_REF_NAME_LENGTH = 300; // 引用名稱可能是改版前的舊名，只擋異常長度
const SHEET_SYNC_EACH_LIMIT = 10; // 不超過此戶數維持逐戶同步
const CONTENT_TYPES = ['image/png', 'image/jpeg', 'image/webp'];

function requireProjectId(value) {
  const id = typeof value === 'string' ? value.trim() : '';
  if (!id || id.length > 100 || /[/\\]/.test(id)) {
    throw new HttpsError('invalid-argument', '建案識別不正確。');
  }
  return id;
}

// 圖片名稱：會成為文件 ID 的一部分，也會出現在戶別匯入的逗號分隔欄位
function normalizeImageName(value) {
  const name = String(value ?? '').replace(/\s+/g, ' ').trim();
  if (!name) throw new HttpsError('invalid-argument', '請輸入圖片名稱。');
  if (name.length > MAX_NAME_LENGTH) throw new HttpsError('invalid-argument', `圖片名稱不可超過 ${MAX_NAME_LENGTH} 字。`);
  if (/[/\\,，]/.test(name)) throw new HttpsError('invalid-argument', '圖片名稱不可包含 / \\ 或逗號。');
  if (/^__.*__$/.test(name) || name === '.' || name === '..') throw new HttpsError('invalid-argument', '圖片名稱不可使用。');
  return name;
}

function imageDocId(projectId, imageName) {
  return `${projectId}_${imageName}`;
}

function storagePrefix(projectId) {
  return `projects/${projectId}/salesImages/`;
}

function buildStoragePath(projectId, fileName, now = Date.now()) {
  const safe = String(fileName || 'image')
    .replace(/[\u0000-\u001f/\\#?[\]*]/g, '_')
    .slice(-120) || 'image';
  return `${storagePrefix(projectId)}${now}_${safe}`;
}

// 只刪除銷控圖片目錄底下的檔案（舊資料的 storagePath 由前端寫入，不可盲信）
function isSalesImagePath(path, projectId) {
  if (typeof path !== 'string' || !path || path.includes('..')) return false;
  if (projectId) return path.startsWith(storagePrefix(projectId));
  return /^projects\/[^/]+\/salesImages\/[^/]/.test(path);
}

function sniffContentType(buffer) {
  if (buffer.length >= 8 && buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47) return 'image/png';
  if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) return 'image/jpeg';
  if (buffer.length >= 12 && buffer.toString('ascii', 0, 4) === 'RIFF' && buffer.toString('ascii', 8, 12) === 'WEBP') return 'image/webp';
  return null;
}

function dimension(value) {
  const n = Math.round(Number(value));
  return Number.isFinite(n) && n > 0 && n <= 50000 ? n : null;
}

// 全景類型：前端上傳時判斷（或手動指定）；沒帶或不認得的值回傳 null
function panoramaType(value) {
  return PANORAMA_TYPES.includes(value) ? value : null;
}

// 夠寬的圖才可能是全景
function isWide(width, height) {
  return width > 0 && height > 0 && width / height >= PANORAMA_MIN_RATIO;
}

// 戶別引用的名稱陣列：舊名換成新名（保留順序、去除重複）
function renameInList(list, oldName, newName) {
  const out = [];
  for (const name of Array.isArray(list) ? list : []) {
    const next = name === oldName ? newName : name;
    if (!out.includes(next)) out.push(next);
  }
  return out;
}

// 同一路徑仍被其他圖片引用時不可刪檔（舊版以原始檔名當路徑，不同圖片可能共用）
async function deleteFileIfUnused(db, bucket, storagePath, exceptDocId) {
  if (!isSalesImagePath(storagePath)) return false;
  const refs = await db.collection('salesImages').where('storagePath', '==', storagePath).get();
  if (refs.docs.some(d => d.id !== exceptDocId)) return false;
  try {
    await bucket.file(storagePath).delete();
  } catch (error) {
    if (error.code !== 404) console.warn(`[salesImages] 刪除檔案失敗 ${storagePath}:`, error.message);
  }
  return true;
}

// ── Google Sheet 同步 ──
let syncSalesSheetImpl = null;
function init({ syncSalesSheet }) {
  syncSalesSheetImpl = syncSalesSheet;
}
function defaultSyncSalesSheet(params) {
  if (!syncSalesSheetImpl) throw new Error('Sheet 同步尚未初始化');
  return syncSalesSheetImpl(params);
}

// 戶數多且建案有設定銷控 Sheet 時，回傳要寫進戶別的標記與全量同步的目標；否則 null（維持逐戶同步）
async function planSheetSync(db, projectId, unitCount) {
  if (unitCount <= SHEET_SYNC_EACH_LIMIT) return null;
  const snap = await db.collection('projects').doc(projectId).get();
  const { salesSheetId, salesSheetTabName } = snap.data() || {};
  if (!salesSheetId || !salesSheetTabName) return null;
  return {
    marker: { [SHEET_SYNC_SKIP_FIELD]: newSheetSyncBatchId() },
    target: { projectId, spreadsheetId: salesSheetId, sheetName: salesSheetTabName },
  };
}

// 失敗不影響已寫入的資料，回傳提示文字
async function runSheetSync({ db, plan, syncSalesSheet, label }) {
  if (!plan) return {};
  try {
    await syncSalesSheet({ db, ...plan.target });
    return {};
  } catch (error) {
    console.error(`[${label}] ${plan.target.projectId} 同步 Sheet 失敗:`, error);
    return { sheetSyncWarning: `資料已更新，但 Sheet 同步失敗，請至建案設定手動同步（${error.message}）` };
  }
}

// 依序分批寫入；回傳寫完的筆數與失敗原因（前面批次已生效，由呼叫端決定如何回報）
async function commitInBatches(db, writes) {
  let committed = 0;
  for (let i = 0; i < writes.length; i += BATCH_WRITE_LIMIT) {
    const chunk = writes.slice(i, i + BATCH_WRITE_LIMIT);
    const batch = db.batch();
    chunk.forEach(write => write(batch));
    try {
      await batch.commit();
    } catch (error) {
      return { committed, error };
    }
    committed += chunk.length;
  }
  return { committed, error: null };
}

async function saveSalesImageCore({ db, bucket, data, now = Date.now() }) {
  const projectId = requireProjectId(data?.projectId);
  const contentType = String(data?.contentType || '').toLowerCase();
  if (!CONTENT_TYPES.includes(contentType)) throw new HttpsError('invalid-argument', '僅支援 PNG、JPG、WEBP 圖片。');
  if (typeof data?.fileBase64 !== 'string' || !data.fileBase64) throw new HttpsError('invalid-argument', '缺少檔案內容。');
  const buffer = Buffer.from(data.fileBase64, 'base64');
  if (!buffer.length) throw new HttpsError('invalid-argument', '缺少檔案內容。');
  const width = dimension(data.width);
  const height = dimension(data.height);
  let panorama = panoramaType(data.panorama);
  if (panorama && panorama !== 'none' && !isWide(width, height)) panorama = 'none';
  const isPanorama = panorama === 'sphere' || panorama === 'strip';
  if (buffer.length > (isPanorama ? PANORAMA_MAX_BYTES : MAX_BYTES)) {
    throw new HttpsError('invalid-argument', isPanorama ? '全景圖超過 4MB。' : '檔案超過 1MB。');
  }
  const sniffed = sniffContentType(buffer);
  if (!sniffed) throw new HttpsError('invalid-argument', '檔案不是有效的圖片。');

  const images = db.collection('salesImages');
  let ref;
  let existing = null;
  if (data.docId) {
    ref = images.doc(String(data.docId));
    const snap = await ref.get();
    if (!snap.exists || snap.data().projectId !== projectId) throw new HttpsError('not-found', '找不到這張圖片，可能已被刪除。');
    existing = snap.data();
  } else {
    const imageName = normalizeImageName(data.imageName);
    ref = images.doc(imageDocId(projectId, imageName));
    const snap = await ref.get();
    if (snap.exists) {
      if (!data.replace) throw new HttpsError('already-exists', `圖片名稱「${imageName}」已存在。`);
      existing = snap.data();
    }
  }

  const fileName = String(data.fileName || 'image').slice(0, 200);
  const storagePath = buildStoragePath(projectId, fileName, now);
  const file = bucket.file(storagePath);
  await file.save(buffer, {
    resumable: false,
    metadata: { contentType: sniffed, cacheControl: 'public, max-age=31536000' },
  });
  await file.makePublic();
  const downloadURL = file.publicUrl();

  const fileMeta = {
    downloadURL,
    storagePath,
    fileName,
    contentType: sniffed,
    fileSize: buffer.length,
    width,
    height,
    updatedAt: FieldValue.serverTimestamp(),
  };

  if (existing) {
    // 換了檔案：沒帶全景類型（舊版前端）就清掉，交給前端重新辨識
    await ref.update({ ...fileMeta, panorama: panorama || FieldValue.delete() });
    if (existing.storagePath && existing.storagePath !== storagePath) {
      await deleteFileIfUnused(db, bucket, existing.storagePath, ref.id);
    }
  } else {
    try {
      await ref.create({
        projectId,
        imageName: normalizeImageName(data.imageName),
        ...fileMeta,
        ...(panorama ? { panorama } : {}),
        createdAt: FieldValue.serverTimestamp(),
      });
    } catch (error) {
      await file.delete().catch(() => {});
      if (error.code === 6) throw new HttpsError('already-exists', `圖片名稱「${data.imageName}」已存在。`);
      throw error;
    }
  }

  return {
    status: 'success',
    docId: ref.id,
    imageName: existing ? existing.imageName : normalizeImageName(data.imageName),
    downloadURL,
    storagePath,
    replaced: !!existing,
  };
}

async function renameSalesImageCore({ db, data, syncSalesSheet = defaultSyncSalesSheet }) {
  const projectId = requireProjectId(data?.projectId);
  const newName = normalizeImageName(data?.newName);
  const oldRef = db.collection('salesImages').doc(String(data?.docId || ''));
  const snap = await oldRef.get();
  if (!snap.exists || snap.data().projectId !== projectId) throw new HttpsError('not-found', '找不到這張圖片，可能已被刪除。');
  const image = snap.data();
  const oldName = image.imageName;
  if (oldName === newName) return { status: 'success', docId: oldRef.id, imageName: newName, householdsUpdated: 0 };

  const newRef = db.collection('salesImages').doc(imageDocId(projectId, newName));
  const households = await db.collection('salesHouseholds').where('projectId', '==', projectId).get();
  const affected = households.docs.filter(d => Array.isArray(d.data().salesImages) && d.data().salesImages.includes(oldName));

  // 第一批（含圖片文件搬移）原子寫入；create 遇到同名文件會整批失敗
  const plan = await planSheetSync(db, projectId, affected.length);
  const writes = [
    b => b.create(newRef, { ...image, imageName: newName, updatedAt: FieldValue.serverTimestamp() }),
    b => b.delete(oldRef),
    ...affected.map(d => b => b.update(d.ref, { salesImages: renameInList(d.data().salesImages, oldName, newName), ...plan?.marker })),
  ];
  const { committed, error } = await commitInBatches(db, writes);
  if (error && committed === 0) {
    if (error.code === 6) throw new HttpsError('already-exists', `圖片名稱「${newName}」已存在。`);
    throw error;
  }
  const sync = await runSheetSync({ db, plan, syncSalesSheet, label: 'renameSalesImage' });
  if (error) throw error;

  return { status: 'success', docId: newRef.id, imageName: newName, householdsUpdated: affected.length, ...sync };
}

// 異動清單：每戶一筆，加入或移出擇一
function normalizeUnitChanges(raw) {
  if (!Array.isArray(raw) || !raw.length) throw new HttpsError('invalid-argument', '沒有要更新的戶別。');
  if (raw.length > MAX_UNIT_CHANGES) throw new HttpsError('invalid-argument', `一次最多更新 ${MAX_UNIT_CHANGES} 戶。`);
  const names = (list) => {
    if (list === undefined || list === null) return [];
    const valid = Array.isArray(list) && list.length <= MAX_NAMES_PER_UNIT
      && list.every(n => typeof n === 'string' && n && n.length <= MAX_REF_NAME_LENGTH);
    if (!valid) throw new HttpsError('invalid-argument', '圖片名稱不正確。');
    return [...new Set(list)];
  };
  const seen = new Set();
  return raw.map((item) => {
    const docId = typeof item?.docId === 'string' ? item.docId : '';
    if (!docId || docId.includes('/') || seen.has(docId)) throw new HttpsError('invalid-argument', '戶別資料不正確。');
    seen.add(docId);
    const add = names(item.add);
    const remove = names(item.remove);
    if (!add.length === !remove.length) throw new HttpsError('invalid-argument', '每戶需指定加入或移出其中一種。');
    return { docId, add, remove };
  });
}

/**
 * 批次加入／移出戶別引用（salesHouseholds.salesImages）；加入的圖片排在該戶最後
 * 用 arrayUnion／arrayRemove 寫入，不會蓋掉同時間其他人改的圖片；已是目標狀態的戶別不寫
 */
async function updateSalesImageUnitsCore({ db, data, syncSalesSheet = defaultSyncSalesSheet }) {
  const projectId = requireProjectId(data?.projectId);
  const changes = normalizeUnitChanges(data?.changes);

  const households = await db.collection('salesHouseholds').where('projectId', '==', projectId).get();
  const byId = new Map(households.docs.map(d => [d.id, d]));
  const notFound = [];
  const pending = [];
  for (const { docId, add, remove } of changes) {
    const doc = byId.get(docId);
    if (!doc) {
      notFound.push(docId);
      continue;
    }
    const current = Array.isArray(doc.data().salesImages) ? doc.data().salesImages : [];
    const newNames = add.filter(n => !current.includes(n));
    const oldNames = remove.filter(n => current.includes(n));
    if (newNames.length) pending.push({ ref: doc.ref, value: FieldValue.arrayUnion(...newNames) });
    else if (oldNames.length) pending.push({ ref: doc.ref, value: FieldValue.arrayRemove(...oldNames) });
  }

  const plan = await planSheetSync(db, projectId, pending.length);
  const { committed, error } = await commitInBatches(db, pending.map(({ ref, value }) => b => b.update(ref, {
    salesImages: value,
    updatedAt: FieldValue.serverTimestamp(),
    ...plan?.marker,
  })));
  const sync = committed ? await runSheetSync({ db, plan, syncSalesSheet, label: 'updateSalesImageUnits' }) : {};
  if (error) {
    console.error(`[updateSalesImageUnits] ${projectId} 寫入失敗（已完成 ${committed}/${pending.length} 戶）:`, error);
    throw new HttpsError('internal', committed ? `已更新 ${committed} 戶，其餘 ${pending.length - committed} 戶失敗，請再試一次。` : '更新戶別失敗，請再試一次。');
  }
  return { status: 'success', updated: committed, notFound, ...sync };
}

async function setSalesImagePanoramaCore({ db, data }) {
  const projectId = requireProjectId(data?.projectId);
  const panorama = panoramaType(data?.panorama);
  if (!panorama) throw new HttpsError('invalid-argument', '全景類型不正確。');
  const ref = db.collection('salesImages').doc(String(data?.docId || ''));
  const snap = await ref.get();
  if (!snap.exists || snap.data().projectId !== projectId) throw new HttpsError('not-found', '找不到這張圖片，可能已被刪除。');
  const { width, height } = snap.data();
  // 舊資料沒有記錄寬高時不擋
  if (panorama !== 'none' && width > 0 && height > 0 && !isWide(width, height)) {
    throw new HttpsError('failed-precondition', '這張圖片不夠寬，無法設為全景。');
  }
  await ref.update({ panorama });
  return { status: 'success', docId: ref.id, panorama };
}

async function deleteSalesImagesCore({ db, bucket, data }) {
  const projectId = data?.projectId ? requireProjectId(data.projectId) : null;
  const ids = Array.isArray(data?.docIds) ? data.docIds : (data?.docId ? [data.docId] : []);
  const docIds = [...new Set(ids.filter(id => typeof id === 'string' && id && !id.includes('/')))];
  if (!docIds.length) throw new HttpsError('invalid-argument', '請選擇要刪除的圖片。');
  if (docIds.length > MAX_BATCH_DELETE) throw new HttpsError('invalid-argument', `一次最多刪除 ${MAX_BATCH_DELETE} 張。`);

  let deleted = 0;
  const failed = [];
  for (const docId of docIds) {
    try {
      const ref = db.collection('salesImages').doc(docId);
      const snap = await ref.get();
      if (!snap.exists) { deleted += 1; continue; }
      const image = snap.data();
      if (projectId && image.projectId !== projectId) throw new Error('不屬於此建案');
      await ref.delete();
      await deleteFileIfUnused(db, bucket, image.storagePath, docId);
      deleted += 1;
    } catch (error) {
      failed.push({ docId, message: error.message });
    }
  }
  return { status: 'success', deleted, failed };
}

function wrap(name, fn) {
  return async (request) => {
    try {
      return await fn({ db: new Firestore({ databaseId: 'anxi-app' }), bucket: admin.storage().bucket(), data: request.data });
    } catch (error) {
      if (error instanceof HttpsError) throw error;
      console.error(`[${name}] 失敗:`, error);
      throw new HttpsError('internal', error.message || '處理圖片時發生錯誤。');
    }
  };
}

exports.saveSalesImage = onCall({ region: 'asia-east1', memory: '512MiB' }, wrap('saveSalesImage', saveSalesImageCore));
exports.renameSalesImage = onCall({ region: 'asia-east1', memory: '512MiB', timeoutSeconds: 300 }, wrap('renameSalesImage', renameSalesImageCore));
exports.setSalesImagePanorama = onCall({ region: 'asia-east1' }, wrap('setSalesImagePanorama', setSalesImagePanoramaCore));
exports.updateSalesImageUnits = onCall({ region: 'asia-east1', memory: '512MiB', timeoutSeconds: 300 }, wrap('updateSalesImageUnits', updateSalesImageUnitsCore));
exports.deleteSalesImages = onCall({ region: 'asia-east1', timeoutSeconds: 300 }, wrap('deleteSalesImages', deleteSalesImagesCore));

exports.init = init;
exports.normalizeImageName = normalizeImageName;
exports.buildStoragePath = buildStoragePath;
exports.isSalesImagePath = isSalesImagePath;
exports.renameInList = renameInList;
exports.saveSalesImageCore = saveSalesImageCore;
exports.renameSalesImageCore = renameSalesImageCore;
exports.setSalesImagePanoramaCore = setSalesImagePanoramaCore;
exports.updateSalesImageUnitsCore = updateSalesImageUnitsCore;
exports.deleteSalesImagesCore = deleteSalesImagesCore;
