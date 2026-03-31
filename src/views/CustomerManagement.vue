<template>
  <v-container>
    <v-tabs v-model="tab" color="primary" grow>
      <v-tab value="management">客戶資料管理</v-tab>
      <v-tab value="leadDistribution" >聯絡名單</v-tab>
      <v-tab value="downloadLeads" v-if="canManageSettings">下載客資</v-tab>
      <v-tab value="settings" v-if="isSuperAdmin" class="admin-tab">
        <v-icon start size="small">mdi-shield-crown</v-icon>客資系統設定
      </v-tab>
      <v-tab value="vipSettings" v-if="isSuperAdmin" class="admin-tab">
        <v-icon start size="small">mdi-shield-crown</v-icon>貴賓資料設定
      </v-tab>
      <v-tab value="otherSettings" v-if="isSuperAdmin" class="admin-tab">
        <v-icon start size="small">mdi-shield-crown</v-icon>其他設定
      </v-tab>
      <v-tab value="batchUpdate" v-if="isSuperAdmin" class="admin-tab">
        <v-icon start size="small">mdi-shield-crown</v-icon>客資批次更新
      </v-tab>
      <v-tab value="anxiSettings" v-if="isSuperAdmin" class="admin-tab">
        <v-icon start size="small">mdi-shield-crown</v-icon>ANXI系統設定
      </v-tab>
      </v-tabs>

    <v-window v-model="tab">
      <v-window-item value="management">
        <v-card class="bg-grey-lighten-5 h-100">
          <v-toolbar color="white" elevation="1" density="compact">
            <v-toolbar-title class="text-subtitle-1 font-weight-bold text-grey-darken-3" style="min-width: 0;">
              <!-- ✅ 專案切換選單 -->
              <v-menu v-if="availableProjects.length > 1">
                <template v-slot:activator="{ props: menuProps }">
                  <v-btn
                    v-bind="menuProps"
                    variant="text"
                    class="px-1 font-weight-bold text-grey-darken-3 text-none toolbar-project-btn"
                    append-icon="mdi-chevron-down"
                    :size="isMobile ? 'small' : 'default'"
                  >
                    <span class="text-truncate" style="max-width: 40vw;">
                      {{ projectName }}
                    </span>
                    <span v-if="!isMobile" class="ml-1">客戶資料列表</span>
                  </v-btn>
                </template>
                <v-list density="compact">
                  <v-list-item
                    v-for="proj in availableProjects"
                    :key="proj.id"
                    :value="proj.id"
                    @click="switchProject(proj.id)"
                    :active="proj.id === props.projectId"
                    color="primary"
                  >
                    <v-list-item-title>{{ proj.name }}</v-list-item-title>
                  </v-list-item>
                </v-list>
              </v-menu>
              <span v-else class="text-truncate d-inline-block" style="max-width: 45vw; vertical-align: middle;">
                {{ projectName }} <span v-if="!isMobile">客戶資料列表</span>
              </span>
            </v-toolbar-title>
            <v-spacer></v-spacer>
            <!-- ✅ 重新整理按鈕 -->
            <v-tooltip text="重新整理" location="bottom">
              <template v-slot:activator="{ props: tipProps }">
                <v-btn
                  v-bind="tipProps"
                  color="primary"
                  variant="text"
                  :size="isMobile ? 'small' : 'default'"
                  :icon="isMobile"
                  :prepend-icon="isMobile ? undefined : 'mdi-refresh'"
                  @click="loadCustomerList"
                  class="mr-1"
                  :loading="isLoadingCustomerList"
                >
                  <v-icon v-if="isMobile">mdi-refresh</v-icon>
                  <template v-if="!isMobile">重新整理</template>
                </v-btn>
              </template>
            </v-tooltip>
            <!-- ✅ 新增客戶按鈕 -->
            <v-tooltip text="新增客戶" location="bottom">
              <template v-slot:activator="{ props: tipProps }">
                <v-btn
                  v-bind="tipProps"
                  color="teal"
                  variant="flat"
                  :size="isMobile ? 'small' : 'default'"
                  :icon="isMobile"
                  :prepend-icon="isMobile ? undefined : 'mdi-account-plus'"
                  @click="openAddCustomerDialog"
                  class="mr-1"
                >
                  <v-icon v-if="isMobile">mdi-account-plus</v-icon>
                  <template v-if="!isMobile">新增客戶</template>
                </v-btn>
              </template>
            </v-tooltip>
          </v-toolbar>

<v-card-text>
  <v-row dense align="center" class="mb-2">
    <v-col cols="12" sm="8" md="9">
      <v-text-field
        v-model="customerListSearch"
        label="關鍵字搜尋 (姓名、電話...)"
        prepend-inner-icon="mdi-magnify"
        variant="outlined"
        density="comfortable"
        clearable
        hide-details
        class="bg-white rounded-lg"
      ></v-text-field>
    </v-col>
    <v-col cols="12" sm="4" md="3">
      <v-btn
        block
        :color="showFilters ? 'primary' : 'grey-darken-1'"
        variant="tonal"
        size="large"
        rounded="lg"
        @click="showFilters = !showFilters"
        :prepend-icon="showFilters ? 'mdi-filter-variant-remove' : 'mdi-filter-variant'"
      >
        {{ showFilters ? '隱藏進階篩選' : '進階篩選' }}
      </v-btn>
    </v-col>
  </v-row>

  <v-expand-transition>
    <v-card v-show="showFilters" variant="outlined" class="mb-4 pa-4 rounded-xl border-dashed bg-white">
      <v-row dense>
        <v-col cols="6" md="3">
          <v-text-field
            v-model="advFilter.startDate"
            label="拜訪日期(起)"
            type="date"
            variant="outlined"
            density="compact"
            hide-details
            rounded="lg"
          ></v-text-field>
        </v-col>
        <v-col cols="6" md="3">
          <v-text-field
            v-model="advFilter.endDate"
            label="拜訪日期(迄)"
            type="date"
            variant="outlined"
            density="compact"
            hide-details
            rounded="lg"
            :min="advFilter.startDate"
            :disabled="!advFilter.startDate"
          ></v-text-field>
        </v-col>

        <v-col cols="12" sm="6" md="3">
          <v-select
            v-model="advFilter.sales"
            :items="availableSalesNames"
            label="銷售人員"
            multiple
            chips
            variant="outlined"
            density="compact"
            hide-details
            rounded="lg"
          ></v-select>
        </v-col>
        <v-col cols="12" sm="6" md="3">
          <v-select
            v-model="advFilter.ratings"
            :items="['A意願高', 'B有機會', 'C需考慮', 'D無希望']"
            label="等級"
            multiple
            chips
            variant="outlined"
            density="compact"
            hide-details
            rounded="lg"
          ></v-select>
        </v-col>

        <v-col cols="12" sm="6" md="3">
                  <v-select
            v-model="advFilter.reasons"
            :items="[...new Set(settings.fields.noPurchaseReason?.options || [])]"
            label="未買原因"
            multiple
            chips
            variant="outlined"
            density="compact"
            hide-details
            rounded="lg"
          ></v-select>
                  </v-col>
        <v-col cols="12" sm="6" md="3">
          <v-select
            v-model="advFilter.motivations"
            :items="settings.vipFormFields.motivation?.options || []"
            label="購屋動機"
            multiple
            chips
            variant="outlined"
            density="compact"
            hide-details
            rounded="lg"
          ></v-select>
        </v-col>
        <v-col cols="12" sm="6" md="3">
          <v-select
            v-model="advFilter.roomTypes"
            :items="settings.vipFormFields.roomType?.options || []"
            label="房型需求"
            multiple
            chips
            variant="outlined"
            density="compact"
            hide-details
            rounded="lg"
          ></v-select>
        </v-col>
        <v-col cols="12" sm="6" md="3">
          <v-select
            v-model="advFilter.budgets"
            :items="settings.vipFormFields.budget?.options || []"
            label="購屋預算"
            multiple
            chips
            variant="outlined"
            density="compact"
            hide-details
            rounded="lg"
          ></v-select>
        </v-col>
        <v-col cols="12" sm="6" md="3" v-if="isCurrentUserCounter">
          <v-switch
            v-model="advFilter.showDeleted"
            label="顯示已刪除"
            color="red"
            hide-details
            density="compact"
            class="mt-1"
          ></v-switch>
        </v-col>
      </v-row>

      <v-card-actions class="justify-end pa-0 mt-2">
        <v-btn variant="text" color="grey" @click="resetAdvFilters">清除條件</v-btn>
      </v-card-actions>
    </v-card>
  </v-expand-transition>

            <div v-if="isLoadingCustomerList" class="text-center pa-10">
              <v-progress-circular indeterminate color="primary" size="50"></v-progress-circular>
              <p class="mt-3 text-grey">正在獲取客戶資料...</p>
            </div>

            <template v-else>
              <v-data-iterator
                v-if="isMobile"
                :items="filteredCustomerList"
                item-value="docId"
                v-model:page="mobilePage"
                :items-per-page="10"
              >
              <template v-slot:default="{ items }">
    <v-row dense>
      <v-col v-for="item in items" :key="item.raw.docId || item.raw.phone" cols="12">
        <v-card 
          variant="flat" 
          class="mb-2 border-s-lg" 
          :style="{ borderLeftColor: getRatingColorHex(item.raw['等級研判']) + ' !important' }"
          @click="openInteractionLog(null, { item: item.raw })"
        >
          <v-card-text class="pa-3">
            <div class="d-flex justify-space-between align-center mb-1">
              <span class="text-subtitle-1 font-weight-bold" :class="{'text-decoration-line-through text-grey': item.raw.isDeleted}">
                {{ item.raw['姓名'] || '未知姓名' }}
                <v-chip v-if="item.raw.isDeleted" color="red" size="x-small" label class="ml-1">已刪除</v-chip>
              </span>

              
              <v-chip :color="getRatingColor(item.raw['等級研判'])" size="x-small" label variant="flat">
                {{ item.raw['等級研判'] || '未定級' }}
              </v-chip>
            </div>
            
            <div class="d-flex align-center text-caption text-grey-darken-1 mb-1">
              <v-icon size="14" start>mdi-phone</v-icon>
              {{ item.raw['電話'] }}
              <v-spacer></v-spacer>
              <v-icon size="14" start>mdi-account-tie</v-icon>
              {{ item.raw['銷售人員'] || '未指派' }}
            </div>

            <div class="d-flex align-center text-caption text-grey">
            <v-icon size="14" start>mdi-calendar-clock</v-icon>
            拜訪：{{ formatDisplayDate(item.raw['拜訪日期']) }}
            <v-spacer></v-spacer>
            <span v-if="item.raw.updatedAt" class="text-blue-grey-lighten-2">
              更新：{{ formatFullDateTime(item.raw.updatedAt) }}
            </span>
          </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <div v-if="items.length > 0" class="d-flex align-center justify-center pa-4">
      <v-pagination
        v-model="mobilePage"
        :length="Math.ceil(filteredCustomerList.length / 10)"
        density="compact"
        total-visible="5"
        color="primary"
      ></v-pagination>
    </div>
  </template>

  <template v-slot:no-data>
    <div class="text-center text-grey pa-10">
      <v-icon size="64" color="grey-lighten-2">mdi-account-search-outline</v-icon>
      <p class="mt-2">找不到符合的客資資料</p>
    </div>
  </template>
                </v-data-iterator>

              <v-data-table
                v-else
                :headers="customerTableHeaders"
                :items="filteredCustomerList"
                :sort-by="[{ key: '拜訪日期', order: 'desc' }]"
                item-value="docId"
                class="elevation-1 cursor-pointer-row"
                @click:row="openInteractionLog"
                hover
              >
              <template v-slot:item.updatedAt="{ item }">
                  <div class="text-caption text-grey-darken-1 d-flex flex-column">
                    <span>{{ formatFullDateTime(item.updatedAt) }}</span>
                    <v-chip v-if="item.isDeleted" color="red" size="x-small" label class="align-self-start mt-1">已刪除</v-chip>
                    <v-chip v-if="item.isLinked" color="indigo" size="x-small" label variant="tonal" class="align-self-start mt-1" prepend-icon="mdi-link-variant">
                      {{ projectStore.idToNameMap[item.sourceProjectId] || '關聯' }}
                    </v-chip>
                  </div>
                </template>

              <template v-slot:item.拜訪日期="{ item }">
                {{ formatDisplayDate(item['拜訪日期']) }}
              </template>

    
              <template v-slot:item.等級研判="{ item }">
                <v-chip
                  v-if="item['等級研判']"
                  :color="getRatingColor(item['等級研判'])"
                  size="small"
                  label
                  variant="flat"
                  class="font-weight-bold"
                >
                  {{ item['等級研判'] }}
                </v-chip>
              </template>

              <template v-slot:item.未買原因="{ item }">
                <div v-if="Array.isArray(item['未買原因']) && item['未買原因'].length > 0" class="text-caption text-grey-darken-2 text-truncate" style="max-width: 150px;">
                  {{ item['未買原因'].join(', ') }}
                </div>
              </template>

              <template v-slot:item.購屋動機="{ item }">
                <v-chip
                  v-if="Array.isArray(item['購屋動機']) && item['購屋動機'].length"
                  :color="getChipColor(item['購屋動機'][0])"
                  size="small"
                  label
                  variant="tonal"
                >
                  {{ item['購屋動機'][0] }}
                </v-chip>
                <span v-if="Array.isArray(item['購屋動機']) && item['購屋動機'].length > 1" class="text-caption text-grey ml-1">
                  (+{{ item['購屋動機'].length - 1 }})
                </span>
              </template>

              <template v-slot:item.房型需求="{ item }">
                <div v-if="Array.isArray(item['房型需求'])" class="text-caption">
                  {{ item['房型需求'].join(', ') }}
                </div>
              </template>    
            </v-data-table>
            </template>
          <CustomerInteractionLog
    v-if="isInteractionDialogVisible"
    v-model:show="isInteractionDialogVisible"
    :project-id="projectId"
    :project-name="projectName"
    :doc-id="selectedCustomerDocId"
    :sales-name="selectedCustomerSalesName"
    :settings="settings"
    @data-updated="loadCustomerList"
