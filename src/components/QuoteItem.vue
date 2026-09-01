<template>
  <div>
    <div v-if="isMobile" class="quote-item-mobile">
      <div class="d-flex justify-space-between align-center mb-2">
       <span
         class="text-h6 font-weight-bold text-primary"
         :class="{ 'unit-id-clickable': hasHouseholdImages }"
         :title="hasHouseholdImages ? '點擊檢視戶別圖片' : ''"
         @click="openImageLightbox"
       >
         {{ item.unitId }}
         <v-icon v-if="hasHouseholdImages" size="small" class="ml-1">mdi-image-multiple-outline</v-icon>
       </span>
        <v-btn
          color="red"
          variant="flat"
     size="small"
     @click="emit('remove')"
    >
     移除本戶
    </v-btn>
      </div>

      <div class="text-caption text-grey-darken-1 mb-2">
        類型: {{ item.unitDetails.propertyType || item.unitDetails.layout || '-' }}
      </div>

   <v-list lines="one" class="bg-transparent">
    <v-list-item class="pl-0"><v-list-item-title>房屋總價</v-list-item-title><template v-slot:append><div class="d-flex flex-column align-end"><div class="d-flex align-center gap-2"><strong class="highlight-dark">{{ displayHousePrice }} 萬</strong><v-chip v-if="hasNegotiation" size="x-small" :color="negotiationDelta < 0 ? 'success' : 'error'" class="ml-1">{{ negotiationDelta > 0 ? '+' : '' }}{{ negotiationDelta }} 萬</v-chip><v-btn icon="mdi-percent" size="x-small" variant="text" color="primary" :disabled="isNegotiationDisabled" @click="openNegotiationDialog" :title="negotiationDisabledHint || '議價調整'"></v-btn><v-btn v-if="hasNegotiation" icon="mdi-restore" size="x-small" variant="text" color="warning" @click="resetNegotiation" title="恢復原始價格"></v-btn></div><div v-if="showTerraceSplit" class="terrace-split">房屋 {{ formatNumber(item.unitDetails.price_list_house_only) }} <span class="terrace-split-plus">＋</span> 露臺 {{ formatNumber(item.unitDetails.price_list_terrace) }} <span class="terrace-split-area">({{ formatNumber(item.unitDetails.area_terrace_ping, 2) }} 坪)</span></div></div></template></v-list-item>
    <v-list-item class="pl-0"><v-list-item-title>房屋單價</v-list-item-title><template v-slot:append><div class="d-flex flex-column align-end"><strong>{{ displayUnitPrice }} 萬/坪</strong><div v-if="showTerraceUnitSplit" class="terrace-split"><span class="terrace-split-tag">露臺</span> {{ displayTerraceUnitPrice }} 萬/坪</div></div></template></v-list-item>
    <v-divider class="my-2"></v-divider>
    
    <v-list-item class="pl-0">
     <v-list-item-title>房屋總面積</v-list-item-title>
     <template v-slot:append>
      <v-menu open-on-click location="top">
       <template v-slot:activator="{ props: menuProps }">
        <v-btn v-bind="menuProps" size="medium" variant="tonal" density="comfortable">
         {{ formatNumber(item.unitDetails.area_house_ping) }} 坪
         <v-icon end>mdi-information-outline</v-icon>
        </v-btn>
       </template>
       <v-card min-width="280">
        <v-card-title class="text-subtitle-1 font-weight-bold pa-3 text-center bg-grey-lighten-5">
         詳細面積資訊
        </v-card-title>
        <v-divider></v-divider>
        <v-table density="compact">
         <tbody>
          <tr class="font-weight-bold bg-blue-grey-lighten-5">
           <td>房屋總面積</td>
           <td class="text-right">{{ formatNumber(item.unitDetails.area_house_ping) }} 坪{{ formatSqmSuffix(item.unitDetails.area_house_sqm) }}</td>
          </tr>
          <tr v-for="(detail, i) in areaDetails" :key="i">
           <td class="text-grey-darken-1">{{ detail.label }}</td>
           <td class="text-right">
            {{ detail.isPercentage ? formatPercentage(detail.value) : `${formatNumber(detail.value)} ${detail.unit}${formatSqmSuffix(detail.sqm)}` }}
           </td>
          </tr>
         </tbody>
        </v-table>
       </v-card>
      </v-menu>
     </template>
    </v-list-item>

    <v-divider class="my-2"></v-divider>
    <v-list-item class="pl-0"><v-list-item-title>車位</v-list-item-title><template v-slot:append>
      <v-btn size="small" variant="tonal" @click="openParkingModal">{{ parkingDisplayText }}</v-btn>
      <v-btn v-if="canApplyParking" icon="mdi-content-copy" size="x-small" variant="text" color="primary"
        class="ml-1" title="套用車位至其他戶別" @click="openApplyParkingDialog"></v-btn>
    </template></v-list-item>
    <v-list-item class="pl-0"><v-list-item-title>車位價格</v-list-item-title><template v-slot:append><strong class="highlight-dark">{{ formattedParkingPrice }}</strong></template></v-list-item>
    <v-divider class="my-2"></v-divider>
    
    <!-- ✅ [優化] 配套/優付/首購改為自動換行的選項列，窄螢幕不再擠壓溢位 -->
    <div class="mobile-options">
     <v-switch
        v-if="showPackageDeal"
        v-model="usePackageDealModel"
        label="配套"
        color="primary"
        hide-details
        inset
        density="compact"
        :disabled="!isPackageDealAllowed"
        :title="packageDisabledHint"
     ></v-switch>

     <v-checkbox
        v-if="showPreferredPaymentOption"
        v-model="usePreferredPaymentModel"
        label="優付"
        color="black"
        hide-details
        density="compact"
        :disabled="!isPreferredPaymentEligible"
     ></v-checkbox>

     <div class="d-flex align-center ga-2">
       <span class="text-body-2 text-grey-darken-1">首購</span>
       <v-btn-toggle
         v-model="isFirstTimeBuyerModel"
         mandatory
         density="compact"
         color="primary"
         variant="outlined"
         divided
       >
         <v-btn value="是" size="small">首購</v-btn>
         <v-btn value="否" size="small">非首購</v-btn>
       </v-btn-toggle>
     </div>
    </div>
    
    <v-divider class="my-2"></v-divider>
    <v-list-item v-if="showPackageDeal" class="pl-0"><v-list-item-title>配套價</v-list-item-title><template v-slot:append><strong class="final-price">{{ packagePrice.toLocaleString() }} 萬</strong></template></v-list-item>
    <v-list-item class="pl-0"><v-list-item-title class="font-weight-bold">總價</v-list-item-title><template v-slot:append><strong class="final-price">{{ finalTotalPrice.toLocaleString() }} 萬</strong></template></v-list-item>
   </v-list>
    </div>

    <div v-else class="quote-item-row">
      <div
        class="item-cell flex-1 text-h6 font-weight-bold text-primary"
        :class="{ 'unit-id-clickable': hasHouseholdImages }"
        :title="hasHouseholdImages ? '點擊檢視戶別圖片' : ''"
        @click="openImageLightbox"
      >
        {{ item.unitId }}
        <v-icon v-if="hasHouseholdImages" size="small" class="ml-1">mdi-image-multiple-outline</v-icon>
      </div>
   
   <div class="item-cell flex-1 text-body-2 text-grey-darken-2">
        {{ item.unitDetails.propertyType || item.unitDetails.layout || '-' }}
      </div>
   
   
   <div class="item-cell flex-1">
    <v-menu open-on-click location="top">
     <template v-slot:activator="{ props: menuProps }">
      <v-btn v-bind="menuProps" variant="tonal" density="compact">
       {{ formatNumber(item.unitDetails.area_house_ping) }} 坪
      </v-btn>
     </template>
     <v-card min-width="300">
      <v-card-title class="text-subtitle-1 font-weight-bold pa-3 text-center bg-grey-lighten-5">
       詳細面積資訊
      </v-card-title>
      <v-divider></v-divider>
      <v-table density="compact">
       <tbody>
        <tr class="font-weight-bold bg-blue-grey-lighten-5">
         <td>房屋總面積</td>
         <td class="text-right">{{ formatNumber(item.unitDetails.area_house_ping) }} 坪{{ formatSqmSuffix(item.unitDetails.area_house_sqm) }}</td>
        </tr>
        <tr v-for="(detail, i) in areaDetails" :key="i">
         <td class="text-grey-darken-1">{{ detail.label }}</td>
         <td class="text-right">
          {{ detail.isPercentage ? formatPercentage(detail.value) : `${formatNumber(detail.value)} ${detail.unit}${formatSqmSuffix(detail.sqm)}` }}
         </td>
        </tr>
       </tbody>
      </v-table>
     </v-card>
    </v-menu>
   </div>

   <div class="item-cell flex-1 highlight-dark">
    <div class="d-flex flex-column align-center" style="width: 100%;">
      <div class="d-flex align-center justify-center gap-2">
        <span>{{ displayHousePrice }} 萬</span>
        <v-chip v-if="hasNegotiation" size="x-small" :color="negotiationDelta < 0 ? 'success' : 'error'">{{ negotiationDelta > 0 ? '+' : '' }}{{ negotiationDelta }} 萬</v-chip>
        <v-btn icon="mdi-percent" size="x-small" variant="text" color="primary" :disabled="isNegotiationDisabled" @click="openNegotiationDialog" :title="negotiationDisabledHint || '議價調整'"></v-btn>
        <v-btn v-if="hasNegotiation" icon="mdi-restore" size="x-small" variant="text" color="warning" @click="resetNegotiation" title="恢復原始價格"></v-btn>
      </div>
      <!-- ✅ [新增] 露臺戶表價拆分：房屋(不含露臺) ＋ 露臺 -->
      <div v-if="showTerraceSplit" class="terrace-split">
        房屋 {{ formatNumber(item.unitDetails.price_list_house_only) }}
        <span class="terrace-split-plus">＋</span>
        露臺 {{ formatNumber(item.unitDetails.price_list_terrace) }}
        <span class="terrace-split-area">({{ formatNumber(item.unitDetails.area_terrace_ping, 2) }} 坪)</span>
      </div>
    </div>
   </div>
   <div class="item-cell flex-1">
    <div class="d-flex flex-column align-center" style="width: 100%;">
      <span>{{ displayUnitPrice }} 萬/坪</span>
      <!-- ✅ [新增] 露臺戶：房屋/露臺單價分開呈現 -->
      <div v-if="showTerraceUnitSplit" class="terrace-split">
        <span class="terrace-split-tag">露臺</span> {{ displayTerraceUnitPrice }} 萬/坪
      </div>
    </div>
   </div>
   <div class="item-cell flex-2">
    <v-btn variant="tonal" @click="openParkingModal">{{ parkingDisplayText }}</v-btn>
    <v-btn v-if="canApplyParking" icon="mdi-content-copy" size="x-small" variant="text" color="primary"
      class="ml-1" title="套用車位至其他戶別" @click="openApplyParkingDialog"></v-btn>
   </div>
   <div class="item-cell flex-1 highlight-dark"><span>{{ formattedParkingPrice }}</span></div>
   
   <div class="item-cell flex-1">
    <v-btn-toggle
      v-model="isFirstTimeBuyerModel"
      mandatory
      density="comfortable"
      color="primary"
      variant="outlined"
      divided
    >
      <v-btn value="是" size="small">首購</v-btn>
      <v-btn value="否" size="small">非首購</v-btn>
    </v-btn-toggle>
   </div>

   <div class="item-cell flex-1" v-if="showPreferredPaymentOption">
      <v-checkbox 
        v-model="usePreferredPaymentModel" 
        label="優付"
        color="black"
        
        hide-details
        :disabled="!isPreferredPaymentEligible"
      ></v-checkbox>
   </div>
   <div class="item-cell flex-1 final-price">{{ finalTotalPrice.toLocaleString() }} 萬</div>
   
   <template v-if="showPackageDeal">
    
    <div class="item-cell flex-1">
      <v-checkbox
        v-model="usePackageDealModel"
        hide-details
        :disabled="!isPackageDealAllowed"
        :title="packageDisabledHint"
      ></v-checkbox>
    </div>
    
    <div class="item-cell flex-1 final-price">{{ packagePrice.toLocaleString() }} 萬</div>
   </template>

   <div class="item-cell flex-shrink-0">
    <v-btn color="red" variant="flat" size="small" @click="emit('remove')">移除本戶</v-btn>
   </div>
    </div>

<!-- ✅ [優化] 付款方式展開列：整列可點擊、狀態一目了然；選擇方案與已套用方案 chips 集中於此，不再塞在表格欄位內 -->
<div
  class="payment-toggle-bar"
  :class="{ 'is-open': isPaymentDetailsVisible, 'is-mobile': isMobile }"
  role="button"
  tabindex="0"
  :aria-expanded="isPaymentDetailsVisible"
  @click="togglePaymentDetails"
  @keydown.enter.prevent="togglePaymentDetails"
  @keydown.space.prevent="togglePaymentDetails"
>
  <div class="payment-toggle-main">
    <span class="payment-toggle-chevron" :class="{ 'is-open': isPaymentDetailsVisible }">
      <v-icon size="22">mdi-chevron-down</v-icon>
    </span>
    <v-icon size="18" class="payment-toggle-icon">mdi-cash-multiple</v-icon>
    <span class="payment-toggle-label">付款方式</span>
    <span class="payment-toggle-state">{{ isPaymentDetailsVisible ? '收合明細' : '展開明細' }}</span>
    <v-chip
      v-if="hasNewTemplates"
      size="x-small"
      :color="isManualTemplateActive ? 'orange-darken-2' : 'green-darken-1'"
      variant="flat"
      class="payment-toggle-mode"
    >{{ isManualTemplateActive ? '手動指定' : '自動判斷' }}</v-chip>
    <span v-if="paymentSummaryText" class="payment-toggle-summary" :title="paymentSummaryText">{{ paymentSummaryText }}</span>
  </div>
  <div class="payment-toggle-side" @click.stop @keydown.stop>
    <div v-if="appliedPlansList.length > 0" class="d-flex flex-wrap ga-1">
      <v-chip
        v-for="ap in appliedPlansList"
        :key="ap.planId"
        size="x-small"
        color="deep-purple-darken-1"
        :variant="isPlanModified(ap) ? 'outlined' : 'flat'"
        :class="{ 'plan-chip-modified': isPlanModified(ap) }"
        closable
        @click:close="removeAppliedPlan(ap)"
      >{{ ap.planName }}{{ isPlanModified(ap) ? '（已修改）' : '' }}</v-chip>
    </div>
    <!-- ✅ [優化] 選擇方案：加大尺寸、置於展開列最右側醒目位置；手機版整行滿版 -->
    <v-btn
      :size="isMobile ? 'large' : 'default'"
      :block="isMobile"
      class="plan-select-btn plan-select-btn--hero"
      prepend-icon="mdi-star-box-multiple"
      elevation="3"
      @click="isPlanPickerVisible = true"
    >選擇方案</v-btn>
  </div>
