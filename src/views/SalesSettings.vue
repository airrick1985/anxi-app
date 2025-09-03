<template>
  <v-container>

      <v-row class="mb-4">
      <v-col>
        <v-btn
          @click="goBackToSalesControl"
          color="grey-darken-1"
          variant="outlined"
          prepend-icon="mdi-arrow-left"
        >
          返回銷控系統
        </v-btn>
      </v-col>
    </v-row>
    
    <v-row>
      <v-col cols="12" md="6">
        <v-card class="pa-4" elevation="2">
          <v-card-title class="text-h5 text-primary">
            建案設定
          </v-card-title>
          <v-card-subtitle>管理建案的全域設定資訊</v-card-subtitle>
          <v-divider class="my-4"></v-divider>

          <v-skeleton-loader v-if="projectLoading" type="article"></v-skeleton-loader>

          <v-form v-if="!projectLoading && project" ref="projectForm">
            <v-text-field
              v-model="project.name"
              label="建案名稱"
              variant="outlined"
              density="compact"
              readonly
              class="mb-4"
            ></v-text-field>
            <v-text-field
              v-model="project.parkingSlideId_sales"
              label="銷控模式車位簡報 ID"
              variant="outlined"
              density="compact"
              class="mb-4"
              hint="Google Slide 網址中的 ID"
              persistent-hint
            ></v-text-field>
            <v-text-field
              v-model="project.parkingSlideId_quote"
              label="報價模式車位簡報 ID"
              variant="outlined"
              density="compact"
              class="mb-4"
              hint="Google Slide 網址中的 ID"
              persistent-hint
            ></v-text-field>
            <v-text-field
              v-model="project.activityMessageSlideId"
              label="活動訊息簡報 ID"
              variant="outlined"
              density="compact"
              class="mb-4"
              hint="Google Slide 網址中的 ID"
              persistent-hint
            ></v-text-field>

            <v-divider class="my-4"></v-divider>
            <div class="mb-4">
              <p class="text-subtitle-1 mb-2">合約方式設定</p>
              <div class="mb-2">
                <v-chip
                  v-for="cType in project.contractTypes"
                  :key="cType"
                  class="mr-2 mb-2"
                  :closable="cType !== '一般合約'"
                  @click:close="removeContractType(cType)"
                  label
                >
                  {{ cType }}
                </v-chip>
              </div>
              <div class="d-flex align-center">
                <v-text-field
                  v-model="newContractType"
                  label="新增合約方式"
                  variant="outlined"
                  density="compact"
                  hide-details
                  @keydown.enter.prevent="addContractType"
                ></v-text-field>
                <v-btn
                  class="ml-2"
                  icon="mdi-plus"
                  color="primary"
                  @click="addContractType"
                  variant="tonal"
                ></v-btn>
              </div>
            </div>
            <v-btn
              color="primary"
              @click="saveProjectSettings"
              :loading="isSavingProject"
              block
              class="mt-4"
            >
              儲存專案設定
            </v-btn>
          </v-form>
        </v-card>
      </v-col>

      <v-col cols="12" md="6">
        <v-card class="pa-4" elevation="2">
          <v-card-title class="text-h5 text-teal">
            銷控狀態參數
          </v-card-title>
          <v-card-subtitle>管理銷控狀態的顏色與排序</v-card-subtitle>
          <v-divider class="my-4"></v-divider>
          
          <v-skeleton-loader v-if="paramsLoading" type="list-item-two-line@4"></v-skeleton-loader>

          <div v-if="!paramsLoading">
            <v-list lines="two">
              <v-list-item
                v-for="param in salesParameters"
                :key="param.id"
                class="mb-2"
                elevation="1"
                border
              >
                <template v-slot:prepend>
                  <v-avatar :color="param.colorCode" size="36" class="mr-4 elevation-2"></v-avatar>
                </template>

                <v-list-item-title class="font-weight-bold">{{ param.statusName }}</v-list-item-title>
                <v-list-item-subtitle>
                  排序: {{ param.order }} | 色碼: {{ param.colorCode }}
                </v-list-item-subtitle>
                
                <template v-slot:append>
                  <v-btn icon="mdi-pencil" variant="text" size="small" @click="editParameter(param)"></v-btn>
                  <v-btn icon="mdi-delete" variant="text" color="error" size="small" @click="confirmDelete(param)"></v-btn>
                </template>
              </v-list-item>
            </v-list>

            <v-btn
              color="teal"
              @click="openParameterDialog()"
              prepend-icon="mdi-plus"
              class="mt-4"
              block
            >
              新增狀態
            </v-btn>
          </div>
        </v-card>
      </v-col>
    </v-row>

   <v-dialog v-model="parameterDialog" persistent max-width="500px">
  <v-card>
    <v-card-title class="bg-primary text-white">
      <span class="text-h5">{{ editingParameter.id ? '編輯' : '新增' }}銷控狀態</span>
    </v-card-title>
    
    <v-card-text class="pt-4">
      <v-form ref="parameterForm">
        <v-text-field
          v-model="editingParameter.statusName"
          label="狀態名稱"
          variant="outlined"
          density="compact"
          :rules="[v => !!v || '此為必填欄位']"
          required
          class="mb-4"
        ></v-text-field>

        <div class="mb-4">
          <p class="text-subtitle-1 mb-2">狀態顏色</p>
          <v-color-picker
            v-model="editingParameter.colorCode"
            show-swatches
            swatches-max-height="100"
            hide-inputs
            width="100%"
            elevation="1"
          ></v-color-picker>
            <v-text-field
              v-model="editingParameter.colorCode"
              label="色碼 (Hex)"
              variant="outlined"
              density="compact"
              class="mt-2"
              :rules="[v => !!v || '此為必填欄位']"
              required
            >
            <template v-slot:prepend-inner>
                <div 
                    :style="{ 
                        backgroundColor: editingParameter.colorCode, 
                        width: '24px', 
                        height: '24px',
                        borderRadius: '4px',
                        border: '1px solid #ccc',
                        cursor: 'pointer'
                    }"
                 ></div>
            </template>
           </v-text-field>
        </div>

        <v-text-field
          v-model.number="editingParameter.order"
          label="排序"
          type="number"
          variant="outlined"
          density="compact"
          :rules="[v => v !== null && v !== '' || '此為必填欄位']"
          required
        >
    </v-text-field>
      </v-form>
    </v-card-text>
    
    <v-divider></v-divider>

    <v-card-actions>
      <v-spacer></v-spacer>
      <v-btn color="grey" variant="text" @click="closeParameterDialog">取消</v-btn>
      <v-btn color="primary" variant="flat" @click="saveParameter" :loading="isSavingParameter">儲存</v-btn>
    </v-card-actions>
  </v-card>
