<template>
  <div class="pa-2" :class="{ 'mb-8': isMobile, 'single-section': shownSections.length === 1 }">
    <v-form>
       <v-row>
        <v-col cols="12" :md="sectionColMd" v-show="isSectionShown('sales')">
          <div class="info-section">
            <div class="section-title"><v-icon>mdi-information-outline</v-icon>銷售資訊</div>
            <v-select 
              label="後台狀態" 
              :items="statusOptions" 
              v-model="editableData.salesStatus_backend" 
              class="mb-4" 
              clearable 
            ></v-select>

            <v-text-field
              label="銷售狀態"
              v-model="editableData.salesStatus_quote"
              class="mb-4"
              readonly
              
             
              hint="如要取消「已售」，請取消後台狀態"
              persistent-hint
            ></v-text-field>
            
            <v-select
              label="銷售人員"
              :items="personnelOptions"
              v-model="salespersonList"
              class="mb-4"
              item-title="name"
              item-value="name"
              multiple
              chips
              closable-chips
              clearable
              hint="可複選多位銷售人員"
              persistent-hint
            ></v-select>

            <label class="v-label text-caption">小訂日期</label>
            <VueDatePicker :locale="'zh-TW'" v-model="editableData.payment_deposit_date" auto-apply :enable-time-picker="false" format="yyyy/MM/dd" teleport="body" auto-position class="mb-4 anxi-datepicker"></VueDatePicker>
            <label class="v-label text-caption">補足日期</label>
            <VueDatePicker :locale="'zh-TW'" v-model="editableData.payment_complete_date" auto-apply :enable-time-picker="false" format="yyyy/MM/dd" teleport="body" auto-position class="mb-4 anxi-datepicker"></VueDatePicker>
            <label class="v-label text-caption">簽約日期</label>
            <VueDatePicker :locale="'zh-TW'" v-model="editableData.payment_contract_date" auto-apply :enable-time-picker="false" format="yyyy/MM/dd" teleport="body" auto-position class="mb-4 anxi-datepicker"></VueDatePicker>
            <v-alert type="info" variant="tonal" density="compact" class="text-caption">
              備註已改為留言功能，請於戶別詳情「銷售資訊」區塊直接新增／編輯備註留言。
            </v-alert>
          </div>
        </v-col>

        <v-col cols="12" :md="sectionColMd" v-show="isSectionShown('deal')">
          <div class="info-section">
            <div class="section-title"><v-icon>mdi-currency-usd</v-icon>成交資訊</div>
            <!-- 合約方式 -->
            <div class="field-block mb-4">
              <div class="field-label">
                <v-icon size="18" color="indigo-darken-1">mdi-file-sign</v-icon>
                <span>合約方式</span>
              </div>
              <v-chip-group
                v-model="editableData.contractType"
                selected-class="contract-chip--active"
                column
              >
                <v-chip
                  v-for="opt in localContractOptions"
                  :key="opt"
                  :value="opt"
                  filter
                  variant="outlined"
                  class="contract-chip"
                >
                  {{ opt }}
                </v-chip>
              </v-chip-group>
              <div
                v-if="!localContractOptions || localContractOptions.length === 0"
                class="text-caption text-grey-darken-1"
              >
                尚無合約方式選項
              </div>
            </div>

            <!-- 是否首購（✅ [調整] 與「合約方式」統一為 chip 樣式） -->
            <div class="field-block mb-4">
              <div class="field-label">
                <v-icon size="18" color="amber-darken-2">mdi-home-heart</v-icon>
                <span>是否首購</span>
              </div>
              <v-chip-group
                v-model="firstTimeBuyerModel"
                selected-class="contract-chip--active"
                mandatory
                column
              >
                <v-chip :value="true" filter variant="outlined" class="contract-chip">是</v-chip>
                <v-chip :value="false" filter variant="outlined" class="contract-chip">否</v-chip>
              </v-chip-group>
            </div>
            <!-- 🖥️ [調整] 持有車位：卡片式呈現（點卡片開編輯、✕ 移除僅前端暫存、明顯新增入口） -->
            <div class="field-block mb-2">
              <div class="field-label">
                <v-icon size="18" color="blue-darken-2">mdi-parking</v-icon>
                <span>持有車位{{ ownedParkingSpots.length > 0 ? `（${ownedParkingSpots.length}）` : '' }}</span>
              </div>
              <template v-if="ownedParkingSpots.length > 0">
                <div class="parking-card-wrap">
                  <div
                    v-for="p in ownedParkingSpots"
                    :key="p.spotId"
                    class="parking-spot-card"
                    role="button"
                    title="點擊編輯車位"
                    @click="isParkingModalOpen = true"
                  >
                    <div class="parking-spot-main">
                      <div class="parking-spot-id">
                        <v-icon size="15" color="blue-darken-2">mdi-parking</v-icon>{{ p.spotId }}
                      </div>
                      <div class="parking-spot-floor">
                        底價 {{ spotFloorPrice(p) ? `${formatNumber(spotFloorPrice(p), 2)} 萬` : '—' }}
                      </div>
                      <div class="parking-spot-price" :class="{ 'parking-spot-price--empty': !Number(p.price_transaction) }">
                        {{ Number(p.price_transaction) ? `成交價 ${formatNumber(p.price_transaction, 2)} 萬` : '未填成交價' }}
                      </div>
                    </div>
                    <v-btn
                      icon="mdi-close"
                      size="x-small"
                      variant="text"
                      color="grey-darken-1"
                      class="parking-spot-remove"
                      title="移除此車位（按儲存後才生效）"
                      @click.stop="removeParkingSpot(p)"
                    ></v-btn>
                  </div>
                </div>
                <v-btn
                  block
                  variant="outlined"
                  color="primary"
                  prepend-icon="mdi-plus"
                  class="parking-add-btn mt-2"
                  @click="isParkingModalOpen = true"
                >新增車位</v-btn>
              </template>
              <div v-else class="parking-empty" role="button" @click="isParkingModalOpen = true">
                <v-icon size="30" color="blue-grey-lighten-2">mdi-parking</v-icon>
                <div class="text-caption text-grey-darken-1 mt-1 mb-2">此戶尚未持有車位</div>
                <v-btn variant="flat" color="primary" size="small" prepend-icon="mdi-plus">新增車位</v-btn>
              </div>
            </div>
            <!-- 💰 [調整] 價格整合：底價/成交價對照表（房屋、車位、合計），溢差一眼可見 -->
            <div class="field-block mb-2">
              <div class="field-label">
                <v-icon size="18" color="green-darken-2">mdi-cash-multiple</v-icon>
                <span>價格資訊</span>
                <!-- 📐 [調整] 戶別/總面積改徽章樣式，加強識別（有露臺時併顯露臺面積） -->
                <span v-if="editableData.unitId || houseAreaPing > 0" class="price-title-meta">
                  <span v-if="editableData.unitId" class="price-badge price-badge--unit">
                    <v-icon size="13">mdi-home-outline</v-icon><template v-if="projectName">{{ projectName }}・</template>{{ editableData.unitId }}
                  </span>
                  <span v-if="houseAreaPing > 0" class="price-badge price-badge--area">
                    <v-icon size="13">mdi-floor-plan</v-icon>總面積 {{ formatNumber(houseAreaPing, 2) }} 坪<template v-if="terraceAreaPing > 0">・含露臺 {{ formatNumber(terraceAreaPing, 2) }} 坪</template>
                  </span>
                </span>
              </div>
              <div class="price-grid">
                <div class="price-grid-head price-grid-head--item">項目</div>
                <div class="price-grid-head price-grid-head--floor"><v-icon size="12" class="mr-1">mdi-tag-outline</v-icon>底價</div>
                <div class="price-grid-head price-grid-head--sale"><v-icon size="12" class="mr-1">mdi-currency-usd</v-icon>成交價</div>

                <div class="price-grid-item">房屋</div>
                <div class="price-grid-cell price-grid-cell--floor">
                  <div class="price-grid-num">{{ formatNumber(houseBasePrice, 2) }} <span class="price-grid-unit">萬</span></div>
                  <div v-if="terraceFloorPrice > 0" class="price-grid-sub">
                    房屋 {{ formatNumber(houseOnlyFloorPrice, 2) }} ＋ 露臺 {{ formatNumber(terraceFloorPrice, 2) }}
                  </div>
                  <div v-if="houseFloorUnitPrice > 0" class="price-grid-sub">單價{{ terraceFloorPrice > 0 ? '(扣露臺)' : '' }} {{ formatNumber(houseFloorUnitPrice, 2) }} 萬/坪</div>
                </div>
                <div class="price-grid-cell price-grid-cell--sale price-grid-cell--input">
                  <div class="price-grid-input-row">
                    <v-text-field
                      v-model.number="editableData.price_transaction_house"
                      type="number"
                      :min="0"
                      suffix="萬"
                      variant="outlined"
                      bg-color="white"
                      density="compact"
                      hide-details
                      class="price-grid-input"
                    ></v-text-field>
                    <v-btn icon="mdi-calculator" size="x-small" variant="text" color="primary" @click="openPriceNegotiationDialog" title="房屋成交價調整"></v-btn>
                  </div>
                  <div v-if="houseSaleUnitPrice > 0" class="price-grid-sub">單價{{ terraceFloorPrice > 0 ? '(扣露臺)' : '' }} {{ formatNumber(houseSaleUnitPrice, 2) }} 萬/坪</div>
                </div>

                <div class="price-grid-item price-grid-item--parking">
                  <span>車位</span>
                  <span v-if="ownedParkingSpots.length > 0" class="price-grid-item-sub">（{{ ownedParkingSpots.map(p => p.spotId).join('、') }}）</span>
                </div>
                <div class="price-grid-cell price-grid-cell--floor">
                  <div class="price-grid-num">{{ formatNumber(parkingBasePrice, 2) }} <span class="price-grid-unit">萬</span></div>
                </div>
                <div class="price-grid-cell price-grid-cell--sale">
                  <div class="price-grid-num">{{ formatNumber(parkingSalePrice, 2) }} <span class="price-grid-unit">萬</span></div>
                </div>

                <div class="price-grid-item price-grid-item--total">合計</div>
                <div class="price-grid-cell price-grid-cell--total price-grid-cell--floor">
                  <div class="price-grid-sub">成交底價</div>
                  <div class="price-grid-num price-grid-num--total">{{ formatNumber(totalBasePrice, 2) }} <span class="price-grid-unit">萬</span></div>
                </div>
                <div class="price-grid-cell price-grid-cell--total price-grid-cell--sale">
                  <div class="price-grid-sub">成交總價</div>
                  <div class="price-grid-num price-grid-num--total price-grid-num--sale">{{ formatNumber(totalSalePrice, 2) }} <span class="price-grid-unit">萬</span></div>
                </div>
              </div>
              <div class="price-diff-row" :class="priceDifference > 0 ? 'price-diff-row--plus' : (priceDifference < 0 ? 'price-diff-row--minus' : '')">
                <span>溢差價（成交總價 − 成交底價）</span>
                <strong>
                  {{ priceDifference > 0 ? '+' : '' }}{{ formatNumber(priceDifference, 2) }} 萬
                  <span v-if="priceDiffUnitPrice !== null" class="price-diff-unit">（{{ priceDiffUnitPrice > 0 ? '+' : '' }}{{ formatNumber(priceDiffUnitPrice, 2) }} 萬/坪）</span>
                </strong>
              </div>
            </div>
          </div>
        </v-col>

        <v-col cols="12" :md="sectionColMd" v-show="isSectionShown('buyer')">
          <div class="info-section">
            <div class="section-title">
              <v-icon>mdi-account-details</v-icon>買方資訊
              <v-spacer></v-spacer>
              <v-btn
                size="small"
                variant="tonal"
                color="primary"
                prepend-icon="mdi-card-account-details-outline"
                @click="isImportDialogOpen = true"
              >客資卡導入</v-btn>
            </div>
            <v-text-field label="買方姓名" v-model="editableData.buyerName" class="mb-2"></v-text-field>
            <v-combobox 
              label="聯絡電話" 
              v-model="buyerPhonesList" 
              multiple 
              chips 
              clearable 
              closable-chips 
              class="mb-2"
              hint="可手動輸入多筆電話，輸入後按 Enter 新增"
              persistent-hint
            ></v-combobox>
            <v-text-field label="身分證字號" v-model="editableData.buyerIdNumber" class="mb-2"></v-text-field>
           <v-col cols="12">
    <label class="form-label">出生年月日 (民國)</label>
    <v-row dense>
        <v-col cols="4">
            <v-text-field
                v-model.number="rocYear"
                label="年"
                suffix="年"
                variant="outlined"
                density="compact"
                type="number"
                :rules="rocYearRules"
                @update:model-value="syncToModel"
            ></v-text-field> </v-col>
        <v-col cols="4">
            <v-select
                v-model="rocMonth"
                :items="monthOptions"
                label="月"
                variant="outlined"
                density="compact"
                :rules="rocMonthRules"
                @update:model-value="syncToModel"
            ></v-select> </v-col>
        <v-col cols="4">
            <v-text-field
                v-model.number="rocDay"
                label="日"
                suffix="日"
                variant="outlined"
                density="compact"
                type="number"
                :rules="rocDayRules"
                @update:model-value="syncToModel"
            ></v-text-field> </v-col>
    </v-row>
    <div v-if="!isDateValid" class="text-caption text-error">請輸入正確的日期格式</div>
