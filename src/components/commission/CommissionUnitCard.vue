<template>
  <v-card class="mb-3 unit-card" :id="`comm-card-${entry.id}`" variant="outlined" :class="{ 'has-issue': issueCount > 0, 'is-expanded': !entry.collapsed }">
    <!-- 標頭：戶別 / 買方 / 狀態 / 本次請佣 / 完成度 -->
    <div class="card-head d-flex align-center flex-wrap ga-2 px-4 py-3">
      <button class="unit-toggle" :aria-expanded="!entry.collapsed" @click="$emit('toggle')">
        <v-icon size="small">{{ entry.collapsed ? 'mdi-chevron-right' : 'mdi-chevron-down' }}</v-icon>
        <strong>{{ entry.unitId }}</strong>
        <span class="text-body-2">{{ entry.unit.buyerName || '—' }}</span>
        <span class="text-body-2 text-medium-emphasis">銷售人員：{{ unitSalesText || '未設定' }}</span>
        <span class="head-dates text-caption text-medium-emphasis">
          <span>小訂 <b>{{ depositDateText || '—' }}</b></span>
          <span>簽約 <b>{{ contractDateText || '—' }}</b></span>
        </span>
        <v-chip size="x-small" variant="tonal" :color="contractTypeColor(entry.unit.contractType)">{{ entry.unit.contractType || '未設定合約方式' }}</v-chip>
        <span v-if="entry.unit.isPreferredPayment" class="text-caption text-medium-emphasis">優付戶</span>
        <v-chip v-if="entry.replaceRecordId" size="x-small" color="orange-darken-3" variant="flat" prepend-icon="mdi-pencil-box-outline" title="送出後原紀錄作廢，以本卡片內容寫入新紀錄">拉回編輯・送出取代第 {{ entry.period }} 期原紀錄</v-chip>
      </button>
      <span class="head-amount"><small>本次請佣 </small>{{ money(result.claim.thisClaim) }} <small>元</small></span>
      <span v-if="issueCount" class="text-caption text-warning">{{ issueCount }} 項待完成</span>
      <span v-else class="text-caption text-medium-emphasis">已填妥</span>
      <v-btn icon="mdi-close" size="small" variant="text" class="remove-unit" title="移除此戶" @click="$emit('remove')" />
      <dl class="finance-summary" aria-label="戶別請佣數據">
        <div class="finance-metric">
          <dt>{{ entry.priceSource === 'package' ? '配套價格' : '成交總價' }}<span class="metric-unit">萬</span></dt>
          <dd>{{ fmtWan(entry.finance.dealTotal, 4) }}</dd>
          <span class="metric-note">{{ entry.priceSource === 'package' ? '不計車位' : entry.priceSource === 'splitHouse' ? '配套房屋總價，含車位' : '原成交總價，含車位' }}</span>
        </div>
        <div class="finance-metric">
          <dt>總底價<span class="metric-unit">萬</span></dt>
          <dd>{{ hasValidFloor ? fmtWan(entry.finance.totalFloor, 4) : '—' }}</dd>
          <span class="metric-note">{{ hasValidFloor ? (entry.priceSource === 'package' ? '配套底價，不計車位' : '房屋＋車位底價') : '待填有效底價' }}</span>
        </div>
        <div class="finance-metric">
          <dt>溢差價<span class="metric-unit">萬</span></dt>
          <dd :class="{ 'text-error': hasValidFloor && entry.finance.spread < 0 }">{{ hasValidFloor ? fmtWan(entry.finance.spread, 4) : '—' }}</dd>
          <span class="metric-note">{{ hasValidFloor && entry.finance.spread < 0 ? '低於底價' : '成交總價－總底價' }}</span>
        </div>
        <div class="finance-metric">
          <dt>本筆可單獨調整</dt>
          <dd class="commission-rate-input">
            <v-text-field v-model.number="entry.commPct" label="佣金比例(%)" :aria-label="`${entry.unitId} 佣金比例(%)`"
              type="number" step="0.01" variant="outlined" density="compact" hide-details />
          </dd>
          <div class="d-flex align-center flex-wrap ga-1">
            <span class="metric-note">{{ customCommPct ? '本筆自訂' : '方案預設' }} · 預設 {{ fmtWan(defaultCommPct, 4) }}%</span>
            <v-btn v-if="customCommPct" size="x-small" variant="text" color="primary"
              :aria-label="`${entry.unitId} 佣金比例還原預設`" @click="entry.commPct = defaultCommPct">還原預設</v-btn>
          </div>
        </div>
        <div class="finance-metric">
          <dt>本次請佣比例<span class="metric-unit">%</span></dt>
          <dd :class="{ 'text-error': ratioOver }">{{ fmtWan(entry.ratioPct, 4) }}</dd>
          <span class="metric-note">已請 {{ fmtWan(claimedPct, 4) }}% · {{ ratioOver ? '超過 100%' : `尚餘 ${round1(100 - totalPct)}%` }}</span>
        </div>
      </dl>
    </div>

    <v-expand-transition>
      <div v-show="!entry.collapsed">
        <v-divider></v-divider>
        <v-card-text class="pt-3">
          <!-- ========== ① 請佣條件 ========== -->
          <div class="step-h">
            <span class="step-no">1</span>
            <span class="step-title">請佣條件</span>
          </div>
          <div class="step-body">
            <v-btn v-if="!entry.note && !showNote" variant="text" size="small" class="mb-2" @click="showNote = true">新增備註</v-btn>
            <v-row dense align="start" class="mb-2">
              <v-col cols="12" sm="6" v-if="plan.priceBasis === 'house' && isNonGeneralContract(entry.unit)">
                <v-select :model-value="entry.priceSource" label="本次採用價格" @update:model-value="setPriceSource"
                  :items="[{ title: '配套房屋總價（含車位）', value: 'splitHouse' }, { title: '原成交總價（含車位）', value: 'transaction' }]"
                  variant="outlined" density="compact" hide-details />
              </v-col>
              <v-col cols="12" sm="6" v-if="entry.finance.manualFloorRequired">
                <v-text-field v-model.number="entry.manualFloor" :label="entry.priceSource === 'package' ? '配套底價（萬）＊' : '房屋底價（萬，不含車位）＊'"
                  type="number" min="0" step="0.0001" variant="outlined" density="compact" hide-details />
              </v-col>
              <v-col cols="12" v-if="entry.note || showNote">
                <v-text-field v-model="entry.note" label="請佣備註" maxlength="200" variant="outlined" density="compact" hide-details clearable />
              </v-col>
            </v-row>
            <div class="text-body-2 mb-3" v-if="entry.finance.manualFloorRequired">
              {{ entry.priceSource === 'package' ? '配套價格' : '配套房屋總價（含車位）' }}：<strong>{{ fmtWan(entry.finance.dealTotal) }} 萬</strong>
              <span v-if="entry.priceSource === 'package'">・不計車位</span>
              <span v-else>・車位底價 {{ fmtWan(entry.finance.parkFloor) }} 萬（沿用銷控資料）</span>
            </div>
            <v-alert v-for="message in entry.finance.errors" :key="message" type="warning" variant="tonal" density="compact" class="mb-2">{{ message }}</v-alert>
            <v-row dense align="start">
              <v-col cols="6" sm="3" md="2">
                <v-text-field v-model.number="entry.period" label="期別" type="number" variant="outlined" density="compact" hide-details></v-text-field>
              </v-col>
              <v-col cols="6" sm="3" md="3" lg="2">
                <v-text-field v-model="entry.requestDate" label="請佣日期" placeholder="yyyy/mm/dd" variant="outlined" density="compact" hide-details></v-text-field>
              </v-col>
              <v-col cols="12" sm="6" md="4" lg="3">
                <v-text-field
                  :model-value="entry.ratioPct"
                  label="本次請佣比例(%) *"
                  type="number" step="0.1" variant="outlined" density="compact" hide-details
                  color="primary"
                  @update:model-value="onRatioInput"
                >
                  <template #append-inner>
                    <v-btn v-if="claimedPct < 100" size="x-small" variant="text" color="primary" @click.stop="onRatioInput(100 - claimedPct)">全部</v-btn>
                  </template>
                </v-text-field>
                <div class="ratio-bar mt-1" :title="`已請 ${claimedPct}%　本次 ${entry.ratioPct}%　尚餘 ${round1(Math.max(0, 100 - totalPct))}%`">
                  <span class="seg done" :style="{ width: Math.min(100, claimedPct) + '%' }"></span>
                  <span class="seg now" :style="{ width: Math.min(100 - Math.min(100, claimedPct), toNum(entry.ratioPct)) + '%' }"></span>
                </div>
                <div class="text-caption mt-1" :class="ratioOver ? 'text-error' : 'text-medium-emphasis'">
                  已請 {{ claimedPct }}%・本次 {{ entry.ratioPct }}%・{{ ratioOver ? `超過 ${round1(totalPct - 100)}%` : `尚餘 ${round1(100 - totalPct)}%` }}
                </div>
              </v-col>
              <v-col cols="12" sm="8" md="12" lg="3" class="d-flex align-center flex-wrap ga-1">
                <v-btn size="small" variant="text" :prepend-icon="showAdvanced ? 'mdi-chevron-up' : 'mdi-chevron-down'" @click="showAdvanced = !showAdvanced">
                  其他設定
                </v-btn>
                <v-chip v-if="advancedSummary" size="x-small" color="default" variant="tonal">{{ advancedSummary }}</v-chip>
              </v-col>
            </v-row>

            <v-expand-transition>
              <v-row v-if="showAdvanced" dense class="mt-1 adv-row">
                <v-col cols="12" sm="6" md="4">
                  <v-text-field v-model.number="entry.partyAFee" :label="`${settings.partyALabel}(元)`" type="number" variant="outlined" density="compact"
                    hint="計入獎金折數，會降低所有獎金" persistent-hint></v-text-field>
                </v-col>
                <v-col cols="12" sm="6" md="4">
                  <v-text-field v-model.number="entry.partyBFee" :label="`${settings.partyBLabel}(元)`" type="number" variant="outlined" density="compact"
                    hint="計入請佣基準，不影響獎金折數" persistent-hint></v-text-field>
                </v-col>
                <v-col cols="6" sm="4" md="2">
                  <v-text-field v-model.number="entry.keepPct" label="請佣保留款(%)" type="number" step="1" variant="outlined" density="compact" hide-details></v-text-field>
                </v-col>
              </v-row>
            </v-expand-transition>

            <v-alert v-if="hasNote" :type="feeHint ? 'warning' : undefined" variant="tonal" density="compact" class="mt-2 mb-0 note-alert">
              <div class="font-weight-bold mb-1">{{ feeHint ? '銷控備註提到介紹費/贈品，請確認「其他設定」' : '銷控備註' }}</div>
              <div class="note-list">
                <div v-for="n in displayNotes" :key="n.noteId" class="note-item">
                  <div v-if="n.pinned || n.time || n.name || n.catLabel" class="note-meta">
                    <span v-if="n.pinned">📌</span>
                    <span v-if="n.time">{{ n.time }}</span>
                    <span v-if="n.name" class="font-weight-medium">{{ n.name }}</span>
                    <v-chip v-if="n.catLabel" size="x-small" variant="tonal" color="default">{{ n.catLabel }}</v-chip>
                  </div>
                  <div class="note-content">{{ n.content }}</div>
                </div>
              </div>
            </v-alert>

            <!-- 試算結果（精簡） -->
            <div class="result-strip mt-3">
              <div class="rs-item hl"><label>本次請佣（元）</label><div>{{ money(result.claim.thisClaim) }}</div></div>
              <div class="rs-item"><label>實際請領（元）</label><div>{{ money(result.claim.realClaim) }}</div></div>
              <div class="rs-item"><label>保留款（元）</label><div>{{ money(result.claim.claimKeep) }}</div></div>
              <v-btn size="x-small" variant="text" class="align-self-center" :prepend-icon="showCalc ? 'mdi-chevron-up' : 'mdi-table-eye'" @click="showCalc = !showCalc">
                {{ showCalc ? '收合明細' : '計算明細' }}
              </v-btn>
            </div>
            <v-expand-transition>
              <div v-if="showCalc" class="mt-2">
                <div class="text-body-2 mb-2">{{ entry.priceSource === 'package' ? '配套價格' : '成交總價(含車)' }}：{{ fmtWan(entry.finance.dealTotal) }} 萬</div>
                <div class="info-grid mb-2">
                  <div class="ro-field"><label>簽約日期</label><div>{{ contractDateText || '—' }}</div></div>
                  <div class="ro-field"><label>小訂日期</label><div>{{ depositDateText || '—' }}</div></div>
                  <div class="ro-field"><label>持有車位</label><div>{{ entry.finance.parkingSpots || '—' }}</div></div>
                  <div class="ro-field"><label>溢差價</label><div :class="{ 'text-error': entry.finance.spread < 0 }">{{ money(entry.finance.spread * 10000) }} 元</div></div>
                  <div class="ro-field"><label>繳款比例</label><div >{{ paymentRatio === null ? '—' : paymentRatio + '%' }}</div></div>
                  <div class="ro-field"><label>銷控銷售人員</label><div>{{ unitSalesText || '—' }}</div></div>
                </div>
                <div class="table-scroll">
                  <v-table density="compact" class="claim-table">
                    <thead>
                      <tr>
                        <th>總底價(萬)</th><th>總成交價(萬)</th><th>溢差價(萬)</th><th>介紹費(萬)</th><th>實際溢差價(萬)</th>
                        <th>佣金比例</th><th>獎金折數</th><th>折數後總價(萬)</th><th>實際請領金額(元)</th><th>保留款(元)</th><th>本次請佣(元)</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td>{{ fmtWan(entry.finance.totalFloor) }}</td>
                        <td>{{ fmtWan(entry.finance.dealTotal) }}</td>
                        <td :class="{ 'text-error': entry.finance.spread < 0 }">{{ fmtWan(entry.finance.spread) }}</td>
                        <td>{{ fmtWan(result.claim.feeWan, 4) }}</td>
                        <td :class="{ 'text-error': result.claim.realSpread < 0 }">{{ fmtWan(result.claim.realSpread) }}</td>
                        <td>{{ (Number(entry.commPct) || 0).toFixed(2) }}%</td>
                        <td>{{ result.claim.discount.toFixed(2) }}</td>
                        <td>{{ money(result.claim.dealAfter) }}</td>
                        <td class="text-primary font-weight-bold">{{ money(result.claim.realClaim) }}</td>
                        <td>{{ money(result.claim.claimKeep) }}</td>
                        <td class="text-high-emphasis font-weight-bold">{{ money(result.claim.thisClaim) }}</td>
                      </tr>
                    </tbody>
                  </v-table>
                </div>
                <div class="text-caption text-medium-emphasis">
                  請佣基準＝min(總成交價−介紹費, 總底價)，本戶取 {{ result.claim.baseWan === entry.finance.totalFloor ? '總底價' : '總成交價−介紹費' }}
                  {{ fmtWan(result.claim.baseWan) }} 萬；介紹費(萬)＝「{{ settings.partyBLabel }}」÷10,000。
                </div>
              </div>
            </v-expand-transition>
          </div>

          <!-- ========== ② 獎金人員 ========== -->
          <div class="step-h mt-4">
            <span class="step-no">2</span>
            <span class="step-title">獎金人員與分配</span>
            <v-spacer></v-spacer>
            <v-chip v-if="missingCats.length" size="x-small" color="warning" variant="tonal">尚未選人：{{ missingCats.map(c => c.label).join('、') }}</v-chip>
          </div>
          <div class="people-summary mb-3">
            <span>{{ result.people.map(p => p.name).join('、') || '尚未設定人員' }}</span>
            <strong>獎金合計 {{ money(result.people.reduce((sum, p) => sum + p.subtotal, 0)) }} 元</strong>
            <v-btn size="small" variant="text" @click="editingPeople = !editingPeople">{{ editingPeople ? '完成設定' : '編輯人員與分配' }}</v-btn>
          </div>
          <div v-show="editingPeople">
          <div class="step-body">
            <template v-for="cat in payCategories" :key="cat.key">
              <!-- 團獎案場：顯示在每個團隊類別上方；所有團隊類別共用同一組勾選，任一處切換全部連動 -->
              <div v-if="cat.mode === 'team' && settings.teamGroups.length" class="team-site" :class="{ 'is-empty': !entry.teamSiteKeys.length }">
                <div class="d-flex align-center flex-wrap ga-2">
                  <span class="text-body-2 font-weight-medium">{{ cat.label }}・團獎案場</span>
                  <v-chip
                    v-for="g in settings.teamGroups"
                    :key="g.key"
                    size="small"
                    :color="entry.teamSiteKeys.includes(g.key) ? 'primary' : undefined"
                    :variant="entry.teamSiteKeys.includes(g.key) ? 'flat' : 'outlined'"
                    @click="toggleTeamSite(g.key)"
                  >
                    <v-icon start size="x-small">{{ entry.teamSiteKeys.includes(g.key) ? 'mdi-check-circle' : 'mdi-plus-circle-outline' }}</v-icon>{{ g.label }}
                  </v-chip>
                  <span v-if="!entry.teamSiteKeys.length" class="text-caption text-warning">尚未勾選案場</span>
                </div>
              </div>
              <AllocationEditor
                :category="entry.categories[cat.key]"
                :pool="result.pools[cat.key] || 0"
                :result="result.categoryResults[cat.key] || { amounts: {}, valid: true, error: '', total: 0 }"
                :pool-options="poolOptionsByCat[cat.key] || []"
                :project-id="projectId"
                @add-person="openPicker(cat.key)"
              />
            </template>

            <!-- 提撥類別（交屋團獎）：本戶可關閉 -->
            <template v-for="cat in handoverCategories" :key="cat.key">
              <div v-if="entry.categories[cat.key]" class="handover-box" :class="{ off: !isHandoverOn(cat) }">
                <div class="d-flex align-center flex-wrap ga-2">
                  <v-switch
                    :model-value="isHandoverOn(cat)"
                    color="primary" density="compact" hide-details inset
                    @update:model-value="v => setHandoverOn(cat, v)"
                  >
                    <template #label>
                      <span class="text-subtitle-2 font-weight-bold">本戶提撥{{ cat.label }}</span>
                    </template>
                  </v-switch>
                  <template v-if="isHandoverOn(cat)">
                    <span class="d-inline-flex align-center text-body-2">
                      提撥
                      <v-text-field
                        :model-value="entry.categories[cat.key].ratePct"
                        type="number" step="0.1" min="0" max="100"
                        density="compact" hide-details variant="outlined" style="width: 110px" class="mx-1" suffix="%"
                        @update:model-value="v => { entry.categories[cat.key].ratePct = Number(v) || 0; }"
                      ></v-text-field>
                    </span>
                    <span class="text-caption text-medium-emphasis">自「{{ handoverSourceLabel(cat) }}」池 {{ money(handoverInfo(cat).sourcePool) }} 元提撥</span>
                    <v-spacer></v-spacer>
                    <v-chip size="small" color="primary" variant="tonal">暫留 {{ money(handoverInfo(cat).amount) }} 元・本期不發放</v-chip>
                  </template>
                  <template v-else>
                    <span class="text-caption text-medium-emphasis">本戶不提撥，「{{ handoverSourceLabel(cat) }}」全額分配給人員</span>
                  </template>
                </div>
                <div v-if="isHandoverOn(cat)" class="text-caption text-medium-emphasis mt-1">
                  提撥後「{{ handoverSourceLabel(cat) }}」實際分配池 {{ money(result.pools[handoverInfo(cat).sourceCatKey] || 0) }} 元；暫留金額不計入任何人員小計／實發，日後另製交屋獎金時發放。
                  <span v-if="!handoverInfo(cat).sourceCatKey" class="text-error">（找不到來源類別，請至設定分頁指定）</span>
                </div>
              </div>
            </template>
          </div>

          <!-- ========== ③ 結果 ========== -->
          <div class="step-h mt-4">
            <span class="step-no">3</span>
            <span class="step-title">每人獎金結果</span>
            <span class="text-caption text-medium-emphasis">保留款／稅金／二代健保比例與備註可直接改（跨戶共用）</span>
          </div>
          <div class="step-body">
            <div class="table-scroll">
              <v-table density="compact" class="matrix-table">
                <thead>
                  <tr>
                    <th>人員</th><th>職務/來源</th>
                    <th v-for="cat in payCategories" :key="cat.key" class="text-right">{{ cat.label }}</th>
                    <th class="text-right">小計</th>
                    <th class="text-right">保留款</th><th class="text-right">稅金</th><th class="text-right">二代健保</th>
                    <th class="text-right">實發</th><th class="col-remark">備註</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-if="!result.people.length">
                    <td :colspan="payCategories.length + 8" class="text-center text-medium-emphasis">尚未選擇任何人員，請於步驟 2 點選</td>
                  </tr>
                  <tr v-for="p in result.people" :key="p.personKey">
                    <td class="font-weight-medium">
                      {{ p.name }}
                      <span v-if="profileOf(p.personKey).segmentLabel" class="text-caption text-medium-emphasis ml-1">{{ profileOf(p.personKey).segmentLabel }}</span>
                    </td>
                    <td>
                      {{ p.role || '—' }}
                      <v-chip v-if="p.sourceProjectId && p.sourceProjectId !== projectId" size="x-small" color="default" variant="tonal">{{ p.sourceProjectName || p.sourceProjectId }}</v-chip>
                    </td>
                    <td v-for="cat in payCategories" :key="cat.key" class="text-right" :class="{ 'text-disabled': !p.amounts[cat.key] }">
                      {{ money(p.amounts[cat.key] || 0) }}
                    </td>
                    <td class="text-right font-weight-medium">{{ money(p.subtotal) }}</td>
                    <td class="text-right">
                      <input class="pct-input" type="number" step="0.01" :value="profileOf(p.personKey).keepPct" @change="e => setProfile(p.personKey, 'keepPct', e.target.value)">%
                      <div class="text-caption text-medium-emphasis">{{ money(p.keep) }}</div>
                    </td>
                    <td class="text-right">
                      <input class="pct-input" type="number" step="0.01" :value="profileOf(p.personKey).taxPct" @change="e => setProfile(p.personKey, 'taxPct', e.target.value)">%
                      <div class="text-caption text-medium-emphasis">{{ money(p.tax) }}</div>
                    </td>
                    <td class="text-right">
                      <input class="pct-input" type="number" step="0.01" :value="profileOf(p.personKey).nhiPct" @change="e => setProfile(p.personKey, 'nhiPct', e.target.value)">%
                      <div class="text-caption text-medium-emphasis">{{ money(p.nhi) }}</div>
                    </td>
                    <td class="text-right text-high-emphasis font-weight-bold">{{ money(p.net) }}</td>
                    <td class="col-remark">
                      <input class="rmk-input" type="text" :value="profileOf(p.personKey).remark" @change="e => setProfile(p.personKey, 'remark', e.target.value)">
                    </td>
                  </tr>
                </tbody>
              </v-table>
            </div>
            <div v-if="result.handoverTotal" class="text-caption text-medium-emphasis mt-1">
              另有 {{ handoverLabel }}暫留 {{ money(result.handoverTotal) }} 元（本期不發放，未計入上表）。
            </div>
          </div>
          </div>
        </v-card-text>
      </div>
    </v-expand-transition>

    <CrossProjectPersonPicker
      v-model="pickerOpen"
      :project-id="projectId"
      @select="onPickPerson"
    />
  </v-card>
