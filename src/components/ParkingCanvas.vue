<template>
  <v-app>
    <v-main>
      <v-container fluid style="height: 100%;">
        
        <div class="stage-wrapper" ref="wrapperRef">
          
          <div 
            class="map-container"
            :style="{ transform: `scale(${scale})` }"
          >
            
            <div
              v-for="spot in parkingSpots"
              :key="spot.id"
              
              :ref="el => setSpotRef(el, spot.id)"
              
              :data-spot-id="spot.id"
              
              class="parking-spot"
              
              :style="getInitialStyle(spot)"
            >
              <strong>{{ spot.id }}</strong><br>
              {{ spot.owner }}
            </div>
            
          </div>
        </div>
      </v-container>
    </v-main>
  </v-app>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, watch } from 'vue';
import { useElementBounding } from '@vueuse/core';
// ✅ 1. 引入 subjx
import subjx from 'subjx';
import 'subjx/dist/style/subjx.css';

// --- 響應式縮放邏輯 (不變) ---
const MAP_WIDTH = 1920;
const MAP_HEIGHT = 1080;
const wrapperRef = ref(null);
const { width: wrapperWidth } = useElementBounding(wrapperRef);

const scale = computed(() => {
  if (!wrapperWidth.value || MAP_WIDTH === 0) return 1; 
  return wrapperWidth.value / MAP_WIDTH;
});

// --- 模擬資料 ---
const parkingSpots = ref([
  { id: 'A-01', w: 100, h: 50, x: 50, y: 50, angle: 0, owner: '王先生', color: 'rgba(255, 0, 0, 0.5)'},
  { id: 'A-02', w: 120, h: 50, x: 200, y: 50, angle: 45, owner: null, color: 'rgba(0, 255, 0, 0.5)'},
]);

// ✅ 2. 用於設置初始位置的函數
const getInitialStyle = (spot) => ({
  width: `${spot.w}px`,
  height: `${spot.h}px`,
  background: spot.color,
  // subjx 會讀取並覆蓋 transform
  transform: `translate(${spot.x}px, ${spot.y}px) rotate(${spot.angle}deg)`,
});

// ✅ 3. 管理 DOM 元素和 subjx 實例
const spotElements = ref(new Map());
const subjxInstances = ref(new Map());

const setSpotRef = (el, id) => {
  if (el) {
    spotElements.value.set(id, el);
  }
};

// ✅ 4. 在 onMounted 中初始化 subjx
onMounted(() => {
  spotElements.value.forEach((el, id) => {
    // 獲取對應的資料
    const spotData = parkingSpots.value.find(s => s.id === id);
    if (!spotData) return;

    // 初始化 subjx
    const instance = subjx(el).drag({
      // 限制在 map-container 內
      restrict: '.map-container', 
      resizable: true,
      
      rotatable: true,
      rotatorOffset: 25,
      // 確保 subjx 讀取我們的初始 transform
      transformOrigin: true, 
    });

    // 監聽結束事件
    instance.on('dragEnd', (e) => handleTransformEnd(e, spotData, instance));
    instance.on('resizeEnd', (e) => handleTransformEnd(e, spotData, instance));
    instance.on('rotateEnd', (e) => handleTransformEnd(e, spotData, instance));

    subjxInstances.value.set(id, instance);
  });
});

// ✅ 5. 處理縮放變化
watch(scale, () => {
  subjxInstances.value.forEach(instance => {
    // 通知 subjx 容器已被縮放
    instance.fitControlsToSize();
  });
});

// ✅ 6. 在卸載時清除
onBeforeUnmount(() => {
  subjxInstances.value.forEach(instance => instance.disable());
  subjxInstances.value.clear();
  spotElements.value.clear();
});

// ✅ 7. 關鍵：手動解析和狀態同步
const handleTransformEnd = (event, spotData, instance) => {
  // 讀取 subjx 更新後的 DOM 樣式
  const el = instance.storage.el;
  const transform = el.style.transform;
  
  // 獲取新尺寸
  const dims = instance.getDimensions();
  spotData.w = dims.width;
  spotData.h = dims.height;

  // 解析 transform 字串
  const translateMatch = transform.match(/translate\(([^)]+)\)/);
  const rotateMatch = transform.match(/rotate\(([^)]+)\)/);

  if (translateMatch) {
    const [x, y] = translateMatch[1].split(',').map(v => parseFloat(v));
    spotData.x = x;
    spotData.y = y;
  }
  
  if (rotateMatch) {
    spotData.angle = parseFloat(rotateMatch[1]);
  } else {
    spotData.angle = 0; // 如果沒有旋轉，重設為 0
  }

  console.log(`[Subjx End] 更新 ${spotData.id}:`, { 
    x: spotData.x, 
    y: spotData.y, 
    w: spotData.w, 
    h: spotData.h, 
    angle: spotData.angle 
  });
  
  // 在這裡呼叫 Firestore API...
};

</script>

<style>
/* 1. 響應式外層 (不變) */
stage-wrapper {
  width: 100%;
  border: 1px solid blue; 
  /* ✅ 移除 overflow: hidden; 
     這最可能是裁切掉控制點的原因 
  */
  /* overflow: hidden; */
  position: relative;
}

/* 2. 內層 (固定尺寸) (不變) */
.map-container {
  position: relative;
  width: v-bind(MAP_WIDTH + 'px'); 
  height: v-bind(MAP_HEIGHT + 'px');
  transform-origin: top left;
  background-color: #f0f0f0;
  background-image: url('https://storage.googleapis.com/apps-script-api-443402.firebasestorage.app/floorplan-backgrounds%2F1758598767701_B3.png');
  background-size: 100% 100%;
  background-repeat: no-repeat;
}

/* ✅ 4. parking-spot 的基礎樣式 */
.parking-spot {
  position: absolute; /* subjx 需要絕對定位 */
  top: 0;
  left: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  font-size: 12px;
  color: #000;
  box-sizing: border-box;
  border: 1px solid #333;
  
  /* 讓 subjx 控制 transform-origin */
  transform-origin: center center;
}

/* 這是 subjx 控制點的樣式 (可以覆蓋) */
.sjx-controls {
  /* 例如: 讓控制點更明顯 */
  z-index: 100 !important;
  --sjx-controls-handle-size: 10px;
  --sjx-controls-handle-bg: rgba(255, 0, 0, 0.8);
  --sjx-controls-rotator-handle-bg: blue;
}

.sjx-controls-rotator {
  /* 確保旋轉點可見 */
  display: block !important;
  opacity: 1 !important;
  
  /* (可選) 改變外觀 */
  width: 12px;
  height: 12px;
  background: #007bff; /* 設為亮藍色 */
  border-radius: 50%;
  border: 2px solid white;
  box-shadow: 0 0 5px rgba(0,0,0,0.5);
}
</style>