</v-col>
            <v-text-field label="EMAIL" v-model="editableData.buyerEmail" type="email" class="mb-4"></v-text-field>
            
            <div>
              <label class="form-label">通訊地址</label>
              <v-row dense>
                <v-col cols="6">
                  <v-select
                    v-model="mailingCounty"
                    :items="counties"
                    label="縣市"
                    
                    variant="outlined"
                    clearable
                  ></v-select> </v-col>
                <v-col cols="6">
                  <v-select
                    :key="`mailing-towns-${mailingCounty}`"
                    v-model="mailingTown"
                    :items="mailingTowns"
                    label="鄉鎮市區"
                    :disabled="!mailingCounty"
                    
                    variant="outlined"
                    clearable
                  ></v-select> </v-col>
              </v-row>
              <v-text-field label="詳細地址" v-model="editableData.buyerMailingAddressDetail"  variant="outlined"></v-text-field>
            </div>

<v-checkbox v-model="isPermanentSameAsMailing" label="戶籍地址與通訊地址相同" ></v-checkbox>
            
            <div>
              <label class="form-label">戶籍地址</label>
              <v-row dense>
                <v-col cols="6">
                  <v-select
                    v-model="permanentCounty"
                    :items="counties"
                    label="縣市"
                    variant="outlined"
                    clearable
                    :disabled="isPermanentSameAsMailing"
                    :bg-color="isPermanentSameAsMailing ? 'grey-lighten-4' : undefined"
                  ></v-select> </v-col>
                <v-col cols="6">
                  <v-select
                    :key="`permanent-towns-${permanentCounty}`"
                    v-model="permanentTown"
                    :items="permanentTowns"
                    label="鄉鎮市區"
                    :disabled="!permanentCounty || isPermanentSameAsMailing"
                    variant="outlined"
                    clearable
                    :bg-color="isPermanentSameAsMailing ? 'grey-lighten-4' : undefined"
                  ></v-select> </v-col>
              </v-row>
              <v-text-field
                label="詳細地址"
                v-model="editableData.buyerPermanentAddressDetail"
                variant="outlined"
                :readonly="isPermanentSameAsMailing"
                :bg-color="isPermanentSameAsMailing ? 'grey-lighten-4' : undefined"
              ></v-text-field>
            </div>

            <!-- ✅ [新增] 共同買方：多筆客資卡導入或手動新增（存 coBuyers 陣列，主買方欄位不變） -->
            <div class="mt-4">
              <div class="d-flex align-center mb-2">
                <label class="form-label mb-0">共同買方 ({{ coBuyersList.length }})</label>
                <v-spacer></v-spacer>
                <v-btn size="x-small" variant="text" color="primary" prepend-icon="mdi-plus" @click="addCoBuyer">新增共同買方</v-btn>
              </div>
              <div v-if="coBuyersList.length === 0" class="text-caption text-grey mb-2">
                尚無共同買方，可手動新增或由客資卡導入。
              </div>
              <CoBuyerEditor
                v-for="(cb, idx) in coBuyersList"
                :key="cb.sourceSubmissionId || `manual-${idx}`"
                :model-value="cb"
                @remove="removeCoBuyer(idx)"
              />
            </div>
            </div>
        </v-col>
        <v-col cols="12" :md="sectionColMd" v-show="isSectionShown('system')">
          <div class="info-section">
            <div class="section-title"><v-icon>mdi-cog-outline</v-icon>系統設定</div>
            <!-- 🖥️ [調整] 可選方案／戶別圖片自「銷售資訊」抽出，統一於系統設定管理 -->
            <v-select
              label="可選方案"
              :items="planOptions"
              v-model="availablePlansList"
              class="mb-4"
              item-title="name"
              item-value="id"
              multiple
              chips
              closable-chips
              clearable
              hint="未設定時，報價端「選擇方案」將無方案可選"
              persistent-hint
            ></v-select>
            <v-combobox
              label="戶別圖片"
              v-model="editableData.salesImages"
              :items="salesImageOptions"
              multiple
              chips
              clearable
              closable-chips
              class="mb-4"
              hint="可從下拉選單選擇，或手動輸入後按 Enter 新增"
              persistent-hint
            ></v-combobox>
            <!-- ✅ [調整] 文字標籤自「銷售資訊」移入系統設定：顯示於銷控網格右上角，可多個並各自設定底色/文字色 -->
            <UnitTagEditor
              v-model="editableData.unitTags"
              :suggestions="tagSuggestions"
              class="mb-4"
            />
          </div>
        </v-col>
      </v-row>
    </v-form>
    
    <!-- ✅ [新增] 從客戶資料卡導入買方資料 -->
    <CustomerCardImportDialog
      v-model:show="isImportDialogOpen"
      :project-id="props.projectId"
      :unit-id="editableData.unitId || ''"
      :current-data="editableData"
      :existing-co-buyers="coBuyersList"
      @apply="handleImportApply"
    />

    <ParkingEditModal
      v-model:show="isParkingModalOpen"
      :allParkingData="allParkingData"
      :initialSelectedParking="ownedParkingSpots"
      @confirm="handleParkingUpdate"
      @request-open-slide="$emit('request-open-slide')"
      mode="sales"
      :project-id="props.projectId"
      :sales-control-view-mode="props.viewMode" />

    <!-- ✅ [新增] 房屋成交價調整對話框（電腦版左右配置：左為調整方式、右為調整預覽） -->
    <v-dialog v-model="isPriceNegotiationDialogVisible" :max-width="isMobile ? 500 : 880">
      <v-card>
        <v-card-title class="bg-primary text-white d-flex align-center gap-2">
          <v-icon>mdi-calculator</v-icon>
          房屋成交價調整
        </v-card-title>

        <v-card-text class="pt-6">
          <v-row>
            <!-- 左：調整方式 -->
            <v-col cols="12" md="5">
              <div class="text-subtitle-2 font-weight-bold mb-1">調整方式</div>
              <div class="text-caption text-grey-darken-1 mb-4">
                房屋總面積 {{ formatNumber(pnArea, 2) }} 坪
              </div>

              <!-- 第一欄：每坪調整 -->
              <div class="mb-4">
                <label class="text-caption text-grey-darken-1 d-block mb-2">每坪調整 (萬/坪)</label>
                <v-text-field
                  v-model="priceNegotiationPerTsuboValue"
                  type="number"
                  suffix="萬/坪"
                  placeholder="例如: -1.5 (減) 或 +0.5 (加)"
                  variant="outlined"
                  density="compact"
                  hint="輸入負數表示每坪減少"
                  persistent-hint
                  @update:model-value="onPriceNegotiationAdjustmentInput"
                ></v-text-field>
              </div>

              <!-- 第二欄：直接調整 -->
              <div class="mb-4">
                <label class="text-caption text-grey-darken-1 d-block mb-2">直接調整總價 (萬)</label>
                <v-text-field
                  v-model="priceNegotiationDirectAmountValue"
                  type="number"
                  suffix="萬"
                  placeholder="例如: -15 (減) 或 +10 (加)"
                  variant="outlined"
                  density="compact"
                  hint="輸入負數表示總價減少"
                  persistent-hint
                  @update:model-value="onPriceNegotiationAdjustmentInput"
                ></v-text-field>
              </div>

              <!-- 第三欄：直接輸入總價 -->
              <div class="mb-4">
                <label class="text-caption text-grey-darken-1 d-block mb-2">直接輸入總價 (萬)</label>
                <v-text-field
                  v-model="priceNegotiationTotalPriceValue"
                  type="number"
                  suffix="萬"
                  placeholder="例如: 3000"
                  variant="outlined"
                  density="compact"
                  hint="直接以此金額作為成交總價，與上方調整欄位互斥"
                  persistent-hint
                  @update:model-value="onPriceNegotiationTotalPriceInput"
                ></v-text-field>
              </div>
            </v-col>

            <!-- 右：調整預覽 -->
            <v-col cols="12" md="7">
              <div class="text-subtitle-2 font-weight-bold mb-3">調整預覽</div>
              <v-card variant="outlined" class="pa-4 bg-grey-lighten-5">
                <!-- 房屋表價 -->
                <div class="d-flex justify-space-between align-center">
                  <span class="text-grey-darken-2">房屋表價</span>
                  <div class="text-right">
                    <div class="font-weight-bold">{{ formatNumber(Math.round(pnListPrice)) }} 萬</div>
                    <div class="text-caption text-grey">單價 {{ formatNumber(pnUnitOf(pnListPrice), 2) }} 萬/坪</div>
                  </div>
                </div>
                <v-divider class="my-3"></v-divider>

                <!-- 房屋底價 -->
                <div class="d-flex justify-space-between align-center">
                  <span class="text-grey-darken-2">房屋底價</span>
                  <div class="text-right">
                    <div class="font-weight-bold">{{ formatNumber(Math.round(pnFloorPrice)) }} 萬</div>
                    <div class="text-caption text-grey">單價 {{ formatNumber(pnUnitOf(pnFloorPrice), 2) }} 萬/坪</div>
                  </div>
                </div>
                <v-divider class="my-3"></v-divider>

                <!-- 房屋成交價 -->
                <div class="d-flex justify-space-between align-center">
                  <span class="text-subtitle-1 font-weight-bold">房屋成交價</span>
                  <div class="text-right">
                    <div class="text-h5 font-weight-bold text-primary">{{ formatNumber(pnDealPrice) }} 萬</div>
                    <div class="text-caption text-grey">單價 {{ formatNumber(pnUnitOf(pnDealPrice), 2) }} 萬/坪</div>
                  </div>
                </div>
                <v-divider class="my-3"></v-divider>

                <!-- 成交價 vs 表價 -->
                <div class="d-flex justify-space-between align-center mb-2">
                  <span class="text-grey-darken-2">與表價價差</span>
                  <div class="text-right" :class="pnListDiff > 0 ? 'text-error' : (pnListDiff < 0 ? 'text-success' : '')">
                    <div class="font-weight-bold">{{ formatSigned(pnListDiff) }} 萬</div>
                    <div class="text-caption">單價差 {{ formatSigned(pnUnitOf(pnListDiff), 2) }} 萬/坪</div>
                  </div>
                </div>

                <!-- 成交價 vs 底價 -->
                <div class="d-flex justify-space-between align-center">
                  <span class="text-grey-darken-2">與底價價差</span>
                  <div class="text-right" :class="pnFloorDiff > 0 ? 'text-success' : (pnFloorDiff < 0 ? 'text-error' : '')">
                    <div class="font-weight-bold">{{ formatSigned(pnFloorDiff) }} 萬</div>
                    <div class="text-caption">單價差 {{ formatSigned(pnUnitOf(pnFloorDiff), 2) }} 萬/坪</div>
                  </div>
                </div>
              </v-card>
            </v-col>
          </v-row>
        </v-card-text>

        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="grey" variant="text" @click="isPriceNegotiationDialogVisible = false">
            取消
          </v-btn>
          <v-btn color="primary" variant="flat" @click="savePriceNegotiation">
            確認調整
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup>
import { ref, computed, watch, defineAsyncComponent, defineProps, defineEmits, onMounted, nextTick } from 'vue';
import VueDatePicker from '@vuepic/vue-datepicker';
import '@vuepic/vue-datepicker/dist/main.css';
import axios from 'axios';
import { useDisplay } from 'vuetify';
import TwCitiesData from '@/assets/TwCities.json' with { type: 'json' };
import { normalizeSalespersons } from '@/utils/salespersonUtils';
import UnitTagEditor from './UnitTagEditor.vue';
const ParkingEditModal = defineAsyncComponent(() => import('./ParkingEditModal.vue'));
const CustomerCardImportDialog = defineAsyncComponent(() => import('./CustomerCardImportDialog.vue'));
const CoBuyerEditor = defineAsyncComponent(() => import('./CoBuyerEditor.vue'));

