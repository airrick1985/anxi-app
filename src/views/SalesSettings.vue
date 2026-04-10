<template>
  <v-container>

      <v-row class="mb-4">
      <v-col>
        <v-btn
          @click="goBackToSalesControl"
          color="grey-darken-1"
          variant="outlined"
          prepend-icon="mdi-arrow-left"
        >
          返回銷控系統
        </v-btn>
      </v-col>
    </v-row>

    <v-row class="mb-4 align-center">
      <v-col>
        <div v-if="projectLoading">
          <v-skeleton-loader type="heading"></v-skeleton-loader>
        </div>
        <div v-else>
          <h1 class="text-h4 font-weight-bold text-grey-darken-3">
            {{ project ? project.name : '專案設定' }}
          </h1>
          <p class="text-grey-darken-1 mt-1">
            您正在管理此建案的後台設定
          </p>
        </div>
      </v-col>
    </v-row>
    
        <v-tabs density="compact"  v-model="tab" align-tabs="start" class="mb-4" bg-color="primary" grow >
      <v-tab value="settings">
        <v-icon start>mdi-cog</v-icon>
        建案設定
      </v-tab>
      <v-tab value="parameters">
        <v-icon start>mdi-palette</v-icon>
        銷控狀態參數
      </v-tab>
      <v-tab value="personnel">
        <v-icon start>mdi-account-group</v-icon>
        銷售人員管理
      </v-tab>
      <v-tab value="paymentTerms">
        <v-icon start>mdi-format-list-numbered</v-icon>
        期款設定
      </v-tab>
      <v-tab value="images">
        <v-icon start>mdi-image-multiple</v-icon>
        銷控圖片管理
      </v-tab>
      <v-tab value="svgs">
        <v-icon start>mdi-vector-square</v-icon>
        測量圖片管理
      </v-tab>
      <v-tab value="customForms">
        <v-icon start>mdi-form-select</v-icon>
        自訂表單
      </v-tab>
      <v-tab value="sync">
        <v-icon start>mdi-google-spreadsheet</v-icon>
        Google Sheet 同步銷控資料
      </v-tab>
      <v-tab value="aiAssistant">
        <v-icon start>mdi-robot-outline</v-icon>
        AI 助理設定
      </v-tab>
      <v-tab value="aiKnowledge">
        <v-icon start>mdi-brain</v-icon>
        AI 知識庫
      </v-tab>
    </v-tabs>

    <v-window v-model="tab">
      <v-window-item value="settings">
        <v-card class="pa-4" elevation="2">
          <v-card-title class="text-h5 text-primary">
            建案設定
          </v-card-title>
          <v-card-subtitle>管理建案的全域設定資訊</v-card-subtitle>
          <v-divider class="my-4"></v-divider>

          <v-skeleton-loader v-if="projectLoading" type="article"></v-skeleton-loader>

         <v-form v-if="!projectLoading && project" ref="projectForm">
            <v-text-field
              v-model="project.name"
              label="建案名稱"
              variant="outlined"
              density="compact"
              readonly
              class="mb-4"
            ></v-text-field>
            
            <!-- ✓ 移除：parkingSlideId_sales 欄位 -->
            
            <!-- ✓ 移除：parkingSlideId_quote 欄位 -->

            <v-text-field
              v-model="project.activityMessageSlideId"
              label="活動訊息簡報 ID"
              variant="outlined"
              density="compact"
              class="mb-4"
              persistent-hint
            ></v-text-field>

            <!-- ✓ 新增：付款表模板 ID 欄位 -->
            <v-text-field
              v-model="project.paymentScheduleTemplateId"
              label="付款表模板SHEET ID"
              variant="outlined"
              density="compact"
              class="mb-4"
              persistent-hint
              hint="用於「付款表設定」功能產製 Google Sheet 付款表時的模板。"
            ></v-text-field>

            <v-text-field
              v-model="project.paymentScheduleFolderUrl"
              label="付款表儲存位置"
              variant="outlined"
              density="compact"
              class="mb-4"
              persistent-hint
              hint="戶別付款表產出後儲存的 Google Drive 資料夾 URL。"
            ></v-text-field>

            <v-switch
              v-model="project.showPreferredPaymentInQuote"
              label="報價系統顯示「優付」欄位"
              color="primary"
              hide-details
              class="mb-4"
              inset
              hint="開啟後，報價系統將會顯示優付價格與相關標籤；關閉則完全隱藏。"
              persistent-hint
            ></v-switch>

            <v-divider class="my-4"></v-divider>
            <div class="mb-4">
              <p class="text-subtitle-1 mb-2">合約方式設定</p>
              <div class="mb-2">
                <v-chip
                  v-for="cType in project.contractTypes"
                  :key="cType"
                  class="mr-2 mb-2"
                  :closable="cType !== '一般合約'"
                  @click:close="removeContractType(cType)"
                  label
                >
                  {{ cType }}
                </v-chip>
              </div>
              <div class="d-flex align-center">
                <v-text-field
                  v-model="newContractType"
                  label="新增合約方式"
                  variant="outlined"
                  density="compact"
                  hide-details
                  @keydown.enter.prevent="addContractType"
                ></v-text-field>
                <v-btn
                  class="ml-2"
                  icon="mdi-plus"
                  color="primary"
                  @click="addContractType"
                  variant="tonal"
                ></v-btn>
              </div>
            </div>
            <v-btn
              color="primary"
              @click="saveProjectSettings"
              :loading="isSavingProject"
              block
              class="mt-4"
            >
              儲存專案設定
            </v-btn>
          </v-form>
        </v-card>
      </v-window-item>

      <v-window-item value="parameters">
        <v-card class="pa-4" elevation="2">
          <v-card-title class="text-h5 text-teal">
            銷控狀態參數
          </v-card-title>
          <v-card-subtitle>管理銷控狀態的顏色與排序</v-card-subtitle>
          <v-divider class="my-4"></v-divider>
          
          <v-skeleton-loader v-if="paramsLoading" type="list-item-two-line@4"></v-skeleton-loader>

          <div v-if="!paramsLoading">
            <v-list lines="two">
              <v-list-item
                v-for="param in salesParameters"
                :key="param.id"
                class="mb-2"
                elevation="1"
                border
              >
                <template v-slot:prepend>
                  <v-avatar :color="param.colorCode" size="36" class="mr-4 elevation-2"></v-avatar>
                </template>

                <v-list-item-title class="font-weight-bold">{{ param.statusName }}</v-list-item-title>
                <v-list-item-subtitle>
                  排序: {{ param.order }} | 色碼: {{ param.colorCode }}
                </v-list-item-subtitle>
                
                <template v-slot:append>
                  <v-btn icon="mdi-pencil" variant="text" size="small" @click="editParameter(param)"></v-btn>
                  <v-btn icon="mdi-delete" variant="text" color="error" size="small" @click="confirmDelete(param)"></v-btn>
                </template>
              </v-list-item>
            </v-list>

            <v-btn
              color="teal"
              @click="openParameterDialog()"
              prepend-icon="mdi-plus"
              class="mt-4"
              block
            >
              新增狀態
            </v-btn>
          </div>
        </v-card>
      </v-window-item>
      
       <v-window-item value="personnel">
        <v-card class="pa-4" elevation="2">
          <v-card-title class="text-h5 text-blue-darken-2">
            銷售人員管理
          </v-card-title>
          <v-card-subtitle>管理此建案的銷售人員資料 (可拖曳排序)</v-card-subtitle>
          <v-divider class="my-4"></v-divider>
          
          <v-skeleton-loader v-if="personnelLoading" type="list-item-two-line@5"></v-skeleton-loader>

          <div v-if="!personnelLoading">
            
            <v-list lines="two">
              <draggable 
                v-model="personnelList" 
                item-key="id" 
                handle=".drag-handle"
                @end="onPersonnelDragEnd"
              >
                <template #item="{ element: person }">
                  <v-list-item
                    class="mb-2"
                    elevation="1"
                    border
                  >
                    <template v-slot:prepend>
                      <v-icon class="drag-handle cursor-move mr-4 text-grey">mdi-drag</v-icon>
                      </template>

                    <v-list-item-title class="font-weight-bold">{{ person.name }}</v-list-item-title>
                    <v-list-item-subtitle>
                      {{ person.phone }} <span v-if="person.email">| {{ person.email }}</span>
                    </v-list-item-subtitle>

                    <div class="py-1">
                      <v-chip
                        v-for="pos in person.positions"
                        :key="pos"
                        size="small"
                        class="mr-2"
                        label
                      >
                        {{ pos }}
                      </v-chip>
                    </div>
                    
                    <template v-slot:append>
                      <v-btn icon="mdi-pencil" variant="text" size="small" @click="openPersonnelDialog(person)"></v-btn>
                      <v-btn icon="mdi-delete" variant="text" color="error" size="small" @click="confirmPersonnelDelete(person)"></v-btn>
                    </template>
                  </v-list-item>
                </template>
              </draggable>
            </v-list>

             <v-alert
              v-if="personnelList.length === 0"
              type="info"
              variant="tonal"
            >
              目前尚無銷售人員資料。
            </v-alert>

            <v-btn
              color="blue-darken-2"
              @click="openPersonnelDialog()"
              prepend-icon="mdi-plus"
              class="mt-4"
              block
            >
              新增銷售人員
            </v-btn>
          </div>
        </v-card>
      </v-window-item>

      <v-window-item value="paymentTerms">
        <PaymentTermsSettings />
      </v-window-item>

      <v-window-item value="images">
        <v-card class="pa-4" elevation="2">
          <v-card-title class="text-h5 text-indigo">
            <v-icon start>mdi-image-multiple</v-icon>
            銷控圖片管理
          </v-card-title>
          <v-card-subtitle>上傳並管理用於銷控系統的共用圖片 (例如：傢配圖、格局圖)
          </v-card-subtitle>
   
          <v-divider class="my-4"></v-divider>

          <v-row>
            <v-col cols="12" md="5">
              <v-file-input
                v-model="stagedFilesModel"
                label="點擊選擇圖片 (可多選)"
                variant="outlined"
                multiple
                accept="image/png, image/jpeg, image/webp"
                prepend-icon="mdi-camera"
                :loading="isReadingFiles"
                clearable
                chips
              ></v-file-input>
              <v-btn
                @click="uploadAllStagedFiles"
                :loading="isUploading"
                :disabled="stagedFiles.length === 0"
                color="green"
                block
                size="large"
                prepend-icon="mdi-upload"
              >
                上傳 {{ stagedFiles.length }} 個已選檔案
              </v-btn>
              <v-alert
                v-if="uploadErrors.length > 0"
                type="error"
                variant="tonal"
                class="mt-4"
                density="compact"
              >
                <p v-for="(error, i) in uploadErrors" :key="i">{{ error }}</p>
              </v-alert>
            </v-col>

            <v-col cols="12" md="7">
              <v-sheet
                border
                rounded="lg"
                class="pa-4"
                style="max-height: 400px; overflow-y: auto;"
                v-if="stagedFiles.length > 0"
              >
                <div v-for="(item, index) in stagedFiles" :key="item.id" class="mb-4">
                  <div class="d-flex align-start">
                    <v-avatar rounded="lg" size="80" class="mr-4 elevation-1">
                      <v-img :src="item.previewUrl" cover></v-img>
                    </v-avatar>
                    <div class="flex-grow-1">
                      <v-text-field
                        v-model="item.imageName"
                        label="圖片名稱"
                        variant="outlined"
                        density="compact"
                        hide-details="auto"
                        :disabled="item.useFilename"
                        :rules="[v => !item.useFilename ? !!v || '名稱為必填' : true]"
                      ></v-text-field>
                      <v-checkbox
                        v-model="item.useFilename"
                        label="使用原始檔名作為圖片名稱"
                        density="compact"
                        hide-details
                      ></v-checkbox>
                      <div class="text-caption text-grey mt-1">
                        {{ (item.file.size / 1024).toFixed(1) }} KB | {{ item.width }}x{{ item.height }}px
                      </div>
                      <v-alert
                        v-if="item.error"
                        type="warning"
                        variant="tonal"
                        density="compact"
                        class="mt-2 text-caption"
                      >
                        {{ item.error }}
                      </v-alert>
                    </div>
                    <v-btn
                      icon="mdi-close"
                      variant="text"
                      size="small"
                      @click="removeStagedFile(item.id)"
                    ></v-btn>
                  </div>
                  <v-divider v-if="index < stagedFiles.length - 1" class="mt-4"></v-divider>
                </div>
              </v-sheet>
              <v-sheet
                v-else
                border
                rounded="lg"
                class="pa-4 d-flex justify-center align-center text-center"
                height="100%"
                min-height="200"
              >
                <div class="text-grey">
                  <v-icon size="48">mdi-image-plus-outline</v-icon>
                  <p>請從左側選擇要上傳的圖片</p>
                </div>
              </v-sheet>
            </v-col>
          </v-row>

          <v-divider class="my-4"></v-divider>
          <h3 class="text-subtitle-1 mb-2">已上傳圖片列表</h3>
          
          <div v-if="!imagesLoading">
            <v-list v-if="salesImages.length > 0" lines="two">
              <v-list-item
                v-for="image in salesImages"
                :key="image.id"
                class="mb-2"
                elevation="1"
                border
              >
                <template v-slot:prepend>
                <v-avatar
                    rounded="lg"
                    size="64"
                    class="mr-4 elevation-1"
                    @click="openImageViewer(image)"
                    style="cursor: pointer;"
                  >
                    <v-img :src="`${image.downloadURL}?t=${image.updatedAt?.seconds}`" cover>
                    </v-img>
                </v-avatar>
              </template>

                <v-list-item-title class="font-weight-bold">{{ image.imageName }}</v-list-item-title>
                <v-list-item-subtitle>
                  檔名: {{ image.fileName }}
                  <span class="d-none d-sm-inline">
                    | {{ image.updatedAt && image.createdAt && image.updatedAt.seconds > image.createdAt.seconds ? '重新上傳於' : '上傳於' }}: 
                    {{ (image.updatedAt || image.createdAt) ? new Date((image.updatedAt || image.createdAt).seconds * 1000).toLocaleDateString() : 'N/A' }}
                  </span>
                </v-list-item-subtitle>
                
                <template v-slot:append>
                  <v-btn
                      icon="mdi-upload"
                      variant="text"
                      size="small"
                      title="重新上傳"
                      @click="triggerReupload(image)"
                    ></v-btn>
                    <v-btn
                      icon="mdi-delete"
                      variant="text"
                      color="error"
                      size="small"
                      title="刪除"
                      @click="confirmImageDelete(image)"
                    ></v-btn>
                  </template>
              </v-list-item>
            </v-list>
             
            <v-alert
              v-else
              type="info"
              variant="tonal"
              border="start"
              density="compact"
            >
              目前尚無圖片，請使用上方功能上傳。
            </v-alert>
          </div>

          <input
            type="file"
            ref="reuploadInput"
            @change="handleReuploadFile"
            accept="image/png, image/jpeg, image/webp"
            style="display: none"
          />
        </v-card>
      </v-window-item>
 <v-window-item value="svgs">
        <v-card class="pa-4" elevation="2">
          <v-card-title class="text-h5 text-deep-purple">
            <v-icon start>mdi-vector-square</v-icon>
            測量圖片管理 (戶別平面圖)
          </v-card-title>
          <v-card-subtitle>上傳並管理用於銷控系統的 SVG 向量圖檔，至少需要有一處標記500公分以上</v-card-subtitle>
   
          <v-divider class="my-4"></v-divider>
          
          <v-row>
            <v-col cols="12" md="5">
              <v-file-input
                v-model="stagedSvgFilesModel"
                label="點擊選擇 SVG 檔案 (可多選)"
                variant="outlined"
                multiple
                accept="image/svg+xml"
                prepend-icon="mdi-vector-polygon"
                :loading="isReadingSvgFiles"
                clearable
                chips
              ></v-file-input>
              <v-btn
                @click="uploadAllStagedSvgFiles"
                :loading="isUploadingSvg"
                :disabled="stagedSvgFiles.length === 0"
                color="green"
                block
                size="large"
                prepend-icon="mdi-upload"
              >
                上傳 {{ stagedSvgFiles.length }} 個已選檔案
              </v-btn>
              <v-alert
                v-if="svgUploadErrors.length > 0"
                type="error"
                variant="tonal"
                class="mt-4"
                density="compact"
              >
                <p v-for="(error, i) in svgUploadErrors" :key="i">{{ error }}</p>
              </v-alert>
            </v-col>

            <v-col cols="12" md="7">
              <v-sheet
                border
                rounded="lg"
                class="pa-4"
                style="max-height: 400px; overflow-y: auto;"
                v-if="stagedSvgFiles.length > 0"
              >
                <div v-for="(item, index) in stagedSvgFiles" :key="item.id" class="mb-4">
                  <div class="d-flex align-start">
                    <v-avatar rounded="lg" size="80" class="mr-4 elevation-1 pa-1" color="grey-lighten-3">
                      <v-img :src="item.previewUrl" contain></v-img>
                    </v-avatar>
                    <div class="flex-grow-1">
                      <v-text-field
                        v-model="item.svgName"
                        label="SVG 名稱 (戶別 ID)"
                        variant="outlined"
                        density="compact"
                        class="mb-2"
                        :rules="[v => !!v || '名稱為必填']"
                        hint="建議與檔名一致"
                      ></v-text-field>
                       <v-text-field
                        v-model="item.building"
                        label="棟別 (系統自動建議)"
                        variant="outlined"
                        density="compact"
                        class="mb-2"
                        :rules="[v => !!v || '棟別為必填']"
                        hint="可手動修改"
                      ></v-text-field>
                    </div>
                    <v-btn
                      icon="mdi-close"
                      variant="text"
                      size="small"
                      @click="removeStagedSvgFile(item.id)"
                    ></v-btn>
                  </div>
                  <v-divider v-if="index < stagedSvgFiles.length - 1" class="mt-4"></v-divider>
                </div>
              </v-sheet>
              <v-sheet
                v-else
                border
                rounded="lg"
                class="pa-4 d-flex justify-center align-center text-center"
                height="100%"
                min-height="200"
              >
                <div class="text-grey">
                  <v-icon size="48">mdi-vector-square-plus</v-icon>
                  <p>請從左側選擇要上傳的 SVG 檔案</p>
                </div>
              </v-sheet>
            </v-col>
          </v-row>

          <v-divider class="my-4"></v-divider>

          <h3 class="text-subtitle-1 mb-2">已上傳 SVG 列表</h3>
          
         <div v-if="!svgBuildingsLoading">
            <div class="d-flex align-center mb-4 ga-2">
              <v-text-field
                v-model="svgSearchQuery"
                label="搜尋棟別"
                variant="outlined"
                density="compact"
                prepend-inner-icon="mdi-magnify"
                clearable
                hide-details
                class="flex-grow-1"
              ></v-text-field>
              <v-btn
                :disabled="selectedSvgs.length === 0"
                color="error"
                variant="tonal"
                prepend-icon="mdi-delete-sweep"
                @click="confirmBatchDelete"
              >
                刪除已選 ({{ selectedSvgs.length }})
              </v-btn>
            </div>
            <v-expansion-panels v-if="filteredSvgBuildings.length > 0" v-model="expandedBuildingPanel">
              <v-expansion-panel
                v-for="building in filteredSvgBuildings"
                :key="building"
                :title="`${building} 棟`"
                :value="building"
              >
                <v-expansion-panel-text>
                  <div v-if="loadedSvgs[building] && loadedSvgs[building].length > 0">
                    <v-checkbox
                      :model-value="isAllSelectedInBuilding(building)"
                      :indeterminate="isIndeterminateInBuilding(building)"
                      :label="`全選 ${building} 棟`"
                      @click="toggleSelectAllInBuilding(building)"
                      density="compact"
                      hide-details
                      class="mb-2"
                    ></v-checkbox>
                    <v-divider></v-divider>
                  </div>
                  <v-list lines="two">
                    <v-list-item
                      v-for="svg in loadedSvgs[building]"
                      :key="svg.id"
                      class="mb-2"
                      elevation="1"
                      border
                    >
                      <template v-slot:prepend>
                        <v-checkbox-btn v-model="selectedSvgs" :value="svg.id" class="mr-n2"></v-checkbox-btn>
                        <v-avatar rounded="lg" size="64" class="mr-4 ml-2 elevation-1 pa-1" color="grey-lighten-4">
                            <v-img :src="`${svg.downloadURL}?t=${svg.updatedAt?.seconds}`" contain></v-img>
                        </v-avatar>
                      </template>
                      <v-list-item-title class="font-weight-bold">{{ svg.svgName }}</v-list-item-title>
                      <v-list-item-subtitle>
                        檔名: {{ svg.fileName }}
                      </v-list-item-subtitle>
                      <template v-slot:append>
                        <v-btn
                          icon="mdi-delete"
                          variant="text"
                          color="error"
                          size="small"
                          title="刪除"
                          @click="confirmSvgDelete(svg)"
                        ></v-btn>
                      </template>
                    </v-list-item>
                  </v-list>
                </v-expansion-panel-text>
              </v-expansion-panel>
            </v-expansion-panels>
            
            <v-alert
              v-else
              type="info"
              variant="tonal"
              border="start"
              density="compact"
            >
              目前尚無 SVG 檔案，請使用上方功能上傳。
            </v-alert>
          </div>
          <v-skeleton-loader v-else type="article"></v-skeleton-loader>
        </v-card>
      </v-window-item>

      <v-window-item value="customForms">
        <v-card class="pa-4" elevation="2">
          <CustomFormManager :projectId="projectId" />
        </v-card>
      </v-window-item>

      <v-window-item value="sync">
        <v-card class="pa-4" elevation="2">
          <v-card-title class="text-h5 text-green-darken-2">
            <v-icon start>mdi-google-spreadsheet</v-icon>
            銷控資料同步
          </v-card-title>
          <v-card-subtitle>
            設定並同步銷控資料到 Google Sheet。系統將自動監聽資料變更並即時更新。
          </v-card-subtitle>
          <v-divider class="my-4"></v-divider>

          <v-skeleton-loader v-if="projectLoading" type="article"></v-skeleton-loader>
          
          <div v-else>
            <v-alert
              type="info"
              variant="tonal"
              class="mb-4"
              density="compact"
              icon="mdi-information"
            >
              設定完成後，銷控資料的任何變更（如狀態、價格、買方資訊等）將自動同步至指定的 Google Sheet。
            </v-alert>

            <v-form ref="syncForm" @submit.prevent>
              <v-row>
                <v-col cols="12" md="8">
                  <v-text-field
                    v-model="googleSheetForm.url"
                    label="Google Sheet 網址或 ID"
                    placeholder="https://docs.google.com/spreadsheets/d/..."
                    variant="outlined"
                    density="comfortable"
                    :rules="[v => !!v || '請輸入 Google Sheet 網址']"
                    prepend-inner-icon="mdi-link"
                    clearable
                  ></v-text-field>
                </v-col>
                <v-col cols="12" md="4" class="d-flex align-center">
                  <v-btn
                    color="primary"
                    prepend-icon="mdi-refresh"
                    :loading="loadingSheets"
                    :disabled="!googleSheetForm.url"
                    @click="fetchSheetNames"
                  >
                    讀取工作表
                  </v-btn>
                </v-col>

                <!-- 显示 Service Account Email 提示 -->
                <v-col cols="12" v-if="serviceAccountEmail">
                  <v-alert
                    type="info"
                    variant="tonal"
                    class="mb-4"
                    border="start"
                    closable
                  >
                    <template v-slot:title>
                      請共用權限給機器人
                    </template>
                    為了讓系統能寫入資料，請將您的 Google Sheet 共用給以下 Email (編輯者權限)：
                    <div class="d-flex align-center mt-2 bg-grey-lighten-4 pa-2 rounded">
                      <code class="text-subtitle-1 flex-grow-1">{{ serviceAccountEmail }}</code>
                      <v-btn
                        size="small"
                        variant="text"
                        icon="mdi-content-copy"
                        @click="copyToClipboard(serviceAccountEmail)"
                        v-tooltip="'複製 Email'"
                      ></v-btn>
                    </div>
                  </v-alert>
                </v-col>

              </v-row>

              <v-expand-transition>
                <div v-if="sheetNames.length > 0">
                  <v-autocomplete
                    v-model="googleSheetForm.sheetName"
                    :items="sheetNames"
                    label="選擇要同步的工作表 (Tab)"
                    variant="outlined"
                    density="comfortable"
                    prepend-inner-icon="mdi-table"
                    :rules="[v => !!v || '請選擇工作表']"
                    class="mt-2"
                  ></v-autocomplete>

                  <v-card-actions class="px-0 mt-4">
                     <v-btn
                      color="success"
                      size="large"
                      prepend-icon="mdi-cloud-sync"
                      variant="elevated"
                      :loading="isSyncing"
                      @click="executeSync"
                      :disabled="!googleSheetForm.sheetName"
                    >
                      開始全量同步與儲存設定
                    </v-btn>
                  </v-card-actions>
                </div>
              </v-expand-transition>
              
              <v-alert v-if="syncResult" :type="syncResult.type" class="mt-4" variant="tonal">
                {{ syncResult.message }}
              </v-alert>

            </v-form>
            
            <div class="mt-6 text-caption text-grey">
               <p class="font-weight-bold mb-1">注意事項：</p>
               <ol class="pl-4">
                 <li>請確保您輸入的 Google Sheet 已共用編輯權限給系統帳號 (Agent Email)。</li>
                 <li>全量同步將會<b>清除並覆蓋</b>該工作表的所有內容，請謹慎操作。</li>
                 <li>首次同步後，系統即會自動啟動即時同步功能。</li>
               </ol>
            </div>
          </div>
        </v-card>
      </v-window-item>

      <v-window-item value="aiAssistant">
        <v-card class="pa-4" elevation="2">
          <v-card-title class="text-h5 text-purple">
            <v-icon start>mdi-robot-outline</v-icon>
            AI 助理設定
          </v-card-title>
          <v-card-subtitle>管理 AI 銷售助理的 Token 額度與使用狀況</v-card-subtitle>
          <v-divider class="my-4"></v-divider>

          <v-skeleton-loader v-if="projectLoading" type="article"></v-skeleton-loader>

          <v-form v-if="!projectLoading && project" ref="aiForm">
            <v-row>
              <v-col cols="12" md="6">
                <v-text-field
                  v-model.number="project.aiTokenQuota"
                  label="Token 額度上限"
                  type="number"
                  variant="outlined"
                  density="compact"
                  hint="設定該建案可使用的 AI Token 上限 (預設 0 表示停用)"
                  persistent-hint
                ></v-text-field>
              </v-col>
              <v-col cols="12" md="6">
                <v-card variant="outlined" class="pa-3 bg-grey-lighten-4 d-flex align-center justify-space-between">
                  <div>
                    <div class="text-caption text-grey-darken-1">目前已使用 Token</div>
                    <div class="text-h6 font-weight-bold text-primary">{{ project.aiTokenUsed || 0 }}</div>
                  </div>
                  <v-btn 
                    color="warning" 
                    variant="tonal" 
                    prepend-icon="mdi-refresh" 
                    @click="resetAIToken" 
                    :loading="isResettingToken"
                  >
                    重置為 0
                  </v-btn>
                </v-card>
              </v-col>
            </v-row>
            <v-btn
              color="primary"
              @click="saveProjectSettings"
              :loading="isSavingProject"
              block
              class="mt-6"
              prepend-icon="mdi-content-save"
            >
              儲存 AI 設定
            </v-btn>
          </v-form>
        </v-card>
      </v-window-item>

      <v-window-item value="aiKnowledge">
        <v-card class="pa-4" elevation="2">
          <v-card-title class="text-h5 text-blue">
            <v-icon start>mdi-brain</v-icon>
            AI 知識庫
          </v-card-title>
          <v-card-subtitle>提供建案產品知識，讓 AI 在分析客戶互動時生成更準確的建議</v-card-subtitle>
          <v-divider class="my-4"></v-divider>

          <v-skeleton-loader v-if="projectLoading" type="article"></v-skeleton-loader>

          <v-form v-if="!projectLoading && project" ref="knowledgeForm">
            <!-- 建案基本資訊 -->
            <v-card class="mb-4" variant="outlined">
              <v-card-title class="text-subtitle-1 bg-blue-lighten-5">🏢 建案基本資訊</v-card-title>
              <v-card-text class="pt-4">
                <v-row>
                  <v-col cols="12">
                    <v-text-field
                      v-model="project.projectKnowledge.address"
                      label="建案地址"
                      variant="outlined"
                      density="compact"
                      hint="完整地址（含行政區）"
                      persistent-hint
                      class="mb-4"
                    ></v-text-field>
                  </v-col>
                </v-row>
                <v-row>
                  <v-col cols="12" md="6">
                    <v-select
                      v-model="project.projectKnowledge.projectType"
                      label="建案類型"
                      :items="['純住宅', '住商混合', '商辦', '其他']"
                      variant="outlined"
                      density="compact"
                      class="mb-4"
                    ></v-select>
                  </v-col>
                  <v-col cols="12" md="6">
                    <v-text-field
                      v-model.number="project.projectKnowledge.totalUnits"
                      label="總戶數"
                      type="number"
                      variant="outlined"
                      density="compact"
                      class="mb-4"
                    ></v-text-field>
                  </v-col>
                </v-row>
                <v-row>
                  <v-col cols="12" md="6">
                    <v-text-field
                      v-model="project.projectKnowledge.totalFloors"
                      label="樓層/棟數說明"
                      variant="outlined"
                      density="compact"
                      placeholder="如：地上28層 2棟"
                      class="mb-4"
                    ></v-text-field>
                  </v-col>
                  <v-col cols="12" md="6">
                    <v-text-field
                      v-model="project.projectKnowledge.deliveryDate"
                      label="預估交屋時間"
                      variant="outlined"
                      density="compact"
                      placeholder="如：2027年Q2"
                      class="mb-4"
                    ></v-text-field>
                  </v-col>
                </v-row>
              </v-card-text>
            </v-card>

            <!-- 核心賣點 -->
            <v-card class="mb-4" variant="outlined">
              <v-card-title class="text-subtitle-1 bg-orange-lighten-5">⭐ 核心賣點</v-card-title>
              <v-card-text class="pt-4">
                <v-textarea
                  v-model="project.projectKnowledge.locationAdvantage"
                  label="地段優勢"
                  variant="outlined"
                  density="compact"
                  rows="3"
                  class="mb-4"
                  hint="地理位置、交通便利性等"
                  persistent-hint
                ></v-textarea>
                <v-textarea
                  v-model="project.projectKnowledge.architectureFeature"
                  label="建築特色"
                  variant="outlined"
                  density="compact"
                  rows="3"
                  class="mb-4"
                  hint="建材、建商、設計師等"
                  persistent-hint
                ></v-textarea>
                <v-textarea
                  v-model="project.projectKnowledge.communityFacilities"
                  label="社區設施"
                  variant="outlined"
                  density="compact"
                  rows="2"
                  class="mb-4"
                  hint="健身房、泳池、閱覽室等"
                  persistent-hint
                ></v-textarea>
                <v-textarea
                  v-model="project.projectKnowledge.surroundingAmenities"
                  label="周邊生活機能"
                  variant="outlined"
                  density="compact"
                  rows="2"
                  hint="學校、捷運、商圈、醫院等"
                  persistent-hint
                ></v-textarea>
              </v-card-text>
            </v-card>

            <!-- 戶型與價格 -->
            <v-card class="mb-4" variant="outlined">
              <v-card-title class="text-subtitle-1 bg-green-lighten-5">💰 戶型與價格</v-card-title>
              <v-card-text class="pt-4">
                <v-row>
                  <v-col cols="12" md="6">
                    <v-text-field
                      v-model="project.projectKnowledge.mainAreaRange"
                      label="主力坪數範圍"
                      variant="outlined"
                      density="compact"
                      placeholder="如：35～55坪"
                      class="mb-4"
                    ></v-text-field>
                  </v-col>
                  <v-col cols="12" md="6">
                    <v-text-field
                      v-model="project.projectKnowledge.priceRange"
                      label="主力總價範圍"
                      variant="outlined"
                      density="compact"
                      placeholder="如：1,500～2,500萬"
                      class="mb-4"
                    ></v-text-field>
                  </v-col>
                </v-row>
                <v-textarea
                  v-model="project.projectKnowledge.specialUnits"
                  label="特殊戶型說明"
                  variant="outlined"
                  density="compact"
                  rows="2"
                  hint="頂樓、邊間等特殊戶型"
                  persistent-hint
                ></v-textarea>
              </v-card-text>
            </v-card>

            <!-- 目標客群 -->
            <v-card class="mb-4" variant="outlined">
              <v-card-title class="text-subtitle-1 bg-purple-lighten-5">👥 目標客群</v-card-title>
              <v-card-text class="pt-4">
                <v-row>
                  <v-col cols="12" md="6">
                    <v-text-field
                      v-model="project.projectKnowledge.primaryAudience"
                      label="主力客群"
                      variant="outlined"
                      density="compact"
                      placeholder="如：換屋自住家庭（35-50歲）"
                      class="mb-4"
                    ></v-text-field>
                  </v-col>
                  <v-col cols="12" md="6">
                    <v-text-field
                      v-model="project.projectKnowledge.secondaryAudience"
                      label="次要客群"
                      variant="outlined"
                      density="compact"
                      placeholder="如：投資置產族"
                      class="mb-4"
                    ></v-text-field>
                  </v-col>
                </v-row>
              </v-card-text>
            </v-card>

            <!-- 常見問題 FAQ -->
            <v-card class="mb-4" variant="outlined">
              <v-card-title class="text-subtitle-1 bg-indigo-lighten-5">❓ 常見問題（FAQ）</v-card-title>
              <v-card-subtitle class="text-caption">最多設定 10 條常見問題</v-card-subtitle>
              <v-card-text class="pt-4">
                <div v-if="!project.projectKnowledge.faqs">
                  <p class="text-caption text-grey-darken-1">尚未設定常見問題</p>
                </div>
                <div v-for="(faq, index) in project.projectKnowledge.faqs" :key="index" class="mb-4">
                  <div class="d-flex align-center justify-space-between mb-2">
                    <strong class="text-caption">問題 {{ index + 1 }}</strong>
                    <v-btn
                      icon="mdi-delete"
                      size="x-small"
                      variant="text"
                      @click="removeFaq(index)"
                    ></v-btn>
                  </div>
                  <v-text-field
                    v-model="faq.question"
                    label="提問"
                    variant="outlined"
                    density="compact"
                    class="mb-2"
                  ></v-text-field>
                  <v-textarea
                    v-model="faq.answer"
                    label="標準回覆"
                    variant="outlined"
                    density="compact"
                    rows="2"
                  ></v-textarea>
                </div>
                <v-btn
                  v-if="!project.projectKnowledge.faqs || project.projectKnowledge.faqs.length < 10"
                  prepend-icon="mdi-plus"
                  variant="outlined"
                  @click="addFaq"
                  class="mt-2"
                >
                  新增問題
                </v-btn>
              </v-card-text>
            </v-card>

            <!-- 當前銷售策略 -->
            <v-card class="mb-4" variant="outlined">
              <v-card-title class="text-subtitle-1 bg-red-lighten-5">🎯 當前銷售策略</v-card-title>
              <v-card-text class="pt-4">
                <v-textarea
                  v-model="project.projectKnowledge.currentPromotion"
                  label="當前主打優惠"
                  variant="outlined"
                  density="compact"
                  rows="2"
                  class="mb-4"
                  hint="本月優惠、簽約贈品等"
                  persistent-hint
                ></v-textarea>
                <v-textarea
                  v-model="project.projectKnowledge.salesFocus"
                  label="當前主要銷售目標"
                  variant="outlined"
                  density="compact"
                  rows="2"
                  class="mb-4"
                  hint="推哪幾戶、衝業績目標等"
                  persistent-hint
                ></v-textarea>
                <v-textarea
                  v-model="project.projectKnowledge.competitorNotes"
                  label="與競品的比較優勢"
                  variant="outlined"
                  density="compact"
                  rows="2"
                  hint="相比周邊競品的優勢"
                  persistent-hint
                ></v-textarea>
              </v-card-text>
            </v-card>

            <!-- 更新時間 -->
            <div v-if="project.projectKnowledge.updatedAt" class="text-caption text-grey-darken-1 mb-4">
              最後更新：{{ formatDate(project.projectKnowledge.updatedAt) }}
            </div>

            <v-btn
              color="primary"
              @click="saveProjectSettings"
              :loading="isSavingProject"
              block
              class="mt-6"
              prepend-icon="mdi-content-save"
            >
              儲存知識庫
            </v-btn>
          </v-form>
        </v-card>
      </v-window-item>
    </v-window>

        <v-dialog v-model="deleteBatchSvgDialog" persistent max-width="500px">
      </v-dialog>

    <v-dialog v-model="deleteSvgDialog" persistent max-width="450px">
      <v-card>
        <v-card-title class="text-h6 d-flex align-center bg-red-lighten-4">
          <v-icon start color="red-darken-2">mdi-alert-circle-outline</v-icon>
          確認刪除 SVG
        </v-card-title>
        <v-card-text class="pt-4">
          您確定要刪除 SVG
          <strong class="text-red-darken-2 mx-1">「{{ svgToDelete.svgName }}」</strong>
          嗎？
          <br><br>
          此操作將會從資料庫和儲存空間中永久移除檔案，無法復原。
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="grey" text @click="deleteSvgDialog = false">取消</v-btn>
          <v-btn color="error" text @click="executeSvgDelete" :loading="isDeletingSvg">
            確認刪除
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="parameterDialog" persistent max-width="500px">
      </v-dialog>

    <v-dialog v-model="deleteBatchSvgDialog" persistent max-width="500px">
      <v-card>
        <v-card-title class="text-h6 d-flex align-center bg-red-lighten-4">
          <v-icon start color="red-darken-2">mdi-alert-circle-outline</v-icon>
          確認批次刪除
        </v-card-title>
        <v-card-text class="pt-4">
          您確定要永久刪除已勾選的
          <strong class="text-red-darken-2 mx-1">{{ selectedSvgs.length }}</strong>
          個 SVG 檔案嗎？
          <br><br>
          此操作將無法復原。
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="grey" text @click="deleteBatchSvgDialog = false">取消</v-btn>
          <v-btn color="error" text @click="executeBatchDelete" :loading="isDeletingBatchSvg">
            確認刪除
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="parameterDialog" persistent max-width="500px">
  <v-card>
    <v-card-title class="bg-primary text-white">
      <span class="text-h5">{{ editingParameter.id ? '編輯' : '新增' }}銷控狀態</span>
    </v-card-title>
    
    <v-card-text class="pt-4">
      <v-form ref="parameterForm">
        <v-text-field
          v-model="editingParameter.statusName"
          label="狀態名稱"
          variant="outlined"
          density="compact"
          :rules="[v => !!v || '此為必填欄位']"
          required
          class="mb-4"
        ></v-text-field>

        <div class="mb-4">
          <p class="text-subtitle-1 mb-2">狀態顏色</p>
          <v-color-picker
            v-model="editingParameter.colorCode"
            show-swatches
            swatches-max-height="100"
            hide-inputs
            width="100%"
            elevation="1"
          ></v-color-picker>
            <v-text-field
              v-model="editingParameter.colorCode"
              label="色碼 (Hex)"
              variant="outlined"
              density="compact"
              class="mt-2"
              :rules="[v => !!v || '此為必填欄位']"
              required
            >
            <template v-slot:prepend-inner>
                <div 
                    :style="{ 
                        backgroundColor: editingParameter.colorCode, 
                        width: '24px', 
                        height: '24px',
                        borderRadius: '4px',
                        border: '1px solid #ccc',
                        cursor: 'pointer'
                    }"
                 ></div>
            </template>
           </v-text-field>
        </div>

        <v-text-field
          v-model.number="editingParameter.order"
          label="排序"
          type="number"
          variant="outlined"
          density="compact"
          :rules="[v => v !== null && v !== '' || '此為必填欄位']"
          required
        >
    </v-text-field>
      </v-form>
    </v-card-text>
    
    <v-divider></v-divider>

    <v-card-actions>
      <v-spacer></v-spacer>
      <v-btn color="grey" variant="text" @click="closeParameterDialog">取消</v-btn>
      <v-btn color="primary" variant="flat" @click="saveParameter" :loading="isSavingParameter">儲存</v-btn>
    </v-card-actions>
  </v-card>
