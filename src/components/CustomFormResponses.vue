<template>
  <v-card class="h-100 d-flex flex-column rounded-0">
    <!-- Toolbar -->
    <v-toolbar color="white" elevation="1">
      <v-btn icon="mdi-close" @click="$emit('close')"></v-btn>
      <v-toolbar-title>
        {{ form?.title }} — 回覆紀錄
        <v-chip size="small" color="primary" variant="tonal" class="ml-2">
          {{ responses.length }} 筆
        </v-chip>
      </v-toolbar-title>
      <v-spacer></v-spacer>

      <!-- 模式切換 -->
      <v-btn-toggle v-model="viewMode" mandatory density="compact" class="mr-4">
        <v-btn value="list" size="small">
          <v-icon start>mdi-format-list-bulleted</v-icon>
          列表
        </v-btn>
        <v-btn value="detail" size="small" :disabled="responses.length === 0">
          <v-icon start>mdi-eye</v-icon>
          檢視
        </v-btn>
      </v-btn-toggle>
    </v-toolbar>

    <!-- Loading -->
    <div v-if="loading" class="flex-grow-1 d-flex align-center justify-center">
      <v-progress-circular indeterminate color="primary" size="64"></v-progress-circular>
    </div>

    <!-- Empty State -->
    <div v-else-if="responses.length === 0" class="flex-grow-1 d-flex align-center justify-center">
      <div class="text-center">
        <v-icon size="80" color="grey-lighten-1" class="mb-4">mdi-inbox-outline</v-icon>
        <h3 class="text-h6 text-grey">尚無任何回覆</h3>
        <p class="text-body-2 text-grey-darken-1 mt-2">此表單還沒有收到任何填寫回覆</p>
      </div>
    </div>

    <!-- List Mode -->
    <div v-else-if="viewMode === 'list'" class="flex-grow-1 overflow-y-auto pa-4">
      <div class="d-flex justify-space-between align-center mb-4">
        <v-text-field
          v-model="searchText"
          prepend-inner-icon="mdi-magnify"
          label="搜尋回覆..."
          variant="outlined"
          density="compact"
          hide-details
          clearable
          style="max-width: 400px"
        ></v-text-field>
        <v-btn
          color="success"
          variant="flat"
          prepend-icon="mdi-microsoft-excel"
          @click="exportAllExcel"
          :loading="exporting"
        >
          匯出全部 Excel
        </v-btn>
      </div>

      <v-data-table
        :headers="tableHeaders"
        :items="filteredResponses"
        :search="searchText"
        hover
        class="elevation-1 rounded-lg"
        density="comfortable"
        items-per-page="15"
      >
        <!-- 提交時間欄位 -->
        <template v-slot:item._submittedAt="{ item }">
          {{ formatTimestamp(item._submittedAt) }}
        </template>

        <!-- 操作欄位 -->
        <template v-slot:item._actions="{ item }">
          <v-btn
            icon="mdi-eye"
            size="small"
            variant="text"
            color="primary"
            @click="viewDetail(item)"
          ></v-btn>
        </template>

        <!-- 通用 cell truncate -->
        <template v-for="col in dynamicColumns" v-slot:[`item.${col}`]="{ item }" :key="col">
          <span class="text-truncate d-inline-block" style="max-width: 200px" :title="String(item[col] ?? '')">
            {{ item[col] ?? '' }}
          </span>
        </template>
      </v-data-table>
    </div>

    <!-- Detail Mode -->
    <div v-else-if="viewMode === 'detail'" class="flex-grow-1 overflow-y-auto">
      <!-- Navigation Bar -->
      <div class="d-flex align-center justify-space-between pa-4 bg-grey-lighten-4 border-b">
        <v-btn
          variant="text"
          prepend-icon="mdi-arrow-left"
          @click="viewMode = 'list'"
        >
          返回列表
        </v-btn>

        <div class="d-flex align-center">
          <v-btn
            icon="mdi-chevron-left"
            size="small"
            variant="tonal"
            :disabled="currentIndex <= 0"
            @click="currentIndex--"
            class="mr-2"
          ></v-btn>
          <span class="text-body-1 font-weight-bold mx-2">
            {{ currentIndex + 1 }} / {{ responses.length }}
          </span>
          <v-btn
            icon="mdi-chevron-right"
            size="small"
            variant="tonal"
            :disabled="currentIndex >= responses.length - 1"
            @click="currentIndex++"
            class="ml-2"
          ></v-btn>
        </div>

        <v-btn
          color="success"
          variant="flat"
          prepend-icon="mdi-microsoft-excel"
          size="small"
          @click="exportSingleExcel"
          :loading="exporting"
        >
          匯出此筆
        </v-btn>
      </div>

      <!-- Detail Content -->
      <v-container style="max-width: 700px" class="py-6">
        <v-card v-if="currentResponse" variant="outlined" class="rounded-lg">
          <!-- Header -->
          <div class="pa-4 bg-primary rounded-t-lg">
            <div class="d-flex justify-space-between align-center text-white">
              <div>
                <div class="text-h6 font-weight-bold">{{ currentResponse._unitId || '未指定戶別' }}</div>
                <div class="text-caption opacity-80">{{ formatTimestamp(currentResponse._submittedAt) }}</div>
              </div>
              <v-chip color="white" variant="flat" size="small">
                第 {{ currentIndex + 1 }} 筆
              </v-chip>
            </div>
          </div>

          <!-- Fields -->
          <v-card-text class="pa-0">
            <v-list lines="two" class="pa-0">
              <template v-for="(value, key) in currentResponseFields" :key="key">
                <v-list-item>
                  <template v-slot:prepend>
                    <v-icon color="grey" size="small" class="mr-2">mdi-form-textbox</v-icon>
                  </template>
                  <v-list-item-title class="text-caption text-grey-darken-1 font-weight-bold">
                    {{ key }}
                  </v-list-item-title>
                  <v-list-item-subtitle class="text-body-1 text-black mt-1" style="white-space: pre-wrap; -webkit-line-clamp: unset; line-clamp: unset;">
                    {{ value || '（未填寫）' }}
                  </v-list-item-subtitle>
                </v-list-item>
                <v-divider></v-divider>
              </template>
            </v-list>
          </v-card-text>
        </v-card>
      </v-container>
    </div>
  </v-card>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/firebase';
