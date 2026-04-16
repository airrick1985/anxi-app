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

      <v-switch
        v-model="showDeleted"
        label="顯示已刪除"
        color="error"
        density="compact"
        hide-details
        inset
      ></v-switch>
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
    <div v-else class="flex-grow-1 overflow-y-auto pa-4">
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
        v-model:expanded="expandedRows"
        item-value="_id"
        show-expand
        @click:row="onRowClick"
      >
        <!-- 提交時間欄位 -->
        <template v-slot:item._submittedAt="{ item }">
          {{ formatTimestamp(item._submittedAt) }}
        </template>

        <!-- 操作欄位 -->
        <template v-slot:item._actions="{ item }">
          <div class="d-flex justify-center gap-1">
            <v-tooltip text="點擊列展開編輯">
              <template v-slot:activator="{ props }">
                <v-icon
                  v-bind="props"
                  size="small"
                  color="primary"
                  class="cursor-pointer"
                  @click.stop="onRowClick($event, { item })"
                >
                  mdi-pencil
                </v-icon>
              </template>
            </v-tooltip>
            <v-btn
              v-if="!showDeleted"
              icon="mdi-delete"
              size="x-small"
              variant="text"
              color="error"
              title="刪除"
              @click.stop="softDeleteResponse(item)"
            ></v-btn>
            <template v-else>
              <v-btn
                icon="mdi-restore"
                size="x-small"
                variant="text"
                color="success"
                title="還原"
                @click.stop="restoreResponse(item)"
              ></v-btn>
              <v-btn
                icon="mdi-delete-forever"
                size="x-small"
                variant="text"
                color="error"
                title="永久刪除"
                @click.stop="hardDeleteResponse(item)"
              ></v-btn>
            </template>
          </div>
        </template>

        <!-- 通用 cell truncate -->
        <template v-for="col in dynamicColumns" v-slot:[`item.${col}`]="{ item }" :key="col">
          <span class="text-truncate d-inline-block" style="max-width: 200px" :title="formatCellValue(item[col])">
            {{ formatCellValue(item[col]) }}
          </span>
        </template>

        <!-- 展開列 -->
        <template v-slot:expanded-row="{ item }">
          <td :colspan="tableHeaders.length" class="pa-0">
            <div class="expanded-form-wrapper">
              <v-form @submit.prevent class="compact-form-layout">
                <!-- 動態渲染表單欄位 -->
                <div class="form-grid">
                  <div v-for="field in form?.fields" :key="`${item._id}-${field.id}`" :class="getFieldWrapperClass(field.type)">
                    <FormRenderItem
                      v-if="!['header', 'description', 'divider', 'link'].includes(field.type)"
                      :key="`edit-${item._id}-${field.id}-${JSON.stringify(editingData[item._id]?.[field.id] ?? editingData[item._id]?.[field.label])}`"
                      :field="getEditableField(field)"
                      :model-value="editingData[item._id]?.[field.label] ?? ''"
                      @update:model-value="updateEditingField(item._id, field.label, $event)"
                      :formData="editingData[item._id] || {}"
                      class="compact-field"
                    />
                    <!-- 顯示非輸入類型的欄位 -->
                    <template v-else>
                      <div v-if="field.type === 'header'" class="section-header">
                        <v-icon size="small" color="primary" class="mr-1">mdi-folder-outline</v-icon>
                        <span>{{ field.label }}</span>
                      </div>
                      <div v-else-if="field.type === 'description'" class="section-description">
                        {{ field.content }}
                      </div>
                      <div v-else-if="field.type === 'divider'" class="section-divider"></div>
                    </template>
                  </div>
                </div>

                <!-- 操作按鈕 - 底部固定欄 -->
                <div class="form-actions">
                  <v-btn
                    color="success"
                    variant="flat"
                    icon="mdi-content-save"
                    size="small"
                    @click.stop="saveEditing(item)"
                    :loading="savingId === item._id"
                    class="action-btn"
                  >
                    保存
                  </v-btn>
                  <v-btn
                    color="grey"
                    variant="text"
                    icon="mdi-refresh"
                    size="small"
                    @click.stop="resetEditing(item._id)"
                    class="action-btn"
                  >
                    重置
                  </v-btn>
                  <v-spacer></v-spacer>
                  <v-btn
                    color="error"
                    variant="text"
                    icon="mdi-delete"
                    size="small"
                    @click.stop="softDeleteResponse(item)"
                    class="action-btn"
                  >
                    刪除
                  </v-btn>
                  <v-btn
                    color="info"
                    variant="text"
                    icon="mdi-microsoft-excel"
                    size="small"
                    @click.stop="exportSingleExcel(item)"
                    :loading="exporting"
                    class="action-btn"
                  >
                    匯出
                  </v-btn>
                </div>
              </v-form>
            </div>
          </td>
        </template>
      </v-data-table>
    </div>


  </v-card>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, defineAsyncComponent } from 'vue';