</v-dialog>

    <v-dialog v-model="deleteDialog" persistent max-width="400px">
        <v-card>
            <v-card-title class="text-h6 d-flex align-center bg-red-lighten-4">
          <v-icon start color="red-darken-2">mdi-alert-circle-outline</v-icon>
          確認刪除
        </v-card-title>
            <v-card-text>
                您確定要刪除「{{ parameterToDelete.statusName }}」這個銷控狀態嗎？此操作無法復原。
            </v-card-text>
            <v-card-actions>
                <v-spacer></v-spacer>
                <v-btn color="grey" text @click="deleteDialog = false">取消</v-btn>
                <v-btn color="error" text @click="executeDelete" :loading="isDeleting">確認刪除</v-btn>
            </v-card-actions>
        </v-card>
    </v-dialog>
     <v-dialog v-model="personnelDialog" persistent max-width="500px">
      <SalesPersonnelForm
        v-model="editingPersonnel"
        :loading="isSavingPersonnel"
        @cancel="closePersonnelDialog"
        @save="savePersonnel"
      />
    </v-dialog>

    <v-dialog v-model="deletePersonnelDialog" persistent max-width="400px">
        <v-card>
            <v-card-title class="text-h6 d-flex align-center bg-red-lighten-4">
              <v-icon start color="red-darken-2">mdi-alert-circle-outline</v-icon>
              確認刪除
            </v-card-title>
            <v-card-text>
                您確定要刪除「{{ personnelToDelete.name }}」嗎？此操作無法復原。
            </v-card-text>
            <v-card-actions>
                <v-spacer></v-spacer>
                <v-btn color="grey" text @click="deletePersonnelDialog = false">取消</v-btn>
                <v-btn color="error" text @click="executePersonnelDelete" :loading="isDeletingPersonnel">確認刪除</v-btn>
            </v-card-actions>
        </v-card>
    </v-dialog>

    <v-snackbar v-model="snackbar.show" :color="snackbar.color" :timeout="3000">
        {{ snackbar.text }}
    </v-snackbar>

    <v-dialog v-model="deleteImageDialog" persistent max-width="450px">
      <v-card>
        <v-card-title class="text-h6 d-flex align-center bg-red-lighten-4">
          <v-icon start color="red-darken-2">mdi-alert-circle-outline</v-icon>
          確認刪除圖片
        </v-card-title>
        <v-card-text class="pt-4">
          您確定要刪除圖片
          <strong class="text-red-darken-2 mx-1">「{{ imageToDelete.imageName }}」</strong>
          嗎？
          <br>
          <br>
          此操作將會從資料庫和儲存空間中永久移除檔案，無法復原。
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="grey" text @click="deleteImageDialog = false">取消</v-btn>
          <v-btn color="error" text @click="executeImageDelete" :loading="isDeletingImage">
            確認刪除
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

     <v-dialog
      v-model="imageViewerDialog"
      max-width="90vw"
      max-height="90vh"
    >
      <v-card class="d-flex flex-column">
        <v-toolbar density="compact" color="primary" dark>
          <v-toolbar-title class="text-white">{{ viewingImage?.imageName }}</v-toolbar-title>
          <v-spacer></v-spacer>
          <v-btn icon @click="imageViewerDialog = false" class="text-white">
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </v-toolbar>
        <div class="flex-grow-1 d-flex justify-center align-center pa-2" style="background-color: rgba(0,0,0,0.7);">
        <v-img
          v-if="viewingImage"
          :src="`${viewingImage.downloadURL}?t=${viewingImage.updatedAt?.seconds}`"
          contain
          max-height="calc(90vh - 48px)"
          max-width="90vw"
        ></v-img>
      </div>
      </v-card>
    </v-dialog>
    
  </v-container>