</v-dialog>

    <v-dialog v-model="deleteDialog" persistent max-width="400px">
        <v-card>
            <v-card-title class="text-h6 d-flex align-center bg-red-lighten-4">
          <v-icon start color="red-darken-2">mdi-alert-circle-outline</v-icon>
          確認刪除
        </v-card-title>
            <v-card-text>
                您確定要刪除「{{ parameterToDelete.statusName }}」這個銷控狀態嗎？此操作無法復原。
            </v-card-text>
            <v-card-actions>
                <v-spacer></v-spacer>
                <v-btn color="grey" text @click="deleteDialog = false">取消</v-btn>
                <v-btn color="error" text @click="executeDelete" :loading="isDeleting">確認刪除</v-btn>
            </v-card-actions>
        </v-card>
    </v-dialog>

    <v-snackbar v-model="snackbar.show" :color="snackbar.color" :timeout="3000">
        {{ snackbar.text }}
    </v-snackbar>
  </v-container>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useToast } from 'vue-toastification';
import {
  getProjectSettings, 
  updateProjectSalesSettings, 
  listenToSalesParameters,
  addSalesParameter,
  updateSalesParameter,
  deleteSalesParameter,
} from '@/api';

const route = useRoute();
const router = useRouter(); 
const toast = useToast();
const projectId = ref(route.params.projectId);

// Project Settings State
const project = ref(null);
const projectLoading = ref(true);
const isSavingProject = ref(false);
const newContractType = ref(''); // ✅ 新增 contract type 輸入框的狀態

// Sales Parameters State
const salesParameters = ref([]);
const paramsLoading = ref(true);
let unsubscribeParams = null;

