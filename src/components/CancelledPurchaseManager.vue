<template>
  <v-dialog
    :model-value="show"
    @update:model-value="$emit('update:show', $event)"
    fullscreen
    hide-overlay
    transition="dialog-bottom-transition"
  >
    <v-card class="d-flex flex-column">
      <v-toolbar dark color="#f5f5f7" density="compact">
        <v-btn icon dark @click="$emit('update:show', false)">
          <v-icon>mdi-close</v-icon>
        </v-btn>
        <v-toolbar-title>退戶記錄管理</v-toolbar-title>
        <v-spacer></v-spacer>
        <v-btn
          variant="tonal"
          prepend-icon="mdi-chart-bar"
          @click="statisticsDialog = true"
          :disabled="items.length === 0"
          class="mr-2"
        >
          統計分析
        </v-btn>
        <v-btn
          variant="tonal"
          prepend-icon="mdi-refresh"
          @click="loadData"
          :loading="isLoading"
        >
          重新整理
        </v-btn>
      </v-toolbar>

      <v-card-text class="flex-grow-1 pa-4" style="overflow-y: auto;">
        <!-- 載入中 -->
        <div v-if="isLoading && items.length === 0" class="d-flex justify-center align-center" style="height: 300px;">
          <div class="text-center">
            <v-progress-circular indeterminate color="primary" size="48" class="mb-4"></v-progress-circular>
            <p class="text-body-1 text-grey">正在載入退戶資料...</p>
          </div>
        </div>

        <!-- 空狀態 -->
        <div v-else-if="!isLoading && items.length === 0" class="d-flex flex-column justify-center align-center" style="height: 300px;">
          <v-icon size="80" color="grey-lighten-1">mdi-file-document-remove-outline</v-icon>
          <p class="mt-4 text-h6 text-grey">沒有退戶記錄</p>
          <p class="text-body-2 text-grey">本專案目前尚無退戶資料。</p>
        </div>

        <!-- 列表 -->
        <template v-else>
          <!-- 搜索欄 -->
          <v-row class="mb-4">
            <v-col cols="12" md="6">
              <v-text-field
                v-model="searchQuery"
                prepend-inner-icon="mdi-magnify"
                placeholder="搜尋關鍵字（戶別、買方、業務員、原因等）"
                variant="outlined"
                density="compact"
                clearable
              ></v-text-field>
            </v-col>
            <v-col cols="12" md="3">
              <v-switch
                v-model="showDeleted"
                label="顯示已刪除記錄"
                density="compact"
                color="error"
                hide-details
                class="pt-2"
              />
            </v-col>
            <v-col cols="12" md="3">
              <v-alert type="info" variant="tonal" density="compact" class="h-100 d-flex align-center">
                共 {{ filteredItems.length }} / {{ items.length }} 筆
              </v-alert>
            </v-col>
          </v-row>

          <v-data-table
            :headers="tableHeaders"
            :items="filteredItems"
            v-model:expanded="expanded"
            item-value="docId"
            density="compact"
            class="mt-2"
            :loading="isLoading"
            @click:row="onRowClick"
            hover
          >
            <!-- 戶別 + 車位 chips -->
            <template v-slot:item.unitId="{ item }">
              <div class="d-flex align-center gap-1" :class="{ 'text-grey': item.isDeleted, 'deleted-text': item.isDeleted }">
                <span class="font-weight-bold">{{ item.unitId }}</span>
                <v-chip v-if="item.parkingCount > 0" size="x-small" color="info" variant="tonal">
                  車位 {{ item.parkingCount }}
                </v-chip>
                <v-chip v-if="item.isDeleted" size="x-small" color="error" variant="tonal">
                  已刪除
                </v-chip>
              </div>
            </template>

            <!-- 退戶原因 chips -->
            <template v-slot:item.cancelReasons="{ item }">
              <template v-if="item.cancelReasons && item.cancelReasons.length > 0">
                <v-chip
                  v-for="(reason, idx) in item.cancelReasons.slice(0, 2)"
                  :key="idx"
                  label
                  size="small"
                  color="error"
                  variant="tonal"
                  class="mr-1 my-1"
                >
                  {{ reason }}
                </v-chip>
                <v-chip
                  v-if="item.cancelReasons.length > 2"
                  label
                  size="x-small"
                  color="grey"
                  variant="tonal"
                >
                  +{{ item.cancelReasons.length - 2 }} 項
                </v-chip>
              </template>
            </template>

            <!-- 成交總價 -->
            <template v-slot:item.totalPrice="{ item }">
              <span v-if="calculateTotalTransactionPrice(item) > 0" class="font-weight-bold text-success">
                {{ formatPrice(calculateTotalTransactionPrice(item)) }} 萬
              </span>
              <span v-else>—</span>
            </template>

            <!-- 小訂日期 -->
            <template v-slot:item.payment_deposit_date="{ item }">
              <span class="text-caption">{{ formatDateOnly(item.payment_deposit_date) }}</span>
            </template>

            <!-- 補足日期 -->
            <template v-slot:item.payment_complete_date="{ item }">
              <span class="text-caption">{{ formatDateOnly(item.payment_complete_date) }}</span>
            </template>

            <!-- 簽約日期 -->
            <template v-slot:item.payment_contract_date="{ item }">
              <span class="text-caption">{{ formatDateOnly(item.payment_contract_date) }}</span>
            </template>

            <!-- 退戶日期 -->
            <template v-slot:item.cancellationDate="{ item }">
              {{ formatDate(item.cancellationDate) }}
            </template>

            <!-- 備註 -->
            <template v-slot:item.remarks="{ item }">
              <span v-if="item.remarks" class="text-body-2">{{ item.remarks }}</span>
              <span v-else class="text-grey text-caption">—</span>
            </template>

            <!-- 展開列（保留現有詳情內容） -->
            <template v-slot:expanded-row="{ columns, item }">
              <tr>
                <td :colspan="columns.length" class="pa-0">
                  <v-card flat class="pa-4 bg-grey-lighten-5">
                    <v-row dense>
                      <!-- 買方資訊 -->
                      <v-col cols="12" md="4">
                        <div class="section-title">
                          <v-icon size="small" class="mr-1" color="primary">mdi-account</v-icon>
                          買方資訊
                        </div>
                        <v-table density="compact" class="detail-table">
                          <tbody>
                            <tr><td class="label-cell">姓名</td><td class="font-weight-bold">{{ item.buyerName || '—' }}</td></tr>
                            <tr><td class="label-cell">電話</td><td>{{ item.buyerPhone || '—' }}</td></tr>
                            <tr><td class="label-cell">身分證</td><td>{{ item.buyerIdNumber || '—' }}</td></tr>
                            <tr><td class="label-cell">Email</td><td>{{ item.buyerEmail || '—' }}</td></tr>
                            <tr><td class="label-cell">業務</td><td>{{ item.salesperson || '—' }}</td></tr>
                            <tr><td class="label-cell">合約類型</td><td>{{ item.contractType || '—' }}</td></tr>
                          </tbody>
                        </v-table>
                      </v-col>

                      <!-- 面積資訊 -->
                      <v-col cols="12" md="4">
                        <div class="section-title">
                          <v-icon size="small" class="mr-1" color="teal">mdi-ruler-square</v-icon>
                          面積資訊
                        </div>
                        <v-table density="compact" class="detail-table">
                          <tbody>
                            <tr><td class="label-cell">權狀坪數</td><td class="font-weight-bold">{{ formatNum(item.area_house_ping) }} 坪</td></tr>
                            <tr><td class="label-cell">主建物</td><td>{{ formatNum(item.area_main_ping) }} 坪</td></tr>
                            <tr><td class="label-cell">附屬建物</td><td>{{ formatNum(item.area_ancillary_ping) }} 坪</td></tr>
                            <tr><td class="label-cell">公設</td><td>{{ formatNum(item.area_public_ping) }} 坪</td></tr>
                            <tr><td class="label-cell">露臺</td><td>{{ formatNum(item.area_terrace_ping) }} 坪</td></tr>
                          </tbody>
                        </v-table>
                      </v-col>

                      <!-- 價格資訊 -->
                      <v-col cols="12" md="4">
                        <div class="section-title">
                          <v-icon size="small" class="mr-1" color="warning">mdi-currency-usd</v-icon>
                          價格資訊
                        </div>
                        <v-table density="compact" class="detail-table">
                          <tbody>
                            <tr><td class="label-cell">房屋表價</td><td>{{ formatPrice(item.price_list_house_total) }} 萬</td></tr>
                            <tr><td class="label-cell">房屋底價</td><td class="text-red font-weight-bold">{{ formatPrice(item.price_floor_house_total) }} 萬</td></tr>
                            <tr><td class="label-cell">房屋成交價</td><td class="text-success font-weight-bold">{{ formatPrice(item.price_transaction_house) }} 萬</td></tr>
                            <tr><td class="label-cell">配套金額</td><td>{{ formatPrice(item.price_package_deal) }} 萬</td></tr>
                            <tr><td class="label-cell">成交總價</td><td class="text-success font-weight-bold text-h6">{{ formatPrice(calculateTotalTransactionPrice(item)) }} 萬</td></tr>
                            <tr><td class="label-cell">溢差價</td><td class="font-weight-bold" :class="calculatePremiumPrice(item) >= 0 ? 'text-success' : 'text-red'">{{ formatPrice(calculatePremiumPrice(item)) }} 萬</td></tr>
                            <tr v-if="item.payment_deposit_amount"><td class="label-cell">小訂金額</td><td>{{ formatPrice(item.payment_deposit_amount) }} 萬</td></tr>
                            <tr v-if="item.payment_contract_amount"><td class="label-cell">簽約金額</td><td>{{ formatPrice(item.payment_contract_amount) }} 萬</td></tr>
                          </tbody>
                        </v-table>
                      </v-col>
                    </v-row>

                    <!-- 車位資訊 -->
                    <template v-if="item.parkingDetails && item.parkingDetails.length > 0">
                      <v-divider class="my-3"></v-divider>
                      <div class="section-title">
                        <v-icon size="small" class="mr-1" color="indigo">mdi-car</v-icon>
                        車位資訊（{{ item.parkingDetails.length }} 個）
                      </div>
                      <v-table density="compact" class="detail-table">
                        <thead>
                          <tr>
                            <th>車位編號</th>
                            <th>樓層</th>
                            <th>類型</th>
                            <th>表價</th>
                            <th>底價</th>
                            <th>成交價</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr v-for="(p, idx) in item.parkingDetails" :key="idx">
                            <td class="font-weight-bold">{{ p.spotId || '—' }}</td>
                            <td>{{ p.floor || '—' }}</td>
                            <td>{{ p.type || '—' }}</td>
                            <td>{{ formatPrice(p.price_list) }} 萬</td>
                            <td class="text-red">{{ formatPrice(p.price_floor) }} 萬</td>
                            <td class="text-success font-weight-bold">{{ formatPrice(p.price_transaction) }} 萬</td>
                          </tr>
                        </tbody>
                      </v-table>
                    </template>

                    <!-- 持有車位 -->
                    <template v-if="item['持有車位'] && item['持有車位'].length > 0">
                     
                    </template>

                    <!-- 退戶日期 -->
                    <v-divider class="my-3"></v-divider>
                    <div class="d-flex align-center justify-space-between mb-2">
                      <div class="section-title">
                        <v-icon size="small" class="mr-1" color="warning">mdi-calendar</v-icon>
                        退戶日期
                      </div>
                      <v-btn icon size="x-small" variant="text" @click="handleEditCancellationDate(item)">
                        <v-icon size="small">mdi-pencil</v-icon>
                        <v-tooltip activator="parent">修改退戶日期</v-tooltip>
                      </v-btn>
                    </div>
                    <div class="mb-4">
                      <v-chip
                        label
                        color="info"
                        variant="tonal"
                        size="small"
                        prepend-icon="mdi-calendar-outline"
                      >
                        {{ formatDate(item.cancellationDate) }}
                      </v-chip>
                    </div>

                    <!-- 退戶原因 -->
                    <v-divider class="my-3"></v-divider>
                    <div class="d-flex align-center justify-space-between mb-2">
                      <div class="section-title">
                        <v-icon size="small" class="mr-1" color="warning">mdi-information-outline</v-icon>
                        退戶原因
                      </div>
                      <v-btn icon size="x-small" variant="text" @click="handleEditReasons(item)">
                        <v-icon size="small">mdi-pencil</v-icon>
                        <v-tooltip activator="parent">修改退戶原因</v-tooltip>
                      </v-btn>
                    </div>
                    <template v-if="item.cancelReasons && item.cancelReasons.length > 0">
                      <div class="cancel-reasons-container">
                        <v-chip
                          v-for="(reason, idx) in item.cancelReasons"
                          :key="idx"
                          label
                          size="medium"
                          color="error"
                          variant="tonal"
                          class="mr-2 mb-2"
                        >
                          {{ reason }}
                        </v-chip>
                      </div>
                    </template>
                    <template v-else>
                      <div class="text-caption text-grey">
                        <v-icon size="x-small" class="mr-1">mdi-information-outline</v-icon>
                        本筆退戶記錄建立於新功能上線前，未記錄退戶原因
                      </div>
                    </template>

                    <!-- 備註 -->
                    <v-divider class="my-3"></v-divider>
                    <div class="d-flex align-center justify-space-between mb-2">
                      <div class="section-title">
                        <v-icon size="small" class="mr-1" color="info">mdi-note-text</v-icon>
                        備註
                      </div>
                      <v-btn icon size="x-small" variant="text" @click="handleEditRemarks(item)">
                        <v-icon size="small">mdi-pencil</v-icon>
                        <v-tooltip activator="parent">修改備註</v-tooltip>
                      </v-btn>
                    </div>
                    <div v-if="item.remarks" class="pa-2 bg-blue-lighten-5 rounded text-body-2">
                      {{ item.remarks }}
                    </div>
                    <div v-else class="text-caption text-grey">
                      <v-icon size="x-small" class="mr-1">mdi-information-outline</v-icon>
                      未填寫備註
                    </div>

                    <!-- 文件 ID 顯示 -->
                    <v-divider class="my-3"></v-divider>
                    <div class="d-flex align-center gap-2 mb-3">
                      <span class="text-caption text-grey">文件 ID：</span>
                      <code class="text-caption" style="background-color: #f5f5f5; padding: 2px 6px; border-radius: 4px;">{{ item.docId }}</code>
                      <v-btn icon size="x-small" variant="text" @click="copyDocId(item.docId)" color="primary">
                        <v-icon size="small">mdi-content-copy</v-icon>
                        <v-tooltip activator="parent">複製 ID</v-tooltip>
                      </v-btn>
                    </div>

                    <!-- 退戶資訊 & 復原 & 冷刪除 -->
                    <v-divider class="my-3"></v-divider>
                    <div class="d-flex align-center justify-space-between flex-wrap gap-2">

                      <v-btn
                        color="success"
                        variant="flat"
                        prepend-icon="mdi-restore"
                        :loading="restoringDocId === item.docId"
                        @click="handleRestore(item)"
                      >
                        復原此筆退戶
                      </v-btn>

                      <!-- 冷刪除按鈕（未刪除狀態） -->
                      <v-btn
                        v-if="!item.isDeleted"
                        color="error"
                        variant="outlined"
                        prepend-icon="mdi-delete-outline"
                        @click="handleSoftDelete(item)"
                      >
                        冷刪除
                      </v-btn>

                      <!-- 復原冷刪除 + 永久刪除（已刪除狀態） -->
                      <template v-else>
                        <v-chip color="error" size="small" class="ml-auto">已標記刪除</v-chip>
                        <v-btn
                          color="success"
                          variant="outlined"
                          prepend-icon="mdi-undo"
                          @click="handleUndoSoftDelete(item)"
                        >
                          復原冷刪除
                        </v-btn>
                        <v-btn
                          color="error"
                          variant="flat"
                          prepend-icon="mdi-delete-forever"
                          @click="handleHardDelete(item)"
                        >
                          永久刪除
                        </v-btn>
                      </template>
                    </div>
                  </v-card>
                </td>
              </tr>
            </template>
          </v-data-table>
        </template>
      </v-card-text>
    </v-card>

    <!-- 復原確認 Dialog -->
    <v-dialog v-model="confirmDialog.show" max-width="500" persistent>
      <v-card>
        <v-card-title class="bg-success text-white d-flex align-center">
          <v-icon left color="white" class="mr-2">mdi-restore</v-icon>
          確認復原退戶
        </v-card-title>
        <v-card-text class="py-4">
          <p class="text-body-1" v-html="confirmDialog.message"></p>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn variant="text" @click="confirmDialog.show = false">取消</v-btn>
          <v-btn
            color="success"
            variant="flat"
            @click="executeRestore"
            :loading="confirmDialog.loading"
          >
            確認復原
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- 衝突提示 Dialog -->
    <v-dialog v-model="conflictDialog.show" max-width="500">
      <v-card>
        <v-card-title class="bg-warning text-white d-flex align-center">
          <v-icon left color="white" class="mr-2">mdi-alert</v-icon>
          無法復原
        </v-card-title>
        <v-card-text class="py-4">
          <p class="text-body-1">{{ conflictDialog.message }}</p>
          <v-alert type="warning" variant="tonal" class="mt-3" density="compact">
            目前買方：<strong>{{ conflictDialog.currentBuyerName || '—' }}</strong><br>
            目前狀態：<strong>{{ conflictDialog.currentStatus || '—' }}</strong>
          </v-alert>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn variant="flat" color="primary" @click="conflictDialog.show = false">瞭解</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- 修改退戶原因 Dialog -->
    <v-dialog v-model="editReasonsDialog.show" max-width="560" persistent>
      <v-card>
        <v-card-title class="d-flex align-center">
          <v-icon left class="mr-2">mdi-pencil</v-icon>
          修改退戶原因
        </v-card-title>
        <v-card-text class="py-4">
          <p class="text-body-2 text-grey mb-3">
            戶別：<strong>【{{ editReasonsDialog.targetItem?.unitId }}】</strong>
            買方：<strong>{{ editReasonsDialog.targetItem?.buyerName || '—' }}</strong>
          </p>
          <p class="text-body-2 font-weight-bold mb-3">選擇退戶原因（可複選）</p>
          <v-container class="pa-0">
            <v-row>
              <v-col
                v-for="reason in CANCEL_REASONS"
                :key="reason"
                cols="12"
                sm="6"
                class="pb-2"
              >
                <v-checkbox
                  :model-value="editReasonsDialog.selectedReasons"
                  :label="reason"
                  :value="reason"
                  @update:model-value="editReasonsDialog.selectedReasons = $event"
                  density="compact"
                  hide-details
                ></v-checkbox>
              </v-col>
            </v-row>
          </v-container>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn variant="text" @click="editReasonsDialog.show = false">取消</v-btn>
          <v-btn
            color="primary"
            variant="flat"
            :loading="editReasonsDialog.loading"
            @click="executeUpdateReasons"
          >
            確認修改
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- 修改退戶日期 Dialog -->
    <v-dialog v-model="editDateDialog.show" max-width="480" persistent>
      <v-card>
        <v-card-title class="d-flex align-center">
          <v-icon left class="mr-2">mdi-calendar</v-icon>
          修改退戶日期
        </v-card-title>
        <v-card-text class="py-4">
          <p class="text-body-2 text-grey mb-4">
            戶別：<strong>【{{ editDateDialog.targetItem?.unitId }}】</strong>
            買方：<strong>{{ editDateDialog.targetItem?.buyerName || '—' }}</strong>
          </p>
          <v-text-field
            v-model="editDateDialog.selectedDate"
            type="date"
            label="選擇退戶日期"
            variant="outlined"
            density="compact"
          ></v-text-field>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn variant="text" @click="editDateDialog.show = false">取消</v-btn>
          <v-btn
            color="primary"
            variant="flat"
            :loading="editDateDialog.loading"
            @click="executeUpdateDate"
          >
            確認修改
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- 修改退戶備註 Dialog -->
    <v-dialog v-model="editRemarksDialog.show" max-width="560" persistent>
      <v-card>
        <v-card-title class="d-flex align-center">
          <v-icon left class="mr-2">mdi-note-text</v-icon>
          修改備註
        </v-card-title>
        <v-card-text class="py-4">
          <p class="text-body-2 text-grey mb-4">
            戶別：<strong>【{{ editRemarksDialog.targetItem?.unitId }}】</strong>
            買方：<strong>{{ editRemarksDialog.targetItem?.buyerName || '—' }}</strong>
          </p>
          <v-textarea
            v-model="editRemarksDialog.inputRemarks"
            label="備註內容"
            placeholder="請輸入備註..."
            variant="outlined"
            density="compact"
            rows="4"
            no-resize
            counter
            maxlength="500"
            hide-details="auto"
          ></v-textarea>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn variant="text" @click="editRemarksDialog.show = false">取消</v-btn>
          <v-btn
            color="primary"
            variant="flat"
            :loading="editRemarksDialog.loading"
            @click="executeUpdateRemarks"
          >
            確認修改
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- 冷刪除確認 Dialog -->
    <v-dialog v-model="softDeleteDialog.show" max-width="500" persistent>
      <v-card>
        <v-card-title class="bg-error text-white d-flex align-center">
          <v-icon left color="white" class="mr-2">mdi-delete-outline</v-icon>
          冷刪除退戶記錄
        </v-card-title>
        <v-card-text class="py-4">
          <p class="text-body-2 text-grey mb-3">
            戶別：<strong>【{{ softDeleteDialog.targetItem?.unitId }}】</strong>
            買方：<strong>{{ softDeleteDialog.targetItem?.buyerName || '—' }}</strong>
          </p>
          <v-alert type="warning" variant="tonal" density="compact" class="mb-4">
            <v-icon size="small" class="mr-1">mdi-information-outline</v-icon>
            此操作會將記錄標記為已刪除，但不會從資料庫移除。可隨時復原。
          </v-alert>
          <p class="text-caption text-grey mb-2">文件 ID：</p>
          <code class="d-block mb-4" style="background-color: #f5f5f5; padding: 8px; border-radius: 4px;">{{ softDeleteDialog.targetItem?.docId }}</code>
          <v-text-field
            v-model="softDeleteDialog.inputDocId"
            label="請輸入文件 ID 以確認刪除"
            variant="outlined"
            density="compact"
            hint="輸入正確的文件 ID 才能執行刪除"
          />
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn variant="text" @click="softDeleteDialog.show = false">取消</v-btn>
          <v-btn
            color="error"
            variant="flat"
            @click="executeSoftDelete"
            :loading="softDeleteDialog.loading"
            :disabled="softDeleteDialog.inputDocId !== softDeleteDialog.targetItem?.docId"
          >
            確認冷刪除
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- 復原冷刪除確認 Dialog -->
    <v-dialog v-model="undoSoftDeleteDialog.show" max-width="500" persistent>
      <v-card>
        <v-card-title class="bg-success text-white d-flex align-center">
          <v-icon left color="white" class="mr-2">mdi-undo</v-icon>
          復原冷刪除記錄
        </v-card-title>
        <v-card-text class="py-4">
          <p class="text-body-2 text-grey mb-3">
            戶別：<strong>【{{ undoSoftDeleteDialog.targetItem?.unitId }}】</strong>
            買方：<strong>{{ undoSoftDeleteDialog.targetItem?.buyerName || '—' }}</strong>
          </p>
          <v-alert type="info" variant="tonal" density="compact" class="mb-4">
            <v-icon size="small" class="mr-1">mdi-information-outline</v-icon>
            確認復原此筆記錄的刪除標記。復原後將在正常列表中顯示。
          </v-alert>
          <p class="text-caption text-grey mb-2">文件 ID：</p>
          <code class="d-block mb-4" style="background-color: #f5f5f5; padding: 8px; border-radius: 4px;">{{ undoSoftDeleteDialog.targetItem?.docId }}</code>
          <v-text-field
            v-model="undoSoftDeleteDialog.inputDocId"
            label="請輸入文件 ID 以確認復原"
            variant="outlined"
            density="compact"
            hint="輸入正確的文件 ID 才能執行復原"
          />
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn variant="text" @click="undoSoftDeleteDialog.show = false">取消</v-btn>
          <v-btn
            color="success"
            variant="flat"
            @click="executeUndoSoftDelete"
            :loading="undoSoftDeleteDialog.loading"
            :disabled="undoSoftDeleteDialog.inputDocId !== undoSoftDeleteDialog.targetItem?.docId"
          >
            確認復原
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- 永久刪除確認 Dialog -->
    <v-dialog v-model="hardDeleteDialog.show" max-width="500" persistent>
      <v-card>
        <v-card-title class="bg-error text-white d-flex align-center">
          <v-icon left color="white" class="mr-2">mdi-delete-forever</v-icon>
          永久刪除退戶記錄
        </v-card-title>
        <v-card-text class="py-4">
          <p class="text-body-2 text-grey mb-3">
            戶別：<strong>【{{ hardDeleteDialog.targetItem?.unitId }}】</strong>
            買方：<strong>{{ hardDeleteDialog.targetItem?.buyerName || '—' }}</strong>
          </p>
          <v-alert type="error" variant="tonal" density="compact" class="mb-4">
            <v-icon size="small" class="mr-1">mdi-alert-outline</v-icon>
            <strong>此操作無法還原！</strong>記錄將永久從資料庫刪除，無法復原。
          </v-alert>
          <p class="text-caption text-grey mb-2">文件 ID：</p>
          <code class="d-block mb-4" style="background-color: #f5f5f5; padding: 8px; border-radius: 4px;">{{ hardDeleteDialog.targetItem?.docId }}</code>
          <v-text-field
            v-model="hardDeleteDialog.inputDocId"
            label="請輸入文件 ID 以確認永久刪除"
            variant="outlined"
            density="compact"
            hint="輸入正確的文件 ID 才能執行永久刪除"
          />
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn variant="text" @click="hardDeleteDialog.show = false">取消</v-btn>
          <v-btn
            color="error"
            variant="flat"
            @click="executeHardDelete"
            :loading="hardDeleteDialog.loading"
            :disabled="hardDeleteDialog.inputDocId !== hardDeleteDialog.targetItem?.docId"
          >
            確認永久刪除
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- 退戶統計分析 Dialog -->
    <CancelledPurchaseStatistics
      :show="statisticsDialog"
      :items="items"
      @update:show="statisticsDialog = $event"
    />
  </v-dialog>
