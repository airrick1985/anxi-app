<template>
  <v-container>
    <v-card class="mx-auto">
      <v-toolbar color="#004383" dark>
        <v-toolbar-title>
          <v-icon left>mdi-calendar-star</v-icon>
          訂閱管理
        </v-toolbar-title>
        <v-spacer></v-spacer>
        <v-btn color="white" @click="openEditDialog()">
          <v-icon left>mdi-plus</v-icon>
          新增訂閱
        </v-btn>
      </v-toolbar>
      <v-card-title>
        <v-text-field
          v-model="search"
          label="搜尋建案、系統或聯絡人..."
          prepend-inner-icon="mdi-magnify"
          variant="outlined"
          dense
          hide-details
          clearable
        ></v-text-field>
      </v-card-title>

<v-data-table
        :headers="headers"
        :items="subscriptions"
        :search="search"
        :loading="loading"
        class="elevation-1"
        items-per-page-text="每頁顯示："
        :page-text="`第 {0} - {1} 筆，共 {2} 筆`"
      >
        <template v-slot:item.status="{ item }">
          <v-chip :color="item.color" size="small" label>{{ item.status }}</v-chip>
        </template>
        
         <template v-slot:item.currentUserLimit="{ item }">
          <v-chip v-if="typeof item.currentUserLimit === 'number'" color="primary" size="small" label>
            <v-icon start>mdi-account-group</v-icon>
            {{ item.currentUserLimit }} 人
          </v-chip>
          <span v-else class="text-grey">{{ item.currentUserLimit }}</span>
        </template>

        <template v-slot:item.durationDays="{ item }">
          <v-chip v-if="typeof item.durationDays === 'number'" color="blue-grey" size="small" label>
            {{ item.durationDays }} 天
          </v-chip>
          <span v-else class="text-grey">{{ item.durationDays }}</span>
        </template>
        
        <template v-slot:item.paymentRecords="{ item }">
          <v-chip
            v-if="paymentSummary(item)"
            :color="paymentSummary(item).color"
            size="small"
            label
            style="cursor: pointer;"
            @click="openEditDialog(item)"
          >
            {{ paymentSummary(item).text }}
          </v-chip>
          <span v-else class="text-grey">—</span>
        </template>

        <template v-slot:item.attachments="{ item }">
          <div class="d-flex align-center">
            <template v-for="(att, i) in (item.attachments || []).slice(0, 3)" :key="i">
              <v-avatar
                v-if="isImageAttachment(att)"
                size="32"
                rounded
                class="me-1 attachment-thumb"
                style="cursor: pointer; border: 1px solid #e0e0e0;"
                @click="openPreview(att)"
              >
                <v-img :src="att.url" cover></v-img>
              </v-avatar>
              <v-icon
                v-else
                color="red-darken-2"
                size="32"
                class="me-1"
                style="cursor: pointer;"
                @click="openPreview(att)"
              >mdi-file-pdf-box</v-icon>
            </template>
            <span v-if="(item.attachments || []).length > 3" class="text-caption text-grey">
              +{{ item.attachments.length - 3 }}
            </span>
            <span v-if="!item.attachments || item.attachments.length === 0" class="text-grey">—</span>
          </div>
        </template>

        <template v-slot:item.actions="{ item }">
          <v-icon class="me-2" @click="openEditDialog(item)">mdi-pencil</v-icon>
          <v-icon color="error" @click="openDeleteDialog(item)">mdi-delete</v-icon>
        </template>
        <template v-slot:no-data>
          <div class="pa-4 text-center">
            <p>目前沒有任何訂閱紀錄</p>
          </div>
        </template>
      </v-data-table>
    </v-card>

   <v-dialog v-model="dialog" persistent max-width="1200px">
      <v-card>
        <v-card-title class="bg-blue-darken-4 text-white d-flex align-center">
          <span class="text-h5">{{ isEditing ? '編輯訂閱' : '新增訂閱' }}</span>
          <v-spacer></v-spacer>
          <v-btn icon="mdi-close" variant="text" @click="closeDialog"></v-btn>
        </v-card-title>
        <v-card-text>
          <v-container>
            <v-row>
              <v-col cols="12" sm="6">
             <v-combobox
                  v-model="editedItem.projectName"
                  :items="masterData.projectNames"
                  label="建案名稱*"
                  :rules="rules.required"
                  hint="可從選單選取或手動輸入新名稱"
                  persistent-hint
                ></v-combobox>
              </v-col>

               <v-col cols="12" sm="6">
                <v-text-field
                  v-model="editedItem.projectId"
                  label="建案 ID*"
                  :rules="!isProjectIdDisabled ? rules.projectId : []"
                  :disabled="isProjectIdDisabled"
                  :hint="isProjectIdDisabled ? '系統已有ID，不可任意修改' : '請為新專案設定一個唯一ID，英文及數字組合'"
                  persistent-hint
                ></v-text-field>
              </v-col>

              <v-col cols="12">
                <v-file-input
                  v-model="fileToUpload"
                  label="建案圖示 (上傳新圖檔將覆蓋舊檔)"
                  accept="image/png, image/jpeg, image/gif"
                  prepend-icon="mdi-image-area"
                  variant="outlined"
                  density="compact"
                  clearable
                ></v-file-input>
                <v-img
                  v-if="iconPreviewUrl"
                  :src="iconPreviewUrl"
                  height="100"
                  contain
                  class="mt-2"
                  style="border: 1px solid #e0e0e0; border-radius: 4px;"
                ></v-img>
                <div v-else class="text-center text-grey-darken-1 pa-4" style="border: 2px dashed #ccc; border-radius: 8px;">
                  尚無建案圖示
                </div>
              </v-col>
              <v-col cols="12">
                <v-divider class="my-3"></v-divider>
              </v-col>

              <v-col cols="12" sm="6">
                <v-select
                  v-model="editedItem.systemFunction"
                  :items="masterData.systemFunctions"
                  label="系統功能*"
                  :rules="rules.requiredArray"
                  multiple
                  chips
                  closable-chips
                  :disabled="isEditing"
                  :hint="isEditing ? '編輯模式下無法修改系統功能' : ''"
                  :persistent-hint="isEditing"
                ></v-select>
              </v-col>
              <v-col cols="12" sm="6"><v-text-field v-model="editedItem.contactName" label="聯絡人"></v-text-field></v-col>
              <v-col cols="12" sm="6"><v-text-field v-model="editedItem.contactPhone" label="聯絡人手機"></v-text-field></v-col>
              <v-col cols="12">
                              <v-text-field 
                                v-model="editedItem.contactEmail" 
                                label="聯絡人Email"
                                :rules="rules.email"
                              ></v-text-field>
                            </v-col>
              <v-col cols="12" sm="6">
                <v-select
                  v-model="subscriptionTypeSelection"
                  :items="['月繳', '年繳', '季繳', '試用', '其他']"
                  label="訂閱類型"
                ></v-select>
                <v-text-field
                  v-if="subscriptionTypeSelection === '其他'"
                  v-model="otherSubscriptionType"
                  label="請輸入其他類型"
                  class="mt-2"
                  variant="outlined"
                  dense
                ></v-text-field>
              </v-col>
              
              <v-col cols="12" sm="6"><v-text-field v-model="editedItem.paymentAmount" label="繳費金額" type="number"></v-text-field></v-col>
              <v-col cols="12" sm="4"><v-text-field v-model="editedItem.paymentDate" label="繳費日期" type="date"></v-text-field></v-col>
              <v-col cols="12" sm="4"><v-text-field v-model="editedItem.startDate" label="啟用日期*" type="date" :rules="rules.required"></v-text-field></v-col>
              <v-col cols="12" sm="4"><v-text-field v-model="editedItem.endDate" label="停用日期*" type="date" :rules="rules.required"></v-text-field></v-col>
              <v-col cols="12">
                <v-divider class="my-4"></v-divider>
                <div class="d-flex align-center mb-2">
                  <h3 class="text-h6 font-weight-medium">使用者人數方案</h3>
                  <v-spacer></v-spacer>
                  <v-btn color="primary" @click="addUserTier" prepend-icon="mdi-plus">
                    新增方案
                  </v-btn>
                </div>

                <div v-if="!editedItem.userLimitTiers || editedItem.userLimitTiers.length === 0" class="text-center text-grey py-4 my-2" style="border: 2px dashed #ccc; border-radius: 8px;">
                  尚未設定任何使用者人數方案
                </div>

                <v-card 
                  v-for="(tier, index) in editedItem.userLimitTiers" 
                  :key="index" 
                  class="mb-3"
                  variant="outlined"
                >
                  <v-card-text>
                    <v-row align="center">
                      <v-col cols="6" sm="4" md="2">
                        <v-text-field
                          v-model.number="tier.count"
                          label="人數"
                          type="number"
                          variant="outlined"
                          density="compact"
                          hide-details="auto"
                          persistent-hint
                        ></v-text-field>
                      </v-col>
                      <v-col cols="6" sm="4" md="2">
                        <v-text-field
                          v-model.number="tier.paymentAmount"
                          label="付款金額"
                          type="number"
                          variant="outlined"
                          density="compact"
                          hide-details="auto"
                        ></v-text-field>
                      </v-col>
                      <v-col cols="12" sm="4" md="2">
                        <v-text-field
                          v-model="tier.paymentDate"
                          label="付款日期"
                          type="date"
                          variant="outlined"
                          density="compact"
                          hide-details="auto"
                        ></v-text-field>
                      </v-col>
                      <v-col cols="12" sm="6" md="2">
                        <v-text-field
                          v-model="tier.startDate"
                          label="啟用日期*"
                          type="date"
                          variant="outlined"
                          density="compact"
                          hide-details="auto"
                          :rules="rules.required"
                        ></v-text-field>
                      </v-col>
                      <v-col cols="12" sm="6" md="2">
                        <v-text-field
                          v-model="tier.endDate"
                          label="停用日期*"
                          type="date"
                          variant="outlined"
                          density="compact"
                          hide-details="auto"
                          :rules="rules.required"
                        ></v-text-field>
                      </v-col>
                      <v-col cols="12" md="1" class="text-center">
                        <v-btn icon="mdi-delete" color="error" variant="text" @click="removeUserTier(index)"></v-btn>
                      </v-col>
                    </v-row>
                  </v-card-text>
                </v-card>
              </v-col>
              
              <v-col cols="12">
                <v-divider class="my-4"></v-divider>
                <div class="d-flex align-center mb-2">
                  <h3 class="text-h6 font-weight-medium">繳款紀錄</h3>
                  <v-spacer></v-spacer>
                  <v-btn color="primary" @click="addPaymentRecord" prepend-icon="mdi-plus">
                    新增繳款紀錄
                  </v-btn>
                </div>

                <div v-if="!editedItem.paymentRecords || editedItem.paymentRecords.length === 0"
                     class="text-center text-grey py-4 my-2" style="border: 2px dashed #ccc; border-radius: 8px;">
                  尚未建立任何繳款紀錄
                </div>

                <v-card
                  v-for="(rec, index) in editedItem.paymentRecords"
                  :key="rec.id || index"
                  class="mb-3"
                  variant="outlined"
                >
                  <v-card-text>
                    <div class="d-flex align-center mb-2">
                      <v-chip :color="paymentRecordStatus(rec).color" size="small" label>
                        {{ paymentRecordStatus(rec).text }}
                      </v-chip>
                      <span v-if="remindersSentText(rec)" class="text-caption text-grey ms-3">
                        {{ remindersSentText(rec) }}
                      </span>
                      <v-spacer></v-spacer>
                      <v-btn icon="mdi-delete" color="error" variant="text" density="comfortable" @click="removePaymentRecord(index)"></v-btn>
                    </div>
                    <v-row align="center">
                      <v-col cols="12" sm="6" md="3">
                        <v-text-field
                          v-model="rec.agreedDate"
                          label="約定繳款日期*"
                          type="date"
                          variant="outlined"
                          density="compact"
                          hide-details="auto"
                          :rules="rules.required"
                        ></v-text-field>
                      </v-col>
                      <v-col cols="12" sm="6" md="3">
                        <v-text-field
                          v-model="rec.paidDate"
                          label="繳款日期 (實際繳款日)"
                          type="date"
                          variant="outlined"
                          density="compact"
                          hide-details="auto"
                          clearable
                        ></v-text-field>
                      </v-col>
                      <v-col cols="12" sm="6" md="3">
                        <v-text-field
                          v-model.number="rec.amount"
                          label="金額"
                          type="number"
                          variant="outlined"
                          density="compact"
                          hide-details="auto"
                          prefix="$"
                        ></v-text-field>
                      </v-col>
                      <v-col cols="12" sm="6" md="3">
                        <v-checkbox
                          v-model="rec.invoiceIssued"
                          label="已開發票請款"
                          density="compact"
                          hide-details
                          color="primary"
                        ></v-checkbox>
                      </v-col>
                      <v-col cols="12">
                        <v-text-field
                          v-model="rec.note"
                          label="備註"
                          variant="outlined"
                          density="compact"
                          hide-details="auto"
                          clearable
                        ></v-text-field>
                      </v-col>
                    </v-row>
                  </v-card-text>
                </v-card>
              </v-col>

              <v-col cols="12">
                <v-divider class="my-4"></v-divider>
                <h3 class="text-h6 font-weight-medium mb-2">附件資料 (PDF / 圖檔)</h3>

                <v-file-input
                  v-model="pendingAttachmentFiles"
                  label="新增附件 (可多選，單檔上限 7MB)"
                  accept="image/png, image/jpeg, image/gif, image/webp, application/pdf"
                  prepend-icon="mdi-paperclip"
                  variant="outlined"
                  density="compact"
                  multiple
                  chips
                  clearable
                ></v-file-input>

                <div v-if="(editedItem.attachments || []).length === 0 && pendingAttachmentFiles.length === 0"
                     class="text-center text-grey py-4 my-2" style="border: 2px dashed #ccc; border-radius: 8px;">
                  尚無附件資料
                </div>

                <v-card
                  v-for="(att, index) in editedItem.attachments"
                  :key="att.storagePath || index"
                  class="mb-2"
                  variant="outlined"
                >
                  <v-card-text class="d-flex align-center py-2">
                    <v-avatar v-if="isImageAttachment(att)" size="48" rounded class="me-3" style="border: 1px solid #e0e0e0;">
                      <v-img :src="att.url" cover></v-img>
                    </v-avatar>
                    <v-icon v-else color="red-darken-2" size="48" class="me-3">mdi-file-pdf-box</v-icon>
                    <div class="flex-grow-1" style="min-width: 0;">
                      <div class="text-body-2 text-truncate">{{ att.name }}</div>
                      <div class="text-caption text-grey">
                        {{ formatFileSize(att.size) }}
                        <span v-if="att.uploadedAt"> · {{ att.uploadedAt.split('T')[0] }}</span>
                      </div>
                    </div>
                    <v-btn icon="mdi-eye" variant="text" color="primary" @click="openPreview(att)"></v-btn>
                    <v-btn icon="mdi-delete" variant="text" color="error" @click="markAttachmentForDelete(index)"></v-btn>
                  </v-card-text>
                </v-card>

                <v-card
                  v-for="(file, index) in pendingAttachmentFiles"
                  :key="'pending-' + index"
                  class="mb-2"
                  variant="outlined"
                  color="blue-lighten-5"
                >
                  <v-card-text class="d-flex align-center py-2">
                    <v-icon :color="file.type === 'application/pdf' ? 'red-darken-2' : 'primary'" size="48" class="me-3">
                      {{ file.type === 'application/pdf' ? 'mdi-file-pdf-box' : 'mdi-image' }}
                    </v-icon>
                    <div class="flex-grow-1" style="min-width: 0;">
                      <div class="text-body-2 text-truncate">{{ file.name }}</div>
                      <div class="text-caption text-grey">{{ formatFileSize(file.size) }} · 待上傳 (儲存時上傳)</div>
                    </div>
                    <v-btn icon="mdi-close" variant="text" @click="removePendingFile(index)"></v-btn>
                  </v-card-text>
                </v-card>

                <div v-if="attachmentsToDelete.length > 0" class="text-caption text-red mt-1">
                  已標記刪除 {{ attachmentsToDelete.length }} 個附件，將於儲存時移除。
                </div>
              </v-col>

              <v-col cols="12"><v-textarea v-model="editedItem.remarks" label="備註" rows="2"></v-textarea></v-col>
            </v-row>
          </v-container>
          <small>* 為必填欄位</small>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="blue-darken-1" variant="text" @click="closeDialog">取消</v-btn>
          <v-btn color="blue-darken-1" variant="text" @click="save" :loading="saving">儲存</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="deleteDialog" persistent max-width="400">
        <v-card>
          <v-card-title class="text-h6 d-flex align-center bg-red-lighten-4">
          <v-icon start color="red-darken-2">mdi-alert-circle-outline</v-icon>
          確認刪除訂閱
        </v-card-title>
          <v-card-text>
            您確定要刪除這筆訂閱紀錄嗎？<br>
            <br>
            <strong>建案:</strong> {{ itemToDelete.projectName }} <br>
            <strong>系統:</strong> {{ itemToDelete.systemFunction }} <br>
            <br>
            此操作無法復原。
          </v-card-text>
          <v-card-actions>
            <v-spacer></v-spacer>
            <v-btn text @click="closeDeleteDialog">取消</v-btn>
            <v-btn color="error" text @click="confirmDelete" :loading="saving">確認刪除</v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>

    <v-dialog v-model="previewDialog" max-width="960px">
      <v-card>
        <v-toolbar density="compact" color="#004383" dark>
          <v-toolbar-title class="text-body-1">{{ previewAttachment?.name }}</v-toolbar-title>
          <v-spacer></v-spacer>
          <v-btn icon="mdi-open-in-new" variant="text" @click="openInNewTab(previewAttachment?.url)"></v-btn>
          <v-btn icon="mdi-close" variant="text" @click="previewDialog = false"></v-btn>
        </v-toolbar>
        <v-card-text class="pa-0 bg-grey-lighten-3" style="height: 75vh;">
          <v-img
            v-if="previewAttachment && isImageAttachment(previewAttachment)"
            :src="previewAttachment.url"
            height="100%"
            contain
          ></v-img>
          <iframe
            v-else-if="previewAttachment"
            :src="previewAttachment.url"
            style="width: 100%; height: 100%; border: 0;"
            title="附件預覽"
          ></iframe>
        </v-card-text>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script setup>
