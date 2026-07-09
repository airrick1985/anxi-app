<template>
  <div>
    <div v-if="isMobile" class="quote-item-mobile">
      <div class="d-flex justify-space-between align-center mb-2">
       <span class="text-h6 font-weight-bold text-primary">{{ item.unitId }}</span>
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
    <v-list-item class="pl-0"><v-list-item-title>房屋總價</v-list-item-title><template v-slot:append><div class="d-flex align-center gap-2"><strong class="highlight-dark">{{ displayHousePrice }} 萬</strong><v-chip v-if="hasNegotiation" size="x-small" :color="negotiationDelta < 0 ? 'success' : 'error'" class="ml-1">{{ negotiationDelta > 0 ? '+' : '' }}{{ negotiationDelta }} 萬</v-chip><v-btn icon="mdi-percent" size="x-small" variant="text" color="primary" @click="openNegotiationDialog" title="議價調整"></v-btn><v-btn v-if="hasNegotiation" icon="mdi-restore" size="x-small" variant="text" color="warning" @click="resetNegotiation" title="恢復原始價格"></v-btn></div></template></v-list-item>
    <v-list-item class="pl-0"><v-list-item-title>房屋單價</v-list-item-title><template v-slot:append><strong>{{ displayUnitPrice }} 萬/坪</strong></template></v-list-item>
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
           <td class="text-right">{{ formatNumber(item.unitDetails.area_house_ping) }} 坪</td>
          </tr>
          <tr v-for="(detail, i) in areaDetails" :key="i">
           <td class="text-grey-darken-1">{{ detail.label }}</td>
           <td class="text-right">
            {{ detail.isPercentage ? formatPercentage(detail.value) : `${formatNumber(detail.value)} ${detail.unit}` }}
           </td>
          </tr>
         </tbody>
        </v-table>
       </v-card>
      </v-menu>
     </template>
    </v-list-item>

    <v-divider class="my-2"></v-divider>
    <v-list-item class="pl-0"><v-list-item-title>車位</v-list-item-title><template v-slot:append><v-btn size="small" variant="tonal" @click="openParkingModal">{{ parkingDisplayText }}</v-btn></template></v-list-item>
    <v-list-item class="pl-0"><v-list-item-title>車位價格</v-list-item-title><template v-slot:append><strong class="highlight-dark">{{ formattedParkingPrice }}</strong></template></v-list-item>
    <v-divider class="my-2"></v-divider>
    
    <v-list-item class="pl-0">
     <template v-if="showPackageDeal" v-slot:prepend>
    <v-switch
            class="mr-4"
            v-model="usePackageDealModel"
            label="配套"
            color="primary"
            hide-details
            inset
            :disabled="!isPackageDealAllowed"
            :title="packageDisabledHint"
        ></v-switch>
     </template>

     <v-checkbox
        v-if="showPreferredPaymentOption"
        v-model="usePreferredPaymentModel"
        label="優付"
        
        color="black"
        hide-details
        class="mr-4"
        :disabled="!isPreferredPaymentEligible"
     ></v-checkbox>


     <div class="d-flex align-center" style="gap: 10px;">
       <span class="text-body-2">首購:</span>
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
    </v-list-item>
    
    <v-divider class="my-2"></v-divider>
    <v-list-item v-if="showPackageDeal" class="pl-0"><v-list-item-title>配套價</v-list-item-title><template v-slot:append><strong class="final-price">{{ packagePrice.toLocaleString() }} 萬</strong></template></v-list-item>
    <v-list-item class="pl-0"><v-list-item-title class="font-weight-bold">總價</v-list-item-title><template v-slot:append><strong class="final-price">{{ finalTotalPrice.toLocaleString() }} 萬</strong></template></v-list-item>
   </v-list>
   <v-btn block @click="isPaymentDetailsVisible = !isPaymentDetailsVisible" :append-icon="isPaymentDetailsVisible ? 'mdi-chevron-up' : 'mdi-chevron-down'" class="mt-2" size="small">
    付款方式
   </v-btn>
    </div>

    <div v-else class="quote-item-row">
      <div class="item-cell flex-1 text-h6 font-weight-bold text-primary">{{ item.unitId }}</div>
   
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
         <td class="text-right">{{ formatNumber(item.unitDetails.area_house_ping) }} 坪</td>
        </tr>
        <tr v-for="(detail, i) in areaDetails" :key="i">
         <td class="text-grey-darken-1">{{ detail.label }}</td>
         <td class="text-right">
          {{ detail.isPercentage ? formatPercentage(detail.value) : `${formatNumber(detail.value)} ${detail.unit}` }}
         </td>
        </tr>
       </tbody>
      </v-table>
     </v-card>
    </v-menu>
   </div>

   <div class="item-cell flex-1 highlight-dark">
    <div class="d-flex align-center justify-center gap-2">
      <span>{{ displayHousePrice }} 萬</span>
      <v-chip v-if="hasNegotiation" size="x-small" :color="negotiationDelta < 0 ? 'success' : 'error'">{{ negotiationDelta > 0 ? '+' : '' }}{{ negotiationDelta }} 萬</v-chip>
      <v-btn icon="mdi-percent" size="x-small" variant="text" color="primary" @click="openNegotiationDialog" title="議價調整"></v-btn>
      <v-btn v-if="hasNegotiation" icon="mdi-restore" size="x-small" variant="text" color="warning" @click="resetNegotiation" title="恢復原始價格"></v-btn>
    </div>
   </div>
   <div class="item-cell flex-1">{{ displayUnitPrice }} 萬/坪</div>
   <div class="item-cell flex-2"><v-btn variant="tonal" @click="openParkingModal">{{ parkingDisplayText }}</v-btn></div>
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

   <div class="item-cell flex-1">
    <v-btn @click="isPaymentDetailsVisible = !isPaymentDetailsVisible" size="small" :append-icon="isPaymentDetailsVisible ? 'mdi-chevron-up' : 'mdi-chevron-down'">
     付款方式
    </v-btn>
   </div>
   <div class="item-cell flex-shrink-0">
    <v-btn color="red" variant="flat" size="small" @click="emit('remove')">移除本戶</v-btn>
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

    <!-- ✅ [新增] 議價調整對話框 -->
    <v-dialog v-model="isNegotiationDialogVisible" max-width="500">
      <v-card>
        <v-card-title class="bg-primary text-white d-flex align-center gap-2">
          <v-icon>mdi-percent</v-icon>
          議價調整 - {{ item.unitId }}
        </v-card-title>

        <v-card-text class="pt-6">
          <div class="mb-6">
            <div class="text-caption text-grey-darken-1 mb-2">目前房屋總價</div>
            <div class="text-h5 font-weight-bold text-primary">{{ displayHousePrice }} 萬元</div>
            <div class="text-caption text-grey">房屋總面積: {{ formatNumber(item.unitDetails.area_house_ping, 2) }} 坪</div>
          </div>

          <v-divider class="my-4"></v-divider>

          <!-- ✅ [優化] 調整方式：並排兩個欄位，各自獨立保存 -->
          <div class="mb-6">
            <div class="text-subtitle-2 font-weight-bold mb-4">調整方式</div>

            <!-- 第一欄：每坪調整 -->
            <div class="mb-4">
              <label class="text-caption text-grey-darken-1 d-block mb-2">每坪調整 (萬/坪)</label>
              <v-text-field
                v-model="negotiationPerTsuboValue"
                type="number"
                suffix="萬/坪"
                placeholder="例如: -1.5 (減) 或 +0.5 (加)"
                variant="outlined"
                density="compact"
                hint="輸入負數表示每坪減少"
                persistent-hint
                @update:model-value="calculateNegotiatedPrice"
              ></v-text-field>
            </div>

            <!-- 第二欄：直接調整 -->
            <div class="mb-4">
              <label class="text-caption text-grey-darken-1 d-block mb-2">直接調整總價 (萬)</label>
              <v-text-field
                v-model="negotiationDirectAmountValue"
                type="number"
                suffix="萬"
                placeholder="例如: -15 (減) 或 +10 (加)"
                variant="outlined"
                density="compact"
                hint="輸入負數表示總價減少"
                persistent-hint
                @update:model-value="calculateNegotiatedPrice"
              ></v-text-field>
            </div>
          </div>

          <v-divider class="my-4"></v-divider>

          <!-- ✅ [優化] 預覽結果 - 分別顯示兩種調整的明細 -->
          <div class="mb-4">
            <div class="text-subtitle-2 font-weight-bold mb-3">調整預覽</div>
            <v-card variant="outlined" class="pa-4 bg-grey-lighten-5">
              <!-- 原房屋總價 -->
              <div class="d-flex justify-space-between align-center mb-3">
                <span class="text-grey-darken-2">原房屋總價</span>
                <span class="font-weight-bold">{{ quoteStore.getRawDisplayHousePrice(props.item.internalId) }} 萬</span>
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
              <div v-if="negotiationDirectAmountValue !== ''" class="d-flex justify-space-between align-center mb-3">
                <span class="text-grey-darken-2">直接調整</span>
                <span :class="Number(negotiationDirectAmountValue) > 0 ? 'text-error font-weight-bold' : 'text-success font-weight-bold'">
                  {{ Number(negotiationDirectAmountValue) > 0 ? '+' : '' }}{{ negotiationDirectAmountValue }} 萬
                </span>
              </div>

              <!-- 分隔線 (若有任一調整) -->
              <div v-if="negotiationPerTsuboValue !== '' || negotiationDirectAmountValue !== ''">
                <v-divider class="my-2"></v-divider>
              </div>

              <!-- 調整合計 -->
              <div class="d-flex justify-space-between align-center mb-3">
                <span class="text-grey-darken-2 font-weight-bold">調整合計</span>
                <span :class="(negotiatedPrice - quoteStore.getRawDisplayHousePrice(props.item.internalId)) > 0 ? 'text-error font-weight-bold' : 'text-success font-weight-bold'">
                  {{ (negotiatedPrice - quoteStore.getRawDisplayHousePrice(props.item.internalId)) > 0 ? '+' : '' }}{{ negotiatedPrice - quoteStore.getRawDisplayHousePrice(props.item.internalId) }} 萬
                </span>
              </div>
              <v-divider class="my-2"></v-divider>

              <!-- 新房屋總價 -->
              <div class="d-flex justify-space-between align-center">
                <span class="text-h6 font-weight-bold">新房屋總價</span>
                <span class="text-h5 font-weight-bold text-primary">{{ negotiatedPrice }} 萬</span>
              </div>
            </v-card>
          </div>
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
    </div>
