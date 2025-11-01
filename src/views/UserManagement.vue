<template>
  <v-container>
    <v-card class="mx-auto">
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
                  label="輸入姓名、手機或建案名稱篩選"
                  variant="outlined"
                  
                  hide-details
                  prepend-inner-icon="mdi-magnify"
                  clearable
                >
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

            <div class="d-none d-md-block mt-4">
              <v-data-table
                :headers="tableHeaders"
                :items="filteredUsers"
                :loading="adminStore.isLoading"
                item-value="phone"
                class="elevation-1"
                no-data-text="沒有可管理的人員資料"
                loading-text="正在載入資料..."
                items-per-page-text="每頁筆數："
                :page-text="'{0}-{1} 筆 / 共 {2} 筆'"
              >
                <template v-slot:item.lineId="{ item }">
                  <v-chip :color="item.lineId ? 'green' : 'grey'" small label>
                    {{ item.lineId ? '已綁定' : '未綁定' }}
                  </v-chip>
                </template>
                <template v-slot:item.projects="{ item }">
                  <div style="max-width: 300px; display: flex; flex-wrap: wrap; gap: 4px;" class="py-2">
                    <v-chip
                      v-for="project in item.projects"
                      :key="project"
                      color="blue-grey"
                      size="x-small"
                      label
                    >
                      {{ project }}
                    </v-chip>
                    <span v-if="!item.projects || item.projects.length === 0" class="text-grey-lighten-1">
                      -
                    </span>
                  </div>
                </template>
                <template v-if="canViewAndEditRoles" v-slot:item.roles="{ item }">
                  <v-combobox
                    :model-value="item.roles"
                    @update:model-value="newRoles => handleRolesChange(item, newRoles)"
                    :items="availableRolesForAssignment"
                    multiple
                    chips
                    closable-chips
                    variant="outlined"
                    
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
            </div>
            <div class="d-md-none mt-4">
              <div v-if="adminStore.isLoading" class="text-center pa-10">
                <v-progress-circular indeterminate color="primary"></v-progress-circular>
                <p class="mt-2 text-grey">正在載入資料...</p>
              </div>
              <div v-else>
                <v-card
                    v-for="item in filteredUsers"
                    :key="item.phone"
                    class="mb-3"
                    variant="outlined"
                  >
                    <v-card-title class="text-h6 pb-0">{{ item.name }}</v-card-title>
                    
                    <v-card-text class="pt-2 pb-2">
                      <div v-for="field in displayFields" :key="field.key" class="mb-1">
                        <strong>{{ field.label }}: </strong>

                        <template v-if="field.type === 'chip'">
                          <v-chip :color="item[field.key] ? field.options.trueColor : field.options.falseColor" small label class="ml-2">
                            {{ item[field.key] ? field.options.trueText : field.options.falseText }}
                          </v-chip>
                        </template>
                        <template v-else-if="field.type === 'projects'">
                          <div style="display: flex; flex-wrap: wrap; gap: 4px;" class="mt-1">
                            <v-chip
                              v-for="project in item.projects"
                              :key="project"
                              color="blue-grey"
                              size="x-small"
                              label
                            >
                              {{ project }}
                            </v-chip>
                            <span v-if="!item.projects || item.projects.length === 0" class="text-grey-lighten-1">
                              -
                            </span>
                          </div>
                        </template>
                        <template v-else>
                          <span class="ml-2">{{ item[field.key] || 'N/A' }}</span>
                        </template>
                      </div>
                    </v-card-text>
                    <v-card-actions>
                    <v-spacer></v-spacer>
                    <v-btn color="primary" variant="tonal" @click="openEditDialog(item.phone)">
                      編輯
                    </v-btn>
                  </v-card-actions>
                    </v-card>

                <div v-if="filteredUsers.length === 0" class="text-center text-grey py-10">
                  <p>找不到符合條件的人員</p>
                </div>
              </div>
            </div>
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
                      v-for="(role, index) in adminStore.roles"
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
              :items="adminStore.systemFunctions"
              :loading="adminStore.isLoading"
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
          <div v-if="loadingDetails">
            <v-row>
              <v-col cols="12" sm="6">
                <v-skeleton-loader type="list-item-two-line"></v-skeleton-loader>
              </v-col>
              <v-col cols="12" sm="6">
                <v-skeleton-loader type="list-item-two-line"></v-skeleton-loader>
              </v-col>
              <v-col cols="12" sm="6">
                <v-skeleton-loader type="list-item-two-line"></v-skeleton-loader>
              </v-col>
              <v-col cols="12" sm="6">
                <v-skeleton-loader type="list-item-two-line"></v-skeleton-loader>
              </v-col>
               <v-col cols="12" sm="6">
                <v-skeleton-loader type="list-item-two-line"></v-skeleton-loader>
              </v-col>
               <v-col cols="12" sm="6">
                <v-skeleton-loader type="list-item-two-line"></v-skeleton-loader>
              </v-col>
            </v-row>
            <v-skeleton-loader type="heading, divider, actions, table-heading, list-item-three-line@3"></v-skeleton-loader>
          </div>

          <div v-if="!loadingDetails">
            <v-form ref="basicInfoForm" v-model="isFormValid">
              <v-row v-if="targetUser">
                <v-col v-if="getFieldPermission('phone') !== 'H'" cols="12" sm="6">
                  <v-text-field
                    v-model="targetUser.basicInfo.phone"
                    label="手機號碼 (登入帳號)"
                    hint="手機號碼為帳號，建立後不可修改"
                  :rules="rules.required"
                  :readonly="!isNewUser"
                  variant="outlined"
                  
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
                   
                  ></v-text-field>
                </v-col>
                <v-col v-if="getFieldPermission('email') !== 'H'" cols="12" sm="6">
                  <v-text-field
                    v-model="targetUser.basicInfo.email"
                    label="Email"
                  :readonly="getFieldPermission('email') === 'R'"
                  variant="outlined"
                  
                ></v-text-field>
              </v-col>
               <v-col v-if="getFieldPermission('password') !== 'H'" cols="12" sm="6">
                   <v-text-field
                      v-if="!isNewUser && getFieldPermission('password') === 'C'"
                    label="密碼"
                    variant="outlined"
                    
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
                    
                    :placeholder="isNewUser ? '' : '若不修改請留空'"
                  ></v-text-field>
                </v-col>
                <v-col v-if="getFieldPermission('companyName') !== 'H'" cols="12" sm="6">
                  <v-text-field
                    v-model="targetUser.basicInfo.companyName"
                  label="公司名稱"
                  :readonly="getFieldPermission('companyName') === 'R'"
                  variant="outlined"
                  
                  ></v-text-field>
                </v-col>
                <v-col v-if="getFieldPermission('companyTaxId') !== 'H'" cols="12" sm="6">
                  <v-text-field
                    v-model="targetUser.basicInfo.companyTaxId"
                    label="統一編號"
                  :readonly="getFieldPermission('companyTaxId') === 'R'"
                  variant="outlined"
                  
                ></v-text-field>
              </v-col>
            </v-row>
            </v-form>

          <v-divider class="my-4"></v-divider>
          
         <div v-if="getFieldPermission('permissions') !== 'H'">
              <h3 class="mb-2">系統權限設定</h3>
              <v-toolbar  class="mb-4" flat color="grey-lighten-4" rounded>
                <v-text-field
                v-model="projectSearchQuery"
                label="搜尋建案"
                variant="solo"
                
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
                   :disabled="getFieldPermission('permissions') === 'R' || /* 通用欄位唯讀 */
                              (!isGodModeAdmin && !adminStore.adminScope[project]?.includes('人員管理')) /* 非超管/系管 且 在此建案無 '人員管理' 權限 */
                             "
                 ></v-checkbox>
                 {{ project }}
               </v-expansion-panel-title>
               <v-expansion-panel-text>
               <v-row dense>
                 <v-col
                   v-for="system in allFunctionNames"
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
                         
                         :disabled="(isEditingSelf && !isGodModeAdmin) || /* 不能編輯自己 (除非是超管/系管) */
                                    (isGodModeAdmin
                                      ? (getFieldPermission('permissions') === 'R') /* 超管/系管 只看通用欄位權限 */
                                      : ( /* 非超管/系管 的禁用條件 */
                                          getFieldPermission('permissions') === 'R' || /* 1. 通用欄位唯讀 */
                                          !adminStore.adminScope[project]?.includes('人員管理') || /* 2. 管理員在此建案沒有 '人員管理' 權限 */
                                          !adminStore.adminScope[project]?.includes(system)      /* 3. 管理員自己沒有要指派的這個 'system' 權限 */
                                        )
                                    )"
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
// 引入新的 adminStore
import { useAdminStore } from '@/store/adminStore'; 
import {
  fetchUserDetailsForAdmin,
  updateUserDetailsForAdmin,
  updateUserRoles,
  updateRole,
  deleteRole,
  createSystemFunction,   
  updateSystemFunction,
  // fetchUserManagementInitialData, // 由 adminStore 處理
} from '@/api.js';
import { useToast } from 'vue-toastification';


