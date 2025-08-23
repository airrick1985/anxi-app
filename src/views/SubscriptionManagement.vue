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

    <v-dialog v-model="dialog" persistent max-width="800px">
      <v-card>
        <v-card-title>
          <span class="text-h5">{{ isEditing ? '編輯訂閱' : '新增訂閱' }}</span>
        </v-card-title>
        <v-card-text>
          <v-container>
            <v-row>
              <v-col cols="12" sm="6"><v-select v-model="editedItem.projectName" :items="masterData.projectNames" label="建案名稱*" :rules="rules.required"></v-select></v-col>
              <v-col cols="12" sm="6"><v-select v-model="editedItem.systemFunction" :items="masterData.systemFunctions" label="系統功能*" :rules="rules.required"></v-select></v-col>
              <v-col cols="12" sm="6"><v-text-field v-model="editedItem.contactName" label="聯絡人"></v-text-field></v-col>
              <v-col cols="12" sm="6"><v-text-field v-model="editedItem.contactPhone" label="聯絡人手機"></v-text-field></v-col>
              
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
          <v-card-title class="text-h5">確認刪除</v-card-title>
          <v-card-text>
            您確定要刪除這筆訂閱紀錄嗎？<br>
            <strong>建案:</strong> {{ itemToDelete.projectName }} <br>
            <strong>系統:</strong> {{ itemToDelete.systemFunction }} <br>
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
import { ref, onMounted, computed, nextTick } from 'vue';
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

const headers = [
    { title: '狀態', key: 'status', sortable: false },
    { title: '建案名稱', key: 'projectName' },
    { title: '系統功能', key: 'systemFunction' },
    { title: '啟用日期', key: 'startDate' },
    { title: '停用日期', key: 'endDate' },
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
    systemFunction: '', 
    contactName: '', 
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
};

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
        subscriptions.value = subs;
        masterData.value = mData;
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
    editedItem.value = item ? { ...item } : { ...defaultItem };
    
    const currentType = editedItem.value.subscriptionType;
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

async function save() {
    saving.value = true;
    
    const payloadData = { ...editedItem.value };

    if (subscriptionTypeSelection.value === '其他') {
        payloadData.subscriptionType = otherSubscriptionType.value;
    } else {
        payloadData.subscriptionType = subscriptionTypeSelection.value;
    }

    try {
        if (isEditing.value) {
            await updateSubscription(payloadData.id, payloadData, adminKey.value);
        } else {
            // ✅ 【核心修改點】在新增訂閱前，檢查是否存在重複的有效訂閱
            const isDuplicate = subscriptions.value.some(sub => 
                sub.projectName === payloadData.projectName &&
                sub.systemFunction === payloadData.systemFunction &&
                (sub.status === '啟用中' || sub.status.startsWith('即將到期'))
            );

            if (isDuplicate) {
                alert(`錯誤：建案「${payloadData.projectName}」的「${payloadData.systemFunction}」已有一個有效的訂閱。請勿重複建立。`);
                saving.value = false; // 停止 loading
                return; // 中斷儲存操作
            }
            
            const newId = `SUB-${Date.now()}`;
            payloadData.id = newId;
            await addSubscription(newId, payloadData, adminKey.value);
        }
        alert('儲存成功！');
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