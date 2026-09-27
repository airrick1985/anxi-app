<template>
  <main class="customer-share">
    <div class="share-backdrop" :style="{ backgroundImage: `url(${backdrop})` }" aria-hidden="true"></div>
    <div class="share-topline">
      <router-link to="/home" class="share-brand">ANXI <span>安心相遇・從這裡開始</span></router-link>
    </div>

    <section class="share-content" aria-labelledby="share-title">
      <header class="share-heading">
        <span class="share-eyebrow">WELCOME HOME</span>
        <h1 id="share-title">客戶資料表</h1>
        <p>讓每一次相遇，都有家的開始。</p>
      </header>

      <article ref="card" class="share-card">
        <template v-if="projects.length">
          <label for="share-project" class="select-label">選擇建案</label>
          <div class="project-select">
            <v-icon size="21">mdi-home-city-outline</v-icon>
            <select id="share-project" v-model="selectedId">
              <option value="" disabled>請選擇您要分享的建案</option>
              <option v-for="project in projects" :key="project.id" :value="project.id">{{ project.name }}</option>
            </select>
            <v-icon size="18">mdi-chevron-down</v-icon>
          </div>

          <div v-if="!identityReady" class="share-empty" role="status">
            <v-icon size="44">mdi-account-edit-outline</v-icon>
            <h2>請先完善個人資料</h2>
            <p>需要您的姓名與帳號資料，才能建立專屬表單連結。請至選單編輯個人資料。</p>
          </div>
          <template v-else-if="selectedProject">
            <div ref="qrStage" class="qr-stage" :style="{ width: `${qrSize}px`, height: `${qrSize}px` }" aria-live="polite" :aria-busy="qrLoading">
              <img v-if="qrImage" class="share-qr" :src="qrImage" :alt="`${selectedProject.name}・${userStore.user.name} 的客戶資料表 QR Code`" width="280" height="280" />
              <div v-else class="qr-placeholder">
                <template v-if="qrError"><p role="alert">{{ qrError }}</p><button class="text-button" @click="generateQr">重新產生</button></template>
                <template v-else><v-progress-circular indeterminate color="#54715d" size="32" /><p>正在準備您的 QR Code…</p></template>
              </div>
            </div>
            <p class="scan-hint">開啟相機掃描，即可填寫客戶資料</p>
            <a class="open-form" :href="formUrl" target="_blank" rel="noopener noreferrer">開啟客戶資料表 <v-icon size="19">mdi-arrow-top-right</v-icon></a>
            <div class="share-actions">
              <button :aria-expanded="targetsOpen" @click="shareLink"><v-icon size="17">mdi-share-variant-outline</v-icon> 分享</button>
              <button :disabled="!qrImage" @click="downloadQr"><v-icon size="18">mdi-download-outline</v-icon> 下載 QR</button>
              <button :disabled="!formUrl" @click="printOpen = true"><v-icon size="18">mdi-printer-outline</v-icon> 列印表單</button>
            </div>
            <div v-if="targetsOpen" class="share-targets" role="menu">
              <button v-for="target in shareTargets" :key="target.label" role="menuitem" @click="openTarget(target)">
                <img v-if="target.image" :src="target.image" alt="" width="22" height="22" />
                <v-icon v-else size="22">{{ target.icon }}</v-icon>
                <span>{{ target.label }}</span>
              </button>
            </div>
          </template>
          <div v-else class="share-empty" role="status">
            <div class="empty-symbol"><v-icon size="58">mdi-qrcode</v-icon></div>
            <h2>為下一次相遇做好準備</h2>
          </div>
        </template>
        <div v-else class="share-empty" role="status">
          <v-icon size="46">mdi-home-lock</v-icon>
          <h2>目前沒有可分享的建案</h2>
          <p>您需要建案的客資系統櫃台或銷售權限，請聯繫管理員協助設定。</p>
        </div>
        <div v-if="feedback" class="share-feedback" role="status">{{ feedback }}</div>
      </article>
    </section>
    <div class="scene-caption" aria-hidden="true">美好的生活，從認識彼此開始。</div>
    <BlankCustomerFormDialog
      v-model="printOpen"
      :project-id="selectedProject?.id || ''"
      :project-name="selectedProject?.name || ''"
      :sales-name="userStore.user?.name || ''"
      :form-url="formUrl"
      @notify="notify"
    />
  </main>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import backdrop from '@/assets/customer-share-bg.webp';
