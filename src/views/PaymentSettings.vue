<template>
    <v-dialog 
        :model-value="show" 
        @update:model-value="$emit('update:show', $event)" 
        :fullscreen="isMobile"
        :max-width="isMobile ? '100%' : '95vw'" 
        transition="dialog-bottom-transition"
    >
        <v-card class="d-flex flex-column" style="height: 100vh;" >
            <v-card-title class="pa-4 header-sticky" >
                <v-row align="center" no-gutters >
                    <v-col>
                        <span class="text-h5">付款表設定 - {{ formData.unitId }}</span>
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
                                :items="props.contractTypes" 
                                label="合約方式"
                                variant="outlined"
                                dense
                                @update:model-value="handleContractTypeChange"
                            ></v-select>
                        </v-col>
                        
                        <v-col cols="12" sm="6" v-if="showPreferredPaymentOption">
                            <v-checkbox
                                v-model="formData.usePreferredPayment"
                                label="優付"
                                density="compact"
                                color="primary"
                                hide-details
                                class="mt-2"
                            ></v-checkbox>
                        </v-col>

                        <v-col cols="12" sm="6">
                            <v-radio-group v-model="formData.isFirstTimeBuyer" inline label="是否首購" density="compact">
                              <v-radio label="是" :value="true"></v-radio>
                              <v-radio label="否" :value="false"></v-radio>
                            </v-radio-group>
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
                        <v-btn variant="plain" size="small" color="primary" @click="openParkingEditModal">
                            <v-icon left>mdi-lead-pencil</v-icon>
                        </v-btn>
                    </div>
<v-list lines="two" dense v-if="ownedParkingSpots && ownedParkingSpots.length > 0" class="pa-0">
                        <template v-for="(parking, index) in ownedParkingSpots" :key="parking.spotId">
                            <v-list-item class="pa-0">
                                <v-row align="center" no-gutters>
                                    <v-col cols="12" sm="5">
                                        <p class="font-weight-bold text-subtitle-1">{{ parking.spotId }}</p>
                                        <p class="text-caption text-grey-darken-1">{{ parking.size || '標準' }}</p>
                                    </v-col>
                                    <v-col cols="6" sm="3" class="text-sm-right">
                                        <p class="text-caption text-grey-darken-1 mb-n1">底價</p>
                                        <p>{{ formatNumber(parking.price_floor) }} 萬</p>
                                    </v-col>
                                    <v-col cols="6" sm="4" class="text-sm-right">
                                        <p class="text-caption text-blue-darken-2 mb-n1">成交價</p>
                                        <p class="font-weight-bold text-blue-darken-2">{{ formatNumber(parking.price_transaction) }} 萬</p>
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
                        <v-combobox
                                v-model="formData.銷售"
                                :items="personnelOptions"
                                label="銷售人員"
                                variant="outlined"
                                dense
                                item-title="name"
                                item-value="name"
                                :return-object="false"
                                multiple
                                chips
                                closable-chips
                                clearable
                            ></v-combobox>
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
                <v-card-text class="price-summary">
                    <div class="price-item">
                        <span class="price-label">房屋成交</span>
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
                        <span class="price-label">車位成交</span>
                        <span class="price-value">{{ formatNumber(calculated.totalParkingSalePrice) }} 萬</span>
                    </div>
                    <div class="price-item">
                        <span class="price-label">車位底價</span>
                        <span class="price-value price-value-secondary">{{ formatNumber(calculated.totalParkingBasePrice) }} 萬</span>
                    </div>
                    <v-divider class="my-2"></v-divider>
                    <div v-if="isPackageContract" class="price-item">
                        <span class="price-label">配套總價</span>
                        <span class="price-value">{{ formatNumber(formData.price_package_deal) }} 萬</span>
                    </div>
                    <div v-if="isPackageContract" class="price-item">
                        <span class="price-label">配套價</span>
                        <span class="price-value">{{ formatNumber(calculated.packagePrice) }} 萬</span>
                    </div>
                    <v-divider class="my-2 thick-divider"></v-divider>
                    <div class="price-item total">
                        <span class="price-label">成交</span>
                        <span class="price-value total-value">{{ formatNumber(calculated.grandTotalSalePrice) }} 萬</span>
                    </div>
                    <div class="price-item total">
                        <span class="price-label">底價</span>
                        <span class="price-value total-value text-red">{{ formatNumber(calculated.grandTotalBasePrice) }} 萬</span>
                    </div>
                    <v-divider class="my-2"></v-divider>
