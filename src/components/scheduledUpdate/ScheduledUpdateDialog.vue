<template>
  <v-dialog
    :model-value="modelValue"
    max-width="1080"
    scrollable
    :persistent="mode === 'price' || mode === 'excel'"
    content-class="mac-dialog-fit"
    @update:model-value="v => { if (!v) close(); }"
  >
    <v-card class="mac-sheet sud">
      <div class="mac-sheet-head">
        <button
          v-if="isNarrow && pane === 'detail'"
          type="button"
          class="mac-icon-btn sud-back"
          aria-label="返回清單"
          @click="pane = 'list'"
        ><v-icon size="22">mdi-chevron-left</v-icon></button>
        <v-icon v-else size="18">mdi-calendar-clock</v-icon>
        <span class="sud-head-title">{{ headTitle }}</span>
        <button type="button" class="mac-sheet-close" aria-label="關閉" @click="close">
          <v-icon size="18">mdi-close</v-icon>
        </button>
      </div>

      <div class="sud-body" :class="{ 'is-narrow': isNarrow, 'show-detail': pane === 'detail' }">
        <!-- 左：排程清單 -->
        <aside class="sud-list">
          <div class="sud-list-actions">
            <button type="button" class="mac-btn mac-btn--sm" :class="{ 'is-active': mode === 'price' && !form.jobId }" @click="startPrice()">
              <v-icon size="15">mdi-cash-plus</v-icon><span>調價排程</span>
            </button>
            <button v-if="parseExcel" type="button" class="mac-btn mac-btn--sm" :class="{ 'is-active': mode === 'excel' }" @click="startExcel">
              <v-icon size="15">mdi-microsoft-excel</v-icon><span>Excel 排程</span>
            </button>
            <button type="button" class="mac-icon-btn" aria-label="重新整理" :disabled="loadingList" @click="loadJobs">
              <v-icon size="17">mdi-refresh</v-icon>
            </button>
          </div>
          <div v-if="loadingList && !jobs.length" class="sud-list-empty">載入中…</div>
          <div v-else-if="!jobs.length" class="sud-list-empty">尚無排程</div>
          <div v-else class="sud-rows">
            <div
              v-for="job in jobs"
              :key="job.id"
              class="sud-row"
              :class="{ 'is-active': selectedJobId === job.id }"
              role="button"
              tabindex="0"
              @click="openJob(job)"
              @keydown.enter="openJob(job)"
            >
              <span class="sud-row-main">
                <span class="sud-row-line">
                  <span class="sud-row-time">{{ formatRunAt(job.runAt) }}</span>
                  <span class="mac-tag" :class="statusMeta(job.status).cls">{{ statusMeta(job.status).label }}</span>
                </span>
                <span class="sud-row-sub">{{ job.type === 'excel' ? 'Excel' : '調價' }} · {{ job.summary || '—' }}</span>
              </span>
              <v-icon size="16" class="sud-row-chev">mdi-chevron-right</v-icon>
            </div>
          </div>
        </aside>

        <!-- 右：建立／修改／檢視 -->
        <section ref="detailRef" class="sud-detail mac-form">
          <div v-if="mode === 'none'" class="sud-placeholder">
            <v-icon size="40">mdi-calendar-clock</v-icon>
            <span>指定時間自動調價或套用 Excel</span>
          </div>

          <!-- 共用：執行時間 -->
          <template v-if="mode === 'price' || (mode === 'excel' && excel.preview)">
            <div class="mac-form-label">執行時間</div>
            <div class="mac-form-group">
              <div class="mac-form-row sud-wrap-row">
                <span class="mac-form-row-label">日期時間</span>
                <div class="sud-when">
                  <input v-model="when.date" type="date" class="mac-form-input sud-date" aria-label="日期">
                  <input v-model="when.time" type="time" step="60" class="mac-form-input sud-time" aria-label="時間">
                  <span v-if="whenWeekday" class="sud-weekday">（{{ whenWeekday }}）</span>
                </div>
              </div>
            </div>
          </template>

          <!-- 調價排程 -->
          <template v-if="mode === 'price'">
            <div class="mac-form-label">套用範圍</div>
            <div class="mac-form-group">
              <div class="mac-form-row sud-wrap-row">
                <span class="mac-form-row-label">狀態</span>
                <div class="sud-chips">
                  <button
                    v-for="s in statusOptions"
                    :key="s.value"
                    type="button"
                    class="sud-chip"
                    :class="{ 'is-on': scope.statuses.includes(s.value) }"
                    :aria-pressed="scope.statuses.includes(s.value)"
                    @click="toggleIn(scope.statuses, s.value)"
                  >{{ s.label }}<span class="sud-chip-n">{{ s.count }}</span></button>
                </div>
              </div>
              <div v-if="buildingOptions.length > 1" class="mac-form-row sud-wrap-row">
                <span class="mac-form-row-label">棟別</span>
                <div class="sud-chips">
                  <button type="button" class="sud-chip" :class="{ 'is-on': !form.buildings.length }" @click="form.buildings = []">全部</button>
                  <button
                    v-for="b in buildingOptions"
                    :key="b"
                    type="button"
                    class="sud-chip"
                    :class="{ 'is-on': form.buildings.includes(b) }"
                    :aria-pressed="form.buildings.includes(b)"
                    @click="toggleIn(form.buildings, b)"
                  >{{ b }}</button>
                </div>
              </div>
            </div>

            <div class="mac-form-label">房屋</div>
            <div class="mac-form-group">
              <div class="mac-form-row sud-wrap-row">
                <span class="mac-form-row-label">方式</span>
                <div class="mac-form-seg sud-seg" role="radiogroup" aria-label="房屋調整方式">
                  <button
                    v-for="m in HOUSE_MODE_OPTIONS"
                    :key="m.value"
                    type="button"
                    role="radio"
                    class="mac-form-seg-btn"
                    :class="{ 'is-active': form.houseMode === m.value }"
                    :aria-checked="form.houseMode === m.value"
                    @click="form.houseMode = m.value"
                  >{{ m.label }}</button>
                </div>
              </div>
              <template v-if="form.houseMode !== 'manual'">
                <label class="mac-form-row">
                  <span class="mac-form-row-label">表價</span>
                  <span class="mac-form-input mac-form-unit sud-amount">
                    <input v-model="form.houseList" type="number" inputmode="decimal" step="any" placeholder="不調">
                    <span>{{ houseUnit }}</span>
                  </span>
                </label>
                <label class="mac-form-row">
                  <span class="mac-form-row-label">底價</span>
                  <span class="mac-form-input mac-form-unit sud-amount">
                    <input v-model="form.houseFloor" type="number" inputmode="decimal" step="any" placeholder="不調">
                    <span>{{ houseUnit }}</span>
                  </span>
                </label>
              </template>
              <div v-else class="mac-form-row mac-form-empty">在下方清單填新房屋價（不含露臺）</div>
            </div>

            <div class="mac-form-label">車位</div>
            <div class="mac-form-group">
              <label class="mac-form-row sud-inline-row">
                <span class="mac-form-row-label">一起調車位</span>
                <input v-model="form.parkingEnabled" type="checkbox" class="mac-switch sud-push">
              </label>
              <template v-if="form.parkingEnabled">
                <div class="mac-form-row sud-wrap-row">
                  <span class="mac-form-row-label">方式</span>
                  <div class="mac-form-seg sud-seg" role="radiogroup" aria-label="車位調整方式">
                    <button
                      v-for="m in PARKING_MODE_OPTIONS"
                      :key="m.value"
                      type="button"
                      role="radio"
                      class="mac-form-seg-btn"
                      :class="{ 'is-active': form.parkingMode === m.value }"
                      :aria-checked="form.parkingMode === m.value"
                      @click="form.parkingMode = m.value"
                    >{{ m.label }}</button>
                  </div>
                </div>
                <template v-if="form.parkingMode === 'fixed'">
                  <div v-if="!parkingTypes.length" class="mac-form-row mac-form-empty">沒有符合狀態的車位</div>
                  <div v-for="t in parkingTypes" :key="t.key" class="mac-form-row sud-type-row">
                    <span class="mac-form-row-label sud-type-label">{{ t.key }}<span class="sud-count">{{ t.count }} 個</span></span>
                    <span class="mac-form-input mac-form-unit sud-amount">
                      <input
                        :value="parkingAmount(t.key, 'list')"
                        type="number"
                        inputmode="decimal"
                        step="any"
                        placeholder="表價不調"
                        :aria-label="`${t.key} 表價加價`"
                        @input="setParkingAmount(t.key, 'list', $event.target.value)"
                      >
                      <span>萬</span>
                    </span>
                    <span class="mac-form-input mac-form-unit sud-amount">
                      <input
                        :value="parkingAmount(t.key, 'floor')"
                        type="number"
                        inputmode="decimal"
                        step="any"
                        placeholder="底價不調"
                        :aria-label="`${t.key} 底價加價`"
                        @input="setParkingAmount(t.key, 'floor', $event.target.value)"
                      >
                      <span>萬</span>
                    </span>
                  </div>
                </template>
                <div v-else class="mac-form-row mac-form-empty">在下方清單填新車位價</div>
              </template>
            </div>
          </template>

          <!-- Excel 排程 -->
          <template v-if="mode === 'excel'">
            <div class="mac-form-label">檔案</div>
            <div class="mac-form-group">
              <div class="mac-form-row">
                <button type="button" class="mac-btn mac-btn--sm" :disabled="excel.loading" @click="fileInput?.click()">
                  <v-icon size="15">mdi-paperclip</v-icon><span>選擇檔案</span>
                </button>
                <span class="sud-file-name">{{ excel.loading ? '解析中…' : (excel.fileName || '戶別 Excel（系統下載的格式）') }}</span>
                <input ref="fileInput" type="file" accept=".xlsx,.xls" hidden @change="onExcelFile">
              </div>
            </div>
            <div v-if="excel.error" class="mac-callout mac-callout--error sud-callout">
              <v-icon size="16">mdi-alert-circle-outline</v-icon><span class="sud-pre">{{ excel.error }}</span>
            </div>
            <div v-else-if="excel.warning" class="mac-callout mac-callout--warning sud-callout">
              <v-icon size="16">mdi-alert-outline</v-icon><span class="sud-pre">{{ excel.warning }}</span>
            </div>
          </template>
          <template v-if="mode === 'excel' && excel.preview">
            <div class="mac-form-label">可調表價／底價的狀態</div>
            <div class="mac-form-group">
              <div class="mac-form-row sud-wrap-row">
                <div class="sud-chips">
                  <button
                    v-for="s in statusOptions"
                    :key="s.value"
                    type="button"
                    class="sud-chip"
                    :class="{ 'is-on': scope.statuses.includes(s.value) }"
                    :aria-pressed="scope.statuses.includes(s.value)"
                    @click="toggleIn(scope.statuses, s.value)"
                  >{{ s.label }}<span class="sud-chip-n">{{ s.count }}</span></button>
                </div>
              </div>
            </div>
          </template>

          <!-- 共用：通知 -->
          <template v-if="mode === 'price' || (mode === 'excel' && excel.preview)">
            <div class="mac-form-label">
              LINE 通知
              <span class="mac-spacer"></span>
              <button v-if="recipients.length" type="button" class="mac-link-btn" @click="toggleAllRecipients">
                {{ allRecipientsOn ? '全不選' : '全選' }}
              </button>
            </div>
            <div class="mac-form-group sud-recipients">
              <div v-if="loadingRecipients" class="mac-form-row mac-form-empty">載入中…</div>
              <div v-else-if="!recipients.length" class="mac-form-row mac-form-empty">沒有可通知的人員</div>
              <label
                v-for="r in recipients"
                :key="r.userKey"
                class="mac-form-row sud-recipient"
                :class="{ 'is-off': !r.hasLine }"
              >
                <input
                  type="checkbox"
                  class="mac-check"
                  :disabled="!r.hasLine"
                  :checked="recipientKeys.includes(r.userKey)"
                  @change="toggleIn(recipientKeys, r.userKey)"
                >
                <span class="mac-form-row-main">{{ r.name }}<span v-if="r.userKey === selfKey" class="sud-me">（我）</span></span>
                <span v-if="!r.hasLine" class="mac-tag">未綁 LINE</span>
              </label>
            </div>
          </template>

          <!-- 調價預覽 -->
          <template v-if="mode === 'price'">
            <div class="mac-form-label">
              預覽（目前資料）
              <span class="mac-spacer"></span>
              <span class="sud-label-stat">房屋 {{ plan.summary.unitCount }} 戶<template v-if="form.parkingEnabled">・車位 {{ plan.summary.parkingCount }} 個</template></span>
            </div>
            <div class="mac-form-group sud-table-wrap">
              <table class="sud-table sud-table--nowrap">
                <thead>
                  <tr>
                    <th class="sud-col-check">
                      <input type="checkbox" class="mac-check" aria-label="全部套用" :checked="allUnitsIncluded" :disabled="!plan.households.length" @change="toggleAllUnits">
                    </th>
                    <th>戶別</th>
                    <th>狀態</th>
                    <th class="num">坪數</th>
                    <th class="num">{{ form.houseMode === 'manual' ? '新房屋表價' : '房屋總表價' }}</th>
                    <th class="num">{{ form.houseMode === 'manual' ? '新房屋底價' : '房屋總底價' }}</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-if="!plan.households.length"><td colspan="6" class="sud-table-empty">沒有符合條件的戶別</td></tr>
                  <tr v-for="row in plan.households" :key="row.id" :class="{ 'is-excluded': row.excluded }">
                    <td class="sud-col-check">
                      <input type="checkbox" class="mac-check" :aria-label="`套用 ${row.id}`" :checked="!row.excluded" @change="toggleIn(form.excludedUnitIds, row.id)">
                    </td>
                    <td class="sud-strong">{{ row.id }}</td>
                    <td>{{ row.status || '空白' }}</td>
                    <td class="num">{{ fmtNum(row.area) }}</td>
                    <td v-for="kind in PRICE_KINDS" :key="kind" class="num">
                      <template v-if="form.houseMode === 'manual'">
                        <input
                          :value="manualValue(form.manual, row.id, kind)"
                          type="number"
                          inputmode="decimal"
                          step="any"
                          class="mac-form-input sud-cell-input"
                          :placeholder="fmtNum(unitById.get(row.id)?.[HOUSE_ONLY[kind]])"
                          :disabled="row.excluded"
                          :aria-label="`${row.id} 新房屋${kind === 'list' ? '表價' : '底價'}`"
                          @input="setManual(form.manual, row.id, kind, $event.target.value)"
                        >
                      </template>
                      <template v-else>
                        <span v-if="row.changes[HOUSE_TOTAL[kind]]" class="sud-change">
                          <span class="sud-from">{{ fmtNum(row.changes[HOUSE_TOTAL[kind]].from) }}</span>
                          <span class="sud-arrow">→</span>
                          <span class="sud-to">{{ fmtNum(row.changes[HOUSE_TOTAL[kind]].to) }}</span>
                          <span class="sud-delta">{{ fmtDelta(row.changes[HOUSE_TOTAL[kind]]) }}</span>
                        </span>
                        <span v-else class="sud-same">{{ fmtNum(unitById.get(row.id)?.[HOUSE_TOTAL[kind]]) }}</span>
                      </template>
                      <span v-if="kindSkip(row, kind)" class="sud-skip">{{ kindSkip(row, kind) }}</span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <template v-if="form.parkingEnabled">
              <div class="mac-form-label">車位預覽</div>
              <div class="mac-form-group sud-table-wrap">
                <table class="sud-table sud-table--nowrap">
                  <thead>
                    <tr>
                      <th class="sud-col-check">
                        <input type="checkbox" class="mac-check" aria-label="全部套用" :checked="allSpotsIncluded" :disabled="!plan.parkings.length" @change="toggleAllSpots">
                      </th>
                      <th>車位</th>
                      <th>形式</th>
                      <th>狀態</th>
                      <th class="num">表價</th>
                      <th class="num">底價</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-if="!plan.parkings.length"><td colspan="6" class="sud-table-empty">沒有符合條件的車位</td></tr>
                    <tr v-for="row in plan.parkings" :key="row.id" :class="{ 'is-excluded': row.excluded }">
                      <td class="sud-col-check">
                        <input type="checkbox" class="mac-check" :aria-label="`套用 ${row.id}`" :checked="!row.excluded" @change="toggleIn(form.excludedSpotIds, row.id)">
                      </td>
                      <td class="sud-strong">{{ row.id }}</td>
                      <td>{{ row.type }}</td>
                      <td>{{ row.status || '空白' }}</td>
                      <td v-for="kind in PRICE_KINDS" :key="kind" class="num">
                        <template v-if="form.parkingMode === 'manual'">
                          <input
                            :value="manualValue(form.parkingManual, row.id, kind)"
                            type="number"
                            inputmode="decimal"
                            step="any"
                            class="mac-form-input sud-cell-input"
                            :placeholder="fmtNum(spotById.get(row.id)?.[PARKING_FIELD[kind]])"
                            :disabled="row.excluded"
                            :aria-label="`${row.id} 新${kind === 'list' ? '表價' : '底價'}`"
                            @input="setManual(form.parkingManual, row.id, kind, $event.target.value)"
                          >
                        </template>
                        <template v-else>
                          <span v-if="row.changes[PARKING_FIELD[kind]]" class="sud-change">
                            <span class="sud-from">{{ fmtNum(row.changes[PARKING_FIELD[kind]].from) }}</span>
                            <span class="sud-arrow">→</span>
                            <span class="sud-to">{{ fmtNum(row.changes[PARKING_FIELD[kind]].to) }}</span>
                          </span>
                          <span v-else class="sud-same">{{ fmtNum(spotById.get(row.id)?.[PARKING_FIELD[kind]]) }}</span>
                        </template>
                        <span v-if="kindSkip(row, kind)" class="sud-skip">{{ kindSkip(row, kind) }}</span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </template>
          </template>

          <!-- Excel 異動預覽 -->
          <template v-if="mode === 'excel' && excel.preview">
            <div class="mac-form-label">
              異動預覽
              <span class="mac-spacer"></span>
              <span class="sud-label-stat">{{ excel.preview.unitCount }} 戶・{{ excel.preview.fieldKeys.length }} 個欄位</span>
            </div>
            <div class="mac-form-group sud-table-wrap">
              <table class="sud-table">
                <thead><tr><th>戶別／車位</th><th>欄位</th><th>原值</th><th>新值</th></tr></thead>
                <tbody>
                  <tr v-for="r in excelPreviewRows.slice(0, CHANGE_LIMIT)" :key="r.key">
                    <td class="sud-strong">{{ r.id }}</td>
                    <td>{{ r.label }}</td>
                    <td class="sud-from-cell">{{ r.from }}</td>
                    <td class="sud-to-cell">{{ r.to }}</td>
                  </tr>
                  <tr v-if="excelPreviewRows.length > CHANGE_LIMIT">
                    <td colspan="4" class="sud-table-empty">僅列出前 {{ CHANGE_LIMIT }} 筆，共 {{ excelPreviewRows.length }} 筆</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </template>

          <!-- 檢視排程 -->
          <template v-if="mode === 'view' && viewJob">
            <div class="mac-form-label">排程</div>
            <div class="mac-form-group">
              <div class="mac-form-row">
                <span class="mac-form-row-label">執行時間</span>
                <span class="sud-value">{{ formatRunAt(viewJob.runAt, true) }}</span>
              </div>
              <div class="mac-form-row">
                <span class="mac-form-row-label">狀態</span>
                <span class="sud-value"><span class="mac-tag" :class="statusMeta(viewJob.status).cls">{{ statusMeta(viewJob.status).label }}</span></span>
              </div>
              <div class="mac-form-row">
                <span class="mac-form-row-label">內容</span>
                <span class="sud-value">{{ viewJob.type === 'excel' ? 'Excel' : '調價' }} · {{ viewJob.summary || '—' }}</span>
              </div>
              <div v-if="viewJob.type === 'excel' && viewJob.excel?.fileName" class="mac-form-row">
                <span class="mac-form-row-label">檔案</span>
                <span class="sud-value">{{ viewJob.excel.fileName }}</span>
              </div>
              <div class="mac-form-row">
                <span class="mac-form-row-label">建立</span>
                <span class="sud-value">{{ viewJob.createdBy?.name || '—' }}<span class="sud-muted"> · {{ formatRunAt(viewJob.createdAt, true) }}</span></span>
              </div>
            </div>
            <div v-if="viewJob.status === 'failed' && viewJob.lastError" class="mac-callout mac-callout--error sud-callout">
              <v-icon size="16">mdi-alert-circle-outline</v-icon><span>{{ viewJob.lastError }}</span>
            </div>

            <template v-if="viewJob.result">
              <div class="mac-form-label">執行結果</div>
              <div class="mac-form-group">
                <div class="mac-form-row">
                  <span class="mac-form-row-label">已更新</span>
                  <span class="sud-value">房屋 {{ viewJob.result.unitsUpdated || 0 }} 戶<template v-if="viewJob.type !== 'excel' && viewJob.config?.parking?.enabled">・車位 {{ viewJob.result.parkingsUpdated || 0 }} 個</template></span>
                </div>
                <div class="mac-form-row">
                  <span class="mac-form-row-label">完成時間</span>
                  <span class="sud-value">{{ formatRunAt(viewJob.finishedAt, true) }}</span>
                </div>
                <div v-if="viewJob.notified" class="mac-form-row">
                  <span class="mac-form-row-label">LINE 通知</span>
                  <span class="sud-value">{{ viewJob.notified.sent }} 人</span>
                </div>
              </div>
            </template>

            <template v-if="viewJob.revert">
              <div class="mac-form-label">還原</div>
              <div class="mac-form-group">
                <div class="mac-form-row">
                  <span class="mac-form-row-label">已還原</span>
                  <span class="sud-value">房屋 {{ viewJob.revert.unitsRestored || 0 }} 戶<template v-if="viewJob.revert.parkingsRestored">・車位 {{ viewJob.revert.parkingsRestored }} 個</template></span>
                </div>
                <div class="mac-form-row">
                  <span class="mac-form-row-label">還原者</span>
                  <span class="sud-value">{{ viewJob.revert.by?.name || '—' }}<span class="sud-muted"> · {{ formatRunAt(viewJob.revert.at, true) }}</span></span>
                </div>
              </div>
            </template>

            <div v-if="loadingDetail" class="sud-loading">載入明細中…</div>
            <template v-else>
              <template v-if="skippedRows.length">
                <div class="mac-form-label">
                  略過
                  <span class="mac-spacer"></span>
                  <span class="sud-label-stat">{{ skippedTotal }} 筆</span>
                </div>
                <div class="mac-form-group sud-table-wrap sud-table-wrap--short">
                  <table class="sud-table">
                    <thead><tr><th>戶別／車位</th><th>欄位</th><th>原因</th></tr></thead>
                    <tbody>
                      <tr v-for="(s, i) in skippedRows" :key="i">
                        <td class="sud-strong">{{ s.id }}</td>
                        <td>{{ s.field ? fieldLabel(s.field, s.kind) : '—' }}</td>
                        <td>{{ s.reason }}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </template>
              <template v-if="detailRows.length">
                <div class="mac-form-label">
                  {{ detailTitle }}
                  <span class="mac-spacer"></span>
                  <span class="sud-label-stat">{{ detailUnitCount }} 筆</span>
                </div>
                <div class="mac-form-group sud-table-wrap">
                  <table class="sud-table">
                    <thead><tr><th>戶別／車位</th><th>欄位</th><th>原值</th><th>新值</th></tr></thead>
                    <tbody>
                      <tr v-for="r in detailRows.slice(0, CHANGE_LIMIT)" :key="r.key">
                        <td class="sud-strong">{{ r.id }}</td>
                        <td>{{ r.label }}</td>
                        <td class="sud-from-cell">{{ r.from }}</td>
                        <td class="sud-to-cell">{{ r.to }}</td>
                      </tr>
                      <tr v-if="detailRows.length > CHANGE_LIMIT">
                        <td colspan="4" class="sud-table-empty">僅列出前 {{ CHANGE_LIMIT }} 筆，共 {{ detailRows.length }} 筆</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </template>
            </template>
          </template>
        </section>
      </div>

      <div v-if="footVisible" class="mac-sheet-foot">
        <template v-if="confirmAction">
          <span class="sud-confirm-text">{{ confirmText }}</span>
          <span class="mac-spacer"></span>
          <button type="button" class="mac-btn" :disabled="busy" @click="confirmAction = null">返回</button>
          <button type="button" class="mac-btn mac-btn--danger-fill" :disabled="busy" @click="runConfirm">
            {{ confirmAction === 'revert' ? '確定還原' : '確定取消' }}
          </button>
        </template>
        <template v-else>
          <button
            v-if="(mode === 'price' && form.jobId) || (mode === 'view' && viewJob?.status === 'pending')"
            type="button"
            class="mac-btn mac-btn--danger"
            :disabled="busy"
            @click="confirmAction = 'cancel'"
          >取消排程</button>
          <button
            v-if="mode === 'view' && viewJob?.status === 'done'"
            type="button"
            class="mac-btn mac-btn--danger"
            :disabled="busy || loadingDetail"
            @click="confirmAction = 'revert'"
          ><v-icon size="15">mdi-undo-variant</v-icon><span>還原</span></button>
          <span class="mac-spacer"></span>
          <span v-if="whenText && (mode === 'price' || mode === 'excel')" class="sud-foot-when">{{ whenText }} 執行</span>
          <button v-if="mode === 'price'" type="button" class="mac-btn mac-btn--primary" :disabled="busy" @click="savePrice">
            {{ form.jobId ? '儲存變更' : '建立排程' }}
          </button>
          <button v-if="mode === 'excel'" type="button" class="mac-btn mac-btn--primary" :disabled="busy || !excel.preview || !excel.preview.unitCount" @click="createExcel">
            建立排程
          </button>
        </template>
      </div>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, reactive, ref, watch } from 'vue';
