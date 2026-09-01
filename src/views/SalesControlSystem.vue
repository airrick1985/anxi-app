<template>
  <div class="sales-control-page">
    
    <div class="toolbar d-none d-md-flex">
      <!-- 群組 1：建案選擇 + 標題 -->
      <div class="toolbar-group toolbar-group-title">
        <v-select
          :model-value="projectId"
          @update:model-value="switchProject"
          :items="availableProjects"
          item-title="name"
          item-value="id"
          label="選擇建案"
          variant="outlined"
          density="compact"
          hide-details
          class="project-selector"
        ></v-select>

        <span class="toolbar-title d-none d-sm-inline">{{ projectName }}-{{ pageTitle }}</span>
      </div>

      <span class="toolbar-divider" aria-hidden="true"></span>

      <!-- 群組 2：檢視模式 + 篩選 -->
      <div class="toolbar-group">
        <v-btn-toggle
          v-model="viewFormat"
          color="indigo"
          variant="outlined"
          density="compact"
          mandatory
        >
          <v-btn value="grid" prepend-icon="mdi-view-grid">網格</v-btn>
          <v-btn value="list" prepend-icon="mdi-view-list">列表</v-btn>
        </v-btn-toggle>

        <v-btn
          :color="showFilterPanel ? 'primary' : 'black'"
          :variant="showFilterPanel ? 'flat' : 'tonal'"
          prepend-icon="mdi-filter-variant"
          @click="showFilterPanel = !showFilterPanel"
        >
          篩選
          <v-badge
            v-if="activeFilterCount > 0"
            color="error"
            :content="activeFilterCount"
            inline
          ></v-badge>
        </v-btn>
      </div>

      <!-- 群組 3：操作按鈕（推到右側） -->
      <div class="toolbar-group toolbar-group-actions">
        <!-- ✅ [新增] 網格主要顯示內容切換：總價 / 單價 / 簽約日期 -->
        <v-btn-toggle
          v-if="currentViewMode === 'sales' && viewFormat === 'grid'"
          v-model="gridContentMode"
          color="primary"
          variant="outlined"
          density="compact"
          mandatory
        >
          <v-btn value="total" size="small">總價</v-btn>
          <v-btn value="unit" size="small">單價</v-btn>
          <v-btn value="date" size="small">簽約日</v-btn>
        </v-btn-toggle>

        <v-btn-toggle
          v-if="currentViewMode === 'sales' && viewFormat === 'grid' && gridContentMode !== 'date'"
          v-model="priceDisplayMode"
          color="info"
          variant="outlined"
          density="compact"
          mandatory
        >
          <v-btn value="list" size="small">表價</v-btn>
          <v-btn value="floor" size="small">底價</v-btn>
          <v-btn value="transaction" size="small">成交價</v-btn>
        </v-btn-toggle>

        <span
          class="toolbar-divider"
          aria-hidden="true"
          v-if="currentViewMode === 'sales' && viewFormat === 'grid'"
        ></span>

        <v-badge
          :content="itemCount"
          :model-value="itemCount > 0"
          color="error"
        >
          <v-btn
            icon="mdi-file-document-outline"
            @click="isQuoteSidebarOpen = true"
            title="查看報價單"
          ></v-btn>
        </v-badge>

        <!-- 實價登錄申報提醒徽章：sales 模式且有待申報戶別時顯示 -->
        <v-tooltip v-if="currentViewMode === 'sales' && pendingReportUnits.length > 0" location="bottom">
          <template #activator="{ props: ttp }">
            <v-badge
              v-bind="ttp"
              :content="pendingReportUnits.length"
              :color="overdueReportCount > 0 ? 'error' : 'warning'"
            >
              <v-btn
                :color="overdueReportCount > 0 ? 'error' : 'warning'"
                variant="tonal"
                icon="mdi-file-document-alert-outline"
                @click="showReportReminderDialog = true"
              />
            </v-badge>
          </template>
          <span>
            {{ pendingReportUnits.length }} 筆待申報實價登錄
            <template v-if="overdueReportCount > 0">
              （{{ overdueReportCount }} 筆已逾 30 天）
            </template>
          </span>
        </v-tooltip>

        <span class="toolbar-divider" aria-hidden="true"></span>

        <v-tooltip location="bottom">
          <template v-slot:activator="{ props }">
            <v-btn
              v-bind="props"
              color="black"
              variant="tonal"
              @click="handleRefreshData"
              :loading="isRefreshing"
              icon="mdi-refresh"
            ></v-btn>
          </template>
          <span>重新載入最新資料</span>
        </v-tooltip>

        <!-- 🖥️ [改版] 功能選單：整合原工具列大量圖示按鈕，分群磚格一覽（與手機版「全部功能」面板一致） -->
        <v-menu
          v-model="isDesktopToolsMenuOpen"
          :close-on-content-click="false"
          location="bottom end"
          :offset="8"
        >
          <template v-slot:activator="{ props }">
            <v-btn
              v-bind="props"
              color="indigo-darken-3"
              variant="flat"
              prepend-icon="mdi-apps"
              append-icon="mdi-chevron-down"
            >功能</v-btn>
          </template>
          <v-card class="desktop-tools-menu" rounded="lg" elevation="8">
            <div v-for="group in desktopToolGroups" :key="group.title" class="desktop-tools-section">
              <div class="desktop-tools-label">{{ group.title }}</div>
              <div class="desktop-tools-grid">
                <button
                  v-for="tool in group.tools"
                  :key="tool.label"
                  type="button"
                  class="desktop-tool"
                  :disabled="tool.disabled"
                  @click="runDesktopTool(tool.action)"
                >
                  <span class="desktop-tool-icon"><v-icon size="22">{{ tool.icon }}</v-icon></span>
                  <span class="desktop-tool-label">{{ tool.label }}</span>
                </button>
              </div>
            </div>
          </v-card>
        </v-menu>
      </div>
    </div>

    <div class="content-wrapper">

      <!-- ✅ 網格上方列：住家/店面分段開關（網格模式）+ 全域關鍵字搜尋（列表/網格常駐） -->
      <div class="grid-topbar mb-2">
        <div
          v-if="viewFormat === 'grid'"
          class="property-type-switch"
          role="tablist"
          aria-label="切換顯示住家或店面"
        >
          <button
            v-for="opt in propertyTypeOptions"
            :key="opt.value"
            type="button"
            role="tab"
            class="property-type-switch__btn"
            :class="{ 'is-active': displayType === opt.value }"
            :aria-selected="displayType === opt.value"
            @click="displayType = opt.value"
          >
            <v-icon size="18" class="property-type-switch__icon">{{ opt.icon }}</v-icon>
            <span class="property-type-switch__label">{{ opt.label }}</span>
            <span class="property-type-switch__count">{{ opt.count }}</span>
          </button>
        </div>

        <div class="global-search-bar">
          <v-text-field
            v-model="filters.keyword"
            placeholder="全域搜尋：戶別、買方、電話、銷售人員、備註…（可空白分隔多關鍵字）"
            prepend-inner-icon="mdi-magnify"
            variant="solo"
            density="compact"
            hide-details
            clearable
            rounded="lg"
            bg-color="white"
            flat
          >
            <template #append-inner>
              <span v-if="filters.keyword && filters.keyword.trim()" class="text-caption text-grey">
                {{ filteredTableItems.length }} 筆
              </span>
            </template>
          </v-text-field>
        </div>
      </div>

      <v-expand-transition>
  <div v-if="showFilterPanel" class="filter-panel-container mb-2">
    <v-card variant="outlined" class="bg-white pa-3">
      <v-row dense>
        <v-col cols="12" sm="6" md="3">
          <v-select
            v-model="filters.buildings"
            :items="buildingOptions"
            label="棟別 (多選)"
            multiple
            chips
            closable-chips
            variant="outlined"
            density="compact"
            hide-details
            clearable
            :menu-props="{ maxHeight: 320 }"
          ></v-select>
        </v-col>
        <v-col cols="12" sm="6" md="3">
          <v-select
            v-model="filters.floors"
            :items="floorOptions"
            label="樓層 (多選)"
            multiple
            chips
            closable-chips
            variant="outlined"
            density="compact"
            hide-details
            clearable
            :menu-props="{ maxHeight: 320 }"
          ></v-select>
        </v-col>
        <!-- ✅ [新增] 文字標籤篩選（任一符合即顯示；可選「(無標籤)」） -->
        <v-col cols="12" sm="6" md="3">
          <v-select
            v-model="filters.tags"
            :items="tagOptions"
            item-title="text"
            item-value="text"
            label="標籤 (多選)"
            multiple
            chips
            closable-chips
            variant="outlined"
            density="compact"
            hide-details
            clearable
            :menu-props="{ maxHeight: 320 }"
          >
            <template #chip="{ props: chipProps, item }">
              <v-chip
                v-bind="chipProps"
                size="small"
                label
                :style="item.raw.bgColor ? { backgroundColor: item.raw.bgColor, color: item.raw.textColor } : {}"
              >{{ item.raw.text }}</v-chip>
            </template>
            <template #item="{ props: itemProps, item }">
              <v-list-item v-bind="itemProps" :title="undefined">
                <span
                  class="unit-tag-chip unit-tag-chip--lg mr-2"
                  :style="item.raw.bgColor ? { backgroundColor: item.raw.bgColor, color: item.raw.textColor } : { backgroundColor: '#eceff1', color: '#607d8b' }"
                >{{ item.raw.text }}</span>
                <span class="text-caption text-grey">{{ item.raw.count }} 戶</span>
              </v-list-item>
            </template>
          </v-select>
        </v-col>
        <v-col cols="12" sm="6" md="3">
           <div class="d-flex align-center gap-2">
              <v-text-field v-model.number="filters.areaMin" label="面積 最小" type="number" variant="outlined" density="compact" hide-details></v-text-field>
              <span class="text-grey">~</span>
              <v-text-field v-model.number="filters.areaMax" label="最大" type="number" variant="outlined" density="compact" hide-details></v-text-field>
           </div>
        </v-col>
        <v-col cols="12" sm="6" md="3">
           <div class="d-flex align-center gap-2">
              <v-text-field v-model.number="filters.totalPriceMin" label="房屋總價 最小" type="number" variant="outlined" density="compact" hide-details></v-text-field>
              <span class="text-grey">~</span>
              <v-text-field v-model.number="filters.totalPriceMax" label="最大" type="number" variant="outlined" density="compact" hide-details></v-text-field>
           </div>
        </v-col>
        <v-col cols="12" sm="6" md="3">
           <div class="d-flex align-center gap-2">
              <v-text-field v-model.number="filters.unitPriceMin" label="房屋單價 最小" type="number" variant="outlined" density="compact" hide-details></v-text-field>
              <span class="text-grey">~</span>
              <v-text-field v-model.number="filters.unitPriceMax" label="最大" type="number" variant="outlined" density="compact" hide-details></v-text-field>
           </div>
        </v-col>
      </v-row>

      <v-divider v-if="currentViewMode !== 'quote'" class="my-3 border-dashed"></v-divider>
      
      <v-row dense v-if="currentViewMode !== 'quote'">
        <v-col cols="12" sm="6" md="3">
          <v-select
            v-model="filters.statuses"
            :items="statusOptions"
            label="銷控狀態 (多選)"
            multiple
            chips
            closable-chips
            variant="outlined"
            density="compact"
            hide-details
            clearable
          ></v-select>
        </v-col>

        <v-col cols="12" sm="6" md="3"> <v-autocomplete
            v-model="filters.salesperson"
            :items="personnelOptions"
            label="銷售人員 (多選)" 
            multiple
            chips
            closable-chips
            variant="outlined"
            density="compact"
            hide-details
            clearable
          ></v-autocomplete>
        </v-col>

        <v-col cols="12" sm="6" md="2">
          <v-text-field
            v-model="filters.buyerName"
            label="買方姓名"
            variant="outlined"
            density="compact"
            hide-details
            clearable
          ></v-text-field>
        </v-col>

        <v-col cols="12" sm="6" md="2.5">
          <div class="d-flex flex-column">
            <span class="text-caption text-grey ml-1">小訂日期</span>
            <div class="d-flex align-center gap-1">
              <input type="date" v-model="filters.depositDateStart" class="date-input-compact">
              <span class="text-grey">~</span>
              <input type="date" v-model="filters.depositDateEnd" class="date-input-compact">
            </div>
          </div>
        </v-col>

        <v-col cols="12" sm="6" md="2.5">
          <div class="d-flex flex-column">
            <span class="text-caption text-grey ml-1">簽約日期</span>
            <div class="d-flex align-center gap-1">
              <input type="date" v-model="filters.contractDateStart" class="date-input-compact">
              <span class="text-grey">~</span>
              <input type="date" v-model="filters.contractDateEnd" class="date-input-compact">
            </div>
          </div>
        </v-col>
      </v-row>


      
      <template v-if="currentViewMode !== 'quote'">
        <v-divider class="my-3 border-dashed"></v-divider>
        <div class="text-caption text-grey mb-1 ml-1 font-weight-bold">進階價格篩選</div>
        <v-row dense>
          <v-col cols="12" sm="6" md="4">
             <div class="d-flex align-center gap-2">
                <v-text-field v-model.number="filters.floorPriceMin" label="底價 最小" type="number" variant="outlined" density="compact" hide-details></v-text-field>
                <span class="text-grey">~</span>
                <v-text-field v-model.number="filters.floorPriceMax" label="最大" type="number" variant="outlined" density="compact" hide-details></v-text-field>
             </div>
          </v-col>

          <v-col cols="12" sm="6" md="4">
             <div class="d-flex align-center gap-2">
                <v-text-field v-model.number="filters.floorUnitPriceMin" label="底價單價 最小" type="number" variant="outlined" density="compact" hide-details></v-text-field>
                <span class="text-grey">~</span>
                <v-text-field v-model.number="filters.floorUnitPriceMax" label="最大" type="number" variant="outlined" density="compact" hide-details></v-text-field>
             </div>
          </v-col>

          <v-col cols="12" sm="6" md="4">
             <div class="d-flex align-center gap-2">
                <v-text-field v-model.number="filters.transPriceMin" label="成交總價 最小" type="number" variant="outlined" density="compact" hide-details></v-text-field>
                <span class="text-grey">~</span>
                <v-text-field v-model.number="filters.transPriceMax" label="最大" type="number" variant="outlined" density="compact" hide-details></v-text-field>
             </div>
          </v-col>
        </v-row>
      </template>
      
      <div class="d-flex justify-end mt-2">
        <v-btn 
          color="grey-darken-1" 
          variant="text" 
          size="small" 
          prepend-icon="mdi-broom"
          @click="clearFilters"
          v-if="activeFilterCount > 0"
        >
          清除所有條件
        </v-btn>
      </div>
    </v-card>
  </div>
</v-expand-transition>

      <div v-if="viewFormat === 'grid'" class="layout-grid">
        <div class="header-top-left"></div>
        <div ref="headerTopRef" class="header-top-container">
          <div v-for="building in buildingHeaders" :key="building" class="header-cell">
            {{ building }}
          </div>
        </div>

        <div ref="headerLeftRef" class="header-left-container">
          <div v-for="floor in floorHeaders" :key="floor" class="header-cell">
            {{ floor }}F
          </div>
        </div>

        <div ref="mainGridRef" @scroll="handleScroll" class="main-grid-container">
          <div class="grid-table">
            <div v-for="item in flatGridData" :key="item.key" class="data-cell">
             <div v-if="item.data"
  class="unit-card"
  :class="{
    'in-quote': quoteStore.isItemInQuote(item.data.unitId),
    'has-terrace': item.data.area_terrace_ping > 0,
    'filtered-out': isUnitFilteredOut(item.data),
    'has-tags': getUnitTags(item.data).length > 0
  }"
  :style="{ backgroundColor: statusColorMap.get(item.data[statusField]) || '#ffffff' }"
  @click="openUnitDetail(item.data)"
