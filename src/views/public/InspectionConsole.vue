<template>
  <v-container fluid :class="mobile ? 'pa-0' : 'pa-2 pa-sm-4'" style="background-color: #F4F4F7; min-height: 100vh;"
    :style="mobile && projectId ? 'padding-bottom: 72px;' : ''">
    <v-card class="mx-auto" max-width="1600">

      <v-toolbar color="primary" dark flat :class="{ 'mobile-toolbar-wrap': mobile, 'py-2': mobile }" height="auto">
        <v-btn icon="mdi-home" variant="text" to="/home" aria-label="回系統選單"></v-btn>
        <v-toolbar-title class="font-weight-bold" :class="{ 'mobile-title-scaling': mobile }">

          {{ projectId ? `${projectName} 驗屋紀錄` : '驗屋系統 (選擇建案)' }}
          <span v-if="projectId && showDeleted" class="text-caption font-weight-light ml-2">(垃圾桶)</span>
          <span v-if="projectId && !showDeleted && !selectedUnit"
            class="text-caption font-weight-light ml-2">(全案紀錄)</span>
        </v-toolbar-title>
        <v-spacer></v-spacer>
        <v-btn icon="mdi-help-circle-outline" variant="text" @click="showOnboarding = true" aria-label="功能導覽"
          v-if="projectId"></v-btn>
        <template v-if="projectId && otherProjects.length > 0"> <v-menu offset-y> <template
              v-slot:activator="{ props: menuProps }"> <v-btn v-bind="menuProps" variant="text" class="pa-1"
                style="text-transform: none; letter-spacing: normal;" aria-label="切換建案"> <v-avatar size="32"
                  class="mr-2"><v-img :src="currentProject?.iconUrl || defaultProjectIcon"
                    :alt="currentProject?.name"></v-img></v-avatar> <v-icon size="small">mdi-chevron-down</v-icon>
              </v-btn> </template>
            <v-list density="compact" class="pa-0"> <v-list-item v-for="project in otherProjects" :key="project.id"
                @click="enterProject(project)" link> <template v-slot:prepend><v-avatar size="32" class="mr-3"><v-img
                      :src="project.iconUrl || defaultProjectIcon" :alt="project.name"></v-img></v-avatar></template>
                <v-list-item-title>{{ project.name }}</v-list-item-title> </v-list-item> </v-list> </v-menu> </template>
      </v-toolbar>

      <div v-if="isLoading" class="text-center pa-10"> <v-progress-circular indeterminate color="primary"
          size="50"></v-progress-circular>
        <p class="mt-4 text-grey">{{ loadingText }}</p>
      </div>
      <div v-else-if="!isBound" class="text-center pa-10"> <v-icon size="60" color="warning"
          class="mb-4">mdi-account-alert-outline</v-icon>
        <p class="text-h6">無法使用此功能</p>
        <p class="mt-2 text-grey-darken-1">您的 LINE 帳號尚未綁定系統手機，請先完成綁定。</p> <v-btn color="primary" class="mt-6"
          href="/?liff_path=line-binding" variant="elevated"> 前往綁定頁面 </v-btn>
      </div>

      <div v-else-if="isBound && projectId">
        <v-sheet class="pa-3 border-b">
          <v-row dense align="center">
            <v-col cols="12" sm="4" md="2" lg="2">
              <v-select v-model="selectedBuilding" :items="buildingItems" label="選擇棟別" variant="outlined" hide-details
                clearable @update:model-value="selectedUnit = null; clearAllFiltersQuiet(); loadData()"
                :loading="isLoadingStructure" :disabled="showDeleted"></v-select>
            </v-col>
            <v-col cols="12" sm="4" md="2" lg="2">
              <v-select v-model="selectedUnit" :items="unitItems" label="選擇戶別" variant="outlined" hide-details clearable
                :disabled="showDeleted || !selectedBuilding"
                @update:model-value="clearAllFiltersQuiet(); loadData()"></v-select>
            </v-col>
            <v-col cols="12" sm="4" :md="mobile ? 12 : 3" :lg="mobile ? 12 : 3">
              <v-text-field v-model="searchFilter" label="搜尋所有欄位" prepend-inner-icon="mdi-magnify" variant="outlined"
                hide-details clearable>
                <template v-slot:append-inner>
                  <v-chip size="small"
                    :color="activeFilterCount > 0 ? 'primary' : (showAdvancedFilter ? 'primary' : 'default')"
                    :variant="activeFilterCount > 0 || showAdvancedFilter ? 'flat' : 'outlined'"
                    prepend-icon="mdi-filter-outline" @click="showAdvancedFilter = !showAdvancedFilter"
                    style="cursor: pointer;">
                    篩選
                    <template v-if="activeFilterCount > 0">
                      ({{ activeFilterCount }})
                    </template>
                  </v-chip>
                </template>
              </v-text-field>
            </v-col>
            <v-col cols="12" md="5" lg="5" class="d-flex justify-end align-center mt-2 mt-md-0">
              <div v-if="!mobile" class="d-flex justify-end align-center flex-wrap ga-2" style="width: 100%;">
                <v-tooltip location="top"
                  :text="!(selectedUnit && selectedBuilding) ? '請先選擇棟別與戶別' : showDeleted ? '無法在刪除模式新增' : '新增驗屋紀錄'">
                  <template v-slot:activator="{ props: tooltipProps }">
                    <span v-bind="tooltipProps">
                      <v-btn color="primary" @click="openAddDialog" prepend-icon="mdi-plus"
                        :disabled="showDeleted || !(selectedUnit && selectedBuilding)">
                        新增
                      </v-btn>
                    </span>
                  </template>
                </v-tooltip>
                <v-btn-toggle v-model="showDeleted" :true-value="true" :false-value="false" mandatory variant="outlined"
                  divided color="primary" @update:model-value="handleModeChange">
                  <v-tooltip location="top" text="全案紀錄">
                    <template v-slot:activator="{ props }">
                      <v-btn v-bind="props" :value="false" icon="mdi-file-document-outline" aria-label="全案紀錄"></v-btn>
                    </template>
                  </v-tooltip>
                  <v-tooltip location="top" text="刪除資料">
                    <template v-slot:activator="{ props }">
                      <v-btn v-bind="props" :value="true" icon="mdi-delete-outline" aria-label="已刪除紀錄"></v-btn>
                    </template>
                  </v-tooltip>
                </v-btn-toggle>
                <v-btn-toggle v-model="viewMode" mandatory density="compact" variant="outlined" divided>
                  <v-tooltip location="top" text="表格模式"> <template v-slot:activator="{ props }"> <v-btn v-bind="props"
                        value="table" icon="mdi-table" aria-label="表格視圖"></v-btn> </template>
                  </v-tooltip>
                  <v-tooltip location="top" text="卡片模式"> <template v-slot:activator="{ props }"> <v-btn v-bind="props"
                        value="card" icon="mdi-view-dashboard" aria-label="卡片視圖"></v-btn> </template>
                  </v-tooltip>
                </v-btn-toggle>

                <v-menu offset-y>
                  <template v-slot:activator="{ props }">
                    <v-btn color="secondary" v-bind="props" size="small" prepend-icon="mdi-export-variant"
                      :disabled="!selectedUnit || showDeleted">
                      寄出報告
                    </v-btn>
                  </template>
                  <v-list density="compact">
                    <v-list-item @click="handleShareReport"> <template
                        v-slot:prepend><v-icon>mdi-share-variant-outline</v-icon></template>
                      <v-list-item-title>傳送記錄連結</v-list-item-title>
                    </v-list-item>
                    <v-list-item @click="handleGeneratePdf"> <template
                        v-slot:prepend><v-icon>mdi-file-pdf-box</v-icon></template>
                      <v-list-item-title>預覽與寄出報告</v-list-item-title>
                    </v-list-item>
                  </v-list>
                </v-menu>

                <v-menu offset-y>
                  <template v-slot:activator="{ props }">
                    <v-btn color="primary" v-bind="props" size="small" variant="outlined" prepend-icon="mdi-download"
                      :disabled="filteredRecords.length === 0">
                      下載報告
                    </v-btn>
                  </template>
                  <v-list density="compact">
                    <v-list-item @click="handleDownloadExcel" :disabled="filteredRecords.length === 0"> <template
                        v-slot:prepend><v-icon color="green">mdi-file-excel-box</v-icon></template>
                      <v-list-item-title>下載 Excel</v-list-item-title>
                    </v-list-item>
                    <v-list-item @click="handleDownloadPdf" :disabled="filteredRecords.length === 0"> <template
                        v-slot:prepend><v-icon color="red">mdi-file-pdf-box</v-icon></template>
                      <v-list-item-title>下載 PDF</v-list-item-title>
                    </v-list-item>
                  </v-list>
                </v-menu>
              </div>
            </v-col>
          </v-row>

          <!-- 進階篩選面板 -->
          <v-expand-transition>
            <div v-show="showAdvancedFilter" class="mt-3">
              <v-sheet rounded="lg" class="pa-3 bg-blue-grey-lighten-5 advanced-filter-panel">
                <div class="d-flex align-center mb-2">
                  <v-icon size="small" color="primary" class="mr-1">mdi-filter-cog-outline</v-icon>
                  <span class="text-subtitle-2 font-weight-bold text-primary">進階篩選</span>
                  <v-chip v-if="activeFilterCount > 0" size="x-small" color="primary" variant="tonal" class="ml-2">
                    {{ activeFilterCount }} 個條件
                  </v-chip>
                  <v-spacer></v-spacer>
                  <v-btn v-if="activeFilterCount > 0" variant="text" size="small" color="error"
                    prepend-icon="mdi-filter-off-outline" @click="clearAllFilters">
                    清除全部
                  </v-btn>
                  <v-btn icon="mdi-close" variant="text" size="x-small" @click="showAdvancedFilter = false"></v-btn>
                </div>

                <v-row dense>
                  <!-- 日期範圍 -->
                  <v-col cols="12" sm="6" md="3">
                    <v-text-field v-model="advancedFilters.dateFrom" label="開始日期" type="date" variant="outlined"
                      density="compact" hide-details clearable prepend-inner-icon="mdi-calendar-start" bg-color="white"
                      @update:model-value="onDateFromChange"></v-text-field>
                  </v-col>
                  <v-col cols="12" sm="6" md="3">
                    <v-text-field v-model="advancedFilters.dateTo" label="結束日期" type="date" variant="outlined"
                      density="compact" hide-details clearable prepend-inner-icon="mdi-calendar-end" bg-color="white"
                      :disabled="!advancedFilters.dateFrom" :min="advancedFilters.dateFrom || undefined"></v-text-field>
                  </v-col>

                  <!-- 階段 -->
                  <v-col cols="12" sm="6" md="3">
                    <v-select v-model="advancedFilters.phase" :items="phaseFilterItems" label="階段" variant="outlined"
                      density="compact" hide-details clearable multiple chips closable-chips
                      prepend-inner-icon="mdi-layers-outline" bg-color="white"></v-select>
                  </v-col>

                  <!-- 客戶確認 -->
                  <v-col cols="12" sm="6" md="3">
                    <v-select v-model="advancedFilters.confirmed" :items="confirmedFilterItems" label="客戶確認"
                      variant="outlined" density="compact" hide-details clearable
                      prepend-inner-icon="mdi-check-decagram-outline" bg-color="white"></v-select>
                  </v-col>
                </v-row>

                <v-row dense class="mt-1">
                  <!-- 狀態 -->
                  <v-col cols="12" sm="6" md="4">
                    <v-select v-model="advancedFilters.status" :items="statusFilterItems" label="狀態" variant="outlined"
                      density="compact" hide-details clearable multiple chips closable-chips
                      prepend-inner-icon="mdi-clipboard-check-outline" bg-color="white"></v-select>
                  </v-col>

                  <!-- 進度 -->
                  <v-col cols="12" sm="6" md="4">
                    <v-select v-model="advancedFilters.progress" :items="progressFilterItems" label="進度"
                      variant="outlined" density="compact" hide-details clearable multiple chips closable-chips
                      prepend-inner-icon="mdi-progress-wrench" bg-color="white"></v-select>
                  </v-col>

                  <!-- 等級 -->
                  <v-col cols="12" sm="6" md="4">
                    <v-select v-model="advancedFilters.level" :items="levelFilterItems" label="等級" variant="outlined"
                      density="compact" hide-details clearable multiple chips closable-chips
                      prepend-inner-icon="mdi-alert-circle-outline" bg-color="white"></v-select>
                  </v-col>
                </v-row>

                <!-- 篩選結果統計 + 未完全載入警告 -->
                <div v-if="activeFilterCount > 0" class="mt-2">
                  <v-alert v-if="hasMore && !showDeleted" type="warning" variant="tonal" density="compact" class="mb-2">
                    <div class="d-flex align-center flex-wrap ga-2">
                      <span class="text-body-2">
                        ⚠️ 目前僅載入部分紀錄 ({{ allRecords.length }} 筆)，篩選結果可能不完整。
                      </span>
                      <v-btn size="small" variant="outlined" color="warning" prepend-icon="mdi-database-sync"
                        @click="loadAllRecords" :loading="isLoadingAll">
                        載入全部紀錄
                      </v-btn>
                    </div>
                  </v-alert>
                  <div class="d-flex align-center">
                    <v-icon size="small" color="grey" class="mr-1">mdi-information-outline</v-icon>
                    <span class="text-caption text-grey">
                      篩選結果：{{ filteredRecords.length }} 筆 / 共 {{ allRecords.length }} 筆
                      <template v-if="hasMore && !showDeleted"> (未全部載入)</template>
                    </span>
                  </div>
                </div>
              </v-sheet>
            </div>
          </v-expand-transition>
        </v-sheet>
        <div v-if="isLoadingRecords" class="text-center pa-10"> <v-progress-circular indeterminate color="primary"
            size="40"></v-progress-circular>
          <p class="mt-4 text-grey">正在載入紀錄...</p>
        </div>
        <div v-else-if="filteredRecords.length > 0">
          <div v-if="viewMode === 'table'">
            <v-data-table :headers="headers" :items="filteredRecords" :loading="isLoadingRecords" :search="searchFilter"
              item-value="id" class="elevation-0" :items-per-page="10"
              :items-per-page-options="[{ value: 10, title: '10' }, { value: 25, title: '25' }, { value: 50, title: '50' }, { value: 100, title: '100' }, { value: -1, title: '全部顯示' }]"
              density="compact">
              <template v-slot:item="{ item }">
                <tr :class="{ 'confirmed-record-bg': !!item.customerConfirmedAt }">
                  <td v-if="!selectedUnit">{{ item.unitId }}</td>
                  <td>{{ formatDate(item.inspectionDate) }}</td>
                  <td>{{ item.phase }}</td>
                  <td>
                    <div class="d-flex ga-1 pa-1">
                      <v-img v-for="(photo, index) in item.photos.slice(0, 4)" :key="index" :src="photo.url"
                        aspect-ratio="1" cover width="40" class="rounded border cursor-pointer"
                        @click="showImagePreview(photo.url)">
                        <template v-slot:placeholder>
                          <div class="d-flex align-center justify-center fill-height"> <v-progress-circular
                              indeterminate color="grey-lighten-4"></v-progress-circular> </div>
                        </template>
                      </v-img>
                    </div>
                  </td>
                  <td>{{ item.area }}</td>
                  <td>{{ item.category }}</td>
                  <td>{{ item.subCategory }}</td>
                  <td>
                    <ChipRenderer v-if="showDeleted" :value="item.status" type="status"
                      :options="optionsForChips.status" size="small" />
                    <div v-else class="position-relative">
                      <v-fade-transition> <v-overlay
                          v-if="updatingRecord.id === item.id && updatingRecord.field === 'status'" contained persistent
                          class="align-center justify-center"> <v-progress-circular indeterminate
                            size="20"></v-progress-circular> </v-overlay> </v-fade-transition>
                      <v-menu offset-y> <template v-slot:activator="{ props: menuProps }">
                          <ChipRenderer v-bind="menuProps" :value="item.status" type="status"
                            :options="optionsForChips.status" style="cursor: pointer;" size="small" />
                        </template>
                        <v-sheet class="pa-2"> <v-chip-group column :model-value="item.status"
                            @update:model-value="(newValue) => { handleFieldUpdate(item, 'status', newValue); }">
                            <v-chip v-for="option in optionsForChips.status" :key="option.id" :value="option.value"
                              :color="option.color || 'grey'" filter variant="outlined" size="small"> <v-icon
                                v-if="option.icon" start size="small">{{ option.icon }}</v-icon> {{ option.value }}
                            </v-chip> </v-chip-group> </v-sheet>
                      </v-menu>
                    </div>
                  </td>
                  <td>
                    <ChipRenderer v-if="showDeleted" :value="item.level" type="level" :options="optionsForChips.level"
                      size="small" />
                    <div v-else class="position-relative">
                      <v-fade-transition> <v-overlay
                          v-if="updatingRecord.id === item.id && updatingRecord.field === 'level'" contained persistent
                          class="align-center justify-center"> <v-progress-circular indeterminate
                            size="20"></v-progress-circular> </v-overlay> </v-fade-transition>
                      <v-menu offset-y> <template v-slot:activator="{ props: menuProps }">
                          <ChipRenderer v-bind="menuProps" :value="item.level" type="level"
                            :options="optionsForChips.level" style="cursor: pointer;" size="small" />
                        </template>
                        <v-sheet class="pa-2"> <v-chip-group column :model-value="item.level"
                            @update:model-value="(newValue) => { handleFieldUpdate(item, 'level', newValue); }"> <v-chip
                              v-for="option in optionsForChips.level" :key="option.id" :value="option.value"
                              :color="option.color || 'grey'" filter variant="outlined" size="small">{{ option.value
                              }}</v-chip>
                          </v-chip-group> </v-sheet> </v-menu>
                    </div>
                  </td>
                  <td>
                    <ChipRenderer v-if="showDeleted" :value="item.progress" type="progress"
                      :options="optionsForChips.progress" size="small" />
                    <div v-else class="position-relative">
                      <v-fade-transition> <v-overlay
                          v-if="updatingRecord.id === item.id && updatingRecord.field === 'progress'" contained
                          persistent class="align-center justify-center"> <v-progress-circular indeterminate
                            size="20"></v-progress-circular> </v-overlay> </v-fade-transition>
                      <v-menu offset-y> <template v-slot:activator="{ props: menuProps }">
                          <ChipRenderer v-bind="menuProps" :value="item.progress" type="progress"
                            :options="optionsForChips.progress" style="cursor: pointer;" size="small" />
                        </template>
                        <v-sheet class="pa-2"> <v-chip-group column :model-value="item.progress"
                            @update:model-value="(newValue) => { handleFieldUpdate(item, 'progress', newValue); }">
                            <v-chip v-for="option in optionsForChips.progress" :key="option.id" :value="option.value"
                              :color="option.color || 'grey'" filter variant="outlined" size="small"> <v-icon
                                v-if="option.icon" start size="small">{{ option.icon }}</v-icon> {{ option.value }}
                            </v-chip> </v-chip-group> </v-sheet>
                      </v-menu>
                    </div>
                  </td>
                  <td>
                    <span v-if="item.customerConfirmedAt" class="text-caption text-success-darken-1">
                      {{ formatDate(item.customerConfirmedAt) }}
                    </span>
                    <v-chip v-else color="red" text-color="white" size="small" label>
                      客戶未確認
                    </v-chip>
                  </td>
                  <td>{{ item.description }}</td>
                  <td>{{ item.inspectorName }}</td>
                  <td>{{ formatDateTime(item.createdAt) }}</td>
                  <td v-if="showDeleted">{{ formatDateTime(item.deletedAt) }}</td>
                  <td>
                    <div class="d-flex align-center justify-start ga-0">
                      <template v-if="!showDeleted">
                        <div class="position-relative"> <v-fade-transition> <v-overlay
                              v-if="updatingRecord.id === item.id && updatingRecord.field === 'customerView'" contained
                              persistent class="align-center justify-center" scrim="rgba(255, 255, 255, 0.7)">
                              <v-progress-circular indeterminate size="20"></v-progress-circular> </v-overlay>
                          </v-fade-transition> <v-tooltip location="top"
                            :text="item.customerView === false ? '不顯示於報告' : '顯示於報告'"> <template
                              v-slot:activator="{ props }"> <v-btn v-bind="props"
                                :icon="item.customerView === false ? 'mdi-eye-off-outline' : 'mdi-eye-outline'"
                                :color="item.customerView === false ? 'grey' : 'primary'" variant="text" size="small"
                                density="compact"
                                @click="() => { console.log('Eye Btn Clicked:', { id: item.id, current: item.customerView, next: !(item.customerView ?? true) }); handleFieldUpdate(item, 'customerView', !(item.customerView ?? true)); }"
                                :disabled="updatingRecord.id === item.id && updatingRecord.field === 'customerView'"
                                aria-label="切換客戶檢視狀態"></v-btn> </template>
                          </v-tooltip>
                        </div>
                        <v-tooltip location="top" text="編輯"> <template v-slot:activator="{ props }"> <v-btn
                              v-bind="props" icon="mdi-pencil" variant="text" size="small" density="compact"
                              @click="openEditDialog(item)" color="primary" aria-label="編輯紀錄"></v-btn> </template>
                        </v-tooltip>
                        <v-tooltip location="top" text="刪除"> <template v-slot:activator="{ props }"> <v-btn
                              v-bind="props" icon="mdi-delete" variant="text" size="small" density="compact"
                              @click="openDeleteDialog(item)" color="error" aria-label="刪除紀錄"></v-btn> </template>
                        </v-tooltip>
                      </template>
                      <template v-else>
                        <v-tooltip location="top" text="還原"> <template v-slot:activator="{ props }"> <v-btn
                              v-bind="props" icon="mdi-restore" variant="text" size="small" density="compact"
                              @click="openRestoreDialog(item)" color="success" aria-label="還原紀錄"></v-btn> </template>
                        </v-tooltip>
                      </template>
                    </div>
                  </td>
                </tr>
              </template>
              <template v-slot:no-data>
                <div class="pa-4 text-center text-grey"> {{ noDataText }} </div>
              </template>
            </v-data-table>
          </div>
          <div v-if="viewMode === 'card'" class="pa-2 pa-sm-4">
            <v-row dense>
              <v-col v-for="item in cardDisplayRecords" :key="item.id" cols="12" sm="6" md="4" lg="3">
                <v-card class="mb-3 record-card" variant="outlined"
                  :class="{ 'deleted-card-look': showDeleted, 'confirmed-record-bg': !!item.customerConfirmedAt }">
                  <div v-if="!selectedUnit" class="pa-2 border-b"
                    :class="showDeleted ? 'bg-grey-lighten-4' : 'bg-blue-grey-lighten-5'">
                    <strong :class="showDeleted ? 'text-grey-darken-2' : 'text-blue-grey-darken-3'">戶別: {{ item.unitId
                    }}</strong>
                  </div>
                  <div v-if="item.photos && item.photos.length > 0" class="d-flex ga-1 pa-2 border-b photo-strip">
                    <v-img v-for="(photo, index) in item.photos.slice(0, 5)" :key="index" :src="photo.url"
                      aspect-ratio="1" cover height="50" class="rounded border cursor-pointer"
                      @click="showImagePreview(photo.url)">
                      <template v-slot:placeholder>
                        <div class="d-flex align-center justify-center fill-height"> <v-progress-circular indeterminate
                            size="20" color="grey-lighten-2"></v-progress-circular> </div>
                      </template>
                      <div v-if="index === 4 && item.photos.length > 5"
                        class="photo-overlay d-flex align-center justify-center">
                        +{{ item.photos.length - 5 }} </div>
                    </v-img>
                  </div>
                  <v-card-item class="pb-1 pt-2">
                    <div> <span class="text-subtitle-1 font-weight-bold mr-2">{{ item.area }}</span> <span
                        class="text-caption text-grey">{{ formatDate(item.inspectionDate) }} - {{ item.phase }}</span>
                    </div>
                    <p class="text-body-2 text-medium-emphasis mt-1"> {{ item.category }} / {{ item.subCategory }} </p>
                  </v-card-item>
                  <v-card-text class="py-2">
                    <div class="d-flex ga-2 flex-wrap mb-1">
                      <ChipRenderer size="small" :value="item.status" type="status" :options="optionsForChips.status" />
                      <ChipRenderer size="small" :value="item.level" type="level" :options="optionsForChips.level" />
                      <ChipRenderer size="small" :value="item.progress" type="progress"
                        :options="optionsForChips.progress" />
                    </div>
                    <p v-if="item.description" class="text-caption text-medium-emphasis description-truncate mt-1"> {{
                      item.description }} </p>
                    <p v-if="showDeleted && item.deletedAt" class="text-caption text-error mt-1"> 刪除時間: {{
                      formatDateTime(item.deletedAt) }} </p>
                  </v-card-text>
                  <v-divider></v-divider>
                  <v-card-actions class="px-3 py-1">
                    <div class="d-flex flex-column flex-grow-1 mr-2">
                      <span class="text-caption text-grey"> 驗屋人員: {{ item.inspectorName }} @ {{
                        formatDateTime(item.createdAt) }}
                      </span>
                      <span v-if="item.customerConfirmedAt" class="text-caption text-success-darken-1 mt-1">
                        客戶確認：{{ formatDate(item.customerConfirmedAt) }}
                      </span>
                      <v-chip v-else color="red" text-color="white" size="x-small" label class="mt-1">
                        客戶未確認
                      </v-chip>
                    </div>
                    <template v-if="!showDeleted">
                      <div class="position-relative"> <v-fade-transition> <v-overlay
                            v-if="updatingRecord.id === item.id && updatingRecord.field === 'customerView'" contained
                            scrim="rgba(255, 255, 255, 0.7)" persistent class="align-center justify-center">
                            <v-progress-circular indeterminate size="16" width="2"></v-progress-circular> </v-overlay>
                        </v-fade-transition> <v-tooltip location="top"
                          :text="item.customerView === false ? '不顯示於報告' : '顯示於報告'"> <template
                            v-slot:activator="{ props }"> <v-btn v-bind="props"
                              :icon="item.customerView === false ? 'mdi-eye-off-outline' : 'mdi-eye-outline'"
                              :color="item.customerView === false ? 'grey' : 'primary'" variant="text" size="small"
                              @click="handleFieldUpdate(item, 'customerView', !(item.customerView ?? true))"
                              :disabled="updatingRecord.id === item.id && updatingRecord.field === 'customerView'"
                              aria-label="切換客戶檢視狀態"></v-btn> </template>
                        </v-tooltip>
                      </div>
                      <v-btn icon="mdi-pencil" variant="text" size="small" @click="openEditDialog(item)" color="primary"
                        aria-label="編輯紀錄"></v-btn>
                      <v-btn icon="mdi-delete" variant="text" size="small" @click="openDeleteDialog(item)" color="error"
                        aria-label="刪除紀錄"></v-btn>
                    </template>
                    <template v-else>
                      <v-btn icon="mdi-restore" variant="text" size="small" @click="openRestoreDialog(item)"
                        color="success" aria-label="還原紀錄"></v-btn>
                    </template>
                  </v-card-actions>
                </v-card>
              </v-col>
            </v-row>
            <!-- Card View 前端分頁：顯示更多 -->
            <div v-if="hasMoreCards" class="text-center py-4">
              <v-btn variant="outlined" color="primary" @click="showMoreCards" prepend-icon="mdi-chevron-down">
                顯示更多 (已顯示 {{ cardDisplayRecords.length }} / {{ filteredRecords.length }} 筆)
              </v-btn>
            </div>
          </div>
          <!-- 「載入更多」按鈕 (後端分頁，Table & Card 共用) -->
          <div v-if="hasMore && !showDeleted" class="text-center py-4 border-t">
            <v-btn variant="tonal" color="primary" @click="loadMoreRecords" :loading="isLoadingMore"
              prepend-icon="mdi-database-arrow-down">
              從資料庫載入更多紀錄 (目前已載入 {{ allRecords.length }} 筆)
            </v-btn>
            <p class="text-caption text-grey mt-1">每次會從資料庫讀取 {{ PAGE_SIZE }} 筆新紀錄</p>
          </div>
        </div>
        <div v-else class="pa-10 text-center text-grey"> {{ noDataText }} </div>
      </div>

      <div v-else-if="isBound && !projectId" class="pa-6">
        <p class="text-h6 text-center mb-6"> 歡迎，{{ userStore.user?.name }}！<br> 請選擇您要進入的驗屋系統建案： </p>
        <div v-if="authorizedProjects.length > 0" class="d-flex flex-wrap justify-center ga-4">
          <IconButton v-for="project in authorizedProjects" :key="project.id"
            :icon="project.iconUrl || defaultProjectIcon" :text="project.name" :scale="0.8"
            @click="enterProject(project)" />
        </div> <v-alert v-else type="warning" variant="tonal" class="mt-4"> 您目前沒有任何建案的「驗屋系統」權限。 </v-alert>
      </div>

    </v-card>

    <InspectionRecordEditor v-model="showEditorDialog" :project-id="projectId" :project-name="projectName"
      :unit-id="recordBeingEdited ? recordBeingEdited.unitId : selectedUnit" :record-to-edit="recordBeingEdited"
      @saved="handleRecordSaved" fullscreen />

    <v-dialog v-model="showShareDialog" persistent max-width="500px">
      <v-card :loading="isGeneratingUrl">
        <v-card-title class="text-h6 d-flex align-center">
          <v-icon start color="primary">mdi-share-variant</v-icon>
          分享驗屋報告連結
          <v-spacer></v-spacer>
          <v-btn icon="mdi-close" variant="text" @click="closeShareDialog"></v-btn>
        </v-card-title>
        <v-divider></v-divider>

        <v-card-text class="text-center">
          <div v-if="isGeneratingUrl" class="py-8">
            <v-progress-circular indeterminate color="primary" size="40"></v-progress-circular>
            <p class="mt-3 text-grey">正在產生安全連結...</p>
          </div>
          <div v-else-if="shareError" class="py-8">
            <v-icon color="error" size="40">mdi-alert-circle-outline</v-icon>
            <p class="mt-3 text-error">產生連結失敗:</p>
            <p class="text-caption">{{ shareError }}</p>
            <v-btn color="primary" @click="handleShareReport" class="mt-4">重試</v-btn>
          </div>
          <div v-else class="py-4">
            <p class="mb-4">請將下方連結或 QR Code 提供給客戶：</p>
            <qrcode-vue :value="shareUrl" :size="200" level="H" class="mb-4 d-inline-block border pa-1"></qrcode-vue>

            <v-text-field :model-value="shareUrl" label="分享連結 (有效期限 90 天)" readonly variant="outlined" density="compact"
              append-inner-icon="mdi-content-copy" @click:append-inner="copyShareUrl" hide-details></v-text-field>
            <v-scroll-y-transition>
              <div v-if="copySuccess" class="text-success text-caption mt-1">已複製！</div>
            </v-scroll-y-transition>
          </div>
        </v-card-text>

        <v-card-actions v-if="!isGeneratingUrl && !shareError">
          <v-spacer></v-spacer>
          <v-btn color="primary" variant="text" @click="closeShareDialog">關閉</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="showGeneratePdfDialog" persistent fullscreen transition="dialog-bottom-transition">
      <v-card>
        <v-toolbar dark color="secondary">
          <v-btn icon dark @click="showGeneratePdfDialog = false">
            <v-icon>mdi-close</v-icon>
          </v-btn>
          <v-toolbar-title>產製驗屋報告 PDF</v-toolbar-title>
          <v-spacer></v-spacer>
        </v-toolbar>

        <v-card-text class="pa-4">
          <div v-if="isLoadingBatches" class="text-center py-10">
            <v-progress-circular indeterminate color="primary" size="40"></v-progress-circular>
            <p class="mt-3 text-grey">正在查詢已確認的驗屋紀錄...</p>
          </div>
          <div v-else-if="batchError" class="text-center py-10">
            <v-icon color="error" size="40">mdi-alert-circle-outline</v-icon>
            <p class="mt-3 text-error">查詢失敗:</p>
            <p class="text-caption">{{ batchError }}</p>
            <v-btn color="primary" @click="loadConfirmedBatches" class="mt-4">重試</v-btn>
          </div>
          <div v-if="confirmedBatches.length === 0" class="text-center pa-4">
            <v-icon size="64" color="warning" class="mb-3">mdi-alert-circle-outline</v-icon>
            <div class="text-h6 mb-2">尚未產生可供產製報告的「驗屋紀錄批次」</div>
            <p class="text-body-1 text-grey-darken-1 mb-6">
              請先「傳送記錄連結」給客戶，當客戶在線上確認缺失並簽名後，系統便會自動產生確認批次，屆時您才能在此處產製正式的 PDF 報告。
            </p>

            <v-card variant="outlined" class="pa-4 bg-grey-lighten-4 rounded-lg">
              <div class="text-subtitle-1 font-weight-bold mb-3 text-primary">提供給客戶的專屬確認連結：</div>

              <p class="mb-4 text-grey-darken-1">請將下方連結或 QR Code 提供給客戶：</p>
              <qrcode-vue :value="shareUrl" :size="200" level="H"
                class="mb-4 d-inline-block border pa-1 bg-white"></qrcode-vue>

              <v-text-field :model-value="shareUrl" label="分享連結 (有效期限 90 天)" readonly variant="outlined"
                density="compact" append-inner-icon="mdi-content-copy" @click:append-inner="copyShareUrl" hide-details
                class="bg-white"></v-text-field>
              <v-scroll-y-transition>
                <div v-if="copySuccess" class="text-success text-caption mt-1">已複製！</div>
              </v-scroll-y-transition>
            </v-card>
          </div>
          <div v-else>
            <v-row dense class="mb-4">
              <v-col cols="12" sm="4">
                <v-text-field label="建案名稱" :model-value="projectName" readonly variant="outlined" density="compact"
                  hide-details></v-text-field>
              </v-col>
              <v-col cols="12" sm="4">
                <v-text-field label="戶別" :model-value="selectedUnit" readonly variant="outlined" density="compact"
                  hide-details></v-text-field>
              </v-col>
              <v-col cols="12" sm="4">
                <v-text-field v-model="inspectorNameForPdf" label="報告產製人員 (可修改)" variant="outlined" density="compact"
                  hide-details clearable></v-text-field>
              </v-col>
            </v-row>

            <p class="text-subtitle-1 mb-2">請選擇要產製報告的驗屋紀錄批次：</p>
            <v-item-group v-model="selectedBatchId" mandatory>
              <v-row dense>
                <v-col v-for="batch in confirmedBatches" :key="batch.batchId" cols="12" md="6" lg="4">
                  <v-item v-slot="{ isSelected, toggle }" :value="batch.batchId">
                    <v-card :color="isSelected ? 'primary' : ''" :variant="isSelected ? 'elevated' : 'outlined'"
                      class="fill-height d-flex flex-column" @click="toggle" style="cursor: pointer;">
                      <v-card-item>
                        <div>
                          <div class="text-overline mb-1">
                            確認日期: {{ batch.dateString }}
                          </div>
                          <div class="text-h6 mb-1">
                            共 {{ batch.recordCount }} 筆紀錄
                          </div>
                          <v-divider class="my-1"></v-divider>
                          <div class="text-caption mb-2">
                            <strong>紀錄摘要：</strong>
                            <ul style="padding-left: 16px; margin-top: 4px;">
                              <li v-for="(record, index) in getBatchRecordsSummary(batch.batchId)" :key="index"
                                class="text-truncate">
                                {{ record.area }} - {{ record.category }} / {{ record.subCategory }} <span
                                  v-if="record.level">({{ record.level }})</span>
                                <span v-if="record.description" class="text-grey-darken-1"> - {{ record.description
                                }}</span>
                              </li>
                            </ul>
                            <div v-if="batch.recordCount > 5" class="text-grey ml-1 mt-1">...等共 {{ batch.recordCount }}
                              筆
                            </div>
                          </div>
                          <v-divider class="my-1"></v-divider>
                          <div class="text-caption">客戶姓名: {{ batch.buyerInfo?.name || '無' }}</div>
                          <div class="text-caption">電話: {{ batch.buyerInfo?.phone || '無' }}</div>
                          <div class="text-caption">Email: {{ batch.buyerInfo?.email || '無' }}</div>
                        </div>
                      </v-card-item>
                      <v-spacer></v-spacer>
                      <v-fade-transition>
                        <v-overlay v-if="isSelected" contained scrim="primary" class="align-center justify-center">
                          <v-icon size="x-large">mdi-check-circle-outline</v-icon>
                        </v-overlay>
                      </v-fade-transition>
                    </v-card>
                  </v-item>
                </v-col>
              </v-row>
            </v-item-group>
          </div>
        </v-card-text>

        <v-card-actions class="pa-4">
          <v-spacer></v-spacer>
          <v-btn color="grey-darken-1" variant="text" @click="showGeneratePdfDialog = false">
            取消
          </v-btn>
          <v-btn color="primary" variant="elevated" @click="handleDownloadBatchPdf"
            :disabled="!selectedBatchId || isLoadingBatches" size="large" prepend-icon="mdi-file-document-outline"
            class="mr-2">
            觀看預覽與寄出
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="showPdfPreviewDialog" max-width="450px" persistent>
      <v-card class="pa-4 text-center rounded-xl">
        <v-card-text>
          <v-icon color="success" size="64" class="mb-4">mdi-check-circle-outline</v-icon>
          <div class="text-h5 font-weight-bold mb-2">報告產製成功</div>
          <div class="text-body-1 text-medium-emphasis mb-6">
            您的驗屋報告 PDF 已經準備就緒。<br>您想要執行什麼操作？
          </div>

          <v-btn color="info" variant="flat" block size="large" class="mb-3" @click="handlePreviewReport"
            prepend-icon="mdi-file-pdf-box">
            在系統內預覽報告
          </v-btn>

          <v-btn color="primary" variant="flat" block size="large" class="mb-3" @click="openEmailDialog"
            prepend-icon="mdi-email-fast">
            透過系統寄出報告
          </v-btn>

          <v-btn color="secondary" variant="outlined" block size="large" class="mb-6" @click="downloadPreviewPdf"
            prepend-icon="mdi-download">
            下載檔案至本機
          </v-btn>
        </v-card-text>

        <v-card-actions class="justify-center border-t pt-4">
          <v-btn variant="text" color="grey-darken-1" @click="showPdfPreviewDialog = false">關閉此視窗</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- 線上預覽 PDF (使用 vue-pdf-embed) -->
    <v-dialog v-model="showInnerPdfPreview" fullscreen transition="dialog-bottom-transition" style="z-index: 3000;">
      <v-card class="bg-grey-lighten-4">
        <v-toolbar color="primary" dark>
          <v-btn icon @click="showInnerPdfPreview = false">
            <v-icon>mdi-close</v-icon>
          </v-btn>
          <v-toolbar-title>{{ innerPreviewTitle }}</v-toolbar-title>
          <v-spacer></v-spacer>
        </v-toolbar>
        <v-card-text class="pa-2 pa-sm-4 overflow-y-auto w-100" style="background-color: #525659; height: 100%;">
          <div class="mx-auto" style="max-width: 900px;">
            <vue-pdf-embed v-if="pdfEmbedSource" :source="pdfEmbedSource" class="mb-4 elevation-4 bg-white" />
            <div v-else class="text-center text-white py-10">資料載入中...</div>
          </div>
        </v-card-text>
      </v-card>
    </v-dialog>

    <v-dialog v-model="showEmailListDialog" max-width="500px">
      <v-card>
        <v-card-title class="text-h6 bg-blue-grey-lighten-5">
          <v-icon start>mdi-account-multiple-check</v-icon>
          勾選信件收件人
        </v-card-title>
        <v-card-text class="pt-4">
          <p class="mb-4 text-subtitle-2 text-primary">主要收件人(客戶)將顯示在信件 TO 欄位，其餘將顯示於 BCC (密件抄送)。</p>
          <v-list density="compact" class="bg-grey-lighten-4 rounded" max-height="300" style="overflow-y: auto;">
            <v-list-item v-for="(recipient, index) in emailRecipients" :key="index"
              @click="recipient.selected = !recipient.selected">
              <template v-slot:prepend>
                <v-checkbox-btn v-model="recipient.selected"></v-checkbox-btn>
              </template>
              <v-list-item-title class="font-weight-medium">{{ recipient.label }}</v-list-item-title>
              <v-list-item-subtitle>{{ recipient.email }}</v-list-item-subtitle>
            </v-list-item>
          </v-list>
          <v-divider class="my-4"></v-divider>
          <template v-if="pdfTemplate?.emailAttachments?.enabled && pdfTemplate?.emailAttachments?.files?.length > 0">
            <v-checkbox v-model="includeAttachments" label="一併夾帶專案預設附件" color="primary" hide-details
              density="compact"></v-checkbox>
            <div v-if="includeAttachments" class="mt-3 pl-8">
              <div class="text-caption text-grey-darken-1 mb-2">請勾選要夾帶的附件 (名稱點擊可預覽)：</div>
              <div class="d-flex flex-column ga-1">
                <v-checkbox v-for="(file, idx) in pdfTemplate.emailAttachments.files" :key="idx"
                  v-model="selectedAttachments" :value="file.url" color="blue-grey" density="compact" hide-details>
                  <template v-slot:label>
                    <a href="javascript:void(0)" @click.stop.prevent="handlePreviewAttachment(file)"
                      class="text-decoration-none text-blue-grey-darken-2 font-weight-medium">
                      <v-icon size="small" class="mr-1">mdi-paperclip</v-icon>
                      {{ file.name }}
                    </a>
                  </template>
                </v-checkbox>
              </div>
            </div>
          </template>
          <template v-else>
            <div class="text-caption text-grey mt-4">此建案目前無設定預設附件。</div>
          </template>
        </v-card-text>
        <v-divider></v-divider>
        <v-card-actions>
          <v-btn variant="text" @click="toggleAllEmails(true)">全選</v-btn>
          <v-btn variant="text" @click="toggleAllEmails(false)">取消全選</v-btn>
          <v-spacer></v-spacer>
          <v-btn color="grey-darken-1" variant="text" @click="showEmailListDialog = false">取消</v-btn>
          <v-btn color="primary" variant="flat" @click="sendInspectionEmail" :loading="isSendingEmail">確認寄出</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="showProcessingDialog" persistent max-width="400px">
      <v-card color="primary">
        <v-card-text class="d-flex align-center pa-4">
          <v-progress-circular indeterminate color="white" class="mr-4"></v-progress-circular>
          <div>
            <div class="text-h6">報告產製中...</div>
            <div class="text-caption">完成後將會寄送 Email 通知客戶及產製人員。此視窗可關閉。</div>
          </div>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn variant="text" @click="closeProcessingDialog">關閉視窗</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="showPreviewDialog" max-width="80vw" max-height="90vh"> <v-card> <v-toolbar dense flat
          class="border-b"> <v-spacer></v-spacer> <v-btn icon="mdi-close" @click="showPreviewDialog = false"></v-btn>
        </v-toolbar> <v-card-text class="pa-0"> <v-img :src="previewImageUrl" contain
            max-height="calc(90vh - 48px)"></v-img> </v-card-text> </v-card> </v-dialog>
    <v-dialog v-model="showDeleteDialog" persistent max-width="400px"> <v-card> <v-card-title
          class="text-h6 text-error">
          <v-icon start>mdi-alert-circle-outline</v-icon> 確認刪除紀錄 </v-card-title> <v-card-text> 您確定要將這筆驗屋紀錄移至資源回收桶嗎？ <div
            v-if="recordToDelete" class="mt-2 text-caption text-medium-emphasis"> 日期: {{
              formatDate(recordToDelete.inspectionDate) }} <br> 區域: {{ recordToDelete.area }} <br> 種類: {{
              recordToDelete.category }} / {{ recordToDelete.subCategory }} </div> <br> <strong
            class="text-error">您之後可以在資源回收桶中還原。</strong> </v-card-text> <v-card-actions> <v-spacer></v-spacer> <v-btn
            color="grey-darken-1" text @click="showDeleteDialog = false" :disabled="isDeleting">取消</v-btn> <v-btn
            color="error" variant="flat" @click="confirmDeleteRecord" :loading="isDeleting">確認刪除</v-btn>
        </v-card-actions>
      </v-card> </v-dialog>
    <v-dialog v-model="showRestoreDialog" persistent max-width="400px"> <v-card> <v-card-title
          class="text-h6 text-success">
          <v-icon start>mdi-restore</v-icon> 確認還原紀錄 </v-card-title> <v-card-text> 您確定要還原這筆驗屋紀錄嗎？ <div
            v-if="recordToRestore" class="mt-2 text-caption text-medium-emphasis"> 日期: {{
              formatDate(recordToRestore.inspectionDate) }} <br> 區域: {{
              recordToRestore.area }} <br> 種類: {{ recordToRestore.category }} / {{ recordToRestore.subCategory }} </div>
        </v-card-text> <v-card-actions> <v-spacer></v-spacer> <v-btn color="grey-darken-1" text
            @click="showRestoreDialog = false" :disabled="isRestoring">取消</v-btn> <v-btn color="success" variant="flat"
            @click="confirmRestoreRecord" :loading="isRestoring">確認還原</v-btn> </v-card-actions> </v-card> </v-dialog>

    <v-dialog v-model="isDownloading" persistent max-width="420px">
      <v-card color="primary">
        <v-card-text class="d-flex align-center pa-4">
          <v-progress-circular indeterminate color="white" class="mr-4"></v-progress-circular>
          <div>
            <div class="text-h6">{{ downloadingText }}</div>
            <div class="text-caption">請稍候，檔案準備中...</div>
          </div>
        </v-card-text>
      </v-card>
    </v-dialog>

    <v-bottom-navigation v-if="mobile && projectId" color="primary" elevation="8" class="mobile-bottom-nav" grow>
      <v-btn @click="showDeleted = false; handleModeChange(false)" :active="!showDeleted" value="records" class="pa-0">
        <v-icon size="small">mdi-file-document-outline</v-icon>
        <span class="mobile-btn-text">全案紀錄</span>
      </v-btn>

      <v-btn @click="showDeleted = true; handleModeChange(true)" :active="showDeleted" value="trash" class="pa-0">
        <v-icon size="small">mdi-delete-outline</v-icon>
        <span class="mobile-btn-text">刪除紀錄</span>
      </v-btn>

      <v-btn @click="viewMode = (viewMode === 'table' ? 'card' : 'table')" value="switchMode" class="pa-0">
        <v-icon size="small">{{ viewMode === 'table' ? 'mdi-view-dashboard-outline' : 'mdi-table' }}</v-icon>
        <span class="mobile-btn-text">切換顯示</span>
      </v-btn>
      <v-btn @click="handleMobileExport" value="export" class="pa-0" :disabled="!selectedUnit || showDeleted">
        <v-icon size="small">mdi-export-variant</v-icon>
        <span class="mobile-btn-text">寄出報告</span>
      </v-btn>

      <v-btn @click="showMobileDownloadDialog = true" value="download" class="pa-0"
        :disabled="filteredRecords.length === 0">
        <v-icon size="small">mdi-download</v-icon>
        <span class="mobile-btn-text">下載報告</span>
      </v-btn>
    </v-bottom-navigation>

    <!-- 手機版：寄出報告選單 -->
    <v-dialog v-model="showMobileExportDialog" max-width="320">
      <v-card>
        <v-card-title class="text-subtitle-1 font-weight-bold d-flex align-center">
          <v-icon start color="primary">mdi-export-variant</v-icon>
          寄出報告
        </v-card-title>
        <v-divider></v-divider>
        <v-list density="compact">
          <v-list-item @click="showMobileExportDialog = false; handleShareReport()">
            <template v-slot:prepend><v-icon color="blue">mdi-share-variant-outline</v-icon></template>
            <v-list-item-title>傳送記錄連結</v-list-item-title>
          </v-list-item>
          <v-list-item @click="showMobileExportDialog = false; handleGeneratePdf()">
            <template v-slot:prepend><v-icon color="red">mdi-file-pdf-box</v-icon></template>
            <v-list-item-title>預覽與寄出報告</v-list-item-title>
          </v-list-item>
        </v-list>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn variant="text" @click="showMobileExportDialog = false">取消</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- 手機版：下載報告選單 -->
    <v-dialog v-model="showMobileDownloadDialog" max-width="320">
      <v-card>
        <v-card-title class="text-subtitle-1 font-weight-bold d-flex align-center">
          <v-icon start color="primary">mdi-download</v-icon>
          下載報告
        </v-card-title>
        <v-divider></v-divider>
        <v-list density="compact">
          <v-list-item @click="showMobileDownloadDialog = false; handleDownloadExcel()">
            <template v-slot:prepend><v-icon color="green">mdi-file-excel-box</v-icon></template>
            <v-list-item-title>下載 Excel</v-list-item-title>
          </v-list-item>
          <v-list-item @click="showMobileDownloadDialog = false; handleDownloadPdf()">
            <template v-slot:prepend><v-icon color="red">mdi-file-pdf-box</v-icon></template>
            <v-list-item-title>下載 PDF</v-list-item-title>
          </v-list-item>
        </v-list>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn variant="text" @click="showMobileDownloadDialog = false">取消</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-tooltip location="top" :text="!(selectedUnit && selectedBuilding) ? '請先選擇棟別與戶別' : '新增驗屋紀錄'">
      <template v-slot:activator="{ props: tooltipProps }">
        <v-btn v-if="mobile && projectId" v-bind="tooltipProps" @click="handleMobileFabClick"
          :color="!(selectedUnit && selectedBuilding) || showDeleted ? 'grey' : 'primary'" rounded="circle"
          elevation="8" size="large" class="mobile-fab" icon>
          <v-icon size="large">mdi-plus</v-icon>
        </v-btn>
      </template>
    </v-tooltip>

    <!-- ===== Onboarding Tour ===== -->
    <v-dialog v-model="showOnboarding" max-width="520" persistent>
      <v-card class="onboarding-card rounded-xl overflow-hidden">
        <!-- 頂部漸層區域 -->
        <div class="onboarding-hero" :style="{ background: onboardingSteps[onboardingStep]?.gradient }">
          <v-btn icon="mdi-close" variant="text" size="small" class="onboarding-close-btn"
            @click="finishOnboarding"></v-btn>
          <div class="onboarding-icon-wrapper">
            <v-icon size="64" color="white" class="onboarding-icon">{{ onboardingSteps[onboardingStep]?.icon }}</v-icon>
          </div>
          <div class="text-h5 font-weight-bold text-white text-center mt-3 px-4">{{
            onboardingSteps[onboardingStep]?.title
          }}</div>
          <div class="text-body-2 text-white text-center mt-1 px-6" style="opacity: 0.85;">{{
            onboardingSteps[onboardingStep]?.subtitle }}</div>
        </div>

        <!-- 內容區域 -->
        <v-window v-model="onboardingStep">
          <v-window-item v-for="(step, index) in onboardingSteps" :key="index" :value="index">
            <v-card-text class="pa-5">
              <div class="d-flex align-start mb-3" v-for="(tip, tIdx) in step.tips" :key="tIdx">
                <v-avatar size="28" :color="step.chipColor" class="mr-3 mt-0 flex-shrink-0" variant="tonal">
                  <v-icon size="16">{{ tip.icon }}</v-icon>
                </v-avatar>
                <div>
                  <div class="text-body-1 font-weight-medium">{{ tip.text }}</div>
                </div>
              </div>
            </v-card-text>
          </v-window-item>
        </v-window>

        <!-- 底部操作區 -->
        <v-divider></v-divider>
        <v-card-actions class="pa-4">
          <!-- 步驟指示器 -->
          <div class="d-flex align-center ga-1">
            <div v-for="(s, i) in onboardingSteps" :key="i" class="onboarding-dot"
              :class="{ 'onboarding-dot--active': i === onboardingStep, 'onboarding-dot--done': i < onboardingStep }"
              @click="onboardingStep = i"></div>
          </div>
          <v-spacer></v-spacer>
          <v-btn v-if="onboardingStep > 0" variant="text" @click="onboardingStep--" class="mr-1">
            <v-icon start size="small">mdi-chevron-left</v-icon>
            上一步
          </v-btn>
          <v-btn v-if="onboardingStep < onboardingSteps.length - 1" color="primary" variant="elevated"
            @click="onboardingStep++" class="px-5">
            下一步
            <v-icon end size="small">mdi-chevron-right</v-icon>
          </v-btn>
          <v-btn v-else color="success" variant="elevated" @click="finishOnboarding" class="px-5">
            <v-icon start size="small">mdi-check</v-icon>
            開始使用
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- 提示 Snackbar -->
    <v-snackbar v-model="showHintSnackbar" :timeout="2500" color="warning" location="top">
      <v-icon start>mdi-alert-circle-outline</v-icon>
      {{ hintSnackbarText }}
    </v-snackbar>

    <div class="text-caption text-grey text-center mt-4 d-flex align-center justify-center">
      <span>Powered by&nbsp;</span>
      <v-chip class="ml-1" href="https://anxismart.com/" target="_blank" rel="noopener noreferrer" color="blue-grey"
        variant="tonal" size="small" pill>
        <v-icon start size="x-small">mdi-rocket-launch-outline</v-icon>
        anxismart安熙智慧建案管理系統
      </v-chip>
    </div>

  </v-container>
