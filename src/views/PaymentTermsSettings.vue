<template>
  <v-card class="pa-4 pt-root" elevation="2">
    <v-card-title class="text-h5 text-green-darken-2">
      期款方式範本設定
    </v-card-title>
    <v-card-subtitle>管理不同合約類型的付款期款計算範本與公司借貸方案</v-card-subtitle>

    <v-tabs v-model="activeTab" color="green-darken-2" class="mt-2">
      <v-tab value="payment">
        <v-icon start>mdi-format-list-numbered</v-icon>期款範本
      </v-tab>
      <v-tab value="loan">
        <v-icon start>mdi-bank-outline</v-icon>公司借貸範本
      </v-tab>
    </v-tabs>
    <v-divider></v-divider>

    <v-window v-model="activeTab" class="pt-window">
      <!-- ============ Tab 1：期款範本 ============ -->
      <v-window-item value="payment">
        <v-skeleton-loader v-if="templatesLoading" type="list-item-two-line@5" class="mt-4"></v-skeleton-loader>

        <div v-else :class="['pt-layout', mdAndUp && 'pt-layout--split']">
          <!-- 左：範本清單（手機為第一層頁面） -->
          <aside v-show="mdAndUp || mobileView === 'list'" class="pt-side">
            <div class="pt-side-head">
              <span class="text-subtitle-2 font-weight-bold">期款範本</span>
              <span class="pt-side-total">{{ templates.length }}</span>
              <v-spacer></v-spacer>
              <v-btn size="small" color="green-darken-2" prepend-icon="mdi-plus" @click="openTemplateDialog()">新增</v-btn>
            </div>
            <v-text-field
              v-if="templates.length"
              v-model="templateSearch"
              placeholder="搜尋範本"
              prepend-inner-icon="mdi-magnify"
              variant="outlined"
              density="compact"
              hide-details
              clearable
              class="mb-2"
            ></v-text-field>

            <div class="pt-side-list">
              <template v-for="group in templateGroups" :key="group.category">
                <div class="pt-group-head">
                  <span :class="['pt-group-dot', `bg-${group.color}`]"></span>
                  {{ group.category }}
                  <span class="pt-group-count">{{ group.items.length }}</span>
                </div>
                <div
                  v-for="t in group.items"
                  :key="t.id"
                  :class="['pt-row', isActiveTemplate(t.id) && 'pt-row--active']"
                  @click="selectTemplate(t.id)"
                >
                  <div class="pt-row-main">
                    <div class="pt-row-name">{{ t.templateName }}</div>
                    <div class="pt-row-meta">{{ templateMeta(t) }}</div>
                  </div>
                  <v-icon
                    v-if="getLoanName(t.companyLoanTemplateId)"
                    size="16"
                    color="brown"
                    :title="getLoanName(t.companyLoanTemplateId)"
                  >mdi-bank-outline</v-icon>
                  <v-icon
                    v-if="t.items?.length && !isTotalValid(templateTotal(t))"
                    size="16"
                    color="warning"
                    :title="`總計 ${templateTotal(t)}%`"
                  >mdi-alert-circle</v-icon>
                  <span class="pt-row-count">{{ t.items?.length || 0 }} 項</span>
                  <v-icon v-if="!mdAndUp" size="18" color="grey">mdi-chevron-right</v-icon>
                </div>
              </template>
              <div v-if="!templates.length" class="pt-empty">尚未建立範本</div>
              <div v-else-if="!templateGroups.length" class="pt-empty">找不到符合的範本</div>
            </div>
          </aside>

          <!-- 右：選中的範本（手機為第二層頁面） -->
          <section v-show="mdAndUp || mobileView === 'detail'" ref="detailRef" class="pt-main">
            <template v-if="selectedTemplate">
              <div class="pt-detail-head">
                <v-btn
                  v-if="!mdAndUp"
                  icon="mdi-arrow-left"
                  variant="text"
                  size="small"
                  class="mr-1"
                  title="返回範本清單"
                  @click="backToList"
                ></v-btn>
                <div class="pt-detail-title">
                  <div class="text-h6 font-weight-bold">{{ selectedTemplate.templateName }}</div>
                  <div class="d-flex flex-wrap ga-1 mt-1">
                    <v-chip size="small" :color="getPaymentCategoryColor(selectedTemplate.paymentCategory)" variant="flat">
                      {{ selectedTemplate.paymentCategory || '一般期款' }}
                    </v-chip>
                    <v-chip size="small" color="purple-lighten-2" variant="flat">
                      {{ selectedTemplate.propertyType || '住家' }}
                    </v-chip>
                    <v-chip size="small" :color="selectedTemplate.buyerType === '首購' ? 'success' : 'info'" variant="flat">
                      {{ selectedTemplate.buyerType || '非首購' }}
                    </v-chip>
                    <v-chip v-if="priceRangeText(selectedTemplate)" size="small" color="primary" variant="flat">
                      {{ priceRangeText(selectedTemplate) }}
                    </v-chip>
                    <v-chip
                      v-if="getLoanName(selectedTemplate.companyLoanTemplateId)"
                      size="small"
                      color="brown-darken-1"
                      variant="flat"
                      prepend-icon="mdi-bank-outline"
                    >
                      {{ getLoanName(selectedTemplate.companyLoanTemplateId) }}
                    </v-chip>
                  </div>
                </div>
                <div v-if="mdAndUp" class="pt-detail-actions">
                  <v-btn size="small" variant="text" icon="mdi-pencil" title="修改設定" @click="openTemplateDialog(selectedTemplate)"></v-btn>
                  <v-btn size="small" variant="text" icon="mdi-content-copy" title="複製範本" @click="copyTemplate(selectedTemplate)"></v-btn>
                  <v-btn size="small" variant="text" icon="mdi-delete-outline" color="error" title="刪除" @click="confirmDeleteTemplate(selectedTemplate)"></v-btn>
                </div>
                <!-- 手機：操作收進選單，標題保留完整寬度 -->
                <v-menu v-else location="bottom end">
                  <template #activator="{ props: menuProps }">
                    <v-btn v-bind="menuProps" icon="mdi-dots-vertical" size="small" variant="text"></v-btn>
                  </template>
                  <v-list density="compact">
                    <v-list-item prepend-icon="mdi-pencil" title="修改設定" @click="openTemplateDialog(selectedTemplate)"></v-list-item>
                    <v-list-item prepend-icon="mdi-content-copy" title="複製範本" @click="copyTemplate(selectedTemplate)"></v-list-item>
                    <v-list-item prepend-icon="mdi-delete-outline" title="刪除" base-color="error" @click="confirmDeleteTemplate(selectedTemplate)"></v-list-item>
                  </v-list>
                </v-menu>
              </div>

              <div :class="['pt-items', lgAndUp && 'pt-items--split']">
                <!-- 期款項目排序清單 -->
                <v-card variant="outlined" class="item-list-panel">
                  <v-card-title class="d-flex align-center flex-wrap ga-2 text-subtitle-1 py-2">
                    期款項目
                    <v-chip
                      size="small"
                      :color="paymentOverview.isValid ? 'success' : 'warning'"
                      :prepend-icon="paymentOverview.isValid ? 'mdi-check-circle' : 'mdi-alert-circle'"
                      variant="tonal"
                    >
                      總計 {{ paymentOverview.total }}%
                      <template v-if="!paymentOverview.isValid">
                        （{{ paymentOverview.diff > 0 ? `尚差 ${paymentOverview.diff}%` : `超過 ${-paymentOverview.diff}%` }}）
                      </template>
                    </v-chip>
                    <v-spacer></v-spacer>
                    <v-btn size="small" color="primary" prepend-icon="mdi-plus" @click="openItemEditor(null, null)">
                      新增母項目
                    </v-btn>
                  </v-card-title>
                  <div class="trial-bar">
                    <v-text-field
                      v-model.number="trialAmount"
                      :label="trialVariable === '配套金額' ? '試算配套金額' : '試算總價'"
                      type="number"
                      min="0"
                      suffix="萬"
                      prepend-inner-icon="mdi-calculator-variant-outline"
                      variant="outlined"
                      density="compact"
                      hide-details
                      clearable
                    ></v-text-field>
                  </div>
                  <v-divider></v-divider>

                  <draggable
                    v-model="selectedTemplate.items"
                    item-key="id"
                    handle=".drag-handle"
                    @end="saveTemplate"
                  >
                    <template #item="{ element: item }">
                      <div v-if="!item.parentId">
                        <div
                          :class="['item-row', isEditingItem(item.id) && 'item-row--active']"
                          @click="openItemEditor(item, null)"
                        >
                          <v-icon class="drag-handle" size="18" color="grey" title="拖曳排序">mdi-drag-horizontal-variant</v-icon>
                          <span class="order-badge">{{ parentOrder(item.id) }}</span>
                          <div class="item-row-main">
                            <div class="item-row-name">{{ item.name }}</div>
                            <div v-if="getChildren(item.id).length" class="text-caption text-grey">
                              含 {{ getChildren(item.id).length }} 個子項目
                            </div>
                          </div>
                          <div class="item-row-value">
                            <v-chip size="small" color="primary" variant="flat">{{ item.conditionalValue }}%</v-chip>
                            <span
                              v-if="trialResults"
                              :class="['item-amount', trialResults[item.id]?.error && 'text-error']"
                            >{{ trialText(item.id) }}</span>
                          </div>
                          <v-btn
                            icon="mdi-plus"
                            size="x-small"
                            variant="text"
                            title="新增子項目"
                            @click.stop="openItemEditor(null, item.id)"
                          ></v-btn>
                          <v-btn
                            icon="mdi-delete-outline"
                            size="x-small"
                            variant="text"
                            color="error"
                            title="刪除"
                            @click.stop="deleteItem(item.id)"
                          ></v-btn>
                        </div>

                        <draggable
                          v-if="getChildren(item.id).length"
                          :list="getChildren(item.id)"
                          item-key="id"
                          handle=".drag-handle"
                          @end="saveTemplate"
                        >
                          <template #item="{ element: child }">
                            <div
                              :class="['item-row', 'item-row--child', isEditingItem(child.id) && 'item-row--active']"
                              @click="openItemEditor(child, item.id)"
                            >
                              <v-icon class="drag-handle" size="16" color="grey" title="拖曳排序">mdi-drag-horizontal-variant</v-icon>
                              <v-icon size="14" color="grey-lighten-1">mdi-subdirectory-arrow-right</v-icon>
                              <div class="item-row-main">
                                <div class="item-row-name">{{ child.name }}</div>
                              </div>
                              <div class="item-row-value">
                                <v-chip size="small" color="primary" variant="outlined">{{ child.conditionalValue }}%</v-chip>
                                <span
                                  v-if="trialResults"
                                  :class="['item-amount', trialResults[child.id]?.error && 'text-error']"
                                >{{ trialText(child.id) }}</span>
                              </div>
                              <v-btn
                                icon="mdi-delete-outline"
                                size="x-small"
                                variant="text"
                                color="error"
                                title="刪除"
                                @click.stop="deleteItem(child.id)"
                              ></v-btn>
                            </div>
                          </template>
                        </draggable>
                      </div>
                    </template>
                  </draggable>

                  <div v-if="!selectedTemplate.items?.length" class="pa-6 text-center text-grey">
                    尚未建立期款項目
                  </div>

                  <div v-if="trialSum" class="trial-sum">
                    <span>合計</span>
                    <v-chip
                      size="small"
                      :color="trialSum.isMatch ? 'success' : 'warning'"
                      variant="tonal"
                    >
                      {{ trialSum.isMatch ? '相符' : (trialSum.diff > 0 ? `尚差 ${formatAmount(trialSum.diff)} 萬` : `超過 ${formatAmount(-trialSum.diff)} 萬`) }}
                    </v-chip>
                    <span class="trial-sum-value">{{ formatAmount(trialSum.sum) }} 萬</span>
                  </div>
                </v-card>

                <!-- 項目編輯區（寬螢幕內嵌；其餘以 dialog 呈現） -->
                <div v-if="lgAndUp" class="editor-sticky">
                  <PaymentItemEditor
                    v-if="editorVisible"
                    :item="editingItem"
                    :existing-items="existingItems"
                    :trial-base="trialBase"
                    @save="handleItemSave"
                    @cancel="closeEditor"
                  />
                  <v-card v-else variant="outlined" class="editor-placeholder">
                    <div class="text-center text-grey">
                      <v-icon size="40" color="grey-lighten-1" class="mb-2">mdi-cursor-default-click-outline</v-icon>
                      <div>點擊項目進行編輯</div>
                    </div>
                  </v-card>
                </div>
              </div>
            </template>

            <v-card v-else variant="outlined" class="editor-placeholder">
              <div class="text-center text-grey">
                <v-icon size="40" color="grey-lighten-1" class="mb-2">mdi-file-document-outline</v-icon>
                <div>{{ templates.length ? '請選擇範本' : '請先新增範本' }}</div>
              </div>
            </v-card>
          </section>
        </div>
      </v-window-item>

      <!-- ============ Tab 2：公司借貸範本 ============ -->
      <v-window-item value="loan">
        <div :class="['pt-layout', mdAndUp && 'pt-layout--split']">
          <aside class="pt-side">
            <div class="pt-side-head">
              <span class="text-subtitle-2 font-weight-bold">借貸範本</span>
              <span class="pt-side-total">{{ loanTemplates.length }}</span>
              <v-spacer></v-spacer>
              <v-btn size="small" color="brown-darken-1" prepend-icon="mdi-plus" @click="openLoanEditor()">新增</v-btn>
            </div>

            <div class="pt-side-list">
              <div
                v-for="loan in loanTemplates"
                :key="loan.id"
                :class="['pt-row', isEditingLoan(loan.id) && 'pt-row--loan-active']"
                @click="openLoanEditor(loan)"
              >
                <div class="pt-row-main">
                  <div class="pt-row-name">{{ loan.loanName }}</div>
                  <div class="pt-row-meta">{{ loanMeta(loan) }}</div>
                </div>
                <span
                  v-if="loanUsageCount(loan.id)"
                  class="pt-row-count"
                  :title="`${loanUsageCount(loan.id)} 個期款範本使用中`"
                >
                  <v-icon size="14">mdi-link-variant</v-icon>{{ loanUsageCount(loan.id) }}
                </span>
                <v-menu location="bottom end">
                  <template #activator="{ props: menuProps }">
                    <v-btn v-bind="menuProps" icon="mdi-dots-vertical" size="x-small" variant="text" @click.stop></v-btn>
                  </template>
                  <v-list density="compact">
                    <v-list-item prepend-icon="mdi-content-copy" title="複製" @click="copyLoanTemplate(loan)"></v-list-item>
                    <v-list-item prepend-icon="mdi-delete-outline" title="刪除" base-color="error" @click="confirmDeleteLoan(loan)"></v-list-item>
                  </v-list>
                </v-menu>
              </div>
              <div v-if="!loanTemplates.length" class="pt-empty">尚未建立借貸範本</div>
            </div>
          </aside>

          <!-- 借貸範本編輯區（桌機內嵌；手機為全螢幕 dialog） -->
          <section v-if="mdAndUp" class="pt-main">
            <CompanyLoanEditor
              v-if="loanEditorVisible"
              :item="editingLoan"
              :stacked="!lgAndUp"
              @save="handleLoanSave"
              @cancel="closeLoanEditor"
            />
            <v-card v-else variant="outlined" class="editor-placeholder">
              <div class="text-center text-grey">
                <v-icon size="40" color="grey-lighten-1" class="mb-2">mdi-cursor-default-click-outline</v-icon>
                <div>點擊借貸範本進行編輯</div>
              </div>
            </v-card>
          </section>
        </div>
      </v-window-item>
    </v-window>


    <v-dialog v-model="templateDialog.show" persistent max-width="400px">
      <v-card>
        <v-card-title>{{ templateDialog.isEditing ? '修改範本' : '新增範本' }}</v-card-title>
        <v-card-text>
          <v-text-field
            v-model="templateDialog.name"
            label="範本名稱"
            variant="outlined"
            autofocus
            @keydown.enter="handleTemplateSave"
            :rules="[v => !!v || '必填']"
          ></v-text-field>

          
          
          <v-row>
            <v-col cols="12" sm="6">
              <v-text-field
                v-model="templateDialog.minPrice"
                label="最低總價 (萬)"
                type="number"
                variant="outlined"
                suffix="萬"
                :rules="[
                  v => !v || v >= 0 || '金額不能為負數',
                  v => !v || !templateDialog.maxPrice || Number(v) <= Number(templateDialog.maxPrice) || '最低價不能大於最高價'
                ]"
              ></v-text-field>
            </v-col>
            <v-col cols="12" sm="6">
              <v-text-field
                v-model="templateDialog.maxPrice"
                label="最高總價 (萬)"
                type="number"
                variant="outlined"
                suffix="萬"
                :rules="[
                  v => !v || v >= 0 || '金額不能為負數',
                  v => !v || !templateDialog.minPrice || Number(v) >= Number(templateDialog.minPrice) || '最高價不能小於最低價'
                ]"
              ></v-text-field>
            </v-col>
          </v-row>

          <v-select
            v-model="templateDialog.propertyType"
            label="物件類型"
            :items="['住家', '店面', '其他']"
            variant="outlined"
            class="mt-4"
            hide-details="auto"
          ></v-select>

          <v-expand-transition>
            <div v-if="templateDialog.propertyType === '其他'">
              <v-text-field
                v-model="templateDialog.customPropertyType"
                label="請輸入物件類型"
                placeholder="例如：事務所、透天..."
                variant="outlined"
                class="mt-4"
               
                :rules="[v => !!v || '請輸入類型名稱']"
              ></v-text-field>
            </div>
          </v-expand-transition>

          <v-select
            v-model="templateDialog.buyerType"
            label="買家類型"
            :items="['首購', '非首購']"
            variant="outlined"
            class="mt-4"
            
            hide-details="auto" 
          ></v-select>

          <v-combobox
            v-model="templateDialog.paymentCategory"
            label="期款類別"
            :items="['一般期款', '優付期款', '配套期款']"
            variant="outlined"

            class="mt-4"

            clearable
            hint="可選擇預設選項或輸入自訂類別"
            persistent-hint
          ></v-combobox>

          <!-- 附掛公司借貸範本：報價套用此期款範本時，會一併顯示借貸攤還表 -->
          <v-select
            v-model="templateDialog.companyLoanTemplateId"
            label="附掛公司借貸範本"
            :items="loanSelectItems"
            item-title="title"
            item-value="value"
            variant="outlined"
            class="mt-4"
            hint="附掛後，報價單套用此範本時會顯示借貸攤還表；於「公司借貸範本」分頁管理"
            persistent-hint
          ></v-select>

          <!-- ✅ [新增] 套用期款時的說明：報價單套用此範本時，會在表格下方顯示這排小字；留空則不顯示 -->
          <v-textarea
            v-model="templateDialog.applyNote"
            label="套用期款時的說明"
            variant="outlined"
            class="mt-4"
            rows="2"
            auto-grow
            clearable
            counter
            placeholder="例如：本期款方式之金額為預估值，實際以簽約合約為準。"
            hint="報價單套用此範本時，會顯示於表格下方；留空則不顯示。"
            persistent-hint
          ></v-textarea>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="grey" text @click="templateDialog.show = false">取消</v-btn>
          <v-btn color="primary" text @click="handleTemplateSave">儲存</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- 期款項目編輯：手機全螢幕、平板置中 dialog（寬螢幕內嵌於右側） -->
    <v-dialog
      :model-value="!lgAndUp && editorVisible"
      :fullscreen="!mdAndUp"
      :max-width="mdAndUp ? 720 : undefined"
      :persistent="mdAndUp"
      scrollable
      :transition="mdAndUp ? 'dialog-transition' : 'dialog-bottom-transition'"
      @update:model-value="val => !val && closeEditor()"
    >
      <PaymentItemEditor
        v-if="editingItem"
        :fullscreen="!mdAndUp"
        :item="editingItem"
        :existing-items="existingItems"
        :trial-base="trialBase"
        @save="handleItemSave"
        @cancel="closeEditor"
      />
    </v-dialog>

    <!-- 手機版：公司借貸範本全螢幕編輯頁 -->
    <v-dialog
      :model-value="!mdAndUp && loanEditorVisible"
      fullscreen
      transition="dialog-bottom-transition"
      @update:model-value="val => !val && closeLoanEditor()"
    >
      <CompanyLoanEditor
        v-if="editingLoan"
        fullscreen
        :item="editingLoan"
        @save="handleLoanSave"
        @cancel="closeLoanEditor"
      />
    </v-dialog>

    <!-- 複製範本確認對話框 -->
    <v-dialog v-model="copyDialog.show" max-width="400">
      <v-card>
        <v-card-title class="text-h6">
          複製期款範本
        </v-card-title>
        <v-card-text class="pt-4">
          <p class="mb-4">即將複製範本「{{ copyDialog.sourceTemplate?.templateName }}」</p>
          <v-text-field
            v-model="copyDialog.templateName"
            label="新範本名稱"
            variant="outlined"
            :rules="[v => !!v || '請輸入範本名稱']"
            autofocus
          ></v-text-field>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="grey" text @click="copyDialog.show = false">取消</v-btn>
          <v-btn
            color="primary"
            text
            :disabled="!copyDialog.templateName"
            @click="handleCopyConfirm"
          >
            確認複製
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="duplicateDialog.show" max-width="500px" persistent>
      <v-card class="rounded-lg">
        <v-card-title class="d-flex align-center bg-amber-lighten-5 text-amber-darken-4 py-3">
          <v-icon icon="mdi-alert" class="mr-2"></v-icon>
          重複範本提醒
        </v-card-title>
        
        <v-card-text class="pt-4">
          <p class="text-body-1 mb-4">
            系統檢測到已存在屬性完全相同的範本。
          </p>

          <v-sheet border rounded class="bg-grey-lighten-5 pa-3 mb-4">
            <div class="text-caption text-grey-darken-1 mb-2">已存在的範本資訊：</div>
            <div class="d-flex flex-column gap-2">
               <div class="d-flex align-center">
                <v-icon size="small" color="grey" class="mr-2">mdi-file-document-outline</v-icon>
                <span class="font-weight-bold mr-2">範本名稱：</span>
                <span>{{ duplicateDialog.existingTemplate?.templateName }}</span>
              </div>
              <div class="d-flex align-center">
                <v-icon size="small" color="grey" class="mr-2">mdi-home-city-outline</v-icon>
                <span class="font-weight-bold mr-2">物件類型：</span>
                <v-chip size="small" density="comfortable" class="mr-1">{{ duplicateDialog.existingTemplate?.propertyType }}</v-chip>
              </div>
              
              <div class="d-flex align-center">
                <v-icon size="small" color="grey" class="mr-2">mdi-currency-usd</v-icon>
                <span class="font-weight-bold mr-2">總價區間：</span>
                <span>
                  {{ duplicateDialog.existingTemplate?.minPrice ? `${duplicateDialog.existingTemplate?.minPrice}萬` : '0' }} ~ 
                  {{ duplicateDialog.existingTemplate?.maxPrice ? `${duplicateDialog.existingTemplate?.maxPrice}萬` : '無上限' }}
                </span>
              </div>

              <div class="d-flex align-center">
                <v-icon size="small" color="grey" class="mr-2">mdi-account-outline</v-icon>
                <span class="font-weight-bold mr-2">買家類型：</span>
                <v-chip size="small" density="comfortable" :color="duplicateDialog.existingTemplate?.buyerType === '首購' ? 'success' : 'info'" variant="flat" class="mr-1">
                  {{ duplicateDialog.existingTemplate?.buyerType }}
                </v-chip>
              </div>
              <div class="d-flex align-center">
                <v-icon size="small" color="grey" class="mr-2">mdi-tag-outline</v-icon>
                <span class="font-weight-bold mr-2">期款類別：</span>
                <v-chip size="small" density="comfortable" :color="getPaymentCategoryColor(duplicateDialog.existingTemplate?.paymentCategory)" variant="flat">
                  {{ duplicateDialog.existingTemplate?.paymentCategory }}
                </v-chip>
              </div>
            </div>
          </v-sheet>

          <p class="text-body-2 text-grey-darken-2">
            建議您確認是否需要建立重複設定？若您是為了區分不同總價區間，請點擊「確認建立」。
          </p>
        </v-card-text>

        <v-card-actions class="pb-4 px-4">
          <v-spacer></v-spacer>
          <v-btn
            variant="outlined"
            color="grey-darken-1"
            @click="duplicateDialog.show = false"
          >
            取消
          </v-btn>
          <v-btn
            color="amber-darken-4"
            variant="flat"
            class="px-4"
            @click="handleDuplicateConfirm"
          >
            確認建立
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

  </v-card>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed, watch, nextTick } from 'vue';
