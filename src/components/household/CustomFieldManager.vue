<template>
  <v-dialog
    :model-value="modelValue"
    max-width="940"
    scrollable
    content-class="mac-dialog-fit"
    @update:model-value="v => { if (!v) requestClose(); }"
  >
    <v-card class="mac-sheet cfm">
      <div class="mac-sheet-head">
        <button
          v-if="isNarrow && pane === 'detail'"
          type="button"
          class="mac-icon-btn cfm-back"
          aria-label="返回清單"
          @click="backToList"
        ><v-icon size="22">mdi-chevron-left</v-icon></button>
        <v-icon v-else size="18">mdi-table-cog</v-icon>
        <span class="cfm-head-title">{{ headTitle }}</span>
        <button type="button" class="mac-sheet-close" aria-label="關閉" @click="requestClose">
          <v-icon size="18">mdi-close</v-icon>
        </button>
      </div>

      <div class="cfm-body" :class="{ 'is-narrow': isNarrow, 'show-detail': pane === 'detail' }">
        <!-- 左：欄位清單（拖曳排序，放下即存） -->
        <aside class="cfm-list">
          <div class="cfm-list-actions">
            <button type="button" class="mac-btn mac-btn--sm" :class="{ 'is-active': mode === 'new' }" @click="startNew">
              <v-icon size="15">mdi-plus</v-icon><span>新增欄位</span>
            </button>
            <button type="button" class="mac-btn mac-btn--sm" :class="{ 'is-active': mode === 'import' && !importLockedId }" @click="startImport(null)">
              <v-icon size="15">mdi-tray-arrow-up</v-icon><span>匯入資料</span>
            </button>
          </div>
          <div v-if="orderedDefs.length === 0" class="cfm-list-empty">尚無自訂欄位</div>
          <draggable
            v-else
            v-model="orderedDefs"
            item-key="id"
            handle=".cfm-drag"
            :animation="180"
            :disabled="busy"
            class="cfm-rows"
            @end="onDragEnd"
          >
            <template #item="{ element }">
              <div
                class="cfm-row"
                :class="{ 'is-active': isRowActive(element) }"
                role="button"
                tabindex="0"
                @click="selectDef(element)"
                @keydown.enter="selectDef(element)"
              >
                <span class="cfm-drag" title="拖曳排序" @click.stop><v-icon size="18">mdi-drag-vertical</v-icon></span>
                <span class="cfm-row-main">
                  <span class="cfm-row-name">{{ element.fieldName }}</span>
                  <span class="cfm-row-sub">{{ fieldFormatSummary(element) }} · 已填 {{ filledCounts[element.id] || 0 }} 戶</span>
                </span>
                <v-icon size="16" class="cfm-row-chev">mdi-chevron-right</v-icon>
              </div>
            </template>
          </draggable>
        </aside>

        <!-- 右：編輯／匯入 -->
        <section class="cfm-detail mac-form">
          <div v-if="mode === 'none'" class="cfm-placeholder">
            <v-icon size="40">mdi-table-column-plus-after</v-icon>
            <span>選擇左側欄位編輯，或新增欄位</span>
          </div>

          <!-- 新增／編輯欄位 -->
          <template v-else-if="mode === 'new' || mode === 'edit'">
            <div class="mac-form-label">欄位</div>
            <div class="mac-form-group">
              <label class="mac-form-row">
                <span class="mac-form-row-label">名稱</span>
                <input
                  ref="nameInput"
                  v-model="form.fieldName"
                  class="mac-form-input"
                  maxlength="40"
                  placeholder="例：實登坪數"
                />
              </label>
              <div v-if="nameError" class="cfm-row-error">{{ nameError }}</div>
              <div class="mac-form-row">
                <span class="mac-form-row-label">格式</span>
                <div class="mac-form-seg cfm-type-seg" role="radiogroup" aria-label="欄位格式">
                  <button
                    v-for="t in CUSTOM_FIELD_TYPES"
                    :key="t.value"
                    type="button"
                    role="radio"
                    class="mac-form-seg-btn"
                    :class="{ 'is-active': form.fieldType === t.value }"
                    :aria-checked="form.fieldType === t.value"
                    @click="form.fieldType = t.value"
                  >{{ t.title }}</button>
                </div>
              </div>
              <div v-if="formIsNumeric" class="mac-form-row">
                <span class="mac-form-row-label">小數位數</span>
                <div class="mac-form-seg" role="radiogroup" aria-label="小數位數">
                  <button
                    v-for="d in DECIMAL_CHOICES"
                    :key="d"
                    type="button"
                    role="radio"
                    class="mac-form-seg-btn"
                    :class="{ 'is-active': form.decimals === d }"
                    :aria-checked="form.decimals === d"
                    @click="form.decimals = d"
                  >{{ d }}</button>
                </div>
              </div>
              <label v-if="form.fieldType === 'number'" class="mac-form-row">
                <span class="mac-form-row-label">單位</span>
                <input v-model="form.unit" class="mac-form-input cfm-unit-input" maxlength="10" placeholder="坪、萬、元" />
              </label>
              <div v-if="formIsNumeric" class="mac-form-row">
                <span class="mac-form-row-label">預覽</span>
                <span class="cfm-preview">{{ formPreview }}</span>
              </div>
            </div>

            <template v-if="form.fieldType === 'select'">
              <div class="mac-form-label">選項</div>
              <div class="mac-form-group mac-form-pad">
                <div class="cfm-options">
                  <span v-for="(opt, i) in form.options" :key="opt" class="mac-token">
                    {{ opt }}
                    <button type="button" class="mac-token-x" :aria-label="`移除 ${opt}`" @click="form.options.splice(i, 1)">
                      <v-icon size="13">mdi-close</v-icon>
                    </button>
                  </span>
                  <input
                    v-model="optionDraft"
                    class="cfm-option-input"
                    placeholder="輸入後按 Enter"
                    @keydown.enter.prevent="addOptionDraft"
                    @keydown.backspace="onOptionBackspace"
                    @blur="addOptionDraft"
                  />
                </div>
              </div>
              <div v-if="optionsError" class="cfm-form-error">{{ optionsError }}</div>
            </template>

            <template v-if="mode === 'edit' && selectedDef">
              <div class="mac-form-label">資料</div>
              <div class="mac-form-group">
                <div class="mac-form-row">
                  <span class="mac-form-row-main">已填 {{ filledCounts[selectedDef.id] || 0 }} 戶</span>
                  <button type="button" class="mac-btn mac-btn--sm" :disabled="busy" @click="startImport(selectedDef)">
                    <v-icon size="15">mdi-tray-arrow-up</v-icon><span>匯入資料</span>
                  </button>
                </div>
              </div>
            </template>
          </template>

          <!-- 匯入資料 -->
          <template v-else-if="mode === 'import'">
            <div class="mac-form-label">資料來源</div>
            <div class="mac-form-group">
              <div class="mac-form-row">
                <div class="mac-form-seg mac-form-seg--block" role="tablist">
                  <button type="button" role="tab" class="mac-form-seg-btn" :class="{ 'is-active': importSource === 'paste' }" @click="setImportSource('paste')">
                    <v-icon size="15">mdi-content-paste</v-icon>貼上
                  </button>
                  <button type="button" role="tab" class="mac-form-seg-btn" :class="{ 'is-active': importSource === 'file' }" @click="setImportSource('file')">
                    <v-icon size="15">mdi-file-excel-outline</v-icon>檔案
                  </button>
                </div>
              </div>
              <div v-if="importSource === 'paste'" class="mac-form-pad">
                <textarea
                  v-model="pasteText"
                  class="mac-form-textarea cfm-paste"
                  rows="6"
                  placeholder="從 Excel 複製（含標題列）貼上"
                  @input="onPasteInput"
                ></textarea>
              </div>
              <div v-else class="mac-form-row">
                <button type="button" class="mac-btn" @click="fileInput?.click()">
                  <v-icon size="16">mdi-folder-open-outline</v-icon><span>選擇檔案</span>
                </button>
                <span class="cfm-file-name">{{ importFileName || 'xlsx、csv' }}</span>
                <input ref="fileInput" type="file" accept=".xlsx,.xls,.csv" hidden @change="onImportFile" />
              </div>
            </div>

            <div v-if="importError" class="mac-callout mac-callout--error cfm-callout">
              <v-icon size="18">mdi-alert-circle-outline</v-icon><span>{{ importError }}</span>
            </div>

            <template v-if="importTable">
              <div class="mac-form-label">戶號欄</div>
              <div class="mac-form-group">
                <div class="mac-form-row">
                  <select v-model.number="unitCol" class="mac-form-input mac-form-select cfm-full">
                    <option v-for="h in importHeaders" :key="h.index" :value="h.index">{{ h.label }}</option>
                  </select>
                </div>
              </div>

              <!-- 匯入到既有欄位：只選一欄 -->
              <template v-if="importLockedDef">
                <div class="mac-form-label">匯入到「{{ importLockedDef.fieldName }}」的資料欄</div>
                <div class="mac-form-group">
                  <div class="mac-form-row">
                    <select v-model.number="lockedCol" class="mac-form-input mac-form-select cfm-full">
                      <option v-for="h in valueHeaders" :key="h.index" :value="h.index">{{ h.label }}</option>
                    </select>
                  </div>
                </div>
              </template>

              <!-- 一般匯入：勾選多欄，一欄一個欄位 -->
              <template v-else>
                <div class="mac-form-label">
                  要匯入的欄
                  <span class="mac-spacer"></span>
                  <span>已選 {{ importPlan.columns.length }} 欄</span>
                </div>
                <div class="mac-form-group">
                  <div v-if="valueHeaders.length === 0" class="mac-form-row mac-form-empty">沒有其他欄</div>
                  <div
                    v-for="c in columnRows"
                    :key="c.index"
                    class="mac-form-row cfm-col-row"
                    :class="{ 'is-off': !c.state.checked }"
                  >
                    <input
                      v-model="c.state.checked"
                      type="checkbox"
                      class="mac-check"
                      :aria-label="`匯入 ${c.label}`"
                    />
                    <div class="cfm-col-main">
                      <div class="cfm-col-line">
                        <input
                          v-model="c.state.name"
                          class="mac-form-input cfm-col-name"
                          maxlength="40"
                          :disabled="!c.state.checked"
                        />
                        <select
                          v-if="c.target.kind !== 'existing'"
                          v-model="c.state.fieldType"
                          class="mac-form-input mac-form-select cfm-col-type"
                          :disabled="!c.state.checked"
                        >
                          <option v-for="t in CUSTOM_FIELD_TYPES" :key="t.value" :value="t.value">{{ t.title }}</option>
                        </select>
                        <span v-else class="cfm-col-type cfm-col-type--fixed">{{ fieldTypeTitle(c.target.def.fieldType) }}</span>
                      </div>
                      <div class="cfm-col-sub">
                        <span class="mac-tag" :class="c.target.tagClass">{{ c.target.label }}</span>
                        <span v-if="c.stats.invalid > 0" class="cfm-col-warn">{{ c.stats.invalid }} 筆格式不符</span>
                        <span class="cfm-col-sample">{{ c.sample }}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </template>

              <div class="mac-form-label">預覽</div>
              <div class="mac-form-group">
                <div class="mac-form-row">
                  <span class="mac-form-row-main">對到戶別</span>
                  <span class="cfm-stat">{{ importPlan.matchedCount }} / {{ importPlan.rowCount }} 列</span>
                </div>
                <div v-if="importPlan.unmatched.length" class="mac-form-row cfm-stat-row">
                  <span class="mac-form-row-main">
                    <span class="cfm-stat-warn">對不到 {{ importPlan.unmatched.length }} 個戶號</span>
                    <span class="cfm-stat-list">{{ listPreview(importPlan.unmatched) }}</span>
                  </span>
                </div>
                <div v-if="importPlan.duplicates.length" class="mac-form-row cfm-stat-row">
                  <span class="mac-form-row-main">
                    <span class="cfm-stat-warn">重複戶號 {{ importPlan.duplicates.length }} 個（取最後一筆）</span>
                    <span class="cfm-stat-list">{{ listPreview(importPlan.duplicates) }}</span>
                  </span>
                </div>
                <div v-if="importPlan.invalidTotal" class="mac-form-row">
                  <span class="mac-form-row-main cfm-stat-warn">{{ importPlan.invalidTotal }} 格格式不符，略過</span>
                </div>
                <div v-if="importPlan.overwriteCount" class="mac-form-row">
                  <span class="mac-form-row-main">覆蓋既有資料</span>
                  <span class="cfm-stat">{{ importPlan.overwriteCount }} 戶</span>
                </div>
                <div class="mac-form-row">
                  <span class="mac-form-row-main">將寫入</span>
                  <span class="cfm-stat cfm-stat--strong">{{ importPlan.updates.length }} 戶</span>
                </div>
              </div>
              <div v-if="importPlan.blockReason" class="cfm-form-error">{{ importPlan.blockReason }}</div>
            </template>
          </template>
        </section>
      </div>

      <div v-if="showFoot" class="mac-sheet-foot">
        <template v-if="mode === 'new' || mode === 'edit'">
          <button v-if="mode === 'edit'" type="button" class="mac-btn mac-btn--danger" :disabled="busy" @click="deleteSelected">
            <v-icon size="15">mdi-trash-can-outline</v-icon><span>刪除</span>
          </button>
          <span class="mac-spacer"></span>
          <button type="button" class="mac-btn" :disabled="busy" @click="cancelForm">取消</button>
          <button type="button" class="mac-btn mac-btn--primary" :disabled="busy || !canSaveForm" @click="saveForm">
            {{ busy ? '儲存中…' : (mode === 'new' ? '新增' : '儲存') }}
          </button>
        </template>
        <template v-else-if="mode === 'import'">
          <span class="mac-spacer"></span>
          <button type="button" class="mac-btn" :disabled="busy" @click="cancelImport">取消</button>
          <button type="button" class="mac-btn mac-btn--primary" :disabled="busy || !canImport" @click="runImport">
            {{ busy ? '匯入中…' : `匯入 ${importPlan.updates.length} 戶` }}
          </button>
        </template>
      </div>
    </v-card>
  </v-dialog>

  <!-- 確認視窗 -->
  <v-dialog v-model="confirmState.show" max-width="380" persistent content-class="mac-dialog-fit">
    <v-card class="mac-sheet cfm-confirm-card">
      <div class="mac-sheet-section cfm-confirm">
        <div class="cfm-confirm-title">{{ confirmState.title }}</div>
        <div v-if="confirmState.text" class="mac-sheet-note">{{ confirmState.text }}</div>
      </div>
      <div class="mac-sheet-foot">
        <span class="mac-spacer"></span>
        <button type="button" class="mac-btn" @click="resolveConfirm(false)">取消</button>
        <button
          type="button"
          class="mac-btn"
          :class="confirmState.danger ? 'mac-btn--danger-fill' : 'mac-btn--primary'"
          @click="resolveConfirm(true)"
        >{{ confirmState.okText }}</button>
      </div>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { ref, reactive, computed, watch, nextTick } from 'vue';