/>

          </v-card-text>
        </v-card>
      </v-window-item>

      <v-window-item value="leadDistribution">
    <LeadDistribution 
      :projectId="props.projectId" 
      :hide-back="true" 
    />
  </v-window-item>

      <v-window-item value="downloadLeads" v-if="canManageSettings">
  <v-container fluid class="bg-grey-lighten-5 pa-4">
    <v-card elevation="2" class="rounded-xl">
      <v-card-item>
        <v-card-title class="text-h6 font-weight-bold text-primary">
         客資報表下載
        </v-card-title>
        
      </v-card-item>

      <v-card-text>
        <v-row>
          <v-col cols="12" md="3">
  <v-text-field
    v-model="exportFilters.startDate"
    label="開始日期"
    type="date"
    variant="outlined"
    density="compact"
  ></v-text-field>
</v-col>

<v-col cols="12" md="3">
  <v-text-field
    v-model="exportFilters.endDate"
    label="結束日期"
    type="date"
    variant="outlined"
    density="compact"
    :min="exportFilters.startDate" 
  ></v-text-field> </v-col>

          <v-col cols="12">
  <div class="text-subtitle-2 mb-2 d-flex align-center">
    銷售人員篩選：
    <v-checkbox
      v-model="isAllSalesSelected"
      label="全選"
      density="compact"
      hide-details
      color="secondary"
      class="ml-4 font-weight-bold"
      :indeterminate="isSalesIndeterminate"
    ></v-checkbox>
  </div>
  
  <div class="d-flex flex-wrap gap-2">
    <v-checkbox
      v-for="sales in availableSalesNames"
      :key="sales"
      v-model="exportFilters.selectedSales"
      :label="sales"
      :value="sales"
      density="compact"
      hide-details
      color="primary"
      class="mr-4"
    ></v-checkbox>
  </div>
</v-col>
        </v-row>

        <v-divider class="my-4"></v-divider>

        <div class="d-flex align-center mt-4">
          <v-btn
            color="success"
            size="large"
            prepend-icon="mdi-download"
            :loading="isSimpleExporting"
            @click="executeSimpleExport"
            :disabled="!exportFilters.startDate || !exportFilters.endDate"
            class="mr-4"
          >
            下載客資報表
          </v-btn>

          <v-btn
            color="blue-grey"
            size="large"
            prepend-icon="mdi-google-spreadsheet"
            :loading="isSyncingToGoogle || googleSheetForm.isLoadingSheets"
            @click="openSyncDialog"
            :disabled="!exportFilters.startDate || !exportFilters.endDate"
          >
            同步到 Google Sheet
          </v-btn>
        </div>
      </v-card-text>
    </v-card>

    <!-- Google Sheet Sync Dialog -->
    <v-dialog v-model="googleSheetDialog" max-width="500px">
      <v-card>
        <v-card-title class="bg-blue-grey text-white">
          <v-icon start>mdi-google-spreadsheet</v-icon>
          同步資料到 Google Sheet
        </v-card-title>
        
        <v-card-text class="pt-6">
          <v-window v-model="googleSheetForm.step">
            <!-- Step 1: Input URL and Fetch Sheets -->
            <v-window-item :value="1">
              <p class="mb-4 text-body-2 text-grey-darken-1">
                請輸入目標 Google Sheet 的完整網址或是 ID。
                <br>
                <span class="text-caption text-red">* 請注意：您需要擁有該試算表的編輯權限。</span>
              </p>
              
              <v-text-field
                v-model="googleSheetForm.url"
                label="Google Sheet 網址 / ID"
                variant="outlined"
                placeholder="https://docs.google.com/spreadsheets/d/..."
                prepend-inner-icon="mdi-link"
                :error="!googleSheetForm.url && googleSheetForm.step === 1"
              ></v-text-field>
              
            </v-window-item>

            <!-- Step 2: Select Sheet and Confirm -->
            <v-window-item :value="2">
              <v-alert
                type="info"
                variant="tonal"
                class="mb-4 text-caption"
                icon="mdi-information"
              >
                為了讓系統能寫入資料，請將您的 Google Sheet 共用給以下 Email (編輯者權限)：
                <div class="font-weight-bold mt-1 text-selectable select-all">
                  {{ googleSheetForm.agentEmail || '讀取中...' }}
                </div>
              </v-alert>

               <v-select
                v-model="googleSheetForm.sheetName"
                :items="googleSheetForm.sheetNames"
                label="選擇要寫入的工作表 (Sheet)"
                variant="outlined"
                prepend-inner-icon="mdi-table"
                required
              ></v-select>

              <v-alert
                type="warning"
                variant="tonal"
                class="mt-2"
                icon="mdi-alert"
              >
                <strong>警告：</strong> 點擊同步後，該工作表 ({{ googleSheetForm.sheetName || '未選擇' }}) 的現有資料將被<strong>清除並覆蓋</strong>。
              </v-alert>

              <v-checkbox
                v-model="googleSheetForm.rememberUrl"
                label="將此網址設為本專案預設 (所有管理員共享)"
                density="compact"
                hide-details
                color="primary"
                class="mt-2"
              ></v-checkbox>
            </v-window-item>
          </v-window>
        </v-card-text>

        <v-card-actions class="pa-4">
          <v-spacer></v-spacer>
          <v-btn variant="text" @click="googleSheetDialog = false">取消</v-btn>
          
          <v-btn
            v-if="googleSheetForm.step === 1"
            color="primary"
            variant="flat"
            @click="fetchSheetNames"
            :loading="googleSheetForm.isLoadingSheets"
            :disabled="!googleSheetForm.url"
          >
            下一步
          </v-btn>
          
          <v-btn
            v-if="googleSheetForm.step === 2"
            color="success"
            variant="flat"
            @click="executeGoogleSync"
            :loading="isSyncingToGoogle"
            :disabled="!googleSheetForm.sheetName"
          >
            確認同步
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

  </v-container>
