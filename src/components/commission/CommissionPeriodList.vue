<template>
  <div class="period-list">
    <div v-if="loading" class="text-center py-10">
      <v-progress-circular indeterminate color="primary"></v-progress-circular>
    </div>
    <template v-else>
      <!-- 工具列 -->
      <div class="d-flex align-center flex-wrap ga-2 mb-2">
        <v-btn-toggle v-model="view" mandatory density="compact" color="primary" variant="outlined" divided>
          <v-btn value="claim" size="small">請佣</v-btn>
          <v-btn value="bonus" size="small">獎金</v-btn>
        </v-btn-toggle>
        <v-switch v-model="showVoided" label="顯示作廢" color="error" density="compact" hide-details class="ml-1"></v-switch>
        <v-btn v-if="activeFilterCount" size="small" variant="tonal" color="primary" prepend-icon="mdi-filter-remove-outline" @click="clearFilters">清除篩選（{{ activeFilterCount }}）</v-btn>
        <v-spacer></v-spacer>

        <!-- 期別操作 -->
        <v-menu v-if="periods.length" :close-on-content-click="false">
          <template #activator="{ props: mp }">
            <v-btn v-bind="mp" size="small" variant="tonal" prepend-icon="mdi-calendar-cog-outline">期別操作</v-btn>
          </template>
          <v-card min-width="300">
            <v-card-text class="pb-1">
              <v-select v-model="opPeriod" :items="periodOptions" label="期別" variant="outlined" density="compact" hide-details />
            </v-card-text>
            <v-list density="compact">
              <v-list-item prepend-icon="mdi-file-export-outline" title="匯出此期" :disabled="!opPd?.activeCount" @click="$emit('export-period', opPd.period, view)"></v-list-item>
              <template v-if="canManage">
                <v-list-item prepend-icon="mdi-pencil-box-multiple-outline" title="整期拉回編輯" :disabled="!opPd || !editableRecords(opPd).length"
                  :subtitle="opPd && editableRecords(opPd).length ? `${editableRecords(opPd).length} 筆載回${isBonusView ? '獎金編輯' : '工作台'}` : '沒有可拉回的紀錄'"
                  @click="$emit(isBonusView ? 'edit-bonus-period' : 'edit-period', opPd.period)"></v-list-item>
                <v-list-item prepend-icon="mdi-cancel" title="整期作廢" :disabled="!opPd || (!periodVoidableCount(opPd) && !(isBonusView && periodBonusCount(opPd)))"
                  @click="openVoidPeriod(opPd)"></v-list-item>
                <v-list-item prepend-icon="mdi-delete-sweep-outline" title="清除已作廢紀錄" :disabled="!opPd?.voidedCount"
                  :subtitle="opPd?.voidedCount ? `${opPd.voidedCount} 筆` : ''" @click="openPurge(opPd)"></v-list-item>
                <v-list-item prepend-icon="mdi-database-import-outline" title="重新匯入此期" @click="$emit('reimport-period', opPd.period)"></v-list-item>
                <template v-if="opPd?.batches.length && !isBonusView">
                  <v-divider class="my-1"></v-divider>
                  <v-list-subheader>匯入批次</v-list-subheader>
                  <v-list-item v-for="b in opPd.batches" :key="b.batchId" prepend-icon="mdi-undo-variant"
                    :title="`撤銷匯入（${b.count} 筆）`" :subtitle="`${b.fileName || b.batchId}｜${b.createdBy || '—'}`" @click="openUndo(opPd, b)"></v-list-item>
                </template>
              </template>
            </v-list>
          </v-card>
        </v-menu>

        <!-- 欄位顯示 -->
        <v-menu :close-on-content-click="false">
          <template #activator="{ props: mp }">
            <v-btn v-bind="mp" size="small" variant="text" prepend-icon="mdi-view-column-outline">欄位</v-btn>
          </template>
          <v-list density="compact" min-width="200">
            <v-list-item v-for="c in columnDefs" :key="c.key" @click="toggleColumn(c.key)">
              <template #prepend><v-checkbox-btn :model-value="!hiddenCols.includes(c.key)" density="compact" /></template>
              <v-list-item-title>{{ c.title }}</v-list-item-title>
            </v-list-item>
            <v-divider class="my-1"></v-divider>
            <v-list-item title="全部顯示" prepend-icon="mdi-restore" @click="hiddenCols = []"></v-list-item>
          </v-list>
        </v-menu>
        <v-btn size="small" variant="text" prepend-icon="mdi-microsoft-excel" :disabled="!rows.length" @click="exportExcel">匯出 Excel</v-btn>
        <v-btn size="small" variant="text" prepend-icon="mdi-clipboard-text-clock-outline" @click="openAudit">操作紀錄</v-btn>
      </div>

      <!-- 已選批次操作 -->
      <v-sheet v-if="selected.length" color="blue-lighten-5" rounded class="d-flex align-center flex-wrap ga-2 px-3 py-2 mb-2">
        <span class="text-body-2 font-weight-medium">已選 {{ selected.length }} 筆</span>
        <v-btn v-if="canManage" size="small" variant="flat" color="primary" prepend-icon="mdi-pencil-box-multiple-outline" :disabled="!selectedEditable.length"
          @click="editSelected">拉回編輯 {{ selectedEditable.length }} 筆</v-btn>
        <v-btn v-if="canManage" size="small" variant="tonal" color="error" prepend-icon="mdi-cancel" :disabled="!selectedVoidable.length" @click="openBatchVoid">作廢 {{ selectedVoidable.length }} 筆</v-btn>
        <v-spacer></v-spacer>
        <v-btn size="small" variant="text" @click="selected = []">取消選取</v-btn>
      </v-sheet>

      <!-- 每人獎金彙總（獎金檢視，依目前篩選） -->
      <v-expansion-panels v-if="isBonusView && peopleSummary.length" v-model="peoplePanel" class="mb-3">
        <v-expansion-panel value="people">
          <v-expansion-panel-title>
            每人獎金彙總（依目前篩選，{{ peopleSummary.length }} 人）
            <v-spacer></v-spacer>
            <span class="text-body-2 mr-2">實發合計 <b class="text-success">{{ money(peopleTotal) }}</b></span>
          </v-expansion-panel-title>
          <v-expansion-panel-text>
            <div class="table-scroll">
              <v-table density="compact">
                <thead>
                  <tr>
                    <th>人員</th><th>來源</th>
                    <th class="text-right">小計</th><th class="text-right">保留款</th>
                    <th class="text-right">稅金</th><th class="text-right">二代健保</th><th class="text-right">實發</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="p in peopleSummary" :key="p.personKey">
                    <td class="font-weight-medium">{{ p.name }}</td>
                    <td>
                      <span v-if="p.sourceProjectId && p.sourceProjectId !== projectId" class="text-caption text-orange-darken-3">{{ p.sourceProjectName || p.sourceProjectId }}</span>
                      <span v-else class="text-caption text-medium-emphasis">本案</span>
                    </td>
                    <td class="text-right">{{ money(p.subtotal) }}</td>
                    <td class="text-right">{{ money(p.keep) }}</td>
                    <td class="text-right">{{ money(p.tax) }}</td>
                    <td class="text-right">{{ money(p.nhi) }}</td>
                    <td class="text-right text-success font-weight-bold">{{ money(p.net) }}</td>
                  </tr>
                </tbody>
              </v-table>
            </div>
          </v-expansion-panel-text>
        </v-expansion-panel>
      </v-expansion-panels>

      <v-alert v-if="!allRows.length" type="info" variant="tonal">
        {{ isBonusView ? '目前沒有任何獎金紀錄。可於「獎金編輯」建立。' : '目前沒有任何請佣紀錄。可於「請佣工作台」建立，或用「歷史匯入」銜接舊資料。' }}
      </v-alert>

      <v-data-table
        v-else
        v-model="selected"
        v-model:expanded="expanded"
        v-model:sort-by="sortBy"
        v-model:items-per-page="itemsPerPage"
        :headers="headers"
        :items="rows"
        item-value="id"
        item-selectable="selectable"
        show-select
        show-expand
        density="compact"
        class="records-table"
        :custom-key-sort="customSort"
        :items-per-page-options="[25, 50, 100, { value: -1, title: '全部' }]"
        :row-props="rowProps"
        no-data-text="沒有符合篩選的紀錄"
      >
        <!-- 標頭：排序＋內嵌篩選 -->
        <template v-for="h in filterHeaders" :key="h.key" #[`header.${h.key}`]="{ column, isSorted, getSortIcon }">
          <div class="th-cell" :class="{ 'justify-end': column.align === 'end', 'justify-center': column.align === 'center' }">
            <span class="th-title">
              {{ column.title }}
              <v-icon v-if="isSorted(column)" size="x-small">{{ getSortIcon(column) }}</v-icon>
            </span>
            <v-menu :close-on-content-click="false" location="bottom">
              <template #activator="{ props: mp }">
                <v-btn v-bind="mp" :icon="isFilterActive(h.key) ? 'mdi-filter' : 'mdi-filter-outline'" size="x-small" variant="text"
                  :color="isFilterActive(h.key) ? 'primary' : undefined" class="th-filter" :aria-label="`篩選${column.title}`" @click.stop></v-btn>
              </template>
              <v-card min-width="220" class="pa-2">
                <template v-if="h.filter === 'select'">
                  <div class="filter-options">
                    <v-checkbox v-for="opt in filterOptions(h.key)" :key="opt.value" v-model="filters[h.key]" :value="opt.value" :label="opt.title"
                      density="compact" hide-details />
                  </div>
                </template>
                <template v-else-if="h.filter === 'text'">
                  <v-text-field v-model="filters[h.key]" label="包含文字" variant="outlined" density="compact" hide-details clearable autofocus />
                </template>
                <template v-else-if="h.filter === 'date'">
                  <DateFieldTW v-model="filters[h.key].from" label="起" class="mb-2" />
                  <DateFieldTW v-model="filters[h.key].to" label="迄" />
                </template>
                <template v-else-if="h.filter === 'number'">
                  <v-text-field v-model.number="filters[h.key].min" label="最小" type="number" variant="outlined" density="compact" hide-details class="mb-2" />
                  <v-text-field v-model.number="filters[h.key].max" label="最大" type="number" variant="outlined" density="compact" hide-details />
                </template>
                <div class="d-flex justify-end mt-2">
                  <v-btn size="x-small" variant="text" @click="resetFilter(h.key)">清除</v-btn>
                </div>
              </v-card>
            </v-menu>
          </div>
        </template>

        <!-- 儲存格 -->
        <template #item.unitId="{ item }">
          <span class="font-weight-medium">{{ item.unitId }}</span>
          <v-icon v-if="item.refund" size="x-small" color="error" class="ml-1" :title="item.raw.reason || refundWord">mdi-cash-refund</v-icon>
        </template>
        <template #item.buyer="{ item }">{{ item.buyer || '—' }}</template>
        <template #item.sales="{ item }">{{ item.sales || '—' }}</template>
        <template #item.requestDate="{ item }">{{ item.requestDate || '—' }}</template>
        <template #item.ratioPct="{ item }">{{ item.ratioPct }}%</template>
        <template #item.commPct="{ item }">{{ item.commPct.toFixed(2) }}%</template>
        <template #item.transactionTotal="{ item }">{{ money(item.transactionTotal) }}</template>
        <template #item.dealTotal="{ item }">{{ money(item.dealTotal) }}</template>
        <template #item.totalFloor="{ item }">{{ money(item.totalFloor) }}</template>
        <template #item.spread="{ item }"><span :class="item.spread < 0 ? 'text-error' : ''">{{ money(item.spread) }}</span></template>
        <template #item.dealAfter="{ item }">{{ money(item.dealAfter) }}</template>
        <template #item.realClaim="{ item }">{{ money(item.realClaim) }}</template>
        <template #item.claimKeep="{ item }">{{ money(item.claimKeep) }}</template>
        <template #item.thisClaim="{ item }"><b>{{ money(item.thisClaim) }}</b></template>
        <template #item.bonusNet="{ item }"><b>{{ money(item.bonusNet) }}</b></template>
        <template #item.handover="{ item }"><span class="text-orange-darken-3">{{ item.handover ? money(item.handover) : '—' }}</span></template>
        <template #item.note="{ item }"><span class="note-cell" :title="item.note">{{ item.note || '' }}</span></template>
        <template #item.source="{ item }">{{ item.source }}</template>
        <template #item.status="{ item }">
          <v-chip size="x-small" :color="statusColor(item.statusKey)" :variant="item.statusKey === 'refund' ? 'flat' : 'tonal'"
            :title="item.statusTitle">{{ item.status }}</v-chip>
        </template>
        <template #item.actions="{ item }">
          <template v-if="!item.voided && item.refund">
            <v-btn v-if="canManage && !item.raw._legacyBonus" size="x-small" variant="text" color="error" @click="openVoid(item.raw)">作廢{{ refundWord }}</v-btn>
          </template>
          <template v-else-if="!item.voided">
            <v-btn v-if="canManage" size="x-small" variant="text" color="primary" :disabled="!item.editable"
              :title="item.editable ? `載回${isBonusView ? '獎金編輯' : '工作台'}修改，送出時取代此紀錄` : `已${refundWord}，請先作廢對應的${refundWord}紀錄`"
              @click="$emit(isBonusView ? 'edit-bonus-record' : 'edit-record', item.raw)">拉回編輯</v-btn>
            <v-btn v-if="canManage" size="x-small" variant="text" color="error" :disabled="!item.editable"
              :title="item.raw._legacyBonus ? '只作廢此筆請佣附帶的獎金明細' : ''" @click="openVoid(item.raw)">作廢</v-btn>
          </template>
          <span v-else class="text-caption text-medium-emphasis" :title="item.raw.voidReason">{{ item.raw.voidedBy }}</span>
        </template>

        <!-- 展開明細 -->
        <template #expanded-row="{ columns, item }">
          <tr class="detail-row">
            <td :colspan="columns.length">
              <div class="detail-grid">
                <div class="detail-block">
                  <div class="detail-h">戶別快照</div>
                  <dl>
                    <div><dt>合約方式</dt><dd>{{ item.raw.snapshot?.contractType || '—' }}</dd></div>
                    <div><dt>小訂／簽約</dt><dd>{{ item.raw.snapshot?.depositDate || '—' }}／{{ item.raw.snapshot?.contractDate || '—' }}</dd></div>
                    <div><dt>成交總價(萬)</dt><dd>{{ fmtWan(item.raw.snapshot?.dealTotal) }}</dd></div>
                    <div><dt>總底價(萬)</dt><dd>{{ fmtWan(item.raw.snapshot?.totalFloor) }}</dd></div>
                    <div><dt>溢差價(萬)</dt><dd>{{ fmtWan(item.raw.snapshot?.spread) }}</dd></div>
                    <div><dt>車位</dt><dd>{{ item.raw.snapshot?.parkingSpots || '—' }}</dd></div>
                    <div v-if="item.raw.snapshot?.isPreferredPayment"><dt>優付戶</dt><dd>是</dd></div>
                  </dl>
                </div>
                <div class="detail-block">
                  <div class="detail-h">{{ isBonusView ? '計算' : '請佣計算' }}</div>
                  <dl>
                    <div><dt>{{ settings.partyALabel || '介紹費A' }}</dt><dd>{{ money(item.raw.partyAFee) }}</dd></div>
                    <div><dt>{{ settings.partyBLabel || '介紹費B' }}</dt><dd>{{ money(item.raw.partyBFee) }}</dd></div>
                    <div><dt>基準(萬)</dt><dd>{{ fmtWan(item.raw.calc?.baseWan) }}</dd></div>
                    <div><dt>實際溢差價(萬)</dt><dd>{{ fmtWan(item.raw.calc?.realSpread) }}</dd></div>
                    <div><dt>折數</dt><dd>{{ item.raw.calc?.discount ?? '—' }}</dd></div>
                    <div v-if="!isBonusView"><dt>保留款％</dt><dd>{{ toNum(item.raw.keepPct) }}%</dd></div>
                    <div v-if="item.raw.planName"><dt>方案</dt><dd>{{ item.raw.planName }}</dd></div>
                    <div v-if="item.raw.createdBy"><dt>建立</dt><dd>{{ item.raw.createdBy }}｜{{ fmtTs(item.raw.createdAt) }}</dd></div>
                    <div v-if="item.raw.replaces"><dt>取代原紀錄</dt><dd class="text-caption">{{ item.raw.replaces }}</dd></div>
                    <div v-if="item.raw.importBatchId"><dt>匯入批次</dt><dd class="text-caption">{{ item.raw.importFileName || item.raw.importBatchId }}</dd></div>
                  </dl>
                </div>
                <div v-if="item.refund" class="detail-block">
                  <div class="detail-h">{{ refundWord }}</div>
                  <dl>
                    <div><dt>原因</dt><dd>{{ item.raw.reason || '—' }}</dd></div>
                    <div><dt>來源</dt><dd>{{ (item.raw.sources || []).map(x => `第${x.period}期`).join('、') || '—' }}</dd></div>
                    <div v-if="!isBonusView"><dt>保留款</dt><dd>{{ item.raw.includeKeep ? '含' : '不含' }}</dd></div>
                  </dl>
                </div>
                <div v-if="item.voided" class="detail-block voided-block">
                  <div class="detail-h">作廢</div>
                  <dl>
                    <div><dt>作廢者</dt><dd>{{ item.raw.voidedBy || '—' }}｜{{ fmtTs(item.raw.voidedAt) }}</dd></div>
                    <div><dt>原因</dt><dd>{{ item.raw.voidReason || '—' }}</dd></div>
                    <div v-if="item.raw.replacedBy"><dt>被取代為</dt><dd class="text-caption">{{ item.raw.replacedBy }}</dd></div>
                  </dl>
                </div>
                <div v-if="bonusRowsOf(item.id).length" class="detail-block detail-wide">
                  <div class="detail-h">獎金明細（{{ bonusRowsOf(item.id).length }} 筆）</div>
                  <div class="table-scroll">
                    <v-table density="compact" class="inner-table">
                      <thead>
                        <tr>
                          <th>人員</th><th>職務</th>
                          <th v-for="c in bonusCatsOf(item.id)" :key="c.key" class="text-right">{{ c.label }}</th>
                          <th class="text-right">小計</th><th class="text-right">保留款</th><th class="text-right">稅金</th><th class="text-right">二代健保</th><th class="text-right">實發</th><th>狀態</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr v-for="b in bonusRowsOf(item.id)" :key="b.id" :class="{ 'voided-row': b.status === 'voided' }">
                          <td>{{ b.name }}<span v-if="b.sourceProjectId && b.sourceProjectId !== projectId" class="text-caption text-orange-darken-3 ml-1">{{ b.sourceProjectName || b.sourceProjectId }}</span></td>
                          <td>{{ b.role || '—' }}</td>
                          <td v-for="c in bonusCatsOf(item.id)" :key="c.key" class="text-right">{{ money(b.amounts?.[c.key] || 0) }}</td>
                          <td class="text-right">{{ money(b.subtotal) }}</td>
                          <td class="text-right">{{ money(b.keep) }}</td>
                          <td class="text-right">{{ money(b.tax) }}</td>
                          <td class="text-right">{{ money(b.nhi) }}</td>
                          <td class="text-right font-weight-bold">{{ money(b.net) }}</td>
                          <td>{{ b.status === 'voided' ? '已作廢' : '有效' }}</td>
                        </tr>
                      </tbody>
                    </v-table>
                  </div>
                </div>
              </div>
            </td>
          </tr>
        </template>

        <!-- 合計列 -->
        <template #body.append="{ columns }">
          <tr v-if="rows.length" class="total-row">
            <td v-for="c in columns" :key="c.key" :class="c.align === 'end' ? 'text-right' : ''">
              <template v-if="c.key === 'unitId'">合計（有效 {{ totals.count }} 筆）</template>
              <template v-else-if="c.key === 'period' && totals.count"></template>
              <template v-else-if="SUM_KEYS.includes(c.key)">{{ money(totals[c.key]) }}</template>
            </td>
          </tr>
        </template>
      </v-data-table>
    </template>

    <!-- 單筆作廢 dialog -->
    <v-dialog v-model="voidOpen" max-width="460" persistent>
      <v-card>
        <v-card-title class="text-subtitle-1 text-error">
          <v-icon start>mdi-alert-circle-outline</v-icon>作廢{{ voidTarget?.type === 'refund' ? refundWord : recordWord }}紀錄
        </v-card-title>
        <v-card-text>
          <p class="mb-2">
            確定作廢 <b>第 {{ voidTarget?.period }} 期／{{ voidTarget?.unitId }}</b> 的{{ voidTarget?.type === 'refund' ? refundWord : recordWord }}紀錄？
          </p>
          <ul v-if="voidTarget?.type === 'refund'" class="text-body-2 mb-3 pl-4">
            <li>原{{ recordWord }}紀錄（{{ (voidTarget?.sources || []).map(x => `第${x.period}期`).join('、') }}）恢復有效、移除「已{{ refundWord }}」標記</li>
            <li>該戶「已{{ isBonusView ? '送獎金' : '請' }}比例」加回 {{ voidTarget?.refundRatioPct }}%（若已重新{{ isBonusView ? '送獎金' : '請佣' }}致超過 100% 將被擋下）</li>
            <li v-if="isBonusView">負向獎金明細一併作廢，人員保留款與交屋團獎累積同步還原</li>
            <li>作廢紀錄保留完整資料痕跡，不可復原</li>
          </ul>
          <ul v-else class="text-body-2 mb-3 pl-4">
            <li v-if="voidTarget?._legacyBonus">只作廢此筆請佣附帶的獎金明細，不影響請佣紀錄與已請比例</li>
            <li v-else>該戶「已{{ isBonusView ? '送獎金' : '請' }}比例」將回溯 {{ voidTarget?.ratioPct }}%（可重新{{ isBonusView ? '送獎金' : '請佣' }}）</li>
            <li v-if="isBonusView">此紀錄的每人獎金明細一併作廢，不再列入統計與匯出</li>
            <li v-else>不影響獎金紀錄與獎金明細</li>
            <li>作廢紀錄保留完整資料痕跡，不可復原</li>
          </ul>
          <v-text-field v-model="voidReason" label="作廢原因（必填）" variant="outlined" density="compact"
            :rules="[v => !!v || '必填']"></v-text-field>
        </v-card-text>
        <v-divider></v-divider>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn variant="text" @click="voidOpen = false">取消</v-btn>
          <v-btn color="error" variant="flat" :loading="voiding" :disabled="!voidReason" @click="doVoid">確認作廢</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- 批次作廢 dialog -->
    <v-dialog v-model="batchVoidOpen" max-width="520" persistent>
      <v-card>
        <v-card-title class="text-subtitle-1 text-error">
          <v-icon start>mdi-cancel</v-icon>批次作廢 {{ selectedVoidable.length }} 筆{{ recordWord }}紀錄
        </v-card-title>
        <v-card-text>
          <div class="d-flex flex-wrap ga-1 mb-3">
            <v-chip v-for="r in selectedVoidable" :key="r.id" size="small" variant="tonal" :color="r.refund ? 'orange-darken-3' : 'error'">第 {{ r.period }} 期 {{ r.unitId }}<template v-if="r.refund">（{{ refundWord }}）</template></v-chip>
          </div>
          <ul class="text-body-2 mb-3 pl-4">
            <li>逐筆作廢，每筆的已{{ isBonusView ? '送' : '請' }}比例回溯；任一筆失敗時其餘仍會繼續，結果逐筆提示</li>
            <li v-if="isBonusView">獎金明細一併作廢；請佣紀錄不受影響</li>
            <li v-else>不影響獎金紀錄與獎金明細</li>
            <li>作廢紀錄保留完整資料痕跡，不可復原</li>
          </ul>
          <v-text-field v-model="voidReason" label="作廢原因（必填，套用全部）" variant="outlined" density="compact" hide-details></v-text-field>
        </v-card-text>
        <v-divider></v-divider>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn variant="text" :disabled="voiding" @click="batchVoidOpen = false">取消</v-btn>
          <v-btn color="error" variant="flat" :loading="voiding" :disabled="!voidReason" @click="doBatchVoid">確認作廢</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- 整期作廢 dialog -->
    <v-dialog v-model="periodVoidOpen" max-width="620" persistent>
      <v-card v-if="periodTarget">
        <v-card-title class="text-subtitle-1 text-error">
          <v-icon start>mdi-cancel</v-icon>整期作廢：第 {{ periodTarget.period }} 期
        </v-card-title>
        <v-card-text>
          <v-alert v-if="payoutsLoading" type="info" variant="tonal" density="compact" class="mb-3">檢查保留款發還登記中…</v-alert>
          <v-alert v-else-if="relatedPayouts.length" type="error" variant="tonal" density="compact" class="mb-3">
            此期已有 <b>{{ relatedPayouts.length }}</b> 筆保留款發還登記，須先於「保留款追蹤」刪除後才能整期作廢。
          </v-alert>

          <div class="text-body-2 font-weight-bold mb-1">影響範圍</div>
          <v-row dense class="mb-2">
            <v-col cols="4"><div class="impact-tile"><label>{{ recordWord }}紀錄</label><div>{{ periodVoidableCount(periodTarget) }} <small>筆</small></div></div></v-col>
            <v-col v-if="isBonusView" cols="4"><div class="impact-tile"><label>獎金明細</label><div>{{ periodBonusCount(periodTarget) }} <small>筆</small></div></div></v-col>
            <v-col cols="4"><div class="impact-tile"><label>{{ isBonusView ? '獎金實發合計' : '本次請佣合計' }}</label><div>{{ money(isBonusView ? periodTarget.netSum : periodTarget.thisClaimSum) }}</div></div></v-col>
          </v-row>
          <div class="text-caption text-medium-emphasis mb-1">各戶「已{{ isBonusView ? '送' : '請' }}比例」回溯：</div>
          <div class="d-flex flex-wrap ga-1 mb-3">
            <v-chip v-for="r in periodVoidableRecords(periodTarget)" :key="r.id" size="small" variant="tonal" :color="r.type === 'refund' ? 'orange-darken-3' : 'error'">
              {{ r.unitId }} {{ r.type === 'refund' ? `+${r.refundRatioPct}%（${refundWord}還原）` : `−${r.ratioPct}%` }}
            </v-chip>
          </div>
          <ul class="text-body-2 mb-3 pl-4">
            <li>此期全部有效{{ recordWord }}紀錄改為「作廢」，每戶已{{ isBonusView ? '送' : '請' }}比例回溯後可重新{{ isBonusView ? '送獎金' : '請佣或重新匯入' }}</li>
            <li v-if="periodTarget.refundCount">此期{{ refundWord }}紀錄一併作廢：原{{ recordWord }}紀錄恢復有效、已{{ isBonusView ? '送' : '請' }}比例加回</li>
            <li v-if="isBonusView">本期全部獎金明細（含舊版請佣附帶獎金）一併作廢，不再列入統計與匯出；不影響請佣紀錄</li>
            <li v-else>不影響獎金紀錄與獎金明細</li>
            <li>作廢紀錄保留資料痕跡；若要完全移除，作廢後再使用「清除已作廢紀錄」</li>
          </ul>
          <v-text-field v-model="periodReason" label="作廢原因（必填）" variant="outlined" density="compact" class="mb-2"></v-text-field>
          <v-text-field v-model="typedConfirm" :label="`請輸入期別「${periodTarget.period}」以確認`" variant="outlined" density="compact"
            color="error" hide-details></v-text-field>
        </v-card-text>
        <v-divider></v-divider>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn variant="text" @click="periodVoidOpen = false">取消</v-btn>
          <v-btn color="error" variant="flat" :loading="working"
            :disabled="payoutsLoading || relatedPayouts.length > 0 || !periodReason.trim() || typedConfirm !== String(periodTarget.period)"
            @click="doVoidPeriod">確認整期作廢</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- 清除已作廢紀錄 dialog -->
    <v-dialog v-model="purgeOpen" max-width="520" persistent>
      <v-card v-if="periodTarget">
        <v-card-title class="text-subtitle-1 text-error">
          <v-icon start>mdi-delete-sweep-outline</v-icon>清除第 {{ periodTarget.period }} 期已作廢紀錄
        </v-card-title>
        <v-card-text>
          <p class="mb-2">
            將<b>實體刪除</b>此期 <b>{{ periodTarget.voidedCount }}</b> 筆已作廢{{ recordWord }}紀錄{{ isBonusView ? '及其已作廢獎金明細' : '' }}。
          </p>
          <ul class="text-body-2 mb-3 pl-4">
            <li>只會刪除狀態為「已作廢」的資料，有效紀錄不受影響</li>
            <li>已{{ isBonusView ? '送' : '請' }}比例在作廢時已回溯，此步驟不再變動比例</li>
            <li>刪除後無法復原，操作會記錄於「操作紀錄」</li>
          </ul>
          <v-text-field v-model="typedConfirm" :label="`請輸入期別「${periodTarget.period}」以確認`" variant="outlined" density="compact"
            color="error" hide-details></v-text-field>
        </v-card-text>
        <v-divider></v-divider>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn variant="text" @click="purgeOpen = false">取消</v-btn>
          <v-btn color="error" variant="flat" :loading="working" :disabled="typedConfirm !== String(periodTarget.period)" @click="doPurge">確認清除</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- 撤銷匯入 dialog -->
    <v-dialog v-model="undoOpen" max-width="520" persistent>
      <v-card v-if="undoTarget">
        <v-card-title class="text-subtitle-1 text-error">
          <v-icon start>mdi-undo-variant</v-icon>撤銷歷史匯入
        </v-card-title>
        <v-card-text>
          <div class="text-body-2 mb-2">
            <div>批次：<b>{{ undoTarget.fileName || undoTarget.batchId }}</b></div>
            <div class="text-caption text-medium-emphasis">{{ undoTarget.batchId }}｜{{ undoTarget.createdBy || '—' }}</div>
          </div>
          <v-row dense class="mb-2">
            <v-col cols="6"><div class="impact-tile"><label>請佣紀錄（全建案）</label><div>{{ undoTarget.totalCount }} <small>筆</small></div></div></v-col>
            <v-col cols="6"><div class="impact-tile"><label>涉及期別</label><div>{{ undoTarget.periods.join('、') }}</div></div></v-col>
          </v-row>
          <ul class="text-body-2 mb-3 pl-4">
            <li>此批次匯入的請佣紀錄與獎金明細將<b>實體刪除</b>（含已作廢者）</li>
            <li>仍有效的紀錄會先回溯每戶「已請比例」</li>
            <li>若批次跨多期，會一併撤銷；刪除後無法復原</li>
          </ul>
          <v-text-field v-model="typedConfirm" label="請輸入「撤銷」以確認" variant="outlined" density="compact" color="error" hide-details></v-text-field>
        </v-card-text>
        <v-divider></v-divider>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn variant="text" @click="undoOpen = false">取消</v-btn>
          <v-btn color="error" variant="flat" :loading="working" :disabled="typedConfirm !== '撤銷'" @click="doUndo">確認撤銷</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- 操作紀錄 dialog -->
    <v-dialog v-model="auditOpen" max-width="760">
      <v-card>
        <v-card-title class="text-subtitle-1 d-flex align-center">
          <v-icon start>mdi-clipboard-text-clock-outline</v-icon>請佣操作紀錄
          <v-spacer></v-spacer>
          <v-btn icon="mdi-refresh" size="small" variant="text" :loading="auditLoading" @click="loadAudit"></v-btn>
        </v-card-title>
        <v-card-text style="max-height: 65vh; overflow: auto">
          <div v-if="auditLoading" class="text-center py-6"><v-progress-circular indeterminate color="primary"></v-progress-circular></div>
          <v-alert v-else-if="!auditLogs.length" type="info" variant="tonal" density="compact">尚無操作紀錄</v-alert>
          <v-timeline v-else density="compact" side="end" align="start" truncate-line="both">
            <v-timeline-item v-for="l in auditLogs" :key="l.id" :dot-color="auditColor(l.action)" size="x-small">
              <div class="text-body-2">
                <b>{{ auditLabel(l.action) }}</b>
                <span v-if="l.period"> 第 {{ l.period }} 期</span>
                <span v-else-if="l.periods?.length"> 第 {{ l.periods.join('、') }} 期</span>
                <span class="text-caption text-medium-emphasis ml-2">{{ fmtTs(l.createdAt) }}｜{{ l.operator || '—' }}</span>
              </div>
              <div class="text-caption">
                <span v-if="l.impact?.records !== undefined">請佣 {{ l.impact.records }} 筆</span>
                <span v-if="l.impact?.claims !== undefined">請佣 {{ l.impact.claims }} 筆</span>
                <span v-if="l.impact?.bonuses !== undefined">｜獎金 {{ l.impact.bonuses }} 筆</span>
                <span v-if="l.importFileName">｜{{ l.importFileName }}</span>
                <span v-if="l.importBatchId" class="text-medium-emphasis">｜{{ l.importBatchId }}</span>
              </div>
              <div v-if="l.reason" class="text-caption text-medium-emphasis">原因：{{ l.reason }}</div>
              <div v-if="l.impact?.units?.length" class="text-caption text-medium-emphasis">
                比例回溯：{{ l.impact.units.map(u => `${u.unitId} ${u.before}%→${u.after}%`).join('、') }}
              </div>
            </v-timeline-item>
          </v-timeline>
        </v-card-text>
        <v-divider></v-divider>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn variant="text" @click="auditOpen = false">關閉</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup>
