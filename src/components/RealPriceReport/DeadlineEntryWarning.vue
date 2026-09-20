<template>
  <v-dialog
    :model-value="modelValue"
    fullscreen
    persistent
    transition="dialog-bottom-transition"
    class="deadline-entry-dialog"
    aria-labelledby="deadline-entry-title"
    aria-describedby="deadline-entry-description"
    @after-leave="finishLeave"
  >
    <section class="deadline-warning">
      <div class="deadline-warning__glow" aria-hidden="true"></div>
      <div class="deadline-warning__stripe" aria-hidden="true"></div>
      <header class="deadline-warning__header">
        <span class="deadline-warning__signal"><i></i> 期限警示</span>
        <span class="deadline-warning__project">{{ projectName }} · 銷控系統</span>
      </header>
      <main class="deadline-warning__main">
        <div class="deadline-warning__beacon" aria-hidden="true">
          <v-icon size="46">mdi-alarm-light-outline</v-icon>
        </div>
        <p class="deadline-warning__eyebrow">實價登錄申報提醒</p>
        <h1 id="deadline-entry-title" class="deadline-warning__sr-only">實價登錄期限快到期了！</h1>
        <div class="deadline-warning__marquee" aria-hidden="true">
          <div class="deadline-warning__track">
            <span v-for="n in 2" :key="n">實價登錄期限快到期了！<b>✦</b></span>
          </div>
        </div>
        <p id="deadline-entry-description" class="deadline-warning__description">
          <strong>{{ count }}</strong> 筆未完成申報，剩餘期限 ≤ 7 天（含已逾期）
          <span v-if="overdueCount" class="deadline-warning__overdue">其中 {{ overdueCount }} 筆已達期限或逾期，請優先處理</span>
          <span v-else>請儘速確認申報進度，避免錯過期限</span>
        </p>
        <div class="deadline-warning__actions">
          <v-btn size="x-large" rounded="pill" color="white" class="deadline-warning__primary" prepend-icon="mdi-format-list-bulleted" @click="dismiss(true)">查看待申報清單</v-btn>
          <v-btn size="x-large" rounded="pill" variant="outlined" color="white" @click="dismiss(false)">我知道了，進入銷控</v-btn>
        </div>
      </main>
      <footer class="deadline-warning__footer">
        <span>請留意申報期限</span><span>確認後繼續</span>
      </footer>
      <div class="deadline-warning__stripe deadline-warning__stripe--bottom" aria-hidden="true"></div>
    </section>
  </v-dialog>
</template>

<script setup>
import { watch } from 'vue';
const props = defineProps({
  modelValue: Boolean,
  projectName: { type: String, default: '' },
  count: { type: Number, default: 0 },
  overdueCount: { type: Number, default: 0 },
});
const emit = defineEmits(['update:modelValue', 'view-pending']);
let viewPendingAfterLeave = false;
function dismiss(viewPending) {
  viewPendingAfterLeave = viewPending;
  emit('update:modelValue', false);
}
function finishLeave() {
  if (viewPendingAfterLeave) emit('view-pending');
  viewPendingAfterLeave = false;
}
watch(() => props.modelValue, (open) => {
  if (open) viewPendingAfterLeave = false;
});
</script>

<style scoped>
.deadline-warning { position: relative; isolation: isolate; display: flex; flex-direction: column; min-height: 100%; overflow: hidden; color: #fff8f5; background: #21070c; font-family: inherit; }
.deadline-warning__glow { position: absolute; inset: 0; z-index: -1; background: radial-gradient(ellipse at 8% 40%, #ff243c99, transparent 55%), radial-gradient(ellipse at 95% 65%, #f3123880, transparent 55%); animation: deadline-light 2.8s ease-in-out infinite alternate; }
.deadline-warning__stripe { height: clamp(22px, 4vh, 44px); flex-shrink: 0; background: repeating-linear-gradient(125deg, #fff5ef 0 28px, #e3223d 28px 56px); background-size: 136.73px 100%; box-shadow: 0 0 42px #fa264d66; animation: deadline-stripes 3s linear infinite; }
.deadline-warning__stripe--bottom { animation-direction: reverse; }
.deadline-warning__header, .deadline-warning__footer { display: flex; align-items: center; justify-content: space-between; gap: 16px; padding: 24px clamp(20px, 5vw, 80px); font-size: 13px; letter-spacing: .12em; }
.deadline-warning__signal { display: inline-flex; align-items: center; gap: 10px; font-weight: 800; white-space: nowrap; }
.deadline-warning__signal i { width: 9px; height: 9px; border-radius: 50%; background: #ff7b85; box-shadow: 0 0 18px #ff3656; animation: deadline-light 1.8s ease-in-out infinite alternate; }
.deadline-warning__project { opacity: .65; text-align: right; overflow-wrap: anywhere; }
.deadline-warning__main { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 24px 0 36px; width: 100%; }
.deadline-warning__beacon { display: grid; place-items: center; width: 88px; height: 88px; border: 1px solid #ff9caa70; border-radius: 24px; background: #ff344b20; box-shadow: 0 0 70px #ff24464d, inset 0 0 22px #ff455633; }
.deadline-warning__eyebrow { margin: 24px 0; font-size: 12px; letter-spacing: .4em; color: #ffb9c0; }
.deadline-warning__marquee { width: 100%; overflow: hidden; padding: 12px 0 24px; border-block: 1px solid #ffbcc31f; background: #ff778509; }
.deadline-warning__track { display: flex; width: max-content; animation: deadline-marquee 18s linear infinite; }
.deadline-warning__track span { display: flex; align-items: center; flex-shrink: 0; font-size: clamp(54px, 8.5vw, 150px); font-weight: 950; line-height: 1.5; letter-spacing: -.045em; white-space: nowrap; text-shadow: 0 0 45px #ff637955; }
.deadline-warning__track b { margin: 0 .6em; font-size: .55em; color: #ff6479; }
.deadline-warning__description { margin: 26px 20px; text-align: center; font-size: clamp(14px, 1.6vw, 20px); color: #ffe1e5; }
.deadline-warning__description strong { font-size: 1.5em; color: white; }
.deadline-warning__description > span { display: block; margin-top: 8px; font-size: 13px; color: #dbadb5; }
.deadline-warning__description > .deadline-warning__overdue { color: #ffb2bf; font-weight: 700; }
.deadline-warning__actions { display: flex; flex-wrap: wrap; justify-content: center; gap: 12px; padding: 0 20px; }
.deadline-warning__primary { color: #a90e29 !important; }
.deadline-warning__footer { color: #c99aa3; font-size: 11px; }
.deadline-warning__sr-only { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap; }
@keyframes deadline-stripes { to { background-position: 136.73px 0; } }
@keyframes deadline-light { from { opacity: .4; } to { opacity: 1; } }
@keyframes deadline-marquee { to { transform: translateX(-50%); } }
@media (max-width: 600px) {
  .deadline-warning__header, .deadline-warning__footer { padding: 18px 20px; letter-spacing: .04em; }
  .deadline-warning__actions { flex-direction: column; width: 100%; max-width: 380px; }
  .deadline-warning__beacon { width: 64px; height: 64px; border-radius: 18px; }
}
@media (prefers-reduced-motion: reduce) {
  .deadline-warning *, .deadline-warning *::before { animation: none !important; }
  .deadline-warning__track { width: 100%; justify-content: center; }
  .deadline-warning__track span { white-space: normal; text-align: center; font-size: clamp(36px, 7vw, 100px); padding: 0 20px; }
  .deadline-warning__track span + span, .deadline-warning__track b { display: none; }
}
</style>
