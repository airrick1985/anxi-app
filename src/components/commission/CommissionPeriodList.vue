<template>
  <div>
    <div v-if="loading" class="text-center py-10">
      <v-progress-circular indeterminate color="primary"></v-progress-circular>
    </div>
    <template v-else>
      <!-- 工具列 -->
      <div class="d-flex align-center flex-wrap ga-2 mb-3">
        <v-switch v-model="showVoided" label="顯示作廢紀錄" color="error" density="compact" hide-details class="mr-2"></v-switch>
        <span v-if="totalVoided" class="text-caption text-medium-emphasis">（共 {{ totalVoided }} 筆已作廢）</span>
        <v-spacer></v-spacer>
        <v-btn size="small" variant="text" prepend-icon="mdi-clipboard-text-clock-outline" @click="openAudit">操作紀錄</v-btn>
      </div>

      <v-alert v-if="!periods.length" type="info" variant="tonal">
        目前沒有任何請佣紀錄。可於「請佣工作台」建立，或用「歷史匯入」銜接舊資料。
      </v-alert>

      <v-expansion-panels v-else variant="accordion" multiple>
        <v-expansion-panel v-for="pd in periods" :key="pd.period">
          <v-expansion-panel-title>
            <div class="d-flex align-center flex-wrap ga-2 w-100">
              <span class="text-subtitle-1 font-weight-bold" :class="{ 'text-medium-emphasis': !pd.activeCount }">第 {{ pd.period }} 期</span>
              <v-chip size="x-small" variant="tonal">{{ pd.requestDate || '—' }}</v-chip>
              <v-chip v-if="pd.activeCount" size="x-small" variant="tonal" color="primary">{{ pd.activeCount }} 戶</v-chip>
              <v-chip v-if="!pd.activeCount && pd.voidedCount" size="x-small" variant="flat" color="error">已全數作廢</v-chip>
              <v-chip v-else-if="pd.voidedCount" size="x-small" variant="tonal" color="error">作廢 {{ pd.voidedCount }} 戶</v-chip>
              <v-chip v-if="pd.hasImport" size="x-small" variant="tonal" color="grey">含歷史匯入</v-chip>
              <v-spacer></v-spacer>
              <span v-if="pd.activeCount" class="text-body-2 mr-2">實際請領 <b class="text-primary">{{ money(pd.claimSum) }}</b>｜本次請佣 <b class="text-success">{{ money(pd.thisClaimSum) }}</b>｜獎金實發 <b>{{ money(pd.netSum) }}</b></span>
              <v-btn v-if="pd.activeCount" size="small" variant="tonal" color="primary" prepend-icon="mdi-file-export-outline"
                @click.stop="$emit('export-period', pd.period)">匯出此期</v-btn>
              <v-menu v-if="canManage">
                <template #activator="{ props: mp }">
                  <v-btn v-bind="mp" icon="mdi-dots-vertical" size="small" variant="text" @click.stop></v-btn>
                </template>
                <v-list density="compact" min-width="240">
                  <v-list-subheader>第 {{ pd.period }} 期管理</v-list-subheader>
                  <v-list-item prepend-icon="mdi-cancel" title="整期作廢" :disabled="!pd.activeCount"
                    subtitle="回溯全部戶別比例、連動作廢獎金明細" @click="openVoidPeriod(pd)"></v-list-item>
                  <v-list-item prepend-icon="mdi-delete-sweep-outline" title="清除已作廢紀錄" :disabled="!pd.voidedCount"
                    :subtitle="pd.voidedCount ? `實體刪除 ${pd.voidedCount} 筆作廢請佣紀錄` : '此期沒有作廢紀錄'" @click="openPurge(pd)"></v-list-item>
                  <v-list-item prepend-icon="mdi-database-import-outline" title="重新匯入此期"
                    subtitle="切到歷史匯入並預帶此期別（覆蓋）" @click="$emit('reimport-period', pd.period)"></v-list-item>
                  <template v-if="pd.batches.length">
                    <v-divider class="my-1"></v-divider>
                    <v-list-subheader>匯入批次</v-list-subheader>
                    <v-list-item v-for="b in pd.batches" :key="b.batchId" prepend-icon="mdi-undo-variant"
                      :title="`撤銷匯入（${b.count} 筆）`"
                      :subtitle="`${b.fileName || b.batchId}｜${b.createdBy || '—'}`"
                      @click="openUndo(pd, b)"></v-list-item>
                  </template>
                </v-list>
              </v-menu>
            </div>
          </v-expansion-panel-title>
          <v-expansion-panel-text>
            <v-alert v-if="!pd.activeCount" type="warning" variant="tonal" density="compact" class="mb-3">
              此期所有請佣紀錄皆已作廢。可由右上「⋯」選單清除作廢紀錄，或「重新匯入此期」。
              <span v-if="!showVoided">開啟「顯示作廢紀錄」可查看原始資料。</span>
            </v-alert>
            <div class="table-scroll">
              <v-table density="compact">
                <thead>
                  <tr>
                    <th>戶別</th><th>買方</th><th>請佣日期</th>
                    <th class="text-right">請佣比例</th><th class="text-right">佣金比例</th>
                    <th class="text-right">折數後總價(萬)</th>
                    <th class="text-right">實際請領(元)</th><th class="text-right">保留款(元)</th><th class="text-right">本次請佣(元)</th>
                    <th class="text-center">人數</th><th>狀態</th><th></th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="r in visibleRecords(pd)" :key="r.id" :class="{ 'voided-row': r.status === 'voided' }">
                    <td class="font-weight-medium">{{ r.unitId }}</td>
                    <td>{{ r.snapshot?.buyerName || '—' }}</td>
                    <td>{{ r.requestDate || '—' }}</td>
                    <td class="text-right">{{ r.ratioPct }}%</td>
                    <td class="text-right">{{ (Number(r.commPct) || 0).toFixed(2) }}%</td>
                    <td class="text-right">{{ money(r.calc?.dealAfter || 0) }}</td>
                    <td class="text-right">{{ money(r.calc?.realClaim || 0) }}</td>
                    <td class="text-right">{{ money(r.calc?.claimKeep || 0) }}</td>
                    <td class="text-right font-weight-bold">{{ money(r.calc?.thisClaim || 0) }}</td>
                    <td class="text-center">{{ bonusCountOf(r.id) }}</td>
                    <td>
                      <v-chip v-if="r.status === 'voided'" size="x-small" color="error" variant="tonal" :title="r.voidReason">已作廢</v-chip>
                      <v-chip v-else-if="r.source === 'import'" size="x-small" color="grey" variant="tonal" :title="r.importFileName || r.importBatchId">匯入</v-chip>
                      <v-chip v-else size="x-small" color="success" variant="tonal">有效</v-chip>
                    </td>
                    <td>
                      <v-btn v-if="r.status !== 'voided'" size="x-small" variant="text" color="error" @click="openVoid(r)">作廢</v-btn>
                      <span v-else class="text-caption text-medium-emphasis" :title="r.voidReason">{{ r.voidedBy }}</span>
                    </td>
                  </tr>
                  <tr v-if="!visibleRecords(pd).length">
                    <td colspan="12" class="text-center text-medium-emphasis py-3">沒有可顯示的紀錄</td>
                  </tr>
                </tbody>
              </v-table>
            </div>

            <!-- 每人獎金彙總（該期，僅有效） -->
            <template v-if="pd.people.length">
              <div class="text-caption font-weight-bold mt-3 mb-1">本期每人獎金彙總（有效紀錄）</div>
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
                    <tr v-for="p in pd.people" :key="p.personKey">
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
            </template>
          </v-expansion-panel-text>
        </v-expansion-panel>
      </v-expansion-panels>
    </template>

    <!-- 單筆作廢 dialog -->
    <v-dialog v-model="voidOpen" max-width="460" persistent>
      <v-card>
        <v-card-title class="text-subtitle-1 text-error">
          <v-icon start>mdi-alert-circle-outline</v-icon>作廢請佣紀錄
        </v-card-title>
        <v-card-text>
          <p class="mb-2">
            確定作廢 <b>第 {{ voidTarget?.period }} 期／{{ voidTarget?.unitId }}</b> 的請佣紀錄？
          </p>
          <ul class="text-body-2 mb-3 pl-4">
            <li>該戶「已請比例」將回溯 {{ voidTarget?.ratioPct }}%（可重新請佣）</li>
            <li>關聯的每人獎金明細將一併作廢，不再列入統計與匯出</li>
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
            <v-col cols="4"><div class="impact-tile"><label>請佣紀錄</label><div>{{ periodTarget.activeCount }} <small>戶</small></div></div></v-col>
            <v-col cols="4"><div class="impact-tile"><label>獎金明細</label><div>{{ periodBonusCount(periodTarget) }} <small>筆</small></div></div></v-col>
            <v-col cols="4"><div class="impact-tile"><label>本次請佣合計</label><div>{{ money(periodTarget.thisClaimSum) }}</div></div></v-col>
          </v-row>
          <div class="text-caption text-medium-emphasis mb-1">各戶「已請比例」回溯：</div>
          <div class="d-flex flex-wrap ga-1 mb-3">
            <v-chip v-for="r in periodTarget.records.filter(x => x.status !== 'voided')" :key="r.id" size="small" variant="tonal" color="error">
              {{ r.unitId }} −{{ r.ratioPct }}%
            </v-chip>
          </div>
          <ul class="text-body-2 mb-3 pl-4">
            <li>此期全部有效請佣紀錄改為「作廢」，每戶已請比例回溯後可重新請佣或重新匯入</li>
            <li>關聯獎金明細一併作廢，不再列入統計與匯出</li>
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
            :disabled="!periodReason.trim() || typedConfirm !== String(periodTarget.period) || payoutsLoading || relatedPayouts.length > 0"
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
            將<b>實體刪除</b>此期 <b>{{ periodTarget.voidedCount }}</b> 筆已作廢請佣紀錄及其關聯的已作廢獎金明細。
          </p>
          <ul class="text-body-2 mb-3 pl-4">
            <li>只會刪除狀態為「已作廢」的資料，有效紀錄不受影響</li>
            <li>已請比例在作廢時已回溯，此步驟不再變動比例</li>
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
import { ref, computed } from 'vue';
import { useToast } from 'vue-toastification';
import { useUserStore } from '@/store/user';
import {
  voidCommissionRecordAPI, voidCommissionPeriodAPI, purgeVoidedCommissionPeriodAPI,
  undoCommissionImportAPI, fetchCommissionAuditLogs, fetchRetentionPayouts,
} from '@/api';
import { money, toNum } from '@/utils/commissionCalculation';