const { mobile: isMobile } = useDisplay();
const userStore = useUserStore();
const projectStore = useProjectStore();
const toast = useToast();
// 建立 adminStore 實例
const adminStore = useAdminStore();

const adminKey = computed(() => userStore.user?.key);

// 權限功能管理相關 State ---
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
const loading = ref(true); // 這個 ref 仍然用來控制本地的 "載入中" 狀態
const loadingDetails = ref(false);
const saving = ref(false);
const errorMessage = ref('');
const showErrorAlert = ref(false);
const searchPhone = ref('');

// --- Data (本地 state 已被 store 取代) ---
// const adminScope = ref({}); // 由 store 取代
// const manageableUsers = ref([]); // 由 store 取代
// const managedProjects = ref([]); // 由 store 取代
// const allSystemFunctions = ref([]); // 由 store 取代
// const allUserPermissionsMap = ref(new Map()); // 由 store 取代

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
// const roles = ref([]); // 由 store 取代
const selectedRoleIndex = ref(null);
const selectedRole = ref(null);
const savingRole = ref(false);
const deleteRoleDialog = ref(false);
const roleToDelete = ref(null);
const deletingRole = ref(false);


const usersWithProjectData = computed(() => {
  const currentUser = userStore.user;
  const currentUserKey = currentUser?.key;

  // 1. 處理 store 中的可管理用戶
  // 由於 index.js 現在會回傳包含您在內的*所有人*，
  // adminStore.manageableUsers 已經是完整的列表。
  const allUsers = adminStore.manageableUsers.map(user => {
    const userPermissions = adminStore.allUserPermissionsMap.get(user.phone) || {};
    const projects = Object.values(userPermissions).map(p => p.projectName).filter(Boolean).sort();
    
    // 檢查這是否是當前登入的使用者
    if (user.phone === currentUserKey) {
      // 如果是，確保角色資料與 userStore 同步 (因為 userStore 的角色可能是最即時的)
      return {
        ...user,
        roles: userStore.currentUserRoles, // 使用 userStore 的角色
        projects: projects,
        projectsText: projects.join(','),
      };
    }
    
    return {
      ...user,
      projects: projects,
      projectsText: projects.join(','),
    };
  });

  // 2. 移除 "if (currentUserKey && !allUsers.some(...))" 的區塊
  // 因為 allUsers 現在保證包含 currentUser

  return allUsers;
});


