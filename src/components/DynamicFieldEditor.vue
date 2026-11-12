<template>
  <!-- 表單欄位編輯器（macOS 風格）：左＝欄位大綱、右＝編輯選中的欄位。
       資料結構與舊版完全相同（id／type／label／required／placeholder／hint／content／url／options[].subFields…），
       已上線的表單不需轉換。 -->
  <div ref="rootEl" class="dfe" :class="{ 'dfe--compact': compact, 'dfe--fill': fill, 'dfe--detail': compact && pane === 'detail' }">
    <!-- 左：欄位大綱 -->
    <aside class="dfe-side">
      <div class="dfe-side-head">
        <span>欄位</span>
        <span class="dfe-side-count">{{ localFields.length }}</span>
      </div>
      <div class="dfe-side-scroll">
        <DynamicFieldOutline
          :list="localFields"
          :selected-id="selectedId"
          @select="id => selectField(id)"
          @add="(evt, option) => openTypeMenu(evt, option)"
        />
        <div v-if="localFields.length === 0" class="dfe-side-empty">尚無欄位</div>
      </div>
      <div v-if="undoState" class="dfe-undo">
        <span class="dfe-undo-text">已刪除「{{ undoState.item.label || '未命名' }}」</span>
        <button type="button" class="mac-link-btn" @click="undoRemove">復原</button>
      </div>
      <div class="dfe-side-foot">
        <button type="button" class="mac-btn mac-btn--block dfe-add-btn" @click="openTypeMenu($event)">
          <v-icon size="16">mdi-plus</v-icon><span>加入欄位</span>
        </button>
      </div>
    </aside>

    <!-- 右：編輯選中的欄位 -->
    <section class="dfe-main mac-form">
      <template v-if="selection">
        <div class="dfe-main-head">
          <button v-if="compact" type="button" class="mac-btn mac-btn--sm dfe-back" @click="pane = 'list'">
            <v-icon size="16">mdi-chevron-left</v-icon><span>清單</span>
          </button>
          <span class="mac-tag dfe-type-tag"><v-icon size="14">{{ fieldTypeIcon(selection.field) }}</v-icon>{{ fieldTypeName(selection.field) }}</span>
          <span class="dfe-pos">{{ selection.index + 1 }} / {{ selection.list.length }}</span>
          <span class="dfe-spacer"></span>
          <button type="button" class="mac-icon-btn" title="上移" aria-label="上移" :disabled="selection.index === 0" @click="moveSelected(-1)">
            <v-icon size="18">mdi-arrow-up</v-icon>
          </button>
          <button type="button" class="mac-icon-btn" title="下移" aria-label="下移" :disabled="selection.index === selection.list.length - 1" @click="moveSelected(1)">
            <v-icon size="18">mdi-arrow-down</v-icon>
          </button>
          <button type="button" class="mac-icon-btn" title="複製" aria-label="複製" @click="duplicateSelected">
            <v-icon size="17">mdi-content-copy</v-icon>
          </button>
          <button type="button" class="mac-icon-btn mac-icon-btn--danger" title="刪除" aria-label="刪除" @click="removeSelected">
            <v-icon size="18">mdi-trash-can-outline</v-icon>
          </button>
        </div>

        <div class="dfe-main-scroll">
          <!-- 所在位置：追問欄位才顯示，點上層可跳回 -->
          <nav v-if="selection.crumbs.length" class="dfe-crumbs" aria-label="所在位置">
            <template v-for="(crumb, ci) in selection.crumbs" :key="ci">
              <button type="button" class="mac-link-btn dfe-crumb" @click="selectField(crumb.field.id)">{{ crumb.field.label || '未命名' }}</button>
              <span class="dfe-crumb-opt">選「{{ crumb.option.label }}」時</span>
              <v-icon size="14" class="dfe-crumb-sep">mdi-chevron-right</v-icon>
            </template>
            <span class="dfe-crumb-here">{{ selection.field.label || '未命名' }}</span>
          </nav>

          <div v-if="selection.field.type === 'divider'" class="dfe-note">分隔線不需設定</div>

          <div v-else class="mac-form-group">
            <label class="mac-form-row">
              <span class="mac-form-row-label">{{ selection.field.type === 'link' ? '顯示文字' : '標題' }}</span>
              <input ref="labelInput" v-model="selection.field.label" type="text" class="mac-form-input" />
            </label>
            <label v-if="hasRequired(selection.field)" class="mac-form-row">
              <span class="mac-form-row-label">必填</span>
              <span class="dfe-spacer"></span>
              <input v-model="selection.field.required" type="checkbox" class="mac-switch" />
            </label>
            <label v-if="selection.field.type === 'link'" class="mac-form-row">
              <span class="mac-form-row-label">網址</span>
              <input v-model="selection.field.url" type="url" inputmode="url" class="mac-form-input" placeholder="https://" />
            </label>
            <div v-if="selection.field.type === 'description'" class="mac-form-pad">
              <div class="mac-sheet-label">內容</div>
              <textarea v-model="selection.field.content" rows="4" class="mac-form-textarea"></textarea>
            </div>
            <label v-if="hasPlaceholder(selection.field)" class="mac-form-row">
              <span class="mac-form-row-label">框內提示</span>
              <input v-model="selection.field.placeholder" type="text" class="mac-form-input" />
            </label>
            <label v-if="hasHint(selection.field)" class="mac-form-row">
              <span class="mac-form-row-label">下方說明</span>
              <input v-model="selection.field.hint" type="text" class="mac-form-input" />
            </label>
          </div>

          <!-- 系統欄位 -->
          <template v-if="selection.field.type === 'system'">
            <div class="mac-form-label">自動帶入</div>
            <div class="mac-form-group">
              <label class="mac-form-row">
                <span class="mac-form-row-label">資料來源</span>
                <select v-model="selection.field.systemKey" class="mac-form-input mac-form-select">
                  <option v-for="opt in SYSTEM_FIELD_KEYS" :key="opt.value" :value="opt.value">{{ opt.title }}</option>
                </select>
              </label>
              <label class="mac-form-row">
                <span class="mac-form-row-label">自動帶入</span>
                <span class="dfe-spacer"></span>
                <input v-model="selection.field.autoFill" type="checkbox" class="mac-switch" />
              </label>
              <label class="mac-form-row">
                <span class="mac-form-row-label">唯讀</span>
                <span class="dfe-spacer"></span>
                <input v-model="selection.field.readOnly" type="checkbox" class="mac-switch" />
              </label>
            </div>
          </template>

          <!-- 選項（單選／多選） -->
          <template v-if="hasOptions(selection.field)">
            <div class="mac-form-label">選項</div>
            <div class="mac-form-group dfe-opts">
              <draggable
                v-if="selection.field.options"
                :list="selection.field.options"
                item-key="id"
                handle=".dfe-opt-grip"
                :animation="160"
                ghost-class="dfe-opt-ghost"
              >
                <template #item="{ element: option, index: optIndex }">
                  <div class="dfe-opt">
                    <span class="dfe-opt-grip" title="拖曳排序"><v-icon size="16">mdi-drag-vertical</v-icon></span>
                    <v-icon size="16" class="dfe-opt-mark">{{ selection.field.type === 'radio' ? 'mdi-radiobox-blank' : 'mdi-checkbox-blank-outline' }}</v-icon>
                    <input
                      v-model="option.label"
                      type="text"
                      class="mac-form-input dfe-opt-input"
                      :class="{ 'is-error': isOptionInvalid(selection.field, option) }"
                      aria-label="選項文字"
                      @input="syncOptionValue(option)"
                      @compositionend="syncOptionValue(option)"
                      @keydown.enter="onOptionEnter($event)"
                    />
                    <button
                      type="button"
                      class="mac-btn mac-btn--sm dfe-follow"
                      :class="{ 'is-active': subCount(option) > 0 }"
                      title="選這個選項後要再填的欄位"
                      @click="onFollowUp($event, option)"
                    >
                      <v-icon size="14">mdi-subdirectory-arrow-right</v-icon><span>追問</span><span v-if="subCount(option) > 0" class="mac-filter-count">{{ subCount(option) }}</span>
                    </button>
                    <button type="button" class="mac-icon-btn" title="移除選項" aria-label="移除選項" @click="removeOption(selection.field, optIndex)">
                      <v-icon size="17">mdi-close</v-icon>
                    </button>
                  </div>
                </template>
              </draggable>
              <div class="dfe-opt dfe-opt--new">
                <span class="dfe-opt-grip dfe-opt-grip--off"></span>
                <v-icon size="16" class="dfe-opt-mark">mdi-plus</v-icon>
                <input
                  ref="newOptionInput"
                  v-model="newOptionText"
                  type="text"
                  class="mac-form-input dfe-opt-input"
                  placeholder="輸入選項後按 Enter"
                  aria-label="加入選項"
                  enterkeyhint="done"
                  @keydown.enter="commitNewOption($event)"
                  @blur="commitNewOption()"
                />
              </div>
            </div>
            <div v-if="hasInvalidOption(selection.field)" class="dfe-opt-error">選項不可空白或重複</div>
          </template>
        </div>
      </template>

      <!-- 未選欄位：直接列出可加入的類型 -->
      <div v-else class="dfe-main-scroll dfe-palette">
        <div class="dfe-palette-title">{{ localFields.length ? '點左側欄位編輯，或加入欄位' : '選一種欄位開始' }}</div>
        <div class="dfe-palette-grid">
          <button v-for="t in INPUT_FIELD_TYPES" :key="t.type" type="button" class="dfe-tile" @click="addField(t.type)">
            <v-icon size="20">{{ t.icon }}</v-icon><span>{{ t.title }}</span>
          </button>
        </div>
        <div class="mac-form-label">版面</div>
        <div class="dfe-palette-grid">
          <button v-for="t in LAYOUT_FIELD_TYPES" :key="t.type" type="button" class="dfe-tile" @click="addField(t.type)">
            <v-icon size="20">{{ t.icon }}</v-icon><span>{{ t.title }}</span>
          </button>
        </div>
        <template v-if="allowSystemFields">
          <div class="mac-form-label">自動帶入</div>
          <div class="dfe-palette-grid">
            <button v-for="s in SYSTEM_FIELD_KEYS" :key="s.value" type="button" class="dfe-tile" @click="addField('system', s.value)">
              <v-icon size="20">{{ s.icon }}</v-icon><span>{{ s.title }}</span>
            </button>
          </div>
        </template>
      </div>
    </section>

    <!-- 欄位類型選單（加入欄位／追問共用一個） -->
    <v-menu v-model="typeMenuOpen" :target="typeMenuTarget" content-class="mac-menu dfe-type-menu" location="top start" :close-on-content-click="true">
      <v-list density="compact">
        <v-list-subheader class="dfe-menu-head">{{ typeMenuOption ? `選「${typeMenuOption.label}」時要填` : '加入欄位' }}</v-list-subheader>
        <v-list-item v-for="t in INPUT_FIELD_TYPES" :key="t.type" :prepend-icon="t.icon" :title="t.title" @click="addField(t.type)"></v-list-item>
        <v-divider class="my-1"></v-divider>
        <v-list-item v-for="t in LAYOUT_FIELD_TYPES" :key="t.type" :prepend-icon="t.icon" :title="t.title" @click="addField(t.type)"></v-list-item>
        <template v-if="allowSystemFields">
          <v-divider class="my-1"></v-divider>
          <v-list-subheader class="dfe-menu-head">自動帶入</v-list-subheader>
          <v-list-item v-for="s in SYSTEM_FIELD_KEYS" :key="s.value" :prepend-icon="s.icon" :title="s.title" @click="addField('system', s.value)"></v-list-item>
        </template>
      </v-list>
    </v-menu>
  </div>
