<template>
  <v-container fluid style="background-color: #f5f5f7;">
    <v-card>
      <v-toolbar color="primary" density="compact">

        <v-card-title class="d-flex align-center text-h5">

          <v-icon start>mdi-cogs</v-icon>
          <span>驗屋預約系統管理：{{ projectName || '讀取中...' }}</span>
          <v-spacer></v-spacer>

        </v-card-title>
      </v-toolbar>

      <v-tabs v-model="activeTab" bg-color="primary">
        <v-tab value="batches">批次管理</v-tab>
        <v-tab value="settings">預約系統狀態設定</v-tab>
        <v-tab value="sheet-sync" v-if="isAdmin"><v-icon size="small" color="amber-darken-2"
            class="mr-1">mdi-shield-crown-outline</v-icon>Sheet 同步管理</v-tab>
        <v-tab value="inspSystem" v-if="hasInspectionSystemPermission"><v-icon size="small"
            class="mr-1">mdi-home-search-outline</v-icon>驗屋系統設定</v-tab>

      </v-tabs>

      <div v-if="isLoading" class="text-center pa-10">
        <v-progress-circular indeterminate color="primary" size="64"></v-progress-circular>
      </div>
      <div v-else>

        <v-window v-model="activeTab" :touch="false">
          <v-window-item value="batches" class="pa-4">
            <v-toolbar flat color="transparent">
              <v-text-field v-model="searchQuery" label="搜尋..." prepend-inner-icon="mdi-magnify" variant="solo-filled"
                flat density="compact" hide-details clearable class="mr-4" style="max-width: 350px;"></v-text-field>
              <v-spacer></v-spacer>
              <v-btn color="primary" @click="openBatchDialog()" prepend-icon="mdi-plus">新增批次</v-btn>
            </v-toolbar>

            <div class="d-none d-md-block">
              <v-data-table :headers="batchHeaders" :items="processedBookingBatches" :loading="isBatchLoading"
                :search="searchQuery" item-value="id" class="elevation-1">
                <template v-slot:item.applicationWindow="{ item }">
                  <div v-if="item.applicationStart && item.applicationEnd">
                    <div class="d-flex align-center">
                      <v-chip size="x-small" color="teal-lighten-3" text-color="teal-darken-4" label
                        class="mr-1 font-weight-bold">起</v-chip>
                      <span>{{ formatDisplayDateTime(item.applicationStart) }}</span>
                    </div>
                    <div class="d-flex align-center mt-1">
                      <v-chip size="x-small" color="pink-lighten-3" text-color="pink-darken-4" label
                        class="mr-1 font-weight-bold">迄</v-chip>
                      <span>{{ formatDisplayDateTime(item.applicationEnd) }}</span>
                    </div>
                  </div>
                  <span v-else class="text-grey">未設定</span>
                </template>
                <template v-slot:item.bookingWindow="{ item }">
                  <div>
                    <div class="d-flex align-center">
                      <v-chip size="x-small" color="teal-lighten-3" text-color="teal-darken-4" label
                        class="mr-1 font-weight-bold">起</v-chip>
                      <span>{{ item.bookingStart }}</span>
                    </div>
                    <div class="d-flex align-center mt-1">
                      <v-chip size="x-small" color="pink-lighten-3" text-color="pink-darken-4" label
                        class="mr-1 font-weight-bold">迄</v-chip>
                      <span>{{ item.bookingEnd }}</span>
                    </div>
                  </div>
                </template>
                <template v-slot:item.quotaMode="{ item }">
                  <v-chip :color="item.quotaMode === 'isolated' ? 'orange' : 'blue'" size="small" label variant="tonal">
                    <v-icon start size="x-small">
                      {{ item.quotaMode === 'isolated' ? 'mdi-lock-outline' : 'mdi-link-variant' }}
                    </v-icon>
                    {{ item.quotaMode === 'isolated' ? '獨立名額' : '共用名額' }}
                  </v-chip>
                </template>
                <template v-slot:item.statusText="{ item }">
                  <v-chip :color="getBatchStatus(item).color" size="small">
                    {{ item.statusText }}
                  </v-chip>
                </template>
                <template v-slot:item.actions="{ item }">
                  <v-btn icon="mdi-eye" variant="text" color="info" size="small" class="mr-1"
                    @click="openPreviewDialog(item)"></v-btn>
                  <v-btn icon="mdi-pencil" variant="text" color="primary" size="small" class="mr-1"
                    @click="openBatchDialog(item)"></v-btn>
                  <v-btn icon="mdi-delete" variant="text" color="error" size="small"
                    @click="openDeleteDialog(item)"></v-btn>
                </template>
              </v-data-table>
            </div>

            <div class="d-md-none mt-4">
              <div v-if="isBatchLoading" class="text-center pa-10">
                <v-progress-circular indeterminate color="primary"></v-progress-circular>
              </div>
              <div v-else>
                <v-card v-for="item in filteredBatchesForCards" :key="item.id" class="mb-3" variant="outlined">
                  <v-card-title class="d-flex justify-space-between align-center text-body-1 font-weight-bold py-2">
                    <span>{{ item.bookingType }}: {{ item.batchCode }}</span>
                    <div class="d-flex align-center ga-1">
                      <v-chip :color="item.quotaMode === 'isolated' ? 'orange' : 'blue'" size="x-small" label
                        variant="tonal">
                        {{ item.quotaMode === 'isolated' ? '🔒 獨立' : '🔗 共用' }}
                      </v-chip>
                      <v-chip :color="getBatchStatus(item).color" size="small" label>{{ item.statusText }}</v-chip>
                    </div>
                  </v-card-title>
                  <v-divider></v-divider>
                  <v-card-text class="py-2">
                    <div class="mb-2">
                      <div class="text-caption text-grey-darken-1">預約開放區間</div>
                      <div>
                        <span class="font-weight-bold text-teal-darken-2 mr-1">起:</span>
                        <span>{{ formatDisplayDateTime(item.applicationStart) || '未設定' }}</span>
                      </div>
                      <div>
                        <span class="font-weight-bold text-pink-darken-2 mr-1">迄:</span>
                        <span>{{ formatDisplayDateTime(item.applicationEnd) || '未設定' }}</span>
                      </div>
                    </div>
                    <div>
                      <div class="text-caption text-grey-darken-1">可預約區間</div>
                      <div>
                        <span class="font-weight-bold text-teal-darken-2 mr-1">起:</span>
                        <span>{{ item.bookingStart || '未設定' }}</span>
                      </div>
                      <div>
                        <span class="font-weight-bold text-pink-darken-2 mr-1">迄:</span>
                        <span>{{ item.bookingEnd || '未設定' }}</span>
                      </div>
                    </div>
                  </v-card-text>
                  <v-divider></v-divider>
                  <v-card-actions>
                    <v-spacer></v-spacer>
                    <v-btn color="info" variant="tonal" size="small" @click="openPreviewDialog(item)">預覽</v-btn>
                    <v-btn color="primary" variant="tonal" size="small" @click="openBatchDialog(item)">編輯</v-btn>
                    <v-btn color="error" variant="tonal" size="small" @click="openDeleteDialog(item)">刪除</v-btn>
                  </v-card-actions>
                </v-card>
                <div v-if="filteredBatchesForCards.length === 0" class="text-center text-grey-darken-1 py-10">
                  <p>找不到符合條件的批次</p>
                </div>
              </div>
            </div>
          </v-window-item>

          <v-window-item value="settings" class="settings-tab-content">
            <div v-if="isSettingsLoading" class="d-flex justify-center align-center flex-grow-1 pa-10">
              <v-progress-circular indeterminate color="primary"></v-progress-circular>
            </div>

            <div v-else class="settings-form-container pa-4">
              <v-tabs v-model="settingsSubTab" color="primary" class="mb-4">
                <v-tab value="general">一般與狀態設定</v-tab>
                <v-tab value="shared-page-settings">頁面LOGO及授權書設定</v-tab>
                <v-tab value="content">預約頁面設定</v-tab>
                <v-tab value="rules">預約選單與人員</v-tab>
                <v-tab value="report-settings">驗屋報告上傳設定</v-tab>
                <v-tab value="customer-messages">客戶回傳功能設定</v-tab>
              </v-tabs>

              <v-form>
                <v-window v-model="settingsSubTab" :touch="false">
                  <!-- Tab 1: 一般與狀態設定 -->
                  <v-window-item value="general" transition="fade-transition" reverse-transition="fade-transition">
                    <!-- 預約頁面路徑顯示 -->
                    <v-card variant="outlined" class="mb-6">
                      <v-card-text>
                        <div class="text-subtitle-2 font-weight-bold mb-2">{{ projectName }}-預約系統網址</div>
                        <div class="d-flex align-center ga-2">
                          <v-text-field :model-value="bookingPageUrl" variant="outlined" density="compact" readonly
                            hide-details prepend-inner-icon="mdi-link-variant" bg-color="grey-lighten-4"
                            class="flex-grow-1"></v-text-field>
                          <v-btn color="primary" variant="tonal" prepend-icon="mdi-qrcode" @click="showQrDialog = true">
                            產生網址 QR Code
                          </v-btn>
                        </div>
                      </v-card-text>
                    </v-card>

                    <v-card variant="outlined" class="mb-6">
                      <v-card-text>
                        <div class="d-flex align-center mb-4">
                          <div class="flex-grow-1">
                            <v-switch v-model="projectSettings.validateId" label="啟用身分證驗證" true-value="ON"
                              false-value="OFF" color="primary" inset hide-details></v-switch>
                            <div class="text-caption text-grey-darken-1 ml-4 mt-n2">
                              啟用後，客戶在預約時需輸入與產權人相符身分證號，以免預約時戶別及產權人不符</div>
                          </div>
                        </div>
                        <div class="d-flex align-center mb-6">
                          <div class="flex-grow-1">
                            <v-switch v-if="isAdmin" v-model="projectSettings.checkDuplicate" true-value="ON"
                              false-value="OFF" color="primary" inset hide-details>
                              <template v-slot:label>
                                <v-icon color="amber-darken-2" class="mr-2">mdi-shield-crown-outline</v-icon>
                                <span>檢查重複預約</span>
                              </template>
                            </v-switch>
                            <div v-if="isAdmin" class="text-caption text-grey-darken-1 ml-4 mt-n2">
                              啟用後，系統會檢查同一戶別、同一預約項目是否已有有效預約
                            </div>
                          </div>
                        </div>

                        <v-divider class="my-4"></v-divider>

                        <div class="d-flex align-center">
                          <div>
                            <div class="text-h6 font-weight-bold">系統開放狀態</div>
                            <div class="text-caption text-grey-darken-1">總開關必須開啟，排程設定才會生效</div>
                          </div>
                          <v-switch v-model="projectSettings.isPublished"
                            :label="projectSettings.isPublished ? '預約系統啟用中' : '預約系統已關閉'" color="success" hide-details
                            inset></v-switch>
                        </div>

                        <v-divider class="my-4"></v-divider>

                        <v-checkbox v-model="projectSettings.enableScheduledPublish" label="啟用定時開關預約系統" color="primary"
                          hide-details class="mb-2" :disabled="!projectSettings.isPublished"></v-checkbox>

                        <v-expand-transition>
                          <div v-if="projectSettings.enableScheduledPublish">
                            <v-row class="mt-2">
                              <v-col cols="12" sm="6">
                                <v-menu v-model="menuPublishStart" :close-on-content-click="false" location="bottom">
                                  <template v-slot:activator="{ props }">
                                    <v-text-field :model-value="formatDisplayDateTime(projectSettings.publishStartTime)"
                                      label="自動開啟時間" prepend-inner-icon="mdi-calendar-clock" readonly v-bind="props"
                                      variant="outlined" density="compact" clearable
                                      @click:clear="projectSettings.publishStartTime = null"></v-text-field>
                                  </template>
                                  <v-card min-width="300">
                                    <v-tabs v-model="activePickerTabPubStart" grow density="compact">
                                      <v-tab :value="0">日期</v-tab>
                                      <v-tab :value="1">時間</v-tab>
                                    </v-tabs>
                                    <v-window v-model="activePickerTabPubStart">
                                      <v-window-item :value="0">
                                        <v-date-picker v-model="tempPubStartDate" hide-header
                                          @update:model-value="activePickerTabPubStart = 1"></v-date-picker>
                                      </v-window-item>
                                      <v-window-item :value="1">
                                        <v-time-picker v-model="tempPubStartTime" format="24hr"></v-time-picker>
                                      </v-window-item>
                                    </v-window>
                                    <v-card-actions>
                                      <v-spacer></v-spacer>
                                      <v-btn variant="text" @click="menuPublishStart = false">取消</v-btn>
                                      <v-btn color="primary" @click="savePublishStartTime">確定</v-btn>
                                    </v-card-actions>
                                  </v-card>
                                </v-menu>
                              </v-col>

                              <v-col cols="12" sm="6">
                                <v-menu v-model="menuPublishEnd" :close-on-content-click="false" location="bottom">
                                  <template v-slot:activator="{ props }">
                                    <v-text-field :model-value="formatDisplayDateTime(projectSettings.publishEndTime)"
                                      label="自動關閉時間" prepend-inner-icon="mdi-calendar-clock" readonly v-bind="props"
                                      variant="outlined" density="compact" clearable
                                      @click:clear="projectSettings.publishEndTime = null"></v-text-field>
                                  </template>
                                  <v-card min-width="300">
                                    <v-tabs v-model="activePickerTabPubEnd" grow density="compact">
                                      <v-tab :value="0">日期</v-tab>
                                      <v-tab :value="1">時間</v-tab>
                                    </v-tabs>
                                    <v-window v-model="activePickerTabPubEnd">
                                      <v-window-item :value="0">
                                        <v-date-picker v-model="tempPubEndDate" hide-header
                                          @update:model-value="activePickerTabPubEnd = 1"
                                          :min="projectSettings.publishStartTime"></v-date-picker>
                                      </v-window-item>
                                      <v-window-item :value="1">
                                        <v-time-picker v-model="tempPubEndTime" format="24hr"></v-time-picker>
                                      </v-window-item>
                                    </v-window>
                                    <v-card-actions>
                                      <v-spacer></v-spacer>
                                      <v-btn variant="text" @click="menuPublishEnd = false">取消</v-btn>
                                      <v-btn color="primary" @click="savePublishEndTime">確定</v-btn>
                                    </v-card-actions>
                                  </v-card>
                                </v-menu>
                              </v-col>
                            </v-row>
                            <div class="text-caption text-info mt-1">
                              <v-icon icon="mdi-information-outline" size="x-small"></v-icon>
                              若未設定時間，則以手動開關為主。
                            </div>
                          </div>
                        </v-expand-transition>
                      </v-card-text>
                    </v-card>
                    <div class="mb-4"></div>
                  </v-window-item>

                  <!-- Tab 2: 預約規則與人員 -->
                  <v-window-item value="rules" transition="fade-transition" reverse-transition="fade-transition">

                    <!-- NEW: Booking Menu Configuration (Parent-Child Structure) -->
                    <div class="mb-4">
                      <div class="d-flex align-center justify-space-between">
                        <div>
                          <p class="text-subtitle-1 font-weight-bold mb-2">預約選單設定 (項目 > 方式)</p>
                        </div>
                        <div class="d-flex align-center ga-2">
                          <v-btn color="primary" size="small" prepend-icon="mdi-plus"
                            @click="openEditBookingItemDialog()">新增預約項目</v-btn>
                        </div>
                      </div>
                    </div>

                    <div v-if="activeBookingMenu.length === 0 && deletedBookingMenu.length === 0"
                      class="text-center text-grey pa-6 border rounded border-dashed mb-6">
                      <v-icon size="48" color="grey-lighten-1" class="mb-2">mdi-file-tree</v-icon>
                      <p>尚未建立預約選單結構，請點擊上方按鈕新增。</p>
                    </div>

                    <draggable v-if="activeBookingMenu.length > 0" v-model="activeBookingMenu" item-key="title"
                      handle=".drag-handle" tag="v-expansion-panels"
                      :component-data="{ variant: 'accordion', class: 'mb-6' }">
                      <template #item="{ element: item, index: itemIndex }">
                        <v-expansion-panel>
                          <v-expansion-panel-title>
                            <div class="d-flex align-center flex-grow-1">
                              <!-- Drag Handle for item -->
                              <v-icon class="drag-handle mr-3 cursor-move"
                                color="grey">mdi-drag-horizontal-variant</v-icon>

                              <v-icon color="primary" class="mr-3">mdi-folder-outline</v-icon>
                              <span class="font-weight-bold mr-2">{{ item.title }}</span>
                              <v-chip size="x-small" color="grey" variant="outlined" class="mr-2">{{item.methods ?
                                item.methods.filter(m => !m.deleted).length : 0}} 種方式</v-chip>
                              <v-btn icon variant="text" size="small" color="primary"
                                @click.stop="openEditBookingItemDialog(item, itemIndex)" title="編輯項目名稱">
                                <v-icon>mdi-pencil</v-icon>
                              </v-btn>
                              <v-btn icon variant="text" size="small" color="error"
                                @click.stop="deleteBookingItem(itemIndex)" title="刪除項目">
                                <v-icon>mdi-delete</v-icon>
                              </v-btn>
                            </div>
                            <template v-slot:actions="{ expanded }">
                              <v-icon :icon="expanded ? 'mdi-chevron-up' : 'mdi-chevron-down'"></v-icon>
                            </template>
                          </v-expansion-panel-title>
                          <v-expansion-panel-text>
                            <div class="d-flex justify-start mb-2">
                              <v-btn size="small" variant="tonal" color="secondary" prepend-icon="mdi-plus"
                                @click="openEditMethodDialog(itemIndex)">新增選擇方式</v-btn>
                            </div>

                            <div v-if="!item.methods || item.methods.filter(m => !m.deleted).length === 0"
                              class="text-center text-grey-darken-1 text-caption pa-4 bg-grey-lighten-5 rounded">
                              此項目下尚未設定選擇方式
                            </div>

                            <draggable v-if="item.methods && item.methods.filter(m => !m.deleted).length > 0"
                              :model-value="item.methods.filter(m => !m.deleted)"
                              @update:model-value="(newVal) => { const deletedMethods = (item.methods || []).filter(m => m.deleted); item.methods = [...newVal, ...deletedMethods]; }"
                              item-key="title" handle=".method-drag-handle" tag="v-list"
                              :component-data="{ density: 'compact', class: 'bg-grey-lighten-5 rounded' }">
                              <template #item="{ element: method, index: methodIndex }">
                                <div>
                                  <v-list-item class="py-0">
                                    <div class="d-flex flex-column w-100 py-2">
                                      <div class="d-flex align-center">
                                        <!-- Method Drag Handle -->
                                        <v-icon class="method-drag-handle mr-2 cursor-move" size="small"
                                          color="grey">mdi-drag</v-icon>
                                        <v-icon size="small" color="secondary"
                                          class="mr-2">mdi-subdirectory-arrow-right</v-icon>

                                        <span class="font-weight-medium mr-4 text-subtitle-2">{{ method.title }}</span>

                                        <!-- Info Chips -->
                                        <v-chip v-if="method.triggerAuthFlow" size="x-small" color="warning" class="mr-2"
                                          variant="outlined">
                                          需授權
                                        </v-chip>
                                        <v-chip v-if="method.customFields && method.customFields.length > 0"
                                          size="x-small" color="info" class="mr-2" variant="tonal">
                                          {{ method.customFields.length }} 欄位
                                        </v-chip>
                                        <v-chip v-if="method.subOptions && method.subOptions.length > 0"
                                          size="x-small" color="success" variant="tonal">
                                          {{ method.subOptions.length }} 子選項
                                        </v-chip>

                                        <!-- Action Buttons -->
                                        <v-btn icon variant="text" size="x-small" color="primary" class="mr-1"
                                          @click="openDynamicFieldsDialog(method, itemIndex, methodIndex)" title="設定額外欄位">
                                          <v-icon>mdi-cog</v-icon>
                                        </v-btn>
                                        <v-btn icon variant="text" size="x-small" color="grey-darken-1" class="mr-1"
                                          @click="openEditMethodDialog(itemIndex, method, methodIndex)" title="編輯方式名稱">
                                          <v-icon>mdi-pencil</v-icon>
                                        </v-btn>
                                        <v-btn icon variant="text" size="x-small" color="error"
                                          @click="deleteMethod(itemIndex, methodIndex)" title="刪除方式">
                                          <v-icon>mdi-close</v-icon>
                                        </v-btn>

                                        <v-spacer></v-spacer>
                                      </div>
                                      <!-- Sub Options Display -->
                                      <div v-if="method.subOptions && method.subOptions.length > 0" class="mt-2 ml-8">
                                        <div class="text-caption text-grey-darken-1">
                                          {{ method.subOptions.join(', ') }}
                                        </div>
                                      </div>
                                    </div>
                                  </v-list-item>
                                  <v-divider v-if="methodIndex < item.methods.filter(m => !m.deleted).length - 1"
                                    inset></v-divider>
                                </div>
                              </template>
                            </draggable>

                            <!-- 已刪除的方式列表 -->
                            <div v-if="item.methods && item.methods.filter(m => m.deleted).length > 0" class="mt-3">
                              <v-expansion-panels variant="accordion">
                                <v-expansion-panel>
                                  <v-expansion-panel-title class="py-2" style="min-height: auto;">
                                    <v-icon size="small" color="grey" class="mr-2">mdi-delete-clock-outline</v-icon>
                                    <span class="text-caption text-grey-darken-1">已刪除的方式 ({{item.methods.filter(m =>
                                      m.deleted).length}})</span>
                                  </v-expansion-panel-title>
                                  <v-expansion-panel-text>
                                    <v-list density="compact" class="bg-red-lighten-5 rounded">
                                      <v-list-item v-for="(method, delMethodIdx) in item.methods.filter(m => m.deleted)"
                                        :key="'del-' + method.title" class="py-1">
                                        <div class="d-flex align-center w-100">
                                          <v-icon size="small" color="grey"
                                            class="mr-2">mdi-subdirectory-arrow-right</v-icon>
                                          <span
                                            class="text-decoration-line-through text-grey-darken-1 text-subtitle-2 mr-2">{{
                                              method.title }}</span>
                                          <v-chip size="x-small" color="grey" variant="tonal" class="mr-auto">
                                            {{ method.deletedAt ? new Date(method.deletedAt).toLocaleDateString('zh-TW')
                                              + ' 刪除' :
                                              '已刪除' }}
                                          </v-chip>
                                          <v-btn icon variant="text" size="x-small" color="success"
                                            @click="restoreMethod(itemIndex, delMethodIdx)" title="復原">
                                            <v-icon>mdi-restore</v-icon>
                                          </v-btn>
                                          <v-btn icon variant="text" size="x-small" color="error"
                                            @click="permanentlyDeleteMethod(itemIndex, delMethodIdx)" title="永久刪除">
                                            <v-icon>mdi-delete-forever</v-icon>
                                          </v-btn>
                                        </div>
                                      </v-list-item>
                                    </v-list>
                                  </v-expansion-panel-text>
                                </v-expansion-panel>
                              </v-expansion-panels>
                            </div>
                          </v-expansion-panel-text>
                        </v-expansion-panel>
                      </template>
                    </draggable>

                    <!-- 已刪除的預約項目區塊 -->
                    <v-expand-transition>
                      <div v-if="deletedBookingMenu.length > 0" class="mb-6">
                        <v-card variant="outlined" color="error" class="border-dashed">
                          <v-card-title class="d-flex align-center py-2 px-4 bg-red-lighten-5 cursor-pointer"
                            @click="showDeletedItems = !showDeletedItems">
                            <v-icon size="small" color="error" class="mr-2">mdi-delete-clock-outline</v-icon>
                            <span class="text-subtitle-2 text-error">已刪除的預約項目 ({{ deletedBookingMenu.length }})</span>
                            <v-spacer></v-spacer>
                            <v-icon :icon="showDeletedItems ? 'mdi-chevron-up' : 'mdi-chevron-down'" size="small"
                              color="error"></v-icon>
                          </v-card-title>
                          <v-expand-transition>
                            <v-card-text v-if="showDeletedItems" class="pa-2">
                              <v-list density="compact">
                                <v-list-item v-for="(item, delIdx) in deletedBookingMenu" :key="'deleted-' + item.title"
                                  class="mb-1 rounded bg-red-lighten-5">
                                  <div class="d-flex align-center w-100 py-1">
                                    <v-icon color="grey" class="mr-2">mdi-folder-remove-outline</v-icon>
                                    <div class="flex-grow-1">
                                      <span class="text-decoration-line-through font-weight-bold text-grey-darken-1">{{
                                        item.title
                                        }}</span>
                                      <div class="text-caption text-grey">
                                        {{ item.methods ? item.methods.length : 0 }} 種方式
                                        <span v-if="item.deletedAt"> · {{ new
                                          Date(item.deletedAt).toLocaleDateString('zh-TW') }}
                                          刪除</span>
                                      </div>
                                    </div>
                                    <v-btn variant="tonal" size="small" color="success" prepend-icon="mdi-restore"
                                      class="mr-2" @click="restoreBookingItem(delIdx)">復原</v-btn>
                                    <v-btn variant="tonal" size="small" color="error" prepend-icon="mdi-delete-forever"
                                      @click="permanentlyDeleteBookingItem(delIdx)">永久刪除</v-btn>
                                  </div>
                                </v-list-item>
                              </v-list>
                            </v-card-text>
                          </v-expand-transition>
                        </v-card>
                      </div>
                    </v-expand-transition>

                    <div v-if="false">
                      <!-- Hidden Legacy Fields (Keep for logic safety until full migration confirmed) -->
                      <v-combobox v-model="projectSettings.bookingTypes" label="預約項目 (Legacy)" multiple
                        chips></v-combobox>
                      <v-combobox v-model="projectSettings.bookingMethodOptions" label="選擇方式 (Legacy)" multiple
                        chips></v-combobox>
                    </div>

                    <!-- Dialog: Add/Edit Booking Item -->
                    <v-dialog v-model="isBookingItemDialogVisible" max-width="400px">
                      <v-card>
                        <v-card-title class="bg-primary text-white">
                          {{ editedBookingItemIndex === -1 ? '新增預約項目' : '編輯預約項目' }}
                        </v-card-title>
                        <v-card-text class="pa-4">
                          <v-text-field v-model="editedBookingItemTitle" label="項目名稱" placeholder="例如：初驗、複驗"
                            variant="outlined" autofocus @keyup.enter="saveBookingItem"></v-text-field>
                        </v-card-text>
                        <v-card-actions class="pa-4">
                          <v-spacer></v-spacer>
                          <v-btn variant="text" @click="isBookingItemDialogVisible = false">取消</v-btn>
                          <v-btn color="primary" variant="elevated" @click="saveBookingItem"
                            :disabled="!editedBookingItemTitle">確認</v-btn>
                        </v-card-actions>
                      </v-card>
                    </v-dialog>

                    <!-- Dialog: Add/Edit Method -->
                    <v-dialog v-model="isMethodDialogVisible" max-width="400px">
                      <v-card>
                        <v-card-title class="bg-secondary text-white">
                          {{ editedMethodIndex === -1 ? '新增選擇方式' : '編輯選擇方式' }}
                        </v-card-title>
                        <v-card-text class="pa-4">
                          <v-text-field v-model="editedMethodTitle" :label="editedMethodParentTitle + '方式'"
                            variant="outlined"></v-text-field>



                          <div class="mt-4">
                            <div class="text-caption text-grey-darken-1 mb-2">常用建議 (點擊帶入)：</div>
                            <v-chip-group column>
                              <v-chip size="small" variant="outlined" @click="editedMethodTitle = '屋主自驗'">屋主自驗</v-chip>
                              <v-chip size="small" variant="outlined" @click="editedMethodTitle = '委託代驗'">委託代驗</v-chip>
                              <v-chip size="small" variant="outlined" @click="editedMethodTitle = '授權驗屋'">授權驗屋</v-chip>
                              <v-chip size="small" variant="outlined"
                                @click="editedMethodTitle = '設計師陪驗'">設計師陪驗</v-chip>
                              <v-chip size="small" variant="outlined" @click="editedMethodTitle = '不貸款'">不貸款</v-chip>
                              <v-chip size="small" variant="outlined" @click="editedMethodTitle = '自覓銀行'">自覓銀行</v-chip>
                            </v-chip-group>
                          </div>
                          <v-switch v-model="editedMethodTriggerAuth" label="啟用授權/委託流程" color="warning" hide-details
                            density="compact" class="mb-2" inset>
                            <template v-slot:label>
                              <div>
                                <div class="font-weight-bold">啟用授權/委託流程</div>
                                <div class="text-caption">使用者選擇此方式時將觸發「授權委託書」簽署流程。</div>
                              </div>
                            </template>
                          </v-switch>

                          <v-expand-transition>
                            <div v-if="editedMethodTriggerAuth" class="pl-4 border-s-md" style="border-color: #eee;">
                              <v-switch v-model="editedMethodAskPresence" label="詢問客戶本人是否到場 (選「否」才觸發)" color="info"
                                hide-details density="compact" class="mt-0 mb-2" inset>
                                <template v-slot:label>
                                  <div>
                                    <div class="font-weight-bold">詢問客戶本人是否到場</div>
                                    <div class="text-caption">
                                      開啟時，詢問本人是否到場，不到場才進行授權流程
                                      關閉時，不詢問本人是否到場，直接進行授權流程
                                    </div>
                                  </div>
                                </template>
                              </v-switch>
                            </div>
                          </v-expand-transition>

                          <!-- 新增：子選項設定 -->
                          <v-divider class="my-4"></v-divider>
                          <div class="text-subtitle-2 font-weight-bold mb-2">子選項設定 (選填)</div>
                          <div class="text-caption text-grey-darken-1 mb-2">
                            若需讓客戶在選擇此方式後進一步選擇項目（例如：填寫需貸款後，需進一步選擇台灣銀行、土地銀行等），請在此設定。輸入項目後按下 Enter 新增。
                          </div>
                          <v-combobox v-model="editedMethodSubOptions" label="子選單項目 (按 Enter 新增多筆)" multiple chips clearable variant="outlined" density="compact"></v-combobox>

                        </v-card-text>
                        <v-card-actions class="pa-4">
                          <v-spacer></v-spacer>
                          <v-btn variant="text" @click="isMethodDialogVisible = false">取消</v-btn>
                          <v-btn color="secondary" variant="elevated" @click="saveMethod"
                            :disabled="!editedMethodTitle">確認</v-btn>
                        </v-card-actions>
                      </v-card>
                    </v-dialog>

                    <!-- Dialog: Dynamic Fields Editor -->
                    <v-dialog v-model="isDynamicFieldsDialogVisible" max-width="800px" persistent>
                      <v-card>
                        <v-card-title class="bg-info text-white">
                          設定額外欄位：{{ currentConfiguringMethod }}
                        </v-card-title>
                        <v-card-text class="pa-4" style="max-height: 70vh; overflow-y: auto;">
                          <div class="mb-4 text-caption text-grey-darken-1">
                            在此設定使用者選擇此方式後，需填寫的額外資訊 (例如：代驗公司名稱、銀行及分行、承辦人電話等)。
                          </div>
                          <DynamicFieldEditor v-model:fields="tempDynamicFields" />
                        </v-card-text>
                        <v-card-actions class="pa-4 border-t">
                          <v-spacer></v-spacer>
                          <v-btn variant="text" @click="isDynamicFieldsDialogVisible = false">取消</v-btn>
                          <v-btn color="info" variant="elevated" @click="saveDynamicFieldsConfig"
                            :loading="isSavingDynamicFields">暫存設定</v-btn>
                        </v-card-actions>
                      </v-card>
                    </v-dialog>

                    <v-combobox v-model="projectSettings.inspectionStaff" label="編輯人員" multiple chips closable-chips
                      variant="outlined" density="compact" hint="在此新增修改工作人員" persistent-hint
                      class="mt-6 mb-6"></v-combobox>

                    <v-divider class="my-6"></v-divider>

                    <!-- NEW: Capacity Groups Configuration -->
                    <div class="mb-4">
                      <div class="d-flex align-center justify-space-between mb-2">
                        <p class="text-subtitle-1 font-weight-bold mb-0">預約名額計算群組設定</p>
                        <v-btn color="primary" size="small" prepend-icon="mdi-plus"
                          @click="addCapacityGroup">新增群組</v-btn>
                      </div>
                      <p class="text-caption text-grey-darken-1 mb-4">
                        在此設定哪些預約項目的名額要「合併計算」。例如：設定一個群組包含【初驗、複驗】，代表這兩者在同一時段會共用名額上限。未加入任何群組的項目，將預設為**獨立計算**名額。
                      </p>

                      <div
                        v-if="!projectSettings.bookingCapacityGroups || projectSettings.bookingCapacityGroups.length === 0"
                        class="text-center text-grey pa-6 border rounded border-dashed">
                        <v-icon size="40" color="grey-lighten-1" class="mb-2">mdi-account-group-outline</v-icon>
                        <p>目前所有預約項目皆為「獨立計算」名額</p>
                      </div>

                      <div v-else class="d-flex flex-column gap-3">
                        <v-card v-for="(group, groupIndex) in projectSettings.bookingCapacityGroups" :key="groupIndex"
                          variant="outlined" class="bg-grey-lighten-5">
                          <v-card-title class="d-flex align-center py-2 text-subtitle-2">
                            <v-icon size="small" class="mr-2" color="primary">mdi-set-merge</v-icon>
                            群組 {{ groupIndex + 1 }}
                            <v-spacer></v-spacer>
                            <v-btn icon="mdi-delete" variant="text" size="small" color="error"
                              @click="removeCapacityGroup(groupIndex)"></v-btn>
                          </v-card-title>
                          <v-divider></v-divider>
                          <v-card-text class="pa-3">
                            <v-combobox v-model="projectSettings.bookingCapacityGroups[groupIndex].types"
                              :items="availableBookingTypes" label="選擇要合併計算的預約項目" multiple chips closable-chips
                              variant="outlined" density="compact" hide-details></v-combobox>
                          </v-card-text>
                        </v-card>
                      </div>
                    </div>

                    <div class="mb-4"></div>
                  </v-window-item>

                  <!-- 新增 Tab: 頁面LOGO及授權書設定 -->
                  <v-window-item value="shared-page-settings" transition="fade-transition"
                    reverse-transition="fade-transition">

                    <p class="text-subtitle-1 font-weight-bold mb-2">預約系統首頁Logo上傳</p>
                    <div class="text-caption text-grey mb-2">建議尺寸 1800*500px</div>
                    <v-sheet border rounded class="pa-4 text-center">
                      <v-img :src="projectSettings.logoUrl" height="60" contain class="mb-4 bg-grey-lighten-4">
                        <template v-slot:placeholder>
                          <div class="d-flex align-center justify-center fill-height">
                            <span class="text-grey-darken-1">圖片檔案大小請勿超過 1MB</span>
                          </div>
                        </template>
                      </v-img>
                      <v-file-input label="選擇 Logo 圖片" accept="image/*" variant="outlined" density="compact"
                        prepend-icon="mdi-camera" hide-details @change="handleLogoUpload"></v-file-input>
                    </v-sheet>

                    <v-divider class="my-6"></v-divider>

                    <!-- 驗屋授權書範本編輯器 -->
                    <v-card variant="outlined" class="mb-6">
                      <v-card-text>
                        <div class="d-flex align-center justify-space-between mb-4">
                          <div>
                            <div class="text-subtitle-1 font-weight-bold d-flex align-center">
                              <v-icon start color="teal">mdi-file-document-edit-outline</v-icon>
                              驗屋授權書格式設定
                              <v-chip v-if="!isAdmin" size="x-small" color="grey" variant="flat"
                                class="ml-2 text-white">
                                <v-icon start size="x-small">mdi-eye-lock-outline</v-icon>
                                僅供預覽
                              </v-chip>
                            </div>
                            <div class="text-caption text-grey-darken-1">
                              {{ isAdmin ? '設定受託人簽署時所看到的授權書內容與版面配置。' : '以下為目前授權書範本的預覽，如需修改請聯繫系統管理員。' }}
                            </div>
                          </div>
                          <!-- 管理員：三段式切換按鈕 -->
                          <v-btn-toggle v-if="isAdmin" v-model="authLetterEditMode" mandatory density="compact"
                            color="primary" variant="outlined">
                            <v-btn value="form" prepend-icon="mdi-form-textbox">表單編輯</v-btn>
                            <v-btn value="html" prepend-icon="mdi-code-tags">HTML 原始碼</v-btn>
                            <v-btn value="preview" prepend-icon="mdi-eye">預覽</v-btn>
                          </v-btn-toggle>
                        </div>

                        <!-- ====== 模式 1：表單編輯（對一般用戶友善） ====== -->
                        <v-expand-transition>
                          <div v-if="isAdmin && authLetterEditMode === 'form'">
                            <v-alert type="info" variant="tonal" density="compact" class="mb-4" closable>
                              <v-icon start size="small">mdi-lightbulb-outline</v-icon>
                              修改下方欄位後，點擊「套用至範本」即可自動產生授權書 HTML，支援使用 <code>{變數名稱}</code> 動態帶入資料。
                            </v-alert>

                            <v-row dense>
                              <v-col cols="12">
                                <div class="text-subtitle-2 font-weight-medium mb-1 d-flex align-center">
                                  <v-icon size="small" class="mr-1" color="teal">mdi-text-box-outline</v-icon>
                                  宣告文 (開場)
                                </div>
                                <v-textarea v-model="authLetterFields.declaration" variant="outlined" rows="3" auto-grow
                                  density="compact" placeholder="茲因本人 (委託人) {委託人姓名} 不克親自辦理..."
                                  hint="可使用變數：{委託人姓名}、{建案名稱}、{受託人姓名}、{與委託人關係}" persistent-hint></v-textarea>
                              </v-col>
                              <v-col cols="12">
                                <div class="text-subtitle-2 font-weight-medium mb-1 d-flex align-center">
                                  <v-icon size="small" class="mr-1" color="teal">mdi-shield-check-outline</v-icon>
                                  授權範圍 (中段內文)
                                </div>
                                <v-textarea v-model="authLetterFields.scope" variant="outlined" rows="3" auto-grow
                                  density="compact" placeholder="受託人得代理委託人全權處理上述房地產之驗屋、點交相關作業..."></v-textarea>
                              </v-col>
                              <v-col cols="12" sm="6">
                                <div class="text-subtitle-2 font-weight-medium mb-1 d-flex align-center">
                                  <v-icon size="small" class="mr-1" color="teal">mdi-pen</v-icon>
                                  結語 - 致函對象
                                </div>
                                <v-text-field v-model="authLetterFields.closing" variant="outlined" density="compact"
                                  placeholder="{建案名稱} 專案團隊" hint="可使用變數：{建案名稱}" persistent-hint></v-text-field>
                              </v-col>
                            </v-row>

                            <v-divider class="my-4"></v-divider>
                            <div class="d-flex align-center gap-2">
                              <v-btn variant="tonal" color="primary" prepend-icon="mdi-content-save-outline"
                                @click="applyAuthLetterFieldsToTemplate">
                                套用至範本
                              </v-btn>
                              <v-btn variant="tonal" color="warning" prepend-icon="mdi-restore"
                                @click="loadDefaultAuthLetterTemplate">
                                還原系統預設範本
                              </v-btn>
                              <v-spacer></v-spacer>
                              <span class="text-caption text-grey">修改後請記得儲存設定</span>
                            </div>
                          </div>
                        </v-expand-transition>

                        <!-- ====== 模式 2：HTML 原始碼編輯（進階使用者） ====== -->
                        <v-expand-transition>
                          <div v-if="isAdmin && authLetterEditMode === 'html'">
                            <v-alert type="warning" variant="tonal" density="compact" class="mb-3">
                              <v-icon start size="small">mdi-alert-outline</v-icon>
                              進階模式：直接編輯 HTML 原始碼，可完全自訂表單欄位。修改後請切換至"預覽"確認效果。
                            </v-alert>
                            <div class="d-flex flex-wrap align-center mb-2 gap-2">
                              <span class="text-caption font-weight-medium">可用變數：</span>
                              <v-chip size="x-small" variant="tonal"> {建案名稱}</v-chip>
                              <v-chip size="x-small" variant="tonal"> {戶別}</v-chip>
                              <v-chip size="x-small" variant="tonal"> {委託人姓名}</v-chip>
                              <v-chip size="x-small" variant="tonal"> {受託人姓名}</v-chip>
                              <v-chip size="x-small" variant="tonal"> {委託人身分證字號}</v-chip>
                              <v-chip size="x-small" variant="tonal"> {受託人身分證字號}</v-chip>
                              <v-chip size="x-small" variant="tonal" color="orange"> {與委託人關係}</v-chip>
                              <v-chip size="x-small" variant="tonal"> {TODAY}</v-chip>
                              <v-chip size="x-small" variant="tonal" color="primary"> {logoUrl}</v-chip>
                              <v-chip size="x-small" variant="tonal" color="primary"> {委託人簽名圖檔}</v-chip>
                              <v-chip size="x-small" variant="tonal" color="primary"> {受託人簽名圖檔}</v-chip>
                              <v-spacer></v-spacer>
                              <v-btn size="x-small" variant="tonal" color="warning"
                                @click="loadDefaultAuthLetterTemplate">載入系統預設範本</v-btn>
                            </div>
                            <v-textarea v-model="projectSettings.authLetterTemplate" variant="outlined" rows="15"
                              auto-grow bg-color="grey-lighten-4" placeholder="請輸入 HTML 格式的授權書範本..."
                              class="font-mono text-body-2"></v-textarea>
                          </div>
                        </v-expand-transition>

                        <!-- ====== 模式 3：預覽模式（管理員預覽 or 非管理員唯讀預覽） ====== -->
                        <div v-if="!isAdmin || authLetterEditMode === 'preview'">
                          <v-alert v-if="!isAdmin" type="info" variant="tonal" density="compact" class="mb-4">
                            <v-icon start>mdi-information-outline</v-icon>
                            此為唯讀預覽模式，您可以查看目前授權書的版面配置，但無法進行編輯。
                          </v-alert>
                          <div class="border rounded pa-4 bg-white preview-container" v-html="authLetterPreviewHtml">
                          </div>
                          <div class="text-caption text-center text-grey mt-2">
                            <v-icon size="small" class="mr-1">mdi-information-outline</v-icon>此為系統帶入測試資料後的預覽結果。簽名圖片僅供示意。
                          </div>
                        </div>
                      </v-card-text>
                    </v-card>
                  </v-window-item>

                  <!-- Tab 3: 預約頁面設定 -->
                  <v-window-item value="content" transition="fade-transition" reverse-transition="fade-transition">
                    <div v-if="!projectSettings.bookingMenu || projectSettings.bookingMenu.length === 0"
                      class="text-center text-grey pa-6 border rounded border-dashed my-6">
                      <v-icon size="48" color="grey-lighten-1" class="mb-2">mdi-file-tree</v-icon>
                      <p>尚未建立預約選單結構，請先至「預約選單與人員」分頁新增預約項目。</p>
                    </div>
                    <div v-else>
                      <p class="text-subtitle-1 font-weight-bold mb-2">請選擇要設定的預約項目：</p>
                      <v-chip-group v-model="selectedBookingItemForSetting" selected-class="bg-primary text-white"
                        mandatory column class="mb-4">
                        <v-chip v-for="item in activeBookingMenu" :key="item.title" :value="item.title"
                          variant="outlined">{{
                            item.title }}</v-chip>
                      </v-chip-group>

                      <div
                        v-if="selectedBookingItemForSetting && projectSettings.pageSettingsByItem && projectSettings.pageSettingsByItem[selectedBookingItemForSetting]">

                        <v-text-field
                          v-model="projectSettings.pageSettingsByItem[selectedBookingItemForSetting].pageTitle"
                          label="預約頁面大標題" variant="outlined" density="compact" hint="顯示在預約頁面最上方的標題文字" persistent-hint
                          class="mt-2"></v-text-field>



                        <p class="text-subtitle-1 font-weight-bold mb-2">預約說明設定</p>
                        <v-switch
                          v-model="projectSettings.pageSettingsByItem[selectedBookingItemForSetting].intro.alert.show"
                          label="顯示預約說明" color="primary" inset
                          @update:model-value="(val) => { if (!val) projectSettings.pageSettingsByItem[selectedBookingItemForSetting].intro.alert.showConfirmation = false; }"></v-switch>
                        <v-switch
                          v-model="projectSettings.pageSettingsByItem[selectedBookingItemForSetting].intro.alert.showConfirmation"
                          label="須勾選「我已閱讀」後才可開始預約" color="primary" inset persistent-hint
                          :disabled="!projectSettings.pageSettingsByItem[selectedBookingItemForSetting].intro.alert.show"></v-switch>
                        <v-text-field
                          v-model="projectSettings.pageSettingsByItem[selectedBookingItemForSetting].intro.alert.title"
                          label="預約說明標題" variant="outlined" density="compact" class="mt-2"
                          :disabled="!projectSettings.pageSettingsByItem[selectedBookingItemForSetting].intro.alert.show"></v-text-field>
                        <div class="d-flex align-center"> <label class="v-label text-caption">提示框內容</label>
                          <v-btn size="x-small" variant="tonal" @click="applyTemplate('alertText')"
                            :disabled="!projectSettings.pageSettingsByItem[selectedBookingItemForSetting].intro.alert.show"
                            class="ml-4">套用範本</v-btn>
                        </div>
                        <RichTextEditor
                          v-model="projectSettings.pageSettingsByItem[selectedBookingItemForSetting].intro.alert.text"
                          class="mb-4"
                          :disabled="!projectSettings.pageSettingsByItem[selectedBookingItemForSetting].intro.alert.show" />

                        <v-divider class="my-6"></v-divider>

                        <!-- 聯絡資訊設定 -->
                        <p class="text-subtitle-1 font-weight-bold mb-2">聯絡資訊設定</p>
                        <v-alert type="warning" variant="tonal" density="compact" class="mb-4" border="start">
                          此處設定的聯絡單位名稱及電話，將會顯示於<strong>公開預約網站頁面</strong>及系統發送的<strong>通知 EMAIL</strong> 中，請確認資訊正確。
                        </v-alert>
                        <v-text-field
                          v-model="projectSettings.pageSettingsByItem[selectedBookingItemForSetting].intro.contact.name"
                          label="聯絡單位名稱" variant="outlined" density="compact"></v-text-field>
                        <v-text-field
                          v-model="projectSettings.pageSettingsByItem[selectedBookingItemForSetting].intro.contact.phone"
                          label="聯絡電話" variant="outlined" density="compact" class="mt-2"></v-text-field>

                        <v-divider class="my-6"></v-divider>

                        <div class="d-flex align-center mt-2"> <label class="v-label text-caption">招呼語</label>
                          <v-btn size="x-small" variant="tonal" @click="applyTemplate('greeting')"
                            class="ml-4">套用範本</v-btn>
                        </div>
                        <RichTextEditor
                          v-model="projectSettings.pageSettingsByItem[selectedBookingItemForSetting].intro.greeting"
                          class="mb-4" />
                        <div class="d-flex align-center"> <label class="v-label text-caption">內文說明</label>
                          <v-btn size="x-small" variant="tonal" @click="applyTemplate('body')" class="ml-4">套用範本</v-btn>
                        </div>
                        <RichTextEditor
                          v-model="projectSettings.pageSettingsByItem[selectedBookingItemForSetting].intro.body"
                          class="mb-4" />
                        <div class="d-flex align-center"> <label class="v-label text-caption">頁尾文字</label>
                          <v-btn size="x-small" variant="tonal" @click="applyTemplate('footer')"
                            class="ml-4">套用範本</v-btn>
                        </div>
                        <RichTextEditor
                          v-model="projectSettings.pageSettingsByItem[selectedBookingItemForSetting].intro.footer"
                          class="mb-4" />
                        <div class="d-flex align-center"> <label class="v-label text-caption">結束語</label>
                          <v-btn size="x-small" variant="tonal" @click="applyTemplate('closingText')"
                            class="ml-4">套用範本</v-btn>
                        </div>
                        <RichTextEditor
                          v-model="projectSettings.pageSettingsByItem[selectedBookingItemForSetting].intro.closingText"
                          class="mb-4" />

                        <v-divider class="my-6"></v-divider>

                        <!-- 日期選擇提醒事項 -->
                        <p class="text-subtitle-1 font-weight-bold mb-2">
                          <v-icon start size="small" color="warning">mdi-calendar-alert</v-icon>
                          日期選擇提醒事項
                        </p>
                        <p class="text-caption text-grey-darken-1 mb-2">
                          此內容將顯示在前台「步驟二：選擇預約日期」的日期選擇器上方，以醒目的提示框呈現。
                        </p>
                        <v-switch
                          v-model="projectSettings.pageSettingsByItem[selectedBookingItemForSetting].intro.datePickerReminder.show"
                          label="顯示日期選擇提醒事項" color="warning" inset hide-details class="mb-2"></v-switch>
                        <RichTextEditor
                          v-model="projectSettings.pageSettingsByItem[selectedBookingItemForSetting].intro.datePickerReminder.content"
                          class="mb-4"
                          :disabled="!projectSettings.pageSettingsByItem[selectedBookingItemForSetting].intro.datePickerReminder.show" />

                        <v-divider class="my-6"></v-divider>

                        <div class="d-flex justify-space-between align-center mb-2">
                          <p class="text-subtitle-1 font-weight-bold">常見問答 (FAQ) 設定</p>
                          <v-btn color="primary" size="small" @click="addFaqItem" prepend-icon="mdi-plus">新增問答</v-btn>
                        </div>
                        <div
                          v-if="projectSettings.pageSettingsByItem[selectedBookingItemForSetting].intro.faq.length === 0"
                          class="text-center text-grey pa-4 border rounded">
                          點擊「新增問答」來建立 FAQ
                        </div>
                        <div v-else>
                          <v-sheet
                            v-for="(item, index) in projectSettings.pageSettingsByItem[selectedBookingItemForSetting].intro.faq"
                            :key="index" border rounded class="pa-4 mb-4 faq-panel">
                            <div class="d-flex justify-space-between align-center mb-3">
                              <span class="font-weight-bold">問題 {{ index + 1 }}</span>
                              <v-btn icon="mdi-delete-outline" variant="text" color="error" size="small"
                                @click="removeFaqItem(index)"></v-btn>
                            </div>
                            <div class="d-flex justify-space-between align-center mb-1">
                              <label class="v-label text-caption">問題 (Q)</label>
                            </div>
                            <RichTextEditor v-model="item.q" class="mb-3"></RichTextEditor>

                            <div class="d-flex justify-space-between align-center mt-2 mb-1">
                              <label class="v-label text-caption">回答 (A)</label>
                            </div>
                            <RichTextEditor v-model="item.a" class="mt-1"></RichTextEditor>
                          </v-sheet>
                        </div>



                        <p class="text-h6 font-weight-bold mb-4">附件管理 (公開預約頁)</p>

                        <v-switch
                          v-model="projectSettings.pageSettingsByItem[selectedBookingItemForSetting].intro.showAttachments"
                          label="在公開預約頁面顯示附件區塊" color="primary" inset hint="啟用後，下方上傳的附件將顯示在預約頁面供客戶下載" persistent-hint
                          class="mb-4"></v-switch>

                        <v-file-input v-model="filesToUpload" label="選擇要上傳的附件 (圖片或 PDF)" multiple accept="image/*,.pdf"
                          variant="outlined" density="compact" prepend-icon="mdi-paperclip" chips show-size counter
                          class="mb-2"></v-file-input>

                        <v-btn color="indigo" variant="flat" @click="uploadAttachments"
                          :loading="isUploadingAttachments" :disabled="!filesToUpload || filesToUpload.length === 0"
                          prepend-icon="mdi-upload" class="mb-4">
                          上傳選取的附件
                        </v-btn>

                        <p class="text-subtitle-1 font-weight-medium mb-2">已上傳的附件：</p>
                        <div
                          v-if="!projectSettings.pageSettingsByItem[selectedBookingItemForSetting].intro.attachments || projectSettings.pageSettingsByItem[selectedBookingItemForSetting].intro.attachments.length === 0"
                          class="text-center text-grey pa-4 border rounded">
                          尚未上傳任何附件
                        </div>
                        <v-list v-else density="compact" class="border rounded pa-0">
                          <template
                            v-for="(item, index) in projectSettings.pageSettingsByItem[selectedBookingItemForSetting].intro.attachments"
                            :key="item.url || index">
                            <v-list-item>
                              <template v-slot:prepend>
                                <v-icon color="red"
                                  v-if="item.name.toLowerCase().endsWith('.pdf')">mdi-file-pdf-box</v-icon>
                                <v-icon color="grey-darken-1" v-else>mdi-image-outline</v-icon>
                              </template>
                              <v-list-item-title>
                                <a :href="item.url" target="_blank" rel="noopener noreferrer"
                                  class="text-decoration-none text-primary">{{ item.name }}</a>
                              </v-list-item-title>
                              <template v-slot:append>
                                <v-btn icon="mdi-delete-outline" variant="text" color="error" size="small"
                                  @click="deleteAttachment(index)" :loading="isDeletingAttachment === index"></v-btn>
                              </template>
                            </v-list-item>
                            <v-divider
                              v-if="index < projectSettings.pageSettingsByItem[selectedBookingItemForSetting].intro.attachments.length - 1"></v-divider>
                          </template>
                        </v-list>
                      </div>
                    </div>

                  </v-window-item>

                  <!-- Tab 4: 驗屋報告上傳設定 -->
                  <v-window-item value="report-settings" transition="fade-transition"
                    reverse-transition="fade-transition">
                    <p class="text-h6 font-weight-bold mb-4">上傳頁面設定</p>

                    <v-switch v-model="projectSettings.showReportUploadButton" label="啟用上傳驗屋報告功能" color="primary" inset
                      hint="啟用後，客戶在預約頁面可以看到「上傳驗屋報告」的按鈕" persistent-hint class="mt-4"></v-switch>

                    <!-- 管理員專屬欄位區塊 -->
                    <v-sheet v-if="isAdmin" class="admin-only-section pa-4 mb-4 mt-6" border rounded>
                      <div class="d-flex align-center mb-4">
                        <v-icon color="amber-darken-2" class="mr-2">mdi-shield-crown-outline</v-icon>
                        <span class="text-subtitle-1 font-weight-bold">管理員專屬設定</span>
                        <v-chip size="x-small" color="amber-darken-2" variant="flat" class="ml-2 text-white">Admin
                          Only</v-chip>
                      </div>

                      <p class="text-subtitle-1 font-weight-bold mb-2">驗屋報告上傳網址</p>
                      <v-text-field v-model="projectSettings.reportSettings.uploadReminderEmail.uploadUrl"
                        variant="outlined" density="compact" class="mt-1" placeholder="輸入驗屋報告上傳網址"></v-text-field>

                      <p class="text-subtitle-1 font-weight-bold mt-4 mb-2">驗屋報告資料夾</p>
                      <v-text-field v-model="projectSettings.reportSettings.reportDataFolderUrl" variant="outlined"
                        density="compact" class="mt-1" placeholder="輸入驗屋報告雲端資料夾位置"></v-text-field>

                      <p class="text-subtitle-1 font-weight-bold mt-4 mb-2">LINE驗屋小助理Channel access token</p>
                      <v-text-field v-model="projectSettings.lineChannelAccessTokenSecretName" variant="outlined"
                        density="compact" class="mt-1" placeholder="輸入 Secret Manager 中的密鑰名稱"
                        hint="請輸入用於獲取 LINE Token 的 Secret Name (例如: FUYU141_LINE_TOKEN)" persistent-hint></v-text-field>

                      <p class="text-subtitle-1 font-weight-bold mt-4 mb-2">驗屋報告模板</p>
                      <v-text-field v-model="projectSettings.inspectionReportTemplateUrl" variant="outlined"
                        density="compact" class="mt-1" placeholder="輸入驗屋報告 Google Slides 模板的 URL"
                        hint="用於自動產製 PDF 報告的樣板 (需包含佔位符)" persistent-hint></v-text-field>
                    </v-sheet>

                    <v-divider class="my-6"></v-divider>

                    <p class="text-subtitle-1 font-weight-bold mb-2">上傳頁說明</p>
                    <RichTextEditor v-model="projectSettings.reportUploadIntro.body" class="mb-6" />

                    <v-divider class="my-6"></v-divider>

                    <div class="d-flex align-center mb-2">
                      <p class="text-subtitle-1 font-weight-bold">上傳須知提示框</p>
                      <v-btn size="small" variant="tonal" class="ml-4" @click="isAlertPreviewDialogVisible = true"
                        prepend-icon="mdi-eye-outline">預覽</v-btn>
                    </div>
                    <v-switch v-model="projectSettings.reportUploadIntro.alert.show" label="顯示提示框" color="primary"
                      inset></v-switch>
                    <v-text-field v-model="projectSettings.reportUploadIntro.alert.title" label="提示框標題"
                      variant="outlined" density="compact" class="mt-4"
                      :disabled="!projectSettings.reportUploadIntro.alert.show"></v-text-field>
                    <v-row class="mt-2">
                      <v-col cols="12" sm="6">
                        <v-select v-model="projectSettings.reportUploadIntro.alert.type"
                          :items="['info', 'success', 'warning', 'error']" label="提示框樣式 (Type)" variant="outlined"
                          density="compact" :disabled="!projectSettings.reportUploadIntro.alert.show"></v-select>
                      </v-col>
                      <v-col cols="12" sm="6">
                        <v-select v-model="projectSettings.reportUploadIntro.alert.color"
                          :items="['primary', 'info', 'success', 'warning', 'error', 'red', 'blue']"
                          label="提示框顏色 (Color)" variant="outlined" density="compact"
                          :disabled="!projectSettings.reportUploadIntro.alert.show"></v-select>
                      </v-col>
                    </v-row>
                    <label class="v-label text-caption mt-2">提示框內容</label>
                    <RichTextEditor v-model="projectSettings.reportUploadIntro.alert.text" class="mt-2 mb-6"
                      :disabled="!projectSettings.reportUploadIntro.alert.show" />

                    <v-divider class="my-8"></v-divider>

                    <p class="text-h6 font-weight-bold mb-4">自動化提醒設定</p>

                    <p class="text-subtitle-1 font-weight-bold mb-2">提醒上傳驗屋報告</p>

                    <v-select v-model="projectSettings.reportSettings.uploadReminderInspectionMethods"
                      :items="allInspectionMethodOptions" label="適用提醒的選擇方式" hint="選擇哪些預約方式需要發送未上傳報告提醒（未選擇則不發送）"
                      persistent-hint multiple chips closable-chips variant="outlined" density="compact" class="mb-4"
                      no-data-text="請先至『預約選單與人員』分頁建立預約項目及選擇方式"></v-select>

                    <v-combobox v-model="projectSettings.reportSettings.uploadReminderDays"
                      :items="[7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20]" label="驗屋完成後，間隔幾天後發送通知"
                      hint="可多選或手動輸入天數後按 Enter" persistent-hint multiple chips closable-chips variant="outlined"
                      density="compact"></v-combobox>

                    <p class="text-subtitle-1 font-weight-bold mt-6 mb-2">通知方式</p>
                    <div>
                      <v-checkbox v-model="projectSettings.reportSettings.uploadReminderMethods" label="Email"
                        value="EMAIL" density="compact" hide-details class="d-inline-block mr-4"></v-checkbox>
                      <v-checkbox v-model="projectSettings.reportSettings.uploadReminderMethods" label="LINE(功能尚未開放)"
                        value="LINE" density="compact" hide-details class="d-inline-block"></v-checkbox>
                    </div>



                    <p class="text-subtitle-1 font-weight-bold mt-6 mb-2">客戶未上傳報告 - 每日提醒排程</p>
                    <p class="text-body-2 text-medium-emphasis mb-4">
                      設定每日自動檢查並發送提醒的固定時間點。
                    </p>
                    <v-sheet border rounded class="pa-4">
                      <v-switch v-model="projectSettings.reportSettings.uploadReminderSchedule.enabled" label="啟用每日提醒排程"
                        color="primary" inset hide-details class="mb-2"></v-switch>
                      <v-text-field v-model="projectSettings.reportSettings.uploadReminderSchedule.time" label="每日提醒時間"
                        type="time" density="compact" variant="outlined" hide-details
                        :disabled="!projectSettings.reportSettings.uploadReminderSchedule.enabled"
                        style="max-width: 150px;"></v-text-field>
                    </v-sheet>

                    <v-btn @click="runManualTrigger" :loading="isTesting" color="error" variant="elevated" class="ma-4">
                      <v-icon start>mdi-send-clock-outline</v-icon>
                      手動提醒
                    </v-btn>

                    <v-divider class="my-6"></v-divider>

                    <div class="d-flex align-center justify-space-between mb-2">
                      <p class="text-subtitle-1 font-weight-bold mb-0">未上傳驗屋報告 EMAIL 通知格式</p>
                      <v-btn size="small" variant="tonal" color="primary" prepend-icon="mdi-eye-outline"
                        @click="isEmailPreviewDialogVisible = true">預覽 EMAIL</v-btn>
                    </div>
                    <p class="text-body-2 text-medium-emphasis mb-4">
                      若您需要協助設定請洽詢ANXI安熙系統管理員。
                    </p>
                    <div class="d-flex align-center">
                      <label class="v-label text-caption">主旨</label>
                      <v-btn size="x-small" variant="tonal" @click="applyTemplate('uploadReminderEmailSubject')"
                        class="ml-4">套用範本</v-btn>
                    </div>
                    <v-text-field v-model="projectSettings.reportSettings.uploadReminderEmail.subject"
                      variant="outlined" density="compact" class="mt-1"></v-text-field>

                    <div class="d-flex align-center mt-4">
                      <label class="v-label text-caption">內文</label>
                      <v-btn size="x-small" variant="tonal" @click="applyTemplate('uploadReminderEmailBody')"
                        class="ml-4">套用範本</v-btn>
                    </div>
                    <RichTextEditor v-model="projectSettings.reportSettings.uploadReminderEmail.body" class="mt-1"
                      :placeholders="emailPlaceholders" />

                    <div class="d-flex align-center mt-4">
                      <label class="v-label text-caption">提醒</label>
                      <v-btn size="x-small" variant="tonal" @click="applyTemplate('uploadReminderEmailReminder')"
                        class="ml-4">套用範本</v-btn>
                    </div>
                    <RichTextEditor v-model="projectSettings.reportSettings.uploadReminderEmail.reminder" class="mt-1"
                      :placeholders="emailPlaceholders" />





                    <!-- Email 預覽 Dialog -->
                    <v-dialog v-model="isEmailPreviewDialogVisible" max-width="700px">
                      <v-card>
                        <v-card-title class="bg-grey-darken-3 text-white d-flex align-center">
                          <v-icon start>mdi-email-outline</v-icon>
                          EMAIL 預覽
                          <v-spacer></v-spacer>
                          <v-btn icon variant="text" @click="isEmailPreviewDialogVisible = false">
                            <v-icon color="white">mdi-close</v-icon>
                          </v-btn>
                        </v-card-title>
                        <v-card-text class="pa-0">
                          <!-- 主旨預覽 -->
                          <div class="pa-4 bg-grey-lighten-4 border-b">
                            <div class="d-flex align-center mb-1">
                              <span class="text-caption text-grey-darken-1 mr-2">主旨：</span>
                              <span class="text-body-2 font-weight-bold">{{ emailPreviewSubject }}</span>
                            </div>
                            <div class="d-flex align-center">
                              <span class="text-caption text-grey-darken-1 mr-2">收件人：</span>
                              <span class="text-caption">wang@example.com</span>
                            </div>
                          </div>
                          <!-- 內文預覽 -->
                          <div class="email-preview-wrapper" v-html="emailPreviewHtml"></div>
                        </v-card-text>
                        <v-divider></v-divider>
                        <v-card-actions class="pa-3 bg-grey-lighten-4">
                          <v-alert type="info" variant="tonal" density="compact" class="flex-grow-1 mr-2"
                            style="font-size: 12px;">
                            <v-icon start size="small">mdi-information-outline</v-icon>
                            此為測試資料預覽，實際發送時將帶入用戶真實資料。
                          </v-alert>
                          <v-btn color="primary" variant="flat" @click="isEmailPreviewDialogVisible = false">關閉</v-btn>
                        </v-card-actions>
                      </v-card>
                    </v-dialog>

                    <v-divider class="my-8"></v-divider>

                    <p class="text-h6 font-weight-bold mb-4">排程設定</p>

                    <!-- 驗屋報告未下載通知 -->
                    <v-card variant="outlined" class="mb-4">
                      <v-card-title class="bg-grey-lighten-4 d-flex align-center">
                        <v-icon start color="green">mdi-bell-ring-outline</v-icon>
                        驗屋報告未下載通知
                      </v-card-title>
                      <v-card-text class="pa-4">
                        <v-alert type="info" variant="tonal" density="compact" class="mb-4" border="start">
                          設定系統每週固定檢查的時間點。當系統發現有報告未下載時，將會透過 LINE 觸發通知給有權限的人員。
                        </v-alert>

                        <v-sheet border rounded class="pa-4">
                          <div v-for="day in weekDays" :key="day.key" class="d-flex align-center my-2">
                            <v-checkbox
                              v-model="projectSettings.reportSettings.notDownloadedReminderSchedule[day.key].enabled"
                              :label="day.label" density="compact" hide-details class="flex-shrink-0"
                              style="width: 120px;"></v-checkbox>

                            <v-select
                              v-model="projectSettings.reportSettings.notDownloadedReminderSchedule[day.key].time"
                              :items="scheduleTimeOptions" density="compact" variant="outlined" hide-details
                              :disabled="!projectSettings.reportSettings.notDownloadedReminderSchedule[day.key].enabled"
                              style="max-width: 150px;"></v-select>
                          </div>
                        </v-sheet>
                      </v-card-text>
                      <v-divider></v-divider>
                      <v-card-actions class="pa-4">
                        <v-btn @click="handleManualLineNotification" :loading="isLoadingRecipients" color="green"
                          variant="elevated" prepend-icon="mdi-send">
                          手動通知 (LINE)
                        </v-btn>
                      </v-card-actions>
                    </v-card>

                    <!-- LINE 通知對象選擇 Dialog -->
                    <v-dialog v-model="isRecipientDialogOpen" max-width="650px" persistent>
                      <v-card>
                        <v-card-title class="bg-green-darken-1 text-white d-flex align-center">
                          <v-icon start>mdi-account-check-outline</v-icon>
                          選擇通知對象
                          <v-spacer></v-spacer>
                          <v-btn icon variant="text" @click="isRecipientDialogOpen = false"
                            :disabled="isSendingLineNotification">
                            <v-icon>mdi-close</v-icon>
                          </v-btn>
                        </v-card-title>

                        <v-card-text class="pa-4" style="max-height: 60vh; overflow-y: auto;">
                          <!-- 載入中 -->
                          <div v-if="isLoadingRecipients" class="text-center pa-8">
                            <v-progress-circular indeterminate color="green"></v-progress-circular>
                            <p class="mt-3 text-grey-darken-1">正在查詢通知對象...</p>
                          </div>

                          <!-- 無資料 -->
                          <div v-else-if="recipientList.length === 0" class="text-center pa-8 text-grey-darken-1">
                            <v-icon size="48" class="mb-2">mdi-account-off-outline</v-icon>
                            <p>找不到擁有「LINE通知驗屋報告未下載」權限的使用者。</p>
                            <p class="text-caption">請先至權限管理（userPermissions）為使用者新增此權限。</p>
                          </div>

                          <!-- 名單列表 -->
                          <div v-else>
                            <v-alert type="info" variant="tonal" density="compact" class="mb-3">
                              共 {{ recipientList.length }} 位擁有權限，其中 {{ validRecipientCount }} 位已綁定 LINE。
                              已勾選 <strong>{{ selectedLineIds.length }}</strong> 位將接收通知。
                            </v-alert>

                            <!-- 全選 / 取消全選 -->
                            <div class="d-flex align-center mb-2">
                              <v-checkbox :model-value="isAllValidSelected" @update:model-value="toggleSelectAll"
                                label="全選可通知對象" density="compact" hide-details color="green"></v-checkbox>
                            </div>

                            <v-divider class="mb-2"></v-divider>

                            <v-list density="compact" class="pa-0">
                              <v-list-item v-for="recipient in recipientList" :key="recipient.phone"
                                :class="{ 'bg-grey-lighten-4': !recipient.hasLineBinding }">
                                <template v-slot:prepend>
                                  <v-checkbox :model-value="selectedRecipients.includes(recipient.phone)"
                                    @update:model-value="val => {
                                      if (val) {
                                        selectedRecipients.push(recipient.phone);
                                      } else {
                                        const idx = selectedRecipients.indexOf(recipient.phone);
                                        if (idx > -1) selectedRecipients.splice(idx, 1);
                                      }
                                    }" :disabled="!recipient.hasLineBinding" density="compact" hide-details
                                    color="green"></v-checkbox>
                                </template>

                                <v-list-item-title class="d-flex align-center">
                                  <span class="font-weight-medium">{{ recipient.name }}</span>
                                  <v-chip v-if="recipient.hasLineBinding" size="x-small" color="green" variant="tonal"
                                    class="ml-2">
                                    <v-icon start size="12">mdi-check-circle</v-icon>
                                    LINE 已綁定
                                  </v-chip>
                                  <v-chip v-else size="x-small" color="grey" variant="tonal" class="ml-2">
                                    <v-icon start size="12">mdi-close-circle</v-icon>
                                    未綁定 LINE
                                  </v-chip>
                                </v-list-item-title>
                                <v-list-item-subtitle>{{ recipient.phone }}</v-list-item-subtitle>
                              </v-list-item>
                            </v-list>
                          </div>
                        </v-card-text>

                        <v-divider></v-divider>
                        <v-card-actions class="pa-4">
                          <v-btn variant="text" @click="isRecipientDialogOpen = false"
                            :disabled="isSendingLineNotification">取消</v-btn>
                          <v-spacer></v-spacer>
                          <v-btn color="green" variant="elevated" :loading="isSendingLineNotification"
                            :disabled="selectedLineIds.length === 0" prepend-icon="mdi-send"
                            @click="confirmSendLineNotification">
                            發送通知 ({{ selectedLineIds.length }} 人)
                          </v-btn>
                        </v-card-actions>
                      </v-card>
                    </v-dialog>


                  </v-window-item>

                  <!-- Tab 5: 客戶回傳功能 -->
                  <v-window-item value="customer-messages" transition="fade-transition"
                    reverse-transition="fade-transition">
                    <v-toolbar flat color="transparent" class="mb-4">
                      <v-toolbar-title class="text-h6 font-weight-bold">客戶回傳功能設定</v-toolbar-title>
                      <v-spacer></v-spacer>
                      <v-btn color="primary" @click="openCustomerMessageDialog()" prepend-icon="mdi-plus">新增功能</v-btn>
                    </v-toolbar>

                    <v-row>
                      <v-col v-for="(config, index) in projectSettings.customerMessageConfigs || []" :key="config.id"
                        cols="12" md="6" lg="4">
                        <v-card variant="outlined" class="h-100">
                          <v-card-title class="d-flex justify-space-between align-center">
                            <span>{{ config.functionName }}</span>
                            <v-chip size="small" :color="config.enableIdVerification ? 'green' : 'grey'">
                              {{ config.enableIdVerification ? '需驗證身分' : '免驗證' }}
                            </v-chip>
                          </v-card-title>
                          <v-card-subtitle class="mb-2">
                            按鈕文字: {{ config.buttonText }}
                          </v-card-subtitle>
                          <v-card-text>
                            <div class="d-flex flex-wrap gap-2 mb-2">
                              <v-chip size="x-small" v-if="config.enableBuildingSelect">棟別選單</v-chip>
                              <v-chip size="x-small" v-if="config.enableUnitSelect">戶別選單</v-chip>
                              <v-chip size="x-small" v-if="config.enableFileUpload">附件上傳</v-chip>
                            </div>
                            <div class="text-caption text-grey">
                              自訂欄位: {{ config.customFields ? config.customFields.length : 0 }} 個
                            </div>
                          </v-card-text>
                          <v-divider></v-divider>
                          <v-card-actions>
                            <v-spacer></v-spacer>
                            <v-btn color="primary" variant="text" size="small"
                              @click="openCustomerMessageDialog(config, index)">編輯</v-btn>
                            <v-btn color="error" variant="text" size="small"
                              @click="deleteCustomerMessageConfig(index)">刪除</v-btn>
                          </v-card-actions>
                        </v-card>
                      </v-col>
                      <v-col
                        v-if="(!projectSettings.customerMessageConfigs || projectSettings.customerMessageConfigs.length === 0)"
                        cols="12">
                        <div class="text-center text-grey pa-10 border rounded border-dashed">
                          尚未建立任何客戶回傳功能，請點擊右上角新增。
                        </div>
                      </v-col>
                    </v-row>

                    <!-- Customer Message Config Dialog -->
                    <v-dialog v-model="isCustomerMessageDialogOpen" max-width="900px" persistent>
                      <v-card>
                        <v-card-title class="bg-primary text-white">
                          {{ editedCustomerMessageConfig.id ? '編輯' : '新增' }}客戶回傳功能
                        </v-card-title>
                        <v-card-text class="pa-4" style="max-height: 80vh; overflow-y: auto;">
                          <v-row>
                            <v-col cols="12" md="6">
                              <v-text-field v-model="editedCustomerMessageConfig.functionName" label="功能名稱 (辨識用)"
                                placeholder="例如：自覓銀行回傳" variant="outlined" density="compact"
                                :rules="[v => !!v || '必填']"></v-text-field>
                            </v-col>
                            <v-col cols="12" md="6">
                              <v-text-field v-model="editedCustomerMessageConfig.buttonText" label="按鈕顯示文字 (前端顯示)"
                                placeholder="回傳自覓銀行資訊" variant="outlined" density="compact"
                                :rules="[v => !!v || '必填']"></v-text-field>
                            </v-col>
                            <v-col cols="12" md="6">
                              <v-text-field v-model="editedCustomerMessageConfig.dialogTitle" label="對話框標題"
                                placeholder="填寫銀行資訊" variant="outlined" density="compact"></v-text-field>
                            </v-col>
                          </v-row>

                          <div class="text-subtitle-1 font-weight-bold mb-2 mt-2">功能開關</div>
                          <v-sheet border rounded class="pa-3 mb-4">
                            <v-row dense>
                              <v-col cols="12" sm="6">
                                <v-switch v-model="editedCustomerMessageConfig.enableBuildingSelect" label="啟用棟別選單 (必要)"
                                  color="success" density="compact" hide-details></v-switch>
                              </v-col>
                              <v-col cols="12" sm="6">
                                <v-switch v-model="editedCustomerMessageConfig.enableUnitSelect" label="啟用戶別選單 (必要)"
                                  color="success" density="compact" hide-details></v-switch>
                              </v-col>
                              <v-col cols="12" sm="6">
                                <v-switch v-model="editedCustomerMessageConfig.enableIdVerification" label="啟用身分證驗證"
                                  color="success" density="compact" hide-details hint="啟用後需輸入身分證並比對後端權限"
                                  persistent-hint></v-switch>
                              </v-col>
                              <v-col cols="12" sm="6">
                                <v-switch v-model="editedCustomerMessageConfig.enableFileUpload" label="啟用附件上傳"
                                  color="success" density="compact" hide-details hint="單檔30MB，最多10個"
                                  persistent-hint></v-switch>
                              </v-col>
                            </v-row>
                          </v-sheet>

                          <div class="text-subtitle-1 font-weight-bold mb-2 mt-4">自定義欄位</div>
                          <DynamicFieldEditor v-model:fields="editedCustomerMessageConfig.customFields" />

                        </v-card-text>
                        <v-card-actions class="pa-4 border-t">
                          <v-btn color="info" variant="tonal" prepend-icon="mdi-eye"
                            @click="isCustomerMessagePreviewDialogOpen = true">預覽畫面</v-btn>
                          <v-spacer></v-spacer>
                          <v-btn variant="text" @click="isCustomerMessageDialogOpen = false">取消</v-btn>
                          <v-btn color="primary" variant="elevated" @click="saveCustomerMessageConfig">儲存設定</v-btn>
                        </v-card-actions>
                      </v-card>
                    </v-dialog>

                    <!-- Customer Message Preview Dialog -->
                    <v-dialog v-model="isCustomerMessagePreviewDialogOpen" max-width="600px">
                      <v-card>
                        <v-card-title class="bg-info text-white d-flex align-center">
                          <v-icon start>mdi-eye</v-icon>
                          預覽：{{ editedCustomerMessageConfig.dialogTitle || editedCustomerMessageConfig.buttonText }}
                          <v-spacer></v-spacer>
                          <v-btn icon variant="text" @click="isCustomerMessagePreviewDialogOpen = false">
                            <v-icon>mdi-close</v-icon>
                          </v-btn>
                        </v-card-title>
                        <v-card-text class="pa-6" style="max-height: 70vh; overflow-y: auto;">
                          <div class="mb-4 text-center">
                            <v-chip color="info" variant="tonal" size="small">這是預覽畫面，樣式與實際使用時一致</v-chip>
                          </div>

                          <div
                            v-if="editedCustomerMessageConfig.enableBuildingSelect || editedCustomerMessageConfig.enableUnitSelect"
                            class="bg-grey-lighten-4 pa-3 rounded mb-4">
                            <div class="text-caption text-grey-darken-1 mb-2">預設欄位 (已啟用)</div>
                            <v-row dense>
                              <v-col v-if="editedCustomerMessageConfig.enableBuildingSelect" cols="12" sm="6">
                                <v-select label="棟別" variant="outlined" density="comfortable" disabled></v-select>
                              </v-col>
                              <v-col v-if="editedCustomerMessageConfig.enableUnitSelect" cols="12" sm="6">
                                <v-select label="戶別" variant="outlined" density="comfortable" disabled></v-select>
                              </v-col>
                            </v-row>
                          </div>

                          <DynamicFormRenderer :fields="editedCustomerMessageConfig.customFields"
                            v-model="customerMessagePreviewData" />

                          <div v-if="editedCustomerMessageConfig.enableFileUpload"
                            class="mt-4 pa-3 border rounded border-dashed text-center bg-blue-lighten-5">
                            <v-icon color="primary" class="mb-1">mdi-cloud-upload</v-icon>
                            <div class="text-subtitle-2 text-primary font-weight-bold">附件上傳功能已啟用</div>
                            <div class="text-caption text-grey-darken-1">預覽模式下不提供實際檔案上傳</div>
                          </div>
                        </v-card-text>
                        <v-divider></v-divider>
                        <v-card-actions class="pa-4">
                          <v-spacer></v-spacer>
                          <v-btn color="primary" variant="tonal"
                            @click="isCustomerMessagePreviewDialogOpen = false">關閉預覽</v-btn>
                        </v-card-actions>
                      </v-card>
                    </v-dialog>
                  </v-window-item>

                </v-window>
              </v-form>
            </div>

            <v-card-actions class="sticky-actions pa-4">
              <v-spacer></v-spacer>
              <v-btn color="primary" variant="elevated" @click="saveSettings" :loading="isSavingSettings" size="large">
                儲存設定
              </v-btn>
            </v-card-actions>
          </v-window-item>


          <v-window-item value="sheet-sync" class="settings-tab-content">
            <div v-if="isSettingsLoading" class="d-flex justify-center align-center flex-grow-1 pa-10">
              <v-progress-circular indeterminate color="primary"></v-progress-circular>
            </div>
            <div v-else class="settings-form-container pa-4">
              <v-row>
                <v-col cols="12" md="6">
                  <v-card variant="outlined" class="mb-4">
                    <v-card-title class="bg-grey-lighten-4">
                      <v-icon start color="primary">mdi-home-city</v-icon>
                      戶別資料同步 (Households)
                    </v-card-title>
                    <v-card-text class="pa-4">
                      <v-alert type="info" variant="tonal" class="mb-4" density="compact">
                        將 <code>households</code> 集合的資料同步至指定的 Google Sheet。
                        <br>包含欄位：System ID, Updated At, 棟別, 戶號, 買方資訊, 驗屋批次等。
                      </v-alert>
                      <div class="d-flex align-center mb-2">
                        <v-text-field v-model="projectSettings.googleSheetId" label="Google Sheet ID"
                          placeholder="1BxiMVs0XRA5nSLqo..." variant="outlined" density="compact" hide-details
                          class="flex-grow-1"></v-text-field>
                        <v-btn color="primary" variant="text" class="ml-2" :loading="isLoadingTabsHouseholds"
                          @click="fetchSheetTabs('households')" icon="mdi-refresh" title="取得工作表列表"></v-btn>
                      </div>

                      <v-combobox v-model="projectSettings.googleSheetTabName" :items="sheetTabsHouseholds"
                        label="工作表名稱 (Tab Name)" placeholder="請選擇或輸入工作表名稱" variant="outlined" density="compact"
                        class="mb-4"></v-combobox>

                      <v-btn block color="primary" variant="tonal" :loading="isSyncingHouseholds"
                        @click="handleManualSync('households')" prepend-icon="mdi-sync">
                        立即手動同步
                      </v-btn>
                    </v-card-text>
                  </v-card>
                </v-col>

                <v-col cols="12" md="6">
                  <v-card variant="outlined" class="mb-4">
                    <v-card-title class="bg-grey-lighten-4">
                      <v-icon start color="secondary">mdi-calendar-check</v-icon>
                      預約資料同步 (Appointments)
                    </v-card-title>
                    <v-card-text class="pa-4">
                      <v-alert type="info" variant="tonal" class="mb-4" density="compact">
                        將 <code>appointments</code> 集合的資料同步至指定的 Google Sheet。
                        <br>包含欄位：預約代碼, 狀態, 預約人, 時間, 檢驗方式等。
                      </v-alert>
                      <div class="d-flex align-center mb-2">
                        <v-text-field v-model="projectSettings.appointmentsSheetId" label="Google Sheet ID"
                          placeholder="1BxiMVs0XRA5nSLqo..." variant="outlined" density="compact" hide-details
                          class="flex-grow-1" hint="可與戶別資料使用同一個 Sheet ID，但建議區分不同 Tab" persistent-hint></v-text-field>
                        <v-btn color="secondary" variant="text" class="ml-2" :loading="isLoadingTabsAppointments"
                          @click="fetchSheetTabs('appointments')" icon="mdi-refresh" title="取得工作表列表"></v-btn>
                      </div>

                      <v-combobox v-model="projectSettings.appointmentsSheetTabName" :items="sheetTabsAppointments"
                        label="工作表名稱 (Tab Name)" placeholder="請選擇或輸入工作表名稱" variant="outlined" density="compact"
                        class="mb-4"></v-combobox>

                      <v-btn block color="secondary" variant="tonal" :loading="isSyncingAppointments"
                        @click="handleManualSync('appointments')" prepend-icon="mdi-sync">
                        立即手動同步
                      </v-btn>
                    </v-card-text>
                  </v-card>
                </v-col>
              </v-row>

              <v-divider class="my-4"></v-divider>

              <div class="d-flex justify-end">
                <v-btn color="success" variant="elevated" size="large" @click="saveSettings" :loading="isSavingSettings"
                  prepend-icon="mdi-content-save">
                  儲存同步設定
                </v-btn>
              </div>
            </div>
          </v-window-item>

          <!-- 驗屋系統設定（含子 Tabs） -->
          <v-window-item value="inspSystem" v-if="hasInspectionSystemPermission">
            <v-tabs v-model="inspSystemSubTab" color="teal" class="mb-2">
              <v-tab value="inspProjectSettings">棟戶別設定</v-tab>
              <v-tab value="inspCategoriesItems">分類與細項</v-tab>
              <v-tab value="pdfTemplate">報告模板設定</v-tab>
            </v-tabs>
            <v-window v-model="inspSystemSubTab" :touch="false">
              <v-window-item value="inspProjectSettings">
                <InspProjectSettings :project-id="projectId" />
              </v-window-item>
              <v-window-item value="inspCategoriesItems">
                <v-container fluid class="pa-4">
                  <inspCategoriesItems :project-id="projectId" />
                </v-container>
              </v-window-item>
              <v-window-item value="pdfTemplate">
                <PdfTemplateSettings :project-id="projectId" />
              </v-window-item>
            </v-window>
          </v-window-item>


          <v-window-item value="sheet-sync" class="settings-tab-content" v-if="isAdmin">
            <div v-if="isSettingsLoading" class="d-flex justify-center align-center flex-grow-1 pa-10">
              <v-progress-circular indeterminate color="primary"></v-progress-circular>
            </div>

            <div v-else class="settings-form-container pa-4">
              <v-row>
                <v-col cols="12" md="6">
                  <v-card variant="outlined" class="h-100">
                    <v-card-title class="d-flex align-center bg-grey-lighten-4">
                      <v-icon start color="primary">mdi-cog</v-icon>
                      連線設定
                    </v-card-title>
                    <v-card-text class="pt-4">
                      <p class="text-body-2 text-grey-darken-1 mb-4">
                        設定同步目標。系統將會把戶別資料同步到指定的 Google Sheet。
                      </p>

                      <v-text-field v-model="projectSettings.googleSheetId" label="Google Sheet ID" variant="outlined"
                        density="compact" class="mb-2" prepend-inner-icon="mdi-identifier" hint="網址列中 /d/ 後面的字串"
                        persistent-hint>
                        <template v-slot:append>
                          <v-btn color="info" variant="tonal" size="small" :loading="isFetchingSheets"
                            :disabled="!projectSettings.googleSheetId" @click="fetchSheetTabs">取得工作表</v-btn>
                        </template>
                      </v-text-field>

                      <v-select v-model="projectSettings.googleSheetTabName" :items="sheetTabs" label="選擇工作表 (Tab Name)"
                        variant="outlined" density="compact" prepend-inner-icon="mdi-table" hint="請選擇要同步的頁籤"
                        persistent-hint class="mt-4" :disabled="sheetTabs.length === 0"
                        no-data-text="請先輸入 ID 並點擊「取得工作表」"></v-select>

                      <v-alert type="warning" variant="tonal" class="mt-6" density="compact" border="start"
                        icon="mdi-account-key">
                        <div class="text-caption">
                          <strong>授權設定 (必要):</strong><br>
                          請務必將該 Google Sheet "編輯權限" 分享給系統帳號：<br>
                          <code class="d-block mt-1 pa-1 bg-grey-lighten-3 rounded user-select-all">{{ serviceAccountEmail ||
                            '點擊取得工作表以獲取 Email' }}</code>
                        </div>
                      </v-alert>

                      <!-- Sync Status / Result -->
                      <v-alert v-if="syncResult" :type="syncResult.status === 'success' ? 'success' : 'error'"
                        variant="tonal" class="mt-4" density="compact">
                        {{ syncResult.message }}
                      </v-alert>

                    </v-card-text>
                    <v-divider></v-divider>
                    <v-card-actions class="pa-4">
                      <v-spacer></v-spacer>
                      <v-btn color="primary" variant="elevated" @click="handleSyncHouseholds"
                        :loading="isSyncingHouseholds" prepend-icon="mdi-sync"
                        :disabled="!projectSettings.googleSheetId || !projectSettings.googleSheetTabName">
                        儲存設定並立即同步
                      </v-btn>
                    </v-card-actions>
                  </v-card>
                </v-col>

                <v-col cols="12" md="6">
                  <v-card variant="outlined" class="h-100">
                    <v-card-title class="d-flex align-center bg-grey-lighten-4">
                      <v-icon start color="success">mdi-sync</v-icon>
                      手動同步
                    </v-card-title>
                    <v-card-text class="pt-4">
                      <p class="text-body-2 text-grey-darken-1 mb-4">
                        選擇週次區間，將預約資料寫入 Google Sheet。
                      </p>

                      <div class="mb-2 font-weight-bold text-grey-darken-2">選擇日期範圍 (週一 ~ 週日)</div>
                      <VueDatePicker v-model="syncDateRange" range :enable-time-picker="false" format="yyyy/MM/dd"
                        auto-apply locale="zh-TW" :min-date="new Date('2023-01-01')" placeholder="點擊選擇日期"
                        :teleport="true" class="mb-2">
                      </VueDatePicker>

                      <div v-if="syncDateError" class="text-caption text-error mt-1">
                        <v-icon start size="x-small">mdi-alert-circle</v-icon>
                        {{ syncDateError }}
                      </div>

                      <v-alert v-if="isSyncRangeValid" type="warning" variant="tonal" class="mt-4" density="compact"
                        border="start">
                        <div class="text-caption font-weight-bold">注意：</div>
                        <div class="text-caption">
                          同步操作將會<strong>覆蓋</strong> Google Sheet 上該日期區間的舊資料 (備註欄位除外)。
                        </div>
                      </v-alert>
                    </v-card-text>
                    <v-divider></v-divider>
                    <v-card-actions class="pa-4">
                      <v-spacer></v-spacer>
                      <v-btn color="success" variant="flat" size="large" prepend-icon="mdi-cloud-upload"
                        @click="handleExecuteSync" :loading="isSyncing"
                        :disabled="!isSyncRangeValid || !projectSettings.googleSheetId">
                        開始同步
                      </v-btn>
                    </v-card-actions>
                  </v-card>
                </v-col>
              </v-row>
            </div>
          </v-window-item>

        </v-window>

      </div>
    </v-card>

    <v-dialog v-model="isPreviewDialogVisible" max-width="800px">
      <v-card v-if="batchToPreview">
        <v-card-title class="d-flex align-center primary-bg">
          <v-icon start>mdi-calendar-search</v-icon>
          <span>預覽批次設定</span>
          <v-spacer></v-spacer>
          <v-btn variant="text" icon="mdi-close" @click="isPreviewDialogVisible = false"></v-btn>
        </v-card-title>
        <v-card-subtitle class="pa-3 bg-grey-lighten-4">
          <strong>{{ projectName }}</strong> / 「<strong>{{ batchToPreview.bookingType }}</strong>」批次 - <strong>{{
            batchToPreview.batchCode }}</strong>
        </v-card-subtitle>
        <v-divider></v-divider>
        <v-card-text style="max-height: 70vh; overflow-y: auto;">
          <div v-if="isPreviewLoading" class="text-center pa-8">
            <v-progress-circular indeterminate color="primary"></v-progress-circular>
            <p class="mt-2 text-grey-darken-1">正在讀取規則...</p>
          </div>
          <div v-else>
            <div v-if="Object.keys(previewData).length === 0" class="text-center pa-8 text-grey-darken-1">
              <v-icon size="48">mdi-calendar-remove-outline</v-icon>
              <p class="mt-2">此批次未設定「可預約區間」。</p>
            </div>
            <v-list v-else lines="two">
              <template v-for="(dayData, date) in previewData" :key="date">
                <v-list-subheader class="font-weight-bold text-primary">{{ formatDateWithWeekday(date)
                  }}</v-list-subheader>
                <v-list-item>
                  <div v-if="dayData.length > 0">
                    <div v-for="slot in dayData" :key="slot.time" class="mb-2">
                      <div class="d-flex align-center flex-wrap ga-2 mb-1">
                        <v-chip color="indigo" variant="tonal" label>
                          <v-icon start>mdi-clock-time-four-outline</v-icon>
                          <strong>{{ slot.time }}</strong>
                        </v-chip>
                        <v-chip v-if="slot.maxCapacity" color="error" variant="tonal" label size="small">
                          <v-icon start size="small">mdi-crown-outline</v-icon>
                          <span>上限 {{ slot.maxCapacity }} 名</span>
                        </v-chip>
                      </div>
                      <div class="pl-2 d-flex flex-wrap ga-2">
                        <v-chip v-for="method in previewBatchMethods" :key="method"
                          :variant="slot.methods.includes(method) ? 'elevated' : 'outlined'"
                          :color="slot.methods.includes(method) ? 'green' : 'grey'" size="x-small" label>
                          {{ method }}
                          <span v-if="slot.methods.includes(method)" class="ml-1">
                            {{ getMethodLimitDisplay(slot, method) }}
                          </span>
                        </v-chip>
                        <span v-if="slot.methods.length === 0" class="text-caption text-grey">未指定方式</span>
                      </div>
                      <div v-if="Object.keys(slot.subOptionLimits).length > 0" class="pl-2 mt-1 d-flex flex-wrap ga-1 align-center">
                        <v-icon size="x-small" color="primary" class="mr-1">mdi-sitemap-outline</v-icon>
                        <v-chip v-for="(limit, subOpt) in slot.subOptionLimits" :key="subOpt"
                          size="x-small" variant="tonal" :color="limit > 0 ? 'blue' : 'grey'" label>
                          {{ subOpt }}: {{ limit }} 名
                        </v-chip>
                      </div>
                    </div>
                  </div>
                  <div v-else class="text-grey-darken-1">
                    <v-icon size="small" class="mr-1">mdi-calendar-blank-outline</v-icon>
                    <span>無設定時段</span>
                  </div>
                </v-list-item>
                <v-divider class="mt-2"></v-divider>
              </template>
            </v-list>
          </div>
        </v-card-text>
        <v-card-actions class="bg-grey-lighten-5 pa-3">
          <v-spacer></v-spacer>
          <v-btn color="primary" variant="tonal" @click="isPreviewDialogVisible = false">關閉</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="isDeleteDialogVisible" max-width="500px" persistent>
      <v-card v-if="batchToDelete">
        <v-card-title class="text-h6 d-flex align-center bg-red-lighten-4">
          <v-icon start color="red-darken-2">mdi-alert-circle-outline</v-icon>
          確認刪除批次
        </v-card-title>
        <v-card-text class="pt-4">
          您確定要永久刪除「<strong>{{ batchToDelete.bookingType }}</strong>」批次「<strong>{{ batchToDelete.batchCode }}</strong>」嗎？
          <v-divider class="my-3"></v-divider>
          <div v-if="isDeleteDatesLoading" class="text-center pa-4">
            <v-progress-circular indeterminate color="grey"></v-progress-circular>
            <p class="text-caption mt-2">正在讀取相關日期...</p>
          </div>
          <div v-else>
            <p v-if="deleteBatchDates.length > 0" class="mb-2">
              此操作將一併移除此批次與以下 <strong>{{ deleteBatchDates.length }}</strong> 天預約規則的**關聯**：
            </p>
            <p v-else class="text-grey-darken-1">
              此批次目前沒有設定任何可預約日期。
            </p>
            <v-list v-if="deleteBatchDates.length > 0" dense class="border rounded"
              style="max-height: 200px; overflow-y: auto;">
              <v-list-item v-for="day in deleteBatchDates" :key="day">
                <v-list-item-title>
                  <span :class="{ 'weekend-highlight': isWeekend(day) }">
                    {{ formatDateWithWeekday(day) }}
                  </span>
                </v-list-item-title>
              </v-list-item>
            </v-list>
          </div>
          <p class="mt-4">此操作無法復原。</p>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="grey-darken-1" variant="text" @click="closeDeleteDialog">取消</v-btn>
          <v-btn color="error" variant="flat" :loading="isDeleting" @click="handleConfirmDelete">確定刪除</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="isBatchDialogVisible" max-width="1200px" persistent>
      <v-card>
        <v-card-title class="primary-bg d-flex align-center">
          <span class="text-h6">{{ editedBatch.id ? '編輯' : '新增' }}預約批次</span>
          <v-spacer></v-spacer>
          <v-btn icon variant="text" color="white" size="small" @click="isBatchGuideVisible = true" title="操作說明">
            <v-icon>mdi-help-circle-outline</v-icon>
          </v-btn>
        </v-card-title>
        <v-card-text style="max-height: 80vh; overflow-y: auto;">
          <v-form ref="batchForm">
            <v-row>
              <v-col cols="12" sm="6" md="3">
                <v-text-field v-model="editedBatch.batchCode" label="批次代號"
                  :rules="[v => !!v || '必填', batchUniquenessRule]" :readonly="!!editedBatch.id"
                  :variant="editedBatch.id ? 'filled' : 'outlined'"></v-text-field>
              </v-col>
              <v-col cols="12" sm="6" md="3">
                <v-select v-model="editedBatch.bookingType" :items="bookingTypeOptions" label="預約項目"
                  hint="請至「預約系統狀態設定」新增選項" persistent-hint :rules="[v => !!v || '必填', batchUniquenessRule]"
                  :readonly="!!editedBatch.id" :variant="editedBatch.id ? 'filled' : 'outlined'"></v-select>
              </v-col>
              <v-col v-if="editedBatch.bookingType === '其他'" cols="12" sm="6" md="3">
                <v-text-field v-model="customBookingType" label="請輸入自訂項目名稱"
                  :rules="[v => !!v || '自訂項目為必填', batchUniquenessRule]" :readonly="!!editedBatch.id"
                  :variant="editedBatch.id ? 'filled' : 'outlined'"></v-text-field>
              </v-col>
            </v-row>

            <v-divider class="my-2"></v-divider>
            <v-row>
              <v-col cols="12">
                <div class="text-subtitle-1 font-weight-bold mb-2 d-flex align-center">
                  <v-icon start color="amber-darken-2">mdi-tune-variant</v-icon>
                  名額計算模式
                </div>
                <v-radio-group v-model="editedBatch.quotaMode" inline hide-details>
                  <v-radio value="shared">
                    <template v-slot:label>
                      <div>
                        <div class="d-flex align-center">
                          <v-icon size="small" color="blue" class="mr-1">mdi-link-variant</v-icon>
                          <span class="font-weight-bold">共用名額</span>
                          <v-chip size="x-small" color="blue" variant="tonal" class="ml-2">預設</v-chip>
                        </div>
                        <div class="text-caption text-grey-darken-1 mt-1">
                          同日期、同時段的其他批次若有人預約，此批次的剩餘名額也會減少。
                        </div>
                      </div>
                    </template>
                  </v-radio>
                  <v-radio value="isolated">
                    <template v-slot:label>
                      <div>
                        <div class="d-flex align-center">
                          <v-icon size="small" color="orange" class="mr-1">mdi-lock-outline</v-icon>
                          <span class="font-weight-bold">獨立名額</span>
                        </div>
                        <div class="text-caption text-grey-darken-1 mt-1">
                          此批次的名額獨立計算，其他批次的預約不影響此批次的剩餘名額。
                        </div>
                      </div>
                    </template>
                  </v-radio>
                </v-radio-group>
                <v-alert v-if="editedBatch.id && editedBatch.quotaMode !== (editedBatch._originalQuotaMode || 'shared')"
                  type="warning" variant="tonal" density="compact" class="mt-2 mb-0">
                  <v-icon start size="small">mdi-alert-outline</v-icon>
                  名額模式已變更，儲存後將立即生效。若此批次已有客戶預約，名額計算方式會隨之改變。
                </v-alert>
              </v-col>
            </v-row>

            <v-divider class="my-2"></v-divider>
            <v-row>
              <v-col cols="12" sm="6" md="3">
                <v-menu v-model="menuAppStart" :close-on-content-click="false" location="bottom"
                  transition="scale-transition">
                  <template v-slot:activator="{ props }">
                    <v-text-field :model-value="formatDisplayDateTime(editedBatch.applicationStart)" label="預約開放時間"
                      prepend-inner-icon="mdi-calendar-clock" readonly v-bind="props" :rules="[v => !!v || '必填']"
                      variant="outlined"></v-text-field>
                  </template>
                  <v-card min-width="300">
                    <v-tabs v-model="activePickerTabStart" grow>
                      <v-tab><v-icon start>mdi-calendar</v-icon>日期</v-tab>
                      <v-tab><v-icon start>mdi-clock-outline</v-icon>時間</v-tab>
                    </v-tabs>
                    <v-window v-model="activePickerTabStart">
                      <v-window-item :value="0">
                        <v-date-picker v-model="tempDateStart" @update:model-value="activePickerTabStart = 1"
                          hide-header :max="editedBatch.applicationEnd"></v-date-picker>
                      </v-window-item>
                      <v-window-item :value="1">
                        <v-time-picker v-model="tempTimeStart" format="24hr"></v-time-picker>
                      </v-window-item>
                    </v-window>
                    <v-divider></v-divider>
                    <v-card-actions>
                      <v-spacer></v-spacer>
                      <v-btn variant="text" @click="menuAppStart = false">取消</v-btn>
                      <v-btn color="primary" @click="saveApplicationStart">確定</v-btn>
                    </v-card-actions>
                  </v-card>
                </v-menu>
              </v-col>
              <v-col cols="12" sm="6" md="3">
                <v-menu v-model="menuAppEnd" :close-on-content-click="false" location="bottom"
                  transition="scale-transition">
                  <template v-slot:activator="{ props }">
                    <v-text-field :model-value="formatDisplayDateTime(editedBatch.applicationEnd)" label="預約結束時間"
                      prepend-inner-icon="mdi-calendar-clock" readonly v-bind="props" :rules="[v => !!v || '必填']"
                      variant="outlined"></v-text-field>
                  </template>
                  <v-card min-width="300">
                    <v-tabs v-model="activePickerTabEnd" grow>
                      <v-tab><v-icon start>mdi-calendar</v-icon>日期</v-tab>
                      <v-tab><v-icon start>mdi-clock-outline</v-icon>時間</v-tab>
                    </v-tabs>
                    <v-window v-model="activePickerTabEnd">
                      <v-window-item :value="0">
                        <v-date-picker v-model="tempDateEnd" @update:model-value="activePickerTabEnd = 1" hide-header
                          :min="editedBatch.applicationStart"></v-date-picker>
                      </v-window-item>
                      <v-window-item :value="1">
                        <v-time-picker v-model="tempTimeEnd" format="24hr"></v-time-picker>
                      </v-window-item>
                    </v-window>
                    <v-divider></v-divider>
                    <v-card-actions>
                      <v-spacer></v-spacer>
                      <v-btn variant="text" @click="menuAppEnd = false">取消</v-btn>
                      <v-btn color="primary" @click="saveApplicationEnd">確定</v-btn>
                    </v-card-actions>
                  </v-card>
                </v-menu>
              </v-col>
              <v-col cols="12" sm="6" md="3">
                <v-menu v-model="menuBookingStart" :close-on-content-click="false" location="bottom"
                  transition="scale-transition">
                  <template v-slot:activator="{ props }">
                    <v-text-field v-model="editedBatch.bookingStart" label="可預約起始日" prepend-inner-icon="mdi-calendar"
                      readonly v-bind="props" :rules="[v => !!v || '必填']" variant="outlined"></v-text-field>
                  </template>
                  <v-date-picker v-model="tempBookingStartDate" @update:model-value="menuBookingStart = false"
                    title="選擇起始日" hide-header :max="editedBatch.bookingEnd"></v-date-picker>
                </v-menu>
              </v-col>
              <v-col cols="12" sm="6" md="3">
                <v-menu v-model="menuBookingEnd" :close-on-content-click="false" location="bottom"
                  transition="scale-transition">
                  <template v-slot:activator="{ props }">
                    <v-text-field v-model="editedBatch.bookingEnd" label="可預約結束日" prepend-inner-icon="mdi-calendar"
                      readonly v-bind="props" :rules="[v => !!v || '必填']" variant="outlined"></v-text-field>
                  </template>
                  <v-date-picker v-model="tempBookingEndDate" @update:model-value="menuBookingEnd = false" title="選擇結束日"
                    hide-header :min="editedBatch.bookingStart"></v-date-picker>
                </v-menu>
              </v-col>
            </v-row>
          </v-form>
          <v-divider class="my-4"></v-divider>
          <div v-if="!editedBatch.bookingStart || !editedBatch.bookingEnd">
            <p class="text-center text-grey-darken-1 pa-4">請先設定可預約的起訖日期</p>
          </div>
          <v-row v-else>
            <v-col cols="12" md="4">
              <v-date-picker v-model="selectedDaysForEditing" :min="editedBatch.bookingStart"
                :max="editedBatch.bookingEnd" show-adjacent-months hide-header color="primary" class="w-100"
                multiple></v-date-picker>
            </v-col>
            <v-col cols="12" md="8">
              <div v-if="selectedDaysForEditing.length === 0"
                class="d-flex align-center justify-center h-100 text-grey">
                <div><v-icon size="48">mdi-calendar-cursor</v-icon>
                  <p>請從左側日曆選擇一天或多天來設定</p>
                </div>
              </div>
              <div v-else>
                <h3 class="text-h6 mb-4 d-flex justify-space-between align-center">
                  <span v-if="selectedDaysForEditing.length === 1">設定 {{
                    formatDateWithWeekday(selectedDaysForEditing[0]) }}
                    的時段</span>
                  <span v-else>批次設定 {{ selectedDaysForEditing.length }} 個已選日期的時段</span>
                  <v-chip v-if="selectedDaysForEditing.length === 1" size="small"
                    :color="isDayConfigured(selectedDaysForEditing[0]) ? 'green' : 'grey'" variant="tonal">
                    {{ isDayConfigured(selectedDaysForEditing[0]) ? '已設定' : '未設定' }}
                  </v-chip>
                </h3>
                <!-- 快速新增時段面板 -->
                <v-sheet border rounded class="pa-3 mb-3 bg-grey-lighten-5">
                  <div class="text-subtitle-2 font-weight-bold mb-2 d-flex align-center">
                    <v-icon start size="small" color="primary">mdi-plus-circle-outline</v-icon>
                    新增時段
                  </div>
                  <div class="d-flex align-start ga-2 flex-wrap mb-2">
                    <v-combobox v-model="pendingNewSlots" :items="timeSlotPresets" :rules="[timeArrayRule]"
                      label="選擇或輸入時段" chips clearable multiple closable-chips hint="輸入後按 Enter 新增"
                      persistent-hint style="flex: 1; min-width: 180px"></v-combobox>
                    <v-text-field v-model="pendingNewCapacity" type="number" label="預設名額" min="1"
                      variant="outlined" density="compact" hide-details placeholder="新增時段的名額（建議≥1）"
                      style="max-width: 140px;" class="bg-white"></v-text-field>
                  </div>
                  <div class="mb-2">
                    <div class="text-caption text-grey-darken-1 mb-1">可預約方式 (新增時預設)：</div>
                    <div class="d-flex flex-wrap align-center">
                      <v-checkbox v-for="method in availableBatchMethods" :key="method"
                        v-model="pendingNewMethods" :value="method" :label="method"
                        density="compact" hide-details class="d-inline-block mr-2"></v-checkbox>
                      <span v-if="availableBatchMethods.length === 0" class="text-caption text-grey">（請先儲存批次預約項目後再設定方式）</span>
                    </div>
                  </div>
                  <v-btn color="primary" variant="tonal" size="small" prepend-icon="mdi-plus"
                    :disabled="!pendingNewSlots.length" @click="applyPendingSlots">新增至已選日期</v-btn>
                </v-sheet>
                <v-divider class="my-3"></v-divider>
                <p class="text-subtitle-1 mb-2">已設定時段</p>
                <div style="max-height: 400px; overflow-y: auto;" class="pr-2">
                  <div v-if="sortedCurrentDaySlots.length === 0" class="text-center text-grey pa-4">
                    尚無時段，請使用上方「新增時段」面板新增
                  </div>
                  <v-sheet v-for="slot in sortedCurrentDaySlots" :key="slot" border rounded class="pa-3 mb-3">
                    <div class="d-flex justify-space-between align-center">
                      <span class="font-weight-bold text-h6 text-grey-darken-2">{{ slot }}</span>
                      <div class="d-flex align-center ga-2">
                        <v-btn icon="mdi-delete-outline" size="small" color="error" variant="tonal"
                          density="compact" @click="removeSlot(slot)"></v-btn>
                      </div>
                    </div>
                    <v-divider class="my-2"></v-divider>
                    <!-- 時段名額設定 -->
                    <div class="mb-3">
                      <div class="d-flex align-center ga-2 mb-2">
                        <div class="text-caption font-weight-bold text-primary" style="min-width: 100px;">時段名額設定</div>
                        <v-text-field
                          :model-value="getCapacityForSlot(slot)"
                          @update:model-value="setCapacityForSlot(slot, $event)"
                          type="number" min="1" label="名額" class="bg-white"
                          style="max-width: 120px;"
                          variant="outlined" density="compact" hide-details placeholder="1">
                        </v-text-field>
                        <span class="text-caption text-grey">（各方式共用此名額）</span>
                      </div>
                    </div>
                    <div>
                      <div class="text-caption mb-1 ml-1">可預約方式</div>
                      <div class="d-flex flex-wrap align-center">
                        <v-checkbox :model-value="getSelectAllState(slot).checked"
                          :indeterminate="getSelectAllState(slot).indeterminate" label="全選" density="compact"
                          hide-details class="d-inline-block mr-2 font-weight-bold"
                          @update:model-value="handleSelectAll($event, slot)"></v-checkbox>
                        <v-divider vertical class="mx-2 d-none d-sm-flex"></v-divider>
                        <template v-if="availableBatchMethods.length > 0">
                          <v-checkbox v-for="method in availableBatchMethods" :key="method"
                            :model-value="isMethodSelectedForSlot(slot, method)"
                            @update:model-value="updateMethodsForSlot(slot, method, $event)" :label="method"
                            density="compact" hide-details class="d-inline-block mr-2"></v-checkbox>
                        </template>
                      </div>
                    </div>

                    <!-- 各方式獨立名額設定 -->
                    <div v-if="availableBatchMethods.length > 0 && getSelectedMethodsForSlot(slot).length > 0" class="mt-3 pl-2 border-s-sm" style="border-color: var(--v-theme-secondary)!important;">
                      <div class="d-flex align-center flex-wrap ga-2 mb-2">
                        <div class="text-caption text-secondary font-weight-bold">各方式獨立名額：</div>
                        <v-spacer></v-spacer>
                        <v-chip v-if="getMaxCapacityForSlot(slot) !== ''"
                          :color="isSlotOverMaxCapacity(slot) ? 'error' : 'success'"
                          variant="tonal" size="small" label>
                          <v-icon v-if="isSlotOverMaxCapacity(slot)" start size="small">mdi-alert</v-icon>
                          <v-icon v-else start size="small">mdi-account-group</v-icon>
                          已分配 {{ getAssignedCapacityForSlot(slot) }} / {{ getMaxCapacityForSlot(slot) }} 名
                          <span v-if="!isSlotOverMaxCapacity(slot)">
                            （共用剩餘 {{ Number(getMaxCapacityForSlot(slot)) - getAssignedCapacityForSlot(slot) }} 名）
                          </span>
                          <span v-else>（超出 {{ getAssignedCapacityForSlot(slot) - Number(getMaxCapacityForSlot(slot)) }} 名）</span>
                        </v-chip>
                      </div>
                      <!-- 超出警告 -->
                      <v-alert v-if="isSlotOverMaxCapacity(slot)" type="error" variant="tonal" density="compact" class="mb-2">
                        各方式名額合計已超出時段總名額上限，請調整。
                      </v-alert>
                      <div class="d-flex flex-wrap align-start ga-4">
                        <template v-for="method in getSelectedMethodsForSlot(slot)" :key="method">
                          <!-- 無子選項方式：顯示方式名額 -->
                          <div v-if="!batchMethodSubOptionsMap[method] || batchMethodSubOptionsMap[method].length === 0" style="max-width: 150px;">
                            <v-text-field
                              :label="method"
                              :model-value="getMethodLimitForSlot(slot, method)"
                              @update:model-value="setMethodLimitForSlot(slot, method, $event)"
                              type="number" min="0" class="bg-white"
                              variant="outlined" density="compact" hide-details placeholder="(留空=不限)">
                            </v-text-field>
                          </div>
                          <!-- 有子選項方式：顯示子選項名額，以方式名稱為標題 -->
                          <div v-else class="d-flex flex-column ga-1">
                            <div class="text-caption text-grey-darken-1 font-weight-bold">{{ method }}</div>
                            <div class="d-flex flex-wrap ga-2">
                              <div v-for="subOpt in batchMethodSubOptionsMap[method]" :key="subOpt" style="max-width: 140px;">
                                <v-text-field
                                  :label="subOpt"
                                  :model-value="getSubOptionCapacityForSlot(slot, subOpt)"
                                  @update:model-value="setSubOptionCapacityForSlot(slot, subOpt, $event)"
                                  type="number" min="0" class="bg-white"
                                  variant="outlined" density="compact" hide-details placeholder="(留空=不限)">
                                </v-text-field>
                              </div>
                            </div>
                          </div>
                        </template>
                      </div>
                    </div>
                  </v-sheet>
                </div>
              </div>
            </v-col>
          </v-row>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="grey-darken-1" variant="text" @click="isBatchDialogVisible = false">取消</v-btn>
          <v-btn color="success" variant="flat" @click="initiateSaveProcess" :loading="isSaving">儲存</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- 批次設定操作說明 Dialog -->
    <v-dialog v-model="isBatchGuideVisible" max-width="700px">
      <v-card>
        <v-card-title class="bg-info text-white d-flex align-center">
          <v-icon start>mdi-help-circle-outline</v-icon>
          預約批次設定 — 操作說明
        </v-card-title>
        <v-card-text style="max-height: 70vh; overflow-y: auto;">
          <v-list>
            <!-- Section 1: 基本設定 -->
            <v-list-subheader class="text-subtitle-2 font-weight-bold mt-4 mb-2">
              <v-icon start size="small" color="primary">mdi-format-list-numbered</v-icon>
              基本設定
            </v-list-subheader>
            <v-list-item density="comfortable">
              <div class="text-body-2">
                <div class="font-weight-bold mb-1">批次代號</div>
                <div class="text-grey-darken-1">唯一識別此批次，新增後不可修改。建議使用有意義的編碼（如：初驗20260401、複驗0331）。</div>
              </div>
            </v-list-item>
            <v-list-item density="comfortable">
              <div class="text-body-2">
                <div class="font-weight-bold mb-1">預約項目</div>
                <div class="text-grey-darken-1">此批次屬於哪個項目（如：初驗、複驗、對保）。新增後不可修改。</div>
              </div>
            </v-list-item>

            <v-divider class="my-3"></v-divider>

            <!-- Section 2: 名額計算模式 -->
            <v-list-subheader class="text-subtitle-2 font-weight-bold mt-4 mb-2">
              <v-icon start size="small" color="primary">mdi-tune-variant</v-icon>
              名額計算模式
            </v-list-subheader>
            <v-list-item density="comfortable">
              <div class="text-body-2">
                <div class="font-weight-bold mb-1">共用名額（預設）</div>
                <div class="text-grey-darken-1">同日期、同時段被其他批次預約時，此批次的剩餘名額也會減少。適合多批次共用同一時段的場景。</div>
              </div>
            </v-list-item>
            <v-list-item density="comfortable">
              <div class="text-body-2">
                <div class="font-weight-bold mb-1">獨立名額</div>
                <div class="text-grey-darken-1">此批次的名額獨立計算，其他批次的預約不會影響此批次的剩餘名額。</div>
              </div>
            </v-list-item>

            <v-divider class="my-3"></v-divider>

            <!-- Section 3: 時間設定 -->
            <v-list-subheader class="text-subtitle-2 font-weight-bold mt-4 mb-2">
              <v-icon start size="small" color="primary">mdi-calendar-clock</v-icon>
              時間設定
            </v-list-subheader>
            <v-list-item density="comfortable">
              <div class="text-body-2">
                <div class="font-weight-bold mb-1">預約開放 / 結束時間</div>
                <div class="text-grey-darken-1">客戶何時可以開始送出預約申請，何時截止。不同批次可設定不同時間。</div>
              </div>
            </v-list-item>
            <v-list-item density="comfortable">
              <div class="text-body-2">
                <div class="font-weight-bold mb-1">可預約起始 / 結束日</div>
                <div class="text-grey-darken-1">客戶可以選擇預約的日期範圍。例如設定 04/01 ~ 04/30，客戶只能在這個範圍內選日期。</div>
              </div>
            </v-list-item>

            <v-divider class="my-3"></v-divider>

            <!-- Section 4: 日曆與時段設定 -->
            <v-list-subheader class="text-subtitle-2 font-weight-bold mt-4 mb-2">
              <v-icon start size="small" color="primary">mdi-calendar-plus</v-icon>
              日曆與時段設定
            </v-list-subheader>
            <v-list-item density="comfortable">
              <div class="text-body-2">
                <div class="font-weight-bold mb-1">📅 日期選擇</div>
                <div class="text-grey-darken-1">點選一天或多天。多選時，後續新增的時段會同時套用到所有選中的日期。</div>
              </div>
            </v-list-item>
            <v-list-item density="comfortable">
              <div class="text-body-2">
                <div class="font-weight-bold mb-1">⏰ 新增時段</div>
                <div class="text-grey-darken-1">輸入時段（如 09:00、14:00），選擇可預約方式，點「新增至已選日期」。時段支持多筆（例如：09:00、10:00、14:00）。</div>
              </div>
            </v-list-item>
            <v-list-item density="comfortable">
              <div class="text-body-2">
                <div class="font-weight-bold mb-1">🎯 各方式獨立名額</div>
                <div class="text-grey-darken-1">為每個預約方式設定名額上限，並可設定「時段總名額上限」。有填名額的方式為獨立計算，名額空白或0的方式共用剩餘名額。各方式合計不能超過時段總名額上限。</div>
              </div>
            </v-list-item>
            <v-list-item density="comfortable">
              <div class="text-body-2">
                <div class="font-weight-bold mb-1">📊 總計名額</div>
                <div class="text-grey-darken-1">自動加總所有方式 / 子選項的名額，無法手動編輯。後端配額檢查會以此為準。</div>
              </div>
            </v-list-item>

            <v-divider class="my-3"></v-divider>

            <!-- Section 5: 儲存 -->
            <v-list-subheader class="text-subtitle-2 font-weight-bold mt-4 mb-2">
              <v-icon start size="small" color="primary">mdi-content-save</v-icon>
              儲存
            </v-list-subheader>
            <v-list-item density="comfortable">
              <div class="text-body-2">
                <div class="font-weight-bold mb-1">點「儲存」完成設定</div>
                <div class="text-grey-darken-1">所有已選日期的時段設定會一次寫入。修改後可隨時重新編輯。</div>
              </div>
            </v-list-item>
          </v-list>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn variant="text" @click="isBatchGuideVisible = false">關閉</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="isConflictDialogVisible" max-width="800px" persistent>
      <v-card>
        <v-card-title class="text-h6 d-flex align-center primary-bg">
          <v-icon start>mdi-source-fork</v-icon>
          日期規則設定
        </v-card-title>
        <v-card-text style="max-height: 70vh; overflow-y: auto;">
          <div v-if="conflictData.conflictingDates.length > 0">
            <h3 class="text-subtitle-1 font-weight-bold mb-2 text-error d-flex align-center">
              <v-icon start>mdi-alert-circle-outline</v-icon>
              已有設定的日期
            </h3>
            <p class="text-body-2 mb-4">
              以下 {{ conflictData.conflictingDates.length }} 天已有設定日期，請選擇
              <strong>沿用</strong>、<strong>獨立</strong>或<strong>覆蓋</strong> ：
            </p>
            <v-sheet border rounded class="pa-4">
              <div v-for="(dateInfo, index) in conflictData.conflictingDates" :key="dateInfo.date">
                <p class="font-weight-bold">
                  <span :class="{ 'weekend-highlight': isWeekend(dateInfo.date) }">
                    {{ formatDateWithWeekday(dateInfo.date) }}
                  </span>
                </p>

                <p class="text-caption text-grey-darken-1 mb-2">
                  <span class="font-weight-bold">舊有時段名額：</span>
                  <v-chip v-for="(slotData, time) in dateInfo.existingRule.rule" :key="time" size="x-small" label
                    class="mr-1">
                    {{ extractBookingType(dateInfo.existingRule.sharedBy) }} {{ time }} ({{ slotData.capacity }}名)
                  </v-chip>
                </p>

                <p class="text-caption text-error mb-3">
                  <span class="font-weight-bold">本次時段名額：</span>
                  <span
                    v-if="!editedBatch.dailyRules[dateInfo.date] || Object.keys(editedBatch.dailyRules[dateInfo.date].slots).length === 0"
                    class="font-italic">
                    (清除所有時段)
                  </span>
                  <template v-else>
                    <v-chip v-for="(slotData, time) in editedBatch.dailyRules[dateInfo.date].slots" :key="time"
                      size="x-small" label class="mr-1" variant="tonal" color="error">
                      {{ editedBatch.bookingType === '其他' ? customBookingType : editedBatch.bookingType }} {{ time }}
                      ({{ slotData.capacity }}名)
                    </v-chip>
                  </template>
                </p>

                <v-radio-group v-model="dateResolutions[dateInfo.date].mode">
                  <v-radio value="link" class="mb-4">
                    <template v-slot:label>
                      <div>
                        <div class="font-weight-bold">沿用</div>
                        <div class="text-caption">本批次沿用其他舊有批次的時段名額。</div>
                      </div>
                    </template>
                  </v-radio>


                  <v-radio value="create_independent" class="mb-4">
                    <template v-slot:label>
                      <div>
                        <div class="font-weight-bold">獨立 (不影響其他預約)</div>
                        <div class="text-caption">不覆蓋原本也不沿用共用名額。<br />此預約項目的名額獨立存在，與其他預約項目互不影響。</div>
                      </div>
                    </template>
                  </v-radio>

                  <v-radio value="update_shared" class="text-error ">
                    <template v-slot:label>
                      <div>
                        <div class="font-weight-bold">覆蓋</div>
                        <div class="text-caption">本批次覆蓋其他舊有批次的時段名額。</div>
                      </div>
                    </template>
                  </v-radio>
                </v-radio-group>

                <v-divider v-if="index < conflictData.conflictingDates.length - 1" class="my-4"></v-divider>
              </div>
            </v-sheet>
          </div>
          <div v-if="conflictData.nonConflictingDates.length > 0" class="mt-6">
            <h3 class="text-subtitle-1 font-weight-bold mb-2">尚無設定的日期</h3>
            <p class="text-body-2">
              以下 {{ conflictData.nonConflictingDates.length }} 天將直接套用您本次設定的規則：
            </p>

            <div class="mb-3">
              <v-chip v-for="date in conflictData.nonConflictingDates" :key="date" label class="mr-2 mb-2">
                {{ formatDateWithWeekday(date) }}
              </v-chip>
            </div>

            <div v-if="conflictData.nonConflictingDates.length > 0">
              <p class="text-caption text-primary">
                <span class="font-weight-bold">本次時段名額：</span>
                <template v-if="editedBatch.dailyRules[conflictData.nonConflictingDates[0]]">
                  <v-chip v-for="(slotData, time) in editedBatch.dailyRules[conflictData.nonConflictingDates[0]].slots"
                    :key="time" size="x-small" label class="mr-1" variant="tonal" color="primary">
                    {{ editedBatch.bookingType === '其他' ? customBookingType : editedBatch.bookingType }} {{ time }} ({{
                      slotData.capacity }}名)
                  </v-chip>
                </template>
              </p>
            </div>
          </div>
        </v-card-text>
        <v-card-actions class="bg-grey-lighten-5 pa-3">
          <v-spacer></v-spacer>
          <v-btn color="grey-darken-1" variant="text" @click="isConflictDialogVisible = false">取消</v-btn>
          <v-btn color="success" variant="flat" :loading="isSaving" @click="executeSave">確認並儲存</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="isPreviewTemplateDialogVisible" max-width="800px" persistent>
      <v-card>
        <v-card-title class="d-flex align-center primary-bg">
          <v-icon start>mdi-file-find-outline</v-icon>
          <span>預覽範本內容：{{ templatePreviewTitle }}</span>
          <v-spacer></v-spacer>
          <v-btn variant="text" icon="mdi-close" @click="isPreviewTemplateDialogVisible = false"></v-btn>
        </v-card-title>

        <v-card-text class="pa-4">
          <p class="mb-4">以下是「{{ templatePreviewTitle }}」的範本內容，您確定要套用嗎？目前欄位中的內容將會被覆蓋。</p>
          <v-sheet border rounded class="pa-4 bg-grey-lighten-5" style="max-height: 50vh; overflow-y: auto;">
            <div v-html="templatePreviewContent"></div>
          </v-sheet>
        </v-card-text>

        <v-divider></v-divider>
        <v-card-actions class="pa-3">
          <v-spacer></v-spacer>
          <v-btn color="grey-darken-1" variant="text" @click="isPreviewTemplateDialogVisible = false">
            取消
          </v-btn>
          <v-btn color="primary" variant="flat" @click="handleConfirmApplyTemplate">
            確認套用
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="isAlertPreviewDialogVisible" max-width="800px">
      <v-card>
        <v-card-title class="d-flex align-center primary-bg">
          <v-icon start>mdi-alert-box-outline</v-icon>
          <span>上傳須知提示框預覽</span>
          <v-spacer></v-spacer>
          <v-btn variant="text" icon="mdi-close" @click="isAlertPreviewDialogVisible = false"></v-btn>
        </v-card-title>
        <v-card-text class="pa-6">
          <p class="text-caption mb-4">以下是根據您目前設定所呈現的預覽效果：</p>
          <v-alert :model-value="true" :title="projectSettings.reportUploadIntro.alert.title"
            :color="projectSettings.reportUploadIntro.alert.color" :type="projectSettings.reportUploadIntro.alert.type"
            variant="tonal" border="start" prominent>
            <div v-html="projectSettings.reportUploadIntro.alert.text"></div>
          </v-alert>
        </v-card-text>
        <v-divider></v-divider>
        <v-card-actions class="pa-3">
          <v-spacer></v-spacer>
          <v-btn color="primary" variant="tonal" @click="isAlertPreviewDialogVisible = false">
            關閉
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>



    <!-- QR Code 產生器 Dialog -->
    <QrCodeGenerator v-model="showQrDialog" :target-url="bookingPageUrl" />

    <v-snackbar v-model="snackbar.show" :color="snackbar.color" timeout="3000" location="top right">
      {{ snackbar.text }}
      <template v-slot:actions>
        <v-btn icon="mdi-close" variant="text" @click="snackbar.show = false"></v-btn>
      </template>
    </v-snackbar>
  </v-container>