>
            <!-- ✅ [新增] 文字標籤帶：右上角，最多露出 2 個、其餘折成 +N；hover 顯示全部 -->
            <template v-if="getUnitTags(item.data).length > 0">
              <div class="unit-tags-strip">
                <span
                  v-for="(tag, ti) in getUnitTags(item.data).slice(0, 2)"
                  :key="ti"
                  class="unit-tag-chip"
                  :style="{ backgroundColor: tag.bgColor, color: tag.textColor }"
                >{{ tag.text }}</span>
                <span v-if="getUnitTags(item.data).length > 2" class="unit-tag-chip unit-tag-more">+{{ getUnitTags(item.data).length - 2 }}</span>
              </div>
              <v-tooltip activator="parent" location="top" content-class="unit-tags-tooltip">
                <div class="d-flex flex-wrap ga-1">
                  <span
                    v-for="(tag, ti) in getUnitTags(item.data)"
                    :key="ti"
                    class="unit-tag-chip unit-tag-chip--lg"
                    :style="{ backgroundColor: tag.bgColor, color: tag.textColor }"
                  >{{ tag.text }}</span>
                </div>
              </v-tooltip>
            </template>
            <span class="unit-name">
              {{ item.data.unitId }}
              
              <!-- ✅ [優化] 露臺標示：由 icon 改為小 chip，文字直接標明「露臺」 -->
              <v-tooltip location="top" v-if="item.data.area_terrace_ping && Number(item.data.area_terrace_ping) > 0">
                <template v-slot:activator="{ props }">
                  <span v-bind="props" class="terrace-chip">露台</span>
                </template>
                <span>含有露臺：{{ item.data.area_terrace_ping }} 坪</span>
              </v-tooltip>
            </span>
                <template v-if="statusField === 'salesStatus_quote' && item.data.salesStatus_quote === '已售'">
                  <span class="unit-total-price sold-text">已售</span>
                  <span class="unit-area">{{ item.data.area_house_ping }} 坪</span>
                  <span class="unit-per-price"></span>
                </template>
                <!-- ✅ [新增] 網格主要顯示內容：簽約日期 -->
                <template v-else-if="effectiveGridContentMode === 'date'">
                  <span class="unit-total-price contract-date-text">{{ getContractDateDisplay(item.data) }}</span>
                  <span class="unit-area">{{ item.data.area_house_ping }} 坪</span>
                  <span class="unit-per-price"></span>
                </template>
                <!-- ✅ [新增] 網格主要顯示內容：單價（主）＋總價（副） -->
                <template v-else-if="effectiveGridContentMode === 'unit'">
                  <span class="unit-total-price">{{ calculateUnitPrice(item.data) }} 萬/坪</span>
                  <span class="unit-area">{{ item.data.area_house_ping }} 坪</span>
                  <span class="unit-per-price">{{ getDisplayTotalPrice(item.data) }} 萬</span>
                </template>
                <template v-else>
                  <span class="unit-total-price">{{ getDisplayTotalPrice(item.data) }} 萬</span>
                  <span class="unit-area">{{ item.data.area_house_ping }} 坪</span>
                  <span class="unit-per-price">{{ calculateUnitPrice(item.data) }} 萬/坪</span>
                </template>
              </div>
              <div v-else class="unit-card empty"></div>
            </div>
          </div>
        </div>
      </div>

      <div v-else ref="listViewRef" class="list-view-container">
        <v-data-table
          :headers="tableHeaders"
          :items="filteredTableItems"
          :row-props="({ item }) => ({ class: (Number(item.area_terrace_ping) > 0) ? 'row-has-terrace' : '' })"
          :loading="loading"
          fixed-header
          hover
          density="compact"
          class="elevation-1 row-pointer compact-table"
          items-per-page="-1"
          hide-default-footer
          @click:row="handleRowClick"
        >
          <template v-slot:item.status="{ item }">
            <v-chip 
              size="small" 
              label 
              :color="statusColorMap.get(item.status) || 'grey'"
              :class="['font-weight-bold', `text-${getContrastTextColor(statusColorMap.get(item.status))}`]"
              variant="flat"
            >
              {{ item.status }}
            </v-chip>
          </template>

          <template v-slot:item.unitId="{ item }">
            <div class="d-flex align-center justify-center">
              <div class="status-indicator mr-2" :style="{ backgroundColor: statusColorMap.get(item.status) || '#ddd' }"></div>
              <span class="font-weight-bold text-primary">{{ item.unitId }}</span>
              <v-icon v-if="quoteStore.isItemInQuote(item.unitId)" color="warning" size="small" class="ml-2">mdi-check-circle</v-icon>
            </div>
          </template>

          <!-- ✅ [新增] 文字標籤欄：完整顯示所有標籤 chip -->
          <template v-slot:item.unitTags="{ item }">
            <div class="d-flex flex-wrap ga-1 py-1" style="max-width: 220px;">
              <span
                v-for="(tag, ti) in getUnitTags(item)"
                :key="ti"
                class="unit-tag-chip unit-tag-chip--lg"
                :style="{ backgroundColor: tag.bgColor, color: tag.textColor }"
              >{{ tag.text }}</span>
              <span v-if="getUnitTags(item).length === 0" class="text-grey-lighten-1">-</span>
            </div>
          </template>

          <template v-slot:item.area_house_ping="{ item }">
            {{ formatNumber(item.area_house_ping, 2) }}
          </template>

        <template v-slot:item.area_terrace_ping="{ item }">
          <span :class="{ 'font-weight-bold text-success': Number(item.area_terrace_ping) > 0 }">
            {{ item.area_terrace_ping > 0 ? formatNumber(item.area_terrace_ping, 2) : '-' }}
          </span>
        </template>

        <template v-slot:item.salesperson="{ item }">
          {{ formatSalespersons(item.salesperson) }}
        </template>

          <!-- ✅ 備註（留言式）：badge + 最新一則摘要，點擊彈出留言小視窗直接 CRUD -->
          <template v-slot:item.remarks="{ item }">
            <div class="remark-cell" @click.stop="openRemarkDialog(item)">
              <template v-if="remarkCellInfo(item).count > 0">
                <v-icon size="small" color="primary">mdi-comment-text-outline</v-icon>
                <span class="remark-count">{{ remarkCellInfo(item).count }}</span>
                <v-icon v-if="remarkCellInfo(item).hasPinned" size="x-small" color="amber-darken-2">mdi-pin</v-icon>
                <span class="remark-preview">{{ remarkCellInfo(item).preview }}</span>
              </template>
              <template v-else>
                <v-icon size="small" color="grey-lighten-1">mdi-comment-plus-outline</v-icon>
              </template>
              <v-tooltip activator="parent" location="top">點擊檢視／新增備註留言</v-tooltip>
            </div>
          </template>

          <template v-slot:header.isPreferredPayment="{ column }">
            <div class="d-flex flex-column justify-center align-center" style="height: 100%;">
              <span class="text-caption font-weight-bold mb-1">{{ column.title }}</span>
              <div v-if="currentViewMode !== 'quote'" @click.stop>
                <v-checkbox-btn
                  :model-value="isAllPreferredPayment"
                  :indeterminate="isIndeterminatePreferredPayment"
                  @click="openBatchUpdateDialog"
                  color="success"
                  density="compact"
                  hide-details
                  class="ma-0 pa-0"
                ></v-checkbox-btn>
              </div>
            </div>
          </template>

          <template v-slot:item.isPreferredPayment="{ item }">
            <div class="d-flex justify-center" @click.stop>
              <v-switch
                :model-value="item.isPreferredPayment"
                :readonly="currentViewMode === 'quote'"
                :color="item.isPreferredPayment ? 'success' : 'grey'"
                density="compact"
                hide-details
                
                class="ma-0 pa-0"
                @update:model-value="(val) => handleSwitchChange(item, val)"
              ></v-switch>
            </div>
          </template>

          <template v-slot:item.quote_mode_total_price="{ item }">
            <span v-if="item.status === '已售'" class="text-red font-weight-bold">已售</span>
            <span v-else class="text-indigo font-weight-medium">
              {{ formatNumber(item.price_list_house_total, 0) }} 萬 
            </span>
          </template>

          <template v-slot:header.quote_mode_total_price="{ column, sort, sortBy }">
            <div class="d-flex align-center justify-center ga-2"> 
              
              <div 
                class="d-flex align-center cursor-pointer user-select-none" 
                @click="sort(column)"
              >
                <span>{{ column.title }}</span>
                
                <template v-if="sortBy.some(s => s.key === column.key)">
                   <v-icon 
                     :icon="sortBy.find(s => s.key === column.key).order === 'desc' ? 'mdi-arrow-down' : 'mdi-arrow-up'"
                     size="small"
                     class="ml-1"
                     color="black"
                   ></v-icon>
                </template>
                
                <template v-else>
                   <v-icon 
                     icon="mdi-arrow-up"
                     size="small"
                     class="ml-1 text-disabled"
                     style="opacity: 0.3;"
                   ></v-icon>
                </template>
              </div>
              
              <div @click.stop style="transform: scale(0.8); transform-origin: left center;">
                <v-switch
                  v-model="showSoldItems"
                  label="已售"
                  color="error"
                  density="compact"
                  hide-details
                  class="ma-0 pa-0"
                ></v-switch>
              </div>

            </div>
          </template>

          <template v-slot:item.unit_price_value="{ item }">
             <span v-if="item.unit_price_value === null" class="text-grey">-</span>
             
             <span v-else class="text-blue-grey-darken-2 font-weight-medium">
                {{ formatNumber(item.unit_price_value, 2) }} 萬/坪
             </span>
          </template>


          <template v-slot:item.price_list_house_total="{ item }">
            <template v-if="currentViewMode === 'quote'">
              <span v-if="item.status === '已售'" class="text-red font-weight-bold">已售</span>
              <span v-else class="text-indigo font-weight-medium">
                {{ formatNumber(item.price_list_house_total, 0) }} 萬 
              </span>
            </template>
            
            <template v-else>
              <span class="text-grey font-weight-bold">
                {{ formatNumber(item.price_list_house_total, 0) }}
              </span>
            </template>
          </template>

          <template v-slot:item.unit_price_list="{ item }">
            <span v-if="item.unit_price_list" class="text-grey">
              {{ formatNumber(item.unit_price_list, 2) }}
            </span>
            <span v-else class="text-grey">-</span>
          </template>

          <template v-slot:item.unit_price_floor="{ item }">
            <span v-if="item.unit_price_floor" class="text-red">
              {{ formatNumber(item.unit_price_floor, 2) }}
            </span>
            <span v-else class="text-grey">-</span>
          </template>

          <template v-slot:item.unit_price_transaction="{ item }">
            <span v-if="item.unit_price_transaction" class="text-success font-weight-bold">
              {{ formatNumber(item.unit_price_transaction, 2) }}
            </span>
            <span v-else class="text-grey">-</span>
          </template>


          <template v-slot:item.price_floor_house_total="{ item }">
            <span class="text-red font-weight-bold">
              {{ formatNumber(item.price_floor_house_total, 0) }}
            </span>
          </template>

          <template v-slot:item.parking_spots="{ item }">
            <span v-if="item.parking_spots" class="text-indigo-darken-2 font-weight-medium">{{ item.parking_spots.split(',').join('、') }}</span>
            <span v-else class="text-grey">-</span>
          </template>

          <template v-slot:item.parking_floor_total="{ item }">
            <span class="text-red font-weight-bold">
              {{ formatNumber(item.parking_floor_total, 0) }}
            </span>
          </template>

          <template v-slot:item.parking_trans_total="{ item }">
           <span class="font-weight-bold text-success">
              {{ formatNumber(item.parking_trans_total, 0) }}
            </span>
          </template>

          <template v-slot:item.price_transaction_house="{ item }">
          <span class="font-weight-bold text-success">
         {{ formatNumber(item.price_transaction_house, 0) }}
           </span>
          </template>

          <template v-slot:item.total_transaction="{ item }">
            <span class="font-weight-bold text-success">
            {{ formatNumber(item.total_transaction, 0) }}
            </span>
          </template>

          <!-- ✅ [繳款紀錄] 繳款比例：點擊開啟該戶繳款紀錄一覽 -->
          <template v-slot:item.payment_ratio="{ item }">
            <v-chip
              v-if="item.payment_records_count > 0 || (item.payment_ratio !== null && item.payment_ratio > 0)"
              size="small"
              label
              variant="tonal"
              :color="item.payment_ratio !== null && item.payment_ratio >= 100 ? 'green' : 'deep-orange'"
              class="payment-ratio-chip"
              @click.stop="openPaymentRecordsPopup(item)"
            >
              {{ item.payment_ratio !== null ? `${item.payment_ratio.toFixed(1)}%` : `${item.payment_records_count} 筆` }}
            </v-chip>
            <span v-else class="text-grey">-</span>
          </template>
         
          <template v-slot:item.total_floor="{ item }">
          <span class="font-weight-bold text-red">
          {{ formatNumber(item.total_floor, 0) }}
          </span>
          </template>
          
          <template v-slot:item.price_diff="{ item }">
            <span :class="item.price_diff >= 0 ? 'text-success font-weight-bold' : 'text-error font-weight-bold'">
              {{ item.price_diff > 0 ? '+' : '' }}{{ formatNumber(item.price_diff, 0) }}
            </span>
          </template>

          <template v-slot:item.payment_deposit_date="{ item }">{{ formatDate(item.payment_deposit_date) }}</template>
          <template v-slot:item.payment_complete_date="{ item }">{{ formatDate(item.payment_complete_date) }}</template>
          <template v-slot:item.payment_contract_date="{ item }">{{ formatDate(item.payment_contract_date) }}</template>

          <!-- ✅ 加總列：表頭下方 -->
          <template v-slot:body.prepend="{ columns }">
            <tr v-if="summaryRow" class="summary-row summary-row-top">
              <td
                v-for="col in columns"
                :key="`sum-top-${col.key}`"
                :class="summaryCellClass(col)"
                :style="summaryCellStyle(col)"
              >
                <template v-if="col.key === 'unitId'">
                  合計 {{ summaryRow.count }} 戶
                </template>
                <template v-else-if="col.key === 'area_house_ping'">
                  {{ formatNumber(summaryRow.areaTotal, 2) }}
                </template>
                <template v-else-if="col.key === 'area_terrace_ping'">
                  <span v-if="summaryRow.terraceTotal > 0">{{ formatNumber(summaryRow.terraceTotal, 2) }}</span>
                  <span v-else>-</span>
                </template>
                <template v-else-if="col.key === 'price_list_house_total' || col.key === 'quote_mode_total_price'">
                  {{ formatNumber(summaryRow.priceListTotal, 0) }}
                </template>
                <template v-else-if="col.key === 'unit_price_list' || col.key === 'unit_price_value'">
                  <span v-if="summaryRow.unitPriceList !== null">{{ formatNumber(summaryRow.unitPriceList, 2) }}</span>
                  <span v-else>-</span>
                </template>
                <template v-else-if="col.key === 'price_floor_house_total'">
                  {{ formatNumber(summaryRow.priceFloorTotal, 0) }}
                </template>
                <template v-else-if="col.key === 'unit_price_floor'">
                  <span v-if="summaryRow.unitPriceFloor !== null" class="text-red">{{ formatNumber(summaryRow.unitPriceFloor, 2) }}</span>
                  <span v-else>-</span>
                </template>
                <template v-else-if="col.key === 'price_transaction_house'">
                  <span v-if="summaryRow.priceTransTotal > 0" class="text-success">{{ formatNumber(summaryRow.priceTransTotal, 0) }}</span>
                  <span v-else>-</span>
                </template>
                <template v-else-if="col.key === 'unit_price_transaction'">
                  <span v-if="summaryRow.unitPriceTrans !== null" class="text-success">{{ formatNumber(summaryRow.unitPriceTrans, 2) }}</span>
                  <span v-else>-</span>
                </template>
                <template v-else-if="col.key === 'parking_spots'">
                  <span v-if="summaryRow.parkingCountTotal > 0">{{ summaryRow.parkingCountTotal }} 車位</span>
                  <span v-else>-</span>
                </template>
                <template v-else-if="col.key === 'parking_floor_total'">
                  <span v-if="summaryRow.parkingFloorTotal > 0" class="text-red">{{ formatNumber(summaryRow.parkingFloorTotal, 0) }}</span>
                  <span v-else>-</span>
                </template>
                <template v-else-if="col.key === 'parking_trans_total'">
                  <span v-if="summaryRow.parkingTransTotal > 0" class="text-success">{{ formatNumber(summaryRow.parkingTransTotal, 0) }}</span>
                  <span v-else>-</span>
                </template>
                <template v-else-if="col.key === 'total_transaction'">
                  <span v-if="summaryRow.totalTransactionTotal > 0" class="text-success">{{ formatNumber(summaryRow.totalTransactionTotal, 0) }}</span>
                  <span v-else>-</span>
                </template>
                <template v-else-if="col.key === 'payment_ratio'">
                  <span v-if="summaryRow.paymentRatioTotal !== null" class="text-teal font-weight-bold">{{ summaryRow.paymentRatioTotal.toFixed(1) }}%</span>
                  <span v-else>-</span>
                </template>
                <template v-else-if="col.key === 'total_floor'">
                  <span class="text-red">{{ formatNumber(summaryRow.totalFloorTotal, 0) }}</span>
                </template>
                <template v-else-if="col.key === 'price_diff'">
                  <span :class="summaryRow.priceDiffTotal >= 0 ? 'text-success' : 'text-error'">
                    {{ summaryRow.priceDiffTotal > 0 ? '+' : '' }}{{ formatNumber(summaryRow.priceDiffTotal, 0) }}
                  </span>
                </template>
              </td>
            </tr>
          </template>

          <!-- ✅ 加總列：資料最下方 -->
          <template v-slot:body.append="{ columns }">
            <tr v-if="summaryRow" class="summary-row summary-row-bottom">
              <td
                v-for="col in columns"
                :key="`sum-bot-${col.key}`"
                :class="summaryCellClass(col)"
                :style="summaryCellStyle(col)"
              >
                <template v-if="col.key === 'unitId'">
                  合計 {{ summaryRow.count }} 戶
                </template>
                <template v-else-if="col.key === 'area_house_ping'">
                  {{ formatNumber(summaryRow.areaTotal, 2) }}
                </template>
                <template v-else-if="col.key === 'area_terrace_ping'">
                  <span v-if="summaryRow.terraceTotal > 0">{{ formatNumber(summaryRow.terraceTotal, 2) }}</span>
                  <span v-else>-</span>
                </template>
                <template v-else-if="col.key === 'price_list_house_total' || col.key === 'quote_mode_total_price'">
                  {{ formatNumber(summaryRow.priceListTotal, 0) }}
                </template>
                <template v-else-if="col.key === 'unit_price_list' || col.key === 'unit_price_value'">
                  <span v-if="summaryRow.unitPriceList !== null">{{ formatNumber(summaryRow.unitPriceList, 2) }}</span>
                  <span v-else>-</span>
                </template>
                <template v-else-if="col.key === 'price_floor_house_total'">
                  {{ formatNumber(summaryRow.priceFloorTotal, 0) }}
                </template>
                <template v-else-if="col.key === 'unit_price_floor'">
                  <span v-if="summaryRow.unitPriceFloor !== null" class="text-red">{{ formatNumber(summaryRow.unitPriceFloor, 2) }}</span>
                  <span v-else>-</span>
                </template>
                <template v-else-if="col.key === 'price_transaction_house'">
                  <span v-if="summaryRow.priceTransTotal > 0" class="text-success">{{ formatNumber(summaryRow.priceTransTotal, 0) }}</span>
                  <span v-else>-</span>
                </template>
                <template v-else-if="col.key === 'unit_price_transaction'">
                  <span v-if="summaryRow.unitPriceTrans !== null" class="text-success">{{ formatNumber(summaryRow.unitPriceTrans, 2) }}</span>
                  <span v-else>-</span>
                </template>
                <template v-else-if="col.key === 'parking_spots'">
                  <span v-if="summaryRow.parkingCountTotal > 0">{{ summaryRow.parkingCountTotal }} 車位</span>
                  <span v-else>-</span>
                </template>
                <template v-else-if="col.key === 'parking_floor_total'">
                  <span v-if="summaryRow.parkingFloorTotal > 0" class="text-red">{{ formatNumber(summaryRow.parkingFloorTotal, 0) }}</span>
                  <span v-else>-</span>
                </template>
                <template v-else-if="col.key === 'parking_trans_total'">
                  <span v-if="summaryRow.parkingTransTotal > 0" class="text-success">{{ formatNumber(summaryRow.parkingTransTotal, 0) }}</span>
                  <span v-else>-</span>
                </template>
                <template v-else-if="col.key === 'total_transaction'">
                  <span v-if="summaryRow.totalTransactionTotal > 0" class="text-success">{{ formatNumber(summaryRow.totalTransactionTotal, 0) }}</span>
                  <span v-else>-</span>
                </template>
                <template v-else-if="col.key === 'payment_ratio'">
                  <span v-if="summaryRow.paymentRatioTotal !== null" class="text-teal font-weight-bold">{{ summaryRow.paymentRatioTotal.toFixed(1) }}%</span>
                  <span v-else>-</span>
                </template>
                <template v-else-if="col.key === 'total_floor'">
                  <span class="text-red">{{ formatNumber(summaryRow.totalFloorTotal, 0) }}</span>
                </template>
                <template v-else-if="col.key === 'price_diff'">
                  <span :class="summaryRow.priceDiffTotal >= 0 ? 'text-success' : 'text-error'">
                    {{ summaryRow.priceDiffTotal > 0 ? '+' : '' }}{{ formatNumber(summaryRow.priceDiffTotal, 0) }}
                  </span>
                </template>
              </td>
            </tr>
          </template>
        </v-data-table>
      </div>

    </div> 
    
    <!-- 📱 [改版] 手機版底部導覽列：固定 5 鍵不壅擠；進階功能改為底部面板（bottom sheet），
         面板有全幅遮罩可擋住點擊穿透，避免點工具列/選單時誤觸下方網格開啟戶別資訊 -->
    <v-bottom-navigation
      v-if="isMobile"
      :active="true"
      color="primary"
      :height="76"
      app
      grow
    >
      <v-btn @click="showFilterPanel = !showFilterPanel">
        <v-badge
          :content="activeFilterCount"
          :model-value="activeFilterCount > 0"
          color="error"
        >
          <v-icon>mdi-filter-variant</v-icon>
        </v-badge>
        <span>篩選</span>
      </v-btn>

      <v-btn @click="viewFormat = viewFormat === 'grid' ? 'list' : 'grid'">
        <v-icon>{{ viewFormat === 'grid' ? 'mdi-view-list' : 'mdi-view-grid' }}</v-icon>
        <span>{{ viewFormat === 'grid' ? '列表' : '網格' }}</span>
      </v-btn>

      <v-btn @click="isQuoteSidebarOpen = true">
        <v-badge
          :content="itemCount"
          :model-value="itemCount > 0"
          color="error"
        >
          <v-icon>mdi-file-document-outline</v-icon>
        </v-badge>
        <span>報價單</span>
      </v-btn>

      <!-- 銷售模式：顯示設定（價格/網格內容）；報價模式：報價設定直達 -->
      <v-btn v-if="currentViewMode === 'sales'" @click="isDisplaySheetOpen = true">
        <v-icon>mdi-currency-usd</v-icon>
        <span>{{ priceDisplayLabel }}</span>
      </v-btn>
      <v-btn v-else-if="canDirectEnterQuoteSettings" @click="goToQuoteSettingsDirect">
        <v-icon>mdi-file-document-edit-outline</v-icon>
        <span>報價設定</span>
      </v-btn>

      <!-- 兩種模式皆有「功能」面板（內容依模式提供對應功能） -->
      <v-btn @click="isMoreMenuOpen = true">
        <v-icon>mdi-apps</v-icon>
        <span>功能</span>
      </v-btn>
    </v-bottom-navigation>

    <!-- 📱 顯示設定面板：價格顯示／網格內容切換，chip 呈現目前選取狀態（可下滑或按 X 關閉） -->
    <MobileBottomSheet v-model="isDisplaySheetOpen" icon="mdi-currency-usd" title="顯示設定">
        <div class="mobile-sheet-section">
          <div class="mobile-sheet-label">價格顯示</div>
          <v-chip-group v-model="priceDisplayMode" mandatory selected-class="mobile-sheet-chip--active">
            <v-chip value="list" filter variant="outlined" class="mobile-sheet-chip">表價</v-chip>
            <v-chip value="floor" filter variant="outlined" class="mobile-sheet-chip">底價</v-chip>
            <v-chip value="transaction" filter variant="outlined" class="mobile-sheet-chip">成交價</v-chip>
          </v-chip-group>
        </div>

        <div v-if="viewFormat === 'grid'" class="mobile-sheet-section">
          <div class="mobile-sheet-label">網格顯示內容</div>
          <v-chip-group v-model="gridContentMode" mandatory selected-class="mobile-sheet-chip--active">
            <v-chip value="total" filter variant="outlined" class="mobile-sheet-chip">總價</v-chip>
            <v-chip value="unit" filter variant="outlined" class="mobile-sheet-chip">單價</v-chip>
            <v-chip value="date" filter variant="outlined" class="mobile-sheet-chip">簽約日期</v-chip>
          </v-chip-group>
        </div>
    </MobileBottomSheet>

    <!-- 📱 全部功能面板：分群圖示磚，所有進階功能一覽可及（可下滑或按 X 關閉） -->
    <MobileBottomSheet v-model="isMoreMenuOpen" icon="mdi-apps" title="全部功能">
        <div class="mobile-sheet-section">
          <v-select
            :model-value="projectId"
            @update:model-value="onSwitchProjectFromMenu"
            :items="availableProjects"
            item-title="name"
            item-value="id"
            label="切換建案"
            variant="outlined"
            density="compact"
            hide-details
            prepend-inner-icon="mdi-home-city"
          ></v-select>
        </div>

        <div v-for="group in moreToolGroups" :key="group.title" class="mobile-sheet-section">
          <div class="mobile-sheet-label">{{ group.title }}</div>
          <div class="mobile-tool-grid">
            <button
              v-for="tool in group.tools"
              :key="tool.label"
              type="button"
              class="mobile-tool"
              @click="runMoreAction(tool.action)"
            >
              <span class="mobile-tool-icon"><v-icon size="22">{{ tool.icon }}</v-icon></span>
              <span class="mobile-tool-label">{{ tool.label }}</span>
            </button>
          </div>
        </div>
    </MobileBottomSheet>

   <UnitDetailModal
      v-if="isModalVisible"
      v-model:show="isModalVisible"
      :unit-data="selectedUnitData"
      :view-mode="currentViewMode"
      :project-name="project.name"
      :project-id="projectId"
      :all-data="allDataForModal"
      :contract-types="project.contractTypes || []"
      :price-formulas="project.priceFormulaSettings || null"
      :plan-options="quotePlansList"
      @data-updated="handleRefreshData"
      @request-open-slide="handleOpenSlideViewer" />

    <!-- ✅ 備註留言小視窗（列表模式備註欄點擊開啟） -->
    <v-dialog v-model="remarkDialog.show" max-width="540" scrollable>
      <v-card class="pa-3">
        <div class="d-flex align-center mb-2">
          <v-icon color="primary" class="mr-1">mdi-comment-text-multiple-outline</v-icon>
          <span class="text-subtitle-1 font-weight-bold">{{ remarkDialog.unitId }} 備註留言</span>
          <v-spacer></v-spacer>
          <v-btn icon size="small" variant="text" @click="remarkDialog.show = false">
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </div>
        <v-card-text class="pa-0">
          <RemarkNotesPanel
            v-if="remarkDialog.show"
            dense
            :notes="remarkDialog.notes"
            :legacy-remarks="remarkDialog.legacyRemarks"
            :persist-handler="persistRemarkDialogNotes"
            :storage-path-prefix="`unitDetails/${projectId}/${remarkDialog.unitId}/remarkNotes`"
          />
        </v-card-text>
      </v-card>
    </v-dialog>

    <QuoteSidebar v-model:isOpen="isQuoteSidebarOpen" />

    <!-- ✅ [新增] 下載銷控表 PDF 對話框 -->
    <SalesGridDownloadDialog
      v-model:show="isGridDownloadDialogVisible"
      :buildings="buildingHeaders"
      :floors="floorHeaders"
      :grid-data="gridData"
      :status-color-map="statusColorMap"
      :sales-parameters="salesParameters"
      :view-mode="currentViewMode"
      :price-display-mode="priceDisplayMode"
      :price-display-label="priceDisplayLabel"
      :project-name="projectName"
      :project-id="projectId"
      :display-type="displayType"
      :get-total-price="getDisplayTotalPrice"
      :get-unit-price="calculateUnitPrice"
    />

    <CancelledPurchaseManager
      v-model:show="isCancelledPurchaseDialogVisible"
      :project-id="projectId"
      @data-updated="handleRefreshData"
    />

    <!-- 實價登錄申報 — 首次載入 Snackbar 提醒 -->
    <v-snackbar
      v-model="showReportSnackbar"
      :timeout="12000"
      :color="overdueReportCount > 0 ? 'error' : 'warning'"
      location="top right"
      multi-line
      max-width="420"
    >
      <div class="d-flex align-center">
        <v-icon start size="large">mdi-file-document-alert-outline</v-icon>
        <div class="text-body-2">
          有 <strong>{{ pendingReportUnits.length }}</strong> 筆戶別已簽約但尚未填入申報書序號。
          <template v-if="overdueReportCount > 0">
            其中 <strong>{{ overdueReportCount }}</strong> 筆已逾 30 天，可能面臨罰則。
          </template>
        </div>
      </div>
      <template #actions>
        <v-btn variant="text" @click="showReportSnackbar = false; showReportReminderDialog = true">
          查看詳情
        </v-btn>
        <v-btn icon="mdi-close" variant="text" size="small"
          @click="showReportSnackbar = false" />
      </template>
    </v-snackbar>

    <!-- 實價登錄申報提醒清單 -->
    <v-dialog v-model="showReportReminderDialog" max-width="960" scrollable>
      <v-card class="d-flex flex-column report-reminder-card">
        <v-card-title class="d-flex align-center bg-warning-lighten-4 flex-shrink-0">
          <v-icon start color="warning">mdi-file-document-alert-outline</v-icon>
          待完成實價登錄申報 ({{ pendingReportUnits.length }} 筆)
          <v-chip v-if="overdueReportCount > 0" size="small" color="error" variant="flat" class="ml-3">
            逾期 {{ overdueReportCount }} 筆
          </v-chip>
          <v-spacer />
          <v-btn icon="mdi-close" variant="text" size="small"
            @click="showReportReminderDialog = false" />
        </v-card-title>
        <v-divider />
        <v-card-text class="pa-0 report-reminder-body">
          <v-alert v-if="overdueReportCount > 0" type="error" variant="tonal"
            density="compact" class="ma-3 flex-shrink-0" icon="mdi-alarm-light-outline">
            有 <strong>{{ overdueReportCount }}</strong> 筆戶別自簽約日起已逾 30 天，
            依《平均地權條例》未依限申報將面臨罰則，請儘速完成申報。
          </v-alert>
          <v-list lines="two" density="compact">
            <template v-for="(u, i) in pendingReportUnits" :key="u.id">
              <v-list-item
                :class="{ 'bg-red-lighten-5': u.overdue }"
                @click="openPendingUnit(u)">
                <template #prepend>
                  <v-avatar :color="u.overdue ? 'error' : 'warning'" size="40" variant="tonal">
                    <span class="text-caption font-weight-bold">{{ u.daysElapsed }}</span>
                  </v-avatar>
                </template>
                <v-list-item-title class="font-weight-medium">
                  {{ u.building ? `${u.building} / ` : '' }}{{ u.unitId }}
                  <span v-if="u.buyerName" class="text-caption text-grey ml-1">（{{ u.buyerName }}）</span>
                </v-list-item-title>
                <v-list-item-subtitle>
                  簽約日：{{ formatDate(u.contractDate) }}
                  ·
                  已過
                  <strong :class="u.overdue ? 'text-error' : 'text-warning'">{{ u.daysElapsed }}</strong>
                  天
                  <span v-if="u.overdue" class="text-error ml-1">（已逾 30 天期限）</span>
                  <span v-else class="text-grey ml-1">（還剩 {{ u.remaining }} 天）</span>
                </v-list-item-subtitle>
                <template #append>
                  <v-btn size="small" variant="tonal" color="primary"
                    prepend-icon="mdi-open-in-new">
                    開啟戶別
                  </v-btn>
                </template>
              </v-list-item>
              <v-divider v-if="i < pendingReportUnits.length - 1" />
            </template>
          </v-list>
        </v-card-text>
        <v-divider />
        <v-card-actions class="flex-shrink-0">
          <span class="text-caption text-grey ml-2">點擊任一列可直接開啟該戶別</span>
          <v-spacer />
          <v-btn variant="text" @click="showReportReminderDialog = false">關閉</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- 資料透視（類 Google Sheet 資料透視：左欄位 / 中設定 / 右結果 三欄式） -->
    <v-dialog v-model="isSalesPivotVisible" max-width="1680px" :fullscreen="isMobile">
      <v-card class="pivot-layout-card d-flex flex-column">
        <v-card-title class="text-h6 d-flex align-center bg-blue-grey-lighten-5 flex-shrink-0">
          <v-icon start>mdi-table-pivot</v-icon>
          <span class="text-subtitle-1 font-weight-bold">{{ projectName }} 銷控資料透視</span>
          <v-chip size="small" color="blue-grey" variant="tonal" class="ml-3" prepend-icon="mdi-home-group">
            共 {{ pivotMatrix.itemCount }} 戶
          </v-chip>
          <v-chip v-if="pivotHasPersonCount" size="small" color="indigo" variant="tonal" class="ml-1"
            prepend-icon="mdi-account-multiple" title="一戶有多個值（多位銷售人員、多個車位/方案）時會分別計入，總計為「筆數」而非戶數">
            合計 {{ pivotMatrix.grand.count }} 筆
          </v-chip>
          <v-spacer></v-spacer>
          <v-btn icon="mdi-close" variant="text" @click="isSalesPivotVisible = false"></v-btn>
        </v-card-title>
        <v-divider></v-divider>

        <div class="pivot-layout flex-grow-1">
          <!-- 左：所有資料欄位（可搜尋、可拖曳） -->
          <aside class="pivot-pane pivot-pane-fields">
            <div class="pivot-pane-title"><v-icon size="15">mdi-format-list-bulleted</v-icon> 資料欄位</div>
            <v-text-field v-model="pivotFieldSearch" placeholder="輸入文字過濾欄位" density="compact" hide-details
              variant="outlined" clearable prepend-inner-icon="mdi-magnify"
              class="mb-2 flex-shrink-0 pivot-field-search"></v-text-field>
            <div class="text-caption text-grey mb-1 flex-shrink-0">拖曳欄位至右方「列／欄／值／篩選器」</div>
            <div class="pivot-field-list">
              <div class="pivot-field-item pivot-field-count" draggable="true"
                @dragstart="onPivotFieldDragStart($event, '__count__')" title="拖曳到「值」計算戶數">
                <v-icon size="14" color="indigo">mdi-counter</v-icon>
                <span class="pivot-field-label">戶數（計數）</span>
                <v-icon size="13" color="grey-lighten-1" class="ml-auto">mdi-drag</v-icon>
              </div>
              <div v-for="f in pivotFieldList" :key="f.key" class="pivot-field-item" :class="{ used: f.used }"
                draggable="true" @dragstart="onPivotFieldDragStart($event, f.key)" :title="f.label">
                <v-icon size="14" :color="f.numeric ? 'teal' : 'blue-grey-lighten-1'">{{ f.numeric ? 'mdi-pound' : 'mdi-label-outline' }}</v-icon>
                <span class="pivot-field-label">{{ f.label }}</span>
                <v-icon v-if="f.used" size="13" color="indigo" class="ml-auto" title="已用於列/欄">mdi-check</v-icon>
                <v-icon v-else size="13" color="grey-lighten-1" class="ml-auto">mdi-drag</v-icon>
              </div>
              <div v-if="pivotFieldList.length === 0" class="text-caption text-grey pa-2">無符合的欄位</div>
            </div>
          </aside>

          <!-- 中：列 / 欄 / 值 / 篩選器（拖放區＋列表新增） -->
          <section class="pivot-pane pivot-pane-editor">
            <div class="pivot-zone" :class="{ 'drag-over': pivotDragOverZone === 'row' }"
              @dragover.prevent="pivotDragOverZone = 'row'" @dragleave="pivotDragOverZone = ''"
              @drop.prevent="onPivotZoneDrop('row', $event)">
              <div class="pivot-zone-title"><v-icon size="14">mdi-table-row</v-icon> 列</div>
              <div class="d-flex flex-wrap ga-1 mb-1">
                <v-chip v-for="(d, i) in pivotRowDims" :key="d" size="small" color="indigo" variant="tonal" label closable
                  @click:close="pivotRowDims.splice(i, 1)">{{ pivotDimensionLabel(d) }}</v-chip>
                <span v-if="pivotRowDims.length === 0" class="text-caption text-grey">拖曳欄位到此</span>
              </div>
              <v-autocomplete v-model="pivotRowDimToAdd" :items="pivotAddDimOptions" item-title="label" item-value="key"
                density="compact" hide-details variant="outlined" auto-select-first placeholder="＋新增列"
                :menu-props="{ maxHeight: 400 }" @update:model-value="k => addPivotDim('row', k)"></v-autocomplete>
            </div>

            <div class="pivot-zone" :class="{ 'drag-over': pivotDragOverZone === 'col' }"
              @dragover.prevent="pivotDragOverZone = 'col'" @dragleave="pivotDragOverZone = ''"
              @drop.prevent="onPivotZoneDrop('col', $event)">
              <div class="pivot-zone-title"><v-icon size="14">mdi-table-column</v-icon> 欄</div>
              <div class="d-flex flex-wrap ga-1 mb-1">
                <v-chip v-for="(d, i) in pivotColDims" :key="d" size="small" color="teal" variant="tonal" label closable
                  @click:close="pivotColDims.splice(i, 1)">{{ pivotDimensionLabel(d) }}</v-chip>
                <span v-if="pivotColDims.length === 0" class="text-caption text-grey">拖曳欄位到此（可不設）</span>
              </div>
              <v-autocomplete v-model="pivotColDimToAdd" :items="pivotAddDimOptions" item-title="label" item-value="key"
                density="compact" hide-details variant="outlined" auto-select-first placeholder="＋新增欄"
                :menu-props="{ maxHeight: 400 }" @update:model-value="k => addPivotDim('col', k)"></v-autocomplete>
            </div>

            <div class="pivot-zone" :class="{ 'drag-over': pivotDragOverZone === 'values' }"
              @dragover.prevent="pivotDragOverZone = 'values'" @dragleave="pivotDragOverZone = ''"
              @drop.prevent="onPivotZoneDrop('values', $event)">
              <div class="pivot-zone-title"><v-icon size="14">mdi-sigma</v-icon> 值</div>
              <div v-for="(vd, i) in pivotValues" :key="i" class="pivot-value-entry mb-1">
                <!-- 第一行：欄位（全寬，避免文字被截斷）＋ 刪除 -->
                <div class="d-flex align-center ga-1">
                  <v-autocomplete v-model="vd.field" :items="pivotValueFieldOptionsWithCount" item-title="label" item-value="key"
                    density="compact" hide-details variant="outlined" auto-select-first class="flex-grow-1" style="min-width:0;"
                    :title="pivotValueFieldLabelOf(vd.field)"
                    :menu-props="{ maxHeight: 400 }" @update:model-value="onPivotValueFieldChange(vd)"></v-autocomplete>
                  <v-btn icon="mdi-close" size="x-small" variant="text" color="grey" class="flex-shrink-0"
                    :disabled="pivotValues.length <= 1" @click="removePivotValue(i)"></v-btn>
                </div>
                <!-- 第二行：彙總方式（獨立一行，不與欄位擠壓） -->
                <div v-if="vd.field !== '__count__'" class="d-flex align-center ga-2 mt-1">
                  <span class="text-caption text-grey-darken-1 flex-shrink-0">彙總</span>
                  <v-btn-toggle v-model="vd.mode" color="indigo" variant="outlined" density="compact" mandatory
                    class="pivot-agg-toggle">
                    <v-btn v-for="opt in PIVOT_AGG_OPTIONS" :key="opt.key" :value="opt.key" size="x-small">{{ opt.label }}</v-btn>
                  </v-btn-toggle>
                </div>
              </div>
              <v-btn size="small" variant="text" color="indigo" prepend-icon="mdi-plus" @click="addPivotValue">新增值</v-btn>
              <div v-if="pivotWeightedHint" class="text-caption text-indigo-darken-1 mt-1">
                <v-icon size="13">mdi-information-outline</v-icon>
                單價的「平均」採加權計算（總價加總 ÷ 面積加總）。
              </div>
            </div>

            <div class="pivot-zone" :class="{ 'drag-over': pivotDragOverZone === 'filter' }"
              @dragover.prevent="pivotDragOverZone = 'filter'" @dragleave="pivotDragOverZone = ''"
              @drop.prevent="onPivotZoneDrop('filter', $event)">
              <div class="pivot-zone-title"><v-icon size="14">mdi-filter-variant</v-icon> 篩選器</div>
              <div v-for="(f, i) in pivotFilters" :key="f.field" class="pivot-filter-entry mb-1">
                <div class="d-flex align-center mb-1">
                  <span class="text-caption font-weight-bold text-grey-darken-2">{{ pivotDimensionLabel(f.field) }}</span>
                  <v-spacer></v-spacer>
                  <v-btn icon="mdi-close" size="x-small" variant="text" color="grey" @click="removePivotFilter(i)"></v-btn>
                </div>
                <v-autocomplete v-model="f.selected" :items="pivotFilterOptionsMap[f.field] || []"
                  multiple chips closable-chips clearable density="compact" hide-details variant="outlined"
                  placeholder="全部（未勾選＝不限）" :menu-props="{ maxHeight: 320 }"></v-autocomplete>
              </div>
              <v-autocomplete v-model="pivotFilterFieldToAdd" :items="pivotDimensionOptions" item-title="label" item-value="key"
                density="compact" hide-details variant="outlined" auto-select-first placeholder="＋新增篩選器"
                :menu-props="{ maxHeight: 400 }" @update:model-value="addPivotFilter"></v-autocomplete>
            </div>

            <div class="pivot-zone">
              <div class="pivot-zone-title"><v-icon size="14">mdi-home-city-outline</v-icon> 資料範圍</div>
              <div class="text-caption text-grey-darken-1">類型：</div>
              <v-chip-group v-model="pivotPropertyTypes" multiple column selected-class="text-primary" class="pivot-status-chips">
                <v-chip v-for="t in PIVOT_PROPERTY_TYPE_OPTIONS" :key="t" :value="t" filter variant="outlined" size="small">{{ t }}</v-chip>
              </v-chip-group>
              <div class="text-caption text-grey-darken-1 mt-1">銷控狀態：</div>
              <v-chip-group v-model="pivotStatuses" multiple column selected-class="text-primary" class="pivot-status-chips">
                <v-chip v-for="s in statusOptions" :key="s" :value="s" filter variant="outlined" size="small">{{ s }}</v-chip>
              </v-chip-group>
              <div class="text-caption text-grey mt-1">
                住家與店面全數納入（不受網格顯示類型影響）；列表的關鍵字/棟別/樓層/價格等篩選仍生效。
              </div>
            </div>

            <div class="pivot-zone">
              <div class="pivot-zone-title"><v-icon size="14">mdi-tune</v-icon> 顯示選項</div>
              <v-checkbox v-if="pivotHasNonCountValue" v-model="pivotShowBoth" label="同時顯示戶數"
                density="compact" hide-details color="indigo"></v-checkbox>
              <v-select v-if="pivotAnyPctable" v-model="pivotCellPct" :items="PIVOT_CELL_PCT_OPTIONS"
                item-title="label" item-value="key" label="儲存格佔比" density="compact" hide-details variant="outlined"
                prepend-inner-icon="mdi-percent-outline" class="my-1"></v-select>
              <v-switch v-model="pivotShowChart" label="長條圖" color="indigo" density="compact" hide-details></v-switch>
              <v-switch v-if="pivotHasNumericDim" v-model="pivotNumericBinning" label="數值區間分組"
                color="indigo" density="compact" hide-details
                title="關閉時每個實際數值單獨一列；開啟時自動分組為區間（如 1,000～1,500）"></v-switch>
            </div>
          </section>

          <!-- 右：分析結果 -->
          <main class="pivot-pane pivot-pane-result">
          <v-alert v-if="pivotMatrix.rows.length === 0" type="info" variant="tonal"
            text="目前條件下無任何戶別資料可供分析。"></v-alert>
          <div v-else class="pivot-table-wrap">
            <v-table density="compact">
              <thead>
                <tr class="bg-grey-lighten-4">
                  <th v-for="(label, li) in pivotMatrix.rowDimLabels" :key="'rd' + li"
                    :rowspan="pivotMatrix.useCol ? 2 : 1"
                    class="text-left font-weight-bold pivot-sortable"
                    :style="li === 0 ? 'min-width:110px;position:sticky;left:0;background:#f5f5f5;z-index:2;' : 'min-width:100px;'"
                    @click="togglePivotSort({ type: 'name', li })" title="點擊排序">
                    {{ label }}
                    <v-icon size="14" :color="pivotSortActive({ type: 'name', li }) ? 'primary' : 'grey-lighten-1'">{{ pivotSortIcon({ type: 'name', li }) }}</v-icon>
                  </th>
                  <template v-if="pivotMatrix.useCol">
                    <th v-for="cKey in pivotMatrix.colKeys" :key="'c' + cKey" :colspan="pivotMatrix.valueDefs.length"
                      class="text-center font-weight-bold" style="min-width:70px;border-left:1px solid #e0e0e0;">
                      {{ pivotColLabel(cKey) }}
                    </th>
                    <th :colspan="pivotMatrix.valueDefs.length" class="text-center font-weight-bold"
                      :style="pivotStickyTotalGroupStyle('#f5f5f5')">總計</th>
                  </template>
                  <template v-else>
                    <th v-for="(vd, vi) in pivotMatrix.valueDefs" :key="'v' + vi"
                      class="text-center font-weight-bold pivot-sortable" style="min-width:84px;"
                      @click="togglePivotSort({ type: 'total', vi })" title="點擊排序">
                      {{ pivotValueDefLabel(vd) }}
                      <v-icon size="14" :color="pivotSortActive({ type: 'total', vi }) ? 'primary' : 'grey-lighten-1'">{{ pivotSortIcon({ type: 'total', vi }) }}</v-icon>
                    </th>
                  </template>
                  <th :rowspan="pivotMatrix.useCol ? 2 : 1" class="text-center font-weight-bold"
                    :style="pivotStickyPctStyle('#f5f5f5')">佔比</th>
                </tr>
                <tr v-if="pivotMatrix.useCol" class="bg-grey-lighten-4">
                  <template v-for="cKey in pivotMatrix.colKeys" :key="'sub' + cKey">
                    <th v-for="(vd, vi) in pivotMatrix.valueDefs" :key="'sub' + cKey + vi"
                      class="text-center text-caption pivot-sortable" style="min-width:70px;"
                      @click="togglePivotSort({ type: 'cell', cKey, vi })" title="點擊排序">
                      {{ pivotValueDefLabel(vd) }}
                      <v-icon size="13" :color="pivotSortActive({ type: 'cell', cKey, vi }) ? 'primary' : 'grey-lighten-1'">{{ pivotSortIcon({ type: 'cell', cKey, vi }) }}</v-icon>
                    </th>
                  </template>
                  <th v-for="(vd, vi) in pivotMatrix.valueDefs" :key="'tot' + vi"
                    class="text-center text-caption pivot-sortable"
                    :style="pivotStickyTotalStyle(vi, '#f5f5f5')"
                    @click="togglePivotSort({ type: 'total', vi })" title="點擊排序">
                    {{ pivotValueDefLabel(vd) }}
                    <v-icon size="13" :color="pivotSortActive({ type: 'total', vi }) ? 'primary' : 'grey-lighten-1'">{{ pivotSortIcon({ type: 'total', vi }) }}</v-icon>
                  </th>
                </tr>
                <!-- 頂部總計列（與底部總計相同，方便長表不用捲到底） -->
                <tr class="font-weight-bold bg-grey-lighten-3">
                  <td :colspan="pivotMatrix.rowDimLabels.length" style="position:sticky;left:0;background:#eeeeee;z-index:1;">總計</td>
                  <template v-for="cKey in pivotMatrix.colKeys" :key="'tf' + cKey">
                    <td v-for="(vd, vi) in pivotMatrix.valueDefs" :key="'tf' + cKey + vi"
                      class="text-center pivot-cell-click"
                      @click="openPivotDrill('__col__', cKey)" title="點擊查看戶別明細">{{ pivotColTotalMain(cKey, vi) }}</td>
                  </template>
                  <template v-if="pivotMatrix.useCol">
                    <td v-for="(vd, vi) in pivotMatrix.valueDefs" :key="'tg' + vi"
                      class="text-center text-deep-orange-darken-3 pivot-cell-click"
                      :style="pivotStickyTotalStyle(vi, '#eeeeee')"
                      @click="openPivotDrill('__grand__', '')" title="點擊查看戶別明細">{{ pivotGrandMain(vi) }}</td>
                  </template>
                  <td class="text-center" :style="pivotStickyPctStyle('#eeeeee')">{{ pivotMatrix.pctValueIndex >= 0 ? '100%' : '—' }}</td>
                </tr>
              </thead>
              <tbody>
                <tr v-for="row in sortedPivotRows" :key="row.key">
                  <td v-for="(p, li) in row.parts" :key="row.key + 'p' + li"
                    class="font-weight-medium pivot-cell-click"
                    :style="li === 0 ? 'position:sticky;left:0;background:#fff;z-index:1;' : ''"
                    @click="openPivotDrill(row.key, '__row__')" title="點擊查看戶別明細">{{ p }}</td>
                  <template v-for="cKey in pivotMatrix.colKeys" :key="row.key + cKey">
                    <td v-for="(vd, vi) in pivotMatrix.valueDefs" :key="row.key + cKey + vi"
                      class="text-center pivot-cell-click"
                      @click="openPivotDrill(row.key, pivotMatrix.useCol ? cKey : '__row__')" title="點擊查看戶別明細">
                      <span :class="(row.cells[cKey]?.count) ? '' : 'text-grey-lighten-1'">{{ pivotCellMain(row, cKey, vi) }}</span>
                      <div v-if="pivotCellSub(row, cKey, vi)" class="pivot-cell-sub">{{ pivotCellSub(row, cKey, vi) }}</div>
                    </td>
                  </template>
                  <template v-if="pivotMatrix.useCol">
                    <td v-for="(vd, vi) in pivotMatrix.valueDefs" :key="row.key + 'rt' + vi"
                      class="text-center font-weight-bold text-blue-grey-darken-2 pivot-cell-click"
                      :style="pivotStickyTotalStyle(vi, '#ffffff')"
                      @click="openPivotDrill(row.key, '__row__')" title="點擊查看戶別明細">{{ pivotRowTotalMain(row, vi) }}</td>
                  </template>
                  <td class="text-center text-grey-darken-1" :style="pivotStickyPctStyle('#ffffff')">{{ row.pct === null ? '—' : row.pct + '%' }}</td>
                </tr>
              </tbody>
              <tfoot class="bg-grey-lighten-3">
                <tr class="font-weight-bold">
                  <td :colspan="pivotMatrix.rowDimLabels.length" style="position:sticky;left:0;background:#eeeeee;z-index:1;">總計</td>
                  <template v-for="cKey in pivotMatrix.colKeys" :key="'f' + cKey">
                    <td v-for="(vd, vi) in pivotMatrix.valueDefs" :key="'f' + cKey + vi"
                      class="text-center pivot-cell-click"
                      @click="openPivotDrill('__col__', cKey)" title="點擊查看戶別明細">{{ pivotColTotalMain(cKey, vi) }}</td>
                  </template>
                  <template v-if="pivotMatrix.useCol">
                    <td v-for="(vd, vi) in pivotMatrix.valueDefs" :key="'g' + vi"
                      class="text-center text-deep-orange-darken-3 pivot-cell-click"
                      :style="pivotStickyTotalStyle(vi, '#eeeeee')"
                      @click="openPivotDrill('__grand__', '')" title="點擊查看戶別明細">{{ pivotGrandMain(vi) }}</td>
                  </template>
                  <td class="text-center" :style="pivotStickyPctStyle('#eeeeee')">{{ pivotMatrix.pctValueIndex >= 0 ? '100%' : '—' }}</td>
                </tr>
              </tfoot>
            </v-table>
          </div>
          <div v-if="pivotMatrix.rows.length" class="text-caption text-grey mt-1 pivot-result-hint">
            <v-icon size="13">mdi-cursor-default-click-outline</v-icon> 點擊任一儲存格可查看對應的戶別明細。
          </div>

          <!-- 長條圖：第一個值的列合計（單一序列橫向長條） -->
          <div v-if="pivotShowChart && pivotMatrix.rows.length" class="bg-white rounded-lg pa-3 mt-3 pivot-chart-block" style="border:1px solid #eceff1;">
            <div class="text-caption font-weight-bold text-grey-darken-2 mb-2">{{ pivotChartTitle }}</div>
            <div>
              <div v-for="bar in pivotChartData.bars" :key="bar.key" class="pivot-chart-row"
                :title="`${bar.name}：${formatPivotValue(bar.value)}`"
                @click="openPivotDrill(bar.key, '__row__')">
                <div class="pivot-chart-label">{{ bar.name }}</div>
                <div class="pivot-chart-track">
                  <div class="pivot-chart-bar" :class="{ neg: bar.neg }" :style="{ width: bar.widthPct + '%' }"></div>
                </div>
                <div class="pivot-chart-value">{{ pivotFormatValueAt(pivotMatrix.valueDefs[0], bar.value) }}</div>
              </div>
            </div>
            <div v-if="pivotChartData.truncated > 0" class="text-caption text-grey mt-1">
              僅顯示前 {{ PIVOT_CHART_MAX_BARS }} 列，其餘 {{ pivotChartData.truncated }} 列未繪出（可先在表格排序後檢視）。
            </div>
          </div>
          </main>
        </div>

        <v-divider></v-divider>
        <v-card-actions class="pa-3 bg-grey-lighten-4 flex-shrink-0">
          <v-btn variant="text" color="primary" prepend-icon="mdi-content-copy"
            :disabled="pivotMatrix.rows.length === 0" @click="copyPivotTable">複製表格</v-btn>
          <v-btn variant="text" color="teal-darken-1" prepend-icon="mdi-file-excel-outline"
            :disabled="pivotMatrix.rows.length === 0" @click="exportPivotToExcel">匯出EXCEL</v-btn>
          <v-spacer></v-spacer>
          <v-btn color="primary" variant="flat" @click="isSalesPivotVisible = false">完成</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- ✅ [繳款紀錄] 列表模式：點繳款比例浮動顯示該戶繳款紀錄一覽（手機全螢幕 / 電腦置中視窗） -->
    <v-dialog v-model="paymentPopup.open" :fullscreen="isMobile" :max-width="isMobile ? undefined : 680" scrollable>
      <v-card>
        <v-toolbar color="teal-darken-1" density="compact">
          <v-toolbar-title class="text-subtitle-1">
            <v-icon size="small" class="mr-1">mdi-cash-multiple</v-icon>
            {{ paymentPopup.unit ? paymentPopup.unit.unitId : '' }} 繳款紀錄一覽
          </v-toolbar-title>
          <v-btn icon="mdi-close" variant="text" @click="paymentPopup.open = false"></v-btn>
        </v-toolbar>
        <v-card-text class="pa-3">
          <PaymentRecordsPanel
            v-if="paymentPopup.unit"
            :model-value="paymentPopup.unit.paymentRecords || []"
            :editable="false"
            :default-expanded="true"
            :allow-quick-add="canQuickEditPayments"
            :quick-add-handler="canQuickEditPayments ? popupQuickAddPaymentRecord : null"
            :quick-update-handler="canQuickEditPayments ? popupQuickUpdatePaymentRecord : null"
            :quick-delete-handler="canQuickEditPayments ? popupQuickDeletePaymentRecord : null"
            :total-price-wan="paymentPopup.unit.total_transaction"
            :unit-id="paymentPopup.unit.unitId || ''"
            :drive-folder-url="paymentPopup.unit.driveFolderUrl || ''"
          />
        </v-card-text>
      </v-card>
    </v-dialog>

    <!-- 資料透視下鑽明細：點儲存格顯示對應戶別清單 -->
    <v-dialog v-model="isPivotDrillVisible" max-width="720px" scrollable>
      <v-card>
        <v-card-title class="text-subtitle-1 d-flex align-center bg-indigo-lighten-5">
          <v-icon start size="small">mdi-format-list-bulleted</v-icon>
          <span class="font-weight-bold">{{ pivotDrillTitle }}</span>
          <v-chip size="x-small" variant="tonal" color="indigo" class="ml-2" label>{{ pivotDrillItems.length }} 戶</v-chip>
          <v-spacer></v-spacer>
          <v-btn icon="mdi-close" variant="text" density="compact" @click="isPivotDrillVisible = false"></v-btn>
        </v-card-title>
        <v-divider></v-divider>
        <v-card-text class="pa-0" style="max-height:60vh;">
          <v-table density="compact" hover>
            <thead>
              <tr class="bg-grey-lighten-4">
                <th class="font-weight-bold">戶別</th>
                <th class="font-weight-bold">銷控狀態</th>
                <th class="font-weight-bold">買方姓名</th>
                <th class="font-weight-bold">銷售人員</th>
                <th v-if="pivotDrillValueDef" class="font-weight-bold text-right">{{ pivotValueFieldLabelOf(pivotDrillValueDef.field) }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="it in pivotDrillItems" :key="it.unitId" class="pivot-cell-click" @click="openUnitFromDrill(it)" title="點擊開啟戶別詳細資料">
                <td class="font-weight-medium text-primary">{{ it.unitId }}</td>
                <td>{{ it.status || '—' }}</td>
                <td>{{ it.buyerName || '—' }}</td>
                <td>{{ formatSalespersons(it.salesperson) || '—' }}</td>
                <td v-if="pivotDrillValueDef" class="text-right">{{ formatPivotValue(Number(it[pivotDrillValueDef.field])) }}</td>
              </tr>
            </tbody>
          </v-table>
        </v-card-text>
        <v-divider></v-divider>
        <v-card-actions class="pa-2">
          <span class="text-caption text-grey ml-2">點擊任一列可開啟該戶別詳細資料</span>
          <v-spacer></v-spacer>
          <v-btn variant="text" @click="isPivotDrillVisible = false">關閉</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="isSlideDialogVisible" fullscreen hide-overlay transition="dialog-bottom-transition">
      <v-card class="d-flex flex-column">
        <v-toolbar dark color="primary" density="compact">
          <v-btn icon dark @click="isSlideDialogVisible = false">
            <v-icon>mdi-close</v-icon>
          </v-btn>
          <v-toolbar-title>車位表</v-toolbar-title>
          <v-spacer></v-spacer>
          <v-btn 
            v-if="currentViewMode === 'sales'"
            prepend-icon="mdi-table-edit"
            @click="navigateToParkingControl"
            variant="tonal"
          >
            車位銷控管理
          </v-btn>
        </v-toolbar>
        <div class="flex-grow-1" style="position: relative;">
          <v-overlay
            :model-value="isLoadingSlide"
            class="align-center justify-center"
            persistent
            scrim="rgba(0, 0, 0, 0.6)"
          >
            <div class="text-center">
              <v-progress-circular indeterminate color="#008cff" size="64"></v-progress-circular>
              <p class="mt-4 text-body-1 text-blcak">正在載入最新車位表...</p>
            </div>
          </v-overlay>
          <div v-if="isContentLoaded" class="fill-height">
            <iframe
              v-if="slideEmbedUrl"
              :src="slideEmbedUrl"
              frameborder="0"
              width="100%"
              height="100%"
              allowfullscreen="true"
              style="display: block;"
            ></iframe>
            <div v-else class="d-flex flex-column justify-center align-center fill-height">
              <v-icon size="80" color="grey-lighten-1">mdi-alert-circle-outline</v-icon>
              <p class="mt-4 text-h6 text-grey">無法載入車位表</p>
              <p class="text-body-1 text-grey">點擊右上角關閉按鈕，或手動重新整理。</p>
            </div>
          </div>
        </div>
      </v-card>
    </v-dialog>

    <ActivityMessageViewer
      v-model="isActivityDialogVisible"
      :project-id="projectId"
      :project-name="project.name"
      :can-upload="canUploadActivityMessage"
    />


    <v-dialog v-model="uploadDialog" max-width="600px" persistent>
        <v-card>
            <v-card-title class="bg-red-darken-2">
          <span class="text-h5">上傳 Excel 更新戶別資料</span>
        </v-card-title>
        <v-card-text class="pt-4">
          <v-alert
            type="warning"
            color="error"
            variant="tonal"
            class="mb-4"
            title="重要提示"
            text="上傳的 Excel 會依「戶別」比對更新：檔案中包含的欄位會覆蓋現有資料（空白儲存格會清空該欄位值），未包含的欄位維持不變。可只保留「戶別」與欲更新的欄位上傳。為避免資料遺失，強烈建議您先匯出目前的資料作為備份。"
          ></v-alert>

          <v-btn 
            color="green" 
            @click="exportToExcel" 
            block 
            class="mb-6"
            prepend-icon="mdi-download"
          >
            匯出目前戶別資料 (備份)
          </v-btn>

          <v-file-input
            v-model="uploadedFile"
            label="選擇 Excel 檔案"
            accept=".xlsx, .xls"
            variant="outlined"
            density="compact"
            :loading="isParsing"
            @change="handleFileChange"
          ></v-file-input>

          <v-alert
            v-if="uploadMessage"
            :type="uploadMessageType"
            variant="tonal"
            class="mt-4 pre-wrap-alert" 
            density="compact"
          >
            {{ uploadMessage }}
          </v-alert>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="grey" variant="text" @click="closeUploadDialog">取消</v-btn>
          <v-btn 
            color="error" 
            variant="flat" 
            @click="uploadData" 
            :loading="isUploading"
            :disabled="parsedData.length === 0"
          >
            確認上傳
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- 全域 AI 助理對話框 -->
    <!-- 全域 AI 助理對話框 -->
    <v-dialog 
      v-model="isAIAssistantDialogVisible" 
      max-width="1000px" 
      :fullscreen="$vuetify.display.smAndDown"
      scrollable
      transition="dialog-bottom-transition"
    >
      <v-card :rounded="$vuetify.display.smAndDown ? '0' : 'lg'">
        <v-card-title class="d-flex justify-space-between align-center px-4 py-3 bg-grey-lighten-4">
          <span class="text-h6 font-weight-bold">
            <v-icon color="primary" class="mr-2">mdi-robot-outline</v-icon>{{ projectName }} AI助理
          </span>
          <v-btn icon="mdi-close" variant="text" size="small" @click="isAIAssistantDialogVisible = false"></v-btn>
        </v-card-title>
        
        <v-card-text class="pa-0 d-flex flex-column" :style="{ height: $vuetify.display.smAndDown ? '100%' : '80vh' }">
          <SalesBotChat 
            v-if="isAIAssistantDialogVisible"
            :project-id="projectId"
            :unit-data="null"
            :all-parking-data="allDataForModal['車位'] || []"
            :all-units-data="allDataForModal['戶別'] || []"
            class="flex-grow-1"
          />
        </v-card-text>
      </v-card>
    </v-dialog>

    <v-dialog v-model="isParkingCanvasDialogVisible" fullscreen hide-overlay transition="dialog-bottom-transition" :eager="true">
      <v-card class="d-flex flex-column">
        <v-toolbar dark color="#f5f5f7" density="compact">
          <v-btn icon dark @click="isParkingCanvasDialogVisible = false">
            <v-icon>mdi-close</v-icon>
          </v-btn>
          <v-toolbar-title> {{ projectName }} 車位銷控</v-toolbar-title>
          <v-spacer></v-spacer>
          
        </v-toolbar>
        
        <div class="flex-grow-1" style="position: relative; overflow: hidden; background-color: #f0f2f5;">
          <v-overlay
            :model-value="isParkingCanvasLoading"
            class="align-center justify-center"
            persistent
            scrim="rgba(255, 255, 255, 0.7)"
          >
            <div class="text-center">
              <v-progress-circular indeterminate color="#008cff" size="64"></v-progress-circular>
              <p class="mt-4 text-body-1 text-black">正在載入車位資料...</p>
            </div>
          </v-overlay>
          
         <ParkingCanvas
            v-if="!isParkingCanvasLoading && activeParkingCanvasFloorPlan"
            :project-id="projectId"
            :floor-plan="activeParkingCanvasFloorPlan"
            :preview-mode="true" 
            :show-tools="true"
            v-model:display-mode="parkingCanvasDisplayMode" 
            :allow-import="false" 
            :allow-adjust-all="false" 
            :show-status-toggle="currentViewMode === 'sales'" 
            :context-mode="currentViewMode"
            :text-styles="textStyleStore.styles" 
            :status-colors="statusColorStore.colors" 
            @floor-switched="handleParkingCanvasFloorSwitch"
            @spots-changed="handleParkingCanvasSpotsChanged"
            style="height: 100%; width: 100%;"
          />
        </div>
      </v-card>
    </v-dialog>

    <v-dialog v-model="batchDialog.show" max-width="400" persistent>
      <v-card>
        <v-card-title class="bg-primary text-white">
          確認批次修改
        </v-card-title>
        
        <v-card-text class="pt-4">
          <div v-if="!batchDialog.loading">
            您即將把目前的 <b>{{ batchDialog.count }}</b> 筆戶別<br>
            的「優付」狀態全部修改為 
            <b :class="batchDialog.targetValue ? 'text-success' : 'text-grey'">
              {{ batchDialog.targetValue ? '開啟 (ON)' : '關閉 (OFF)' }}
            </b>。
            <br><br>
            <span class="text-caption text-grey">注意：此操作將影響當前列表中的所有篩選結果。</span>
          </div>

          <div v-else class="text-center py-4">
            <v-progress-circular
              indeterminate
              color="primary"
              size="48"
              class="mb-4"
            ></v-progress-circular>
            <div class="text-body-1 font-weight-bold">
              正在更新中... ({{ batchDialog.progress }} / {{ batchDialog.count }})
            </div>
          </div>
        </v-card-text>

        <v-card-actions v-if="!batchDialog.loading">
          <v-spacer></v-spacer>
          <v-btn color="grey-darken-1" variant="text" @click="batchDialog.show = false">取消</v-btn>
          <v-btn color="primary" variant="flat" @click="executeBatchUpdate">確認執行</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- 下載指定戶別資料（篩選後勾選戶別/欄位、拖曳排序後匯出 EXCEL） -->
    <UnitDataExportDialog
      v-model="isUnitExportDialogVisible"
      :items="unitExportItems"
      :columns="unitExportColumns"
      :project-name="projectName"
      :status-options="statusOptions"
      :price-mode="priceDisplayMode"
    />

    <!-- 統計分析面板 -->
    <AnalyticsPanel
      :show="isAnalyticsPanelVisible"
      @update:show="isAnalyticsPanelVisible = $event"
      :project-id="projectId"
      @update:projectId="switchProjectWithinAnalytics"
      :available-projects="availableProjects"
    />

    <div v-if="loading || error" class="status-overlay">
      <div v-if="loading" class="loading-container">
        <span class="loader"></span>
        <p class="loading-text">正在載入銷控資料...</p>
      </div>
      <p v-if="error" class="error-text">錯誤: {{ error }}</p>
    </div>

    <div v-if="isDevelopment && !loading" class="dev-cache-stats">
        </div>

  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed, nextTick, defineAsyncComponent, reactive, watch } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { onBeforeRouteLeave } from 'vue-router';