</template>

<script setup>
import { ref, onMounted, computed, reactive, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import liff from '@line/liff';
import VuePdfEmbed from 'vue-pdf-embed';
import { useUserStore } from '@/store/user';
import { useProjectStore } from '@/store/projectStore';
import {
  getProjectStructureFB,
  getInspectionRecordsFB,
  getInspectionOptionsForProjectFB,
  updateInspectionRecordFieldFB,
  deleteInspectionRecordFB,
  getDeletedInspectionRecordsFB,
  restoreInspectionRecordFB,
  getDeletedInspectionRecordsForProjectFB,
  getInspectionRecordsForProjectFB,
  generateShareableUrl,
  getConfirmedInspectionBatches,
  fetchInspectionPersonnelWithEmailsAPI,
  sendInspectionReportEmailsAPI,
  fetchProjectConfig
} from '@/api';
import { VDataTable } from 'vuetify/components/VDataTable';
import { useDisplay } from 'vuetify';
import InspectionRecordEditor from '@/components/InspectionRecordEditor.vue';
import ChipRenderer from '@/components/ChipRenderer.vue';
import { format, parseISO } from 'date-fns';
import { zhTW } from 'date-fns/locale';
import IconButton from '@/components/IconButton.vue';
import defaultProjectIcon from '@/assets/icons/property.png';
import QrcodeVue from 'qrcode.vue';
import { saveAs } from 'file-saver';

// 手機 WebView 安全下載（支援 LINE LIFF 等無法使用 saveAs 的環境）
function mobileSafeDownload(blob, fileName) {
  try {
    // 偵測是否在 LIFF / LINE WebView 中
    const ua = navigator.userAgent || '';
    const isLineOrWebView = /Line/i.test(ua) || /LIFF/i.test(ua) || /wv|WebView/i.test(ua);

    if (isLineOrWebView) {
      // WebView 中：用 window.open 在新分頁開啟 blob
      const blobUrl = URL.createObjectURL(blob);
      const newWindow = window.open(blobUrl, '_blank');
      if (!newWindow) {
        // popup 被阻擋，改用 location.href
        window.location.href = blobUrl;
      }
      // 延遲清除 URL（給瀏覽器時間下載）
      setTimeout(() => URL.revokeObjectURL(blobUrl), 10000);
    } else {
      // 一般瀏覽器：用 <a download> 觸發下載
      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = fileName;
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => URL.revokeObjectURL(blobUrl), 10000);
    }
  } catch (e) {
    console.warn('mobileSafeDownload 失敗，fallback 到 saveAs:', e);
    saveAs(blob, fileName);
  }
}

