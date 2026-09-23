<template>
  <div class="commission-workbench" @keydown.capture="blockNumberSpin" @wheel.capture="blockNumberWheel">
    <!-- 工具列 -->
    <div class="d-flex align-center flex-wrap ga-2 mb-3">
      <v-btn color="primary" variant="flat" prepend-icon="mdi-plus" @click="openPicker">新增戶別</v-btn>
      <span class="text-body-2 text-medium-emphasis">下一期別 {{ nextPeriod }}｜已選 {{ entries.length }} 戶<template v-if="refunds.length">｜{{ refundLabel }} {{ refunds.length }} 戶</template></span>
      <v-spacer></v-spacer>
    </div>

    <p class="text-body-2 text-medium-emphasis mb-4">選擇戶別後，{{ isBonus ? '編輯本次獎金比例與人員分配，再獨立送出獎金。' : '編輯請佣條件，再獨立送出請佣。' }}</p>

    <v-alert v-if="!entries.length && !refunds.length" type="info" variant="tonal" class="mb-4">
      尚未選擇戶別，請點「新增戶別」。{{ isBonus ? '獎金額度與請佣分開計算，不需先送出請佣。' : '買方解約需退回佣金時，切到「退佣」頁籤。' }}
    </v-alert>

    <!-- 獎金：期別／獎金日期整批共用（各戶卡片不再個別填寫） -->
    <div v-if="isBonus" class="d-flex align-center flex-wrap ga-3 mb-3 claim-batch-fields">
      <v-combobox v-model="summaryPeriod" :items="summaryPeriods" label="獎金期別／當期彙總" type="number" variant="outlined" density="compact" hide-details style="max-width: 260px" />
      <DateFieldTW v-model="bonusDate" label="獎金日期" style="max-width: 220px" />
    </div>
    <!-- 請佣：期別／請佣日期整批共用（各戶卡片不再個別填寫） -->
    <div v-else class="d-flex align-center flex-wrap ga-3 mb-3 claim-batch-fields">
      <v-text-field v-model.number="claimPeriod" label="期別" type="number" min="1" variant="outlined" density="compact" hide-details style="max-width: 140px" />
      <DateFieldTW v-model="claimDate" label="請佣日期" style="max-width: 220px" />
    </div>
    <template v-if="isBonus">
      <PeriodBonusSummary :period="Number(summaryPeriod)" :summary="periodSummary" :notes="effectiveNotes" :rates="draftPersonRates" :history="personNoteHistory"
        :categories="settings.bonusCategories || []"
        :dirty="noteEdits.length > 0" :saving="savingNotes" @update="updatePeriodNote" @update-rate="updatePersonRate" @save="savePeriodNotes" />
      <v-expansion-panels v-if="savedPeriodEntries.length || savedPeriodRefunds.length" class="mb-4">
        <v-expansion-panel title="本方案本期已送出獎金（可拉回修改）">
          <v-expansion-panel-text>
            <div v-for="record in savedPeriodEntries" :key="record.id" class="d-flex align-center flex-wrap ga-3 mb-2">
              <span>{{ record.unitId }}・獎金比例 {{ record.ratioPct }}%</span>
              <v-chip v-if="record.bonusRefundedBy" size="x-small" color="orange-darken-3" variant="tonal">已退獎金</v-chip>
              <v-btn size="small" variant="tonal" :disabled="!!record.bonusRefundedBy || entries.some(e => e.replaceRecordId === record.id)" @click="loadFromRecords([record], bonusRecords)">拉回修改</v-btn>
            </div>
            <div v-for="record in savedPeriodRefunds" :key="record.id" class="d-flex align-center flex-wrap ga-3 mb-2">
              <v-chip size="x-small" color="error" variant="flat">退獎金</v-chip>
              <span>{{ record.unitId }}・退回 {{ record.refundRatioPct }}%・追回 {{ money(bonusNetOf(record.id)) }} 元</span>
              <v-btn size="small" variant="text" color="error" @click="openVoidRefund(record)">作廢退獎金</v-btn>
            </div>
          </v-expansion-panel-text>
        </v-expansion-panel>
      </v-expansion-panels>
    </template>

    <!-- 左右分欄：左＝戶別清單（固定）、右＝目前選取戶別的編輯區 -->
    <div v-if="entries.length || refunds.length" class="split-area">
      <aside class="unit-list" aria-label="本次戶別">
        <div class="list-h">
          <b>{{ entries.length }} 戶</b><span v-if="refunds.length">・{{ refundLabel }} {{ refunds.length }} 戶</span>
          <span class="text-medium-emphasis">・{{ totalIssues ? `${totalIssues} 項待完成` : '已填妥' }}</span>
          <v-spacer />
          <v-btn-toggle v-model="listFilter" mandatory density="compact" variant="outlined" divided class="list-filter">
            <v-btn value="all" size="x-small">全部</v-btn>
            <v-btn value="issue" size="x-small">待完成</v-btn>
          </v-btn-toggle>
        </div>
        <div class="list-body" role="listbox" aria-label="戶別清單" @keydown.down.prevent="selectOffset(1)" @keydown.up.prevent="selectOffset(-1)">
          <button v-for="row in visibleListRows" :key="row.id" type="button" class="list-row" :class="{ active: row.id === selectedId, 'is-refund': row.refund }"
            role="option" :aria-selected="row.id === selectedId" @click="selectCard(row.id)">
            <span class="dot" :class="row.issueClass"></span>
            <span class="main">
              <b class="u">{{ row.unitId }}</b>
              <span v-if="row.feeHint" class="fee-mark" title="銷控備註提到介紹費／贈品"><v-icon size="16" color="error">mdi-alert-circle</v-icon>有介紹費</span>
              <span v-if="row.partialRatio" class="fee-mark" title="請佣比例不足 100%"><v-icon size="16" color="error">mdi-alert-circle</v-icon>請佣 {{ row.claimPct }}%</span>
              <span class="b">{{ row.buyer || '—' }}</span>
              <v-chip size="x-small" variant="tonal" :color="contractTypeColor(row.contractType)">{{ row.contractType || '未設定合約方式' }}</v-chip>
              <v-chip v-if="row.refund" size="x-small" color="error" variant="flat">{{ refundLabel }}</v-chip>
              <span v-if="row.note" class="note-mark" :title="row.note">✎ {{ row.note }}</span>
            </span>
            <span class="amt">{{ money(row.amount) }}<small>{{ row.amountLabel }}</small></span>
            <span class="meta">
              <span>銷售 <b>{{ row.sales || '—' }}</b></span>
              <span>小訂 <b>{{ row.deposit || '—' }}</b></span>
              <span>簽約 <b>{{ row.contract || '—' }}</b></span>
              <span v-if="!row.refund">佣金 <b>{{ row.commPct }}%</b></span>
              <span>{{ row.ratioLabel }} <b>{{ row.ratioPct }}%</b></span>
              <span v-if="!row.refund && !isBonus">繳款 <b>{{ row.paymentRatio === null ? '—' : `${row.paymentRatio}%` }}</b></span>
            </span>
          </button>
          <div v-if="!visibleListRows.length" class="text-caption text-medium-emphasis pa-3 text-center">沒有待完成的戶別</div>
        </div>
        <div class="list-f">
          <span>{{ isBonus ? '本次獎金實發' : '本次請佣合計' }}</span>
          <b>{{ money(isBonus ? summary.totals.net : summary.thisClaimSum) }}</b>
        </div>
      </aside>

      <section class="unit-editor" aria-live="polite">
        <div class="editor-nav">
          <v-btn size="small" variant="text" prepend-icon="mdi-chevron-up" :disabled="selectedIndex <= 0" @click="selectOffset(-1)">上一戶</v-btn>
          <v-btn size="small" variant="text" append-icon="mdi-chevron-down" :disabled="selectedIndex < 0 || selectedIndex >= visibleListRows.length - 1" @click="selectOffset(1)">下一戶</v-btn>
          <span class="text-caption text-medium-emphasis ml-2" v-if="selectedIndex >= 0">{{ selectedIndex + 1 }} / {{ visibleListRows.length }}</span>
        </div>
        <CommissionUnitCard
          v-if="selectedEntry"
          :key="selectedEntry.id"
          :entry="selectedEntry"
          :mode="mode"
          :settings="settings"
          :profiles="personProfiles"
          :resolve-profile-key="k => profileKeyFor(k, selectedEntry.unit?.payment_contract_date)"
          :project-id="projectId"
          :project-name="projectName"
          :local-personnel="personnel"
          :claimed-pct="entryClaimedPct(selectedEntry)"
          :claim-total-pct="isBonus ? unitClaimedPct(selectedEntry.unitId) : null"
          split
          @remove="removeEntry(selectedEntry)"
        />
        <CommissionRefundCard
          v-else-if="selectedRefund"
          :key="selectedRefund.id"
          :entry="selectedRefund"
          :settings="settings"
          :project-id="projectId"
          :bonus-records="bonusRecords"
          :mode="mode"
          split
          @remove="removeRefund(selectedRefund)"
        />
      </section>
    </div>
    <!-- 彙總 -->
    <v-card v-if="!isBonus && (entries.length || refunds.length) && showSummary" id="comm-summary" variant="outlined" class="mb-4 summary-card">
      <v-card-title class="text-subtitle-1 bg-grey-lighten-4">
        本次合計（{{ entries.length }} 戶<template v-if="refunds.length">、退佣 {{ refunds.length }} 戶</template>）
      </v-card-title>
      <v-card-text>
        <v-row dense class="mb-3">
          <v-col cols="6" md="3"><div class="sum-item"><label>折數後總價合計</label><div>{{ money(summary.grandAfter) }} 元</div></div></v-col>
          <v-col cols="6" md="3"><div class="sum-item"><label>實際請領金額合計</label><div>{{ money(summary.claimSum) }} 元</div></div></v-col>
          <v-col cols="6" md="3"><div class="sum-item"><label>請佣保留款合計</label><div>{{ money(summary.keepSum) }} 元</div></div></v-col>
          <v-col cols="6" md="3"><div class="sum-item highlight"><label>本次請佣合計</label><div>{{ money(summary.thisClaimSum) }} 元</div></div></v-col>
          <v-col v-if="refunds.length" cols="6" md="3"><div class="sum-item refund"><label>退佣合計（已含於本次請佣合計）</label><div>{{ money(summary.refundSum) }} 元</div></div></v-col>
          <v-col v-if="hasHandover" cols="12" md="6">
            <div class="sum-item handover">
              <label>{{ handoverLabel }}暫留（自個獎提撥，本期不發放、不計入下表）</label>
              <div>{{ money(summary.handoverSum) }} 元</div>
            </div>
          </v-col>
        </v-row>
      </v-card-text>
      <v-divider></v-divider>
    </v-card>

    <div v-if="entries.length || refunds.length" class="submit-bar" aria-label="本次請佣摘要">
      <div>
        <div class="text-caption text-medium-emphasis">{{ isBonus ? '獎金' : '請佣' }} {{ entries.length }} 戶<template v-if="refunds.length">・{{ refundLabel }} {{ refunds.length }} 戶</template></div>
        <span class="text-body-2">{{ isBonus ? '本次獎金實發' : '本次請佣合計' }} </span><strong class="submit-total">{{ money(isBonus ? summary.totals.net : summary.thisClaimSum) }} 元</strong>
      </div>
      <v-btn v-if="totalIssues" variant="text" color="warning" size="small" @click="gotoFirstIssue">{{ totalIssues }} 項待完成</v-btn>
      <span v-else class="text-caption text-medium-emphasis">資料已填妥</span>
      <v-spacer />
      <v-btn v-if="!isBonus" variant="text" @click="toggleSummary">{{ showSummary ? '收合彙總' : '查看請佣金額彙總' }}</v-btn>
      <v-btn color="primary" variant="flat" :loading="submitting" @click="openPreview">{{ isBonus ? '預覽並送出獎金' : '預覽並送出請佣' }}</v-btn>
    </div>

    <!-- 作廢退獎金 -->
    <v-dialog :model-value="!!voidRefundTarget" max-width="420" persistent @update:model-value="v => { if (!v) voidRefundTarget = null; }">
      <v-card v-if="voidRefundTarget">
        <v-card-title class="text-subtitle-1">作廢退獎金：第 {{ voidRefundTarget.period }} 期／{{ voidRefundTarget.unitId }}</v-card-title>
        <v-card-text>
          <v-text-field v-model="voidRefundReason" label="作廢原因" variant="outlined" density="compact" hide-details autofocus />
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="voidRefundTarget = null">取消</v-btn>
          <v-btn color="error" variant="flat" :loading="voidingRefund" :disabled="!voidRefundReason.trim()" @click="doVoidRefund">確認作廢</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- 戶別選擇 dialog -->
    <v-dialog v-model="pickerOpen" max-width="520">
      <v-card>
        <v-tabs v-model="pickerTab" color="primary" density="compact">
          <v-tab value="claim">{{ isBonus ? '獎金' : '請佣' }}</v-tab>
          <v-tab value="refund">{{ refundLabel }}</v-tab>
        </v-tabs>
        <v-divider></v-divider>
        <v-card-title class="text-subtitle-1">
          {{ pickerTab === 'refund' ? (isBonus ? '選擇退獎金戶別（列出有有效獎金紀錄者）' : '選擇退佣戶別（列出有有效請佣紀錄者）') : '選擇戶別（僅列已成交且有簽約日期）' }}
        </v-card-title>
        <v-card-text class="pt-0">
          <v-text-field v-model="pickerSearch" placeholder="搜尋戶別 / 買方…" density="compact" variant="outlined"
            prepend-inner-icon="mdi-magnify" hide-details clearable class="mb-2"></v-text-field>
          <div v-if="pickerTab === 'claim'" class="d-flex align-center flex-wrap ga-1 mb-2">
            <span class="text-caption text-medium-emphasis mr-1">排序</span>
            <v-chip
              v-for="s in PICKER_SORTS"
              :key="s.key"
              size="small"
              :variant="pickerSort.key === s.key ? 'flat' : 'outlined'"
              :color="pickerSort.key === s.key ? 'primary' : undefined"
              @click="setPickerSort(s.key)"
            >
              {{ s.label }}
              <v-icon v-if="pickerSort.key === s.key" end size="x-small">{{ pickerSort.dir === 'asc' ? 'mdi-arrow-up' : 'mdi-arrow-down' }}</v-icon>
            </v-chip>
          </div>
          <div v-if="pickerTab === 'refund'" class="picker-list">
            <v-list density="compact">
              <v-list-item
                v-for="u in filteredRefundUnits"
                :key="u.unitId"
                :disabled="u.disabled"
                @click="!u.disabled && togglePick(u.unitId)"
              >
                <template #prepend>
                  <v-checkbox-btn :model-value="!!pickSel[u.unitId]" :disabled="u.disabled" density="compact" color="error"></v-checkbox-btn>
                </template>
                <v-list-item-title class="d-flex align-center flex-wrap ga-1">
                  {{ u.unitId }}
                  <v-chip size="x-small" variant="tonal" :color="contractTypeColor(u.contractType)">{{ u.contractType }}</v-chip>
                  <v-chip v-if="u.released" size="x-small" color="error" variant="tonal" class="ml-1">{{ u.statusText }}</v-chip>
                  <span v-else class="text-caption ml-1 text-medium-emphasis">{{ u.statusText }}</span>
                </v-list-item-title>
                <v-list-item-subtitle class="text-caption">
                  <span v-if="u.buyerName" class="mr-2">{{ u.buyerName }}</span>
                  <span>{{ isBonus ? '已送獎金' : '已請' }} {{ u.claimedPct }}%・{{ u.count }} 筆紀錄・{{ isBonus ? '可追回' : '可退' }} {{ money(isBonus ? u.bonusNetSum : u.thisClaimSum) }} 元</span>
                </v-list-item-subtitle>
                <template #append>
                  <span v-if="u.isAdded" class="text-caption text-medium-emphasis">已加入</span>
                </template>
              </v-list-item>
            </v-list>
            <div v-if="!filteredRefundUnits.length" class="text-center text-medium-emphasis py-6">沒有可{{ refundLabel }}的戶別</div>
          </div>
          <div v-else class="picker-list">
            <v-list density="compact">
              <v-list-item
                v-for="u in filteredPickerUnits"
                :key="u.unitId"
                :disabled="u.disabled"
                @click="!u.disabled && togglePick(u.unitId)"
              >
                <template #prepend>
                  <v-checkbox-btn :model-value="!!pickSel[u.unitId]" :disabled="u.disabled" density="compact"></v-checkbox-btn>
                </template>
                <v-list-item-title class="d-flex align-center flex-wrap ga-1">
                  {{ u.unitId }}
                  <v-chip size="x-small" variant="tonal" :color="contractTypeColor(u.contractType)">{{ u.contractType }}</v-chip>
                  <v-chip v-if="u.noCommission" size="x-small" color="error" variant="tonal">不可請佣</v-chip>
                  <span v-if="u.claimedPct > 0" class="text-caption ml-1" :class="u.claimedPct >= 100 ? 'text-disabled' : 'text-medium-emphasis'">
                    （{{ isBonus ? '已送獎金' : '已請佣' }} {{ u.claimedPct }}%）
                  </span>
                  <span v-if="u.claimPct !== null && u.claimPct < 100" class="fee-mark" title="請佣比例不足 100%"><v-icon size="16" color="error">mdi-alert-circle</v-icon>請佣 {{ u.claimPct }}%</span>
                </v-list-item-title>
                <v-list-item-subtitle class="text-caption">
                  <span v-if="u.buyerName" class="mr-2">{{ u.buyerName }}</span>
                  <span v-if="u.paymentRatio !== null" class="font-weight-bold" :class="u.paymentRatio >= 10 ? 'text-success' : (u.paymentRatio >= 5 ? 'text-error' : 'text-medium-emphasis')">繳款 {{ u.paymentRatio }}%</span>
                  <span v-else class="text-medium-emphasis">繳款 —</span>
                </v-list-item-subtitle>
                <template #append>
                  <span class="text-caption text-medium-emphasis">{{ u.statusText }}</span>
                </template>
              </v-list-item>
            </v-list>
            <div v-if="!filteredPickerUnits.length" class="text-center text-medium-emphasis py-6">無符合條件的戶別</div>
          </div>
        </v-card-text>
        <v-divider></v-divider>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn variant="text" @click="pickerOpen = false">關閉</v-btn>
          <v-btn :color="pickerTab === 'refund' ? 'error' : 'primary'" variant="flat" :disabled="!pickCount" @click="confirmPick">
            {{ pickerTab === 'refund' ? `加入${refundLabel}` : '加入' }}{{ pickCount ? `（${pickCount}）` : '' }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- 無法送出：阻擋性錯誤 -->
    <v-dialog v-model="blockingOpen" max-width="560" persistent>
      <v-card>
        <v-card-title class="text-subtitle-1 text-error">
          <v-icon start>mdi-close-octagon</v-icon>無法送出，請先修正
        </v-card-title>
        <v-card-text style="max-height: 60vh; overflow: auto">
          <v-alert v-for="(item, j) in blockingItems" :key="j" density="compact" variant="tonal" type="error" class="mb-1">{{ item }}</v-alert>
        </v-card-text>
        <v-divider></v-divider>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn variant="text" @click="blockingOpen = false">返回修改</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- 進預覽前確認：介紹費未填／請佣不足 100% 但獎金 100%（僅提醒，不擋流程） -->
    <v-dialog v-model="confirmOpen" max-width="560" persistent>
      <v-card>
        <v-card-title class="text-subtitle-1 text-error">
          <v-icon start>mdi-alert</v-icon>請確認以下提醒
        </v-card-title>
        <v-card-text style="max-height: 60vh; overflow: auto">
          <div v-for="(sec, i) in confirmSections" :key="i" class="mb-3">
            <div class="font-weight-bold mb-1">{{ sec.title }}</div>
            <div v-if="sec.subtitle" class="text-caption text-medium-emphasis mb-1">{{ sec.subtitle }}</div>
            <v-alert v-for="(item, j) in sec.items" :key="j" density="compact"
              :variant="sec.critical ? 'flat' : 'tonal'" :color="sec.critical ? 'error' : undefined" :type="sec.critical ? undefined : 'warning'"
              :class="['mb-1', { 'critical-alert': sec.critical }]">
              <div class="mb-2">{{ item.text ?? item }}</div>
              <!-- 尚未勾選人員：每個類別列候選人員，點選即加入（均分） -->
              <div v-for="cat in (item.cats || [])" :key="cat.key" class="d-flex flex-wrap align-center ga-1 mb-1">
                <span class="text-caption font-weight-bold mr-1">{{ cat.label }}</span>
                <v-chip
                  v-for="c in categoryCandidates(item.entry, cat)" :key="c.personKey" size="small"
                  :color="isPersonInCategory(item.entry, cat.key, c.personKey) ? 'primary' : (c.hint === '資格不符' ? 'warning' : undefined)"
                  :variant="isPersonInCategory(item.entry, cat.key, c.personKey) ? 'flat' : 'outlined'"
                  @click="togglePersonInCategory(item.entry, cat.key, c)"
                >
                  <v-icon start size="x-small">{{ isPersonInCategory(item.entry, cat.key, c.personKey) ? 'mdi-check-circle' : 'mdi-plus-circle-outline' }}</v-icon>
                  {{ c.name }}<span v-if="c.hint" class="text-caption ml-1 opacity-70">{{ c.hint }}</span>
                </v-chip>
                <span v-if="!categoryCandidates(item.entry, cat).length" class="text-caption text-medium-emphasis">無候選人員，請回卡片用「他案人員」加入</span>
              </div>
              <v-text-field
                v-if="item.field"
                :model-value="item.entry[item.field]" :label="item.label" type="number" min="0"
                :step="item.field === 'ratioPct' ? 0.1 : 1" :suffix="item.field === 'ratioPct' ? '%' : '元'"
                variant="solo" density="compact" hide-details bg-color="white" class="confirm-input"
                @update:model-value="v => setConfirmValue(item, v)"
              >
                <template v-if="item.field === 'ratioPct' && item.suggest > 0" #append-inner>
                  <v-btn size="x-small" variant="text" color="primary" @click.stop="setConfirmValue(item, item.suggest)">同請佣 {{ item.suggest }}%</v-btn>
                </template>
              </v-text-field>
            </v-alert>
          </div>
        </v-card-text>
        <v-divider></v-divider>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn variant="text" @click="confirmOpen = false">返回修改</v-btn>
          <v-btn color="error" variant="flat" @click="confirmPreview">繼續預覽</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- 送出前預覽（與匯出中心同一版面模型） -->
    <v-dialog v-model="previewOpen" fullscreen transition="dialog-bottom-transition" :persistent="submitting">
      <v-card class="preview-dialog">
        <v-toolbar color="primary" density="comfortable">
          <v-btn icon="mdi-close" :disabled="submitting" @click="previewOpen = false"></v-btn>
          <v-toolbar-title class="text-subtitle-1">送出前預覽｜第 {{ previewPeriodsText }} 期</v-toolbar-title>
          <v-spacer></v-spacer>
          <span class="text-body-2 mr-4 d-none d-sm-inline">{{ entries.length }} 戶<template v-if="refunds.length">、{{ refundLabel }} {{ refunds.length }} 戶</template>｜{{ isBonus ? '本次獎金實發' : '本次請佣' }} {{ money(isBonus ? summary.totals.net : summary.thisClaimSum) }} 元</span>
        </v-toolbar>
        <v-card-text class="preview-body">
          <div class="d-flex align-center flex-wrap ga-2 mb-3">
            <v-btn-toggle v-model="previewDocType" mandatory color="primary" variant="outlined" divided density="comfortable">
              <v-btn v-if="!isBonus" value="claim" size="small">請佣總表</v-btn>
              <v-btn v-if="isBonus" value="bonus" size="small">獎金表</v-btn>
            </v-btn-toggle>
            <v-select v-model="previewConfigId" :items="previewConfigOptions" item-title="name" item-value="id"
              label="欄位版型" variant="outlined" density="compact" hide-details :loading="previewConfigsLoading" style="max-width: 280px"></v-select>
          </div>

          <div v-for="(sec, i) in previewWarnings" :key="i" class="mb-3">
            <div class="font-weight-bold mb-1">{{ sec.title }}</div>
            <div v-if="sec.subtitle" class="text-caption text-medium-emphasis mb-1">{{ sec.subtitle }}</div>
            <v-alert v-for="(item, j) in sec.items" :key="j" density="compact"
              :variant="sec.critical ? 'flat' : 'tonal'" :type="sec.critical ? undefined : 'warning'" :color="sec.critical ? 'error' : undefined"
              :class="['mb-1', { 'critical-alert': sec.critical }]">{{ item.text ?? item }}</v-alert>
          </div>

          <CommissionGridPreview :grids="previewGrids" title="送出後匯出的版面" max-height="none" />
        </v-card-text>
        <v-divider></v-divider>
        <v-card-actions class="preview-actions">
          <v-spacer></v-spacer>
          <v-btn variant="text" :disabled="submitting" @click="previewOpen = false">返回修改</v-btn>
          <v-btn color="primary" variant="flat" prepend-icon="mdi-check-bold" :loading="submitting" @click="doSubmit">確認送出</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup>
import { contractTypeColor } from '@/utils/contractTypeColor';
import { computePlanFinance, defaultPriceSource, defaultManualFloor, isNonGeneralContract } from '@/utils/commissionPlans';
import { useCommissionPlan } from '@/composables/useCommissionPlan';
const { plan, planId, belongsToPlan } = useCommissionPlan();
import { ref, reactive, computed, watch, nextTick } from 'vue';
import { useToast } from 'vue-toastification';
import { useUserStore } from '@/store/user';
import PeriodBonusSummary from './PeriodBonusSummary.vue';
import { summarizePeriodBonus, personNoteHistory as buildPersonNoteHistory } from '@/utils/commissionPeriodBonus';
import CommissionUnitCard from './CommissionUnitCard.vue';
import DateFieldTW from './DateFieldTW.vue';
import CommissionRefundCard from './CommissionRefundCard.vue';
import CommissionGridPreview from './CommissionGridPreview.vue';
import { refundableRecordsByUnit, buildRefundEntryPlan } from './refundEntry';
import { submitCommissionEntriesAPI, fetchCommissionExportConfigs, setBonusPeriodNotes, voidCommissionRecordAPI } from '@/api';
import { buildClaimModel, buildBonusModel, defaultClaimConfig, defaultBonusConfig, exportProjectNameOf, makePersonSorter } from '@/utils/commissionExportModel';
import { buildClaimGrid, buildBonusGrids } from '@/services/commissionExcelService';
import { draftClaimRecord, draftRefundRecord, normalizeSalesNames } from '@/utils/commissionDraftRecords';
import {
  calcUnitBonus, computeUnitFinance, resolveCommPct, formatDateTW,
  money, toNum, evenShares, paymentRatioPct, matchesRolePositions, isHandoverCategory, resolveSplitMode, categoryDefaultPersons,
  basisMethodOf, feeTimingOf,
} from '@/utils/commissionCalculation';
import { classifySalesStatus } from '@/utils/salesStatusGroups';
import { bonusSegments, segmentForDate, segmentId, segmentLabel } from '@/utils/bonusSegments';

const props = defineProps({
  mode: { type: String, default: 'claim' },
  claimRecords: { type: Array, default: () => [] },
  allBonusRecords: { type: Array, default: () => [] },
  periodNotes: { type: Array, default: () => [] },
  projectId: { type: String, required: true },
  projectName: { type: String, default: '' },
  settings: { type: Object, required: true },
  households: { type: Array, default: () => [] },
  parkings: { type: Array, default: () => [] },
  personnel: { type: Array, default: () => [] },
  personOrder: { type: Array, default: () => [] },   // 建案層級：獎金表人員欄排序（personKey 清單）
  ledgers: { type: Object, default: () => ({}) },   // unitId -> claimedRatioPct
  nextPeriod: { type: Number, default: 1 },
  records: { type: Array, default: () => [] },        // 全建案請佣紀錄（退佣來源）
  bonusRecords: { type: Array, default: () => [] },   // 全建案獎金明細（退佣追回原數）
});

const showSummary = ref(false);
const emit = defineEmits(['submitted', 'notes-saved']);
const isBonus = computed(() => props.mode === 'bonus');
const refundLabel = computed(() => (isBonus.value ? '退獎金' : '退佣'));
const toast = useToast();
const userStore = useUserStore();

const entries = ref([]);
const refunds = ref([]);
const personProfiles = reactive({});
let seq = 0;

const pickerOpen = ref(false);
const pickerTab = ref('claim');
const pickerSearch = ref('');
const pickSel = reactive({});
const submitting = ref(false);
const blockingOpen = ref(false);
const confirmOpen = ref(false);        // 進預覽前的紅底提醒確認（介紹費未填／請佣不足但獎金 100%）
const confirmSections = ref([]);
const blockingItems = ref([]);

// 送出前預覽
const previewOpen = ref(false);
const previewDocType = ref(props.mode);
const previewWarnings = ref([]);
const previewConfigs = ref([]);
const previewConfigsLoaded = ref(false);
const previewConfigsLoading = ref(false);
const previewConfigId = ref('__default');

const enabledCategories = computed(() =>
  (isBonus.value ? (props.settings.bonusCategories || []) : [])
    .filter(c => c.enabled !== false)
    .slice()
    .sort((a, b) => (a.order || 0) - (b.order || 0))
);
const handoverCategories = computed(() => enabledCategories.value.filter(isHandoverCategory));
const hasHandover = computed(() => handoverCategories.value.length > 0);
const handoverLabel = computed(() => handoverCategories.value.map(c => c.label).join('／') || '交屋團獎');

// ---------- 數字欄位：禁用鍵盤上下鍵與滾輪調整（只能直接輸入） ----------
function isNumberInput(el) {
  return !!el && String(el.tagName).toLowerCase() === 'input' && el.type === 'number';
}
function blockNumberSpin(e) {
  if ((e.key === 'ArrowUp' || e.key === 'ArrowDown') && isNumberInput(e.target)) e.preventDefault();
}
function blockNumberWheel(e) {
  if (isNumberInput(e.target) && document.activeElement === e.target) e.preventDefault();
}

// ---------- 已請比例（ledger + 本場已送出即時更新由父層 refresh） ----------
function claimedPctOf(unitId) {
  return Math.round(toNum(props.ledgers[unitId]) * 10) / 10;
}
/** 該戶「請佣」已請比例合計（未作廢、未退佣的請佣紀錄）；獎金編輯用來提醒請佣不足 100% */
function unitClaimedPct(unitId) {
  const sum = props.claimRecords
    .filter(r => r.unitId === unitId && r.status === 'active' && r.type !== 'refund' && !r.refundedBy)
    .reduce((s, r) => s + toNum(r.ratioPct), 0);
  return Math.round(sum * 100) / 100;
}
/** 同一戶在本批退佣／退獎金卡片要退回的比例合計（送出時先回溯，該戶可再請） */
function pendingRefundPct(unitId) {
  return refunds.value.filter(e => e.unitId === unitId).reduce((s, e) => s + toNum(refundPlan(e).refundRatioPct), 0);
}
/** 扣掉本批退佣後的已請比例 */
function effectiveClaimedPct(unitId) {
  return Math.max(0, Math.round((claimedPctOf(unitId) - pendingRefundPct(unitId)) * 10) / 10);
}
/**
 * 卡片實際適用的已請比例：先扣掉同一戶本批退佣與所有拉回編輯原紀錄的比例（送出時回溯／作廢），
 * 再加上同一戶其他卡片的本次比例（同批送出同戶多筆時，與後端 ledger 驗證一致）。
 */
function entryClaimedPct(e) {
  const siblings = entries.value.filter(x => x.unitId === e.unitId);
  const replaced = siblings.reduce((s, x) => s + toNum(x.replaceRatioPct), 0);
  const others = siblings.filter(x => x !== e).reduce((s, x) => s + toNum(x.ratioPct), 0);
  return Math.max(0, Math.round((effectiveClaimedPct(e.unitId) - replaced + others) * 10) / 10);
}

// ---------- 戶別選擇 ----------
const eligibleUnits = computed(() =>
  props.households.filter(u =>
    classifySalesStatus(u.salesStatus_backend) === 'deal' && u.payment_contract_date
    && (plan.value.priceBasis !== 'package' || (isNonGeneralContract(u) && Number(u.price_package_deal) > 0 && computeUnitFinance(u, props.parkings).dealTotal > Number(u.price_package_deal)))
  )
);

const pickerUnits = computed(() => {
  const added = new Set(entries.value.map(e => e.unitId));
  return eligibleUnits.value.map(u => {
    const refundPct = pendingRefundPct(u.unitId);          // 本批退佣／退獎金：送出時先回溯，已請畢者可再選
    const claimed = effectiveClaimedPct(u.unitId);
    const full = claimed >= 100;
    const isAdded = added.has(u.unitId);
    const noCommission = u.noCommission === true; // 銷控「銷售資訊」勾選「不可請佣」：請佣與獎金皆不可加入
    const remain = Math.round((100 - claimed) * 10) / 10;
    return {
      unitId: u.unitId,
      contractType: String(u.contractType || '').trim() || '未設定合約方式',
      buyerName: u.buyerName || '',
      claimedPct: claimed,
      refundPct,
      noCommission,
      paymentRatio: paymentRatioPct(u, computeUnitFinance(u, props.parkings).dealTotal),
      claimPct: isBonus.value ? unitClaimedPct(u.unitId) : null,   // 獎金編輯：該戶請佣已請合計，不足 100% 提醒
      disabled: full || isAdded || noCommission,
      statusText: isAdded ? '已加入' : (noCommission ? '不可請佣'
        : (refundPct > 0 ? `本批${refundLabel.value} ${refundPct}%・可再${isBonus.value ? '送' : '請'} ${remain}%`
          : (full ? '已請畢' : (claimed > 0 ? `尚餘 ${remain}%` : '')))),
      _raw: u,
    };
  });
});

const PICKER_SORTS = [
  { key: 'unitId', label: '戶別' },
  { key: 'paymentRatio', label: '繳款比例' },
  { key: 'claimedPct', label: '已請比例' },
];
const pickerSort = ref({ key: 'paymentRatio', dir: 'desc' });   // 預設：繳款比例高→低
function setPickerSort(key) {
  if (pickerSort.value.key === key) {
    pickerSort.value = { key, dir: pickerSort.value.dir === 'asc' ? 'desc' : 'asc' };
  } else {
    pickerSort.value = { key, dir: key === 'unitId' ? 'asc' : 'desc' };
  }
}
function compareUnitId(a, b) {
  return String(a.unitId).localeCompare(String(b.unitId), 'zh-Hant', { numeric: true });
}
function comparePickerUnits(a, b) {
  // 不可選（已加入／已請畢／不可請佣）一律排在可選項目之後
  if (!!a.disabled !== !!b.disabled) return a.disabled ? 1 : -1;
  const { key, dir } = pickerSort.value;
  const sign = dir === 'asc' ? 1 : -1;
  if (key === 'unitId') return sign * compareUnitId(a, b);
  const av = a[key], bv = b[key];
  // 無法計算（null）者一律排在最後
  if (av === null && bv === null) return compareUnitId(a, b);
  if (av === null) return 1;
  if (bv === null) return -1;
  if (av !== bv) return sign * (av - bv);
  return compareUnitId(a, b);
}

const filteredPickerUnits = computed(() => {
  const f = String(pickerSearch.value || '').trim().toLowerCase();
  const list = f
    ? pickerUnits.value.filter(u =>
        String(u.unitId).toLowerCase().includes(f) || String(u._raw.buyerName || '').toLowerCase().includes(f)
      )
    : pickerUnits.value.slice();
  return list.sort(comparePickerUnits);
});

// ---------- 退佣戶別（有有效請佣紀錄者；解約／退戶排前） ----------
const refundableByUnit = computed(() => refundableRecordsByUnit(props.records, isBonus.value));
/** 某筆紀錄的有效獎金明細實發合計（退獎金可追回金額） */
function bonusNetOf(recordId) {
  return props.bonusRecords.filter(b => b.commissionRecordId === recordId && b.status !== 'voided').reduce((s, b) => s + toNum(b.net), 0);
}

const refundUnits = computed(() => {
  const added = new Set(refunds.value.map(e => e.unitId));
  return Object.keys(refundableByUnit.value).map(unitId => {
    const recs = refundableByUnit.value[unitId];
    const unit = props.households.find(u => u.unitId === unitId) || null;
    const statusText = unit?.salesStatus_backend || '';
    const released = classifySalesStatus(statusText) === 'released';
    const isAdded = added.has(unitId);
    return {
      unitId,
      contractType: String(unit?.contractType || recs[recs.length - 1]?.snapshot?.contractType || '').trim() || '未設定合約方式',
      buyerName: unit?.buyerName || recs[recs.length - 1]?.snapshot?.buyerName || '',
      statusText: statusText || '—',
      released,
      claimedPct: claimedPctOf(unitId),
      count: recs.length,
      thisClaimSum: recs.reduce((s, r) => s + toNum(r.calc?.thisClaim), 0),
      bonusNetSum: recs.reduce((s, r) => s + bonusNetOf(r.id), 0),
      isAdded,
      disabled: isAdded,
    };
  }).sort((a, b) => (Number(b.released) - Number(a.released))
    || String(a.unitId).localeCompare(String(b.unitId), 'zh-Hant', { numeric: true }));
});

const filteredRefundUnits = computed(() => {
  const f = String(pickerSearch.value || '').trim().toLowerCase();
  if (!f) return refundUnits.value;
  return refundUnits.value.filter(u =>
    String(u.unitId).toLowerCase().includes(f) || String(u.buyerName || '').toLowerCase().includes(f)
  );
});

const pickCount = computed(() => Object.keys(pickSel).filter(k => pickSel[k]).length);

function openPicker() {
  Object.keys(pickSel).forEach(k => delete pickSel[k]);
  pickerSearch.value = '';
  pickerOpen.value = true;
}
watch(pickerTab, () => { Object.keys(pickSel).forEach(k => delete pickSel[k]); });

function togglePick(unitId) {
  if (pickSel[unitId]) delete pickSel[unitId];
  else pickSel[unitId] = true;
}

function confirmPick() {
  if (pickerTab.value === 'refund') {
    const before = refunds.value.length;
    Object.keys(pickSel).forEach(unitId => {
      if (pickSel[unitId] && !refunds.value.some(e => e.unitId === unitId)) addRefund(unitId);
    });
    if (refunds.value.length > before) selectCard(refunds.value[before].id);   // 選取本次新增的第一筆
  } else {
    const before = entries.value.length;
    Object.keys(pickSel).forEach(unitId => {
      if (pickSel[unitId] && !entries.value.some(e => e.unitId === unitId)) addUnit(unitId);
    });
    // 只加入一戶時直接展開
    if (entries.value.length > before) selectCard(entries.value[before].id);   // 選取本次新增的第一筆
  }
  Object.keys(pickSel).forEach(k => delete pickSel[k]);
  pickerOpen.value = false;
}

// ---------- 建立退佣卡片 ----------
function addRefund(unitId) {
  const candidates = (refundableByUnit.value[unitId] || []).slice();
  if (!candidates.length) return;
  refunds.value.push({
    id: `r${seq++}`,
    kind: 'refund',
    unitId,
    unit: props.households.find(u => u.unitId === unitId) || null,
    period: isBonus.value ? (Number(summaryPeriod.value) || props.nextPeriod) : claimPeriod.value,
    requestDate: isBonus.value ? bonusDate.value : claimDate.value,
    reason: '買方解約',
    note: '',
    refundRatioPct: null,   // 本次退回比例（null＝已勾選來源比例合計，即全額退回）
    includeKeep: false,
    refundBonus: isBonus.value,   // 退獎金：只追回獎金明細；請佣的退佣不追回獎金（各自獨立）
    candidates,
    selectedIds: candidates.map(r => r.id),
    people: null,           // 逐人調整（null＝原數反向）
    collapsed: true,
  });
  selectedId.value = refunds.value[refunds.value.length - 1].id;
}

function removeRefund(e) {
  const next = selectNeighborAfterRemove(e.id);
  refunds.value = refunds.value.filter(x => x !== e);
  if (next) selectedId.value = next;
}

function refundPlan(e) {
  return buildRefundEntryPlan(e, props.bonusRecords);
}

function refundIssueCount(e) {
  return (e.selectedIds.length ? 0 : 1) + (toNum(e.period) > 0 ? 0 : 1) + (e.selectedIds.length ? refundPlan(e).errors.length : 0);
}

// ---------- 建立戶別卡片 ----------
function personKeyOf(p) { return p.phone || `ext:${p.name}`; }

/** profile 鍵：一人多段進退場時以「電話@進場日」區分，同段的戶共用一組費率；單段沿用電話 */
function profileKeyFor(personKey, contractDate) {
  const p = props.personnel.find(x => personKeyOf(x) === personKey);
  const segs = bonusSegments(p?.bonusConfig);
  if (segs.length <= 1) return personKey;
  return `${personKey}@${segmentId(segmentForDate(segs, contractDate).segment)}`;
}

function ensureProfile(personKey, name, contractDate, rates = null) {
  const key = profileKeyFor(personKey, contractDate);
  if (personProfiles[key]) return;
  const p = props.personnel.find(x => personKeyOf(x) === personKey || x.name === name);
  const segs = bonusSegments(p?.bonusConfig);
  const seg = segmentForDate(segs, contractDate).segment || {};
  personProfiles[key] = {
    name: p?.name || name,
    role: (p?.positions || []).join('、'),
    keepPct: toNum(seg.keepPct),
    taxPct: toNum(seg.taxPct),
    nhiPct: toNum(seg.nhiPct),
    remark: '',
    segmentLabel: segs.length > 1 ? segmentLabel(seg) : '',
    sourceProjectId: props.projectId,
    sourceProjectName: props.projectName,
  };
  // 獎金類別「預設人員」的扣款比例覆寫（設定頁有填者優先）
  if (rates) ['keepPct', 'taxPct', 'nhiPct'].forEach(k => { if (rates[k] !== undefined) personProfiles[key][k] = toNum(rates[k]); });
}

/** 本戶參與人員的 profile（personKey → 依簽約日解析的段落費率） */
function entryProfiles(e) {
  const map = {};
  const contractDate = e.unit?.payment_contract_date;
  Object.values(e.categories).forEach(c => c.allocations.forEach(a => {
    const prof = personProfiles[profileKeyFor(a.personKey, contractDate)] || personProfiles[a.personKey];
    if (prof) map[a.personKey] = prof;
  }));
  return map;
}

function evenAlloc(persons) {
  const allocations = persons.map(p => ({
    personKey: p.personKey,
    name: p.name,
    sourceProjectId: props.projectId,
    sourceProjectName: props.projectName,
    isExternal: !!p.isExternal,
    mode: 'pct',
    sharePct: 0,
    lockedAmount: null,
  }));
  const shares = evenShares(allocations.length);
  allocations.forEach((a, i) => { a.sharePct = shares[i]; });
  return allocations;
}

/**
 * 加入戶別卡片。
 * @param {string} unitId
 * @param {object|null} fromRecord - 拉回編輯：以既有請佣紀錄預帶所有設定與人員分配，送出時取代該紀錄
 * @param {Array} bonusRows - 該紀錄的獎金明細（帶回每人扣款比例／備註）
 */
function addUnit(unitId, fromRecord = null, bonusRows = []) {
  const unit = props.households.find(u => u.unitId === unitId);
  if (!unit) return false;
  if (unit.noCommission === true && !fromRecord) return false; // 銷控標記「不可請佣」者不可加入（請佣與獎金皆同）
  // 沿用先前紀錄的價格來源／房屋底價時，排除已退佣與「本批正在退佣」的紀錄：
  // 退戶後重新請佣（新買方／新價格）一律以銷控目前資料為準，不沿用退戶前的歷史紀錄
  const refundingIds = new Set(refunds.value.flatMap(e => e.selectedIds || []));
  const previous = props.records.filter(r => r.unitId === unitId && r.status === 'active' && r.type !== 'refund' && !r.refundedBy && !refundingIds.has(r.id))
    .slice().sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0) || Number(b.period) - Number(a.period))
    .find(r => r.snapshot?.priceSource);
  const priceSource = previous?.snapshot?.priceSource || defaultPriceSource(unit, plan.value);
  const manualFloor = previous?.snapshot?.manualFloor ?? defaultManualFloor(unit, computeUnitFinance(unit, props.parkings).parkFloor, priceSource);
  const claimed = effectiveClaimedPct(unitId);   // 扣掉本批退佣後的已請比例

  // 團獎案場：拉回編輯沿用原紀錄；新增戶別預設勾選目前所在建案（需在建案設定的團獎分組中）
  const teamSiteKeys = Array.isArray(fromRecord?.teamSiteKeys)
    ? [...fromRecord.teamSiteKeys]
    : ((props.settings.teamGroups || []).some(g => g.key === props.projectId) ? [props.projectId] : []);

  const categories = {};
  enabledCategories.value.forEach(cat => {
    let allocations = [];
    const defaultPersons = categoryDefaultPersons(cat, props.personnel);
    if (defaultPersons.length) {
      // 設定頁指定「預設人員」：不看對應職務／團獎分組，直接帶入這些人並均分
      defaultPersons.forEach(dp => ensureProfile(dp.personKey, dp.name, unit.payment_contract_date, dp.rates));
      allocations = evenAlloc(defaultPersons);
    } else if (cat.mode === 'individual') {
      const names = normalizeSalesNames(unit.salesperson);
      const persons = names.map(nm => {
        const p = props.personnel.find(x => x.name === nm);
        const personKey = p ? personKeyOf(p) : `ext:${nm}`;
        ensureProfile(personKey, nm, unit.payment_contract_date);
        return { personKey, name: nm, isExternal: !p };
      });
      allocations = evenAlloc(persons);
    } else if (cat.mode === 'role') {
      const pool = props.personnel.filter(p => matchesRolePositions(p.positions, cat.rolePositions));
      if (pool.length === 1) {
        const personKey = personKeyOf(pool[0]);
        ensureProfile(personKey, pool[0].name, unit.payment_contract_date);
        allocations = evenAlloc([{ personKey, name: pool[0].name }]);
      }
    } else if (cat.mode === 'team' && teamSiteKeys.length) {
      // 團隊類別：依預設勾選的團獎案場 + 簽約日進退場資格帶入人員（與卡片切換案場的邏輯相同）
      const persons = props.personnel.filter(p => {
        const { segment: seg, matched } = segmentForDate(bonusSegments(p?.bonusConfig), unit.payment_contract_date);
        const groups = Array.isArray(seg?.teamGroupKeys) ? seg.teamGroupKeys : [];
        const inSite = groups.some(g => teamSiteKeys.includes(g));
        const roleOk = (cat.rolePositions || []).length ? matchesRolePositions(p.positions, cat.rolePositions) : true;
        return inSite && matched && roleOk;
      }).map(p => {
        const personKey = personKeyOf(p);
        ensureProfile(personKey, p.name, unit.payment_contract_date);
        return { personKey, name: p.name };
      });
      allocations = evenAlloc(persons);
    }
    categories[cat.key] = {
      key: cat.key,
      label: cat.label,
      mode: cat.mode,
      ratePct: toNum(cat.ratePct),
      sourceCatKey: cat.sourceCatKey || '',   // 提撥類別的來源類別（其他類別為空）
      enabled: true,                          // 提撥類別：本戶是否提撥（工作台可關閉）
      splitMode: resolveSplitMode(props.settings, cat),   // 均分尾差處理（建案設定；隨紀錄快照）
      allocMode: cat.allocMode === 'each' ? 'each' : 'even',   // 分配方式：均分／單獨（設定頁預設；卡片可改自訂）
      allocations,                            // 提撥類別不分配人員，恆為空
    };
  });

  // 拉回編輯：以原紀錄覆蓋類別分配與每人扣款比例
  if (fromRecord) {
    Object.keys(categories).forEach(key => {
      const rc = fromRecord.categories?.[key];
      if (!rc) return;
      categories[key].allocations = JSON.parse(JSON.stringify(rc.allocations || []));
      categories[key].ratePct = toNum(rc.ratePct);
      if (rc.enabled !== undefined) categories[key].enabled = rc.enabled !== false;
      if (rc.splitMode) categories[key].splitMode = rc.splitMode;
      if (rc.allocMode) categories[key].allocMode = rc.allocMode;
      if (rc.sourceCatKey) categories[key].sourceCatKey = rc.sourceCatKey;
    });
    (bonusRows || []).filter(b => b.commissionRecordId === fromRecord.id).forEach(b => {
      personProfiles[profileKeyFor(b.personKey, unit.payment_contract_date)] = {
        name: b.name, role: b.role || '',
        keepPct: toNum(b.keepPct), taxPct: toNum(b.taxPct), nhiPct: toNum(b.nhiPct),
        remark: '', segmentLabel: '',
        sourceProjectId: b.sourceProjectId || props.projectId,
        sourceProjectName: b.sourceProjectName || '',
      };
    });
  }
  // 獎金基準（佣金比例／介紹費／保留款）取該戶最近一筆「未退佣」的請佣紀錄；已退佣者不再沿用
  const basis = fromRecord || (isBonus.value ? props.claimRecords.filter(r => r.unitId === unitId && r.status === 'active' && r.type !== 'refund' && !r.refundedBy).slice().sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0) || toNum(b.period) - toNum(a.period))[0] : null);
  const snap = (fromRecord || basis)?.snapshot || {};

  entries.value.push({
    id: `e${seq++}`,
    unitId,
    unit,
    priceSource: fromRecord ? (snap.priceSource || priceSource) : priceSource,
    manualFloor: fromRecord ? (snap.manualFloor ?? manualFloor) : manualFloor,
    note: fromRecord ? String(fromRecord.note || '') : (isNonGeneralContract(unit) ? String(unit.contractType).trim() : ''),   // 請佣備註：非一般合約先帶合約方式
    get finance() { return computePlanFinance(unit, props.parkings, plan.value, this); },
    period: isBonus.value ? (Number(summaryPeriod.value) || props.nextPeriod) : claimPeriod.value,
    requestDate: isBonus.value ? bonusDate.value : claimDate.value,
    ratioPct: fromRecord ? toNum(fromRecord.ratioPct) : Math.max(0, Math.round((100 - claimed) * 10) / 10),
    commPct: basis?.commPct != null ? toNum(basis.commPct) : resolveCommPct(props.settings, !!unit.isPreferredPayment),
    keepPct: basis?.keepPct != null ? toNum(basis.keepPct) : toNum(props.settings.defaultKeepPct),
    partyAFee: toNum(basis?.partyAFee),
    partyBFee: toNum(basis?.partyBFee),
    // 基準法：請佣基準／介紹費 B 時機隨請佣紀錄（獎金模式唯讀）；獎金基準可於獎金編輯依當期改選；無紀錄採方案設定預設
    claimBasisMethod: basisMethodOf(basis?.claimBasisMethod) || basisMethodOf(props.settings.claimBasisMethod) || 'lower',
    partyBFeeTiming: feeTimingOf(basis?.partyBFeeTiming) || feeTimingOf(props.settings.partyBFeeTiming) || 'before',
    bonusBasisMethod: basisMethodOf(fromRecord?.bonusBasisMethod) || basisMethodOf(basis?.bonusBasisMethod) || basisMethodOf(props.settings.bonusBasisMethod) || 'deal',
    teamSiteKeys,
    categories,
    collapsed: !fromRecord,
    replaceRecordId: fromRecord?.id || null,
    replaceLegacyBonus: isBonus.value && !!fromRecord && fromRecord.submissionType !== 'bonus',        // 拉回編輯：送出時取代此原紀錄
    replaceRatioPct: fromRecord ? toNum(fromRecord.ratioPct) : 0,   // 原紀錄比例（已請比例顯示時先扣除）
  });
  selectedId.value = entries.value[entries.value.length - 1].id;
  return true;
}