import { useSystemPresence } from '@/composables/useSystemPresence'; 

import {
  uploadHouseholds,
  getFloorPlansAPI,
  updateSalesData,
  updateSingleField,
  listenToQuotePlans,
  paymentProofApi
 } from '@/api';

import { useToast, POSITION } from 'vue-toastification';
import { useSalesDataStore } from '@/store/salesDataStore';
import { useProjectStore } from '@/store/projectStore';
import * as XLSX from 'xlsx-js-style';
import {
  LAND_PARCEL_SHEET_NAME,
  HOUSEHOLDS_SHEET_NAME,
  LAND_PARCEL_COLUMNS,
  LAND_PARCEL_HEADERS,
  landParcelToRow,
  rowToLandParcel,
} from '@/constants/landParcelColumns';
import UnitDetailModal from '@/components/UnitDetailModal.vue';
import MobileBottomSheet from '@/components/MobileBottomSheet.vue';
import RemarkNotesPanel from '@/components/RemarkNotesPanel.vue';
import { db } from '@/firebase';
import { doc as fsDoc, updateDoc as fsUpdateDoc, serverTimestamp as fsServerTimestamp } from 'firebase/firestore';
import { buildRemarksSummary, resolveDisplayNotes } from '@/utils/remarkNotes';
import { useQuoteStore } from '@/store/quoteStore';
import { useSlideViewer } from '@/composables/useSlideViewer';
import { useStickyHeaderOffset } from '@/composables/useStickyHeaderOffset';
import QuoteSidebar from '@/components/QuoteSidebar.vue';
import { useDisplay } from 'vuetify';
import UpdateControl from './UpdateControl.vue'; 
import ParkingCanvas from '@/components/ParkingCanvas.vue';
import CancelledPurchaseManager from '@/components/CancelledPurchaseManager.vue';
import SalesBotChat from '@/components/SalesBotChat.vue';
import AnalyticsPanel from '@/components/AnalyticsPanel.vue';
import ActivityMessageViewer from '@/components/ActivityMessageViewer.vue';
import UnitDataExportDialog from '@/components/UnitDataExportDialog.vue';
import SalesGridDownloadDialog from '@/components/SalesGridDownloadDialog.vue';
import PaymentRecordsPanel from '@/components/PaymentRecordsPanel.vue';
import { useUserStore } from '@/store/user';
import { useTextStyleStore } from '@/store/textStyleStore';
import { useStatusColorStore } from '@/store/statusColorStore'; 
import { mdiViewDashboardVariantOutline } from '@mdi/js';
import { normalizeSalespersons, formatSalespersons, salespersonsIntersect } from '@/utils/salespersonUtils';
import { getUnitTags, unitTagsToExportColumns, parseUnitTagsFromExport, unitTagsSortValue, collectTagSuggestions } from '@/utils/unitTags';
import { getUnitParkings, getParkingTransactionTotal, getParkingFloorTotal, getUnitTotalTransactionPrice, getUnitTotalFloorPrice } from '@/utils/analyticsCalculations';

// 2. 變數與狀態定義 (由上而下)
const showFilterPanel = ref(false);

// ✅ 列表模式：實測 thead 高度寫入 --sticky-header-height，讓上方合計列凍結在表頭正下方
const listViewRef = ref(null);
useStickyHeaderOffset(listViewRef);

// 合計列格子：凍結欄（col.fixed，例如戶別）要與資料列一樣套用 Vuetify 的凍結欄 class 與 left 位移，
// 否則橫向捲動時會錯位，且資料列的凍結格（sticky + z-index）往下捲時會蓋住合計格
const summaryCellClass = (col) => ({
  [`text-${col.align || 'start'}`]: true,
  'v-data-table-column--fixed': !!col.fixed,
  'v-data-table-column--last-fixed': !!col.lastFixed,
});
const summaryCellStyle = (col) => (col.fixed ? { left: `${col.fixedOffset || 0}px` } : undefined);
const isCancelledPurchaseDialogVisible = ref(false);
// 手機版「全部功能」底部面板的展開狀態（供選完項目後主動關閉用）
const isMoreMenuOpen = ref(false);
// 📱 [新增] 手機版「顯示設定」底部面板（價格顯示／網格內容切換）
const isDisplaySheetOpen = ref(false);

// 📱 [新增] 全部功能面板：分群圖示磚（原「更多」選單所有功能＋報價設定/車位銷控直達）
const moreToolGroups = computed(() => {
  // 報價模式：僅提供該模式桌面工具列對應的功能
  if (currentViewMode.value !== 'sales') {
    const tools = [
      { icon: 'mdi-car-side', label: '車位銷控', action: openParkingCanvasEditor },
      { icon: 'mdi-bullhorn-outline', label: '活動訊息', action: handleOpenActivityMessage },
      { icon: 'mdi-refresh', label: '重新載入', action: handleRefreshData },
    ];
    if (viewFormat.value === 'grid') {
      tools.push({ icon: 'mdi-file-pdf-box', label: '下載銷控表', action: () => { isGridDownloadDialogVisible.value = true; } });
    }
    return [{ title: '常用', tools }];
  }
  const common = [];
  if (canDirectEnterQuoteSettings.value) {
    common.push({ icon: 'mdi-file-document-edit-outline', label: '報價設定', action: goToQuoteSettingsDirect });
  }
  common.push(
    { icon: 'mdi-car-side', label: '車位銷控', action: openParkingCanvasEditor },
    { icon: 'mdi-car-cog', label: '車位管理', action: navigateToParkingControl },
    { icon: 'mdi-bullhorn-outline', label: '活動訊息', action: handleOpenActivityMessage },
    { icon: 'mdi-refresh', label: '重新載入', action: handleRefreshData },
  );
  return [
    { title: '常用', tools: common },
    {
      title: '資料',
      tools: [
        { icon: 'mdi-tray-arrow-down', label: '下載EXCEL', action: exportToExcel },
        { icon: 'mdi-table-arrow-down', label: '指定戶別下載', action: () => { isUnitExportDialogVisible.value = true; } },
        { icon: 'mdi-tray-arrow-up', label: '上傳EXCEL', action: () => { uploadDialog.value = true; } },
        { icon: 'mdi-table-pivot', label: '資料透視', action: () => { isSalesPivotVisible.value = true; } },
        { icon: 'mdi-chart-box', label: '統計分析', action: () => { isAnalyticsPanelVisible.value = true; } },
      ],
    },
    {
      title: '管理',
      tools: [
        { icon: 'mdi-account-cancel', label: '退戶記錄', action: () => { isCancelledPurchaseDialogVisible.value = true; } },
        { icon: 'mdi-robot-outline', label: 'AI 銷售助理', action: () => { isAIAssistantDialogVisible.value = true; } },
        { icon: 'mdi-cog-outline', label: '更多設定', action: navigateToSalesSettings },
      ],
    },
  ];
});

// 面板關閉後再執行動作：等 overlay 移除，避免關閉瞬間的點擊穿透誤觸下方網格（跳出戶別資訊）
function runMoreAction(action) {
  isMoreMenuOpen.value = false;
  setTimeout(() => action(), 150);
}

// 🖥️ [改版] 桌面版工具列「功能」下拉選單：原本 10+ 顆圖示按鈕整合為分群磚格，
// 工具列僅保留高頻操作（檢視/篩選/顯示切換/報價單/申報提醒/重新載入）
const isDesktopToolsMenuOpen = ref(false);
const desktopToolGroups = computed(() => {
  const dataTools = [];
  if (viewFormat.value === 'grid') {
    dataTools.push({
      icon: 'mdi-file-pdf-box',
      label: '下載銷控表PDF',
      disabled: filteredHouseholds.value.length === 0,
      action: () => { isGridDownloadDialogVisible.value = true; },
    });
  }
  const common = [];
  if (canDirectEnterQuoteSettings.value) {
    common.push({ icon: 'mdi-file-document-edit-outline', label: '報價單設定', action: goToQuoteSettingsDirect });
  }
  // 報價模式：僅提供該模式原工具列對應的功能
  if (currentViewMode.value !== 'sales') {
    common.push(
      { icon: 'mdi-car-side', label: '車位銷控', action: openParkingCanvasEditor },
      { icon: 'mdi-bullhorn-outline', label: '活動訊息', action: handleOpenActivityMessage },
    );
    const groups = [{ title: '常用', tools: common }];
    if (dataTools.length > 0) groups.push({ title: '資料', tools: dataTools });
    return groups;
  }
  common.push(
    { icon: 'mdi-car-side', label: '車位銷控', action: openParkingCanvasEditor },
    { icon: 'mdi-car-cog', label: '車位銷控管理', action: navigateToParkingControl },
    { icon: 'mdi-bullhorn-outline', label: '活動訊息', action: handleOpenActivityMessage },
  );
  dataTools.push(
    { icon: 'mdi-tray-arrow-down', label: '下載戶別EXCEL', action: exportToExcel },
    { icon: 'mdi-table-arrow-down', label: '指定戶別下載', action: () => { isUnitExportDialogVisible.value = true; } },
    { icon: 'mdi-tray-arrow-up', label: '上傳戶別EXCEL', action: () => { uploadDialog.value = true; } },
    { icon: 'mdi-table-pivot', label: '資料透視', action: () => { isSalesPivotVisible.value = true; } },
    { icon: 'mdi-chart-box', label: '統計分析', action: () => { isAnalyticsPanelVisible.value = true; } },
  );
  const manageTools = [
    { icon: 'mdi-account-cancel', label: '退戶記錄管理', action: () => { isCancelledPurchaseDialogVisible.value = true; } },
    { icon: 'mdi-robot-outline', label: 'AI 銷售助理', action: () => { isAIAssistantDialogVisible.value = true; } },
  ];
  if (canAccessCommission.value) {
    manageTools.push({ icon: 'mdi-cash-multiple', label: '請佣獎金', action: goToCommissionBonus });
  }
  manageTools.push({ icon: 'mdi-cog-outline', label: '更多設定', action: navigateToSalesSettings });
  return [
    { title: '常用', tools: common },
    { title: '資料', tools: dataTools },
    { title: '管理', tools: manageTools },
  ];
});

// 選單磚點擊：先收合選單再執行（避免導頁/開啟 dialog 時選單殘留）
function runDesktopTool(action) {
  isDesktopToolsMenuOpen.value = false;
  action();
}

// 1. 修改 filters 定義 (加入銷控專用欄位)
const filters = reactive({
  // --- ✅ [新增] 全域關鍵字搜尋（跨所有欄位，空白分隔為 AND） ---
  keyword: '',
  // --- 共用欄位 ---
  buildings: [], // ✅ 棟別 (多選勾選)
  floors: [],    // ✅ 樓層 (多選勾選)
  tags: [],      // ✅ 文字標籤 (多選，任一符合；'(無標籤)' 代表沒有標籤的戶別)
  areaMin: null,
  areaMax: null,
  totalPriceMin: null,
  totalPriceMax: null,
  unitPriceMin: null,
  unitPriceMax: null,
  terraceMin: null, // ✅ 新增：露臺坪數 最小
  terraceMax: null,  // ✅ 新增：露臺坪數 最大
  
  // --- ✅ [新增] 銷控模式專用欄位 ---
  statuses: [],        // 銷控狀態 (多選)
  salesperson: [],   // 銷售人員
  buyerName: '',       // 買方姓名
  depositDateStart: null, // 小訂日期 起
  depositDateEnd: null,   // 小訂日期 迄
  contractDateStart: null, // 簽約日期 起
  contractDateEnd: null,    // 簽約日期 迄


// --- ✅ [新增] 銷控模式專用 - 進階價格 ---
  floorPriceMin: null,      // 底價 Min
  floorPriceMax: null,      // 底價 Max
  floorUnitPriceMin: null,  // 底價單價 Min
  floorUnitPriceMax: null,  // 底價單價 Max
  transPriceMin: null,      // 成交總價 Min
  transPriceMax: null      // 成交總價 Max
  
});

// 2. ✅ [新增] 下拉選單選項 (依賴 salesParameters 和 salesPersonnel)
const statusOptions = computed(() => {
  return ['(無)', ...salesParameters.value.map(p => p.statusName)];
});

// ✅ [修改] 銷售人員篩選選項：改為取用目前戶別資料內實際出現過的銷售人員
//（而非人員設定名單，避免列出從未經手任何戶別的人員）
// 取全部戶別（salesHouseholds），網格/列表模式選項一致，不受住家/店面切換影響
const personnelOptions = computed(() => {
  const names = new Set();
  (salesHouseholds.value || []).forEach(u => {
    normalizeSalespersons(u.salesperson).forEach(n => names.add(n));
  });
  return Array.from(names).sort((a, b) =>
    String(a).localeCompare(String(b), 'zh-Hant', { numeric: true, sensitivity: 'base' })
  );
});

// ✅ [新增] 棟別篩選選項：取目前分類（住家/店面、報價模式是否隱藏已售）下所有棟別
// ✅ [新增] 文字標籤篩選選項：由全部戶別推導（含顏色與戶數），最前面加「(無標籤)」
const TAG_FILTER_EMPTY_LABEL = '(無標籤)';
const tagOptions = computed(() => {
  const suggestions = collectTagSuggestions(salesHouseholds.value || []);
  const emptyCount = (salesHouseholds.value || []).filter(u => getUnitTags(u).length === 0).length;
  return [
    { text: TAG_FILTER_EMPTY_LABEL, bgColor: '', textColor: '', count: emptyCount },
    ...suggestions,
  ];
});

