<template>
    <v-container class="fill-height" fluid>
      <v-row justify="center" align="center">
        <v-col cols="12" sm="8" md="6">
          <h2 class="text-center mb-6">選擇驗屋戶別</h2>
  
          <v-select
            v-model="selectedBuilding"
            :items="buildingList"
            label="請選擇棟別"
            outlined
            dense
            required
          />
  
          <v-select
            v-model="selectedUnit"
            :items="unitList"
            label="請選擇戶別"
            outlined
            dense
            required
            :disabled="!selectedBuilding"
          />
  
          <v-btn
            color="primary"
            block
            class="mt-6"
            :disabled="!selectedBuilding || !selectedUnit"
            @click="confirm"
          >
            確認
          </v-btn>
        </v-col>
      </v-row>
    </v-container>
  </template>
  
  <script setup>
  import { ref, computed, onMounted } from 'vue';
  import { useRouter } from 'vue-router';
  import { fetchUnitList } from '../api'; // ✅ 這個 api 我等下也幫你寫好
  
  const router = useRouter();
  const unitsData = ref({});
  const selectedBuilding = ref('');
  const selectedUnit = ref('');
  
  const buildingList = computed(() => Object.keys(unitsData.value));
  const unitList = computed(() => unitsData.value[selectedBuilding.value] || []);
  
  const confirm = () => {
    console.log('選擇：', selectedBuilding.value, selectedUnit.value);
    router.push('/inspection-detail'); // ⚡ 之後換成你要跳的頁
  };
  
  onMounted(async () => {
    const result = await fetchUnitList();
    if (result.status === 'success') {
      unitsData.value = result.units;
    } else {
      console.error('載入戶別資料失敗:', result.message);
    }
  });
  </script>
  
  <style scoped>
  .mb-6 {
    margin-bottom: 1.5rem;
  }
  </style>
  