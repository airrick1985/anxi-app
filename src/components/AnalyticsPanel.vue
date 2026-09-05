<template>
  <v-dialog :model-value="show" @update:model-value="emit('update:show', $event)" fullscreen transition="dialog-bottom-transition">
    <v-card class="analytics-dialog" ref="analyticsCardRef">
      <!-- Header -->
      <div class="analytics-header">
        <div class="header-left">
          <v-icon size="22" color="primary">mdi-chart-box</v-icon>
          <span class="header-title">銷控統計分析</span>
          <span v-if="projectData.project?.name" class="header-project">{{ projectData.project.name }}</span>
        </div>
        <div class="header-right">
          <v-btn
            icon="mdi-refresh"
            variant="text"
            size="small"
            :loading="isLoading || isRemoteLoading"
            title="重新載入（含後端資料）"
            @click="loadStatistics({ refetchRemote: true })"
          />
          <v-btn icon="mdi-close" variant="text" size="small" @click="close" />
        </div>
      </div>

      <!-- 左右配置：左側項目導覽 / 右側內容 -->
      <div class="analytics-layout">
        <!-- 左側：項目 -->
        <aside class="analytics-sidebar">
          <div v-if="availableProjects.length > 0" class="sidebar-project">
            <v-select
              :model-value="projectId"
              @update:model-value="emit('update:projectId', $event)"
              :items="availableProjects"
              item-title="name"
              item-value="id"
              label="建案"
              variant="outlined"
              density="compact"
              hide-details
              prepend-inner-icon="mdi-home-city"
            />
          </div>

          <nav class="sidebar-nav">
            <button
              v-for="item in navSections"
              :key="item.key"
              type="button"
              class="nav-item"
              :class="{ 'nav-item--active': activeSection === item.key }"
              @click="activeSection = item.key"
            >
              <v-icon size="18" class="nav-icon">{{ item.icon }}</v-icon>
              <span class="nav-label">{{ item.label }}</span>
              <v-progress-circular
                v-if="item.key === 'visitors' && isVisitorsLoading"
                indeterminate
                size="14"
                width="2"
                class="nav-spinner"
              />
              <span v-else-if="getNavBadge(item.key) !== null" class="nav-badge">{{ getNavBadge(item.key) }}</span>
            </button>
          </nav>

          <div class="sidebar-actions">
            <v-btn
              :text="copyButtonText"
              prepend-icon="mdi-content-copy"
              size="small"
              variant="outlined"
              block
              class="copy-btn"
              :disabled="!statistics"
              @click="showCopyDialog('full')"
            />
            <v-btn
              :text="copySimpleButtonText"
              prepend-icon="mdi-text-short"
              size="small"
              variant="outlined"
              color="info"
              block
              class="copy-btn"
              :disabled="!statistics"
              @click="showCopyDialog('simple')"
            />
          </div>
        </aside>

        <!-- 右側：內容 -->
        <div class="analytics-content">
          <!-- 期間列：期間切換 + 資料區間 同一列 -->
          <div class="period-bar">
            <AnalyticsPeriodToggle
              :period="selectedPeriod"
              :custom-date-range="customDateRange"
              @update:period="handlePeriodChange"
              @update:custom-date-range="handleCustomDateRange"
            />
            <div v-if="periodRangeText" class="period-range">
              <v-icon size="15">mdi-calendar-range</v-icon>
              <span>{{ periodRangeText }}</span>
            </div>
          </div>

          <!-- 後端資料查詢中（不阻擋本地統計顯示） -->
          <div v-if="isRemoteLoading" class="remote-loading">
            <v-progress-linear indeterminate color="primary" height="3" rounded />
            <div class="remote-loading-text">
              <v-icon size="14" color="primary">mdi-cloud-sync-outline</v-icon>
              {{ remoteLoadingText }}
            </div>
          </div>

          <!-- 錯誤提示 -->
          <v-alert
            v-if="error"
            type="error"
            density="compact"
            variant="tonal"
            class="mb-3"
            closable
            @click:close="error = null"
          >
            {{ error }}
          </v-alert>

          <template v-if="statistics">
            <!-- Section: 銷售狀況 -->
            <section v-show="activeSection === 'sales'" class="content-section">
              <!-- 整體總銷總覽：戶別＋車位加總與去化占比 -->
              <div v-if="combinedStats" class="sales-overview">
                <div class="overview-header">
                  <div class="overview-title">
                    <v-icon size="16" color="primary">mdi-bullseye-arrow</v-icon>
                    整體總銷（戶別＋車位）
                  </div>
                  <div class="overview-total">{{ formatAmount(combinedStats.totalAmount) }} <small>萬</small></div>
                </div>
                <div class="overview-progress">
                  <div class="progress-track">
                    <div class="progress-fill" :style="{ width: `${Math.min(Number(combinedStats.soldPct), 100)}%` }"></div>
                  </div>
                  <div class="progress-caption">
                    <span>金額去化率 <b class="progress-pct">{{ combinedStats.soldPct }}%</b></span>
                    <span>總數 {{ statistics.households.total }}戶・{{ statistics.parkings.total }}車位</span>
                  </div>
                </div>
                <div class="overview-split">
                  <div class="overview-item overview-item--sold">
                    <div class="item-label">已售總銷</div>
                    <div class="item-amount item-amount--sold">{{ formatAmount(combinedStats.soldAmount) }}<small>萬</small></div>
                    <div class="item-meta">占 {{ combinedStats.soldPct }}%・{{ statistics.households.sold }}戶・{{ statistics.parkings.sold }}車位</div>
                  </div>
                  <div class="overview-item overview-item--unsold">
                    <div class="item-label">未售總銷</div>
                    <div class="item-amount item-amount--unsold">{{ formatAmount(combinedStats.unsoldAmount) }}<small>萬</small></div>
                    <div class="item-meta">占 {{ combinedStats.unsoldPct }}%・{{ statistics.households.unsold }}戶・{{ statistics.parkings.unsold }}車位</div>
                  </div>
                  <div class="overview-item overview-item--premium">
                    <div class="item-label">已售溢差價</div>
                    <div class="item-amount" :class="premiumClass(combinedStats.soldPremium)">{{ formatPremium(combinedStats.soldPremium) }}</div>
                    <div class="item-meta">戶別 {{ formatPremium(statistics.households.soldPremium) }}・車位 {{ formatPremium(statistics.parkings.soldPremium) }}</div>
                  </div>
                </div>
              </div>

              <!-- 銷售狀況統計表：期間銷售 / 期間退戶 / 已售 / 未售 / 總數 -->
              <div class="stat-table">
                <div class="stat-row stat-row--head">
                  <div class="stat-cell stat-cell--label">項目</div>
                  <div class="stat-cell">戶別</div>
                  <div class="stat-cell">車位</div>
                  <div class="stat-cell">總銷</div>
                  <div class="stat-cell">溢差價</div>
                </div>
                <div
                  v-for="row in salesRows"
                  :key="row.key"
                  class="stat-row"
                  :class="`stat-row--${row.tone}`"
                >
                  <div class="stat-cell stat-cell--label">
                    <v-icon size="16" :color="row.color">{{ row.icon }}</v-icon>
                    <span>{{ row.label }}</span>
                  </div>

                  <!-- 戶別 -->
                  <div class="stat-cell" data-label="戶別">
                    <v-progress-circular v-if="row.loading" indeterminate size="16" width="2" color="error" />
                    <template v-else-if="row.household">
                      <span class="cell-main">{{ formatCount(row.household.count) }}<small>戶</small></span>
                      <span class="cell-sub">{{ row.household.text }}</span>
                    </template>
                    <span v-else-if="row.unavailable" class="cell-empty" title="退戶資料查詢失敗，可按右上角重新載入">無法取得</span>
                    <span v-else class="cell-empty">—</span>
                  </div>

                  <!-- 車位 -->
                  <div class="stat-cell" data-label="車位">
                    <template v-if="row.parking">
                      <span class="cell-main">{{ formatCount(row.parking.count) }}<small>個</small></span>
                      <span class="cell-sub">{{ row.parking.text }}</span>
                    </template>
                    <span v-else class="cell-empty">—</span>
                  </div>

                  <!-- 總銷 -->
                  <div class="stat-cell" data-label="總銷">
                    <template v-if="row.total">
                      <span class="cell-main cell-main--amount">{{ formatAmount(row.total.amount) }}<small>萬</small></span>
                      <span v-if="row.total.pct != null" class="cell-sub">占總銷 {{ row.total.pct }}%</span>
                    </template>
                    <span v-else class="cell-empty">—</span>
                  </div>

                  <!-- 溢差價 -->
                  <div class="stat-cell" data-label="溢差價">
                    <template v-if="row.premium != null">
                      <span class="cell-main cell-main--premium" :class="premiumClass(row.premium)">{{ formatPremium(row.premium) }}</span>
                      <span v-if="row.premiumSub" class="cell-sub">{{ row.premiumSub }}</span>
                    </template>
                    <span v-else class="cell-empty">—</span>
                  </div>
                </div>
              </div>
              <div class="stat-note">
                溢差價＝成交價－底價（含戶別與車位，已售戶別計入）；金額單位為萬元，百分比為占總銷比例
              </div>
            </section>

            <!-- Section: 銷況明細 -->
            <section v-show="activeSection === 'detail'" class="content-section">
              <div class="section-title">
                <v-icon size="16" color="primary">mdi-format-list-bulleted</v-icon>
                銷況明細
                <span class="section-hint">點選戶別可查看資料</span>
              </div>
              <v-expansion-panels multiple>
                <v-expansion-panel
                  v-for="(count, status) in getFilteredByStatus()"
                  :key="status"
                  :class="status === '退戶' ? 'cancelled-panel' : ''"
                >
                  <v-expansion-panel-title>
                    <span :class="status === '退戶' ? 'status-detail-text cancelled-status' : 'status-detail-text'">
                      {{ status }} {{ count }}戶
                      <span class="status-detail-amount">({{ formatAmount(statistics.households.byStatusAmount[status] || 0) }}萬)</span>
                    </span>
                  </v-expansion-panel-title>

                  <v-expansion-panel-text>
                    <div class="units-list">
                      <div
                        v-for="unit in statistics.households.byStatusUnits[status]"
                        :key="unit.unitId"
                        :class="status === '退戶' ? 'unit-item cancelled-unit-item' : 'unit-item'"
                        @click="openUnitDetail(unit, status)"
                      >
                        <span class="unit-info">{{ unit.unitId }}({{ formatAmount(unit.price_transaction_total) }}萬 / {{ calculateUnitPrice(unit.unitId, unit.price_transaction_house, unit.area_house_ping) }}萬/坪)-{{ formatSalespersons(unit.salesperson) }}</span>
                        <div v-if="status === '退戶'" class="cancelled-reason-text">
                          <span class="reason-label">退戶原因</span>
                          <span class="reason-value">{{ unit.cancelReasons && unit.cancelReasons.length ? unit.cancelReasons.join('、') : '未記錄' }}</span>
                        </div>
                      </div>
                    </div>
                  </v-expansion-panel-text>
                </v-expansion-panel>
              </v-expansion-panels>
              <div v-if="Object.keys(getFilteredByStatus()).length === 0" class="empty-hint">
                <v-icon size="18">mdi-clipboard-text-off-outline</v-icon>
                此期間無銷售紀錄
              </div>
            </section>

            <!-- Section: 來人概況 -->
            <section v-show="activeSection === 'visitors'" class="content-section">
              <div class="section-title">
                <v-icon size="16" color="primary">mdi-account-group</v-icon>
                來人概況
                <v-spacer />
                <v-btn
                  variant="outlined"
                  size="small"
                  color="primary"
                  :loading="isAnalyzing"
                  :disabled="!vipGuestStats?.details?.length"
                  @click="analyzeCustomers"
                >
                  <v-icon start size="16">mdi-robot</v-icon>
                  AI 狀況彙整
                </v-btn>
              </div>

              <div v-if="isVisitorsLoading && !vipGuestStats" class="inline-loading">
                <v-progress-circular indeterminate size="20" width="2" color="primary" />
                <span>正在查詢來人概況（後端運算）…</span>
              </div>

              <template v-else-if="vipGuestStats">
                <div class="metric-grid">
                  <MetricCard
                    title="新客"
                    :value="vipGuestStats.newCustomers"
                    icon="mdi-account-plus"
                    icon-color="success"
                    value-color="success"
                  />
                  <MetricCard
                    title="回訪"
                    :value="vipGuestStats.returningCustomers"
                    icon="mdi-account-check"
                    icon-color="info"
                    value-color="info"
                  />
                  <MetricCard
                    title="總來訪"
                    :value="vipGuestStats.totalVisitors"
                    icon="mdi-account-multiple"
                    icon-color="primary"
                    value-color="primary"
                  />
                </div>

                <!-- 來訪詳細列表 (外層展開) -->
                <div v-if="vipGuestStats.details.length > 0" class="mt-3">
                  <button type="button" class="list-toggle" @click="showVipGuestList = !showVipGuestList">
                    <v-icon :icon="showVipGuestList ? 'mdi-chevron-down' : 'mdi-chevron-right'" size="18"></v-icon>
                    <span>來訪客戶列表（共 {{ vipGuestStats.details.length }} 人）</span>
                  </button>

                  <div v-show="showVipGuestList" class="mt-2">
                    <v-expansion-panels>
                      <v-expansion-panel
                        v-for="guest in vipGuestStats.details"
                        :key="guest.guestId"
                      >
                        <template #title>
                          <div class="d-flex align-center gap-2 flex-wrap">
                            <v-chip
                              :label="true"
                              :color="guest.type === 'new' ? 'green' : 'red'"
                              size="small"
                              class="flex-shrink-0"
                            >
                              {{ guest.type === 'new' ? '新客' : '回訪' }}
                            </v-chip>
                            <span class="text-body2 font-weight-500">{{ guest.guestName }}</span>
                            <span class="text-caption text-grey">{{ guest.guestPhone }}</span>
                            <v-chip
                              v-if="guest.guestLevel"
                              :label="true"
                              :color="getLevelColor(guest.guestLevel)"
                              size="x-small"
                              variant="tonal"
                              class="flex-shrink-0"
                            >
                              等級：{{ guest.guestLevel }}
                            </v-chip>
                            <v-chip
                              v-if="guest.noPurchaseReasons?.length"
                              :label="true"
                              :color="getNoPurchaseReasonColor(guest.noPurchaseReasons)"
                              size="x-small"
                              variant="tonal"
                              class="flex-shrink-0"
                            >
                              未購：{{ guest.noPurchaseReasons.join('、') }}
                            </v-chip>
                            <v-divider vertical class="mx-1"></v-divider>
                            <span class="text-caption">👨‍💼 {{ guest.salesName }}</span>
                            <v-divider vertical class="mx-1"></v-divider>
                            <span class="text-caption">📅 {{ formatDate(guest.interactionLogs[0].date) }}</span>
                            <v-spacer></v-spacer>
                            <span class="text-caption text-grey">第 {{ guest.visitIndex }} 次現場介紹 (共 {{ guest.interactionLogs.length }} 筆互動)</span>
                          </div>
                        </template>
                        <template #text>
                          <div class="guest-info">
                            <v-row no-gutters class="mb-3">
                              <v-col cols="12" sm="6">
                                <p class="text-caption mb-1"><strong>👤 客戶信息</strong></p>
                                <p class="text-caption mb-1"><strong>姓名：</strong>{{ guest.guestName }}</p>
                                <p class="text-caption mb-1"><strong>電話：</strong>{{ guest.guestPhone }}</p>
                                <p class="text-caption">
                                  <strong>類型：</strong>
                                  <v-chip :color="guest.type === 'new' ? 'green' : 'red'" size="x-small" variant="tonal">
                                    {{ guest.type === 'new' ? '新客' : '回訪客戶' }}
                                  </v-chip>
                                </p>
                              </v-col>
                              <v-col cols="12" sm="6">
                                <p class="text-caption mb-1"><strong>👨‍💼 銷售人員</strong></p>
                                <p class="text-caption mb-1"><strong>姓名：</strong>{{ guest.salesName }}</p>
                                <p class="text-caption"><strong>訪問次數：</strong>第 {{ guest.visitIndex }} 次訪問</p>
                              </v-col>
                            </v-row>

                            <v-divider class="my-2"></v-divider>
                            <p class="text-caption mb-2">
                              <strong>📝 互動紀錄（共 {{ guest.interactionLogs.length }} 次）</strong>
                            </p>
                            <div class="interaction-history">
                              <div
                                v-for="(log, index) in guest.interactionLogs"
                                :key="index"
                                class="interaction-item"
                              >
                                <div class="d-flex align-center gap-2 mb-1 flex-wrap">
                                  <v-chip
                                    :label="true"
                                    :color="log.interactionType === '現場介紹' ? 'primary' : 'default'"
                                    size="x-small"
                                  >
                                    {{ log.interactionType }}
                                  </v-chip>
                                  <span class="text-caption font-weight-500">📅 {{ formatDate(log.date) }}</span>
                                  <v-divider vertical class="mx-1"></v-divider>
                                  <span class="text-caption">👤 {{ log.recorderName }}</span>
                                </div>
                                <p class="text-caption mb-0 interaction-content">{{ log.content }}</p>
                              </div>
                            </div>
                          </div>
                        </template>
                      </v-expansion-panel>
                    </v-expansion-panels>
                  </div>
                </div>
                <div v-else class="empty-hint">
                  <v-icon size="18">mdi-account-off-outline</v-icon>
                  此期間無來訪紀錄
                </div>
              </template>

              <v-alert v-else type="info" variant="tonal" density="compact">
                暫無來人資料（查詢失敗或尚無客戶互動紀錄），可按右上角重新載入
              </v-alert>
            </section>

            <!-- Section: 銷售人員排行 -->
            <section v-show="activeSection === 'personnel'" class="content-section">
              <div class="section-title">
                <v-icon size="16" color="primary">mdi-trophy</v-icon>
                銷售人員排行
                <span class="section-hint">依銷售金額排序；多人共同成交採平均分配</span>
              </div>
              <PersonnelRanking
                v-if="statistics.personnel && statistics.personnel.length > 0"
                :personnel-stats="statistics.personnel"
              />
              <v-alert v-else type="info" variant="tonal" density="compact">
                暫無銷售人員資料
              </v-alert>
            </section>
          </template>

          <!-- 無數據提示 -->
          <v-alert v-else-if="!isLoading" type="info" variant="tonal" density="compact">
            暫無統計數據，請確認建案已有戶別資料。
          </v-alert>
        </div>
      </div>
    </v-card>

    <!-- 複製文本預覽對話框 -->
    <v-dialog v-model="copyPreviewDialog.show" max-width="600">
      <v-card>
        <v-card-title class="d-flex justify-space-between align-center">
          <span>預覽複製內容</span>
          <v-btn icon="mdi-close" variant="text" @click="copyPreviewDialog.show = false"></v-btn>
        </v-card-title>
        <v-divider></v-divider>
        <v-card-text class="preview-content">
          <pre class="text-body2">{{ copyPreviewDialog.text }}</pre>
        </v-card-text>
        <v-divider></v-divider>
        <v-card-actions class="justify-end gap-2">
          <v-btn variant="tonal" @click="copyPreviewDialog.show = false">取消</v-btn>
          <v-btn variant="flat" color="primary" @click="confirmCopy">確認複製</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- UnitDetailModal -->
    <UnitDetailModal
      :show="showUnitModal"
      :unit-data="selectedUnitData"
      :all-data="{
        '戶別': projectData.households || [],
        '車位': projectData.parkings || [],
        '銷控圖片': projectData.images || [],
        '參數': projectData.parameters || [],
        '銷售人員': projectData.personnel || [],
      }"
      :project-name="projectData.project?.name || '專案'"
      :project-id="props.projectId"
      :contract-types="[]"
      @update:show="showUnitModal = $event"
    />

    <!-- 退戶資訊 Dialog -->
    <v-dialog v-model="showCancelledModal" max-width="520">
      <v-card v-if="cancelledDetail">
        <v-card-title class="d-flex justify-space-between align-center bg-red-lighten-5">
          <span class="text-red-darken-2 font-weight-bold">
            <v-icon start color="error">mdi-home-remove-outline</v-icon>退戶資訊
          </span>
          <v-btn icon="mdi-close" variant="text" size="small" @click="showCancelledModal = false"></v-btn>
        </v-card-title>
        <v-divider></v-divider>
        <v-card-text>
          <div class="d-flex align-center mb-3">
            <span class="text-h6 font-weight-bold">{{ cancelledDetail.unitId }}</span>
            <v-chip class="ml-2" color="error" variant="tonal" size="small" label>已退戶</v-chip>
          </div>

          <v-row dense class="text-body-2">
            <v-col cols="6"><span class="text-grey-darken-1">買方姓名</span></v-col>
            <v-col cols="6" class="text-right font-weight-medium">{{ cancelledDetail.buyerName || '—' }}</v-col>

            <v-col cols="6"><span class="text-grey-darken-1">銷售人員</span></v-col>
            <v-col cols="6" class="text-right font-weight-medium">{{ formatSalespersons(cancelledDetail.salesperson, '、', '—') }}</v-col>

            <v-col cols="6"><span class="text-grey-darken-1">成交總價</span></v-col>
            <v-col cols="6" class="text-right font-weight-medium">{{ formatAmount(cancelledDetail.price_transaction_total) }} 萬</v-col>

            <v-col cols="6"><span class="text-grey-darken-1">退戶日期</span></v-col>
            <v-col cols="6" class="text-right font-weight-medium">{{ cancelledDetail.cancellationDate || '—' }}</v-col>

            <v-col cols="6"><span class="text-grey-darken-1">操作人員</span></v-col>
            <v-col cols="6" class="text-right font-weight-medium">{{ cancelledDetail.operatorName || '—' }}</v-col>
          </v-row>

          <v-divider class="my-3"></v-divider>

          <div class="text-subtitle-2 font-weight-bold mb-2">
            <v-icon size="small" color="error" class="mr-1">mdi-information-outline</v-icon>退戶原因
          </div>
          <div v-if="cancelledDetail.cancelReasons && cancelledDetail.cancelReasons.length">
            <v-chip
              v-for="(reason, idx) in cancelledDetail.cancelReasons"
              :key="idx"
              color="error"
              variant="tonal"
              size="small"
              label
              class="mr-2 mb-2"
            >{{ reason }}</v-chip>
          </div>
          <div v-else class="text-caption text-grey">
            本筆退戶記錄未記錄退戶原因
          </div>

          <v-divider class="my-3"></v-divider>

          <div class="text-subtitle-2 font-weight-bold mb-2">
            <v-icon size="small" color="info" class="mr-1">mdi-note-text-outline</v-icon>備註
          </div>
          <div v-if="cancelledDetail.cancelRemarks" class="pa-2 bg-blue-lighten-5 rounded text-body-2">
            {{ cancelledDetail.cancelRemarks }}
          </div>
          <div v-else class="text-caption text-grey">未填寫備註</div>
        </v-card-text>
        <v-divider></v-divider>
        <v-card-actions class="justify-end">
          <v-btn variant="tonal" @click="showCancelledModal = false">關閉</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- 客戶狀況彙整 Dialog -->
    <v-dialog v-model="showAnalysisDialog" max-width="700" scrollable>
      <v-card>
        <v-card-title>客戶狀況彙整報告</v-card-title>
        <v-card-subtitle>{{ getPeriodLabel() }} · AI 生成</v-card-subtitle>
        <v-divider />
        <v-card-text
          ref="reportContentRef"
          style="max-height: 500px; overflow-y: auto; white-space: pre-wrap; font-size: 14px; line-height: 1.8; color: #1a1a1a;"
        >
          {{ analysisReport }}
        </v-card-text>
        <v-divider />
        <v-card-actions>
          <v-btn
            variant="outlined"
            size="small"
            :loading="isDownloadingPng"
            @click="downloadPng"
          >
            <v-icon start>mdi-image</v-icon>PNG
          </v-btn>
          <v-btn
            variant="outlined"
            size="small"
            :loading="isDownloadingDocx"
            @click="downloadDocx"
          >
            <v-icon start>mdi-file-word</v-icon>WORD
          </v-btn>
          <v-spacer />
          <v-btn variant="text" @click="showAnalysisDialog = false">關閉</v-btn>
          <v-btn
            color="primary"
            variant="flat"
            :prepend-icon="analysisCopied ? 'mdi-check' : 'mdi-content-copy'"
            @click="copyAnalysisReport"
          >
            {{ analysisCopied ? '已複製' : '複製報告' }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- AI 分析中全屏遮罩 -->
    <Teleport to="body">
      <v-overlay
        :model-value="isAnalyzing"
        persistent
        class="ai-analyzing-overlay"
        style="z-index: 9999 !important; display: flex; align-items: center; justify-content: center;"
      >
        <div class="d-flex flex-column align-center ga-4">
          <v-progress-circular indeterminate size="72" width="6" color="white" />
          <div class="text-white text-h6">AI 分析中...</div>
          <div class="text-white text-body-2 text-center" style="opacity: 0.8; max-width: 300px;">
            正在彙整客戶互動記錄，請稍候
          </div>
        </div>
      </v-overlay>
    </Teleport>
  </v-dialog>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useSalesDataStore } from '@/store/salesDataStore'
