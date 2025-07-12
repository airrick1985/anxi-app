<template>
    <v-dialog 
        :model-value="show" 
        @update:model-value="$emit('update:show', $event)" 
        :fullscreen="isMobile"
        :max-width="isMobile ? '100%' : '95vw'" 
        transition="dialog-bottom-transition"
    >
        <v-card class="d-flex flex-column" style="height: 100vh;">
            <v-card-title class="pa-4 header-sticky">
                <v-row align="center" no-gutters>
                    <v-col>
                        <span class="text-h5">付款表設定 - {{ formData['戶別'] }}</span>
                    </v-col>
                    <v-col class="text-right">
                        <v-btn icon="mdi-close" variant="text" @click="$emit('update:show', false)"></v-btn>
                    </v-col>
                </v-row>
            </v-card-title>
            
            <v-divider></v-divider>

            <v-card-text style="overflow-y: auto; flex-grow: 1;">
           <v-container fluid v-if="formData">
    <v-row>
        <v-col cols="12" md="4">
            <v-card class="mb-5" elevation="2">
                <v-card-item class="card-header">
                    <v-card-title>
                        <v-icon start>mdi-file-sign</v-icon>
                        成交資訊
                    </v-card-title>
                </v-card-item>
                <v-divider></v-divider>
                <v-card-text>
                    <v-row>
                        <v-col cols="12" sm="6">
                            <v-select
                                v-model="formData.合約方式"
                                :items="contractTypeOptions"
                                label="合約方式"
                                variant="outlined"
                                dense
                                @update:model-value="handleContractTypeChange"
                            ></v-select>
                        </v-col>
                        <v-col cols="12" sm="6">
                            <v-select
                                v-model="formData.是否首購"
                                :items="firstPurchaseOptions"
                                label="是否首購"
                                variant="outlined"
                                dense
                            ></v-select>
                        </v-col>
                        <v-col cols="12" sm="6">
                            <v-text-field
                                v-model.number="formData.房屋成交價"
                                class="price-value"
                                label="房屋成交價"
                                variant="outlined"
                                dense
                                suffix="萬"
                                type="number"
                            ></v-text-field>
                        </v-col>
                        <v-col cols="12" sm="6">
                            <v-text-field
                                :model-value="formatNumber(formData['房屋總底價'])"
                                label="房屋底價"
                                variant="outlined"
                                dense
                                readonly
                                suffix="萬"
                            ></v-text-field>
                        </v-col>
                    </v-row>
                    
                    <v-divider class="my-3"></v-divider>

                    <div class="d-flex justify-space-between align-center mb-2">
                        <span class="text-subtitle-1">持有車位</span>
                        <v-btn size="small" color="primary" @click="openParkingEditModal">
                            <v-icon left>mdi-pencil</v-icon>編輯車位
                        </v-btn>
                    </div>
                    <v-list lines="two" dense v-if="formData.持有車位 && formData.持有車位.length > 0" class="pa-0">
                        <template v-for="(parking, index) in formData.持有車位" :key="parking['車位編號']">
                            <v-list-item class="pa-0">
                                <v-row align="center" no-gutters>
                                    <v-col cols="12" sm="5">
                                        <p class="font-weight-bold text-subtitle-1">{{ parking['車位編號'] }}</p>
                                        <p class="text-caption text-grey-darken-1">{{ parking['車位尺寸'] || '標準' }}</p>
                                    </v-col>
                                    <v-col cols="6" sm="3" class="text-sm-right">
                                        <p class="text-caption text-grey-darken-1 mb-n1">底價</p>
                                        <p>{{ formatNumber(parking['車位底價']) }} 萬</p>
                                    </v-col>
                                    <v-col cols="6" sm="4" class="text-sm-right">
                                        <p class="text-caption text-blue-darken-2 mb-n1">成交價</p>
                                        <p class="font-weight-bold text-blue-darken-2">{{ formatNumber(parking['車位成交價']) }} 萬</p>
                                    </v-col>
                                </v-row>
                            </v-list-item>
                            <v-divider v-if="index < formData.持有車位.length - 1"></v-divider>
                        </template>
                    </v-list>
                    <p v-else class="text-center text-grey-darken-1 py-4">-- 無持有車位 --</p>
                </v-card-text>
            </v-card>
            
            <v-card class="mb-5" elevation="2">
                <v-card-item class="card-header">
                    <v-card-title>
                        <v-icon start>mdi-account-tie</v-icon>
                        銷售人員
                    </v-card-title>
                </v-card-item>
                <v-divider></v-divider>
                <v-card-text>
                    <v-row>
                        <v-col cols="12" sm="6">
                            <v-select
                                v-model="formData.銷售"
                                :items="personnelOptions"
                                label="銷售人員"
                                variant="outlined"
                                dense
                            ></v-select>
                        </v-col>
                        <v-col cols="12" sm="6">
                            <v-text-field
                                :model-value="salesPhone"
                                label="聯絡電話"
                                variant="outlined"
                                dense
                                readonly
                            ></v-text-field>
                        </v-col>
                    </v-row>
                </v-card-text>
            </v-card>
            
 <v-card class="mb-5" elevation="2">
                <v-card-item class="card-header">
                    <v-card-title>
                        <v-icon start>mdi-bank-transfer</v-icon>
                        匯款帳號
                    </v-card-title>
                </v-card-item>
                <v-divider></v-divider>
                <v-card-text>
                    <v-row>
                        <v-col cols="12">
                            <v-text-field
                                :model-value="remittanceAccountInfo['繳款銀行名稱']"
                                label="繳款銀行名稱"
                                variant="outlined"
                                dense
                                readonly
                            ></v-text-field>
                        </v-col>
                        <v-col cols="12">
                            <v-text-field
                                :model-value="remittanceAccountInfo['戶名']"
                                label="戶名"
                                variant="outlined"
                                dense
                                readonly
                            ></v-text-field>
                        </v-col>
                        <v-col cols="12">
                            <v-text-field
                                :model-value="remittanceAccountInfo['匯款帳號']"
                                label="匯款帳號"
                                variant="outlined"
                                dense
                                readonly
                            ></v-text-field>
                        </v-col>
                    </v-row>
                </v-card-text>
            </v-card>

        </v-col>

        <v-col cols="12" md="4">
             <v-card elevation="2" class="mb-5">
                <v-card-item class="card-header-accent">
                    <v-card-title>
                        <div class="d-flex justify-space-between align-center">
                            <span>
                                <v-icon start>mdi-cash-clock</v-icon>
                                付款明細
                            </span>
                            <v-btn
                                color="blue-grey"
                                variant="outlined"
                                size="small"
                                @click="resetAllPayments"
                            >
                                <v-icon start>mdi-restore</v-icon>
                                恢復預設
                            </v-btn>
                        </div>
                    </v-card-title>
                </v-card-item>
                <v-divider></v-divider>
                <v-card-text>
                    <div v-if="paymentError" class="pa-4 text-center text-red bg-red-lighten-5">
                        <p class="font-weight-bold">計算時發生錯誤</p>
                        <p class="text-caption">{{ paymentError }}</p>
                    </div>
                    <v-table v-else class="payment-table">
                        <thead>
                            <tr>
                                <th class="text-left" style="width: 45%;">項目</th>
                                <th class="text-right" style="width: 25%;">比例 (%)</th>
                                <th class="text-right" style="width: 30%;">金額 (萬)</th>
                            </tr>
                        </thead>
                        <tbody>
                            <template v-for="item in paymentItems" :key="item.id">
                                <tr :class="{ 'package-item-row': item.isPackageItem, 'parent-row': item.children.length > 0 }">
                                    <td>
                                        <div class="d-flex align-center">
                                            <v-btn
                                                v-if="item.children.length > 0"
                                                :icon="item.isExpanded ? 'mdi-chevron-down' : 'mdi-chevron-right'"
                                                variant="text" density="compact" class="mr-1 expand-toggle-btn"
                                                @click="toggleExpansion(item.id)"
                                            ></v-btn>
                                            <span :class="{ 'pl-9': item.children.length === 0 }">{{ item.name }}</span>
                                            <v-btn icon="mdi-restart" variant="text" density="compact" color="grey" class="ml-1" @click="resetItem(item)">
                                                <v-tooltip activator="parent" location="top">重置</v-tooltip>
                                            </v-btn>
                                        </div>
                                    </td>
                                    <td>
                                        <v-text-field
                                            v-model.number="item.userRatio"
                                            @update:model-value="handleRatioChange(item)"
                                            :variant="item.children.length > 0 ? 'plain' : 'underlined'"
                                            density="compact" hide-details type="number"
                                            class="text-right" suffix="%"
                                        ></v-text-field>
                                    </td>
                                    <td>
                                        <v-text-field
                                            v-model.number="item.userAmount"
                                            @update:model-value="handleAmountChange(item)"
                                            :readonly="item.children.length > 0"
                                            :variant="item.children.length > 0 ? 'plain' : 'underlined'"
                                            density="compact" hide-details type="number"
                                            class="text-right font-weight-bold"
                                        ></v-text-field>
                                    </td>
                                </tr>
                                <template v-if="item.isExpanded">
                                    <tr v-for="child in item.children" :key="child.id" class="child-row" :class="{ 'package-item-row': child.isPackageItem }">
                                        <td class="pl-12">{{ child.name }}</td>
                                        <td></td>
                                        <td>
                                            <v-text-field
                                                v-model.number="child.userAmount"
                                                @update:model-value="updateParentState(item)"
                                                variant="underlined" density="compact" hide-details
                                                type="number" class="text-right"
                                            ></v-text-field>
                                        </td>
                                    </tr>
                                </template>
                            </template>
                        </tbody>
                        <tfoot>
                            <tr class="summary-row target-total">
                                <td class="font-weight-bold" colspan="2">應付總額</td>
                                <td class="text-right font-weight-bold">{{ formatNumber(paymentSummary.targetTotal, 2) }}</td>
                            </tr>
                            <tr class="summary-row">
                                <td colspan="2">目前總計</td>
                                <td class="text-right">{{ formatNumber(paymentSummary.currentTotalAmount, 2) }}</td>
                            </tr>
                            <tr class="summary-row difference-row" :class="{ 'text-red': paymentSummary.difference !== 0, 'text-green': paymentSummary.difference === 0 }">
                                <td class="font-weight-bold" colspan="2">差額 (待分配)</td>
                                <td class="text-right font-weight-bold">{{ formatNumber(paymentSummary.difference, 2) }}</td>
                            </tr>
                        </tfoot>
                    </v-table>
                </v-card-text>
            </v-card>
        </v-col>

        <v-col cols="12" md="4">
            <v-card class="mb-5" elevation="2">
                <v-card-item class="card-header-accent">
                    <v-card-title>
                        <v-icon start>mdi-calculator-variant</v-icon>
                        金額總覽
                    </v-card-title>
                </v-card-item>
                <v-divider></v-divider>
                <v-card-text class="price-summary">
                    <div class="price-item">
                        <span class="price-label">房屋成交價</span>
                        <div class="d-flex flex-column align-end">
                            <span class="price-value">{{ formatNumber(formData.房屋成交價) }} 萬</span>
                            <small class="text-grey">{{ formatNumber(calculated.houseSaleUnitPrice, 2) }} 萬/坪</small>
                        </div>
                    </div>
                    <div class="price-item">
                        <span class="price-label">房屋底價</span>
                        <div class="d-flex flex-column align-end">
                            <span class="price-value price-value-secondary">{{ formatNumber(formData['房屋總底價']) }} 萬</span>
                            <small class="text-grey">{{ formatNumber(calculated.houseBaseUnitPrice, 2) }} 萬/坪</small>
                        </div>
                    </div>
                    <v-divider class="my-2"></v-divider>
                    <div class="price-item">
                        <span class="price-label">車位總成交價</span>
                        <span class="price-value">{{ formatNumber(calculated.totalParkingSalePrice) }} 萬</span>
                    </div>
                    <div class="price-item">
                        <span class="price-label">車位總底價</span>
                        <span class="price-value price-value-secondary">{{ formatNumber(calculated.totalParkingBasePrice) }} 萬</span>
                    </div>
                    <v-divider class="my-2"></v-divider>
                    <div v-if="formData.合約方式 === '毛胚合約'" class="price-item">
                        <span class="price-label">配套房屋總價</span>
                        <span class="price-value">{{ formatNumber(formData['配套房屋總價']) }} 萬</span>
                    </div>
                    <div v-if="formData.合約方式 === '毛胚合約'" class="price-item">
                        <span class="price-label">配套價</span>
                        <span class="price-value">{{ formatNumber(calculated.packagePrice) }} 萬</span>
                    </div>
                    <v-divider class="my-2 thick-divider"></v-divider>
                    <div class="price-item total">
                        <span class="price-label">成交總價</span>
                        <span class="price-value total-value">{{ formatNumber(calculated.grandTotalSalePrice) }} 萬</span>
                    </div>
                    <div class="price-item total">
                        <span class="price-label">總底價</span>
                        <span class="price-value total-value text-red">{{ formatNumber(calculated.grandTotalBasePrice) }} 萬</span>
                    </div>
                    <v-divider class="my-2"></v-divider>