</div>

<v-expand-transition>
  <div v-show="isPaymentDetailsVisible">

    <div v-if="isLoading" class="text-center pa-4">
      <v-progress-circular indeterminate color="primary"></v-progress-circular>
      <div class="mt-2 text-caption">付款方式計算中...</div>
    </div>

    <!-- 期款顯示邏輯（✅ [整合] 設定選單併入各期款卡片，桌機並排、手機直疊） -->
    <div v-else class="pa-2 bg-grey-lighten-5">

      <div v-if="hasNewTemplates" class="d-flex ga-4 mb-2" :class="{ 'flex-column': isMobile }">
        <!-- 總價期款卡：標題 → 範本選單 → 明細 -->
        <div class="payment-col" :class="{ 'payment-col-full': isMobile }">
          <v-card flat border>
            <v-card-title class="bg-blue-lighten-5 text-blue-darken-2 py-2 text-subtitle-1 d-flex align-center">
              <v-icon start>mdi-calculator-variant</v-icon>
              總價期款
              <v-chip
                size="x-small"
                :color="isManualTemplateActive ? 'orange-darken-2' : 'green-darken-1'"
                variant="flat"
                class="ml-2"
              >
                {{ isManualTemplateActive ? '手動指定' : '自動判斷' }}
              </v-chip>
              <v-spacer></v-spacer>
              <v-btn
                v-if="isManualTemplateActive"
                icon="mdi-restore"
                size="x-small"
                variant="text"
                color="grey-darken-1"
                title="還原自動"
                @click="resetManualTemplate"
              ></v-btn>
            </v-card-title>

            <div class="pa-2 d-flex flex-wrap ga-2 align-center picker-row picker-row-general">
              <v-select
                v-model="manualCategoryModel"
                :items="manualCategoryOptions"
                label="期款類別"
                placeholder="自動（依條件判斷）"
                density="compact"
                variant="outlined"
                hide-details
                :clearable="isManualTemplateActive"
                class="picker-category"
              ></v-select>
              <v-select
                v-model="manualTemplateIdModel"
                :items="manualTemplateOptions"
                item-title="templateName"
                item-value="id"
                label="期款方式"
                :disabled="!manualCategoryModel"
                :placeholder="manualCategoryModel ? '請選擇範本' : '請先選期款類別'"
                density="compact"
                variant="outlined"
                hide-details
                class="picker-template"
              >
                <template v-slot:item="{ props: itemProps, item }">
                  <v-list-item v-bind="itemProps" :subtitle="item.raw.subtitle"></v-list-item>
                </template>
              </v-select>
            </div>
            <v-divider></v-divider>

            <v-card-text class="pa-2">
              <div v-if="generalPaymentCalculation.hasData" class="payment-items-grid">
                <div 
                  v-for="item in generalPaymentCalculation.items"
                  :key="item.id"
                  class="payment-item d-flex align-center py-1"
                  :class="{ 'payment-parent': !item.parentId, 'payment-child': item.parentId }"
                >
                  <span class="payment-name" :class="{ 'font-weight-bold': !item.parentId }">
                    {{ item.parentId ? '　　' : '' }}{{ item.name }}
                    <v-chip
                      v-if="formatConditionalValue(item)"
                      size="x-small"
                      variant="outlined"
                      color="primary"
                      class="ml-2 payment-hint"
                    >
                      {{ formatConditionalValue(item) }}
                    </v-chip>
                  </span>
                  <span class="payment-leader" aria-hidden="true"></span>
                  <span class="payment-amount font-weight-medium">
                    <span class="payment-amount-num">{{ (item.calculatedValue || 0).toLocaleString() }}</span>
                    <span class="payment-amount-unit">萬</span>
                  </span>
                </div>
                <div class="payment-item payment-total">
                  <span class="payment-name">總價</span>
                  <span class="payment-leader" aria-hidden="true"></span>
                  <span class="payment-amount">
                    <span class="payment-amount-num">{{ (finalTotalPrice || 0).toLocaleString() }}</span>
                    <span class="payment-amount-unit">萬</span>
                  </span>
                </div>
              </div>
              <div v-else class="text-center pa-3 text-red">
                <v-icon size="20" class="mb-1">mdi-alert-circle-outline</v-icon>
                <div class="text-body-2">缺少適用的期款範本，請調整上方選單或至後台確認。</div>
                <div class="text-caption mt-1">
                  條件：總價 {{ finalTotalPrice.toLocaleString() }}萬、
                  {{ isFirstTimeBuyerModel === '是' ? '首購' : '非首購' }}
                </div>
              </div>
            </v-card-text>
          </v-card>
        </div>

        <!-- 配套期款卡：標題 → 範本選單 → 明細（僅於勾選配套時顯示） -->
        <div v-if="usePackageDealModel" class="payment-col" :class="{ 'payment-col-full': isMobile }">
          <v-card flat border>
            <v-card-title class="bg-green-lighten-5 text-green-darken-2 py-2 text-subtitle-1 d-flex align-center">
              <v-icon start>mdi-package-variant</v-icon>
              配套期款
              <v-chip
                size="x-small"
                :color="isManualPackageTemplateActive ? 'orange-darken-2' : 'green-darken-1'"
                variant="flat"
                class="ml-2"
              >
                {{ isManualPackageTemplateActive ? '手動指定' : '自動判斷' }}
              </v-chip>
              <v-spacer></v-spacer>
              <v-btn
                v-if="isManualPackageTemplateActive"
                icon="mdi-restore"
                size="x-small"
                variant="text"
                color="grey-darken-1"
                title="還原自動"
                @click="resetManualPackageTemplate"
              ></v-btn>
            </v-card-title>

            <div class="pa-2 d-flex flex-wrap ga-2 align-center picker-row picker-row-package">
              <v-select
                v-model="manualPackageCategoryModel"
                :items="packageCategoryOptions"
                label="期款類別"
                placeholder="自動（依條件判斷）"
                density="compact"
                variant="outlined"
                hide-details
                :clearable="isManualPackageTemplateActive"
                class="picker-category"
              ></v-select>
              <v-select
                v-model="manualPackageTemplateIdModel"
                :items="manualPackageTemplateOptions"
                item-title="templateName"
                item-value="id"
                label="期款方式"
                :disabled="!manualPackageCategoryModel"
                :placeholder="manualPackageCategoryModel ? '請選擇範本' : '請先選期款類別'"
                density="compact"
                variant="outlined"
                hide-details
                class="picker-template"
              >
                <template v-slot:item="{ props: itemProps, item }">
                  <v-list-item v-bind="itemProps" :subtitle="item.raw.subtitle"></v-list-item>
                </template>
              </v-select>
            </div>
            <v-divider></v-divider>

            <v-card-text class="pa-2">
              <div v-if="packagePaymentCalculation.hasData" class="payment-items-grid">
                <div 
                  v-for="item in packagePaymentCalculation.items"
                  :key="item.id"
                  class="payment-item d-flex align-center py-1"
                  :class="{ 'payment-parent': !item.parentId, 'payment-child': item.parentId }"
                >
                  <span class="payment-name" :class="{ 'font-weight-bold': !item.parentId }">
                    {{ item.parentId ? '　　' : '' }}{{ item.name }}
                    <v-chip
                      v-if="formatConditionalValue(item)"
                      size="x-small"
                      variant="outlined"
                      color="primary"
                      class="ml-2 payment-hint"
                    >
                      {{ formatConditionalValue(item) }}
                    </v-chip>
                  </span>
                  <span class="payment-leader" aria-hidden="true"></span>
                  <span class="payment-amount font-weight-medium">
                    <span class="payment-amount-num">{{ (item.calculatedValue || 0).toLocaleString() }}</span>
                    <span class="payment-amount-unit">萬</span>
                  </span>
                </div>
                <div class="payment-item payment-total">
                  <span class="payment-name">總價</span>
                  <span class="payment-leader" aria-hidden="true"></span>
                  <span class="payment-amount">
                    <span class="payment-amount-num">{{ (packagePrice || 0).toLocaleString() }}</span>
                    <span class="payment-amount-unit">萬</span>
                  </span>
                </div>
              </div>
              <div v-else class="text-center pa-3 text-medium-emphasis">
                <v-icon size="20" class="mb-1">mdi-information-outline</v-icon>
                <div class="text-body-2">
                  {{ packagePrice > 0 ? '無適用的配套期款範本，請調整上方選單或至後台確認。' : '尚未設定配套金額' }}
                </div>
              </div>
            </v-card-text>
          </v-card>
        </div>

      </div>

      <!-- 公司借貸攤還表（實際採用的期款範本有附掛借貸範本時顯示） -->
      <v-card v-if="effectiveLoanParams" flat border class="mb-2">
        <v-card-title class="bg-orange-lighten-5 text-brown-darken-2 py-2 text-subtitle-1 d-flex align-center flex-wrap">
          <v-icon start>mdi-bank-outline</v-icon>
          公司借貸
          <span class="text-body-2 ml-2">{{ effectiveLoanParams.loanName }}</span>
          <v-chip v-if="companyLoanSchedule" size="x-small" color="brown-darken-1" variant="flat" class="ml-2">
            總價 {{ effectiveLoanParams.ratioPercent }}% ＝ {{ companyLoanSchedule.loanAmount.toLocaleString() }} 元
          </v-chip>
          <v-chip v-if="isLoanOverridden" size="x-small" color="orange-darken-2" variant="flat" class="ml-2">
            已臨時調整
          </v-chip>
          <v-spacer></v-spacer>
          <v-btn
            v-if="isLoanOverridden"
            icon="mdi-restore"
            size="x-small"
            variant="text"
            color="grey-darken-1"
            title="還原範本預設"
            @click="resetLoanOverride"
          ></v-btn>
        </v-card-title>

        <!-- 臨時調整參數列：僅影響本次報價，不回存範本 -->
        <div class="pa-2 d-flex flex-wrap ga-2 align-center">
          <v-text-field
            v-model.number="loanAnnualRateModel"
            label="年利率"
            type="number"
            suffix="%"
            density="compact"
            variant="outlined"
            hide-details
            style="max-width: 130px;"
          ></v-text-field>
          <v-text-field
            v-model.number="loanYearsModel"
            label="年數"
            type="number"
            suffix="年"
            density="compact"
            variant="outlined"
            hide-details
            style="max-width: 110px;"
          ></v-text-field>
          <v-text-field
            v-model.number="loanPeriodsModel"
            label="期數"
            type="number"
            suffix="期"
            density="compact"
            variant="outlined"
            hide-details
            style="max-width: 110px;"
          ></v-text-field>
          <span class="text-caption text-grey-darken-1 loan-param-note">
            <template v-if="loanIntervalText">每期間隔約 {{ loanIntervalText }} 個月｜</template>{{ effectiveLoanParams.amortizationType }}｜臨時調整僅影響本次報價
          </span>
        </div>
        <v-divider></v-divider>

        <v-card-text class="pa-2">
          <template v-if="companyLoanSchedule">
            <div class="loan-table-wrap">
              <v-table density="compact" class="loan-table">
                <thead>
                  <tr>
                    <th class="text-center">期別</th>
                    <th class="text-right">本金 (元)</th>
                    <th class="text-right">利息 (元)</th>
                    <th class="text-right">每期金額 (元)</th>
                    <th class="text-right">剩餘本金 (元)</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="row in companyLoanSchedule.rows" :key="row.period">
                    <td class="text-center">{{ row.period }}</td>
                    <td class="text-right">{{ row.principal.toLocaleString() }}</td>
                    <td class="text-right">{{ row.interest.toLocaleString() }}</td>
                    <td class="text-right font-weight-medium">{{ row.payment.toLocaleString() }}</td>
                    <td class="text-right text-grey">{{ row.remaining.toLocaleString() }}</td>
                  </tr>
                </tbody>
                <tfoot>
                  <tr class="loan-total-row">
                    <td class="text-center font-weight-bold">合計</td>
                    <td class="text-right font-weight-bold">{{ companyLoanSchedule.totals.principal.toLocaleString() }}</td>
                    <td class="text-right font-weight-bold">{{ companyLoanSchedule.totals.interest.toLocaleString() }}</td>
                    <td class="text-right font-weight-bold">{{ companyLoanSchedule.totals.payment.toLocaleString() }}</td>
                    <td></td>
                  </tr>
                </tfoot>
              </v-table>
            </div>
            <div v-if="effectiveLoanParams.note" class="text-caption text-grey-darken-1 mt-1">
              {{ effectiveLoanParams.note }}
            </div>
          </template>
          <div v-else class="text-center text-grey pa-3">
            <v-icon size="20" class="mb-1">mdi-alert-circle-outline</v-icon>
            <div class="text-body-2">借貸參數無效（成數、年數、期數須大於 0），請調整上方參數。</div>
          </div>
        </v-card-text>
      </v-card>

      <!-- 向後相容性：舊版本的 PaymentDetails -->
      <div v-if="!generalPaymentCalculation.hasData && !packagePaymentCalculation.hasData && paymentTermsData && paymentTermsData.length > 0">
        <PaymentDetails
          :payment-terms-data="paymentTermsData"
          :package-terms-data="packageTermsData"
          :final-total-price="finalTotalPrice"
          :is-first-time-buyer="isFirstTimeBuyerBoolean"
          :use-package-deal="usePackageDealModel"
          :package-price="packagePrice"
        />
      </div>

      <!-- 錯誤訊息顯示 -->
      <div v-if="generalPaymentCalculation.error || packagePaymentCalculation.error" class="mt-2">
        <v-alert type="warning" density="compact">
          <div v-if="generalPaymentCalculation.error">
            總價期款計算錯誤: {{ generalPaymentCalculation.error }}
          </div>
          <div v-if="packagePaymentCalculation.error">
            配套期款計算錯誤: {{ packagePaymentCalculation.error }}
          </div>
        </v-alert>
      </div>
      <!-- 無任何期款設定（新版範本與舊版資料皆無） -->
      <div v-if="!hasNewTemplates && !(paymentTermsData && paymentTermsData.length > 0)" class="text-center pa-4 text-red bg-grey-lighten-4">
        <v-icon size="24" class="mb-2">mdi-alert-circle-outline</v-icon>
        <div>缺少有效的期款比例設定，請至後台確認。</div>
        <div class="text-caption mt-1">
          條件：總價 {{ finalTotalPrice.toLocaleString() }}萬、
          {{ isFirstTimeBuyerModel === '是' ? '首購' : '非首購' }}
        </div>
      </div>
    </div>

  </div>