import {
  calculateHouseholdStats,
  calculateParkingStats,
  calculatePersonnelStats,
  calculateVipGuestStats,
  getDateRange,
} from '@/utils/analyticsCalculations'
import { normalizeSalespersons, formatSalespersons, salespersonShare } from '@/utils/salespersonUtils'
import { fetchVipGuests, analyzeCustomerStatus, getCancelledPurchases } from '@/api'
// html2canvas / docx / file-saver 只有輸出 AI 報告時才用到，改為下載時動態載入，
// 避免首次開啟統計面板就得先下載這三個套件（合計約 300KB）
import AnalyticsPeriodToggle from './AnalyticsPeriodToggle.vue'
import MetricCard from './MetricCard.vue'
import PersonnelRanking from './PersonnelRanking.vue'
import UnitDetailModal from './UnitDetailModal.vue'

const props = defineProps({
  show: {
    type: Boolean,
    default: false,
  },
  projectId: {
    type: String,
    required: true,
  },
  availableProjects: {
    type: Array,
    default: () => [],
  },
})

const emit = defineEmits(['update:show', 'update:projectId'])

const salesDataStore = useSalesDataStore()

/**
 * 格式化日期為 YYYY-MM-DD 格式（用於日期輸入）
 */
const formatDateToInput = (date) => {
  const d = new Date(date)
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const selectedPeriod = ref('today')

// 左側項目導覽
const activeSection = ref('sales')
const navSections = [
  { key: 'sales', label: '銷售狀況', icon: 'mdi-chart-donut' },
  { key: 'detail', label: '銷況明細', icon: 'mdi-format-list-bulleted' },
  { key: 'visitors', label: '來人概況', icon: 'mdi-account-group' },
  { key: 'personnel', label: '銷售人員排行', icon: 'mdi-trophy' },
]
const analyticsCardRef = ref(null)
const isLoading = ref(false)          // 本地統計計算中（毫秒級）
const isVisitorsLoading = ref(false)  // 來人概況：後端 Cloud Function 查詢中
const isCancelledLoading = ref(false) // 退戶資料：後端 Cloud Function 查詢中
const isRemoteLoading = computed(() => isVisitorsLoading.value || isCancelledLoading.value)
const remoteLoadingText = computed(() => {
  const parts = []
  if (isVisitorsLoading.value) parts.push('來人概況')
  if (isCancelledLoading.value) parts.push('退戶資料')
  return `正在查詢${parts.join('與')}（後端運算），銷售統計已可先行查看…`
})
const error = ref(null)

/**
 * 後端原始資料快取（非響應式：資料量大，不需要被模板追蹤）
 * Why: 來人概況與退戶都是「抓全量、前端依期間過濾」，同一建案切換期間不必重打 Cloud Function
 */
let remoteRaw = { projectId: null, vipGuests: null, cancelledList: null }
let remoteToken = null   // 最新一次後端查詢的識別；舊查詢回來時若不符則忽略
let basePersonnel = []   // 本地計算的人員排行原始名單（退戶合併以此為基底，重複套用不會累加）
const statistics = ref(null)
const vipGuestStats = ref(null)
const cancelledStats = ref(null)
const showVipGuestList = ref(false)
const showUnitModal = ref(false)
const showCancelledModal = ref(false)
const cancelledDetail = ref(null)
const isAnalyzing = ref(false)
const showAnalysisDialog = ref(false)
const analysisReport = ref('')
const analysisCopied = ref(false)
const isDownloadingPng = ref(false)
const isDownloadingDocx = ref(false)
const reportContentRef = ref(null)
const selectedUnitData = ref(null)
const customDateRange = ref({
  start: formatDateToInput(new Date()),
  end: formatDateToInput(new Date()),
})

/**
 * 格式化金額為千位符
 */
const formatAmount = (amount) => {
  if (!amount) return '0'
  return Math.floor(amount).toLocaleString('zh-TW')
}

/**
 * 格式化日期
 */
const formatDate = (date) => {
  if (!date) return ''
  const d = new Date(date)
  return `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}`
}

const getLevelColor = (level) => {
  const s = String(level || '')
  if (s.includes('A') || s.includes('意願高')) return 'red'
  if (s.includes('B') || s.includes('有機會')) return 'amber-darken-2'
  if (s.includes('C') || s.includes('需考慮')) return 'green'
  if (s.includes('D') || s.includes('無希望')) return 'grey'
  return 'grey'
}

const getNoPurchaseReasonColor = (reasons) => {
  const s = Array.isArray(reasons) ? reasons.join(' ') : String(reasons || '')
  if (/下訂|成交|已購|下定|補足|簽約/.test(s)) return 'red'
  return 'grey'
}

/**
 * 計算百分比
 */
const calculatePercentage = (part, total) => {
  if (!total || total === 0) return '0.0'
  return ((part / total) * 100).toFixed(1)
}

/**
 * 導覽項目徽章（顯示各項目的關鍵數字）
 */
const getNavBadge = (key) => {
  if (!statistics.value) return null
  if (key === 'sales') return combinedStats.value ? `${combinedStats.value.soldPct}%` : null
  if (key === 'detail') {
    const total = Object.values(getFilteredByStatus()).reduce((a, b) => a + b, 0)
    return total > 0 ? total : null
  }
  if (key === 'visitors') return vipGuestStats.value?.totalVisitors ?? null
  if (key === 'personnel') return statistics.value.personnel?.length || null
  return null
}

// 切換項目時將內容捲回頂部（手機瀏覽長內容後切換不需手動回捲）
watch(activeSection, () => {
  const el = analyticsCardRef.value?.$el
  if (el && typeof el.scrollTo === 'function') {
    el.scrollTo({ top: 0, behavior: 'smooth' })
  }
})

/**
 * 戶別＋車位加總統計（總銷金額、已售/未售總銷占比）
 */
const combinedStats = computed(() => {
  if (!statistics.value) return null
  const h = statistics.value.households
  const p = statistics.value.parkings
  const totalAmount = (h.totalAmount || 0) + (p.totalAmount || 0)
  const soldAmount = (h.soldAmount || 0) + (p.soldAmount || 0)
  const unsoldAmount = (h.unsoldAmount || 0) + (p.unsoldAmount || 0)
  const periodSoldAmount = (h.periodSoldAmount || 0) + (p.periodSoldAmount || 0)
  const soldPremium = (h.soldPremium || 0) + (p.soldPremium || 0)
  const periodSoldPremium = (h.periodSoldPremium || 0) + (p.periodSoldPremium || 0)
  return {
    totalAmount,
    soldAmount,
    unsoldAmount,
    periodSoldAmount,
    soldPremium,
    periodSoldPremium,
    soldPct: calculatePercentage(soldAmount, totalAmount),
    unsoldPct: calculatePercentage(unsoldAmount, totalAmount),
    periodPct: calculatePercentage(periodSoldAmount, totalAmount),
  }
})

/**
 * 格式化戶數／車位數（整數千分位）
 */
const formatCount = (n) => Math.round(Number(n) || 0).toLocaleString('zh-TW')

/**
 * 格式化溢差價：帶正負號，單位萬
 */
const formatPremium = (amount) => {
  const n = Number(amount) || 0
  if (n === 0) return '0萬'
  const sign = n > 0 ? '+' : '−'
  return `${sign}${Math.round(Math.abs(n)).toLocaleString('zh-TW')}萬`
}

const premiumClass = (amount) => {
  const n = Number(amount) || 0
  return n > 0 ? 'premium-pos' : n < 0 ? 'premium-neg' : 'premium-zero'
}

/**
 * 期間列顯示的資料區間文字
 */
const periodRangeText = computed(() => {
  if (!statistics.value) return ''
  if (selectedPeriod.value === 'all') return '累計（全部資料）'
  const dr = statistics.value.dateRange
  if (!dr?.start || !dr?.end) return ''
  const s = formatDate(dr.start)
  const e = formatDate(dr.end)
  return s === e ? s : `${s} ~ ${e}`
})

/**
 * 銷售狀況統計表的列資料：期間銷售 / 期間退戶 / 已售（累計） / 未售 / 總數
 * 每列：戶別（數量＋金額占比）、車位、總銷、溢差價
 */
const salesRows = computed(() => {
  if (!statistics.value || !combinedStats.value) return []
  const h = statistics.value.households
  const p = statistics.value.parkings
  const c = combinedStats.value
  const pl = getPeriodLabel()
  const cell = (count, amount, pct) => ({
    count,
    text: pct != null ? `${formatAmount(amount)}萬 · ${pct}%` : `${formatAmount(amount)}萬`,
  })
  const premiumSub = (house, parking) => `戶別 ${formatPremium(house)} · 車位 ${formatPremium(parking)}`
  const rows = []

  if (selectedPeriod.value !== 'all') {
    rows.push({
      key: 'period',
      tone: 'period',
      icon: 'mdi-plus-circle',
      color: 'info',
      label: `${pl}銷售`,
      household: cell(h.periodSold, h.periodSoldAmount, calculatePercentage(h.periodSoldAmount, h.totalAmount)),
      parking: cell(p.periodSold, p.periodSoldAmount, calculatePercentage(p.periodSoldAmount, p.totalAmount)),
      total: { amount: c.periodSoldAmount, pct: c.periodPct },
      premium: c.periodSoldPremium,
      premiumSub: premiumSub(h.periodSoldPremium, p.periodSoldPremium),
    })
    const cs = cancelledStats.value
    rows.push({
      key: 'cancelled',
      tone: 'cancelled',
      icon: 'mdi-account-cancel',
      color: 'error',
      label: `${pl}退戶`,
      loading: isCancelledLoading.value,
      unavailable: !isCancelledLoading.value && cs === null,
      household: cs ? { count: cs.count, text: cs.amount > 0 ? `- ${formatAmount(cs.amount)}萬` : '—' } : null,
      parking: null,
      total: null,
      premium: null,
    })
  }

  rows.push({
    key: 'sold',
    tone: 'sold',
    icon: 'mdi-check-circle',
    color: 'success',
    label: '已售（累計）',
    household: cell(h.sold, h.soldAmount, calculatePercentage(h.soldAmount, h.totalAmount)),
    parking: cell(p.sold, p.soldAmount, calculatePercentage(p.soldAmount, p.totalAmount)),
    total: { amount: c.soldAmount, pct: c.soldPct },
    premium: c.soldPremium,
    premiumSub: premiumSub(h.soldPremium, p.soldPremium),
  })
  rows.push({
    key: 'unsold',
    tone: 'unsold',
    icon: 'mdi-home-outline',
    color: 'warning',
    label: '未售',
    household: cell(h.unsold, h.unsoldAmount, calculatePercentage(h.unsoldAmount, h.totalAmount)),
    parking: cell(p.unsold, p.unsoldAmount, calculatePercentage(p.unsoldAmount, p.totalAmount)),
    total: { amount: c.unsoldAmount, pct: c.unsoldPct },
    premium: null,
  })
  rows.push({
    key: 'total',
    tone: 'total',
    icon: 'mdi-sigma',
    color: 'primary',
    label: '總數',
    household: cell(h.total, h.totalAmount),
    parking: cell(p.total, p.totalAmount),
    total: { amount: c.totalAmount, pct: null },
    premium: null,
  })
  return rows
})

/**
 * 計算單價（萬/坪）
 * @param {string} unitId - 戶別 ID
 * @param {number} [housePrice] - 房屋成交價（可選，用於退戶單位）
 * @param {number} [areaPing] - 坪數（可選，用於退戶單位）
 */
const calculateUnitPrice = (unitId, housePrice = null, areaPing = null) => {
  // 如果提供了價格和面積，直接使用（用於退戶單位）
  if (housePrice !== null && areaPing !== null) {
    const price = Number(housePrice) || 0
    const area = Number(areaPing) || 0
    if (area === 0 || price === 0) return 'N/A'
    return (price / area).toFixed(2)
  }

  // 從 projectData 中找到該戶別
  const household = projectData.value.households?.find(h => h.unitId === unitId)

  if (!household) return 'N/A'

  // 使用房屋成交價 / 坪數計算單價
  const price = Number(household.price_transaction_house) || 0
  const area = Number(household.area_house_ping) || 0

  if (area === 0 || price === 0) return 'N/A'

  const unitPrice = (price / area).toFixed(2)
  return unitPrice
}

/**
 * 獲取時間粒度標籤
 */
const getPeriodLabel = () => {
  if (selectedPeriod.value === 'today') return '本日'
  if (selectedPeriod.value === 'week') return '本週'
  if (selectedPeriod.value === 'month') return '本月'
  if (selectedPeriod.value === 'custom') return '期間'
  return ''
}

/**
 * 過濾銷況明細：顯示小訂、補足、簽約、退戶
 */
const getFilteredByStatus = () => {
  if (!statistics.value?.households?.byStatus) return {}

  const validStatuses = ['小訂', '補足', '簽約', '退戶']
  const filtered = {}

  Object.entries(statistics.value.households.byStatus).forEach(([status, count]) => {
    if (validStatuses.includes(status)) {
      filtered[status] = count
    }
  })

  return filtered
}

/**
 * 生成統計數據的純文本格式
 */
const generateStatisticsText = () => {
  if (!statistics.value) return ''

  const projectName = projectData.value.project?.name || '專案'
  const periodLabel = selectedPeriod.value === 'all' ? '累計' :
                      selectedPeriod.value === 'today' ? '本日' :
                      selectedPeriod.value === 'week' ? '本週' :
                      selectedPeriod.value === 'month' ? '本月' : '期間'

  let text = `${periodLabel}【${projectName}】銷況\n`

  // 日期或期間信息
  if (selectedPeriod.value === 'today' && statistics.value.dateRange) {
    text += `${formatDate(statistics.value.dateRange.start)}\n`
  } else if (selectedPeriod.value === 'custom' && statistics.value.dateRange) {
    text += `${formatDate(statistics.value.dateRange.start)} ~ ${formatDate(statistics.value.dateRange.end)}\n`
  } else if ((selectedPeriod.value === 'week' || selectedPeriod.value === 'month') && statistics.value.dateRange) {
    text += `${formatDate(statistics.value.dateRange.start)} ~ ${formatDate(statistics.value.dateRange.end)}\n`
  }

  // 計算總金額和已售金額
  const totalHouseholdAmount = statistics.value.households.totalAmount
  const totalParkingAmount = statistics.value.parkings.totalAmount
  const totalAllAmount = totalHouseholdAmount + totalParkingAmount

  const soldHouseholdAmount = statistics.value.households.soldAmount
  const soldParkingAmount = statistics.value.parkings.soldAmount
  const totalSoldAmount = soldHouseholdAmount + soldParkingAmount

  const unsoldHouseholdAmount = statistics.value.households.unsoldAmount
  const unsoldParkingAmount = statistics.value.parkings.unsoldAmount
  const totalUnsoldAmount = unsoldHouseholdAmount + unsoldParkingAmount

  // 如果不是累計，顯示該時間段的新銷售（第一組）
  if (selectedPeriod.value !== 'all') {
    const periodHouseholdAmount = statistics.value.households.periodSoldAmount || 0
    const periodParkingAmount = statistics.value.parkings.periodSoldAmount || 0
    const periodTotalAmount = periodHouseholdAmount + periodParkingAmount

    text += `\n${getPeriodLabel()}銷售戶數：${statistics.value.households.periodSold}戶 (${formatAmount(periodHouseholdAmount)}萬)\n`
    text += `${getPeriodLabel()}銷售車位：${statistics.value.parkings.periodSold}個 (${formatAmount(periodParkingAmount)}萬)\n`
    text += `${getPeriodLabel()}銷售總銷：${formatAmount(periodTotalAmount)}萬 (${calculatePercentage(periodTotalAmount, totalAllAmount)}%)\n`
  }

  // 已售（第二組）
  text += `\n已售戶數：${statistics.value.households.sold}戶 (${formatAmount(soldHouseholdAmount)}萬)\n`
  text += `已售車位：${statistics.value.parkings.sold}個 (${formatAmount(soldParkingAmount)}萬)\n`
  text += `已售總銷：${formatAmount(totalSoldAmount)}萬 (${calculatePercentage(totalSoldAmount, totalAllAmount)}%)\n`

  // 未售（第三組）
  text += `\n未售戶數：${statistics.value.households.unsold}戶 (${formatAmount(unsoldHouseholdAmount)}萬)\n`
  text += `未售車位：${statistics.value.parkings.unsold}個 (${formatAmount(unsoldParkingAmount)}萬)\n`
  text += `未售總銷：${formatAmount(totalUnsoldAmount)}萬 (${calculatePercentage(totalUnsoldAmount, totalAllAmount)}%)\n`

  // 退戶（新增）
  if (cancelledStats.value !== null && cancelledStats.value.count > 0) {
    const label = selectedPeriod.value === 'all' ? '累計' : getPeriodLabel()
    text += `\n${label}退戶戶數：${cancelledStats.value.count}戶`
    if (cancelledStats.value.amount > 0) {
      text += ` (- ${formatAmount(cancelledStats.value.amount)}萬)`
    }
    text += '\n'
  }

  // 總數（第四組）
  text += `\n總戶數：${statistics.value.households.total}戶 (${formatAmount(totalHouseholdAmount)}萬)\n`
  text += `總車位：${statistics.value.parkings.total}個 (${formatAmount(totalParkingAmount)}萬)\n`
  text += `總銷：${formatAmount(totalAllAmount)}萬\n`

  text += `\n【戶別明細】\n`
  const validStatuses = ['小訂', '補足', '簽約', '退戶']
  const byStatusEntries = Object.entries(statistics.value.households.byStatus).filter(
    ([status]) => validStatuses.includes(status)
  )

  if (byStatusEntries.length === 0) {
    text += `(無)\n`
  } else {
    byStatusEntries.forEach(([status, count]) => {
      const amount = statistics.value.households.byStatusAmount[status] || 0
      text += `${status}：${count}戶 (${formatAmount(amount)}萬)\n`

      const units = statistics.value.households.byStatusUnits[status] || []
      units.forEach(unit => {
        // 使用資料庫的 total_transaction 和 unit_price_transaction
        const unitPrice = calculateUnitPrice(unit.unitId, unit.price_transaction_house, unit.area_house_ping)

        // 找到該戶對應的所有車位
        const parkings = projectData.value.parkings?.filter(p => p.buyerUnitId === unit.unitId) || []

        // 生成車位信息文本
        let parkingText = ''
        if (parkings.length > 0) {
          parkingText = parkings.map(p => `-${p.spotId}(${Math.floor(p.price_transaction)}萬)`).join('')
        }

        text += `  • ${unit.unitId}(${Math.floor(unit.price_transaction_total)}萬 / ${unitPrice}萬/坪)${parkingText}-${formatSalespersons(unit.salesperson)}\n`
      })
    })
  }

  return text
}

/**
 * 生成簡易文本格式
 */
const generateSimpleText = () => {
  if (!statistics.value) return ''

  const projectName = projectData.value.project?.name || '專案'

  let text = `【${projectName}】銷況\n`

  // 添加日期
  if (selectedPeriod.value === 'today' && statistics.value.dateRange) {
    text += `${formatDate(statistics.value.dateRange.start)}\n`
  } else if (selectedPeriod.value === 'custom' && statistics.value.dateRange) {
    text += `${formatDate(statistics.value.dateRange.start)} ~ ${formatDate(statistics.value.dateRange.end)}\n`
  } else if ((selectedPeriod.value === 'week' || selectedPeriod.value === 'month') && statistics.value.dateRange) {
    text += `${formatDate(statistics.value.dateRange.start)} ~ ${formatDate(statistics.value.dateRange.end)}\n`
  } else if (selectedPeriod.value === 'all') {
    text += `累計統計\n`
  }

  text += `\n`

  // 📌 新增：來人概況段落
  if (vipGuestStats.value) {
    text += `來人概況\n`
    text += `新客：${vipGuestStats.value.newCustomers}\n`
    text += `回訪：${vipGuestStats.value.returningCustomers}\n`
    text += `\n`
  }

  // 計算金額
  const totalHouseholdAmount = statistics.value.households.totalAmount
  const totalParkingAmount = statistics.value.parkings.totalAmount
  const totalAllAmount = totalHouseholdAmount + totalParkingAmount

  const soldHouseholdAmount = statistics.value.households.soldAmount
  const soldParkingAmount = statistics.value.parkings.soldAmount
  const totalSoldAmount = soldHouseholdAmount + soldParkingAmount

  // 本日/周/月銷售
  if (selectedPeriod.value !== 'all') {
    const periodHouseholdAmount = statistics.value.households.periodSoldAmount || 0
    const periodParkingAmount = statistics.value.parkings.periodSoldAmount || 0
    const periodTotalAmount = periodHouseholdAmount + periodParkingAmount

    text += `${getPeriodLabel()}銷售戶數：${statistics.value.households.periodSold}戶 (${formatAmount(periodHouseholdAmount)}萬)\n`
    text += `${getPeriodLabel()}銷售車位：${statistics.value.parkings.periodSold}個 (${formatAmount(periodParkingAmount)}萬)\n`
    text += `${getPeriodLabel()}銷售總銷：${formatAmount(periodTotalAmount)}萬 (${calculatePercentage(periodTotalAmount, totalAllAmount)}%)\n`

    // 📌 新增：退戶資訊
    if (cancelledStats.value && cancelledStats.value.count > 0) {
      text += `${getPeriodLabel()}退戶戶數：${cancelledStats.value.count}戶`
      if (cancelledStats.value.amount > 0) {
        text += ` (- ${formatAmount(cancelledStats.value.amount)}萬)`
      }
      text += `\n`
    }

    // 📌 新增：成交戶別詳情（包含銷售人員）
    if (statistics.value.households.byStatusUnits) {
      // 檢查是否有任何成交戶別或退戶
      const statusOrder = ['小訂', '補足', '簽約', '退戶']
      let hasUnits = false

      statusOrder.forEach(status => {
        const units = statistics.value.households.byStatusUnits[status]
        if (units && units.length > 0) {
          hasUnits = true
        }
      })

      if (hasUnits) {
        text += `戶別狀況\n`
        // 遍歷所有狀態，並列出該狀態下的戶別及其銷售人員
        statusOrder.forEach(status => {
          const units = statistics.value.households.byStatusUnits[status]
          if (units && units.length > 0) {
            // 為每個戶別添加銷售人員信息
            const unitDetails = units.map(u => {
              const salesperson = formatSalespersons(u.salesperson, '、', '未知')
              return `${u.unitId}(${salesperson})`
            }).join('、')
            text += `${status}:${unitDetails}\n`
          }
        })
      } else {
        // 若無成交戶別，顯示(無)
        text += `戶別狀況(無)\n`
      }
      text += `\n`
    }
  }

  // 累計退戶
  if (statistics.value.households.byStatus['退戶']) {
    const cancelledCount = statistics.value.households.byStatus['退戶'] || 0
    const cancelledAmount = statistics.value.households.byStatusAmount['退戶'] || 0
    text += `累計退戶戶數：${cancelledCount}戶 (- ${formatAmount(cancelledAmount)}萬)\n`
  }

  text += `\n`

  // 累計已售
  text += `累計已售戶數：${statistics.value.households.sold}戶 (${formatAmount(soldHouseholdAmount)}萬)\n`
  text += `累計已售車位：${statistics.value.parkings.sold}個 (${formatAmount(soldParkingAmount)}萬)\n`
  text += `累計已售總銷：${formatAmount(totalSoldAmount)}萬 (${calculatePercentage(totalSoldAmount, totalAllAmount)}%)\n`

  // 總數
  text += `\n總戶數：${statistics.value.households.total}戶 (${formatAmount(totalHouseholdAmount)}萬)\n`
  text += `總車位：${statistics.value.parkings.total}個 (${formatAmount(totalParkingAmount)}萬)\n`
  text += `總銷：${formatAmount(totalAllAmount)}萬`

  return text
}

/**
 * 複製完整文本到剪貼板
 */
const copyToClipboard = async () => {
  try {
    const text = generateStatisticsText()
    await navigator.clipboard.writeText(text)

    // 顯示複製成功提示
    const originalText = copyButtonText.value
    copyButtonText.value = '已複製！'
    setTimeout(() => {
      copyButtonText.value = originalText
    }, 2000)
  } catch (err) {
    console.error('複製失敗:', err)
  }
}

/**
 * 複製簡易文本到剪貼板
 */
const copySimpleText = async () => {
  try {
    const text = generateSimpleText()
    await navigator.clipboard.writeText(text)

    // 顯示複製成功提示
    const originalText = copySimpleButtonText.value
    copySimpleButtonText.value = '已複製！'
    setTimeout(() => {
      copySimpleButtonText.value = originalText
    }, 2000)
  } catch (err) {
    console.error('複製失敗:', err)
  }
}

const copyButtonText = ref('複製完整文本')
const copySimpleButtonText = ref('複製簡易文本')

/**
 * 複製預覽對話框
 */
const copyPreviewDialog = ref({
  show: false,
  text: '',
  type: '', // 'full' or 'simple'
})

/**
 * 顯示複製預覽對話框
 */
const showCopyDialog = (type) => {
  if (type === 'full') {
    copyPreviewDialog.value.text = generateStatisticsText()
  } else {
    copyPreviewDialog.value.text = generateSimpleText()
  }
  copyPreviewDialog.value.type = type
  copyPreviewDialog.value.show = true
}

/**
 * 確認並複製文本
 */
const confirmCopy = async () => {
  try {
    await navigator.clipboard.writeText(copyPreviewDialog.value.text)

    // 顯示複製成功提示
    const originalText = copyPreviewDialog.value.type === 'full' ? copyButtonText.value : copySimpleButtonText.value
    if (copyPreviewDialog.value.type === 'full') {
      copyButtonText.value = '已複製！'
      setTimeout(() => {
        copyButtonText.value = originalText
      }, 2000)
    } else {
      copySimpleButtonText.value = '已複製！'
      setTimeout(() => {
        copySimpleButtonText.value = originalText
      }, 2000)
    }

    // 關閉預覽對話框
    copyPreviewDialog.value.show = false
  } catch (err) {
    console.error('複製失敗:', err)
  }
}

const projectData = computed(() => {
  return salesDataStore.getProjectData(props.projectId)
})

/**
 * 狀態顏色對應表（來自參數或預設值）
 */
const statusColorMap = computed(() => {
  const map = {}
  const parameters = projectData.value.parameters || []

  parameters.forEach(p => {
    if (p.statusName && p.colorCode) {
      map[p.statusName] = p.colorCode
    }
  })

  return map
})

/**
 * 取得目前期間的日期範圍（累計為 null；自訂期間結束日設為當天 23:59:59）
 */
const buildDateRange = () => {
  if (selectedPeriod.value === 'custom') {
    const start = new Date(customDateRange.value.start)
    const end = new Date(customDateRange.value.end)
    end.setHours(23, 59, 59, 999)
    return { start, end }
  }
  return getDateRange(selectedPeriod.value)
}

/**
 * 套用來人概況：以快取的後端原始資料 + 目前期間重新計算
 */
const applyVipGuests = () => {
  const list = remoteRaw.vipGuests
  if (!list || !statistics.value) {
    vipGuestStats.value = null
    return
  }
  vipGuestStats.value = calculateVipGuestStats(list, buildDateRange())
}

/**
 * 套用退戶統計：以快取的後端原始資料 + 目前期間重新計算，並合併進人員排行與銷況明細
 */
const applyCancelled = () => {
  const cancelledList = remoteRaw.cancelledList
  if (!cancelledList || !statistics.value) {
    cancelledStats.value = null
    return
  }
  const dateRange = buildDateRange()

  // 過濾落在期間內的退戶（cancellationDate 格式：{ _seconds, _nanoseconds }）
  const filtered = (dateRange == null)
    ? cancelledList
    : cancelledList.filter(item => {
        if (!item.cancellationDate?._seconds) return false
        const d = new Date(item.cancellationDate._seconds * 1000)
        return d >= dateRange.start && d <= dateRange.end
      })

  // 成交總金額（房屋成交價 + 各車位成交價）
  const unitTotal = (item) =>
    (Number(item.price_transaction_house) || 0) +
    (item.parkingDetails || []).reduce((s, p) => s + (Number(p.price_transaction) || 0), 0)
  const totalAmount = filtered.reduce((sum, item) => sum + unitTotal(item), 0)

  // 按業務員分組計算退戶數（複選：平均分配制，一戶 N 人各分攤 1/N）
  const byPersonnel = {}
  filtered.forEach(item => {
    const persons = normalizeSalespersons(item.salesperson)
    if (persons.length === 0) {
      byPersonnel['未知'] = (byPersonnel['未知'] || 0) + 1
      return
    }
    const share = salespersonShare(item.salesperson)
    persons.forEach(p => {
      byPersonnel[p] = (byPersonnel[p] || 0) + share
    })
  })

  cancelledStats.value = { count: filtered.length, amount: totalAmount, byPersonnel }

  // 合併進銷售人員排行（以本地計算的原始名單為基底）
  const merged = basePersonnel.map(person => ({
    ...person,
    cancelledCount: byPersonnel[person.name] || 0,
  }))
  const existingNames = new Set(merged.map(p => p.name))
  const systemNames = new Set((projectData.value.personnel || []).map(p => p.name))
  Object.entries(byPersonnel).forEach(([name, count]) => {
    if (existingNames.has(name)) return
    // 只有退戶、無成交且不在排行名單內的人員也要列出（可能不在系統名單）
    merged.push({
      name,
      inSystem: systemNames.has(name),
      soldCount: 0,
      totalAmount: 0,
      premiumAmount: 0,
      householdCount: 0,
      byStatus: {},
      byStatusAmount: {},
      cancelledCount: count,
    })
  })
  statistics.value.personnel = merged

  // 合併進銷況明細（有退戶才列出，避免顯示「退戶 0戶」）
  const h = statistics.value.households
  delete h.byStatus['退戶']
  delete h.byStatusAmount['退戶']
  delete h.byStatusUnits['退戶']
  if (filtered.length > 0) {
    h.byStatus['退戶'] = filtered.length
    h.byStatusAmount['退戶'] = totalAmount
    h.byStatusUnits['退戶'] = filtered.map(item => ({
      unitId: item.unitId,
      unitName: item.unitName || item.unitId,
      price_transaction_total: unitTotal(item),
      price_transaction_house: item.price_transaction_house || 0,
      area_house_ping: item.area_house_ping || 0,
      salesperson: formatSalespersons(item.salesperson, '、', '—'),
      isCancelled: true,
      cancelReasons: Array.isArray(item.cancelReasons) ? item.cancelReasons : [],
      cancellationDate: item.cancellationDate?._seconds
        ? formatDate(new Date(item.cancellationDate._seconds * 1000))
        : '',
      cancelRemarks: item.remarks || '',
      operatorName: item._cancellationMeta?.operatorName || '',
      buyerName: item.buyerName || '',
    }))
  }
}

/**
 * 查詢後端資料（來人概況 + 退戶）
 * Why: 這是統計面板唯一需要等待的部分（兩支 Cloud Function、可能冷啟動）。
 *      兩支並行發出、各自回來就套用，不再串行等待，也不阻擋本地統計顯示。
 */
const fetchRemote = (pid) => {
  const token = { pid }
  remoteToken = token
  remoteRaw = { projectId: pid, vipGuests: null, cancelledList: null }
  isVisitorsLoading.value = true
  isCancelledLoading.value = true

  fetchVipGuests(pid)
    .then(list => (Array.isArray(list) ? list : []))
    .catch(err => {
      console.error('[AnalyticsPanel] 來人概況查詢失敗:', err)
      return null
    })
    .then(list => {
      if (remoteToken !== token) return
      remoteRaw.vipGuests = list
      isVisitorsLoading.value = false
      applyVipGuests()
    })

  getCancelledPurchases(pid, false)
    .then(result => {
      if (result?.status === 'success' && Array.isArray(result.data)) {
        return result.data.filter(item => !item.isDeleted)
      }
      console.error('[AnalyticsPanel] 退戶資料查詢失敗:', result?.message)
      return null
    })
    .catch(err => {
      console.error('[AnalyticsPanel] 退戶資料查詢失敗:', err)
      return null
    })
    .then(list => {
      if (remoteToken !== token) return
      remoteRaw.cancelledList = list
      isCancelledLoading.value = false
      applyCancelled()
    })
}

/**
 * 載入統計數據
 * - 本地統計（戶別／車位／人員）同步計算，立即顯示
 * - 後端資料只在開啟面板、手動重新載入、切換建案時重新查詢；切換期間直接沿用快取重算
 */
const loadStatistics = ({ refetchRemote = false } = {}) => {
  isLoading.value = true
  error.value = null
  try {
    const pd = projectData.value
    if (!pd.households || pd.households.length === 0) {
      error.value = '尚無戶別資料'
      statistics.value = null
      vipGuestStats.value = null
      cancelledStats.value = null
      return
    }

    const dateRange = buildDateRange()
    const households = pd.households || []
    const parkings = pd.parkings || []
    basePersonnel = calculatePersonnelStats(households, parkings, pd.personnel || [], dateRange)
    statistics.value = {
      period: selectedPeriod.value,
      dateRange,
      households: calculateHouseholdStats(households, dateRange),
      parkings: calculateParkingStats(parkings, households, dateRange),
      personnel: basePersonnel,
    }
  } catch (err) {
    console.error('[AnalyticsPanel] 統計計算失敗:', err)
    error.value = err.message || '統計計算失敗'
    statistics.value = null
    vipGuestStats.value = null
    cancelledStats.value = null
    return
  } finally {
    isLoading.value = false
  }

  const pid = props.projectId
  if (refetchRemote || remoteRaw.projectId !== pid) {
    fetchRemote(pid)
  } else {
    applyVipGuests()
    applyCancelled()
  }
}

/**
 * 時間粒度變更
 */
const handlePeriodChange = (newPeriod) => {
  selectedPeriod.value = newPeriod
  loadStatistics()
}

/**
 * 自訂日期範圍變更
 */
const handleCustomDateRange = (dateRange) => {
  customDateRange.value = dateRange
  loadStatistics()
}

/**
 * 關閉對話框
 */
const close = () => {
  emit('update:show', false)
}

/**
 * 打開單位詳細信息modal
 */
const openUnitDetail = (unit, status) => {
  // 📌 退戶：開啟「退戶資訊」而非「戶別資訊」
  if (status === '退戶' || unit?.isCancelled) {
    cancelledDetail.value = unit
    showCancelledModal.value = true
    return
  }

  // 📌 從projectData.households中查找完整的單位數據
  const completeUnitData = projectData.value.households?.find(h => h.unitId === unit.unitId)

  if (completeUnitData) {
    selectedUnitData.value = completeUnitData
    console.log('[AnalyticsPanel] 打開UnitDetailModal:', {
      unitId: completeUnitData.unitId,
      hasData: !!completeUnitData,
      dataKeys: Object.keys(completeUnitData).slice(0, 10),
    })
  } else {
    console.warn('[AnalyticsPanel] 未找到完整的單位數據:', unit.unitId)
  }

  showUnitModal.value = true
}

/**
 * 取得資料區間文字（YYYY/MM/DD~YYYY/MM/DD）
 */
const getReportDateRange = () => {
  const dr = statistics.value?.dateRange
  if (dr?.start && dr?.end) {
    const start = formatDate(dr.start)
    const end = formatDate(dr.end)
    return start === end ? start : `${start}~${end}`
  }
  if (dr?.start) return formatDate(dr.start)
  return getPeriodLabel() || '全部期間'
}

/**
 * 構建報告頭部（標題 + 建案資訊 + 警語 + 提醒）
 */
const buildReportHeader = (projectName, dateRange) => {
  return `客戶狀況彙整報告
建案名稱：${projectName}
資料區間：${dateRange}

【AI 分析提醒】
本報告由 AI 自動分析生成，內容難免存在誤差，僅供參考使用，請結合實際業務情況審慎判斷。
資料填寫越完整，AI 分析越精準 — 建議完整記錄客戶互動內容、購屋疑慮、客戶評等與後續追蹤狀態，有助於後續報告產出更具洞察力的建議。

────────────────────────────────────

`
}

/**
 * 分析客戶狀況
 */
const analyzeCustomers = async () => {
  if (!vipGuestStats.value?.details?.length) return

  isAnalyzing.value = true
  try {
    const guests = vipGuestStats.value.details
    const currentProject = props.availableProjects.find(p => p.id === props.projectId)
    const projectName = currentProject?.name || projectData.value.project?.name || '專案'

    const result = await analyzeCustomerStatus({
      guests,
      periodLabel: getPeriodLabel(),
      projectName,
      projectId: props.projectId,  // ← 傳入 projectId，讓 CF 讀取知識庫
    })

    const header = buildReportHeader(projectName, getReportDateRange())
    analysisReport.value = header + (result.data.report || '')
    showAnalysisDialog.value = true
  } catch (e) {
    console.error('[分析失敗]', e)
    error.value = '客戶狀況分析失敗，請稍後再試'
  } finally {
    isAnalyzing.value = false
  }
}

/**
 * 複製分析報告
 */
const copyAnalysisReport = async () => {
  try {
    await navigator.clipboard.writeText(analysisReport.value)
    analysisCopied.value = true
    setTimeout(() => {
      analysisCopied.value = false
    }, 2000)
  } catch (e) {
    console.error('[複製失敗]', e)
  }
}

/**
 * 解析報告文本，轉換為 HTML 格式（用於 PNG）
 */
const renderReportHtml = (reportText) => {
  const lines = reportText.split('\n')
  const html = lines.map(line => {
    const trimmed = line.trim()
    if (!trimmed) return '<br />'

    // 主標題：客戶狀況彙整報告
    if (trimmed === '客戶狀況彙整報告') {
      return `<h1 style="font-size: 22px; font-weight: bold; margin: 0 0 12px 0; padding-bottom: 8px; border-bottom: 2px solid #1976d2; color: #1a1a1a; text-align: center;">${trimmed}</h1>`
    }

    // 建案資訊行：建案名稱 / 資料區間
    if (/^(建案名稱|資料區間)：/.test(trimmed)) {
      return `<p style="margin: 2px 0; font-size: 13px; color: #555; text-align: center;">${trimmed}</p>`
    }

    // 區塊副標題：以【】包覆
    if (/^【.+】$/.test(trimmed)) {
      return `<h3 style="font-size: 14px; font-weight: bold; margin: 12px 0 6px 0; padding: 6px 10px; background: #fff3e0; border-left: 4px solid #fb8c00; color: #e65100;">${trimmed}</h3>`
    }

    // 分隔線
    if (/^[─━—-]{6,}$/.test(trimmed)) {
      return `<hr style="border: none; border-top: 1px dashed #bbb; margin: 14px 0;" />`
    }

    // 大標題：以「一、」「二、」等開頭
    if (/^[一二三四五六七八九十]+[、]/.test(trimmed)) {
      return `<h2 style="font-size: 16px; font-weight: bold; margin-top: 16px; margin-bottom: 8px; color: #1a1a1a;">${trimmed}</h2>`
    }

    // 條列：以數字或 ･ 開頭
    if (/^\d+[.]/.test(trimmed) || /^[･]/.test(trimmed)) {
      return `<p style="margin-left: 24px; margin-bottom: 4px; line-height: 1.6;">${trimmed}</p>`
    }

    // 一般段落
    return `<p style="margin-bottom: 4px; line-height: 1.6;">${trimmed}</p>`
  }).join('')

  return html
}

/**
 * 解析報告文本為 docx Paragraph 陣列
 */
const parseReportToParagraphs = (reportText, docx) => {
  const { Paragraph, TextRun, HeadingLevel, AlignmentType } = docx
  const lines = reportText.split('\n')
  const paragraphs = []

  lines.forEach(line => {
    const trimmed = line.trim()
    if (!trimmed) {
      paragraphs.push(new Paragraph({ text: '' }))
      return
    }

    // 主標題：客戶狀況彙整報告
    if (trimmed === '客戶狀況彙整報告') {
      paragraphs.push(new Paragraph({
        children: [new TextRun({ text: trimmed, bold: true, size: 36 })],
        alignment: AlignmentType.CENTER,
        spacing: { before: 100, after: 200 }
      }))
      return
    }

    // 建案資訊行：建案名稱 / 資料區間
    if (/^(建案名稱|資料區間)：/.test(trimmed)) {
      paragraphs.push(new Paragraph({
        children: [new TextRun({ text: trimmed, size: 22, color: '555555' })],
        alignment: AlignmentType.CENTER,
        spacing: { after: 60 }
      }))
      return
    }

    // 區塊副標題：以【】包覆
    if (/^【.+】$/.test(trimmed)) {
      paragraphs.push(new Paragraph({
        children: [new TextRun({ text: trimmed, bold: true, size: 24, color: 'E65100' })],
        spacing: { before: 200, after: 80 }
      }))
      return
    }

    // 分隔線
    if (/^[─━—-]{6,}$/.test(trimmed)) {
      paragraphs.push(new Paragraph({
        text: '',
        border: { bottom: { color: 'BBBBBB', space: 1, style: 'dashed', size: 6 } },
        spacing: { before: 100, after: 100 }
      }))
      return
    }

    // 大標題：以「一、」「二、」等開頭
    if (/^[一二三四五六七八九十]+[、]/.test(trimmed)) {
      paragraphs.push(new Paragraph({
        text: trimmed,
        heading: HeadingLevel.HEADING_1,
        spacing: { before: 200, after: 100 }
      }))
      return
    }

    // 條列：以數字或 ･ 開頭
    if (/^\d+[.]/.test(trimmed) || /^[･]/.test(trimmed)) {
      paragraphs.push(new Paragraph({
        text: trimmed,
        indent: { firstLine: 0, left: 360 },
        spacing: { after: 50 }
      }))
      return
    }

    // 一般段落
    paragraphs.push(new Paragraph({
      text: trimmed,
      spacing: { after: 50 }
    }))
  })

  return paragraphs
}

/**
 * 下載報告為 PNG
 */
const downloadPng = async () => {
  isDownloadingPng.value = true
  try {
    const [{ default: html2canvas }, { saveAs }] = await Promise.all([
      import('html2canvas'),
      import('file-saver'),
    ])

    // 建立 A4 容器（794px × 1123px @ 96dpi）
    const container = document.createElement('div')
    container.style.cssText = `
      width: 794px;
      min-height: 1123px;
      padding: 60px;
      background: white;
      font-family: 'Noto Sans TC', 'Microsoft JhengHei', sans-serif;
      font-size: 14px;
      line-height: 1.8;
      color: #1a1a1a;
      position: fixed;
      left: -9999px;
      top: 0;
      box-sizing: border-box;
    `
    container.innerHTML = renderReportHtml(analysisReport.value)
    document.body.appendChild(container)

    const canvas = await html2canvas(container, {
      scale: 2,
      useCORS: true,
      backgroundColor: '#ffffff'
    })
    document.body.removeChild(container)

    const projectName = projectData.value.project?.name || '專案'
    canvas.toBlob(blob => {
      saveAs(blob, `${projectName}_客戶狀況彙整_${getPeriodLabel()}_${new Date().toISOString().slice(0, 10)}.png`)
    })
  } catch (e) {
    console.error('[PNG 下載失敗]', e)
    error.value = 'PNG 下載失敗，請稍後再試'
  } finally {
    isDownloadingPng.value = false
  }
}

/**
 * 下載報告為 DOCX
 */
const downloadDocx = async () => {
  isDownloadingDocx.value = true
  try {
    const [docx, { saveAs }] = await Promise.all([import('docx'), import('file-saver')])
    const { Document, Packer } = docx
    const paragraphs = parseReportToParagraphs(analysisReport.value, docx)

    const doc = new Document({
      sections: [{
        properties: {
          page: {
            size: {
              width: 11906,  // A4 寬度（1/20mm）
              height: 16838  // A4 高度（1/20mm）
            }
          },
          margin: {
            top: 1134,      // 2cm
            bottom: 1134,
            left: 1134,
            right: 1134
          }
        },
        children: paragraphs
      }]
    })

    const projectName = projectData.value.project?.name || '專案'
    const blob = await Packer.toBlob(doc)
    saveAs(blob, `${projectName}_客戶狀況彙整_${getPeriodLabel()}_${new Date().toISOString().slice(0, 10)}.docx`)
  } catch (e) {
    console.error('[DOCX 下載失敗]', e)
    error.value = 'DOCX 下載失敗，請稍後再試'
  } finally {
    isDownloadingDocx.value = false
  }
}

/**
 * 面板開啟：重新計算本地統計，並重新查詢後端資料
 */
watch(
  () => props.show,
  (newVal) => {
    if (newVal) loadStatistics({ refetchRemote: true })
  }
)

/**
 * 切換建案：重新計算並重新查詢後端資料
 */
watch(
  () => props.projectId,
  () => {
    if (props.show) loadStatistics({ refetchRemote: true })
  }
)
</script>

<style scoped>
.analytics-dialog {
  max-height: 100vh;
  overflow-y: auto;
  background: #f5f7fa;
}

/* ===== Header ===== */
.analytics-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  min-height: 48px;
  padding: 6px 12px 6px 16px;
  background: #ffffff;
  border-bottom: 1px solid #e8eaed;
  position: sticky;
  top: 0;
  z-index: 3;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}

