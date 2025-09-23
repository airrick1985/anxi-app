<template>
  <div class="status-color-editor">
    <div class="panel-header">
      <h4>車位狀態顏色設定</h4>
      <button class="btn-close" @click="$emit('close')">&times;</button>
    </div>
    <div class="panel-content">
      <v-tabs v-model="activeTab" color="primary" grow>
        <v-tab value="backend">後台狀態</v-tab>
        <v-tab value="sales">銷售狀態</v-tab>
      </v-tabs>

      <v-window v-model="activeTab">
        <v-window-item value="backend">
          <StatusList
            :statuses="editableColors.backend"
            type="backend"
            @add="openEditDialog('backend')"
            @edit="openEditDialog('backend', $event)"
            @remove="confirmRemove"
          />
        </v-window-item>
        <v-window-item value="sales">
          <StatusList
            :statuses="editableColors.sales"
            type="sales"
            @add="openEditDialog('sales')"
            @edit="openEditDialog('sales', $event)"
            @remove="confirmRemove"
          />
        </v-window-item>
      </v-window>
    </div>

    <!-- 編輯/新增對話框 -->
    <v-dialog v-model="dialog" persistent max-width="400px">
      <v-card>
        <v-card-title class="bg-primary">
          {{ isEditing ? '編輯狀態' : '新增狀態' }}
        </v-card-title>
        <v-card-text class="pt-4">
          <v-text-field
            v-model="currentStatus.name"
            label="狀態名稱"
            variant="outlined"
            density="compact"
            :disabled="currentStatus.isDefault"
            :rules="[v => !!v || '名稱為必填']"
          ></v-text-field>
          
          <p class="text-subtitle-1 mt-2 mb-2">狀態顏色</p>
          <v-color-picker
            v-model="currentStatus.color"
            show-swatches
            hide-inputs
            width="100%"
          ></v-color-picker>
          <v-text-field
            v-model="currentStatus.color"
            label="色碼 (Hex)"
            variant="outlined"
            density="compact"
            class="mt-2"
          >
            <template v-slot:prepend-inner>
              <div 
                :style="{ 
                  backgroundColor: currentStatus.color, 
                  width: '24px', 
                  height: '24px',
                  borderRadius: '4px',
                  border: '1px solid #ccc',
                }"
              ></div>
            </template>
          </v-text-field>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="grey" text @click="closeDialog">取消</v-btn>
          <v-btn color="primary" @click="saveStatus">儲存</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- 刪除確認對話框 -->
    <v-dialog v-model="removeDialog" persistent max-width="400px">
      <v-card>
        <v-card-title class="text-h6 d-flex align-center bg-red-lighten-4">
          <v-icon start color="red-darken-2">mdi-alert-circle-outline</v-icon>
          確認刪除
        </v-card-title>
        <v-card-text>
          您確定要刪除「{{ statusToRemove.name }}」這個狀態嗎？此操作無法復原。
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="grey" text @click="removeDialog = false">取消</v-btn>
          <v-btn color="error" text @click="executeRemove">確認刪除</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup>
import { ref, computed, defineAsyncComponent } from 'vue';

const StatusList = defineAsyncComponent(() => import('./StatusList.vue'));

const props = defineProps({
  modelValue: {
    type: Object,
    required: true
  }
});

const emit = defineEmits(['update:modelValue', 'close']);

const activeTab = ref('backend');
const dialog = ref(false);
const removeDialog = ref(false);
const isEditing = ref(false);

const currentStatus = ref({
  type: 'backend',
  originalName: '',
  name: '',
  color: '#FFFFFF',
  isDefault: false,
});

const statusToRemove = ref({
  type: '',
  name: ''
});

const editableColors = computed({
  get: () => props.modelValue,
  set: (value) => {
    emit('update:modelValue', value);
  }
});

const openEditDialog = (type, status = null) => {
  currentStatus.value.type = type;
  if (status) {
    // 編輯模式
    isEditing.value = true;
    currentStatus.value.originalName = status.name;
    currentStatus.value.name = status.name === 'default' ? '預設顏色' : status.name;
    currentStatus.value.color = status.color;
    currentStatus.value.isDefault = status.name === 'default';
  } else {
    // 新增模式
    isEditing.value = false;
    currentStatus.value.originalName = '';
    currentStatus.value.name = `新狀態${Object.keys(editableColors.value[type]).length}`;
    currentStatus.value.color = '#FFFFFF';
    currentStatus.value.isDefault = false;
  }
  dialog.value = true;
};

const closeDialog = () => {
  dialog.value = false;
};

const saveStatus = () => {
  const type = currentStatus.value.type;
  const newName = currentStatus.value.name;
  const oldName = currentStatus.value.originalName;
  const color = currentStatus.value.color;

  if (!newName.trim()) {
    // 可以在這裡加入提示
    return;
  }

  const newColors = { ...editableColors.value[type] };

  if (isEditing.value) {
    // 編輯
    if (oldName !== newName && oldName !== 'default') {
      delete newColors[oldName];
    }
    const nameToUpdate = oldName === 'default' ? 'default' : newName;
    newColors[nameToUpdate] = color;
  } else {
    // 新增
    newColors[newName] = color;
  }
  
  editableColors.value = {
    ...editableColors.value,
    [type]: newColors
  };

  closeDialog();
};

const confirmRemove = (status) => {
  statusToRemove.value = status;
  removeDialog.value = true;
};

const executeRemove = () => {
  const { type, name } = statusToRemove.value;
  const newColors = { ...editableColors.value[type] };
  delete newColors[name];
  
  editableColors.value = {
    ...editableColors.value,
    [type]: newColors
  };
  
  removeDialog.value = false;
};

</script>

<style scoped>
.status-color-editor {
  position: absolute;
  top: 60px;
  right: 20px;
  width: 400px;
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
  max-height: calc(100vh - 200px);
  overflow-y: auto;
}
</style>