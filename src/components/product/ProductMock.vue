<template>
  <!-- 示意畫面：共用瀏覽器框，內容只用 表格／對話／長條／狀態矩陣／數字卡（docs/SPEC_ProductPage.md §7） -->
  <div class="mk" role="img" :aria-label="LABELS[kind]">
    <div class="mk-bar" aria-hidden="true"><i></i><i></i><i></i><span class="mk-bar__tag">示意畫面</span></div>
    <div class="mk-canvas" aria-hidden="true">
      <div class="mk-inner">
        <!-- 報價：期款試算 -->
        <template v-if="kind === 'quote'">
          <div class="mk-head"><strong>A-3 期款試算</strong><span class="mk-aux">總價 <b class="mk-accent">3,450 萬</b></span></div>
          <table class="mk-table">
            <thead><tr><th>期款</th><th class="is-num">比例</th><th class="is-num">金額(萬)</th></tr></thead>
            <tbody>
              <tr v-for="r in quoteRows" :key="r[0]"><td>{{ r[0] }}</td><td class="is-num">{{ r[1] }}</td><td class="is-num">{{ r[2] }}</td></tr>
            </tbody>
          </table>
          <div class="mk-row"><span class="mk-chip mk-chip--orange">低於底價</span><span class="mk-aux">已通知主管核准</span></div>
        </template>

        <!-- 車位：房車比數字卡＋車位狀態矩陣（統計項目依 ParkingRatioDialog／ParkingControl） -->
        <template v-else-if="kind === 'parking'">
          <div class="mk-head"><strong>房車比速覽</strong><span class="mk-chip mk-chip--green">車位充足</span></div>
          <div class="mk-stats">
            <div class="mk-stat"><span>整體房車比</span><b>1.10</b></div>
            <div class="mk-stat"><span>已售車位</span><b>79</b></div>
            <div class="mk-stat"><span>車位餘裕</span><b class="mk-accent">15 車</b></div>
          </div>
          <div class="mk-sub">B2 車位圖</div>
          <div class="mk-slots">
            <span v-for="slot in parkingSlots.slice(0, 10)" :key="slot.no" class="mk-slot" :class="`mk-chip--${slot.tone}`">{{ slot.no }}</span>
            <span class="mk-slots__aisle">車道</span>
            <span v-for="slot in parkingSlots.slice(10)" :key="slot.no" class="mk-slot" :class="`mk-chip--${slot.tone}`">{{ slot.no }}</span>
          </div>
          <div class="mk-row">
            <span v-for="lg in parkingLegend" :key="lg.label" class="mk-chip" :class="`mk-chip--${lg.tone}`">{{ lg.label }} {{ lg.count }}</span>
          </div>
        </template>

        <!-- AI 智能助理：對話＋修改前後確認 -->
        <template v-else-if="kind === 'ai'">
          <div class="mk-head"><strong><v-icon size="16">mdi-robot-outline</v-icon>AI 智能助理</strong></div>
          <div class="mk-chat">
            <div class="mk-msg is-me">C-4 改小訂，成交價 3,450 萬</div>
            <div class="mk-msg is-ai mk-msg--wide">
              <div class="mk-msg__title">請確認變更｜C-4</div>
              <div class="mk-diff">
                <template v-for="r in aiDiff" :key="r[0]">
                  <span class="mk-aux">{{ r[0] }}</span><s>{{ r[1] }}</s><v-icon size="16">mdi-arrow-right</v-icon><b>{{ r[2] }}</b>
                </template>
              </div>
              <div class="mk-row mk-row--end"><span class="mk-btn">取消</span><span class="mk-btn mk-btn--dark">確認寫入</span></div>
            </div>
          </div>
        </template>

        <!-- 客戶管理：來客數字卡＋銷售排行 -->
        <template v-else-if="kind === 'customer'">
          <div class="mk-head"><strong>本月來客</strong><span class="mk-aux">客資儀表板</span></div>
          <div class="mk-stats">
            <div v-for="s in customerStats" :key="s[0]" class="mk-stat"><span>{{ s[0] }}</span><b>{{ s[1] }}</b></div>
          </div>
          <div class="mk-sub">銷售排行</div>
          <div class="mk-bars">
            <div v-for="(b, k) in rankRows" :key="b[0]" class="mk-bars__row">
              <span class="mk-bars__name">{{ b[0] }}</span>
              <span class="mk-bars__track"><i :class="{ 'is-accent': k === 0 }" :style="{ width: `${b[2]}%` }"></i></span>
              <span class="mk-bars__val">{{ b[1] }}</span>
            </div>
          </div>
        </template>

        <!-- 名單分配 -->
        <template v-else-if="kind === 'leads'">
          <div class="mk-head"><strong>名單分配</strong><span class="mk-aux">新進 36 筆</span></div>
          <table class="mk-table">
            <thead><tr><th>銷售</th><th class="is-num">本週</th><th class="is-num">上週</th><th class="is-num">本月</th></tr></thead>
            <tbody>
              <tr v-for="r in assignRows" :key="r[0]"><td>{{ r[0] }}</td><td class="is-num">{{ r[1] }}</td><td class="is-num">{{ r[2] }}</td><td class="is-num">{{ r[3] }}</td></tr>
            </tbody>
          </table>
          <div class="mk-row"><span class="mk-btn mk-btn--primary">平均分配</span><span class="mk-aux">每人 12 筆</span></div>
        </template>

        <!-- LINE AI 助理：群組對話＋AI 建議回覆 -->
        <template v-else-if="kind === 'lineAi'">
          <div class="mk-head"><strong><v-icon size="16">mdi-account-group-outline</v-icon>B-5 購屋群組</strong><span class="mk-chip mk-chip--green">LINE</span></div>
          <div class="mk-chat">
            <div class="mk-msg is-other"><small>客戶</small>車位可以再算一次嗎？</div>
            <div class="mk-msg is-other"><small>客戶</small>週末才有空看屋</div>
          </div>
          <div class="mk-card">
            <div class="mk-card__title"><span class="mk-accent"><v-icon size="16">mdi-creation</v-icon>AI 建議回覆</span><span class="mk-aux">風格：親切</span></div>
            <p class="mk-card__text">您好！B-5 含車位 3,450 萬，週六上午方便來看屋嗎？</p>
            <div class="mk-row mk-row--end"><span class="mk-btn">複製</span><span class="mk-btn mk-btn--dark">官方帳號送出</span></div>
          </div>
        </template>

        <!-- 合約製作：合約數字對照表 -->
        <template v-else-if="kind === 'contract'">
          <div class="mk-head"><strong>合約數字對照表</strong><span class="mk-chip mk-chip--green">檢核通過</span></div>
          <table class="mk-table mk-table--kv">
            <tbody>
              <tr v-for="r in contractRows" :key="r[0]"><th>{{ r[0] }}</th><td>{{ r[1] }}</td></tr>
            </tbody>
          </table>
          <div class="mk-stat mk-stat--wide"><span>總價款（國字）</span><b class="mk-accent">新臺幣參仟肆佰伍拾萬元整</b></div>
          <div class="mk-row"><span class="mk-file">PDF</span><span class="mk-file">EXCEL</span><span class="mk-aux">已存到戶別</span></div>
        </template>

        <!-- 請佣獎金：請佣表＋獎金分配 -->
        <template v-else-if="kind === 'commission'">
          <div class="mk-head"><strong>第 3 期請佣</strong><span class="mk-aux">依成交價</span></div>
          <table class="mk-table">
            <thead><tr><th>戶別</th><th class="is-num">總價(萬)</th><th class="is-num">比例</th><th class="is-num">請佣(萬)</th></tr></thead>
            <tbody>
              <tr v-for="r in commissionRows" :key="r[0]"><td>{{ r[0] }}</td><td class="is-num">{{ r[1] }}</td><td class="is-num">{{ r[2] }}</td><td class="is-num">{{ r[3] }}</td></tr>
            </tbody>
          </table>
          <div class="mk-sub">個人獎金</div>
          <div class="mk-bars">
            <div v-for="(b, k) in bonusRows" :key="b[0]" class="mk-bars__row">
              <span class="mk-bars__name">{{ b[0] }}</span>
              <span class="mk-bars__track"><i :class="{ 'is-accent': k === 0 }" :style="{ width: `${b[2]}%` }"></i></span>
              <span class="mk-bars__val">{{ b[1] }}</span>
            </div>
          </div>
        </template>

        <!-- 線上預約：週時間表（日 × 時段、剩餘名額） -->
        <template v-else-if="kind === 'booking'">
          <div class="mk-head"><strong>初驗預約時間表</strong><span class="mk-aux">每時段 4 組</span></div>
          <table class="mk-table mk-table--matrix">
            <thead><tr><th>時段</th><th v-for="(d, k) in bookingDays" :key="d" :class="{ 'mk-accent': k === 0 }">{{ d }}</th></tr></thead>
            <tbody>
              <tr v-for="r in bookingRows" :key="r.time">
                <td>{{ r.time }}</td>
                <td v-for="(left, k) in r.left" :key="k"><span class="mk-chip" :class="`mk-chip--${quotaTone(left)}`">{{ left ? `剩 ${left}` : '額滿' }}</span></td>
              </tr>
            </tbody>
          </table>
        </template>

        <!-- 交屋控管：棟別（欄）× 樓層（列），狀態用字同 utils/handoverBoard.js（進度項目為初驗、交屋時） -->
        <template v-else-if="kind === 'handover'">
          <div class="mk-head"><strong>交屋控管表</strong><span class="mk-aux">12 戶</span></div>
          <div class="mk-row">
            <template v-for="c in handoverCounts" :key="c.label">
              <span v-if="c.tone" class="mk-chip" :class="`mk-chip--${c.tone}`">{{ c.label }} {{ c.count }}</span>
              <span v-else class="mk-aux">{{ c.label }} {{ c.count }}</span>
            </template>
          </div>
          <table class="mk-table mk-table--matrix">
            <thead><tr><th>樓層</th><th v-for="t in handoverTowers" :key="t">{{ t }} 棟</th></tr></thead>
            <tbody>
              <tr v-for="r in handoverRows" :key="r.floor">
                <td>{{ r.floor }}</td>
                <td v-for="(st, k) in r.cells" :key="k">
                  <span v-if="HANDOVER_TONE[st]" class="mk-chip" :class="`mk-chip--${HANDOVER_TONE[st]}`">{{ st }}</span>
                  <span v-else class="mk-aux">{{ st }}</span>
                </td>
              </tr>
            </tbody>
          </table>
        </template>

        <!-- 驗屋修繕：缺失卡＋修繕進度 -->
        <template v-else-if="kind === 'inspection'">
          <div class="mk-head"><strong>A 棟修繕進度</strong><span class="mk-aux">共 100 項</span></div>
          <div class="mk-defects">
            <div v-for="d in defects" :key="d.unit" class="mk-card mk-defect">
              <span class="mk-defect__mark" :class="`is-${d.tone}`"><i></i></span>
              <span class="mk-defect__body">
                <b>{{ d.unit }}</b>
                <span class="mk-row"><span class="mk-chip" :class="`mk-chip--${d.tone}`">{{ d.status }}</span><span class="mk-aux">{{ d.note }}</span></span>
              </span>
            </div>
          </div>
          <div class="mk-bars">
            <div v-for="r in repairRows" :key="r[0]" class="mk-bars__row">
              <span class="mk-bars__name">{{ r[0] }}</span>
              <span class="mk-bars__track"><i :class="`is-${r[2]}`" :style="{ width: `${r[1]}%` }"></i></span>
              <span class="mk-bars__val">{{ r[1] }}</span>
            </div>
          </div>
        </template>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  kind: { type: String, required: true },
});