</template>

<script setup>
import { contractTypeColor } from '@/utils/contractTypeColor';
import { useCommissionPlan } from '@/composables/useCommissionPlan';
import { isNonGeneralContract, defaultManualFloor } from '@/utils/commissionPlans';
const { plan } = useCommissionPlan();
import { ref, computed, watch } from 'vue';
import { useToast } from 'vue-toastification';
import AllocationEditor from './AllocationEditor.vue';
import CrossProjectPersonPicker from './CrossProjectPersonPicker.vue';
import {
  calcUnitBonus, money, toNum, round2, formatDateTW, evenShares, paymentRatioPct,
  matchesRolePositions, isHandoverCategory, resolveCommPct, categoryDefaultPersons,
} from '@/utils/commissionCalculation';
import { bonusSegments, segmentForDate, segmentLabel } from '@/utils/bonusSegments';
import { resolveDisplayNotes, formatNoteTime, categoryMeta } from '@/utils/remarkNotes';

const props = defineProps({
  entry: { type: Object, required: true },
  settings: { type: Object, required: true },
  profiles: { type: Object, required: true },        // profileKey -> profile（reactive，跨卡共用）
  resolveProfileKey: { type: Function, default: k => k },   // personKey -> profileKey（一人多段進退場時依本戶簽約日區分）
  projectId: { type: String, required: true },
  projectName: { type: String, default: '' },
  localPersonnel: { type: Array, default: () => [] },
  claimedPct: { type: Number, default: 0 },
});

