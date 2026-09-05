<template>
  <v-dialog :model-value="show" @update:model-value="close" :fullscreen="isMobile"
    :max-width="isMobile ? '100%' : (isEditing ? '1360px' : '80vw')" :transition="isMobile ? 'dialog-bottom-transition' : 'dialog-transition'">
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
        <!-- Vuetify Touch 指令僅在 mounted 綁定、無 updated hook，:touch 動態值不會生效，須靜態停用 -->
        <v-window v-model="tab" :touch="false"
          :class="{ 'edit-window-visible': isEditing && !isMobile }">
          <v-window-item value="info">
            <template v-if="isEditing">
              <div class="edit-shell" :class="{ 'edit-shell--desktop': !isMobile }">

              <!-- 📱 [手機版] 分區快速切換：預設「全部」堆疊；點選分區只顯示該區塊，只改單一欄位免長捲動 -->
              <div v-if="isMobile" class="edit-mobile-nav">
                <button
                  type="button"
                  class="edit-mobile-chip"
                  :class="{ 'edit-mobile-chip--active': activeMobileEditSection === 'all' }"
                  @click="activeMobileEditSection = 'all'"
                >全部</button>
                <button
                  v-for="sec in editSections"
                  :key="sec.key"
                  type="button"
                  class="edit-mobile-chip"
                  :class="{ 'edit-mobile-chip--active': activeMobileEditSection === sec.key }"
                  @click="activeMobileEditSection = sec.key"
                >
                  <v-icon size="15">{{ sec.icon }}</v-icon>{{ sec.title }}
                  <v-icon v-if="sec.alert" size="13" color="error">mdi-alert-circle</v-icon>
                </button>
              </div>

              <!-- 🖥️ [電腦版] 左側項目導覽：點選切換右側內容，一次只看一個區塊，免長捲動 -->
              <nav v-if="!isMobile" class="edit-nav">
                <button v-for="sec in editSections" :key="sec.key" type="button"
                  class="edit-nav-item" :class="{ 'edit-nav-item--active': activeEditSection === sec.key }"
                  @click="activeEditSection = sec.key">
                  <v-icon size="20" :color="activeEditSection === sec.key ? sec.color : 'grey-darken-1'">{{ sec.icon }}</v-icon>
                  <span class="edit-nav-text">
                    <span class="edit-nav-title">{{ sec.title }}</span>
                    <span class="edit-nav-summary">{{ sec.summary }}</span>
                  </span>
                  <v-icon v-if="sec.alert" size="16" color="error" class="edit-nav-alert">mdi-alert-circle</v-icon>
                </button>
              </nav>

              <div class="edit-panes">

              <!-- 面積資訊 (唯讀展示) -->
              <v-card v-show="isEditSectionVisible('area')" variant="outlined" class="mb-4 pa-3 bg-grey-lighten-5" style="border-color: #ddd;">
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

              <v-card v-show="isEditSectionVisible('area')" variant="outlined" class="mb-4 pa-3 bg-grey-lighten-5" style="border-color: #ddd;">
                <div class="d-flex align-center mb-2">
                  <v-icon color="brown" class="mr-2">mdi-map-marker-multiple</v-icon>
                  <span class="text-subtitle-1 font-weight-bold" style="color: #795548;">土地標的清冊</span>
                </div>
                <LandParcelsPanel
                  v-model="editingData.landParcels"
                  :editable="true"
                />
              </v-card>

              <v-card v-show="isEditSectionVisible('price')" variant="outlined" class="mb-4 pa-3 bg-grey-lighten-5" style="border-color: #ddd;">
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

                  <v-col cols="12" md="3" v-if="editingData.area_terrace_ping > 0">
                    <v-text-field v-model="editingData.price_list_house_only" label="房屋表價(不含露臺)" suffix="萬"
                      type="number" variant="outlined" :bg-color="!isPriceEditable ? '#f5f5f5' : 'white'"
                      class="input-price-list" :readonly="!isPriceEditable"
                      :rules="[val => val >= 0 || '金額不可小於 0']"
                      :hint="`單價: ${editingListHouseOnlyUnitPrice} 萬/坪`" persistent-hint></v-text-field>
                  </v-col>

                  <v-col cols="12" md="3" v-if="editingData.area_terrace_ping > 0">
                    <v-text-field v-model="editingData.price_list_terrace" label="露臺表價" suffix="萬" type="number"
                      variant="outlined" :bg-color="!isPriceEditable ? '#f5f5f5' : 'white'" class="input-price-list"
                      :readonly="!isPriceEditable"
                      :rules="[val => val >= 0 || '金額不可小於 0']"
                      :hint="`露臺 ${formatNumber(editingData.area_terrace_ping, 2)} 坪 · 單價: ${editingListTerraceUnitPrice} 萬/坪`"
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

                  <!-- 配套房屋總價：合約上的房屋總價，配套價格＝成交總價 − 此值 -->
                  <v-col cols="12" md="3" v-if="viewMode === 'sales'">
                    <v-text-field v-model="editingData.price_package_deal" label="配套房屋總價" suffix="萬" type="number"
                      variant="outlined" :bg-color="!isPriceEditable ? '#f5f5f5' : 'white'"
                      class="input-price-package" :readonly="!isPriceEditable"
                      :rules="[val => !val || val >= 0 || '金額不可小於 0']"
                      :hint="editingPackagePriceHint" persistent-hint>
                      <template #append-inner>
                        <v-tooltip location="top" max-width="300" open-on-click>
                          <template #activator="{ props: tipProps }">
                            <v-icon v-bind="tipProps" size="18" color="grey-darken-1"
                              style="cursor: help;">mdi-information-outline</v-icon>
                          </template>
                          <span>配套價格：為避開高價住宅門檻（例如 4,000 萬以上）時使用。<br />
                            此處填合約上的「配套房屋總價」，配套價格＝成交總價 − 配套房屋總價，合約製作與付款表會自動採用。</span>
                        </v-tooltip>
                      </template>
                    </v-text-field>
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
              <v-card v-show="isEditSectionVisible('ratio')" variant="outlined" class="mb-4 pa-3 bg-grey-lighten-5" style="border-color: #ddd;">
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

              <div v-show="isSalesFormVisible">
                <SalesInfoForm v-if="editingData" v-model="editingData" :statusOptions="statusOptions"
                  :personnelOptions="personnelOptions" :allSalesImages="allProjectImages"
                  :allParkingData="allData['車位'] || []" :projectName="projectName" :project-id="projectId"
                  :view-mode="props.viewMode" @request-open-slide="$emit('request-open-slide')"
                  @parking-updated="handleParkingUpdate" :contractTypeOptions="props.contractTypes"
                  :firstPurchaseOptions="firstPurchaseOptions" :planOptions="props.planOptions"
                  :tag-suggestions="tagSuggestions"
                  :remark-notes="viewRemarkNotes" :remark-legacy-remarks="viewLegacyRemarks"
                  :remark-persist-handler="persistRemarkNotes" :remark-storage-prefix="remarkNotesStoragePrefix"
                  :visible-sections="salesFormVisibleSections" />
              </div>

              <v-card v-if="editingData" v-show="isEditSectionVisible('payments')" variant="outlined" class="mt-4 mb-4 pa-3 bg-grey-lighten-5" style="border-color: #ddd;">
                <div class="d-flex align-center mb-2">
                  <v-icon color="teal" class="mr-2">mdi-cash-multiple</v-icon>
                  <span class="text-subtitle-1 font-weight-bold" style="color: #00796B;">戶別繳款紀錄</span>
                </div>
                <PaymentRecordsPanel
                  v-model="editingData.paymentRecords"
                  :editable="true"
                  :total-price-wan="editingData.price_transaction_total"
                  :unit-id="editingData.unitId || ''"
                  :drive-folder-url="editingData.driveFolderUrl || ''"
                />
              </v-card>

              </div><!-- /edit-panes -->
              </div><!-- /edit-shell -->
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
                        <!-- 🔐 手機版隱藏解鎖：連點戶別 8 次切換已售報價顯示 -->
                        <span><span class="tap-unlock-target" @click="tapUnlockPriceQuote">{{ unitData.unitId }}</span> 價格資訊</span>
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
                        <!-- ✅ 面積基準：讓使用者一眼看出單價計算基準為房屋總面積 -->
                        <div class="deal-area-strip">
                          <span class="deal-area-item">
                            <span class="deal-area-label">房屋總面積</span>
                            <strong>{{ formatNumber(unitData.area_house_ping, 2) }}</strong> 坪
                            <span class="deal-area-sqm">({{ formatNumber(unitData.area_house_sqm, 2) }} m²)</span>
                          </span>
                          <span v-if="unitData.area_terrace_ping > 0" class="deal-area-item">
                            <span class="deal-area-label">露臺</span>
                            <strong>{{ formatNumber(unitData.area_terrace_ping, 2) }}</strong> 坪
                            <span class="deal-area-sqm">(不計坪)</span>
                          </span>
                        </div>
                        <v-list dense>
                          <div class="total-block">
                            <div class="total-block-main">
                              <span class="total-block-label">成交總價</span>
                              <span class="highlight-price-final">{{ formatNumber(grandTotalTransactionPrice) }} 萬</span>
                            </div>
                            <div class="total-block-sub">房屋 {{ formatNumber(houseTransactionPrice) }} ＋ 車位 {{
                              formatNumber(parkingTotalTransactionPrice) }}</div>
                          </div>
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
                          <div class="total-block">
                            <div class="total-block-main">
                              <span class="total-block-label">合計底價</span>
                              <span class="highlight-price">{{ formatNumber(totalFloorPrice) }} 萬</span>
                            </div>
                            <div class="total-block-sub">
                              <template v-if="showFloorTerraceSplit">房屋(不含露臺) {{ formatNumber(houseOnlyFloorPrice) }} ＋ 露臺 {{
                                formatNumber(terraceFloorPrice) }} ＋ 車位 {{ formatNumber(parkingTotalFloorPrice) }}</template>
                              <template v-else>房屋 {{ formatNumber(houseFloorPrice) }} ＋ 車位 {{
                                formatNumber(parkingTotalFloorPrice) }}</template>
                            </div>
                          </div>
                          <v-list-item title="溢差價" class="premium-price-item"><template v-slot:append><span
                                :class="pricePremium >= 0 ? 'text-success' : 'text-error'"
                                style="font-size: 1.1rem; font-weight: 600;">{{ formatNumber(pricePremium, 0) }}
                                萬</span></template></v-list-item>
                        </v-list>
                        <div v-if="assignedParkingLots.length" class="parking-deal-block">
                          <div class="parking-deal-summary">
                            <span class="parking-deal-title">車位明細
                              <span class="parking-deal-count">{{ assignedParkingLots.length }} 個</span>
                            </span>
                          </div>
                          <div class="parking-deal-table">
                            <div class="parking-deal-row head">
                              <span class="pd-id">車位</span>
                              <span class="pd-num">底價</span>
                              <span class="pd-num">成交</span>
                            </div>
                            <div v-for="(parking, index) in assignedParkingLots" :key="index" class="parking-deal-row">
                              <span class="pd-id">
                                <strong>{{ parking['車位編號'] }}</strong>
                                <small v-if="parking['車位尺寸']" class="pd-size">{{ parking['車位尺寸'] }}</small>
                              </span>
                              <span class="pd-num">{{ formatNumber(parking['車位底價']) }}</span>
                              <span class="pd-num pd-deal">{{ formatNumber(parking['車位成交價']) }}</span>
                            </div>
                            <div v-if="assignedParkingLots.length > 1" class="parking-deal-row foot">
                              <span class="pd-id">合計</span>
                              <span class="pd-num">{{ formatNumber(parkingTotalFloorPrice) }}</span>
                              <span class="pd-num pd-deal">{{ formatNumber(parkingTotalTransactionPrice) }}</span>
                            </div>
                          </div>
                        </div>
                        <div v-if="dealUnitPrice !== null || floorUnitPrice !== null || registeredUnitPrice !== null"
                          class="unit-price-strip">
                          <div class="unit-price-strip-title">單價（萬/坪）</div>

                          <!-- 內部單價（公司內部參考）：車位以底價扣除，有露臺再扣露臺底價 -->
                          <div class="unit-price-group">
                            <div class="unit-price-group-header" @click="showInternalUnitPrice = !showInternalUnitPrice">
                              <v-icon size="small">{{ showInternalUnitPrice ? 'mdi-chevron-down' : 'mdi-chevron-right' }}</v-icon>
                              <span class="unit-price-group-name">內部單價</span>
                              <span class="unit-price-group-tag internal">公司內部</span>
                              <span v-if="!showInternalUnitPrice" class="unit-price-group-collapsed-hint">已收合</span>
                            </div>
                            <template v-if="showInternalUnitPrice">
                              <div class="unit-price-formula">
                                ＝（總價 − 車位<strong>底價</strong><template v-if="terraceFloorPrice > 0"> − 露臺底價</template>）÷ 房屋面積
                              </div>
                              <div class="unit-price-tiles">
                                <div class="unit-price-tile">
                                  <div class="unit-price-tile-label">成交單價</div>
                                  <div class="unit-price-tile-value deal">{{ dealUnitPrice === null ? '—' : formatNumber(dealUnitPrice, 2) }}</div>
                                </div>
                                <div class="unit-price-tile">
                                  <div class="unit-price-tile-label">底價單價</div>
                                  <div class="unit-price-tile-value floor">{{ floorUnitPrice === null ? '—' : formatNumber(floorUnitPrice, 2) }}</div>
                                </div>
                                <div class="unit-price-tile">
                                  <div class="unit-price-tile-label">溢差價單價</div>
                                  <div class="unit-price-tile-value"
                                    :class="premiumUnitPrice === null ? '' : (premiumUnitPrice >= 0 ? 'text-success' : 'text-error')">
                                    {{ premiumUnitPriceText }}</div>
                                </div>
                              </div>
                            </template>
                          </div>

                          <!-- 實價登錄單價（客戶端）：車位以成交價扣除，不扣露臺 -->
                          <div class="unit-price-group">
                            <div class="unit-price-group-header" @click="showRegisteredUnitPrice = !showRegisteredUnitPrice">
                              <v-icon size="small">{{ showRegisteredUnitPrice ? 'mdi-chevron-down' : 'mdi-chevron-right' }}</v-icon>
                              <span class="unit-price-group-name">實價登錄單價</span>
                              <span class="unit-price-group-tag registered">客戶端</span>
                              <span v-if="!showRegisteredUnitPrice" class="unit-price-group-collapsed-hint">已收合</span>
                            </div>
                            <template v-if="showRegisteredUnitPrice">
                              <div class="unit-price-formula">
                                ＝（成交總價 − 車位<strong>成交價</strong>）÷ 房屋面積<template v-if="terraceFloorPrice > 0">（不扣露臺）</template>
                              </div>
                              <div class="unit-price-tiles">
                                <div class="unit-price-tile">
                                  <div class="unit-price-tile-label">實登單價</div>
                                  <div class="unit-price-tile-value registered">{{ registeredUnitPrice === null ? '—' : formatNumber(registeredUnitPrice, 2) }}</div>
                                </div>
                              </div>
                            </template>
                          </div>
                        </div>
                      </div>
                    </v-col>
                    <v-col cols="12" md="4">
                      <div class="info-section">
                        <div class="section-title section-title--flex">
                          <span>{{ unitData.unitId }} 銷售資訊</span>
                          <span v-if="unitData.propertyType" class="section-title-tag">{{ unitData.propertyType }}</span>
                        </div>

                        <!-- 銷控狀態：沿用建案設定的狀態色，與銷控表格一致 -->
                        <div class="sales-status-hero" :style="salesStatusHeroStyle">
                          <div class="sales-status-hero-label">
                            <v-icon size="16">mdi-flag-outline</v-icon>銷控狀態
                          </div>
                          <div class="sales-status-hero-value">{{ unitData.salesStatus_backend || '尚未設定' }}</div>
                        </div>

                        <!-- 銷售進度：小訂 → 補足 → 簽約 -->
                        <div class="sales-timeline">
                          <div v-for="(step, i) in salesTimelineSteps" :key="step.key" class="sales-timeline-step"
                            :class="{ done: step.done, current: step.current }">
                            <div class="sales-timeline-node">
                              <span class="sales-timeline-dot">
                                <v-icon v-if="step.done" size="12" color="#fff">mdi-check</v-icon>
                                <span v-else>{{ i + 1 }}</span>
                              </span>
                              <span v-if="i < salesTimelineSteps.length - 1" class="sales-timeline-line"></span>
                            </div>
                            <div class="sales-timeline-name">{{ step.label }}</div>
                            <div class="sales-timeline-date">{{ step.date }}</div>
                          </div>
                        </div>

                        <div class="info-dl">
                          <div class="info-dl-row">
                            <div class="info-dl-label"><v-icon size="16">mdi-account-tie-outline</v-icon>銷售人員</div>
                            <div class="info-dl-value">
                              <template v-if="viewSalespersons.length">
                                <span v-for="p in viewSalespersons" :key="p" class="info-person-chip">
                                  <v-icon size="14">mdi-account</v-icon>{{ p }}
                                </span>
                              </template>
                              <span v-else class="info-dl-empty">—</span>
                            </div>
                          </div>
                          <div class="info-dl-row">
                            <div class="info-dl-label"><v-icon size="16">mdi-file-sign</v-icon>合約方式</div>
                            <div class="info-dl-value" :class="{ 'info-dl-empty': !unitData.contractType }">
                              {{ unitData.contractType || '—' }}
                            </div>
                          </div>
                          <div class="info-dl-row">
                            <div class="info-dl-label"><v-icon size="16">mdi-home-plus-outline</v-icon>是否首購</div>
                            <div class="info-dl-value">
                              <span v-if="unitData.isFirstTimeBuyer === true" class="info-bool yes">
                                <v-icon size="14">mdi-check-circle</v-icon>是
                              </span>
                              <span v-else-if="unitData.isFirstTimeBuyer === false" class="info-bool no">
                                <v-icon size="14">mdi-minus-circle-outline</v-icon>否
                              </span>
                              <span v-else class="info-dl-empty">—</span>
                            </div>
                          </div>
                          <div class="info-dl-row">
                            <div class="info-dl-label"><v-icon size="16">mdi-barcode</v-icon>申報書序號</div>
                            <div class="info-dl-value mono" :class="{ 'info-dl-empty': !unitData.reportNo }">
                              {{ unitData.reportNo || '—' }}
                            </div>
                          </div>
                          <div class="info-dl-row">
                            <div class="info-dl-label"><v-icon size="16">mdi-tag-multiple-outline</v-icon>文字標籤</div>
                            <div class="info-dl-value">
                              <div v-if="viewUnitTags.length > 0" class="d-flex flex-wrap ga-1">
                                <v-chip
                                  v-for="(tag, i) in viewUnitTags"
                                  :key="i"
                                  size="x-small"
                                  label
                                  class="font-weight-bold"
                                  :style="{ backgroundColor: tag.bgColor, color: tag.textColor }"
                                >{{ tag.text }}</v-chip>
                              </div>
                              <span v-else class="info-dl-empty">—</span>
                            </div>
                          </div>
                        </div>

                        <!-- ✅ 備註（留言式）：檢視模式即可 CRUD，不必進「修改銷控」 -->
                        <v-divider class="my-2"></v-divider>
                        <RemarkNotesPanel
                          :notes="viewRemarkNotes"
                          :legacy-remarks="viewLegacyRemarks"
                          :persist-handler="persistRemarkNotes"
                          :storage-path-prefix="remarkNotesStoragePrefix"
                        />
                      </div>
                    </v-col>
                    <v-col cols="12" md="4">
                      <div class="info-section">
                        <div class="section-title section-title--flex">
                          <span>{{ unitData.unitId }} 買方資訊</span>
                          <span v-if="viewCoBuyers.length" class="section-title-tag indigo">
                            <v-icon size="13">mdi-account-multiple-outline</v-icon>共同買方 {{ viewCoBuyers.length }}
                          </span>
                        </div>

                        <!-- 尚無買方：空狀態，避免整欄都是「-」 -->
                        <div v-if="!hasBuyerInfo" class="buyer-empty">
                          <v-icon size="32" color="#b0bec5">mdi-account-off-outline</v-icon>
                          <div class="buyer-empty-title">尚未填寫買方資料</div>
                          <div class="buyer-empty-hint">進入「修改銷控」→ 買方資訊即可建立</div>
                        </div>

                        <template v-else>
                          <!-- 主買方：姓名＋可直接撥打 / 寄信 -->
                          <div class="buyer-hero">
                            <div class="buyer-avatar">{{ buyerInitial }}</div>
                            <div class="buyer-hero-main">
                              <div class="buyer-name" :class="{ 'info-dl-empty': !unitData.buyerName }">
                                {{ unitData.buyerName || '未填姓名' }}
                              </div>
                              <div class="buyer-contact">
                                <a v-if="unitData.buyerPhone" :href="`tel:${unitData.buyerPhone}`" class="buyer-contact-link">
                                  <v-icon size="15">mdi-phone-outline</v-icon>{{ unitData.buyerPhone }}
                                </a>
                                <span v-else class="buyer-contact-link muted">
                                  <v-icon size="15">mdi-phone-outline</v-icon>未填電話
                                </span>
                                <a v-if="unitData.buyerEmail" :href="`mailto:${unitData.buyerEmail}`" class="buyer-contact-link">
                                  <v-icon size="15">mdi-email-outline</v-icon>{{ unitData.buyerEmail }}
                                </a>
                              </div>
                            </div>
                          </div>

                          <div class="info-dl">
                            <div class="info-dl-row">
                              <div class="info-dl-label"><v-icon size="16">mdi-card-account-details-outline</v-icon>身分證號</div>
                              <div class="info-dl-value mono" :class="{ 'info-dl-empty': !unitData.buyerIdNumber }">
                                {{ unitData.buyerIdNumber || '—' }}
                              </div>
                            </div>
                            <div class="info-dl-row">
                              <div class="info-dl-label"><v-icon size="16">mdi-cake-variant-outline</v-icon>出生年月日</div>
                              <div class="info-dl-value">
                                <template v-if="unitData.buyerDateOfBirth">
                                  <span class="mono">{{ formatDate(unitData.buyerDateOfBirth) }}</span>
                                  <span class="info-dl-sub">{{ formatROCDate(unitData.buyerDateOfBirth) }}</span>
                                </template>
                                <span v-else class="info-dl-empty">—</span>
                              </div>
                            </div>
                            <div class="info-dl-row">
                              <div class="info-dl-label"><v-icon size="16">mdi-mailbox-outline</v-icon>通訊地址</div>
                              <div class="info-dl-value addr" :class="{ 'info-dl-empty': buyerMailingAddress === '-' }">
                                {{ buyerMailingAddress === '-' ? '—' : buyerMailingAddress }}
                              </div>
                            </div>
                            <div class="info-dl-row">
                              <div class="info-dl-label"><v-icon size="16">mdi-home-city-outline</v-icon>戶籍地址</div>
                              <div class="info-dl-value addr" :class="{ 'info-dl-empty': buyerPermanentAddress === '-' }">
                                <template v-if="buyerPermanentAddress === '-'">—</template>
                                <template v-else>
                                  {{ buyerPermanentAddress }}
                                  <span v-if="isPermanentSameAsMailing" class="info-dl-sub">同通訊地址</span>
                                </template>
                              </div>
                            </div>
                          </div>
                        </template>

                        <!-- ✅ 共同買方（coBuyers）唯讀摘要：改為卡片、逐欄呈現 -->
                        <template v-if="viewCoBuyers.length">
                          <div class="cobuyer-title">
                            <v-icon size="16" class="mr-1">mdi-account-multiple-outline</v-icon>
                            共同買方
                            <span class="cobuyer-title-count">{{ viewCoBuyers.length }} 位</span>
                          </div>
                          <div v-for="(cb, i) in viewCoBuyers" :key="i" class="cobuyer-card">
                            <div class="cobuyer-head">
                              <span class="cobuyer-index">{{ i + 1 }}</span>
                              <span class="cobuyer-name" :class="{ 'info-dl-empty': !cb.name }">{{ cb.name || '未填姓名' }}</span>
                            </div>
                            <div class="cobuyer-rows">
                              <a v-if="cb.phone" :href="`tel:${cb.phone}`" class="cobuyer-row link">
                                <v-icon size="14">mdi-phone-outline</v-icon><span>{{ cb.phone }}</span>
                              </a>
                              <div v-if="cb.idNumber" class="cobuyer-row">
                                <v-icon size="14">mdi-card-account-details-outline</v-icon><span class="mono">{{ cb.idNumber }}</span>
                              </div>
                              <a v-if="cb.email" :href="`mailto:${cb.email}`" class="cobuyer-row link">
                                <v-icon size="14">mdi-email-outline</v-icon><span>{{ cb.email }}</span>
                              </a>
                              <div v-if="cb.dateOfBirth" class="cobuyer-row">
                                <v-icon size="14">mdi-cake-variant-outline</v-icon><span>{{ formatROCDate(cb.dateOfBirth) }}</span>
                              </div>
                              <div v-if="coBuyerAddress(cb)" class="cobuyer-row">
                                <v-icon size="14">mdi-mailbox-outline</v-icon><span>{{ coBuyerAddress(cb) }}</span>
                              </div>
                              <div v-if="!cb.phone && !cb.idNumber && !cb.email && !cb.dateOfBirth && !coBuyerAddress(cb)"
                                class="cobuyer-row info-dl-empty">
                                <v-icon size="14">mdi-information-outline</v-icon><span>僅填寫姓名</span>
                              </div>
                            </div>
                          </div>
                        </template>
                      </div>
                    </v-col>
                  </v-row>

                  <!-- ✅ 戶別繳款紀錄（檢視模式：免進編輯模式即可新增/編輯/刪除，即時儲存） -->
                  <PaymentRecordsPanel
                    class="mt-2"
                    :model-value="viewPaymentRecords"
                    :editable="false"
                    :allow-quick-add="true"
                    :quick-add-handler="handleQuickAddPaymentRecord"
                    :quick-update-handler="handleQuickUpdatePaymentRecord"
                    :quick-delete-handler="handleQuickDeletePaymentRecord"
                    :total-price-wan="grandTotalTransactionPrice"
                    :unit-id="unitData.unitId || ''"
                    :drive-folder-url="unitData.driveFolderUrl || ''"
                  />
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

                  <!-- ✅ [上傳文件] 檢視模式：上傳任意格式文件至戶別 Drive 資料夾（即時儲存，SPEC_UnitDocumentUpload.md） -->
                  <UnitDocumentsPanel
                    ref="unitDocumentsPanelRef"
                    class="mt-2"
                    :model-value="viewUnitDocuments"
                    :project-id="projectId"
                    :unit-id="unitData.unitId || ''"
                    :drive-folder-url="unitData.driveFolderUrl || ''"
                    :upload-handler="handleUploadUnitDocument"
                    :rename-handler="handleRenameUnitDocument"
                    :delete-handler="handleDeleteUnitDocument"
                    :auto-open-upload="autoOpenDocumentsUploadOnce"
                  />
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
              <v-btn v-if="viewMode === 'sales' && unitData && unitData.contractDrawingFolderUrl" color="indigo"
                variant="flat" :href="unitData.contractDrawingFolderUrl" target="_blank">
                <v-icon left>mdi-floor-plan</v-icon>
                合約分戶圖
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
              <v-btn v-if="viewMode === 'sales'" color="deep-purple" variant="flat" @click="openContractDoc">
                <v-icon left>mdi-file-document-edit-outline</v-icon>
                合約製作設定
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
              <!-- ✅ [上傳文件] 未設定資料夾時仍顯示但停用，tooltip 提示 -->
              <v-tooltip v-if="viewMode === 'sales' && unitData" location="top"
                :disabled="!!unitData.driveFolderUrl" text="請先於修改銷控設定「戶別資料夾位置」">
                <template v-slot:activator="{ props: tipProps }">
                  <span v-bind="tipProps">
                    <v-btn color="indigo" variant="flat" :disabled="!unitData.driveFolderUrl" @click="openDocumentsUpload">
                      <v-icon left>mdi-cloud-upload-outline</v-icon>
                      上傳文件
                    </v-btn>
                  </span>
                </template>
              </v-tooltip>
                  <span class="text-caption">{{ addToQuoteButtonText }}</span>
                </v-btn>
                <!-- 主要操作：付款表設定 -->
                <v-btn v-if="viewMode === 'sales'" stacked variant="text" class="flex-grow-1"
                  @click="openPaymentSettings">
                  <v-icon>mdi-cash-register</v-icon>
                  <span class="text-caption">付款表</span>
                </v-btn>
                <!-- 主要操作：合約製作設定 -->
                <v-btn v-if="viewMode === 'sales'" stacked variant="text" class="flex-grow-1"
                  @click="openContractDoc">
                  <v-icon>mdi-file-document-edit-outline</v-icon>
                  <span class="text-caption">合約製作</span>
                </v-btn>
                <!-- 📱 [改版] 更多操作：改為底部功能面板（比照銷控系統樣式，遮罩可擋點擊穿透） -->
                <v-btn v-if="unitToolGroups.length > 0" stacked variant="text" class="flex-grow-1"
                  @click="isUnitToolsSheetOpen = true">
                  <v-icon>mdi-apps</v-icon>
                  <span class="text-caption">功能</span>
                </v-btn>
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

  <!-- 📱 [新增] 戶別資訊「更多功能」底部面板：分群圖示磚，比照銷控系統底部面板樣式（可下滑或按 X 關閉） -->
  <MobileBottomSheet v-model="isUnitToolsSheetOpen" icon="mdi-apps" :title="`${unitData?.unitId || ''} 更多功能`">
      <div v-for="group in unitToolGroups" :key="group.title" class="mobile-sheet-section">
        <div class="mobile-sheet-label">{{ group.title }}</div>
        <div class="mobile-tool-grid">
          <button
            v-for="tool in group.tools"
            :key="tool.label"
            type="button"
            class="mobile-tool"
            @click="runUnitToolAction(tool.action)"
          >
            <span class="mobile-tool-icon"><v-icon size="22">{{ tool.icon }}</v-icon></span>
            <span class="mobile-tool-label">{{ tool.label }}</span>
          </button>
        </div>
      </div>
  </MobileBottomSheet>

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

  <ContractDocDialog v-if="contractDocDialog" :show="contractDocDialog"
    @update:show="contractDocDialog = $event" :unit-data="enrichedUnitData" :project-name="projectName"
    :project-id="projectId" :all-data="allData" />

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
import { ref, watch, computed, defineProps, defineEmits, onUnmounted, onMounted, nextTick, defineAsyncComponent } from 'vue';
import { useDisplay } from 'vuetify';
import { useUserStore } from '@/store/user';
import { IMAGE_PROXY_BASE_URL, updateSalesData, cancelPurchase, updateParkingLot, paymentProofApi, unitDocumentApi } from '@/api';
import SalesInfoForm from './SalesInfoForm.vue';
import { normalizeSalespersons, formatSalespersons } from '@/utils/salespersonUtils';
import { getUnitTags, collectTagSuggestions, getContrastTextColor } from '@/utils/unitTags';
import { useStatusColorStore } from '@/store/statusColorStore';
import SalesBotChat from './SalesBotChat.vue';
import LandParcelsPanel from './LandParcelsPanel.vue';
import PaymentRecordsPanel from './PaymentRecordsPanel.vue';
import RemarkNotesPanel from './RemarkNotesPanel.vue';
import { db } from '@/firebase';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { buildRemarksSummary } from '@/utils/remarkNotes';
import { computeHouseLandPrices, buildDefaultFormulas, isSpecialContractType } from '@/composables/usePriceFormula';
import { useQuoteStore } from '@/store/quoteStore';
import PaymentSettings from '@/views/PaymentSettings.vue';
// ✅ [效能] 合約製作彈窗（約 220KB）改為非同步載入；模板以 v-if 於開啟時建立，故安全
const ContractDocDialog = defineAsyncComponent(() => import('@/components/contractDoc/ContractDocDialog.vue'));
import MobileBottomSheet from '@/components/MobileBottomSheet.vue';
import ConfirmationDialog from './ConfirmationDialog.vue';
import CancelPurchaseDialog from './CancelPurchaseDialog.vue';
import SalesStatusNotifyDialog from './SalesStatusNotifyDialog.vue';
import RealPriceReportExportDialog from './RealPriceReport/ExportDialog.vue';
import { useToast, POSITION } from 'vue-toastification';
import { useTapUnlock } from '@/composables/useTapUnlock';
// ✅ [效能] xlsx 只在匯出銷售資料時需要 → 動態載入，不隨戶別詳情 Modal 一起下載
const loadXLSX = () => import('xlsx');
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
// 🖥️ [新增] 電腦版「修改銷控」左側項目導覽：目前選取的區塊（手機版維持全部堆疊顯示）
const activeEditSection = ref('sales');
// 📱 [新增] 手機版「修改銷控」分區快速切換：預設「全部」維持堆疊，點選分區只顯示該區塊，只改單一欄位免長捲動
const activeMobileEditSection = ref('all');