<div class="price-item difference" :class="{ 'positive': calculated.priceDifference >= 0, 'negative': calculated.priceDifference < 0 }">                        <span class="price-label">溢差價</span>
                        <span class="price-value">{{ formatNumber(calculated.priceDifference) }} 萬</span>
                    </div>
                </v-card-text>
            </v-card>
        </v-col>
    </v-row>

    <v-row>
<v-col cols="12" md="4">
            <v-card elevation="2" class="mb-5">
                <v-card-item class="card-header">
                    <v-card-title>
                        <v-icon start>mdi-texture-box</v-icon>
                        面積資訊
                    </v-card-title>
                </v-card-item>
                <v-divider></v-divider>
                <v-card-text>
                    <div class="total-area-card mb-4">
                        <div class="area-summary-item">
                            <div>
                                <div class="total-area-title">房屋總面積</div>
                                <div class="total-area-value">{{ formatNumber(formData['房屋面積(坪)'], 2) }} 坪</div>
                                <div class="total-area-subtitle">{{ formatNumber(formData['房屋面積(平方公尺)'], 2) }} m²</div>
                            </div>
                        </div>
                        <v-divider vertical class="mx-4"></v-divider>
                        <div class="area-summary-item">
                            <div>
                                <div class="total-area-title">公設比</div>
                                <div class="total-area-value">{{ formatPercentage(formData['公設比']) }}</div>
                                <div class="total-area-subtitle">&nbsp;</div>
                            </div>
                        </div>
                    </div>
                    <div class="area-details mt-3">
                        <div class="area-group">
                            <div class="area-group-title">
                                <v-icon size="small" class="mr-1">mdi-home</v-icon>
                                建物面積明細
                            </div>
                            <div class="area-item-header">
                                <span>項目</span>
                                <span>坪數</span>
                                <span>m²</span>
                            </div>
                            <div class="area-item">
                                <span>主建物 (室內)</span>
                                <span class="area-ping-value">{{ formatNumber(formData['主建物面積(坪)'], 2) }}</span>
                                <span>{{ formatNumber(formData['主建物面積(平方公尺)'], 2) }}</span>
                            </div>
                            <div class="area-item">
                                <span>附屬建物 (陽台)</span>
                                <span class="area-ping-value">{{ formatNumber(formData['附屬建物面積(坪)'], 2) }}</span>
                                <span>{{ formatNumber(formData['附屬建物面積(平方公尺)'], 2) }}</span>
                            </div>
                            <div class="area-item">
                                <span>共用部分 (公設)</span>
                                <span class="area-ping-value">{{ formatNumber(formData['共用部分面積(坪)'], 2) }}</span>
                                <span>{{ formatNumber(formData['共用部分面積(平方公尺)'], 2) }}</span>
                            </div>
                            <div class="area-item">
                                <span>露臺 (不計坪)</span>
                                <span class="area-ping-value">{{ formatNumber(formData['露臺(坪)'], 2) }}</span>
                                <span>-</span>
                            </div>
                        </div>
                    </div>
                    <div class="area-details mt-2">
                        <div class="area-group">
                            <div class="area-group-title">
                                <v-icon size="small" class="mr-1">mdi-earth</v-icon>
                                土地持分資訊
                            </div>
                             <div class="area-item-header">
                                <span>項目</span>
                                <span>坪數</span>
                                <span>m²</span>
                            </div>
                            <div class="area-item">
                                <span>土地持分面積</span>
                                <span class="area-ping-value">{{ formatNumber(formData['土地持分面積(坪)'], 2) }}</span>
                                <span>{{ formatNumber(formData['土地持分面積(平方公尺)'], 2) }}</span>
                            </div>
                            <div class="area-item">
                                <span>土地持分</span>
                                <span class="font-weight-medium">十萬分之 {{ formData['土地持分'] || 'N/A' }}</span>
                                <span>-</span>
                            </div>
                        </div>
                    </div>
                </v-card-text>
            </v-card>
        </v-col>
    </v-row>
