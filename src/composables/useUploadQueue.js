// src/composables/useUploadQueue.js
// 逐檔上傳佇列（訂閱管理附件／圖片庫共用）：
// 每個檔案先成為 pending 項目（waiting → uploading → 完成移除／failed），依序上傳，
// 圖片先經 prepareImageForUpload 壓縮。upload(file, index) 由呼叫端負責實際上傳與寫回。

import { ref, onBeforeUnmount } from 'vue';
import { prepareImageForUpload } from '@/utils/canvasCompress';

const MAX_SIZE = 7 * 1024 * 1024;

export function useUploadQueue(upload) {
  const pending = ref([]);
  let seq = 0;
  let running = false;

  function enqueue(files) {
    for (const file of files) {
      pending.value.push({
        id: ++seq,
        file,
        name: file.name,
        status: 'waiting',
        error: '',
        retryable: true,
        previewUrl: (file.type || '').startsWith('image/') ? URL.createObjectURL(file) : '',
      });
    }
    run();
  }

  async function run() {
    if (running) return;
    running = true;
    try {
      let item;
      while ((item = pending.value.find(p => p.status === 'waiting'))) {
        await process(item);
      }
    } finally {
      running = false;
    }
  }

  async function process(item) {
    item.status = 'uploading';
    try {
      const file = await prepareImageForUpload(item.file);
      if (file.size > MAX_SIZE) {
        item.retryable = false;
        throw new Error('超過 7MB');
      }
      await upload(file, item.id);
      discard(item);
    } catch (err) {
      item.status = 'failed';
      item.error = err?.message || '上傳失敗';
    }
  }

  function retry(item) {
    if (item.status !== 'failed' || !item.retryable) return;
    item.status = 'waiting';
    item.error = '';
    run();
  }

  function discard(item) {
    if (item.previewUrl) URL.revokeObjectURL(item.previewUrl);
    pending.value = pending.value.filter(p => p.id !== item.id);
  }

  onBeforeUnmount(() => {
    pending.value.forEach(p => p.previewUrl && URL.revokeObjectURL(p.previewUrl));
  });

  return { pending, enqueue, retry, discard };
}
