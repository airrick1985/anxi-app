<template>
    <v-dialog
        :model-value="show"
        @update:model-value="$emit('update:show', $event)"
        :fullscreen="isMobile"
        :max-width="isMobile ? '100%' : '1500px'"
        scrollable
        transition="dialog-bottom-transition"
    >
        <v-card class="d-flex flex-column" :style="{ height: isMobile ? '100dvh' : '95vh' }">
            <v-card-title class="pa-4">
                <v-row align="center" no-gutters>
                    <v-col>
                        <span class="text-h5">
                            <v-icon start>mdi-file-table-outline</v-icon>
                            製作付款表 - {{ context?.unitId }}
                        </span>
                    </v-col>
                    <v-col class="text-right">
                        <v-btn icon="mdi-close" variant="text" @click="$emit('update:show', false)"></v-btn>
                    </v-col>
                </v-row>
            </v-card-title>
            <v-divider></v-divider>

            <!-- ✅ 手機模式：編輯 / 預覽 分頁切換，避免長頁面來回捲動 -->
            <v-tabs
                v-if="isMobile"
                v-model="mobileTab"
                grow
                color="secondary"
                density="compact"
            >
                <v-tab value="edit">
                    <v-icon start size="small">mdi-pencil-ruler</v-icon>
                    期款編輯
                </v-tab>
                <v-tab value="preview">
                    <v-icon start size="small">mdi-eye-outline</v-icon>
                    付款表預覽
                </v-tab>
            </v-tabs>
            <v-divider v-if="isMobile"></v-divider>

            <v-card-text style="overflow-y: auto; flex-grow: 1;" :class="isMobile ? 'pa-2 bg-grey-lighten-4' : 'pa-4 bg-grey-lighten-4'">
                <v-row :no-gutters="isMobile">
                    <!-- ================= 左側：期款編輯器 ================= -->
                    <v-col cols="12" lg="5" v-show="!isMobile || mobileTab === 'edit'">
                        <v-card elevation="2" class="mb-4">
                            <v-card-item class="editor-header">
                                <v-card-title class="text-subtitle-1">
                                    <v-icon start size="small">mdi-format-list-numbered</v-icon>
                                    期款方式
                                </v-card-title>
                            </v-card-item>
                            <v-divider></v-divider>
                            <v-card-text>
                                <v-skeleton-loader v-if="templatesLoading" type="list-item-two-line@2"></v-skeleton-loader>
                                <template v-else>
                                    <v-row dense>
                                        <v-col cols="12" sm="5">
                                            <v-select
                                                v-model="categoryModel"
                                                :items="categoryOptions"
                                                label="期款類別"
                                                variant="outlined"
                                                density="compact"
                                                hide-details
                                            ></v-select>
                                        </v-col>
                                        <v-col cols="12" sm="7">
                                            <v-select
                                                v-model="templateIdModel"
                                                :items="templateOptions"
                                                item-title="templateName"
                                                item-value="id"
                                                label="期款範本"
                                                variant="outlined"
                                                density="compact"
                                                hide-details
                                            >
                                                <template v-slot:item="{ props: itemProps, item }">
                                                    <v-list-item v-bind="itemProps" :subtitle="item.raw.subtitle"></v-list-item>
                                                </template>
                                            </v-select>
                                        </v-col>
                                    </v-row>
                                    <div class="d-flex align-center mt-2">
                                        <v-chip v-if="isAutoSelected" size="small" color="success" variant="tonal">
                                            <v-icon start size="x-small">mdi-auto-fix</v-icon>
                                            自動判斷
                                        </v-chip>
                                        <v-chip v-else size="small" color="orange" variant="tonal">
                                            <v-icon start size="x-small">mdi-hand-back-right-outline</v-icon>
                                            手動指定
                                        </v-chip>
                                        <v-btn
                                            v-if="!isAutoSelected"
                                            size="x-small"
                                            variant="text"
                                            color="primary"
                                            class="ml-2"
                                            @click="resetToAuto"
                                        >
                                            還原自動判斷
                                        </v-btn>
                                    </div>
                                    <v-alert
                                        v-if="!activeTemplate"
                                        type="info"
                                        variant="tonal"
                                        density="compact"
                                        class="mt-3"
                                    >
                                        無適用期款範本（{{ autoConditionText }}），請至「期款方式範本設定」建立，或手動指定範本。
                                    </v-alert>

                                    <!-- ✅ 配套模式：合約方式屬配套合約時自動開啟，可手動覆蓋 -->
                                    <template v-if="showPackageSwitch">
                                        <v-divider class="my-3"></v-divider>
                                        <v-switch
                                            v-model="packageModeEnabled"
                                            color="deep-orange"
                                            density="compact"
                                            hide-details
                                            inset
                                        >
                                            <template v-slot:label>
                                                <span class="text-body-2">配套模式（兩頁：一般期款＋配套期款）</span>
                                            </template>
                                        </v-switch>
                                        <div v-if="packageModeEnabled" class="d-flex flex-wrap ga-2 mt-1">
                                            <v-chip size="small" color="deep-orange" variant="tonal">
                                                第 1 頁基準：配套總價 {{ formatNumber(mainBase) }} 萬
                                            </v-chip>
                                            <v-chip size="small" color="deep-orange" variant="tonal">
                                                第 2 頁基準：配套價 {{ formatNumber(packageBase) }} 萬
                                            </v-chip>
                                        </div>
                                        <v-alert
                                            v-if="packageModeEnabled && (mainBase <= 0 || packageBase <= 0)"
                                            type="warning"
                                            variant="tonal"
                                            density="compact"
                                            class="mt-2"
                                        >
                                            配套總價或配套價尚未設定（需大於 0），請先於付款表設定填寫配套總價。
                                        </v-alert>
                                    </template>
                                </template>
                            </v-card-text>
                        </v-card>

                        <!-- ✅ 配套期款範本選擇（第 2 頁） -->
                        <v-card v-if="packageModeEnabled" elevation="2" class="mb-4">
                            <v-card-item class="editor-header-package">
                                <v-card-title class="text-subtitle-1">
                                    <v-icon start size="small">mdi-package-variant</v-icon>
                                    配套期款範本（第 2 頁）
                                </v-card-title>
                            </v-card-item>
                            <v-divider></v-divider>
                            <v-card-text>
                                <v-select
                                    v-model="packageTemplateIdModel"
                                    :items="packageTemplateOptions"
                                    item-title="templateName"
                                    item-value="id"
                                    label="配套期款範本"
                                    variant="outlined"
                                    density="compact"
                                    hide-details
                                >
                                    <template v-slot:item="{ props: itemProps, item }">
                                        <v-list-item v-bind="itemProps" :subtitle="item.raw.subtitle"></v-list-item>
                                    </template>
                                </v-select>
                                <div class="d-flex align-center mt-2">
                                    <v-chip v-if="!manualPackageTemplateId" size="small" color="success" variant="tonal">
                                        <v-icon start size="x-small">mdi-auto-fix</v-icon>
                                        自動判斷
                                    </v-chip>
                                    <v-chip v-else size="small" color="orange" variant="tonal">
                                        <v-icon start size="x-small">mdi-hand-back-right-outline</v-icon>
                                        手動指定
                                    </v-chip>
                                    <v-btn
                                        v-if="manualPackageTemplateId"
                                        size="x-small"
                                        variant="text"
                                        color="primary"
                                        class="ml-2"
                                        @click="manualPackageTemplateId = null"
                                    >
                                        還原自動判斷
                                    </v-btn>
                                </div>
                                <v-alert
                                    v-if="!activePackageTemplate"
                                    type="info"
                                    variant="tonal"
                                    density="compact"
                                    class="mt-3"
                                >
                                    無適用「配套期款」範本，請至「期款方式範本設定」建立（期款類別選「配套期款」）。
                                </v-alert>
                            </v-card-text>
                        </v-card>

                        <!-- ✅ 各頁比例與金額編輯（一般期款 / 配套期款） -->
                        <v-card v-for="page in editPages" :key="`page-${page.id}`" elevation="2" class="mb-4">
                            <v-card-item :class="page.id === 2 ? 'editor-header-package' : 'editor-header'">
                                <v-card-title class="text-subtitle-1 d-flex align-center flex-wrap">
                                    <v-icon start size="small">mdi-pencil-ruler</v-icon>
                                    {{ page.label }}
                                    <v-spacer></v-spacer>
                                    <v-chip
                                        size="small"
                                        :color="page.checkPercent === false ? 'grey' : (pagePercentOk(page) ? 'success' : 'error')"
                                        variant="flat"
                                        class="mr-1"
                                    >
                                        比例 {{ pagePercentSumText(page) }}%
                                    </v-chip>
                                    <v-chip
                                        size="small"
                                        :color="pageAmountOk(page) ? 'success' : 'error'"
                                        variant="flat"
                                    >
                                        金額 {{ formatNumber(pageAmountSum(page)) }} / {{ formatNumber(page.base) }} 萬
                                    </v-chip>
                                </v-card-title>
                            </v-card-item>
                            <v-divider></v-divider>
                            <v-card-text class="pa-2">
                                <!-- 驗證提示與尾差補正 -->
                                <v-alert
                                    v-if="!pageOk(page)"
                                    type="error"
                                    variant="tonal"
                                    density="compact"
                                    class="ma-2"
                                >
                                    <div v-if="page.checkPercent !== false && !pagePercentOk(page)">比例合計須等於 100%（目前 {{ pagePercentSumText(page) }}%）</div>
                                    <div v-if="!pageAmountOk(page)">金額合計須等於{{ page.baseLabel }}（目前差 {{ formatNumber(page.base - pageAmountSum(page)) }} 萬）</div>
                                    <div class="d-flex align-center mt-2 flex-wrap ga-2">
                                        <v-select
                                            v-model="correctionTargetKeys[page.id]"
                                            :items="page.rows.map(r => ({ key: r.key, label: r.name }))"
                                            item-title="label"
                                            item-value="key"
                                            label="差額歸入期別"
                                            variant="outlined"
                                            density="compact"
                                            hide-details
                                            style="max-width: 220px;"
                                        ></v-select>
                                        <v-btn size="small" color="error" variant="flat" @click="applyCorrection(page)">
                                            一鍵補正差額
                                        </v-btn>
                                    </div>
                                </v-alert>

                                <!-- 期款編輯表格 -->
                                <div class="edit-table">
                                    <div class="edit-row edit-row-head">
                                        <div class="col-percent">比例(%)</div>
                                        <div class="col-name">期別名稱</div>
                                        <div class="col-amount">金額(萬)</div>
                                        <div class="col-note">備註</div>
                                    </div>
                                    <template v-for="row in page.rows" :key="row.key">
                                        <!-- 母項目（群組） -->
                                        <template v-if="row.type === 'group'">
                                            <div class="edit-row edit-row-group">
                                                <div class="col-percent">
                                                    <v-text-field
                                                        v-model.number="row.percent"
                                                        type="number"
                                                        step="0.01"
                                                        min="0"
                                                        variant="outlined"
                                                        density="compact"
                                                        hide-details
                                                        @change="recalcAmountFromPercent(row, page.base)"
                                                    ></v-text-field>
                                                </div>
                                                <div class="col-name font-weight-bold">{{ row.name }}</div>
                                                <div class="col-amount text-right font-weight-bold pr-2">
                                                    {{ formatNumber(groupAmount(row)) }}
                                                </div>
                                                <div class="col-note"></div>
                                            </div>
                                            <div v-for="child in row.children" :key="child.key" class="edit-row edit-row-child">
                                                <div class="col-percent"></div>
                                                <div class="col-name pl-6">
                                                    <span v-if="child.seq !== null" class="text-grey-darken-1 mr-1">{{ child.seq }}.</span>
                                                    {{ child.name }}
                                                </div>
                                                <div class="col-amount">
                                                    <v-text-field
                                                        v-model.number="child.amount"
                                                        type="number"
                                                        min="0"
                                                        variant="outlined"
                                                        density="compact"
                                                        hide-details
                                                        @change="recalcPercentFromAmount(row, page.base)"
                                                    ></v-text-field>
                                                </div>
                                                <div class="col-note">
                                                    <v-text-field
                                                        v-model="child.note"
                                                        variant="outlined"
                                                        density="compact"
                                                        hide-details
                                                        placeholder="備註"
                                                    ></v-text-field>
                                                </div>
                                            </div>
                                        </template>
                                        <!-- 單一項目 -->
                                        <div v-else class="edit-row">
                                            <div class="col-percent">
                                                <v-text-field
                                                    v-model.number="row.percent"
                                                    type="number"
                                                    step="0.01"
                                                    min="0"
                                                    variant="outlined"
                                                    density="compact"
                                                    hide-details
                                                    @change="recalcAmountFromPercent(row, page.base)"
                                                ></v-text-field>
                                            </div>
                                            <div class="col-name">{{ row.name }}</div>
                                            <div class="col-amount">
                                                <v-text-field
                                                    v-model.number="row.amount"
                                                    type="number"
                                                    min="0"
                                                    variant="outlined"
                                                    density="compact"
                                                    hide-details
                                                    @change="recalcPercentFromAmount(row, page.base)"
                                                ></v-text-field>
                                            </div>
                                            <div class="col-note">
                                                <v-text-field
                                                    v-model="row.note"
                                                    variant="outlined"
                                                    density="compact"
                                                    hide-details
                                                    placeholder="備註"
                                                ></v-text-field>
                                            </div>
                                        </div>
                                    </template>
                                    <!-- 總計列 -->
                                    <div class="edit-row edit-row-total">
                                        <div class="col-percent text-center" :class="page.checkPercent === false ? 'text-grey-darken-1' : (pagePercentOk(page) ? 'text-success' : 'text-error')">
                                            {{ pagePercentSumText(page) }}%
                                        </div>
                                        <div class="col-name font-weight-bold">{{ page.totalLabel }}</div>
                                        <div class="col-amount text-right font-weight-bold pr-2" :class="pageAmountOk(page) ? 'text-success' : 'text-error'">
                                            {{ formatNumber(pageAmountSum(page)) }}
                                        </div>
                                        <div class="col-note"></div>
                                    </div>
                                </div>
                            </v-card-text>
                        </v-card>

                        <!-- ✅ 繳款銀行顯示控制：勾選決定房屋款/土地款/配套款是否顯示（配套模式下兩頁各自勾選） -->
                        <v-card v-if="availableBanks.length > 0" elevation="2" class="mb-4">
                            <v-card-item class="editor-header">
                                <v-card-title class="text-subtitle-1">
                                    <v-icon start size="small">mdi-bank-outline</v-icon>
                                    繳款銀行顯示
                                </v-card-title>
                            </v-card-item>
                            <v-divider></v-divider>
                            <v-card-text class="py-2">
                                <div v-if="packageModeEnabled" class="text-caption text-grey-darken-1 mb-1">第 1 頁（一般期款）</div>
                                <div class="d-flex flex-wrap ga-2">
                                    <v-checkbox
                                        v-for="bank in availableBanks"
                                        :key="`b1-${bank.title}`"
                                        v-model="selectedBankTitles"
                                        :value="bank.title"
                                        :label="`${bank.title}（${bank.bankName || bank.accountName || bank.account}）`"
                                        density="compact"
                                        color="secondary"
                                        hide-details
                                    ></v-checkbox>
                                </div>
                                <template v-if="packageModeEnabled">
                                    <v-divider class="my-2"></v-divider>
                                    <div class="text-caption text-grey-darken-1 mb-1">第 2 頁（配套期款）</div>
                                    <div class="d-flex flex-wrap ga-2">
                                        <v-checkbox
                                            v-for="bank in availableBanks"
                                            :key="`b2-${bank.title}`"
                                            v-model="selectedBankTitles2"
                                            :value="bank.title"
                                            :label="`${bank.title}（${bank.bankName || bank.accountName || bank.account}）`"
                                            density="compact"
                                            color="deep-orange"
                                            hide-details
                                        ></v-checkbox>
                                    </div>
                                </template>
                                <p v-if="!packageModeEnabled && banksPage1.length === 0" class="text-caption text-orange-darken-2 mb-0 mt-1">
                                    未勾選任何帳戶，付款表將不顯示繳款銀行區塊。
                                </p>
                            </v-card-text>
                        </v-card>
                    </v-col>

                    <!-- ================= 右側：付款表預覽（配套模式為兩頁） ================= -->
                    <v-col cols="12" lg="7" v-show="!isMobile || mobileTab === 'preview'">
                        <div class="preview-wrapper" v-if="context">
                            <div
                                v-for="pv in previewPages"
                                :key="`pv-page-${pv.id}`"
                                class="preview-sheet"
                                :style="previewSheetStyle"
                            >
                                <!-- 表頭 -->
                                <div class="ps-header">
                                    <div class="ps-logo">
                                        <img v-if="docSettings.logoUrl" :src="docSettings.logoUrl" alt="logo" />
                                    </div>
                                    <div class="ps-title">付款明細表{{ pv.suffix }}</div>
                                    <div class="ps-qr">
                                        <template v-if="docSettings.contractTemplateUrl">
                                            <div class="ps-qr-label">合約範本<br />QR CODE</div>
                                            <qrcode-vue :value="docSettings.contractTemplateUrl" :size="56" level="M" />
                                        </template>
                                    </div>
                                </div>

                                <!-- 基本資訊 -->
                                <div class="ps-info">
                                    <div class="ps-info-left">
                                        <div class="ps-info-row">
                                            <span class="ps-label">戶別：</span>
                                            <span class="ps-box">{{ context.unitLabel || context.unitId }}</span>
                                        </div>
                                        <div class="ps-info-row mt-4">
                                            <span class="ps-label">車位：</span>
                                            <span class="ps-box">{{ parkingText }}</span>
                                        </div>
                                    </div>
                                    <div class="ps-info-right">
                                        <div class="ps-area-row ps-area-gray">
                                            <span class="ps-area-label">房屋買賣面積：</span>
                                            <span class="ps-area-val strong">{{ fmt2(context.areas?.houseTotalPing) }}坪</span>
                                            <span class="ps-area-val strong">{{ fmt2(context.areas?.houseTotalSqm) }} m²</span>
                                        </div>
                                        <div class="ps-area-row">
                                            <span class="ps-area-label">主建物：</span>
                                            <span class="ps-area-val">{{ fmt2(context.areas?.mainPing) }}坪</span>
                                            <span class="ps-area-val">{{ fmt2(context.areas?.mainSqm) }} m²</span>
                                        </div>
                                        <div class="ps-area-row">
                                            <span class="ps-area-label">陽台：</span>
                                            <span class="ps-area-val">{{ fmt2(context.areas?.ancillaryPing) }}坪</span>
                                            <span class="ps-area-val">{{ fmt2(context.areas?.ancillarySqm) }} m²</span>
                                        </div>
                                        <div class="ps-area-row">
                                            <span class="ps-area-label">共用部分：</span>
                                            <span class="ps-area-val">{{ fmt2(context.areas?.commonPing) }}坪</span>
                                            <span class="ps-area-val">{{ fmt2(context.areas?.commonSqm) }} m²</span>
                                        </div>
                                        <div v-if="Number(context.areas?.terracePing) > 0" class="ps-area-row">
                                            <span class="ps-area-label">露臺(不計坪)：</span>
                                            <span class="ps-area-val">{{ fmt2(context.areas?.terracePing) }}坪</span>
                                            <span class="ps-area-val"></span>
                                        </div>
                                        <div class="ps-area-row mt-2">
                                            <span class="ps-area-label">土地持分：</span>
                                            <span class="ps-area-val strong" style="flex: 2;">
                                                {{ context.areas?.landShareRatio ? `十萬分之${context.areas.landShareRatio}` : '-' }}
                                            </span>
                                        </div>
                                        <div class="ps-area-row ps-area-gray">
                                            <span class="ps-area-label">土地買賣面積：</span>
                                            <span class="ps-area-val strong">{{ fmt2(context.areas?.landSharePing) }}坪</span>
                                            <span class="ps-area-val strong">{{ fmt2(context.areas?.landShareSqm) }} m²</span>
                                        </div>
                                        <div v-if="hasParkingArea" class="ps-area-row ps-area-gray">
                                            <span class="ps-area-label">車位持分面積：</span>
                                            <span class="ps-area-val strong">{{ fmt2(context.areas?.parkingPing) }}坪</span>
                                            <span class="ps-area-val strong">{{ fmt2(context.areas?.parkingSqm) }} m²</span>
                                        </div>
                                    </div>
                                </div>

                                <!-- 列表日期 -->
                                <div class="ps-date">列表日期：　{{ listDate }}</div>

                                <!-- 期款表格 -->
                                <table class="ps-table">
                                    <thead>
                                        <tr>
                                            <th style="width: 10%;">比例</th>
                                            <th style="width: 45%;" colspan="3">期別名稱</th>
                                            <th style="width: 18%;">金額(萬)</th>
                                            <th style="width: 27%;">備註</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <template v-for="row in pv.rows" :key="`pv-${pv.id}-${row.key}`">
                                            <template v-if="row.type === 'group'">
                                                <tr v-for="(child, ci) in row.children" :key="`pv-${pv.id}-${child.key}`">
                                                    <td v-if="ci === 0" :rowspan="row.children.length" class="ps-percent">
                                                        {{ fmtPercent(row.percent) }}
                                                    </td>
                                                    <td v-if="ci === 0 && row.verticalLabel" :rowspan="row.children.length" class="ps-vlabel">
                                                        <span>{{ row.verticalLabel }}</span>
                                                    </td>
                                                    <td v-if="child.seq !== null" class="ps-seq">{{ child.seq }}</td>
                                                    <td :colspan="nameColspan(row, child)" class="ps-name">{{ child.name }}</td>
                                                    <td class="ps-amount">{{ formatNumber(child.amount) }}</td>
                                                    <td class="ps-note">{{ child.note }}</td>
                                                </tr>
                                            </template>
                                            <tr v-else>
                                                <td class="ps-percent">{{ fmtPercent(row.percent) }}</td>
                                                <td colspan="3" class="ps-name">{{ row.name }}</td>
                                                <td class="ps-amount">{{ formatNumber(row.amount) }}</td>
                                                <td class="ps-note">{{ row.note }}</td>
                                            </tr>
                                        </template>
                                        <tr class="ps-total-row">
                                            <td class="ps-percent">100%</td>
                                            <td colspan="3" class="ps-name ps-total-name">{{ pv.totalLabel }}</td>
                                            <td class="ps-amount ps-total-amount">{{ formatNumber(pv.total) }}</td>
                                            <td class="ps-note"></td>
                                        </tr>
                                    </tbody>
                                </table>

                                <!-- 警語 -->
                                <div v-if="docSettings.loanWarningText" class="ps-warning">{{ docSettings.loanWarningText }}</div>

                                <!-- 繳款銀行 -->
                                <div v-if="pv.banks.length > 0 || docSettings.remitNoteText" class="ps-bank-box">
                                    <div v-for="(bank, bi) in pv.banks" :key="bi" class="ps-bank">
                                        <div class="ps-bank-line">
                                            <span class="ps-bank-label">{{ pv.banks.length > 1 && bank.title ? `【${bank.title}】` : '' }}繳款銀行名稱：</span>
                                            <span class="ps-bank-val">{{ bank.bankName || '-' }}</span>
                                            <span class="ps-bank-label ml-4">戶名：</span>
                                            <span class="ps-bank-val">{{ bank.accountName || '-' }}</span>
                                        </div>
                                        <div class="ps-bank-line">
                                            <span class="ps-bank-label ml-8">帳號：</span>
                                            <span class="ps-bank-val">{{ bank.account || '-' }}</span>
                                        </div>
                                    </div>
                                    <div v-if="docSettings.remitNoteText" class="ps-remit">{{ docSettings.remitNoteText }}</div>
                                </div>

                                <!-- 銷售顧問 -->
                                <div class="ps-footer">
                                    <span class="ps-bank-label">銷售顧問</span>
                                    <span class="ps-footer-val">{{ context.salesperson || '-' }}</span>
                                    <span class="ps-bank-label">聯絡電話</span>
                                    <span class="ps-footer-val">{{ context.salesPhone || '-' }}</span>
                                </div>
                            </div>
                        </div>
                    </v-col>
                </v-row>
            </v-card-text>

            <v-divider></v-divider>
            <v-card-actions class="pa-4" :class="{ 'mobile-actions': isMobile }">
                <v-spacer v-if="!isMobile"></v-spacer>
                <v-btn
                    color="red-darken-1"
                    variant="flat"
                    prepend-icon="mdi-file-pdf-box"
                    :block="isMobile"
                    :loading="downloading.pdf"
                    :disabled="!canDownload || downloading.excel"
                    @click="download('pdf')"
                >
                    下載 PDF
                </v-btn>
                <v-btn
                    color="green-darken-1"
                    variant="flat"
                    prepend-icon="mdi-file-excel-box"
                    :block="isMobile"
                    :loading="downloading.excel"
                    :disabled="!canDownload || downloading.pdf"
                    @click="download('excel')"
                >
                    下載 EXCEL
                </v-btn>
                <v-btn color="primary" variant="text" :block="isMobile" @click="$emit('update:show', false)">關閉</v-btn>
            </v-card-actions>
        </v-card>
    </v-dialog>