</template>

<script setup>
import { ref, watch, reactive, computed } from 'vue';
import { getCancelledPurchases, restoreCancelledPurchase, updateCancelReason, updateCancellationDate, updateRemarks, softDeleteCancelledPurchase, undoSoftDeleteCancelledPurchase, hardDeleteCancelledPurchase } from '@/api';
import { useUserStore } from '@/store/user';
import { useToast, POSITION } from 'vue-toastification';
import CancelledPurchaseStatistics from './CancelledPurchaseStatistics.vue';

const props = defineProps({
  show: { type: Boolean, required: true },
  projectId: { type: String, required: true },
});

const emit = defineEmits(['update:show', 'data-updated']);

const userStore = useUserStore();
const toast = useToast();

// 退戶原因選項列表
const CANCEL_REASONS = [
  '總價太高',
  '單價太高',
  '自備款不足',
  '貸款成數太少',
  '地點不符',
  '家人反對',
  '家人意外、重病',
  '資金斷鏈',
  '神明指示',
  '風水忌諱',
  '生活機能不足',
  '環境不喜歡',
  '換戶',
  '景氣不好',
  '工期太久',
  '財務規劃暫不買房'
];

const isLoading = ref(false);
const items = ref([]);
const expanded = ref([]);
const restoringDocId = ref(null);
const statisticsDialog = ref(false);
const searchQuery = ref('');
const showDeleted = ref(false);