const emit = defineEmits(['remove', 'toggle']);
const toast = useToast();

// 切換為拆價且尚未填底價時，預設配套房屋總價減車位底價。
function setPriceSource(value) {
  props.entry.priceSource = value;
  if (props.entry.manualFloor === null || props.entry.manualFloor === undefined || props.entry.manualFloor === '') {
    props.entry.manualFloor = defaultManualFloor(props.entry.unit, props.entry.finance.parkFloor, value);
  }
}

const pickerOpen = ref(false);
const pickerTargetCat = ref('');

const enabledCategories = computed(() =>
  (props.settings.bonusCategories || [])
    .filter(c => c.enabled !== false)
    .slice()
    .sort((a, b) => (a.order || 0) - (b.order || 0))
);
/** 發放類別（分配給人員）；提撥類別（交屋團獎）另列 */
const payCategories = computed(() => enabledCategories.value.filter(c => !isHandoverCategory(c)));
const handoverCategories = computed(() => enabledCategories.value.filter(isHandoverCategory));
const handoverLabel = computed(() => handoverCategories.value.map(c => c.label).join('／') || '交屋團獎');

const noteText = computed(() => String(props.entry.unit.remarks || ''));
const hasNote = computed(() => noteText.value.trim() !== '');
const feeHint = computed(() => hasNote.value && /介紹|贈品/.test(noteText.value));
/** 備註分段：優先用留言式 remarkNotes，沒有則以舊字串備註呈現（換行保留） */
const displayNotes = computed(() => {
  const u = props.entry.unit || {};
  return resolveDisplayNotes(u.remarkNotes, u.remarks)
    .map(n => {
      let name = n.authorName || '';
      if (n.type === 'legacy') name = '舊備註';
      else if (n.type === 'system') name = n.authorName ? `系統·${n.authorName}` : '系統';
      const showCat = n.type === 'user' && n.category && n.category !== 'general';
      return {
        noteId: n.noteId,
        pinned: !!n.pinned,
        time: formatNoteTime(n.createdAt),
        name,
        catLabel: showCat ? categoryMeta(n.category).label : '',
        catColor: categoryMeta(n.category).color,
        content: String(n.content || '').trim(),
      };
    })
    .filter(n => n.content);
});
const contractDateText = computed(() => formatDateTW(props.entry.unit.payment_contract_date));
const depositDateText = computed(() => formatDateTW(props.entry.unit.payment_deposit_date));
const paymentRatio = computed(() => paymentRatioPct(props.entry.unit, props.entry.finance.transactionTotal));