import { useCommissionPlan } from '@/composables/useCommissionPlan';
const { planId, belongsToPlan } = useCommissionPlan();
import { ref, reactive, computed, watch } from 'vue';
import { useToast } from 'vue-toastification';
import * as XLSX from 'xlsx-js-style';
import { useUserStore } from '@/store/user';
import {
  voidCommissionRecordAPI, voidCommissionPeriodAPI, purgeVoidedCommissionPeriodAPI,
  undoCommissionImportAPI, fetchCommissionAuditLogs, fetchRetentionPayouts,
} from '@/api';
import { money, toNum } from '@/utils/commissionCalculation';
import DateFieldTW from './DateFieldTW.vue';

const props = defineProps({
  projectId: { type: String, required: true },
  projectName: { type: String, default: '' },
  settings: { type: Object, required: true },
  records: { type: Array, default: () => [] },
  bonusRecords: { type: Array, default: () => [] },
  bonusEntries: { type: Array, default: () => [] },   // 本方案獨立獎金紀錄（含退獎金、作廢）
  loading: { type: Boolean, default: false },
});

const emit = defineEmits(['refresh', 'export-period', 'reimport-period', 'edit-record', 'edit-records', 'edit-period', 'edit-bonus-record', 'edit-bonus-records', 'edit-bonus-period']);

