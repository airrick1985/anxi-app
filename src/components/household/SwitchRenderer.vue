<template>
  <div class="d-flex justify-center align-center w-100 h-100" @click.stop>
    <v-switch
      :model-value="params.value"
      @update:modelValue="toggleValue"
      color="success"
      inset
      hide-details
      density="compact"
    ></v-switch>
  </div>
</template>

<script>
export default {
  props: { params: { type: Object, required: true } },
  methods: {
    // 當 switch 被點擊時，直接更新 AG Grid 的資料
    toggleValue(newValue) {
      // 呼叫 AG Grid 的 API 來設定新值，這會觸發 onCellValueChanged
      this.params.setValue(newValue);
    },
  },
};
</script>