</v-window-item>

      <v-window-item value="settings" v-if="isSuperAdmin">
        <v-card class="admin-section-card">
          <v-banner
            icon="mdi-shield-lock"
            color="amber-darken-2"
            class="admin-banner"
            lines="one"
            density="comfortable"
          >
            <template v-slot:text>
              <span class="font-weight-bold">🔒 系統管理員專用區域</span>
              <span class="text-medium-emphasis ml-2">— 僅限超級管理員檢視與操作</span>
            </template>
          </v-banner>
          <v-toolbar color="blue-grey-lighten-5" >
            <v-toolbar-title class="text-subtitle-1">
              {{ projectName }} 客資系統欄位設定
            </v-toolbar-title>
            <v-spacer></v-spacer>
            <v-btn
              color="primary"
              variant="flat"
              @click="saveSettings"
              :loading="isSaving || isUploadingCover"
            >
              儲存設定
            </v-btn>
          </v-toolbar>

          <v-card-text v-if="isLoading" class="text-center pa-10">
            <v-progress-circular indeterminate color="primary"></v-progress-circular>
            <p class="mt-3 text-grey">正在載入設定...</p>
          </v-card-text>

          <v-card-text v-else class="pa-5">
            <v-expansion-panels v-model="panel" multiple>
              <v-expansion-panel
                v-for="(field, key) in settings.fields"
                :key="key"
                :title="field.label"
              >
                <v-expansion-panel-text>
                  <v-row dense align="center">
                    <v-col cols="12" md="3">
                      <v-switch
                        v-model="field.isRequired"
                        color="primary"
                        label="是否為必填"
                        
                        inset
                      ></v-switch>
                    </v-col>
                    <v-col cols="12" md="3">
                      <v-switch
                        v-if="field.hasOwnProperty('allowCustom')"
                        v-model="field.allowCustom"
                        color="primary"
                        label="允許自訂輸入"
                        
                        inset
                      ></v-switch>
                    </v-col>
                    <v-col cols="12" md="6">
                      <v-radio-group 
                        v-model="field.selectionMode" 
                        inline 
                         
                        label="選取模式"
                        class="mt-n2"
                      >
                        <v-radio label="單選" value="single"></v-radio>
                        <v-radio label="複選" value="multiple"></v-radio>
                      </v-radio-group>
                    </v-col>
                  </v-row>

                  <v-combobox
                    v-model="field.options"
                    label="編輯選項"
                    hint="按 Enter 新增項目，點擊 X 移除項目"
                    multiple
                    chips
                    deletable-chips
                    clearable
                    variant="outlined"
                    
                  >
                  </v-combobox>
                </v-expansion-panel-text>
              </v-expansion-panel>
            </v-expansion-panels>
          </v-card-text>
        </v-card>
      </v-window-item>

      <v-window-item value="vipSettings" v-if="isSuperAdmin">
        <v-card class="admin-section-card">
          <v-banner
            icon="mdi-shield-lock"
            color="amber-darken-2"
            class="admin-banner"
            lines="one"
            density="comfortable"
          >
            <template v-slot:text>
              <span class="font-weight-bold">🔒 系統管理員專用區域</span>
              <span class="text-medium-emphasis ml-2">— 僅限超級管理員檢視與操作</span>
            </template>
          </v-banner>
          <v-toolbar color="teal-lighten-5" >
            <v-toolbar-title class="text-subtitle-1">
              {{ projectName }} 貴賓資料設定
            </v-toolbar-title>
            <v-spacer></v-spacer>
            <v-btn
              color="primary"
              variant="flat"
              @click="saveSettings"
              :loading="isSaving || isUploadingCover" 
            >
              儲存設定
            </v-btn>
          </v-toolbar>

          <v-card-text v-if="isLoading" class="text-center pa-10">
            <v-progress-circular indeterminate color="primary"></v-progress-circular>
            <p class="mt-3 text-grey">正在載入設定...</p>
          </v-card-text>

          <v-card-text v-else class="pa-5">
            <v-alert type="info" variant="tonal" border="start"  class="mb-4">
              此頁面設定的選項，將用於客戶來訪時，在貴賓接待平板上自行填寫的欄位。
            </v-alert>

            <v-card variant="outlined" class="mb-6">
              <v-card-title class="text-subtitle-1 bg-grey-lighten-5">
                封面圖片設定
              </v-card-title>
              <v-card-text class="pt-4">
                <v-row>
                  <v-col cols="12" md="4">
                    <v-switch
                      v-model="settings.vipFormConfig.coverImage.show"
                      color="primary"
                      label="在貴賓表單顯示封面圖片"
                      
                      inset
                    ></v-switch>
                    
                    <v-file-input
                      v-model="coverImageFile"
                      label="上傳新圖片 (1920x1080)"
                      accept="image/png, image/jpeg"
                      variant="outlined"
                      
                      prepend-icon="mdi-image"
                      :loading="isUploadingCover"
                      @click:clear="coverImageFile = null"
                    ></v-file-input>
                    <div class="text-caption text-grey-darken-1 mt-n2 mb-2">
                      建議尺寸 1920x1080 (16:9)，檔案小於 500KB。
                    </div>
                  </v-col>
                  <v-col cols="12" md="8">
                    <v-card variant="tonal" min-height="150" class="pa-2 d-flex align-center justify-center">
                      <v-img
                        v-if="tempCoverImageUrl"
                        :src="tempCoverImageUrl"
                        aspect-ratio="16/9"
                        cover
                      >
                         <v-chip
                            color="warning"
                            size="x-small"
                            class="ma-1"
                            style="position: absolute; top: 0; left: 0;"
                          >
                            待儲存
                          </v-chip>
                      </v-img>
                      <v-img
                        v-else-if="settings.vipFormConfig.coverImage.url"
                        :src="settings.vipFormConfig.coverImage.url"
                        aspect-ratio="16/9"
                        cover
                      >
                        <v-btn
                          icon="mdi-close"
                          color="red"
                          variant="flat"
                          size="x-small"
                          class="ma-1"
                          style="position: absolute; top: 0; right: 0;"
                          @click="removeCoverImage"
                          :loading="isUploadingCover"
                        ></v-btn>
                      </v-img>
                      <span v-else class="text-grey">
                        圖片預覽
                      </span>
                    </v-card>
                  </v-col>
                </v-row>
              </v-card-text>
            </v-card>

            <v-card variant="outlined" class="mb-6">
              <v-card-title class="text-subtitle-1 bg-grey-lighten-5">
                連結設定
              </v-card-title>
              <v-card-text class="pt-4">
                <v-text-field
                  v-model="settings.vipFormConfig.projectWebsiteUrl"
                  label="建案網站"
                  hint="請輸入完整的網址 (例如 https://www.example.com)"
                  persistent-hint
                  variant="outlined"
                  
                  clearable
                ></v-text-field>
              </v-card-text>
            </v-card>
            
            <v-expansion-panels v-model="vipPanel" multiple>
              <v-expansion-panel
                v-for="(field, key) in settings.vipFormFields"
                :key="key"
                :title="field.label"
              >
                <v-expansion-panel-text>
                   <v-row dense align="center">
                    <v-col cols="12" md="3">
                      <v-switch
                        v-model="field.isRequired"
                        color="primary"
                        label="是否為必填"
                        
                        inset
                      ></v-switch>
                    </v-col>
                    <v-col cols="12" md="3">
                      <v-switch
                        v-if="field.hasOwnProperty('allowCustom')"
                        v-model="field.allowCustom"
                        color="primary"
                        label="允許自訂輸入"
                        
                        inset
                      ></v-switch>
                    </v-col>
                    <v-col cols="12" md="6">
                      <v-radio-group 
                        v-model="field.selectionMode" 
                        inline 
                         
                        label="選取模式"
                        class="mt-n2"
                      >
                        <v-radio label="單選" value="single"></v-radio>
                        <v-radio label="複選" value="multiple"></v-radio>
                      </v-radio-group>
                    </v-col>
                  </v-row>
                  <v-combobox
                    v-model="field.options"
                    label="編輯選項"
                    hint="按 Enter 新增項目，點擊 X 移除項目"
                    multiple
                    chips
                    deletable-chips
                    clearable
                    variant="outlined"
                    
                  >
                  </v-combobox>
                </v-expansion-panel-text>
              </v-expansion-panel>
            </v-expansion-panels>
          </v-card-text>
        </v-card>
      </v-window-item>

      <v-window-item value="otherSettings" v-if="isSuperAdmin">
        <v-card class="admin-section-card">
          <v-banner
            icon="mdi-shield-lock"
            color="amber-darken-2"
            class="admin-banner"
            lines="one"
            density="comfortable"
          >
            <template v-slot:text>
              <span class="font-weight-bold">🔒 系統管理員專用區域</span>
              <span class="text-medium-emphasis ml-2">— 僅限超級管理員檢視與操作</span>
            </template>
          </v-banner>
          <v-toolbar color="brown-lighten-5" >
            <v-toolbar-title class="text-subtitle-1">
              {{ projectName }} 其他設定
            </v-toolbar-title>
            <v-spacer></v-spacer>
            <v-btn
              color="primary"
              variant="flat"
              @click="saveSettings"
              :loading="isSaving || isUploadingCover"
            >
              儲存設定
            </v-btn>
          </v-toolbar>

          <v-card-text v-if="isLoading" class="text-center pa-10">
            <v-progress-circular indeterminate color="primary"></v-progress-circular>
            <p class="mt-3 text-grey">正在載入設定...</p>
          </v-card-text>

          <v-card-text v-else class="pa-5">
            <v-row>
              <v-col cols="12" md="6">
                <v-sheet border rounded class="pa-4">
                  <p class="text-subtitle-1 font-weight-bold">客資重複提醒-櫃台</p>
                  <v-switch
                    v-model="settings.reminderSettings.counterDuplicate.lineNotify"
                    label="LINE 提醒"
                    color="primary"
                    
                    inset
                  ></v-switch>
                  <v-switch
                    v-model="settings.reminderSettings.counterDuplicate.emailNotify"
                    label="EMAIL 提醒"
                    color="primary"
                    
                    inset
                  ></v-switch>
                </v-sheet>
              </v-col>
              <v-col cols="12" md="6">
                <v-sheet border rounded class="pa-4">
                  <p class="text-subtitle-1 font-weight-bold">客資重複提醒-銷售</p>
                  <v-switch
                    v-model="settings.reminderSettings.salesDuplicate.lineNotify"
                    label="LINE 提醒"
                    color="primary"
                    
                    inset
                  ></v-switch>
                  <v-switch
                    v-model="settings.reminderSettings.salesDuplicate.emailNotify"
                    label="EMAIL 提醒"
                    color="primary"
                    
                    inset
                  ></v-switch>
                </v-sheet>
              </v-col>
            </v-row>
          </v-card-text>
        </v-card>
      </v-window-item>

      <v-window-item value="anxiSettings" v-if="isSuperAdmin">
        <v-card>
          <v-toolbar color="red-lighten-5" >
            <v-toolbar-title class="text-subtitle-1 text-red-darken-2">
              <v-icon start>mdi-cog-sync</v-icon>
              ANXI 系統設定 (限超管、系管使用)
            </v-toolbar-title>
            <v-spacer></v-spacer>
            <v-btn
              color="primary"
              variant="flat"
              @click="saveSettings"
              :loading="isSaving || isUploadingCover"
            >
              儲存設定
            </v-btn>
          </v-toolbar>

          <v-card-text v-if="isLoading" class="text-center pa-10">
            <v-progress-circular indeterminate color="primary"></v-progress-circular>
            <p class="mt-3 text-grey">正在載入設定...</p>
          </v-card-text>

          <v-card-text v-else class="pa-5">
            <v-alert
              type="warning"
              variant="tonal"
              border="start"
              
              class="mb-6"
            >
              警告：此處為高階系統設定，錯誤的修改可能導致客資系統功能（如LINE通知）失效。
            </v-alert>

            <v-text-field
              v-model="settings.anxiSystemConfig.lineCrmChannelAccessTokenSecretName"
              label="客資系統 LINE Channel Access Token 密鑰名稱"
              hint="請輸入在 Google Secret Manager 中的完整密鑰名稱 (例如：CUSTOMER_CRM_LINE_TOKEN)"
              persistent-hint
              variant="outlined"
            ></v-text-field>
          </v-card-text>
        </v-card>
      </v-window-item>

      <v-window-item value="batchUpdate">
        <v-banner
          icon="mdi-shield-lock"
          color="amber-darken-2"
          class="admin-banner"
          lines="one"
          density="comfortable"
        >
          <template v-slot:text>
            <span class="font-weight-bold">🔒 系統管理員專用區域</span>
            <span class="text-medium-emphasis ml-2">— 僅限超級管理員檢視與操作</span>
          </template>
        </v-banner>
        <v-container fluid class="h-100 bg-grey-lighten-5 pa-4">
          <v-row>
            <v-col cols="12" md="6">
              <v-card class="mb-4" elevation="2">
                <v-card-item>
                  <v-card-title class="text-h6 font-weight-bold text-primary">
                    <v-icon start>mdi-download</v-icon> 資料匯出 (Export)
                  </v-card-title>
                  <v-card-subtitle>下載完整客資與互動紀錄</v-card-subtitle>
                </v-card-item>
                
                <v-card-text>
                  
                  <v-btn 
                    block 
                    color="primary" 
                    size="large" 
                    :loading="batchState.isExporting"
                    @click="executeBatchExport"
                  >
                    下載 Excel 報表
                  </v-btn>
                </v-card-text>
              </v-card>
            </v-col>

            <v-col cols="12" md="6">
              <v-card elevation="2">
                <v-card-item>
                  <v-card-title class="text-h6 font-weight-bold text-red-darken-1">
                    <v-icon start>mdi-upload</v-icon> 資料匯入 (Import)
                  </v-card-title>
                  <v-card-subtitle>批次新增或更新資料</v-card-subtitle>
                </v-card-item>

                <v-card-text>
                  <v-alert type="warning" variant="tonal" density="compact" class="mb-4">
                    <v-icon start size="small">mdi-alert</v-icon> 
                    <b>注意：</b> 匯入將以「電話」為主鍵。<br>
                    若電話存在，系統將<b>覆蓋</b>現有資料 (包含互動紀錄)。
                  </v-alert>

                  <v-file-input
                      v-model="batchState.uploadFile"
                      label="選擇 Excel 檔案 (.xlsx)"
                      accept=".xlsx, .xls"
                      variant="outlined"
                      prepend-icon=""
                      prepend-inner-icon="mdi-file-excel"
                      show-size
                      dense
                      :loading="isParsingExcel"
                      @update:model-value="handleBatchUploadFile" 
                    ></v-file-input>

                  <div v-if="uploadStatusMessage" :class="uploadStatusType === 'success' ? 'text-success' : 'text-error'" class="text-caption mb-2">
                          {{ uploadStatusMessage }}
                        </div>

                        <v-btn 
                          block 
                          color="red-darken-1" 
                          size="large"
                          :disabled="!batchState.profilesRaw.length" 
                          :loading="batchState.isImporting"
                          @click="executeBatchImport"
                        >
                          開始匯入更新
                        </v-btn>

                  <div v-if="batchState.logs.length > 0" class="mt-4 pa-2 bg-grey-lighten-4 rounded border" style="max-height: 200px; overflow-y: auto; font-size: 12px;">
                    <div v-for="(log, idx) in batchState.logs" :key="idx" :class="log.type === 'error' ? 'text-red' : 'text-success'">
                      {{ log.msg }}
                    </div>
                  </div>
                </v-card-text>
              </v-card>
            </v-col>
          </v-row>
        </v-container>
      </v-window-item>

      </v-window>

    <v-dialog v-model="batchUploadDialog" max-width="600px" persistent>
      <v-card>
        <v-card-title class="bg-primary text-white">
          <v-icon start>mdi-cloud-upload</v-icon>
          客資批次更新
        </v-card-title>
        <v-card-text class="pt-6">
          <v-alert
            type="warning"
            variant="tonal"
            class="mb-4"
            icon="mdi-alert"
            border="start"
          >
            <strong>注意：</strong> 上傳後將直接寫入資料庫。請確保 Excel 中的「電話」欄位正確無誤。
          </v-alert>

          <v-file-input
            v-model="batchUploadFile"
            label="選擇 Excel 檔案 (.xlsx)"
            accept=".xlsx, .xls"
            variant="outlined"
            density="compact"
            prepend-icon="mdi-file-excel"
            :loading="isParsingExcel"
            @update:model-value="handleBatchUploadFile"
            show-size
          ></v-file-input>

          <v-expand-transition>
            <div v-if="uploadStatusMessage">
              <v-alert
                :type="uploadStatusType"
                variant="tonal"
                class="mt-2 text-pre-wrap"
                density="compact"
              >
                {{ uploadStatusMessage }}
              </v-alert>
            </div>
          </v-expand-transition>

        </v-card-text>
        <v-card-actions class="pa-4">
          <v-spacer></v-spacer>
          <v-btn color="grey-darken-1" variant="text" @click="closeBatchUploadDialog">取消</v-btn>
          <v-btn 
            color="primary" 
            variant="flat" 
            @click="submitBatchUpdate"
            :loading="isBatchUpdating"
            :disabled="!parsedBatchData.length"
          >
            確認執行更新
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- 新增客戶資料 Dialog -->
    <v-dialog v-model="addCustomerDialog" max-width="550px" persistent>
      <v-card class="rounded-xl">
        <v-card-title class="bg-teal text-white d-flex align-center">
          <v-icon start>mdi-account-plus</v-icon>
          新增客戶資料
        </v-card-title>

        <v-card-text class="pt-6">
          <v-form ref="addCustomerFormRef">
            <v-text-field
              v-model="newCustomerForm.phone"
              label="手機號碼 *"
              variant="outlined"
              density="compact"
              prepend-inner-icon="mdi-phone"
              placeholder="09XXXXXXXX"
              :rules="[v => !!v || '必填', v => (v && v.length === 10 && v.startsWith('09')) || '請輸入有效的10碼手機號碼']"
              class="mb-2"
            ></v-text-field>

            <v-text-field
              v-model="newCustomerForm.name"
              label="姓名 *"
              variant="outlined"
              density="compact"
              prepend-inner-icon="mdi-account"
              :rules="[v => !!v || '必填']"
              class="mb-2"
            ></v-text-field>

            <v-select
              v-model="newCustomerForm.salesPhone"
              :items="addCustomerSalesOptions"
              item-title="name"
              item-value="phone"
              label="歸屬銷售人員 *"
              variant="outlined"
              density="compact"
              prepend-inner-icon="mdi-account-tie"
              :rules="[v => !!v || '必填']"
              :disabled="!isCurrentUserCounter"
              :hint="!isCurrentUserCounter ? '僅能指定為自己' : '可選擇該建案的銷售/櫃台人員'"
              persistent-hint
              class="mb-2"
            >
              <template v-slot:item="{ item, props: itemProps }">
                <v-list-item v-bind="itemProps">
                  <template v-slot:append>
                    <span class="text-caption text-grey">{{ item.raw.phone }}</span>
                  </template>
                </v-list-item>
              </template>
            </v-select>

            <v-text-field
              v-model="newCustomerForm.visitDate"
              label="拜訪日期"
              type="date"
              variant="outlined"
              density="compact"
              prepend-inner-icon="mdi-calendar"
              class="mb-2"
            ></v-text-field>
          </v-form>
        </v-card-text>

        <v-divider></v-divider>
        <v-card-actions class="pa-4">
          <v-spacer></v-spacer>
          <v-btn
            color="grey-darken-1"
            variant="text"
            @click="addCustomerDialog = false"
            :disabled="isSubmittingNewCustomer"
          >取消</v-btn>
          <v-btn
            color="teal"
            variant="elevated"
            prepend-icon="mdi-check"
            @click="handleSubmitNewCustomer"
            :loading="isSubmittingNewCustomer"
          >確認新增</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

  </v-container>