const buildingOptions = computed(() => {
  const names = new Set();
  (tableItems.value || []).forEach(u => {
    if (u.building !== null && u.building !== undefined && u.building !== '') names.add(String(u.building));
  });
  return Array.from(names).sort((a, b) =>
    a.localeCompare(b, 'zh-Hant', { numeric: true, sensitivity: 'base' })
  );
});

// ✅ [新增] 樓層篩選選項：同上，由高樓層往低排序
const floorOptions = computed(() => {
  const floors = new Set();
  (tableItems.value || []).forEach(u => {
    if (u.floor !== null && u.floor !== undefined && u.floor !== '') floors.add(String(u.floor));
  });
  return Array.from(floors).sort((a, b) => {
    const na = parseInt(a, 10);
    const nb = parseInt(b, 10);
    if (!isNaN(na) && !isNaN(nb) && na !== nb) return nb - na;
    return b.localeCompare(a, 'zh-Hant', { numeric: true, sensitivity: 'base' });
  });
});

// 3. 修改 activeFilterCount (加入新欄位計數)
const activeFilterCount = computed(() => {
  let count = 0;
  if (filters.keyword && filters.keyword.trim()) count++;
  if (filters.buildings && filters.buildings.length > 0) count++;
  if (filters.floors && filters.floors.length > 0) count++;
  if (filters.tags && filters.tags.length > 0) count++;
  if (filters.areaMin || filters.areaMax) count++;
  if (filters.totalPriceMin || filters.totalPriceMax) count++;
  if (filters.unitPriceMin || filters.unitPriceMax) count++;
  
  if (filters.statuses && filters.statuses.length > 0) count++;
  if (filters.salesperson && filters.salesperson.length > 0) count++;
  if (filters.buyerName) count++;
  if (filters.depositDateStart || filters.depositDateEnd) count++;
  if (filters.contractDateStart || filters.contractDateEnd) count++;

  // ✅ [新增]
  if (filters.floorPriceMin || filters.floorPriceMax) count++;
  if (filters.floorUnitPriceMin || filters.floorUnitPriceMax) count++;
  if (filters.transPriceMin || filters.transPriceMax) count++;

  if (filters.terraceMin || filters.terraceMax) count++;
  
  return count;
});

// 4. 修改 clearFilters (重置新欄位)
const clearFilters = () => {
  filters.keyword = '';
  filters.buildings = [];
  filters.floors = [];
  filters.tags = [];
  filters.areaMin = null; filters.areaMax = null;
  filters.totalPriceMin = null; filters.totalPriceMax = null;
  filters.unitPriceMin = null; filters.unitPriceMax = null;
  
  filters.statuses = [];
  filters.salesperson = [];
  filters.buyerName = '';
  filters.depositDateStart = null; filters.depositDateEnd = null;
  filters.contractDateStart = null; filters.contractDateEnd = null;

  // ✅ [新增]
  filters.floorPriceMin = null; filters.floorPriceMax = null;
  filters.floorUnitPriceMin = null; filters.floorUnitPriceMax = null;
  filters.transPriceMin = null; filters.transPriceMax = null;
  filters.terraceMin = null; filters.terraceMax = null;

};

// ✅ [新增] 全域關鍵字搜尋輔助：把一筆 item 攤平成可搜尋字串（涵蓋所有欄位）
const buildSearchBlob = (item) => {
  const parts = [];
  const pushVal = (val) => {
    if (val === null || val === undefined || val === '') return;
    if (Array.isArray(val)) { parts.push(formatSalespersons(val)); return; }
    if (typeof val === 'object') {
      // Firestore Timestamp / Date → YYYY-MM-DD
      if (typeof val.toDate === 'function') { parts.push(val.toDate().toISOString().split('T')[0]); return; }
      if (val instanceof Date) { parts.push(val.toISOString().split('T')[0]); return; }
      return; // 其他物件（圖片陣列等）略過
    }
    parts.push(String(val));
  };
  // 依欄位定義攤平所有欄位
  for (const col of COLUMN_DEFINITIONS) pushVal(item[col.key]);
  // 補上衍生欄位（目前檢視模式狀態、車位編號）
  pushVal(item.status);
  pushVal(item.parking_spots);
  // ✅ [新增] 文字標籤：標籤文字納入搜尋
  for (const tag of getUnitTags(item)) parts.push(tag.text);
  return parts.join(' ').toLowerCase();
};

// 5. 修改 filteredTableItems (加入篩選邏輯)
// 全域關鍵字（空白分隔＝AND；全部符合才顯示）
const parseKeywordTokens = () => (filters.keyword || '')
  .trim()
  .toLowerCase()
  .split(/\s+/)
  .filter(Boolean);

// 單筆判斷抽成函式：filteredTableItems 與資料透視共用
// （資料透視 skipStatus=true，銷控狀態改由對話框內獨立勾選）
const itemMatchesFilters = (item, kwTokens, skipStatus = false) => {
    // 0. 全域關鍵字：跨所有欄位比對
    if (kwTokens.length > 0) {
      const blob = buildSearchBlob(item);
      if (!kwTokens.every(tk => blob.includes(tk))) return false;
    }

    // --- 基礎篩選 (共用) ---
    // 1. 棟別 (多選勾選)
    if (filters.buildings && filters.buildings.length > 0) {
      if (!filters.buildings.includes(String(item.building))) return false;
    }

    // 1-1. 樓層 (多選勾選)
    if (filters.floors && filters.floors.length > 0) {
      if (!filters.floors.includes(String(item.floor))) return false;
    }

    // ✅ [新增] 1-2. 文字標籤 (多選，任一符合；'(無標籤)' 代表沒有標籤)
    if (filters.tags && filters.tags.length > 0) {
      const itemTagTexts = getUnitTags(item).map(t => t.text);
      const wantEmpty = filters.tags.includes(TAG_FILTER_EMPTY_LABEL);
      const matchTag = filters.tags.some(t => itemTagTexts.includes(t)) || (wantEmpty && itemTagTexts.length === 0);
      if (!matchTag) return false;
    }

    // 2. 面積範圍
    const area = Number(item.area_house_ping) || 0;
    if (filters.areaMin !== null && filters.areaMin !== '' && area < Number(filters.areaMin)) return false;
    if (filters.areaMax !== null && filters.areaMax !== '' && area > Number(filters.areaMax)) return false;

    // 價格判斷 (略...保持原樣)
    let targetTotalPrice = 0;
    let targetUnitPrice = 0;
    if (currentViewMode.value === 'quote') {
       targetTotalPrice = Number(item.price_list_house_total) || 0;
       targetUnitPrice = Number(item.unit_price_list) || 0;
    } else {
       if (priceDisplayMode.value === 'list') {
          targetTotalPrice = Number(item.price_list_house_total) || 0;
          targetUnitPrice = Number(item.unit_price_list) || 0;
       } else if (priceDisplayMode.value === 'floor') {
          targetTotalPrice = Number(item.price_floor_house_total) || 0;
          targetUnitPrice = Number(item.unit_price_floor) || 0;
       } else { 
          targetTotalPrice = Number(item.price_transaction_house) || 0;
          targetUnitPrice = Number(item.unit_price_transaction) || 0;
       }
    }

    // 3. 總價範圍
    if (filters.totalPriceMin !== null && filters.totalPriceMin !== '' && targetTotalPrice < Number(filters.totalPriceMin)) return false;
    if (filters.totalPriceMax !== null && filters.totalPriceMax !== '' && targetTotalPrice > Number(filters.totalPriceMax)) return false;

    // 4. 單價範圍
    if (filters.unitPriceMin !== null && filters.unitPriceMin !== '' && targetUnitPrice < Number(filters.unitPriceMin)) return false;
    if (filters.unitPriceMax !== null && filters.unitPriceMax !== '' && targetUnitPrice > Number(filters.unitPriceMax)) return false;

    // --- ✅ [新增] 銷控模式專用篩選 ---
    if (currentViewMode.value !== 'quote') {
        
        // 5. 銷控狀態 (多選)
        if (!skipStatus && filters.statuses && filters.statuses.length > 0) {
            const hasEmptyFilter = filters.statuses.includes('(無)');
            const isStatusEmpty = item.status === null || item.status === undefined || item.status === '';
            const matchStatus = filters.statuses.includes(item.status) || (hasEmptyFilter && isStatusEmpty);
            if (!matchStatus) return false;
        }

        // 6. 銷售人員 (多選)：戶別 salesperson 已改為陣列，採交集判斷
        if (filters.salesperson && filters.salesperson.length > 0) {
            if (!salespersonsIntersect(item.salesperson, filters.salesperson)) return false;
        }

        // 7. 買方姓名 (模糊搜尋)
        if (filters.buyerName) {
            if (!item.buyerName || !item.buyerName.includes(filters.buyerName)) return false;
        }

        // 輔助函式：轉換 Timestamp 為 YYYY-MM-DD 字串
        const getDateStr = (ts) => {
            if (!ts) return null;
            if (ts instanceof Date) return ts.toISOString().split('T')[0];
            if (typeof ts.toDate === 'function') return ts.toDate().toISOString().split('T')[0];
            return null;
        };

        const depositDate = getDateStr(item.payment_deposit_date);
        const contractDate = getDateStr(item.payment_contract_date);

        // 8. 小訂日期範圍
        if (filters.depositDateStart && (!depositDate || depositDate < filters.depositDateStart)) return false;
        if (filters.depositDateEnd && (!depositDate || depositDate > filters.depositDateEnd)) return false;

        // 9. 簽約日期範圍
        if (filters.contractDateStart && (!contractDate || contractDate < filters.contractDateStart)) return false;
        if (filters.contractDateEnd && (!contractDate || contractDate > filters.contractDateEnd)) return false;
   // ✅ [新增] 10. 房屋底價範圍 (price_floor_house_total)
        const floorPrice = Number(item.price_floor_house_total) || 0;
        if (filters.floorPriceMin !== null && filters.floorPriceMin !== '' && floorPrice < Number(filters.floorPriceMin)) return false;
        if (filters.floorPriceMax !== null && filters.floorPriceMax !== '' && floorPrice > Number(filters.floorPriceMax)) return false;

        // ✅ [新增] 11. 底價單價範圍 (unit_price_floor)
        const floorUnitPrice = Number(item.unit_price_floor) || 0;
        if (filters.floorUnitPriceMin !== null && filters.floorUnitPriceMin !== '' && floorUnitPrice < Number(filters.floorUnitPriceMin)) return false;
        if (filters.floorUnitPriceMax !== null && filters.floorUnitPriceMax !== '' && floorUnitPrice > Number(filters.floorUnitPriceMax)) return false;

        // ✅ [新增] 12. 成交總價範圍 (total_transaction)
        const transPrice = Number(item.total_transaction) || 0;
        if (filters.transPriceMin !== null && filters.transPriceMin !== '' && transPrice < Number(filters.transPriceMin)) return false;
        if (filters.transPriceMax !== null && filters.transPriceMax !== '' && transPrice > Number(filters.transPriceMax)) return false;
    
    const terrace = Number(item.area_terrace_ping) || 0;
    if (filters.terraceMin !== null && filters.terraceMin !== '' && terrace < Number(filters.terraceMin)) return false;
    if (filters.terraceMax !== null && filters.terraceMax !== '' && terrace > Number(filters.terraceMax)) return false;

    }

    return true;
};

const filteredTableItems = computed(() => {
  const kwTokens = parseKeywordTokens();
  return tableItems.value.filter(item => itemMatchesFilters(item, kwTokens));
});

// ✅ [新增] 網格模式篩選：沿用列表相同的篩選邏輯，取得符合條件的戶別集合
const hasActiveFilters = computed(() => activeFilterCount.value > 0);
const matchedUnitIdSet = computed(() => new Set(filteredTableItems.value.map(i => i.unitId)));
const isUnitFilteredOut = (unit) => hasActiveFilters.value && !matchedUnitIdSet.value.has(unit.unitId);

// --- 資料透視：類 Google Sheet 資料透視（多列 / 多欄 / 多值 / 篩選器） ---
const isSalesPivotVisible = ref(false);
const pivotRowDims = ref(['building']);   // 列維度（可多個，依序分層）
const pivotColDims = ref(['status']);     // 欄維度（可多個，依序分層；空 = 只有值欄）
const PIVOT_EMPTY_LABEL = '（未填寫）';

// 常用維度置頂，其餘「所有資料欄位」（COLUMN_DEFINITIONS + 前端計算欄位）自動接在後面
const PIVOT_CURATED_DIMENSIONS = [
  { key: 'building', label: '棟別' },
  { key: 'floor', label: '樓層' },
  { key: 'propertyType', label: '物件類型' },
  { key: 'layout', label: '格局' },
  { key: 'status', label: '銷控狀態' },
  { key: 'salesperson', label: '銷售人員（每人分計）' },
  { key: 'contractType', label: '合約方式' },
  { key: 'isPreferredPayment', label: '優付' },
  { key: 'isFirstTimeBuyer', label: '是否首購' },
  { key: 'buyerGender', label: '性別' },
  { key: 'buyerMaritalStatus', label: '婚姻狀況' },
  { key: 'buyerOccupationIndustry', label: '行業別' },
  { key: 'buyerOccupationTitle', label: '職務' },
  { key: 'buyerPurchasePurpose', label: '購買用途' },
  { key: 'buyerHasPurchasedFuyu', label: '已購買富宇房子' },
  { key: 'buyerMailingAddressCity', label: '通訊地址-縣市' },
  { key: 'buyerMailingAddressDistrict', label: '通訊地址-區域' },
  { key: 'referrerName', label: '介紹人' },
  { key: 'depositMonth', label: '小訂月份' },
  { key: 'contractMonth', label: '簽約月份' },
  { key: 'constructionMethod', label: '興建方式' },
];
const PIVOT_EXCLUDED_KEYS = new Set([
  'salesImages',          // 圖片物件，無法作為維度
  'unitTags_bgColor',     // 文字標籤色碼，無分析意義（標籤文字 unitTags_text 仍可作維度）
  'unitTags_textColor',
  'svgName',              // SVG 圖檔名
  'driveFolderUrl',       // 資料夾連結
  'contractDrawingFolderUrl', // 合約分戶圖連結
  'salesStatus_backend',  // 與「銷控狀態」重複
]);
const pivotDimensionOptions = computed(() => {
  const curatedKeys = new Set(PIVOT_CURATED_DIMENSIONS.map(o => o.key));
  const rest = [...COLUMN_DEFINITIONS, ...UNIT_EXPORT_COMPUTED_COLUMNS]
    .filter(c => !curatedKeys.has(c.key) && !PIVOT_EXCLUDED_KEYS.has(c.key))
    .map(c => ({ key: c.key, label: c.title }));
  return [...PIVOT_CURATED_DIMENSIONS, ...rest];
});
// 已用於列/欄的維度不再重複提供
const pivotUsedDimKeys = computed(() => new Set([...pivotRowDims.value, ...pivotColDims.value]));
const pivotAddDimOptions = computed(() => pivotDimensionOptions.value.filter(o => !pivotUsedDimKeys.value.has(o.key)));
function pivotDimensionLabel(key) {
  return pivotDimensionOptions.value.find(o => o.key === key)?.label || key;
}
// 新增列/欄維度（autocomplete 選定即加入並清空）
const pivotRowDimToAdd = ref(null);
const pivotColDimToAdd = ref(null);
function addPivotDim(kind, key) {
  if (key) {
    const arr = kind === 'row' ? pivotRowDims : pivotColDims;
    if (!arr.value.includes(key)) arr.value.push(key);
  }
  nextTick(() => { pivotRowDimToAdd.value = null; pivotColDimToAdd.value = null; });
}

// --- 左側欄位清單：文字過濾 + 拖曳到列/欄/值/篩選器 ---
const pivotFieldSearch = ref('');
const pivotFieldList = computed(() => {
  const kw = (pivotFieldSearch.value || '').trim().toLowerCase();
  return pivotDimensionOptions.value
    .filter(o => !kw || o.label.toLowerCase().includes(kw) || o.key.toLowerCase().includes(kw))
    .map(o => ({
      ...o,
      numeric: PIVOT_BINNED_DIM_KEYS.has(o.key),
      used: pivotUsedDimKeys.value.has(o.key),
    }));
});
const pivotDragOverZone = ref('');
function onPivotFieldDragStart(e, key) {
  e.dataTransfer.setData('text/plain', key);
  e.dataTransfer.effectAllowed = 'copy';
}
function onPivotZoneDrop(zone, e) {
  pivotDragOverZone.value = '';
  const key = e.dataTransfer.getData('text/plain');
  if (!key) return;
  if (zone === 'row' || zone === 'col') {
    if (key === '__count__') return; // 戶數只能作為「值」
    addPivotDim(zone, key);
  } else if (zone === 'values') {
    if (key === '__count__') {
      pivotValues.value.push({ field: '__count__', mode: 'count' });
    } else if (PIVOT_BINNED_DIM_KEYS.has(key)) {
      pivotValues.value.push({ field: key, mode: 'sum' });
    } else {
      toast.warning('「值」僅支援數值欄位或戶數（計數）。', { position: POSITION.TOP_CENTER, timeout: 2500 });
    }
  } else if (zone === 'filter') {
    if (key === '__count__') return;
    addPivotFilter(key);
  }
}

// --- 值設定（可多個）：每個值 = 欄位 × 彙總方式；'__count__' = 戶數計數 ---
const pivotValues = ref([{ field: '__count__', mode: 'count' }]);
const pivotShowBoth = ref(true);    // 數值型值每格同時顯示戶數
const pivotCellPct = ref('none');   // 儲存格佔比基準：none|grand|row|col
const pivotShowChart = ref(false);  // 長條圖
const PIVOT_VALUE_MODE_OPTIONS = [
  { key: 'count', label: '計數（戶數）' },
  { key: 'sum', label: '加總' },
  { key: 'avg', label: '平均' },
  { key: 'max', label: '最大' },
  { key: 'min', label: '最小' },
];
const PIVOT_AGG_OPTIONS = PIVOT_VALUE_MODE_OPTIONS.filter(o => o.key !== 'count');
const PIVOT_CELL_PCT_OPTIONS = [
  { key: 'none', label: '不顯示' },
  { key: 'grand', label: '佔總計' },
  { key: 'row', label: '佔列合計' },
  { key: 'col', label: '佔欄合計' },
];
// 單價欄位的「平均」採加權計算：對應總價加總 ÷ 面積加總（與列表加總列相同邏輯）
const PIVOT_WEIGHTED_UNIT_PRICE = {
  unit_price_list: { totalKey: 'price_list_house_total', areaKey: 'area_house_ping' },
  unit_price_floor: { totalKey: 'price_floor_house_total', areaKey: 'area_house_ping' },
  unit_price_transaction: { totalKey: 'price_transaction_house', areaKey: 'area_house_ping' },
};
// 數值型欄位：可作為「值」計算欄位；作為維度時自動做區間分組（binning）
const PIVOT_BINNED_DIM_KEYS = new Set([
  'area_house_sqm', 'area_house_ping', 'area_main_sqm', 'area_main_ping',
  'area_ancillary_sqm', 'area_ancillary_ping', 'area_common_sqm', 'area_common_ping',
  'area_terrace_ping', 'common_area_ratio', 'land_share_sqm', 'land_share_ping',
  'price_list_house_only', 'price_list_terrace', 'price_list_terrace_unit', 'price_list_ancillary', 'price_list_house_total',
  'price_floor_house_only', 'price_floor_terrace', 'price_floor_ancillary', 'price_floor_house_total', 'price_transaction_house',
  'housePriceRatio', 'landPriceRatio', 'price_package_deal', 'price_package',
  'payment_deposit_amount', 'payment_supplement_amount', 'payment_contract_amount',
  'parking_trans_total', 'parking_floor_total', 'parking_count', 'total_transaction', 'total_floor', 'price_diff',
  'unit_price_list', 'unit_price_floor', 'unit_price_transaction',
  'paid_total', 'payment_ratio',
]);
// 值欄位選項：常用金額/面積置頂，其餘數值欄位接在後面
const pivotValueFieldOptions = computed(() => {
  const all = [...COLUMN_DEFINITIONS, ...UNIT_EXPORT_COMPUTED_COLUMNS];
  const priority = [
    'total_transaction', 'price_transaction_house', 'total_floor', 'price_floor_house_total', 'price_list_house_total',
    'parking_trans_total', 'parking_floor_total', 'price_diff',
    'paid_total', 'payment_ratio',
    'payment_deposit_amount', 'payment_supplement_amount', 'payment_contract_amount',
    'area_house_ping', 'area_terrace_ping',
    'unit_price_list', 'unit_price_floor', 'unit_price_transaction',
  ];
  const opts = [];
  for (const k of priority) {
    const c = all.find(x => x.key === k);
    if (c) opts.push({ key: k, label: c.title });
  }
  for (const c of all) {
    if (PIVOT_BINNED_DIM_KEYS.has(c.key) && !priority.includes(c.key)) opts.push({ key: c.key, label: c.title });
  }
  return opts;
});
// 值欄位選項（含「戶數」）與值標籤
const pivotValueFieldOptionsWithCount = computed(() => [
  { key: '__count__', label: '戶數（計數）' },
  ...pivotValueFieldOptions.value,
]);
function pivotValueFieldLabelOf(fieldKey) {
  if (fieldKey === '__count__') return '戶數';
  return pivotValueFieldOptions.value.find(o => o.key === fieldKey)?.label || fieldKey;
}
function pivotValueDefLabel(vd) {
  if (vd.field === '__count__') return '戶數';
  const agg = PIVOT_VALUE_MODE_OPTIONS.find(o => o.key === vd.mode)?.label || vd.mode;
  return `${pivotValueFieldLabelOf(vd.field)}·${agg}`;
}
// 新增/移除值
function addPivotValue() {
  pivotValues.value.push({ field: 'total_transaction', mode: 'sum' });
}
function removePivotValue(i) {
  if (pivotValues.value.length <= 1) return;
  pivotValues.value.splice(i, 1);
}
// 值欄位切換時自動校正彙總方式
function onPivotValueFieldChange(vd) {
  if (vd.field === '__count__') vd.mode = 'count';
  else if (vd.mode === 'count') vd.mode = 'sum';
}
// 任一值為單價欄位＋平均時顯示加權說明
const pivotWeightedHint = computed(() =>
  pivotValues.value.some(vd => vd.mode === 'avg' && !!PIVOT_WEIGHTED_UNIT_PRICE[vd.field])
);
// 是否有非計數的值（控制「同時顯示戶數」顯示）與可計佔比的值
const pivotHasNonCountValue = computed(() => pivotValues.value.some(vd => vd.field !== '__count__'));
function pivotValueDefPctable(vd) { return vd.field === '__count__' || vd.mode === 'sum'; }
const pivotAnyPctable = computed(() => pivotValues.value.some(pivotValueDefPctable));

// 數值格式化：千分位，>=100 取整數、<100 保留一位小數
function formatPivotValue(v) {
  if (v === null || v === undefined || !isFinite(v)) return '—';
  const rounded = Math.abs(v) >= 100 ? Math.round(v) : Math.round(v * 10) / 10;
  return rounded.toLocaleString('en-US');
}

// 數值維度的區間分組：以「漂亮的」級距自動分約 8 組（如 2,000～2,500）
function makePivotBinner(items, dimKey) {
  const nums = [];
  for (const it of items) {
    const raw = it[dimKey];
    const v = Number(raw);
    if (raw !== null && raw !== undefined && raw !== '' && isFinite(v)) nums.push(v);
  }
  if (!nums.length) {
    return { getValues: () => [PIVOT_EMPTY_LABEL], sortKeys: (keys) => [...keys] };
  }
  const lo = Math.min(...nums);
  const hi = Math.max(...nums);
  const rawStep = (hi - lo) / 8 || Math.abs(lo) / 8 || 1;
  const pow = Math.pow(10, Math.floor(Math.log10(rawStep)));
  const step = [1, 2, 2.5, 5, 10].map(m => m * pow).find(s => s >= rawStep) || rawStep;
  const start = Math.floor(lo / step) * step;
  const fmtEdge = (n) => Number(n.toFixed(2)).toLocaleString('en-US');
  const labelOfIdx = (idx) => `${fmtEdge(start + idx * step)}～${fmtEdge(start + (idx + 1) * step)}`;
  const orderMap = new Map();
  for (let i = 0; start + i * step <= hi; i++) orderMap.set(labelOfIdx(i), i);
  return {
    getValues: (item) => {
      const raw = item[dimKey];
      const v = Number(raw);
      if (raw === null || raw === undefined || raw === '' || !isFinite(v)) return [PIVOT_EMPTY_LABEL];
      return [labelOfIdx(Math.floor((v - start) / step))];
    },
    sortKeys: (keys) => [...keys].sort((a, b) => (orderMap.get(a) ?? Number.MAX_SAFE_INTEGER) - (orderMap.get(b) ?? Number.MAX_SAFE_INTEGER)),
  };
}
// 數值維度「原值直列」：每個實際數值一列（千分位顯示），依數值大小排序
function makeNumericRawGetter(dimKey) {
  return {
    getValues: (item) => {
      const raw = item[dimKey];
      const v = Number(raw);
      if (raw === null || raw === undefined || raw === '' || !isFinite(v)) return [PIVOT_EMPTY_LABEL];
      return [Number(v.toFixed(2)).toLocaleString('en-US')];
    },
    sortKeys: (keys) => [...keys].sort((a, b) => {
      const na = Number(String(a).replace(/,/g, ''));
      const nb = Number(String(b).replace(/,/g, ''));
      const aNum = a !== PIVOT_EMPTY_LABEL && isFinite(na);
      const bNum = b !== PIVOT_EMPTY_LABEL && isFinite(nb);
      if (aNum && bNum) return na - nb;
      if (aNum) return -1; // 未填寫排最後
      if (bNum) return 1;
      return 0;
    }),
  };
}
// 是否啟用數值區間分組（預設關閉＝原值直列為主，可切換）
const pivotNumericBinning = ref(false);
const pivotHasNumericDim = computed(() =>
  [...pivotRowDims.value, ...pivotColDims.value].some(k => PIVOT_BINNED_DIM_KEYS.has(k))
);
// 依維度取得「取值 + 鍵值排序」：數值欄位依開關走原值直列或區間分組，其餘走一般取值
function makePivotDimGetter(items, dimKey) {
  if (PIVOT_BINNED_DIM_KEYS.has(dimKey)) {
    return pivotNumericBinning.value ? makePivotBinner(items, dimKey) : makeNumericRawGetter(dimKey);
  }
  return {
    getValues: (item) => getPivotValues(item, dimKey),
    sortKeys: (keys, getTotal) => sortPivotKeys(keys, dimKey, getTotal),
  };
}

// Timestamp/Date → 台灣時區日期字串（fullDate=false 取 'yyyy-MM' 月份）
const pivotTsToDateStr = (ts, fullDate = true) => {
  if (!ts) return PIVOT_EMPTY_LABEL;
  const d = ts instanceof Date ? ts : (typeof ts.toDate === 'function' ? ts.toDate() : new Date(ts));
  if (isNaN(d.getTime())) return PIVOT_EMPTY_LABEL;
  const str = d.toLocaleDateString('sv-SE', { timeZone: 'Asia/Taipei' });
  return fullDate ? str : str.slice(0, 7);
};
// 日期型欄位（值為 Timestamp/Date，顯示為 yyyy-MM-dd）
const PIVOT_DATE_KEYS = new Set(['payment_deposit_date', 'payment_supplement_date', 'payment_contract_date', 'buyerDateOfBirth']);

// 取得戶別在某維度下的值（陣列；銷售人員/車位/方案等一戶多值時，各計一次）
function getPivotValues(item, dimKey) {
  switch (dimKey) {
    case 'salesperson': {
      const list = normalizeSalespersons(item.salesperson);
      return list.length ? list : [PIVOT_EMPTY_LABEL];
    }
    case 'status':
      return [(item.status === null || item.status === undefined || item.status === '') ? PIVOT_EMPTY_LABEL : String(item.status)];
    case 'floor':
      return [(item.floor === null || item.floor === undefined || item.floor === '') ? PIVOT_EMPTY_LABEL : `${item.floor}F`];
    case 'depositMonth':
      return [pivotTsToDateStr(item.payment_deposit_date, false)];
    case 'contractMonth':
      return [pivotTsToDateStr(item.payment_contract_date, false)];
    case 'parking_spots': {
      // 車位編號：'A1,A2' → 每個車位各計一次
      const list = String(item.parking_spots || '').split(',').map(s => s.trim()).filter(Boolean);
      return list.length ? list : [PIVOT_EMPTY_LABEL];
    }
    default: {
      const v = item[dimKey];
      if (PIVOT_DATE_KEYS.has(dimKey)) return [pivotTsToDateStr(v)];
      if (Array.isArray(v)) {
        // 陣列欄位（可選方案名稱、userKey 等）：每個值各計一次
        const list = v.map(x => String(x).trim()).filter(Boolean);
        return list.length ? list : [PIVOT_EMPTY_LABEL];
      }
      if (typeof v === 'boolean') return [v ? '是' : '否'];
      if (v !== null && typeof v === 'object' && typeof v.toDate === 'function') return [pivotTsToDateStr(v)];
      return (v === null || v === undefined || v === '') ? [PIVOT_EMPTY_LABEL] : [String(v)];
    }
  }
}

// 資料透視的狀態篩選：開啟對話框時預設帶入篩選面板目前的狀態勾選（未勾選則全選），可在對話框內獨立調整
const pivotStatuses = ref([]);
// 住家/店面勾選：資料透視一律納入全部資料，不受網格模式目前的住家/店面切換影響，開啟時預設全選
const PIVOT_PROPERTY_TYPE_OPTIONS = ['住家', '店面'];
const pivotPropertyTypes = ref([...PIVOT_PROPERTY_TYPE_OPTIONS]);
watch(isSalesPivotVisible, (open) => {
  if (!open) return;
  pivotStatuses.value = (filters.statuses && filters.statuses.length > 0)
    ? [...filters.statuses]
    : [...statusOptions.value];
  pivotPropertyTypes.value = [...PIVOT_PROPERTY_TYPE_OPTIONS];
  restorePivotSettings(); // 還原上次的維度/值設定（依建案記憶）
});

// 分析資料來源（基底）：全部戶別（住家+店面，與網格目前顯示的類型無關），
// 直接沿用「下載指定戶別資料」的 unitExportItems（含前端計算欄位、車位編號、方案名稱），
// 跟隨列表目前篩選（關鍵字/棟別/樓層/價格等）；住家/店面與銷控狀態改用對話框內的勾選
const pivotBaseItems = computed(() => {
  const kwTokens = parseKeywordTokens();
  return unitExportItems.value.filter(item => {
    const propertyType = item.layout === '店面' ? '店面' : '住家';
    if (!pivotPropertyTypes.value.includes(propertyType)) return false;
    if (!itemMatchesFilters(item, kwTokens, true)) return false;
    const isStatusEmpty = item.status === null || item.status === undefined || item.status === '';
    return pivotStatuses.value.includes(item.status) || (isStatusEmpty && pivotStatuses.value.includes('(無)'));
  });
});

// --- 篩選器（類 Google Sheet：任選欄位、勾選要保留的值）---
const pivotFilters = ref([]); // [{ field, selected: [] }]（selected 空 = 不限）
const pivotFilterFieldToAdd = ref(null);
function pivotFilterValuesOf(item, field) {
  return PIVOT_BINNED_DIM_KEYS.has(field)
    ? makeNumericRawGetter(field).getValues(item)
    : getPivotValues(item, field);
}
function addPivotFilter(fieldKey) {
  if (fieldKey && !pivotFilters.value.some(f => f.field === fieldKey)) {
    pivotFilters.value.push({ field: fieldKey, selected: [] });
  }
  nextTick(() => { pivotFilterFieldToAdd.value = null; });
}
function removePivotFilter(i) { pivotFilters.value.splice(i, 1); }
// 每個篩選器的可勾選值（自基底資料取 distinct，依欄位型別排序）
const pivotFilterOptionsMap = computed(() => {
  const map = {};
  for (const f of pivotFilters.value) {
    const set = new Set();
    for (const it of pivotBaseItems.value) pivotFilterValuesOf(it, f.field).forEach(v => set.add(v));
    const keys = [...set];
    map[f.field] = PIVOT_BINNED_DIM_KEYS.has(f.field)
      ? makeNumericRawGetter(f.field).sortKeys(keys)
      : sortPivotKeys(keys, f.field, () => 0);
  }
  return map;
});
// 最終資料 = 基底 + 所有啟用中的篩選器（每個篩選器內為 OR、篩選器之間為 AND）
const pivotSourceItems = computed(() => {
  const active = pivotFilters.value
    .filter(f => f.selected.length > 0)
    .map(f => ({ field: f.field, sel: new Set(f.selected) }));
  if (!active.length) return pivotBaseItems.value;
  return pivotBaseItems.value.filter(item =>
    active.every(f => pivotFilterValuesOf(item, f.field).some(v => f.sel.has(v)))
  );
});