</template>

<script setup>
import { ref, computed, watch, reactive } from 'vue';
import { useDisplay } from 'vuetify';
import { useToast } from 'vue-toastification';
import QrcodeVue from 'qrcode.vue';
import QRCode from 'qrcode';
import { saveAs } from 'file-saver';
import { formatInTimeZone } from 'date-fns-tz';
import { fetchPaymentTermTemplates, generatePaymentDocument } from '@/api.js';
import { runNewCalculationEngine } from '@/utils/paymentCalculation';
import { useProjectStore } from '@/store/projectStore';

const { mobile: isMobile, width: windowWidth } = useDisplay();
const toast = useToast();
const projectStore = useProjectStore();

// ✅ 手機模式：編輯 / 預覽分頁；預覽紙張依螢幕寬度等比縮放
const mobileTab = ref('edit');
const previewSheetStyle = computed(() => {
    if (!isMobile.value) return {};
    const available = Math.max(300, (windowWidth.value || 375) - 24); // 扣除左右 padding
    const scale = Math.min(1, available / 794);
    // zoom 會同步縮放版面佔位，較 transform 適合整頁縮放；
    // 不支援 zoom 的舊瀏覽器則回退為 preview-wrapper 的橫向捲動
    return { zoom: scale };
});

const props = defineProps({
    show: Boolean,
    projectId: { type: String, required: true },
    projectName: { type: String, required: true },
    /**
     * context：由 PaymentSettings 於開啟時組好的渲染資料
     * { unitId, unitLabel, contractType, isFirstTimeBuyer, usePreferredPayment, propertyType,
     *   totalPrice, isPackageContract, packageDealPrice, packagePrice,
     *   parkingSpots:[{spotId, price_transaction}], areas:{...},
     *   banks:[{title,bankName,accountName,account}], salesperson, salesPhone }
     */
    context: { type: Object, default: () => null }
});
defineEmits(['update:show']);