// --- START: 修改 initiallyVisibleUsers (步驟 2) ---
// 計算初始可見的用戶列表（與管理員有共同建案）
const initiallyVisibleUsers = computed(() => {
  if (adminStore.isLoading) {
    return []; // 如果還在載入，返回空陣列
  }
  
  // 超級管理員可見所有人
  if (isSuperAdmin.value) {
    return usersWithProjectData.value.sort((a, b) => (a.name || '').localeCompare((b.name || ''), 'zh-Hant'));
  }

  // 獲取管理員擁有的所有 projectId
  const adminProjectIds = new Set(Object.keys(adminStore.adminScope).map(projectName => projectStore.nameToIdMap[projectName]).filter(Boolean));
  
  if (adminProjectIds.size === 0) {
      console.warn("[Debug] initiallyVisibleUsers: Admin scope is empty or project mapping failed.");
      // 如果管理員沒有任何建案權限 (且非超管)，只顯示他自己
      const currentUserKey = userStore.user?.key;
      const currentUserData = usersWithProjectData.value.find(u => u.phone === currentUserKey);
      return currentUserData ? [currentUserData] : [];
  }

  // 過濾出有共同建案的人員
  const filteredList = usersWithProjectData.value.filter(user => {
    // 檢查該用戶是否有任何一個 projectId 存在於管理員的 projectId 集合中
    const userPermissions = adminStore.allUserPermissionsMap.get(user.phone) || {};
    for (const userProjectId in userPermissions) {
      if (adminProjectIds.has(userProjectId)) {
        return true; // 找到共同建案，包含此用戶
      }
    }
    return false; // 沒有共同建案，排除此用戶
  });

  // 確保當前使用者一定在列表中
  const currentUserKey = userStore.user?.key;
  if (currentUserKey && !filteredList.some(u => u.phone === currentUserKey)) {
      const currentUserData = usersWithProjectData.value.find(u => u.phone === currentUserKey);
      if (currentUserData) {
          filteredList.push(currentUserData);
      }
  }
  
  return filteredList.sort((a, b) => (a.name || '').localeCompare((b.name || ''), 'zh-Hant'));
});
// --- END: 修改 initiallyVisibleUsers ---


