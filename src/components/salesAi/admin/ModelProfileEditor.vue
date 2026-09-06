<template>
  <div>
    <div class="d-flex align-center flex-wrap ga-2 mb-3">
      <div>
        <div class="text-subtitle-1 font-weight-bold">模型設定</div>
        <div class="text-caption text-grey">每個 Profile 對應一家供應商的一個模型；建案可指定 Profile，未指定則用全域預設。</div>
      </div>
      <v-spacer></v-spacer>
      <v-btn color="primary" size="small" prepend-icon="mdi-plus" @click="openEditor()">新增 Profile</v-btn>
    </div>

    <v-row dense class="mb-2">
      <v-col cols="12" md="6">
        <v-select v-model="defaultId" :items="profileItems" variant="outlined" density="compact" label="全域預設 Profile" hide-details @update:model-value="setDefault('defaultProfileId', $event)"></v-select>
      </v-col>
      <v-col cols="12" md="6">
        <v-select v-model="fallbackId" :items="[{ title: '（不回退）', value: null }, ...profileItems]" variant="outlined" density="compact" label="備援 Profile（主模型 429／503 時改用）" hide-details @update:model-value="setDefault('fallbackProfileId', $event)"></v-select>
      </v-col>
    </v-row>

    <v-table density="compact" class="profile-table">
      <thead>
        <tr><th>Profile</th><th>供應商</th><th>模型</th><th>參數</th><th>金鑰</th><th>狀態</th><th style="width:200px"></th></tr>
      </thead>
      <tbody>
        <tr v-for="(p, id) in profiles" :key="id">
          <td>
            <div class="font-weight-medium">{{ p.label }}</div>
            <div class="text-caption text-grey">{{ id }}<v-chip v-if="id === global.defaultProfileId" size="x-small" color="primary" variant="flat" class="ml-1">預設</v-chip><v-chip v-if="id === global.fallbackProfileId" size="x-small" color="teal" variant="flat" class="ml-1">備援</v-chip></div>
          </td>
          <td>{{ providers[p.provider]?.label || p.provider }}</td>
          <td><code>{{ p.model }}</code><div v-if="p.baseUrl" class="text-caption text-grey">{{ p.baseUrl }}</div></td>
          <td class="text-caption">T {{ p.temperature }}｜max {{ p.maxOutputTokens }}｜思考 {{ p.thinking }}</td>
          <td>
            <v-chip size="x-small" :color="secretStatus[p.secretName]?.exists ? 'success' : 'error'" variant="tonal">{{ p.secretName }}</v-chip>
          </td>
          <td><v-chip size="x-small" :color="p.enabled ? 'success' : 'grey'" variant="flat">{{ p.enabled ? '啟用' : '停用' }}</v-chip></td>
          <td class="text-right text-no-wrap">
            <v-btn size="x-small" variant="text" :loading="testing === id" @click="test(id)">測試連線</v-btn>
            <v-btn size="x-small" variant="text" @click="openEditor(id)">編輯</v-btn>
            <v-btn size="x-small" variant="text" color="error" :disabled="id === global.defaultProfileId" @click="remove(id)">刪除</v-btn>
          </td>
        </tr>
      </tbody>
    </v-table>
    <div v-if="testResult" class="mt-2 text-caption" :class="testResult.ok ? 'text-success' : 'text-error'">
      {{ testResult.ok ? `連線正常（${testResult.latencyMs} ms，回覆：${testResult.reply}）` : `失敗：${testResult.message}` }}
    </div>

    <v-dialog v-model="editor.show" max-width="640" scrollable>
      <v-card>
        <v-card-title class="text-subtitle-1">{{ editor.isNew ? '新增 Profile' : `編輯 ${editor.id}` }}</v-card-title>
        <v-card-text>
          <v-row dense>
            <v-col cols="12" md="6"><v-text-field v-model="editor.id" :disabled="!editor.isNew" variant="outlined" density="compact" label="Profile id（英數／底線／連字號）" hint="例如 gemini-flash、claude-sonnet" persistent-hint></v-text-field></v-col>
            <v-col cols="12" md="6"><v-text-field v-model="editor.form.label" variant="outlined" density="compact" label="顯示名稱"></v-text-field></v-col>
            <v-col cols="12" md="6"><v-select v-model="editor.form.provider" :items="providerItems" variant="outlined" density="compact" label="供應商" @update:model-value="onProviderChange"></v-select></v-col>
            <v-col cols="12" md="6"><v-combobox v-model="editor.form.model" :items="providers[editor.form.provider]?.suggestedModels || []" variant="outlined" density="compact" label="模型 id" hint="可自行輸入供應商最新模型 id" persistent-hint></v-combobox></v-col>
            <v-col v-if="editor.form.provider === 'openai-compatible'" cols="12"><v-text-field v-model="editor.form.baseUrl" variant="outlined" density="compact" label="Base URL（含 /v1）" placeholder="https://your-host/v1"></v-text-field></v-col>
            <v-col cols="12" md="6"><v-text-field v-model="editor.form.secretName" variant="outlined" density="compact" label="Secret Manager 密鑰名稱" hint="於「API 金鑰」分頁設定內容" persistent-hint></v-text-field></v-col>
            <v-col cols="6" md="3"><v-text-field v-model.number="editor.form.temperature" type="number" step="0.1" min="0" max="2" variant="outlined" density="compact" label="temperature"></v-text-field></v-col>
            <v-col cols="6" md="3"><v-text-field v-model.number="editor.form.maxOutputTokens" type="number" variant="outlined" density="compact" label="max tokens"></v-text-field></v-col>
            <v-col cols="12" md="6"><v-select v-model="editor.form.thinking" :items="[{ title: '關閉', value: 'off' }, { title: '低', value: 'low' }, { title: '中', value: 'medium' }, { title: '高', value: 'high' }]" variant="outlined" density="compact" label="思考／推理" hint="供應商支援時才生效" persistent-hint></v-select></v-col>
            <v-col cols="6" md="3"><v-text-field v-model.number="editor.form.pricePer1MInput" type="number" step="0.01" variant="outlined" density="compact" label="輸入單價 /1M"></v-text-field></v-col>
            <v-col cols="6" md="3"><v-text-field v-model.number="editor.form.pricePer1MOutput" type="number" step="0.01" variant="outlined" density="compact" label="輸出單價 /1M"></v-text-field></v-col>
            <v-col cols="12"><v-switch v-model="editor.form.enabled" color="primary" inset density="compact" label="啟用" hide-details></v-switch></v-col>
          </v-row>
        </v-card-text>
        <v-card-actions>
          <v-btn variant="text" :loading="testing === '__editor'" @click="testDraft">測試此設定</v-btn>
          <v-spacer></v-spacer>
          <v-btn variant="text" @click="editor.show = false">取消</v-btn>
          <v-btn color="primary" variant="flat" :loading="saving" @click="save">儲存</v-btn>
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

