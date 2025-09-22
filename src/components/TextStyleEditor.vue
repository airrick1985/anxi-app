<template>
  <div class="text-style-editor">
    <div class="panel-header">
      <h4>車位資訊文字樣式</h4>
      <button class="btn-close" @click="$emit('close')">&times;</button>
    </div>
    <div class="panel-content">
      <div class="form-group">
        <label for="field-select">選擇編輯欄位</label>
        <select id="field-select" v-model="selectedFieldKey" class="form-input">
          <option v-for="(name, key) in fieldNames" :key="key" :value="key">
            {{ name }}
          </option>
        </select>
      </div>

      <div v-if="selectedStyle" class="style-controls">
        <div class="form-row">
          <div class="form-group">
            <label>文字大小</label>
            <input type="number" v-model.number="selectedStyle.fontSize" class="form-input" min="1" />
          </div>
          <div class="form-group">
            <label>字體粗細</label>
            <select v-model="selectedStyle.fontWeight" class="form-input">
              <option value="normal">正常</option>
              <option value="bold">粗體</option>
            </select>
          </div>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label>字體顏色</label>
            <input type="color" v-model="selectedStyle.fill" class="form-input color-input" />
          </div>
          <div class="form-group">
            <label>字型</label>
            <select v-model="selectedStyle.fontFamily" class="form-input">
              <option v-for="font in fontFamilies" :key="font" :value="font">
                {{ font }}
              </option>
            </select>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue';

const props = defineProps({
  modelValue: {
    type: Object,
    required: true
  }
});

const emit = defineEmits(['update:modelValue', 'close']);

// 欄位 key 與中文名稱的對應
const fieldNames = {
  number: '車位編號',
  price: '價格',
  buyerUnitId: '買方單位',
  buyerName: '買方姓名',
  salesperson: '銷售人員',
  size: '尺寸',
  type: '車位類型',
  status: '銷售狀態'
};

// 可選字型列表
const fontFamilies = ['Arial', 'Verdana', 'Helvetica', 'Tahoma', 'Trebuchet MS', 'Microsoft JhengHei', 'sans-serif'];

// 當前選擇要編輯的欄位 key
const selectedFieldKey = ref('number');

// 為了安全地修改 props，我們建立一個 computed property
const editableStyles = computed({
  get: () => props.modelValue,
  set: (value) => {
    emit('update:modelValue', value);
  }
});

// 根據選擇的 key，取得對應的樣式物件
const selectedStyle = computed(() => {
  if (selectedFieldKey.value && editableStyles.value[selectedFieldKey.value]) {
    return editableStyles.value[selectedFieldKey.value];
  }
  return null;
});

</script>

<style scoped>
.text-style-editor {
  position: absolute;
  top: 60px;
  right: 20px;
  width: 320px;
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  z-index: 1001;
  border: 1px solid #dee2e6;
  display: flex;
  flex-direction: column;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 1rem;
  border-bottom: 1px solid #e9ecef;
}

.panel-header h4 {
  margin: 0;
  font-size: 1.1rem;
}

.btn-close {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: #6c757d;
  padding: 0;
  line-height: 1;
}

.panel-content {
  padding: 1rem;
}

.form-group {
  margin-bottom: 1rem;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.75rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.35rem;
  font-size: 0.9rem;
  color: #495057;
}

.form-input {
  width: 100%;
  padding: 0.5rem;
  border: 1px solid #ced4da;
  border-radius: 4px;
  font-size: 1rem;
  background-color: #fff;
  transition: border-color 0.15s ease-in-out, box-shadow 0.15s ease-in-out;
}

.form-input:focus {
  border-color: #80bdff;
  outline: 0;
  box-shadow: 0 0 0 0.2rem rgba(0, 123, 255, 0.25);
}

.color-input {
  padding: 0.25rem;
  height: calc(0.5rem * 2 + 1rem + 2px); /* 與其他 input 高度對齊 */
}

.style-controls {
  margin-top: 1.5rem;
  padding-top: 1rem;
  border-top: 1px solid #e9ecef;
}
</style>