const hasValidFloor = computed(() => {
  if (!props.entry.finance.manualFloorRequired) return true;
  const value = props.entry.manualFloor;
  return value !== null && value !== undefined && String(value).trim() !== '' && Number.isFinite(Number(value)) && Number(value) >= 0;
});
const defaultCommPct = computed(() => resolveCommPct(props.settings, !!props.entry.unit.isPreferredPayment));
const customCommPct = computed(() => toNum(props.entry.commPct) !== defaultCommPct.value);
const totalPct = computed(() => props.claimedPct + toNum(props.entry.ratioPct));
const ratioOver = computed(() => totalPct.value > 100.0001);
const unitSalesText = computed(() => normalizeNames(props.entry.unit.salesperson).join('、'));

// ---------- 版面開關 ----------
const showCalc = ref(false);
const showAdvanced = ref(false);
const editingPeople = ref(false);
const showNote = ref(false);
const advancedSummary = computed(() => {
  const parts = [];
  if (toNum(props.entry.partyAFee)) parts.push(`${props.settings.partyALabel} ${money(props.entry.partyAFee)}`);
  if (toNum(props.entry.partyBFee)) parts.push(`${props.settings.partyBLabel} ${money(props.entry.partyBFee)}`);
  if (toNum(props.entry.keepPct) !== toNum(props.settings.defaultKeepPct)) parts.push(`保留款 ${props.entry.keepPct}%`);
  return parts.join('・');
});