</template>

<script setup>
import { ref, computed, onMounted, watch, reactive, defineAsyncComponent } from 'vue';
import { useRouter } from 'vue-router';
import { useUserStore } from '@/store/user';
import { useProjectStore } from '@/store/projectStore';
import { useDisplay } from 'vuetify';
import * as XLSX from 'xlsx-js-style';
import { format } from 'date-fns';
const LeadDistribution = defineAsyncComponent(() => import('@/views/LeadDistribution.vue'));
import { 
  collection, query, where, getDocs, addDoc, doc, updateDoc, deleteDoc, 
  serverTimestamp, orderBy, limit, startAfter, getDoc // ✅ 新增 doc, updateDoc, getDoc
} from "firebase/firestore";
import { 
  getStorage, ref as storageRef, uploadBytes, getDownloadURL, deleteObject 
} from "firebase/storage";
import { db } from '@/firebase'; // ✅ 確保有引入 db


import { 
  fetchCustomerSettings, 
  saveCustomerSettings,
  uploadAttachmentImage,
  deleteAttachmentImage,
  fetchCustomerList,
  batchUpdateCustomers,
  fetchCustomersForExport,
  fetchFullCustomersForExport,
  batchImportCustomers,
  listGoogleSheets,
  exportToGoogleSheet,
  submitCustomerSheet
} from '@/api';
import { merge } from 'lodash-es'; 
import CustomerInteractionLog from '@/components/CustomerInteractionLog.vue'; // 引入組件

const props = defineProps({
  projectId: {
    type: String,
    required: true,
  },
});



const tab = ref('management');
const userStore = useUserStore();
const projectStore = useProjectStore();
const router = useRouter();

// ===============================================
// ✅ [新增] 可存取建案清單與切換邏輯
// ===============================================
const availableProjects = computed(() => {
  const allowed = [];
  const targetSystems = ['客資系統-櫃台', '客資系統-銷售'];
  const userPermissions = userStore.user?.permissions || {};
  
  Object.keys(userPermissions).forEach(pid => {
    const projectPerm = userPermissions[pid];
    const systems = projectPerm.systems || [];
    const hasAccess = targetSystems.some(sys => systems.includes(sys));
    if (hasAccess) {
      const fullProjectData = projectStore.projectsList.find(p => p.id === pid);
      const name = fullProjectData ? fullProjectData.name : (projectPerm.projectName || pid);
      allowed.push({ id: pid, name: name });
    }
  });
  return allowed;
});

const switchProject = (pid) => {
  if (pid !== props.projectId) {
    router.replace({ name: 'CustomerManagementSystem', params: { projectId: pid } });
  }
};

// ✅ [新增] 取得手機模式狀態
const { mobile: isMobile } = useDisplay();
const mobilePage = ref(1); // ✅ [新增] 用於控制手機版的當前頁碼
const itemsPerPage = ref(5);
const loadMore = () => {
  itemsPerPage.value += 5; // 每次點擊多顯示 5 筆
};

// --- 權限 ---
const projectName = computed(() => projectStore.idToNameMap[props.projectId] || props.projectId);

// ===============================================
// ✅ [新增] 客資批次更新相關邏輯
// ===============================================


// ✅ [打勾] 欄位與匯出報表完全一致
const EXCEL_COLUMN_MAP = [
  { header: '電話(主鍵)', key: 'phone', target: 'root' },
  { header: '姓名', key: 'latestName', target: 'root' },
  { header: '其他聯絡人', key: 'otherPhones', target: 'root', type: 'otherPhones' },
  { header: '銷售人員', key: 'latestSalesName', target: 'root' },
  { header: '銷售人員PHONE', key: 'latestSalesPhone', target: 'root' },
  { header: '建立時間', key: 'createdAt', target: 'root', type: 'timestamp' },
  { header: '等級', key: 'rating', target: 'profile' },
  { header: '居住城市', key: '居住城市', target: 'profile', type: 'array' },
  { header: '居住區域', key: '居住鄉鎮市區', target: 'profile', type: 'array' },
  { header: '居住詳細地址', key: '居住詳細地址', target: 'profile', type: 'array' },
  { header: '購屋預算', key: '購屋預算', target: 'profile', type: 'array' },
  { header: '購屋動機', key: '購屋動機', target: 'profile', type: 'array' },
  { header: '房型需求', key: '房型需求', target: 'profile', type: 'array' },
  { header: '坪數需求', key: '坪數需求', target: 'profile', type: 'array' },
  { header: '從何得知本建案', key: '從何得知本建案', target: 'profile', type: 'array' },
  { header: '職業', key: '職業', target: 'profile', type: 'array' },
  { header: '任職公司', key: '任職公司', target: 'profile', type: 'array' },
  // ✅ [修正] 關聯建案欄位 (匯入/匯出統一使用 projectId)
  { header: '關聯建案', key: 'linkedProjectIds', target: 'root', type: 'linkedProjects' },
];