</template>

<script setup lang="ts">
import { ref, shallowRef, watch, computed, nextTick, onMounted, onBeforeUnmount } from 'vue';
import draggable from 'vuedraggable';
import DynamicFieldOutline from '@/components/DynamicFieldOutline.vue';
import {
  INPUT_FIELD_TYPES,
  LAYOUT_FIELD_TYPES,
  SYSTEM_FIELD_KEYS,
  fieldTypeIcon,
  fieldTypeName,
} from '@/utils/dynamicFieldTypes';

// Use native browser UUID generator to avoid 'stream' module issues with uuid package
const uuidv4 = () => crypto.randomUUID();

export interface DynamicField {
  id: string;
  type: string;
  label: string;
  required?: boolean;
  placeholder?: string;
  hint?: string;
  content?: string; // For description
  url?: string; // For link
  options?: FieldOption[];
  systemKey?: string;
  autoFill?: boolean;
  readOnly?: boolean;
  expanded?: boolean; // 舊版編輯器的展開狀態，已不使用；舊資料上的值原樣保留
}

export interface FieldOption {
  id: string;
  label: string;
  value: string;
  subFields?: DynamicField[];
}

interface Crumb { field: DynamicField; option: FieldOption }
interface Selection { field: DynamicField; list: DynamicField[]; index: number; crumbs: Crumb[] }

