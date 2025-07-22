<template>
  <v-card class="d-flex flex-column" style="height: 100vh; overflow: hidden;">
    <v-card-title class="d-flex align-center pe-2 flex-shrink-0">
      <v-icon icon="mdi-car-brake-parking"></v-icon> &nbsp;
      車位銷控管理

      <v-spacer></v-spacer>

      <v-text-field
        v-model="search"
        density="compact"
        label="搜尋 (可搜號碼、戶別、買方)"
        prepend-inner-icon="mdi-magnify"
        variant="solo-filled"
        flat
        hide-details
        single-line
        style="max-width: 350px;"
      ></v-text-field>
      <v-btn class="ml-2" icon="mdi-close" @click="$emit('close')"></v-btn>
    </v-card-title>

    <v-divider></v-divider>
    
    <div class="table-container flex-grow-1 pa-10">
      <v-data-table
        v-model:items-per-page="itemsPerPage"
        :headers="headers"
        :items="allItems"
        :search="search"
        :loading="loading"
        class="elevation-1"
        item-value="車位編號"
        density="compact"
        hover
        fixed-header
        height="calc(80vh - 60px)" 
        items-per-page-text="每頁數量："
        :page-text="'{0}-{1} 共 {2} 車'"
        :items-per-page-options="[{value: 10, title: '10'}, {value: 25, title: '25'}, {value: 50, title: '50'}, {value: -1, title: '全部'}]"

  >
        <template v-slot:item.銷控後台狀態="{ value }">
          <v-chip :color="getStatusColor(value)" size="small" label>
            {{ value || '可售' }}
          </v-chip>
        </template>

        <template v-slot:item.車位表價="{ value }">
          <span class="text-grey-darken-1">{{ formatPrice(value) }}</span>
        </template>
        <template v-slot:item.車位底價="{ value }">
          <span class="text-grey-darken-1">{{ formatPrice(value) }}</span>
        </template>
        <template v-slot:item.車位成交價="{ value }">
          <span class="text-blue-darken-2 font-weight-bold">{{ formatPrice(value) }}</span>
        </template>

        <template v-slot:item.購買戶別="{ value }">
          {{ value || '-' }}
        </template>
         <template v-slot:item.買方姓名="{ value }">
          {{ value || '-' }}
        </template>
          <template v-slot:item.備註="{ value }">
           <div class="text-truncate" style="max-width: 150px;" :title="value">
              {{ value || '-' }}
           </div>
        </template>

        <template v-slot:item.操作="{ item }">
          <v-icon
            size="small"
            class="me-2"
            @click="editItem(item)"
            title="編輯"
          >
            mdi-pencil
          </v-icon>
        </template>

        <template v-slot:no-data>
          <v-btn color="primary" @click="initialize">
            重新載入
          </v-btn>
        </template>
      </v-data-table>
    </div>

    <v-dialog v-model="dialog" max-width="700px" persistent>
      <v-card>
        <v-card-title class="text-h6 font-weight-bold bg-grey-lighten-4">
          編輯車位資訊
        </v-card-title>
        <v-divider></v-divider>
        <v-card-text class="py-4">
          <v-container>
            <v-row>
              <v-col cols="12">
                <div class="form-section-title">基礎資訊</div>
              </v-col>
              <v-col cols="12" sm="6" md="3">
                <v-text-field label="車位樓層" :model-value="editedItem.車位樓層" readonly variant="outlined" density="compact" class="readonly-field"></v-text-field>
              </v-col>
              <v-col cols="12" sm="6" md="3">
                <v-text-field label="號碼" :model-value="editedItem.號碼" readonly variant="outlined" density="compact" class="readonly-field"></v-text-field>
              </v-col>
              <v-col cols="12" sm="6" md="3">
                <v-text-field label="車位編號" :model-value="editedItem.車位編號" readonly variant="outlined" density="compact" class="readonly-field"></v-text-field>
              </v-col>
              <v-col cols="12" sm="3" md="1.5">
                <v-text-field label="類型" :model-value="editedItem.類型" readonly variant="outlined" density="compact" class="readonly-field"></v-text-field>
              </v-col>
              <v-col cols="12" sm="3" md="1.5">
                <v-text-field label="尺寸" :model-value="editedItem.車位尺寸" readonly variant="outlined" density="compact" class="readonly-field"></v-text-field>
              </v-col>

              <v-col cols="12">
                <div class="form-section-title mt-3">價格資訊</div>
              </v-col>
              <v-col cols="12" sm="4">
                <v-text-field label="車位表價" :model-value="editedItem.車位表價" readonly variant="outlined" density="compact" suffix="萬" class="readonly-field"></v-text-field>
              </v-col>
              <v-col cols="12" sm="4">
                <v-text-field label="車位底價" :model-value="editedItem.車位底價" readonly variant="outlined" density="compact" suffix="萬" class="readonly-field"></v-text-field>
              </v-col>
              <v-col cols="12" sm="4">
                <v-text-field label="車位成交價" :model-value="editedItem.車位成交價" readonly variant="outlined" density="compact" suffix="萬" class="readonly-field"></v-text-field>
              </v-col>

              <v-col cols="12">
                <div class="form-section-title mt-3">銷控資訊</div>
              </v-col>
              <v-col cols="12" sm="6">
                <v-text-field label="銷控狀態" v-model="derivedSalesStatus" readonly variant="outlined" density="compact" hint="此欄位由後台狀態自動產生" class="readonly-field"></v-text-field>
              </v-col>
              <v-col cols="12" sm="6">
                <v-select
                  v-model="editedItem.銷控後台狀態"
                  :items="['', '保留', '現場銷控']"
                  label="銷控後台狀態"
                  :readonly="isBackendStatusLocked"
                  :hint="isBackendStatusLocked ? '此狀態為系統自動更新，無法手動變更' : ''"
                  persistent-hint
                  variant="outlined"
                  density="compact"
                  clearable
                  :class="isBackendStatusLocked ? 'readonly-field' : 'editable-field'"
                ></v-select>
              </v-col>
              <v-col cols="12" sm="6">
                <v-text-field label="購買戶別" :model-value="editedItem.購買戶別" readonly variant="outlined" density="compact" class="readonly-field"></v-text-field>
              </v-col>
              <v-col cols="12" sm="6">
                <v-text-field
                  v-model="editedItem.買方姓名"
                  label="買方姓名"
                  variant="outlined"
                  density="compact"
                  class="editable-field"
                ></v-text-field>
              </v-col>
              <v-col cols="12">
                <v-textarea
                  v-model="editedItem.備註"
                  label="備註"
                  variant="outlined"
                  rows="3"
                  class="editable-field"
                ></v-textarea>
              </v-col>
            </v-row>
          </v-container>
        </v-card-text>
        <v-divider></v-divider>
        <v-card-actions class="pa-4 bg-grey-lighten-5">
          <v-spacer></v-spacer>
          <v-btn color="grey-darken-1" variant="text" @click="close">取消</v-btn>
          <v-btn color="primary" variant="elevated" :loading="saving" @click="save">儲存</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

     <v-snackbar
      v-model="snackbar.visible"
      :timeout="2000"
      :color="snackbar.color"
    >
      {{ snackbar.text }}
    </v-snackbar>
  </v-card>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { fetchParkingLotDetails, updateParkingLotDetails } from '@/api';

