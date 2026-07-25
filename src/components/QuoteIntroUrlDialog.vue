<template>
  <v-dialog v-model="show" max-width="520" persistent scrollable>
    <v-card>
      <v-card-title class="d-flex align-center bg-blue-grey-darken-2 text-white py-3">
        <v-icon start>mdi-qrcode</v-icon>
        建案簡介網址（QR Code）
        <v-spacer></v-spacer>
        <v-btn icon="mdi-close" variant="text" size="small" @click="close"></v-btn>
      </v-card-title>

      <v-card-text class="pa-4">
        <div class="text-body-2 text-grey-darken-1 mb-4">
          設定後，列印報價單頁尾右下角會印出此網址的 QR Code（中央顯示建案名稱）；
          <strong>未設定則不印出、也不預留位置</strong>。
        </div>

        <v-text-field
          v-model="urlInput"
          label="建案簡介網址"
          variant="outlined"
          density="comfortable"
          prepend-inner-icon="mdi-link-variant"
          placeholder="https://example.com/project"
          hint="留空表示不印 QR Code；未輸入 http(s):// 會自動補上 https://"
          persistent-hint
          clearable
          :loading="loading"
          :disabled="loading"
          :error-messages="urlError"
        ></v-text-field>

        <div class="preview-area mt-4">
          <div class="text-subtitle-2 font-weight-bold mb-2">列印預覽</div>
          <div class="d-flex justify-center align-center preview-box">
            <v-progress-circular v-if="generating" indeterminate color="blue-grey-darken-2"></v-progress-circular>
            <img v-else-if="previewDataUrl" :src="previewDataUrl" class="preview-qr" alt="QR Code 預覽" />
            <span v-else class="text-caption text-grey">尚未設定網址，報價單不會出現 QR Code</span>
          </div>
          <div v-if="previewDataUrl" class="text-caption text-grey-darken-1 text-center mt-2">
            中央文字：{{ projectName || '—' }}
          </div>
        </div>

        <div v-if="updatedInfo" class="text-caption text-grey mt-3">{{ updatedInfo }}</div>
      </v-card-text>

      <v-divider></v-divider>

      <v-card-actions class="pa-3">
        <v-btn
          v-if="hasExisting"
          color="red-darken-1"
          variant="text"
          prepend-icon="mdi-link-variant-off"
          :loading="saving"
          @click="handleClear"
        >
          清除網址
        </v-btn>
        <v-spacer></v-spacer>
        <v-btn variant="text" @click="close">取消</v-btn>
        <v-btn
          color="blue-grey-darken-2"
          variant="flat"
          prepend-icon="mdi-content-save-outline"
          :loading="saving"
          :disabled="loading"
          @click="handleSave"
        >
          儲存
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import { useToast } from 'vue-toastification';
import { useUserStore } from '@/store/user';
import { useProjectStore } from '@/store/projectStore';
import { generateQrDataUrl, normalizeIntroUrl, isValidIntroUrl } from '@/utils/quoteQrCode';

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  projectId: { type: String, default: '' },
  projectName: { type: String, default: '' },
});
const emit = defineEmits(['update:modelValue', 'saved']);

const toast = useToast();
const userStore = useUserStore();
const projectStore = useProjectStore();

const show = computed({
  get: () => props.modelValue,
  set: (v) => emit('update:modelValue', v),
});

const urlInput = ref('');
const urlError = ref('');
const hasExisting = ref(false);
const updatedInfo = ref('');
const loading = ref(false);
const saving = ref(false);
const generating = ref(false);
const previewDataUrl = ref('');

// 同步本地專案物件，讓列印對話框不必重新讀取即可反映最新設定
function syncLocalProject(url) {
  const project = projectStore.getProjectById(props.projectId);
  if (project) project.quoteIntroUrl = url;
}

// 開啟時直接讀 Firestore，避免本地快取過期
watch(show, async (visible) => {
  if (!visible) return;
  urlError.value = '';
  updatedInfo.value = '';
  previewDataUrl.value = '';
  loading.value = true;
  try {
    const data = await projectStore.fetchProjectSettings(props.projectId);
    const url = String(data?.quoteIntroUrl || '').trim();
    hasExisting.value = !!url;
    urlInput.value = url;
    syncLocalProject(url);

    const meta = data?.quoteIntroUrlMeta;
    if (meta?.updatedBy || meta?.updatedAt) {
      const when = meta.updatedAt
        ? new Intl.DateTimeFormat('zh-TW', {
            timeZone: 'Asia/Taipei', year: 'numeric', month: '2-digit', day: '2-digit',
            hour: '2-digit', minute: '2-digit',
          }).format(new Date(meta.updatedAt))
        : '';
      updatedInfo.value = `最後更新：${meta.updatedBy || '—'}${when ? `（${when}）` : ''}`;
    }
  } catch (e) {
    toast.error(`載入設定失敗：${e.message}`);
  } finally {
    loading.value = false;
  }
});

// 輸入變更 → 防抖重新產生預覽
let debounceTimer = null;
watch([urlInput, () => props.projectName], () => {
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(refreshPreview, 300);
});

async function refreshPreview() {
  const raw = String(urlInput.value ?? '').trim();
  urlError.value = '';
  if (!raw) {
    previewDataUrl.value = '';
    return;
  }
  if (!isValidIntroUrl(raw)) {
    previewDataUrl.value = '';
    urlError.value = '網址格式不正確，請確認是否包含正確網域（例如 https://example.com）';
    return;
  }
  generating.value = true;
  try {
    previewDataUrl.value = await generateQrDataUrl(raw, props.projectName, { size: 440 });
  } catch (e) {
    console.error('[QuoteIntroUrlDialog] 產生 QR Code 失敗:', e);
    previewDataUrl.value = '';
    urlError.value = '產生 QR Code 失敗，請稍後再試';
  } finally {
    generating.value = false;
  }
}

async function persist(url) {
  saving.value = true;
  try {
    await projectStore.updateProjectSettings(props.projectId, {
      quoteIntroUrl: url,
      quoteIntroUrlMeta: {
        updatedBy: userStore.user?.name || '',
        updatedAt: new Date().toISOString(),
      },
    });
    syncLocalProject(url);
    toast.success(url ? '建案簡介網址已儲存' : '已清除建案簡介網址');
    emit('saved', url);
    show.value = false;
  } catch (e) {
    toast.error(`儲存失敗：${e.message}`);
  } finally {
    saving.value = false;
  }
}

async function handleSave() {
  const raw = String(urlInput.value ?? '').trim();
  if (raw === '') {
    await persist('');
    return;
  }
  if (!isValidIntroUrl(raw)) {
    urlError.value = '網址格式不正確，請確認是否包含正確網域（例如 https://example.com）';
    return;
  }
  await persist(normalizeIntroUrl(raw));
}

async function handleClear() {
  await persist('');
}

function close() {
  show.value = false;
}
</script>

<style scoped>
.preview-box {
  min-height: 200px;
  background: #f7f9fa;
  border: 1px dashed #cfd8dc;
  border-radius: 6px;
  padding: 12px;
}

.preview-qr {
  width: 200px;
  height: 200px;
  display: block;
}
</style>
