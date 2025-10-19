<template>
  <button 
    class="icon-button-group" 
    :style="groupStyle"
    @click="$emit('click')"
  >
    <img :src="icon" :alt="`${text}圖標`" class="icon" />
    <span class="text">{{ text }}</span>
  </button>
</template>

<script setup>
import { computed } from 'vue';

// 接收傳入的 props
const props = defineProps({
  icon: {
    type: String,
    required: true,
  },
  text: {
    type: String,
    required: true,
  },
  // 1. 新增 scale prop，預設為 1 (100%)
  scale: {
    type: Number,
    default: 1,
  }
});

// 聲明會觸發的事件
defineEmits(['click']);

// 2. 定義所有尺寸的基準值 (px 或 rem)
const BASE_GROUP_SIZE = 120; // 基礎按鈕寬高
const BASE_ICON_SIZE = 60;   // 基礎圖示寬高
const BASE_FONT_SIZE = 1;    // 基礎字型大小 (rem)
const BASE_GAP = 12;         // 基礎圖示與文字的間距

// 3. 使用 computed 根據 scale 計算動態樣式
const groupStyle = computed(() => ({
  '--group-size': `${BASE_GROUP_SIZE * props.scale}px`,
  '--icon-size': `${BASE_ICON_SIZE * props.scale}px`,
  '--font-size': `${BASE_FONT_SIZE * props.scale}rem`,
  '--icon-margin-bottom': `${BASE_GAP * props.scale}px`,
}));
</script>

<style scoped>
/* 4. 將 Home.vue 的樣式遷移過來，並使用 CSS 變數 */
.icon-button-group {
  /* 使用動態計算的尺寸 */
  width: var(--group-size);
  height: var(--group-size);
  font-size: var(--font-size);

  /* 以下是原來的樣式 */
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 10px; /* Padding 可保持固定或也按比例縮放 */
  text-align: center;
  background: rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(4px);
  border: 2px solid rgba(255, 255, 255, 0.2);
  border-radius: 12px;
  box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.15);
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
}

.icon-button-group:hover {
  /* Hover 效果通常保持不變 */
  transform: translateY(-8px) scale(1.05);
  box-shadow: 0 16px 40px 0 rgba(31, 38, 135, 0.2), 
              0 0 20px rgba(255, 255, 255, 0.6);
  background: rgba(255, 255, 255, 0.496);
}

.icon {
  /* 使用動態計算的尺寸 */
  width: var(--icon-size);
  height: var(--icon-size);
  margin-bottom: var(--icon-margin-bottom);

  /* 以下是原來的樣式 */
  filter: drop-shadow(1px 1px 1px rgba(0, 0, 0, 0.2));
  opacity: 0.8;
  transition: all 0.3s ease;
}

.text {
  /* 字型大小已在 .icon-button-group 中設定 */
  font-weight: 500;
  color: #000000;
  white-space: nowrap; /* 防止文字在縮放時斷行 */
}
</style>