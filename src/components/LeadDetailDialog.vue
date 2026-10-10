<template>
  <v-dialog v-model="visible" max-width="640px" scrollable content-class="mac-dialog-fit">
    <v-card v-if="leadData" class="mac-sheet">
      <div class="mac-sheet-head">
        <span class="ldd-tag" :class="`ldd-tag--${tone}`">
          <v-icon size="13">{{ headerIcon }}</v-icon>{{ statusText }}
        </span>
        <span class="ldd-title">{{ title }}</span>
        <button type="button" class="mac-sheet-close" title="關閉" @click="visible = false">
          <v-icon size="18">mdi-close</v-icon>
        </button>
      </div>

      <div class="ldd-summary">
        <div class="ldd-summary-item">
          <div class="ldd-summary-label">客戶姓名</div>
          <div class="ldd-summary-value">{{ leadData.name || leadData.latestName || '未知' }}</div>
        </div>
        <div class="ldd-summary-item">
          <div class="ldd-summary-label">目前銷售</div>
          <div class="ldd-summary-value">{{ leadData.latestSalesName || leadData.assignedName || '未指派' }}</div>
        </div>
      </div>

      <div class="ldd-seg-wrap">
        <div class="mac-form-seg mac-form-seg--block">
          <button type="button" class="mac-form-seg-btn" :class="{ 'is-active': tab === 'profile' }" @click="tab = 'profile'">基本資料</button>
          <button type="button" class="mac-form-seg-btn" :class="{ 'is-active': tab === 'history' }" @click="tab = 'history'">
            互動紀錄<span v-if="historyLogs.length" class="ldd-count">{{ historyLogs.length }}</span>
          </button>
        </div>
      </div>

      <v-card-text class="mac-form ldd-body">
        <div v-if="tab === 'profile'" class="mac-form-group">
          <div v-for="row in profileRows" :key="row.label" class="mac-form-row">
            <div class="mac-form-row-label ldd-row-label">{{ row.label }}</div>
            <div class="mac-form-row-main ldd-row-value" :class="{ 'mac-form-empty': row.value === '--' }">{{ row.value }}</div>
          </div>
        </div>

        <template v-else>
          <div v-if="historyLogs.length" class="mac-form-group">
            <div v-for="(log, i) in historyLogs" :key="i" class="mac-form-pad">
              <div class="ldd-log-head">
                <span class="ldd-log-date">{{ log.date }}</span>
                <span class="ldd-log-by">{{ log.recorderName }}</span>
              </div>
              <div class="ldd-log-content">{{ log.content }}</div>
              <div v-if="log.interactionType || log.rating" class="ldd-log-tags">
                <span v-if="log.interactionType" class="ldd-tag ldd-tag--blue">{{ log.interactionType }}</span>
                <span v-if="log.rating" class="ldd-tag ldd-tag--orange">等級 {{ log.rating }}</span>
              </div>
            </div>
          </div>
          <div v-else class="ldd-empty">
            <v-icon size="32">mdi-history</v-icon>
            <div>尚無互動紀錄</div>
          </div>
        </template>
      </v-card-text>

      <div class="mac-sheet-foot">
        <button type="button" class="mac-btn" @click="visible = false">關閉</button>
        <span class="mac-spacer"></span>
        <button
          v-if="assignAction"
          type="button"
          class="mac-btn mac-btn--primary mac-btn--wrap"
          @click="$emit('assign', assignAction.salesId)"
        >
          <v-icon size="16">mdi-account-arrow-right</v-icon>{{ assignAction.label }}
        </button>
      </div>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { computed, ref, watch } from 'vue';

const props = defineProps({
  modelValue: Boolean,
  leadData: {
    type: Object,
    default: () => ({})
  },
  type: {
      type: String,
      default: 'vip' // 'vip' or 'lead'
  },
  // 他案命中時的建案名稱：標題加註建案、不提供指派（銷售屬他案）
  projectName: {
      type: String,
      default: ''
  }
});