const route = useRoute();
const userStore = useUserStore();
const projectStore = useProjectStore();
const router = useRouter();
const { mobile } = useDisplay(); // ✓ 確保 useDisplay 和 mobile 已定義

const props = defineProps({ projectId: { type: String, default: null } });

const viewMode = ref(mobile.value ? 'card' : 'table');
const projectName = computed(() => projectStore.idToNameMap[props.projectId] || '建案');

// PDF 模板設定（從 Firestore 讀取，未設定時用預設值）
const DEFAULT_PDF_TEMPLATE = {
  cover: {
    title: '{建案名稱} 驗屋報告',
    showProjectInfo: true,
    infoFields: [
      { label: '戶別', variable: '{戶別}', enabled: true },
      { label: '客戶', variable: '{客戶姓名}', enabled: true },
      { label: '電話', variable: '{客戶電話}', enabled: true },
      { label: 'Email', variable: '{客戶EMAIL}', enabled: true },
      { label: '服務日期', variable: '{服務日期}', enabled: true },
    ],
    showDisclaimer: true,
    disclaimer: '☑️ 本人確認已詳閱本次驗屋紀錄，並同意於後續檢驗時，以本報告作為判斷依據。',
    signatureLabel: '客戶簽名：',
    showSignature: true,
    showDate: true,
    dateLabel: '報告產製日期：',
  },
  detail: {
    headerNote: '',
    footerNote: '',
    showInspectorName: true,
    showPhotos: true,
    maxPhotosPerRecord: 4,
  },
};
const pdfTemplate = ref(DEFAULT_PDF_TEMPLATE);
const isLoading = ref(true);
const loadingText = ref('正在初始化...');
const isBound = ref(false);
const isLoadingStructure = ref(false);
const isLoadingRecords = ref(false);
const projectStructure = ref({});
const selectedBuilding = ref(null);
const selectedUnit = ref(null);
const standbyUsers = ref([]);