// 維度鍵值排序：日期/月份依時間序、樓層高→低（與網格一致）、其餘依數量多→少（同數量依筆劃/字典序）
function sortPivotKeys(keys, dimKey, getTotal) {
  if (dimKey === 'depositMonth' || dimKey === 'contractMonth' || PIVOT_DATE_KEYS.has(dimKey)) return [...keys].sort();
  if (dimKey === 'floor') {
    return [...keys].sort((a, b) => {
      const na = parseInt(a, 10);
      const nb = parseInt(b, 10);
      if (!isNaN(na) && !isNaN(nb) && na !== nb) return nb - na;
      if (!isNaN(na) && isNaN(nb)) return -1; // 未填寫排最後
      if (isNaN(na) && !isNaN(nb)) return 1;
      return String(a).localeCompare(String(b), 'zh-Hant', { numeric: true });
    });
  }
  return [...keys].sort((a, b) => (getTotal(b) - getTotal(a)) || String(a).localeCompare(String(b), 'zh-Hant'));
}

const PIVOT_SEP = '|#|';       // 組合鍵層級分隔
const PIVOT_CELL_SEP = '||CELL||'; // 下鑽 key 的列/欄分隔
const pivotMatrix = computed(() => {
  const items = pivotSourceItems.value;
  const rowDims = pivotRowDims.value;
  const colDims = pivotColDims.value;
  const useCol = colDims.length > 0;
  const valueDefs = pivotValues.value.length ? pivotValues.value : [{ field: '__count__', mode: 'count' }];

  // 儲存格累加器：戶數 + 各值統計 + 明細（供下鑽）
  const newStats = () => valueDefs.map(() => ({ sum: 0, n: 0, min: Infinity, max: -Infinity, wTotal: 0, wArea: 0 }));
  const newCell = () => ({ count: 0, items: [], stats: newStats() });
  const accumulate = (cell, item) => {
    cell.count++;
    cell.items.push(item);
    valueDefs.forEach((vd, i) => {
      if (vd.field === '__count__') return;
      const st = cell.stats[i];
      const w = vd.mode === 'avg' ? PIVOT_WEIGHTED_UNIT_PRICE[vd.field] : null;
      if (w) {
        const t = Number(item[w.totalKey]);
        const a = Number(item[w.areaKey]);
        if (isFinite(t)) st.wTotal += t;
        if (isFinite(a)) st.wArea += a;
      }
      const raw = item[vd.field];
      const v = Number(raw);
      if (raw !== null && raw !== undefined && raw !== '' && isFinite(v)) {
        st.sum += v;
        st.n++;
        if (v < st.min) st.min = v;
        if (v > st.max) st.max = v;
      }
    });
  };
  // 儲存格第 i 個值：計數→戶數；單價平均→加權（總價加總/面積加總）；其餘依彙總方式
  const cellValueAt = (cell, i) => {
    const vd = valueDefs[i];
    if (vd.field === '__count__') return cell.count;
    const st = cell.stats[i];
    if (vd.mode === 'avg' && PIVOT_WEIGHTED_UNIT_PRICE[vd.field]) {
      return st.wArea > 0 ? st.wTotal / st.wArea : null;
    }
    switch (vd.mode) {
      case 'sum': return st.sum;
      case 'avg': return st.n ? st.sum / st.n : null;
      case 'max': return st.n ? st.max : null;
      case 'min': return st.n ? st.min : null;
      default: return cell.count;
    }
  };

  const rowGetters = rowDims.map(d => makePivotDimGetter(items, d));
  const colGetters = colDims.map(d => makePivotDimGetter(items, d));

  // 多維組合展開（多值維度 → 笛卡兒積，各組合各計一次）
  const combosOf = (getters, item) => {
    let combos = [[]];
    for (const g of getters) {
      const vals = g.getValues(item);
      const next = [];
      for (const base of combos) for (const v of vals) next.push([...base, v]);
      combos = next;
    }
    return combos;
  };

  const rowMap = new Map();   // rowKey -> { parts, totalCell, cols: Map(colKey -> cell) }
  const colMap = new Map();   // colKey -> { parts, cell }
  const grandCell = newCell();

  for (const item of items) {
    const rowCombos = rowDims.length ? combosOf(rowGetters, item) : [['全部']];
    const colCombos = useCol ? combosOf(colGetters, item) : [['']];
    for (const rParts of rowCombos) {
      const rKey = rParts.join(PIVOT_SEP);
      let row = rowMap.get(rKey);
      if (!row) { row = { parts: rParts, totalCell: newCell(), cols: new Map() }; rowMap.set(rKey, row); }
      for (const cParts of colCombos) {
        const cKey = cParts.join(PIVOT_SEP);
        let col = colMap.get(cKey);
        if (!col) { col = { parts: cParts, cell: newCell() }; colMap.set(cKey, col); }
        let cc = row.cols.get(cKey);
        if (!cc) { cc = newCell(); row.cols.set(cKey, cc); }
        accumulate(cc, item);
        accumulate(col.cell, item);
        accumulate(row.totalCell, item);
        accumulate(grandCell, item);
      }
    }
  }

  // 階層排序：逐層依各維度的鍵值排序規則（數量權重取該層合計戶數）
  const buildLevelOrders = (getters, entries) => getters.map((g, li) => {
    const totals = new Map();
    for (const e of entries) {
      const v = e.parts[li];
      totals.set(v, (totals.get(v) || 0) + e.count);
    }
    const sorted = g.sortKeys([...totals.keys()], k => totals.get(k) || 0);
    return new Map(sorted.map((k, i) => [k, i]));
  });
  const cmpByLevels = (orderMaps) => (aParts, bParts) => {
    for (let i = 0; i < orderMaps.length; i++) {
      const d = (orderMaps[i].get(aParts[i]) ?? 0) - (orderMaps[i].get(bParts[i]) ?? 0);
      if (d) return d;
    }
    return 0;
  };
  const rowOrders = buildLevelOrders(rowGetters, [...rowMap.values()].map(r => ({ parts: r.parts, count: r.totalCell.count })));
  const colOrders = buildLevelOrders(colGetters, [...colMap.values()].map(c => ({ parts: c.parts, count: c.cell.count })));
  const rowKeys = [...rowMap.keys()].sort((a, b) => cmpByLevels(rowOrders)(rowMap.get(a).parts, rowMap.get(b).parts));
  const colKeys = useCol
    ? [...colMap.keys()].sort((a, b) => cmpByLevels(colOrders)(colMap.get(a).parts, colMap.get(b).parts))
    : [''];

  // 佔比欄：以第一個可計佔比的值（戶數或加總）為準
  const pctValueIndex = valueDefs.findIndex(vd => vd.field === '__count__' || vd.mode === 'sum');
  const grandValues = valueDefs.map((vd, i) => cellValueAt(grandCell, i));
  const grandPctDenom = pctValueIndex >= 0 ? (grandValues[pctValueIndex] || 0) : 0;

  const rows = rowKeys.map(rKey => {
    const row = rowMap.get(rKey);
    const cells = {};
    for (const cKey of colKeys) {
      const cc = row.cols.get(cKey);
      cells[cKey] = {
        count: cc ? cc.count : 0,
        values: valueDefs.map((vd, i) => cc ? cellValueAt(cc, i) : (vd.field === '__count__' || vd.mode === 'sum' ? 0 : null)),
      };
    }
    const totalValues = valueDefs.map((vd, i) => cellValueAt(row.totalCell, i));
    return {
      key: rKey,
      parts: row.parts,
      cells,
      total: row.totalCell.count,
      totalValues,
      pct: (pctValueIndex >= 0 && grandPctDenom)
        ? Math.round(((totalValues[pctValueIndex] || 0) / grandPctDenom) * 1000) / 10
        : null,
    };
  });

  const colTotals = {};
  for (const cKey of colKeys) {
    const col = colMap.get(cKey);
    colTotals[cKey] = {
      count: col ? col.cell.count : 0,
      values: valueDefs.map((vd, i) => col ? cellValueAt(col.cell, i) : null),
    };
  }

  // 下鑽明細：儲存格 → 戶別清單
  const itemsByCell = new Map();
  for (const rKey of rowKeys) {
    const row = rowMap.get(rKey);
    itemsByCell.set(`${rKey}${PIVOT_CELL_SEP}__row__`, row.totalCell.items);
    for (const cKey of colKeys) {
      const cc = row.cols.get(cKey);
      if (cc) itemsByCell.set(`${rKey}${PIVOT_CELL_SEP}${cKey}`, cc.items);
    }
  }
  for (const cKey of colKeys) {
    const col = colMap.get(cKey);
    if (col) itemsByCell.set(`__col__${PIVOT_CELL_SEP}${cKey}`, col.cell.items);
  }
  itemsByCell.set('__grand__', grandCell.items);

  return {
    rows,
    colKeys,
    colTotals,
    useCol,
    valueDefs,
    rowDimLabels: rowDims.length ? rowDims.map(pivotDimensionLabel) : ['全部'],
    itemCount: items.length,
    grand: { count: grandCell.count, values: grandValues },
    pctValueIndex,
    itemsByCell,
  };
});
// 是否有「多值分計」（銷售人員/車位編號/可選方案等一戶多值會分別計入，總計會大於戶數）
const PIVOT_MULTI_VALUE_KEYS = new Set(['salesperson', 'salespersonUserKey', 'parking_spots', 'availablePlans']);
const pivotHasPersonCount = computed(() =>
  [...pivotRowDims.value, ...pivotColDims.value].some(k => PIVOT_MULTI_VALUE_KEYS.has(k))
);
// --- 資料透視表欄位排序：點表頭切換 升冪 → 降冪 → 回復預設 ---
// spec: { type: 'name'|'cell'|'total', li?, cKey?, vi?, dir }
const pivotSort = ref(null);
watch([pivotRowDims, pivotColDims, pivotValues], () => { pivotSort.value = null; }, { deep: true });
function pivotSortSpecEquals(a, b) {
  return !!a && !!b && a.type === b.type && a.li === b.li && a.cKey === b.cKey && a.vi === b.vi;
}
function togglePivotSort(spec) {
  const cur = pivotSort.value;
  if (cur && pivotSortSpecEquals(cur, spec)) {
    pivotSort.value = cur.dir === 'asc' ? { ...spec, dir: 'desc' } : null; // 第三次點擊回復預設排序
  } else {
    // 名稱欄預設 A→Z，數值欄預設大→小
    pivotSort.value = { ...spec, dir: spec.type === 'name' ? 'asc' : 'desc' };
  }
}
function pivotSortActive(spec) {
  return !!pivotSort.value && pivotSortSpecEquals(pivotSort.value, spec);
}
function pivotSortIcon(spec) {
  if (!pivotSortActive(spec)) return 'mdi-unfold-more-horizontal';
  return pivotSort.value.dir === 'asc' ? 'mdi-arrow-up' : 'mdi-arrow-down';
}
const sortedPivotRows = computed(() => {
  const spec = pivotSort.value;
  const rows = pivotMatrix.value.rows;
  if (!spec) return rows;
  const mul = spec.dir === 'asc' ? 1 : -1;
  return [...rows].sort((a, b) => {
    if (spec.type === 'name') {
      const an = a.parts[spec.li] ?? '';
      const bn = b.parts[spec.li] ?? '';
      const dk = pivotRowDims.value[spec.li];
      if (dk === 'floor') {
        const na = parseInt(an, 10);
        const nb = parseInt(bn, 10);
        if (!isNaN(na) && !isNaN(nb)) return (na - nb) * mul;
      }
      // 數值維度（原值或區間）：去千分位後依數值排序（區間取起始值）
      if (PIVOT_BINNED_DIM_KEYS.has(dk)) {
        const na = parseFloat(String(an).replace(/,/g, ''));
        const nb = parseFloat(String(bn).replace(/,/g, ''));
        if (isFinite(na) && isFinite(nb)) return (na - nb) * mul;
      }
      // 月份為 yyyy-MM 字串，字典序即時間序
      return String(an).localeCompare(String(bn), 'zh-Hant', { numeric: true }) * mul;
    }
    const av = spec.type === 'total' ? (a.totalValues[spec.vi] ?? -Infinity) : (a.cells[spec.cKey]?.values[spec.vi] ?? -Infinity);
    const bv = spec.type === 'total' ? (b.totalValues[spec.vi] ?? -Infinity) : (b.cells[spec.cKey]?.values[spec.vi] ?? -Infinity);
    return ((av - bv) * mul) || String(a.key).localeCompare(String(b.key), 'zh-Hant');
  });
});

// --- 儲存格顯示（row.cells[cKey] = { count, values[] }）---
function pivotColLabel(cKey) {
  return String(cKey).split(PIVOT_SEP).filter(Boolean).join(' / ');
}
function pivotFormatValueAt(vd, v) {
  if (vd.field === '__count__') return String(v ?? 0);
  return formatPivotValue(v);
}
function pivotCellMain(row, cKey, vi) {
  return pivotFormatValueAt(pivotMatrix.value.valueDefs[vi], row.cells[cKey]?.values[vi]);
}
// 儲存格副行：戶數（數值型值）＋ 佔比（依基準）
function pivotCellSub(row, cKey, vi) {
  const vd = pivotMatrix.value.valueDefs[vi];
  const parts = [];
  if (vd.field !== '__count__' && pivotShowBoth.value) parts.push(`${row.cells[cKey]?.count || 0}戶`);
  const pct = pivotCellPctText(row, cKey, vi);
  if (pct) parts.push(pct);
  return parts.join('・');
}
function pivotCellPctText(row, cKey, vi) {
  if (pivotCellPct.value === 'none') return '';
  const m = pivotMatrix.value;
  const vd = m.valueDefs[vi];
  if (!pivotValueDefPctable(vd)) return ''; // 平均/最大/最小無佔比意義
  const metric = row.cells[cKey]?.values[vi] || 0;
  let denom = 0;
  if (pivotCellPct.value === 'grand') denom = m.grand.values[vi] || 0;
  else if (pivotCellPct.value === 'row') denom = row.totalValues[vi] || 0;
  else if (pivotCellPct.value === 'col') denom = m.colTotals[cKey]?.values[vi] || 0;
  if (!denom) return '';
  return `${Math.round((metric / denom) * 1000) / 10}%`;
}
// 總計/佔比欄凍結在表格右緣：依值欄位數計算各欄的 right 偏移（佔比 60px、每個總計欄 100px）
const PIVOT_PCT_COL_W = 60;
const PIVOT_TOTAL_COL_W = 100;
function pivotStickyPctStyle(bg) {
  const style = { position: 'sticky', right: '0', minWidth: `${PIVOT_PCT_COL_W}px`, maxWidth: `${PIVOT_PCT_COL_W}px`, backgroundColor: bg, zIndex: 3 };
  if (!pivotMatrix.value.useCol) style.boxShadow = '-3px 0 4px rgba(0,0,0,0.08)';
  return style;
}
function pivotStickyTotalStyle(vi, bg) {
  const n = pivotMatrix.value.valueDefs.length;
  const right = PIVOT_PCT_COL_W + (n - 1 - vi) * PIVOT_TOTAL_COL_W;
  const style = { position: 'sticky', right: `${right}px`, minWidth: `${PIVOT_TOTAL_COL_W}px`, maxWidth: `${PIVOT_TOTAL_COL_W}px`, backgroundColor: bg, zIndex: 3 };
  if (vi === 0) style.boxShadow = '-3px 0 4px rgba(0,0,0,0.08)';
  return style;
}
function pivotStickyTotalGroupStyle(bg) {
  return { position: 'sticky', right: `${PIVOT_PCT_COL_W}px`, backgroundColor: bg, zIndex: 3, boxShadow: '-3px 0 4px rgba(0,0,0,0.08)' };
}
function pivotRowTotalMain(row, vi) {
  return pivotFormatValueAt(pivotMatrix.value.valueDefs[vi], row.totalValues[vi]);
}
function pivotColTotalMain(cKey, vi) {
  const m = pivotMatrix.value;
  return pivotFormatValueAt(m.valueDefs[vi], m.colTotals[cKey]?.values[vi]);
}
function pivotGrandMain(vi) {
  const m = pivotMatrix.value;
  return pivotFormatValueAt(m.valueDefs[vi], m.grand.values[vi]);
}

// --- 下鑽明細：點儲存格看戶別清單 ---
const isPivotDrillVisible = ref(false);
const pivotDrillTitle = ref('');
const pivotDrillItems = ref([]);
// 下鑽清單顯示的值欄位：第一個非計數的值
const pivotDrillValueDef = computed(() => pivotValues.value.find(vd => vd.field !== '__count__') || null);
function openPivotDrill(rowKey, colKey) {
  const m = pivotMatrix.value;
  const partsLabel = k => String(k).split(PIVOT_SEP).filter(Boolean).join(' / ');
  let key;
  let title;
  if (rowKey === '__grand__') { key = '__grand__'; title = '全部'; }
  else if (colKey === '__row__') { key = `${rowKey}${PIVOT_CELL_SEP}__row__`; title = partsLabel(rowKey); }
  else if (rowKey === '__col__') { key = `__col__${PIVOT_CELL_SEP}${colKey}`; title = partsLabel(colKey) || '全部'; }
  else { key = `${rowKey}${PIVOT_CELL_SEP}${colKey}`; title = [partsLabel(rowKey), partsLabel(colKey)].filter(Boolean).join(' × '); }
  const list = m.itemsByCell.get(key) || [];
  // 多值維度同一戶會重複，依戶別去重
  const seen = new Set();
  pivotDrillItems.value = list.filter(it => {
    if (seen.has(it.unitId)) return false;
    seen.add(it.unitId);
    return true;
  });
  pivotDrillTitle.value = title || '全部';
  isPivotDrillVisible.value = true;
}
function openUnitFromDrill(item) {
  openUnitDetail(item);
}

// --- 記住透視設定（依建案，localStorage）---
const pivotSettingsKey = computed(() => `salesPivotSettings_${projectId.value || 'default'}`);
let isRestoringPivotSettings = false;
function savePivotSettings() {
  if (isRestoringPivotSettings) return;
  try {
    localStorage.setItem(pivotSettingsKey.value, JSON.stringify({
      v: 2,
      rowDims: pivotRowDims.value,
      colDims: pivotColDims.value,
      values: pivotValues.value,
      filters: pivotFilters.value.map(f => ({ field: f.field, selected: f.selected })),
      showBoth: pivotShowBoth.value,
      cellPct: pivotCellPct.value,
      showChart: pivotShowChart.value,
      numericBinning: pivotNumericBinning.value,
    }));
  } catch (e) { /* localStorage 不可用時靜默略過 */ }
}
function restorePivotSettings() {
  try {
    const raw = localStorage.getItem(pivotSettingsKey.value);
    if (!raw) return;
    const s = JSON.parse(raw);
    isRestoringPivotSettings = true;
    const validDim = k => pivotDimensionOptions.value.some(o => o.key === k);
    const validValueField = k => k === '__count__' || pivotValueFieldOptions.value.some(o => o.key === k);
    if (Array.isArray(s.rowDims)) pivotRowDims.value = s.rowDims.filter(validDim);
    else if (validDim(s.rowDim)) pivotRowDims.value = [s.rowDim]; // 舊版設定相容
    if (Array.isArray(s.colDims)) pivotColDims.value = s.colDims.filter(k => validDim(k) && !pivotRowDims.value.includes(k));
    else if (validDim(s.colDim) && s.colDim !== 'none' && !pivotRowDims.value.includes(s.colDim)) pivotColDims.value = [s.colDim];
    else if (s.colDim === 'none') pivotColDims.value = [];
    if (Array.isArray(s.values)) {
      const values = s.values.filter(vd => vd && validValueField(vd.field)
        && PIVOT_VALUE_MODE_OPTIONS.some(o => o.key === vd.mode));
      if (values.length) pivotValues.value = values;
    } else if (s.valueMode) { // 舊版設定相容
      pivotValues.value = s.valueMode === 'count' || !validValueField(s.valueField)
        ? [{ field: '__count__', mode: 'count' }]
        : [{ field: s.valueField, mode: s.valueMode }];
    }
    if (Array.isArray(s.filters)) {
      pivotFilters.value = s.filters
        .filter(f => f && validDim(f.field))
        .map(f => ({ field: f.field, selected: Array.isArray(f.selected) ? f.selected : [] }));
    }
    if (typeof s.showBoth === 'boolean') pivotShowBoth.value = s.showBoth;
    if (PIVOT_CELL_PCT_OPTIONS.some(o => o.key === s.cellPct)) pivotCellPct.value = s.cellPct;
    if (typeof s.showChart === 'boolean') pivotShowChart.value = s.showChart;
    if (typeof s.numericBinning === 'boolean') pivotNumericBinning.value = s.numericBinning;
  } catch (e) { /* 設定損毀時忽略，用預設值 */ }
  finally {
    nextTick(() => { isRestoringPivotSettings = false; });
  }
}
watch(
  [pivotRowDims, pivotColDims, pivotValues, pivotFilters, pivotShowBoth, pivotCellPct, pivotShowChart, pivotNumericBinning],
  savePivotSettings,
  { deep: true }
);

// --- 匯出資料組裝（複製 TSV 與匯出 Excel 共用）---
function buildPivotAoa() {
  const m = pivotMatrix.value;
  const headers = [
    ...m.rowDimLabels,
    ...m.colKeys.flatMap(cKey => m.valueDefs.map(vd =>
      m.useCol ? `${pivotColLabel(cKey)}·${pivotValueDefLabel(vd)}` : pivotValueDefLabel(vd)
    )),
    ...(m.useCol ? m.valueDefs.map(vd => `總計·${pivotValueDefLabel(vd)}`) : []),
    '佔比',
  ];
  const body = sortedPivotRows.value.map(row => [
    ...row.parts,
    ...m.colKeys.flatMap(cKey => m.valueDefs.map((vd, vi) => {
      const v = row.cells[cKey]?.values[vi];
      return (v === null || v === undefined) ? '' : v;
    })),
    ...(m.useCol ? m.valueDefs.map((vd, vi) => row.totalValues[vi] ?? '') : []),
    row.pct === null ? '' : `${row.pct}%`,
  ]);
  const footer = [
    '總計',
    ...Array(Math.max(m.rowDimLabels.length - 1, 0)).fill(''),
    ...m.colKeys.flatMap(cKey => m.valueDefs.map((vd, vi) => m.colTotals[cKey]?.values[vi] ?? '')),
    ...(m.useCol ? m.valueDefs.map((vd, vi) => m.grand.values[vi] ?? '') : []),
    m.pctValueIndex >= 0 ? '100%' : '',
  ];
  return [headers, ...body, footer];
}
// 將目前資料透視表複製為 TSV（可直接貼進 Excel / Google Sheets）
async function copyPivotTable() {
  const aoa = buildPivotAoa();
  try {
    await navigator.clipboard.writeText(aoa.map(r => r.join('\t')).join('\n'));
    toast.success('已複製到剪貼簿！', { position: POSITION.TOP_CENTER, timeout: 2000 });
  } catch (e) {
    console.error('複製資料透視表失敗:', e);
    toast.error('複製失敗，請重試。', { position: POSITION.TOP_CENTER, timeout: 2500 });
  }
}
// 匯出含格式的 Excel
function exportPivotToExcel() {
  const m = pivotMatrix.value;
  if (!m.rows.length) return;
  const aoa = buildPivotAoa();
  const ws = XLSX.utils.aoa_to_sheet(aoa);
  const range = XLSX.utils.decode_range(ws['!ref']);
  const headerStyle = {
    font: { bold: true },
    fill: { fgColor: { rgb: 'E8EAF6' } },
    alignment: { horizontal: 'center', vertical: 'center' },
    border: { bottom: { style: 'thin', color: { rgb: '9FA8DA' } } },
  };
  const footerStyle = { font: { bold: true }, fill: { fgColor: { rgb: 'EEEEEE' } } };
  for (let c = range.s.c; c <= range.e.c; c++) {
    const hCell = ws[XLSX.utils.encode_cell({ r: 0, c })];
    if (hCell) hCell.s = headerStyle;
    const fCell = ws[XLSX.utils.encode_cell({ r: range.e.r, c })];
    if (fCell) fCell.s = footerStyle;
  }
  ws['!cols'] = aoa[0].map((h, i) => ({ wch: i === 0 ? 18 : Math.max(10, String(h).length * 2 + 2) }));
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, '資料透視');
  const rowLabel = m.rowDimLabels.join('+');
  const colLabel = m.useCol ? `×${pivotColDims.value.map(pivotDimensionLabel).join('+')}` : '';
  XLSX.writeFile(wb, `${projectName.value}_資料透視_${rowLabel}${colLabel}.xlsx`);
  toast.success('已匯出 Excel！', { position: POSITION.TOP_CENTER, timeout: 2000 });
}

// --- 長條圖（第一個值的列合計，單一序列橫向長條）---
const PIVOT_CHART_MAX_BARS = 40;
const pivotChartData = computed(() => {
  const all = sortedPivotRows.value.map(r => ({
    key: r.key,
    name: r.parts.join(' / '),
    value: r.totalValues[0] ?? 0,
  }));
  const bars = all.slice(0, PIVOT_CHART_MAX_BARS);
  const maxAbs = Math.max(...bars.map(b => Math.abs(b.value)), 0);
  return {
    bars: bars.map(b => ({
      ...b,
      widthPct: maxAbs ? Math.max(1.5, (Math.abs(b.value) / maxAbs) * 100) : 0,
      neg: b.value < 0,
    })),
    truncated: all.length - bars.length,
  };
});
const pivotChartTitle = computed(() => {
  const m = pivotMatrix.value;
  return `${m.rowDimLabels.join(' / ')} — ${pivotValueDefLabel(m.valueDefs[0])}`;
});


// ==========================================
// 🚀 [新增] 離開頁面時的資料清理邏輯
// ==========================================
onBeforeRouteLeave((to, from, next) => {
  // 定義「允許保留資料」的路由名稱白名單
  // 也就是當使用者前往這些頁面時，我們不清除 store
  const keepDataRoutes = ['QuoteSettings'];

  // 檢查目標路由 (to.name) 是否在白名單內
  if (keepDataRoutes.includes(to.name)) {
    console.log('[SalesControl] 前往報價設定，保留報價單資料');
  } else {
    // 如果是去其他地方 (例如: 回首頁、切換專案、登出)，則清空
    console.log('[SalesControl] 離開銷控系統，清空報價單資料');
    
    // ✅ 這裡執行清空動作
    quoteStore.clearQuote();
  }

  // 繼續執行導航
  next();
});


// [新增] 視圖格式：'grid' | 'list'
const viewFormat = ref('grid'); 

// [新增] 自動判斷背景色亮度，回傳 'black' 或 'white'
const getContrastTextColor = (hexColor) => {
  if (!hexColor || typeof hexColor !== 'string') return 'white';
  
  // 移除 # 號
  const hex = hexColor.replace('#', '');
  
  // 解析 RGB
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);
  
  // 計算亮度 (YIQ 公式)
  const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
  
  // 亮度大於 128 (亮色系) 回傳黑色，否則回傳白色
  return yiq >= 128 ? 'black' : 'white';
};


// ✅ [修改] 控制是否顯示「已售」的資料列 (預設 true: 顯示全部)
const showSoldItems = ref(true);

// ==========================================
// 🚀 [新增] 批次更新相關邏輯
// ==========================================

const batchDialog = reactive({
  show: false,
  loading: false,
  targetValue: false, // 目標狀態 (全部變 true 或 false)
  count: 0,           // 影響筆數
  progress: 0         // 當前處理進度
});

// 計算屬性：是否全選
const isAllPreferredPayment = computed(() => {
  if (tableItems.value.length === 0) return false;
  return tableItems.value.every(item => item.isPreferredPayment === true);
});

// 計算屬性：是否部分選取 (Indeterminate)
const isIndeterminatePreferredPayment = computed(() => {
  if (tableItems.value.length === 0) return false;
  const hasTrue = tableItems.value.some(item => item.isPreferredPayment === true);
  const hasFalse = tableItems.value.some(item => !item.isPreferredPayment); // 注意 null/undefined 視為 false
  return hasTrue && hasFalse;
});

// 開啟批次確認框
function openBatchUpdateDialog() {
  if (currentViewMode.value === 'quote') return;

  const items = tableItems.value;
  if (items.length === 0) {
    toast.info('目前列表無資料可操作', { position: POSITION.BOTTOM_CENTER });
    return;
  }

  // 邏輯：
  // 1. 如果是「部分選取」或「全選」 -> 目標：全部關閉 (False)
  // 2. 如果是「全不選」         -> 目標：全部開啟 (True)
  const currentIsSomeOrAllChecked = items.some(item => item.isPreferredPayment === true);
  const targetValue = !currentIsSomeOrAllChecked;

  batchDialog.targetValue = targetValue;
  batchDialog.count = items.length;
  batchDialog.loading = false;
  batchDialog.progress = 0;
  batchDialog.show = true;
}

// 執行批次更新
async function executeBatchUpdate() {
  batchDialog.loading = true;
  batchDialog.progress = 0;
  
  const targetValue = batchDialog.targetValue;
  const itemsToUpdate = [...tableItems.value]; // 複製當前列表
  const total = itemsToUpdate.length;
  const projectIdStr = projectId.value;

  try {
    // 分批處理 (Chunking)：每次併發 5 筆請求，避免塞爆後端或被 Rate Limit
    const chunkSize = 5;
    for (let i = 0; i < total; i += chunkSize) {
      const chunk = itemsToUpdate.slice(i, i + chunkSize);
      
      const promises = chunk.map(item => {
        // 只有當狀態不同時才需要發送 API (節省流量)
        if (item.isPreferredPayment !== targetValue) {
          // 樂觀更新 UI (讓使用者覺得很快)
          item.isPreferredPayment = targetValue;
          
          return updateSingleField(projectIdStr, item.unitId, 'isPreferredPayment', targetValue)
            .catch(err => {
              console.error(`Update failed for ${item.unitId}:`, err);
              // 失敗時復原 UI
              item.isPreferredPayment = !targetValue; 
              return null; // 忽略錯誤，繼續執行
            });
        } else {
          return Promise.resolve(); // 狀態已一致，跳過
        }
      });

      await Promise.all(promises);
      
      // 更新進度條
      batchDialog.progress = Math.min(i + chunkSize, total);
    }

    toast.success(`批次更新完成！已將 ${total} 筆資料設為 ${targetValue ? '開啟' : '關閉'}`, { 
      position: POSITION.BOTTOM_CENTER 
    });

  } catch (error) {
    console.error('Batch update error:', error);
    toast.error('批次更新過程中發生錯誤，請重新整理頁面檢查資料。', { position: POSITION.BOTTOM_CENTER });
  } finally {
    batchDialog.show = false;
    batchDialog.loading = false;
  }
}


// ==========================================
// [修改] 單筆切換 (改用 updateSingleField)
// ==========================================
const handleSwitchChange = async (item, newValue) => {
  if (currentViewMode.value === 'quote') return;

  // 樂觀更新
  const originalVal = item.isPreferredPayment;
  item.isPreferredPayment = newValue;

  try {
    // 呼叫上一輪建議的新 API，確保只更新單一欄位
    const result = await updateSingleField(projectId.value, item.unitId, 'isPreferredPayment', newValue);
    
    if (result.status !== 'success') {
      throw new Error(result.message);
    }
    // 成功不需額外動作，因為已樂觀更新
  } catch (error) {
    console.error('Switch update error:', error);
    // 失敗復原
    item.isPreferredPayment = originalVal;
    toast.error(`更新失敗: ${error.message}`, { position: POSITION.BOTTOM_CENTER });
  }
};