.header-title {
  font-size: 16px;
  font-weight: 700;
  color: #1a1a1a;
  white-space: nowrap;
}

.header-project {
  font-size: 12.5px;
  font-weight: 600;
  color: #1565c0;
  background: #e3f2fd;
  border-radius: 999px;
  padding: 2px 10px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 40vw;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 2px;
}

/* ===== 左右配置 ===== */
.analytics-layout {
  display: flex;
  align-items: stretch;
  min-height: calc(100vh - 48px);
  background: #f5f7fa;
}

.analytics-sidebar {
  width: 208px;
  flex-shrink: 0;
  background: #ffffff;
  border-right: 1px solid #e8eaed;
  padding: 12px 10px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  position: sticky;
  top: 48px;
  align-self: flex-start;
  max-height: calc(100vh - 48px);
  overflow-y: auto;
  min-height: calc(100vh - 48px);
}

.sidebar-nav {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  padding: 8px 10px;
  border: none;
  border-radius: 8px;
  background: transparent;
  font-size: 13.5px;
  font-weight: 600;
  color: #444;
  cursor: pointer;
  text-align: left;
  font-family: inherit;
  transition: background 0.15s ease, color 0.15s ease;
}

.nav-item:hover {
  background: #f0f4fa;
}

.nav-item--active {
  background: #e3f2fd;
  color: #1565c0;
}