const emit = defineEmits(['close']);
const route = useRoute();
const itemsPerPage = ref(-1);

const headers = ref([
  { title: '操作', key: '操作', sortable: false, align: 'center', width: '2%' },
  { title: '樓層', key: '車位樓層', align: 'center',width: '5%' },
  { title: '號碼', key: '號碼', align: 'center',width: '5%' },
  { title: '後台狀態', key: '銷控後台狀態', align: 'center',width: '5%' },
  { title: '表價', key: '車位表價', align: 'end',width: '5%' },
  { title: '底價', key: '車位底價', align: 'end',width: '5%' },
  { title: '成交價', key: '車位成交價', align: 'end',width: '5%' },
  { title: '購買戶別', key: '購買戶別', align: 'center',width: '5%' },
  { title: '買方', key: '買方姓名', align: 'center',width: '5%' },
  { title: '備註', key: '備註', align: 'start', sortable: false,width: '15%'},
  
]);

const allItems = ref([]);
const loading = ref(true);
const saving = ref(false);
const search = ref('');
const dialog = ref(false);
const editedItem = ref({});
const snackbar = ref({ visible: false, text: '', color: 'success' });

const isBackendStatusLocked = computed(() => {
  const status = editedItem.value.銷控後台狀態_original;
  return ['簽約', '小訂', '補足'].includes(status);
});

