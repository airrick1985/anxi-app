<template>
  <v-container>
    <v-card class="mx-auto" max-width="1200">
      <v-toolbar color="indigo" dark>
        <v-toolbar-title>
          <v-icon left>mdi-account-cog</v-icon>
          人員管理
        </v-toolbar-title>
        <v-spacer></v-spacer>
        <v-btn icon :loading="loading" @click="loadInitialData">
          <v-icon>mdi-refresh</v-icon>
        </v-btn>
      </v-toolbar>

      <v-card-text>
        <v-row>
          <v-col cols="12" md="6">
            <v-text-field
              v-model="searchPhone"
              label="輸入手機號碼查詢 / 新增"
              variant="outlined"
              dense
              hide-details
              @keydown.enter="handleSearchUser"
            >
              <template v-slot:append-inner>
                <v-btn :loading="loadingDetails" icon="mdi-magnify" variant="text" @click="handleSearchUser"></v-btn>
              </template>
            </v-text-field>
          </v-col>
          <v-col cols="12" md="6" class="d-flex justify-end">
            <v-btn color="primary" @click="openCreateDialog()">
              <v-icon left>mdi-plus</v-icon>
              新增人員
            </v-btn>
          </v-col>
        </v-row>

        <v-alert v-if="errorMessage" type="error" class="mt-4" dense closable v-model="showErrorAlert">
          {{ errorMessage }}
        </v-alert>

        <v-data-table
          :headers="tableHeaders"
          :items="manageableUsers"
          :loading="loading"
          item-value="phone"
          class="elevation-1 mt-4"
          no-data-text="沒有可管理的人員資料"
          loading-text="正在載入資料..."
          items-per-page-text="每頁筆數："
          :page-text="'{0}-{1} 筆 / 共 {2} 筆'"
        >
          <template v-slot:item.actions="{ item }">
          <v-btn small color="primary" @click="openEditDialog(item.phone)">
              編輯
            </v-btn>
          </template>
        </v-data-table>

      </v-card-text>

      <v-dialog v-model="dialogVisible" persistent max-width="1000px">
        <v-card>
          <v-card-title>
            <span class="text-h5">{{ isNewUser ? '新增人員' : '編輯人員' }}</span>
          </v-card-title>
          
          <div v-if="loadingDetails" class="text-center pa-10">
            <v-progress-circular indeterminate size="64" color="primary"></v-progress-circular>
            <p class="mt-4">正在載入人員資料...</p>
          </div>

          <div v-else-if="targetUser">
            <v-form ref="basicInfoForm" v-model="isFormValid">
              <v-card-text>
                <v-row>
           <v-col cols="12" md="4">
                    <v-text-field
                      v-model="targetUser.basicInfo.phone"
                      label="手機號碼"
                      variant="outlined"
                      dense
                      :readonly="!isNewUser"
                      :hint="isNewUser ? '手機號碼將作為新人員的登入帳號' : '手機號碼為唯一識別碼，不可修改'"
                      
                      @blur="validatePhoneNumber"
                      :loading="phoneValidationLoading"
                      :error-messages="phoneValidationError"
                      :success-messages="phoneValidationSuccess"
                      
                    ></v-text-field>
                  </v-col>
                  <v-col cols="12" md="4"><v-text-field v-model="targetUser.basicInfo.name" label="姓名" variant="outlined" dense :rules="rules.required"></v-text-field></v-col>
                  <v-col cols="12" md="4"><v-text-field v-model="targetUser.basicInfo.email" label="Email" variant="outlined" dense :rules="rules.required"></v-text-field></v-col>
                  <v-col cols="12" md="4"><v-text-field v-model="targetUser.basicInfo.password" label="密碼" variant="outlined" dense :rules="rules.required"></v-text-field></v-col>
                  <v-col cols="12" md="4"><v-text-field v-model="targetUser.basicInfo.companyName" label="公司名稱" variant="outlined" dense :rules="rules.required"></v-text-field></v-col>
                  <v-col cols="12" md="4"><v-text-field v-model="targetUser.basicInfo.companyTaxId" label="公司統編" variant="outlined" dense :rules="rules.required"></v-text-field></v-col>
                </v-row>
              </v-card-text>
            </v-form>

            <v-divider></v-divider>

            <v-card-text>
              <h3 class="mb-4">權限設定</h3>
              <p v-if="managedProjects.length === 0" class="text-grey">您沒有管理任何建案的權限。</p>
              <v-table v-else fixed-header class="permission-matrix">
                <thead>
                  <tr>
                    <th class="text-left sticky-col">系統功能</th>
                    <th v-for="project in managedProjects" :key="project" class="text-center">{{ project }}</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="system in allSystemFunctions" :key="system">
                    <td class="text-left sticky-col">{{ system }}</td>
                    <td v-for="project in managedProjects" :key="project" class="td-center">
                      <v-checkbox
                        v-if="adminCanAssign(project, system)"
                        v-model="permissionMatrix[system][project]"
                        hide-details
                      ></v-checkbox>
                      <v-icon v-else color="grey-lighten-1" title="您沒有指派此權限的權力">mdi-minus-circle-outline</v-icon>
                    </td>
                  </tr>
                </tbody>
              </v-table>
            </v-card-text>

            <v-card-actions class="pa-4">
              <v-spacer></v-spacer>
              <v-btn color="grey" @click="closeDialog">取消</v-btn>
              <v-btn color="success" :loading="saving" :disabled="!isFormValid" @click="handleSave">{{ isNewUser ? '建立新人員' : '儲存變更' }}</v-btn>
            </v-card-actions>
          </div>
        </v-card>
      </v-dialog>

    </v-card>
  </v-container>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { useUserStore } from '@/store/user';
