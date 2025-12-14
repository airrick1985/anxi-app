<template>
  <v-container>
    <v-card class="mx-auto">
      <v-toolbar color="#004383" dark>
        <v-toolbar-title>
          <v-icon left>mdi-calendar-star</v-icon>
          訂閱管理
        </v-toolbar-title>
        <v-spacer></v-spacer>
        <v-btn color="white" @click="openEditDialog()">
          <v-icon left>mdi-plus</v-icon>
          新增訂閱
        </v-btn>
      </v-toolbar>
      <v-card-title>
        <v-text-field
          v-model="search"
          label="搜尋建案、系統或聯絡人..."
          prepend-inner-icon="mdi-magnify"
          variant="outlined"
          dense
          hide-details
          clearable
        ></v-text-field>
      </v-card-title>

<v-data-table
        :headers="headers"
        :items="subscriptions"
        :search="search"
        :loading="loading"
        class="elevation-1"
        items-per-page-text="每頁顯示："
        :page-text="`第 {0} - {1} 筆，共 {2} 筆`"
      >
        <template v-slot:item.status="{ item }">
          <v-chip :color="item.color" size="small" label>{{ item.status }}</v-chip>
        </template>
        
         <template v-slot:item.currentUserLimit="{ item }">
          <v-chip v-if="typeof item.currentUserLimit === 'number'" color="primary" size="small" label>
            <v-icon start>mdi-account-group</v-icon>
            {{ item.currentUserLimit }} 人
          </v-chip>
          <span v-else class="text-grey">{{ item.currentUserLimit }}</span>
        </template>

        <template v-slot:item.durationDays="{ item }">
          <v-chip v-if="typeof item.durationDays === 'number'" color="blue-grey" size="small" label>
            {{ item.durationDays }} 天
          </v-chip>
          <span v-else class="text-grey">{{ item.durationDays }}</span>
        </template>
        
        <template v-slot:item.actions="{ item }">
          <v-icon class="me-2" @click="openEditDialog(item)">mdi-pencil</v-icon>
          <v-icon color="error" @click="openDeleteDialog(item)">mdi-delete</v-icon>
        </template>
        <template v-slot:no-data>
          <div class="pa-4 text-center">
            <p>目前沒有任何訂閱紀錄</p>
          </div>
        </template>
      </v-data-table>
    </v-card>

   <v-dialog v-model="dialog" persistent max-width="1200px">
      <v-card>
        <v-card-title class="bg-blue-darken-4 text-white d-flex align-center">
          <span class="text-h5">{{ isEditing ? '編輯訂閱' : '新增訂閱' }}</span>
          <v-spacer></v-spacer>
          <v-btn icon="mdi-close" variant="text" @click="closeDialog"></v-btn>
        </v-card-title>
        <v-card-text>
          <v-container>
            <v-row>
              <v-col cols="12" sm="6">
             <v-combobox
                  v-model="editedItem.projectName"
                  :items="masterData.projectNames"
                  label="建案名稱*"
                  :rules="rules.required"
                  hint="可從選單選取或手動輸入新名稱"
                  persistent-hint
                ></v-combobox>
              </v-col>

               <v-col cols="12" sm="6">
                <v-text-field
                  v-model="editedItem.projectId"
                  label="建案 ID*"
                  :rules="!isProjectIdDisabled ? rules.projectId : []"
                  :disabled="isProjectIdDisabled"
                  :hint="isProjectIdDisabled ? '系統已有ID，不可任意修改' : '請為新專案設定一個唯一ID，英文及數字組合'"
                  persistent-hint
                ></v-text-field>
              </v-col>

              <v-col cols="12">
                <v-file-input
                  v-model="fileToUpload"
                  label="建案圖示 (上傳新圖檔將覆蓋舊檔)"
                  accept="image/png, image/jpeg, image/gif"
                  prepend-icon="mdi-image-area"
                  variant="outlined"
                  density="compact"
                  clearable
                ></v-file-input>
                <v-img
                  v-if="iconPreviewUrl"
                  :src="iconPreviewUrl"
                  height="100"
                  contain
                  class="mt-2"
                  style="border: 1px solid #e0e0e0; border-radius: 4px;"
                ></v-img>
                <div v-else class="text-center text-grey-darken-1 pa-4" style="border: 2px dashed #ccc; border-radius: 8px;">
                  尚無建案圖示
                </div>
              </v-col>
              <v-col cols="12">
                <v-divider class="my-3"></v-divider>
              </v-col>

              <v-col cols="12" sm="6">
                <v-select
                  v-model="editedItem.systemFunction"
                  :items="masterData.systemFunctions"
                  label="系統功能*"
                  :rules="rules.requiredArray"
                  multiple
                  chips
                  closable-chips
                  :disabled="isEditing"
                  :hint="isEditing ? '編輯模式下無法修改系統功能' : ''"
                  :persistent-hint="isEditing"
                ></v-select>
              </v-col>
              <v-col cols="12" sm="6"><v-text-field v-model="editedItem.contactName" label="聯絡人"></v-text-field></v-col>
              <v-col cols="12" sm="6"><v-text-field v-model="editedItem.contactPhone" label="聯絡人手機"></v-text-field></v-col>
              <v-col cols="12">
                              <v-text-field 
                                v-model="editedItem.contactEmail" 
                                label="聯絡人Email"
                                :rules="rules.email"
                              ></v-text-field>
                            </v-col>
              <v-col cols="12" sm="6">
                <v-select
                  v-model="subscriptionTypeSelection"
                  :items="['月繳', '年繳', '季繳', '試用', '其他']"
                  label="訂閱類型"
                ></v-select>
                <v-text-field
                  v-if="subscriptionTypeSelection === '其他'"
                  v-model="otherSubscriptionType"
                  label="請輸入其他類型"
                  class="mt-2"
                  variant="outlined"
                  dense
                ></v-text-field>
              </v-col>
              
              <v-col cols="12" sm="6"><v-text-field v-model="editedItem.paymentAmount" label="繳費金額" type="number"></v-text-field></v-col>
              <v-col cols="12" sm="4"><v-text-field v-model="editedItem.paymentDate" label="繳費日期" type="date"></v-text-field></v-col>
              <v-col cols="12" sm="4"><v-text-field v-model="editedItem.startDate" label="啟用日期*" type="date" :rules="rules.required"></v-text-field></v-col>
              <v-col cols="12" sm="4"><v-text-field v-model="editedItem.endDate" label="停用日期*" type="date" :rules="rules.required"></v-text-field></v-col>
              <v-col cols="12">
                <v-divider class="my-4"></v-divider>
                <div class="d-flex align-center mb-2">
                  <h3 class="text-h6 font-weight-medium">使用者人數方案</h3>
                  <v-spacer></v-spacer>
                  <v-btn color="primary" @click="addUserTier" prepend-icon="mdi-plus">
                    新增方案
                  </v-btn>
                </div>

                <div v-if="!editedItem.userLimitTiers || editedItem.userLimitTiers.length === 0" class="text-center text-grey py-4 my-2" style="border: 2px dashed #ccc; border-radius: 8px;">
                  尚未設定任何使用者人數方案
                </div>

                <v-card 
                  v-for="(tier, index) in editedItem.userLimitTiers" 
                  :key="index" 
                  class="mb-3"
                  variant="outlined"
                >
                  <v-card-text>
                    <v-row align="center">
                      <v-col cols="6" sm="4" md="2">
                        <v-text-field
                          v-model.number="tier.count"
                          label="人數"
                          type="number"
                          variant="outlined"
                          density="compact"
                          hide-details="auto"
                          persistent-hint
                        ></v-text-field>
                      </v-col>
                      <v-col cols="6" sm="4" md="2">
                        <v-text-field
                          v-model.number="tier.paymentAmount"
                          label="付款金額"
                          type="number"
                          variant="outlined"
                          density="compact"
                          hide-details="auto"
                        ></v-text-field>
                      </v-col>
                      <v-col cols="12" sm="4" md="2">
                        <v-text-field
                          v-model="tier.paymentDate"
                          label="付款日期"
                          type="date"
                          variant="outlined"
                          density="compact"
                          hide-details="auto"
                        ></v-text-field>
                      </v-col>
                      <v-col cols="12" sm="6" md="2">
                        <v-text-field
                          v-model="tier.startDate"
                          label="啟用日期*"
                          type="date"
                          variant="outlined"
                          density="compact"
                          hide-details="auto"
                          :rules="rules.required"
                        ></v-text-field>
                      </v-col>
                      <v-col cols="12" sm="6" md="2">
                        <v-text-field
                          v-model="tier.endDate"
                          label="停用日期*"
                          type="date"
                          variant="outlined"
                          density="compact"
                          hide-details="auto"
                          :rules="rules.required"
                        ></v-text-field>
                      </v-col>
                      <v-col cols="12" md="1" class="text-center">
                        <v-btn icon="mdi-delete" color="error" variant="text" @click="removeUserTier(index)"></v-btn>
                      </v-col>
                    </v-row>
                  </v-card-text>
                </v-card>
              </v-col>
              
              <v-col cols="12"><v-textarea v-model="editedItem.remarks" label="備註" rows="2"></v-textarea></v-col>
            </v-row>
          </v-container>
          <small>* 為必填欄位</small>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="blue-darken-1" variant="text" @click="closeDialog">取消</v-btn>
          <v-btn color="blue-darken-1" variant="text" @click="save" :loading="saving">儲存</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="deleteDialog" persistent max-width="400">
        <v-card>
          <v-card-title class="text-h6 d-flex align-center bg-red-lighten-4">
          <v-icon start color="red-darken-2">mdi-alert-circle-outline</v-icon>
          確認刪除訂閱
        </v-card-title>
          <v-card-text>
            您確定要刪除這筆訂閱紀錄嗎？<br>
            <br>
            <strong>建案:</strong> {{ itemToDelete.projectName }} <br>
            <strong>系統:</strong> {{ itemToDelete.systemFunction }} <br>
            <br>
            此操作無法復原。
          </v-card-text>
          <v-card-actions>
            <v-spacer></v-spacer>
            <v-btn text @click="closeDeleteDialog">取消</v-btn>
            <v-btn color="error" text @click="confirmDelete" :loading="saving">確認刪除</v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>
  </v-container>
