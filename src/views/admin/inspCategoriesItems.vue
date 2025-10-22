<template>
  <v-container fluid>
    <v-row>
      <v-col cols="12" md="3">
        <v-list density="compact" nav v-model:selected="selectedCategory">
        <v-divider class="my-2"></v-divider>
           
           <v-list-item 
           @click="openImportDialog" 
           prepend-icon="mdi-cloud-upload-outline" 
           title="批次匯入" 
           color="green"
           
           >
           </v-list-item>
          
          <v-list-item
          @click="handleExport"
          prepend-icon="mdi-cloud-download-outline"
          title="批次匯出"
          color="red"
      
          :disabled="isExporting" 
          :loading="isExporting"
           ></v-list-item>

       
          <v-list-subheader>選項類別</v-list-subheader>
          <v-list-item
            v-for="category in categories"
            :key="category.value"
            :value="category.value"
            :title="category.title"
            :prepend-icon="category.icon"
            color="primary"
          ></v-list-item>
        </v-list>
      </v-col>

      <v-col cols="12" md="9">
        <div v-if="isLoading" class="text-center pa-10">
          <v-progress-circular indeterminate color="primary" size="64"></v-progress-circular>
          <p class="mt-4 text-grey-darken-1">正在載入設定...</p>
        </div>
        <v-window v-model="selectedCategory[0]" v-else>
          <v-window-item value="phase">
            <v-card variant="outlined">
              <v-toolbar flat color="white" density="compact">
                <v-card-title class="text-subtitle-1 font-weight-bold">驗屋階段</v-card-title>
                <v-spacer></v-spacer>
                <v-btn color="primary" variant="outlined" size="small" @click="openAddItemDialog('phase')" prepend-icon="mdi-plus">
                  新增階段
                </v-btn>
              </v-toolbar>
              <v-divider></v-divider>
              <v-card-text>
                <v-data-table
                  :headers="simpleHeaders"
                  :items="inspectionOptions.phase"
                  :loading="isLoading"
                  items-per-page="-1"
                  hover
                  no-data-text="尚無驗屋階段"
                  density="compact"
                >
                  <template v-slot:item.actions="{ item }">
                    <v-icon size="small" class="mr-2" color="primary" @click="openEditItemDialog(item)">mdi-pencil</v-icon>
                    <v-icon size="small" color="error" @click="openDeleteItemDialog(item)">mdi-delete</v-icon>
                  </template>
                  <template v-slot:bottom></template>
                </v-data-table>
              </v-card-text>
            </v-card>
          </v-window-item>

          <v-window-item value="area">
             <v-card variant="outlined">
              <v-toolbar flat color="white" density="compact">
                <v-card-title class="text-subtitle-1 font-weight-bold">檢查區域</v-card-title>
                <v-spacer></v-spacer>
                <v-btn color="primary" variant="outlined" size="small" @click="openAddItemDialog('area')" prepend-icon="mdi-plus">
                  新增區域
                </v-btn>
              </v-toolbar>
              <v-divider></v-divider>
              <v-card-text>
                <v-data-table
                  :headers="simpleHeaders"
                  :items="inspectionOptions.area"
                  :loading="isLoading"
                  items-per-page="-1"
                  hover
                  no-data-text="尚無檢查區域"
                  density="compact"
                >
                  <template v-slot:item.actions="{ item }">
                    <v-icon size="small" class="mr-2" color="primary" @click="openEditItemDialog(item)">mdi-pencil</v-icon>
                    <v-icon size="small" color="error" @click="openDeleteItemDialog(item)">mdi-delete</v-icon>
                  </template>
                  <template v-slot:bottom></template>
                </v-data-table>
              </v-card-text>
            </v-card>
          </v-window-item>

          <v-window-item value="category">
             <v-card variant="outlined" class="mb-6">
              <v-toolbar flat color="white" density="compact">
                <v-card-title class="text-subtitle-1 font-weight-bold">工程主分類</v-card-title>
                <v-spacer></v-spacer>
                 <v-btn color="primary" variant="outlined" size="small" @click="openAddMainCategoryDialog" prepend-icon="mdi-plus">
                  新增主分類
                </v-btn>
              </v-toolbar>
              <v-divider></v-divider>
              <v-card-text>
                <v-data-table
                  :headers="simpleHeaders"
                  :items="mainCategories"
                  :loading="isLoading"
                  items-per-page="-1"
                  hover
                  no-data-text="尚無工程主分類"
                  density="compact"
                  @click:row="handleMainCategoryClick"
                  :row-props="mainCategoryRowProps"
                >
                  <template v-slot:item.actions="{ item }">
                    <v-icon size="small" class="mr-2" color="primary" @click.stop="openEditItemDialog(item)">mdi-pencil</v-icon>
                    <v-icon size="small" color="error" @click.stop="openDeleteItemDialog(item)">mdi-delete</v-icon>
                  </template>
                  <template v-slot:bottom></template>
                </v-data-table>
              </v-card-text>
            </v-card>

            <v-expand-transition>
              <div v-if="selectedMainCategory"> 
                <v-card variant="outlined"> 
                  <v-toolbar flat color="white" density="compact">
                    <v-card-title class="text-subtitle-1 font-weight-bold">
                      子項目 ({{ selectedMainCategory.value }})
                    </v-card-title>
                    <v-spacer></v-spacer>
                     <v-btn color="teal" variant="outlined" size="small" @click="openAddSubItemDialog" prepend-icon="mdi-plus">
                      新增子項目
                    </v-btn>
                  </v-toolbar>
                  <v-divider></v-divider>
                  <v-card-text>
                    <v-data-table
                      :headers="simpleHeaders"
                      :items="subItemsOfSelectedCategory"
                      :loading="isLoading" 
                      items-per-page="-1"
                      hover
                      no-data-text="尚無子項目"
                      density="compact"
                    >
                      <template v-slot:item.actions="{ item }">
                        <v-icon size="small" class="mr-2" color="primary" @click.stop="openEditItemDialog(item)">mdi-pencil</v-icon>
                        <v-icon size="small" color="error" @click.stop="openDeleteItemDialog(item)">mdi-delete</v-icon>
                      </template>
                      <template v-slot:bottom></template>
                    </v-data-table>
                  </v-card-text>
                </v-card>
              </div>
            </v-expand-transition>

          </v-window-item>

          <v-window-item value="status">
             <v-card variant="outlined">
              <v-toolbar flat color="white" density="compact">
                <v-card-title class="text-subtitle-1 font-weight-bold">檢查狀態</v-card-title>
                <v-spacer></v-spacer>
                <v-btn color="primary" variant="outlined" size="small" @click="openAddItemDialog('status')" prepend-icon="mdi-plus">
                  新增狀態
                </v-btn>
              </v-toolbar>
              <v-divider></v-divider>
              <v-card-text>
                <v-data-table
                  :headers="complexHeaders"
                  :items="inspectionOptions.status"
                  :loading="isLoading"
                  items-per-page="-1" hover no-data-text="尚無檢查狀態" density="compact"
                >
                <template v-slot:item.preview="{ item }">
                    <v-chip
                      :color="item.color || 'grey'"
                      :prepend-icon="item.icon || undefined"
                      label
                      size="small"
                      class="my-1" 
                    >
                      {{ item.value }}
                    </v-chip>
                  </template>

                 
                  <template v-slot:item.actions="{ item }">
                    <v-icon size="small" class="mr-2" color="primary" @click="openEditItemDialog(item)">mdi-pencil</v-icon>
                    <v-icon size="small" color="error" @click="openDeleteItemDialog(item)">mdi-delete</v-icon>
                  </template>
                  <template v-slot:bottom></template>
                </v-data-table>
              </v-card-text>
            </v-card>
          </v-window-item>

          <v-window-item value="level">
             <v-card variant="outlined">
              <v-toolbar flat color="white" density="compact">
                <v-card-title class="text-subtitle-1 font-weight-bold">缺失等級</v-card-title>
                <v-spacer></v-spacer>
                <v-btn color="primary" variant="outlined" size="small" @click="openAddItemDialog('level')" prepend-icon="mdi-plus">
                  新增等級
                </v-btn>
              </v-toolbar>
              <v-divider></v-divider>
              <v-card-text>
                <v-data-table
                  :headers="complexHeaders"
                  :items="inspectionOptions.level"
                  :loading="isLoading"
                  items-per-page="-1" hover no-data-text="尚無缺失等級" density="compact"
                >
                 <template v-slot:item.preview="{ item }">
                    <v-chip
                      :color="item.color || 'grey'"
                      :prepend-icon="item.icon || undefined"
                      label
                      size="small"
                      class="my-1"
                    >
                      {{ item.value }}
                    </v-chip>
                  </template>
            
                  <template v-slot:item.actions="{ item }">
                    <v-icon size="small" class="mr-2" color="primary" @click="openEditItemDialog(item)">mdi-pencil</v-icon>
                    <v-icon size="small" color="error" @click="openDeleteItemDialog(item)">mdi-delete</v-icon>
                  </template>
                  <template v-slot:bottom></template>
                </v-data-table>
              </v-card-text>
            </v-card>
          </v-window-item>

          <v-window-item value="progress">
             <v-card variant="outlined">
              <v-toolbar flat color="white" density="compact">
                <v-card-title class="text-subtitle-1 font-weight-bold">修繕進度</v-card-title>
                <v-spacer></v-spacer>
                <v-btn color="primary" variant="outlined" size="small" @click="openAddItemDialog('progress')" prepend-icon="mdi-plus">
                  新增進度
                </v-btn>
              </v-toolbar>
              <v-divider></v-divider>
              <v-card-text>
                <v-data-table
                  :headers="complexHeaders"
                  :items="inspectionOptions.progress"
                  :loading="isLoading"
                  items-per-page="-1" hover no-data-text="尚無修繕進度" density="compact"
                >
                  <template v-slot:item.preview="{ item }">
                    <v-chip
                      :color="item.color || 'grey'"
                      :prepend-icon="item.icon || undefined"
                      label
                      size="small"
                      class="my-1"
                    >
                      {{ item.value }}
                    </v-chip>
                  </template>
                  <template v-slot:item.actions="{ item }">
                    <v-icon size="small" class="mr-2" color="primary" @click="openEditItemDialog(item)">mdi-pencil</v-icon>
                    <v-icon size="small" color="error" @click="openDeleteItemDialog(item)">mdi-delete</v-icon>
                  </template>
                  <template v-slot:bottom></template>
                </v-data-table>
              </v-card-text>
            </v-card>
          </v-window-item>

          <v-window-item value="quickReply">
             <v-card variant="outlined">
              <v-toolbar flat color="white" density="compact">
                <v-card-title class="text-subtitle-1 font-weight-bold">快選回覆</v-card-title>
                <v-spacer></v-spacer>
                <v-btn color="primary" variant="outlined" size="small" @click="openAddItemDialog('quickReply')" prepend-icon="mdi-plus">
                  新增回覆
                </v-btn>
              </v-toolbar>
              <v-divider></v-divider>
              <v-card-text>
                <v-data-table
                  :headers="simpleHeaders"
                  :items="inspectionOptions.quickReply"
                  :loading="isLoading"
                  items-per-page="-1" hover no-data-text="尚無快選回覆" density="compact"
                >
                  <template v-slot:item.actions="{ item }">
                    <v-icon size="small" class="mr-2" color="primary" @click="openEditItemDialog(item)">mdi-pencil</v-icon>
                    <v-icon size="small" color="error" @click="openDeleteItemDialog(item)">mdi-delete</v-icon>
                  </template>
                  <template v-slot:bottom></template>
                </v-data-table>
              </v-card-text>
            </v-card>
          </v-window-item>

        </v-window>
      </v-col>
    </v-row>

    <v-snackbar v-model="snackbar.show" :color="snackbar.color" timeout="3000" location="top right">
      {{ snackbar.text }}
      <template v-slot:actions>
        <v-btn icon="mdi-close" variant="text" @click="snackbar.show = false"></v-btn>
      </template>
    </v-snackbar>

    <v-dialog v-model="editDialog.visible" max-width="500px" persistent scrollable>
      <v-card>
        <v-card-title>
          <span class="text-h5">{{ editDialog.isEdit ? '編輯' : '新增' }}項目</span>
        </v-card-title>
        <v-card-text>
          <v-form ref="editFormRef">

          <v-text-field
                v-if="editDialog.item.parentValue"
                label="所屬主分類"
                :model-value="editDialog.item.parentValue"
                readonly
                variant="filled"
                density="compact"
                class="mb-4"
                hide-details
             ></v-text-field>

             <v-text-field
                v-model="editDialog.item.value"
                :label="`項目名稱 (${editDialog.typeName})`"
                :rules="[v => !!v || '項目名稱為必填']"
                required variant="outlined" density="compact" autofocus class="mb-4"
              ></v-text-field>

              <template v-if="['status', 'level', 'progress'].includes(editDialog.item.type)">
                <v-col cols="12" class="pa-0 mb-4">
                  <v-label class="mb-1">標籤顏色</v-label>
                  <v-menu
                    v-model="colorMenuVisible"
                    :close-on-content-click="false"
                    location="bottom start"
                    offset="10"
                    min-width="300"
                  >
                    <template v-slot:activator="{ props }">
                      <v-text-field
                        v-model="editDialog.item.color"
                        readonly
                        variant="outlined"
                        density="compact"
                        placeholder="選擇顏色"
                        clearable
                        v-bind="props"
                        class="color-input-field"
                        hide-details="auto"
                      >
                        <template v-slot:prepend-inner>
                          <div
                            :style="{
                              backgroundColor: editDialog.item.color || '#BDBDBD',
                              width: '20px',
                              height: '20px',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              border: '1px solid rgba(0,0,0,0.2)',
                              marginRight: '8px'
                            }"
                            @click="openColorMenu"
                          ></div>
                        </template>
                      </v-text-field>
                    </template>
                    <v-card>
                      <v-color-picker
                        v-model="tempColor"
                        show-swatches
                        hide-inputs
                        elevation="0"
                        width="300"
                        mode="hex"
                      ></v-color-picker>
                      <v-divider></v-divider>
                      <v-card-actions>
                        <v-spacer></v-spacer>
                        <v-btn variant="text" @click="cancelColorSelection">取消</v-btn>
                        <v-btn color="primary" variant="text" @click="confirmColorSelection">確定</v-btn>
                      </v-card-actions>
                    </v-card>
                  </v-menu>
                </v-col>

                <v-col cols="12" class="pa-0 mb-4">
                  <v-select
                    v-model="editDialog.item.icon"
                    :items="mdiIcons"
                    label="前綴圖示"
                    variant="outlined"
                    density="compact"
                    clearable
                    hide-details="auto"
                  >
                    <template v-slot:item="{ props, item }">
                      <v-list-item v-bind="props" :title="item.title">
                        <template v-slot:prepend>
                          <v-icon :icon="item.value" class="mr-2"></v-icon>
                        </template>
                      </v-list-item>
                    </template>
                    <template v-slot:selection="{ item }">
                       <v-icon :icon="item.value" size="small" class="mr-2"></v-icon>
                       <span>{{ item.title }}</span>
                    </template>
                  </v-select>
                </v-col>
              </template>

              <v-text-field
                v-model.number="editDialog.item.order"
                label="排序 (數字越小越前面)"
                type="number"
                variant="outlined"
                density="compact"
                class="mb-4"
              ></v-text-field>
              
              <template v-if="['status', 'level', 'progress'].includes(editDialog.item.type)">
              <v-divider class="my-4"></v-divider>
              <div class="preview-section">
                <p class="text-caption text-grey mb-2">即時預覽:</p>
                <v-chip
                  :color="editDialog.item.color || 'grey'"
                  :prepend-icon="editDialog.item.icon || undefined"
                  label
                  size="small"
                >
                  {{ editDialog.item.value || '項目名稱' }}
                </v-chip>
              </div>
              </template>

          </v-form>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="grey-darken-1" variant="text" @click="closeEditDialog">取消</v-btn>
          <v-btn color="primary" variant="flat" @click="saveItem" :loading="editDialog.loading">儲存</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="deleteDialog.visible" max-width="500px" persistent>
      <v-card v-if="deleteDialog.item">
        <v-card-title class="text-h6 d-flex align-center bg-red-lighten-4">
          <v-icon start color="red-darken-2">mdi-alert-circle-outline</v-icon>
          確認刪除
        </v-card-title>
        <v-card-text class="pt-4">
          您確定要永久刪除「<strong>{{ deleteDialog.typeName }}</strong>」分類下的項目「<strong>{{ deleteDialog.item.value }}</strong>」嗎？
          <p v-if="deleteDialog.item.type === 'category' && !deleteDialog.item.parentValue" class="text-caption text-error mt-2">
            注意：刪除工程主分類將一併刪除其下的所有子項目。
          </p>
          <p class="mt-4">此操作無法復原。</p>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="grey-darken-1" variant="text" @click="closeDeleteDialog">取消</v-btn>
          <v-btn color="error" variant="flat" :loading="deleteDialog.loading" @click="confirmDeleteItem">確定刪除</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="importDialog.visible" max-width="800px" persistent>
      <v-card>
        <v-card-title class="bg-teal-darken-1">
          <span class="text-h5">Excel 批次匯入選項</span>
        </v-card-title>
        <v-card-text class="pt-4">
          <v-alert type="info" variant="tonal" density="compact" class="mb-4">
            請先<strong class="mx-1">下載範本檔案</strong>，依照格式填寫後再選擇檔案上傳。系統將根據「分類類別」和「項目名稱」（以及「父分類名稱」，若有）來新增或覆蓋資料。
          </v-alert>

          <div class="mb-4">
             <v-btn
                color="teal"
                variant="outlined"
                @click="downloadTemplate"
                prepend-icon="mdi-file-excel-outline"
                block
              >
                下載 Excel 匯入範本
              </v-btn>
          </div>

          <v-divider class="mb-4"></v-divider>

          <v-file-input
            id="excel-inspection-options-import-input"
            label="選擇已填寫的 Excel 檔案 (.xlsx, .xls)"
            accept=".xlsx, .xls"
            variant="outlined"
            density="compact"
            prepend-icon="mdi-paperclip"
            show-size
            clearable
            @change="handleFileUpload"
            :loading="importDialog.isParsing"
            class="mb-4"
          ></v-file-input>

          <div v-if="importDialog.error || importDialog.previewData.length > 0">
             <p class="text-subtitle-1 mb-2">預覽資料 (前 {{ importDialog.previewLimit }} 筆)</p>
             <v-alert v-if="importDialog.error" type="error" density="compact" class="mb-2">{{ importDialog.error }}</v-alert>
             <v-data-table
               :headers="importDialog.previewHeaders"
               :items="importDialog.previewData"
               :items-per-page="importDialog.previewLimit"
               density="compact"
               class="elevation-1 mb-4"
               no-data-text="Excel 中無有效資料或格式錯誤"
             >
               <template v-slot:bottom>
                 <div class="text-center pa-2 text-caption text-grey" v-if="importDialog.previewData.length > importDialog.previewLimit">
                   ... 以及其他 {{ importDialog.previewData.length - importDialog.previewLimit }} 筆資料
                 </div>
               </template>
             </v-data-table>
          </div>
        </v-card-text>
        <v-card-actions>
          <v-btn
            color="grey"
            variant="text"
            @click="clearPreview"
            :disabled="importDialog.isImporting || importDialog.isParsing"
          >
            清除重選
          </v-btn>
          <v-spacer></v-spacer>
          <v-btn
            color="grey darken-1"
            variant="text"
            @click="closeImportDialog"
            :disabled="importDialog.isImporting"
          >
            取消
          </v-btn>
          <v-btn
            color="teal"
            variant="flat"
            @click="confirmImport"
            :loading="importDialog.isImporting"
            :disabled="!importDialog.previewData.length || !!importDialog.error || importDialog.isImporting"
            prepend-icon="mdi-check-circle-outline"
          >
            確認匯入 {{ importDialog.previewData.length }} 筆
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

  </v-container>
