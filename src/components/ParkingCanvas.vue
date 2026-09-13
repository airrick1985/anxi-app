<template>
  <div class="parking-canvas-container center-xy" :class="{ 'has-header': hasHeader }" ref="containerRef" @wheel="onCanvasWheel">

    <!-- macOS 風格標題列：關閉／標題／狀態切換／樓層／列印，取代原本散在四角的浮動按鈕（宿主傳入 header-title 才顯示） -->
    <div v-if="hasHeader" class="mac-titlebar" ref="headerRef">
      <div class="mac-titlebar-lead">
        <button v-if="showClose" class="mac-titlebar-close" title="關閉" @click="$emit('close')">
          <svg-icon type="mdi" :path="mdiClose" :size="18"></svg-icon>
        </button>
        <span class="mac-titlebar-title">{{ headerTitle }}</span>
      </div>
      <div class="mac-titlebar-tools">
        <div v-if="showStatusToggle" class="mac-seg" role="group" aria-label="顯示狀態">
          <button :class="['mac-seg-btn', { 'is-active': displayMode === 'backend' }]" @click="switchDisplayMode('backend')">後台狀態</button>
          <button :class="['mac-seg-btn', { 'is-active': displayMode === 'sales' }]" @click="switchDisplayMode('sales')">銷售狀態</button>
        </div>
        <div v-if="availableFloorPlans.length" class="mac-seg mac-seg--floors" role="group" aria-label="車位樓層">
          <button
            v-for="plan in availableFloorPlans"
            :key="plan.id"
            :class="['mac-seg-btn', { 'is-active': plan.id === floorPlan.id }]"
            @click="switchFloor(plan)"
          >{{ plan.floor }}</button>
        </div>
        <!-- 畫布縮放：滑桿可直接拖曳，兩側 −／＋ 微調，右側百分比與「最適」 -->
        <div class="mac-zoom" title="畫布縮放（亦可 Ctrl + 滾輪）">
          <button class="mac-zoom-btn" :disabled="canvasScale <= zoomSliderMin" title="縮小" @click="zoomOut">
            <svg-icon type="mdi" :path="mdiMinus" :size="15"></svg-icon>
          </button>
          <input
            type="range"
            class="mac-zoom-slider"
            :min="zoomSliderMin * 100"
            :max="zoomSliderMax * 100"
            step="1"
            :value="Math.round(canvasScale * 100)"
            aria-label="畫布縮放"
            :style="{ '--zoom-fill': `${((canvasScale - zoomSliderMin) / (zoomSliderMax - zoomSliderMin)) * 100}%` }"
            @input="onZoomSlider"
          />
          <button class="mac-zoom-btn" :disabled="canvasScale >= zoomSliderMax" title="放大" @click="zoomIn">
            <svg-icon type="mdi" :path="mdiPlus" :size="15"></svg-icon>
          </button>
          <span class="mac-zoom-percent">{{ Math.round(canvasScale * 100) }}%</span>
          <button class="mac-zoom-fit" title="最適大小（整張底圖完整顯示）" @click="fitToScreen">
            <svg-icon type="mdi" :path="mdiFitToScreenOutline" :size="15"></svg-icon><span>最適</span>
          </button>
        </div>
        <button class="mac-btn" @click="openPrintDialog">
          <svg-icon type="mdi" :path="mdiPrinter" :size="16"></svg-icon> 列印
        </button>
        <slot name="header-extra"></slot>
      </div>
    </div>

    <div v-if="isCanvasLoading" class="modal-overlay" style="z-index: 100; position: absolute;">
      <div class="modal-content" style="max-width: 300px;">
        <div class="modal-body loading-state">
           <svg-icon type="mdi" :path="mdiLoading" class="icon spin-icon" style="width: 48px; height: 48px; color: #007bff;"></svg-icon>
           <p class="mt-4" style="margin-top: 1rem; font-size: 1.1rem; color: #333; font-weight: 500;">
             正在載入車位資料...
           </p>
        </div>
      </div>
    </div>
    
    <!-- 內層捲動區：只有畫布會捲動，功能按鈕釘在外層四角不受影響 -->
    <!-- 預覽模式：左鍵按住空白處或車位即可抓住拖曳平移；編輯模式：左鍵框選、中鍵拖曳平移 -->
    <div class="canvas-scroll-area" ref="scrollAreaRef"
      :class="{ 'pan-enabled': previewMode, 'is-panning': isPanning }"
      @mousedown="onScrollAreaMouseDown">
    <!-- 包裹層以「縮放後的實際尺寸」佔位，捲動範圍與視覺一致，縮小時自動置中 -->
    <div class="canvas-zoom-wrapper" :style="zoomWrapperStyle">
    <div
      class="parking-canvas-area"
      ref="canvasAreaRef"
      :style="canvasAreaStyle" >
      <img 
        v-if="bgImageUrl"
        :src="bgImageUrl" 
        class="background-image" 
        :style="bgImageStyles"
        @load="onBgImageLoad"
        draggable="false"
      />
      
     <vue-drag-resize-rotate
        v-for="spot in spotLayouts"
        class-name="parking-spot-item"
        :key="spot.id"
        :x="spot.x"
        :y="spot.y"
        :w="spot.width"
        :h="spot.height"
        :r="spot.rotation"
        :active="spot.id === selectedSpotId"
        :draggable="!previewMode && !spot.locked"
        :resizable="!previewMode && !spot.locked"
        :rotatable="!previewMode && !spot.locked"
        :is-conflict-check="false"
        :scale-ratio="canvasScale"
        @activated="handleSpotActivated(spot)"
        @deactivated="handleSpotDeactivated"    
        @dragging="(x, y) => handleTransform(spot.id, { x, y }, 'dragging')"
        @resizing="(x, y, w, h) => handleTransform(spot.id, { x, y, w, h }, 'resizing')"
        @rotating="(r) => handleTransform(spot.id, { r }, 'rotating')"       
        @dragstop="(x, y) => handleTransformStop(spot.id, { x, y }, 'dragstop')"
        @resizestop="(x, y, w, h) => handleTransformStop(spot.id, { x, y, w, h }, 'resizestop')"
        @rotatestop="(r) => handleTransformStop(spot.id, { r }, 'rotatestop')"
        :snap="true"
        :snapTolerance="5"
        >
        <div
          class="spot-content"
          :style="getSpotStyle(spot)"
          :class="{ 'clickable-spot': previewMode && spot.parkingData, 'multi-selected': multiSelectedIds.length > 1 && multiSelectedIds.includes(spot.id), 'spot-held': isSpotHeld(spot.parkingData), 'spot-booked': isSpotBooked(spot.parkingData), 'spot-quoted': isQuotedSpot(spot) }"
          @click.stop="handleSpotClick(spot)"
        >
          <span 
            v-for="field in getDisplayFields(displayMode, spot.parkingData)"
            :key="field.key"
            :style="getSpotTextStyle(field.key)"
          >
            {{ field.value }}
          </span>
          <!-- 暫時保留逾期角標（後台模式） -->
          <span
            v-if="isSpotHeld(spot.parkingData) && getSpotHold(spot.parkingData)?.overdue"
            class="spot-hold-badge"
            :title="`保留已逾期 ${getSpotHold(spot.parkingData).daysOverdue} 天`"
          >逾期</span>
          <!-- 報價模式：已加入該戶別的車位 → 右上角紅底白字打勾 badge（不改車位顏色，避免與狀態色混淆） -->
          <span
            v-if="isQuotedSpot(spot)"
            class="spot-quoted-badge"
            :title="`已加入『${quoteUnitId}』的車位`"
          ><svg-icon type="mdi" :path="mdiCheckBold" :size="11"></svg-icon></span>
        </div>
      </vue-drag-resize-rotate>

      <!-- 框選範圍指示框 -->
      <div
        v-if="marqueeRect"
        class="marquee-box"
        :style="{ left: marqueeRect.x + 'px', top: marqueeRect.y + 'px', width: marqueeRect.w + 'px', height: marqueeRect.h + 'px' }"
      ></div>
    </div>
    </div>
    </div>

   <div
      v-if="showTools"
      class="toolbar"
    >
      <button v-if="allowImport" @click="openImportModal" class="btn btn-primary">
        <svg-icon type="mdi" :path="mdiDownload" class="icon"></svg-icon> 匯入車位資料
      </button>

      <button v-if="allowAdjustAll" @click="openAdjustAllPanel" class="btn btn-secondary">
        <svg-icon type="mdi" :path="mdiArrowExpandAll" class="icon"></svg-icon> 調整所有車位
      </button>
       
      <div v-if="showStatusToggle" class="status-toggle">
        <button
          @click="switchDisplayMode('backend')"
          :class="['btn', 'btn-sm', { 'btn-active': displayMode === 'backend' }]"
        >
          後台狀態
        </button>
        <button
          @click="switchDisplayMode('sales')"
          :class="['btn', 'btn-sm', { 'btn-active': displayMode === 'sales' }]"
        >
          銷售狀態
        </button>
      </div>

      <button @click="openPrintDialog" class="btn btn-secondary">
        <svg-icon type="mdi" :path="mdiPrinter" class="icon"></svg-icon> 列印
      </button>
    </div>
    
    <div v-if="importDialog" class="modal-overlay" @click.self="closeImportModal">
      <div class="modal-content">
        <div class="modal-header">
          <h3>匯入車位資料</h3>
          <button @click="closeImportModal" class="btn-close">
            <svg-icon type="mdi" :path="mdiClose"></svg-icon>
          </button>
        </div>
        <div class="modal-body">
          <div v-if="loading" class="loading-state">
            <p class="mt-4">正在載入車位資料...</p>
          </div>
          <div v-else-if="previewParkings.length > 0" class="import-preview">
            <p><strong>已取得車位編號如下</strong></p>
            <div class="parking-numbers">
              {{ previewParkings.map(p => p.number).join('、') }}
              <span v-if="totalParkingCount > 10">...等共 {{ totalParkingCount }} 個車位</span>
            </div>
            <p class="confirm-text">您是否要匯入以上車位？</p>
          </div>
          <div v-else class="no-data">
            <p>未找到符合條件的車位資料</p>
            <p>請檢查 projectId: <strong>{{ floorPlan.projectId }}</strong> 和 floor: <strong>{{ floorPlan.floor }}</strong></p>
          </div>
        </div>
        <div class="modal-footer">
          <button 
            v-if="previewParkings.length > 0" 
            @click="confirmImport" 
            class="btn btn-primary"
            :disabled="importing"
          >
            {{ importing ? '匯入中...' : '確認' }}
          </button>
        </div>
      </div>
    </div>
    
    <div v-if="showAdjustAllPanel" class="modal-overlay" @click.self="closeAdjustAllPanel">
      <div class="modal-content" style="max-width: 350px;">
        <div class="modal-header">
          <h3>調整所有車位尺寸</h3>
          <button @click="closeAdjustAllPanel" class="btn-close">
            <svg-icon type="mdi" :path="mdiClose"></svg-icon>
          </button>
        </div>
        
        <div class="modal-body adjust-all-form">
          <div class="form-group">
            <label>寬度 (width)</label>
            <input 
              v-model.number="adjustAllWidth"
              type="number" 
              class="form-input"
            />
          </div>
          <div class="form-group">
            <label>高度 (height)</label>
            <input 
              v-model.number="adjustAllHeight"
              type="number" 
              class="form-input"
            />
          </div>
        </div>
        
        <div class="modal-footer">
          <button @click="applyAdjustAll" class="btn btn-primary">
            套用
          </button>
        </div>
      </div>
    </div>

    <!-- 列印車位圖選項 -->
    <div v-if="showPrintDialog" class="modal-overlay" @click.self="closePrintDialog">
      <div class="modal-content" style="max-width: 460px;">
        <div class="modal-header">
          <h3>列印車位圖（A3）</h3>
          <button @click="closePrintDialog" class="btn-close">
            <svg-icon type="mdi" :path="mdiClose"></svg-icon>
          </button>
        </div>
        <div class="modal-body">
          <div class="print-info-row">
            列印狀態：<strong>{{ printModeLabel }}</strong>
            <span class="print-info-note">（與目前畫面顯示一致）</span>
          </div>
          <div class="print-info-row">
            底圖尺寸：{{ canvasWidth }} × {{ canvasHeight }}（{{ recommendedOrientation === 'landscape' ? '橫幅' : '直幅' }}），建議使用「{{ recommendedOrientation === 'landscape' ? '橫式' : '直式' }}」
          </div>
          <div class="print-orientation-group">
            <div
              :class="['print-orientation-card', { active: printOrientation === 'portrait' }]"
              @click="printOrientation = 'portrait'"
            >
              <div class="orientation-box portrait"></div>
              <div class="orientation-label">
                直式 A3
                <span v-if="recommendedOrientation === 'portrait'" class="orientation-badge">建議</span>
              </div>
            </div>
            <div
              :class="['print-orientation-card', { active: printOrientation === 'landscape' }]"
              @click="printOrientation = 'landscape'"
            >
              <div class="orientation-box landscape"></div>
              <div class="orientation-label">
                橫式 A3
                <span v-if="recommendedOrientation === 'landscape'" class="orientation-badge">建議</span>
              </div>
            </div>
          </div>
          <p class="print-hint">車位與底圖將依原始座標整體等比縮放置入 A3 版面，位置不會位移。</p>
        </div>
        <div class="modal-footer">
          <button @click="doPrint" class="btn btn-primary">
            <svg-icon type="mdi" :path="mdiPrinter" class="icon"></svg-icon> 開始列印
          </button>
        </div>
      </div>
    </div>

    <div
      v-if="selectedSpot"
      class="spot-properties-panel"
      :style="propertiesPanelStyle"
      @mousedown="onPropertiesPanelDragStart"
    >
      <div class="panel-header" style="cursor: move;">
        <h4 style="margin: 0; pointer-events: none;">車位屬性{{ multiSelectedIds.length > 1 ? `（已選 ${multiSelectedIds.length} 個）` : '' }}</h4>
        <button @click="closePropertiesPanel" class="btn-close">
          <svg-icon type="mdi" :path="mdiClose"></svg-icon>
        </button>
      </div>
      <div class="panel-content">
        <div class="form-group">
          <label>車位編號</label>
          <input 
             :value="spotProperties.spotId" 
            @input="updateSpotProperty('spotId', $event.target.value)"
            type="text" 
            class="form-input"
          />
        </div>
        <div class="form-row">
          <div class="form-group">
            <label>X 座標</label>
            <input 
               :value="spotProperties.x" 
              @input="updateSpotProperty('x', Number($event.target.value))"
              type="number" 
              class="form-input"
            />
          </div>
          <div class="form-group">
            <label>Y 座標</label>
            <input 
               :value="spotProperties.y" 
              @input="updateSpotProperty('y', Number($event.target.value))"
              type="number" 
              class="form-input"
            />
          </div>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label>寬度</label>
            <input 
               :value="spotProperties.width" 
              @input="updateSpotProperty('width', Number($event.target.value))"
              type="number" 
              class="form-input"
            />
          </div>
          <div class="form-group">
            <label>高度</label>
            <input 
               :value="spotProperties.height" 
              @input="updateSpotProperty('height', Number($event.target.value))"
              type="number" 
              class="form-input"
            />
          </div>
        </div>
        <div class="form-group">
          <label>旋轉角度</label>
          <input 
             :value="spotProperties.rotation" 
            @input="updateSpotProperty('rotation', Number($event.target.value))"
            type="number" 
            step="1"
            class="form-input"
          />
        </div>
        <div class="panel-actions">
          <button @click="deleteSelectedSpot" class="btn btn-danger btn-sm">
            <svg-icon type="mdi" :path="mdiTrashCanOutline" class="icon"></svg-icon> 刪除車位{{ multiSelectedIds.length > 1 ? `（${multiSelectedIds.length} 個）` : '' }}
          </button>
        </div>
      </div>
    </div>

    <div class="zoom-controls">
      <button @click="zoomIn" class="zoom-btn" :disabled="canvasScale >= 2" title="放大 (Ctrl+滾輪)">
        <svg-icon type="mdi" :path="mdiPlus"></svg-icon>
      </button>
      <div class="zoom-percent" title="目前縮放比例">{{ Math.round(canvasScale * 100) }}%</div>
      <button @click="zoomOut" class="zoom-btn" :disabled="canvasScale <= 0.2" title="縮小 (Ctrl+滾輪)">
        <svg-icon type="mdi" :path="mdiMinus"></svg-icon>
      </button>
      <div class="zoom-divider"></div>
      <button @click="fitToScreen" class="zoom-btn zoom-btn-fit" title="最適大小（縮放至符合視窗寬度）">
        <svg-icon type="mdi" :path="mdiFitToScreenOutline"></svg-icon>
        <span class="zoom-fit-label">最適</span>
      </button>
    </div>

    <div class="floor-chip-group">
      <button
        v-for="plan in availableFloorPlans"
        :key="plan.id"
        @click="switchFloor(plan)"
        :class="['btn', 'btn-sm', { 'btn-active': plan.id === floorPlan.id }]"
      >
        {{ plan.floor }}
      </button>
    </div>

    <!-- 車位詳細資訊 Modal -->
    <div v-if="showDetailModal && selectedDetailSpot" class="modal-overlay detail-modal-overlay" @click.self="closeDetailModal">
      <div class="modal-content detail-modal-content">
        <div class="modal-header detail-header">
          <div class="d-flex align-center" style="gap: 12px;">
            <span class="detail-title-icon"><svg-icon type="mdi" :path="mdiCarSide" :size="16"></svg-icon></span>
            <h3 class="mb-0 detail-title">{{ selectedDetailSpot.parkingData.number || selectedDetailSpot.spotId }}</h3>
            <span 
              class="status-chip" 
              :style="getDetailStatusStyle(selectedDetailSpot.parkingData)"
            >
              {{ contextMode === 'sales' ? (selectedDetailSpot.parkingData.status_backend || '未設定') : (selectedDetailSpot.parkingData.status || '未設定') }}
            </span>
            <span
              v-if="contextMode === 'sales' && getSpotTierMeta(selectedDetailSpot.parkingData).occupied"
              class="status-chip tier-chip"
              :style="{ backgroundColor: getSpotTierMeta(selectedDetailSpot.parkingData).color, color: '#fff', padding: '3px 9px', borderRadius: '999px', fontSize: '11.5px', fontWeight: '600' }"
            >{{ getSpotTierMeta(selectedDetailSpot.parkingData).label }}</span>
          </div>
          <div class="d-flex align-center" style="gap: 8px;">
            <button
              v-if="canEditParking && selectedDetailSpot.parkingData.id"
              @click="openParkingEditDialog"
              class="btn-close detail-close-btn detail-edit-btn"
              title="編輯車位資料"
            >
              <svg-icon type="mdi" :path="mdiPencil"></svg-icon>
            </button>
            <button @click="closeDetailModal" class="btn-close detail-close-btn">
              <svg-icon type="mdi" :path="mdiClose"></svg-icon>
            </button>
          </div>
        </div>
        
        <div class="modal-body detail-body">
          <!-- 報價模式且已售/來賓車位 -->
          <template v-if="contextMode === 'quote' && ['已售', '來賓車位'].includes(selectedDetailSpot.parkingData.status)">
            <div class="info-section">
              <div class="section-title">基本資訊</div>
              <div class="info-row">
                <span class="info-label">樓層</span>
                <span class="info-value">{{ selectedDetailSpot.parkingData.floor || '—' }}</span>
              </div>
              <div class="info-row">
                <span class="info-label">類型</span>
                <span class="info-value">{{ selectedDetailSpot.parkingData.type || '—' }}</span>
              </div>
              <div class="info-row">
                <span class="info-label">形式</span>
                <span class="info-value">{{ selectedDetailSpot.parkingData.type2 || '—' }}</span>
              </div>
              <div class="info-row">
                <span class="info-label">尺寸</span>
                <span class="info-value">{{ selectedDetailSpot.parkingData.size || '—' }}</span>
              </div>
              <div class="info-row">
                <span class="info-label">車位面積</span>
                <span class="info-value">{{ selectedDetailSpot.parkingData.area ? `${selectedDetailSpot.parkingData.area} m²` : '—' }}</span>
              </div>
              <div class="info-row">
                <span class="info-label">車位面積（坪）</span>
                <span class="info-value">{{ selectedDetailSpot.parkingData.area_ping ? `${selectedDetailSpot.parkingData.area_ping} 坪` : '—' }}</span>
              </div>
            </div>
            <div class="info-section">
              <div class="section-title">價格資訊</div>
              <div class="info-row" style="justify-content: center; padding: 1.5rem 0;">
                <span class="text-h5 font-weight-black" :style="{ color: selectedDetailSpot.parkingData.status === '來賓車位' ? '#0d6efd' : '#dc3545' }">{{ selectedDetailSpot.parkingData.status }}</span>
              </div>
            </div>
          </template>

          <!-- 報價模式且未售 -->
          <template v-else-if="contextMode === 'quote'">
            <div class="info-section">
              <div class="section-title">基本資訊</div>
              <div class="info-row">
                <span class="info-label">樓層</span>
                <span class="info-value">{{ selectedDetailSpot.parkingData.floor || '—' }}</span>
              </div>
              <div class="info-row">
                <span class="info-label">類型</span>
                <span class="info-value">{{ selectedDetailSpot.parkingData.type || '—' }}</span>
              </div>
              <div class="info-row">
                <span class="info-label">形式</span>
                <span class="info-value">{{ selectedDetailSpot.parkingData.type2 || '—' }}</span>
              </div>
              <div class="info-row">
                <span class="info-label">尺寸</span>
                <span class="info-value">{{ selectedDetailSpot.parkingData.size || '—' }}</span>
              </div>
              <div class="info-row">
                <span class="info-label">車位面積</span>
                <span class="info-value">{{ selectedDetailSpot.parkingData.area ? `${selectedDetailSpot.parkingData.area} m²` : '—' }}</span>
              </div>
              <div class="info-row">
                <span class="info-label">車位面積（坪）</span>
                <span class="info-value">{{ selectedDetailSpot.parkingData.area_ping ? `${selectedDetailSpot.parkingData.area_ping} 坪` : '—' }}</span>
              </div>
            </div>
            <div class="info-section">
              <div class="section-title">價格資訊</div>
              <div class="info-row">
                <span class="info-label">車位價格</span>
                <span class="info-value">{{ selectedDetailSpot.parkingData.price_list ? `${selectedDetailSpot.parkingData.price_list} 萬` : '未設定' }}</span>
              </div>
            </div>
          </template>

          <!-- 銷控模式 -->
          <template v-else-if="contextMode === 'sales'">
            <div class="info-section">
              <div class="section-title">基本資訊</div>
              <div class="info-row">
                <span class="info-label">樓層</span>
                <span class="info-value">{{ selectedDetailSpot.parkingData.floor || '—' }}</span>
              </div>
              <div class="info-row">
                <span class="info-label">類型</span>
                <span class="info-value">{{ selectedDetailSpot.parkingData.type || '—' }}</span>
              </div>
              <div class="info-row">
                <span class="info-label">形式</span>
                <span class="info-value">{{ selectedDetailSpot.parkingData.type2 || '—' }}</span>
              </div>
              <div class="info-row">
                <span class="info-label">尺寸</span>
                <span class="info-value">{{ selectedDetailSpot.parkingData.size || '—' }}</span>
              </div>
              <div class="info-row">
                <span class="info-label">車位面積</span>
                <span class="info-value">{{ selectedDetailSpot.parkingData.area ? `${selectedDetailSpot.parkingData.area} m²` : '—' }}</span>
              </div>
              <div class="info-row">
                <span class="info-label">車位面積（坪）</span>
                <span class="info-value">{{ selectedDetailSpot.parkingData.area_ping ? `${selectedDetailSpot.parkingData.area_ping} 坪` : '—' }}</span>
              </div>
            </div>
            <div class="info-section">
              <div class="section-title">價格資訊</div>
              <div class="info-row">
                <span class="info-label">表價</span>
                <span class="info-value font-weight-bold">{{ selectedDetailSpot.parkingData.price_list ? `${selectedDetailSpot.parkingData.price_list} 萬` : '—' }}</span>
              </div>
              <div class="info-row">
                <span class="info-label" style="color: #dc3545;">底價</span>
                <span class="info-value font-weight-bold" style="color: #dc3545;">{{ selectedDetailSpot.parkingData.price_floor ? `${selectedDetailSpot.parkingData.price_floor} 萬` : '—' }}</span>
              </div>
              <div class="info-row">
                <span class="info-label" style="color: #198754;">成交價</span>
                <span class="info-value font-weight-bold" style="color: #198754;">{{ selectedDetailSpot.parkingData.price_transaction ? `${selectedDetailSpot.parkingData.price_transaction} 萬` : '—' }}</span>
              </div>
            </div>
            <!-- 成交資訊：後台狀態屬已訂／已簽（或已售、有買方資料）即顯示；並讀取關聯戶別補上電話、戶別狀態與小訂／補足／簽約日期 -->
            <div class="info-section" v-if="hasDealInfo(selectedDetailSpot.parkingData)">
              <div class="section-title">
                成交資訊
                <span v-if="linkedHouseholdLoading" class="section-title-hint">讀取戶別資料…</span>
              </div>
              <div class="info-row">
                <span class="info-label">買方戶別</span>
                <span class="info-value">{{ selectedDetailSpot.parkingData.buyerUnitId || '—' }}</span>
              </div>
              <div class="info-row" v-if="linkedHousehold?.status_backend">
                <span class="info-label">戶別狀態</span>
                <span class="info-value">{{ linkedHousehold.status_backend }}</span>
              </div>
              <div class="info-row">
                <span class="info-label">買方姓名</span>
                <span class="info-value">{{ selectedDetailSpot.parkingData.buyerName || linkedHousehold?.buyerName || '—' }}</span>
              </div>
              <div class="info-row" v-if="linkedHousehold?.buyerPhone">
                <span class="info-label">買方電話</span>
                <span class="info-value"><a :href="`tel:${linkedHousehold.buyerPhone}`" class="info-link">{{ linkedHousehold.buyerPhone }}</a></span>
              </div>
              <div class="info-row">
                <span class="info-label">銷售人員</span>
                <span class="info-value">{{ dealSalespersons(selectedDetailSpot.parkingData) }}</span>
              </div>
              <div class="info-row" v-for="step in dealTimeline" :key="step.key">
                <span class="info-label">{{ step.label }}日期</span>
                <span class="info-value" :class="{ 'info-value--muted': !step.date }">{{ step.date || '未填' }}</span>
              </div>
              <div class="info-row" v-if="selectedDetailSpot.parkingData.remarks">
                <span class="info-label">車位備註</span>
                <span class="info-value info-value--wrap">{{ selectedDetailSpot.parkingData.remarks }}</span>
              </div>
              <div class="info-row" v-if="formatDealDate(selectedDetailSpot.parkingData.updatedAt)">
                <span class="info-label">最後更新</span>
                <span class="info-value info-value--muted">{{ formatDealDate(selectedDetailSpot.parkingData.updatedAt) }}</span>
              </div>
            </div>
            <!-- 保留資訊：暫時保留層級才顯示 -->
            <div class="info-section info-section--hold" v-if="contextMode === 'sales' && getSpotHold(selectedDetailSpot.parkingData)">
              <div class="section-title">保留資訊</div>
              <div class="info-row">
                <span class="info-label">保留人</span>
                <span class="info-value">{{ getSpotHold(selectedDetailSpot.parkingData).reservedBy || selectedDetailSpot.parkingData.buyerName || '—' }}</span>
              </div>
              <div class="info-row">
                <span class="info-label">保留到期</span>
                <span class="info-value" :style="getSpotHold(selectedDetailSpot.parkingData).overdue ? 'color:#c62828;font-weight:700' : ''">
                  {{ getSpotHold(selectedDetailSpot.parkingData).reservedUntil || '未設定' }}
                  <template v-if="getSpotHold(selectedDetailSpot.parkingData).overdue">（已逾期 {{ getSpotHold(selectedDetailSpot.parkingData).daysOverdue }} 天）</template>
                </span>
              </div>
              <div class="info-row">
                <span class="info-label">已保留</span>
                <span class="info-value">{{ getSpotHold(selectedDetailSpot.parkingData).daysHeld !== null ? `${getSpotHold(selectedDetailSpot.parkingData).daysHeld} 天` : '—' }}</span>
              </div>
              <div class="info-row" v-if="getSpotHold(selectedDetailSpot.parkingData).reservedNote">
                <span class="info-label">保留備註</span>
                <span class="info-value">{{ getSpotHold(selectedDetailSpot.parkingData).reservedNote }}</span>
              </div>
            </div>
          </template>
        </div>

        <!-- 報價模式：由「為戶別選擇車位」開啟時，資訊卡底部可直接把此車位加入該戶別 -->
        <div v-if="contextMode === 'quote' && quoteUnitId" class="detail-foot">
          <!-- 已加入：可直接取消選取（同步從選擇器已選清單移除） -->
          <template v-if="isQuoteSpotAdded(selectedDetailSpot)">
            <div class="detail-foot-added">
              <svg-icon type="mdi" :path="mdiCheck" :size="15"></svg-icon>
              已加入『{{ quoteUnitId }}』的車位
            </div>
            <button class="mac-btn mac-btn--danger mac-btn--lg mac-btn--block" @click="removeSpotFromQuote">
              <svg-icon type="mdi" :path="mdiClose" :size="16"></svg-icon>
              取消選取此車位
            </button>
          </template>
          <button v-else-if="isQuoteSpotSelectable(selectedDetailSpot.parkingData)" class="mac-btn mac-btn--primary mac-btn--lg mac-btn--block" @click="addSpotToQuote">
            <svg-icon type="mdi" :path="mdiPlus" :size="16"></svg-icon>
            為『{{ quoteUnitId }}』加入此車位
          </button>
          <div v-else class="detail-foot-note">此車位為「{{ selectedDetailSpot.parkingData.status }}」，無法加入報價</div>
        </div>
      </div>
    </div>

    <!-- 編輯車位資料（沿用車位銷控管理的共用編輯元件與更新邏輯） -->
    <ParkingSpotEditDialog
      v-model="showParkingEditDialog"
      :parking="selectedDetailSpot?.parkingData"
      :tier-overrides="tierOverrides"
      @saved="handleParkingEditSaved"
    />

  </div>