</template>

<script setup>
import { ref, reactive, onMounted, onUnmounted, computed, watch, nextTick, defineAsyncComponent } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import draggable from 'vuedraggable';
import { useToast } from 'vue-toastification';
import {
  getProjectSettings, 
  updateProjectSalesSettings, 
  listenToSalesParameters,
  addSalesParameter,
  updateSalesParameter,
  deleteSalesParameter,
  listenToSalesImages,
  uploadSalesImage,
  setSalesImageMetadata,
  deleteSalesImage,
   getUniqueSvgBuildings,
  listenToSvgsByBuilding,
  uploadSalesSvgViaFunction,
  setSalesSvgMetadata,
  deleteSalesSvgViaFunction,
  batchDeleteSalesSvgsViaFunction, 
  listenToSalesPersonnel,
  setSalesPersonnel,
  updateSalesPersonnel,
  deleteSalesPersonnel,
  updateSalesPersonnelOrders,
  listGoogleSheets, // ✅ 新增
  syncSalesHouseholdsToSheet, // ✅ 新增
} from '@/api';
import { serverTimestamp } from 'firebase/firestore';
import PaymentTermsSettings from './PaymentTermsSettings.vue'; 


const SalesPersonnelForm = defineAsyncComponent(() => import('./SalesPersonnelForm.vue'));