import { useDisplay } from 'vuetify';
import { useToast } from 'vue-toastification';
import { useUserStore } from '@/store/user';
import { scheduledUpdateApi } from '@/api';
import { COLUMN_DEFINITIONS } from '@/constants/householdColumns';
import { buildCommitmentOverrides, classifyCommitment } from '@/utils/salesStatusGroups';
import {
  PRICE_KINDS, PARKING_FIELD, hasPriceAdjustment, householdStatus, planPriceUpdate,
} from '@/utils/scheduledPricePlan';

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  projectId: { type: String, default: '' },
  households: { type: Array, default: () => [] },
  parkings: { type: Array, default: () => [] },
  parameters: { type: Array, default: () => [] },
  // (file) => Promise<{ rows, message, messageType }>：沿用「上傳戶別EXCEL」的解析
  parseExcel: { type: Function, default: null },
});
const emit = defineEmits(['update:modelValue']);

const toast = useToast();
const userStore = useUserStore();
const { width } = useDisplay();
const isNarrow = computed(() => width.value < 760);

const HOUSE_MODE_OPTIONS = [
  { value: 'perPing', label: '每坪加價' },
  { value: 'perUnit', label: '每戶加價' },
  { value: 'percent', label: '百分比' },
  { value: 'manual', label: '逐戶填價' },
];
const PARKING_MODE_OPTIONS = [
  { value: 'fixed', label: '每個加價' },
  { value: 'manual', label: '逐個填價' },
];
const HOUSE_ONLY = { list: 'price_list_house_only', floor: 'price_floor_house_only' };
const HOUSE_TOTAL = { list: 'price_list_house_total', floor: 'price_floor_house_total' };
const STATUS_META = {
  pending: { label: '待執行', cls: 'mac-tag--blue' },
  running: { label: '執行中', cls: 'mac-tag--orange' },
  done: { label: '已完成', cls: 'mac-tag--green' },
  failed: { label: '失敗', cls: 'mac-tag--red' },
  cancelled: { label: '已取消', cls: '' },
  reverting: { label: '還原中', cls: 'mac-tag--orange' },
  reverted: { label: '已還原', cls: '' },
};
const statusMeta = (s) => STATUS_META[s] || { label: s || '—', cls: '' };