</template>

<script setup>
import { ref, computed, defineProps, defineEmits, onMounted, watch } from 'vue'; // ★★★ 1. 引入 watch ★★★
import { useQuoteStore } from '@/store/quoteStore';
import { useDisplay } from 'vuetify';
import PaymentDetails from './PaymentDetails.vue';
import ParkingEditModal from './ParkingEditModal.vue';
import { useProjectStore } from '@/store/projectStore';

const props = defineProps({
  item: { type: Object, required: true },
  paymentTermsData: { type: Array, default: () => [] }, // 保留向後相容性
  packageTermsData: { type: Array, default: () => [] }, // 保留向後相容性
  paymentTemplates: { type: Array, default: () => [] }, // 新增：Firestore 期款範本
  showPackageDeal: { type: Boolean, default: true },
  isLoading: { type: Boolean, default: false },
  allParkingData: { type: Array, default: () => [] },
  projectId: { type: String, required: true } // ✓ 新增：接收 projectId
});

const emit = defineEmits(['remove', 'request-open-slide']);
const quoteStore = useQuoteStore();
const projectStore = useProjectStore();
const { mobile } = useDisplay();
const isMobile = computed(() => mobile.value);
const isPaymentDetailsVisible = ref(false);

// 車位選擇相關狀態
const isParkingModalOpen = ref(false);

