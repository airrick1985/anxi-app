<template>
  <!-- 驗屋預約資料透視（比照銷控資料透視：左欄位 / 中設定 / 右結果 三欄式） -->
  <v-dialog v-model="isOpen" max-width="1680px" :fullscreen="isMobile">
    <v-card class="ipv-card d-flex flex-column" :class="{ 'is-fullscreen': isMobile }">
      <v-card-title class="ipv-title-bar d-flex align-center bg-blue-grey-lighten-5 flex-shrink-0">
        <!-- 手機：建案名稱與筆數一行、標題一行，右側只放圖示按鈕 -->
        <div v-if="isMobile" class="ipv-title-stack">
          <div class="text-caption text-grey-darken-1">{{ projectName }}・{{ pivotMatrix.itemCount }} 筆</div>
          <div class="text-subtitle-1 font-weight-bold">驗屋資料透視</div>
        </div>
        <template v-else>
          <v-icon start>mdi-table-pivot</v-icon>
          <span class="text-subtitle-1 font-weight-bold ipv-title-text">{{ projectName }} 驗屋資料透視</span>
          <v-chip size="small" color="blue-grey" variant="tonal" class="ml-2 flex-shrink-0" prepend-icon="mdi-calendar-check">
            {{ pivotMatrix.itemCount }} 筆
          </v-chip>
        </template>
        <v-progress-circular v-if="fetching" indeterminate size="16" width="2" color="primary" class="ml-2 flex-shrink-0"
          title="載入區間資料中"></v-progress-circular>
        <v-spacer></v-spacer>
        <v-btn v-if="isMobile" icon="mdi-broom" size="small" variant="tonal" color="grey-darken-1" class="mr-1"
          title="清除全部" :disabled="!pivotHasAnySetting" @click="clearPivotSettings"></v-btn>
        <v-btn v-else size="small" variant="tonal" color="grey-darken-1" class="mr-1" prepend-icon="mdi-broom"
          title="清除列／欄／值／篩選器" :disabled="!pivotHasAnySetting" @click="clearPivotSettings">清除全部</v-btn>
        <!-- 方案（建案層級共用）：套用／重新命名／刪除 -->
        <v-menu v-if="isLoggedIn" v-model="isPresetMenuOpen" :close-on-content-click="false">
          <template #activator="{ props: menuProps }">
            <v-btn v-if="isMobile" v-bind="menuProps" icon="mdi-bookmark-multiple-outline" size="small" variant="tonal"
              :color="activePreset ? 'indigo' : 'blue-grey-darken-2'" class="mr-1"
              :title="activePreset ? `方案：${activePreset.name}` : '方案'"></v-btn>
            <v-btn v-else v-bind="menuProps" size="small" variant="tonal" color="blue-grey-darken-2" class="mr-1"
              prepend-icon="mdi-bookmark-multiple-outline" append-icon="mdi-menu-down" title="方案">
              <span class="ipv-preset-btn-label">{{ activePreset ? activePreset.name : '方案' }}</span>
              <span v-if="activePreset && presetDirty" class="ml-1">*</span>
            </v-btn>
          </template>
          <v-list density="compact" min-width="240" max-width="360">
            <v-list-item v-if="presets.length === 0" disabled title="尚無方案"></v-list-item>
            <v-list-item v-for="p in presets" :key="p.id" :active="p.id === activePresetId" color="indigo"
              @click="applyPreset(p)">
              <template #prepend>
                <v-icon size="18">{{ p.id === activePresetId ? 'mdi-bookmark-check' : 'mdi-bookmark-outline' }}</v-icon>
              </template>
              <v-list-item-title>{{ p.name }}</v-list-item-title>
              <template v-if="canManage" #append>
                <v-btn icon="mdi-pencil-outline" size="x-small" variant="text" color="grey-darken-1" title="重新命名"
                  @click.stop="openPresetRename(p)"></v-btn>
                <v-btn icon="mdi-delete-outline" size="x-small" variant="text" color="grey-darken-1" title="刪除"
                  @click.stop="openPresetDelete(p)"></v-btn>
              </template>
            </v-list-item>
          </v-list>
        </v-menu>
        <template v-if="canManage">
          <v-btn v-if="isMobile" icon="mdi-content-save-outline" size="small" variant="tonal" color="indigo" class="mr-1"
            title="儲存方案" @click="openPresetSave"></v-btn>
          <v-btn v-else size="small" variant="tonal" color="indigo" class="mr-1" prepend-icon="mdi-content-save-outline"
            title="儲存方案" @click="openPresetSave">儲存方案</v-btn>
        </template>
        <v-btn icon="mdi-close" variant="text" @click="isOpen = false"></v-btn>
      </v-card-title>
      <v-divider></v-divider>

      <div class="ipv-layout flex-grow-1">
        <!-- 左：所有資料欄位（可搜尋、可拖曳） -->
        <aside v-if="!isMobile" class="ipv-pane ipv-pane-fields">
          <div class="ipv-pane-title"><v-icon size="15">mdi-format-list-bulleted</v-icon> 資料欄位</div>
          <v-text-field v-model="fieldSearch" placeholder="輸入文字過濾欄位" density="compact" hide-details
            variant="outlined" clearable prepend-inner-icon="mdi-magnify"
            class="mb-2 flex-shrink-0 ipv-field-search"></v-text-field>
          <div class="ipv-field-list">
            <div v-for="m in COUNT_FIELDS" :key="m.key" class="ipv-field-item ipv-field-count" draggable="true"
              @dragstart="onFieldDragStart($event, m.key)" :title="`拖曳到「值」：${m.label}`">
              <v-icon size="14" color="indigo">{{ m.icon }}</v-icon>
              <span class="ipv-field-label">{{ m.label }}</span>
              <v-icon size="13" color="grey-lighten-1" class="ml-auto">mdi-drag</v-icon>
            </div>
            <div v-for="f in fieldList" :key="f.key" class="ipv-field-item" :class="{ used: f.used }"
              draggable="true" @dragstart="onFieldDragStart($event, f.key)" :title="f.label">
              <v-icon size="14" :color="f.icon.color">{{ f.icon.name }}</v-icon>
              <span class="ipv-field-label">{{ f.label }}</span>
              <v-icon v-if="f.used" size="13" color="indigo" class="ml-auto" title="已用於列/欄">mdi-check</v-icon>
              <v-icon v-else size="13" color="grey-lighten-1" class="ml-auto">mdi-drag</v-icon>
            </div>
            <div v-if="fieldList.length === 0" class="text-caption text-grey pa-2">無符合的欄位</div>
          </div>
        </aside>

        <!-- 中：資料範圍 / 列 / 欄 / 值 / 篩選器 / 顯示選項 -->
        <section class="ipv-pane ipv-pane-editor">
          <div class="ipv-zone">
            <div class="ipv-zone-title"><v-icon size="14">mdi-calendar-range</v-icon> 資料範圍</div>
            <div class="d-flex align-center ga-1 mb-1">
              <v-text-field v-model="scopeFrom" type="date" label="起" density="compact" hide-details variant="outlined"
                class="ipv-date-input" :max="scopeTo || undefined"></v-text-field>
              <v-text-field v-model="scopeTo" type="date" label="訖" density="compact" hide-details variant="outlined"
                class="ipv-date-input" :min="scopeFrom || undefined"></v-text-field>
            </div>
            <div class="d-flex flex-wrap ga-1 mb-2">
              <v-chip v-for="q in scopeQuickOptions" :key="q.key" size="x-small" variant="tonal" label
                :color="scopeQuickActive(q.key) ? 'indigo' : 'grey-darken-1'"
                @click="applyScopeQuick(q.key)">{{ q.label }}</v-chip>
            </div>
            <div class="ipv-scope-label">狀態</div>
            <v-chip-group v-model="scopeStatuses" multiple column selected-class="text-primary" class="ipv-chips">
              <v-chip v-for="s in STATUS_OPTIONS" :key="s" :value="s" filter variant="outlined" size="small">{{ s }}</v-chip>
            </v-chip-group>
            <template v-if="typeOptions.length">
              <div class="ipv-scope-label">預約項目</div>
              <v-chip-group v-model="scopeTypes" multiple column selected-class="text-primary" class="ipv-chips">
                <v-chip v-for="t in typeOptions" :key="t" :value="t" filter variant="outlined" size="small">{{ t }}</v-chip>
              </v-chip-group>
            </template>
            <template v-if="methodOptions.length">
              <div class="ipv-scope-label">選擇方式</div>
              <v-chip-group v-model="scopeMethods" multiple column selected-class="text-primary" class="ipv-chips">
                <v-chip v-for="t in methodOptions" :key="t" :value="t" filter variant="outlined" size="small">{{ t }}</v-chip>
              </v-chip-group>
            </template>
          </div>

          <div class="ipv-zone" :class="{ 'drag-over': dragOverZone === 'row' }"
            @dragover.prevent="dragOverZone = 'row'" @dragleave="dragOverZone = ''"
            @drop.prevent="onZoneDrop('row', $event)">
            <div class="ipv-zone-title"><v-icon size="14">mdi-table-row</v-icon> 列</div>
            <div class="d-flex flex-wrap ga-1 mb-1">
              <v-chip v-for="(d, i) in rowDims" :key="d" size="small" color="indigo" variant="tonal" label closable
                @click:close="rowDims.splice(i, 1)">{{ dimLabel(d) }}</v-chip>
              <span v-if="rowDims.length === 0" class="text-caption text-grey">拖曳欄位到此</span>
            </div>
            <v-autocomplete v-model="rowDimToAdd" :items="addDimOptions" item-title="label" item-value="key"
              density="compact" hide-details variant="outlined" auto-select-first placeholder="＋新增列"
              :menu-props="{ maxHeight: 400 }" @update:model-value="k => addDim('row', k)"></v-autocomplete>
          </div>

          <div class="ipv-zone" :class="{ 'drag-over': dragOverZone === 'col' }"
            @dragover.prevent="dragOverZone = 'col'" @dragleave="dragOverZone = ''"
            @drop.prevent="onZoneDrop('col', $event)">
            <div class="ipv-zone-title"><v-icon size="14">mdi-table-column</v-icon> 欄</div>
            <div class="d-flex flex-wrap ga-1 mb-1">
              <v-chip v-for="(d, i) in colDims" :key="d" size="small" color="teal" variant="tonal" label closable
                @click:close="colDims.splice(i, 1)">{{ dimLabel(d) }}</v-chip>
              <span v-if="colDims.length === 0" class="text-caption text-grey">拖曳欄位到此（可不設）</span>
            </div>
            <v-autocomplete v-model="colDimToAdd" :items="addDimOptions" item-title="label" item-value="key"
              density="compact" hide-details variant="outlined" auto-select-first placeholder="＋新增欄"
              :menu-props="{ maxHeight: 400 }" @update:model-value="k => addDim('col', k)"></v-autocomplete>
          </div>

          <div class="ipv-zone" :class="{ 'drag-over': dragOverZone === 'values' }"
            @dragover.prevent="dragOverZone = 'values'" @dragleave="dragOverZone = ''"
            @drop.prevent="onZoneDrop('values', $event)">
            <div class="ipv-zone-title"><v-icon size="14">mdi-sigma</v-icon> 值</div>
            <div v-for="(vd, i) in pivotValues" :key="i" class="ipv-value-entry mb-1">
              <div class="d-flex align-center ga-1">
                <v-autocomplete v-model="vd.field" :items="valueFieldOptions" item-title="label" item-value="key"
                  density="compact" hide-details variant="outlined" auto-select-first class="flex-grow-1" style="min-width:0;"
                  :title="valueFieldLabel(vd.field)"
                  :menu-props="{ maxHeight: 400 }" @update:model-value="onValueFieldChange(vd)"></v-autocomplete>
                <v-btn icon="mdi-close" size="x-small" variant="text" color="grey" class="flex-shrink-0"
                  @click="pivotValues.splice(i, 1)"></v-btn>
              </div>
              <div v-if="!isCountField(vd.field)" class="d-flex align-center ga-2 mt-1">
                <span class="text-caption text-grey-darken-1 flex-shrink-0">彙總</span>
                <v-btn-toggle v-model="vd.mode" color="indigo" variant="outlined" density="compact" mandatory
                  class="ipv-agg-toggle">
                  <v-btn v-for="opt in FIELD_AGG_OPTIONS" :key="opt.key" :value="opt.key" size="x-small">{{ opt.label }}</v-btn>
                </v-btn-toggle>
              </div>
            </div>
            <span v-if="pivotValues.length === 0" class="text-caption text-grey d-block mb-1">拖曳欄位到此（可不設，只列出組合）</span>
            <v-btn size="small" variant="text" color="indigo" prepend-icon="mdi-plus" @click="addValue">新增值</v-btn>
          </div>

          <div class="ipv-zone" :class="{ 'drag-over': dragOverZone === 'filter' }"
            @dragover.prevent="dragOverZone = 'filter'" @dragleave="dragOverZone = ''"
            @drop.prevent="onZoneDrop('filter', $event)">
            <div class="ipv-zone-title"><v-icon size="14">mdi-filter-variant</v-icon> 篩選器</div>
            <div v-for="(f, i) in pivotFilters" :key="f.field" class="ipv-filter-entry mb-1">
              <div class="d-flex align-center mb-1">
                <span class="text-caption font-weight-bold text-grey-darken-2">{{ dimLabel(f.field) }}</span>
                <v-spacer></v-spacer>
                <v-btn icon="mdi-close" size="x-small" variant="text" color="grey" @click="pivotFilters.splice(i, 1)"></v-btn>
              </div>
              <template v-if="filterIsDate(f.field)">
                <div class="d-flex align-center ga-1 mb-1">
                  <v-text-field v-model="f.from" type="date" label="起" density="compact" hide-details variant="outlined"
                    class="ipv-date-input" :max="f.to || undefined"></v-text-field>
                  <v-text-field v-model="f.to" type="date" label="訖" density="compact" hide-details variant="outlined"
                    class="ipv-date-input" :min="f.from || undefined"></v-text-field>
                </div>
                <div class="d-flex flex-wrap ga-1 mb-1">
                  <v-chip v-for="q in FILTER_DATE_QUICK_OPTIONS" :key="q.key" size="x-small" variant="tonal" label
                    :color="filterDateQuickActive(f, q.key) ? 'indigo' : 'grey-darken-1'"
                    @click="applyFilterDateQuick(f, q.key)">{{ q.label }}</v-chip>
                  <v-chip v-if="f.from || f.to" size="x-small" variant="text" color="grey-darken-1" label
                    @click="f.from = ''; f.to = ''">清除</v-chip>
                </div>
              </template>
              <v-autocomplete v-model="f.selected" :items="filterOptionsMap[f.field] || []"
                multiple chips closable-chips clearable density="compact" hide-details variant="outlined"
                placeholder="全部（未勾選＝不限）" :menu-props="{ maxHeight: 320 }"></v-autocomplete>
            </div>
            <v-autocomplete v-model="filterFieldToAdd" :items="dimensionOptions" item-title="label" item-value="key"
              density="compact" hide-details variant="outlined" auto-select-first placeholder="＋新增篩選器"
              :menu-props="{ maxHeight: 400 }" @update:model-value="addFilter"></v-autocomplete>
          </div>

          <div class="ipv-zone">
            <div class="ipv-zone-title"><v-icon size="14">mdi-tune</v-icon> 顯示選項</div>
            <v-checkbox v-if="hasNonCountValue" v-model="showBoth" label="同時顯示筆數"
              density="compact" hide-details color="indigo"></v-checkbox>
            <v-select v-if="pivotValues.length" v-model="cellPct" :items="CELL_PCT_OPTIONS"
              item-title="label" item-value="key" label="儲存格佔比" density="compact" hide-details variant="outlined"
              prepend-inner-icon="mdi-percent-outline" class="my-1"></v-select>
            <v-switch v-model="showChart" label="長條圖" color="indigo" density="compact" hide-details></v-switch>
          </div>
        </section>

        <!-- 右：分析結果 -->
        <main class="ipv-pane ipv-pane-result">
          <v-alert v-if="pivotMatrix.rows.length === 0" type="info" variant="tonal"
            :text="fetching ? '載入區間資料中…' : '目前條件下無任何預約資料可供分析。'"></v-alert>
          <div v-else class="ipv-table-wrap">
            <v-table density="compact">
              <thead>
                <tr class="bg-grey-lighten-4">
                  <th v-for="(label, li) in pivotMatrix.rowDimLabels" :key="'rd' + li"
                    :rowspan="headerRowCount"
                    class="text-left font-weight-bold ipv-sortable"
                    :style="li === 0 ? 'min-width:110px;position:sticky;left:0;background:#f5f5f5;z-index:2;' : 'min-width:100px;'"
                    @click="toggleSort({ type: 'name', li })" title="點擊排序"
                    v-bind="thDragProps({ type: 'rowDim', index: li }, rowDims.length > 1)">
                    {{ label }}
                    <v-icon size="14" :color="sortActive({ type: 'name', li }) ? 'primary' : 'grey-lighten-1'">{{ sortIcon({ type: 'name', li }) }}</v-icon>
                  </th>
                  <template v-if="pivotMatrix.useCol">
                    <th v-for="(cKey, ci) in pivotMatrix.colKeys" :key="'c' + cKey" :colspan="Math.max(pivotMatrix.valueDefs.length, 1)"
                      class="text-center font-weight-bold" style="min-width:70px;border-left:1px solid #e0e0e0;"
                      v-bind="thDragProps({ type: 'colKey', index: ci }, pivotMatrix.colKeys.length > 1)">
                      {{ colLabel(cKey) }}
                    </th>
                    <th v-if="hasValues" :colspan="pivotMatrix.valueDefs.length" class="text-center font-weight-bold"
                      :style="stickyTotalGroupStyle('#f5f5f5')">總計</th>
                  </template>
                  <template v-else>
                    <th v-for="(vd, vi) in pivotMatrix.valueDefs" :key="'v' + vi"
                      class="text-center font-weight-bold ipv-sortable" style="min-width:84px;"
                      @click="toggleSort({ type: 'total', vi })" title="點擊排序"
                      v-bind="thDragProps({ type: 'value', index: vi }, pivotMatrix.valueDefs.length > 1)">
                      {{ valueDefLabel(vd) }}
                      <v-icon size="14" :color="sortActive({ type: 'total', vi }) ? 'primary' : 'grey-lighten-1'">{{ sortIcon({ type: 'total', vi }) }}</v-icon>
                    </th>
                  </template>
                </tr>
                <tr v-if="pivotMatrix.useCol && hasValues" class="bg-grey-lighten-4">
                  <template v-for="cKey in pivotMatrix.colKeys" :key="'sub' + cKey">
                    <th v-for="(vd, vi) in pivotMatrix.valueDefs" :key="'sub' + cKey + vi"
                      class="text-center text-caption ipv-sortable" style="min-width:70px;"
                      @click="toggleSort({ type: 'cell', cKey, vi })" title="點擊排序"
                      v-bind="thDragProps({ type: 'value', index: vi }, pivotMatrix.valueDefs.length > 1)">
                      {{ valueDefLabel(vd) }}
                      <v-icon size="13" :color="sortActive({ type: 'cell', cKey, vi }) ? 'primary' : 'grey-lighten-1'">{{ sortIcon({ type: 'cell', cKey, vi }) }}</v-icon>
                    </th>
                  </template>
                  <th v-for="(vd, vi) in pivotMatrix.valueDefs" :key="'tot' + vi"
                    class="text-center text-caption ipv-sortable"
                    :style="stickyTotalStyle(vi, '#f5f5f5')"
                    @click="toggleSort({ type: 'total', vi })" title="點擊排序">
                    {{ valueDefLabel(vd) }}
                    <v-icon size="13" :color="sortActive({ type: 'total', vi }) ? 'primary' : 'grey-lighten-1'">{{ sortIcon({ type: 'total', vi }) }}</v-icon>
                  </th>
                </tr>
                <!-- 頂部總計列（與底部總計相同，方便長表不用捲到底） -->
                <tr v-if="hasValues" class="font-weight-bold bg-grey-lighten-3">
                  <td v-for="(label, li) in pivotMatrix.rowDimLabels" :key="'tl' + li"
                    :style="li === 0 ? 'position:sticky;left:0;background:#eeeeee;z-index:1;' : ''">
                    <template v-if="li === 0">總計</template>
                  </td>
                  <template v-for="cKey in pivotMatrix.colKeys" :key="'tf' + cKey">
                    <td v-for="(vd, vi) in pivotMatrix.valueDefs" :key="'tf' + cKey + vi"
                      class="text-center ipv-cell-click"
                      @click="openDrill('__col__', cKey)" title="點擊查看預約明細">{{ colTotalMain(cKey, vi) }}</td>
                  </template>
                  <template v-if="pivotMatrix.useCol">
                    <td v-for="(vd, vi) in pivotMatrix.valueDefs" :key="'tg' + vi"
                      class="text-center text-deep-orange-darken-3 ipv-cell-click"
                      :style="stickyTotalStyle(vi, '#eeeeee')"
                      @click="openDrill('__grand__', '')" title="點擊查看預約明細">{{ grandMain(vi) }}</td>
                  </template>
                </tr>
              </thead>
              <tbody>
                <tr v-for="row in sortedRows" :key="row.key">
                  <td v-for="(p, li) in row.parts" :key="row.key + 'p' + li"
                    class="font-weight-medium ipv-cell-click"
                    :style="li === 0 ? 'position:sticky;left:0;background:#fff;z-index:1;' : ''"
                    @click="openDrill(row.key, '__row__')" title="點擊查看預約明細">{{ p }}</td>
                  <template v-for="cKey in pivotMatrix.colKeys" :key="row.key + cKey">
                    <td v-if="!hasValues && pivotMatrix.useCol" class="text-center ipv-cell-click"
                      @click="openDrill(row.key, cKey)" title="點擊查看預約明細">
                      <v-icon v-if="row.cells[cKey]?.count" size="16" color="indigo">mdi-check</v-icon>
                    </td>
                    <td v-for="(vd, vi) in pivotMatrix.valueDefs" :key="row.key + cKey + vi"
                      class="text-center ipv-cell-click"
                      @click="openDrill(row.key, pivotMatrix.useCol ? cKey : '__row__')" title="點擊查看預約明細">
                      <span :class="(row.cells[cKey]?.count) ? '' : 'text-grey-lighten-1'">{{ cellMain(row, cKey, vi) }}</span>
                      <div v-if="cellSub(row, cKey, vi)" class="ipv-cell-sub">{{ cellSub(row, cKey, vi) }}</div>
                    </td>
                  </template>
                  <template v-if="pivotMatrix.useCol">
                    <td v-for="(vd, vi) in pivotMatrix.valueDefs" :key="row.key + 'rt' + vi"
                      class="text-center font-weight-bold text-blue-grey-darken-2 ipv-cell-click"
                      :style="stickyTotalStyle(vi, '#ffffff')"
                      @click="openDrill(row.key, '__row__')" title="點擊查看預約明細">{{ rowTotalMain(row, vi) }}</td>
                  </template>
                </tr>
              </tbody>
              <tfoot v-if="hasValues" class="bg-grey-lighten-3">
                <tr class="font-weight-bold">
                  <td v-for="(label, li) in pivotMatrix.rowDimLabels" :key="'fl' + li"
                    :style="li === 0 ? 'position:sticky;left:0;background:#eeeeee;z-index:1;' : ''">
                    <template v-if="li === 0">總計</template>
                  </td>
                  <template v-for="cKey in pivotMatrix.colKeys" :key="'f' + cKey">
                    <td v-for="(vd, vi) in pivotMatrix.valueDefs" :key="'f' + cKey + vi"
                      class="text-center ipv-cell-click"
                      @click="openDrill('__col__', cKey)" title="點擊查看預約明細">{{ colTotalMain(cKey, vi) }}</td>
                  </template>
                  <template v-if="pivotMatrix.useCol">
                    <td v-for="(vd, vi) in pivotMatrix.valueDefs" :key="'g' + vi"
                      class="text-center text-deep-orange-darken-3 ipv-cell-click"
                      :style="stickyTotalStyle(vi, '#eeeeee')"
                      @click="openDrill('__grand__', '')" title="點擊查看預約明細">{{ grandMain(vi) }}</td>
                  </template>
                </tr>
              </tfoot>
            </v-table>
          </div>
          <div v-if="pivotMatrix.rows.length" class="text-caption text-grey mt-1 ipv-result-hint">
            <v-icon size="13">mdi-cursor-default-click-outline</v-icon> 點儲存格看預約明細・點表頭排序<template v-if="!isMobile">・拖曳表頭調整順序</template>
            <template v-if="hasMultiDim">・每人分計時各列加總可能大於總計</template>
          </div>

          <!-- 長條圖：第一個值的列合計（單一序列橫向長條） -->
          <div v-if="showChart && hasValues && pivotMatrix.rows.length" class="bg-white rounded-lg pa-3 mt-3 ipv-chart-block" style="border:1px solid #eceff1;">
            <div class="text-caption font-weight-bold text-grey-darken-2 mb-2">{{ chartTitle }}</div>
            <div v-for="bar in chartData.bars" :key="bar.key" class="ipv-chart-row"
              :title="`${bar.name}：${formatCount(bar.value)}`"
              @click="openDrill(bar.key, '__row__')">
              <div class="ipv-chart-label">{{ bar.name }}</div>
              <div class="ipv-chart-track">
                <div class="ipv-chart-bar" :style="{ width: bar.widthPct + '%' }"></div>
              </div>
              <div class="ipv-chart-value">{{ formatCount(bar.value) }}</div>
            </div>
            <div v-if="chartData.truncated > 0" class="text-caption text-grey mt-1">
              僅顯示前 {{ CHART_MAX_BARS }} 列，其餘 {{ chartData.truncated }} 列未繪出
            </div>
          </div>
        </main>
      </div>

      <v-divider></v-divider>
      <v-card-actions class="pa-3 bg-grey-lighten-4 flex-shrink-0 flex-wrap">
        <v-btn variant="text" color="primary" prepend-icon="mdi-content-copy"
          :disabled="pivotMatrix.rows.length === 0" @click="copyTable">複製表格</v-btn>
        <v-btn variant="text" color="teal-darken-1" prepend-icon="mdi-file-excel-outline"
          :disabled="pivotMatrix.rows.length === 0" @click="exportExcel">匯出EXCEL</v-btn>
        <v-btn variant="text" color="red-darken-2" prepend-icon="mdi-file-pdf-box"
          :disabled="pivotMatrix.rows.length === 0" @click="openPdfPreview">匯出PDF</v-btn>
        <v-spacer></v-spacer>
        <v-btn color="primary" variant="flat" @click="isOpen = false">完成</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>

  <!-- PDF 預覽（直式／橫式 A4 即時切換，確認後下載） -->
  <v-dialog v-model="pdf.open" fullscreen transition="dialog-bottom-transition">
    <v-card class="d-flex flex-column">
      <v-toolbar color="blue-grey-lighten-5" density="compact" class="flex-shrink-0 ipv-title-bar">
        <v-btn icon="mdi-close" variant="text" @click="pdf.open = false"></v-btn>
        <v-toolbar-title class="text-subtitle-1 font-weight-bold">PDF 預覽</v-toolbar-title>
        <v-btn-toggle v-model="pdf.orientation" mandatory density="compact" color="indigo" variant="outlined" class="mr-2">
          <v-btn value="portrait" size="small" prepend-icon="mdi-crop-portrait">直式</v-btn>
          <v-btn value="landscape" size="small" prepend-icon="mdi-crop-landscape">橫式</v-btn>
        </v-btn-toggle>
        <v-btn color="red-darken-2" variant="flat" size="small" prepend-icon="mdi-download" class="mr-2"
          :loading="pdf.downloading" @click="downloadPdf">下載 PDF</v-btn>
      </v-toolbar>
      <iframe class="ipv-pdf-frame flex-grow-1" :srcdoc="pdf.html" title="PDF 預覽"></iframe>
    </v-card>
  </v-dialog>

  <!-- 下鑽明細：點儲存格顯示對應預約清單 -->
  <v-dialog v-model="drill.open" max-width="860px" scrollable :fullscreen="isMobile">
    <v-card>
      <v-card-title class="ipv-title-bar text-subtitle-1 d-flex align-center bg-indigo-lighten-5">
        <v-icon start size="small">mdi-format-list-bulleted</v-icon>
        <span class="font-weight-bold ipv-title-text">{{ drill.title }}</span>
        <v-chip size="x-small" variant="tonal" color="indigo" class="ml-2 flex-shrink-0" label>{{ drill.items.length }} 筆</v-chip>
        <v-spacer></v-spacer>
        <v-btn icon="mdi-close" variant="text" density="compact" @click="drill.open = false"></v-btn>
      </v-card-title>
      <v-divider></v-divider>
      <v-card-text class="pa-0" style="max-height:70vh;">
        <v-table density="compact" hover class="ipv-drill-table">
          <thead>
            <tr class="bg-grey-lighten-4">
              <th class="font-weight-bold">日期時段</th>
              <th class="font-weight-bold">戶別</th>
              <th class="font-weight-bold">預約項目</th>
              <th class="font-weight-bold">選擇方式</th>
              <th class="font-weight-bold">狀態</th>
              <th class="font-weight-bold">驗屋人員</th>
              <th class="font-weight-bold">預約人</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="it in drill.items" :key="it.id" class="ipv-cell-click" @click="emit('open-event', it)" title="點擊開啟預約詳細資訊">
              <td>{{ drillDateText(it) }}</td>
              <td class="font-weight-medium text-primary">{{ it.unitId || '—' }}</td>
              <td>{{ it.bookingType || '—' }}</td>
              <td>{{ it.inspectionMethod || '—' }}</td>
              <td>{{ it.status || '—' }}</td>
              <td>{{ splitNames(it.inspectors).join('、') || '—' }}</td>
              <td>{{ it.bookerName || '—' }}</td>
            </tr>
          </tbody>
        </v-table>
      </v-card-text>
      <v-divider></v-divider>
      <v-card-actions class="pa-2">
        <v-spacer></v-spacer>
        <v-btn variant="text" @click="drill.open = false">關閉</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>

  <!-- 儲存方案（另存新方案或覆寫既有方案） -->
  <v-dialog v-model="presetSave.open" max-width="420px">
    <v-card>
      <v-card-title class="text-subtitle-1 font-weight-bold">
        <v-icon start size="20">mdi-content-save-outline</v-icon>儲存方案
      </v-card-title>
      <v-card-text class="pt-2">
        <v-select v-if="presets.length > 0" v-model="presetSave.overwriteId" :items="presets"
          item-title="name" item-value="id" label="覆寫既有方案" clearable density="compact" variant="outlined"
          hide-details class="mb-3" @update:model-value="onPresetOverwriteChange"></v-select>
        <v-text-field v-model="presetSave.name" label="方案名稱" density="compact" variant="outlined"
          :maxlength="PIVOT_PRESET_NAME_MAX" counter autofocus :error-messages="presetSave.error"></v-text-field>
      </v-card-text>
      <v-card-actions class="px-4 pb-3">
        <v-spacer></v-spacer>
        <v-btn variant="text" @click="presetSave.open = false">取消</v-btn>
        <v-btn color="indigo" variant="flat" :loading="presetSave.saving" @click="submitPresetSave">
          {{ presetSave.overwriteId ? '覆寫' : '儲存' }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>

  <!-- 重新命名方案 -->
  <v-dialog v-model="presetRename.open" max-width="380px">
    <v-card>
      <v-card-title class="text-subtitle-1 font-weight-bold">
        <v-icon start size="20">mdi-pencil-outline</v-icon>重新命名
      </v-card-title>
      <v-card-text class="pt-2">
        <v-text-field v-model="presetRename.name" label="方案名稱" density="compact" variant="outlined"
          :maxlength="PIVOT_PRESET_NAME_MAX" counter autofocus :error-messages="presetRename.error"></v-text-field>
      </v-card-text>
      <v-card-actions class="px-4 pb-3">
        <v-spacer></v-spacer>
        <v-btn variant="text" @click="presetRename.open = false">取消</v-btn>
        <v-btn color="indigo" variant="flat" :loading="presetRename.saving" @click="submitPresetRename">確定</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>

  <!-- 刪除方案確認 -->
  <v-dialog v-model="presetDelete.open" max-width="360px">
    <v-card>
      <v-card-title class="text-subtitle-1 font-weight-bold">要刪除這個方案嗎？</v-card-title>
      <v-card-text class="pt-0">「{{ presetDelete.preset?.name }}」刪除後，此建案所有人都不再看到，無法復原。</v-card-text>
      <v-card-actions class="px-4 pb-3">
        <v-spacer></v-spacer>
        <v-btn variant="text" @click="presetDelete.open = false">取消</v-btn>
        <v-btn color="error" variant="flat" :loading="presetDelete.busy" @click="submitPresetDelete">刪除</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
/**
 * 驗屋預約資料透視（比照銷控資料透視 SalesControlSystem.vue）
 *
 * - 資料：父層傳入已合併戶別資料的預約（items，含 start: Date）；本對話框自選日期區間，
 *   超出已載入範圍時 emit('fetch-range') 由父層補抓並合併進 items
 * - 多值欄位（驗屋人員、銷售人員、多選自訂欄位）：「每人分計」一筆可落在多列，
 *   每個儲存格／總計都以「不重複預約」計算，所以各列加總可能大於總計
 * - 設定：本機依建案自動記憶（不含資料範圍）；方案存 Firestore inspectionPivotPresets（建案共用，含資料範圍）
 */
import { ref, reactive, computed, watch, nextTick, onUnmounted } from 'vue';
import { useDisplay } from 'vuetify';
import { watchDebounced } from '@vueuse/core';
import { useToast, POSITION } from 'vue-toastification';
import {
  format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear, addDays, addMonths, differenceInCalendarDays,
} from 'date-fns';
import { useUserStore } from '@/store/user';
import { normalizeSalespersons } from '@/utils/salespersonUtils';
import { getCalendarCustomFieldValue } from '@/utils/calendarCustomFields';
import { PIVOT_PRESET_NAME_MAX, normalizePresetName, createPivotPresetService } from '@/services/pivotPresetService';

const loadXLSX = () => import('xlsx-js-style');

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  projectId: { type: String, default: '' },
  projectName: { type: String, default: '' },
  // 已合併戶別資料的預約（processAppointments 結果，含 start）
  items: { type: Array, default: () => [] },
  // 預約項目自訂欄位（displayFieldOptions 中 isDynamic 的欄位）
  customFields: { type: Array, default: () => [] },
  typeOptions: { type: Array, default: () => [] },
  methodOptions: { type: Array, default: () => [] },
  // 時間表目前的篩選（開啟時預設帶入）
  calendarStatuses: { type: Array, default: () => [] },
  calendarTypes: { type: Array, default: () => [] },
  calendarMethods: { type: Array, default: () => [] },
  // 時間表目前檢視的日期範圍 (yyyy-MM-dd)，該範圍資料已載入
  rangeStart: { type: String, default: null },
  rangeEnd: { type: String, default: null },
  fetching: { type: Boolean, default: false },
  canEdit: { type: Boolean, default: false },
});
const emit = defineEmits(['update:modelValue', 'fetch-range', 'open-event']);