/**
 * 拉回編輯：把已送出的請佣紀錄載回工作台（每筆一張卡片，預帶原設定），送出時取代原紀錄。
 * 同一戶同期有多筆紀錄時每筆各一張卡片；已載回的同一筆、找不到戶別資料者略過並提示。
 */
function loadFromRecords(records, bonusRows = []) {
  const skipped = [];
  let added = 0;
  if (!entries.value.length) {
    const first = (records || []).find(r => r && r.status === 'active' && r.type !== 'refund');
    if (first) {
      if (isBonus.value) {
        if (toNum(first.period) > 0) summaryPeriod.value = toNum(first.period);
        if (first.requestDate) bonusDate.value = first.requestDate;
      } else {
        if (toNum(first.period) > 0) claimPeriod.value = toNum(first.period);
        if (first.requestDate) claimDate.value = first.requestDate;
      }
    }
  }
  (records || []).forEach(r => {
    if (!r || r.status !== 'active' || r.type === 'refund' || (isBonus.value ? r.bonusRefundedBy : r.refundedBy)) { skipped.push(`${r?.unitId || '?'}（不可拉回）`); return; }
    if (entries.value.some(e => e.replaceRecordId === r.id)) { skipped.push(`${r.unitId}（已在工作台）`); return; }
    if (!props.households.find(u => u.unitId === r.unitId)) { skipped.push(`${r.unitId}（找不到戶別資料）`); return; }
    if (addUnit(r.unitId, r, bonusRows)) added++;
  });
  if (added) toast.info(`已拉回 ${added} 筆，修改後送出會取代原紀錄`);
  if (skipped.length) toast.warning(`略過：${skipped.join('、')}`);
  return added;
}

