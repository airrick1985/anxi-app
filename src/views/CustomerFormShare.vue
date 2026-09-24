<template>
  <main class="customer-share">
    <ClayNeighborhood :paused="paused" />
    <div class="share-topline">
      <router-link to="/home" class="share-brand">ANXI <span>安心相遇・從這裡開始</span></router-link>
      <button class="motion-button" :aria-pressed="paused" @click="paused = !paused">
        <v-icon size="17">{{ paused ? 'mdi-play-outline' : 'mdi-pause' }}</v-icon>
        {{ paused ? '播放背景' : '暫停背景' }}
      </button>
    </div>

    <section class="share-content" aria-labelledby="share-title">
      <header class="share-heading">
        <span class="share-eyebrow">WELCOME HOME</span>
        <h1 id="share-title">客戶資料表</h1>
        <p>讓每一次相遇，都有家的開始。</p>
      </header>

      <article class="share-card">
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
            <div class="qr-stage" aria-live="polite" :aria-busy="qrLoading">
              <img v-if="qrImage" class="share-qr" :src="qrImage" :alt="`${selectedProject.name}・${userStore.user.name} 的客戶資料表 QR Code`" width="280" height="280" />
              <div v-else class="qr-placeholder">
                <template v-if="qrError"><p role="alert">{{ qrError }}</p><button class="text-button" @click="generateQr">重新產生</button></template>
                <template v-else><v-progress-circular indeterminate color="#54715d" size="32" /><p>正在準備您的 QR Code…</p></template>
              </div>
            </div>
            <div class="share-identity">
              <h2>{{ selectedProject.name }}</h2>
              <p><v-icon size="17">mdi-account-outline</v-icon> {{ userStore.user.name }}</p>
            </div>
            <p class="scan-hint">開啟相機掃描，即可填寫客戶資料</p>
            <a class="open-form" :href="formUrl" target="_blank" rel="noopener noreferrer">開啟客戶資料表 <v-icon size="19">mdi-arrow-top-right</v-icon></a>
            <div class="share-actions">
              <button @click="copyLink"><v-icon size="17">mdi-content-copy</v-icon> 複製連結</button>
              <button :disabled="!qrImage" @click="downloadQr"><v-icon size="18">mdi-download-outline</v-icon> 下載 QR Code</button>
            </div>
            <label class="url-label" for="share-url">表單連結</label>
            <input id="share-url" class="share-url" :value="formUrl" readonly @focus="$event.target.select()" />
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
    <div class="scene-caption" aria-hidden="true"><span>A LITTLE NEIGHBORHOOD</span><br />美好的生活，從認識彼此開始。</div>
  </main>
</template>

<script setup>
import { computed, onBeforeUnmount, ref, watch } from 'vue';
import ClayNeighborhood from '@/components/ClayNeighborhood.vue';
import { useUserStore } from '@/store/user';
import { useProjectStore } from '@/store/projectStore';
import { customerFormProjects, customerFormQr, customerFormUrl } from '@/utils/customerFormLink';