</template>

<script setup>
import { ref, onMounted, computed, nextTick, watch } from 'vue';
import { useUserStore } from '@/store/user';
import { 
    fetchAllSubscriptions,
    fetchMasterDataForSubscriptionForm,
    addSubscription,
    updateSubscription,
    deleteSubscription,
    //  1. 從 @/api.js 引入 SalesSettings 在用的函式
    uploadSalesImage, 
    updateProjectSalesSettings, 
} from '@/api.js'; 
//  2. 移除 firebase/storage 的 import，我們不再需要它
// import { getStorage, ref as storageRef, uploadBytes, getDownloadURL } from "firebase/storage";

const userStore = useUserStore();
const adminKey = computed(() => userStore.user?.key);

const loading = ref(true);
const saving = ref(false);
const search = ref('');
const subscriptions = ref([]);
const masterData = ref({ projectNames: [], systemFunctions: [] });
const projects = ref([]);

const headers = [
    { title: '狀態', key: 'status', sortable: false },
    { title: '建案名稱', key: 'projectName' },
    { title: '系統功能', key: 'systemFunction' },
    { title: '使用者上限', key: 'currentUserLimit', align: 'center' },
    { title: '啟用日期', key: 'startDate' },
    { title: '停用日期', key: 'endDate' },
    { title: '訂閱天數', key: 'durationDays' },
    { title: '聯絡人', key: 'contactName' },
    { title: '聯絡人手機', key: 'contactPhone' },
    { title: '訂閱類型', key: 'subscriptionType' },
    { title: '操作', key: 'actions', sortable: false },
];