</template>

<script setup>
import { ref, reactive, computed, onMounted, watch } from 'vue';
import { useRoute } from 'vue-router';
import { useProjectStore } from '@/store/projectStore';


import { 
getInspectionOptions, 
saveInspectionOption, 
deleteInspectionOption, 
batchImportInspectionOptions, 
updateInspectionOptionOrders,
exportInspectionOptionsToExcel
 } from '@/api'; 

import * as XLSX from 'xlsx'; // ✓ 引入 xlsx

// --- Component State ---
const route = useRoute();
const projectStore = useProjectStore();
const isLoading = ref(true);
const isUpdatingOrder = ref(false); // ✓ New loading state for order updates
const snackbar = reactive({ show: false, text: '', color: 'success' });
const isExporting = ref(false); // ✓ 新增匯出 loading 狀態

// 左側導覽列表選項
const categories = ref([
  { title: '驗屋階段', value: 'phase', icon: 'mdi-numeric' },
  { title: '檢查區域', value: 'area', icon: 'mdi-home-search' },
  { title: '工程種類', value: 'category', icon: 'mdi-tools' },
  { title: '檢查狀態', value: 'status', icon: 'mdi-list-status' },
  { title: '缺失等級', value: 'level', icon: 'mdi-alert-decagram-outline' },
  { title: '修繕進度', value: 'progress', icon: 'mdi-progress-wrench' },
  { title: '快選回覆', value: 'quickReply', icon: 'mdi-comment-quote-outline' },
]);
const selectedCategory = ref(['phase']);