/* ---------- 建案付款表設定 ---------- */
const docSettings = computed(() => {
    return projectStore.getProjectById(props.projectId)?.paymentDocSettings || {};
});

/* ---------- 期款範本載入 ---------- */
const templates = ref([]);
const templatesLoading = ref(false);

async function loadTemplates() {
    templatesLoading.value = true;
    try {
        const result = await fetchPaymentTermTemplates(props.projectId);
        templates.value = result.status === 'success' ? (result.data || []) : [];
        if (result.status !== 'success') {
            toast.error(`載入期款範本失敗: ${result.message}`);
        }
    } finally {
        templatesLoading.value = false;
    }
}

/* ---------- 金額基準 ---------- */
const totalPriceRounded = computed(() => Math.round(Number(props.context?.totalPrice) || 0));

// ✅ 配套模式：合約方式屬於建案設定的配套合約清單時自動開啟（可手動覆蓋）
const packageModeEnabled = ref(false);

// 第 1 頁基準：配套模式 = 配套總價；一般模式 = 成交總價
const mainBase = computed(() => packageModeEnabled.value
    ? Math.round(Number(props.context?.packageDealPrice) || 0)
    : totalPriceRounded.value
);
// 第 2 頁基準：配套價（成交總價 − 配套總價）
const packageBase = computed(() => Math.round(Number(props.context?.packagePrice) || 0));