</v-container>
            </v-card-text>

            <v-divider></v-divider>
            
<v-card-actions class="pa-4 footer-sticky" :class="{ 'mobile-footer': isMobile }">
    <v-spacer></v-spacer>

    <v-btn
        v-if="unitData && unitData['資料夾URL']"
        color="teal"
        variant="flat"
        :href="unitData['資料夾URL']"
        target="_blank"
    >
        <v-icon start>mdi-folder-google-drive</v-icon>
         {{ unitData['戶別'] }}資料夾
    </v-btn>

    <v-btn
        color="indigo"
        variant="flat"
        @click="handleGenerateDocument"
        :loading="isGenerating"
        :disabled="isGenerating"
    >
        <v-icon start>mdi-file-document-edit-outline</v-icon>
        製作付款表
    </v-btn>

    <v-btn color="primary" variant="text" @click="$emit('update:show', false)">關閉</v-btn>

</v-card-actions>
        </v-card>

        <ParkingEditModal
            :show="parkingEditDialog"
            @update:show="parkingEditDialog = $event"
            :all-parking-data="allData['車位'] || []"
            :initial-selected-parking="formData ? formData.持有車位 : []"
            @confirm="updateSelectedParking"
            @request-open-slide="$emit('request-open-slide')"
        />
    </v-dialog>

<v-dialog 
    v-model="showEmailModal" 
    max-width="600px" 
    persistent
>
    <v-card>
        <v-card-title class="d-flex align-center">
            <v-icon start color="primary">mdi-email-send-outline</v-icon>
            <span class="text-h6">傳送付款表</span>
            <v-spacer></v-spacer>
            <v-btn icon="mdi-close" variant="text" @click="showEmailModal = false"></v-btn>
        </v-card-title>

        <v-divider></v-divider>

        <v-card-text>
            <div class="mb-4">
                <p class="font-weight-bold mb-2">已產生下列檔案：</p>
                <div>
             <v-chip
    v-for="file in generatedFiles"
    :key="file.name"
    class="mr-2 mb-2"
    :color="getChipStyle(file.type).color"
    label
    link
    :href="file.url"
    target="_blank"
>
    <v-icon start>
        {{ getChipStyle(file.type).icon }}
    </v-icon>
    {{ file.name }}