const props = defineProps({
  projectId: { type: String, required: true },
  projectName: { type: String, default: '' },
  settings: { type: Object, required: true },
  records: { type: Array, default: () => [] },
  bonusRecords: { type: Array, default: () => [] },
  loading: { type: Boolean, default: false },
});

const emit = defineEmits(['refresh', 'export-period', 'reimport-period']);
const toast = useToast();
const userStore = useUserStore();

const showVoided = ref(false);

// 單筆作廢
const voidOpen = ref(false);
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

const bonusByRecord = computed(() => {
  const map = {};
  props.bonusRecords.forEach(b => {
    if (!map[b.commissionRecordId]) map[b.commissionRecordId] = [];
    map[b.commissionRecordId].push(b);
  });
  return map;
});

function bonusCountOf(recordId) {
  return (bonusByRecord.value[recordId] || []).length;
}

const totalVoided = computed(() => props.records.filter(r => r.status === 'voided').length);

/** 全建案匯入批次（撤銷時顯示跨期資訊） */
const batchIndex = computed(() => {
  const map = {};
  props.records.forEach(r => {
    if (!r.importBatchId) return;
    if (!map[r.importBatchId]) {
      map[r.importBatchId] = { batchId: r.importBatchId, fileName: r.importFileName || '', createdBy: r.createdBy || '', totalCount: 0, periods: new Set() };
    }
    map[r.importBatchId].totalCount++;
    map[r.importBatchId].periods.add(toNum(r.period));
  });
  return map;
});