// 檢視：請佣紀錄／獎金紀錄（獨立獎金＋退獎金，舊版請佣附帶獎金唯讀列出）
const view = ref('claim');
const isBonusView = computed(() => view.value === 'bonus');
const recordWord = computed(() => (isBonusView.value ? '獎金' : '請佣'));
const refundWord = computed(() => (isBonusView.value ? '退獎金' : '退佣'));

const toast = useToast();
const userStore = useUserStore();

const showVoided = ref(false);
const selected = ref([]);
const expanded = ref([]);
const sortBy = ref([{ key: 'period', order: 'desc' }]);
const itemsPerPage = ref(50);
const peoplePanel = ref(null);
const opPeriod = ref(null);

// 單筆／批次作廢
const voidOpen = ref(false);
const batchVoidOpen = ref(false);
const voidTarget = ref(null);
const voidReason = ref('');
const voiding = ref(false);

// 整期操作
const periodVoidOpen = ref(false);
const purgeOpen = ref(false);
const undoOpen = ref(false);
const periodTarget = ref(null);
const undoTarget = ref(null);
const periodReason = ref('');
const typedConfirm = ref('');
const working = ref(false);
const relatedPayouts = ref([]);
const payoutsLoading = ref(false);

// 操作紀錄
const auditOpen = ref(false);
const auditLoading = ref(false);
const auditLogs = ref([]);