const toast = useToast();
const userStore = useUserStore();
const { smAndDown } = useDisplay();
const isMobile = computed(() => smAndDown.value);

const isOpen = computed({
  get: () => props.modelValue,
  set: (v) => emit('update:modelValue', v),
});

const presetService = createPivotPresetService('inspectionPivotPresets');

// ── 欄位定義 ──
const EMPTY = '（未填寫）';
const STATUS_OPTIONS = ['預約中', '取消', '已完成'];
const DOW = ['日', '一', '二', '三', '四', '五', '六'];
const WEEKDAY_ORDER = ['星期一', '星期二', '星期三', '星期四', '星期五', '星期六', '星期日'];
const PIVOT_SEP = '|#|';            // 組合鍵層級分隔
const PIVOT_CELL_SEP = '||CELL||';  // 下鑽 key 的列/欄分隔

function splitNames(raw) {
  const list = Array.isArray(raw) ? raw : String(raw || '').split(/[,、，;；/]+/);
  return list.map(s => String(s).trim()).filter(Boolean);
}
// 多人組合：排序後併成一格（「李四、張三」與「張三、李四」視為同一組）
function comboOf(list) {
  return [...new Set(list)].sort((a, b) => a.localeCompare(b, 'zh-Hant')).join('、');
}
// Timestamp／Date／ISO 字串／yyyy-MM-dd → 台灣時區 yyyy-MM-dd（無效為 ''）
function anyDateStr(v) {
  if (!v) return '';
  if (typeof v === 'string' && /^\d{4}-\d{2}-\d{2}/.test(v)) return v.slice(0, 10);
  let d = null;
  if (v instanceof Date) d = v;
  else if (typeof v.toDate === 'function') d = v.toDate();
  else if (typeof v === 'object' && v._seconds !== undefined) d = new Date(v._seconds * 1000);
  else d = new Date(v);
  if (!d || isNaN(d.getTime())) return '';
  return d.toLocaleDateString('sv-SE', { timeZone: 'Asia/Taipei' });
}
const startDateStr = e => (e.start ? format(e.start, 'yyyy-MM-dd') : '');
function weekLabelOf(d) {
  if (!d) return '';
  const ws = startOfWeek(d, { weekStartsOn: 1 });
  return `${format(ws, 'yyyy-MM-dd')}～${format(addDays(ws, 6), 'MM-dd')}`;
}
// 預約提前天數：預約日 − 建立日
function leadDaysOf(e) {
  const created = anyDateStr(e.createdAt);
  const day = startDateStr(e);
  if (!created || !day) return '';
  return String(differenceInCalendarDays(new Date(`${day}T00:00:00`), new Date(`${created}T00:00:00`)));
}

