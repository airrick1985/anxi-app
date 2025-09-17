<template>
  <div class="floor-manager">
    <!-- 樓層選擇器 -->
    <div class="floor-selector">
      <div class="floor-tabs">
        <button
          v-for="floor in floors"
          :key="floor.id"
          @click="selectFloor(floor)"
          :class="['floor-tab', { active: selectedFloor?.id === floor.id }]"
        >
          {{ floor.name }}
        </button>
        
        <button @click="addNewFloor" class="floor-tab add-floor">
          <i class="fas fa-plus"></i>
          新增樓層
        </button>
      </div>
      
      <!-- 樓層操作按鈕 -->
      <div class="floor-actions" v-if="selectedFloor">
        <button @click="editFloor" class="btn btn-sm btn-outline-primary">
          <i class="fas fa-edit"></i>
          編輯
        </button>
        
        <button @click="duplicateFloor" class="btn btn-sm btn-outline-success">
          <i class="fas fa-copy"></i>
          複製
        </button>
        
        <button @click="deleteFloor" class="btn btn-sm btn-outline-danger" :disabled="floors.length <= 1">
          <i class="fas fa-trash"></i>
          刪除
        </button>
      </div>
    </div>

    <!-- 背景圖片管理 -->
    <div class="background-manager" v-if="selectedFloor">
      <div class="manager-header">
        <h4>
          <i class="fas fa-image"></i>
          背景圖片管理
        </h4>
      </div>
      
      <div class="background-content">
        <!-- 當前背景圖片 -->
        <div class="current-background" v-if="selectedFloor.backgroundImageUrl">
          <img 
            :src="selectedFloor.backgroundImageUrl" 
            :alt="selectedFloor.name + ' 背景圖'"
            class="background-preview"
          />
          <div class="background-overlay">
            <button @click="changeBackground" class="btn btn-sm btn-primary">
              <i class="fas fa-edit"></i>
              更換
            </button>
            <button @click="removeBackground" class="btn btn-sm btn-danger">
              <i class="fas fa-trash"></i>
              移除
            </button>
          </div>
        </div>
        
        <!-- 無背景圖片時的上傳區域 -->
        <div class="upload-area" v-else>
          <div class="upload-zone" @click="triggerUpload">
            <i class="fas fa-cloud-upload-alt"></i>
            <p>點擊上傳背景圖片</p>
            <small>支援 JPG, PNG 格式，建議尺寸 1200x800</small>
          </div>
        </div>
        
        <!-- 隱藏的文件輸入 -->
        <input
          ref="fileInput"
          type="file"
          accept="image/*"
          @change="handleFileUpload"
          style="display: none"
        />
        
        <!-- 背景圖片設定 -->
        <div class="background-settings" v-if="selectedFloor.backgroundImageUrl">
          <h5>顯示設定</h5>
          
          <div class="form-group">
            <label>不透明度</label>
            <input
              type="range"
              min="0.1"
              max="1"
              step="0.1"
              v-model="backgroundOpacity"
              @input="updateBackgroundOpacity"
              class="opacity-slider"
            />
            <span class="opacity-value">{{ Math.round(backgroundOpacity * 100) }}%</span>
          </div>
          
          <div class="form-group">
            <label>縮放模式</label>
            <select v-model="backgroundScale" @change="updateBackgroundScale" class="form-select">
              <option value="fit">適應畫布</option>
              <option value="fill">填滿畫布</option>
              <option value="stretch">拉伸填滿</option>
              <option value="original">原始尺寸</option>
              <option value="custom">自訂縮放</option>
            </select>
          </div>
          
          <div class="form-group" v-if="backgroundScale === 'custom'">
            <label>自訂縮放比例</label>
            <input
              type="range"
              min="0.1"
              max="3"
              step="0.1"
              v-model="customScale"
              @input="updateBackgroundScale"
              class="scale-slider"
            />
            <span class="scale-value">{{ Math.round(customScale * 100) }}%</span>
          </div>
          
          <div class="checkbox-group">
            <label>
              <input
                type="checkbox"
                v-model="lockBackground"
                @change="updateBackgroundLock"
              />
              鎖定背景圖片（防止意外移動）
            </label>
          </div>
        </div>
      </div>
    </div>

    <!-- 樓層設定對話框 -->
    <div v-if="showFloorDialog" class="modal-overlay" @click="closeFloorDialog">
      <div class="modal-dialog" @click.stop>
        <div class="modal-header">
          <h4>{{ editingFloor ? '編輯樓層' : '新增樓層' }}</h4>
          <button @click="closeFloorDialog" class="btn-close">
            <i class="fas fa-times"></i>
          </button>
        </div>
        
        <div class="modal-body">
          <div class="form-group">
            <label>樓層名稱 *</label>
            <input
              v-model="floorForm.name"
              type="text"
              class="form-input"
              placeholder="例如：B1、1F、2F"
              required
            />
          </div>
          
          <div class="form-group">
            <label>樓層描述</label>
            <textarea
              v-model="floorForm.description"
              class="form-textarea"
              placeholder="樓層說明或備註"
              rows="3"
            ></textarea>
          </div>
          
          <div class="form-group">
            <label>樓層順序</label>
            <input
              v-model.number="floorForm.order"
              type="number"
              class="form-input"
              placeholder="數字越小排序越前面"
            />
          </div>
        </div>
        
        <div class="modal-footer">
          <button @click="closeFloorDialog" class="btn btn-secondary">
            取消
          </button>
          <button @click="saveFloor" class="btn btn-primary" :disabled="!floorForm.name">
            {{ editingFloor ? '更新' : '建立' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, watch, nextTick } from 'vue'
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage'
import { useToast } from 'vue-toastification'

export default {
  name: 'FloorManager',
  props: {
    floorPlan: {
      type: Object,
      required: true
    }
  },
  emits: ['floor-changed', 'background-updated'],
  setup(props, { emit }) {
    const toast = useToast()
    const storage = getStorage()
    
    // 狀態
    const floors = ref([])
    const selectedFloor = ref(null)
    const showFloorDialog = ref(false)
    const editingFloor = ref(null)
    const fileInput = ref(null)
    const uploading = ref(false)
    
    // 背景圖片設定
    const backgroundOpacity = ref(0.5)
    const backgroundScale = ref('fit')
    const customScale = ref(1.0)
    const lockBackground = ref(false)
    
    // 表單資料
    const floorForm = ref({
      name: '',
      description: '',
      order: 0
    })

    // 初始化樓層資料
    const initializeFloors = () => {
      // 如果沒有樓層資料，創建預設樓層
      if (!props.floorPlan.floors || props.floorPlan.floors.length === 0) {
        floors.value = [{
          id: 'default',
          name: '1F',
          description: '一樓',
          order: 1,
          backgroundImageUrl: props.floorPlan.backgroundImageUrl || null,
          backgroundSettings: {
            opacity: 0.5,
            scale: 'fit',
            customScale: 1.0,
            locked: false
          }
        }]
      } else {
        floors.value = [...props.floorPlan.floors].sort((a, b) => a.order - b.order)
      }
      
      // 選擇第一個樓層
      if (floors.value.length > 0) {
        selectFloor(floors.value[0])
      }
    }

    // 選擇樓層
    const selectFloor = (floor) => {
      selectedFloor.value = floor
      
      // 更新背景設定
      if (floor.backgroundSettings) {
        backgroundOpacity.value = floor.backgroundSettings.opacity || 0.5
        backgroundScale.value = floor.backgroundSettings.scale || 'fit'
        customScale.value = floor.backgroundSettings.customScale || 1.0
        lockBackground.value = floor.backgroundSettings.locked || false
      }
      
      emit('floor-changed', floor)
    }

    // 新增樓層
    const addNewFloor = () => {
      editingFloor.value = null
      floorForm.value = {
        name: '',
        description: '',
        order: floors.value.length + 1
      }
      showFloorDialog.value = true
    }

    // 編輯樓層
    const editFloor = () => {
      if (!selectedFloor.value) return
      
      editingFloor.value = selectedFloor.value
      floorForm.value = {
        name: selectedFloor.value.name,
        description: selectedFloor.value.description || '',
        order: selectedFloor.value.order
      }
      showFloorDialog.value = true
    }

    // 複製樓層
    const duplicateFloor = () => {
      if (!selectedFloor.value) return
      
      const newFloor = {
        id: `floor_${Date.now()}`,
        name: `${selectedFloor.value.name} (副本)`,
        description: selectedFloor.value.description || '',
        order: floors.value.length + 1,
        backgroundImageUrl: selectedFloor.value.backgroundImageUrl,
        backgroundSettings: { ...selectedFloor.value.backgroundSettings }
      }
      
      floors.value.push(newFloor)
      selectFloor(newFloor)
      toast.success('樓層已複製')
    }

    // 刪除樓層
    const deleteFloor = async () => {
      if (!selectedFloor.value || floors.value.length <= 1) return
      
      if (!confirm(`確定要刪除樓層「${selectedFloor.value.name}」嗎？`)) return
      
      try {
        // 如果有背景圖片，刪除存儲的圖片
        if (selectedFloor.value.backgroundImageUrl) {
          try {
            const imageRef = storageRef(storage, selectedFloor.value.backgroundImageUrl)
            await deleteObject(imageRef)
          } catch (error) {
            console.warn('刪除背景圖片失敗:', error)
          }
        }
        
        const currentIndex = floors.value.findIndex(f => f.id === selectedFloor.value.id)
        floors.value.splice(currentIndex, 1)
        
        // 選擇相鄰的樓層
        const newSelectedIndex = Math.min(currentIndex, floors.value.length - 1)
        selectFloor(floors.value[newSelectedIndex])
        
        toast.success('樓層已刪除')
      } catch (error) {
        console.error('刪除樓層失敗:', error)
        toast.error('刪除樓層失敗')
      }
    }

    // 儲存樓層
    const saveFloor = () => {
      if (!floorForm.value.name.trim()) return
      
      if (editingFloor.value) {
        // 更新現有樓層
        const index = floors.value.findIndex(f => f.id === editingFloor.value.id)
        if (index !== -1) {
          floors.value[index] = {
            ...floors.value[index],
            name: floorForm.value.name.trim(),
            description: floorForm.value.description.trim(),
            order: floorForm.value.order
          }
          
          // 重新排序
          floors.value.sort((a, b) => a.order - b.order)
        }
      } else {
        // 新增樓層
        const newFloor = {
          id: `floor_${Date.now()}`,
          name: floorForm.value.name.trim(),
          description: floorForm.value.description.trim(),
          order: floorForm.value.order,
          backgroundImageUrl: null,
          backgroundSettings: {
            opacity: 0.5,
            scale: 'fit',
            customScale: 1.0,
            locked: false
          }
        }
        
        floors.value.push(newFloor)
        floors.value.sort((a, b) => a.order - b.order)
        selectFloor(newFloor)
      }
      
      closeFloorDialog()
      toast.success(editingFloor.value ? '樓層已更新' : '樓層已建立')
    }

    // 關閉樓層對話框
    const closeFloorDialog = () => {
      showFloorDialog.value = false
      editingFloor.value = null
      floorForm.value = { name: '', description: '', order: 0 }
    }

    // 觸發文件上傳
    const triggerUpload = () => {
      fileInput.value?.click()
    }

    // 更換背景
    const changeBackground = () => {
      triggerUpload()
    }

    // 移除背景
    const removeBackground = async () => {
      if (!selectedFloor.value || !confirm('確定要移除背景圖片嗎？')) return
      
      try {
        // 刪除存儲的圖片
        if (selectedFloor.value.backgroundImageUrl) {
          try {
            const imageRef = storageRef(storage, selectedFloor.value.backgroundImageUrl)
            await deleteObject(imageRef)
          } catch (error) {
            console.warn('刪除背景圖片失敗:', error)
          }
        }
        
        selectedFloor.value.backgroundImageUrl = null
        emit('background-updated', { floor: selectedFloor.value, backgroundUrl: null })
        toast.success('背景圖片已移除')
      } catch (error) {
        console.error('移除背景失敗:', error)
        toast.error('移除背景失敗')
      }
    }

    // 處理文件上傳
    const handleFileUpload = async (event) => {
      const file = event.target.files[0]
      if (!file || !selectedFloor.value) return

      // 檢查文件類型
      if (!file.type.startsWith('image/')) {
        toast.error('請選擇圖片文件')
        return
      }

      // 檢查文件大小 (10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast.error('圖片文件大小不能超過 10MB')
        return
      }

      uploading.value = true

      try {
        // 上傳到 Firebase Storage
        const fileName = `floor-backgrounds/${props.floorPlan.id}/${selectedFloor.value.id}/${Date.now()}_${file.name}`
        const imageRef = storageRef(storage, fileName)
        
        await uploadBytes(imageRef, file)
        const downloadURL = await getDownloadURL(imageRef)
        
        // 更新樓層背景
        selectedFloor.value.backgroundImageUrl = downloadURL
        emit('background-updated', { floor: selectedFloor.value, backgroundUrl: downloadURL })
        
        toast.success('背景圖片已上傳')
      } catch (error) {
        console.error('上傳背景圖片失敗:', error)
        toast.error('上傳背景圖片失敗')
      } finally {
        uploading.value = false
        // 清空 input
        if (fileInput.value) {
          fileInput.value.value = ''
        }
      }
    }

    // 更新背景不透明度
    const updateBackgroundOpacity = () => {
      if (!selectedFloor.value) return
      
      selectedFloor.value.backgroundSettings = {
        ...selectedFloor.value.backgroundSettings,
        opacity: backgroundOpacity.value
      }
      
      emit('background-updated', { 
        floor: selectedFloor.value, 
        backgroundUrl: selectedFloor.value.backgroundImageUrl,
        settings: selectedFloor.value.backgroundSettings
      })
    }

    // 更新背景縮放
    const updateBackgroundScale = () => {
      if (!selectedFloor.value) return
      
      selectedFloor.value.backgroundSettings = {
        ...selectedFloor.value.backgroundSettings,
        scale: backgroundScale.value,
        customScale: customScale.value
      }
      
      emit('background-updated', { 
        floor: selectedFloor.value, 
        backgroundUrl: selectedFloor.value.backgroundImageUrl,
        settings: selectedFloor.value.backgroundSettings
      })
    }

    // 更新背景鎖定狀態
    const updateBackgroundLock = () => {
      if (!selectedFloor.value) return
      
      selectedFloor.value.backgroundSettings = {
        ...selectedFloor.value.backgroundSettings,
        locked: lockBackground.value
      }
      
      emit('background-updated', { 
        floor: selectedFloor.value, 
        backgroundUrl: selectedFloor.value.backgroundImageUrl,
        settings: selectedFloor.value.backgroundSettings
      })
    }

    // 監聽 floorPlan 變化
    watch(() => props.floorPlan, initializeFloors, { immediate: true })

    // 導出給父組件的方法
    const getCurrentFloor = () => selectedFloor.value
    const getAllFloors = () => floors.value

    return {
      // 狀態
      floors,
      selectedFloor,
      showFloorDialog,
      editingFloor,
      fileInput,
      uploading,
      backgroundOpacity,
      backgroundScale,
      customScale,
      lockBackground,
      floorForm,

      // 方法
      selectFloor,
      addNewFloor,
      editFloor,
      duplicateFloor,
      deleteFloor,
      saveFloor,
      closeFloorDialog,
      triggerUpload,
      changeBackground,
      removeBackground,
      handleFileUpload,
      updateBackgroundOpacity,
      updateBackgroundScale,
      updateBackgroundLock,
      getCurrentFloor,
      getAllFloors
    }
  }
}
</script>

