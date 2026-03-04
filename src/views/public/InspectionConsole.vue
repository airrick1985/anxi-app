<template>
  <v-container
    fluid
    :class="mobile ? 'pa-0' : 'pa-2 pa-sm-4'"
    style="background-color: #F4F4F7; min-height: 100vh;"
    :style="mobile && projectId ? 'padding-bottom: 72px;' : ''"
  >
    <v-card class="mx-auto" max-width="1600">

      <v-toolbar
        color="primary"
        dark
        flat
        :class="{ 'mobile-toolbar-wrap': mobile, 'py-2': mobile }"
        height="auto"
      >
       <v-btn icon="mdi-home" variant="text" to="/home" aria-label="回系統選單"></v-btn>
        <v-toolbar-title
          class="font-weight-bold"
          :class="{ 'mobile-title-scaling': mobile }"
        >
        
          {{ projectId ? `${projectName} 驗屋紀錄` : '驗屋系統 (選擇建案)' }}
          <span v-if="projectId && showDeleted" class="text-caption font-weight-light ml-2">(垃圾桶)</span>
           <span v-if="projectId && !showDeleted && !selectedUnit" class="text-caption font-weight-light ml-2">(全案紀錄)</span>
        </v-toolbar-title>
        <v-spacer></v-spacer>
        <template v-if="projectId && otherProjects.length > 0"> <v-menu offset-y> <template v-slot:activator="{ props: menuProps }"> <v-btn v-bind="menuProps" variant="text" class="pa-1" style="text-transform: none; letter-spacing: normal;" aria-label="切換建案"> <v-avatar size="32" class="mr-2"><v-img :src="currentProject?.iconUrl || defaultProjectIcon" :alt="currentProject?.name"></v-img></v-avatar> <v-icon size="small">mdi-chevron-down</v-icon> </v-btn> </template> <v-list density="compact" class="pa-0"> <v-list-item v-for="project in otherProjects" :key="project.id" @click="enterProject(project)" link> <template v-slot:prepend><v-avatar size="32" class="mr-3"><v-img :src="project.iconUrl || defaultProjectIcon" :alt="project.name"></v-img></v-avatar></template> <v-list-item-title>{{ project.name }}</v-list-item-title> </v-list-item> </v-list> </v-menu> </template>
      </v-toolbar>

      <div v-if="isLoading" class="text-center pa-10"> <v-progress-circular indeterminate color="primary" size="50"></v-progress-circular> <p class="mt-4 text-grey">{{ loadingText }}</p> </div>
      <div v-else-if="!isBound" class="text-center pa-10"> <v-icon size="60" color="warning" class="mb-4">mdi-account-alert-outline</v-icon> <p class="text-h6">無法使用此功能</p> <p class="mt-2 text-grey-darken-1">您的 LINE 帳號尚未綁定系統手機，請先完成綁定。</p> <v-btn color="primary" class="mt-6" href="/?liff_path=line-binding" variant="elevated"> 前往綁定頁面 </v-btn> </div>

      <div v-else-if="isBound && projectId">
        <v-sheet class="pa-3 border-b">
          <v-row dense align="center">
            <v-col cols="12" sm="6" md="3">
              <v-select
                v-model="selectedBuilding"
                :items="buildingItems"
                label="選擇棟別"
                variant="outlined"
                
                hide-details
                clearable
                @update:model-value="selectedUnit = null; loadData()"
                :loading="isLoadingStructure"
                :disabled="showDeleted"
              ></v-select>
            </v-col>
            <v-col cols="12" sm="6" md="3">
              <v-select
                v-model="selectedUnit"
                :items="unitItems"
                label="選擇戶別"
                variant="outlined"
               
                hide-details
                clearable
                 :disabled="showDeleted || !selectedBuilding"
                @update:model-value="loadData()"
              ></v-select>
            </v-col>
            <v-col cols="12" md="3">
              <v-text-field
                v-model="searchFilter"
                label="搜尋所有欄位"
                prepend-inner-icon="mdi-magnify"
                variant="outlined"
               
                hide-details
                clearable
              ></v-text-field>
            </v-col>
            <v-col cols="12" md="3" class="d-flex justify-end align-center ga-2 mt-2 mt-md-0">
              <div v-if="!mobile" class="d-flex justify-end align-center ga-2" style="width: 100%;">
                <v-btn
                  color="primary"
                  @click="openAddDialog"
                  prepend-icon="mdi-plus"
                  :disabled="showDeleted || !(selectedUnit && selectedBuilding)"
                 
                >
                  新增
                </v-btn>
                <v-btn-toggle
                  v-model="showDeleted"
                  :true-value="true"
                  :false-value="false"
                  mandatory
                 
                  variant="outlined"
                  divided
                  color="primary"
                  @update:model-value="handleModeChange"
                >
                  <v-tooltip location="top" text="全案紀錄">
                    <template v-slot:activator="{ props }">
                      <v-btn v-bind="props" :value="false" icon="mdi-file-document-outline" aria-label="全案紀錄"></v-btn>
                    </template>
                  </v-tooltip>
                  <v-tooltip location="top" text="垃圾桶">
                    <template v-slot:activator="{ props }">
                      <v-btn v-bind="props" :value="true" icon="mdi-delete-outline" aria-label="已刪除紀錄"></v-btn>
                    </template>
                  </v-tooltip>
                </v-btn-toggle>
                <v-btn-toggle v-model="viewMode" mandatory density="compact" variant="outlined" divided>
                  <v-tooltip location="top" text="表格模式"> <template v-slot:activator="{ props }"> <v-btn v-bind="props" value="table" icon="mdi-table" aria-label="表格視圖"></v-btn> </template> </v-tooltip>
                  <v-tooltip location="top" text="卡片模式"> <template v-slot:activator="{ props }"> <v-btn v-bind="props" value="card" icon="mdi-view-dashboard" aria-label="卡片視圖"></v-btn> </template> </v-tooltip>
                </v-btn-toggle>

                <v-menu offset-y>
                  <template v-slot:activator="{ props }">
                    <v-btn
                      color="secondary"
                      v-bind="props"
                      size="small"
                      prepend-icon="mdi-export-variant"
                      :disabled="!selectedUnit || showDeleted"
                    >
                      匯出報告
                    </v-btn>
                  </template>
                  <v-list density="compact">
                    <v-list-item @click="handleShareReport"> <template v-slot:prepend><v-icon>mdi-share-variant-outline</v-icon></template>
                      <v-list-item-title>分享連結</v-list-item-title>
                    </v-list-item>
                    <v-list-item @click="handleGeneratePdf"> <template v-slot:prepend><v-icon>mdi-file-pdf-box</v-icon></template>
                      <v-list-item-title>產製報告</v-list-item-title>
                    </v-list-item>
                  </v-list>
                </v-menu>

                <v-menu offset-y>
                  <template v-slot:activator="{ props }">
                    <v-btn
                      color="primary"
                      v-bind="props"
                      size="small"
                      variant="outlined"
                      prepend-icon="mdi-download"
                      :disabled="filteredRecords.length === 0"
                    >
                      下載報告
                    </v-btn>
                  </template>
                  <v-list density="compact">
                    <v-list-item @click="handleDownloadExcel" :disabled="filteredRecords.length === 0"> <template v-slot:prepend><v-icon color="green">mdi-file-excel-box</v-icon></template>
                      <v-list-item-title>下載 Excel</v-list-item-title>
                    </v-list-item>
                    <v-list-item @click="handleDownloadPdf" :disabled="filteredRecords.length === 0"> <template v-slot:prepend><v-icon color="red">mdi-file-pdf-box</v-icon></template>
                      <v-list-item-title>下載 PDF</v-list-item-title>
                    </v-list-item>
                  </v-list>
                </v-menu>
                </div>
            </v-col>
          </v-row>
        </v-sheet>
        <div v-if="isLoadingRecords" class="text-center pa-10"> <v-progress-circular indeterminate color="primary" size="40"></v-progress-circular> <p class="mt-4 text-grey">正在載入紀錄...</p> </div>
        <div v-else-if="filteredRecords.length > 0">
          <div v-if="viewMode === 'table'">
            <v-data-table
              :headers="headers"
              :items="filteredRecords"
              :loading="isLoadingRecords"
              :search="searchFilter"
              item-value="id"
              class="elevation-0"
              :items-per-page="10"
              :items-per-page-options="[{ value: 10, title: '10' },{ value: 25, title: '25' },{ value: 50, title: '50' },{ value: 100, title: '100' },{ value: -1, title: '全部顯示' }]"
              density="compact"
            >
              <template v-slot:item="{ item }">
                <tr :class="{ 'confirmed-record-bg': !!item.customerConfirmedAt }">
                  <td v-if="!selectedUnit">{{ item.unitId }}</td>
                  <td>{{ formatDate(item.inspectionDate) }}</td>
                  <td>{{ item.phase }}</td>
                  <td>
                    <div class="d-flex ga-1 pa-1">
                      <v-img v-for="(photo, index) in item.photos.slice(0, 4)" :key="index" :src="photo.url" aspect-ratio="1" cover width="40" class="rounded border cursor-pointer" @click="showImagePreview(photo.url)">
                        <template v-slot:placeholder> <div class="d-flex align-center justify-center fill-height"> <v-progress-circular indeterminate color="grey-lighten-4"></v-progress-circular> </div> </template>
                      </v-img>
                    </div>
                  </td>
                  <td>{{ item.area }}</td>
                  <td>{{ item.category }}</td>
                  <td>{{ item.subCategory }}</td>
                  <td>
                    <ChipRenderer v-if="showDeleted" :value="item.status" type="status" :options="optionsForChips.status" size="small"/>
                    <div v-else class="position-relative">
                      <v-fade-transition> <v-overlay v-if="updatingRecord.id === item.id && updatingRecord.field === 'status'" contained persistent class="align-center justify-center"> <v-progress-circular indeterminate size="20"></v-progress-circular> </v-overlay> </v-fade-transition>
                      <v-menu offset-y> <template v-slot:activator="{ props: menuProps }"> <ChipRenderer v-bind="menuProps" :value="item.status" type="status" :options="optionsForChips.status" style="cursor: pointer;" size="small"/> </template> <v-sheet class="pa-2"> <v-chip-group column :model-value="item.status" @update:model-value="(newValue) => { handleFieldUpdate(item, 'status', newValue); }"> <v-chip v-for="option in optionsForChips.status" :key="option.id" :value="option.value" :color="option.color || 'grey'" filter variant="outlined" size="small"> <v-icon v-if="option.icon" start size="small">{{ option.icon }}</v-icon> {{ option.value }} </v-chip> </v-chip-group> </v-sheet> </v-menu>
                    </div>
                  </td>
                  <td>
                     <ChipRenderer v-if="showDeleted" :value="item.level" type="level" :options="optionsForChips.level" size="small"/>
                     <div v-else class="position-relative">
                         <v-fade-transition> <v-overlay v-if="updatingRecord.id === item.id && updatingRecord.field === 'level'" contained persistent class="align-center justify-center"> <v-progress-circular indeterminate size="20"></v-progress-circular> </v-overlay> </v-fade-transition>
                         <v-menu offset-y> <template v-slot:activator="{ props: menuProps }"> <ChipRenderer v-bind="menuProps" :value="item.level" type="level" :options="optionsForChips.level" style="cursor: pointer;" size="small"/> </template> <v-sheet class="pa-2"> <v-chip-group column :model-value="item.level" @update:model-value="(newValue) => { handleFieldUpdate(item, 'level', newValue); }"> <v-chip v-for="option in optionsForChips.level" :key="option.id" :value="option.value" :color="option.color || 'grey'" filter variant="outlined" size="small">{{ option.value }}</v-chip> </v-chip-group> </v-sheet> </v-menu>
                     </div>
                  </td>
                  <td>
                     <ChipRenderer v-if="showDeleted" :value="item.progress" type="progress" :options="optionsForChips.progress" size="small"/>
                     <div v-else class="position-relative">
                         <v-fade-transition> <v-overlay v-if="updatingRecord.id === item.id && updatingRecord.field === 'progress'" contained persistent class="align-center justify-center"> <v-progress-circular indeterminate size="20"></v-progress-circular> </v-overlay> </v-fade-transition>
                         <v-menu offset-y> <template v-slot:activator="{ props: menuProps }"> <ChipRenderer v-bind="menuProps" :value="item.progress" type="progress" :options="optionsForChips.progress" style="cursor: pointer;" size="small"/> </template> <v-sheet class="pa-2"> <v-chip-group column :model-value="item.progress" @update:model-value="(newValue) => { handleFieldUpdate(item, 'progress', newValue); }"> <v-chip v-for="option in optionsForChips.progress" :key="option.id" :value="option.value" :color="option.color || 'grey'" filter variant="outlined" size="small"> <v-icon v-if="option.icon" start size="small">{{ option.icon }}</v-icon> {{ option.value }} </v-chip> </v-chip-group> </v-sheet> </v-menu>
                     </div>
                  </td>
                  <td>
                    <span v-if="item.customerConfirmedAt" class="text-caption text-success-darken-1">
                        {{ formatDate(item.customerConfirmedAt) }}
                    </span>
                    <v-chip
                      v-else
                      color="red"
                      text-color="white"
                      size="small"
                      label
                    >
                      買方未確認
                    </v-chip>
                  </td>
                  <td>{{ item.description }}</td>
                  <td>{{ item.inspectorName }}</td>
                  <td>{{ formatDateTime(item.createdAt) }}</td>
                  <td v-if="showDeleted">{{ formatDateTime(item.deletedAt) }}</td>
                  <td>
                    <div class="d-flex align-center justify-start ga-0">
                      <template v-if="!showDeleted">
                        <div class="position-relative"> <v-fade-transition> <v-overlay v-if="updatingRecord.id === item.id && updatingRecord.field === 'customerView'" contained persistent class="align-center justify-center" scrim="rgba(255, 255, 255, 0.7)"> <v-progress-circular indeterminate size="20"></v-progress-circular> </v-overlay> </v-fade-transition> <v-tooltip location="top" :text="item.customerView === false ? '不顯示於報告' : '顯示於報告'"> <template v-slot:activator="{ props }"> <v-btn v-bind="props" :icon="item.customerView === false ? 'mdi-eye-off-outline' : 'mdi-eye-outline'" :color="item.customerView === false ? 'grey' : 'primary'" variant="text" size="small" density="compact" @click="() => { console.log('Eye Btn Clicked:', { id: item.id, current: item.customerView, next: !(item.customerView ?? true) }); handleFieldUpdate(item, 'customerView', !(item.customerView ?? true)); }" :disabled="updatingRecord.id === item.id && updatingRecord.field === 'customerView'" aria-label="切換客戶檢視狀態"></v-btn> </template> </v-tooltip> </div>
                        <v-tooltip location="top" text="編輯"> <template v-slot:activator="{ props }"> <v-btn v-bind="props" icon="mdi-pencil" variant="text" size="small" density="compact" @click="openEditDialog(item)" color="primary" aria-label="編輯紀錄"></v-btn> </template> </v-tooltip>
                        <v-tooltip location="top" text="刪除"> <template v-slot:activator="{ props }"> <v-btn v-bind="props" icon="mdi-delete" variant="text" size="small" density="compact" @click="openDeleteDialog(item)" color="error" aria-label="刪除紀錄"></v-btn> </template> </v-tooltip>
                      </template>
                      <template v-else>
                        <v-tooltip location="top" text="還原"> <template v-slot:activator="{ props }"> <v-btn v-bind="props" icon="mdi-restore" variant="text" size="small" density="compact" @click="openRestoreDialog(item)" color="success" aria-label="還原紀錄"></v-btn> </template> </v-tooltip>
                      </template>
                    </div>
                  </td>
                </tr>
              </template>
              <template v-slot:no-data> <div class="pa-4 text-center text-grey"> {{ noDataText }} </div> </template>
            </v-data-table>
          </div>
          <div v-if="viewMode === 'card'" class="pa-2 pa-sm-4">
            <v-row dense>
              <v-col v-for="item in filteredRecords" :key="item.id" cols="12" sm="6" md="4" lg="3">
                <v-card
                  class="mb-3 record-card"
                  variant="outlined"
                  :class="{ 'deleted-card-look': showDeleted, 'confirmed-record-bg': !!item.customerConfirmedAt }"
                >
                  <div v-if="!selectedUnit" class="pa-2 border-b" :class="showDeleted ? 'bg-grey-lighten-4' : 'bg-blue-grey-lighten-5'">
                    <strong :class="showDeleted ? 'text-grey-darken-2' : 'text-blue-grey-darken-3'">戶別: {{ item.unitId }}</strong>
                  </div>
                  <div v-if="item.photos && item.photos.length > 0" class="d-flex ga-1 pa-2 border-b photo-strip">
                     <v-img v-for="(photo, index) in item.photos.slice(0, 5)" :key="index" :src="photo.url" aspect-ratio="1" cover height="50" class="rounded border cursor-pointer" @click="showImagePreview(photo.url)">
                       <template v-slot:placeholder> <div class="d-flex align-center justify-center fill-height"> <v-progress-circular indeterminate size="20" color="grey-lighten-2"></v-progress-circular> </div> </template>
                       <div v-if="index === 4 && item.photos.length > 5" class="photo-overlay d-flex align-center justify-center"> +{{ item.photos.length - 5 }} </div>
                     </v-img>
                  </div>
                  <v-card-item class="pb-1 pt-2">
                     <div> <span class="text-subtitle-1 font-weight-bold mr-2">{{ item.area }}</span> <span class="text-caption text-grey">{{ formatDate(item.inspectionDate) }} - {{ item.phase }}</span> </div>
                     <p class="text-body-2 text-medium-emphasis mt-1"> {{ item.category }} / {{ item.subCategory }} </p>
                  </v-card-item>
                  <v-card-text class="py-2">
                     <div class="d-flex ga-2 flex-wrap mb-1">
                       <ChipRenderer size="small" :value="item.status" type="status" :options="optionsForChips.status" />
                       <ChipRenderer size="small" :value="item.level" type="level" :options="optionsForChips.level" />
                       <ChipRenderer size="small" :value="item.progress" type="progress" :options="optionsForChips.progress" />
                     </div>
                     <p v-if="item.description" class="text-caption text-medium-emphasis description-truncate mt-1"> {{ item.description }} </p>
                     <p v-if="showDeleted && item.deletedAt" class="text-caption text-error mt-1"> 刪除時間: {{ formatDateTime(item.deletedAt) }} </p>
                  </v-card-text>
                  <v-divider></v-divider>
                  <v-card-actions class="px-3 py-1">
                    <div class="d-flex flex-column flex-grow-1 mr-2">
                         <span class="text-caption text-grey"> 驗屋人員: {{ item.inspectorName }} @ {{ formatDateTime(item.createdAt) }} </span>
                         <span v-if="item.customerConfirmedAt" class="text-caption text-success-darken-1 mt-1">
                             買方確認：{{ formatDate(item.customerConfirmedAt) }}
                         </span>
                         <v-chip
                           v-else
                           color="red"
                           text-color="white"
                           size="x-small"
                           label
                           class="mt-1"
                         >
                           買方未確認
                         </v-chip>
                    </div>
                    <template v-if="!showDeleted">
                      <div class="position-relative"> <v-fade-transition> <v-overlay v-if="updatingRecord.id === item.id && updatingRecord.field === 'customerView'" contained scrim="rgba(255, 255, 255, 0.7)" persistent class="align-center justify-center"> <v-progress-circular indeterminate size="16" width="2"></v-progress-circular> </v-overlay> </v-fade-transition> <v-tooltip location="top" :text="item.customerView === false ? '不顯示於報告' : '顯示於報告'"> <template v-slot:activator="{ props }"> <v-btn v-bind="props" :icon="item.customerView === false ? 'mdi-eye-off-outline' : 'mdi-eye-outline'" :color="item.customerView === false ? 'grey' : 'primary'" variant="text" size="small" @click="handleFieldUpdate(item, 'customerView', !(item.customerView ?? true))" :disabled="updatingRecord.id === item.id && updatingRecord.field === 'customerView'" aria-label="切換客戶檢視狀態"></v-btn> </template> </v-tooltip> </div>
                      <v-btn icon="mdi-pencil" variant="text" size="small" @click="openEditDialog(item)" color="primary" aria-label="編輯紀錄"></v-btn>
                      <v-btn icon="mdi-delete" variant="text" size="small" @click="openDeleteDialog(item)" color="error" aria-label="刪除紀錄"></v-btn>
                    </template>
                    <template v-else>
                      <v-btn icon="mdi-restore" variant="text" size="small" @click="openRestoreDialog(item)" color="success" aria-label="還原紀錄"></v-btn>
                    </template>
                  </v-card-actions>
                </v-card>
              </v-col>
            </v-row>
          </div>
          </div>
        <div v-else class="pa-10 text-center text-grey"> {{ noDataText }} </div>
      </div>

      <div v-else-if="isBound && !projectId" class="pa-6"> <p class="text-h6 text-center mb-6"> 歡迎，{{ userStore.user?.name }}！<br> 請選擇您要進入的驗屋系統建案： </p> <div v-if="authorizedProjects.length > 0" class="d-flex flex-wrap justify-center ga-4"> <IconButton v-for="project in authorizedProjects" :key="project.id" :icon="project.iconUrl || defaultProjectIcon" :text="project.name" :scale="0.8" @click="enterProject(project)" /> </div> <v-alert v-else type="warning" variant="tonal" class="mt-4"> 您目前沒有任何建案的「驗屋系統」權限。 </v-alert> </div>

    </v-card>

    <InspectionRecordEditor
      v-model="showEditorDialog"
      :project-id="projectId"
      :project-name="projectName"
      :unit-id="recordBeingEdited ? recordBeingEdited.unitId : selectedUnit"
      :record-to-edit="recordBeingEdited"
      @saved="handleRecordSaved"
      fullscreen
    />

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
            <qrcode-vue
              :value="shareUrl"
              :size="200"
              level="H"
              class="mb-4 d-inline-block border pa-1"
            ></qrcode-vue>

            <v-text-field
              :model-value="shareUrl"
              label="分享連結 (有效期限 90 天)"
              readonly
              variant="outlined"
              density="compact"
              append-inner-icon="mdi-content-copy"
              @click:append-inner="copyShareUrl"
              hide-details
            ></v-text-field>
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
          <div v-else-if="confirmedBatches.length === 0" class="text-center py-10 text-grey">
            <v-icon size="40">mdi-file-question-outline</v-icon>
            <p class="mt-3">找不到此戶別已確認簽署的驗屋紀錄批次。</p>
            <p class="text-caption">客戶需要先在分享的報告頁面完成簽名確認。</p>
          </div>
          <div v-else>
            <v-row dense class="mb-4">
              <v-col cols="12" sm="4">
                <v-text-field
                  label="建案名稱"
                  :model-value="projectName"
                  readonly
                  variant="outlined"
                  density="compact"
                  hide-details
                ></v-text-field>
              </v-col>
              <v-col cols="12" sm="4">
                <v-text-field
                  label="戶別"
                  :model-value="selectedUnit"
                  readonly
                  variant="outlined"
                  density="compact"
                  hide-details
                ></v-text-field>
              </v-col>
              <v-col cols="12" sm="4">
                <v-text-field
                  v-model="inspectorNameForPdf"
                  label="報告產製人員 (可修改)"
                  variant="outlined"
                  density="compact"
                  hide-details
                  clearable
                ></v-text-field>
              </v-col>
            </v-row>

            <p class="text-subtitle-1 mb-2">請選擇要產製報告的驗屋紀錄批次：</p>
            <v-item-group v-model="selectedBatchId" mandatory>
              <v-row dense>
                <v-col
                  v-for="batch in confirmedBatches"
                  :key="batch.batchId"
                  cols="12" md="6" lg="4"
                >
                  <v-item v-slot="{ isSelected, toggle }" :value="batch.batchId">
                    <v-card
                      :color="isSelected ? 'primary' : ''"
                      :variant="isSelected ? 'elevated' : 'outlined'"
                      class="fill-height d-flex flex-column"
                      @click="toggle"
                      style="cursor: pointer;"
                    >
                      <v-card-item>
                        <div>
                          <div class="text-overline mb-1">
                            確認日期: {{ batch.dateString }}
                          </div>
                          <div class="text-h6 mb-1">
                            共 {{ batch.recordCount }} 筆紀錄
                          </div>
                          <v-divider class="my-1"></v-divider>
                          <div class="text-caption">買方姓名: {{ batch.buyerInfo?.name || '無' }}</div>
                          <div class="text-caption">電話: {{ batch.buyerInfo?.phone || '無' }}</div>
                          <div class="text-caption">Email: {{ batch.buyerInfo?.email || '無' }}</div>
                        </div>
                      </v-card-item>
                      <v-spacer></v-spacer>
                      <v-fade-transition>
                         <v-overlay
                            v-if="isSelected"
                            contained
                            scrim="primary"
                            class="align-center justify-center"
                          >
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

   <v-divider></v-divider> <v-card-actions class="pa-4">
          <v-spacer></v-spacer>
          <v-btn
            color="grey-darken-1"
            variant="text"
            @click="showGeneratePdfDialog = false"
          >
            取消
          </v-btn>
          <v-btn
            color="secondary"
            variant="outlined"
            @click="handleDownloadBatchPdf"
            :disabled="!selectedBatchId || isLoadingBatches"
            size="large"
            prepend-icon="mdi-download"
            class="mr-2"
          >
            下載報告 PDF
          </v-btn>
          <v-btn
            color="primary"
            variant="elevated"
            @click="startPdfGeneration"
            :disabled="!selectedBatchId || isLoadingBatches"
            size="large"
            prepend-icon="mdi-cloud-upload"
          >
            上傳產製報告
          </v-btn>
        </v-card-actions>
        </v-card>
    </v-dialog>

    <v-dialog v-model="showProcessingDialog" persistent max-width="400px">
      <v-card color="primary">
        <v-card-text class="d-flex align-center pa-4">
          <v-progress-circular indeterminate color="white" class="mr-4"></v-progress-circular>
          <div>
            <div class="text-h6">報告產製中...</div>
            <div class="text-caption">完成後將會寄送 Email 通知買方及產製人員。此視窗可關閉。</div>
          </div>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn variant="text" @click="closeProcessingDialog">關閉視窗</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="showPreviewDialog" max-width="80vw" max-height="90vh"> <v-card> <v-toolbar dense flat class="border-b"> <v-spacer></v-spacer> <v-btn icon="mdi-close" @click="showPreviewDialog = false"></v-btn> </v-toolbar> <v-card-text class="pa-0"> <v-img :src="previewImageUrl" contain max-height="calc(90vh - 48px)"></v-img> </v-card-text> </v-card> </v-dialog>
    <v-dialog v-model="showDeleteDialog" persistent max-width="400px"> <v-card> <v-card-title class="text-h6 text-error"> <v-icon start>mdi-alert-circle-outline</v-icon> 確認刪除紀錄 </v-card-title> <v-card-text> 您確定要將這筆驗屋紀錄移至資源回收桶嗎？ <div v-if="recordToDelete" class="mt-2 text-caption text-medium-emphasis"> 日期: {{ formatDate(recordToDelete.inspectionDate) }} <br> 區域: {{ recordToDelete.area }} <br> 種類: {{ recordToDelete.category }} / {{ recordToDelete.subCategory }} </div> <br> <strong class="text-error">您之後可以在資源回收桶中還原。</strong> </v-card-text> <v-card-actions> <v-spacer></v-spacer> <v-btn color="grey-darken-1" text @click="showDeleteDialog = false" :disabled="isDeleting">取消</v-btn> <v-btn color="error" variant="flat" @click="confirmDeleteRecord" :loading="isDeleting">確認刪除</v-btn> </v-card-actions> </v-card> </v-dialog>
    <v-dialog v-model="showRestoreDialog" persistent max-width="400px"> <v-card> <v-card-title class="text-h6 text-success"> <v-icon start>mdi-restore</v-icon> 確認還原紀錄 </v-card-title> <v-card-text> 您確定要還原這筆驗屋紀錄嗎？ <div v-if="recordToRestore" class="mt-2 text-caption text-medium-emphasis"> 日期: {{ formatDate(recordToRestore.inspectionDate) }} <br> 區域: {{ recordToRestore.area }} <br> 種類: {{ recordToRestore.category }} / {{ recordToRestore.subCategory }} </div> </v-card-text> <v-card-actions> <v-spacer></v-spacer> <v-btn color="grey-darken-1" text @click="showRestoreDialog = false" :disabled="isRestoring">取消</v-btn> <v-btn color="success" variant="flat" @click="confirmRestoreRecord" :loading="isRestoring">確認還原</v-btn> </v-card-actions> </v-card> </v-dialog>

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

    <v-bottom-navigation
      v-if="mobile && projectId"
      color="primary"
      elevation="8"
      class="mobile-bottom-nav"
      grow >
      <v-btn
        @click="showDeleted = false; handleModeChange(false)"
        :active="!showDeleted"
        value="records"
        class="pa-0"
      >
        <v-icon size="small">mdi-file-document-outline</v-icon>
        <span class="mobile-btn-text">全案紀錄</span>
      </v-btn>

      <v-btn
        @click="showDeleted = true; handleModeChange(true)"
        :active="showDeleted"
        value="trash"
        class="pa-0"
      >
        <v-icon size="small">mdi-delete-outline</v-icon>
        <span class="mobile-btn-text">刪除紀錄</span>
      </v-btn>

      <v-btn
        @click="viewMode = (viewMode === 'table' ? 'card' : 'table')"
        value="switchMode"
        class="pa-0"
      >
        <v-icon size="small">{{ viewMode === 'table' ? 'mdi-view-dashboard-outline' : 'mdi-table' }}</v-icon>
        <span class="mobile-btn-text">切換顯示</span>
      </v-btn>
      <v-menu location="top" offset-y>
        <template v-slot:activator="{ props }">
          <v-btn
            v-bind="props"
            value="export"
            class="pa-0"
            :disabled="!selectedUnit || showDeleted"
          >
            <v-icon size="small">mdi-export-variant</v-icon>
            <span class="mobile-btn-text">匯出報告</span>
          </v-btn>
        </template>
        <v-list density="compact" class="mb-2"> <v-list-item @click="handleShareReport"> <template v-slot:prepend><v-icon>mdi-share-variant-outline</v-icon></template>
            <v-list-item-title>分享連結</v-list-item-title>
          </v-list-item>
          <v-list-item @click="handleGeneratePdf"> <template v-slot:prepend><v-icon>mdi-file-pdf-box</v-icon></template>
            <v-list-item-title>產製報告</v-list-item-title>
          </v-list-item>
        </v-list>
      </v-menu>

      <v-menu location="top" offset-y>
        <template v-slot:activator="{ props }">
          <v-btn
            v-bind="props"
            value="download"
            class="pa-0"
            :disabled="filteredRecords.length === 0"
          >
            <v-icon size="small">mdi-download</v-icon>
            <span class="mobile-btn-text">下載報告</span>
          </v-btn>
        </template>
        <v-list density="compact" class="mb-2">
          <v-list-item @click="handleDownloadExcel" :disabled="filteredRecords.length === 0"> <template v-slot:prepend><v-icon color="green">mdi-file-excel-box</v-icon></template>
            <v-list-item-title>下載 Excel</v-list-item-title>
          </v-list-item>
          <v-list-item @click="handleDownloadPdf" :disabled="filteredRecords.length === 0"> <template v-slot:prepend><v-icon color="red">mdi-file-pdf-box</v-icon></template>
            <v-list-item-title>下載 PDF</v-list-item-title>
          </v-list-item>
        </v-list>
      </v-menu>
      </v-bottom-navigation>

    <v-btn
      v-if="mobile && projectId"
      @click="openAddDialog"
      :disabled="showDeleted || !(selectedUnit && selectedBuilding)"
      color="primary"
      rounded="circle"
      elevation="8"
      size="large"
      class="mobile-fab"
      icon
    >
      <v-icon size="large">mdi-plus</v-icon>
    </v-btn>

    <div class="text-caption text-grey text-center mt-4 d-flex align-center justify-center">
  <span>Powered by&nbsp;</span>
  <v-chip
    class="ml-1"
    href="https://anxismart.com/"
    target="_blank"
    rel="noopener noreferrer"
    color="blue-grey"
    variant="tonal"
    size="small"
    pill
  >
    <v-icon start size="x-small">mdi-rocket-launch-outline</v-icon>
    anxismart安熙智慧建案管理系統
  </v-chip>