import { collection, query, where, getDocs, doc, getDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '@/firebase';
import { useToast } from 'vue-toastification';
import * as XLSX from 'xlsx-js-style';
import FormRenderItem from '@/components/FormRenderItem.vue';

const props = defineProps<{
  projectId: string;
  form: any;
}>();

defineEmits(['close']);

const toast = useToast();
const loading = ref(false);
const exporting = ref(false);
const searchText = ref('');
const showDeleted = ref(false);

// Response Editor State
const expandedRows = ref<string[]>([]);
const editingData = ref<Record<string, Record<string, any>>>({});
const savingId = ref<string | null>(null);

// Google Sheet Sync State
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
        _isDeleted: raw.isDeleted || false,
        ...displayData,
        // 同時保留原始數據（用 ID 作為 key），以便子欄位值能正確顯示
        ...(raw.data || {}),
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

// --- Google Sheet Sync 邏輯 ---
// --- 編輯回覆內容 ---
const resetEditing = (itemId: string) => {
  // 找到對應的項目並重新初始化編輯數據
  const item = filteredResponses.value.find((r: any) => r._id === itemId);
  if (item) {
    editingData.value = {
      ...editingData.value,
      [itemId]: { ...getResponseFields(item) }
    };
  }
};

const getEditingFields = (item: any): Record<string, any> => {
  // 如果已初始化編輯數據，使用編輯數據；否則使用原始數據
  if (editingData.value[item._id]) {
    return editingData.value[item._id];
  }
  return getResponseFields(item);
};

const updateEditingField = (itemId: string, key: string, value: any) => {
  editingData.value = {
    ...editingData.value,
    [itemId]: {
      ...(editingData.value[itemId] || {}),
      [key]: value
    }
  };
};

// 獲取編輯用的欄位定義（禁用 readOnly 並設置緊湊密度）
const getEditableField = (field: any) => {
  const editField = { ...field };

  // 在編輯模式中，允許編輯系統欄位
  if (field.type === 'system' && field.readOnly) {
    editField.readOnly = false;
  }

  // 設置緊湊密度，除了需要更多空間的欄位
  if (!['address', 'textarea'].includes(field.type)) {
    editField.density = 'compact';
  }

  return editField;
};

// 根據欄位類型決定列寬（優化 16:9 屏幕布局）
const getFieldColSize = (fieldType: string) => {
  // 這些欄位應該佔滿整行
  if (['address'].includes(fieldType)) {
    return { cols: '12', sm: '12', md: '12', lg: '12', xl: '12' };
  }
  // 文本區佔 2/3 寬度
  if (['textarea'].includes(fieldType)) {
    return { cols: '12', sm: '12', md: '8', lg: '8', xl: '8' };
  }
  // 其他欄位在大屏上佔 1/4（支持 4 列）
  return { cols: '12', sm: '12', md: '6', lg: '3', xl: '3' };
};

// 取得欄位包裝器 CSS 類別（新緊湊布局）
const getFieldWrapperClass = (fieldType: string): string => {
  if (['header', 'description', 'divider'].includes(fieldType)) {
    return 'field-wrapper full-width';
  }
  if (['address', 'textarea'].includes(fieldType)) {
    return 'field-wrapper full-width';
  }
  // 普通字段：在桌面上 2-3 列，平板上 2 列，手機上 1 列
  return 'field-wrapper';
};

// 深度轉換 Proxy 對象為普通物件（Firestore 相容）
const convertProxyToPlain = (obj: any): any => {
  if (obj === null || obj === undefined) return obj;
  if (typeof obj !== 'object') return obj;
  if (obj instanceof Date) return obj;
  if (Array.isArray(obj)) {
    return obj.map(item => convertProxyToPlain(item));
  }
  const plain: Record<string, any> = {};
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      plain[key] = convertProxyToPlain(obj[key]);
    }
  }
  return plain;
};