</v-chip>
                </div>
            </div>

            <v-divider class="my-4"></v-divider>

            <div>
                <p class="font-weight-bold mb-1">請勾選要傳送通知的對象：</p>
                <p class="text-caption text-grey-darken-1 mb-3">系統已根據預設規則自動勾選。</p>

                <div class="email-list-container">
                    <v-list-item 
                        v-for="recipient in emailRecipients" 
                        :key="recipient.email"
                        density="compact"
                    >
                        <template v-slot:prepend>
                            <v-checkbox-btn v-model="recipient.selected"></v-checkbox-btn>
                        </template>
                        <v-list-item-title>{{ recipient.name }}</v-list-item-title>
                        <v-list-item-subtitle>{{ recipient.email }}</v-list-item-subtitle>
                    </v-list-item>
                </div>
            </div>
        </v-card-text>

        <v-divider></v-divider>

        <v-card-actions class="pa-4">
            <v-spacer></v-spacer>
            <v-btn 
                color="grey-darken-1" 
                variant="text" 
                @click="showEmailModal = false"
                :disabled="isSendingEmail"
            >
                稍後再傳
            </v-btn>
            <v-btn
                color="primary"
                variant="flat"
                @click="sendEmails"
                :loading="isSendingEmail"
                :disabled="isSendingEmail"
            >
                <v-icon start>mdi-send</v-icon>
                傳送
            </v-btn>
        </v-card-actions>
    </v-card>
</v-dialog>

</template>

<script setup>
import { ref, computed, watch, defineProps, defineEmits } from 'vue';
import { useDisplay } from 'vuetify';
import ParkingEditModal from '@/components/ParkingEditModal.vue';
import { generatePaymentSchedule, sendPaymentScheduleEmail } from '@/api.js'; 


// --- Display & Props & Emits ---
const { mobile: isMobile } = useDisplay();
const props = defineProps({
    show: Boolean,
    unitData: { type: Object, default: () => null },
    projectName: { type: String, required: true },
    allData: { type: Object, required: true },
});
const emit = defineEmits(['update:show', 'request-open-slide']);

// --- 主要表單狀態 ---
const formData = ref(null);
const parkingEditDialog = ref(false);
const paymentError = ref(null);

// --- 全新的付款明細核心狀態 ---
const paymentItems = ref([]);
const expandedItems = ref(new Set());
const paymentSummary = ref({
    targetTotal: 0,
    currentTotalAmount: 0,
    difference: 0,
});


// --- Options (下拉選單選項) ---
const personnelOptions = computed(() =>
    (props.allData['銷售人員'] || []).map(p => p['銷售人員']).filter(Boolean)
);
const salesOptionsData = computed(() => props.allData['合約方式及是否首購'] || []);
const contractTypeOptions = computed(() => {
    return [...new Set(salesOptionsData.value.map(item => item['合約方式']).filter(Boolean))]
});
const firstPurchaseOptions = computed(() => {
    return [...new Set(salesOptionsData.value.map(item => item['是否首購']).filter(Boolean))]
});
const salesPhone = computed(() => {
    if (!formData.value || !formData.value.銷售) return '';
    const personnel = (props.allData['銷售人員'] || []).find(p => p['銷售人員'] === formData.value.銷售);
    return personnel ? personnel['銷售電話'] : '';
});

// [新增這段] 計算對應的匯款帳號資訊
const remittanceAccountInfo = computed(() => {
    // 確保 formData 和匯款帳號資料都已載入
    if (!formData.value || !props.allData['匯款帳號']) {
        return { '繳款銀行名稱': 'N/A', '戶名': 'N/A', '匯款帳號': 'N/A' };
    }

    const currentUnitId = formData.value['戶別'];
    const accountData = props.allData['匯款帳號'] || [];

    // 使用當前的戶別去查找對應的帳號資料
    const foundAccount = accountData.find(acc => acc['戶別'] === currentUnitId);

    if (foundAccount) {
        return foundAccount;
    }

    // 如果找不到，回傳預設值
    return { '繳款銀行名稱': '查無資料', '戶名': '查無資料', '匯款帳號': '查無資料' };
});

// --- 主要計算屬性 (金額總覽) ---
const calculated = computed(() => {
    if (!formData.value) {
        return {
            houseSaleUnitPrice: 0, houseBaseUnitPrice: 0,
            totalParkingSalePrice: 0, totalParkingBasePrice: 0,
            grandTotalSalePrice: 0, grandTotalBasePrice: 0,
            priceDifference: 0, packagePrice: 0
        };
    }
    const data = formData.value;
    const houseArea = Number(data['房屋面積(坪)']) || 0;
    const houseSalePrice = Number(data.房屋成交價) || 0;
    const houseBasePrice = Number(data['房屋總底價']) || 0;
    const houseSaleUnitPrice = houseArea > 0 ? houseSalePrice / houseArea : 0;
    const houseBaseUnitPrice = houseArea > 0 ? houseBasePrice / houseArea : 0;
    const totalParkingSalePrice = (data.持有車位 || []).reduce((sum, p) => sum + (Number(p['車位成交價']) || 0), 0);
    const totalParkingBasePrice = (data.持有車位 || []).reduce((sum, p) => sum + (Number(p['車位底價']) || 0), 0);
    const grandTotalSalePrice = houseSalePrice + totalParkingSalePrice;

    let packagePrice = 0;
    if (data.合約方式 === '毛胚合約') {
        const packageHouseTotalPrice = Number(data['配套房屋總價']) || 0;
        packagePrice = grandTotalSalePrice - packageHouseTotalPrice;
    }
    
    const grandTotalBasePrice = houseBasePrice + totalParkingBasePrice;
    const priceDifference = grandTotalSalePrice - grandTotalBasePrice;

    return {
        houseSaleUnitPrice, houseBaseUnitPrice,
        totalParkingSalePrice, totalParkingBasePrice,
        grandTotalSalePrice, grandTotalBasePrice,
        priceDifference, packagePrice
    };
});

// --- 監聽器 (Watchers) ---
watch(() => props.show, (newVal) => {
    if (newVal) {
        const defaultStructure = {
            '戶別': 'N/A', '房屋成交價': 0, '配套價': 0,'配套房屋總價': 0, 
            '合約方式': contractTypeOptions.value.length > 0 ? contractTypeOptions.value[0] : '',
            '是否首購': firstPurchaseOptions.value.length > 0 ? firstPurchaseOptions.value[0] : '',
            '銷售': personnelOptions.value.length > 0 ? personnelOptions.value[0] : '',
            '持有車位': [], '房屋總底價': 0, '房屋總表價': 0, '房屋面積(坪)': 0,
            '房屋面積(平方公尺)': 0, '公設比': 0, '主建物面積(坪)': 0, '主建物面積(平方公尺)': 0,
            '附屬建物面積(坪)': 0, '附屬建物面積(平方公尺)': 0, '共用部分面積(坪)': 0,
            '共用部分面積(平方公尺)': 0, '露臺(坪)': 0, '土地持分面積(坪)': 0,
            '土地持分面積(平方公尺)': 0, '土地持分': 'N/A'
        };
        const initialData = { ...defaultStructure, ...(props.unitData || {}) };
        if (props.unitData && !initialData.房屋成交價) {
            initialData.房屋成交價 = initialData.房屋總表價;
        }
        formData.value = JSON.parse(JSON.stringify(initialData));
    }
}, { immediate: true });

