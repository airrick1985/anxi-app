<template>
  <v-dialog :model-value="modelValue" max-width="560" scrollable content-class="mac-dialog-fit" @update:model-value="close">
    <v-card class="mac-sheet hbs">
      <div class="mac-sheet-head">
        <v-icon size="18">mdi-tune-variant</v-icon>
        <span>交屋控管表設定</span>
        <button type="button" class="mac-sheet-close" title="關閉" @click="close"><v-icon size="18">mdi-close</v-icon></button>
      </div>

      <div class="mac-form hbs-body">
        <div class="mac-form-label">狀態顏色</div>
        <div class="mac-form-group">
          <template v-for="s in statusList" :key="s.key">
            <button type="button" class="mac-form-row hbs-color-row" :class="{ 'is-open': expandedKey === s.key }" @click="expandedKey = expandedKey === s.key ? null : s.key">
              <span class="hbs-swatch" :style="{ background: colorOf(s.key) }"></span>
              <span class="mac-form-row-main hbs-row-title">{{ s.label }}</span>
              <span v-if="statusCounts[s.key] !== undefined" class="hbs-count">{{ statusCounts[s.key] }} 戶</span>
              <v-icon size="16" class="hbs-chevron">{{ expandedKey === s.key ? 'mdi-chevron-up' : 'mdi-chevron-down' }}</v-icon>
            </button>
            <div v-if="expandedKey === s.key" class="mac-form-pad hbs-palette">
              <HandoverColorPalette
                :model-value="colorOf(s.key)"
                :default-color="defaults[s.key]"
                @update:model-value="(hex) => setColor(s.key, hex)"
              />
            </div>
          </template>
        </div>

        <div class="mac-form-label">進度項目</div>
        <div class="mac-form-group">
          <div v-if="stageRows.length === 0" class="mac-form-row mac-form-empty">此建案尚未設定預約項目</div>
          <div v-for="(row, i) in stageRows" :key="row.title" class="mac-form-row">
            <input :id="`hbs-stage-${i}`" v-model="row.on" type="checkbox" class="mac-check" @change="normalizeRows">
            <label :for="`hbs-stage-${i}`" class="mac-form-row-main hbs-row-title">{{ row.title }}</label>
            <template v-if="row.on">
              <button type="button" class="mac-icon-btn" title="上移" :disabled="!canMove(i, -1)" @click="move(i, -1)"><v-icon size="18">mdi-chevron-up</v-icon></button>
              <button type="button" class="mac-icon-btn" title="下移" :disabled="!canMove(i, 1)" @click="move(i, 1)"><v-icon size="18">mdi-chevron-down</v-icon></button>
            </template>
          </div>
          <div v-if="needsVirtualHandover" class="mac-form-row hbs-virtual">
            <input type="checkbox" class="mac-check" checked disabled>
            <span class="mac-form-row-main hbs-row-title">交屋（交屋開關）</span>
          </div>
        </div>

        <div class="mac-form-label">附加統計</div>
        <div class="mac-form-group">
          <div v-for="(opt, i) in extraOptions" :key="opt.key" class="mac-form-row">
            <input :id="`hbs-extra-${i}`" v-model="extraStats" :value="opt.key" type="checkbox" class="mac-check">
            <label :for="`hbs-extra-${i}`" class="mac-form-row-main hbs-row-title">{{ opt.label }}</label>
          </div>
        </div>
      </div>

      <div class="mac-sheet-foot">
        <button type="button" class="mac-btn" @click="resetAll">全部還原預設</button>
        <span class="mac-spacer"></span>
        <button type="button" class="mac-btn" @click="close">取消</button>
        <button type="button" class="mac-btn mac-btn--primary" @click="save">儲存</button>
      </div>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { computed, ref } from 'vue';
import HandoverColorPalette from './HandoverColorPalette.vue';
import {
  bookingMenuTitles, buildStatusList, defaultStageTitles, defaultStatusColors,
  extraStatOptions, normalizeHex, resolveExtraStats, resolveStages,
} from '@/utils/handoverBoard';

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  projectConfig: { type: Object, default: null },
  customFieldDefs: { type: Array, default: () => [] },
  statusCounts: { type: Object, default: () => ({}) },
});
const emit = defineEmits(['update:modelValue', 'save']);

const settings = props.projectConfig?.handoverBoard || {};
const menuTitles = bookingMenuTitles(props.projectConfig);