/** 管理權限：超級/系統管理員，或本建案「銷控系統」權限 */
const canManage = computed(() => {
  const u = userStore.user;
  const roles = u?.roles || [];
  if (roles.includes('超級管理員') || roles.includes('系統管理員')) return true;
  const systems = u?.permissions?.[props.projectId]?.systems || [];
  if (systems.includes('銷控系統')) return true;
  return !!userStore.hasProjectPermission?.('銷控系統', props.projectName);
});
const operatorKey = computed(() => userStore.user?.key || userStore.user?.phone || '');
const operatorName = computed(() => userStore.user?.name || '');

// ================= 資料來源 =================
const bonusByRecord = computed(() => {
  const map = {};
  props.bonusRecords.forEach(b => {
    if (!map[b.commissionRecordId]) map[b.commissionRecordId] = [];
    map[b.commissionRecordId].push(b);
  });
  return map;
});
function bonusRowsOf(recordId) { return bonusByRecord.value[recordId] || []; }
function bonusCountOf(recordId) { return bonusRowsOf(recordId).filter(b => b.status !== 'voided').length; }
function bonusNetOf(recordId) { return bonusRowsOf(recordId).filter(b => b.status !== 'voided').reduce((s, b) => s + toNum(b.net), 0); }
/** 某筆紀錄獎金明細出現的類別（依建案設定順序，另補設定已移除者） */
function bonusCatsOf(recordId) {
  const defs = (props.settings.bonusCategories || []).slice().sort((a, b) => toNum(a.order) - toNum(b.order));
  const used = new Set();
  bonusRowsOf(recordId).forEach(b => Object.keys(b.amounts || {}).forEach(k => used.add(k)));
  const list = defs.filter(c => used.has(c.key)).map(c => ({ key: c.key, label: c.label || c.key }));
  used.forEach(k => { if (!list.some(c => c.key === k)) list.push({ key: k, label: k }); });
  return list;
}

