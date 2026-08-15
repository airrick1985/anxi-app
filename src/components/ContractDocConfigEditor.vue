<template>
  <v-card flat class="pa-2">
    <!-- 標題列 -->
    <div class="d-flex align-center flex-wrap ga-2 mb-3">
      <div class="text-h6">
        <v-icon class="mr-1">mdi-file-document-edit-outline</v-icon>
        合約製作範本
      </div>
      <v-chip v-if="config" size="small" variant="tonal"
        :color="config.templateName ? 'primary' : 'grey'"
        prepend-icon="mdi-tag-outline">
        {{ config.templateName ? `目前範本：${config.templateName}` : '自訂設定（未套用範本）' }}
      </v-chip>
      <v-spacer />
      <template v-if="canEdit">
        <v-menu>
          <template #activator="{ props: mp }">
            <v-btn v-bind="mp" variant="tonal" prepend-icon="mdi-file-import-outline"
              :loading="applyingTemplate" @click="loadGlobalTemplatesOnce">套用全域範本</v-btn>
          </template>
          <v-list density="compact">
            <v-list-item v-if="globalTemplatesLoading" title="載入中…" disabled />
            <v-list-item v-else-if="!globalTemplates.length" title="尚無全域範本" disabled />
            <v-list-item v-for="t in globalTemplates" :key="t.id" :title="t.name"
              :subtitle="`${(t.config?.pages || []).length} 頁`" @click="applyTemplate(t)" />
            <v-divider />
            <v-list-item title="管理全域範本…" prepend-icon="mdi-cog-outline" :to="'/contract-doc-templates'" />
          </v-list>
        </v-menu>
        <v-btn v-if="config" variant="tonal" prepend-icon="mdi-content-save-plus-outline"
          @click="openSaveAsTemplate">另存為全域範本</v-btn>
        <v-btn v-if="config" color="primary" variant="flat" prepend-icon="mdi-content-save"
          :loading="saving" @click="saveConfig">儲存設定</v-btn>
      </template>
    </div>

    <v-alert v-if="!canEdit" type="info" variant="tonal" density="compact" class="mb-3">
      唯讀模式：僅超級管理員 / 系統管理員可編輯合約製作範本。
    </v-alert>

    <!-- 載入中 -->
    <div v-if="loading" class="d-flex justify-center pa-8">
      <v-progress-circular indeterminate color="primary" />
    </div>

    <!-- 尚未設定 -->
    <v-card v-else-if="!config" class="pa-8 text-center" variant="outlined">
      <v-icon size="48" color="grey">mdi-file-document-plus-outline</v-icon>
      <div class="text-body-1 mt-3 mb-4">本建案尚未設定合約製作範本。</div>
      <v-btn v-if="canEdit" color="primary" variant="flat" prepend-icon="mdi-plus"
        @click="initDefaultConfig">建立預設範本設定</v-btn>
      <div v-else class="text-caption text-grey">請聯繫超級管理員 / 系統管理員建立。</div>
    </v-card>

    <template v-else>
      <!-- 試算戶別 -->
      <v-card variant="outlined" class="pa-3 mb-4">
        <div class="d-flex align-center flex-wrap ga-3">
          <div class="text-subtitle-2">
            <v-icon size="small" class="mr-1">mdi-calculator-variant-outline</v-icon>
            試算戶別（供公式即時預覽）
          </div>
          <v-autocomplete v-model="trialUnitId" :items="trialUnitOptions"
            item-title="label" item-value="id"
            density="compact" variant="outlined" hide-details clearable
            placeholder="選擇戶別試算" style="max-width: 280px;"
            :loading="unitsLoading" @update:menu="loadUnitsOnce" />
          <template v-if="trialUnit">
            <v-chip size="small" color="primary" variant="tonal">成交總價 {{ fmt(trialBaseContext.total) }} 萬</v-chip>
            <v-chip size="small" variant="tonal">房屋價款 {{ fmt(trialBaseContext.housePrice) }} 萬</v-chip>
            <v-chip size="small" variant="tonal">土地價款 {{ fmt(trialBaseContext.landPrice) }} 萬</v-chip>
            <v-chip v-if="trialBaseError" size="small" color="error" variant="tonal">{{ trialBaseError }}</v-chip>
          </template>
        </div>
      </v-card>

      <v-expansion-panels v-model="openPanels" multiple variant="accordion">
        <!-- ============ 頁面組合 ============ -->
        <v-expansion-panel value="pages">
          <v-expansion-panel-title>
            <v-icon class="mr-2">mdi-file-multiple-outline</v-icon>
            頁面組合
            <v-chip size="x-small" class="ml-2" variant="tonal">{{ config.pages.length }} 頁</v-chip>
          </v-expansion-panel-title>
          <v-expansion-panel-text>
            <draggable v-model="config.pages" item-key="id" handle=".drag-handle" :disabled="!canEdit">
              <template #item="{ element: page, index: pIdx }">
                <v-card variant="outlined" class="mb-3">
                  <div class="d-flex align-center pa-2 page-header">
                    <v-icon class="drag-handle cursor-move mr-2 text-grey" v-if="canEdit">mdi-drag</v-icon>
                    <v-icon class="mr-2" size="small">{{ pageTypeIcon(page.type) }}</v-icon>
                    <span class="text-subtitle-2 mr-2">{{ page.title }}</span>
                    <v-chip size="x-small" variant="tonal">{{ pageTypeLabel(page.type) }}</v-chip>
                    <v-spacer />
                    <v-switch v-model="page.enabled" color="primary" density="compact" hide-details
                      :disabled="!canEdit" label="預設啟用" class="mr-2 flex-grow-0" />
                    <v-btn icon size="small" variant="text" @click="togglePageExpand(page.id)">
                      <v-icon>{{ expandedPages.includes(page.id) ? 'mdi-chevron-up' : 'mdi-chevron-down' }}</v-icon>
                    </v-btn>
                    <v-btn v-if="canEdit" icon size="small" variant="text" color="error" @click="removePage(pIdx)">
                      <v-icon>mdi-delete-outline</v-icon>
                    </v-btn>
                  </div>
                  <v-expand-transition>
                    <div v-show="expandedPages.includes(page.id)" class="pa-3 pt-1">
                      <v-row dense>
                        <v-col cols="12" sm="4">
                          <v-text-field v-model="page.title" label="頁面名稱" density="compact"
                            variant="outlined" hide-details :disabled="!canEdit" />
                        </v-col>
                        <v-col cols="6" sm="2">
                          <v-select v-model="page.paper.size" :items="PAPER_SIZES" label="紙張"
                            density="compact" variant="outlined" hide-details :disabled="!canEdit" />
                        </v-col>
                        <v-col cols="6" sm="2">
                          <v-select v-model="page.paper.orientation" :items="ORIENTATIONS"
                            item-title="label" item-value="value" label="方向"
                            density="compact" variant="outlined" hide-details :disabled="!canEdit" />
                        </v-col>
                        <v-col cols="6" sm="2">
                          <v-select v-model="page.repeatCount" :items="[1, 2, 3]" label="同頁重複份數"
                            density="compact" variant="outlined" hide-details :disabled="!canEdit"
                            hint="一頁內放多份（裁剪浮貼）" />
                        </v-col>
                        <v-col cols="6" sm="2">
                          <v-select :model-value="page.pageCopies || 1"
                            @update:model-value="page.pageCopies = $event"
                            :items="[1, 2, 3, 4, 5]" label="重複頁數"
                            density="compact" variant="outlined" hide-details :disabled="!canEdit"
                            hint="整頁複製 N 頁" />
                        </v-col>
                        <v-col v-if="page.type !== 'contractAttachments'" cols="6" sm="3">
                          <v-select :model-value="page.font || null"
                            @update:model-value="page.font = $event"
                            :items="[{ value: null, label: '預設（依頁型）' }, ...DOC_FONT_OPTIONS]"
                            item-title="label" item-value="value" label="字體"
                            density="compact" variant="outlined" hide-details :disabled="!canEdit" />
                        </v-col>
                      </v-row>

                      <!-- ===== 拆款表選項 ===== -->
                      <template v-if="page.type === 'breakdown'">
                        <v-divider class="my-3" />
                        <v-alert type="info" variant="tonal" density="compact" class="mb-3 text-caption">
                          本頁總價基準自動判定：一般戶＝成交總價；配套合約戶別（如毛胚合約）＝配套房屋總價。
                          「配套價格」的拆款表請另外新增「裝修工程會辦單」頁面（配套戶會同時產出兩張會辦單）。
                        </v-alert>
                        <v-text-field v-model="page.options.headerTitle" label="表頭標題" density="compact"
                          variant="outlined" hide-details class="mb-3" style="max-width: 320px;" :disabled="!canEdit" />

                        <div class="text-subtitle-2 mb-1">自由輸入欄位（贈品 / 仲人費…）</div>
                        <v-table density="compact" class="mb-2 option-table">
                          <thead>
                            <tr><th style="width:35%">欄位名稱</th><th style="width:20%">型態</th><th>預設值</th><th style="width:48px"></th></tr>
                          </thead>
                          <tbody>
                            <tr v-for="(f, fIdx) in page.options.freeFields" :key="f.key">
                              <td><v-text-field v-model="f.label" density="compact" variant="plain" hide-details :disabled="!canEdit" /></td>
                              <td>
                                <v-select v-model="f.type" :items="[{ title: '文字', value: 'text' }, { title: '數字', value: 'number' }]"
                                  density="compact" variant="plain" hide-details :disabled="!canEdit" />
                              </td>
                              <td><v-text-field v-model="f.default" density="compact" variant="plain" hide-details :disabled="!canEdit" /></td>
                              <td>
                                <v-btn v-if="canEdit" icon size="x-small" variant="text" color="error"
                                  @click="page.options.freeFields.splice(fIdx, 1)">
                                  <v-icon>mdi-close</v-icon>
                                </v-btn>
                              </td>
                            </tr>
                          </tbody>
                        </v-table>
                        <v-btn v-if="canEdit" size="small" variant="tonal" prepend-icon="mdi-plus"
                          @click="addFreeField(page)">新增欄位</v-btn>

                        <div class="text-subtitle-2 mb-1 mt-4">簽核欄位（富宇主管 / 承辦…）</div>
                        <v-table density="compact" class="mb-2 option-table">
                          <thead>
                            <tr><th style="width:35%">欄位名稱</th><th style="width:25%">來源</th><th>預設值</th><th style="width:48px"></th></tr>
                          </thead>
                          <tbody>
                            <tr v-for="(f, fIdx) in page.options.signFields" :key="fIdx">
                              <td><v-text-field v-model="f.label" density="compact" variant="plain" hide-details :disabled="!canEdit" /></td>
                              <td>
                                <v-select v-model="f.source"
                                  :items="[{ title: '手動輸入', value: 'manual' }, { title: '系統帶入銷售人員（唯讀）', value: 'salesperson' }]"
                                  density="compact" variant="plain" hide-details :disabled="!canEdit"
                                  @update:model-value="f.readonly = ($event === 'salesperson')" />
                              </td>
                              <td>
                                <v-text-field v-if="f.source === 'manual'" v-model="f.default"
                                  density="compact" variant="plain" hide-details :disabled="!canEdit" />
                                <span v-else class="text-caption text-grey">系統自動帶入</span>
                              </td>
                              <td>
                                <v-btn v-if="canEdit" icon size="x-small" variant="text" color="error"
                                  @click="page.options.signFields.splice(fIdx, 1)">
                                  <v-icon>mdi-close</v-icon>
                                </v-btn>
                              </td>
                            </tr>
                          </tbody>
                        </v-table>
                        <v-btn v-if="canEdit" size="small" variant="tonal" prepend-icon="mdi-plus"
                          @click="page.options.signFields.push({ label: '', source: 'manual', default: '', readonly: false })">新增簽核欄</v-btn>
                      </template>

                      <!-- ===== 繳款銀行選項 ===== -->
                      <template v-else-if="page.type === 'bankAccounts'">
                        <v-divider class="my-3" />
                        <v-select v-model="page.options.bankSetIds" :items="config.bankSets"
                          item-title="label" item-value="id" multiple chips closable-chips
                          label="本頁顯示的銀行組" density="compact" variant="outlined" hide-details
                          class="mb-3" :disabled="!canEdit" />
                        <div class="d-flex align-center ga-4 flex-wrap">
                          <v-switch v-model="page.options.showQr" color="primary" density="compact" hide-details
                            label="顯示客戶資料卡 QR 區塊" :disabled="!canEdit" />
                          <v-text-field v-if="page.options.showQr" v-model="page.options.qrLabel" label="QR 區塊標題"
                            density="compact" variant="outlined" hide-details style="max-width: 280px;" :disabled="!canEdit" />
                        </div>
                      </template>

                      <!-- ===== 付款明細表選項 ===== -->
                      <template v-else-if="page.type === 'paymentDetail'">
                        <v-divider class="my-3" />
                        <v-select v-model="page.options.mode"
                          :items="[{ title: '房屋 + 土地同頁', value: 'combined' }, { title: '房屋版（僅房屋款）', value: 'house' }, { title: '土地版（僅土地款）', value: 'land' }, { title: '配套款版（僅配套合約戶別）', value: 'package' }]"
                          label="版本" density="compact" variant="outlined" hide-details class="mb-3"
                          style="max-width: 320px;" :disabled="!canEdit" />
                        <div v-if="page.options.mode === 'package'" class="text-caption text-grey mb-3">
                          配套款版：期款取「配套期款」範本（裝修期款），總價 = 配套價格；僅配套合約戶別（如毛胚合約）會匯出本頁。
                        </div>
                        <v-textarea v-model="page.options.noteText" label="頁尾備註文字" density="compact"
                          variant="outlined" rows="2" hide-details class="mb-3" :disabled="!canEdit" />
                        <v-switch v-model="page.options.showSignColumn" color="primary" density="compact" hide-details
                          label="顯示「收款人簽章」欄" :disabled="!canEdit" />
                      </template>

                      <!-- ===== 合約加註選項 ===== -->
                      <template v-else-if="page.type === 'contractNotes'">
                        <v-divider class="my-3" />
                        <div class="d-flex align-center ga-4 flex-wrap">
                          <v-text-field v-model.number="page.options.defaultFontSize" type="number" label="預設字體大小(pt)"
                            density="compact" variant="outlined" hide-details style="max-width: 180px;" :disabled="!canEdit" />
                          <v-switch v-model="page.options.showBuyerSignLine" color="primary" density="compact" hide-details
                            label="顯示「買方簽名」列" :disabled="!canEdit" />
                        </div>
                      </template>

                      <!-- ===== 合約附圖選項 ===== -->
                      <template v-else-if="page.type === 'contractAttachments'">
                        <v-divider class="my-3" />
                        <div class="d-flex align-center ga-4 flex-wrap">
                          <v-text-field v-model="page.options.sourceField" label="戶別欄位 key"
                            density="compact" variant="outlined" hide-details style="max-width: 280px;"
                            hint="預設 contractDrawingFolderUrl（合約分戶圖位置）" persistent-hint :disabled="!canEdit" />
                          <v-select v-model="page.options.fitMode"
                            :items="[{ title: '等比置入（fit）', value: 'fit' }, { title: '填滿頁面（fill）', value: 'fill' }]"
                            label="圖檔縮放" density="compact" variant="outlined" hide-details
                            style="max-width: 220px;" :disabled="!canEdit" />
                        </div>
                        <div class="text-caption text-grey mt-2">
                          僅 PDF 匯出包含本頁；EXCEL 匯出將自動跳過。戶別欄位空值時本頁不匯出。
                        </div>
                      </template>

                      <!-- ===== 裝修工程會辦單選項 ===== -->
                      <template v-else-if="page.type === 'decorationBreakdown'">
                        <v-divider class="my-3" />
                        <v-text-field v-model="page.options.headerTitle" label="表頭標題" density="compact"
                          variant="outlined" hide-details class="mb-3" style="max-width: 320px;" :disabled="!canEdit" />
                        <div class="text-subtitle-2 mb-1">簽核欄位（與拆款表共用填寫值）</div>
                        <v-table density="compact" class="mb-2 option-table">
                          <thead>
                            <tr><th style="width:35%">欄位名稱</th><th style="width:25%">來源</th><th>預設值</th><th style="width:48px"></th></tr>
                          </thead>
                          <tbody>
                            <tr v-for="(f, fIdx) in page.options.signFields" :key="fIdx">
                              <td><v-text-field v-model="f.label" density="compact" variant="plain" hide-details :disabled="!canEdit" /></td>
                              <td>
                                <v-select v-model="f.source"
                                  :items="[{ title: '手動輸入', value: 'manual' }, { title: '系統帶入銷售人員（唯讀）', value: 'salesperson' }]"
                                  density="compact" variant="plain" hide-details :disabled="!canEdit"
                                  @update:model-value="f.readonly = ($event === 'salesperson')" />
                              </td>
                              <td>
                                <v-text-field v-if="f.source === 'manual'" v-model="f.default"
                                  density="compact" variant="plain" hide-details :disabled="!canEdit" />
                                <span v-else class="text-caption text-grey">系統自動帶入</span>
                              </td>
                              <td>
                                <v-btn v-if="canEdit" icon size="x-small" variant="text" color="error"
                                  @click="page.options.signFields.splice(fIdx, 1)">
                                  <v-icon>mdi-close</v-icon>
                                </v-btn>
                              </td>
                            </tr>
                          </tbody>
                        </v-table>
                        <v-btn v-if="canEdit" size="small" variant="tonal" prepend-icon="mdi-plus"
                          @click="page.options.signFields.push({ label: '', source: 'manual', default: '', readonly: false })">新增簽核欄</v-btn>
                        <div class="text-caption text-grey mt-2">
                          本頁僅配套合約戶別（銷控設定「配套合約方式」，如毛胚合約）匯出；總價與付款明細以「配套價格」（成交總價 − 配套房屋總價）計算，期款取「配套期款」範本。
                        </div>
                      </template>

                      <!-- ===== 裝修付款明細表選項 ===== -->
                      <template v-else-if="page.type === 'decorationPaymentDetail'">
                        <v-divider class="my-3" />
                        <div class="d-flex align-center ga-4 flex-wrap mb-3">
                          <v-text-field v-model="page.options.headerTitle" label="表頭標題" density="compact"
                            variant="outlined" hide-details style="max-width: 260px;" :disabled="!canEdit" />
                          <v-text-field v-model="page.options.siteLabel" label="左上標籤（工地名稱）" density="compact"
                            variant="outlined" hide-details style="max-width: 220px;" :disabled="!canEdit" />
                          <v-text-field v-model="page.options.unitLabel" label="戶別標籤（房屋代號）" density="compact"
                            variant="outlined" hide-details style="max-width: 220px;" :disabled="!canEdit" />
                        </div>
                        <v-textarea v-model="page.options.noteText" label="頁尾備註文字（空白不顯示）" density="compact"
                          variant="outlined" rows="2" hide-details :disabled="!canEdit" />
                        <div class="text-caption text-grey mt-2">
                          金額以國字大寫（如「零 佰 貳 拾 陸 萬元整」）呈現；期別名稱（含日期）取自「配套期款」範本的期別名稱。本頁僅配套合約戶別匯出。
                        </div>
                      </template>
                    </div>
                  </v-expand-transition>
                </v-card>
              </template>
            </draggable>

            <v-menu v-if="canEdit">
              <template #activator="{ props: menuProps }">
                <v-btn v-bind="menuProps" color="primary" variant="tonal" prepend-icon="mdi-plus">新增頁面</v-btn>
              </template>
              <v-list density="compact">
                <v-list-item v-for="pt in PAGE_TYPES" :key="pt.type" :prepend-icon="pt.icon"
                  :title="pt.label" :subtitle="pt.description" @click="addPage(pt.type)" />
              </v-list>
            </v-menu>
          </v-expansion-panel-text>
        </v-expansion-panel>

        <!-- ============ 價款公式 ============ -->
        <v-expansion-panel value="priceFormulas">
          <v-expansion-panel-title>
            <v-icon class="mr-2">mdi-function-variant</v-icon>
            價款公式（房屋款 / 主建物價款…）
          </v-expansion-panel-title>
          <v-expansion-panel-text>
            <div class="text-caption text-grey mb-2">
              依序計算，排在前面的項目結果可被後面的公式引用。房屋價款 / 土地價款由建案「房土比公式」（建案設定分頁）計算後帶入。
            </div>
            <draggable v-model="config.priceFormulas" item-key="key" handle=".drag-handle" :disabled="!canEdit">
              <template #item="{ element: field, index: fIdx }">
                <v-card variant="outlined" class="mb-2 pa-2">
                  <div class="d-flex align-center flex-wrap ga-2">
                    <v-icon class="drag-handle cursor-move text-grey" v-if="canEdit">mdi-drag</v-icon>
                    <v-text-field v-model="field.label" label="項目名稱" density="compact" variant="outlined"
                      hide-details style="max-width: 220px;" :disabled="!canEdit" />
                    <div class="formula-display flex-grow-1">
                      <span class="text-caption text-grey mr-1">公式：</span>
                      <span>{{ priceFormulaDisplay(field, fIdx) }}</span>
                      <span class="text-caption text-grey ml-2">{{ roundingText(field.rounding) }}</span>
                    </div>
                    <v-chip v-if="trialUnit" size="small" variant="tonal"
                      :color="Number.isFinite(trialFieldValues.values[field.key]) && !trialFieldValues.errors[field.key] ? 'primary' : 'error'">
                      {{ trialFieldValues.errors[field.key] ? '公式錯誤' : `${fmt(trialFieldValues.values[field.key])} 萬` }}
                    </v-chip>
                    <v-switch v-model="field.showOnPage" color="primary" density="compact" hide-details
                      label="顯示" class="flex-grow-0" :disabled="!canEdit" />
                    <v-btn v-if="canEdit" size="small" variant="tonal" prepend-icon="mdi-pencil"
                      @click="openPriceFormulaDialog(fIdx)">編輯公式</v-btn>
                    <v-btn v-if="canEdit" icon size="small" variant="text" color="error"
                      @click="config.priceFormulas.splice(fIdx, 1)">
                      <v-icon>mdi-delete-outline</v-icon>
                    </v-btn>
                  </div>
                </v-card>
              </template>
            </draggable>
            <v-btn v-if="canEdit" color="primary" variant="tonal" prepend-icon="mdi-plus" @click="addPriceFormula">
              新增價款項目
            </v-btn>
          </v-expansion-panel-text>
        </v-expansion-panel>

        <!-- ============ 期款房/土拆分 ============ -->
        <v-expansion-panel value="split">
          <v-expansion-panel-title>
            <v-icon class="mr-2">mdi-call-split</v-icon>
            期款房屋 / 土地拆分規則
          </v-expansion-panel-title>
          <v-expansion-panel-text>
            <div class="text-caption text-grey mb-3">
              每期「土地款」以公式計算，「房屋款 = 期款金額 − 土地款」。未指定的期別套用預設公式（預設 0 = 全屬房屋款）。
            </div>

            <v-card variant="outlined" class="pa-2 mb-3">
              <div class="d-flex align-center flex-wrap ga-2">
                <span class="text-subtitle-2">未指定期別的預設土地款公式：</span>
                <span class="formula-display">{{ splitTokensDisplay(config.installmentSplitRules.defaultLandTokens) }}</span>
                <v-btn v-if="canEdit" size="small" variant="tonal" prepend-icon="mdi-pencil"
                  @click="openSplitDefaultDialog">編輯</v-btn>
              </div>
            </v-card>

            <v-select v-model="splitPreviewTemplateId" :items="templateOptions"
              item-title="label" item-value="id" label="以期款範本列出期別（供設定與試算）"
              density="compact" variant="outlined" hide-details class="mb-3" style="max-width: 420px;"
              :loading="templatesLoading" @update:menu="loadTemplatesOnce" />

            <template v-if="splitPreviewRows.length">
              <v-table density="compact" class="option-table">
                <thead>
                  <tr>
                    <th>期別名稱</th>
                    <th>土地款公式</th>
                    <th v-if="trialUnit" class="text-right">期款金額</th>
                    <th v-if="trialUnit" class="text-right">土地款</th>
                    <th v-if="trialUnit" class="text-right">房屋款</th>
                    <th style="width:120px"></th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="row in splitTrialRows" :key="row.name">
                    <td>{{ row.name }}</td>
                    <td>
                      <span v-if="ruleFor(row.name)" class="formula-display">{{ splitTokensDisplay(ruleFor(row.name).landTokens) }}</span>
                      <span v-else class="text-caption text-grey">預設</span>
                    </td>
                    <td v-if="trialUnit" class="text-right">{{ fmt(row.amount) }}</td>
                    <td v-if="trialUnit" class="text-right">{{ fmt(row.landAmount) }}</td>
                    <td v-if="trialUnit" class="text-right">{{ fmt(row.houseAmount) }}</td>
                    <td class="text-right">
                      <v-btn v-if="canEdit" size="x-small" variant="tonal" @click="openSplitRuleDialog(row.name)">
                        {{ ruleFor(row.name) ? '編輯' : '指定公式' }}
                      </v-btn>
                      <v-btn v-if="canEdit && ruleFor(row.name)" size="x-small" variant="text" color="error"
                        class="ml-1" @click="removeSplitRule(row.name)">清除</v-btn>
                    </td>
                  </tr>
                </tbody>
                <tfoot v-if="trialUnit">
                  <tr class="font-weight-bold">
                    <td>合計</td>
                    <td></td>
                    <td class="text-right">{{ fmt(splitTrialSums.amount) }}</td>
                    <td class="text-right" :class="{ 'text-error': !splitTrialSums.landOk }">{{ fmt(splitTrialSums.land) }}</td>
                    <td class="text-right">{{ fmt(splitTrialSums.house) }}</td>
                    <td></td>
                  </tr>
                </tfoot>
              </v-table>
              <v-alert v-if="trialUnit && !splitTrialSums.landOk" type="warning" variant="tonal" density="compact" class="mt-2">
                各期土地款合計 {{ fmt(splitTrialSums.land) }} 萬 ≠ 土地價款 {{ fmt(trialBaseContext.landPrice) }} 萬，請調整拆分公式。
              </v-alert>
            </template>
            <div v-else class="text-caption text-grey">請先選擇期款範本以列出期別。</div>

            <!-- 已設定但目前範本比對不到的規則 -->
            <template v-if="orphanRules.length">
              <v-alert type="warning" variant="tonal" density="compact" class="mt-3">
                以下規則在目前選擇的期款範本中比對不到期別名稱（將視為未指定）：
                <div class="d-flex flex-wrap ga-1 mt-1">
                  <v-chip v-for="r in orphanRules" :key="r.itemName" size="small" closable
                    :disabled="!canEdit" @click:close="removeSplitRule(r.itemName)">{{ r.itemName }}</v-chip>
                </div>
              </v-alert>
            </template>
          </v-expansion-panel-text>
        </v-expansion-panel>

        <!-- ============ 磋商條款庫 ============ -->
        <v-expansion-panel value="clauses">
          <v-expansion-panel-title>
            <v-icon class="mr-2">mdi-text-box-multiple-outline</v-icon>
            磋商條款庫
            <v-chip size="x-small" class="ml-2" variant="tonal">{{ config.clauseLibrary.length }} 則</v-chip>
          </v-expansion-panel-title>
          <v-expansion-panel-text>
            <div class="text-caption text-grey mb-2">
              套用時系統依戶別「是否首購」自動預選符合條件的條款，銷售端可再勾選調整。
            </div>
            <v-card v-for="(clause, cIdx) in config.clauseLibrary" :key="clause.id" variant="outlined" class="mb-3 pa-3">
              <v-row dense>
                <v-col cols="12" sm="4">
                  <v-text-field v-model="clause.title" label="條款名稱" density="compact" variant="outlined"
                    hide-details :disabled="!canEdit" />
                </v-col>
                <v-col cols="6" sm="3">
                  <v-select v-model="clause.condition" :items="CLAUSE_CONDITIONS"
                    item-title="label" item-value="value" label="適用條件"
                    density="compact" variant="outlined" hide-details :disabled="!canEdit" />
                </v-col>
                <v-col cols="6" sm="3" class="d-flex align-center">
                  <v-switch v-model="clause.isDefault" color="primary" density="compact" hide-details
                    label="預設勾選" :disabled="!canEdit" />
                </v-col>
                <v-col cols="12" sm="2" class="d-flex align-center justify-end">
                  <v-btn v-if="canEdit" icon size="small" variant="text" color="error"
                    @click="config.clauseLibrary.splice(cIdx, 1)">
                    <v-icon>mdi-delete-outline</v-icon>
                  </v-btn>
                </v-col>
                <v-col cols="12">
                  <v-textarea v-model="clause.content" label="條款內容" density="compact" variant="outlined"
                    rows="4" auto-grow hide-details :disabled="!canEdit" />
                </v-col>
              </v-row>
            </v-card>
            <v-btn v-if="canEdit" color="primary" variant="tonal" prepend-icon="mdi-plus"
              @click="config.clauseLibrary.push(newClause())">新增條款</v-btn>
          </v-expansion-panel-text>
        </v-expansion-panel>

        <!-- ============ 繳款銀行組 ============ -->
        <v-expansion-panel value="banks">
          <v-expansion-panel-title>
            <v-icon class="mr-2">mdi-bank-outline</v-icon>
            繳款銀行組
            <v-chip size="x-small" class="ml-2" variant="tonal">{{ config.bankSets.length }} 組</v-chip>
          </v-expansion-panel-title>
          <v-expansion-panel-text>
            <div class="text-caption text-grey mb-2">
              「戶別」來源直接引用該戶的匯款銀行欄位（Excel 上傳/戶別編輯維護）；「自訂」為建案固定帳戶（如裝潢款）。
            </div>
            <v-card v-for="(set, sIdx) in config.bankSets" :key="set.id" variant="outlined" class="mb-3 pa-3">
              <v-row dense>
                <v-col cols="12" sm="3">
                  <v-text-field v-model="set.label" label="項目名稱（如 房屋款）" density="compact" variant="outlined"
                    hide-details :disabled="!canEdit" />
                </v-col>
                <v-col cols="12" sm="4">
                  <v-select v-model="set.source" :items="BANK_SET_SOURCES"
                    item-title="label" item-value="value" label="資料來源"
                    density="compact" variant="outlined" hide-details :disabled="!canEdit" />
                </v-col>
                <v-col cols="12" sm="2" class="d-flex align-center justify-end">
                  <v-btn v-if="canEdit" icon size="small" variant="text" color="error"
                    @click="config.bankSets.splice(sIdx, 1)">
                    <v-icon>mdi-delete-outline</v-icon>
                  </v-btn>
                </v-col>
                <template v-if="set.source === 'custom'">
                  <v-col cols="12" sm="4">
                    <v-text-field v-model="set.bankName" label="繳款銀行名稱" density="compact" variant="outlined"
                      hide-details :disabled="!canEdit" />
                  </v-col>
                  <v-col cols="12" sm="4">
                    <v-text-field v-model="set.accountName" label="戶名" density="compact" variant="outlined"
                      hide-details :disabled="!canEdit" />
                  </v-col>
                  <v-col cols="12" sm="4">
                    <v-text-field v-model="set.account" label="帳號" density="compact" variant="outlined"
                      hide-details :disabled="!canEdit" />
                  </v-col>
                </template>
              </v-row>
            </v-card>
            <v-btn v-if="canEdit" color="primary" variant="tonal" prepend-icon="mdi-plus"
              @click="config.bankSets.push(newBankSet())">新增銀行組</v-btn>
          </v-expansion-panel-text>
        </v-expansion-panel>
      </v-expansion-panels>
    </template>

    <!-- ============ 另存為全域範本 Dialog ============ -->
    <v-dialog v-model="saveAsDialog.show" max-width="480">
      <v-card>
        <v-card-title>另存為全域範本</v-card-title>
        <v-card-text>
          <v-text-field v-model="saveAsDialog.name" label="範本名稱" variant="outlined" density="compact" class="mb-2" />
          <v-select v-model="saveAsDialog.overwriteId" :items="saveAsOverwriteOptions"
            item-title="label" item-value="id" label="覆蓋既有範本（可選）" variant="outlined"
            density="compact" clearable hint="不選擇時建立新範本" persistent-hint />
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="saveAsDialog.show = false">取消</v-btn>
          <v-btn color="primary" variant="flat" :loading="saveAsDialog.saving"
            :disabled="!saveAsDialog.name" @click="commitSaveAsTemplate">儲存</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- ============ 公式編輯 Dialog ============ -->
    <v-dialog v-model="formulaDialog.show" max-width="760" scrollable>
      <v-card v-if="formulaDialog.show">
        <v-card-title class="d-flex align-center">
          {{ formulaDialog.title }}
          <v-spacer />
          <v-btn icon variant="text" @click="formulaDialog.show = false"><v-icon>mdi-close</v-icon></v-btn>
        </v-card-title>
        <v-card-text>
          <TokenFormulaEditor
            :formula="formulaDialog.formula"
            :formula-name="formulaDialog.name"
            :ref-groups="formulaDialog.refGroups"
            :preview-context="formulaDialog.previewContext"
            :preview-label="trialUnit ? `戶別 ${trialUnit.unitId}` : ''"
            @update="formulaDialog.formula = $event" />
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="formulaDialog.show = false">取消</v-btn>
          <v-btn color="primary" variant="flat" @click="commitFormulaDialog">套用</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-card>
