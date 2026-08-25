<template>
  <div>
    <v-form ref="form">
      <!-- 基本比例 -->
      <v-card variant="outlined" class="mb-4">
        <v-card-title class="text-subtitle-1"><v-icon start size="small">mdi-percent</v-icon>基本比例</v-card-title>
        <v-card-text>
          <v-row dense>
            <v-col cols="6" md="3">
              <v-text-field v-model.number="local.defaultCommissionPct" label="預設佣金比例(%)" type="number" step="0.01"
                variant="outlined" density="compact" hint="包櫃/包銷佣金，例 2.2" persistent-hint></v-text-field>
            </v-col>
            <v-col cols="6" md="3">
              <v-text-field v-model.number="local.preferredPaymentFactor" label="優付倍率" type="number" step="0.05"
                variant="outlined" density="compact" hint="優付戶佣金＝預設×倍率（預設 0.5 減半）" persistent-hint></v-text-field>
            </v-col>
            <v-col cols="6" md="3">
              <v-text-field v-model.number="local.defaultKeepPct" label="請佣保留款預設(%)" type="number" step="1"
                variant="outlined" density="compact"></v-text-field>
            </v-col>
            <v-col cols="6" md="3">
              <v-text-field v-model.number="local.defaultCashPct" label="現金比例預設(%)" type="number" step="1"
                variant="outlined" density="compact" hint="其餘為期票比例" persistent-hint></v-text-field>
            </v-col>
          </v-row>
        </v-card-text>
      </v-card>

      <!-- 文字自訂 -->
      <v-card variant="outlined" class="mb-4">
        <v-card-title class="text-subtitle-1"><v-icon start size="small">mdi-format-text</v-icon>文字自訂（依建案/公司調整）</v-card-title>
        <v-card-text>
          <v-row dense>
            <v-col cols="12" md="6">
              <v-text-field v-model="local.partyALabel" label="介紹費欄位 A（計入獎金折數）" variant="outlined" density="compact"></v-text-field>
            </v-col>
            <v-col cols="12" md="6">
              <v-text-field v-model="local.partyBLabel" label="介紹費欄位 B（計入請佣基準）" variant="outlined" density="compact"></v-text-field>
            </v-col>
            <v-col cols="6" md="3">
              <v-text-field v-model="local.projectShortName" label="建案簡稱（檔名用）" variant="outlined" density="compact"></v-text-field>
            </v-col>
            <v-col cols="6" md="3">
              <v-text-field v-model="local.kiloLabel" label="「千4」標籤" variant="outlined" density="compact"></v-text-field>
            </v-col>
            <v-col cols="12" md="6">
              <v-text-field v-model="local.youfuLabelPattern" label="優付列文字（{pct}＝比例）" variant="outlined" density="compact"></v-text-field>
            </v-col>
            <v-col cols="12" md="6">
              <v-text-field v-model="local.claimTitlePattern" label="請佣總表標題（{建案名}{期別中文}{期別}）" variant="outlined" density="compact"></v-text-field>
            </v-col>
            <v-col cols="6" md="3">
              <v-text-field v-model="local.claimFileNamePattern" label="請佣檔名（{簡稱}{期別}{民國年月}）" variant="outlined" density="compact"></v-text-field>
            </v-col>
            <v-col cols="6" md="3">
              <v-text-field v-model="local.bonusFileNamePattern" label="獎金檔名（{簡稱}{期別}{民國年月}）" variant="outlined" density="compact"></v-text-field>
            </v-col>
            <v-col cols="12">
              <v-textarea v-model="local.note1" label="請佣總表條文 1" rows="2" variant="outlined" density="compact"></v-textarea>
            </v-col>
            <v-col cols="12">
              <v-textarea v-model="local.note2" label="請佣總表條文 2" rows="2" variant="outlined" density="compact"></v-textarea>
            </v-col>
          </v-row>
        </v-card-text>
      </v-card>

      <!-- 獎金類別 -->
      <v-card variant="outlined" class="mb-4">
        <v-card-title class="text-subtitle-1 d-flex align-center">
          <v-icon start size="small">mdi-shape-outline</v-icon>獎金類別
          <v-spacer></v-spacer>
          <v-btn size="small" color="primary" variant="tonal" prepend-icon="mdi-plus" @click="addCategory">新增類別</v-btn>
        </v-card-title>
        <v-card-text>
          <div class="text-caption text-medium-emphasis mb-2">
            類別 key 建立後不可修改（歷史紀錄以 key 關聯）；停用類別會隱藏但保留歷史資料。
            發放方式：依職務＝勾選符合職務者／個人＝預設帶入該戶銷售人員／團隊＝依團獎分組與進退場資格。
          </div>
          <div class="table-scroll">
            <v-table density="compact">
              <thead>
                <tr>
                  <th style="width:60px">順序</th><th>名稱</th><th style="width:120px">比例(%)</th>
                  <th style="width:140px">發放方式</th><th>對應職務關鍵字</th>
                  <th style="width:80px">啟用</th><th style="width:56px"></th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(cat, i) in local.bonusCategories" :key="cat.key">
                  <td>
                    <v-btn icon="mdi-arrow-up" size="x-small" variant="text" :disabled="i === 0" @click="moveCat(i, -1)"></v-btn>
                    <v-btn icon="mdi-arrow-down" size="x-small" variant="text" :disabled="i === local.bonusCategories.length - 1" @click="moveCat(i, 1)"></v-btn>
                  </td>
                  <td><v-text-field v-model="cat.label" variant="outlined" density="compact" hide-details></v-text-field></td>
                  <td><v-text-field v-model.number="cat.ratePct" type="number" step="0.001" variant="outlined" density="compact" hide-details></v-text-field></td>
                  <td>
                    <v-select v-model="cat.mode" :items="modeOptions" item-title="title" item-value="value"
                      variant="outlined" density="compact" hide-details></v-select>
                  </td>
                  <td>
                    <v-combobox v-model="cat.rolePositions" multiple chips closable-chips variant="outlined" density="compact"
                      hide-details :disabled="cat.mode !== 'role'" placeholder="輸入後按 Enter"></v-combobox>
                  </td>
                  <td><v-switch v-model="cat.enabled" color="primary" density="compact" hide-details></v-switch></td>
                  <td><v-btn icon="mdi-delete-outline" size="x-small" variant="text" color="error" @click="removeCat(i)"></v-btn></td>
                </tr>
              </tbody>
            </v-table>
          </div>
        </v-card-text>
      </v-card>

      <!-- 團獎分組 -->
      <v-card variant="outlined" class="mb-4">
        <v-card-title class="text-subtitle-1 d-flex align-center">
          <v-icon start size="small">mdi-account-group-outline</v-icon>團獎分組（案場）
          <v-spacer></v-spacer>
          <v-btn size="small" color="primary" variant="tonal" prepend-icon="mdi-plus" @click="addGroup">新增分組</v-btn>
        </v-card-title>
        <v-card-text>
          <div class="text-caption text-medium-emphasis mb-2">
            對應舊系統「首馥團獎／天雋團獎」；人員所屬分組於「銷控設定 → 銷售人員 → 請佣獎金設定」勾選。
          </div>
          <v-row dense>
            <v-col cols="12" sm="6" md="4" v-for="(g, i) in local.teamGroups" :key="g.key">
              <v-text-field v-model="g.label" variant="outlined" density="compact" hide-details
                :label="`分組 ${i + 1}`" append-inner-icon="mdi-delete-outline"
                @click:append-inner="local.teamGroups.splice(i, 1)"></v-text-field>
            </v-col>
          </v-row>
          <div v-if="!local.teamGroups.length" class="text-caption text-medium-emphasis">（尚無分組，未設定時工作台不顯示團獎案場勾選）</div>
        </v-card-text>
      </v-card>
    </v-form>

    <div class="d-flex justify-end">
      <v-btn color="primary" size="large" variant="flat" prepend-icon="mdi-content-save" :loading="saving" @click="save">儲存設定</v-btn>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue';
