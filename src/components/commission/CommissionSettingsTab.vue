<template>
  <div>
    <v-form ref="form">
      <!-- 基本比例 -->
      <v-card variant="outlined" class="mb-4">
        <v-card-title class="text-subtitle-1"><v-icon start size="small">mdi-percent</v-icon>基本比例</v-card-title>
        <v-card-text>
          <v-row dense>
            <v-col cols="6" md="3">
              <v-text-field v-model.number="local.defaultCommissionPct" label="預設佣金比例(%)" type="number" step="0.01"
                variant="outlined" density="compact" hint="包櫃/包銷佣金，例 2.2" persistent-hint></v-text-field>
            </v-col>
            <v-col cols="6" md="3">
              <v-text-field v-model.number="local.preferredPaymentFactor" label="優付倍率" type="number" step="0.05"
                variant="outlined" density="compact" hint="優付戶佣金＝預設×倍率（預設 0.5 減半）" persistent-hint></v-text-field>
            </v-col>
            <v-col cols="6" md="3">
              <v-text-field v-model.number="local.defaultKeepPct" label="請佣保留款預設(%)" type="number" step="1"
                variant="outlined" density="compact"></v-text-field>
            </v-col>
            <v-col cols="6" md="3">
              <v-text-field v-model.number="local.defaultCashPct" label="現金比例預設(%)" type="number" step="1"
                variant="outlined" density="compact" hint="其餘為期票比例" persistent-hint></v-text-field>
            </v-col>
          </v-row>
        </v-card-text>
      </v-card>

      <!-- 文字自訂 -->
      <v-card variant="outlined" class="mb-4">
        <v-card-title class="text-subtitle-1"><v-icon start size="small">mdi-format-text</v-icon>文字自訂（依建案/公司調整）</v-card-title>
        <v-card-text>
          <v-row dense>
            <v-col cols="12" md="6">
              <v-text-field v-model="local.partyALabel" label="介紹費欄位 A（計入獎金折數）" variant="outlined" density="compact"></v-text-field>
            </v-col>
            <v-col cols="12" md="6">
              <v-text-field v-model="local.partyBLabel" label="介紹費欄位 B（計入請佣基準）" variant="outlined" density="compact"></v-text-field>
            </v-col>
            <v-col cols="6" md="3">
              <v-text-field v-model="local.projectShortName" label="建案簡稱（檔名用）" variant="outlined" density="compact"></v-text-field>
            </v-col>
            <v-col cols="6" md="3">
              <v-text-field v-model="local.kiloLabel" label="「千4」標籤" variant="outlined" density="compact"></v-text-field>
            </v-col>
            <v-col cols="12" md="6">
              <v-text-field v-model="local.youfuLabelPattern" label="優付列文字（{pct}＝比例）" variant="outlined" density="compact"></v-text-field>
            </v-col>
            <v-col cols="12" md="6">
              <v-text-field v-model="local.claimTitlePattern" label="請佣總表標題（{建案名}{期別中文}{期別}）" variant="outlined" density="compact"></v-text-field>
            </v-col>
            <v-col cols="6" md="3">
              <v-text-field v-model="local.claimFileNamePattern" label="請佣檔名（{簡稱}{期別}{民國年月}）" variant="outlined" density="compact"></v-text-field>
            </v-col>
            <v-col cols="6" md="3">
              <v-text-field v-model="local.bonusFileNamePattern" label="獎金檔名（{簡稱}{期別}{民國年月}）" variant="outlined" density="compact"></v-text-field>
            </v-col>
            <v-col cols="12">
              <v-textarea v-model="local.note1" label="請佣總表條文 1" rows="2" variant="outlined" density="compact"></v-textarea>
            </v-col>
            <v-col cols="12">
              <v-textarea v-model="local.note2" label="請佣總表條文 2" rows="2" variant="outlined" density="compact"></v-textarea>
            </v-col>
          </v-row>
        </v-card-text>
      </v-card>

      <!-- 獎金類別 -->
      <v-card variant="outlined" class="mb-4">
        <v-card-title class="text-subtitle-1 d-flex align-center">
          <v-icon start size="small">mdi-shape-outline</v-icon>獎金類別
          <v-spacer></v-spacer>
          <v-btn size="small" color="primary" variant="tonal" prepend-icon="mdi-plus" @click="addCategory">新增類別</v-btn>
        </v-card-title>
        <v-card-text>
          <ul class="text-caption text-medium-emphasis mb-3 cat-hints">
            <li><b>發放方式</b>：依職務＝發給符合職務的人；個人＝發給該戶銷售；團隊＝依團獎分組發放。</li>
            <li><b>自個獎提撥</b>（交屋團獎）：自「來源類別」（預設銷售個獎）的獎金池提撥「比例(%)」，本期不發放、不分配給人員，暫留供日後另行製作交屋獎金；來源類別以提撥後的餘額分配。</li>
            <li><b>對應職務</b>：可多選，選項是本建案人員的職務；沒有的職務可直接打字新增。</li>
            <li>不用的類別請「停用」，不要刪除，歷史資料才會保留。</li>
          </ul>
          <div class="table-scroll">
            <v-table density="compact" class="cat-table">
              <colgroup>
                <col style="width:72px"><col style="width:168px"><col style="width:144px"><col style="width:198px">
                <col style="width:360px"><col style="width:64px"><col style="width:44px">
              </colgroup>
              <thead>
                <tr>
                  <th>順序</th><th>名稱</th><th>比例(%)</th>
                  <th>發放方式</th><th>對應職務 / 來源類別</th>
                  <th>啟用</th><th></th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(cat, i) in local.bonusCategories" :key="cat.key">
                  <td class="text-no-wrap px-1">
                    <v-btn icon="mdi-arrow-up" size="x-small" variant="text" :disabled="i === 0" @click="moveCat(i, -1)"></v-btn>
                    <v-btn icon="mdi-arrow-down" size="x-small" variant="text" :disabled="i === local.bonusCategories.length - 1" @click="moveCat(i, 1)"></v-btn>
                  </td>
                  <td><v-text-field v-model="cat.label" variant="outlined" density="compact" hide-details></v-text-field></td>
                  <td>
                    <v-text-field v-model.number="cat.ratePct" type="number" step="0.001" variant="outlined" density="compact" hide-details></v-text-field>
                    <div v-if="cat.mode === 'handover'" class="text-caption text-medium-emphasis mt-1">自來源池提撥 %</div>
                  </td>
                  <td>
                    <v-select v-model="cat.mode" :items="modeOptions" item-title="title" item-value="value"
                      variant="outlined" density="compact" hide-details></v-select>
                  </td>
                  <td>
                    <v-select v-if="cat.mode === 'handover'" v-model="cat.sourceCatKey" :items="sourceOptions(cat)"
                      item-title="title" item-value="value" variant="outlined" density="compact" hide-details
                      placeholder="來源類別（預設：個人類別）" clearable></v-select>
                    <v-combobox v-else v-model="cat.rolePositions" :items="projectPositions" multiple chips closable-chips
                      variant="outlined" density="compact" hide-details :disabled="cat.mode !== 'role'"
                      placeholder="選擇或輸入" no-data-text="本建案尚未設定人員職務，可直接輸入新增"
                      :delimiters="[',', '，', '、']">
                      <template #chip="{ item, props: chipProps }">
                        <v-chip v-bind="chipProps" size="x-small" label
                          :color="projectPositions.includes(String(item.value).trim()) ? 'primary' : 'warning'"
                          :title="projectPositions.includes(String(item.value).trim()) ? '' : '本建案目前無人員設定此職務'">
                          {{ item.title }}
                        </v-chip>
                      </template>
                    </v-combobox>
                  </td>
                  <td class="px-1"><v-switch v-model="cat.enabled" color="primary" density="compact" hide-details></v-switch></td>
                  <td class="px-1"><v-btn icon="mdi-delete-outline" size="x-small" variant="text" color="error" @click="removeCat(i)"></v-btn></td>
                </tr>
              </tbody>
            </v-table>
          </div>
        </v-card-text>
      </v-card>

      <!-- 均分尾差處理 -->
      <v-card variant="outlined" class="mb-4">
        <v-card-title class="text-subtitle-1"><v-icon start size="small">mdi-scale-balance</v-icon>均分尾差處理（團獎每人金額是否一致）</v-card-title>
        <v-card-text>
          <div class="text-caption text-medium-emphasis mb-2">
            獎金池 ÷ 人數常有零頭。預設「最後一人吸收尾差」讓合計恰等於獎金池，但最後一人會多或少幾元；
            選擇「每人相同」則所有人金額一致、尾差不發放。僅在該戶為「均分」時生效，自訂比例或鎖定金額不受影響。變更只影響之後的新請佣。
          </div>
          <v-radio-group v-model="local.teamSplitMode" density="compact" hide-details class="split-radios">
            <v-radio v-for="m in splitModes" :key="m.value" :value="m.value" color="primary">
              <template #label>
                <div>
                  <div class="font-weight-medium">{{ m.label }}</div>
                  <div class="text-caption text-medium-emphasis">{{ m.desc }}　例：3 人分 10,000 元 → {{ splitExample(m.value) }}</div>
                </div>
              </template>
            </v-radio>
          </v-radio-group>
          <v-expand-transition>
            <div v-if="local.teamSplitMode !== 'lastAbsorb'" class="mt-3">
              <v-btn-toggle v-model="local.equalSplitScope" mandatory color="primary" variant="outlined" divided density="comfortable">
                <v-btn value="team" size="small">只套用團隊類別（銷售團獎）</v-btn>
                <v-btn value="all" size="small">所有類別的均分都套用</v-btn>
              </v-btn-toggle>
            </div>
          </v-expand-transition>
        </v-card-text>
      </v-card>

      <!-- 個人明細匯出 -->
      <v-card variant="outlined" class="mb-4">
        <v-card-title class="text-subtitle-1"><v-icon start size="small">mdi-account-cash-outline</v-icon>個人明細匯出</v-card-title>
        <v-card-text>
          <div class="text-caption text-medium-emphasis mb-2">
            個人明細預設只列本人銷售的戶別，職務含以下關鍵字者顯示全部戶別。
          </div>
          <v-combobox v-model="local.personDetailShowAllRoles" :items="positionSuggestionItems" multiple chips closable-chips
            variant="outlined" density="compact" label="顯示全部戶別的職務關鍵字" placeholder="輸入後按 Enter，例：專案、主委"
            hint="留空＝所有人都只看本人銷售的戶別" persistent-hint></v-combobox>
        </v-card-text>
      </v-card>

      <!-- 團獎分組（案場） -->
      <v-card variant="outlined" class="mb-4">
        <v-card-title class="text-subtitle-1 d-flex align-center">
          <v-icon start size="small">mdi-account-group-outline</v-icon>團獎分組（案場）
        </v-card-title>
        <v-card-text>
          <ul class="text-caption text-medium-emphasis mb-3 cat-hints">
            <li>團獎要依案場分開發放時，在這裡勾選要納入的案場（選項為您有銷控系統權限的建案）。</li>
            <li>勾選後，到「銷控設定 → 銷售人員 → 請佣獎金設定」設定每位人員所屬的案場。</li>
            <li>不分案場發放時可留空。</li>
          </ul>
          <v-select v-model="teamSiteIds" :items="teamSiteOptions" item-title="label" item-value="key"
            multiple chips closable-chips variant="outlined" density="compact" label="團獎案場"
            placeholder="選擇案場（可多選）" no-data-text="找不到您有銷控系統權限的建案" hide-details>
            <template #chip="{ item, props: chipProps }">
              <v-chip v-bind="chipProps" size="small" label
                :color="item.raw.legacy ? 'warning' : 'primary'"
                :title="item.raw.legacy ? '舊版自訂分組，非建案；如不再使用可移除' : ''">
                {{ item.title }}
              </v-chip>
            </template>
          </v-select>
          <div v-if="!teamSiteIds.length" class="text-caption text-medium-emphasis mt-2">尚未選擇案場：團獎將不分組，工作台也不會出現案場勾選。</div>
        </v-card-text>
      </v-card>
    </v-form>

    <div class="d-flex justify-end">
      <v-btn color="primary" size="large" variant="flat" prepend-icon="mdi-content-save" :loading="saving" @click="save">儲存設定</v-btn>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import { useToast } from 'vue-toastification';
