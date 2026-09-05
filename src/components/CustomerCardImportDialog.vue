<template>
  <v-dialog :model-value="show" @update:model-value="v => $emit('update:show', v)" max-width="820" scrollable>
    <v-card>
      <v-card-title class="bg-primary text-white d-flex align-center">
        <v-icon start>mdi-card-account-details-outline</v-icon>
        <span>從客戶資料卡導入{{ step === 2 ? '：確認欄位' : '' }}</span>
        <v-spacer></v-spacer>
        <v-btn icon="mdi-close" variant="text" size="small" @click="close"></v-btn>
      </v-card-title>

      <v-card-text class="pa-4" style="max-height: 70vh;">
        <!-- 載入中 -->
        <div v-if="loading" class="text-center pa-10">
          <v-progress-circular indeterminate color="primary"></v-progress-circular>
          <div class="text-caption text-grey mt-3">查詢客戶資料卡紀錄中...</div>
        </div>

        <!-- 步驟一：選擇紀錄 -->
        <template v-else-if="step === 1">
          <v-alert v-if="loadError" type="error" variant="tonal" class="mb-3">{{ loadError }}</v-alert>

          <v-alert v-if="!loadError && records.length === 0" type="info" variant="tonal">
            戶別 {{ unitId }} 目前沒有客戶資料卡填寫紀錄。<br>
            <span class="text-caption">系統會搜尋表單名稱含「客戶資料卡／客資卡／客戶資料」或已標記為客戶資料卡的自訂表單。</span>
          </v-alert>

          <template v-if="records.length > 0">
            <p class="text-body-2 text-grey-darken-1 mb-3">
              戶別 <strong>{{ unitId }}</strong> 共 {{ records.length }} 筆客戶資料卡紀錄，勾選要導入的資料（可多選）。
            </p>

            <v-card
              v-for="rec in records"
              :key="rec.id"
              variant="outlined"
              class="mb-2"
              :class="{ 'record-selected': isSelected(rec.id) }"
            >
              <div class="d-flex align-center pa-3">
                <v-checkbox-btn
                  :model-value="isSelected(rec.id)"
                  color="primary"
                  @update:model-value="v => toggleSelect(rec.id, !!v)"
                ></v-checkbox-btn>
                <div class="flex-grow-1 ml-1">
                  <div class="d-flex align-center flex-wrap" style="gap: 6px;">
                    <span class="font-weight-bold">{{ rec.displayName }}</span>
                    <v-chip v-if="isAlreadyImported(rec.id)" size="x-small" color="info" variant="tonal">已導入過（將更新）</v-chip>
                    <v-chip
                      v-if="selectedIds.length >= 2 && isSelected(rec.id)"
                      size="x-small"
                      :color="primaryId === rec.id ? 'primary' : 'grey'"
                      :variant="primaryId === rec.id ? 'flat' : 'outlined'"
                      class="cursor-pointer"
                      @click.stop="primaryId = rec.id"
                    >
                      {{ primaryId === rec.id ? '主買方' : '設為主買方' }}
                    </v-chip>
                  </div>
                  <div class="text-caption text-grey-darken-1">
                    {{ rec.formTitle }} ・ {{ rec.submittedAtText }}
                    <span v-if="rec.buyer.phone"> ・ {{ rec.buyer.phone }}</span>
                  </div>
                </div>
              </div>
            </v-card>

            <v-alert v-if="selectedIds.length >= 2" type="info" variant="tonal" density="compact" class="mt-3">
              已選 {{ selectedIds.length }} 筆：「主買方」帶入買方資訊欄位，其餘 {{ selectedIds.length - 1 }} 筆將加入「共同買方」。
            </v-alert>
          </template>
        </template>

        <!-- 步驟二：逐欄確認 -->
        <template v-else>
          <div class="text-subtitle-2 font-weight-bold mb-2 d-flex align-center">
            <v-icon size="small" color="primary" class="mr-1">mdi-account</v-icon>
            主買方：{{ primaryRecord?.displayName }}
            <span class="text-caption text-grey ml-2">勾選要覆蓋的欄位</span>
          </div>

          <v-table density="compact" class="mb-4 compare-table">
            <thead>
              <tr>
                <th style="width: 44px;"></th>
                <th style="width: 110px;">欄位</th>
                <th>目前值</th>
                <th style="width: 24px;"></th>
                <th>導入值</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="row in primaryRows" :key="row.key" :class="{ 'row-disabled': !row.selectable }">
                <td>
                  <v-checkbox-btn v-model="row.checked" :disabled="!row.selectable" color="primary" density="compact"></v-checkbox-btn>
                </td>
                <td class="font-weight-medium">{{ row.label }}</td>
                <td class="text-grey-darken-1">{{ row.currentText || '（空）' }}</td>
                <td><v-icon size="x-small" color="grey">mdi-arrow-right</v-icon></td>
                <td>
                  <span v-if="row.incomingText">{{ row.incomingText }}</span>
                  <span v-else class="text-grey">（來源未填）</span>
                  <div v-if="row.note" class="text-caption" :class="row.noteColor">{{ row.note }}</div>
                </td>
              </tr>
            </tbody>
          </v-table>

          <template v-if="coBuyerItems.length > 0">
            <div class="text-subtitle-2 font-weight-bold mb-2 d-flex align-center">
              <v-icon size="small" color="indigo" class="mr-1">mdi-account-multiple-outline</v-icon>
              共同買方（{{ coBuyerItems.filter(i => i.include).length }} / {{ coBuyerItems.length }} 筆將加入）
            </div>
            <v-card v-for="item in coBuyerItems" :key="item.rec.id" variant="outlined" class="mb-2">
              <div class="d-flex pa-3">
                <v-checkbox-btn v-model="item.include" color="indigo" class="flex-grow-0 align-self-start"></v-checkbox-btn>
                <div class="flex-grow-1 ml-1">
                  <div class="d-flex align-center flex-wrap" style="gap: 6px;">
                    <span class="font-weight-bold">{{ item.rec.buyer.name || item.rec.displayName }}</span>
                    <v-chip v-if="isAlreadyImported(item.rec.id)" size="x-small" color="info" variant="tonal">更新既有共同買方</v-chip>
                  </div>
                  <div class="text-caption text-grey-darken-1">
                    <div v-if="item.rec.buyer.phone">電話：{{ item.rec.buyer.phone }}</div>
                    <div v-if="item.rec.buyer.idNumber">身分證：{{ item.rec.buyer.idNumber }}</div>
                    <div v-if="item.rec.buyer.email">EMAIL：{{ item.rec.buyer.email }}</div>
                    <div v-if="item.rec.buyer.dateOfBirth">生日：{{ formatRocDateText(item.rec.buyer.dateOfBirth) }}</div>
                    <div v-if="item.rec.buyer.mailingAddress && formatAddressText(item.rec.buyer.mailingAddress)">
                      地址：{{ formatAddressText(item.rec.buyer.mailingAddress) }}
                    </div>
                    <div v-if="item.rec.buyer.unparsed.dateOfBirth" class="text-warning">
                      生日無法解析：{{ item.rec.buyer.unparsed.dateOfBirth }}（略過此欄）
                    </div>
                  </div>
                </div>
              </div>
            </v-card>
          </template>

          <v-alert type="info" variant="tonal" density="compact" class="mt-2">
            套用後回到編輯畫面，仍需按「儲存變更」才會寫入資料庫。
          </v-alert>
        </template>
      </v-card-text>

      <v-divider></v-divider>
      <v-card-actions>
        <v-btn v-if="step === 2" variant="text" prepend-icon="mdi-arrow-left" @click="step = 1">上一步</v-btn>
        <v-spacer></v-spacer>
        <v-btn color="grey" variant="text" @click="close">取消</v-btn>
        <v-btn v-if="step === 1" color="primary" variant="flat" :disabled="selectedIds.length === 0" @click="goToConfirm">
          下一步 ({{ selectedIds.length }})
        </v-btn>
        <v-btn v-else color="primary" variant="flat" :disabled="!hasAnythingToApply" @click="apply">套用</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