// 全頁同一組假資料：戶別 A-3、B-5、C-4、D-2；金額 3,450 萬；人名周小倫、蔡小林、林小美
const LABELS = {
  quote: '示意畫面：A-3 期款試算，總價 3,450 萬，依比例算出訂金、簽約金、工程期款、交屋貸款',
  parking: '示意畫面：房車比速覽與 B2 車位圖，以顏色標示已簽約、已訂未簽、暫時保留、可售',
  ai: '示意畫面：對 AI 說「C-4 改小訂，成交價 3,450 萬」，AI 列出修改前與修改後請你確認',
  customer: '示意畫面：本月來客數字與銷售排行',
  leads: '示意畫面：名單分配表，列出每位銷售本週、上週、本月已分配數量',
  lineAi: '示意畫面：LINE 購屋群組的客戶提問與 AI 建議回覆',
  contract: '示意畫面：合約數字對照表，總價款自動轉成國字大寫並通過檢核',
  commission: '示意畫面：第 3 期請佣表與個人獎金分配',
  booking: '示意畫面：初驗預約時間表，各時段剩餘名額',
  handover: '示意畫面：交屋控管表，棟別與樓層矩陣標出每戶驗屋、交屋進度',
  inspection: '示意畫面：缺失卡與修繕進度統計',
};

