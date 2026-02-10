<template>
  <div class="dynamic-field-render-item py-2">
    <!-- Header / Description / Divider -->
    <div v-if="field.type === 'header'" class="d-flex align-center mt-6 mb-3">
       <div class="rounded-pill bg-primary mr-3" style="width: 4px; height: 24px;"></div>
       <h3 class="text-h6 font-weight-bold text-grey-darken-3">{{ field.label }}</h3>
    </div>
    
    <div v-else-if="field.type === 'description'" class="text-body-1 text-grey-darken-1 mb-5 bg-grey-lighten-4 pa-4 rounded-lg" style="white-space: pre-line; line-height: 1.6;">
      {{ field.content }}
    </div>
    
    <v-divider v-else-if="field.type === 'divider'" class="my-6 border-opacity-25" color="primary"></v-divider>
    
    <!-- Link Field -->
    <div v-else-if="field.type === 'link'" class="mb-4">
      <div class="d-flex align-center">
        <v-icon color="primary" class="mr-2">mdi-link-variant</v-icon>
        <a 
          :href="field.url" 
          target="_blank" 
          rel="noopener noreferrer" 
          class="text-body-1 font-weight-bold text-primary text-decoration-underline"
        >
          {{ field.label || field.url }}
        </a>
      </div>
    </div>

    <!-- System Field -->
    <template v-else-if="field.type === 'system'">
      <v-text-field
        :model-value="modelValue"
        @update:model-value="$emit('update:modelValue', $event)"
        :label="field.label"
        variant="outlined"
        :placeholder="field.placeholder"
        density="comfortable"
        :readonly="field.readOnly"
        :rules="field.required ? [v => !!v || `必填`] : []"
        :hint="field.hint || (field.readOnly ? '系統自動帶入' : '')"
        persistent-hint
        persistent-placeholder
        :bg-color="field.readOnly ? 'grey-lighten-4' : undefined"
        class="input-premium"
      >
        <template v-slot:prepend-inner>
          <v-icon v-if="field.readOnly" color="indigo">mdi-lock-outline</v-icon>
        </template>
      </v-text-field>
    </template>

    <!-- Address Field -->
    <div v-else-if="field.type === 'address'" class="pa-4 bg-grey-lighten-5 rounded-lg border-thin">
       <div class="text-subtitle-1 font-weight-bold mb-3 d-flex align-center text-primary">
         <v-icon start class="mr-2">mdi-map-marker-radius</v-icon>
         {{ field.label }} 
         <span v-if="field.required" class="text-error ml-1">*</span>
       </div>
       <v-row dense>
         <v-col cols="12" sm="6">
           <v-select
             :model-value="modelValue?.city"
             @update:model-value="(val) => updateAddress('city', val)"
             :items="cityOptions"
             label="縣市"
             variant="outlined"
             color="primary"
             density="comfortable"
             :rules="field.required ? [v => !!v || '請選擇縣市'] : []"
             class="input-premium"
             :hint="field.hint"
             persistent-hint
           ></v-select>
         </v-col>
         <v-col cols="12" sm="6">
           <v-select
             :model-value="modelValue?.district"
             @update:model-value="(val) => updateAddress('district', val)"
             :items="getDistricts(modelValue?.city)"
             label="鄉鎮市區"
             variant="outlined"
             color="primary"
             density="comfortable"
             :rules="field.required ? [v => !!v || '請選擇區域'] : []"
             :disabled="!modelValue?.city"
             class="input-premium"
             :hint="field.hint"
             persistent-hint
           ></v-select>
         </v-col>
         <v-col cols="12">
           <v-text-field
             :model-value="modelValue?.detail"
             @update:model-value="(val) => updateAddress('detail', val)"
             label="詳細地址"
             :placeholder="field.placeholder || '街道、巷弄、樓層'"
             variant="outlined"
             color="primary"
             density="comfortable"
             :rules="field.required ? [v => !!v || '請輸入詳細地址'] : []"
             class="input-premium"
             :hint="field.hint"
             persistent-hint
           ></v-text-field>
         </v-col>
       </v-row>
    </div>

    <!-- Standard Inputs -->
    <template v-else>
      <v-text-field
        v-if="['text', 'phone'].includes(field.type)"
        :model-value="modelValue"
        @update:model-value="$emit('update:modelValue', $event)"
        :label="field.label"
        :placeholder="field.placeholder"
        variant="outlined"
        color="primary"
        density="comfortable"
        :rules="field.required ? [v => !!v || '必填'] : []"
        :type="field.type === 'phone' ? 'tel' : 'text'"
        class="input-premium"
        :hint="field.hint"
        persistent-hint
      ></v-text-field>

      <v-textarea
        v-if="field.type === 'textarea'"
        :model-value="modelValue"
        @update:model-value="$emit('update:modelValue', $event)"
        :label="field.label"
        :placeholder="field.placeholder"
        variant="outlined"
        color="primary"
        density="comfortable"
        rows="3"
        auto-grow
        :rules="field.required ? [v => !!v || '此欄位必填'] : []"
        class="input-premium"
        :hint="field.hint"
        persistent-hint
      ></v-textarea>

      <v-text-field
        v-if="field.type === 'date'"
        :model-value="modelValue"
        @update:model-value="$emit('update:modelValue', $event)"
        :label="field.label"
        type="date"
        variant="outlined"
        color="primary"
        density="comfortable"
        :rules="field.required ? [v => !!v || '請選擇日期'] : []"
        class="input-premium"
        :hint="field.hint"
        persistent-hint
      ></v-text-field>

       <!-- Radio / Checkbox -->
       <div v-if="['radio', 'checkbox'].includes(field.type)">
         <div class="text-subtitle-1 font-weight-bold mb-3 d-flex align-center">
            {{ field.label }} 
            <span v-if="field.required" class="text-error ml-1">*</span>
         </div>
        
        <v-radio-group
          v-if="field.type === 'radio'"
          :model-value="modelValue"
          @update:model-value="$emit('update:modelValue', $event)"
          :rules="field.required ? [v => !!v || '請選擇一個項目'] : []"
          class="custom-radio-group"
          :hint="field.hint"
          persistent-hint
        >
          <template v-for="opt in field.options" :key="opt.value">
            <v-radio
              :label="opt.label"
              :value="opt.value"
              color="primary"
              class="mb-1 option-item"
            ></v-radio>

            <!-- Inline Sub-fields for Radio -->
            <v-expand-transition>
              <div 
                v-if="modelValue === opt.value && opt.subFields && opt.subFields.length > 0"
                class="ml-8 mt-1 mb-2 pa-4 bg-indigo-lighten-5 rounded-lg position-relative subfield-container"
              >
                 <div class="subfield-indicator"></div>
                 <div class="text-caption text-indigo mb-2 font-weight-bold">
                   <v-icon size="small" start>mdi-arrow-right-bottom</v-icon>
                   {{ opt.label }}
                 </div>
                 
                 <div v-for="subf in opt.subFields" :key="subf.id">
                    <FormRenderItem
                       :field="subf"
                       :model-value="formData[subf.id]"
                       @update:model-value="(val) => updateSubField(subf.id, val)"
                       :formData="formData"
                       :preview="preview"
                    />
                 </div>
              </div>
            </v-expand-transition>
          </template>
        </v-radio-group>
        
         <div v-if="field.type === 'checkbox'" class="d-flex flex-column gap-2">
            <template v-for="(opt, index) in field.options" :key="opt.value">
              <v-checkbox
                :model-value="modelValue"
                @update:model-value="$emit('update:modelValue', $event)"
                :label="opt.label"
                :value="opt.value"
                color="primary"
                multiple
                hide-details
                density="comfortable"
                class="mb-1 option-item"
                :hint="index === field.options.length - 1 ? field.hint : undefined"
                :persistent-hint="index === field.options.length - 1"
              ></v-checkbox>

              <!-- Inline Sub-fields for Checkbox -->
              <v-expand-transition>
                <div 
                  v-if="Array.isArray(modelValue) && modelValue.includes(opt.value) && opt.subFields && opt.subFields.length > 0"
                  class="ml-8 mt-1 mb-2 pa-4 bg-indigo-lighten-5 rounded-lg position-relative subfield-container"
                >
                   <div class="subfield-indicator"></div>
                   <div class="text-caption text-indigo mb-2 font-weight-bold">
                     <v-icon size="small" start>mdi-arrow-right-bottom</v-icon>
                     {{ opt.label }}
                   </div>
                   
                   <div v-for="subf in opt.subFields" :key="subf.id">
                      <FormRenderItem
                         :field="subf"
                         :model-value="formData[subf.id]"
                         @update:model-value="(val) => updateSubField(subf.id, val)"
                         :formData="formData"
                         :preview="preview"
                      />
                   </div>
                </div>
              </v-expand-transition>
            </template>
         </div>
         <div v-if="field.type === 'checkbox' && field.hint" class="v-messages px-4 text-caption text-medium-emphasis">
            {{ field.hint }}
         </div>
       </div>

    </template>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import TwCities from '@/assets/TwCities.json';