const initialRows = () => {
  const included = resolveStages(props.projectConfig, settings).filter(s => !s.virtual).map(s => s.key);
  return [
    ...included.map(title => ({ title, on: true })),
    ...menuTitles.filter(t => !included.includes(t)).map(title => ({ title, on: false })),
  ];
};
const defaultRows = () => {
  const included = defaultStageTitles(menuTitles);
  return [
    ...included.map(title => ({ title, on: true })),
    ...menuTitles.filter(t => !included.includes(t)).map(title => ({ title, on: false })),
  ];
};

const stageRows = ref(initialRows());
const colors = ref({ ...(settings.colors || {}) });
const extraStats = ref(resolveExtraStats(settings));
const expandedKey = ref(null);

const includedTitles = computed(() => stageRows.value.filter(r => r.on).map(r => r.title));
const draftStages = computed(() => resolveStages({ bookingMenu: menuTitles.map(title => ({ title })) }, { stages: includedTitles.value }));
const statusList = computed(() => buildStatusList(draftStages.value));
const defaults = computed(() => defaultStatusColors(draftStages.value));
const needsVirtualHandover = computed(() => draftStages.value.some(s => s.virtual));
const extraOptions = computed(() => {
  const opts = extraStatOptions(props.customFieldDefs);
  // 已勾選但欄位已不存在的項目仍列出，方便取消
  for (const key of extraStats.value) {
    if (!opts.some(o => o.key === key)) opts.push({ key, label: key });
  }
  return opts;
});

const colorOf = (key) => normalizeHex(colors.value[key]) || defaults.value[key];
const setColor = (key, hex) => {
  colors.value = { ...colors.value, [key]: hex };
};

// 已勾選的項目排在前面，只能在已勾選範圍內上下移
const canMove = (i, dir) => {
  const j = i + dir;
  return j >= 0 && j < stageRows.value.length && stageRows.value[j].on;
};
const move = (i, dir) => {
  if (!canMove(i, dir)) return;
  const rows = [...stageRows.value];
  [rows[i], rows[i + dir]] = [rows[i + dir], rows[i]];
  stageRows.value = rows;
};

// 勾選變動後重新分區：已勾選在前（維持原順序）、未勾選在後
const normalizeRows = () => {
  stageRows.value = [...stageRows.value.filter(r => r.on), ...stageRows.value.filter(r => !r.on)];
};

const resetAll = () => {
  stageRows.value = defaultRows();
  colors.value = {};
  extraStats.value = ['appropriationDate'];
  expandedKey.value = null;
};

const close = () => emit('update:modelValue', false);

const save = () => {
  const included = includedTitles.value;
  const isDefaultStages = JSON.stringify(included) === JSON.stringify(defaultStageTitles(menuTitles));
  // 只存與預設不同的顏色（停用項目的自訂色保留，重新列入時沿用）
  const nextColors = {};
  for (const [key, value] of Object.entries(colors.value)) {
    const hex = normalizeHex(value);
    if (!hex) continue;
    if (defaults.value[key] && hex === defaults.value[key]) continue;
    nextColors[key] = hex;
  }
  emit('save', {
    stages: isDefaultStages ? null : included,
    colors: nextColors,
    extraStats: [...extraStats.value],
  });
  close();
};
</script>

<style scoped>
.hbs-body {
  max-height: min(68vh, 640px);
  overflow-y: auto;
  padding: 0 16px 16px;
}
.hbs-color-row {
  width: 100%;
  border: 0;
  background: transparent;
  color: inherit;
  font-family: inherit;
  text-align: left;
  cursor: pointer;
}
.hbs-color-row:hover, .hbs-color-row.is-open { background: #f7f7f9; }
.hbs-swatch {
  width: 22px;
  height: 22px;
  flex-shrink: 0;
  border-radius: 6px;
  box-shadow: inset 0 0 0 0.5px rgba(0, 0, 0, 0.18);
}
.hbs-row-title { font-weight: 500; overflow-wrap: anywhere; cursor: pointer; }
.hbs-count { color: #6e6e73; font-size: 12px; white-space: nowrap; }
.hbs-chevron { color: #8e8e93; }
.hbs-palette { background: #fafafc; }
.hbs-virtual { color: #6e6e73; }
.hbs-virtual .hbs-row-title { cursor: default; }
.mac-icon-btn:disabled { opacity: 0.3; cursor: default; background: transparent; }
</style>