<div class="price-item difference" :class="{ 'positive': calculated.priceDifference >= 0, 'negative': calculated.priceDifference < 0 }">                        
                        <span class="price-label">溢差價</span>
                        <span class="price-value">{{ formatNumber(calculated.priceDifference) }} 萬</span>
                    </div>
                </v-card-text>
            </v-card>
        </v-col>

        <v-col cols="12" md="4">

         <v-card class="mb-5" elevation="2">
                <v-card-item class="card-header">
                    <v-card-title>
                        <v-icon start>mdi-bank-transfer</v-icon>
                        匯款帳號
                    </v-card-title>
                </v-card-item>
                <v-divider></v-divider>
                <v-card-text>
                    <div v-if="accountSections.length > 0">
                        <v-expansion-panels variant="accordion">
                            <v-expansion-panel
                                v-for="section in accountSections"
                                :key="section.title"
                            >
                                <v-expansion-panel-title>
                                    {{ section.title }}
                                </v-expansion-panel-title>
                                <v-expansion-panel-text class="pt-4">
                                    <v-text-field
                                        :model-value="section.bank"
                                        label="繳款銀行名稱"
                                        variant="outlined"
                                        density="compact"
                                        readonly
                                        class="mb-3"
                                    ></v-text-field>
                                    <v-text-field
                                        :model-value="section.name"
                                        label="戶名"
                                        variant="outlined"
                                        density="compact"
                                        readonly
                                        class="mb-3"
                                    ></v-text-field>
                                    <v-text-field
                                        :model-value="section.number"
                                        label="匯款帳號"
                                        variant="outlined"
                                        density="compact"
                                        readonly
                                    ></v-text-field>
                                </v-expansion-panel-text>
                            </v-expansion-panel>
                        </v-expansion-panels>
                    </div>
                    <div v-else class="text-center text-grey-darken-1 py-4">
                        -- 無匯款帳號資訊 --
                    </div>
                </v-card-text> 
            </v-card>

             <v-card class="mb-5" elevation="2">
                <v-expansion-panels v-model="areaPanel">
                    <v-expansion-panel>
                        <v-expansion-panel-title class="card-header">
                            <v-icon start>mdi-texture-box</v-icon>
                            面積資訊
                        </v-expansion-panel-title>
                        
                        <v-expansion-panel-text class="pt-4">
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
                            </v-expansion-panel-text>
                    </v-expansion-panel>
                </v-expansion-panels>
            </v-card>

</v-col>
    
    </v-row>

    <v-row>
<v-col cols="12" md="4">
           
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
        class="mr-2"
    >
        <v-icon start>mdi-folder-google-drive</v-icon>
         {{ unitData['戶別'] }}資料夾
    </v-btn>

    <!-- ✅ [改版] 製作付款表：改為開啟預覽對話框（PDF/EXCEL 下載），取代舊 Google Sheet 流程 -->
        <v-btn
                color="secondary"
                variant="flat"
                @click="showPaymentDocDialog = true"
                :disabled="!hasSalesperson"
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
            :initial-selected-parking="ownedParkingSpots"
            @confirm="updateSelectedParking"
            @request-open-slide="$emit('request-open-slide')"
            
            :project-id="props.projectId" />

            <!-- ✅ [新增] 付款表預覽/下載對話框（PDF、EXCEL） -->
            <PaymentSchedulePreviewDialog
                v-model:show="showPaymentDocDialog"
                :project-id="props.projectId"
                :project-name="props.projectName"
                :context="paymentDocContext"
            />
            </v-dialog>
</template>

<script setup>
import { ref, computed, watch, defineProps, defineEmits } from 'vue';
import { useDisplay } from 'vuetify';
import ParkingEditModal from '@/components/ParkingEditModal.vue';
// ✅ [改版] 付款表改為系統內預覽 + PDF/EXCEL 下載（取代 Google Sheet 流程）
import PaymentSchedulePreviewDialog from '@/components/PaymentSchedulePreviewDialog.vue';
import { normalizeSalespersons, formatSalespersons } from '@/utils/salespersonUtils';

import { useProjectStore } from '@/store/projectStore';