import { useDisplay } from 'vuetify';
import draggable from 'vuedraggable';
import * as XLSX from 'xlsx-js-style';
import { manageFieldDefinition, batchUpdateHouseholds } from '@/api';
import {
  CUSTOM_FIELD_TYPES,
  customFieldKey,
  isNumericFieldType,
  normalizeFieldType,
  fieldTypeTitle,
  fieldFormatSummary,
  clampDecimals,
  formatPreviewSample,
  makeFieldKey,
  guessFieldFormat,
  coerceCellForField,
  parsePastedTable,
  readSheetTable,
  cellText,
  hasFieldValue,
} from '@/utils/customFields';

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  projectId: { type: String, default: '' },
  defs: { type: Array, default: () => [] },
  households: { type: Array, default: () => [] },
  /** 系統欄位的顯示名稱（不可與自訂欄位同名） */
  reservedNames: { type: Array, default: () => [] },
  /** 系統欄位的資料 key（新欄位的 key 會避開） */
  reservedKeys: { type: Array, default: () => [] },
});
const emit = defineEmits(['update:modelValue', 'notify']);

const DECIMAL_CHOICES = [0, 1, 2, 3, 4];
const COLLECTION = 'households';
const WRITE_CHUNK = 400;

const { width } = useDisplay();
const isNarrow = computed(() => width.value < 720);

