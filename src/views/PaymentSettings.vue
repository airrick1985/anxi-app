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
                                <div class="price-summary">
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

    <div class="price-item difference" :class="calculated.priceDifference >= 0 ? 'positive' : 'negative'">
        <span class="price-label">溢差價</span>
        <span class="price-value">{{ formatNumber(calculated.priceDifference) }} 萬</span>
    </div>
</div>
                            </v-card>
                            
                            <v-card elevation="2" class="mb-5">
                                <v-card-item class="card-header-accent">
                                    <v-card-title>
                                        <v-icon start>mdi-cash-clock</v-icon>
                                        付款明細
                                    </v-card-title>
                                </v-card-item>
                                <v-divider></v-divider>
                                <v-card-text>
                                    <div class="payment-details-container">
                                        <div v-if="paymentError" class="pa-4 text-center text-red bg-red-lighten-5">
                                            <p class="font-weight-bold">計算時發生錯誤</p>
                                            <p class="text-caption">{{ paymentError }}</p>
                                        </div>
                                        <div v-else>
                                            <div class="payment-row header">
                                                <div class="payment-name">項目</div>
                                                <div class="payment-amount">金額 (萬)</div>
                                            </div>
                                            <div
                                                v-for="(item, index) in paymentBreakdown"
                                                :key="item.id || index"
                                                class="payment-row"
                                                :class="{ 'child-item': item.isChild, 'package-deal-row': item.isPackageDeal }"
                                            >
                                                <div class="payment-name">
                                                    <div>
                                                        <v-btn
                                                            v-if="item.isExpandable"
                                                            variant="text"
                                                            density="compact"
                                                            class="expand-button"
                                                            @click="toggleExpansion(item.id)"
                                                            :ripple="false"
                                                        >
                                                            {{ item.name }}
                                                            <v-icon end>{{ item.isExpanded ? 'mdi-chevron-up' : 'mdi-chevron-down' }}</v-icon>
                                                        </v-btn>
                                                        <span v-else>{{ item.name }}</span>
                                                    </div>
                                                    <small v-if="item.displayValue" class="item-subtitle">
                                                        {{ item.displayValue }}
                                                    </small>
                                                </div>
                                                <div class="payment-amount">{{ item.formattedAmount }}</div>
                                            </div>
                                            <div class="payment-row total">
                                                <div class="payment-name">總計</div>
                                                <div class="payment-amount final-total">{{ formattedTotalAmount }}</div>
                                            </div>
                                        </div>
                                    </div>
                                </v-card-text>
                            </v-card>
                        </v-col>

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
                                            <div class="area-group-title"> <v-icon size="small" class="mr-1">mdi-home</v-icon>
                                                建物面積明細</div>
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
            
            <v-card-actions class="pa-4 footer-sticky">
                <v-spacer></v-spacer>
                <v-btn color="grey-darken-1" variant="text" @click="$emit('update:show', false)">取消</v-btn>
                <v-btn color="success" variant="flat" @click="save">儲存</v-btn>
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
</template>
<script setup>
import { ref, computed, watch, defineProps, defineEmits } from 'vue';
import { useDisplay } from 'vuetify';
import ParkingEditModal from '@/components/ParkingEditModal.vue';

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

// --- 付款明細相關狀態 ---
const expandedItems = ref(new Set());
const calculatedAmounts = ref({});
const calculatedPackageAmounts = ref({});
const paymentError = ref(null);

// --- Options ---
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