</div>

  </v-container>
</template>

<script setup>
import { ref, onMounted, computed, reactive } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import liff from '@line/liff';
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
  generateInspectionPdf 
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

const route = useRoute();
const userStore = useUserStore();
const projectStore = useProjectStore();
const router = useRouter();
const { mobile } = useDisplay(); // ✓ 確保 useDisplay 和 mobile 已定義

const props = defineProps({ projectId: { type: String, default: null } });

const viewMode = ref('table');
const projectName = computed(() => projectStore.idToNameMap[props.projectId] || '建案');
const isLoading = ref(true);
const loadingText = ref('正在初始化...');
const isBound = ref(false);
const isLoadingStructure = ref(false);
const isLoadingRecords = ref(false);
const projectStructure = ref({});
const selectedBuilding = ref(null);
const selectedUnit = ref(null);
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
    if (!searchFilter.value) return allRecords.value;
    const lowerSearch = searchFilter.value.toLowerCase();
    return allRecords.value.filter(record => {
      const searchableValues = [
        record.inspectionDate, record.phase, record.area, record.category,
        record.subCategory, record.status, record.level, record.progress,
        record.description, record.inspectorName, record.createdAt, record.deletedAt,
        record.unitId
      ];
      return searchableValues.some(val => val && String(val).toLowerCase().includes(lowerSearch));
    });
});

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
   { title: '買方確認', key: 'customerConfirmedAt', sortable: true },
   { title: '說明', key: 'description', sortable: false }, 
   { title: '人員', key: 'inspectorName', sortable: true }, 
   { title: '時間', key: 'createdAt', sortable: true }, 
   { title: '操作', key: 'actions', sortable: false },
  ];
    let finalHeaders = [...baseHeaders];

  if (!selectedUnit.value) {
    finalHeaders.splice(1, 0, { title: '戶別', key: 'unitId', sortable: true, width: '100px' });
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
  }
});