// ───────────── 狀態 ─────────────
const mode = ref('none'); // none | new | edit | import
const pane = ref('list'); // 窄螢幕：list | detail
const selectedId = ref(null);
const busy = ref(false);
const pendingSelectId = ref(null);

const orderedDefs = ref([]);
let dragging = false;
watch(() => props.defs, (defs) => {
  if (!dragging) orderedDefs.value = [...defs];
  if (pendingSelectId.value) {
    const def = defs.find(d => d.id === pendingSelectId.value);
    if (def) {
      pendingSelectId.value = null;
      openEdit(def);
    }
  }
  // 編輯中的欄位被別人刪除（剛新增、還沒同步回來的不算）
  if (mode.value === 'edit' && selectedId.value && selectedId.value !== pendingSelectId.value
    && !defs.some(d => d.id === selectedId.value)) {
    resetToNone();
  }
}, { immediate: true });

const selectedDef = computed(() => props.defs.find(d => d.id === selectedId.value) || null);

const filledCounts = computed(() => {
  const out = {};
  for (const def of props.defs) {
    const key = customFieldKey(def);
    let n = 0;
    for (const h of props.households) if (hasFieldValue(h?.[key])) n++;
    out[def.id] = n;
  }
  return out;
});

const reservedNameSet = computed(() => new Set(props.reservedNames.map(n => String(n || '').trim()).filter(Boolean)));
const takenKeys = () => new Set([...props.reservedKeys, ...props.defs.map(customFieldKey)]);