import { useRoute } from 'vue-router';
import { useToast } from 'vue-toastification';
import { useDisplay } from 'vuetify';
import draggable from 'vuedraggable';
import PaymentItemEditor from '@/components/PaymentItemEditor.vue';
import CompanyLoanEditor from '@/components/CompanyLoanEditor.vue';
import { runNewCalculationEngine } from '@/utils/paymentCalculation';
import {
  listenToPaymentTermTemplates,
  setPaymentTermTemplate,
  updatePaymentTermTemplate,
  deletePaymentTermTemplate,
  listenToCompanyLoanTemplates,
  setCompanyLoanTemplate,
  updateCompanyLoanTemplate,
  deleteCompanyLoanTemplate,
} from '@/api';

// --- 核心 State ---
const route = useRoute();
const toast = useToast();
const projectId = ref(route.params.projectId);

const templates = ref([]);
const templatesLoading = ref(true);
const selectedTemplateId = ref(null);
let unsubscribeTemplates = null;

// --- 分頁：期款範本 / 公司借貸範本 ---
const activeTab = ref('payment');

// --- 範本清單：搜尋、手機兩層頁面（清單 → 範本內容） ---
const templateSearch = ref('');
const mobileView = ref('list');
const detailRef = ref(null);

// --- 公司借貸範本 State ---
const loanTemplates = ref([]);
let unsubscribeLoans = null;
const loanEditorVisible = ref(false);
const editingLoan = ref(null);

