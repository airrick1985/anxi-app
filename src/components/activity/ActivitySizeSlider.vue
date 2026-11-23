<template>
  <label class="amv-size" title="縮圖大小">
    <v-icon size="14">mdi-image-outline</v-icon>
    <input
      type="range"
      :min="150"
      :max="380"
      :step="10"
      :value="modelValue"
      aria-label="縮圖大小"
      @input="$emit('update:modelValue', Number($event.target.value))"
      @keydown.stop
    />
    <v-icon size="19">mdi-image-outline</v-icon>
  </label>
</template>

<script setup>
// 縮圖大小滑桿（總覽與管理共用）
defineProps({ modelValue: { type: Number, default: 200 } });
defineEmits(['update:modelValue']);
</script>