// ✅ [新增] 議價調整相關狀態
const isNegotiationDialogVisible = ref(false);
const negotiationPerTsuboValue = ref('');    // 每坪調整值
const negotiationDirectAmountValue = ref(''); // 直接調整值
const negotiationActiveMode = ref('');       // '' | 'perTsubo' | 'directAmount'
const negotiatedPrice = ref(0);

// ★★★ 2. 新增：支援項目名稱引用的新計算引擎 ★★★

/**
 * 新的公式計算引擎，支援項目名稱引用
 * @param {Array} templateItems - 期款範本項目列表
 * @param {number} baseValue - 基礎金額（總價或配套價）
 * @param {string} baseVariable - 基礎變數名稱（"總價" 或 "配套金額"）
 * @returns {Object} 計算結果 { itemName: calculatedValue }
 */
function runNewCalculationEngine(templateItems, baseValue, baseVariable) {
    if (!templateItems || templateItems.length === 0 || !baseValue) {
        return {};
    }

    const results = {};
    const calculations = {};
    
    // 設定基本變數
    calculations[baseVariable] = baseValue;
    
    console.log('開始計算引擎:', {
        baseVariable,
        baseValue,
        項目數量: templateItems.length,
        項目名稱: templateItems.map(item => item.name)
    });
    
    // 分析項目依賴關係
    const analyzeDependencies = (items) => {
        const dependencies = new Map();
        items.forEach(item => {
            const deps = [];
            // 簡單的依賴分析：檢查公式中是否包含其他項目的名稱
            items.forEach(otherItem => {
                if (item.id !== otherItem.id && item.formula.includes(otherItem.name)) {
                    deps.push(otherItem.id);
                }
            });
            dependencies.set(item.id, deps);
        });
        return dependencies;
    };
    
    const dependencies = analyzeDependencies(templateItems);
    console.log('項目依賴關係:', Object.fromEntries(dependencies));
    
    // 處理所有項目（按依賴順序）
    const processedItems = new Set();
    let maxIterations = templateItems.length * 5; // 增加最大迭代次數
    
    while (processedItems.size < templateItems.length && maxIterations > 0) {
        maxIterations--;
        let progressMade = false;
        
        // 優先處理沒有依賴或依賴已滿足的項目
        const sortedItems = templateItems.slice().sort((a, b) => {
            const aDeps = dependencies.get(a.id) || [];
            const bDeps = dependencies.get(b.id) || [];
            const aUnmetDeps = aDeps.filter(dep => !processedItems.has(dep)).length;
            const bUnmetDeps = bDeps.filter(dep => !processedItems.has(dep)).length;
            return aUnmetDeps - bUnmetDeps;
        });
        
        for (const item of sortedItems) {
            if (processedItems.has(item.id)) continue;
            
            try {
                console.log(`嘗試計算項目: "${item.name}", 公式: "${item.formula}"`);
                console.log('當前可用變數:', Object.keys(calculations));
                
                // 檢查是否所有依賴都已滿足
                const itemDeps = dependencies.get(item.id) || [];
                const unmetDeps = itemDeps.filter(dep => {
                    const depItem = templateItems.find(t => t.id === dep);
                    return depItem && !calculations.hasOwnProperty(depItem.name);
                });
                
                if (unmetDeps.length > 0) {
                    console.log(`項目 "${item.name}" 還有未滿足的依賴，跳過此輪`);
                    continue;
                }
                
                // 嘗試計算這個項目
                const result = evaluateFormula(item.formula, calculations);
                
                // 應用四捨五入規則
                const roundedResult = applyNewRounding(
                    result, 
                    item.roundingMethod, 
                    item.roundingValue || 0
                );
                
                // 儲存結果
                calculations[item.name] = roundedResult;
                results[item.name] = {
                    id: item.id,
                    name: item.name,
                    value: roundedResult,
                    formula: item.formula,
                    parentId: item.parentId
                };
                
                console.log(`項目 "${item.name}" 計算成功: ${roundedResult}`);
                processedItems.add(item.id);
                progressMade = true;
                
            } catch (error) {
                console.log(`項目 "${item.name}" 計算失敗: ${error.message}`);
                // 如果計算失敗，嘗試使用默認值或跳過
                if (error.message.includes('未替換的字符')) {
                    console.warn(`項目 "${item.name}" 包含無法解析的引用，使用默認值 0`);
                    calculations[item.name] = 0;
                    results[item.name] = {
                        id: item.id,
                        name: item.name,
                        value: 0,
                        formula: item.formula,
                        parentId: item.parentId,
                        error: true
                    };
                    processedItems.add(item.id);
                    progressMade = true;
                }
                continue;
            }
        }
        
        if (!progressMade) {
            console.warn('計算引擎沒有進展，可能存在循環依賴或無法解析的公式');
            const unprocessedItems = templateItems.filter(item => !processedItems.has(item.id));
            console.warn('未處理的項目:', unprocessedItems.map(item => ({ 
                name: item.name, 
                formula: item.formula,
                dependencies: dependencies.get(item.id) || []
            })));
            
            // 對於無法處理的項目，設置為 0
            unprocessedItems.forEach(item => {
                calculations[item.name] = 0;
                results[item.name] = {
                    id: item.id,
                    name: item.name,
                    value: 0,
                    formula: item.formula,
                    parentId: item.parentId,
                    error: true
                };
                processedItems.add(item.id);
            });
            break;
        }
    }
    
    console.log('計算引擎完成:', {
        處理項目數: processedItems.size,
        總項目數: templateItems.length,
        最終結果: results
    });
    
    return results;
}