watch(() => formData.value?.合約方式, (newVal) => {
    if (!formData.value) return;
    if (newVal !== '毛胚合約') {
        formData.value['配套房屋總價'] = 0;
    } else {
        formData.value['配套房屋總價'] = props.unitData?.['配套房屋總價'] || 0;
    }
});

watch(() => [
        formData.value?.合約方式, 
        formData.value?.是否首購,
        calculated.value.grandTotalSalePrice,
        calculated.value.packagePrice
    ],() => {
        initializePaymentItems();
    },{ deep: true, immediate: true }
);

// --- 全新最終版：付款明細處理函式 (請用這整段替換舊的) ---

/**
 * 主要的初始化函式
 */
function initializePaymentItems() {
    if (!formData.value) return;

    try {
        paymentError.value = null;
        const rawPaymentTerms = props.allData['期款比例'] || [];
        const rawPackageTerms = props.allData['配套期款'] || [];
        const context = buildCalculationContext();
        
        const initialAmounts = runCalculationEngine(rawPaymentTerms, context.basePrice, '總價', context);
        const initialPackageAmounts = context.usePackageDeal
            ? runCalculationEngine(rawPackageTerms, context.packageBasePrice, '配套金額')
            : {};

        const itemsMap = new Map();
        const topLevelItems = [];

        // 處理一般期款
        rawPaymentTerms.forEach(term => {
            const amount = initialAmounts[term['編號']] || 0;
        const ratio = context.basePrice > 0 ? Math.round((amount / context.basePrice) * 100) : 0;
            itemsMap.set(term['編號'], {
                id: term['編號'],
                name: term['項目名稱'],
                parentId: term['子項目'] || null,
                userAmount: amount,
                originalAmount: amount,
                userRatio: ratio,
                originalRatio: ratio,
                isPackageItem: false,
                children: [],
                isExpanded: expandedItems.value.has(term['編號']),
            });
        });

        // 處理配套款項 (如果有的話)
        if (context.usePackageDeal) {
            const packageParentItem = {
                id: '__PACKAGE_DEAL__', name: '配套', parentId: null,
                userAmount: context.packageBasePrice, originalAmount: context.packageBasePrice,
                userRatio: context.basePrice > 0 ? (context.packageBasePrice / context.basePrice) * 100 : 0,
                originalRatio: context.basePrice > 0 ? (context.packageBasePrice / context.basePrice) * 100 : 0,
                isPackageItem: true, children: [], 
                isExpanded: expandedItems.value.has('__PACKAGE_DEAL__')
            };
            itemsMap.set(packageParentItem.id, packageParentItem);

            rawPackageTerms.forEach(term => {
                // BUG 1 修正：為配套款項的 ID 加上前綴，避免與一般款項衝突
                const uniqueId = `pkg_${term['編號']}`;
                const amount = initialPackageAmounts[term['編號']] || 0;
                const ratio = context.packageBasePrice > 0 ? (amount / context.packageBasePrice) * 100 : 0;
                itemsMap.set(uniqueId, {
                    id: uniqueId, name: term['項目名稱'], parentId: '__PACKAGE_DEAL__',
                    userAmount: amount, originalAmount: amount,
                    userRatio: ratio, originalRatio: ratio, // 子項目的比例是相對於其父層(配套總價)
                    isPackageItem: true, children: [],
                });
            });
        }
        
        itemsMap.forEach(item => {
            if (item.parentId && itemsMap.has(item.parentId)) {
                itemsMap.get(item.parentId).children.push(item);
            } else {
                topLevelItems.push(item);
            }
        });

        paymentItems.value = topLevelItems;
        updateSummary();

    } catch (e) {
        paymentError.value = e.message;
        paymentItems.value = [];
    }
}

/**
 * 處理金額變動 (適用於可編輯的項目)
 */
function handleAmountChange(item) {
    const isChildOfPackage = item.parentId === '__PACKAGE_DEAL__';
    const basePrice = isChildOfPackage ? calculated.value.packagePrice : getBasePrice();

    if (basePrice > 0) {
        item.userRatio = Math.round((item.userAmount / basePrice) * 100);
    } else {
        item.userRatio = 0;
    }
    
    // 如果是子項目，還需要更新父層的總額
    if (item.parentId) {
        const parent = findItemRecursive(paymentItems.value, item.parentId);
        if (parent) {
            updateParentState(parent);
        }
    }
    updateSummary();
}

/**
 * 處理比例變動 (全新版本)
 */
function handleRatioChange(item) {
    // 邏輯 1: 如果修改的是父項目 (如：工程期款)
    if (item.children && item.children.length > 0) {
        const mainBasePrice = getBasePrice();
        if (mainBasePrice === 0) return;

        const oldParentAmount = item.children.reduce((sum, child) => sum + child.userAmount, 0);
        const newParentAmount = mainBasePrice * (item.userRatio / 100);
        const delta = newParentAmount - oldParentAmount;

        // 按比例分配差額給子項目
        if (oldParentAmount > 0) {
            item.children.forEach(child => {
                const proportion = child.userAmount / oldParentAmount;
                child.userAmount += delta * proportion;
            });
        } else if (item.children.length > 0) {
            // 如果原始金額為0，則平均分配
            const amountPerChild = newParentAmount / item.children.length;
            item.children.forEach(child => {
                child.userAmount = amountPerChild;
            });
        }

        // 分配完後，更新父層的總額，以確保其為子項目的精確加總
        updateParentState(item);
    }
    // 邏輯 2: 如果修改的是獨立項目 (沒有子項目，也沒有父項目)
    else if (!item.parentId) {
        const mainBasePrice = getBasePrice();
        const newAmount = mainBasePrice * (item.userRatio / 100);
        item.userAmount = newAmount;
    }
    // 子項目的比例不應被直接修改，所以此處不處理

    updateSummary();
}


/**
 * 更新父項目的狀態 (金額與比例)
 */
function updateParentState(parentItem) {
    // 父項目的金額是子項目金額的總和
    parentItem.userAmount = parentItem.children.reduce((sum, child) => sum + (Number(child.userAmount) || 0), 0);

    // 父項目的比例是其總金額相對於主基準價的比例
    const mainBasePrice = getBasePrice();
    if (mainBasePrice > 0) {
        parentItem.userRatio = Math.round((parentItem.userAmount / mainBasePrice) * 100);
    } else {
        parentItem.userRatio = 0;
    }
}


/**
 * 重置項目
 */