// Table headers
const tableHeaders = [
  { title: '戶別', key: 'unitId', sortable: true, width: '120px' },
  { title: '買方', key: 'buyerName', sortable: true },
  { title: '業務員', key: 'salesperson', sortable: true },
  { title: '成交總價', key: 'totalPrice', sortable: false },
  { title: '坪數', key: 'area_house_ping', sortable: true, width: '80px' },
  { title: '小訂日期', key: 'payment_deposit_date', sortable: true, width: '120px' },
  { title: '補足日期', key: 'payment_complete_date', sortable: true, width: '120px' },
  { title: '簽約日期', key: 'payment_contract_date', sortable: true, width: '120px' },
  { title: '退戶原因', key: 'cancelReasons', sortable: false },
  { title: '退戶日期', key: 'cancellationDate', sortable: true, width: '150px' },
  { title: '備註', key: 'remarks', sortable: false },
  { title: '操作人', key: 'operatorName', sortable: true },
];

// 搜尋過濾邏輯
const filteredItems = computed(() => {
  let result = items.value;

  // 過濾冷刪除項目
  if (!showDeleted.value) {
    result = result.filter(item => !item.isDeleted);
  }

  // 搜尋過濾
  const query = searchQuery.value.toLowerCase().trim();
  if (!query) return result;

  return result.filter(item => {
    const searchFields = [
      item.unitId,
      item.buyerName,
      item.salesperson,
      item.operatorName,
      item.area_house_ping,
      formatDate(item.cancellationDate),
      (item.cancelReasons || []).join(' '),
      item.remarks,
      formatPrice(calculateTotalTransactionPrice(item))
    ];
    return searchFields.some(field =>
      field && String(field).toLowerCase().includes(query)
    );
  });
});