const isListView = ref(false); // 這好像是沒用的舊變數，可忽略或移除
// ... (COLUMN_DEFINITIONS, exportableColumns 等... 保持不變) ...
const COLUMN_DEFINITIONS = [
    { key: 'building', title: '棟別' },
    { key: 'floor', title: '樓層' },
    { key: 'unitId', title: '戶別' },
    { key: 'propertyType', title: '物件類型' },
    { key: 'layout', title: '格局' },
    { key: 'isPreferredPayment', title: '優付' },
    { key: 'salesStatus_backend', title: '銷控後台狀態' },
    { key: 'salesStatus_quote', title: '報價系統狀態' },
    { key: 'buyerName', title: '買方姓名' },
    { key: 'buyerPhone', title: '買方電話' },
    { key: 'buyerIdNumber', title: '身分證(驗證碼)' },
    { key: 'buyerDateOfBirth', title: '出生年月日' },
    { key: 'buyerEmail', title: 'EMAIL' },
    { key: 'buyerMailingAddressCity', title: '通訊地址_縣市' },
    { key: 'buyerMailingAddressDistrict', title: '通訊地址_區域' },
    { key: 'buyerMailingAddressDetail', title: '通訊地址_詳細' },
    { key: 'buyerPermanentAddressCity', title: '戶籍地址_縣市' },
    { key: 'buyerPermanentAddressDistrict', title: '戶籍地址_區域' },
    { key: 'buyerPermanentAddressDetail', title: '戶籍地址_詳細' },
    { key: 'buyerGender', title: '性別' },
    { key: 'buyerMaritalStatus', title: '婚姻狀況' },
    { key: 'buyerOccupationIndustry', title: '行業別' },
    { key: 'buyerOccupationTitle', title: '職務' },
    { key: 'buyerPurchasePurpose', title: '購買用途' },
    { key: 'buyerHasPurchasedFuyu', title: '已購買富宇房子' },
    { key: 'buyerEmergencyContactName', title: '緊急聯絡人' },
    { key: 'buyerEmergencyContactPhone', title: '緊急聯絡人電話' },
    { key: 'buyerEmergencyContactRelationship', title: '緊急聯絡人關係' },
    { key: 'referrerName', title: '介紹人姓名' },
    { key: 'referrerPhone', title: '介紹人電話' },
    { key: 'salesperson', title: '銷售人員' },
    { key: 'salespersonUserKey', title: '銷售人員userKey' },
    { key: 'contractType', title: '合約方式' },
    { key: 'isFirstTimeBuyer', title: '是否首購' },
    { key: 'area_house_sqm', title: '房屋面積(平方公尺)' },
    { key: 'area_house_ping', title: '房屋面積(坪)' },
    { key: 'area_main_sqm', title: '主建物面積(平方公尺)' },
    { key: 'area_main_ping', title: '主建物面積(坪)' },
    { key: 'area_ancillary_sqm', title: '附屬建物面積(平方公尺)' },
    { key: 'area_ancillary_ping', title: '附屬建物面積(坪)' },
    { key: 'area_common_sqm', title: '共用部分面積(平方公尺)' },
    { key: 'area_common_ping', title: '共用部分面積(坪)' },
    { key: 'area_terrace_ping', title: '露臺(坪)' },
    { key: 'common_area_ratio', title: '公設比' },
    { key: 'land_share_sqm', title: '土地持分面積(平方公尺)' },
    { key: 'land_share_ping', title: '土地持分面積(坪)' },
    { key: 'land_share_ratio', title: '土地持分' },
    { key: 'price_list_house_only', title: '房屋表價' },
    { key: 'price_list_terrace', title: '露臺表價' },
    { key: 'price_list_terrace_unit', title: '露臺單價(表價)' },
    { key: 'price_list_ancillary', title: '其他附屬表價' },
    { key: 'price_list_house_total', title: '房屋總表價' },
    { key: 'price_floor_house_only', title: '房屋底價' },
    { key: 'price_floor_terrace', title: '露臺底價' },
    { key: 'price_floor_ancillary', title: '其他附屬底價' },
    { key: 'price_floor_house_total', title: '房屋總底價' },
    { key: 'price_transaction_house', title: '房屋成交價' },
    { key: 'housePriceRatio', title: '房屋價款比例(%)' },
    { key: 'landPriceRatio', title: '土地價款比例(%)' },
    { key: 'price_package_deal', title: '配套房屋總價' },
    { key: 'price_package', title: '配套價格' },
   { key: 'landBankName', title: '土地款匯款銀行' },
    { key: 'landBankAccount', title: '土地款匯款帳號' },
    { key: 'landBankAccountName', title: '土地款戶名' },
    { key: 'houseBankName', title: '房屋款匯款銀行' },
    { key: 'houseBankAccount', title: '房屋款匯款帳號' },
    { key: 'houseBankAccountName', title: '房屋款戶名' },
    { key: 'packageBankName', title: '配套款匯款銀行' },
    { key: 'packageBankAccount', title: '配套款匯款帳號' },
    { key: 'packageBankAccountName', title: '配套款戶名' },
    { key: 'constructionMethod', title: '興建方式' },
    
    { key: 'payment_deposit_date', title: '小訂日期' },
    { key: 'payment_supplement_date', title: '補足日期' },
    { key: 'payment_contract_date', title: '簽約日期' },
    { key: 'payment_deposit_amount', title: '小訂金額' },
    { key: 'payment_supplement_amount', title: '補足金額' },
    { key: 'payment_contract_amount', title: '簽約金額' },
    { key: 'reportNo', title: '申報書序號' },
    { key: 'remarks', title: '備註' },
    // ✅ [新增] 文字標籤：Firestore 存 unitTags 陣列，Excel 拆成三欄逗號分隔、依索引對齊
    { key: 'unitTags_text', title: '文字標籤' },
    { key: 'unitTags_bgColor', title: '標籤顏色' },
    { key: 'unitTags_textColor', title: '文字顏色' },
    { key: 'availablePlans', title: '可選方案' },
    { key: 'salesImages', title: '戶別圖片' },
    { key: 'svgName', title: 'SVG圖檔' },
    { key: 'driveFolderUrl', title: '戶別資料夾位置' },
    { key: 'contractDrawingFolderUrl', title: '合約分戶圖位置' },
];
const exportableColumns = computed(() => COLUMN_DEFINITIONS.filter(c => c.exportable !== false));

// ✅ [新增] 方案清單（方案編輯器功能）：供「可選方案」編輯選項、上傳名稱反查與匯出名稱轉換
const quotePlansList = ref([]);
let unsubQuotePlans = null;
function subscribeQuotePlans(targetId) {
  if (unsubQuotePlans) unsubQuotePlans();
  quotePlansList.value = [];
  if (!targetId) return;
  unsubQuotePlans = listenToQuotePlans(targetId, (plans) => {
    quotePlansList.value = plans;
  });
}
const planIdToName = computed(() => new Map(quotePlansList.value.map(p => [p.id, p.name])));
const planNameToId = computed(() => new Map(quotePlansList.value.map(p => [p.name, p.id])));
// 匯出用：方案 id 陣列 → 名稱陣列（失效 id 過濾不顯示）
function planIdsToNames(ids) {
  return (Array.isArray(ids) ? ids : []).map(id => planIdToName.value.get(id)).filter(Boolean);
}

// 「下載指定戶別資料」對話框：原始欄位 + 前端計算欄位（tableItems 加算的值）
const isUnitExportDialogVisible = ref(false);
const UNIT_EXPORT_COMPUTED_COLUMNS = [
    { key: 'parking_spots', title: '車位編號' },
    { key: 'parking_count', title: '車位數量' },
    { key: 'parking_trans_total', title: '車位成交合計' },
    { key: 'parking_floor_total', title: '車位底價合計' },
    { key: 'total_transaction', title: '成交總價(含車位)' },
    { key: 'total_floor', title: '合計底價(含車位)' },
    { key: 'price_diff', title: '溢差價' },
    { key: 'unit_price_list', title: '表價單價' },
    { key: 'unit_price_floor', title: '底價單價' },
    { key: 'unit_price_transaction', title: '成交單價' },
    { key: 'paid_total', title: '已繳款金額(萬)' },
    { key: 'payment_ratio', title: '繳款比例(%)' },
];
const unitExportColumns = computed(() => [...exportableColumns.value, ...UNIT_EXPORT_COMPUTED_COLUMNS]);

// 匯出用資料：涵蓋「全部戶別」（住家/店面等所有類型，不受頁面分類頁籤與篩選影響），
// 加算欄位與 tableItems 相同，另補上車位編號（複數以逗號分隔）
const unitExportItems = computed(() => {
    const allParkings = salesParkings.value || [];
    const parkingMap = buildParkingMap(allParkings);
    return salesHouseholds.value
        .map(unit => enrichUnitItem(unit, parkingMap))
        .sort((a, b) => naturalSort(a.unitId, b.unitId))
        .map(item => ({
            ...item,
            // ✅ [新增] 可選方案：id 陣列預先轉為名稱陣列，匯出時以逗號分隔輸出
            availablePlans: planIdsToNames(item.availablePlans),
        }));
});
const fieldMapping = computed(() => Object.fromEntries(exportableColumns.value.map(col => [col.key, col.title])));
const chineseHeaders = computed(() => exportableColumns.value.map(c => c.title));
const exportOrder = computed(() => exportableColumns.value.map(c => c.key));

const { mobile: isMobile } = useDisplay();
const router = useRouter();
const quoteStore = useQuoteStore();
const route = useRoute();
const toast = useToast();

const salesDataStore = useSalesDataStore(); 
const projectIdForPresence = computed(() => route.params.projectName);
const systemNameForPresence = computed(() => route.meta.viewMode === 'quote' ? '報價系統' : '銷控系統');
useSystemPresence(projectIdForPresence.value, systemNameForPresence.value);

const { 
  isSlideDialogVisible, 
  slideEmbedUrl,
  isLoadingSlide,
  isContentLoaded,
  openSlideViewer
} = useSlideViewer();

const textStyleStore = useTextStyleStore(); 
const statusColorStore = useStatusColorStore(); 

// State
const loading = ref(true);
const error = ref(null);

const projectData = computed(() => salesDataStore.getProjectData(projectId.value));
const project = computed(() => projectData.value.project);
const salesParameters = computed(() => projectData.value.parameters);
const salesHouseholds = computed(() => projectData.value.households);
const salesParkings = computed(() => projectData.value.parkings);
const salesImages = computed(() => projectData.value.images);
const salesPersonnel = computed(() => projectData.value.personnel);

// ============ 實價登錄申報提醒 ============
// 篩出「簽約日期不為空、但申報書序號為空」的戶別，計算已過天數；≥30 天為逾期罰則風險
// 注意：只在 sales 模式下觸發 UI；報價模式不提示以免干擾業務。
function toDateOrNull(v) {
  if (!v) return null;
  if (v instanceof Date) return isNaN(v.getTime()) ? null : v;
  if (typeof v.toDate === 'function') {
    const d = v.toDate();
    return isNaN(d.getTime()) ? null : d;
  }
  const d = new Date(v);
  return isNaN(d.getTime()) ? null : d;
}
function daysBetween(from, to = new Date()) {
  const MS_PER_DAY = 24 * 60 * 60 * 1000;
  const start = new Date(from.getFullYear(), from.getMonth(), from.getDate());
  const end = new Date(to.getFullYear(), to.getMonth(), to.getDate());
  return Math.round((end - start) / MS_PER_DAY);
}
const REPORT_DEADLINE_DAYS = 30;
const pendingReportUnits = computed(() => {
  const list = Array.isArray(salesHouseholds.value) ? salesHouseholds.value : [];
  return list
    .map(u => {
      const date = toDateOrNull(u.payment_contract_date);
      const no = String(u.reportNo ?? '').trim();
      if (!date || no) return null;
      const days = daysBetween(date);
      return {
        id: u.id,
        unitId: u.unitId,
        building: u.building,
        buyerName: u.buyerName || '',
        contractDate: date,
        daysElapsed: days,
        overdue: days >= REPORT_DEADLINE_DAYS,
        remaining: REPORT_DEADLINE_DAYS - days,
        _raw: u,
      };
    })
    .filter(Boolean)
    .sort((a, b) => b.daysElapsed - a.daysElapsed);
});
const overdueReportCount = computed(() => pendingReportUnits.value.filter(u => u.overdue).length);
const showReportReminderDialog = ref(false);
// Snackbar 一次性提醒：載入後若有待申報戶別則秀一次；關閉後同 session 不再重複
const showReportSnackbar = ref(false);
const reportSnackbarShown = ref(false);  // 避免資料重新到貨時重複觸發
// 註：watch 移至 currentViewMode 宣告之後，避免 immediate:true 同步觸發時 TDZ 錯誤

const isRefreshing = ref(false);
const isDevelopment = computed(() => import.meta.env.DEV);

const headerTopRef = ref(null);
const headerLeftRef = ref(null);
const mainGridRef = ref(null);
const isModalVisible = ref(false);
const selectedUnitData = ref(null);
const isQuoteSidebarOpen = ref(false);
const isGridDownloadDialogVisible = ref(false); // ✅ [新增] 下載銷控表 PDF 對話框
const displayType = ref('住家');
// ✅ 住家/店面分段開關選項（含各類型戶數，顯示於網格上方）
const propertyTypeOptions = computed(() => {
  let home = 0;
  let store = 0;
  for (const item of salesHouseholds.value || []) {
    if (item?.layout === '店面') store += 1;
    else home += 1;
  }
  return [
    { value: '住家', label: '住家', icon: 'mdi-home-outline', count: home },
    { value: '店面', label: '店面', icon: 'mdi-storefront-outline', count: store },
  ];
});
const priceDisplayMode = ref('list');
// ✅ [新增] 網格主要顯示內容：total 總價（預設）/ unit 單價 / date 簽約日期
const gridContentMode = ref('total');
// 報價模式一律顯示總價，切換僅在銷控模式生效
const effectiveGridContentMode = computed(() =>
  currentViewMode.value === 'sales' ? gridContentMode.value : 'total'
);

const isActivityDialogVisible = ref(false);
const userStore = useUserStore();

const isAIAssistantDialogVisible = ref(false);
const isAnalyticsPanelVisible = ref(false);
const isParkingCanvasDialogVisible = ref(false);
const parkingCanvasFloorPlans = ref([]);
const activeParkingCanvasFloorPlan = ref(null);
const isParkingCanvasLoading = ref(false);
const parkingCanvasDisplayMode = ref('backend'); 

const uploadDialog = ref(false);
const uploadedFile = ref(null);
const parsedData = ref([]);
const isParsing = ref(false);
const isUploading = ref(false);
const uploadMessage = ref('');
const uploadMessageType = ref('success');

const allDataForModal = computed(() => {
  return {
    '參數': salesParameters.value,
    '車位': salesParkings.value,
    '戶別': salesHouseholds.value,  // ✅ 新增：讓 AI 助理能取得全案戶別資料
    '銷控圖片': salesImages.value,
    '銷售人員': salesPersonnel.value, 
  };
});
const canUploadActivityMessage = computed(() => {
  const roles = userStore.user?.roles || [];
  if (roles.includes('超級管理員') || roles.includes('系統管理員')) return true;
  return userStore.hasProjectPermission('銷控系統', project.value?.name);
});

// ✅ [新增] 報價單設定直接入口權限：與報價單設定頁管理功能相同標準
// （系統/超級管理員或具該案「銷控系統」權限），免先加入戶別即可進入
const canDirectEnterQuoteSettings = computed(() => {
  const roles = userStore.user?.roles || [];
  if (roles.includes('超級管理員') || roles.includes('系統管理員')) return true;
  return userStore.hasProjectPermission('銷控系統', project.value?.name);
});

// ✅ [新增] 請佣獎金系統入口：需「請佣獎金」獨立權限（與銷控系統權限分開控管）
// 注意：路由守衛的 requiredSystem 檢查沒有管理員角色 bypass，
// 此處刻意與守衛一致（僅看建案權限），避免按鈕可見但進入被守衛擋下。
const canAccessCommission = computed(() =>
  userStore.hasProjectPermission('請佣獎金', project.value?.name)
);
function goToCommissionBonus() {
  router.push({ name: 'CommissionBonus', params: { projectId: projectId.value } });
}

// ✅ [新增] 直接前往報價單設定（保留現有報價單資料，返回鍵可回銷控）
function goToQuoteSettingsDirect() {
  router.push({
    name: 'QuoteSettings',
    params: { projectName: projectId.value },
    query: { viewMode: currentViewMode.value },
  });
}

// --- Computed Properties ---
const projectStore = useProjectStore();
const projectId = computed(() => route.params.projectName);
const currentViewMode = computed(() => route.meta.viewMode || 'sales');

// 實價登錄提醒：watch 必須放在 currentViewMode 之後 (immediate:true 同步觸發時會讀 currentViewMode.value)
watch(pendingReportUnits, (list) => {
  if (
    currentViewMode.value === 'sales'
    && !reportSnackbarShown.value
    && list.length > 0
  ) {
    showReportSnackbar.value = true;
    reportSnackbarShown.value = true;
  }
}, { immediate: true });

const pageTitle = computed(() => (currentViewMode.value === 'quote' ? '報價系統' : '銷控系統'));
const itemCount = computed(() => quoteStore.itemCount);
const projectName = computed(() => project.value.name);
const availableProjects = computed(() => projectStore.projectsList || []);

// [Grid Computed]
const filteredHouseholds = computed(() => {
  // ✅ 列表模式：不區分住家/店面，一律列出
  if (viewFormat.value === 'list') {
    return salesHouseholds.value;
  }
  if (displayType.value === '店面') {
    return salesHouseholds.value.filter(item => item.layout === '店面');
  }
  return salesHouseholds.value.filter(item => item.layout !== '店面');
});

const buildingHeaders = computed(() => {
  const buildings = new Set(filteredHouseholds.value.map(item => item.building));
  return Array.from(buildings).sort((a, b) => String(a).localeCompare(String(b), undefined, { numeric: true, sensitivity: 'base' }));
});

const floorHeaders = computed(() => {
  const floors = new Set(filteredHouseholds.value.map(item => parseInt(item.floor, 10)));
  return Array.from(floors).sort((a, b) => b - a);
});

const gridData = computed(() => {
  const dataMap = {};
  for (const household of filteredHouseholds.value) {
    const floor = household.floor;
    const building = household.building;
    if (!dataMap[floor]) dataMap[floor] = {};
    dataMap[floor][building] = household;
  }
  return dataMap;
});

const flatGridData = computed(() => {
  const items = [];
  floorHeaders.value.forEach(floor => {
    buildingHeaders.value.forEach(building => {
      items.push({
        key: `${floor}-${building}`,
        data: gridData.value[floor]?.[building] || null,
      });
    });
  });
  return items;
});

const statusField = computed(() => currentViewMode.value === 'quote' ? 'salesStatus_quote' : 'salesStatus_backend');

const statusColorMap = computed(() => {
  const map = new Map();
  salesParameters.value.forEach(item => {
    map.set(item.statusName, item.colorCode);
  });
  return map;
});

const priceDisplayLabel = computed(() => {
  if (priceDisplayMode.value === 'list') return '表價';
  if (priceDisplayMode.value === 'floor') return '底價';
  if (priceDisplayMode.value === 'transaction') return '成交價';
  return '價格';
});

// =====================================================
// 🚀 [新增] 列表模式相關 Computed 屬性與邏輯
// =====================================================

// 1. 戶別自然排序輔助函式
const naturalSort = (a, b) => {
  return String(a).localeCompare(String(b), undefined, { numeric: true, sensitivity: 'base' });
};

// 2. 日期格式化輔助函式
const formatDate = (val) => {
  if (!val) return '';
  if (val instanceof Date) return val.toLocaleDateString('zh-TW');
  if (val && typeof val.toDate === 'function') return val.toDate().toLocaleDateString('zh-TW');
  // 嘗試解析字串
  const d = new Date(val);
  if (!isNaN(d.getTime())) return d.toLocaleDateString('zh-TW');
  return val;
};

// 修改 tableHeaders computed
// ✅ [新增] 標籤欄排序：依第一個標籤文字（無標籤排最後）
const unitTagsColumnSort = (a, b) => {
  const va = unitTagsSortValue(a);
  const vb = unitTagsSortValue(b);
  if (!va && !vb) return 0;
  if (!va) return 1;
  if (!vb) return -1;
  return va.localeCompare(vb, 'zh-Hant');
};

const tableHeaders = computed(() => {
  // 情境 A: [報價模式]
  if (currentViewMode.value === 'quote') {
    // 1. 定義基礎欄位 (戶別)
    const headers = [
      { 
        title: '戶別', 
        key: 'unitId', 
        align: 'center', 
        fixed: true, 
        sortable: true 
      }
    ];

    // 2. ✅ [修改] 根據專案設定決定是否顯示「優付」欄位
    // 只有當設定為 true 時才顯示 (預設或 undefined 都不顯示)
    if (project.value && project.value.showPreferredPaymentInQuote === true) {
      headers.push({ 
        title: '優付', 
        key: 'isPreferredPayment', 
        align: 'center', 
        sortable: true, 
        width: '80px' 
      });
    }

    // 3. 加入其餘固定欄位
    headers.push(
      { title: '標籤', key: 'unitTags', align: 'start', sortable: true, sort: unitTagsColumnSort, width: '160px' }, // ✅ [新增] 文字標籤
      { title: '房屋總面積(坪)', key: 'area_house_ping', align: 'center' },
      { title: '露臺(坪)', key: 'area_terrace_ping', align: 'center' }, // ✅ [新增] 報價模式露臺
      { title: '房屋總價', key: 'quote_mode_total_price', align: 'center', sort: customPriceSort, minWidth: '160px' },
      { title: '房屋單價', key: 'unit_price_value', align: 'center', sort: customPriceSort }
    );

    return headers;
  }
 // 情境 B: [銷控模式]
  else {
    // 手機版：欄位與電腦版完全相同（不減少欄位），凍結狀態/戶別欄 + 橫向滑動，適合直式操作
    if (isMobile.value) {
      return [
        { title: '狀態', key: 'status', align: 'center', width: '60px', fixed: true },
        { title: '戶別', key: 'unitId', align: 'start', width: '70px', fixed: true },
        { title: '標籤', key: 'unitTags', align: 'start', width: '120px', sort: unitTagsColumnSort }, // ✅ [新增] 文字標籤
        { title: '優付', key: 'isPreferredPayment', align: 'center', width: '70px' },
        { title: '面積(坪)', key: 'area_house_ping', align: 'end', width: '80px' },
        { title: '露臺(坪)', key: 'area_terrace_ping', align: 'end', width: '80px' },
        { title: '房價(表價)', key: 'price_list_house_total', align: 'end', width: '90px' },
        { title: '表價單價', key: 'unit_price_list', align: 'end', width: '85px', sort: customPriceSort },
        { title: '底價', key: 'price_floor_house_total', align: 'end', width: '85px' },
        { title: '底價單價', key: 'unit_price_floor', align: 'end', width: '85px', sort: customPriceSort },
        { title: '成交價', key: 'price_transaction_house', align: 'end', width: '85px' },
        { title: '成交單價', key: 'unit_price_transaction', align: 'end', width: '85px', sort: customPriceSort },
        { title: '車位編號', key: 'parking_spots', align: 'start', width: '110px' },
        { title: '車位底價', key: 'parking_floor_total', align: 'end', width: '85px' },
        { title: '車位成交', key: 'parking_trans_total', align: 'end', width: '85px' },
        { title: '成交總價(含車)', key: 'total_transaction', align: 'end', width: '110px' },
        { title: '繳款比例', key: 'payment_ratio', align: 'center', width: '90px', sort: customPriceSort },
        { title: '合計底價(含車)', key: 'total_floor', align: 'end', width: '110px' },
        { title: '溢差價', key: 'price_diff', align: 'end', width: '80px' },
        { title: '銷售人員', key: 'salesperson', align: 'start', width: '95px' },
        { title: '買方姓名', key: 'buyerName', align: 'start', width: '90px' },
        { title: '小訂日期', key: 'payment_deposit_date', align: 'center', width: '100px' },
        { title: '補足日期', key: 'payment_complete_date', align: 'center', width: '100px' },
        { title: '簽約日期', key: 'payment_contract_date', align: 'center', width: '100px' },
        { title: '備註', key: 'remarks', align: 'start' },
      ];
    }

    // 電腦版銷控模式
    return [
      { title: '銷控狀態', key: 'status', align: 'center' },
      { title: '戶別', key: 'unitId', align: 'start', fixed: true, sortable: true },
      { title: '標籤', key: 'unitTags', align: 'start', sort: unitTagsColumnSort }, // ✅ [新增] 文字標籤
      // 銷控模式始終顯示優付
      { title: '優付', key: 'isPreferredPayment', align: 'center', width: '80px' },
      { title: '房屋總面積(坪)', key: 'area_house_ping', align: 'start' },
      { title: '露臺(坪)', key: 'area_terrace_ping', align: 'start' }, // ✅ [新增] 電腦版露臺
      
      // ... (原本的欄位) ...
      { title: '房價(表價)', key: 'price_list_house_total', align: 'start' },
      { title: '表價單價', key: 'unit_price_list', align: 'start', sort: customPriceSort },
      { title: '底價', key: 'price_floor_house_total', align: 'start' },
      { title: '底價單價', key: 'unit_price_floor', align: 'start', sort: customPriceSort },
      { title: '成交價', key: 'price_transaction_house', align: 'start' },
      { title: '成交單價', key: 'unit_price_transaction', align: 'start', sort: customPriceSort },
      { title: '車位編號', key: 'parking_spots', align: 'start' },
      { title: '車位底價', key: 'parking_floor_total', align: 'start' },
      { title: '車位成交', key: 'parking_trans_total', align: 'start' },
      { title: '成交總價(含車)', key: 'total_transaction', align: 'start' },
      { title: '繳款比例', key: 'payment_ratio', align: 'center', sort: customPriceSort },
      { title: '合計底價(含車)', key: 'total_floor', align: 'start' },
      { title: '溢差價', key: 'price_diff', align: 'start' },
      { title: '銷售人員', key: 'salesperson', align: 'start' },
      { title: '買方姓名', key: 'buyerName', align: 'start' },
      { title: '小訂日期', key: 'payment_deposit_date', align: 'center' },
      { title: '補足日期', key: 'payment_complete_date', align: 'center' },
      { title: '簽約日期', key: 'payment_contract_date', align: 'center' },
      { title: '備註', key: 'remarks', align: 'start' },
    ];
  }
});

// ✅ [備註留言] 列表模式備註欄：小視窗狀態與顯示輔助
const remarkDialog = ref({ show: false, unitId: '', notes: [], legacyRemarks: '' });

function remarkCellInfo(item) {
  const notes = resolveDisplayNotes(item.remarkNotes, item.remarks);
  if (notes.length === 0) return { count: 0, preview: '', hasPinned: false };
  const first = notes[0]; // 已排序：置頂優先、新到舊
  const author = first.type === 'legacy' ? '舊備註' : (first.type === 'system' ? '系統' : (first.authorName || ''));
  const text = String(first.content || '').replace(/\s+/g, ' ');
  const preview = `${author ? author + '：' : ''}${text}`;
  return {
    count: notes.length,
    hasPinned: notes.some(n => n.pinned),
    preview: preview.length > 24 ? preview.slice(0, 24) + '…' : preview,
  };
}

function openRemarkDialog(item) {
  remarkDialog.value = {
    show: true,
    unitId: item.unitId,
    notes: Array.isArray(item.remarkNotes) ? item.remarkNotes.slice() : [],
    legacyRemarks: typeof item.remarks === 'string' ? item.remarks : '',
  };
}

/** [備註留言] 小視窗持久化：直寫 salesHouseholds 並回填 remarks 字串（store 即時監聽會同步表格） */
async function persistRemarkDialogNotes(newNotes) {
  const docId = `${projectId.value}_${remarkDialog.value.unitId}`;
  const summary = buildRemarksSummary(newNotes);
  await fsUpdateDoc(fsDoc(db, 'salesHouseholds', docId), {
    remarkNotes: newNotes,
    remarks: summary,
    updatedAt: fsServerTimestamp(),
  });
  remarkDialog.value.notes = newNotes.slice();
  remarkDialog.value.legacyRemarks = summary;
}

// [新增] 自定義價格排序：讓 null (已售) 排在最後
const customPriceSort = (a, b) => {
  // 如果兩個都是 null，視為相等
  if (a === null && b === null) return 0;
  // 如果 a 是 null，讓它排在 b 後面 (視為最大)
  if (a === null) return 1;
  // 如果 b 是 null，讓它排在 a 後面
  if (b === null) return -1;
  // 正常的數字比較
  return a - b;
};


// 修改 tableItems computed
const buildParkingMap = (parkings) => {
  const parkingMap = {};
  parkings.forEach(p => {
    if (p.buyerUnitId) {
      if (!parkingMap[p.buyerUnitId]) parkingMap[p.buyerUnitId] = [];
      parkingMap[p.buyerUnitId].push(p);
    }
  });
  return parkingMap;
};

// 戶別加算欄位（狀態、車位合計、成交總價、溢差價、單價…），tableItems 與匯出共用
const enrichUnitItem = (unit, parkingMap) => {
    const item = { ...unit };
    item.status = currentViewMode.value === 'quote' ? unit.salesStatus_quote : unit.salesStatus_backend;

    const mySpots = parkingMap[unit.unitId] || [];
    const parkingTransTotal = mySpots.reduce((sum, p) => sum + (Number(p.price_transaction) || 0), 0);
    const parkingFloorTotal = mySpots.reduce((sum, p) => sum + (Number(p.price_floor) || 0), 0);

    // 新增：將車位計算結果存入 item
    item.parking_trans_total = parkingTransTotal;
    item.parking_floor_total = parkingFloorTotal;
    // 車位編號（自然排序、逗號分隔）與車位數量：列表「車位編號」欄、合計列與匯出共用
    item.parking_spots = mySpots.map(p => p.spotId ?? '').filter(Boolean).sort(naturalSort).join(',');
    item.parking_count = mySpots.length;

    // 房屋成交價
    const houseTrans = Number(unit.price_transaction_house) || 0;

    // 成交總價
    item.total_transaction = houseTrans + parkingTransTotal;

    // 合計底價
    const houseFloor = Number(unit.price_floor_house_total) || 0;
    item.total_floor = houseFloor + parkingFloorTotal;

    // 溢差價計算
    if (houseTrans > 0) {
        item.price_diff = item.total_transaction - item.total_floor;
    } else {
        item.price_diff = null;
    }

    // ✅ [繳款紀錄] 已繳款金額(萬) 與 繳款比例(%)：已繳合計(元) ÷ 成交總價(含車位, 萬)×10000
    const paymentRecords = Array.isArray(unit.paymentRecords) ? unit.paymentRecords : [];
    const paidYuan = paymentRecords.reduce((sum, r) => sum + (Number(r?.amount) || 0), 0);
    item.payment_records_count = paymentRecords.length;
    item.paid_total = Math.round(paidYuan / 10000 * 100) / 100; // 萬，與其他金額欄位單位一致
    item.payment_ratio = item.total_transaction > 0
        ? Math.round((paidYuan / (item.total_transaction * 10000)) * 1000) / 10
        : null;

    // 單價計算
    const areaVal = Number(item.area_house_ping) || 0;
    const calcUnit = (totalPrice) => {
        const price = Number(totalPrice) || 0;
        if (price <= 0 || areaVal === 0) return null;
        return price / areaVal;
    };

    item.unit_price_list = calcUnit(item.price_list_house_total);
    item.unit_price_floor = calcUnit(item.price_floor_house_total);
    item.unit_price_transaction = calcUnit(item.price_transaction_house);

    // 報價模式專用
    if (item.status === '已售') {
        item.unit_price_value = null;
        item.quote_mode_total_price = null;
    } else {
        item.unit_price_value = item.unit_price_list;
        item.quote_mode_total_price = Number(item.price_list_house_total) || 0;
    }

    // ✅ [新增] 文字標籤：攤平成三個逗號分隔欄位（Excel 匯出 / 資料透視 / 指定戶別下載共用）
    Object.assign(item, unitTagsToExportColumns(unit.unitTags));

    return item;
};

const tableItems = computed(() => {
  // 🔴 [修正重點] 這裡必須用 'let'，因為下面會重新賦值
  let units = filteredHouseholds.value;

  // ✅ [新增] 過濾邏輯
  if (currentViewMode.value === 'quote' && !showSoldItems.value) {
    // 這裡會對 units 重新賦值，所以上面必須是 let
    units = units.filter(u => u.salesStatus_quote !== '已售');
  }

  const parkingMap = buildParkingMap(salesParkings.value || []);
  return units.map(unit => enrichUnitItem(unit, parkingMap)).sort((a, b) => naturalSort(a.unitId, b.unitId));
});