const route = useRoute();
const router = useRouter(); 
const toast = useToast();
const projectId = ref(route.params.projectId);


const tab = ref('settings');

// ✅ 6. 新增銷售人員管理的 State
const personnelList = ref([]);
const personnelLoading = ref(true);
let unsubscribePersonnel = null;
const personnelDialog = ref(false);
const editingPersonnel = ref({});
const isSavingPersonnel = ref(false);
const deletePersonnelDialog = ref(false);
const personnelToDelete = ref({});
const isDeletingPersonnel = ref(false);



// Project Settings State
const project = ref(null);
const projectLoading = ref(true);
const isSavingProject = ref(false);
const newContractType = ref('');


// Sales Parameters State
const salesParameters = ref([]);
const paramsLoading = ref(true);
let unsubscribeParams = null;

// Dialog State
const parameterDialog = ref(false);
const editingParameter = ref({});
const isSavingParameter = ref(false);
const parameterForm = ref(null);

// Delete Confirmation State
const deleteDialog = ref(false);
const parameterToDelete = ref({});
const isDeleting = ref(false);

// Snackbar State
const snackbar = ref({ show: false, text: '', color: 'success' });

//  Image Management State
const salesImages = ref([]);
const imagesLoading = ref(true);
let unsubscribeImages = null;
const deleteImageDialog = ref(false);
const imageToDelete = ref({});
const isDeletingImage = ref(false);
const stagedFilesModel = ref([]); 
const stagedFiles = ref([]); 
const isReadingFiles = ref(false); 
const isUploading = ref(false);
const uploadErrors = ref([]); 
const reuploadInput = ref(null); 
const reuploadTarget = ref(null); 
const isReuploading = ref(false); 
const imageViewerDialog = ref(false);
const viewingImage = ref(null); 