/**
 * 公式計算函數，支援項目名稱引用
 * @param {string} formula - 公式字串
 * @param {Object} variables - 可用變數 { 變數名: 值 }
 * @returns {number} 計算結果
 */
function evaluateFormula(formula, variables) {
    let expression = String(formula).trim();
    
    // 如果是純數字，直接返回
    if (/^\d+(\.\d+)?$/.test(expression)) {
        return parseFloat(expression);
    }
    
    // 處理百分比 (例如: "5%" -> "(5/100)")
    expression = expression.replace(/(\d+(?:\.\d+)?)%/g, '($1/100)');
    
    // 創建名稱映射表：將舊格式轉換為可能的新格式
    const createNameMapping = (availableVars) => {
        const mapping = {};
        const chineseNumbers = ['一', '二', '三', '四', '五', '六', '七', '八', '九', '十', 
                               '十一', '十二', '十三', '十四', '十五', '十六', '十七', '十八', '十九', '二十'];
        
        // 為每個可用變數創建可能的舊格式映射
        availableVars.forEach(varName => {
            // 如果變數名稱以中文數字開頭，創建對應的阿拉伯數字格式
            chineseNumbers.forEach((chineseNum, index) => {
                const arabicNum = index + 1;
                
                // 處理 "一、" -> "1." 的映射
                if (varName.startsWith(chineseNum + '、')) {
                    const remainder = varName.substring(chineseNum.length + 1);
                    mapping[`${arabicNum}.${remainder}`] = varName;
                }
                
                // 處理 "一" -> "1." 的映射（如果沒有頓號）
                if (varName.startsWith(chineseNum) && !varName.includes('、')) {
                    const remainder = varName.substring(chineseNum.length);
                    mapping[`${arabicNum}.${remainder}`] = varName;
                }
            });
        });
        
        return mapping;
    };
    
    const nameMapping = createNameMapping(Object.keys(variables));
    
    console.log('開始替換變數:', { 
        原始公式: formula, 
        可用變數: Object.keys(variables),
        名稱映射: nameMapping,
        變數值: variables
    });
    
    // 改進的分詞策略：考慮中文字符和標點符號
    const operators = ['+', '-', '*', '/', '(', ')'];
    let tokens = [];
    let currentToken = '';
    
    // 將公式分解為標記（tokens）
    for (let i = 0; i < expression.length; i++) {
        const char = expression[i];
        if (operators.includes(char)) {
            if (currentToken.trim()) {
                tokens.push(currentToken.trim());
                currentToken = '';
            }
            tokens.push(char);
        } else {
            currentToken += char;
        }
    }
    
    // 添加最後一個標記
    if (currentToken.trim()) {
        tokens.push(currentToken.trim());
    }
    
    console.log('分詞結果:', tokens);
    
    // 排序變數名稱，從長到短，避免短變數名被包含在長變數名中
    const sortedVariableNames = Object.keys(variables).sort((a, b) => b.length - a.length);
    
    // 替換變數標記
    for (let i = 0; i < tokens.length; i++) {
        const token = tokens[i];
        
        // 跳過運算符
        if (operators.includes(token)) {
            continue;
        }
        
        // 如果是數字，跳過
        if (/^\d+(\.\d+)?$/.test(token)) {
            continue;
        }
        
        // 檢查是否為變數名（使用排序後的變數名稱列表）
        let replaced = false;
        
        // 首先檢查直接匹配
        for (const variableName of sortedVariableNames) {
            if (token === variableName) {
                const value = variables[variableName];
                tokens[i] = `(${value})`;
                console.log(`直接替換變數 "${variableName}" -> ${value}`);
                replaced = true;
                break;
            }
        }
        
        // 如果直接匹配失敗，檢查名稱映射
        if (!replaced && nameMapping[token]) {
            const mappedName = nameMapping[token];
            if (variables.hasOwnProperty(mappedName)) {
                const value = variables[mappedName];
                tokens[i] = `(${value})`;
                console.log(`通過映射替換變數 "${token}" -> "${mappedName}" -> ${value}`);
                replaced = true;
            }
        }
        
        if (!replaced) {
            console.warn(`找不到變數: "${token}"`);
            console.warn(`可用的變數名:`, Object.keys(variables));
            console.warn(`可用的映射:`, nameMapping);
            // 對於找不到的變數，先設為 0，讓公式能夠繼續執行
            tokens[i] = '(0)';
            console.warn(`將未找到的變數 "${token}" 暫時設為 0`);
        }
    }
    
    // 重新組合表達式
    expression = tokens.join('');
    console.log('變數替換完成:', expression);
    
    // 安全計算數學表達式
    try {
        // 檢查表達式是否只包含安全字符
        if (!/^[0-9+\-*/().%\s]+$/.test(expression)) {
            // 如果還有未替換的字符，記錄詳細信息
            const remainingChars = expression.match(/[^0-9+\-*/().%\s]+/g);
            if (remainingChars && remainingChars.length > 0) {
                console.warn('發現未替換的字符:', remainingChars);
                console.warn('詳細調試信息:', {
                    原始公式: formula,
                    可用變數: Object.keys(variables),
                    變數值: variables,
                    分詞結果: tokens,
                    最終表達式: expression
                });
                // 不再拋出錯誤，而是返回 0 作為默認值
                console.warn(`由於包含未替換字符，公式 "${formula}" 返回默認值 0`);
                return 0;
            }
        }
        
        // 執行計算
        const result = Function('"use strict"; return (' + expression + ')')();
        
        // 檢查結果是否有效
        if (isNaN(result) || !isFinite(result)) {
            throw new Error(`計算結果無效: ${result}`);
        }
        
        console.log(`計算成功: ${formula} = ${result}`);
        return result;
    } catch (error) {
        console.error(`公式計算詳細錯誤:`, {
            原始公式: formula,
            處理後表達式: expression,
            分詞結果: tokens,
            可用變數: variables,
            排序後變數名: sortedVariableNames,
            錯誤訊息: error.message
        });
        throw new Error(`公式計算錯誤: ${formula} -> ${expression}: ${error.message}`);
    }
}