import { ref, onMounted, computed, nextTick, watch } from 'vue';
import { useUserStore } from '@/store/user';
import { 
    fetchAllSubscriptions,
    fetchMasterDataForSubscriptionForm,
    addSubscription,
    updateSubscription,
    deleteSubscription,
    //  1. 從 @/api.js 引入 SalesSettings 在用的函式
    uploadSalesImage,
    updateProjectSalesSettings,
    deleteSalesImage,
} from '@/api.js';
//  2. 移除 firebase/storage 的 import，我們不再需要它
// import { getStorage, ref as storageRef, uploadBytes, getDownloadURL } from "firebase/storage";

const userStore = useUserStore();
const adminKey = computed(() => userStore.user?.key);

const loading = ref(true);
const saving = ref(false);
const search = ref('');
const subscriptions = ref([]);
const masterData = ref({ projectNames: [], systemFunctions: [] });
const projects = ref([]);

const headers = [
    { title: '狀態', key: 'status', sortable: false },
    { title: '建案名稱', key: 'projectName' },
    { title: '系統功能', key: 'systemFunction' },
    { title: '使用者上限', key: 'currentUserLimit', align: 'center' },
    { title: '啟用日期', key: 'startDate' },
    { title: '停用日期', key: 'endDate' },
    { title: '訂閱天數', key: 'durationDays' },
    { title: '聯絡人', key: 'contactName' },
    { title: '聯絡人手機', key: 'contactPhone' },
    { title: '訂閱類型', key: 'subscriptionType' },
    { title: '繳款紀錄', key: 'paymentRecords', sortable: false },
    { title: '附件', key: 'attachments', sortable: false },
    { title: '操作', key: 'actions', sortable: false },
];