// 用於儲存從後端獲取的選項資料
const inspectionOptions = reactive({
  phase: [], area: [], category: [], status: [], level: [], progress: [], quickReply: [],
});
const selectedMainCategory = ref(null); // ✓ 追蹤選中的主分類


// Headers
const simpleHeaders = ref([
  { title: '項目名稱', key: 'value', sortable: true }, { title: '排序', key: 'order', sortable: true, width: '100px' }, { title: '操作', key: 'actions', sortable: false, align: 'end', width: '100px' },
]);
const complexHeaders = ref([
  // 合併 value, color, icon 到 'preview'
  { title: '項目預覽 / 名稱', key: 'preview', sortable: true },
  { title: '排序', key: 'order', sortable: true, width: '100px' },
  { title: '操作', key: 'actions', sortable: false, align: 'end', width: '100px' },
]);

// MDI 圖示選項
const mdiIcons = ref([
  { title: '通過', value: 'mdi-check-circle' }, { title: '待修', value: 'mdi-tools' }, { title: '修繕中', value: 'mdi-progress-wrench' },
  { title: '完成', value: 'mdi-check-all' }, { title: '不影響', value: 'mdi-check-decagram-outline' }, { title: '未檢查', value: 'mdi-help-circle-outline' },
  { title: '客戶指定不處理', value: 'mdi-cancel' }, { title: '警告', value: 'mdi-alert-circle' }, { title: '錯誤', value: 'mdi-close-circle' },
  { title: '嚴重', value: 'mdi-alert-octagon' }, { title: '一般', value: 'mdi-alert' }, { title: '輕微', value: 'mdi-information-outline' },
  { title: '正常', value: 'mdi-thumb-up-outline' }, { title: '星星', value: 'mdi-star' }, { title: '旗幟', value: 'mdi-flag' },
  { title: '時鐘', value: 'mdi-clock-outline' }, { title: '日曆', value: 'mdi-calendar-blank-outline' },
]);