/**
 * 新的四捨五入規則應用
 * @param {number} value - 原始值
 * @param {string} method - 四捨五入方法
 * @param {number} roundingValue - 四捨五入精度
 * @returns {number} 四捨五入後的值
 */
function applyNewRounding(value, method, roundingValue) {
    if (!method || method === '') return Math.round(value);
    
    const precision = roundingValue || 1;
    
    switch (method) {
        case '四捨五入':
            return Math.round(value / precision) * precision;
        case '無條件進位':
            return Math.ceil(value / precision) * precision;
        case '無條件捨去':
            return Math.floor(value / precision) * precision;
        default:
            return Math.round(value);
    }
}

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
    quoteStore.updateUnitField(props.item.internalId, 'usePackageDeal', value);
  }
});

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

  return notes;
});

// ✅ [新增] 同步「套用期款時的說明」回 Pinia Store
watch(appliedPaymentNotes, (notes) => {
  quoteStore.updateItemPaymentNotes(props.item.internalId, notes);
}, {
  immediate: true,
  deep: true
});

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

    return {
        general: buildBlock(generalPaymentCalculation.value),
        generalIsPreferred: isGeneralUsingPreferred.value, // true 時列印標題用「優付期款」
        package: buildBlock(packagePaymentCalculation.value),
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

// ✅ [新增] 判斷是否有議價調整
const hasNegotiation = computed(() => {
  const state = props.item.negotiationState;
  return state?.originalPrice !== null && state?.originalPrice !== undefined;
});

// ✅ [新增] 計算調整差額：當前價格 - 原始價格
const negotiationDelta = computed(() => {
  if (!hasNegotiation.value) return 0;
  const current = quoteStore.getRawDisplayHousePrice(props.item.internalId);
  return current - (props.item.negotiationState?.originalPrice ?? current);
});

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
  const areaItems = [
    { label: '主建物(室內)', value: details.area_main_ping, unit: '坪' },
    { label: '附屬建物(陽台)', value: details.area_ancillary_ping, unit: '坪' },
    { label: '共用部分(公設)', value: details.area_common_ping, unit: '坪' },
    { label: '露臺(不計坪)', value: details.area_terrace_ping, unit: '坪' },
    { label: '公設比', value: details.common_area_ratio, unit: '%', isPercentage: true }
  ];
  return areaItems.filter(item => item.value !== null && item.value !== undefined && item.value !== '');
});