// ✅ START: Google Sheet Sync State
const googleSheetForm = reactive({
  url: '',
  sheetName: '',
});
const sheetNames = ref([]);
const loadingSheets = ref(false);
const isSyncing = ref(false);
const syncResult = ref(null);
const serviceAccountEmail = ref(''); // Store the service account email
// ✅ END: Google Sheet Sync State 

// ✅ START: AI Assistant State
const isResettingToken = ref(false);
// ✅ END: AI Assistant State


// --- Methods ---

const goBackToSalesControl = () => {
  if (projectId.value) {
    router.push({
      name: 'SalesControlSystem',
      params: {
        projectName: projectId.value
      }
    });
  }
};

const loadProjectSettings = async () => {
  projectLoading.value = true;
  try {
    project.value = await getProjectSettings(projectId.value);
    
    // 處理合約方式預設值
    if (project.value && (!project.value.contractTypes || !Array.isArray(project.value.contractTypes))) {
      project.value.contractTypes = ['一般合約'];
    } else if (project.value) {
      const uniqueTypes = new Set(['一般合約', ...project.value.contractTypes]);
      project.value.contractTypes = Array.from(uniqueTypes);
    }

    // ✅ [新增] 初始化「報價系統顯示優付」欄位，預設為 false
    if (project.value && project.value.showPreferredPaymentInQuote === undefined) {
        project.value.showPreferredPaymentInQuote = false;
    }

    // ✅ [新增] 初始化 Google Sheet Sync 表單
    if (project.value) {
      if (project.value.salesSheetUrl) {
        googleSheetForm.url = project.value.salesSheetUrl;
      } else if (project.value.salesSheetId) {
        // Fallback: 如果只有 ID，嘗試組合成 URL (為了顯示方便)
        googleSheetForm.url = `https://docs.google.com/spreadsheets/d/${project.value.salesSheetId}`;
      }

      if (project.value.salesSheetTabName) {
        googleSheetForm.sheetName = project.value.salesSheetTabName;
      }
    }

    // ✅ [新增] 初始化 AI 知識庫欄位
    if (project.value) {
      if (!project.value.projectKnowledge) {
        project.value.projectKnowledge = {
          address: '',
          projectType: '',
          totalUnits: null,
          totalFloors: '',
          deliveryDate: '',
          locationAdvantage: '',
          architectureFeature: '',
          communityFacilities: '',
          surroundingAmenities: '',
          mainAreaRange: '',
          priceRange: '',
          specialUnits: '',
          primaryAudience: '',
          secondaryAudience: '',
          faqs: [],
          currentPromotion: '',
          salesFocus: '',
          competitorNotes: '',
          updatedAt: null
        };
      } else if (!project.value.projectKnowledge.faqs) {
        project.value.projectKnowledge.faqs = [];
      }
    }

  } catch (error) {
    toast.error(`載入專案設定失敗: ${error.message}`);
  } finally {
    projectLoading.value = false;
  }
};