import { useUserStore } from '@/store/user';
import { useProjectStore } from '@/store/projectStore';
import { setCommissionSettings } from '@/api';
import { mergeSettings, SPLIT_MODES, allocateAmounts, evenShares, money } from '@/utils/commissionCalculation';

const props = defineProps({
  projectId: { type: String, required: true },
  settings: { type: Object, required: true },
  personnel: { type: Array, default: () => [] },   // 本建案銷售人員（用於「對應職務」多選選項）
});
const emit = defineEmits(['saved']);

const toast = useToast();
const userStore = useUserStore();
const projectStore = useProjectStore();
const form = ref(null);
const saving = ref(false);
const local = ref(clone(props.settings));

// ---------- 團獎分組（案場）：以使用者具「銷控系統」權限的建案為選項 ----------
const SALES_SYSTEM = '銷控系統';
const teamSiteIds = ref([]);   // 目前勾選的案場（建案 id；舊版自訂分組沿用其 key）

/** 使用者有銷控權限的建案：{ key: projectId, label: 建案名稱 }，本建案排最前 */
const salesProjectOptions = computed(() => {
  const perms = userStore.user?.permissions || {};
  const nameMap = projectStore.idToNameMap || {};
  const list = Object.keys(perms)
    .filter(pid => (perms[pid]?.systems || []).includes(SALES_SYSTEM))
    .map(pid => ({ key: pid, label: perms[pid]?.projectName || nameMap[pid] || pid }));
  list.sort((a, b) => (a.key === props.projectId ? -1 : b.key === props.projectId ? 1 : a.label.localeCompare(b.label, 'zh-Hant')));
  return list;
});

