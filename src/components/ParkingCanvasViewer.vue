<template>
  <v-app>
    <v-main>
      <v-container fluid style="height: 100%;">
        
        <div class="map-container">
          
          <vue-draggable-resizable
            v-for="spot in parkingSpots"
            :key="spot.id"
            
            :w="spot.w"
            :h="spot.h"
            :x="spot.x"
            :y="spot.y"
            
            parent
            
            :style="{ background: spot.color }"
            
            @dragstop="(x, y) => onDragStop(spot, x, y)"
            
            @resizestop="(x, y, w, h) => onResizeStop(spot, x, y, w, h)"
          >
            <div>
              <strong>{{ spot.id }}</strong><br>
              {{ spot.owner }}
            </div>
          </vue-draggable-resizable>

        </div>
      </v-container>
    </v-main>
  </v-app>
</template>

<script setup>
import { ref } from 'vue';

// 模擬從 Firestore 拿到的資料
const parkingSpots = ref([
  { 
    id: 'A-01', 
    w: 100, 
    h: 50, 
    x: 50, 
    y: 50, 
    owner: '王先生', 
    status: 'sold', 
    color: 'rgba(255, 0, 0, 0.5)' // 已售 (紅)
  },
  { 
    id: 'A-02', 
    w: 120, 
    h: 50, 
    x: 200, 
    y: 50, 
    owner: null, 
    status: 'available', 
    color: 'rgba(0, 255, 0, 0.5)' // 可售 (綠)
  },
]);

// ✅ 停止拖曳時更新資料 (準備存回 Firestore)
const onDragStop = (spot, newX, newY) => {
  console.log(`[DragStop] ${spot.id}: x=${newX}, y=${newY}`);
  // 在真實應用中，這裡會呼叫 Firestore API
  const index = parkingSpots.value.findIndex(s => s.id === spot.id);
  if (index !== -1) {
    parkingSpots.value[index].x = newX;
    parkingSpots.value[index].y = newY;
  }
};

// ✅ 停止縮放時更新資料 (準備存回 Firestore)
const onResizeStop = (spot, newX, newY, newW, newH) => {
  console.log(`[ResizeStop] ${spot.id}: x=${newX}, y=${newY}, w=${newW}, h=${newH}`);
  // 在真實應用中，這裡會呼叫 Firestore API
  const index = parkingSpots.value.findIndex(s => s.id === spot.id);
  if (index !== -1) {
    parkingSpots.value[index].x = newX;
    parkingSpots.value[index].y = newY;
    parkingSpots.value[index].w = newW;
    parkingSpots.value[index].h = newH;
  }
};
</script>

<style>
/* 確保 v-main 佔滿高度 */
html, body, #app, .v-application {
  height: 100%;
}
.v-main {
  height: 100%;
}

/* 底圖容器 
  1. 必須設為 position: relative 才能讓子元件的 parent=true 生效。
  2. 這裡用灰色背景模擬您的 JPG 平面圖。
*/
.map-container {
  position: relative;
  
  /* ✅ 修改：使用您 JPG 的原始像素 */
  width: 1920px; 
  height: 1080px;
  /* 移除 height: 90vh 和 width: 100% */
  
  background-color: #f0f0f0;
  border: 2px solid #ccc;
  background-image: url('https://storage.googleapis.com/apps-script-api-443402.firebasestorage.app/floorplan-backgrounds%2F1758598767701_B3.png'); 
  
  /* ✅ 修改：確保背景圖 1:1 顯示 */
  background-size: 100% 100%; 
  
  /* (可選) 讓外層可以滾動 */
  overflow: auto; 
}

/* (可選) 限制 v-main 的高度，使其產生滾動條 */
.v-main {
  height: 90vh;
  overflow: auto;
}

/* 可拖曳元件的樣式 */
.vue-draggable-resizable {
  border: 1px solid #333;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  font-size: 12px;
  color: #000;
  box-sizing: border-box; /* 確保 padding 和 border 不會影響寬高 */
}
</style>