// --- 範本管理 Dialog State ---
const templateDialog = ref({ 
  show: false, 
  name: '', 
  isEditing: false,
  editingTemplateId: null, 
  minPrice: '', 
  maxPrice: '', 
  buyerType: '非首購', 
  paymentCategory: '一般期款',
  // ✅ [新增] 物件類型相關欄位
  propertyType: '住家',
  customPropertyType: '',
  // ✅ [新增] 套用期款時的說明
  applyNote: '',
  // 附掛的公司借貸範本 id（null = 不附掛）
  companyLoanTemplateId: null
});

// ✅ [新增] 重複檢查 Dialog State
const duplicateDialog = ref({
  show: false,
  existingTemplate: null, // 查到的重複範本
  pendingData: null       // 準備要儲存的資料
});

// --- 複製範本 Dialog State ---
const copyDialog = ref({
  show: false,
  templateName: '',
  sourceTemplate: null
});

// --- 項目編輯區 State ---
// 寬螢幕顯示於右側面板；平板為置中 dialog、手機為全螢幕 dialog
const { mdAndUp, lgAndUp } = useDisplay();
const editorVisible = ref(false);
const editingItem = ref(null);

// 判斷卡片是否為目前編輯中的範本
const isActiveTemplate = (templateId) => selectedTemplateId.value === templateId;