const props = defineProps<{
  fields: DynamicField[];
  allowSystemFields?: boolean;
  isNested?: boolean; // 舊版遞迴用，保留相容，不再使用
  fill?: boolean; // 撐滿父層高度（放在固定高度的視窗裡時用）
}>();

const emit = defineEmits(['update:fields']);

const localFields = ref<DynamicField[]>([]);

// 複製一份並替沒有 id 的選項補 id（拖曳排序需要），各層追問欄位一併處理；不更動 props
const initializeFields = (fields: DynamicField[]): DynamicField[] => {
  if (!fields || !Array.isArray(fields)) return [];
  return fields.map(field => {
    const newField = { ...field };
    if (Array.isArray(newField.options)) {
      newField.options = newField.options.map(opt => {
        const newOpt = { ...opt, id: opt.id || uuidv4() };
        if (Array.isArray(newOpt.subFields)) newOpt.subFields = initializeFields(newOpt.subFields);
        return newOpt;
      });
    }
    return newField;
  });
};

localFields.value = initializeFields(props.fields);

watch(() => props.fields, (newVal) => {
  // 內容相同就不重設，避免父層回寫造成循環更新
  if (JSON.stringify(newVal || []) !== JSON.stringify(localFields.value)) {
    localFields.value = initializeFields(newVal);
  }
}, { deep: true });

