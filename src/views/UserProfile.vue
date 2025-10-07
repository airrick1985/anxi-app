<template>
  <v-container>
    <v-row justify="center">
      <v-col cols="12" md="8" lg="6">
        <v-card class="mx-auto">
          <v-toolbar color="primary" dark>
            <v-toolbar-title>
              <v-icon start>mdi-account-edit</v-icon>
              個人資料
            </v-toolbar-title>
          </v-toolbar>

          <v-form ref="profileForm" @submit.prevent="handleSave">
            <v-card-text class="pa-6">
              <p class="text-h6 mb-4">基本資訊</p>
              <v-text-field
                :model-value="userStore.user?.key"
                label="手機號碼 (登入帳號)"
                variant="outlined"
                density="compact"
                readonly
                disabled
              ></v-text-field>

              <v-text-field
                v-model="profileData.name"
                label="姓名"
                variant="outlined"
                density="compact"
                :rules="[rules.required]"
                class="mt-4"
              ></v-text-field>

              <v-text-field
                v-model="profileData.email"
                label="Email"
                variant="outlined"
                density="compact"
                class="mt-4"
              ></v-text-field>

              <v-divider class="my-6"></v-divider>
              <p class="text-h6 mb-4">角色與權限</p>
              <div class="mb-4">
                <div class="text-subtitle-1 font-weight-medium mb-2">我的角色</div>
                <div v-if="userStore.currentUserRoles.length > 0" class="d-flex flex-wrap ga-2">
                  <v-chip
                    v-for="role in userStore.currentUserRoles"
                    :key="role"
                    color="indigo"
                    variant="tonal"
                    label
                  >
                    <v-icon start>mdi-account-tie</v-icon>
                    {{ role }}
                  </v-chip>
                </div>
                <p v-else class="text-grey">未分配任何角色</p>
              </div>

              <div>
 <div class="text-subtitle-1 font-weight-medium mb-2">我的系統權限</div>
                <v-expansion-panels v-if="Object.keys(permissionsByProject).length > 0" variant="accordion">
                  <v-expansion-panel
                    v-for="(systems, projectName) in permissionsByProject"
                    :key="projectName"
                  >
                    <v-expansion-panel-title class="font-weight-bold">
                      {{ projectName }}
                      <v-chip color="primary" size="small" class="ml-4">{{ systems.length }} / {{ allSystemFunctions.length }} 項權限</v-chip>
                    </v-expansion-panel-title>
                    <v-expansion-panel-text>
                      <div class="d-flex flex-wrap ga-2 py-2">
                        <!-- ✓【修改】遍歷所有系統功能，並根據是否擁有來決定樣式 -->
                        <v-chip
                          v-for="func in allSystemFunctions"
                          :key="func.functionId"
                          :color="systems.includes(func.name) ? 'primary' : 'grey'"
                          :variant="systems.includes(func.name) ? 'flat' : 'outlined'"
                          label
                          size="small"
                        >
                          <v-icon start :icon="systems.includes(func.name) ? 'mdi-check-circle-outline' : 'mdi-circle-outline'"></v-icon>
                          {{ func.name }}
                        </v-chip>
                      </div>
                    </v-expansion-panel-text>
                  </v-expansion-panel>
                </v-expansion-panels>
                <p v-else class="text-grey">未被授予任何系統權限</p>
              </div>
              <v-divider class="my-6"></v-divider>

              <p class="text-h6 mb-4">修改密碼</p>              
              
              <v-alert
                type="info"
                variant="tonal"
                density="compact"
                class="mb-4"
              >
                如不需修改密碼，請將以下欄位留空即可。
              </v-alert>

              <v-text-field
                v-model="profileData.oldPassword"
                label="儲存設定前請輸入原密碼"
                :type="showPassword.old ? 'text' : 'password'"
                variant="outlined"
                density="compact"
                :append-inner-icon="showPassword.old ? 'mdi-eye-off' : 'mdi-eye'"
                @click:append-inner="showPassword.old = !showPassword.old"
                :rules="[rules.oldPasswordRequired]"
              ></v-text-field>

              <v-text-field
                v-model="profileData.newPassword"
                label="新密碼"
                :type="showPassword.new ? 'text' : 'password'"
                variant="outlined"
                density="compact"
                class="mt-4"
                :append-inner-icon="showPassword.new ? 'mdi-eye-off' : 'mdi-eye'"
                @click:append-inner="showPassword.new = !showPassword.new"
              ></v-text-field>

              <v-text-field
                v-model="profileData.confirmPassword"
                label="確認新密碼"
                :type="showPassword.confirm ? 'text' : 'password'"
                variant="outlined"
                density="compact"
                class="mt-4"
                :append-inner-icon="showPassword.confirm ? 'mdi-eye-off' : 'mdi-eye'"
                @click:append-inner="showPassword.confirm = !showPassword.confirm"
                :rules="[rules.passwordMatch]"
              ></v-text-field>
            </v-card-text>

            <v-divider></v-divider>

            <v-card-actions class="pa-4">
              <v-spacer></v-spacer>
              <v-btn
                type="submit"
                color="primary"
                variant="flat"
                size="large"
                :loading="isLoading"
              >
                儲存變更
              </v-btn>
            </v-card-actions>
          </v-form>
        </v-card>
      </v-col>
    </v-row>
    <v-snackbar v-model="snackbar.show" :color="snackbar.color" :timeout="3000">
      {{ snackbar.text }}
    </v-snackbar>
  </v-container>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue';