// 有配套期款範本或合約方式屬配套時，顯示配套模式開關
const packageTemplates = computed(() => templates.value.filter(t => t.paymentCategory === '配套期款'));
const showPackageSwitch = computed(() => props.context?.isPackageContract || packageTemplates.value.length > 0);

/* ---------- 第 1 頁範本選擇（自動 + 手動覆蓋） ---------- */
const manualCategory = ref(null);
const manualTemplateId = ref(null);

const autoConditionText = computed(() => {
    const c = props.context || {};
    const buyerType = c.isFirstTimeBuyer ? '首購' : '非首購';
    const category = c.usePreferredPayment ? '優付期款' : '一般期款';
    return `${category}／${c.propertyType || '住家'}／${buyerType}／基準 ${formatNumber(mainBase.value)} 萬`;
});

// 自動判斷（沿用 QuoteItem.vue selectPaymentTemplate 邏輯；配套模式下比對基準為配套總價）
const autoTemplate = computed(() => {
    const c = props.context;
    if (!c || templates.value.length === 0) return null;
    const base = mainBase.value;
    const buyerType = c.isFirstTimeBuyer ? '首購' : '非首購';
    const currentPropertyType = c.propertyType || '住家';
    const targetCategory = c.usePreferredPayment ? '優付期款' : '一般期款';

    const applicable = templates.value.filter(t => {
        const tPropType = t.propertyType || '住家';
        if (tPropType !== currentPropertyType) return false;
        return (
            t.paymentCategory === targetCategory &&
            t.minPrice <= base &&
            base <= t.maxPrice &&
            t.buyerType === buyerType
        );
    });
    return applicable.length > 0 ? applicable[0] : null;
});