const filteredUsers = computed(() => {
  const lowerQuery = searchPhone.value?.toLowerCase().trim();

  // 1. 決定基礎列表
  // 如果有搜尋詞，就搜尋「所有人」，否則使用「初始可見列表」
  const baseList = lowerQuery 
    ? usersWithProjectData.value // 搜尋時使用完整列表
    : initiallyVisibleUsers.value; // 預設使用過濾後列表

  // 2. 如果沒有搜尋詞，直接回傳基礎列表
  if (!lowerQuery) {
    return baseList;
  }

  // 3. 如果有搜尋詞，在 baseList 上執行過濾
  // (注意：我們現在在 baseList 上過濾，而不是在 usersWithProjectData 上，
  // 這樣就尊重了「搜尋時搜尋所有人」的邏輯)
  return baseList.filter(user =>
    user.name.toLowerCase().includes(lowerQuery) ||
    user.phone.includes(lowerQuery) ||
    (user.email && user.email.toLowerCase().includes(lowerQuery)) || // 確保 email 存在
    user.projectsText.toLowerCase().includes(lowerQuery)
  );
});


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

const isGodModeAdmin = computed(() => {
  const roles = userStore.currentUserRoles;
  return roles.includes('超級管理員') || roles.includes('系統管理員');
});

const isEditingSelf = computed(() => {
  if (!targetUser.value || !userStore.user) return false;
  return targetUser.value.basicInfo.phone === userStore.user.key;
});

const allRoleNames = computed(() => adminStore.allRoleNames);

const allFunctionNames = computed(() => adminStore.allFunctionNames);

const managedProjects = computed(() => Object.keys(adminStore.adminScope).sort((a,b) => a.localeCompare(b, 'zh-Hant')));

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
  
  adminStore.roles.forEach(roleDef => {
    if (adminRoles.includes(roleDef.name)) {
      (roleDef.grantableRoles || []).forEach(gRole => grantableSet.add(gRole));
    }
  });
  return Array.from(grantableSet);
});

// --- START: 修改 displayFields (步驟 5) ---
const displayFields = ref([
  { key: 'phone', label: '手機號碼' },
  { key: 'email', label: 'Email' },
  { key: 'lineId', label: 'LINE綁定', type: 'chip', options: { trueColor: 'green', falseColor: 'grey', trueText: '已綁定', falseText: '未綁定' } },
  { key: 'projects', label: '所屬建案', type: 'projects' },
]);
// --- END: 修改 displayFields ---

// --- START: 修改 tableHeaders (步驟 4) ---
const tableHeaders = computed(() => {
  const headers = [
    { title: '姓名', align: 'start', key: 'name', width: '15%' },
    { title: '手機號碼', key: 'phone', width: '15%' },
    { title: 'Email', key: 'email', width: '20%' },
    { title: 'LINE綁定', key: 'lineId', sortable: false, align: 'center', width: '10%' },
    { title: '所屬建案', key: 'projects', sortable: false, width: '20%' },
  ];
  if (canViewAndEditRoles.value) {
    headers.push({ title: '角色', key: 'roles', sortable: false, width: '10%' });
  }
  headers.push({ title: '操作', key: 'actions', sortable: false, align: 'center', width: '10%' });
  return headers;
});
// --- END: 修改 tableHeaders ---