import { 
  fetchAdminScope, 
  fetchUserDetailsForAdmin, 
  updateUserDetailsForAdmin,
  fetchManageableUsersForAdmin
} from '@/api.js';

const userStore = useUserStore();
const adminKey = computed(() => userStore.user?.key);

// --- Component State Refs ---
const loading = ref(true);
const loadingDetails = ref(false); // For dialog loading
const saving = ref(false);
const errorMessage = ref('');
const showErrorAlert = ref(false);

// --- Data Refs ---
const adminScope = ref({});
const allSystemFunctions = ref([]);
const managedProjects = ref([]);
const manageableUsers = ref([]);
const searchPhone = ref('');
const targetUser = ref(null);
const permissionMatrix = ref({});

// --- UI Control Refs ---
const dialogVisible = ref(false);
const isNewUser = ref(false);
const basicInfoForm = ref(null);
const isFormValid = ref(false);

// --- 新增的狀態變數 ---
const phoneValidationLoading = ref(false);
const phoneValidationError = ref('');
const phoneValidationSuccess = ref('');

const rules = {
  required: [ value => !!value || '此欄位為必填項。' ],
};

// --- 黑名單模組 ---
const blacklist = ['60763998', '0980371014'];

// --- Data Table Headers ---
const tableHeaders = ref([
  { title: '姓名', align: 'start', key: 'name' },
  { title: '手機號碼', key: 'phone' },
  { title: '操作', key: 'actions', sortable: false, align: 'center' },
]);

// --- Core Logic Functions ---

const loadInitialData = async () => {
  if (!adminKey.value) return;
  loading.value = true;
  errorMessage.value = '';
  showErrorAlert.value = false;

  try {
    const [scope, users] = await Promise.all([
      fetchAdminScope(adminKey.value),
      fetchManageableUsersForAdmin(adminKey.value)
    ]);
    
    adminScope.value = scope;
    manageableUsers.value = users;
    managedProjects.value = Object.keys(scope);
    
    const systems = new Set();
    Object.values(scope).forEach(perms => perms.forEach(p => systems.add(p)));
    allSystemFunctions.value = Array.from(systems).sort();

  } catch (error) {
    errorMessage.value = `初始化或重新整理失敗: ${error.message}`;
    showErrorAlert.value = true;
  } finally {
    loading.value = false;
  }
};

onMounted(loadInitialData);

const adminCanAssign = (project, system) => {
  return adminScope.value[project]?.includes(system);
};

// --- Dialog and Editing Logic ---