const dialog = ref(false);
const deleteDialog = ref(false);
const isEditing = ref(false);

const defaultItem = {
    id: null,
    projectName: '', 
    projectId: '', 
    iconUrl: '', 
    systemFunction: [], 
    userLimitTiers: [],
    contactName: '', 
    contactEmail: '', 
    contactPhone: '',
    paymentDate: '', 
    subscriptionType: '', 
    startDate: '', 
    endDate: '', 
    paymentAmount: '',
    remarks: '',
    attachments: [],
    paymentRecords: []
};
const editedItem = ref({ ...defaultItem });
const itemToDelete = ref({});

const fileToUpload = ref(null);
const newIconPreview = ref(null);

const iconPreviewUrl = computed(() => {
  return newIconPreview.value || editedItem.value.iconUrl;
});

watch(fileToUpload, (newFile) => {
  if (newIconPreview.value) {
    URL.revokeObjectURL(newIconPreview.value);
    newIconPreview.value = null;
  }
  if (newFile) {
    newIconPreview.value = URL.createObjectURL(newFile);
  }
});

// --- 繳款紀錄相關 ---
function taiwanToday() {
  return new Date().toLocaleDateString('sv-SE', { timeZone: 'Asia/Taipei' });
}

function daysUntil(dateStr) {
  return Math.round((new Date(dateStr).getTime() - new Date(taiwanToday()).getTime()) / 86400000);
}