</template>

<script setup>
import { ref, computed, onMounted, reactive } from 'vue';
import { useRoute } from 'vue-router';
import { useToast } from 'vue-toastification';
import draggable from 'vuedraggable';
import { useUserStore } from '@/store/user';
import { useProjectStore } from '@/store/projectStore';
import {
  fetchContractDocConfig, setContractDocConfig,
  fetchContractDocTemplates, setContractDocTemplate,
  fetchPaymentTermTemplates, fetchSalesHouseholdsOnce,
} from '@/api';
import {
  PAGE_TYPES, PAGE_TYPE_MAP, PAPER_SIZES, ORIENTATIONS, CLAUSE_CONDITIONS, BANK_SET_SOURCES,
  DOC_FONT_OPTIONS,
  buildDefaultContractDocConfig, buildNewPage, newClause, newBankSet, newPriceFormulaField, newFreeField,
} from '@/utils/contractDocDefaults';
import {
  buildContractRefDefinitions, INSTALLMENT_SPLIT_REF_DEFINITIONS,
  buildContractBaseContext, computeContractPriceFields, computeInstallmentSplit,
  formulaToDisplayString, roundingToDisplayString, refDefinitionsToMap,
} from '@/composables/usePriceFormula';
import { runNewCalculationEngine } from '@/utils/paymentCalculation';
import TokenFormulaEditor from '@/components/TokenFormulaEditor.vue';