</template>

<script setup>
import { ref, reactive, computed, onMounted, watch } from 'vue';
import RichTextEditor from '@/components/RichTextEditor.vue';
import DynamicFieldEditor from '@/components/DynamicFieldEditor.vue';
import DynamicFormRenderer from '@/components/DynamicFormRenderer.vue';
import QrCodeGenerator from '@/components/QrCodeGenerator.vue'; // QR Code 產生器
import InspProjectSettings from '@/views/admin/InspProjectSettings.vue';
import inspCategoriesItems from '@/views/admin/inspCategoriesItems.vue';
import PdfTemplateSettings from '@/components/PdfTemplateSettings.vue';
import draggable from 'vuedraggable'; // [New]
import { useRoute, useRouter } from 'vue-router';
import { useProjectStore } from '@/store/projectStore';
import { eachDayOfInterval, parseISO } from 'date-fns';
import VueDatePicker from '@vuepic/vue-datepicker';
import '@vuepic/vue-datepicker/dist/main.css';
import { useUserStore } from '@/store/user';

//  將所有來自 '@/api' 的引入合併成這一個
import {
  updateProjectSettings,
  fetchProjectConfig,
  checkDateConflicts,
  saveBatchWithRules,
  fetchRulesForBatch,
  fetchBookingBatches,
  deleteBookingBatch,
  manualTriggerSendReminders,
  triggerNotDownloadedReportReminder,
  getNotificationRecipients,
  uploadAttachmentImage,
  deleteAttachmentImage,
  updateProjectSheetSettings, // 設定用
  listGoogleSheets,           // 列出 Sheet 
  syncHouseholdsToSheet,      // 同步
  syncAppointmentsToSheet     // 同步預約
} from '@/api';