const saveProjectSettings = async () => {
  isSavingProject.value = true;
  try {
    const { id, ...dataToUpdate } = project.value;
    // 更新知識庫的 updatedAt 時間戳
    if (dataToUpdate.projectKnowledge) {
      dataToUpdate.projectKnowledge.updatedAt = serverTimestamp();
    }
    await updateProjectSalesSettings(id, dataToUpdate);
    toast.success('專案設定已成功儲存！');
  } catch (error) {
    toast.error(`儲存專案設定失敗: ${error.message}`);
  } finally {
    isSavingProject.value = false;
  }
};

/**
 * 移除 FAQ
 */
const removeFaq = (index) => {
  if (project.value?.projectKnowledge?.faqs) {
    project.value.projectKnowledge.faqs.splice(index, 1);
  }
};

/**
 * 新增 FAQ
 */
const addFaq = () => {
  if (!project.value.projectKnowledge.faqs) {
    project.value.projectKnowledge.faqs = [];
  }
  if (project.value.projectKnowledge.faqs.length < 10) {
    project.value.projectKnowledge.faqs.push({ question: '', answer: '' });
  } else {
    toast.warning('最多只能設定 10 條常見問題');
  }
};

/**
 * 格式化日期顯示
 */
const formatDate = (timestamp) => {
  if (!timestamp) return '';
  let date;
  if (timestamp.toDate && typeof timestamp.toDate === 'function') {
    // Firestore Timestamp
    date = timestamp.toDate();
  } else if (typeof timestamp === 'number') {
    date = new Date(timestamp);
  } else if (timestamp instanceof Date) {
    date = timestamp;
  } else {
    return '';
  }

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');

  return `${year}-${month}-${day} ${hours}:${minutes}`;
};

const resetAIToken = async () => {
  if (confirm('確定要將已使用 Token 重置為 0 嗎？')) {
    isResettingToken.value = true;
    try {
      if (project.value) {
        project.value.aiTokenUsed = 0;
        await updateProjectSalesSettings(project.value.id, { aiTokenUsed: 0 });
        toast.success('Token 已成功重置為 0！');
      }
    } catch (error) {
      toast.error(`重置失敗: ${error.message}`);
    } finally {
      isResettingToken.value = false;
    }
  }
};

const addContractType = () => {
  const value = newContractType.value.trim();
  if (value && !project.value.contractTypes.includes(value)) {
    project.value.contractTypes.push(value);
    newContractType.value = '';
  } else if (value) {
    toast.warning(`「${value}」已存在`);
  }
};

const removeContractType = (typeToRemove) => {
  if (typeToRemove === '一般合約') {
    toast.error('「一般合約」為預設項目，不可刪除');
    return;
  }
  project.value.contractTypes = project.value.contractTypes.filter(t => t !== typeToRemove);
};

const setupParamsListener = () => {
  paramsLoading.value = true;
  unsubscribeParams = listenToSalesParameters(projectId.value, (data) => {
    salesParameters.value = data;
    if(paramsLoading.value) paramsLoading.value = false;
  });
};

const openParameterDialog = () => {
  editingParameter.value = {
    statusName: '',
    colorCode: '#FFFFFF',
    order: (salesParameters.value.length + 1) * 10,
  };
  parameterDialog.value = true;
};

const editParameter = (param) => {
  editingParameter.value = { ...param };
  parameterDialog.value = true;
};

const closeParameterDialog = () => {
  parameterDialog.value = false;
  editingParameter.value = {};
};

const saveParameter = async () => {
  const { valid } = await parameterForm.value.validate();
  if (!valid) return;

  isSavingParameter.value = true;
  try {
    const { id, ...data } = editingParameter.value;
    if (id) {
      await updateSalesParameter(id, data);
      toast.success('狀態已成功更新！');
    } else {
      await addSalesParameter(projectId.value, data);
      toast.success('已成功新增狀態！');
    }
    closeParameterDialog();
  } catch (error) {
    toast.error(`儲存失敗: ${error.message}`);
  } finally {
    isSavingParameter.value = false;
  }
};

const confirmDelete = (param) => {
    parameterToDelete.value = param;
    deleteDialog.value = true;
};

const executeDelete = async () => {
    isDeleting.value = true;
    try {
        await deleteSalesParameter(parameterToDelete.value.id);
        toast.info('狀態已刪除');
        deleteDialog.value = false;
    } catch (error) {
        toast.error(`刪除失敗: ${error.message}`);
    } finally {
        isDeleting.value = false;
    }
};

const setupImagesListener = () => {
  imagesLoading.value = true;
  unsubscribeImages = listenToSalesImages(
    projectId.value,
    (data) => {
      salesImages.value = data;
      if (imagesLoading.value) imagesLoading.value = false;
    },
    (error) => {
      toast.error(`載入圖片列表失敗: ${error.message}`);
      imagesLoading.value = false;
    }
  );
};

watch(stagedFilesModel, (newFiles) => {
  if (newFiles && newFiles.length > 0) {
    processFiles(newFiles);
    stagedFilesModel.value = []; 
  }
});

const processFiles = async (files) => {
  isReadingFiles.value = true;
  for (const file of files) {
    const { valid, error, width, height } = await validateImage(file);
    
    const nameWithoutExtension = file.name.split('.').slice(0, -1).join('.');

    stagedFiles.value.push({
      id: Date.now() + Math.random(),
      file,
      previewUrl: URL.createObjectURL(file),
      imageName: nameWithoutExtension, 
      useFilename: false,
      error: valid ? null : error,
      width,
      height,
    });
  }
  isReadingFiles.value = false;
};