// 📱 [新增] 戶別資訊「更多功能」底部面板（取代原 v-menu，比照銷控系統底部面板樣式）
import UnitDocumentsPanel from './UnitDocumentsPanel.vue';
const isUnitToolsSheetOpen = ref(false);
const unitToolGroups = computed(() => {
  if (props.viewMode !== 'sales') return [];
  const d = props.unitData || {};
  const docs = [];
  if (d.driveFolderUrl) {
    docs.push({ icon: 'mdi-folder-google-drive', label: `${d.unitId} 資料夾`, action: () => window.open(d.driveFolderUrl, '_blank') });
  }
  if (d.contractDrawingFolderUrl) {
    docs.push({ icon: 'mdi-floor-plan', label: '合約分戶圖', action: () => window.open(d.contractDrawingFolderUrl, '_blank') });
  }
  docs.push({ icon: 'mdi-microsoft-excel', label: '下載本戶資料', action: downloadExcel });
  const manage = [
    { icon: 'mdi-file-document-arrow-right-outline', label: '實價登錄', action: openRealPriceReportDialog },
  ];
  if (isSold.value) {
    manage.push({ icon: 'mdi-account-cancel-outline', label: '辦理退戶', action: openCancelPurchaseDialog });
  }
  return [
    { title: '文件與下載', tools: docs },
    { title: '管理', tools: manage },
  ];
});
// 面板關閉後再執行動作：等 overlay 移除，避免關閉瞬間點擊穿透誤觸下層內容
function runUnitToolAction(action) {
  isUnitToolsSheetOpen.value = false;
  setTimeout(() => action(), 150);
}

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