const FIELD_LABELS = {
  ...Object.fromEntries(COLUMN_DEFINITIONS.map(c => [c.key, c.title])),
  status: '銷控狀態',
  landParcels: '土地標的',
  unitTags: '文字標籤',
  unitEffect: '邊框特效',
  availablePlans: '可選方案',
};
const PARKING_LABELS = { price_list: '車位表價', price_floor: '車位底價' };
const fieldLabel = (key, kind) => (kind === 'parking' ? PARKING_LABELS[key] : null) || FIELD_LABELS[key] || key;

// ───── 時間（一律台灣時間） ─────
const WEEK = ['日', '一', '二', '三', '四', '五', '六'];
function taipeiParts(ms) {
  const p = Object.fromEntries(new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Taipei', year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
  }).formatToParts(new Date(ms)).map(x => [x.type, x.value]));
  return { date: `${p.year}-${p.month}-${p.day}`, time: `${p.hour}:${p.minute}`, year: p.year, month: p.month, day: p.day };
}
const weekdayOf = (date) => {
  const d = new Date(`${date}T12:00:00+08:00`);
  return Number.isNaN(d.getTime()) ? '' : WEEK[d.getUTCDay()];
};
function formatRunAt(ms, withYear = false) {
  if (!ms) return '—';
  const p = taipeiParts(ms);
  const head = withYear ? `${p.year}/${Number(p.month)}/${Number(p.day)}` : `${Number(p.month)}/${Number(p.day)}`;
  return `${head}（${weekdayOf(p.date)}）${p.time}`;
}
const runAtFrom = (date, time) => {
  if (!date || !time) return null;
  const ms = new Date(`${date}T${time}:00+08:00`).getTime();
  return Number.isFinite(ms) ? ms : null;
};