const props = defineProps({
  modelValue: { type: Object, default: () => ({}) },
  statusOptions: { type: Array, default: () => [] },
  personnelOptions: { type: Array, default: () => [] },
  allParkingData: { type: Array, default: () => [] },
  projectName: { type: String, required: true },

  projectId: { type: String, required: true },
  viewMode: { type: String, default: 'sales' },

  contractTypeOptions: { type: Array, default: () => [] },
  firstPurchaseOptions: { type: Array, default: () => [] },
  // ✅ 1. 新增 Prop
  allSalesImages: { type: Array, default: () => [] },
  // ✅ [新增] 建案方案清單（方案編輯器功能，「可選方案」複選選項）
  planOptions: { type: Array, default: () => [] },
  // 🖥️ [新增] 電腦版「修改銷控」左側項目導覽：指定只顯示哪些區塊（'sales' | 'deal' | 'buyer' | 'system'），null = 全顯示
  visibleSections: { type: Array, default: null },
  // ✅ [新增] 文字標籤常用建議（由全建案戶別推導，選到同名標籤自動套同色）
  tagSuggestions: { type: Array, default: () => [] },
});

const emit = defineEmits(['update:modelValue', 'request-open-slide', 'parking-updated']);

const { mobile } = useDisplay();
const isMobile = computed(() => mobile.value);