const openEditDialog = async (phone) => {
  // 從本地的 manageableUsers 陣列中安全地找到使用者物件
  const userFromTable = manageableUsers.value.find(u => u.phone === phone);
  if (!userFromTable) {
    errorMessage.value = `在列表中找不到手機為 ${phone} 的使用者。`;
    showErrorAlert.value = true;
    return;
  }

  isNewUser.value = false;
  dialogVisible.value = true;
  loadingDetails.value = true;
  targetUser.value = null; // Clear previous data

  try {
    const result = await fetchUserDetailsForAdmin(phone, adminKey.value);
    if (result.status === 'success') {
      targetUser.value = result.data;
      targetUser.value.basicInfo.phone = phone; // 使用傳入的 phone
      buildPermissionMatrix(result.data.permissions);
    } else {
      throw new Error(result.message);
    }
  } catch (error) {
    // 現在可以安全地使用從本地陣列中找到的 userFromTable 物件
    errorMessage.value = `查詢 ${userFromTable.name} 的資料失敗: ${error.message}`;
    showErrorAlert.value = true;
    closeDialog();
  } finally {
    loadingDetails.value = false;
  }
};

const resetPhoneValidation = () => {
  phoneValidationLoading.value = false;
  phoneValidationError.value = '';
  phoneValidationSuccess.value = '';
};


const openCreateDialog = (phone = '') => {
  resetPhoneValidation();
  isNewUser.value = true;
  targetUser.value = {
    basicInfo: {
      phone: phone,
      name: '', 
      email: '', 
      password: '', 
      companyName: '', 
      companyTaxId: '',
      role: ''
    },
    permissions: []
  };
  buildPermissionMatrix([]);
  dialogVisible.value = true;
};

const closeDialog = () => {
  dialogVisible.value = false;
  targetUser.value = null;
  searchPhone.value = ''; // Clear search phone on close
  resetPhoneValidation();
};

const handleSearchUser = async () => {
  const phoneToSearch = searchPhone.value.trim();
  if (!phoneToSearch) {
    errorMessage.value = '請輸入一個手機號碼。';
    showErrorAlert.value = true;
    return;
  }

  // --- 黑名單檢查邏輯 ---
  if (blacklist.includes(phoneToSearch) && phoneToSearch !== adminKey.value) {
    errorMessage.value = `您無權查詢或新增此號碼 (${phoneToSearch}) 的相關資料。`;
    showErrorAlert.value = true;
    return;
  }

  loadingDetails.value = true; // Use dialog loading indicator
  errorMessage.value = '';
  showErrorAlert.value = false;
  
  try {
    const result = await fetchUserDetailsForAdmin(phoneToSearch, adminKey.value);
    if (result.status === 'error') {
      if (result.message.includes('找不到手機號碼')) {
        // Not found, open create dialog with the searched phone number
        openCreateDialog(phoneToSearch);
      } else {
        throw new Error(result.message);
      }
    } else {
      // Found, open edit dialog
      isNewUser.value = false;
      targetUser.value = result.data;
      targetUser.value.basicInfo.phone = phoneToSearch;
      buildPermissionMatrix(result.data.permissions);
      dialogVisible.value = true;
    }
  } catch (error) {
    errorMessage.value = `查詢失敗：${error.message}`;
    showErrorAlert.value = true;
  } finally {
    loadingDetails.value = false;
  }
};

const buildPermissionMatrix = (permissions) => {
  const matrix = {};
  allSystemFunctions.value.forEach(system => {
    matrix[system] = {};
    managedProjects.value.forEach(project => {
      matrix[system][project] = false;
    });
  });

  permissions.forEach(perm => {
    const system = perm['系統功能'];
    const project = perm['建案名稱'];
    if (matrix[system] !== undefined && matrix[system][project] !== undefined) {
      matrix[system][project] = String(perm['權限']).toUpperCase() === 'Y';
    }
  });
  permissionMatrix.value = matrix;
};