const emit = defineEmits(['update:modelValue', 'assign']);

const visible = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
});

const tab = ref('profile');
// 每次開啟回到基本資料
watch(() => props.modelValue, (open) => { if (open) tab.value = 'profile'; });

const isVip = computed(() => props.type === 'vip');
const isReservation = computed(() => props.type === 'reservation');

// 類型已由標題列標籤呈現，標題只區分本案／他案
const title = computed(() => props.projectName ? `他案・${props.projectName}` : '查重詳情');

const tone = computed(() => {
  if (isVip.value) return 'orange';
  if (isReservation.value) return 'purple';
  return 'slate';
});

const headerIcon = computed(() => {
  if (isVip.value) return 'mdi-crown-outline';
  if (isReservation.value) return 'mdi-calendar-check-outline';
  return 'mdi-account-multiple-outline';
});

// 他案資料不提供指派（銷售屬他案）
const assignAction = computed(() => {
  if (props.projectName) return null;
  const d = props.leadData;
  if (isVip.value) return { salesId: d.latestSalesPhone, label: `指派給原銷售（${d.latestSalesName}）` };
  if (isReservation.value) return { salesId: d.assignedTo, label: `指派給預約業務（${d.assignedName}）` };
  return { salesId: d.assignedTo, label: `指派給負責人（${d.assignedName}）` };
});

const statusText = computed(() => {
  if (isVip.value) return '既有客資';
  if (isReservation.value) return '賞屋預約';
  return '重複名單';
});

// 格式化個人資料
const displayProfile = computed(() => {
    const d = props.leadData;
    const p = d.profile || {};
    
    // 輔助函式：處理陣列或字串
    const val = (v) => Array.isArray(v) ? v.join(', ') : (v || '--');
    
    return {
        source: d.source || val(p['從何得知本建案']) || val(p.source),
        budget: d.budget || val(p['購屋預算']) || val(p.budget),
        city: val(p['居住城市']) || val(p.city),
        job: val(p['職業']) || val(p.job),
        motivation: val(p['購屋動機']) || val(p.motivation),
        roomType: val(p['房型需求']) || val(p.roomType),
        size: val(p['坪數需求']) || val(p.size),
        updatedAt: d.visitDate || d.date || '--'
    };
});

const profileRows = computed(() => [
    { label: '來源', value: displayProfile.value.source },
    { label: '預算', value: displayProfile.value.budget },
    { label: '居住城市', value: displayProfile.value.city },
    { label: '職業', value: displayProfile.value.job },
    { label: '購屋動機', value: displayProfile.value.motivation },
    { label: '房型需求', value: displayProfile.value.roomType },
    { label: '坪數需求', value: displayProfile.value.size },
    { label: '最後更新', value: displayProfile.value.updatedAt }
]);

// 格式化互動紀錄
const historyLogs = computed(() => {
    if (!props.leadData.interactionLogs || !Array.isArray(props.leadData.interactionLogs)) {
        return [];
    }
    return props.leadData.interactionLogs.map(log => {
        // 判斷是否為 VIP 客資的結構 (通常有 date 字串) 或重複名單的結構 (通常有 createdAt Timestamp)
        let dateStr = log.date || '未知日期';
        
        // 如果是重複名單的 contactLogs，時間戳記可能在 createdAt (Timestamp 物件)
        if (log.createdAt && typeof log.createdAt === 'object') {
             // 嘗試處理 Firebase Timestamp
             try {
                let millis;
                if (log.createdAt.toMillis) {
                    millis = log.createdAt.toMillis();
                } else if (log.createdAt.seconds !== undefined) {
                    millis = log.createdAt.seconds * 1000;
                } else if (log.createdAt._seconds !== undefined) { // 處理序列化後的格式
                    millis = log.createdAt._seconds * 1000;
                }
                
                if (millis) {
                    dateStr = new Date(millis).toLocaleString('zh-TW', { timeZone: 'Asia/Taipei', hour12: false });
                }
             } catch (e) {
                dateStr = '時間格式錯誤';
             }
        }

        // 內容組合: VIP用 content, 重複名單用 status/reason/note
        let contentStr = log.content || '';
        if (!contentStr && (log.status || log.reason || log.note)) {
            const parts = [];
            if (log.status) parts.push(`[${log.status}]`);
            if (log.reason) parts.push(log.reason);
            if (log.note) parts.push(log.note);
            // 如果有父層名單來源，也可以顯示
            if (log.parentLeadSource) parts.push(`(來源: ${log.parentLeadSource})`);
            
            contentStr = parts.join(' ');
        }

        return {
            date: dateStr,
            recorderName: log.recorderName || log.createdBy || '系統',
            content: contentStr || '無內容',
            interactionType: log.tags?.interactionType || log.interactionType || log.status, // 重複名單用 status 作為類型
            rating: log.tags?.rating || log.rating
        };
    });
});
</script>