</v-expand-transition>

    <!-- ✅ [新增] 套用車位至其他戶別 -->
    <v-dialog v-model="isApplyParkingOpen" max-width="500">
      <v-card>
        <v-card-title class="d-flex align-center">
          <v-icon class="mr-2" color="primary">mdi-content-copy</v-icon>套用車位至其他戶別
          <v-spacer />
          <v-btn icon variant="text" @click="isApplyParkingOpen = false"><v-icon>mdi-close</v-icon></v-btn>
        </v-card-title>
        <v-card-text>
          <div class="text-subtitle-2 mb-1">要套用的車位（可只勾選部分分開套用）</div>
          <v-checkbox v-for="sp in applySpotOptions" :key="sp.id" v-model="applySpotIds" :value="sp.id"
            density="compact" hide-details :label="sp.label" />

          <v-divider class="my-3" />
          <div class="d-flex align-center mb-1">
            <div class="text-subtitle-2">套用到哪些戶別</div>
            <v-spacer />
            <v-btn size="x-small" variant="text" color="primary" @click="toggleAllApplyTargets">
              {{ allApplyTargetsSelected ? '全不選' : '全選' }}
            </v-btn>
          </div>
          <v-checkbox v-for="t in otherQuoteItems" :key="t.internalId" v-model="applyTargetIds"
            :value="t.internalId" density="compact" hide-details :label="applyTargetLabel(t)" />

          <v-divider class="my-3" />
          <v-radio-group v-model="applyParkingMode" inline hide-details density="compact">
            <v-radio label="覆蓋既有車位" value="replace" />
            <v-radio label="加入（保留原有，不重複）" value="merge" />
          </v-radio-group>
        </v-card-text>
        <v-card-actions>
          <v-btn color="error" variant="text" size="small" :disabled="!applyTargetIds.length"
            @click="clearApplyTargetsParking">清除所選戶別車位</v-btn>
          <v-spacer />
          <v-btn variant="text" @click="isApplyParkingOpen = false">取消</v-btn>
          <v-btn color="primary" variant="flat"
            :disabled="!applySpotIds.length || !applyTargetIds.length"
            @click="commitApplyParking">套用</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- 車位選擇 Modal -->
    <ParkingEditModal 
      v-model:show="isParkingModalOpen"
      :allParkingData="allParkingData"
      :initialSelectedParking="item.selectedParking || []"
      @confirm="handleParkingUpdate"
      mode="quote"
      :unitId="item.unitId"
      :project-id="props.projectId" @request-open-slide="emit('request-open-slide')"
    />

    <!-- ✅ [新增] 戶別圖片燈箱（含放大燈箱） -->
    <UnitImageLightbox
      v-model="isImageLightboxVisible"
      :images="householdImages"
      :title="item.unitId"
    />

    <!-- ✅ [新增] 議價調整對話框（電腦版左右配置：左設定／右結果；手機維持堆疊） -->
    <v-dialog v-model="isNegotiationDialogVisible" max-width="920">
      <v-card class="negotiation-dialog">
        <v-card-title class="bg-primary text-white d-flex align-center gap-2">
          <v-icon>mdi-percent</v-icon>
          議價調整 - {{ item.unitId }}
        </v-card-title>

        <v-card-text class="pt-5">
          <!-- ✅ [優化] 目前房屋總價：頂部總覽帶（含單價；露臺戶標示 房屋＋露臺 拆分） -->
          <v-sheet rounded="lg" class="neg-summary pa-4 mb-5">
            <div class="d-flex flex-wrap justify-space-between align-center ga-3">
              <div>
                <div class="text-caption text-grey-darken-1 mb-1">目前房屋總價</div>
                <div class="text-h4 font-weight-bold text-primary">{{ displayHousePrice }} <span class="text-h6 font-weight-medium">萬元</span></div>
                <!-- ✅ 露臺戶：明確標示 房屋價格＋露臺價格（露臺為表價，議價僅影響房屋） -->
                <div v-if="showTerraceUnitSplit" class="text-body-2 text-grey-darken-2 mt-1">
                  房屋 <strong>{{ formatNumber(currentHouseOnlyPrice) }}</strong> 萬 ＋ 露臺 <strong>{{ formatNumber(negotiationTerracePrice) }}</strong> 萬
                </div>
              </div>
              <div class="text-md-right">
                <!-- ✅ 目前單價（露臺戶已扣除露臺價與露臺面積後換算） -->
                <div class="text-body-2">
                  <span class="text-grey-darken-1">房屋單價</span>
                  <strong class="ml-1">{{ formatNumber(currentHouseUnitPrice, 2) }} 萬/坪</strong>
                </div>
                <div v-if="showTerraceUnitSplit" class="text-body-2">
                  <span class="text-grey-darken-1">露臺單價</span>
                  <strong class="ml-1">{{ displayTerraceUnitPrice }} 萬/坪</strong>
                </div>
                <div class="text-caption text-grey mt-1">房屋總面積 {{ formatNumber(item.unitDetails.area_house_ping, 2) }} 坪<template v-if="showTerraceUnitSplit">（露臺 {{ formatNumber(item.unitDetails.area_terrace_ping, 2) }} 坪不計入）</template></div>
              </div>
            </div>
          </v-sheet>

          <v-row dense>
            <!-- 左：調整設定 -->
            <v-col cols="12" md="5">
              <div class="text-subtitle-2 font-weight-bold mb-3 d-flex align-center">
                <v-icon size="18" class="mr-1" color="primary">mdi-tune-variant</v-icon>調整方式
              </div>

              <v-sheet rounded="lg" class="neg-field-group pa-4 mb-2">
                <div class="text-caption font-weight-bold text-grey-darken-2 mb-3">方式一：輸入調整幅度（兩欄可並用）</div>

                <label class="text-body-2 font-weight-medium d-block mb-1">每坪調整</label>
                <v-text-field
                  v-model="negotiationPerTsuboValue"
                  type="number"
                  suffix="萬/坪"
                  placeholder="例如: -1.5 (減) 或 +0.5 (加)"
                  variant="outlined"
                  density="compact"
                  bg-color="white"
                  hint="輸入負數表示每坪減少"
                  persistent-hint
                  class="mb-4"
                  @update:model-value="onNegotiationAdjustmentInput"
                ></v-text-field>

                <label class="text-body-2 font-weight-medium d-block mb-1">直接調整總價</label>
                <v-text-field
                  v-model="negotiationDirectAmountValue"
                  type="number"
                  suffix="萬"
                  placeholder="例如: -15 (減) 或 +10 (加)"
                  variant="outlined"
                  density="compact"
                  bg-color="white"
                  hint="輸入負數表示總價減少"
                  persistent-hint
                  @update:model-value="onNegotiationAdjustmentInput"
                ></v-text-field>
              </v-sheet>

              <div class="neg-or-divider my-2"><span>或</span></div>

              <v-sheet rounded="lg" class="neg-field-group pa-4">
                <div class="text-caption font-weight-bold text-grey-darken-2 mb-3">方式二：直接指定總價（與方式一互斥）</div>

                <label class="text-body-2 font-weight-medium d-block mb-1">直接輸入房屋總價（不含車位）</label>
                <v-text-field
                  v-model="negotiationTotalPriceValue"
                  type="number"
                  suffix="萬"
                  placeholder="例如: 3000"
                  variant="outlined"
                  density="compact"
                  bg-color="white"
                  hint="直接以此金額作為「房屋總價（不含車位）」"
                  persistent-hint
                  @update:model-value="onNegotiationTotalPriceInput"
                ></v-text-field>
              </v-sheet>
            </v-col>

            <!-- 右：調整預覽（結果） -->
            <v-col cols="12" md="7">
              <div class="text-subtitle-2 font-weight-bold mb-3 d-flex align-center">
                <v-icon size="18" class="mr-1" color="primary">mdi-calculator-variant-outline</v-icon>調整預覽
              </div>
              <v-card variant="outlined" class="pa-4 bg-grey-lighten-5 neg-preview">
              <!-- 原房屋總價 -->
              <div class="d-flex justify-space-between align-center">
                <span class="text-grey-darken-2">原房屋總價（表價）</span>
                <span class="font-weight-bold">{{ negotiationBasePrice }} 萬</span>
              </div>
              <!-- ✅ [新增] 露臺戶：表價拆分 房屋＋露臺 -->
              <div v-if="showTerraceUnitSplit" class="text-caption text-grey-darken-1 text-right">
                房屋 {{ formatNumber(listHouseOnlyPrice) }} 萬 ＋ 露臺 {{ formatNumber(negotiationTerracePrice) }} 萬
              </div>
              <!-- ✅ [新增] 表價單價（露臺戶已扣除露臺價與露臺面積） -->
              <div class="text-caption text-grey text-right mb-2">
                單價 {{ formatNumber(listHouseUnitPrice, 2) }} 萬/坪<template v-if="showTerraceUnitSplit">｜露臺 {{ displayTerraceUnitPrice }} 萬/坪</template>
              </div>
              <v-divider class="my-2"></v-divider>

              <!-- 每坪調整 (僅在有值時顯示) -->
              <div v-if="negotiationPerTsuboValue !== ''" class="d-flex justify-space-between align-center mb-3">
                <span class="text-grey-darken-2">
                  每坪調整 ({{ negotiationPerTsuboValue }} × {{ formatNumber(item.unitDetails.area_house_ping, 2) }} 坪)
                </span>
                <span :class="(Number(negotiationPerTsuboValue) * Number(item.unitDetails.area_house_ping)) > 0 ? 'text-error font-weight-bold' : 'text-success font-weight-bold'">
                  {{ (Number(negotiationPerTsuboValue) * Number(item.unitDetails.area_house_ping)) > 0 ? '+' : '' }}{{ Math.round(Number(negotiationPerTsuboValue) * Number(item.unitDetails.area_house_ping)) }} 萬
                </span>
              </div>

              <!-- 直接調整 (僅在有值時顯示) -->
              <div v-if="negotiationDirectAmountValue !== ''" class="mb-3">
                <div class="d-flex justify-space-between align-center">
                  <span class="text-grey-darken-2">直接調整</span>
                  <span :class="Number(negotiationDirectAmountValue) > 0 ? 'text-error font-weight-bold' : 'text-success font-weight-bold'">
                    {{ Number(negotiationDirectAmountValue) > 0 ? '+' : '' }}{{ negotiationDirectAmountValue }} 萬
                  </span>
                </div>
                <!-- ✅ [新增] 折算每坪 -->
                <div class="text-caption text-grey text-right">折算 {{ directAmountPerPing > 0 ? '+' : '' }}{{ formatNumber(directAmountPerPing, 2) }} 萬/坪</div>
              </div>

              <!-- 直接輸入總價 (僅在有值時顯示) -->
              <div v-if="negotiationTotalPriceValue !== ''" class="mb-3">
                <div class="d-flex justify-space-between align-center">
                  <span class="text-grey-darken-2">直接輸入總價</span>
                  <span class="font-weight-bold">{{ Math.round(Number(negotiationTotalPriceValue) || 0) }} 萬</span>
                </div>
                <!-- ✅ [新增] 換算單價（露臺戶已扣除露臺價與露臺面積） -->
                <div class="text-caption text-grey text-right">單價 {{ formatNumber(totalPriceInputUnitPrice, 2) }} 萬/坪</div>
              </div>

              <!-- 分隔線 (若有任一調整) -->
              <div v-if="negotiationPerTsuboValue !== '' || negotiationDirectAmountValue !== '' || negotiationTotalPriceValue !== ''">
                <v-divider class="my-2"></v-divider>
              </div>

              <!-- 調整合計 -->
              <div class="d-flex justify-space-between align-center">
                <span class="text-grey-darken-2 font-weight-bold">調整合計</span>
                <span :class="(negotiatedPrice - negotiationBasePrice) > 0 ? 'text-error font-weight-bold' : 'text-success font-weight-bold'">
                  {{ (negotiatedPrice - negotiationBasePrice) > 0 ? '+' : '' }}{{ negotiatedPrice - negotiationBasePrice }} 萬
                </span>
              </div>
              <!-- ✅ [新增] 調整合計折算每坪 -->
              <div class="text-caption text-grey text-right mb-2">折算 {{ negotiationDeltaPerPing > 0 ? '+' : '' }}{{ formatNumber(negotiationDeltaPerPing, 2) }} 萬/坪</div>
              <v-divider class="my-2"></v-divider>

              <!-- 新房屋總價 -->
              <div class="d-flex justify-space-between align-center">
                <span class="text-h6 font-weight-bold">新房屋總價</span>
                <span class="text-h5 font-weight-bold text-primary">{{ negotiatedPrice }} 萬</span>
              </div>
              <!-- ✅ [新增] 露臺戶：新總價拆分 房屋＋露臺（議價僅影響房屋，露臺維持表價） -->
              <div v-if="showTerraceUnitSplit" class="text-caption text-grey-darken-1 text-right">
                房屋 {{ formatNumber(negotiatedPrice - negotiationTerracePrice) }} 萬 ＋ 露臺 {{ formatNumber(negotiationTerracePrice) }} 萬
              </div>
              <!-- ✅ [新增] 新單價（露臺戶已扣除露臺價與露臺面積） -->
              <div class="text-caption text-grey text-right">
                單價 {{ formatNumber(negotiatedUnitPrice, 2) }} 萬/坪<template v-if="showTerraceUnitSplit">｜露臺 {{ displayTerraceUnitPrice }} 萬/坪</template>
              </div>
              <!-- ✅ [新增] 含車位總價：避免把「房屋總價」誤認為含車位總價 -->
              <div v-if="!item.usePackageDeal" class="d-flex justify-space-between align-center mt-2">
                <span class="text-caption text-grey-darken-1">含車位總價（車位 {{ formatNumber(quoteStore.getParkingTotalPrice(props.item.internalId)) }} 萬）</span>
                <span class="text-subtitle-1 font-weight-bold">{{ formatNumber(negotiatedPrice + quoteStore.getParkingTotalPrice(props.item.internalId)) }} 萬</span>
              </div>
              <!-- ✅ 配套模式：總價固定為配套價，折讓自配套金額扣除 -->
              <template v-else>
                <v-divider class="my-2"></v-divider>
                <div class="d-flex justify-space-between align-center">
                  <span class="text-caption text-grey-darken-1">配套價（總價，不變）</span>
                  <span class="font-weight-bold">{{ formatNumber(item.unitDetails.price_package_deal) }} 萬</span>
                </div>
                <div class="d-flex justify-space-between align-center mt-1">
                  <span class="text-caption text-grey-darken-1">配套金額（原 {{ formatNumber(quoteStore.getListPackagePrice(props.item.internalId)) }} 萬）</span>
                  <span class="text-subtitle-1 font-weight-bold" :class="negotiationPreviewPackagePrice < 0 ? 'text-error' : 'text-success'">
                    {{ formatNumber(negotiationPreviewPackagePrice) }} 萬
                  </span>
                </div>
                <div v-if="negotiationPreviewPackagePrice < 0" class="text-caption text-error mt-1">折讓超過配套金額，無法儲存</div>
              </template>
              </v-card>
            </v-col>
          </v-row>
        </v-card-text>

        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="grey" variant="text" @click="isNegotiationDialogVisible = false">
            取消
          </v-btn>
          <v-btn color="primary" variant="flat" @click="saveNegotiatedPrice">
            確認調整
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- ✅ [新增] 選擇方案對話框（方案編輯器功能） -->
    <QuotePlanPickerDialog
      v-model="isPlanPickerVisible"
      :item="item"
      :plans="quotePlans"
      :payment-templates="paymentTemplates"
      @apply="applyPlans"
      @clear="clearAppliedPlans"
    />
    </div>