// 🖥️ [新增] 區塊顯示控制：父層（修改銷控左側項目）可指定只顯示某一區塊，未指定時三區塊並排
const ALL_FORM_SECTIONS = ['sales', 'deal', 'buyer', 'system'];
const shownSections = computed(() => {
  const picked = (props.visibleSections || []).filter(k => ALL_FORM_SECTIONS.includes(k));
  return picked.length > 0 ? picked : ALL_FORM_SECTIONS;
});
function isSectionShown(key) {
  return shownSections.value.includes(key);
}
// 只顯示一個區塊時欄位撐滿（另以 CSS 限制最大寬度），兩個時各半，三個時維持 1/3
const sectionColMd = computed(() => Math.floor(12 / shownSections.value.length));

// ✅ [新增] 格式化數字函數
function formatNumber(val, frac = 0) {
  if (val === null || val === undefined || val === '') return 'N/A';
  const num = parseFloat(val);
  if (isNaN(num)) return 'N/A';
  return num.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: frac });
} 

const isParkingModalOpen = ref(false);
const isPermanentSameAsMailing = ref(false);

// ✅ [新增] 客戶資料卡導入
const isImportDialogOpen = ref(false);

// ✅ [新增] 共同買方清單（salesHouseholds.coBuyers 陣列；舊資料無此欄位時視為空）
const coBuyersList = computed(() => (Array.isArray(editableData.value?.coBuyers) ? editableData.value.coBuyers : []));

function addCoBuyer() {
  if (!Array.isArray(editableData.value.coBuyers)) editableData.value.coBuyers = [];
  editableData.value.coBuyers.push({
    name: '', phone: '', idNumber: '', email: '', dateOfBirth: null,
    mailingAddressCity: '', mailingAddressDistrict: '', mailingAddressDetail: '',
    sourceSubmissionId: '', importedAt: '',
  });
}

function removeCoBuyer(idx) {
  if (Array.isArray(editableData.value.coBuyers)) editableData.value.coBuyers.splice(idx, 1);
}

// ✅ [新增] 套用客資卡導入結果（只改前端 editableData，按「儲存變更」才寫入）
function handleImportApply({ primaryValues, coBuyers }) {
  const d = editableData.value;
  if (!d) return;

  if (primaryValues.buyerName !== undefined) d.buyerName = primaryValues.buyerName;
  if (primaryValues.buyerPhone !== undefined) d.buyerPhone = primaryValues.buyerPhone;
  if (primaryValues.buyerIdNumber !== undefined) d.buyerIdNumber = primaryValues.buyerIdNumber;
  if (primaryValues.buyerEmail !== undefined) d.buyerEmail = primaryValues.buyerEmail;
  // buyerDateOfBirth 的 watch 會自動同步民國三欄顯示
  if (primaryValues.buyerDateOfBirth !== undefined) d.buyerDateOfBirth = primaryValues.buyerDateOfBirth;

  // 通訊地址：縣市/鄉鎮綁在本地 ref（其 watch 負責寫回 editableData），需經由 ref 更新
  if (primaryValues.mailingAddress) {
    const { city, district, detail } = primaryValues.mailingAddress;
    if (city) {
      mailingCounty.value = city; // watch 會重設 mailingTown 並載入鄉鎮清單
      nextTick(() => { mailingTown.value = district || null; });
    } else if (district) {
      mailingTown.value = district;
    }
    d.buyerMailingAddressDetail = detail || '';
  }

  // 共同買方：同一筆客資卡（sourceSubmissionId）重複導入 → 更新既有紀錄，不重複新增
  if (Array.isArray(coBuyers) && coBuyers.length > 0) {
    const existing = Array.isArray(d.coBuyers) ? d.coBuyers : [];
    coBuyers.forEach(cb => {
      const idx = existing.findIndex(e => e.sourceSubmissionId && e.sourceSubmissionId === cb.sourceSubmissionId);
      if (idx >= 0) existing.splice(idx, 1, cb);
      else existing.push(cb);
    });
    d.coBuyers = existing;
  }
}

// ✅ [新增] 房屋成交價調整相關狀態
const isPriceNegotiationDialogVisible = ref(false);
const priceNegotiationPerTsuboValue = ref('');    // 每坪調整值
const priceNegotiationDirectAmountValue = ref(''); // 直接調整值
const priceNegotiationTotalPriceValue = ref('');   // 直接輸入總價
const priceNegotiationResult = ref(0);             // 調整後的價格

// ✅ [優化] 調整預覽：表價/底價/成交價與價差的計算基礎
const pnListPrice = computed(() => Number(editableData.value?.price_list_house_total) || 0);
const pnFloorPrice = computed(() => Number(editableData.value?.price_floor_house_total) || 0);
const pnArea = computed(() => Number(editableData.value?.area_house_ping) || 0);
const pnDealPrice = computed(() => Math.round(priceNegotiationResult.value) || 0);
const pnListDiff = computed(() => pnDealPrice.value - Math.round(pnListPrice.value));   // 成交價 − 表價
const pnFloorDiff = computed(() => pnDealPrice.value - Math.round(pnFloorPrice.value)); // 成交價 − 底價