// kind：date/month/week/time 依時間序、weekday 依星期、number 依數值、natural 依自然排序；
// 其餘依筆數多→少。multi：一筆可有多個值（每人分計）
const BASE_DIMENSIONS = [
  { key: 'bookingType', label: '預約項目' },
  { key: 'inspectionMethod', label: '選擇方式' },
  { key: 'bookingSubOption', label: '子項目' },
  { key: 'status', label: '狀態', order: STATUS_OPTIONS },
  { key: 'checkInStatus', label: '報到狀態' },
  { key: 'source', label: '來源', get: e => [e.source === 'admin' ? '後台新增' : '前台預約'] },
  { key: 'date', label: '日期', kind: 'date', get: e => [startDateStr(e)] },
  { key: 'week', label: '週', kind: 'week', get: e => [weekLabelOf(e.start)] },
  { key: 'month', label: '月份', kind: 'month', get: e => [startDateStr(e).slice(0, 7)] },
  { key: 'weekday', label: '星期', kind: 'weekday', get: e => [e.start ? `星期${DOW[e.start.getDay()]}` : ''] },
  { key: 'timeSlot', label: '時段', kind: 'time', get: e => [e.start ? format(e.start, 'HH:mm') : ''] },
  { key: 'halfDay', label: '上午／下午', order: ['上午', '下午'], get: e => [e.start ? (e.start.getHours() < 12 ? '上午' : '下午') : ''] },
  { key: 'building', label: '棟別', kind: 'natural' },
  { key: 'unitId', label: '戶別', kind: 'natural' },
  { key: 'inspectors', label: '驗屋人員（每人分計）', multi: true, get: e => splitNames(e.inspectors) },
  { key: 'inspectorsCombo', label: '驗屋人員（組合）', get: e => [comboOf(splitNames(e.inspectors))] },
  { key: 'salesperson', label: '銷售人員（每人分計）', multi: true, get: e => normalizeSalespersons(e.salesperson) },
  { key: 'salespersonCombo', label: '銷售人員（組合）', get: e => [comboOf(normalizeSalespersons(e.salesperson))] },
  { key: 'inspectionCompanyName', label: '代驗公司' },
  { key: 'bookerName', label: '預約人' },
  { key: 'agentName', label: '受託人' },
  { key: 'buyerName', label: '買方姓名' },
  { key: 'currentStatus', label: '戶別目前狀態' },
  { key: 'initialInspectionBatch', label: '初驗批次', kind: 'natural' },
  { key: 'reInspectionBatch', label: '複驗批次', kind: 'natural' },
  { key: 'bank', label: '銀行' },
  { key: 'bankContact', label: '銀行窗口' },
  { key: 'appropriationDate', label: '撥款日', kind: 'date', get: e => [anyDateStr(e.appropriationDate)] },
  { key: 'appropriationMonth', label: '撥款月份', kind: 'month', get: e => [anyDateStr(e.appropriationDate).slice(0, 7)] },
  { key: 'handoverDate', label: '交屋日', kind: 'date', get: e => [anyDateStr(e.handoverTime)] },
  { key: 'createdDate', label: '建立日期', kind: 'date', get: e => [anyDateStr(e.createdAt)] },
  { key: 'createdMonth', label: '建立月份', kind: 'month', get: e => [anyDateStr(e.createdAt).slice(0, 7)] },
  { key: 'leadDays', label: '預約提前天數', kind: 'number', get: e => [leadDaysOf(e)] },
  { key: 'createdByName', label: '建立人' },
  { key: 'lastModifiedByName', label: '最後修改人' },
  { key: 'parkingLots', label: '車位' },
  { key: 'remarks', label: '重要備註' },
  { key: 'bookingRemarks', label: '預約備註' },
];
// 自訂欄位（多選為陣列，每個選項各計一次）插在「子項目」之後
const dimensionDefs = computed(() => {
  const dynamic = props.customFields.map(f => ({
    key: `dyn:${f.key}`,
    label: f.label,
    multi: true,
    get: e => {
      const v = getCalendarCustomFieldValue(e, f);
      return Array.isArray(v) ? v : [v];
    },
  }));
  const list = [...BASE_DIMENSIONS];
  list.splice(list.findIndex(d => d.key === 'bookingSubOption') + 1, 0, ...dynamic);
  return list;
});
const dimensionMap = computed(() => new Map(dimensionDefs.value.map(d => [d.key, d])));
const dimensionOptions = computed(() => dimensionDefs.value.map(d => ({ key: d.key, label: d.label })));
function dimLabel(key) {
  return dimensionMap.value.get(key)?.label || key;
}