/** 目前檢視的紀錄來源：獎金檢視＝舊版請佣附帶獎金（有獎金明細者）＋獨立獎金紀錄 */
const sourceRecords = computed(() => {
  if (!isBonusView.value) return props.records;
  const legacy = props.records
    .filter(r => r.status !== 'voided' && (bonusByRecord.value[r.id] || []).some(b => b.status !== 'voided'))
    .map(r => ({ ...r, _legacyBonus: true }));
  return [...legacy, ...props.bonusEntries];
});

const normSales = v => (Array.isArray(v) ? v.join('、') : String(v || ''));
const naturalCompare = (a, b) => String(a ?? '').localeCompare(String(b ?? ''), 'zh-Hant', { numeric: true });

function statusOf(r) {
  if (r.status === 'voided') return { key: 'voided', label: '已作廢', title: r.voidReason || '' };
  if (r.type === 'refund') return { key: 'refund', label: refundWord.value, title: isBonusView.value ? (r.reason || '') : refundTitle(r) };
  if (isBonusView.value ? r.bonusRefundedBy : r.refundedBy) {
    return { key: 'refunded', label: `已${refundWord.value}`, title: `已於第 ${(isBonusView.value ? r.bonusRefundPeriod : r.refundPeriod) || '?'} 期${refundWord.value}` };
  }
  if (r._legacyBonus) return { key: 'legacy', label: '請佣附帶', title: '舊版請佣附帶獎金，作廢只作廢其獎金明細' };
  if (!isBonusView.value && r.source === 'import') return { key: 'import', label: '匯入', title: r.importFileName || r.importBatchId || '' };
  return { key: 'active', label: '有效', title: '' };
}
function statusColor(key) {
  return { voided: 'error', refund: 'error', refunded: 'orange-darken-3', legacy: 'grey', import: 'grey', active: 'success' }[key] || 'default';
}

/** 平鋪列（含排序／篩選用欄位）；預先依期別降冪、戶別自然排序，表格單欄排序時同值維持此順序 */
const allRows = computed(() => sourceRecords.value.slice()
  .sort((a, b) => toNum(b.period) - toNum(a.period) || naturalCompare(a.unitId, b.unitId) || String(a.requestDate || '').localeCompare(String(b.requestDate || '')))
  .map(r => {
  const st = statusOf(r);
  const voided = r.status === 'voided';
  const refund = r.type === 'refund';
  const refunded = !!(isBonusView.value ? r.bonusRefundedBy : r.refundedBy);
  return {
    id: r.id,
    raw: r,
    period: toNum(r.period),
    unitId: String(r.unitId || ''),
    buyer: r.snapshot?.buyerName || '',
    sales: normSales(r.snapshot?.salesperson),
    contractType: r.snapshot?.contractType || '',
    requestDate: r.requestDate || '',
    ratioPct: toNum(r.ratioPct),
    commPct: toNum(r.commPct),
    dealTotal: toNum(r.snapshot?.dealTotal),
    transactionTotal: toNum(r.snapshot?.transactionTotal ?? r.snapshot?.dealTotal),
    totalFloor: toNum(r.snapshot?.totalFloor),
    spread: toNum(r.snapshot?.spread),
    dealAfter: toNum(r.calc?.dealAfter),
    realClaim: toNum(r.calc?.realClaim),
    claimKeep: toNum(r.calc?.claimKeep),
    thisClaim: toNum(r.calc?.thisClaim),
    bonusCount: bonusCountOf(r.id),
    bonusNet: bonusNetOf(r.id),
    handover: toNum(r.handover?.total),
    note: String(r.note || ''),
    source: r.source === 'import' ? '匯入' : (r._legacyBonus ? '請佣附帶' : '系統'),
    createdBy: r.createdBy || '',
    status: st.label, statusKey: st.key, statusTitle: st.title,
    voided, refund,
    editable: !voided && !refund && !refunded,
    selectable: !voided,
  };
}));