const confirmDialog = reactive({
  show: false,
  message: '',
  loading: false,
  targetItem: null,
});

const conflictDialog = reactive({
  show: false,
  message: '',
  currentBuyerName: '',
  currentStatus: '',
});

const editReasonsDialog = reactive({
  show: false,
  loading: false,
  targetItem: null,
  selectedReasons: [],
});

const editDateDialog = reactive({
  show: false,
  loading: false,
  targetItem: null,
  selectedDate: '',
});

const editRemarksDialog = reactive({
  show: false,
  loading: false,
  targetItem: null,
  inputRemarks: '',
});

const softDeleteDialog = reactive({
  show: false,
  loading: false,
  targetItem: null,
  inputDocId: '',
});

const undoSoftDeleteDialog = reactive({
  show: false,
  loading: false,
  targetItem: null,
  inputDocId: '',
});

const hardDeleteDialog = reactive({
  show: false,
  loading: false,
  targetItem: null,
  inputDocId: '',
});

async function loadData() {
  isLoading.value = true;
  try {
    const result = await getCancelledPurchases(props.projectId, true);
    if (result.status === 'success') {
      items.value = result.data || [];
    } else {
      toast.error(`載入失敗：${result.message}`, { position: POSITION.BOTTOM_CENTER });
    }
  } catch (error) {
    console.error('載入退戶資料失敗:', error);
    toast.error('載入退戶資料失敗', { position: POSITION.BOTTOM_CENTER });
  } finally {
    isLoading.value = false;
  }
}