// 🔐 [隱藏功能] 手機版無鍵盤：連續點按「價格資訊的戶別」8 次，效果同連按 8 次 'a'
const { tap: tapUnlockPriceQuote } = useTapUnlock(() => {
  showHiddenPriceQuote.value = !showHiddenPriceQuote.value;
});
const handleKeyPress = (e) => {
  if (e.key.toLowerCase() === 'a') {
    keySequence.value += 'a';
  // ✅ [上傳文件] 需先設定戶別資料夾位置；未設定時提示而非靜默無反應
  docs.push({
    icon: 'mdi-cloud-upload-outline', label: '上傳文件',
    action: () => {
      if (!d.driveFolderUrl) { toast.warning('請先於修改銷控設定「戶別資料夾位置」'); return; }
      openDocumentsUpload();
    },
  });
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



// ── 🖥️ [新增] 電腦版「修改銷控」左側項目導覽 ──
// 左邊點項目、右邊只顯示對應內容；手機版不變（全部區塊由上而下堆疊）
const SALES_FORM_SECTION_KEYS = ['sales', 'deal', 'buyer', 'system'];
const editSections = computed(() => {
  const d = editingData.value || {};
  const persons = Array.isArray(d.salesperson) ? d.salesperson.filter(Boolean).join('、') : (d.salesperson || '');
  const statusText = d.salesStatus_backend || '尚未設定狀態';
  const ratioH = Number(d.housePriceRatio) || 0;
  const ratioL = Number(d.landPriceRatio) || 0;
  const parcelCount = Array.isArray(d.landParcels) ? d.landParcels.length : 0;
  const recordCount = Array.isArray(d.paymentRecords) ? d.paymentRecords.length : 0;
  const planCount = Array.isArray(d.availablePlans) ? d.availablePlans.length : 0;
  const imageCount = Array.isArray(d.salesImages) ? d.salesImages.length : 0;
  const tagCount = Array.isArray(d.unitTags) ? d.unitTags.length : 0;
  return [
    {
      key: 'sales', title: '銷售資訊', icon: 'mdi-information-outline', color: 'primary',
      summary: persons ? `${statusText} · ${persons}` : statusText,
    },
    {
      key: 'deal', title: '成交資訊', icon: 'mdi-currency-usd', color: 'green-darken-2',
      summary: `成交總價 ${formatNumber(Number(d.price_transaction_total) || 0)} 萬`,
    },
    {
      key: 'buyer', title: '買方資訊', icon: 'mdi-account-details', color: 'indigo',
      summary: d.buyerName ? d.buyerName : '尚未填寫買方',
    },
    {
      key: 'price', title: '價格設定', icon: 'mdi-cash-multiple', color: 'primary',
      summary: `表價 ${formatNumber(Number(d.price_list_house_total) || 0)} 萬`,
    },
    {
      key: 'ratio', title: '房土比', icon: 'mdi-chart-donut', color: 'deep-orange',
      summary: (ratioH + ratioL) > 0 ? `房 ${ratioH}% / 地 ${ratioL}%` : '尚未設定',
      // 加總 ≠ 100 會擋儲存，導覽列直接標紅提醒（該區塊可能沒被打開）
      alert: editingRatioSum.value !== 0 && Math.abs(editingRatioSum.value - 100) > 0.001,
    },
    {
      key: 'area', title: '面積與土地', icon: 'mdi-floor-plan', color: 'teal',
      summary: `${formatNumber(Number(d.area_house_ping) || 0, 2)} 坪 · 地號 ${parcelCount} 筆`,
    },
    {
      key: 'payments', title: '戶別繳款紀錄', icon: 'mdi-receipt-text-outline', color: 'teal-darken-2',
      summary: recordCount > 0 ? `${recordCount} 筆` : '尚無紀錄',
    },
    {
      key: 'system', title: '系統設定', icon: 'mdi-cog-outline', color: 'blue-grey-darken-1',
      summary: (planCount + imageCount + tagCount) > 0 ? `方案 ${planCount} · 圖片 ${imageCount} · 標籤 ${tagCount}` : '可選方案 · 戶別圖片 · 文字標籤',
    },
  ];
});
// 📱 手機版：預設「全部」堆疊顯示，選了分區則只顯示該區塊；電腦版只顯示左側選取項目
function isEditSectionVisible(key) {
  if (isMobile.value) {
    return activeMobileEditSection.value === 'all' || activeMobileEditSection.value === key;
  }
  return activeEditSection.value === key;
}
const isSalesFormVisible = computed(() => {
  if (isMobile.value) {
    return activeMobileEditSection.value === 'all' || SALES_FORM_SECTION_KEYS.includes(activeMobileEditSection.value);
  }
  return SALES_FORM_SECTION_KEYS.includes(activeEditSection.value);
});
// 傳給 SalesInfoForm：null = 全部區塊（手機版「全部」），否則只顯示選取的那一欄
const salesFormVisibleSections = computed(() => {
  if (isMobile.value) {
    return activeMobileEditSection.value === 'all' ? null : [activeMobileEditSection.value];
  }
  return [activeEditSection.value];
});

// ✅ [新增] 編輯模式即時提示 - 配套價格（＝成交總價 − 配套房屋總價，與合約製作／付款表同口徑）
const editingPackagePriceHint = computed(() => {
  const total = Number(editingData.value?.price_transaction_total) || 0;
  const packageDeal = Number(editingData.value?.price_package_deal) || 0;
  if (!packageDeal) return '避開高價住宅門檻時填寫，未填則不啟用配套拆分';
  return `配套價格: ${formatNumber(total - packageDeal, 2)} 萬（成交總價 ${formatNumber(total, 2)} − 配套房屋總價）`;
});

// ✅ [新增] 編輯模式即時計算 - 表價單價
const editingListUnitPrice = computed(() => {
  if (!editingData.value) return '0.00';
  const price = Number(editingData.value.price_list_house_total) || 0;
  const area = Number(editingData.value.area_house_ping) || 0;
  return area > 0 ? (price / area).toFixed(2) : '0.00';
});

// ✅ 編輯模式即時計算 - 房屋(不含露臺)表價單價
const editingListHouseOnlyUnitPrice = computed(() => {
  if (!editingData.value) return '0.00';
  const price = Number(editingData.value.price_list_house_only) || 0;
  const area = Number(editingData.value.area_house_ping) || 0;
  return area > 0 ? (price / area).toFixed(2) : '0.00';
});

// ✅ 編輯模式即時計算 - 露臺表價單價
const editingListTerraceUnitPrice = computed(() => {
  if (!editingData.value) return '0.00';
  const price = Number(editingData.value.price_list_terrace) || 0;
  const area = Number(editingData.value.area_terrace_ping) || 0;
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
  planOptions: { type: Array, default: () => [] }, // ✅ [新增] 建案方案清單（可選方案編輯用）
  // ✅ [快速選單] 開啟時的初始分頁（info / aiAssistant）與是否直接進入「修改銷控」（僅銷控模式生效）
  initialTab: { type: String, default: 'info' },
  initialEditing: { type: Boolean, default: false },
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
  // ✅ [上傳文件] 由快速選單進入時自動彈出上傳對話框（SPEC_UnitDocumentUpload.md）
  autoOpenDocumentsUpload: { type: Boolean, default: false },
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
const contractDocDialog = ref(false);

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
// ✅ 單價區塊收合狀態：預設展開，截圖給客戶時可手動收起「內部單價」避免混淆
const showInternalUnitPrice = ref(true);
const showRegisteredUnitPrice = ref(true);

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
// ✅ 合計底價拆分：有露臺時將房屋底價拆為「房屋(不含露臺)＋露臺」，凸顯單價基準為房屋總面積
const houseOnlyFloorPrice = computed(() => Number(props.unitData?.price_floor_house_only) || 0);
const terraceFloorPrice = computed(() => Number(props.unitData?.price_floor_terrace) || 0);
const showFloorTerraceSplit = computed(() =>
  Number(props.unitData?.area_terrace_ping) > 0
  && (houseOnlyFloorPrice.value > 0 || terraceFloorPrice.value > 0)
);
const pricePremium = computed(() => {
  if (grandTotalTransactionPrice.value > 0 && totalFloorPrice.value > 0) {
    return grandTotalTransactionPrice.value - totalFloorPrice.value;
  }
  return 0;
});

// ── 單價分析（萬/坪）：除以房屋總面積，四捨五入至小數 2 位 ──
// 內部單價：車位以「底價」扣除，有露臺時再扣露臺底價（成交/底價兩側同基準，溢差價才不失真）
// 實登單價（客戶端）：車位以「成交價」扣除，不扣露臺
const houseAreaPing = computed(() => Number(props.unitData?.area_house_ping) || 0);
const roundTo2 = (n) => Math.round(n * 100) / 100;
const dealUnitPrice = computed(() => {
  if (!houseAreaPing.value || grandTotalTransactionPrice.value <= 0) return null;
  return roundTo2((grandTotalTransactionPrice.value - parkingTotalFloorPrice.value - terraceFloorPrice.value) / houseAreaPing.value);
});
const floorUnitPrice = computed(() => {
  if (!houseAreaPing.value || totalFloorPrice.value <= 0) return null;
  return roundTo2((totalFloorPrice.value - parkingTotalFloorPrice.value - terraceFloorPrice.value) / houseAreaPing.value);
});
const registeredUnitPrice = computed(() => {
  if (!houseAreaPing.value || grandTotalTransactionPrice.value <= 0) return null;
  return roundTo2((grandTotalTransactionPrice.value - parkingTotalTransactionPrice.value) / houseAreaPing.value);
});
const premiumUnitPrice = computed(() => {
  if (dealUnitPrice.value === null || floorUnitPrice.value === null) return null;
  return roundTo2(pricePremium.value / houseAreaPing.value);
});
const premiumUnitPriceText = computed(() => {
  if (premiumUnitPrice.value === null) return '—';
  const text = formatNumber(Math.abs(premiumUnitPrice.value), 2);
  if (premiumUnitPrice.value > 0) return `+${text}`;
  if (premiumUnitPrice.value < 0) return `-${text}`;
  return text;
});

const statusOptions = computed(() => (props.allData['參數'] || []).map(p => p.statusName));

// ✅ [新增] 文字標籤：檢視模式顯示 + 編輯時的常用標籤建議（由全建案戶別推導）
const viewUnitTags = computed(() => getUnitTags(props.unitData));

// ── 檢視模式「銷售資訊 / 買方資訊」改版：狀態色、進度、買方摘要 ──
const statusColorStore = useStatusColorStore();

/** 銷控狀態色沿用建案設定（與銷控表格一致）；store 顏色可能含 alpha（#RRGGBBAA），取前 7 碼 */
const salesStatusHeroStyle = computed(() => {
  const status = props.unitData?.salesStatus_backend || '';
  const map = statusColorStore.colors?.backend || {};
  let hex = (status && map[status]) || map.default || '#F5F5F5';
  if (typeof hex === 'string' && hex.length === 9) hex = hex.slice(0, 7);
  const isDefault = !status || !map[status];
  return {
    '--status-color': isDefault ? '#ECEFF1' : hex,
    '--status-text': isDefault ? '#607D8B' : getContrastTextColor(hex),
  };
});

/** 銷售進度：小訂 → 補足 → 簽約；done = 已填日期，current = 下一個待辦 */
const salesTimelineSteps = computed(() => {
  const d = props.unitData || {};
  const defs = [
    { key: 'deposit', label: '小訂', raw: d.payment_deposit_date },
    { key: 'complete', label: '補足', raw: d.payment_complete_date },
    { key: 'contract', label: '簽約', raw: d.payment_contract_date },
  ];
  const steps = defs.map(s => ({ key: s.key, label: s.label, done: !!s.raw, date: s.raw ? formatDate(s.raw) : '未填', current: false }));
  const firstPending = steps.findIndex(s => !s.done);
  if (firstPending >= 0) steps[firstPending].current = true;
  return steps;
});

const viewSalespersons = computed(() => normalizeSalespersons(props.unitData?.salesperson));
const viewCoBuyers = computed(() => (Array.isArray(props.unitData?.coBuyers) ? props.unitData.coBuyers.filter(Boolean) : []));
const buyerMailingAddress = computed(() => formatAddress(props.unitData, 'Mailing'));
const buyerPermanentAddress = computed(() => formatAddress(props.unitData, 'Permanent'));
const isPermanentSameAsMailing = computed(() =>
  buyerMailingAddress.value !== '-' && buyerMailingAddress.value === buyerPermanentAddress.value);
const hasBuyerInfo = computed(() => {
  const d = props.unitData || {};
  return !!(d.buyerName || d.buyerPhone || d.buyerEmail || d.buyerIdNumber || d.buyerDateOfBirth
    || buyerMailingAddress.value !== '-' || buyerPermanentAddress.value !== '-');
});
/** 頭像字：中文取姓（第一字）、英文取首字母 */
const buyerInitial = computed(() => {
  const name = String(props.unitData?.buyerName || '').trim();
  if (!name) return '?';
  return /^[A-Za-z]/.test(name) ? name[0].toUpperCase() : name[0];
});
function coBuyerAddress(cb) {
  if (!cb) return '';
  return `${cb.mailingAddressCity || ''}${cb.mailingAddressDistrict || ''}${cb.mailingAddressDetail || ''}`;
}
const tagSuggestions = computed(() => collectTagSuggestions(props.allData['戶別'] || []));

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

function openContractDoc() {
  contractDocDialog.value = true;
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
  activeEditSection.value = 'sales'; // 🖥️ 左側項目導覽回到第一項
  activeMobileEditSection.value = 'all'; // 📱 手機版分區切換回到「全部」
  editingData.value = JSON.parse(JSON.stringify(props.unitData || {}));
  if (!editingData.value) {
    editingData.value = {};
  }
  // 土地標的清冊：舊資料無此欄位時預設為空陣列，確保 v-model 綁定可運作
  if (!Array.isArray(editingData.value.landParcels)) {
    editingData.value.landParcels = [];
  }
  // ✅ [新增] 文字標籤：舊資料無此欄位時預設為空陣列
  if (!Array.isArray(editingData.value.unitTags)) {
    editingData.value.unitTags = [];
  }
  // ✅ [新增] 備註圖片陣列初始化 + 重置 pending 狀態
  if (!Array.isArray(editingData.value.priceRemarkImages)) {
    editingData.value.priceRemarkImages = [];
  }
  clearPriceRemarkLocalState();

  // ✅ [戶別繳款紀錄] 以檢視模式本地列表為準（可能含剛快速新增、父層尚未重新載入的紀錄）+ 快照原始欄位
  editingData.value.paymentRecords = JSON.parse(JSON.stringify(viewPaymentRecords.value || []));
  paymentRecordsSnapshot = new Map(
    editingData.value.paymentRecords
      .filter(r => r && r.id)
      .map(r => [r.id, { date: r.date, amount: r.amount, note: r.note }])
  );

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
  // ✅ [上傳文件] 同樣以檢視模式本地列表為準，避免整包儲存時把剛上傳的文件覆蓋掉
  editingData.value.unitDocuments = JSON.parse(JSON.stringify(viewUnitDocuments.value || []));
  // ✅ [戶別繳款紀錄] 取消編輯時釋放本地預覽 URL，不動 Drive
  clearPaymentRecordsPendingState();
  editingData.value = null;
  // ✅ [新增] 取消編輯時釋放預覽 URL、丟棄 pending 變動，不影響 Storage
  clearPriceRemarkLocalState();
}

// 🔒 [編輯畫面鎖定] 修改銷控時擋下「滑動返回上一頁」與「重新整理/關閉分頁」，避免誤觸整個退出編輯
// 手機瀏覽器的邊緣滑動返回等同 history back：先塞一筆守衛紀錄，被返回吃掉時立刻補回並提示
let isEditGuardActive = false;

function handleEditPopstate() {
  if (!isEditing.value) return;
  history.pushState({ unitEditGuard: true }, '');
  toast.warning('編輯銷控中，畫面已鎖定；請先儲存或取消編輯', { position: POSITION.TOP_CENTER, timeout: 2500 });
}

function handleEditBeforeUnload(e) {
  e.preventDefault();
  e.returnValue = ''; // 觸發瀏覽器原生「確定要離開嗎」提示
}

function teardownEditScreenLock() {
  if (!isEditGuardActive) return;
  isEditGuardActive = false;
  window.removeEventListener('popstate', handleEditPopstate);
  window.removeEventListener('beforeunload', handleEditBeforeUnload);
  // 消化守衛用的多餘 history 紀錄，讓之後的「上一頁」行為恢復正常
  if (history.state && history.state.unitEditGuard) {
    history.back();
  }
}

watch(isEditing, (editing) => {
  if (editing) {
    if (isEditGuardActive) return;
    isEditGuardActive = true;
    history.pushState({ unitEditGuard: true }, '');
    window.addEventListener('popstate', handleEditPopstate);
    window.addEventListener('beforeunload', handleEditBeforeUnload);
  } else {
    teardownEditScreenLock();
  }
});

// ✅ [戶別繳款紀錄] 進入編輯時的原始欄位快照（id → {date, amount, note}），供判斷是否需同步 Drive 檔名
let paymentRecordsSnapshot = new Map();

// ✅ [戶別繳款紀錄] 檢視模式本地列表：快速新增後即時反映，不必等父層重新載入
const viewPaymentRecords = ref([]);
watch(() => props.unitData, (val) => {
  viewPaymentRecords.value = Array.isArray(val?.paymentRecords)
    ? JSON.parse(JSON.stringify(val.paymentRecords))
    : [];
}, { immediate: true });

// ✅ [備註留言] 檢視模式本地列表：直寫 Firestore 後即時反映（不必進修改銷控）
const viewRemarkNotes = ref([]);
const viewLegacyRemarks = ref('');
watch(() => props.unitData, (val) => {
  viewRemarkNotes.value = Array.isArray(val?.remarkNotes) ? val.remarkNotes.slice() : [];
  viewLegacyRemarks.value = typeof val?.remarks === 'string' ? val.remarks : '';
}, { immediate: true });

const remarkNotesStoragePrefix = computed(() =>
  `unitDetails/${props.projectId}/${props.unitData?.unitId || 'unknown'}/remarkNotes`
);

/** [備註留言] 持久化：直寫 salesHouseholds，並回填 remarks 字串維持向下相容 */
async function persistRemarkNotes(newNotes) {
  const docId = `${props.projectId}_${props.unitData.unitId}`;
  const summary = buildRemarksSummary(newNotes);
  await updateDoc(doc(db, 'salesHouseholds', docId), {
    remarkNotes: newNotes,
    remarks: summary,
    updatedAt: serverTimestamp(),
  });
  viewRemarkNotes.value = newNotes.slice();
  viewLegacyRemarks.value = summary;
  // 同步父層傳入的物件快照，避免重開 Modal 或列表殘留舊值（store 即時監聽亦會更新）
  if (props.unitData) {
    props.unitData.remarkNotes = newNotes;
    props.unitData.remarks = summary;
  }
}

/**
 * [戶別繳款紀錄] 快速新增（檢視模式，不經修改銷控）：
 * 有圖檔則後端一併上傳並命名，寫入成功後即時更新本地列表。
 */
async function handleQuickAddPaymentRecord({ date, amount, note, file }) {
  let base64 = null;
  if (file) {
    base64 = await paymentProofFileToBase64(file);
  }
  const res = await paymentProofApi({
    action: 'addRecord',
    projectId: props.projectId,
    unitId: props.unitData.unitId,
    base64,
    date,
    amount,
    note
// ✅ [上傳文件] 檢視模式本地列表：上傳／改名／刪除後即時反映，不必等父層重新載入（SPEC_UnitDocumentUpload.md）
const viewUnitDocuments = ref([]);
watch(() => props.unitData, (val) => {
  viewUnitDocuments.value = Array.isArray(val?.unitDocuments)
    ? JSON.parse(JSON.stringify(val.unitDocuments))
    : [];
}, { immediate: true });
const unitDocumentsPanelRef = ref(null);
// 快速選單進入時只自動開一次（避免父層 prop 保持 true 導致重開）
const autoOpenDocumentsUploadOnce = ref(false);

function openDocumentsUpload() {
  if (isEditing.value) return;
  const panel = unitDocumentsPanelRef.value;
  if (panel && typeof panel.openUpload === 'function') {
    panel.openUpload();
  } else {
    // 面板尚未掛載（例如剛開啟 Modal）→ 以 prop 觸發，掛載後自動開啟
    autoOpenDocumentsUploadOnce.value = true;
    nextTick(() => { autoOpenDocumentsUploadOnce.value = false; });
  }
}

function currentUploaderInfo() {
  const u = userStore.user || {};
  return { userKey: u.key || '', name: u.name || '' };
}

/** [上傳文件] Storage 暫存檔轉存至戶別 Drive 資料夾並寫入紀錄（由面板在 Storage 上傳完成後呼叫） */
async function handleUploadUnitDocument(payload) {
  const res = await unitDocumentApi({
    action: 'commit',
    projectId: props.projectId,
    unitId: props.unitData.unitId,
    ...payload,
    uploadedBy: currentUploaderInfo(),
  });
  if (res.status !== 'success' || !res.record) {
    throw new Error(res.message || '轉存至 Google Drive 失敗，請稍後再試');
  }
  viewUnitDocuments.value = [...viewUnitDocuments.value, res.record];
  if (props.unitData) props.unitData.unitDocuments = viewUnitDocuments.value.slice();
  emit('data-updated');
  return res.record;
}

/** [上傳文件] 改種類／名稱，後端同步 Drive 檔名 */
async function handleRenameUnitDocument({ docId, fileName, docType, docTypeLabel }) {
  const res = await unitDocumentApi({
    action: 'rename',
    projectId: props.projectId,
    unitId: props.unitData.unitId,
    docId, fileName, docType, docTypeLabel,
  });
  if (res.status !== 'success' || !res.record) {
    toast.error(res.message || '更新文件失敗，請稍後再試');
    throw new Error(res.message || '更新文件失敗');
  }
  viewUnitDocuments.value = viewUnitDocuments.value.map(d => (d.id === docId ? res.record : d));
  if (props.unitData) props.unitData.unitDocuments = viewUnitDocuments.value.slice();
  if (res.renameWarning) toast.warning('Drive 檔名同步失敗，文件紀錄仍已更新');
  else toast.success('文件已更新');
  emit('data-updated');
  return res.record;
}

/** [上傳文件] 刪除紀錄；勾選時將 Drive 檔案移至垃圾桶，否則保留 */
async function handleDeleteUnitDocument({ docId, trashDriveFile }) {
  const res = await unitDocumentApi({
    action: 'delete',
    projectId: props.projectId,
    unitId: props.unitData.unitId,
    docId,
    trashDriveFile: !!trashDriveFile,
  });
  if (res.status !== 'success') {
    toast.error(res.message || '刪除文件失敗，請稍後再試');
    throw new Error(res.message || '刪除文件失敗');
  }
  viewUnitDocuments.value = viewUnitDocuments.value.filter(d => d.id !== docId);
  if (props.unitData) props.unitData.unitDocuments = viewUnitDocuments.value.slice();
  if (res.trashWarning) toast.warning('紀錄已刪除，但 Drive 檔案移至垃圾桶失敗');
  else toast.success(trashDriveFile ? '文件已刪除並移至 Drive 垃圾桶' : '文件紀錄已刪除（Drive 檔案保留）');
  emit('data-updated');
}

  });
  if (res.status !== 'success' || !res.record) {
    throw new Error(res.message || '請稍後再試');
  }
  viewPaymentRecords.value = [...viewPaymentRecords.value, res.record];
  toast.success('繳款紀錄已新增');
  emit('data-updated');
}

/**
 * [戶別繳款紀錄] 快速編輯（檢視模式，不經修改銷控）：
 * 可換圖（舊圖保留於 Drive）或移除憑證；無換圖時內容異動由後端自動同步 Drive 檔名。
 */
async function handleQuickUpdatePaymentRecord({ recordId, date, amount, note, file, removeFile }) {
  let base64 = null;
  if (file) {
    base64 = await paymentProofFileToBase64(file);
  }
  const res = await paymentProofApi({
    action: 'updateRecord',
    projectId: props.projectId,
    unitId: props.unitData.unitId,
    recordId,
    base64,
    removeFile: !!removeFile,
    date,
    amount,
    note
  });
  if (res.status !== 'success' || !res.record) {
    throw new Error(res.message || '請稍後再試');
  }
  viewPaymentRecords.value = viewPaymentRecords.value.map(r => (r.id === recordId ? res.record : r));
  if (res.renameWarning) {
    toast.warning('憑證 Drive 檔名同步失敗，紀錄內容仍已更新');
  }
  toast.success('繳款紀錄已更新');
  emit('data-updated');
}

/** [戶別繳款紀錄] 快速刪除（檢視模式）：Drive 憑證圖檔依規格保留不刪。 */
async function handleQuickDeletePaymentRecord({ recordId }) {
  const res = await paymentProofApi({
    action: 'deleteRecord',
    projectId: props.projectId,
    unitId: props.unitData.unitId,
    recordId
  });
  if (res.status !== 'success') {
    throw new Error(res.message || '請稍後再試');
  }
  viewPaymentRecords.value = viewPaymentRecords.value.filter(r => r.id !== recordId);
  toast.success('繳款紀錄已刪除（Drive 憑證圖檔保留）');
  emit('data-updated');
}

function clearPaymentRecordsPendingState() {
  const list = editingData.value?.paymentRecords;
  if (!Array.isArray(list)) return;
  list.forEach(r => {
    if (r && r._pendingPreviewUrl) {
      try { URL.revokeObjectURL(r._pendingPreviewUrl); } catch (e) { /* noop */ }
    }
  });
}

function paymentProofFileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result).split(',')[1]);
    reader.onerror = () => reject(new Error('讀取圖檔失敗'));
    reader.readAsDataURL(file);
  });
}