// 從客戶資料卡（自訂表單填寫紀錄）導入買方資料到銷控編輯畫面
// 步驟一：列出該戶別的客資卡紀錄（可多選、指定主買方）
// 步驟二：主買方逐欄「目前值 vs 導入值」勾選覆蓋；其餘筆以整筆勾選加入共同買方
// 套用只 emit 給父層改前端 editableData，不直接寫資料庫
import { ref, computed, watch } from 'vue';
import { loadUnitCustomerCardSubmissions, formatTaiwanTime } from '@/utils/customerCardSubmissions';
import {
  extractBuyerFromSubmission,
  buildCoBuyer,
  formatRocDateText,
  formatAddressText,
} from '@/utils/customerCardImport';

const props = defineProps({
  show: { type: Boolean, default: false },
  projectId: { type: String, required: true },
  unitId: { type: String, default: '' },
  currentData: { type: Object, default: () => ({}) },
  existingCoBuyers: { type: Array, default: () => [] },
});

const emit = defineEmits(['update:show', 'apply']);

const loading = ref(false);
const loadError = ref('');
const step = ref(1);
const records = ref([]);
const selectedIds = ref([]);
const primaryId = ref(null);
const primaryRows = ref([]);
const coBuyerItems = ref([]);

const primaryRecord = computed(() => records.value.find(r => r.id === primaryId.value) || null);