function onRowClick(event, { item }) {
  const docId = item.docId;
  const idx = expanded.value.indexOf(docId);
  if (idx === -1) {
    expanded.value = [docId]; // 單次只展開一筆
  } else {
    expanded.value = [];
  }
}

function formatDate(timestamp) {
  if (!timestamp) return '—';
  if (timestamp._seconds) {
    const date = new Date(timestamp._seconds * 1000);
    return date.toLocaleString('zh-TW', { timeZone: 'Asia/Taipei' });
  }
  if (timestamp instanceof Date) {
    return timestamp.toLocaleString('zh-TW', { timeZone: 'Asia/Taipei' });
  }
  return String(timestamp);
}

function formatDateOnly(value) {
  if (!value) return '—';
  let date;
  if (value._seconds) {
    date = new Date(value._seconds * 1000);
  } else if (value instanceof Date) {
    date = value;
  } else {
    const str = String(value);
    if (/^\d{4}-\d{2}-\d{2}/.test(str)) return str.slice(0, 10);
    date = new Date(str);
    if (isNaN(date.getTime())) return str;
  }
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function formatPrice(val) {
  if (val === null || val === undefined || val === '') return '—';
  return Number(val).toLocaleString();
}

function formatNum(val) {
  if (val === null || val === undefined || val === '') return '—';
  return Number(val).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 });
}

