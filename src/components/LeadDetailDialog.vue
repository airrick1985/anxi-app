<template>
  <v-dialog v-model="visible" max-width="700px" scrollable>
    <v-card v-if="leadData">
      <v-toolbar :color="headerColor" dark density="compact">
        <v-toolbar-title class="text-subtitle-1 font-weight-bold">
          <v-icon start size="small">{{ headerIcon }}</v-icon>
          {{ title }}
        </v-toolbar-title>
        <v-spacer></v-spacer>
        <v-btn icon dark @click="visible = false">
          <v-icon>mdi-close</v-icon>
        </v-btn>
      </v-toolbar>

      <v-card-text class="pa-0" style="height: 500px; overflow-y: auto;">
        <!-- 基本資訊摘要 -->
        <v-container class="bg-grey-lighten-4 pb-2">
            <v-row dense>
                <v-col cols="6" sm="4">
                    <div class="text-caption text-grey-darken-1">客戶姓名</div>
                    <div class="text-body-2 font-weight-bold">{{ leadData.name || leadData.latestName || '未知' }}</div>
                </v-col>
                <v-col cols="6" sm="4">
                    <div class="text-caption text-grey-darken-1">目前銷售</div>
                    <div class="text-body-2 font-weight-bold">{{ leadData.latestSalesName || leadData.assignedName || '未指派' }}</div>
                </v-col>
                <v-col cols="12" sm="4">
                    <div class="text-caption text-grey-darken-1">狀態</div>
                     <v-chip :color="headerColor" size="x-small" label class="font-weight-bold mt-1">
                        {{ statusText }}
                     </v-chip>
                </v-col>
            </v-row>
        </v-container>

        <v-tabs v-model="tab" color="primary" align-tabs="center" density="compact">
          <v-tab value="profile">📋 基本資料</v-tab>
          <v-tab value="history">🕒 互動紀錄</v-tab>
        </v-tabs>

        <v-window v-model="tab" class="pa-3">
          <!-- 1. 基本資料 Tab -->
          <v-window-item value="profile">
            <v-table density="compact" class="info-table">
                <tbody>
                    <tr>
                        <th width="30%">來源</th>
                        <td>{{ displayProfile.source }}</td>
                    </tr>
                    <tr>
                        <th>預算</th>
                        <td>{{ displayProfile.budget }}</td>
                    </tr>
                    <tr>
                        <th>居住城市</th>
                        <td>{{ displayProfile.city }}</td>
                    </tr>
                    <tr>
                        <th>職業</th>
                        <td>{{ displayProfile.job }}</td>
                    </tr>
                    <tr>
                        <th>購屋動機</th>
                        <td>{{ displayProfile.motivation }}</td>
                    </tr>
                    <tr>
                        <th>房型需求</th>
                        <td>{{ displayProfile.roomType }}</td>
                    </tr>
                     <tr>
                        <th>坪數需求</th>
                        <td>{{ displayProfile.size }}</td>
                    </tr>
                     <tr>
                        <th>最後更新</th>
                        <td>{{ displayProfile.updatedAt }}</td>
                    </tr>
                </tbody>
            </v-table>
          </v-window-item>

          <!-- 2. 互動紀錄 Tab -->
          <v-window-item value="history">
            <div v-if="historyLogs.length > 0">
                <v-timeline density="compact" side="end">
                    <v-timeline-item
                        v-for="(log, i) in historyLogs"
                        :key="i"
                        dot-color="primary"
                        size="x-small"
                    >
                        <div class="mb-1">
                            <span class="text-caption font-weight-bold mr-2">{{ log.date }}</span>
                            <v-chip size="x-small" color="grey" variant="outlined">{{ log.recorderName }}</v-chip>
                        </div>
                        <v-card variant="outlined" class="pa-2 bg-grey-lighten-5">
                            <div class="text-body-2">{{ log.content }}</div>
                            <div class="mt-1 d-flex gap-1 flex-wrap">
                                <v-chip v-if="log.interactionType" size="x-small" color="info" label>{{ log.interactionType }}</v-chip>
                                <v-chip v-if="log.rating" size="x-small" color="warning" label>等級: {{ log.rating }}</v-chip>
                            </div>
                        </v-card>
                    </v-timeline-item>
                </v-timeline>
            </div>
            <div v-else class="text-center py-5 text-grey">
                <v-icon size="40" color="grey-lighten-2">mdi-history</v-icon>
                <div class="mt-2">尚無詳細互動紀錄</div>
            </div>
          </v-window-item>
        </v-window>

      </v-card-text>

      <v-divider></v-divider>

      <v-card-actions>
        <v-btn color="grey-darken-1" variant="text" @click="visible = false">關閉</v-btn>
        <v-spacer></v-spacer>
        <v-btn 
            v-if="type === 'vip'"
            color="orange-darken-2" 
            variant="flat" 
            prepend-icon="mdi-account-arrow-right"
            @click="$emit('assign', leadData.latestSalesPhone)"
        >
            指派給原銷售 ({{ leadData.latestSalesName }})
        </v-btn>
         <v-btn
            v-else-if="type === 'lead'"
            color="blue-grey-darken-1"
            variant="flat"
            prepend-icon="mdi-account-check"
             @click="$emit('assign', leadData.assignedTo)"
        >
            指派給負責人 ({{ leadData.assignedName }})
        </v-btn>
        <v-btn
            v-else-if="type === 'reservation'"
            color="deep-purple"
            variant="flat"
            prepend-icon="mdi-calendar-check"
            @click="$emit('assign', leadData.assignedTo)"
        >
            指派給預約業務 ({{ leadData.assignedName }})
        </v-btn>
      </v-card-actions>
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
  }
});

const emit = defineEmits(['update:modelValue', 'assign']);

const visible = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
});

const tab = ref('profile');

const isVip = computed(() => props.type === 'vip');
const isReservation = computed(() => props.type === 'reservation');

const title = computed(() => {
  if (isVip.value) return '既有客資詳情';
  if (isReservation.value) return '賞屋預約詳情';
  return '重複名單詳情';
});

const headerColor = computed(() => {
  if (isVip.value) return 'orange-darken-2';
  if (isReservation.value) return 'deep-purple';
  return 'blue-grey-darken-2';
});

const headerIcon = computed(() => {
  if (isVip.value) return 'mdi-crown';
  if (isReservation.value) return 'mdi-calendar-check';
  return 'mdi-alert-circle';
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
.info-table th {
    font-weight: bold;
    color: #666;
    background-color: #f5f5f5;
    text-align: left;
    padding: 8px !important;
}
.info-table td {
    padding: 8px !important;
}
</style>