<style scoped>
/* 共用樣式見 src/styles/macosUi.css（mac-sheet／mac-form-*）；此處只放本視窗特有的版面 */
.ldd-title { min-width: 0; overflow-wrap: anywhere; }
.ldd-tag {
  display: inline-flex; align-items: center; gap: 4px; flex-shrink: 0; min-height: 20px; padding: 2px 7px;
  border-radius: 5px; background: var(--ldd-bg); color: var(--ldd-t); font-size: 12px; font-weight: 600; line-height: 1.3;
}
.mac-sheet-head .ldd-tag .v-icon { color: inherit; }
.ldd-tag--orange { --ldd-t: #c93400; --ldd-bg: rgba(255, 149, 0, 0.13); }
.ldd-tag--purple { --ldd-t: #8944ab; --ldd-bg: rgba(175, 82, 222, 0.12); }
.ldd-tag--slate { --ldd-t: #48484a; --ldd-bg: rgba(142, 142, 147, 0.15); }
.ldd-tag--blue { --ldd-t: #0058b0; --ldd-bg: rgba(0, 113, 227, 0.1); }

.ldd-summary {
  display: grid; grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); gap: 10px;
  padding: 12px 16px; background: #fff; border-bottom: 1px solid rgba(0, 0, 0, 0.06);
}
.ldd-summary-label { color: #6e6e73; font-size: 11.5px; font-weight: 600; }
.ldd-summary-value { margin-top: 2px; color: #1d1d1f; font-size: 14px; font-weight: 600; overflow-wrap: anywhere; }

.ldd-seg-wrap { padding: 10px 16px; background: #fff; border-bottom: 1px solid rgba(0, 0, 0, 0.08); }
.ldd-count {
  display: inline-grid; place-content: center; min-width: 18px; height: 16px; padding: 0 5px;
  border-radius: 8px; background: rgba(0, 0, 0, 0.08); color: #3a3a3c; font-size: 11px; font-weight: 600;
}

.ldd-body { height: min(420px, 60vh); padding: 12px 16px !important; }
.ldd-row-label { width: 88px; color: #6e6e73; }
.ldd-row-value { overflow-wrap: anywhere; }

.ldd-log-head { display: flex; align-items: center; flex-wrap: wrap; gap: 4px 8px; }
.ldd-log-date { font-size: 12px; font-weight: 600; color: #1d1d1f; }
.ldd-log-by { font-size: 12px; color: #6e6e73; }
.ldd-log-content { margin-top: 4px; font-size: 13px; line-height: 1.55; white-space: pre-wrap; overflow-wrap: anywhere; }
.ldd-log-tags { display: flex; flex-wrap: wrap; gap: 4px; margin-top: 6px; }
.ldd-empty { padding: 40px 0; color: #8e8e93; text-align: center; font-size: 13px; }
.ldd-empty .v-icon { color: #c7c7cc; }

@media (max-width: 600px) {
  .ldd-body { height: auto; min-height: 240px; }
}
</style>