// --- Display & Props & Emits ---
const { mobile: isMobile } = useDisplay();
const props = defineProps({
    show: Boolean,
    unitData: { type: Object, default: () => null },
    projectName: { type: String, required: true },
    allData: { type: Object, required: true },
    contractTypes: { type: Array, default: () => [] },
    
    // ✅ [打勾] 新增此行
    projectId: { type: String, required: true } 
});
const emit = defineEmits(['update:show', 'request-open-slide', 'parking-updated']);
// ✅ [新增] 初始化 ProjectStore
const projectStore = useProjectStore();


// --- 主要表單狀態 ---
const formData = ref(null);
const parkingEditDialog = ref(false);
const paymentError = ref(null);
const areaPanel = ref(null);



// --- Options (下拉選單選項) ---
const personnelOptions = computed(() => {
    const list = props.allData['銷售人員'] || [];
    
    // 複製並排序，避免直接修改 props
    return [...list].sort((a, b) => {
        // 確保 order 為數字，若無 order 則給予極大值排在最後
        const orderA = (a.order !== undefined && a.order !== null) ? Number(a.order) : 999999;
        const orderB = (b.order !== undefined && b.order !== null) ? Number(b.order) : 999999;
        
        // 升序排列
        if (orderA !== orderB) {
            return orderA - orderB;
        }
        // 若 order 相同，則依姓名排序
        return (a.name || '').localeCompare(b.name || '', 'zh-Hant');
    });
});

const salesOptionsData = computed(() => props.allData['合約方式及是否首購'] || []); //


const salesPhone = computed(() => {
    // 銷售人員（複選）：逐一反查 phone，逗號分隔
    const names = normalizeSalespersons(formData.value?.銷售);
    if (names.length === 0) return '';
    return names
        .map(name => personnelOptions.value.find(p => p.name === name)?.phone || '')
        .filter(Boolean)
        .join(',');
});

const ownedParkingSpots = computed(() => {
    // ✅ [打勾] 改為優先讀取 props.unitData 中已處理好的「持有車位」
    // 這包含了父組件傳入的 tempParkingSelection 暫存資料
    if (props.unitData && Array.isArray(props.unitData['持有車位'])) {
        return props.unitData['持有車位'];
    }
    
    // 備援邏輯（若上述不存在才執行原本的過濾）
    const allParkings = props.allData['車位'] || [];
    const currentUnitId = props.unitData?.unitId || formData.value?.unitId;
    if (!allParkings.length || !currentUnitId) return [];
    
    return allParkings.filter(parking => parking.buyerUnitId === currentUnitId);
});

