<template>
  <div>
    <div class="lap-bar">
      <div class="lap-title">API Key</div>
      <v-spacer />
      <button class="mac-btn mac-btn--sm mac-btn--primary" @click="openAdd"><v-icon size="15">mdi-plus</v-icon>新增</button>
    </div>

    <v-table density="compact" class="mac-table">
      <thead><tr><th>名稱</th><th>供應商</th><th>狀態</th><th>更新時間</th><th class="text-right"></th></tr></thead>
      <tbody>
        <tr v-if="!keys.length"><td colspan="5" class="text-center text-grey py-4">尚未新增</td></tr>
        <tr v-for="k in keys" :key="k.name">
          <td><div class="font-weight-medium">{{ k.label }}</div><div class="lap-sub"><code>{{ k.name }}</code></div></td>
          <td>{{ settings.providers[k.provider]?.label || k.provider }}</td>
          <td><span class="mac-tag" :class="status(k).exists ? 'lap-ok' : 'lap-bad'">{{ status(k).exists ? '已設定' : '未設定' }}</span></td>
          <td class="lap-sub">{{ status(k).updatedAt ? new Date(status(k).updatedAt).toLocaleString('zh-TW', { timeZone: 'Asia/Taipei' }) : '—' }}</td>
          <td class="text-right text-no-wrap">
            <button class="mac-btn mac-btn--sm" :disabled="validating === k.name" @click="validate(k)">驗證</button>
            <button class="mac-btn mac-btn--sm ml-1" @click="openSet(k)">更新金鑰</button>
            <button class="mac-icon-btn mac-icon-btn--danger ml-1" title="移除" @click="remove(k)"><v-icon size="16">mdi-trash-can-outline</v-icon></button>
          </td>
        </tr>
      </tbody>
    </v-table>
    <div v-if="validateResult" class="lap-sub mt-2" :class="validateResult.ok ? 'text-success' : 'text-error'">
      {{ validateResult.ok ? `金鑰有效${validateResult.models?.length ? `，可用模型 ${validateResult.models.length} 個` : ''}` : `驗證失敗：${validateResult.message}` }}
    </div>

    <v-dialog v-model="add.show" max-width="480" content-class="mac-dialog-fit">
      <div class="mac-sheet">
        <div class="mac-sheet-head">新增 API Key<button class="mac-sheet-close" @click="add.show = false"><v-icon size="18">mdi-close</v-icon></button></div>
        <div class="mac-form lap-form">
          <div class="mac-form-group">
            <div class="mac-form-row"><span class="mac-form-row-label">顯示名稱</span><input v-model="add.label" class="mac-form-input" placeholder="例：Claude 正式" /></div>
            <div class="mac-form-row">
              <span class="mac-form-row-label">供應商</span>
              <select v-model="add.provider" class="mac-form-input mac-form-select">
                <option v-for="(p, k) in settings.providers" :key="k" :value="k">{{ p.label }}</option>
              </select>
            </div>
            <div class="mac-form-row"><span class="mac-form-row-label">密鑰名稱</span><input v-model="add.name" class="mac-form-input" placeholder="LINEAI_KEY_CLAUDE" /></div>
            <div class="mac-form-row"><span class="mac-form-row-label">金鑰</span><input v-model="add.value" type="password" autocomplete="off" class="mac-form-input" /></div>
          </div>
        </div>
        <div class="mac-sheet-foot">
          <span class="mac-spacer" />
          <button class="mac-btn" @click="add.show = false">取消</button>
          <button class="mac-btn mac-btn--primary" :disabled="add.saving || !add.name || !add.value" @click="saveAdd">儲存</button>
        </div>
      </div>
    </v-dialog>

    <v-dialog v-model="set.show" max-width="480" content-class="mac-dialog-fit">
      <div class="mac-sheet">
        <div class="mac-sheet-head">更新金鑰：{{ set.key?.label }}<button class="mac-sheet-close" @click="set.show = false"><v-icon size="18">mdi-close</v-icon></button></div>
        <div class="mac-sheet-section">
          <input v-model="set.value" type="password" autocomplete="off" class="mac-form-input lap-full" placeholder="新的 API Key" />
          <div v-if="set.check" class="lap-sub mt-2" :class="set.check.ok ? 'text-success' : 'text-error'">{{ set.check.ok ? '驗證通過' : `驗證失敗：${set.check.message}` }}</div>
        </div>
        <div class="mac-sheet-foot">
          <button class="mac-btn" :disabled="!set.value || set.checking" @click="checkDraft">先驗證</button>
          <span class="mac-spacer" />
          <button class="mac-btn" @click="set.show = false">取消</button>
          <button class="mac-btn mac-btn--primary" :disabled="!set.value || set.saving" @click="saveSet">儲存</button>
        </div>
      </div>
    </v-dialog>
  </div>
</template>

<script setup>
import { reactive, ref, computed } from 'vue';
import { useLineAiAdmin } from './useLineAiAdmin';

const { settings, refresh, run } = useLineAiAdmin();
const keys = computed(() => settings.value.global.keys || []);
const status = k => settings.value.keyStatus[k.name] || {};

const validating = ref(null);
const validateResult = ref(null);
const add = reactive({ show: false, saving: false, label: '', provider: 'gemini', name: '', value: '' });
const set = reactive({ show: false, saving: false, checking: false, key: null, value: '', check: null });

function openAdd() { Object.assign(add, { show: true, saving: false, label: '', provider: 'gemini', name: '', value: '' }); }

async function saveAdd() {
  add.saving = true;
  try {
    await run('saveKey', { name: add.name.trim(), provider: add.provider, label: add.label.trim() });
    await run('setSecret', { secretName: add.name.trim(), value: add.value }, { success: '已儲存' });
    add.show = false;
    await refresh();
  } catch { /* 已提示 */ } finally {
    add.saving = false;
  }
}

function openSet(k) { Object.assign(set, { show: true, saving: false, checking: false, key: k, value: '', check: null }); }

async function checkDraft() {
  set.checking = true;
  try { set.check = await run('validateSecret', { secretName: set.key.name, provider: set.key.provider, value: set.value }); } catch { /* 已提示 */ } finally { set.checking = false; }
}

async function saveSet() {
  set.saving = true;
  try {
    await run('setSecret', { secretName: set.key.name, value: set.value }, { success: '已更新，最遲 10 分鐘生效' });
    set.show = false;
    await refresh();
  } catch { /* 已提示 */ } finally {
    set.saving = false;
  }
}

async function validate(k) {
  validating.value = k.name;
  validateResult.value = null;
  try { validateResult.value = await run('validateSecret', { secretName: k.name, provider: k.provider }); } catch { /* 已提示 */ } finally { validating.value = null; }
}

async function remove(k) {
  if (!confirm(`從清單移除「${k.label}」？`)) return;
  try { await run('removeKey', { name: k.name }, { success: '已移除' }); await refresh(); } catch { /* 已提示 */ }
}
</script>

<style scoped src="./adminPanel.css"></style>
<style scoped>
.lap-full { width: 100%; }
</style>