function formatPercentage(value) {
  const num = parseFloat(value);
  return isNaN(num) ? 'N/A' : `${(num * 100).toFixed(2)} %`;
}

// 車位選擇處理方法
function handleParkingUpdate(updatedParkingList) {
  quoteStore.updateParking(props.item.internalId, updatedParkingList);
  isParkingModalOpen.value = false;
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
  negotiationActiveMode.value = savedState?.activeMode || '';

  // 使用 getRawDisplayHousePrice 獲取未格式化的原始價格
  const rawPrice = quoteStore.getRawDisplayHousePrice(props.item.internalId);
  negotiatedPrice.value = rawPrice;

  // 若有暫存數值，重新計算預覽
  if (negotiationPerTsuboValue.value || negotiationDirectAmountValue.value) {
    calculateNegotiatedPrice();
  }

  isNegotiationDialogVisible.value = true;
}

function calculateNegotiatedPrice() {
  const currentPrice = quoteStore.getRawDisplayHousePrice(props.item.internalId);
  const area = Number(props.item.unitDetails.area_house_ping) || 0;
  const hasPerTsuboValue = negotiationPerTsuboValue.value !== '';
  const hasDirectAmountValue = negotiationDirectAmountValue.value !== '';

  // ✅ [優化] 兩欄位都空 → 顯示原始價格（恢復狀態）
  if (!hasPerTsuboValue && !hasDirectAmountValue) {
    const originalPrice = props.item.negotiationState?.originalPrice;
    negotiatedPrice.value = (originalPrice !== null && originalPrice !== undefined)
      ? Math.round(originalPrice)
      : Math.round(currentPrice);
    return;
  }

  // 兩種方式並存、累加計算
  // 每坪調整
  const perTsuboAdj = hasPerTsuboValue
    ? Math.round((Number(negotiationPerTsuboValue.value) || 0) * area)
    : 0;

  // 直接調整
  const directAdj = hasDirectAmountValue
    ? Math.round(Number(negotiationDirectAmountValue.value) || 0)
    : 0;

  // 合計調整 = 每坪 + 直接（並存累加）
  const totalAdjustment = perTsuboAdj + directAdj;
  negotiatedPrice.value = Math.round(currentPrice + totalAdjustment);
}

