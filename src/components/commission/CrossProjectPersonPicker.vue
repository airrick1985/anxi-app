<template>
  <v-dialog :model-value="modelValue" max-width="560" @update:model-value="v => $emit('update:modelValue', v)">
    <v-card>
      <v-card-title class="bg-primary text-white text-subtitle-1">
        加入他案／臨時人員
      </v-card-title>
      <v-card-text class="pt-4">
        <v-tabs v-model="mode" density="compact" color="primary" class="mb-3">
          <v-tab value="search">跨建案搜尋</v-tab>
          <v-tab value="manual">臨時新增</v-tab>
        </v-tabs>

        <div v-if="mode === 'search'">
          <v-text-field
            v-model="searchTerm"
            label="輸入姓名或電話（前綴搜尋）"
            variant="outlined"
            density="compact"
            prepend-inner-icon="mdi-magnify"
            hide-details
            clearable
            @keyup.enter="doSearch"
          ></v-text-field>
          <div class="text-caption text-medium-emphasis mt-1 mb-2">
            搜尋所有建案的銷售人員名單；同一人以「電話」識別，扣款比例將帶入原案設定（可於明細覆寫）。
          </div>
          <v-btn color="primary" size="small" variant="flat" :loading="searching" @click="doSearch" prepend-icon="mdi-magnify">搜尋</v-btn>

          <v-list v-if="results.length" density="compact" class="mt-2 result-list">
            <v-list-item
              v-for="r in results"
              :key="r.id"
              @click="pick(r)"
              :subtitle="`${r.phone || '—'}　職務：${(r.positions || []).join('、') || '—'}`"
            >
              <template #title>
                <span class="font-weight-medium">{{ r.name }}</span>
                <v-chip size="x-small" color="orange" variant="tonal" class="ml-2">
                  {{ projectNameOf(r.projectId) }}
                </v-chip>
              </template>
              <template #append>
                <v-icon color="primary">mdi-plus-circle-outline</v-icon>
              </template>
            </v-list-item>
          </v-list>
          <v-alert v-else-if="searched && !searching" type="info" variant="tonal" density="compact" class="mt-3">
            查無符合的人員，可切換「臨時新增」直接輸入。
          </v-alert>
        </div>

        <div v-else>
          <v-form ref="manualForm">
            <v-text-field v-model="manual.name" label="姓名 *" variant="outlined" density="compact" :rules="[v => !!v || '必填']" class="mb-2"></v-text-field>
            <v-text-field v-model="manual.phone" label="電話（作為跨案識別鍵，建議填寫）" variant="outlined" density="compact" class="mb-2"></v-text-field>
            <v-row dense>
              <v-col cols="4"><v-text-field v-model.number="manual.keepPct" label="保留款%" type="number" variant="outlined" density="compact"></v-text-field></v-col>
              <v-col cols="4"><v-text-field v-model.number="manual.taxPct" label="稅金%" type="number" variant="outlined" density="compact"></v-text-field></v-col>
              <v-col cols="4"><v-text-field v-model.number="manual.nhiPct" label="二代健保%" type="number" variant="outlined" density="compact"></v-text-field></v-col>
            </v-row>
            <v-text-field v-model="manual.remark" label="備註" variant="outlined" density="compact"></v-text-field>
          </v-form>
        </div>
      </v-card-text>
      <v-divider></v-divider>
      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn variant="text" @click="$emit('update:modelValue', false)">關閉</v-btn>
        <v-btn v-if="mode === 'manual'" color="primary" variant="flat" @click="addManual">加入</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { ref } from 'vue';
import { useToast } from 'vue-toastification';
import { searchSalesPersonnelAcrossProjects } from '@/api';
import { useProjectStore } from '@/store/projectStore';
import { toNum } from '@/utils/commissionCalculation';

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  projectId: { type: String, default: '' },
});
const emit = defineEmits(['update:modelValue', 'select']);

const toast = useToast();
const projectStore = useProjectStore();

const mode = ref('search');
const searchTerm = ref('');
const searching = ref(false);
const searched = ref(false);
const results = ref([]);
const manualForm = ref(null);
const manual = ref({ name: '', phone: '', keepPct: 0, taxPct: 0, nhiPct: 0, remark: '' });

function projectNameOf(pid) {
  return projectStore.idToNameMap?.[pid] || pid || '';
}

async function doSearch() {
  const t = String(searchTerm.value || '').trim();
  if (!t) return;
  searching.value = true;
  try {
    results.value = await searchSalesPersonnelAcrossProjects(t);
    searched.value = true;
  } catch (e) {
    console.error('[CrossProjectPersonPicker] 搜尋失敗:', e);
    toast.error(`搜尋失敗：${e.message}`);
  } finally {
    searching.value = false;
  }
}

function pick(r) {
  const bc = r.bonusConfig || {};
  emit('select', {
    personKey: r.phone || `ext:${r.name}`,
    name: r.name,
    phone: r.phone || '',
    role: (r.positions || []).join('、'),
    sourceProjectId: r.projectId,
    sourceProjectName: projectNameOf(r.projectId),
    isExternal: false,
    profile: {
      keepPct: toNum(bc.keepPct),
      taxPct: toNum(bc.taxPct),
      nhiPct: toNum(bc.nhiPct),
      remark: bc.remark || '',
    },
  });
  emit('update:modelValue', false);
}

async function addManual() {
  const { valid } = await manualForm.value.validate();
  if (!valid) return;
  const m = manual.value;
  emit('select', {
    personKey: m.phone ? m.phone : `ext:${m.name}`,
    name: m.name,
    phone: m.phone || '',
    role: '',
    sourceProjectId: props.projectId,
    sourceProjectName: '',
    isExternal: true,
    profile: {
      keepPct: toNum(m.keepPct),
      taxPct: toNum(m.taxPct),
      nhiPct: toNum(m.nhiPct),
      remark: m.remark || '',
    },
  });
  manual.value = { name: '', phone: '', keepPct: 0, taxPct: 0, nhiPct: 0, remark: '' };
  emit('update:modelValue', false);
}
</script>

<style scoped>
.result-list {
  max-height: 300px;
  overflow-y: auto;
  border: 1px solid rgba(0, 0, 0, 0.08);
  border-radius: 8px;
}
</style>