// 欄位的個別值（轉字串、去空白、去空值與重複）
function valueListOf(item, dimKey) {
  const dim = dimensionMap.value.get(dimKey);
  if (!dim) return [];
  const raws = dim.get ? dim.get(item) : [item[dimKey]];
  const list = [];
  for (const raw of raws) {
    let v = raw;
    if (v instanceof Date || (v && typeof v === 'object' && typeof v.toDate === 'function')) v = anyDateStr(v);
    else if (typeof v === 'boolean') v = v ? '是' : '否';
    else if (Array.isArray(v)) v = v.join('、');
    else if (v !== null && typeof v === 'object') v = '';
    const s = v === null || v === undefined ? '' : String(v).trim();
    if (s && !list.includes(s)) list.push(s);
  }
  return list;
}
function dimValuesOf(item, dimKey) {
  const list = valueListOf(item, dimKey);
  return list.length ? list : [EMPTY];
}

// 維度值的自然順序（未填寫一律最後）
function compareDimValues(dim, a, b) {
  if (a === b) return 0;
  if (a === EMPTY) return 1;
  if (b === EMPTY) return -1;
  if (dim?.kind === 'weekday') return WEEKDAY_ORDER.indexOf(a) - WEEKDAY_ORDER.indexOf(b);
  if (dim?.order) {
    const ia = dim.order.indexOf(a);
    const ib = dim.order.indexOf(b);
    if (ia !== ib) return (ia < 0 ? 999 : ia) - (ib < 0 ? 999 : ib);
  }
  if (dim?.kind === 'number') {
    const na = Number(a);
    const nb = Number(b);
    if (isFinite(na) && isFinite(nb)) return na - nb;
  }
  return String(a).localeCompare(String(b), 'zh-Hant', { numeric: true });
}
// 維度鍵值預設排序：有順序意義的欄位依自然順序，其餘依筆數多→少
function sortDimKeys(keys, dimKey, getTotal) {
  const dim = dimensionMap.value.get(dimKey);
  if (dim && (dim.kind || dim.order)) return [...keys].sort((a, b) => compareDimValues(dim, a, b));
  return [...keys].sort((a, b) => ((a === EMPTY) - (b === EMPTY))
    || (getTotal(b) - getTotal(a))
    || String(a).localeCompare(String(b), 'zh-Hant', { numeric: true }));
}

// ── 列 / 欄 ──
const rowDims = ref(['inspectors']);
const colDims = ref(['bookingType']);
const usedDimKeys = computed(() => new Set([...rowDims.value, ...colDims.value]));
const addDimOptions = computed(() => dimensionOptions.value.filter(o => !usedDimKeys.value.has(o.key)));
const rowDimToAdd = ref(null);
const colDimToAdd = ref(null);
function addDim(kind, key) {
  if (key && !usedDimKeys.value.has(key) && dimensionMap.value.has(key)) {
    (kind === 'row' ? rowDims : colDims).value.push(key);
  }
  nextTick(() => { rowDimToAdd.value = null; colDimToAdd.value = null; });
}
const hasMultiDim = computed(() => [...rowDims.value, ...colDims.value].some(k => dimensionMap.value.get(k)?.multi));

// ── 左側欄位清單：文字過濾 + 拖曳到列/欄/值/篩選器 ──
const COUNT_FIELDS = [
  { key: '__count__', label: '預約筆數', icon: 'mdi-counter' },
  { key: '__units__', label: '戶數（不重複）', icon: 'mdi-home-outline' },
];
const fieldSearch = ref('');
function fieldIcon(dim) {
  if (['date', 'month', 'week', 'weekday', 'time'].includes(dim.kind)) return { name: 'mdi-calendar-outline', color: 'teal' };
  if (dim.multi) return { name: 'mdi-account-multiple-outline', color: 'deep-purple-lighten-1' };
  return { name: 'mdi-label-outline', color: 'blue-grey-lighten-1' };
}
const fieldList = computed(() => {
  const kw = (fieldSearch.value || '').trim().toLowerCase();
  return dimensionDefs.value
    .filter(d => !kw || d.label.toLowerCase().includes(kw) || d.key.toLowerCase().includes(kw))
    .map(d => ({ key: d.key, label: d.label, icon: fieldIcon(d), used: usedDimKeys.value.has(d.key) }));
});
const dragOverZone = ref('');
function onFieldDragStart(e, key) {
  e.dataTransfer.setData('text/plain', key);
  e.dataTransfer.effectAllowed = 'copy';
}
function onZoneDrop(zone, e) {
  dragOverZone.value = '';
  const key = e.dataTransfer.getData('text/plain');
  if (!key) return;
  const isCount = isCountField(key);
  if (zone === 'row' || zone === 'col') {
    if (!isCount) addDim(zone, key);
  } else if (zone === 'values') {
    if (isCount) pivotValues.value.push({ field: key, mode: 'count' });
    else if (dimensionMap.value.has(key)) pivotValues.value.push({ field: key, mode: 'distinct' });
  } else if (zone === 'filter') {
    if (!isCount) addFilter(key);
  }
}

// ── 值：預約筆數／戶數（不重複）／任一欄位的不重複計數或有填計數 ──
const FIELD_AGG_OPTIONS = [
  { key: 'distinct', label: '不重複計數' },
  { key: 'filled', label: '有填筆數' },
];
const CELL_PCT_OPTIONS = [
  { key: 'none', label: '不顯示' },
  { key: 'grand', label: '佔總計' },
  { key: 'row', label: '佔列合計' },
  { key: 'col', label: '佔欄合計' },
];
const pivotValues = ref([{ field: '__count__', mode: 'count' }]);
const showBoth = ref(true);    // 非筆數的值每格同時顯示筆數
const cellPct = ref('none');   // 儲存格佔比基準
const showChart = ref(false);
function isCountField(key) { return key === '__count__' || key === '__units__'; }
const valueFieldOptions = computed(() => [
  ...COUNT_FIELDS.map(m => ({ key: m.key, label: m.label })),
  ...dimensionOptions.value,
]);
function valueFieldLabel(key) {
  return COUNT_FIELDS.find(m => m.key === key)?.label || dimLabel(key);
}
function valueDefLabel(vd) {
  if (vd.field === '__count__') return '筆數';
  if (vd.field === '__units__') return '戶數';
  const agg = FIELD_AGG_OPTIONS.find(o => o.key === vd.mode)?.label || '';
  return `${dimLabel(vd.field)}·${agg}`;
}
function addValue() {
  pivotValues.value.push({ field: '__units__', mode: 'count' });
}
function onValueFieldChange(vd) {
  if (isCountField(vd.field)) vd.mode = 'count';
  else if (!FIELD_AGG_OPTIONS.some(o => o.key === vd.mode)) vd.mode = 'distinct';
}
const hasNonCountValue = computed(() => pivotValues.value.some(vd => vd.field !== '__count__'));
function formatCount(v) {
  if (v === null || v === undefined || !isFinite(v)) return '—';
  return Math.round(v).toLocaleString('en-US');
}

// ── 資料範圍：日期起訖（自動補抓）＋ 狀態／項目／方式 ──
const scopeFrom = ref('');
const scopeTo = ref('');
const scopeStatuses = ref([...STATUS_OPTIONS]);
const scopeTypes = ref([]);
const scopeMethods = ref([]);
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const fmtDay = d => format(d, 'yyyy-MM-dd');
function quickRange(key) {
  const today = new Date();
  switch (key) {
    case 'calendar': return { from: props.rangeStart || '', to: props.rangeEnd || '' };
    case 'thisWeek': return { from: fmtDay(startOfWeek(today, { weekStartsOn: 1 })), to: fmtDay(endOfWeek(today, { weekStartsOn: 1 })) };
    case 'thisMonth': return { from: fmtDay(startOfMonth(today)), to: fmtDay(endOfMonth(today)) };
    case 'lastMonth': {
      const lm = addMonths(today, -1);
      return { from: fmtDay(startOfMonth(lm)), to: fmtDay(endOfMonth(lm)) };
    }
    case 'last30': return { from: fmtDay(addDays(today, -29)), to: fmtDay(today) };
    case 'thisYear': return { from: fmtDay(startOfYear(today)), to: fmtDay(endOfYear(today)) };
    default: return { from: '', to: '' };
  }
}
const scopeQuickOptions = computed(() => [
  ...(props.rangeStart && props.rangeEnd ? [{ key: 'calendar', label: '時間表區間' }] : []),
  { key: 'thisWeek', label: '本週' },
  { key: 'thisMonth', label: '本月' },
  { key: 'lastMonth', label: '上月' },
  { key: 'last30', label: '近30天' },
  { key: 'thisYear', label: '今年' },
]);
function applyScopeQuick(key) {
  const r = quickRange(key);
  scopeFrom.value = r.from;
  scopeTo.value = r.to;
}
function scopeQuickActive(key) {
  const r = quickRange(key);
  return !!r.from && scopeFrom.value === r.from && scopeTo.value === r.to;
}
const activeScopeQuickKey = computed(() => scopeQuickOptions.value.find(q => scopeQuickActive(q.key))?.key || '');

// 已載入的日期區間（時間表目前範圍、曾補抓過的範圍）；新範圍完全落在其中一段內就不再補抓
const fetchedRanges = [];
function isRangeLoaded(from, to) {
  return fetchedRanges.some(r => r.from <= from && r.to >= to);
}
function markRangeLoaded(from, to) {
  if (from && to && !isRangeLoaded(from, to)) fetchedRanges.push({ from, to });
}
watchDebounced(
  () => [scopeFrom.value, scopeTo.value],
  ([from, to]) => {
    if (!isOpen.value || !DATE_RE.test(from || '') || !DATE_RE.test(to || '') || from > to) return;
    if (isRangeLoaded(from, to)) return;
    markRangeLoaded(from, to);
    emit('fetch-range', { start: from, end: to });
  },
  { debounce: 500 }
);

// 項目／方式清單晚到或新增時，新出現的選項自動勾選（避免整批被濾掉）
watch(() => props.typeOptions, (opts, prev) => {
  const added = opts.filter(o => !(prev || []).includes(o));
  if (added.length) scopeTypes.value = [...new Set([...scopeTypes.value, ...added])];
});
watch(() => props.methodOptions, (opts, prev) => {
  const added = opts.filter(o => !(prev || []).includes(o));
  if (added.length) scopeMethods.value = [...new Set([...scopeMethods.value, ...added])];
});

// 清單裡沒有的值（方式空白、項目改名等）不受勾選影響，與時間表篩選規則一致
function matchesOption(value, selected, options) {
  return !options.includes(value) || selected.includes(value);
}
const baseItems = computed(() => {
  const from = DATE_RE.test(scopeFrom.value || '') ? scopeFrom.value : '';
  const to = DATE_RE.test(scopeTo.value || '') ? scopeTo.value : '';
  return props.items.filter(e => {
    if (!e.start) return false;
    const day = startDateStr(e);
    if (from && day < from) return false;
    if (to && day > to) return false;
    return matchesOption(e.status, scopeStatuses.value, STATUS_OPTIONS)
      && matchesOption(e.bookingType, scopeTypes.value, props.typeOptions)
      && matchesOption(e.inspectionMethod, scopeMethods.value, props.methodOptions);
  });
});