const route = useRoute();
const toast = useToast();
const userStore = useUserStore();
const projectStore = useProjectStore();

const projectId = ref(route.params.projectId);

const loading = ref(true);
const saving = ref(false);
const config = ref(null);
const openPanels = ref(['pages']);
const expandedPages = ref([]);

const canEdit = computed(() => {
  const roles = userStore.currentUserRoles || [];
  return roles.includes('超級管理員') || roles.includes('系統管理員');
});

onMounted(async () => {
  try {
    projectStore.setCurrentProject(projectId.value);
    config.value = await fetchContractDocConfig(projectId.value);
  } catch (e) {
    console.error('讀取合約製作設定失敗:', e);
    toast.error(`讀取合約製作設定失敗：${e.message}`);
  } finally {
    loading.value = false;
  }
});

function initDefaultConfig() {
  config.value = buildDefaultContractDocConfig(projectId.value);
  expandedPages.value = [];
  toast.info('已建立預設範本設定，請調整後按「儲存設定」。');
}

async function saveConfig() {
  if (!config.value) return;
  saving.value = true;
  try {
    const payload = JSON.parse(JSON.stringify(config.value));
    delete payload.id;
    await setContractDocConfig(projectId.value, payload);
    toast.success('合約製作範本已儲存');
  } catch (e) {
    console.error('儲存合約製作設定失敗:', e);
    toast.error(`儲存失敗：${e.message}`);
  } finally {
    saving.value = false;
  }
}