// ✅ [新增] 輔助函式：解析 Excel 日期 (支援 "2026/3/8 15:23:51" 格式與 Excel 序號)
const parseExcelDate = (val) => {
  if (!val) return null;
  // Excel 數字日期序號 (例如 46088.641 = 某日期)
  if (typeof val === 'number') {
    const excelEpoch = new Date(1899, 11, 30); // Excel 日期起點
    const d = new Date(excelEpoch.getTime() + val * 86400000);
    return isNaN(d.getTime()) ? null : d;
  }
  // 字串格式 ("2026/3/8 15:23:51" 或 "2026-03-08")
  const d = new Date(String(val).replace(/\//g, '-'));
  return isNaN(d.getTime()) ? null : d;
};

// 🔧 [新增] 輔助函式：將單一值轉換為資料庫要求的陣列格式
const toArr = (val) => (val && String(val).trim()) ? [String(val).trim()] : [];

// 🔧 [新增] 解析 "姓名(關係):電話; ..." 字串為陣列物件
const parseOtherPhonesStr = (str) => {
  if (!str) return [];
  return String(str).split(/[;；]/).map(item => {
    // 匹配格式：姓名(關係):電話
    const match = item.trim().match(/^(.*?)\((.*?)\)[:：](.*)$/);
    if (match) {
      return { 
        name: match[1].trim(), 
        relation: match[2].trim(), 
        phone: match[3].trim() 
      };
    }
    return null;
  }).filter(Boolean);
};

// 狀態變數
const isExporting = ref(false);
const batchUploadDialog = ref(false);
const batchUploadFile = ref(null);
const isParsingExcel = ref(false);
const parsedBatchData = ref([]); // 儲存解析後的資料
const uploadStatusMessage = ref('');
const uploadStatusType = ref('info');
const isBatchUpdating = ref(false);



function openBatchUploadDialog() {
  batchUploadDialog.value = true;
  batchUploadFile.value = null;
  parsedBatchData.value = [];
  uploadStatusMessage.value = '';
}


// ✅ [打勾] 新增色碼轉換輔助函式
function getRatingColorHex(rating) {
  if (!rating) return '#E0E0E0';
  if (rating.includes('A')) return '#D32F2F'; // 紅色
  if (rating.includes('B')) return '#F57C00'; // 橘色
  if (rating.includes('C')) return '#388E3C'; // 綠色
  if (rating.includes('D')) return '#616161'; // 灰色
  return '#90A4AE';
}

function closeBatchUploadDialog() {
  batchUploadDialog.value = false;
}

// ✅ [打勾] 修改：簡化解析邏輯，直接存入 batchState.profilesRaw
async function handleBatchUploadFile(files) {
  uploadStatusMessage.value = '';
  if (!files || (Array.isArray(files) && files.length === 0)) return;
  const file = Array.isArray(files) ? files[0] : files;

  isParsingExcel.value = true;
  const reader = new FileReader();

  reader.onload = (e) => {
    try {
      const data = new Uint8Array(e.target.result);
      const workbook = XLSX.read(data, { type: 'array' });

      // ✅ [打勾] 讀取第一個分頁：客戶資料
      const wsProfile = workbook.Sheets[workbook.SheetNames[0]];
      const profileData = XLSX.utils.sheet_to_json(wsProfile, { header: 1, range: 0 });

      // ✅ [打勾] 讀取第二個分頁：洽談紀錄
      const wsLogs = workbook.Sheets[workbook.SheetNames[1]];
      const logsData = wsLogs ? XLSX.utils.sheet_to_json(wsLogs, { header: 1, range: 0 }) : [];

      // 處理客戶資料標頭
      const pHeaders = profileData[0].map(h => String(h || '').trim());
      batchState.value.profilesRaw = profileData.slice(1).map(row => {
        const obj = {};
        pHeaders.forEach((h, i) => { obj[h] = row[i]; });
        return obj;
      }).filter(obj => obj['電話(主鍵)']);

      // ✅ [打勾] 處理洽談紀錄標頭並存入 batchState
      const lHeaders = logsData.length ? logsData[0].map(h => String(h || '').trim()) : [];
      batchState.value.logsRaw = logsData.slice(1).map(row => {
        const obj = {};
        lHeaders.forEach((h, i) => { obj[h] = row[i]; });
        return obj;
      });

      batchState.value.isUploadSuccess = true;
      uploadStatusMessage.value = `解析成功：客戶 ${batchState.value.profilesRaw.length} 筆，紀錄 ${batchState.value.logsRaw.length} 筆`;
    } catch (error) {
      uploadStatusMessage.value = `解析失敗: ${error.message}`;
    } finally {
      isParsingExcel.value = false;
    }
  };
  reader.readAsArrayBuffer(file);
}

// 送出更新
async function submitBatchUpdate() {
  if (parsedBatchData.value.length === 0) return;

  isBatchUpdating.value = true;
  uploadStatusMessage.value = '正在上傳並更新資料庫，請稍候... (資料量大時可能需要一點時間)';
  uploadStatusType.value = 'info';

  try {
    const result = await batchUpdateCustomers(props.projectId, parsedBatchData.value);

    if (result.status === 'success') {
      uploadStatusType.value = 'success';
      uploadStatusMessage.value = result.message || `更新成功！共處理 ${result.processedCount} 筆資料。`;
      
      // 更新成功後，重新載入列表
      setTimeout(() => {
        closeBatchUploadDialog();
        loadCustomerList(); // 重新整理列表
      }, 1500);
    } else {
      throw new Error(result.message);
    }
  } catch (error) {
    console.error("批次更新失敗:", error);
    uploadStatusType.value = 'error';
    uploadStatusMessage.value = `更新失敗: ${error.message}`;
  } finally {
    isBatchUpdating.value = false;
  }
}

const canManageSettings = computed(() => 
  userStore.hasProjectPermission('客資系統-櫃台', projectName.value)
);

const isSuperAdmin = computed(() => 
  userStore.currentUserRoles.includes('系統管理員') ||
  userStore.currentUserRoles.includes('超級管理員')
);

// ✓ 獲取當前用戶的資料 (用於 API 呼叫)
const currentUserPhone = computed(() => userStore.user?.key);
const currentUserProjectSystems = computed(() => userStore.user?.permissions?.[props.projectId]?.systems || []);

// --- 新增客戶資料功能 ---
const addCustomerDialog = ref(false);
const addCustomerFormRef = ref(null);
const isSubmittingNewCustomer = ref(false);
const isLoadingProjectStaff = ref(false);
const projectStaffList = ref([]); // 建案人員清單

const newCustomerForm = ref({
  phone: '',
  name: '',
  salesPhone: '',
  visitDate: new Date().toISOString().split('T')[0]
});

// 判斷當前用戶是否擁有櫃台權限
const isCurrentUserCounter = computed(() => {
  const systems = currentUserProjectSystems.value;
  return systems.includes('客資系統-櫃台') || isSuperAdmin.value;
});

// 銷售人員下拉選單選項
const addCustomerSalesOptions = computed(() => {
  if (!isCurrentUserCounter.value) {
    // 非櫃台：只能選自己
    return [{
      name: userStore.user?.name || '未知',
      phone: userStore.user?.key || ''
    }];
  }
  // 櫃台：顯示建案內有「客資系統-銷售」或「客資系統-櫃台」權限的所有人員
  return projectStaffList.value;
});

// 讀取建案人員清單
async function loadProjectStaff() {
  if (!props.projectId) return;
  isLoadingProjectStaff.value = true;
  try {
    const usersRef = collection(db, 'users');
    const snapshot = await getDocs(usersRef);
    const staff = [];

    for (const userDoc of snapshot.docs) {
      const userData = userDoc.data();
      const userKey = userDoc.id;
      if (!userData.name) continue;

      // 過濾掉管理員帳號
      const roles = userData.roles || [];
      if (roles.includes('超級管理員') || roles.includes('系統管理員')) continue;

      const permRef = doc(db, 'userPermissions', userKey);
      const permSnap = await getDoc(permRef);

      if (permSnap.exists()) {
        const perms = permSnap.data().permissions || {};
        const projectPerms = perms[props.projectId];
        if (projectPerms && projectPerms.systems) {
          const hasCrmPerm = projectPerms.systems.includes('客資系統-銷售') || 
                             projectPerms.systems.includes('客資系統-櫃台');
          if (hasCrmPerm) {
            staff.push({
              name: userData.name,
              phone: userKey
            });
          }
        }
      }
    }
    projectStaffList.value = staff.sort((a, b) => a.name.localeCompare(b.name, 'zh-TW'));
  } catch (error) {
    console.error('讀取建案人員失敗:', error);
  } finally {
    isLoadingProjectStaff.value = false;
  }
}

function openAddCustomerDialog() {
  // 重置表單
  newCustomerForm.value = {
    phone: '',
    name: '',
    salesPhone: isCurrentUserCounter.value ? '' : (userStore.user?.key || ''),
    visitDate: new Date().toISOString().split('T')[0]
  };
  addCustomerDialog.value = true;

  // 櫃台權限且尚未讀取人員清單時，讀取一次
  if (isCurrentUserCounter.value && projectStaffList.value.length === 0) {
    loadProjectStaff();
  }
}

async function handleSubmitNewCustomer() {
  const { valid } = await addCustomerFormRef.value.validate();
  if (!valid) return;

  isSubmittingNewCustomer.value = true;
  try {
    // 查找銷售人員名稱
    const salesOption = addCustomerSalesOptions.value.find(
      s => s.phone === newCustomerForm.value.salesPhone
    );

    const formData = {
      '姓名': newCustomerForm.value.name,
      '電話': newCustomerForm.value.phone,
      '銷售人員': salesOption?.name || '',
      '銷售人員電話': newCustomerForm.value.salesPhone,
      '拜訪日期': newCustomerForm.value.visitDate || new Date().toISOString().split('T')[0]
    };

    const result = await submitCustomerSheet(props.projectId, formData, null, 'public_form');

    if (result.status !== 'success') {
      throw new Error(result.message || '新增失敗');
    }

    addCustomerDialog.value = false;
    alert('客戶資料已新增成功！');
    loadCustomerList(); // 重新整理列表
  } catch (error) {
    console.error('新增客戶失敗:', error);
    alert(`新增失敗: ${error.message}`);
  } finally {
    isSubmittingNewCustomer.value = false;
  }
}


// --- 設定 Tab 邏輯 (保持不變) ---
const isLoading = ref(false); // 這是「設定頁」的 Loading
const isSaving = ref(false);
const panel = ref([]); 
const vipPanel = ref([]); 
const isUploadingCover = ref(false);
const coverImageFile = ref(null); 
const tempCoverImageUrl = ref(null);
const settings = ref({ 
  fields: {}, 
  vipFormFields: {}, 
  vipFormConfig: {},
  reminderSettings: {
    counterDuplicate: { lineNotify: false, emailNotify: false },
    salesDuplicate: { lineNotify: false, emailNotify: false }
  },
  anxiSystemConfig: {
    lineCrmChannelAccessTokenSecretName: ''
  }
}); 

// ✓ START: 新增「客戶資料管理」Tab 的狀態
const isLoadingCustomerList = ref(false); // 這是「列表頁」的 Loading
const customerListSearch = ref('');
const customerList = ref([]); // 儲存後端回傳的扁平化列表
const customerTableHeaders = ref([
  { title: '最後更新', key: 'updatedAt', width: '160px', sortable: true }, // 新增這行
  { title: '拜訪日期', key: '拜訪日期', width: '110px', sortable: true },
  { title: '等級', key: '等級研判', width: '90px', sortable: true }, // 新增
  { title: '未購原因', key: '未買原因', width: '160px', sortable: false }, // 新增
  { title: '姓名', key: '姓名', width: '100px' },
  { title: '電話', key: '電話', width: '120px' },
  { title: '銷售', key: '銷售人員', width: '100px' },
  { title: '購屋動機', key: '購屋動機', width: '110px' },
  { title: '房型需求', key: '房型需求', width: '120px' },
 { title: '購屋預算', key: '購屋預算', width: '120px' }, // 空間不足可隱藏
]);
// ✓ END: 新增

const isInteractionDialogVisible = ref(false);
const selectedCustomerDocId = ref(null);
const selectedCustomerSalesName = ref('');

const getSeconds = (val) => {
  if (!val) return 0;
  if (typeof val === 'object') {
    if (val._seconds !== undefined) return val._seconds;
    if (val.seconds !== undefined) return val.seconds;
    if (typeof val.toDate === 'function') return val.toDate().getTime() / 1000;
  }
  const d = new Date(val);
  return isNaN(d.getTime()) ? 0 : d.getTime() / 1000;
};

/**
 * 格式化完整時間 (包含小時分鐘)
 */
const formatFullDateTime = (t) => {
  if (!t) return '-';
  const date = (t && t.toDate) ? t.toDate() : new Date(t);
  if (isNaN(date.getTime())) return '-';
  
  return date.toLocaleString('zh-TW', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  }).replace(/\//g, '-');
};

// ✓ START: 新增：載入客戶列表的函式
async function loadCustomerList() {
  if (!props.projectId || !currentUserPhone.value) return;
  isLoadingCustomerList.value = true;
  try {
    const list = await fetchCustomerList(
      props.projectId, 
      currentUserPhone.value, 
      currentUserProjectSystems.value
    );

    // ✅ 根據拜訪日期排序 (Z→A，最新在上)
    customerList.value = list.sort((a, b) => {
      const dateA = a['拜訪日期'] || '';
      const dateB = b['拜訪日期'] || '';
      return dateB.localeCompare(dateA);
    });

  } catch (error) {
    console.error("載入客戶列表失敗:", error);
  } finally {
    isLoadingCustomerList.value = false;
  }
}
// ✓ END: 新增

// 批次處理狀態管理
const batchState = ref({
  isExporting: false,
  isImporting: false,
  isUploadSuccess: false, // 新增
  uploadFile: null,
  profilesRaw: [],        // ✅ 新增：用來存放解析後的原始資料
  logs: []
});


// [輔助函式] 日期格式化 (YYYY/MM/DD HH:mm:ss)
const formatDateStr = (val) => {
  if (!val) return '';
  // 支援 Firestore Timestamp (有 toDate 方法) 或一般 Date/String
  const date = val.toDate ? val.toDate() : new Date(val);
  
  if (isNaN(date.getTime())) return ''; // 無效日期回傳空

  const pad = (n) => (n < 10 ? '0' + n : n);
  const YYYY = date.getFullYear();
  const MM = pad(date.getMonth() + 1);
  const DD = pad(date.getDate());
  const HH = pad(date.getHours());
  const mm = pad(date.getMinutes());
  const ss = pad(date.getSeconds());

  return `${YYYY}/${MM}/${DD} ${HH}:${mm}:${ss}`;
};


// ✅ [打勾] 整合後的最終匯出函式 (建議刪除 downloadCustomerExcel)
const executeBatchExport = async () => {
  if (!props.projectId) return alert("無專案 ID");
  batchState.value.isExporting = true;
  
  try {
    const customers = await fetchFullCustomersForExport(
      props.projectId, 
      currentUserPhone.value, 
      currentUserProjectSystems.value
    );

    const profileRows = []; 
    const logRows = [];     
    const subRows = [];     

    const safeFormatDate = (dateVal) => {
      if (!dateVal) return '';
      if (typeof dateVal === 'object' && dateVal._seconds !== undefined) {
        return new Date(dateVal._seconds * 1000).toLocaleString('zh-TW', { hour12: false });
      }
      const d = new Date(dateVal);
      return isNaN(d.getTime()) ? dateVal : d.toLocaleString('zh-TW', { hour12: false });
    };

 

    customers.forEach((data) => {
      const phone = data.phone;
      const p = data.profile || {};
      const formatArr = (val) => Array.isArray(val) ? val.join(',') : (val || '');

      const logs = data.interactionLogs || [];
      const latestLog = logs.length > 0 ? logs[logs.length - 1] : {};

      const rawOtherPhones = p.otherPhones || (p.profile && p.profile.otherPhones) || [];
      const otherPhonesStr = Array.isArray(rawOtherPhones)
        ? rawOtherPhones
            .map(op => `${op.name || ''}(${op.relation || ''}):${op.phone || ''}`)
            .filter(str => str !== '():')
            .join('; ')
        : '';

      // --- Sheet 1: 客戶資料 (已新增參考建案欄位) ---
      profileRows.push({
        '建案ID': data.projectId,
        // ✅ [參考建案] 新增關聯建案欄位 (使用 projectId 以利匯入回寫)
        '來源建案': data.isLinked ? (projectStore.idToNameMap[data.projectId] || data.projectId) : '主建案',
        '關聯建案': (data.linkedProjectIds || []).join(', ') || '',
        '建立時間': safeFormatDate(data.createdAt),
        '電話(主鍵)': phone,
        '姓名': data.latestName,
        '其他聯絡人': otherPhonesStr,
        '銷售人員': data.latestSalesName,
        '銷售人員PHONE': data.latestSalesPhone,
        '等級': latestLog.tags?.rating || '',
        '最新互動內容': latestLog.content || '',
        '最新互動類型': latestLog.tags?.interactionType || '',
        '居住城市': formatArr(p['居住城市']),
        '居住區域': formatArr(p['居住鄉鎮市區']),
        '居住詳細地址': formatArr(p['居住詳細地址']),
        '購屋動機': formatArr(p['購屋動機']),
        '房型需求': formatArr(p['房型需求']),
        '坪數需求': formatArr(p['坪數需求']),
        '購屋預算': formatArr(p['購屋預算']),
        '從何得知本建案': formatArr(p['從何得知本建案']),
        '職業': formatArr(p['職業']),
        '任職公司': formatArr(p['任職公司']),
        '最後更新': safeFormatDate(data.updatedAt)
      });

      // --- Sheet 2: 洽談紀錄 ---
      logs.forEach((log) => {
        const logTime = getSeconds(log.createdAt);
        const matchedSub = (data.submissions || []).find(s => Math.abs(logTime - getSeconds(s.submittedAt)) < 2) || {};

        logRows.push({
          '客戶電話(關聯)': phone,
          '洽談日期': log.date || '',
          '互動類型': log.tags?.interactionType || '',
          '詳細內容': log.content || '',
          '記錄人員': log.recorderName || '',
          '記錄人員電話': formatArr(matchedSub['銷售人員電話']) || '',
          '當下等級': log.tags?.rating || '',
          '訪客數': log.tags?.visitors || '',
          '未買原因': formatArr(log.tags?.noPurchaseReason),
          '提交時間': safeFormatDate(log.createdAt)
        });
      });

   
    });

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(profileRows), "客戶資料");
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(logRows), "洽談紀錄");
    
    const fileName = `${projectName.value || props.projectId}_全欄位客資匯出_${new Date().toISOString().slice(0,10)}.xlsx`;
    XLSX.writeFile(wb, fileName);

  } catch (err) {
    console.error("匯出失敗:", err);
    alert('匯出發生錯誤: ' + err.message);
  } finally {
    batchState.value.isExporting = false;
  }
};