// --- Computed Properties ---
const selectedTemplate = computed({
  get: () => templates.value.find(t => t.id === selectedTemplateId.value),
  set: (newValue) => {
    const index = templates.value.findIndex(t => t.id === selectedTemplateId.value);
    if (index !== -1) templates.value[index] = newValue;
  }
});

const getChildren = (parentId) => {
  return selectedTemplate.value?.items?.filter(i => i.parentId === parentId) || [];
};

// 範本所有期款項目（含子項目）的比例總和，取到小數點後兩位
const templateTotal = (template) => {
  const total = (template?.items || []).reduce((sum, item) => sum + (Number(item.conditionalValue) || 0), 0);
  return parseFloat(total.toFixed(2));
};

// 允許 0.01% 的誤差
const isTotalValid = (total) => Math.abs(total - 100) < 0.01;

// 計算期款項目總計
const paymentOverview = computed(() => {
  if (!selectedTemplate.value?.items) return { total: 0, diff: 0, isValid: true };
  const total = templateTotal(selectedTemplate.value);
  return {
    total,
    diff: parseFloat((100 - total).toFixed(2)),
    isValid: isTotalValid(total)
  };
});

// 總價區間文字；未設定回空字串
const priceRangeText = (template) => {
  if (!template?.minPrice && !template?.maxPrice) return '';
  const min = template.minPrice ? `${template.minPrice}萬` : '0';
  const max = template.maxPrice ? `${template.maxPrice}萬` : '無上限';
  return `${min}~${max}`;
};

