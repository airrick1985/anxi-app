<template>
  <div class="style-editor-panel">
    <div class="panel-header">
      <h4>
        <i class="fas fa-palette"></i>
        樣式設定
      </h4>
      <button @click="$emit('close')" class="btn-close">
        <i class="fas fa-times"></i>
      </button>
    </div>

    <div class="panel-content">
      <!-- 車位狀態樣式 -->
      <div class="style-section">
        <h5>
          <i class="fas fa-circle"></i>
          車位狀態顏色
        </h5>
        
        <div class="status-styles">
          <div 
            v-for="(statusConfig, statusKey) in statusStyles" 
            :key="statusKey"
            class="status-item"
          >
            <div class="status-header">
              <label class="status-label">{{ statusConfig.label }}</label>
              <div 
                class="status-preview" 
                :style="{ 
                  backgroundColor: statusConfig.backgroundColor, 
                  borderColor: statusConfig.borderColor,
                  color: statusConfig.textColor 
                }"
              >
                {{ statusConfig.label }}
              </div>
            </div>
            
            <div class="color-controls">
              <div class="color-group">
                <label>背景顏色</label>
                <div class="color-input-wrapper">
                  <input 
                    v-model="statusConfig.backgroundColor"
                    @input="updateStatusStyle(statusKey, 'backgroundColor', $event.target.value)"
                    type="color" 
                    class="color-input"
                  />
                  <input 
                    v-model="statusConfig.backgroundColor"
                    @input="updateStatusStyle(statusKey, 'backgroundColor', $event.target.value)"
                    type="text" 
                    class="color-text"
                    placeholder="#ffffff"
                  />
                </div>
              </div>
              
              <div class="color-group">
                <label>邊框顏色</label>
                <div class="color-input-wrapper">
                  <input 
                    v-model="statusConfig.borderColor"
                    @input="updateStatusStyle(statusKey, 'borderColor', $event.target.value)"
                    type="color" 
                    class="color-input"
                  />
                  <input 
                    v-model="statusConfig.borderColor"
                    @input="updateStatusStyle(statusKey, 'borderColor', $event.target.value)"
                    type="text" 
                    class="color-text"
                    placeholder="#000000"
                  />
                </div>
              </div>
              
              <div class="color-group">
                <label>文字顏色</label>
                <div class="color-input-wrapper">
                  <input 
                    v-model="statusConfig.textColor"
                    @input="updateStatusStyle(statusKey, 'textColor', $event.target.value)"
                    type="color" 
                    class="color-input"
                  />
                  <input 
                    v-model="statusConfig.textColor"
                    @input="updateStatusStyle(statusKey, 'textColor', $event.target.value)"
                    type="text" 
                    class="color-text"
                    placeholder="#000000"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 預設車位尺寸 -->
      <div class="style-section">
        <h5>
          <i class="fas fa-expand-arrows-alt"></i>
          預設車位尺寸
        </h5>
        
        <div class="size-controls">
          <div class="size-group">
            <label>寬度 (px)</label>
            <input 
              v-model.number="defaultSpotSize.width"
              @input="updateDefaultSize('width', $event.target.value)"
              type="number" 
              min="20" 
              max="200"
              class="size-input"
            />
          </div>
          
          <div class="size-group">
            <label>高度 (px)</label>
            <input 
              v-model.number="defaultSpotSize.height"
              @input="updateDefaultSize('height', $event.target.value)"
              type="number" 
              min="20" 
              max="200"
              class="size-input"
            />
          </div>
        </div>
        
        <div class="size-preview">
          <div 
            class="preview-spot"
            :style="{ 
              width: defaultSpotSize.width + 'px', 
              height: defaultSpotSize.height + 'px',
              backgroundColor: statusStyles.available.backgroundColor,
              borderColor: statusStyles.available.borderColor,
              color: statusStyles.available.textColor
            }"
          >
            預覽
          </div>
        </div>
      </div>

      <!-- 網格設定 -->
      <div class="style-section">
        <h5>
          <i class="fas fa-th"></i>
          網格設定
        </h5>
        
        <div class="grid-controls">
          <div class="grid-toggle">
            <label class="toggle-label">
              <input 
                v-model="gridSettings.enabled"
                @change="updateGridSetting('enabled', $event.target.checked)"
                type="checkbox" 
                class="toggle-input"
              />
              <span class="toggle-slider"></span>
              顯示網格
            </label>
          </div>
          
          <div v-if="gridSettings.enabled" class="grid-options">
            <div class="grid-group">
              <label>網格大小 (px)</label>
              <input 
                v-model.number="gridSettings.size"
                @input="updateGridSetting('size', $event.target.value)"
                type="number" 
                min="5" 
                max="50"
                class="grid-input"
              />
            </div>
            
            <div class="grid-group">
              <label>網格顏色</label>
              <div class="color-input-wrapper">
                <input 
                  v-model="gridSettings.color"
                  @input="updateGridSetting('color', $event.target.value)"
                  type="color" 
                  class="color-input"
                />
                <input 
                  v-model="gridSettings.color"
                  @input="updateGridSetting('color', $event.target.value)"
                  type="text" 
                  class="color-text"
                  placeholder="#cccccc"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 文字樣式 -->
      <div class="style-section">
        <h5>
          <i class="fas fa-font"></i>
          文字樣式
        </h5>
        
        <div class="text-controls">
          <div class="text-group">
            <label>字體大小 (px)</label>
            <input 
              v-model.number="textStyles.fontSize"
              @input="updateTextStyle('fontSize', $event.target.value)"
              type="number" 
              min="8" 
              max="24"
              class="text-input"
            />
          </div>
          
          <div class="text-group">
            <label>字體粗細</label>
            <select 
              v-model="textStyles.fontWeight"
              @change="updateTextStyle('fontWeight', $event.target.value)"
              class="text-select"
            >
              <option value="normal">正常</option>
              <option value="bold">粗體</option>
              <option value="lighter">細體</option>
            </select>
          </div>
          
          <div class="text-group">
            <label>字體家族</label>
            <select 
              v-model="textStyles.fontFamily"
              @change="updateTextStyle('fontFamily', $event.target.value)"
              class="text-select"
            >
              <option value="Arial, sans-serif">Arial</option>
              <option value="微軟正黑體, Microsoft JhengHei">微軟正黑體</option>
              <option value="新細明體, PMingLiU">新細明體</option>
              <option value="Courier New, monospace">Courier New</option>
            </select>
          </div>
        </div>
      </div>

      <!-- 動作按鈕 -->
      <div class="panel-actions">
        <button @click="resetToDefaults" class="btn btn-outline btn-sm">
          <i class="fas fa-undo"></i>
          重置為預設值
        </button>
        
        <button @click="saveStyles" :disabled="saving" class="btn btn-primary btn-sm">
          <i class="fas fa-save"></i>
          {{ saving ? '儲存中...' : '儲存樣式' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, watch, onMounted } from 'vue'
import { getFunctions, httpsCallable } from 'firebase/functions'

export default {
  name: 'StyleEditor',
  props: {
    floorPlanId: {
      type: String,
      required: true
    }
  },
  emits: ['close', 'styles-updated'],
  setup(props, { emit }) {
    // Functions
    const functions = getFunctions()
    const getFloorPlanParameters = httpsCallable(functions, 'getFloorPlanParameters')
    const updateFloorPlanParameters = httpsCallable(functions, 'updateFloorPlanParameters')

    // Reactive data
    const saving = ref(false)
    
    // 車位狀態樣式
    const statusStyles = ref({
      available: {
        label: '可售',
        backgroundColor: '#e8f5e8',
        borderColor: '#4caf50',
        textColor: '#000000'
      },
      reserved: {
        label: '保留',
        backgroundColor: '#fff3cd',
        borderColor: '#ffc107',
        textColor: '#000000'
      },
      sold: {
        label: '已售',
        backgroundColor: '#f8d7da',
        borderColor: '#dc3545',
        textColor: '#000000'
      },
      disabled: {
        label: '停用',
        backgroundColor: '#f8f9fa',
        borderColor: '#6c757d',
        textColor: '#6c757d'
      }
    })

    // 預設車位尺寸
    const defaultSpotSize = ref({
      width: 60,
      height: 40
    })

    // 網格設定
    const gridSettings = ref({
      enabled: true,
      size: 20,
      color: '#e0e0e0'
    })

    // 文字樣式
    const textStyles = ref({
      fontSize: 12,
      fontWeight: 'normal',
      fontFamily: 'Arial, sans-serif'
    })

    // Methods
    const updateStatusStyle = (statusKey, property, value) => {
      statusStyles.value[statusKey][property] = value
      emit('styles-updated', {
        statusStyles: statusStyles.value,
        defaultSpotSize: defaultSpotSize.value,
        gridSettings: gridSettings.value,
        textStyles: textStyles.value
      })
    }

    const updateDefaultSize = (property, value) => {
      defaultSpotSize.value[property] = Number(value) || 50
      emit('styles-updated', {
        statusStyles: statusStyles.value,
        defaultSpotSize: defaultSpotSize.value,
        gridSettings: gridSettings.value,
        textStyles: textStyles.value
      })
    }

    const updateGridSetting = (property, value) => {
      if (property === 'enabled') {
        gridSettings.value[property] = Boolean(value)
      } else if (property === 'size') {
        gridSettings.value[property] = Number(value) || 20
      } else {
        gridSettings.value[property] = value
      }
      
      emit('styles-updated', {
        statusStyles: statusStyles.value,
        defaultSpotSize: defaultSpotSize.value,
        gridSettings: gridSettings.value,
        textStyles: textStyles.value
      })
    }

    const updateTextStyle = (property, value) => {
      if (property === 'fontSize') {
        textStyles.value[property] = Number(value) || 12
      } else {
        textStyles.value[property] = value
      }
      
      emit('styles-updated', {
        statusStyles: statusStyles.value,
        defaultSpotSize: defaultSpotSize.value,
        gridSettings: gridSettings.value,
        textStyles: textStyles.value
      })
    }

    const resetToDefaults = () => {
      if (!confirm('確定要重置所有樣式設定為預設值嗎？')) return

      statusStyles.value = {
        available: {
          label: '可售',
          backgroundColor: '#e8f5e8',
          borderColor: '#4caf50',
          textColor: '#000000'
        },
        reserved: {
          label: '保留',
          backgroundColor: '#fff3cd',
          borderColor: '#ffc107',
          textColor: '#000000'
        },
        sold: {
          label: '已售',
          backgroundColor: '#f8d7da',
          borderColor: '#dc3545',
          textColor: '#000000'
        },
        disabled: {
          label: '停用',
          backgroundColor: '#f8f9fa',
          borderColor: '#6c757d',
          textColor: '#6c757d'
        }
      }

      defaultSpotSize.value = { width: 60, height: 40 }
      gridSettings.value = { enabled: true, size: 20, color: '#e0e0e0' }
      textStyles.value = { fontSize: 12, fontWeight: 'normal', fontFamily: 'Arial, sans-serif' }

      emit('styles-updated', {
        statusStyles: statusStyles.value,
        defaultSpotSize: defaultSpotSize.value,
        gridSettings: gridSettings.value,
        textStyles: textStyles.value
      })
    }

    const saveStyles = async () => {
      saving.value = true
      try {
        const parameters = {
          spotStyles: statusStyles.value,
          defaultSpotSize: defaultSpotSize.value,
          gridSettings: gridSettings.value,
          textStyles: textStyles.value
        }

        await updateFloorPlanParameters({
          floorPlanId: props.floorPlanId,
          parameters
        })

        alert('樣式設定儲存成功！')
      } catch (error) {
        console.error('儲存樣式設定失敗:', error)
        alert('儲存時發生錯誤，請稍後重試')
      } finally {
        saving.value = false
      }
    }

    const loadParameters = async () => {
      try {
        const result = await getFloorPlanParameters({ floorPlanId: props.floorPlanId })
        const params = result.data.data

        if (params.spotStyles) {
          // 合併現有標籤
          Object.keys(statusStyles.value).forEach(key => {
            if (params.spotStyles[key]) {
              statusStyles.value[key] = {
                ...statusStyles.value[key],
                ...params.spotStyles[key]
              }
            }
          })
        }

        if (params.defaultSpotSize) {
          defaultSpotSize.value = { ...defaultSpotSize.value, ...params.defaultSpotSize }
        }

        if (params.gridSettings) {
          gridSettings.value = { ...gridSettings.value, ...params.gridSettings }
        }

        if (params.textStyles) {
          textStyles.value = { ...textStyles.value, ...params.textStyles }
        }
      } catch (error) {
        console.error('載入參數失敗:', error)
      }
    }

    // 生命週期
    onMounted(() => {
      loadParameters()
    })

    return {
      saving,
      statusStyles,
      defaultSpotSize,
      gridSettings,
      textStyles,
      updateStatusStyle,
      updateDefaultSize,
      updateGridSetting,
      updateTextStyle,
      resetToDefaults,
      saveStyles
    }
  }
}
</script>

<style scoped>
.style-editor-panel {
  width: 320px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 4px 16px rgba(0,0,0,0.15);
  max-height: 80vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  background: #f8f9fa;
  border-bottom: 1px solid #e9ecef;
  border-radius: 8px 8px 0 0;
}

.panel-header h4 {
  margin: 0;
  color: #2c3e50;
  font-size: 1.1rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.btn-close {
  background: none;
  border: none;
  font-size: 1.1rem;
  cursor: pointer;
  color: #6c757d;
  padding: 0.25rem;
  border-radius: 4px;
  transition: all 0.2s;
}

.btn-close:hover {
  color: #495057;
  background: #e9ecef;
}

.panel-content {
  flex: 1;
  overflow-y: auto;
  padding: 1rem;
}

.style-section {
  margin-bottom: 2rem;
}

.style-section h5 {
  margin: 0 0 1rem 0;
  color: #495057;
  font-size: 1rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid #e9ecef;
}

.status-styles .status-item {
  margin-bottom: 1.5rem;
  padding: 1rem;
  background: #f8f9fa;
  border-radius: 6px;
}

.status-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.status-label {
  font-weight: 500;
  color: #2c3e50;
}

.status-preview {
  padding: 0.5rem 1rem;
  border: 2px solid;
  border-radius: 4px;
  font-size: 0.9rem;
  text-align: center;
  min-width: 60px;
}

.color-controls {
  display: grid;
  gap: 0.75rem;
}

.color-group {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.color-group label {
  font-size: 0.85rem;
  color: #6c757d;
  font-weight: 500;
}

.color-input-wrapper {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}

.color-input {
  width: 40px;
  height: 32px;
  border: 1px solid #ddd;
  border-radius: 4px;
  cursor: pointer;
}

.color-text {
  flex: 1;
  padding: 0.5rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 0.85rem;
  font-family: monospace;
}

.size-controls, .text-controls {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.size-group, .text-group {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.size-group label, .text-group label {
  font-size: 0.85rem;
  color: #6c757d;
  font-weight: 500;
}

.size-input, .text-input, .text-select {
  padding: 0.5rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 0.9rem;
}

.size-preview {
  margin-top: 1rem;
  display: flex;
  justify-content: center;
}

.preview-spot {
  border: 2px solid;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.9rem;
  font-weight: 500;
}

.grid-controls {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.grid-toggle {
  display: flex;
  align-items: center;
}

.toggle-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  font-size: 0.9rem;
  color: #2c3e50;
}

.toggle-input {
  display: none;
}

.toggle-slider {
  width: 40px;
  height: 20px;
  background: #ccc;
  border-radius: 20px;
  position: relative;
  transition: background 0.3s;
}

.toggle-slider::before {
  content: '';
  position: absolute;
  width: 16px;
  height: 16px;
  background: white;
  border-radius: 50%;
  top: 2px;
  left: 2px;
  transition: transform 0.3s;
}

.toggle-input:checked + .toggle-slider {
  background: #007bff;
}

.toggle-input:checked + .toggle-slider::before {
  transform: translateX(20px);
}

.grid-options {
  display: grid;
  gap: 1rem;
}

.grid-group {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.grid-group label {
  font-size: 0.85rem;
  color: #6c757d;
  font-weight: 500;
}

.grid-input {
  padding: 0.5rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 0.9rem;
}

.panel-actions {
  display: flex;
  justify-content: space-between;
  gap: 0.5rem;
  margin-top: 1.5rem;
  padding-top: 1rem;
  border-top: 1px solid #e9ecef;
}

.btn {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 4px;
  font-size: 0.85rem;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  transition: all 0.2s;
  text-decoration: none;
  white-space: nowrap;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-primary {
  background: #007bff;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: #0056b3;
}

.btn-outline {
  background: white;
  border: 1px solid #ddd;
  color: #495057;
}

.btn-outline:hover:not(:disabled) {
  background: #f8f9fa;
}

.btn-sm {
  padding: 0.375rem 0.75rem;
  font-size: 0.8rem;
}
</style>