// 總價換算單價（萬/坪）；面積為 0 時避免除以零
function pnUnitOf(total) {
  return (Number(total) || 0) / (pnArea.value || 1);
}

// 帶正負號的數字格式（正數補 +），供價差顯示
function formatSigned(val, frac = 0) {
  const num = Number(val) || 0;
  const prefix = num > 0 ? '+' : (num < 0 ? '-' : '');
  return prefix + formatNumber(Math.abs(num), frac);
}

// ✅ 
const localContractOptions = computed(() => {
  // 
  console.log('SalesInfoForm: 接收到的 contractTypeOptions prop 更新:', props.contractTypeOptions);
  return props.contractTypeOptions;
});

const editableData = computed({
  get: () => props.modelValue,
  set: (newValue) => emit('update:modelValue', newValue)
});

// ✅ [新增] 是否首購顯示模型：資料為空值（非明確的 true/false）時，UI 一律視為「是」
// 這保證畫面在任何時序下都顯示「是」；實際空值正規化寫回由下方 deep watch 處理
const firstTimeBuyerModel = computed({
  get: () => (editableData.value?.isFirstTimeBuyer === false ? false : true),
  set: (val) => {
    if (editableData.value) editableData.value.isFirstTimeBuyer = val;
  }
});

// ✅ 2. 新增 Computed，將圖片物件陣列轉換為名稱字串陣列
const salesImageOptions = computed(() => {
  return props.allSalesImages.map(img => img.imageName);
});

// ✅ 新增：處理多筆聯絡電話，綁定至逗號分隔字串
const buyerPhonesList = computed({
  get: () => {
    if (!editableData.value.buyerPhone) return [];
    if (Array.isArray(editableData.value.buyerPhone)) return editableData.value.buyerPhone;
    return String(editableData.value.buyerPhone).split(',').map(p => p.trim()).filter(Boolean);
  },
  set: (val) => {
    editableData.value.buyerPhone = Array.isArray(val) ? val.join(',') : val;
  }
});

// ✅ 銷售人員複選：相容舊單人字串與新陣列，綁定 v-select(multiple)
// 寫回 editableData.salesperson 一律存為陣列
const salespersonList = computed({
  get: () => normalizeSalespersons(editableData.value?.salesperson),
  set: (val) => {
    if (editableData.value) {
      editableData.value.salesperson = normalizeSalespersons(val);
    }
  }
});

// ✅ [新增] 可選方案複選：存方案 id 陣列；顯示時過濾失效 id（方案已刪除），儲存時一併剔除
const availablePlansList = computed({
  get: () => {
    const ids = editableData.value?.availablePlans;
    if (!Array.isArray(ids)) return [];
    const validIds = new Set((props.planOptions || []).map(p => p.id));
    return ids.filter(id => validIds.has(id));
  },
  set: (val) => {
    if (editableData.value) {
      editableData.value.availablePlans = Array.isArray(val) ? val : [];
    }
  }
});

// ✓ [打勾] 新增民國年月日暫存狀態
const rocYear = ref(null);
const rocMonth = ref(null);
const rocDay = ref(null);

const monthOptions = Array.from({ length: 12 }, (_, i) => i + 1);

// ✓ [打勾] 驗證邏輯：檢查日期是否合法 (含閏年判斷)
const isDateValid = computed(() => {
    if (!rocYear.value || !rocMonth.value || !rocDay.value) return true;
    const ceYear = rocYear.value + 1911;
    const date = new Date(ceYear, rocMonth.value - 1, rocDay.value);
    // 檢查 Date 物件是否發生自動進位 (例如 2/30 變成 3/2)
    return date.getFullYear() === ceYear && 
           date.getMonth() === rocMonth.value - 1 && 
           date.getDate() === rocDay.value;
});

// ✓ [打勾] 驗證規則
const rocYearRules = [
    v => !!v || '必填',
    v => v > 0 || '年份需大於 0',
    v => v <= (new Date().getFullYear() - 1911) || '年份不可超過今年'
];
const rocMonthRules = [v => !!v || '必填'];
const rocDayRules = [
    v => !!v || '必填',
    v => (v >= 1 && v <= 31) || '日期範圍錯誤'
];

// ✓ [打勾] 函數：將民國年月日寫入編輯模型 (儲存為物件格式 { year, month, day })
function syncToModel() {
    if (rocYear.value && rocMonth.value && rocDay.value && isDateValid.value) {
        // 修改：不再轉為 Date，而是儲存為自訂物件
        editableData.value.buyerDateOfBirth = {
            year: rocYear.value,
            month: rocMonth.value,
            day: rocDay.value
        };
    } else {
        editableData.value.buyerDateOfBirth = null;
    }
}

// ✓ [打勾] 監聽初始資料，將後端格式 (Timestamp/Date 或 ROC物件) 拆解回民國顯示
watch(() => props.modelValue.buyerDateOfBirth, (newVal) => {
    if (!newVal) {
        rocYear.value = null;
        rocMonth.value = null;
        rocDay.value = null;
        return;
    }

    // 情況 A: 新格式 (物件 { year, month, day })
    if (typeof newVal === 'object' && 'year' in newVal && 'month' in newVal) {
        rocYear.value = newVal.year;
        rocMonth.value = newVal.month;
        rocDay.value = newVal.day;
        return;
    }

    // 情況 B: 舊格式 (Firestore Timestamp 或 JS Date)
    let dateObj;
    if (typeof newVal.toDate === 'function') {
        dateObj = newVal.toDate();
    } else {
        dateObj = new Date(newVal);
    }
    
    if (!isNaN(dateObj.getTime())) {
        rocYear.value = dateObj.getFullYear() - 1911;
        rocMonth.value = dateObj.getMonth() + 1;
        rocDay.value = dateObj.getDate();
    }
}, { immediate: true });

// ✅ [新增] 監聽銷售人員選擇變化，同步寫入 salespersonUserKey (來源：salesPersonnel.phone)
// Why: salesHouseholds 原本只存姓名字串，造成同名衝突 / 改名失聯 / 反查效率差
// 複選後：salesperson 為姓名陣列，salespersonUserKey 同步為對應 phone 陣列（順序一致、過濾無效值）
watch(
  [() => editableData.value?.salesperson, () => props.personnelOptions],
  ([names, options]) => {
    if (!editableData.value) return;
    const nameArr = normalizeSalespersons(names);
    const opts = options || [];
    const newKeys = nameArr
      .map(name => opts.find(p => p?.name === name)?.phone || null)
      .filter(Boolean);
    const current = Array.isArray(editableData.value.salespersonUserKey)
      ? editableData.value.salespersonUserKey
      : (editableData.value.salespersonUserKey ? [editableData.value.salespersonUserKey] : []);
    if (JSON.stringify(current) !== JSON.stringify(newKeys)) {
      editableData.value.salespersonUserKey = newKeys;
    }
  },
  { immediate: true }
);

// ✅ 3. Watcher：確保 salesImages 永遠是陣列、衍伸銷售狀態，並套用成交資訊預設值
// 同時監聽 localContractOptions，因 contractTypeOptions 為非同步傳入的 prop（初始可能為空陣列）
watch([() => editableData.value, localContractOptions], ([newData, options]) => {
  if (!newData) return; // 如果 newData 是 null/undefined，則跳過

  let needsUpdate = false;
  const updatedData = { ...newData }; // 建立一個可變更的副本

  // 檢查 salesImages
  if (!Array.isArray(newData.salesImages)) {
    // 如果 salesImages 不存在或不是陣列，初始化為一個空陣列
    updatedData.salesImages = [];
    needsUpdate = true;
  }

  // ✅ START: 新增 - 衍伸銷售狀態
  // 根據 "後台狀態" (salesStatus_backend) 決定 "銷售狀態" (salesStatus_quote)
  const newQuoteStatus = newData.salesStatus_backend ? "已售" : "";

  // 只有在衍伸值與當前值不同時，才標記為需要更新
  if (newData.salesStatus_quote !== newQuoteStatus) {
    updatedData.salesStatus_quote = newQuoteStatus;
    needsUpdate = true;
  }
  // ✅ END: 新增

  // ✅ 是否首購：空值（非明確 true/false，含 undefined/null/空字串）一律預設「是」
  if (newData.isFirstTimeBuyer !== true && newData.isFirstTimeBuyer !== false) {
    updatedData.isFirstTimeBuyer = true;
    needsUpdate = true;
  }

  // ✅ 合約方式：尚未選取且選項含「一般合約」→ 預設選「一般合約」
  const contractEmpty =
    newData.contractType === undefined || newData.contractType === null || newData.contractType === '';
  if (contractEmpty && Array.isArray(options) && options.includes('一般合約')) {
    updatedData.contractType = '一般合約';
    needsUpdate = true;
  }

  // 如果需要更新 (任一邏輯觸發)，則發出一次 'update:modelValue' 事件
  if (needsUpdate) {
    emit('update:modelValue', updatedData);
  }

}, { immediate: true, deep: true });

