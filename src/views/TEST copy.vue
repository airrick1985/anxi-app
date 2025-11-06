<template>
  <div class="test-page-container">
    <!-- 1. 控制項 -->
    <div class="controls">
      <span>(點擊方塊可啟用拖曳/縮放)</span>
    </div>

    <!-- 2. 父容器 (背景圖) -->
    <div class="parent-container" ref="parentContainer" :style="parentStyle">
      
      <!-- 
        3. 渲染方塊 (v-for 會渲染 spots 陣列中的兩個方塊)
      -->
      <VueDragResizeRotate
        v-for="spot in spots"
        :key="spot.id"
        :x="spot.x"
        :y="spot.y"
        :w="spot.w"
        :h="spot.h"
        :r="spot.r || 0"
        :parent="true"
        :active="spot.id === activeSpotId"
        @activated="() => onActivate(spot.id)"
        @dragging="(x, y) => onDrag(spot.id, x, y)"
        @resizing="(x, y, w, h) => onResize(spot.id, x, y, w, h)"
        @rotating="(r) => onRotate(spot.id, r)"
        class-name="test-spot"
        class-name-active="active-spot"
      >
        <div class="spot-content">
          {{ spot.text }}<br>
          (x: {{ Math.round(spot.x) }}, y: {{ Math.round(spot.y) }})
        </div>
      </VueDragResizeRotate>

    </div>
  </div>
</template>

<script>
import { ref, computed } from 'vue';
// 假設您已安裝並能正確引入
import VueDragResizeRotate from '@gausszhou/vue3-drag-resize-rotate';
import '@gausszhou/vue3-drag-resize-rotate/lib/bundle.esm.css';

export default {
  name: 'TestPage',
  components: {
    VueDragResizeRotate,
  },
  setup() {
    const parentContainer = ref(null);
    
    // 直接初始化 spots 陣列，包含兩個在相同 (10, 10) 位置的方塊
    const spots = ref([
      {
        id: 'test-1',
        x: 10, // 方塊 1 的 X 座標
        y: 10, // 方塊 1 的 Y 座標
        w: 100,
        h: 100,
        r: 0,
        text: '方塊 1',
      },
      {
        id: 'test-2',
        x: 10, // 方塊 2 的 X 座標 (與方塊 1 相同)
        y: 10, // 方塊 2 的 Y 座標 (與方塊 1 相同)
        w: 100,
        h: 100,
        r: 0,
        text: '方塊 2',
      }
    ]);
    const activeSpotId = ref(null);

    // 背景圖 URL
    const imageUrl = 'https://storage.googleapis.com/apps-script-api-443402.firebasestorage.app/floorplan-backgrounds%2Ffuyu1750_B6_20250918160914%2F1758185108037_B6.png';

    // 父容器樣式
    const parentStyle = computed(() => ({
      backgroundImage: `url(${imageUrl})`,
    }));
    
    const onActivate = (id) => {
      activeSpotId.value = id;
    };

    // 拖曳/縮放/旋轉的事件處理函式
    const onDrag = (id, x, y) => {
      const spot = spots.value.find(s => s.id === id);
      if (spot) {
        spot.x = Math.round(x);
        spot.y = Math.round(y);
      }
    };

    const onResize = (id, x, y, w, h) => {
      const spot = spots.value.find(s => s.id === id);
      if (spot) {
        spot.x = Math.round(x);
        spot.y = Math.round(y);
        spot.w = Math.round(w);
        spot.h = Math.round(h);
      }
    };

    const onRotate = (id, r) => {
      const spot = spots.value.find(s => s.id === id);
      if (spot) {
        spot.r = Math.round(r);
      }
    };

    return {
      parentContainer,
      spots,
      activeSpotId,
      parentStyle,
      onActivate,
      onDrag,
      onResize,
      onRotate,
    };
  },
};
</script>

<style scoped>
.test-page-container {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 90vh;
  border: 1px solid #ccc;
}

.controls {
  padding: 10px;
  background-color: #f4f4f4;
  border-bottom: 1px solid #ddd;
  display: flex;
  align-items: center;
  gap: 8px;
}

.parent-container {
  flex-grow: 1;
  position: relative; /* 關鍵：設定為 positioned ancestor */
  background-color: #e0e0e0;
  background-size: contain;
  background-position: center;
  background-repeat: no-repeat;
  overflow: hidden; 
}

/* 拖曳方塊的樣式 */
.test-spot {
  /* ✓ 解決方案：強制指定 position: absolute */
  position: absolute;
  border: 1px dashed #333;
}

.spot-content {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: bold;
  background-color: rgba(255, 255, 0, 0.5); /* 測試黃色 */
  color: #000;
  box-sizing: border-box;
  text-align: center;
  word-break: break-all;
}

/* 選中時的樣式 */
.active-spot {
  border: 2px solid #007bff !important;
  z-index: 999 !important;
}
.active-spot .spot-content {
  background-color: rgba(255, 255, 0, 0.8);
}
</style>