</template>

<script>
import { ref, onMounted, onUnmounted, watch, nextTick, computed } from 'vue' 
import VueDragResizeRotate from '@gausszhou/vue3-drag-resize-rotate'
import { db } from '@/firebase' 
import SvgIcon from '@jamescoyle/vue-icon';
import {
   getSalesParkingsByFloorForManager, 
   getSpotLayoutsAPI,
   getFloorPlansAPI,
   getHouseholdByUnitId,
} from '@/api'; 
import {
  mdiDownload,
  mdiLoading,
  mdiClose,
  mdiTrashCanOutline,
  mdiArrowExpandAll,
  mdiMinus,
  mdiPlus,
  mdiFitToScreenOutline,
  mdiPrinter,
  mdiPencil,
  mdiCheck,
  mdiCarSide,
  mdiCheckBold,
} from '@mdi/js';
import { useToast } from 'vue-toastification';
import { formatSalespersons } from '@/utils/salespersonUtils';
import { classifyCommitment, COMMITMENT_TIERS } from '@/utils/salesStatusGroups';
import { buildHeldEntry, todayKey } from '@/composables/useParkingRatio';
import { useUserStore } from '@/store/user';
import ParkingSpotEditDialog from '@/components/ParkingSpotEditDialog.vue';

export default {
  name: 'ParkingCanvas',
  components: {
    SvgIcon,
    VueDragResizeRotate,
    ParkingSpotEditDialog,
  },
  props: {
    floorPlan: {
      type: Object,
      required: true
    },
    projectId: {
      type: String,
      required: true
    },
    previewMode: {
      type: Boolean,
      default: false
    },
    displayMode: {
      type: String,
      default: 'backend'
    },
    textStyles: {
      type: Object,
      default: () => ({})
    },
    statusColors: {
      type: Object,
      default: () => ({})
    },
    // 建案在銷控設定指定的確定度層級覆蓋表 { 狀態名稱: tier }
    tierOverrides: {
      type: Object,
      default: () => ({})
    },
    showTools: {
      type: Boolean,
      default: true
    },
    allowImport: {
      type: Boolean,
      default: true 
    },
    allowAdjustAll: {
      type: Boolean,
      default: true 
    },
    showStatusToggle: {
      type: Boolean,
      default: true 
    },
    contextMode: {
      type: String,
      default: 'sales',
      validator: (v) => ['sales', 'quote'].includes(v)
    },
    // 報價模式：由「為戶別選擇車位」開啟時帶入的戶別，資訊卡底部顯示「為『戶別』加入此車位」
    // Why: 原本在車位銷控看中車位後，得關掉畫布回選擇器再從下拉找一次；這裡直接在資訊卡一鍵加入。
    quoteUnitId: {
      type: String,
      default: ''
    },
    // 該戶別目前已選的車位編號，用來把按鈕切成「已加入」
    quoteSelectedIds: {
      type: Array,
      default: () => []
    },
    // 選擇器已解鎖「已售可選」時，資訊卡也允許加入已售車位
    quoteAllowSold: {
      type: Boolean,
      default: false
    },
    // macOS 風格標題列：有標題才渲染；狀態切換／樓層／列印會整合進標題列，原四角浮動按鈕隱藏
    headerTitle: {
      type: String,
      default: ''
    },
    // 標題列左側是否顯示關閉鈕（emit 'close' 由宿主關閉全螢幕視窗）
    showClose: {
      type: Boolean,
      default: false
    }
  },
  emits: ['spots-changed', 'canvas-ready', 'zoom-changed', 'pan-changed', 'update:displayMode', 'floor-switched', 'add-to-quote', 'remove-from-quote', 'close'],
  setup(props, { emit }) {
    const toast = useToast(); 

    // 車位屬性面板 拖曳狀態
    const propertiesPanelStyle = ref({
      top: '20px',
      right: '250px',
    });
    const isDraggingPropertiesPanel = ref(false);
    const propertiesDragStartX = ref(0);
    const propertiesDragStartY = ref(0);
    const propertiesInitialX = ref(0);
    const propertiesInitialY = ref(0);

    // 畫布 DOM ref
    const canvasWidth = ref(1700) 
    const canvasHeight = ref(850) 
    const canvasAreaRef = ref(null)
    const containerRef = ref(null) 
    const headerRef = ref(null)
    const hasHeader = computed(() => !!props.headerTitle)
    const canvasScale = ref(1) 
    const canvasAreaStyle = computed(() => ({
      width: `${canvasWidth.value}px`,
      height: `${canvasHeight.value}px`,
      transform: `scale(${canvasScale.value})`,
      transformOrigin: 'top left',
    }));
    // 包裹層以縮放後尺寸佔位，讓捲動範圍與視覺一致
    const zoomWrapperStyle = computed(() => ({
      width: `${canvasWidth.value * canvasScale.value}px`,
      height: `${canvasHeight.value * canvasScale.value}px`,
    }));

    // 車位狀態 ref
    const spotLayouts = ref([])
    const selectedSpotId = ref(null)
    const selectedSpot = ref(null)
    const spotProperties = ref({})

    // 多選狀態：multiSelectedIds 含主選取（selectedSpotId）在內的所有選取車位
    const multiSelectedIds = ref([])
    const isShiftDown = ref(false)

    // 框選（滑鼠圈選）狀態
    const marqueeRect = ref(null)
    let marqueeStartX = 0
    let marqueeStartY = 0
    let marqueeBaseIds = []
    let marqueeMoved = false
    let marqueeActive = false

    // 背景圖/匯入 ref
    const bgImageUrl = ref(null) 
    const bgImageStyles = ref({}) 
    const importDialog = ref(false)
    const loading = ref(false)
    const importing = ref(false)
    const previewParkings = ref([])
    const totalParkingCount = ref(0)
    const allParkingData = ref([])

    const showAdjustAllPanel = ref(false);
    const adjustAllWidth = ref(100);
    const adjustAllHeight = ref(100);

    const availableFloorPlans = ref([]);
    const isCanvasLoading = ref(true);

    const showDetailModal = ref(false);
    const selectedDetailSpot = ref(null);

    // 車位資料編輯（後台/銷控模式限定）：沿用車位銷控管理的共用編輯元件
    const userStore = useUserStore();
    const showParkingEditDialog = ref(false);
    // 權限標準與銷控系統其他管理功能一致：系統/超級管理員，或具該案「銷控系統」權限
    const canEditParking = computed(() => {
      if (!props.previewMode || props.contextMode !== 'sales') return false;
      const roles = userStore.user?.roles || [];
      if (roles.includes('超級管理員') || roles.includes('系統管理員')) return true;
      return userStore.user?.permissions?.[props.projectId]?.systems?.includes('銷控系統') || false;
    });

    const openParkingEditDialog = () => {
      if (!selectedDetailSpot.value?.parkingData?.id) return;
      showParkingEditDialog.value = true;
    };

    const handleParkingEditSaved = (updated) => {
      if (!selectedDetailSpot.value?.parkingData) return;
      // parkingData 與 allParkingData 內為同一物件參照，就地合併即可同步畫布與詳細視窗
      const { docId, id, ...fields } = updated;
      Object.assign(selectedDetailSpot.value.parkingData, fields);
      // 買方戶別可能被改掉：重新讀取關聯戶別的成交進度（快取先清，確保拿到最新）
      if (fields.buyerUnitId) householdCache.delete(fields.buyerUnitId);
      loadLinkedHousehold(selectedDetailSpot.value.parkingData);
    };

    // 車位確定度層級（已簽約／已訂未簽／暫時保留…）與保留資訊：供畫布虛線框、逾期角標與詳情視窗辨識
    const getSpotTier = (data) => classifyCommitment(data?.status_backend, props.tierOverrides || {});
    const getSpotTierMeta = (data) => COMMITMENT_TIERS[getSpotTier(data)] || COMMITMENT_TIERS.available;
    const isSpotHeld = (data) => props.displayMode === 'backend' && !!data && getSpotTier(data) === 'held';
    const isSpotBooked = (data) => props.displayMode === 'backend' && !!data && getSpotTier(data) === 'booked';
    const getSpotHold = (data) => {
      if (!data || getSpotTier(data) !== 'held') return null;
      return buildHeldEntry(data, 'held', todayKey());
    };

    const handleSpotClick = (spot) => {
      if (!props.previewMode || !spot.parkingData) return;
      if (panMoved) return; // 剛才是抓住拖曳，不當成點選車位
      console.log('[ParkingCanvas] handleSpotClick - contextMode:', props.contextMode, '| displayMode:', props.displayMode);
      selectedDetailSpot.value = spot;
      showDetailModal.value = true;
    };

    const closeDetailModal = () => {
      showDetailModal.value = false;
      selectedDetailSpot.value = null;
    };

    // ── 後台狀態資訊卡：成交資訊（戶別／買方／銷售人員／成交進度） ──
    // Why: 車位文件只存買方戶別、姓名、銷售人員；電話與小訂／補足／簽約日期在戶別文件，開卡時依 buyerUnitId 補讀。
    const linkedHousehold = ref(null);
    const linkedHouseholdLoading = ref(false);
    const householdCache = new Map(); // unitId → household（同一次開啟畫布內快取，避免重複查詢）
    let householdFetchSeq = 0;

    const hasDealInfo = (data) => {
      if (!data || props.contextMode !== 'sales') return false;
      const tier = getSpotTier(data);
      if (tier === 'signed' || tier === 'booked') return true;
      if (data.status_backend === '已售') return true;
      const sp = Array.isArray(data.salesperson) ? data.salesperson.length : !!data.salesperson;
      return !!(data.buyerUnitId || data.buyerName || sp);
    };
    const dealSalespersons = (data) => {
      const own = formatSalespersons(data?.salesperson, '、', '');
      if (own) return own;
      return formatSalespersons(linkedHousehold.value?.salesperson, '、', '—');
    };
    // Firestore Timestamp／Date／字串 統一轉 YYYY/MM/DD
    const formatDealDate = (raw) => {
      if (!raw) return '';
      let d = null;
      if (typeof raw?.toDate === 'function') d = raw.toDate();
      else if (typeof raw?.seconds === 'number') d = new Date(raw.seconds * 1000);
      else if (raw instanceof Date) d = raw;
      else if (typeof raw === 'string' || typeof raw === 'number') d = new Date(raw);
      if (!d || Number.isNaN(d.getTime())) return typeof raw === 'string' ? raw : '';
      const pad = n => String(n).padStart(2, '0');
      return `${d.getFullYear()}/${pad(d.getMonth() + 1)}/${pad(d.getDate())}`;
    };
    const dealTimeline = computed(() => {
      const h = linkedHousehold.value;
      if (!h) return [];
      return [
        { key: 'deposit', label: '小訂', date: formatDealDate(h.payment_deposit_date) },
        { key: 'complete', label: '補足', date: formatDealDate(h.payment_complete_date || h.payment_top_up_date) },
        { key: 'contract', label: '簽約', date: formatDealDate(h.payment_contract_date) },
      ];
    });
    const loadLinkedHousehold = async (data) => {
      linkedHousehold.value = null;
      const unitId = data?.buyerUnitId;
      if (!unitId || !props.projectId || !hasDealInfo(data)) return;
      const seq = ++householdFetchSeq;
      if (householdCache.has(unitId)) {
        linkedHousehold.value = householdCache.get(unitId);
        return;
      }
      linkedHouseholdLoading.value = true;
      try {
        const h = await getHouseholdByUnitId(props.projectId, unitId);
        householdCache.set(unitId, h);
        if (seq === householdFetchSeq) linkedHousehold.value = h;
      } catch (err) {
        console.warn('[ParkingCanvas] 讀取關聯戶別失敗:', err);
      } finally {
        if (seq === householdFetchSeq) linkedHouseholdLoading.value = false;
      }
    };
    watch([showDetailModal, selectedDetailSpot], ([open, spot]) => {
      if (open && spot?.parkingData) loadLinkedHousehold(spot.parkingData);
      else linkedHousehold.value = null;
    });

    // ── 報價模式：資訊卡「為『戶別』加入此車位」 ──
    // 車位文件同時有 spotId 與 number（舊資料只有 number），統一以 spotId 優先作為車位編號
    const quoteSpotKey = (data, fallback = '') => String(data?.spotId || data?.number || fallback || '');
    const isQuoteSpotAdded = (spot) => {
      const key = quoteSpotKey(spot?.parkingData, spot?.spotId);
      return !!key && (props.quoteSelectedIds || []).some(id => String(id) === key);
    };
    // 來賓車位一律不可加入；已售車位只有在選擇器解鎖「已售可選」後才允許
    const isQuoteSpotSelectable = (data) => {
      const status = data?.status;
      if (status === '來賓車位') return false;
      if (status === '已售') return !!props.quoteAllowSold;
      return true;
    };
    // 畫布上的車位是否已加入該戶別（僅報價模式且有帶戶別時標記）
    const isQuotedSpot = (spot) => props.contextMode === 'quote' && !!props.quoteUnitId && isQuoteSpotAdded(spot);
    const addSpotToQuote = () => {
      const spot = selectedDetailSpot.value;
      if (!spot?.parkingData) return;
      emit('add-to-quote', { ...spot.parkingData, spotId: quoteSpotKey(spot.parkingData, spot.spotId) });
      closeDetailModal();
    };
    // 取消選取：回傳車位編號，由選擇器從已選清單移除
    const removeSpotFromQuote = () => {
      const spot = selectedDetailSpot.value;
      if (!spot?.parkingData) return;
      emit('remove-from-quote', quoteSpotKey(spot.parkingData, spot.spotId));
      closeDetailModal();
    };

    const getDetailStatusStyle = (data) => {
      const statusText = props.contextMode === 'sales' ? (data.status_backend || '預設') : (data.status || '預設');
      const colors = {
        '可售': { bg: '#dcfce7', text: '#166534' },
        '已售': { bg: '#fee2e2', text: '#991b1b' },
        '來賓車位': { bg: '#dbeafe', text: '#1e40af' },
        '保留': { bg: '#fef3c7', text: '#92400e' },
        '主管保留': { bg: '#e0e7ff', text: '#3730a3' },
        '預設': { bg: '#f3f4f6', text: '#374151' }
      };
      const cs = colors[statusText] || colors['預設'];
      return {
        backgroundColor: cs.bg,
        color: cs.text,
        padding: '3px 10px',
        borderRadius: '999px',
        fontSize: '12px',
        fontWeight: '600',
        letterSpacing: '0.01em'
      };
    };

    // Methods
    const fitToScreen = () => {
      if (!containerRef.value || !canvasWidth.value || !canvasHeight.value) return;
      const containerW = containerRef.value.clientWidth - 40;
      // 有標題列時扣掉標題列高度，最適縮放才不會把畫布塞到標題列底下
      const containerH = containerRef.value.clientHeight - 40 - (headerRef.value?.offsetHeight || 0);
      // 「最適」與載入預設縮放：同時符合視窗寬度與高度，整張底圖完整顯示（自適應瀏覽器高度）
      const scale = Math.min(containerW / canvasWidth.value, containerH / canvasHeight.value);
      canvasScale.value = Math.max(0.05, parseFloat(scale.toFixed(2)));
    };

    const onPropertiesPanelDragStart = (e) => {
      // 只有按住 panel-header 才能拖曳，避免影響輸入框和滾動條
      if (!e.target.closest('.panel-header') || e.target.closest('button')) return; 
      isDraggingPropertiesPanel.value = true;
      const currentTop = parseInt(propertiesPanelStyle.value.top, 10) || 20;
      const currentRight = parseInt(propertiesPanelStyle.value.right, 10) || 250;
      propertiesInitialY.value = currentTop;
      propertiesInitialX.value = currentRight; 
      propertiesDragStartX.value = e.clientX;
      propertiesDragStartY.value = e.clientY;
      document.addEventListener('mousemove', onPropertiesPanelDragMove);
      document.addEventListener('mouseup', onPropertiesPanelDragEnd);
    };
    const onPropertiesPanelDragMove = (e) => {
      if (!isDraggingPropertiesPanel.value) return;
      const dx = e.clientX - propertiesDragStartX.value;
      const dy = e.clientY - propertiesDragStartY.value;
      propertiesPanelStyle.value.top = `${propertiesInitialY.value + dy}px`;
      propertiesPanelStyle.value.right = `${propertiesInitialX.value - dx}px`; 
    };
    const onPropertiesPanelDragEnd = () => {
      isDraggingPropertiesPanel.value = false;
      document.removeEventListener('mousemove', onPropertiesPanelDragMove);
      document.removeEventListener('mouseup', onPropertiesPanelDragEnd);
    };

    /**
     * [修改] 背景圖載入處理 - 支援 SVG 格式尺寸判定
     */
    const onBgImageLoad = (e) => {
      const img = e.target;
      const isSvg = img.src.toLowerCase().includes('.svg') || img.src.startsWith('data:image/svg+xml');

      if (canvasWidth.value === 1700 && canvasHeight.value === 850) { 
         const noFixedWidth = !bgImageStyles.value.width || bgImageStyles.value.width === '100%' || bgImageStyles.value.width === 'auto';
         const noFixedHeight = !bgImageStyles.value.height || bgImageStyles.value.height === '100%' || bgImageStyles.value.height === 'auto';
         
         if (noFixedWidth && noFixedHeight) {
            let targetWidth = img.naturalWidth;
            let targetHeight = img.naturalHeight;

            // 針對部分無定義寬高的 SVG 進行容錯處理 (瀏覽器預設 naturalWidth 可能為 300)
            if (isSvg && (targetWidth === 0 || targetWidth === 300)) {
               console.log('[Canvas] 偵測到無固定尺寸 SVG，將採用預設畫布寬度或容器比例');
            }

            if (targetWidth > 0) {
              canvasWidth.value = targetWidth;
              canvasHeight.value = targetHeight;
            }
         }
      }
      console.log(`底圖載入完成 (${isSvg ? 'SVG' : 'Bitmap'}): ${canvasWidth.value}x${canvasHeight.value}`);
      nextTick(fitToScreen);
    };

    const handleKeyDown = (event) => {
      if (event.key === 'Shift') isShiftDown.value = true;
      if (showDetailModal.value && event.key === 'Escape') {
        // 編輯車位資料視窗開啟時，Escape 不關閉底下的詳細資訊視窗
        if (!showParkingEditDialog.value) closeDetailModal();
        return;
      }
      // 在輸入框內打字時不觸發畫布快捷鍵
      const tag = event.target && event.target.tagName;
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(tag)) return;
      if (event.key === 'Escape') {
        clearSelection();
        return;
      }
      if (event.key === 'Delete' && !props.previewMode) {
        if (multiSelectedIds.value.length > 0 || selectedSpotId.value) deleteSelectedSpot();
        return;
      }
      const ids = multiSelectedIds.value.length > 0
        ? multiSelectedIds.value
        : (selectedSpotId.value ? [selectedSpotId.value] : []);
      if (ids.length === 0) return;
      const nudgeAmount = event.shiftKey ? 10 : 1;
      let dx = 0, dy = 0;
      switch (event.key) {
        case 'ArrowUp': dy = -nudgeAmount; break;
        case 'ArrowDown': dy = nudgeAmount; break;
        case 'ArrowLeft': dx = -nudgeAmount; break;
        case 'ArrowRight': dx = nudgeAmount; break;
        default: return;
      }
      event.preventDefault();
      spotLayouts.value.forEach(s => {
        if (ids.includes(s.id) && !s.locked) {
          s.x = Math.round(s.x + dx);
          s.y = Math.round(s.y + dy);
        }
      });
      const primary = spotLayouts.value.find(s => s.id === selectedSpotId.value);
      if (primary && spotProperties.value) {
        spotProperties.value.x = primary.x;
        spotProperties.value.y = primary.y;
      }
      emit('spots-changed');
    };

    const handleKeyUp = (event) => {
      if (event.key === 'Shift') isShiftDown.value = false;
    };
    const handleWindowBlur = () => { isShiftDown.value = false; };

    const zoomStep = 0.1;
    const maxZoom = 2.0;
    const minZoom = 0.05; // 與標題列滑桿下限一致（「最適」在大底圖時可能算出 5–20%）
    const zoomIn = () => {
      canvasScale.value = parseFloat(Math.min(maxZoom, canvasScale.value + zoomStep).toFixed(2));
    };
    // Ctrl + 滾輪縮放（不按 Ctrl 時維持原本的捲動行為）
    const onCanvasWheel = (e) => {
      if (!e.ctrlKey) return;
      e.preventDefault();
      if (e.deltaY < 0) zoomIn();
      else zoomOut();
    };
    const zoomOut = () => {
      canvasScale.value = parseFloat(Math.max(minZoom, canvasScale.value - zoomStep).toFixed(2));
    };
    // 標題列滑桿：下限放寬到 5%，涵蓋「最適」在大底圖時算出的小比例
    const zoomSliderMin = 0.05;
    const zoomSliderMax = maxZoom;
    const onZoomSlider = (e) => {
      const pct = Number(e?.target?.value);
      if (!Number.isFinite(pct)) return;
      canvasScale.value = parseFloat(Math.min(zoomSliderMax, Math.max(zoomSliderMin, pct / 100)).toFixed(2));
    };

    const fetchAvailableFloors = async () => {
      if (!props.projectId) return;
      try {
        const result = await getFloorPlansAPI(props.projectId);
        if (result.status === 'success' && result.data) {
          result.data.sort((a, b) => 
            (a.floor || '').localeCompare(b.floor || '', 'zh-Hant', { numeric: true })
          );
          availableFloorPlans.value = result.data;
        } else {
          toast.error(result.message || '無法載入樓層列表');
        }
      } catch (error) {
        toast.error(`載入樓層列表失敗: ${error.message}`);
      }
    };

    const switchFloor = (plan) => {
      if (plan.id === props.floorPlan.id) return; 
      emit('floor-switched', plan);
    };

    const loadBackgroundImage = (url, options = {}) => {
      return new Promise((resolve) => {
        bgImageUrl.value = url;
        const left = options.left ?? 0;
        const top = options.top ?? 0;
        const width = options.width;
        const height = options.height;
        const angle = options.angle ?? 0;
        bgImageStyles.value = {
          left: `${left}px`,
          top: `${top}px`,
          width: width ? `${width}px` : '100%', 
          height: height ? `${height}px` : '100%', 
          transform: `rotate(${angle}deg)`,
          transformOrigin: 'top left',
        };
        if (width) { canvasWidth.value = width; }
        if (height) { canvasHeight.value = height; }
        resolve();
      });
    }

    const loadFloorData = async () => {
      isCanvasLoading.value = true; 
      if (!props.floorPlan || !props.floorPlan.id) {
         isCanvasLoading.value = false;
         return;
      }
      try { 
        if (props.floorPlan.backgroundImageUrl) {
          await loadBackgroundImage(props.floorPlan.backgroundImageUrl, {
            left: props.floorPlan.backgroundImageX,
            top: props.floorPlan.backgroundImageY,
            scaleX: props.floorPlan.backgroundImageScaleX,
            scaleY: props.floorPlan.backgroundImageScaleY,
            angle: props.floorPlan.backgroundImageRotation,
            width: props.floorPlan.backgroundImageWidth, 
            height: props.floorPlan.backgroundImageHeight,
          });
        }
        await fetchSalesParkingsForFloor();
        try {
          const layoutResult = await getSpotLayoutsAPI(props.floorPlan.id, props.projectId);
          if (layoutResult.status === 'success') {
            loadSpotLayouts(layoutResult.layouts || []);
          } else {
            throw new Error(layoutResult.message || '獲取佈局失敗');
          }
        } catch (error) {
           console.error('抓取車位佈局時發生錯誤:', error);
           loadSpotLayouts([]); 
        }
        emit('canvas-ready');
      } catch (err) { 
          toast.error(`載入畫布資料時發生錯誤: ${err.message}`);
      } finally {
          isCanvasLoading.value = false;
      }
    };

    const fetchSalesParkingsForFloor = async () => {
      if (!props.floorPlan || !props.floorPlan.id) return
      loading.value = true
      try {
        const floorValue = (typeof props.floorPlan.floor === 'object' && props.floorPlan.floor !== null)
          ? props.floorPlan.floor.value
          : props.floorPlan.floor;
        const resultData = await getSalesParkingsByFloorForManager(
          props.projectId,
          floorValue
        );
        if (resultData.success) {
          allParkingData.value = resultData.allData || []
          previewParkings.value = resultData.preview || []
          totalParkingCount.value = resultData.total || 0
        }
      } finally {
        loading.value = false
      }
    }

    const getStatusColor = (mode, data) => {
      const statusColors = props.statusColors || {};
      const modeColors = statusColors[mode] || {};
      let statusKey = !data ? 'default' : (mode === 'backend' ? (data.status_backend || 'default') : (['已售', '來賓車位'].includes(data.status) ? data.status : 'default'));
      const defaultColorSet = { backgroundColor: '#f5f5f5', borderColor: '#000000', textColor: '#000000' };
      return modeColors[statusKey] || modeColors.default || defaultColorSet;
    };

    const getSpotStyle = (spot) => {
      const colorSet = getStatusColor(props.displayMode, spot.parkingData);
      return typeof colorSet === 'string' ? { backgroundColor: colorSet, borderColor: '#000000', color: '#000000' } : { backgroundColor: colorSet.backgroundColor, borderColor: colorSet.borderColor, color: colorSet.textColor };
    };

    const getSpotTextStyle = (fieldKey) => {
      const style = props.textStyles[fieldKey] || {};
      return {
        fontSize: style.fontSize ? `${style.fontSize}px` : '10px',
        color: style.fill || '#000',
        fontWeight: style.fontWeight || 'normal',
        fontFamily: style.fontFamily || 'Arial',
        display: 'block', 
        textAlign: 'center',
      };
    };

    const getDisplayFields = (mode, data) => {
      if (!data) return [{ key: 'number', value: 'N/A' }]; 
      const fields = mode === 'backend' ? [{ key: 'number', value: data.number }, { key: 'price', value: data.price_transaction || data.price_list }, { key: 'buyerUnitId', value: data.buyerUnitId }, { key: 'buyerName', value: data.buyerName }, { key: 'salesperson', value: formatSalespersons(data.salesperson, '、', '') }, { key: 'size', value: data.size }, { key: 'type', value: data.type }] : ['已售', '來賓車位'].includes(data.status) ? [{ key: 'number', value: data.number }, { key: 'status', value: data.status }] : [{ key: 'number', value: data.number }, { key: 'price', value: data.price_list }, { key: 'size', value: data.size }, { key: 'type', value: data.type }];
      return fields.filter(f => f.value);
    }
    
    const clearSelection = () => {
      multiSelectedIds.value = [];
      selectedSpotId.value = null;
      selectedSpot.value = null;
    };

    const handleSpotActivated = (spot) => {
      if (props.previewMode) return;
      if (isShiftDown.value) {
        // Shift+點選：切換加入/移出多選
        if (multiSelectedIds.value.includes(spot.id)) {
          multiSelectedIds.value = multiSelectedIds.value.filter(id => id !== spot.id);
          if (selectedSpotId.value === spot.id) {
            const lastId = multiSelectedIds.value[multiSelectedIds.value.length - 1] || null;
            selectedSpotId.value = lastId;
            const last = spotLayouts.value.find(s => s.id === lastId);
            if (last) selectSpot(last);
            else selectedSpot.value = null;
          }
          return;
        }
        multiSelectedIds.value = [...multiSelectedIds.value, spot.id];
      } else if (!multiSelectedIds.value.includes(spot.id)) {
        // 點選已在多選中的車位保留群組（可整組拖曳）；點選群組外車位則收合為單選
        multiSelectedIds.value = [spot.id];
      }
      selectedSpotId.value = spot.id;
      selectSpot(spot);
    };

    const handleSpotDeactivated = () => {
      // 選取的清除交由空白處 mousedown（onMarqueeStart）處理，
      // 這裡不動作，避免 Shift 多選/框選過程中選取被清掉
    };

    // 取得旋轉後的軸對齊外框，供框選碰撞判定
    const getSpotBBox = (spot) => {
      const rad = ((spot.rotation || 0) * Math.PI) / 180;
      const cx = spot.x + spot.width / 2;
      const cy = spot.y + spot.height / 2;
      const hw = Math.abs(Math.cos(rad)) * spot.width / 2 + Math.abs(Math.sin(rad)) * spot.height / 2;
      const hh = Math.abs(Math.sin(rad)) * spot.width / 2 + Math.abs(Math.cos(rad)) * spot.height / 2;
      return { x: cx - hw, y: cy - hh, w: hw * 2, h: hh * 2 };
    };

    const getMarqueeHits = (rect) => {
      return spotLayouts.value
        .filter(spot => {
          const b = getSpotBBox(spot);
          return b.x < rect.x + rect.w && b.x + b.w > rect.x && b.y < rect.y + rect.h && b.y + b.h > rect.y;
        })
        .map(spot => spot.id);
    };

    const toCanvasPoint = (e) => {
      const rect = canvasAreaRef.value.getBoundingClientRect();
      return {
        x: (e.clientX - rect.left) / canvasScale.value,
        y: (e.clientY - rect.top) / canvasScale.value,
      };
    };

    // ── 抓住拖曳平移（pan）──
    // Why: 畫布放大後只能靠捲軸移動，改成像地圖一樣按住即可拖曳；預覽模式用左鍵，編輯模式左鍵保留給框選、改用中鍵。
    const scrollAreaRef = ref(null);
    const isPanning = ref(false);
    let panActive = false;
    let panMoved = false;
    let panStartX = 0, panStartY = 0, panScrollLeft = 0, panScrollTop = 0;

    const onScrollAreaMouseDown = (e) => {
      const wantPan = props.previewMode ? e.button === 0 : e.button === 1;
      if (wantPan) onPanStart(e);
      else onMarqueeStart(e);
    };
    const onPanStart = (e) => {
      const el = scrollAreaRef.value;
      if (!el) return;
      // 點在捲動條上不啟動
      if (e.target === el && (e.offsetX > el.clientWidth || e.offsetY > el.clientHeight)) return;
      panActive = true;
      panMoved = false;
      panStartX = e.clientX;
      panStartY = e.clientY;
      panScrollLeft = el.scrollLeft;
      panScrollTop = el.scrollTop;
      document.addEventListener('mousemove', onPanMove);
      document.addEventListener('mouseup', onPanEnd);
      e.preventDefault();
    };
    const onPanMove = (e) => {
      const el = scrollAreaRef.value;
      if (!panActive || !el) return;
      const dx = e.clientX - panStartX;
      const dy = e.clientY - panStartY;
      // 位移門檻，避免單純點擊被當成拖曳
      if (!panMoved && Math.abs(dx) < 4 && Math.abs(dy) < 4) return;
      panMoved = true;
      isPanning.value = true;
      el.scrollLeft = panScrollLeft - dx;
      el.scrollTop = panScrollTop - dy;
    };
    const onPanEnd = () => {
      panActive = false;
      isPanning.value = false;
      document.removeEventListener('mousemove', onPanMove);
      document.removeEventListener('mouseup', onPanEnd);
      // mouseup 之後緊接著的 click 仍視為拖曳收尾，下一個 tick 才重置
      if (panMoved) setTimeout(() => { panMoved = false; }, 0);
    };

    const onMarqueeStart = (e) => {
      if (props.previewMode || e.button !== 0) return;
      // 點在車位上交給拖曳套件處理
      if (e.target.closest('.parking-spot-item')) return;
      // 點在捲動條上不啟動框選
      if (e.target.classList.contains('canvas-scroll-area') &&
          (e.offsetX > e.target.clientWidth || e.offsetY > e.target.clientHeight)) return;
      if (!canvasAreaRef.value) return;

      marqueeActive = true;
      marqueeMoved = false;
      const p = toCanvasPoint(e);
      marqueeStartX = p.x;
      marqueeStartY = p.y;
      // Shift 框選為累加模式；否則先清空現有選取
      marqueeBaseIds = isShiftDown.value ? [...multiSelectedIds.value] : [];
      if (!isShiftDown.value) clearSelection();

      document.addEventListener('mousemove', onMarqueeMove);
      document.addEventListener('mouseup', onMarqueeEnd);
      e.preventDefault();
    };

    const onMarqueeMove = (e) => {
      if (!marqueeActive || !canvasAreaRef.value) return;
      const p = toCanvasPoint(e);
      const rect = {
        x: Math.min(marqueeStartX, p.x),
        y: Math.min(marqueeStartY, p.y),
        w: Math.abs(p.x - marqueeStartX),
        h: Math.abs(p.y - marqueeStartY),
      };
      // 位移門檻，避免單純點擊誤判為框選
      if (rect.w * canvasScale.value < 4 && rect.h * canvasScale.value < 4 && !marqueeMoved) return;
      marqueeMoved = true;
      marqueeRect.value = rect;
      // 框選過程即時預覽選取結果
      const hits = getMarqueeHits(rect);
      multiSelectedIds.value = [...new Set([...marqueeBaseIds, ...hits])];
    };

    const onMarqueeEnd = () => {
      document.removeEventListener('mousemove', onMarqueeMove);
      document.removeEventListener('mouseup', onMarqueeEnd);
      if (!marqueeActive) return;
      marqueeActive = false;

      if (marqueeMoved && marqueeRect.value) {
        const ids = multiSelectedIds.value;
        if (ids.length > 0) {
          // 以最後一個命中的車位作為主選取（顯示控制點與屬性面板）
          const lastId = ids[ids.length - 1];
          const last = spotLayouts.value.find(s => s.id === lastId);
          if (last) {
            selectedSpotId.value = last.id;
            selectSpot(last);
          }
        }
      }
      marqueeRect.value = null;
    };

    // 群組同步：拖曳時其餘選取車位跟著位移；縮放/旋轉時套用相同尺寸與角度
    const syncGroupTransform = (spot, eventType, dx, dy) => {
      if (multiSelectedIds.value.length <= 1 || !multiSelectedIds.value.includes(spot.id)) return;
      spotLayouts.value.forEach(s => {
        if (s.id === spot.id || !multiSelectedIds.value.includes(s.id) || s.locked) return;
        if ((eventType === 'dragging' || eventType === 'dragstop') && (dx || dy)) {
          s.x = Math.round(s.x + dx);
          s.y = Math.round(s.y + dy);
        }
        if (eventType === 'resizing' || eventType === 'resizestop') {
          s.width = spot.width;
          s.height = spot.height;
        }
        if (eventType === 'rotating' || eventType === 'rotatestop') {
          s.rotation = spot.rotation;
        }
      });
    };

    const applyTransformPayload = (spot, payload, eventType) => {
      const { x, y, w, h, r } = payload;
      const dx = x !== undefined ? Math.round(x) - spot.x : 0;
      const dy = y !== undefined ? Math.round(y) - spot.y : 0;
      if (x !== undefined) spot.x = Math.round(x);
      if (y !== undefined) spot.y = Math.round(y);
      if (w !== undefined) spot.width = Math.round(w);
      if (h !== undefined) spot.height = Math.round(h);
      if (r !== undefined) spot.rotation = Math.round(r);
      syncGroupTransform(spot, eventType, dx, dy);
    };

    const handleTransform = (spotId, payload, eventType) => {
      const spot = spotLayouts.value.find(s => s.id === spotId);
      if (spot) {
        applyTransformPayload(spot, payload, eventType);
        if (selectedSpotId.value !== spotId) {
            selectedSpotId.value = spot.id;
            selectSpot(spot);
        }
        if (eventType === 'dragging') { spotProperties.value.x = spot.x; spotProperties.value.y = spot.y; }
        if (eventType === 'resizing') { spotProperties.value.width = spot.width; spotProperties.value.height = spot.height; spotProperties.value.x = spot.x; spotProperties.value.y = spot.y; }
        if (eventType === 'rotating') { spotProperties.value.rotation = spot.rotation; }
      }
    };

    const handleTransformStop = (spotId, payload, eventType) => {
      const spot = spotLayouts.value.find(s => s.id === spotId);
      if (spot) {
        applyTransformPayload(spot, payload, eventType);
        emit('spots-changed');
      }
    };

    const selectSpot = (spot) => {
      selectedSpot.value = spot;
      spotProperties.value = { spotId: spot.spotId || '', x: Math.round(spot.x), y: Math.round(spot.y), width: Math.round(spot.width), height: Math.round(spot.height), rotation: Math.round(spot.rotation) };
    }

    const updateSpotProperty = (property, value) => {
      if (!selectedSpot.value) return;
      const spot = spotLayouts.value.find(s => s.id === selectedSpot.value.id);
      if (!spot) return;
      switch (property) {
        case 'spotId': spot.spotId = value; if (spot.parkingData) spot.parkingData.number = value; break;
        case 'x': spot.x = Number(value); break;
        case 'y': spot.y = Number(value); break;
        case 'width': spot.width = Number(value); break;
        case 'height': spot.height = Number(value); break;
        case 'rotation': spot.rotation = Number(value); break;
      }
      // 多選時，寬/高/旋轉輸入同步套用到所有選取車位
      if (['width', 'height', 'rotation'].includes(property) && multiSelectedIds.value.length > 1) {
        const key = property === 'rotation' ? 'rotation' : property;
        spotLayouts.value.forEach(s => {
          if (s.id !== spot.id && multiSelectedIds.value.includes(s.id) && !s.locked) {
            s[key] = Number(value);
          }
        });
      }
      spotProperties.value[property] = value;
      emit('spots-changed');
    };

    const deleteSelectedSpot = () => {
      const ids = multiSelectedIds.value.length > 0
        ? multiSelectedIds.value
        : (selectedSpot.value ? [selectedSpot.value.id] : []);
      if (ids.length === 0) return;
      const msg = ids.length > 1 ? `確定要刪除選取的 ${ids.length} 個車位嗎？` : '確定要刪除此車位嗎？';
      if (confirm(msg)) {
        spotLayouts.value = spotLayouts.value.filter(s => !ids.includes(s.id));
        clearSelection();
        emit('spots-changed');
      }
    }
    
    const loadSpotLayouts = (layouts) => {
      spotLayouts.value = layouts.filter(item => item.type !== 'backgroundImage').map(layout => {
        const fullParkingData = allParkingData.value.find(p => p.id === layout.salesParkingId) || { id: layout.salesParkingId, number: layout.spotId, status_backend: '可售', price_list: null, status: null };
        return { id: layout.id || `layout-${layout.salesParkingId || layout.spotId}-${Math.random()}`, isNew: !layout.id, spotId: layout.spotId, x: layout.x || 0, y: layout.y || 0, width: layout.width || 100, height: layout.height || 100, rotation: layout.rotation || 0, locked: false, parkingData: fullParkingData, displayMode: layout.displayMode || props.displayMode };
      });
    };

    const getSpotLayouts = () => {
      return spotLayouts.value.map(spot => ({ id: spot.isNew ? null : spot.id, spotId: spot.spotId, x: Math.round(spot.x), y: Math.round(spot.y), width: Math.round(spot.width), height: Math.round(spot.height), rotation: Math.round(spot.rotation), type: spot.parkingData.id ? 'imported' : 'manual', salesParkingId: spot.parkingData?.id || null, displayMode: spot.displayMode }));
    }

    const openImportModal = async () => { importDialog.value = true; await fetchSalesParkingsForFloor(); }
    const closeImportModal = () => { importDialog.value = false }
    const confirmImport = async () => {
      importing.value = true;
      try {
        spotLayouts.value = spotLayouts.value.filter(s => s.type !== 'imported'); 
        allParkingData.value.forEach((parkingData, index) => {
          spotLayouts.value.push({ id: `imported-${parkingData.id}-${Math.random()}`, isNew: true, spotId: parkingData.number, x: 100 + (index % 10) * 60, y: 100 + (Math.floor(index / 10) * 200), width: 48, height: 105, rotation: 0, locked: false, parkingData: parkingData, type: 'imported', displayMode: props.displayMode });
        });
        emit('spots-changed');
      } finally { importing.value = false; closeImportModal(); }
    };

    const openAdjustAllPanel = () => {
      if (selectedSpot.value) { adjustAllWidth.value = Math.round(selectedSpot.value.width); adjustAllHeight.value = Math.round(selectedSpot.value.height); }
      else if (spotLayouts.value.length > 0) { adjustAllWidth.value = Math.round(spotLayouts.value[0].width); adjustAllHeight.value = Math.round(spotLayouts.value[0].height); }
      showAdjustAllPanel.value = true;
    };
    const applyAdjustAll = () => {
      const newWidth = Number(adjustAllWidth.value), newHeight = Number(adjustAllHeight.value);
      if (newWidth <= 0 || newHeight <= 0) { toast.error('寬度與高度必須大於 0'); return; }
      spotLayouts.value = spotLayouts.value.map(spot => ({ ...spot, width: newWidth, height: newHeight }));
      if (selectedSpot.value) { spotProperties.value.width = newWidth; spotProperties.value.height = newHeight; }
      emit('spots-changed'); closeAdjustAllPanel();
    };

    const switchDisplayMode = (mode) => {
      emit('update:displayMode', mode);
      spotLayouts.value.forEach(spot => { spot.displayMode = mode; });
    }

    // =====================================================
    // 列印車位圖（A3）
    // =====================================================
    const showPrintDialog = ref(false);
    const printOrientation = ref('landscape');
    // 依底圖長寬比建議紙張方向：橫幅底圖建議橫式，直幅底圖建議直式
    const recommendedOrientation = computed(() =>
      canvasWidth.value >= canvasHeight.value ? 'landscape' : 'portrait'
    );
    // 列印狀態必須對應目前畫面的顯示模式，不可交叉（銷售狀態畫面只能印銷售狀態）
    const printModeLabel = computed(() =>
      props.displayMode === 'backend' ? '後台狀態' : '銷售狀態'
    );

    const openPrintDialog = () => {
      printOrientation.value = recommendedOrientation.value;
      showPrintDialog.value = true;
    };
    const closePrintDialog = () => { showPrintDialog.value = false; };

    const doPrint = () => {
      const orientation = printOrientation.value;
      const MM_TO_PX = 96 / 25.4;
      const pageW = orientation === 'landscape' ? 420 : 297;
      const pageH = orientation === 'landscape' ? 297 : 420;
      const marginMm = 8;
      const headerMm = 10;
      const availW = (pageW - marginMm * 2) * MM_TO_PX;
      const availH = (pageH - marginMm * 2 - headerMm) * MM_TO_PX;
      // 整張畫布（含底圖與車位）用同一個縮放係數等比縮入 A3，座標相對位置完全不變
      const scale = Math.min(availW / canvasWidth.value, availH / canvasHeight.value);

      const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

      let bgHtml = '';
      if (bgImageUrl.value) {
        const st = bgImageStyles.value || {};
        bgHtml = `<img src="${esc(bgImageUrl.value)}" style="position:absolute;left:${st.left || '0px'};top:${st.top || '0px'};width:${st.width || '100%'};height:${st.height || '100%'};transform:${st.transform || 'none'};transform-origin:top left;object-fit:contain;" />`;
      }

      const spotsHtml = spotLayouts.value.map(spot => {
        const colorSet = getStatusColor(props.displayMode, spot.parkingData);
        const cs = typeof colorSet === 'string'
          ? { backgroundColor: colorSet, borderColor: '#000000', textColor: '#000000' }
          : colorSet;
        const spans = getDisplayFields(props.displayMode, spot.parkingData).map(f => {
          const ts = props.textStyles[f.key] || {};
          return `<span style="display:block;text-align:center;font-size:${ts.fontSize || 10}px;color:${ts.fill || '#000'};font-weight:${ts.fontWeight || 'normal'};font-family:${ts.fontFamily || 'Arial'};">${esc(f.value)}</span>`;
        }).join('');
        return `<div style="position:absolute;left:${spot.x}px;top:${spot.y}px;width:${spot.width}px;height:${spot.height}px;transform:rotate(${spot.rotation || 0}deg);background-color:${cs.backgroundColor};border:2px solid ${cs.borderColor};color:${cs.textColor};display:flex;flex-direction:column;justify-content:center;align-items:center;padding:4px;box-sizing:border-box;overflow:hidden;font-family:Arial, sans-serif;">${spans}</div>`;
      }).join('');

      const fv = props.floorPlan?.floor;
      const floorLabel = (typeof fv === 'object' && fv !== null) ? fv.value : (fv || '');
      const printTime = new Date().toLocaleString('zh-TW', { timeZone: 'Asia/Taipei', hour12: false });
      const title = `車位銷控圖_${floorLabel}_${printModeLabel.value}`;

      const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>${esc(title)}</title>
<style>
  @page { size: A3 ${orientation}; margin: ${marginMm}mm; }
  * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
  html, body { margin: 0; padding: 0; }
  .print-header { height: ${headerMm}mm; display: flex; align-items: center; justify-content: space-between; font-family: Arial, "Microsoft JhengHei", sans-serif; font-size: 12px; color: #333; }
  .canvas-outer { width: ${Math.floor(canvasWidth.value * scale)}px; height: ${Math.floor(canvasHeight.value * scale)}px; margin: 0 auto; overflow: hidden; }
  .canvas-inner { position: relative; width: ${canvasWidth.value}px; height: ${canvasHeight.value}px; transform: scale(${scale}); transform-origin: top left; background: #ffffff; }
</style>
</head>
<body>
<div class="print-header">
  <span>${esc(floorLabel)} 車位圖</span>
  <span>顯示狀態：${esc(printModeLabel.value)}｜列印時間：${esc(printTime)}</span>
</div>
<div class="canvas-outer"><div class="canvas-inner">${bgHtml}${spotsHtml}</div></div>
<script>
  window.onload = function () { setTimeout(function () { window.print(); }, 200); };
<\/script>
</body>
</html>`;

      const win = window.open('', '_blank');
      if (!win) {
        toast.error('無法開啟列印視窗，請允許彈出視窗後再試一次。');
        return;
      }
      win.document.open();
      win.document.write(html);
      win.document.close();
      showPrintDialog.value = false;
    };
  
    let resizeObserver = null;
    onMounted(async () => {
      await nextTick();
      await fetchAvailableFloors(); 
      await loadFloorData(); 
      if (containerRef.value) {
        resizeObserver = new ResizeObserver(fitToScreen);
        resizeObserver.observe(containerRef.value);
      }
      fitToScreen();
      window.addEventListener('keydown', handleKeyDown);
      window.addEventListener('keyup', handleKeyUp);
      window.addEventListener('blur', handleWindowBlur);
    });

    onUnmounted(() => {
      if (resizeObserver) resizeObserver.disconnect();
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('blur', handleWindowBlur);
      document.removeEventListener('mousemove', onPropertiesPanelDragMove);
      document.removeEventListener('mouseup', onPropertiesPanelDragEnd);
      document.removeEventListener('mousemove', onMarqueeMove);
      document.removeEventListener('mouseup', onMarqueeEnd);
      document.removeEventListener('mousemove', onPanMove);
      document.removeEventListener('mouseup', onPanEnd);
    });

    watch(() => props.floorPlan.id, () => {
      spotLayouts.value = []; bgImageUrl.value = null; canvasScale.value = 1; isCanvasLoading.value = true;
      clearSelection();
      loadFloorData();
    })
    
    watch(() => props.projectId, (newVal, oldVal) => { if (newVal !== oldVal) fetchAvailableFloors(); })

    return {
      containerRef, headerRef, hasHeader, canvasAreaRef, canvasAreaStyle, zoomWrapperStyle, bgImageUrl, bgImageStyles, spotLayouts, selectedSpot, selectedSpotId, spotProperties, importDialog, loading, importing, previewParkings, totalParkingCount, displayMode: computed(() => props.displayMode), floorPlan: computed(() => props.floorPlan), previewMode: computed(() => props.previewMode), contextMode: computed(() => props.contextMode),
      multiSelectedIds, marqueeRect, onMarqueeStart, handleSpotDeactivated,
      scrollAreaRef, isPanning, onScrollAreaMouseDown,
      getSpotLayouts, loadSpotLayouts, updateSpotProperty, closePropertiesPanel: () => selectedSpot.value = null, deleteSelectedSpot, openImportModal, closeImportModal, confirmImport, switchDisplayMode, handleSpotActivated, onBgImageLoad, getSpotStyle, getDisplayFields, getSpotTextStyle, canvasScale, fitToScreen, handleTransform, handleTransformStop, showAdjustAllPanel, adjustAllWidth, adjustAllHeight, openAdjustAllPanel, closeAdjustAllPanel: () => showAdjustAllPanel.value = false, applyAdjustAll, availableFloorPlans, switchFloor, zoomIn, zoomOut, zoomSliderMin, zoomSliderMax, onZoomSlider, isCanvasLoading, propertiesPanelStyle, onPropertiesPanelDragStart,
      showDetailModal, selectedDetailSpot, handleSpotClick, closeDetailModal, getDetailStatusStyle,
      linkedHousehold, linkedHouseholdLoading, hasDealInfo, dealSalespersons, dealTimeline, formatDealDate,
      isQuoteSpotAdded, isQuoteSpotSelectable, addSpotToQuote, removeSpotFromQuote, isQuotedSpot,
      canEditParking, showParkingEditDialog, openParkingEditDialog, handleParkingEditSaved,
      getSpotTier, getSpotTierMeta, isSpotHeld, isSpotBooked, getSpotHold,
      formatSalespersons,
      canvasWidth, canvasHeight,
      showPrintDialog, printOrientation, recommendedOrientation, printModeLabel, openPrintDialog, closePrintDialog, doPrint,
      mdiDownload, mdiLoading, mdiClose, mdiTrashCanOutline, mdiArrowExpandAll, mdiMinus, mdiPlus, mdiFitToScreenOutline, mdiPrinter, mdiPencil, mdiCheck, mdiCarSide, mdiCheckBold,
      onCanvasWheel
    }
  }
}
</script>

<style scoped>
/* 確定度辨識：暫時保留 → 虛線框；逾期 → 右上角紅色角標（後台模式） */
.spot-content.spot-held {
  border-style: dashed;
  position: relative;
}
.spot-content.spot-booked {
  border-style: solid;
}
.spot-hold-badge {
  position: absolute;
  top: -1px;
  right: -1px;
  background: #c62828;
  color: #fff;
  font-size: 9px;
  line-height: 1;
  padding: 2px 4px;
  border-radius: 0 0 0 6px;
  font-weight: 700;
  letter-spacing: 0.02em;
  pointer-events: none;
  animation: spot-hold-blink 1.2s ease-in-out infinite;
}
@keyframes spot-hold-blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.35; }
}
/* 報價模式：已加入該戶別 → 右上角紅底白字打勾 badge ＋ 邊框霓虹光環（呼吸脈動）
   Why: 單靠角落小 badge 在縮小後的畫布上不易辨識，改以外圈光暈讓整格車位一眼可辨，但不改車位底色以免與狀態色混淆。 */
.spot-content.spot-quoted {
  position: relative;
  overflow: visible;
  border-color: #ff2d55 !important;
  animation: spot-quoted-neon 1.6s ease-in-out infinite;
}
/* 與框選、hover 的 box-shadow 錯開：光環放在偽元素上，不受 clickable-spot:hover 覆蓋 */
.spot-content.spot-quoted::before {
  content: '';
  position: absolute;
  inset: -3px;
  border-radius: 4px;
  border: 2px solid #ff2d55;
  pointer-events: none;
  z-index: 1;
  box-shadow:
    0 0 4px #ff2d55,
    0 0 10px #ff2d55,
    0 0 20px rgba(255, 45, 85, 0.75),
    inset 0 0 6px rgba(255, 45, 85, 0.55);
  animation: spot-quoted-neon-ring 1.6s ease-in-out infinite;
}
@keyframes spot-quoted-neon {
  0%, 100% { box-shadow: 0 0 6px rgba(255, 45, 85, 0.9), 0 0 14px rgba(255, 45, 85, 0.7); }
  50% { box-shadow: 0 0 10px rgba(255, 45, 85, 1), 0 0 26px rgba(255, 45, 85, 0.95), 0 0 40px rgba(255, 45, 85, 0.6); }
}
@keyframes spot-quoted-neon-ring {
  0%, 100% { opacity: 0.7; }
  50% { opacity: 1; }
}
.spot-quoted-badge {
  position: absolute;
  top: -8px;
  right: -8px;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: #e0142c;
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 0 0 2px #fff, 0 0 8px rgba(255, 45, 85, 0.9), 0 1px 3px rgba(0, 0, 0, 0.35);
  pointer-events: none;
  z-index: 3;
}
.spot-quoted-badge svg {
  width: 14px;
  height: 14px;
  display: block;
}
.info-section--hold .section-title { color: #b26a00; }
.parking-canvas-container {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden; /* 捲動交給內層 .canvas-scroll-area，功能按鈕才不會被捲走 */
  background-color: #f0f2f5;
}

/* ── macOS 風格標題列（宿主傳入 header-title 時） ── */
.parking-canvas-container.has-header {
  display: flex;
  flex-direction: column;
}
.parking-canvas-container.has-header .canvas-scroll-area {
  flex: 1 1 auto;
  min-height: 0;
  height: auto;
}
/* 已整合進標題列的功能：隱藏原本的浮動工具列、樓層按鈕與縮放鈕 */
.parking-canvas-container.has-header .toolbar,
.parking-canvas-container.has-header .floor-chip-group,
.parking-canvas-container.has-header .zoom-controls {
  display: none;
}
/* 標題列縮放滑桿（macOS 樣式：細軌道、白色圓形拇指） */
.mac-zoom {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  height: 30px;
  padding: 0 6px;
  border-radius: 8px;
  background: rgba(0, 0, 0, 0.06);
}
.mac-zoom-btn,
.mac-zoom-fit {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 3px;
  height: 24px;
  min-width: 24px;
  padding: 0 4px;
  border: 0;
  border-radius: 6px;
  background: transparent;
  color: #1d1d1f;
  font-family: inherit;
  font-size: 12.5px;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.12s;
}
.mac-zoom-btn:hover:not(:disabled),
.mac-zoom-fit:hover { background: rgba(0, 0, 0, 0.06); }
.mac-zoom-btn:disabled { opacity: 0.35; cursor: default; }
.mac-zoom-fit { color: #0071e3; padding: 0 7px; }
.mac-zoom-percent {
  min-width: 38px;
  text-align: right;
  font-size: 11.5px;
  font-weight: 600;
  color: #6e6e73;
  font-variant-numeric: tabular-nums;
}
.mac-zoom-slider {
  -webkit-appearance: none;
  appearance: none;
  width: 120px;
  height: 4px;
  margin: 0 2px;
  border-radius: 2px;
  background: linear-gradient(90deg, #0071e3 0%, #0071e3 var(--zoom-fill, 50%), rgba(0, 0, 0, 0.18) var(--zoom-fill, 50%));
  outline: none;
  cursor: pointer;
}
.mac-zoom-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: #fff;
  border: 0;
  box-shadow: 0 0 0 0.5px rgba(0, 0, 0, 0.2), 0 1px 3px rgba(0, 0, 0, 0.3);
  cursor: grab;
}
.mac-zoom-slider::-webkit-slider-thumb:active { cursor: grabbing; }
.mac-zoom-slider::-moz-range-thumb {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: #fff;
  border: 0;
  box-shadow: 0 0 0 0.5px rgba(0, 0, 0, 0.2), 0 1px 3px rgba(0, 0, 0, 0.3);
  cursor: grab;
}
.mac-zoom-slider::-moz-range-track { height: 4px; border-radius: 2px; background: transparent; }
@media (max-width: 600px) {
  .mac-zoom-slider { width: 90px; }
  .mac-zoom-fit span { display: none; }
}
.mac-titlebar {
  position: relative;
  z-index: 11;
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px 12px;
  min-height: 48px;
  padding: 6px 12px 6px 10px;
  background: #f6f6f8;
  border-bottom: 1px solid rgba(0, 0, 0, 0.08);
  font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", "Helvetica Neue", "PingFang TC", "Noto Sans TC", sans-serif;
  color: #1d1d1f;
  user-select: none;
  flex: 0 0 auto;
}
.mac-titlebar-lead {
  display: flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
}
.mac-titlebar-title {
  font-size: 14px;
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.mac-titlebar-close {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border: 0;
  border-radius: 7px;
  background: transparent;
  color: #6e6e73;
  cursor: pointer;
  flex: 0 0 auto;
  transition: background-color 0.12s, color 0.12s;
}
.mac-titlebar-close:hover { background: rgba(0, 0, 0, 0.06); color: #1d1d1f; }
.mac-titlebar-tools {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
  margin-left: auto;
  min-width: 0;
}
/* 分段控制（segmented control）：灰底膠囊，選中項白底細陰影 */
.mac-seg {
  display: inline-flex;
  align-items: center;
  gap: 2px;
  padding: 2px;
  border-radius: 8px;
  background: rgba(0, 0, 0, 0.06);
  max-width: 100%;
}
.mac-seg-btn {
  height: 26px;
  padding: 0 11px;
  border: 0;
  border-radius: 6px;
  background: transparent;
  color: #1d1d1f;
  font-family: inherit;
  font-size: 13px;
  font-weight: 500;
  line-height: 1;
  white-space: nowrap;
  cursor: pointer;
  transition: background-color 0.12s, box-shadow 0.12s, color 0.12s;
  -webkit-tap-highlight-color: transparent;
}
.mac-seg-btn:hover:not(.is-active) { background: rgba(0, 0, 0, 0.04); }
.mac-seg-btn.is-active {
  background: #fff;
  font-weight: 600;
  box-shadow: 0 0.5px 1px rgba(0, 0, 0, 0.2), 0 0 0 0.5px rgba(0, 0, 0, 0.06);
}
/* 樓層很多時橫向捲動，不撐爆標題列 */
.mac-seg--floors {
  overflow-x: auto;
  scrollbar-width: none;
  flex: 0 1 auto;
}
.mac-seg--floors::-webkit-scrollbar { display: none; }
.mac-seg--floors .mac-seg-btn { font-variant-numeric: tabular-nums; }

@media (max-width: 600px) {
  .mac-titlebar { padding: 6px 8px; gap: 6px 8px; }
  .mac-titlebar-title { font-size: 13.5px; }
  .mac-titlebar-tools { margin-left: 0; width: 100%; }
  .mac-titlebar-tools .mac-btn { margin-left: auto; }
}

.canvas-scroll-area.pan-enabled { cursor: grab; }
.canvas-scroll-area.is-panning,
.canvas-scroll-area.is-panning * { cursor: grabbing !important; user-select: none; }

.canvas-scroll-area {
  width: 100%;
  height: 100%;
  overflow: auto;
  display: flex;
  justify-content: flex-start;
  align-items: flex-start;
  padding: 20px;
  box-sizing: border-box;
}

/* 以縮放後的實際尺寸佔位：捲動範圍與視覺一致；
   margin: auto 在空間足夠時置中、內容超出時自動歸零維持可捲動 */
.canvas-zoom-wrapper {
  position: relative;
  flex-shrink: 0;
  margin: auto;
}

:deep(.parking-spot-item) {
  position: absolute !important;
}

.parking-canvas-area {
  position: absolute;
  top: 0;
  left: 0;
  background-color: #ffffff;
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
  border: 1px solid #d9d9d9;
  flex-shrink: 0;
}

.background-image {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  object-fit: contain;
  z-index: 0; 
  pointer-events: none; 
  /* 確保 SVG 縮放時銳利不模糊 */
  image-rendering: -webkit-optimize-contrast;
  image-rendering: crisp-edges;
}

.marquee-box {
  position: absolute;
  border: 1.5px dashed #007bff;
  background: rgba(0, 123, 255, 0.08);
  z-index: 50;
  pointer-events: none;
}

.spot-content.multi-selected {
  outline: 2px dashed #007bff;
  outline-offset: 2px;
  box-shadow: 0 0 0 4px rgba(0, 123, 255, 0.15);
}

.spot-content {
  width: 100%;
  height: 100%;
  border: 2px solid;
  background-color: #fff; 
  color: #000; 
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: 4px;
  box-sizing: border-box;
  overflow: hidden;
  font-family: Arial, sans-serif;
  user-select: none; 
}

.toolbar {
  position: absolute;
  top: 16px;
  left: 16px;
  z-index: 10;
  display: flex;
  gap: 1rem;
  background: white;
  padding: 8px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.15);
  user-select: none;
}

.status-toggle {
  display: flex;
  background: #e9ecef;
  border-radius: 6px;
  padding: 4px;
}

.status-toggle .btn {
  background: transparent;
  border: none;
  padding: 6px 12px;
  border-radius: 4px;
  transition: all 0.2s;
}

.status-toggle .btn.btn-active {
  background: white;
  color: #007bff;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
}

.spot-properties-panel {
  position: absolute;
  width: 280px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 4px 16px rgba(0,0,0,0.15);
  z-index: 10;
  max-height: calc(100% - 40px);
  overflow-y: auto;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  border-bottom: 1px solid #e9ecef;
}

.panel-header h4 { margin: 0; }

.btn-close {
  background: none;
  border: none;
  cursor: pointer;
  padding: 0;
  display: flex;
}

.panel-content { padding: 1rem; }
.form-group { margin-bottom: 1rem; }
.form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 0.5rem; }
.form-group label { display: block; margin-bottom: 0.25rem; font-size: 0.9rem; }
.form-input { width: 100%; padding: 0.5rem; border: 1px solid #ddd; border-radius: 4px; }
.panel-actions { margin-top: 1.5rem; padding-top: 1rem; border-top: 1px solid #e9ecef; }

.modal-overlay {
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0,0,0,0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  border-radius: 8px;
  width: 90%;
  max-width: 500px;
}

.modal-header, .modal-footer { padding: 1.5rem; display: flex; align-items: center; }
.modal-header { justify-content: space-between; border-bottom: 1px solid #e9ecef; }
.modal-header h3 { margin: 0; }
.modal-body { padding: 1.5rem; max-height: 60vh; overflow-y: auto; }
.modal-footer { justify-content: flex-end; gap: 0.75rem; border-top: 1px solid #e9ecef; }

.loading-state, .no-data { text-align: center; padding: 2rem; }
.parking-numbers { background: #f8f9fa; padding: 1rem; border-radius: 6px; margin: 1rem 0; }

/* 列印車位圖選項 */
.print-info-row { margin-bottom: 0.5rem; font-size: 0.95rem; color: #333; }
.print-info-note { color: #888; font-size: 0.85rem; }
.print-orientation-group { display: flex; gap: 1rem; margin: 1rem 0; }
.print-orientation-card {
  flex: 1;
  border: 2px solid #dee2e6;
  border-radius: 8px;
  padding: 1rem;
  text-align: center;
  cursor: pointer;
  transition: all 0.2s;
  user-select: none;
}
.print-orientation-card:hover { border-color: #9ec5fe; }
.print-orientation-card.active { border-color: #007bff; background: #f0f7ff; }
.orientation-box { margin: 0 auto 0.5rem; background: #e9ecef; border: 1px solid #adb5bd; }
.orientation-box.portrait { width: 42px; height: 60px; }
.orientation-box.landscape { width: 60px; height: 42px; }
.orientation-label { font-size: 0.9rem; font-weight: 600; }
.orientation-badge {
  margin-left: 6px;
  background: #28a745;
  color: #fff;
  font-size: 0.7rem;
  padding: 1px 6px;
  border-radius: 999px;
  vertical-align: middle;
}
.print-hint { font-size: 0.8rem; color: #888; margin-top: 0.5rem; }

.btn {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 6px;
  font-size: 0.9rem;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  transition: all 0.2s;
  font-weight: 500;
}
.btn:disabled { opacity: 0.6; cursor: not-allowed; }
.btn-primary { background: #007bff; color: white; }
.btn-secondary { background: #000000; color: white; }
.btn-danger { background: #dc3545; color: white; }

.zoom-controls {
  position: absolute;
  bottom: 24px;
  right: 16px;
  z-index: 10;
  background: rgba(255, 255, 255, 0.92);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border: 0;
  padding: 4px;
  border-radius: 10px;
  box-shadow: 0 0 0 0.5px rgba(0, 0, 0, 0.12), 0 4px 14px rgba(0, 0, 0, 0.14);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  user-select: none;
}

.zoom-btn {
  width: 40px;
  height: 40px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  border: none;
  border-radius: 8px;
  background: transparent;
  color: #1f2937;
  cursor: pointer;
  transition: background-color 0.15s, color 0.15s;
}

.zoom-btn svg {
  width: 22px;
  height: 22px;
}

.zoom-btn:hover:not(:disabled) {
  background: rgba(0, 0, 0, 0.06);
  color: #1d1d1f;
}

.zoom-btn:active:not(:disabled) {
  background: rgba(0, 0, 0, 0.1);
}

.zoom-btn:disabled {
  opacity: 0.35;
  cursor: not-allowed;
}

.zoom-percent {
  font-size: 11.5px;
  font-weight: 600;
  color: #6e6e73;
  font-variant-numeric: tabular-nums;
  width: 40px;
  text-align: center;
  padding: 2px 0;
}

.zoom-divider {
  width: 32px;
  height: 1px;
  background: #e5e7eb;
  margin: 2px 0;
}

.zoom-btn-fit {
  color: #0071e3;
}

.zoom-btn-fit svg {
  width: 22px;
  height: 22px;
}

.zoom-fit-label {
  font-size: 0.68rem;
  font-weight: 700;
  line-height: 1;
  margin-top: 3px;
}

.btn.btn-icon {
  padding: 0.25rem;
  width: 30px;
  height: 30px;
  justify-content: center;
  border-radius: 50%;
  gap: 0;
}

.floor-chip-group {
  position: absolute;
  top: 16px;
  right: 16px;
  z-index: 10;
  display: flex;
  flex-direction: column;
  gap: 10px;
  background: white;
  padding: 10px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.15);
  user-select: none;
  /* 樓層太多時控制列自己捲動，避免蓋到縮放按鈕 */
  max-height: calc(100% - 220px);
  overflow-y: auto;
}

.floor-chip-group .btn {
  background-color: #f8f9fa;
  color: #333;
  border: 1px solid #dee2e6;
  font-weight: 600;
  justify-content: center; 
  font-size: 1rem; 
  padding: 0.6rem 1.1rem; 
}

.floor-chip-group .btn.btn-active {
  background-color: #000000; 
  color: white;
  border-color: #f5f5f7;
}

.spin-icon {
  animation: spin 1.5s linear infinite;
}
@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* ── 車位詳細資訊卡：macOS 風格（系統字體、淡灰標題列、灰底分組列表、細分隔線） ── */
.detail-modal-overlay {
  background: rgba(0, 0, 0, 0.32) !important;
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
}

.detail-modal-content {
  max-width: 440px !important;
  width: 92% !important;
  border-radius: 14px !important;
  box-shadow:
    0 0 0 0.5px rgba(0, 0, 0, 0.12),
    0 12px 32px rgba(0, 0, 0, 0.18),
    0 2px 6px rgba(0, 0, 0, 0.08) !important;
  background: #ffffff !important;
  border: 0 !important;
  overflow: hidden;
  font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", "Helvetica Neue", "PingFang TC", "Noto Sans TC", sans-serif;
  color: #1d1d1f;
  animation: modal-enter 0.22s cubic-bezier(0.2, 0.9, 0.3, 1);
}

@keyframes modal-enter {
  0% { opacity: 0; transform: translateY(8px) scale(0.98); }
  100% { opacity: 1; transform: translateY(0) scale(1); }
}

.detail-header {
  min-height: 52px;
  padding: 10px 10px 10px 16px !important;
  background: #f6f6f8;
  border-bottom: 1px solid rgba(0, 0, 0, 0.08) !important;
  gap: 8px;
}

.detail-header > .d-flex:first-child {
  min-width: 0;
  flex-wrap: wrap;
  gap: 8px !important;
}

.detail-title-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 26px;
  height: 26px;
  border-radius: 7px;
  background: linear-gradient(180deg, #2b8cf2, #0a6fdc);
  color: #fff;
  box-shadow: inset 0 0.5px 0 rgba(255, 255, 255, 0.3);
  flex: 0 0 auto;
}

.detail-header h3.detail-title {
  font-size: 16px !important;
  font-weight: 600 !important;
  letter-spacing: 0;
  color: #1d1d1f;
  line-height: 1.2;
  font-variant-numeric: tabular-nums;
  overflow-wrap: anywhere;
}

.detail-body {
  padding: 14px 16px 4px !important;
  max-height: calc(90vh - 52px - 70px);
  overflow-y: auto;
  background: #fff;
}

.detail-close-btn {
  width: 28px;
  height: 28px;
  border-radius: 7px;
  background: transparent;
  color: #6e6e73;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background-color 0.12s, color 0.12s;
}
.detail-close-btn svg { width: 18px; height: 18px; }

.detail-close-btn:hover {
  background: rgba(0, 0, 0, 0.06);
  color: #1d1d1f;
  transform: none;
}

.detail-edit-btn {
  color: #0071e3;
  background: transparent;
}

.detail-edit-btn:hover {
  background: rgba(0, 113, 227, 0.1);
  color: #0071e3;
}

/* 分組：標題在群組上方，列以灰底圓角群組呈現（比照 macOS 系統設定的 inset grouped list） */
.info-section {
  padding: 0 0 12px;
  border-bottom: 0;
}

.info-section:last-child {
  padding-bottom: 12px;
}

.section-title {
  display: block;
  margin: 0 0 5px 6px;
  font-size: 11.5px;
  font-weight: 600;
  color: #6e6e73;
  letter-spacing: 0.02em;
  text-transform: none;
}

.section-title::before {
  content: none;
}

.info-row {
  position: relative;
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: 12px;
  padding: 9px 12px;
  background: #f5f5f7;
  border-bottom: 0;
}
.info-row::after {
  content: '';
  position: absolute;
  left: 12px;
  right: 0;
  bottom: 0;
  height: 1px;
  background: rgba(0, 0, 0, 0.07);
}
.info-row:nth-child(2) { border-radius: 10px 10px 0 0; }
.info-row:last-child { border-radius: 0 0 10px 10px; }
.info-row:nth-child(2):last-child { border-radius: 10px; }
.info-row:last-child::after { display: none; }

.info-label {
  color: #6e6e73;
  font-size: 13px;
  font-weight: 500;
  flex: 0 0 auto;
}

.info-value {
  font-weight: 600;
  font-size: 14px;
  color: #1d1d1f;
  text-align: right;
  font-variant-numeric: tabular-nums;
  overflow-wrap: anywhere;
  min-width: 0;
}
.info-value--muted { color: #8e8e93; font-weight: 500; }
.info-value--wrap { white-space: pre-wrap; text-align: left; flex: 1 1 auto; font-weight: 500; }
.info-link { color: #0071e3; text-decoration: none; }
.info-link:hover { text-decoration: underline; }
.section-title-hint { margin-left: 6px; font-weight: 500; color: #8e8e93; }

/* 報價模式底部：為『戶別』加入此車位 */
.detail-foot {
  padding: 12px 16px;
  background: #f6f6f8;
  border-top: 1px solid rgba(0, 0, 0, 0.08);
}
.detail-foot .mac-btn { gap: 6px; }
.detail-foot-added {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 5px;
  margin-bottom: 8px;
  font-size: 12.5px;
  font-weight: 600;
  color: #1d8a3a;
}
.detail-foot-added svg { color: #1d8a3a; }
.detail-foot .mac-btn--danger {
  background: #fff;
  color: #d62d20;
}
.detail-foot .mac-btn--danger svg { color: #d62d20; }
.detail-foot-note {
  text-align: center;
  font-size: 12.5px;
  color: #6e6e73;
  padding: 4px 0;
}

@media (max-width: 600px) {
  .detail-modal-content { border-radius: 12px !important; }
  .detail-body { padding: 12px 12px 2px !important; }
  .detail-foot { padding: 10px 12px; }
}

/* 車位按鈕化效果 */
.clickable-spot {
  cursor: pointer;
  transition: all 0.2s ease;
}

.clickable-spot:hover {
  filter: brightness(1.08);
  transform: scale(1.03);
  box-shadow: 0 4px 16px rgba(0,0,0,0.2);
  z-index: 20;
}

.clickable-spot:active {
  transform: scale(0.97);
}

</style>