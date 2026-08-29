<template>
  <v-dialog v-model="show" max-width="560" persistent scrollable>
    <v-card>
      <v-card-title class="d-flex align-center bg-blue-grey-darken-2 text-white py-3">
        <v-icon start>mdi-account-check</v-icon>
        報價核准設定
        <v-spacer></v-spacer>
        <v-btn icon="mdi-close" variant="text" size="small" @click="close"></v-btn>
      </v-card-title>

      <v-card-text class="pa-4">
        <div class="text-body-2 text-grey-darken-1 mb-4">
          列印報價單前，系統會以最新底價核對每一戶；報價低於底價（超出授權額度）時，
          需通知下列主管確認後才可列印。<strong>未設定主管時，退回所有具本案「銷控系統」權限且可通知的人員。</strong>
        </div>

        <!-- 報價核准主管 -->
        <div class="text-subtitle-2 font-weight-bold mb-2 d-flex align-center">
          <v-icon start size="small" color="blue-grey-darken-2">mdi-account-multiple-check</v-icon>
          報價核准主管（可複選）
        </div>
        <v-select
          v-model="selectedKeys"
          :items="candidates"
          item-title="name"
          item-value="userKey"
          label="選擇主管"
          multiple
          chips
          closable-chips
          variant="outlined"
          density="comfortable"
          :loading="loading"
          :disabled="loading"
          hide-details
          class="mb-1"
        >
          <template v-slot:item="{ props: itemProps, item }">
            <v-list-item v-bind="itemProps" :disabled="!isReachable(item.raw)">
              <template v-slot:append>
                <v-chip :color="channelChip(item.raw).color" size="x-small" label>
                  {{ channelChip(item.raw).text }}
                </v-chip>
              </template>
            </v-list-item>
          </template>
          <template v-slot:chip="{ props: chipProps, item }">
            <v-chip v-bind="chipProps" :color="channelChip(item.raw).color" size="small" label>
              {{ item.raw.name }}
            </v-chip>
          </template>
        </v-select>
        <div class="text-caption text-grey mb-5">
          ※ 候選為具本案「銷控系統」權限者（不含超級管理員）。有 LINE 者以 LINE 通知；無 LINE 但有 Email 者改寄 Email；兩者皆無者無法選取。
        </div>

        <!-- 銷售議價授權額度 -->
        <div class="text-subtitle-2 font-weight-bold mb-2 d-flex align-center">
          <v-icon start size="small" color="blue-grey-darken-2">mdi-cash-check</v-icon>
          銷售議價授權額度
        </div>
        <v-text-field
          v-model="toleranceInput"
          type="number"
          suffix="萬"
          variant="outlined"
          density="comfortable"
          placeholder="0"
          hint="報價低於底價但在此額度內（含），免通知主管；留空或 0 表示只要低於底價即需通知"
          persistent-hint
          min="0"
          :loading="loading"
          :disabled="loading"
        ></v-text-field>

        <div v-if="updatedInfo" class="text-caption text-grey mt-3">{{ updatedInfo }}</div>
      </v-card-text>

      <v-divider></v-divider>

      <v-card-actions class="pa-3">
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
import { listQuoteApproverCandidates } from '@/api';

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

const candidates = ref([]);      // [{ userKey, name, hasLine, hasEmail }]
const selectedKeys = ref([]);
const toleranceInput = ref('');
const updatedInfo = ref('');
const loading = ref(false);
const saving = ref(false);

const isReachable = (c) => !!(c?.hasLine || c?.hasEmail);
function channelChip(c) {
  if (c?.hasLine) return { color: 'success', text: 'LINE' };
  if (c?.hasEmail) return { color: 'info', text: 'Email' };
  return { color: 'grey', text: '無法通知' };
}

function formatWhen(iso) {
  if (!iso) return '';
  return new Intl.DateTimeFormat('zh-TW', {
    timeZone: 'Asia/Taipei', year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit',
  }).format(new Date(iso));
}

// 開啟時：候選清單走後端（權限＋通道即時判定）、設定值直接讀 Firestore（避免快取過期）
watch(show, async (visible) => {
  if (!visible) return;
  updatedInfo.value = '';
  loading.value = true;
  try {
    const [res, data] = await Promise.all([
      listQuoteApproverCandidates({ projectId: props.projectId, operatorKey: userStore.user?.key }),
      projectStore.fetchProjectSettings(props.projectId),
    ]);
    if (res.status !== 'success') throw new Error(res.message || '載入候選主管失敗');
    candidates.value = res.candidates || [];
    const candidateKeys = new Set(candidates.value.map(c => c.userKey));
    selectedKeys.value = (Array.isArray(data?.quoteApprovers) ? data.quoteApprovers : []).filter(k => candidateKeys.has(k));
    const tol = Number(data?.quoteFloorTolerance);
    toleranceInput.value = Number.isFinite(tol) && tol > 0 ? String(tol) : '';

    const meta = data?.quoteApprovalMeta;
    if (meta?.updatedBy || meta?.updatedAt) {
      const when = formatWhen(meta.updatedAt);
      updatedInfo.value = `最後更新：${meta.updatedBy || '—'}${when ? `（${when}）` : ''}`;
    }
  } catch (e) {
    toast.error(`載入設定失敗：${e.message}`);
  } finally {
    loading.value = false;
  }
});

async function handleSave() {
  const raw = String(toleranceInput.value ?? '').trim();
  let tolerance = 0;
  if (raw !== '') {
    const num = Number(raw);
    if (!Number.isFinite(num) || num < 0) {
      toast.error('授權額度請輸入 0 或正數');
      return;
    }
    tolerance = num;
  }
  const approvers = selectedKeys.value.filter(k => {
    const c = candidates.value.find(x => x.userKey === k);
    return c && isReachable(c);
  });

  saving.value = true;
  try {
    await projectStore.updateProjectSettings(props.projectId, {
      quoteApprovers: approvers,
      quoteFloorTolerance: tolerance,
      quoteApprovalMeta: {
        updatedBy: userStore.user?.name || '',
        updatedAt: new Date().toISOString(),
      },
    });
    toast.success(
      approvers.length > 0
        ? `已設定 ${approvers.length} 位報價核准主管，授權額度 ${tolerance.toLocaleString()} 萬`
        : `未指定主管（將退回全部具銷控權限者），授權額度 ${tolerance.toLocaleString()} 萬`
    );
    emit('saved');
    show.value = false;
  } catch (e) {
    toast.error(`儲存失敗：${e.message}`);
  } finally {
    saving.value = false;
  }
}

function close() {
  show.value = false;
}
</script>