const dialog = ref(false);
const deleteDialog = ref(false);
const isEditing = ref(false);

const defaultItem = {
    id: null,
    projectName: '', 
    projectId: '', 
    iconUrl: '', 
    systemFunction: [], 
    userLimitTiers: [],
    contactName: '', 
    contactEmail: '', 
    contactPhone: '',
    paymentDate: '', 
    subscriptionType: '', 
    startDate: '', 
    endDate: '', 
    paymentAmount: '', 
    remarks: ''
};
const editedItem = ref({ ...defaultItem });
const itemToDelete = ref({});

const fileToUpload = ref(null);
const newIconPreview = ref(null);

const iconPreviewUrl = computed(() => {
  return newIconPreview.value || editedItem.value.iconUrl;
});

watch(fileToUpload, (newFile) => {
  if (newIconPreview.value) {
    URL.revokeObjectURL(newIconPreview.value);
    newIconPreview.value = null;
  }
  if (newFile) {
    newIconPreview.value = URL.createObjectURL(newFile);
  }
});

const subscriptionTypeOptions = ['月繳', '年繳', '季繳', '試用', '其他'];
const subscriptionTypeSelection = ref('');
const otherSubscriptionType = ref('');


const rules = {
    required: [ value => !!value || '此欄位為必填項。' ],
    requiredArray: [ value => (value && value.length > 0) || '請至少選擇一個項目。' ],
    email: [ value => !value || /.+@.+\..+/.test(value) || 'E-mail 格式不正確。' ],
    projectId: [
      v => !!v || '建案 ID 為必填項。',
      // ✓ [新增] 即時驗證規則：僅允許半形英文及數字
      v => /^[a-zA-Z0-9]+$/.test(v) || '僅能輸入半形英文及數字。',
      v => !projects.value.some(p => p.id === v) || '此建案 ID 已存在，請使用別的 ID。'
    ],
};