/* ---------- 全域範本：套用 / 另存 ---------- */
const globalTemplates = ref([]);
const globalTemplatesLoading = ref(false);
const globalTemplatesLoaded = ref(false);
const applyingTemplate = ref(false);

async function loadGlobalTemplatesOnce() {
  if (globalTemplatesLoaded.value || globalTemplatesLoading.value) return;
  globalTemplatesLoading.value = true;
  try {
    globalTemplates.value = await fetchContractDocTemplates();
    globalTemplatesLoaded.value = true;
  } catch (e) {
    console.error('讀取全域範本失敗:', e);
    toast.error('讀取全域範本失敗');
  } finally {
    globalTemplatesLoading.value = false;
  }
}

async function applyTemplate(t) {
  if (config.value && !window.confirm(`套用範本「${t.name}」將覆蓋本建案目前的合約製作設定，確認？`)) return;
  applyingTemplate.value = true;
  try {
    const copied = JSON.parse(JSON.stringify(t.config || {}));
    config.value = {
      ...copied,
      projectId: projectId.value,
      templateId: t.id,
      templateName: t.name,
    };
    expandedPages.value = [];
    toast.success(`已套用範本「${t.name}」，請確認後按「儲存設定」。`);
  } finally {
    applyingTemplate.value = false;
  }
}