// --- PDF 預覽與寄送相關狀態 ---
const showPdfPreviewDialog = ref(false);
const showInnerPdfPreview = ref(false);
const innerPreviewTitle = ref('報告線上預覽');
const pdfEmbedSource = ref(null);
const previewPdfUrl = ref(null);
const currentPdfBase64 = ref(null);
const currentPdfBlob = ref(null);
const showEmailListDialog = ref(false);
const isSendingEmail = ref(false);
const emailRecipients = ref([]);
const includeAttachments = ref(true);
const selectedAttachments = ref([]);
// ------------------------------
const allRecords = ref([]);
const searchFilter = ref('');
const showEditorDialog = ref(false);
const recordBeingEdited = ref(null);
const showPreviewDialog = ref(false);
const previewImageUrl = ref('');
const optionsForChips = reactive({ status: [], level: [], progress: [] });
const authorizedProjects = ref([]);
const updatingRecord = reactive({ id: null, field: null });
const showDeleteDialog = ref(false);
const recordToDelete = ref(null);
const isDeleting = ref(false);
const showDeleted = ref(false);
const showRestoreDialog = ref(false);
const recordToRestore = ref(null);
const isRestoring = ref(false);
const showShareDialog = ref(false);
const isGeneratingUrl = ref(false);
const shareUrl = ref('');
const shareError = ref('');
const copySuccess = ref(false);
const showGeneratePdfDialog = ref(false);
const isLoadingBatches = ref(false);
const batchError = ref('');
const confirmedBatches = ref([]); // 儲存從後端獲取的批次列表
const selectedBatchId = ref(null); // 儲存用戶選擇的批次 ID
const inspectorNameForPdf = ref(''); // 儲存報告上的產製人員名稱
const showProcessingDialog = ref(false); // 控制處理中提示 Dialog
const isDownloading = ref(false); // 控制下載報告進度 Dialog
const downloadingText = ref(''); // 下載進度文字

// --- Onboarding Tour 引導狀態 ---
const ONBOARDING_KEY = 'inspection_console_onboarding_done';
const showOnboarding = ref(false);
const onboardingStep = ref(0);

const onboardingSteps = [
  {
    icon: 'mdi-hand-wave',
    title: '歡迎使用驗屋系統！',
    subtitle: '讓我們快速了解各項功能',
    gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    chipColor: 'deep-purple',
    tips: [
      { icon: 'mdi-lightbulb-outline', text: '本系統協助您管理所有驗屋紀錄，從新增、編輯到產製報告，一站完成。' },
      { icon: 'mdi-clock-outline', text: '導覽僅需約 30 秒，您隨時可以從右上角的「?」按鈕重新觀看。' },
    ]
  },
  {
    icon: 'mdi-home-search-outline',
    title: '選擇棟別與戶別',
    subtitle: '定位到您要記錄的住戶',
    gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
    chipColor: 'pink',
    tips: [
      { icon: 'mdi-numeric-1-circle', text: '先從「選擇棟別」下拉選單選取建物棟號。' },
      { icon: 'mdi-numeric-2-circle', text: '再從「選擇戶別」精確定位到要紀錄的戶別。' },
      { icon: 'mdi-information-outline', text: '選擇戶別後，系統會自動載入該戶的全部驗屋紀錄。' },
    ]
  },
  {
    icon: 'mdi-magnify',
    title: '搜尋與篩選',
    subtitle: '快速找到您需要的紀錄',
    gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
    chipColor: 'cyan',
    tips: [
      { icon: 'mdi-text-search', text: '使用搜尋框可即時全文搜尋所有欄位內容。' },
      { icon: 'mdi-filter-outline', text: '點擊搜尋框旁的「篩選」按鈕可展開進階篩選（日期、階段、狀態、進度、等級等）。' },
      { icon: 'mdi-view-dashboard-outline', text: '可切換「表格模式」或「卡片模式」來瀏覽紀錄。' },
    ]
  },
  {
    icon: 'mdi-plus-circle-outline',
    title: '新增與管理紀錄',
    subtitle: '建立和編輯驗屋缺失',
    gradient: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
    chipColor: 'teal',
    tips: [
      { icon: 'mdi-plus', text: '選擇戶別後，點擊「新增」按鈕即可建立新的驗屋缺失紀錄。' },
      { icon: 'mdi-pencil', text: '每筆紀錄都可以直接修改狀態、等級、進度欄位（點擊 Chip 即可切換）。' },
      { icon: 'mdi-eye-outline', text: '「眼睛」圖示可控制該筆紀錄是否顯示在客戶報告中。' },
      { icon: 'mdi-delete-outline', text: '刪除的紀錄會移至「垃圾桶」，可隨時還原。' },
    ]
  },
  {
    icon: 'mdi-file-send-outline',
    title: '寄出與下載報告',
    subtitle: '將成果分享給客戶',
    gradient: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
    chipColor: 'orange',
    tips: [
      { icon: 'mdi-share-variant-outline', text: '「傳送記錄連結」可產生一組安全連結與 QR Code，供客戶線上確認缺失。' },
      { icon: 'mdi-file-pdf-box', text: '「預覽與寄出報告」可產製正式 PDF，並透過 Email 寄送給客戶。' },
      { icon: 'mdi-download', text: '「下載報告」支援 Excel 和 PDF 兩種格式匯出。' },
    ]
  },
];

function finishOnboarding() {
  showOnboarding.value = false;
  onboardingStep.value = 0;
  try {
    localStorage.setItem(ONBOARDING_KEY, 'true');
  } catch (e) {
    // localStorage 不可用時靜默失敗
  }
}

function checkOnboardingStatus() {
  try {
    const done = localStorage.getItem(ONBOARDING_KEY);
    if (!done) {
      showOnboarding.value = true;
    }
  } catch (e) {
    // localStorage 不可用時不顯示引導
  }
}

// --- 分頁與快取相關狀態 ---
// --- 日期工具函式 ---
function formatDateToISO(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}
function getDefaultDateFrom() {
  const d = new Date();
  d.setDate(d.getDate() - 7);
  return formatDateToISO(d);
}
function getDefaultDateTo() {
  return formatDateToISO(new Date());
}
function onDateFromChange(newVal) {
  if (!newVal) {
    // 開始日期被清除 → 同時清除結束日期
    advancedFilters.dateTo = null;
  } else if (advancedFilters.dateTo && advancedFilters.dateTo < newVal) {
    // 開始日期比結束日期晚 → 自動把結束日期設為開始日期
    advancedFilters.dateTo = newVal;
  }
}

const PAGE_SIZE = 50; // 每次載入筆數
const hasMore = ref(false); // 是否還有更多資料
const lastDocId = ref(null); // 游標分頁用的最後一筆文件 ID
const isLoadingMore = ref(false); // 是否正在載入更多（非首次載入）
const recordsCache = new Map(); // 快取：Map<cacheKey, { records, hasMore, lastDocId }>
const cardPageSize = ref(20); // Card View 每次顯示的筆數

// --- 進階篩選相關狀態 ---
const showAdvancedFilter = ref(false);
const advancedFilters = reactive({
  dateFrom: getDefaultDateFrom(),  // 開始日期：今天-7天
  dateTo: getDefaultDateTo(),      // 結束日期：今天
  phase: [],         // 階段 (多選)
  status: [],        // 狀態 (多選)
  progress: [],      // 進度 (多選)
  level: [],         // 等級 (多選)
  confirmed: null,   // 客戶確認 (單選: 'confirmed' | 'unconfirmed' | null)
});