const isProjectNameExisting = computed(() => {
  return !!editedItem.value.projectName && projects.value.some(p => p.name === editedItem.value.projectName);
});

const isProjectIdDisabled = computed(() => {
  return isEditing.value || isProjectNameExisting.value;
});

watch(() => editedItem.value.projectName, (newName) => {
  if (isEditing.value) return;

  const existingProject = projects.value.find(p => p.name === newName);
  
  if (existingProject) {
    editedItem.value.projectId = existingProject.id;
    editedItem.value.iconUrl = existingProject.iconUrl || '';
  } else {
    editedItem.value.projectId = '';
    editedItem.value.iconUrl = '';
  }
});

async function loadData() {
    if (!adminKey.value) {
        alert('無法獲取管理者資訊，請重新登入。');
        return;
    }
    loading.value = true;
    try {
        const [subs, mData] = await Promise.all([
            fetchAllSubscriptions(adminKey.value),
            fetchMasterDataForSubscriptionForm(adminKey.value)
        ]);
        
        subscriptions.value = subs.map(sub => {
          const newSub = { ...sub };

          // --- 計算 durationDays ---
          if (sub.startDate && sub.endDate) {
            const startDate = new Date(sub.startDate);
            const endDate = new Date(sub.endDate);
            if (!isNaN(startDate) && !isNaN(endDate)) {
              const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
              const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
              newSub.durationDays = diffDays;
            } else {
              newSub.durationDays = 'N/A';
            }
          } else {
            newSub.durationDays = 'N/A';
          }

          // --- 計算 currentUserLimit ---
          const tiers = sub.userLimitTiers || [];
          if (tiers.length > 0) {
            const today = new Date();
            today.setHours(0, 0, 0, 0); 

            let effectiveLimit = 0;
            tiers.forEach(tier => {
              if (tier.startDate && tier.endDate) {
                const tierStartDate = new Date(tier.startDate);
                const tierEndDate = new Date(tier.endDate);
                tierStartDate.setHours(0, 0, 0, 0);
                tierEndDate.setHours(0, 0, 0, 0);

                if (today >= tierStartDate && today <= tierEndDate) {
                  effectiveLimit += Number(tier.count) || 0;
                }
              }
            });
            newSub.currentUserLimit = effectiveLimit;
          } else {
            newSub.currentUserLimit = 0;
          }
          return newSub;
        });

        projects.value = mData.projects; 
        masterData.value = {
            projectNames: mData.projects.map(p => p.name), 
            systemFunctions: mData.systemFunctions
        };

    } catch (error) {
        console.error("載入資料失敗:", error);
        alert('載入資料失敗: ' + error.message);
    } finally {
        loading.value = false;
    }
}

