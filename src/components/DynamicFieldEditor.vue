<template>
  <div class="dynamic-field-editor">
    <div class="d-flex align-center flex-wrap mb-4 bg-white py-2 toolbar-gap" :class="{ 'position-sticky top-0 z-index-10 border-b': !isNested }">
       <v-menu>
        <template v-slot:activator="{ props }">
          <v-btn
            color="primary"
            variant="flat"
            prepend-icon="mdi-plus"
            v-bind="props"
            class="font-weight-bold"
          >
            新增元件
          </v-btn>
        </template>
        <v-list density="compact">
          <v-list-subheader>基本欄位</v-list-subheader>
          <v-list-item @click="addField('text')" prepend-icon="mdi-form-textbox" title="單行文字"></v-list-item>
          <v-list-item @click="addField('textarea')" prepend-icon="mdi-form-textarea" title="多行文字"></v-list-item>
          <v-list-item @click="addField('radio')" prepend-icon="mdi-radiobox-marked" title="單選題"></v-list-item>
          <v-list-item @click="addField('checkbox')" prepend-icon="mdi-checkbox-marked" title="多選題"></v-list-item>
          <v-list-item @click="addField('date')" prepend-icon="mdi-calendar" title="日期"></v-list-item>
          <v-list-item @click="addField('address')" prepend-icon="mdi-map-marker-radius" title="地址"></v-list-item>
          
          <v-divider class="my-2"></v-divider>
          <v-list-subheader>版面元件</v-list-subheader>
          <v-list-item @click="addField('header')" prepend-icon="mdi-format-header-1" title="標題"></v-list-item>
          <v-list-item @click="addField('description')" prepend-icon="mdi-text" title="說明文字"></v-list-item>
          <v-list-item @click="addField('divider')" prepend-icon="mdi-minus" title="分隔線"></v-list-item>
          <v-list-item @click="addField('link')" prepend-icon="mdi-link" title="插入連結"></v-list-item>

          <template v-if="allowSystemFields">
            <v-divider class="my-2"></v-divider>
            <v-list-subheader>系統欄位 (自動帶入)</v-list-subheader>
            <v-list-item @click="addSystemField('unitId')" prepend-icon="mdi-home" title="戶別"></v-list-item>
            <v-list-item @click="addSystemField('buyerName')" prepend-icon="mdi-account" title="買方姓名"></v-list-item>
            <v-list-item @click="addSystemField('buyerPhone')" prepend-icon="mdi-phone" title="買方電話"></v-list-item>
            <v-list-item @click="addSystemField('buyerAddress')" prepend-icon="mdi-map-marker" title="買方地址"></v-list-item>
            <v-list-item @click="addSystemField('buyerIdNumber')" prepend-icon="mdi-card-account-details" title="身分證字號"></v-list-item>
            <v-list-item @click="addSystemField('buyerEmail')" prepend-icon="mdi-email-outline" title="EMAIL"></v-list-item>
            <v-list-item @click="addSystemField('buyerDateOfBirth')" prepend-icon="mdi-cake-variant" title="出生年月日"></v-list-item>
            <v-list-item @click="addSystemField('buyerMailingAddress')" prepend-icon="mdi-email-open-outline" title="買方通訊地址"></v-list-item>
             <v-list-item @click="addSystemField('salesPerson')" prepend-icon="mdi-badge-account" title="銷售人員"></v-list-item>
          </template>
        </v-list>
      </v-menu>
      
      <v-spacer></v-spacer>

      <!-- ✅ [新增] 全部收合/展開：收合後卡片變小，主列表拖曳更容易 -->
      <v-btn
        v-if="localFields.length > 1"
        size="small"
        variant="text"
        color="grey-darken-2"
        :prepend-icon="allCollapsed ? 'mdi-arrow-expand-vertical' : 'mdi-arrow-collapse-vertical'"
        @click="toggleCollapseAll"
      >{{ allCollapsed ? '展開' : '收合' }}</v-btn>

      <!-- ✅ [新增] 調整順序：精簡列表模式，長距離移動免拖整張卡片 -->
      <v-btn
        v-if="localFields.length > 1"
        size="small"
        variant="tonal"
        color="primary"
        prepend-icon="mdi-swap-vertical"
        @click="reorderDialog = true"
      >調整順序</v-btn>

      <div class="text-caption text-grey d-none d-sm-block">
        共 {{ localFields.length }} 個元件
      </div>
    </div>

    <draggable 
      v-model="localFields" 
      item-key="id"
      handle=".drag-handle"
      @end="updateFields"
      animation="200"
    >
      <template #item="{ element: field, index }">
        <v-card
          variant="outlined"
          class="mb-3 field-card"
          :id="`field-card-${field.id}`"
          :class="{ 'system-field': field.type === 'system', 'layout-field': ['header', 'description', 'divider'].includes(field.type) }"
        >
          <div class="d-flex align-center px-4 py-3 bg-grey-lighten-5 cursor-pointer" @click="field.expanded = !field.expanded">
            <v-icon class="drag-handle cursor-move mr-3 text-grey-darken-1">mdi-drag-vertical</v-icon>
            
            <v-icon 
              v-if="field.type === 'system'" 
              color="indigo" 
              class="mr-2"
              size="small"
            >mdi-database</v-icon>
            <v-icon 
              v-else-if="['header', 'description', 'divider'].includes(field.type)" 
              color="grey-darken-2" 
              class="mr-2"
              size="small"
            >mdi-view-dashboard-outline</v-icon>
            
            <div class="font-weight-bold flex-grow-1 text-truncate">
              {{ field.label || '未命名欄位' }}
              <span v-if="field.required" class="text-error ml-1">*</span>
            </div>

            <!-- 手機空間有限：型別 chip 僅桌機顯示 -->
            <v-chip size="x-small" class="mr-2 d-none d-sm-flex" variant="tonal">
              {{ getFieldTypeName(field) }}
            </v-chip>

            <!-- ✅ [新增] 上移/下移：小幅調整免拖曳（手機尤其好按） -->
            <v-btn icon variant="text" size="small" color="grey-darken-1" :disabled="index === 0" @click.stop="moveField(index, -1)">
              <v-icon>mdi-arrow-up-thin</v-icon>
            </v-btn>
            <v-btn icon variant="text" size="small" color="grey-darken-1" :disabled="index === localFields.length - 1" @click.stop="moveField(index, 1)">
              <v-icon>mdi-arrow-down-thin</v-icon>
            </v-btn>

            <v-btn icon variant="text" size="small" @click.stop="removeField(index)" color="grey">
              <v-icon>mdi-trash-can-outline</v-icon>
            </v-btn>
            <v-icon size="small" class="ml-1" :class="{ 'rotate-180': field.expanded }">mdi-chevron-down</v-icon>
          </div>

          <v-expand-transition>
            <div v-show="field.expanded !== false">
              <v-divider></v-divider>
              <v-card-text class="pa-4">
                
                <!-- Common Properties -->
                <v-row dense>
                  <v-col cols="12" md="8">
                     <v-text-field
                      v-model="field.label"
                      :label="field.type === 'link' ? '顯示文字' : '欄位標題'"
                      density="compact"
                      variant="outlined"
                      :disabled="field.type === 'divider'"
                    ></v-text-field>
                  </v-col>
                  <v-col cols="12" md="4" v-if="!['header', 'description', 'divider', 'link'].includes(field.type)">
                    <v-checkbox
                      v-model="field.required"
                      label="必填"
                      density="compact"
                      hide-details
                      color="primary"
                    ></v-checkbox>
                  </v-col>
                </v-row>

                 <!-- Hint & Placeholder -->
                 <v-row dense>
                   <v-col cols="12" v-if="!['header', 'description', 'divider', 'link', 'radio', 'checkbox', 'system'].includes(field.type)">
                      <v-text-field
                        v-model="field.placeholder"
                        label="提示文字 (Placeholder)"
                        density="compact"
                        variant="outlined"
                        hide-details
                      ></v-text-field>
                   </v-col>
                   <v-col cols="12" v-if="!['header', 'description', 'divider'].includes(field.type)">
                      <v-text-field
                        v-model="field.hint"
                        label="輔助說明 (Hint)"
                        placeholder="顯示在欄位下方的說明文字"
                        density="compact"
                        variant="outlined"
                        hide-details
                      ></v-text-field>
                   </v-col>
                 </v-row>
                 
                 <div class="mt-2"></div>
 
                 <v-text-field
                   v-if="field.type === 'link'"
                   v-model="field.url"
                  label="連結網址 (URL)"
                  placeholder="https://example.com"
                  density="compact"
                  variant="outlined"
                  class="mb-2"
                  prepend-inner-icon="mdi-link"
                ></v-text-field>
                
                <v-textarea
                  v-if="field.type === 'description'"
                  v-model="field.content"
                  label="說明內容"
                  rows="3"
                  variant="outlined"
                  density="compact"
                ></v-textarea>

                <!-- System Field Specifics -->
                <div v-if="field.type === 'system'" class="bg-indigo-lighten-5 pa-3 rounded mb-3">
                  <div class="d-flex align-center mb-2">
                    <v-icon start size="small" color="indigo">mdi-information</v-icon>
                    <span class="text-caption text-indigo-darken-2 font-weight-bold">
                      系統欄位設定
                    </span>
                  </div>
                  <v-row dense>
                    <v-col cols="12">
                       <v-select
                        v-model="field.systemKey"
                        :items="systemKeyOptions"
                        label="綁定資料來源"
                        density="compact"
                        variant="outlined"
                        bg-color="white"
                      ></v-select>
                    </v-col>
                    <v-col cols="6">
                      <v-checkbox
                        v-model="field.autoFill"
                        label="自動帶入值"
                        density="compact"
                        hide-details
                        class="mt-0"
                      ></v-checkbox>
                    </v-col>
                     <v-col cols="6">
                      <v-checkbox
                        v-model="field.readOnly"
                        label="唯讀 (不可修改)"
                        density="compact"
                        hide-details
                         class="mt-0"
                      ></v-checkbox>
                    </v-col>
                     <v-col cols="12">
                      <v-text-field
                        v-model="field.placeholder"
                        label="提示文字 (Placeholder)"
                        density="compact"
                        variant="outlined"
                        bg-color="white"
                        hide-details
                      ></v-text-field>
                    </v-col>
                  </v-row>
                </div>

                <!-- Options Editor for Radio/Checkbox -->
                <div v-if="['radio', 'checkbox'].includes(field.type)" class="mt-2">
                 
                  <draggable 
                    v-model="field.options" 
                    item-key="id" 
                    handle=".option-drag"
                    animation="200"
                    class="d-flex flex-column w-100"
                  >
                    <template #item="{ element: option, index: optIndex }">
                      <div class="w-100 mb-2">
                        <div class="d-flex align-center">
                          <v-icon class="option-drag cursor-move mr-2 text-grey-lighten-1">mdi-drag</v-icon>
                          <!-- 透過 :key="option.id" 確保輸入時不會因 value 改變而重繪 -->
                          <v-text-field
                            v-model="option.label"
                            label="選項文字"
                            density="compact"
                            hide-details
                            variant="outlined"
                            class="flex-grow-1 mr-2"
                            @update:model-value="val => option.value = String(val)" 
                          ></v-text-field>
                          <v-btn icon variant="text" color="error" size="small" @click="removeOption(field, optIndex)">
                            <v-icon>mdi-close</v-icon>
                          </v-btn>
                        </div>
                        
                         <!-- Nested Sub-fields trigger -->
                         <!-- Nested Sub-fields trigger -->
                         <div class="ml-8 mt-1">
                            <v-btn 
                              v-if="!option.subFields"
                              size="x-small" 
                              variant="text" 
                              color="primary"
                              prepend-icon="mdi-plus"
                              @click="initSubFields(option)"
                            >
                            新增子欄位
                            </v-btn>
                            
                            <div v-else class="pl-3 border-s-md mt-2" style="border-color: #e0e0e0;">
                              <div class="d-flex justify-space-between align-center mb-1">
                                <span class="text-caption text-grey">子欄位 (當選中 "{{ option.label }}" 時顯示)</span>
                                <v-btn icon="mdi-delete" variant="text" size="x-small" color="error" @click="removeSubFields(option)"></v-btn>
                              </div>
                              <DynamicFieldEditor 
                                :fields="option.subFields"
                                :isNested="true"
                                @update:fields="(val) => { option.subFields = val; updateFields(); }"
                              />
                            </div>
                         </div>

                      </div>
                    </template>
                  </draggable>
                  <v-btn
                    variant="outlined"
                    size="small"
                    border
                    prepend-icon="mdi-plus"
                    class="mt-2"
                    block
                    @click="addOption(field)"
                  >
                    新增選項
                  </v-btn>
                </div>

              </v-card-text>
            </div>
          </v-expand-transition>
        </v-card>
      </template>
    </draggable>
    
    <div v-if="localFields.length === 0" class="text-center pa-8 border dashed rounded text-grey">
      <v-icon size="48" class="mb-2">mdi-form-select</v-icon>
      <p>點擊上方「新增元件」</p>
    </div>

    <!-- ✅ [新增] 調整順序 Dialog：精簡單行列表，拖曳距離短；手機全螢幕、桌機置中 -->
    <v-dialog
      v-model="reorderDialog"
      :fullscreen="isMobile"
      :max-width="isMobile ? undefined : 520"
      scrollable
      :transition="isMobile ? 'dialog-bottom-transition' : 'dialog-transition'"
    >
      <v-card>
        <v-toolbar color="primary" density="compact">
          <v-toolbar-title class="text-subtitle-1">
            <v-icon start size="small">mdi-swap-vertical</v-icon>調整欄位順序
          </v-toolbar-title>
          <v-spacer></v-spacer>
          <v-btn variant="text" class="font-weight-bold" @click="reorderDialog = false">完成</v-btn>
        </v-toolbar>
        <v-card-text class="pa-2">
          <div class="text-caption text-grey px-2 pb-2 d-flex align-center">
            <v-icon size="x-small" class="mr-1">mdi-information-outline</v-icon>
            拖曳 <v-icon size="x-small" class="mx-1">mdi-drag</v-icon> 或點箭頭調整位置，變更即時生效
          </div>
          <draggable
            v-model="localFields"
            item-key="id"
            handle=".reorder-drag"
            animation="200"
            ghost-class="reorder-ghost"
          >
            <template #item="{ element: field, index }">
              <div class="reorder-row d-flex align-center px-1">
                <v-icon class="reorder-drag cursor-move text-grey-darken-1 pa-4">mdi-drag</v-icon>
                <span class="reorder-index text-caption text-grey mr-2">{{ index + 1 }}</span>
                <v-icon v-if="field.type === 'system'" color="indigo" size="x-small" class="mr-1">mdi-database</v-icon>
                <v-icon v-else-if="['header', 'description', 'divider'].includes(field.type)" color="grey-darken-2" size="x-small" class="mr-1">mdi-view-dashboard-outline</v-icon>
                <div class="flex-grow-1 text-truncate">
                  <span class="text-body-2">{{ field.label || '未命名欄位' }}</span>
                  <span class="text-caption text-grey ml-1 d-none d-sm-inline">{{ getFieldTypeName(field) }}</span>
                </div>
                <!-- 移到最頂/最底：桌機顯示；手機以短距離拖曳取代 -->
                <v-btn icon variant="text" size="small" density="comfortable" class="d-none d-sm-inline-flex" :disabled="index === 0" @click="moveFieldTo(index, 'top')" title="移到最上面">
                  <v-icon size="small">mdi-chevron-double-up</v-icon>
                </v-btn>
                <v-btn icon variant="text" size="small" density="comfortable" :disabled="index === 0" @click="moveField(index, -1)" title="上移一格">
                  <v-icon size="small">mdi-chevron-up</v-icon>
                </v-btn>
                <v-btn icon variant="text" size="small" density="comfortable" :disabled="index === localFields.length - 1" @click="moveField(index, 1)" title="下移一格">
                  <v-icon size="small">mdi-chevron-down</v-icon>
                </v-btn>
                <v-btn icon variant="text" size="small" density="comfortable" class="d-none d-sm-inline-flex" :disabled="index === localFields.length - 1" @click="moveFieldTo(index, 'bottom')" title="移到最下面">
                  <v-icon size="small">mdi-chevron-double-down</v-icon>
                </v-btn>
              </div>
            </template>
          </draggable>
        </v-card-text>
      </v-card>
    </v-dialog>

  </div>