// 篩選選項 — 從已載入的資料和 optionsForChips 動態產生
const phaseFilterItems = computed(() => {
  const phases = new Set(allRecords.value.map(r => r.phase).filter(Boolean));
  return [...phases].sort();
});
const statusFilterItems = computed(() => {
  // 優先使用 optionsForChips 的配置，若為空則從資料中提取
  if (optionsForChips.status.length > 0) {
    return optionsForChips.status.map(opt => opt.value || opt);
  }
  const statuses = new Set(allRecords.value.map(r => r.status).filter(Boolean));
  return [...statuses].sort();
});
const progressFilterItems = computed(() => {
  if (optionsForChips.progress.length > 0) {
    return optionsForChips.progress.map(opt => opt.value || opt);
  }
  const items = new Set(allRecords.value.map(r => r.progress).filter(Boolean));
  return [...items].sort();
});
const levelFilterItems = computed(() => {
  if (optionsForChips.level.length > 0) {
    return optionsForChips.level.map(opt => opt.value || opt);
  }
  const items = new Set(allRecords.value.map(r => r.level).filter(Boolean));
  return [...items].sort();
});
const confirmedFilterItems = [
  { title: '已確認', value: 'confirmed' },
  { title: '未確認', value: 'unconfirmed' },
];

// 活躍篩選條件計數
const activeFilterCount = computed(() => {
  let count = 0;
  if (advancedFilters.dateFrom) count++;
  if (advancedFilters.dateTo) count++;
  if (advancedFilters.phase.length > 0) count++;
  if (advancedFilters.status.length > 0) count++;
  if (advancedFilters.progress.length > 0) count++;
  if (advancedFilters.level.length > 0) count++;
  if (advancedFilters.confirmed) count++;
  return count;
});

// 清除所有進階篩選
function clearAllFilters() {
  const hadDateFilter = !!(advancedFilters.dateFrom || advancedFilters.dateTo);
  clearAllFiltersQuiet();
  // 如果之前有日期篩選且是全案模式，需要重新從後端載入（不帶日期條件）
  if (hadDateFilter && !selectedUnit.value) {
    loadData(false);
  }
}

// 靜默清空篩選（不觸發 loadData，用於棟別/戶別變更時）
function clearAllFiltersQuiet() {
  advancedFilters.dateFrom = null;
  advancedFilters.dateTo = null;
  advancedFilters.phase = [];
  advancedFilters.status = [];
  advancedFilters.progress = [];
  advancedFilters.level = [];
  advancedFilters.confirmed = null;
  showAdvancedFilter.value = false;
  searchFilter.value = '';
}

// 監聽日期變更 → 全案模式才從後端重新載入，戶別模式由前端 computed 自動處理
let dateFilterTimer = null;
watch(
  () => [advancedFilters.dateFrom, advancedFilters.dateTo],
  (newVal, oldVal) => {
    // 避免 clearAllFilters 觸發的重複載入
    if (!newVal[0] && !newVal[1] && !oldVal[0] && !oldVal[1]) return;

    // 戶別模式：已載入全部資料，日期篩選由前端 filteredRecords 處理，不需重載
    if (selectedUnit.value) {
      console.log(`[日期篩選變更] 戶別模式，前端篩選即可。`);
      return;
    }

    if (dateFilterTimer) clearTimeout(dateFilterTimer);
    dateFilterTimer = setTimeout(() => {
      console.log(`[日期篩選變更] ${newVal[0] || 'N/A'} ~ ${newVal[1] || 'N/A'}，重新從後端載入...`);
      loadData(false);
    }, 500);
  }
);

