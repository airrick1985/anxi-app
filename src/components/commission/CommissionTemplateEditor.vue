<template>
  <v-dialog :model-value="modelValue" max-width="860" scrollable @update:model-value="v => $emit('update:modelValue', v)">
    <v-card>
      <v-card-title class="bg-primary text-white text-subtitle-1">
        {{ isNew ? '新增' : '編輯' }}{{ docType === 'claim' ? '請佣總表' : '獎金表' }}版型
      </v-card-title>
      <v-card-text class="pt-4">
        <v-row dense class="mb-2">
          <v-col cols="8">
            <v-text-field v-model="local.name" label="版型名稱 *" variant="outlined" density="compact"
              :rules="[v => !!v || '必填']"></v-text-field>
          </v-col>
          <v-col cols="4" class="d-flex align-center">
            <v-switch v-model="local.isDefault" label="設為此建案預設" color="primary" density="compact" hide-details></v-switch>
          </v-col>
        </v-row>

        <v-expansion-panels multiple variant="accordion" :model-value="[0]">
          <!-- 欄位（僅請佣總表） -->
          <v-expansion-panel v-if="docType === 'claim'">
            <v-expansion-panel-title>欄位顯示 / 順序 / 名稱 / 寬度</v-expansion-panel-title>
            <v-expansion-panel-text>
              <v-table density="compact">
                <thead>
                  <tr><th style="width:80px">順序</th><th style="width:70px">顯示</th><th>欄位</th><th>顯示名稱</th><th style="width:110px">寬度(px)</th></tr>
                </thead>
                <tbody>
                  <tr v-for="(col, i) in local.config.columns" :key="col.key">
                    <td>
                      <v-btn icon="mdi-arrow-up" size="x-small" variant="text" :disabled="i === 0" @click="moveCol(i, -1)"></v-btn>
                      <v-btn icon="mdi-arrow-down" size="x-small" variant="text" :disabled="i === local.config.columns.length - 1" @click="moveCol(i, 1)"></v-btn>
                    </td>
                    <td><v-checkbox-btn v-model="col.visible" density="compact"></v-checkbox-btn></td>
                    <td class="text-caption text-medium-emphasis">{{ registryTitle(col.key) }}</td>
                    <td><v-text-field v-model="col.label" variant="outlined" density="compact" hide-details :placeholder="registryTitle(col.key)"></v-text-field></td>
                    <td><v-text-field v-model.number="col.width" type="number" variant="outlined" density="compact" hide-details></v-text-field></td>
                  </tr>
                </tbody>
              </v-table>
            </v-expansion-panel-text>
          </v-expansion-panel>

          <!-- 內容設定 -->
          <v-expansion-panel>
            <v-expansion-panel-title>內容設定</v-expansion-panel-title>
            <v-expansion-panel-text>
              <template v-if="docType === 'claim'">
                <v-text-field v-model="local.config.titlePattern" label="標題（{建案名}{期別}{期別中文}{民國年月}）" variant="outlined" density="compact" class="mb-2"></v-text-field>
                <v-row dense>
                  <v-col cols="4"><v-text-field v-model.number="local.config.keepPct" label="保留款(%)" type="number" variant="outlined" density="compact"></v-text-field></v-col>
                  <v-col cols="4"><v-text-field v-model.number="local.config.cashPct" label="現金比例(%)" type="number" variant="outlined" density="compact"></v-text-field></v-col>
                  <v-col cols="4"><v-text-field v-model="local.config.youfuTag" label="優付標記文字" variant="outlined" density="compact"></v-text-field></v-col>
                </v-row>
                <v-textarea v-model="notesText" label="條文（每行一條）" rows="3" variant="outlined" density="compact" class="mb-2"></v-textarea>
                <v-switch v-model="local.config.showSummaryBlock" label="顯示右側紅字摘要（請款基準/現金/期票）" color="primary" density="compact" hide-details></v-switch>
              </template>
              <template v-else>
                <v-row dense>
                  <v-col cols="4"><v-text-field v-model="local.config.kiloLabel" label="「千4」標籤" variant="outlined" density="compact"></v-text-field></v-col>
                  <v-col cols="8"><v-text-field v-model="local.config.youfuLabelPattern" label="優付列文字（{pct}＝比例）" variant="outlined" density="compact"></v-text-field></v-col>
                </v-row>
                <v-switch v-model="local.config.showSourceProjectTag" label="他案人員名稱附註來源建案" color="primary" density="compact" hide-details></v-switch>
                <v-switch v-model="local.config.includeClaimSheet" label="獎金總表一併包含「請佣總表」分頁" color="primary" density="compact" hide-details></v-switch>
              </template>
              <v-text-field v-model="local.config.fileNamePattern" label="檔名（{簡稱}{期別}{民國年月}）" variant="outlined" density="compact" class="mt-2"></v-text-field>
            </v-expansion-panel-text>
          </v-expansion-panel>

          <!-- 樣式 -->
          <v-expansion-panel>
            <v-expansion-panel-title>樣式</v-expansion-panel-title>
            <v-expansion-panel-text>
              <v-row dense>
                <v-col cols="6" md="3">
                  <v-select v-model="local.config.style.fontFamily" :items="fontOptions" label="字型" variant="outlined" density="compact"></v-select>
                </v-col>
                <v-col cols="6" md="3">
                  <v-text-field v-model.number="local.config.style.titleFontSize" label="標題字級" type="number" variant="outlined" density="compact"></v-text-field>
                </v-col>
                <v-col cols="6" md="3">
                  <v-text-field v-model.number="local.config.style.headerFontSize" label="表頭字級" type="number" variant="outlined" density="compact"></v-text-field>
                </v-col>
                <v-col cols="6" md="3">
                  <v-text-field v-model.number="local.config.style.dataFontSize" label="內文字級" type="number" variant="outlined" density="compact"></v-text-field>
                </v-col>
                <v-col cols="6" md="4">
                  <v-text-field v-model="local.config.style.headerBg" label="表頭底色 (Hex)" variant="outlined" density="compact">
                    <template #prepend-inner><div class="color-chip" :style="{ background: local.config.style.headerBg }"></div></template>
                  </v-text-field>
                </v-col>
                <v-col cols="6" md="4">
                  <v-text-field v-model="local.config.style.totalRowBg" label="合計列底色 (Hex)" variant="outlined" density="compact">
                    <template #prepend-inner><div class="color-chip" :style="{ background: local.config.style.totalRowBg }"></div></template>
                  </v-text-field>
                </v-col>
                <v-col cols="6" md="4">
                  <v-text-field v-model="local.config.style.summaryColor" label="摘要文字色 (Hex)" variant="outlined" density="compact">
                    <template #prepend-inner><div class="color-chip" :style="{ background: local.config.style.summaryColor }"></div></template>
                  </v-text-field>
                </v-col>
                <v-col cols="6" md="4">
                  <v-select v-model="local.config.paper" :items="['A4', 'A3']" label="PDF 紙張" variant="outlined" density="compact"></v-select>
                </v-col>
                <v-col cols="6" md="4">
                  <v-select v-model="local.config.orientation" :items="[{ title: '橫式', value: 'landscape' }, { title: '直式', value: 'portrait' }]" label="PDF 方向" variant="outlined" density="compact"></v-select>
                </v-col>
              </v-row>
            </v-expansion-panel-text>
          </v-expansion-panel>
        </v-expansion-panels>
      </v-card-text>
      <v-divider></v-divider>
      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn variant="text" @click="$emit('update:modelValue', false)">取消</v-btn>
        <v-btn color="primary" variant="flat" :disabled="!local.name" @click="save">儲存版型</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import { CLAIM_COLUMNS, defaultClaimConfig, defaultBonusConfig } from '@/utils/commissionExportModel';

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  docType: { type: String, default: 'claim' },
  // { id, name, isDefault, config }；null = 新增
  editing: { type: Object, default: null },
  settings: { type: Object, default: () => ({}) },
});
const emit = defineEmits(['update:modelValue', 'save']);