// 只在內容真的變動時才通知父層（掛載當下不發，避免父層誤判為已修改）
watch(localFields, () => {
  emit('update:fields', localFields.value);
}, { deep: true });

// ── 選取與所在位置 ──
const selectedId = ref<string | null>(null);

const locate = (id: string, list: DynamicField[], crumbs: Crumb[] = []): Selection | null => {
  for (let index = 0; index < list.length; index++) {
    const field = list[index];
    if (field.id === id) return { field, list, index, crumbs };
    for (const option of field.options || []) {
      if (Array.isArray(option.subFields) && option.subFields.length) {
        const found = locate(id, option.subFields, [...crumbs, { field, option }]);
        if (found) return found;
      }
    }
  }
  return null;
};

const selection = computed<Selection | null>(() =>
  selectedId.value ? locate(selectedId.value, localFields.value) : null
);

// ── 版面：寬度不足時改為「清單 ⇄ 編輯」兩頁切換 ──
const rootEl = ref<HTMLElement | null>(null);
const compact = ref(false);
const pane = ref<'list' | 'detail'>('list');
let resizeObserver: ResizeObserver | null = null;

onMounted(() => {
  if (!rootEl.value || typeof ResizeObserver === 'undefined') return;
  resizeObserver = new ResizeObserver(entries => {
    const width = entries[0]?.contentRect.width || 0;
    if (width > 0) compact.value = width < 640;
  });
  resizeObserver.observe(rootEl.value);
});
onBeforeUnmount(() => {
  resizeObserver?.disconnect();
  if (undoTimer) clearTimeout(undoTimer);
});