</template>

<script setup lang="ts">
import { ref, watch, computed, nextTick } from 'vue';
import { useDisplay } from 'vuetify';

// Use native browser UUID generator to avoid 'stream' module issues with uuid package
const uuidv4 = () => crypto.randomUUID();
import draggable from 'vuedraggable';

export interface DynamicField {
  id: string;
  type: string;
  label: string;
  required?: boolean;
  placeholder?: string;
  hint?: string; // Added hint support
  content?: string; // For description
  url?: string; // For url
  options?: FieldOption[];
  systemKey?: string;
  autoFill?: boolean;
  readOnly?: boolean;
  expanded?: boolean;
}

export interface FieldOption {
  id: string; // ✅ Added unique ID for draggable key
  label: string;
  value: string;
  subFields?: DynamicField[];
}

const props = defineProps<{
  fields: DynamicField[];
  allowSystemFields?: boolean;
  isNested?: boolean;
}>();

const emit = defineEmits(['update:fields']);

const localFields = ref<DynamicField[]>([]);

// Initialize fields ensuring options have IDs, WITHOUT mutating props
const initializeFields = (fields: DynamicField[]) => {
  if (!fields || !Array.isArray(fields)) return [];
  // Deep clone to avoid mutation of props and return new structure with ensured IDs
  return fields.map(field => {
    const newField = { ...field }; // Shallow copy field
    if (newField.options) {
      newField.options = newField.options.map(opt => ({
        ...opt,
        id: opt.id || uuidv4() // Ensure ID exists without mutating original if possible (though map creates new array)
      }));
    }
    return newField;
  });
};

