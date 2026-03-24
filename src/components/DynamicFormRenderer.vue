<template>
  <div class="dynamic-form-renderer">
    <div v-for="field in fields" :key="field.id" class="mb-4">
      
      <!-- Text Input -->
      <template v-if="field.type === 'text'">
         <v-text-field
            v-model="internalModel[field.id]"
            :label="field.label"
            :placeholder="field.placeholder"
            :rules="field.required ? [v => !!v || '此欄位為必填'] : []"
            :hint="field.hint"
            :persistent-hint="!!field.hint"
            variant="outlined"
            density="comfortable"
         ></v-text-field>
      </template>

      <!-- Textarea Input -->
      <template v-else-if="field.type === 'textarea'">
         <v-textarea
            v-model="internalModel[field.id]"
            :label="field.label"
            :placeholder="field.placeholder"
            :rules="field.required ? [v => !!v || '此欄位為必填'] : []"
            :hint="field.hint"
            :persistent-hint="!!field.hint"
            variant="outlined"
            density="comfortable"
            rows="3"
            auto-grow
         ></v-textarea>
      </template>

      <!-- Phone Input -->
      <template v-else-if="field.type === 'phone'">
         <v-text-field
            :model-value="internalModel[field.id]"
            @update:model-value="(val) => internalModel[field.id] = String(val).replace(/\D/g, '')"
            :label="field.label"
            :placeholder="field.placeholder || '範例：0912345678'"
            :rules="field.required ? [v => !!v || '此欄位為必填'] : []"
            variant="outlined"
            density="comfortable"
            type="tel"
            :hint="field.hint || '輸入時自動去除符號，僅保留數字'"
            persistent-hint
         ></v-text-field>
      </template>

      <!-- Date Input -->
      <template v-else-if="field.type === 'date'">
         <v-text-field
            v-model="internalModel[field.id]"
            :label="field.label"
            :placeholder="field.placeholder"
            :rules="field.required ? [v => !!v || '此欄位為必填'] : []"
            variant="outlined"
            density="comfortable"
            type="date"
         ></v-text-field>
      </template>

      <!-- Address Input -->
      <template v-else-if="field.type === 'address'">
         <v-text-field
            v-model="internalModel[field.id]"
            :label="field.label"
            :placeholder="field.placeholder || '請輸入地址'"
            :rules="field.required ? [v => !!v || '此欄位為必填'] : []"
            :hint="field.hint"
            :persistent-hint="!!field.hint"
            variant="outlined"
            density="comfortable"
            prepend-inner-icon="mdi-map-marker-outline"
         ></v-text-field>
      </template>

      <!-- System Auto-fill Input -->
      <template v-else-if="field.type === 'system'">
         <v-text-field
            v-model="internalModel[field.id]"
            :label="field.label"
            :placeholder="field.placeholder"
            :rules="field.required ? [v => !!v || '此欄位為必填'] : []"
            :readonly="field.readOnly"
            variant="outlined"
            density="comfortable"
            prepend-inner-icon="mdi-database-outline"
            :bg-color="field.readOnly ? 'grey-lighten-4' : undefined"
         ></v-text-field>
      </template>

      <!-- Radio Group -->
      <template v-else-if="field.type === 'radio'">
        <div class="text-subtitle-2 mb-2 font-weight-bold">
            {{ field.label }} <span v-if="field.required" class="text-red">*</span>
        </div>
        <v-radio-group
            v-model="internalModel[field.id]"
            :rules="field.required ? [v => !!v || '此欄位為必填'] : []"
            hide-details="auto"
        >
            <div v-for="option in field.options" :key="option.value">
                <v-radio :label="option.label" :value="option.value" color="primary"></v-radio>
                
                <!-- Recursive Sub-fields for Radio -->
                <div 
                    v-if="internalModel[field.id] === option.value && option.subFields && option.subFields.length > 0"
                    class="ml-8 mt-2 pl-3 border-s-md mb-2"
                    style="border-color: #e0e0e0 !important;"
                >
                     <DynamicFormRenderer 
                        :fields="option.subFields" 
                        :model-value="internalModel"
                        @update:model-value="updateModel"
                    />
                </div>
            </div>
        </v-radio-group>
      </template>

      <!-- Checkbox Group -->
      <template v-else-if="field.type === 'checkbox'">
         <div class="text-subtitle-2 mb-2 font-weight-bold">
            {{ field.label }} <span v-if="field.required" class="text-red">*</span>
        </div>
        
        <div v-for="option in field.options" :key="option.value" class="mb-1">
            <v-checkbox
                v-model="internalModel[field.id]"
                :label="option.label"
                :value="option.value"
                density="compact"
                hide-details
                color="primary"
                :rules="field.required && (!internalModel[field.id] || internalModel[field.id].length === 0) ? ['必填'] : []"
                multiple
            ></v-checkbox>

             <!-- Recursive Sub-fields for Checkbox -->
                <div 
                    v-if="isArrayIncludes(internalModel[field.id], option.value) && option.subFields && option.subFields.length > 0"
                    class="ml-8 mt-2 pl-3 border-s-md mb-2"
                    style="border-color: #e0e0e0 !important;"
                >
                     <DynamicFormRenderer 
                        :fields="option.subFields" 
                        :model-value="internalModel"
                        @update:model-value="updateModel"
                    />
                </div>
        </div>
        <div v-if="field.required && (!internalModel[field.id] || internalModel[field.id].length === 0)" class="text-caption text-error ml-2">
            此欄位為必填
        </div>
      </template>
      
      <!-- Display-Only: Header -->
      <template v-else-if="field.type === 'header'">
        <div class="text-subtitle-1 font-weight-bold mb-1 mt-2 text-primary">
          {{ field.label }}
        </div>
        <div v-if="field.placeholder" class="text-caption text-grey-darken-1 mb-2">
          {{ field.placeholder }}
        </div>
      </template>

      <!-- Display-Only: Description (修正：讀取 field.content) -->
      <template v-else-if="field.type === 'description'">
        <div class="text-subtitle-2 mb-1">
          {{ field.label }}
        </div>
        <div v-if="field.content" class="text-body-2 text-grey-darken-1 mb-2 preserve-whitespace">
          {{ field.content }}
        </div>
      </template>

      <!-- Display-Only: Divider -->
      <template v-else-if="field.type === 'divider'">
        <v-divider class="my-4"></v-divider>
      </template>

      <!-- Display-Only: Link -->
      <template v-else-if="field.type === 'link'">
        <a
          v-if="field.url"
          :href="field.url"
          target="_blank"
          rel="noopener noreferrer"
          class="text-body-2 text-primary text-decoration-underline d-inline-flex align-center"
        >
          <v-icon size="small" class="mr-1">mdi-open-in-new</v-icon>
          {{ field.label || '點擊前往' }}
        </a>
      </template>

    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

// Define Props and Emits
const props = defineProps<{
  fields: any[]; // Using any for simplicity in recursive prop, can be typed strictly
  modelValue: Record<string, any>;
}>();

const emit = defineEmits(['update:modelValue']);

// Computed to handle v-model binding
const internalModel = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
});

const updateModel = (val: any) => {
    emit('update:modelValue', val);
};

// Helper to check if array includes value safely
const isArrayIncludes = (arr: any, val: any) => {
    return Array.isArray(arr) && arr.includes(val);
};

</script>

<style scoped>
.border-s-md {
    border-left-width: 4px !important;
}
.preserve-whitespace {
    white-space: pre-wrap;
}
</style>
