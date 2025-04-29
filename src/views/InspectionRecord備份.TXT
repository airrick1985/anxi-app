<template>
    <v-container>
      <v-card>
        <v-card-title>
          驗屋紀錄列表
          <v-spacer></v-spacer>
          <v-btn color="primary" @click="handleAddRecord">
            <v-icon left>mdi-plus</v-icon>
            新增紀錄
          </v-btn>
        </v-card-title>
        <v-divider></v-divider>
        <v-card-text>
          <v-text-field
            v-model="search"
            label="搜尋關鍵字"
            clearable
            class="mb-4"
          ></v-text-field>
  
          <v-data-table
            :headers="headers"
            :items="filteredRecords"
            :search="search"
            sort-by="createdAt"
            class="elevation-1"
          >
            <template v-slot:item.photos="{ item }">
              <v-btn small color="primary" @click="viewPhotos(item)">
                查看照片
              </v-btn>
            </template>
          </v-data-table>
        </v-card-text>
      </v-card>
  
      <!-- 查看照片 Dialog -->
      <v-dialog v-model="photoDialog" max-width="800">
        <v-card>
          <v-card-title>
            照片預覽
            <v-spacer></v-spacer>
            <v-btn icon @click="photoDialog = false">
              <v-icon>mdi-close</v-icon>
            </v-btn>
          </v-card-title>
          <v-divider></v-divider>
          <v-card-text>
            <v-carousel hide-delimiter-background>
              <v-carousel-item v-for="(url, i) in selectedPhotos" :key="i">
                <v-img :src="url" aspect-ratio="1"></v-img>
              </v-carousel-item>
            </v-carousel>
          </v-card-text>
        </v-card>
      </v-dialog>
    </v-container>
  </template>
  
  <script setup>
  import { ref, computed } from 'vue';
  
  // 假資料，後端串接後會換成 API 撈的資料
  const records = ref([]);
  
  const search = ref('');
  const photoDialog = ref(false);
  const selectedPhotos = ref([]);
  
  const headers = [
    { text: '建檔時間', value: 'createdAt' },
    { text: '驗屋日期', value: 'inspectionDate' },
    { text: '驗屋階段', value: 'inspectionStage' },
    { text: '驗屋人', value: 'inspector' },
    { text: '產權人', value: 'owner' },
    { text: '戶別', value: 'unit' },
    { text: '檢查區域', value: 'area' },
    { text: '分類', value: 'category' },
    { text: '細項', value: 'subcategory' },
    { text: '檢查狀態', value: 'inspectionStatus' },
    { text: '缺失等級', value: 'defectLevel' },
    { text: '檢查說明', value: 'description' },
    { text: '檢修時間', value: 'repairDate' },
    { text: '檢修狀態', value: 'repairStatus' },
    { text: '照片', value: 'photos', sortable: false },
  ];
  
  const filteredRecords = computed(() => records.value);
  
  const viewPhotos = (item) => {
    selectedPhotos.value = [item.photo1, item.photo2, item.photo3, item.photo4].filter(Boolean);
    photoDialog.value = true;
  };
  
  const handleAddRecord = () => {
    // 之後建置新增紀錄流程
    alert('新增紀錄功能待建置');
  };
  </script>
  
  <style scoped>
  .v-data-table {
    font-size: 0.9rem;
  }
  </style>
  