onMounted(loadData);

function openEditDialog(item) {
    isEditing.value = !!item;
    
    fileToUpload.value = null;
    if (newIconPreview.value) {
      URL.revokeObjectURL(newIconPreview.value);
      newIconPreview.value = null;
    }

    if (item) {
        editedItem.value = { ...item, userLimitTiers: item.userLimitTiers || [] };
        if (typeof editedItem.value.systemFunction === 'string') {
            editedItem.value.systemFunction = [editedItem.value.systemFunction];
        }
        const project = projects.value.find(p => p.name === item.projectName);
        editedItem.value.iconUrl = project ? project.iconUrl : '';
    } else {
        editedItem.value = { ...defaultItem };
    }
    
    const currentType = item ? item.subscriptionType : '';
    if (currentType && subscriptionTypeOptions.includes(currentType)) {
        subscriptionTypeSelection.value = currentType;
        otherSubscriptionType.value = '';
    } else if (currentType) {
        subscriptionTypeSelection.value = '其他';
        otherSubscriptionType.value = currentType;
    } else {
        subscriptionTypeSelection.value = '';
        otherSubscriptionType.value = '';
    }
    
    dialog.value = true;
}

function closeDialog() {
    dialog.value = false;
}

function openDeleteDialog(item) {
    itemToDelete.value = { ...item };
    deleteDialog.value = true;
}

function closeDeleteDialog() {
    deleteDialog.value = false;
    nextTick(() => {
        itemToDelete.value = {};
    });
}

function addUserTier() {
  if (!editedItem.value.userLimitTiers) {
    editedItem.value.userLimitTiers = [];
  }
  const today = new Date().toISOString().split('T')[0];
  editedItem.value.userLimitTiers.push({
    count: 1,
    paymentAmount: 0,       
    paymentDate: today,     
    startDate: today,
    endDate: today,
  });
}

function removeUserTier(index) {
  editedItem.value.userLimitTiers.splice(index, 1);
}

//  3. 新增 fileToBase64 輔助函式 (同 SalesSettings.vue)
const fileToBase64 = (file) => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.readAsDataURL(file);
  reader.onload = () => {
    const base64String = reader.result.split(',')[1];
    resolve(base64String);
  };
  reader.onerror = error => reject(error);
});