localFields.value = initializeFields(props.fields);

watch(() => props.fields, (newVal) => {
  const processedNewVal = initializeFields(newVal);
  // Deep compare using JSON stringify to avoid recursive updates if content is identical
  // (ignoring minor object reference changes from parent)
  if (JSON.stringify(processedNewVal) !== JSON.stringify(localFields.value)) {
    localFields.value = processedNewVal;
  }
}, { deep: true });

// Initial emit ensures parent gets initial structure with IDs if needed
// updateFields(); // No, don't emit on mount, might trigger form dirty check prematurely

// Watch localFields deeply to emit changes
watch(localFields, () => {
  emit('update:fields', localFields.value);
}, { deep: true });

const updateFields = () => {
  // Emit event, but do not update localFields again here immediately if watcher handles it
  // The emit will cause parent to update prop, triggering watcher.
  emit('update:fields', localFields.value);
};

// ✅ [新增] 排序輔助：調整順序 Dialog、全部收合/展開、上下移
const { mobile } = useDisplay();
const isMobile = computed(() => mobile.value);
const reorderDialog = ref(false);

// expanded 預設 undefined 視為展開（v-show="field.expanded !== false"）
const allCollapsed = computed(() =>
  localFields.value.length > 0 && localFields.value.every(f => f.expanded === false)
);

