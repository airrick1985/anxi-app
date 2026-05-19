<template>
  <v-container fluid class="fill-height" style="background-color: #f5f5f5;">
    <v-row align="center" justify="center">
      <v-col cols="12" sm="10" md="8" lg="6" xl="5">
        <v-card class="elevation-12 rounded-lg">
          <v-toolbar color="#f5f5f7" flat>
            <v-toolbar-title class="font-weight-medium">
              <v-icon start>mdi-currency-usd</v-icon>
              選擇功能
            </v-toolbar-title>
          </v-toolbar>

          <v-card-text class="pa-6">
            <p class="text-subtitle-1 mb-6 text-center">
              建案：<strong>{{ projectDisplayName }}</strong><br />
              請選擇您要使用的功能
            </p>

            <v-row dense>
              <v-col cols="12" sm="6">
                <v-card
                  variant="outlined"
                  class="function-card pa-6 text-center"
                  hover
                  @click="onClickSalesControl"
                >
                  <v-icon size="56" color="deep-purple">mdi-table-edit</v-icon>
                  <div class="text-h6 font-weight-bold mt-3">銷控表</div>
                  <div class="text-caption text-grey-darken-1 mt-1">
                    需輸入您的登入密碼
                  </div>
                </v-card>
              </v-col>

              <v-col cols="12" sm="6">
                <v-card
                  variant="outlined"
                  class="function-card pa-6 text-center"
                  hover
                  @click="onClickPrintQuote"
                >
                  <v-icon size="56" color="green">mdi-printer</v-icon>
                  <div class="text-h6 font-weight-bold mt-3">列印報價</div>
                  <div class="text-caption text-grey-darken-1 mt-1">
                    直接進入報價單設定
                  </div>
                </v-card>
              </v-col>
            </v-row>
          </v-card-text>

          <v-divider></v-divider>
          <v-card-actions class="pa-3" style="background-color: #fafafa;">
            <v-spacer></v-spacer>
            <v-btn variant="text" color="secondary" @click="goBack">
              <v-icon start>mdi-arrow-left</v-icon>
              重新選擇建案
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-col>
    </v-row>

    <!-- 銷控表：密碼驗證對話框 -->
    <v-dialog v-model="passwordDialog" max-width="420" persistent>
      <v-card>
        <v-card-title class="d-flex align-center">
          <v-icon start color="deep-purple">mdi-lock</v-icon>
          身分驗證
        </v-card-title>
        <v-card-text>
          <p class="text-body-2 mb-4">請輸入您的系統登入密碼以進入銷控表。</p>
          <v-text-field
            v-model="passwordInput"
            label="登入密碼"
            type="password"
            variant="outlined"
            density="comfortable"
            autofocus
            hide-details="auto"
            :disabled="verifying"
            @keyup.enter="confirmPassword"
          ></v-text-field>
          <v-alert
            v-if="passwordError"
            type="error"
            density="compact"
            class="mt-3"
          >{{ passwordError }}</v-alert>
        </v-card-text>
        <v-card-actions class="pa-4">
          <v-spacer></v-spacer>
          <v-btn variant="text" :disabled="verifying" @click="cancelPassword">
            取消
          </v-btn>
          <v-btn
            color="deep-purple"
            variant="flat"
            :loading="verifying"
            :disabled="!passwordInput"
            @click="confirmPassword"
          >
            確認進入
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useUserStore } from '@/store/user';
import { useProjectStore } from '@/store/projectStore';
import { verifyUserPassword } from '@/api';

const route = useRoute();
const router = useRouter();
const userStore = useUserStore();
const projectStore = useProjectStore();

const projectId = computed(() => route.params.projectName);
const projectDisplayName = computed(() => {
  if (!projectStore.idToNameMap || !projectId.value) return '載入中...';
  return projectStore.idToNameMap[projectId.value] || projectId.value;
});

const passwordDialog = ref(false);
const passwordInput = ref('');
const passwordError = ref('');
const verifying = ref(false);

onMounted(async () => {
  if (!projectStore.idToNameMap || Object.keys(projectStore.idToNameMap).length === 0) {
    await projectStore.fetchProjects();
  }
});

function onClickSalesControl() {
  passwordInput.value = '';
  passwordError.value = '';
  passwordDialog.value = true;
}

function onClickPrintQuote() {
  router.push({
    name: 'QuoteSettings',
    params: { projectName: projectId.value },
    query: { viewMode: 'quote', pick: '1' },
  });
}

async function confirmPassword() {
  if (!passwordInput.value || verifying.value) return;
  verifying.value = true;
  passwordError.value = '';
  try {
    const res = await verifyUserPassword(userStore.user?.key, passwordInput.value);
    if (res.status === 'success') {
      passwordDialog.value = false;
      router.push({
        name: 'QuoteSystem',
        params: { projectName: projectId.value },
        query: { viewMode: 'quote' },
      });
    } else {
      passwordError.value = res.message || '密碼錯誤';
    }
  } catch (e) {
    passwordError.value = `驗證時發生錯誤: ${e.message}`;
  } finally {
    verifying.value = false;
  }
}

function cancelPassword() {
  passwordDialog.value = false;
  passwordInput.value = '';
  passwordError.value = '';
}

function goBack() {
  router.push({ name: 'QuoteSystemEntry', query: { viewMode: 'quote' } });
}
</script>

<style scoped>
.fill-height {
  min-height: calc(100vh - 64px);
}
.v-card {
  transition: box-shadow .3s ease-in-out;
}
.v-toolbar-title {
  font-size: 1.3rem;
}
.function-card {
  cursor: pointer;
  transition: transform .15s ease, box-shadow .15s ease;
  height: 100%;
}
.function-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 8px 18px -6px rgba(0,0,0,0.25) !important;
}
</style>