const headTitle = computed(() => {
  if (!isNarrow.value || pane.value === 'list') return '自訂欄位';
  if (mode.value === 'new') return '新增欄位';
  if (mode.value === 'edit') return selectedDef.value?.fieldName || '編輯欄位';
  if (mode.value === 'import') return importLockedDef.value ? `匯入「${importLockedDef.value.fieldName}」` : '匯入資料';
  return '自訂欄位';
});

const showFoot = computed(() => mode.value !== 'none' && (!isNarrow.value || pane.value === 'detail'));
const isRowActive = (def) => (mode.value === 'edit' && selectedId.value === def.id) || (mode.value === 'import' && importLockedId.value === def.id);

// ───────────── 確認視窗 ─────────────
const confirmState = reactive({ show: false, title: '', text: '', okText: '確定', danger: false, resolve: null });
const askConfirm = ({ title, text = '', okText = '確定', danger = false }) => new Promise((resolve) => {
  Object.assign(confirmState, { show: true, title, text, okText, danger, resolve });
});
const resolveConfirm = (ok) => {
  confirmState.show = false;
  const r = confirmState.resolve;
  confirmState.resolve = null;
  r?.(ok);
};

// ───────────── 欄位表單 ─────────────
const emptyForm = () => ({ fieldName: '', fieldType: 'text', options: [], decimals: 0, unit: '' });
const form = reactive(emptyForm());
const formSnapshot = ref('');
const optionDraft = ref('');
const nameInput = ref(null);
const triedSave = ref(false);

const formFromDef = (def) => ({
  fieldName: def.fieldName || '',
  fieldType: normalizeFieldType(def.fieldType),
  options: [...(def.options || [])],
  decimals: clampDecimals(def.decimals),
  unit: def.unit || '',
});
const normalizedForm = () => {
  const type = form.fieldType;
  return {
    fieldName: form.fieldName.trim(),
    fieldType: type,
    options: type === 'select' ? form.options.map(o => o.trim()).filter(Boolean) : [],
    decimals: isNumericFieldType(type) ? clampDecimals(form.decimals) : 0,
    unit: type === 'number' ? form.unit.trim() : '',
  };
};
const setForm = (data) => {
  Object.assign(form, data);
  optionDraft.value = '';
  triedSave.value = false;
  formSnapshot.value = JSON.stringify(normalizedForm());
};
const isFormDirty = () => (mode.value === 'new' || mode.value === 'edit')
  && (JSON.stringify(normalizedForm()) !== formSnapshot.value || optionDraft.value.trim() !== '');

const formIsNumeric = computed(() => isNumericFieldType(form.fieldType));
const formPreview = computed(() => formatPreviewSample(normalizedForm()));

const nameError = computed(() => {
  const name = form.fieldName.trim();
  if (!name) return triedSave.value ? '請輸入名稱' : '';
  if (reservedNameSet.value.has(name)) return '與系統欄位同名';
  if (props.defs.some(d => d.fieldName === name && d.id !== (mode.value === 'edit' ? selectedId.value : null))) return '名稱已存在';
  return '';
});
const optionsError = computed(() => (
  triedSave.value && form.fieldType === 'select' && normalizedForm().options.length === 0 && !optionDraft.value.trim()
    ? '至少要有一個選項' : ''
));
const canSaveForm = computed(() => {
  const f = normalizedForm();
  if (!f.fieldName || nameError.value) return false;
  if (mode.value === 'edit') return isFormDirty();
  return true;
});

const addOptionDraft = () => {
  const parts = optionDraft.value.split(/[,，、\n]/).map(s => s.trim()).filter(Boolean);
  for (const p of parts) if (!form.options.includes(p)) form.options.push(p);
  optionDraft.value = '';
};
const onOptionBackspace = () => {
  if (optionDraft.value === '' && form.options.length) form.options.pop();
};

const confirmDiscard = async () => {
  if (!isFormDirty() && !isImportDirty()) return true;
  return askConfirm({ title: '放棄未儲存的變更？', okText: '放棄', danger: true });
};

const resetToNone = () => {
  mode.value = 'none';
  selectedId.value = null;
  importLockedId.value = null;
  pane.value = 'list';
};

const openEdit = (def) => {
  mode.value = 'edit';
  selectedId.value = def.id;
  importLockedId.value = null;
  setForm(formFromDef(def));
  pane.value = 'detail';
};

const selectDef = async (def) => {
  if (busy.value) return;
  if (mode.value === 'edit' && selectedId.value === def.id) { pane.value = 'detail'; return; }
  if (!(await confirmDiscard())) return;
  openEdit(def);
};

const startNew = async () => {
  if (busy.value || !(await confirmDiscard())) return;
  mode.value = 'new';
  selectedId.value = null;
  importLockedId.value = null;
  setForm(emptyForm());
  pane.value = 'detail';
  await nextTick();
  if (!isNarrow.value) nameInput.value?.focus();
};

const cancelForm = () => {
  if (mode.value === 'edit' && selectedDef.value) {
    setForm(formFromDef(selectedDef.value));
    if (isNarrow.value) pane.value = 'list';
  } else {
    resetToNone();
  }
};

const backToList = async () => {
  if (!(await confirmDiscard())) return;
  resetToNone();
};

const requestClose = async () => {
  if (busy.value) return;
  if (!(await confirmDiscard())) return;
  resetToNone();
  clearImport();
  emit('update:modelValue', false);
};

const notify = (text, color = 'success') => emit('notify', text, color);