const activeTemplate = computed(() => {
    if (manualTemplateId.value) {
        return templates.value.find(t => t.id === manualTemplateId.value) || null;
    }
    return autoTemplate.value;
});

const isAutoSelected = computed(() => !manualTemplateId.value);

// 期款類別選項（排除配套期款：其基準為配套金額，於第 2 頁另行選擇）
const categoryOptions = computed(() => {
    const set = new Set();
    templates.value.forEach(t => {
        if (t.paymentCategory && t.paymentCategory !== '配套期款') set.add(t.paymentCategory);
    });
    return Array.from(set);
});

const categoryModel = computed({
    get: () => manualCategory.value || activeTemplate.value?.paymentCategory || null,
    set: (value) => {
        manualCategory.value = value;
        const candidates = templates.value.filter(t => t.paymentCategory === value);
        manualTemplateId.value = candidates.length === 1 ? candidates[0].id : null;
    }
});

function templateSubtitle(t) {
    const range = (t.minPrice || t.maxPrice)
        ? `${t.minPrice ? `${t.minPrice}萬` : '0'}~${t.maxPrice ? `${t.maxPrice}萬` : '無上限'}`
        : '不限總價';
    return `${t.propertyType || '住家'}｜${t.buyerType || '非首購'}｜${range}`;
}

const templateOptions = computed(() => {
    const category = categoryModel.value;
    if (!category) return [];
    return templates.value
        .filter(t => t.paymentCategory === category)
        .map(t => ({ id: t.id, templateName: t.templateName, subtitle: templateSubtitle(t) }));
});

const templateIdModel = computed({
    get: () => manualTemplateId.value || activeTemplate.value?.id || null,
    set: (value) => { manualTemplateId.value = value; }
});

function resetToAuto() {
    manualCategory.value = null;
    manualTemplateId.value = null;
}

/* ---------- 第 2 頁：配套期款範本選擇 ---------- */
const manualPackageTemplateId = ref(null);

const autoPackageTemplate = computed(() => {
    const c = props.context;
    if (!c || packageTemplates.value.length === 0) return null;
    const base = mainBase.value; // 範本適用區間以配套總價比對（與報價單 finalTotalPrice 邏輯一致）
    const buyerType = c.isFirstTimeBuyer ? '首購' : '非首購';
    const currentPropertyType = c.propertyType || '住家';
    const applicable = packageTemplates.value.filter(t => {
        const tPropType = t.propertyType || '住家';
        if (tPropType !== currentPropertyType) return false;
        return t.minPrice <= base && base <= t.maxPrice && t.buyerType === buyerType;
    });
    // 條件不中時退而求其次：只要有配套期款範本就取第一個（配套範本通常僅一套）
    return applicable.length > 0 ? applicable[0] : packageTemplates.value[0];
});