/**
 * [戶別繳款紀錄] 儲存前處理：驗證 → 既有圖檔改名同步（失敗僅警告）→ 上傳待上傳憑證（失敗中止）→ 清理內部欄位。
 * 已上傳成功的憑證資訊會即時寫回紀錄，儲存失敗重試時不會重複上傳。
 */
async function preparePaymentRecordsForSave() {
  const list = editingData.value?.paymentRecords;
  if (!Array.isArray(list) || list.length === 0) return;

  // 1. 驗證：日期必填、金額為正整數（元）
  for (let i = 0; i < list.length; i++) {
    const r = list[i];
    if (!/^\d{4}-\d{2}-\d{2}$/.test(String(r.date || ''))) {
      throw new Error(`繳款 #${i + 1} 未選擇繳款日期。`);
    }
    const amountNum = Number(r.amount);
    if (!Number.isInteger(amountNum) || amountNum <= 0) {
      throw new Error(`繳款 #${i + 1} 金額必須為大於 0 的整數（元）。`);
    }
  }

  const unitId = props.unitData.unitId;

  // 2. 既有圖檔且日期/金額/備註有異動 → 同步 Drive 檔名（失敗僅警告，不中斷儲存）
  for (const r of list) {
    if (!r.file || !r.file.fileId || r._pendingFile) continue;
    const snap = paymentRecordsSnapshot.get(r.id);
    if (!snap) continue;
    const changed = snap.date !== r.date
      || Number(snap.amount) !== Number(r.amount)
      || (snap.note || '') !== (r.note || '');
    if (!changed) continue;
    const res = await paymentProofApi({
      action: 'rename',
      projectId: props.projectId,
      unitId,
      fileId: r.file.fileId,
      date: r.date,
      amount: Number(r.amount),
      note: r.note || ''
    });
    if (res.status === 'success' && res.file) {
      r.file = { ...r.file, fileName: res.file.fileName, webViewLink: res.file.webViewLink || r.file.webViewLink };
    } else {
      toast.warning(`繳款憑證「${r.file.fileName}」檔名同步失敗，資料仍會照常儲存。`);
    }
  }

  // 3. 上傳待上傳憑證
  for (let i = 0; i < list.length; i++) {
    const r = list[i];
    if (!r._pendingFile) continue;
    savingText.value = `正在上傳繳款憑證 (繳款 #${i + 1})...`;
    const base64 = await paymentProofFileToBase64(r._pendingFile);
    const res = await paymentProofApi({
      action: 'upload',
      projectId: props.projectId,
      unitId,
      base64,
      date: r.date,
      amount: Number(r.amount),
      note: r.note || ''
    });
    if (res.status !== 'success' || !res.file) {
      throw new Error(`繳款 #${i + 1} 憑證上傳失敗：${res.message || '請稍後再試'}`);
    }
    r.file = res.file;
    if (r._pendingPreviewUrl) {
      try { URL.revokeObjectURL(r._pendingPreviewUrl); } catch (e) { /* noop */ }
    }
    delete r._pendingFile;
    delete r._pendingPreviewUrl;
  }

  // 4. 防禦性清理：確保 File 物件與本地預覽 URL 不會進入 Firestore payload
  editingData.value.paymentRecords = list.map(({ _pendingFile, _pendingPreviewUrl, ...rest }) => rest);
}

