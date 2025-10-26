<template>
  <div
    class="name-tag"
    :class="{ 'alert-border': alert }" :style="{ '--status-color': color }"
    @click="$emit('click')" >
    <span v-if="order" class="order-number">{{ order }}</span>
    <span class="vertical-name">{{ name }}</span>
  </div>
</template>

<script setup>
import { defineProps, defineEmits } from 'vue'; // ✓ 確保 defineEmits 也 import

// --- Props ---
// ✓ 定義接收的 props
// ✓ 修正錯字：onst -> const
const props = defineProps({
  name: { type: String, required: true },
  status: { type: String, default: 'standby' },
  order: { type: Number, default: null },
  color: { type: String, default: '#BDBDBD' },
  alert: { // ✅ 新增 Prop
    type: Boolean,
    default: false,
  },
});

// --- Emits ---
// ✓ 定義可以觸發的事件
const emit = defineEmits(['click']);

</script>

<style scoped>
.name-tag {
  /* 基本樣式 */
  display: inline-flex; /* 使用 inline-flex 讓寬度自適應內容 */
  flex-direction: column; /* 垂直排列順序和名字 */
  align-items: center; /* 水平居中 */
  justify-content: center; /* 垂直居中 */
  padding: 10px 15px; /* 內邊距 */
  border: 1px solid #adb5bd; /* 灰色邊框 */
  border-radius: 8px; /* 圓角 */
  /* background-color: #ffffff; */ /* 移除或註解掉原本的白色背景 */
  cursor: pointer; /* 手形游標 */
  position: relative; /* 相對定位，用於放置順序數字 */
  min-height: 200px; /* 最小高度，確保垂直文字空間 */
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.5s ease; /* ✓ 添加 border-color 過渡 */

  /* ✅ 修改：使用狀態顏色作為背景色 */
  background-color: var(--status-color);
}


.name-tag:hover {
  transform: translateY(-2px); /* 輕微上移 */
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
}

.order-number {
  /* 順序數字樣式 */
  position: absolute; /* 絕對定位 */
  top: 5px; /* 靠近頂部 */
  left: 8px; /* 靠近左邊 */
  font-size: 0.8em;
  font-weight: bold;
 color: #ffffff; /* 例如，改為白色 */
 /* ✓ 可選：增加文字陰影提高對比度 */
 text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.5);
}

.vertical-name {
  /* 垂直文字樣式 */
  writing-mode: vertical-rl; /* 從右到左垂直書寫 */
  text-orientation: mixed; /* 保持文字方向 */
  font-size: 3em; /* 稍大的字體 */
  font-weight: bold;
 color: #ffffff; /* 例如，改為白色 */
 /* ✓ 可選：增加文字陰影提高對比度 */
 text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.5);
  letter-spacing: 0.2em; /* 字間距 */
  white-space: nowrap; /* 防止名字換行 */
}


/* 方案 B: 邊框閃爍動畫 (可選) */
.alert-border {
  border-color: #dc3545 !important; /* 使用 Bootstrap 的 danger color 或自訂 */
  border-width: 2px; /* 可以加粗邊框 */
  /* 可選：添加輕微陰影 */
  box-shadow: 0 0 0 2px rgba(220, 53, 69, 0.5);
  /* ✓ 如果選擇閃爍，啟用 animation */
  animation: flash-border-red 1.5s infinite ease-in-out;
}

@keyframes flash-border-red {
  0%, 100% { border-color: #dc3545; }
  50% { border-color: rgba(255, 255, 255, 0.5); } /* ✓ 閃爍到半透明白色，更明顯 */
}

/* ✓ 確保 .alert-border 有 border-width*/
.alert-border {
  border-width: 2px;
} 
</style>
