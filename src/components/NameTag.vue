<template>
  <div
    class="name-tag"
    :class="{ 'alert-border': alert }" 
    :style="{ '--status-color': color }"
    @click="$emit('click')" 
  >
    <div class="drag-handle" @click.stop>
      <v-icon icon="mdi-drag-horizontal" color="white" size="small"></v-icon>
    </div>

    <span v-if="order" class="order-number">{{ order }}</span>
    <span class="vertical-name">{{ name }}</span>
  </div>
</template>

<script setup>
import { defineProps, defineEmits } from 'vue';

const props = defineProps({
  name: { type: String, required: true },
  status: { type: String, default: 'standby' },
  order: { type: Number, default: null },
  color: { type: String, default: '#BDBDBD' },
  alert: { 
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(['click']);
</script>

<style scoped>
.name-tag {
  display: inline-flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  
  /* ✅ [修改] 上方 padding 加大 (原本是 10px)，留空間給手柄 */
  padding: 35px 15px 10px 15px; 
  
  border: 1px solid #adb5bd;
  border-radius: 8px;
  cursor: pointer;
  position: relative;
  min-height: 200px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.5s ease;
  background-color: var(--status-color);
  
  /* 防止在卡片上選取文字，提升拖曳體驗 */
  user-select: none; 
}

/* ✅ [新增] 手柄樣式 */
.drag-handle {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 30px; /* 手柄高度 */
  
  display: flex;
  justify-content: center;
  align-items: center;
  
  background-color: rgba(0, 0, 0, 0.1); /* 淡淡的深色背景 */
  border-bottom: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 8px 8px 0 0; /* 跟隨卡片圓角 */
  
  cursor: grab; /* 游標變手掌 */
  z-index: 10;
  
  /* ✅ [重要] 強制重置為水平書寫，避免 icon 受父層 vertical-rl 影響而轉向 */
  writing-mode: horizontal-tb; 
}

/* ✅ [新增] 按下拖曳時的游標 */
.drag-handle:active {
  cursor: grabbing;
}

.name-tag:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
}

.order-number {
  position: absolute;
  /* ✅ [修改] 往下移一點，避免與手柄重疊 */
  top: 35px; 
  left: 8px;
  
  font-size: 0.8em;
  font-weight: bold;
  color: #ffffff;
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.5);
  
  /* 確保數字不受 vertical-rl 影響位置異常 */
  writing-mode: horizontal-tb; 
}

.vertical-name {
  writing-mode: vertical-rl;
  text-orientation: mixed;
  font-size: 3em;
  font-weight: bold;
  color: #ffffff;
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.5);
  letter-spacing: 0.2em;
  white-space: nowrap;
}

.alert-border {
  border-color: #dc3545 !important;
  border-width: 2px;
  box-shadow: 0 0 0 2px rgba(220, 53, 69, 0.5);
  animation: flash-border-red 1.5s infinite ease-in-out;
}

@keyframes flash-border-red {
  0%, 100% { border-color: #dc3545; }
  50% { border-color: rgba(255, 255, 255, 0.5); }
}
</style>