import lineIcon from '@/assets/icons/line.svg';
import BlankCustomerFormDialog from '@/components/BlankCustomerFormDialog.vue';
import { useUserStore } from '@/store/user';
import { useProjectStore } from '@/store/projectStore';
import { customerFormProjects, customerFormQr, customerFormUrl } from '@/utils/customerFormLink';

const userStore = useUserStore();
const projectStore = useProjectStore();
const projects = computed(() => customerFormProjects(userStore.user?.permissions, projectStore.projectsList));
const selectedId = ref('');
const selectedProject = computed(() => projects.value.find(project => project.id === selectedId.value));
const identityReady = computed(() => Boolean(userStore.user?.key && userStore.user?.name));
const qrImage = ref('');
const qrLoading = ref(false);
const qrError = ref('');
const feedback = ref('');
const card = ref(null);
const qrStage = ref(null);
const qrSize = ref(280);
let resizeObserver;
function fitQr() {
  const host = card.value;
  const stage = qrStage.value;
  if (!host || !stage) return;
  const hostStyle = getComputedStyle(host);
  let used = parseFloat(hostStyle.paddingTop) + parseFloat(hostStyle.paddingBottom);
  for (const child of host.children) {
    if (child === stage || child.classList.contains('share-feedback')) continue;
    const style = getComputedStyle(child);
    used += child.getBoundingClientRect().height + parseFloat(style.marginTop) + parseFloat(style.marginBottom);
  }
  const room = host.clientHeight - used - 12;
  const size = Math.max(96, Math.min(280, host.clientWidth - 56, Math.floor(room)));
  if (size !== qrSize.value) qrSize.value = size;
}
let feedbackTimer;
let generation = 0;
const formUrl = computed(() => customerFormUrl(window.location.href, selectedProject.value?.id, userStore.user, selectedProject.value?.name));
watch(projects, list => {
  if (!list.some(project => project.id === selectedId.value)) selectedId.value = list.length === 1 ? list[0].id : '';
}, { immediate: true });
async function generateQr() {
  const current = ++generation;
  qrImage.value = '';
  qrError.value = '';
  qrLoading.value = Boolean(formUrl.value);
  if (!formUrl.value) return;
  try {
    const result = await customerFormQr(formUrl.value, selectedProject.value.name, userStore.user.name);
    if (current === generation) qrImage.value = result;
  } catch {
    if (current === generation) qrError.value = 'QR Code 產生失敗，您仍可使用下方表單連結。';
  } finally {
    if (current === generation) qrLoading.value = false;
  }
}
watch([formUrl, () => selectedProject.value?.name], () => { feedback.value = ''; generateQr(); }, { immediate: true });
function notify(message) {
  feedback.value = message;
  clearTimeout(feedbackTimer);
  feedbackTimer = setTimeout(() => { feedback.value = ''; }, 5000);
}
const targetsOpen = ref(false);
const printOpen = ref(false);
const shareText = computed(() => `${selectedProject.value?.name ?? ''}・${userStore.user?.name ?? ''} 的客戶資料表`);
const shareTargets = computed(() => {
  const url = encodeURIComponent(formUrl.value);
  const text = encodeURIComponent(shareText.value);
  return [
    { label: 'LINE', image: lineIcon, href: `https://social-plugins.line.me/lineit/share?url=${url}&text=${text}` },
    { label: 'WhatsApp', icon: 'mdi-whatsapp', href: `https://wa.me/?text=${text}%0A${url}` },
    { label: 'Telegram', icon: 'mdi-send-outline', href: `https://t.me/share/url?url=${url}&text=${text}` },
    { label: 'Facebook', icon: 'mdi-facebook', href: `https://www.facebook.com/sharer/sharer.php?u=${url}` },
    { label: 'Email', icon: 'mdi-email-outline', href: `mailto:?subject=${text}&body=${text}%0A${url}` },
    { label: '複製連結', icon: 'mdi-content-copy', copy: true },
  ];
});
watch(() => selectedProject.value?.id, () => { targetsOpen.value = false; });
async function shareLink() {
  const url = formUrl.value;
  if (!navigator.share) { targetsOpen.value = !targetsOpen.value; return; }
  try {
    await navigator.share({ title: `${selectedProject.value.name} 客戶資料表`, text: shareText.value, url });
  } catch (error) {
    if (error?.name === 'AbortError') return;
    if (formUrl.value === url) targetsOpen.value = true;
  }
}
function openTarget(target) {
  targetsOpen.value = false;
  if (target.copy) return copyLink();
  window.open(target.href, '_blank', 'noopener,noreferrer');
}
async function copyLink() {
  const copiedUrl = formUrl.value;
  try {
    await navigator.clipboard.writeText(copiedUrl);
    if (formUrl.value === copiedUrl) notify('已複製表單連結');
  } catch {
    if (formUrl.value !== copiedUrl) return;
    const area = document.createElement('textarea');
    area.value = copiedUrl;
    area.setAttribute('readonly', '');
    area.style.cssText = 'position:fixed;opacity:0;pointer-events:none';
    document.body.appendChild(area);
    area.select();
    let copied = false;
    try { copied = document.execCommand('copy'); } catch { copied = false; }
    area.remove();
    notify(copied ? '已複製表單連結' : '無法自動複製，請開啟客戶資料表後複製網址。');
  }
}
function downloadQr() {
  if (!qrImage.value) return;
  const link = document.createElement('a');
  link.href = qrImage.value;
  link.download = `${selectedProject.value.name}_${userStore.user.name}_客戶資料表.png`.replace(/[\\/:*?"<>|]/g, '_');
  link.click();
}
watch(() => selectedProject.value?.id, () => nextTick(fitQr));
onMounted(() => {
  resizeObserver = new ResizeObserver(() => fitQr());
  if (card.value) resizeObserver.observe(card.value);
  window.addEventListener('resize', fitQr);
  nextTick(fitQr);
});
onBeforeUnmount(() => {
  generation++;
  clearTimeout(feedbackTimer);
  resizeObserver?.disconnect();
  window.removeEventListener('resize', fitQr);
});
</script>

<style scoped>
.customer-share { box-sizing: border-box; display: flex; flex-direction: column; flex: none; position: relative; isolation: isolate; height: 100svh; overflow: hidden; background: #f5f3e9; color: #304c40; font-family: 'Noto Sans TC', system-ui, sans-serif; }
.share-backdrop { position: absolute; inset: 0; z-index: 0; pointer-events: none; background: #f5f3e9 center / cover no-repeat; }
.share-topline { flex: none; position: relative; z-index: 1; display: flex; justify-content: space-between; align-items: center; padding: 22px 38px 0 76px; gap: 12px; }
.share-brand { color: #304c40; text-decoration: none; font-size: 22px; letter-spacing: 4px; font-weight: 800; }
.share-brand span { margin-left: 14px; font-size: 11px; letter-spacing: 2px; font-weight: 500; }
.share-content { flex: 1 1 auto; min-height: 0; display: flex; flex-direction: column; position: relative; z-index: 1; width: min(424px, calc(100% - 32px)); margin: 16px auto 0; text-align: center; }
.share-heading { flex: none; position: relative; isolation: isolate; padding: 12px 24px 14px; }
.share-heading::before { content: ''; position: absolute; inset: -14px -40px; z-index: -1; pointer-events: none; background: radial-gradient(ellipse at center, #f5f3e9e6 0%, #f5f3e9b3 42%, #f5f3e900 72%); backdrop-filter: blur(9px); -webkit-backdrop-filter: blur(9px); -webkit-mask-image: radial-gradient(ellipse at center, #000 38%, transparent 72%); mask-image: radial-gradient(ellipse at center, #000 38%, transparent 72%); }
.share-heading > * { text-shadow: 0 1px 0 #ffffffd9, 0 0 8px #f5f3e9, 0 0 18px #f5f3e9, 0 0 30px #f5f3e9cc; }
.share-eyebrow { font-size: 10px; font-weight: 700; letter-spacing: 4px; color: #66795f; }
.share-heading h1 { margin: 8px 0 6px; font-size: 30px; letter-spacing: 3px; line-height: 1.4; font-weight: 650; }
.share-heading p { color: #62705f; font-size: 13px; letter-spacing: 1px; }
.share-card { flex: 1 1 auto; min-height: 0; max-height: 700px; display: flex; flex-direction: column; position: relative; overflow: hidden auto; margin-top: 16px; padding: 22px 28px; border: 1px solid #fff; border-radius: 28px; background: #fffefaF5; box-shadow: 0 18px 65px #58705012, 0 3px 8px #465e4010; }
.share-card > * { flex: none; }
.select-label { display: block; text-align: left; font-size: 11px; color: #768273; margin-bottom: 7px; }
.project-select { display: flex; align-items: center; gap: 10px; background: #f3f5ec; border: 1px solid #e2e8d9; border-radius: 13px; padding: 0 13px; }
.project-select select { appearance: none; min-width: 0; width: 100%; padding: 12px 0; color: #304c40; cursor: pointer; outline: none; font-size: 14px; }
.project-select:focus-within { outline: 2px solid #68825e; outline-offset: 3px; }
.qr-stage { flex: none; align-self: center; width: 280px; height: 280px; max-width: 100%; margin: auto; background: #fff; border: 1px solid #edf0e7; border-radius: 15px; overflow: hidden; }
.share-qr { width: 100%; height: 100%; display: block; }
.qr-placeholder { height: 100%; display: flex; flex-direction: column; gap: 15px; align-items: center; justify-content: center; padding: 18px; font-size: 13px; }
.scan-hint { margin: 0 0 14px; font-size: 12px; color: #798472; }
.open-form { display: flex; align-items: center; justify-content: center; gap: 16px; min-height: 46px; padding: 12px; border-radius: 12px; background: #46664f; color: white; text-decoration: none; font-weight: 600; font-size: 14px; }
.open-form:hover { background: #36543f; }
.share-actions { display: flex; gap: 8px; margin-top: 8px; }
.share-actions button { flex: 1; min-width: 0; min-height: 44px; display: flex; align-items: center; justify-content: center; gap: 4px; white-space: nowrap; border: 1px solid #e3e8da; background: #f8f9f3; font-size: 12px; color: #50684b; border-radius: 8px; }
.share-actions button:hover { background: #f0f3e9; }
.share-actions button:disabled { opacity: .4; cursor: default; }
.share-targets { position: absolute; left: 20px; right: 20px; bottom: 64px; z-index: 2; display: grid; grid-template-columns: repeat(3, 1fr); gap: 6px; padding: 10px; border: 1px solid #e3e8da; border-radius: 16px; background: #fffefa; box-shadow: 0 14px 40px #46664f2a; }
.share-targets button { display: flex; flex-direction: column; align-items: center; gap: 5px; padding: 10px 4px; border-radius: 10px; font-size: 11px; color: #50684b; }
.share-targets button:hover { background: #f0f3e9; }
.share-targets img { display: block; width: 22px; height: 22px; }
.share-empty { flex: 1 1 auto; min-height: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 16px 4px; color: #879a7e; }
.empty-symbol { border: 1px dashed #bac8ad; border-radius: 22px; width: 104px; height: 104px; display: grid; place-items: center; margin: 0 auto 8px; background: #f2f5ec; }
.share-empty h2 { font-size: 17px; color: #4b6347; margin: 18px 0 12px; }
.share-empty p { font-size: 13px; line-height: 1.9; color: #768273; }
.share-feedback { position: absolute; left: 0; right: 0; bottom: 6px; font-size: 12px; color: #46664f; pointer-events: none; }
.text-button { text-decoration: underline; }
.scene-caption { flex: none; position: relative; z-index: 1; width: calc(100% - 32px); margin: 10px auto 18px; text-align: center; font-size: 12px; color: #7b896f; line-height: 2.4; letter-spacing: 1px; }
button:focus-visible, a:focus-visible, input:focus-visible { outline: 2px solid #54715d; outline-offset: 4px; }
@media (max-height: 760px) {
  .share-topline { padding-top: 16px; }
  .share-content { margin-top: 8px; }
  .share-heading { padding: 6px 24px 8px; }
  .share-heading h1 { margin: 4px 0 2px; font-size: 24px; }
  .share-card { margin-top: 10px; padding: 16px 22px; border-radius: 22px; }
  .scene-caption { display: none; }
  .customer-share { padding-bottom: 14px; }
}
@media (max-width: 700px) {
  .share-topline { padding: 16px 18px 0 66px; }
  .share-brand { font-size: 19px; }
  .share-brand span, .scene-caption { display: none; }
  .customer-share { padding-bottom: 14px; }
  .share-content { margin-top: 10px; }
  .share-heading { padding: 8px 16px 10px; }
  .share-heading h1 { font-size: 26px; }
  .share-heading p { font-size: 12px; letter-spacing: .5px; }
  .share-card { padding: 18px 20px; margin-top: 12px; border-radius: 24px; }
}
</style>
