<template>
  <div>
    <div class="d-flex align-center flex-wrap ga-2 mb-3">
      <div>
        <div class="text-subtitle-1 font-weight-bold">提示詞</div>
        <div class="text-caption text-grey">固定段由程式寫死（唯讀），可編輯段儲存即建版本；變數：{{ vars.join('、') }}</div>
      </div>
      <v-spacer></v-spacer>
      <v-btn size="small" variant="text" prepend-icon="mdi-history" @click="loadVersions">版本（{{ versions.length }}）</v-btn>
      <v-btn size="small" color="primary" prepend-icon="mdi-content-save" :loading="saving" @click="save">儲存為新版本</v-btn>
    </div>

    <v-row>
      <v-col cols="12" lg="7">
        <v-expansion-panels variant="accordion" class="mb-3">
          <v-expansion-panel title="固定段 A：身份與權限（唯讀）"><v-expansion-panel-text><pre class="fixed-prompt">{{ data.fixedPrompt.A }}</pre></v-expansion-panel-text></v-expansion-panel>
          <v-expansion-panel title="固定段 B：資料即資料／修改須走草案（唯讀）"><v-expansion-panel-text><pre class="fixed-prompt">{{ data.fixedPrompt.B }}</pre></v-expansion-panel-text></v-expansion-panel>
          <v-expansion-panel title="固定段 C：回覆格式（唯讀）"><v-expansion-panel-text><pre class="fixed-prompt">{{ data.fixedPrompt.C }}</pre></v-expansion-panel-text></v-expansion-panel>
        </v-expansion-panels>

        <v-textarea v-model="form.persona" variant="outlined" rows="4" auto-grow label="角色（persona）" class="mb-2"></v-textarea>
        <v-textarea v-model="form.style" variant="outlined" rows="3" auto-grow label="語氣與風格（style）" class="mb-2"></v-textarea>
        <v-textarea v-model="form.projectIntroDefault" variant="outlined" rows="3" auto-grow label="建案介紹預設值（建案未填時使用）" class="mb-2"></v-textarea>
        <v-textarea v-model="form.extraRules" variant="outlined" rows="3" auto-grow label="補充規則（全域）" hint="會放在固定段 C 之前；不得抵觸固定段" persistent-hint class="mb-4"></v-textarea>

        <div class="text-subtitle-2 font-weight-bold mb-1">快捷指令</div>
        <div v-for="(qp, i) in form.quickPrompts" :key="i" class="d-flex ga-2 align-center mb-1">
          <v-text-field v-model="qp.label" variant="outlined" density="compact" hide-details label="標籤" style="max-width:140px"></v-text-field>
          <v-text-field v-model="qp.text" variant="outlined" density="compact" hide-details label="送出的內容"></v-text-field>
          <v-select v-model="qp.requires" :items="[{ title: '不限', value: null }, { title: '可查詢', value: 'sales.read' }, { title: '可修改', value: 'sales.write' }]" variant="outlined" density="compact" hide-details style="max-width:120px"></v-select>
          <v-btn icon="mdi-close" size="x-small" variant="text" @click="form.quickPrompts.splice(i, 1)"></v-btn>
        </div>
        <v-btn size="x-small" variant="text" prepend-icon="mdi-plus" @click="form.quickPrompts.push({ label: '', text: '', requires: 'sales.read' })">新增快捷</v-btn>

        <v-text-field v-model="note" variant="outlined" density="compact" label="版本備註（儲存時必填）" class="mt-4"></v-text-field>
      </v-col>

      <v-col cols="12" lg="5">
        <div class="text-subtitle-2 font-weight-bold mb-1">組裝預覽（以範例變數代入）</div>
        <pre class="preview">{{ preview }}</pre>
      </v-col>
    </v-row>

    <v-dialog v-model="versionsDlg" max-width="760" scrollable>
      <v-card>
        <v-card-title class="text-subtitle-1">提示詞版本</v-card-title>
        <v-card-text>
          <v-table density="compact">
            <thead><tr><th>時間</th><th>備註</th><th>建立者</th><th></th></tr></thead>
            <tbody>
              <tr v-for="v in versions" :key="v.id" :class="{ 'active-version': v.id === data.global.prompt.activeVersionId }">
                <td class="text-caption">{{ v.createdAt ? new Date(v.createdAt).toLocaleString('zh-TW', { timeZone: 'Asia/Taipei' }) : '' }}</td>
                <td>{{ v.note }}<v-chip v-if="v.id === data.global.prompt.activeVersionId" size="x-small" color="primary" variant="flat" class="ml-1">目前</v-chip></td>
                <td class="text-caption">{{ v.createdByName }}</td>
                <td class="text-right text-no-wrap">
                  <v-btn size="x-small" variant="text" @click="preview_ = v.prompt">檢視</v-btn>
                  <v-btn size="x-small" variant="text" color="primary" :disabled="v.id === data.global.prompt.activeVersionId" @click="restore(v)">還原</v-btn>
                </td>
              </tr>
            </tbody>
          </v-table>
          <pre v-if="preview_" class="preview mt-3">{{ JSON.stringify(preview_, null, 2) }}</pre>
        </v-card-text>
        <v-card-actions><v-spacer></v-spacer><v-btn variant="text" @click="versionsDlg = false">關閉</v-btn></v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, watch } from 'vue';