// ───── 數字 ─────
const toNum = (v) => (v === null || v === undefined || v === '' || !Number.isFinite(Number(v)) ? null : Number(v));
const fmtNum = (v) => {
  const n = toNum(v);
  return n === null ? '—' : n.toLocaleString('zh-TW', { maximumFractionDigits: 2 });
};
const fmtDelta = (c) => {
  const d = Math.round(((toNum(c.to) || 0) - (toNum(c.from) || 0)) * 100) / 100;
  return d === 0 ? '' : `${d > 0 ? '+' : ''}${d.toLocaleString('zh-TW', { maximumFractionDigits: 2 })}`;
};
function formatValue(v) {
  if (v === null || v === undefined || v === '') return '（空白）';
  if (typeof v === 'object' && !Array.isArray(v) && v._ts) {
    const p = taipeiParts(v._ts);
    return `${p.year}/${Number(p.month)}/${Number(p.day)}`;
  }
  if (Array.isArray(v)) {
    if (!v.length) return '（空白）';
    return v.map(item => (item && typeof item === 'object' ? (item.text || item.name || JSON.stringify(item)) : String(item))).join('、');
  }
  if (typeof v === 'object') {
    if ('year' in v && 'month' in v && 'day' in v) return `${v.year}/${v.month}/${v.day}`;
    return JSON.stringify(v);
  }
  if (typeof v === 'boolean') return v ? '是' : '否';
  if (typeof v === 'number') return fmtNum(v);
  return String(v);
}