// 清單列的副標：物件類型・買家類型・總價區間
const templateMeta = (template) => [
  template.propertyType || '住家',
  template.buyerType || '非首購',
  priceRangeText(template),
].filter(Boolean).join('・');

// 範本清單：依期款類別分組，組內依物件類型 → 買家類型 → 最低總價 → 名稱排序
const CATEGORY_ORDER = ['一般期款', '優付期款', '配套期款'];
const PROPERTY_ORDER = ['住家', '店面'];
const orderRank = (order, value) => {
  const index = order.indexOf(value);
  return index === -1 ? order.length : index;
};
const compareText = (a, b) => (a || '').localeCompare(b || '', 'zh-Hant');

const templateGroups = computed(() => {
  const keyword = (templateSearch.value || '').trim().toLowerCase();
  const list = keyword
    ? templates.value.filter(t =>
        [t.templateName, t.paymentCategory, t.propertyType, t.buyerType, getLoanName(t.companyLoanTemplateId)]
          .some(v => (v || '').toLowerCase().includes(keyword))
      )
    : templates.value;

  const groups = new Map();
  for (const t of list) {
    const category = t.paymentCategory || '一般期款';
    if (!groups.has(category)) groups.set(category, []);
    groups.get(category).push(t);
  }

  return [...groups.entries()]
    .sort(([a], [b]) => orderRank(CATEGORY_ORDER, a) - orderRank(CATEGORY_ORDER, b) || compareText(a, b))
    .map(([category, items]) => ({
      category,
      color: getPaymentCategoryColor(category),
      items: [...items].sort((a, b) => {
        const typeA = a.propertyType || '住家';
        const typeB = b.propertyType || '住家';
        return orderRank(PROPERTY_ORDER, typeA) - orderRank(PROPERTY_ORDER, typeB)
          || compareText(typeA, typeB)
          || ((a.buyerType === '首購') ? 0 : 1) - ((b.buyerType === '首購') ? 0 : 1)
          || (Number(a.minPrice) || 0) - (Number(b.minPrice) || 0)
          || compareText(a.templateName, b.templateName);
      }),
    }));
});

// 清單排序後的第一個範本（可排除指定 id）
const firstTemplateId = (excludeId = null) => {
  for (const group of templateGroups.value) {
    const found = group.items.find(t => t.id !== excludeId);
    if (found) return found.id;
  }
  return null;
};

// 選取範本；手機切換到範本內容頁
const selectTemplate = async (templateId) => {
  selectedTemplateId.value = templateId;
  if (!mdAndUp.value) {
    mobileView.value = 'detail';
    await nextTick();
    detailRef.value?.scrollIntoView({ block: 'start' });
  }
};

// 手機：返回範本清單並捲到目前範本
const backToList = async () => {
  mobileView.value = 'list';
  await nextTick();
  document.querySelector('.pt-row--active')?.scrollIntoView({ block: 'center' });
};

const existingItems = computed(() => {
  // 獲取當前範本中的所有期款項目，排除正在編輯的項目
  return selectedTemplate.value?.items?.filter(i => {
    // 如果是編輯模式，排除當前正在編輯的項目
    if (editingItem.value?.id) {
      return i.id !== editingItem.value.id;
    }
    return true;
  }) || [];
});

// --- 試算：輸入金額查看範本計算結果 ---
const TRIAL_STORAGE_KEY = 'paymentTermsTrialAmount';
const readSavedTrialAmount = () => {
  try {
    const saved = Number(localStorage.getItem(TRIAL_STORAGE_KEY));
    return saved > 0 ? saved : null;
  } catch {
    return null;
  }
};
// 試算金額（萬）；切換範本時沿用，並記在這台瀏覽器
const trialAmount = ref(readSavedTrialAmount());
watch(trialAmount, (val) => {
  try {
    if (Number(val) > 0) localStorage.setItem(TRIAL_STORAGE_KEY, String(val));
    else localStorage.removeItem(TRIAL_STORAGE_KEY);
  } catch {
    // 無法存取瀏覽器儲存空間時，僅本次有效
  }
});

// 與報價單相同：配套期款範本以配套金額為基準，其餘以總價
const trialVariable = computed(() =>
  selectedTemplate.value?.paymentCategory === '配套期款' ? '配套金額' : '總價'
);

// 試算基準 { value: 金額(萬), variable }；未輸入回 null
// 與報價單相同直接以「萬」計算，各項目的進位方式／進位值才會套用在同一個單位上
const trialBase = computed(() => {
  const amount = Number(trialAmount.value);
  if (!(amount > 0)) return null;
  return { value: amount, variable: trialVariable.value };
});

// 各項目試算結果 { [itemId]: { value, error } }；未輸入試算金額回 null
const trialResults = computed(() => {
  const items = selectedTemplate.value?.items;
  if (!trialBase.value || !items?.length) return null;
  const results = runNewCalculationEngine(
    items.map(i => ({ ...i, formula: i.formula || '' })),
    trialBase.value.value,
    trialBase.value.variable
  );
  const byId = {};
  Object.values(results).forEach(r => {
    byId[r.id] = { value: r.value, error: !!r.error };
  });
  return byId;
});

// 母項目合計與試算金額的差額
const trialSum = computed(() => {
  if (!trialResults.value) return null;
  const sum = selectedTemplate.value.items
    .filter(i => !i.parentId)
    .reduce((total, i) => total + (trialResults.value[i.id]?.value || 0), 0);
  const diff = trialBase.value.value - sum;
  return { sum, diff, isMatch: Math.abs(diff) < 0.00005 };
});

// 金額（萬）；保留到 4 位小數（1 元）
const formatAmount = (value) => Number(value).toLocaleString('zh-TW', { maximumFractionDigits: 4 });

const trialText = (itemId) => {
  const result = trialResults.value?.[itemId];
  if (!result) return '—';
  return result.error ? '公式錯誤' : `${formatAmount(result.value)} 萬`;
};

// 母項目在清單中的順序（1 起算）
const parentOrder = (itemId) => {
  const parents = selectedTemplate.value?.items?.filter(i => !i.parentId) || [];
  return parents.findIndex(i => i.id === itemId) + 1;
};

// 該項目是否正在右側編輯區編輯中
const isEditingItem = (itemId) => editorVisible.value && editingItem.value?.id === itemId;

// --- 公司借貸範本相關 ---

// 該借貸範本是否編輯中
const isEditingLoan = (loanId) => loanEditorVisible.value && editingLoan.value?.id === loanId;

