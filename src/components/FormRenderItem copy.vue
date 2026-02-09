<template>
  <div class="dynamic-field-render-item">
    <!-- Header / Description / Divider -->
    <div v-if="field.type === 'header'" class="text-h6 font-weight-bold mt-4 mb-2 text-primary">
      {{ field.label }}
    </div>
    <div v-else-if="field.type === 'description'" class="text-body-2 text-grey-darken-1 mb-4">
      {{ field.content }}
    </div>
    <v-divider v-else-if="field.type === 'divider'" class="my-4"></v-divider>

    <!-- System Field -->
    <template v-else-if="field.type === 'system'">
      <v-text-field
        :model-value="modelValue"
        @update:model-value="$emit('update:modelValue', $event)"
        :label="field.label"
        variant="outlined"
        density="comfortable"
        :readonly="field.readOnly"
        :rules="field.required ? [v => !!v || `${field.label} 為必填`] : []"
        :hint="field.hint || (field.readOnly ? '系統自動帶入' : '')"
        persistent-hint
        :bg-color="field.readOnly ? 'grey-lighten-4' : undefined"
        :disabled="preview"
      ></v-text-field>
    </template>

    <!-- Address Field -->
    <div v-else-if="field.type === 'address'">
       <div class="text-subtitle-1 mb-2">{{ field.label }} <span v-if="field.required" class="text-error">*</span></div>
       <v-row dense>
         <v-col cols="6">
           <v-select
             :model-value="modelValue?.city"
             @update:model-value="(val) => updateAddress('city', val)"
             :items="cityOptions"
             label="縣市"
             variant="outlined"
             density="comfortable"
             :rules="field.required ? [v => !!v || '請選擇縣市'] : []"
           ></v-select>
         </v-col>
         <v-col cols="6">
           <v-select
             :model-value="modelValue?.district"
             @update:model-value="(val) => updateAddress('district', val)"
             :items="getDistricts(modelValue?.city)"
             label="鄉鎮市區"
             variant="outlined"
             density="comfortable"
             :rules="field.required ? [v => !!v || '請選擇區域'] : []"
             :disabled="!modelValue?.city"
             no-data-text="請先選擇縣市"
           ></v-select>
         </v-col>
         <v-col cols="12">
           <v-text-field
             :model-value="modelValue?.detail"
             @update:model-value="(val) => updateAddress('detail', val)"
             label="詳細地址"
             :placeholder="field.placeholder || '街道、巷弄、樓層'"
             variant="outlined"
             density="comfortable"
             :rules="field.required ? [v => !!v || '請輸入詳細地址'] : []"
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
        :rules="field.required ? [v => !!v || '此欄位必填'] : []"
        :type="field.type === 'phone' ? 'tel' : 'text'"
      ></v-text-field>

      <v-textarea
        v-if="field.type === 'textarea'"
        :model-value="modelValue"
        @update:model-value="$emit('update:modelValue', $event)"
        :label="field.label"
        :placeholder="field.placeholder"
        variant="outlined"
        :rules="field.required ? [v => !!v || '此欄位必填'] : []"
      ></v-textarea>

      <v-text-field
        v-if="field.type === 'date'"
        :model-value="modelValue"
        @update:model-value="$emit('update:modelValue', $event)"
        :label="field.label"
        type="date"
        variant="outlined"
        :rules="field.required ? [v => !!v || '請選擇日期'] : []"
      ></v-text-field>

      <!-- Radio / Checkbox -->
       <div v-if="['radio', 'checkbox'].includes(field.type)">
        <div class="text-subtitle-1 mb-2">{{ field.label }} <span v-if="field.required" class="text-error">*</span></div>
        
        <v-radio-group
          v-if="field.type === 'radio'"
          :model-value="modelValue"
          @update:model-value="$emit('update:modelValue', $event)"
          :rules="field.required ? [v => !!v || '請選擇一個項目'] : []"
        >
          <v-radio
            v-for="opt in field.options"
            :key="opt.value"
            :label="opt.label"
            :value="opt.value"
          ></v-radio>
        </v-radio-group>
        
         <div v-if="field.type === 'checkbox'">
            <v-checkbox
              v-for="opt in field.options"
              :key="opt.value"
              :model-value="modelValue"
              @update:model-value="$emit('update:modelValue', $event)"
              :label="opt.label"
              :value="opt.value"
              multiple
              hide-details
              density="compact"
            ></v-checkbox>
         </div>

         <!-- Sub-fields Logic (Recursive) -->
          <template v-for="opt in field.options" :key="opt.value + '_sub'">
            <div 
              v-if="(
                (field.type === 'radio' && modelValue === opt.value) ||
                (field.type === 'checkbox' && Array.isArray(modelValue) && modelValue.includes(opt.value))
              ) && opt.subFields && opt.subFields.length > 0"
              class="ml-4 mt-2 pa-3 bg-grey-lighten-4 rounded"
            >
              <div v-for="subf in opt.subFields" :key="subf.id">
                 <!-- Recursive Self Usage for Subfield -->
                 <!-- Note: Since we are in a separate component file, we can use <FormRenderItem> recursively -->
                 <FormRenderItem
                    :field="subf"
                    :model-value="formData[subf.id]"
                    @update:model-value="(val) => updateSubField(subf.id, val)"
                    :formData="formData"
                    :preview="preview"
                 />
              </div>
            </div>
          </template>
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
  // We need to mutate the formData object directly or emit an event that parent handles
  // Since formData prop is object, mutation works, but cleaner to emit
  // But for deep recursion, passing the whole formData object allows easy access
  props.formData[id] = value;
};
</script>