// 計算車位相關價格
function calculateParkingPrices(item) {
  const parkingDetails = item.parkingDetails || [];
  const parkingTransactionSum = parkingDetails.reduce((sum, p) => sum + (Number(p.price_transaction) || 0), 0);
  const parkingFloorSum = parkingDetails.reduce((sum, p) => sum + (Number(p.price_floor) || 0), 0);
  return { parkingTransactionSum, parkingFloorSum };
}

// 計算新的成交總價 = 房屋成交價 + 車位成交價
function calculateTotalTransactionPrice(item) {
  const housePrice = Number(item.price_transaction_house) || 0;
  const { parkingTransactionSum } = calculateParkingPrices(item);
  return housePrice + parkingTransactionSum;
}

// 計算溢差價 = 成交總價 - 房屋底價 - 車位底價
function calculatePremiumPrice(item) {
  const totalTransactionPrice = calculateTotalTransactionPrice(item);
  const houseFloorPrice = Number(item.price_floor_house_total) || 0;
  const { parkingFloorSum } = calculateParkingPrices(item);
  return totalTransactionPrice - houseFloorPrice - parkingFloorSum;
}

function handleRestore(item) {
  confirmDialog.targetItem = item;
  const totalPrice = calculateTotalTransactionPrice(item);
  confirmDialog.message = `確定要將 <strong>【${item.unitId}】</strong> 的退戶資料復原嗎？<br><br>` +
    `買方：<strong>${item.buyerName || '—'}</strong><br>` +
    `銷售人員：<strong>${item.salesperson || '—'}</strong><br>` +
    `成交總價：<strong>${formatPrice(totalPrice)} 萬</strong><br>` +
    `車位：<strong>${item.parkingCount} 個</strong><br><br>` +
    `系統會將備份資料回寫至原始戶別，並恢復車位關聯。`;
  confirmDialog.show = true;
}