const saveEditing = async (item: any) => {
  savingId.value = item._id;
  try {
    // 建立 ID 到 Label 的映射（含所有層級）
    const idToLabelMap = buildIdToLabelMap(props.form?.fields || []);

    // 建立 Label 到 ID 的映射，頂級欄位優先
    // 重點：radio 的「其他」子欄位可能與父欄位同名（如「緊急聯絡人關係」、「行業別」），
    // 必須確保 labelToIdMap 映射到頂級（父）欄位 ID，子欄位由 ID key 自行處理
    const topLevelIds = new Set(extractTopLevelFieldIds(props.form?.fields || []));
    const labelToIdMap: Record<string, string> = {};
    // 先放入所有映射（子欄位可能覆蓋父欄位）
    Object.entries(idToLabelMap).forEach(([id, label]) => {
      labelToIdMap[label] = id;
    });
    // 再用頂級欄位覆蓋回來，確保頂級優先
    Object.entries(idToLabelMap).forEach(([id, label]) => {
      if (topLevelIds.has(id)) {
        labelToIdMap[label] = id;
      }
    });

    const allFieldIds = extractAllFieldIds(props.form?.fields || []);
    const idSet = new Set(allFieldIds);

    // 分離 ID keys 和 Label keys
    const dataPayload: Record<string, any> = {};      // 用 ID 作為 key
    const readablePayload: Record<string, any> = {};  // 用 label 作為 key

    Object.entries(editingData.value[item._id]).forEach(([key, value]) => {
      // 跳過 undefined 和 null 值
      if (value === undefined || value === null) return;

      // 轉換 Proxy 為普通物件
      const plainValue = convertProxyToPlain(value);

      // 如果 key 是 field ID，放入 data
      if (idSet.has(key)) {
        dataPayload[key] = plainValue;
      } else {
        // 否則視為 label，放入 readableSnapshot
        readablePayload[key] = plainValue;
        // 【關鍵】同時將值同步到對應的頂級欄位 ID key
        const correspondingId = labelToIdMap[key];
        if (correspondingId) {
          dataPayload[correspondingId] = plainValue;
        }
      }
    });

    // 反向同步：確保 ID key 的值也更新到對應的 label key
    Object.entries(dataPayload).forEach(([id, value]) => {
      const label = idToLabelMap[id];
      if (label && !(label in readablePayload)) {
        readablePayload[label] = value;
      }
    });

    // 後處理：radio 欄位選擇帶有子欄位的選項時（如「其他」），
    // 若子欄位與父欄位同名，readableSnapshot 應使用子欄位的輸入值而非選項值
    // 例：行業別選「其他」→ 子欄位「行業別」輸入「保險業」→ Sheet 應顯示「保險業」
    const formFields = props.form?.fields || [];
    formFields.forEach((field: any) => {
      if (field.type !== 'radio' || !field.options) return;
      const selectedValue = readablePayload[field.label];
      if (!selectedValue) return;

      const selectedOption = field.options.find((opt: any) => opt.value === selectedValue);
      if (!selectedOption?.subFields?.length) return;

      for (const subField of selectedOption.subFields) {
        if (subField.label === field.label && dataPayload[subField.id]) {
          // 子欄位與父欄位同名，用子欄位的實際輸入值取代「其他」
          readablePayload[field.label] = dataPayload[subField.id];
          break;
        }
      }
    });

    console.log('✅ 保存數據 - data:', dataPayload);
    console.log('✅ 保存數據 - readableSnapshot:', readablePayload);

    const docRef = doc(db, 'customFormSubmissions', item._id);
    await updateDoc(docRef, {
      data: dataPayload,
      readableSnapshot: readablePayload,
      snapshotAvailable: true,
      updatedAt: new Date()
    });

    // 保存成功後，清除編輯狀態並收合該行
    const newData = { ...editingData.value };
    delete newData[item._id];
    editingData.value = newData;
    expandedRows.value = [];

    toast.success('回覆已更新');

    // 重新從 Firestore 載入最新資料以刷新表格
    await loadResponses();
  } catch (err) {
    console.error('❌ 更新回覆失敗:', err);
    console.error('錯誤詳情:', (err as any).message);

    if ((err as any).code === 'permission-denied') {
      toast.error('沒有更新權限 - 請檢查 Firestore 安全規則');
    } else if ((err as any).code === 'not-found') {
      toast.error('文檔不存在');
    } else {
      toast.error(`更新失敗: ${(err as any).message}`);
    }
  } finally {
    savingId.value = null;
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

// --- 從表單定義提取所有欄位 ID（含遞迴子欄位 ID）---
const extractAllFieldIds = (fields: any[]): string[] => {
  const ids: string[] = [];
  if (!fields) return ids;
  fields.forEach(f => {
    // 排除純顯示欄位
    if (['header', 'description', 'divider', 'link'].includes(f.type)) return;
    if (f.id) ids.push(f.id);
    // 遞迴提取子欄位 ID
    if (f.options) {
      f.options.forEach((opt: any) => {
        if (opt.subFields) {
          ids.push(...extractAllFieldIds(opt.subFields));
        }
      });
    }
  });
  return ids;
};

// --- 建立 ID 到 Label 的映射（用於從原始數據查找標籤值）---
const buildIdToLabelMap = (fields: any[]): Record<string, string> => {
  const map: Record<string, string> = {};
  if (!fields) return map;

  fields.forEach(f => {
    // 排除純顯示欄位
    if (['header', 'description', 'divider', 'link'].includes(f.type)) return;
    if (f.id && f.label) {
      map[f.id] = f.label;
    }
    // 遞迴處理子欄位
    if (f.options) {
      f.options.forEach((opt: any) => {
        if (opt.subFields) {
          Object.assign(map, buildIdToLabelMap(opt.subFields));
        }
      });
    }
  });

  return map;
};

// --- 提取頂級字段的 ID（不包括子字段）---
const extractTopLevelFieldIds = (fields: any[]): string[] => {
  const ids: string[] = [];
  if (!fields) return ids;
  fields.forEach(f => {
    // 排除純顯示欄位
    if (['header', 'description', 'divider', 'link'].includes(f.type)) return;
    if (f.id) {
      ids.push(f.id);  // 只添加頂級字段的 ID，不遞迴
    }
  });
  return ids;
};

// --- 動態欄位（依照表單定義順序）---
const dynamicColumns = computed(() => {
  // 從表單定義取得有序欄位標籤
  const orderedLabels = extractFieldLabels(props.form?.fields || []);

  // 取得所有 ID keys（用於排除）
  const allFieldIds = new Set(extractAllFieldIds(props.form?.fields || []));

  // 收集所有回覆中實際存在的 key（排除 ID keys）
  const existingKeys = new Set<string>();
  responses.value.forEach(r => {
    Object.keys(r).forEach(k => {
      // 跳過系統欄位（_開頭）和 ID keys
      if (!k.startsWith('_') && !allFieldIds.has(k)) {
        existingKeys.add(k);
      }
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

  // 補上殘餘（例如舊版欄位，但排除 ID keys）
  existingKeys.forEach(k => {
    if (!allFieldIds.has(k)) {
      result.push(k);
    }
  });

  return result;
});

// --- 表格 Headers ---
const tableHeaders = computed(() => {
  const headers: any[] = [
    { title: '', key: 'data-table-expand' },
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
    width: showDeleted.value ? '140px' : '90px',
    align: 'center',
  });

  return headers;
});

// --- 搜尋過濾 ---
const filteredResponses = computed(() => {
  let list = responses.value.filter(r => !!r._isDeleted === showDeleted.value);
  if (!searchText.value) return list;
  const keyword = searchText.value.toLowerCase();
  return list.filter(r => {
    return Object.entries(r).some(([k, v]) => {
      if (k.startsWith('_')) return false;
      return String(v ?? '').toLowerCase().includes(keyword);
    }) || String(r._unitId ?? '').toLowerCase().includes(keyword);
  });
});

// --- 刪除與還原 ---
const softDeleteResponse = async (item: any) => {
  if (!confirm('確定要將這筆紀錄移至垃圾桶嗎？')) return;
  try {
    await updateDoc(doc(db, 'customFormSubmissions', item._id), { isDeleted: true });
    item._isDeleted = true;
    toast.success('已移至刪除紀錄');
  } catch (err) {
    console.error(err);
    toast.error('刪除失敗');
  }
};

const hardDeleteResponse = async (item: any) => {
  if (!confirm('此操作會將資料從資料庫永久刪除，確定要繼續嗎？')) return;
  try {
    await deleteDoc(doc(db, 'customFormSubmissions', item._id));
    responses.value = responses.value.filter((r: any) => r._id !== item._id);
    toast.success('已永久刪除');
  } catch (err) {
    console.error(err);
    toast.error('永久刪除失敗');
  }
};

const restoreResponse = async (item: any) => {
  try {
    await updateDoc(doc(db, 'customFormSubmissions', item._id), { isDeleted: false });
    item._isDeleted = false;
    toast.success('已還原紀錄');
  } catch (err) {
    console.error(err);
    toast.error('還原失敗');
  }
};

// --- 行展開控制 ---
const onRowClick = (event: any, { item }: any) => {
  const itemId = item._id;
  const idx = expandedRows.value.indexOf(itemId);
  if (idx === -1) {
    // 展開該行
    expandedRows.value = [itemId];
    // 自動初始化編輯數據
    if (!editingData.value[itemId]) {
      editingData.value = {
        ...editingData.value,
        [itemId]: { ...getResponseFields(item) }
      };
    }
  } else {
    // 摺疊該行，取消編輯
    expandedRows.value = [];
    const newData = { ...editingData.value };
    delete newData[itemId];
    editingData.value = newData;
  }
};

const getResponseFields = (item: any): Record<string, any> => {
  const fields: Record<string, any> = {};
  const idToLabelMap = buildIdToLabelMap(props.form?.fields || []);

  // 第一步：優先複製所有子欄位值（以 ID 為 key）
  const allFieldIds = extractAllFieldIds(props.form?.fields || []);
  allFieldIds.forEach(id => {
    if (item[id] !== undefined) {
      fields[id] = item[id];  // 保留 ID key 的值供子字段使用
    }
  });

  // 第二步：複製動態欄位（以 label 為 key），用於頂級字段的 model-value
  dynamicColumns.value.forEach(col => {
    fields[col] = item[col] ?? '';
  });

  // 第三步：確保頂級字段的值優先級最高，不被子字段覆蓋
  const topLevelIds = extractTopLevelFieldIds(props.form?.fields || []);
  topLevelIds.forEach(id => {
    const label = idToLabelMap[id];
    if (label && item[id] !== undefined) {
      fields[label] = item[id];  // 頂級字段的值覆蓋任何同名的子字段值
    }
  });

  return fields;
};


// --- 格式化表格儲存格值 ---
const formatCellValue = (value: any): string => {
  if (value === null || value === undefined) return '';

  // 如果是物件（address 類型），格式化為可讀的地址字符串
  if (typeof value === 'object' && !Array.isArray(value)) {
    // address 物件格式：{ city, district, detail }
    if ('city' in value || 'district' in value || 'detail' in value) {
      const city = value.city || '';
      const district = value.district || '';
      const detail = value.detail || '';
      return `${city}${district}${detail}`.trim() || '（未填）';
    }
    // 其他物件，轉為 JSON 字符串
    return JSON.stringify(value);
  }

  // 基本類型直接轉字符串
  return String(value);
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
    // 只取出 label-based 的欄位（排除 UUID 亂數欄位）
    const allFieldIds = new Set(extractAllFieldIds(props.form?.fields || []));
    const columns = dynamicColumns.value.filter(c => !allFieldIds.has(c));

    // 表頭
    const headerRow = ['戶別', '提交時間', ...columns.filter(c => c !== '戶別')];

    // 資料列
    const dataRows = responses.value.map(r => {
      return [
        r._unitId || '',
        formatTimestamp(r._submittedAt),
        ...columns.filter(c => c !== '戶別').map(c => {
          const val = r[c];
          // 格式化地址物件
          if (typeof val === 'object' && val !== null && ('city' in val || 'district' in val || 'detail' in val)) {
            const { city = '', district = '', detail = '' } = val;
            return `${city}${district}${detail}`.trim();
          }
          return val ?? '';
        }),
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
const exportSingleExcel = (item: any) => {
  exporting.value = true;
  try {
    const r = item;

    // 只取出 label-based 的欄位（排除 UUID 亂數欄位）
    const allFieldIds = new Set(extractAllFieldIds(props.form?.fields || []));
    let fieldLabels = extractFieldLabels(props.form?.fields || []);

    // 去重：保持順序，但去掉重複的欄位名稱
    fieldLabels = Array.from(new Set(fieldLabels));

    // 橫向格式：欄位標籤作為表頭
    const headerRow = ['戶別', '提交時間', ...fieldLabels.filter(l => l !== '戶別')];

    // 資料列
    const dataRow = [
      r._unitId || '',
      formatTimestamp(r._submittedAt),
      ...fieldLabels.filter(l => l !== '戶別').map(label => {
        const val = r[label];
        // 格式化地址物件
        if (typeof val === 'object' && val !== null && ('city' in val || 'district' in val || 'detail' in val)) {
          const { city = '', district = '', detail = '' } = val;
          return `${city}${district}${detail}`.trim();
        }
        return val ?? '';
      }),
    ];

    const rows = [headerRow, dataRow];
    const ws = XLSX.utils.aoa_to_sheet(rows);

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
        String(dataRow[i] ?? '').length
      );
      return { wch: Math.min(Math.max(maxLen + 2, 10), 40) };
    });

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

.border-t {
  border-top: 1px solid #e0e0e0;
}

.compact-form-layout {
  max-width: 100%;
}

/* 緊湊表單布局 - 優化 16:9 屏幕 */
.compact-form-layout :deep(.v-text-field),
.compact-form-layout :deep(.v-textarea),
.compact-form-layout :deep(.v-select),
.compact-form-layout :deep(.v-autocomplete),
.compact-form-layout :deep(.v-radio-group),
.compact-form-layout :deep(.v-checkbox) {
  margin-bottom: 4px;
}

.compact-form-layout :deep(.v-field__outline) {
  border-radius: 4px;
}

.compact-form-layout :deep(.v-input__control) {
  min-height: auto;
}

.compact-form-layout :deep(.dynamic-field-render-item) {
  padding-top: 0 !important;
  padding-bottom: 0 !important;
}

.compact-form-layout :deep(.v-input--density-compact) {
  --v-input-control-height: 36px;
}

/* 按鈕縮小 */
.compact-form-layout :deep(.v-btn) {
  font-size: 0.875rem;
  padding: 4px 12px;
}

/* 標題縮小 */
.compact-form-layout h4 {
  margin-bottom: 8px;
  font-size: 0.95rem;
}

/* 行間距優化 */
.compact-form-layout :deep(.v-row) {
  --v-row-gutter: 8px;
}

.compact-form-layout :deep(.v-col) {
  padding-top: 2px;
  padding-bottom: 2px;
}

/* 欄位類的緊湊設置 */
.compact-field :deep(.v-text-field),
.compact-field :deep(.v-textarea),
.compact-field :deep(.v-select),
.compact-field :deep(.v-autocomplete) {
  --v-input-control-height: 36px;
  margin-bottom: 0;
}

.compact-field :deep(.v-input__details) {
  display: none;
}

.compact-field :deep(.v-field__label) {
  font-size: 0.875rem;
}

/* Address 字段內部也改為單列 */
.compact-field :deep(.v-row) {
  --v-row-gutter: 4px !important;
}

.compact-field :deep(.v-col) {
  width: 100% !important;
  flex-basis: 100% !important;
  max-width: 100% !important;
}

/* 地址欄位保持正常高度 */
.compact-form-layout :deep(.pa-4.bg-grey-lighten-5.rounded-lg.border-thin) {
  padding: 12px 8px !important;
}

/* 新緊湊布局 */
.expanded-form-wrapper {
  padding: 12px;
  background: linear-gradient(135deg, #f5f5f5 0%, #fafafa 100%);
  max-width: 100%;
  margin: 0 auto;
}

.form-grid {
  display: grid;
  gap: 16px;
  margin-bottom: 12px;
  grid-template-columns: 1fr;
}

.field-wrapper {
  min-width: 0;
}

.field-wrapper.full-width {
  grid-column: 1 / -1;
}

/* 區段標題 */
.section-header {
  grid-column: 1 / -1;
  display: flex;
  align-items: center;
  font-size: 0.875rem;
  font-weight: 600;
  color: #1976d2;
  padding: 8px 0;
  margin-top: 6px;
  margin-bottom: 4px;
  border-bottom: 2px solid rgba(25, 118, 210, 0.2);
}

.section-description {
  grid-column: 1 / -1;
  font-size: 0.8125rem;
  color: #555;
  background: #fff;
  padding: 8px;
  border-radius: 4px;
  margin-bottom: 4px;
  line-height: 1.4;
}

.section-divider {
  grid-column: 1 / -1;
  height: 1px;
  background: rgba(0, 0, 0, 0.12);
  margin: 6px 0;
}

/* 操作按鈕欄 */
.form-actions {
  display: flex;
  gap: 4px;
  padding: 8px 0;
  border-top: 1px solid rgba(0, 0, 0, 0.12);
  justify-content: flex-start;
  align-items: center;
}

.action-btn {
  font-size: 0.75rem;
  padding: 4px 8px !important;
  min-width: 60px;
}

/* 緊湊輸入框 */
.compact-form-layout :deep(.v-text-field),
.compact-form-layout :deep(.v-textarea),
.compact-form-layout :deep(.v-select),
.compact-form-layout :deep(.v-autocomplete),
.compact-form-layout :deep(.v-radio-group),
.compact-form-layout :deep(.v-checkbox) {
  margin-bottom: 0;
}

.compact-form-layout :deep(.v-input__control) {
  min-height: 32px;
}

.compact-form-layout :deep(.v-field__input) {
  padding-top: 4px !important;
  padding-bottom: 4px !important;
  font-size: 0.8125rem;
}

.compact-form-layout :deep(.v-field__label) {
  font-size: 0.75rem;
  top: 6px;
}

.compact-field :deep(.v-input__details) {
  display: none;
}

/* 響應式設計 */
@media (max-width: 600px) {
  .expanded-form-wrapper {
    padding: 8px;
  }

  .form-actions {
    flex-wrap: wrap;
    gap: 6px;
  }

  .action-btn {
    flex: 1;
    min-width: 45px;
  }

  .form-grid {
    gap: 6px;
  }
}

@media (min-width: 600px) {
  .expanded-form-wrapper {
    max-width: 800px;
    margin: 0 auto;
  }
}
</style>