const CHANGE_LIMIT = 600;

// ───── 狀態、棟別選項 ─────
const overrides = computed(() => buildCommitmentOverrides(props.parameters));
const statusOptions = computed(() => {
  const counts = new Map();
  props.households.forEach(u => {
    const s = householdStatus(u);
    counts.set(s, (counts.get(s) || 0) + 1);
  });
  const names = [''];
  [...props.parameters]
    .sort((a, b) => (Number(a?.order) || 0) - (Number(b?.order) || 0))
    .forEach(p => {
      const name = String(p?.statusName ?? '').trim();
      if (name && !names.includes(name)) names.push(name);
    });
  [...counts.keys()].forEach(s => { if (!names.includes(s)) names.push(s); });
  return names.map(value => ({
    value,
    label: value || '空白',
    count: counts.get(value) || 0,
    unsold: ['available', 'released'].includes(classifyCommitment(value, overrides.value)),
  }));
});
const defaultStatuses = () => statusOptions.value.filter(o => o.unsold).map(o => o.value);
const naturalSort = (a, b) => String(a).localeCompare(String(b), 'zh-Hant', { numeric: true });
const buildingOptions = computed(() => [...new Set(props.households.map(u => String(u?.building ?? '').trim()).filter(Boolean))].sort(naturalSort));
const unitById = computed(() => new Map(props.households.map(u => [String(u?.unitId ?? '').trim(), u])));
const spotById = computed(() => new Map(props.parkings.map(p => [String(p?.spotId ?? '').trim(), p])));

// ───── 狀態 ─────
const pane = ref('list');
const mode = ref('none'); // none | price | excel | view
const jobs = ref([]);
const loadingList = ref(false);
const selectedJobId = ref(null);
const busy = ref(false);
const confirmAction = ref(null);
const detailRef = ref(null);
const fileInput = ref(null);

const recipients = ref([]);
const selfKey = ref('');
const loadingRecipients = ref(false);
const recipientKeys = ref([]);

const when = reactive({ date: '', time: '10:00' });
const scope = reactive({ statuses: [] });
const form = reactive({
  jobId: null,
  buildings: [],
  excludedUnitIds: [],
  houseMode: 'perPing',
  houseList: '',
  houseFloor: '',
  manual: {},
  parkingEnabled: false,
  parkingMode: 'fixed',
  parkingAmounts: {},
  parkingManual: {},
  excludedSpotIds: [],
});
const excel = reactive({ fileName: '', rows: [], loading: false, error: '', warning: '', preview: null });

const viewJob = ref(null);
const detail = ref(null);
const loadingDetail = ref(false);

const userKey = () => userStore.user?.key || '';
const call = (action, extra = {}) => scheduledUpdateApi({ action, projectId: props.projectId, userKey: userKey(), ...extra });

const headTitle = computed(() => {
  if (isNarrow.value && pane.value === 'list') return '排程更新';
  if (mode.value === 'price') return form.jobId ? '修改調價排程' : '新增調價排程';
  if (mode.value === 'excel') return '新增 Excel 排程';
  if (mode.value === 'view') return '排程內容';
  return '排程更新';
});
const whenWeekday = computed(() => (when.date ? weekdayOf(when.date) : ''));
const whenText = computed(() => {
  const ms = runAtFrom(when.date, when.time);
  return ms ? formatRunAt(ms) : '';
});
const houseUnit = computed(() => ({ perPing: '萬/坪', perUnit: '萬/戶', percent: '%' }[form.houseMode] || ''));
const footVisible = computed(() => {
  if (isNarrow.value && pane.value !== 'detail') return false;
  if (mode.value === 'price' || mode.value === 'excel') return true;
  return mode.value === 'view' && ['pending', 'done'].includes(viewJob.value?.status);
});
const confirmText = computed(() => (confirmAction.value === 'revert'
  ? '把這次排程改過的價格與欄位改回原值？'
  : '取消這個排程？'));

function toggleIn(list, value) {
  const i = list.indexOf(value);
  if (i >= 0) list.splice(i, 1);
  else list.push(value);
}

