<template>
  <div>
    <div class="lap-bar">
      <div class="lap-title">Agent</div>
      <v-spacer />
      <button class="mac-btn mac-btn--sm mac-btn--primary" @click="openEdit(null)"><v-icon size="15">mdi-plus</v-icon>新增</button>
    </div>

    <v-table density="compact" class="mac-table">
      <thead><tr><th>名稱</th><th>模型</th><th>送出方式</th><th>來訊通知</th><th>狀態</th><th class="text-right"></th></tr></thead>
      <tbody>
        <tr v-if="!settings.agents.length"><td colspan="6" class="text-center text-grey py-4">尚未新增</td></tr>
        <tr v-for="a in settings.agents" :key="a.id">
          <td class="font-weight-medium">{{ a.name }}</td>
          <td><div>{{ a.model }}</div><div class="lap-sub">{{ settings.providers[a.provider]?.label }}・{{ keyLabel(a.secretName) }}</div></td>
          <td>{{ SEND_MODE_LABEL[a.sendMode] || a.sendMode }}</td>
          <td>{{ a.notifyEnabled !== false ? '開' : '關' }}</td>
          <td><span class="mac-tag" :class="a.enabled !== false ? 'lap-ok' : ''">{{ a.enabled !== false ? '啟用' : '停用' }}</span></td>
          <td class="text-right text-no-wrap">
            <button class="mac-btn mac-btn--sm" @click="openEdit(a)">編輯</button>
            <button class="mac-icon-btn mac-icon-btn--danger ml-1" title="刪除" @click="remove(a)"><v-icon size="16">mdi-trash-can-outline</v-icon></button>
          </td>
        </tr>
      </tbody>
    </v-table>

    <v-dialog v-model="edit.show" max-width="640" scrollable content-class="mac-dialog-fit">
      <div class="mac-sheet lap-sheet">
        <div class="mac-sheet-head">{{ edit.id ? '編輯 Agent' : '新增 Agent' }}<button class="mac-sheet-close" @click="edit.show = false"><v-icon size="18">mdi-close</v-icon></button></div>
        <div class="mac-form lap-form lap-scroll">
          <div class="mac-form-group">
            <div class="mac-form-row"><span class="mac-form-row-label">名稱</span><input v-model="a.name" class="mac-form-input" placeholder="例：客服小幫手" /></div>
            <div class="mac-form-row"><span class="mac-form-row-label">啟用</span><span style="flex:1" /><input v-model="a.enabled" type="checkbox" class="mac-switch" /></div>
          </div>

          <div class="mac-form-label">模型</div>
          <div class="mac-form-group">
            <div class="mac-form-row">
              <span class="mac-form-row-label">供應商</span>
              <select v-model="a.provider" class="mac-form-input mac-form-select">
                <option v-for="(p, k) in settings.providers" :key="k" :value="k">{{ p.label }}</option>
              </select>
            </div>
            <div class="mac-form-row">
              <span class="mac-form-row-label">API Key</span>
              <select v-model="a.secretName" class="mac-form-input mac-form-select">
                <option value="">{{ keysForProvider.length ? '請選擇' : '請先到「API Key」新增' }}</option>
                <option v-for="k in keysForProvider" :key="k.name" :value="k.name">{{ k.label }}{{ settings.keyStatus[k.name]?.exists ? '' : '（未設定）' }}</option>
              </select>
            </div>
            <div v-if="a.provider === 'openai-compatible'" class="mac-form-row"><span class="mac-form-row-label">Base URL</span><input v-model.lazy="a.baseUrl" class="mac-form-input" placeholder="https://…/v1" /></div>
            <div class="mac-form-row lap-model-row">
              <span class="mac-form-row-label">模型</span>
              <div class="lap-model">
                <v-combobox
                  v-model="a.model"
                  :items="modelItems"
                  :return-object="false"
                  :loading="models.loading"
                  placeholder="選擇或輸入模型 id"
                  variant="solo"
                  flat
                  density="compact"
                  hide-details
                  class="mac-vfield"
                  :menu-props="{ contentClass: 'mac-menu', maxHeight: 360 }"
                />
                <div class="lap-model__meta">
                  <span v-if="models.error" class="text-error">{{ models.error }}</span>
                  <span v-else-if="models.list.length">{{ models.list.length }} 個可用模型</span>
                  <button v-if="a.secretName" class="mac-link-btn" :disabled="models.loading" @click="loadModels(true)">重新讀取</button>
                </div>
              </div>
            </div>
            <div class="mac-form-row"><span class="mac-form-row-label">溫度</span><input v-model.number="a.temperature" type="number" step="0.1" min="0" max="2" class="mac-form-input lap-num" /></div>
            <div class="mac-form-row"><span class="mac-form-row-label">輸出上限</span><input v-model.number="a.maxOutputTokens" type="number" step="256" min="256" class="mac-form-input lap-num" /></div>
            <div class="mac-form-row">
              <span class="mac-form-row-label">思考</span>
              <div class="mac-form-seg">
                <button v-for="t in THINKING" :key="t.v" type="button" class="mac-form-seg-btn" :class="{ 'is-active': a.thinking === t.v }" @click="a.thinking = t.v">{{ t.l }}</button>
              </div>
            </div>
            <div class="mac-form-row">
              <span class="mac-form-row-label">每百萬 Token</span>
              <input v-model.number="a.pricePer1MInput" type="number" step="0.01" min="0" class="mac-form-input lap-num" placeholder="輸入" />
              <input v-model.number="a.pricePer1MOutput" type="number" step="0.01" min="0" class="mac-form-input lap-num" placeholder="輸出" />
              <span class="lap-sub">USD</span>
            </div>
          </div>
          <div class="lap-test">
            <button class="mac-btn mac-btn--sm" :disabled="testing" @click="test">{{ testing ? '測試中…' : '測試連線' }}</button>
            <span v-if="testResult" :class="testResult.ok ? 'text-success' : 'text-error'" class="lap-sub">{{ testResult.ok ? `連線正常（${testResult.latencyMs}ms）` : testResult.message }}</span>
          </div>

          <div class="mac-form-label">角色與指示</div>
          <textarea v-model="a.instructions" class="mac-form-textarea" rows="6" placeholder="例：你是安熙建設的客服，熟悉本案建材、交屋流程；回答保持專業親切。" />

          <div class="mac-form-label">可用風格<span class="lap-sub ml-2">不勾選＝全部</span></div>
          <div class="mac-form-group">
            <div v-if="!settings.styles.length" class="lap-empty">尚未建立風格</div>
            <div v-else class="lap-checks">
              <label v-for="s in settings.styles" :key="s.id"><input v-model="a.styleIds" type="checkbox" class="mac-check" :value="s.id" />{{ s.name }}</label>
            </div>
            <div class="mac-form-row">
              <span class="mac-form-row-label">預設風格</span>
              <select v-model="a.defaultStyleId" class="mac-form-input mac-form-select">
                <option :value="null">不指定</option>
                <option v-for="s in usableStyles" :key="s.id" :value="s.id">{{ s.name }}</option>
              </select>
            </div>
          </div>

          <div class="mac-form-label">行為</div>
          <div class="mac-form-group">
            <div class="mac-form-row">
              <span class="mac-form-row-label">送出方式</span>
              <div class="mac-form-seg">
                <button v-for="(l, k) in SEND_MODE_LABEL" :key="k" type="button" class="mac-form-seg-btn" :class="{ 'is-active': a.sendMode === k }" @click="a.sendMode = k">{{ l }}</button>
              </div>
            </div>
            <div class="mac-form-row"><span class="mac-form-row-label">來訊通知</span><span style="flex:1" /><input v-model="a.notifyEnabled" type="checkbox" class="mac-switch" /></div>
            <div class="mac-form-row"><span class="mac-form-row-label">參考客資</span><span style="flex:1" /><input v-model="a.useCustomerData" type="checkbox" class="mac-switch" /></div>
            <div class="mac-form-row"><span class="mac-form-row-label">個人雲端資料</span><span style="flex:1" /><input v-model="a.allowUserSources" type="checkbox" class="mac-switch" /></div>
          </div>

          <div class="mac-form-label">共用雲端資料</div>
          <div class="mac-form-group">
            <div v-if="!settings.sharedSources.length" class="lap-empty">尚無共用資料</div>
            <div v-else class="lap-checks">
              <label v-for="s in settings.sharedSources" :key="s.id"><input v-model="a.sharedSourceIds" type="checkbox" class="mac-check" :value="s.id" />{{ s.name }}</label>
            </div>
          </div>
        </div>
        <div class="mac-sheet-foot">
          <span class="mac-spacer" />
          <button class="mac-btn" @click="edit.show = false">取消</button>
          <button class="mac-btn mac-btn--primary" :disabled="edit.saving" @click="save">儲存</button>
        </div>
      </div>
    </v-dialog>
  </div>