// ✅ [新增] 列表模式加總列：依「目前篩選後資料」加總
const summaryRow = computed(() => {
  const items = filteredTableItems.value || [];
  if (items.length === 0) return null;

  let areaTotal = 0;
  let terraceTotal = 0;
  let priceListTotal = 0;
  let priceFloorTotal = 0;
  let priceTransTotal = 0;       // 房屋成交價加總
  let parkingFloorTotal = 0;     // 車位底價加總
  let parkingTransTotal = 0;     // 車位成交加總
  let parkingCountTotal = 0;     // 車位數量加總
  let totalTransactionTotal = 0; // 成交總價(含車)加總
  let totalFloorTotal = 0;       // 合計底價(含車)加總
  let priceDiffTotal = 0;        // 溢差價加總（只計算有成交的戶別）
  let paidWanTotal = 0;          // 已繳款金額(萬)加總

  items.forEach((item) => {
    paidWanTotal += Number(item.paid_total) || 0;
    areaTotal += Number(item.area_house_ping) || 0;
    terraceTotal += Number(item.area_terrace_ping) || 0;
    priceListTotal += Number(item.price_list_house_total) || 0;
    priceFloorTotal += Number(item.price_floor_house_total) || 0;
    priceTransTotal += Number(item.price_transaction_house) || 0;
    parkingFloorTotal += Number(item.parking_floor_total) || 0;
    parkingTransTotal += Number(item.parking_trans_total) || 0;
    parkingCountTotal += Number(item.parking_count) || 0;
    totalTransactionTotal += Number(item.total_transaction) || 0;
    totalFloorTotal += Number(item.total_floor) || 0;
    if (item.price_diff !== null && item.price_diff !== undefined) {
      priceDiffTotal += Number(item.price_diff) || 0;
    }
  });

  // 加權平均單價 = 對應總價加總 / 面積加總
  const unitPriceList = areaTotal > 0 && priceListTotal > 0 ? priceListTotal / areaTotal : null;
  const unitPriceFloor = areaTotal > 0 && priceFloorTotal > 0 ? priceFloorTotal / areaTotal : null;
  const unitPriceTrans = areaTotal > 0 && priceTransTotal > 0 ? priceTransTotal / areaTotal : null;

  // ✅ [繳款紀錄] 整體繳款比例 = 已繳合計(萬) ÷ 成交總價(含車)加總(萬)
  const paymentRatioTotal = totalTransactionTotal > 0 && paidWanTotal > 0
    ? (paidWanTotal / totalTransactionTotal) * 100
    : null;

  return {
    count: items.length,
    areaTotal,
    terraceTotal,
    priceListTotal,
    priceFloorTotal,
    priceTransTotal,
    parkingFloorTotal,
    parkingTransTotal,
    parkingCountTotal,
    totalTransactionTotal,
    totalFloorTotal,
    priceDiffTotal,
    paidWanTotal,
    paymentRatioTotal,
    unitPriceList,
    unitPriceFloor,
    unitPriceTrans,
  };
});

// ✅ [繳款紀錄] 列表模式：點繳款比例浮動顯示該戶繳款紀錄一覽（銷控模式可直接新增/編輯/刪除）
const paymentPopup = reactive({ open: false, unit: null });
function openPaymentRecordsPopup(item) {
  paymentPopup.unit = item;
  paymentPopup.open = true;
}
const canQuickEditPayments = computed(() => currentViewMode.value === 'sales');

function paymentProofFileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result).split(',')[1]);
    reader.onerror = () => reject(new Error('讀取圖檔失敗'));
    reader.readAsDataURL(file);
  });
}

// CRUD 成功後同步 store 原始資料與彈窗列表：列表「繳款比例」chip 與資料透視即時重算，免重新載入
function applyPaymentRecordsLocally(unitId, updater) {
  const raw = (salesHouseholds.value || []).find(u => u.unitId === unitId);
  if (raw) {
    raw.paymentRecords = updater(Array.isArray(raw.paymentRecords) ? raw.paymentRecords : []);
  }
  if (paymentPopup.unit && paymentPopup.unit.unitId === unitId) {
    const current = Array.isArray(paymentPopup.unit.paymentRecords) ? paymentPopup.unit.paymentRecords : [];
    paymentPopup.unit = { ...paymentPopup.unit, paymentRecords: updater(current) };
  }
}

async function popupQuickAddPaymentRecord({ date, amount, note, file }) {
  const unit = paymentPopup.unit;
  if (!unit) return;
  const base64 = file ? await paymentProofFileToBase64(file) : null;
  const res = await paymentProofApi({
    action: 'addRecord',
    projectId: projectId.value,
    unitId: unit.unitId,
    base64, date, amount, note
  });
  if (res.status !== 'success' || !res.record) throw new Error(res.message || '請稍後再試');
  applyPaymentRecordsLocally(unit.unitId, list => [...list, res.record]);
  toast.success('繳款紀錄已新增', { position: POSITION.BOTTOM_CENTER });
}

async function popupQuickUpdatePaymentRecord({ recordId, date, amount, note, file, removeFile }) {
  const unit = paymentPopup.unit;
  if (!unit) return;
  const base64 = file ? await paymentProofFileToBase64(file) : null;
  const res = await paymentProofApi({
    action: 'updateRecord',
    projectId: projectId.value,
    unitId: unit.unitId,
    recordId,
    base64,
    removeFile: !!removeFile,
    date, amount, note
  });
  if (res.status !== 'success' || !res.record) throw new Error(res.message || '請稍後再試');
  applyPaymentRecordsLocally(unit.unitId, list => list.map(r => (r.id === recordId ? res.record : r)));
  if (res.renameWarning) {
    toast.warning('憑證 Drive 檔名同步失敗，紀錄內容仍已更新', { position: POSITION.BOTTOM_CENTER });
  }
  toast.success('繳款紀錄已更新', { position: POSITION.BOTTOM_CENTER });
}

async function popupQuickDeletePaymentRecord({ recordId }) {
  const unit = paymentPopup.unit;
  if (!unit) return;
  const res = await paymentProofApi({
    action: 'deleteRecord',
    projectId: projectId.value,
    unitId: unit.unitId,
    recordId
  });
  if (res.status !== 'success') throw new Error(res.message || '請稍後再試');
  applyPaymentRecordsLocally(unit.unitId, list => list.filter(r => r.id !== recordId));
  toast.success('繳款紀錄已刪除（Drive 憑證圖檔保留）', { position: POSITION.BOTTOM_CENTER });
}

// 5. 處理列表行點擊
const handleRowClick = (event, { item }) => {
  // Vuetify 的 item 包裝在 Proxy 或物件中，視版本而定
  // openUnitDetail 需要原始數據物件
  openUnitDetail(item); 
};
// =====================================================

// --- Methods ---
const getDisplayTotalPrice = (itemData) => {
  const formatPrice = (price) => Math.round(price || 0);

  if (currentViewMode.value !== 'sales') {
    return formatPrice(itemData.price_list_house_total);
  }
  switch (priceDisplayMode.value) {
    case 'floor':
      return formatPrice(itemData.price_floor_house_total || itemData.price_list_house_total);
    case 'transaction':
      const canShow = ['小訂', '補足', '簽約'].includes(itemData.salesStatus_backend) && itemData.price_transaction_house;
      return canShow ? formatPrice(itemData.price_transaction_house) : formatPrice(itemData.price_list_house_total);
    default: // list
      return formatPrice(itemData.price_list_house_total);
  }
};

const calculateUnitPrice = (itemData) => {
  const totalPriceInWan = parseFloat(getDisplayTotalPrice(itemData));
  const area = parseFloat(itemData.area_house_ping);
  if (isNaN(totalPriceInWan) || isNaN(area) || area === 0) return '-';
  return (totalPriceInWan / area).toFixed(1);
};

// ✅ [新增] 網格「簽約日期」顯示：未簽約（無日期）顯示 '-'
const getContractDateDisplay = (itemData) => {
  const d = formatDate(itemData.payment_contract_date);
  return d || '-';
};

const formatNumber = (val, precision = 0) => {
  if (val === undefined || val === null || val === '') return '-';
  const num = Number(val);
  return isNaN(num) ? '-' : num.toLocaleString('zh-TW', { minimumFractionDigits: precision, maximumFractionDigits: precision });
};

function handleScroll(event) {
  if (headerTopRef.value) headerTopRef.value.scrollLeft = event.target.scrollLeft;
  if (headerLeftRef.value) headerLeftRef.value.scrollTop = event.target.scrollTop;
}

function openUnitDetail(unitData) {
  if (unitData) {
    selectedUnitData.value = { ...unitData };
    isModalVisible.value = true;
  }
}

// 從提醒清單點進某戶 → 開 UnitDetailModal；同時關閉提醒 Dialog 避免重疊
function openPendingUnit(item) {
  if (!item?._raw) return;
  showReportReminderDialog.value = false;
  openUnitDetail(item._raw);
}

function handleOpenSlideViewer() {
  const slideId = currentViewMode.value === 'quote' ? project.value.parkingSlideId_quote : project.value.parkingSlideId_sales;
  openSlideViewer(slideId);
}

function handleOpenActivityMessage() {
  isActivityDialogVisible.value = true;
}

function navigateToSalesSettings() {
  if (projectId.value) {
    router.push({
      name: 'SalesSettings',
      params: { projectId: projectId.value }
    });
  }
}

function navigateToParkingControl() {
  if (projectId.value) {
    router.push({
      name: 'ParkingControl',
      params: { projectId: projectId.value }
    });
  }
}

const openParkingCanvasEditor = async () => {
  if (!projectId.value) {
    toast.error('未提供專案 ID，無法開啟編輯器。', { position: POSITION.BOTTOM_CENTER });
    return;
  }

  isParkingCanvasLoading.value = true;
  isParkingCanvasDialogVisible.value = true;

  if (currentViewMode.value === 'quote') {
    parkingCanvasDisplayMode.value = 'sales'; 
  } else { 
    parkingCanvasDisplayMode.value = 'backend'; 
  }

  activeParkingCanvasFloorPlan.value = null;
  parkingCanvasFloorPlans.value = [];

  try {
    const result = await getFloorPlansAPI(projectId.value);
    if (result.status === 'success' && result.data && result.data.length > 0) {
      result.data.sort((a, b) => 
        (a.floor || '').localeCompare(b.floor || '', 'zh-Hant', { numeric: true })
      );
      parkingCanvasFloorPlans.value = result.data;
      activeParkingCanvasFloorPlan.value = parkingCanvasFloorPlans.value[0]; 
    } else {
      toast.error('此專案沒有可編輯的車位樓層平面圖。', { position: POSITION.BOTTOM_CENTER });
      isParkingCanvasDialogVisible.value = false;
    }
  } catch (error) {
    toast.error(`載入樓層資料失敗: ${error.message}`, { position: POSITION.BOTTOM_CENTER });
    isParkingCanvasDialogVisible.value = false;
  } finally {
    isParkingCanvasLoading.value = false;
  }
};

const handleParkingCanvasFloorSwitch = (plan) => {
  activeParkingCanvasFloorPlan.value = plan;
};

const handleParkingCanvasSpotsChanged = () => {
  console.log('ParkingCanvas 偵測到畫布變更，需處理 [自動保存] 或 [標記為未保存]');
  toast.info('偵測到畫布變更 (尚未自動保存)', { 
    timeout: 2000,
    position: POSITION.BOTTOM_CENTER
  });
};


const handleUnitListUpdate = async (payload, onSuccess, onError) => {
  const { unitId, data } = payload;
  console.log(`[ListUpdate] 更新 ${unitId}:`, data);
  try {
    const apiPayload = {
        projectName: projectName.value,
        projectId: projectId.value,
        unitId: unitId,
        data: data
    };
    const result = await updateSalesData(apiPayload);
    if (result.status === 'success') {
      toast.success(`${unitId} 資料已更新`, { 
        timeout: 1500,
        position: POSITION.BOTTOM_CENTER
      });
      if (onSuccess) onSuccess();
    } else {
      throw new Error(result.message);
    }
  } catch (error) {
    console.error("更新失敗:", error);
    toast.error(`更新失敗: ${error.message}`, { position: POSITION.BOTTOM_CENTER });
    if (onError) onError(error);
  }
};

/**
 * 切換建案
 */
const switchProject = (newProjectId) => {
  if (newProjectId === projectId.value) return;

  console.log(`🔄 切換建案: ${projectId.value} → ${newProjectId}`);

  // 使用 router.push 導航到新的 project
  router.push({
    name: route.name,
    params: { projectName: newProjectId },
    meta: route.meta
  });
};

// 手機版「更多」選單內切換建案：選完後關閉選單再導航
function onSwitchProjectFromMenu(newProjectId) {
  isMoreMenuOpen.value = false;
  switchProject(newProjectId);
}

/**
 * 在 AnalyticsPanel 内切換建案（不關閉面板）
 */
const switchProjectWithinAnalytics = (newProjectId) => {
  if (newProjectId === projectId.value) return;

  console.log(`🔄 [AnalyticsPanel] 切換建案: ${projectId.value} → ${newProjectId}`);

  // 設置標記，告訴頁面切換後要保持面板打開
  sessionStorage.setItem('keepAnalyticsPanelOpen', 'true');

  // 使用 router.push 導航到新的 project，但面板會在導航後保持打開
  router.push({
    name: route.name,
    params: { projectName: newProjectId },
    meta: route.meta
  });
};

const handleRefreshData = async () => {
  console.log('🔄 [Manual Refresh] 用戶要求刷新數據');
  isRefreshing.value = true;
  try {
    await salesDataStore.loadProjectData(projectId.value, true);
    toast.success(' 資料已更新到最新版本', { position: POSITION.BOTTOM_CENTER });
    console.log(` [Manual Refresh] 刷新完成，戶別數量: ${salesHouseholds.value.length}`);
  } catch (err) {
    toast.error('❌ 資料更新失敗: ' + err.message, { position: POSITION.BOTTOM_CENTER });
    console.error('❌ [Manual Refresh] 刷新失敗:', err);
  } finally {
    isRefreshing.value = false;
  }
};

async function loadCurrentProjectData(targetId) {
  if (!targetId) return;
  console.log(`🏗️ [SalesControlSystem] 開始載入銷控資料: ${targetId}`);
  loading.value = true;
  error.value = null;
  try {
    await salesDataStore.loadProjectData(targetId);
    await textStyleStore.fetchStyles(targetId);
    await statusColorStore.fetchColors(targetId);
    console.log(` [SalesControlSystem] 數據載入完成，戶別數量: ${salesHouseholds.value.length}`);
    if (import.meta.env.DEV) {
      const stats = salesDataStore.getCacheStats;
      console.group('📊 銷控系統緩存統計');
      console.log('Cache Hit Rate:', stats.cacheHitRate);
      console.log('Active Listeners:', stats.activeListeners);
      console.log('Cache Details:', stats.cacheDetails);
      console.groupEnd();
    }
  } catch (err) {
    error.value = `讀取銷控資料時發生錯誤: ${err.message}`;
    console.error('❌ [SalesControlSystem] 銷控資料載入失敗:', err);
    if (salesDataStore.getProjectData(targetId).households.length > 0) {
      console.log('⚠️ [SalesControlSystem] 使用緩存數據作為備用');
      error.value = null;
    }
  } finally {
    loading.value = false;
  }
}

// 切換建案時（router.push 改變 route.params.projectName）重新載入新建案的資料
// 元件不會 remount，所以 onMounted 不會再跑；需要 watch projectId 來補載入
watch(projectId, async (newId, oldId) => {
  if (!newId || newId === oldId) return;
  console.log(`🔄 [SalesControlSystem] 偵測到建案切換: ${oldId} → ${newId}`);
  reportSnackbarShown.value = false; // 新建案重置實價登錄提醒
  subscribeQuotePlans(newId); // ✅ [新增] 重新監聽新建案的方案清單
  await loadCurrentProjectData(newId);
});

onMounted(async () => {
  // 載入所有可用的建案列表
  if (projectStore.projectsList.length === 0) {
    await projectStore.fetchProjects();
  }

  subscribeQuotePlans(projectId.value); // ✅ [新增] 監聽方案清單（可選方案編輯/上傳/匯出用）
  await loadCurrentProjectData(projectId.value);

  // 檢查是否需要保持 AnalyticsPanel 打開
  if (sessionStorage.getItem('keepAnalyticsPanelOpen') === 'true') {
    await nextTick();
    isAnalyticsPanelVisible.value = true;
    sessionStorage.removeItem('keepAnalyticsPanelOpen');
    console.log('📊 [SalesControlSystem] AnalyticsPanel 已重新打開');
  }
});

onUnmounted(() => {
  console.log('🧹 [SalesControlSystem] 組件卸載');
  if (unsubQuotePlans) unsubQuotePlans(); // ✅ [新增] 停止監聽方案清單
});

// Export/Upload methods (Keeping same)
const exportToExcel = () => {
    if (salesHouseholds.value.length === 0) {
        toast.info('目前沒有資料可匯出。', { position: POSITION.BOTTOM_CENTER });
        return;
    }
    const sortedItems = [...salesHouseholds.value].sort((a, b) => {
        const buildingCompare = String(a.building).localeCompare(String(b.building), 'zh-TW', { numeric: true });
        if (buildingCompare !== 0) return buildingCompare;
        return String(a.unitId).localeCompare(String(b.unitId), 'zh-TW', { numeric: true });
    });

    // 車位加值欄位（僅供檢視，上傳時非 COLUMN_DEFINITIONS 標頭會被自動忽略）
    const allParkings = salesParkings.value || [];
    const PARKING_EXTRA_HEADERS = ['車位編號及價格', '車位合計底價', '合計車位價格', '合計成交總價', '合計成交底價'];

    const dataAsArray = sortedItems.map(item => {
        const row = exportOrder.value.map(key => {
            const value = item[key];
            if (key === 'buyerDateOfBirth') {
                if (!value) return '';
                // 1. 新格式 { year, month, day }
                if (typeof value === 'object' && 'year' in value) {
                    return `${value.year}年${value.month}月${value.day}日`;
                }
                // 2. 舊格式 (Timestamp / Date)
                let dateObj;
                if (typeof value.toDate === 'function') {
                    dateObj = value.toDate();
                } else if (value instanceof Date) {
                    dateObj = value;
                } else {
                    // 嘗試解析字串
                    const d = new Date(value);
                    if (!isNaN(d.getTime())) dateObj = d;
                }

                if (dateObj) {
                    const rocYear = dateObj.getFullYear() - 1911;
                    const month = dateObj.getMonth() + 1;
                    const day = dateObj.getDate();
                    return `${rocYear}年${month}月${day}日`;
                }
                return '';
            }

            if (key === 'salesImages' && Array.isArray(value)) {
                return value.join(',');
            }
            // ✅ [新增] 文字標籤：unitTags 陣列 → 三欄逗號分隔（依索引對齊，上傳時合併回陣列）
            if (key === 'unitTags_text' || key === 'unitTags_bgColor' || key === 'unitTags_textColor') {
                return unitTagsToExportColumns(item.unitTags)[key];
            }
            // ✅ [新增] 可選方案：id 陣列 → 方案名稱逗號分隔（失效 id 不輸出），重新上傳時再反查回 id
            if (key === 'availablePlans') {
                return planIdsToNames(value).join(',');
            }
            // 銷售人員（複選）：陣列以逗號分隔匯出，重新上傳時再解析回陣列
            if (key === 'salesperson' || key === 'salespersonUserKey') {
                return formatSalespersons(value, ',', '');
            }
            if (value instanceof Date) {
                return value.toISOString().split('T')[0];
            }
            if (typeof value === 'boolean') {
                return value ? 'TRUE' : 'FALSE';
            }
            if (value && typeof value.toDate === 'function') { 
                return value.toDate().toISOString().split('T')[0];
            }
            return value;
        });

        // 車位編號及價格（複數以逗號區隔）、車位合計底價、合計車位價格、合計成交總價（房屋成交價+合計車位價格）、合計成交底價（房屋總底價+車位合計底價，僅銷控後台狀態不為空時輸出）
        const mySpots = getUnitParkings(item, allParkings);
        const parkingText = mySpots
            .map(p => `${p.spotId ?? ''}(${Number(p.price_transaction) || 0})`)
            .join(',');
        const parkingFloorTotal = getParkingFloorTotal(item, allParkings);
        const parkingTotal = getParkingTransactionTotal(item, allParkings);
        const grandTotal = getUnitTotalTransactionPrice(item, allParkings);
        const hasBackendStatus = String(item.salesStatus_backend || '').trim() !== '';
        const grandFloorTotal = hasBackendStatus ? getUnitTotalFloorPrice(item, allParkings) : '';
        row.push(parkingText, mySpots.length > 0 ? parkingFloorTotal : '', mySpots.length > 0 ? parkingTotal : '', grandTotal || '', grandFloorTotal || '');
        // ✅ [新增] 第一欄輸出 Firestore 文件ID（僅供識別，上傳時非 COLUMN_DEFINITIONS 標頭會被自動忽略）
        row.unshift(item.id || `${projectId.value}_${item.unitId}`);
        return row;
    });

    const exportHeaders = ['文件ID', ...chineseHeaders.value, ...PARKING_EXTRA_HEADERS];
    const warningRow = ['注意：為確保資料能正確重新上傳，請勿修改第二列的標頭名稱。'];
    const dataWithHeader = [warningRow, exportHeaders, ...dataAsArray];
    const ws = XLSX.utils.aoa_to_sheet(dataWithHeader);

    const warningStyle = { font: { color: { rgb: "FFFF0000" }, bold: true }, fill: { fgColor: { rgb: "FFFFFF00" } } };
    ws['A1'].s = warningStyle;

    if (!ws['!merges']) ws['!merges'] = [];
    ws['!merges'].push({ s: { r: 0, c: 0 }, e: { r: 0, c: exportHeaders.length - 1 } });

    const headerStyle = { font: { bold: true }, fill: { fgColor: { rgb: "FFD3D3D3" } } };
    const range = XLSX.utils.decode_range(ws['!ref']);
    for (let C = range.s.c; C <= range.e.c; ++C) {
        const address = XLSX.utils.encode_cell({ r: 1, c: C });
        if(ws[address]) ws[address].s = headerStyle;
    }
    ws['!freeze'] = { ySplit: 2 };
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, HOUSEHOLDS_SHEET_NAME);

    // ── Sheet 2：土地標的清冊（一戶 N 筆 → N 列） ──
    const landParcelRows = [];
    for (const item of sortedItems) {
        const parcels = Array.isArray(item.landParcels) ? item.landParcels : [];
        for (const parcel of parcels) {
            landParcelRows.push(landParcelToRow(parcel, item.unitId));
        }
    }
    const landSheetData = [LAND_PARCEL_HEADERS, ...landParcelRows];
    const wsLand = XLSX.utils.aoa_to_sheet(landSheetData);
    // 套用灰色標頭樣式
    const landRange = XLSX.utils.decode_range(wsLand['!ref']);
    for (let C = landRange.s.c; C <= landRange.e.c; ++C) {
        const address = XLSX.utils.encode_cell({ r: 0, c: C });
        if (wsLand[address]) wsLand[address].s = headerStyle;
    }
    wsLand['!freeze'] = { ySplit: 1 };
    // 合理欄寬
    wsLand['!cols'] = LAND_PARCEL_COLUMNS.map(c => {
        if (c.key === 'section' || c.key === 'zoneText') return { wch: 18 };
        if (c.key === 'unitId' || c.key === 'district' || c.key === 'city') return { wch: 10 };
        return { wch: 12 };
    });
    XLSX.utils.book_append_sheet(wb, wsLand, LAND_PARCEL_SHEET_NAME);

    const exportFileName = projectName.value || 'unknown-project';
    XLSX.writeFile(wb, `${exportFileName}_戶別資料備份_${new Date().toISOString().slice(0, 10)}.xlsx`);
};

const closeUploadDialog = () => {
    uploadDialog.value = false;
    uploadedFile.value = null;
    parsedData.value = [];
    uploadMessage.value = '';
};

const handleFileChange = () => {
    uploadMessage.value = '';
    const file = uploadedFile.value;
    if (!file) {
        parsedData.value = [];
        return;
    }
    isParsing.value = true;
    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const headerToKeyMap = new Map(COLUMN_DEFINITIONS.map(col => [col.title.trim(), col.key]));
            const data = new Uint8Array(e.target.result);
            const workbook = XLSX.read(data, { type: 'array', cellDates: true });
            // Sheet 1 戶別資料：優先以名稱查找，fallback 為首工作表（向後相容舊檔）
            const sheetName = workbook.SheetNames.includes(HOUSEHOLDS_SHEET_NAME)
                ? HOUSEHOLDS_SHEET_NAME
                : workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            // ✅ [優化] 部分欄位上傳：不再要求所有欄位標頭齊備，只需「戶別」+ 至少一個可更新欄位。
            // 標頭列自動偵測（前 5 列內含「戶別」儲存格者），相容系統範本（標頭在第 2 列，第 1 列為警語）
            // 與自製精簡檔（標頭在第 1 列）；檔案中未包含的欄位不會被異動（後端 merge 寫入保留既有值）
            const allRows = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
            const headerRowIndex = allRows.findIndex((row, i) =>
                i < 5 && Array.isArray(row) && row.some(c => String(c || '').trim() === '戶別')
            );
            if (headerRowIndex === -1) {
                throw new Error('找不到標頭列：檔案前 5 列中必須有「戶別」欄位標頭。');
            }
            const uploadedHeaders = allRows[headerRowIndex].map(h => String(h || '').trim());
            const indexToKeyMap = new Map();
            uploadedHeaders.forEach((headerTitle, index) => {
                const englishKey = headerToKeyMap.get(headerTitle);
                if (englishKey) {
                    indexToKeyMap.set(index, englishKey);
                }
            });
            const updatableKeys = [...indexToKeyMap.values()].filter(k => k !== 'unitId');
            if (updatableKeys.length === 0) {
                throw new Error('除了「戶別」外，未偵測到任何可更新的欄位標頭，請確認欄位名稱與系統匯出範本一致。');
            }
            const dataRows = allRows.slice(headerRowIndex + 1);
            const nonEmptyRows = dataRows.filter(row => row.some(cell => cell !== null && cell !== undefined && cell !== ''));
            // ✅ [新增] 可選方案：名稱反查失敗的收集器（不擋整批，解析完成後警示）
            const unknownPlanNames = new Set();
            // ✅ [新增] 文字標籤：色碼格式警示收集器
            const tagWarnings = [];
            const TAG_IMPORT_KEYS = ['unitTags_text', 'unitTags_bgColor', 'unitTags_textColor'];
          const jsonDataWithEnglishKeys = nonEmptyRows.map(rowArray => {
                const newRow = {};
                for (const [colIndex, englishKey] of indexToKeyMap.entries()) {
                    let value = rowArray[colIndex] ?? null;

                    // ✅ [新增] 針對布林值欄位進行轉換
                    if (['isPreferredPayment', 'isFirstTimeBuyer'].includes(englishKey)) {
                        if (typeof value === 'string') {
                            const upperVal = value.toUpperCase().trim();
                            if (upperVal === 'TRUE') value = true;
                            if (upperVal === 'FALSE') value = false;
                        }
                    }

                    // ✅ [新增] 針對 buyerDateOfBirth 進行民國年解析
                    if (englishKey === 'buyerDateOfBirth' && typeof value === 'string') {
                        // 嘗試解析 "114年5月4日" 或 "114/5/4" 等格式
                        const rocDateRegex = /^(\d{2,3})[年/](\d{1,2})[月/](\d{1,2})日?$/;
                        const match = value.match(rocDateRegex);
                        if (match) {
                            value = {
                                year: Number(match[1]),
                                month: Number(match[2]),
                                day: Number(match[3])
                            };
                        }
                    }

                    // ✅ [新增] 銷售人員（複選）：逗號分隔字串解析回陣列
                    if (englishKey === 'salesperson' || englishKey === 'salespersonUserKey') {
                        value = normalizeSalespersons(value);
                    }

                    // ✅ [新增] 可選方案：方案名稱（逗號/頓號分隔）反查回方案 id 陣列；
                    // 查不到的名稱收集警示後略過；空儲存格 → 清空該戶設定
                    if (englishKey === 'availablePlans') {
                        const raw = (value === null || value === undefined) ? '' : String(value);
                        const names = raw.split(/[,、]/).map(s => s.trim()).filter(Boolean);
                        const ids = [];
                        names.forEach(n => {
                            const id = planNameToId.value.get(n);
                            if (id) ids.push(id);
                            else unknownPlanNames.add(n);
                        });
                        value = ids;
                    }

                    newRow[englishKey] = value;
                }

                // ✅ [新增] 文字標籤：三個虛擬欄位合併回 unitTags 陣列（任一欄存在即處理；
                // 「文字標籤」欄空白 → 清空該戶標籤；顏色缺漏/不合法 → 回退預設並收集警示）
                if (TAG_IMPORT_KEYS.some(k => k in newRow)) {
                    const parsed = parseUnitTagsFromExport(
                        newRow.unitTags_text, newRow.unitTags_bgColor, newRow.unitTags_textColor, String(newRow.unitId || '')
                    );
                    newRow.unitTags = parsed.tags;
                    tagWarnings.push(...parsed.warnings);
                    for (const k of TAG_IMPORT_KEYS) delete newRow[k];
                }
                return newRow;
            });
            if (jsonDataWithEnglishKeys.some(row => !row.unitId)) {
                throw new Error("資料驗證失敗：每一列都必須包含『戶別』。請檢查上傳的檔案。");
            }

            // ── 解析 Sheet 2「土地標的清冊」(可選工作表) ──
            const landSheet = workbook.Sheets[LAND_PARCEL_SHEET_NAME];
            const landParcelsByUnit = new Map(); // unitId -> landParcel[]
            if (landSheet) {
                const landRowsJson = XLSX.utils.sheet_to_json(landSheet, { defval: '' });
                // 驗證標頭：若工作表存在則所有欄位標頭必須齊備
                const sampleRow = landRowsJson[0] || {};
                const presentHeaders = new Set(Object.keys(sampleRow));
                const missingLandHeaders = LAND_PARCEL_COLUMNS
                    .map(c => c.title)
                    .filter(t => !presentHeaders.has(t));
                if (landRowsJson.length > 0 && missingLandHeaders.length > 0) {
                    throw new Error(
                        `「${LAND_PARCEL_SHEET_NAME}」工作表缺少欄位標頭：${missingLandHeaders.join('、')}`
                    );
                }

                // 行號在 Excel 中從第 2 列開始（第 1 列是標頭）
                const errors = [];
                const unitIdSet = new Set(jsonDataWithEnglishKeys.map(r => String(r.unitId || '').trim()));

                landRowsJson.forEach((row, i) => {
                    // 整列全空白則跳過（不計入錯誤）
                    const hasAnyValue = Object.values(row).some(v => v !== null && v !== undefined && String(v).trim() !== '');
                    if (!hasAnyValue) return;

                    const excelRowNo = i + 2;
                    const { parcel, unitId, errors: rowErrors } = rowToLandParcel(row, excelRowNo);
                    errors.push(...rowErrors);

                    if (unitId && !unitIdSet.has(unitId)) {
                        errors.push(`第 ${excelRowNo} 列：戶別「${unitId}」不存在於「${HOUSEHOLDS_SHEET_NAME}」工作表`);
                        return;
                    }
                    if (!unitId) return; // 已在 rowToLandParcel 回報

                    if (!landParcelsByUnit.has(unitId)) landParcelsByUnit.set(unitId, []);
                    landParcelsByUnit.get(unitId).push(parcel);
                });

                if (errors.length > 0) {
                    throw new Error(
                        `「${LAND_PARCEL_SHEET_NAME}」工作表驗證失敗（整批拒絕）：\n- ${errors.join('\n- ')}`
                    );
                }
            }

            // ── 合併 landParcels 至戶別資料 ──
            // 規則：檔案「含」土地標的清冊工作表 → 該戶有列則覆寫、無列則清空；
            //      檔案「沒有」該工作表 → 完全不異動 landParcels（merge 寫入保留既有值，支援部分欄位上傳）
            if (landSheet) {
                for (const row of jsonDataWithEnglishKeys) {
                    const key = String(row.unitId || '').trim();
                    row.landParcels = landParcelsByUnit.get(key) || [];
                }
            }

            parsedData.value = jsonDataWithEnglishKeys;
            uploadMessageType.value = 'success';
            const landCount = [...landParcelsByUnit.values()].reduce((s, a) => s + a.length, 0);
            uploadMessage.value = landSheet
                ? `成功解析 ${jsonDataWithEnglishKeys.length} 筆戶別資料（將更新 ${updatableKeys.length} 個欄位），含 ${landCount} 筆土地標的，可以開始上傳。`
                : `成功解析 ${jsonDataWithEnglishKeys.length} 筆戶別資料（將更新 ${updatableKeys.length} 個欄位；檔案未包含的欄位不會被異動），可以開始上傳。`;
            // ✅ [新增] 可選方案名稱反查失敗警示（不擋上傳，該名稱已略過）
            if (unknownPlanNames.size > 0) {
                uploadMessageType.value = 'warning';
                uploadMessage.value += `\n注意：以下方案名稱不存在，已略過：${[...unknownPlanNames].join('、')}`;
            }
            // ✅ [新增] 文字標籤色碼格式警示（不擋上傳，已回退預設色）
            if (tagWarnings.length > 0) {
                uploadMessageType.value = 'warning';
                const shown = tagWarnings.slice(0, 5);
                uploadMessage.value += `\n標籤提醒：${shown.join('；')}${tagWarnings.length > 5 ? `…（共 ${tagWarnings.length} 筆）` : ''}`;
            }
        } catch (err) {
            uploadMessageType.value = 'error';
            uploadMessage.value = err.message || '解析檔案失敗，請使用系統匯出的範本。';
            parsedData.value = [];
        } finally {
            isParsing.value = false;
        }
    };
    reader.readAsArrayBuffer(file);
};