// ───── 調價設定與預覽 ─────
const priceConfig = computed(() => ({
  statuses: scope.statuses,
  buildings: form.buildings,
  excludedUnitIds: form.excludedUnitIds,
  house: { mode: form.houseMode, list: form.houseList, floor: form.houseFloor, manual: form.manual },
  parking: {
    enabled: form.parkingEnabled,
    mode: form.parkingMode,
    amounts: form.parkingAmounts,
    manual: form.parkingManual,
    excludedSpotIds: form.excludedSpotIds,
  },
}));
const plan = computed(() => planPriceUpdate(props.households, props.parkings, priceConfig.value));
const parkingTypes = computed(() => {
  // 依「目前狀態篩選」列出車位形式（不受排除影響）
  const rows = planPriceUpdate([], props.parkings, { ...priceConfig.value, parking: { enabled: true, mode: 'fixed' } }).parkings;
  const counts = new Map();
  rows.forEach(r => counts.set(r.type, (counts.get(r.type) || 0) + 1));
  return [...counts.entries()].map(([key, count]) => ({ key, count })).sort((a, b) => naturalSort(a.key, b.key));
});
const parkingAmount = (key, kind) => form.parkingAmounts[key]?.[kind] ?? '';
function setParkingAmount(key, kind, value) {
  form.parkingAmounts[key] = { ...(form.parkingAmounts[key] || {}), [kind]: value };
}
const manualValue = (map, id, kind) => map[id]?.[kind] ?? '';
function setManual(map, id, kind, value) {
  map[id] = { ...(map[id] || {}), [kind]: value };
}
function kindSkip(row, kind) {
  const label = kind === 'list' ? '表價' : '底價';
  if (row.skips.includes('無房屋坪數')) return kind === 'list' ? '無坪數' : '';
  return row.skips.find(s => s.startsWith(label)) || '';
}
const allUnitsIncluded = computed(() => plan.value.households.length > 0 && plan.value.households.every(r => !r.excluded));
function toggleAllUnits() {
  const ids = plan.value.households.map(r => r.id);
  form.excludedUnitIds = allUnitsIncluded.value ? ids : [];
}
const allSpotsIncluded = computed(() => plan.value.parkings.length > 0 && plan.value.parkings.every(r => !r.excluded));
function toggleAllSpots() {
  const ids = plan.value.parkings.map(r => r.id);
  form.excludedSpotIds = allSpotsIncluded.value ? ids : [];
}

const reachableKeys = computed(() => recipients.value.filter(r => r.hasLine).map(r => r.userKey));
const allRecipientsOn = computed(() => reachableKeys.value.length > 0 && reachableKeys.value.every(k => recipientKeys.value.includes(k)));
function toggleAllRecipients() {
  recipientKeys.value = allRecipientsOn.value ? [] : [...reachableKeys.value];
}

// ───── 載入 ─────
async function loadJobs() {
  if (!props.projectId) return;
  loadingList.value = true;
  try {
    const res = await call('list');
    if (res?.status !== 'success') throw new Error(res?.message || '載入排程失敗');
    jobs.value = res.jobs || [];
    if (viewJob.value) {
      const fresh = jobs.value.find(j => j.id === viewJob.value.id);
      if (fresh && (fresh.status !== viewJob.value.status || fresh.updatedAt !== viewJob.value.updatedAt)) {
        viewJob.value = fresh;
        loadDetail(fresh);
      }
    }
  } catch (err) {
    toast.error(err.message);
  } finally {
    loadingList.value = false;
  }
}

async function loadRecipients() {
  loadingRecipients.value = true;
  try {
    const res = await call('recipients');
    if (res?.status !== 'success') throw new Error(res?.message || '載入通知人員失敗');
    recipients.value = res.recipients || [];
    selfKey.value = res.selfKey || '';
    // 名單比表單晚載入時，新建的排程補上預設全選
    if ((mode.value === 'price' && !form.jobId) || mode.value === 'excel') {
      if (!recipientKeys.value.length) recipientKeys.value = [...reachableKeys.value];
    }
  } catch (err) {
    toast.error(err.message);
  } finally {
    loadingRecipients.value = false;
  }
}

async function loadDetail(job) {
  detail.value = null;
  if (!job || (job.type === 'price' && job.status === 'pending')) return;
  loadingDetail.value = true;
  try {
    const res = await call('detail', { jobId: job.id });
    if (res?.status !== 'success') throw new Error(res?.message || '載入明細失敗');
    if (viewJob.value?.id === job.id) {
      detail.value = res;
      viewJob.value = res.job;
    }
  } catch (err) {
    toast.error(err.message);
  } finally {
    loadingDetail.value = false;
  }
}

// ───── 切換畫面 ─────
function scrollTop() {
  nextTick(() => { if (detailRef.value) detailRef.value.scrollTop = 0; });
}
function defaultWhen() {
  const tomorrow = taipeiParts(Date.now() + 24 * 3600 * 1000);
  when.date = tomorrow.date;
  when.time = '10:00';
}
function resetCommon() {
  confirmAction.value = null;
  selectedJobId.value = null;
  viewJob.value = null;
  detail.value = null;
  scope.statuses = defaultStatuses();
  recipientKeys.value = [...reachableKeys.value];
  defaultWhen();
}

function startPrice(job = null) {
  resetCommon();
  Object.assign(form, {
    jobId: null, buildings: [], excludedUnitIds: [], houseMode: 'perPing', houseList: '', houseFloor: '',
    manual: {}, parkingEnabled: false, parkingMode: 'fixed', parkingAmounts: {}, parkingManual: {}, excludedSpotIds: [],
  });
  if (job) {
    const c = job.config || {};
    const house = c.house || {};
    const parking = c.parking || {};
    const p = taipeiParts(job.runAt);
    selectedJobId.value = job.id;
    when.date = p.date;
    when.time = p.time;
    scope.statuses = [...(c.statuses || [])];
    recipientKeys.value = [...(job.recipients || [])];
    Object.assign(form, {
      jobId: job.id,
      buildings: [...(c.buildings || [])],
      excludedUnitIds: [...(c.excludedUnitIds || [])],
      houseMode: house.mode || 'perPing',
      houseList: house.list ?? '',
      houseFloor: house.floor ?? '',
      manual: JSON.parse(JSON.stringify(house.manual || {})),
      parkingEnabled: parking.enabled === true,
      parkingMode: parking.mode || 'fixed',
      parkingAmounts: JSON.parse(JSON.stringify(parking.amounts || {})),
      parkingManual: JSON.parse(JSON.stringify(parking.manual || {})),
      excludedSpotIds: [...(parking.excludedSpotIds || [])],
    });
  }
  mode.value = 'price';
  pane.value = 'detail';
  scrollTop();
}

function startExcel() {
  resetCommon();
  Object.assign(excel, { fileName: '', rows: [], loading: false, error: '', warning: '', preview: null });
  mode.value = 'excel';
  pane.value = 'detail';
  scrollTop();
}

function openJob(job) {
  if (job.type === 'price' && job.status === 'pending') {
    startPrice(job);
    return;
  }
  confirmAction.value = null;
  selectedJobId.value = job.id;
  viewJob.value = job;
  mode.value = 'view';
  pane.value = 'detail';
  scrollTop();
  loadDetail(job);
}

// ───── 檢視明細 ─────
function flattenChanges(list) {
  const rows = [];
  (list || []).forEach(c => {
    Object.entries(c.fields || {}).forEach(([key, v]) => {
      rows.push({
        key: `${c.kind || 'household'}-${c.id || c.unitId}-${key}`,
        id: c.id || c.unitId,
        label: fieldLabel(key, c.kind),
        from: formatValue(v?.from),
        to: formatValue(v?.to),
      });
    });
  });
  return rows.sort((a, b) => naturalSort(a.id, b.id));
}
const detailRows = computed(() => {
  if (!detail.value) return [];
  if (detail.value.changes?.length) return flattenChanges(detail.value.changes);
  if (viewJob.value?.type === 'excel' && viewJob.value?.status === 'pending') return flattenChanges(detail.value.items);
  return [];
});
const detailUnitCount = computed(() => new Set(detailRows.value.map(r => r.id)).size);
const detailTitle = computed(() => (detail.value?.changes?.length ? '異動明細' : '預定異動'));
const skippedRows = computed(() => (viewJob.value?.revert?.skipped?.length ? viewJob.value.revert.skipped : (viewJob.value?.result?.skipped || [])));
const skippedTotal = computed(() => (viewJob.value?.revert?.skipped?.length ? viewJob.value.revert.skippedCount : viewJob.value?.result?.skippedCount) || skippedRows.value.length);
const excelPreviewRows = computed(() => flattenChanges(excel.preview?.items));