const global = computed(() => props.data.global);
const profiles = computed(() => global.value.profiles || {});
const providers = computed(() => props.data.providers || {});
const secretStatus = computed(() => props.data.secretStatus || {});
const profileItems = computed(() => Object.entries(profiles.value).map(([id, p]) => ({ title: `${p.label}（${p.model}）`, value: id })));
const providerItems = computed(() => Object.entries(providers.value).map(([k, v]) => ({ title: v.label, value: k })));
const defaultId = ref(global.value.defaultProfileId);
const fallbackId = ref(global.value.fallbackProfileId);

const testing = ref(null);
const testResult = ref(null);
const saving = ref(false);
const editor = reactive({ show: false, isNew: true, id: '', form: {} });

function blank() { return { ...props.data.defaults.profile, label: '', model: '' }; }
function openEditor(id) {
  editor.isNew = !id; editor.id = id || '';
  editor.form = id ? { ...profiles.value[id] } : blank();
  editor.show = true;
}
function onProviderChange(p) {
  const meta = providers.value[p];
  if (meta) { editor.form.secretName = meta.defaultSecret; if (!editor.form.model) editor.form.model = meta.suggestedModels[0] || ''; }
}
async function save() {
  saving.value = true;
  try { await run('saveProfile', { profileId: editor.id, profile: editor.form }, { success: '已儲存 Profile' }); editor.show = false; emit('changed'); }
  catch { /* toast 已顯示 */ } finally { saving.value = false; }
}
async function remove(id) {
  if (!confirm(`確定刪除 Profile「${id}」？`)) return;
  try { await run('deleteProfile', { profileId: id }, { success: '已刪除' }); emit('changed'); } catch { /* ignore */ }
}
async function setDefault(key, value) {
  try { await run('setDefaultProfile', { [key]: value }, { success: '已更新' }); emit('changed'); } catch { /* ignore */ }
}
async function test(id) {
  testing.value = id; testResult.value = null;
  try { testResult.value = await run('testProfile', { profileId: id }); } catch { /* ignore */ } finally { testing.value = null; }
}
async function testDraft() {
  testing.value = '__editor'; testResult.value = null;
  try { const r = await run('testProfile', { profile: editor.form }); testResult.value = r; alert(r.ok ? `連線正常（${r.latencyMs} ms）：${r.reply}` : `失敗：${r.message}`); } catch { /* ignore */ } finally { testing.value = null; }
}
</script>

<style scoped>
.profile-table td { vertical-align: middle; }
</style>