// --- Props & Project Info ---
const props = defineProps({ projectId: { type: String } });
const currentProjectId = ref(route.params.projectId || props.projectId);
const projectName = computed(() => projectStore.idToNameMap[currentProjectId.value] || '');

// --- ✓ 計算屬性 (工程種類) ---
const mainCategories = computed(() =>
  inspectionOptions.category.filter(item => !item.parentValue)
);
const subItemsOfSelectedCategory = computed(() => {
  if (!selectedMainCategory.value) return [];
  return inspectionOptions.category.filter(item => item.parentValue === selectedMainCategory.value.value);
});


// --- Edit Dialog State ---
const editFormRef = ref(null);
const editDialog = reactive({
  visible: false, isEdit: false, loading: false,
  // ✓ 加入 parentValue
  item: { id: null, type: '', value: '', order: 100, color: null, icon: null, parentValue: null },
  typeName: '',
});
const colorMenuVisible = ref(false);
const tempColor = ref(null);
const originalColor = ref(null);

// --- Delete Dialog State ---
const deleteDialog = reactive({ visible: false, loading: false, item: null, typeName: '', });

// --- ✓ Excel 匯入 Dialog State ---
const importDialog = reactive({
  visible: false,
  isParsing: false,
  isImporting: false,
  error: '',
  previewData: [],
  previewLimit: 10,
  // ✓ 預覽表頭
  previewHeaders: [
    { title: '分類類別', key: 'type' },
    { title: '項目名稱', key: 'value' },
    { title: '父分類', key: 'parentValue' },
    { title: '顏色', key: 'color' },
    { title: '圖示', key: 'icon' },
    { title: '排序', key: 'order' },
  ],
  fileInputKey: Date.now(), // 用於重置 v-file-input
});