// 5. [修改] saveChanges：儲存成功後才執行車位寫入
async function saveChanges() {
  if (!editingData.value) return;

  // 房土比驗證：兩比例加總必須=100（允許 0/0 代表未設定）
  const h = Number(editingData.value.housePriceRatio) || 0;
  const l = Number(editingData.value.landPriceRatio) || 0;
  const sum = Math.round((h + l) * 100) / 100;
  if (sum !== 0 && Math.abs(sum - 100) > 0.001) {
    activeEditSection.value = 'ratio'; // 🖥️ 直接把使用者帶到出問題的區塊
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

    // ✅ [戶別繳款紀錄] 驗證 → Drive 檔名同步 → 上傳待上傳憑證（失敗會 throw 中止儲存）
    await preparePaymentRecordsForSave();
    savingText.value = '儲存中，請稍候...';

    const data = editingData.value;

    // ✅ 露臺表價異動時同步重算「露臺單價(表價)」，避免銷控表欄位殘留舊值
    const terracePing = Number(data.area_terrace_ping) || 0;
    if (terracePing > 0) {
      const terraceListPrice = Number(data.price_list_terrace) || 0;
      data.price_list_terrace_unit = Number((terraceListPrice / terracePing).toFixed(2));
    }

    // ✅ [備註留言] 備註改由檢視模式即時 CRUD 維護，編輯表單不再送出，
    // 避免以進入編輯時的舊快照覆蓋期間新增的留言（merge: true 會保留既有值）
    delete data.remarks;
    delete data.remarkNotes;

    const payload = {
      projectName: props.projectName,
      projectId: props.projectId,
      unitId: props.unitData.unitId,
      data: data
    };

    const result = await updateSalesData(payload);
    if (result.status !== 'success') throw new Error(result.message);

    // ✅ [戶別繳款紀錄] 儲存成功後同步檢視模式本地列表
    viewPaymentRecords.value = JSON.parse(JSON.stringify(data.paymentRecords || []));

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
    if (props.projectId) statusColorStore.fetchColors(props.projectId);
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
const downloadExcel = async () => {
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

  const XLSX = await loadXLSX();
  const ws = XLSX.utils.json_to_sheet(data, { header: headers });
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "HouseholdData");

  const fileName = `${props.projectName || '建案'}_${sourceData.unitId}_${sourceData.buyerName || 'Export'}_銷售資料.xlsx`;
  XLSX.writeFile(wb, fileName);
};

// 🔐 [隱藏功能] 事件監聽器設定
onMounted(() => {
  document.addEventListener('keydown', handleKeyPress);
  // ✅ [快速選單] 依父層指定的初始狀態開啟：切到指定分頁或直接進入修改銷控
  // （Modal 以 v-if 掛載，props.show 的 watcher 在首次掛載時不會觸發，故在此處理）
  if (props.viewMode === 'sales') {
    if (props.initialTab && props.initialTab !== 'info') tab.value = props.initialTab;
    if (props.initialEditing) nextTick(() => startEditing());
  }
});

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeyPress);
  teardownEditScreenLock(); // 🔒 元件卸載時解除編輯畫面鎖定，避免監聽器殘留
});
</script>