const saveForm = async () => {
  triedSave.value = true;
  addOptionDraft();
  const field = normalizedForm();
  if (!field.fieldName || nameError.value) return;
  if (field.fieldType === 'select' && field.options.length === 0) return;
  busy.value = true;
  try {
    if (mode.value === 'new') {
      const fieldKey = makeFieldKey(field.fieldName, takenKeys());
      const res = await manageFieldDefinition({
        action: 'create', projectId: props.projectId, collectionName: COLLECTION,
        fields: [{ ...field, fieldKey }],
      });
      const created = res?.created?.[0];
      notify(`已新增欄位「${field.fieldName}」`);
      if (created?.id) {
        pendingSelectId.value = created.id;
        const existing = props.defs.find(d => d.id === created.id);
        if (existing) { pendingSelectId.value = null; openEdit(existing); }
        else { mode.value = 'edit'; selectedId.value = created.id; setForm(field); }
      } else {
        resetToNone();
      }
    } else if (mode.value === 'edit' && selectedDef.value) {
      await manageFieldDefinition({
        action: 'update', projectId: props.projectId, collectionName: COLLECTION,
        id: selectedDef.value.id, field,
      });
      setForm(field);
      notify(`已儲存「${field.fieldName}」`);
    }
  } catch (err) {
    notify(err.message || '儲存失敗', 'error');
  } finally {
    busy.value = false;
  }
};

const deleteSelected = async () => {
  const def = selectedDef.value;
  if (!def) return;
  const ok = await askConfirm({
    title: `刪除欄位「${def.fieldName}」？`,
    text: '各戶資料會保留，重建同名欄位可找回。',
    okText: '刪除',
    danger: true,
  });
  if (!ok) return;
  busy.value = true;
  try {
    await manageFieldDefinition({ action: 'delete', projectId: props.projectId, collectionName: COLLECTION, id: def.id });
    notify(`已刪除欄位「${def.fieldName}」`);
    resetToNone();
  } catch (err) {
    notify(err.message || '刪除失敗', 'error');
  } finally {
    busy.value = false;
  }
};

// ───────────── 排序（放下即存） ─────────────
const onDragEnd = async () => {
  const ids = orderedDefs.value.map(d => d.id);
  if (ids.join('\n') === props.defs.map(d => d.id).join('\n')) return;
  dragging = true;
  try {
    await manageFieldDefinition({ action: 'reorder', projectId: props.projectId, collectionName: COLLECTION, ids });
  } catch (err) {
    notify(err.message || '排序儲存失敗', 'error');
    orderedDefs.value = [...props.defs];
  } finally {
    dragging = false;
  }
};

// ───────────── 匯入資料 ─────────────
const importLockedId = ref(null);
const importLockedDef = computed(() => props.defs.find(d => d.id === importLockedId.value) || null);
const importSource = ref('paste');
const pasteText = ref('');
const importFileName = ref('');
const importTable = ref(null); // [[{ v, w }]]，第一列為標題
const importError = ref('');
const unitCol = ref(0);
const lockedCol = ref(1);
const colStates = ref({}); // index → { checked, name, fieldType, decimals, unit }
const fileInput = ref(null);

const isImportDirty = () => mode.value === 'import' && (pasteText.value.trim() !== '' || !!importTable.value);

const clearImport = () => {
  pasteText.value = '';
  importFileName.value = '';
  importTable.value = null;
  importError.value = '';
  colStates.value = {};
  if (fileInput.value) fileInput.value.value = '';
};

const startImport = async (def) => {
  if (busy.value) return;
  if (mode.value !== 'import' && !(await confirmDiscard())) return;
  if (mode.value === 'import' && (importLockedId.value || null) === (def?.id || null)) { pane.value = 'detail'; return; }
  const keepTable = mode.value === 'import' ? importTable.value : null;
  mode.value = 'import';
  importLockedId.value = def?.id || null;
  if (!def) selectedId.value = null;
  pane.value = 'detail';
  if (keepTable) applyTable(keepTable); else clearImport();
};

const cancelImport = () => {
  const lockedDef = importLockedDef.value;
  clearImport();
  if (lockedDef) openEdit(lockedDef);
  else resetToNone();
};

const setImportSource = (src) => {
  if (importSource.value === src) return;
  importSource.value = src;
  importError.value = '';
};

let pasteTimer = null;
const onPasteInput = () => {
  clearTimeout(pasteTimer);
  pasteTimer = setTimeout(() => {
    importError.value = '';
    if (!pasteText.value.trim()) { importTable.value = null; return; }
    const rows = parsePastedTable(pasteText.value);
    if (rows.length < 2 || rows[0].length < 2) {
      importTable.value = null;
      importError.value = '至少要有標題列、一列資料，以及戶號與資料兩欄';
      return;
    }
    applyTable(rows);
  }, 250);
};

const onImportFile = async (e) => {
  const file = e.target.files?.[0];
  if (!file) return;
  importFileName.value = file.name;
  importError.value = '';
  try {
    const buf = await file.arrayBuffer();
    const rows = readSheetTable(XLSX, buf);
    if (rows.length < 2 || rows[0].length < 2) throw new Error('至少要有標題列、一列資料，以及戶號與資料兩欄');
    applyTable(rows);
  } catch (err) {
    importTable.value = null;
    importError.value = err.message || '讀取檔案失敗';
  }
};

const unitIndex = computed(() => {
  const map = new Map();
  for (const h of props.households) {
    const u = String(h?.unitId ?? '').trim();
    if (u && h._docId) map.set(u, h);
  }
  return map;
});

const importHeaders = computed(() => {
  const head = importTable.value?.[0] || [];
  const width = Math.max(0, ...(importTable.value || []).map(r => r.length));
  return Array.from({ length: width }, (_, index) => {
    const label = cellText(head[index]);
    return { index, label: label || `第 ${index + 1} 欄` };
  });
});
const valueHeaders = computed(() => importHeaders.value.filter(h => h.index !== unitCol.value));
const dataRows = computed(() => (importTable.value || []).slice(1));
const columnCells = (index) => dataRows.value.map(r => r[index] || { v: '', w: '' });