function resetItem(itemToReset) {
    if (itemToReset.children.length > 0) { // 如果是父項目
        itemToReset.children.forEach(child => {
            child.userAmount = child.originalAmount;
            child.userRatio = child.originalRatio;
        });
        updateParentState(itemToReset);
    } else { // 如果是子項目或獨立項目
        itemToReset.userAmount = itemToReset.originalAmount;
        itemToReset.userRatio = itemToReset.originalRatio;
        if (itemToReset.parentId) {
            const parent = findItemRecursive(paymentItems.value, itemToReset.parentId);
            if (parent) updateParentState(parent);
        }
    }
    updateSummary();
}


/**
 * 更新總計與差額
 */
function updateSummary() {
    const context = buildCalculationContext();
    const targetTotal = context.basePrice + (context.usePackageDeal ? context.packageBasePrice : 0);
    const currentTotalAmount = paymentItems.value.reduce((sum, item) => sum + (Number(item.userAmount) || 0), 0);
    paymentSummary.value = {
        targetTotal,
        currentTotalAmount,
        difference: targetTotal - currentTotalAmount
    };
}

/**
 * 展開/閉合項目
 */
function toggleExpansion(itemId) {
    if (expandedItems.value.has(itemId)) {
        expandedItems.value.delete(itemId);
    } else {
        expandedItems.value.add(itemId);
    }
    const item = findItemRecursive(paymentItems.value, itemId);
    if (item) item.isExpanded = !item.isExpanded;
}


// --- 輔助函式 (無變動) ---
function buildCalculationContext() {
    if (!formData.value) return {};
    const usePackageDeal = formData.value.合約方式 === '毛胚合約';
    const isFirstTimeBuyer = formData.value.是否首購 === '是';
    const basePrice = getBasePrice();
    const packageBasePrice = calculated.value.packagePrice;
    const conditionCol = isFirstTimeBuyer
        ? (basePrice >= 4000 ? '>=4000首購' : '<4000首購')
        : (basePrice >= 4000 ? '>=4000非首購' : '<4000非首購');
    return { usePackageDeal, basePrice, packageBasePrice, conditionCol };
}

function getBasePrice() {
    if (!formData.value) return 0;
    return formData.value.合約方式 === '毛胚合約'
        ? (Number(formData.value['配套房屋總價']) || 0)
        : calculated.value.grandTotalSalePrice;
}

function findItemRecursive(items, id) {
    for (const item of items) {
        if (item.id === id) return item;
        if (item.children && item.children.length > 0) {
            const found = findItemRecursive(item.children, id);
            if (found) return found;
        }
    }
    return null;
}
// --- 其他方法 ---

function handleContractTypeChange(type) {
    const isPackage = type === '毛胚合約'; 
    console.log(`合約方式改為: ${type}, 套用配套: ${isPackage}`);
}

function openParkingEditModal() {
    parkingEditDialog.value = true;
}

function updateSelectedParking(newParkingList) {
    if (formData.value) {
        formData.value.持有車位 = newParkingList;
    }
}

// --- [新增] 文件產出相關狀態 ---
const isGenerating = ref(false); // 控制按鈕的 loading 狀態
const generatedFiles = ref([]);  // 用於儲存產出檔案的連結
const showEmailModal = ref(false); // 控制 Email 彈出視窗的顯示
const isSendingEmail = ref(false);    // 控制 Email 發送按鈕的 loading 狀態
const emailRecipients = ref([]); // 存放 Email 勾選列表

/**
 * [最終修正版] 準備要發送到後端 GAS 的資料 payload
 * 這個版本會正確地攤平父子項目，解決摺疊項目資料遺失的問題。
 * @returns {object} 包含所有模板所需資訊的物件
 */
function prepareDocumentPayload() {
    // --- 準備「一般付款表」資料 ---
    const generalPaymentList = [];
    paymentItems.value
        .filter(item => !item.isPackageItem) // 過濾掉所有配套相關的
        .forEach(item => {
            // 先將父項目或獨立項目加進來
            generalPaymentList.push({
                項目名稱: item.name,
                項目比例: Math.round(item.userRatio),
                項目金額: item.userAmount
            });
            // 如果這個項目有子項目，就遍歷並把子項目也加進來
            if (item.children && item.children.length > 0) {
                item.children.forEach(child => {
                    // 在子項目前面加上縮排，使其在文件上看起來有層級感
                    generalPaymentList.push({
                        項目名稱: `    - ${child.name}`, // 加上縮排
                        項目比例: '', // 子項目沒有比例
                        項目金額: child.userAmount
                    });
                });
            }
        });

    const generalData = {
        戶別: formData.value['戶別'],
        銷售人員: formData.value['銷售'],
        聯絡電話: salesPhone.value,
        成交總價: calculated.value.grandTotalSalePrice,
        房屋總面積_坪: formData.value['房屋面積(坪)'],
        房屋總面積_M2: formData.value['房屋面積(平方公尺)'],
        主建物面積_坪: formData.value['主建物面積(坪)'],
        主建物面積_M2: formData.value['主建物面積(平方公尺)'],
        附屬建物面積_坪: formData.value['附屬建物面積(坪)'],
        附屬建物面積_M2: formData.value['附屬建物面積(平方公尺)'],
        共用部分面積_坪: formData.value['共用部分面積(坪)'],
        共用部分面積_M2: formData.value['共用部分面積(平方公尺)'],
        露臺面積_坪: formData.value['露臺(坪)'],
        土地持分面積_坪: formData.value['土地持分面積(坪)'],
        土地持分面積_M2: formData.value['土地持分面積(平方公尺)'],
        土地持分比例: formData.value['土地持分'],
        繳款銀行名稱: remittanceAccountInfo.value['繳款銀行名稱'],
        戶名: remittanceAccountInfo.value['戶名'],
        匯款帳號: remittanceAccountInfo.value['匯款帳號'],
        車位列表: (formData.value['持有車位'] || []).map(p => ({
            車位編號: p['車位編號'],
            車位成交價: p['車位成交價']
        })),
        付款項目列表: generalPaymentList // 使用我們剛剛攤平的列表
    };

    // --- 準備「裝修付款表」資料 ---
    const packagePaymentList = [];
    const packageParentItem = paymentItems.value.find(item => item.id === '__PACKAGE_DEAL__');
    
    if (packageParentItem && packageParentItem.children) {
        // 直接遍歷配套父項的子項目
        packageParentItem.children.forEach(child => {
            packagePaymentList.push({
                配套項目名稱: child.name,
                配套項目比例: Math.round(child.userRatio),
                配套項目金額: child.userAmount
            });
        });
    }

    const packageData = {
        戶別: formData.value['戶別'],
        銷售人員: formData.value['銷售'],
        聯絡電話: salesPhone.value,
        房屋總面積_坪: formData.value['房屋面積(坪)'],
        配套總價: calculated.value.packagePrice,
        配套項目列表: packagePaymentList
    };

    return { generalData, packageData };
}