import { useUserStore } from '@/store/user';
import { updateUserProfile, fetchAllSystemFunctions } from '@/api';

const userStore = useUserStore();
const profileForm = ref(null);
const isLoading = ref(false);
const snackbar = reactive({ show: false, color: 'success', text: '' });
const showPassword = reactive({ old: false, new: false, confirm: false });

const allSystemFunctions = ref([]);


const profileData = reactive({
  name: '',
  email: '',
  oldPassword: '',
  newPassword: '',
  confirmPassword: '',

});

//  START: 新增計算屬性，將權限按建案分組
const permissionsByProject = computed(() => {
  if (!userStore.detailedPermissions) {
    return {};
  }
  return userStore.detailedPermissions.reduce((acc, permission) => {
    const { projectName, system } = permission;
    if (!acc[projectName]) {
      acc[projectName] = [];
    }
    acc[projectName].push(system);
    // 排序每個建案下的系統權限
    acc[projectName].sort(); 
    return acc;
  }, {});
});
//  END: 新增計算屬性

onMounted(async () => {
  // ✓【修改】在元件掛載時，同時獲取使用者資料和所有系統功能列表
  if (userStore.user) {
    profileData.name = userStore.user.name;
    profileData.email = userStore.user.email;
  }
  try {
    const functions = await fetchAllSystemFunctions();
    // 依名稱排序以確保顯示順序一致
    allSystemFunctions.value = functions.sort((a, b) => a.name.localeCompare(b.name, 'zh-Hant'));
  } catch (error) {
    console.error("無法獲取系統功能列表:", error);
    snackbar.text = '無法載入完整的權限列表。';
    snackbar.color = 'error';
    snackbar.show = true;
  }
});


// 表單驗證規則
const rules = {
  required: value => !!value || '此欄位為必填項。',
  oldPasswordRequired: () => {
    if (profileData.newPassword || profileData.confirmPassword) {
      return !!profileData.oldPassword || '若要修改密碼，必須輸入原密碼。';
    }
    return true;
  },
  passwordMatch: () => profileData.newPassword === profileData.confirmPassword || '新密碼與確認新密碼不相符。',
};

// 處理儲存
const handleSave = async () => {
  const { valid } = await profileForm.value.validate();
  if (!valid) {
    return;
  }
  
  const isUpdatingProfileOnly = (profileData.name !== userStore.user.name || profileData.email !== userStore.user.email) && !profileData.newPassword;
  if (isUpdatingProfileOnly && !profileData.oldPassword) {
      snackbar.text = '若要更新基本資料，仍需輸入「原密碼」進行驗證。';
      snackbar.color = 'warning';
      snackbar.show = true;
      return;
  }
  
  isLoading.value = true;
  try {
    const payload = {
      key: userStore.user.key,
      name: profileData.name,
      email: profileData.email,
      oldPassword: profileData.oldPassword,
      newPassword: profileData.newPassword,
    };

    const result = await updateUserProfile(payload);

    if (result.status === 'success') {
      userStore.setUser({
        ...userStore.user,
        name: profileData.name,
        email: profileData.email
      }, userStore.sessionId);

      snackbar.text = '個人資料已成功更新！';
      snackbar.color = 'success';
      snackbar.show = true;
      
      profileData.oldPassword = '';
      profileData.newPassword = '';
      profileData.confirmPassword = '';
    } else {
      throw new Error(result.message);
    }
  } catch (error) {
    snackbar.text = `更新失敗：${error.message}`;
    snackbar.color = 'error';
    snackbar.show = true;
  } finally {
    isLoading.value = false;
  }
};
</script>