</template>

<script setup>
import { ref, computed, defineProps, defineEmits, onMounted, watch } from 'vue'; // ★★★ 1. 引入 watch ★★★
import { useQuoteStore, applyNegotiation, deriveNegotiationMode } from '@/store/quoteStore';
import { useToast } from 'vue-toastification';
import { useDisplay } from 'vuetify';
import PaymentDetails from './PaymentDetails.vue';
import ParkingEditModal from './ParkingEditModal.vue';
import UnitImageLightbox from './UnitImageLightbox.vue';
import QuotePlanPickerDialog from './QuotePlanPickerDialog.vue';
import { useProjectStore } from '@/store/projectStore';
// ✅ [重構] 期款公式計算引擎抽出為共用模組（與付款表產製共用）
import { runNewCalculationEngine } from '@/utils/paymentCalculation';
// 公司借貸攤還表計算（期款範本附掛借貸範本時顯示）
import { buildCompanyLoanSchedule } from '@/utils/companyLoanCalculation';

const props = defineProps({
  item: { type: Object, required: true },
  paymentTermsData: { type: Array, default: () => [] }, // 保留向後相容性
  packageTermsData: { type: Array, default: () => [] }, // 保留向後相容性
  paymentTemplates: { type: Array, default: () => [] }, // 新增：Firestore 期款範本
  companyLoanTemplates: { type: Array, default: () => [] }, // 公司借貸範本（附掛顯示攤還表）
  showPackageDeal: { type: Boolean, default: true },
  isLoading: { type: Boolean, default: false },
  allParkingData: { type: Array, default: () => [] },
  projectId: { type: String, required: true }, // ✓ 新增：接收 projectId
  allSalesImages: { type: Array, default: () => [] }, // ✅ [新增] 建案全部銷控圖片，用於戶別圖片燈箱
  quotePlans: { type: Array, default: () => [] } // ✅ [新增] 建案方案清單（方案編輯器功能）
});

const emit = defineEmits(['remove', 'request-open-slide']);
const quoteStore = useQuoteStore();
const toast = useToast();
const projectStore = useProjectStore();
const { mobile } = useDisplay();
const isMobile = computed(() => mobile.value);
const isPaymentDetailsVisible = ref(false);
function togglePaymentDetails() {
    isPaymentDetailsVisible.value = !isPaymentDetailsVisible.value;
}
// ✅ [優化] 付款方式展開列摘要：顯示目前實際採用的總價／配套範本名稱，收合時也能一眼看出
const paymentSummaryText = computed(() => {
    const names = [];
    const general = effectiveGeneralTemplate.value?.templateName;
    const pkg = effectivePackageTemplate.value?.templateName;
    if (general) names.push(general);
    if (pkg && pkg !== general) names.push(pkg);
    return names.join('　＋　');
});

// 車位選擇相關狀態
const isParkingModalOpen = ref(false);

// ✅ [新增] 戶別圖片燈箱：以戶別的 salesImages(圖片名稱) 對應建案圖片庫
const isImageLightboxVisible = ref(false);
const householdImages = computed(() => {
  const names = props.item?.unitDetails?.salesImages;
  if (!Array.isArray(names) || names.length === 0) return [];
  const imageMap = new Map((props.allSalesImages || []).map(img => [img.imageName, img]));
  return names.map(name => imageMap.get(name)).filter(img => img && img.downloadURL);
});
const hasHouseholdImages = computed(() => householdImages.value.length > 0);

function openImageLightbox() {
  if (!hasHouseholdImages.value) return;
  isImageLightboxVisible.value = true;
}

// ✅ [新增] 議價調整相關狀態
const isNegotiationDialogVisible = ref(false);
const negotiationPerTsuboValue = ref('');    // 每坪調整值
const negotiationDirectAmountValue = ref(''); // 直接調整值
const negotiationTotalPriceValue = ref('');  // 直接輸入總價
const negotiationActiveMode = ref('');       // '' | 'perTsubo' | 'directAmount' | 'totalPrice' | 'both'
const negotiatedPrice = ref(0);

// ★★★ 保留舊的計算引擎以維持向後相容性 ★★★
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
    if (!terms || terms.length === 0 || !priceValue) return results;
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
                // Silent catch
            }
        });
    }
    if (pendingTerms.size > 0) {
        // 在正式環境中，可以選擇不拋出錯誤，只在 console 提示
        console.warn(`項目 ${Array.from(pendingTerms.keys()).join(', ')} 可能存在循環依賴或公式錯誤。`);
    }
    return results;
}

/**
 * 格式化條件值提示
 * @param {Object} item - 期款項目
 * @returns {string} 格式化的條件值提示
 */
const formatConditionalValue = (item) => {
    if (!item || !item.hasOwnProperty('conditionalValue')) return '';
    
    // 如果條件值為 0 或 null 或 undefined，返回空字串
    if (item.conditionalValue === 0 || item.conditionalValue === null || item.conditionalValue === undefined) {
        return '';
    }
    
    // 返回 Firestore 中的 conditionalValue 欄位值並加上 % 符號
    return `${item.conditionalValue}%`;
};

const formatNumber = (val, frac = 2) => {
  const num = parseFloat(val);
  if (isNaN(num)) return 'N/A';
  return num.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: frac });
};

const isFirstTimeBuyerModel = computed({
  get: () => props.item.isFirstTimeBuyer,
  set: (value) => {
    // 1. 更新 "首購" 狀態 (保持不變)
    quoteStore.updateUnitField(props.item.internalId, 'isFirstTimeBuyer', value);
    
 // ✅ [打勾] 移除 "非首購" 時自動取消配套的邏輯
    /* if (value === '否') {
      quoteStore.updateUnitField(props.item.internalId, 'usePackageDeal', false);
    }
    */
  }
});

const isFirstTimeBuyerBoolean = computed(() => isFirstTimeBuyerModel.value === '是');

const usePackageDealModel = computed({
  get: () => props.item.usePackageDeal,
  set: (value) => {
    // ✅ [新增] 超過配套總價上限的戶別禁止勾選配套
    if (value === true && !isPackageDealAllowed.value) return;
    // ✅ 議價以「表價」為基準，配套／非配套皆適用；勾選配套時若折讓已超過配套金額 → 阻止並提示
    if (value === true && hasNegotiation.value) {
      const listPkg = (quoteStore.getListHousePrice(props.item.internalId) + quoteStore.getParkingTotalPrice(props.item.internalId))
        - (Number(props.item.unitDetails?.price_package_deal) || 0);
      const newPkg = listPkg + quoteStore.getNegotiationDelta(props.item.internalId);
      if (newPkg < 0) {
        toast.warning(`${props.item.unitId} 目前議價折讓已超過配套金額（${formatNumber(listPkg)} 萬），請先減少折讓再勾選配套`);
        return;
      }
    }
    quoteStore.updateUnitField(props.item.internalId, 'usePackageDeal', value);
  }
});

// 議價按鈕：配套／非配套皆可議價（折讓以表價為基準；配套模式自配套金額扣除）
const isNegotiationDisabled = computed(() => false);
const negotiationDisabledHint = computed(() => '');

// ✅ [新增] 配套總價門檻（萬，由銷控權限人員於報價單設定頁設定；null = 不限制）
const packagePriceThreshold = computed(() => {
  const project = projectStore.getProjectById(props.projectId) || projectStore.currentProject;
  const raw = project?.quotePackageThreshold;
  if (raw === null || raw === undefined || raw === '') return null;
  const num = Number(raw);
  return Number.isFinite(num) && num > 0 ? num : null;
});

// ✅ [新增] 是否允許勾選配套：「未套配套的原始總價（房屋＋車位）」達到門檻(>=)才可勾選，避免被配套價本身影響
const isPackageDealAllowed = computed(() => {
  if (packagePriceThreshold.value === null) return true;
  const housePrice = Number(props.item.unitDetails?.price_list_house_total) || 0;
  const parkingTotal = quoteStore.getParkingTotalPrice(props.item.internalId);
  return (housePrice + parkingTotal) >= packagePriceThreshold.value;
});

// ✅ [新增] 不可勾選時的提示文字
const packageDisabledHint = computed(() => {
  if (isPackageDealAllowed.value) return '';
  return `總價未達配套門檻 ${packagePriceThreshold.value.toLocaleString()} 萬，不可勾選配套`;
});

// ✅ [新增] 若已勾選配套但因門檻調整（或車位變動後）變為不符資格，自動取消勾選
watch(isPackageDealAllowed, (allowed) => {
  if (!allowed && props.item.usePackageDeal) {
    quoteStore.updateUnitField(props.item.internalId, 'usePackageDeal', false);
    // ✅ [A3] 不再靜默取消，明確告知使用者
    toast.warning(`${props.item.unitId} 總價未達配套門檻，已自動取消配套`);
  }
}, { immediate: true });

// ✅ [新增] Computed: 是否顯示優付選項 (依據專案設定)
const showPreferredPaymentOption = computed(() => {
    return projectStore.currentProject?.showPreferredPaymentInQuote === true;
});

/// ✅ [修改] Computed: 判斷戶別是否具備優付資格
// 修正說明: 資料庫欄位 isPreferredPayment 位於 unitDetails 物件中，而非 item 根目錄
const isPreferredPaymentEligible = computed(() => {
    // 使用 Optional Chaining (?.) 避免 unitDetails 為空時報錯
    return props.item.unitDetails?.isPreferredPayment === true;
});

// ✅ [新增] Computed: 優付 Model (處理禁用邏輯)
const usePreferredPaymentModel = computed({
  get: () => {
      // 如果不具資格，強制返回 false
      if (!isPreferredPaymentEligible.value) return false;
      return props.item.usePreferredPayment || false;
  },
  set: (value) => {
    // 如果不具資格，禁止修改為 true
    if (!isPreferredPaymentEligible.value && value === true) return;
    
    quoteStore.updateUnitField(props.item.internalId, 'usePreferredPayment', value);
  }
});



// ✅ [修正 TDZ] finalTotalPrice / packagePrice 必須在 selectPaymentTemplate 及
// watch(generalPaymentCalculation, { immediate:true }) 之前宣告，否則 setup 期間
// 同步求值會發生 "Cannot access 'finalTotalPrice' before initialization"。
const packagePrice = computed(() => quoteStore.getPackagePrice(props.item.internalId));
const finalTotalPrice = computed(() => quoteStore.getFinalTotalPrice(props.item.internalId));

// ★★★ 新增：期款範本選擇邏輯 ★★★

/**
 * 根據條件選擇適用的期款範本
 * @param {string} paymentCategory - 期款類別 ("一般期款" 或 "配套期款")
 * @returns {Object|null} 適用的範本
 */