/** 移除後選取相鄰的一筆 */
function selectNeighborAfterRemove(id) {
  const rows = visibleListRows.value;
  const idx = rows.findIndex(r => r.id === id);
  const next = rows[idx + 1] || rows[idx - 1] || null;
  return next ? next.id : null;
}
function removeEntry(e) {
  const next = selectNeighborAfterRemove(e.id);
  entries.value = entries.value.filter(x => x !== e);
  if (next) selectedId.value = next;
}

// ---------- 左右分欄：目前選取的戶別 ----------
const selectedId = ref(null);
const listFilter = ref('all');
const selectedEntry = computed(() => entries.value.find(e => e.id === selectedId.value) || null);
const selectedRefund = computed(() => refunds.value.find(e => e.id === selectedId.value) || null);
/** 左側清單列（請佣卡片在前、退佣卡片在後） */
const listRows = computed(() => {
  const fmt = v => formatDateTW(v) || '';
  const rows = entries.value.map(e => {
    const r = entryResult(e);
    const issues = entryIssueCount(e);
    const over = entryClaimedPct(e) + toNum(e.ratioPct) > 100.0001;
    return {
      id: e.id, refund: false, unitId: e.unitId, buyer: e.unit?.buyerName || '',
      contractType: String(e.unit?.contractType || '').trim(),
      sales: normalizeSalesNames(e.unit?.salesperson).join('、'),
      deposit: fmt(e.unit?.payment_deposit_date), contract: fmt(e.unit?.payment_contract_date),
      amount: isBonus.value ? r.people.reduce((s, p) => s + p.net, 0) : r.claim.thisClaim,
      amountLabel: isBonus.value ? '獎金實發' : '本次請佣',
      commPct: toNum(e.commPct), ratioPct: toNum(e.ratioPct), ratioLabel: isBonus.value ? '獎金' : '請佣',
      paymentRatio: paymentRatioPct(e.unit, e.finance?.transactionTotal),
      // 獎金編輯：銷控備註提到介紹費／贈品 → 清單卡片紅色驚嘆號提醒（介紹費會影響獎金折數）
      feeHint: isBonus.value && /介紹|贈品/.test(String(e.unit?.remarks || '')),
      // 請佣比例不足 100% → 紅字提醒。獎金編輯的 ratioPct 是獎金比例，改看該戶請佣紀錄的已請合計
      claimPct: isBonus.value ? unitClaimedPct(e.unitId) : toNum(e.ratioPct),
      partialRatio: isBonus.value ? unitClaimedPct(e.unitId) < 100 : (toNum(e.ratioPct) > 0 && toNum(e.ratioPct) < 100),
      note: String(e.note || ''), issues, issueClass: over ? 'err' : issues ? 'warn' : '',
    };
  });
  refunds.value.forEach(e => {
    const pl = refundPlan(e);
    const issues = refundIssueCount(e);
    rows.push({
      id: e.id, refund: true, unitId: e.unitId, buyer: e.unit?.buyerName || '',
      contractType: String(e.unit?.contractType || '').trim(),
      sales: normalizeSalesNames(e.unit?.salesperson).join('、'),
      deposit: fmt(e.unit?.payment_deposit_date), contract: fmt(e.unit?.payment_contract_date),
      amount: isBonus.value ? pl.people.reduce((s, p) => s + p.net, 0) : pl.calc.thisClaim,
      amountLabel: isBonus.value ? '追回獎金' : '退回',
      commPct: 0, ratioPct: toNum(pl.refundRatioPct), ratioLabel: '退回',
      note: String(e.note || ''), issues, issueClass: issues ? 'warn' : '',
    });
  });
  return rows;
});
const visibleListRows = computed(() => (listFilter.value === 'issue' ? listRows.value.filter(r => r.issues > 0) : listRows.value));
const selectedIndex = computed(() => visibleListRows.value.findIndex(r => r.id === selectedId.value));
// 選取失效（被移除／尚未選）時退回第一筆
watch(listRows, rows => {
  if (!rows.some(r => r.id === selectedId.value)) selectedId.value = rows[0]?.id ?? null;
}, { immediate: true });
function selectCard(id) {
  selectedId.value = id;
  focusEditor();
}
function selectOffset(delta) {
  const rows = visibleListRows.value;
  if (!rows.length) return;
  const idx = selectedIndex.value < 0 ? 0 : Math.max(0, Math.min(rows.length - 1, selectedIndex.value + delta));
  selectCard(rows[idx].id);
}
/** 手機（單欄）時把編輯區捲到最上方；桌機清單固定在左側，只需確保編輯區頂端可見 */
async function focusEditor() {
  await nextTick();
  requestAnimationFrame(() => {
    const el = document.querySelector('.unit-editor');
    if (!el) return;
    const top = el.getBoundingClientRect().top;
    if (top < 0 || window.innerWidth <= 960) el.scrollIntoView({ behavior: 'auto', block: 'start' });
  });
}