// ───── 動作 ─────
function validateWhen() {
  const ms = runAtFrom(when.date, when.time);
  if (!ms) return '請設定執行時間';
  if (ms <= Date.now()) return '執行時間必須晚於現在';
  return '';
}

async function savePrice() {
  const err = validateWhen()
    || (!scope.statuses.length ? '請至少勾選一個狀態' : '')
    || (!hasPriceAdjustment(priceConfig.value) ? '請填寫調整金額' : '');
  if (err) {
    toast.warning(err);
    return;
  }
  busy.value = true;
  try {
    const res = await call('savePrice', {
      jobId: form.jobId || undefined,
      runAt: runAtFrom(when.date, when.time),
      config: JSON.parse(JSON.stringify(priceConfig.value)),
      recipients: recipientKeys.value,
    });
    if (res?.status !== 'success') throw new Error(res?.message || '儲存失敗');
    toast.success(form.jobId ? '排程已更新' : `已排程：${whenText.value} 執行`);
    await loadJobs();
    const saved = jobs.value.find(j => j.id === res.jobId);
    if (saved) startPrice(saved);
  } catch (e) {
    toast.error(e.message);
  } finally {
    busy.value = false;
  }
}

async function onExcelFile(event) {
  const file = event.target.files?.[0];
  event.target.value = '';
  if (!file || !props.parseExcel) return;
  Object.assign(excel, { fileName: file.name, rows: [], loading: true, error: '', warning: '', preview: null });
  try {
    const parsed = await props.parseExcel(file);
    excel.rows = parsed.rows || [];
    if (parsed.messageType === 'warning') excel.warning = String(parsed.message || '').split('\n').slice(1).join('\n');
    const res = await call('previewExcel', { rows: excel.rows });
    if (res?.status !== 'success') throw new Error(res?.message || '比對失敗');
    excel.preview = res;
    const notes = [];
    if (res.unknownUnitIds?.length) notes.push(`找不到戶別，將略過：${res.unknownUnitIds.slice(0, 20).join('、')}${res.unknownUnitIds.length > 20 ? '…' : ''}`);
    if (!res.unitCount) notes.push('內容與目前資料相同，沒有需要更新的欄位');
    if (notes.length) excel.warning = [excel.warning, ...notes].filter(Boolean).join('\n');
  } catch (e) {
    excel.error = e.message || '解析檔案失敗';
    excel.preview = null;
  } finally {
    excel.loading = false;
  }
}

async function createExcel() {
  const err = validateWhen() || (!scope.statuses.length ? '請至少勾選一個可調價狀態' : '');
  if (err) {
    toast.warning(err);
    return;
  }
  busy.value = true;
  try {
    const res = await call('createExcel', {
      rows: excel.rows,
      fileName: excel.fileName,
      runAt: runAtFrom(when.date, when.time),
      statuses: scope.statuses,
      recipients: recipientKeys.value,
    });
    if (res?.status !== 'success') throw new Error(res?.message || '建立失敗');
    toast.success(`已排程：${whenText.value} 執行`);
    await loadJobs();
    const saved = jobs.value.find(j => j.id === res.jobId);
    if (saved) openJob(saved);
  } catch (e) {
    toast.error(e.message);
  } finally {
    busy.value = false;
  }
}

async function runConfirm() {
  const action = confirmAction.value;
  const jobId = mode.value === 'price' ? form.jobId : viewJob.value?.id;
  if (!action || !jobId) return;
  busy.value = true;
  try {
    const res = await call(action === 'revert' ? 'revert' : 'cancel', { jobId });
    if (res?.status !== 'success') throw new Error(res?.message || '操作失敗');
    if (action === 'revert') {
      toast.success(`已還原：房屋 ${res.unitsRestored} 戶${res.parkingsRestored ? `、車位 ${res.parkingsRestored} 個` : ''}${res.skippedCount ? `，略過 ${res.skippedCount} 筆` : ''}`);
    } else {
      toast.success('排程已取消');
    }
    confirmAction.value = null;
    await loadJobs();
    const fresh = jobs.value.find(j => j.id === jobId);
    if (fresh) openJob(fresh);
  } catch (e) {
    toast.error(e.message);
  } finally {
    busy.value = false;
  }
}

// ───── 開關與自動更新 ─────
let pollTimer = null;
function stopPolling() {
  if (pollTimer) clearInterval(pollTimer);
  pollTimer = null;
}
function startPolling() {
  stopPolling();
  pollTimer = setInterval(() => {
    const soon = Date.now() + 60 * 1000;
    const active = jobs.value.some(j => ['running', 'reverting'].includes(j.status) || (j.status === 'pending' && j.runAt <= soon));
    if (active && !busy.value) loadJobs();
  }, 20000);
}

watch(() => props.modelValue, async (open) => {
  if (!open) {
    stopPolling();
    return;
  }
  mode.value = 'none';
  pane.value = 'list';
  selectedJobId.value = null;
  viewJob.value = null;
  confirmAction.value = null;
  jobs.value = [];
  startPolling();
  await Promise.all([loadJobs(), loadRecipients()]);
}, { immediate: true });

watch(isNarrow, (narrow) => { if (!narrow) pane.value = 'detail'; });
onBeforeUnmount(stopPolling);

function close() {
  if (busy.value) return;
  emit('update:modelValue', false);
}
</script>

<style scoped>
.sud { display: flex; flex-direction: column; }
.sud-head-title { min-width: 0; overflow-wrap: anywhere; }
.sud-back { width: 30px; height: 30px; margin-left: -6px; }

.sud-body {
  display: grid;
  grid-template-columns: 280px minmax(0, 1fr);
  height: min(680px, calc(100vh - 170px));
  min-height: 0;
  overflow: hidden;
}