function selectPaymentTemplate(paymentCategory) {
    if (!props.paymentTemplates || props.paymentTemplates.length === 0) {
        return null;
    }
    
    const totalPrice = finalTotalPrice.value;
    const buyerType = isFirstTimeBuyerModel.value === '是' ? '首購' : '非首購';
    const currentPropertyType = props.item.unitDetails?.propertyType || props.item.unitDetails?.layout || '住家';
    
    // ✅ [新增] 取得優付類別名稱 (假設後台設定為 '優付期款')
    // 如果使用者勾選了「優付」，且正在尋找「一般期款」的替代品
    // (注意：這裡的邏輯取決於您的業務需求。通常「優付」是一種特殊的「一般期款」或「配套期款」)
    // 假設：若勾選優付，優先尋找類別為「優付期款」的範本
    
    let targetCategory = paymentCategory;
    if (usePreferredPaymentModel.value && paymentCategory === '一般期款') {
        // 如果勾選優付，嘗試覆蓋一般期款為優付期款
        // 您需要在 PaymentTermsSettings.vue 確保有 '優付期款' 這個類別
        targetCategory = '優付期款';
    }

    // 找出符合條件的範本
    const applicableTemplates = props.paymentTemplates.filter(template => {
        const templatePropType = template.propertyType || '住家';
        if (templatePropType !== currentPropertyType) return false;

        return (
            template.paymentCategory === targetCategory && // 使用目標類別
            template.minPrice <= totalPrice && 
            totalPrice <= template.maxPrice && 
            template.buyerType === buyerType
        );
    });
    
    // 如果是優付模式但找不到優付範本，是否要降級回一般範本？
    // 這裡採用的策略是：若找不到，則回傳空 (提示無範本)，因為優付條件通常比較特殊
    
    if (applicableTemplates.length === 0) {
        // Fallback: 如果是優付模式找不到，嘗試找回原本的一般期款？
        // 依需求決定。目前先不 fallback，讓用戶知道缺範本。
        return null;
    }
    
    return applicableTemplates[0];
}

// ★★★ 新增：手動指定總價期款範本（兩層連動選擇器） ★★★

// ✅ [新增] 是否有新版期款範本（決定是否顯示整合式期款卡片）
const hasNewTemplates = computed(() => (props.paymentTemplates || []).length > 0);

// 第一層：期款類別選項（取所有範本中 distinct 的 paymentCategory）
// ✅ [修改] 排除「配套期款」：其期數基準為配套金額，與總價期款不同，不可套用於總價
const manualCategoryOptions = computed(() => {
    const set = new Set();
    (props.paymentTemplates || []).forEach(t => {
        if (t.paymentCategory && t.paymentCategory !== '配套期款') set.add(t.paymentCategory);
    });
    return Array.from(set);
});

// 第一層 v-model：手動值優先；自動模式下同步顯示系統實際採用的類別
const manualCategoryModel = computed({
    get: () => {
        if (props.item.manualTemplate?.category) return props.item.manualTemplate.category;
        // ✅ [新增] 自動判斷（含優付自動切換）時，回填系統實際採用的類別供 UI 顯示
        return effectiveGeneralTemplate.value?.paymentCategory || null;
    },
    set: (value) => {
        // 切換類別時一併清空已選範本，避免殘留不屬於該類別的 templateId；
        // ✅ [新增] 若該類別下只有一個範本，直接預設選定該唯一選項
        const candidates = value
            ? (props.paymentTemplates || []).filter(t => t.paymentCategory === value)
            : [];
        quoteStore.updateItemManualTemplate(props.item.internalId, {
            category: value,
            templateId: candidates.length === 1 ? candidates[0].id : null
        });
    }
});

// 第二層：依所選類別列出該類別下所有範本（不受總價/首購/物件類型限制）
const manualTemplateOptions = computed(() => {
    const category = manualCategoryModel.value;
    if (!category) return [];
    return (props.paymentTemplates || [])
        .filter(t => t.paymentCategory === category)
        .map(t => {
            const range = (t.minPrice || t.maxPrice)
                ? `${t.minPrice ? `${t.minPrice}萬` : '0'}~${t.maxPrice ? `${t.maxPrice}萬` : '無上限'}`
                : '不限總價';
            const subtitle = `${t.propertyType || '住家'}｜${t.buyerType || '非首購'}｜${range}`;
            return { id: t.id, templateName: t.templateName, subtitle };
        });
});

// 第二層 v-model：手動值優先；自動模式下同步顯示系統實際採用的範本
const manualTemplateIdModel = computed({
    get: () => {
        if (props.item.manualTemplate?.templateId) return props.item.manualTemplate.templateId;
        // ✅ [新增] 自動判斷（含優付自動切換）時，回填系統實際採用的範本供 UI 顯示
        return effectiveGeneralTemplate.value?.id || null;
    },
    set: (value) => {
        quoteStore.updateItemManualTemplate(props.item.internalId, { templateId: value });
    }
});

// 是否處於手動覆蓋狀態（已選定範本且該範本存在）
const isManualTemplateActive = computed(() => {
    const id = props.item.manualTemplate?.templateId;
    return !!id && (props.paymentTemplates || []).some(t => t.id === id);
});

// 還原為自動（清空手動選擇）
function resetManualTemplate() {
    quoteStore.updateItemManualTemplate(props.item.internalId, { category: null, templateId: null });
}

// ★★★ 新增：手動指定配套期款範本（兩層連動選擇器；類別僅限「配套期款」） ★★★

// 第一層：期款類別選項（僅開放「配套期款」，且需有對應範本存在）
const packageCategoryOptions = computed(() => {
    const hasPackageTemplate = (props.paymentTemplates || []).some(t => t.paymentCategory === '配套期款');
    return hasPackageTemplate ? ['配套期款'] : [];
});

// 第一層 v-model：手動值優先；自動模式下同步顯示系統實際採用的類別
const manualPackageCategoryModel = computed({
    get: () => {
        if (props.item.manualPackageTemplate?.category) return props.item.manualPackageTemplate.category;
        // ✅ [新增] 自動判斷（含優付自動套用）時，回填系統實際採用的類別供 UI 顯示
        return effectivePackageTemplate.value ? '配套期款' : null;
    },
    set: (value) => {
        // 切換類別時一併清空已選範本，避免殘留不屬於該類別的 templateId；
        // ✅ [新增] 若該類別下只有一個範本，直接預設選定該唯一選項
        const candidates = value
            ? (props.paymentTemplates || []).filter(t => t.paymentCategory === value)
            : [];
        quoteStore.updateItemManualPackageTemplate(props.item.internalId, {
            category: value,
            templateId: candidates.length === 1 ? candidates[0].id : null
        });
    }
});

// 第二層：僅列出類別為「配套期款」的範本（不受總價/首購/物件類型限制）
const manualPackageTemplateOptions = computed(() => {
    if (!manualPackageCategoryModel.value) return [];
    return (props.paymentTemplates || [])
        .filter(t => t.paymentCategory === '配套期款')
        .map(t => {
            const range = (t.minPrice || t.maxPrice)
                ? `${t.minPrice ? `${t.minPrice}萬` : '0'}~${t.maxPrice ? `${t.maxPrice}萬` : '無上限'}`
                : '不限總價';
            const subtitle = `${t.propertyType || '住家'}｜${t.buyerType || '非首購'}｜${range}`;
            return { id: t.id, templateName: t.templateName, subtitle };
        });
});

// 第二層 v-model：手動值優先；自動模式下同步顯示系統實際採用的範本
const manualPackageTemplateIdModel = computed({
    get: () => {
        if (props.item.manualPackageTemplate?.templateId) return props.item.manualPackageTemplate.templateId;
        // ✅ [新增] 自動判斷（含優付自動套用）時，回填系統實際採用的範本供 UI 顯示
        return effectivePackageTemplate.value?.id || null;
    },
    set: (value) => {
        quoteStore.updateItemManualPackageTemplate(props.item.internalId, { templateId: value });
    }
});

// 是否處於手動覆蓋狀態（已選定範本、該範本存在且確為配套期款類別）
const isManualPackageTemplateActive = computed(() => {
    const id = props.item.manualPackageTemplate?.templateId;
    return !!id && (props.paymentTemplates || []).some(t => t.id === id && t.paymentCategory === '配套期款');
});

// 還原為自動（清空手動選擇）
function resetManualPackageTemplate() {
    quoteStore.updateItemManualPackageTemplate(props.item.internalId, { category: null, templateId: null });
}

// 實際採用的配套期款範本：手動優先，否則走自動判斷（僅接受配套期款類別）
const effectivePackageTemplate = computed(() => {
    const manualId = props.item.manualPackageTemplate?.templateId;
    if (manualId) {
        const found = (props.paymentTemplates || []).find(t => t.id === manualId && t.paymentCategory === '配套期款');
        if (found) return found; // 手動指定且存在 → 直接採用
        // 找不到（範本已被刪除）→ fallback 回自動判斷
    }
    // ✅ [新增] 優付模式：總價期款採用優付時，配套期款預設選名稱含「優付」的範本
    if (isGeneralUsingPreferred.value) {
        const preferred = selectPreferredPackageTemplate();
        if (preferred) return preferred;
        // 找不到含「優付」的配套範本 → fallback 回一般自動判斷
    }
    return selectPaymentTemplate('配套期款');
});

// 實際採用的總價期款範本：手動優先（且優先於「優付」自動切換），否則走自動判斷
const effectiveGeneralTemplate = computed(() => {
    const manualId = props.item.manualTemplate?.templateId;
    if (manualId) {
        const found = (props.paymentTemplates || []).find(t => t.id === manualId);
        if (found) return found; // 手動指定且存在 → 直接採用
        // 找不到（範本已被刪除）→ fallback 回自動判斷
    }
    return selectPaymentTemplate('一般期款');
});

// ✅ [新增] 總價期款是否實際採用「優付期款」：
// 涵蓋手動指定優付類別、及勾選優付後自動切換兩種情況；
// 若尚無適用的總價範本（cat 為空），則以「優付」勾選狀態判斷
const isGeneralUsingPreferred = computed(() => {
    const cat = effectiveGeneralTemplate.value?.paymentCategory;
    return cat === '優付期款' || (!cat && usePreferredPaymentModel.value);
});

// ✅ [新增] 優付模式下的預設配套範本：
// 1. 先篩出名稱含「優付」的配套期款範本
// 2. 多筆時優先取名稱含「首購」且不含「非首購」者（「非首購」字面包含「首購」，需先排除）
function selectPreferredPackageTemplate() {
    const candidates = (props.paymentTemplates || []).filter(t =>
        t.paymentCategory === '配套期款' && (t.templateName || '').includes('優付')
    );
    if (candidates.length === 0) return null;
    if (candidates.length === 1) return candidates[0];
    const firstBuyerCandidates = candidates.filter(t => {
        const name = t.templateName || '';
        return name.includes('首購') && !name.includes('非首購');
    });
    return firstBuyerCandidates[0] || candidates[0];
}

// ★★★ 新增：一般期款計算結果 ★★★
const generalPaymentCalculation = computed(() => {
    const template = effectiveGeneralTemplate.value;
    if (!template || !template.items) {
        return { hasData: false, items: [], templateName: '' };
    }
    
    try {
        const results = runNewCalculationEngine(template.items, finalTotalPrice.value, '總價');
        const itemsArray = template.items.map(item => ({
            ...item,
            calculatedValue: results[item.name]?.value || 0
        }));
        
        return {
            hasData: true,
            items: itemsArray,
            templateName: template.templateName,
            results
        };
    } catch (error) {
        console.error('一般期款計算錯誤:', error);
        return { hasData: false, items: [], templateName: '', error: error.message };
    }
});

// ★★★ 新增：配套期款計算結果 ★★★
const packagePaymentCalculation = computed(() => {
    if (!usePackageDealModel.value || packagePrice.value <= 0) {
        return { hasData: false, items: [], templateName: '' };
    }

    const template = effectivePackageTemplate.value;
    if (!template || !template.items) {
        return { hasData: false, items: [], templateName: '' };
    }
    
    try {
        const results = runNewCalculationEngine(template.items, packagePrice.value, '配套金額');
        const itemsArray = template.items.map(item => ({
            ...item,
            calculatedValue: results[item.name]?.value || 0
        }));
        
        return {
            hasData: true,
            items: itemsArray,
            templateName: template.templateName,
            results
        };
    } catch (error) {
        console.error('配套期款計算錯誤:', error);
        return { hasData: false, items: [], templateName: '', error: error.message };
    }
});

// ✅ [打勾] 新增：監聽 generalPaymentCalculation 的變化
watch(generalPaymentCalculation, (newCalculation) => {
  // 確保計算成功且有 results 物件
  if (newCalculation && newCalculation.hasData && newCalculation.results) {
    
    // 依據您的需求：只儲存 Parent 項目
   const parentPayments = newCalculation.items
      .filter(item => !item.parentId) // 篩選出 parentId 為空 (或 falsy) 的項目
      .map(item => ({
        name: item.name,
        value: item.calculatedValue, // ✅ [打勾] 修正：使用 calculatedValue (來自 itemsArray)
        percentage: item.conditionalValue
      }));
    
    if (parentPayments.length > 0) {
      // 自動將計算結果儲存回 Pinia Store (現在會保持正確順序)
      quoteStore.updateItemCalculatedPayments(props.item.internalId, parentPayments);
    }
  }
}, {
  immediate: true, // 立即執行一次，確保組件加載時就嘗試計算並儲存
  deep: true       // 深度監聽
});

// ✅ [新增] 蒐集本戶別實際套用之期款範本的「套用期款時的說明」(applyNote)
// 涵蓋一般/優付期款與配套期款；空值不收。供列印報價單於表格下方渲染。
const appliedPaymentNotes = computed(() => {
  const notes = [];

  // 一般（含優付/手動指定）期款：以實際採用的範本為準
  if (generalPaymentCalculation.value.hasData) {
    const generalNote = effectiveGeneralTemplate.value?.applyNote;
    if (generalNote && generalNote.trim()) notes.push(generalNote.trim());
  }

  // 配套期款：有套用時才取（以實際採用的範本為準，含手動指定）
  if (packagePaymentCalculation.value.hasData) {
    const packageTemplate = effectivePackageTemplate.value;
    const packageNote = packageTemplate?.applyNote;
    if (packageNote && packageNote.trim()) notes.push(packageNote.trim());
  }

  // ✅ [新增] 已套用方案的文字內容（如贈品、特殊需求）：一併於報價單顯示與列印
  // ✅ [優化] 前綴完整方案名稱，讓報價單一目了然文字內容出自哪個方案
  (props.item.appliedPlans || []).forEach(p => {
    const planNote = String(p.note || '').trim();
    if (planNote) notes.push(`【方案｜${p.planName}】${planNote}`);
  });

  return notes;
});