/** 即時計算（分配/比例/介紹費任一變動即重算） */
const pk = personKey => props.resolveProfileKey(personKey);
/** 本戶參與人員的 profile（personKey → 依簽約日解析的段落費率） */
const entryProfiles = computed(() => {
  const map = {};
  Object.values(props.entry.categories).forEach(c => c.allocations.forEach(a => {
    const prof = props.profiles[pk(a.personKey)] || props.profiles[a.personKey];
    if (prof) map[a.personKey] = prof;
  }));
  return map;
});
const result = computed(() => calcUnitBonus(props.entry.finance, {
  ratioPct: toNum(props.entry.ratioPct),
  commPct: toNum(props.entry.commPct),
  keepPct: toNum(props.entry.keepPct),
  partyAFee: toNum(props.entry.partyAFee),
  partyBFee: toNum(props.entry.partyBFee),
  categories: props.entry.categories,
}, entryProfiles.value));

/** 尚未選人的發放類別（比例 > 0 者） */
const missingCats = computed(() => payCategories.value.filter(cat => {
  const c = props.entry.categories[cat.key];
  return c && toNum(c.ratePct) > 0 && c.allocations.length === 0;
}));
/** 有類別尚未選人或分配有誤時自動展開；選完不自動收合，由使用者按「完成設定」收起 */
watch(() => missingCats.value.length + result.value.errors.length, n => { if (n > 0) editingPeople.value = true; }, { immediate: true });
/** 待處理項目數：未選人類別 + 分配錯誤 + 比例問題 */
const issueCount = computed(() =>
  missingCats.value.length + result.value.errors.length + props.entry.finance.errors.length + (ratioOver.value || !(toNum(props.entry.ratioPct) > 0) ? 1 : 0)
);