const validateImage = (file) => {
  return new Promise((resolve) => {
    if (file.size > 1 * 1024 * 1024) { 
      resolve({ valid: false, error: '檔案大小超過 1MB' });
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        resolve({ valid: true, error: null, width: img.width, height: img.height });
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });
};

const removeStagedFile = (id) => {
  const fileToRemove = stagedFiles.value.find(f => f.id === id);
  if (fileToRemove) {
    URL.revokeObjectURL(fileToRemove.previewUrl); 
  }
  stagedFiles.value = stagedFiles.value.filter(f => f.id !== id);
};


// ✅ START: 修改 uploadAllStagedFiles 函式以使用新的上傳方式
const uploadAllStagedFiles = async () => {
  isUploading.value = true;
  uploadErrors.value = [];
  
  const existingNames = new Set(salesImages.value.map(img => img.imageName));
  const stagedNames = new Set();
  
  // 前端驗證 (邏輯不變)
  for (const item of stagedFiles.value) {
    const finalName = item.useFilename ? item.file.name.split('.').slice(0, -1).join('.') : item.imageName;
    if (!finalName) {
      toast.error('錯誤：有圖片未填寫「圖片名稱」。');
      isUploading.value = false;
      return;
    }
    if (existingNames.has(finalName) || stagedNames.has(finalName)) {
      toast.error(`錯誤：圖片名稱 "${finalName}" 已存在或在本次上傳中重複。`);
      isUploading.value = false;
      return;
    }
    if (item.error) {
       toast.error(`錯誤：檔案 "${item.file.name}" 未通過驗證。`);
       isUploading.value = false;
       return;
    }
    stagedNames.add(finalName);
  }

  // 開始上傳
  for (const item of stagedFiles.value) {
    const finalName = item.useFilename ? item.file.name.split('.').slice(0, -1).join('.') : item.imageName;
    
    try {
      const docId = `${projectId.value}_${finalName}`;
      const storagePath = `projects/${projectId.value}/salesImages/${item.file.name}`;
      
      toast.info(`正在上傳 ${finalName}...`);
      
      // 1. 將檔案轉為 Base64
      const base64 = await fileToBase64(item.file);
      
      // 2. 呼叫新的代理上傳 API
      const { downloadURL } = await uploadSalesImage(
        storagePath,
        item.file.name,
        base64,
        projectId.value
      );

      const metadata = {
        projectId: projectId.value,
        imageName: finalName,
        fileName: item.file.name,
        downloadURL, // 使用從 Cloud Function 回傳的 URL
        storagePath,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      await setSalesImageMetadata(docId, metadata);
      toast.success(`"${finalName}" 上傳成功！`);

    } catch (err) {
      toast.error(`"${finalName}" 上傳失敗: ${err.message}`);
      uploadErrors.value.push(`"${finalName}": ${err.message}`);
    }
  }

  stagedFiles.value = []; 
  isUploading.value = false;
};
// ✅ END: 修改 uploadAllStagedFiles

const confirmImageDelete = (image) => {
  imageToDelete.value = image;
  deleteImageDialog.value = true;
};

const executeImageDelete = async () => {
  isDeletingImage.value = true;
  try {
    toast.info(`正在刪除 ${imageToDelete.value.imageName}...`);
    await deleteSalesImage(imageToDelete.value.id, imageToDelete.value.storagePath);
    toast.success(`圖片 "${imageToDelete.value.imageName}" 已成功刪除！`);
    deleteImageDialog.value = false;
  } catch (error) {
    toast.error(`刪除失敗: ${error.message}`);
  } finally {
    isDeletingImage.value = false;
  }
};

const triggerReupload = (image) => {
  reuploadTarget.value = image;
  
  if (reuploadInput.value) {
    reuploadInput.value.click();
  } else {
    console.error('程式無法找到 reuploadInput 元素，請檢查 template 中的 ref 是否正確。');
    toast.error('無法觸發檔案上傳，請刷新頁面後再試一次。');
  }
};

// ✅ START: 修改 handleReuploadFile 以符合新的代理上傳模式
const handleReuploadFile = async (event) => {
  const file = event.target.files[0];
  if (!file || !reuploadTarget.value) return;

  isReuploading.value = true;
  toast.info(`正在驗證並重新上傳 "${reuploadTarget.value.imageName}"...`);

  const { valid, error } = await validateImage(file);
  if (!valid) {
    toast.error(`驗證失敗: ${error}`);
    isReuploading.value = false;
    reuploadInput.value.value = '';
    return;
  }

  try {
    // 1. 將新檔案轉為 Base64
    const base64 = await fileToBase64(file);

    // 2. 呼叫新的代理上傳 API，並傳入所有必要參數
    const { downloadURL } = await uploadSalesImage(
      reuploadTarget.value.storagePath, // 使用舊的儲存路徑來覆蓋檔案
      file.name,                        // 新的檔案名稱
      base64,                           // 新檔案的 Base64 內容
      projectId.value                   // 專案 ID
    );

    // 3. 更新 Firestore 中的 metadata (這部分邏輯不變)
    const metadataUpdate = {
      downloadURL,
      fileName: file.name,
      updatedAt: serverTimestamp(),
    };
    await setSalesImageMetadata(reuploadTarget.value.id, metadataUpdate);

    toast.success(`圖片 "${reuploadTarget.value.imageName}" 已成功更新！`);

  } catch (err) {
    toast.error(`重新上傳失敗: ${err.message}`);
  } finally {
    isReuploading.value = false;
    reuploadInput.value.value = '';
    reuploadTarget.value = null;
  }
};
// ✅ END: 修改 handleReuploadFile

const openImageViewer = (image) => {
  viewingImage.value = image;
  imageViewerDialog.value = true;
};

// ✅ 7. 新增銷售人員管理的 Methods
const setupPersonnelListener = () => {
  personnelLoading.value = true;
  unsubscribePersonnel = listenToSalesPersonnel(projectId.value, (data) => {
    personnelList.value = data;
    if(personnelLoading.value) personnelLoading.value = false;
  });
};

const openPersonnelDialog = (person = null) => {
  if (person) {
    // 編輯模式，深拷貝一份資料
    editingPersonnel.value = JSON.parse(JSON.stringify(person));
  } else {
    // 新增模式，提供預設值
    editingPersonnel.value = {
      positions: ['銷售'],
      name: '',
      phone: '',
      email: ''
    };
  }
  personnelDialog.value = true;
};

const closePersonnelDialog = () => {
  personnelDialog.value = false;
  editingPersonnel.value = {};
};

const savePersonnel = async (data) => {
  isSavingPersonnel.value = true;
  try {
    const { id, ...payload } = data; 
    payload.projectId = projectId.value;

    if (!payload.name || !payload.phone) {
      toast.error('姓名和電話為必填欄位');
      isSavingPersonnel.value = false;
      return;
    }
    
    // ✅ 修改 docId 產生邏輯：加上 projectId，讓多個專案即使用相同姓名和電話，也不會互相覆蓋文檔
    const docId = `${projectId.value}_${payload.name}_${payload.phone}`;

    if (id) { // 編輯模式
      await setSalesPersonnel(id, payload);
      toast.success(`「${payload.name}」的資料已更新`);
    } else { // 新增模式
      // ✅ [修改] 計算預設 order (放在最後)
      const maxOrder = personnelList.value.length > 0 
        ? Math.max(...personnelList.value.map(p => p.order || 0)) 
        : 0;
      
      payload.order = maxOrder + 10; // 間隔 10，預留空間
      payload.createdAt = serverTimestamp();
      
      await setSalesPersonnel(docId, payload);
      toast.success(`已新增人員：「${payload.name}」`);
    }

    closePersonnelDialog();
  } catch (error) {
    toast.error(`儲存失敗: ${error.message}`);
  } finally {
    isSavingPersonnel.value = false;
  }
};


// --- ✅ [新增] 處理拖曳結束的函式 ---
const onPersonnelDragEnd = async () => {
  // 1. 計算新的排序值 (使用 index * 10 重新編號)
  const updates = personnelList.value.map((person, index) => ({
    id: person.id,
    order: (index + 1) * 10
  }));

  // 2. 呼叫 API 進行批次更新
  try {
    await updateSalesPersonnelOrders(projectId.value, updates);
    // 可以選擇顯示成功提示，或是保持靜默以提供流暢體驗
    // toast.success('排序已更新');
  } catch (error) {
    toast.error(`排序更新失敗: ${error.message}`);
    // 失敗時建議重新載入列表以恢復正確順序
    setupPersonnelListener();
  }
};

const confirmPersonnelDelete = (person) => {
  personnelToDelete.value = person;
  deletePersonnelDialog.value = true;
};

const executePersonnelDelete = async () => {
  isDeletingPersonnel.value = true;
  try {
    await deleteSalesPersonnel(personnelToDelete.value.id);
    toast.info(`「${personnelToDelete.value.name}」已刪除`);
    deletePersonnelDialog.value = false;
  } catch (error) {
    toast.error(`刪除失敗: ${error.message}`);
  } finally {
    isDeletingPersonnel.value = false;
  }
};


// ✅ START: SVG 管理功能 State
const stagedSvgFilesModel = ref([]);
const stagedSvgFiles = ref([]);
const isReadingSvgFiles = ref(false);
const isUploadingSvg = ref(false);
const svgUploadErrors = ref([]);
const svgBuildings = ref([]);
const svgBuildingsLoading = ref(true);
const svgSearchQuery = ref('');
const expandedBuildingPanel = ref(null);
const loadedSvgs = reactive({});
const svgListeners = reactive({});
const deleteSvgDialog = ref(false);
const svgToDelete = ref({});
const isDeletingSvg = ref(false);

// ✅ 新增批次刪除相關 State
const selectedSvgs = ref([]); 
const deleteBatchSvgDialog = ref(false);
const isDeletingBatchSvg = ref(false);
// ✅ END: SVG State

// ✅ START: 新增 SVG 相關的 Computed Property
const filteredSvgBuildings = computed(() => {
  if (!svgSearchQuery.value) {
    return svgBuildings.value;
  }
  return svgBuildings.value.filter(b => 
    b.toLowerCase().includes(svgSearchQuery.value.toLowerCase())
  );
});
// ✅ END: SVG Computed Property

// ✅ START: 新增 SVG 相關的 Methods

// 將 File 物件轉為 Base64
const fileToBase64 = (file) => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.readAsDataURL(file);
  reader.onload = () => {
    const base64String = reader.result.split(',')[1];
    resolve(base64String);
  };
  reader.onerror = error => reject(error);
});

// 監聽 v-file-input 的變化
watch(stagedSvgFilesModel, (newFiles) => {
  if (newFiles && newFiles.length > 0) {
    processSvgFiles(newFiles);
    stagedSvgFilesModel.value = [];
  }
});

// 處理待上傳的 SVG 檔案
const processSvgFiles = async (files) => {
  isReadingSvgFiles.value = true;
  for (const file of files) {
    const nameWithoutExtension = file.name.split('.').slice(0, -1).join('.');
    
    stagedSvgFiles.value.push({
      id: Date.now() + Math.random(),
      file,
      previewUrl: URL.createObjectURL(file),
      svgName: nameWithoutExtension,
      building: guessBuildingFromName(nameWithoutExtension),
    });
  }
  isReadingSvgFiles.value = false;
};

// 從檔名猜測棟別
const guessBuildingFromName = (filename) => {
  const match = filename.match(/^[a-zA-Z0-9]+/);
  return match ? match[0].toUpperCase() : '';
};

// 從待上傳列表中移除一個 SVG
const removeStagedSvgFile = (id) => {
  const fileToRemove = stagedSvgFiles.value.find(f => f.id === id);
  if (fileToRemove) {
    URL.revokeObjectURL(fileToRemove.previewUrl);
  }
  stagedSvgFiles.value = stagedSvgFiles.value.filter(f => f.id !== id);
};