const activePackageTemplate = computed(() => {
    if (manualPackageTemplateId.value) {
        return templates.value.find(t => t.id === manualPackageTemplateId.value) || null;
    }
    return autoPackageTemplate.value;
});

const packageTemplateOptions = computed(() =>
    packageTemplates.value.map(t => ({ id: t.id, templateName: t.templateName, subtitle: templateSubtitle(t) }))
);

const packageTemplateIdModel = computed({
    get: () => manualPackageTemplateId.value || activePackageTemplate.value?.id || null,
    set: (value) => { manualPackageTemplateId.value = value; }
});

/* ---------- 期款編輯列（兩頁） ---------- */
const editRows = ref([]);   // 第 1 頁：一般期款
const editRows2 = ref([]);  // 第 2 頁：配套期款
const correctionTargetKeys = reactive({ 1: null, 2: null });

/** 依範本 items 母子結構 + 公式引擎結果建立可編輯列 */
function buildRowsFromTemplate(template, baseValue, baseVariable) {
    if (!template || !Array.isArray(template.items) || baseValue <= 0) return [];
    const items = template.items;
    const results = runNewCalculationEngine(items, baseValue, baseVariable);
    const parents = items.filter(i => !i.parentId);

    return parents.map(p => {
        const children = items.filter(i => i.parentId === p.id);
        const percent = Number(p.conditionalValue) || 0;
        const base = { key: p.id, name: p.name, percent };
        if (children.length > 0) {
            // 子項 >= 3 時比照範本顯示直排母項目名稱與序號（如工程期款 1~10）
            const useSeq = children.length >= 3;
            return {
                ...base,
                type: 'group',
                verticalLabel: useSeq ? p.name : null,
                children: children.map((c, idx) => ({
                    key: c.id,
                    seq: useSeq ? idx + 1 : null,
                    name: c.name,
                    amount: Math.round(Number(results[c.name]?.value) || 0),
                    note: ''
                }))
            };
        }
        return {
            ...base,
            type: 'single',
            amount: Math.round(Number(results[p.name]?.value) || 0),
            note: ''
        };
    });
}

function rebuildRows() {
    editRows.value = buildRowsFromTemplate(activeTemplate.value, mainBase.value, '總價');
    correctionTargetKeys[1] = editRows.value.length > 0 ? editRows.value[editRows.value.length - 1].key : null;
}

function rebuildRows2() {
    if (!packageModeEnabled.value) {
        editRows2.value = [];
        return;
    }
    editRows2.value = buildRowsFromTemplate(activePackageTemplate.value, packageBase.value, '配套金額');
    correctionTargetKeys[2] = editRows2.value.length > 0 ? editRows2.value[editRows2.value.length - 1].key : null;
}

watch(activeTemplate, () => rebuildRows());
watch(activePackageTemplate, () => rebuildRows2());
// 切換配套模式：第 1 頁基準改變需重算，第 2 頁重建
watch(packageModeEnabled, () => {
    rebuildRows();
    rebuildRows2();
});

watch(() => props.show, (val) => {
    if (val) {
        resetToAuto();
        manualPackageTemplateId.value = null;
        // 繳款銀行預設不勾選，由用戶自行決定顯示哪些帳戶
        selectedBankTitles.value = [];
        selectedBankTitles2.value = [];
        // 配套模式：依合約方式自動判定（可手動覆蓋）
        packageModeEnabled.value = !!props.context?.isPackageContract;
        loadTemplates().then(() => {
            rebuildRows();
            rebuildRows2();
        });
    }
});

/* ---------- 雙向連動 ---------- */
function groupAmount(row) {
    return (row.children || []).reduce((s, c) => s + (Math.round(Number(c.amount)) || 0), 0);
}

/** 改比例 → 重算金額（群組按子項原金額比重分攤，尾差歸最後一個子項） */
function recalcAmountFromPercent(row, base) {
    const percent = Number(row.percent) || 0;
    const target = Math.round(percent / 100 * base);
    if (row.type === 'group') {
        const children = row.children || [];
        if (children.length === 0) return;
        const currentSum = groupAmount(row);
        let allocated = 0;
        children.forEach((child, idx) => {
            if (idx === children.length - 1) {
                child.amount = target - allocated; // 尾差歸最後一個子項
            } else {
                const weight = currentSum > 0 ? (Math.round(Number(child.amount)) || 0) / currentSum : 1 / children.length;
                const val = Math.round(target * weight);
                child.amount = val;
                allocated += val;
            }
        });
    } else {
        row.amount = target;
    }
}

/** 改金額 → 反算比例（顯示至小數 2 位） */
function recalcPercentFromAmount(row, base) {
    const sum = row.type === 'group' ? groupAmount(row) : (Math.round(Number(row.amount)) || 0);
    row.percent = base > 0 ? Math.round(sum / base * 10000) / 100 : 0;
}

/* ---------- 各頁驗證 ---------- */
const editPages = computed(() => {
    const pages = [{
        id: 1,
        label: packageModeEnabled.value ? '第 1 頁：一般期款' : '比例與金額調整',
        baseLabel: packageModeEnabled.value ? '配套總價' : '成交總價',
        totalLabel: '總價',
        rows: editRows.value,
        base: mainBase.value,
        checkPercent: true
    }];
    if (packageModeEnabled.value) {
        pages.push({
            id: 2,
            label: '第 2 頁：配套期款',
            baseLabel: '配套價',
            totalLabel: '配套總計',
            rows: editRows2.value,
            base: packageBase.value,
            // ✅ 配套期款不檢查比例合計，只檢查金額合計 = 配套價
            checkPercent: false
        });
    }
    return pages.filter(p => p.rows.length > 0 || p.id === 1);
});

function pagePercentSum(page) {
    return page.rows.reduce((s, r) => s + (Number(r.percent) || 0), 0);
}
function pagePercentSumText(page) {
    return (Math.round(pagePercentSum(page) * 100) / 100).toString();
}
function pagePercentOk(page) {
    return Math.abs(pagePercentSum(page) - 100) <= 0.01;
}
function pageAmountSum(page) {
    return page.rows.reduce((s, r) => s + (r.type === 'group' ? groupAmount(r) : (Math.round(Number(r.amount)) || 0)), 0);
}
function pageAmountOk(page) {
    return pageAmountSum(page) === page.base;
}
function pageOk(page) {
    // checkPercent === false（配套期款）時不檢查比例合計，只檢查金額合計
    return (page.checkPercent === false || pagePercentOk(page)) && pageAmountOk(page);
}