// --- START: ✓ 新增附件上傳邏輯 ---
const uploadAttachments = async () => {
  if (!filesToUpload.value || filesToUpload.value.length === 0) return;

  isUploadingAttachments.value = true;
  let uploadSuccessCount = 0;
  const errors = [];

  // 使用 Promise.all 並行上傳
  const uploadPromises = filesToUpload.value.map(async (file) => {
    try {
      const result = await uploadAttachmentImage(projectId.value, file); // ✓ 呼叫 API 上傳
      return result; // API 應返回 { name, url, path }
    } catch (error) {
      console.error(`檔案 ${file.name} 上傳失敗:`, error);
      errors.push(`${file.name}: ${error.message}`);
      return null; // 標記失敗
    }
  });

  const results = await Promise.all(uploadPromises);

  // 將成功上傳的結果加入 projectSettings
  results.forEach(result => {
    if (result) {
      const currentIntro = projectSettings.value.pageSettingsByItem[selectedBookingItemForSetting.value].intro;
      if (!currentIntro.attachments) {
        currentIntro.attachments = []; // 確保陣列存在
      }
      currentIntro.attachments.push(result);
      uploadSuccessCount++;
    }
  });

  // 清空已選擇的檔案
  filesToUpload.value = [];
  isUploadingAttachments.value = false;

  if (uploadSuccessCount > 0) {
    // 如果有成功上傳的檔案，觸發一次儲存設定
    showSnackbar(`成功上傳 ${uploadSuccessCount} 個附件，正在儲存...`, 'info');
    await saveSettings(); // ✓ 儲存更新後的 attachments 陣列
  }

  if (errors.length > 0) {
    showSnackbar(`有 ${errors.length} 個檔案上傳失敗:\n${errors.join('\n')}`, 'error');
  } else if (uploadSuccessCount > 0) {
    showSnackbar(`所有 ${uploadSuccessCount} 個附件已上傳並儲存！`, 'success');
  }
};
// --- END: ✓ 新增附件上傳邏輯 ---