const allCitiesData = ref(TwCitiesData);

const counties = computed(() => allCitiesData.value.map(city => city.name));
const mailingTowns = ref([]);
const permanentTowns = ref([]);
const mailingCounty = ref(null);
const mailingTown = ref(null);
const permanentCounty = ref(null);
const permanentTown = ref(null);

onMounted(async () => {
  initializeAddress();
});


const initializeAddress = () => {
    const data = editableData.value;
    if (!data || counties.value.length === 0) return;

    const mailingCountyName = data.buyerMailingAddressCity;
    if (mailingCountyName) {
        const county = allCitiesData.value.find(c => c.name === mailingCountyName);
        if (county) {
            mailingCounty.value = county.name;
            mailingTowns.value = county.districts.map(d => d.name);
            
            // ✅ 使用 nextTick 確保 v-select (下拉選單) 已經更新了選項
            nextTick(() => { 
                mailingTown.value = data.buyerMailingAddressDistrict; 
            });
        }
    }

    const permanentCountyName = data.buyerPermanentAddressCity;
    if (permanentCountyName) {
      const county = allCitiesData.value.find(c => c.name === permanentCountyName);
      if (county) {
        permanentCounty.value = county.name;
        permanentTowns.value = county.districts.map(d => d.name);
        
        // ✅ 使用 nextTick
        nextTick(() => { 
            permanentTown.value = data.buyerPermanentAddressDistrict; 
        });
      }
    }
};

watch(mailingCounty, (newCountyName) => {
    const selectedCounty = counties.value.find(c => c === newCountyName);
    editableData.value.buyerMailingAddressCity = selectedCounty || '';
    mailingTown.value = null; // 重設鄉鎮市區
    
    if (selectedCounty) {
        const countyData = allCitiesData.value.find(c => c.name === selectedCounty);
        mailingTowns.value = countyData ? countyData.districts.map(d => d.name) : [];
    } else {
        mailingTowns.value = [];
    }
});
watch(mailingTown, (newTownName) => {
    editableData.value.buyerMailingAddressDistrict = newTownName || '';
});

// ✅ MOD: 修改 watch，從本地資料獲取鄉鎮市區
watch(permanentCounty, (newCountyName) => {
    const selectedCounty = counties.value.find(c => c === newCountyName);
    editableData.value.buyerPermanentAddressCity = selectedCounty || '';
    permanentTown.value = null; // 重設鄉鎮市區
    
    if (selectedCounty) {
        const countyData = allCitiesData.value.find(c => c.name === selectedCounty);
        permanentTowns.value = countyData ? countyData.districts.map(d => d.name) : [];
    } else {
        permanentTowns.value = [];
    }
});
watch(permanentTown, (newTownName) => {
    editableData.value.buyerPermanentAddressDistrict = newTownName || '';
});

// ✅ MOD: 修改 "地址相同" 的 watch 邏輯
watch(isPermanentSameAsMailing, (isSame) => {
  if (isSame) {
    permanentCounty.value = mailingCounty.value;
    editableData.value.buyerPermanentAddressDetail = editableData.value.buyerMailingAddressDetail;
    
    // ✅ 由於 permanentCounty 的 watch 會自動更新 permanentTowns，我們用 nextTick 來等待更新
    nextTick(() => { 
        permanentTown.value = mailingTown.value; 
    });
  }
});

// ✅ [新增] 監聽通訊縣市變化，若同步開啟則更新戶籍縣市
watch(mailingCounty, (val) => {
  if (isPermanentSameAsMailing.value) {
    permanentCounty.value = val;
  }
});

// ✅ [新增] 監聽通訊鄉鎮變化，若同步開啟則更新戶籍鄉鎮
watch(mailingTown, (val) => {
  if (isPermanentSameAsMailing.value) {
     // 使用 nextTick 確保 permanentCounty 變更觸發的列表更新已完成
     nextTick(() => {
        permanentTown.value = val;
     });
  }
});

// ✅ [新增] 監聽通訊詳細地址變化，若同步開啟則更新戶籍詳細地址
watch(() => editableData.value.buyerMailingAddressDetail, (val) => {
  if (isPermanentSameAsMailing.value) {
    editableData.value.buyerPermanentAddressDetail = val;
  }
});

// 🖥️ [新增] 本次編輯是否動過車位（含清空）：動過後一律以暫存名單為準，避免清空後又 fallback 回 DB 名單
const hasStagedParking = ref(false);
watch(() => editableData.value?.unitId, () => { hasStagedParking.value = false; });

// 📋 從 salesParkings 集合中找出該戶別持有的車位
const ownedParkingSpots = computed(() => {
  // 1. 本次編輯動過車位（含清空）或已有暫存資料時，優先使用暫存
  const staged = editableData.value?.['持有車位'];
  if (Array.isArray(staged) && (hasStagedParking.value || staged.length > 0)) {
    return staged.map(p => ({
        ...p,
        spotId: p.spotId || p['車位編號'], // 確保 Key 相容
        price_transaction: p.price_transaction || p['車位成交價']
    }));
  }

  // 2. 否則才從原始資料庫列表過濾 (原本的邏輯)
  if (!props.allParkingData || !editableData.value?.unitId) return [];
  return props.allParkingData.filter(parking => parking.buyerUnitId === editableData.value.unitId);
});

const houseBasePrice = computed(() => editableData.value?.price_floor_house_total || 0);
// 💰 [新增] 房屋底價拆分：露臺底價 > 0 時於房屋總底價下方輔助顯示「房屋＋露臺」
const houseOnlyFloorPrice = computed(() => Number(editableData.value?.price_floor_house_only) || 0);
const terraceFloorPrice = computed(() => Number(editableData.value?.price_floor_terrace) || 0);
// 📐 [新增] 面積與單價：標題列顯示戶別/總面積；房屋列輔助顯示底價單價、成交單價
// 單價口徑（同戶別詳情內部單價）：先扣除露臺底價，再 ÷ 房屋總面積
const houseAreaPing = computed(() => Number(editableData.value?.area_house_ping) || 0);
const terraceAreaPing = computed(() => Number(editableData.value?.area_terrace_ping) || 0);
const houseFloorUnitPrice = computed(() => houseAreaPing.value > 0 ? ((Number(houseBasePrice.value) || 0) - terraceFloorPrice.value) / houseAreaPing.value : 0);
const houseSaleUnitPrice = computed(() => houseAreaPing.value > 0 ? ((Number(editableData.value?.price_transaction_house) || 0) - terraceFloorPrice.value) / houseAreaPing.value : 0);
// 💰 [新增] 單一車位底價（相容舊欄位名 車位底價/底價）
function spotFloorPrice(p) {
  return Number(p?.price_floor ?? p?.['車位底價'] ?? p?.['底價']) || 0;
}
const parkingBasePrice = computed(() => {
  return ownedParkingSpots.value.reduce((sum, p) => sum + spotFloorPrice(p), 0);
});
const totalBasePrice = computed(() => houseBasePrice.value + parkingBasePrice.value);
const parkingSalePrice = computed(() => {
    return ownedParkingSpots.value.reduce((sum, p) => sum + (Number(p.price_transaction) || 0), 0);
});
const totalSalePrice = computed(() => (Number(editableData.value?.price_transaction_house) || 0) + parkingSalePrice.value);