const labelInput = ref<HTMLInputElement | null>(null);
const newOptionInput = ref<HTMLInputElement | null>(null);
const newOptionText = ref('');

const selectField = (id: string | null, focusLabel = false) => {
  commitNewOption();
  selectedId.value = id;
  pane.value = id ? 'detail' : 'list';
  if (!id) return;
  nextTick(() => {
    // 清單很長時，把選中的那一列捲進可視範圍（新欄位常加在最底下）
    rootEl.value?.querySelector('.dfo-row.is-active')?.scrollIntoView({ block: 'nearest' });
    if (focusLabel) {
      labelInput.value?.focus();
      labelInput.value?.select();
    }
  });
};

watch(selection, (sel) => {
  // 選中的欄位被外部移除（父層重設）時回到清單
  if (!sel && selectedId.value) {
    selectedId.value = null;
    pane.value = 'list';
  }
});

// ── 各類型顯示哪些設定（與舊版規則相同） ──
const hasRequired = (f: DynamicField) => !['header', 'description', 'divider', 'link'].includes(f.type);
const hasPlaceholder = (f: DynamicField) => !['header', 'description', 'divider', 'link', 'radio', 'checkbox'].includes(f.type);
const hasHint = (f: DynamicField) => !['header', 'description', 'divider'].includes(f.type);
const hasOptions = (f: DynamicField) => ['radio', 'checkbox'].includes(f.type);

// ── 加入欄位 ──
const typeMenuOpen = ref(false);
const typeMenuTarget = shallowRef<any>(undefined);
const typeMenuOption = shallowRef<FieldOption | null>(null); // 有值＝加到該選項底下（追問）；null＝加到表單

const openTypeMenu = (evt: Event, option: FieldOption | null = null) => {
  typeMenuTarget.value = evt.currentTarget as HTMLElement;
  typeMenuOption.value = option;
  typeMenuOpen.value = true;
};

watch(typeMenuOpen, (open) => {
  // 關閉後清掉目的地，之後從類型面板加入的欄位一律加到表單
  if (!open) setTimeout(() => { if (!typeMenuOpen.value) typeMenuOption.value = null; }, 0);
});

const makeField = (type: string, systemKey?: string): DynamicField => {
  if (type === 'system') {
    return {
      id: uuidv4(),
      type: 'system',
      label: SYSTEM_FIELD_KEYS.find(o => o.value === systemKey)?.title || '系統欄位',
      systemKey,
      required: true,
      autoFill: true,
      readOnly: true,
      placeholder: '',
    };
  }
  const field: DynamicField = {
    id: uuidv4(),
    type,
    label: type === 'divider' ? '分隔線' : (type === 'header' ? '新標題' : (type === 'link' ? '點擊前往' : '新欄位')),
    required: false,
  };
  if (type === 'link') field.url = '';
  if (hasOptions(field)) {
    field.options = ['選項 1', '選項 2'].map(label => ({ id: uuidv4(), label, value: label, subFields: [] }));
  }
  return field;
};

const addField = (type: string, systemKey?: string) => {
  const field = makeField(type, systemKey);
  const option = typeMenuOption.value;
  typeMenuOption.value = null;
  if (option) {
    if (!Array.isArray(option.subFields)) option.subFields = [];
    option.subFields.push(field);
  } else {
    // 選中的是表單第一層欄位時插在它後面，否則加到最後
    const sel = selection.value;
    if (sel && sel.crumbs.length === 0) localFields.value.splice(sel.index + 1, 0, field);
    else localFields.value.push(field);
  }
  selectField(field.id, type !== 'divider');
};

// ── 移動／複製／刪除 ──
const moveSelected = (delta: number) => {
  const sel = selection.value;
  if (!sel) return;
  const to = sel.index + delta;
  if (to < 0 || to >= sel.list.length) return;
  const [item] = sel.list.splice(sel.index, 1);
  sel.list.splice(to, 0, item);
};