const toggleCollapseAll = () => {
  const target = allCollapsed.value; // 全收合 → 展開；否則收合
  localFields.value.forEach(f => { f.expanded = target; });
};

const moveField = (index: number, delta: number) => {
  const to = index + delta;
  if (to < 0 || to >= localFields.value.length) return;
  const [item] = localFields.value.splice(index, 1);
  localFields.value.splice(to, 0, item);
};

const moveFieldTo = (index: number, position: 'top' | 'bottom') => {
  const [item] = localFields.value.splice(index, 1);
  if (position === 'top') localFields.value.unshift(item);
  else localFields.value.push(item);
};

// 新增元件後捲動至該卡片（列表很長時，新元件加在底部容易「看不到」）
const scrollToField = (id: string) => {
  nextTick(() => {
    document.getElementById(`field-card-${id}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  });
};

const systemKeyOptions = [
  { title: '戶別', value: 'unitId' },
  { title: '買方姓名', value: 'buyerName' },
  { title: '買方電話', value: 'buyerPhone' },
  { title: '買方戶籍地址', value: 'buyerAddress' },
  { title: '身分證字號', value: 'buyerIdNumber' },
  // ✅ [新增] 客戶資料卡導入銷控：EMAIL / 出生年月日 / 通訊地址（對應 salesHouseholds 欄位）
  { title: 'EMAIL', value: 'buyerEmail' },
  { title: '出生年月日', value: 'buyerDateOfBirth' },
  { title: '買方通訊地址', value: 'buyerMailingAddress' },
  { title: '銷售人員', value: 'salesPerson' },
];

const getFieldTypeName = (field: DynamicField) => {
  if (field.type === 'system') return '系統自動帶入';
  const typeMap: Record<string, string> = {
    text: '單行文字',
    textarea: '多行文字',
    radio: '單選',
    checkbox: '多選',
    date: '日期',
    header: '標題',
    description: '說明',
    divider: '分隔線',
    link: '超連結',
    phone: '電話',
    address: '地址'
  };
  return typeMap[field.type] || field.type;
};

const addField = (type: string) => {
  const newField: DynamicField = {
    id: uuidv4(),
    type: type as any,
    label: type === 'divider' ? '分隔線' : (type === 'header' ? '新標題' : (type === 'link' ? '點擊前往' : '新欄位')),
    required: false,
    expanded: true
  };
  
  if (type === 'link') {
    newField.url = ''; 
  }

  if (['radio', 'checkbox'].includes(type)) {
    newField.options = [{ id: uuidv4(), label: '選項 1', value: '選項 1', subFields: [] }];
  }

  localFields.value.push(newField);
  scrollToField(newField.id);
  // updateFields();
};

const addSystemField = (key: string) => {
  const option = systemKeyOptions.find(o => o.value === key);
  const newField: DynamicField = {
    id: uuidv4(),
    type: 'system',
    label: option?.title || '系統欄位',
    systemKey: key,
    required: true,
    autoFill: true,
    readOnly: true,
    placeholder: '',
    expanded: true
  };
  localFields.value.push(newField);
  scrollToField(newField.id);
  // updateFields(); // handled by watcher now
};

const removeField = (index: number) => {
  localFields.value.splice(index, 1);
  // updateFields();
};

const addOption = (field: DynamicField) => {
  if (!field.options) field.options = [];
  field.options.push({
    id: uuidv4(), // ✅ Generate ID
    label: '新選項',
    value: '新選項',
    subFields: []
  });
  // updateFields(); // Ensure deep reactivity triggers update if needed
};

const removeOption = (field: DynamicField, index: number) => {
  if (field.options) {
    field.options.splice(index, 1);
    // updateFields();
  }
};

const initSubFields = (option: FieldOption) => {
  if (!option.subFields) option.subFields = [];
  // updateFields();
};

const removeSubFields = (option: FieldOption) => {
  delete option.subFields;
  // updateFields();
};

</script>

<style scoped>
.field-card {
  border-left: 4px solid #BDBDBD !important;
  transition: box-shadow 0.2s;
}
.field-card:hover {
  box-shadow: 0 4px 8px rgba(0,0,0,0.1) !important;
}
.system-field {
  border-left-color: #3F51B5 !important;
}
.layout-field {
  border-left-color: #757575 !important;
  background-color: #FAFAFA;
}

.cursor-move {
  cursor: move;
  cursor: grab;
}
/* ✅ 拖曳把手：阻止觸控時觸發頁面捲動（手機拖曳穩定的關鍵），並放大觸控範圍 */
.drag-handle,
.reorder-drag {
  touch-action: none;
}
.drag-handle {
  padding: 8px 4px;
  margin: -8px 0 -8px -4px;
}
/* ✅ 工具列按鈕換行時保持間距 */
.toolbar-gap {
  gap: 8px 4px;
}
/* ✅ 調整順序 Dialog 列 */
.reorder-row {
  min-height: 44px;
  border-bottom: 1px solid #f0f0f0;
  background: #fff;
}
.reorder-row:last-child {
  border-bottom: none;
}
.reorder-index {
  min-width: 20px;
  text-align: right;
}
.reorder-ghost {
  opacity: 0.5;
  background: #E3F2FD;
}
.rotate-180 {
  transform: rotate(180deg);
  transition: transform 0.2s;
}
.z-index-10 {
  z-index: 10;
}
.position-sticky {
  position: sticky;
}
.border-b {
  border-bottom: 1px solid rgba(0, 0, 0, 0.12);
}
</style>