function saveNegotiatedPrice() {
  const hasDirectAmount = negotiationDirectAmountValue.value !== '';
  const hasPerTsubo = negotiationPerTsuboValue.value !== '';

  // ✅ [新增] 兩欄位都空 → 視同取消調整，恢復原始價格
  if (!hasDirectAmount && !hasPerTsubo) {
    quoteStore.resetNegotiationPrice(props.item.internalId);
    isNegotiationDialogVisible.value = false;
    return;
  }

  // 使用 getRawDisplayHousePrice 獲取未格式化的原始價格
  const currentPrice = quoteStore.getRawDisplayHousePrice(props.item.internalId);
  const newPrice = negotiatedPrice.value;
  const priceDifference = newPrice - currentPrice;

  // 如果是加價，要求確認
  if (priceDifference > 0) {
    const confirmed = confirm(
      `此操作將加價 ${priceDifference} 萬元，\n原價: ${currentPrice} 萬 → 新價: ${newPrice} 萬\n\n確定要加價嗎？`
    );
    if (!confirmed) {
      return;
    }
  }

  // 首次調整時記錄原始價格
  const existingState = props.item.negotiationState;
  const originalPrice = existingState?.originalPrice ?? currentPrice;

  // 保存新價格
  quoteStore.updateHousePrice(props.item.internalId, newPrice);

  // 保存調整狀態：原始價格、調整方式、兩個調整值
  // activeMode: 'perTsubo' | 'directAmount' | 'both' | ''
  const activeMode = (hasPerTsubo && hasDirectAmount) ? 'both'
    : hasDirectAmount ? 'directAmount'
    : hasPerTsubo ? 'perTsubo' : '';

  quoteStore.updateNegotiationState(props.item.internalId, {
    originalPrice,
    activeMode,
    perTsuboValue: negotiationPerTsuboValue.value,
    directAmountValue: negotiationDirectAmountValue.value
  });

  isNegotiationDialogVisible.value = false;
}