const isNew = computed(() => !props.editing?.id);

function buildLocal() {
  const base = props.docType === 'claim' ? defaultClaimConfig(props.settings) : defaultBonusConfig(props.settings);
  const cfg = props.editing?.config ? JSON.parse(JSON.stringify({ ...base, ...props.editing.config })) : JSON.parse(JSON.stringify(base));
  if (props.docType === 'claim' && (!cfg.columns || !cfg.columns.length)) cfg.columns = base.columns;
  cfg.style = { ...base.style, ...(cfg.style || {}) };
  return {
    id: props.editing?.id || null,
    name: props.editing?.name || '',
    isDefault: !!props.editing?.isDefault,
    config: cfg,
  };
}

const local = ref(buildLocal());
watch(() => [props.modelValue, props.editing], () => { if (props.modelValue) local.value = buildLocal(); });

const fontOptions = ['DFKai-SB', 'Noto Serif TC', 'Noto Sans TC', 'Microsoft JhengHei'];

const notesText = computed({
  get: () => (local.value.config.notes || []).join('\n'),
  set: v => { local.value.config.notes = String(v || '').split('\n').filter(s => s.trim() !== ''); },
});

function registryTitle(key) {
  const reg = CLAIM_COLUMNS.find(c => c.key === key);
  if (!reg) return key;
  const groupPart = reg.group ? `${reg.group}－` : '';
  return `${groupPart}${reg.title || key}`;
}

function moveCol(i, dir) {
  const arr = local.value.config.columns;
  const j = i + dir;
  if (j < 0 || j >= arr.length) return;
  [arr[i], arr[j]] = [arr[j], arr[i]];
}

function save() {
  emit('save', JSON.parse(JSON.stringify(local.value)));
  emit('update:modelValue', false);
}
</script>

<style scoped>
.color-chip { width: 20px; height: 20px; border-radius: 4px; border: 1px solid #ccc; }
</style>