import { useAiAdmin } from './useAiAdmin';

const props = defineProps({ data: { type: Object, required: true } });
const emit = defineEmits(['changed']);
const { run } = useAiAdmin();

const vars = ['{{projectName}}', '{{today}}', '{{userName}}', '{{roles}}', '{{statusList}}', '{{salespersons}}', '{{capabilities}}'];
const form = reactive({ persona: '', style: '', projectIntroDefault: '', extraRules: '', quickPrompts: [] });
function load() {
  const p = props.data.global.prompt || {};
  Object.assign(form, { persona: p.persona || '', style: p.style || '', projectIntroDefault: p.projectIntroDefault || '', extraRules: p.extraRules || '', quickPrompts: (p.quickPrompts || []).map(x => ({ ...x })) });
}
load();
watch(() => props.data, load);

const note = ref('');
const saving = ref(false);
async function save() {
  if (!note.value.trim()) { alert('請填寫版本備註'); return; }
  saving.value = true;
  try { await run('savePrompt', { prompt: form, note: note.value }, { success: '已儲存新版本' }); note.value = ''; emit('changed'); } catch { /* ignore */ } finally { saving.value = false; }
}

const sample = { projectName: '測試建案A', today: new Date().toISOString().slice(0, 10), userName: '王小明', roles: '銷售', statusList: '小訂、補足、簽約、保留', salespersons: '王小明、李大華', capabilities: '查詢銷控；透過草案修改銷控' };
const fill = t => String(t || '').replace(/\{\{(\w+)\}\}/g, (_, k) => sample[k] ?? '');
const preview = computed(() => [
  fill(props.data.fixedPrompt.A), props.data.fixedPrompt.B,
  form.persona && `【角色】\n${fill(form.persona)}`, form.style && `【語氣與風格】\n${fill(form.style)}`,
  form.projectIntroDefault && `【建案介紹】\n${fill(form.projectIntroDefault)}`, form.extraRules && `【補充規則】\n${fill(form.extraRules)}`,
  props.data.fixedPrompt.C, '【建案脈絡】\n（執行期注入：今天、狀態清單、銷售人員、目前戶別）',
].filter(Boolean).join('\n\n'));

const versions = ref([]);
const versionsDlg = ref(false);
const preview_ = ref(null);
async function loadVersions() {
  try { const r = await run('listPromptVersions'); versions.value = r.versions || []; versionsDlg.value = true; preview_.value = null; } catch { /* ignore */ }
}
async function restore(v) {
  if (!confirm(`還原到「${v.note || v.id}」？`)) return;
  try { await run('restorePromptVersion', { versionId: v.id }, { success: '已還原' }); versionsDlg.value = false; emit('changed'); } catch { /* ignore */ }
}
</script>

<style scoped>
.fixed-prompt, .preview { white-space: pre-wrap; font-family: ui-monospace, Menlo, Consolas, monospace; font-size: 12px; line-height: 1.6; background: #F4F6FA; border: 1px solid #E3E8F0; border-radius: 8px; padding: 10px 12px; color: #37474F; max-height: 70vh; overflow: auto; }
.active-version { background: #EEF3FF; }
</style>