// ✅ [新增] 監聽 totalSalePrice 變動，自動同步到資料庫要儲存的欄位 price_transaction_total
watch(totalSalePrice, (newVal) => {
    if (editableData.value) {
        editableData.value.price_transaction_total = newVal;
    }
}, { immediate: true });
const unitSalePrice = computed(() => {
    const housePrice = Number(editableData.value?.price_transaction_house) || 0;
    const area = Number(editableData.value?.area_house_ping);
    if (!area) return 0;
    return (housePrice / area).toFixed(2);
});
const priceDifference = computed(() => {
  if (!totalSalePrice.value || !totalBasePrice.value) return 0;
  return totalSalePrice.value - totalBasePrice.value;
});
// 📐 [新增] 溢差單價＝溢差價 ÷ 房屋總面積（口徑同戶別詳情 premiumUnitPrice）
const priceDiffUnitPrice = computed(() => {
  if (!houseAreaPing.value || !priceDifference.value) return null;
  return priceDifference.value / houseAreaPing.value;
});

// 📋 處理車位更新：透過 API 直接更新 salesParkings 集合
async function handleParkingUpdate(updatedParkingList) {
    try {
        // ✅ [新增/修正] 即時更新前端顯示綁定
        // 若清空車位或變更車位，在此處即時將新陣列塞入 editableData (對應 ownedParkingSpots 取值來源)
        if (editableData.value) {
           editableData.value['持有車位'] = updatedParkingList;
        }
        hasStagedParking.value = true;

        // 觸發父元件進行車位資料更新
        // 傳遞更新的車位清單給父元件處理
        emit('parking-updated', {
            unitId: editableData.value.unitId,
            parkingList: updatedParkingList
        });
    } catch (error) {
        console.error('🚗 車位更新失敗:', error);
    }
}

// 🖥️ [新增] 卡片 ✕ 移除單一車位：走同一條暫存流程（handleParkingUpdate），按儲存後才寫入資料庫
function removeParkingSpot(spot) {
  const targetId = spot.spotId || spot['車位編號'];
  const remaining = ownedParkingSpots.value.filter(p => (p.spotId || p['車位編號']) !== targetId);
  handleParkingUpdate(remaining);
}

// ✅ [新增] 房屋成交價調整相關方法
function openPriceNegotiationDialog() {
  // 重置調整欄位
  priceNegotiationPerTsuboValue.value = '';
  priceNegotiationDirectAmountValue.value = '';
  priceNegotiationTotalPriceValue.value = '';

  // 初始化調整後的價格為房屋表價
  const listPrice = Number(editableData.value?.price_list_house_total) || 0;
  priceNegotiationResult.value = listPrice;

  isPriceNegotiationDialogVisible.value = true;
}

// 每坪/直接調整欄位輸入：與「直接輸入總價」互斥，先清空總價欄位
function onPriceNegotiationAdjustmentInput() {
  if (priceNegotiationTotalPriceValue.value !== '') {
    priceNegotiationTotalPriceValue.value = '';
  }
  calculatePriceNegotiation();
}

// 直接輸入總價欄位輸入：與調整欄位互斥，先清空每坪/直接調整欄位
function onPriceNegotiationTotalPriceInput() {
  if (priceNegotiationPerTsuboValue.value !== '') {
    priceNegotiationPerTsuboValue.value = '';
  }
  if (priceNegotiationDirectAmountValue.value !== '') {
    priceNegotiationDirectAmountValue.value = '';
  }
  calculatePriceNegotiation();
}

function calculatePriceNegotiation() {
  const listPrice = Number(editableData.value?.price_list_house_total) || 0;
  const area = Number(editableData.value?.area_house_ping) || 0;
  const hasPerTsuboValue = priceNegotiationPerTsuboValue.value !== '';
  const hasDirectAmountValue = priceNegotiationDirectAmountValue.value !== '';
  const hasTotalPriceValue = priceNegotiationTotalPriceValue.value !== '';

  // 直接輸入總價 → 以輸入金額為準
  if (hasTotalPriceValue) {
    priceNegotiationResult.value = Math.round(Number(priceNegotiationTotalPriceValue.value) || 0);
    return;
  }

  // 欄位都空 → 顯示原始表價（恢復狀態）
  if (!hasPerTsuboValue && !hasDirectAmountValue) {
    priceNegotiationResult.value = Math.round(listPrice);
    return;
  }

  // 兩種方式並存、累加計算
  // 每坪調整
  const perTsuboAdj = hasPerTsuboValue
    ? Math.round((Number(priceNegotiationPerTsuboValue.value) || 0) * area)
    : 0;

  // 直接調整
  const directAdj = hasDirectAmountValue
    ? Math.round(Number(priceNegotiationDirectAmountValue.value) || 0)
    : 0;

  // 合計調整 = 每坪 + 直接（並存累加）
  const totalAdjustment = perTsuboAdj + directAdj;
  priceNegotiationResult.value = Math.round(listPrice + totalAdjustment);
}

function savePriceNegotiation() {
  const hasDirectAmount = priceNegotiationDirectAmountValue.value !== '';
  const hasPerTsubo = priceNegotiationPerTsuboValue.value !== '';
  const hasTotalPrice = priceNegotiationTotalPriceValue.value !== '';

  // 欄位都空 → 視同取消調整，恢復原始價格
  if (!hasDirectAmount && !hasPerTsubo && !hasTotalPrice) {
    isPriceNegotiationDialogVisible.value = false;
    return;
  }

  // 更新房屋成交價
  editableData.value.price_transaction_house = Math.round(priceNegotiationResult.value);

  isPriceNegotiationDialogVisible.value = false;
}
</script>

