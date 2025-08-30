// src/utils/agGridLocale.js

export const AG_GRID_LOCALE_TW = {
  // Common
  page: '頁',
  more: '更多',
  to: '到',
  of: '之',
  next: '下一頁',
  last: '最後一頁',
  first: '第一頁',
  previous: '上一頁',
  loadingOoo: '載入中...',

  // Sider Bar
  columns: '欄位',
  filters: '篩選器', // ✅ 【修改】「篩選器」比「篩選」更貼切，因為它是一個功能區域名稱

  // Tool Panel
  selection: '選取',
  selectAll: '全選',
  deselectAll: '取消全選',
  
  // Filters
  filterOoo: '篩選...',
  applyFilter: '套用', // ✅ 【修改】通常按鈕上的文字會簡化為「套用」
  resetFilter: '重設', // ✅ 【修改】同上，「重設」更簡潔
  clearFilter: '清除', // ✅ 【修改】同上，「清除」更簡潔
  
  // Number Filter & Text Filter
  equals: '等於',
  notEqual: '不等於',
  blank: '空白',
  notBlank: '非空白', // ✅ 【修改】「非空白」比「不是空白」更為正式
  empty: '請選擇...', // ✅ 【修改】提示使用者進行選擇，比「選擇一個」更引導

  // Text Filter
  contains: '包含',
  notContains: '不包含',
  startsWith: '開頭為', // ✅ 【修改】「為」比「是」的語氣更正式
  endsWith: '結尾為',   // ✅ 【修改】同上

  // Number Filter
  lessThan: '小於',
  lessThanOrEqual: '小於或等於',
  greaterThan: '大於',
  greaterThanOrEqual: '大於或等於',
  inRange: '範圍之間', // ✅ 【修改】「範圍之間」比「範圍內」更能表達區間的概念
  inRangeStart: '從',
  inRangeEnd: '到',

  // Date Filter
  dateFormatOoo: 'yyyy/mm/dd', // ✅ 【新增】提供日期格式的提示文字

  // Set Filter
  searchOoo: '搜尋...', // ✅ 【修改】在 Set Filter 中的搜尋框提示文字
  blanks: '(空白)',
  noMatches: '沒有相符項目', // ✅ 【新增】當 Set Filter 搜尋不到結果時的提示

  // Pinned columns
  pinColumn: '釘選欄位',
  pinLeft: '向左釘選', // ✅ 【修改】「向左/向右」更具方向感
  pinRight: '向右釘選', // ✅ 【修改】同上
  noPin: '取消釘選',   // ✅ 【修改】「取消釘選」語意更清晰

  // Enterprise specific
  valueColumns: '數值欄位',
  pivotMode: '樞紐模式', // ✅ 【修改】「樞紐模式」比「樞紐分析模式」簡潔
  groups: '列群組',     // ✅ 【修改】明確指出這是對「列」進行分組
  rowGroupColumnsEmptyMessage: '拖曳至此以設定列群組', // ✅ 【修改】優化提示訊息，更簡潔易懂
  values: '數值',
  pivots: '欄標籤', // ✅ 【修改】在樞紐分析表中，Pivots 通常指的是 Column Labels
  pivotColumnsEmptyMessage: '拖曳至此以設定欄標籤', // ✅ 【修改】對應上面的修改

  // Header Context Menu
  autosizeThiscolumn: '自動調整此欄寬度',
  autosizeAllColumns: '自動調整所有欄寬度',
  groupBy: '依此分組', // ✅ 【修改】更簡潔的說法
  ungroupBy: '取消分組', // ✅ 【修改】同上
  resetColumns: '重設欄位',
  expandAll: '全部展開',
  collapseAll: '全部收合',
  
  // Grouping
  group: '群組',

  // Other
  noRowsToShow: '沒有資料', // ✅ 【修改】「沒有資料」比「沒有資料可顯示」更常用

  // Export
  csvExport: '匯出為 CSV',
  excelExport: '匯出為 Excel (.xlsx)',
  excelXmlExport: '匯出為 Excel (.xml)',

  // ✅ 【新增區塊】以下為 AG Grid 新版本中可能新增的常用詞彙
  // --- Status Bar ---
  sum: '總和',
  min: '最小值',
  max: '最大值',
  none: '無',
  count: '計數',
  avg: '平均值',
  filteredRows: '已篩選',
  selectedRows: '已選取',
  totalRows: '總列數',
  totalAndFilteredRows: '列',

  // --- Charts ---
  pivotChartAndPivotMode: '樞紐圖表與模式',
  pivotChart: '樞紐圖表',
  chartRange: '圖表範圍',
  columnChart: '直條圖',
  barChart: '橫條圖',
  pieChart: '圓餅圖',
  lineChart: '折線圖',
  scatterChart: '散佈圖',
  areaChart: '面積圖',
  histogramChart: '直方圖',
  combinationChart: '組合圖',
};