/**
 * [主函式] 當點擊「製作付款表」按鈕時觸發
 */
async function handleGenerateDocument() {
    isGenerating.value = true;
    generatedFiles.value = []; // 清空上次的結果

    // 準備要發送到後端的資料
    const payload = {
        projectName: props.projectName,
        contractType: formData.value.合約方式,
        data: prepareDocumentPayload()
    };
    
    console.log("準備發送到後端的 Payload:", JSON.stringify(payload, null, 2));

    try {
        // [正式呼叫] 呼叫 api.js 中定義的函式
        const result = await generatePaymentSchedule(payload);
        
        if (result.status === 'success') {
            generatedFiles.value = result.files;
            alert('文件製作成功！'); 
            
            // 接著準備彈出 Email 視窗
            prepareAndShowEmailModal();
        } else {
            throw new Error(result.message || '後端發生未知錯誤');
        }
    } catch (error) {
        console.error('製作文件時發生錯誤:', error);
        alert(`製作失敗: ${error.message}`);
    } finally {
        isGenerating.value = false;
    }
}

/**
 * 準備並顯示 Email 發送視窗
 */
function prepareAndShowEmailModal() {
    console.log("準備彈出 Email 視窗...");
    const salesPersonnel = props.allData['銷售人員'] || [];
    const currentSalesperson = formData.value.銷售;

    const recipients = salesPersonnel.map(person => {
        const name = person['銷售人員'];
        const email = person['EMAIL'];

        // 檢查此人是否需要被預設勾選
        const isPreset = person['付款表預選'] === 'Y';
        const isCurrent = name === currentSalesperson;
        
        return {
            name: name,
            email: email,
            selected: isPreset || isCurrent // 規則：預選或當前銷售人員，則勾選
        };
    }).filter(person => person.email); // 過濾掉沒有 Email 的人員

    emailRecipients.value = recipients;
    showEmailModal.value = true;
}


/**
 * [新增] 點擊「傳送」按鈕後觸發
 */
async function sendEmails() {
    isSendingEmail.value = true;

    // 收集所有被勾選的 Email 地址
    const selectedEmails = emailRecipients.value
        .filter(r => r.selected)
        .map(r => r.email);

    if (selectedEmails.length === 0) {
        alert('請至少選擇一位收件人！');
        isSendingEmail.value = false;
        return;
    }
    
    // 準備要發送到後端的資料
    const payload = {
        projectName: props.projectName,
        recipients: selectedEmails,
        files: generatedFiles.value, // 已產生的檔案列表
        unitId: formData.value['戶別']
    };

    try {
        // [正式呼叫] 呼叫 api.js 中定義的函式
        const result = await sendPaymentScheduleEmail(payload);

        if (result.status === 'success') {
            alert(result.message || '郵件已成功寄出！');
            showEmailModal.value = false; // 成功後關閉視窗
        } else {
            throw new Error(result.message || '後端發生未知錯誤');
        }

    } catch (error) {
        console.error('發送郵件時發生錯誤:', error);
        alert(`發送失敗: ${error.message}`);
    } finally {
        isSendingEmail.value = false;
    }
}

// --- 底層計算引擎 (無變動) ---

function runCalculationEngine(terms, priceValue, priceKeyword, conditionContext = null) {
    const results = {};
    if (!terms || terms.length === 0) return results;
    const pendingTerms = new Map(terms.map(t => [t['編號'], t]));
    let calculationMadeInLoop = true;
    let loops = 0;
    while (pendingTerms.size > 0 && calculationMadeInLoop && loops < terms.length + 5) {
        calculationMadeInLoop = false;
        loops++;
        pendingTerms.forEach((term, id) => {
            if (!term['計算方式']) return;
            try {
                let currentTermValue = 0;
                if (conditionContext && term[conditionContext.conditionCol]) {
                    currentTermValue = parseFloat(term[conditionContext.conditionCol]) || 0;
                }
                const context = { priceValue, priceKeyword, currentTermValue, results };
                const amount = parseFormula(term['計算方式'], context);
                results[id] = applyRounding(amount, term['進位方式'], term['進位值']);
                pendingTerms.delete(id);
                calculationMadeInLoop = true;
            } catch (e) { /* ... */ }
        });
    }
    if (pendingTerms.size > 0) {
        const unresolvedIds = Array.from(pendingTerms.keys()).join(', ');
        throw new Error(`項目 ${unresolvedIds} 可能存在循環依賴或公式錯誤。`);
    }
    return results;
}

function parseFormula(formula, context) {
    let expression = String(formula);
    expression = expression.replace(/(\d+(\.\d+)?)%/g, (match, number) => `(${number}/100)`);
    expression = expression.replace(new RegExp(context.priceKeyword, 'g'), context.priceValue);
    if (expression.includes('條件設定值')) {
        expression = expression.replace(/條件設定值/g, context.currentTermValue);
    }
    const references = expression.match(/[A-Z]/g) || [];
    for (const refId of references) {
        if (context.results[refId] === undefined) {
            throw new Error(`公式無法計算，因為參照的項目 '${refId}' 尚未被計算。`);
        }
        expression = expression.replace(new RegExp(refId, 'g'), context.results[refId]);
    }
    try {
        return new Function(`return ${expression}`)();
    } catch (e) {
        throw new Error(`公式錯誤 "${formula}" -> 最終表達式 "${expression}": ${e.message}`);
    }
}

// --- 格式化工具函式 (無變動) ---

function applyRounding(value, method, precisionSpec) {
    const precision = String(precisionSpec).includes('.') ? String(precisionSpec).split('.')[1].length : 0;
    if (!method) return Number(value.toFixed(precision));
    const multiplier = Math.pow(10, precision);
    let roundedValue;
    switch (method) {
        case '無條件進位': roundedValue = Math.ceil(value * multiplier) / multiplier; break;
        case '四捨五入': roundedValue = Math.round(value * multiplier) / multiplier; break;
        case '無條件捨去': roundedValue = Math.floor(value * multiplier) / multiplier; break;
        default: roundedValue = value;
    }
    return Number(roundedValue.toFixed(precision));
}

function formatNumber(value, frac = 0) {
    if (value === null || value === undefined || String(value).trim() === '') {
        return frac > 0 ? (0).toFixed(frac) : '0';
    }
    const num = Number(value);
    if (isNaN(num)) return 'N/A';
    return num.toLocaleString('en-US', {
        minimumFractionDigits: frac,
        maximumFractionDigits: frac
    });
}

