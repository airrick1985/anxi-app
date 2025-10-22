<template>
  <v-container fluid style="background-color: #F4F4F7; min-height: 100vh;">
    <v-row justify="center">
      <v-col cols="12" md="8" lg="7">
        <v-card class="mx-auto">
          <v-overlay :model-value="isLoading" class="align-center justify-center" persistent>
            <div class="d-flex align-center">
              <v-progress-circular color="white" indeterminate size="50"></v-progress-circular>
              <div class="text-white ml-4">{{ loadingText }}</div>
            </div>
          </v-overlay>

          <div v-if="projectConfig && projectConfig.logoUrl" class="d-flex justify-center py-2">
                    <img :src="projectConfig.logoUrl" alt="Project Logo" style="max-height: 40px; object-fit: contain;">
                  </div>

          <v-card-title class="text-h5 font-weight-bold py-3 text-center" style="background-color: #007bff; color: white;">
            驗屋授權書簽署
          </v-card-title>

          <div v-if="error" class="pa-4">
            <v-alert type="error" variant="tonal" border="start" prominent :title="error.title" :text="error.text"></v-alert>
          </div>

          <div v-if="!isLoading && !error && step === 'signing'">
            <v-card-text>
              <p class="mb-4">親愛的 {{ sessionData.formData.受託人姓名 }} 您好，請確認以下授權資訊無誤後，於下方欄位簽名。</p>
              <v-sheet border rounded class="pa-4">
                <v-list lines="two" density="compact">
                  <v-list-item title="建案名稱" :subtitle="sessionData.projectName"></v-list-item>
                  <v-list-item title="戶別" :subtitle="sessionData.unitId"></v-list-item>
                  <v-divider class="my-2"></v-divider>
                  <v-list-item title="委託人 (屋主)" :subtitle="sessionData.formData.委託人姓名"></v-list-item>
                  <v-list-item title="受託人" :subtitle="sessionData.formData.受託人姓名"></v-list-item>
                </v-list>
              </v-sheet>

              <v-alert
            type="info"
            variant="tonal"
            border="start"
            density="compact"
            class="mt-4"
          >
            <template v-slot:title>
              <div class="font-weight-bold">授權範圍</div>
            </template>
            <div>
              受託人得代理委託人全權處理上述房地產之驗屋、點交相關作業，並有權簽署相關文件。此授權書效力等同委託人親自辦理。
            </div>
          </v-alert>

              <v-card variant="outlined" class="mt-4">
                <div class="d-flex justify-space-between align-center pa-4 pb-0">
                  <v-card-title class="text-subtitle-1 pa-0">受託人簽名</v-card-title>
                  <v-btn variant="tonal" size="small" @click="clearSignature">
                    <v-icon start>mdi-eraser</v-icon>清除
                  </v-btn>
                </div>
                <v-card-text>
                  <VueSignaturePad ref="delegateeSignaturePad" width="100%" height="200px" :options="{ penColor: '#000' }" />
                </v-card-text>
              </v-card>
               <p class="text-caption text-grey text-center mt-1">完成簽名表示同意授權內容</p>
            </v-card-text>
         
            <v-card-actions class="pa-4">
              <v-spacer></v-spacer>
              <v-btn color="success" size="large" variant="elevated" @click="handleSubmitSignature">我已確認並完成簽署</v-btn>
            </v-card-actions>
          </div>

          <div v-if="step === 'success'" class="text-center pa-8">
            <v-icon size="64" color="success" class="mb-4">mdi-check-circle-outline</v-icon>
            <h3 class="text-h5 mb-2">簽署完成！</h3>
            <p class="mb-6">您已成功簽署授權書，系統將會通知委託人(屋主)。</p>
          </div>
        </v-card>
        
      </v-col>
    </v-row>
    <div ref="authLetterRenderRef" style="position: absolute; left: -9999px; top: -9999px; width: 794px; background-color: white;"></div>
  
  <div class="text-caption text-grey text-center mt-4 d-flex align-center justify-center">
    <span>Powered by&nbsp;</span>
    <v-chip
      class="ml-1"
      href="https://airrick1985.wixsite.com/anxi"
      target="_blank"
      rel="noopener noreferrer"
      color="blue-grey"
      variant="tonal"
      size="small"
      pill
    >
      <v-icon start size="x-small">mdi-rocket-launch-outline</v-icon>
      anxismart安熙智慧建案管理系統
    </v-chip>
  </div>
  
  </v-container>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { getAuthSigningSession, uploadAuthLetter, markAuthSessionComplete } from '@/api';