</template>

<script setup>
import { reactive, ref, computed, watch } from 'vue';
import { useLineAiAdmin, SEND_MODE_LABEL } from './useLineAiAdmin';

const { settings, refresh, run } = useLineAiAdmin();

const THINKING = [{ v: 'off', l: '關' }, { v: 'low', l: '低' }, { v: 'medium', l: '中' }, { v: 'high', l: '高' }];
const BLANK = {
  name: '', enabled: true, provider: 'gemini', model: 'gemini-2.5-flash', secretName: '', baseUrl: '', temperature: 0.6, maxOutputTokens: 2048,
  thinking: 'off', instructions: '', styleIds: [], defaultStyleId: null, sendMode: 'manual', notifyEnabled: true, useCustomerData: true,
  allowUserSources: true, sharedSourceIds: [], pricePer1MInput: 0, pricePer1MOutput: 0,
};

const edit = reactive({ show: false, saving: false, id: null });
const a = reactive({ ...BLANK });
const testing = ref(false);
const testResult = ref(null);

const keyLabel = name => settings.value.global.keys.find(k => k.name === name)?.label || name || '未設定 Key';
const keysForProvider = computed(() => settings.value.global.keys.filter(k => k.provider === a.provider));
const suggested = computed(() => settings.value.providers[a.provider]?.suggestedModels || []);