<style scoped>
/* 🔐 手機版隱藏解鎖點按目標：不顯示任何可點擊暗示，並防止連點選取文字 */
.tap-unlock-target {
  user-select: none;
  -webkit-user-select: none;
  -webkit-tap-highlight-color: transparent;
  cursor: default;
}

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
  /* 🔒 阻止捲動串連到瀏覽器（下拉重新整理、左右滑動導覽），避免誤觸退出編輯 */
  overscroll-behavior: contain;
}

.footer-section {
  flex-shrink: 0;
}

/* ── 🖥️ [電腦版] 修改銷控：左邊項目 / 右邊內容 ── */
/* v-window 預設 overflow:hidden 會讓左側導覽的 sticky 失效；編輯中不會切換分頁，可安全放行 */
.edit-window-visible,
.edit-window-visible :deep(.v-window__container),
.edit-window-visible :deep(.v-window-item) {
  overflow: visible;
}

.edit-shell--desktop {
  display: flex;
  align-items: flex-start;
  gap: 16px;
}

.edit-nav {
  flex: 0 0 224px;
  width: 224px;
  position: sticky;
  top: 0;
  align-self: flex-start;
  max-height: calc(100vh - 230px);
  overflow-y: auto;
  padding: 2px 8px 2px 0;
  border-right: 1px solid #e0e0e0;
  background-color: #fff;
  z-index: 1;
}