async function executeRestore() {
  const item = confirmDialog.targetItem;
  if (!item) return;

  confirmDialog.loading = true;
  restoringDocId.value = item.docId;

  try {
    const result = await restoreCancelledPurchase(
      props.projectId,
      item.docId,
      userStore.user?.name || '未知用戶'
    );

    if (result.status === 'success') {
      toast.success(result.message, { position: POSITION.BOTTOM_CENTER });
      confirmDialog.show = false;
      items.value = items.value.filter(i => i.docId !== item.docId);
      expanded.value = [];
      emit('data-updated');
    } else if (result.status === 'conflict') {
      confirmDialog.show = false;
      conflictDialog.message = result.message;
      conflictDialog.currentBuyerName = result.currentBuyerName;
      conflictDialog.currentStatus = result.currentStatus;
      conflictDialog.show = true;
    } else {
      toast.error(`復原失敗：${result.message}`, { position: POSITION.BOTTOM_CENTER });
    }
  } catch (error) {
    console.error('復原退戶資料失敗:', error);
    toast.error(`復原失敗：${error.message}`, { position: POSITION.BOTTOM_CENTER });
  } finally {
    confirmDialog.loading = false;
    restoringDocId.value = null;
  }
}

function handleEditReasons(item) {
  editReasonsDialog.targetItem = item;
  editReasonsDialog.selectedReasons = [...(item.cancelReasons || [])];
  editReasonsDialog.show = true;
}

async function executeUpdateReasons() {
  const item = editReasonsDialog.targetItem;
  if (!item) return;

  editReasonsDialog.loading = true;

  try {
    const result = await updateCancelReason(
      props.projectId,
      item.docId,
      editReasonsDialog.selectedReasons,
      userStore.user?.name || '未知用戶'
    );

    if (result.status === 'success') {
      toast.success(result.message, { position: POSITION.BOTTOM_CENTER });
      // 即時更新列表中該筆記錄的 cancelReasons
      const itemIndex = items.value.findIndex(i => i.docId === item.docId);
      if (itemIndex !== -1) {
        items.value[itemIndex].cancelReasons = editReasonsDialog.selectedReasons;
      }
      editReasonsDialog.show = false;
    } else {
      toast.error(`修改失敗：${result.message}`, { position: POSITION.BOTTOM_CENTER });
    }
  } catch (error) {
    console.error('修改退戶原因失敗:', error);
    toast.error(`修改失敗：${error.message}`, { position: POSITION.BOTTOM_CENTER });
  } finally {
    editReasonsDialog.loading = false;
  }
}

function handleEditCancellationDate(item) {
  editDateDialog.targetItem = item;
  // 將 Timestamp 轉換為 YYYY-MM-DD 格式
  if (item.cancellationDate) {
    const timestamp = item.cancellationDate;
    let date;
    if (timestamp._seconds) {
      date = new Date(timestamp._seconds * 1000);
    } else if (timestamp instanceof Date) {
      date = timestamp;
    } else {
      date = new Date();
    }
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    editDateDialog.selectedDate = `${year}-${month}-${day}`;
  } else {
    editDateDialog.selectedDate = new Date().toISOString().split('T')[0];
  }
  editDateDialog.show = true;
}

async function executeUpdateDate() {
  const item = editDateDialog.targetItem;
  if (!item || !editDateDialog.selectedDate) {
    toast.error('請選擇退戶日期', { position: POSITION.BOTTOM_CENTER });
    return;
  }

  editDateDialog.loading = true;

  try {
    const result = await updateCancellationDate(
      props.projectId,
      item.docId,
      editDateDialog.selectedDate,
      userStore.user?.name || '未知用戶'
    );

    if (result.status === 'success') {
      toast.success(result.message, { position: POSITION.BOTTOM_CENTER });
      // 即時更新列表中該筆記錄的 cancellationDate
      const itemIndex = items.value.findIndex(i => i.docId === item.docId);
      if (itemIndex !== -1) {
        items.value[itemIndex].cancellationDate = result.cancellationDate;
      }
      editDateDialog.show = false;
    } else {
      toast.error(`修改失敗：${result.message}`, { position: POSITION.BOTTOM_CENTER });
    }
  } catch (error) {
    console.error('修改退戶日期失敗:', error);
    toast.error(`修改失敗：${error.message}`, { position: POSITION.BOTTOM_CENTER });
  } finally {
    editDateDialog.loading = false;
  }
}

function handleEditRemarks(item) {
  editRemarksDialog.targetItem = item;
  editRemarksDialog.inputRemarks = item.remarks || '';
  editRemarksDialog.show = true;
}

async function executeUpdateRemarks() {
  const item = editRemarksDialog.targetItem;
  if (!item) return;

  editRemarksDialog.loading = true;

  try {
    const result = await updateRemarks(
      props.projectId,
      item.docId,
      editRemarksDialog.inputRemarks,
      userStore.user?.name || '未知用戶'
    );

    if (result.status === 'success') {
      toast.success(result.message, { position: POSITION.BOTTOM_CENTER });
      // 即時更新列表中該筆記錄的 remarks
      const itemIndex = items.value.findIndex(i => i.docId === item.docId);
      if (itemIndex !== -1) {
        items.value[itemIndex].remarks = editRemarksDialog.inputRemarks;
      }
      editRemarksDialog.show = false;
    } else {
      toast.error(`修改失敗：${result.message}`, { position: POSITION.BOTTOM_CENTER });
    }
  } catch (error) {
    console.error('修改退戶備註失敗:', error);
    toast.error(`修改失敗：${error.message}`, { position: POSITION.BOTTOM_CENTER });
  } finally {
    editRemarksDialog.loading = false;
  }
}

