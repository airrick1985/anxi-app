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
import { ref, onMounted, computed, nextTick, watch } from 'vue'; //  引入 watch
import { useUserStore } from '@/store/user';
import { 
    fetchAllSubscriptions,
    fetchMasterDataForSubscriptionForm,
    addSubscription,
    updateSubscription,
    deleteSubscription
} from '@/api.js';

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

//  修改點: defaultItem 的 systemFunction 初始化為空陣列
const defaultItem = {
    id: null,
    projectName: '', 
    projectId: '', 
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

const subscriptionTypeOptions = ['月繳', '年繳', '季繳', '試用', '其他'];
const subscriptionTypeSelection = ref('');
const otherSubscriptionType = ref('');


const rules = {
    required: [ value => !!value || '此欄位為必填項。' ],
    requiredArray: [ value => (value && value.length > 0) || '請至少選擇一個項目。' ],
    email: [ value => !value || /.+@.+\..+/.test(value) || 'E-mail 格式不正確。' ],
    //  新增 projectId 的驗證規則，用於手動輸入新ID時
    projectId: [
      v => !!v || '建案 ID 為必填項。',
      v => !projects.value.some(p => p.id === v) || '此建案 ID 已存在，請使用別的 ID。'
    ],
};

//  [新增] computed 屬性，用來判斷當前輸入的建案名稱是否已存在
const isProjectNameExisting = computed(() => {
  return !!editedItem.value.projectName && projects.value.some(p => p.name === editedItem.value.projectName);
});

//  [新增] computed 屬性，用來決定建案 ID 欄位是否應該禁用
const isProjectIdDisabled = computed(() => {
  // 編輯模式，或者選擇了現有的建案時，都禁用
  return isEditing.value || isProjectNameExisting.value;
});

//  [新增] 這是實現連動的核心邏輯
watch(() => editedItem.value.projectName, (newName) => {
  // 在編輯模式下，不自動變更 ID
  if (isEditing.value) return;

  // 從完整的 projects 列表中尋找匹配的建案
  const existingProject = projects.value.find(p => p.name === newName);
  
  if (existingProject) {
    // 如果找到了，自動填入對應的 projectId
    editedItem.value.projectId = existingProject.id;
  } else {
    // 如果沒找到 (代表是手動輸入的新建案)，則清空 projectId 讓使用者自行填寫
    editedItem.value.projectId = '';
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
        
        //  計算每筆訂閱的天數並附加到物件中
        subscriptions.value = subs.map(sub => {
  const newSub = { ...sub };

  // --- 計算 durationDays (邏輯不變) ---
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

  // ---  START: 新增計算 currentUserLimit 的邏輯 ---
  const tiers = sub.userLimitTiers || [];
  if (tiers.length > 0) {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // 標準化為當天零點

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
    newSub.currentUserLimit = 0; // 如果沒有設定任何方案，則上限為 0
  }
  // ---  END: 新增計算 currentUserLimit 的邏輯 ---

  return newSub;
});

//  [修正] 正確處理 API 回傳的資料
        projects.value = mData.projects; // 儲存完整的專案列表 {id, name}
        masterData.value = {
            projectNames: mData.projects.map(p => p.name), // 只取出 name 陣列給下拉選單用
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

//  修改點: openEditDialog 需處理 systemFunction 的資料格式
function openEditDialog(item) {
    isEditing.value = !!item;
    
    if (item) {
        // 編輯模式：複製資料，並確保 systemFunction 和 userLimitTiers 是陣列
        editedItem.value = { ...item, userLimitTiers: item.userLimitTiers || [] }; //  修改此行
        if (typeof editedItem.value.systemFunction === 'string') {
            editedItem.value.systemFunction = [editedItem.value.systemFunction];
        }
    } else {
        // 新增模式：使用預設值
        editedItem.value = { ...defaultItem };
    }
    
    // 處理訂閱類型顯示的邏輯不變
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

// 新增 Tier 管理函式
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
// 新增 Tier 管理函式

//  修改點: save 函式需處理多筆建立的邏輯
async function save() {
    saving.value = true;
    
    const basePayload = { ...editedItem.value };

    // 確保 userLimitTiers 中的日期是標準的 YYYY-MM-DD 格式
    if (basePayload.userLimitTiers && Array.isArray(basePayload.userLimitTiers)) {
      basePayload.userLimitTiers = basePayload.userLimitTiers.map(tier => ({
        ...tier,
        count: Number(tier.count) || 0, // 確保是數字
        paymentAmount: Number(tier.paymentAmount) || 0,
        startDate: tier.startDate ? new Date(tier.startDate).toISOString().split('T')[0] : '',
        endDate: tier.endDate ? new Date(tier.endDate).toISOString().split('T')[0] : '',
      })).filter(tier => tier.startDate && tier.endDate); // 過濾掉不完整的項目
    }

    if (subscriptionTypeSelection.value === '其他') {
        basePayload.subscriptionType = otherSubscriptionType.value;
    } else {
        basePayload.subscriptionType = subscriptionTypeSelection.value;
    }

    try {
        if (isEditing.value) {
            // 編輯模式：僅更新單筆資料
            const payloadData = { ...basePayload };
            // 從陣列取回單一值進行儲存
            payloadData.systemFunction = basePayload.systemFunction[0] || ''; 
            await updateSubscription(payloadData.id, payloadData, adminKey.value);
            alert('儲存成功！');
        } else {
            // 新增模式：為每個選擇的系統建立一筆訂閱
            const selectedSystems = basePayload.systemFunction;

            if (!selectedSystems || selectedSystems.length === 0) {
                alert('請至少選擇一個系統功能。');
                saving.value = false;
                return;
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
                // payloadData.id = newId; //  註解此行，ID 由後端API參數傳入
                
                return addSubscription(newId, payloadData, adminKey.value);
            });

            await Promise.all(creationPromises);
            alert(`成功新增 ${creationPromises.length} 筆訂閱！`);
        }
        
        closeDialog();
        await loadData();
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