// 依 id 取得借貸範本名稱（不存在回 null，容忍已刪除的引用）
const getLoanName = (loanId) => {
  if (!loanId) return null;
  return loanTemplates.value.find(l => l.id === loanId)?.loanName || null;
};

// 清單列的副標：成數・年期・利率
const loanMeta = (loan) => `成數 ${loan.ratioPercent}%・${loan.years}年/${loan.periods}期・年利率 ${loan.annualRate}%`;

// 借貸範本被幾個期款範本附掛
const loanUsageCount = (loanId) => {
  return templates.value.filter(t => t.companyLoanTemplateId === loanId).length;
};

// 期款範本 dialog 的附掛選項
const loanSelectItems = computed(() => [
  { title: '不附掛', value: null },
  ...loanTemplates.value.map(l => ({ title: l.loanName, value: l.id })),
]);

// 獲取期款類別對應的顏色
const getPaymentCategoryColor = (category) => {
  switch(category) {
    case '一般期款':
      return 'blue-grey';
    case '配套期款':
      return 'deep-purple';
   
    case '優付期款':
      return 'cyan-darken-1'; 
    default:
      return 'orange'; // 自訂類別使用橙色
  }
};

// --- 範本 CRUD Methods ---
const setupTemplatesListener = () => {
  templatesLoading.value = true;
  unsubscribeTemplates = listenToPaymentTermTemplates(projectId.value, (data) => {
    templates.value = data;
    if (templatesLoading.value) templatesLoading.value = false;
    if (!selectedTemplateId.value && data.length > 0) {
      selectedTemplateId.value = firstTemplateId();
    }
  });
};

const openTemplateDialog = (template = null) => {
  if (template) {
    // 編輯模式：判斷是否為自訂類型
    const standardTypes = ['住家', '店面'];
    const currentType = template.propertyType || '住家';
    
    // 如果是標準選項，直接選中；否則選「其他」並填入自訂值
    let dialogType = currentType;
    let customType = '';
    
    if (!standardTypes.includes(currentType)) {
        dialogType = '其他';
        customType = currentType;
    }

    templateDialog.value = { 
      show: true, 
      name: template.templateName, 
      isEditing: true,
      editingTemplateId: template.id, 
      minPrice: template.minPrice || '',
      maxPrice: template.maxPrice || '',
      buyerType: template.buyerType || '非首購',
      paymentCategory: template.paymentCategory || '一般期款',
      // ✅ [新增] 載入物件類型
      propertyType: dialogType,
      customPropertyType: customType,
      // ✅ [新增] 載入套用期款時的說明
      applyNote: template.applyNote || '',
      // 載入附掛的公司借貸範本（容忍舊資料 undefined）
      companyLoanTemplateId: template.companyLoanTemplateId || null
    };
  } else {
    // 新增模式
    templateDialog.value = { 
      show: true, 
      name: '', 
      isEditing: false,
      editingTemplateId: null,
      minPrice: '',
      maxPrice: '',
      buyerType: '非首購',
      paymentCategory: '一般期款',
      // ✅ [新增] 初始化物件類型
      propertyType: '住家',
      customPropertyType: '',
      // ✅ [新增] 初始化套用期款時的說明
      applyNote: '',
      // 初始化附掛的公司借貸範本
      companyLoanTemplateId: null
    };
  }
};

// ✅ 3. 修改 handleTemplateSave 函式的新增邏輯
// 開啟複製範本對話框
const copyTemplate = (template) => {
  copyDialog.value = {
    show: true,
    templateName: `${template.templateName} - 複製`,
    sourceTemplate: template
  };
};

// 處理複製確認
const handleCopyConfirm = async () => {
  try {
    if (!copyDialog.value.templateName.trim()) {
      toast.error("請輸入範本名稱");
      return;
    }

    const timestamp = getTimestampString();
    const docId = `${projectId.value}_${copyDialog.value.templateName}_${timestamp}`;

    // 創建新範本對象，包含原範本的所有項目和屬性
    const newTemplate = {
      projectId: projectId.value,
      templateName: copyDialog.value.templateName.trim(),
      items: JSON.parse(JSON.stringify(copyDialog.value.sourceTemplate.items || [])), // 深拷貝項目數組
      minPrice: copyDialog.value.sourceTemplate.minPrice,
      maxPrice: copyDialog.value.sourceTemplate.maxPrice,
      buyerType: copyDialog.value.sourceTemplate.buyerType || '非首購',
      paymentCategory: copyDialog.value.sourceTemplate.paymentCategory || '一般期款',
      // ✅ [新增] 複製物件類型
      propertyType: copyDialog.value.sourceTemplate.propertyType || '住家',
      // ✅ [新增] 複製套用期款時的說明
      applyNote: copyDialog.value.sourceTemplate.applyNote || '',
      // 複製附掛的公司借貸範本
      companyLoanTemplateId: copyDialog.value.sourceTemplate.companyLoanTemplateId || null,
    };
    // 儲存新範本
    await setPaymentTermTemplate(docId, newTemplate);
    toast.success("範本複製成功");
    copyDialog.value.show = false;
    selectTemplate(docId);
  } catch (error) {
    toast.error(`複製範本失敗: ${error.message}`);
  }
};

const handleTemplateSave = async () => {
  const name = templateDialog.value.name.trim();
  if (!name) {
    toast.error("範本名稱不可為空");
    return;
  }

  // 檢查價格區間合法性
  const minPrice = templateDialog.value.minPrice ? Number(templateDialog.value.minPrice) : null;
  const maxPrice = templateDialog.value.maxPrice ? Number(templateDialog.value.maxPrice) : null;
  
  if (minPrice !== null && maxPrice !== null && minPrice > maxPrice) {
    toast.error("最低價不能大於最高價");
    return;
  }
  
  // 處理物件類型邏輯
  let finalPropertyType = templateDialog.value.propertyType;
  if (finalPropertyType === '其他') {
      const customVal = templateDialog.value.customPropertyType.trim();
      if (!customVal) {
          toast.error("請輸入自訂物件類型");
          return;
      }
      finalPropertyType = customVal;
  }
  
  // 準備要儲存的資料物件
  const templateData = {
    templateName: name,
    minPrice: minPrice,
    maxPrice: maxPrice,
    buyerType: templateDialog.value.buyerType,
    paymentCategory: templateDialog.value.paymentCategory,
    propertyType: finalPropertyType,
    // ✅ [新增] 套用期款時的說明（trim 後存；空字串代表不顯示）
    applyNote: (templateDialog.value.applyNote || '').trim(),
    // 附掛的公司借貸範本 id（null = 不附掛）
    companyLoanTemplateId: templateDialog.value.companyLoanTemplateId || null,
  };

  // ✅ [新增] 重複檢查邏輯
  const checkPropertyType = finalPropertyType;
  const checkBuyerType = templateDialog.value.buyerType;
  const checkPaymentCategory = templateDialog.value.paymentCategory;

  const duplicateTemplate = templates.value.find(t => {
    // 編輯模式排除自己
    if (templateDialog.value.isEditing && t.id === templateDialog.value.editingTemplateId) {
      return false;
    }
    // 比對三個關鍵欄位
    return t.propertyType === checkPropertyType &&
           t.buyerType === checkBuyerType &&
           t.paymentCategory === checkPaymentCategory;
  });

  if (duplicateTemplate) {
    // 發現重複，開啟 Dialog
    duplicateDialog.value = {
      show: true,
      existingTemplate: duplicateTemplate,
      pendingData: templateData
    };
  } else {
    // 無重複，直接儲存
    await executeTemplateSave(templateData);
  }
};

