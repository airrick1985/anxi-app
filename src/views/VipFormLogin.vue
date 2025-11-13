<template>
  <v-container>
    <v-row justify="center">
      <v-col cols="12" md="10" lg="8">

        <v-card>
          <v-toolbar color="white">
            <v-toolbar-title>登入選擇貴賓表單</v-toolbar-title>
          </v-toolbar>
        

          <v-window v-model="step">
            <v-window-item :value="1">
              <v-card flat>
                <v-card-text class="pa-6">
                  <v-text-field
                    v-model="salesPhone"
                    label="請輸入您的手機號碼"
                    variant="outlined"
                    :rules="[rules.phone]"
                    @keydown.enter="focusPassword"
                    autofocus
                    autocomplete="off"
                  ></v-text-field>
                  
                  <v-text-field
                    ref="passwordField"
                    v-model="salesPassword"
                    label="請輸入密碼"
                    variant="outlined"
                    type="password"
                    :rules="[rules.required]"
                    @keydown.enter="handleVerifySales"
                    class="mt-2"
                    autocomplete="new-password"
                  ></v-text-field>

                  <v-alert v-if="step1Error" type="error" variant="tonal" border="start" density="compact">{{ step1Error }}</v-alert>
                </v-card-text>
                <v-card-actions class="px-6 pb-4">
                  <v-spacer></v-spacer>
                  <v-btn color="primary" @click="handleVerifySales" :loading="isLoading">下一步</v-btn>
                </v-card-actions>
              </v-card>
            </v-window-item>

            <v-window-item :value="2">
              <v-card flat>
                <v-card-text class="pa-6">
                  <p class="mb-4">您好，{{ salesPerson.name }}！請選擇建案：</p>
                  <v-chip-group v-model="selectedProjectId" column mandatory>
                    <v-chip
                      v-for="proj in salesPerson.projects"
                      :key="proj.id"
                      :value="proj.id"
                      filter
                      variant="outlined"
                      color="primary"
                      size="large"
                    >{{ proj.name }}</v-chip>
                  </v-chip-group>
                </v-card-text>
                <v-card-actions class="px-6 pb-4">
                  <v-btn @click="step = 1">上一步</v-btn>
                  <v-spacer></v-spacer>
                  <v-btn color="primary" @click="redirectToVipForm" :disabled="!selectedProjectId">
                    前往表單
                  </v-btn>
                </v-card-actions>
              </v-card>
            </v-window-item>

          </v-window>
        </v-card>

      </v-col>
    </v-row>
  </v-container>
</template>

<script setup>
import { ref, nextTick } from 'vue';
import { useRouter } from 'vue-router';
import { verifySalesPerson } from '@/api'; // ✓ 重用 CustomerDataSheet 的 API

const router = useRouter();

// --- State ---
const step = ref(1);
const isLoading = ref(false);
const step1Error = ref(null);

const salesPhone = ref('');
const salesPassword = ref('');
const passwordField = ref(null);
const salesPerson = ref({ name: '', phone: null, projects: [] });
const selectedProjectId = ref(null);

// --- Validation Rules ---
const rules = {
  required: (v) => !!v || '此欄位為必填',
  phone: (v) => (v && v.length === 10 && v.startsWith('09')) || '請輸入有效的 10 碼手機號碼',
};

// --- Methods ---

// (與 CustomerDataSheet 相同)
async function focusPassword() {
  await nextTick();
  passwordField.value?.focus();
}

// (與 CustomerDataSheet 相同，包含 phone 注入的修正)
async function handleVerifySales() {
  step1Error.value = null;
  if (rules.phone(salesPhone.value) !== true) {
    step1Error.value = "請輸入有效的 10 碼手機號碼";
    return;
  }
  if (rules.required(salesPassword.value) !== true) {
    step1Error.value = "請輸入密碼";
    return;
  }

  isLoading.value = true;
  try {
    // 呼叫與 CustomerDataSheet 完全相同的 API
    const result = await verifySalesPerson(salesPhone.value, salesPassword.value);
    
    // 注入登入者的電話號碼 (確保 phone 屬性存在)
    result.phone = salesPhone.value; 
    
    salesPerson.value = result; 
    
    if (result.projects.length === 0) {
      step1Error.value = "您沒有操作任何建案的客資系統權限。";
    } else {
      // 成功，進入步驟 2
      step.value = 2;
    }
  } catch (error) {
    console.error("驗證銷售人員失敗:", error);
    step1Error.value = error.message; 
  } finally {
    isLoading.value = false;
  }
}

// ✓ 檢查：(新函式) 點擊「前往表單」時觸發
function redirectToVipForm() {
  if (!selectedProjectId.value) return;

  // 使用 Vue Router 進行頁面跳轉
  router.push({
    name: 'VipForm', // ✓ 注意：請確保您路由檔中 `vip-form/:projectId` 的路由名稱 (name) 是 'VipForm'
    params: {
      projectId: selectedProjectId.value
    }
  });
}
</script>