// 上傳所有待上傳的 SVG
const uploadAllStagedSvgFiles = async () => {
  isUploadingSvg.value = true;
  svgUploadErrors.value = [];

  for (const item of stagedSvgFiles.value) {
    if (!item.svgName || !item.building) {
      toast.error(`檔案 "${item.file.name}" 的 SVG 名稱或棟別未填寫。`);
      isUploadingSvg.value = false;
      return;
    }
    
    try {
      const docId = `${projectId.value}_${item.svgName}`;
      const storagePath = `projects/${projectId.value}/salesSvgs/${item.file.name}`;
      
      toast.info(`正在上傳 ${item.svgName}...`);
      
      const base64 = await fileToBase64(item.file);
      const { downloadURL } = await uploadSalesSvgViaFunction(storagePath, item.file.name, base64, projectId.value);

      const metadata = {
        projectId: projectId.value,
        svgName: item.svgName,
        building: item.building.toUpperCase(),
        fileName: item.file.name,
        downloadURL,
        storagePath,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      await setSalesSvgMetadata(docId, metadata);
      toast.success(`"${item.svgName}" 上傳成功！`);

    } catch (err) {
      toast.error(`"${item.svgName}" 上傳失敗: ${err.message}`);
      svgUploadErrors.value.push(`"${item.svgName}": ${err.message}`);
    }
  }

  stagedSvgFiles.value = [];
  isUploadingSvg.value = false;
  await loadUniqueBuildings(); // 上傳成功後，重新整理棟別列表
};

// 載入所有不重複的棟別
const loadUniqueBuildings = async () => {
  svgBuildingsLoading.value = true;
  try {
    svgBuildings.value = await getUniqueSvgBuildings(projectId.value);
  } catch (error) {
    toast.error(`載入棟別列表失敗: ${error.message}`);
  } finally {
    svgBuildingsLoading.value = false;
  }
};

// 監聽展開面板的變化，動態載入資料
watch(expandedBuildingPanel, (newBuilding, oldBuilding) => {
  // 取消監聽舊的面板
  if (oldBuilding && svgListeners[oldBuilding]) {
    svgListeners[oldBuilding]();
    delete svgListeners[oldBuilding];
  }
  // 監聽新的面板
  if (newBuilding && !loadedSvgs[newBuilding]) {
    const unsubscribe = listenToSvgsByBuilding(projectId.value, newBuilding, (svgs) => {
      loadedSvgs[newBuilding] = svgs;
    });
    svgListeners[newBuilding] = unsubscribe;
  }
});

// 開啟刪除確認 Dialog
const confirmSvgDelete = (svg) => {
  svgToDelete.value = svg;
  deleteSvgDialog.value = true;
};

// 執行刪除
const executeSvgDelete = async () => {
  isDeletingSvg.value = true;
  try {
    toast.info(`正在刪除 ${svgToDelete.value.svgName}...`);
    await deleteSalesSvgViaFunction(svgToDelete.value.id, svgToDelete.value.storagePath);
    toast.success(`SVG "${svgToDelete.value.svgName}" 已成功刪除！`);
    deleteSvgDialog.value = false;
    // 如果刪除後該棟別已無任何 SVG，需要重新整理棟別列表
    const remainingInBuilding = loadedSvgs[svgToDelete.value.building]?.filter(s => s.id !== svgToDelete.value.id);
    if (remainingInBuilding && remainingInBuilding.length === 0) {
        await loadUniqueBuildings();
    }
  } catch (error) {
    toast.error(`刪除失敗: ${error.message}`);
  } finally {
    isDeletingSvg.value = false;
  }
};

const CustomFormManager = defineAsyncComponent(() => import('@/components/CustomFormManager.vue'));


const fetchSheetNames = async () => {
  loadingSheets.value = true;
  syncResult.value = null; // 清除之前的訊息
  try {
    const res = await listGoogleSheets(googleSheetForm.url);
    if (res.status === 'success') {
      sheetNames.value = res.sheetNames;
      serviceAccountEmail.value = res.agentEmail || ''; // Store email
      toast.success('工作表讀取成功！');
    } else {
      throw new Error(res.message || '讀取失敗');
    }
  } catch (error) {
    console.error('fetchSheetNames error:', error);
    toast.error(`讀取工作表失敗: ${error.message}`);
    sheetNames.value = [];
  } finally {
    loadingSheets.value = false;
  }
};

const executeSync = async () => {
  isSyncing.value = true;
  syncResult.value = null;
  try {
    // 從 URL 提取 ID (簡易版，api listGoogleSheets 也有類似邏輯，但這裡為了傳遞明確參數再做一次或是依賴後端擷取)
    // 為了確保後端收到正確 ID，我們這裡做簡易擷取。
    // 後端 syncSalesHouseholdsToSheet 需要 spreadsheetId
    let spreadsheetId = googleSheetForm.url;
    const match = googleSheetForm.url.match(/\/d\/([a-zA-Z0-9-_]+)/);
    if (match) {
        spreadsheetId = match[1];
    }

    const payload = {
      projectId: projectId.value,
      spreadsheetId: spreadsheetId,
      sheetName: googleSheetForm.sheetName,
    };

    const res = await syncSalesHouseholdsToSheet(payload);
    
    if (res.status === 'success') {
      const msg = `同步成功！已處理 ${res.count} 筆銷控資料。`;
      toast.success(msg);
      syncResult.value = {
        type: 'success',
        message: msg + ' (即時同步功能已自動啟用)'
      };
      
      // 更新本地 project 資料 (因為後端有更新 projects collection)
      if (project.value) {
        project.value.salesSheetId = spreadsheetId;
        project.value.salesSheetTabName = googleSheetForm.sheetName;
        project.value.salesSheetUrl = googleSheetForm.url; // 簡易更新
      }
    } else {
      throw new Error(res.message);
    }
  } catch (error) {
    console.error('executeSync error:', error);
    const msg = `同步失敗: ${error.message}`;
    toast.error(msg);
    syncResult.value = {
      type: 'error',
      message: msg
    };
  } finally {
    isSyncing.value = false;
  }
};
// ✅ END: Google Sheet Sync Methods
const isAllSelectedInBuilding = (building) => {
  const buildingSvgs = loadedSvgs[building] || [];
  if (buildingSvgs.length === 0) return false;
  return buildingSvgs.every(svg => selectedSvgs.value.includes(svg.id));
};

// 確認某棟別下的 SVG 是否為「部分」選中 (用於 checkbox 的 indeterminate 狀態)
const isIndeterminateInBuilding = (building) => {
  const buildingSvgs = loadedSvgs[building] || [];
  if (buildingSvgs.length === 0) return false;
  const selectedCount = buildingSvgs.filter(svg => selectedSvgs.value.includes(svg.id)).length;
  return selectedCount > 0 && selectedCount < buildingSvgs.length;
};

// 切換某棟別的全選狀態
const toggleSelectAllInBuilding = (building) => {
  const buildingSvgs = loadedSvgs[building] || [];
  const buildingSvgIds = buildingSvgs.map(svg => svg.id);
  
  if (isAllSelectedInBuilding(building)) {
    // 如果已全選，則全部取消
    selectedSvgs.value = selectedSvgs.value.filter(id => !buildingSvgIds.includes(id));
  } else {
    // 否則，將該棟別所有 SVG 加入選中列表 (使用 Set 避免重複)
    const newSelection = new Set([...selectedSvgs.value, ...buildingSvgIds]);
    selectedSvgs.value = Array.from(newSelection);
  }
};

// 開啟批次刪除確認 Dialog
const confirmBatchDelete = () => {
  deleteBatchSvgDialog.value = true;
};

// 執行批次刪除
const executeBatchDelete = async () => {
  isDeletingBatchSvg.value = true;
  
  const allLoadedSvgs = Object.values(loadedSvgs).flat();
  const svgsToDeletePayload = allLoadedSvgs
    .filter(svg => selectedSvgs.value.includes(svg.id))
    .map(svg => ({ docId: svg.id, storagePath: svg.storagePath }));

  try {
    toast.info(`正在批次刪除 ${svgsToDeletePayload.length} 個檔案...`);
    const result = await batchDeleteSalesSvgsViaFunction(svgsToDeletePayload);
    
    if (result.status === 'success') {
      toast.success(result.message);
    } else {
      toast.warning(result.message);
    }

    selectedSvgs.value = []; // 清空選中列表
    await loadUniqueBuildings(); // 重新載入棟別列表
    expandedBuildingPanel.value = null; // 關閉所有面板
    Object.keys(loadedSvgs).forEach(key => delete loadedSvgs[key]); // 清空已載入的資料

  } catch (error) {
    toast.error(`批次刪除失敗: ${error.message}`);
  } finally {
    isDeletingBatchSvg.value = false;
    deleteBatchSvgDialog.value = false;
  }
};
// ✅ END: 批次刪除 Methods


onMounted(() => {
  if (projectId.value) {
    loadProjectSettings();
    setupParamsListener();
    setupImagesListener();
    loadUniqueBuildings();
    setupPersonnelListener(); 
  } else {
    toast.error('錯誤：未提供專案 ID！');
  }
});

onUnmounted(() => {
  if (unsubscribeParams) unsubscribeParams();
  if (unsubscribeImages) unsubscribeImages();
  if (unsubscribePersonnel) unsubscribePersonnel(); 
  Object.values(svgListeners).forEach(unsubscribe => unsubscribe());
});

</script>

<style scoped>
/* ... (其他樣式) */

.cursor-move {
  cursor: move;
  cursor: grab;
}
.cursor-move:active {
  cursor: grabbing;
}
</style>