const applyTable = (rows) => {
  importTable.value = rows;
  // 戶號欄：標題含「戶號／戶別」優先，其次是對到最多戶的欄
  const headers = importHeaders.value;
  let guess = headers.find(h => /戶號/.test(h.label)) || headers.find(h => /戶別/.test(h.label)) || headers.find(h => h.label === '戶');
  if (!guess) {
    let best = -1;
    for (const h of headers) {
      const n = rows.slice(1).filter(r => unitIndex.value.has(cellText(r[h.index]))).length;
      if (n > best) { best = n; guess = h; }
    }
  }
  unitCol.value = guess?.index ?? 0;

  const states = {};
  for (const h of headers) {
    const prev = colStates.value[h.index];
    const cells = rows.slice(1).map(r => r[h.index] || { v: '', w: '' });
    const hasData = cells.some(c => cellText(c) !== '');
    const g = guessFieldFormat(cells);
    const name = h.label.slice(0, 40);
    const conflict = reservedNameSet.value.has(name);
    states[h.index] = prev && prev.name === name ? prev : {
      checked: hasData && !conflict,
      name,
      fieldType: g.fieldType,
      decimals: g.decimals,
      unit: g.unit,
    };
  }
  colStates.value = states;

  if (importLockedDef.value) {
    const same = headers.find(h => h.index !== unitCol.value && h.label === importLockedDef.value.fieldName);
    lockedCol.value = (same || headers.find(h => h.index !== unitCol.value))?.index ?? 1;
  }
};

watch(unitCol, (v) => {
  if (importLockedDef.value && lockedCol.value === v) {
    lockedCol.value = valueHeaders.value[0]?.index ?? -1;
  }
});

const defByName = computed(() => new Map(props.defs.map(d => [d.fieldName, d])));

// 每欄要寫入的目標：既有欄位／新欄位／不可匯入
const resolveTarget = (state, index, checkedNames) => {
  const name = state.name.trim();
  if (!name) return { kind: 'invalid', label: '缺少名稱', tagClass: 'mac-tag--red' };
  if (reservedNameSet.value.has(name)) return { kind: 'invalid', label: '與系統欄位同名', tagClass: 'mac-tag--red' };
  if ((checkedNames.get(name) || 0) > 1 && state.checked) return { kind: 'invalid', label: '名稱重複', tagClass: 'mac-tag--red' };
  const def = defByName.value.get(name);
  if (def) return { kind: 'existing', def, label: '覆蓋既有欄位', tagClass: 'mac-tag--orange' };
  return { kind: 'new', label: '新欄位', tagClass: 'mac-tag--blue', index };
};

const describeColumn = (index, fieldLike) => {
  let invalid = 0;
  for (const cell of columnCells(index)) {
    const r = coerceCellForField(fieldLike, cell);
    if (!r.empty && !r.ok) invalid++;
  }
  return { invalid };
};

const columnRows = computed(() => {
  const checkedNames = new Map();
  for (const h of valueHeaders.value) {
    const s = colStates.value[h.index];
    if (s?.checked) checkedNames.set(s.name.trim(), (checkedNames.get(s.name.trim()) || 0) + 1);
  }
  return valueHeaders.value.filter(h => colStates.value[h.index]).map(h => {
    const state = colStates.value[h.index];
    const target = resolveTarget(state, h.index, checkedNames);
    const fieldLike = target.kind === 'existing' ? target.def : state;
    const samples = columnCells(h.index).map(cellText).filter(Boolean).slice(0, 3);
    return {
      index: h.index,
      label: h.label,
      state,
      target,
      stats: describeColumn(h.index, fieldLike),
      sample: samples.length ? `例：${samples.join('、')}` : '沒有資料',
    };
  });
});

// 匯入計畫：要建立的欄位、要寫入各戶的資料
const importPlan = computed(() => {
  const empty = { columns: [], updates: [], matchedCount: 0, rowCount: 0, unmatched: [], duplicates: [], invalidTotal: 0, overwriteCount: 0, blockReason: '' };
  if (!importTable.value) return empty;

  // 要匯入的欄
  let columns = [];
  if (importLockedDef.value) {
    if (lockedCol.value >= 0 && lockedCol.value !== unitCol.value) {
      columns = [{ index: lockedCol.value, kind: 'existing', def: importLockedDef.value }];
    }
  } else {
    columns = columnRows.value
      .filter(c => c.state.checked)
      .map(c => ({ index: c.index, kind: c.target.kind, def: c.target.def, state: c.state }));
  }

  // 戶號比對（完全一致，只去頭尾空白；重複取最後一筆）
  const rowByUnit = new Map();
  const unmatched = new Set();
  const duplicates = new Set();
  let rowCount = 0;
  for (const row of dataRows.value) {
    const unit = cellText(row[unitCol.value]);
    if (!unit) continue;
    rowCount++;
    if (!unitIndex.value.has(unit)) { unmatched.add(unit); continue; }
    if (rowByUnit.has(unit)) duplicates.add(unit);
    rowByUnit.set(unit, row);
  }

  let blockReason = '';
  if (columns.some(c => c.kind === 'invalid')) blockReason = '有欄位名稱需要修正';

  const plannedKeys = takenKeys();
  const planCols = columns.filter(c => c.kind !== 'invalid').map(c => {
    if (c.kind === 'existing') return { ...c, key: customFieldKey(c.def), fieldLike: c.def };
    const fieldLike = {
      fieldName: c.state.name.trim(),
      fieldType: c.state.fieldType,
      decimals: clampDecimals(c.state.decimals),
      unit: c.state.fieldType === 'number' ? (c.state.unit || '') : '',
    };
    const key = makeFieldKey(fieldLike.fieldName, plannedKeys);
    plannedKeys.add(key);
    return { ...c, key, fieldLike };
  });

  const updates = [];
  let invalidTotal = 0;
  let overwriteCount = 0;
  const newOptions = new Map(); // col index → Set（下拉選項）
  for (const [unit, row] of rowByUnit) {
    const h = unitIndex.value.get(unit);
    const data = {};
    let overwrites = false;
    for (const c of planCols) {
      const r = coerceCellForField(c.fieldLike, row[c.index] || { v: '', w: '' });
      if (r.empty) continue;
      if (!r.ok) { invalidTotal++; continue; }
      data[c.key] = r.value;
      if (normalizeFieldType(c.fieldLike.fieldType) === 'select') {
        if (!newOptions.has(c.index)) newOptions.set(c.index, new Set());
        newOptions.get(c.index).add(r.value);
      }
      if (c.kind === 'existing' && hasFieldValue(h[c.key]) && h[c.key] !== r.value) overwrites = true;
    }
    if (Object.keys(data).length) {
      updates.push({ docId: h._docId, data });
      if (overwrites) overwriteCount++;
    }
  }

  for (const c of planCols) {
    if (c.kind === 'new' && normalizeFieldType(c.fieldLike.fieldType) === 'select' && !newOptions.get(c.index)?.size) {
      blockReason = blockReason || `「${c.fieldLike.fieldName}」沒有可當選項的資料`;
    }
  }
  if (!blockReason && columns.length === 0) blockReason = importLockedDef.value ? '請選擇資料欄' : '請勾選要匯入的欄';

  return {
    columns: planCols,
    updates,
    newOptions,
    matchedCount: rowByUnit.size,
    rowCount,
    unmatched: [...unmatched],
    duplicates: [...duplicates],
    invalidTotal,
    overwriteCount,
    blockReason,
  };
});