// 將各種日期格式統一轉為 'YYYY-MM-DD' 以便比較
function normalizeDate(dateInput) {
  if (!dateInput) return null;
  try {
    // Firestore Timestamp 物件
    if (typeof dateInput === 'object' && dateInput !== null && typeof dateInput.toDate === 'function') {
      const d = dateInput.toDate();
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    }
    // 字串處理
    if (typeof dateInput === 'string') {
      // ISO 格式 '2026-03-15T16:00:00.000Z' → 轉為本地日期
      if (dateInput.includes('T')) {
        const d = new Date(dateInput);
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      }
      // 'YYYY/MM/DD' → 'YYYY-MM-DD'
      if (dateInput.includes('/')) {
        return dateInput.replace(/\//g, '-');
      }
      // 已經是 'YYYY-MM-DD'
      if (/^\d{4}-\d{2}-\d{2}$/.test(dateInput)) {
        return dateInput;
      }
    }
    return null;
  } catch (e) {
    return null;
  }
}
const noDataText = computed(() => {
  if (isLoadingRecords.value) return '正在載入紀錄...';
  if (showDeleted.value) {
    return '此建案沒有已刪除的紀錄';
  } else {
    return selectedUnit.value ? '此戶別尚無驗屋紀錄' : '此建案尚無驗屋紀錄或請選取戶別';
  }
});


const buildingItems = computed(() => {
  const keys = Object.keys(projectStructure.value);
  keys.sort((a, b) => a.localeCompare(b, 'zh-Hant-TW', { numeric: true }));
  return keys;
});
const unitItems = computed(() => projectStructure.value[selectedBuilding.value] || []);

const filteredRecords = computed(() => {
  let records = allRecords.value;

  // 1. 進階篩選 — 日期範圍
  if (advancedFilters.dateFrom || advancedFilters.dateTo) {
    records = records.filter(r => {
      if (!r.inspectionDate) return false;
      const recDate = normalizeDate(r.inspectionDate);
      if (!recDate) return false;
      if (advancedFilters.dateFrom && recDate < advancedFilters.dateFrom) return false;
      if (advancedFilters.dateTo && recDate > advancedFilters.dateTo) return false;
      return true;
    });
  }

  // 2. 進階篩選 — 階段
  if (advancedFilters.phase.length > 0) {
    records = records.filter(r => advancedFilters.phase.includes(r.phase));
  }

  // 3. 進階篩選 — 狀態
  if (advancedFilters.status.length > 0) {
    records = records.filter(r => advancedFilters.status.includes(r.status));
  }

  // 4. 進階篩選 — 進度
  if (advancedFilters.progress.length > 0) {
    records = records.filter(r => advancedFilters.progress.includes(r.progress));
  }

  // 5. 進階篩選 — 等級
  if (advancedFilters.level.length > 0) {
    records = records.filter(r => advancedFilters.level.includes(r.level));
  }

  // 6. 進階篩選 — 客戶確認
  if (advancedFilters.confirmed === 'confirmed') {
    records = records.filter(r => !!r.customerConfirmedAt);
  } else if (advancedFilters.confirmed === 'unconfirmed') {
    records = records.filter(r => !r.customerConfirmedAt);
  }

  // 7. 文字搜尋 (原有邏輯)
  if (searchFilter.value) {
    const lowerSearch = searchFilter.value.toLowerCase();
    records = records.filter(record => {
      const searchableValues = [
        record.inspectionDate, record.phase, record.area, record.category,
        record.subCategory, record.status, record.level, record.progress,
        record.description, record.inspectorName, record.createdAt, record.deletedAt,
        record.unitId
      ];
      return searchableValues.some(val => val && String(val).toLowerCase().includes(lowerSearch));
    });
  }

  return records;
});

// Card View 的分頁顯示
const cardDisplayRecords = computed(() => {
  return filteredRecords.value.slice(0, cardPageSize.value);
});
const hasMoreCards = computed(() => {
  return cardPageSize.value < filteredRecords.value.length;
});
function showMoreCards() {
  cardPageSize.value += 20;
}

// 快取 key 產生器
function getCacheKey() {
  if (showDeleted.value) return `deleted_${props.projectId}`;
  // 戶別模式：載入全部，不含日期
  if (selectedUnit.value) return `unit_${props.projectId}_${selectedUnit.value}`;
  // 全案模式：包含日期範圍
  const datePart = (advancedFilters.dateFrom || '') + '_' + (advancedFilters.dateTo || '');
  return `project_${props.projectId}_${datePart}`;
}

const getBatchRecordsSummary = (batchId) => {
  if (!allRecords.value) return [];
  return allRecords.value
    .filter(r => r.confirmationBatchId === batchId && !r.isDeleted)
    .slice(0, 5); // 最多顯示 5 筆
};

const currentProject = computed(() => authorizedProjects.value.find(p => p.id === props.projectId));
const otherProjects = computed(() => authorizedProjects.value.filter(p => p.id !== props.projectId));

const headers = computed(() => {
  const baseHeaders = [
    { title: '日期', key: 'inspectionDate', sortable: true },
    { title: '階段', key: 'phase', sortable: true },
    { title: '照片', key: 'photos', sortable: false },
    { title: '區域', key: 'area', sortable: true },
    { title: '種類', key: 'category', sortable: true },
    { title: '細項', key: 'subCategory', sortable: true },
    { title: '狀態', key: 'status', sortable: true },
    { title: '等級', key: 'level', sortable: true },
    { title: '進度', key: 'progress', sortable: true },
    { title: '客戶確認', key: 'customerConfirmedAt', sortable: true },
    { title: '說明', key: 'description', sortable: false },
    { title: '人員', key: 'inspectorName', sortable: true },
    { title: '時間', key: 'createdAt', sortable: true },
    { title: '操作', key: 'actions', sortable: false },
  ];
  let finalHeaders = [...baseHeaders];

  if (!selectedUnit.value) {
    finalHeaders.splice(0, 0, { title: '戶別', key: 'unitId', sortable: true, width: '100px' });
  }

  if (showDeleted.value) {
    finalHeaders.splice(finalHeaders.length - 1, 0, { title: '刪除時間', key: 'deletedAt', sortable: true });
  }
  return finalHeaders;
});

// --- Methods ---
async function initProjectData() {
  loadingText.value = '正在載入建案權限...';
  await projectStore.fetchProjects();
  const allProjects = projectStore.projectsList;
  authorizedProjects.value = allProjects.filter(project => userStore.hasProjectPermission('驗屋系統', project.name));

  if (props.projectId) {
    loadingText.value = '正在載入建案資料...';
    if (!userStore.hasProjectPermission('驗屋系統', projectName.value)) {
      loadingText.value = '權限不足...';
      isBound.value = true;
      isLoading.value = false;
      alert('權限不足');
      return;
    }
    await loadProjectStructure();
    await loadOptionsForChips();
    await loadData();
    // 載入 PDF 模板設定
    try {
      const config = await fetchProjectConfig(props.projectId);
      if (config?.inspectionPdfTemplate) {
        pdfTemplate.value = config.inspectionPdfTemplate;
      }
    } catch (e) {
      console.warn('PDF 模板設定載入失敗，使用預設值', e);
    }
  } else {
    loadingText.value = '請選擇建案';
  }
}

onMounted(async () => {
  try {
    // 優先檢查是否在主系統已經登入 (Web App 的狀態)
    if (userStore.isLoggedIn && userStore.user?.key) {
      isBound.value = true;
      await initProjectData();
      return; // 結束，不走 LIFF 初始化
    }

    // 檢查 URL 中是否有 userKey 參數
    const userKey = route.query.userKey;
    if (userKey) {
      loadingText.value = '正在驗證使用者身份...';
      const success = await userStore.fetchUserByUserKey(userKey);

      if (success) {
        isBound.value = true;
        await initProjectData();
      } else {
        isBound.value = false;
      }
      return; // 結束，不走 LIFF 初始化
    }

    loadingText.value = '正在與 LINE 連接...';
    await liff.init({ liffId: '2008257338-QV34v0pb' }); //測試 2008257338-6N3jwqxA //正式 2008257338-QV34v0pb

    if (!liff.isLoggedIn()) {
      liff.login();
      return;
    }

    loadingText.value = '正在驗證使用者權限...';
    const profile = await liff.getProfile();
    const success = await userStore.fetchUserByLineId(profile.userId);

    if (success) {
      isBound.value = true;
      await initProjectData();
    } else {
      isBound.value = false;
    }
  } catch (error) {
    console.error('頁面初始化失敗:', error);
    loadingText.value = `初始化失敗: ${error.message}`;
  } finally {
    isLoading.value = false;
    viewMode.value = mobile.value ? 'card' : 'table';
    // 初次使用引導：頁面載入完成後檢查
    if (isBound.value && props.projectId) {
      checkOnboardingStatus();
    }
  }
});

async function loadProjectStructure() { if (!props.projectId) return; isLoadingStructure.value = true; const result = await getProjectStructureFB(props.projectId); if (result.status === 'success') projectStructure.value = result.data; else console.error("載入建案結構失敗:", result.message); isLoadingStructure.value = false; }

async function loadData(useCache = true) {
  if (!props.projectId) {
    console.warn('[loadData] projectId is not yet available. Aborting load.');
    allRecords.value = [];
    isLoadingRecords.value = false;
    return;
  }

  // 重置分頁狀態
  hasMore.value = false;
  lastDocId.value = null;
  cardPageSize.value = 20;

  // 檢查快取
  const cacheKey = getCacheKey();
  if (useCache && recordsCache.has(cacheKey)) {
    const cached = recordsCache.get(cacheKey);
    allRecords.value = cached.records;
    hasMore.value = cached.hasMore;
    lastDocId.value = cached.lastDocId;
    console.log(`[loadData] 使用快取載入 ${cached.records.length} 筆紀錄 (cacheKey: ${cacheKey})`);
    return;
  }

  isLoadingRecords.value = true;
  allRecords.value = [];
  let result;
  try {
    if (showDeleted.value) {
      // 已刪除紀錄 — 不分頁（通常量不大）
      console.log(`Loading DELETED records for Project: ${props.projectId}`);
      result = await getDeletedInspectionRecordsForProjectFB(props.projectId);
    } else {
      if (selectedUnit.value) {
        // 戶別模式：載入該戶別全部資料（不分頁、不傳日期，日期篩選由前端處理）
        console.log(`Loading ALL records for Unit: ${props.projectId}/${selectedUnit.value}`);
        result = await getInspectionRecordsFB(props.projectId, selectedUnit.value, { limit: 200 });
      } else {
        // 全案模式：傳日期參數給後端篩選 + 分頁
        const paginationOpts = { limit: PAGE_SIZE };
        if (advancedFilters.dateFrom) paginationOpts.dateFrom = advancedFilters.dateFrom;
        if (advancedFilters.dateTo) paginationOpts.dateTo = advancedFilters.dateTo;
        console.log(`Loading ACTIVE records for Project: ${props.projectId} (limit: ${PAGE_SIZE}, date: ${advancedFilters.dateFrom || 'N/A'} ~ ${advancedFilters.dateTo || 'N/A'})`);
        result = await getInspectionRecordsForProjectFB(props.projectId, paginationOpts);
      }
    }

    if (result.status === 'success') {
      allRecords.value = result.data;
      hasMore.value = result.hasMore || false;
      lastDocId.value = result.lastDocId || null;
      console.log(`Loaded ${allRecords.value.length} records. hasMore: ${hasMore.value}`);
      // 寫入快取
      recordsCache.set(cacheKey, {
        records: [...allRecords.value],
        hasMore: hasMore.value,
        lastDocId: lastDocId.value
      });
    } else {
      console.error("載入驗屋紀錄失敗:", result.message);
      allRecords.value = [];
      console.warn(`載入紀錄失敗 (API Status Error): ${result.message}`);
    }
  } catch (error) {
    console.error("呼叫 API 載入紀錄時發生錯誤:", error);
    allRecords.value = [];
    console.error(`載入紀錄時發生前端錯誤: ${error.message}`);
  } finally {
    isLoadingRecords.value = false;
  }
}

// 載入更多紀錄 (分頁載入下一頁)
async function loadMoreRecords() {
  if (!hasMore.value || isLoadingMore.value || !lastDocId.value) return;

  isLoadingMore.value = true;
  let result;
  try {
    const paginationOpts = {
      limit: PAGE_SIZE,
      startAfterDocId: lastDocId.value
    };
    if (advancedFilters.dateFrom) paginationOpts.dateFrom = advancedFilters.dateFrom;
    if (advancedFilters.dateTo) paginationOpts.dateTo = advancedFilters.dateTo;

    if (selectedUnit.value) {
      result = await getInspectionRecordsFB(props.projectId, selectedUnit.value, paginationOpts);
    } else {
      result = await getInspectionRecordsForProjectFB(props.projectId, paginationOpts);
    }

    if (result.status === 'success') {
      // 將新資料追加到現有資料後面
      allRecords.value = [...allRecords.value, ...result.data];
      hasMore.value = result.hasMore || false;
      lastDocId.value = result.lastDocId || null;
      console.log(`載入更多: +${result.data.length} 筆，總計 ${allRecords.value.length} 筆。hasMore: ${hasMore.value}`);
      // 更新快取
      const cacheKey = getCacheKey();
      recordsCache.set(cacheKey, {
        records: [...allRecords.value],
        hasMore: hasMore.value,
        lastDocId: lastDocId.value
      });
    } else {
      console.error('載入更多紀錄失敗:', result.message);
    }
  } catch (error) {
    console.error('載入更多紀錄時發生錯誤:', error);
  } finally {
    isLoadingMore.value = false;
  }
}

// 載入全部紀錄 (連續分頁直到全部載完，用於精確篩選)
const isLoadingAll = ref(false);

async function loadAllRecords() {
  if (!hasMore.value || isLoadingAll.value) return;

  isLoadingAll.value = true;
  let loadedCount = 0;
  try {
    while (hasMore.value && lastDocId.value) {
      let result;
      const paginationOpts = {
        limit: 200,
        startAfterDocId: lastDocId.value
      };
      if (advancedFilters.dateFrom) paginationOpts.dateFrom = advancedFilters.dateFrom;
      if (advancedFilters.dateTo) paginationOpts.dateTo = advancedFilters.dateTo;

      if (selectedUnit.value) {
        result = await getInspectionRecordsFB(props.projectId, selectedUnit.value, paginationOpts);
      } else {
        result = await getInspectionRecordsForProjectFB(props.projectId, paginationOpts);
      }

      if (result.status === 'success' && result.data.length > 0) {
        allRecords.value = [...allRecords.value, ...result.data];
        hasMore.value = result.hasMore || false;
        lastDocId.value = result.lastDocId || null;
        loadedCount += result.data.length;
        console.log(`載入全部: +${result.data.length} 筆，總計 ${allRecords.value.length} 筆。hasMore: ${hasMore.value}`);
      } else {
        hasMore.value = false;
        break;
      }
    }

    // 更新快取
    const cacheKey = getCacheKey();
    recordsCache.set(cacheKey, {
      records: [...allRecords.value],
      hasMore: false,
      lastDocId: null
    });
    console.log(`全部載入完成，共 ${allRecords.value.length} 筆紀錄。`);
  } catch (error) {
    console.error('載入全部紀錄時發生錯誤:', error);
  } finally {
    isLoadingAll.value = false;
  }
}
// --- 提示 Snackbar ---
const showHintSnackbar = ref(false);
const hintSnackbarText = ref('');

function showHint(text) {
  hintSnackbarText.value = text;
  showHintSnackbar.value = true;
}

function handleMobileFabClick() {
  if (showDeleted.value) {
    showHint('⚠️ 無法在刪除模式下新增紀錄');
    return;
  }
  if (!selectedBuilding.value) {
    showHint('📋 請先選擇「棟別」與「戶別」');
    return;
  }
  if (!selectedUnit.value) {
    showHint('📋 請先選擇「戶別」才能新增紀錄');
    return;
  }
  openAddDialog();
}

// --- 手機版選單 Dialog ---
const showMobileDownloadDialog = ref(false);
const showMobileExportDialog = ref(false);

function handleMobileExport() {
  if (!selectedUnit.value || showDeleted.value) return;
  showMobileExportDialog.value = true;
}

async function loadOptionsForChips() { if (!props.projectId) return; const result = await getInspectionOptionsForProjectFB(props.projectId); if (result.status === 'success') { optionsForChips.status = result.data.status || []; optionsForChips.level = result.data.level || []; optionsForChips.progress = result.data.progress || []; } else console.error("載入 Chip 選項失敗:", result.message); }
function enterProject(project) { if (project && project.id && project.id !== props.projectId) { router.push({ name: 'InspectionConsole', params: { projectId: project.id } }); selectedBuilding.value = null; selectedUnit.value = null; showDeleted.value = false; allRecords.value = []; loadData(); } }

async function handleFieldUpdate(item, field, newValue) {
  console.log('[handleFieldUpdate] Received:', { id: item.id, field, newValue }); // ✓ 新增日誌
  if (showDeleted.value) return; if (item[field] === newValue || (updatingRecord.id === item.id && updatingRecord.field === field)) return; updatingRecord.id = item.id; updatingRecord.field = field; const payload = { [field]: newValue, inspectorName: userStore.user?.name || '未知', inspectorPhone: userStore.user?.key || '未知' };
  const unitForUpdate = item.unitId;
  if (!unitForUpdate) { alert('錯誤：找不到戶別 ID，無法更新。'); updatingRecord.id = null; updatingRecord.field = null; return; }
  console.log('[handleFieldUpdate] Calling API with:', { projectId: props.projectId, unitId: unitForUpdate, recordId: item.id, payload });
  const result = await updateInspectionRecordFieldFB(props.projectId, unitForUpdate, item.id, payload); if (result.status === 'success') { const recordIndex = allRecords.value.findIndex(r => r.id === item.id); if (recordIndex !== -1) { allRecords.value[recordIndex] = { ...allRecords.value[recordIndex], ...payload }; } } else { alert(`更新失敗: ${result.message}`); } updatingRecord.id = null; updatingRecord.field = null;
}

async function handleShareReport() {
  if (!selectedUnit.value) {
    alert('請先選擇一個戶別。');
    return;
  }

  showShareDialog.value = true; // 先打開 Dialog 顯示載入中
  isGeneratingUrl.value = true;
  shareError.value = ''; // 清除舊錯誤
  shareUrl.value = ''; // 清除舊連結
  copySuccess.value = false; // 重置複製狀態

  try {
    const payload = {
      projectId: props.projectId,
      unitId: selectedUnit.value,
    };
    const result = await generateShareableUrl(payload);

    if (result.status === 'success' && result.shareUrl) {
      shareUrl.value = result.shareUrl;
    } else {
      throw new Error(result.message || '無法產生分享連結');
    }
  } catch (error) {
    console.error('產生分享連結失敗:', error);
    shareError.value = error.message;
  } finally {
    isGeneratingUrl.value = false;
  }
}

function closeShareDialog() {
  showShareDialog.value = false;
  // 延遲一點重置狀態，避免 Dialog 關閉動畫時內容閃爍
  setTimeout(() => {
    isGeneratingUrl.value = false;
    shareError.value = '';
    shareUrl.value = '';
    copySuccess.value = false;
  }, 300);
}

async function copyShareUrl() {
  if (!shareUrl.value) return;
  try {
    await navigator.clipboard.writeText(shareUrl.value);
    copySuccess.value = true;
    setTimeout(() => { copySuccess.value = false; }, 2000); // 2秒後自動消失提示
  } catch (err) {
    console.error('複製失敗:', err);
    alert('複製連結失敗，請手動複製。');
  }
}

async function handleGeneratePdf() {
  console.log('Generate PDF Clicked');
  // 重置狀態
  isLoadingBatches.value = true;
  batchError.value = '';
  confirmedBatches.value = [];
  selectedBatchId.value = null;
  // 預設填入當前登入者名稱
  inspectorNameForPdf.value = userStore.user?.name || '';

  // 提前準備好分享連結，供沒有批次時的引導畫面使用
  try {
    const payload = {
      projectId: props.projectId,
      unitId: selectedUnit.value,
    };
    const result = await generateShareableUrl(payload);
    if (result.status === 'success' && result.shareUrl) {
      shareUrl.value = result.shareUrl;
    }
  } catch (err) {
    console.error("無法產生分享連結:", err);
  }

  // 開啟 Dialog
  showGeneratePdfDialog.value = true;
  // 載入已確認的批次
  await loadConfirmedBatches();
}
// ✅ END: 修改 handleGeneratePdf 函式

// ✅ START: 新增載入已確認批次的函式
async function loadConfirmedBatches() {
  isLoadingBatches.value = true;
  batchError.value = '';
  try {
    const payload = {
      projectId: props.projectId,
      unitId: selectedUnit.value,
    };
    const result = await getConfirmedInspectionBatches(payload);
    if (result.status === 'success') {
      confirmedBatches.value = result.data;
    } else {
      throw new Error(result.message || '查詢已確認批次失敗');
    }
  } catch (error) {
    console.error('查詢已確認批次失敗:', error);
    batchError.value = error.message;
  } finally {
    isLoadingBatches.value = false;
  }
}
// ✅ END: 新增載入已確認批次的函式

// ✅ START: 新增關閉處理中提示的函式
function closeProcessingDialog() {
  showProcessingDialog.value = false;
}



function openAddDialog() { recordBeingEdited.value = null; showEditorDialog.value = true; }
function openEditDialog(record) { recordBeingEdited.value = record; showEditorDialog.value = true; }
function handleRecordSaved() {
  showEditorDialog.value = false;
  // 新增/編輯後清除相關快取，強制重新載入
  const cacheKey = getCacheKey();
  recordsCache.delete(cacheKey);
  loadData(false); // 不使用快取
}
function showImagePreview(url) { previewImageUrl.value = url; showPreviewDialog.value = true; }
function formatDate(dateString) { if (!dateString) return ''; try { return format(parseISO(dateString), 'yyyy/MM/dd', { locale: zhTW }); } catch (e) { return dateString; } }
function formatDateTime(dateString) { if (!dateString) return ''; try { return format(parseISO(dateString), 'yyyy/MM/dd HH:mm', { locale: zhTW }); } catch (e) { return dateString; } }
function openDeleteDialog(item) { recordToDelete.value = item; showDeleteDialog.value = true; }
async function confirmDeleteRecord() {
  if (!recordToDelete.value?.id) return; isDeleting.value = true; try {
    const result = await deleteInspectionRecordFB(recordToDelete.value.id); if (result.status === 'success') {
      allRecords.value = allRecords.value.filter(record => record.id !== recordToDelete.value.id); showDeleteDialog.value = false; // 清除相關快取 (刪除後資料會移到刪除區)
      recordsCache.delete(getCacheKey()); recordsCache.delete(`deleted_${props.projectId}`); // 同時更新當前快取
      const cacheKey = getCacheKey(); recordsCache.set(cacheKey, { records: [...allRecords.value], hasMore: hasMore.value, lastDocId: lastDocId.value }); alert('紀錄已移至資源回收桶。');
    } else throw new Error(result.message || '刪除失敗');
  } catch (error) { console.error("刪除紀錄時發生錯誤:", error); alert(`刪除失敗: ${error.message}`); } finally { isDeleting.value = false; recordToDelete.value = null; }
}
function openRestoreDialog(item) { recordToRestore.value = item; showRestoreDialog.value = true; }
async function confirmRestoreRecord() {
  if (!recordToRestore.value?.id) return; isRestoring.value = true; try {
    const result = await restoreInspectionRecordFB(recordToRestore.value.id); if (result.status === 'success') {
      allRecords.value = allRecords.value.filter(record => record.id !== recordToRestore.value.id); showRestoreDialog.value = false; // 清除相關快取 (還原後資料會移回正常區)
      recordsCache.delete(`deleted_${props.projectId}`); recordsCache.delete(`project_${props.projectId}`); if (recordToRestore.value?.unitId) recordsCache.delete(`unit_${props.projectId}_${recordToRestore.value.unitId}`); alert('紀錄已成功還原。');
    } else throw new Error(result.message || '還原失敗');
  } catch (error) { console.error("還原紀錄時發生錯誤:", error); alert(`還原失敗: ${error.message}`); } finally { isRestoring.value = false; recordToRestore.value = null; }
}

function handleModeChange(newModeValue) {
  selectedBuilding.value = null;
  selectedUnit.value = null;
  loadData();
}

// === 下載報告功能 ===
async function loadImageAsBase64(url) {
  try {
    const response = await fetch(url, { mode: 'cors' });
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (e) {
    console.warn('圖片載入失敗:', url, e);
    return null;
  }
}

const DOWNLOAD_EXCEL_LIMIT = 500; // Excel 下載上限
const DOWNLOAD_PDF_LIMIT = 100;   // PDF 下載上限（圖片載入較慢）

async function handleDownloadExcel() {
  if (filteredRecords.value.length === 0) {
    alert('目前沒有可下載的資料。');
    return;
  }

  let recordsToExport = filteredRecords.value;

  if (recordsToExport.length > DOWNLOAD_EXCEL_LIMIT) {
    const userChoice = confirm(
      `目前共有 ${recordsToExport.length} 筆紀錄，下載全部可能需要較長時間。\n\n` +
      `• 按「確定」→ 僅下載前 ${DOWNLOAD_EXCEL_LIMIT} 筆\n` +
      `• 按「取消」→ 放棄下載\n\n` +
      `💡 建議使用「進階篩選」縮小範圍後再下載。`
    );
    if (!userChoice) return;
    recordsToExport = recordsToExport.slice(0, DOWNLOAD_EXCEL_LIMIT);
  }

  isDownloading.value = true;
  downloadingText.value = `正在準備 Excel 報告 (${recordsToExport.length} 筆)...`;
  try {
    const ExcelJS = await import('exceljs');
    const { saveAs } = await import('file-saver');
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('驗屋報告');

    // 中文標頭定義
    worksheet.columns = [
      { header: '建案', key: 'projectName', width: 14 },
      { header: '戶別', key: 'unitId', width: 12 },
      { header: '日期', key: 'date', width: 14 },
      { header: '階段', key: 'phase', width: 10 },
      { header: '區域', key: 'area', width: 12 },
      { header: '種類', key: 'category', width: 12 },
      { header: '細項', key: 'subCategory', width: 15 },
      { header: '狀態', key: 'status', width: 10 },
      { header: '等級', key: 'level', width: 10 },
      { header: '進度', key: 'progress', width: 10 },
      { header: '客戶確認', key: 'confirmed', width: 14 },
      { header: '說明', key: 'description', width: 35 },
      { header: '人員', key: 'inspector', width: 10 },
      { header: '時間', key: 'createdAt', width: 18 },
      { header: '照片 1', key: 'photo1', width: 23 },
      { header: '照片 2', key: 'photo2', width: 23 },
      { header: '照片 3', key: 'photo3', width: 23 },
      { header: '照片 4', key: 'photo4', width: 23 },
    ];

    // 標頭樣式
    const headerRow = worksheet.getRow(1);
    headerRow.height = 25;
    headerRow.eachCell((cell) => {
      cell.font = { bold: true, size: 11, color: { argb: 'FF333333' } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE8E8E8' } };
      cell.alignment = { vertical: 'middle', horizontal: 'center' };
      cell.border = {
        top: { style: 'thin', color: { argb: 'FFCCCCCC' } },
        bottom: { style: 'thin', color: { argb: 'FFCCCCCC' } },
        left: { style: 'thin', color: { argb: 'FFCCCCCC' } },
        right: { style: 'thin', color: { argb: 'FFCCCCCC' } },
      };
    });

    const records = recordsToExport;
    for (let i = 0; i < records.length; i++) {
      downloadingText.value = `正在處理資料 (${i + 1}/${records.length})...`;
      const item = records[i];
      const row = worksheet.addRow({
        projectName: projectName.value || '',
        unitId: item.unitId || '',
        date: formatDate(item.inspectionDate),
        phase: item.phase || '',
        area: item.area || '',
        category: item.category || '',
        subCategory: item.subCategory || '',
        status: item.status || '',
        level: item.level || '',
        progress: item.progress || '',
        confirmed: item.customerConfirmedAt ? formatDate(item.customerConfirmedAt) : '未確認',
        description: item.description || '',
        inspector: item.inspectorName || '',
        createdAt: formatDateTime(item.createdAt),
        photo1: '',
        photo2: '',
        photo3: '',
        photo4: '',
      });
      // 設定資料列高度為 120
      row.height = 120;
      row.alignment = { vertical: 'middle', wrapText: true };
      row.eachCell((cell) => {
        cell.border = {
          top: { style: 'thin', color: { argb: 'FFDDDDDD' } },
          bottom: { style: 'thin', color: { argb: 'FFDDDDDD' } },
          left: { style: 'thin', color: { argb: 'FFDDDDDD' } },
          right: { style: 'thin', color: { argb: 'FFDDDDDD' } },
        };
      });

      // 嵌入圖片
      if (item.photos && item.photos.length > 0) {
        const maxPhotos = Math.min(item.photos.length, 4);
        const imgW = 120;
        const imgH = 80;


        for (let j = 0; j < maxPhotos; j++) {
          try {
            downloadingText.value = `正在載入圖片 (${i + 1}/${records.length}) - 圖 ${j + 1}/${maxPhotos}...`;
            const dataUrl = await loadImageAsBase64(item.photos[j].url);
            if (dataUrl) {
              const base64Raw = dataUrl.split(',')[1];
              const ext = dataUrl.includes('image/png') ? 'png' : 'jpeg';
              const imageId = workbook.addImage({ base64: base64Raw, extension: ext });

              // 14 為第 15 欄（照片 1 的起始欄位，0-based offset）
              worksheet.addImage(imageId, {
                tl: { col: 14 + j + 0.1, row: i + 1 + 0.1 }, // 微調邊框
                ext: { width: imgW, height: imgH },
              });
            }
          } catch (e) {
            console.warn('圖片嵌入失敗:', e);
          }
        }
      }
    }

    downloadingText.value = '正在產生檔案...';
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const dateStr = format(new Date(), 'yyyyMMdd');
    const fileName = `驗屋報告_${projectName.value}_${selectedUnit.value || '全案'}_${dateStr}.xlsx`;
    mobileSafeDownload(blob, fileName);
  } catch (error) {
    console.error('下載 Excel 失敗:', error);
    alert(`下載 Excel 失敗: ${error.message}`);
  } finally {
    isDownloading.value = false;
  }
}

async function handleDownloadPdf() {
  if (filteredRecords.value.length === 0) {
    alert('目前沒有可下載的資料。');
    return;
  }

  let recordsToExport = filteredRecords.value;

  if (recordsToExport.length > DOWNLOAD_PDF_LIMIT) {
    const userChoice = confirm(
      `目前共有 ${recordsToExport.length} 筆紀錄，PDF 報告需要載入大量圖片，可能需要很長時間。\n\n` +
      `• 按「確定」→ 僅下載前 ${DOWNLOAD_PDF_LIMIT} 筆\n` +
      `• 按「取消」→ 放棄下載\n\n` +
      `💡 建議使用「進階篩選」縮小範圍後再下載。`
    );
    if (!userChoice) return;
    recordsToExport = recordsToExport.slice(0, DOWNLOAD_PDF_LIMIT);
  }

  isDownloading.value = true;
  downloadingText.value = `正在準備 PDF 報告 (${recordsToExport.length} 筆)...`;
  try {
    const { jsPDF } = await import('jspdf');
    const html2canvasModule = await import('html2canvas');
    const html2canvas = html2canvasModule.default || html2canvasModule;

    const doc = new jsPDF('p', 'mm', 'a4');
    const pageW = 210;
    const pageH = 297;
    const margin = 8;
    const usableW = pageW - 2 * margin; // 194mm
    const halfH = pageH / 2; // 148.5mm
    const cardH = halfH - margin - 2; // 每段可用高度
    const renderPxW = 760;
    const renderPxH = 540;
    const records = recordsToExport;

    // 預載所有圖片
    downloadingText.value = '正在載入圖片...';
    const imageCache = {};
    let imgCount = 0;
    const totalImgs = records.reduce((s, r) => s + (r.photos?.length || 0), 0);
    for (const record of records) {
      if (record.photos && record.photos.length > 0) {
        for (const photo of record.photos) {
          if (!imageCache[photo.url]) {
            imgCount++;
            downloadingText.value = `正在載入圖片 (${imgCount}/${totalImgs})...`;
            imageCache[photo.url] = await loadImageAsBase64(photo.url);
          }
        }
      }
    }

    for (let i = 0; i < records.length; i++) {
      downloadingText.value = `正在產生 PDF (${i + 1}/${records.length})...`;
      const record = records[i];
      const isTop = (i % 2 === 0);
      if (i > 0 && isTop) doc.addPage();

      // 建立卡片 HTML 元素
      const cardDiv = document.createElement('div');
      cardDiv.style.cssText = `position:fixed;left:-9999px;top:0;width:${renderPxW}px;height:${renderPxH}px;font-family:'Microsoft JhengHei','PingFang TC','Noto Sans TC',sans-serif;background:#fff;padding:14px;box-sizing:border-box;display:flex;flex-direction:column;`;

      // 標頭區 4x3 格線 (為了加入建案和人員，改為4列)
      const fields = [
        ['建案', projectName.value || ''], ['戶別', record.unitId || ''], ['日期', formatDate(record.inspectionDate)],
        ['階段', record.phase || ''], ['區域', record.area || ''], ['人員', record.inspectorName || ''],
        ['種類', record.category || ''], ['細項', record.subCategory || ''], ['狀態', record.status || ''],
        ['等級', record.level || ''], ['進度', record.progress || ''], [''], // 最後一格空白補齊
      ];
      let tblHtml = '<table style="width:100%;border-collapse:collapse;margin-bottom:6px;">';
      for (let r = 0; r < 4; r++) {
        tblHtml += '<tr>';
        for (let c = 0; c < 3; c++) {
          const [label, val] = fields[r * 3 + c];
          if (label) {
            tblHtml += `<td style="padding:4px 8px;border:1px solid #ddd;font-size:12px;width:33.33%"><span style="color:#888;font-weight:bold">${label}:</span> <span style="color:#222">${val}</span></td>`;
          } else {
            tblHtml += `<td style="padding:4px 8px;border:1px solid #ddd;font-size:12px;width:33.33%"></td>`;
          }
        }
        tblHtml += '</tr>';
      }
      tblHtml += '</table>';

      // 說明區
      const desc = record.description || '(無)';
      const descHtml = `<div style="border:1px solid #ddd;padding:6px 8px;margin-bottom:6px;font-size:12px;max-height:70px;overflow:hidden;line-height:1.5;"><span style="color:#888;font-weight:bold">說明:</span> <span style="color:#333">${desc}</span></div>`;

      // 圖片區
      let photosHtml = '';
      if (record.photos && record.photos.length > 0) {
        const photos = record.photos;
        const cnt = photos.length;
        photosHtml = '<div style="flex:1;display:flex;gap:6px;align-items:flex-start;overflow:hidden;min-height:0;">';
        if (cnt === 1) {
          const src = imageCache[photos[0].url];
          if (src) photosHtml += `<img src="${src}" style="max-width:100%;max-height:100%;object-fit:contain;" />`;
        } else {
          const maxShow = Math.min(cnt, 4);
          const maxW = Math.floor((renderPxW - 28 - (maxShow - 1) * 6) / maxShow);
          for (let j = 0; j < maxShow; j++) {
            const src = imageCache[photos[j].url];
            if (src) photosHtml += `<img src="${src}" style="max-width:${maxW}px;max-height:100%;object-fit:contain;" />`;
          }
        }
        photosHtml += '</div>';
      }

      cardDiv.innerHTML = tblHtml + descHtml + photosHtml;
      document.body.appendChild(cardDiv);

      // 等待圖片在 DOM 中載入完成
      await new Promise(resolve => setTimeout(resolve, 100));

      const canvas = await html2canvas(cardDiv, {
        width: renderPxW,
        height: renderPxH,
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
      });
      document.body.removeChild(cardDiv);

      const imgData = canvas.toDataURL('image/jpeg', 0.92);
      const yPos = isTop ? margin : halfH + 1;
      doc.addImage(imgData, 'JPEG', margin, yPos, usableW, cardH);

      // 繪製分隔線（在頁面中間）
      if (isTop && i + 1 < records.length) {
        doc.setDrawColor(200, 200, 200);
        doc.setLineWidth(0.3);
        doc.line(margin, halfH, pageW - margin, halfH);
      }
    }

    const dateStr = format(new Date(), 'yyyyMMdd');
    const pdfBlob = doc.output('blob');
    mobileSafeDownload(pdfBlob, `驗屋報告_${projectName.value}_${selectedUnit.value || '全案'}_${dateStr}.pdf`);
  } catch (error) {
    console.error('下載 PDF 失敗:', error);
    alert(`下載 PDF 失敗: ${error.message}`);
  } finally {
    isDownloading.value = false;
  }
}

async function handleDownloadBatchPdf() {
  if (!selectedBatchId.value) {
    alert('請先選擇要下載的批次。');
    return;
  }

  // 從所有的 records 裡面撈出符合此批次的資料
  const batchRecords = filteredRecords.value.filter(r => r.confirmationBatchId === selectedBatchId.value && !r.isDeleted);

  if (batchRecords.length === 0) {
    alert('此批次沒有可下載的資料。');
    return;
  }

  // 關閉對話框
  showGeneratePdfDialog.value = false;

  isDownloading.value = true;
  downloadingText.value = '正在準備批次 PDF 報告...';
  try {
    const { jsPDF } = await import('jspdf');
    const html2canvasModule = await import('html2canvas');
    const html2canvas = html2canvasModule.default || html2canvasModule;

    const doc = new jsPDF('p', 'mm', 'a4');
    const pageW = 210;
    const pageH = 297;
    const margin = 8;
    const usableW = pageW - 2 * margin; // 194mm
    const halfH = pageH / 2; // 148.5mm
    const cardH = halfH - margin - 2; // 每段可用高度
    const renderPxW = 760;
    const renderPxH = 540;

    // 預載所有圖片
    downloadingText.value = '正在載入圖片...';
    const imageCache = {};
    let imgCount = 0;
    const totalImgs = batchRecords.reduce((s, r) => s + (r.photos?.length || 0), 0);
    for (const record of batchRecords) {
      if (record.photos && record.photos.length > 0) {
        for (const photo of record.photos) {
          if (!imageCache[photo.url]) {
            imgCount++;
            downloadingText.value = `正在載入圖片 (${imgCount}/${totalImgs})...`;
            imageCache[photo.url] = await loadImageAsBase64(photo.url);
          }
        }
      }
    }

    const batchInfo = confirmedBatches.value.find(b => b.batchId === selectedBatchId.value) || {};
    const buyerName = batchInfo.buyerInfo?.name || '(未填寫)';
    const buyerPhone = batchInfo.buyerInfo?.phone || '(未填寫)';
    const buyerEmail = batchInfo.buyerInfo?.email || '(未填寫)';
    const inspectionDateStr = batchInfo.dateString || formatDate(new Date());
    const signatureUrl = batchInfo.signatureUrl || '';

    let signatureBase64 = '';
    if (signatureUrl) {
      downloadingText.value = `正在載入簽名檔...`;
      try {
        signatureBase64 = await loadImageAsBase64(signatureUrl);
      } catch (e) {
        console.error('簽章圖片載入失敗', e);
      }
    }

    // 產生封面
    downloadingText.value = `正在產生封面 PDF...`;
    const coverDiv = document.createElement('div');
    coverDiv.style.cssText = `position:fixed;left:-9999px;top:0;width:${renderPxW}px;height:${renderPxH * 2}px;font-family:'Microsoft JhengHei','PingFang TC','Noto Sans TC',sans-serif;background:#fff;padding:40px;box-sizing:border-box;display:flex;flex-direction:column;`;

    const nowStr = format(new Date(), 'yyyy-MM-dd HH:mm');

    // 取得合併後的模板設定
    const tpl = {
      ...DEFAULT_PDF_TEMPLATE.cover,
      ...(pdfTemplate.value?.cover || {}),
      infoFields: (pdfTemplate.value?.cover?.infoFields?.length > 0)
        ? pdfTemplate.value.cover.infoFields
        : DEFAULT_PDF_TEMPLATE.cover.infoFields,
    };
    const detailTpl = {
      ...DEFAULT_PDF_TEMPLATE.detail,
      ...(pdfTemplate.value?.detail || {}),
    };

    // 變數替換資料
    const tplVars = {
      '{建案名稱}': projectName.value,
      '{戶別}': selectedUnit.value || '全案',
      '{產權人姓名}': buyerName,
      '{產權人電話}': buyerPhone,
      '{產權人EMAIL}': buyerEmail,
      '{驗屋日期}': inspectionDateStr,
      '{服務日期}': inspectionDateStr, // 向下相容
    };
    const replaceTplVars = (text) => {
      if (!text) return '';
      let result = text;
      for (const [key, val] of Object.entries(tplVars)) {
        result = result.replaceAll(key, val);
      }
      return result;
    };

    // 產生封面資訊欄位 HTML
    const enabledFields = (tpl.infoFields || []).filter(f => f.enabled);
    let fieldsHtml = '';
    for (const field of enabledFields) {
      const value = replaceTplVars(field.variable);
      fieldsHtml += `
        <div style="display:flex; border-bottom: 1px solid #eee; padding: 10px 0;">
          <div style="width: 150px; color: #666; font-weight: bold;">${field.label}</div>
          <div>${value}</div>
        </div>
      `;
    }

    // 聲明文字
    const disclaimerHtml = (tpl.showDisclaimer !== false) ? `
      <div style="margin-top: 40px; padding: 20px; background-color: #f9f9f9; border-radius: 8px;">
        ${replaceTplVars(tpl.disclaimer)}
      </div>
    ` : '';

    // 簽名區
    const signatureHtml = (tpl.showSignature !== false) ? `
      <div style="margin-top: 40px; display: flex; align-items: flex-end;">
        <div style="font-weight: bold; margin-right: 20px;">${replaceTplVars(tpl.signatureLabel)}</div>
        ${signatureBase64 ? `<img src="${signatureBase64}" style="max-height: 100px; max-width: 300px; border-bottom: 1px solid #333;" />` : '<div style="width: 300px; border-bottom: 1px solid #333;"></div>'}
      </div>
    ` : '';

    // 日期
    const dateHtml = (tpl.showDate !== false) ? `
      <div style="text-align: right; color: #999; font-size: 12px; margin-top: auto;">
        ${replaceTplVars(tpl.dateLabel)} ${nowStr} (台灣時間)
      </div>
    ` : '';

    coverDiv.innerHTML = `
      <div style="text-align:center; margin-bottom: 40px;">
        <h1 style="font-size: 32px; color: #333;">${replaceTplVars(tpl.title)}</h1>
      </div>
      <div style="flex:1; font-size: 18px; line-height: 2;">
        ${fieldsHtml}
        ${disclaimerHtml}
        ${signatureHtml}
      </div>
      ${dateHtml}
    `;

    document.body.appendChild(coverDiv);
    await new Promise(resolve => setTimeout(resolve, 200));

    const coverCanvas = await html2canvas(coverDiv, {
      width: renderPxW,
      height: renderPxH * 2,
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
    });
    document.body.removeChild(coverDiv);

    // 將封面畫在第一頁 (A4 滿版，扣除一點 margin 或是直接畫滿)
    const coverImgData = coverCanvas.toDataURL('image/jpeg', 0.95);
    // 放入封面，高度依照 A4 比例畫，或者直接把整個圖放進去
    doc.addImage(coverImgData, 'JPEG', margin, margin, usableW, pageH - 2 * margin);

    // --- 產生驗屋紀錄總表 ---
    downloadingText.value = `正在產生總表...`;
    const tableChunkSize = 12; // 每頁總表最多顯示 12 筆
    const tableChunks = [];
    for (let i = 0; i < batchRecords.length; i += tableChunkSize) {
      tableChunks.push(batchRecords.slice(i, i + tableChunkSize));
    }

    const tablePhaseStr = batchRecords.length > 0 ? (batchRecords[0].phase || '初驗') : '初驗';

    for (let cIndex = 0; cIndex < tableChunks.length; cIndex++) {
      downloadingText.value = `正在產生總表 PDF (${cIndex + 1}/${tableChunks.length})...`;
      doc.addPage();

      const chunk = tableChunks[cIndex];
      const tableDiv = document.createElement('div');
      tableDiv.style.cssText = `position:fixed;left:-9999px;top:0;width:${renderPxW}px;height:${renderPxH * 2}px;font-family:'Microsoft JhengHei','PingFang TC','Noto Sans TC',sans-serif;background:#fff;padding:40px;box-sizing:border-box;display:flex;flex-direction:column;`;

      let tableRowsHtml = '';
      chunk.forEach(record => {
        tableRowsHtml += `
          <tr>
            <td style="border: 1px solid #ddd; padding: 8px;">${record.area || ''}</td>
            <td style="border: 1px solid #ddd; padding: 8px;">${record.category || ''}</td>
            <td style="border: 1px solid #ddd; padding: 8px;">${record.subCategory || ''}</td>
            <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">${record.status || ''}</td>
            <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">${record.level || ''}</td>
            <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">${record.progress || ''}</td>
            <td style="border: 1px solid #ddd; padding: 8px; word-break: break-all; white-space: pre-wrap;">${record.description || ''}</td>
          </tr>
        `;
      });

      tableDiv.innerHTML = `
        <h2 style="text-align: center; margin-bottom: 20px; font-size: 26px; color: #333;">驗屋紀錄總表</h2>
        <div style="margin-bottom: 16px; font-size: 16px; font-weight: bold; color: #555; display: flex; gap: 24px;">
          <span>建案: ${projectName.value}</span>
          <span>戶別: ${selectedUnit.value || '全案'}</span>
          <span>階段: ${tablePhaseStr}</span>
        </div>
        <table style="width: 100%; border-collapse: collapse; font-size: 14px; table-layout: fixed;">
          <thead>
            <tr style="background-color: #f5f5f5;">
              <th style="border: 1px solid #ddd; padding: 10px 8px; width: 12%;">區域</th>
              <th style="border: 1px solid #ddd; padding: 10px 8px; width: 12%;">種類</th>
              <th style="border: 1px solid #ddd; padding: 10px 8px; width: 14%;">細項</th>
              <th style="border: 1px solid #ddd; padding: 10px 8px; width: 8%;">狀態</th>
              <th style="border: 1px solid #ddd; padding: 10px 8px; width: 8%;">等級</th>
              <th style="border: 1px solid #ddd; padding: 10px 8px; width: 8%;">進度</th>
              <th style="border: 1px solid #ddd; padding: 10px 8px; width: 38%;">說明</th>
            </tr>
          </thead>
          <tbody>
            ${tableRowsHtml}
          </tbody>
        </table>
        <div style="text-align: right; color: #999; font-size: 12px; margin-top: auto;">
          總表 - 第 ${cIndex + 1} 頁 / 共 ${tableChunks.length} 頁
        </div>
      `;

      document.body.appendChild(tableDiv);
      await new Promise(resolve => setTimeout(resolve, 200));

      const tableCanvas = await html2canvas(tableDiv, {
        width: renderPxW,
        height: renderPxH * 2,
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
      });
      document.body.removeChild(tableDiv);

      const tableImgData = tableCanvas.toDataURL('image/jpeg', 0.95);
      doc.addImage(tableImgData, 'JPEG', margin, margin, usableW, pageH - 2 * margin);
    }
    // --- 總表產生結束 ---


    for (let i = 0; i < batchRecords.length; i++) {
      downloadingText.value = `正在產生 PDF (${i + 1}/${batchRecords.length})...`;
      const record = batchRecords[i];
      const isTop = (i % 2 === 0);
      // 當 i 是偶數時（代表一張新頁面的上半部），就建立一頁新頁面
      if (isTop) doc.addPage();

      // 建立卡片 HTML 元素
      const cardDiv = document.createElement('div');
      cardDiv.style.cssText = `position:fixed;left:-9999px;top:0;width:${renderPxW}px;height:${renderPxH}px;font-family:'Microsoft JhengHei','PingFang TC','Noto Sans TC',sans-serif;background:#fff;padding:14px;box-sizing:border-box;display:flex;flex-direction:column;`;

      // 標頭區 4x3 格線
      const fields = [
        ['建案', projectName.value || ''], ['戶別', record.unitId || ''], ['日期', formatDate(record.inspectionDate)],
        ['階段', record.phase || ''], ['區域', record.area || ''], ['人員', record.inspectorName || ''],
        ['種類', record.category || ''], ['細項', record.subCategory || ''], ['狀態', record.status || ''],
        ['等級', record.level || ''], ['進度', record.progress || ''], [''],
      ];
      let tblHtml = '<table style="width:100%;border-collapse:collapse;margin-bottom:6px;">';
      for (let r = 0; r < 4; r++) {
        tblHtml += '<tr>';
        for (let c = 0; c < 3; c++) {
          const [label, val] = fields[r * 3 + c];
          if (label) {
            tblHtml += `<td style="padding:4px 8px;border:1px solid #ddd;font-size:12px;width:33.33%"><span style="color:#888;font-weight:bold">${label}:</span> <span style="color:#222">${val}</span></td>`;
          } else {
            tblHtml += `<td style="padding:4px 8px;border:1px solid #ddd;font-size:12px;width:33.33%"></td>`;
          }
        }
        tblHtml += '</tr>';
      }
      tblHtml += '</table>';

      // 說明區
      const desc = record.description || '(無)';
      const descHtml = `<div style="border:1px solid #ddd;padding:6px 8px;margin-bottom:6px;font-size:12px;max-height:70px;overflow:hidden;line-height:1.5;"><span style="color:#888;font-weight:bold">說明:</span> <span style="color:#333">${desc}</span></div>`;

      // 圖片區
      let photosHtml = '';
      if (record.photos && record.photos.length > 0) {
        const photos = record.photos;
        const cnt = photos.length;
        photosHtml = '<div style="flex:1;display:flex;gap:6px;align-items:flex-start;overflow:hidden;min-height:0;">';
        if (cnt === 1) {
          const src = imageCache[photos[0].url];
          if (src) photosHtml += `<img src="${src}" style="max-width:100%;max-height:100%;object-fit:contain;" />`;
        } else {
          const maxShow = Math.min(cnt, detailTpl.maxPhotosPerRecord || 4);
          const maxW = Math.floor((renderPxW - 28 - (maxShow - 1) * 6) / maxShow);
          for (let j = 0; j < maxShow; j++) {
            const src = imageCache[photos[j].url];
            if (src) photosHtml += `<img src="${src}" style="max-width:${maxW}px;max-height:100%;object-fit:contain;" />`;
          }
        }
        photosHtml += '</div>';
      }

      // 頁首備註
      const headerNoteHtml = detailTpl.headerNote
        ? `<div style="font-size:10px;color:#888;text-align:center;margin-bottom:4px;border-bottom:1px solid #eee;padding-bottom:3px;">${detailTpl.headerNote}</div>`
        : '';

      // 頁尾備註
      const footerNoteHtml = detailTpl.footerNote
        ? `<div style="font-size:10px;color:#888;text-align:center;margin-top:auto;border-top:1px solid #eee;padding-top:3px;">${detailTpl.footerNote}</div>`
        : '';

      cardDiv.innerHTML = headerNoteHtml + tblHtml + descHtml + photosHtml + footerNoteHtml;
      document.body.appendChild(cardDiv);

      await new Promise(resolve => setTimeout(resolve, 100));

      const canvas = await html2canvas(cardDiv, {
        width: renderPxW,
        height: renderPxH,
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
      });
      document.body.removeChild(cardDiv);

      const imgData = canvas.toDataURL('image/jpeg', 0.92);
      const yPos = isTop ? margin : halfH + 1;
      doc.addImage(imgData, 'JPEG', margin, yPos, usableW, cardH);

      if (isTop && i + 1 < batchRecords.length) {
        doc.setDrawColor(200, 200, 200);
        doc.setLineWidth(0.3);
        doc.line(margin, halfH, pageW - margin, halfH);
      }
    }

    // 轉換成 Blob 用於預覽
    const pdfBlob = doc.output('blob');

    // 使用 FileReader 確保大型 PDF 能安全轉為 Data URL
    const pdfDataUri = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(pdfBlob);
    });

    console.log("Generated PDF Base64 string length:", pdfDataUri.length);

    currentPdfBlob.value = pdfBlob;
    currentPdfBase64.value = pdfDataUri;
    previewPdfUrl.value = URL.createObjectURL(pdfBlob);

    showGeneratePdfDialog.value = false;
    showPdfPreviewDialog.value = true;

  } catch (error) {
    console.error('下載批次 PDF 失敗:', error);
    alert(`產製批次 PDF 失敗: ${error.message}`);
  } finally {
    isDownloading.value = false;
  }
}

// ------------------------------
// --- PDF 信件寄送邏輯 ---
// ------------------------------

function handlePreviewReport() {
  innerPreviewTitle.value = '報告格式預覽';
  pdfEmbedSource.value = currentPdfBase64.value;
  showInnerPdfPreview.value = true;
}

function handlePreviewAttachment(file) {
  if (!file || !file.url) return;
  const url = file.url.toLowerCase();
  const name = (file.name || '').toLowerCase();

  if (name.endsWith('.pdf') || url.includes('.pdf') || url.includes('.pdf?alt=media')) {
    innerPreviewTitle.value = `預覽附件：${file.name}`;
    pdfEmbedSource.value = file.url;
    showInnerPdfPreview.value = true;
  } else if (name.match(/\.(png|jpe?g|webp|gif|bmp)$/i) || url.match(/\.(png|jpe?g|webp|gif|bmp)(\?|$)/i) || url.includes('alt=media')) {
    // Firebase Storage 通常帶有 alt=media
    previewImageUrl.value = file.url;
    showPreviewDialog.value = true;
  } else {
    // 其他文件若不支援內建預覽，仍以開新分頁 fallback 處理
    window.open(file.url, '_blank');
  }
}

function downloadPreviewPdf() {
  if (currentPdfBlob.value) {
    const dateStr = format(new Date(), 'yyyyMMdd');
    const fileName = `批次報告_${projectName.value}_${selectedUnit.value || '全案'}_${dateStr}.pdf`;
    mobileSafeDownload(currentPdfBlob.value, fileName);
  }
}

async function openEmailDialog() {
  showEmailListDialog.value = true;
  emailRecipients.value = [];
  includeAttachments.value = true;
  selectedAttachments.value = pdfTemplate.value?.emailAttachments?.files?.map(f => f.url) || [];
  try {
    // 1. 取得客戶信箱 (如果有)
    const batchInfo = confirmedBatches.value.find(b => b.batchId === selectedBatchId.value) || {};
    if (batchInfo.buyerInfo?.email) {
      emailRecipients.value.push({
        label: `[客戶] ${batchInfo.buyerInfo.name}`,
        email: batchInfo.buyerInfo.email,
        selected: true
      });
    }

    // 2. 取得當下操作者信箱
    if (userStore.user?.email) {
      // 避免重複
      if (!emailRecipients.value.some(r => r.email === userStore.user.email)) {
        emailRecipients.value.push({
          label: `[本人] ${userStore.user.name || '目前操作者'}`,
          email: userStore.user.email,
          selected: true
        });
      }
    }

    // 3. 取得內部有「驗屋系統」權限的人員信箱
    const internalStaff = await fetchInspectionPersonnelWithEmailsAPI(props.projectId);
    internalStaff.forEach(staff => {
      // 避免跟客戶或本人重複
      if (!emailRecipients.value.some(r => r.email === staff.email)) {
        emailRecipients.value.push(staff);
      }
    });

  } catch (e) {
    console.error("載入收件人名單失敗", e);
    alert("載入收件人名單失敗: " + e.message);
  }
}

function toggleAllEmails(selectAll) {
  emailRecipients.value.forEach(r => r.selected = selectAll);
}

async function sendInspectionEmail() {
  const selectedEmails = emailRecipients.value.filter(r => r.selected);
  if (selectedEmails.length === 0) {
    alert("請至少先選擇一位收件人！");
    return;
  }

  isSendingEmail.value = true;

  try {
    const batchInfo = confirmedBatches.value.find(b => b.batchId === selectedBatchId.value) || {};
    const buyerName = batchInfo.buyerInfo?.name || '(未填寫)';

    // 將第一順序客戶的信箱分離為 To, 其餘所有的列為 Bcc
    const toEmails = [];
    const bccEmails = [];

    selectedEmails.forEach(rec => {
      if (rec.label.startsWith('[客戶]')) {
        toEmails.push(rec.email);
      } else {
        bccEmails.push(rec.email);
      }
    });

    const response = await sendInspectionReportEmailsAPI(
      props.projectId,
      selectedUnit.value,
      buyerName,
      toEmails,
      bccEmails,
      currentPdfBase64.value,
      includeAttachments.value ? selectedAttachments.value : []
    );

    if (response && response.status === 'success') {
      alert("信件已成功寄出！檔案已存至 Google Drive。");
      showEmailListDialog.value = false;
    }
  } catch (e) {
    console.error('寄送信件失敗:', e);
    alert(`寄出失敗: ${e.message}`);
  } finally {
    isSendingEmail.value = false;
  }
}

// ------------------------------

</script>

<style scoped>
.cursor-pointer {
  cursor: pointer;
}

.record-card {
  transition: box-shadow 0.2s ease-in-out;
}

.record-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.photo-strip .v-img {
  max-width: calc(20% - 4px);
  flex-basis: calc(20% - 4px);
}

.description-truncate {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
  min-height: 1.5em;
}

.border-b {
  border-bottom: 1px solid rgba(0, 0, 0, 0.12);
}

.photo-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  color: white;
  font-size: 0.9rem;
  font-weight: bold;
}