// --- START: ✓ 修改附件刪除邏輯 ---
// 正體中文註解：刪除附件。現在改為從附件物件中直接讀取 'path' 屬性。
const deleteAttachment = async (index) => {
  const currentIntro = projectSettings.value.pageSettingsByItem[selectedBookingItemForSetting.value].intro;
  const attachmentToDelete = currentIntro.attachments?.[index];
  if (!attachmentToDelete || !confirm(`您確定要刪除附件 "${attachmentToDelete.name}" 嗎？`)) {
    return;
  }

  // 正體中文註解：檢查附件物件中是否有 'path' 屬性。
  // 'path' 應該在 uploadAttachments 時由 api.js 的 uploadAttachmentImage 返回並儲存。
  if (!attachmentToDelete.path) {
    showSnackbar(`刪除失敗：附件資料缺少 'path' 屬性，無法定位檔案。`, 'error');
    console.error("刪除附件失敗：物件缺少 path 屬性", attachmentToDelete);
    return;
  }

  isDeletingAttachment.value = index; // 設置 loading 狀態

  try {
    // 1. 正體中文註解：直接使用儲存的 path 屬性呼叫刪除 API
    //    (api.js 中的 deleteAttachmentImage 已被修改為呼叫後端 Cloud Function)
    await deleteAttachmentImage(attachmentToDelete.path);

    // 2. 正體中文註解：從 projectSettings 陣列中移除
    currentIntro.attachments.splice(index, 1);

    // 3. 正體中文註解：儲存變更回 Firestore
    showSnackbar(`附件 "${attachmentToDelete.name}" 已刪除，正在儲存...`, 'info');
    await saveSettings(); // ✓ 儲存更新後的 attachments 陣列

    showSnackbar(`附件 "${attachmentToDelete.name}" 已成功刪除並儲存！`, 'success');

  } catch (error) {
    console.error(`刪除附件 ${attachmentToDelete.name} 失敗:`, error);
    showSnackbar(`刪除附件失敗: ${error.message}`, 'error');
  } finally {
    isDeletingAttachment.value = -1; // 清除 loading 狀態
  }
};