import { VueSignaturePad } from 'vue-signature-pad';
import html2canvas from 'html2canvas';

const route = useRoute();
const token = ref(route.params.token);

const isLoading = ref(true);
const loadingText = ref('正在驗證簽署連結...');
const error = ref(null);
const sessionData = ref(null);
const step = ref('signing');

const delegateeSignaturePad = ref(null);
const authLetterRenderRef = ref(null);

const clearSignature = () => {
  if (delegateeSignaturePad.value) {
    delegateeSignaturePad.value.clearSignature();
  }
};

const getMinguoDate = () => {
  const date = new Date();
  const year = date.getFullYear() - 1911;
  const month = date.getMonth() + 1;
  const day = date.getDate();
  return `中華民國 ${year} 年 ${month} 月 ${day} 日`;
};

const handleSubmitSignature = async () => {
  if (delegateeSignaturePad.value.isEmpty()) {
    alert('請在簽名板上簽名。');
    return;
  }

  loadingText.value = '正在產生並上傳授權書...';
  isLoading.value = true;

  try {
    const delegateeSignature = delegateeSignaturePad.value.saveSignature('image/png').data;

    const populatedHtml = sessionData.value.projectConfig.authLetterTemplate
      .replace(/{logoUrl}/g, sessionData.value.projectConfig.logoUrl)
      .replace(/{委託人姓名}/g, sessionData.value.formData.委託人姓名)
      .replace(/{建案名稱}/g, sessionData.value.projectName)
      .replace(/{戶別}/g, sessionData.value.unitId)
      .replace(/{受託人姓名}/g, sessionData.value.formData.受託人姓名)
      .replace(/{委託人簽名圖檔}/g, sessionData.value.delegatorSignature) // 從後端取得
      .replace(/{委託人身分證字號}/g, sessionData.value.formData.委託人身分證)
      .replace(/{委託人戶籍地址}/g, sessionData.value.formData.委託人戶籍地)
      .replace(/{受託人簽名圖檔}/g, delegateeSignature) // 使用剛剛簽的
      .replace(/{受託人身分證字號}/g, sessionData.value.formData.受託人身分證)
      .replace(/{受託人戶籍地址}/g, sessionData.value.formData.受託人戶籍地)
      .replace(/{TODAY}/g, getMinguoDate());

    authLetterRenderRef.value.innerHTML = populatedHtml;
    
    await new Promise(resolve => setTimeout(resolve, 100));

    const canvas = await html2canvas(authLetterRenderRef.value, { scale: 2, useCORS: true });
    const finalImageBase64 = canvas.toDataURL('image/png');

    const today = new Date();
    const yyyymmdd = `${today.getFullYear()}${(today.getMonth() + 1).toString().padStart(2, '0')}${today.getDate().toString().padStart(2, '0')}`;
    const fileName = `${sessionData.value.unitId}驗屋授權書${yyyymmdd}.png`;

    const uploadRes = await uploadAuthLetter(finalImageBase64, fileName, sessionData.value.projectId, sessionData.value.unitId);
    if (uploadRes.status !== 'success') {
      throw new Error(uploadRes.message || '授權書上傳失敗');
    }

    await markAuthSessionComplete({ token: token.value, finalUrl: uploadRes.url });

    step.value = 'success';
  } catch (err) {
    error.value = { title: '操作失敗', text: err.message || '發生未知錯誤，請聯繫管理員。' };
  } finally {
    isLoading.value = false;
  }
};

onMounted(async () => {
  if (!token.value) {
    error.value = { title: '連結無效', text: '簽署連結不包含有效的驗證碼。' };
    isLoading.value = false;
    return;
  }

  try {
    const result = await getAuthSigningSession({ token: token.value });
    if (result.status === 'success') {
      sessionData.value = result.data;
    } else {
      throw new Error(result.message);
    }
  } catch (err) {
    error.value = { title: '驗證失敗', text: err.message || '此簽署連結無效或已過期。' };
  } finally {
    isLoading.value = false;
  }
});
</script>