.nav-icon {
  flex-shrink: 0;
}

.nav-label {
  flex: 1;
  white-space: nowrap;
}

.nav-badge {
  font-size: 11px;
  font-weight: 700;
  background: #eceff1;
  color: #555;
  border-radius: 10px;
  padding: 1px 7px;
  flex-shrink: 0;
  line-height: 1.5;
}

.nav-item--active .nav-badge {
  background: #1565c0;
  color: #ffffff;
}

.nav-spinner {
  flex-shrink: 0;
  color: #1565c0;
}

.sidebar-actions {
  margin-top: auto;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.copy-btn {
  font-size: 12.5px !important;
  letter-spacing: 0;
}

.analytics-content {
  flex: 1;
  min-width: 0;
  position: relative;
  background: #f5f7fa;
  padding: 12px 16px 24px;
}

.content-section {
  max-width: 1100px;
}

/* ===== 期間列 ===== */
.period-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px 12px;
  flex-wrap: wrap;
  padding: 6px 10px;
  background: #ffffff;
  border: 1px solid #e8eaed;
  border-radius: 10px;
  margin-bottom: 10px;
}

.period-range {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 12.5px;
  font-weight: 600;
  color: #1565c0;
  background: #e3f2fd;
  border-radius: 999px;
  padding: 4px 10px;
  white-space: nowrap;
}