// --- Helper Functions ---
function getCategoryNameByType(type) {
  const category = categories.value.find(c => c.value === type);
  return category ? category.title : '項目';
}
function showSnackbar(text, color = 'success') {
  snackbar.text = text;
  snackbar.color = color;
  snackbar.show = true;
}

// --- Dialog 開啟/關閉 函數 ---
function openColorMenu() {
  originalColor.value = editDialog.item.color;
  tempColor.value = editDialog.item.color;
  colorMenuVisible.value = true;
}
function confirmColorSelection() {
  editDialog.item.color = tempColor.value;
  colorMenuVisible.value = false;
}
function cancelColorSelection() {
  colorMenuVisible.value = false;
}
function openAddItemDialog(type) {
  // ✓ 重置 item，包含 parentValue
  editDialog.item = { id: null, type: type, value: '', order: 100, color: null, icon: null, parentValue: null };
  editDialog.typeName = getCategoryNameByType(type);
  editDialog.isEdit = false;
  tempColor.value = null;
  originalColor.value = null;
  editDialog.visible = true;
}

// ✓ 新增：專門用於打開新增 "主分類" 的 Dialog
function openAddMainCategoryDialog() {
  openAddItemDialog('category'); // parentValue 預設為 null
}

// ✓ 新增：專門用於打開新增 "子項目" 的 Dialog
function openAddSubItemDialog() {
  if (!selectedMainCategory.value) return;
  // ✓ 自動帶入 parentValue
  editDialog.item = { id: null, type: 'category', value: '', order: 100, color: null, icon: null, parentValue: selectedMainCategory.value.value };
  editDialog.typeName = '工程種類子項目'; // ✓ 明確指定 typeName
  editDialog.isEdit = false;
  tempColor.value = null;
  originalColor.value = null;
  editDialog.visible = true;
}

