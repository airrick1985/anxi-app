<template>
  <v-container>
    <v-card class="mx-auto" max-width="1200">
      <v-toolbar color="indigo" dark>
        <v-toolbar-title>
          <v-icon left>mdi-account-cog</v-icon>
          人員管理
        </v-toolbar-title>
      </v-toolbar>

      <v-tabs v-model="currentTab" bg-color="transparent" grow>
        <v-tab value="users">人員列表</v-tab>
        <v-tab v-if="isSuperAdmin" value="roles">角色設定</v-tab>
        <v-tab v-if="isSuperAdmin" value="functions">權限功能管理</v-tab>
      </v-tabs>
      <v-divider></v-divider>

      <v-window v-model="currentTab">
        <v-window-item value="users">
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
              <template v-if="canViewAndEditRoles" v-slot:item.roles="{ item }">
                <v-combobox
                  :model-value="item.roles"
                  @update:model-value="newRoles => handleRolesChange(item, newRoles)"
                  :items="availableRolesForAssignment"
                  multiple
                  chips
                  closable-chips
                  variant="outlined"
                  density="compact"
                  hide-details
                  placeholder="點此新增角色"
                  :loading="item.rolesLoading"
                  class="py-2"
                >
                  <template v-slot:selection="{ item: chipItem, index }">
                    <v-chip :key="index" closable @click:close="removeRole(item, chipItem.title)">
                      {{ chipItem.title }}
                    </v-chip>
                  </template>
                </v-combobox>
              </template>
              <template v-slot:item.actions="{ item }">
                <v-btn small color="primary" @click="openEditDialog(item.phone)">編輯</v-btn>
              </template>
            </v-data-table>
          </v-card-text>
        </v-window-item>

        <v-window-item v-if="isSuperAdmin" value="roles">
          <v-card-text>
            <v-row>
              <v-col cols="12" md="4">
                <v-card outlined>
                  <v-list dense>
                    <v-list-subheader>所有角色</v-list-subheader>
                    <v-list-item
                      v-for="(role, index) in roles"
                      :key="role.id"
                      @click="selectedRoleIndex = index"
                      :active="selectedRoleIndex === index"
                      color="primary"
                    >
                      <v-list-item-title>{{ role.name }}</v-list-item-title>
                    </v-list-item>
                  </v-list>
                  <v-divider></v-divider>
                  <v-card-actions>
                    <v-btn block color="primary" @click="createNewRole">
                      <v-icon left>mdi-plus</v-icon>
                      新增角色
                    </v-btn>
                  </v-card-actions>
                </v-card>
              </v-col>

              <v-col cols="12" md="8">
                <v-card v-if="selectedRole" :key="selectedRole.id" flat border>
                  <v-card-text>
                    <v-text-field
                      v-model="selectedRole.name"
                      label="角色名稱"
                      variant="outlined"
                      density="compact"
                      class="mb-4"
                      :rules="[v => !!v || '角色名稱為必填']"
                      :readonly="['超級管理員', '系統管理員'].includes(selectedRole.id)"
                    ></v-text-field>

                    <v-select
                      v-model="selectedRole.grantableRoles"
                      :items="allRoleNames"
                      label="可指派的角色"
                      multiple
                      chips
                      closable-chips
                      variant="outlined"
                      density="compact"
                      class="mb-4"
                    ></v-select>

                    <v-expansion-panels variant="accordion">
                      <v-expansion-panel>
                        <v-expansion-panel-title>
                          <v-icon start>mdi-account-edit-outline</v-icon>
                          人員管理頁面 欄位權限
                        </v-expansion-panel-title>
                        <v-expansion-panel-text class="pa-4">
                          <div v-for="field in userManagementFields" :key="field.key" class="field-permission-row mb-3">
                            <div class="font-weight-medium text-subtitle-2 mb-1">{{ field.label }}</div>
                            <v-chip-group
                              v-model="selectedRole.fieldPermissions.UserManagement[field.key]"
                              filter
                              mandatory
                            >
                              <v-chip
                                v-for="option in fieldPermissionOptions"
                                :key="option.value"
                                :value="option.value"
                                :color="option.color"
                                label
                                small
                              >
                                {{ option.title }}
                              </v-chip>
                            </v-chip-group>
                          </div>
                        </v-expansion-panel-text>
                      </v-expansion-panel>
                    </v-expansion-panels>

                  </v-card-text>
                  <v-divider></v-divider>
                  <v-card-actions class="pa-4">
                    <v-btn
                      v-if="!['超級管理員', '系統管理員'].includes(selectedRole.id)"
                      color="error"
                      variant="text"
                      @click="confirmDeleteRole(selectedRole)"
                    >刪除角色</v-btn>
                    <v-spacer></v-spacer>
                    <v-btn color="indigo" variant="flat" @click="saveRole" :loading="savingRole">儲存角色設定</v-btn>
                  </v-card-actions>
                </v-card>
                 <v-alert v-else type="info" class="fill-height">
                    請從左側選擇一個角色進行編輯，或新增一個角色。
                </v-alert>
              </v-col>
            </v-row>
          </v-card-text>
        </v-window-item>
  <v-window-item v-if="isSuperAdmin" value="functions">
          <v-card-text>
            <div class="d-flex justify-end mb-4">
              <v-btn color="primary" @click="openFunctionDialog()">
                <v-icon left>mdi-plus</v-icon>
                新增權限功能
              </v-btn>
            </div>
            <v-data-table
              :headers="functionTableHeaders"
              :items="systemFunctions"
              :loading="loading"
              item-value="functionId"
              class="elevation-1"
              no-data-text="沒有權限功能資料"
              loading-text="正在載入資料..."
            >
              <template v-slot:item.isCore="{ value }">
                <v-chip :color="value ? 'red' : 'grey'" small label>{{ value ? '是' : '否' }}</v-chip>
              </template>
              <template v-slot:item.actions="{ item }">
                <v-btn small color="primary" @click="openFunctionDialog(item)">編輯</v-btn>
              </template>
            </v-data-table>
          </v-card-text>
        </v-window-item>
      </v-window>
    </v-card>