const hasAnythingToApply = computed(() =>
  primaryRows.value.some(r => r.checked && r.selectable) ||
  coBuyerItems.value.some(i => i.include)
);

watch(() => props.show, (visible) => {
  if (visible) {
    step.value = 1;
    selectedIds.value = [];
    primaryId.value = null;
    primaryRows.value = [];
    coBuyerItems.value = [];
    loadRecords();
  }
}, { immediate: true }); // 父層可能以 v-if 掛載（開啟時才建立），首次掛載也要載入

function close() {
  emit('update:show', false);
}

function isSelected(id) {
  return selectedIds.value.includes(id);
}

function toggleSelect(id, checked) {
  const idx = selectedIds.value.indexOf(id);
  if (checked && idx === -1) selectedIds.value.push(id);
  else if (!checked && idx !== -1) selectedIds.value.splice(idx, 1);
  // 主買方預設：勾選中「填寫時間最早」的一筆；被取消勾選時重算
  if (!selectedIds.value.includes(primaryId.value)) primaryId.value = null;
  if (!primaryId.value && selectedIds.value.length > 0) {
    const selectedRecs = records.value.filter(r => selectedIds.value.includes(r.id));
    primaryId.value = selectedRecs[0]?.id || null; // records 已依填寫時間排序
  }
}

function isAlreadyImported(submissionId) {
  return (props.existingCoBuyers || []).some(cb => cb.sourceSubmissionId && cb.sourceSubmissionId === submissionId);
}


async function loadRecords() {
  loading.value = true;
  loadError.value = '';
  records.value = [];
  try {
    if (!props.unitId) {
      loadError.value = '此戶別缺少戶別編號，無法查詢客戶資料卡。';
      return;
    }
    // 共用查詢：此建案的客資卡表單 × 此戶別的填寫紀錄（已排除刪除、依填寫時間由早到晚）
    const list = await loadUnitCustomerCardSubmissions(props.projectId, props.unitId);
    records.value = list.map(({ id, form, data }) => {
      const buyer = extractBuyerFromSubmission(form, data);
      return {
        id,
        formTitle: form.title || '未命名表單',
        buyer,
        submittedAt: data.submittedAt || null,
        submittedAtText: formatTaiwanTime(data.submittedAt) + (data.lastModifiedAt ? `（修改於 ${formatTaiwanTime(data.lastModifiedAt)}）` : ''),
        displayName: buyer.name || data.submitterLineName || '未填姓名',
      };
    });
  } catch (err) {
    console.error('載入客戶資料卡紀錄失敗:', err);
    loadError.value = '載入客戶資料卡紀錄失敗，請稍後再試。';
  } finally {
    loading.value = false;
  }
}