// ── 篩選器（任選欄位、勾選要保留的值；日期類另有起訖）──
const pivotFilters = ref([]); // [{ field, selected: [], from, to }]
const filterFieldToAdd = ref(null);
function filterIsDate(field) {
  return ['date', 'month', 'week'].includes(dimensionMap.value.get(field)?.kind);
}
function filterHasRange(f) {
  return filterIsDate(f.field) && (DATE_RE.test(f.from || '') || DATE_RE.test(f.to || ''));
}
// 維度值（日期 yyyy-MM-dd、月份 yyyy-MM、週 yyyy-MM-dd～MM-dd）是否落在起訖內；未填寫一律排除
function dateValueInRange(v, f) {
  if (!v || v === EMPTY) return false;
  const kind = dimensionMap.value.get(f.field)?.kind;
  const val = kind === 'week' ? v.slice(0, 10) : v;
  const norm = d => (kind === 'month' ? d.slice(0, 7) : d);
  if (DATE_RE.test(f.from || '') && val < norm(f.from)) return false;
  if (DATE_RE.test(f.to || '') && val > norm(f.to)) return false;
  return true;
}
const FILTER_DATE_QUICK_OPTIONS = [
  { key: 'thisMonth', label: '本月' },
  { key: 'lastMonth', label: '上月' },
  { key: 'last30', label: '近30天' },
  { key: 'thisYear', label: '今年' },
];
function applyFilterDateQuick(f, key) {
  const r = quickRange(key);
  f.from = r.from;
  f.to = r.to;
}
function filterDateQuickActive(f, key) {
  const r = quickRange(key);
  return f.from === r.from && f.to === r.to;
}
function addFilter(fieldKey) {
  if (fieldKey && dimensionMap.value.has(fieldKey) && !pivotFilters.value.some(f => f.field === fieldKey)) {
    pivotFilters.value.push({ field: fieldKey, selected: [], from: '', to: '' });
  }
  nextTick(() => { filterFieldToAdd.value = null; });
}
const filterOptionsMap = computed(() => {
  const map = {};
  for (const f of pivotFilters.value) {
    const set = new Set();
    for (const it of baseItems.value) dimValuesOf(it, f.field).forEach(v => set.add(v));
    const keys = filterHasRange(f) ? [...set].filter(v => dateValueInRange(v, f)) : [...set];
    map[f.field] = sortDimKeys(keys, f.field, () => 0);
  }
  return map;
});
// 最終資料 = 基底 + 所有啟用中的篩選器（篩選器內 OR、篩選器之間 AND）
const sourceItems = computed(() => {
  const active = pivotFilters.value
    .filter(f => f.selected.length > 0 || filterHasRange(f))
    .map(f => ({ field: f.field, sel: f.selected.length ? new Set(f.selected) : null, range: filterHasRange(f) ? f : null }));
  if (!active.length) return baseItems.value;
  return baseItems.value.filter(item => active.every(f => {
    let values = dimValuesOf(item, f.field);
    if (f.range) values = values.filter(v => dateValueInRange(v, f.range));
    if (!values.length) return false;
    return f.sel ? values.some(v => f.sel.has(v)) : true;
  }));
});

// ── 透視矩陣 ──
const colKeyOrder = ref([]); // 欄群組手動順序（拖曳表頭；欄維度變更時重置）
const unitKeyOf = item => (item.unitId ? `${item.building || ''}|${item.unitId}` : '');
// 各維度值的笛卡兒積（多值欄位一筆可對到多個組合）
function combosOf(item, dims) {
  let combos = [[]];
  for (const d of dims) {
    const values = dimValuesOf(item, d);
    const next = [];
    for (const c of combos) for (const v of values) next.push([...c, v]);
    combos = next;
  }
  return combos;
}
const pivotMatrix = computed(() => {
  const items = sourceItems.value;
  const rDims = rowDims.value;
  const cDims = colDims.value;
  const useCol = cDims.length > 0;
  const valueDefs = pivotValues.value;

  // 每筆預約在單一儲存格只會累加一次，所以筆數＝不重複預約數
  const valueListCache = new Map();
  const cachedList = (item, field) => {
    let byItem = valueListCache.get(field);
    if (!byItem) { byItem = new Map(); valueListCache.set(field, byItem); }
    let list = byItem.get(item);
    if (!list) { list = valueListOf(item, field); byItem.set(item, list); }
    return list;
  };
  const newCell = () => ({
    count: 0,
    items: [],
    sets: valueDefs.map(vd => (vd.field === '__units__' || vd.mode === 'distinct' ? new Set() : null)),
    filled: valueDefs.map(() => 0),
  });
  const accumulate = (cell, item) => {
    cell.count++;
    cell.items.push(item);
    valueDefs.forEach((vd, i) => {
      if (vd.field === '__count__') return;
      if (vd.field === '__units__') {
        const u = unitKeyOf(item);
        if (u) cell.sets[i].add(u);
        return;
      }
      const list = cachedList(item, vd.field);
      if (vd.mode === 'filled') { if (list.length) cell.filled[i]++; } else list.forEach(v => cell.sets[i].add(v));
    });
  };
  const cellValueAt = (cell, i) => {
    const vd = valueDefs[i];
    if (vd.field === '__count__') return cell.count;
    if (vd.mode === 'filled') return cell.filled[i];
    return cell.sets[i].size;
  };

  const rowMap = new Map(); // rowKey -> { parts, totalCell, cols: Map(colKey -> cell) }
  const colMap = new Map(); // colKey -> { parts, cell }
  const grandCell = newCell();
  for (const item of items) {
    const rCombos = rDims.length ? combosOf(item, rDims) : [['全部']];
    const cCombos = useCol ? combosOf(item, cDims) : [['']];
    const cEntries = [];
    for (const cParts of cCombos) {
      const cKey = cParts.join(PIVOT_SEP);
      let col = colMap.get(cKey);
      if (!col) { col = { parts: cParts, cell: newCell() }; colMap.set(cKey, col); }
      accumulate(col.cell, item);
      cEntries.push(cKey);
    }
    for (const rParts of rCombos) {
      const rKey = rParts.join(PIVOT_SEP);
      let row = rowMap.get(rKey);
      if (!row) { row = { parts: rParts, totalCell: newCell(), cols: new Map() }; rowMap.set(rKey, row); }
      accumulate(row.totalCell, item);
      for (const cKey of cEntries) {
        let cc = row.cols.get(cKey);
        if (!cc) { cc = newCell(); row.cols.set(cKey, cc); }
        accumulate(cc, item);
      }
    }
    accumulate(grandCell, item);
  }

  // 階層排序：逐層依各維度的鍵值排序規則（數量權重取該層合計筆數）
  const buildLevelOrders = (dims, entries) => dims.map((dk, li) => {
    const totals = new Map();
    for (const e of entries) totals.set(e.parts[li], (totals.get(e.parts[li]) || 0) + e.count);
    const sorted = sortDimKeys([...totals.keys()], dk, k => totals.get(k) || 0);
    return new Map(sorted.map((k, i) => [k, i]));
  });
  const cmpByLevels = orderMaps => (aParts, bParts) => {
    for (let i = 0; i < orderMaps.length; i++) {
      const d = (orderMaps[i].get(aParts[i]) ?? 0) - (orderMaps[i].get(bParts[i]) ?? 0);
      if (d) return d;
    }
    return 0;
  };
  const rowOrders = buildLevelOrders(rDims, [...rowMap.values()].map(r => ({ parts: r.parts, count: r.totalCell.count })));
  const colOrders = buildLevelOrders(cDims, [...colMap.values()].map(c => ({ parts: c.parts, count: c.cell.count })));
  const rowKeys = [...rowMap.keys()].sort((a, b) => cmpByLevels(rowOrders)(rowMap.get(a).parts, rowMap.get(b).parts));
  let colKeys = useCol
    ? [...colMap.keys()].sort((a, b) => cmpByLevels(colOrders)(colMap.get(a).parts, colMap.get(b).parts))
    : [''];
  if (useCol && colKeyOrder.value.length) {
    const pos = new Map(colKeyOrder.value.map((k, i) => [k, i]));
    const manual = colKeys.filter(k => pos.has(k)).sort((a, b) => pos.get(a) - pos.get(b));
    colKeys = [...manual, ...colKeys.filter(k => !pos.has(k))];
  }

  const rows = rowKeys.map(rKey => {
    const row = rowMap.get(rKey);
    const cells = {};
    for (const cKey of colKeys) {
      const cc = row.cols.get(cKey);
      cells[cKey] = { count: cc ? cc.count : 0, values: valueDefs.map((vd, i) => (cc ? cellValueAt(cc, i) : 0)) };
    }
    return {
      key: rKey,
      parts: row.parts,
      cells,
      total: row.totalCell.count,
      totalValues: valueDefs.map((vd, i) => cellValueAt(row.totalCell, i)),
    };
  });
  const colTotals = {};
  for (const cKey of colKeys) {
    const col = colMap.get(cKey);
    colTotals[cKey] = { count: col ? col.cell.count : 0, values: valueDefs.map((vd, i) => (col ? cellValueAt(col.cell, i) : 0)) };
  }

  // 下鑽明細：儲存格 → 預約清單
  const itemsByCell = new Map();
  for (const rKey of rowKeys) {
    const row = rowMap.get(rKey);
    itemsByCell.set(`${rKey}${PIVOT_CELL_SEP}__row__`, row.totalCell.items);
    for (const [cKey, cc] of row.cols) itemsByCell.set(`${rKey}${PIVOT_CELL_SEP}${cKey}`, cc.items);
  }
  for (const [cKey, col] of colMap) itemsByCell.set(`__col__${PIVOT_CELL_SEP}${cKey}`, col.cell.items);
  itemsByCell.set('__grand__', grandCell.items);

  return {
    rows,
    colKeys,
    colTotals,
    useCol,
    valueDefs,
    rowDimLabels: rDims.length ? rDims.map(dimLabel) : ['全部'],
    itemCount: items.length,
    grand: { count: grandCell.count, values: valueDefs.map((vd, i) => cellValueAt(grandCell, i)) },
    itemsByCell,
  };
});
const hasValues = computed(() => pivotMatrix.value.valueDefs.length > 0);
const headerRowCount = computed(() => (pivotMatrix.value.useCol && hasValues.value ? 2 : 1));

// ── 排序：點表頭切換 升冪 → 降冪 → 回復預設 ──
// spec: { type: 'name'|'cell'|'total', li?, cKey?, vi?, dir }
const pivotSort = ref(null);
let isRestoring = false; // 還原記憶設定／套用方案期間，暫停「設定變更 → 重置排序/欄群組順序/自動記憶」
watch([rowDims, colDims, pivotValues], () => { if (!isRestoring) pivotSort.value = null; }, { deep: true });
watch(colDims, () => { if (!isRestoring) colKeyOrder.value = []; }, { deep: true });
function sortSpecEquals(a, b) {
  return !!a && !!b && a.type === b.type && a.li === b.li && a.cKey === b.cKey && a.vi === b.vi;
}
function toggleSort(spec) {
  const cur = pivotSort.value;
  if (cur && sortSpecEquals(cur, spec)) pivotSort.value = cur.dir === 'asc' ? { ...spec, dir: 'desc' } : null;
  else pivotSort.value = { ...spec, dir: spec.type === 'name' ? 'asc' : 'desc' };
}
function sortActive(spec) { return !!pivotSort.value && sortSpecEquals(pivotSort.value, spec); }
function sortIcon(spec) {
  if (!sortActive(spec)) return 'mdi-unfold-more-horizontal';
  return pivotSort.value.dir === 'asc' ? 'mdi-arrow-up' : 'mdi-arrow-down';
}
const sortedRows = computed(() => {
  const spec = pivotSort.value;
  const rows = pivotMatrix.value.rows;
  if (!spec) return rows;
  const mul = spec.dir === 'asc' ? 1 : -1;
  return [...rows].sort((a, b) => {
    if (spec.type === 'name') {
      const dim = dimensionMap.value.get(rowDims.value[spec.li]);
      return compareDimValues(dim, a.parts[spec.li] ?? '', b.parts[spec.li] ?? '') * mul;
    }
    const av = spec.type === 'total' ? (a.totalValues[spec.vi] ?? -Infinity) : (a.cells[spec.cKey]?.values[spec.vi] ?? -Infinity);
    const bv = spec.type === 'total' ? (b.totalValues[spec.vi] ?? -Infinity) : (b.cells[spec.cKey]?.values[spec.vi] ?? -Infinity);
    return ((av - bv) * mul) || String(a.key).localeCompare(String(b.key), 'zh-Hant');
  });
});

// ── 表頭拖曳調整欄位順序：列維度欄（分層順序）/ 欄維度群組 / 值欄；複製與匯出依相同順序 ──
const thDrag = ref(null);
const thDragOver = ref(null);
const thSame = (a, b) => !!a && !!b && a.type === b.type && a.index === b.index;
function thDragProps(spec, enabled = true) {
  if (!enabled) return {};
  const dragging = thSame(thDrag.value, spec);
  return {
    draggable: 'true',
    title: '點擊排序・按住拖曳可調整欄位順序',
    class: {
      'ipv-th-draggable': true,
      'ipv-th-dragging': dragging,
      'ipv-th-drop-target': !dragging && thSame(thDragOver.value, spec),
    },
    onDragstart: (e) => {
      thDrag.value = spec;
      e.dataTransfer.effectAllowed = 'move';
      // 刻意不寫入 text/plain：避免拖到「列/欄/值/篩選器」放置區被當成欄位鍵值加入
      e.dataTransfer.setData('application/x-pivot-th', spec.type);
    },
    onDragover: (e) => {
      const src = thDrag.value;
      if (!src || src.type !== spec.type) return;
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      if (!thSame(thDragOver.value, spec)) thDragOver.value = spec;
    },
    onDragleave: () => { if (thSame(thDragOver.value, spec)) thDragOver.value = null; },
    onDrop: (e) => {
      e.preventDefault();
      moveColumn(thDrag.value, spec);
      thDrag.value = null;
      thDragOver.value = null;
    },
    onDragend: () => { thDrag.value = null; thDragOver.value = null; },
  };
}
function moveColumn(src, dst) {
  if (!src || !dst || src.type !== dst.type || src.index === dst.index) return;
  const moveItem = (arr) => {
    const next = [...arr];
    const [picked] = next.splice(src.index, 1);
    next.splice(dst.index, 0, picked);
    return next;
  };
  if (src.type === 'rowDim') rowDims.value = moveItem(rowDims.value);
  else if (src.type === 'value') pivotValues.value = moveItem(pivotValues.value);
  else if (src.type === 'colKey') colKeyOrder.value = moveItem(pivotMatrix.value.colKeys);
}