const canImport = computed(() => {
  const p = importPlan.value;
  if (p.blockReason || p.columns.length === 0) return false;
  // 只建立欄位、沒有資料也可以（例：先建好空欄位）
  return p.updates.length > 0 || p.columns.some(c => c.kind === 'new');
});

const listPreview = (arr) => (arr.length > 12 ? `${arr.slice(0, 12).join('、')}…` : arr.join('、'));

const runImport = async () => {
  const plan = importPlan.value;
  if (!canImport.value) return;
  const newCols = plan.columns.filter(c => c.kind === 'new');
  const existingCols = plan.columns.filter(c => c.kind === 'existing');
  const ok = await askConfirm({
    title: `匯入 ${plan.updates.length} 戶資料？`,
    text: [
      newCols.length ? `建立 ${newCols.length} 個欄位` : '',
      plan.overwriteCount ? `覆蓋 ${plan.overwriteCount} 戶既有資料` : '',
    ].filter(Boolean).join('，'),
    okText: '匯入',
  });
  if (!ok) return;

  busy.value = true;
  try {
    // 1. 建立新欄位（伺服器若調整 key，以回傳為準）
    const keyRemap = new Map();
    let firstCreatedId = null;
    if (newCols.length) {
      const res = await manageFieldDefinition({
        action: 'create', projectId: props.projectId, collectionName: COLLECTION,
        fields: newCols.map(c => ({
          ...c.fieldLike,
          fieldKey: c.key,
          options: normalizeFieldType(c.fieldLike.fieldType) === 'select' ? [...(plan.newOptions.get(c.index) || [])] : [],
        })),
      });
      (res?.created || []).forEach((created, i) => {
        if (i === 0) firstCreatedId = created.id;
        if (created.fieldKey !== newCols[i].key) keyRemap.set(newCols[i].key, created.fieldKey);
      });
    }

    // 2. 既有下拉欄位：補上新選項
    for (const c of existingCols) {
      if (normalizeFieldType(c.def.fieldType) !== 'select') continue;
      const current = c.def.options || [];
      const extra = [...(plan.newOptions.get(c.index) || [])].filter(o => !current.includes(o));
      if (!extra.length) continue;
      await manageFieldDefinition({
        action: 'update', projectId: props.projectId, collectionName: COLLECTION,
        id: c.def.id, field: { ...formFromDef(c.def), options: [...current, ...extra] },
      });
    }

    // 3. 寫入各戶
    const updates = keyRemap.size
      ? plan.updates.map(u => ({ docId: u.docId, data: Object.fromEntries(Object.entries(u.data).map(([k, v]) => [keyRemap.get(k) || k, v])) }))
      : plan.updates;
    for (let i = 0; i < updates.length; i += WRITE_CHUNK) {
      const res = await batchUpdateHouseholds(updates.slice(i, i + WRITE_CHUNK));
      if (res?.status !== 'success') throw new Error(res?.message || '寫入戶別資料失敗');
    }

    notify([
      newCols.length ? `已建立 ${newCols.length} 個欄位` : '',
      `已匯入 ${updates.length} 戶`,
    ].filter(Boolean).join('，'));

    const lockedDef = importLockedDef.value;
    clearImport();
    if (lockedDef) openEdit(lockedDef);
    else if (firstCreatedId) {
      const def = props.defs.find(d => d.id === firstCreatedId);
      if (def) openEdit(def); else { resetToNone(); pendingSelectId.value = firstCreatedId; }
    } else if (existingCols[0]) openEdit(existingCols[0].def);
    else resetToNone();
  } catch (err) {
    notify(err.message || '匯入失敗', 'error');
  } finally {
    busy.value = false;
  }
};

// 開啟時回到初始畫面
watch(() => props.modelValue, (open) => {
  if (open) {
    resetToNone();
    clearImport();
    orderedDefs.value = [...props.defs];
  }
});
</script>

<style scoped>
.cfm { display: flex; flex-direction: column; }
.cfm-head-title { min-width: 0; overflow-wrap: anywhere; }
.cfm-back { width: 30px; height: 30px; margin-left: -6px; }

.cfm-body {
  display: grid;
  grid-template-columns: 270px minmax(0, 1fr);
  height: min(620px, calc(100vh - 170px));
  min-height: 0;
  overflow: hidden;
}