const canDownload = computed(() => {
    if (editRows.value.length === 0 || mainBase.value <= 0) return false;
    const page1 = { rows: editRows.value, base: mainBase.value, checkPercent: true };
    if (!pageOk(page1)) return false;
    if (packageModeEnabled.value) {
        if (editRows2.value.length === 0 || packageBase.value <= 0) return false;
        const page2 = { rows: editRows2.value, base: packageBase.value, checkPercent: false };
        if (!pageOk(page2)) return false;
    }
    return true;
});

/* ---------- 尾差補正 ---------- */
function applyCorrection(page) {
    const row = page.rows.find(r => r.key === correctionTargetKeys[page.id]);
    if (!row) return;
    const diff = page.base - pageAmountSum(page);
    if (row.type === 'group') {
        const children = row.children || [];
        if (children.length === 0) return;
        const last = children[children.length - 1];
        last.amount = (Math.round(Number(last.amount)) || 0) + diff;
    } else {
        row.amount = (Math.round(Number(row.amount)) || 0) + diff;
    }
    recalcPercentFromAmount(row, page.base);
    // 金額補正後，若比例仍不足 100%，將比例差額也歸入同一期（不檢查比例的頁面略過）
    if (page.checkPercent !== false) {
        const pDiff = Math.round((100 - pagePercentSum(page)) * 100) / 100;
        if (Math.abs(pDiff) > 0.01) {
            row.percent = Math.round((Number(row.percent) + pDiff) * 100) / 100;
        }
    }
}

