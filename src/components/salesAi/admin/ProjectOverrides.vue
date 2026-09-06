<template>
  <div>
    <div class="d-flex align-center mb-3">
      <div>
        <div class="text-subtitle-1 font-weight-bold">建案覆蓋</div>
        <div class="text-caption text-grey">與各建案「銷控設定 → AI 助理」為同一份資料；此處可代為修改並指定 Profile。</div>
      </div>
      <v-spacer></v-spacer>
      <v-btn size="small" variant="text" prepend-icon="mdi-refresh" :loading="loading" @click="load">重新整理</v-btn>
    </div>
    <v-table density="compact">
      <thead><tr><th>建案</th><th>可修改</th><th>可退戶</th><th>角色限制</th><th>Profile</th><th>Token 用量</th><th></th></tr></thead>
      <tbody>
        <tr v-for="p in projects" :key="p.id">
          <td><div class="font-weight-medium">{{ p.name }}</div><div class="text-caption text-grey">{{ p.id }}</div></td>
          <td><v-chip size="x-small" :color="p.aiAssistant.allowWrite ? 'warning' : 'grey'" variant="flat">{{ p.aiAssistant.allowWrite ? '開' : '關' }}</v-chip></td>
          <td><v-chip size="x-small" :color="p.aiAssistant.allowCancel ? 'error' : 'grey'" variant="flat">{{ p.aiAssistant.allowCancel ? '開' : '關' }}</v-chip></td>
          <td class="text-caption">{{ (p.aiAssistant.writeRoles || []).join('、') || '—' }}</td>
          <td class="text-caption">{{ p.aiAssistant.modelProfileId || '（全域預設）' }}</td>
          <td class="text-caption">{{ p.aiTokenUsed.toLocaleString() }} / {{ p.aiTokenQuota ? p.aiTokenQuota.toLocaleString() : '∞' }}</td>
          <td class="text-right"><v-btn size="x-small" variant="text" @click="edit(p)">編輯</v-btn></td>
        </tr>
      </tbody>
    </v-table>

    <v-dialog v-model="dlg.show" max-width="640" scrollable>
      <v-card v-if="dlg.p">
        <v-card-title class="text-subtitle-1">{{ dlg.p.name }}</v-card-title>
        <v-card-text>
          <v-switch v-model="dlg.form.allowWrite" color="primary" inset density="compact" label="允許 AI 透過草案修改銷控" hide-details></v-switch>
          <v-switch v-model="dlg.form.allowCancel" color="error" inset density="compact" :disabled="!dlg.form.allowWrite" label="允許 AI 建立退戶草案" hide-details class="mb-3"></v-switch>
          <v-combobox v-model="dlg.form.writeRoles" :items="['超級管理員', '系統管理員', '建案主管', '專案經理', '銷售']" multiple chips closable-chips clearable variant="outlined" density="compact" label="限制可修改的角色（空 = 不限）" class="mb-2"></v-combobox>
          <v-select v-model="dlg.form.modelProfileId" :items="[{ title: '（全域預設）', value: null }, ...profileItems]" variant="outlined" density="compact" label="模型 Profile" class="mb-2"></v-select>
          <v-select v-model="dlg.form.disabledTools" :items="toolNames" multiple chips closable-chips variant="outlined" density="compact" label="本建案停用的工具" class="mb-2"></v-select>
          <v-row dense>
            <v-col cols="6"><v-text-field v-model.number="dlg.form.dailyProposalLimit" type="number" variant="outlined" density="compact" label="每日草案上限"></v-text-field></v-col>
            <v-col cols="6"><v-text-field v-model.number="dlg.tokenQuota" type="number" variant="outlined" density="compact" label="Token 額度（0 = 不限）"></v-text-field></v-col>
          </v-row>
          <v-textarea v-model="dlg.form.promptOverride.projectIntro" variant="outlined" density="compact" rows="3" auto-grow label="建案介紹"></v-textarea>
          <v-textarea v-model="dlg.form.promptOverride.extraRules" variant="outlined" density="compact" rows="2" auto-grow label="補充規則"></v-textarea>
        </v-card-text>
        <v-card-actions><v-spacer></v-spacer><v-btn variant="text" @click="dlg.show = false">取消</v-btn><v-btn color="primary" variant="flat" :loading="dlg.saving" @click="save">儲存</v-btn></v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue';
import { useAiAdmin } from './useAiAdmin';

const props = defineProps({ data: { type: Object, required: true } });
const { run } = useAiAdmin();
const projects = ref([]);
const loading = ref(false);
const profileItems = computed(() => Object.entries(props.data.global.profiles || {}).map(([id, p]) => ({ title: `${p.label}（${p.model}）`, value: id })));
const toolNames = computed(() => (props.data.tools || []).map(t => t.name));

async function load() {
  loading.value = true;
  try { const r = await run('listProjects'); projects.value = r.projects || []; } catch { /* ignore */ } finally { loading.value = false; }
}
onMounted(load);

const dlg = reactive({ show: false, p: null, form: null, tokenQuota: 0, saving: false });
function edit(p) {
  const a = p.aiAssistant;
  dlg.p = p; dlg.tokenQuota = p.aiTokenQuota;
  dlg.form = { allowWrite: !!a.allowWrite, allowCancel: !!a.allowCancel, writeRoles: [...(a.writeRoles || [])], modelProfileId: a.modelProfileId || null, disabledTools: [...(a.disabledTools || [])], dailyProposalLimit: a.dailyProposalLimit || 200, promptOverride: { projectIntro: a.promptOverride?.projectIntro || '', extraRules: a.promptOverride?.extraRules || '' } };
  dlg.show = true;
}
async function save() {
  dlg.saving = true;
  try { await run('saveProjectOverride', { projectId: dlg.p.id, aiAssistant: dlg.form, aiTokenQuota: dlg.tokenQuota }, { success: '已儲存' }); dlg.show = false; load(); } catch { /* ignore */ } finally { dlg.saving = false; }
}
</script>