const accountSections = computed(() => {
    if (!formData.value) return [];

    const sections = [
        {
            title: '房屋款',
            bank: formData.value.houseBankName,
            name: formData.value.houseBankAccountName,
            number: formData.value.houseBankAccount
        },
        {
            title: '土地款',
            bank: formData.value.landBankName,
            name: formData.value.landBankAccountName,
            number: formData.value.landBankAccount
        },
        {
            title: '配套款',
            bank: formData.value.packageBankName,
            name: formData.value.packageBankAccountName,
            number: formData.value.packageBankAccount
        }
    ];

    // 根據您的需求：如果三個子項目都為空，則該母項目不顯示
    return sections.filter(section => 
        (section.bank && section.bank.trim() !== '') ||
        (section.name && section.name.trim() !== '') ||
        (section.number && section.number.trim() !== '')
    );
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
const totalParkingSalePrice = (ownedParkingSpots.value || []).reduce((sum, p) => sum + (Number(p.price_transaction) || 0), 0);
const totalParkingBasePrice = (ownedParkingSpots.value || []).reduce((sum, p) => sum + (Number(p.price_floor) || 0), 0);
    const grandTotalSalePrice = houseSalePrice + totalParkingSalePrice;

    let packagePrice = 0;
    if (isPackageContract.value) {
        const packageHouseTotalPrice = Number(data.price_package_deal) || 0;
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

// ✅ [新增] Computed: 是否顯示優付選項 (依據專案設定)
const showPreferredPaymentOption = computed(() => {
    return projectStore.currentProject?.showPreferredPaymentInQuote === true;
});

// --- 監聽器 (Watchers) ---
watch(() => props.show, (newVal) => {
    if (newVal) {
        projectStore.setCurrentProject(props.projectId);
        const defaultStructure = {
            '戶別': 'N/A', '房屋成交價': 0, '配套價': 0, price_package_deal: 0, 
            '合約方式': props.contractTypes.length > 0 ? props.contractTypes[0] : '',
            // ✓ 修改：'是否首購' 的 key 改為 'isFirstTimeBuyer' 並預設為 true
            'isFirstTimeBuyer': true,
            'usePreferredPayment': false,
           '銷售': '',            
            '房屋總底價': 0, '房屋總表價': 0, '房屋面積(坪)': 0,
            '房屋面積(平方公尺)': 0, '公設比': 0, '主建物面積(坪)': 0, '主建物面積(平方公尺)': 0,
            '附屬建物面積(坪)': 0, '附屬建物面積(平方公尺)': 0, '共用部分面積(坪)': 0,
            '共用部分面積(平方公尺)': 0, '露臺(坪)': 0, '土地持分面積(坪)': 0,
            '土地持分面積(平方公尺)': 0, '土地持分': 'N/A'
        };

       const initialData = { ...defaultStructure, ...(props.unitData || {}) };

        // ✓ START: 新增 - 欄位鍵名映射 (Key Mapping)
        // 正體中文註解：從 props.unitData (使用英文 key) 映射到 formData (使用中文 key)
        if (props.unitData) {

            // ✅ [新增] 映射優付欄位 (假設 unitData 中有此欄位)
            if (props.unitData.usePreferredPayment === true) {
                initialData.usePreferredPayment = true;
            }
            
            // ✓ 修正「房屋底價」
            if (props.unitData.price_floor_house_total !== undefined) {
                initialData['房屋總底價'] = props.unitData.price_floor_house_total;
            }
            
            // ✓ 修正「房屋成交價」
            if (props.unitData.price_transaction_house !== undefined && props.unitData.price_transaction_house !== null && props.unitData.price_transaction_house !== 0) {
                initialData['房屋成交價'] = props.unitData.price_transaction_house;
            } 
            else if (props.unitData.price_list_house_total !== undefined) {
                initialData['房屋成交價'] = props.unitData.price_list_house_total;
            }

            // ✓ 修正「房屋總表價」
            if (props.unitData.price_list_house_total !== undefined) {
                initialData['房屋總表價'] = props.unitData.price_list_house_total;
            }

            // ✓ 修正「銷售人員」(您回報的問題)
            // 正體中文註解：將 'salesperson' (英文 key) 的值，賦值給 '銷售' (中文 key)
            // 銷售人員（複選）：正規化為陣列（相容舊單人字串）
            initialData['銷售'] = normalizeSalespersons(props.unitData.salesperson);

            // 1. 合約方式 (英文 key 'contractType' 映射到 中文 key '合約方式')
        if (props.unitData.contractType) {
            initialData['合約方式'] = props.unitData.contractType;
        }

        // 2. 是否首購 (英文 key 'isFirstTimeBuyer' 映射到 英文 key 'isFirstTimeBuyer')
        //    (此處用於確保 null/undefined 預設為 true，僅在明確為 false 時才設為 false)
        if (props.unitData.isFirstTimeBuyer === false) {
            initialData.isFirstTimeBuyer = false;
        } else {
            // 處理 true, null, undefined, 或 ""，預設為 true
            initialData.isFirstTimeBuyer = true;
        }
        

        initialData['房屋面積(坪)'] = props.unitData.area_house_ping;
        initialData['房屋面積(平方公尺)'] = props.unitData.area_house_sqm;
        initialData['公設比'] = props.unitData.common_area_ratio;
        initialData['主建物面積(坪)'] = props.unitData.area_main_ping;
        initialData['主建物面積(平方公尺)'] = props.unitData.area_main_sqm;
        initialData['附屬建物面積(坪)'] = props.unitData.area_ancillary_ping;
        initialData['附屬建物面積(平方公尺)'] = props.unitData.area_ancillary_sqm;
        initialData['共用部分面積(坪)'] = props.unitData.area_common_ping;
        initialData['共用部分面積(平方公尺)'] = props.unitData.area_common_sqm;
        initialData['露臺(坪)'] = props.unitData.area_terrace_ping; // 假設 key 為 area_terrace_ping
        initialData['土地持分面積(坪)'] = props.unitData.land_share_ping;
        initialData['土地持分面積(平方公尺)'] = props.unitData.land_share_sqm;
        initialData['土地持分'] = props.unitData.land_share_ratio; // 假設 key 為 land_share_ratio
        // ✓ END: 新增 - 映射面積資訊
    }
        
        formData.value = JSON.parse(JSON.stringify(initialData));
}
}, { immediate: true });

watch(() => formData.value?.合約方式, (newVal) => {
    if (!formData.value) return;
    // ✅ [改版] 配套合約判定改用建案設定的 packageContractTypes（相容舊寫死的「毛胚合約」）
    if (!isPackageContractType(newVal)) {
        formData.value.price_package_deal = 0;
    } else {
        formData.value.price_package_deal = props.unitData?.price_package_deal || 0;
    }
});



// --- 其他方法 ---

function handleContractTypeChange(type) {
    const isPackage = type === '毛胚合約'; 
    console.log(`合約方式改為: ${type}, 套用配套: ${isPackage}`);
}

function openParkingEditModal() {
    parkingEditDialog.value = true;
}

function updateSelectedParking(newParkingList) {
    // if (formData.value) {
    //     formData.value.parkingSpots = newParkingList; // 舊邏輯 (刪除)
    // }
    
    // ✓ 新邏輯：參照 SalesInfoForm，向上傳遞事件
    emit('parking-updated', {
        unitId: formData.value.unitId,
        parkingList: newParkingList
    });
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


/* ==========================================================
 * ✅ [改版] 製作付款表：系統內預覽 + PDF/EXCEL 下載
 * ========================================================== */
const showPaymentDocDialog = ref(false);

/**
 * 配套合約判定：依建案設定 packageContractTypes（未設定時相容舊寫死的「毛胚合約」）
 */
function isPackageContractType(type) {
    if (!type) return false;
    const list = projectStore.getProjectById(props.projectId)?.packageContractTypes;
    if (Array.isArray(list)) return list.includes(type);
    return type === '毛胚合約';
}
const isPackageContract = computed(() => isPackageContractType(formData.value?.合約方式));

// 至少一位銷售人員才可製作
const hasSalesperson = computed(() => normalizeSalespersons(formData.value?.銷售).length > 0);

// 戶別顯示標籤（如 "A 棟 8 樓"），無棟/樓資訊時回退 unitId
const unitLabelText = computed(() => {
    const u = props.unitData || {};
    if (u.building && u.floor) {
        const floorNum = parseInt(u.floor, 10);
        return `${u.building} 棟 ${isNaN(floorNum) ? u.floor : floorNum} 樓`;
    }
    return u.unitId || formData.value?.unitId || '';
});

// 傳給付款表預覽對話框的渲染資料
const paymentDocContext = computed(() => {
    const data = formData.value || {};
    return {
        unitId: data.unitId || data['戶別'] || '',
        unitLabel: unitLabelText.value,
        contractType: data.合約方式,
        isFirstTimeBuyer: data.isFirstTimeBuyer !== false,
        usePreferredPayment: data.usePreferredPayment === true,
        propertyType: props.unitData?.propertyType || props.unitData?.layout || '住家',
        totalPrice: calculated.value.grandTotalSalePrice,
        // ✅ [新增] 配套模式：合約方式命中建案設定的配套合約清單時自動觸發
        isPackageContract: isPackageContract.value,
        packageDealPrice: Number(formData.value?.price_package_deal) || 0,   // 配套總價（第 1 頁基準）
        packagePrice: Number(calculated.value.packagePrice) || 0,           // 配套價（第 2 頁基準）
        parkingSpots: (ownedParkingSpots.value || []).map(p => ({
            spotId: p.spotId,
            price_transaction: p.price_transaction
        })),
        areas: {
            houseTotalPing: data['房屋面積(坪)'],
            houseTotalSqm: data['房屋面積(平方公尺)'],
            mainPing: data['主建物面積(坪)'],
            mainSqm: data['主建物面積(平方公尺)'],
            ancillaryPing: data['附屬建物面積(坪)'],
            ancillarySqm: data['附屬建物面積(平方公尺)'],
            commonPing: data['共用部分面積(坪)'],
            commonSqm: data['共用部分面積(平方公尺)'],
            landSharePing: data['土地持分面積(坪)'],
            landShareSqm: data['土地持分面積(平方公尺)'],
            landShareRatio: data['土地持分']
        },
        banks: accountSections.value.map(s => ({
            title: s.title,
            bankName: s.bank,
            accountName: s.name,
            account: s.number
        })),
        salesperson: formatSalespersons(data.銷售),
        salesPhone: salesPhone.value
    };
});

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