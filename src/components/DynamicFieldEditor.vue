<template>
  <div class="dynamic-field-editor">
    <draggable 
      v-model="localFields" 
      item-key="id"
      handle=".drag-handle"
      @end="updateFields"
    >
      <template #item="{ element: field, index }">
        <v-card variant="outlined" class="mb-3 field-card">
          <v-card-text class="pa-3">
            <div class="d-flex align-center mb-2">
              <v-btn icon variant="text" size="small" class="drag-handle cursor-move mr-2">
                <v-icon>mdi-drag</v-icon>
              </v-btn>
              
              <v-select
                v-model="field.type"
                :items="fieldTypes"
                label="欄位類型"
                density="compact"
                hide-details
                variant="outlined"
                class="mr-2"
                style="max-width: 150px"
              ></v-select>

              <v-text-field
                v-model="field.label"
                label="欄位標題"
                density="compact"
                hide-details
                variant="outlined"
                class="flex-grow-1 mr-2"
              ></v-text-field>

              <v-switch
                v-model="field.required"
                color="error"
                label="必填"
                hide-details
                density="compact"
                class="mr-2 flex-shrink-0"
              ></v-switch>

              <v-btn icon variant="text" color="error" size="small" @click="removeField(index)">
                <v-icon>mdi-delete</v-icon>
              </v-btn>
            </div>
            
             <v-text-field
                v-if="field.type === 'text'"
                v-model="field.placeholder"
                label="提示文字 (Placeholder)"
                density="compact"
                hide-details
                variant="outlined"
                class="mb-2 ml-10"
              ></v-text-field>

            <!-- Options Editor for Radio/Checkbox -->
            <div v-if="['radio', 'checkbox'].includes(field.type)" class="ml-10 mt-2">
              <div class="text-caption text-grey mb-1">選項設定</div>
              <v-sheet border rounded class="pa-2 bg-grey-lighten-5">
                <div v-for="(option, optIndex) in field.options" :key="optIndex" class="mb-2">
                  <div class="d-flex align-center">
                    <v-text-field
                      v-model="option.label"
                      label="選項文字"
                      density="compact"
                      hide-details
                      variant="outlined"
                      class="flex-grow-1 mr-2 bg-white"
                      @update:model-value="val => option.value = String(val)" 
                    ></v-text-field>
                    <v-btn icon variant="text" color="error" size="small" @click="removeOption(field, Number(optIndex))">
                      <v-icon>mdi-close</v-icon>
                    </v-btn>
                  </div>
                  
                  <!-- Nested Child Fields -->
                  <div class="ml-4 mt-2 border-l-2 pl-2" style="border-color: #e0e0e0 !important;">
                    <div class="d-flex align-center mb-1">
                      <div class="text-caption text-primary font-weight-bold">
                        當選擇「{{ option.label || '此選項' }}」時顯示的額外欄位：
                      </div>
                      <v-spacer></v-spacer>
                      <v-btn 
                        size="x-small" 
                        variant="tonal" 
                        color="primary" 
                        prepend-icon="mdi-plus"
                        @click="addSubField(option)"
                      >新増子欄位</v-btn>
                    </div>
                    
                    <div v-if="option.subFields && option.subFields.length > 0">
                       <!-- Recursive Call -->
                       <DynamicFieldEditor 
                          v-model:fields="option.subFields"
                        />
                    </div>
                    <div v-else class="text-caption text-grey font-italic mb-2">
                      無子欄位
                    </div>
                  </div>
                </div>

                <v-btn
                  block
                  variant="outlined"
                  size="small"
                  border
                  prepend-icon="mdi-plus"
                  class="mt-2 bg-white"
                  @click="addOption(field)"
                >
                  新增選項
                </v-btn>
              </v-sheet>
            </div>

          </v-card-text>
        </v-card>
      </template>
    </draggable>

    <v-btn
      color="primary"
      variant="tonal"
      block
      prepend-icon="mdi-plus-box"
      @click="addField"
    >
      新增欄位
    </v-btn>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import { v4 as uuidv4 } from 'uuid';
import draggable from 'vuedraggable';

// --- Type Definitions ---
// Exporting types so parent can use them if needed (though Vue handles props mostly)
export interface DynamicField {
  id: string;
  type: 'radio' | 'checkbox' | 'text';
  label: string;
  required: boolean;
  placeholder?: string;
  options?: FieldOption[];
}

export interface FieldOption {
  label: string;
  value: string;
  subFields?: DynamicField[];
}

const props = defineProps<{
  fields: DynamicField[];
}>();

const emit = defineEmits(['update:fields']);

// Create a local copy to avoid mutating props directly (though for arrays/objects it works by ref, standard practice is to emit updates)
const localFields = ref<DynamicField[]>(props.fields || []);

watch(() => props.fields, (newVal) => {
  localFields.value = newVal || [];
}, { deep: true });

const updateFields = () => {
  emit('update:fields', localFields.value);
};

const fieldTypes = [
  { title: '單選 (Radio)', value: 'radio' },
  { title: '複選 (Checkbox)', value: 'checkbox' },
  { title: '文字輸入 (Text)', value: 'text' },
  { title: '電話 (Phone)', value: 'phone' },
  { title: '日期 (Date)', value: 'date' },
];

const addField = () => {
  localFields.value.push({
    id: uuidv4(),
    type: 'radio',
    label: '新欄位',
    required: false,
    options: [
      { label: '選項 1', value: '選項 1', subFields: [] }
    ]
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
    label: '新選項',
    value: '新選項',
    subFields: []
  });
};

const removeOption = (field: DynamicField, index: number) => {
  if (field.options) {
    field.options.splice(index, 1);
  }
};

const addSubField = (option: FieldOption) => {
  if (!option.subFields) option.subFields = [];
  option.subFields.push({
    id: uuidv4(),
    type: 'text',
    label: '補充資訊',
    required: true,
  });
};

</script>

<style scoped>
.field-card {
  border-left: 4px solid #1976D2 !important;
}
.cursor-move {
  cursor: move;
}
</style>