// Dialog State
const parameterDialog = ref(false);
const editingParameter = ref({});
const isSavingParameter = ref(false);
const parameterForm = ref(null);

// Delete Confirmation State
const deleteDialog = ref(false);
const parameterToDelete = ref({});
const isDeleting = ref(false);

// Snackbar State
const snackbar = ref({ show: false, text: '', color: 'success' });


// --- Methods ---

const goBackToSalesControl = () => {
  if (projectId.value) {
    router.push({
      name: 'SalesControlSystem',
      params: {
        projectName: projectId.value
      }
    });
  }
};

const loadProjectSettings = async () => {
  projectLoading.value = true;
  try {
    project.value = await getProjectSettings(projectId.value);
    // ✅ 初始化或確保 contractTypes 陣列及預設值存在
    if (project.value && (!project.value.contractTypes || !Array.isArray(project.value.contractTypes))) {
      project.value.contractTypes = ['一般合約'];
    } else if (project.value) {
      const uniqueTypes = new Set(['一般合約', ...project.value.contractTypes]);
      project.value.contractTypes = Array.from(uniqueTypes);
    }
  } catch (error) {
    toast.error(`載入專案設定失敗: ${error.message}`);
  } finally {
    projectLoading.value = false;
  }
};

const saveProjectSettings = async () => {
  isSavingProject.value = true;
  try {
    const { id, ...dataToUpdate } = project.value;
    await updateProjectSalesSettings(id, dataToUpdate);
    toast.success('專案設定已成功儲存！');
  } catch (error) {
    toast.error(`儲存專案設定失敗: ${error.message}`);
  } finally {
    isSavingProject.value = false;
  }
};

// ✅ START: 新增合約方式的處理函式
const addContractType = () => {
  const value = newContractType.value.trim();
  if (value && !project.value.contractTypes.includes(value)) {
    project.value.contractTypes.push(value);
    newContractType.value = ''; // 清空輸入框
  } else if (value) {
    toast.warning(`「${value}」已存在`);
  }
};

const removeContractType = (typeToRemove) => {
  if (typeToRemove === '一般合約') {
    toast.error('「一般合約」為預設項目，不可刪除');
    return;
  }
  project.value.contractTypes = project.value.contractTypes.filter(t => t !== typeToRemove);
};
// ✅ END: 新增合約方式的處理函式

const setupParamsListener = () => {
  paramsLoading.value = true;
  unsubscribeParams = listenToSalesParameters(projectId.value, (data) => {
    salesParameters.value = data;
    if(paramsLoading.value) paramsLoading.value = false;
  });
};

const openParameterDialog = () => {
  editingParameter.value = {
    statusName: '',
    colorCode: '#FFFFFF',
    order: (salesParameters.value.length + 1) * 10,
  };
  parameterDialog.value = true;
};

const editParameter = (param) => {
  editingParameter.value = { ...param };
  parameterDialog.value = true;
};

const closeParameterDialog = () => {
  parameterDialog.value = false;
  editingParameter.value = {};
};

const saveParameter = async () => {
  const { valid } = await parameterForm.value.validate();
  if (!valid) return;

  isSavingParameter.value = true;
  try {
    const { id, ...data } = editingParameter.value;
    if (id) {
      await updateSalesParameter(id, data);
      toast.success('狀態已成功更新！');
    } else {
      await addSalesParameter(projectId.value, data);
      toast.success('已成功新增狀態！');
    }
    closeParameterDialog();
  } catch (error) {
    toast.error(`儲存失敗: ${error.message}`);
  } finally {
    isSavingParameter.value = false;
  }
};

const confirmDelete = (param) => {
    parameterToDelete.value = param;
    deleteDialog.value = true;
};

const executeDelete = async () => {
    isDeleting.value = true;
    try {
        await deleteSalesParameter(parameterToDelete.value.id);
        toast.info('狀態已刪除');
        deleteDialog.value = false;
    } catch (error) {
        toast.error(`刪除失敗: ${error.message}`);
    } finally {
        isDeleting.value = false;
    }
};


onMounted(() => {
  if (projectId.value) {
    loadProjectSettings();
    setupParamsListener();
  } else {
    toast.error('錯誤：未提供專案 ID！');
  }
});

onUnmounted(() => {
  if (unsubscribeParams) {
    unsubscribeParams();
  }
});
</script>