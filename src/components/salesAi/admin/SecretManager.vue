<template>
  <div>
    <div class="text-subtitle-1 font-weight-bold">API 金鑰</div>
    <div class="text-caption text-grey mb-3">金鑰寫入 Google Secret Manager，永不回傳畫面；更新後最遲 10 分鐘生效。需要 Cloud Functions 服務帳號具備 Secret Manager Admin 角色。</div>

    <v-table density="compact">
      <thead><tr><th>密鑰名稱</th><th>供應商</th><th>狀態</th><th>來源</th><th>最後更新</th><th style="width:260px"></th></tr></thead>
      <tbody>
        <tr v-for="row in rows" :key="row.name">
          <td><code>{{ row.name }}</code></td>
          <td>{{ row.providerLabel }}</td>
          <td><v-chip size="x-small" :color="row.status?.exists ? 'success' : 'error'" variant="flat">{{ row.status?.exists ? '已設定' : '未設定' }}</v-chip></td>
          <td class="text-caption">{{ row.status?.source === 'env' ? '部署環境變數' : row.status?.source === 'secret-manager' ? 'Secret Manager' : '—' }}</td>
          <td class="text-caption">{{ row.status?.updatedAt ? new Date(row.status.updatedAt).toLocaleString('zh-TW', { timeZone: 'Asia/Taipei' }) : '—' }}</td>
          <td class="text-right text-no-wrap">
            <v-btn size="x-small" variant="text" :loading="validating === row.name" @click="validate(row)">驗證</v-btn>
            <v-btn size="x-small" variant="text" color="primary" @click="openSet(row)">更新金鑰</v-btn>
          </td>
        </tr>
      </tbody>
    </v-table>
    <div v-if="validateResult" class="mt-2 text-caption" :class="validateResult.ok ? 'text-success' : 'text-error'">
      {{ validateResult.ok ? `金鑰有效${validateResult.models?.length ? `，可用模型 ${validateResult.models.length} 個（例：${validateResult.models.slice(0, 5).join('、')}）` : ''}` : `驗證失敗：${validateResult.message}` }}
    </div>

    <v-dialog v-model="dlg.show" max-width="520">
      <v-card>
        <v-card-title class="text-subtitle-1">更新金鑰：{{ dlg.name }}</v-card-title>
        <v-card-text>
          <v-text-field v-model="dlg.value" type="password" variant="outlined" density="compact" label="新的 API 金鑰" autocomplete="off" hint="送出後不會再顯示" persistent-hint></v-text-field>
          <div v-if="dlg.check" class="text-caption mt-2" :class="dlg.check.ok ? 'text-success' : 'text-error'">{{ dlg.check.ok ? '金鑰驗證通過' : `驗證失敗：${dlg.check.message}` }}</div>
        </v-card-text>
        <v-card-actions>
          <v-btn variant="text" :loading="dlg.checking" :disabled="!dlg.value" @click="checkDraft">先驗證</v-btn>
          <v-spacer></v-spacer>
          <v-btn variant="text" @click="dlg.show = false">取消</v-btn>
          <v-btn color="primary" variant="flat" :loading="dlg.saving" :disabled="!dlg.value" @click="save">寫入 Secret Manager</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed } from 'vue';
import { useAiAdmin } from './useAiAdmin';

const props = defineProps({ data: { type: Object, required: true } });
const emit = defineEmits(['changed']);
const { run } = useAiAdmin();

const rows = computed(() => {
  const providers = props.data.providers || {};
  const profiles = props.data.global?.profiles || {};
  const map = new Map();
  for (const [pk, meta] of Object.entries(providers)) map.set(meta.defaultSecret, { name: meta.defaultSecret, provider: pk, providerLabel: meta.label, baseUrl: null });
  for (const p of Object.values(profiles)) if (p.secretName && !map.has(p.secretName)) map.set(p.secretName, { name: p.secretName, provider: p.provider, providerLabel: providers[p.provider]?.label || p.provider, baseUrl: p.baseUrl || null });
  return [...map.values()].map(r => ({ ...r, status: props.data.secretStatus?.[r.name] }));
});

const validating = ref(null);
const validateResult = ref(null);
async function validate(row) {
  validating.value = row.name; validateResult.value = null;
  try { validateResult.value = await run('validateSecret', { secretName: row.name, provider: row.provider, baseUrl: row.baseUrl }); } catch { /* ignore */ } finally { validating.value = null; }
}

const dlg = reactive({ show: false, name: '', provider: 'gemini', baseUrl: null, value: '', checking: false, saving: false, check: null });
function openSet(row) { Object.assign(dlg, { show: true, name: row.name, provider: row.provider, baseUrl: row.baseUrl, value: '', check: null }); }
async function checkDraft() {
  dlg.checking = true; dlg.check = null;
  try { dlg.check = await run('validateSecret', { secretName: dlg.name, provider: dlg.provider, baseUrl: dlg.baseUrl, value: dlg.value }); } catch { /* ignore */ } finally { dlg.checking = false; }
}
async function save() {
  dlg.saving = true;
  try { const r = await run('setSecret', { secretName: dlg.name, value: dlg.value }, { success: `已寫入（版本 ${r?.version || ''}），${r?.note || ''}` }); dlg.show = false; dlg.value = ''; emit('changed'); }
  catch { /* ignore */ } finally { dlg.saving = false; }
}
</script>
