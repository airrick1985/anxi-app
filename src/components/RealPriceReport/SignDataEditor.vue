<template>
  <div class="sign-data-editor">
    <v-alert type="info" variant="tonal" density="compact" class="mb-3">
      此分頁用於設定「建案預設的合約類型」。當戶別匯出時，若戶別覆寫中設為「毛胚合約」，申報 JSON 的 <code>p1sp_code0505</code>（毛胚屋）會自動填 <code>Y</code>。
    </v-alert>
    <v-card variant="outlined" class="pa-4">
      <v-row dense>
        <v-col cols="12" md="6">
          <v-select
            v-model="localModel.defaultContractType"
            :items="contractTypes"
            label="建案預設合約類型"
            variant="outlined"
            density="compact"
            persistent-hint
            hint="影響新戶別在匯出時的預設毛胚屋判斷"
          />
        </v-col>
      </v-row>
    </v-card>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue';

const props = defineProps({
  modelValue: { type: Object, default: () => ({ defaultContractType: '一般合約' }) },
});
const emit = defineEmits(['update:modelValue']);

const contractTypes = ['一般合約', '毛胚合約'];
const localModel = ref({ defaultContractType: '一般合約', ...(props.modelValue || {}) });

watch(() => props.modelValue, (val) => {
  localModel.value = { defaultContractType: '一般合約', ...(val || {}) };
}, { deep: true });

watch(localModel, (val) => {
  emit('update:modelValue', { ...val });
}, { deep: true });
</script>