import { v4 as uuidv4 } from 'uuid';


const isTesting = ref(false);
const isSendingLineNotification = ref(false);

// --- LINE 通知名單 Dialog 相關 ---
const isRecipientDialogOpen = ref(false);
const isLoadingRecipients = ref(false);
const recipientList = ref([]);
const selectedRecipients = ref([]);
const filesToUpload = ref([]); // ✓ 新增：綁定 v-file-input
const isUploadingAttachments = ref(false); // ✓ 新增：控制上傳按鈕 loading
const isDeletingAttachment = ref(-1); // ✓ 新增：控制刪除按鈕 loading (用索引區分)

// --- Sheet Sync States ---
const sheetTabsHouseholds = ref([]);
const sheetTabsAppointments = ref([]);
const serviceAccountEmail = ref('');
const isLoadingTabsHouseholds = ref(false);
const isLoadingTabsAppointments = ref(false);
const isSyncingHouseholds = ref(false);
const isSyncingAppointments = ref(false);
const syncResult = ref(null);

const fetchSheetTabs = async (type) => {
  let sheetId, targetTabsRef, loadingRef;

  if (type === 'households') {
    sheetId = projectSettings.value.googleSheetId;
    targetTabsRef = sheetTabsHouseholds;
    loadingRef = isLoadingTabsHouseholds;
  } else if (type === 'appointments') {
    sheetId = projectSettings.value.appointmentsSheetId;
    targetTabsRef = sheetTabsAppointments;
    loadingRef = isLoadingTabsAppointments;
  } else {
    return;
  }

  if (!sheetId) {
    showSnackbar('請先輸入 Google Sheet ID', 'warning');
    return;
  }

  loadingRef.value = true;
  syncResult.value = null;
  try {
    const res = await listGoogleSheets(sheetId);
    targetTabsRef.value = res.sheetNames || [];
    serviceAccountEmail.value = res.agentEmail || '';
    showSnackbar('成功讀取工作表列表', 'success');
  } catch (error) {
    showSnackbar(`讀取失敗: ${error.message}`, 'error');
  } finally {
    loadingRef.value = false;
  }
};

const handleManualSync = async (type) => {
  let sheetId, tabName, syncFunc, label, syncingRef;

  if (type === 'households') {
    sheetId = projectSettings.value.googleSheetId;
    tabName = projectSettings.value.googleSheetTabName;
    syncFunc = syncHouseholdsToSheet;
    label = '戶別資料';
    syncingRef = isSyncingHouseholds;
  } else if (type === 'appointments') {
    sheetId = projectSettings.value.appointmentsSheetId;
    tabName = projectSettings.value.appointmentsSheetTabName;
    syncFunc = syncAppointmentsToSheet;
    label = '預約資料';
    syncingRef = isSyncingAppointments;
  } else {
    return;
  }

  if (!sheetId || !tabName) {
    showSnackbar(`請先設定 ${label} 的 Sheet ID 與 Tab Name`, 'error');
    return;
  }

  // 1. Save Settings First
  await saveSettings();

  // 2. Trigger Sync
  if (!confirm(`確定要執行「${label}」全量同步嗎？這將會覆蓋 Sheet 上的現有資料。`)) return;

  syncingRef.value = true;
  syncResult.value = null;
  try {
    const res = await syncFunc({
      projectId: projectId.value,
      spreadsheetId: sheetId,
      sheetName: tabName
    });
    syncResult.value = { status: 'success', message: `${res.message} (共 ${res.count} 筆)` };
    showSnackbar(`${label} 同步成功！`, 'success');
  } catch (error) {
    syncResult.value = { status: 'error', message: error.message };
    showSnackbar(`${label} 同步失敗: ` + error.message, 'error');
  } finally {
    syncingRef.value = false;
  }
};

const scheduleTimeOptions = computed(() => {
  const options = [];
  for (let hour = 8; hour < 18; hour++) {
    const hourStr = hour.toString().padStart(2, '0');
    options.push(`${hourStr}:00`);
    options.push(`${hourStr}:30`);
  }
  options.push('18:00');
  return options;
});

const runManualTrigger = async () => {
  if (!confirm('您確定要手動觸發一次「未上傳報告提醒」任務嗎？')) {
    return;
  }
  isTesting.value = true;
  try {
    const result = await manualTriggerSendReminders();
    alert(`觸發成功：${result.message}`); // 顯示成功訊息
  } catch (error) {
    alert(`觸發失敗：${error.message}`);
  } finally {
    isTesting.value = false;
  }
};



// --- Computed Properties ---
const projectName = computed(() => projectStore.idToNameMap[projectId.value] || '');


// --- Component State ---
const route = useRoute();
const router = useRouter();
const projectStore = useProjectStore();

// 2. 新增權限判斷 Computed
const isAdmin = computed(() => {
  const roles = userStore.currentUserRoles || [];
  return roles.includes('超級管理員') || roles.includes('系統管理員');
});

// 驗屋系統權限判斷
const hasInspectionSystemPermission = computed(() => {
  if (isAdmin.value) return true;
  return userStore.hasProjectPermission('驗屋系統', projectName.value);
});

// 驗屋系統設定子 Tab
const inspSystemSubTab = ref('inspProjectSettings');

// --- Google Sheet 同步相關狀態 ---
const syncDateRange = ref(null);
// const isSyncing = ref(false); // Removed in favor of specific sync states
const isSavingSheetSettings = ref(false);

// 日期範圍驗證 Computed
const isSyncRangeValid = computed(() => {
  if (!syncDateRange.value || syncDateRange.value.length !== 2) return false;
  const start = new Date(syncDateRange.value[0]);
  const end = new Date(syncDateRange.value[1]);
  // 檢查是否為週一到週日 (根據您的需求，也可放寬限制)
  return start.getDay() === 1 && end.getDay() === 0;
});

const syncDateError = computed(() => {
  if (!syncDateRange.value) return '';
  if (!isSyncRangeValid.value && syncDateRange.value.length === 2) {
    return '請選擇完整的週次 (週一 ~ 週日)';
  }
  return '';
});


const userStore = useUserStore(); // <--- 1. 初始化 UserStore
const projectId = ref(route.params.projectId);
const showQrDialog = ref(false);
const bookingPageUrl = computed(() => {
  return `${window.location.origin}/#/booking/${projectId.value}`;
});
const isLoading = ref(true);
const isSaving = ref(false);
const activeTab = ref('batches');
const settingsSubTab = ref('general');
const snackbar = reactive({ show: false, text: '', color: 'success' });
const isBatchLoading = ref(false);
const showDeletedItems = ref(false); // 控制是否顯示已刪除的預約項目
const isBatchDialogVisible = ref(false);
const isBatchGuideVisible = ref(false);
const batchForm = ref(null);
const bookingBatches = ref([]);

//  建立 computed 屬性，動態產生預約項目選項
const bookingTypeOptions = computed(() => {
  if (projectSettings.value.bookingMenu && projectSettings.value.bookingMenu.length > 0) {
    return projectSettings.value.bookingMenu.filter(item => !item.deleted).map(item => item.title);
  }
  // Fallback
  const types = Array.isArray(projectSettings.value.bookingTypes) ? projectSettings.value.bookingTypes : [];
  return [...types, '其他'];
});

// 篩選出未刪除的 bookingMenu 項目（用於 draggable 顯示）
const activeBookingMenu = computed({
  get: () => {
    if (!projectSettings.value.bookingMenu) return [];
    return projectSettings.value.bookingMenu.filter(item => !item.deleted);
  },
  set: (newVal) => {
    // draggable 排序時，合併回已刪除的項目
    const deletedItems = (projectSettings.value.bookingMenu || []).filter(item => item.deleted);
    projectSettings.value.bookingMenu = [...newVal, ...deletedItems];
  }
});

// 收集 bookingMenu 中所有不重複的 method title（用於提醒設定的選項）
const allInspectionMethodOptions = computed(() => {
  const menu = projectSettings.value.bookingMenu;
  if (!menu || menu.length === 0) {
    // Fallback: 使用舊版 bookingMethodOptions
    return projectSettings.value.bookingMethodOptions || [];
  }
  const methodSet = new Set();
  menu.forEach(item => {
    if (item.deleted) return;
    (item.methods || []).forEach(method => {
      if (!method.deleted && method.title) {
        methodSet.add(method.title);
      }
    });
  });
  return Array.from(methodSet);
});

// 已刪除的項目列表
const deletedBookingMenu = computed(() => {
  if (!projectSettings.value.bookingMenu) return [];
  return projectSettings.value.bookingMenu.filter(item => item.deleted);
});

// Derived Available Booking Types for Capacity Groups
const availableBookingTypes = computed(() => {
  return bookingTypeOptions.value.filter(type => type !== '其他');
});

const addCapacityGroup = () => {
  if (!projectSettings.value.bookingCapacityGroups) {
    projectSettings.value.bookingCapacityGroups = [];
  }
  projectSettings.value.bookingCapacityGroups.push({ types: [] });
};

const removeCapacityGroup = (index) => {
  if (projectSettings.value.bookingCapacityGroups && projectSettings.value.bookingCapacityGroups.length > index) {
    projectSettings.value.bookingCapacityGroups.splice(index, 1);
  }
};

// [New] Computed: Available methods for the selected batch booking type
const availableBatchMethods = computed(() => {
  const selectedType = editedBatch.value.bookingType;
  if (!selectedType || selectedType === '其他') return [];

  if (projectSettings.value.bookingMenu && projectSettings.value.bookingMenu.length > 0) {
    const item = projectSettings.value.bookingMenu.find(i => i.title === selectedType && !i.deleted);
    if (item && item.methods) {
      return item.methods.filter(m => !m.deleted).map(m => m.title);
    }
  }

  // Fallback
  return projectSettings.value.bookingMethodOptions || [];
});

// 計算各方式是否有子選項（用於 UI 判斷是否顯示方式名額輸入）
const batchMethodSubOptionsMap = computed(() => {
  const selectedType = editedBatch.value.bookingType;
  if (!selectedType || !projectSettings.value.bookingMenu?.length) return {};
  const item = projectSettings.value.bookingMenu.find(i => i.title === selectedType && !i.deleted);
  if (!item?.methods) return {};
  const map = {};
  item.methods.filter(m => !m.deleted).forEach(m => {
    map[m.title] = (m.subOptions && Array.isArray(m.subOptions)) ? m.subOptions : [];
  });
  return map;
});

// [New] Computed: Available sub-options for the selected batch methods
const availableBatchSubOptions = computed(() => {
  const selectedType = editedBatch.value.bookingType;
  if (!selectedType || selectedType === '其他') return [];
  if (projectSettings.value.bookingMenu && projectSettings.value.bookingMenu.length > 0) {
    const item = projectSettings.value.bookingMenu.find(i => i.title === selectedType && !i.deleted);
    if (item && item.methods) {
      let subOpts = [];
      item.methods.filter(m => !m.deleted).forEach(m => {
        if (m.subOptions && Array.isArray(m.subOptions)) {
          subOpts.push(...m.subOptions);
        }
      });
      return [...new Set(subOpts)];
    }
  }
  return [];
});

// [New] Computed: Available methods for the previewed batch
const previewBatchMethods = computed(() => {
  if (!batchToPreview.value) return [];
  const selectedType = batchToPreview.value.bookingType;
  if (!selectedType || selectedType === '其他') return [];

  if (projectSettings.value.bookingMenu && projectSettings.value.bookingMenu.length > 0) {
    const item = projectSettings.value.bookingMenu.find(i => i.title === selectedType && !i.deleted);
    if (item && item.methods) {
      return item.methods.filter(m => !m.deleted).map(m => m.title);
    }
  }

  // Fallback
  return projectSettings.value.bookingMethodOptions || [];
});

// [新增] 排程時間選擇器的狀態
const menuPublishStart = ref(false);
const menuPublishEnd = ref(false);
const activePickerTabPubStart = ref(0);
const activePickerTabPubEnd = ref(0);
const tempPubStartDate = ref(new Date());
const tempPubStartTime = ref("00:00");
const tempPubEndDate = ref(new Date());
const tempPubEndTime = ref("23:59");