// ✅ [新增] 同步「套用期款時的說明」回 Pinia Store
watch(appliedPaymentNotes, (notes) => {
  quoteStore.updateItemPaymentNotes(props.item.internalId, notes);
}, {
  immediate: true,
  deep: true
});

// ★★★ 公司借貸攤還表（期款範本附掛借貸範本時顯示） ★★★

// 附掛的借貸範本：以實際採用的總價期款範本 companyLoanTemplateId 查找；範本已刪除時視同不附掛
const effectiveLoanTemplate = computed(() => {
  const loanId = effectiveGeneralTemplate.value?.companyLoanTemplateId;
  if (!loanId) return null;
  const found = (props.companyLoanTemplates || []).find(l => l.id === loanId);
  if (!found) {
    console.warn(`[QuoteItem] 期款範本附掛的借貸範本不存在 (id: ${loanId})，視同不附掛`);
    return null;
  }
  return found;
});

// 報價當下生效的借貸參數：範本預設＋臨時調整（利率/年數/期數可調；換範本即失效）
const effectiveLoanParams = computed(() => {
  const tpl = effectiveLoanTemplate.value;
  if (!tpl) return null;
  const ov = props.item.companyLoanOverride;
  const useOverride = !!(ov && ov.templateId === tpl.id);
  return {
    templateId: tpl.id,
    loanName: tpl.loanName,
    ratioPercent: Number(tpl.ratioPercent) || 0,
    years: useOverride ? Number(ov.years) : (Number(tpl.years) || 0),
    periods: useOverride ? Number(ov.periods) : (Number(tpl.periods) || 0),
    annualRate: useOverride ? Number(ov.annualRate) : (Number(tpl.annualRate) || 0),
    amortizationType: tpl.amortizationType || '本金平均攤還',
    roundingMethod: tpl.roundingMethod || '四捨五入',
    roundingValue: tpl.roundingValue || 1,
    note: tpl.note || '',
  };
});

const isLoanOverridden = computed(() => {
  const ov = props.item.companyLoanOverride;
  return !!(ov && ov.templateId === effectiveLoanTemplate.value?.id);
});

// 寫入臨時調整（不回存範本預設值）
function updateLoanOverrideField(field, value) {
  const tpl = effectiveLoanTemplate.value;
  if (!tpl) return;
  const current = (props.item.companyLoanOverride?.templateId === tpl.id)
    ? { ...props.item.companyLoanOverride }
    : {
        templateId: tpl.id,
        annualRate: Number(tpl.annualRate) || 0,
        years: Number(tpl.years) || 0,
        periods: Number(tpl.periods) || 0,
      };
  current[field] = Number(value) || 0;
  quoteStore.updateItemCompanyLoanOverride(props.item.internalId, current);
}

const loanAnnualRateModel = computed({
  get: () => effectiveLoanParams.value?.annualRate ?? 0,
  set: (v) => updateLoanOverrideField('annualRate', v),
});
const loanYearsModel = computed({
  get: () => effectiveLoanParams.value?.years ?? 0,
  set: (v) => updateLoanOverrideField('years', v),
});
const loanPeriodsModel = computed({
  get: () => effectiveLoanParams.value?.periods ?? 0,
  set: (v) => updateLoanOverrideField('periods', v),
});

function resetLoanOverride() {
  quoteStore.updateItemCompanyLoanOverride(props.item.internalId, null);
}

// 攤還表：總價（萬）換算為元後計算
const companyLoanSchedule = computed(() => {
  const params = effectiveLoanParams.value;
  if (!params) return null;
  const priceYuan = (Number(finalTotalPrice.value) || 0) * 10000;
  return buildCompanyLoanSchedule(priceYuan, params);
});

// 每期間隔月數（顯示參考）
const loanIntervalText = computed(() => {
  const p = effectiveLoanParams.value;
  if (!p || !(p.years > 0) || !(p.periods > 0)) return '';
  const months = p.years * 12 / p.periods;
  return Number.isInteger(months) ? String(months) : months.toFixed(1);
});

// 借貸參數快照隨報價項目儲存（重開報價以快照重現；無附掛時清空）
watch(effectiveLoanParams, (params) => {
  quoteStore.updateItemCompanyLoan(
    props.item.internalId,
    params ? JSON.parse(JSON.stringify(params)) : null
  );
}, { immediate: true, deep: true });

// ★★★ 新增：列印報價單(含期款) 用資料 ★★★

// 組裝列印用付款資料：general(實際採用的總價/優付期款) / package(配套期款) / notes
// 與前端付款方式區完全一致：優付啟用時 general 即為優付期款；配套僅於前端有顯示時才有值
const printPaymentData = computed(() => {
    const buildBlock = (calc) => {
        if (!calc || !calc.hasData) return null;
        return {
            templateName: calc.templateName,
            rows: calc.items.map(it => ({
                name: it.name,
                isChild: !!it.parentId,
                hint: formatConditionalValue(it),
                value: it.calculatedValue || 0
            }))
        };
    };

    // 公司借貸攤還表（附掛且參數有效時才有值）
    const loanBlock = (companyLoanSchedule.value && effectiveLoanParams.value) ? {
        loanName: effectiveLoanParams.value.loanName,
        ratioPercent: effectiveLoanParams.value.ratioPercent,
        annualRate: effectiveLoanParams.value.annualRate,
        years: effectiveLoanParams.value.years,
        periods: effectiveLoanParams.value.periods,
        amortizationType: effectiveLoanParams.value.amortizationType,
        note: effectiveLoanParams.value.note,
        loanAmount: companyLoanSchedule.value.loanAmount,
        intervalMonths: companyLoanSchedule.value.intervalMonths,
        rows: companyLoanSchedule.value.rows,
        totals: companyLoanSchedule.value.totals,
    } : null;

    return {
        general: buildBlock(generalPaymentCalculation.value),
        generalIsPreferred: isGeneralUsingPreferred.value, // true 時列印標題用「優付期款」
        package: buildBlock(packagePaymentCalculation.value),
        companyLoan: loanBlock,
        notes: appliedPaymentNotes.value
    };
});

// 同步列印用付款資料回 Pinia Store（供 QuotePrintDialog 渲染 A4 報價單）
watch(printPaymentData, (data) => {
  quoteStore.updateItemPrintPaymentData(props.item.internalId, data);
}, {
  immediate: true,
  deep: true
});

const parkingTotalPrice = computed(() => quoteStore.getParkingTotalPrice(props.item.internalId));
const displayHousePrice = computed(() => formatNumber(quoteStore.getRawDisplayHousePrice(props.item.internalId)));
const displayUnitPrice = computed(() => formatNumber(quoteStore.getDisplayUnitPrice(props.item.internalId), 2));
// ✅ [新增] 露臺單價（僅露臺戶顯示）
const displayTerraceUnitPrice = computed(() => formatNumber(quoteStore.getTerraceUnitPrice(props.item.internalId), 2));

// ✅ [重構] 判斷是否有議價調整（由 store 依調整參數判斷）
const hasNegotiation = computed(() => quoteStore.hasNegotiation(props.item.internalId));

// ✅ [重構] 議價基準 = 房屋總表價（unitDetails 唯讀，不再被議價改寫）
const negotiationBasePrice = computed(() => Math.round(quoteStore.getListHousePrice(props.item.internalId)));

// 配套模式議價預覽：配套金額 = 原配套金額（表價合計 − 配套價）＋ 折讓（負數）
const negotiationPreviewPackagePrice = computed(() =>
  quoteStore.getListPackagePrice(props.item.internalId) + (negotiatedPrice.value - negotiationBasePrice.value)
);

// ✅ [新增] 露臺戶「總價」拆分顯示條件
// 議價或配套會使總價不再等於房屋表價+露臺表價，續顯示拆分會與總價矛盾，故此時隱藏
const showTerraceSplit = computed(() => {
  if (!quoteStore.hasTerraceSplit(props.item.internalId)) return false;
  if (hasNegotiation.value) return false;
  return Number(props.item?.unitDetails?.price_list_house_only) > 0;
});

// ✅ [新增] 露臺戶「單價」拆分顯示條件
// 單價已改為房屋、露臺各自獨立換算，議價僅影響房屋單價，故露臺戶一律顯示
const showTerraceUnitSplit = computed(() => quoteStore.hasTerraceSplit(props.item.internalId));

// ✅ [新增] 議價視窗單價換算（一律表價基準，不涉及底價）
// 露臺戶：先扣除露臺表價再除以房屋總面積（露臺坪本就不計入房屋總面積）
const negotiationTerracePrice = computed(() => quoteStore.getTerraceListPrice(props.item.internalId));
const negotiationHouseArea = computed(() => Number(props.item.unitDetails?.area_house_ping) || 0);
function toHouseUnitPrice(total) {
  if (!negotiationHouseArea.value) return 0;
  return ((Number(total) || 0) - negotiationTerracePrice.value) / negotiationHouseArea.value;
}
// 目前房屋總價（含議價）之房屋(不含露臺)價格與單價；議價僅影響房屋部分，露臺維持表價
const currentHouseOnlyPrice = computed(() => quoteStore.getRawDisplayHousePrice(props.item.internalId) - negotiationTerracePrice.value);
const currentHouseUnitPrice = computed(() => toHouseUnitPrice(quoteStore.getRawDisplayHousePrice(props.item.internalId)));
// 原表價之房屋(不含露臺)價格與單價
const listHouseOnlyPrice = computed(() => quoteStore.getListHousePrice(props.item.internalId) - negotiationTerracePrice.value);
const listHouseUnitPrice = computed(() => toHouseUnitPrice(quoteStore.getListHousePrice(props.item.internalId)));
// 議價後單價與各調整金額折算每坪
const negotiatedUnitPrice = computed(() => toHouseUnitPrice(negotiatedPrice.value));
const negotiationDeltaPerPing = computed(() => negotiationHouseArea.value ? (negotiatedPrice.value - negotiationBasePrice.value) / negotiationHouseArea.value : 0);
const directAmountPerPing = computed(() => negotiationHouseArea.value ? (Number(negotiationDirectAmountValue.value) || 0) / negotiationHouseArea.value : 0);
const totalPriceInputUnitPrice = computed(() => toHouseUnitPrice(negotiationTotalPriceValue.value));

// ✅ [重構] 計算調整差額：議價後房屋總價 − 表價
const negotiationDelta = computed(() => quoteStore.getNegotiationDelta(props.item.internalId));

// ★★★ 3. 新增：計算配套價子項目的 computed 屬性 ★★★
const calculatedPackageItems = computed(() => {
    // 如果不使用配套，或配套價為0，或沒有設定規則，則返回空物件
    if (!usePackageDealModel.value || packagePrice.value <= 0 || !props.packageTermsData || props.packageTermsData.length === 0) {
        return {};
    }

    // 使用公式引擎計算
    // 注意：這裡假設公式中使用的關鍵字是 '配套總價'
    const calculatedAmounts = runCalculationEngine(props.packageTermsData, packagePrice.value, '配套金額');

    // 將結果轉換為 { "項目名稱": 金額 } 的格式
    return props.packageTermsData.reduce((acc, term) => {
        const termName = term['項目名稱'];
        const termId = term['編號'];
        if (termName && calculatedAmounts[termId] !== undefined) {
            acc[termName] = calculatedAmounts[termId];
        }
        return acc;
    }, {});
});

// ★★★ 4. 新增：使用 watch 監聽計算結果，並更新到 store 中 ★★★
watch(calculatedPackageItems, (newPackageItems) => {
    // 呼叫 store 的 action 來更新
    quoteStore.updateItemPackageItems(props.item.internalId, newPackageItems);
}, {
    deep: true, // 深度監聽，確保物件內部變化也能被偵測到
    immediate: true // 立即執行一次，確保初始值也被寫入 store
});


const parkingDisplayText = computed(() => {
  if (props.item.selectedParking.length === 0) return '新增車位';
  return props.item.selectedParking.map(p => p['車位編號']).join(', ');
});

const formattedParkingPrice = computed(() => {
  if (parkingTotalPrice.value === 0) return '—';
  return `${parkingTotalPrice.value.toLocaleString()} 萬`;
});

const areaDetails = computed(() => {
  const details = props.item.unitDetails;
  if (!details) return [];
  // sqm 直接取用資料庫的平方公尺欄位值（不做換算），顯示為「XX.XX 坪(XX.XXm²)」
  const areaItems = [
    { label: '主建物(室內)', value: details.area_main_ping, unit: '坪', sqm: details.area_main_sqm },
    { label: '附屬建物(陽台)', value: details.area_ancillary_ping, unit: '坪', sqm: details.area_ancillary_sqm },
    { label: '共用部分(公設)', value: details.area_common_ping, unit: '坪', sqm: details.area_common_sqm },
    { label: '露臺(不計坪)', value: details.area_terrace_ping, unit: '坪' },
    { label: '土地持分面積', value: details.land_share_ping, unit: '坪', sqm: details.land_share_sqm },
    { label: '公設比', value: details.common_area_ratio, unit: '%', isPercentage: true }
  ];
  return areaItems.filter(item => item.value !== null && item.value !== undefined && item.value !== '');
});
// 坪數後方帶出 m²（有資料才顯示）
function formatSqmSuffix(sqm) {
  const num = parseFloat(sqm);
  return (sqm === null || sqm === undefined || sqm === '' || isNaN(num)) ? '' : `(${formatNumber(sqm)}m²)`;
}

function formatPercentage(value) {
  const num = parseFloat(value);
  return isNaN(num) ? 'N/A' : `${(num * 100).toFixed(2)} %`;
}