// ================= 欄位 =================
const CLAIM_COLUMNS = [
  { key: 'period', title: '期別', align: 'center', filter: 'select', width: 72 },
  { key: 'unitId', title: '戶別', filter: 'text' },
  { key: 'buyer', title: '買方', filter: 'text' },
  { key: 'sales', title: '銷售人員', filter: 'text' },
  { key: 'contractType', title: '合約方式', filter: 'select', hidden: true },
  { key: 'requestDate', title: '請佣日期', filter: 'date' },
  { key: 'ratioPct', title: '請佣比例', align: 'end', filter: 'number' },
  { key: 'commPct', title: '佣金比例', align: 'end', filter: 'number' },
  { key: 'transactionTotal', title: '成交總價(萬)', align: 'end', filter: 'number' },
  { key: 'dealTotal', title: '請佣總價(萬)', align: 'end', filter: 'number', hidden: true },
  { key: 'totalFloor', title: '總底價(萬)', align: 'end', filter: 'number' },
  { key: 'spread', title: '溢差價(萬)', align: 'end', filter: 'number' },
  { key: 'dealAfter', title: '折數後總價(萬)', align: 'end', filter: 'number' },
  { key: 'realClaim', title: '實際請領(元)', align: 'end', filter: 'number' },
  { key: 'claimKeep', title: '保留款(元)', align: 'end', filter: 'number' },
  { key: 'thisClaim', title: '本次請佣(元)', align: 'end', filter: 'number' },
  { key: 'note', title: '備註', filter: 'text' },
  { key: 'source', title: '來源', filter: 'select', hidden: true },
  { key: 'createdBy', title: '建立者', filter: 'select', hidden: true },
  { key: 'status', title: '狀態', filter: 'select' },
];
const BONUS_COLUMNS = [
  { key: 'period', title: '期別', align: 'center', filter: 'select', width: 72 },
  { key: 'unitId', title: '戶別', filter: 'text' },
  { key: 'buyer', title: '買方', filter: 'text' },
  { key: 'sales', title: '銷售人員', filter: 'text' },
  { key: 'contractType', title: '合約方式', filter: 'select', hidden: true },
  { key: 'requestDate', title: '獎金日期', filter: 'date' },
  { key: 'ratioPct', title: '獎金比例', align: 'end', filter: 'number' },
  { key: 'commPct', title: '佣金比例', align: 'end', filter: 'number', hidden: true },
  { key: 'transactionTotal', title: '成交總價(萬)', align: 'end', filter: 'number' },
  { key: 'dealTotal', title: '請佣總價(萬)', align: 'end', filter: 'number', hidden: true },
  { key: 'totalFloor', title: '總底價(萬)', align: 'end', filter: 'number' },
  { key: 'spread', title: '溢差價(萬)', align: 'end', filter: 'number' },
  { key: 'dealAfter', title: '折數後總價(萬)', align: 'end', filter: 'number' },
  { key: 'bonusCount', title: '人數', align: 'center', filter: 'number' },
  { key: 'bonusNet', title: '獎金實發(元)', align: 'end', filter: 'number' },
  { key: 'handover', title: '交屋團獎暫留(元)', align: 'end', filter: 'number' },
  { key: 'note', title: '備註', filter: 'text' },
  { key: 'source', title: '來源', filter: 'select', hidden: true },
  { key: 'createdBy', title: '建立者', filter: 'select', hidden: true },
  { key: 'status', title: '狀態', filter: 'select' },
];
const SUM_KEYS = ['realClaim', 'claimKeep', 'thisClaim', 'bonusNet', 'handover'];
const columnDefs = computed(() => (isBonusView.value ? BONUS_COLUMNS : CLAIM_COLUMNS));