// ✅ [新增] 執行實際儲存的函式 (從 handleTemplateSave 拆分出來)
const executeTemplateSave = async (templateData) => {
  try {
    if (templateDialog.value.isEditing) {
      // 編輯模式
      await updatePaymentTermTemplate(templateDialog.value.editingTemplateId, templateData);
      toast.success("範本已更新");
    } else {
      // 新增模式
      const timestamp = getTimestampString();
      const docId = `${projectId.value}_${templateData.templateName}_${timestamp}`;

      const newTemplate = {
        projectId: projectId.value,
        ...templateData,
        items: [],
      };
      
      await setPaymentTermTemplate(docId, newTemplate);
      toast.success("已新增範本");
      selectTemplate(docId);
    }
    
    // 關閉所有相關視窗
    templateDialog.value.show = false;
    duplicateDialog.value.show = false;
    
  } catch (error) {
    console.error(error);
    toast.error("儲存失敗");
  }
};

// ✅ [新增] Dialog 確認按鈕的處理函式
const handleDuplicateConfirm = async () => {
  if (duplicateDialog.value.pendingData) {
    await executeTemplateSave(duplicateDialog.value.pendingData);
  }
};

const confirmDeleteTemplate = async (template) => {
  if (confirm(`您確定要刪除範本「${template.templateName}」嗎？`)) {
    try {
      await deletePaymentTermTemplate(template.id);
      toast.info("範本已刪除");
      // 如果被刪除的是當前選中的範本，改選清單第一個範本並回到清單
      if (selectedTemplateId.value === template.id) {
        selectedTemplateId.value = firstTemplateId(template.id);
        mobileView.value = 'list';
      }
    } catch(e) {
      toast.error(`刪除失敗: ${e.message}`);
    }
  }
};

// --- 項目 CRUD Methods ---

// 開啟編輯區：傳給編輯器的是深拷貝副本，編輯過程不影響左側清單
const openItemEditor = (item, parentId) => {
  if (item) { // 編輯
    editingItem.value = { ...JSON.parse(JSON.stringify(item)), isNew: false };
  } else { // 新增
    editingItem.value = {
      isNew: true,
      name: '',
      parentId: parentId || null,
      formula: '',
      conditionalValue: 0,
      roundingMethod: '四捨五入',
      roundingValue: 0
    };
  }
  editorVisible.value = true;
};

const closeEditor = () => {
  editorVisible.value = false;
  editingItem.value = null;
};

// 接收編輯器回傳的資料並寫回範本
const handleItemSave = async (itemData) => {
  const currentItems = selectedTemplate.value.items || [];
  if (itemData.isNew) {
    // 新增
    const newItem = { ...itemData };
    delete newItem.isNew;
    // 生成隨機id
    newItem.id = Date.now().toString();
    currentItems.push(newItem);
  } else {
    // 編輯
    const index = currentItems.findIndex(i => i.id === itemData.id);
    if (index !== -1) {
      currentItems[index] = { ...itemData };
      delete currentItems[index].isNew;
    }
  }
  selectedTemplate.value.items = currentItems;
  await saveTemplate();
  closeEditor();
};

const deleteItem = async (itemId) => {
  if (confirm("確定要刪除這個項目及其所有子項目嗎？")) {
    const itemsToDelete = [itemId];
    const children = getChildren(itemId);
    children.forEach(c => itemsToDelete.push(c.id));

    selectedTemplate.value.items = selectedTemplate.value.items.filter(i => !itemsToDelete.includes(i.id));
    // 若刪除的是編輯中的項目，一併關閉編輯區
    if (editingItem.value && itemsToDelete.includes(editingItem.value.id)) {
      closeEditor();
    }
    await saveTemplate();
  }
};

// 切換範本時關閉編輯區，避免編輯到錯誤範本的項目
watch(selectedTemplateId, () => {
  closeEditor();
});

// 範本不存在（被刪除）時，手機回到清單
watch(selectedTemplate, (template) => {
  if (!template) mobileView.value = 'list';
});

// --- 公司借貸範本 CRUD ---

const setupLoansListener = () => {
  unsubscribeLoans = listenToCompanyLoanTemplates(projectId.value, (data) => {
    loanTemplates.value = data;
  });
};

// 開啟借貸範本編輯區（傳入深拷貝副本）
const openLoanEditor = (loan = null) => {
  if (loan) {
    editingLoan.value = { ...JSON.parse(JSON.stringify(loan)), isNew: false };
  } else {
    editingLoan.value = {
      isNew: true,
      loanName: '',
      ratioPercent: 15,
      years: 3,
      periods: 12,
      annualRate: 0,
      amortizationType: '本金平均攤還',
      roundingMethod: '四捨五入',
      roundingValue: 1,
      note: ''
    };
  }
  loanEditorVisible.value = true;
};

// 複製借貸範本：以來源資料開啟「新增」編輯
const copyLoanTemplate = (loan) => {
  const copy = JSON.parse(JSON.stringify(loan));
  delete copy.id;
  delete copy.createdAt;
  delete copy.updatedAt;
  editingLoan.value = { ...copy, isNew: true, loanName: `${loan.loanName} - 複製` };
  loanEditorVisible.value = true;
};

const closeLoanEditor = () => {
  loanEditorVisible.value = false;
  editingLoan.value = null;
};

const handleLoanSave = async (loanData) => {
  try {
    const payload = { ...loanData };
    const isNew = payload.isNew;
    delete payload.isNew;
    delete payload.id;
    delete payload.createdAt;
    delete payload.updatedAt;

    if (isNew) {
      const timestamp = getTimestampString();
      const docId = `${projectId.value}_${payload.loanName}_${timestamp}`;
      await setCompanyLoanTemplate(docId, { projectId: projectId.value, ...payload });
      toast.success('已新增借貸範本');
    } else {
      await updateCompanyLoanTemplate(loanData.id, payload);
      toast.success('借貸範本已更新');
    }
    closeLoanEditor();
  } catch (error) {
    console.error(error);
    toast.error(`儲存失敗: ${error.message}`);
  }
};

// 刪除借貸範本：若被期款範本附掛，警示並於確認後一併解除附掛
const confirmDeleteLoan = async (loan) => {
  const usingTemplates = templates.value.filter(t => t.companyLoanTemplateId === loan.id);
  const message = usingTemplates.length > 0
    ? `此範本已被 ${usingTemplates.length} 個期款範本附掛（${usingTemplates.map(t => t.templateName).join('、')}），刪除後該些範本將解除附掛。\n\n確定要刪除「${loan.loanName}」嗎？`
    : `您確定要刪除借貸範本「${loan.loanName}」嗎？`;

  if (!confirm(message)) return;

  try {
    // 先解除所有附掛引用，再刪除範本
    for (const t of usingTemplates) {
      await updatePaymentTermTemplate(t.id, { companyLoanTemplateId: null });
    }
    await deleteCompanyLoanTemplate(loan.id);
    toast.info('借貸範本已刪除');
    if (editingLoan.value?.id === loan.id) {
      closeLoanEditor();
    }
  } catch (e) {
    toast.error(`刪除失敗: ${e.message}`);
  }
};