function addPaymentRecord() {
  if (!editedItem.value.paymentRecords) {
    editedItem.value.paymentRecords = [];
  }
  editedItem.value.paymentRecords.push({
    id: `PAY-${Date.now()}-${editedItem.value.paymentRecords.length}`,
    agreedDate: taiwanToday(),
    paidDate: '',
    amount: 0,
    invoiceIssued: false,
    note: '',
    remindersSent: { d30: null, d14: null, d7: null },
  });
}

function removePaymentRecord(index) {
  editedItem.value.paymentRecords.splice(index, 1);
}

function paymentRecordStatus(rec) {
  if (rec.paidDate) return { text: '已繳款', color: 'green' };
  if (!rec.agreedDate) return { text: '未設定日期', color: 'grey' };
  const diff = daysUntil(rec.agreedDate);
  if (diff < 0) return { text: `已逾期 ${-diff} 天`, color: 'red' };
  if (diff <= 30) return { text: `未繳款 (${diff} 天後到期)`, color: 'orange' };
  return { text: '未繳款', color: 'blue-grey' };
}

function remindersSentText(rec) {
  const sent = rec.remindersSent || {};
  const labels = [];
  if (sent.d30) labels.push('30天前');
  if (sent.d14) labels.push('14天前');
  if (sent.d7) labels.push('7天前');
  return labels.length > 0 ? `已寄提醒: ${labels.join('、')}` : '';
}