defineExpose({ result, issueCount });

// ---------- 提撥類別（交屋團獎）本戶開關 ----------
function isHandoverOn(cat) {
  const c = props.entry.categories[cat.key];
  return !!c && c.enabled !== false;
}
function setHandoverOn(cat, v) {
  const c = props.entry.categories[cat.key];
  if (c) c.enabled = !!v;
}

/** 提撥類別（交屋團獎）本戶計算結果 */
function handoverInfo(cat) {
  return result.value.handover?.[cat.key] || { sourceCatKey: '', ratePct: 0, sourcePool: 0, amount: 0 };
}

function handoverSourceLabel(cat) {
  const key = handoverInfo(cat).sourceCatKey;
  if (!key) return '—';
  return props.entry.categories[key]?.label
    || (props.settings.bonusCategories || []).find(c => c.key === key)?.label
    || key;
}

function round1(n) { return Math.round((Number(n) || 0) * 10) / 10; }
function fmtWan(n, d = 2) {
  return (Number(n) || 0).toLocaleString('en-US', { maximumFractionDigits: d });
}

function onRatioInput(v) {
  const maxPct = Math.max(0, round1(100 - props.claimedPct));
  let val = Number(v) || 0;
  if (val > maxPct) {
    val = maxPct;
    toast.warning(`已請＋本次不可超過 100%，已調整為 ${val}%`);
  }
  props.entry.ratioPct = val;
}

// ---------- 候選人員 ----------
function personKeyOf(p) { return p.phone || `ext:${p.name}`; }

/** 依簽約日找此人適用的進退場段落（無設定 → 一律合格） */
function segmentOf(p, contractDate) {
  return segmentForDate(bonusSegments(p?.bonusConfig), contractDate);
}
function qualified(p, contractDate) {
  return segmentOf(p, contractDate).matched;
}
/** 團隊類別職務條件：有設定對應職務者採精確比對；未設定則沿用預設關鍵字（專案／副專／銷售） */
function teamRoleOk(p, cat) {
  if ((cat?.rolePositions || []).length) return matchesRolePositions(p.positions, cat.rolePositions);
  return (p.positions || []).some(pos => ['專案', '副專', '銷售'].some(r => String(pos).includes(r)));
}

const poolOptionsByCat = computed(() => {
  const map = {};
  const contractDate = props.entry.unit.payment_contract_date;
  payCategories.value.forEach(cat => {
    let list = [];
    const defaultPersons = categoryDefaultPersons(cat, props.localPersonnel);
    if (defaultPersons.length) {
      // 設定頁指定「預設人員」：候選只列這些人（其他人可用「加入他案／臨時人員」加入）
      list = defaultPersons.map(dp => ({ personKey: dp.personKey, name: dp.name, hint: dp.isExternal ? '預設人員（未在人員名單）' : '預設人員', disabled: false, rates: dp.rates }));
    } else if (cat.mode === 'role') {
      list = props.localPersonnel
        .filter(p => matchesRolePositions(p.positions, cat.rolePositions))
        .map(p => ({ personKey: personKeyOf(p), name: p.name, hint: '', disabled: false }));
    } else if (cat.mode === 'team') {
      list = props.localPersonnel
        .filter(p => teamRoleOk(p, cat))
        .map(p => {
          const { segment: seg, matched: ok } = segmentOf(p, contractDate);
          return {
            personKey: personKeyOf(p), name: p.name,
            hint: `${seg?.inDate || '?'}~${seg?.outDate || '在案中'}${ok ? '' : '・資格不符'}`,
            disabled: !ok,
          };
        });
    } else {
      // individual：本案「銷售」職務人員；該戶銷售人員標記
      const unitSales = normalizeNames(props.entry.unit.salesperson);
      list = props.localPersonnel
        .filter(p => (p.positions || []).some(pos => String(pos).includes('銷售')))
        .map(p => ({
          personKey: personKeyOf(p), name: p.name,
          hint: unitSales.includes(p.name) ? '本戶銷售' : '',
          disabled: false,
        }));
      // 該戶銷售人員若不在名單中，也列為候選（以姓名為 key）
      unitSales.forEach(nm => {
        if (!list.some(o => o.name === nm)) {
          list.push({ personKey: `ext:${nm}`, name: nm, hint: '本戶銷售（未在人員名單）', disabled: false });
        }
      });
    }
    // 註冊 profile（供計算扣款）
    list.forEach(o => ensureLocalProfile(o.personKey, o.name, o.rates || null));
    map[cat.key] = list;
  });
  return map;
});