//  將 defaultSettings 從 const 常數改為 computed 屬性
const defaultSettings = computed(() => ({
  pageTitle: `${projectName.value} 線上預約系統`,
  titleColor: '#FFFFFF',
  themeColor: '#0D47A1',
  logoUrl: '',
  checkDuplicate: "OFF",
  validateId: "OFF",
  bookingTypes: [],
  showReportUploadButton: false,
  showReportUploadButton: false,
  bookingMethodOptions: [],
  bookingMethodConfigs: {}, // [New]
  customerMessageConfigs: [], // [New] 客戶回傳功能設定
  inspectionStaff: [],
  inspectionReportTemplateUrl: '',
  isPublished: false,
  enableScheduledPublish: false, // [新增]
  publishStartTime: null,        // [新增]
  publishEndTime: null,          // [新增]
  lineChannelAccessTokenSecretName: '', // [新增] LINE Token Secret Name
  authLetterTemplate: '', // [新增] 授權書範本
  //  intro 物件中的 "富宇富御" 全部替換為 ${projectName.value}
  intro: {
    greeting: `<p>親愛的 <strong>${projectName.value}</strong> 貴賓您好：</p>`,
    body: `<p>歡迎使用「${projectName.value}」線上預約系統，請依下方步驟完成您的預約。</p>`,
    alert: {
      show: true,
      showConfirmation: false,
      color: 'error',
      type: 'info',
      title: '預約說明',
      text: `
          <p>親愛的客戶，感謝您承購「${projectName.value}」，本案已於2025/XX/XX取得使用執照，並於室內屋況完成後進行驗收。</p>
          <p>因驗屋時段分別，請盡早填妥以下資訊預約，以便為您事先安排服務人員，謝謝您的配合。</p>
          <ul class="pl-5 mt-4" style="list-style-type: none;">
            <li class="mb-2"><strong>⚠️</strong> 代驗公司因驗屋時間需求僅開放預約9:30或13:30。</li>
            <li class="mb-2"><strong>⚠️</strong> 若有代驗公司請於預約系統填寫代驗公司名稱。</li>
            <li class="mb-2"><strong>⚠️</strong> 代驗公司-自行檢測水電及弱電。</li>
            <li class="mb-2"><strong>⚠️</strong> 屋主自驗或設計師陪驗 - 水電及弱電驗屋流程將由建設公司提供專業測試流程。</li>
            <li class="mb-2"><strong>⚠️</strong> 產權人若無法親自驗屋,需填寫授權書屋主及受託人雙方均需簽名。</li>
            <li class="mb-2"><strong>⚠️</strong> 非屋主關係或驗屋人員謝絕參與。</li>
            <li class="mb-2"><strong>⚠️</strong> 針對陽台及浴室基於合理使用房屋之正常狀況，不同意進行淹水測試，驗屋方式請以房屋使用合理性為原則。</li>
            <li class="mb-2"><strong>⚠️</strong> 如有相關廠商(廚具、空調、衛浴等)/ 設計師丈量需求，請安排於初驗時一同前來，之後不另開放。</li>
          </ul>
          <p class="mt-6"><strong>有關買賣合約特記事項提醒 :</strong></p>
          <ol class="pl-5 mt-4">
            <li class="mb-3">石材為天然化石積壓而生，切割後表面易出現結晶體及放射狀紋或裂紋之天然色澤紋路，因季節變化或時間因素致使有受潮含水、自然裂紋變形等情況係自然現象，選擇天然石材為鋪面應有認知，如有上述情形，非賣方之故意，買方同意應以施工當時色澤紋為主；亦不得將上列情形視為瑕疵而作任何主張或請求。</li>
            <li class="mb-3">本案所使用之拋光石英磚及地壁磚建材因釉料及高溫窯燒，製程中因熱脹冷縮產生細微翹曲，無法達到每一片接合之平整性，及地壁磚微量之色差，另因石英磚地坪施作工法改良後，為因增加黏著點而使用鋸齒狀刮刀，致使產生水泥收縮後黏著微量不平均，以致在敲打時會有些微不同之聲音，（單片敲打不同之聲音不得超過三分之一以上），係屬無法抗拒之正常現象，如有上述情形，非賣方之故意，買方同意亦不得將上列情形視為瑕疵而作任何主張或請求。</li>
            <li class="mb-3">室內隔間採用輕質隔間牆，其與樑下或不同構造之建材相接處做退縮處理，以降低因建築物產生自然載量及層間變位等因素，而造成牆面不規則龜裂情形，係屬正常施工規範。</li>
          </ol>
        `
    },
    footer: '<p>如有任何疑問，請洽您的專屬服務人員或撥打以下電話：</p>',
    closingText: '<p>請於預約時段準時抵達，並至社區大廳櫃檯完成報到，感謝您的配合。</p>',
    datePickerReminder: {
      show: false,
      content: ''
    },
    contact: { name: "XX建設", phone: "" },
    attachments: [],
    faq: [
      { q: "整個驗屋流程大約需要多久？", a: "依據不同房型，完整的初驗流程預計需要 1.5 至 2.5 小時。" },
      { q: "驗屋時可以找親友或設計師陪同嗎？", a: "當然可以，歡迎您邀請親友或您的設計師一同前來，但請以兩人為限，以維持現場驗屋品質。" }
    ],
    attachments: [],
    showAttachments: false,
  },
  reportUploadIntro: {
    body: '<p>請填寫以下資訊並上傳您的驗屋報告電子檔(PDF)。</p>',
    alert: {
      show: true,
      title: '上傳須知',
      text: '初驗報告及複驗報告每戶僅限上傳一份，若報告有修改需重新上傳，請洽服務電話：<a href="tel:03-6588882">03-658-8882</a>。如果您的檔案超過30MB，請先至 <a href="https://www.ilovepdf.com/zh-tw/compress_pdf" target="_blank">ilovepdf.com</a> 進行壓縮。',
      color: 'error',
      type: 'info',
    }
  },
  reportSettings: {
    uploadReminderDays: [7, 14],
    uploadReminderMethods: ['EMAIL'],
    uploadReminderInspectionMethods: [], // 適用提醒的選擇方式（動態）
    uploadReminderSchedule: {
      enabled: false,
      time: '10:00'
    },


    uploadReminderEmail: {
      subject: `{projectName} {unitId} 未收到驗屋報告提醒`,
      body: `<p>親愛的 {bookerName} 貴賓您好，</p><p>您已於 {appointmentDate} 完成 {unitId} 驗屋，由於我們尚未收到您的驗屋報告，目前無法進行後續的修繕作業。</p><p>請您在收到本通知後的 7 日內，上傳您的驗屋報告。</p>`,
      reminder: `<p>1.驗屋報告請以 PDF 檔方式製作，並且檔案大小限制為 30MB 以內。<br>2.初驗報告與複驗報告每戶僅限上傳一份，如需更換內容，請洽客服協助處理。</p>`,
      uploadUrl: ''
    },
    reportDataFolderUrl: '',
    notDownloadedReminderSchedule: {
      monday: { enabled: false, time: '10:00' },
      tuesday: { enabled: false, time: '10:00' },
      wednesday: { enabled: false, time: '10:00' },
      thursday: { enabled: false, time: '10:00' },
      friday: { enabled: false, time: '10:00' },
      saturday: { enabled: false, time: '10:00' },
      sunday: { enabled: false, time: '10:00' },
    }
  }
}));

//範本預覽 Dialog 相關狀態
const isPreviewTemplateDialogVisible = ref(false);
const templatePreviewTitle = ref('');
const templatePreviewContent = ref('');
const currentTargetField = ref(null);

//  修改 projectSettings 的初始值，加上 .value
const projectSettings = ref({});


//  --- 新增：預約設定抽屜相關的狀態與邏輯 ---
const isSettingsLoading = ref(false);
const isSavingSettings = ref(false);

const customBookingType = ref('');
const searchQuery = ref('');

// Dialog states
const isDeleteDialogVisible = ref(false);
const isPreviewDialogVisible = ref(false);
const isConflictDialogVisible = ref(false);
const isAlertPreviewDialogVisible = ref(false); // 新增預覽 Dialog 狀態
const isDynamicFieldsDialogVisible = ref(false); // [New]
const currentConfiguringMethod = ref(''); // [New]
const tempDynamicFields = ref([]); // [New]
const isSavingDynamicFields = ref(false); // [New]

// --- Booking Menu Management State ---
const isBookingItemDialogVisible = ref(false);
const editedBookingItemTitle = ref('');
const editedBookingItemIndex = ref(-1);

const isMethodDialogVisible = ref(false);
const editedMethodTitle = ref('');

// --- Auth Letter Template State ---
const authLetterEditMode = ref('form'); // 三模式切換：'form' | 'html' | 'preview'

// 表單編輯模式的欄位
const authLetterFields = reactive({
  declaration: '茲因本人 (委託人) {委託人姓名} 不克親自辦理「{建案名稱}」建案之房屋驗交相關事宜，特委託{與委託人關係} {受託人姓名} 君代為全權處理。',
  scope: '受託人得代理委託人全權處理上述房地產之驗屋、點交相關作業，並有權簽署相關文件。此授權書效力等同委託人親自辦理。',
  closing: '{建案名稱} 專案團隊'
});

const loadDefaultAuthLetterTemplate = () => {
  // 同時更新表單欄位
  authLetterFields.declaration = '茲因本人 (委託人) {委託人姓名} 不克親自辦理「{建案名稱}」建案之房屋驗交相關事宜，特委託{與委託人關係} {受託人姓名} 君代為全權處理。';
  authLetterFields.scope = '受託人得代理委託人全權處理上述房地產之驗屋、點交相關作業，並有權簽署相關文件。此授權書效力等同委託人親自辦理。';
  authLetterFields.closing = '{建案名稱} 專案團隊';
  // 產生完整 HTML 範本
  projectSettings.value.authLetterTemplate = generateAuthLetterHtml(authLetterFields);
  showSnackbar('已載入系統預設授權書範本', 'info');
};

// 從表單欄位產生完整 HTML 範本
function generateAuthLetterHtml(fields) {
  return `<div style="padding: 40px; font-family: 'Helvetica Neue', Arial, 'Heiti TC', 'Microsoft JhengHei', sans-serif; line-height: 1.8; color: #333; background-color: white;">
  <header style="text-align: center; margin-bottom: 40px;">
    <img src="{logoUrl}" alt="Logo" style="max-height: 60px; margin-bottom: 20px;">
    <h1 style="font-size: 28px; margin: 0; font-weight: bold;">驗屋授權書</h1>
  </header>
  <section>
    <p style="font-size: 16px;">${fields.declaration}</p>
    <h3 style="font-size: 20px; font-weight: bold; border-bottom: 2px solid #eee; padding-bottom: 8px; margin-top: 30px;">授權標的</h3>
    <p style="font-size: 16px;">建案：<strong>{建案名稱}</strong></p>
    <p style="font-size: 16px;">戶別：<strong>{戶別}</strong></p>
    <h3 style="font-size: 20px; font-weight: bold; border-bottom: 2px solid #eee; padding-bottom: 8px; margin-top: 30px;">授權範圍</h3>
    <p style="font-size: 16px;">${fields.scope}</p>
    <table style="width: 100%; margin-top: 40px; border-collapse: collapse; font-size: 16px;">
      <tr>
        <td style="width: 50%; padding: 15px; vertical-align: top; border: 1px solid #ddd;">
          <strong style="display: block; margin-bottom: 10px;">委託人 (立書人)</strong>
          <p style="margin: 5px 0;">姓名：{委託人姓名}</p>
          <p style="margin: 5px 0;">身分證字號：{委託人身分證字號}</p>
          <p style="margin: 5px 0;">戶籍地址：{委託人戶籍地址}</p>
          <p style="margin: 5px 0;">簽名：</p>
          <img src="{委託人簽名圖檔}" style="max-width: 200px; height: auto; border-bottom: 1px solid #ccc; padding-bottom: 5px;">
        </td>
        <td style="width: 50%; padding: 15px; vertical-align: top; border: 1px solid #ddd;">
          <strong style="display: block; margin-bottom: 10px;">受託人</strong>
          <p style="margin: 5px 0;">姓名：{受託人姓名}</p>
          <p style="margin: 5px 0;">身分證字號：{受託人身分證字號}</p>
          <p style="margin: 5px 0;">與委託人關係：{與委託人關係}</p>
          <p style="margin: 5px 0;">戶籍地址：{受託人戶籍地址}</p>
          <p style="margin: 5px 0;">簽名：</p>
          <img src="{受託人簽名圖檔}" style="max-width: 200px; height: auto; border-bottom: 1px solid #ccc; padding-bottom: 5px;">
        </td>
      </tr>
    </table>
    <footer style="text-align: right; margin-top: 40px; font-size: 16px;">
      <p>此致</p>
      <p><strong>${fields.closing}</strong></p>
      <br>
      <p>日期：{TODAY}</p>
    </footer>
  </section>
</div>`;
}

// 從表單欄位套用至 HTML 範本
const applyAuthLetterFieldsToTemplate = () => {
  projectSettings.value.authLetterTemplate = generateAuthLetterHtml(authLetterFields);
  showSnackbar('已將表單欄位內容套用至授權書範本 HTML', 'success');
};

// 從現有 HTML 範本中嘗試解析表單欄位（切換到表單模式時呼叫）
const parseAuthLetterFieldsFromTemplate = () => {
  const html = projectSettings.value.authLetterTemplate || '';
  if (!html) return;

  // 嘗試提取宣告文（第一個 <section> 中的 <p> 標籤內容）
  const declarationMatch = html.match(/<section>\s*<p[^>]*>([\s\S]*?)<\/p>/);
  if (declarationMatch) {
    authLetterFields.declaration = declarationMatch[1].replace(/<[^>]*>/g, '').trim();
  }

  // 嘗試提取授權範圍（「授權範圍」標題後的 <p>）
  const scopeMatch = html.match(/授權範圍<\/h3>\s*<p[^>]*>([\s\S]*?)<\/p>/);
  if (scopeMatch) {
    authLetterFields.scope = scopeMatch[1].replace(/<[^>]*>/g, '').trim();
  }

  // 嘗試提取結語（此致 後的 <strong>）
  const closingMatch = html.match(/此致<\/p>\s*<p><strong>([\s\S]*?)<\/strong><\/p>/);
  if (closingMatch) {
    authLetterFields.closing = closingMatch[1].replace(/<[^>]*>/g, '').trim();
  }
};

// 切換到表單模式時自動解析
watch(() => authLetterEditMode.value, (newMode) => {
  if (newMode === 'form') {
    parseAuthLetterFieldsFromTemplate();
  }
});

const authLetterPreviewHtml = computed(() => {
  if (!projectSettings.value.authLetterTemplate) return '<div class="text-center text-grey pa-4">尚未設定授權書範本，請點擊上方按鈕載入。</div>';

  const today = new Date();
  const yyyymmdd = `${today.getFullYear()}年${(today.getMonth() + 1).toString().padStart(2, '0')}月${today.getDate().toString().padStart(2, '0')}日`;

  return projectSettings.value.authLetterTemplate
    .replace(/{建案名稱}/g, projectName.value || '測試建案')
    .replace(/{戶別}/g, 'A1-1')
    .replace(/{委託人姓名}/g, '王大明')
    .replace(/{委託人身分證字號}/g, 'A123456789')
    .replace(/{委託人戶籍地址}/g, '台北市信義區市府路1號')
    .replace(/{受託人姓名}/g, '林小華')
    .replace(/{受託人身分證字號}/g, 'F223456789')
    .replace(/{受託人戶籍地址}/g, '台北市中正區重慶南路一段122號')
    .replace(/{與委託人關係}/g, '配偶')
    .replace(/{TODAY}/g, yyyymmdd)
    .replace(/{logoUrl}/g, projectSettings.value.logoUrl || '')
    .replace(/{委託人簽名圖檔}/g, 'https://dummyimage.com/200x80/cccccc/000000.png&text=Signature+1')
    .replace(/{受託人簽名圖檔}/g, 'https://dummyimage.com/200x80/cccccc/000000.png&text=Signature+2');
});

const editedMethodParentTitle = ref('');
const editedMethodIndex = ref(-1);
const editedMethodParentIndex = ref(-1);

// --- Booking Menu Methods ---

// 工具函式：從 activeBookingMenu 索引轉換為 bookingMenu 實際索引
const getRealBookingMenuIndex = (activeIndex) => {
  const item = activeBookingMenu.value[activeIndex];
  if (!item) return -1;
  return projectSettings.value.bookingMenu.findIndex(i => i.title === item.title && !i.deleted);
};

// 工具函式：從過濾後的 methods 索引轉換為 methods 陣列實際索引
const getRealMethodIndex = (realParentIndex, activeMethodIndex) => {
  const allMethods = projectSettings.value.bookingMenu[realParentIndex]?.methods || [];
  const activeMethods = allMethods.filter(m => !m.deleted);
  const method = activeMethods[activeMethodIndex];
  if (!method) return -1;
  return allMethods.findIndex(m => m.title === method.title && !m.deleted);
};

// 1. Booking Item (Parent)
const openEditBookingItemDialog = (item = null, index = -1) => {
  if (item) {
    editedBookingItemTitle.value = item.title;
    editedBookingItemIndex.value = index;
  } else {
    editedBookingItemTitle.value = '';
    editedBookingItemIndex.value = -1;
  }
  isBookingItemDialogVisible.value = true;
};

const saveBookingItem = async () => {
  if (!editedBookingItemTitle.value.trim()) return;

  if (!projectSettings.value.bookingMenu) {
    projectSettings.value.bookingMenu = [];
  }

  if (editedBookingItemIndex.value === -1) {
    // Add new
    projectSettings.value.bookingMenu.push({
      title: editedBookingItemTitle.value,
      methods: [] // Start with empty methods
    });
  } else {
    // Edit existing - 將 activeBookingMenu 索引轉為實際索引
    const realIndex = getRealBookingMenuIndex(editedBookingItemIndex.value);
    if (realIndex !== -1) {
      projectSettings.value.bookingMenu[realIndex].title = editedBookingItemTitle.value;
    }
  }

  isBookingItemDialogVisible.value = false;
  await saveSettings();
};

const deleteBookingItem = async (index) => {
  if (!confirm('確定要刪除此預約項目嗎？（項目將被標記為已刪除，可隨時復原）')) return;
  // 找到實際在 bookingMenu 中的索引（因為 draggable 使用的是 activeBookingMenu）
  const itemTitle = activeBookingMenu.value[index]?.title;
  const realIndex = projectSettings.value.bookingMenu.findIndex(item => item.title === itemTitle && !item.deleted);
  if (realIndex === -1) return;
  projectSettings.value.bookingMenu[realIndex].deleted = true;
  projectSettings.value.bookingMenu[realIndex].deletedAt = new Date().toISOString();
  await saveSettings();
  showSnackbar('項目已標記為刪除，可至「已刪除項目」中復原', 'info');
};

// 復原已刪除的預約項目
const restoreBookingItem = async (index) => {
  const deletedItems = deletedBookingMenu.value;
  const itemTitle = deletedItems[index]?.title;
  const realIndex = projectSettings.value.bookingMenu.findIndex(item => item.title === itemTitle && item.deleted);
  if (realIndex === -1) return;
  delete projectSettings.value.bookingMenu[realIndex].deleted;
  delete projectSettings.value.bookingMenu[realIndex].deletedAt;
  await saveSettings();
  showSnackbar('預約項目已成功復原！', 'success');
};

// 永久刪除預約項目
const permanentlyDeleteBookingItem = async (index) => {
  if (!confirm('⚠️ 確定要永久刪除此預約項目嗎？此操作無法復原！')) return;
  const deletedItems = deletedBookingMenu.value;
  const itemTitle = deletedItems[index]?.title;
  const realIndex = projectSettings.value.bookingMenu.findIndex(item => item.title === itemTitle && item.deleted);
  if (realIndex === -1) return;
  projectSettings.value.bookingMenu.splice(realIndex, 1);
  await saveSettings();
  showSnackbar('項目已永久刪除', 'warning');
};

const editedMethodTriggerAuth = ref(false); // [New]
const editedMethodAskPresence = ref(false); // [New]
const editedMethodSubOptions = ref([]); // 新增：用於子選單

// 2. Selection Method (Child)
const openEditMethodDialog = (parentIndex, method = null, methodIndex = -1) => {
  editedMethodParentIndex.value = parentIndex;
  const realParentIndex = getRealBookingMenuIndex(parentIndex);
  if (realParentIndex !== -1 && projectSettings.value.bookingMenu[realParentIndex]) {
    editedMethodParentTitle.value = projectSettings.value.bookingMenu[realParentIndex].title;
  }

  if (method) {
    editedMethodTitle.value = method.title;
    editedMethodTriggerAuth.value = method.triggerAuthFlow || false; // [New] Load existing
    editedMethodAskPresence.value = method.askOwnerPresence || false; // [New] Load existing
    editedMethodSubOptions.value = method.subOptions || []; // 新增
    editedMethodIndex.value = methodIndex;
  } else {
    editedMethodTitle.value = '';
    editedMethodTriggerAuth.value = false; // [New] Default false
    editedMethodAskPresence.value = false; // [New] Default false
    editedMethodSubOptions.value = []; // 新增
    editedMethodIndex.value = -1;
  }
  isMethodDialogVisible.value = true;
};

const saveMethod = async () => {
  if (!editedMethodTitle.value.trim()) return;

  const realParentIndex = getRealBookingMenuIndex(editedMethodParentIndex.value);
  if (realParentIndex === -1) return;
  const parentItem = projectSettings.value.bookingMenu[realParentIndex];
  if (!parentItem.methods) parentItem.methods = [];

  if (editedMethodIndex.value === -1) {
    // Add new
    parentItem.methods.push({
      title: editedMethodTitle.value,
      customFields: [],
      triggerAuthFlow: editedMethodTriggerAuth.value,
      askOwnerPresence: editedMethodTriggerAuth.value ? editedMethodAskPresence.value : false,
      subOptions: editedMethodSubOptions.value // 新增
    });
  } else {
    // Edit - 將過濾後的 method 索引轉為實際索引
    const realMethodIndex = getRealMethodIndex(realParentIndex, editedMethodIndex.value);
    if (realMethodIndex !== -1) {
      parentItem.methods[realMethodIndex].title = editedMethodTitle.value;
      parentItem.methods[realMethodIndex].triggerAuthFlow = editedMethodTriggerAuth.value;
      parentItem.methods[realMethodIndex].askOwnerPresence = editedMethodTriggerAuth.value ? editedMethodAskPresence.value : false;
      parentItem.methods[realMethodIndex].subOptions = editedMethodSubOptions.value; // 新增
    }
  }

  isMethodDialogVisible.value = false;
  await saveSettings();
};

const deleteMethod = async (parentIndex, methodIndex) => {
  if (!confirm('確定要刪除此選擇方式嗎？（可隨時復原）')) return;
  // parentIndex 是在 activeBookingMenu 中的索引，需轉換
  const parentTitle = activeBookingMenu.value[parentIndex]?.title;
  const realParentIndex = projectSettings.value.bookingMenu.findIndex(item => item.title === parentTitle && !item.deleted);
  if (realParentIndex === -1) return;
  // methodIndex 是在過濾後的 methods 中的索引，需轉換
  const activeMethods = (projectSettings.value.bookingMenu[realParentIndex].methods || []).filter(m => !m.deleted);
  const methodTitle = activeMethods[methodIndex]?.title;
  const realMethodIndex = projectSettings.value.bookingMenu[realParentIndex].methods.findIndex(m => m.title === methodTitle && !m.deleted);
  if (realMethodIndex === -1) return;
  projectSettings.value.bookingMenu[realParentIndex].methods[realMethodIndex].deleted = true;
  projectSettings.value.bookingMenu[realParentIndex].methods[realMethodIndex].deletedAt = new Date().toISOString();
  await saveSettings();
  showSnackbar('選擇方式已標記為刪除', 'info');
};

// 復原已刪除的選擇方式
const restoreMethod = async (parentIndex, methodIndex) => {
  // parentIndex 是在 activeBookingMenu 中的索引
  const parentTitle = activeBookingMenu.value[parentIndex]?.title;
  const realParentIndex = projectSettings.value.bookingMenu.findIndex(item => item.title === parentTitle && !item.deleted);
  if (realParentIndex === -1) return;
  const deletedMethods = (projectSettings.value.bookingMenu[realParentIndex].methods || []).filter(m => m.deleted);
  const methodTitle = deletedMethods[methodIndex]?.title;
  const realMethodIndex = projectSettings.value.bookingMenu[realParentIndex].methods.findIndex(m => m.title === methodTitle && m.deleted);
  if (realMethodIndex === -1) return;
  delete projectSettings.value.bookingMenu[realParentIndex].methods[realMethodIndex].deleted;
  delete projectSettings.value.bookingMenu[realParentIndex].methods[realMethodIndex].deletedAt;
  await saveSettings();
  showSnackbar('選擇方式已成功復原！', 'success');
};

// 永久刪除選擇方式
const permanentlyDeleteMethod = async (parentIndex, methodIndex) => {
  if (!confirm('⚠️ 確定要永久刪除此選擇方式嗎？此操作無法復原！')) return;
  const parentTitle = activeBookingMenu.value[parentIndex]?.title;
  const realParentIndex = projectSettings.value.bookingMenu.findIndex(item => item.title === parentTitle && !item.deleted);
  if (realParentIndex === -1) return;
  const deletedMethods = (projectSettings.value.bookingMenu[realParentIndex].methods || []).filter(m => m.deleted);
  const methodTitle = deletedMethods[methodIndex]?.title;
  const realMethodIndex = projectSettings.value.bookingMenu[realParentIndex].methods.findIndex(m => m.title === methodTitle && m.deleted);
  if (realMethodIndex === -1) return;
  projectSettings.value.bookingMenu[realParentIndex].methods.splice(realMethodIndex, 1);
  await saveSettings();
  showSnackbar('選擇方式已永久刪除', 'warning');
};

// 3. Dynamic Fields
const openDynamicFieldsDialog = (methodOrTitle, parentIndex = null, methodIndex = null) => {
  if (parentIndex !== null && methodIndex !== null) {
    // New Structure Access - 將 activeBookingMenu 索引轉為實際索引
    const realParentIndex = getRealBookingMenuIndex(parentIndex);
    if (realParentIndex === -1) return;
    const realMethodIndex = getRealMethodIndex(realParentIndex, methodIndex);
    if (realMethodIndex === -1) return;
    const method = projectSettings.value.bookingMenu[realParentIndex].methods[realMethodIndex];
    currentConfiguringMethod.value = method.title; // 顯示用
    // Deep copy with array check
    const fields = method.customFields;
    tempDynamicFields.value = Array.isArray(fields) ? JSON.parse(JSON.stringify(fields)) : [];

    // Store indices (儲存的是 activeBookingMenu 的索引，後續 save 時會轉換)
    editedMethodParentIndex.value = parentIndex;
    editedMethodIndex.value = methodIndex;
  } else {
    // Fallback or Legacy
    currentConfiguringMethod.value = typeof methodOrTitle === 'object' ? methodOrTitle.title : methodOrTitle;
    tempDynamicFields.value = [];
  }

  isDynamicFieldsDialogVisible.value = true;
};

const saveDynamicFieldsConfig = async () => {
  if (editedMethodParentIndex.value !== -1 && editedMethodIndex.value !== -1) {
    const realParentIndex = getRealBookingMenuIndex(editedMethodParentIndex.value);
    if (realParentIndex === -1) return;
    const realMethodIndex = getRealMethodIndex(realParentIndex, editedMethodIndex.value);
    if (realMethodIndex === -1) return;
    projectSettings.value.bookingMenu[realParentIndex]
      .methods[realMethodIndex].customFields = tempDynamicFields.value;
  }

  isDynamicFieldsDialogVisible.value = false;
  await saveSettings();
};


const batchToDelete = ref(null);
const batchToPreview = ref(null);
const previewData = ref({});
const isPreviewLoading = ref(false);
const isDeleting = ref(false);

// 新增：定義 Email 範本可用的佔位符
const emailPlaceholders = [
  { value: '{projectName}', text: '建案名稱' },
  { value: '{unitId}', text: '戶別' },
  { value: '{bookerName}', text: '預約人姓名' },
  { value: '{appointmentDate}', text: '驗屋日期' },
];

// Email 預覽功能
const isEmailPreviewDialogVisible = ref(false);

const emailPreviewSubject = computed(() => {
  const template = projectSettings.value?.reportSettings?.uploadReminderEmail?.subject || '{projectName} {unitId} 未收到驗屋報告通知';
  return template
    .replace(/{projectName}/g, projectName.value || '測試建案')
    .replace(/{unitId}/g, 'A1-1')
    .replace(/{bookerName}/g, '王大明')
    .replace(/{appointmentDate}/g, '2026/03/15');
});

const emailPreviewHtml = computed(() => {
  const emailTemplate = projectSettings.value?.reportSettings?.uploadReminderEmail || {};
  const pName = projectName.value || '測試建案';

  let body = emailTemplate.body || '您已完成驗屋，但尚未收到您的驗屋報告。';
  body = body
    .replace(/{bookerName}/g, '王大明')
    .replace(/{appointmentDate}/g, '2026/03/15')
    .replace(/{unitId}/g, 'A1-1')
    .replace(/{projectName}/g, pName);

  let reminder = emailTemplate.reminder || '';
  reminder = reminder
    .replace(/{bookerName}/g, '王大明')
    .replace(/{appointmentDate}/g, '2026/03/15')
    .replace(/{unitId}/g, 'A1-1')
    .replace(/{projectName}/g, pName);

  const uploadUrl = emailTemplate.uploadUrl || '#';
  const uploadButtonHtml = `<p style="margin-top: 25px; padding-top: 20px; border-top: 1px solid #eeeeee; text-align: center;"><a href="${uploadUrl}" target="_blank" style="display: inline-block; padding: 10px 20px; background-color: #007bff; color: #ffffff; text-decoration: none; border-radius: 5px; font-weight: bold;">點此前往上傳報告</a></p>`;

  return `
    <div style="font-family: 'Helvetica Neue', Helvetica, Arial, 'PingFang TC', 'Microsoft JhengHei', sans-serif; background-color: #f4f4f7; padding: 20px;">
      <div style="max-width: 600px; margin: 20px auto; background-color: #ffffff; border-radius: 8px; border: 1px solid #e0e0e0; overflow: hidden;">
        <div style="background-color: #ab0300; color: #ffffff; padding: 20px; text-align: center;">
          <h2 style="margin: 0; font-size: 24px;">驗屋報告上傳提醒</h2>
        </div>
        <div style="padding: 24px; line-height: 1.6; color: #333333;">
          ${body}
          ${reminder ? `<div style="margin-top: 20px; padding: 15px; background-color: #f8f9fa; border-left: 4px solid #17a2b8;">${reminder}</div>` : ''}
          ${uploadButtonHtml}
        </div>
        <div style="background-color: #f4f4f7; padding: 16px; text-align: center; font-size: 12px; color: #777777;">
          <p style="margin: 0;">此為系統自動發送郵件，請勿直接回覆。</p>
          <p style="margin: 5px 0 0 0;">${pName} 驗屋報告系統</p>
          <p style="margin: 10px 0 0 0; font-size: 11px; color: #999999;">
            本服務由 <a href="https://anxismart.com/" target="_blank" style="color: #007bff; text-decoration: none; font-weight: bold;">anxismart安熙智慧建案管理系統</a> 提供技術支援
          </p>
        </div>
      </div>
    </div>`;
});


// 新增星期幾的設定
const weekDays = [
  { key: 'monday', label: '星期一' },
  { key: 'tuesday', label: '星期二' },
  { key: 'wednesday', label: '星期三' },
  { key: 'thursday', label: '星期四' },
  { key: 'friday', label: '星期五' },
  { key: 'saturday', label: '星期六' },
  { key: 'sunday', label: '星期日' },
];