const currentUserFieldPermissions = computed(() => {
    if (isSuperAdmin.value) {
        const allPermissions = {};
        userManagementFields.forEach(field => {
            allPermissions[field.key] = 'RU';
        });
        return allPermissions;
    }
    const merged = {};
    const adminRoles = userStore.currentUserRoles;
    adminStore.roles.forEach(roleDef => {
        if (adminRoles.includes(roleDef.name)) {
            const perms = roleDef.fieldPermissions?.UserManagement || {};
            Object.assign(merged, perms);
        }
    });
    return merged;
});

const getFieldPermission = (fieldName) => {
    return currentUserFieldPermissions.value[fieldName] || '';
};

const functionDescriptionMap = computed(() => adminStore.functionDescriptionMap);

const isTargetUserAdmin = computed(() => {
  if (!targetUser.value || !targetUser.value.basicInfo.roles) return false;
  const roles = targetUser.value.basicInfo.roles;
  return roles.includes('超級管理員') || roles.includes('系統管理員');
});



// --- Watchers ---
watch(selectedRoleIndex, (newIndex) => {
  if (newIndex != null && adminStore.roles[newIndex]) {
    selectedRole.value = JSON.parse(JSON.stringify(adminStore.roles[newIndex]));
    
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
    // 確保 projectStore 已載入 (它有自己的快取)
    await projectStore.fetchProjects();
    
    // 呼叫 adminStore (它也有自己的快取)
    await adminStore.loadAdminData(adminKey.value);

  } catch (error) {
    console.error('[UserManagement.vue] loadInitialData 失敗:', error);
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
 allFunctionNames.value.forEach(system => {
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
  const systemsAdminCanManage = adminStore.adminScope[project] || [];
  if (systemsAdminCanManage.length === 0) return false;
  
  return systemsAdminCanManage.every(system => permissionMatrix.value[system]?.[project]);
};

const isIndeterminateForProject = (project) => {
  const systemsAdminCanManage = adminStore.adminScope[project] || [];
  if (systemsAdminCanManage.length === 0) return false;

  const selectedCount = systemsAdminCanManage.filter(system => permissionMatrix.value[system]?.[project]).length;
  
  return selectedCount > 0 && selectedCount < systemsAdminCanManage.length;
};

const toggleAllForProject = (project, isSelected) => {
  const systemsAdminCanManage = adminStore.adminScope[project] || [];
  systemsAdminCanManage.forEach(system => {
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

  if (isNewUser.value) {
    let hasAtLeastOnePermission = false;
    for (const system in permissionMatrix.value) {
      for (const project in permissionMatrix.value[system]) {
        if (permissionMatrix.value[system][project] === true) {
          hasAtLeastOnePermission = true;
          break;
        }
      }
      if (hasAtLeastOnePermission) {
        break;
      }
    }

    if (!hasAtLeastOnePermission) {
      toast.error('請至少為新人員指派一項系統權限。');
      return;
    }
  }

  saving.value = true;
  try {
    const newPermissionsObject = {};
    for (const system of allFunctionNames.value) {
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
      isNewUser: isNewUser.value
    };
    const result = await updateUserDetailsForAdmin(payload);
    if (result.status === 'success') {
      toast.success(isNewUser.value ? '新人員建立成功！' : '人員資料更新成功！');
      closeDialog();
      // 儲存成功後，清除快取並重新載入
      adminStore.invalidateCache();
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
  const userInTable = adminStore.manageableUsers.find(u => u.phone === user.phone);
  if (!userInTable) return;
  userInTable.rolesLoading = true;
  try {
    await updateUserRoles(user.phone, newRoles);
    userInTable.roles = newRoles;
    toast.success(`已更新 ${user.name} 的角色`);
    // 更改角色後，清除快取 (因為權限可能已改變)
    adminStore.invalidateCache();
    // (下次載入 loadInitialData 會自動重抓)
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
    if (newRoleName && !adminStore.roles.some(r => r.name === newRoleName)) {
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
        adminStore.roles.push(newRole);
        selectedRoleIndex.value = adminStore.roles.length - 1;
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
        // 儲存角色後，清除快取並重載
        adminStore.invalidateCache();
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
        // 刪除角色後，清除快取並重載
        adminStore.invalidateCache();
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
      // 儲存功能後，清除快取並重載
      adminStore.invalidateCache();
      await loadInitialData();
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