function openEditItemDialog(item) {
  // ✓ 複製 item 資料，包含 parentValue
  editDialog.item = { ...item };
  // ✓ 如果是子項目，typeName 特別標註
  editDialog.typeName = item.parentValue ? '工程種類子項目' : getCategoryNameByType(item.type);
  editDialog.isEdit = true;
  tempColor.value = item.color;
  originalColor.value = item.color;
  editDialog.visible = true;
}

function closeEditDialog() {
  editDialog.visible = false;
  setTimeout(() => {
    if (editFormRef.value) editFormRef.value.resetValidation();
    // ✓ 重置 item 時包含 parentValue
    editDialog.item = { id: null, type: '', value: '', order: 100, color: null, icon: null, parentValue: null };
  }, 300);
}

function openDeleteItemDialog(item) {
  deleteDialog.item = item;
  deleteDialog.typeName = getCategoryNameByType(item.type);
  deleteDialog.visible = true;
}
function closeDeleteDialog() {
  deleteDialog.visible = false;
  setTimeout(() => deleteDialog.item = null, 300);
}

// --- ✓ 工程種類表格操作 ---
function handleMainCategoryClick(event, { item }) {
  // item 應為 { id, type, value, ... }
  if (selectedMainCategory.value?.id === item.id) {
    selectedMainCategory.value = null; // 再次點擊取消選中
  } else {
    selectedMainCategory.value = item; // 選中新的主分類
  }
}

// ✓ 給主分類表格行添加樣式
const mainCategoryRowProps = ({ item }) => {
  return {
    class: selectedMainCategory.value?.id === item.id ? 'selected-row' : '',
    style: 'cursor: pointer;'
  }
};


// --- Dialog 操作函數 (更新 saveItem) ---
async function saveItem() {
  if (!editFormRef.value) return;
  const { valid } = await editFormRef.value.validate();
  if (!valid) return;

  editDialog.loading = true;
  try {
    const payload = {
      projectId: currentProjectId.value,
      optionData: {
        type: editDialog.item.type,
        value: editDialog.item.value,
        order: editDialog.item.order,
        color: editDialog.item.color || null,
        icon: editDialog.item.icon || null,
        parentValue: editDialog.item.parentValue || null, // ✓ 加入 parentValue
      },
    };
    if (editDialog.isEdit) {
      payload.optionId = editDialog.item.id;
    }

    const result = await saveInspectionOption(payload);

    if (result.status === 'success') {
      showSnackbar(editDialog.isEdit ? '更新成功' : '新增成功');
      closeEditDialog();
      await loadInitialData(); // 重新載入數據
      // ✓ 如果是新增/編輯子項目，保持主分類選中狀態
      // (如果 loadInitialData 效率高，這步可能不需要)
      // if (payload.optionData.parentValue && !editDialog.isEdit) {
      //   // Maybe re-select main category if needed after reload
      // }
    } else {
      throw new Error(result.message || '儲存失敗');
    }
  } catch (error) {
    showSnackbar(`儲存失敗: ${error.message}`, 'error');
  } finally {
    editDialog.loading = false;
  }
}

async function confirmDeleteItem() {
  if (!deleteDialog.item?.id) return;
  deleteDialog.loading = true;
  const itemToDelete = { ...deleteDialog.item }; // 複製一份，防止 Dialog 關閉後 item 變 null

  try {
    const result = await deleteInspectionOption({ optionId: itemToDelete.id });
    if (result.status === 'success') {
      showSnackbar('刪除成功');
      closeDeleteDialog();
      await loadInitialData(); // 重新載入數據
      // ✓ 如果刪除的是當前選中的主分類，清除選中狀態
      if (itemToDelete.type === 'category' && !itemToDelete.parentValue && selectedMainCategory.value?.id === itemToDelete.id) {
        selectedMainCategory.value = null;
      }
    } else {
      throw new Error(result.message || '刪除失敗');
    }
  } catch (error) {
    showSnackbar(`刪除失敗: ${error.message}`, 'error');
  } finally {
    deleteDialog.loading = false;
  }
}