// 列表摘要：最近一筆未繳款的約定日期與金額
function paymentSummary(item) {
  const recs = item.paymentRecords || [];
  if (recs.length === 0) return null;
  const unpaid = recs
    .filter(r => !r.paidDate && r.agreedDate)
    .sort((a, b) => a.agreedDate.localeCompare(b.agreedDate));
  if (unpaid.length === 0) return { text: '已繳清', color: 'green' };
  const rec = unpaid[0];
  const [, m, d] = rec.agreedDate.split('-');
  const diff = daysUntil(rec.agreedDate);
  const color = diff < 0 ? 'red' : (diff <= 30 ? 'orange' : 'blue-grey');
  return { text: `${Number(m)}/${Number(d)} · $${(Number(rec.amount) || 0).toLocaleString()}`, color };
}

// --- 附件資料相關狀態 ---
const MAX_ATTACHMENT_SIZE = 7 * 1024 * 1024; // 7MB (Base64 代理上傳的安全上限)
const pendingAttachmentFiles = ref([]);
const attachmentsToDelete = ref([]);
const previewDialog = ref(false);
const previewAttachment = ref(null);

// v-file-input 清空時可能回傳 null，統一正規化為陣列
watch(pendingAttachmentFiles, (val) => {
  if (!val) pendingAttachmentFiles.value = [];
});

function isImageAttachment(att) {
  if (att?.contentType) return att.contentType.startsWith('image/');
  return /\.(png|jpe?g|gif|webp)(\?|$)/i.test(att?.url || '');
}