<style scoped>
.floor-manager {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  overflow: hidden;
}

/* 樓層選擇器 */
.floor-selector {
  border-bottom: 1px solid #e9ecef;
  padding: 1rem;
}

.floor-tabs {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1rem;
  flex-wrap: wrap;
}

.floor-tab {
  padding: 0.5rem 1rem;
  border: 1px solid #ddd;
  background: white;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 0.9rem;
}

.floor-tab:hover {
  background: #f8f9fa;
  border-color: #007bff;
}

.floor-tab.active {
  background: #007bff;
  color: white;
  border-color: #007bff;
}

.floor-tab.add-floor {
  border-style: dashed;
  color: #007bff;
}

.floor-tab.add-floor:hover {
  background: #e3f2fd;
}

.floor-actions {
  display: flex;
  gap: 0.5rem;
}

/* 背景圖片管理 */
.background-manager {
  padding: 1rem;
}

.manager-header {
  margin-bottom: 1rem;
}

.manager-header h4 {
  margin: 0;
  color: #2c3e50;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.current-background {
  position: relative;
  border-radius: 8px;
  overflow: hidden;
  margin-bottom: 1rem;
}

.background-preview {
  width: 100%;
  height: 200px;
  object-fit: cover;
  display: block;
}

.background-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0,0,0,0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  opacity: 0;
  transition: opacity 0.3s;
}