// ── 儲存格顯示 ──
function colLabel(cKey) {
  return String(cKey).split(PIVOT_SEP).filter(Boolean).join(' / ');
}
function cellMain(row, cKey, vi) {
  return formatCount(row.cells[cKey]?.values[vi]);
}
// 儲存格副行：筆數（非筆數的值）＋ 佔比
function cellSub(row, cKey, vi) {
  const vd = pivotMatrix.value.valueDefs[vi];
  const parts = [];
  if (vd.field !== '__count__' && showBoth.value) parts.push(`${row.cells[cKey]?.count || 0}筆`);
  const pct = cellPctText(row, cKey, vi);
  if (pct) parts.push(pct);
  return parts.join('・');
}
function cellPctText(row, cKey, vi) {
  if (cellPct.value === 'none') return '';
  const m = pivotMatrix.value;
  const metric = row.cells[cKey]?.values[vi] || 0;
  let denom = 0;
  if (cellPct.value === 'grand') denom = m.grand.values[vi] || 0;
  else if (cellPct.value === 'row') denom = row.totalValues[vi] || 0;
  else if (cellPct.value === 'col') denom = m.colTotals[cKey]?.values[vi] || 0;
  if (!denom) return '';
  return `${Math.round((metric / denom) * 1000) / 10}%`;
}
// 總計欄凍結在表格右緣：依值欄位數計算各欄的 right 偏移
const TOTAL_COL_W = 100;
function stickyTotalStyle(vi, bg) {
  const n = pivotMatrix.value.valueDefs.length;
  const style = { position: 'sticky', right: `${(n - 1 - vi) * TOTAL_COL_W}px`, minWidth: `${TOTAL_COL_W}px`, maxWidth: `${TOTAL_COL_W}px`, backgroundColor: bg, zIndex: 3 };
  if (vi === 0) style.boxShadow = '-3px 0 4px rgba(0,0,0,0.08)';
  return style;
}
function stickyTotalGroupStyle(bg) {
  return { position: 'sticky', right: '0', backgroundColor: bg, zIndex: 3, boxShadow: '-3px 0 4px rgba(0,0,0,0.08)' };
}
function rowTotalMain(row, vi) { return formatCount(row.totalValues[vi]); }
function colTotalMain(cKey, vi) { return formatCount(pivotMatrix.value.colTotals[cKey]?.values[vi]); }
function grandMain(vi) { return formatCount(pivotMatrix.value.grand.values[vi]); }

// ── 下鑽明細 ──
const drill = reactive({ open: false, title: '', items: [] });
function openDrill(rowKey, colKey) {
  const partsLabel = k => String(k).split(PIVOT_SEP).filter(Boolean).join(' / ');
  let key;
  let title;
  if (rowKey === '__grand__') { key = '__grand__'; title = '全部'; }
  else if (colKey === '__row__') { key = `${rowKey}${PIVOT_CELL_SEP}__row__`; title = partsLabel(rowKey); }
  else if (rowKey === '__col__') { key = `__col__${PIVOT_CELL_SEP}${colKey}`; title = partsLabel(colKey); }
  else { key = `${rowKey}${PIVOT_CELL_SEP}${colKey}`; title = [partsLabel(rowKey), partsLabel(colKey)].filter(Boolean).join(' × '); }
  drill.items = [...(pivotMatrix.value.itemsByCell.get(key) || [])].sort((a, b) => a.start - b.start);
  drill.title = title || '全部';
  drill.open = true;
}
function drillDateText(it) {
  return it.start ? `${format(it.start, 'yyyy-MM-dd')}（${DOW[it.start.getDay()]}）${format(it.start, 'HH:mm')}` : '—';
}

// ── 設定快照（本機自動記憶與建案方案共用）──
const SORT_TYPES = new Set(['name', 'cell', 'total']);
function buildSettingsSnapshot() {
  const sort = pivotSort.value;
  const quick = activeScopeQuickKey.value;
  return {
    v: 1,
    rowDims: [...rowDims.value],
    colDims: [...colDims.value],
    values: pivotValues.value.map(vd => ({ field: vd.field, mode: vd.mode })),
    filters: pivotFilters.value.map(f => ({ field: f.field, selected: [...(f.selected || [])], from: f.from || '', to: f.to || '' })),
    sort: sort ? {
      type: sort.type, dir: sort.dir,
      ...(sort.li !== undefined ? { li: sort.li } : {}),
      ...(sort.cKey !== undefined ? { cKey: sort.cKey } : {}),
      ...(sort.vi !== undefined ? { vi: sort.vi } : {}),
    } : null,
    colKeyOrder: [...colKeyOrder.value],
    showBoth: showBoth.value,
    cellPct: cellPct.value,
    showChart: showChart.value,
    // 資料範圍：快速鍵存相對區間（套用時依當天重算），自訂起訖存固定日期
    scope: {
      dateQuick: quick,
      from: quick ? '' : scopeFrom.value,
      to: quick ? '' : scopeTo.value,
      statuses: [...scopeStatuses.value],
      types: [...scopeTypes.value],
      methods: [...scopeMethods.value],
    },
  };
}
/**
 * 套用設定物件（欄位若已不存在會被略過）
 * @param {{ scope?: boolean }} opts scope=true 時一併套用資料範圍；本機自動記憶不含資料範圍
 */
function applySettingsObject(s, { scope = false } = {}) {
  if (!s || typeof s !== 'object') return;
  isRestoring = true;
  try {
    const validDim = k => dimensionMap.value.has(k);
    const validValueField = k => isCountField(k) || validDim(k);
    if (Array.isArray(s.rowDims)) rowDims.value = s.rowDims.filter(validDim);
    if (Array.isArray(s.colDims)) colDims.value = s.colDims.filter(k => validDim(k) && !rowDims.value.includes(k));
    if (Array.isArray(s.values)) {
      pivotValues.value = s.values
        .filter(vd => vd && validValueField(vd.field))
        .map(vd => ({
          field: vd.field,
          mode: isCountField(vd.field) ? 'count' : (FIELD_AGG_OPTIONS.some(o => o.key === vd.mode) ? vd.mode : 'distinct'),
        }));
    }
    if (Array.isArray(s.filters)) {
      pivotFilters.value = s.filters
        .filter(f => f && validDim(f.field))
        .map(f => ({
          field: f.field,
          selected: Array.isArray(f.selected) ? [...f.selected] : [],
          from: filterIsDate(f.field) && DATE_RE.test(f.from || '') ? f.from : '',
          to: filterIsDate(f.field) && DATE_RE.test(f.to || '') ? f.to : '',
        }));
    }
    if (typeof s.showBoth === 'boolean') showBoth.value = s.showBoth;
    if (CELL_PCT_OPTIONS.some(o => o.key === s.cellPct)) cellPct.value = s.cellPct;
    if (typeof s.showChart === 'boolean') showChart.value = s.showChart;
    colKeyOrder.value = Array.isArray(s.colKeyOrder) ? s.colKeyOrder.filter(k => typeof k === 'string') : [];
    if (s.sort && SORT_TYPES.has(s.sort.type) && (s.sort.dir === 'asc' || s.sort.dir === 'desc')) pivotSort.value = { ...s.sort };
    else if ('sort' in s) pivotSort.value = null;
    if (scope && s.scope && typeof s.scope === 'object') {
      const sc = s.scope;
      if (sc.dateQuick && scopeQuickOptions.value.some(q => q.key === sc.dateQuick)) applyScopeQuick(sc.dateQuick);
      else if (DATE_RE.test(sc.from || '') && DATE_RE.test(sc.to || '')) { scopeFrom.value = sc.from; scopeTo.value = sc.to; }
      if (Array.isArray(sc.statuses)) scopeStatuses.value = sc.statuses.filter(v => STATUS_OPTIONS.includes(v));
      if (Array.isArray(sc.types)) scopeTypes.value = sc.types.filter(v => props.typeOptions.includes(v));
      if (Array.isArray(sc.methods)) scopeMethods.value = sc.methods.filter(v => props.methodOptions.includes(v));
    }
  } finally {
    nextTick(() => { isRestoring = false; });
  }
}

// ── 記住透視設定（依建案，localStorage；不含資料範圍）──
const settingsKey = computed(() => `inspectionPivotSettings_${props.projectId || 'default'}`);
function saveSettings() {
  if (isRestoring) return;
  try {
    const { scope, ...rest } = buildSettingsSnapshot();
    localStorage.setItem(settingsKey.value, JSON.stringify(rest));
  } catch (e) { /* localStorage 不可用時靜默略過 */ }
}
function restoreSettings() {
  try {
    const raw = localStorage.getItem(settingsKey.value);
    if (raw) applySettingsObject(JSON.parse(raw));
  } catch (e) { /* 設定損毀時忽略，用預設值 */ }
}
watch(
  [rowDims, colDims, pivotValues, pivotFilters, pivotSort, showBoth, cellPct, showChart, colKeyOrder],
  saveSettings,
  { deep: true }
);

// ── 方案（建案層級共用，Firestore inspectionPivotPresets）──
const isLoggedIn = computed(() => userStore.isLoggedIn);
const canManage = computed(() => {
  if (!isLoggedIn.value) return false;
  const roles = userStore.user?.roles || [];
  return props.canEdit || roles.includes('超級管理員') || roles.includes('系統管理員');
});
const presets = ref([]);
let presetsUnsub = null;
let presetsProjectId = null;
const isPresetMenuOpen = ref(false);
const activePresetId = ref(null);
const activePreset = computed(() => presets.value.find(p => p.id === activePresetId.value) || null);
const stripVersion = (s) => {
  if (!s || typeof s !== 'object') return null;
  const { v, ...rest } = s;
  return rest;
};
const presetDirty = computed(() => {
  const p = activePreset.value;
  if (!p) return false;
  return JSON.stringify(stripVersion(buildSettingsSnapshot())) !== JSON.stringify(stripVersion(p.settings));
});
function presetAuthor() {
  return { name: userStore.user?.name || '', key: userStore.user?.key || '' };
}
function subscribePresets() {
  const pid = props.projectId;
  if (!pid || !isLoggedIn.value || presetsProjectId === pid) return;
  unsubscribePresets();
  presetsProjectId = pid;
  presetsUnsub = presetService.listenToProjectPivotPresets(pid, (list) => {
    presets.value = list;
    if (activePresetId.value && !list.some(p => p.id === activePresetId.value)) activePresetId.value = null;
  });
}
function unsubscribePresets() {
  if (presetsUnsub) { presetsUnsub(); presetsUnsub = null; }
  presetsProjectId = null;
  presets.value = [];
  activePresetId.value = null;
}
onUnmounted(unsubscribePresets);

// 清除全部：列／欄／值／篩選器／排序／欄順序（資料範圍與顯示選項保留）
const pivotHasAnySetting = computed(() =>
  rowDims.value.length > 0 || colDims.value.length > 0 || pivotValues.value.length > 0
  || pivotFilters.value.length > 0 || pivotSort.value !== null || colKeyOrder.value.length > 0
);
function clearPivotSettings() {
  rowDims.value = [];
  colDims.value = [];
  pivotValues.value = [];
  pivotFilters.value = [];
  pivotSort.value = null;
  colKeyOrder.value = [];
  activePresetId.value = null;
}
function applyPreset(preset) {
  if (!preset) return;
  applySettingsObject(preset.settings, { scope: true });
  activePresetId.value = preset.id;
  isPresetMenuOpen.value = false;
  nextTick(() => saveSettings()); // 套用後同步寫入本機記憶（還原旗標解除後）
}
function presetNameError(name, excludeId = null) {
  const n = normalizePresetName(name);
  if (!n) return '請輸入名稱';
  if (presets.value.some(p => p.id !== excludeId && p.name === n)) return '名稱已存在';
  return '';
}
const presetSave = reactive({ open: false, name: '', overwriteId: null, error: '', saving: false });
function openPresetSave() {
  const active = activePreset.value;
  presetSave.overwriteId = active ? active.id : null;
  presetSave.name = active ? active.name : '';
  presetSave.error = '';
  presetSave.saving = false;
  presetSave.open = true;
}
function onPresetOverwriteChange(id) {
  const p = presets.value.find(x => x.id === id);
  if (p) presetSave.name = p.name;
  presetSave.error = '';
}
async function submitPresetSave() {
  if (presetSave.saving) return;
  const err = presetNameError(presetSave.name, presetSave.overwriteId);
  if (err) { presetSave.error = err; return; }
  presetSave.saving = true;
  try {
    const settings = buildSettingsSnapshot();
    if (presetSave.overwriteId) {
      await presetService.updatePivotPreset(presetSave.overwriteId, { name: presetSave.name, settings }, presetAuthor());
      activePresetId.value = presetSave.overwriteId;
    } else {
      activePresetId.value = await presetService.createPivotPreset(props.projectId, presetSave.name, settings, presetAuthor());
    }
    presetSave.open = false;
    toast.success('方案已儲存', { position: POSITION.TOP_CENTER, timeout: 2000 });
  } catch (e) {
    console.error('儲存驗屋透視方案失敗:', e);
    toast.error('儲存失敗，請重試', { position: POSITION.TOP_CENTER, timeout: 2500 });
  } finally {
    presetSave.saving = false;
  }
}
const presetRename = reactive({ open: false, id: null, name: '', error: '', saving: false });
function openPresetRename(p) {
  presetRename.id = p.id;
  presetRename.name = p.name;
  presetRename.error = '';
  presetRename.saving = false;
  presetRename.open = true;
}
async function submitPresetRename() {
  if (presetRename.saving) return;
  const err = presetNameError(presetRename.name, presetRename.id);
  if (err) { presetRename.error = err; return; }
  presetRename.saving = true;
  try {
    await presetService.updatePivotPreset(presetRename.id, { name: presetRename.name }, presetAuthor());
    presetRename.open = false;
  } catch (e) {
    console.error('重新命名驗屋透視方案失敗:', e);
    toast.error('重新命名失敗，請重試', { position: POSITION.TOP_CENTER, timeout: 2500 });
  } finally {
    presetRename.saving = false;
  }
}
const presetDelete = reactive({ open: false, preset: null, busy: false });
function openPresetDelete(p) {
  presetDelete.preset = p;
  presetDelete.busy = false;
  presetDelete.open = true;
}
async function submitPresetDelete() {
  const p = presetDelete.preset;
  if (!p || presetDelete.busy) return;
  presetDelete.busy = true;
  try {
    await presetService.deletePivotPreset(p.id);
    if (activePresetId.value === p.id) activePresetId.value = null;
    presetDelete.open = false;
    toast.success('方案已刪除', { position: POSITION.TOP_CENTER, timeout: 2000 });
  } catch (e) {
    console.error('刪除驗屋透視方案失敗:', e);
    toast.error('刪除失敗，請重試', { position: POSITION.TOP_CENTER, timeout: 2500 });
  } finally {
    presetDelete.busy = false;
  }
}

