<template>
  <v-dialog :model-value="modelValue" :fullscreen="!mdAndUp" max-width="720" scrollable @update:model-value="(v) => emit('update:modelValue', v)">
    <v-card>
      <v-card-title class="d-flex align-center">
        <v-icon class="mr-2" color="primary">mdi-web</v-icon>
        網路蒐集
        <v-spacer />
        <v-btn icon="mdi-close" variant="text" size="small" @click="emit('update:modelValue', false)" />
      </v-card-title>
      <v-divider />

      <v-card-text>
        <div class="d-flex align-center justify-space-between mb-1">
          <div class="text-subtitle-2">縣市</div>
          <div>
            <v-btn size="x-small" variant="text" @click="form.cities = [...HARVEST_DEFAULT_CITIES]">六都</v-btn>
            <v-btn size="x-small" variant="text" @click="form.cities = [...PROSPECT_CITY_NAMES]">全選</v-btn>
            <v-btn size="x-small" variant="text" @click="form.cities = []">清除</v-btn>
          </div>
        </div>
        <v-chip-group v-model="form.cities" column multiple color="primary" class="mb-3">
          <v-chip v-for="c in PROSPECT_CITY_NAMES" :key="c" :value="c" size="small" filter>{{ c }}</v-chip>
        </v-chip-group>

        <v-row dense class="mb-1">
          <v-col cols="12" sm="6">
            <div class="text-subtitle-2 mb-1">類別</div>
            <v-checkbox v-for="o in HARVEST_CATEGORY_OPTIONS" :key="o.value" v-model="form.categories" :value="o.value" :label="o.title" density="compact" hide-details />
          </v-col>
          <v-col cols="12" sm="6">
            <v-text-field v-model="form.since" type="date" label="建案備查起日" variant="outlined" density="comfortable" hide-details class="mb-3" />
            <v-switch v-model="form.enrich" color="primary" density="compact" hide-details label="連帶補 Email（官網）" />
            <div v-if="form.enrich && !hasSearchKey" class="text-caption text-warning mt-1">未設定搜尋金鑰，只查已知官網</div>
          </v-col>
        </v-row>

        <v-alert v-if="activeJob" type="info" variant="tonal" density="compact" class="mb-2">已有工作執行中，完成後才能再啟動。</v-alert>

        <template v-if="jobs.length">
          <v-divider class="my-3" />
          <div class="text-subtitle-2 mb-1">歷次紀錄</div>
          <v-table density="compact">
            <thead>
              <tr><th>時間</th><th>範圍</th><th>狀態</th><th>結果</th></tr>
            </thead>
            <tbody>
              <tr v-for="j in jobs.slice(0, 10)" :key="j.id">
                <td class="text-no-wrap">{{ fmtTime(j.createdAt) }}</td>
                <td>{{ scopeText(j) }}</td>
                <td><v-chip size="x-small" :color="HARVEST_STATUS_LABELS[j.status]?.color || 'grey'" variant="tonal">{{ HARVEST_STATUS_LABELS[j.status]?.label || j.status }}</v-chip></td>
                <td class="text-caption">{{ harvestResultText(j) }}</td>
              </tr>
            </tbody>
          </v-table>
        </template>
      </v-card-text>

      <v-divider />
      <v-card-actions>
        <v-spacer />
        <v-btn variant="text" @click="emit('update:modelValue', false)">取消</v-btn>
        <v-btn color="primary" variant="flat" :loading="starting" :disabled="!!activeJob || !form.cities.length || !form.categories.length" @click="start">開始蒐集</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { ref, computed, reactive } from 'vue';
import { useDisplay } from 'vuetify';
import { formatInTimeZone } from 'date-fns-tz';
import { useUserStore } from '@/store/user';
import { useUiStore } from '@/store/uiStore';
import { prospectHarvestAPI } from '@/api';
import {
  PROSPECT_CITY_NAMES,
  HARVEST_CATEGORY_OPTIONS,
  HARVEST_DEFAULT_CITIES,
  HARVEST_STATUS_LABELS,
  isHarvestActive,
  harvestResultText,
  toDate,
} from '@/services/prospectService';

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  /** 所有工作（新→舊） */
  jobs: { type: Array, default: () => [] },
  hasSearchKey: { type: Boolean, default: false },
});
const emit = defineEmits(['update:modelValue', 'started']);

const { mdAndUp } = useDisplay();
const userStore = useUserStore();
const uiStore = useUiStore();

const form = reactive({ cities: [...HARVEST_DEFAULT_CITIES], categories: ['project', 'builder', 'agency'], since: '2024-01-01', enrich: true });
const starting = ref(false);
const activeJob = computed(() => props.jobs.find(isHarvestActive) || null);

const fmtTime = (ts) => { const d = toDate(ts); return d ? formatInTimeZone(d, 'Asia/Taipei', 'MM/dd HH:mm') : ''; };
function scopeText(j) {
  const p = j.params || {};
  const cities = (p.cities || []).length === PROSPECT_CITY_NAMES.length ? '全台' : (p.cities || []).map((c) => c.slice(0, 2)).join('、');
  const cats = (p.categories || []).map((c) => HARVEST_CATEGORY_OPTIONS.find((o) => o.value === c)?.title || c).join('／');
  return `${cities}　${cats}${p.enrich ? '　補 Email' : ''}`;
}

async function start() {
  starting.value = true;
  try {
    const res = await prospectHarvestAPI({ action: 'start', operatorKey: userStore.user?.key || '', params: { ...form, cities: [...form.cities], categories: [...form.categories] } });
    uiStore.showSnackbar('已開始蒐集，進度顯示在頁面頂部', 'success');
    emit('started', res.jobId);
    emit('update:modelValue', false);
  } catch (e) {
    console.error(e);
    uiStore.showSnackbar(e.message || '啟動失敗', 'error');
  } finally {
    starting.value = false;
  }
}
</script>
