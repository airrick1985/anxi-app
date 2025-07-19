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
        <v-row align="center">
          <v-col cols="12" md="5">
            <v-text-field
              v-model="searchPhone"
              label="請輸入人員手機號碼"
              variant="outlined"
              dense
              hide-details
              @keydown.enter="handleSearchUser"
            ></v-text-field>
          </v-col>
          <v-col cols="12" md="3">
            <v-btn :loading="loading" color="primary" @click="handleSearchUser" block>
              <v-icon left>mdi-magnify</v-icon>
              查詢人員
            </v-btn>
          </v-col>
        </v-row>
        <v-alert v-if="errorMessage" type="error" class="mt-4" dense closable v-model="showErrorAlert">
          {{ errorMessage }}
        </v-alert>
      </v-card-text>
      
      <v-divider v-if="targetUser"></v-divider>

      <div v-if="targetUser">
        <v-card-title class="mt-4">
          <span v-if="isNewUser">新增人員：{{ targetUser.basicInfo.手機號碼 }}</span>
          <span v-else>編輯人員： {{ targetUser.basicInfo.NAME }} ({{ targetUser.basicInfo.手機號碼 }})</span>
        </v-card-title>
        
        <v-form ref="basicInfoForm" v-model="isFormValid">
          <v-card-text>
            <v-row>
              <v-col cols="12" md="4"><v-text-field v-model="targetUser.basicInfo.手機號碼" label="手機號碼" variant="outlined" dense readonly hint="手機號碼為唯一識別碼，不可修改"></v-text-field></v-col>
              <v-col cols="12" md="4"><v-text-field v-model="targetUser.basicInfo.NAME" label="姓名" variant="outlined" dense></v-text-field></v-col>
              <v-col cols="12" md="4"><v-text-field v-model="targetUser.basicInfo.EMAIL" label="Email" variant="outlined" dense></v-text-field></v-col>
              <v-col cols="12" md="4"><v-text-field v-model="targetUser.basicInfo.密碼" label="密碼" variant="outlined" dense></v-text-field></v-col>
              <v-col cols="12" md="4"><v-text-field v-model="targetUser.basicInfo.公司名稱" label="公司名稱" variant="outlined" dense></v-text-field></v-col>
              <v-col cols="12" md="4"><v-text-field v-model="targetUser.basicInfo.公司統編" label="公司統編" variant="outlined" dense></v-text-field></v-col>
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
          <v-btn color="grey" @click="targetUser = null">取消</v-btn>
          <v-btn color="success" :loading="saving" @click="handleSave">{{ isNewUser ? '建立新人員' : '儲存變更' }}</v-btn>
        </v-card-actions>
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
import { fetchAdminScope, fetchUserDetailsForAdmin, updateUserDetailsForAdmin } from '@/api.js';

const userStore = useUserStore();
const adminKey = computed(() => userStore.user?.key);

const searchPhone = ref('');
const loading = ref(false);
const saving = ref(false);
const errorMessage = ref('');
const showErrorAlert = ref(false);

const adminScope = ref({});
const allSystemFunctions = ref([]);
const managedProjects = ref([]);

const targetUser = ref(null);
const permissionMatrix = ref({});
const isFormValid = ref(true);

const showCreateUserDialog = ref(false); // ✅ 控制新增人員對話框的顯示
const isNewUser = ref(false); // ✅ 標記當前是否為新增人員模式

onMounted(async () => {
  if (adminKey.value) {
    const scope = await fetchAdminScope(adminKey.value);
    adminScope.value = scope;
    managedProjects.value = Object.keys(scope);
    
    const systems = new Set();
    Object.values(scope).forEach(perms => perms.forEach(p => systems.add(p)));
    allSystemFunctions.value = Array.from(systems).sort();
  }
});

const adminCanAssign = (project, system) => {
  return adminScope.value[project]?.includes(system);
};

// ✅ 核心修改：更新查詢邏輯
const handleSearchUser = async () => {
  if (!searchPhone.value.trim()) {
    errorMessage.value = '請輸入手機號碼。';
    showErrorAlert.value = true;
    return;
  }
  loading.value = true;
  errorMessage.value = '';
  showErrorAlert.value = false;
  targetUser.value = null;

  try {
    const result = await fetchUserDetailsForAdmin(searchPhone.value, adminKey.value);
    if (result.status === 'error') {
      // 如果錯誤訊息是「找不到人員」，就彈出新增對話框
      if (result.message.includes('找不到手機號碼')) {
        showCreateUserDialog.value = true;
      } else {
        throw new Error(result.message);
      }
    } else {
      isNewUser.value = false; // 這是現有人員
      targetUser.value = result;
      buildPermissionMatrix(result.permissions);
    }
  } catch (error) {
    errorMessage.value = `查詢失敗：${error.message}`;
    showErrorAlert.value = true;
  } finally {
    loading.value = false;
  }
};

// ✅ 新增：處理建立新人員的邏輯
const startCreateNewUser = () => {
  showCreateUserDialog.value = false;
  isNewUser.value = true; // 進入新增模式
  
  // 建立一個空的人員資料結構
  targetUser.value = {
    basicInfo: {
      '手機號碼': searchPhone.value,
      'NAME': '',
      'EMAIL': '',
      '密碼': '',
      '公司名稱': '',
      '公司統編': ''
    },
    permissions: [] // 新人員沒有任何權限
  };
  // 建立一個全空的權限矩陣
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
            isNewUser.value = false;
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


/* ✅【核心修改】新增這個 class 的樣式 */
.td-center {
  text-align: center; /* 讓 icon 也置中 */
}
/* 讓 checkbox 在 td 內完美置中 */
.td-center :deep(.v-checkbox) {
  display: inline-flex;
}

</style>