/* ---------- 顯示工具 ---------- */
function formatNumber(value) {
    const num = Math.round(Number(value) || 0);
    return num.toLocaleString('en-US');
}
function fmt2(value) {
    const num = Number(value);
    if (isNaN(num)) return '-';
    return num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
function fmtPercent(value) {
    const num = Number(value) || 0;
    return `${Number.isInteger(num) ? num : Math.round(num * 100) / 100}%`;
}
function nameColspan(row, child) {
    // 表格名稱區共 3 欄（直排標籤/序號/名稱），依該列實際使用的欄數補 colspan
    let span = 3;
    if (row.verticalLabel) span -= 1;
    if (child.seq !== null) span -= 1;
    return span;
}

// 車位面積列：有面積資料才顯示（無車位或未填面積時整列隱藏）
const hasParkingArea = computed(() =>
    Number(props.context?.areas?.parkingPing) > 0 || Number(props.context?.areas?.parkingSqm) > 0);

const parkingText = computed(() => {
    const spots = props.context?.parkingSpots || [];
    if (spots.length === 0) return '無';
    return spots.map(p => `${p.spotId} (${formatNumber(p.price_transaction)}萬)`).join('、');
});

// ✅ 繳款銀行顯示控制：有資料的帳戶（房屋款/土地款/配套款）由用戶勾選是否顯示（兩頁各自勾選）
const availableBanks = computed(() => (props.context?.banks || []).filter(b =>
    b && ((b.bankName && b.bankName.trim()) || (b.accountName && b.accountName.trim()) || (b.account && b.account.trim()))
));
const selectedBankTitles = ref([]);
const selectedBankTitles2 = ref([]);
const banksPage1 = computed(() => availableBanks.value.filter(b => selectedBankTitles.value.includes(b.title)));
const banksPage2 = computed(() => availableBanks.value.filter(b => selectedBankTitles2.value.includes(b.title)));

const listDate = computed(() => formatInTimeZone(new Date(), 'Asia/Taipei', 'yyyy年M月d日'));

/* ---------- 預覽頁面（配套模式為兩頁） ---------- */
const previewPages = computed(() => {
    const pages = [{
        id: 1,
        suffix: '',
        totalLabel: '總價',
        total: mainBase.value,
        rows: editRows.value,
        banks: banksPage1.value
    }];
    if (packageModeEnabled.value) {
        pages.push({
            id: 2,
            suffix: '（配套）',
            totalLabel: '配套總計',
            total: packageBase.value,
            rows: editRows2.value,
            banks: banksPage2.value
        });
    }
    return pages;
});

/* ---------- 下載 ---------- */
const downloading = reactive({ pdf: false, excel: false });

function base64ToBlob(base64, mimeType) {
    const byteChars = atob(base64);
    const byteNumbers = new Array(byteChars.length);
    for (let i = 0; i < byteChars.length; i++) {
        byteNumbers[i] = byteChars.charCodeAt(i);
    }
    return new Blob([new Uint8Array(byteNumbers)], { type: mimeType });
}

function mapRowsForPayload(rows) {
    return rows.map(r => {
        if (r.type === 'group') {
            return {
                type: 'group',
                name: r.name,
                percent: Number(r.percent) || 0,
                verticalLabel: r.verticalLabel || null,
                children: r.children.map(ch => ({
                    seq: ch.seq,
                    name: ch.name,
                    amount: Math.round(Number(ch.amount)) || 0,
                    note: ch.note || ''
                }))
            };
        }
        return {
            type: 'single',
            name: r.name,
            percent: Number(r.percent) || 0,
            amount: Math.round(Number(r.amount)) || 0,
            note: r.note || ''
        };
    });
}

async function download(format) {
    if (!canDownload.value) return;
    downloading[format] = true;
    try {
        // QR code：前端由網址即時生成 dataURL，隨 payload 傳給後端嵌入
        let qrDataUrl = null;
        if (docSettings.value.contractTemplateUrl) {
            qrDataUrl = await QRCode.toDataURL(docSettings.value.contractTemplateUrl, { width: 300, margin: 1 });
        }

        const c = props.context;
        const payload = {
            projectId: props.projectId,
            format,
            doc: {
                projectName: props.projectName,
                unitId: c.unitId,
                unitLabel: c.unitLabel || c.unitId,
                listDate: listDate.value,
                logoUrl: docSettings.value.logoUrl || null,
                qrDataUrl,
                parkingText: parkingText.value,
                areas: c.areas || {},
                rows: mapRowsForPayload(editRows.value),
                totalPrice: mainBase.value,
                banks: banksPage1.value,
                loanWarningText: docSettings.value.loanWarningText || '',
                remitNoteText: docSettings.value.remitNoteText || '',
                salesperson: c.salesperson || '',
                salesPhone: c.salesPhone || ''
            }
        };

        // ✅ 配套模式：第 2 頁（配套期款）資料
        if (packageModeEnabled.value) {
            payload.doc.packagePage = {
                totalLabel: '配套總計',
                rows: mapRowsForPayload(editRows2.value),
                totalPrice: packageBase.value,
                banks: banksPage2.value
            };
        }

        const result = await generatePaymentDocument(payload);
        if (result.status === 'success' && result.base64) {
            saveAs(base64ToBlob(result.base64, result.mimeType), result.fileName);
            toast.success(`付款表 ${format === 'pdf' ? 'PDF' : 'EXCEL'} 已下載`);
        } else {
            throw new Error(result.message || '後端發生未知錯誤');
        }
    } catch (error) {
        console.error('下載付款表失敗:', error);
        toast.error(`下載失敗: ${error.message}`);
    } finally {
        downloading[format] = false;
    }
}
</script>

<style scoped>
.editor-header {
    background-color: #f5f5f5;
    border-bottom: 1px solid #e0e0e0;
}
.editor-header-package {
    background-color: #FBE9E7;
    border-bottom: 1px solid #FFAB91;
}

/* ---------- 期款編輯表格 ---------- */
.edit-table {
    width: 100%;
}
.edit-row {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 4px 8px;
    border-bottom: 1px solid #eee;
}
.edit-row-head {
    font-weight: bold;
    color: #555;
    background-color: #fafafa;
    font-size: 0.85rem;
}
.edit-row-group {
    background-color: #f0f4ff;
}
.edit-row-child {
    background-color: #fff;
}
.edit-row-total {
    border-top: 2px solid #333;
    border-bottom: none;
    padding-top: 8px;
    font-size: 1.05rem;
}
.col-percent { flex: 0 0 92px; }
.col-name { flex: 1 1 auto; min-width: 0; font-size: 0.9rem; }
.col-amount { flex: 0 0 110px; }
.col-note { flex: 0 0 130px; }

/* ✅ 手機模式：編輯列改為兩行排版（比例+名稱+金額 / 備註整行），加大觸控空間 */
@media (max-width: 700px) {
    .edit-row {
        flex-wrap: wrap;
        row-gap: 6px;
        padding: 8px 6px;
    }
    .col-percent { flex: 0 0 84px; }
    .col-name { flex: 1 1 0; font-size: 0.85rem; }
    .col-amount { flex: 0 0 96px; }
    .edit-row .col-note { flex: 1 1 100%; }
    .edit-row-head .col-note { display: none; }
    .edit-row-total { font-size: 1rem; }
}

/* ✅ 手機模式：底部按鈕直向排列 */
.mobile-actions {
    flex-direction: column;
    align-items: stretch;
    gap: 8px;
}
.mobile-actions .v-btn {
    margin-left: 0 !important;
}

/* ---------- 付款表預覽（仿範本） ---------- */
.preview-wrapper {
    overflow-x: auto;
}
.preview-sheet {
    font-family: 'Noto Serif TC', 'PMingLiU', '新細明體', serif;
    background-color: white;
    width: 794px;              /* A4 96dpi 寬 */
    min-height: 1000px;
    margin: 0 auto 24px;
    padding: 36px 44px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.25);
    color: #000;
    font-size: 13px;
}
.ps-header {
    display: flex;
    align-items: flex-start;
    margin-bottom: 18px;
}
.ps-logo {
    flex: 0 0 160px;
    height: 70px;
    display: flex;
    align-items: center;
}
.ps-logo img {
    max-width: 150px;
    max-height: 68px;
    object-fit: contain;
}
.ps-title {
    flex: 1;
    text-align: center;
    font-size: 30px;
    font-weight: bold;
    letter-spacing: 10px;
    padding-top: 14px;
}
.ps-qr {
    flex: 0 0 130px;
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: 6px;
}
.ps-qr-label {
    font-size: 10px;
    text-align: right;
    line-height: 1.5;
}
.ps-info {
    display: flex;
    gap: 24px;
    margin-bottom: 14px;
}
.ps-info-left {
    flex: 0 0 250px;
    padding-top: 20px;
}
.ps-info-row {
    display: flex;
    align-items: center;
}
.ps-label {
    flex: 0 0 55px;
}
.ps-box {
    flex: 1;
    background-color: #e0e0e0;
    text-align: center;
    font-weight: bold;
    padding: 4px 6px;
    font-size: 14px;
}
.ps-info-right {
    flex: 1;
}
.ps-area-row {
    display: flex;
    align-items: center;
    border-bottom: 1px solid #999;
    padding: 2px 0;
}
.ps-area-gray .ps-area-val {
    background-color: #e0e0e0;
}
.ps-area-label {
    flex: 0 0 110px;
    text-align: right;
}
.ps-area-val {
    flex: 1;
    text-align: center;
    padding: 2px 0;
}
.ps-area-val.strong {
    font-weight: bold;
}
.ps-date {
    font-size: 11px;
    margin-bottom: 2px;
}
.ps-table {
    width: 100%;
    border-collapse: collapse;
    border: 1.5px solid #000;
}
.ps-table th,
.ps-table td {
    border: 0.5px solid #000;
    padding: 4px 5px;
    text-align: center;
}
.ps-table th {
    background-color: #e0e0e0;
    font-weight: bold;
}
.ps-percent {
    font-weight: bold;
    width: 10%;
}
.ps-vlabel {
    width: 26px;
    padding: 0 2px !important;
}
.ps-vlabel span {
    writing-mode: vertical-lr;
    letter-spacing: 6px;
    display: inline-block;
}
.ps-seq {
    width: 32px;
}
.ps-amount {
    font-weight: bold;
    width: 18%;
}
.ps-note {
    width: 27%;
    font-size: 11px;
    text-align: left !important;
}
.ps-total-row td {
    border-top: 1.5px solid #000;
}
.ps-total-name {
    font-size: 18px;
    font-weight: bold;
    letter-spacing: 8px;
}
.ps-total-amount {
    font-size: 15px;
}
.ps-warning {
    color: #c00000;
    font-weight: bold;
    text-align: center;
    font-size: 12px;
    margin: 8px 0;
}
.ps-bank-box {
    border: 1.5px solid #000;
    padding: 8px 14px;
    margin-bottom: 14px;
}
.ps-bank-line {
    display: flex;
    align-items: center;
    padding: 2px 0;
    flex-wrap: wrap;
}
.ps-bank-label {
    color: #333;
}
.ps-bank-val {
    font-weight: bold;
    margin-left: 6px;
}
.ps-remit {
    color: #c00000;
    font-weight: bold;
    font-size: 12px;
    margin-top: 4px;
}
.ps-footer {
    border: 1.5px solid #000;
    padding: 6px 14px;
    display: flex;
    align-items: center;
    gap: 18px;
}
.ps-footer-val {
    font-weight: bold;
    font-size: 15px;
    flex: 1;
    text-align: center;
}
</style>