.position-relative {
  position: relative;
}

.deleted-card-look {
  opacity: 0.65;
}

.deleted-card-look .v-card-actions button {
  opacity: 1;
  pointer-events: auto;
}

.deleted-card-look .photo-strip .v-img {
  pointer-events: none;
}

/* ✓ 修改：(原 .mobile-title-scaling)
   從 "縮放" (clamp) 改為 "允許換行" (white-space: normal)
*/
.mobile-title-scaling {
  /* 1. 允許文字換行 */
  white-space: normal !important;

  /* 2. 移除溢出隱藏，讓它可以撐開高度 */
  overflow: visible !important;
  text-overflow: clip !important;

  /* 3. 設定一個舒適的行高 */
  line-height: 1.35rem !important;

  /* 4. 移除 clamp() 縮放，使用繼承的字體大小 */
  font-size: inherit !important;

  /* 5. 確保 title 自身高度是自動的 */
  height: auto !important;
  min-height: 0 !important;
}

/* ✓ 新增：讓 v-toolbar 的高度自適應
   (Vuetify 的 v-toolbar 預設有 min-height 和 height) 
*/
.mobile-toolbar-wrap {
  height: auto !important;
  min-height: 56px !important;
  /* 保留一個最小高度 (Vuetify 手機版預設值) */
}

