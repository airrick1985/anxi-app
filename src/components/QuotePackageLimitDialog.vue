<template>
  <v-dialog v-model="show" max-width="480" persistent>
    <v-card>
      <v-card-title class="d-flex align-center bg-blue-grey-darken-2 text-white py-3">
        <v-icon start>mdi-cash-lock</v-icon>
        配套總價門檻設定
        <v-spacer></v-spacer>
        <v-btn icon="mdi-close" variant="text" size="small" @click="close"></v-btn>
      </v-card-title>

      <v-card-text class="pa-4">
        <div class="text-body-2 text-grey-darken-1 mb-4">
          設定後，報價單中僅「總價（房屋＋車位）」<strong>達到門檻（≥）</strong>的戶別可勾選「配套」；未設定則不限制。
        </div>

        <v-text-field
          v-model="limitInput"
          label="配套總價門檻"
          type="number"
          suffix="萬"
          variant="outlined"
          density="comfortable"
          placeholder="例如：3800"
          hint="留空表示不限制"
          persistent-hint
          clearable
          :loading="loading"
          :disabled="loading"
          min="0"
        ></v-text-field>

        <div v-if="updatedInfo" class="text-caption text-grey mt-3">{{ updatedInfo }}</div>
      </v-card-text>

      <v-divider></v-divider>

      <v-card-actions class="pa-3">
        <v-btn
          v-if="hasExisting"
          color="red-darken-1"
          variant="text"
          prepend-icon="mdi-lock-open-variant-outline"
          :loading="saving"
          @click="handleClear"
        >
          清除限制
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

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  projectId: { type: String, default: '' },
});
const emit = defineEmits(['update:modelValue', 'saved']);

const toast = useToast();
const userStore = useUserStore();
const projectStore = useProjectStore();

const show = computed({
  get: () => props.modelValue,
  set: (v) => emit('update:modelValue', v),
});

const limitInput = ref('');
const hasExisting = ref(false);
const updatedInfo = ref('');
const loading = ref(false);
const saving = ref(false);

// 將原始值正規化為「正數或 null（不限制）」
function normalizeLimit(raw) {
  if (raw === null || raw === undefined || raw === '') return null;
  const num = Number(raw);
  return Number.isFinite(num) && num > 0 ? num : null;
}

// 同步 projectsList 中的該筆專案資料，讓 QuoteItem 端的 computed 即時反應
function syncLocalProject(limit) {
  const project = projectStore.getProjectById(props.projectId);
  if (project) project.quotePackageThreshold = limit;
}

// 開啟時讀取最新設定（直接抓 Firestore，避免本地快取過期）
watch(show, async (visible) => {
  if (!visible) return;
  updatedInfo.value = '';
  loading.value = true;
  try {
    const data = await projectStore.fetchProjectSettings(props.projectId);
    const limit = normalizeLimit(data?.quotePackageThreshold);
    hasExisting.value = limit !== null;
    limitInput.value = limit !== null ? String(limit) : '';
    syncLocalProject(limit);

    const meta = data?.quotePackageThresholdMeta;
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

async function persist(limit) {
  saving.value = true;
  try {
    await projectStore.updateProjectSettings(props.projectId, {
      quotePackageThreshold: limit,
      quotePackageThresholdMeta: {
        updatedBy: userStore.user?.name || '',
        updatedAt: new Date().toISOString(),
      },
    });
    syncLocalProject(limit);
    toast.success(limit === null ? '已清除配套總價門檻' : `配套總價門檻已設為 ${limit.toLocaleString()} 萬`);
    emit('saved');
    show.value = false;
  } catch (e) {
    toast.error(`儲存失敗：${e.message}`);
  } finally {
    saving.value = false;
  }
}

async function handleSave() {
  const raw = String(limitInput.value ?? '').trim();
  if (raw === '') {
    await persist(null);
    return;
  }
  const num = Number(raw);
  if (!Number.isFinite(num) || num <= 0) {
    toast.error('請輸入大於 0 的數字');
    return;
  }
  await persist(num);
}

async function handleClear() {
  await persist(null);
}

function close() {
  show.value = false;
}
</script>
