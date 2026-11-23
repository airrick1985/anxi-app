// src/composables/useActivityFiles.js
// 活動訊息檔案作業：上傳佇列、更換檔案、補 PDF 封面
import { ref, computed } from 'vue';
import { useToast } from 'vue-toastification';
import { serverTimestamp } from 'firebase/firestore';
import { useUserStore } from '@/store/user';
import {
  uploadActivityMessage,
  addActivityMessageMetadata,
  updateActivityMessage,
  deleteActivityMessageAssets,
} from '@/api';
import { prepareActivityFile, fileToBase64, isPdfFile, activityKind } from '@/utils/activityMessage';
import { buildActivityCover, getRemotePdfCover } from '@/utils/activityCover';

const CONCURRENCY = 2;

/** getProjectId：取得目前建案；onUploaded(id)：每完成一個檔案呼叫 */
export function useActivityFiles(getProjectId, onUploaded) {
  const toast = useToast();
  const userStore = useUserStore();

  const uploads = ref([]); // { key, projectId, file, name, isPdf, previewUrl, state: waiting|uploading|error, error, sortOrder }
  const projectUploads = computed(() => uploads.value.filter(u => u.projectId === getProjectId()));
  const isUploading = computed(() => uploads.value.some(u => u.state !== 'error'));

  function put(projectId, file, contentType) {
    return fileToBase64(file).then(fileBase64 => uploadActivityMessage({
      projectId,
      userKey: userStore.user?.key || '',
      fileName: file.name,
      fileBase64,
      contentType,
    }));
  }

  function discard(projectId, storagePaths) {
    const paths = storagePaths.filter(Boolean);
    if (!paths.length) return;
    // 後端只會刪除已無任何活動訊息引用的檔案
    deleteActivityMessageAssets({ projectId, userKey: userStore.user?.key || '', storagePaths: paths })
      .catch(err => console.warn('清除活動訊息檔案失敗：', err));
  }

  // 上傳檔案與封面，回傳要寫進文件的檔案欄位；中途失敗會清掉已上傳的
  async function uploadWithCover(projectId, raw) {
    const { file, contentType, isPdf } = await prepareActivityFile(raw);
    const cover = await buildActivityCover(file, contentType);
    const main = await put(projectId, file, contentType);
    let coverInfo = null;
    if (cover.file) {
      // 封面失敗不影響主檔
      coverInfo = await put(projectId, cover.file, 'image/jpeg').catch(() => null);
    }
    return {
      fileName: file.name,
      downloadURL: main.downloadURL,
      storagePath: main.storagePath,
      contentType,
      fileSize: file.size,
      coverURL: coverInfo?.downloadURL || '',
      imagePaths: coverInfo ? [coverInfo.storagePath] : [],
      pageCount: isPdf ? cover.pageCount || 0 : 0,
    };
  }

  // ---------- 上傳 ----------
  function addFiles(files) {
    const list = [...(files || [])];
    if (!list.length) return;
    const projectId = getProjectId();
    const base = Date.now();
    uploads.value.push(...list.map((file, i) => {
      const isPdf = isPdfFile(file);
      return {
        key: `${base}_${i}_${Math.random().toString(36).slice(2, 7)}`,
        projectId,
        file,
        name: file.name,
        isPdf,
        previewUrl: isPdf ? '' : URL.createObjectURL(file),
        state: 'waiting',
        error: '',
        // 多選時照選取順序排（列表以 sortOrder 由大到小）
        sortOrder: base + (list.length - 1 - i),
      };
    }));
    pump();
  }

  function removeUpload(key) {
    const target = uploads.value.find(u => u.key === key);
    if (!target || target.state === 'uploading') return;
    if (target.previewUrl) URL.revokeObjectURL(target.previewUrl);
    uploads.value = uploads.value.filter(u => u.key !== key);
  }

  function retryUpload(key) {
    const target = uploads.value.find(u => u.key === key);
    if (!target || target.state !== 'error') return;
    target.state = 'waiting';
    target.error = '';
    pump();
  }

  function pump() {
    let free = CONCURRENCY - uploads.value.filter(u => u.state === 'uploading').length;
    uploads.value.forEach((u) => {
      if (free > 0 && u.state === 'waiting') {
        free -= 1;
        runUpload(u);
      }
    });
  }

  async function runUpload(entry) {
    entry.state = 'uploading';
    try {
      const fields = await uploadWithCover(entry.projectId, entry.file);
      let id;
      try {
        id = await addActivityMessageMetadata({
          projectId: entry.projectId,
          title: '',
          description: '',
          ...fields,
          sortOrder: entry.sortOrder,
          uploadedBy: userStore.user?.key || '',
          uploadedByName: userStore.user?.name || '',
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      } catch (err) {
        discard(entry.projectId, [fields.storagePath, ...fields.imagePaths]);
        throw err;
      }
      entry.state = 'done';
      removeUpload(entry.key);
      onUploaded?.(id);
    } catch (err) {
      entry.state = 'error';
      entry.error = err.message || '上傳失敗';
    }
    pump();
  }

  // ---------- 更換檔案（標題、說明、排序、狀態都保留） ----------
  const replacingId = ref('');
  async function replaceFile(item, raw) {
    if (!item || !raw || replacingId.value) return;
    const projectId = getProjectId();
    replacingId.value = item.id;
    try {
      const fields = await uploadWithCover(projectId, raw);
      try {
        await updateActivityMessage(item.id, {
          ...fields,
          updatedBy: userStore.user?.key || '',
          updatedByName: userStore.user?.name || '',
        });
      } catch (err) {
        discard(projectId, [fields.storagePath, ...fields.imagePaths]);
        throw err;
      }
      discard(projectId, [item.storagePath, ...(item.imagePaths || [])]);
    } catch (err) {
      toast.error(`更換失敗：${err.message}`);
    } finally {
      replacingId.value = '';
    }
  }

  // ---------- 舊 PDF 補封面（管理者開啟管理模式時在背景做一次） ----------
  const attempted = new Set();
  let backfilling = false;
  async function backfillCovers(getItems) {
    if (backfilling) return;
    backfilling = true;
    const projectId = getProjectId();
    try {
      for (;;) {
        const target = getItems().find(i => activityKind(i) === 'pdf' && !i.coverURL && i.downloadURL && !attempted.has(i.id));
        if (!target || getProjectId() !== projectId) break;
        attempted.add(target.id);
        try {
          const { blob, pageCount } = await getRemotePdfCover(target.downloadURL);
          const up = await put(projectId, new File([blob], 'cover.jpg', { type: 'image/jpeg' }), 'image/jpeg');
          // 上傳期間檔案可能被更換或刪除
          const now = getItems().find(i => i.id === target.id);
          if (now && now.downloadURL === target.downloadURL && !now.coverURL) {
            await updateActivityMessage(target.id, { coverURL: up.downloadURL, imagePaths: [up.storagePath], pageCount });
          } else {
            discard(projectId, [up.storagePath]);
          }
        } catch (err) {
          console.warn('補 PDF 封面失敗：', err);
        }
      }
    } finally {
      backfilling = false;
    }
  }

  return { uploads: projectUploads, isUploading, addFiles, removeUpload, retryUpload, replaceFile, replacingId, backfillCovers };
}