.current-background:hover .background-overlay {
  opacity: 1;
}

.upload-area {
  margin-bottom: 1rem;
}

.upload-zone {
  border: 2px dashed #ddd;
  border-radius: 8px;
  padding: 2rem;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s;
  color: #6c757d;
}

.upload-zone:hover {
  border-color: #007bff;
  background: #f8f9fa;
  color: #007bff;
}

.upload-zone i {
  font-size: 2rem;
  margin-bottom: 0.5rem;
  display: block;
}

.upload-zone p {
  margin: 0.5rem 0 0.25rem;
  font-weight: 500;
}

.upload-zone small {
  color: #6c757d;
}

/* 背景設定 */
.background-settings {
  border-top: 1px solid #e9ecef;
  padding-top: 1rem;
}

.background-settings h5 {
  margin-bottom: 1rem;
  color: #2c3e50;
}

.form-group {
  margin-bottom: 1rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
  color: #2c3e50;
}

.form-input,
.form-select,
.form-textarea {
  width: 100%;
  padding: 0.5rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 0.9rem;
}

.form-input:focus,
.form-select:focus,
.form-textarea:focus {
  outline: none;
  border-color: #007bff;
  box-shadow: 0 0 0 2px rgba(0,123,255,0.25);
}

.opacity-slider,
.scale-slider {
  width: calc(100% - 60px);
  margin-right: 10px;
}