const cloneWithNewIds = (source: DynamicField): DynamicField => {
  const copy: DynamicField = JSON.parse(JSON.stringify(source));
  const renew = (field: DynamicField) => {
    field.id = uuidv4();
    (field.options || []).forEach(option => {
      option.id = uuidv4();
      (option.subFields || []).forEach(renew);
    });
  };
  renew(copy);
  return copy;
};

const duplicateSelected = () => {
  const sel = selection.value;
  if (!sel) return;
  const copy = cloneWithNewIds(sel.field);
  sel.list.splice(sel.index + 1, 0, copy);
  selectField(copy.id, true);
};

const undoState = shallowRef<{ list: DynamicField[]; index: number; item: DynamicField } | null>(null);
let undoTimer: ReturnType<typeof setTimeout> | null = null;

const removeSelected = () => {
  const sel = selection.value;
  if (!sel) return;
  const [item] = sel.list.splice(sel.index, 1);
  undoState.value = { list: sel.list, index: sel.index, item };
  if (undoTimer) clearTimeout(undoTimer);
  undoTimer = setTimeout(() => { undoState.value = null; }, 10000);
  // 留在同一層：選下一個（沒有就上一個），整層空了就回到上層欄位
  const next = sel.list[sel.index] || sel.list[sel.index - 1] || sel.crumbs[sel.crumbs.length - 1]?.field || null;
  selectedId.value = next ? next.id : null;
  if (compact.value || !next) pane.value = 'list';
};

const undoRemove = () => {
  const state = undoState.value;
  if (!state) return;
  state.list.splice(Math.min(state.index, state.list.length), 0, state.item);
  undoState.value = null;
  if (undoTimer) clearTimeout(undoTimer);
  // 追問欄位的上層若已被刪掉，復原後找不到就不選
  nextTick(() => {
    if (locate(state.item.id, localFields.value)) selectedId.value = state.item.id;
  });
};

// ── 選項 ──
const subCount = (option: FieldOption) => (Array.isArray(option.subFields) ? option.subFields.length : 0);

// 選項的儲存值跟著文字走（與舊版相同）；等 v-model 寫入後再同步，中文輸入法選字中不會寫入半成品
const syncOptionValue = (option: FieldOption) => {
  nextTick(() => { option.value = String(option.label ?? ''); });
};

const isOptionInvalid = (field: DynamicField, option: FieldOption) => {
  const label = String(option.label ?? '').trim();
  if (!label) return true;
  return (field.options || []).filter(o => String(o.label ?? '').trim() === label).length > 1;
};
const hasInvalidOption = (field: DynamicField) => (field.options || []).some(o => isOptionInvalid(field, o));

const commitNewOption = (evt?: KeyboardEvent) => {
  if (evt?.isComposing) return; // 輸入法選字的 Enter
  const text = newOptionText.value.trim();
  const field = selection.value?.field;
  newOptionText.value = '';
  if (!text || !field || !hasOptions(field)) return;
  if (!Array.isArray(field.options)) field.options = [];
  field.options.push({ id: uuidv4(), label: text, value: text, subFields: [] });
};

const onOptionEnter = (evt: KeyboardEvent) => {
  if (evt.isComposing) return;
  newOptionInput.value?.focus();
};

const removeOption = (field: DynamicField, index: number) => {
  const option = field.options?.[index];
  if (!option) return;
  const count = subCount(option);
  if (count > 0 && !confirm(`「${option.label}」底下的 ${count} 個追問欄位會一起移除，確定嗎？`)) return;
  field.options!.splice(index, 1);
};

const onFollowUp = (evt: Event, option: FieldOption) => {
  if (subCount(option) > 0) selectField(option.subFields![0].id);
  else openTypeMenu(evt, option);
};
</script>