.edit-nav-item {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  text-align: left;
  padding: 10px 12px;
  margin-bottom: 4px;
  border: 1px solid transparent;
  border-radius: 8px;
  background-color: transparent;
  cursor: pointer;
  transition: background-color 0.15s ease, border-color 0.15s ease;
}

.edit-nav-item:hover {
  background-color: #f1f5f9;
}

.edit-nav-item--active {
  background-color: #e8f1ff;
  border-color: #bbd6f7;
}

.edit-nav-text {
  display: flex;
  flex-direction: column;
    // ✅ [上傳文件] 快速選單「上傳文件」進入：面板掛載後自動彈出上傳對話框
    if (props.autoOpenDocumentsUpload && !props.initialEditing) nextTick(() => openDocumentsUpload());
  min-width: 0;
}

.edit-nav-title {
  font-size: 0.95rem;
  font-weight: 600;
  color: #37474f;
  line-height: 1.3;
}

.edit-nav-item--active .edit-nav-title {
  color: #1a3a6e;
}

.edit-nav-summary {
  font-size: 0.75rem;
  color: #90a4ae;
  line-height: 1.4;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.edit-nav-alert {
  margin-left: auto;
  flex-shrink: 0;
}

.edit-panes {
  flex: 1 1 auto;
  min-width: 0;
}

/* 📱 [新增] 手機版「修改銷控」分區快速切換列：黏在編輯區頂端、水平捲動 */
.edit-mobile-nav {
  position: sticky;
  top: 0;
  z-index: 5;
  display: flex;
  gap: 6px;
  overflow-x: auto;
  padding: 8px 2px;
  margin: -8px -2px 8px;
  background: #ffffff;
  border-bottom: 1px solid #eceff1;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none;
}
.edit-mobile-nav::-webkit-scrollbar {
  display: none;
}
.edit-mobile-chip {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  flex-shrink: 0;
  padding: 6px 12px;
  border: 1px solid #cfd8e3;
  border-radius: 999px;
  background: #ffffff;
  color: #44546a;
  font-size: .82rem;
  font-weight: 600;
  line-height: 1.2;
  cursor: pointer;
  font-family: inherit;
}
.edit-mobile-chip--active {
  background: #1a3a6e;
  border-color: #1a3a6e;
  color: #ffffff;
}
.edit-mobile-chip--active .v-icon {
  color: #ffffff;
}

/* 📱 [新增] 底部功能面板（比照銷控系統樣式）：外殼樣式在 MobileBottomSheet.vue，此處僅 slot 內容 */
.mobile-sheet-section {
  margin-bottom: 14px;
}
.mobile-sheet-label {
  font-size: .78rem;
  font-weight: 600;
  color: #8493a8;
  margin-bottom: 6px;
}
.mobile-tool-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
}
.mobile-tool {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
  background: #f7f9fc;
  border: 1px solid #e6ebf2;
  border-radius: 12px;
  padding: 12px 4px;
  min-height: 74px;
  cursor: pointer;
  color: #44546a;
  font: inherit;
}
.mobile-tool:active {
  background: #e8eef7;
  border-color: #c9d7ec;
}
.mobile-tool-icon {
  color: #1a3a6e;
}
.mobile-tool-label {
  font-size: .72rem;
  line-height: 1.25;
  text-align: center;
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

/* ── 檢視模式：銷售資訊 / 買方資訊 改版 ── */
.section-title--flex {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.section-title-tag {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  font-size: 0.72rem;
  font-weight: 600;
  line-height: 1.6;
  padding: 1px 8px;
  border-radius: 10px;
  background-color: #e8eef8;
  color: #1a3a6e;
  white-space: nowrap;
}

.section-title-tag.indigo {
  background-color: #e8eaf6;
  color: #3949ab;
}

/* 銷控狀態：底色沿用建案狀態色（CSS 變數由 salesStatusHeroStyle 提供） */
.sales-status-hero {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 10px 14px;
  border-radius: 8px;
  background-color: var(--status-color, #eceff1);
  color: var(--status-text, #37474f);
  border: 1px solid rgba(0, 0, 0, 0.08);
  margin-bottom: 10px;
}

.sales-status-hero-label {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 0.82rem;
  font-weight: 600;
  opacity: 0.8;
  white-space: nowrap;
}

.sales-status-hero-value {
  font-size: 1.35rem;
  font-weight: 800;
  letter-spacing: 1px;
  line-height: 1.2;
}

/* 銷售進度：小訂 → 補足 → 簽約 */
.sales-timeline {
  display: flex;
  padding: 10px 4px 6px;
  margin-bottom: 8px;
  background-color: #f5f7fa;
  border: 1px solid #e0e4ea;
  border-radius: 8px;
}

.sales-timeline-step {
  flex: 1 1 0;
  min-width: 0;
  text-align: center;
}

.sales-timeline-node {
  position: relative;
  display: flex;
  justify-content: center;
  margin-bottom: 4px;
}

.sales-timeline-dot {
  position: relative;
  z-index: 1;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background-color: #fff;
  border: 2px solid #cfd8dc;
  color: #90a4ae;
  font-size: 0.72rem;
  font-weight: 700;
}

.sales-timeline-line {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 100%;
  height: 2px;
  background-color: #cfd8dc;
  transform: translateY(-50%);
}

.sales-timeline-step.done .sales-timeline-dot {
  background-color: #2e7d32;
  border-color: #2e7d32;
}

.sales-timeline-step.done .sales-timeline-line {
  background-color: #2e7d32;
}

.sales-timeline-step.current .sales-timeline-dot {
  border-color: #1a3a6e;
  color: #1a3a6e;
  box-shadow: 0 0 0 3px rgba(26, 58, 110, 0.15);
}

.sales-timeline-name {
  font-size: 0.8rem;
  font-weight: 600;
  color: #90a4ae;
}

.sales-timeline-step.done .sales-timeline-name,
.sales-timeline-step.current .sales-timeline-name {
  color: #37474f;
}

.sales-timeline-date {
  font-size: 0.78rem;
  color: #b0bec5;
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}

.sales-timeline-step.done .sales-timeline-date {
  color: #2e7d32;
  font-weight: 600;
}

/* 標籤左、數值右的資訊列表 */
.info-dl {
  display: flex;
  flex-direction: column;
}

.info-dl-row {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 8px 4px;
  border-bottom: 1px dashed #e6e9ee;
}

.info-dl-row:last-child {
  border-bottom: none;
}

.info-dl-label {
  flex: 0 0 96px;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 0.82rem;
  color: #78909c;
  white-space: nowrap;
  padding-top: 1px;
}

.info-dl-label .v-icon {
  color: #b0bec5;
}

.info-dl-value {
  flex: 1 1 auto;
  min-width: 0;
  font-size: 0.95rem;
  font-weight: 600;
  color: #263238;
  line-height: 1.45;
  overflow-wrap: anywhere;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 4px 8px;
}

.info-dl-value.addr {
  font-weight: 500;
  font-size: 0.9rem;
}

.info-dl-value .mono,
.info-dl-value.mono {
  font-family: 'SFMono-Regular', Consolas, 'Roboto Mono', monospace;
  letter-spacing: 0.5px;
  font-variant-numeric: tabular-nums;
}

.info-dl-sub {
  font-size: 0.75rem;
  font-weight: 400;
  color: #90a4ae;
}

.info-dl-empty {
  color: #b0bec5 !important;
  font-weight: 400 !important;
}

.info-person-chip {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  padding: 2px 10px 2px 6px;
  border-radius: 12px;
  background-color: #e8eef8;
  color: #1a3a6e;
  font-size: 0.85rem;
  font-weight: 600;
}

.info-person-chip .v-icon {
  color: #5c7cae;
}

.info-bool {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  padding: 1px 8px 1px 5px;
  border-radius: 10px;
  font-size: 0.82rem;
  font-weight: 600;
}

.info-bool.yes {
  background-color: #e8f5e9;
  color: #2e7d32;
}

.info-bool.no {
  background-color: #f1f3f4;
  color: #78909c;
}

/* 買方：主買方名片 */
.buyer-hero {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 14px;
  margin-bottom: 8px;
  background: linear-gradient(135deg, #eef2fb 0%, #f7f9fd 100%);
  border: 1px solid #dfe6f2;
  border-radius: 10px;
}

.buyer-avatar {
  flex: 0 0 44px;
  width: 44px;
  height: 44px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #3949ab;
  color: #fff;
  font-size: 1.2rem;
  font-weight: 700;
}

.buyer-hero-main {
  flex: 1 1 auto;
  min-width: 0;
}

.buyer-name {
  font-size: 1.2rem;
  font-weight: 700;
  color: #1a237e;
  line-height: 1.3;
  overflow-wrap: anywhere;
}

.buyer-contact {
  display: flex;
  flex-wrap: wrap;
  gap: 4px 14px;
  margin-top: 4px;
}

.buyer-contact-link {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 0.88rem;
  font-weight: 500;
  color: #1565c0;
  text-decoration: none;
  overflow-wrap: anywhere;
}

.buyer-contact-link:hover {
  text-decoration: underline;
}

.buyer-contact-link.muted {
  color: #b0bec5;
  font-weight: 400;
}

.buyer-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  padding: 28px 12px;
  border: 1px dashed #cfd8dc;
  border-radius: 10px;
  background-color: #fafbfc;
  text-align: center;
}

.buyer-empty-title {
  font-size: 0.95rem;
  font-weight: 600;
  color: #78909c;
}

.buyer-empty-hint {
  font-size: 0.78rem;
  color: #b0bec5;
}

/* 共同買方卡片 */
.cobuyer-title {
  display: flex;
  align-items: center;
  margin: 12px 0 6px;
  padding-top: 10px;
  border-top: 1px solid #e0e0e0;
  font-size: 0.88rem;
  font-weight: 700;
  color: #3949ab;
}

.cobuyer-title-count {
  margin-left: 6px;
  font-size: 0.72rem;
  font-weight: 600;
  padding: 0 7px;
  border-radius: 10px;
  background-color: #e8eaf6;
  color: #3949ab;
}

.cobuyer-card {
  padding: 8px 10px;
  border: 1px solid #e3e6ef;
  border-left: 3px solid #7986cb;
  border-radius: 8px;
  background-color: #fafbfe;
}

.cobuyer-card+.cobuyer-card {
  margin-top: 6px;
}

.cobuyer-head {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
}

.cobuyer-index {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background-color: #3949ab;
  color: #fff;
  font-size: 0.72rem;
  font-weight: 700;
}

.cobuyer-name {
  font-size: 1rem;
  font-weight: 700;
  color: #263238;
}

.cobuyer-rows {
  display: flex;
  flex-direction: column;
  gap: 3px;
  padding-left: 2px;
}

.cobuyer-row {
  display: flex;
  align-items: flex-start;
  gap: 6px;
  font-size: 0.86rem;
  color: #455a64;
  line-height: 1.4;
  overflow-wrap: anywhere;
}

.cobuyer-row .v-icon {
  flex: 0 0 auto;
  margin-top: 2px;
  color: #90a4ae;
}

.cobuyer-row.link {
  color: #1565c0;
  text-decoration: none;
}

.cobuyer-row.link:hover {
  text-decoration: underline;
}

/* 手機：資訊列標籤縮窄、狀態列字級微調 */
@media (max-width: 599px) {
  .info-dl-label {
    flex-basis: 84px;
  }

  .sales-status-hero-value {
    font-size: 1.2rem;
  }

  .sales-timeline-date {
    font-size: 0.72rem;
  }
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

/* 成交總覽：面積基準（房屋總面積／露臺） */
.deal-area-strip {
  display: flex;
  flex-wrap: wrap;
  gap: 4px 16px;
  padding: 8px 12px;
  margin-bottom: 8px;
  background-color: #f5f7fa;
  border: 1px solid #e0e4ea;
  border-radius: 8px;
  font-size: 0.85rem;
  color: #37474f;
  font-variant-numeric: tabular-nums;
}

.deal-area-strip strong {
  font-size: 1.25rem;
  color: #1a3a6e;
}

.deal-area-label {
  color: #607d8b;
  margin-right: 2px;
}

.deal-area-sqm {
  color: #90a4ae;
  font-size: 0.78rem;
}

/* 成交總覽：成交總價 / 合計底價 主列＋小字組成明細 */
.total-block {
  padding: 10px 16px;
}

.total-block+.total-block,
.total-block:not(:first-child) {
  border-top: 1px solid #e0e0e0;
}

.total-block-main {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: 8px;
}

.total-block-label {
  font-size: 1rem;
  font-weight: 700;
  color: rgba(0, 0, 0, 0.87);
  white-space: nowrap;
}

.total-block-sub {
  margin-top: 2px;
  text-align: right;
  font-size: 0.78rem;
  color: #90a4ae;
  font-variant-numeric: tabular-nums;
}

/* 成交總覽：車位明細（整合原「持有車位」） */
.parking-deal-block {
  margin-top: 10px;
}

.parking-deal-summary {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
}

.parking-deal-title {
  font-size: 1rem;
  color: rgba(0, 0, 0, 0.87);
}

.parking-deal-count {
  font-size: 0.75rem;
  color: #78909c;
  background-color: #eceff1;
  border-radius: 10px;
  padding: 1px 8px;
  margin-left: 4px;
  vertical-align: middle;
}

.parking-deal-table {
  margin-top: 4px;
  border: 1px solid #eceff1;
  border-radius: 6px;
  overflow: hidden;
}

.parking-deal-row {
  display: flex;
  align-items: center;
  padding: 6px 10px;
  font-size: 0.9rem;
}

.parking-deal-row+.parking-deal-row {
  border-top: 1px solid #f5f5f5;
}

.parking-deal-row.head {
  background-color: #f5f7fa;
  font-size: 0.75rem;
  font-weight: 600;
  color: #78909c;
  padding-top: 4px;
  padding-bottom: 4px;
}

.parking-deal-row.foot {
  background-color: #fafafa;
  font-weight: 600;
  border-top: 1px solid #eceff1;
}

.parking-deal-row .pd-id {
  flex: 1 1 auto;
  min-width: 0;
}

.parking-deal-row .pd-id strong {
  color: #1a3a6e;
}

.parking-deal-row .pd-size {
  color: #90a4ae;
  font-size: 0.75rem;
  margin-left: 6px;
}

.parking-deal-row .pd-num {
  flex: 0 0 72px;
  text-align: right;
  font-variant-numeric: tabular-nums;
  color: #546e7a;
}

.parking-deal-row .pd-num.pd-deal {
  color: #2E7D32;
  font-weight: 600;
}

.parking-deal-row.head .pd-num {
  color: #78909c;
  font-weight: 600;
}

/* 手機：車位編號與尺寸改上下排列，數字欄縮窄 */
@media (max-width: 599px) {
  .parking-deal-row .pd-size {
    display: block;
    margin-left: 0;
    line-height: 1.2;
  }

  .parking-deal-row .pd-num {
    flex-basis: 64px;
  }
}

.base-price-item,
.premium-price-item {
  border-top: 1px solid #eee;
  margin-top: 4px;
  padding-top: 4px;
}

/* 成交總覽：單價分析（萬/坪） */
.unit-price-strip {
  margin-top: 10px;
  padding: 10px 12px;
  background-color: #f5f7fa;
  border: 1px solid #e0e4ea;
  border-radius: 8px;
}

.unit-price-strip-title {
  font-size: 0.8rem;
  font-weight: 600;
  color: #607d8b;
  margin-bottom: 8px;
  letter-spacing: 0.5px;
}

.unit-price-strip-basis {
  font-weight: 400;
  color: #90a4ae;
  letter-spacing: normal;
}

/* ✅ 單價群組：內部單價 / 實價登錄單價，各自可收合，避免截圖時混淆 */
.unit-price-group {
  margin-top: 8px;
}

.unit-price-group:first-of-type {
  margin-top: 0;
}

.unit-price-group-header {
  display: flex;
  align-items: center;
  gap: 4px;
  cursor: pointer;
  user-select: none;
  padding: 4px 0;
}

.unit-price-group-header:hover {
  opacity: 0.8;
}

.unit-price-group-name {
  font-size: 0.85rem;
  font-weight: 600;
  color: #37474f;
}

.unit-price-group-tag {
  font-size: 0.68rem;
  font-weight: 600;
  padding: 1px 6px;
  border-radius: 10px;
  line-height: 1.5;
}

.unit-price-group-tag.internal {
  background-color: #ffebee;
  color: #c62828;
}

.unit-price-group-tag.registered {
  background-color: #e3f2fd;
  color: #1565c0;
}

.unit-price-group-collapsed-hint {
  font-size: 0.72rem;
  color: #b0bec5;
  margin-left: auto;
}

.unit-price-formula {
  font-size: 0.72rem;
  color: #90a4ae;
  margin: 0 0 6px 22px;
}

.unit-price-formula strong {
  color: #607d8b;
}

.unit-price-tiles {
  display: flex;
  gap: 8px;
}

.unit-price-tile {
  flex: 1 1 0;
  min-width: 0;
  text-align: center;
  background-color: #fff;
  border: 1px solid #eceff1;
  border-radius: 6px;
  padding: 8px 4px;
}

.unit-price-tile-label {
  font-size: 0.75rem;
  color: #78909c;
  margin-bottom: 2px;
  white-space: nowrap;
}

.unit-price-tile-value {
  font-size: 1.15rem;
  font-weight: 700;
  color: #37474f;
  line-height: 1.3;
}

.unit-price-tile-value.deal {
  color: #2E7D32;
}

.unit-price-tile-value.floor {
  color: #c62828;
}

.unit-price-tile-value.registered {
  color: #1565c0;
}

/* 手機：三欄改直列，標籤在左、數值在右，避免窄螢幕擁擠 */
@media (max-width: 599px) {
  .unit-price-tiles {
    flex-direction: column;
    gap: 6px;
  }

  .unit-price-tile {
    display: flex;
    align-items: center;
    justify-content: space-between;
    text-align: right;
    padding: 8px 12px;
  }

  .unit-price-tile-label {
    margin-bottom: 0;
    font-size: 0.85rem;
  }

  .unit-price-tile-value {
    font-size: 1.05rem;
  }
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