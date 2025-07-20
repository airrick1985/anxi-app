<template>
  <v-container>
    <v-card class="mx-auto" max-width="1200">
      <v-toolbar color="indigo" dark>
        <v-toolbar-title>
          <v-icon left>mdi-account-cog</v-icon>
          人員管理
        </v-toolbar-title>
      </v-toolbar>

            <v-card-text>
        <v-row align="start">
                    <v-col cols="12" md="6">
            <v-select
              v-model="selectedUserPhone"
              :items="manageableUsers"
              item-title="name"
              item-value="phone"
              label="從列表選擇管理人員"
              variant="outlined"
              dense
              :loading="loading"
              :disabled="loading"
              no-data-text="沒有可管理的人員"
              @update:modelValue="handleUserSelection"
              clearable
            >
              <template v-slot:item="{ props, item }">
                <v-list-item v-bind="props" :subtitle="item.raw.phone"></v-list-item>
              </template>
            </v-select>
          </v-col>
                    <v-col cols="12" md="6">
            <v-text-field
              v-model="searchPhone"
              label="或輸入手機號碼查詢 / 新增"
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
        </v-row>
        <v-alert v-if="errorMessage" type="error" class="mt-4" dense closable v-model="showErrorAlert">
          {{ errorMessage }}
        </v-alert>
      </v-card-text>
      
      <v-divider v-if="targetUser"></v-divider>

            <div v-if="isEditingUser">
        <v-card-title class="mt-4">
          <span v-if="isNewUser">新增人員：{{ targetUser.basicInfo.手機號碼 }}</span>
          <span v-else>編輯人員： {{ targetUser.basicInfo.NAME }} ({{ targetUser.basicInfo.手機號碼 }})</span>
        </v-card-title>
        
        <v-form ref="basicInfoForm" v-model="isFormValid">
          <v-card-text>
            <v-row>
              <v-col cols="12" md="4"><v-text-field v-model="targetUser.basicInfo.手機號碼" label="手機號碼" variant="outlined" dense readonly hint="手機號碼為唯一識別碼，不可修改"></v-text-field></v-col>
              <v-col cols="12" md="4"><v-text-field v-model="targetUser.basicInfo.NAME" label="姓名" variant="outlined" dense :rules="rules.required"></v-text-field></v-col>
              <v-col cols="12" md="4"><v-text-field v-model="targetUser.basicInfo.EMAIL" label="Email" variant="outlined" dense :rules="rules.required"></v-text-field></v-col>
              <v-col cols="12" md="4"><v-text-field v-model="targetUser.basicInfo.密碼" label="密碼" variant="outlined" dense :rules="rules.required"></v-text-field></v-col>
              <v-col cols="12" md="4"><v-text-field v-model="targetUser.basicInfo.公司名稱" label="公司名稱" variant="outlined" dense :rules="rules.required"></v-text-field></v-col>
              <v-col cols="12" md="4"><v-text-field v-model="targetUser.basicInfo.公司統編" label="公司統編" variant="outlined" dense :rules="rules.required"></v-text-field></v-col>
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
          <v-btn color="grey" @click="targetUser = null; selectedUserPhone = null; searchPhone = ''">取消</v-btn>
          <v-btn color="success" :loading="saving" :disabled="!isFormValid" @click="handleSave">{{ isNewUser ? '建立新人員' : '儲存變更' }}</v-btn>
        </v-card-actions>
      </div>
      
            <div v-if="loadingDetails" class="text-center pa-10">
        <v-progress-circular indeterminate size="64" color="primary"></v-progress-circular>
        <p class="mt-4">正在載入人員資料...</p>
      </div>

            <v-dialog v-model="showCreateUserDialog" persistent max-width="400">
        <v-card>
          <v-card-title>此號碼資料不存在</v-card-title>
          <v-card-text>
            系統中找不到手機號碼： <strong>{{ searchPhone }}</strong><br>
            您是否要為此號碼建立新的人員資料？
          </v-card-text>
          <v-card-actions>
            <v-spacer></v-spacer>
            <v-btn text @click="showCreateUserDialog = false">取消</v-btn>
            <v-btn color="primary" @click="startCreateNewUser">建立新人員</v-btn>
          </v-card-actions>
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

const loading = ref(true);
const loadingDetails = ref(false);
const saving = ref(false);
const errorMessage = ref('');
const showErrorAlert = ref(false);