//  4. 修改 save 函式以使用 Base64 代理上傳
async function save() {
    saving.value = true;
    let uploadedIconUrl = null; 

    try {
        // ✓ [新增] 儲存前強制驗證建案 ID 格式 (防止用戶忽略錯誤提示硬送出)
        if (!isProjectIdDisabled.value) {
             if (!editedItem.value.projectId) {
                 throw new Error('建案 ID 為必填項。');
             }
             if (!/^[a-zA-Z0-9]+$/.test(editedItem.value.projectId)) {
                 throw new Error('建案 ID 僅能輸入半形英文及數字。');
             }
        }

        // --- 步驟 1: 處理圖檔上傳 (使用 Base64 代理) ---
        if (fileToUpload.value) {
            const projectId = editedItem.value.projectId;
            if (!projectId) {
                throw new Error('必須先指定建案 ID 才能上傳圖檔。');
            }
            
            const fileExtension = fileToUpload.value.name.split('.').pop();
            const storagePath = `projects/${projectId}/icon.${fileExtension}`;
            
            console.log(`正在轉換 Base64 並上傳至: ${storagePath}`);

            const base64 = await fileToBase64(fileToUpload.value);

            // 呼叫 SalesSettings 使用的 API 函式
            const { downloadURL } = await uploadSalesImage(
                storagePath,
                fileToUpload.value.name,
                base64,
                projectId
            );
            
            uploadedIconUrl = downloadURL; 
            console.log('圖檔上傳成功, URL:', uploadedIconUrl);
        }

        // --- 步驟 2: 處理訂閱資料儲存 (既有邏輯) ---
        // ... (以下邏輯保持不變)
        const basePayload = { ...editedItem.value };

        if (basePayload.userLimitTiers && Array.isArray(basePayload.userLimitTiers)) {
          basePayload.userLimitTiers = basePayload.userLimitTiers.map(tier => ({
            ...tier,
            count: Number(tier.count) || 0,
            paymentAmount: Number(tier.paymentAmount) || 0,
            startDate: tier.startDate ? new Date(tier.startDate).toISOString().split('T')[0] : '',
            endDate: tier.endDate ? new Date(tier.endDate).toISOString().split('T')[0] : '',
          })).filter(tier => tier.startDate && tier.endDate);
        }

        if (subscriptionTypeSelection.value === '其他') {
            basePayload.subscriptionType = otherSubscriptionType.value;
        } else {
            basePayload.subscriptionType = subscriptionTypeSelection.value;
        }

        if (isEditing.value) {
            const payloadData = { ...basePayload };
            payloadData.systemFunction = basePayload.systemFunction[0] || ''; 
            await updateSubscription(payloadData.id, payloadData, adminKey.value);
            alert('訂閱資料儲存成功！');
        } else {
            const selectedSystems = basePayload.systemFunction;
            if (!selectedSystems || selectedSystems.length === 0) {
                throw new Error('請至少選擇一個系統功能。');
            }

            const creationPromises = selectedSystems.map((system, index) => {
                const payloadData = { ...basePayload, systemFunction: system };
                const isDuplicate = subscriptions.value.some(sub => 
                    sub.projectName === payloadData.projectName &&
                    sub.systemFunction === payloadData.systemFunction &&
                    (sub.status === '啟用中' || sub.status.startsWith('即將到期'))
                );
                if (isDuplicate) {
                    throw new Error(`錯誤：建案「${payloadData.projectName}」的「${payloadData.systemFunction}」已有一個有效的訂閱。`);
                }
                const newId = `SUB-${Date.now()}-${index}`;
                return addSubscription(newId, payloadData, adminKey.value);
            });
            await Promise.all(creationPromises);
            alert(`成功新增 ${creationPromises.length} 筆訂閱！`);
        }
        
        // --- 步驟 3: 處理建案圖示 URL 更新 (使用 SalesSettings 的 API) ---
        if (uploadedIconUrl) {
            const projectId = editedItem.value.projectId;
            console.log(`正在更新 projects/${projectId} 的 iconUrl...`);
            
            // 呼叫 SalesSettings 用來更新專案的 API 函式
            await updateProjectSalesSettings(projectId, { 
                iconUrl: uploadedIconUrl 
            });
            
            alert('建案圖示已同步更新！');
        }

        closeDialog();
        await loadData(); // 重新載入所有資料

    } catch (error) {
        console.error("儲存失敗:", error);
        alert('儲存失敗: ' + error.message);
    } finally {
        saving.value = false;
    }
}

async function confirmDelete() {
    saving.value = true;
    try {
        await deleteSubscription(itemToDelete.value.id, adminKey.value);
        alert('刪除成功！');
        closeDeleteDialog();
        await loadData();
    } catch (error) {
        console.error("刪除失敗:", error);
        alert('刪除失敗: ' + error.message);
    } finally {
        saving.value = false;
    }
}
</script>