const props = defineProps<{
  field: any;
  modelValue: any;
  formData: any; // Passed down to access subfield data binding
  preview?: boolean;
}>();

const emit = defineEmits(['update:modelValue', 'updateFormData']);

// Address Helpers
const cityOptions = computed(() => TwCities.map(c => c.name));
const getDistricts = (cityName: string) => {
  if (!cityName) return [];
  const city = TwCities.find(c => c.name === cityName);
  return city ? city.districts.map(d => d.name) : [];
};

const updateAddress = (key: string, value: any) => {
  const newVal = { ...(props.modelValue || { city: null, district: null, detail: '' }), [key]: value };
  if (key === 'city') newVal.district = null;
  emit('update:modelValue', newVal);
};

const updateSubField = (id: string, value: any) => {
  props.formData[id] = value;
};

// Helper: Check if any subfield should be visible (for transition wrapper)
const hasActiveSubFields = () => {
    if (!props.field.options) return false;
    return props.field.options.some((opt: any) => {
        const isSelected = (props.field.type === 'radio' && props.modelValue === opt.value) ||
                           (props.field.type === 'checkbox' && Array.isArray(props.modelValue) && props.modelValue.includes(opt.value));
        return isSelected && opt.subFields && opt.subFields.length > 0;
    });
};
</script>

<style scoped>
.input-premium :deep(.v-field__outline) {
  transition: all 0.3s ease;
}
.input-premium:hover :deep(.v-field__outline) {
  --v-field-border-opacity: 0.6;
}
.input-premium:focus-within :deep(.v-field__outline) {
  --v-field-border-opacity: 1;
  box-shadow: 0 4px 12px rgba(var(--v-theme-primary), 0.15);
}

.subfield-container {
  border-left: 4px solid rgb(var(--v-theme-primary));
  transition: all 0.3s ease;
  animation: slideIn 0.3s ease-out;
}

@keyframes slideIn {
  from { opacity: 0; transform: translateY(-10px); }
  to { opacity: 1; transform: translateY(0); }
}

.option-item {
  transition: background-color 0.2s;
  border-radius: 8px;
}
.option-item:hover {
  background-color: rgb(var(--v-theme-grey-lighten-4));
}
</style>