const saveTemplate = async () => {
  try {
    await updatePaymentTermTemplate(selectedTemplate.value.id, { items: selectedTemplate.value.items });
    toast.success("範本已儲存");
  } catch(e) {
    toast.error("儲存失敗：" + e.message);
  }
};

/**
 * 獲取 YYYYMMDDHHMMSS 格式的時間字串
 * @returns {string}
 */
function getTimestampString() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');
  return `${year}${month}${day}${hours}${minutes}${seconds}`;
}



// --- Lifecycle Hooks ---
onMounted(() => {
  if (projectId.value) {
    setupTemplatesListener();
    setupLoansListener();
  } else {
    toast.error('錯誤：未提供專案 ID！');
  }
});

onUnmounted(() => {
  if (unsubscribeTemplates) unsubscribeTemplates();
  if (unsubscribeLoans) unsubscribeLoans();
});
</script>

<style scoped>
/* 讓左側清單與右側編輯區可 sticky（v-card / v-window 預設 overflow: hidden 會讓 sticky 失效） */
.pt-root,
.pt-window {
  overflow: clip;
}

/* --- 左清單右內容 --- */
.pt-layout {
  padding-top: 16px;
}

.pt-layout--split {
  display: grid;
  grid-template-columns: 272px minmax(0, 1fr);
  gap: 16px;
  align-items: start;
}

.pt-layout--split .pt-side {
  position: sticky;
  top: 12px;
  max-height: calc(100vh - 24px);
  display: flex;
  flex-direction: column;
}

.pt-layout--split .pt-side-list {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
}

.pt-side-head {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 8px;
}

.pt-side-total {
  font-size: 12px;
  color: rgba(var(--v-theme-on-surface), 0.55);
}

.pt-side-list {
  border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  border-radius: 6px;
}

.pt-group-head {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  font-size: 12px;
  font-weight: 700;
  color: rgba(var(--v-theme-on-surface), 0.7);
  background:
    linear-gradient(rgba(var(--v-theme-on-surface), 0.04), rgba(var(--v-theme-on-surface), 0.04)),
    rgb(var(--v-theme-surface));
  border-bottom: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
}

/* 桌機：清單內捲動時分組標題固定在上方 */
.pt-layout--split .pt-group-head {
  position: sticky;
  top: 0;
  z-index: 1;
}

.pt-group-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}

.pt-group-count {
  margin-left: auto;
  font-weight: 400;
  color: rgba(var(--v-theme-on-surface), 0.5);
}

.pt-row {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 9px 12px;
  cursor: pointer;
  border-left: 3px solid transparent;
  border-bottom: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  transition: background 0.15s ease;
}

.pt-row:last-child {
  border-bottom: 0;
}

.pt-row:hover {
  background: rgba(var(--v-theme-on-surface), 0.04);
}

.pt-row--active {
  background: rgba(46, 125, 50, 0.10);
  border-left-color: #2E7D32;
}

.pt-row--active:hover {
  background: rgba(46, 125, 50, 0.14);
}

.pt-row--loan-active {
  background: rgba(121, 85, 72, 0.12);
  border-left-color: #6D4C41;
}

.pt-row-main {
  flex: 1;
  min-width: 0;
}

.pt-row-name {
  font-weight: 600;
  font-size: 14px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.pt-row--active .pt-row-name {
  color: #1B5E20;
}

.pt-row-meta {
  font-size: 12px;
  color: rgba(var(--v-theme-on-surface), 0.6);
}

.pt-row-count {
  display: inline-flex;
  align-items: center;
  gap: 2px;
  flex-shrink: 0;
  font-size: 12px;
  color: rgba(var(--v-theme-on-surface), 0.55);
}

.pt-empty {
  padding: 24px 12px;
  text-align: center;
  font-size: 13px;
  color: rgba(var(--v-theme-on-surface), 0.5);
}

/* --- 右側範本內容 --- */
.pt-main {
  min-width: 0;
  /* 手機切換到範本內容時，避開左上角全站漢堡鈕 */
  scroll-margin-top: 60px;
}

.pt-detail-head {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  padding: 10px 12px 10px 16px;
  margin-bottom: 12px;
  border-left: 4px solid #2E7D32;
  border-radius: 4px;
  background: rgba(46, 125, 50, 0.06);
}

.pt-detail-title {
  flex: 1;
  min-width: 0;
  word-break: break-word;
}

.pt-detail-actions {
  display: flex;
  flex-shrink: 0;
}

.pt-items--split {
  display: grid;
  grid-template-columns: minmax(320px, 5fr) minmax(0, 6fr);
  gap: 16px;
  align-items: start;
}

.drag-handle {
  cursor: move;
}

.gap-2 {
  gap: 8px;
}

/* --- 左側期款項目清單 --- */
.item-list-panel {
  overflow: hidden;
}

.item-row {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  cursor: pointer;
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
  transition: background 0.15s ease;
}

.item-row:hover {
  background: rgba(0, 0, 0, 0.03);
}

/* 正在右側編輯的項目：綠底 + 左側綠條 */
.item-row--active {
  background: rgba(46, 125, 50, 0.10);
  border-left: 3px solid #2E7D32;
  padding-left: 9px;
}

.item-row--active:hover {
  background: rgba(46, 125, 50, 0.14);
}

.item-row--child {
  padding-left: 36px;
  background: rgba(0, 0, 0, 0.015);
}

.item-row--child.item-row--active {
  padding-left: 33px;
  background: rgba(46, 125, 50, 0.10);
}

.order-badge {
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: #E8F5E9;
  color: #2E7D32;
  font-size: 12px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.item-row-main {
  flex: 1;
  min-width: 0;
}

/* % 與試算金額上下排列，靠右對齊 */
.item-row-value {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 2px;
  flex-shrink: 0;
}

.item-amount {
  font-size: 13px;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}

/* --- 試算 --- */
.trial-bar {
  padding: 4px 12px 12px;
  max-width: 280px;
}

/* 隱藏數字欄位的上下調整箭頭 */
.trial-bar :deep(input[type="number"]) {
  -moz-appearance: textfield;
  appearance: textfield;
}

.trial-bar :deep(input[type="number"]::-webkit-inner-spin-button),
.trial-bar :deep(input[type="number"]::-webkit-outer-spin-button) {
  -webkit-appearance: none;
  margin: 0;
}

.trial-sum {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  font-weight: 700;
  background: rgba(46, 125, 50, 0.06);
  border-top: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
}

.trial-sum-value {
  margin-left: auto;
  font-size: 15px;
  font-variant-numeric: tabular-nums;
}

.item-row-name {
  font-weight: 600;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* --- 項目編輯區（寬螢幕內嵌） --- */
.editor-sticky {
  position: sticky;
  top: 16px;
}

.editor-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 320px;
  border-style: dashed;
}
</style>