<template>
  <div class="trial-page">
    <!-- 頂欄（精簡版） -->
    <header class="trial-nav">
      <router-link :to="{ name: 'LandingPage' }" class="trial-brand">
        <img :src="logoUrl" alt="ANXI" class="trial-brand__logo" />
        <span>ANXI</span>
      </router-link>
      <v-btn variant="text" class="trial-nav__login" :to="{ name: 'Login' }">已有帳號？登入</v-btn>
    </header>

    <div class="trial-layout">
      <!-- 左：品牌側欄 -->
      <aside class="trial-aside">
        <div class="trial-aside__inner">
          <span class="trial-eyebrow">免費試用</span>
          <h1 class="trial-title">開始免費試用<br />ANXI 建案管理系統</h1>
          <p class="trial-lead">留下基本資料，立即進入測試環境，親自體驗銷控報價、客資、預約與驗屋修繕的完整流程。</p>

          <ul class="trial-points">
            <li><v-icon size="20">mdi-check-circle</v-icon>免安裝、免信用卡，送出即可登入</li>
            <li><v-icon size="20">mdi-check-circle</v-icon>測試建案已備妥範例資料，直接操作</li>
            <li><v-icon size="20">mdi-check-circle</v-icon>首次登入附功能導覽，30 秒認識全系統</li>
          </ul>

        </div>
      </aside>

      <!-- 右：表單 -->
      <main class="trial-main">
        <v-card class="trial-card" elevation="0">
          <template v-if="!submitting && !submitted">
            <h2 class="trial-card__title">填寫基本資料</h2>
            <p class="trial-card__desc">送出後系統會自動以測試帳號登入，並開始功能導覽。</p>

            <v-form ref="formRef" @submit.prevent="submit">
              <v-row dense>
                <v-col cols="12" sm="6">
                  <v-text-field
                    v-model.trim="form.name"
                    label="姓名"
                    placeholder="王小明"
                    variant="outlined"
                    density="comfortable"
                    :rules="rules.name"
                    autocomplete="name"
                  />
                </v-col>
                <v-col cols="12" sm="6">
                  <v-text-field
                    v-model.trim="form.phone"
                    label="手機號碼"
                    placeholder="0912345678"
                    variant="outlined"
                    density="comfortable"
                    inputmode="tel"
                    :rules="rules.phone"
                    autocomplete="tel"
                  />
                </v-col>
                <v-col cols="12">
                  <v-text-field
                    v-model.trim="form.email"
                    label="Email"
                    placeholder="name@company.com"
                    variant="outlined"
                    density="comfortable"
                    inputmode="email"
                    :rules="rules.email"
                    autocomplete="email"
                  />
                </v-col>
                <v-col cols="12">
                  <v-text-field
                    v-model.trim="form.company"
                    label="服務公司"
                    placeholder="○○建設 / ○○代銷（個人使用可填「個人」）"
                    variant="outlined"
                    density="comfortable"
                    :rules="rules.company"
                    autocomplete="organization"
                  />
                </v-col>
                <v-col cols="12">
                  <div class="trial-label">使用型態</div>
                  <v-btn-toggle
                    v-model="form.useType"
                    mandatory
                    divided
                    class="trial-toggle"
                    color="primary"
                    variant="outlined"
                  >
                    <v-btn value="personal" prepend-icon="mdi-account">個人使用</v-btn>
                    <v-btn value="company" prepend-icon="mdi-office-building">公司使用</v-btn>
                  </v-btn-toggle>
                </v-col>
                <v-col cols="12">
                  <div class="trial-label">想了解的系統（可複選，選填）</div>
                  <v-chip-group v-model="form.interests" multiple column selected-class="trial-chip--on">
                    <v-chip v-for="opt in interestOptions" :key="opt.value" :value="opt.value" variant="outlined" filter>
                      {{ opt.label }}
                    </v-chip>
                  </v-chip-group>
                </v-col>

                <!-- honeypot：真人不會看到也不會填 -->
                <v-col cols="12" class="trial-honeypot" aria-hidden="true">
                  <input v-model="form.website" type="text" name="website" tabindex="-1" autocomplete="off" />
                </v-col>

                <v-col cols="12">
                  <v-checkbox
                    v-model="form.agree"
                    :rules="rules.agree"
                    density="compact"
                    color="primary"
                    hide-details="auto"
                  >
                    <template #label>
                      <span class="text-body-2">
                        我已閱讀並同意
                        <router-link :to="{ name: 'PrivacyPolicy' }" target="_blank" class="trial-link">隱私權政策</router-link>
                        與
                        <router-link :to="{ name: 'TermsOfService' }" target="_blank" class="trial-link">服務條款</router-link>
                      </span>
                    </template>
                  </v-checkbox>
                </v-col>
              </v-row>

              <v-alert v-if="error" type="error" variant="tonal" density="compact" class="mt-2">{{ error }}</v-alert>

              <v-btn type="submit" block size="x-large" class="trial-submit mt-4" :loading="submitting">
                送出並開始試用
                <v-icon end>mdi-arrow-right</v-icon>
              </v-btn>
              <p class="trial-fineprint">送出即表示您同意我們透過 Email 或電話與您聯繫，介紹方案與服務。</p>
            </v-form>
          </template>

          <!-- 送出後轉場 -->
          <div v-else class="trial-progress">
            <div class="trial-progress__ring">
              <v-progress-circular v-if="!loginFailed" indeterminate size="72" width="5" color="primary" />
              <v-icon v-else size="72" color="warning">mdi-alert-circle-outline</v-icon>
            </div>
            <template v-if="!loginFailed">
              <h2 class="trial-card__title">正在為您準備測試環境…</h2>
              <p class="trial-card__desc">{{ progressText }}</p>
            </template>
            <template v-else>
              <h2 class="trial-card__title">測試環境暫時無法登入</h2>
              <p class="trial-card__desc">您的資料已送出，我們會盡快與您聯繫。也歡迎直接透過 LINE 洽詢。</p>
              <v-btn color="success" size="large" rounded="pill" href="https://lin.ee/rBZmaUG" target="_blank" prepend-icon="mdi-chat">LINE 洽詢</v-btn>
              <v-btn variant="text" class="mt-2" :to="{ name: 'LandingPage' }">回首頁</v-btn>
            </template>
          </div>
        </v-card>
      </main>
    </div>
  </div>