// ✅ [打勾] 完整修正版：處理雙分頁關聯與資料結構對齊
const executeBatchImport = async () => {
  if (!batchState.value.profilesRaw || !batchState.value.profilesRaw.length) {
    return alert("請先選擇並解析檔案");
  }
  
  batchState.value.isImporting = true;
  const jsNow = new Date(); // 台灣時間格式將由後端轉為 Timestamp

  // ✅ [打勾] 輔助函式：確保字串轉為陣列 (避免型別錯誤)
  const toArr = (val) => {
    if (val === undefined || val === null || val === '') return [];
    return String(val).split(/[,，;；]/).map(s => s.trim()).filter(Boolean);
  };

  // ✅ [打勾] 1. 處理「洽談紀錄」分組邏輯 (從 batchState.logsRaw 取得)
  const logsGroupByPhone = {};
  if (batchState.value.logsRaw && batchState.value.logsRaw.length > 0) {
    batchState.value.logsRaw.forEach(log => {
      const logPhone = String(log['客戶電話(關聯)'] || '').trim();
      if (!logPhone) return;
      if (!logsGroupByPhone[logPhone]) logsGroupByPhone[logPhone] = [];
      
      logsGroupByPhone[logPhone].push({
        logId: String(Date.now() + Math.floor(Math.random() * 1000)), 
        date: log['洽談日期'] || '',
        content: log['詳細內容'] || '',
        recorderName: log['記錄人員'] || '',
        recorderPhone: log['記錄人員電話'] || '',
        createdAt: jsNow,
        tags: {
          interactionType: log['互動類型'] || '',
          rating: log['當下等級'] || '',
          visitors: String(log['訪客數'] || '1'),
          noPurchaseReason: toArr(log['未買原因']),
          keyTags: toArr(log['重點標籤'])
        }
      });
    });
  }

  // 2. 開始建立客戶資料 Payload
  const customerPayloads = batchState.value.profilesRaw.map(row => {
    const phone = String(row['電話(主鍵)'] || '').trim();
    if (!phone) return null;

    const name = String(row['姓名'] || '').trim();
    const otherPhonesStr = String(row['其他聯絡人'] || '');
    const otherPhones = parseOtherPhonesStr(otherPhonesStr);

    // 取得該客戶對應的洽談紀錄
    const myLogs = logsGroupByPhone[phone] || [];

    // ✅ [修正] 從 Excel「建立時間」欄位解析拜訪日期，而非使用當前時間
    const rawCreatedAt = row['建立時間'];
    const parsedDate = parseExcelDate(rawCreatedAt);
    const visitDate = parsedDate ? parsedDate.toISOString().split('T')[0] : jsNow.toISOString().split('T')[0];
    const createdAtDate = parsedDate || jsNow;

    // ✅ 建立提交紀錄 Snapshot (與前端建立結構一致)
    const submissionEntry = {
      submissionSource: 'excel_import',
      importSource: 'Excel Batch Upload',
      submittedAt: createdAtDate, 
      姓名: name,
      電話: phone,
      銷售人員: row['銷售人員'] || '',
      銷售人員電話: row['銷售人員PHONE'] || '',
      居住城市: row['居住城市'] || '',
      居住鄉鎮市區: row['居住區域'] || '',
      購屋預算: row['購屋預算'] || '',
      房型需求: toArr(row['房型需求']),
      購屋動機: toArr(row['購屋動機']),
      坪數需求: toArr(row['坪數需求']),
      從何得知本建案: toArr(row['從何得知本建案']),
      職業: row['職業'] || '',
      任職公司: row['任職公司'] || '',
      拜訪日期: visitDate
    };

    // ✅ [修正] 等級：從 Excel 讀取後寫入 interactionLogs，讓前端等級研判能正確顯示
    const importedRating = String(row['等級'] || '').trim();
    if (importedRating && myLogs.length === 0) {
      // 若 Excel 有等級但該客戶沒有洽談紀錄，則自動建立一筆系統紀錄帶入等級
      myLogs.push({
        logId: String(Date.now() + Math.floor(Math.random() * 1000)),
        date: visitDate,
        content: '(Excel 匯入自動建立)',
        recorderName: '系統匯入',
        recorderPhone: '',
        createdAt: createdAtDate,
        tags: {
          interactionType: 'Excel匯入',
          rating: importedRating,
          visitors: '1',
          noPurchaseReason: [],
          keyTags: []
        }
      });
    }

    // ✅ [修正] 關聯建案：從 Excel 欄位解析 linkedProjectIds (逗號分隔的 projectId)
    const linkedPidsRaw = String(row['關聯建案'] || '').trim();
    const linkedPids = linkedPidsRaw
      ? linkedPidsRaw.split(/[,，]/).map(s => s.trim()).filter(Boolean)
      : [];
    // allProjectIds = 當前建案 + 關聯建案 (去重)
    const allPids = [...new Set([props.projectId, ...linkedPids])];

    const data = {
      projectId: props.projectId,
      phone: phone,
      latestName: name,
      latestSalesName: row['銷售人員'] || '',
      latestSalesPhone: row['銷售人員PHONE'] || '',
      otherPhones: otherPhones,
      // ✅ 建立搜尋索引陣列
      searchableNames: Array.from(new Set([name, ...otherPhones.map(p => p.name)])).filter(Boolean),
      searchablePhones: Array.from(new Set([phone, ...otherPhones.map(p => p.phone)])).filter(Boolean),
      submissions: [submissionEntry],
      interactionLogs: myLogs, // ✅ 寫入洽談紀錄 (含等級)
      updatedAt: jsNow,
      createdAt: createdAtDate, // ✅ [修正] 使用 Excel 建立時間
      // ✅ [修正] 關聯建案
      allProjectIds: allPids,
      linkedProjectIds: linkedPids,
      profile: {
        姓名: [name],
        電話: [phone],
        otherPhones: otherPhones,
        submissionSource: ['excel_import'],
        submittedAt: [createdAtDate]
      }
    };

    // 3. 根據 EXCEL_COLUMN_MAP 分配剩餘欄位到 Profile
    EXCEL_COLUMN_MAP.forEach(cfg => {
      let rawVal = row[cfg.header];
      if (rawVal === undefined || rawVal === null || rawVal === '') return;
      
      // 跳過已特殊處理的欄位
      if (cfg.type === 'linkedProjects' || cfg.type === 'timestamp') return;
      
      let finalVal = (cfg.type === 'array') ? toArr(rawVal) : rawVal;
      
      if (cfg.target === 'profile') {
        data.profile[cfg.key] = finalVal;
      }
    });

    return { 
      docId: `${props.projectId}_${phone}`, 
      ...data 
    };
  }).filter(Boolean);

  try {
    // 呼叫 API 執行批次寫入
    const res = await batchImportCustomers(props.projectId, customerPayloads, currentUserPhone.value);
    alert(`匯入完成！成功處理 ${res.count || 0} 筆資料`);
    
    // ✅ [打勾] 重設上傳狀態
    batchState.value.profilesRaw = [];
    batchState.value.logsRaw = []; // 需確保 handleBatchUploadFile 有填入此值
    batchState.value.uploadFile = null;
    batchState.value.isUploadSuccess = false;
    
    loadCustomerList(); // 重新載入列表同步資料
  } catch (err) {
    console.error("匯入失敗:", err);
    alert("匯入失敗: " + err.message);
  } finally {
    batchState.value.isImporting = false;
  }
};


// ✅ [新增] 等級顏色輔助函式
function getRatingColor(rating) {
    if (!rating) return 'grey-lighten-2';
    if (rating.includes('A')) return 'red-lighten-4 text-red-darken-4'; // A級 紅色
    if (rating.includes('B')) return 'orange-lighten-4 text-orange-darken-4'; // B級 橘色
    if (rating.includes('C')) return 'green-lighten-4 text-green-darken-4'; // C級 綠色
    if (rating.includes('D')) return 'grey-lighten-3 text-grey-darken-2'; // D級 灰色
    return 'blue-grey-lighten-4';
}

// ✓ START: 新增：監聽 Tab 變化
watch(tab, (newTab) => {
  if (newTab === 'management' && customerList.value.length === 0) {
    // 第一次點擊「客戶資料管理」時載入
    loadCustomerList();
  } else if (newTab === 'settings' && Object.keys(settings.value.fields).length === 0) {
    // 第一次點擊「設定」時載入 (保持原有邏輯)
    loadSettings();
  }
}, { immediate: true }); // immediate: true 確保一開始就觸發
// ✓ END: 新增

// ✓ START: 新增：日期格式化輔助函式
function formatDisplayDate(dateString) {
  if (!dateString) return 'N/A';
  try {
    // 假設日期字串格式為 "YYYY-MM-DD"
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString; // 如果格式錯誤，返回原字串
    // 轉為 YYYY/MM/DD
    return date.toLocaleDateString('zh-TW', { year: 'numeric', month: '2-digit', day: '2-digit' });
  } catch (e) {
    return dateString; // 出錯時返回原字串
  }
}