// 車位選擇處理方法
function handleParkingUpdate(updatedParkingList) {
  quoteStore.updateParking(props.item.internalId, updatedParkingList);
  isParkingModalOpen.value = false;
  // ✅ [新增] 自動提示：本戶剛選了車位、其他戶都還沒有車位 → 點 toast 直接開套用對話框
  const others = quoteStore.items.filter(i => i.internalId !== props.item.internalId);
  if (updatedParkingList.length > 0 && others.length > 0 && others.every(i => !(i.selectedParking?.length))) {
    toast.info(`已選 ${updatedParkingList.length} 個車位，點此一鍵套用至其他 ${others.length} 個戶別`, {
      timeout: 6000,
      onClick: (closeToast) => { openApplyParkingDialog(); closeToast(); },
    });
  }
}

/* ---------- ✅ [新增] 套用車位至其他戶別 ---------- */
const isApplyParkingOpen = ref(false);
const applySpotIds = ref([]);      // 勾選要套用的車位編號
const applyTargetIds = ref([]);    // 勾選目標戶別 internalId
const applyParkingMode = ref('replace');

const spotKeyOf = p => String(p?.spotId || p?.['車位編號'] || '');
const spotPriceOf = p => Number(p?.price_list ?? p?.['表價'] ?? p?.['車位表價']) || 0;

const canApplyParking = computed(() =>
  (props.item.selectedParking?.length || 0) > 0 && quoteStore.items.length > 1);

const otherQuoteItems = computed(() =>
  quoteStore.items.filter(i => i.internalId !== props.item.internalId));

const applySpotOptions = computed(() =>
  (props.item.selectedParking || []).map(p => ({
    id: spotKeyOf(p),
    label: `${spotKeyOf(p)}（${spotPriceOf(p)} 萬）`,
  })));

// 同戶別可重複加入報價，加序號區分；並顯示目標現有車位供對照
function applyTargetLabel(t) {
  const sameUnit = quoteStore.items.filter(i => i.unitId === t.unitId);
  const suffix = sameUnit.length > 1 ? `（第 ${sameUnit.indexOf(t) + 1} 筆）` : '';
  const pk = (t.selectedParking || []).map(spotKeyOf).join(', ');
  return `${t.unitId}${suffix}${pk ? `｜現有車位：${pk}` : ''}`;
}

function openApplyParkingDialog() {
  applySpotIds.value = (props.item.selectedParking || []).map(spotKeyOf);
  applyTargetIds.value = otherQuoteItems.value.map(i => i.internalId);
  applyParkingMode.value = 'replace';
  isApplyParkingOpen.value = true;
}

const allApplyTargetsSelected = computed(() =>
  otherQuoteItems.value.length > 0 && applyTargetIds.value.length === otherQuoteItems.value.length);

function toggleAllApplyTargets() {
  applyTargetIds.value = allApplyTargetsSelected.value ? [] : otherQuoteItems.value.map(i => i.internalId);
}

function commitApplyParking() {
  const spots = (props.item.selectedParking || []).filter(p => applySpotIds.value.includes(spotKeyOf(p)));
  quoteStore.applyParkingToItems(spots, applyTargetIds.value, applyParkingMode.value);
  toast.success(`已將 ${spots.length} 個車位套用至 ${applyTargetIds.value.length} 個戶別`);
  isApplyParkingOpen.value = false;
}

function clearApplyTargetsParking() {
  quoteStore.clearParkingForItems(applyTargetIds.value);
  toast.success(`已清除 ${applyTargetIds.value.length} 個戶別的車位`);
}

function openParkingModal() {
  isParkingModalOpen.value = true;
}

// ✅ [新增] 議價調整相關方法
function openNegotiationDialog() {
  // 從 negotiationState 讀取暫存的調整設定
  const savedState = props.item.negotiationState;
  negotiationPerTsuboValue.value = savedState?.perTsuboValue || '';
  negotiationDirectAmountValue.value = savedState?.directAmountValue || '';
  negotiationTotalPriceValue.value = savedState?.totalPriceValue || '';
  negotiationActiveMode.value = savedState?.activeMode || '';

  // 預覽初值：目前議價後房屋總價（無議價即為表價）
  negotiatedPrice.value = quoteStore.getNegotiatedHousePrice(props.item.internalId);

  // 若有暫存數值，重新計算預覽
  if (negotiationPerTsuboValue.value || negotiationDirectAmountValue.value || negotiationTotalPriceValue.value) {
    calculateNegotiatedPrice();
  }

  isNegotiationDialogVisible.value = true;
}

// 每坪/直接調整欄位輸入：與「直接輸入總價」互斥，先清空總價欄位
function onNegotiationAdjustmentInput() {
  if (negotiationTotalPriceValue.value !== '') {
    negotiationTotalPriceValue.value = '';
  }
  calculateNegotiatedPrice();
}

// 直接輸入總價欄位輸入：與調整欄位互斥，先清空每坪/直接調整欄位
function onNegotiationTotalPriceInput() {
  if (negotiationPerTsuboValue.value !== '') {
    negotiationPerTsuboValue.value = '';
  }
  if (negotiationDirectAmountValue.value !== '') {
    negotiationDirectAmountValue.value = '';
  }
  calculateNegotiatedPrice();
}

// ✅ [重構] 預覽價格 = 以「表價」為基準套用目前輸入的調整參數（與 store getter 同一套公式）
function calculateNegotiatedPrice() {
  const draftState = {
    activeMode: '',
    perTsuboValue: negotiationPerTsuboValue.value,
    directAmountValue: negotiationDirectAmountValue.value,
    totalPriceValue: negotiationTotalPriceValue.value
  };
  draftState.activeMode = deriveNegotiationMode(draftState);
  negotiatedPrice.value = applyNegotiation(
    quoteStore.getListHousePrice(props.item.internalId),
    props.item.unitDetails.area_house_ping,
    draftState
  );
}

function saveNegotiatedPrice() {
  const hasDirectAmount = negotiationDirectAmountValue.value !== '';
  const hasPerTsubo = negotiationPerTsuboValue.value !== '';
  const hasTotalPrice = negotiationTotalPriceValue.value !== '';

  // ✅ [新增] 欄位都空 → 視同取消調整，恢復表價
  if (!hasDirectAmount && !hasPerTsubo && !hasTotalPrice) {
    quoteStore.resetNegotiationPrice(props.item.internalId);
    isNegotiationDialogVisible.value = false;
    return;
  }

  // 與「表價」比較：加價需二次確認
  const basePrice = negotiationBasePrice.value;
  const newPrice = negotiatedPrice.value;
  const priceDifference = newPrice - basePrice;

  // 配套模式：折讓自配套金額扣除，不得使配套金額變為負數
  if (props.item.usePackageDeal && negotiationPreviewPackagePrice.value < 0) {
    toast.warning(`折讓 ${formatNumber(-priceDifference)} 萬超過配套金額 ${formatNumber(quoteStore.getListPackagePrice(props.item.internalId))} 萬，請減少折讓或取消配套`);
    return;
  }

  if (priceDifference > 0) {
    const confirmed = confirm(
      `此操作將加價 ${priceDifference} 萬元，\n表價: ${basePrice} 萬 → 新價: ${newPrice} 萬\n\n確定要加價嗎？`
    );
    if (!confirmed) {
      return;
    }
  }

  // ✅ [重構] 只保存調整參數；議價後價格由 store 依表價推導（表價更新時自動重算）
  const activeMode = hasTotalPrice ? 'totalPrice'
    : (hasPerTsubo && hasDirectAmount) ? 'both'
    : hasDirectAmount ? 'directAmount'
    : hasPerTsubo ? 'perTsubo' : '';

  quoteStore.updateNegotiationState(props.item.internalId, {
    activeMode,
    perTsuboValue: negotiationPerTsuboValue.value,
    directAmountValue: negotiationDirectAmountValue.value,
    totalPriceValue: negotiationTotalPriceValue.value
  });

  isNegotiationDialogVisible.value = false;
}

// ✅ [新增] 重置議價調整：恢復原始價格並清除調整狀態
function resetNegotiation() {
  quoteStore.resetNegotiationPrice(props.item.internalId);
}

// ✅ [新增] 監聽 Modal 關閉：若欄位都空，自動清空調整狀態（不需按確認）
watch(isNegotiationDialogVisible, (isVisible) => {
  if (!isVisible && negotiationPerTsuboValue.value === '' && negotiationDirectAmountValue.value === '' && negotiationTotalPriceValue.value === '') {
    // Modal 關閉且欄位都空 → 清空調整狀態
    quoteStore.resetNegotiationPrice(props.item.internalId);
  }
});

// ★★★ ✅ [新增] 方案編輯器：選擇方案／套用／清除 ★★★

const isPlanPickerVisible = ref(false);

// 已套用方案快照（舊 persist 資料無此欄位 → 空陣列）
const appliedPlansList = computed(() => props.item.appliedPlans || []);

// ✅ [重構] 依方案 adjustments 計算議價結果（基準一律 = 表價）
function computePlanNegotiation(adjustments) {
  const find = (mode) => (adjustments || []).find(a => a.mode === mode);
  const per = find('perTsubo');
  const dir = find('directAmount');
  const tot = find('totalPrice');

  const basePrice = negotiationBasePrice.value;
  const draftState = {
    perTsuboValue: per ? String(per.value) : '',
    directAmountValue: dir ? String(dir.value) : '',
    totalPriceValue: tot ? String(tot.value) : '',
    activeMode: tot ? 'totalPrice'
      : (per && dir) ? 'both'
      : dir ? 'directAmount'
      : per ? 'perTsubo' : ''
  };
  const newPrice = applyNegotiation(basePrice, props.item.unitDetails.area_house_ping, draftState);

  return { ...draftState, basePrice, newPrice };
}

// 套用勾選的方案（selections: [{ plan, selectedPaymentTemplateId }]，picker 已保證衝突規則）
function applyPlans(selections) {
  const internalId = props.item.internalId;
  const prevPlans = appliedPlansList.value;

  // 1) 議價方案（至多一個）先試算，加價時沿用現有二次確認；取消則整批不套用
  const negSelection = selections.find(s => Array.isArray(s.plan.adjustments) && s.plan.adjustments.length > 0);
  let negResult = null;
  if (negSelection) {
    negResult = computePlanNegotiation(negSelection.plan.adjustments);
    // 配套模式：折讓不得超過配套金額（配套金額 = 議價後房價＋車位 − 配套價）
    if (props.item.usePackageDeal) {
      const newPkg = quoteStore.getListPackagePrice(internalId) + (negResult.newPrice - negResult.basePrice);
      if (newPkg < 0) {
        toast.warning(`方案「${negSelection.plan.name}」的折讓超過 ${props.item.unitId} 的配套金額（${formatNumber(quoteStore.getListPackagePrice(internalId))} 萬），無法套用`);
        return;
      }
    }
    if (negResult.newPrice > negResult.basePrice) {
      const confirmed = confirm(
        `套用方案「${negSelection.plan.name}」將加價 ${negResult.newPrice - negResult.basePrice} 萬元，\n` +
        `原價: ${negResult.basePrice} 萬 → 新價: ${negResult.newPrice} 萬\n\n確定要套用嗎？`
      );
      if (!confirmed) return;
    }
  }

  // 2) 付款方式方案（至多一個）：等同手動兩層選擇器選定該範本
  const paySelection = selections.find(s => Array.isArray(s.plan.paymentTemplateIds) && s.plan.paymentTemplateIds.length > 0);
  if (paySelection) {
    const template = (props.paymentTemplates || []).find(t => t.id === paySelection.selectedPaymentTemplateId);
    if (template) {
      quoteStore.updateItemManualTemplate(internalId, {
        category: template.paymentCategory,
        templateId: template.id,
      });
    }
  } else if (prevPlans.some(p => p.hasPayment)) {
    // 新組合不含付款方式，但先前方案有 → 還原自動判斷
    resetManualTemplate();
  }

  // 3) 議價調整落地（只存參數，價格由 store 推導）
  if (negResult) {
    quoteStore.updateNegotiationState(internalId, {
      activeMode: negResult.activeMode,
      perTsuboValue: negResult.perTsuboValue,
      directAmountValue: negResult.directAmountValue,
      totalPriceValue: negResult.totalPriceValue,
    });
  } else if (prevPlans.some(p => p.hasNegotiation)) {
    // 新組合不含議價調整，但先前方案有 → 恢復原始價格
    quoteStore.resetNegotiationPrice(internalId);
  }

  // 4) 寫入快照（供 chips 顯示、「已修改」偵測與方案文字備註）
  const snapshots = selections.map(({ plan, selectedPaymentTemplateId }) => {
    const hasNeg = Array.isArray(plan.adjustments) && plan.adjustments.length > 0;
    const hasPay = Array.isArray(plan.paymentTemplateIds) && plan.paymentTemplateIds.length > 0;
    // ✅ [優化] 快照所選付款方式名稱：供列印報價單「採用方案」帶顯示，不依賴範本資料是否載入
    const selectedTemplate = hasPay
      ? (props.paymentTemplates || []).find(t => t.id === selectedPaymentTemplateId)
      : null;
    return {
      planId: plan.id,
      planName: plan.name,
      note: String(plan.note || '').trim(),
      hasNegotiation: hasNeg,
      hasPayment: hasPay,
      selectedPaymentTemplateId: hasPay ? (selectedPaymentTemplateId || null) : null,
      selectedPaymentTemplateName: selectedTemplate ? selectedTemplate.templateName : null,
      negotiation: hasNeg ? {
        perTsuboValue: negResult?.perTsuboValue ?? '',
        directAmountValue: negResult?.directAmountValue ?? '',
        totalPriceValue: negResult?.totalPriceValue ?? '',
      } : null,
    };
  });
  quoteStore.updateItemAppliedPlans(internalId, snapshots);
}

// 移除單一方案 chip：還原該方案帶入的效果
function removeAppliedPlan(appliedPlan) {
  const internalId = props.item.internalId;
  if (appliedPlan.hasNegotiation) {
    quoteStore.resetNegotiationPrice(internalId);
  }
  if (appliedPlan.hasPayment) {
    resetManualTemplate();
  }
  quoteStore.updateItemAppliedPlans(
    internalId,
    appliedPlansList.value.filter(p => p.planId !== appliedPlan.planId)
  );
}