// --- 計算屬性 (Computed Properties) ---
const calculated = computed(() => {
    if (!formData.value) {
        return {
            houseSaleUnitPrice: 0, houseBaseUnitPrice: 0,
            totalParkingSalePrice: 0, totalParkingBasePrice: 0,
            grandTotalSalePrice: 0, grandTotalBasePrice: 0,
            priceDifference: 0,
            packagePrice: 0 // 新增配套價的預設回傳
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
    
    // ==================== 修改開始 ====================

    // 規則 1: '成交總價' = 房屋成交價 + 車位總成交價
    const grandTotalSalePrice = houseSalePrice + totalParkingSalePrice;

    // 規則 2: 計算 '配套價'
    let packagePrice = 0; // 非毛胚合約時，配套價為 0
    if (data.合約方式 === '毛胚合約') {
        const packageHouseTotalPrice = Number(data['配套房屋總價']) || 0;
        // 毛胚合約時，配套價 = 成交總價 - 配套房屋總價
        packagePrice = grandTotalSalePrice - packageHouseTotalPrice;
    }

    // ==================== 修改結束 ====================
    
    const grandTotalBasePrice = houseBasePrice + totalParkingBasePrice;
    const priceDifference = grandTotalSalePrice - grandTotalBasePrice;

    return {
        houseSaleUnitPrice, houseBaseUnitPrice,
        totalParkingSalePrice, totalParkingBasePrice,
        grandTotalSalePrice, // 回傳計算後的成交總價
        grandTotalBasePrice,
        priceDifference,
        packagePrice // 將計算好的配套價回傳
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
            '持有車位': [], '房屋總底價': 0, '房屋總表價': 0,
            '房屋面積(坪)': 0, '房屋面積(平方公尺)': 0, '公設比': 0,
            '主建物面積(坪)': 0, '主建物面積(平方公尺)': 0, '附屬建物面積(坪)': 0,
            '附屬建物面積(平方公尺)': 0, '共用部分面積(坪)': 0, '共用部分面積(平方公尺)': 0,
            '露臺(坪)': 0, '土地持分面積(坪)': 0, '土地持分面積(平方公尺)': 0, '土地持分': 'N/A'
        };
        const initialData = { ...defaultStructure, ...(props.unitData || {}) };
        if (props.unitData && !initialData.房屋成交價) {
            initialData.房屋成交價 = initialData.房屋總表價;
        }
        formData.value = JSON.parse(JSON.stringify(initialData));
    }
}, { immediate: true });

watch(() => formData.value.合約方式, (newVal) => {
    if (newVal !== '毛胚合約') {
        // 如果合約方式不是 '毛胚合約'，就將配套房屋總價設為 0
        formData.value['配套房屋總價'] = 0;
    } else {
        // 如果切換回合約方式為 '毛胚合約'，則從原始資料中還原數值
        // 確保 props.unitData 存在且有值，否則設為 0
        formData.value['配套房屋總價'] = props.unitData?.['配套房屋總價'] || 0;
    }
});

watch(
    () => [
        formData.value,
        props.allData['期款比例'], 
        props.allData['配套期款']
    ],
    () => {
        if (!formData.value) return;
        try {
            paymentError.value = null;
            const usePackageDeal = formData.value.合約方式 === '毛胚合約';
            const isFirstTimeBuyer = formData.value.是否首購 === '是';
            
            // 步驟 1: 根據合約方式，決定唯一的計算基準價
            let calculationBasePrice;
            if (usePackageDeal) {
                // 若為 '毛胚合約', 所有計算與判斷的基礎都是 '配套房屋總價'
                calculationBasePrice = Number(formData.value['配套房屋總價']) || 0;
            } else {
                // 其他合約方式, 計算與判斷的基礎為 '成交總價'
                calculationBasePrice = calculated.value.grandTotalSalePrice;
            }

            // ==================== 修改重點 ====================

            // 步驟 2: 使用上面決定的 "calculationBasePrice" 來判斷要套用哪一組期款規則
            const conditionCol = isFirstTimeBuyer
                ? (calculationBasePrice >= 4000 ? '>=4000首購' : '<4000首購')
                : (calculationBasePrice >= 4000 ? '>=4000非首購' : '<4000非首購');
            
            // =================================================

            const conditionContext = { conditionCol };
            const paymentTermsData = props.allData['期款比例'] || [];
            const packageTermsData = props.allData['配套期款'] || [];
            
            // 步驟 3: 將同一個基準價 (calculationBasePrice) 送入計算引擎
            calculatedAmounts.value = runCalculationEngine(
                paymentTermsData, 
                calculationBasePrice, // 使用動態基準價
                '總價', 
                conditionContext
            );

            if (usePackageDeal) {
                const packagePrice = calculated.value.packagePrice;
                calculatedPackageAmounts.value = runCalculationEngine(packageTermsData, packagePrice, '配套金額');
            }
        } catch (e) {
            paymentError.value = e.message;
            console.error(e);
        }
    },
    { immediate: true, deep: true }
);

// --- 付款明細計算屬性 ---
const paymentBreakdown = computed(() => {
    if (paymentError.value) return [];
    if (!formData.value) return [];

    const breakdown = [];
    const usePackageDeal = formData.value.合約方式 === '毛胚合約';
    const isFirstTimeBuyer = formData.value.是否首購 === '是';
    
    // ==================== 修改開始 ====================

    // 步驟 1: 在此處也建立動態基準價，與 watch 中的邏輯保持一致
    let calculationBasePrice;
    if (usePackageDeal) {
        // 若為 '毛胚合約', 顯示的規則判斷基礎為 '配套房屋總價'
        calculationBasePrice = Number(formData.value['配套房屋總價']) || 0;
    } else {
        // 其他合約方式, 顯示的規則判斷基礎為 '成交總價'
        calculationBasePrice = calculated.value.grandTotalSalePrice;
    }
    
    // 步驟 2: 使用新的動態基準價來決定要顯示哪一欄的百分比/金額
    const conditionCol = isFirstTimeBuyer
        ? (calculationBasePrice >= 4000 ? '>=4000首購' : '<4000首購')
        : (calculationBasePrice >= 4000 ? '>=4000非首購' : '<4000非首購');
    
    // ==================== 修改結束 ====================

    const paymentTermsData = props.allData['期款比例'] || [];
    const packageTermsData = props.allData['配套期款'] || [];
    
    const regularParentIds = new Set(paymentTermsData.map(t => t['子項目']).filter(Boolean));
    const regularChildrenMap = new Map();
    paymentTermsData.forEach(term => {
        if (term['子項目']) {
            if (!regularChildrenMap.has(term['子項目'])) regularChildrenMap.set(term['子項目'], []);
            regularChildrenMap.get(term['子項目']).push(term);
        }
    });

    paymentTermsData.forEach(term => {
        if (term['子項目']) return;
        const id = term['編號'];
        const amount = calculatedAmounts.value[id] ?? 0;
        const isParent = regularParentIds.has(id);
        const isExpanded = expandedItems.value.has(id);
        
        // 這裡的 term[conditionCol] 會因為上面的修改而取到正確的值
        const termValue = parseFloat(term[conditionCol]) || 0;
        let displayValue = '';
        if (term['類型'] === '百分比') {
            displayValue = `${(termValue * 100).toFixed(2).replace(/\.00$/, '')}%`;
        } else if (term['類型'] === '固定金額') {
            displayValue = `${termValue.toLocaleString('en-US')} 萬`;
        }
        
        breakdown.push({ id, name: term['項目名稱'], amount, formattedAmount: formatAmount(amount, term['進位值']), displayValue, isExpandable: isParent, isExpanded });
        
        if (isParent && isExpanded) {
            const children = regularChildrenMap.get(id) || [];
            children.forEach(childTerm => {
                const childAmount = calculatedAmounts.value[childTerm['編號']] ?? 0;
                breakdown.push({ id: childTerm['編號'], name: childTerm['項目名稱'], amount: childAmount, formattedAmount: formatAmount(childAmount, childTerm['進位值']), displayValue: '', isChild: true });
            });
        }
    });
    
    if (usePackageDeal) {
        const packagePrice = calculated.value.packagePrice;
        const isPackageExpanded = expandedItems.value.has('__PACKAGE_DEAL__');
        breakdown.push({
            id: '__PACKAGE_DEAL__',
            name: '配套',
            amount: packagePrice,
            formattedAmount: formatAmount(packagePrice, '0'),
            isExpandable: packageTermsData.length > 0,
            isExpanded: isPackageExpanded,
            isPackageDeal: true,
            displayValue: ''
        });
        if (isPackageExpanded && packageTermsData.length > 0) {
            packageTermsData.forEach(term => {
                const amount = calculatedPackageAmounts.value[term['編號']] ?? 0;
                breakdown.push({ id: term['編號'], name: term['項目名稱'], amount, formattedAmount: formatAmount(amount, term['進位值']), displayValue: '', isChild: true, isPackageDeal: true });
            });
        }
    }
    return breakdown;
});

const totalAmount = computed(() => {
        if (paymentError.value) return 0;
        return paymentBreakdown.value
                .filter(item => !item.isChild)
                .reduce((sum, item) => sum + item.amount, 0);
});

const formattedTotalAmount = computed(() => {
        const roundedTotal = applyRounding(totalAmount.value, '四捨五入', "0");
        return formatAmount(roundedTotal, "0");
});

// --- Methods ---
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

function toggleExpansion(itemId) {
    if (expandedItems.value.has(itemId)) {
       expandedItems.value.delete(itemId);
    } else {
       expandedItems.value.add(itemId);
    }
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
            } catch (e) {
                // console.warn(`暫時跳過 ${id}:`, e.message);
            }
        });
    }
    if (pendingTerms.size > 0) {
        const unresolvedIds = Array.from(pendingTerms.keys()).join(', ');
        throw new Error(`項目 ${unresolvedIds} 可能存在循環依賴或公式錯誤。`);
    }
    return results;
}

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

function formatAmount(value, precisionSpec) {
        if (typeof value !== 'number') return value;
        const precision = String(precisionSpec).includes('.') ? String(precisionSpec).split('.')[1].length : 0;
        return value.toLocaleString('en-US', {
                minimumFractionDigits: precision,
                maximumFractionDigits: precision,
        });
}

function save() {
       alert('儲存功能待實現！');
       console.log('準備儲存的資料:', formData.value);
       console.log('最終計算結果:', calculated.value);
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
</style>