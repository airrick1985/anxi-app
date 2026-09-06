<template>
  <div>
    <div class="d-flex align-center mb-3">
      <div>
        <div class="text-subtitle-1 font-weight-bold">功能開關與限制</div>
        <div class="text-caption text-grey">停用的工具不會註冊給模型（模型無從呼叫）。建案可再個別停用。</div>
      </div>
      <v-spacer></v-spacer>
      <v-btn size="small" color="primary" :loading="saving" @click="save">儲存</v-btn>
    </div>
    <v-table density="compact">
      <thead><tr><th>工具</th><th>說明</th><th>需要能力</th><th style="width:90px">啟用</th></tr></thead>
      <tbody>
        <tr v-for="t in tools" :key="t.name">
          <td><code>{{ t.name }}</code></td>
          <td class="text-caption">{{ t.description }}</td>
          <td><v-chip size="x-small" variant="tonal" :color="capColor(t.requires)">{{ t.requires || '任何' }}</v-chip></td>
          <td><v-switch v-model="enabled[t.name]" color="primary" density="compact" hide-details inset></v-switch></td>
        </tr>
      </tbody>
    </v-table>

    <div class="text-subtitle-2 font-weight-bold mt-5 mb-2">限制</div>
    <v-row dense>
      <v-col cols="6" md="3"><v-text-field v-model.number="limits.perUserPerMinute" type="number" variant="outlined" density="compact" label="每人每分鐘則數"></v-text-field></v-col>
      <v-col cols="6" md="3"><v-text-field v-model.number="limits.historyMessages" type="number" variant="outlined" density="compact" label="帶入歷史則數"></v-text-field></v-col>
      <v-col cols="6" md="2"><v-text-field v-model.number="limits.maxToolRounds" type="number" variant="outlined" density="compact" label="工具輪數上限"></v-text-field></v-col>
      <v-col cols="6" md="2"><v-text-field v-model.number="limits.proposalTtlMinutes" type="number" variant="outlined" density="compact" label="草案有效分鐘"></v-text-field></v-col>
      <v-col cols="6" md="2"><v-text-field v-model.number="limits.maxHistoryChars" type="number" variant="outlined" density="compact" label="每則最大字數"></v-text-field></v-col>
    </v-row>
  </div>
</template>

<script setup>
import { ref, reactive, computed, watch } from 'vue';
import { useAiAdmin } from './useAiAdmin';

const props = defineProps({ data: { type: Object, required: true } });
const emit = defineEmits(['changed']);
const { run } = useAiAdmin();
const tools = computed(() => props.data.tools || []);
const enabled = reactive({});
const limits = reactive({});
function load() {
  for (const t of tools.value) enabled[t.name] = t.enabled !== false;
  Object.assign(limits, props.data.global.limits || {});
}
load();
watch(() => props.data, load);
const saving = ref(false);
const capColor = c => (c === 'sales.write' ? 'warning' : c === 'sales.cancel' ? 'error' : c ? 'primary' : 'grey');
async function save() {
  saving.value = true;
  try {
    const t = {}; for (const [k, v] of Object.entries(enabled)) t[k] = { enabled: v };
    await run('saveTools', { tools: t });
    await run('saveLimits', { limits }, { success: '已儲存' });
    emit('changed');
  } catch { /* ignore */ } finally { saving.value = false; }
}
</script>