// 模型清單：用選定的 API Key 向供應商查詢；查不到時退回內建建議
const models = reactive({ list: [], loading: false, error: '' });
const modelCache = new Map();
let modelSeq = 0;
const modelItems = computed(() => {
  const list = models.list.length ? models.list : suggested.value.map(id => ({ id, label: id }));
  return list.map(m => ({ value: m.id, title: m.label && m.label !== m.id ? `${m.id}（${m.label}）` : m.id }));
});

async function loadModels(force = false) {
  const cacheKey = `${a.secretName}|${a.baseUrl || ''}`;
  models.error = '';
  if (!a.secretName) { models.list = []; return; }
  if (!force && modelCache.has(cacheKey)) { models.list = modelCache.get(cacheKey); return; }
  const seq = ++modelSeq;
  models.loading = true;
  try {
    const r = await run('listModels', { secretName: a.secretName, baseUrl: a.baseUrl || null }, { silent: true });
    if (seq !== modelSeq) return;
    if (r.ok) { models.list = r.models || []; modelCache.set(cacheKey, models.list); }
    else { models.list = []; models.error = r.message || '讀取失敗'; }
  } catch (e) {
    if (seq === modelSeq) { models.list = []; models.error = String(e?.message || '讀取失敗').replace(/^FirebaseError:\s*/, ''); }
  } finally {
    if (seq === modelSeq) models.loading = false;
  }
  // 換了供應商、模型還空著時，優先選內建建議裡的第一個可用模型
  if (seq === modelSeq && !a.model && models.list.length) {
    a.model = suggested.value.find(id => models.list.some(m => m.id === id)) || models.list[0].id;
  }
}

watch(() => [edit.show, a.secretName, a.baseUrl], ([show]) => { if (show) loadModels(); });
const usableStyles = computed(() => (a.styleIds.length ? settings.value.styles.filter(s => a.styleIds.includes(s.id)) : settings.value.styles));

watch(() => a.provider, (p, prev) => {
  if (!edit.show || !prev) return;
  if (!keysForProvider.value.some(k => k.name === a.secretName)) a.secretName = keysForProvider.value[0]?.name || '';
  a.model = '';
});

function openEdit(agent) {
  Object.assign(a, { ...BLANK, ...(agent || {}), styleIds: [...(agent?.styleIds || [])], sharedSourceIds: [...(agent?.sharedSourceIds || [])] });
  if (!agent) a.secretName = keysForProvider.value[0]?.name || '';
  edit.id = agent?.id || null;
  edit.show = true;
  testResult.value = null;
}

function payload() {
  const { id, updatedAt, updatedBy, ...rest } = a; // eslint-disable-line no-unused-vars
  return rest;
}

async function test() {
  testing.value = true;
  testResult.value = null;
  try { testResult.value = await run('testAgent', { agent: payload() }); } catch { /* 已提示 */ } finally { testing.value = false; }
}

async function save() {
  edit.saving = true;
  try {
    await run('saveAgent', { agentId: edit.id, agent: payload() }, { success: '已儲存' });
    edit.show = false;
    await refresh();
  } catch { /* 已提示 */ } finally {
    edit.saving = false;
  }
}

async function remove(agent) {
  if (!confirm(`刪除 Agent「${agent.name}」？使用它的對話會改用官方帳號的預設 Agent。`)) return;
  try { await run('deleteAgent', { agentId: agent.id }, { success: '已刪除' }); await refresh(); } catch { /* 已提示 */ }
}
</script>

<style scoped src="./adminPanel.css"></style>
<style scoped>
.lap-sheet { display: flex; flex-direction: column; max-height: 90vh; }
.lap-scroll { flex: 1 1 auto; overflow-y: auto; }
.lap-num { max-width: 110px !important; }
.lap-model { flex: 1; min-width: 0; }
.lap-model__meta { display: flex; align-items: center; gap: 8px; margin-top: 4px; font-size: 12px; color: #6e6e73; overflow-wrap: anywhere; }
.lap-model-row { align-items: flex-start; padding-top: 9px; padding-bottom: 9px; }
.lap-model-row > .mac-form-row-label { padding-top: 7px; }
.lap-test { display: flex; align-items: center; gap: 8px; margin: 8px 2px 0; }
</style>