// 欄位顯示（記在瀏覽器）
const storageKey = computed(() => `commissionPeriodList.hidden.${view.value}`);
function loadHidden() {
  try {
    const raw = localStorage.getItem(storageKey.value);
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return columnDefs.value.filter(c => c.hidden).map(c => c.key);
}
const hiddenCols = ref(loadHidden());
watch(view, () => { hiddenCols.value = loadHidden(); selected.value = []; expanded.value = []; });
watch(hiddenCols, v => { try { localStorage.setItem(storageKey.value, JSON.stringify(v)); } catch { /* ignore */ } }, { deep: true });
function toggleColumn(key) {
  hiddenCols.value = hiddenCols.value.includes(key) ? hiddenCols.value.filter(k => k !== key) : [...hiddenCols.value, key];
}

const headers = computed(() => [
  ...columnDefs.value.filter(c => !hiddenCols.value.includes(c.key)).map(c => ({ key: c.key, title: c.title, align: c.align || 'start', width: c.width, sortable: true })),
  { key: 'actions', title: '', sortable: false, width: 150 },
]);
const filterHeaders = computed(() => columnDefs.value.filter(c => !hiddenCols.value.includes(c.key)));
const customSort = { unitId: naturalCompare, buyer: naturalCompare, sales: naturalCompare };

// ================= 篩選 =================
function emptyFilters() {
  const f = {};
  [...CLAIM_COLUMNS, ...BONUS_COLUMNS].forEach(c => {
    if (f[c.key] !== undefined) return;
    f[c.key] = c.filter === 'select' ? [] : c.filter === 'text' ? '' : c.filter === 'date' ? { from: '', to: '' } : { min: null, max: null };
  });
  return f;
}
const filters = reactive(emptyFilters());
function isFilterActive(key) {
  const v = filters[key];
  if (Array.isArray(v)) return v.length > 0;
  if (typeof v === 'string') return v.trim() !== '';
  if (v && typeof v === 'object') return !!(v.from || v.to) || (v.min !== null && v.min !== '' && v.min !== undefined) || (v.max !== null && v.max !== '' && v.max !== undefined);
  return false;
}
const activeFilterCount = computed(() => filterHeaders.value.filter(h => isFilterActive(h.key)).length);
function resetFilter(key) { Object.assign(filters, { [key]: emptyFilters()[key] }); }
function clearFilters() { Object.assign(filters, emptyFilters()); }
function filterOptions(key) {
  const vals = [...new Set(allRows.value.map(r => r[key]).filter(v => v !== '' && v !== null && v !== undefined))];
  if (key === 'period') return vals.sort((a, b) => b - a).map(v => ({ value: v, title: `第 ${v} 期` }));
  return vals.sort(naturalCompare).map(v => ({ value: v, title: String(v) }));
}
function matches(row, key, type) {
  const f = filters[key];
  const v = row[key];
  if (type === 'select') return !f.length || f.includes(v);
  if (type === 'text') return !f.trim() || String(v).toLowerCase().includes(f.trim().toLowerCase());
  if (type === 'date') return (!f.from || String(v) >= f.from) && (!f.to || String(v) <= f.to);
  if (type === 'number') {
    const n = toNum(v);
    const hasMin = f.min !== null && f.min !== '' && f.min !== undefined;
    const hasMax = f.max !== null && f.max !== '' && f.max !== undefined;
    return (!hasMin || n >= toNum(f.min)) && (!hasMax || n <= toNum(f.max));
  }
  return true;
}
const rows = computed(() => allRows.value.filter(r =>
  (showVoided.value || !r.voided) && columnDefs.value.every(c => matches(r, c.key, c.filter))
));

const totals = computed(() => {
  const t = { count: 0 };
  SUM_KEYS.forEach(k => { t[k] = 0; });
  rows.value.forEach(r => {
    if (r.voided) return;
    t.count++;
    SUM_KEYS.forEach(k => { t[k] += toNum(r[k]); });
  });
  return t;
});

function rowProps({ item }) {
  return { class: { 'voided-row': item.voided, 'refund-row': item.refund && !item.voided } };
}

// ================= 每人獎金彙總（獎金檢視，依目前篩選） =================
const peopleSummary = computed(() => {
  if (!isBonusView.value) return [];
  const ids = new Set(rows.value.filter(r => !r.voided).map(r => r.id));
  const byPerson = {};
  const order = [];
  props.bonusRecords.filter(b => b.status !== 'voided' && ids.has(b.commissionRecordId)).forEach(b => {
    if (!byPerson[b.personKey]) {
      byPerson[b.personKey] = { personKey: b.personKey, name: b.name, sourceProjectId: b.sourceProjectId, sourceProjectName: b.sourceProjectName, subtotal: 0, keep: 0, tax: 0, nhi: 0, net: 0 };
      order.push(b.personKey);
    }
    const a = byPerson[b.personKey];
    a.subtotal += toNum(b.subtotal); a.keep += toNum(b.keep); a.tax += toNum(b.tax); a.nhi += toNum(b.nhi); a.net += toNum(b.net);
  });
  return order.map(k => byPerson[k]).sort((a, b) => b.net - a.net);
});
const peopleTotal = computed(() => peopleSummary.value.reduce((s, p) => s + p.net, 0));

// ================= 期別統計（期別操作與對話框用） =================
const batchIndex = computed(() => {
  const map = {};
  props.records.forEach(r => {
    if (!r.importBatchId) return;
    if (!map[r.importBatchId]) map[r.importBatchId] = { batchId: r.importBatchId, fileName: r.importFileName || '', createdBy: r.createdBy || '', totalCount: 0, periods: new Set() };
    map[r.importBatchId].totalCount++;
    map[r.importBatchId].periods.add(toNum(r.period));
  });
  return map;
});

const periods = computed(() => {
  const byPeriod = {};
  sourceRecords.value.forEach(r => {
    const p = toNum(r.period);
    if (!byPeriod[p]) byPeriod[p] = [];
    byPeriod[p].push(r);
  });
  return Object.keys(byPeriod).sort((a, b) => Number(b) - Number(a)).map(p => {
    const recs = byPeriod[p];
    const active = recs.filter(r => r.status !== 'voided');
    const refundCount = active.filter(r => r.type === 'refund').length;
    const batchMap = {};
    recs.forEach(r => {
      if (!r.importBatchId) return;
      if (!batchMap[r.importBatchId]) batchMap[r.importBatchId] = { batchId: r.importBatchId, fileName: r.importFileName || '', createdBy: r.createdBy || '', count: 0 };
      batchMap[r.importBatchId].count++;
    });
    return {
      period: Number(p),
      records: recs,
      activeCount: active.length,
      refundCount,
      voidedCount: recs.length - active.length,
      thisClaimSum: active.reduce((s, r) => s + toNum(r.calc?.thisClaim), 0),
      netSum: active.reduce((s, r) => s + bonusNetOf(r.id), 0),
      batches: Object.values(batchMap),
    };
  });
});
const periodOptions = computed(() => periods.value.map(pd => ({ value: pd.period, title: `第 ${pd.period} 期（${pd.activeCount} 筆有效${pd.voidedCount ? `、${pd.voidedCount} 筆作廢` : ''}）` })));
const opPd = computed(() => periods.value.find(pd => pd.period === opPeriod.value) || null);
// 期別操作預設：只篩單一期別時跟著該期，否則最新一期
watch([periods, () => filters.period], ([list, sel]) => {
  if (sel.length === 1 && list.some(pd => pd.period === sel[0])) opPeriod.value = sel[0];
  else if (!list.some(pd => pd.period === opPeriod.value)) opPeriod.value = list[0]?.period ?? null;
}, { immediate: true });

/** 可拉回編輯的紀錄：有效、非退佣、未被退佣（獎金檢視以 bonusRefundedBy 判斷） */
function editableRecords(pd) {
  return (pd.records || []).filter(r => r.status === 'active' && r.type !== 'refund' && !(isBonusView.value ? r.bonusRefundedBy : r.refundedBy));
}
/** 整期作廢範圍：獎金檢視只作用於獨立獎金紀錄（舊版請佣附帶獎金只作廢明細） */
function periodVoidableRecords(pd) {
  return (pd.records || []).filter(r => r.status !== 'voided' && !(isBonusView.value && r._legacyBonus));
}
function periodVoidableCount(pd) { return periodVoidableRecords(pd).length; }
function periodBonusCount(pd) {
  return props.bonusRecords.filter(b => toNum(b.period) === pd.period && b.status !== 'voided').length;
}
function refundTitle(r) {
  const src = (r.sources || []).map(x => `第${x.period}期`).join('、');
  return [r.reason, src ? `來源：${src}` : '', r.includeKeep ? '含保留款' : '不含保留款', r.refundBonus === false ? '不追回獎金' : '追回獎金'].filter(Boolean).join('｜');
}
function fmtWan(v) {
  if (v === undefined || v === null || v === '') return '—';
  return Number(toNum(v).toFixed(4)).toLocaleString('zh-TW', { maximumFractionDigits: 4 });
}

// ================= 批次操作 =================
const selectedRows = computed(() => {
  const set = new Set(selected.value);
  return rows.value.filter(r => set.has(r.id));
});
const selectedEditable = computed(() => selectedRows.value.filter(r => r.editable));
const selectedVoidable = computed(() => selectedRows.value.filter(r => !r.voided && !(isBonusView.value ? r.raw.bonusRefundedBy : r.raw.refundedBy) && !(r.refund && r.raw._legacyBonus)));
function editSelected() {
  const list = selectedEditable.value.map(r => r.raw);
  if (!list.length) return;
  emit(isBonusView.value ? 'edit-bonus-records' : 'edit-records', list);
  selected.value = [];
}
function openBatchVoid() {
  voidReason.value = '';
  batchVoidOpen.value = true;
}
async function doBatchVoid() {
  const list = selectedVoidable.value.slice();
  if (!list.length || !voidReason.value) return;
  voiding.value = true;
  let ok = 0;
  const failed = [];
  for (const r of list) {
    try {
      const res = await voidCommissionRecordAPI({
        projectId: props.projectId, planId: planId.value, recordId: r.id,
        submissionType: isBonusView.value ? 'bonus' : 'claim',
        voidReason: voidReason.value, voidedBy: operatorName.value,
      });
      if (res?.ok) ok++; else failed.push(`${r.unitId}`);
    } catch (e) {
      failed.push(`${r.unitId}：${e.message}`);
    }
  }
  voiding.value = false;
  batchVoidOpen.value = false;
  selected.value = [];
  if (ok) toast.success(`已作廢 ${ok} 筆${recordWord.value}紀錄`);
  if (failed.length) toast.error(`未作廢：${failed.join('、')}`);
  emit('refresh');
}

// ================= 匯出 Excel（目前篩選） =================
function exportExcel() {
  const cols = filterHeaders.value;
  const cell = (r, c) => {
    const v = r[c.key];
    if (['ratioPct', 'commPct'].includes(c.key)) return toNum(v);
    return v;
  };
  const aoa = [cols.map(c => c.title), ...rows.value.map(r => cols.map(c => cell(r, c)))];
  const t = totals.value;
  aoa.push(cols.map(c => (c.key === 'unitId' ? `合計（有效 ${t.count} 筆）` : SUM_KEYS.includes(c.key) ? t[c.key] : '')));
  const ws = XLSX.utils.aoa_to_sheet(aoa);
  ws['!cols'] = cols.map(c => ({ wch: Math.max(8, Math.min(30, String(c.title).length * 2 + 2)) }));
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, `${recordWord.value}紀錄`);
  const d = new Date();
  const p = n => String(n).padStart(2, '0');
  XLSX.writeFile(wb, `${props.projectName || '建案'}_${recordWord.value}紀錄_${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}.xlsx`);
}

// ---------- 單筆作廢 ----------
function openVoid(record) {
  voidTarget.value = record;
  voidReason.value = '';
  voidOpen.value = true;
}