/** 下拉選項：有權限的建案 + 已儲存但不在權限清單內的舊分組（標記 legacy，保留可見、可移除） */
const teamSiteOptions = computed(() => {
  const known = new Set(salesProjectOptions.value.map(o => o.key));
  const legacy = (local.value.teamGroups || [])
    .filter(g => g?.key && !known.has(g.key))
    .map(g => ({ key: g.key, label: g.label || g.key, legacy: true }));
  return [...salesProjectOptions.value, ...legacy];
});

function syncTeamSiteIdsFromLocal() {
  teamSiteIds.value = (local.value.teamGroups || []).map(g => g.key).filter(Boolean);
}
syncTeamSiteIdsFromLocal();
if (!(projectStore.projectsList || []).length) {
  projectStore.fetchProjects?.().catch(e => console.warn('[CommissionSettingsTab] 載入建案清單失敗:', e));
}

const positionSuggestions = ['專案', '副專', '主委', '副總', '輔導專案', '專案團獎', '業主', '助理'];

/** 本建案人員實際設定的職務（去重、保留出現順序） */
const projectPositions = computed(() => {
  const seen = new Set();
  const list = [];
  (props.personnel || []).forEach(p => {
    (p.positions || []).forEach(pos => {
      const v = String(pos || '').trim();
      if (v && !seen.has(v)) { seen.add(v); list.push(v); }
    });
  });
  return list;
});