const derivedSalesStatus = computed(() => {
    if (editedItem.value.銷控後台狀態) {
        return '已售';
    }
    return '';
});

const loadItems = async () => {
  loading.value = true;
  try {
    const projectName = route.params.projectName;
    const response = await fetchParkingLotDetails(projectName);
    
    if (response.status === 'success') {
      allItems.value = response.data.items;
    } else {
      throw new Error(response.message || '無法取得車位資料');
    }
  } catch (error) {
    console.error("Error loading items:", error);
    showSnackbar(`資料載入失敗: ${error.message}`, 'error');
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  loadItems();
});

const initialize = () => {
  loadItems();
};

const editItem = (item) => {
  editedItem.value = { ...item, 銷控後台狀態_original: item.銷控後台狀態 };
  dialog.value = true;
};

const close = () => {
  dialog.value = false;
};

const save = async () => {
  saving.value = true;
  try {
    const projectName = route.params.projectName;
    const payload = {
      projectName,
      key: editedItem.value.車位編號,
      data: {
        銷控後台狀態: editedItem.value.銷控後台狀態,
        買方姓名: editedItem.value.買方姓名,
        備註: editedItem.value.備註,
        銷控狀態: derivedSalesStatus.value 
      }
    };

    const response = await updateParkingLotDetails(payload);
    if (response.status !== 'success') {
      throw new Error(response.message || '更新失敗');
    }
    
    const index = allItems.value.findIndex(item => item.車位編號 === editedItem.value.車位編號);
    if (index !== -1) {
      allItems.value[index].銷控後台狀態 = editedItem.value.銷控後台狀態;
      allItems.value[index].買方姓名 = editedItem.value.買方姓名;
      allItems.value[index].備註 = editedItem.value.備註;
      allItems.value[index].銷控狀態 = derivedSalesStatus.value;
    }
    
    showSnackbar('儲存成功', 'success');
    close();
  } catch (error) {
     console.error("Error saving item:", error);
     showSnackbar(`儲存失敗: ${error.message}`, 'error');
  } finally {
      saving.value = false;
  }
};

const showSnackbar = (text, color = 'success') => {
  snackbar.value.text = text;
  snackbar.value.color = color;
  snackbar.value.visible = true;
};

const getStatusColor = (status) => {
  switch (status) {
    case '小訂': return '#c0392b';
    case '補足': return '#c0392b';
    case '簽約': return '#c0392b';
    case '保留': return '#b4a7d6';
    case '現場銷控': return '#b4a7d6';
    case '已售': return 'grey';
    default: return '#239b56';
  }
};

const formatPrice = (value) => {
  if (value === null || value === undefined || value === '') return '-';
  const price = new Intl.NumberFormat().format(value);
  return `${price} 萬`;
};
</script>

<style scoped>
.table-container {
  overflow-y: auto;
}

:deep(tbody tr:hover) {
    background-color: #E3F2FD !important;
}

.text-truncate {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.form-section-title {
    font-size: 1rem;
    font-weight: 600;
    color: #0D47A1;
    border-left: 4px solid #0D47A1;
    padding-left: 8px;
    margin-bottom: 12px;
}

/* 優化 #2: 新增欄位顏色區隔 */
:deep(.readonly-field .v-field) {
  background-color: #f5f5f5 !important;
  color: #616161 !important;
}

:deep(.editable-field .v-field) {
  background-color: #E3F2FD !important;
}

/* --- ✅ 新版：表頭顏色優化 (更高優先級) --- */
:deep(.v-data-table > .v-table__wrapper > table > thead > tr > th) {
  background-color: #1A3A6E !important;
  color: white !important;
}

:deep(.v-data-table > .v-table__wrapper > table > thead > tr > th .v-data-table-header__content span) {
  color: white !important;
  font-weight: 600 !important;
}

:deep(.v-data-table > .v-table__wrapper > table > thead > tr > th i) {
  color: white !important;
}
</style>