// --- Customer Message Logic ---
const isCustomerMessageDialogOpen = ref(false);
const editedCustomerMessageType = ref(''); // 'add' or 'edit'
const editedCustomerMessageIndex = ref(-1);
const editedCustomerMessageConfig = ref({
  id: '',
  functionName: '',
  buttonText: '',
  dialogTitle: '',
  enableBuildingSelect: true,
  enableUnitSelect: true,
  enableIdVerification: false,
  enableFileUpload: false,
  customFields: []
});
const isCustomerMessagePreviewDialogOpen = ref(false);
const customerMessagePreviewData = ref({});


const openCustomerMessageDialog = (config = null, index = -1) => {
  if (config) {
    editedCustomerMessageType.value = 'edit';
    editedCustomerMessageIndex.value = index;
    // Deep copy to check
    editedCustomerMessageConfig.value = JSON.parse(JSON.stringify(config));
  } else {
    editedCustomerMessageType.value = 'add';
    editedCustomerMessageIndex.value = -1;
    editedCustomerMessageConfig.value = {
      id: uuidv4(),
      functionName: '',
      buttonText: '回傳資訊',
      dialogTitle: '填寫資訊',
      enableBuildingSelect: true,
      enableUnitSelect: true,
      enableIdVerification: true,
      enableFileUpload: false,
      customFields: []
    };
  }
  isCustomerMessageDialogOpen.value = true;
};

const saveCustomerMessageConfig = async () => {
  // Basic validation
  if (!editedCustomerMessageConfig.value.functionName || !editedCustomerMessageConfig.value.buttonText) {
    showSnackbar('請填寫功能名稱與按鈕文字', 'error');
    return;
  }

  if (!projectSettings.value.customerMessageConfigs) {
    projectSettings.value.customerMessageConfigs = [];
  }

  if (editedCustomerMessageType.value === 'add') {
    projectSettings.value.customerMessageConfigs.push(editedCustomerMessageConfig.value);
  } else {
    projectSettings.value.customerMessageConfigs[editedCustomerMessageIndex.value] = editedCustomerMessageConfig.value;
  }

  isCustomerMessageDialogOpen.value = false;
  await saveSettings(); // Auto save to firestore
};

const deleteCustomerMessageConfig = async (index) => {
  if (!confirm('確定要刪除此功能設定嗎？')) return;

  projectSettings.value.customerMessageConfigs.splice(index, 1);
  await saveSettings();
};


// Conflict resolution state
const conflictData = ref({ conflictingDates: [], nonConflictingDates: [] });
const dateResolutions = reactive({});

// Delete dialog state
const deleteBatchDates = ref([]);
const isDeleteDatesLoading = ref(false);


// Date Time Picker states
const menuAppStart = ref(false);
const menuAppEnd = ref(false);
const menuBookingStart = ref(false);
const menuBookingEnd = ref(false);
const activePickerTabStart = ref(0);
const tempDateStart = ref(null);
const tempTimeStart = ref(null);
const activePickerTabEnd = ref(0);
const tempDateEnd = ref(null);
const tempTimeEnd = ref(null);

//  --- 新增：公開預約設定選項 ---
const defaultBookingTypes = ref(['初驗', '複驗']);
const defaultBookingMethods = ref(['屋主自驗', '設計師陪驗', '授權驗屋', '代驗公司']);



// Default batch object
const defaultBatch = {
  id: null,
  batchCode: '',
  bookingType: null,
  applicationStart: '',
  applicationEnd: '',
  bookingStart: '',
  bookingEnd: '',
  dailyRules: {},
  quotaMode: 'shared', // 名額計算模式：'shared' 共用名額 | 'isolated' 獨立名額
};
const editedBatch = ref({ ...defaultBatch });
const selectedDaysForEditing = ref([]);
const isLoadingBatchData = ref(false); // 防止編輯載入時 watcher 清空已選日期
// 快速新增時段面板的暫存狀態
const pendingNewSlots = ref([]);
const pendingNewCapacity = ref(1);
const pendingNewMethods = ref([]);



const batchHeaders = [
  { title: '批次代號', key: 'batchCode' },
  { title: '預約項目', key: 'bookingType' },
  { title: '名額模式', key: 'quotaMode', sortable: true },
  { title: '預約開放區間', key: 'applicationWindow', sortable: false },
  { title: '可預約區間', key: 'bookingWindow', sortable: false },
  { title: '狀態', key: 'statusText', sortable: true },
  { title: '操作', key: 'actions', sortable: false, align: 'end' },
];


const selectedBookingItemForSetting = ref('');
const processedBookingBatches = computed(() => {
  return bookingBatches.value.map(item => ({
    ...item,
    statusText: getBatchStatus(item).text
  }));
});

// 用於過濾卡片列表
const filteredBatchesForCards = computed(() => {
  if (!searchQuery.value) {
    return processedBookingBatches.value;
  }
  const lowerQuery = searchQuery.value.toLowerCase().trim();
  return processedBookingBatches.value.filter(item =>
    Object.values(item).some(val =>
      String(val).toLowerCase().includes(lowerQuery)
    )
  );
});

const tempBookingStartDate = computed({
  get: () => editedBatch.value.bookingStart ? new Date(editedBatch.value.bookingStart) : null,
  set: (val) => { if (val) editedBatch.value.bookingStart = formatDate(val); }
});

const tempBookingEndDate = computed({
  get: () => editedBatch.value.bookingEnd ? new Date(editedBatch.value.bookingEnd) : null,
  set: (val) => { if (val) editedBatch.value.bookingEnd = formatDate(val); }
});

const capacityPresets = Array.from({ length: 9 }, (_, i) => i + 1);
const timeSlotPresets = Array.from({ length: 24 }, (_, i) => {
  const hour = i.toString().padStart(2, '0');
  return [`${hour}:00`, `${hour}:30`];
}).flat().slice(18, 35);

// --- Validation Rules ---
const timeArrayRule = (values) => {
  const pattern = /^([01]\d|2[0-3]):([0-5]\d)$/;
  return values.every(v => pattern.test(v)) || '格式錯誤，請移除不符合 HH:MM 格式的項目';
};

const batchUniquenessRule = (value) => {
  const currentCode = value;
  const currentType = editedBatch.value.bookingType === '其他'
    ? customBookingType.value
    : editedBatch.value.bookingType;

  if (!currentCode || !currentType) return true;

  const isDuplicate = bookingBatches.value.some(batch =>
    batch.id !== editedBatch.value.id &&
    batch.bookingType === currentType &&
    batch.batchCode === currentCode
  );

  return !isDuplicate || `⚠️「${currentType}」批次代號重複。`;
};



