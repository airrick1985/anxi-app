<template>
  <v-dialog :model-value="show" @update:model-value="close" :fullscreen="isMobile"
    :max-width="isMobile ? '100%' : '80vw'" :transition="isMobile ? 'dialog-bottom-transition' : 'dialog-transition'">
    <v-card class="d-flex flex-column" style="height: 100%; overflow: hidden;">

      <v-overlay :model-value="isSaving" class="align-center justify-center blur-background" persistent
        scrim="grey-darken-3">
        <div class="d-flex flex-column align-center">
          <v-progress-circular indeterminate size="48" color="#008cff" class="mb-4"></v-progress-circular>
          <p class="text-h6 text-black">{{ savingText }}</p>
        </div>
      </v-overlay>

      <div class="header-section">
        <v-card-title class="d-flex justify-space-between align-center text-h5">
          <span>{{ unitData ? unitData.unitId : '詳細資訊' }}</span>
          <div>
            <v-btn v-if="viewMode === 'sales' && !isEditing" color="white" variant="text" @click="startEditing">
              <v-icon left>mdi-pencil</v-icon>
              修改銷控
            </v-btn>
            <v-btn v-if="isEditing" variant="text" @click="cancelEditing">取消編輯</v-btn>
            <v-btn icon="mdi-close" variant="text" @click="close"></v-btn>
          </div>
        </v-card-title>
        <v-divider></v-divider>
        <v-tabs v-if="viewMode === 'sales'" v-model="tab" color="primary" grow :disabled="isEditing">
          <v-tab value="info">詳細資訊</v-tab>
          <v-tab value="aiAssistant">AI助理</v-tab>
        </v-tabs>
        <v-divider></v-divider>
      </div>

      <v-card-text class="main-content">
        <v-window v-model="tab">
          <v-window-item value="info">
            <template v-if="isEditing">

              <!-- 面積資訊 (唯讀展示) -->
              <v-card variant="outlined" class="mb-4 pa-3 bg-grey-lighten-5" style="border-color: #ddd;">
                <div class="d-flex align-center mb-2">
                  <v-icon color="teal" class="mr-2">mdi-floor-plan</v-icon>
                  <span class="text-subtitle-1 font-weight-bold text-teal">面積資訊</span>
                </div>
                <v-row dense>
                  <v-col cols="6" sm="4" md="2">
                    <div class="text-caption text-grey-darken-1">房屋總面積</div>
                    <div class="text-body-2 font-weight-bold">{{ formatNumber(editingData.area_house_ping, 2) }} 坪</div>
                    <div class="text-caption text-grey">{{ formatNumber(editingData.area_house_sqm, 2) }} m²</div>
                  </v-col>
                  <v-col cols="6" sm="4" md="2">
                    <div class="text-caption text-grey-darken-1">公設比</div>
                    <div class="text-body-2 font-weight-bold">{{ formatPercentage(editingData.common_area_ratio) }}
                    </div>
                  </v-col>
                  <v-col cols="6" sm="4" md="2">
                    <div class="text-caption text-grey-darken-1">主建物</div>
                    <div class="text-body-2 font-weight-bold">{{ formatNumber(editingData.area_main_ping, 2) }} 坪</div>
                  </v-col>
                  <v-col cols="6" sm="4" md="2">
                    <div class="text-caption text-grey-darken-1">附屬建物</div>
                    <div class="text-body-2 font-weight-bold">{{ formatNumber(editingData.area_ancillary_ping, 2) }} 坪
                    </div>
                  </v-col>
                  <v-col cols="6" sm="4" md="2">
                    <div class="text-caption text-grey-darken-1">共用部分</div>
                    <div class="text-body-2 font-weight-bold">{{ formatNumber(editingData.area_common_ping, 2) }} 坪
                    </div>
                  </v-col>
                  <v-col v-if="editingData.area_terrace_ping > 0" cols="6" sm="4" md="2">
                    <div class="text-caption text-grey-darken-1">露臺</div>
                    <div class="text-body-2 font-weight-bold">{{ formatNumber(editingData.area_terrace_ping, 2) }} 坪
                    </div>
                  </v-col>
                </v-row>
              </v-card>

              <v-card variant="outlined" class="mb-4 pa-3 bg-grey-lighten-5" style="border-color: #ddd;">
                <div class="d-flex align-center mb-2">
                  <v-icon color="brown" class="mr-2">mdi-map-marker-multiple</v-icon>
                  <span class="text-subtitle-1 font-weight-bold" style="color: #795548;">土地標的清冊</span>
                </div>
                <LandParcelsPanel
                  v-model="editingData.landParcels"
                  :editable="true"
                />
              </v-card>

              <v-card variant="outlined" class="mb-4 pa-3 bg-grey-lighten-5" style="border-color: #ddd;">
                <div class="d-flex align-center justify-space-between mb-2">
                  <div class="d-flex align-center">
                    <v-icon color="primary" class="mr-2">mdi-cash-multiple</v-icon>
                    <span class="text-subtitle-1 font-weight-bold text-primary">價格設定</span>
                  </div>
                  <v-btn v-if="!isPriceEditable" size="small" variant="outlined" color="primary" @click="isPriceEditable = true">
                    <v-icon left size="small">mdi-pencil</v-icon> 修改價格
                  </v-btn>
                </div>
                <v-row>
                  <v-col cols="12" md="3">
                    <v-text-field v-model="editingData.price_list_house_total" label="房屋表價" suffix="萬" type="number"
                      variant="outlined" :bg-color="!isPriceEditable ? '#f5f5f5' : 'white'" class="input-price-list"
                      :readonly="!isPriceEditable"
                      :rules="[val => val >= 0 || '金額不可小於 0']" :hint="`單價: ${editingListUnitPrice} 萬/坪`"
                      persistent-hint></v-text-field>
                  </v-col>

                  <v-col cols="12" md="3" v-if="viewMode === 'sales'">
                    <v-text-field v-model="editingData.price_floor_house_total" label="房屋底價" suffix="萬" type="number"
                      variant="outlined" :bg-color="!isPriceEditable ? '#f5f5f5' : 'white'" class="input-price-floor"
                      :readonly="!isPriceEditable"
                      :hint="`單價: ${editingFloorUnitPrice} 萬/坪`" persistent-hint></v-text-field>
                  </v-col>

                  <v-col cols="12" md="3" v-if="viewMode === 'sales' && editingData.area_terrace_ping > 0">
                    <v-text-field v-model="editingData.price_floor_house_only" label="房屋底價(不含露臺)" suffix="萬"
                      type="number" variant="outlined" bg-color="white" class="input-price-floor"
                      :hint="`單價: ${editingFloorHouseOnlyUnitPrice} 萬/坪`" persistent-hint></v-text-field>
                  </v-col>

                  <v-col cols="12" md="3" v-if="viewMode === 'sales' && editingData.area_terrace_ping > 0">
                    <v-text-field v-model="editingData.price_floor_terrace" label="露臺底價" suffix="萬" type="number"
                      variant="outlined" bg-color="white" class="input-price-floor"
                      :hint="`露臺 ${formatNumber(editingData.area_terrace_ping, 2)} 坪 · 單價: ${editingFloorTerraceUnitPrice} 萬/坪`"
                      persistent-hint></v-text-field>
                  </v-col>

                  <v-col cols="12" md="3" v-if="viewMode === 'sales'" class="d-flex align-center">
                    <v-switch v-model="editingData.isPreferredPayment" label="優付" color="primary" hide-details
                      density="compact" class="ml-2" inset></v-switch>
                  </v-col>
                </v-row>
                <v-row>
                  <v-col cols="12">
                    <v-textarea v-model="editingData.priceRemarks" label="備註" rows="2" auto-grow
                      variant="outlined" :bg-color="!isPriceEditable ? '#f5f5f5' : 'white'"
                      :readonly="!isPriceEditable" density="compact"
                      hint="輔助說明價格資訊（例如：含家具、特殊條件等）" persistent-hint></v-textarea>

                    <!-- 備註圖片：上傳區（僅編輯狀態顯示）+ 縮圖列 -->
                    <div class="mt-2">
                      <input ref="priceRemarkFileInputRef" type="file" multiple
                        accept="image/jpeg,image/png,image/webp" style="display:none"
                        @change="handlePriceRemarkFileSelect" />
                      <div v-if="isPriceEditable" class="d-flex align-center flex-wrap mb-2">
                        <v-btn size="small" variant="outlined" color="primary" prepend-icon="mdi-image-plus"
                          :disabled="priceRemarkTotalCount >= 5" @click="triggerPriceRemarkFilePicker">
                          新增圖片 ({{ priceRemarkTotalCount }}/5)
                        </v-btn>
                        <span class="text-caption text-grey ml-2">支援 JPG / PNG / WEBP，單張最大 5MB</span>
                      </div>
                      <div v-if="priceRemarkCombinedImages.length > 0" class="d-flex flex-wrap" style="gap:8px;">
                        <div v-for="img in priceRemarkCombinedImages" :key="img.previewId"
                          class="price-remark-thumb">
                          <v-img :src="img.previewUrl" width="80" height="80" cover class="rounded"
                            style="cursor: zoom-in;" @click="openPriceRemarkFullscreen(img.previewUrl)"></v-img>
                          <v-btn v-if="isPriceEditable" icon="mdi-close" size="x-small" color="error"
                            class="price-remark-thumb-remove" @click.stop="removePriceRemarkImage(img)"></v-btn>
                          <v-chip v-if="img.type === 'pending'" size="x-small" color="warning"
                            class="price-remark-thumb-pending" variant="flat">待上傳</v-chip>
                        </div>
                      </div>
                    </div>
                  </v-col>
                </v-row>
              </v-card>

              <!-- 房土比設定（兩比例加總必須=100） -->
              <v-card variant="outlined" class="mb-4 pa-3 bg-grey-lighten-5" style="border-color: #ddd;">
                <div class="d-flex align-center mb-2">
                  <v-icon color="deep-orange" class="mr-2">mdi-chart-donut</v-icon>
                  <span class="text-subtitle-1 font-weight-bold" style="color: #e65100;">房土比</span>
                  <v-spacer />
                  <v-chip v-if="editingRatioSum > 0 && Math.abs(editingRatioSum - 100) > 0.001"
                    size="small" color="error" variant="tonal">
                    加總 {{ editingRatioSum }}% ≠ 100%，無法儲存
                  </v-chip>
                  <v-chip v-else-if="editingRatioSum === 100"
                    size="small" color="success" variant="tonal" prepend-icon="mdi-check-circle">
                    加總 100%
                  </v-chip>
                </div>
                <v-row dense>
                  <v-col cols="12" md="3">
                    <v-text-field
                      v-model="editingData.housePriceRatio"
                      label="房屋價款比例"
                      suffix="%"
                      type="number"
                      min="0" max="100" step="0.01"
                      variant="outlined" density="compact"
                      hide-details="auto" />
                  </v-col>
                  <v-col cols="12" md="3">
                    <v-text-field
                      v-model="editingData.landPriceRatio"
                      label="土地價款比例"
                      suffix="%"
                      type="number"
                      min="0" max="100" step="0.01"
                      variant="outlined" density="compact"
                      hide-details="auto" />
                  </v-col>
                  <v-col cols="12" md="6" class="d-flex align-center">
                    <div class="text-caption text-grey-darken-1">
                      依建案公式即時計算：
                      <span class="ml-2">房屋價款 <strong>{{ formatNumber(priceCalcResult.housePrice, priceCalcDecimals.house) }}</strong> 萬</span>
                      <span class="ml-2">土地價款 <strong>{{ formatNumber(priceCalcResult.landPrice, priceCalcDecimals.land) }}</strong> 萬</span>
                    </div>
                  </v-col>
                </v-row>
              </v-card>

              <SalesInfoForm v-if="editingData" v-model="editingData" :statusOptions="statusOptions"
                :personnelOptions="personnelOptions" :allSalesImages="allProjectImages"
                :allParkingData="allData['車位'] || []" :projectName="projectName" :project-id="projectId"
                :view-mode="props.viewMode" @request-open-slide="$emit('request-open-slide')"
                @parking-updated="handleParkingUpdate" :contractTypeOptions="props.contractTypes"
                :firstPurchaseOptions="firstPurchaseOptions" />
            </template>

            <template v-else>
              <div v-if="unitData" class="pa-2">
                <v-row>
                  <v-col cols="12" md="4">
                    <div v-if="householdImages.length > 0" class="carousel-viewer-container">
                      <v-carousel v-model="currentImageIndex" height="auto" hide-delimiters show-arrows="hover">
                        <v-carousel-item v-for="image in householdImages" :key="image.id">
                          <v-img :src="image.downloadURL" class="main-carousel-image" contain
                            @click="openFullscreenViewer" style="cursor: zoom-in;"></v-img>
                        </v-carousel-item>
                      </v-carousel>
                      <div class="small-thumbnails-strip">
                        <div v-for="(image, index) in householdImages" :key="image.id" class="small-thumbnail-wrapper"
                          :class="{ 'thumbnail-active': index === currentImageIndex }"
                          @click="currentImageIndex = index">
                          <v-img :src="image.downloadURL" aspect-ratio="16/9" cover></v-img>
                        </div>
                      </div>
                    </div>
                    <div v-else class="info-section d-flex align-center justify-center text-grey-darken-1"
                      style="height: 100%; min-height: 250px;">
                      <span><v-icon class="mr-2">mdi-image-multiple-outline</v-icon>此戶別尚無圖片</span>
                    </div>
                  </v-col>

                  <v-col cols="12" md="4">
                    <div class="info-section">
                      <div class="section-title"> {{ unitData.unitId }} 面積資訊</div>
                      <div class="total-area-card">
                        <div class="area-summary-item">
                          <div>
                            <div class="total-area-title">房屋總面積</div>
                            <div class="total-area-value">{{ formatNumber(unitData.area_house_ping, 2) }} 坪</div>
                            <div class="total-area-subtitle">{{ formatNumber(unitData.area_house_sqm, 2) }} m²</div>
                          </div>
                        </div>
                        <v-divider vertical class="mx-4"></v-divider>
                        <div class="area-summary-item">
                          <div>
                            <div class="total-area-title">公設比</div>
                            <div class="total-area-value">{{ formatPercentage(unitData.common_area_ratio) }}</div>
                            <div class="total-area-subtitle">&nbsp;</div>
                          </div>
                        </div>
                      </div>
                      <div class="area-details mt-3">
                        <div class="area-group">
                          <div class="area-group-title"> <v-icon size="small" class="mr-1">mdi-home</v-icon>建物面積明細</div>
                          <div class="area-item-header"><span>項目</span><span>坪數</span><span>m²</span></div>
                          <div class="area-item"><span>主建物 (室內)</span><span class="area-ping-value">{{
                            formatNumber(unitData.area_main_ping, 2) }}</span><span>{{
                                formatNumber(unitData.area_main_sqm, 2) }}</span></div>
                          <div class="area-item"><span>附屬建物 (陽台)</span><span class="area-ping-value">{{
                            formatNumber(unitData.area_ancillary_ping, 2) }}</span><span>{{
                                formatNumber(unitData.area_ancillary_sqm, 2) }}</span></div>
                          <div class="area-item"><span>共用部分 (公設)</span><span class="area-ping-value">{{
                            formatNumber(unitData.area_common_ping, 2) }}</span><span>{{
                                formatNumber(unitData.area_common_sqm, 2) }}</span></div>
                          <div class="area-item"><span>露臺 (不計坪)</span><span class="area-ping-value">{{
                            formatNumber(unitData.area_terrace_ping, 2) }}</span></div>
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
                            <span class="area-ping-value">{{ formatNumber(unitData.land_share_ping, 2) }}</span>
                            <span>{{ formatNumber(unitData.land_share_sqm, 2) }}</span>
                          </div>
                        </div>
                        <LandParcelsPanel
                          class="mt-2"
                          :model-value="unitData.landParcels || []"
                          :editable="false"
                        />
                      </div>
                    </div>
                  </v-col>

                  <v-col cols="12" md="4">
                    <div class="info-section">
                      <div class="section-title d-flex justify-space-between align-center">
                        <span>{{ unitData.unitId }} 價格資訊</span>
                        <v-chip v-if="unitData.isPreferredPayment" color="primary" size="small" label
                          class="font-weight-bold">
                          <v-icon start icon="mdi-check-circle" size="small"></v-icon>
                          優付
                        </v-chip>
                      </div>

                      <v-row dense>
                        <v-col cols="12">
                          <div class="price-block mb-2">
                            <div class="price-block-title d-flex align-center">
                              <span>房價</span>
                              <v-menu v-if="unitData.priceRemarks || (unitData.priceRemarkImages && unitData.priceRemarkImages.length > 0)"
                                location="bottom start" :close-on-content-click="false" max-width="400">
                                <template v-slot:activator="{ props: activatorProps }">
                                  <v-btn v-bind="activatorProps" icon="mdi-note-text-outline" size="x-small"
                                    variant="text" color="primary" class="ml-1"></v-btn>
                                </template>
                                <v-card max-width="400">
                                  <v-card-text v-if="unitData.priceRemarks" class="text-body-2"
                                    style="white-space: pre-wrap;">{{ unitData.priceRemarks }}</v-card-text>
                                  <div v-if="unitData.priceRemarkImages && unitData.priceRemarkImages.length > 0"
                                    class="d-flex flex-wrap pa-3"
                                    :class="{ 'pt-0': unitData.priceRemarks }" style="gap:8px;">
                                    <v-img v-for="img in unitData.priceRemarkImages" :key="img.path || img.url"
                                      :src="img.url" width="80" height="80" cover class="rounded"
                                      style="cursor: zoom-in;"
                                      @click="openPriceRemarkFullscreen(img.url)"></v-img>
                                  </div>
                                </v-card>
                              </v-menu>
                            </div>
                            <template v-if="props.viewMode === 'quote' && unitData.salesStatus_quote === '已售'">
                              <div v-if="!showHiddenPriceQuote" class="price-block-value text-grey">
                                已售不提供報價
                              </div>
                              <div v-else class="price-block-value text-red-darken-2">
                                {{ formatNumber(unitData.price_list_house_total) }} <span
                                  class="price-block-currency">萬</span>
                              </div>
                              <div v-if="!showHiddenPriceQuote" class="price-block-unit">&nbsp;</div>
                              <div v-else class="price-block-unit">({{ calculatedUnitPrice }} 萬/坪)</div>
                            </template>
                            <template v-else>
                              <div class="price-block-value text-red-darken-2">
                                {{ formatNumber(unitData.price_list_house_total) }} <span
                                  class="price-block-currency">萬</span>
                              </div>
                              <div class="price-block-unit">({{ calculatedUnitPrice }} 萬/坪)</div>
                            </template>

                            <!-- ✅ [新增] 表價拆分明細：與底價側一致的呈現 -->
                            <div v-if="canShowListSplit" class="price-split">
                              <div class="price-split-hint">含露臺，明細如下</div>
                              <div class="price-split-row">
                                <div class="price-split-part">
                                  <div class="price-split-label">房屋(不含露臺)</div>
                                  <div class="price-split-value">
                                    {{ formatNumber(unitData.price_list_house_only) }} <span
                                      class="price-split-currency">萬</span>
                                  </div>
                                  <div class="price-split-unit">{{ calculatedListHouseOnlyUnitPrice }} 萬/坪</div>
                                </div>
                                <div class="price-split-plus">＋</div>
                                <div class="price-split-part">
                                  <div class="price-split-label">
                                    露臺
                                    <span class="price-split-area">{{ formatNumber(unitData.area_terrace_ping, 2)
                                      }} 坪</span>
                                  </div>
                                  <div class="price-split-value">
                                    {{ formatNumber(unitData.price_list_terrace) }} <span
                                      class="price-split-currency">萬</span>
                                  </div>
                                  <div class="price-split-unit">{{ calculatedListTerraceUnitPrice }} 萬/坪</div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </v-col>
                        <!-- ✅ [優化] 底價整合區塊：總底價為主，有露臺時於下方併入房屋/露臺拆分明細 -->
                        <v-col v-if="viewMode === 'sales'" cols="12">
                          <div class="price-block mb-2">
                            <div class="price-block-title">房屋底價</div>
                            <div class="price-block-value text-grey-darken-2">
                              {{ formatNumber(unitData.price_floor_house_total) }} <span
                                class="price-block-currency">萬</span>
                            </div>
                            <div class="price-block-unit">({{ calculatedBaseUnitPrice }} 萬/坪)</div>

                            <div v-if="unitData.area_terrace_ping > 0" class="price-split">
                              <div class="price-split-hint">含露臺，明細如下</div>
                              <div class="price-split-row">
                                <div class="price-split-part">
                                  <div class="price-split-label">房屋(不含露臺)</div>
                                  <div class="price-split-value">
                                    {{ formatNumber(unitData.price_floor_house_only) }} <span
                                      class="price-split-currency">萬</span>
                                  </div>
                                  <div class="price-split-unit">{{ calculatedFloorHouseOnlyUnitPrice }} 萬/坪</div>
                                </div>
                                <div class="price-split-plus">＋</div>
                                <div class="price-split-part">
                                  <div class="price-split-label">
                                    露臺
                                    <span class="price-split-area">{{ formatNumber(unitData.area_terrace_ping, 2)
                                      }} 坪</span>
                                  </div>
                                  <div class="price-split-value">
                                    {{ formatNumber(unitData.price_floor_terrace) }} <span
                                      class="price-split-currency">萬</span>
                                  </div>
                                  <div class="price-split-unit">{{ calculatedFloorTerraceUnitPrice }} 萬/坪</div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </v-col>
                        <v-col v-if="viewMode === 'sales' && unitData.price_transaction_house" cols="12">
                          <div class="price-block">
                            <div class="price-block-title">房屋成交價</div>
                            <div class="price-block-value text-green-darken-2">
                              {{ formatNumber(unitData.price_transaction_house) }} <span
                                class="price-block-currency">萬</span>
                            </div>
                            <div class="price-block-unit">({{ calculatedTransactionUnitPrice }} 萬/坪)</div>
                          </div>
                        </v-col>
                      </v-row>
                    </div>
                  </v-col>
                </v-row>

                <div v-if="viewMode === 'sales'">
                  <v-divider class="my-4"></v-divider>
                  <v-row>
                    <v-col cols="12" md="4">
                      <div class="info-section">
                        <div class="section-title"> {{ unitData.unitId }} 成交總覽</div>
                        <v-list dense>
                          <v-list-item title="房屋成交"
                            :subtitle="`${formatNumber(houseTransactionPrice)} 萬`"></v-list-item>
                          <v-list-item title="車位成交"
                            :subtitle="`${formatNumber(parkingTotalTransactionPrice)} 萬`"></v-list-item>
                          <v-list-item
                            class="font-weight-bold total-price-item"><v-list-item-title>成交總價</v-list-item-title><template
                              v-slot:append><span class="highlight-price-final">{{
                                formatNumber(grandTotalTransactionPrice) }} 萬</span></template></v-list-item>
                          <!-- 特殊合約（毛胚/配套）：顯示配套拆分附註 -->
                          <template v-if="isSpecialContract">
                            <v-list-item class="package-annotation" title="配套房屋總價">
                              <template v-slot:append>
                                <span>{{ formatNumber(packageHouseTotal) }} 萬</span>
                              </template>
                            </v-list-item>
                            <v-list-item class="package-annotation" title="配套價格">
                              <template v-slot:append>
                                <span>{{ formatNumber(packagePrice) }} 萬</span>
                              </template>
                            </v-list-item>
                          </template>
                          <!-- 房土比 + 依公式計算的房屋/土地價款（可收合） -->
                          <v-list-item class="ratio-row ratio-row-toggle"
                            @click="showRatioBreakdown = !showRatioBreakdown"
                            :ripple="false" style="cursor: pointer;">
                            <v-list-item-title class="d-flex align-center">
                              <v-icon size="small" class="mr-1">
                                {{ showRatioBreakdown ? 'mdi-chevron-down' : 'mdi-chevron-right' }}
                              </v-icon>
                              <span>房土比</span>
                              <v-chip v-if="ratioSum > 0 && Math.abs(ratioSum - 100) > 0.001"
                                size="x-small" color="error" variant="tonal" class="ml-2">
                                加總 {{ ratioSum }}% ≠ 100%
                              </v-chip>
                            </v-list-item-title>
                            <template v-slot:append>
                              <span class="text-body-2">
                                房 <strong>{{ priceCalcSource?.housePriceRatio ?? 0 }}%</strong>
                                / 土 <strong>{{ priceCalcSource?.landPriceRatio ?? 0 }}%</strong>
                              </span>
                            </template>
                          </v-list-item>
                          <template v-if="showRatioBreakdown">
                            <v-list-item title="房屋價款" class="ratio-detail">
                              <template v-slot:append>
                                <span v-if="priceCalcResult.error" class="text-caption text-error">{{ priceCalcResult.error }}</span>
                                <span v-else>{{ formatNumber(priceCalcResult.housePrice, priceCalcDecimals.house) }} 萬</span>
                              </template>
                            </v-list-item>
                            <v-list-item title="土地價款" class="ratio-detail">
                              <template v-slot:append>
                                <span v-if="priceCalcResult.error" class="text-caption text-error">—</span>
                                <span v-else>{{ formatNumber(priceCalcResult.landPrice, priceCalcDecimals.land) }} 萬</span>
                              </template>
                            </v-list-item>
                          </template>
                          <v-list-item
                            class="font-weight-bold total-price-item"><v-list-item-title>合計底價</v-list-item-title><template
                              v-slot:append><span class="highlight-price">{{ formatNumber(totalFloorPrice) }}
                                萬</span></template></v-list-item>
                          <v-list-item title="溢差價" class="premium-price-item"><template v-slot:append><span
                                :class="pricePremium >= 0 ? 'text-success' : 'text-error'"
                                style="font-size: 1.1rem; font-weight: 600;">{{ formatNumber(pricePremium, 0) }}
                                萬</span></template></v-list-item>
                        </v-list>
                        <div class="section-subtitle mt-4">持有車位</div>
                        <v-alert v-if="assignedParkingLots.length === 0" type="info" variant="tonal" dense
                          class="mt-2">此戶別未購買車位</v-alert>
                        <div v-else class="parking-list">
                          <div v-for="(parking, index) in assignedParkingLots" :key="index" class="parking-item">
                            <p class="parking-title">車位 {{ index + 1 }}: {{ parking['車位編號'] }} ({{ parking['車位尺寸'] }})
                            </p>
                            <p>底價: {{ formatNumber(parking['車位底價']) }} 萬</p>
                            <p>成交: {{ formatNumber(parking['車位成交價']) }} 萬</p>
                          </div>
                        </div>
                      </div>
                    </v-col>
                    <v-col cols="12" md="4">
                      <div class="info-section">
                        <div class="section-title">{{ unitData.unitId }} 銷售資訊</div>
                        <v-list dense>
                          <v-list-item title="銷控狀態" :subtitle="unitData.salesStatus_backend || '-'"></v-list-item>

                          <v-list-item title="物件類型" :subtitle="unitData.propertyType || '-'"></v-list-item>

                          <v-list-item title="銷售人員" :subtitle="formatSalespersons(unitData.salesperson)"></v-list-item>
                          <v-list-item title="合約方式" :subtitle="unitData.contractType || '-'"></v-list-item>
                          <v-list-item title="是否首購" :subtitle="formatBoolean(unitData.isFirstTimeBuyer)"></v-list-item>
                          <v-list-item title="小訂日期" :subtitle="formatDate(unitData.payment_deposit_date)"></v-list-item>
                          <v-list-item title="補足日期" :subtitle="formatDate(unitData.payment_complete_date)"></v-list-item>
                          <v-list-item title="簽約日期"
                            :subtitle="formatDate(unitData.payment_contract_date)"></v-list-item>
                          <v-list-item title="申報書序號" :subtitle="unitData.reportNo || '-'"></v-list-item>
                          <v-list-item title="備註"><v-list-item-subtitle style="white-space: pre-wrap;">{{
                              unitData.remarks || '-'
                              }}</v-list-item-subtitle></v-list-item>
                        </v-list>
                      </div>
                    </v-col>
                    <v-col cols="12" md="4">
                      <div class="info-section">
                        <div class="section-title">{{ unitData.unitId }} 買方資訊</div>
                        <v-list dense>
                          <v-list-item title="姓名" :subtitle="unitData.buyerName || '-'"></v-list-item>
                          <v-list-item title="電話" :subtitle="unitData.buyerPhone || '-'"></v-list-item>
                          <v-list-item title="Email" :subtitle="unitData.buyerEmail || '-'"></v-list-item>
                          <v-list-item title="身分證號" :subtitle="unitData.buyerIdNumber || '-'"></v-list-item>
                          <v-list-item title="通訊地址" :subtitle="formatAddress(unitData, 'Mailing')"></v-list-item>
                          <v-list-item title="戶籍地址" :subtitle="formatAddress(unitData, 'Permanent')"></v-list-item>
                          <v-list-item title="出生年月日 (西元)"
                            :subtitle="formatDate(unitData.buyerDateOfBirth)"></v-list-item>

                          <v-list-item title="出生年月日 (民國)"
                            :subtitle="formatROCDate(unitData.buyerDateOfBirth)"></v-list-item> </v-list>
                      </div>
                    </v-col>
                  </v-row>
                </div>
              </div>
              <div v-else class="text-center pa-5">
                <p>沒有可顯示的資料。</p>
              </div>
            </template>
          </v-window-item>

          <v-window-item value="aiAssistant">
            <SalesBotChat v-if="tab === 'aiAssistant'" :project-id="projectId" :unit-data="unitData"
              :all-parking-data="allData['車位'] || []" :all-units-data="allData['戶別'] || []" />
          </v-window-item>

        </v-window>
      </v-card-text>

      <div class="footer-section custom-footer">

        <v-divider></v-divider>

        <v-card-actions>

          <template v-if="!isMobile">
            <v-spacer></v-spacer>
            <template v-if="isEditing">
              <v-btn color="grey-darken-1" variant="text" @click="cancelEditing">取消</v-btn>
              <v-btn color="success" variant="flat" @click="saveChanges" :loading="isSaving" size="large">儲存變更</v-btn>
            </template>
            <template v-else>
              <v-btn v-if="viewMode === 'sales' && isSold" color="error" variant="outlined"
                @click="openCancelPurchaseDialog">
                <v-icon left>mdi-account-cancel-outline</v-icon>
                辦理退戶
              </v-btn>
              <v-btn v-if="viewMode === 'sales'" color="deep-purple" variant="outlined"
                @click="openRealPriceReportDialog">
                <v-icon left>mdi-file-document-arrow-right-outline</v-icon>
                實價登錄
              </v-btn>
              <v-btn v-if="viewMode === 'sales' && unitData && unitData.driveFolderUrl" color="primary" variant="flat"
                :href="unitData.driveFolderUrl" target="_blank">
                <v-icon left>mdi-folder-google-drive</v-icon>
                {{ unitData.unitId }} 資料夾
              </v-btn>
              <v-btn v-if="viewMode === 'sales'" color="success" variant="flat" @click="downloadExcel">
                <v-icon left>mdi-microsoft-excel</v-icon>
                下載本戶資料
              </v-btn>
              <v-btn color="success" variant="flat" @click="handleAddToQuote" :disabled="!canAddToQuote">
                <v-icon left>mdi-home-plus-outline</v-icon>
                {{ addToQuoteButtonText }}
              </v-btn>
              <v-btn v-if="viewMode === 'sales'" color="secondary" variant="flat" @click="openPaymentSettings">
                <v-icon left>mdi-cash-register</v-icon>
                付款表設定
              </v-btn>
              <v-btn color="primary" variant="text" @click="close">關閉</v-btn>
            </template>
          </template>

          <template v-if="isMobile">
            <div class="d-flex justify-space-around w-100 mobile-actions-container">

              <template v-if="isEditing">
                <v-btn stacked variant="text" @click="cancelEditing" class="flex-grow-1">
                  <v-icon>mdi-cancel</v-icon>
                  <span class="text-caption">取消</span>
                </v-btn>
                <v-btn stacked variant="text" color="success" @click="saveChanges" :loading="isSaving"
                  class="flex-grow-1">
                  <v-icon>mdi-check-circle-outline</v-icon>
                  <span class="text-caption">儲存</span>
                </v-btn>
              </template>
              <template v-else>
                <!-- 主要操作：加入報價 -->
                <v-btn stacked variant="text" color="success" class="flex-grow-1" @click="handleAddToQuote"
                  :disabled="!canAddToQuote">
                  <v-icon>mdi-plus-box-outline</v-icon>
                  <span class="text-caption">{{ addToQuoteButtonText }}</span>
                </v-btn>
                <!-- 主要操作：付款表設定 -->
                <v-btn v-if="viewMode === 'sales'" stacked variant="text" class="flex-grow-1"
                  @click="openPaymentSettings">
                  <v-icon>mdi-cash-register</v-icon>
                  <span class="text-caption">付款表</span>
                </v-btn>
                <!-- 更多操作：退戶 / 實價登錄 / 資料夾 / 下載 -->
                <v-menu location="top end" :close-on-content-click="true">
                  <template #activator="{ props: menuProps }">
                    <v-btn v-bind="menuProps" stacked variant="text" class="flex-grow-1">
                      <v-icon>mdi-dots-horizontal</v-icon>
                      <span class="text-caption">更多</span>
                    </v-btn>
                  </template>
                  <v-list density="compact">
                    <v-list-item v-if="viewMode === 'sales' && isSold" @click="openCancelPurchaseDialog"
                      prepend-icon="mdi-account-cancel-outline" title="辦理退戶" />
                    <v-list-item v-if="viewMode === 'sales'" @click="openRealPriceReportDialog"
                      prepend-icon="mdi-file-document-arrow-right-outline" title="實價登錄" />
                    <v-list-item v-if="viewMode === 'sales' && unitData && unitData.driveFolderUrl"
                      :href="unitData.driveFolderUrl" target="_blank"
                      prepend-icon="mdi-folder-google-drive" :title="`${unitData.unitId} 資料夾`" />
                    <v-list-item v-if="viewMode === 'sales'" @click="downloadExcel"
                      prepend-icon="mdi-microsoft-excel" title="下載本戶資料" />
                  </v-list>
                </v-menu>
                <!-- 關閉 -->
                <v-btn stacked variant="text" class="flex-grow-1" @click="close">
                  <v-icon>mdi-close</v-icon>
                  <span class="text-caption">關閉</span>
                </v-btn>
              </template>
            </div>
          </template>

        </v-card-actions>
      </div>
    </v-card>
  </v-dialog>

  <CancelPurchaseDialog :show="showCancelDialog" @update:show="showCancelDialog = $event" title="確認辦理退戶"
    :message="cancelDialogMessage" confirm-text="確認退戶" confirm-color="error" :loading="isSaving"
    @confirm="handleConfirmCancelPurchase" @cancel="showCancelDialog = false" />

  <RealPriceReportExportDialog
    v-if="showRealPriceReportDialog"
    :show="showRealPriceReportDialog"
    :project-id="projectId"
    :project-name="projectName"
    :unit-data="enrichedUnitData || unitData"
    :price-formulas="priceFormulas"
    @update:show="showRealPriceReportDialog = $event" />

  <ConfirmationDialog :show="showPriceChangeDialog" @update:show="showPriceChangeDialog = $event" title="確認變更價格"
    message="您已修改房屋表價或房屋底價，是否確定要變更並儲存？" confirm-text="確定儲存" confirm-color="primary" :loading="isSaving"
    @confirm="executeSaveChanges" @cancel="showPriceChangeDialog = false" />

  <SalesStatusNotifyDialog
    :show="notifyDialog.show" @update:show="notifyDialog.show = $event"
    :project-id="notifyDialog.projectId" :project-name="notifyDialog.projectName"
    :unit-id="notifyDialog.unitId"
    :old-status="notifyDialog.oldStatus" :new-status="notifyDialog.newStatus"
    :trigger-type="notifyDialog.triggerType" :operator-name="notifyDialog.operatorName"
    :recipients="notifyDialog.recipients"
    @finished="onNotifyFinished" />

  <PaymentSettings v-if="paymentSettingsDialog" :show="paymentSettingsDialog"
    @update:show="paymentSettingsDialog = $event" :unit-data="enrichedUnitData" :project-name="projectName"
    :project-id="projectId" :all-data="allData" :contract-types="props.contractTypes"
    @request-open-slide="$emit('request-open-slide')" @parking-updated="handleParkingUpdate" />

  <v-dialog v-model="fullscreenViewerDialog" fullscreen hide-overlay>
    <v-card class="fullscreen-viewer" :class="{ 'measuring': measureActive }">
      <!-- 縮放外層容器 (接收 wheel / drag 事件) -->
      <div class="fullscreen-zoom-wrapper" ref="zoomWrapperRef" @wheel.prevent="onViewerWheel"
        @mousedown="onViewerMouseDown" @dblclick="onViewerDblClick" :style="{ cursor: viewerCursor }">
        <!-- 丈量工具: 圖片 + Canvas 疊加容器 (受 transform 控制) -->
        <div class="fullscreen-image-measure-container" ref="measureContainerRef" :style="viewerTransformStyle">
          <img v-if="currentImage" ref="measureImgRef" :src="currentImage.downloadURL" class="fullscreen-image-native"
            draggable="false" @load="onMeasureImgLoad" />
          <!-- 丈量畫布 (疊加於圖片正上方) -->
          <canvas ref="measureCanvasRef" class="measure-canvas"></canvas>
          <!-- 已完成區塊的刪除按鈕 (Vue 渲染，確保 scoped CSS 正確套用) -->
          <div class="measure-buttons-container" :style="measureOverlayStyle">
            <button v-for="(btn, idx) in deleteButtonPositions" :key="'del-' + idx" class="fp-delete-btn"
              :style="{ left: btn.left, top: btn.top }" :title="'刪除此區塊'"
              @click.stop="deleteMeasureBlock(idx)">✕</button>
          </div>
          <!-- 浮動完成按鈕容器 -->
          <div ref="floatingBtnWrapperRef" class="measure-buttons-container">
            <button ref="btnFloatingFinishRef" class="fp-floating-btn" @click.stop="finishMeasureBlock">✔ 完成此區塊</button>
          </div>
        </div>
      </div>

      <!-- 縮放比例指示器 -->
      <transition name="fade">
        <div v-if="viewerScale > 1.01" class="zoom-indicator">
          {{ Math.round(viewerScale * 100) }}%
        </div>
      </transition>

      <template v-if="householdImages.length > 1">
        <v-btn class="image-nav-btn prev" icon="mdi-chevron-left" variant="flat" size="large"
          @click.stop="prevImage"></v-btn>
        <v-btn class="image-nav-btn next" icon="mdi-chevron-right" variant="flat" size="large"
          @click.stop="nextImage"></v-btn>
      </template>

      <v-btn class="close-btn" icon="mdi-close" variant="flat" @click="closeFullscreenViewer"></v-btn>

      <!-- 丈量工具列 -->
      <div class="fp-measure-tools" v-show="fullscreenViewerDialog">
        <div class="fp-measure-panel" v-show="measureActive">
          <!-- 面板標題 -->
          <div class="fp-measure-panel-title">📐 丈量工具</div>
          <!-- 模式切換列 -->
          <div class="fp-measure-row">
            <label>模式選擇:</label>
            <div class="fp-measure-btn-group">
              <button :class="{ active: measureMode === 'calibrate' }"
                @click="setMeasureMode('calibrate')">尺寸校準</button>
              <button :class="{ active: measureMode === 'distance' }" @click="setMeasureMode('distance')">測量距離</button>
              <button :class="{ active: measureMode === 'area' }" @click="setMeasureMode('area')">測量面積</button>
            </div>
          </div>
          <!-- 校準輸入 -->
          <div class="fp-measure-row" v-show="measureMode === 'calibrate'">
            <label>參照線距離 (cm):</label>
            <input type="number" v-model.number="measureCalibrateCm" min="1" step="1" style="width: 80px;"
              @change="onCalibrateCmChange" />
          </div>
          <!-- 清除按鈕 -->
          <div class="fp-measure-row">
            <button class="fp-measure-clear-btn" @click="clearAllMeasurements">🗑️ 重劃 / 全部清除</button>
          </div>
          <!-- 結果顯示區 -->
          <div class="fp-measure-result" v-html="measureResultText"></div>
        </div>
        <button class="fp-measure-toggle" @click="toggleMeasureMode">
          {{ measureActive ? '❌ 關閉丈量' : '📏 開啟丈量' }}
        </button>
      </div>

      <v-expand-x-transition>
        <div v-if="showInfoOverlay" class="fullscreen-info-sidebar pa-4">
          <v-card variant="flat" color="rgba(255, 255, 255, 1)" class="pa-4 overlay-scroll-container" rounded="lg">
            <div class="d-flex justify-space-between align-center mb-4">
              <div class="text-h6 font-weight-bold text-primary">{{ unitData.unitId }} 完整資訊</div>
              <v-btn icon="mdi-chevron-left" variant="text" size="small" @click="showInfoOverlay = false"></v-btn>
            </div>

            <div class="total-area-card mb-4" style="background-color: #f5f5f5;">
              <div class="area-summary-item">
                <div>
                  <div class="total-area-title">房屋總面積</div>
                  <div class="total-area-value-sm">{{ formatNumber(unitData.area_house_ping, 2) }} 坪</div>
                  <div class="total-area-subtitle">{{ formatNumber(unitData.area_house_sqm, 2) }} m²</div>
                </div>
              </div>
              <v-divider vertical class="mx-3"></v-divider>
              <div class="area-summary-item">
                <div>
                  <div class="total-area-title">公設比</div>
                  <div class="total-area-value-sm">{{ formatPercentage(unitData.common_area_ratio) }}</div>
                </div>
              </div>
            </div>

            <div class="area-details mb-4">
              <div class="area-group">
                <div class="area-group-title text-primary"><v-icon size="small" class="mr-1">mdi-home</v-icon>建物面積明細
                </div>
                <div class="area-item-header"><span>項目</span><span>坪數</span><span>m²</span></div>
                <div class="area-item"><span>主建物</span><span class="area-ping-value-sm">{{
                  formatNumber(unitData.area_main_ping, 2) }}</span><span>{{ formatNumber(unitData.area_main_sqm, 2)
                    }}</span></div>
                <div class="area-item"><span>附屬建物</span><span class="area-ping-value-sm">{{
                  formatNumber(unitData.area_ancillary_ping, 2) }}</span><span>{{
                      formatNumber(unitData.area_ancillary_sqm, 2) }}</span></div>
                <div class="area-item"><span>共用部分</span><span class="area-ping-value-sm">{{
                  formatNumber(unitData.area_common_ping, 2) }}</span><span>{{ formatNumber(unitData.area_common_sqm,
                    2)
                    }}</span></div>
                <div v-if="unitData.area_terrace_ping > 0" class="area-item"><span>露臺</span><span
                    class="area-ping-value-sm">{{ formatNumber(unitData.area_terrace_ping, 2) }}</span><span>-</span>
                </div>
              </div>
            </div>

            <div class="area-details mb-4">
              <div class="area-group">
                <div class="area-group-title text-primary"><v-icon size="small" class="mr-1">mdi-earth</v-icon>土地持分
                </div>
                <div class="area-item-header"><span>項目</span><span>坪數</span><span>m²</span></div>
                <div class="area-item"><span>持分面積</span><span class="area-ping-value-sm">{{
                  formatNumber(unitData.land_share_ping, 2) }}</span><span>{{ formatNumber(unitData.land_share_sqm, 2)
                    }}</span></div>
              </div>
            </div>

            <v-divider class="my-4"></v-divider>

            <div class="price-block-overlay pa-3 rounded-lg text-center"
              style="border: 1px solid #ddd; background-color: #fff;">
              <div class="text-subtitle-2 text-grey-darken-1">房價</div>
              <div class="text-h5 font-weight-bold text-red-darken-2">
                {{ formatNumber(unitData.price_list_house_total) }} 萬
              </div>
              <div class="text-caption text-grey-darken-1">({{ calculatedUnitPrice }} 萬/坪)</div>
            </div>
          </v-card>
        </div>
      </v-expand-x-transition>

      <div class="fullscreen-actions">
        <v-btn class="mr-2" :color="showInfoOverlay ? 'primary' : 'grey-darken-3'" variant="flat" elevation="4"
          @click="showInfoOverlay = !showInfoOverlay">
          <v-icon left>{{ showInfoOverlay ? 'mdi-information' : 'mdi-information-outline' }}</v-icon>
          面積價格
        </v-btn>

        <!-- 舊測量工具按鈕 (暫時隱藏，已有新丈量工具) -->
        <v-btn v-if="false" color="blue-darken-2" variant="flat" elevation="4" @click="openSizingTool">
          <v-icon left>mdi-ruler-square-compass</v-icon>
          測量工具
        </v-btn>

        <v-btn v-if="currentImage" color="green" variant="flat" elevation="4" class="ml-2" @click="printImage">
          <v-icon left>mdi-printer</v-icon>
          列印
        </v-btn>
      </div>
    </v-card>
  </v-dialog>

  <v-dialog v-model="sizingToolDialog" fullscreen hide-overlay transition="dialog-bottom-transition">
    <FloorplanSizingTool v-if="sizingToolDialog && projectId && unitData" :project-id="projectId"
      :unit-id="unitData.unitId" @close="sizingToolDialog = false" />
  </v-dialog>

  <!-- ✅ [新增] 備註圖片：全螢幕預覽 -->
  <v-dialog v-model="isFullscreenImageOpen" fullscreen hide-overlay transition="dialog-bottom-transition">
    <v-card class="price-remark-fullscreen-card" @click="isFullscreenImageOpen = false">
      <v-btn icon="mdi-close" size="large" color="white" variant="text"
        class="price-remark-fullscreen-close" @click.stop="isFullscreenImageOpen = false"></v-btn>
      <img v-if="fullscreenImageUrl" :src="fullscreenImageUrl" class="price-remark-fullscreen-img"
        @click.stop="isFullscreenImageOpen = false" />
    </v-card>
  </v-dialog>