// ✓ [打勾] 新增篩選與下載狀態
const isSimpleExporting = ref(false);
const exportFilters = ref({
  startDate: '',
  endDate: '',
  selectedSales: []
});

// ✓ [打勾] 從現有列表提取銷售人員名單供勾選
const availableSalesNames = computed(() => {
  const names = customerList.value
    .map(c => c['銷售人員'])
    .filter(name => name && name.trim() !== '');
  return [...new Set(names)].sort();
});

// ✓ [打勾] 洽談時間計算函數 (最後一筆 log 的持續分鐘數)
const calculateLogDuration = (startTime, endTime) => {
  if (!startTime || !endTime) return '';
  try {
    const [sH, sM] = startTime.split(':').map(Number);
    const [eH, eM] = endTime.split(':').map(Number);
    const diff = (eH * 60 + eM) - (sH * 60 + sM);
    return diff > 0 ? `${diff} 分鐘` : '';
  } catch (e) { return ''; }
};

// ✓ [打勾] 簡易版 Excel 匯出執行函數
// 提取共用的資料獲取與篩選邏輯
const getSimpleExportData = async (filterFunc, sortFunc) => {
  // 獲取完整資料以便讀取 interactionLogs 與 profile
  const allData = await fetchFullCustomersForExport(
    props.projectId,
    userStore.user.key,
    userStore.user?.permissions?.[props.projectId]?.systems || []
  );

  // 執行篩選邏輯 (預設篩選)
  const defaultFilter = (item) => {
    const logs = item.interactionLogs || [];
    if (logs.length === 0) return false;
    
    // 依據 interactionLogs 第一筆資料的日期進行區間篩選
    const firstLogDate = logs[0].date; 
    const isDateInRange = firstLogDate >= exportFilters.value.startDate && 
                          firstLogDate <= exportFilters.value.endDate;
    
    // 依據銷售人員篩選
    const isSalesMatch = exportFilters.value.selectedSales.length === 0 || 
                         exportFilters.value.selectedSales.includes(item.latestSalesName);
    
    return isDateInRange && isSalesMatch;
  };

  const filtered = allData.filter(filterFunc || defaultFilter);

  // 排序 (預設排序)
  const defaultSort = (a, b) => {
    const dateA = a.interactionLogs?.[0]?.date || '';
    const dateB = b.interactionLogs?.[0]?.date || '';
    return dateA.localeCompare(dateB); 
  };

  filtered.sort(sortFunc || defaultSort);

  // 格式化輸出資料
  return filtered.map((item, index) => {
    const logs = item.interactionLogs || [];
    const firstLog = logs[0] || {};
    const lastLog = logs[logs.length - 1] || {};
    const p = item.profile || {};
    
    // 輔助函式：取得 Profile 陣列最後一個值
    const getP = (key) => Array.isArray(p[key]) ? p[key][p[key].length - 1] : (p[key] || '');

    return {
      '順序': index + 1,
      '日期': firstLog.date ? firstLog.date.replace(/-/g, '/') : '',
      '銷售人員': item.latestSalesName || '',
      '客戶姓名': item.latestName || '',
      '來人（位）': firstLog.tags?.visitors || '',
      '年齡': getP('年齡'),
      '性別': getP('性別'),
      '職業': getP('職業'),
      '動機': Array.isArray(p['購屋動機']) ? p['購屋動機'].join(',') : '',
      '媒體': Array.isArray(p['從何得知本建案']) ? p['從何得知本建案'].join(',') : '',
      '區域': getP('居住城市'),
      '洽談時間': calculateLogDuration(firstLog.startTime, firstLog.endTime),
      '行動電話': item.phone || '',
      '未買原因': Array.isArray(lastLog.tags?.noPurchaseReason) 
                 ? lastLog.tags.noPurchaseReason.join(',') 
                 : (lastLog.tags?.noPurchaseReason || ''),
      '洽談紀錄': firstLog.content || ''
    };
  });
};

const executeSimpleExport = async () => {
  // ✓ [新增] 即使按鈕被隱藏，函數層級也要攔截
  if (!canManageSettings.value) {
    alert('您沒有權限執行此操作');
    return;
  }
  
  isSimpleExporting.value = true;
  try {
    const exportRows = await getSimpleExportData();

    // 建立並下載 Excel
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(exportRows);
    XLSX.utils.book_append_sheet(wb, ws, "客資資料");
    const fileName = `${projectName.value}_客資資料_${exportFilters.value.startDate}_${exportFilters.value.endDate}.xlsx`;
    XLSX.writeFile(wb, fileName);

  } catch (err) {
    console.error("匯出失敗:", err);
    alert('下載發生錯誤: ' + err.message);
  } finally {
    isSimpleExporting.value = false;
  }
};

// --- Google Sheet Sync Logic ---
const googleSheetDialog = ref(false);
const isSyncingToGoogle = ref(false);
const googleSheetForm = reactive({
  url: '',
  sheetName: '',
  sheetNames: [],
  isLoadingSheets: false,
  agentEmail: '',
  step: 1,
  rememberUrl: true // ✅ 新增：控制是否記住網址
});

const openSyncDialog = async () => {
  if (!exportFilters.value.startDate || !exportFilters.value.endDate) {
    alert('請先選擇起訖日期');
    return;
  }
  
  googleSheetForm.url = '';
  
  // 嘗試從專案設定 (Firestore) 讀取上次使用的 URL
  try {
    const projectRef = doc(db, 'projects', props.projectId);
    const projectSnap = await getDoc(projectRef);
    if (projectSnap.exists()) {
      const data = projectSnap.data();
      // ✅ 使用獨立欄位 customerExportSheetUrl
      if (data.customerExportSheetUrl) {
        googleSheetForm.url = data.customerExportSheetUrl;
      }
    }
  } catch (err) {
    console.error('讀取專案設定失敗:', err);
  }

  googleSheetForm.sheetName = '';
  googleSheetForm.sheetNames = [];
  googleSheetForm.step = 1;
  googleSheetDialog.value = true;
};

const fetchSheetNames = async () => {
  if (!googleSheetForm.url) return;
  googleSheetForm.isLoadingSheets = true;
  try {
    const res = await listGoogleSheets(googleSheetForm.url);
    googleSheetForm.sheetNames = res.sheetNames || [];
    googleSheetForm.agentEmail = res.agentEmail || '';
    googleSheetForm.spreadsheetId = res.spreadsheetId; // Store the ID
    googleSheetForm.step = 2; // Move to select sheet step
  } catch (error) {
    alert('讀取失敗: ' + error.message);
  } finally {
    googleSheetForm.isLoadingSheets = false;
  }
};

const executeGoogleSync = async () => {
  if (!googleSheetForm.sheetName) return;
  
  isSyncingToGoogle.value = true;
  try {
    // 1. 準備資料
    const exportRows = await getSimpleExportData();
    
    // ✅ 新增：檢查是否有資料
    if (exportRows.length === 0) {
      alert('沒有符合條件的資料可同步 (但網址設定已保留)');
    }

    // ✅ 新增：檢查是否要儲存網址設定 (存入 customerExportSheetUrl)
    if (googleSheetForm.rememberUrl && googleSheetForm.url) {
       updateDoc(doc(db, 'projects', props.projectId), {
        customerExportSheetUrl: googleSheetForm.url
      }).catch(e => console.error('更新專案設定失敗:', e));
    }

    // 若無資料，存完設定後就中止
    if (exportRows.length === 0) {
        isSyncingToGoogle.value = false;
        return;
    }

    // 2. 轉換為二維陣列 (Header + Data)
    const headers = [
      '順序', '日期', '銷售人員', '客戶姓名', '來人（位）', 
      '年齡', '性別', '職業', '動機', '媒體', '區域', 
      '洽談時間', '行動電話', '未買原因', '洽談紀錄'
    ];
    
    const values = [headers];
    exportRows.forEach(row => {
      values.push([
        row['順序'], row['日期'], row['銷售人員'], row['客戶姓名'], row['來人（位）'],
        row['年齡'], row['性別'], row['職業'], row['動機'], row['媒體'], row['區域'],
        row['洽談時間'], row['行動電話'], row['未買原因'], row['洽談紀錄']
      ]);
    });

    // 3. 呼叫後端同步
    await exportToGoogleSheet({
      spreadsheetId: googleSheetForm.spreadsheetId || googleSheetForm.url, // Use stored ID or fallback to URL (which backend might fail if not handled)
      sheetName: googleSheetForm.sheetName,
      values: values
    });

    alert('同步成功！');
    googleSheetDialog.value = false;

  } catch (error) {
    console.error(error);
    alert('同步失敗: ' + error.message);
  } finally {
    isSyncingToGoogle.value = false;
  }
};

// ✓ [打勾] 新增：全選邏輯的計算屬性
const isAllSalesSelected = computed({
  // 檢查是否所有人員都被選中
  get: () => {
    return availableSalesNames.value.length > 0 && 
           exportFilters.value.selectedSales.length === availableSalesNames.value.length;
  },
  // 處理點擊全選的動作
  set: (val) => {
    if (val) {
      // 全選：將所有可選人員名稱放入陣列
      exportFilters.value.selectedSales = [...availableSalesNames.value];
    } else {
      // 取消全選：清空陣列
      exportFilters.value.selectedSales = [];
    }
  }
});

// ✓ [打勾] 新增：處理「部分選中」的視覺狀態 (Indeterminate)
const isSalesIndeterminate = computed(() => {
  const selectedCount = exportFilters.value.selectedSales.length;
  const totalCount = availableSalesNames.value.length;
  return selectedCount > 0 && selectedCount < totalCount;
});

// ✓ START: 新增：Chip 顏色輔助函式 (範例)
function getChipColor(motive) {
  if (motive && motive.includes('自住')) return 'blue';
  if (motive && motive.includes('投資')) return 'green';
  if (motive && motive.includes('置產')) return 'orange';
  return 'grey';
}
// ✓ END: 新增