const quoteRows = [
  ['訂金', '3%', '103.5'],
  ['簽約金', '7%', '241.5'],
  ['工程期款', '10%', '345'],
  ['交屋貸款', '80%', '2,760'],
];

// 車位確定度（utils/salesStatusGroups.js COMMITMENT_TIERS）：s 已簽約、b 已訂未簽、r 暫時保留、a 可售
const SLOT_TONE = { s: 'red', b: 'orange', r: 'blue', a: 'green' };
const parkingSlots = 'ssbasraasbassarasaba'.split('').map((st, i) => ({ no: i + 1, tone: SLOT_TONE[st] }));
const parkingLegend = [
  { label: '已簽約', tone: 'red', count: 7 },
  { label: '已訂未簽', tone: 'orange', count: 3 },
  { label: '暫時保留', tone: 'blue', count: 2 },
  { label: '可售', tone: 'green', count: 8 },
];

const aiDiff = [
  ['狀態', '可售', '小訂'],
  ['成交價', '—', '3,450 萬'],
  ['銷售', '—', '周小倫'],
];

const customerStats = [['來客', '67 組'], ['新客', '41 組'], ['回訪', '26 組']];
const rankRows = [['周小倫', '28 組', 100], ['蔡小林', '22 組', 79], ['林小美', '17 組', 61]];