// --- ✓ Excel 匯入相關函數 ---
function openImportDialog() {
  clearPreview(); // 清除上次狀態
  importDialog.visible = true;
}

function closeImportDialog() {
  importDialog.visible = false;
  clearPreview();
}

function downloadTemplate() {
  const link = document.createElement('a');
  // ✓ 更新範本路徑
  link.href = '/excel-templates/驗屋分類細項上傳範本.xlsx';
  link.setAttribute('download', '驗屋分類細項上傳範本.xlsx');
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

function handleFileUpload(event) {
  const file = event.target.files && event.target.files[0];
  importDialog.error = '';
  importDialog.previewData = [];

  if (!file) return;

  importDialog.isParsing = true;
  const reader = new FileReader();

  reader.onload = (e) => {
    try {
      const data = new Uint8Array(e.target.result);
      const workbook = XLSX.read(data, { type: 'array' });
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];
      // ✓ header: 1 讀取原始表頭，defval: '' 將空單元格設為空字串
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });

      if (!jsonData || jsonData.length < 2) throw new Error('Excel 檔案為空或缺少標頭行。');

      const headerRow = jsonData[0].map(h => String(h).trim());
      // ✓ 定義表頭索引
      const typeIndex = headerRow.indexOf('分類類別');
      const valueIndex = headerRow.indexOf('項目名稱');
      const parentIndex = headerRow.indexOf('父分類名稱');
      const colorIndex = headerRow.indexOf('顏色');
      const iconIndex = headerRow.indexOf('圖示');
      const orderIndex = headerRow.indexOf('排序');

      // ✓ 驗證必要表頭
      if (typeIndex === -1 || valueIndex === -1) {
        throw new Error('Excel 缺少必要的標頭："分類類別" 和 "項目名稱"。');
      }

      const parsed = jsonData.slice(1)
        .map((row, rowIndex) => ({
          typeRaw: String(row[typeIndex]).trim(), // 保留原始輸入以供驗證
          value: String(row[valueIndex]).trim(),
          parentValue: parentIndex > -1 ? String(row[parentIndex]).trim() : null,
          color: colorIndex > -1 ? String(row[colorIndex]).trim() : null,
          icon: iconIndex > -1 ? String(row[iconIndex]).trim() : null,
          order: orderIndex > -1 ? parseInt(String(row[orderIndex]).trim(), 10) : 100, // 解析數字，預設 100
          _rowNum: rowIndex + 2 // 記錄原始行號用於報錯
        }))
        .filter(item => item.typeRaw && item.value); // 過濾掉缺少類別或名稱的行

      // ✓ 轉換 typeRaw 為 type value
      const typeMap = {
        '驗屋階段': 'phase', '檢查區域': 'area', '工程種類': 'category',
        '檢查狀態': 'status', '缺失等級': 'level', '修繕進度': 'progress',
        '檢查說明快選回覆': 'quickReply'
      };

      const finalParsed = [];
      let rowErrors = [];
      parsed.forEach(item => {
        const mappedType = typeMap[item.typeRaw];
        if (mappedType) {
          finalParsed.push({
            type: mappedType,
            value: item.value,
            parentValue: item.parentValue || null, // 確保是 null
            color: item.color || null,
            icon: item.icon || null,
            order: isNaN(item.order) ? 100 : item.order, // 再次確保 order 是數字
          });
        } else {
          rowErrors.push(`第 ${item._rowNum} 行的「分類類別」(${item.typeRaw}) 無效。`);
        }
        // 可在此加入更多驗證，例如 color/icon 格式
      });

      if (rowErrors.length > 0) {
        importDialog.error = rowErrors.join('\n');
      }
      if (finalParsed.length === 0 && !importDialog.error) {
         importDialog.error = '在 Excel 中找不到有效的資料。請檢查內容或標頭。';
      }
      importDialog.previewData = finalParsed;

    } catch (error) {
      console.error("解析 Excel 失敗:", error);
      importDialog.error = `解析 Excel 失敗: ${error.message}`;
    } finally {
       importDialog.isParsing = false;
    }
  };

  reader.onerror = (error) => {
     console.error("讀取檔案錯誤:", error);
     importDialog.error = '讀取檔案時發生錯誤。';
     importDialog.isParsing = false;
  };

  reader.readAsArrayBuffer(file);
}

function clearPreview() {
  importDialog.previewData = [];
  importDialog.error = '';
  // ✓ 使用 key 來強制重新渲染 v-file-input 以清除選中檔案
  importDialog.fileInputKey = Date.now();
  // 或者嘗試直接重置 input value (可能因瀏覽器安全限制失效)
  const fileInput = document.querySelector('#excel-inspection-options-import-input input[type="file"]');
  if (fileInput) fileInput.value = null;
}