const uploadData = async () => {
    if (parsedData.value.length === 0) {
        uploadMessageType.value = 'warning';
        uploadMessage.value = '沒有可上傳的資料。';
        return;
    }
    isUploading.value = true;
    uploadMessage.value = '';
    try {
        const result = await uploadHouseholds(projectId.value, parsedData.value);
        if (result.status === 'success') {
          uploadMessageType.value = 'success';
          uploadMessage.value = result.message || '戶別資料已成功上傳更新！';
          setTimeout(() => {
            closeUploadDialog();
          }, 2000); 
        } else {
          throw new Error(result.message || '發生未知錯誤');
        }
    } catch (err) {
        uploadMessageType.value = 'error';
        uploadMessage.value = `上傳失敗: ${err.message}`;
    } finally {
        isUploading.value = false;
    }
};

</script>

<style scoped>
/* --- 資料透視：狀態勾選列高度收斂 --- */
.pivot-status-chips .v-chip-group__content,
.pivot-status-chips {
  padding-top: 0;
  padding-bottom: 0;
}

/* --- 資料透視：可排序表頭 --- */
.pivot-sortable {
  cursor: pointer;
  white-space: nowrap;
  user-select: none;
}
.pivot-sortable:hover {
  background-color: #eceff1 !important;
}

/* --- 資料透視：三欄式版面（左欄位 / 中設定 / 右結果） --- */
.pivot-layout-card {
  height: 92vh;
}
.pivot-layout {
  display: flex;
  min-height: 0;
  overflow: hidden;
  background-color: #f5f6f8;
}
.pivot-pane {
  padding: 12px;
  overflow-y: auto;
  min-height: 0;
}
.pivot-pane-title {
  font-size: 13px;
  font-weight: 700;
  color: #37474f;
  margin-bottom: 8px;
  display: flex;
  align-items: center;
  gap: 4px;
  flex-shrink: 0;
}
/* 左：欄位清單 */
.pivot-pane-fields {
  width: 240px;
  flex-shrink: 0;
  background: #ffffff;
  border-right: 1px solid #eceff1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
/* 左側欄位過濾框：縮小尺寸（高 30px、小字級、小圖示） */
/* v-text-field 預設 flex:1 1 auto，在直向 flex 容器內會被垂直撐開，必須固定為內容高度 */
.pivot-field-search {
  flex: 0 0 auto !important;
}
.pivot-field-search :deep(.v-field) {
  --v-field-padding-start: 6px;
  font-size: 12.5px;
}
.pivot-field-search :deep(.v-field__input) {
  min-height: 30px;
  padding-top: 2px;
  padding-bottom: 2px;
}
.pivot-field-search :deep(.v-field__prepend-inner .v-icon),
.pivot-field-search :deep(.v-field__clearable .v-icon) {
  font-size: 16px;
}
.pivot-field-search :deep(.v-field__prepend-inner),
.pivot-field-search :deep(.v-field__clearable) {
  padding-top: 4px;
}
.pivot-field-list {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  border: 1px solid #eceff1;
  border-radius: 6px;
}
.pivot-field-item {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 5px 8px;
  font-size: 12.5px;
  color: #37474f;
  cursor: grab;
  border-bottom: 1px solid #f5f5f5;
  user-select: none;
}
.pivot-field-item:hover {
  background-color: #e8eaf6;
}
.pivot-field-item.used {
  color: #9e9e9e;
}
.pivot-field-item:active {
  cursor: grabbing;
}
.pivot-field-label {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.pivot-field-count {
  background-color: #eef0fb;
  font-weight: 700;
  position: sticky;
  top: 0;
  z-index: 1;
}
/* 中：列/欄/值/篩選器 */
.pivot-pane-editor {
  width: 322px;
  flex-shrink: 0;
  border-right: 1px solid #eceff1;
  background: #fafbfc;
}
.pivot-zone {
  background: #ffffff;
  border: 1px dashed #cfd8dc;
  border-radius: 8px;
  padding: 8px 10px;
  margin-bottom: 10px;
  transition: border-color 0.15s ease, background-color 0.15s ease;
}
.pivot-zone.drag-over {
  border-color: #3949ab;
  border-style: solid;
  background-color: #e8eaf6;
}
.pivot-zone-title {
  font-size: 12.5px;
  font-weight: 700;
  color: #455a64;
  margin-bottom: 6px;
  display: flex;
  align-items: center;
  gap: 4px;
}
.pivot-value-entry {
  background-color: #f5f6f8;
  border-radius: 6px;
  padding: 6px;
}
/* 值的彙總切換：小型按鈕組，避免下拉文字截斷 */
.pivot-agg-toggle {
  height: 26px;
}
.pivot-agg-toggle :deep(.v-btn) {
  height: 26px !important;
  min-width: 0;
  padding: 0 8px;
  font-size: 12px;
}
/* 值/篩選器的選擇器內文字完整顯示（縮小內距與字級） */
.pivot-value-entry :deep(.v-field__input),
.pivot-filter-entry :deep(.v-field__input) {
  font-size: 13px;
  padding-left: 8px;
  padding-right: 0;
}
.pivot-filter-entry {
  background-color: #f5f6f8;
  border-radius: 6px;
  padding: 4px 6px;
}
/* 右：分析結果（flex 欄位配置：表格永遠在可視範圍內，水平捲軸不會被推到看不到的地方） */
.pivot-pane-result {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
.pivot-table-wrap {
  background: #ffffff;
  border: 1px solid #eceff1;
  border-radius: 8px;
  overflow: auto;
  flex: 1 1 auto;
  min-height: 180px;
}
/* 資料欄過多時：水平捲軸加大並常駐顯示 */
.pivot-table-wrap::-webkit-scrollbar {
  height: 12px;
  width: 12px;
}
.pivot-table-wrap::-webkit-scrollbar-thumb {
  background-color: #90a4ae;
  border-radius: 6px;
  border: 2px solid #ffffff;
}
.pivot-table-wrap::-webkit-scrollbar-thumb:hover {
  background-color: #607d8b;
}
.pivot-table-wrap::-webkit-scrollbar-track {
  background-color: #eceff1;
  border-radius: 6px;
}
.pivot-table-wrap {
  scrollbar-width: auto;
  scrollbar-color: #90a4ae #eceff1; /* Firefox */
}
/* 表格欄位不自動換行壓縮，超出寬度時走水平捲動 */
.pivot-table-wrap :deep(th),
.pivot-table-wrap :deep(td) {
  white-space: nowrap;
}
.pivot-result-hint {
  flex-shrink: 0;
}
.pivot-chart-block {
  flex-shrink: 0;
  max-height: 42%;
  overflow-y: auto;
}
/* 窄螢幕：改為上下堆疊 */
@media (max-width: 1264px) {
  .pivot-layout {
    flex-direction: column;
    overflow-y: auto;
  }
  .pivot-pane-fields,
  .pivot-pane-editor {
    width: 100%;
    border-right: none;
    border-bottom: 1px solid #eceff1;
  }
  .pivot-field-list {
    max-height: 200px;
  }
  /* 堆疊模式：結果區改回一般流式排版，表格自身限制高度 */
  .pivot-pane-result {
    display: block;
    overflow: visible;
  }
  .pivot-table-wrap {
    max-height: 60vh;
  }
  .pivot-chart-block {
    max-height: none;
  }
}

/* --- 資料透視：可點擊下鑽的儲存格 --- */
.pivot-cell-click {
  cursor: pointer;
}
.pivot-cell-click:hover {
  background-color: #e8eaf6;
}
.pivot-cell-sub {
  font-size: 11px;
  color: #757575;
  line-height: 1.2;
  white-space: nowrap;
}

/* --- 資料透視：橫向長條圖（單一序列） --- */
.pivot-chart-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 6px;
  cursor: pointer;
}
.pivot-chart-row:hover .pivot-chart-bar {
  opacity: 0.8;
}
.pivot-chart-label {
  width: 140px;
  flex-shrink: 0;
  text-align: right;
  font-size: 12px;
  color: #424242;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.pivot-chart-track {
  flex: 1;
  min-width: 0;
}
.pivot-chart-bar {
  height: 14px;
  background-color: #3949ab;
  border-radius: 0 4px 4px 0;
}
.pivot-chart-bar.neg {
  background-color: #d84315;
}
.pivot-chart-value {
  min-width: 76px;
  flex-shrink: 0;
  font-size: 12px;
  color: #424242;
}

/* 實價登錄提醒 Dialog：固定 85vh 高度 + 內部 card-text 捲動 */
.report-reminder-card {
  height: 85vh;
  max-height: 85vh;
}
.report-reminder-body {
  flex: 1 1 auto;
  min-height: 0;
  overflow-y: auto;
}

/* Project 選擇器樣式 */
.project-selector {
  min-width: 150px;
  max-width: 200px;
}

.mobile-project-selector {
  width: 100%;
  padding: 0 12px;
}

/* (原本的 CSS 樣式全部保留) */
.sales-control-page {
  /* 扣除 Vuetify layout 實際預留的 app-bar / bottom-navigation 高度（由 v-main 提供變數） */
  height: calc(100vh - var(--v-layout-top, 0px) - var(--v-layout-bottom, 0px));
  height: calc(100dvh - var(--v-layout-top, 0px) - var(--v-layout-bottom, 0px));
  background-color: #f0f2f5;
  padding: 16px;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding-bottom: 20px; 
overflow: hidden; 
}

/* ✅ [新增] 手機版專用修正 */
@media (max-width: 960px) {
  .sales-control-page {
    /* 高度沿用上方 layout 變數計算（含底部導覽列預留），這裡只縮小 padding 爭取空間 */
    padding: 10px;
  }
}
.grid-wrapper {
  flex-grow: 1;
  display: flex;
  justify-content: center;
  overflow: hidden;
}
.toolbar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  /* 左側留空給全域浮動漢堡鈕（fixed 左上角，寬約 50px），避免遮到建案選單 */
  padding: 6px 12px 6px 58px;
  row-gap: 6px;
  column-gap: 12px;
  flex-shrink: 0;
  background-color: #ffffff;
  border-bottom: 1px solid #eceff1;
}
.toolbar-group {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  min-width: 0;
}
.toolbar-group-title {
  flex: 1 1 auto;
  min-width: 0;
}
.toolbar-group-actions {
  margin-left: auto;
}
.toolbar-divider {
  width: 1px;
  height: 28px;
  background-color: #e0e0e0;
  flex-shrink: 0;
  align-self: center;
}
.toolbar-title {
  font-size: 1.15rem;
  font-weight: 600;
  color: #37474f;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  min-width: 0;
  flex: 0 1 auto;
  max-width: 280px;
}

/* 縮小螢幕時讓操作群組可以換行，並讓分隔線在換行後消失 */
@media (max-width: 1400px) {
  .toolbar-divider {
    display: none;
  }
}
.layout-grid {
  display: grid;
  grid-template-columns: 0px 40px 1fr;
  grid-template-rows: 50px 1fr;
  overflow: hidden;
  
  /* ✅ [修改] 寬度設定 */
  /* width: 100%;  <-- 移除或註解掉原本的 100% */
  width: fit-content;  /* 讓寬度根據內容自動縮放 */
  max-width: 100%;     /* 限制最大寬度不超過螢幕 (原本有設 95vw 也可維持) */
  
  /* ✅ [新增] 水平置中 */
  margin: 0 auto;      
  
  /* 高度維持填滿，確保背景色與捲動功能正常 */
  height: 100%; 
}
.content-wrapper {
  flex-grow: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden; /* 防止內容溢出導致外層滾動 */
  
  /* ✅ [建議新增] 確保 wrapper 也是填滿的狀態 */
  height: 100%; 
  position: relative; 
}
.header-top-left {
  grid-column: 2;
  grid-row: 1;
  background-color: #f0f2f5;
  z-index: 3;
}
.header-top-container {
  grid-column: 3;
  grid-row: 1;
  background-color: #f0f2f5;
  overflow: hidden;
  z-index: 2;
  display: flex;
  align-items: center;
  padding-right: 17px;
  box-sizing: content-box;
}
.header-left-container {
  grid-column: 2;
  grid-row: 2;
  background-color: #f0f2f5;
  overflow: hidden;
  z-index: 2;
  box-sizing: border-box;
  padding-bottom: 17px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding-top: 5px;
}
.main-grid-container {
  grid-column: 3;
  grid-row: 2;
  overflow: auto;
  z-index: 1;
}
.header-cell {
  background-color: #1a3a6e;
  color: white;
  display: flex;
  justify-content: center;
  align-items: center;
  font-weight: bold;
  border-radius: 6px;
  flex-shrink: 0;
}
.header-top-container .header-cell {
  width: 120px;
  height: 40px;
  margin-left: 12px;
}
.header-left-container .header-cell {
  width: 40px;
  height: 90px;
}
.grid-table {
  display: grid;
  gap: 10px 12px;
  padding: 5px 16px 5px 12px;
  width: max-content;
  grid-template-columns: repeat(v-bind('buildingHeaders.length'), 120px);
  grid-auto-rows: 90px;
}
.unit-card {
  position: relative;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  width: 100%;
  height: 100%;
  border-radius: 6px;
  border: 2px solid transparent;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  padding: 6px 4px;
  box-sizing: border-box;
  cursor: pointer;
  transition: all 0.2s ease-in-out;
  text-align: center;
}

/* ✅ 新增：有露臺戶別的特殊邊框或角標感 */
.unit-card.has-terrace {
  /* 增加一個內陰影或左側邊條，讓它在網格中一眼就能被辨識 */
  box-shadow: inset 5px 0 0 0 #4CAF50 !important; 
  background-image: linear-gradient(to right, rgba(76, 175, 80, 0.1), transparent) !important;
}

/* ✅ [優化] 露臺標示小 chip：取代原本的 mdi-balcony 圖示，文字直接可讀 */
.terrace-chip {
  display: inline-block;
  vertical-align: middle;
  margin-left: 4px;
  padding: 0 5px;
  border-radius: 8px;
  background-color: #4CAF50;
  color: #fff;
  font-size: 0.6rem;
  font-weight: 400;
  line-height: 15px;
  letter-spacing: 0.5px;
  white-space: nowrap;
  cursor: help;
}

/* ✅ [新增] 文字標籤帶：右上角獨立一條 14px 空間，內容整體下移不與戶別名稱重疊 */
.unit-card.has-tags {
  padding-top: 18px;
}
.unit-tags-strip {
  position: absolute;
  top: 2px;
  right: 3px;
  left: 3px;
  height: 14px;
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 2px;
  overflow: hidden;
  pointer-events: none;
}
/* 報價 ✔ 徽章佔右上角時，標籤帶左移讓開 */
.unit-card.in-quote .unit-tags-strip {
  right: 24px;
}
.unit-tag-chip {
  display: inline-block;
  max-width: 48px;
  height: 13px;
  line-height: 13px;
  padding: 0 4px;
  border-radius: 7px;
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 0.2px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  border: 1px solid rgba(255, 255, 255, 0.85);
  box-shadow: 0 0 0 0.5px rgba(0, 0, 0, 0.15);
  box-sizing: border-box;
}
.unit-tag-more {
  background-color: #eceff1;
  color: #455a64;
  max-width: none;
}
/* 列表 / tooltip / 篩選選單用的較大尺寸 */
.unit-tag-chip--lg {
  max-width: 120px;
  height: 20px;
  line-height: 18px;
  padding: 0 8px;
  border-radius: 10px;
  font-size: 11px;
}
.unit-card.in-quote {
  border-color: #ff9800;
  box-shadow: 0 0 10px rgba(255, 152, 0, 0.5);
}
.unit-card.in-quote::after {
  content: '✔';
  position: absolute;
  top: 2px;
  right: 5px;
  color: white;
  background-color: #ff9800;
  border-radius: 50%;
  width: 18px;
  height: 18px;
  font-size: 12px;
  line-height: 18px;
  text-align: center;
  font-weight: bold;
}
.unit-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
}
.unit-card.empty {
  background-color: #e9ecef;
  box-shadow: none;
  cursor: default;
}
/* ✅ [新增] 網格模式篩選：不符合篩選條件的戶別淡化顯示（保留棟別/樓層位置脈絡） */
.unit-card.filtered-out {
  opacity: 0.15;
  filter: grayscale(1);
}
.unit-card.filtered-out:hover {
  opacity: 0.5;
}
.unit-name {
  font-size: 0.95rem;
  font-weight: 600;
  color: #1a237e;
}
.unit-total-price {
  font-size: 0.95rem;
  font-weight: 700;
  color: #d81b60;
}
.unit-area {
  font-size: 0.8rem;
  font-weight: 700;
  color: #37474f;
}
.unit-per-price {
  font-size: 0.8rem;
  font-weight: 400;
  color: #546e7a;
}
.sold-text {
  font-weight: 700;
  color: #424242;
  letter-spacing: 2px;
}
/* ✅ [新增] 網格顯示簽約日期：與價格區隔的色系、稍縮字級避免溢出 */
.contract-date-text {
  font-size: 0.85rem;
  color: #00695c;
}
.status-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: rgba(240, 242, 245, 0.9);
  z-index: 10;
  transition: opacity 0.3s ease;
}
.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
}
.loading-text {
  font-size: 1rem;
  font-weight: 500;
  color: #37474f;
}
.error-text {
  font-size: 1.2rem;
  color: #d32f2f;
  font-weight: bold;
  padding: 16px;
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.15);
}
.loader {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  position: relative;
  animation: rotate 1s linear infinite
}
.loader::before {
  content: "";
  box-sizing: border-box;
  position: absolute;
  inset: 0px;
  border-radius: 50%;
  border: 5px solid #008cff;
  animation: prixClipFix 2s linear infinite ;
}
@keyframes rotate {
  100% {transform: rotate(360deg)}
}
@keyframes prixClipFix {
  0% {clip-path:polygon(50% 50%,0 0,0 0,0 0,0 0,0 0)}
  25% {clip-path:polygon(50% 50%,0 0,100% 0,100% 0,100% 0,100% 0)}
  50% {clip-path:polygon(50% 50%,0 0,100% 0,100% 100%,100% 100%,100% 100%)}
  75% {clip-path:polygon(50% 50%,0 0,100% 0,100% 100%,0 100%,0 100%)}
  100% {clip-path:polygon(50% 50%,0 0,100% 0,100% 100%,0 100%,0 0)}
}

.iframe-container {
  width: 100%;
  height: calc(100vh - 48px);
  overflow: hidden;
}
.iframe-container iframe {
  width: 100%;
  height: 100%;
  border: none;
}
/* 📱 [調整] 底部導覽列改近乎不透明＋上緣分隔線：
   半透明會讓下方網格/列表「透出來」，使用者誤以為工具列蓋住內容、也容易點錯 */
.v-bottom-navigation {
  background-color: rgba(255, 255, 255, 0.97) !important;
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  border-top: 1px solid #e5e9f0;
  height: calc(56px + 20px) !important;
  padding-bottom: 20px !important;
}

.v-bottom-navigation .v-btn > .v-btn__content > span {
    font-size: 0.8rem;
}

/* 📱 [新增] 手機版底部面板（顯示設定／全部功能）：外殼樣式在 MobileBottomSheet.vue，此處僅 slot 內容 */
.mobile-sheet-section {
  margin-bottom: 14px;
}
.mobile-sheet-label {
  font-size: .78rem;
  font-weight: 600;
  color: #8493a8;
  margin-bottom: 6px;
}
.mobile-sheet-chip {
  font-weight: 500;
}
.mobile-sheet-chip--active {
  background-color: #1a3a6e !important;
  border-color: #1a3a6e !important;
  color: #ffffff !important;
}
/* 功能磚：4 欄大點按區，分群一覽 */
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

/* 🖥️ [改版] 桌面版工具列「功能」下拉選單：分群磚格（樣式對齊手機版全部功能面板） */
.desktop-tools-menu {
  width: 396px;
  padding: 14px 16px 16px;
  background: #ffffff;
}
.desktop-tools-section {
  margin-bottom: 12px;
}
.desktop-tools-section:last-child {
  margin-bottom: 0;
}
.desktop-tools-label {
  font-size: .75rem;
  font-weight: 700;
  color: #8493a8;
  letter-spacing: .05em;
  margin-bottom: 6px;
}
.desktop-tools-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
}
.desktop-tool {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
  background: #f7f9fc;
  border: 1px solid #e6ebf2;
  border-radius: 12px;
  padding: 12px 6px;
  min-height: 72px;
  cursor: pointer;
  color: #44546a;
  font: inherit;
  transition: background-color .15s ease, border-color .15s ease;
}
.desktop-tool:hover:not(:disabled) {
  background: #eef3fa;
  border-color: #c9d7ec;
}
.desktop-tool:active:not(:disabled) {
  background: #e8eef7;
}
.desktop-tool:disabled {
  opacity: .45;
  cursor: not-allowed;
}
.desktop-tool-icon {
  color: #1a3a6e;
}
.desktop-tool-label {
  font-size: .74rem;
  line-height: 1.25;
  text-align: center;
}
.pre-wrap-alert {
   white-space: pre-wrap;
}
/* 載入狀態改進 */
.loading-container {
  text-align: center;
  padding: 20px;
}

.loading-text {
  margin-top: 16px;
  font-size: 1.1rem;
  font-weight: 500;
  color: #37474f;
}

/* 手動刷新按鈕動畫效果 */
.v-btn:has(.mdi-refresh) {
  transition: transform 0.2s ease;
}

.v-btn:has(.mdi-refresh):hover {
  transform: scale(1.05);
}


/* ------------------------------------------
   🚀 NEW: 列表模式優化 (修正對齊版)
   ------------------------------------------ */

.list-view-container {
  --list-header-height: 44px; /* 表頭高度：th 高度與凍結合計列的 top 共用 */
  width: 100%;
  flex: 1;
  min-height: 0;
  background-color: white;
  border-radius: 8px;
  padding-bottom: 10px; 
  display: flex;
  flex-direction: column;
  
  /* ✅ [新增] 確保如果欄位還是太寬，可以左右滑動而不是崩潰 */
overflow: hidden;
}

/* ✅ 表格高度改由 flex 填滿容器（取代寫死的 calc 高度），捲動在 wrapper 內發生 */
.list-view-container :deep(.v-data-table) {
  flex: 1 1 auto;
  min-height: 0;
}
.list-view-container :deep(.v-data-table > .v-table__wrapper) {
  flex: 1 1 auto;
  min-height: 0;
  overflow: auto;
}


/* 強制單元格內容不換行 (這會自然撐開欄位寬度) */
.compact-table :deep(th),
.compact-table :deep(td) {
  white-space: nowrap !important; /* 關鍵：讓內容撐開寬度 */
  padding: 0 12px !important;     /* 保持緊湊間距 */
}

/* 備註欄位：允許換行，並設定最大寬度，避免把表格撐太寬 */
.compact-table :deep(td:last-child) {
  white-space: normal !important; 
  min-width: 150px;
  max-width: 300px;
  line-height: 1.4;
  font-size: 0.9rem;
}

/* ✅ [新增] 手機版列表：欄位全列出，改用緊湊字體與間距 + 橫向滑動 */
@media (max-width: 959px) {
  .compact-table :deep(th),
  .compact-table :deep(td) {
    padding: 0 8px !important;
    font-size: 0.78rem !important;
  }

  .list-view-container {
    --list-header-height: 38px;
  }
  .list-view-container :deep(.v-data-table-header th) {
    height: var(--list-header-height) !important;
  }

  .list-view-container :deep(tbody tr td) {
    height: 38px !important;
  }

  /* 備註欄在手機上別撐太寬 */
  .compact-table :deep(td:last-child) {
    min-width: 130px;
    max-width: 220px;
    font-size: 0.78rem;
  }

  /* 狀態 Chip / 優付開關縮小，配合緊湊列高 */
  .compact-table :deep(.v-chip) {
    font-size: 0.7rem;
    height: 22px;
  }

  /* 凍結欄（狀態/戶別）右側加陰影，滑動時邊界清楚 */
  .compact-table :deep(.v-data-table-column--last-fixed) {
    box-shadow: 4px 0 6px -2px rgba(0, 0, 0, 0.15);
  }
}

/* ✅ [備註留言] 列表模式備註欄 */
.remark-cell {
  display: flex;
  align-items: center;
  gap: 4px;
  cursor: pointer;
  min-width: 90px;
  max-width: 260px;
  padding: 2px 0;
}
.remark-cell:hover .remark-preview {
  text-decoration: underline;
}
.remark-count {
  font-size: 0.72rem;
  font-weight: 700;
  color: rgb(var(--v-theme-primary));
}
.remark-preview {
  font-size: 0.78rem;
  color: rgba(0, 0, 0, 0.7);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* 表頭樣式微調 */
.list-view-container :deep(.v-data-table-header th) {
  background-color: #f5f5f7 !important;
  font-weight: bold;
  color: #1a3a6e;
  height: var(--list-header-height) !important;
  /* 移除 text-align: left !important，讓 JS 的 align: 'start' 生效 */
}

/* 內容行樣式微調 */
.list-view-container :deep(tbody tr td) {
  height: 40px !important;
  /* 移除 text-align: left !important */
}

/* 數字欄位字體優化 (可選) */
.text-indigo, .text-success, .text-error {
  font-family: 'Roboto', sans-serif; /* 數字用無襯線字體比較好看 */
}

/* 微調表頭開關的樣式 */
.compact-table :deep(.v-switch .v-label) {
  font-size: 0.85rem; /* 縮小標籤文字 */
  color: #666;
  white-space: nowrap;
}

/* 確保表頭游標正確 */
.cursor-pointer {
  cursor: pointer;
}

/* ✅ [新增] 防止文字被選取 */
.user-select-none {
  user-select: none;
}




/* 確保進度條文字清晰 */
.text-body-1 {
  font-size: 1rem !important;
}

/* ✅ 網格上方列：住家/店面分段開關 + 全域搜尋 */
.grid-topbar {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
  flex-shrink: 0;
}
.property-type-switch {
  display: inline-flex;
  align-items: stretch;
  gap: 4px;
  padding: 4px;
  background-color: #ffffff;
  border: 1px solid rgba(var(--v-theme-primary), 0.35);
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(var(--v-theme-primary), 0.15);
  flex-shrink: 0;
}
.property-type-switch__btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  min-width: 112px;
  height: 36px;
  padding: 0 14px;
  border: none;
  border-radius: 9px;
  background-color: transparent;
  color: rgb(var(--v-theme-primary));
  font-size: 0.95rem;
  font-weight: 600;
  letter-spacing: 0.5px;
  cursor: pointer;
  user-select: none;
  transition: background-color 0.18s ease, color 0.18s ease, box-shadow 0.18s ease;
}
.property-type-switch__btn:hover {
  background-color: rgba(var(--v-theme-primary), 0.08);
}
.property-type-switch__btn.is-active {
  background-color: rgb(var(--v-theme-primary));
  color: #ffffff;
  box-shadow: 0 2px 6px rgba(var(--v-theme-primary), 0.35);
}
.property-type-switch__icon {
  opacity: 0.9;
}
.property-type-switch__count {
  min-width: 22px;
  height: 20px;
  line-height: 20px;
  padding: 0 6px;
  border-radius: 10px;
  font-size: 0.75rem;
  font-weight: 700;
  text-align: center;
  background-color: rgba(var(--v-theme-primary), 0.12);
  color: rgb(var(--v-theme-primary));
}
.property-type-switch__btn.is-active .property-type-switch__count {
  background-color: rgba(255, 255, 255, 0.24);
  color: #ffffff;
}
@media (max-width: 960px) {
  .grid-topbar {
    gap: 8px;
    /* 手機版沒有上方 .toolbar，此列即頁面最上排：左側留空給全域浮動漢堡鈕 */
    padding-left: 44px;
  }
  .property-type-switch {
    width: 100%;
  }
  .property-type-switch__btn {
    flex: 1 1 0;
    min-width: 0;
    height: 40px;
  }
}

/* ✅ [新增] 全域搜尋列 */
.global-search-bar {
  flex: 1 1 260px;
  max-width: 520px;
}
.global-search-bar :deep(.v-field) {
  border: 1px solid #e0e0e0;
}

/* ✅ [新增] 篩選面板間距微調 */
.gap-2 {
  gap: 8px;
}

.date-input-compact {
  border: 1px solid #ccc;
  border-radius: 4px;
  padding: 4px 8px;
  font-size: 0.9rem;
  width: 100%;
  color: #333;
}
.date-input-compact:focus {
  outline: 2px solid #1976D2; /* Primary color */
  border-color: transparent;
}
.border-dashed {
  border-style: dashed !important;
}
.gap-1 {
  gap: 4px;
}

/* ✅ [繳款紀錄] 繳款比例 chip：可點擊開啟一覽 */
.payment-ratio-chip {
  cursor: pointer;
}

/* ✅ 列表模式：加總列樣式（淺灰背景 + 粗體） */
.list-view-container :deep(tr.summary-row > td) {
  background-color: #f0f0f0 !important;
  font-weight: 700 !important;
  color: #1a3a6e !important;
  font-size: 0.92rem !important;
}

/* 上方加總列：底部粗線分隔，並凍結在表頭正下方（隨表頭一起固定） */
.list-view-container :deep(tr.summary-row-top > td) {
  border-bottom: 2px solid #c0c0c0 !important;
  /* !important：壓過 Vuetify .v-table--hover > ... > tbody > tr > td { position: relative } */
  position: sticky !important;
  /* thead 實際高度由 useStickyHeaderOffset 量測寫入；未量到時退回 CSS 定義的表頭高度 */
  top: var(--sticky-header-height, var(--list-header-height));
  /* 高於資料列凍結格（Vuetify z-index: 1），往下捲時資料列不會蓋到合計列 */
  z-index: 2;
}

/* 合計列中的凍結欄（戶別等）：上下、左右同時凍結，層級再高一層，橫向捲動時其他合計格從它底下滑過 */
.list-view-container :deep(tr.summary-row-top > td.v-data-table-column--fixed) {
  z-index: 3;
}

/* 下方合計列的凍結欄：橫向捲動時保持凍結並蓋過同列其他格 */
.list-view-container :deep(tr.summary-row-bottom > td.v-data-table-column--fixed) {
  z-index: 2;
}

/* 下方加總列：頂部粗線分隔 */
.list-view-container :deep(tr.summary-row-bottom > td) {
  border-top: 2px solid #c0c0c0 !important;
}

/* 加總列：滑鼠懸停時略加深，但不要像一般列那樣強烈 hover */
.list-view-container :deep(tr.summary-row:hover > td) {
  background-color: #e6e6e6 !important;
  cursor: default;
}

/* ✅ 列表模式：露臺戶別整列背景加強 */
:deep(.row-has-terrace) {
  background-color: rgba(76, 175, 80, 0.08) !important; /* 淡淡的綠色 */
}

:deep(.row-has-terrace:hover) {
  background-color: rgba(76, 175, 80, 0.15) !important; /* 懸停時加深 */
}

/* 讓優付或狀態 Chip 在綠色背景下依然清晰 */
:deep(.row-has-terrace .v-chip) {
  border: 1px solid rgba(0, 0, 0, 0.05);
}

</style>