function normalizeNames(v) {
  if (Array.isArray(v)) return v.map(s => String(s).trim()).filter(Boolean);
  if (typeof v === 'string') return v.split(/[、,，\/\s]+/).map(s => s.trim()).filter(Boolean);
  return [];
}

function ensureLocalProfile(personKey, name, rates = null) {
  const key = pk(personKey);
  if (props.profiles[key]) return;
  const p = props.localPersonnel.find(x => personKeyOf(x) === personKey || x.name === name);
  const segs = bonusSegments(p?.bonusConfig);
  const seg = segmentForDate(segs, props.entry.unit.payment_contract_date).segment || {};
  props.profiles[key] = {
    name: p?.name || name,
    role: (p?.positions || []).join('、'),
    keepPct: toNum(seg.keepPct),
    taxPct: toNum(seg.taxPct),
    nhiPct: toNum(seg.nhiPct),
    remark: seg.remark || '',
    segmentLabel: segs.length > 1 ? segmentLabel(seg) : '',
    sourceProjectId: props.projectId,
    sourceProjectName: props.projectName,
  };
  if (rates) ['keepPct', 'taxPct', 'nhiPct'].forEach(k => { if (rates[k] !== undefined) props.profiles[key][k] = toNum(rates[k]); });
}

function profileOf(personKey) {
  if (!props.profiles[pk(personKey)]) ensureLocalProfile(personKey, personKey);
  return props.profiles[pk(personKey)];
}

function setProfile(personKey, field, value) {
  const prof = profileOf(personKey);
  if (field === 'remark') prof.remark = String(value || '');
  else prof[field] = round2(Number(value) || 0);
}

// ---------- 團獎案場 ----------
function toggleTeamSite(key) {
  const idx = props.entry.teamSiteKeys.indexOf(key);
  if (idx >= 0) props.entry.teamSiteKeys.splice(idx, 1);
  else props.entry.teamSiteKeys.push(key);
  applyTeamDefaults();
}

/** 依勾選的團獎分組 + 進退場資格，重設 team 類別的預設名單（均分） */
function applyTeamDefaults() {
  const contractDate = props.entry.unit.payment_contract_date;
  enabledCategories.value.filter(c => c.mode === 'team').forEach(cat => {
    const defaultPersons = categoryDefaultPersons(cat, props.localPersonnel);
    if (defaultPersons.length) {
      // 有預設人員的團隊類別：不依分組重設，固定帶入預設人員（均分）
      const allocations = defaultPersons.map(dp => {
        ensureLocalProfile(dp.personKey, dp.name, dp.rates);
        return {
          personKey: dp.personKey, name: dp.name,
          sourceProjectId: props.projectId, sourceProjectName: props.projectName,
          isExternal: dp.isExternal, mode: 'pct', sharePct: 0, lockedAmount: null,
        };
      });
      const shares = evenShares(allocations.length);
      allocations.forEach((a, i) => { a.sharePct = shares[i]; });
      props.entry.categories[cat.key].allocations = allocations;
      return;
    }
    const sel = [];
    props.localPersonnel.forEach(p => {
      // 依簽約日取適用段落的團獎分組；不在任何段內者不自動帶入（可手動加入）
      const { segment: seg, matched } = segmentOf(p, contractDate);
      const groups = Array.isArray(seg?.teamGroupKeys) ? seg.teamGroupKeys : [];
      const inSite = groups.some(g => props.entry.teamSiteKeys.includes(g));
      // 團獎分組 且 職務符合（類別未設對應職務時不限職務）
      const roleOk = (cat.rolePositions || []).length ? matchesRolePositions(p.positions, cat.rolePositions) : true;
      if (inSite && matched && roleOk) sel.push(p);
    });
    const allocations = sel.map(p => {
      ensureLocalProfile(personKeyOf(p), p.name);
      return {
        personKey: personKeyOf(p), name: p.name,
        sourceProjectId: props.projectId, sourceProjectName: props.projectName,
        isExternal: false, mode: 'pct', sharePct: 0, lockedAmount: null,
      };
    });
    const shares = evenShares(allocations.length);
    allocations.forEach((a, i) => { a.sharePct = shares[i]; });
    props.entry.categories[cat.key].allocations = allocations;
  });
}

// ---------- 跨案人員 ----------
function openPicker(catKey) {
  pickerTargetCat.value = catKey;
  pickerOpen.value = true;
}

function onPickPerson(person) {
  const cat = props.entry.categories[pickerTargetCat.value];
  if (!cat) return;
  if (cat.allocations.some(a => a.personKey === person.personKey)) {
    toast.warning(`${person.name} 已在此類別名單中`);
    return;
  }
  // 註冊 profile（帶入原案扣款設定，可覆寫）
  if (!props.profiles[pk(person.personKey)]) {
    props.profiles[pk(person.personKey)] = {
      name: person.name,
      role: person.role || '',
      keepPct: toNum(person.profile?.keepPct),
      taxPct: toNum(person.profile?.taxPct),
      nhiPct: toNum(person.profile?.nhiPct),
      remark: person.profile?.remark || '',
      sourceProjectId: person.sourceProjectId,
      sourceProjectName: person.sourceProjectName,
    };
  }
  cat.allocations.push({
    personKey: person.personKey,
    name: person.name,
    sourceProjectId: person.sourceProjectId,
    sourceProjectName: person.sourceProjectName,
    isExternal: !!person.isExternal,
    mode: 'pct',
    sharePct: 0,
    lockedAmount: null,
  });
  // 均分 pct 模式
  const pcts = cat.allocations.filter(a => a.mode !== 'locked');
  const shares = evenShares(pcts.length);
  pcts.forEach((a, i) => { a.sharePct = shares[i]; });
}
</script>