import { useToast } from 'vue-toastification';
import * as XLSX from 'xlsx-js-style';

const props = defineProps<{
  projectId: string;
  form: any;
}>();

defineEmits(['close']);

const toast = useToast();
const loading = ref(false);
const exporting = ref(false);
const viewMode = ref<'list' | 'detail'>('list');
const searchText = ref('');
const currentIndex = ref(0);

// 所有回覆（已加工為扁平物件）
const responses = ref<any[]>([]);

// --- 載入回覆 ---
const loadResponses = async () => {
  loading.value = true;
  try {
    const q = query(
      collection(db, 'customFormSubmissions'),
      where('projectId', '==', props.projectId),
      where('formId', '==', props.form.id),
    );
    const snapshot = await getDocs(q);

    const items = snapshot.docs.map(d => {
      const raw = d.data();
      // 使用 readableSnapshot（人類可讀），回退到 data
      const displayData = raw.snapshotAvailable && raw.readableSnapshot
        ? raw.readableSnapshot
        : raw.data || {};

      return {
        _id: d.id,
        _unitId: raw.unitId || displayData['戶別'] || '',
        _submittedAt: raw.submittedAt,
        ...displayData,
      };
    });

    // 按提交時間排序（新 → 舊）
    items.sort((a, b) => {
      const ta = a._submittedAt?.seconds || 0;
      const tb = b._submittedAt?.seconds || 0;
      return tb - ta;
    });

    responses.value = items;
  } catch (err) {
    console.error('載入回覆失敗:', err);
    toast.error('載入回覆失敗');
  } finally {
    loading.value = false;
  }
};

// --- 從表單定義提取有序欄位標籤（含遞迴子欄位）---
const extractFieldLabels = (fields: any[]): string[] => {
  const labels: string[] = [];
  if (!fields) return labels;
  fields.forEach(f => {
    // 排除純顯示欄位（header, description, divider）
    if (['header', 'description', 'divider'].includes(f.type)) return;
    if (f.label) labels.push(f.label);
    // 遞迴提取選項的子欄位
    if (f.options) {
      f.options.forEach((opt: any) => {
        if (opt.subFields) {
          labels.push(...extractFieldLabels(opt.subFields));
        }
      });
    }
  });
  return labels;
};

// --- 動態欄位（依照表單定義順序）---
const dynamicColumns = computed(() => {
  // 從表單定義取得有序欄位標籤
  const orderedLabels = extractFieldLabels(props.form?.fields || []);
  // 收集所有回覆中實際存在的 key
  const existingKeys = new Set<string>();
  responses.value.forEach(r => {
    Object.keys(r).forEach(k => {
      if (!k.startsWith('_')) existingKeys.add(k);
    });
  });
  // 依表單順序排列，再補上不在表單定義但出現在回覆中的欄位
  const result: string[] = [];
  orderedLabels.forEach(label => {
    if (existingKeys.has(label)) {
      result.push(label);
      existingKeys.delete(label);
    }
  });
  // 補上殘餘（例如舊版欄位）
  existingKeys.forEach(k => result.push(k));
  return result;
});

// --- 表格 Headers ---
const tableHeaders = computed(() => {
  const headers: any[] = [
    { title: '戶別', key: '_unitId', sortable: true, width: '120px' },
    { title: '提交時間', key: '_submittedAt', sortable: true, width: '160px' },
  ];

  dynamicColumns.value.forEach(col => {
    // 戶別已在固定欄位，跳過
    if (col === '戶別') return;
    headers.push({
      title: col,
      key: col,
      sortable: true,
    });
  });

  headers.push({
    title: '操作',
    key: '_actions',
    sortable: false,
    width: '80px',
    align: 'center',
  });

  return headers;
});