const adminScope = ref({});
const allSystemFunctions = ref([]);
const managedProjects = ref([]);

const manageableUsers = ref([]);
const selectedUserPhone = ref(null);
const searchPhone = ref('');

const targetUser = ref(null);
const permissionMatrix = ref({});
const basicInfoForm = ref(null);
const isFormValid = ref(false);

const showCreateUserDialog = ref(false);
const isNewUser = ref(false);

const isEditingUser = computed(() => !loadingDetails.value && targetUser.value);

const rules = {
  required: [ value => !!value || '此欄位為必填項。' ],
};

onMounted(async () => {
  if (!adminKey.value) return;
  loading.value = true;
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
    errorMessage.value = `初始化頁面失敗: ${error.message}`;
    showErrorAlert.value = true;
  } finally {
    loading.value = false;
  }
});

const adminCanAssign = (project, system) => {
  return adminScope.value[project]?.includes(system);
};

const handleUserSelection = (phone) => {
    if (phone) {
        searchPhone.value = phone;
        handleSearchUser();
    } else {
        targetUser.value = null;
    }
};

const handleSearchUser = async () => {
  const phoneToSearch = searchPhone.value.trim();
  if (!phoneToSearch) {
    errorMessage.value = '請輸入或選擇一個手機號碼。';
    showErrorAlert.value = true;
    return;
  }
  loadingDetails.value = true;
  errorMessage.value = '';
  showErrorAlert.value = false;
  targetUser.value = null;

  try {
    const result = await fetchUserDetailsForAdmin(phoneToSearch, adminKey.value);
    if (result.status === 'error') {
      if (result.message.includes('找不到手機號碼')) {
        showCreateUserDialog.value = true;
      } else {
        throw new Error(result.message);
      }
    } else {
      isNewUser.value = false;
      targetUser.value = result;
      selectedUserPhone.value = phoneToSearch;
      buildPermissionMatrix(result.permissions);
    }
  } catch (error) {
    errorMessage.value = `查詢失敗：${error.message}`;
    showErrorAlert.value = true;
  } finally {
    loadingDetails.value = false;
  }
};

const startCreateNewUser = () => {
  showCreateUserDialog.value = false;
  isNewUser.value = true;
  targetUser.value = {
    basicInfo: {
      '手機號碼': searchPhone.value,
      'NAME': '', 'EMAIL': '', '密碼': '', '公司名稱': '', '公司統編': ''
    },
    permissions: []
  };
  buildPermissionMatrix([]);
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
    if (matrix[system] !== undefined) {
      matrix[system][project] = String(perm['權限']).toUpperCase() === 'Y';
    }
  });
  permissionMatrix.value = matrix;
};

const handleSave = async () => {
    if (!targetUser.value) return;
    const { valid } = await basicInfoForm.value.validate();
    if (!valid) {
        alert('請檢查並填寫所有必填欄位。');
        return;
    }
    saving.value = true;
    const permissionsData = [];
    for (const system of allSystemFunctions.value) {
        for (const project of managedProjects.value) {
            if (adminCanAssign(project, system)) {
                permissionsData.push({
                    phone: targetUser.value.basicInfo.手機號碼,
                    name: targetUser.value.basicInfo.NAME,
                    projectName: project,
                    systemFunction: system,
                    permission: permissionMatrix.value[system][project] ? 'Y' : 'N'
                });
            }
        }
    }
    try {
        const result = await updateUserDetailsForAdmin({
            targetUserKey: targetUser.value.basicInfo.手機號碼,
            adminKey: adminKey.value,
            basicInfo: targetUser.value.basicInfo,
            permissionsData: permissionsData
        });
        if (result.status === 'success') {
            alert(isNewUser.value ? '新人員建立成功！' : '人員資料更新成功！');
            targetUser.value = null; 
            searchPhone.value = '';
            selectedUserPhone.value = null;
            isNewUser.value = false;
            // 重新載入可管理人員列表，以包含新建立的人員
            await onMounted();
        } else {
            throw new Error(result.message);
        }
    } catch (error) {
        alert(`儲存失敗：${error.message}`);
    } finally {
        saving.value = false;
    }
};
</script>

<style scoped>
.permission-matrix {
  border: 1px solid #e0e0e0;
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