</template>

<script setup>
import FloorplanSizingTool from '@/views/FloorplanSizingTool.vue';
import { ref, watch, computed, defineProps, defineEmits, onUnmounted, onMounted, nextTick } from 'vue';
import { useDisplay } from 'vuetify';
import { useUserStore } from '@/store/user';
import { IMAGE_PROXY_BASE_URL, updateSalesData, cancelPurchase, updateParkingLot } from '@/api';
import SalesInfoForm from './SalesInfoForm.vue';
import { normalizeSalespersons, formatSalespersons } from '@/utils/salespersonUtils';
import SalesBotChat from './SalesBotChat.vue';
import LandParcelsPanel from './LandParcelsPanel.vue';
import { computeHouseLandPrices, buildDefaultFormulas, isSpecialContractType } from '@/composables/usePriceFormula';
import { useQuoteStore } from '@/store/quoteStore';
import PaymentSettings from '@/views/PaymentSettings.vue';
import ConfirmationDialog from './ConfirmationDialog.vue';
import CancelPurchaseDialog from './CancelPurchaseDialog.vue';
import SalesStatusNotifyDialog from './SalesStatusNotifyDialog.vue';
import RealPriceReportExportDialog from './RealPriceReport/ExportDialog.vue';
import { useToast, POSITION } from 'vue-toastification';
import * as XLSX from 'xlsx';
import { storage } from '@/firebase';
import { ref as storageRef, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';

const userStore = useUserStore();
const showCancelDialog = ref(false);
const showPriceChangeDialog = ref(false); // ✅ [新增] 控制價格變更提醒框
const showRealPriceReportDialog = ref(false);

function openRealPriceReportDialog() {
  if (!props.unitData) {
    toast.error('無戶別資料可匯出');
    return;
  }
  if (!props.unitData.building) {
    toast.error('此戶別缺少棟別資訊，無法匯出實價登錄 JSON');
    return;
  }
  showRealPriceReportDialog.value = true;
}
const isPriceEditable = ref(false); // ✅ [新增] 控制價格欄位是否可編輯

// ✅ [新增] 備註圖片：上傳/刪除狀態（延遲到儲存才動 Storage）
const PRICE_REMARK_MAX_IMAGES = 5;
const PRICE_REMARK_MAX_SIZE_MB = 5;
const PRICE_REMARK_ACCEPT_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const priceRemarkPendingFiles = ref([]); // 待上傳的本地檔案：{ previewId, file, previewUrl }
const priceRemarkPendingDeletions = ref([]); // 待刪除的已存在圖片：[{ url, path, ... }]
const priceRemarkFileInputRef = ref(null);
const isFullscreenImageOpen = ref(false);
const fullscreenImageUrl = ref('');

const savingText = ref('儲存中，請稍候...');
const toast = useToast(); // ✅ [打勾] 2. 實例化 toast
const showInfoOverlay = ref(false); // 控制全螢幕下的資訊面板顯示

// 1. [新增] 定義暫存變數
const tempParkingSelection = ref(null);      // 用於「付款表設定」暫存
const editingParkingSelection = ref(null);   // 用於「修改銷控」暫存

// 🔐 [隱藏功能] 連續按 8 次 'a' 鍵來顯示已售不提供報價
const keySequence = ref('');
const showHiddenPriceQuote = ref(false);
const handleKeyPress = (e) => {
  if (e.key.toLowerCase() === 'a') {
    keySequence.value += 'a';
    if (keySequence.value.length > 8) {
      keySequence.value = keySequence.value.slice(-8);
    }
    if (keySequence.value.length === 8 && keySequence.value === 'aaaaaaaa') {
      showHiddenPriceQuote.value = !showHiddenPriceQuote.value;
      keySequence.value = '';
    }
  } else {
    keySequence.value = '';
  }
};



// ✅ [新增] 編輯模式即時計算 - 表價單價
const editingListUnitPrice = computed(() => {
  if (!editingData.value) return '0.00';
  const price = Number(editingData.value.price_list_house_total) || 0;
  const area = Number(editingData.value.area_house_ping) || 0;
  return area > 0 ? (price / area).toFixed(2) : '0.00';
});

// ✅ [新增] 編輯模式即時計算 - 底價單價
const editingFloorUnitPrice = computed(() => {
  if (!editingData.value) return '0.00';
  const price = Number(editingData.value.price_floor_house_total) || 0;
  const area = Number(editingData.value.area_house_ping) || 0;
  return area > 0 ? (price / area).toFixed(2) : '0.00';
});

// ✅ 編輯模式即時計算 - 房屋(不含露臺)底價單價
const editingFloorHouseOnlyUnitPrice = computed(() => {
  if (!editingData.value) return '0.00';
  const price = Number(editingData.value.price_floor_house_only) || 0;
  const area = Number(editingData.value.area_house_ping) || 0;
  return area > 0 ? (price / area).toFixed(2) : '0.00';
});

// ✅ 編輯模式即時計算 - 露臺底價單價
const editingFloorTerraceUnitPrice = computed(() => {
  if (!editingData.value) return '0.00';
  const price = Number(editingData.value.price_floor_terrace) || 0;
  const area = Number(editingData.value.area_terrace_ping) || 0;
  return area > 0 ? (price / area).toFixed(2) : '0.00';
});


const isSold = computed(() => {
  return props.unitData && props.unitData.salesStatus_backend;
});

const cancelDialogMessage = computed(() => {
  if (!props.unitData) return '您確定要辦理退戶嗎？';

  const unitId = `【${props.unitData.unitId}】`;
  const buyerName = props.unitData.buyerName || '—';
  const salesperson = formatSalespersons(props.unitData.salesperson, '、', '—');
  const parkingInfo = props.unitData['持有車位'] && props.unitData['持有車位'].length > 0
    ? props.unitData['持有車位'].map(p => p['車位編號'] || p.spotId || p).join('、')
    : '無';

  return `您確定要為 ${unitId} 辦理退戶嗎？<br><br>` +
    `<strong>客戶資訊：</strong><br>` +
    `客戶姓名：${buyerName}<br>` +
    `銷售人員：${salesperson}<br>` +
    `持有車位：${parkingInfo}<br><br>` +
    `系統會先將完整資料備份至「退戶資料」集合，再清除銷售與客戶資料並釋出車位。`;
});

function openCancelPurchaseDialog() {
  showCancelDialog.value = true;
}

// 銷控狀態通知對話框狀態
const notifyDialog = ref({
  show: false,
  projectId: '',
  projectName: '',
  unitId: '',
  oldStatus: null,
  newStatus: null,
  triggerType: 'update',
  operatorName: '',
  recipients: [],
  pendingAfterFinish: null, // 'data-updated-close' | null
});

function openNotifyDialog(notification, triggerType, afterFinish) {
  notifyDialog.value = {
    show: true,
    projectId: props.projectId,
    projectName: props.projectName,
    unitId: props.unitData?.unitId || '',
    oldStatus: notification.oldStatus || null,
    newStatus: notification.newStatus || null,
    triggerType,
    operatorName: userStore.user?.name || '',
    recipients: notification.eligibleRecipients || [],
    pendingAfterFinish: afterFinish || null,
  };
}

function onNotifyFinished(payload) {
  const action = notifyDialog.value.pendingAfterFinish;
  notifyDialog.value.show = false;
  if (action === 'data-updated-close') {
    emit('data-updated');
    close();
  }
  if (payload?.action === 'sent' && payload?.result) {
    const { sent = 0, failed = 0 } = payload.result;
    if (sent > 0 && failed === 0) toast.success(`已發送 ${sent} 筆通知`);
    else if (sent > 0 && failed > 0) toast.warning(`發送 ${sent} 筆、失敗 ${failed} 筆`);
    else if (failed > 0) toast.error(`通知全部失敗（${failed} 筆），請查 notificationLogs`);
  }
}

async function handleConfirmCancelPurchase(data) {
  if (!props.unitData || !userStore.user) {
    alert('缺少必要資訊，無法執行退戶。');
    return;
  }

  // 解構 data 物件，提取 reasons 和 date
  const selectedReasons = data?.reasons || [];
  const cancellationDate = data?.date;

  if (!cancellationDate) {
    alert('請選擇退戶日期');
    return;
  }

  isSaving.value = true;
  savingText.value = '正在辦理退戶...';
  showCancelDialog.value = false;
  try {
    console.log('🔍 [UnitDetailModal] 準備執行退戶:', {
      projectName: props.projectName,
      projectId: props.projectId,
      unitId: props.unitData.unitId,
      operatorName: userStore.user.name,
      cancelReasons: selectedReasons,
      cancellationDate: cancellationDate
    });

    const result = await cancelPurchase(
      props.projectName,
      props.projectId,
      props.unitData.unitId,
      userStore.user.name,
      selectedReasons,
      cancellationDate
    );
    if (result.status !== 'success') {
      throw new Error(result.message);
    }

    // 退戶成功 → 若有候選通知人員，開啟通知對話框
    const notif = result.notification;
    if (notif?.statusChanged && (notif.eligibleRecipients?.length > 0)) {
      toast.success('退戶成功');
      openNotifyDialog(notif, 'cancel', 'data-updated-close');
    } else {
      toast.success(notif?.statusChanged ? '退戶成功（無可通知人員）' : '退戶成功');
      emit('data-updated');
      close();
    }
  } catch (error) {
    console.error('退戶失敗:', error);
    alert(`退戶失敗: ${error.message}`);
  } finally {
    isSaving.value = false;
    savingText.value = '儲存中，請稍候...';
  }
}

const { mobile: isMobile } = useDisplay();
const quoteStore = useQuoteStore();

const props = defineProps({
  show: { type: Boolean, required: true },
  unitData: { type: Object, default: () => null },
  viewMode: { type: String, default: 'sales' },
  allData: { type: Object, default: () => ({}) },
  projectName: { type: String, required: true },
  contractTypes: { type: Array, default: () => [] },
  projectId: { type: String, required: true }, // ✅ 修正：新增這一行
  priceFormulas: { type: Object, default: () => null }, // 房土比計算公式（建案層級）
});

const emit = defineEmits(['update:show', 'data-updated', 'request-open-slide']);

const sizingToolDialog = ref(false);




const currentImageIndex = ref(0);
const fullscreenViewerDialog = ref(false);
const allProjectImages = computed(() => props.allData['銷控圖片'] || []);

const householdImages = computed(() => {
  // 🛠️ DEBUG: 添加調試信息
  if (import.meta.env.DEV) {
    console.log('🖼️ [UnitDetailModal] 圖片調試信息:', {
      unitId: props.unitData?.unitId,
      unitSalesImages: props.unitData?.salesImages,
      allProjectImagesCount: allProjectImages.value.length,
      allProjectImagesSample: allProjectImages.value.slice(0, 3).map(img => ({
        imageName: img.imageName,
        hasDownloadURL: !!img.downloadURL
      }))
    });
  }

  if (!props.unitData?.salesImages?.length || !allProjectImages.value.length) {
    if (import.meta.env.DEV) {
      console.log('🖼️ [UnitDetailModal] 圖片載入條件不滿足:', {
        hasSalesImages: !!props.unitData?.salesImages?.length,
        hasAllProjectImages: !!allProjectImages.value.length
      });
    }
    return [];
  }

  const imageMap = new Map(allProjectImages.value.map(img => [img.imageName, img]));
  const matchedImages = props.unitData.salesImages
    .map(name => imageMap.get(name))
    .filter(Boolean);

  // 🛠️ DEBUG: 記錄匹配結果
  if (import.meta.env.DEV) {
    console.log('🖼️ [UnitDetailModal] 圖片匹配結果:', {
      requestedImages: props.unitData.salesImages,
      matchedCount: matchedImages.length,
      matchedImages: matchedImages.map(img => img.imageName)
    });
  }

  return matchedImages;
});

const currentImage = computed(() => {
  if (householdImages.value.length === 0) return null;
  return householdImages.value[currentImageIndex.value];
});



const tab = ref('info');
const isEditing = ref(false);
const isSaving = ref(false);
const editingData = ref(null);
const paymentSettingsDialog = ref(false);

const calculatedUnitPrice = computed(() => {
  const price = props.unitData?.price_list_house_total;
  const area = props.unitData?.area_house_ping;
  if (price && area > 0) {
    return formatNumber(price / area, 2);
  }
  return 'N/A';
});

// ✅ [新增] 表價拆分明細顯示條件：需有露臺；報價模式的已售戶在未解鎖前不揭露價格
const canShowListSplit = computed(() => {
  if (!(Number(props.unitData?.area_terrace_ping) > 0)) return false;
  const isHiddenSoldQuote = props.viewMode === 'quote'
    && props.unitData?.salesStatus_quote === '已售'
    && !showHiddenPriceQuote.value;
  return !isHiddenSoldQuote;
});

// ✅ [新增] 表價拆分單價：房屋(不含露臺) / 露臺，與底價側對稱
const calculatedListHouseOnlyUnitPrice = computed(() => {
  const price = props.unitData?.price_list_house_only;
  const area = props.unitData?.area_house_ping;
  if (price && area > 0) {
    return formatNumber(price / area, 2);
  }
  return 'N/A';
});

const calculatedListTerraceUnitPrice = computed(() => {
  const price = props.unitData?.price_list_terrace;
  const area = props.unitData?.area_terrace_ping;
  if (price && area > 0) {
    return formatNumber(price / area, 2);
  }
  return 'N/A';
});

const calculatedBaseUnitPrice = computed(() => {
  const price = props.unitData?.price_floor_house_total;
  const area = props.unitData?.area_house_ping;
  if (price && area > 0) {
    return formatNumber(price / area, 2);
  }
  return 'N/A';
});

const calculatedFloorHouseOnlyUnitPrice = computed(() => {
  const price = props.unitData?.price_floor_house_only;
  const area = props.unitData?.area_house_ping;
  if (price && area > 0) {
    return formatNumber(price / area, 2);
  }
  return 'N/A';
});

const calculatedFloorTerraceUnitPrice = computed(() => {
  const price = props.unitData?.price_floor_terrace;
  const area = props.unitData?.area_terrace_ping;
  if (price && area > 0) {
    return formatNumber(price / area, 2);
  }
  return 'N/A';
});

const calculatedTransactionUnitPrice = computed(() => {
  const price = props.unitData?.price_transaction_house;
  const area = props.unitData?.area_house_ping;
  if (price && area > 0) {
    return formatNumber(price / area, 2);
  }
  return 'N/A';
});



// 2. [優化] 修改 enrichedUnitData，確保編輯模式下 UI 優先讀取暫存資料
const enrichedUnitData = computed(() => {
  if (!props.unitData) return null;

  // 如果正在編輯，直接返回 editingData (它包含了 handleParkingUpdate 更新後的持有車位)
  if (isEditing.value && editingData.value) {
    return JSON.parse(JSON.stringify(editingData.value));
  }

  const enriched = JSON.parse(JSON.stringify(props.unitData));

  // 處理「付款表設定」暫存模式 (非編輯狀態)
  if (!isEditing.value && tempParkingSelection.value) {
    enriched['持有車位'] = tempParkingSelection.value.map(p => ({
      ...p,
      '車位編號': p.spotId,
      '車位尺寸': p.size || '標準',
      '車位成交價': p.price_transaction,
      '車位底價': p.price_floor || p['底價'] || p['車位底價'] || 0,
    }));
    return enriched;
  }

  // 預設模式：讀取資料庫原始關聯
  const allParkingLotsForProject = props.allData?.['車位'] || [];
  const currentUnitId = props.unitData.unitId;

  const assignedParkings = allParkingLotsForProject
    .filter(parkingLot => parkingLot.buyerUnitId === currentUnitId)
    .map(parkingLot => ({
      ...parkingLot,
      '車位編號': parkingLot.spotId || parkingLot['車位編號'],
      '車位尺寸': parkingLot.size || parkingLot['車位尺寸'] || '標準',
      // ✅ [修復] 確保原始資料也能正確對到底價
      '車位底價': parkingLot.price_floor || parkingLot['底價'] || parkingLot['車位底價'] || 0,
      '車位成交價': parkingLot.price_transaction !== undefined && parkingLot.price_transaction !== null
        ? parkingLot.price_transaction
        : (parkingLot.price_list || parkingLot['表價'] || 0),
    }));

  enriched['持有車位'] = assignedParkings;
  return enriched;
});

const assignedParkingLots = computed(() => enrichedUnitData.value?.['持有車位'] || []);
const houseTransactionPrice = computed(() => Number(props.unitData?.price_transaction_house) || 0);

// 房土比明細（房屋/土地價款）預設收合，使用者點擊展開
const showRatioBreakdown = ref(false);

// 合約方式為「毛胚/配套」等特殊類型時，顯示配套拆分附註
// SPECIAL_CONTRACT_TYPES 統一由 usePriceFormula.js 維護（房土比計算也會引用）
const isSpecialContract = computed(() => isSpecialContractType(props.unitData?.contractType));
const packageHouseTotal = computed(() => Number(props.unitData?.price_package_deal) || 0);
const packagePrice = computed(() => {
  const total = Number(props.unitData?.price_transaction_total) || grandTotalTransactionPrice.value || 0;
  return total - packageHouseTotal.value;
});

// ── 房土比 & 計算結果（依建案公式即時計算，不寫回 Firestore） ──
// 編輯中以 editingData 為依據（讓使用者改比例可立即看到結果），否則以 enrichedUnitData
const priceCalcSource = computed(() => {
  if (isEditing.value && editingData.value) return editingData.value;
  return enrichedUnitData.value || props.unitData;
});
const priceCalcResult = computed(() => {
  if (!priceCalcSource.value) return { housePrice: 0, landPrice: 0, error: '' };
  return computeHouseLandPrices(priceCalcSource.value, props.priceFormulas);
});
// 依公式進位設定取得小數位數，用於顯示時的 formatNumber
const priceCalcDecimals = computed(() => {
  const fallback = buildDefaultFormulas();
  const h = props.priceFormulas?.housePriceFormula?.rounding?.decimals
    ?? fallback.housePriceFormula.rounding.decimals;
  const l = props.priceFormulas?.landPriceFormula?.rounding?.decimals
    ?? fallback.landPriceFormula.rounding.decimals;
  return { house: Number(h) || 0, land: Number(l) || 0 };
});
const ratioSum = computed(() => {
  const h = Number(priceCalcSource.value?.housePriceRatio) || 0;
  const l = Number(priceCalcSource.value?.landPriceRatio) || 0;
  return Math.round((h + l) * 100) / 100;  // 避免 0.1+0.2 浮點誤差
});
// 編輯中 editingData 的加總（供驗證 / 標籤顯示）
const editingRatioSum = computed(() => {
  if (!isEditing.value || !editingData.value) return 0;
  const h = Number(editingData.value.housePriceRatio) || 0;
  const l = Number(editingData.value.landPriceRatio) || 0;
  return Math.round((h + l) * 100) / 100;
});
const parkingTotalTransactionPrice = computed(() => {
  if (!assignedParkingLots.value || assignedParkingLots.value.length === 0) return 0;
  return assignedParkingLots.value.reduce((total, parking) => total + (Number(parking['車位成交價']) || 0), 0);
});
const grandTotalTransactionPrice = computed(() => houseTransactionPrice.value + parkingTotalTransactionPrice.value);

const houseFloorPrice = computed(() => Number(props.unitData?.price_floor_house_total) || 0);
const parkingTotalFloorPrice = computed(() => {
  if (!assignedParkingLots.value || assignedParkingLots.value.length === 0) return 0;
  return assignedParkingLots.value.reduce((total, parking) => total + (Number(parking['車位底價']) || 0), 0);
});
const totalFloorPrice = computed(() => houseFloorPrice.value + parkingTotalFloorPrice.value);
const pricePremium = computed(() => {
  if (grandTotalTransactionPrice.value > 0 && totalFloorPrice.value > 0) {
    return grandTotalTransactionPrice.value - totalFloorPrice.value;
  }
  return 0;
});

const statusOptions = computed(() => (props.allData['參數'] || []).map(p => p.statusName));

const personnelOptions = computed(() => {
  const list = props.allData['銷售人員'] || [];

  // 複製並排序
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

const contractTypeOptionsFromDB = computed(() => {
  if (props.projectSettings && Array.isArray(props.projectSettings.contractTypes)) {
    return props.projectSettings.contractTypes;
  }
  return [];
});

const buyerInfoOptions = computed(() => {
  const options = {};
  const buyerInfoSheet = props.allData['買方其他資訊'] || [];
  if (buyerInfoSheet.length > 0) {
    const headers = Object.keys(buyerInfoSheet[0]);
    headers.forEach(key => {
      options[key] = [...new Set(buyerInfoSheet.map(row => row[key]).filter(Boolean))];
    });
  }
  return options;
});


function openPaymentSettings() {
  paymentSettingsDialog.value = true;
}

// ✅ [新增] 備註圖片：合併已存在圖片 + 待上傳圖片，給編輯模式預覽用
const priceRemarkCombinedImages = computed(() => {
  const existing = (editingData.value?.priceRemarkImages || []).map(img => ({
    type: 'existing',
    previewId: img.path || img.url,
    previewUrl: img.url,
    raw: img,
  }));
  const pending = priceRemarkPendingFiles.value.map(item => ({
    type: 'pending',
    previewId: item.previewId,
    previewUrl: item.previewUrl,
    raw: item,
  }));
  return [...existing, ...pending];
});

const priceRemarkTotalCount = computed(() => priceRemarkCombinedImages.value.length);

function triggerPriceRemarkFilePicker() {
  if (priceRemarkFileInputRef.value) {
    priceRemarkFileInputRef.value.value = ''; // 允許重複選同一檔案
    priceRemarkFileInputRef.value.click();
  }
}

function handlePriceRemarkFileSelect(event) {
  const files = Array.from(event.target.files || []);
  if (files.length === 0) return;

  const remainingQuota = PRICE_REMARK_MAX_IMAGES - priceRemarkTotalCount.value;
  if (remainingQuota <= 0) {
    toast.error(`圖片數量已達上限 ${PRICE_REMARK_MAX_IMAGES} 張`);
    return;
  }

  const accepted = [];
  for (const file of files) {
    if (accepted.length >= remainingQuota) {
      toast.warning(`超過上限，僅保留前 ${remainingQuota} 張`);
      break;
    }
    if (!PRICE_REMARK_ACCEPT_TYPES.includes(file.type)) {
      toast.error(`不支援的格式：${file.name}（僅支援 JPG / PNG / WEBP）`);
      continue;
    }
    if (file.size > PRICE_REMARK_MAX_SIZE_MB * 1024 * 1024) {
      toast.error(`檔案過大：${file.name}（單張不可超過 ${PRICE_REMARK_MAX_SIZE_MB}MB）`);
      continue;
    }
    accepted.push({
      previewId: `pending_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      file,
      previewUrl: URL.createObjectURL(file),
    });
  }

  if (accepted.length > 0) {
    priceRemarkPendingFiles.value.push(...accepted);
  }
}

function removePriceRemarkImage(item) {
  if (item.type === 'pending') {
    const idx = priceRemarkPendingFiles.value.findIndex(p => p.previewId === item.previewId);
    if (idx !== -1) {
      try { URL.revokeObjectURL(priceRemarkPendingFiles.value[idx].previewUrl); } catch (e) { /* noop */ }
      priceRemarkPendingFiles.value.splice(idx, 1);
    }
  } else if (item.type === 'existing') {
    const list = editingData.value?.priceRemarkImages || [];
    const idx = list.findIndex(img => (img.path || img.url) === item.previewId);
    if (idx !== -1) {
      const removed = list[idx];
      list.splice(idx, 1);
      // 標記為待刪除（按「儲存變更」才真正刪除 Storage）
      if (removed?.path) priceRemarkPendingDeletions.value.push(removed);
    }
  }
}

function openPriceRemarkFullscreen(url) {
  if (!url) return;
  fullscreenImageUrl.value = url;
  isFullscreenImageOpen.value = true;
}

function clearPriceRemarkLocalState() {
  for (const item of priceRemarkPendingFiles.value) {
    try { URL.revokeObjectURL(item.previewUrl); } catch (e) { /* noop */ }
  }
  priceRemarkPendingFiles.value = [];
  priceRemarkPendingDeletions.value = [];
}

async function uploadPriceRemarkPendingImages() {
  if (priceRemarkPendingFiles.value.length === 0) return [];
  const uploaded = [];
  for (const item of priceRemarkPendingFiles.value) {
    const safeName = item.file.name.replace(/[^\w.\-]/g, '_');
    const path = `unitDetails/${props.projectId}/${props.unitData.unitId}/priceRemarks/${Date.now()}_${Math.random().toString(36).slice(2, 8)}_${safeName}`;
    const fileRef = storageRef(storage, path);
    const snapshot = await uploadBytes(fileRef, item.file);
    const url = await getDownloadURL(snapshot.ref);
    uploaded.push({ url, path, name: item.file.name, size: item.file.size, type: item.file.type });
  }
  return uploaded;
}

async function deletePriceRemarkMarkedImages() {
  for (const img of priceRemarkPendingDeletions.value) {
    if (!img?.path) continue;
    try {
      await deleteObject(storageRef(storage, img.path));
    } catch (e) {
      // 容錯：物件可能不存在，記錄但不阻斷儲存流程
      console.warn('刪除備註圖片失敗:', img.path, e);
    }
  }
}

function startEditing() {
  isPriceEditable.value = false; // ✅ 每次進入編輯模式時，重置為預設不可編輯狀態
  editingData.value = JSON.parse(JSON.stringify(props.unitData || {}));
  if (!editingData.value) {
    editingData.value = {};
  }
  // 土地標的清冊：舊資料無此欄位時預設為空陣列，確保 v-model 綁定可運作
  if (!Array.isArray(editingData.value.landParcels)) {
    editingData.value.landParcels = [];
  }
  // ✅ [新增] 備註圖片陣列初始化 + 重置 pending 狀態
  if (!Array.isArray(editingData.value.priceRemarkImages)) {
    editingData.value.priceRemarkImages = [];
  }
  clearPriceRemarkLocalState();

  // ✅ START: 新增 - 將 Timestamp 欄位轉換為 JavaScript Date 物件
  if (props.unitData) {
    // 輔助函式：將 Timestamp 物件轉換為 Date 物件
    const timestampToDate = (ts) => {
      if (ts && typeof ts.toDate === 'function') {
        return ts.toDate();
      }
      // 如果它已經是 Date 物件或可識別的字串/數字，則保持原樣（雖然 JSON.stringify 已處理大部分）
      return ts;
    };

    editingData.value.payment_deposit_date = timestampToDate(props.unitData.payment_deposit_date);
    editingData.value.payment_complete_date = timestampToDate(props.unitData.payment_complete_date);
    editingData.value.payment_contract_date = timestampToDate(props.unitData.payment_contract_date);

    // ✅ [新增] 初始化優付欄位，若原資料無此欄位預設為 false
    editingData.value.isPreferredPayment = props.unitData.isPreferredPayment || false;

    // ✅ [新增] 初始化是否首購欄位，僅在明確為 false 時才設為 false，其餘（含 null/undefined）預設為 true
    editingData.value.isFirstTimeBuyer = props.unitData.isFirstTimeBuyer === false ? false : true;
  }
  // ✅ END: 新增

  const currentUnitId = props.unitData ? props.unitData.unitId : null;
  const allParkingLotsForProject = props.allData && props.allData['車位'] ? props.allData['車位'] : [];

  const existingParkings = enrichedUnitData.value ? enrichedUnitData.value['持有車位'] : [];

  if (existingParkings && existingParkings.length > 0) {
    editingData.value['持有車位'] = JSON.parse(JSON.stringify(existingParkings));
  } else if (!editingData.value['持有車位']) {
    editingData.value['持有車位'] = [];
  }

  isEditing.value = true;
}

function cancelEditing() {
  isEditing.value = false;
  editingData.value = null;
  // ✅ [新增] 取消編輯時釋放預覽 URL、丟棄 pending 變動，不影響 Storage
  clearPriceRemarkLocalState();
}

// 5. [修改] saveChanges：儲存成功後才執行車位寫入
async function saveChanges() {
  if (!editingData.value) return;

  // 房土比驗證：兩比例加總必須=100（允許 0/0 代表未設定）
  const h = Number(editingData.value.housePriceRatio) || 0;
  const l = Number(editingData.value.landPriceRatio) || 0;
  const sum = Math.round((h + l) * 100) / 100;
  if (sum !== 0 && Math.abs(sum - 100) > 0.001) {
    toast.error(`房土比加總 ${sum}% 不等於 100%，無法儲存。請調整「房屋價款比例」或「土地價款比例」。`);
    return;
  }

  // ✅ 檢查價格是否被變更
  const originalPriceList = Number(props.unitData?.price_list_house_total) || 0;
  const newPriceList = Number(editingData.value?.price_list_house_total) || 0;
  const originalPriceFloor = Number(props.unitData?.price_floor_house_total) || 0;
  const newPriceFloor = Number(editingData.value?.price_floor_house_total) || 0;

  if (originalPriceList !== newPriceList || originalPriceFloor !== newPriceFloor) {
    showPriceChangeDialog.value = true; // 打開確認彈窗
    return;
  }

  // 若沒變更，直接儲存
  await executeSaveChanges();
}

async function executeSaveChanges() {
  showPriceChangeDialog.value = false; // 關閉彈窗
  isSaving.value = true;
  savingText.value = '儲存中，請稍候...';
  try {
    // ✅ [新增] 先上傳備註待上傳圖片，將 URL 合併到 priceRemarkImages
    if (priceRemarkPendingFiles.value.length > 0) {
      savingText.value = '正在上傳備註圖片...';
      const uploaded = await uploadPriceRemarkPendingImages();
      if (!Array.isArray(editingData.value.priceRemarkImages)) {
        editingData.value.priceRemarkImages = [];
      }
      editingData.value.priceRemarkImages.push(...uploaded);
      // 釋放 ObjectURL（即使後續流程失敗，URL 也應釋放）
      for (const item of priceRemarkPendingFiles.value) {
        try { URL.revokeObjectURL(item.previewUrl); } catch (e) { /* noop */ }
      }
      priceRemarkPendingFiles.value = [];
      savingText.value = '儲存中，請稍候...';
    }

    const data = editingData.value;
    const payload = {
      projectName: props.projectName,
      projectId: props.projectId,
      unitId: props.unitData.unitId,
      data: data
    };

    const result = await updateSalesData(payload);
    if (result.status !== 'success') throw new Error(result.message);

    // ✅ [新增] Firestore 寫入成功後，才從 Storage 真正刪除已標記的舊備註圖片
    if (priceRemarkPendingDeletions.value.length > 0) {
      await deletePriceRemarkMarkedImages();
      priceRemarkPendingDeletions.value = [];
    }

    // ✅ [關鍵] 戶別資料儲存成功後，才寫入暫存的車位變動
    if (editingParkingSelection.value) {
      console.log('🚗 正在執行延遲的車位資料庫更新...');
      await commitParkingChanges(props.unitData.unitId, editingParkingSelection.value);
    } else {
      // 車位未變動，仍需同步戶別欄位（後台狀態/銷售人員/買方姓名）至持有車位
      await syncOwnedParkingFields(props.unitData.unitId);
    }

    // 銷控狀態若有變動且有候選通知人員 → 開啟通知對話框，由其關閉時收尾；否則直接收尾
    const notif = result.notification;
    if (notif?.statusChanged && (notif.eligibleRecipients?.length > 0)) {
      toast.success('儲存成功');
      openNotifyDialog(notif, 'update', 'data-updated-close');
    } else {
      if (notif?.statusChanged) toast.info('儲存成功（無可通知人員）');
      else toast.success('儲存成功');
      emit('data-updated');
      close();
    }
  } catch (error) {
    console.error('儲存失敗:', error);
    alert(`儲存失敗: ${error.message}`);
  } finally {
    isSaving.value = false;
    editingParkingSelection.value = null; // 清除暫存
  }
}

// 取得目前單位的銷控狀態
const currentSalesStatus = computed(() => {
  if (!props.unitData) return '';
  // 直接返回 backend 的銷控狀態，不設置預設值
  return props.unitData.salesStatus_backend || '';
});

// 檢查單位是否可以加入報價
const canAddToQuote = computed(() => {
  if (!props.unitData) return false;

  // 在報價模式下檢查銷售狀態 (🔐 隱藏功能：已售可加報價)
  if (props.viewMode === 'quote' && props.unitData.salesStatus_quote === '已售' && !showHiddenPriceQuote.value) {
    return false;
  }

  // 檢查必要的價格資訊
  const hasValidPrice = props.unitData.price_list_house_total > 0;

  return hasValidPrice;
});

// 動態計算加入報價按鈕的文字
const addToQuoteButtonText = computed(() => {
  if (!props.unitData) return '加入報價';

  // 在銷控模式下，只有當有狀態時才顯示
  if (props.viewMode === 'sales' && currentSalesStatus.value) {
    return `加入報價 (${currentSalesStatus.value})`;
  }

  return '加入報價';
});

// 處理加入報價
function handleAddToQuote() {
  if (!props.unitData) {
    toast.error('無法加入報價：缺少單位資料', {
      position: POSITION.BOTTOM_CENTER
    });
    return;
  }

  if (!canAddToQuote.value) {
    if (props.viewMode === 'quote' && props.unitData.salesStatus_quote === '已售') {
      toast.error('報價模式下無法加入已售出的單位', {
        position: POSITION.BOTTOM_CENTER
      });
    } else {
      toast.error('此單位目前無法加入報價', {
        position: POSITION.BOTTOM_CENTER
      });
    }
    return;
  }

  // 確保必要資料的完整性
  console.log('Adding unit with area:', props.unitData.area_house_ping);
  const unitData = {
    ...props.unitData,
    房屋總表價: props.unitData.price_list_house_total,
    戶別: props.unitData.unitId,
    area_house_ping: Number(props.unitData.area_house_ping),  // 主要面積，確保轉換為數字
    area_main_ping: props.unitData.area_main_ping,  // 主建物面積
    area_ancillary_ping: props.unitData.area_ancillary_ping,  // 附屬建物面積
    area_common_ping: props.unitData.area_common_ping,  // 共用部分面積
    area_terrace_ping: props.unitData.area_terrace_ping,  // 露臺面積
    common_area_ratio: props.unitData.common_area_ratio,  // 公設比
    area_main_sqm: props.unitData.area_main_sqm,  // 主建物平方公尺
    area_ancillary_sqm: props.unitData.area_ancillary_sqm,  // 附屬建物平方公尺
    area_common_sqm: props.unitData.area_common_sqm,  // 共用部分平方公尺
  };

  // ✅ [打勾] 3. 捕捉 addItem 的回傳值
  const success = quoteStore.addItem(unitData);

  // ✅ [打勾] 4. 根據回傳值顯示 toast
  if (success) {
    toast.success(`戶別 ${unitData.戶別} 成功加入報價`, {
      position: POSITION.BOTTOM_CENTER
    });
  }
}

const firstPlan = computed(() => hasFloorplans.value ? props.unitData.floorplans[0] : null);
const proxiedFirstImageUrl = computed(() => {
  if (firstPlan.value && firstPlan.value.type === 'image' && firstPlan.value.url) {
    return `${IMAGE_PROXY_BASE_URL}/api/image-proxy?url=${encodeURIComponent(firstPlan.value.url)}`;
  }
  return '';
});

const shouldHidePrice = computed(() => props.viewMode === 'quote' && props.unitData?.salesStatus_quote === '已售');

const nextImage = () => {
  if (householdImages.value.length > 1) {
    currentImageIndex.value = (currentImageIndex.value + 1) % householdImages.value.length;
  }
};

const prevImage = () => {
  if (householdImages.value.length > 1) {
    currentImageIndex.value = (currentImageIndex.value - 1 + householdImages.value.length) % householdImages.value.length;
  }
};

const openFullscreenViewer = () => {
  if (currentImage.value) {
    resetViewerZoom(); // 開啟時重置縮放
    fullscreenViewerDialog.value = true;
  }
};

const closeFullscreenViewer = () => {
  // 關閉丈量模式 (如果開啟)
  if (measureActive.value) {
    measureActive.value = false;
  }
  resetViewerZoom(); // 關閉時重置縮放
  fullscreenViewerDialog.value = false;
};

const openSizingTool = () => {
  if (fullscreenViewerDialog.value) {
    fullscreenViewerDialog.value = false;
  }
  sizingToolDialog.value = true;
};

// ============================================================
// ===== 圖片縮放平移 (Zoom & Pan) =====
// ============================================================

const zoomWrapperRef = ref(null);
const viewerScale = ref(1);
const viewerTx = ref(0);
const viewerTy = ref(0);
const VIEWER_MIN_SCALE = 1;
const VIEWER_MAX_SCALE = 8;

// 拖曳狀態
const viewerDragging = ref(false);
let dragStartX = 0;
let dragStartY = 0;
let dragStartTx = 0;
let dragStartTy = 0;

const viewerTransformStyle = computed(() => ({
  transform: `translate(${viewerTx.value}px, ${viewerTy.value}px) scale(${viewerScale.value})`,
  transformOrigin: 'center center',
  transition: viewerDragging.value ? 'none' : 'transform 0.15s ease-out',
}));

const viewerCursor = computed(() => {
  if (viewerScale.value > 1.01) {
    if (viewerDragging.value) return 'grabbing';
    // 丈量模式下已放大：Canvas 區域用 crosshair (由 CSS 控制)，其他區域用 grab
    return measureActive.value ? 'default' : 'grab';
  }
  return 'default';
});

// --- 滑鼠滾輪縮放 (以滑鼠位置為中心，丈量模式下也可用) ---
function onViewerWheel(e) {

  const wrapper = zoomWrapperRef.value;
  if (!wrapper) return;

  const rect = wrapper.getBoundingClientRect();
  // 滑鼠在 wrapper 內的座標 (相對於 wrapper 中心)
  const mx = e.clientX - rect.left - rect.width / 2;
  const my = e.clientY - rect.top - rect.height / 2;

  const oldScale = viewerScale.value;
  const zoomFactor = e.deltaY < 0 ? 1.15 : 1 / 1.15;
  let newScale = oldScale * zoomFactor;
  newScale = Math.max(VIEWER_MIN_SCALE, Math.min(VIEWER_MAX_SCALE, newScale));

  if (newScale === oldScale) return;

  // 以滑鼠位置為中心縮放: 調整平移量
  const scaleRatio = newScale / oldScale;
  viewerTx.value = mx - scaleRatio * (mx - viewerTx.value);
  viewerTy.value = my - scaleRatio * (my - viewerTy.value);
  viewerScale.value = newScale;

  // 如果縮放回到 1x，重置平移
  if (newScale <= VIEWER_MIN_SCALE + 0.01) {
    resetViewerZoom();
  }

  clampViewerPan();
}

// --- 拖曳平移 ---
function onViewerMouseDown(e) {
  if (viewerScale.value <= 1.01) return; // 未縮放不需拖曳
  // 丈量模式下，Canvas 上的點擊讓丈量工具處理，不啟動拖曳
  if (measureActive.value && e.target === measureCanvasRef.value) return;
  if (e.target.closest('.fp-measure-tools') || e.target.closest('.fullscreen-actions') ||
    e.target.closest('.close-btn') || e.target.closest('.image-nav-btn') ||
    e.target.closest('.fullscreen-info-sidebar') || e.target.closest('.zoom-indicator')) return;

  e.preventDefault();
  viewerDragging.value = true;
  dragStartX = e.clientX;
  dragStartY = e.clientY;
  dragStartTx = viewerTx.value;
  dragStartTy = viewerTy.value;

  const onMove = (ev) => {
    if (!viewerDragging.value) return;
    viewerTx.value = dragStartTx + (ev.clientX - dragStartX);
    viewerTy.value = dragStartTy + (ev.clientY - dragStartY);
    clampViewerPan();
  };

  const onUp = () => {
    viewerDragging.value = false;
    window.removeEventListener('mousemove', onMove);
    window.removeEventListener('mouseup', onUp);
  };

  window.addEventListener('mousemove', onMove);
  window.addEventListener('mouseup', onUp);
}

// --- 雙擊還原 ---
function onViewerDblClick(e) {
  // 丈量模式下，Canvas 上的雙擊讓丈量工具處理
  if (measureActive.value && e.target === measureCanvasRef.value) return;
  if (e.target.closest('.fp-measure-tools') || e.target.closest('.fullscreen-actions') ||
    e.target.closest('.close-btn') || e.target.closest('.fullscreen-info-sidebar')) return;

  if (viewerScale.value > 1.01) {
    // 已放大 → 還原
    resetViewerZoom();
  } else {
    // 未放大 → 快速放大到 2.5x (以雙擊位置為中心)
    const wrapper = zoomWrapperRef.value;
    if (!wrapper) return;
    const rect = wrapper.getBoundingClientRect();
    const mx = e.clientX - rect.left - rect.width / 2;
    const my = e.clientY - rect.top - rect.height / 2;
    const targetScale = 2.5;
    const scaleRatio = targetScale / viewerScale.value;
    viewerTx.value = mx - scaleRatio * (mx - viewerTx.value);
    viewerTy.value = my - scaleRatio * (my - viewerTy.value);
    viewerScale.value = targetScale;
    clampViewerPan();
  }
}

// --- 限制平移範圍不超出邊界 ---
function clampViewerPan() {
  const wrapper = zoomWrapperRef.value;
  if (!wrapper) return;
  const rect = wrapper.getBoundingClientRect();
  const s = viewerScale.value;
  // 允許的平移範圍: 不讓圖片中心拖離視窗太遠
  const maxTx = rect.width * (s - 1) / 2;
  const maxTy = rect.height * (s - 1) / 2;
  viewerTx.value = Math.max(-maxTx, Math.min(maxTx, viewerTx.value));
  viewerTy.value = Math.max(-maxTy, Math.min(maxTy, viewerTy.value));
}

// --- 重置縮放 ---
function resetViewerZoom() {
  viewerScale.value = 1;
  viewerTx.value = 0;
  viewerTy.value = 0;
}

// ============================================================
// ===== 丈量工具 (Measurement Tool) 完整邏輯 =====
// ============================================================

// --- Template Refs ---
const measureContainerRef = ref(null);
const measureImgRef = ref(null);
const measureCanvasRef = ref(null);
const floatingBtnWrapperRef = ref(null);
const btnFloatingFinishRef = ref(null);

// --- 狀態變數 ---
const measureActive = ref(false);           // 丈量模式是否啟用
const measureMode = ref('calibrate');       // 'calibrate' | 'distance' | 'area'
const measurePxPerCm = ref(0);             // 像素對公分的比例
const measurePoints = ref([]);             // 當前操作中的座標點
const currentMousePos = ref(null);         // [新增] 當前滑鼠位置 (用於引導線)
const completedMeasurements = ref([]);     // 已完成的測量區塊
const measureResultText = ref('請在圖上點兩點進行校準');
const measureCalibrateCm = ref(500);       // 校準長度輸入

// --- 刪除按鈕容器定位 (響應式) ---
const measureOverlayPos = ref({ left: '0px', top: '0px', width: '0px', height: '0px' });
const measureOverlayStyle = computed(() => ({
  left: measureOverlayPos.value.left,
  top: measureOverlayPos.value.top,
  width: measureOverlayPos.value.width,
  height: measureOverlayPos.value.height,
}));

// --- 刪除按鈕位置計算 (響應式) ---
const deleteButtonPositions = computed(() => {
  const canvas = measureCanvasRef.value;
  if (!canvas || !canvas.width || !canvas.height) return [];
  return completedMeasurements.value.map((shape) => {
    // 統一放在形狀右上角
    const px = Math.max(...shape.points.map(p => p.x));
    const py = Math.min(...shape.points.map(p => p.y));
    return {
      left: `${(px / canvas.width) * 100}%`,
      top: `${(py / canvas.height) * 100}%`,
    };
  });
});

// --- 刪除單一區塊 ---
function deleteMeasureBlock(index) {
  completedMeasurements.value.splice(index, 1);
  drawMeasurement();
  measureResultText.value = '已刪除區塊';
}

// --- Canvas 尺寸同步 (精確對齊 object-fit: contain 的圖片渲染區域) ---
function resetMeasureCanvasSize() {
  const img = measureImgRef.value;
  const canvas = measureCanvasRef.value;
  const container = measureContainerRef.value;
  if (!img || !canvas || !img.naturalWidth || !container) return;

  // Canvas 內部解析度 = 圖片原始尺寸
  canvas.width = img.naturalWidth;
  canvas.height = img.naturalHeight;

  // 計算圖片經過 object-fit:contain 後的實際渲染尺寸和位置
  // 使用 zoomWrapper (無 transform) 的尺寸作為基準
  const wrapper = zoomWrapperRef.value || container;
  const wrapperRect = wrapper.getBoundingClientRect();
  const imgNatW = img.naturalWidth;
  const imgNatH = img.naturalHeight;
  const containerW = wrapperRect.width;
  const containerH = wrapperRect.height;

  const scaleToFit = Math.min(containerW / imgNatW, containerH / imgNatH);
  const renderedW = imgNatW * scaleToFit;
  const renderedH = imgNatH * scaleToFit;
  const offsetX = (containerW - renderedW) / 2;
  const offsetY = (containerH - renderedH) / 2;

  // 動態定位 Canvas 覆蓋圖片實際渲染區域
  canvas.style.left = `${offsetX}px`;
  canvas.style.top = `${offsetY}px`;
  canvas.style.width = `${renderedW}px`;
  canvas.style.height = `${renderedH}px`;

  // 同步定位按鈕容器 (響應式 ref)
  measureOverlayPos.value = {
    left: `${offsetX}px`,
    top: `${offsetY}px`,
    width: `${renderedW}px`,
    height: `${renderedH}px`,
  };

  // 同步定位浮動完成按鈕容器
  const floatingWrapper = floatingBtnWrapperRef.value;
  if (floatingWrapper) {
    floatingWrapper.style.left = `${offsetX}px`;
    floatingWrapper.style.top = `${offsetY}px`;
    floatingWrapper.style.width = `${renderedW}px`;
    floatingWrapper.style.height = `${renderedH}px`;
  }

  drawMeasurement();
}

function onMeasureImgLoad() {
  nextTick(() => {
    resetMeasureCanvasSize();
  });
}

// --- 視窗大小變化時重新對齊 Canvas ---
let measureResizeObserver = null;

function setupMeasureResizeObserver() {
  if (measureResizeObserver) return;
  // 監聽 zoomWrapper (無 transform) 的尺寸變化
  const wrapper = zoomWrapperRef.value || measureContainerRef.value;
  if (!wrapper) return;
  measureResizeObserver = new ResizeObserver(() => {
    resetMeasureCanvasSize();
  });
  measureResizeObserver.observe(wrapper);
}

function cleanupMeasureResizeObserver() {
  if (measureResizeObserver) {
    measureResizeObserver.disconnect();
    measureResizeObserver = null;
  }
}

// --- 座標轉換 ---
function getMeasureCanvasCoords(e) {
  const canvas = measureCanvasRef.value;
  if (!canvas) return null;
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;
  return {
    x: (e.clientX - rect.left) * scaleX,
    y: (e.clientY - rect.top) * scaleY
  };
}

// --- Canvas 點擊處理 ---
function onMeasureCanvasClick(e) {
  if (!measureActive.value) return;
  // 防止點擊工具列時觸發
  if (e.target.closest('.fp-measure-tools')) return;

  const coords = getMeasureCanvasCoords(e);
  if (!coords) return;

  let { x: px, y: py } = coords;

  // [新增] Shift 鍵正交鎖定
  if (e.shiftKey && measurePoints.value.length > 0) {
    const lastPt = measurePoints.value[measurePoints.value.length - 1];
    const dx = Math.abs(px - lastPt.x);
    const dy = Math.abs(py - lastPt.y);
    if (dx > dy) {
      py = lastPt.y;
    } else {
      px = lastPt.x;
    }
  }

  if (measureMode.value === 'calibrate') {
    if (measurePoints.value.length >= 2) measurePoints.value = [];
    measurePoints.value.push({ x: px, y: py });
    if (measurePoints.value.length === 2) {
      calculateMeasureCalibration();
      currentMousePos.value = null; // 清除引導線標記
    } else {
      measureResultText.value = '請點擊第二點完成校準線';
    }
    if (btnFloatingFinishRef.value) btnFloatingFinishRef.value.style.display = 'none';
  } else {
    if (!measurePxPerCm.value) return;
    measurePoints.value.push({ x: px, y: py });
    calculateMeasureResult();

    const canvas = measureCanvasRef.value;
    if (canvas && btnFloatingFinishRef.value) {
      const pctX = (px / canvas.width) * 100;
      const pctY = (py / canvas.height) * 100;
      btnFloatingFinishRef.value.style.left = `${pctX}%`;
      btnFloatingFinishRef.value.style.top = `${pctY}%`;
      btnFloatingFinishRef.value.style.display = 'block';
    }
  }
  drawMeasurement();
}

// --- 滑鼠移動 (即時引導線) ---
function onMeasureCanvasMouseMove(e) {
  if (!measureActive.value || measurePoints.value.length === 0) return;
  
  // 校準模式如果已經完成兩點，不畫引導線
  if (measureMode.value === 'calibrate' && measurePoints.value.length >= 2) return;

  const coords = getMeasureCanvasCoords(e);
  if (!coords) return;

  let { x: px, y: py } = coords;

  if (e.shiftKey) {
    const lastPt = measurePoints.value[measurePoints.value.length - 1];
    const dx = Math.abs(px - lastPt.x);
    const dy = Math.abs(py - lastPt.y);
    if (dx > dy) {
      py = lastPt.y;
    } else {
      px = lastPt.x;
    }
  }

  currentMousePos.value = { x: px, y: py };
  
  // 即時計算結果
  const tempPts = [...measurePoints.value, currentMousePos.value];
  calculateMeasureResult(tempPts);
  
  drawMeasurement();
}

function onMeasureCanvasMouseLeave() {
  currentMousePos.value = null;
  calculateMeasureResult(); // 恢復只計算已確認的點
  drawMeasurement();
}

// --- 觸控支援 ---
function onMeasureCanvasTouch(e) {
  if (!measureActive.value) return;
  e.preventDefault();
  const touch = e.touches[0];
  if (!touch) return;
  // 模擬 mouse event 的座標
  onMeasureCanvasClick({ clientX: touch.clientX, clientY: touch.clientY, target: e.target });
}

// --- 校準計算 ---
function calculateMeasureCalibration() {
  const pts = measurePoints.value;
  if (pts.length < 2) return;
  const p1 = pts[0], p2 = pts[1];
  const distPx = Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
  const targetCm = measureCalibrateCm.value || 500;
  measurePxPerCm.value = distPx / targetCm;
  measureResultText.value = `校準完成！(比例: 1cm = ${measurePxPerCm.value.toFixed(2)}px)`;
}

function onCalibrateCmChange() {
  if (measurePoints.value.length === 2 && measureMode.value === 'calibrate') {
    calculateMeasureCalibration();
    drawMeasurement();
  }
}

// --- 測量計算 ---
function calculateMeasureResult(tempPts = null) {
  const pts = tempPts && Array.isArray(tempPts) ? tempPts : measurePoints.value;
  if (pts.length < 2) {
    if (!tempPts) {
      if (measureMode.value === 'distance') measureResultText.value = '點擊畫面畫出測距線';
      if (measureMode.value === 'area') measureResultText.value = '點選畫出多邊形封閉範圍';
    }
    return;
  }

  if (measureMode.value === 'distance') {
    let totalDistPx = 0;
    for (let i = 1; i < pts.length; i++) {
      const p1 = pts[i - 1], p2 = pts[i];
      totalDistPx += Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
    }
    const cm = totalDistPx / measurePxPerCm.value;
    measureResultText.value = `總實測長度：${cm.toFixed(1)} cm`;
  } else if (measureMode.value === 'area') {
    if (pts.length < 3) {
      if (!tempPts) measureResultText.value = '請標記至少三點以形成面積';
      else if (pts.length === 2) {
        // 只有兩點時，先顯示長度
        const p1 = pts[0], p2 = pts[1];
        const distPx = Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
        const cm = distPx / measurePxPerCm.value;
        measureResultText.value = `即時長度：${cm.toFixed(1)} cm`;
      }
      return;
    }
    let areaPx = 0;
    let j = pts.length - 1;
    for (let i = 0; i < pts.length; i++) {
      areaPx += (pts[j].x + pts[i].x) * (pts[j].y - pts[i].y);
      j = i;
    }
    areaPx = Math.abs(areaPx / 2);
    const cm2 = areaPx / (measurePxPerCm.value * measurePxPerCm.value);
    const m2 = cm2 / 10000;
    const ping = m2 * 0.3025;
    measureResultText.value = `面積：${m2.toFixed(2)} m² <br> (${ping.toFixed(2)} 坪)`;
  }
}

// --- Canvas 繪圖引擎 ---
function drawMeasurement() {
  const canvas = measureCanvasRef.value;
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // 1. 先繪製所有「已完成」的區塊
  completedMeasurements.value.forEach((shape) => {
    renderMeasureShape(ctx, canvas, shape.mode, shape.points, true);
  });

  // 2. 再繪製「操作中」的點位
  if (measurePoints.value.length > 0) {
    const pts = [...measurePoints.value];
    if (currentMousePos.value && (measureMode.value !== 'calibrate' || measurePoints.value.length < 2)) {
      pts.push(currentMousePos.value);
    }
    renderMeasureShape(ctx, canvas, measureMode.value, pts, false);
  }
}

function renderMeasureShape(ctx, canvas, mode, points, isCompleted) {
  if (!points || points.length === 0) return;

  ctx.lineWidth = Math.max(1, canvas.width / 1200);
  const crossSize = Math.max(3, canvas.width / 600);

  let strokeColor = mode === 'calibrate' ? '#bd985c' : '#2563eb';
  let fillColor = strokeColor;
  if (mode === 'area') {
    fillColor = isCompleted ? 'rgba(16,185,129,0.25)' : 'rgba(37,99,235,0.2)';
    strokeColor = isCompleted ? '#10b981' : '#2563eb';
  } else if (isCompleted) {
    strokeColor = '#10b981';
    fillColor = '#10b981';
  }

  // 繪製線段/多邊形
  ctx.strokeStyle = strokeColor;
  ctx.fillStyle = fillColor;
  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);
  for (let i = 1; i < points.length; i++) {
    ctx.lineTo(points[i].x, points[i].y);
  }
  if (mode === 'area' && points.length >= 3) {
    ctx.closePath();
    ctx.fill();
  }
  ctx.stroke();

  // 繪製頂點十字線
  ctx.strokeStyle = isCompleted ? '#059669' : '#ef4444';
  ctx.lineWidth = Math.max(1, canvas.width / 1500);
  points.forEach((p, index) => {
    // 繪製十字線
    ctx.beginPath();
    ctx.moveTo(p.x - crossSize, p.y);
    ctx.lineTo(p.x + crossSize, p.y);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(p.x, p.y - crossSize);
    ctx.lineTo(p.x, p.y + crossSize);
    ctx.stroke();

    // 距離模式: 在每段線段中點標註長度
    if (mode === 'distance' && index > 0 && measurePxPerCm.value > 0) {
      const prev = points[index - 1];
      const distPx = Math.sqrt(Math.pow(p.x - prev.x, 2) + Math.pow(p.y - prev.y, 2));
      const cm = distPx / measurePxPerCm.value;
      const midX = (prev.x + p.x) / 2;
      const midY = (prev.y + p.y) / 2;
      const text = `${cm.toFixed(1)}cm`;

      ctx.save();
      ctx.font = `bold ${Math.max(12, canvas.width / 90)}px sans-serif`;
      ctx.fillStyle = 'black';
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = Math.max(2, canvas.width / 200);
      ctx.lineJoin = 'round';
      ctx.lineCap = 'round';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'bottom';
      ctx.strokeText(text, midX, midY - 4);
      ctx.fillText(text, midX, midY - 4);
      ctx.restore();
    }
  });

  // 面積模式: 在多邊形中心標註面積
  if (mode === 'area' && points.length >= 3 && measurePxPerCm.value > 0) {
    let cx = 0, cy = 0;
    points.forEach(p => { cx += p.x; cy += p.y; });
    cx /= points.length;
    cy /= points.length;

    let areaPx = 0;
    let j = points.length - 1;
    for (let i = 0; i < points.length; i++) {
      areaPx += (points[j].x + points[i].x) * (points[j].y - points[i].y);
      j = i;
    }
    areaPx = Math.abs(areaPx / 2);
    const cm2 = areaPx / (measurePxPerCm.value * measurePxPerCm.value);
    const m2 = cm2 / 10000;
    const ping = m2 * 0.3025;

    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const fontSize = Math.max(14, canvas.width / 65);
    ctx.font = `bold ${fontSize}px sans-serif`;
    ctx.fillStyle = isCompleted ? '#059669' : '#ef4444';
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = Math.max(2, canvas.width / 180);
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    const gap = fontSize + 4;
    ctx.strokeText(`${ping.toFixed(2)} 坪`, cx, cy - gap / 2);
    ctx.fillText(`${ping.toFixed(2)} 坪`, cx, cy - gap / 2);
    ctx.strokeText(`${m2.toFixed(2)} m²`, cx, cy + gap / 2);
    ctx.fillText(`${m2.toFixed(2)} m²`, cx, cy + gap / 2);
    ctx.restore();
  }
}

// --- 完成按鈕邏輯 ---
function finishMeasureBlock(e) {
  if (e) e.stopPropagation();
  if (measurePoints.value.length > 0) {
    completedMeasurements.value.push({
      mode: measureMode.value,
      points: [...measurePoints.value],
      resultHtml: measureResultText.value
    });
    measurePoints.value = [];
    currentMousePos.value = null;
    if (btnFloatingFinishRef.value) btnFloatingFinishRef.value.style.display = 'none';
    drawMeasurement();
    measureResultText.value = '已保存當前圖形，可繼續點選圖面測量新區塊';
  }
}

// --- 清除所有標記 ---
function clearAllMeasurements() {
  measurePoints.value = [];
  currentMousePos.value = null;
  completedMeasurements.value = [];
  if (btnFloatingFinishRef.value) btnFloatingFinishRef.value.style.display = 'none';
  drawMeasurement();
  if (measureMode.value !== 'calibrate' && !measurePxPerCm.value) {
    measureResultText.value = '請先完成「尺寸校準」!!';
  } else {
    measureResultText.value = '已清除標記';
  }
}

// --- 模式切換 ---
function setMeasureMode(mode) {
  measureMode.value = mode;
  measurePoints.value = [];
  if (btnFloatingFinishRef.value) btnFloatingFinishRef.value.style.display = 'none';

  if (mode === 'calibrate') {
    measureResultText.value = '請在圖上點出兩點進行校準';
  } else if (mode === 'distance') {
    if (!measurePxPerCm.value) {
      measureResultText.value = '請先完成「尺寸校準」!!';
      return;
    }
    measureResultText.value = '點擊畫面畫出測距線';
  } else if (mode === 'area') {
    if (!measurePxPerCm.value) {
      measureResultText.value = '請先完成「尺寸校準」!!';
      return;
    }
    measureResultText.value = '點選畫出多邊形封閉範圍';
  }
  drawMeasurement();
}

// --- 丈量模式開關 ---
function toggleMeasureMode() {
  measureActive.value = !measureActive.value;
  if (measureActive.value) {
    // 啟用丈量: 保留當前縮放比例，綁定 Canvas 事件
    nextTick(() => {
      const canvas = measureCanvasRef.value;
      if (canvas) {
        canvas.addEventListener('mousedown', onMeasureCanvasClick);
        canvas.addEventListener('mousemove', onMeasureCanvasMouseMove);
        canvas.addEventListener('mouseleave', onMeasureCanvasMouseLeave);
        canvas.addEventListener('touchstart', onMeasureCanvasTouch, { passive: false });
      }
      resetMeasureCanvasSize();
      setupMeasureResizeObserver();
    });
  } else {
    // 停用丈量: 移除 Canvas 事件
    const canvas = measureCanvasRef.value;
    if (canvas) {
      canvas.removeEventListener('mousedown', onMeasureCanvasClick);
      canvas.removeEventListener('mousemove', onMeasureCanvasMouseMove);
      canvas.removeEventListener('mouseleave', onMeasureCanvasMouseLeave);
      canvas.removeEventListener('touchstart', onMeasureCanvasTouch);
    }
    cleanupMeasureResizeObserver();
  }
}

// --- 圖面切換時重置丈量 ---
function resetMeasureTool() {
  if (measureActive.value) {
    toggleMeasureMode(); // 關閉
  }
  clearAllMeasurements();
  measurePxPerCm.value = 0;
  measureMode.value = 'calibrate';
  measureResultText.value = '請在圖上點兩點進行校準';
  resetViewerZoom(); // 重置縮放
  nextTick(() => resetMeasureCanvasSize());
}

// 監聽圖片切換, 重置丈量工具
watch(currentImageIndex, () => {
  if (fullscreenViewerDialog.value) {
    resetMeasureTool();
  }
});

const printImage = () => {
  if (currentImage.value && currentImage.value.downloadURL) {
    const iframe = document.createElement('iframe');
    iframe.style.position = 'absolute';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = 'none';
    document.body.appendChild(iframe);

    iframe.onload = () => {
      // 確保 iframe 內部載入完成後再寫入內容
      const doc = iframe.contentWindow.document;
      doc.open();
      // 使用 onload 觸發列印，確保圖片完全載入
      doc.write(`
        <html>
          <head>
            <title>列印圖面 - ${props.unitData?.unitId || ''}</title>
            <style>
              body { 
                margin: 0; 
                display: flex; 
                justify-content: center; 
                align-items: center; 
                height: 100vh; 
                background-color: #fff; 
              }
              img { 
                max-width: 100%; 
                max-height: 100vh; 
                object-fit: contain; 
              }
              @media print {
                @page { margin: 10mm; size: auto; }
                body { margin: 0; }
              }
            </style>
          </head>
          <body>
            <img src="${currentImage.value.downloadURL}" onload="window.print();" />
          </body>
        </html>
      `);
      doc.close();

      // 列印結束或取消後移除 iframe (設置一個安全的延遲以免列印對話框還沒完全開啟就被移除了)
      iframe.contentWindow.onbeforeunload = () => {
        document.body.removeChild(iframe);
      };
      // 備用的移除機制
      setTimeout(() => {
        if (document.body.contains(iframe)) {
          document.body.removeChild(iframe);
        }
      }, 10000); // 10秒後自動清理
    };

    // 觸發 onload
    iframe.src = 'about:blank';
  }
};

watch(() => props.show, (newVal) => {
  if (newVal) {
    tab.value = 'info';
    tempParkingSelection.value = null;
    editingParkingSelection.value = null; // 重置編輯暫存
    currentImageIndex.value = 0;
    showInfoOverlay.value = false;
    if (isEditing.value) cancelEditing();
  } else {
    sizingToolDialog.value = false;
    // 關閉時重置丈量工具
    if (measureActive.value) {
      measureActive.value = false;
    }
  }
});

function close() {
  if (isEditing.value) cancelEditing();
  emit('update:show', false);
}

function formatNumber(value, frac = 0) {
  if (value === null || value === undefined || String(value).trim() === '') return frac > 0 ? (0).toFixed(frac) : '0';
  const num = Number(value);
  if (isNaN(num)) return 'N/A';
  return num.toLocaleString('en-US', { minimumFractionDigits: frac, maximumFractionDigits: frac });
}

function formatPercentage(value) {
  const num = parseFloat(value);
  if (isNaN(num)) return 'N/A';
  return `${(num * 100).toFixed(2)}%`;
}

function formatBoolean(value) {
  if (value === true) return '是';
  if (value === false) return '否';
  return '-';
}

function formatDate(dateInput) {
  if (!dateInput) return '-';

  // 1. 處理新格式：ROC 物件 { year, month, day }
  if (typeof dateInput === 'object' && 'year' in dateInput && 'month' in dateInput) {
    const ceYear = Number(dateInput.year) + 1911;
    const month = String(dateInput.month).padStart(2, '0');
    const day = String(dateInput.day).padStart(2, '0');
    return `${ceYear}/${month}/${day}`;
  }

  let date;

  // 2. 處理 Firestore Timestamp (原本的物件)
  if (typeof dateInput.toDate === 'function') {
    date = dateInput.toDate();
  }
  // 3. [新增] 處理 Firestore Timestamp 序列化後的物件 (JSON.stringify 後的結果)
  else if (typeof dateInput === 'object' && 'seconds' in dateInput) {
    date = new Date(dateInput.seconds * 1000);
  }
  // 4. 處理 JS Date 或 timestamps
  else {
    date = new Date(dateInput);
  }

  if (isNaN(date.getTime())) return '無效日期';
  return date.toLocaleDateString('zh-TW', { year: 'numeric', month: '2-digit', day: '2-digit' });
}

function formatAddress(data, type) {
  if (!data) return '-';
  const city = data[`buyer${type}AddressCity`] || '';
  const district = data[`buyer${type}AddressDistrict`] || '';
  const detail = data[`buyer${type}AddressDetail`] || '';
  const fullAddress = `${city}${district}${detail}`;
  return fullAddress || '-';
}

// 3. [重構] handleParkingUpdate：現在只做前端暫存，不再執行資料庫寫入
async function handleParkingUpdate(parkingUpdateData) {
  const { unitId, parkingList } = parkingUpdateData;

  // 情境 A：來自「付款表設定」
  if (!isEditing.value) {
    console.log('🧪 [前端模式] 僅更新付款表暫存');
    tempParkingSelection.value = parkingList;
    return;
  }

  // 情境 B：來自「修改銷控」編輯中
  console.log('🧪 [編輯暫存] 記錄車位變動，待儲存變更時才寫入資料庫');

  // 編輯暫存模式
  editingData.value['持有車位'] = parkingList.map(p => ({
    ...p,
    '車位編號': p.spotId || p['車位編號'],
    '車位成交價': p.price_transaction || p['車位成交價'],
    // ✅ [修復] 確保暫存時也對應到正確的底價鍵名
    '車位底價': p.price_floor || p['底價'] || p['車位底價'] || 0,
    '車位尺寸': p.size || p['車位尺寸'] || '標準'
  }));

  // 記錄這份清單供儲存按鈕使用
  editingParkingSelection.value = parkingList;
}

// ✅ [新增] 車位未變動時，同步戶別關鍵欄位至所有持有車位
async function syncOwnedParkingFields(unitId) {
  const data = editingData.value;
  if (!data) return;

  const allParkingData = props.allData?.['車位'] || [];
  const ownedParkings = allParkingData.filter(p => p.buyerUnitId === unitId);

  if (ownedParkings.length === 0) return;

  console.log(`🚗 同步戶別欄位至 ${ownedParkings.length} 個持有車位...`);
  for (const parking of ownedParkings) {
    if (parking.id) {
      await updateParkingLot(parking.id, {
        status_backend: data.salesStatus_backend || null,
        salesperson: normalizeSalespersons(data.salesperson),
        salespersonUserKey: normalizeSalespersons(data.salespersonUserKey),
        buyerName: data.buyerName || null,
        updatedAt: new Date()
      });
    }
  }
}

// 4. [新增] 專門處理資料庫寫入的輔助函式
async function commitParkingChanges(unitId, parkingList) {
  const allParkingData = props.allData?.['車位'] || [];

  // 🔄 步驟1：清除舊關聯
  const currentOwnedParkings = allParkingData.filter(p => p.buyerUnitId === unitId);
  for (const parking of currentOwnedParkings) {
    if (parking.id) {
      await updateParkingLot(parking.id, {
        buyerUnitId: null,
        buyerName: null,
        price_transaction: null,
        status: null,
        status_backend: null,
        salesperson: [],
        salespersonUserKey: [],
        remarks: null,
        updatedAt: new Date()
      });
    }
  }

  // 🔄 步驟2：設定新關聯
  for (const newParking of parkingList) {
    const existingParking = allParkingData.find(p => p.spotId === newParking.spotId);
    if (existingParking && existingParking.id) {
      await updateParkingLot(existingParking.id, {
        buyerUnitId: unitId,
        buyerName: editingData.value?.buyerName || null,
        price_transaction: newParking.price_transaction || null,
        status: '已售',
        status_backend: editingData.value?.salesStatus_backend || null,
        salesperson: normalizeSalespersons(editingData.value?.salesperson),
        salespersonUserKey: normalizeSalespersons(editingData.value?.salespersonUserKey),
        remarks: newParking.remarks || null,
        updatedAt: new Date()
      });
    }
  }
}


// ✅ [打勾] 新增：格式化民國日期函數
function formatROCDate(dateInput) {
  if (!dateInput) return '-';

  // 1. 處理新格式：ROC 物件 { year, month, day }
  if (typeof dateInput === 'object' && 'year' in dateInput && 'month' in dateInput) {
    return `民國 ${dateInput.year} 年 ${dateInput.month} 月 ${dateInput.day} 日`;
  }

  let date;
  // 處理 Firestore Timestamp 或原生 Date 物件
  if (typeof dateInput.toDate === 'function') {
    date = dateInput.toDate();
  } else if (typeof dateInput === 'object' && 'seconds' in dateInput) {
    // [新增] 處理序列化後的 Timestamp
    date = new Date(dateInput.seconds * 1000);
  } else {
    date = new Date(dateInput);
  }

  if (isNaN(date.getTime())) return '無效日期';

  const rocYear = date.getFullYear() - 1911;
  const month = date.getMonth() + 1;
  const day = date.getDate();

  return `民國 ${rocYear} 年 ${month} 月 ${day} 日`;
}

// ✅ [新增] 下載 Excel 功能
const downloadExcel = () => {
  const sourceData = enrichedUnitData.value || props.unitData;
  if (!sourceData) {
    toast.error('無資料可下載');
    return;
  }

  const mainData = {
    '建案名稱': props.projectName || '',
    '戶別': sourceData.unitId || '',

    // 面積資訊
    '房屋總面積(坪)': formatNumber(sourceData.area_house_ping, 2),
    '房屋總面積(m²)': formatNumber(sourceData.area_house_sqm, 2),
    '公設比': formatPercentage(sourceData.common_area_ratio),
    '主建物(坪)': formatNumber(sourceData.area_main_ping, 2),
    '主建物(m²)': formatNumber(sourceData.area_main_sqm, 2),
    '附屬建物(坪)': formatNumber(sourceData.area_ancillary_ping, 2),
    '附屬建物(m²)': formatNumber(sourceData.area_ancillary_sqm, 2),
    '共用部分(坪)': formatNumber(sourceData.area_common_ping, 2),
    '共用部分(m²)': formatNumber(sourceData.area_common_sqm, 2),
    '露臺(坪)': formatNumber(sourceData.area_terrace_ping, 2),
    '土地持分(坪)': formatNumber(sourceData.land_share_ping, 2),
    '土地持分(m²)': formatNumber(sourceData.land_share_sqm, 2),

    '合約方式': sourceData.contractType || '',
    '是否首購': formatBoolean(sourceData.isFirstTimeBuyer),
    '房屋成交價(萬)': formatNumber(sourceData.price_transaction_house),
    '房屋單價(萬/坪)': formatNumber(calculatedTransactionUnitPrice.value, 2),
    '房屋底價(萬)': formatNumber(sourceData.price_floor_house_total),
    '房屋底價單價(萬/坪)': formatNumber(calculatedBaseUnitPrice.value, 2),
    '車位總成交價(萬)': formatNumber(parkingTotalTransactionPrice.value),
    '車位總底價(萬)': formatNumber(parkingTotalFloorPrice.value),
    '成交總價(萬)': formatNumber(grandTotalTransactionPrice.value),
    '總底價(萬)': formatNumber(totalFloorPrice.value),
    '溢差價(萬)': formatNumber(pricePremium.value),
    '銷控後台狀態': sourceData.salesStatus_backend || '',
    '銷售人員': formatSalespersons(sourceData.salesperson, ',', ''),
    '銷售人員userKey': formatSalespersons(sourceData.salespersonUserKey, ',', ''),
    '小訂日期': formatDate(sourceData.payment_deposit_date),

    '補足日期': formatDate(sourceData.payment_complete_date) || formatDate(sourceData.payment_top_up_date), // 嘗試多種可能命名

    '簽約日期': formatDate(sourceData.payment_contract_date),

    '買方姓名': sourceData.buyerName || '',
    '身分證字號': sourceData.buyerIdNumber || '',
    '聯絡電話': sourceData.buyerPhone || '',
    'EMAIL': sourceData.buyerEmail || '',
    '通訊地址': formatAddress(sourceData, 'Mailing'),
    '戶籍地址': formatAddress(sourceData, 'Permanent'),
    '出生年月日 (西元)': formatDate(sourceData.buyerDateOfBirth),
    '出生年月日 (民國)': formatROCDate(sourceData.buyerDateOfBirth),
    '備註': sourceData.remarks || ''
  };

  const parkingItems = assignedParkingLots.value || [];
  const rowCount = Math.max(1, parkingItems.length);
  const data = [];

  // 定義欄位順序
  const headers = [
    '建案名稱', '戶別',
    '車位編號', '車位尺寸', '車位底價(萬)', '車位成交價(萬)',
    '房屋總面積(坪)', '房屋總面積(m²)', '公設比',
    '主建物(坪)', '主建物(m²)', '附屬建物(坪)', '附屬建物(m²)', '共用部分(坪)', '共用部分(m²)', '露臺(坪)', '土地持分(坪)', '土地持分(m²)',

    '合約方式', '是否首購',
    '房屋成交價(萬)', '房屋單價(萬/坪)', '房屋底價(萬)', '房屋底價單價(萬/坪)',
    '車位總成交價(萬)', '車位總底價(萬)', '成交總價(萬)', '總底價(萬)', '溢差價(萬)',
    '銷控後台狀態', '銷售人員',
    '小訂日期', '補足日期', '簽約日期',
    '買方姓名', '身分證字號', '聯絡電話', 'EMAIL',
    '通訊地址', '戶籍地址', '出生年月日 (西元)', '出生年月日 (民國)', '備註'

  ];

  for (let i = 0; i < rowCount; i++) {
    const row = {};

    // 第一行填入主要資料，之後的行留空
    if (i === 0) {
      Object.assign(row, mainData);
    } else {
      // 填入空字串
      Object.keys(mainData).forEach(key => row[key] = '');
    }

    // 填入車位資料
    if (i < parkingItems.length) {
      const p = parkingItems[i];
      row['車位編號'] = p['車位編號'];
      row['車位尺寸'] = p['車位尺寸'] || '標準';
      row['車位底價(萬)'] = formatNumber(p['車位底價']);
      row['車位成交價(萬)'] = formatNumber(p['車位成交價']);
    } else {
      row['車位編號'] = '';
      row['車位尺寸'] = '';
      row['車位底價(萬)'] = '';
      row['車位成交價(萬)'] = '';
    }

    data.push(row);
  }

  const ws = XLSX.utils.json_to_sheet(data, { header: headers });
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "HouseholdData");

  const fileName = `${props.projectName || '建案'}_${sourceData.unitId}_${sourceData.buyerName || 'Export'}_銷售資料.xlsx`;
  XLSX.writeFile(wb, fileName);
};

// 🔐 [隱藏功能] 事件監聽器設定
onMounted(() => {
  document.addEventListener('keydown', handleKeyPress);
});

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeyPress);
});
</script>

<style scoped>
.header-section {
  flex-shrink: 0;
  position: relative;
  z-index: 2;
  background-color: white;
  box-shadow: 0 2px 4px -1px rgba(0, 0, 0, 0.2);
}

.header-section .v-card-title {
  background-color: #1a3a6e;
  color: white;
}

.main-content {
  flex-grow: 1;
  overflow-y: auto;
  position: relative;
}

.footer-section {
  flex-shrink: 0;
}

.info-section {
  padding: 8px;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  height: 100%;
}

.top-info-row .info-section {
  height: 100%;
}

.section-title {
  font-size: 1.1rem;
  font-weight: 600;
  color: #1a3a6e;
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 2px solid #1a3a6e;
}

.section-subtitle {
  font-size: 1rem;
  font-weight: 500;
  color: #37474f;
  margin-bottom: 8px;
}

.highlight-price {
  font-size: 1.8rem !important;
  font-weight: 700 !important;
  color: #c62828 !important;
}

.highlight-price-base {
  font-size: 1.5rem !important;
  font-weight: 500 !important;
  color: #455a64 !important;
}

.highlight-price-final {
  font-size: 1.8rem !important;
  font-weight: 700 !important;
  color: #2E7D32 !important;
}


:deep(.v-list-item-title) {
  font-size: 0.9rem;
}

:deep(.v-list-item--density-compact .v-list-item-title) {
  font-size: 0.85rem;
}

:deep(.v-list-item-subtitle) {
  line-height: normal;
  -webkit-line-clamp: unset !important;
  line-clamp: unset !important;
}

.preview-area-full {
  position: relative;
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 16px;
  box-sizing: border-box;
  background-color: #eceff1;
}

.preview-content {
  max-width: 100%;
  max-height: 75vh;
  object-fit: contain;
  display: block;
  border: none;
}

.blur-background :deep(.v-overlay__scrim) {
  background: rgba(30, 30, 30, 0.5) !important;
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
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
  font-size: 1.2em;
  color: #1A237E;
}

.sizing-tool-btn {
  position: absolute;
  bottom: 24px;
  right: 24px;
  z-index: 1;
}

.total-price-item {
  border-top: 1px solid #e0e0e0;
  margin-top: 8px;
  padding-top: 8px;
}

.parking-list {
  max-height: 150px;
  overflow-y: auto;
  padding-right: 8px;
}

.parking-item {
  background-color: #f5f5f5;
  border-radius: 4px;
  padding: 8px;
  margin-top: 8px;
  font-size: 0.85rem;
}

.parking-item p {
  margin: 0;
  line-height: 1.5;
}

.parking-title {
  font-weight: 600;
  color: #1a3a6e;
}

.base-price-item,
.premium-price-item {
  border-top: 1px solid #eee;
  margin-top: 4px;
  padding-top: 4px;
}

.ratio-row-toggle:hover {
  background-color: rgba(0, 0, 0, 0.03);
}
.ratio-detail :deep(.v-list-item-title) {
  padding-left: 20px;
  font-size: 0.875rem;
  color: #555;
}
.package-annotation {
  background-color: #fff8e1;
  border-left: 3px solid #ffa726;
}
.package-annotation :deep(.v-list-item-title) {
  padding-left: 12px;
  font-size: 0.875rem;
  color: #6d4c00;
}



.image-viewer-container {
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  overflow: hidden;
}

.main-image-wrapper {
  background-color: #212121;
  position: relative;
}

.main-image {
  width: 100%;
  height: 45vh;
  min-height: 300px;
}

.thumbnail-strip {
  background-color: #f5f5f5;
  padding: 8px;
}

.thumbnail-image {
  width: 90px;
  margin: 0 4px;
  border: 2px solid transparent;
  border-radius: 4px;
  cursor: pointer;
  transition: border-color 0.2s ease-in-out;
}

.thumbnail-image:hover {
  border-color: #90caf9;
}

.thumbnail-active {
  border-color: #1976D2;
}

.fullscreen-image-container {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  height: 100%;
  padding: 16px;
  box-sizing: border-box;
}

.fullscreen-image {
  width: 100%;
  max-width: 100%;
  height: 100%;
  max-height: 100%;
  object-fit: contain;
}

.close-btn {
  position: absolute;
  top: 16px;
  right: 16px;
  background-color: rgba(0, 0, 0, 0.4) !important;
  color: white !important;
  z-index: 10;
}

.carousel-viewer-container {
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  overflow: hidden;
  background-color: #f5f5f5;
}

.main-carousel-image {
  height: 40vh;
  min-height: 250px;
  background-color: #e8eaed; /* 淺灰白：讓白底圖片與背景有區隔 */
}

.small-thumbnails-strip {
  display: flex;
  overflow-x: auto;
  padding: 8px;
  gap: 8px;
}

.small-thumbnails-strip::-webkit-scrollbar {
  height: 6px;
}

.small-thumbnails-strip::-webkit-scrollbar-thumb {
  background-color: #ccc;
  border-radius: 3px;
}

.small-thumbnail-wrapper {
  width: 80px;
  height: 45px;
  flex-shrink: 0;
  border: 2px solid transparent;
  border-radius: 4px;
  cursor: pointer;
  transition: border-color 0.2s ease-in-out;
  overflow: hidden;
}

.small-thumbnail-wrapper:hover {
  border-color: #90caf9;
}

.thumbnail-active {
  border-color: #1976D2;
}

.image-nav-btn {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  background-color: rgba(0, 0, 0, 0.4) !important;
  color: white !important;
}

.image-nav-btn.prev {
  left: 16px;
}

.image-nav-btn.next {
  right: 16px;
}

.price-block {
  padding: 12px;
  text-align: center;
  border: 1px solid #eee;
  border-radius: 8px;
  height: 100%;
}

.price-block-title {
  font-size: 0.9rem;
  color: #555;
  font-weight: 500;
  margin-bottom: 4px;
}

/* ✅ [新增] 備註圖片：全螢幕預覽容器 */
.price-remark-fullscreen-card {
  width: 100vw;
  height: 100vh;
  background: rgba(0, 0, 0, 0.92) !important;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  cursor: zoom-out;
}
.price-remark-fullscreen-img {
  max-width: 95vw;
  max-height: 95vh;
  object-fit: contain;
  display: block;
}
.price-remark-fullscreen-close {
  position: absolute !important;
  top: 16px;
  right: 16px;
  z-index: 10;
}

/* ✅ [新增] 備註圖片縮圖 */
.price-remark-thumb {
  position: relative;
  width: 80px;
  height: 80px;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  overflow: hidden;
}
.price-remark-thumb-remove {
  position: absolute !important;
  top: -6px;
  right: -6px;
  z-index: 2;
}
.price-remark-thumb-pending {
  position: absolute !important;
  bottom: 2px;
  left: 2px;
  font-size: 10px !important;
  height: 16px !important;
  padding: 0 4px !important;
}

.price-block-value {
  font-size: 2rem;
  font-weight: 700;
  line-height: 1.2;
}

.price-block-currency {
  font-size: 1rem;
  font-weight: 500;
  margin-left: 4px;
}

.price-block-unit {
  font-size: 0.9rem;
  color: #757575;
}

/* ✅ [新增] 底價拆分明細（僅有露臺的戶別顯示）：次要層級，與主數字明顯區隔 */
.price-split {
  margin-top: 10px;
  padding-top: 8px;
  border-top: 1px dashed #ddd;
}

.price-split-hint {
  font-size: 0.75rem;
  color: #9e9e9e;
  margin-bottom: 6px;
}

.price-split-row {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.price-split-part {
  flex: 1;
  min-width: 0;
}

.price-split-label {
  font-size: 0.75rem;
  color: #757575;
  line-height: 1.3;
}

.price-split-area {
  display: block;
  font-size: 0.7rem;
  color: #9e9e9e;
}

.price-split-value {
  font-size: 1.05rem;
  font-weight: 600;
  color: #424242;
  line-height: 1.3;
}

.price-split-currency {
  font-size: 0.75rem;
  font-weight: 500;
  margin-left: 2px;
}

.price-split-unit {
  font-size: 0.72rem;
  color: #9e9e9e;
}

.price-split-plus {
  flex: 0 0 auto;
  font-size: 0.9rem;
  color: #bdbdbd;
}

.custom-footer {
  padding-top: 5px;
  padding-bottom: 5px;
  min-height: 30px;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

/* [新增] 編輯模式價格輸入框顏色微調 */
.input-price-floor :deep(input) {
  color: grey !important;
  /* 灰色 (底價) */
  font-weight: bold;
}

.input-price-list :deep(input) {
  color: red !important;
  /* 紅色 (表價) */
  font-weight: bold;
}

.fullscreen-actions {
  position: absolute;
  bottom: 24px;
  right: 24px;
  z-index: 10;
  display: flex;
}

.fullscreen-info-sidebar {
  position: absolute;
  top: 16px;
  left: 16px;
  bottom: 16px;
  width: 320px;
  max-width: 85vw;
  z-index: 9;
  display: flex;
  flex-direction: column;
}

.overlay-scroll-container {
  overflow-y: auto;
  height: 100%;
  box-shadow: 0 4px 30px rgba(0, 0, 0, 0.5) !important;
  border: 1px solid rgba(255, 255, 255, 0.3);
}

/* 數據字體優化 */
.total-area-value-sm {
  font-size: 1.3rem;
  font-weight: 700;
  color: #1A237E;
  line-height: 1.2;
}

.area-ping-value-sm {
  font-weight: 600;
  color: #1A237E;
}

/* 確保與主介面明細樣式一致 */
.fullscreen-info-sidebar :deep(.area-item-header) {
  display: grid;
  grid-template-columns: 2fr 1fr 1fr;
  font-size: 0.75rem;
  color: #78909C;
  border-bottom: 1px solid #CFD8DC;
  padding: 2px 4px;
}

.fullscreen-info-sidebar :deep(.area-item) {
  display: grid;
  grid-template-columns: 2fr 1fr 1fr;
  padding: 6px 4px;
  border-bottom: 1px solid #f0f0f0;
  font-size: 0.85rem;
}

.fullscreen-info-sidebar :deep(.area-item span:not(:first-child)) {
  text-align: right;
}

/* 右下角按鈕容器 */
.fullscreen-actions {
  position: absolute;
  bottom: 24px;
  right: 24px;
  z-index: 10;
  display: flex;
}

/* ============================================================ */
/* ===== 圖片縮放平移 (Zoom & Pan) 樣式 ===== */
/* ============================================================ */

/* 全螢幕檢視器背景：淺灰白（非純白，讓白底圖片邊界可辨識） */
.fullscreen-viewer {
  background-color: #e8eaed !important;
}

/* 縮放外層容器 */
.fullscreen-zoom-wrapper {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
}

/* 縮放比例指示器 */
.zoom-indicator {
  position: absolute;
  top: 18px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 11;
  background: rgba(0, 0, 0, 0.6);
  color: #fff;
  font-size: 14px;
  font-weight: 600;
  padding: 5px 16px;
  border-radius: 20px;
  pointer-events: none;
  backdrop-filter: blur(6px);
  -webkit-backdrop-filter: blur(6px);
  letter-spacing: 0.5px;
}

/* fade transition */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.25s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* ============================================================ */
/* ===== 丈量工具 (Measurement Tool) 樣式 ===== */
/* ============================================================ */

/* 圖片 + Canvas 疊加容器 (受 transform 控制) */
.fullscreen-image-measure-container {
  position: relative;
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
}

/* 原生圖片（替換 v-img） */
.fullscreen-image-native {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
  display: block;
  user-select: none;
  -webkit-user-drag: none;
}

/* Canvas 疊加於圖片上方 — JS 動態設定 left/top/width/height */
.measure-canvas {
  position: absolute;
  pointer-events: none;
  z-index: 5;
  touch-action: none;
}

/* 丈量模式啟用時，Canvas 接收滑鼠事件並顯示十字游標 */
.measuring .measure-canvas {
  pointer-events: auto;
  cursor: crosshair;
}

/* 刪除按鈕容器 — JS 動態設定 left/top/width/height */
.measure-buttons-container {
  position: absolute;
  pointer-events: none;
  z-index: 15;
  overflow: visible;
}

/* 丈量工具列 */
.fp-measure-tools {
  position: absolute;
  bottom: 80px;
  right: 24px;
  z-index: 12;
  display: flex;
  flex-direction: column-reverse;
  align-items: flex-end;
  gap: 12px;
}

/* 開關按鈕 */
.fp-measure-toggle {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border: 1px solid rgba(180, 165, 130, 0.5);
  padding: 10px 20px;
  border-radius: 24px;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
  color: #1a1a1a;
  transition: all 0.2s ease;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

.fp-measure-toggle:hover {
  background: #fff;
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.25);
}

/* 控制面板 */
.fp-measure-panel {
  background: rgba(255, 255, 255, 0.97);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid rgba(160, 150, 120, 0.35);
  border-radius: 14px;
  padding: 16px 20px;
  width: 330px;
  box-shadow: 0 8px 28px rgba(0, 0, 0, 0.18);
  display: flex;
  flex-direction: column;
  gap: 10px;
}

/* 面板標題 */
.fp-measure-panel-title {
  font-size: 15px;
  font-weight: 700;
  color: #1a1a1a;
  padding-bottom: 6px;
  border-bottom: 2px solid #8b6914;
  margin-bottom: 2px;
}

.fp-measure-row {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.fp-measure-row label {
  font-size: 13px;
  font-weight: 600;
  color: #1a1a1a;
  white-space: nowrap;
}

.fp-measure-row input[type="number"] {
  border: 1.5px solid #aaa;
  border-radius: 6px;
  padding: 5px 10px;
  font-size: 14px;
  font-weight: 600;
  color: #1a1a1a;
  background: #fff;
  outline: none;
  transition: border-color 0.2s;
}

.fp-measure-row input[type="number"]:focus {
  border-color: #8b6914;
  box-shadow: 0 0 0 2px rgba(139, 105, 20, 0.15);
}

/* 模式切換按鈕群組 */
.fp-measure-btn-group {
  display: flex;
  gap: 4px;
}

.fp-measure-btn-group button {
  padding: 6px 12px;
  border: 1.5px solid #bbb;
  border-radius: 6px;
  background: #f0f0f0;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s ease;
  font-weight: 600;
  color: #333;
}

.fp-measure-btn-group button:hover {
  background: #e5e5e5;
  border-color: #999;
}

.fp-measure-btn-group button.active {
  background: #8b6914;
  color: #fff;
  border-color: #7a5c10;
  box-shadow: 0 2px 6px rgba(139, 105, 20, 0.3);
}

/* 清除按鈕 */
.fp-measure-clear-btn {
  width: 100%;
  padding: 7px 12px;
  border: 1.5px solid #dc2626;
  border-radius: 6px;
  background: rgba(220, 38, 38, 0.06);
  color: #b91c1c;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s ease;
}

.fp-measure-clear-btn:hover {
  background: #dc2626;
  color: #fff;
}

/* 結果顯示區 */
.fp-measure-result {
  font-size: 15px;
  font-weight: 700;
  text-align: center;
  background: #fdf6e3;
  padding: 10px 12px;
  border-radius: 8px;
  border: 1.5px solid #d4a843;
  word-break: keep-all;
  line-height: 1.5;
  color: #1a1a1a;
}

/* 浮動「完成」按鈕 */
.fp-floating-btn {
  position: absolute;
  transform: translate(-50%, 10px);
  background: #bd985c;
  color: white;
  border: none;
  padding: 3px 10px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 11px;
  font-weight: 600;
  pointer-events: auto;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
  display: none;
  white-space: nowrap;
  z-index: 10;
  transition: background 0.2s ease;
}

.fp-floating-btn:hover {
  background: #a07e43;
}

/* 刪除按鈕 (形狀右上角) */
.fp-delete-btn {
  position: absolute;
  background: rgba(220, 38, 38, 0.9);
  color: white;
  border: 1.5px solid rgba(255, 255, 255, 0.6);
  width: 22px;
  height: 22px;
  border-radius: 50%;
  font-size: 12px;
  font-weight: bold;
  cursor: pointer;
  pointer-events: auto;
  z-index: 20;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s ease;
  line-height: 1;
}

.fp-delete-btn:hover {
  background: #dc2626;
  transform: translate(-50%, -50%) scale(1.2);
}
</style>