const periods = computed(() => {
  const byPeriod = {};
  props.records.forEach(r => {
    const p = toNum(r.period);
    if (!byPeriod[p]) byPeriod[p] = [];
    byPeriod[p].push(r);
  });
  return Object.keys(byPeriod)
    .sort((a, b) => Number(b) - Number(a))
    .map(p => {
      const recs = byPeriod[p].slice().sort((a, b) => String(a.unitId).localeCompare(String(b.unitId), 'zh-Hant'));
      const active = recs.filter(r => r.status !== 'voided');
      const claimSum = active.reduce((s, r) => s + toNum(r.calc?.realClaim), 0);
      const thisClaimSum = active.reduce((s, r) => s + toNum(r.calc?.thisClaim), 0);

      // 該期每人彙總（有效獎金明細）
      const byPerson = {};
      const order = [];
      props.bonusRecords
        .filter(b => toNum(b.period) === Number(p) && b.status !== 'voided')
        .forEach(b => {
          if (!byPerson[b.personKey]) {
            byPerson[b.personKey] = {
              personKey: b.personKey, name: b.name,
              sourceProjectId: b.sourceProjectId, sourceProjectName: b.sourceProjectName,
              subtotal: 0, keep: 0, tax: 0, nhi: 0, net: 0,
            };
            order.push(b.personKey);
          }
          const agg = byPerson[b.personKey];
          agg.subtotal += toNum(b.subtotal); agg.keep += toNum(b.keep);
          agg.tax += toNum(b.tax); agg.nhi += toNum(b.nhi); agg.net += toNum(b.net);
        });
      const people = order.map(k => byPerson[k]);
      const netSum = people.reduce((s, x) => s + x.net, 0);

      // 此期的匯入批次
      const batchMap = {};
      recs.forEach(r => {
        if (!r.importBatchId) return;
        if (!batchMap[r.importBatchId]) {
          batchMap[r.importBatchId] = { batchId: r.importBatchId, fileName: r.importFileName || '', createdBy: r.createdBy || '', count: 0 };
        }
        batchMap[r.importBatchId].count++;
      });

      return {
        period: Number(p),
        records: recs,
        activeCount: active.length,
        voidedCount: recs.length - active.length,
        hasImport: recs.some(r => r.source === 'import'),
        requestDate: (active[0] || recs[0])?.requestDate || '',
        claimSum, thisClaimSum, netSum, people,
        batches: Object.values(batchMap),
      };
    });
});