/* ===== 後端載入提示（非阻擋） ===== */
.remote-loading {
  margin-bottom: 10px;
}

.remote-loading-text {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: #1565c0;
  margin-top: 4px;
}

.inline-loading {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 14px 12px;
  background: #ffffff;
  border: 1px dashed #c5d3e6;
  border-radius: 10px;
  font-size: 13px;
  color: #555;
}

/* ===== 區塊標題 ===== */
.section-title {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  font-weight: 700;
  color: #1a1a1a;
  padding-bottom: 6px;
  margin-bottom: 10px;
  border-bottom: 2px solid #1976d2;
}

.section-hint {
  font-size: 12px;
  font-weight: 500;
  color: #888;
  margin-left: 4px;
}

.empty-hint {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 18px 12px;
  color: #888;
  font-size: 13px;
  background: #ffffff;
  border: 1px dashed #dfe3e8;
  border-radius: 10px;
}

/* ===== 整體總銷總覽 ===== */
.sales-overview {
  background: linear-gradient(135deg, #f5f9ff 0%, #ffffff 100%);
  border: 1px solid #d6e4f5;
  border-left: 4px solid #1976d2;
  border-radius: 10px;
  padding: 10px 14px;
  margin-bottom: 10px;
}

.overview-header {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: 8px;
  flex-wrap: wrap;
  margin-bottom: 6px;
}

.overview-title {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 13px;
  font-weight: 700;
  color: #1a1a1a;
}

.overview-total {
  font-size: 22px;
  font-weight: 800;
  color: #1976d2;
  letter-spacing: -0.5px;
  line-height: 1.1;
}

.overview-total small {
  font-size: 12px;
  font-weight: 600;
  color: #5f6b7a;
  margin-left: 2px;
}

.overview-progress {
  margin-bottom: 8px;
}

.progress-track {
  height: 10px;
  border-radius: 5px;
  background: #ffe0b2;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #43a047, #66bb6a);
  border-radius: 5px;
  transition: width 0.6s ease;
}

.progress-caption {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  font-weight: 600;
  color: #666;
  margin-top: 4px;
}

.progress-pct {
  color: #2e7d32;
  font-weight: 800;
}

.overview-split {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
}

.overview-item {
  border-radius: 8px;
  padding: 8px 10px;
  background: #ffffff;
  border: 1px solid #e8eaed;
  min-width: 0;
}

.overview-item--sold { border-top: 3px solid #2e7d32; }
.overview-item--unsold { border-top: 3px solid #ff9800; }
.overview-item--premium { border-top: 3px solid #6a1b9a; }

.item-label {
  font-size: 11.5px;
  font-weight: 700;
  color: #666;
  margin-bottom: 2px;
}

.item-amount {
  font-size: 17px;
  font-weight: 800;
  letter-spacing: -0.3px;
  line-height: 1.2;
  white-space: nowrap;
}

.item-amount small {
  font-size: 11px;
  font-weight: 600;
  color: #5f6b7a;
  margin-left: 2px;
}

.item-amount--sold { color: #2e7d32; }
.item-amount--unsold { color: #ef6c00; }

.item-meta {
  font-size: 11.5px;
  color: #666;
  margin-top: 3px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* ===== 銷售狀況統計表 ===== */
.stat-table {
  background: #ffffff;
  border: 1px solid #e8eaed;
  border-radius: 10px;
  overflow: hidden;
}

.stat-row {
  display: grid;
  grid-template-columns: 150px repeat(4, minmax(0, 1fr));
  align-items: center;
  border-bottom: 1px solid #eef1f5;
  border-left: 4px solid transparent;
}

.stat-row:last-child {
  border-bottom: none;
}

.stat-row--head {
  background: #f7f9fc;
  border-left-color: transparent;
}

.stat-row--head .stat-cell {
  font-size: 12px;
  font-weight: 700;
  color: #5f6b7a;
  padding: 7px 12px;
  letter-spacing: 0.3px;
}

.stat-row--period { border-left-color: #1565c0; }
.stat-row--cancelled { border-left-color: #d32f2f; background: #fffafa; }
.stat-row--sold { border-left-color: #2e7d32; }
.stat-row--unsold { border-left-color: #ff9800; }
.stat-row--total { border-left-color: #1976d2; background: #fafcff; }

.stat-cell {
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: 8px 12px;
  min-width: 0;
  min-height: 48px;
}

.stat-cell--label {
  flex-direction: row;
  align-items: center;
  gap: 6px;
  font-size: 13.5px;
  font-weight: 700;
  color: #1a1a1a;
  white-space: nowrap;
}

.stat-row--cancelled .stat-cell--label { color: #c62828; }

.cell-main {
  font-size: 17px;
  font-weight: 800;
  color: #1a1a1a;
  line-height: 1.2;
  letter-spacing: -0.3px;
  white-space: nowrap;
}

.cell-main small {
  font-size: 11px;
  font-weight: 600;
  color: #5f6b7a;
  margin-left: 2px;
}

.cell-main--amount { color: #1976d2; }

.stat-row--period .cell-main { color: #1565c0; }
.stat-row--sold .cell-main { color: #2e7d32; }
.stat-row--unsold .cell-main { color: #ef6c00; }
.stat-row--cancelled .cell-main { color: #d32f2f; }

.cell-main--premium { font-size: 15px; }
.premium-pos { color: #2e7d32 !important; }
.premium-neg { color: #d32f2f !important; }
.premium-zero { color: #888 !important; }

.cell-sub {
  font-size: 11.5px;
  font-weight: 600;
  color: #6b7785;
  margin-top: 1px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.cell-empty {
  font-size: 13px;
  color: #b0b8c1;
}

.stat-note {
  font-size: 11.5px;
  color: #8a94a0;
  margin-top: 6px;
  padding-left: 4px;
}

/* ===== 來人概況 ===== */
.metric-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
}

.list-toggle {
  display: flex;
  align-items: center;
  gap: 6px;
  width: 100%;
  padding: 8px 10px;
  background: #ffffff;
  border: 1px solid #e8eaed;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 600;
  color: #333;
  cursor: pointer;
  text-align: left;
  font-family: inherit;
}

.list-toggle:hover {
  background: #f5f8ff;
}

.interaction-item {
  margin-bottom: 8px;
  padding: 8px 10px;
  background: #f8f9fa;
  border-radius: 8px;
  border-left: 3px solid #1976d2;
}

.interaction-content {
  white-space: pre-wrap;
  line-height: 1.6;
  color: #555;
}

/* ===== 銷況明細 ===== */
.status-detail-text {
  font-weight: 700;
  font-size: 14px;
  color: #1a1a1a;
}

.status-detail-amount {
  font-weight: 600;
  font-size: 12.5px;
  color: #5f6b7a;
  margin-left: 2px;
}

.status-detail-text.cancelled-status {
  color: #d32f2f;
}

:deep(.cancelled-panel) {
  border-left: 4px solid #d32f2f;
}

:deep(.cancelled-panel .v-expansion-panel-title) {
  background-color: #fff5f5 !important;
}

.units-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 8px;
}

.unit-item {
  display: flex;
  align-items: center;
  padding: 8px 10px;
  background: #ffffff;
  border: 1px solid #e8eaed;
  border-radius: 6px;
  font-size: 13px;
  transition: background 0.15s ease, border-color 0.15s ease, box-shadow 0.15s ease;
  cursor: pointer;
}

.unit-item:hover {
  background: #f0f7ff;
  border-color: #1976d2;
  box-shadow: 0 2px 8px rgba(25, 118, 210, 0.15);
}

.unit-info {
  font-weight: 600;
  color: #1a1a1a;
  word-break: break-word;
}

.cancelled-unit-item {
  /* 退戶資訊量較大，獨占整列並改為垂直堆疊 */
  grid-column: 1 / -1;
  flex-direction: column;
  align-items: stretch;
  gap: 6px;
  padding: 10px 12px;
  border-left: 4px solid #d32f2f;
  background: #fff5f5;
  border-color: #ef9a9a;
}

.cancelled-unit-item .unit-info {
  color: #b71c1c;
}

.cancelled-unit-item:hover {
  background: #ffebee;
  border-color: #d32f2f;
  box-shadow: 0 2px 8px rgba(211, 47, 47, 0.15);
}

.cancelled-reason-text {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 6px;
  padding: 6px 8px;
  background: #ffffff;
  border: 1px dashed #ef9a9a;
  border-radius: 8px;
  line-height: 1.5;
}

.cancelled-reason-text .reason-label {
  flex: none;
  font-size: 0.7rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  color: #fff;
  background: #d32f2f;
  padding: 2px 8px;
  border-radius: 999px;
}

.cancelled-reason-text .reason-value {
  font-size: 0.85rem;
  font-weight: 600;
  color: #b71c1c;
  word-break: break-word;
}

:deep(.v-expansion-panels) {
  background: #ffffff;
  border-radius: 10px;
  border: 1px solid #e8eaed;
}

:deep(.v-expansion-panel) {
  border: none;
  border-bottom: 1px solid #f0f0f0;
}

:deep(.v-expansion-panel:last-child) {
  border-bottom: none;
}

:deep(.v-expansion-panel-title) {
  padding: 10px 14px;
  min-height: 44px;
  font-weight: 600;
  font-size: 14px;
}

:deep(.v-expansion-panel-title:hover) {
  background: #f8f9fa;
}

:deep(.v-expansion-panel--active > .v-expansion-panel-title) {
  background: #f0f7ff;
  min-height: 44px;
}

:deep(.v-expansion-panel-text__wrapper) {
  padding: 10px 14px 12px;
  background: #fafbfc;
}

/* ===== 複製預覽 ===== */
.preview-content {
  background: #f5f5f5;
  border-radius: 6px;
  padding: 12px;
  max-height: 60vh;
  overflow-y: auto;
}

.preview-content pre {
  margin: 0;
  white-space: pre-wrap;
  word-break: break-word;
  font-family: 'Courier New', monospace;
  font-size: 12px;
  line-height: 1.5;
  color: #333;
}

/* ===== 手機/平板：上下配置，導覽變為水平膠囊列 ===== */
@media (max-width: 959px) {
  .analytics-layout {
    flex-direction: column;
    min-height: 0;
  }

  .analytics-sidebar {
    width: 100%;
    position: sticky;
    top: 48px;
    z-index: 2;
    max-height: none;
    min-height: 0;
    overflow: visible;
    border-right: none;
    border-bottom: 1px solid #e8eaed;
    padding: 8px 10px;
    gap: 8px;
  }

  .sidebar-nav {
    flex-direction: row;
    overflow-x: auto;
    gap: 6px;
    -webkit-overflow-scrolling: touch;
    scrollbar-width: none;
  }

  .sidebar-nav::-webkit-scrollbar {
    display: none;
  }

  .nav-item {
    width: auto;
    flex-shrink: 0;
    padding: 6px 12px;
    border-radius: 20px;
    background: #f5f7fa;
    font-size: 13px;
    gap: 5px;
  }

  .nav-item--active {
    background: #1565c0;
    color: #ffffff;
  }

  .nav-item--active .nav-badge {
    background: rgba(255, 255, 255, 0.25);
    color: #ffffff;
  }

  .nav-item--active .nav-spinner {
    color: #ffffff;
  }

  .sidebar-actions {
    margin-top: 0;
    flex-direction: row;
  }

  .sidebar-actions .copy-btn {
    flex: 1;
  }

  .analytics-content {
    padding: 10px 10px 24px;
  }

  .stat-row {
    grid-template-columns: 120px repeat(4, minmax(0, 1fr));
  }

  .stat-cell {
    padding: 8px 8px;
  }
}

@media (max-width: 599px) {
  .header-project {
    display: none;
  }

  .overview-split {
    grid-template-columns: 1fr;
  }

  .overview-item {
    display: grid;
    grid-template-columns: auto 1fr;
    grid-template-areas: 'label amount' 'meta meta';
    column-gap: 8px;
    align-items: baseline;
  }

  .overview-item .item-label { grid-area: label; margin-bottom: 0; }
  .overview-item .item-amount { grid-area: amount; text-align: right; }
  .overview-item .item-meta { grid-area: meta; margin-top: 2px; }

  /* 統計表改為每列一張卡：標題 + 2x2 格 */
  .stat-row--head {
    display: none;
  }

  .stat-row {
    grid-template-columns: 1fr 1fr;
    padding: 6px 8px 8px;
    gap: 2px 8px;
  }

  .stat-cell--label {
    grid-column: 1 / -1;
    min-height: 0;
    padding: 4px 4px 2px;
    font-size: 13px;
  }

  .stat-cell {
    min-height: 0;
    padding: 4px 4px;
    background: #f7f9fc;
    border-radius: 6px;
  }

  .stat-row--cancelled .stat-cell:not(.stat-cell--label),
  .stat-row--total .stat-cell:not(.stat-cell--label) {
    background: #ffffff;
    border: 1px solid #eef1f5;
  }

  .stat-cell:not(.stat-cell--label)::before {
    content: attr(data-label);
    font-size: 10.5px;
    font-weight: 700;
    color: #8a94a0;
    letter-spacing: 0.3px;
  }

  .cell-main {
    font-size: 15px;
  }

  .metric-grid {
    grid-template-columns: repeat(3, 1fr);
    gap: 6px;
  }
}
</style>