.opacity-value,
.scale-value {
  font-size: 0.9rem;
  color: #6c757d;
  font-weight: 500;
}

.checkbox-group label {
  display: flex;
  align-items: center;
  cursor: pointer;
  font-weight: normal;
}

.checkbox-group input[type="checkbox"] {
  margin-right: 0.5rem;
  width: auto;
}

/* 對話框樣式 */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0,0,0,0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-dialog {
  background: white;
  border-radius: 8px;
  box-shadow: 0 4px 16px rgba(0,0,0,0.2);
  width: 90%;
  max-width: 500px;
  max-height: 90vh;
  overflow-y: auto;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  border-bottom: 1px solid #e9ecef;
}

.modal-header h4 {
  margin: 0;
  color: #2c3e50;
}

.btn-close {
  background: none;
  border: none;
  font-size: 1.1rem;
  cursor: pointer;
  color: #6c757d;
  padding: 0.25rem;
}

.btn-close:hover {
  color: #495057;
}

.modal-body {
  padding: 1rem;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
  padding: 1rem;
  border-top: 1px solid #e9ecef;
}

/* 按鈕樣式 */
.btn {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 4px;
  font-size: 0.9rem;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  transition: all 0.2s;
  text-decoration: none;
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

.btn-secondary {
  background: #6c757d;
  color: white;
}

.btn-secondary:hover:not(:disabled) {
  background: #545b62;
}

.btn-success {
  background: #28a745;
  color: white;
}

.btn-success:hover:not(:disabled) {
  background: #1e7e34;
}

.btn-danger {
  background: #dc3545;
  color: white;
}

.btn-danger:hover:not(:disabled) {
  background: #c82333;
}

.btn-outline-primary {
  background: transparent;
  color: #007bff;
  border: 1px solid #007bff;
}

.btn-outline-primary:hover:not(:disabled) {
  background: #007bff;
  color: white;
}

.btn-outline-success {
  background: transparent;
  color: #28a745;
  border: 1px solid #28a745;
}

.btn-outline-success:hover:not(:disabled) {
  background: #28a745;
  color: white;
}

.btn-outline-danger {
  background: transparent;
  color: #dc3545;
  border: 1px solid #dc3545;
}

.btn-outline-danger:hover:not(:disabled) {
  background: #dc3545;
  color: white;
}

.btn-sm {
  padding: 0.375rem 0.75rem;
  font-size: 0.8rem;
}

/* 響應式設計 */
@media (max-width: 768px) {
  .floor-tabs {
    flex-direction: column;
  }
  
  .floor-actions {
    flex-direction: column;
  }
  
  .modal-dialog {
    width: 95%;
    margin: 1rem;
  }
  
  .opacity-slider,
  .scale-slider {
    width: calc(100% - 80px);
  }
}
</style>