// ── 匯出資料組裝（複製 TSV 與匯出 Excel 共用）──
function buildAoa() {
  const m = pivotMatrix.value;
  if (!m.valueDefs.length) {
    const headers = [...m.rowDimLabels, ...(m.useCol ? m.colKeys.map(colLabel) : [])];
    const body = sortedRows.value.map(row => [
      ...row.parts,
      ...(m.useCol ? m.colKeys.map(cKey => (row.cells[cKey]?.count ? '✓' : '')) : []),
    ]);
    return [headers, ...body];
  }
  const headers = [
    ...m.rowDimLabels,
    ...m.colKeys.flatMap(cKey => m.valueDefs.map(vd => (m.useCol ? `${colLabel(cKey)}·${valueDefLabel(vd)}` : valueDefLabel(vd)))),
    ...(m.useCol ? m.valueDefs.map(vd => `總計·${valueDefLabel(vd)}`) : []),
  ];
  const body = sortedRows.value.map(row => [
    ...row.parts,
    ...m.colKeys.flatMap(cKey => m.valueDefs.map((vd, vi) => row.cells[cKey]?.values[vi] ?? '')),
    ...(m.useCol ? m.valueDefs.map((vd, vi) => row.totalValues[vi] ?? '') : []),
  ]);
  const footer = [
    ...m.rowDimLabels.map((_, li) => (li === 0 ? '總計' : '')),
    ...m.colKeys.flatMap(cKey => m.valueDefs.map((vd, vi) => m.colTotals[cKey]?.values[vi] ?? '')),
    ...(m.useCol ? m.valueDefs.map((vd, vi) => m.grand.values[vi] ?? '') : []),
  ];
  return [headers, ...body, footer];
}
async function copyTable() {
  try {
    await navigator.clipboard.writeText(buildAoa().map(r => r.join('\t')).join('\n'));
    toast.success('已複製到剪貼簿！', { position: POSITION.TOP_CENTER, timeout: 2000 });
  } catch (e) {
    console.error('複製資料透視表失敗:', e);
    toast.error('複製失敗，請重試。', { position: POSITION.TOP_CENTER, timeout: 2500 });
  }
}
// 匯出標題／檔名：有套用方案時採用方案名稱，否則以列／欄維度組成
function exportLabel() {
  const m = pivotMatrix.value;
  const presetName = activePreset.value?.name?.replace(/[\\/:*?"<>|]/g, '_').trim();
  if (presetName) return presetName;
  const colPart = m.useCol ? `×${colDims.value.map(dimLabel).join('+')}` : '';
  return `驗屋資料透視_${m.rowDimLabels.join('+')}${colPart}`.replace(/[\\/:*?"<>|]/g, '_');
}
function exportTitle() { return `${props.projectName} - ${exportLabel()}`; }
function exportMeta() {
  const now = new Date();
  const p = n => String(n).padStart(2, '0');
  const stamp = `${now.getFullYear()}/${p(now.getMonth() + 1)}/${p(now.getDate())} ${p(now.getHours())}:${p(now.getMinutes())}`;
  const range = scopeFrom.value || scopeTo.value ? `${scopeFrom.value || '—'} ～ ${scopeTo.value || '—'} ・ ` : '';
  return `${range}共 ${pivotMatrix.value.itemCount} 筆預約 ・ 匯出時間 ${stamp}`;
}
async function exportExcel() {
  const m = pivotMatrix.value;
  if (!m.rows.length) return;
  const XLSX = await loadXLSX();
  const dataAoa = buildAoa();
  const TITLE_ROWS = 2;
  const ws = XLSX.utils.aoa_to_sheet([[exportTitle()], [exportMeta()], ...dataAoa]);
  const range = XLSX.utils.decode_range(ws['!ref']);
  ws['!merges'] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: range.e.c } },
    { s: { r: 1, c: 0 }, e: { r: 1, c: range.e.c } },
  ];
  ws.A1.s = { font: { bold: true, sz: 14 }, alignment: { vertical: 'center' } };
  ws.A2.s = { font: { sz: 10, color: { rgb: '666666' } } };
  ws['!rows'] = [{ hpt: 24 }, { hpt: 16 }];
  for (let r = TITLE_ROWS + 1; r <= range.e.r; r++) {
    for (let c = range.s.c; c <= range.e.c; c++) {
      const cell = ws[XLSX.utils.encode_cell({ r, c })];
      if (cell && cell.t === 'n') cell.z = '#,##0';
    }
  }
  const headerStyle = {
    font: { bold: true },
    fill: { fgColor: { rgb: 'E8EAF6' } },
    alignment: { horizontal: 'center', vertical: 'center' },
    border: { bottom: { style: 'thin', color: { rgb: '9FA8DA' } } },
  };
  const footerStyle = { font: { bold: true }, fill: { fgColor: { rgb: 'EEEEEE' } } };
  for (let c = range.s.c; c <= range.e.c; c++) {
    const hCell = ws[XLSX.utils.encode_cell({ r: TITLE_ROWS, c })];
    if (hCell) hCell.s = headerStyle;
    const fCell = m.valueDefs.length ? ws[XLSX.utils.encode_cell({ r: range.e.r, c })] : null;
    if (fCell) fCell.s = footerStyle;
  }
  ws['!cols'] = dataAoa[0].map((h, i) => ({ wch: i === 0 ? 18 : Math.max(10, String(h).length * 2 + 2) }));
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, '資料透視');
  XLSX.writeFile(wb, `${props.projectName}_${exportLabel()}.xlsx`);
  toast.success('已匯出 Excel！', { position: POSITION.TOP_CENTER, timeout: 2000 });
}

// ── 匯出 PDF：組出獨立 HTML（預覽 iframe 與 PDF 截圖共用），iframe 內腳本負責縮放至一頁寬與分頁 ──
const pdf = reactive({ open: false, orientation: 'landscape', html: '', downloading: false });
const PDF_PAGE = { portrait: { w: 794, h: 1123 }, landscape: { w: 1123, h: 794 } }; // A4 @96dpi
const PDF_PAD = 40;
const escapeHtml = v => String(v ?? '').replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
function buildPdfTableHtml() {
  const m = pivotMatrix.value;
  const withValues = m.valueDefs.length > 0;
  const headerRows = m.useCol && withValues ? 2 : 1;
  const th = (text, attrs = '') => `<th ${attrs}>${escapeHtml(text)}</th>`;
  let thead = '<tr>';
  m.rowDimLabels.forEach(l => { thead += th(l, `rowspan="${headerRows}" class="lbl"`); });
  if (m.useCol) {
    m.colKeys.forEach(cKey => { thead += th(colLabel(cKey), `colspan="${Math.max(m.valueDefs.length, 1)}"`); });
    if (withValues) thead += th('總計', `colspan="${m.valueDefs.length}"`);
  } else {
    m.valueDefs.forEach(vd => { thead += th(valueDefLabel(vd)); });
  }
  thead += '</tr>';
  if (headerRows === 2) {
    thead += '<tr>';
    m.colKeys.forEach(() => { m.valueDefs.forEach(vd => { thead += th(valueDefLabel(vd), 'class="sub-th"'); }); });
    m.valueDefs.forEach(vd => { thead += th(valueDefLabel(vd), 'class="sub-th"'); });
    thead += '</tr>';
  }
  let totalRow = '';
  if (withValues) {
    totalRow = '<tr class="total">';
    m.rowDimLabels.forEach((_, li) => { totalRow += `<td class="lbl">${li === 0 ? '總計' : ''}</td>`; });
    m.colKeys.forEach(cKey => { m.valueDefs.forEach((vd, vi) => { totalRow += `<td>${escapeHtml(colTotalMain(cKey, vi))}</td>`; }); });
    if (m.useCol) m.valueDefs.forEach((vd, vi) => { totalRow += `<td class="grand">${escapeHtml(grandMain(vi))}</td>`; });
    totalRow += '</tr>';
  }
  let tbody = '';
  for (const row of sortedRows.value) {
    let tr = '<tr>';
    row.parts.forEach(p => { tr += `<td class="lbl">${escapeHtml(p)}</td>`; });
    m.colKeys.forEach(cKey => {
      if (!withValues && m.useCol) { tr += `<td>${row.cells[cKey]?.count ? '✓' : ''}</td>`; return; }
      m.valueDefs.forEach((vd, vi) => {
        const sub = cellSub(row, cKey, vi);
        tr += `<td>${escapeHtml(cellMain(row, cKey, vi))}${sub ? `<span class="sub">${escapeHtml(sub)}</span>` : ''}</td>`;
      });
    });
    if (m.useCol) m.valueDefs.forEach((vd, vi) => { tr += `<td class="rt">${escapeHtml(rowTotalMain(row, vi))}</td>`; });
    tr += '</tr>';
    tbody += tr;
  }
  return `<table id="src-table"><thead>${thead}${totalRow}</thead><tbody>${tbody}</tbody>${totalRow ? `<tfoot>${totalRow}</tfoot>` : ''}</table>`;
}
function buildPdfHtml({ orientation = 'landscape', fitZoom = false } = {}) {
  const page = PDF_PAGE[orientation] || PDF_PAGE.landscape;
  const availW = page.w - PDF_PAD * 2;
  const availH = page.h - PDF_PAD * 2;
  const title = escapeHtml(exportTitle());
  const meta = escapeHtml(exportMeta());
  return `<!DOCTYPE html><html lang="zh-Hant"><head><meta charset="utf-8">
<style>
  html,body{margin:0;padding:0}
  body{background:${fitZoom ? '#e5e7eb' : '#fff'};font-family:"Noto Sans TC","PingFang TC","Microsoft JhengHei","Heiti TC",sans-serif;color:#1a1a1a;-webkit-font-smoothing:antialiased}
  #pages{padding:${fitZoom ? '12px 0' : '0'}}
  .sheet{width:${page.w}px;height:${page.h}px;background:#fff;box-sizing:border-box;padding:${PDF_PAD}px;position:relative;margin:${fitZoom ? '0 auto 12px' : '0'};box-shadow:${fitZoom ? '0 1px 4px rgba(0,0,0,.18)' : 'none'};overflow:hidden;page-break-after:always}
  .inner{height:${availH}px;overflow:hidden}
  h1{font-size:18px;line-height:1.3;margin:0 0 4px;font-weight:700}
  .meta{font-size:11px;color:#555;margin:0 0 10px}
  table{border-collapse:collapse;white-space:nowrap;font-size:11px}
  th,td{border:1px solid #cfd2d6;padding:.35em .55em;text-align:center;line-height:1.3;vertical-align:middle}
  th{background:#eceff7;font-weight:700}
  th.sub-th{font-weight:500;font-size:.9em;background:#f3f4f9}
  th.lbl,td.lbl{text-align:left}
  tr.total td{background:#eeeeee;font-weight:700}
  td.rt{font-weight:700;color:#37474f}
  td.grand{color:#bf360c}
  .sub{display:block;font-size:.8em;color:#777;font-weight:400;line-height:1.2}
  .pageno{position:absolute;right:${PDF_PAD}px;bottom:14px;font-size:10px;color:#888}
  #src-wrap{position:absolute;left:-100000px;top:0;width:${availW}px}
</style></head><body>
<div id="src-wrap">${buildPdfTableHtml()}</div>
<div id="pages"></div>
<script>
(function(){
  var AVAIL_W=${availW}, FIT=${fitZoom ? 'true' : 'false'}, PAGE_W=${page.w};
  var src=document.getElementById('src-table');
  var pages=document.getElementById('pages');
  var fs=11;
  for(var i=0;i<8;i++){
    src.style.fontSize=fs+'px';
    var w=src.scrollWidth;
    if(w<=AVAIL_W) break;
    fs=Math.max(3.5, fs*AVAIL_W/w*0.985);
  }
  src.style.fontSize=fs+'px';
  var stretch = src.scrollWidth <= AVAIL_W;
  var theadHtml=src.tHead.innerHTML;
  var tfootHtml=src.tFoot?src.tFoot.innerHTML:'';
  var rows=Array.prototype.slice.call(src.tBodies[0].rows);
  function newPage(first){
    var sheet=document.createElement('div'); sheet.className='sheet';
    var inner=document.createElement('div'); inner.className='inner';
    if(first){ inner.innerHTML='<h1>${title}</h1><div class="meta">${meta}</div>'; }
    var t=document.createElement('table'); t.style.fontSize=fs+'px'; if(stretch) t.style.width='100%';
    t.innerHTML='<thead>'+theadHtml+'</thead><tbody></tbody>';
    inner.appendChild(t); sheet.appendChild(inner); pages.appendChild(sheet);
    return {sheet:sheet, inner:inner, table:t, tbody:t.tBodies[0]};
  }
  var cur=newPage(true);
  var overflow=function(pg){ return pg.inner.scrollHeight > pg.inner.clientHeight + 0.5; };
  for(var r=0;r<rows.length;r++){
    cur.tbody.appendChild(rows[r]);
    if(overflow(cur) && cur.tbody.rows.length>1){
      cur.tbody.removeChild(rows[r]);
      cur=newPage(false);
      cur.tbody.appendChild(rows[r]);
    }
  }
  if(tfootHtml){
    var tf=document.createElement('tfoot'); tf.innerHTML=tfootHtml; cur.table.appendChild(tf);
    if(overflow(cur) && cur.tbody.rows.length>0){
      cur.table.removeChild(tf);
      cur=newPage(false); cur.table.appendChild(tf);
    }
  }
  var sheets=pages.querySelectorAll('.sheet');
  for(var k=0;k<sheets.length;k++){
    var no=document.createElement('div'); no.className='pageno';
    no.textContent='第 '+(k+1)+' 頁 / 共 '+sheets.length+' 頁';
    sheets[k].appendChild(no);
  }
  document.getElementById('src-wrap').remove();
  if(FIT){
    var apply=function(){ var s=Math.min(1,(window.innerWidth-24)/PAGE_W); document.body.style.zoom=String(s); };
    apply(); window.addEventListener('resize',apply);
  }
  document.body.setAttribute('data-ready','1');
})();
<\/script></body></html>`;
}
function openPdfPreview() {
  if (!pivotMatrix.value.rows.length) return;
  pdf.html = buildPdfHtml({ orientation: pdf.orientation, fitZoom: true });
  pdf.open = true;
}
watch(() => pdf.orientation, () => {
  if (pdf.open) pdf.html = buildPdfHtml({ orientation: pdf.orientation, fitZoom: true });
});
async function downloadPdf() {
  if (pdf.downloading) return;
  pdf.downloading = true;
  const orientation = pdf.orientation;
  const page = PDF_PAGE[orientation];
  const iframe = document.createElement('iframe');
  iframe.style.cssText = `position:fixed;left:-20000px;top:0;width:${page.w + 40}px;height:${page.h + 40}px;border:0;`;
  document.body.appendChild(iframe);
  try {
    const [{ jsPDF }, { default: html2canvas }] = await Promise.all([import('jspdf'), import('html2canvas')]);
    await new Promise((resolve) => { iframe.onload = () => resolve(); iframe.srcdoc = buildPdfHtml({ orientation, fitZoom: false }); });
    const doc = iframe.contentDocument;
    for (let i = 0; i < 50 && doc.body?.getAttribute('data-ready') !== '1'; i++) await new Promise(r => setTimeout(r, 100));
    await new Promise(r => setTimeout(r, 200)); // 等字型與版面繪製完成
    const sheets = Array.from(doc.querySelectorAll('.sheet'));
    if (!sheets.length) throw new Error('無可輸出的頁面');
    const out = new jsPDF({ unit: 'pt', format: 'a4', orientation });
    const pw = out.internal.pageSize.getWidth();
    const ph = out.internal.pageSize.getHeight();
    for (let i = 0; i < sheets.length; i++) {
      const canvas = await html2canvas(sheets[i], { scale: 2, useCORS: true, backgroundColor: '#ffffff', logging: false });
      if (i > 0) out.addPage('a4', orientation);
      out.addImage(canvas.toDataURL('image/jpeg', 0.92), 'JPEG', 0, 0, pw, ph);
    }
    out.save(`${props.projectName}_${exportLabel()}.pdf`);
    toast.success('已下載 PDF！', { position: POSITION.TOP_CENTER, timeout: 2000 });
  } catch (e) {
    console.error('匯出驗屋資料透視 PDF 失敗:', e);
    toast.error('PDF 產生失敗，請重試。', { position: POSITION.TOP_CENTER, timeout: 2500 });
  } finally {
    iframe.remove();
    pdf.downloading = false;
  }
}