// ✅ [新增] 重置議價調整：恢復原始價格並清除調整狀態
function resetNegotiation() {
  quoteStore.resetNegotiationPrice(props.item.internalId);
}

// ✅ [新增] 監聽 Modal 關閉：若兩欄位都空，自動清空調整狀態（不需按確認）
watch(isNegotiationDialogVisible, (isVisible) => {
  if (!isVisible && negotiationPerTsuboValue.value === '' && negotiationDirectAmountValue.value === '') {
    // Modal 關閉且兩欄位都空 → 清空調整狀態
    quoteStore.resetNegotiationPrice(props.item.internalId);
  }
});
</script>

<style scoped>
/* Styles remain the same */
.quote-item-row { display: flex; align-items: center; width: 100%; padding: 8px 0; border-bottom: 1px solid #eee; }
.item-cell { padding: 0 8px; display: flex; align-items: center; justify-content: center; text-align: center; }
.flex-1 { flex: 1; }
.flex-2 { flex: 2; }
.flex-shrink-0 { flex-shrink: 0; }
.item-cell > .v-input { flex: none; }
.quote-item-mobile { border: 1px solid #e0e0e0; border-radius: 8px; padding: 8px 12px; margin-bottom: 16px; background-color: #fafafa; }
.quote-item-mobile .v-list-item { padding-left: 0; padding-right: 0; min-height: 40px; }
.highlight-dark { 
  font-weight: 600; 
  color: #c62828; 
  font-size: 1.2rem; /* ✅ 新增此行 (可依需求改為 16px, 1.5em 等) */
}

.final-price { font-size: 1.2rem; font-weight: bold; color: #1E88E5; }

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
</style>