function formatFileSize(bytes) {
  if (!bytes && bytes !== 0) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function openPreview(att) {
  previewAttachment.value = att;
  previewDialog.value = true;
}

function openInNewTab(url) {
  if (url) window.open(url, '_blank');
}

function markAttachmentForDelete(index) {
  const [removed] = editedItem.value.attachments.splice(index, 1);
  if (removed?.storagePath) {
    attachmentsToDelete.value.push(removed);
  }
}

function removePendingFile(index) {
  pendingAttachmentFiles.value = pendingAttachmentFiles.value.filter((_, i) => i !== index);
}

const subscriptionTypeOptions = ['月繳', '年繳', '季繳', '試用', '其他'];
const subscriptionTypeSelection = ref('');
const otherSubscriptionType = ref('');


const rules = {
    required: [ value => !!value || '此欄位為必填項。' ],
    requiredArray: [ value => (value && value.length > 0) || '請至少選擇一個項目。' ],
    email: [ value => !value || /.+@.+\..+/.test(value) || 'E-mail 格式不正確。' ],
    projectId: [
      v => !!v || '建案 ID 為必填項。',
      // ✓ [新增] 即時驗證規則：僅允許半形英文及數字
      v => /^[a-zA-Z0-9]+$/.test(v) || '僅能輸入半形英文及數字。',
      v => !projects.value.some(p => p.id === v) || '此建案 ID 已存在，請使用別的 ID。'
    ],
};

const isProjectNameExisting = computed(() => {
  return !!editedItem.value.projectName && projects.value.some(p => p.name === editedItem.value.projectName);
});

const isProjectIdDisabled = computed(() => {
  return isEditing.value || isProjectNameExisting.value;
});

watch(() => editedItem.value.projectName, (newName) => {
  if (isEditing.value) return;

  const existingProject = projects.value.find(p => p.name === newName);
  
  if (existingProject) {
    editedItem.value.projectId = existingProject.id;
    editedItem.value.iconUrl = existingProject.iconUrl || '';
  } else {
    editedItem.value.projectId = '';
    editedItem.value.iconUrl = '';
  }
});

async function loadData() {
    if (!adminKey.value) {
        alert('無法獲取管理者資訊，請重新登入。');
        return;
    }
    loading.value = true;
    try {
        const [subs, mData] = await Promise.all([
            fetchAllSubscriptions(adminKey.value),
            fetchMasterDataForSubscriptionForm(adminKey.value)
        ]);
        
        subscriptions.value = subs.map(sub => {
          const newSub = { ...sub };

          // --- 計算 durationDays ---
          if (sub.startDate && sub.endDate) {
            const startDate = new Date(sub.startDate);
            const endDate = new Date(sub.endDate);
            if (!isNaN(startDate) && !isNaN(endDate)) {
              const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
              const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
              newSub.durationDays = diffDays;
            } else {
              newSub.durationDays = 'N/A';
            }
          } else {
            newSub.durationDays = 'N/A';
          }

          // --- 計算 currentUserLimit ---
          const tiers = sub.userLimitTiers || [];
          if (tiers.length > 0) {
            const today = new Date();
            today.setHours(0, 0, 0, 0); 

            let effectiveLimit = 0;
            tiers.forEach(tier => {
              if (tier.startDate && tier.endDate) {
                const tierStartDate = new Date(tier.startDate);
                const tierEndDate = new Date(tier.endDate);
                tierStartDate.setHours(0, 0, 0, 0);
                tierEndDate.setHours(0, 0, 0, 0);

                if (today >= tierStartDate && today <= tierEndDate) {
                  effectiveLimit += Number(tier.count) || 0;
                }
              }
            });
            newSub.currentUserLimit = effectiveLimit;
          } else {
            newSub.currentUserLimit = 0;
          }
          return newSub;
        });

        projects.value = mData.projects; 
        masterData.value = {
            projectNames: mData.projects.map(p => p.name), 
            systemFunctions: mData.systemFunctions
        };

    } catch (error) {
        console.error("載入資料失敗:", error);
        alert('載入資料失敗: ' + error.message);
    } finally {
        loading.value = false;
    }
}

onMounted(loadData);

function openEditDialog(item) {
    isEditing.value = !!item;

    fileToUpload.value = null;
    if (newIconPreview.value) {
      URL.revokeObjectURL(newIconPreview.value);
      newIconPreview.value = null;
    }

    pendingAttachmentFiles.value = [];
    attachmentsToDelete.value = [];

    if (item) {
        editedItem.value = {
          ...item,
          userLimitTiers: item.userLimitTiers || [],
          attachments: (item.attachments || []).map(att => ({ ...att })),
          paymentRecords: (item.paymentRecords || []).map(rec => ({
            ...rec,
            remindersSent: { ...(rec.remindersSent || { d30: null, d14: null, d7: null }) },
          })),
        };
        if (typeof editedItem.value.systemFunction === 'string') {
            editedItem.value.systemFunction = [editedItem.value.systemFunction];
        }
        const project = projects.value.find(p => p.name === item.projectName);
        editedItem.value.iconUrl = project ? project.iconUrl : '';
    } else {
        // 展開時給新的陣列，避免多次開啟 Dialog 共用 defaultItem 的同一個陣列參考
        editedItem.value = { ...defaultItem, userLimitTiers: [], attachments: [], paymentRecords: [] };
    }
    
    const currentType = item ? item.subscriptionType : '';
    if (currentType && subscriptionTypeOptions.includes(currentType)) {
        subscriptionTypeSelection.value = currentType;
        otherSubscriptionType.value = '';
    } else if (currentType) {
        subscriptionTypeSelection.value = '其他';
        otherSubscriptionType.value = currentType;
    } else {
        subscriptionTypeSelection.value = '';
        otherSubscriptionType.value = '';
    }
    
    dialog.value = true;
}

function closeDialog() {
    dialog.value = false;
}

function openDeleteDialog(item) {
    itemToDelete.value = { ...item };
    deleteDialog.value = true;
}

function closeDeleteDialog() {
    deleteDialog.value = false;
    nextTick(() => {
        itemToDelete.value = {};
    });
}

function addUserTier() {
  if (!editedItem.value.userLimitTiers) {
    editedItem.value.userLimitTiers = [];
  }
  const today = new Date().toISOString().split('T')[0];
  editedItem.value.userLimitTiers.push({
    count: 1,
    paymentAmount: 0,       
    paymentDate: today,     
    startDate: today,
    endDate: today,
  });
}

function removeUserTier(index) {
  editedItem.value.userLimitTiers.splice(index, 1);
}

//  3. 新增 fileToBase64 輔助函式 (同 SalesSettings.vue)
const fileToBase64 = (file) => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.readAsDataURL(file);
  reader.onload = () => {
    const base64String = reader.result.split(',')[1];
    resolve(base64String);
  };
  reader.onerror = error => reject(error);
});