const assignRows = [
  ['周小倫', 12, 9, 41],
  ['蔡小林', 11, 10, 40],
  ['林小美', 13, 9, 42],
];

const contractRows = [
  ['戶別', 'C-4'],
  ['車位', 'B2-5'],
  ['房屋面積', '54.69坪'],
  ['總價款', '3,450萬'],
];

const commissionRows = [
  ['A-3', '3,450', '2.0%', '69.00'],
  ['B-5', '3,675', '2.0%', '73.50'],
  ['C-4', '3,883', '1.8%', '69.89'],
  ['D-2', '3,843', '2.0%', '76.86'],
];
const bonusRows = [['周小倫', '12.6 萬', 100], ['蔡小林', '9.8 萬', 78], ['林小美', '7.4 萬', 59]];

// 剩餘名額一律寫「剩 N」：2 以上綠、剩 1 橘、0 為額滿（紅）
const bookingDays = ['週一', '週二', '週三'];
const bookingRows = [
  { time: '10:00', left: [3, 0, 1] },
  { time: '14:00', left: [1, 2, 0] },
  { time: '16:00', left: [4, 2, 3] },
];
const quotaTone = (left) => (left === 0 ? 'red' : left === 1 ? 'orange' : 'green');

// 狀態用字同 buildStatusList：未售、未驗、已約初驗、已初驗、已約交屋、已交屋
// 顏色規則：未驗紅、已約橘、已初驗藍、已交屋綠；未售不加籤
const HANDOVER_TONE = { 未驗: 'red', 已約初驗: 'orange', 已初驗: 'blue', 已約交屋: 'orange', 已交屋: 'green' };
const handoverTowers = ['A', 'B', 'C'];
const handoverRows = [
  { floor: '5F', cells: ['已交屋', '已約交屋', '未售'] },
  { floor: '4F', cells: ['已初驗', '已交屋', '已約初驗'] },
  { floor: '3F', cells: ['已約初驗', '未驗', '已初驗'] },
  { floor: '2F', cells: ['未驗', '已初驗', '已交屋'] },
];
const handoverCounts = ['未售', '未驗', '已約初驗', '已初驗', '已約交屋', '已交屋'].map((label) => ({
  label,
  tone: HANDOVER_TONE[label] || '',
  count: handoverRows.reduce((n, r) => n + r.cells.filter((c) => c === label).length, 0),
}));

