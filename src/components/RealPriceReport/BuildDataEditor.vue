<template>
  <div class="build-data-editor">
    <v-alert v-if="hint" type="info" variant="tonal" density="compact" class="mb-3">
      {{ hint }}
    </v-alert>
    <v-row dense>
      <v-col v-for="f in schema" :key="f.key" cols="12" sm="6" md="4">
        <v-text-field
          v-model="localModel[f.key]"
          :label="f.label"
          :hint="f.key"
          :type="f.type === 'number' ? 'number' : 'text'"
          persistent-hint
          variant="outlined"
          density="compact"
          clearable
        />
      </v-col>
    </v-row>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue';
import { BUILD_DATA_SCHEMA, buildEmptyBuildData } from '@/constants/realPriceReportSchema';

const props = defineProps({
  modelValue: { type: Object, default: () => ({}) },
  hint: { type: String, default: '' },
});
const emit = defineEmits(['update:modelValue']);

const schema = BUILD_DATA_SCHEMA;
const localModel = ref({ ...buildEmptyBuildData(), ...(props.modelValue || {}) });

watch(() => props.modelValue, (val) => {
  localModel.value = { ...buildEmptyBuildData(), ...(val || {}) };
}, { deep: true });

watch(localModel, (val) => {
  emit('update:modelValue', { ...val });
}, { deep: true });
</script>