<v-dialog v-model="isFunctionDialogVisible" persistent max-width="600px">
      <v-card>
        <v-card-title class="bg-indigo text-white">
          <span class="text-h5">{{ isNewFunction ? '新增權限功能' : '編輯權限功能' }}</span>
        </v-card-title>
        <v-card-text class="pt-4">
          <v-form ref="functionForm">
            <v-text-field
              v-model="editedFunction.functionId"
              label="功能 ID (內部代號，建立後不可修改)"
              variant="outlined"
              :readonly="!isNewFunction"
              :rules="[v => !!v || '必填']"
              hint="請使用英文駝峰式命名，例如: newPermission"
            ></v-text-field>
            <v-text-field
              v-model="editedFunction.name"
              label="顯示名稱"
              variant="outlined"
              :rules="[v => !!v || '必填']"
              class="mt-4"
            ></v-text-field>
            <v-textarea
              v-model="editedFunction.description"
              label="功能描述 (可選)"
              variant="outlined"
              rows="3"
              class="mt-4"
            ></v-textarea>
             <v-checkbox
                v-model="editedFunction.isCore"
                label="設為核心功能 (保護)"
                :disabled="!isNewFunction"
              ></v-checkbox>
          </v-form>
        </v-card-text>
        <v-card-actions class="pa-4">
          <v-spacer></v-spacer>
          <v-btn color="grey" text @click="isFunctionDialogVisible = false">取消</v-btn>
          <v-btn color="primary" @click="saveSystemFunction" :loading="savingFunction">儲存</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>


    <v-dialog
      v-model="dialogVisible"
      persistent
      :max-width="isMobile ? '100%' : '1000px'"
      :fullscreen="isMobile"
      scrollable
    >
      <v-card>
        <v-card-title class="bg-indigo text-white d-flex align-center">
      <span class="text-h5">{{ isNewUser ? '新增人員' : '編輯人員權限' }}</span>
      <v-spacer></v-spacer>
      <v-btn icon="mdi-close" variant="text" @click="closeDialog"></v-btn>
    </v-card-title>


        <v-card-text class="pa-4">
          <v-form ref="basicInfoForm" v-model="isFormValid">
            <v-row v-if="targetUser">
              <v-col v-if="getFieldPermission('phone') !== 'H'" cols="12" sm="6">
                <v-text-field
                  v-model="targetUser.basicInfo.phone"
                  label="手機號碼 (登入帳號)"
                  :rules="rules.required"
                  :readonly="!isNewUser"
                  variant="outlined"
                  density="compact"
                  @blur="validatePhoneNumber"
                  :loading="phoneValidationLoading"
                  :error-messages="phoneValidationError"
                  :success-messages="phoneValidationSuccess"
                ></v-text-field>
              </v-col>
              <v-col v-if="getFieldPermission('name') !== 'H'" cols="12" sm="6">
                <v-text-field
                  v-model="targetUser.basicInfo.name"
                  label="姓名"
                  :rules="rules.required"
                  :readonly="getFieldPermission('name') === 'R'"
                  variant="outlined"
                  density="compact"
                ></v-text-field>
              </v-col>
              <v-col v-if="getFieldPermission('email') !== 'H'" cols="12" sm="6">
                <v-text-field
                  v-model="targetUser.basicInfo.email"
                  label="Email"
                  :readonly="getFieldPermission('email') === 'R'"
                  variant="outlined"
                  density="compact"
                ></v-text-field>
              </v-col>
              <v-col v-if="getFieldPermission('password') !== 'H'" cols="12" sm="6">
                 <v-text-field
                    v-if="!isNewUser && getFieldPermission('password') === 'C'"
                    label="密碼"
                    variant="outlined"
                    density="compact"
                    readonly
                    value="******** (僅供建立)"
                  ></v-text-field>
                 <v-text-field
                    v-else
                    v-model="targetUser.basicInfo.password"
                    label="密碼"
                    :rules="isNewUser ? rules.required : []"
                    :readonly="getFieldPermission('password') === 'R'"
                    variant="outlined"
                    density="compact"
                    :placeholder="isNewUser ? '' : '若不修改請留空'"
                  ></v-text-field>
              </v-col>
              <v-col v-if="getFieldPermission('companyName') !== 'H'" cols="12" sm="6">
                <v-text-field
                  v-model="targetUser.basicInfo.companyName"
                  label="公司名稱"
                  :readonly="getFieldPermission('companyName') === 'R'"
                  variant="outlined"
                  density="compact"
                ></v-text-field>
              </v-col>
              <v-col v-if="getFieldPermission('companyTaxId') !== 'H'" cols="12" sm="6">
                <v-text-field
                  v-model="targetUser.basicInfo.companyTaxId"
                  label="統一編號"
                  :readonly="getFieldPermission('companyTaxId') === 'R'"
                  variant="outlined"
                  density="compact"
                ></v-text-field>
              </v-col>
            </v-row>
            </v-form>

          <v-divider class="my-4"></v-divider>
          
          <div v-if="getFieldPermission('permissions') !== 'H'">
            <h3 class="mb-2">系統權限設定</h3>
            <v-toolbar density="compact" class="mb-4" flat color="grey-lighten-4" rounded>
              <v-text-field
                v-model="projectSearchQuery"
                label="搜尋建案"
                variant="solo"
                density="compact"
                hide-details
                prepend-inner-icon="mdi-magnify"
                class="mx-2"
                clearable
              ></v-text-field>
              <v-btn @click="expandAll" class="ml-2" variant="tonal" size="small">全部展開</v-btn>
              <v-btn @click="collapseAll" class="ml-2" variant="tonal" size="small">全部收合</v-btn>
            </v-toolbar>

            <div v-if="targetUser && permissionMatrix" class="permission-panels-container">
              <v-expansion-panels multiple v-model="panels">
                <v-expansion-panel
                  v-for="project in filteredManagedProjects"
                  :key="project"
                  :value="project"
                  :readonly="getFieldPermission('permissions') === 'R'"
                >
                  <v-expansion-panel-title>
                    <v-checkbox
                      :model-value="isAllSelectedForProject(project)"
                      :indeterminate="isIndeterminateForProject(project)"
                      @update:model-value="toggleAllForProject(project, $event)"
                      @click.stop
                      hide-details
                      class="mr-4"
                      :disabled="getFieldPermission('permissions') === 'R'"
                    ></v-checkbox>
                    {{ project }}
                  </v-expansion-panel-title>
                  <v-expansion-panel-text>
                    <v-row dense>
                      <v-col
                        v-for="system in adminScope[project]"
                        :key="system"
                        cols="12" sm="6" md="4"
                      >

                               <v-tooltip
                        location="top"
                        :text="functionDescriptionMap[system]"
                        :disabled="!functionDescriptionMap[system]"
                      >
                        <template v-slot:activator="{ props }">
                          <v-checkbox
                            v-bind="props"
                            v-model="permissionMatrix[system][project]"
                            :label="system"
                            hide-details
                            density="compact"
                            :disabled="getFieldPermission('permissions') === 'R'"
                          ></v-checkbox>
                        </template>
                      </v-tooltip>
                      </v-col>              
                    </v-row>
                  </v-expansion-panel-text>
                </v-expansion-panel>
              </v-expansion-panels>
               <div v-if="filteredManagedProjects.length === 0" class="text-center text-grey py-4">
                  找不到符合條件的建案
              </div>
            </div>
          </div>
        </v-card-text>

        <v-divider></v-divider>
        <v-card-actions class="pa-4 bg-grey-lighten-5">
          <v-spacer></v-spacer>
          <v-btn color="grey-darken-1" variant="text" @click="closeDialog">取消</v-btn>
          <v-btn
            color="indigo"
            variant="flat"
            @click="handleSave"
            :loading="saving"
            :disabled="!isFormValid"
            size="large"
          >
            {{ isNewUser ? '建立新人員' : '儲存變更' }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="deleteRoleDialog" persistent max-width="400px">
        <v-card>
            <v-card-title class="text-h6 d-flex align-center bg-red-lighten-4">
              <v-icon start color="red-darken-2">mdi-alert-circle-outline</v-icon>
              確認刪除角色
            </v-card-title>
            <v-card-text>
                您確定要刪除「{{ roleToDelete.name }}」這個角色嗎？此操作無法復原。
            </v-card-text>
            <v-card-actions>
                <v-spacer></v-spacer>
                <v-btn color="grey" text @click="deleteRoleDialog = false">取消</v-btn>
                <v-btn color="error" text @click="executeDeleteRole" :loading="deletingRole">確認刪除</v-btn>
            </v-card-actions>
        </v-card>
    </v-dialog>
  </v-container>
</template>

<script setup>
import { ref, onMounted, computed, watch } from 'vue';
import { useDisplay } from 'vuetify';
import { useUserStore } from '@/store/user';
import { useProjectStore } from '@/store/projectStore';
import {
  fetchAdminScope,
  fetchUserDetailsForAdmin,
  updateUserDetailsForAdmin,
  fetchManageableUsersWithDetails,
  updateUserRoles,
  fetchAllRoles,
  updateRole,
  deleteRole,
  fetchAllSystemFunctions, 
  createSystemFunction,   
  updateSystemFunction
} from '@/api.js';
import { useToast } from 'vue-toastification';

const { mobile: isMobile } = useDisplay();
const userStore = useUserStore();
const projectStore = useProjectStore();
const toast = useToast();
const adminKey = computed(() => userStore.user?.key);

// 權限功能管理相關 State ---
const systemFunctions = ref([]);
const isFunctionDialogVisible = ref(false);
const isNewFunction = ref(false);
const savingFunction = ref(false);
const functionForm = ref(null);
const editedFunction = ref({
  functionId: '',
  name: '',
  description: '',
  isCore: false
});
const functionTableHeaders = [
  { title: '顯示名稱', key: 'name' },
  { title: '功能 ID (內部代號)', key: 'functionId' },
  { title: '描述', key: 'description', sortable: false },
  { title: '核心功能', key: 'isCore' },
  { title: '操作', key: 'actions', sortable: false, align: 'center' },
];


// --- Component State ---
const currentTab = ref('users');
const loading = ref(true);
const loadingDetails = ref(false);
const saving = ref(false);
const errorMessage = ref('');
const showErrorAlert = ref(false);
const searchPhone = ref('');

// --- Data ---
const adminScope = ref({});
const manageableUsers = ref([]);
const managedProjects = ref([]);
const allSystemFunctions = ref([]);

// --- Dialog State (For User Editing) ---
const dialogVisible = ref(false);
const isNewUser = ref(false);
const targetUser = ref(null);
const permissionMatrix = ref({});
const basicInfoForm = ref(null);
const isFormValid = ref(false);
const phoneValidationLoading = ref(false);
const phoneValidationError = ref('');
const phoneValidationSuccess = ref('');
const panels = ref([]);
const projectSearchQuery = ref('');

// --- Role Management State ---
const roles = ref([]);
const selectedRoleIndex = ref(null);
const selectedRole = ref(null);
const savingRole = ref(false);
const deleteRoleDialog = ref(false);
const roleToDelete = ref(null);
const deletingRole = ref(false);

const userManagementFields = [
    { key: 'phone', label: '手機號碼' },
    { key: 'name', label: '姓名' },
    { key: 'email', label: 'Email' },
    { key: 'password', label: '密碼' },
    { key: 'companyName', label: '公司名稱' },
    { key: 'companyTaxId', label: '統一編號' },
    { key: 'roles', label: '角色指派' },
    { key: 'permissions', label: '系統權限' }
];

// ✅ 更新為新的四種權限選項
const fieldPermissionOptions = [
    { title: '可讀寫', value: 'RU', color: 'green' },
    { title: '唯讀', value: 'R', color: 'blue' },
    { title: '僅供建立', value: 'C', color: 'orange' },
    { title: '隱藏', value: 'H', color: 'grey' }
];


// --- Validation Rules ---
const rules = {
  required: [ value => !!value || '此欄位為必填項。' ],
};

// --- Computed Properties ---
const isSuperAdmin = computed(() => userStore.currentUserRoles.includes('超級管理員'));
const allRoleNames = computed(() => roles.value.map(r => r.name));

const filteredManagedProjects = computed(() => {
  if (!projectSearchQuery.value) {
    return managedProjects.value;
  }
  return managedProjects.value.filter(project =>
    project.toLowerCase().includes(projectSearchQuery.value.toLowerCase())
  );
});

const currentUserRoles = computed(() => userStore.currentUserRoles);
const canViewAndEditRoles = computed(() => currentUserRoles.value.includes('超級管理員') || currentUserRoles.value.includes('系統管理員') || currentUserRoles.value.some(role => role.includes('主管')));

const availableRolesForAssignment = computed(() => {
  if (isSuperAdmin.value) return allRoleNames.value;
  const grantableSet = new Set();
  const adminRoles = userStore.currentUserRoles;
  
  roles.value.forEach(roleDef => {
    if (adminRoles.includes(roleDef.name)) {
      (roleDef.grantableRoles || []).forEach(gRole => grantableSet.add(gRole));
    }
  });
  return Array.from(grantableSet);
});

const tableHeaders = computed(() => {
  const headers = [
    { title: '姓名', align: 'start', key: 'name', width: '20%' },
    { title: '手機號碼', key: 'phone', width: '25%' },
  ];
  if (canViewAndEditRoles.value) {
    headers.push({ title: '角色', key: 'roles', sortable: false, width: '40%' });
  }
  headers.push({ title: '操作', key: 'actions', sortable: false, align: 'center', width: '15%' });
  return headers;
});

// ✅【新】計算當前管理員合併後的欄位權限
const currentUserFieldPermissions = computed(() => {
    if (isSuperAdmin.value) {
        // 超級管理員擁有所有欄位的讀寫權限
        const allPermissions = {};
        userManagementFields.forEach(field => {
            allPermissions[field.key] = 'RU';
        });
        return allPermissions;
    }
    const merged = {};
    const adminRoles = userStore.currentUserRoles;
    roles.value.forEach(roleDef => {
        if (adminRoles.includes(roleDef.name)) {
            const perms = roleDef.fieldPermissions?.UserManagement || {};
            Object.assign(merged, perms);
        }
    });
    return merged;
});

// ✅【新】提供給模板使用的權限檢查函式
const getFieldPermission = (fieldName) => {
    return currentUserFieldPermissions.value[fieldName] || ''; // 預設隱藏
};

// ✓【新增】建立一個從權限名稱到描述的快速查找表
const functionDescriptionMap = computed(() => {
  return systemFunctions.value.reduce((map, func) => {
    if (func.name && func.description) {
      map[func.name] = func.description;
    }
    return map;
  }, {});
});

// --- Watchers ---
watch(selectedRoleIndex, (newIndex) => {
  if (newIndex != null && roles.value[newIndex]) {
    selectedRole.value = JSON.parse(JSON.stringify(roles.value[newIndex]));
    
    if (!selectedRole.value.fieldPermissions) {
        selectedRole.value.fieldPermissions = {};
    }
    if (!selectedRole.value.fieldPermissions.UserManagement) {
        selectedRole.value.fieldPermissions.UserManagement = {};
    }
    userManagementFields.forEach(field => {
        if (selectedRole.value.fieldPermissions.UserManagement[field.key] === undefined) {
            selectedRole.value.fieldPermissions.UserManagement[field.key] = 'RU';
        }
    });

  } else {
    selectedRole.value = null;
  }
});

watch(filteredManagedProjects, (newVal) => {
  if (projectSearchQuery.value) {
    panels.value = newVal;
  }
});

// --- Core Logic ---
const loadInitialData = async () => {
  loading.value = true;
  errorMessage.value = '';
  showErrorAlert.value = false;
  try {
    const [scope, users, rolesData, projectsData, functionsData] = await Promise.all([
      fetchAdminScope(adminKey.value),
      fetchManageableUsersWithDetails(adminKey.value),
      fetchAllRoles(),
      projectStore.fetchProjects(),
      fetchAllSystemFunctions()
    ]);
    
    adminScope.value = scope;
    managedProjects.value = Object.keys(scope).sort((a,b) => a.localeCompare(b, 'zh-Hant'));
    const systems = new Set(Object.values(scope).flat());
    allSystemFunctions.value = Array.from(systems).sort();
    
    manageableUsers.value = users.map(u => ({ ...u, rolesLoading: false }));
    roles.value = rolesData.sort((a, b) => a.name.localeCompare(b.name, 'zh-Hant'));

    systemFunctions.value = functionsData; // 現在 functionsData 會是正確的權限功能列表

  } catch (error) {
    errorMessage.value = `初始化失敗: ${error.message}`;
    showErrorAlert.value = true;
  } finally {
    loading.value = false;
  }
};


onMounted(loadInitialData);

// --- User Editing Dialog Logic ---
const resetPhoneValidation = () => {
  phoneValidationLoading.value = false;
  phoneValidationError.value = '';
  phoneValidationSuccess.value = '';
};

const openEditDialog = async (phone) => {
  resetPhoneValidation();
  isNewUser.value = false;
  dialogVisible.value = true;
  loadingDetails.value = true;
  try {
    const result = await fetchUserDetailsForAdmin(phone, adminKey.value);
    if (result.status === 'success') {
      targetUser.value = result.data;
      buildPermissionMatrix(result.data.permissions);
    } else { throw new Error(result.message); }
  } catch (error) {
    toast.error(`載入用戶資料失敗: ${error.message}`);
    closeDialog();
  } finally {
    loadingDetails.value = false;
  }
};

const openCreateDialog = (phone = '') => {
  resetPhoneValidation();
  isNewUser.value = true;
  targetUser.value = { basicInfo: { phone, name: '', email: '', password: '', companyName: '', companyTaxId: '', roles: [] }, permissions: {} };
  buildPermissionMatrix({});
  dialogVisible.value = true;
};

const closeDialog = () => {
  dialogVisible.value = false;
  targetUser.value = null;
  permissionMatrix.value = {};
  panels.value = [];
  projectSearchQuery.value = '';
};

const handleSearchUser = async () => {
  const phone = searchPhone.value.trim();
  if (!phone) return;
  loadingDetails.value = true;
  const result = await fetchUserDetailsForAdmin(phone, adminKey.value);
  if (result.status === 'success') {
    openEditDialog(phone);
  } else if (result.message.includes('找不到')) {
    openCreateDialog(phone);
  } else {
    toast.error(`查詢失敗: ${result.message}`);
  }
  loadingDetails.value = false;
};

const buildPermissionMatrix = (permissionsObject) => {
  const matrix = {};
  allSystemFunctions.value.forEach(system => {
    matrix[system] = {};
    managedProjects.value.forEach(project => {
      matrix[system][project] = false;
    });
  });
  for (const projectId in permissionsObject) {
    const { projectName, systems } = permissionsObject[projectId];
    if (systems) {
      systems.forEach(system => {
        if (matrix[system] && matrix[system][projectName] !== undefined) {
          matrix[system][projectName] = true;
        }
      });
    }
  }
  permissionMatrix.value = matrix;
};

const expandAll = () => { panels.value = filteredManagedProjects.value; };
const collapseAll = () => { panels.value = []; };

const isAllSelectedForProject = (project) => {
  const systemsForProject = adminScope.value[project] || [];
  return systemsForProject.every(system => permissionMatrix.value[system]?.[project]);
};

const isIndeterminateForProject = (project) => {
  const systemsForProject = adminScope.value[project] || [];
  const selectedCount = systemsForProject.filter(system => permissionMatrix.value[system]?.[project]).length;
  return selectedCount > 0 && selectedCount < systemsForProject.length;
};

const toggleAllForProject = (project, isSelected) => {
  const systemsForProject = adminScope.value[project] || [];
  systemsForProject.forEach(system => {
    if (permissionMatrix.value[system]) {
      permissionMatrix.value[system][project] = isSelected;
    }
  });
};

const handleSave = async () => {
  if (basicInfoForm.value) {
    const { valid } = await basicInfoForm.value.validate();
    if (!valid) {
      toast.error('請填寫所有必填欄位。');
      return;
    }
  }
  saving.value = true;
  try {
    const newPermissionsObject = {};
    for (const system of allSystemFunctions.value) {
      for (const projectName of managedProjects.value) {
        if (permissionMatrix.value[system]?.[projectName] === true) {
          const projectId = projectStore.nameToIdMap[projectName];
          if (projectId) {
            if (!newPermissionsObject[projectId]) {
              newPermissionsObject[projectId] = { projectName, systems: [] };
            }
            newPermissionsObject[projectId].systems.push(system);
          }
        }
      }
    }
    const payload = {
      targetUserKey: targetUser.value.basicInfo.phone.trim(),
      adminKey: adminKey.value,
      adminName: userStore.user?.name,
      basicInfo: targetUser.value.basicInfo,
      permissions: newPermissionsObject,
      isNewUser: isNewUser.value // ✅ 核心修改點：將新建狀態傳遞給 API
    };
    const result = await updateUserDetailsForAdmin(payload);
    if (result.status === 'success') {
      toast.success(isNewUser.value ? '新人員建立成功！' : '人員資料更新成功！');
      closeDialog();
      await loadInitialData();
    } else {
      throw new Error(result.message || '發生未知的錯誤');
    }
  } catch (error) {
    toast.error(`儲存失敗：${error.message}`);
  } finally {
    saving.value = false;
  }
};


const validatePhoneNumber = async () => {
  if (!isNewUser.value) return;
  const phone = targetUser.value.basicInfo.phone?.trim();
  phoneValidationError.value = '';
  phoneValidationSuccess.value = '';
  if (!phone) return;
  phoneValidationLoading.value = true;
  try {
    const checkResult = await fetchUserDetailsForAdmin(phone, adminKey.value);
    if (checkResult.status === 'success') {
      phoneValidationError.value = '此手機號碼已被註冊。';
    } else if (checkResult.status === 'error' && checkResult.message.includes('找不到')) {
      phoneValidationSuccess.value = '此手機號碼可使用。';
    } else {
      phoneValidationError.value = '驗證時發生錯誤。';
    }
  } catch (e) {
    phoneValidationError.value = '網路連線錯誤，無法驗證。';
  } finally {
    phoneValidationLoading.value = false;
  }
};

// --- Role Assignment & Management Logic ---
const handleRolesChange = async (user, newRoles) => {
  if (JSON.stringify(user.roles) === JSON.stringify(newRoles)) return;
  const userInTable = manageableUsers.value.find(u => u.phone === user.phone);
  if (!userInTable) return;
  userInTable.rolesLoading = true;
  try {
    await updateUserRoles(user.phone, newRoles);
    userInTable.roles = newRoles;
    toast.success(`已更新 ${user.name} 的角色`);
  } catch (error) {
    toast.error(`更新角色失敗: ${error.message}`);
    const originalUser = await fetchUserDetailsForAdmin(user.phone, adminKey.value);
    if(originalUser.status === 'success') {
        userInTable.roles = originalUser.data.basicInfo.roles || [];
    }
  } finally {
    userInTable.rolesLoading = false;
  }
};

const removeRole = (user, roleToRemove) => {
  const newRoles = user.roles.filter(r => r !== roleToRemove);
  handleRolesChange(user, newRoles);
};

const createNewRole = () => {
    const newRoleName = prompt("請輸入新角色的名稱：");
    if (newRoleName && !roles.value.some(r => r.name === newRoleName)) {
        const newRole = {
            id: newRoleName,
            name: newRoleName,
            grantableRoles: [],
            fieldPermissions: { UserManagement: {} }
        };
        userManagementFields.forEach(field => {
            if (field.key === 'phone') {
                newRole.fieldPermissions.UserManagement[field.key] = 'R';
            } else if (field.key === 'password') {
                newRole.fieldPermissions.UserManagement[field.key] = 'C';
            }
            else {
                newRole.fieldPermissions.UserManagement[field.key] = 'RU';
            }
        });
        roles.value.push(newRole);
        selectedRoleIndex.value = roles.value.length - 1;
    } else if (newRoleName) {
        toast.error("角色名稱已存在！");
    }
};

const saveRole = async () => {
    if (!selectedRole.value || !selectedRole.value.name) {
        toast.error("角色名稱不能為空！");
        return;
    }
    savingRole.value = true;
    try {
        const roleDataToSave = {
            name: selectedRole.value.name,
            grantableRoles: selectedRole.value.grantableRoles || [],
            fieldPermissions: selectedRole.value.fieldPermissions || {}
        };

        if (selectedRole.value.id !== selectedRole.value.name) {
            await deleteRole(selectedRole.value.id);
        }
        
        await updateRole(selectedRole.value.name, roleDataToSave);
        toast.success(`角色「${selectedRole.value.name}」已成功儲存！`);
        await loadInitialData();
    } catch (error) {
        toast.error(`儲存角色失敗：${error.message}`);
    } finally {
        savingRole.value = false;
    }
};

const confirmDeleteRole = (role) => {
    roleToDelete.value = role;
    deleteRoleDialog.value = true;
};

const executeDeleteRole = async () => {
    deletingRole.value = true;
    try {
        await deleteRole(roleToDelete.value.id);
        toast.success(`角色「${roleToDelete.value.name}」已刪除。`);
        deleteRoleDialog.value = false;
        selectedRole.value = null;
        selectedRoleIndex.value = null;
        await loadInitialData();
    } catch (error) {
        toast.error(`刪除角色失敗：${error.message}`);
    } finally {
        deletingRole.value = false;
    }
};

// 權限功能管理相關 Methods ---
const openFunctionDialog = (func = null) => {
  if (func) {
    // 編輯模式
    isNewFunction.value = false;
    editedFunction.value = { ...func };
  } else {
    // 新增模式
    isNewFunction.value = true;
    editedFunction.value = { functionId: '', name: '', description: '', isCore: false };
  }
  isFunctionDialogVisible.value = true;
};

const saveSystemFunction = async () => {
  const { valid } = await functionForm.value.validate();
  if (!valid) return;

  savingFunction.value = true;
  try {
    let result;
    if (isNewFunction.value) {
      result = await createSystemFunction(editedFunction.value);
    } else {
      result = await updateSystemFunction(editedFunction.value);
    }

    if (result.status === 'success') {
      toast.success(`權限功能「${editedFunction.value.name}」已儲存。`);
      isFunctionDialogVisible.value = false;
      await loadInitialData(); // 重新載入所有資料
    } else {
      throw new Error(result.message);
    }
  } catch (error) {
    toast.error(`儲存失敗: ${error.message}`);
  } finally {
    savingFunction.value = false;
  }
};

</script>

<style scoped>
.permission-panels-container {
  border: 1px solid #e0e000;
  border-radius: 4px;
  height: 55vh;
  overflow-y: auto;
  padding: 8px;
}
.field-permission-row {
  border-bottom: 1px solid #eee;
  padding-bottom: 8px;
}
.field-permission-row:last-child {
  border-bottom: none;
}
</style>