//  4. 修改 save 函式以使用 Base64 代理上傳
async function save() {
    saving.value = true;
    let uploadedIconUrl = null; 

    try {
        // ✓ [新增] 儲存前強制驗證建案 ID 格式 (防止用戶忽略錯誤提示硬送出)
        if (!isProjectIdDisabled.value) {
             if (!editedItem.value.projectId) {
                 throw new Error('建案 ID 為必填項。');
             }
             if (!/^[a-zA-Z0-9]+$/.test(editedItem.value.projectId)) {
                 throw new Error('建案 ID 僅能輸入半形英文及數字。');
             }
        }

        // --- 步驟 1: 處理圖檔上傳 (使用 Base64 代理) ---
        if (fileToUpload.value) {
            const projectId = editedItem.value.projectId;
            if (!projectId) {
                throw new Error('必須先指定建案 ID 才能上傳圖檔。');
            }
            
            const fileExtension = fileToUpload.value.name.split('.').pop();
            const storagePath = `projects/${projectId}/icon.${fileExtension}`;
            
            console.log(`正在轉換 Base64 並上傳至: ${storagePath}`);

            const base64 = await fileToBase64(fileToUpload.value);

            // 呼叫 SalesSettings 使用的 API 函式
            const { downloadURL } = await uploadSalesImage(
                storagePath,
                fileToUpload.value.name,
                base64,
                projectId
            );
            
            uploadedIconUrl = downloadURL;
            console.log('圖檔上傳成功, URL:', uploadedIconUrl);
        }

        // --- 步驟 1.5: 處理附件上傳 (PDF / 圖檔，使用 Base64 代理) ---
        const filesToAttach = pendingAttachmentFiles.value || [];
        if (filesToAttach.length > 0) {
            const projectId = editedItem.value.projectId;
            if (!projectId) {
                throw new Error('必須先指定建案 ID 才能上傳附件。');
            }
            const oversized = filesToAttach.find(f => f.size > MAX_ATTACHMENT_SIZE);
            if (oversized) {
                throw new Error(`附件「${oversized.name}」超過 7MB 上限，請壓縮後再上傳。`);
            }

            for (const [index, file] of filesToAttach.entries()) {
                const safeName = file.name.replace(/[^\w.\-]/g, '_');
                const storagePath = `subscriptions/${projectId}/attachments/${Date.now()}_${index}_${safeName}`;
                const base64 = await fileToBase64(file);
                const { downloadURL } = await uploadSalesImage(
                    storagePath,
                    file.name,
                    base64,
                    projectId,
                    file.type || 'application/octet-stream'
                );
                editedItem.value.attachments.push({
                    name: file.name,
                    url: downloadURL,
                    storagePath: storagePath,
                    contentType: file.type || '',
                    size: file.size,
                    uploadedAt: new Date().toISOString(),
                });
            }
            console.log(`成功上傳 ${filesToAttach.length} 個附件。`);
            // 上傳完成立即清空待上傳清單，避免儲存失敗重試時重複上傳
            pendingAttachmentFiles.value = [];
        }

        // --- 步驟 2: 處理訂閱資料儲存 (既有邏輯) ---
        // ... (以下邏輯保持不變)
        const basePayload = { ...editedItem.value };
        basePayload.attachments = editedItem.value.attachments || [];

        // 正規化繳款紀錄：剔除無約定日期者、金額轉數字、保留 remindersSent、依約定日期排序
        basePayload.paymentRecords = (editedItem.value.paymentRecords || [])
          .filter(rec => rec.agreedDate)
          .map((rec, idx) => ({
            id: rec.id || `PAY-${Date.now()}-${idx}`,
            agreedDate: rec.agreedDate,
            paidDate: rec.paidDate || '',
            amount: Number(rec.amount) || 0,
            invoiceIssued: !!rec.invoiceIssued,
            note: rec.note || '',
            remindersSent: rec.remindersSent || { d30: null, d14: null, d7: null },
          }))
          .sort((a, b) => a.agreedDate.localeCompare(b.agreedDate));

        if (basePayload.userLimitTiers && Array.isArray(basePayload.userLimitTiers)) {
          basePayload.userLimitTiers = basePayload.userLimitTiers.map(tier => ({
            ...tier,
            count: Number(tier.count) || 0,
            paymentAmount: Number(tier.paymentAmount) || 0,
            startDate: tier.startDate ? new Date(tier.startDate).toISOString().split('T')[0] : '',
            endDate: tier.endDate ? new Date(tier.endDate).toISOString().split('T')[0] : '',
          })).filter(tier => tier.startDate && tier.endDate);
        }

        if (subscriptionTypeSelection.value === '其他') {
            basePayload.subscriptionType = otherSubscriptionType.value;
        } else {
            basePayload.subscriptionType = subscriptionTypeSelection.value;
        }

        if (isEditing.value) {
            const payloadData = { ...basePayload };
            payloadData.systemFunction = basePayload.systemFunction[0] || ''; 
            await updateSubscription(payloadData.id, payloadData, adminKey.value);
            alert('訂閱資料儲存成功！');
        } else {
            const selectedSystems = basePayload.systemFunction;
            if (!selectedSystems || selectedSystems.length === 0) {
                throw new Error('請至少選擇一個系統功能。');
            }

            const creationPromises = selectedSystems.map((system, index) => {
                const payloadData = { ...basePayload, systemFunction: system };
                const isDuplicate = subscriptions.value.some(sub => 
                    sub.projectName === payloadData.projectName &&
                    sub.systemFunction === payloadData.systemFunction &&
                    (sub.status === '啟用中' || sub.status.startsWith('即將到期'))
                );
                if (isDuplicate) {
                    throw new Error(`錯誤：建案「${payloadData.projectName}」的「${payloadData.systemFunction}」已有一個有效的訂閱。`);
                }
                const newId = `SUB-${Date.now()}-${index}`;
                return addSubscription(newId, payloadData, adminKey.value);
            });
            await Promise.all(creationPromises);
            alert(`成功新增 ${creationPromises.length} 筆訂閱！`);
        }

        // --- 步驟 2.5: 刪除已標記移除的附件 (Storage 檔案) ---
        if (attachmentsToDelete.value.length > 0) {
            for (const att of attachmentsToDelete.value) {
                try {
                    // 附件無 salesImages 紀錄，docId 僅為佔位 (後端刪除不存在的文件為 no-op)
                    await deleteSalesImage(`subAttach_${Date.now()}`, att.storagePath);
                } catch (delError) {
                    // 刪除 Storage 檔案失敗不影響訂閱資料儲存結果
                    console.warn('刪除附件檔案失敗 (不影響儲存):', att.storagePath, delError);
                }
            }
            attachmentsToDelete.value = [];
        }
        pendingAttachmentFiles.value = [];

        // --- 步驟 3: 處理建案圖示 URL 更新 (使用 SalesSettings 的 API) ---
        if (uploadedIconUrl) {
            const projectId = editedItem.value.projectId;
            console.log(`正在更新 projects/${projectId} 的 iconUrl...`);
            
            // 呼叫 SalesSettings 用來更新專案的 API 函式
            await updateProjectSalesSettings(projectId, { 
                iconUrl: uploadedIconUrl 
            });
            
            alert('建案圖示已同步更新！');
        }

        closeDialog();
        await loadData(); // 重新載入所有資料

    } catch (error) {
        console.error("儲存失敗:", error);
        alert('儲存失敗: ' + error.message);
    } finally {
        saving.value = false;
    }
}

async function confirmDelete() {
    saving.value = true;
    try {
        await deleteSubscription(itemToDelete.value.id, adminKey.value);
        alert('刪除成功！');
        closeDeleteDialog();
        await loadData();
    } catch (error) {
        console.error("刪除失敗:", error);
        alert('刪除失敗: ' + error.message);
    } finally {
        saving.value = false;
    }
}
</script>