<style scoped>
.unit-card { border-radius: 12px; overflow: visible; scroll-margin-top: 80px; border-color: #ddd; }
.card-head { background: #fff; border-radius: 12px 12px 0 0; }
/* 步驟標題 */
.step-h { display: flex; align-items: center; flex-wrap: wrap; gap: 8px; margin-bottom: 8px; }
.step-no {
  width: 22px; height: 22px; border-radius: 50%; background: #eee; color: #555;
  font-size: 12px; font-weight: 700; display: inline-flex; align-items: center; justify-content: center;
}
.step-title { font-size: 14px; font-weight: 700; color: #334; }
.step-body { padding-left: 30px; }
@media (max-width: 600px) { .step-body { padding-left: 0; } }
/* 請佣比例進度條 */
.ratio-bar { height: 6px; border-radius: 3px; background: #e8ecf3; display: flex; overflow: hidden; }
.ratio-bar .seg.done { background: #9aa8c0; }
.ratio-bar .seg.now { background: rgb(var(--v-theme-primary)); }
.adv-row { background: #f5f5f5; border-radius: 8px; margin: 0; padding: 6px 4px 2px; }
/* 試算結果條 */
.result-strip { display: flex; flex-wrap: wrap; gap: 6px; }
.rs-item { background: #f5f5f5; border-radius: 6px; padding: 4px 10px; min-width: 120px; }
.rs-item label { display: block; font-size: 11px; color: #789; }
.rs-item div { font-weight: 700; font-size: 13px; font-variant-numeric: tabular-nums; }
.rs-item.hl { background: #fff; }
.rs-item.hl div { color: #263238; }
.team-site { background: #f5f5f5; border-radius: 8px 8px 0 0; padding: 8px 10px; margin-top: 10px; }
.team-site.is-empty { background: #fff7e6; }
.team-site + .allocation-editor { margin-top: 0; border-top-left-radius: 0; border-top-right-radius: 0; }
.handover-box {
  border: 1px solid #ddd; border-radius: 8px; padding: 6px 12px 8px; margin-bottom: 10px; background: #fafafa;
}
.handover-box.off { border-color: #d5d9e0; background: #f8f9fb; }
/* 戶別資訊：自適應網格，全寬時 7 欄一列、窄螢幕自動換行（手機 2 欄） */
.info-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 6px; }
.ro-field { background: #f8fafc; border-radius: 6px; padding: 4px 8px; min-height: 46px; }
.ro-field label { display: block; font-size: 11px; color: #789; }
.ro-field div { font-weight: 600; font-size: 13px; }
.table-scroll { overflow-x: auto; }
.claim-table th, .claim-table td { white-space: nowrap; text-align: right; }
.claim-table th { text-align: center; }
.matrix-table th, .matrix-table td { white-space: nowrap; }
.matrix-table .col-remark { width: 100%; min-width: 160px; }
.pct-input { width: 58px; border: 1px solid #cdd8ec; border-radius: 4px; padding: 1px 4px; text-align: right; font-size: 12px; }
.rmk-input { width: 100%; min-width: 130px; border: 1px solid #cdd8ec; border-radius: 4px; padding: 1px 6px; font-size: 12px; }
/* 銷控備註：一則一段 */
.note-alert :deep(.v-alert__content) { min-width: 0; }
.note-list { display: flex; flex-direction: column; gap: 6px; }
.note-item { background: rgba(255, 255, 255, .7); border-radius: 6px; padding: 5px 10px; }
.note-meta { display: flex; align-items: center; flex-wrap: wrap; gap: 6px; font-size: 11px; opacity: .8; margin-bottom: 2px; }
.note-content { font-size: 13px; line-height: 1.55; white-space: pre-wrap; word-break: break-word; }
.unit-toggle { display: flex; align-items: center; flex-wrap: wrap; gap: 8px; flex: 1; text-align: left; min-width: 180px; padding: 4px 0; }
.unit-toggle:focus-visible { outline: 2px solid rgb(var(--v-theme-primary)); outline-offset: 4px; }
.head-dates { display: inline-flex; flex-wrap: wrap; gap: 4px 10px; font-variant-numeric: tabular-nums; }
.head-dates b { font-weight: 600; color: #334155; }
.head-amount { font-size: 18px; font-weight: 700; font-variant-numeric: tabular-nums; }
.head-amount small { font-size: 12px; font-weight: 400; }
.people-summary { display: flex; align-items: center; flex-wrap: wrap; gap: 12px; padding: 10px 0; }
.rs-item.hl div { font-size: 22px; }
@media (max-width: 600px) {
  .card-head { display: grid !important; grid-template-columns: 1fr auto; }
  .unit-toggle { grid-column: 1; grid-row: 1; min-width: 0; }
  .remove-unit { grid-column: 2; grid-row: 1; }
  .head-amount { grid-column: 1; grid-row: 2; }
}
.finance-summary { flex-basis: 100%; width: 100%; display: grid; grid-template-columns: repeat(5, minmax(0, 1fr)); gap: 12px; border-top: 1px solid #e5e7eb; padding-top: 12px; margin-top: 4px; }
.finance-metric { min-width: 0; }
.finance-metric dd.commission-rate-input { margin-top: 10px; margin-bottom: 4px; }
.finance-metric dt { display: flex; align-items: baseline; gap: 6px; font-size: 12px; color: #555; }
.metric-unit { font-size: 11px; color: #666; }
.finance-metric dd { margin: 2px 0; font-size: 22px; line-height: 1.25; font-weight: 700; font-variant-numeric: tabular-nums; overflow-wrap: anywhere; }
.metric-note { display: block; font-size: 11px; color: #666; line-height: 1.4; }
@media (max-width: 600px) {
  .finance-summary { grid-column: 1 / -1; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px 16px; padding-top: 8px; }
  .finance-metric dd { font-size: 19px; }
}
/* 留出浮動選單按鈕的空間；標頭只在本戶卡片範圍內固定。 */
.unit-card.is-expanded > .card-head {
  position: sticky;
  top: calc(var(--v-layout-top, 0px) + 56px);
  z-index: 5;
  box-shadow: 0 1px 0 #ddd, 0 3px 8px #0000000a;
}
</style>