/** 個人明細「顯示全部戶別」關鍵字建議：本建案職務優先，再補常用職務 */
const positionSuggestionItems = computed(() => {
  const s = new Set(projectPositions.value);
  return [...projectPositions.value, ...positionSuggestions.filter(v => !s.has(v))];
});

const splitModes = SPLIT_MODES;
/** 範例：3 人分 10,000 元在各模式下的結果 */
function splitExample(mode) {
  const shares = evenShares(3);
  const allocs = shares.map((s, i) => ({ personKey: `p${i}`, mode: 'pct', sharePct: s }));
  const r = allocateAmounts(10000, allocs, 1, mode);
  const list = allocs.map(a => money(r.amounts[a.personKey])).join('／');
  const rem = 10000 - r.total;
  return rem ? `${list}，尾差 ${money(rem)} 元不發放` : list;
}

const modeOptions = [
  { title: '依職務', value: 'role' },
  { title: '個人（銷售）', value: 'individual' },
  { title: '團隊', value: 'team' },
  { title: '自個獎提撥（交屋團獎）', value: 'handover' },
];

/** 提撥類別可選的來源類別：其他非提撥類別 */
function sourceOptions(cat) {
  return (local.value.bonusCategories || [])
    .filter(c => c !== cat && c.mode !== 'handover')
    .map(c => ({ title: `${c.label || c.key}${c.mode === 'individual' ? '（個人）' : ''}`, value: c.key }));
}