// ========== 冷刪除相關函數 ==========

function handleSoftDelete(item) {
  softDeleteDialog.targetItem = item;
  softDeleteDialog.inputDocId = '';
  softDeleteDialog.show = true;
}

async function executeSoftDelete() {
  const item = softDeleteDialog.targetItem;
  if (!item) return;

  if (softDeleteDialog.inputDocId !== item.docId) {
    toast.error('文件 ID 不符', { position: POSITION.BOTTOM_CENTER });
    return;
  }

  softDeleteDialog.loading = true;

  try {
    const result = await softDeleteCancelledPurchase(
      props.projectId,
      item.docId,
      userStore.user?.name || '未知用戶'
    );

    if (result.status === 'success') {
      toast.success(result.message, { position: POSITION.BOTTOM_CENTER });
      const itemIndex = items.value.findIndex(i => i.docId === item.docId);
      if (itemIndex !== -1) {
        items.value[itemIndex].isDeleted = true;
        items.value[itemIndex].deletedBy = userStore.user?.name || '未知用戶';
        items.value[itemIndex].deletedAt = new Date();
      }
      softDeleteDialog.show = false;
      expanded.value = [];
    } else {
      toast.error(`冷刪除失敗：${result.message}`, { position: POSITION.BOTTOM_CENTER });
    }
  } catch (error) {
    console.error('冷刪除失敗:', error);
    toast.error(`冷刪除失敗：${error.message}`, { position: POSITION.BOTTOM_CENTER });
  } finally {
    softDeleteDialog.loading = false;
  }
}

function handleUndoSoftDelete(item) {
  undoSoftDeleteDialog.targetItem = item;
  undoSoftDeleteDialog.inputDocId = '';
  undoSoftDeleteDialog.show = true;
}

async function executeUndoSoftDelete() {
  const item = undoSoftDeleteDialog.targetItem;
  if (!item) return;

  if (undoSoftDeleteDialog.inputDocId !== item.docId) {
    toast.error('文件 ID 不符', { position: POSITION.BOTTOM_CENTER });
    return;
  }

  undoSoftDeleteDialog.loading = true;

  try {
    const result = await undoSoftDeleteCancelledPurchase(
      props.projectId,
      item.docId,
      userStore.user?.name || '未知用戶'
    );

    if (result.status === 'success') {
      toast.success(result.message, { position: POSITION.BOTTOM_CENTER });
      const itemIndex = items.value.findIndex(i => i.docId === item.docId);
      if (itemIndex !== -1) {
        items.value[itemIndex].isDeleted = false;
        items.value[itemIndex].deletedBy = '';
        items.value[itemIndex].deletedAt = null;
      }
      undoSoftDeleteDialog.show = false;
      expanded.value = [];
    } else {
      toast.error(`復原失敗：${result.message}`, { position: POSITION.BOTTOM_CENTER });
    }
  } catch (error) {
    console.error('復原失敗:', error);
    toast.error(`復原失敗：${error.message}`, { position: POSITION.BOTTOM_CENTER });
  } finally {
    undoSoftDeleteDialog.loading = false;
  }
}

function handleHardDelete(item) {
  hardDeleteDialog.targetItem = item;
  hardDeleteDialog.inputDocId = '';
  hardDeleteDialog.show = true;
}

async function executeHardDelete() {
  const item = hardDeleteDialog.targetItem;
  if (!item) return;

  if (hardDeleteDialog.inputDocId !== item.docId) {
    toast.error('文件 ID 不符', { position: POSITION.BOTTOM_CENTER });
    return;
  }

  hardDeleteDialog.loading = true;

  try {
    const result = await hardDeleteCancelledPurchase(
      props.projectId,
      item.docId,
      userStore.user?.name || '未知用戶'
    );

    if (result.status === 'success') {
      toast.success(result.message, { position: POSITION.BOTTOM_CENTER });
      items.value = items.value.filter(i => i.docId !== item.docId);
      hardDeleteDialog.show = false;
      expanded.value = [];
    } else {
      toast.error(`永久刪除失敗：${result.message}`, { position: POSITION.BOTTOM_CENTER });
    }
  } catch (error) {
    console.error('永久刪除失敗:', error);
    toast.error(`永久刪除失敗：${error.message}`, { position: POSITION.BOTTOM_CENTER });
  } finally {
    hardDeleteDialog.loading = false;
  }
}

function copyDocId(docId) {
  navigator.clipboard.writeText(docId).then(() => {
    toast.success('文件 ID 已複製', { position: POSITION.BOTTOM_CENTER });
  }).catch(() => {
    toast.error('複製失敗', { position: POSITION.BOTTOM_CENTER });
  });
}

watch(() => props.show, (newVal) => {
  if (newVal) {
    loadData();
  } else {
    expanded.value = [];
    items.value = [];
  }
});
</script>

<style scoped>
.expanded-card {
  border-color: rgb(var(--v-theme-primary)) !important;
  border-width: 2px !important;
}

.section-title {
  font-size: 0.875rem;
  font-weight: 700;
  margin-bottom: 8px;
  display: flex;
  align-items: center;
}

.detail-table {
  background-color: #fafafa;
  border-radius: 8px;
}

.detail-table td,
.detail-table th {
  padding: 4px 12px !important;
  font-size: 0.8125rem;
}

.label-cell {
  color: #757575;
  white-space: nowrap;
  width: 90px;
}

.cancel-reasons-container {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  padding: 8px 0;
}

/* 冷刪除項目樣式 */
.deleted-row {
  background-color: #f5f5f5 !important;
  opacity: 0.65;
}

.deleted-text {
  text-decoration: line-through;
}

.deleted-row:hover {
  background-color: #efefef !important;
}
</style>