// 建立步驟二的逐欄比較列
function goToConfirm() {
  const rec = records.value.find(r => r.id === primaryId.value) || records.value.find(r => selectedIds.value.includes(r.id));
  if (!rec) return;
  primaryId.value = rec.id;
  const cur = props.currentData || {};
  const buyer = rec.buyer;

  const currentAddressText = `${cur.buyerMailingAddressCity || ''}${cur.buyerMailingAddressDistrict || ''}${cur.buyerMailingAddressDetail || ''}`;
  const currentDobText = formatRocDateText(cur.buyerDateOfBirth);

  const rows = [
    {
      key: 'name', fieldKey: 'buyerName', label: '買方姓名',
      currentText: cur.buyerName || '', incomingText: buyer.name, incomingValue: buyer.name,
    },
    {
      key: 'phone', fieldKey: 'buyerPhone', label: '聯絡電話',
      currentText: cur.buyerPhone || '', incomingText: buyer.phone, incomingValue: buyer.phone,
    },
    {
      key: 'idNumber', fieldKey: 'buyerIdNumber', label: '身分證字號',
      currentText: cur.buyerIdNumber || '', incomingText: buyer.idNumber, incomingValue: buyer.idNumber,
    },
    {
      key: 'email', fieldKey: 'buyerEmail', label: 'EMAIL',
      currentText: cur.buyerEmail || '', incomingText: buyer.email, incomingValue: buyer.email,
    },
    {
      key: 'dateOfBirth', fieldKey: 'buyerDateOfBirth', label: '出生年月日',
      currentText: currentDobText,
      incomingText: buyer.dateOfBirth ? formatRocDateText(buyer.dateOfBirth) : (buyer.unparsed.dateOfBirth || ''),
      incomingValue: buyer.dateOfBirth,
      unparsed: !!buyer.unparsed.dateOfBirth,
    },
    {
      key: 'mailingAddress', label: '通訊地址',
      currentText: currentAddressText,
      incomingText: buyer.mailingAddress ? formatAddressText(buyer.mailingAddress) : (buyer.unparsed.mailingAddress || ''),
      incomingValue: buyer.mailingAddress,
      unparsed: !!buyer.unparsed.mailingAddress,
    },
  ];

  primaryRows.value = rows.map(row => {
    const hasIncoming = row.unparsed ? false : !!(row.incomingText && String(row.incomingText).trim());
    const isSame = hasIncoming && String(row.currentText).trim() === String(row.incomingText).trim();
    let note = '';
    let noteColor = '';
    if (row.unparsed) { note = '無法解析，略過此欄'; noteColor = 'text-warning'; }
    else if (!hasIncoming) { /* 來源未填，模板已顯示 */ }
    else if (isSame) { note = '與現值相同'; noteColor = 'text-grey'; }
    return {
      ...row,
      selectable: hasIncoming && !isSame,
      checked: hasIncoming && !isSame, // 預設：導入值非空且與現值不同 → 勾選
      note,
      noteColor,
    };
  });

  coBuyerItems.value = records.value
    .filter(r => selectedIds.value.includes(r.id) && r.id !== primaryId.value)
    .map(rec => ({ rec, include: true }));

  step.value = 2;
}

function apply() {
  const primaryValues = {};
  for (const row of primaryRows.value) {
    if (!row.checked || !row.selectable) continue;
    if (row.key === 'mailingAddress') primaryValues.mailingAddress = row.incomingValue;
    else primaryValues[row.fieldKey] = row.incomingValue;
  }
  const coBuyers = coBuyerItems.value
    .filter(i => i.include)
    .map(i => buildCoBuyer(i.rec.buyer, i.rec.id));

  emit('apply', { primaryValues, coBuyers });
  close();
}
</script>

<style scoped>
.record-selected {
  border-color: rgb(var(--v-theme-primary)) !important;
  background-color: rgba(var(--v-theme-primary), 0.04);
}
.compare-table th {
  font-size: 0.8rem;
  color: #555;
}
.compare-table td {
  font-size: 0.9rem;
  word-break: break-all;
}
.row-disabled td {
  opacity: 0.6;
}
.cursor-pointer {
  cursor: pointer;
}
</style>