function formatPercentage(value) {
    if (typeof value !== 'number' || isNaN(value)) {
        return 'N/A';
    }
    return `${(value * 100).toFixed(2)}%`;
}

/**
 * 按下「恢復預設」按鈕時呼叫
 * 直接重新執行初始化函式，即可將所有項目還原
 */
function resetAllPayments() {
    console.log('將所有付款項目恢復到初始設定...');
    initializePaymentItems();
}

/**
 * 根據檔案類型回傳對應的顏色與圖示
 * @param {string} type - 檔案類型 ('pdf', 'excel', etc.)
 * @returns {{color: string, icon: string}}
 */
function getChipStyle(type) {
    switch (type) {
        case 'pdf':
            return { color: 'red-darken-1', icon: 'mdi-file-pdf-box' };
        case 'excel':
            return { color: 'green-darken-1', icon: 'mdi-file-excel-box' };
        case 'word':
             return { color: 'blue-darken-1', icon: 'mdi-file-word-box' };
        default:
            return { color: 'grey-darken-1', icon: 'mdi-file-document-box' };
    }
}

</script>

<style scoped>
.header-sticky, .footer-sticky {
       position: sticky;
       background-color: white;
       z-index: 10;
}
.header-sticky { top: 0; }
.footer-sticky { bottom: 0; }
.card-header {
       background-color: #f5f5f5;
       border-bottom: 1px solid #e0e0e0;
}
.card-header-accent {
       background-color: #E3F2FD;
       border-bottom: 1px solid #90CAF9;
}
.v-card-title {
       font-weight: 600;
       color: #333;
}
.price-summary {
       padding: 16px;
}
.price-item {
       display: flex;
       justify-content: space-between;
       align-items: center;
       padding: 8px 0;
       font-size: 1rem;
}
.price-label {
       color: #555;
}
.price-value {
       font-weight: 600;
       color: #1E88E5;
}
.price-value-secondary {
       color: #546E7A;
       font-weight: 400;
}
.total {
       font-size: 1.2rem;
}
.total .price-label {
       font-weight: bold;
       color: #212121;
}
.total .total-value {
       color: #1E88E5;
       font-size: 1.3rem;
}
.difference {
       font-size: 1.1rem;
}
.difference .price-label {
       font-weight: 500;
}
.difference.positive .price-value {
       color: #2E7D32;
}
.difference.negative .price-value {
       color: #C62828;
}
.thick-divider {
       border-top-width: 2px !important;
       border-color: #90CAF9 !important;
       opacity: 1;
}
.total-area-card {
       display: flex;
       align-items: center;
       background-color: #F5F5F5;
       padding: 12px 16px;
       border-radius: 8px;
}
.area-summary-item {
       display: flex;
       align-items: center;
       flex: 1;
}
.total-area-title {
       font-size: 0.9rem;
       color: #555;
}
.total-area-value {
       font-size: 1.5rem;
       font-weight: 700;
       color: #1A237E;
       line-height: 1.2;
}
.total-area-subtitle {
       font-size: 0.8rem;
       color: #777;
}
.area-details {
       font-size: 0.9rem;
}
.area-group {
       border: 1px solid #ECEFF1;
       border-radius: 6px;
       padding: 8px;
       height: 100%;
}
.area-group-title {
       font-weight: 600;
       color: #37474F;
       margin-bottom: 8px;
}
.area-item-header {
       display: grid;
       grid-template-columns: 2fr 1fr 1fr;
       font-weight: 500;
       color: #78909C;
       padding: 2px 4px;
       border-bottom: 1px solid #CFD8DC;
       font-size: 0.8rem;
}
.area-item-header span:not(:first-child),
.area-item span:not(:first-child) {
       text-align: right;
}
.area-item {
       display: grid;
       grid-template-columns: 2fr 1fr 1fr;
       padding: 4px;
       border-bottom: 1px solid #f0f0f0;
}
.area-item:last-child {
       border-bottom: none;
}
.area-ping-value {
       font-weight: 600 !important;
       font-size: 1.1em;
       color: #1A237E;
}
.payment-details-container {
    width: 100%;
}
.payment-row {
    display: flex; 
    padding: 8px 4px; 
    border-bottom: 1px solid #eee; 
    align-items: center;
}
.payment-row:last-of-type {
    border-bottom: none;
}
.payment-row.header { 
    font-weight: bold; 
    color: #333;
}
.package-deal-row .payment-name, .package-deal-row .payment-amount {
    font-weight: 600;
    color: #D32F2F;
}
.package-deal-row.child-item .payment-name, .package-deal-row.child-item .payment-amount {
    font-weight: 400;
    color: #E57373;
}
.payment-row.total {
    font-weight: bold; 
    border-top: 2px solid #333; 
    border-bottom: none; 
    margin-top: 8px;
    padding-top: 12px;
}
.payment-name {
    flex: 1; 
    text-align: left; 
    display: flex; 
    flex-direction: column; 
    justify-content: center; 
    margin-right: 16px;
}
.payment-amount {
    flex: 0 0 120px; 
    text-align: right; 
    font-weight: 600; 
    color: #333;
}
.item-subtitle {
    color: #888; 
    font-size: 0.85em; 
    margin-top: 2px;
}
.expand-button {
    padding: 0 !important; 
    min-width: 0 !important; 
    height: auto !important;
    text-transform: none; 
    font-weight: normal; 
    letter-spacing: normal; 
    color: inherit; 
    justify-content: flex-start; 
    width: 100%;
    line-height: 1.2;
}
.child-item .payment-name {
    padding-left: 24px;
}
.child-item .payment-amount {
    font-weight: 400; 
    color: #666; 
    font-size: 0.95em;
}
.payment-amount.final-total {
    font-size: 1.5em; 
    font-weight: bold; 
    color: #1E88E5;
}

.payment-table {
    font-size: 0.9rem;
}
.payment-table .v-text-field {
    font-size: 0.9rem;
}
.payment-table .v-text-field input {
    text-align: right;
}
.package-item-row {
    background-color: #FFF8E1; /* 淡黃色背景以區分配套款 */
}
.summary-row td {
    padding-top: 8px !important;
}
.target-total {
    border-top: 2px solid #BDBDBD;
}
.difference-row {
    font-size: 1.1em;
}

.email-list-container {
    max-height: 250px;
    overflow-y: auto;
    border: 1px solid #e0e0e0;
    border-radius: 4px;
}
.mobile-footer {
    /* 增加最小高度，確保在手機上有足夠的操作空間 */
    min-height: 80px; 

    /* 您也可以用 padding 來調整，例如增加底部空間 */

}
</style>