<template>
  <div class="main-data-editor">
    <v-alert v-if="readonlyHint" type="info" variant="tonal" density="compact" class="mb-3">
      {{ readonlyHint }}
    </v-alert>
    <v-expansion-panels v-model="openedPanels" multiple>
      <v-expansion-panel v-for="g in groups" :key="g.key" :value="g.key">
        <v-expansion-panel-title>
          <v-icon start>{{ g.icon }}</v-icon>
          <span>{{ g.label }}</span>
          <v-chip class="ml-2" size="x-small" variant="flat" color="primary">
            {{ fieldsByGroup[g.key].length }} 欄
          </v-chip>
        </v-expansion-panel-title>
        <v-expansion-panel-text>
          <v-row dense>
            <v-col v-for="f in fieldsByGroup[g.key]" :key="f.key" cols="12" md="6" lg="4">
              <v-textarea
                v-if="f.type === 'textarea'"
                v-model="localModel[f.key]"
                :label="f.label"
                :hint="f.key"
                persistent-hint
                rows="2"
                variant="outlined"
                density="compact"
                auto-grow
              />
              <v-text-field
                v-else
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
        </v-expansion-panel-text>
      </v-expansion-panel>
    </v-expansion-panels>
  </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue';
import { MAIN_DATA_SCHEMA, MAIN_GROUPS, buildEmptyMainData } from '@/constants/realPriceReportSchema';

const props = defineProps({
  modelValue: { type: Object, default: () => ({}) },
  readonlyHint: { type: String, default: '' },
});
const emit = defineEmits(['update:modelValue']);

const groups = MAIN_GROUPS;
const openedPanels = ref(MAIN_GROUPS.map(g => g.key));

const fieldsByGroup = computed(() => {
  const out = {};
  MAIN_GROUPS.forEach(g => { out[g.key] = []; });
  MAIN_DATA_SCHEMA.forEach(f => {
    if (!out[f.group]) out[f.group] = [];
    out[f.group].push(f);
  });
  return out;
});

const localModel = ref({ ...buildEmptyMainData(), ...(props.modelValue || {}) });

watch(() => props.modelValue, (val) => {
  localModel.value = { ...buildEmptyMainData(), ...(val || {}) };
}, { deep: true });

watch(localModel, (val) => {
  emit('update:modelValue', { ...val });
}, { deep: true });
</script>
