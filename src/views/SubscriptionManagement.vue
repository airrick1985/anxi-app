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
              <v-col cols="12" sm="6"><v-select v-model="editedItem.建案名稱" :items="masterData.projectNames" label="建案名稱*" :rules="rules.required"></v-select></v-col>
              <v-col cols="12" sm="6"><v-select v-model="editedItem.系統功能" :items="masterData.systemFunctions" label="系統功能*" :rules="rules.required"></v-select></v-col>
              <v-col cols="12" sm="6"><v-text-field v-model="editedItem.聯絡人" label="聯絡人"></v-text-field></v-col>
              <v-col cols="12" sm="6"><v-text-field v-model="editedItem.聯絡人手機" label="聯絡人手機"></v-text-field></v-col>
              <v-col cols="12" sm="6"><v-text-field v-model="editedItem.訂閱類型" label="訂閱類型 (例如: 年繳)"></v-text-field></v-col>
              <v-col cols="12" sm="6"><v-text-field v-model="editedItem.繳費金額" label="繳費金額" type="number"></v-text-field></v-col>
              <v-col cols="12" sm="4"><v-text-field v-model="editedItem.繳費日期" label="繳費日期" type="date"></v-text-field></v-col>
              <v-col cols="12" sm="4"><v-text-field v-model="editedItem.啟用日期" label="啟用日期*" type="date" :rules="rules.required"></v-text-field></v-col>
              <v-col cols="12" sm="4"><v-text-field v-model="editedItem.停用日期" label="停用日期*" type="date" :rules="rules.required"></v-text-field></v-col>
              <v-col cols="12"><v-textarea v-model="editedItem.備註" label="備註" rows="2"></v-textarea></v-col>
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
            <strong>建案:</strong> {{ itemToDelete.建案名稱 }} <br>
            <strong>系統:</strong> {{ itemToDelete.系統功能 }} <br>
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
// 假設您的 api.js 匯出了這些函式
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
    { title: '建案名稱', key: '建案名稱' },
    { title: '系統功能', key: '系統功能' },
    { title: '啟用日期', key: '啟用日期' },
    { title: '停用日期', key: '停用日期' },
    { title: '聯絡人', key: '聯絡人' },
    { title: '聯絡人手機', key: '聯絡人手機' },
    { title: '訂閱類型', key: '訂閱類型' },
    { title: '操作', key: 'actions', sortable: false },
];

const dialog = ref(false);
const deleteDialog = ref(false);
const isEditing = ref(false);

const defaultItem = {
    SubscriptionID: null, 建案名稱: '', 系統功能: '', 聯絡人: '', 聯絡人手機: '',
    繳費日期: '', 訂閱類型: '', 啟用日期: '', 停用日期: '', 繳費金額: '', 備註: ''
};
const editedItem = ref({ ...defaultItem });
const itemToDelete = ref({});

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
    // 使用 v-model 綁定中文鍵名，這裡可以直接複製
    editedItem.value = item ? { ...item } : { ...defaultItem };
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

// 輔助函式：格式化日期，如果日期無效則返回 null
function formatDate(dateString) {
    if (!dateString) return null;
    const date = new Date(dateString);
    // 檢查日期是否有效
    if (isNaN(date.getTime())) return null;
    // 格式化為 YYYY-MM-DD，這是 GAS 最容易處理的格式
    return date.toISOString().split('T')[0];
}

async function save() {
    saving.value = true;
    
    // ★★★ 核心修改點 ★★★
    // 在發送前，建立一個乾淨且格式正確的 payload
    const payloadData = { ...editedItem.value };
    payloadData.繳費日期 = formatDate(payloadData.繳費日期);
    payloadData.啟用日期 = formatDate(payloadData.啟用日期);
    payloadData.停用日期 = formatDate(payloadData.停用日期);
    // 可選：確保金額是數字或 null
    payloadData.繳費金額 = payloadData.繳費金額 ? Number(payloadData.繳費金額) : null;


    try {
        if (isEditing.value) {
            // 在呼叫 updateSubscription 時，傳入整理過的 payloadData
            await updateSubscription(payloadData.SubscriptionID, payloadData, adminKey.value);
        } else {
            // 在呼叫 addSubscription 時，也傳入整理過的 payloadData
            await addSubscription(payloadData, adminKey.value);
        }
        alert('儲存成功！');
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
        await deleteSubscription(itemToDelete.value.SubscriptionID, adminKey.value);
        alert('刪除成功！');
        closeDeleteDialog();
        await loadData(); // 重新載入所有資料
    } catch (error) {
        console.error("刪除失敗:", error);
        alert('刪除失敗: ' + error.message);
    } finally {
        saving.value = false;
    }
}
</script>