// 清除全部方案
function clearAppliedPlans() {
  const internalId = props.item.internalId;
  if (appliedPlansList.value.some(p => p.hasNegotiation)) {
    quoteStore.resetNegotiationPrice(internalId);
  }
  if (appliedPlansList.value.some(p => p.hasPayment)) {
    resetManualTemplate();
  }
  quoteStore.updateItemAppliedPlans(internalId, []);
}

// 套用後使用者手動更改議價或付款方式 → chip 標示「已修改」（不自動移除）
function isPlanModified(appliedPlan) {
  const sameNumeric = (a, b) => {
    const na = a === '' || a === null || a === undefined ? null : Number(a);
    const nb = b === '' || b === null || b === undefined ? null : Number(b);
    return na === nb;
  };
  if (appliedPlan.hasNegotiation) {
    const state = props.item.negotiationState || {};
    const snap = appliedPlan.negotiation || {};
    // 議價已被清除（恢復原價）也視為已修改
    if (!hasNegotiation.value) return true;
    if (!sameNumeric(state.perTsuboValue, snap.perTsuboValue)) return true;
    if (!sameNumeric(state.directAmountValue, snap.directAmountValue)) return true;
    if (!sameNumeric(state.totalPriceValue, snap.totalPriceValue)) return true;
  }
  if (appliedPlan.hasPayment) {
    if ((props.item.manualTemplate?.templateId || null) !== (appliedPlan.selectedPaymentTemplateId || null)) return true;
  }
  return false;
}
</script>

<style scoped>
/* ✅ [新增] 有圖片的戶別：可點擊開啟燈箱 */
.unit-id-clickable {
  cursor: pointer;
  text-decoration: underline dotted;
  text-underline-offset: 3px;
  transition: opacity 0.15s;
}
.unit-id-clickable:hover {
  opacity: 0.7;
}

/* ✅ [新增] 選擇方案按鈕：漸層醒目樣式 */
.plan-select-btn {
  background: linear-gradient(135deg, #5e35b1, #d81b60);
  color: #fff !important;
  box-shadow: 0 2px 6px rgba(94, 53, 177, 0.35);
}
.plan-chip-modified {
  border-style: dashed !important;
}

/* ✅ [優化] 付款方式展開列：整列可點擊、左側色條 + 大箭頭，展開時轉色 */
.payment-toggle-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px 16px;
  min-height: 48px;
  padding: 6px 12px 6px 10px;
  margin-top: 4px;
  border-top: 1px solid #e3e8ee;
  border-left: 4px solid #90a4ae;
  background: linear-gradient(90deg, #f4f7fa, #fafbfc);
  cursor: pointer;
  user-select: none;
  transition: background-color 0.15s, border-color 0.15s;
  outline: none;
}
.payment-toggle-bar:hover { background: #eef3f8; border-left-color: #1976d2; }
.payment-toggle-bar:focus-visible { box-shadow: inset 0 0 0 2px rgba(25, 118, 210, 0.45); }
.payment-toggle-bar.is-open {
  background: #e3f2fd;
  border-left-color: #1976d2;
  border-bottom: 1px solid #bbdefb;
}
.payment-toggle-bar.is-mobile { flex-wrap: wrap; padding: 8px 10px; margin-top: 0; border: 1px solid #e0e0e0; border-left: 4px solid #90a4ae; }
.payment-toggle-bar.is-mobile.is-open { border-left-color: #1976d2; }
.payment-toggle-main {
  display: flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
  flex: 1 1 auto;
}
.payment-toggle-chevron {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: #cfd8dc;
  color: #37474f;
  transition: transform 0.2s ease, background-color 0.15s;
  flex-shrink: 0;
}
.payment-toggle-chevron.is-open { transform: rotate(180deg); background: #1976d2; color: #fff; }
.payment-toggle-icon { color: #546e7a; flex-shrink: 0; }
.payment-toggle-label { font-weight: 700; font-size: 0.95rem; color: #263238; white-space: nowrap; }
.payment-toggle-state { font-size: 0.8rem; color: #1976d2; white-space: nowrap; }
.payment-toggle-mode { flex-shrink: 0; }
.payment-toggle-summary {
  font-size: 0.8rem;
  color: #607d8b;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  min-width: 0;
  margin-left: 4px;
}
.payment-toggle-side {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
  justify-content: flex-end;
  flex-shrink: 0;
  cursor: default;
}
.payment-toggle-bar.is-mobile .payment-toggle-side { width: 100%; justify-content: space-between; }
.payment-toggle-bar.is-mobile .payment-toggle-side > .plan-select-btn--hero { width: 100%; margin-top: 2px; }

/* ✅ [優化] 選擇方案主按鈕：加大字級與內距、動態光暈，讓它成為該列最醒目的操作 */
.plan-select-btn--hero {
  font-size: 0.95rem;
  font-weight: 700;
  letter-spacing: 1px;
  padding-inline: 20px !important;
  min-height: 40px;
  border-radius: 10px;
  box-shadow: 0 3px 10px rgba(94, 53, 177, 0.45), 0 0 0 0 rgba(216, 27, 96, 0.5);
  animation: plan-btn-pulse 2.4s ease-out infinite;
  transition: transform 0.15s, box-shadow 0.15s;
}
.plan-select-btn--hero:hover {
  transform: translateY(-1px);
  box-shadow: 0 5px 14px rgba(94, 53, 177, 0.55);
  animation: none;
}
.plan-select-btn--hero :deep(.v-btn__prepend) { margin-inline-end: 8px; }
.plan-select-btn--hero :deep(.v-icon) { font-size: 1.3rem; }
@keyframes plan-btn-pulse {
  0%   { box-shadow: 0 3px 10px rgba(94, 53, 177, 0.45), 0 0 0 0 rgba(216, 27, 96, 0.45); }
  70%  { box-shadow: 0 3px 10px rgba(94, 53, 177, 0.45), 0 0 0 10px rgba(216, 27, 96, 0); }
  100% { box-shadow: 0 3px 10px rgba(94, 53, 177, 0.45), 0 0 0 0 rgba(216, 27, 96, 0); }
}
.payment-toggle-bar.is-mobile .payment-toggle-summary { white-space: normal; }

/* Styles remain the same */
.quote-item-row { display: flex; align-items: center; width: 100%; padding: 8px 0; border-bottom: 1px solid #eee; }
.item-cell { padding: 0 8px; display: flex; align-items: center; justify-content: center; text-align: center; }
.flex-1 { flex: 1; }
.flex-2 { flex: 2; }
.flex-shrink-0 { flex-shrink: 0; }
.item-cell > .v-input { flex: none; }
.quote-item-mobile { border: 1px solid #e0e0e0; border-radius: 8px 8px 0 0; border-bottom: none; padding: 8px 12px; margin-bottom: 0; background-color: #fafafa; }
.quote-item-mobile .v-list-item { padding-left: 0; padding-right: 0; min-height: 40px; }
/* ✅ [優化] 手機版：append 區允許收縮、露臺拆分可換行，避免窄螢幕溢位 */
.quote-item-mobile :deep(.v-list-item__append) { min-width: 0; }
.quote-item-mobile .terrace-split { white-space: normal; text-align: right; }
/* ✅ [優化] 手機版配套/優付/首購選項列：自動換行、間距一致 */
.mobile-options {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 4px 16px;
  padding: 4px 0;
  min-height: 44px;
}
.highlight-dark { 
  font-weight: 600; 
  color: #c62828; 
  font-size: 1.2rem; /* ✅ 新增此行 (可依需求改為 16px, 1.5em 等) */
}

.final-price { font-size: 1.2rem; font-weight: bold; color: #1E88E5; }

/* ✅ [新增] 露臺戶表價拆分：次要層級，不與主價格搶視覺 */
.terrace-split {
  margin-top: 2px;
  font-size: 0.7rem;
  font-weight: 400;
  color: #78909c;
  line-height: 1.3;
  white-space: nowrap;
}
.terrace-split-plus {
  color: #b0bec5;
  margin: 0 1px;
}
.terrace-split-area {
  color: #b0bec5;
}
.terrace-split-tag {
  display: inline-block;
  padding: 0 4px;
  border-radius: 6px;
  background-color: #eceff1;
  color: #607d8b;
  font-size: 0.62rem;
}

/* ✅ [整合] 期款卡片內的範本選單列（總價=藍色系、配套=綠色系，與卡片標題呼應） */
.picker-row-general {
  background-color: rgba(33, 150, 243, 0.04);
}

.picker-row-package {
  background-color: rgba(76, 175, 80, 0.06);
}

.picker-row .picker-category {
  flex: 1 1 130px;
  min-width: 130px;
}

.picker-row .picker-template {
  flex: 2 1 170px;
  min-width: 170px;
}

/* 手機直疊時期款卡片改為滿版 */
.payment-col-full {
  flex-basis: auto;
  max-width: 100%;
  min-width: 0;
}

/* 期款卡片欄：約頁面 1/3 寬（不放大、不縮小），單一或雙欄皆維持窄版 */
.payment-col {
  flex: 0 0 33.333%;
  max-width: 33.333%;
  min-width: 300px;
}

/* 期款顯示樣式（項目↔金額緊鄰對齊，提升質感與易讀性） */
.payment-items-grid {
  max-height: 640px;
  overflow-y: auto;
  padding: 2px 0;
}

.payment-item {
  display: flex;
  align-items: baseline;
  gap: 12px;
  padding: 7px 12px;
  border-bottom: 1px solid #f2f2f2;
  transition: background-color 0.12s ease;
}

.payment-item:last-child {
  border-bottom: none;
}

/* hover 維持黃色 */
.payment-item:hover {
  background-color: yellow;
}

/* 名稱：固定欄寬 → 金額緊鄰其後且跨列對齊（不再被頂到最右） */
.payment-name {
  flex: 0 0 14em;
  box-sizing: border-box; /* 子項 padding 不撐寬 → 金額欄跨父子對齊 */
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 6px;
  text-align: left;
  color: #37474f;
  min-width: 0;
}

/* 引導線已不需要（項目與金額已緊鄰），隱藏 */
.payment-leader {
  display: none;
}

/* 金額：緊接名稱欄、靠右對齊成欄 */
.payment-amount {
  flex: 0 0 auto;
  min-width: 5.5em;
  text-align: right;
  white-space: nowrap;
  color: #1976d2;
  font-weight: 700;
}

.payment-amount-num {
  font-variant-numeric: tabular-nums;
  font-size: 1.02rem;
  letter-spacing: 0.2px;
}

.payment-amount-unit {
  margin-left: 2px;
  font-size: 0.78rem;
  font-weight: 600;
  color: #607d8b;
}

/* 父層級：左側強調邊與淡底色 */
.payment-parent {
  background-color: rgba(33, 150, 243, 0.06);
  box-shadow: inset 3px 0 0 #1976d2; /* 改 inset 陰影：不佔版面，金額欄不位移 */
}

.payment-parent .payment-name {
  font-weight: 700;
  color: #1565c0;
}

/* 子層級：縮排套在名稱（不位移整列，金額欄維持對齊）、弱化 */
.payment-child .payment-name {
  padding-left: 14px;
  color: #78909c;
  font-size: 0.92em;
}

.payment-child .payment-amount {
  color: #546e7a;
  font-weight: 600;
}

/* 總價列：置於最後，紅色明顯易讀 */
.payment-total {
  border-top: 2px solid #ef9a9a;
  background-color: #fff5f5;
  margin-top: 2px;
}

.payment-total .payment-name {
  font-weight: 800;
  color: #c62828;
  font-size: 1.02rem;
}

.payment-total .payment-amount {
  color: #c62828;
}

.payment-total .payment-amount-num {
  font-size: 1.25rem;
  font-weight: 800;
}

.payment-total .payment-amount-unit {
  color: #c62828;
  font-weight: 700;
}

/* 條件值提示標籤樣式 */
.payment-hint {
  opacity: 0.85;
  font-size: 0.7rem;
  height: 20px !important;
  vertical-align: middle;
}

/* 公司借貸攤還表（✅ 加 overflow-x：手機 5 欄數字可橫向捲動不溢位） */
.loan-table-wrap {
  max-height: 320px;
  overflow-y: auto;
  overflow-x: auto;
  border: 1px solid rgba(0, 0, 0, 0.08);
  border-radius: 4px;
}

/* ✅ [優化] 窄螢幕：期款明細名稱欄由固定 14em 改為彈性收縮，金額靠右，不再水平溢位 */
@media (max-width: 600px) {
  .payment-item {
    gap: 8px;
    padding: 6px 8px;
    flex-wrap: wrap;
  }
  .payment-name {
    flex: 1 1 55%;
  }
  .payment-amount {
    margin-left: auto;
  }
  .payment-items-grid {
    max-height: 420px;
  }
  .loan-param-note {
    flex-basis: 100%;
  }
}

.loan-table thead th {
  background: rgba(121, 85, 72, 0.08);
  white-space: nowrap;
  position: sticky;
  top: 0;
  z-index: 1;
}

.loan-total-row td {
  border-top: 2px solid rgba(121, 85, 72, 0.4);
  background: rgba(121, 85, 72, 0.05);
}

/* ✅ [新增] 議價調整視窗：頂部總覽帶／欄位群組／「或」分隔線／預覽數字對齊 */
.neg-summary {
  background: rgba(var(--v-theme-primary), 0.06);
  border: 1px solid rgba(var(--v-theme-primary), 0.22);
}

.neg-field-group {
  background: #fafafa;
  border: 1px solid #e0e0e0;
}

.neg-or-divider {
  display: flex;
  align-items: center;
  color: #9e9e9e;
  font-size: 12px;
}

.neg-or-divider::before,
.neg-or-divider::after {
  content: '';
  flex: 1;
  border-top: 1px dashed #bdbdbd;
}

.neg-or-divider span {
  padding: 0 10px;
}

/* 預覽金額用等寬數字，跨列右緣對齊更易讀 */
.neg-preview :deep(strong),
.neg-preview {
  font-variant-numeric: tabular-nums;
}
</style>