/* 左：清單 */
.cfm-list {
  display: flex;
  flex-direction: column;
  min-height: 0;
  border-right: 1px solid rgba(0, 0, 0, 0.08);
  background: #fbfbfd;
}
.cfm-list-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  padding: 10px 10px 8px;
}
.cfm-list-actions .mac-btn { flex: 1 1 auto; }
.cfm-list-empty { padding: 28px 16px; text-align: center; color: #8e8e93; font-size: 13px; }
.cfm-rows { flex: 1 1 auto; overflow-y: auto; padding: 0 6px 10px; }
.cfm-row {
  display: flex;
  align-items: center;
  gap: 4px;
  min-height: 46px;
  padding: 5px 6px 5px 2px;
  border-radius: 7px;
  color: #1d1d1f;
  cursor: pointer;
  outline: none;
  -webkit-tap-highlight-color: transparent;
}
.cfm-row + .cfm-row { margin-top: 1px; }
.cfm-row:hover { background: rgba(0, 0, 0, 0.04); }
.cfm-row:focus-visible { box-shadow: inset 0 0 0 2px rgba(0, 113, 227, 0.4); }
.cfm-row.is-active { background: #0071e3; color: #fff; }
.cfm-row.is-active .cfm-row-sub,
.cfm-row.is-active .cfm-drag,
.cfm-row.is-active .cfm-row-chev { color: rgba(255, 255, 255, 0.85); }
.cfm-drag {
  display: inline-grid;
  place-content: center;
  flex-shrink: 0;
  width: 22px;
  height: 32px;
  color: #aeaeb2;
  cursor: grab;
  touch-action: none;
}
.cfm-drag:active { cursor: grabbing; }
.cfm-row-main { display: flex; flex-direction: column; flex: 1 1 auto; min-width: 0; gap: 1px; }
.cfm-row-name { font-size: 13.5px; font-weight: 600; line-height: 1.3; overflow-wrap: anywhere; }
.cfm-row-sub { font-size: 11.5px; color: #6e6e73; line-height: 1.35; overflow-wrap: anywhere; }
.cfm-row-chev { flex-shrink: 0; color: #c7c7cc; }
.sortable-ghost { opacity: 0.4; }

/* 右：內容 */
.cfm-detail {
  min-width: 0;
  min-height: 0;
  overflow-y: auto;
  padding: 0 18px 18px;
}
.cfm-detail > .mac-form-label:first-child { margin-top: 14px; }
.cfm-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  height: 100%;
  color: #8e8e93;
  font-size: 13px;
  text-align: center;
}
.cfm-placeholder .v-icon { color: #c7c7cc; }

.cfm-type-seg { flex-wrap: wrap; }
.cfm-unit-input { max-width: 160px !important; }
.mac-form-row > .cfm-full { max-width: none; margin-left: 0; }
.cfm-preview { margin-left: auto; font-size: 15px; font-weight: 600; font-variant-numeric: tabular-nums; }
.cfm-row-error,
.cfm-form-error { padding: 0 14px 8px 134px; margin-top: -2px; color: #d62d20; font-size: 12px; }
.cfm-form-error { padding: 6px 4px 0; margin: 0; }

.cfm-options { display: flex; flex-wrap: wrap; align-items: center; gap: 6px; }
.cfm-option-input {
  flex: 1 1 140px;
  min-width: 120px;
  height: 26px;
  border: 0;
  outline: none;
  background: transparent;
  font: inherit;
  font-size: 13px;
  color: #1d1d1f;
}

.cfm-paste { min-height: 120px; font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 12.5px; white-space: pre; }
.cfm-file-name { min-width: 0; color: #6e6e73; font-size: 12.5px; overflow-wrap: anywhere; }
.cfm-callout { margin-top: 12px; }

.cfm-col-row { align-items: flex-start; padding-top: 10px; padding-bottom: 10px; }
.cfm-col-row > .mac-check { margin-top: 6px; }
.cfm-col-row.is-off .cfm-col-sub { opacity: 0.55; }
.cfm-col-main { display: flex; flex-direction: column; gap: 6px; flex: 1 1 auto; min-width: 0; }
.cfm-col-line { display: flex; gap: 8px; min-width: 0; }
.cfm-col-name { flex: 1 1 auto; }
.cfm-col-type { flex: 0 0 96px; }
.cfm-col-type--fixed {
  display: inline-flex;
  align-items: center;
  height: 28px;
  padding: 0 9px;
  color: #6e6e73;
  font-size: 13px;
}
.cfm-col-sub { display: flex; flex-wrap: wrap; align-items: center; gap: 4px 8px; font-size: 12px; color: #6e6e73; }
.cfm-col-warn { color: #c27400; font-weight: 600; }
.cfm-col-sample { min-width: 0; overflow-wrap: anywhere; }

.cfm-stat { margin-left: auto; font-variant-numeric: tabular-nums; color: #3a3a3c; white-space: nowrap; }
.cfm-stat--strong { font-weight: 700; color: #1d1d1f; }
.cfm-stat-row .mac-form-row-main { display: flex; flex-direction: column; gap: 2px; }
.cfm-stat-warn { color: #c27400; font-weight: 600; }
.cfm-stat-list { font-size: 12px; color: #6e6e73; overflow-wrap: anywhere; }

.cfm-confirm { padding: 18px 18px 14px; }
.cfm-confirm-title { font-size: 14.5px; font-weight: 700; margin-bottom: 4px; overflow-wrap: anywhere; }

/* 窄螢幕：清單與內容切換顯示 */
.cfm-body.is-narrow {
  grid-template-columns: minmax(0, 1fr);
  height: calc(100dvh - 24px - 49px);
}
.cfm-body.is-narrow.show-detail { height: calc(100dvh - 24px - 49px - 55px); }
.cfm-body.is-narrow .cfm-list { border-right: 0; background: #fff; }
.cfm-body.is-narrow .cfm-detail { display: none; padding: 0 12px 16px; }
.cfm-body.is-narrow.show-detail .cfm-list { display: none; }
.cfm-body.is-narrow.show-detail .cfm-detail { display: block; }
.cfm-body.is-narrow .cfm-row { min-height: 54px; }
.cfm-body.is-narrow .cfm-row-name { font-size: 15px; }
.cfm-body.is-narrow .cfm-row-sub { font-size: 12.5px; }

@media (max-width: 600px) {
  .cfm-row-error { padding-left: 14px; }
  .cfm-col-line { flex-wrap: wrap; }
  .cfm-col-type { flex: 1 1 100%; }
  .cfm-unit-input { max-width: none !important; }
  .mac-form-input, .mac-form-textarea, .cfm-option-input { font-size: 16px; }
}
</style>