// --- 預設欄位結構 (保持不變) ---
const DEFAULT_SETTINGS = {
  fields: {
    gender: {
      label: "性別", order: 1, isRequired: true, allowCustom: false, selectionMode: 'single',
      options: ["男", "女"]
    },
    age: {
      label: "年齡", order: 2, isRequired: false, allowCustom: false, selectionMode: 'single',
      options: ["30以下", "31~35", "36~40", "41~45", "46~50", "51~55", "56~60", "60以上"]
    },
    visitors: {
      label: "來人(位)", order: 3, isRequired: false, allowCustom: true, selectionMode: 'single',
      options: ["1", "2", "3", "4位以上"]
    },
    interactionType: {
      label: "互動方式", order: 4, isRequired: true, allowCustom: true, selectionMode: 'single',
      options: ["現場介紹", "客戶來電", "電話", "LINE", "簡訊"]
    },
    mediaSource: {
      label: "來客媒體", order: 5, isRequired: false, allowCustom: true, selectionMode: 'single',
      options: ["接待中心", "定點", "介紹", "網路", "NP", "海報", "老客戶", "MG", "RD", "SP"]
    },
    region: {
      label: "來客區域", order: 6, isRequired: false, allowCustom: true, selectionMode: 'single',
      options: ["新竹市", "竹北", "竹東", "湖口", "新豐", "二重埔", "寶山", "芎林", "竹縣以北", "竹縣以南"]
    },
    occupation: {
      label: "職業", order: 7, isRequired: false, allowCustom: true, selectionMode: 'single',
      options: ["公務人員", "台元科技", "竹科園區", "園區外圍", "自營商", "工業區", "醫院相關", "上班族", "投資客", "家管"]
    },
  
    noPurchaseReason: {
      label: "未買原因", order: 9, isRequired: false, allowCustom: true, selectionMode: 'multiple', 
      options: ["已下訂", "還要討論比較", "預算不符", "格局不符", "座向不符", "單價不認同", "坪數太大", "坪數太小", "喜歡的戶型樓層沒了", "需要雙車位", "沒有高樓層可選", "沒有低樓層可選", "生活機能不理想", "要問神明或老師", "家人反對", "環境不喜歡"]
    },
    keyTags: {
      label: "重點標籤", order: 10, isRequired: false, allowCustom: true, selectionMode: 'multiple', 
      options: ["在意學區", "關心貸款成數", "首購", "換屋", "需雙車位", "需B1車位", "高樓層偏好", "低樓層偏好", "邊間", "衛浴開窗", "前後陽台", "採光通風", "需家人同意", "需風水老師", "急需入住", "長期置產"]
    },
    rating: {
      label: "等級研判", order: 11, isRequired: true, allowCustom: false, selectionMode: 'single',
      options: ["A意願高", "B有機會", "C需考慮", "D無希望"]
    },
    taskType: {
      label: "任務類型", order: 12, isRequired: true, allowCustom: true, selectionMode: 'single',
      options: ["電話回訪", "LINE回訪", "簡訊回訪", "寄送DM", "寄送格局圖", "提供報價單", "邀約來訪", "安排二次帶看", "提醒下訂", "提醒簽約", "追蹤貸款進度", "客變洽談", "通知驗屋", "生日祝福", "節慶問候"]
    },
    taskStatus: {
      label: "任務狀態", order: 13, isRequired: true, allowCustom: false, selectionMode: 'single',
      options: ["待處理", "已完成", "已逾期"]
    }
  },
  vipFormFields: {
    motivation: {
      label: "購屋動機", order: 1, isRequired: true, allowCustom: false, selectionMode: 'multiple', 
      options: ["自住", "投資", "贈與置產", "幫親友看房"]
    },
    roomType: {
      label: "房型需求", order: 2, isRequired: true, allowCustom: false, selectionMode: 'multiple', 
      options: ["1房", "2房", "3房", "4房", "4房以上", "店面"]
    },
    size: {
      label: "坪數需求", order: 3, isRequired: false, allowCustom: false, selectionMode: 'multiple', 
      options: ["20坪以下", "21~30坪", "31~40坪", "41~50坪", "51~60坪", "61~70坪", "71~80坪", "81~90坪", "90~100坪", "100坪以上"]
    },
    budget: {
      label: "購屋預算", order: 4, isRequired: false, allowCustom: false, selectionMode: 'single',
      options: ["3000萬以下", "3001~3500萬", "3501~4000萬", "4000萬以上"]
    },
    source: {
      label: "從何得知本建案", order: 5, isRequired: true, allowCustom: true, selectionMode: 'multiple', 
      options: ["591網站", "樂居網站", "facebook", "Instagram", "廣告看板", "親友介紹", "基地附近", "富宇已購客戶", "路過接待中心"]
    }
  },
  vipFormConfig: {
    coverImage: {
      show: true,
      url: null,
      storagePath: null
    },
    projectWebsiteUrl: null
  },
  reminderSettings: { 
    counterDuplicate: {
      lineNotify: false,
      emailNotify: false
    },
    salesDuplicate: {
      lineNotify: false,
      emailNotify: false
    }
  },
  anxiSystemConfig: { 
    lineCrmChannelAccessTokenSecretName: ''
  }
};
// --- END: 預設欄位結構 ---

// --- 載入/儲存/圖片處理 函式 (保持不變) ---

watch(coverImageFile, (newFile) => { 
  if (tempCoverImageUrl.value) {
    URL.revokeObjectURL(tempCoverImageUrl.value);
    tempCoverImageUrl.value = null;
  }
  if (newFile) { 
    tempCoverImageUrl.value = URL.createObjectURL(newFile);
  }
});

async function loadSettings() {
  if (!props.projectId) return;
  isLoading.value = true;
  try {
    const data = await fetchCustomerSettings(props.projectId);
    const cleanDefaults = JSON.parse(JSON.stringify(DEFAULT_SETTINGS));
    
    // ✅ 修正點：使用自定義合併邏輯，確保陣列會被「覆蓋」而不是「疊加」
    settings.value = merge({}, cleanDefaults, data);

    // 針對所有包含 options 的欄位強制去重
    Object.keys(settings.value.fields).forEach(key => {
      if (settings.value.fields[key].options) {
        settings.value.fields[key].options = [...new Set(settings.value.fields[key].options)];
      }
    });
    
    Object.keys(settings.value.vipFormFields).forEach(key => {
      if (settings.value.vipFormFields[key].options) {
        settings.value.vipFormFields[key].options = [...new Set(settings.value.vipFormFields[key].options)];
      }
    });

    panel.value = Object.keys(settings.value.fields);
    vipPanel.value = Object.keys(settings.value.vipFormFields);
    
  } catch (error) {
    // ... 原有錯誤處理
  } finally {
    isLoading.value = false;
  }
}

async function saveSettings(performUpload = true) {
  isSaving.value = true;
  try {
    const file = coverImageFile.value; 
    if (file && performUpload) {
      isUploadingCover.value = true;
      const oldPath = settings.value.vipFormConfig?.coverImage?.storagePath;
      if (oldPath) {
        try {
          await deleteAttachmentImage(oldPath);
        } catch (deleteError) {
          console.warn("刪除舊封面圖片失敗 (可能不存在):", deleteError.message);
        }
      }
      try {
        const { url, path } = await uploadAttachmentImage(props.projectId, file);
        settings.value.vipFormConfig.coverImage.url = url;
        settings.value.vipFormConfig.coverImage.storagePath = path;
      } catch (uploadError) {
        throw new Error(`圖片上傳失敗: ${uploadError.message}`);
      } finally {
        isUploadingCover.value = false;
        coverImageFile.value = null; 
      }
    }
    const dataToSave = { ...settings.value, projectId: props.projectId };
    await saveCustomerSettings(props.projectId, dataToSave);
    alert('設定儲存成功！');
  } catch (error) {
    console.error("儲存客資系統設定失敗:", error);
    alert(`儲存設定失敗: ${error.message}`);
  } finally {
    isSaving.value = false;
    isUploadingCover.value = false; 
  }
}

async function removeCoverImage() {
  const oldPath = settings.value.vipFormConfig?.coverImage?.storagePath;
  coverImageFile.value = null;
  settings.value.vipFormConfig.coverImage.url = null;
  settings.value.vipFormConfig.coverImage.storagePath = null;
  if (oldPath) {
    isUploadingCover.value = true; 
    try {
      await deleteAttachmentImage(oldPath);
      await saveSettings(false); 
      alert('封面圖片已移除');
    } catch (deleteError) {
      console.error("刪除封面圖片失敗:", deleteError.message);
      alert(`刪除封面圖片失敗: ${deleteError.message}`);
    } finally {
      isUploadingCover.value = false;
    }
  } else {
    await saveSettings(false);
  }
}

// 監聽 projectId 變化 (保持不變)
watch(() => props.projectId, (newId) => {
  if (newId) {
    // 當建案 ID 變化時，清空列表並重新載入
    customerList.value = [];
    if (tab.value === 'management') {
      loadCustomerList();
    }
    // (設定頁的載入會由 tab watch 處理)
    loadSettings(); // ✓ 確保建案切換時，設定頁也會更新
  }
}, { immediate: true }); // immediate: true 確保一開始就觸發

// ... methods
const openInteractionLog = (event, { item }) => {
    // 🔍 Debug: 先印出來看看 item 的結構
    console.log("Clicked Item:", item);

    // ✅ [修正] 嘗試從 item 或 item.raw 獲取 docId
    // Vuetify 3 的 item 有時是 Proxy 物件，資料可能在 item.columns 或 item.raw 裡
    const docId = item.docId || (item.raw && item.raw.docId);

    if (!docId) {
        console.error("錯誤：無法從列表項目中獲取 docId");
        alert("系統錯誤：找不到該客戶的文件 ID");
        return;
    }

    selectedCustomerDocId.value = docId; 
    selectedCustomerSalesName.value = item.raw && item.raw['銷售人員'] ? item.raw['銷售人員'] : '';
    isInteractionDialogVisible.value = true;
};

// --- 進階篩選狀態 ---
const showFilters = ref(false);
const advFilter = reactive({
  startDate: '',
  endDate: '',
  sales: [],
  ratings: [],
  reasons: [],
  motivations: [],
  roomTypes: [],
  budgets: [],
  showDeleted: false
});

const resetAdvFilters = () => {
  Object.keys(advFilter).forEach(key => {
    if (key === 'showDeleted') {
      advFilter[key] = false;
    } else {
      advFilter[key] = Array.isArray(advFilter[key]) ? [] : '';
    }
  });
};

// --- 多維度篩選計算屬性 ---
const filteredCustomerList = computed(() => {
  let list = [...customerList.value];

  // 0. 過濾已被冷刪除的資料 (除非開啟 showDeleted)
  if (!advFilter.showDeleted) {
    list = list.filter(item => !item.isDeleted);
  }


  // 1. 關鍵字過濾 (姓名、電話、銷售人員)
  if (customerListSearch.value) {
    const s = customerListSearch.value.toLowerCase();
    list = list.filter(item => 
      (item['姓名'] || '').toLowerCase().includes(s) ||
      (item['電話'] || '').includes(s) ||
      (item['銷售人員'] || '').toLowerCase().includes(s)
    );
  }

  // 2. 拜訪日期範圍 (修正：確保日期格式一致)
  if (advFilter.startDate) {
    list = list.filter(item => item['拜訪日期'] >= advFilter.startDate);
  }
  if (advFilter.endDate) {
    list = list.filter(item => item['拜訪日期'] <= advFilter.endDate);
  }

  // 3. 多選條件過濾
  if (advFilter.sales.length > 0) {
    list = list.filter(item => advFilter.sales.includes(item['銷售人員']));
  }
  
  if (advFilter.ratings.length > 0) {
    list = list.filter(item => advFilter.ratings.includes(item['等級研判']));
  }

  // 4. 陣列型欄位過濾 (未購原因、購屋動機、房型需求)
  // 修正：增加 Array.isArray 檢查，防止資料異常導致報錯
  if (advFilter.reasons.length > 0) {
    list = list.filter(item => {
      const val = item['未買原因'];
      const arr = Array.isArray(val) ? val : (val ? [val] : []);
      return arr.some(r => advFilter.reasons.includes(r));
    });
  }

  if (advFilter.motivations.length > 0) {
    list = list.filter(item => {
      const val = item['購屋動機'];
      const arr = Array.isArray(val) ? val : (val ? [val] : []);
      return arr.some(m => advFilter.motivations.includes(m));
    });
  }

  if (advFilter.roomTypes.length > 0) {
    list = list.filter(item => {
      const val = item['房型需求'];
      const arr = Array.isArray(val) ? val : (val ? [val] : []);
      return arr.some(rt => advFilter.roomTypes.includes(rt));
    });
  }

  if (advFilter.budgets.length > 0) {
    list = list.filter(item => advFilter.budgets.includes(item['購屋預算']));
  }

  return list;
});

</script>

<style scoped>
/* 加入滑鼠手勢樣式 */
:deep(.cursor-pointer-row tbody tr) {
    cursor: pointer !important;
}
:deep(.cursor-pointer-row tbody tr:hover) {
    background-color: #f5f5f5 !important;
}

.text-pre-wrap {
  white-space: pre-wrap;
}

/* ===== 系統管理員專用標示樣式 ===== */

/* Tab 標籤 - 琥珀色底色 + 盾牌圖示 */
:deep(.admin-tab) {
  background: linear-gradient(135deg, #fff8e1 0%, #ffecb3 100%) !important;
  border-top: 2px solid #ffa000 !important;
  position: relative;
}
:deep(.admin-tab .v-icon) {
  color: #e65100 !important;
}
:deep(.admin-tab.v-tab--selected) {
  background: linear-gradient(135deg, #ffe082 0%, #ffca28 100%) !important;
}

/* 管理員頁面頂部橫幅 */
.admin-banner {
  border-bottom: 2px solid #ffa000 !important;
  background: linear-gradient(90deg, #fff8e1, #fff3e0) !important;
}
:deep(.admin-banner .v-banner__icon) {
  color: #e65100 !important;
}

/* 管理員專用卡片 - 左側橙色邊框 */
.admin-section-card {
  border-left: 4px solid #ff8f00 !important;
}

</style>