<style scoped>
.info-section { 
  padding: 16px; 
  border: 1px solid #e0e0e0; 
  border-radius: 8px; 
  height: 100%;
}
/* 🖥️ 電腦版單一區塊顯示（修改銷控左側項目切換）：限制表單寬度，避免欄位被拉得過長不好讀 */
.single-section .info-section {
  max-width: 640px;
}
.section-title { font-size: 1.1rem; font-weight: 600; color: #1a3a6e; margin-bottom: 16px; padding-bottom: 8px; border-bottom: 2px solid #e0e0e0; display: flex; align-items: center; gap: 8px; }
.form-label { font-size: 0.9rem; color: #555; font-weight: 500; margin-bottom: 4px; display: block; }
.base-price-field :deep(.v-field) {
  background-color: #fce4ec; 
}
.mb-4 {
  margin-bottom: 16px;
}
.mb-2 {
  margin-bottom: 8px;
}

/* ===== 合約方式 / 是否首購 區塊美化 ===== */
.field-block {
  background: #f7f9fc;
  border: 1px solid #e6ebf2;
  border-radius: 10px;
  padding: 12px 14px;
}
.field-label {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.85rem;
  font-weight: 600;
  color: #44546a;
  margin-bottom: 8px;
}
.contract-chip {
  font-weight: 500;
}
/* v-chip-group 選中的合約方式樣式（selected-class） */
.contract-chip--active {
  background-color: #1a3a6e !important;
  border-color: #1a3a6e !important;
  color: #ffffff !important;
}

/* ===== 持有車位卡片 ===== */
.parking-card-wrap {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.parking-spot-card {
  display: flex;
  align-items: center;
  gap: 4px;
  background: #ffffff;
  border: 1px solid #cfd8e3;
  border-radius: 10px;
  padding: 8px 6px 8px 12px;
  min-width: 148px;
  cursor: pointer;
  transition: border-color .15s, box-shadow .15s;
}
.parking-spot-card:hover {
  border-color: #1a3a6e;
  box-shadow: 0 1px 4px rgba(26, 58, 110, .15);
}
.parking-spot-id {
  display: flex;
  align-items: center;
  gap: 4px;
  font-weight: 700;
  color: #1a3a6e;
  font-size: .95rem;
  line-height: 1.3;
}
.parking-spot-price {
  font-size: .78rem;
  color: #2e7d32;
  line-height: 1.3;
}
.parking-spot-price--empty {
  color: #e65100;
}
.parking-spot-remove {
  margin-left: 2px;
}
.parking-add-btn {
  border-style: dashed;
}
.parking-empty {
  border: 1.5px dashed #b7c4d4;
  border-radius: 10px;
  background: #fbfcfe;
  padding: 16px 12px;
  text-align: center;
  cursor: pointer;
  transition: border-color .15s, background .15s;
}
.parking-empty:hover {
  border-color: #1a3a6e;
  background: #f3f7fd;
}
/* 車位卡片：底價列 */
.parking-spot-floor {
  font-size: .74rem;
  color: #8493a8;
  line-height: 1.3;
}

/* ===== 價格資訊：底價/成交價對照表 ===== */
.price-grid {
  display: grid;
  grid-template-columns: auto 1fr 1.3fr;
  column-gap: 8px;
}
.price-grid-head {
  font-size: .75rem;
  color: #8493a8;
  font-weight: 600;
  padding: 6px 10px;
  border-bottom: 1px solid #e6ebf2;
  display: flex;
  align-items: flex-end;
}
/* 底價欄（灰藍）與成交價欄（綠）以色帶＋同色數字區分 */
.price-grid-head--floor {
  color: #5a6b81;
  background: #eef2f7;
  border-radius: 10px 10px 0 0;
}
.price-grid-head--sale {
  color: #1b5e20;
  background: #e7f4e8;
  border-radius: 10px 10px 0 0;
}
.price-grid-item {
  font-size: .85rem;
  font-weight: 600;
  color: #44546a;
  padding: 10px 0;
  white-space: nowrap;
  display: flex;
  align-items: center;
}
/* 車位列標籤：車位字樣一行、編號括號另起一行 */
.price-grid-item--parking {
  flex-direction: column;
  align-items: flex-start;
  justify-content: center;
}
.price-grid-item-sub {
  font-size: .72rem;
  font-weight: 500;
  color: #8493a8;
  line-height: 1.3;
  white-space: normal;
  max-width: 140px;
}
.price-grid-cell {
  padding: 8px 0;
  display: flex;
  flex-direction: column;
  justify-content: center;
}
.price-grid-cell--floor {
  background: #eef2f7;
  padding-left: 10px;
  padding-right: 10px;
}
.price-grid-cell--sale {
  background: #e7f4e8;
  padding-left: 10px;
  padding-right: 10px;
}
.price-grid-cell--floor .price-grid-num {
  color: #5a6b81;
}
.price-grid-cell--sale .price-grid-num {
  color: #1b5e20;
}
.price-grid-num {
  font-size: .95rem;
  font-weight: 600;
  color: #1f2d3d;
  line-height: 1.3;
}
.price-grid-unit {
  font-size: .75rem;
  font-weight: 400;
  color: #8493a8;
}
.price-grid-sub {
  font-size: .72rem;
  color: #8493a8;
  line-height: 1.3;
}
.price-grid-input-row {
  display: flex;
  align-items: center;
  gap: 2px;
}
.price-title-meta {
  margin-left: auto;
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 6px;
}
.price-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 3px 10px;
  border-radius: 999px;
  font-size: .78rem;
  font-weight: 700;
  line-height: 1.2;
  white-space: nowrap;
}
.price-badge--unit {
  background: #1a3a6e;
  color: #fff;
  letter-spacing: .5px;
}
.price-badge--area {
  background: #e8eef7;
  color: #1a3a6e;
  border: 1px solid #c9d7ec;
  font-weight: 600;
}
.price-grid-input {
  max-width: 170px;
}
.price-grid-item--total,
.price-grid-cell--total {
  border-top: 1px dashed #d4dce8;
}
.price-grid-cell--total.price-grid-cell--floor,
.price-grid-cell--total.price-grid-cell--sale {
  border-radius: 0 0 10px 10px;
  padding-bottom: 10px;
}
.price-grid-item--total {
  padding-top: 12px;
}
.price-grid-num--total {
  font-size: 1.05rem;
}
.price-grid-num--sale {
  color: #1b5e20;
}
.price-diff-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 10px;
  padding: 8px 12px;
  border-radius: 8px;
  background: #eef1f5;
  color: #607086;
  font-size: .82rem;
}
.price-diff-row--plus {
  background: #e8f5e9;
  color: #2e7d32;
}
.price-diff-row--minus {
  background: #fdecea;
  color: #c62828;
}
.price-diff-row strong {
  font-size: .95rem;
}
.price-diff-unit {
  font-size: .78rem;
  font-weight: 500;
  margin-left: 2px;
}

/* 📱 [優化] 手機版成交資訊/價格資訊：減少巢狀內距、對照表改 2 欄、輸入欄撐滿好點按 */
@media (max-width: 599px) {
  .info-section {
    padding: 12px 10px;
  }
  .field-block {
    padding: 10px;
  }

  /* 標題列徽章（建案戶別/總面積）換行至標題下方靠左，不再與標題擠同一列 */
  .field-label {
    flex-wrap: wrap;
  }
  .price-title-meta {
    margin-left: 0;
    width: 100%;
    justify-content: flex-start;
    margin-top: 4px;
  }

  /* 價格對照表：項目名稱改為橫跨整列的小節標題，底價/成交價各半寬並排 */
  .price-grid {
    grid-template-columns: 1fr 1fr;
    column-gap: 6px;
  }
  .price-grid-head {
    display: none;
  }
  .price-grid-item {
    grid-column: 1 / -1;
    padding: 12px 2px 6px;
    white-space: normal;
  }
  /* 車位列：編號括號改與「車位」同列接續顯示 */
  .price-grid-item--parking {
    flex-direction: row;
    align-items: baseline;
    gap: 4px;
  }
  .price-grid-item-sub {
    max-width: none;
  }
  /* 每格改為圓角色塊，並以 ::before 標示 底價/成交價（表頭已隱藏） */
  .price-grid-cell {
    border-radius: 8px;
    padding: 8px 10px;
  }
  .price-grid-cell--floor::before {
    content: '底價';
    font-size: .7rem;
    font-weight: 600;
    color: #5a6b81;
    margin-bottom: 2px;
  }
  .price-grid-cell--sale::before {
    content: '成交價';
    font-size: .7rem;
    font-weight: 600;
    color: #1b5e20;
    margin-bottom: 2px;
  }
  /* 合計格已有「成交底價/成交總價」子標籤，不再重複 */
  .price-grid-cell--total::before {
    content: none;
  }
  .price-grid-cell--total {
    border-top: none;
  }
  .price-grid-item--total {
    border-top: 1px dashed #d4dce8;
    margin-top: 10px;
    padding-top: 12px;
  }
  .price-grid-cell--total.price-grid-cell--floor,
  .price-grid-cell--total.price-grid-cell--sale {
    border-radius: 8px;
  }

  /* 成交價輸入欄：撐滿欄寬；字級 16px 避免 iOS 聚焦自動放大 */
  .price-grid-input {
    max-width: none;
    flex: 1 1 auto;
    min-width: 0;
  }
  .price-grid-input :deep(input) {
    font-size: 16px;
  }
  .price-grid-input-row {
    gap: 4px;
  }

  /* 持有車位卡片改滿寬列，資訊完整呈現且更好點按 */
  .parking-spot-card {
    flex: 1 1 100%;
  }
}
</style>

<style>
/* VueDatePicker teleport 到 body 後需要全域樣式：拉高 z-index 避免被 v-dialog (2400) 蓋住 */
.dp__outer_menu_wrap,
.dp__menu,
.dp__theme_light {
  z-index: 3000 !important;
}
</style>