// --- 搜尋過濾 ---
const filteredResponses = computed(() => {
  if (!searchText.value) return responses.value;
  const keyword = searchText.value.toLowerCase();
  return responses.value.filter(r => {
    return Object.entries(r).some(([k, v]) => {
      if (k.startsWith('_')) return false;
      return String(v ?? '').toLowerCase().includes(keyword);
    }) || String(r._unitId ?? '').toLowerCase().includes(keyword);
  });
});

// --- 檢視模式 ---
const currentResponse = computed(() => responses.value[currentIndex.value] || null);

const currentResponseFields = computed(() => {
  if (!currentResponse.value) return {};
  const fields: Record<string, any> = {};
  // 依照 dynamicColumns 的順序排列
  dynamicColumns.value.forEach(col => {
    fields[col] = currentResponse.value[col] ?? '';
  });
  return fields;
});

const viewDetail = (item: any) => {
  const idx = responses.value.findIndex(r => r._id === item._id);
  if (idx >= 0) currentIndex.value = idx;
  viewMode.value = 'detail';
};

// --- 時間格式化 ---
const formatTimestamp = (ts: any) => {
  if (!ts) return '-';
  try {
    const date = ts.toDate ? ts.toDate() : new Date(ts.seconds * 1000);
    return date.toLocaleString('zh-TW', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return '-';
  }
};

// --- Excel 匯出：全部 ---
const exportAllExcel = () => {
  exporting.value = true;
  try {
    const columns = dynamicColumns.value;
    // 表頭
    const headerRow = ['戶別', '提交時間', ...columns.filter(c => c !== '戶別')];

    // 資料列
    const dataRows = responses.value.map(r => {
      return [
        r._unitId || '',
        formatTimestamp(r._submittedAt),
        ...columns.filter(c => c !== '戶別').map(c => r[c] ?? ''),
      ];
    });

    const wsData = [headerRow, ...dataRows];
    const ws = XLSX.utils.aoa_to_sheet(wsData);

    // 表頭樣式
    headerRow.forEach((_h, i) => {
      const cell = ws[XLSX.utils.encode_cell({ r: 0, c: i })];
      if (cell) {
        cell.s = {
          font: { bold: true, color: { rgb: 'FFFFFF' } },
          fill: { fgColor: { rgb: '1976D2' } },
          alignment: { horizontal: 'center' },
        };
      }
    });

    // 欄寬自動
    ws['!cols'] = headerRow.map((h, i) => {
      const maxLen = Math.max(
        h.length,
        ...dataRows.map(r => String(r[i] ?? '').length)
      );
      return { wch: Math.min(Math.max(maxLen + 2, 10), 40) };
    });

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, '全部回覆');

    const dateStr = new Date().toISOString().slice(0, 10);
    XLSX.writeFile(wb, `${props.form.title}_回覆_${dateStr}.xlsx`);
    toast.success('Excel 匯出成功');
  } catch (err) {
    console.error(err);
    toast.error('匯出失敗');
  } finally {
    exporting.value = false;
  }
};

// --- Excel 匯出：單筆 ---
const exportSingleExcel = () => {
  if (!currentResponse.value) return;
  exporting.value = true;
  try {
    const r = currentResponse.value;
    const rows: string[][] = [
      ['欄位名稱', '填寫內容'],
      ['戶別', r._unitId || ''],
      ['提交時間', formatTimestamp(r._submittedAt)],
    ];

    Object.entries(currentResponseFields.value).forEach(([k, v]) => {
      rows.push([k, String(v ?? '')]);
    });

    const ws = XLSX.utils.aoa_to_sheet(rows);

    // 表頭樣式
    for (let i = 0; i < 2; i++) {
      const cell = ws[XLSX.utils.encode_cell({ r: 0, c: i })];
      if (cell) {
        cell.s = {
          font: { bold: true, color: { rgb: 'FFFFFF' } },
          fill: { fgColor: { rgb: '1976D2' } },
          alignment: { horizontal: 'center' },
        };
      }
    }

    // 欄寬
    ws['!cols'] = [
      { wch: 20 },
      { wch: 40 },
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, '回覆內容');

    const dateStr = new Date().toISOString().slice(0, 10);
    const unitLabel = r._unitId || '未指定';
    XLSX.writeFile(wb, `${props.form.title}_${unitLabel}_回覆_${dateStr}.xlsx`);
    toast.success('Excel 匯出成功');
  } catch (err) {
    console.error(err);
    toast.error('匯出失敗');
  } finally {
    exporting.value = false;
  }
};

onMounted(() => {
  loadResponses();
});
</script>

<style scoped>
.border-b {
  border-bottom: 1px solid #e0e0e0;
}
</style>