const saveAsDialog = reactive({ show: false, name: '', overwriteId: null, saving: false });

const saveAsOverwriteOptions = computed(() =>
  globalTemplates.value.map(t => ({ id: t.id, label: t.name })));

function openSaveAsTemplate() {
  loadGlobalTemplatesOnce();
  saveAsDialog.name = config.value?.templateName || '';
  saveAsDialog.overwriteId = null;
  saveAsDialog.show = true;
}

async function commitSaveAsTemplate() {
  saveAsDialog.saving = true;
  try {
    const cfg = JSON.parse(JSON.stringify(config.value));
    delete cfg.id;
    delete cfg.projectId;
    delete cfg.templateId;
    delete cfg.templateName;
    delete cfg.updatedBy;
    delete cfg.updatedAt;
    const docId = saveAsDialog.overwriteId
      || `tpl_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
    await setContractDocTemplate(docId, {
      name: saveAsDialog.name,
      description: '',
      config: cfg,
      createdAt: new Date(),
    });
    toast.success(`全域範本「${saveAsDialog.name}」已儲存`);
    // 本建案設定即與該範本對齊：更新目前範本標示（按「儲存設定」後持久化）
    config.value.templateId = docId;
    config.value.templateName = saveAsDialog.name;
    saveAsDialog.show = false;
    globalTemplatesLoaded.value = false;
    globalTemplates.value = [];
  } catch (e) {
    console.error('另存全域範本失敗:', e);
    toast.error(`另存失敗：${e.message}`);
  } finally {
    saveAsDialog.saving = false;
  }
}

/* ---------- 頁面 ---------- */
function pageTypeLabel(type) { return PAGE_TYPE_MAP[type]?.label || type; }
function pageTypeIcon(type) { return PAGE_TYPE_MAP[type]?.icon || 'mdi-file-outline'; }

function addPage(type) {
  const page = buildNewPage(type);
  if (type === 'bankAccounts') page.options.bankSetIds = config.value.bankSets.map(b => b.id);
  config.value.pages.push(page);
  expandedPages.value.push(page.id);
}

function removePage(idx) {
  if (!window.confirm(`確認刪除頁面「${config.value.pages[idx].title}」？`)) return;
  config.value.pages.splice(idx, 1);
}

function togglePageExpand(id) {
  const i = expandedPages.value.indexOf(id);
  if (i >= 0) expandedPages.value.splice(i, 1);
  else expandedPages.value.push(id);
}

function addFreeField(page) {
  page.options.freeFields.push(newFreeField(page.options.freeFields.map(f => f.key)));
}

/* ---------- 試算戶別 ---------- */
const unitsLoading = ref(false);
const unitsLoaded = ref(false);
const trialUnits = ref([]);
const trialUnitId = ref(null);

async function loadUnitsOnce(open) {
  if (open === false || unitsLoaded.value || unitsLoading.value) return;
  unitsLoading.value = true;
  try {
    const list = await fetchSalesHouseholdsOnce(projectId.value);
    trialUnits.value = list
      .filter(u => u.unitId)
      .sort((a, b) => String(a.unitId).localeCompare(String(b.unitId), 'zh-Hant', { numeric: true }));
    unitsLoaded.value = true;
  } catch (e) {
    console.error('讀取戶別清單失敗:', e);
    toast.error('讀取戶別清單失敗');
  } finally {
    unitsLoading.value = false;
  }
}

const trialUnitOptions = computed(() => trialUnits.value.map(u => ({
  id: u.id,
  label: `${u.unitId}${u.buyerName ? `（${u.buyerName}）` : ''}`,
})));

const trialUnit = computed(() => trialUnits.value.find(u => u.id === trialUnitId.value) || null);

const trialBase = computed(() => {
  if (!trialUnit.value) return { context: {}, error: '' };
  const settings = projectStore.currentProject?.priceFormulaSettings
    || projectStore.getProjectById?.(projectId.value)?.priceFormulaSettings
    || null;
  return buildContractBaseContext(trialUnit.value, settings);
});
const trialBaseContext = computed(() => trialBase.value.context || {});
const trialBaseError = computed(() => trialBase.value.error || '');

const trialFieldValues = computed(() => {
  if (!config.value || !trialUnit.value) return { values: {}, errors: {} };
  return computeContractPriceFields(config.value.priceFormulas, trialBaseContext.value);
});

// 完整 context（基礎 + 價款項目結果），供公式 dialog 預覽與拆分試算
const trialFullContext = computed(() => ({ ...trialBaseContext.value, ...trialFieldValues.value.values }));

/* ---------- 價款公式 ---------- */
function priceFormulaRefGroups(uptoIndex) {
  const defs = buildContractRefDefinitions(config.value?.priceFormulas || [], uptoIndex);
  return [
    { label: '基礎變數', color: 'primary', refs: defs.filter(d => d.group === 'primary') },
    { label: '房土比結果', color: 'deep-purple', refs: defs.filter(d => d.group === 'result') },
    { label: '面積', color: 'teal', refs: defs.filter(d => d.group === 'area') },
    { label: '價款項目（排在前面的）', color: 'orange-darken-3', refs: defs.filter(d => d.group === 'field') },
  ].filter(g => g.refs.length);
}

function priceFormulaDisplay(field, idx) {
  const map = refDefinitionsToMap(buildContractRefDefinitions(config.value?.priceFormulas || [], idx));
  return formulaToDisplayString(field, map);
}

function roundingText(rounding) { return roundingToDisplayString(rounding); }

function addPriceFormula() {
  config.value.priceFormulas.push(newPriceFormulaField(config.value.priceFormulas.map(f => f.key)));
}

/* ---------- 期款範本（拆分試算用） ---------- */
const templatesLoading = ref(false);
const templatesLoaded = ref(false);
const templates = ref([]);
const splitPreviewTemplateId = ref(null);

async function loadTemplatesOnce(open) {
  if (open === false || templatesLoaded.value || templatesLoading.value) return;
  templatesLoading.value = true;
  try {
    const result = await fetchPaymentTermTemplates(projectId.value);
    templates.value = result.status === 'success' ? (result.data || []) : [];
    templatesLoaded.value = true;
  } catch (e) {
    console.error('讀取期款範本失敗:', e);
    toast.error('讀取期款範本失敗');
  } finally {
    templatesLoading.value = false;
  }
}

const templateOptions = computed(() => templates.value.map(t => ({
  id: t.id,
  label: `${t.templateName}（${t.paymentCategory || ''}｜${t.propertyType || ''}｜${t.buyerType || ''}）`,
})));

const splitPreviewTemplate = computed(() => templates.value.find(t => t.id === splitPreviewTemplateId.value) || null);

// 期別列（葉項目：有子項的母項目以子項為準）
const splitPreviewRows = computed(() => {
  const t = splitPreviewTemplate.value;
  if (!t || !Array.isArray(t.items)) return [];
  const parents = t.items.filter(i => !i.parentId);
  const rows = [];
  for (const p of parents) {
    const children = t.items.filter(i => i.parentId === p.id);
    if (children.length) children.forEach(c => rows.push({ name: c.name }));
    else rows.push({ name: p.name });
  }
  return rows;
});

// 有試算戶別時：跑期款引擎取得各期金額，再套拆分
const splitTrialRows = computed(() => {
  const rows = splitPreviewRows.value;
  if (!rows.length) return [];
  if (!trialUnit.value || !splitPreviewTemplate.value) {
    return rows.map(r => ({ ...r, amount: null, landAmount: null, houseAmount: null }));
  }
  const total = trialBaseContext.value.total || 0;
  const results = runNewCalculationEngine(splitPreviewTemplate.value.items, total, '總價');
  const withAmounts = rows.map(r => ({ name: r.name, amount: results[r.name]?.value ?? 0 }));
  return computeInstallmentSplit(withAmounts, config.value.installmentSplitRules, trialFullContext.value);
});

const splitTrialSums = computed(() => {
  const rows = splitTrialRows.value.filter(r => Number.isFinite(r.amount));
  const amount = rows.reduce((s, r) => s + (r.amount || 0), 0);
  const land = rows.reduce((s, r) => s + (r.landAmount || 0), 0);
  const house = rows.reduce((s, r) => s + (r.houseAmount || 0), 0);
  const landOk = Math.abs(land - (trialBaseContext.value.landPrice || 0)) < 0.05;
  return { amount, land, house, landOk };
});

function ruleFor(itemName) {
  return (config.value?.installmentSplitRules?.rules || []).find(r => r.itemName === itemName) || null;
}

function removeSplitRule(itemName) {
  const rules = config.value.installmentSplitRules.rules;
  const i = rules.findIndex(r => r.itemName === itemName);
  if (i >= 0) rules.splice(i, 1);
}

const orphanRules = computed(() => {
  if (!config.value) return [];
  const names = new Set(splitPreviewRows.value.map(r => r.name));
  if (!names.size) return [];
  return (config.value.installmentSplitRules.rules || []).filter(r => !names.has(r.itemName));
});

function splitRefGroups() {
  const defs = buildContractRefDefinitions(config.value?.priceFormulas || [], -1, INSTALLMENT_SPLIT_REF_DEFINITIONS);
  return [
    { label: '期款', color: 'indigo', refs: defs.filter(d => d.key === 'installmentAmount') },
    { label: '基礎變數', color: 'primary', refs: defs.filter(d => d.group === 'primary' && d.key !== 'installmentAmount') },
    { label: '房土比結果', color: 'deep-purple', refs: defs.filter(d => d.group === 'result') },
    { label: '價款項目', color: 'orange-darken-3', refs: defs.filter(d => d.group === 'field') },
  ].filter(g => g.refs.length);
}

function splitTokensDisplay(tokens) {
  const map = refDefinitionsToMap(buildContractRefDefinitions(config.value?.priceFormulas || [], -1, INSTALLMENT_SPLIT_REF_DEFINITIONS));
  return formulaToDisplayString({ tokens: tokens || [] }, map);
}

/* ---------- 公式編輯 Dialog（共用：價款 / 拆分規則 / 拆分預設） ---------- */
const formulaDialog = reactive({
  show: false,
  kind: '',          // 'price' | 'splitRule' | 'splitDefault'
  targetIndex: -1,   // price 用
  targetItemName: '',// splitRule 用
  title: '',
  name: '',
  formula: { tokens: [], rounding: { mode: 'round', decimals: 1 } },
  refGroups: [],
  previewContext: null,
});

function openPriceFormulaDialog(idx) {
  const field = config.value.priceFormulas[idx];
  formulaDialog.kind = 'price';
  formulaDialog.targetIndex = idx;
  formulaDialog.title = `編輯價款公式：${field.label || field.key}`;
  formulaDialog.name = field.label || field.key;
  formulaDialog.formula = JSON.parse(JSON.stringify({ tokens: field.tokens || [], rounding: field.rounding || { mode: 'round', decimals: 1 } }));
  formulaDialog.refGroups = priceFormulaRefGroups(idx);
  formulaDialog.previewContext = trialUnit.value ? { ...trialFullContext.value } : null;
  formulaDialog.show = true;
}

function openSplitRuleDialog(itemName) {
  const rule = ruleFor(itemName);
  formulaDialog.kind = 'splitRule';
  formulaDialog.targetItemName = itemName;
  formulaDialog.title = `期別「${itemName}」土地款公式`;
  formulaDialog.name = `${itemName} 土地款`;
  formulaDialog.formula = JSON.parse(JSON.stringify({
    tokens: rule?.landTokens || [],
    rounding: rule?.rounding || { mode: 'round', decimals: 1 },
  }));
  formulaDialog.refGroups = splitRefGroups();
  const row = splitTrialRows.value.find(r => r.name === itemName);
  formulaDialog.previewContext = trialUnit.value
    ? { ...trialFullContext.value, installmentAmount: Number(row?.amount) || 0 }
    : null;
  formulaDialog.show = true;
}

function openSplitDefaultDialog() {
  formulaDialog.kind = 'splitDefault';
  formulaDialog.title = '未指定期別的預設土地款公式';
  formulaDialog.name = '預設土地款';
  formulaDialog.formula = JSON.parse(JSON.stringify({
    tokens: config.value.installmentSplitRules.defaultLandTokens || [],
    rounding: { mode: 'round', decimals: 1 },
  }));
  formulaDialog.refGroups = splitRefGroups();
  formulaDialog.previewContext = trialUnit.value ? { ...trialFullContext.value, installmentAmount: 0 } : null;
  formulaDialog.show = true;
}

function commitFormulaDialog() {
  const f = JSON.parse(JSON.stringify(formulaDialog.formula));
  if (formulaDialog.kind === 'price') {
    const field = config.value.priceFormulas[formulaDialog.targetIndex];
    field.tokens = f.tokens;
    field.rounding = f.rounding;
  } else if (formulaDialog.kind === 'splitRule') {
    const rules = config.value.installmentSplitRules.rules;
    const existing = rules.find(r => r.itemName === formulaDialog.targetItemName);
    if (f.tokens.length === 0) {
      // 空公式視為清除規則
      const i = rules.findIndex(r => r.itemName === formulaDialog.targetItemName);
      if (i >= 0) rules.splice(i, 1);
    } else if (existing) {
      existing.landTokens = f.tokens;
      existing.rounding = f.rounding;
    } else {
      rules.push({ itemName: formulaDialog.targetItemName, landTokens: f.tokens, rounding: f.rounding });
    }
  } else if (formulaDialog.kind === 'splitDefault') {
    config.value.installmentSplitRules.defaultLandTokens = f.tokens.length ? f.tokens : [{ type: 'number', value: 0 }];
  }
  formulaDialog.show = false;
}

/* ---------- 格式化 ---------- */
function fmt(v) {
  if (v === null || v === undefined || !Number.isFinite(Number(v))) return '—';
  return Number(v).toLocaleString('en-US', { maximumFractionDigits: 2 });
}
</script>

<style scoped>
.page-header { background: #f7f7f9; border-bottom: 1px solid #eee; }
.cursor-move { cursor: move; }
.formula-display {
  font-size: 0.85rem;
  background: #f5f5f7;
  border-radius: 6px;
  padding: 4px 10px;
  min-width: 120px;
}
.option-table :deep(th) { font-size: 0.8rem; }
</style>