</template>

<script setup>
import { reactive, ref, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { v4 as uuidv4 } from 'uuid';
import { useUserStore } from '@/store/user';
import { submitTrialLeadAPI, loginUser } from '@/api';
import { setTrialLeadId, trackTrialEvent } from '@/utils/trialTracking';
import logoUrl from '@/assets/landing/anxi-logo.webp';

const router = useRouter();
const route = useRoute();
const userStore = useUserStore();

const formRef = ref(null);
const submitting = ref(false);
const submitted = ref(false);
const loginFailed = ref(false);
const error = ref('');
const progressText = ref('正在建立您的試用資料');

const interestOptions = [
  { label: '銷控／報價', value: 'sales' },
  { label: '客戶管理', value: 'customer' },
  { label: '線上預約', value: 'booking' },
  { label: '驗屋／修繕', value: 'inspection' },
  { label: '形象網站／表板', value: 'website' },
];

const form = reactive({
  name: '',
  phone: '',
  email: '',
  company: '',
  useType: 'company',
  interests: [],
  agree: false,
  website: '', // honeypot
});

const rules = {
  name: [(v) => !!v || '請輸入姓名', (v) => (v && v.length >= 2 && v.length <= 30) || '姓名長度需為 2–30 字'],
  phone: [(v) => !!v || '請輸入手機號碼', (v) => /^09\d{8}$/.test(v || '') || '請輸入正確的台灣手機號碼（09 開頭 10 碼）'],
  email: [(v) => !!v || '請輸入 Email', (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v || '') || 'Email 格式不正確'],
  company: [(v) => !!v || '請輸入服務公司（個人使用可填「個人」）', (v) => (v && v.length <= 60) || '公司名稱請勿超過 60 字'],
  agree: [(v) => v === true || '請先同意隱私權政策與服務條款'],
};

// 來源參數（utm）
const utm = {};
onMounted(() => {
  ['utm_source', 'utm_medium', 'utm_campaign'].forEach((k) => {
    if (route.query[k]) utm[k.replace('utm_', '')] = String(route.query[k]);
  });
  if (route.query.source) utm.entry = String(route.query.source);
});

const submit = async () => {
  error.value = '';
  const { valid } = await formRef.value.validate();
  if (!valid) return;

  submitting.value = true;
  try {
    // 1. 留資
    const result = await submitTrialLeadAPI({
      name: form.name,
      phone: form.phone,
      email: form.email,
      company: form.company,
      useType: form.useType,
      interests: form.interests,
      website: form.website,
      source: 'trial-page',
      utm,
      userAgent: navigator.userAgent,
      referrer: document.referrer || '',
    });

    if (!result || result.status !== 'success' || !result.trial?.key) {
      throw new Error(result?.message || '送出失敗，請稍後再試');
    }
    submitted.value = true;
    setTrialLeadId(result.leadId);

    // 2. 自動以試用帳號登入（沿用 Login.vue 流程）
    progressText.value = '正在登入測試帳號';
    const sessionId = uuidv4();
    const loginResult = await loginUser(result.trial.key, result.trial.password, sessionId);
    if (!loginResult || loginResult.status !== 'success' || !loginResult.user) {
      throw Object.assign(new Error(loginResult?.message || '登入失敗'), { loginStage: true });
    }
    userStore.setUser(loginResult.user, sessionId);
    trackTrialEvent('auto_login');

    // 3. 進入 Home 並啟動導覽
    progressText.value = '即將進入系統';
    router.replace({ name: 'Home', query: { tour: '1' } });
  } catch (err) {
    console.error('[TrialSignup] 送出失敗:', err);
    if (submitted.value) {
      loginFailed.value = true;
    } else {
      error.value = err?.message || '送出失敗，請稍後再試';
    }
  } finally {
    submitting.value = false;
  }
};
</script>

<style scoped>
.trial-page {
  --lp-primary: #2F6BFF;
  --lp-primary-dark: #1F4FD1;
  --lp-black: #0B0B0F;
  --lp-text: #111827;
  --lp-muted: #6B7280;
  --lp-border: #E5E7EB;
  min-height: 100vh;
  background: #F5F6F8;
  font-family: 'Inter', 'Noto Sans TC', system-ui, -apple-system, sans-serif;
  color: var(--lp-text);
}

.trial-nav {
  height: 64px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
  background: #fff;
  border-bottom: 1px solid var(--lp-border);
}
.trial-brand {
  display: flex;
  align-items: center;
  gap: 10px;
  text-decoration: none;
  color: var(--lp-text);
  font-weight: 700;
  font-size: 1.1rem;
  letter-spacing: 0.02em;
}
.trial-brand__logo { height: 32px; width: auto; }
.trial-nav__login { text-transform: none; letter-spacing: 0; color: var(--lp-muted); }

.trial-layout {
  display: grid;
  grid-template-columns: 5fr 7fr;
  min-height: calc(100vh - 64px);
}

.trial-aside {
  background: linear-gradient(160deg, #2F6BFF 0%, #1F4FD1 60%, #14318C 100%);
  color: #fff;
  padding: 64px 48px;
  display: flex;
  align-items: center;
}
.trial-aside__inner { max-width: 460px; margin: 0 auto; }
.trial-eyebrow {
  display: inline-block;
  padding: 6px 14px;
  border-radius: 999px;
  background: rgba(255,255,255,.16);
  font-size: .85rem;
  font-weight: 600;
  letter-spacing: .04em;
}
.trial-title {
  font-size: clamp(1.9rem, 3vw, 2.6rem);
  font-weight: 700;
  line-height: 1.25;
  letter-spacing: -0.02em;
  margin: 20px 0 16px;
}
.trial-lead { font-size: 1.02rem; line-height: 1.8; opacity: .92; }
.trial-points { list-style: none; padding: 0; margin: 28px 0 0; display: grid; gap: 12px; }
.trial-points li { display: flex; align-items: center; gap: 10px; font-size: .98rem; }


.trial-main { display: flex; align-items: center; justify-content: center; padding: 48px 24px; }
.trial-card {
  width: 100%;
  max-width: 620px;
  padding: 36px 36px 28px;
  border-radius: 24px !important;
  border: 1px solid var(--lp-border);
  background: #fff;
}
.trial-card__title { font-size: 1.5rem; font-weight: 700; letter-spacing: -0.01em; margin-bottom: 6px; }
.trial-card__desc { color: var(--lp-muted); margin-bottom: 20px; line-height: 1.7; }
.trial-label { font-size: .85rem; color: var(--lp-muted); margin: 4px 0 8px; font-weight: 500; }
.trial-toggle { width: 100%; }
.trial-toggle :deep(.v-btn) { flex: 1; text-transform: none; letter-spacing: 0; }
.trial-chip--on { background: rgba(47,107,255,.1) !important; border-color: var(--lp-primary) !important; color: var(--lp-primary) !important; }
.trial-link { color: var(--lp-primary); font-weight: 600; text-decoration: none; }
.trial-link:hover { text-decoration: underline; }
.trial-honeypot { position: absolute; left: -9999px; top: -9999px; height: 0; overflow: hidden; }

.trial-submit {
  background: var(--lp-primary) !important;
  color: #fff !important;
  border-radius: 999px !important;
  text-transform: none;
  letter-spacing: 0;
  font-weight: 700;
  font-size: 1.05rem;
  box-shadow: 0 12px 30px rgba(47,107,255,.35);
}
.trial-submit:hover { background: var(--lp-primary-dark) !important; }
.trial-fineprint { margin-top: 14px; font-size: .78rem; color: var(--lp-muted); text-align: center; line-height: 1.6; }

.trial-progress { text-align: center; padding: 24px 0; }
.trial-progress__ring { margin-bottom: 24px; }

@media (max-width: 959px) {
  .trial-layout { grid-template-columns: 1fr; }
  .trial-aside { padding: 36px 24px; }
  .trial-title { font-size: 1.7rem; }
  .trial-points { display: none; }
  .trial-main { padding: 24px 16px 40px; }
  .trial-card { padding: 24px 20px; }
}
</style>