const handleSave = async () => {
    if (!targetUser.value) return;

    // 1. 執行 Vuetify 表單驗證
    const { valid } = await basicInfoForm.value.validate();
    if (!valid) {
        alert('請檢查並填寫所有必填欄位。');
        return;
    }

    saving.value = true;
    const targetPhone = targetUser.value.basicInfo.phone?.trim();

    // --- 新功能：僅在「新增人員」模式下，檢查手機號碼是否已存在 ---
    if (isNewUser.value) {

       // 快速檢查：如果即時驗證已顯示錯誤，則直接中斷
    if (phoneValidationError.value) {
        alert('手機號碼已被註冊，請更換號碼後再儲存。');
        saving.value = false;
        return;
    }
    
        if (!targetPhone) {
            alert('手機號碼為必填項。');
            saving.value = false;
            return;
        }
        
        try {
            // 我們可以複用 fetchUserDetailsForAdmin 來檢查用戶是否存在
            const checkResult = await fetchUserDetailsForAdmin(targetPhone, adminKey.value);
            
            // 如果 API 呼叫成功 (status === 'success')，表示此用戶已存在
            if (checkResult.status === 'success') {
                alert(`錯誤：手機號碼 ${targetPhone} 已被註冊，無法新增。`);
                saving.value = false; // 關閉 Loading
                return; // 中斷儲存程序
            }

            // 如果 API 回報的是其他錯誤 (非「找不到手機號碼」)，也應中斷
            if (checkResult.status === 'error' && !checkResult.message.includes('找不到手機號碼')) {
                 throw new Error(`驗證號碼時出錯: ${checkResult.message}`);
            }
            // 如果 API 回報的是「找不到手機號碼」，則是我們期望的結果，可以繼續執行儲存。

        } catch (e) {
            // 處理檢查過程中可能發生的網路錯誤等
            alert(`儲存失敗：${e.message}`);
            saving.value = false;
            return;
        }
    }
    // --- 檢查結束 ---


    // --- 原有的儲存邏輯 ---
    // (如果上面的檢查通過，才會執行到這裡)
    try {
        const permissionsData = [];
        for (const system of allSystemFunctions.value) {
            for (const project of managedProjects.value) {
                if (adminCanAssign(project, system)) {
                    permissionsData.push({
                        phone: targetPhone,
                        name: targetUser.value.basicInfo.name,
                        projectName: project,
                        systemFunction: system,
                        permission: permissionMatrix.value[system][project] ? 'Y' : 'N'
                    });
                }
            }
        }

        const payload = {
            targetUserKey: targetPhone,
            adminKey: adminKey.value,
            adminName: userStore.user?.name,
            basicInfo: targetUser.value.basicInfo,
            permissionsData: permissionsData
        };

        const result = await updateUserDetailsForAdmin(payload);
        if (result.status === 'success') {
            alert(isNewUser.value ? '新人員建立成功！' : '人員資料更新成功！');
            closeDialog();
            await loadInitialData(); // Refresh the main table
        } else {
            throw new Error(result.message || '發生未知的錯誤');
        }
    } catch (error) {
        alert(`儲存失敗：${error.message}`);
    } finally {
        saving.value = false;
    }
};

// --- 新增的即時驗證函式 ---
const validatePhoneNumber = async () => {
  // 只在新增人員模式下才執行
  if (!isNewUser.value) return;

  const phone = targetUser.value.basicInfo.phone?.trim();
  
  // 清空舊的驗證訊息
  phoneValidationError.value = '';
  phoneValidationSuccess.value = '';

  // 如果號碼為空，則不進行驗證
  if (!phone) return;

  phoneValidationLoading.value = true;
  try {
    const checkResult = await fetchUserDetailsForAdmin(phone, adminKey.value);
    if (checkResult.status === 'success') {
      phoneValidationError.value = '此手機號碼已被註冊。';
    } else if (checkResult.status === 'error' && checkResult.message.includes('找不到手機號碼')) {
      phoneValidationSuccess.value = '此手機號碼可使用。';
    } else {
      // 其他 API 錯誤
      phoneValidationError.value = '驗證時發生錯誤。';
    }
  } catch (e) {
    phoneValidationError.value = '網路連線錯誤，無法驗證。';
  } finally {
    phoneValidationLoading.value = false;
  }
};

</script>

<style scoped>
.permission-matrix {
  border: 1px solid #e0e0e0;
  max-height: 400px; /* Add scroll for long permission lists */
  overflow: auto;
}
.permission-matrix th, .permission-matrix td {
  border: 1px solid #e0e0e0;
}
.sticky-col {
  position: sticky;
  left: 0;
  background-color: #f5f5f5;
  z-index: 1;
}
.td-center {
  text-align: center;
}
.td-center :deep(.v-checkbox) {
  display: inline-flex;
}
</style>