// ── 長條圖（第一個值的列合計）──
const CHART_MAX_BARS = 40;
const chartData = computed(() => {
  const all = sortedRows.value.map(r => ({ key: r.key, name: r.parts.join(' / '), value: r.totalValues[0] ?? 0 }));
  const bars = all.slice(0, CHART_MAX_BARS);
  const max = Math.max(...bars.map(b => b.value), 0);
  return {
    bars: bars.map(b => ({ ...b, widthPct: max ? Math.max(1.5, (b.value / max) * 100) : 0 })),
    truncated: all.length - bars.length,
  };
});
const chartTitle = computed(() => {
  const m = pivotMatrix.value;
  return m.valueDefs.length ? `${m.rowDimLabels.join(' / ')} — ${valueDefLabel(m.valueDefs[0])}` : '';
});

// 開啟：資料範圍預設同時間表（日期區間、狀態、項目、方式），再還原上次的透視設定
// （放在最後並 immediate：以開啟狀態掛載時也會初始化，且此時上方的狀態都已宣告）
watch(isOpen, (open) => {
  if (!open) return;
  markRangeLoaded(props.rangeStart, props.rangeEnd);
  scopeFrom.value = props.rangeStart || '';
  scopeTo.value = props.rangeEnd || '';
  scopeStatuses.value = props.calendarStatuses.filter(v => STATUS_OPTIONS.includes(v));
  scopeTypes.value = props.calendarTypes.filter(v => props.typeOptions.includes(v));
  scopeMethods.value = props.calendarMethods.length
    ? props.calendarMethods.filter(v => props.methodOptions.includes(v))
    : [...props.methodOptions];
  restoreSettings();
  subscribePresets();
}, { immediate: true });
</script>

<style scoped>
.ipv-card {
  height: 92vh;
}
.ipv-card.is-fullscreen {
  height: 100%;
}
.ipv-title-text {
  min-width: 0;
  white-space: normal;
  line-height: 1.3;
}
.ipv-title-stack {
  flex: 1 1 auto;
  min-width: 0;
  white-space: normal;
  line-height: 1.3;
}
/* 全螢幕時避開左上角全站漢堡鈕 */
@media (max-width: 959.98px) {
  .ipv-title-bar {
    padding-left: 54px !important;
  }
}
.ipv-chips :deep(.v-slide-group__content),
.ipv-chips {
  padding-top: 0;
  padding-bottom: 0;
}
.ipv-scope-label {
  font-size: 12px;
  color: #616161;
  margin-top: 2px;
}
.ipv-sortable {
  cursor: pointer;
  white-space: nowrap;
  user-select: none;
}
.ipv-sortable:hover {
  background-color: #eceff1 !important;
}

/* 三欄式版面（左欄位 / 中設定 / 右結果） */
.ipv-layout {
  display: flex;
  min-height: 0;
  overflow: hidden;
  background-color: #f5f6f8;
}
.ipv-pane {
  padding: 12px;
  overflow-y: auto;
  min-height: 0;
}
.ipv-pdf-frame {
  border: 0;
  width: 100%;
  background: #e5e7eb;
}
.ipv-preset-btn-label {
  max-width: 160px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.ipv-pane-title {
  font-size: 13px;
  font-weight: 700;
  color: #37474f;
  margin-bottom: 8px;
  display: flex;
  align-items: center;
  gap: 4px;
  flex-shrink: 0;
}
.ipv-pane-fields {
  width: 240px;
  flex-shrink: 0;
  background: #ffffff;
  border-right: 1px solid #eceff1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
/* v-text-field 預設 flex:1 1 auto，在直向 flex 容器內會被垂直撐開，必須固定為內容高度 */
.ipv-field-search {
  flex: 0 0 auto !important;
}
.ipv-field-search :deep(.v-field) {
  --v-field-padding-start: 6px;
  font-size: 12.5px;
}
.ipv-field-search :deep(.v-field__input) {
  min-height: 30px;
  padding-top: 2px;
  padding-bottom: 2px;
}
.ipv-field-search :deep(.v-field__prepend-inner .v-icon),
.ipv-field-search :deep(.v-field__clearable .v-icon) {
  font-size: 16px;
}
.ipv-field-search :deep(.v-field__prepend-inner),
.ipv-field-search :deep(.v-field__clearable) {
  padding-top: 4px;
}
.ipv-field-list {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  border: 1px solid #eceff1;
  border-radius: 6px;
}
.ipv-field-item {
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
.ipv-field-item:hover {
  background-color: #e8eaf6;
}
.ipv-field-item.used {
  color: #9e9e9e;
}
.ipv-field-item:active {
  cursor: grabbing;
}
.ipv-field-label {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.ipv-field-count {
  background-color: #eef0fb;
  font-weight: 700;
}
.ipv-pane-editor {
  width: 322px;
  flex-shrink: 0;
  border-right: 1px solid #eceff1;
  background: #fafbfc;
}
.ipv-zone {
  background: #ffffff;
  border: 1px dashed #cfd8dc;
  border-radius: 8px;
  padding: 8px 10px;
  margin-bottom: 10px;
  transition: border-color 0.15s ease, background-color 0.15s ease;
}
.ipv-zone.drag-over {
  border-color: #3949ab;
  border-style: solid;
  background-color: #e8eaf6;
}
.ipv-zone-title {
  font-size: 12.5px;
  font-weight: 700;
  color: #455a64;
  margin-bottom: 6px;
  display: flex;
  align-items: center;
  gap: 4px;
}
.ipv-value-entry {
  background-color: #f5f6f8;
  border-radius: 6px;
  padding: 6px;
}
.ipv-agg-toggle {
  height: 26px;
}
.ipv-agg-toggle :deep(.v-btn) {
  height: 26px !important;
  min-width: 0;
  padding: 0 8px;
  font-size: 12px;
}
.ipv-value-entry :deep(.v-field__input),
.ipv-date-input {
  min-width: 0;
  flex: 1 1 0;
}
.ipv-date-input :deep(input) {
  font-size: 12px;
  padding-inline: 4px;
}
.ipv-filter-entry :deep(.v-field__input) {
  font-size: 13px;
  padding-left: 8px;
  padding-right: 0;
}
.ipv-filter-entry {
  background-color: #f5f6f8;
  border-radius: 6px;
  padding: 4px 6px;
}
/* 右：分析結果（表格永遠在可視範圍內，水平捲軸不會被推到看不到的地方） */
.ipv-pane-result {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
.ipv-table-wrap {
  background: #ffffff;
  border: 1px solid #eceff1;
  border-radius: 8px;
  overflow: auto;
  flex: 1 1 auto;
  min-height: 180px;
  scrollbar-width: auto;
  scrollbar-color: #90a4ae #eceff1;
}
.ipv-table-wrap::-webkit-scrollbar {
  height: 12px;
  width: 12px;
}
.ipv-table-wrap::-webkit-scrollbar-thumb {
  background-color: #90a4ae;
  border-radius: 6px;
  border: 2px solid #ffffff;
}
.ipv-table-wrap::-webkit-scrollbar-thumb:hover {
  background-color: #607d8b;
}
.ipv-table-wrap::-webkit-scrollbar-track {
  background-color: #eceff1;
  border-radius: 6px;
}
.ipv-table-wrap :deep(th),
.ipv-table-wrap :deep(td) {
  white-space: nowrap;
}
.ipv-result-hint {
  flex-shrink: 0;
}
.ipv-chart-block {
  flex-shrink: 0;
  max-height: 42%;
  overflow-y: auto;
}
/* 中寬度：左欄（欄位清單上、設定下）＋ 右側結果 */
@media (min-width: 960px) and (max-width: 1264px) {
  .ipv-layout {
    display: grid;
    grid-template-columns: 300px minmax(0, 1fr);
    grid-template-rows: 240px minmax(0, 1fr);
  }
  .ipv-pane-fields {
    grid-column: 1;
    grid-row: 1;
    width: auto;
    border-bottom: 1px solid #eceff1;
  }
  .ipv-pane-editor {
    grid-column: 1;
    grid-row: 2;
    width: auto;
  }
  .ipv-pane-result {
    grid-column: 2;
    grid-row: 1 / 3;
  }
}
/* 手機：上下堆疊 */
@media (max-width: 959.98px) {
  .ipv-layout {
    flex-direction: column;
    overflow-y: auto;
  }
  .ipv-pane-editor {
    width: 100%;
    border-right: none;
    overflow-y: visible;
  }
  /* 觸控無法拖曳欄位（欄位清單已隱藏），結果放最上面、設定接在下方；
     依內容撐高（flex:1 + min-height:0 會被壓成 0 高，表格溢出蓋到設定區） */
  .ipv-pane-result {
    order: -1;
    display: block;
    overflow: visible;
    flex: 0 0 auto;
    border-bottom: 1px solid #eceff1;
  }
  .ipv-table-wrap {
    max-height: 60vh;
  }
  .ipv-chart-block {
    max-height: none;
  }
}

/* 表頭拖曳調整欄位順序 */
.ipv-th-draggable {
  cursor: grab;
}
.ipv-th-draggable::before {
  content: '⠿';
  font-size: 11px;
  color: #b0bec5;
  margin-right: 3px;
}
.ipv-th-dragging {
  opacity: 0.4;
}
.ipv-th-drop-target {
  background-color: #e8eaf6 !important;
  box-shadow: inset 3px 0 0 #3f51b5;
}

/* 可點擊下鑽的儲存格 */
.ipv-cell-click {
  cursor: pointer;
}
.ipv-cell-click:hover {
  background-color: #e8eaf6;
}
.ipv-cell-sub {
  font-size: 11px;
  color: #757575;
  line-height: 1.2;
  white-space: nowrap;
}
.ipv-drill-table :deep(td),
.ipv-drill-table :deep(th) {
  white-space: nowrap;
}

/* 橫向長條圖（單一序列） */
.ipv-chart-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 6px;
  cursor: pointer;
}
.ipv-chart-row:hover .ipv-chart-bar {
  opacity: 0.8;
}
.ipv-chart-label {
  width: 140px;
  flex-shrink: 0;
  text-align: right;
  font-size: 12px;
  color: #424242;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.ipv-chart-track {
  flex: 1;
  min-width: 0;
}
.ipv-chart-bar {
  height: 14px;
  background-color: #3949ab;
  border-radius: 0 4px 4px 0;
}
.ipv-chart-value {
  min-width: 56px;
  flex-shrink: 0;
  font-size: 12px;
  color: #424242;
}
</style>