/* 左：清單 */
.sud-list {
  display: flex;
  flex-direction: column;
  min-height: 0;
  border-right: 1px solid rgba(0, 0, 0, 0.08);
  background: #fbfbfd;
}
.sud-list-actions { display: flex; align-items: center; gap: 6px; padding: 10px 10px 8px; }
.sud-list-actions .mac-btn { flex: 1 1 auto; }
.sud-list-empty { padding: 28px 16px; text-align: center; color: #8e8e93; font-size: 13px; }
.sud-rows { flex: 1 1 auto; overflow-y: auto; padding: 0 6px 10px; }
.sud-row {
  display: flex;
  align-items: center;
  gap: 4px;
  min-height: 52px;
  padding: 6px 6px 6px 10px;
  border-radius: 7px;
  color: #1d1d1f;
  cursor: pointer;
  outline: none;
  -webkit-tap-highlight-color: transparent;
}
.sud-row + .sud-row { margin-top: 1px; }
.sud-row:hover { background: rgba(0, 0, 0, 0.04); }
.sud-row:focus-visible { box-shadow: inset 0 0 0 2px rgba(0, 113, 227, 0.4); }
.sud-row.is-active { background: #0071e3; color: #fff; }
.sud-row.is-active .sud-row-sub,
.sud-row.is-active .sud-row-chev { color: rgba(255, 255, 255, 0.85); }
.sud-row.is-active .mac-tag { --mac-tag-bg: rgba(255, 255, 255, 0.22); --mac-tag-color: #fff; }
.sud-row-main { display: flex; flex-direction: column; flex: 1 1 auto; min-width: 0; gap: 3px; }
.sud-row-line { display: flex; align-items: center; flex-wrap: wrap; gap: 6px; }
.sud-row-time { font-size: 13.5px; font-weight: 600; font-variant-numeric: tabular-nums; }
.sud-row-sub { font-size: 11.5px; color: #6e6e73; line-height: 1.35; overflow-wrap: anywhere; }
.sud-row-chev { flex-shrink: 0; color: #c7c7cc; }

/* 右：內容 */
.sud-detail { min-width: 0; min-height: 0; overflow-y: auto; padding: 0 18px 18px; }
.sud-detail > .mac-form-label:first-child { margin-top: 14px; }
.sud-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  height: 100%;
  color: #8e8e93;
  font-size: 13px;
  text-align: center;
}
.sud-placeholder .v-icon { color: #c7c7cc; }

.sud-wrap-row { flex-wrap: wrap; }
.sud-when { display: flex; align-items: center; flex-wrap: wrap; gap: 8px; margin-left: auto; }
.sud-date { flex: 0 0 auto; width: 160px; }
.sud-time { flex: 0 0 auto; width: 150px; }
.sud-weekday { color: #6e6e73; font-size: 13px; white-space: nowrap; }
.sud-seg { flex-wrap: wrap; margin-left: auto; }
.sud-push { margin-left: auto; }
.sud-amount { max-width: 170px !important; margin-left: auto; }
.sud-amount input { text-align: right; }
.sud-type-row { flex-wrap: wrap; }
.sud-type-row .sud-amount { margin-left: 0; flex: 1 1 120px; }
.sud-type-row .sud-amount:first-of-type { margin-left: auto; }
.sud-type-label { display: inline-flex; align-items: baseline; gap: 6px; }
.sud-count { color: #8e8e93; font-size: 12px; font-weight: 400; }

.sud-chips { display: flex; flex-wrap: wrap; gap: 6px; flex: 1 1 260px; min-width: 0; }
.sud-chip {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  min-height: 26px;
  padding: 2px 10px;
  border: 0;
  border-radius: 13px;
  background: rgba(0, 0, 0, 0.06);
  color: #3a3a3c;
  font: 500 12.5px/1.35 -apple-system, BlinkMacSystemFont, "SF Pro Text", "PingFang TC", "Noto Sans TC", sans-serif;
  cursor: pointer;
  transition: background-color 0.12s, color 0.12s;
}
.sud-chip:hover { background: rgba(0, 0, 0, 0.1); }
.sud-chip.is-on { background: #0071e3; color: #fff; }
.sud-chip-n { font-size: 11px; opacity: 0.7; font-variant-numeric: tabular-nums; }

.sud-recipients { max-height: 230px; overflow-y: auto; }
.sud-recipient { cursor: pointer; }
.sud-recipient.is-off { color: #8e8e93; cursor: default; }
.sud-me { color: #8e8e93; }

.sud-file-name { min-width: 0; color: #6e6e73; font-size: 12.5px; overflow-wrap: anywhere; }
.sud-callout { margin-top: 12px; }
.sud-pre { white-space: pre-line; }
.sud-label-stat { font-weight: 500; color: #3a3a3c; font-variant-numeric: tabular-nums; }
.sud-value { margin-left: auto; min-width: 0; text-align: right; overflow-wrap: anywhere; }
.sud-muted { color: #8e8e93; }
.sud-loading { padding: 18px 4px; color: #8e8e93; font-size: 13px; }

/* 表格 */
.sud-table-wrap { max-height: 420px; overflow: auto; }
.sud-table-wrap--short { max-height: 240px; }
.sud-table { width: 100%; border-collapse: collapse; font-size: 13px; }
.sud-table th {
  position: sticky;
  top: 0;
  z-index: 1;
  padding: 7px 10px;
  background: #f6f6f8;
  color: #6e6e73;
  font-size: 12px;
  font-weight: 600;
  text-align: left;
  white-space: nowrap;
  border-bottom: 1px solid rgba(0, 0, 0, 0.08);
}
.sud-table td {
  padding: 6px 10px;
  border-bottom: 1px solid #f0f0f3;
  vertical-align: middle;
  overflow-wrap: anywhere;
}
.sud-table tr:last-child td { border-bottom: 0; }
.sud-table .num { text-align: right; font-variant-numeric: tabular-nums; white-space: nowrap; }
.sud-table tr.is-excluded td { color: #aeaeb2; }
.sud-col-check { width: 34px; }
.sud-strong { font-weight: 600; white-space: nowrap; }
.sud-table-empty { padding: 18px 10px; text-align: center; color: #8e8e93; }
.sud-table--nowrap td { white-space: nowrap; overflow-wrap: normal; }
.sud-table:not(.sud-table--nowrap) td:not(.num) { min-width: 64px; }
.sud-change { display: inline-flex; align-items: baseline; gap: 4px; }
.sud-from { color: #8e8e93; }
.sud-arrow { color: #aeaeb2; }
.sud-to { font-weight: 600; }
.sud-delta { color: #1f7a36; font-size: 11.5px; }
.sud-same { color: #8e8e93; }
.sud-skip { display: block; color: #c27400; font-size: 11.5px; }
.sud-cell-input { width: 110px; flex: 0 0 auto; text-align: right; }
.sud-from-cell { color: #8e8e93; }
.sud-to-cell { font-weight: 600; }

.sud-confirm-text { font-size: 13px; font-weight: 600; overflow-wrap: anywhere; }
.sud-foot-when { color: #6e6e73; font-size: 12.5px; white-space: nowrap; }

/* 窄螢幕：清單與內容切換顯示 */
.sud-body.is-narrow {
  grid-template-columns: minmax(0, 1fr);
  height: calc(100dvh - 24px - 49px);
}
.sud-body.is-narrow.show-detail { height: calc(100dvh - 24px - 49px - 55px); }
.sud-body.is-narrow .sud-list { border-right: 0; background: #fff; }
.sud-body.is-narrow .sud-detail { display: none; padding: 0 12px 16px; }
.sud-body.is-narrow.show-detail .sud-list { display: none; }
.sud-body.is-narrow.show-detail .sud-detail { display: block; }

@media (max-width: 600px) {
  .sud-when { margin-left: 0; width: 100%; }
  .sud-date { flex: 1 1 150px; min-width: 150px; }
  .sud-time { flex: 1 1 140px; min-width: 140px; }
  .sud-seg { margin-left: 0; }
  .sud-amount { max-width: none !important; flex: 1 1 100%; margin-left: 0; }
  .sud-type-row .sud-amount { flex: 1 1 40%; }
  .sud-value { text-align: left; margin-left: 0; }
  .sud-foot-when { display: none; }
  .sud-inline-row { flex-wrap: nowrap; }
  .sud-inline-row > .mac-form-row-label { width: auto; flex: 1 1 auto; }
  .sud-table th, .sud-table td { padding-left: 7px; padding-right: 7px; }
}
</style>
