/**
 * 銷控圖片管理後端（建案設定「銷控圖片管理」）
 *
 * - saveSalesImage：新增或替換一張圖片（上傳檔案＋寫入中繼資料；替換時刪除舊檔）
 * - renameSalesImage：更名，並同步更新戶別 salesImages 引用的名稱
 * - deleteSalesImages：批次刪除（中繼資料＋檔案）
 *
 * 戶別以「圖片名稱」引用圖片（salesHouseholds.salesImages），文件 ID 為 {projectId}_{imageName}。
 * 每次上傳都寫入新的檔案路徑，網址不重複，可長期快取；替換後各頁不會再看到舊圖。
 */

const { onCall, HttpsError } = require('firebase-functions/v2/https');
const { Firestore, FieldValue } = require('@google-cloud/firestore');
const admin = require('firebase-admin');

const MAX_BYTES = 1024 * 1024;
const MAX_NAME_LENGTH = 80;
const MAX_BATCH_DELETE = 200;
const BATCH_WRITE_LIMIT = 450;
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

async function saveSalesImageCore({ db, bucket, data, now = Date.now() }) {
  const projectId = requireProjectId(data?.projectId);
  const contentType = String(data?.contentType || '').toLowerCase();
  if (!CONTENT_TYPES.includes(contentType)) throw new HttpsError('invalid-argument', '僅支援 PNG、JPG、WEBP 圖片。');
  if (typeof data?.fileBase64 !== 'string' || !data.fileBase64) throw new HttpsError('invalid-argument', '缺少檔案內容。');
  const buffer = Buffer.from(data.fileBase64, 'base64');
  if (!buffer.length) throw new HttpsError('invalid-argument', '缺少檔案內容。');
  if (buffer.length > MAX_BYTES) throw new HttpsError('invalid-argument', '檔案超過 1MB。');
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
    width: dimension(data.width),
    height: dimension(data.height),
    updatedAt: FieldValue.serverTimestamp(),
  };

  if (existing) {
    await ref.update(fileMeta);
    if (existing.storagePath && existing.storagePath !== storagePath) {
      await deleteFileIfUnused(db, bucket, existing.storagePath, ref.id);
    }
  } else {
    try {
      await ref.create({
        projectId,
        imageName: normalizeImageName(data.imageName),
        ...fileMeta,
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

async function renameSalesImageCore({ db, data }) {
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
  const writes = [
    b => b.create(newRef, { ...image, imageName: newName, updatedAt: FieldValue.serverTimestamp() }),
    b => b.delete(oldRef),
    ...affected.map(d => b => b.update(d.ref, { salesImages: renameInList(d.data().salesImages, oldName, newName) })),
  ];
  for (let i = 0; i < writes.length; i += BATCH_WRITE_LIMIT) {
    const batch = db.batch();
    writes.slice(i, i + BATCH_WRITE_LIMIT).forEach(write => write(batch));
    try {
      await batch.commit();
    } catch (error) {
      if (i === 0 && error.code === 6) throw new HttpsError('already-exists', `圖片名稱「${newName}」已存在。`);
      throw error;
    }
  }

  return { status: 'success', docId: newRef.id, imageName: newName, householdsUpdated: affected.length };
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
exports.renameSalesImage = onCall({ region: 'asia-east1' }, wrap('renameSalesImage', renameSalesImageCore));
exports.deleteSalesImages = onCall({ region: 'asia-east1', timeoutSeconds: 300 }, wrap('deleteSalesImages', deleteSalesImagesCore));

exports.normalizeImageName = normalizeImageName;
exports.buildStoragePath = buildStoragePath;
exports.isSalesImagePath = isSalesImagePath;
exports.renameInList = renameInList;
exports.saveSalesImageCore = saveSalesImageCore;
exports.renameSalesImageCore = renameSalesImageCore;
exports.deleteSalesImagesCore = deleteSalesImagesCore;