async function doVoid() {
  if (!voidTarget.value || !voidReason.value) return;
  voiding.value = true;
  try {
    const res = await voidCommissionRecordAPI({
      projectId: props.projectId,
      planId: planId.value,
      recordId: voidTarget.value.id,
      submissionType: isBonusView.value ? 'bonus' : 'claim',
      voidReason: voidReason.value,
      voidedBy: operatorName.value,
    });
    if (res?.ok) {
      toast.success(`已作廢 ${voidTarget.value.unitId} 的${voidTarget.value.type === 'refund' ? refundWord.value : recordWord.value}紀錄${isBonusView.value ? `（連同 ${res.bonusVoided} 筆獎金明細）` : ''}`);
      voidOpen.value = false;
      emit('refresh');
    }
  } catch (e) {
    console.error('[CommissionPeriodList] 作廢失敗:', e);
    toast.error(`作廢失敗：${e.message}`);
  } finally {
    voiding.value = false;
  }
}

// ---------- 整期作廢 ----------
async function openVoidPeriod(pd) {
  if (!pd) return;
  periodTarget.value = pd;
  periodReason.value = '';
  typedConfirm.value = '';
  relatedPayouts.value = [];
  periodVoidOpen.value = true;
  payoutsLoading.value = true;
  try {
    const all = (await fetchRetentionPayouts(props.projectId)).filter(belongsToPlan);
    relatedPayouts.value = all.filter(x => (x.periods || []).some(v => toNum(v) === pd.period));
  } catch (e) {
    console.warn('[CommissionPeriodList] 讀取保留款發還失敗:', e);
  } finally {
    payoutsLoading.value = false;
  }
}

async function doVoidPeriod() {
  if (!periodTarget.value) return;
  working.value = true;
  try {
    const res = await voidCommissionPeriodAPI({
      projectId: props.projectId,
      planId: planId.value,
      period: periodTarget.value.period,
      submissionType: isBonusView.value ? 'bonus' : 'claim',
      voidReason: periodReason.value.trim(),
      voidedBy: operatorName.value,
      operatorKey: operatorKey.value,
    });
    if (res?.ok) {
      toast.success(`第 ${res.period} 期已整期作廢：${res.records} 筆${recordWord.value}紀錄${isBonusView.value ? `、${res.bonuses} 筆獎金明細` : ''}`);
      periodVoidOpen.value = false;
      emit('refresh');
    }
  } catch (e) {
    console.error('[CommissionPeriodList] 整期作廢失敗:', e);
    toast.error(`整期作廢失敗：${e.message}`);
  } finally {
    working.value = false;
  }
}

// ---------- 清除已作廢 ----------
function openPurge(pd) {
  if (!pd) return;
  periodTarget.value = pd;
  typedConfirm.value = '';
  purgeOpen.value = true;
}

async function doPurge() {
  if (!periodTarget.value) return;
  working.value = true;
  try {
    const res = await purgeVoidedCommissionPeriodAPI({
      projectId: props.projectId,
      planId: planId.value,
      period: periodTarget.value.period,
      submissionType: isBonusView.value ? 'bonus' : 'claim',
      purgedBy: operatorName.value,
      operatorKey: operatorKey.value,
    });
    if (res?.ok) {
      toast.success(`第 ${res.period} 期已清除 ${res.records} 筆作廢${recordWord.value}紀錄${isBonusView.value ? `、${res.bonuses} 筆獎金明細` : ''}`);
      purgeOpen.value = false;
      emit('refresh');
    }
  } catch (e) {
    console.error('[CommissionPeriodList] 清除失敗:', e);
    toast.error(`清除失敗：${e.message}`);
  } finally {
    working.value = false;
  }
}

// ---------- 撤銷匯入 ----------
function openUndo(pd, b) {
  const info = batchIndex.value[b.batchId];
  undoTarget.value = {
    ...b,
    totalCount: info?.totalCount || b.count,
    periods: info ? [...info.periods].sort((x, y) => x - y) : [pd.period],
  };
  typedConfirm.value = '';
  undoOpen.value = true;
}

async function doUndo() {
  if (!undoTarget.value) return;
  working.value = true;
  try {
    const res = await undoCommissionImportAPI({
      projectId: props.projectId,
      planId: planId.value,
      importBatchId: undoTarget.value.batchId,
      undoneBy: operatorName.value,
      operatorKey: operatorKey.value,
    });
    if (res?.ok) {
      toast.success(`已撤銷匯入：刪除 ${res.records} 筆請佣紀錄、${res.bonuses} 筆獎金明細`);
      undoOpen.value = false;
      emit('refresh');
    }
  } catch (e) {
    console.error('[CommissionPeriodList] 撤銷匯入失敗:', e);
    toast.error(`撤銷匯入失敗：${e.message}`);
  } finally {
    working.value = false;
  }
}

// ---------- 操作紀錄 ----------
function openAudit() {
  auditOpen.value = true;
  loadAudit();
}

async function loadAudit() {
  auditLoading.value = true;
  try {
    const logs = (await fetchCommissionAuditLogs(props.projectId)).filter(belongsToPlan);
    auditLogs.value = logs.sort((a, b) => tsMs(b.createdAt) - tsMs(a.createdAt));
  } catch (e) {
    console.error('[CommissionPeriodList] 讀取操作紀錄失敗:', e);
    toast.error(`讀取操作紀錄失敗：${e.message}`);
  } finally {
    auditLoading.value = false;
  }
}

function tsMs(v) {
  if (!v) return 0;
  if (typeof v.toMillis === 'function') return v.toMillis();
  if (v.seconds !== undefined) return v.seconds * 1000;
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? 0 : d.getTime();
}

function fmtTs(v) {
  const ms = tsMs(v);
  if (!ms) return '—';
  const d = new Date(ms);
  const p = n => String(n).padStart(2, '0');
  return `${d.getFullYear()}/${p(d.getMonth() + 1)}/${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;
}

const AUDIT_LABELS = {
  voidPeriod: '整期作廢',
  purgeVoided: '清除已作廢紀錄',
  import: '歷史匯入',
  undoImport: '撤銷匯入',
};
function auditLabel(a) { return AUDIT_LABELS[a] || a || '—'; }
function auditColor(a) {
  return a === 'import' ? 'primary' : a === 'purgeVoided' || a === 'undoImport' ? 'error' : 'warning';
}
</script>

<style scoped>
.table-scroll { overflow-x: auto; }
.records-table :deep(th) { white-space: nowrap; }
.records-table :deep(td) { white-space: nowrap; }
.th-cell { display: inline-flex; align-items: center; gap: 2px; width: 100%; }
.th-title { cursor: pointer; user-select: none; display: inline-flex; align-items: center; gap: 2px; }
.th-filter { opacity: .55; }
.th-filter:hover, .th-filter[aria-expanded="true"] { opacity: 1; }
.filter-options { max-height: 260px; overflow: auto; }
.note-cell { display: inline-block; max-width: 180px; overflow: hidden; text-overflow: ellipsis; vertical-align: bottom; }
.records-table :deep(.voided-row td) { color: #aaa; text-decoration: line-through; }
.records-table :deep(.voided-row td:last-child), .records-table :deep(.voided-row td:nth-last-child(2)), .records-table :deep(.voided-row td:first-child) { text-decoration: none; }
.records-table :deep(.refund-row td) { color: #c62828; background: #fff8f8; }
.records-table :deep(.total-row td) { font-weight: 700; background: #f5f7fa; border-top: 2px solid #cfd8e3; }
.detail-row td { background: #f8fafc; padding: 10px 16px !important; white-space: normal !important; }
.detail-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 12px 24px; }
.detail-block dl { margin: 0; }
.detail-block dl > div { display: flex; gap: 8px; font-size: 13px; line-height: 1.7; }
.detail-block dt { color: #64748b; min-width: 96px; flex-shrink: 0; }
.detail-block dd { margin: 0; overflow-wrap: anywhere; }
.detail-h { font-size: 12px; font-weight: 700; color: #334155; margin-bottom: 2px; }
.detail-wide { grid-column: 1 / -1; }
.voided-block dd { color: #c62828; }
.inner-table { background: #fff; }
.inner-table :deep(.voided-row td) { color: #aaa; text-decoration: line-through; }
.impact-tile { background: #fdf3f3; border-radius: 8px; padding: 6px 10px; }
.impact-tile label { display: block; font-size: 11px; color: #a55; }
.impact-tile div { font-size: 16px; font-weight: 700; color: #c62828; }
.impact-tile small { font-size: 11px; font-weight: 400; color: #a55; }
</style>