/* ✓ 新增：手機版底部導覽列樣式 */
.mobile-btn-text {
  font-size: 0.7rem;
  /* 調整文字大小以適應按鈕 */
  margin-top: 2px;
  /* 與圖標的間距 */
  line-height: 1.2;
}

/* ✓ FAB 按鈕：水平置中，位於底部導覽列上方 */
.mobile-fab {
  position: fixed;
  bottom: 76px;
  /* 底部導覽列約 56px + 20px 間距 */
  left: 50%;
  transform: translateX(-50%);
  z-index: 10 !important;
}



/* ✓ 新增：強制 v-bottom-navigation 固定在底部 */
.mobile-bottom-nav {
  position: fixed !important;
  /* 強制 fixed 定位 */
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 8 !important;
  /* 確保 z-index 低於 FAB */
}

/* ✅ 可選：如果希望底部按鈕文字更小 */
.mobile-bottom-nav .v-btn .mobile-btn-text {
  font-size: 0.65rem;
  /* 再稍微縮小一點 */
}

/* ✅ 可選：為 QR Code 加上邊框和內距 */
.border.pa-1 {
  border: 1px solid #e0e0e0;
  padding: 4px;
  background-color: white;
  /* 確保背景是白色 */
}

.confirmed-record-bg {
  background-color: #f5f5f5 !important;
  /* 使用 !important 確保覆蓋 Vuetify 預設樣式 */
}

/* 進階篩選面板 */
.advanced-filter-panel {
  border: 1px solid rgba(0, 0, 0, 0.08);
}

.advanced-filter-panel .v-chip {
  max-width: 120px;
}

.advanced-filter-panel .v-chip__content {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* ===== Onboarding Tour 導覽樣式 ===== */
.onboarding-card {
  overflow: hidden;
}

.onboarding-hero {
  position: relative;
  padding: 32px 16px 28px;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.onboarding-close-btn {
  position: absolute;
  top: 8px;
  right: 8px;
  color: rgba(255, 255, 255, 0.7) !important;
}

.onboarding-close-btn:hover {
  color: white !important;
}

.onboarding-icon-wrapper {
  width: 96px;
  height: 96px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  animation: onboarding-bounce 2s ease-in-out infinite;
}

@keyframes onboarding-bounce {

  0%,
  100% {
    transform: translateY(0);
  }

  50% {
    transform: translateY(-8px);
  }
}

.onboarding-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #e0e0e0;
  cursor: pointer;
  transition: all 0.3s ease;
}

.onboarding-dot--active {
  width: 24px;
  border-radius: 4px;
  background: #1976d2;
}

.onboarding-dot--done {
  background: #81c784;
}
</style>