// --- Helper Functions ---
function formatDate(date) {
  if (!date) return '';
  const d = new Date(date);
  const year = d.getFullYear();
  const month = (d.getMonth() + 1).toString().padStart(2, '0');
  const day = d.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function formatDateWithWeekday(dateInput) {
  if (!dateInput) return '';
  const date = new Date(dateInput);
  const weekday = new Intl.DateTimeFormat('zh-TW', { weekday: 'short' }).format(date);
  return `${formatDate(date)} (${weekday})`;
}

// 在 script setup 區塊中找到這個函式並替換
function formatDisplayDateTime(dateTime) {
  if (!dateTime) return '';

  let d;
  // 檢查是否為物件且非 null
  if (typeof dateTime === 'object' && dateTime !== null) {
    // 優先檢查 _seconds (Cloud Function 格式)
    if (typeof dateTime._seconds === 'number') {
      d = new Date(dateTime._seconds * 1000);
    }
    // 檢查 seconds (標準格式)
    else if (typeof dateTime.seconds === 'number') {
      d = new Date(dateTime.seconds * 1000);
    }
    // 檢查是否為原生 Date 物件
    else if (dateTime instanceof Date) {
      d = dateTime;
    }
    // 其他物件嘗試直接轉
    else {
      d = new Date(dateTime);
    }
  } else {
    // 字串或其他
    d = new Date(dateTime);
  }

  // 驗證轉換後的日期是否有效
  if (isNaN(d.getTime())) {
    return '';
  }

  // 手動格式化為 'YYYY-MM-DD HH:mm'
  const pad = (num) => num.toString().padStart(2, '0');
  const year = d.getFullYear();
  const month = pad(d.getMonth() + 1);
  const day = pad(d.getDate());
  const hours = pad(d.getHours());
  const minutes = pad(d.getMinutes());

  return `${year}-${month}-${day} ${hours}:${minutes}`;
}

function isWeekend(dateInput) {
  if (!dateInput) return false;
  const day = new Date(dateInput).getDay();
  return day === 0 || day === 6;
}

function showSnackbar(text, color = 'success') {
  snackbar.text = text;
  snackbar.color = color;
  snackbar.show = true;
}



// --- Data Loading & Main Logic ---
async function loadDataForProject() {
  isLoading.value = true;
  await projectStore.fetchProjects();
  if (projectName.value) {
    // ✓ START: 將載入設定的邏輯提前
    // 使用 Promise.all 同時執行兩項載入任務，效率更高
    isBatchLoading.value = true;
    isSettingsLoading.value = true; // 也觸發設定的載入狀態
    try {
      const [batches, settings] = await Promise.all([
        fetchBookingBatches(projectId.value),
        fetchProjectConfig(projectId.value)
      ]);

      bookingBatches.value = batches;

      // 載入成功後，合併遠端設定與預設值
      if (settings) {
        projectSettings.value.enableScheduledPublish = settings.enableScheduledPublish || false;
        projectSettings.value.publishStartTime = settings.publishStartTime ? new Date(settings.publishStartTime) : null;
        projectSettings.value.publishEndTime = settings.publishEndTime ? new Date(settings.publishEndTime) : null;
        projectSettings.value.logoUrl = settings.logoUrl || '';
        projectSettings.value.pageTitle = settings.pageTitle || defaultSettings.value.pageTitle;
        projectSettings.value.titleColor = settings.titleColor || defaultSettings.value.titleColor;
        projectSettings.value.themeColor = settings.themeColor || defaultSettings.value.themeColor;
        projectSettings.value.isPublished = settings.isPublished || false;
        projectSettings.value.checkDuplicate = settings.checkDuplicate || "OFF";
        projectSettings.value.validateId = settings.validateId || "OFF";
        projectSettings.value.bookingTypes = settings.bookingTypes || [];
        projectSettings.value.showReportUploadButton = settings.showReportUploadButton || false;
        projectSettings.value.bookingMethodOptions = settings.bookingMethodOptions || [];
        projectSettings.value.bookingMethodConfigs = settings.bookingMethodConfigs || {}; // [New] Load configs
        projectSettings.value.inspectionStaff = settings.inspectionStaff || [];
        // 👇👇👇 [新增：讀取排程設定] 👇👇👇

        // 1. 讀取啟用開關
        projectSettings.value.enableScheduledPublish = settings.enableScheduledPublish || false;

        // 👇👇👇 [新增：讀取 Google Sheet 設定] 👇👇👇
        projectSettings.value.googleSheetId = settings.googleSheetId || '';
        projectSettings.value.googleSheetTabName = settings.googleSheetTabName || '';
        projectSettings.value.appointmentsSheetId = settings.appointmentsSheetId || ''; // [新增]
        projectSettings.value.appointmentsSheetTabName = settings.appointmentsSheetTabName || ''; // [新增]
        projectSettings.value.customerMessageConfigs = settings.customerMessageConfigs || []; // [新增] 客戶回傳功能
        projectSettings.value.authLetterTemplate = settings.authLetterTemplate || ''; // [新增] 授權書範本
        projectSettings.value.bookingCapacityGroups = settings.bookingCapacityGroups || []; // [新增] 名額共用群組

        // --- Migration Logic for Page Settings By Item (NEW) ---
        projectSettings.value.pageSettingsByItem = settings.pageSettingsByItem || {};

        // 確保每個 BookingItem 都有對應的 pageSettings（向下相容遷移）
        const ensurePageSettingsForItems = () => {
          const menu = projectSettings.value.bookingMenu || [];
          menu.forEach(item => {
            if (!projectSettings.value.pageSettingsByItem[item.title]) {
              // 若 DB 中沒有此項目的設定，則用原有全域 intro/pageTitle 作為預設值
              projectSettings.value.pageSettingsByItem[item.title] = {
                pageTitle: settings.pageTitle || defaultSettings.value.pageTitle,
                intro: {
                  ...defaultSettings.value.intro,
                  ...(settings.intro || {}),
                  alert: { ...defaultSettings.value.intro.alert, ...(settings.intro?.alert || {}) },
                  contact: { ...defaultSettings.value.intro.contact, ...(settings.intro?.contact || {}) },
                  datePickerReminder: { ...defaultSettings.value.intro.datePickerReminder },
                  faq: settings.intro?.faq ? JSON.parse(JSON.stringify(settings.intro.faq)) : [],
                  attachments: settings.intro?.attachments ? JSON.parse(JSON.stringify(settings.intro.attachments)) : []
                }
              };
            } else {
              // 對已存在的項目，補齊新增的 datePickerReminder 欄位（向下相容）
              const existingIntro = projectSettings.value.pageSettingsByItem[item.title].intro;
              if (!existingIntro.datePickerReminder) {
                existingIntro.datePickerReminder = { ...defaultSettings.value.intro.datePickerReminder };
              }
            }
          });
          // 預設選取第一個項目
          if (menu.length > 0 && !selectedBookingItemForSetting.value) {
            selectedBookingItemForSetting.value = menu[0].title;
          }
        };

        // --- Migration Logic for Booking Menu (NEW) ---
        projectSettings.value.bookingMenu = settings.bookingMenu || [];

        if (projectSettings.value.bookingMenu.length === 0) {
          const legacyTypes = projectSettings.value.bookingTypes || [];
          const legacyMethods = projectSettings.value.bookingMethodOptions || [];

          if (legacyTypes.length > 0 && legacyMethods.length > 0) {
            console.log('Migrating legacy booking structure to Booking Menu...');
            projectSettings.value.bookingMenu = legacyTypes.map(type => ({
              title: type,
              methods: legacyMethods.map(m => {
                const title = typeof m === 'object' ? m.title : m;
                // Try to preserve existing custom fields configs if they match by name?
                // For now, simple migration. Detailed field migration might need more complex logic 
                // if we stored them keyed by method name globally.
                // Checking settings.bookingMethodConfigs if exists
                let existingFields = [];
                if (settings.bookingMethodConfigs && settings.bookingMethodConfigs[title]) {
                  existingFields = settings.bookingMethodConfigs[title];
                }

                return { title, customFields: existingFields };
              })
            }));
          }
        }
        // 👆👆👆 [新增結束] 👆👆👆

        // 呼叫 migration：確保每個 bookingMenu 項目都有 pageSettingsByItem
        ensurePageSettingsForItems();

        // 2. 定義一個臨時的轉換函式 (處理 Firestore Timestamp / Seconds / String)
        const toDate = (val) => {
          if (!val) return null;

          // 情況 A: Firestore Timestamp 物件 (Client SDK)
          if (typeof val === 'object' && typeof val.toDate === 'function') {
            return val.toDate();
          }

          // 情況 B: 序列化後的物件 (標準 seconds)
          if (typeof val === 'object' && typeof val.seconds === 'number') {
            return new Date(val.seconds * 1000);
          }

          // 情況 C: Cloud Function 序列化物件 (_seconds) <--- 這是關鍵缺失
          if (typeof val === 'object' && typeof val._seconds === 'number') {
            return new Date(val._seconds * 1000);
          }

          // 情況 D: ISO 字串或 Date 物件
          const d = new Date(val);
          return isNaN(d.getTime()) ? null : d;
        };

        // 3. 轉換並賦值
        projectSettings.value.publishStartTime = toDate(settings.publishStartTime);
        projectSettings.value.publishEndTime = toDate(settings.publishEndTime);

        // 👆👆👆 [新增結束] 👆👆👆


        projectSettings.value.intro = {
          ...defaultSettings.value.intro,
          ...(settings.intro || {}),
          alert: { ...defaultSettings.value.intro.alert, ...(settings.intro?.alert || {}) },
          contact: { ...defaultSettings.value.intro.contact, ...(settings.intro?.contact || {}) }
        };
        projectSettings.value.reportUploadIntro = {
          ...defaultSettings.value.reportUploadIntro,
          ...(settings.reportUploadIntro || {}),
          alert: { ...defaultSettings.value.reportUploadIntro.alert, ...(settings.reportUploadIntro?.alert || {}) },
        };
        projectSettings.value.reportSettings = {
          ...defaultSettings.value.reportSettings,
          ...(settings.reportSettings || {}),

          uploadReminderSchedule: {
            ...defaultSettings.value.reportSettings.uploadReminderSchedule,
            ...(settings.reportSettings?.uploadReminderSchedule || {})
          },


          uploadReminderEmail: {
            ...defaultSettings.value.reportSettings.uploadReminderEmail,
            ...(settings.reportSettings?.uploadReminderEmail || {})
          },
          notDownloadedReminderSchedule: {
            ...defaultSettings.value.reportSettings.notDownloadedReminderSchedule,
            ...(settings.reportSettings?.notDownloadedReminderSchedule || {})
          }
        };
        // ✓ 新增：讀取驗屋報告模板 URL
        projectSettings.value.inspectionReportTemplateUrl = settings.inspectionReportTemplateUrl || '';
        // ✓ 新增：讀取 LINE Token Secret Name
        projectSettings.value.lineChannelAccessTokenSecretName = settings.lineChannelAccessTokenSecretName || '';
        // ... existing settings loading ...

      } else {
        // 如果從後端沒有讀取到任何設定，則使用預設值
        projectSettings.value = JSON.parse(JSON.stringify(defaultSettings.value));
      }

    } catch (error) {
      showSnackbar(`載入頁面資料失敗: ${error.message}`, 'error');
      // 載入失敗時也使用預設值，確保頁面可以基本運作
      projectSettings.value = JSON.parse(JSON.stringify(defaultSettings.value));
    } finally {
      isBatchLoading.value = false;
      isSettingsLoading.value = false; // 結束載入狀態
    }
    // ✓ END: 載入邏輯修改完成
  } else {
    showSnackbar(`錯誤：找不到建案 ID ${projectId.value}`, 'error');
  }
  isLoading.value = false;
}

// --- Dynamic Fields Logic ---


// --- Dialog Open/Close Functions ---
async function openBatchDialog(item = null) {
  isLoadingBatchData.value = true; // 防止 bookingStart/End watcher 清空 selectedDaysForEditing
  customBookingType.value = '';
  if (item) {
    // ✓ START: 處理從後端讀取的時間物件
    // 1. 深度複製一份從 props 傳來的 item 物件，避免直接修改
    const itemFromServer = JSON.parse(JSON.stringify(item));

    // 2. Firebase SDK v9 會自動將 Timestamp 轉為 JS Date 物件，
    //    但如果資料是舊的字串格式，我們手動將其轉換為 Date 物件以確保相容性
    if (itemFromServer.applicationStart && typeof itemFromServer.applicationStart === 'string') {
      itemFromServer.applicationStart = new Date(itemFromServer.applicationStart);
    }
    if (itemFromServer.applicationEnd && typeof itemFromServer.applicationEnd === 'string') {
      itemFromServer.applicationEnd = new Date(itemFromServer.applicationEnd);
    }

    const dailyRules = await fetchRulesForBatch(item.id);

    for (const date in dailyRules) {
      const slots = dailyRules[date].slots;
      for (const time in slots) {
        if (typeof slots[time] === 'number') {
          slots[time] = { capacity: slots[time], methods: [] };
        }
      }
    }
    // 3. 使用處理過後的 itemFromServer
    // 載入 quotaMode 並暫存原始值（用於偵測是否修改並顯示警告）
    editedBatch.value = {
      ...itemFromServer,
      dailyRules,
      quotaMode: itemFromServer.quotaMode || 'shared',  // 向下相容：舊批次預設 shared
      _originalQuotaMode: itemFromServer.quotaMode || 'shared'
    };

    if (!bookingTypeOptions.value.includes(item.bookingType)) {
      editedBatch.value.bookingType = '其他';
      customBookingType.value = item.bookingType;
    }
  } else {
    editedBatch.value = { ...defaultBatch, dailyRules: {}, quotaMode: 'shared' };
  }

  // 編輯模式下，自動選中資料庫中已設定時段的日期，讓右側面板直接顯示時段資料
  if (item && editedBatch.value.dailyRules) {
    const configuredDates = Object.keys(editedBatch.value.dailyRules)
      .filter(date => {
        const slots = editedBatch.value.dailyRules[date]?.slots;
        return slots && Object.keys(slots).length > 0;
      })
      .sort();
    selectedDaysForEditing.value = configuredDates.map(d => parseISO(d));
  } else {
    selectedDaysForEditing.value = [];
  }
  pendingNewSlots.value = [];
  pendingNewMethods.value = [];
  pendingNewCapacity.value = 1;
  isBatchDialogVisible.value = true;

  // 等 DOM 更新完畢後才解除 flag，避免 watcher 誤清空
  await nextTick();
  isLoadingBatchData.value = false;
}

async function openDeleteDialog(item) {
  batchToDelete.value = item;
  isDeleteDialogVisible.value = true;
  isDeleteDatesLoading.value = true;
  deleteBatchDates.value = [];

  try {
    //  [修改] 使用新的 API 函式
    const dailyRules = await fetchRulesForBatch(item.id);
    deleteBatchDates.value = Object.keys(dailyRules).sort();
  } catch (error) {
    showSnackbar(`讀取批次關聯日期失敗: ${error.message}`, 'error');
  } finally {
    isDeleteDatesLoading.value = false;
  }
}

function closeDeleteDialog() {
  batchToDelete.value = null;
  deleteBatchDates.value = [];
  isDeleteDialogVisible.value = false;
}

async function openPreviewDialog(item) {
  batchToPreview.value = item;
  isPreviewDialogVisible.value = true;
  isPreviewLoading.value = true;
  try {
    //  [修改] 使用新的 API 函式
    const dailyRules = await fetchRulesForBatch(item.id);

    // Ensure data structure is consistent
    for (const date in dailyRules) {
      const slots = dailyRules[date].slots;
      for (const time in slots) {
        if (typeof slots[time] === 'number') {
          slots[time] = { capacity: slots[time], methods: [] };
        }
      }
    }

    const formattedData = {};
    if (item.bookingStart && item.bookingEnd) {
      const intervalDates = eachDayOfInterval({
        start: parseISO(item.bookingStart),
        end: parseISO(item.bookingEnd)
      });

      for (const dateObj of intervalDates) {
        const dateKey = formatDate(dateObj);
        const ruleForDay = dailyRules[dateKey];
        const slotsData = [];
        if (ruleForDay && ruleForDay.slots) {
          for (const time of Object.keys(ruleForDay.slots).sort()) {
            const slotInfo = ruleForDay.slots[time];
            slotsData.push({
              time: time,
              capacity: slotInfo.capacity || 0,
              maxCapacity: slotInfo.maxCapacity || null,
              methods: slotInfo.methods || [],
              methodLimits: slotInfo.methodLimits || {},
              subOptionLimits: slotInfo.subOptionLimits || {}
            });
          }
        }
        formattedData[dateKey] = slotsData;
      }
    }
    previewData.value = formattedData;
  } catch (error) {
    showSnackbar(`讀取預覽資料失敗: ${error.message}`, 'error');
  } finally {
    isPreviewLoading.value = false;
  }
}

// 取得方式的名額顯示文字（若有子項目則加總子項目，否則使用方式名額）
function getMethodLimitDisplay(slot, method) {
  const subOpts = batchMethodSubOptionsMap.value?.[method] || [];

  if (subOpts.length > 0) {
    // 有子項目：加總子項目的名額
    let total = 0;
    subOpts.forEach(subOpt => {
      total += Number(slot.subOptionLimits?.[subOpt]) || 0;
    });
    if (total > 0) {
      return `(${total} 名)`;
    }
  } else {
    // 無子項目：使用方式的名額
    const limit = slot.methodLimits?.[method];
    if (limit) {
      return `(${limit} 名)`;
    }
  }

  return '(無限制)';
}

// 驗證時段名額配置（名額必須 ≤ 時段總名額上限）
function validateSlotCapacities() {
  for (const dateKey in editedBatch.value.dailyRules) {
    const slots = editedBatch.value.dailyRules[dateKey].slots || {};
    for (const slotTime in slots) {
      const slotData = slots[slotTime];
      const capacity = slotData.capacity || 0;
      const maxCapacity = slotData.maxCapacity ? Number(slotData.maxCapacity) : null;

      // 如果設定了時段總名額上限，則名額必須 ≤ 上限
      if (maxCapacity !== null && capacity > maxCapacity) {
        showSnackbar(
          `時段 ${slotTime} 的名額(${capacity})不能超過時段總名額上限(${maxCapacity})，請調整。`,
          'error'
        );
        return false;
      }
    }
  }
  return true;
}

// --- Save & Delete Process ---
async function initiateSaveProcess() {
  const { valid } = await batchForm.value.validate();
  if (!valid) return;

  // 驗證名額配置
  if (!validateSlotCapacities()) {
    return;
  }

  isSaving.value = true;
  await checkConflictsAndShowDialog();
  isSaving.value = false;
}

//  在 BookingRuleManager.vue 中，用這個新版本取代舊的函式
async function checkConflictsAndShowDialog() {
  //  [關鍵修改] 直接使用 datepicker 中選定的日期作為要處理的列表
  const datesToCheck = selectedDaysForEditing.value.map(d => formatDate(d));

  if (datesToCheck.length === 0) {
    showSnackbar('您尚未在日曆中選擇任何要設定的日期', 'warning');
    isSaving.value = false;
    return;
  }

  const currentBatchId = editedBatch.value.id || null;
  const conflictResult = await checkDateConflicts(projectId.value, datesToCheck, currentBatchId);

  //  [修正] 將排序程式碼加回來
  conflictResult.conflictingDates.sort((a, b) => a.date.localeCompare(b.date));


  conflictData.value = conflictResult;
  Object.keys(dateResolutions).forEach(key => delete dateResolutions[key]);

  conflictResult.conflictingDates.forEach(d => {
    dateResolutions[d.date] = {
      mode: 'link',
      targetRuleId: d.existingRule.ruleId
    };
  });

  // 對於無衝突的日期，需要檢查是否屬於當前批次
  // 如果已屬於當前批次 → update_shared（更新現有規則）
  // 如果是新日期 → create_shared（創建新規則）

  // 只有在編輯現有批次時才進行檢查
  if (!editedBatch.value.id) {
    // 新增批次，所有非衝突日期都是新規則
    conflictResult.nonConflictingDates.forEach(date => {
      dateResolutions[date] = {
        mode: 'create_shared'
      };
    });
  } else {
    // 編輯現有批次，需要檢查哪些日期已屬於該批次
    // editedBatch.value.dailyRules 包含已加載的規則，其中有 ruleId
    const currentBatchRules = editedBatch.value.dailyRules || {};

    for (const date of conflictResult.nonConflictingDates) {
      const existingRule = currentBatchRules[date];
      if (existingRule && existingRule.ruleId) {
        // 日期已屬於當前批次，應更新現有規則
        dateResolutions[date] = {
          mode: 'update_shared',
          targetRuleId: existingRule.ruleId
        };
      } else {
        // 日期是新的，創建新規則
        dateResolutions[date] = {
          mode: 'create_shared'
        };
      }
    }
  }

  if (conflictData.value.conflictingDates.length > 0) {
    isConflictDialogVisible.value = true;
  } else {
    await executeSave();
  }
}

//  在 BookingRuleManager.vue 中，用這個新版本取代舊的函式
async function executeSave() {
  isSaving.value = true;

  //  [關鍵修改] 再次根據 selectedDaysForEditing 過濾，確保只提交勾選日期的資料
  const selectedDateKeys = selectedDaysForEditing.value.map(d => formatDate(d));

  const filteredDailyRules = {};
  const filteredResolutions = {};

  selectedDateKeys.forEach(dateKey => {
    if (editedBatch.value.dailyRules[dateKey]) {
      filteredDailyRules[dateKey] = editedBatch.value.dailyRules[dateKey];
    }
    if (dateResolutions[dateKey]) {
      filteredResolutions[dateKey] = dateResolutions[dateKey];
    }
  });

  const dataToSave = JSON.parse(JSON.stringify(editedBatch.value));

  // 將 applicationStart/End 從字串 'YYYY-MM-DDTHH:mm' 轉換為 JS Date 物件
  if (dataToSave.applicationStart && typeof dataToSave.applicationStart === 'string') {
    dataToSave.applicationStart = new Date(dataToSave.applicationStart);
  }
  if (dataToSave.applicationEnd && typeof dataToSave.applicationEnd === 'string') {
    dataToSave.applicationEnd = new Date(dataToSave.applicationEnd);
  }

  const finalPayload = {
    batchData: {
      ...dataToSave, // 使用轉換過後的 dataToSave
      dailyRules: filteredDailyRules
    },
    resolutions: filteredResolutions
  };

  if (finalPayload.batchData.bookingType === '其他') {
    finalPayload.batchData.bookingType = customBookingType.value;
  }
  finalPayload.batchData.projectId = projectId.value;
  finalPayload.batchData.projectName = projectName.value;

  try {
    // Firebase SDK 會自動將 Date 物件轉換為 Timestamp 存入資料庫
    const res = await saveBatchWithRules(finalPayload);
    if (res.status !== 'success') throw new Error(res.message);

    showSnackbar('儲存成功！');
    isConflictDialogVisible.value = false;
    isBatchDialogVisible.value = false;

    await loadDataForProject();
  } catch (error) {
    showSnackbar(`儲存失敗: ${error.message || '未知錯誤'}`, 'error');
  } finally {
    isSaving.value = false;
  }
}

async function handleConfirmDelete() {
  if (!batchToDelete.value) return;
  isDeleting.value = true;
  try {
    const res = await deleteBookingBatch(batchToDelete.value.id);
    if (res.status !== 'success') throw new Error(res.message);

    const index = bookingBatches.value.findIndex(b => b.id === batchToDelete.value.id);
    if (index > -1) bookingBatches.value.splice(index, 1);

    showSnackbar('批次已成功刪除');
    closeDeleteDialog();
  } catch (error) {
    showSnackbar(`刪除失敗: ${error.message}`, 'error');
  } finally {
    isDeleting.value = false;
  }
}

// --- Daily Rule Editor Functions ---
const currentDaySlots = computed({
  get() {
    if (selectedDaysForEditing.value.length === 0) return [];
    const firstDateKey = formatDate(selectedDaysForEditing.value[0]);
    const slots = editedBatch.value.dailyRules[firstDateKey]?.slots || {};
    return Object.keys(slots);
  },
  set(newSlots) {
    if (selectedDaysForEditing.value.length === 0) return;

    selectedDaysForEditing.value.forEach(day => {
      const dateKey = formatDate(day);
      if (!editedBatch.value.dailyRules[dateKey]) {
        editedBatch.value.dailyRules[dateKey] = { slots: {} };
      }

      const oldSlotsData = editedBatch.value.dailyRules[dateKey].slots;
      const newSlotsData = {};

      newSlots.forEach(slot => {
        newSlotsData[slot] = oldSlotsData[slot] || { capacity: 1, methods: [] };
      });
      editedBatch.value.dailyRules[dateKey].slots = newSlotsData;
    });
  }
});

const sortedCurrentDaySlots = computed(() => [...currentDaySlots.value].sort());

function getCapacityForSlot(slot) {
  if (selectedDaysForEditing.value.length === 0) return 0;
  const firstDateKey = formatDate(selectedDaysForEditing.value[0]);
  return editedBatch.value.dailyRules[firstDateKey]?.slots?.[slot]?.capacity || 0;
}

function setCapacityForSlot(slot, capacity) {
  const cap = Number(capacity) || 0;
  selectedDaysForEditing.value.forEach(day => {
    const slots = editedBatch.value.dailyRules[formatDate(day)]?.slots;
    if (slots && slots[slot]) slots[slot].capacity = cap;
  });
}

// 新增：自動計算並更新時段總名額（依據各方式/子選項名額加總）
function recalcCapacityForSlot(dateKey, slotTime) {
  const daySlot = editedBatch.value.dailyRules[dateKey]?.slots?.[slotTime];
  if (!daySlot) return;

  let total = 0;
  let hasAnyLimit = false;  // 追蹤是否至少有一個限額被填寫
  const methods = daySlot.methods || [];

  methods.forEach(method => {
    const subOpts = batchMethodSubOptionsMap.value[method] || [];
    if (subOpts.length > 0) {
      // 有子選項的方式：加總所有子選項名額
      subOpts.forEach(sub => {
        const subVal = Number(daySlot.subOptionLimits?.[sub]) || 0;
        if (subVal > 0) hasAnyLimit = true;
        total += subVal;
      });
    } else {
      // 無子選項的方式：直接加上方式名額
      const methodVal = Number(daySlot.methodLimits?.[method]) || 0;
      if (methodVal > 0) hasAnyLimit = true;
      total += methodVal;
    }
  });

  // 只有當至少有一個方式/子選項有填寫限額時，才更新總名額
  // 否則保持原有的全局 capacity，讓使用者手動設定
  if (hasAnyLimit) {
    daySlot.capacity = total;
  }
}

// 讀取時段總名額上限
function getMaxCapacityForSlot(slot) {
  if (selectedDaysForEditing.value.length === 0) return '';
  const firstDateKey = formatDate(selectedDaysForEditing.value[0]);
  const val = editedBatch.value.dailyRules[firstDateKey]?.slots?.[slot]?.maxCapacity;
  return (val === null || val === undefined) ? '' : val;
}

// 設定時段總名額上限
function setMaxCapacityForSlot(slot, value) {
  const valStr = String(value).trim();
  selectedDaysForEditing.value.forEach(day => {
    const dateKey = formatDate(day);
    const daySlot = editedBatch.value.dailyRules[dateKey]?.slots?.[slot];
    if (daySlot) {
      daySlot.maxCapacity = (valStr === '') ? null : (Number(valStr) || 0);
    }
  });
}

// 計算有填寫名額（非空白非0）的方式合計（不含共用的方式）
function getAssignedCapacityForSlot(slot) {
  if (selectedDaysForEditing.value.length === 0) return 0;
  const firstDateKey = formatDate(selectedDaysForEditing.value[0]);
  const daySlot = editedBatch.value.dailyRules[firstDateKey]?.slots?.[slot];
  if (!daySlot) return 0;
  let total = 0;
  const methods = daySlot.methods || [];
  methods.forEach(method => {
    const subOpts = batchMethodSubOptionsMap.value[method] || [];
    if (subOpts.length > 0) {
      subOpts.forEach(sub => {
        const v = Number(daySlot.subOptionLimits?.[sub]) || 0;
        total += v;
      });
    } else {
      const v = Number(daySlot.methodLimits?.[method]) || 0;
      total += v;
    }
  });
  return total;
}

// 是否超出總名額上限
function isSlotOverMaxCapacity(slot) {
  const max = getMaxCapacityForSlot(slot);
  if (max === '' || max === null) return false;
  return getAssignedCapacityForSlot(slot) > Number(max);
}

// 讀取特定時段特定方式的名額
function getMethodLimitForSlot(slot, method) {
  if (selectedDaysForEditing.value.length === 0) return '';
  const firstDateKey = formatDate(selectedDaysForEditing.value[0]);
  return editedBatch.value.dailyRules[firstDateKey]?.slots?.[slot]?.methodLimits?.[method] ?? '';
}

// 設定特定時段特定方式的名額
function setMethodLimitForSlot(slot, method, value) {
  const valStr = String(value).trim();
  selectedDaysForEditing.value.forEach(day => {
    const dateKey = formatDate(day);
    const daySlot = editedBatch.value.dailyRules[dateKey]?.slots?.[slot];
    if (daySlot) {
      if (!daySlot.methodLimits) daySlot.methodLimits = {};
      if (valStr === '') {
        delete daySlot.methodLimits[method];
      } else {
        daySlot.methodLimits[method] = Number(valStr) || 0;
      }
      // 修改後自動重算該時段的總名額
      recalcCapacityForSlot(dateKey, slot);
    }
  });
}

// 新增：讀取特定時段的子選項名額
function getSubOptionCapacityForSlot(slot, subOption) {
  if (selectedDaysForEditing.value.length === 0) return '';
  const firstDateKey = formatDate(selectedDaysForEditing.value[0]);
  return editedBatch.value.dailyRules[firstDateKey]?.slots?.[slot]?.subOptionLimits?.[subOption] ?? '';
}

// 新增：設定特定時段的子選項名額
function setSubOptionCapacityForSlot(slot, subOption, capacity) {
  const capStr = String(capacity).trim();
  selectedDaysForEditing.value.forEach(day => {
    const dateKey = formatDate(day);
    const daySlot = editedBatch.value.dailyRules[dateKey]?.slots?.[slot];
    if (daySlot) {
      if (!daySlot.subOptionLimits) {
        daySlot.subOptionLimits = {};
      }
      if (capStr === '') {
        delete daySlot.subOptionLimits[subOption];
      } else {
        daySlot.subOptionLimits[subOption] = Number(capStr) || 0;
      }
      // 修改後自動重算該時段的總名額
      recalcCapacityForSlot(dateKey, slot);
    }
  });
}

// 快速新增時段：將 pendingNewSlots 套用到所有已選日期
// 說明：新增時段時不預設各方式的名額，讓使用者自行決定是否使用【各方式獨立名額】
// - 如果不輸入各方式名額 → 多個方式共用時段總名額
// - 如果輸入某些方式的名額 → 該時段的名額自動計算為各方式名額之和
function applyPendingSlots() {
  if (!pendingNewSlots.value.length || !selectedDaysForEditing.value.length) return;

  // 使用預設名額，如果未輸入則預設為 1
  const initialCapacity = Number(pendingNewCapacity.value) || 1;

  selectedDaysForEditing.value.forEach(day => {
    const dateKey = formatDate(day);
    if (!editedBatch.value.dailyRules[dateKey]) {
      editedBatch.value.dailyRules[dateKey] = { slots: {} };
    }
    const daySlots = { ...editedBatch.value.dailyRules[dateKey].slots };
    pendingNewSlots.value.forEach(slot => {
      if (!daySlots[slot]) {
        // 新增時段時，methodLimits 保持為空對象
        // 使用者可以選擇填寫各方式名額，或保持空白表示共用時段總名額
        daySlots[slot] = {
          capacity: initialCapacity,  // ✅ 使用預設名額，使用者在上方欄位輸入
          methods: [...pendingNewMethods.value],
          methodLimits: {}  // 空對象，表示尚未設定各方式獨立名額
        };
      }
    });
    editedBatch.value.dailyRules[dateKey].slots = daySlots;
  });
  editedBatch.value.dailyRules = { ...editedBatch.value.dailyRules };
  pendingNewSlots.value = [];
  pendingNewCapacity.value = '';  // ✅ 清空預設名額欄位
}

// 刪除單一時段（從所有已選日期中移除）
function removeSlot(slot) {
  selectedDaysForEditing.value.forEach(day => {
    const dateKey = formatDate(day);
    const dayRule = editedBatch.value.dailyRules[dateKey];
    if (dayRule?.slots?.[slot] !== undefined) {
      const newSlots = { ...dayRule.slots };
      delete newSlots[slot];
      dayRule.slots = newSlots;
    }
  });
  editedBatch.value.dailyRules = { ...editedBatch.value.dailyRules };
}

function isMethodSelectedForSlot(slot, method) {
  if (selectedDaysForEditing.value.length === 0) return false;
  const firstDateKey = formatDate(selectedDaysForEditing.value[0]);
  return editedBatch.value.dailyRules[firstDateKey]?.slots?.[slot]?.methods.includes(method) || false;
}

function getSelectedMethodsForSlot(slot) {
  if (selectedDaysForEditing.value.length === 0) return [];
  const firstDateKey = formatDate(selectedDaysForEditing.value[0]);
  return editedBatch.value.dailyRules[firstDateKey]?.slots?.[slot]?.methods || [];
}

function updateMethodsForSlot(slot, method, isSelected) {
  selectedDaysForEditing.value.forEach(day => {
    const dateKey = formatDate(day);
    const daySlot = editedBatch.value.dailyRules[dateKey]?.slots?.[slot];
    if (!daySlot || !daySlot.methods) return;

    const methods = daySlot.methods;
    const index = methods.indexOf(method);

    if (isSelected && index === -1) methods.push(method);
    else if (!isSelected && index > -1) methods.splice(index, 1);

    // 修改方式列表後自動重算該時段的總名額
    recalcCapacityForSlot(dateKey, slot);
  });
  editedBatch.value.dailyRules = { ...editedBatch.value.dailyRules };
}

const isDayConfigured = (day) => {
  const slots = editedBatch.value.dailyRules[formatDate(day)]?.slots;
  return slots && Object.keys(slots).length > 0;
}

function handleSelectAll(isChecked, slot) {
  selectedDaysForEditing.value.forEach(day => {
    const dateKey = formatDate(day);
    const daySlot = editedBatch.value.dailyRules[dateKey]?.slots?.[slot];
    //  將 allMethodOptions 改為 availableBatchMethods
    if (daySlot) {
      daySlot.methods = isChecked ? [...availableBatchMethods.value] : [];
      // 修改方式列表後自動重算該時段的總名額
      recalcCapacityForSlot(dateKey, slot);
    }
  });
  editedBatch.value.dailyRules = { ...editedBatch.value.dailyRules };
}

function getSelectAllState(slot) {
  if (selectedDaysForEditing.value.length === 0) return { checked: false, indeterminate: false };
  const firstDateKey = formatDate(selectedDaysForEditing.value[0]);
  const methodsArray = editedBatch.value.dailyRules[firstDateKey]?.slots?.[slot]?.methods;
  if (!methodsArray) return { checked: false, indeterminate: false };

  const selectedCount = methodsArray.length;
  //  將 allMethodOptions 改為 availableBatchMethods
  const totalCount = availableBatchMethods.value.length;

  return {
    checked: selectedCount === totalCount && totalCount > 0,
    indeterminate: selectedCount > 0 && selectedCount < totalCount,
  };
}

// --- DateTime Picker Functions ---
function saveApplicationStart() {
  if (tempDateStart.value && tempTimeStart.value) {
    editedBatch.value.applicationStart = `${formatDate(tempDateStart.value)}T${tempTimeStart.value}`;
  }
  menuAppStart.value = false;
}

function saveApplicationEnd() {
  if (tempDateEnd.value && tempTimeEnd.value) {
    editedBatch.value.applicationEnd = `${formatDate(tempDateEnd.value)}T${tempTimeEnd.value}`;
  }
  menuAppEnd.value = false;
}

function getBatchStatus(item) {
  if (!item.applicationStart || !item.applicationEnd) return { text: '時間未設定', color: 'grey-darken-2' };

  const now = new Date();

  // 使用與上面相同的轉換邏輯提取日期
  const parseBatchDate = (val) => {
    if (!val) return null;
    if (typeof val === 'object') {
      if (typeof val._seconds === 'number') return new Date(val._seconds * 1000);
      if (typeof val.seconds === 'number') return new Date(val.seconds * 1000);
    }
    const d = new Date(val);
    return isNaN(d.getTime()) ? null : d;
  };

  const start = parseBatchDate(item.applicationStart);
  const end = parseBatchDate(item.applicationEnd);

  // 驗證日期有效性
  if (!start || !end) {
    return { text: '時間格式錯誤', color: 'orange' };
  }

  if (now < start) return { text: '尚未開放', color: 'blue-grey' };
  if (now > end) return { text: '已截止', color: 'red-darken-1' };
  return { text: '開放中', color: 'green' };
}

//  [新增] 從 sharedBy 陣列中提取預約項目的函式
function extractBookingType(sharedByArray) {
  if (!sharedByArray || sharedByArray.length === 0) {
    return '';
  }
  // 假設格式為 "預約項目(批次代號)"，例如 "初驗(1)"
  const firstItem = sharedByArray[0];
  // 找到第一個 '(' 符號並取其前面的部分
  const separatorIndex = firstItem.indexOf('(');
  if (separatorIndex !== -1) {
    return firstItem.substring(0, separatorIndex);
  }
  return firstItem; // 如果沒有 '('，則返回整個字串
}



import { nextTick } from 'vue';

function addFaqItem() {
  const intro = projectSettings.value.pageSettingsByItem[selectedBookingItemForSetting.value].intro;
  if (!intro.faq) {
    intro.faq = [];
  }
  intro.faq.push({ q: '', a: '' });

  nextTick(() => {
    const panels = document.querySelectorAll('.faq-panel');
    if (panels.length > 0) {
      const lastPanel = panels[panels.length - 1];
      lastPanel.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  });
}

function removeFaqItem(index) {
  projectSettings.value.pageSettingsByItem[selectedBookingItemForSetting.value].intro.faq.splice(index, 1);
}


async function saveSettings() {
  if (!projectId.value) {
    showSnackbar("請先選擇一個建案！", 'error');
    return;
  }
  isSavingSettings.value = true;
  try {
    const result = await updateProjectSettings(projectId.value, projectSettings.value);
    if (result.status === 'success') {
      showSnackbar("設定儲存成功！", 'success');

    } else {
      throw new Error(result.message);
    }
  } catch (error) {
    showSnackbar(`儲存失敗: ${error.message}`, 'error');
  } finally {
    isSavingSettings.value = false;
  }
}


async function saveSheetSettings() {
  if (!projectId.value) return;

  isSavingSheetSettings.value = true;
  try {
    await updateProjectSheetSettings(
      projectId.value,
      projectSettings.value.googleSheetId,
      projectSettings.value.googleSheetTabName
    );
    showSnackbar("Google Sheet 設定已儲存", 'success');
  } catch (error) {
    showSnackbar(`儲存失敗: ${error.message}`, 'error');
  } finally {
    isSavingSheetSettings.value = false;
  }
}
// 👆👆👆 [新增結束] 👆👆👆

// 執行同步函式
async function handleExecuteSync() {
  if (!projectSettings.value.googleSheetId || !projectSettings.value.googleSheetTabName) {
    showSnackbar("請先完成上方設定並儲存", 'error');
    return;
  }
  if (!isSyncRangeValid.value) return;

  isSyncing.value = true;
  try {
    await syncToGoogleSheet(
      projectId.value,
      syncDateRange.value[0],
      syncDateRange.value[1]
    );
    showSnackbar("同步成功！", 'success');
  } catch (e) {
    showSnackbar(`同步失敗: ${e.message}`, 'error');
  } finally {
    isSyncing.value = false;
  }
}



// applyTemplate 函式，讓它打開預覽視窗
function applyTemplate(fieldName) {
  const sourceIntro = defaultSettings.value.intro;
  const sourceReportSettings = defaultSettings.value.reportSettings;
  currentTargetField.value = fieldName; // 記住要修改哪個欄位

  switch (fieldName) {
    case 'greeting':
      templatePreviewTitle.value = '招呼語';
      templatePreviewContent.value = sourceIntro.greeting;
      break;
    case 'body':
      templatePreviewTitle.value = '內文說明';
      templatePreviewContent.value = sourceIntro.body;
      break;
    case 'footer':
      templatePreviewTitle.value = '頁尾文字';
      templatePreviewContent.value = sourceIntro.footer;
      break;
    case 'closingText':
      templatePreviewTitle.value = '結束語';
      templatePreviewContent.value = sourceIntro.closingText;
      break;
    case 'alertText':
      templatePreviewTitle.value = '提示框內容';
      templatePreviewContent.value = sourceIntro.alert.text;
      break;
    case 'uploadReminderEmailSubject':
      templatePreviewTitle.value = '未上傳報告-主旨';
      templatePreviewContent.value = sourceReportSettings.uploadReminderEmail.subject;
      break;
    case 'uploadReminderEmailBody':
      templatePreviewTitle.value = '未上傳報告-內文';
      templatePreviewContent.value = sourceReportSettings.uploadReminderEmail.body;
      break;
    case 'uploadReminderEmailReminder':
      templatePreviewTitle.value = '未上傳報告-提醒';
      templatePreviewContent.value = sourceReportSettings.uploadReminderEmail.reminder;
      break;
    default:
      return; // 如果找不到對應的欄位，則不執行
  }
  isPreviewTemplateDialogVisible.value = true;
}

// 使用者在 Dialog 按下確認後，才真正執行的函式
function handleConfirmApplyTemplate() {
  const targetIntro = projectSettings.value.pageSettingsByItem[selectedBookingItemForSetting.value].intro;
  const targetReportSettings = projectSettings.value.reportSettings;

  switch (currentTargetField.value) {
    case 'greeting':
      targetIntro.greeting = templatePreviewContent.value;
      break;
    case 'body':
      targetIntro.body = templatePreviewContent.value;
      break;
    case 'footer':
      targetIntro.footer = templatePreviewContent.value;
      break;
    case 'closingText':
      targetIntro.closingText = templatePreviewContent.value;
      break;
    case 'alertText':
      targetIntro.alert.text = templatePreviewContent.value;
      break;
    case 'uploadReminderEmailSubject':
      targetReportSettings.uploadReminderEmail.subject = templatePreviewContent.value;
      break;
    case 'uploadReminderEmailBody':
      targetReportSettings.uploadReminderEmail.body = templatePreviewContent.value;
      break;
    case 'uploadReminderEmailReminder':
      targetReportSettings.uploadReminderEmail.reminder = templatePreviewContent.value;
      break;
  }

  // 關閉 Dialog 並清除暫存資料
  isPreviewTemplateDialogVisible.value = false;
  templatePreviewContent.value = '';
  currentTargetField.value = null;
}


//  新增處理圖片上傳的函式
function handleLogoUpload(event) {
  const file = event.target.files[0];
  if (!file) {
    return;
  }

  // 限制檔案類型為圖片
  if (!file.type.startsWith('image/')) {
    showSnackbar('請選擇圖片檔案 (jpg, png, gif, svg)', 'error');
    return;
  }

  // 限制檔案大小 (例如 1MB)
  if (file.size > 1 * 1024 * 1024) {
    showSnackbar('圖片檔案大小請勿超過 1MB', 'error');
    return;
  }

  const reader = new FileReader();
  reader.onload = (e) => {
    // 將讀取的 Base64 字串存入 projectSettings
    projectSettings.value.logoUrl = e.target.result;
  };
  reader.readAsDataURL(file);
}

// 手動通知 - 步驟 1：查詢並展示通知對象名單
async function handleManualLineNotification() {
  isLoadingRecipients.value = true;
  isRecipientDialogOpen.value = true;
  recipientList.value = [];
  selectedRecipients.value = [];

  try {
    const result = await getNotificationRecipients({ projectId: projectId.value });
    recipientList.value = result.recipients || [];
    // 預設勾選：已綁定 LINE 的人員
    selectedRecipients.value = recipientList.value
      .filter(r => r.hasLineBinding)
      .map(r => r.phone);
  } catch (error) {
    showSnackbar(`查詢通知對象失敗：${error.message}`, 'error');
    isRecipientDialogOpen.value = false;
  } finally {
    isLoadingRecipients.value = false;
  }
}

// 計算勾選人員中有效的 LINE IDs
const selectedLineIds = computed(() => {
  return recipientList.value
    .filter(r => selectedRecipients.value.includes(r.phone) && r.hasLineBinding)
    .map(r => r.lineId);
});

// 通知名單中有 LINE 綁定的數量
const validRecipientCount = computed(() => {
  return recipientList.value.filter(r => r.hasLineBinding).length;
});

// 全選/取消全選（僅限有 LINE 綁定的）
const isAllValidSelected = computed(() => {
  const validPhones = recipientList.value.filter(r => r.hasLineBinding).map(r => r.phone);
  return validPhones.length > 0 && validPhones.every(p => selectedRecipients.value.includes(p));
});

function toggleSelectAll() {
  const validPhones = recipientList.value.filter(r => r.hasLineBinding).map(r => r.phone);
  if (isAllValidSelected.value) {
    // 取消全選
    selectedRecipients.value = selectedRecipients.value.filter(p => !validPhones.includes(p));
  } else {
    // 全選
    const currentSet = new Set(selectedRecipients.value);
    validPhones.forEach(p => currentSet.add(p));
    selectedRecipients.value = Array.from(currentSet);
  }
}

// 手動通知 - 步驟 2：確認並發送通知
async function confirmSendLineNotification() {
  const ids = selectedLineIds.value;
  if (ids.length === 0) {
    showSnackbar('請至少勾選一位有 LINE 綁定的通知對象。', 'warning');
    return;
  }

  if (!confirm(`確定要向 ${ids.length} 位人員發送 LINE 通知嗎？`)) {
    return;
  }

  isSendingLineNotification.value = true;
  try {
    const result = await triggerNotDownloadedReportReminder({
      projectId: projectId.value,
      selectedLineIds: ids,
    });
    showSnackbar(result.message, 'success');
    isRecipientDialogOpen.value = false;
  } catch (error) {
    showSnackbar(`發送失敗：${error.message}`, 'error');
  } finally {
    isSendingLineNotification.value = false;
  }
}

// [新增] 儲存時間的輔助函數 (與 Batch 的邏輯類似)
function savePublishStartTime() {
  if (tempPubStartDate.value && tempPubStartTime.value) {
    // 組合日期與時間
    const d = new Date(tempPubStartDate.value);
    const [hours, minutes] = tempPubStartTime.value.split(':');
    d.setHours(parseInt(hours), parseInt(minutes), 0, 0);
    projectSettings.value.publishStartTime = d;
  }
  menuPublishStart.value = false;
}

function savePublishEndTime() {
  if (tempPubEndDate.value && tempPubEndTime.value) {
    const d = new Date(tempPubEndDate.value);
    const [hours, minutes] = tempPubEndTime.value.split(':');
    d.setHours(parseInt(hours), parseInt(minutes), 0, 0);
    projectSettings.value.publishEndTime = d;
  }
  menuPublishEnd.value = false;
}


// [新增] Watcher: 當打開選單時，初始化暫存變數
watch(menuPublishStart, (val) => {
  if (val) {
    activePickerTabPubStart.value = 0;
    if (projectSettings.value.publishStartTime) {
      const d = new Date(projectSettings.value.publishStartTime);
      if (!isNaN(d.getTime())) {
        tempPubStartDate.value = d;
        tempPubStartTime.value = d.toLocaleTimeString('sv-SE', { hour: '2-digit', minute: '2-digit' });
      }
    }
  }
});
watch(menuPublishEnd, (val) => {
  if (val) {
    activePickerTabPubEnd.value = 0;
    if (projectSettings.value.publishEndTime) {
      const d = new Date(projectSettings.value.publishEndTime);
      if (!isNaN(d.getTime())) {
        tempPubEndDate.value = d;
        tempPubEndTime.value = d.toLocaleTimeString('sv-SE', { hour: '2-digit', minute: '2-digit' });
      }
    }
  }
});

// --- Lifecycle & Watchers ---
onMounted(loadDataForProject);

watch(() => [editedBatch.value.bookingStart, editedBatch.value.bookingEnd], () => {
  // 只在用戶手動更動日期時才清空，載入資料期間跳過
  if (!isLoadingBatchData.value) {
    selectedDaysForEditing.value = [];
  }
});

watch(() => editedBatch.value.bookingType, () => {
  if (batchForm.value) batchForm.value.validate();
});

watch(customBookingType, () => {
  if (batchForm.value) batchForm.value.validate();
});

watch(menuAppStart, (isOpen) => {
  if (isOpen) {
    activePickerTabStart.value = 0;
    const startValue = editedBatch.value.applicationStart;
    if (startValue) {
      // 無論 startValue 是 Date 物件還是字串，都建立一個新的 Date 物件
      const startDate = new Date(startValue);
      // 驗證日期是否有效
      if (!isNaN(startDate.getTime())) {
        tempDateStart.value = startDate;
        // 從 Date 物件中提取 'HH:mm' 格式的時間
        tempTimeStart.value = startDate.toLocaleTimeString('sv-SE', { hour: '2-digit', minute: '2-digit' });
      }
    } else {
      // 如果沒有值，設定為預設值
      tempDateStart.value = new Date();
      tempTimeStart.value = '00:00';
    }
  }
});

watch(menuAppEnd, (isOpen) => {
  if (isOpen) {
    activePickerTabEnd.value = 0;
    const endValue = editedBatch.value.applicationEnd;
    if (endValue) {
      const endDate = new Date(endValue);
      if (!isNaN(endDate.getTime())) {
        tempDateEnd.value = endDate;
        tempTimeEnd.value = endDate.toLocaleTimeString('sv-SE', { hour: '2-digit', minute: '2-digit' });
      }
    } else {
      tempDateEnd.value = new Date();
      tempTimeEnd.value = '00:00';
    }
  }
});

</script>

<style scoped>
.primary-bg {
  background-color: #1a73e8;
  color: white;
}

.weekend-highlight {
  color: red;
  font-weight: bold;
}

.settings-tab-content {
  display: flex;
  flex-direction: column;
  /* 計算高度：100vh - (頂部導覽列高度 + 卡片標題高度 + Tabs 高度) */
  /* 您可以根據實際情況微調 180px 這個值 */
  height: calc(100vh - 180px);
}

.settings-form-container {
  flex-grow: 1;
  overflow-y: auto;
  /* 讓表單內容可以滾動 */
}

.sticky-actions {
  position: sticky;
  bottom: 0;
  z-index: 1;
  background-color: white;
  /* 設定背景色以遮擋下方滾動的內容 */
  border-top: 1px solid #e0e0e0;
  /* 加上分隔線，視覺效果更好 */
  box-shadow: 0 -2px 5px rgba(0, 0, 0, 0.05);
  /* 加上陰影 */
}

/* 可以為新的驗屋設定頁籤增加特定樣式 */
.v-window-item[value="inspProjectSettings"] .v-container,
.v-window-item[value="inspCategoriesItems"] .v-container {
  padding-top: 16px;
}

/* 管理員專屬欄位區塊樣式 */
.admin-only-section {
  border-left: 4px solid #f9a825 !important;
  /* amber-darken-2 色條 */
  background-color: #fffde7 !important;
  /* 淡黃底色 */
}

/*
 * 修正 RichTextEditor Sticky Toolbar：
 * Vuetify 的 v-window-item 預設有 overflow: hidden，
 * 會截斷 position: sticky 的定位行為鏈。
 * 必須將捲動容器 (.settings-form-container) 到 sticky 元素之間
 * 所有中間層的 overflow 設為 visible。
 * 使用 :deep() 穿透 scoped 限制，作用於 Vuetify 子元件內部 DOM。
 */
.settings-form-container :deep(.v-window) {
  overflow: visible !important;
}

.settings-form-container :deep(.v-window__container) {
  overflow: visible !important;
}

.settings-form-container :deep(.v-window-item) {
  overflow: visible !important;
}
</style>