watch(() => props.settings, (v) => { local.value = clone(v); syncTeamSiteIdsFromLocal(); });

function clone(v) {
  return JSON.parse(JSON.stringify(mergeSettings(v)));
}

function moveCat(i, dir) {
  const arr = local.value.bonusCategories;
  const j = i + dir;
  if (j < 0 || j >= arr.length) return;
  [arr[i], arr[j]] = [arr[j], arr[i]];
  arr.forEach((c, idx) => { c.order = idx + 1; });
}

function addCategory() {
  const key = `cat${Date.now().toString(36)}`;
  local.value.bonusCategories.push({
    key, label: '新類別', ratePct: 0, mode: 'role', rolePositions: [], enabled: true,
    order: local.value.bonusCategories.length + 1,
  });
}

function removeCat(i) {
  const cat = local.value.bonusCategories[i];
  if (!window.confirm(`確定刪除類別「${cat.label}」？若已有歷史紀錄使用此類別，建議改為「停用」。`)) return;
  local.value.bonusCategories.splice(i, 1);
}

async function save() {
  saving.value = true;
  try {
    const data = JSON.parse(JSON.stringify(local.value));
    const firstIndivKey = (data.bonusCategories.find(c => c.mode === 'individual') || {}).key || '';
    data.bonusCategories.forEach((c, idx) => {
      c.order = idx + 1;
      c.rolePositions = Array.from(new Set((c.rolePositions || []).map(r => String(r || '').trim()).filter(Boolean)));
      if (c.mode === 'handover') {
        c.rolePositions = [];
        const valid = data.bonusCategories.some(o => o !== c && o.mode !== 'handover' && o.key === c.sourceCatKey);
        c.sourceCatKey = valid ? c.sourceCatKey : firstIndivKey;
      } else {
        delete c.sourceCatKey;
      }
    });
    // 團獎分組：依勾選案場輸出 { key: projectId, label: 建案名稱 }；舊版自訂分組保留原 label
    const optionMap = Object.fromEntries(teamSiteOptions.value.map(o => [o.key, o]));
    data.teamGroups = Array.from(new Set(teamSiteIds.value)).filter(Boolean).map(k => ({
      key: k,
      label: optionMap[k]?.label || k,
    }));
    data.personDetailShowAllRoles = (data.personDetailShowAllRoles || []).map(r => String(r || '').trim()).filter(Boolean);
    delete data.id;
    data.updatedBy = userStore.user?.name || '';
    await setCommissionSettings(props.projectId, data);
    toast.success('請佣獎金設定已儲存');
    emit('saved');
  } catch (e) {
    console.error('[CommissionSettingsTab] 儲存失敗:', e);
    toast.error(`儲存失敗：${e.message}`);
  } finally {
    saving.value = false;
  }
}
</script>

<style scoped>
.table-scroll { overflow-x: auto; }
.cat-hints { padding-left: 18px; line-height: 1.7; }
.split-radios :deep(.v-selection-control) { align-items: flex-start; margin-bottom: 6px; }
.split-radios :deep(.v-label) { opacity: 1; }
/* 獎金類別表：所有欄位固定寬度、表格不撐滿（總寬 1050px），寬螢幕靠左緊湊、窄螢幕橫向捲動 */
.cat-table :deep(table) { table-layout: fixed; width: 1050px; }
.cat-table :deep(th) { white-space: nowrap; }
.cat-table :deep(td) { padding-block: 4px; vertical-align: middle; }
.cat-table :deep(.v-field__input) { min-height: 36px; }
.cat-table :deep(.v-combobox .v-field__input) { flex-wrap: wrap; gap: 2px; padding-block: 4px; }
.cat-table :deep(.v-combobox .v-field__input input) { min-width: 40px; }
</style>