function visibleRecords(pd) {
  return showVoided.value ? pd.records : pd.records.filter(r => r.status !== 'voided');
}

function periodBonusCount(pd) {
  return props.bonusRecords.filter(b => toNum(b.period) === pd.period && b.status !== 'voided').length;
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
      recordId: voidTarget.value.id,
      voidReason: voidReason.value,
      voidedBy: operatorName.value,
    });
    if (res?.ok) {
      toast.success(`已作廢 ${voidTarget.value.unitId} 的請佣紀錄（連同 ${res.bonusVoided} 筆獎金明細）`);
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
  periodTarget.value = pd;
  periodReason.value = '';
  typedConfirm.value = '';
  relatedPayouts.value = [];
  periodVoidOpen.value = true;
  payoutsLoading.value = true;
  try {
    const all = await fetchRetentionPayouts(props.projectId);
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
      period: periodTarget.value.period,
      voidReason: periodReason.value.trim(),
      voidedBy: operatorName.value,
      operatorKey: operatorKey.value,
    });
    if (res?.ok) {
      toast.success(`第 ${res.period} 期已整期作廢：${res.records} 戶請佣紀錄、${res.bonuses} 筆獎金明細`);
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
      period: periodTarget.value.period,
      purgedBy: operatorName.value,
      operatorKey: operatorKey.value,
    });
    if (res?.ok) {
      toast.success(`第 ${res.period} 期已清除 ${res.records} 筆作廢請佣紀錄、${res.bonuses} 筆獎金明細`);
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
    const logs = await fetchCommissionAuditLogs(props.projectId);
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
.voided-row td { color: #aaa; text-decoration: line-through; }
.voided-row td:last-child, .voided-row td:nth-last-child(2) { text-decoration: none; }
.impact-tile { background: #fdf3f3; border-radius: 8px; padding: 6px 10px; }
.impact-tile label { display: block; font-size: 11px; color: #a55; }
.impact-tile div { font-size: 16px; font-weight: 700; color: #c62828; }
.impact-tile small { font-size: 11px; font-weight: 400; color: #a55; }
</style>