async function loadProjectStructure() { if (!props.projectId) return; isLoadingStructure.value = true; const result = await getProjectStructureFB(props.projectId); if (result.status === 'success') projectStructure.value = result.data; else console.error("載入建案結構失敗:", result.message); isLoadingStructure.value = false; }

async function loadData() {
  if (!props.projectId) {
      console.warn('[loadData] projectId is not yet available. Aborting load.'); 
      allRecords.value = []; 
      isLoadingRecords.value = false; 
      return; 
  }

  isLoadingRecords.value = true;
  allRecords.value = [];
  let result;
  try {
    if (showDeleted.value) {
      console.log(`Loading DELETED records for Project: ${props.projectId}`);
      result = await getDeletedInspectionRecordsForProjectFB(props.projectId);
    } else {
      if (selectedUnit.value) {
        console.log(`Loading ACTIVE records for Unit: ${props.projectId}/${selectedUnit.value}`);
        result = await getInspectionRecordsFB(props.projectId, selectedUnit.value);
      } else {
        console.log(`Loading ACTIVE records for Project: ${props.projectId}`);
        result = await getInspectionRecordsForProjectFB(props.projectId);
      }
    }

    if (result.status === 'success') {
      allRecords.value = result.data;
      console.log(`Loaded ${allRecords.value.length} records.`);
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

// ✅ START: 新增開始產製 PDF 的函式 (最終版)
async function startPdfGeneration() {
  if (!selectedBatchId.value || !inspectorNameForPdf.value) {
    alert('請選擇一個批次並確認產製人員名稱。');
    return;
  }

  showProcessingDialog.value = true;
  showGeneratePdfDialog.value = false;

  console.log('--- Trigger PDF Generation ---');
  console.log('Project ID:', props.projectId);
  console.log('Unit ID:', selectedUnit.value);
  console.log('Selected Batch ID:', selectedBatchId.value);
  console.log('Inspector Name:', inspectorNameForPdf.value);
  console.log('Triggering User Email:', userStore.user?.email || '未知');

  try {
    const payload = {
       projectId: props.projectId,
       unitId: selectedUnit.value,
       confirmationBatchId: selectedBatchId.value,
       inspectorName: inspectorNameForPdf.value,
       triggeringUserEmail: userStore.user?.email || null,
    };
    console.log('Calling generateInspectionPdf API with payload:', payload);

    // ✅ ***修改點: 實際呼叫 API***
    const result = await generateInspectionPdf(payload); // <--- 呼叫 API

    // 檢查後端是否按預期回傳 processing 狀態
    if (result.status !== 'processing') {
      throw new Error(result.message || '啟動 PDF 產製失敗，後端未回傳處理中狀態');
    }
    // ✅ ***修改點結束***

    console.log('後端 PDF 產製已觸發');

    // 提示用戶可以關閉視窗，後續會收到 Email
    // showProcessingDialog 會保持開啟，直到用戶手動關閉

  } catch (error) {
     console.error('觸發 PDF 產製失敗:', error);
     alert(`啟動報告產製失敗: ${error.message}`);
     // 出錯時關閉處理中提示
     closeProcessingDialog();
  }
  // 注意：這裡不再需要 finally isSaving=false，因為是背景處理
}
// ✅ END: 新增開始產製 PDF 的函式

// ✅ START: 新增關閉處理中提示的函式
function closeProcessingDialog() {
  showProcessingDialog.value = false;
}



function openAddDialog() { recordBeingEdited.value = null; showEditorDialog.value = true; }
function openEditDialog(record) { recordBeingEdited.value = record; showEditorDialog.value = true; }
function handleRecordSaved() { showEditorDialog.value = false; loadData(); }
function showImagePreview(url) { previewImageUrl.value = url; showPreviewDialog.value = true; }
function formatDate(dateString) { if (!dateString) return ''; try { return format(parseISO(dateString), 'yyyy/MM/dd', { locale: zhTW }); } catch (e) { return dateString; } }
function formatDateTime(dateString) { if (!dateString) return ''; try { return format(parseISO(dateString), 'yyyy/MM/dd HH:mm', { locale: zhTW }); } catch (e) { return dateString; } }
function openDeleteDialog(item) { recordToDelete.value = item; showDeleteDialog.value = true; }
async function confirmDeleteRecord() { if (!recordToDelete.value?.id) return; isDeleting.value = true; try { const result = await deleteInspectionRecordFB(recordToDelete.value.id); if (result.status === 'success') { allRecords.value = allRecords.value.filter(record => record.id !== recordToDelete.value.id); showDeleteDialog.value = false; alert('紀錄已移至資源回收桶。'); } else throw new Error(result.message || '刪除失敗'); } catch (error) { console.error("刪除紀錄時發生錯誤:", error); alert(`刪除失敗: ${error.message}`); } finally { isDeleting.value = false; recordToDelete.value = null; } }
function openRestoreDialog(item) { recordToRestore.value = item; showRestoreDialog.value = true; }
async function confirmRestoreRecord() { if (!recordToRestore.value?.id) return; isRestoring.value = true; try { const result = await restoreInspectionRecordFB(recordToRestore.value.id); if (result.status === 'success') { allRecords.value = allRecords.value.filter(record => record.id !== recordToRestore.value.id); showRestoreDialog.value = false; alert('紀錄已成功還原。'); } else throw new Error(result.message || '還原失敗'); } catch (error) { console.error("還原紀錄時發生錯誤:", error); alert(`還原失敗: ${error.message}`); } finally { isRestoring.value = false; recordToRestore.value = null; } }

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

async function handleDownloadExcel() {
  if (filteredRecords.value.length === 0) {
    alert('目前沒有可下載的資料。');
    return;
  }
  isDownloading.value = true;
  downloadingText.value = '正在準備 Excel 報告...';
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
      { header: '買方確認', key: 'confirmed', width: 14 },
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

    const records = filteredRecords.value;
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
    saveAs(blob, fileName);
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
  isDownloading.value = true;
  downloadingText.value = '正在準備 PDF 報告...';
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
    const records = filteredRecords.value;

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
    doc.save(`驗屋報告_${projectName.value}_${selectedUnit.value || '全案'}_${dateStr}.pdf`);
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

    for (let i = 0; i < batchRecords.length; i++) {
      downloadingText.value = `正在產生 PDF (${i + 1}/${batchRecords.length})...`;
      const record = batchRecords[i];
      const isTop = (i % 2 === 0);
      if (i > 0 && isTop) doc.addPage();

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

    const batchInfo = confirmedBatches.value.find(b => b.batchId === selectedBatchId.value);
    const dateStr = batchInfo ? batchInfo.dateString.replace(/\//g, '') : format(new Date(), 'yyyyMMdd');
    
    doc.save(`批次報告_${projectName.value}_${selectedUnit.value || '全案'}_${dateStr}.pdf`);
  } catch (error) {
    console.error('下載批次 PDF 失敗:', error);
    alert(`下載批次 PDF 失敗: ${error.message}`);
  } finally {
    isDownloading.value = false;
  }
}


</script>

<style scoped>
.cursor-pointer { cursor: pointer; } .record-card { transition: box-shadow 0.2s ease-in-out; } .record-card:hover { box-shadow: 0 4px 12px rgba(0,0,0,0.1); } .photo-strip .v-img { max-width: calc(20% - 4px); flex-basis: calc(20% - 4px); } .description-truncate { display: -webkit-box; -webkit-line-clamp: 2; line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; text-overflow: ellipsis; min-height: 1.5em; } .border-b { border-bottom: 1px solid rgba(0, 0, 0, 0.12); } .photo-overlay { position: absolute; top: 0; left: 0; width: 100%; height: 100%; background-color: rgba(0, 0, 0, 0.5); color: white; font-size: 0.9rem; font-weight: bold; } .position-relative { position: relative; } .deleted-card-look { opacity: 0.65; } .deleted-card-look .v-card-actions button { opacity: 1; pointer-events: auto; } .deleted-card-look .photo-strip .v-img { pointer-events: none; }

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
  min-height: 56px !important; /* 保留一個最小高度 (Vuetify 手機版預設值) */
}
/* ✓ 新增：手機版底部導覽列樣式 */
.mobile-btn-text {
  font-size: 0.7rem; /* 調整文字大小以適應按鈕 */
  margin-top: 2px;   /* 與圖標的間距 */
  line-height: 1.2;
}

/* ✓ 新增：中間 FAB 按鈕的樣式 (fixed) */
.mobile-fab {
  position: fixed;
  bottom: 28px; /* 調整 FAB 的垂直位置 (使其懸浮在 nav 之上) */
  left: 50%;
  transform: translateX(-50%);
  z-index: 10 !important; /* 確保在 v-bottom-navigation 之上 (nav 預設 z-index 8) */
}



/* ✓ 新增：強制 v-bottom-navigation 固定在底部 */
.mobile-bottom-nav {
  position: fixed !important; /* 強制 fixed 定位 */
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 8 !important; /* 確保 z-index 低於 FAB */
}

/* ✅ 可選：如果希望底部按鈕文字更小 */
.mobile-bottom-nav .v-btn .mobile-btn-text {
  font-size: 0.65rem; /* 再稍微縮小一點 */
}

/* ✅ 可選：為 QR Code 加上邊框和內距 */
.border.pa-1 {
  border: 1px solid #e0e0e0;
  padding: 4px;
  background-color: white; /* 確保背景是白色 */
}

.confirmed-record-bg {
  background-color: #f5f5f5 !important; /* 使用 !important 確保覆蓋 Vuetify 預設樣式 */
}

</style>