const userStore = useUserStore();
const projectStore = useProjectStore();
const projects = computed(() => customerFormProjects(userStore.user?.permissions, projectStore.projectsList));
const selectedId = ref('');
const selectedProject = computed(() => projects.value.find(project => project.id === selectedId.value));
const identityReady = computed(() => Boolean(userStore.user?.key && userStore.user?.name));
const paused = ref(false);
const qrImage = ref('');
const qrLoading = ref(false);
const qrError = ref('');
const feedback = ref('');
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
async function copyLink() {
  const copiedUrl = formUrl.value;
  try {
    await navigator.clipboard.writeText(copiedUrl);
    if (formUrl.value === copiedUrl) notify('已複製表單連結');
  } catch {
    if (formUrl.value !== copiedUrl) return;
    document.getElementById('share-url')?.focus();
    notify('無法自動複製，已選取下方連結，請手動複製。');
  }
}
function downloadQr() {
  if (!qrImage.value) return;
  const link = document.createElement('a');
  link.href = qrImage.value;
  link.download = `${selectedProject.value.name}_${userStore.user.name}_客戶資料表.png`.replace(/[\\/:*?"<>|]/g, '_');
  link.click();
}
onBeforeUnmount(() => { generation++; clearTimeout(feedbackTimer); });
</script>

<style scoped>
.customer-share { display: flex; flex-direction: column; flex: none; position: relative; isolation: isolate; min-height: 100svh; overflow: hidden; background: #f5f3e9; color: #304c40; font-family: 'Noto Sans TC', system-ui, sans-serif; }
.share-topline { position: relative; z-index: 1; display: flex; justify-content: space-between; align-items: center; padding: 27px 38px 0 76px; gap: 12px; }
.share-brand { color: #304c40; text-decoration: none; font-size: 22px; letter-spacing: 4px; font-weight: 800; }
.share-brand span { margin-left: 14px; font-size: 11px; letter-spacing: 2px; font-weight: 500; }
.motion-button { display: flex; align-items: center; gap: 5px; padding: 8px 12px; border: 1px solid #d3d9cd; border-radius: 24px; font-size: 12px; background: #f9faf3c9; }
.share-content { position: relative; z-index: 1; width: min(424px, calc(100% - 32px)); margin: 24px auto 32px; text-align: center; }
.share-heading { position: relative; isolation: isolate; padding: 14px 24px 16px; }
.share-heading::before { content: ''; position: absolute; inset: -14px -40px; z-index: -1; pointer-events: none; background: radial-gradient(ellipse at center, #f5f3e9e6 0%, #f5f3e9b3 42%, #f5f3e900 72%); backdrop-filter: blur(9px); -webkit-backdrop-filter: blur(9px); -webkit-mask-image: radial-gradient(ellipse at center, #000 38%, transparent 72%); mask-image: radial-gradient(ellipse at center, #000 38%, transparent 72%); }
.share-heading > * { text-shadow: 0 1px 0 #ffffffd9, 0 0 8px #f5f3e9, 0 0 18px #f5f3e9, 0 0 30px #f5f3e9cc; }
.share-eyebrow { font-size: 10px; font-weight: 700; letter-spacing: 4px; color: #66795f; }
.share-heading h1 { margin: 8px 0 6px; font-size: 30px; letter-spacing: 3px; line-height: 1.4; font-weight: 650; }
.share-heading p { color: #62705f; font-size: 13px; letter-spacing: 1px; }
.share-card { margin-top: 20px; padding: 24px 28px; border: 1px solid #fff; border-radius: 28px; background: #fffefaF5; box-shadow: 0 18px 65px #58705012, 0 3px 8px #465e4010; }
.select-label, .url-label { display: block; text-align: left; font-size: 11px; color: #768273; margin-bottom: 7px; }
.project-select { display: flex; align-items: center; gap: 10px; background: #f3f5ec; border: 1px solid #e2e8d9; border-radius: 13px; padding: 0 13px; }
.project-select select { appearance: none; min-width: 0; width: 100%; padding: 12px 0; color: #304c40; cursor: pointer; outline: none; font-size: 14px; }
.project-select:focus-within { outline: 2px solid #68825e; outline-offset: 3px; }
.qr-stage { width: min(280px, 100%); aspect-ratio: 1; margin: 18px auto 14px; background: #fff; border: 1px solid #edf0e7; border-radius: 15px; overflow: hidden; }
.share-qr { width: 100%; height: 100%; display: block; }
.qr-placeholder { height: 100%; display: flex; flex-direction: column; gap: 15px; align-items: center; justify-content: center; padding: 18px; font-size: 13px; }
.share-identity { display: flex; flex-wrap: wrap; align-items: center; justify-content: center; gap: 6px 12px; }
.share-identity h2 { max-width: 100%; font-size: 19px; font-weight: 650; letter-spacing: 2px; overflow-wrap: anywhere; }
.share-identity p { max-width: 100%; padding: 3px 9px; border-radius: 20px; background: #f0f3e9; font-size: 12px; color: #607258; overflow-wrap: anywhere; }
.scan-hint { margin: 10px 0 18px; font-size: 12px; color: #798472; }
.open-form { display: flex; align-items: center; justify-content: center; gap: 16px; min-height: 46px; padding: 12px; border-radius: 12px; background: #46664f; color: white; text-decoration: none; font-weight: 600; font-size: 14px; }
.open-form:hover { background: #36543f; }
.share-actions { display: flex; gap: 8px; margin: 8px 0 16px; }
.share-actions button { flex: 1; min-width: 0; min-height: 44px; border: 1px solid #e3e8da; background: #f8f9f3; font-size: 12px; color: #50684b; border-radius: 8px; }
.share-actions button:hover { background: #f0f3e9; }
.share-actions button:disabled { opacity: .4; cursor: default; }
.share-url { width: 100%; font-size: 11px; color: #75806e; border: 1px solid #e7eadd; border-radius: 8px; padding: 8px 10px; background: #f8f9f4; }
.share-empty { min-height: 270px; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 28px 4px 16px; color: #879a7e; }
.empty-symbol { border: 1px dashed #bac8ad; border-radius: 22px; width: 104px; height: 104px; display: grid; place-items: center; margin: 0 auto 8px; background: #f2f5ec; }
.share-empty h2 { font-size: 17px; color: #4b6347; margin: 18px 0 12px; }
.share-empty p { font-size: 13px; line-height: 1.9; color: #768273; }
.share-feedback { margin-top: 12px; font-size: 12px; color: #46664f; }
.text-button { text-decoration: underline; }
.scene-caption { position: relative; z-index: 1; width: calc(100% - 32px); margin: auto auto 28px; text-align: center; font-size: 12px; color: #7b896f; line-height: 2.4; letter-spacing: 1px; }
.scene-caption span { font-size: 9px; letter-spacing: 2px; }
button:focus-visible, a:focus-visible, input:focus-visible { outline: 2px solid #54715d; outline-offset: 4px; }
@media (max-width: 700px) {
  .share-topline { padding: 18px 18px 0 66px; }
  .share-brand { font-size: 19px; }
  .share-brand span, .scene-caption { display: none; }
  .share-content { margin: 20px auto 24px; }
  .share-heading { padding: 10px 16px 12px; }
  .share-heading h1 { font-size: 27px; }
  .share-heading p { font-size: 12px; letter-spacing: .5px; }
  .share-card { padding: 20px; margin-top: 18px; border-radius: 24px; }
  .qr-stage { margin-top: 14px; }
  .share-empty { min-height: 240px; }
}
</style>