import { useToast } from 'vue-toastification';
import { useUserStore } from '@/store/user';
import { setCommissionSettings } from '@/api';
import { mergeSettings } from '@/utils/commissionCalculation';

const props = defineProps({
  projectId: { type: String, required: true },
  settings: { type: Object, required: true },
});
const emit = defineEmits(['saved']);

const toast = useToast();
const userStore = useUserStore();
const form = ref(null);
const saving = ref(false);
const local = ref(clone(props.settings));

const modeOptions = [
  { title: '依職務', value: 'role' },
  { title: '個人（銷售）', value: 'individual' },
  { title: '團隊', value: 'team' },
];

watch(() => props.settings, (v) => { local.value = clone(v); });

function clone(v) {
  return JSON.parse(JSON.stringify(mergeSettings(v)));
}

function moveCat(i, dir) {
  const arr = local.value.bonusCategories;
  const j = i + dir;
  if (j < 0 || j >= arr.length) return;
  [arr[i], arr[j]] = [arr[j], arr[i]];
  arr.forEach((c, idx) => { c.order = idx + 1; });
}

function addCategory() {
  const key = `cat${Date.now().toString(36)}`;
  local.value.bonusCategories.push({
    key, label: '新類別', ratePct: 0, mode: 'role', rolePositions: [], enabled: true,
    order: local.value.bonusCategories.length + 1,
  });
}

function removeCat(i) {
  const cat = local.value.bonusCategories[i];
  if (!window.confirm(`確定刪除類別「${cat.label}」？若已有歷史紀錄使用此類別，建議改為「停用」。`)) return;
  local.value.bonusCategories.splice(i, 1);
}

function addGroup() {
  local.value.teamGroups.push({ key: `g${Date.now().toString(36)}`, label: '' });
}

async function save() {
  saving.value = true;
  try {
    const data = JSON.parse(JSON.stringify(local.value));
    data.bonusCategories.forEach((c, idx) => { c.order = idx + 1; });
    data.teamGroups = data.teamGroups.filter(g => String(g.label || '').trim() !== '');
    delete data.id;
    data.updatedBy = userStore.user?.name || '';
    await setCommissionSettings(props.projectId, data);
    toast.success('請佣獎金設定已儲存');
    emit('saved');
  } catch (e) {
    console.error('[CommissionSettingsTab] 儲存失敗:', e);
    toast.error(`儲存失敗：${e.message}`);
  } finally {
    saving.value = false;
  }
}
</script>

<style scoped>
.table-scroll { overflow-x: auto; }
</style>