async function confirmImport() {
  if (!importDialog.previewData.length || !currentProjectId.value) return;
  importDialog.isImporting = true;
  showSnackbar('開始匯入資料，請稍候...', 'info');
  try {
    // ✓ 呼叫後端 API
    const result = await batchImportInspectionOptions({
      projectId: currentProjectId.value,
      importData: importDialog.previewData
    });

    console.log('Backend import result:', result);

    if (result.status === 'success') {
      showSnackbar(`匯入完成！新增 ${result.importedCount || 0} 筆，更新 ${result.updatedCount || 0} 筆。`, 'success');
      closeImportDialog();
      await loadInitialData(); // 重新載入數據
    } else {
      // ✓ 顯示後端回傳的錯誤
      importDialog.error = `匯入失敗: ${result.message || '未知錯誤'}\n${(result.errors || []).join('\n')}`;
      showSnackbar('匯入失敗，請檢查預覽區錯誤訊息', 'error');
    }
  } catch (error) {
    console.error("匯入 API 呼叫失敗:", error);
    importDialog.error = `匯入失敗: ${error.message}`; // 顯示 API 呼叫錯誤
    showSnackbar(`匯入失敗: ${error.message}`, 'error');
  } finally {
    importDialog.isImporting = false;
  }
}




// --- ✓ Excel 匯出函數 ---
async function handleExport() {
  if (!currentProjectId.value) {
    showSnackbar('錯誤：缺少建案 ID', 'error');
    return;
  }

  const confirmed = window.confirm(`您確定要匯出建案 "${projectName.value || currentProjectId.value}" 的所有驗屋選項嗎？`);
  if (!confirmed) {
    return; // 如果使用者取消，則中止函數
  }

  isExporting.value = true;
  showSnackbar('正在準備匯出檔案...', 'info');

  try {
    const result = await exportInspectionOptionsToExcel({ projectId: currentProjectId.value });

    if (result.status === 'success' && result.downloadUrl) {
      // 創建臨時下載連結
      const link = document.createElement('a');
      link.href = result.downloadUrl;

      // 建議的檔案名稱
      const date = new Date().toISOString().slice(0, 10);
      link.setAttribute('download', `${projectName.value || currentProjectId.value}_驗屋選項匯出_${date}.xlsx`);

      // 觸發下載
      document.body.appendChild(link);
      link.click();

      // 清理
      document.body.removeChild(link);
      showSnackbar('Excel 檔案已開始下載', 'success');
    } else {
      throw new Error(result.message || '無法獲取下載連結');
    }
  } catch (error) {
    console.error("匯出失敗:", error);
    showSnackbar(`匯出失敗: ${error.message}`, 'error');
  } finally {
    isExporting.value = false;
  }
}


// --- Data Loading ---
async function loadInitialData() {
  isLoading.value = true;
  selectedMainCategory.value = null; // ✓ 載入前清除選中
  Object.keys(inspectionOptions).forEach(key => inspectionOptions[key] = []);

  if (projectStore.projectsList.length === 0) {
    await projectStore.fetchProjects();
  }
  if (!currentProjectId.value) { /* ... (error handling) ... */ return; }
  console.log(`載入建案 ${currentProjectId.value} (${projectName.value}) 的驗屋選項...`);
  try {
    const result = await getInspectionOptions({ projectId: currentProjectId.value });
    if (result.status === 'success') {
      Object.assign(inspectionOptions, result.data);
      console.log('Inspection options loaded:', inspectionOptions);
    } else { throw new Error(result.message || '無法載入選項資料'); }
  } catch (error) { showSnackbar(`載入選項失敗: ${error.message}`, 'error');
  } finally { isLoading.value = false; }
}

// --- Lifecycle Hooks & Watchers ---
onMounted(() => {
  if (route.params.projectId) currentProjectId.value = route.params.projectId;
  loadInitialData();
});
watch(() => props.projectId, (newVal) => {
  if (newVal && newVal !== currentProjectId.value) {
    currentProjectId.value = newVal;
    loadInitialData();
  }
});
watch(() => route.params.projectId, (newVal) => {
  if (newVal && newVal !== currentProjectId.value) {
    currentProjectId.value = newVal;
    loadInitialData();
  }
});

</script>

<style scoped>
/* ✓ 增加選中行的樣式 (與 InspProjectSettings 一致) */
.selected-row {
  background-color: #E3F2FD !important; /* Vuetify 藍色 50 */
  font-weight: bold;
}

.v-list-item--active {
  background-color: rgba(var(--v-theme-primary), 0.1);
}
.v-window-item {
  min-height: 300px;
}
:deep(.v-data-table td:last-child) {
  vertical-align: middle;
}
:deep(.v-select .v-list-item-title) {
  display: flex;
  align-items: center;
}
/* 微調顏色輸入框樣式 */
.color-input-field :deep(.v-field__input) {
  padding-left: 0 !important;
}
.color-input-field :deep(.v-field__prepend-inner) {
  padding-top: 10px; /* 微調垂直位置 */
  padding-right: 0;
}
/* 預覽區域樣式 */
.preview-section {
  padding: 10px;
  background-color: #f5f5f5; /* 淺灰色背景 */
  border-radius: 4px;
}
</style>