const defects = [
  { unit: 'A-3・客廳', status: '待修繕', tone: 'red', note: '牆面裂縫' },
  { unit: 'B-5・主臥', status: '修繕中', tone: 'orange', note: '門片刮傷' },
];
const repairRows = [['待修繕', 18, 'red'], ['已安排', 12, 'blue'], ['修繕中', 7, 'orange'], ['已完成', 63, 'green']];
</script>

<style scoped>
/* ≥768px：標題 15／內容 14／表頭與輔助 13，列高 40；手機見檔尾（維持 14／12／11、列高 32） */
.mk {
  width: 100%;
  min-width: 0;
  border: 1px solid #E5E7EB;
  border-radius: 14px;
  overflow: hidden;
  background: #fff;
  box-shadow: 0 1px 2px rgba(15, 23, 42, 0.04), 0 12px 32px rgba(15, 23, 42, 0.06);
  color: #111827;
  font-size: 14px;
  font-weight: 500;
  line-height: 1.5;
  font-variant-numeric: tabular-nums;
  text-align: left;
}
.mk-bar {
  display: flex;
  align-items: center;
  gap: 6px;
  height: 26px;
  padding: 0 12px;
  background: #EEF0F4;
  border-bottom: 1px solid #E5E7EB;
}
.mk-bar i { width: 9px; height: 9px; border-radius: 50%; background: #D1D5DB; }
.mk-bar__tag { margin-left: auto; font-size: 12px; font-weight: 500; color: #4B5563; letter-spacing: 0.02em; }
.mk-canvas {
  display: flex;
  flex-direction: column;
  justify-content: center;
  min-height: 240px;
  padding: 28px;
}
.mk-inner { display: flex; flex-direction: column; gap: 14px; width: 100%; min-width: 0; }

.mk-head { display: flex; align-items: center; justify-content: space-between; gap: 12px; flex-wrap: wrap; }
.mk-head strong { display: inline-flex; align-items: center; gap: 6px; font-size: 15px; font-weight: 600; }
.mk-head strong .v-icon { color: #4B5563; }
.mk-aux { font-size: 13px; font-weight: 500; color: #4B5563; }
.mk-aux b { font-size: 15px; font-weight: 600; }
.mk-sub { font-size: 13px; font-weight: 600; color: #4B5563; margin-bottom: -4px; }
.mk-accent { color: #2F6BFF; }
.mk-row { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
.mk-row--end { justify-content: flex-end; }

/* 表格 */
.mk-table { width: 100%; border-collapse: collapse; table-layout: auto; }
.mk-table th, .mk-table td { height: 40px; padding: 0 12px; border-bottom: 1px solid #E5E7EB; text-align: left; white-space: nowrap; }
.mk-table thead th { background: #F5F6F8; font-size: 13px; font-weight: 600; color: #4B5563; border-bottom: 0; }
.mk-table thead th:first-child { border-radius: 10px 0 0 10px; }
.mk-table thead th:last-child { border-radius: 0 10px 10px 0; }
.mk-table .is-num { text-align: right; }
.mk-table tbody tr:last-child td, .mk-table tbody tr:last-child th { border-bottom: 0; }
.mk-table--kv th { font-size: 13px; font-weight: 600; color: #4B5563; }
.mk-table--kv td { text-align: right; }
.mk-table--matrix td, .mk-table--matrix th { text-align: center; }
.mk-table--matrix td:first-child, .mk-table--matrix th:first-child { text-align: left; }

/* 狀態籤 */
.mk-chip {
  display: inline-flex;
  align-items: center;
  height: 26px;
  padding: 0 9px;
  border-radius: 7px;
  font-size: 13px;
  font-weight: 600;
  white-space: nowrap;
}
.mk-chip--red { color: #B91C1C; background: #FEF2F2; }
.mk-chip--orange { color: #B45309; background: #FFFBEB; }
.mk-chip--green { color: #15803D; background: #F0FDF4; }
.mk-chip--blue { color: #1F4FD1; background: rgba(47, 107, 255, 0.08); }

/* 數字卡 */
.mk-stats { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 12px; }
.mk-stat { display: flex; flex-direction: column; gap: 2px; padding: 10px 14px; border-radius: 10px; background: #F5F6F8; min-width: 0; }
.mk-stat span { font-size: 13px; color: #4B5563; }
.mk-stat b { font-size: 15px; font-weight: 600; }
.mk-stat--wide b { letter-spacing: 0.04em; }

/* 長條 */
.mk-bars { display: flex; flex-direction: column; gap: 12px; }
.mk-bars__row { display: grid; grid-template-columns: 3.6em minmax(0, 1fr) auto; align-items: center; gap: 12px; }
.mk-bars__name { white-space: nowrap; }
.mk-bars__track { height: 10px; border-radius: 5px; background: #E5E7EB; overflow: hidden; }
.mk-bars__track i { display: block; height: 100%; border-radius: 5px; background: #4B5563; }
.mk-bars__track i.is-accent { background: #2F6BFF; }
.mk-bars__track i.is-red { background: #B91C1C; }
.mk-bars__track i.is-orange { background: #B45309; }
.mk-bars__track i.is-green { background: #15803D; }
.mk-bars__track i.is-blue { background: #2F6BFF; }
.mk-bars__val { min-width: 3.4em; text-align: right; font-size: 13px; color: #4B5563; white-space: nowrap; }

/* 車位狀態矩陣 */
.mk-slots { display: grid; grid-template-columns: repeat(10, minmax(0, 1fr)); gap: 6px; }
.mk-slot { display: grid; place-items: center; height: 32px; border-radius: 7px; font-size: 13px; font-weight: 600; }
.mk-slots__aisle {
  grid-column: 1 / -1;
  display: flex;
  align-items: center;
  justify-content: center;
  height: 22px;
  border-top: 1px dashed #E5E7EB;
  border-bottom: 1px dashed #E5E7EB;
  font-size: 13px;
  color: #4B5563;
  letter-spacing: 0.3em;
}

/* 對話 */
.mk-chat { display: flex; flex-direction: column; gap: 10px; }
.mk-msg { max-width: 78%; padding: 10px 14px; border-radius: 14px; }
.mk-msg small { display: block; font-size: 13px; color: #4B5563; }
.mk-msg.is-me { align-self: flex-end; background: #2F6BFF; color: #fff; border-bottom-right-radius: 4px; }
.mk-msg.is-ai, .mk-msg.is-other { align-self: flex-start; background: #F5F6F8; border-bottom-left-radius: 4px; }
.mk-msg--wide { display: flex; flex-direction: column; gap: 8px; width: 78%; padding: 14px 16px; }
.mk-msg__title { font-size: 15px; font-weight: 600; }
.mk-diff { display: grid; grid-template-columns: max-content max-content 16px minmax(0, 1fr); align-items: center; gap: 8px 14px; }
.mk-diff s { color: #4B5563; }
.mk-diff b { font-weight: 600; }
.mk-diff .v-icon { color: #4B5563; }

/* 卡片、按鈕、檔案 */
.mk-card { padding: 14px; border: 1px solid #E5E7EB; border-radius: 10px; }
.mk-card__title { display: flex; align-items: center; justify-content: space-between; gap: 8px; font-size: 15px; font-weight: 600; }
.mk-card__title .mk-accent { display: inline-flex; align-items: center; gap: 4px; }
.mk-card__text { margin: 8px 0 12px; }
.mk-btn { display: inline-flex; align-items: center; height: 32px; padding: 0 14px; border-radius: 8px; border: 1px solid #E5E7EB; background: #fff; font-size: 13px; font-weight: 600; white-space: nowrap; }
.mk-btn--dark { background: #111827; border-color: #111827; color: #fff; }
.mk-btn--primary { background: #2F6BFF; border-color: #2F6BFF; color: #fff; }
.mk-file { display: inline-flex; align-items: center; height: 26px; padding: 0 9px; border-radius: 7px; border: 1px solid #E5E7EB; background: #F5F6F8; font-size: 13px; font-weight: 600; color: #4B5563; }

/* 缺失卡：色塊＋標記點（代表照片上標記的位置） */
.mk-defects { display: grid; grid-template-columns: repeat(auto-fit, minmax(190px, 1fr)); gap: 12px; }
.mk-defect { display: flex; align-items: flex-start; gap: 12px; }
.mk-defect__mark { position: relative; flex: none; width: 44px; height: 44px; border-radius: 8px; }
.mk-defect__mark.is-red { background: #FEF2F2; }
.mk-defect__mark.is-orange { background: #FFFBEB; }
.mk-defect__mark i { position: absolute; left: 55%; top: 40%; width: 14px; height: 14px; border-radius: 50%; border: 3px solid #fff; transform: translate(-50%, -50%); }
.mk-defect__mark.is-red i { background: #B91C1C; box-shadow: 0 0 0 1px #B91C1C; }
.mk-defect__mark.is-orange i { background: #B45309; box-shadow: 0 0 0 1px #B45309; }
.mk-defect__body { display: flex; flex-direction: column; gap: 4px; min-width: 0; }
.mk-defect__body b { font-weight: 600; }

/* ───── 手機：維持原規格（14／12／11、列高 32、籤 22） ───── */
@media (max-width: 767.98px) {
  .mk { font-size: 12px; }
  .mk-canvas { min-height: 220px; padding: 14px; }
  .mk-inner { gap: 12px; }
  .mk-head strong, .mk-msg__title, .mk-card__title { font-size: 14px; }
  .mk-aux, .mk-sub, .mk-stat span, .mk-msg small, .mk-bars__val, .mk-table thead th, .mk-table--kv th, .mk-slots__aisle { font-size: 11px; }
  .mk-aux b, .mk-stat b { font-size: 14px; }
  .mk-table th, .mk-table td { height: 32px; padding: 0 6px; }
  .mk-chip, .mk-file { height: 22px; padding: 0 7px; border-radius: 6px; font-size: 12px; }
  .mk-stats { gap: 8px; }
  .mk-stat { padding: 8px; }
  .mk-bars { gap: 10px; }
  .mk-bars__row { gap: 8px; }
  .mk-bars__track, .mk-bars__track i { height: 8px; border-radius: 4px; }
  .mk-slots { gap: 3px; }
  .mk-slot { height: 24px; border-radius: 6px; font-size: 11px; }
  .mk-slots__aisle { height: 20px; }
  .mk-msg { padding: 8px 12px; }
  .mk-msg--wide { width: 86%; padding: 10px 12px; gap: 6px; }
  .mk-diff { gap: 6px 10px; }
  .mk-card { padding: 12px; }
  .mk-btn { height: 28px; padding: 0 12px; font-size: 12px; }
  .mk-defects { grid-template-columns: repeat(auto-fit, minmax(170px, 1fr)); }
  .mk-defect__mark { width: 40px; height: 40px; }
}
</style>
