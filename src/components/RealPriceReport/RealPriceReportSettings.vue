<template>
  <v-card class="pa-4" elevation="2">
    <v-card-title class="text-h5 text-primary d-flex align-center">
      <v-icon start>mdi-home-city-outline</v-icon>
      實價登錄申報設定
      <v-spacer />
      <v-btn
        color="primary"
        variant="flat"
        prepend-icon="mdi-content-save"
        :loading="saving"
        :disabled="loading"
        @click="onSave"
      >
        儲存建案預設
      </v-btn>
    </v-card-title>
    <v-card-subtitle>
      設定「全建案共用」的實價登錄申報預設值。戶別匯出時會以此為基礎，再套用戶別覆寫與系統自動映射。
    </v-card-subtitle>
    <v-divider class="my-3" />

    <v-skeleton-loader v-if="loading" type="article" />

    <template v-else>
      <v-tabs v-model="subTab" color="primary" grow class="mb-3">
        <v-tab value="main"><v-icon start>mdi-file-document-multiple</v-icon>主體資料</v-tab>
        <v-tab value="land"><v-icon start>mdi-terrain</v-icon>土地資料</v-tab>
        <v-tab value="build"><v-icon start>mdi-home-modern</v-icon>建物資料</v-tab>
        <v-tab value="car"><v-icon start>mdi-parking</v-icon>車位資料</v-tab>
        <v-tab value="sign"><v-icon start>mdi-file-sign</v-icon>簽約日期</v-tab>
      </v-tabs>

      <v-window v-model="subTab">
        <v-window-item value="main">
          <MainDataEditor
            v-model="draft.mainDefaults"
            readonly-hint="這裡是「建案預設值」。戶別的買受人、交易日期、總價等欄位會在匯出時由系統自動帶入或由該戶覆寫。"
          />
        </v-window-item>
        <v-window-item value="land">
          <LandDataEditor v-model="draft.landDefaults" />
        </v-window-item>
        <v-window-item value="build">
          <BuildDataEditor
            v-model="draft.buildDefaults"
            hint="建案預設的建物欄位（如共有部分）。戶別匯出時，主建物/陽台等會由該戶面積資料自動帶入。"
          />
        </v-window-item>
        <v-window-item value="car">
          <CarDataEditor v-model="draft.carDefaults" />
        </v-window-item>
        <v-window-item value="sign">
          <SignDataEditor v-model="draft.signDefaults" />
        </v-window-item>
      </v-window>
    </template>
  </v-card>
</template>

<script setup>
import { ref, watch, onMounted } from 'vue';
import { useToast } from 'vue-toastification';
import { useUserStore } from '@/store/user';
import {
  loadProjectRealPriceReport,
  saveProjectRealPriceReport,
} from '@/composables/useRealPriceReport';
import { buildEmptyMainData, buildEmptyBuildData } from '@/constants/realPriceReportSchema';
import MainDataEditor from './MainDataEditor.vue';
import LandDataEditor from './LandDataEditor.vue';
import BuildDataEditor from './BuildDataEditor.vue';
import CarDataEditor from './CarDataEditor.vue';
import SignDataEditor from './SignDataEditor.vue';

const props = defineProps({
  projectId: { type: String, required: true },
});

const toast = useToast();
const userStore = useUserStore();

const subTab = ref('main');
const loading = ref(false);
const saving = ref(false);

const draft = ref({
  mainDefaults: buildEmptyMainData(),
  landDefaults: [],
  buildDefaults: buildEmptyBuildData(),
  carDefaults: [],
  signDefaults: { defaultContractType: '一般合約' },
});

async function load() {
  loading.value = true;
  try {
    const data = await loadProjectRealPriceReport(props.projectId);
    draft.value = {
      mainDefaults: { ...buildEmptyMainData(), ...(data.mainDefaults || {}) },
      landDefaults: Array.isArray(data.landDefaults) ? data.landDefaults : [],
      buildDefaults: { ...buildEmptyBuildData(), ...(data.buildDefaults || {}) },
      carDefaults: Array.isArray(data.carDefaults) ? data.carDefaults : [],
      signDefaults: data.signDefaults || { defaultContractType: '一般合約' },
    };
  } catch (e) {
    toast.error(`載入實價登錄設定失敗：${e.message}`);
  } finally {
    loading.value = false;
  }
}

async function onSave() {
  saving.value = true;
  try {
    await saveProjectRealPriceReport(
      props.projectId,
      draft.value,
      userStore.user?.email || ''
    );
    toast.success('實價登錄申報設定已儲存');
  } catch (e) {
    toast.error(`儲存失敗：${e.message}`);
  } finally {
    saving.value = false;
  }
}

watch(() => props.projectId, (val) => {
  if (val) load();
});

onMounted(() => {
  if (props.projectId) load();
});
</script>