async function toggleSummary() {
  showSummary.value = !showSummary.value;
  if (showSummary.value) {
    await nextTick();
    document.getElementById('comm-summary')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}
function toggleCard(e) { selectCard(e.id); }
function gotoFirstIssue() {
  const entry = entries.value.find(e => entryIssueCount(e)) || refunds.value.find(e => refundIssueCount(e));
  if (entry) gotoCard(entry);
}
function gotoCard(e) {
  if (listFilter.value === 'issue' && !(entryIssueCount(e) || refundIssueCount(e))) listFilter.value = 'all';
  selectCard(e.id);
}

// ---------- 計算 ----------
function entryInput(e) {
  return {
    ratioPct: toNum(e.ratioPct),
    commPct: toNum(e.commPct),
    keepPct: toNum(e.keepPct),
    partyAFee: toNum(e.partyAFee),
    partyBFee: toNum(e.partyBFee),
    claimBasisMethod: e.claimBasisMethod,
    bonusBasisMethod: e.bonusBasisMethod,
    partyBFeeTiming: e.partyBFeeTiming,
    categories: isBonus.value ? e.categories : {},
  };
}

function entryResult(e) {
  return calcUnitBonus(e.finance, entryInput(e), entryProfiles(e));
}

/** 該戶待處理項目數（與卡片標頭一致）：未選人類別 + 分配錯誤 + 比例問題 */
function entryIssueCount(e) {
  const r = entryResult(e);
  const claimed = entryClaimedPct(e);
  const missing = enabledCategories.value.filter(cat => {
    if (isHandoverCategory(cat)) return false;
    const c = e.categories[cat.key];
    return c && toNum(c.ratePct) > 0 && c.allocations.length === 0;
  }).length;
  const ratioBad = (claimed + toNum(e.ratioPct) > 100.0001) || !(toNum(e.ratioPct) > 0);
  return missing + r.errors.length + e.finance.errors.length + (ratioBad ? 1 : 0);
}
const totalIssues = computed(() =>
  entries.value.reduce((s, e) => s + entryIssueCount(e), 0) + refunds.value.reduce((s, e) => s + refundIssueCount(e), 0)
);

const summary = computed(() => {
  let grandAfter = 0, claimSum = 0, keepSum = 0, thisClaimSum = 0, handoverSum = 0, refundSum = 0;
  const byPerson = {};
  const order = [];
  const addPerson = p => {
    if (!byPerson[p.personKey]) {
      byPerson[p.personKey] = {
        personKey: p.personKey, name: p.name,
        sourceProjectId: p.sourceProjectId, sourceProjectName: p.sourceProjectName,
        subtotal: 0, keep: 0, tax: 0, nhi: 0, net: 0,
      };
      order.push(p.personKey);
    }
    const b = byPerson[p.personKey];
    b.subtotal += p.subtotal; b.keep += p.keep; b.tax += p.tax; b.nhi += p.nhi; b.net += p.net;
  };
  entries.value.forEach(e => {
    const r = entryResult(e);
    grandAfter += r.claim.dealAfter * 10000;
    claimSum += r.claim.realClaim;
    keepSum += r.claim.claimKeep;
    thisClaimSum += r.claim.thisClaim;
    handoverSum += toNum(r.handoverTotal);
    r.people.forEach(addPerson);
  });
  // 退佣：金額為負值，直接併入合計
  refunds.value.forEach(e => {
    const pl = refundPlan(e);
    grandAfter += pl.calc.dealAfter * 10000;
    claimSum += pl.calc.realClaim;
    keepSum += pl.calc.claimKeep;
    thisClaimSum += pl.calc.thisClaim;
    refundSum += pl.calc.thisClaim;
    handoverSum += toNum(pl.handover.total);
    pl.people.forEach(addPerson);
  });
  const people = order.map(k => byPerson[k]);
  const totals = people.reduce((t, p) => ({
    subtotal: t.subtotal + p.subtotal, keep: t.keep + p.keep,
    tax: t.tax + p.tax, nhi: t.nhi + p.nhi, net: t.net + p.net,
  }), { subtotal: 0, keep: 0, tax: 0, nhi: 0, net: 0 });
  return { grandAfter, claimSum, keepSum, thisClaimSum, handoverSum, refundSum, people, totals };
});

// ---------- 送出 ----------
function collectIssues() {
  const blocking = [];
  const warnings = [];
  const feeMiss = [];
  const ratioMismatch = [];   // 獎金編輯：請佣不足 100% 但本次獎金比例 100%

  entries.value.forEach(e => {
    if (!Number.isInteger(Number(e.period)) || Number(e.period) < 1) blocking.push(`${e.unitId}：期別須為正整數`);
    e.finance.errors.forEach(message => blocking.push(`${e.unitId}：${message}`));
    const claimed = entryClaimedPct(e);
    if (claimed + toNum(e.ratioPct) > 100.0001) {
      blocking.push(`${e.unitId}：已請 ${claimed}% ＋ 本次 ${e.ratioPct}% 超過 100%`);
    }
    if (!(toNum(e.ratioPct) > 0)) {
      blocking.push(`${e.unitId}：本次請佣比例須大於 0`);
    }
    const r = entryResult(e);
    r.errors.forEach(err => {
      const label = e.categories[err.catKey]?.label || err.catKey;
      blocking.push(`${e.unitId}／${label}：${err.error}`);
    });

    // 提醒：類別無人勾選（僅提醒有候選人的類別）
    const missCats = [];
    enabledCategories.value.forEach(cat => {
      if (isHandoverCategory(cat)) return;   // 提撥類別不勾人
      const c = e.categories[cat.key];
      if (c && c.allocations.length === 0 && toNum(c.ratePct) > 0) missCats.push(cat.label);
    });
    if (missCats.length) {
      // 帶 entry 與類別，確認對話框可直接點選人員加入
      const cats = enabledCategories.value.filter(cat => missCats.includes(cat.label));
      warnings.push({ text: `${e.unitId}：${missCats.join('、')} 尚未勾選人員`, entry: e, cats });
    }
    if (props.settings.teamGroups.length && e.teamSiteKeys.length === 0) {
      const hasTeamCat = enabledCategories.value.some(c => c.mode === 'team');
      if (hasTeamCat) warnings.push(`${e.unitId}：未勾選團獎案場`);
    }

    const note = String(e.unit.remarks || '');
    // 以下兩項為紅底白字提醒（不擋流程）；帶 entry 與欄位名，確認對話框可直接輸入
    if (/介紹|贈品/.test(note) && toNum(e.partyAFee) === 0 && toNum(e.partyBFee) === 0) {
      feeMiss.push({ text: `${e.unitId}：${note}`, entry: e, field: 'partyAFee', label: `${props.settings.partyALabel}(元)` });
    }
    if (isBonus.value) {
      const claimTotal = unitClaimedPct(e.unitId);
      if (claimTotal < 100 && toNum(e.ratioPct) >= 100) {
        ratioMismatch.push({ text: `${e.unitId}：請佣僅 ${claimTotal}%，本次獎金比例 100%`, entry: e, field: 'ratioPct', label: '本次獎金比例(%)', suggest: claimTotal });
      }
    }
  });

  const refundNotes = [];
  refunds.value.forEach(e => {
    if (!e.selectedIds.length) blocking.push(`${refundLabel.value} ${e.unitId}：未勾選要退回的原${isBonus.value ? '獎金' : '請佣'}紀錄`);
    if (!(toNum(e.period) > 0)) blocking.push(`${refundLabel.value} ${e.unitId}：期別須為正整數`);
    const pl = refundPlan(e);
    if (e.selectedIds.length) pl.errors.forEach(err => blocking.push(`${refundLabel.value} ${e.unitId}：${err}`));
    const status = e.unit?.salesStatus_backend || '';
    const released = classifySalesStatus(status) === 'released';
    const bonusText = e.refundBonus ? `追回獎金 ${money(pl.people.reduce((s, p) => s + p.net, 0))} 元` : '不追回獎金';
    const claimText = isBonus.value ? '' : `退回 ${money(pl.calc.thisClaim)} 元、`;
    refundNotes.push(`${e.unitId}（${status || '狀態不明'}）：${claimText}${bonusText}${released ? '' : '；⚠ 銷控狀態非解約／退戶'}`);
  });

  return { blocking, warnings, feeMiss, ratioMismatch, refundNotes };
}

// ---------- 送出前預覽 ----------
const exportSettings = computed(() => ({ ...props.settings, priceBasis: plan.value.priceBasis }));
const exportProjectName = computed(() => exportProjectNameOf(props.projectName, plan.value));

/** 草稿組成與後端寫入相同形狀的暫存紀錄，供匯出 model 使用 */
const draftData = computed(() => {
  const common = { projectId: props.projectId, planId: planId.value, plan: plan.value, createdBy: userStore.user?.name || '' };
  const records = [];
  const bonusRecords = [];
  entries.value.forEach(entry => {
    const d = draftClaimRecord({ entry, result: entryResult(entry), ...common });
    records.push(d.record);
    bonusRecords.push(...d.bonusRecords);
  });
  refunds.value.forEach(entry => {
    const d = draftRefundRecord({ entry, refundPlan: refundPlan(entry), ...common });
    records.push(d.record);
    bonusRecords.push(...d.bonusRecords);
  });
  return { records, bonusRecords };
});

const summaryPeriod = ref(props.nextPeriod);
// ---------- 獎金：整批共用期別／獎金日期（同步到所有戶別卡片） ----------
const bonusDate = ref(formatDateTW(new Date()));
watch([summaryPeriod, bonusDate], ([p, d]) => {
  if (!isBonus.value) return;
  [...entries.value, ...refunds.value].forEach(e => { e.period = Number(p) || 0; e.requestDate = d; });
});
// ---------- 請佣：整批共用期別／請佣日期（同步到所有戶別卡片） ----------
const claimPeriod = ref(props.nextPeriod);
const claimDate = ref(formatDateTW(new Date()));
watch([claimPeriod, claimDate], ([p, d]) => {
  if (isBonus.value) return;
  [...entries.value, ...refunds.value].forEach(e => { e.period = Number(p) || 0; e.requestDate = d; });
});
// 送出後父層重新載入 → 下一期別更新；工作台沒有草稿時跟著切到下一期
watch(() => props.nextPeriod, next => { if (!entries.value.length) claimPeriod.value = next; });
const noteEdits = ref([]);
const savingNotes = ref(false);
const effectiveNotes = computed(() => [...noteEdits.value, ...props.periodNotes]);
/** 每人歷期獎金明細備註（含歷史匯入）：當期未存備註時，每人當期獎金結果自動帶入最近一期 */
const personNoteHistory = computed(() => buildPersonNoteHistory(props.allBonusRecords));
const summaryPeriods = computed(() => [...new Set([props.nextPeriod, ...props.allBonusRecords.map(b => toNum(b.period)), ...entries.value.map(e => toNum(e.period))])].filter(p => p > 0).sort((a, b) => b - a));
const periodSummary = computed(() => summarizePeriodBonus({
  period: summaryPeriod.value, saved: props.allBonusRecords, drafts: draftData.value.bonusRecords,
  replacingIds: entries.value.map(e => e.replaceRecordId),
  // 先依獎金類別順序（與卡片「獎金人員與分配」相同：主委 → 副總 → … → 銷售個獎），同類別再依獎金表人員欄順序
  categoryOrder: enabledCategories.value.map(c => c.key),
  sorter: makePersonSorter(props.personOrder, props.personnel.map(p => p.name)),
}));
const savedPeriodEntries = computed(() => props.records.filter(r => r.status !== 'voided' && r.type !== 'refund' && !r.refundedBy && toNum(r.period) === Number(summaryPeriod.value)));
const savedPeriodRefunds = computed(() => props.records.filter(r => r.status !== 'voided' && r.type === 'refund' && toNum(r.period) === Number(summaryPeriod.value)));

// ---------- 作廢退獎金（原獎金紀錄恢復可拉回／可再退，已送比例加回） ----------
const voidRefundTarget = ref(null);
const voidRefundReason = ref('');
const voidingRefund = ref(false);
function openVoidRefund(record) {
  voidRefundTarget.value = record;
  voidRefundReason.value = '';
}
async function doVoidRefund() {
  const target = voidRefundTarget.value;
  if (!target || !voidRefundReason.value.trim()) return;
  voidingRefund.value = true;
  try {
    const res = await voidCommissionRecordAPI({
      projectId: props.projectId, planId: planId.value, recordId: target.id, submissionType: 'bonus',
      voidReason: voidRefundReason.value.trim(), voidedBy: userStore.user?.name || '',
    });
    if (!res?.ok) throw new Error('寫入失敗');
    toast.success(`已作廢 ${target.unitId} 的退獎金紀錄`);
    voidRefundTarget.value = null;
    emit('submitted');
  } catch (error) { toast.error(`作廢失敗：${error.message}`); }
  finally { voidingRefund.value = false; }
}
/** 本次草稿各人員的扣款比例（保留款／稅金／二代健保）：於「每人當期獎金結果」直接編輯，跨戶共用同一 profile */
const draftPersonRates = computed(() => {
  const map = {};
  entries.value.forEach(e => {
    Object.entries(entryProfiles(e)).forEach(([personKey, prof]) => {
      if (!map[personKey]) map[personKey] = { keepPct: toNum(prof.keepPct), taxPct: toNum(prof.taxPct), nhiPct: toNum(prof.nhiPct), profiles: [] };
      if (!map[personKey].profiles.includes(prof)) map[personKey].profiles.push(prof);
    });
  });
  return map;
});
function updatePersonRate({ personKey, field, value }) {
  const item = draftPersonRates.value[personKey];
  if (!item || !['keepPct', 'taxPct', 'nhiPct'].includes(field)) return;
  const v = Math.round((Number(value) || 0) * 100) / 100;
  item.profiles.forEach(prof => { prof[field] = v; });
}
function updatePeriodNote(row) {
  noteEdits.value = [...noteEdits.value.filter(n => n.period !== row.period || n.personKey !== row.personKey), row];
}
async function savePeriodNotes() {
  savingNotes.value = true;
  const saved = JSON.parse(JSON.stringify(noteEdits.value));
  try {
    await setBonusPeriodNotes(props.projectId, saved, userStore.user?.name || '');
    // Keep edits made while the request was running.
    noteEdits.value = noteEdits.value.filter(n => !saved.some(s => JSON.stringify(n) === JSON.stringify(s)));
    emit('notes-saved');
    toast.success('當期備註已儲存');
  } catch (error) { toast.error(`備註儲存失敗：${error.message}`); }
  finally { savingNotes.value = false; }
}

const draftPeriods = computed(() => [...new Set(draftData.value.records.map(r => toNum(r.period)))].sort((a, b) => a - b));
const previewPeriodsText = computed(() => draftPeriods.value.join('、'));

const previewTypeConfigs = computed(() => previewConfigs.value.filter(c => c.docType === previewDocType.value));
const previewConfigOptions = computed(() => ([
  { id: '__default', name: '系統預設版型' },
  ...previewTypeConfigs.value.map(c => ({ id: c.id, name: c.isDefault ? `★ ${c.name}` : c.name })),
]));
function pickDefaultPreviewConfig() {
  const def = previewTypeConfigs.value.find(c => c.isDefault);
  previewConfigId.value = def ? def.id : '__default';
}
watch(previewDocType, pickDefaultPreviewConfig);

function previewConfigOf(type) {
  const fallback = type === 'claim' ? defaultClaimConfig(exportSettings.value) : defaultBonusConfig(exportSettings.value);
  if (previewDocType.value !== type) {
    const def = previewConfigs.value.find(c => c.docType === type && c.isDefault);
    return def?.config || fallback;
  }
  if (previewConfigId.value === '__default') return fallback;
  return previewConfigs.value.find(c => c.id === previewConfigId.value)?.config || fallback;
}

const previewGrids = computed(() => {
  if (!previewOpen.value) return [];
  try {
    const { records, bonusRecords } = draftData.value;
    const multi = draftPeriods.value.length > 1;
    const list = [];
    draftPeriods.value.forEach(period => {
      const recs = records.filter(r => toNum(r.period) === period);
      if (!recs.length) return;
      const ids = new Set(recs.map(r => r.id));
      const base = { settings: exportSettings.value, period, projectName: exportProjectName.value };
      let grids;
      if (previewDocType.value === 'claim') {
        grids = [buildClaimGrid(buildClaimModel(recs, { ...base, config: previewConfigOf('claim') }))];
      } else {
        grids = buildBonusGrids(buildBonusModel({
          ...base,
          records: recs,
          periodNotes: effectiveNotes.value,
          noteHistory: personNoteHistory.value,   // 與「每人當期獎金結果」相同的備註來源（含自動帶入的最近一期備註）
          bonusRecords: bonusRecords.filter(b => ids.has(b.commissionRecordId)),
          config: previewConfigOf('bonus'),
          projectId: props.projectId,
          personnelOrder: props.personnel.map(p => p.name),
          personOrder: props.personOrder,
        }));
      }
      if (multi) grids.forEach(g => { g.name = `第${period}期 ${g.name}`; });
      list.push(...grids);
    });
    return list;
  } catch (e) {
    console.error('[CommissionWorkbench] 預覽版面產生失敗:', e);
    return [];
  }
});

async function loadPreviewConfigs() {
  if (previewConfigsLoaded.value) return;
  previewConfigsLoading.value = true;
  try {
    previewConfigs.value = (await fetchCommissionExportConfigs(props.projectId)).filter(belongsToPlan);
    previewConfigsLoaded.value = true;
  } catch (e) {
    console.error('[CommissionWorkbench] 載入版型失敗:', e);
  } finally {
    previewConfigsLoading.value = false;
    pickDefaultPreviewConfig();
  }
}

function openPreview() {
  const { blocking, warnings, feeMiss, ratioMismatch, refundNotes } = collectIssues();
  if (blocking.length) {
    blockingItems.value = blocking;
    blockingOpen.value = true;
    return;
  }
  const critical = buildSections({ warnings, feeMiss, ratioMismatch, refundNotes }).filter(s => s.confirm);
  if (critical.length) {
    confirmSections.value = critical;
    confirmOpen.value = true;
    return;
  }
  enterPreview();
}
/** 預覽頁提示區段；items 為字串或 { text, entry, field, label }（紅底白字項目可於確認對話框直接輸入） */
function buildSections({ warnings, feeMiss, ratioMismatch, refundNotes }) {
  const sections = [];
  if (refundNotes.length) sections.push({ title: `↩ ${refundLabel.value}戶別`, subtitle: isBonus.value ? '送出後原獎金紀錄標記「已退獎金」、已送比例回溯，可於本期已送出獎金清單作廢退獎金紀錄還原：' : '送出後原紀錄標記「已退佣」、已請比例回溯，可於歷期總覽作廢退佣紀錄還原：', items: refundNotes });
  // confirm：進預覽前先以 dialog 確認（可直接處理或略過）；critical：紅底白字
  if (warnings.length) sections.push({ title: '⚠ 有項目尚未勾選人員', subtitle: '可直接點選人員加入，或刻意留空繼續：', items: warnings, confirm: true });
  if (feeMiss.length) sections.push({ title: '🎁 介紹費/贈品尚未填寫', subtitle: '備註提到介紹/贈品但金額為 0，可直接填入或略過：', items: feeMiss, confirm: true, critical: true });
  if (ratioMismatch.length) sections.push({ title: '⚠ 請佣不足 100% 但獎金比例 100%', subtitle: '可直接改比例或維持 100% 繼續：', items: ratioMismatch, confirm: true, critical: true });
  return sections;
}
/** 確認對話框按「繼續預覽」後進入預覽（對話框內若已填值，預覽提示會重新計算） */
function confirmPreview() {
  confirmOpen.value = false;
  enterPreview();
}
function enterPreview() {
  const { warnings, feeMiss, ratioMismatch, refundNotes } = collectIssues();
  previewWarnings.value = buildSections({ warnings, feeMiss, ratioMismatch, refundNotes });
  previewDocType.value = props.mode;
  previewOpen.value = true;
  loadPreviewConfigs();
}
/** 確認對話框內直接輸入：介紹費為非負整數元；獎金比例 0～100，並依卡片規則寫回 entry */
function setConfirmValue(item, v) {
  let n = Number(v);
  if (!Number.isFinite(n) || n < 0) n = 0;
  if (item.field === 'ratioPct') n = Math.min(100, Math.round(n * 10) / 10);
  else n = Math.round(n);
  item.entry[item.field] = n;
}
/**
 * 確認對話框「尚未勾選人員」：某戶某類別的候選人員（與卡片「獎金人員與分配」候選相同）
 * 預設人員 → 只列預設人員；依職務 → 職務符合者；團隊 → 團獎職務符合者（附進退場提示）；個人 → 銷售職務者＋本戶銷售
 */
function categoryCandidates(e, cat) {
  const contractDate = e.unit?.payment_contract_date;
  const defaultPersons = categoryDefaultPersons(cat, props.personnel);
  if (defaultPersons.length) return defaultPersons.map(dp => ({ personKey: dp.personKey, name: dp.name, isExternal: dp.isExternal, rates: dp.rates, hint: '預設人員' }));
  if (cat.mode === 'role') {
    return props.personnel.filter(p => matchesRolePositions(p.positions, cat.rolePositions)).map(p => ({ personKey: personKeyOf(p), name: p.name, hint: '' }));
  }
  if (cat.mode === 'team') {
    const roleOk = p => ((cat.rolePositions || []).length ? matchesRolePositions(p.positions, cat.rolePositions) : (p.positions || []).some(pos => ['專案', '副專', '銷售'].some(r => String(pos).includes(r))));
    return props.personnel.filter(roleOk).map(p => {
      const { matched } = segmentForDate(bonusSegments(p?.bonusConfig), contractDate);
      return { personKey: personKeyOf(p), name: p.name, hint: matched ? '' : '資格不符' };
    });
  }
  const unitSales = normalizeSalesNames(e.unit?.salesperson);
  const list = props.personnel.filter(p => (p.positions || []).some(pos => String(pos).includes('銷售')))
    .map(p => ({ personKey: personKeyOf(p), name: p.name, hint: unitSales.includes(p.name) ? '本戶銷售' : '' }));
  unitSales.forEach(nm => { if (!list.some(o => o.name === nm)) list.push({ personKey: `ext:${nm}`, name: nm, isExternal: true, hint: '本戶銷售' }); });
  return list;
}
function isPersonInCategory(e, catKey, personKey) {
  return (e.categories[catKey]?.allocations || []).some(a => a.personKey === personKey);
}
/** 確認對話框點選人員：加入／移除該類別分配，並依目前分配方式維持均分（鎖定額不動） */
function togglePersonInCategory(e, catKey, cand) {
  const cat = e.categories[catKey];
  if (!cat) return;
  const idx = cat.allocations.findIndex(a => a.personKey === cand.personKey);
  if (idx >= 0) cat.allocations.splice(idx, 1);
  else {
    ensureProfile(cand.personKey, cand.name, e.unit?.payment_contract_date, cand.rates || null);
    cat.allocations.push({
      personKey: cand.personKey, name: cand.name,
      sourceProjectId: props.projectId, sourceProjectName: props.projectName,
      isExternal: !!cand.isExternal, mode: 'pct', sharePct: 0, lockedAmount: null,
    });
  }
  const pcts = cat.allocations.filter(a => a.mode !== 'locked');
  const shares = evenShares(pcts.length);
  pcts.forEach((a, i) => { a.sharePct = shares[i]; });
}

async function doSubmit() {
  submitting.value = true;
  try {
    const { blocking } = collectIssues();
    if (blocking.length) throw new Error(blocking.join("；"));
    const payloadEntries = entries.value.map(e => {
      // 只帶本戶有參與的人員 profile（依本戶簽約日解析段落費率；鍵仍為 personKey）
      const profiles = {};
      Object.entries(entryProfiles(e)).forEach(([k, v]) => {
        const { segmentLabel: _label, ...rest } = v;
        profiles[k] = { ...rest };
      });
      return {
        unitId: e.unitId,
        priceSource: e.priceSource,
        manualFloor: e.finance.manualFloorRequired ? e.manualFloor : null,
        note: String(e.note || '').trim(),
        period: Number(e.period) || 0,
        requestDate: e.requestDate,
        ratioPct: toNum(e.ratioPct),
        commPct: toNum(e.commPct),
        keepPct: toNum(e.keepPct),
        partyAFee: toNum(e.partyAFee),
        partyBFee: toNum(e.partyBFee),
        claimBasisMethod: e.claimBasisMethod,
        bonusBasisMethod: e.bonusBasisMethod,
        partyBFeeTiming: e.partyBFeeTiming,
        teamSiteKeys: [...e.teamSiteKeys],
        categories: isBonus.value ? JSON.parse(JSON.stringify(e.categories)) : {},
        personProfiles: profiles,
        replaceRecordId: e.replaceRecordId || null,
        replaceLegacyBonus: !!e.replaceLegacyBonus,
      };
    });

    const payloadRefunds = refunds.value.map(e => ({
      unitId: e.unitId,
      period: Number(e.period) || 0,
      requestDate: e.requestDate,
      reason: String(e.reason || ''),
      note: String(e.note || '').trim(),
      refundRatioPct: e.refundRatioPct ?? null,
      includeKeep: !!e.includeKeep,
      refundBonus: isBonus.value,
      sourceRecordIds: [...e.selectedIds],
      people: e.people ? JSON.parse(JSON.stringify(e.people)) : null,
    }));

    const res = await submitCommissionEntriesAPI({
      projectId: props.projectId,
      planId: planId.value,
      submissionType: props.mode,
      periodNotes: isBonus.value ? JSON.parse(JSON.stringify(noteEdits.value)) : [],
      createdBy: userStore.user?.name || userStore.user?.phone || '',
      entries: payloadEntries,
      refunds: payloadRefunds,
    });
    if (res?.ok) {
      const nRefund = res.results.filter(r => r.refund).length;
      const nClaim = res.results.length - nRefund;
      toast.success(`已寫入 ${nClaim} 戶${isBonus.value ? '獎金' : '請佣'}紀錄${nRefund ? `、${nRefund} 戶${refundLabel.value}紀錄` : ''}`);
      const period = res.results.reduce((m, r) => Math.max(m, toNum(r.period)), 0);
      noteEdits.value = [];
      entries.value = [];
      refunds.value = [];
      previewOpen.value = false;
      emit('submitted', { period: period || null, docType: props.mode });
    } else {
      toast.error('寫入失敗，請重試');
    }
  } catch (e) {
    console.error('[CommissionWorkbench] 送出失敗:', e);
    toast.error(`送出失敗：${e.message}`);
  } finally {
    submitting.value = false;
  }
}
defineExpose({ hasDraft: computed(() => entries.value.length > 0 || refunds.value.length > 0 || noteEdits.value.length > 0), loadFromRecords });
</script>

<style scoped>
/* 工作台內所有數字欄位：隱藏上下調整箭頭（鍵盤／滾輪調整由 blockNumberSpin／blockNumberWheel 攔截） */
.commission-workbench :deep(input[type="number"]::-webkit-outer-spin-button),
.commission-workbench :deep(input[type="number"]::-webkit-inner-spin-button) { -webkit-appearance: none; margin: 0; }
.commission-workbench :deep(input[type="number"]) { -moz-appearance: textfield; appearance: textfield; }
.picker-list { max-height: 50vh; overflow-y: auto; border: 1px solid rgba(0,0,0,.08); border-radius: 8px; }
.sum-item { background: #f5f5f5; border-radius: 8px; padding: 8px 12px; }
.sum-item label { font-size: 11px; color: #789; display: block; }
.sum-item div { font-size: 17px; font-weight: 700; color: #263238; }
.sum-item.highlight div { color: #263238; }
.sum-item.handover { background: #f5f5f5; }
.sum-item.handover div { color: #263238; }
.sum-item.refund { background: #f5f5f5; }
.sum-item.refund div { color: #c62828; }
.summary-card { scroll-margin-top: 80px; }
.table-scroll { overflow-x: auto; }
/* 送出前預覽：全螢幕，預覽區佔滿剩餘高度 */
.preview-dialog { display: flex; flex-direction: column; height: 100%; }
.preview-body { flex: 1; overflow: auto; background: #fafafa; }
.preview-actions { background: #fff; }
/* 每人彙總表：人員／來源欄固定合理寬度，其餘金額欄平均分配 */
.people-table th, .people-table td { white-space: nowrap; }
.people-table .col-name { min-width: 110px; }
.people-table .col-source { min-width: 90px; }
/* ---- 左右分欄 ---- */
.split-area { display: grid; grid-template-columns: 340px minmax(0, 1fr); gap: 14px; align-items: start; margin-bottom: 16px; }
.unit-list { position: sticky; top: 12px; max-height: calc(100vh - 120px); display: flex; flex-direction: column; background: #fff; border: 1px solid #ddd; border-radius: 12px; overflow: hidden; }
.list-h { display: flex; align-items: center; gap: 4px; padding: 8px 12px; border-bottom: 1px solid #e5e7eb; font-size: 12px; color: #66707f; }
.list-h b { color: #1e2532; font-size: 13px; }
.list-body { overflow: auto; flex: 1; }
.list-row { display: grid; grid-template-columns: 8px 1fr auto; gap: 0 10px; align-items: center; width: 100%; padding: 10px 12px; border: 0; border-bottom: 1px solid #eef0f4; background: transparent; text-align: left; position: relative; font: inherit; color: inherit; cursor: pointer; }
.list-row:hover { background: #f7f8fb; }
.list-row.active { background: #e6edfb; }
.list-row.active::before { content: ""; position: absolute; left: 0; top: 0; bottom: 0; width: 3px; background: rgb(var(--v-theme-primary)); }
.list-row.is-refund .u { color: #c62828; }
.list-row:focus-visible { outline: 2px solid rgb(var(--v-theme-primary)); outline-offset: -2px; }
.list-row .dot { width: 8px; height: 8px; border-radius: 50%; background: #2e7d32; }
.list-row .dot.warn { background: #fb8c00; }
.list-row .dot.err { background: #c62828; }
.list-row .main { display: flex; align-items: center; flex-wrap: wrap; gap: 4px 6px; min-width: 0; }
.list-row .u { font-weight: 700; }
/* 紅底白字提醒（進預覽前確認對話框與預覽頁共用） */
.critical-alert { color: #fff !important; font-weight: 700; }
.critical-alert :deep(.v-alert__content) { color: #fff; }
.critical-alert .confirm-input { max-width: 320px; }
.opacity-70 { opacity: .7; }
.critical-alert .confirm-input :deep(input), .critical-alert .confirm-input :deep(.v-label), .critical-alert .confirm-input :deep(.v-text-field__suffix) { color: #222; font-weight: 500; }
/* 紅色驚嘆號提醒（左側清單與新增戶別選單共用） */
.fee-mark { flex: none; display: inline-flex; align-items: center; gap: 2px; font-size: 11px; font-weight: 700; color: #c62828; }
.list-row .b { font-size: 12px; color: #66707f; }
.list-row .note-mark { font-size: 11px; color: #8a5a00; max-width: 100%; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.list-row .amt { text-align: right; font-weight: 600; font-variant-numeric: tabular-nums; }
.list-row .amt small { display: block; font-weight: 400; font-size: 11px; color: #66707f; }
.list-row .meta { grid-column: 2 / 4; display: flex; flex-wrap: wrap; gap: 2px 10px; font-size: 11px; color: #66707f; margin-top: 2px; }
.list-row .meta b { color: #1e2532; font-weight: 500; }
.list-f { display: flex; justify-content: space-between; padding: 8px 12px; border-top: 1px solid #e5e7eb; font-size: 12px; color: #66707f; }
.list-f b { color: #1e2532; font-variant-numeric: tabular-nums; }
.unit-editor { min-width: 0; scroll-margin-top: 80px; }
.editor-nav { display: flex; align-items: center; gap: 4px; margin-bottom: 8px; }
@media (max-width: 960px) {
  .split-area { grid-template-columns: 1fr; }
  .unit-list { position: static; max-height: none; }
  .list-body { display: flex; overflow-x: auto; gap: 8px; padding: 8px; }
  .list-row { width: auto; min-width: 230px; flex: 0 0 auto; border: 1px solid #e5e7eb; border-radius: 8px; grid-template-columns: 8px 1fr; }
  .list-row.active { border-color: rgb(var(--v-theme-primary)); }
  .list-row.active::before { display: none; }
  .list-row .amt { grid-column: 2; text-align: left; }
  .list-row .meta { grid-column: 2; }
  .list-f { display: none; }
  .unit-editor { scroll-margin-top: 58px; }
}
.submit-bar { position: sticky; bottom: 12px; z-index: 6; display: flex; align-items: center; flex-wrap: wrap; gap: 12px; padding: 16px; background: #fff; border: 1px solid #ddd; border-radius: 10px; box-shadow: 0 2px 12px #00000012; }
.submit-total { font-size: 20px; font-variant-numeric: tabular-nums; }
.commission-workbench { padding-bottom: 16px; }
@media (max-width: 600px) { .submit-bar { bottom: 0; gap: 8px; padding: 12px; } .submit-total { font-size: 18px; } }
</style>
