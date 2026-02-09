<template>
  <div class="dynamic-field-editor">
    <div class="d-flex align-center mb-4 bg-white py-2" :class="{ 'position-sticky top-0 z-index-10 border-b': !isNested }">
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
          <v-list-item @click="addField('address')" prepend-icon="mdi-map-marker-radius" title="地址 (台灣縣市選單)"></v-list-item>
          
          <v-divider class="my-2"></v-divider>
          <v-list-subheader>版面元件</v-list-subheader>
          <v-list-item @click="addField('header')" prepend-icon="mdi-format-header-1" title="標題"></v-list-item>
          <v-list-item @click="addField('description')" prepend-icon="mdi-text" title="說明文字"></v-list-item>
          <v-list-item @click="addField('divider')" prepend-icon="mdi-minus" title="分隔線"></v-list-item>
          <v-list-item @click="addField('link')" prepend-icon="mdi-link" title="插入連結"></v-list-item>

          <template v-if="allowSystemFields">
            <v-divider class="my-2"></v-divider>
            <v-list-subheader>系統欄位 (自動帶入)</v-list-subheader>
            <v-list-item @click="addSystemField('unitId')" prepend-icon="mdi-home" title="戶別 (Unit ID)"></v-list-item>
            <v-list-item @click="addSystemField('buyerName')" prepend-icon="mdi-account" title="買方姓名"></v-list-item>
            <v-list-item @click="addSystemField('buyerPhone')" prepend-icon="mdi-phone" title="買方電話"></v-list-item>
            <v-list-item @click="addSystemField('buyerAddress')" prepend-icon="mdi-map-marker" title="買方地址"></v-list-item>
             <v-list-item @click="addSystemField('salesPerson')" prepend-icon="mdi-badge-account" title="銷售人員"></v-list-item>
          </template>
        </v-list>
      </v-menu>
      
      <v-spacer></v-spacer>
      <div class="text-caption text-grey">
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

            <v-chip size="x-small" class="mr-2" variant="tonal">
              {{ getFieldTypeName(field) }}
            </v-chip>

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

                 <v-text-field
                  v-if="['text', 'textarea', 'phone'].includes(field.type)"
                  v-model="field.placeholder"
                  label="提示文字 (Placeholder)"
                  density="compact"
                  variant="outlined"
                  class="mb-2"
                ></v-text-field>

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
                        v-model="field.hint"
                        label="提示文字 (Hint)"
                        placeholder="例如: 請確認資料是否正確"
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
                  <div class="text-subtitle-2 mb-2">選項設定</div>
                  <draggable 
                    v-model="field.options" 
                    item-key="id" 
                    handle=".option-drag"
                    class="v-row dense"
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
                              啟用關聯子欄位
                            </v-btn>
                            
                            <div v-else class="pl-3 border-s-md mt-2" style="border-color: #e0e0e0;">
                              <div class="d-flex justify-space-between align-center mb-1">
                                <span class="text-caption text-grey">關聯欄位 (當選中 "{{ option.label }}" 時顯示)</span>
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
      <p>點擊上方「新增元件」按鈕開始設計表單</p>
    </div>

  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';

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
  if (!fields) return [];
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

const updateFields = () => {
  // Emit event, but do not update localFields again here immediately if watcher handles it
  // The emit will cause parent to update prop, triggering watcher.
  emit('update:fields', localFields.value);
};

const systemKeyOptions = [
  { title: '戶別 (Unit ID)', value: 'unitId' },
  { title: '買方姓名', value: 'buyerName' },
  { title: '買方電話', value: 'buyerPhone' },
  { title: '買方地址 (戶籍)', value: 'buyerAddress' },
  { title: '身分證字號', value: 'buyerIdNumber' },
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
  updateFields();
};

const addSystemField = (key: string) => {
  const option = systemKeyOptions.find(o => o.value === key);
  localFields.value.push({
    id: uuidv4(),
    type: 'system',
    label: option?.title || '系統欄位',
    systemKey: key,
    required: true,
    autoFill: true,
    readOnly: true,
    expanded: true
  });
  updateFields();
};

const removeField = (index: number) => {
  localFields.value.splice(index, 1);
  updateFields();
};

const addOption = (field: DynamicField) => {
  if (!field.options) field.options = [];
  field.options.push({
    id: uuidv4(), // ✅ Generate ID
    label: '新選項',
    value: '新選項',
    subFields: []
  });
  updateFields(); // Ensure deep reactivity triggers update if needed
};

const removeOption = (field: DynamicField, index: number) => {
  if (field.options) {
    field.options.splice(index, 1);
    updateFields();
  }
};

const initSubFields = (option: FieldOption) => {
  if (!option.subFields) option.subFields = [];
  updateFields();
};

const removeSubFields = (option: FieldOption) => {
  option.subFields = undefined;
  updateFields();
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