<style scoped>
.dfe {
  position: relative;
  display: flex;
  height: min(58vh, 600px);
  min-height: 380px;
  border: 1px solid rgba(0, 0, 0, 0.1);
  border-radius: 10px;
  overflow: hidden;
  background: #fff;
  color: #1d1d1f;
  font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", "Helvetica Neue", "PingFang TC", "Noto Sans TC", sans-serif;
  text-align: left;
}
.dfe--fill { height: 100%; min-height: 0; border: 0; border-radius: 0; }

/* 左：大綱 */
.dfe-side {
  display: flex;
  flex-direction: column;
  flex: 0 0 264px;
  min-width: 0;
  background: #f2f2f5;
  border-right: 1px solid rgba(0, 0, 0, 0.08);
}
.dfe-side-head {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 12px 14px 6px;
  color: #6e6e73;
  font-size: 11.5px;
  font-weight: 600;
  letter-spacing: 0.02em;
}
.dfe-side-count {
  min-width: 18px;
  padding: 0 5px;
  border-radius: 9px;
  background: rgba(0, 0, 0, 0.08);
  color: #48484a;
  font-size: 11px;
  line-height: 18px;
  text-align: center;
}
.dfe-side-scroll { flex: 1 1 auto; min-height: 0; overflow-y: auto; padding: 0 6px 8px; }
.dfe-side-empty { padding: 28px 12px; text-align: center; color: #8e8e93; font-size: 13px; }
.dfe-side-foot { padding: 8px 10px 10px; border-top: 1px solid rgba(0, 0, 0, 0.06); }
.dfe-undo {
  display: flex;
  align-items: center;
  gap: 6px;
  margin: 0 10px 8px;
  padding: 6px 6px 6px 10px;
  border-radius: 8px;
  background: #fff;
  box-shadow: 0 0 0 0.5px rgba(0, 0, 0, 0.1), 0 1px 3px rgba(0, 0, 0, 0.08);
  font-size: 12.5px;
}
.dfe-undo-text { flex: 1 1 auto; min-width: 0; overflow-wrap: anywhere; }

/* 右：編輯 */
.dfe-main { display: flex; flex-direction: column; flex: 1 1 auto; min-width: 0; }
.dfe-main-head {
  display: flex;
  align-items: center;
  gap: 4px;
  min-height: 44px;
  padding: 6px 10px 6px 14px;
  background: #fff;
  border-bottom: 1px solid rgba(0, 0, 0, 0.08);
}
.dfe-type-tag { gap: 4px; }
.dfe-pos { margin-left: 4px; color: #8e8e93; font-size: 12px; font-variant-numeric: tabular-nums; white-space: nowrap; }
.dfe-spacer { flex: 1 1 auto; }
.dfe-main-head .mac-icon-btn { width: 30px; height: 30px; }
.dfe-main-head .mac-icon-btn:disabled { opacity: 0.35; cursor: default; background: transparent; }
.dfe-back { margin-right: 4px; padding: 0 8px 0 4px; }
.dfe-main-scroll { flex: 1 1 auto; min-height: 0; overflow-y: auto; padding: 14px 16px 20px; }

.dfe-crumbs {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 2px 4px;
  margin-bottom: 10px;
  font-size: 12.5px;
  color: #6e6e73;
}
.dfe-crumb { padding: 2px 0; text-align: left; white-space: normal; overflow-wrap: anywhere; }
.dfe-crumb-opt { overflow-wrap: anywhere; }
.dfe-crumb-sep { color: #c7c7cc; }
.dfe-crumb-here { color: #1d1d1f; font-weight: 600; overflow-wrap: anywhere; }
.dfe-note { padding: 28px 12px; text-align: center; color: #8e8e93; font-size: 13px; }

.dfe .mac-form-row { flex-wrap: nowrap; cursor: default; }
.dfe .mac-form-row-label { width: 76px; color: #1d1d1f; }
.dfe .mac-form-row > .mac-form-input { flex: 1 1 0; max-width: none; margin-left: 0; height: 30px; }
.dfe .mac-form-label:first-child { margin-top: 0; }

/* 選項 */
.dfe-opts { padding: 4px 0; }
.dfe-opt { display: flex; align-items: center; gap: 6px; min-height: 40px; padding: 4px 8px 4px 4px; }
.dfe-opt-grip {
  display: inline-grid;
  place-content: center;
  flex-shrink: 0;
  width: 20px;
  height: 28px;
  color: #b0b0b6;
  cursor: grab;
  touch-action: none;
}
.dfe-opt-grip--off { cursor: default; }
.dfe-opt-mark { flex-shrink: 0; color: #8e8e93; }
.dfe-opt-input { height: 30px; }
.dfe-opt-input.is-error { border-color: #d62d20; box-shadow: 0 0 0 3px rgba(214, 45, 32, 0.12); }
.dfe-opt--new .dfe-opt-input { border-style: dashed; background: transparent; box-shadow: none; }
.dfe-opt--new .dfe-opt-input:focus { border-style: solid; background: #fff; }
.dfe-follow { flex-shrink: 0; gap: 3px; }
.dfe-follow .mac-filter-count { min-width: 16px; height: 16px; margin-left: 1px; font-size: 10.5px; }
.dfe-opt-ghost { opacity: 0.4; }
.dfe-opt-error { margin: 6px 4px 0; color: #d62d20; font-size: 12px; }

/* 類型面板 */
.dfe-palette-title { margin: 2px 4px 10px; color: #6e6e73; font-size: 13px; }
.dfe-palette-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(104px, 1fr)); gap: 8px; }
.dfe-tile {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
  min-height: 68px;
  padding: 10px 6px;
  border: 0;
  border-radius: 10px;
  background: #fff;
  color: #1d1d1f;
  font-family: inherit;
  font-size: 13px;
  font-weight: 500;
  line-height: 1.3;
  cursor: pointer;
  box-shadow: 0 0 0 0.5px rgba(0, 0, 0, 0.08), 0 0.5px 1.5px rgba(0, 0, 0, 0.05);
  transition: box-shadow 0.12s, transform 0.12s;
}
.dfe-tile .v-icon { color: #0071e3; }
.dfe-tile:hover { box-shadow: 0 0 0 1px rgba(0, 113, 227, 0.55), 0 2px 6px rgba(0, 0, 0, 0.08); }
.dfe-tile:active { transform: translateY(0.5px); }
.dfe-menu-head { min-height: 26px !important; padding-inline: 10px !important; color: #6e6e73; font-size: 11.5px; font-weight: 600; }

/* 窄版：清單與編輯各佔一頁 */
.dfe--compact .dfe-side { flex: 1 1 auto; border-right: 0; }
.dfe--compact .dfe-main { display: none; }
.dfe--compact.dfe--detail .dfe-side { display: none; }
.dfe--compact.dfe--detail .dfe-main { display: flex; }
.dfe--compact .dfe-main-scroll { padding: 12px 12px 20px; }
.dfe--compact .dfe-main-head { padding-left: 10px; }
.dfe--compact .mac-form-input,
.dfe--compact .mac-form-textarea { font-size: 16px; }
.dfe--compact .mac-form-row > .mac-form-input,
.dfe--compact .dfe-opt-input { height: 36px; }
.dfe--compact .dfe-add-btn { height: 38px; font-size: 14px; }
.dfe--compact .dfe-opt { flex-wrap: wrap; }
.dfe--compact .dfe-opt-input { flex: 1 1 140px; }
.dfe--compact .dfe-follow { height: 32px; }
.dfe--compact .dfe-opt .mac-icon-btn { width: 32px; height: 32px; }
</style>

<style>
/* 類型選單內容被 teleport 到 body，需用非 scoped 樣式 */
.dfe-type-menu .v-list-item__prepend > .v-icon { font-size: 18px; opacity: 1; color: #6e6e73; }
.dfe-type-menu .v-list-item__prepend > .v-icon ~ .v-list-item__spacer { width: 10px; }
.dfe-type-menu .v-list-item:hover .v-list-item__prepend > .v-icon,
.dfe-type-menu .v-list-item:focus-visible .v-list-item__prepend > .v-icon { color: #fff; }
</style>
