<template>
  <v-container class="py-8">
    <v-row justify="center">
      <v-col cols="12" md="8">
        <h2 class="text-center mb-6">驗屋資料詳情</h2>

        <v-card v-if="loading">
          <v-card-text class="text-center">
            <v-progress-circular indeterminate color="primary" size="48" />
          </v-card-text>
        </v-card>

        <v-card v-else>
          <v-card-text>
            <v-list dense>
              <v-list-item>
                <v-list-item-title>棟別</v-list-item-title>
                <v-list-item-subtitle>{{ detail.building }}</v-list-item-subtitle>
              </v-list-item>
              <v-list-item>
                <v-list-item-title>戶別</v-list-item-title>
                <v-list-item-subtitle>{{ detail.unit }}</v-list-item-subtitle>
              </v-list-item>
              <v-list-item>
                <v-list-item-title>車位</v-list-item-title>
                <v-list-item-subtitle>{{ detail.parking }}</v-list-item-subtitle>
              </v-list-item>
              <v-list-item>
                <v-list-item-title>產權人</v-list-item-title>
                <v-list-item-subtitle>{{ detail.owner }}</v-list-item-subtitle>
              </v-list-item>
              <v-list-item>
                <v-list-item-title>電話</v-list-item-title>
                <v-list-item-subtitle>{{ detail.phone }}</v-list-item-subtitle>
              </v-list-item>
              <v-list-item>
                <v-list-item-title>驗屋階段</v-list-item-title>
                <v-list-item-subtitle>{{ detail.stage }}</v-list-item-subtitle>
              </v-list-item>
              <v-list-item>
                <v-list-item-title>預約日期</v-list-item-title>
                <v-list-item-subtitle>{{ detail.date }}</v-list-item-subtitle>
              </v-list-item>
              <v-list-item>
                <v-list-item-title>預約時段</v-list-item-title>
                <v-list-item-subtitle>{{ detail.time }}</v-list-item-subtitle>
              </v-list-item>
              <v-list-item v-if="detail.docUrl">
                <v-list-item-title>驗屋文件</v-list-item-title>
                <v-list-item-subtitle>
                  <a :href="detail.docUrl" target="_blank">點此查看文件</a>
                </v-list-item-subtitle>
              </v-list-item>
            </v-list>

            <!-- 初驗 / 複驗 按鈕 -->
            <div class="mt-6 text-center">
              <v-btn color="primary" class="mx-2" :disabled="!detail.firstCheck">
                初驗
              </v-btn>
              <v-btn color="success" class="mx-2" :disabled="!detail.reCheck">
                複驗
              </v-btn>
            </div>

          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { fetchHouseDetail } from '@/api';

const route = useRoute();
const router = useRouter();
const loading = ref(true);
const detail = ref({});

// 驗證 Token
const validToken = 'anxi111003';

onMounted(async () => {
  const unitId = route.params.unitId;
  const token = route.query.token;

  if (!unitId || token !== validToken) {
    alert('無效或未授權的存取');
    router.replace('/inspection-record');
    return;
  }

  try {
    const result = await fetchHouseDetail(unitId);
    if (result.status === 'success') {
      detail.value = result.data;
    } else {
      alert('查詢失敗：' + (result.message || '未知錯誤'));
      router.replace('/inspection-record');
    }
  } catch (e) {
    console.error('取得資料錯誤', e);
    alert('伺服器錯誤');
    router.replace('/inspection-record');
  } finally {
    loading.value = false;
  }
});
</script>

<style scoped>
.text-center {
  text-align: center;
}
.mt-6 {
  margin-top: 1.5rem;
}
.mx-2 {
  margin-left: 0.5rem;
  margin-right: 0.5rem;
}
</style>
