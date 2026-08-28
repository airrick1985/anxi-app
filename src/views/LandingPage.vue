<template>
  <div class="lp">
    <!-- ================= A 頂欄 ================= -->
    <header class="lp-nav" :class="{ 'is-scrolled': scrolled || mobileMenu }">
      <div class="lp-container lp-nav__inner">
        <a href="#top" class="lp-brand" @click.prevent="scrollTo('top')">
          <img :src="(scrolled || mobileMenu) ? logoUrl : logoWhiteUrl" alt="ANXI" class="lp-brand__logo" />
          <span>ANXI</span>
        </a>

        <nav class="lp-nav__links">
          <a href="#features" @click.prevent="scrollTo('features')">產品功能</a>
          <a href="#pricing" @click.prevent="scrollTo('pricing')">方案價格</a>
          <a href="#contact" @click.prevent="scrollTo('contact')">聯絡我們</a>
        </nav>

        <div class="lp-nav__actions">
          <button type="button" class="lp-btn lp-btn--ghost lp-nav__login" @click="goLogin">登入</button>
          <button type="button" class="lp-btn lp-btn--primary" @click="goTrial('nav')">開始試用</button>
          <button type="button" class="lp-nav__burger" aria-label="選單" @click="mobileMenu = !mobileMenu">
            <v-icon>{{ mobileMenu ? 'mdi-close' : 'mdi-menu' }}</v-icon>
          </button>
        </div>
      </div>

      <transition name="lp-menu">
        <div v-if="mobileMenu" class="lp-nav__mobile">
          <a href="#features" @click.prevent="scrollTo('features')">產品功能</a>
          <a href="#pricing" @click.prevent="scrollTo('pricing')">方案價格</a>
          <a href="#contact" @click.prevent="scrollTo('contact')">聯絡我們</a>
          <a href="#login" @click.prevent="goLogin">登入</a>
        </div>
      </transition>
    </header>

    <!-- ================= B Hero ================= -->
    <section id="top" class="lp-hero">
      <!-- 背景：影片（public/video/hero-desktop.* 16:9、hero-mobile.* 9:16）；缺檔／偏好減少動態時退回靜態圖 -->
      <video
        v-if="heroVideo.enabled"
        :key="heroVideo.variant"
        class="lp-hero__bg lp-hero__video"
        autoplay
        muted
        loop
        playsinline
        preload="auto"
        :poster="heroImage"
        aria-hidden="true"
      >
        <source :src="heroVideo.webm" type="video/webm" />
        <source :src="heroVideo.mp4" type="video/mp4" @error="onHeroVideoError" />
      </video>
      <img v-else :src="heroImage" alt="" class="lp-hero__bg" fetchpriority="high" />
      <div class="lp-hero__shade"></div>

      <div class="lp-container lp-hero__inner">
        <h1 class="lp-hero__title">
          <span class="lp-hero__line" style="--i:0">從案場銷控到</span>
          <span class="lp-hero__line" style="--i:1">交屋驗屋，</span>
          <span class="lp-hero__line" style="--i:2">一個平台全部搞定</span>
        </h1>

        <div class="lp-hero__foot">
          <p class="lp-hero__desc">
            銷控報價、客資、線上預約、驗屋修繕、形象網站，<br class="lp-br-md" />
            一站整合，讓建案管理快人一步。
          </p>
          <div class="lp-hero__cta">
            <button type="button" class="lp-cta" @click="goTrial('hero')">
              <span>開始試用</span>
              <span class="lp-cta__arrow"><v-icon size="18">mdi-arrow-right</v-icon></span>
            </button>
            <a class="lp-cta-text" href="https://lin.ee/rBZmaUG" target="_blank" rel="noopener">
              <v-icon size="18">mdi-chat-outline</v-icon> LINE 洽詢
            </a>
          </div>
        </div>
      </div>

      <!-- 下滑提示 -->
      <button type="button" class="lp-hero__scroll" aria-label="向下捲動" @click="scrollTo('features')">
        <span>向下探索</span>
        <v-icon size="22">mdi-chevron-down</v-icon>
      </button>
    </section>

    <!-- ================= C 價值主張 ================= -->
    <section id="features" class="lp-section lp-section--intro">
      <div class="lp-container lp-center">
        <h2 class="lp-h2" v-reveal>一站式建案管理平台</h2>
        <p class="lp-lead" v-reveal="{ delay: 120 }">
          從銷售、客資、預約到驗屋交屋，資料一次到位。<br class="lp-br-md" />
          專為建設公司與代銷團隊打造，桌機、平板、手機皆可操作。
        </p>
      </div>

      <!-- D 藍色主打卡 -->
      <div class="lp-container">
        <article class="lp-feature-hero" v-reveal="{ delay: 160 }" @click="scrollTo('sales')">
          <div class="lp-feature-hero__text">
            <span class="lp-eyebrow lp-eyebrow--light">雲端銷控／報價系統</span>
            <h3>銷控、報價、車位、期款<br />全部在同一張表上完成</h3>
            <p>即時同步的雲端銷控表，客戶報價、櫃台銷控自由切換；付款比例自動計算，告別紙本價目表與人為錯誤。</p>
            <span class="lp-link-arrow">了解更多 <v-icon size="18">mdi-arrow-right</v-icon></span>
          </div>
          <div class="lp-feature-hero__visual">
            <ScreenFrame
              v-if="heroShowcase.desktop"
              :src="heroShowcase.desktop.src"
              :label="heroShowcase.desktop.alt"
              frame="desktop"
              class="lp-showcase__desktop"
            />
            <ScreenFrame
              v-if="heroShowcase.mobile"
              :src="heroShowcase.mobile.src"
              :label="heroShowcase.mobile.alt"
              frame="mobile"
              class="lp-showcase__mobile"
            />
          </div>
        </article>
      </div>

      <!-- E 功能總覽卡 -->
      <div class="lp-container">
        <div class="lp-grid-4" v-reveal="{ group: true, delay: 80 }">
          <article
            v-for="product in overviewProducts"
            :key="product.id"
            class="lp-card"
            data-reveal-item
            @click="scrollTo(product.id)"
          >
            <div class="lp-card__head">
              <v-icon class="lp-card__icon" size="26">{{ product.mdi }}</v-icon>
              <h3>{{ product.name }}</h3>
              <p>{{ product.tagline }}</p>
            </div>
            <div class="lp-card__shot">
              <ScreenFrame :src="product.cover.src" :label="product.cover.alt" :frame="product.cover.frame" compact />
            </div>
          </article>
        </div>
      </div>
    </section>

    <!-- ================= F 功能深入介紹 ================= -->
    <section
      v-for="(product, index) in products"
      :id="product.id"
      :key="product.id"
      class="lp-section lp-detail"
      :class="{ 'lp-detail--alt': index % 2 === 1 }"
    >
      <div class="lp-container lp-detail__inner" :class="{ 'is-reverse': index % 2 === 1 }">
        <div class="lp-detail__text" v-reveal="{ group: true }">
          <span class="lp-eyebrow" data-reveal-item>
            <v-icon size="18">{{ product.mdi }}</v-icon> {{ product.name }}
          </span>
          <h3 class="lp-h3" data-reveal-item>{{ product.slogan }}</h3>
          <p class="lp-p" data-reveal-item>{{ product.description }}</p>
          <ul class="lp-chips" data-reveal-item>
            <li v-for="feature in product.features.slice(0, 6)" :key="feature.title" class="lp-chip" :title="feature.desc">
              <v-icon size="16">mdi-check</v-icon>{{ feature.title }}
            </li>
          </ul>
          <div class="lp-detail__actions" data-reveal-item>
            <button type="button" class="lp-btn lp-btn--primary" @click="goTrial(product.id)">開始試用</button>
            <button type="button" class="lp-btn lp-btn--ghost-dark" @click="goPricing(product.id)">查看方案</button>
          </div>
        </div>

        <div class="lp-detail__visual" v-reveal="{ delay: 120 }">
          <ShotCarousel :shots="product.screens" />
        </div>
      </div>
    </section>

    <!-- ================= G 方案價格 ================= -->
    <section id="pricing" class="lp-section lp-pricing">
      <div class="lp-container">
        <div class="lp-center">
          <h2 class="lp-h2" v-reveal>方案價格</h2>
          <p class="lp-lead" v-reveal="{ delay: 100 }">選擇最適合您的建案規模與需求的方案，皆可先試用再決定。</p>
        </div>

        <div class="lp-tabs" v-reveal="{ delay: 140 }">
          <button
            v-for="product in products"
            :key="product.id"
            type="button"
            class="lp-tab"
            :class="{ 'is-active': activeTab === product.id }"
            @click="activeTab = product.id"
          >
            <v-icon size="18">{{ product.mdi }}</v-icon>{{ product.shortName }}
          </button>
        </div>

        <div class="lp-pricing__grid" :class="`lp-pricing__grid--${activeProduct.pricing.length}`">
          <article
            v-for="plan in activeProduct.pricing"
            :key="plan.name"
            class="lp-plan"
            :class="{ 'lp-plan--hot': plan.isRecommended }"
          >
            <span v-if="plan.badge" class="lp-plan__badge">{{ plan.badge }}</span>
            <div class="lp-plan__name">{{ plan.name }}</div>
            <div class="lp-plan__sub">{{ plan.subName }}</div>
            <div class="lp-plan__price">
              <strong>{{ plan.price }}</strong>
              <span v-if="plan.unit"> / {{ plan.unit }}</span>
            </div>
            <div v-if="plan.priceNote" class="lp-plan__note">{{ plan.priceNote }}</div>
            <p class="lp-plan__desc">{{ plan.desc }}</p>
            <div class="lp-plan__actions">
              <button type="button" class="lp-btn" :class="plan.isRecommended ? 'lp-btn--primary' : 'lp-btn--ghost-dark'" @click="goTrial('pricing')">開始試用</button>
              <a class="lp-btn lp-btn--link" href="https://lin.ee/rBZmaUG" target="_blank" rel="noopener">立即諮詢</a>
            </div>
          </article>
        </div>

        <div class="lp-notes">
          <div class="lp-notes__title"><v-icon size="18">mdi-information-outline</v-icon> 備註</div>
          <ul>
            <li v-for="note in activeProduct.notes" :key="note">{{ note }}</li>
          </ul>
        </div>
      </div>
    </section>

    <!-- ================= H CTA 帶 ================= -->
    <section class="lp-cta-band">
      <div class="lp-container lp-center">
        <h2 class="lp-h2 lp-h2--light" v-reveal>今天就開始試用</h2>
        <p class="lp-lead lp-lead--light" v-reveal="{ delay: 100 }">留下基本資料，立即進入測試環境，親自體驗完整流程。</p>
        <div class="lp-cta-band__actions" v-reveal="{ delay: 180 }">
          <button type="button" class="lp-btn lp-btn--primary lp-btn--lg" @click="goTrial('bottom')">開始試用</button>
          <a class="lp-btn lp-btn--outline-light lp-btn--lg" href="https://lin.ee/rBZmaUG" target="_blank" rel="noopener">
            <v-icon size="18">mdi-chat-outline</v-icon> LINE 洽詢
          </a>
        </div>
      </div>
    </section>

    <!-- ================= I Footer ================= -->
    <footer id="contact" class="lp-footer">
      <div class="lp-container lp-footer__inner">
        <div class="lp-footer__brand">
          <div class="lp-footer__logo">
            <img :src="logoWhiteUrl" alt="ANXI" />
            <span>ANXI 安熙智慧</span>
          </div>
          <p>
            我們致力於為房地產產業提供最先進的數位轉型工具，
            從銷售控管到售後服務，全方位提升您的專業形象與管理效率。
          </p>
          <div class="lp-footer__copy">&copy; {{ new Date().getFullYear() }} ANXI Smart System. All rights reserved.</div>
        </div>

        <div class="lp-footer__contact">
          <h4>聯絡我們</h4>
          <a href="tel:0980371014"><v-icon size="18">mdi-phone-outline</v-icon> 0980-371-014</a>
          <a href="https://lin.ee/rBZmaUG" target="_blank" rel="noopener"><v-icon size="18">mdi-chat-outline</v-icon> 加入 LINE 洽詢服務</a>
          <div class="lp-footer__legal">
            <router-link :to="{ name: 'PrivacyPolicy' }">隱私權政策</router-link>
            <router-link :to="{ name: 'TermsOfService' }">服務條款</router-link>
            <router-link :to="{ name: 'Login' }">登入</router-link>
          </div>
        </div>
      </div>
    </footer>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, onBeforeUnmount, defineComponent, h, watch } from 'vue';
import { useRouter } from 'vue-router';
import logoUrl from '@/assets/landing/anxi-logo.webp';        // 黑色 LOGO（白底用）
import logoWhiteUrl from '@/assets/landing/anxi-logo-white.webp'; // 白色 LOGO（深色底用）
import heroImage from '@/assets/landing/hero-poster.webp'; // 影片首幀，作為 poster／無影片時的靜態背景

const router = useRouter();

// ---------------------------------------------------------------
// 截圖素材（src/assets/landing/{system}/{name}.webp|jpg|png）
// 以 glob 載入，尚未擷取的畫面自動以佔位卡呈現，不影響建置。
// ---------------------------------------------------------------
const shotModules = import.meta.glob('@/assets/landing/*/*.{webp,jpg,png}', { eager: true, import: 'default' });
const shotMap = Object.entries(shotModules).reduce((acc, [path, src]) => {
  const base = path.split('/').pop().replace(/\.(webp|jpg|jpeg|png)$/i, '');
  acc[base] = src;
  return acc;
}, {});
const shot = (name, alt, frame = 'desktop') => ({ name, alt, frame, src: shotMap[name] || null });

// 截圖外框元件（桌機視窗框／手機框；無圖時顯示佔位）
const ScreenFrame = defineComponent({
  name: 'ScreenFrame',
  props: {
    src: { type: String, default: null },
    label: { type: String, default: '' },
    frame: { type: String, default: 'desktop' },
    compact: { type: Boolean, default: false },
  },
  setup(props) {
    return () => h('div', { class: ['lp-frame', `lp-frame--${props.frame}`, { 'lp-frame--compact': props.compact }] }, [
      props.frame === 'desktop'
        ? h('div', { class: 'lp-frame__bar' }, [h('i'), h('i'), h('i')])
        : h('div', { class: 'lp-frame__notch' }),
      props.src
        ? h('img', { src: props.src, alt: props.label, loading: 'lazy', class: 'lp-frame__img' })
        : h('div', { class: 'lp-frame__placeholder' }, [
            h('span', { class: 'mdi mdi-image-outline lp-frame__ph-icon' }),
            h('span', { class: 'lp-frame__ph-text' }, props.label || '畫面準備中'),
          ]),
    ]);
  },
});

// 截圖輪播（淡入切換；所有幻燈片疊在同一格，高度取最高者 → 不裁切）
const ShotCarousel = defineComponent({
  name: 'ShotCarousel',
  props: { shots: { type: Array, default: () => [] }, interval: { type: Number, default: 5200 } },
  setup(props) {
    const active = ref(0);
    let timer = null;
    const stop = () => { if (timer) { clearInterval(timer); timer = null; } };
    const start = () => {
      stop();
      if (props.shots.length > 1) timer = setInterval(() => { active.value = (active.value + 1) % props.shots.length; }, props.interval);
    };
    const go = (i) => { active.value = i; start(); };
    onMounted(start);
    onBeforeUnmount(stop);
    watch(() => props.shots.length, start);
    return () => h('div', { class: 'lp-shots' }, [
      h('div', { class: 'lp-shots__stage' }, props.shots.map((shot, i) =>
        h('div', { key: shot.name, class: ['lp-shots__slide', { 'is-active': i === active.value }] }, [
          h(ScreenFrame, { src: shot.src, label: shot.alt, frame: shot.frame }),
          h('div', { class: 'lp-shots__caption' }, shot.alt),
        ]))),
      props.shots.length > 1
        ? h('div', { class: 'lp-shots__dots' }, props.shots.map((shot, i) =>
            h('button', { key: shot.name, type: 'button', class: ['lp-shots__dot', { 'is-active': i === active.value }], 'aria-label': shot.alt, onClick: () => go(i) })))
        : null,
    ]);
  },
});

// ---------------------------------------------------------------
// 產品資料（沿用原首頁資料：features / pricing / notes，新增 screens）
// ---------------------------------------------------------------
const products = ref([
  {
    id: 'sales',
    name: '雲端銷控／報價系統',
    shortName: '銷控／報價',
    mdi: 'mdi-home-analytics',
    tagline: '銷控表、自動報價、車位與期款一次搞定',
    slogan: '打造高效、精準、移動化的現代案場',
    description: '專為房地產銷售團隊設計，整合銷控管理與報價流程上雲端。透過即時數據同步與專業工具，提升團隊協作效率，優化客戶購屋體驗，決策快人一步。',
    screens: [
      shot('sales-grid', '銷控表格模式'),
      shot('sales-quote', '報價單設定與預覽'),
      shot('sales-parking', '車位銷控圖面'),
      shot('sales-mobile', '手機版報價', 'mobile'),
    ],
    features: [
      { title: '銷控表系統', desc: '客戶報價、櫃台銷控，列表篩選等模式自由切換，告別紙本價目表' },
      { title: '自動報價系統', desc: '各期付款方式比例系統自動計算，減少人為錯誤' },
      { title: '期款自訂義', desc: '適應各種不同價位、產品適合的比例' },
      { title: '車位銷控設定', desc: '車位報價圖面化管理' },
      { title: '底價表價調整', desc: '隨時隨地調整價格' },
      { title: '平面圖測量工具', desc: '獨家技術，各戶平面圖測量任意距離、空間面積，提升專業形象' },
      { title: '人員權限管理', desc: '區分人員角色，櫃台、銷售各司其職' },
      { title: '雲端資料夾', desc: '訂單、合約書、客戶證件資料可上傳雲端共同協作分享' },
      { title: 'AI 銷控助理', desc: '24 小時專屬 AI 助理，透過文字聊天解析成交統計與底價差異' },
    ],
    pricing: [
      { name: '彈性月繳方案', subName: '單一帳號費用', price: 'NT$ 2,500', unit: '月', desc: '適合短期專案或小型團隊，資金運用更靈活。', isRecommended: false },
      { name: '超值年繳優惠', subName: '單一帳號費用', price: 'NT$ 25,000', unit: '年', priceNote: '平均每月僅 NT$ 2,083', desc: '一次訂閱享整年優惠，現省 NT$ 5,000！', badge: '年度首選', isRecommended: true },
    ],
    notes: ['訂閱費為一個帳號費用，帳號無法共用。', '公司多人訂閱另有優惠，請聯繫我們。', '以上金額未含稅。'],
  },
  {
    id: 'customer',
    name: '客戶管理系統',
    shortName: '客戶管理',
    mdi: 'mdi-account-group',
    tagline: '客資建檔、洽談紀錄、撞客通知一站整合',
    slogan: '全方位客資整合，精準掌握每一位潛在客戶',
    description: '串聯雲端表單與後台管理，從客戶建檔、洽談紀錄追蹤到賞屋預約，提供一站式的客資解決方案。結合 LINE 自動化通知，確保團隊資訊同步，杜絕撞客爭議。',
    screens: [
      shot('customer-list', '客資列表'),
      shot('customer-log', '客戶洽談紀錄'),
      shot('vip-form-mobile', '貴賓資料表（客戶手機填寫）', 'mobile'),
    ],
    features: [
      { title: '雲端客資建立', desc: '透過手機或平板快速建檔，支援掃描 QR Code 客戶自主填表' },
      { title: '客戶資料管理', desc: '完整記錄客戶輪廓、需求與來源，集中化管理' },
      { title: '洽談紀錄追蹤', desc: '詳細記錄每次互動細節與狀態，掌握銷售歷程' },
      { title: '客戶重疊通知', desc: '系統自動比對重複客源並透過 LINE 即時通知' },
      { title: '客戶賞屋預約', desc: '整合行事曆與線上預約，輕鬆安排賞屋時段' },
      { title: '數據匯出分析', desc: '支援客資資料匯出，利於後續行銷分析使用' },
    ],
    pricing: [
      { name: '彈性月繳方案', subName: '單一帳號費用', price: 'NT$ 1,000', unit: '月', desc: '輕鬆入門，適合個人或小型銷售團隊使用。', isRecommended: false },
      { name: '超值年繳優惠', subName: '單一帳號費用', price: 'NT$ 10,000', unit: '年', priceNote: '平均每月僅 NT$ 833', desc: '長期訂閱更划算，現省 NT$ 2,000！', badge: '超值推薦', isRecommended: true },
    ],
    notes: ['訂閱費為一個帳號費用，帳號無法共用。', '如需整合 LINE 官方帳號通知功能，需額外設定。', '以上金額未含稅。'],
  },
  {
    id: 'booking',
    name: '線上預約系統',
    shortName: '線上預約',
    mdi: 'mdi-calendar-check',
    tagline: '客變、對保、驗交屋，客戶自助預約',
    slogan: '告別電話與紙本，打造流暢的客戶服務體驗',
    description: '專為建設公司與代銷團隊設計的全方位線上預約系統。無論是客變、對保還是驗交屋，透過數位化排程，大幅降低人工溝通成本，提升客戶滿意度與品牌專業形象。',
    screens: [
      shot('booking-calendar', '預約時間表（後台）'),
      shot('booking-page-mobile', '客戶線上預約頁', 'mobile'),
      shot('booking-batches', '批次與時段規則設定'),
    ],
    features: [
      { title: '多場景適用', desc: '彈性支援客變、對保、驗交屋等場景' },
      { title: '自動化通知機制', desc: '即時 Email 通知客戶及後台人員' },
      { title: '自助式管理', desc: '客戶可線上修改取消，減少溝通成本' },
      { title: '精準時段控管', desc: '自訂開放批次、時段與名額限制' },
      { title: '客製化預約項目', desc: '支援初驗、複驗、代驗等多種類型' },
      { title: '後台即時監控', desc: '隨時掌握預約狀況與手動排程權限' },
    ],
    pricing: [
      { name: '短期彈性方案', subName: '月繳 (Monthly)', price: 'NT$ 100', unit: '戶 / 月', desc: '適合短期專案使用，隨需訂閱。', isRecommended: false },
      { name: '中期優惠方案', subName: '季繳 (Quarterly)', price: 'NT$ 80', unit: '戶 / 月', desc: '一次繳納 3 個月費用，取得更佳費率。', isRecommended: false },
      { name: '年度超值方案', subName: '年繳 (Yearly)', price: 'NT$ 50', unit: '戶 / 月', desc: '一次繳納 12 個月費用，省下 50% 成本！', badge: 'CP 值最高', isRecommended: true },
    ],
    notes: ['計費說明：以上費用以建案「總戶數」為計算基準。', '大量戶別訂閱另有優惠，請聯繫我們。', '款項付清後，系統將於 1-3 個工作日內完成建置並開通。', '以上金額未含稅。'],
  },
  {
    id: 'inspection',
    name: '雲端驗屋／修繕系統',
    shortName: '驗屋／修繕',
    mdi: 'mdi-clipboard-check',
    tagline: '拍照標記、修繕追蹤、一鍵 PDF 報告',
    slogan: '數位化驗屋流程，讓交屋最後一哩路更完美',
    description: '告別繁雜的紙本作業！從缺失紀錄、廠商修繕通知到住戶點交，提供全流程數位化解決方案。自動產出專業報告，即時追蹤修繕進度，大幅提升交屋效率與售後服務滿意度。',
    screens: [
      shot('inspection-record-mobile', '驗屋紀錄拍照標記', 'mobile'),
      shot('inspection-tracking', '缺失改善追蹤'),
      shot('inspection-report', 'PDF 驗屋報告'),
    ],
    features: [
      { title: '數位化驗屋紀錄', desc: '手機平板即時拍照標記，自動生成電子缺失單' },
      { title: '缺失改善追蹤', desc: '燈號管理修繕進度，廠商派工與回報一目瞭然' },
      { title: '自動化報告生成', desc: '一鍵匯出專業 PDF 驗屋報告，節省大量文書時間' },
      { title: '住戶線上專區', desc: '住戶可掃碼登入查詢進度，即時查看修繕照片' },
      { title: '驗屋預約管理', desc: '智慧行事曆排程，自動防呆避免時段衝突' },
      { title: '電子簽名點交', desc: '支援現場數位簽名確認，無紙化完成交屋手續' },
    ],
    pricing: [
      { name: '驗屋系統計價方案', subName: '按戶計費 (Per Unit)', price: 'NT$ 500', unit: '戶', desc: '透明靈活的計價方式，依實際建案總戶數計算，用多少算多少。', badge: '交屋階段', isRecommended: true },
      { name: '修繕系統計價方案', subName: '售後服務階段', price: '請洽詢報價', unit: '', desc: '依建案規模與服務範圍客製報價。', isRecommended: false },
    ],
    notes: ['費用包含完整的驗屋系統功能與無限組數管理帳號。', '住戶端查詢介面不另收費。', '以上金額未含稅。'],
  },
  {
    id: 'website',
    name: '建案形象網站／電子表板',
    shortName: '網站／表板',
    mdi: 'mdi-web',
    tagline: '量身打造的形象網站與案場互動表板',
    slogan: '數位美學整合行銷，打造最具感染力的建案門面',
    description: '從線上的第一眼驚艷到案場的沉浸式解說。我們提供量身定做的形象網站與互動式電子表板，將建案的環境優勢、團隊實力與工法細節數位化。',
    screens: [
      shot('website-1', '建案形象網站'),
      shot('website-2', '案場電子表板'),
    ],
    features: [
      { title: '專屬主視覺設計', desc: '根據建案風格量身打造，強化品牌記憶點' },
      { title: 'RWD 響應式佈局', desc: '手機、平板、電腦完美適配，隨時隨地輕鬆瀏覽' },
      { title: '即時留資通知', desc: '表單留資後自動透過 LINE 或 Email 即時推送' },
      { title: '案場互動表板', desc: '專為銷售現場設計，流暢展示周邊與建築外觀' },
      { title: '數位化建材工法', desc: '將繁雜的施工與建材圖案化，提升銷售說服力' },
      { title: '產品規劃展示', desc: '清晰呈現樓層平面圖、家具配置與公設示意' },
      { title: '雲端更新資料', desc: '支援雲端即時更新表版內容，一次更新所有電腦確保資訊同步' },
    ],
    pricing: [
      { name: '形象網站方案', subName: '線上行銷首選', price: 'NT$ 50,000', unit: '案', desc: '含一次預告階段以及正式公開階段網站、LINE／Email 預約名單即時通知功能。', isRecommended: false },
      { name: '電子表板方案', subName: '案場解說利器', price: 'NT$ 150,000', unit: '案', desc: '雲端／離線皆可使用的互動式電子表板，提升案場解說效率與專業形象。', isRecommended: true, badge: '案場人氣' },
    ],
    notes: ['網站與表板內容資料（如圖檔、文案）由客戶提供。', '形象網站包含首年伺服器空間與網址費用。', 'LINE 通知功能需搭配建案官方帳號權限。', '以上金額未含稅。'],
  },
]);

const heroShowcase = computed(() => ({
  desktop: products.value[0].screens.find((s) => s.frame === 'desktop') || null,
  mobile: products.value[0].screens.find((s) => s.frame === 'mobile') || null,
}));
const overviewProducts = computed(() =>
  products.value.slice(1).map((p) => ({ ...p, cover: p.screens[0] }))
);

// ---------------------------------------------------------------
// 方案 tab
// ---------------------------------------------------------------
const activeTab = ref('sales');
const activeProduct = computed(() => products.value.find((p) => p.id === activeTab.value) || products.value[0]);

// ---------------------------------------------------------------
// Hero 背景影片：桌機／橫式用 16:9，手機直式用 9:16（檔案放 public/video/）
// 缺檔（source error）或使用者偏好減少動態 → 退回靜態圖
// ---------------------------------------------------------------
const VIDEO_BASE = `${import.meta.env.BASE_URL}video/`;
const portraitQuery = typeof window !== 'undefined' ? window.matchMedia('(orientation: portrait) and (max-width: 959px)') : null;
const reducedMotionQuery = typeof window !== 'undefined' ? window.matchMedia('(prefers-reduced-motion: reduce)') : null;
const heroVideo = reactive({
  enabled: !(reducedMotionQuery?.matches),
  variant: portraitQuery?.matches ? 'mobile' : 'desktop',
  get webm() { return `${VIDEO_BASE}hero-${this.variant}.webm`; },
  get mp4() { return `${VIDEO_BASE}hero-${this.variant}.mp4`; },
});
const onOrientationChange = (e) => { heroVideo.variant = e.matches ? 'mobile' : 'desktop'; heroVideo.enabled = !(reducedMotionQuery?.matches); };
const onHeroVideoError = () => { heroVideo.enabled = false; }; // 所有來源都載不到 → 靜態圖

// ---------------------------------------------------------------
// 導覽列 / 捲動
// ---------------------------------------------------------------
const scrolled = ref(false);
const mobileMenu = ref(false);
const onScroll = () => { scrolled.value = window.scrollY > 40; };

const scrollTo = (id) => {
  mobileMenu.value = false;
  const el = document.getElementById(id);
  if (!el) return;
  const top = el.getBoundingClientRect().top + window.scrollY - (id === 'top' ? 0 : 72);
  window.scrollTo({ top, behavior: 'smooth' });
};

const goLogin = () => { mobileMenu.value = false; router.push({ name: 'Login' }); };
const goTrial = (position) => {
  mobileMenu.value = false;
  router.push({ name: 'TrialSignup', query: { source: position } });
};
const goPricing = (productId) => { activeTab.value = productId; scrollTo('pricing'); };

onMounted(() => {
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
  portraitQuery?.addEventListener('change', onOrientationChange);
});
onBeforeUnmount(() => {
  window.removeEventListener('scroll', onScroll);
  portraitQuery?.removeEventListener('change', onOrientationChange);
});
</script>

<style scoped>
/* =============================================================
   Tokens
   ============================================================= */
.lp {
  --lp-primary: #2F6BFF;
  --lp-primary-dark: #1F4FD1;
  --lp-black: #0B0B0F;
  --lp-bg: #FFFFFF;
  --lp-bg-soft: #F5F6F8;
  --lp-text: #111827;
  --lp-muted: #6B7280;
  --lp-border: #E5E7EB;
  --lp-radius: 24px;
  --lp-nav-h: 64px;

  font-family: 'Inter', 'Noto Sans TC', system-ui, -apple-system, 'Segoe UI', sans-serif;
  color: var(--lp-text);
  background: var(--lp-bg);
  overflow-x: hidden;
  -webkit-font-smoothing: antialiased;
}
.lp-container { width: min(1200px, 100% - 48px); margin: 0 auto; }
.lp-center { text-align: center; }
.lp-section { padding: 96px 0; }
.lp-br-md { display: none; }

/* 標題 / 文字 */
.lp-h2 { font-size: clamp(2rem, 4vw, 3.2rem); font-weight: 700; letter-spacing: -0.02em; line-height: 1.2; margin: 0 0 16px; }
.lp-h2--light { color: #fff; }
.lp-h3 { font-size: clamp(1.6rem, 2.6vw, 2.2rem); font-weight: 700; letter-spacing: -0.015em; line-height: 1.3; margin: 12px 0 16px; }
.lp-lead { font-size: 1.1rem; line-height: 1.8; color: var(--lp-muted); max-width: 720px; margin: 0 auto; }
.lp-lead--light { color: rgba(255,255,255,.75); }
.lp-p { font-size: 1.02rem; line-height: 1.85; color: var(--lp-muted); margin: 0 0 20px; }
.lp-eyebrow {
  display: inline-flex; align-items: center; gap: 6px;
  padding: 6px 14px; border-radius: 999px;
  background: rgba(47,107,255,.08); color: var(--lp-primary);
  font-size: .85rem; font-weight: 600; letter-spacing: .02em;
}
.lp-eyebrow--light { background: rgba(255,255,255,.16); color: #fff; }

/* 按鈕 */
.lp-btn {
  display: inline-flex; align-items: center; justify-content: center; gap: 6px;
  height: 44px; padding: 0 22px; border-radius: 999px;
  font-size: .95rem; font-weight: 600; letter-spacing: 0;
  border: 1px solid transparent; cursor: pointer; text-decoration: none;
  transition: transform .2s ease, background .2s ease, color .2s ease, border-color .2s ease, box-shadow .2s ease;
  white-space: nowrap;
}
.lp-btn:hover { transform: translateY(-1px); }
.lp-btn--lg { height: 52px; padding: 0 28px; font-size: 1.02rem; }
.lp-btn--primary { background: var(--lp-primary); color: #fff; box-shadow: 0 10px 24px rgba(47,107,255,.3); }
.lp-btn--primary:hover { background: var(--lp-primary-dark); }
.lp-btn--ghost { background: rgba(255,255,255,.12); color: #fff; border-color: rgba(255,255,255,.5); backdrop-filter: blur(8px); }
.lp-btn--ghost:hover { background: rgba(255,255,255,.22); }
.lp-btn--ghost-dark { background: #fff; color: var(--lp-text); border-color: var(--lp-border); }
.lp-btn--ghost-dark:hover { border-color: var(--lp-text); }
.lp-btn--outline-light { background: transparent; color: #fff; border-color: rgba(255,255,255,.5); }
.lp-btn--outline-light:hover { background: rgba(255,255,255,.1); }
.lp-btn--link { background: transparent; color: var(--lp-muted); }
.lp-btn--link:hover { color: var(--lp-primary); transform: none; }

/* =============================================================
   A 頂欄
   ============================================================= */
.lp-nav {
  position: fixed; top: 0; left: 0; right: 0; z-index: 50;
  height: var(--lp-nav-h);
  color: #fff;
  transition: background .3s ease, color .3s ease, box-shadow .3s ease;
}
.lp-nav.is-scrolled {
  background: rgba(255,255,255,.86);
  backdrop-filter: blur(14px); -webkit-backdrop-filter: blur(14px);
  color: var(--lp-text);
  box-shadow: 0 1px 0 var(--lp-border);
}
.lp-nav__inner { height: 100%; display: flex; align-items: center; justify-content: space-between; gap: 24px; }
.lp-brand { display: flex; align-items: center; gap: 10px; color: inherit; text-decoration: none; font-weight: 700; font-size: 1.1rem; letter-spacing: .03em; }
.lp-brand__logo { height: 30px; width: auto; }
.lp-nav__links { display: flex; gap: 32px; }
.lp-nav__links a { color: inherit; opacity: .85; text-decoration: none; font-size: .95rem; font-weight: 500; transition: opacity .2s; }
.lp-nav__links a:hover { opacity: 1; }
.lp-nav__actions { display: flex; align-items: center; gap: 10px; }
.lp-nav.is-scrolled .lp-btn--ghost { background: #fff; color: var(--lp-text); border-color: var(--lp-border); }
.lp-nav__burger { display: none; background: transparent; border: 0; color: inherit; cursor: pointer; padding: 6px; }
.lp-nav__mobile {
  display: none; flex-direction: column; gap: 4px;
  padding: 8px 24px 20px; background: rgba(255,255,255,.96); color: var(--lp-text);
  box-shadow: 0 12px 30px rgba(0,0,0,.08);
}
.lp-nav__mobile a { padding: 12px 8px; text-decoration: none; color: inherit; font-weight: 500; border-bottom: 1px solid var(--lp-border); }
.lp-menu-enter-active, .lp-menu-leave-active { transition: opacity .2s ease, transform .2s ease; }
.lp-menu-enter-from, .lp-menu-leave-to { opacity: 0; transform: translateY(-8px); }

/* =============================================================
   B Hero
   ============================================================= */
.lp-hero {
  position: relative;
  /* 佔滿整個視窗：任何瀏覽器比例都只看到 Hero，往下捲才出現下一區段 */
  min-height: 100vh;
  min-height: 100dvh;
  display: flex; align-items: stretch; color: #fff; overflow: hidden;
  background: #0B1E3F;
}
.lp-hero__bg { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; object-position: center; }
.lp-hero__video { pointer-events: none; }
.lp-hero__scroll {
  position: absolute; left: 50%; bottom: 18px; transform: translateX(-50%); z-index: 2;
  display: inline-flex; flex-direction: column; align-items: center; gap: 2px;
  background: transparent; border: 0; color: rgba(255,255,255,.85); font-size: .72rem; letter-spacing: .12em; cursor: pointer; text-shadow: 0 1px 8px rgba(0,0,0,.6);
  animation: lpBob 2.2s ease-in-out infinite;
}
.lp-hero__scroll:hover { color: #fff; }
@keyframes lpBob { 0%, 100% { transform: translate(-50%, 0); } 50% { transform: translate(-50%, 6px); } }
.lp-hero__shade {
  position: absolute; inset: 0;
  background:
    linear-gradient(180deg, rgba(0,0,0,.28) 0%, rgba(0,0,0,.18) 45%, rgba(0,0,0,.66) 100%),
    linear-gradient(90deg, rgba(0,0,0,.22) 0%, rgba(0,0,0,0) 45%);
}
.lp-hero__inner {
  position: relative; z-index: 1;
  display: grid; grid-template-rows: 1fr auto; gap: 40px;
  padding: calc(var(--lp-nav-h) + 56px) 0 72px;
}
.lp-hero__title {
  margin: 0; font-size: clamp(2.4rem, 5vw, 4.5rem); font-weight: 600; line-height: 1.12; letter-spacing: -0.02em;
  display: flex; flex-direction: column; max-width: 640px;
  text-shadow: 0 2px 24px rgba(0,0,0,.45);
}
.lp-hero__line { opacity: 0; transform: translateY(24px); animation: lpFadeUp .8s cubic-bezier(.2,.7,.2,1) forwards; animation-delay: calc(var(--i) * 120ms + 100ms); }
@keyframes lpFadeUp { to { opacity: 1; transform: none; } }

.lp-hero__foot { display: flex; align-items: flex-end; justify-content: space-between; gap: 32px; }
.lp-hero__desc { margin: 0; max-width: 460px; font-size: 1rem; line-height: 1.8; color: rgba(255,255,255,.96); text-shadow: 0 1px 10px rgba(0,0,0,.55); }
.lp-hero__cta { display: flex; align-items: center; gap: 18px; }
.lp-cta {
  display: inline-flex; align-items: center; gap: 12px;
  height: 56px; padding: 0 8px 0 24px; border-radius: 999px;
  background: var(--lp-black); color: #fff; border: 1px solid rgba(255,255,255,.38);
  font-size: 1.02rem; font-weight: 600; cursor: pointer;
  box-shadow: 0 10px 30px rgba(0,0,0,.45), 0 0 0 1px rgba(255,255,255,.06);
  transition: transform .2s ease, box-shadow .2s ease, border-color .2s ease;
}
.lp-cta:hover { transform: translateY(-2px); border-color: rgba(255,255,255,.6); box-shadow: 0 16px 40px rgba(0,0,0,.5); }
.lp-cta__arrow { width: 40px; height: 40px; border-radius: 50%; background: var(--lp-primary); display: inline-flex; align-items: center; justify-content: center; }
.lp-cta-text { display: inline-flex; align-items: center; gap: 6px; color: #fff; text-decoration: none; font-weight: 500; opacity: .92; text-shadow: 0 1px 8px rgba(0,0,0,.5); }
.lp-cta-text:hover { opacity: 1; text-decoration: underline; }

/* =============================================================
   C / D / E
   ============================================================= */
.lp-section--intro { padding-top: 112px; }
.lp-section--intro .lp-center { margin-bottom: 56px; }

.lp-feature-hero {
  display: grid; grid-template-columns: minmax(0, 5fr) minmax(0, 7fr); gap: 32px; align-items: end;
  min-height: 440px; padding: 48px; border-radius: 28px;
  background: linear-gradient(135deg, #2F6BFF 0%, #2457E0 100%); color: #fff;
  overflow: hidden; cursor: pointer; position: relative;
  box-shadow: 0 30px 80px rgba(47,107,255,.25);
  transition: transform .3s ease;
}
.lp-feature-hero:hover { transform: translateY(-4px); }
.lp-feature-hero__text h3 { font-size: clamp(1.6rem, 2.6vw, 2.2rem); font-weight: 700; line-height: 1.3; margin: 18px 0 14px; letter-spacing: -0.01em; }
.lp-feature-hero__text p { line-height: 1.8; opacity: .9; max-width: 420px; margin: 0 0 20px; }
.lp-link-arrow { display: inline-flex; align-items: center; gap: 6px; font-weight: 600; }
.lp-feature-hero__visual { position: relative; min-width: 0; padding: 8px 56px 40px 0; }

.lp-grid-4 { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 20px; margin-top: 24px; }
.lp-grid-4 > * { min-width: 0; }
.lp-card {
  display: flex; flex-direction: column; gap: 20px;
  padding: 26px 26px 0; border-radius: var(--lp-radius);
  background: #fff; border: 1px solid var(--lp-border); overflow: hidden; cursor: pointer;
  transition: transform .3s ease, box-shadow .3s ease, border-color .3s ease;
}
.lp-card:hover { transform: translateY(-4px); box-shadow: 0 20px 50px rgba(17,24,39,.08); border-color: #D1D5DB; }
.lp-card__icon { color: var(--lp-primary); margin-bottom: 10px; }
.lp-card__head h3 { font-size: 1.15rem; font-weight: 700; margin: 0 0 8px; line-height: 1.4; }
.lp-card__head p { margin: 0; color: var(--lp-muted); font-size: .92rem; line-height: 1.7; }
.lp-card__shot { margin: auto -26px 0; padding: 18px 18px 0; background: var(--lp-bg-soft); border-top: 1px solid var(--lp-border); }

/* =============================================================
   截圖外框（規則見檔尾非 scoped 區塊）
   ============================================================= */

/* =============================================================
   F 深入介紹
   ============================================================= */
.lp-detail--alt { background: var(--lp-bg-soft); }
.lp-detail__inner { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); gap: 64px; align-items: center; }
.lp-detail__text, .lp-detail__visual { min-width: 0; }
.lp-detail__inner.is-reverse .lp-detail__text { order: 2; }
.lp-detail__inner.is-reverse .lp-detail__visual { order: 1; }
.lp-chips { list-style: none; padding: 0; margin: 0 0 28px; display: flex; flex-wrap: wrap; gap: 10px; }
.lp-chip { display: inline-flex; align-items: center; gap: 6px; padding: 8px 14px; border-radius: 999px; background: #fff; border: 1px solid var(--lp-border); font-size: .88rem; font-weight: 500; color: var(--lp-text); }
.lp-chip .v-icon { color: var(--lp-primary); }
.lp-detail__actions { display: flex; gap: 12px; flex-wrap: wrap; }

/* =============================================================
   G 方案價格
   ============================================================= */
.lp-pricing { background: var(--lp-bg-soft); }
.lp-tabs { display: flex; flex-wrap: wrap; justify-content: center; gap: 8px; margin: 40px 0 32px; }
.lp-tab {
  display: inline-flex; align-items: center; gap: 6px; height: 42px; padding: 0 18px; border-radius: 999px;
  background: #fff; border: 1px solid var(--lp-border); color: var(--lp-muted); font-weight: 600; font-size: .92rem; cursor: pointer;
  transition: all .2s ease;
}
.lp-tab:hover { color: var(--lp-text); }
.lp-tab.is-active { background: var(--lp-black); color: #fff; border-color: var(--lp-black); }
.lp-pricing__grid { display: grid; gap: 20px; grid-template-columns: repeat(3, 1fr); max-width: 1000px; margin: 0 auto; }
.lp-pricing__grid--2 { grid-template-columns: repeat(2, 1fr); max-width: 760px; }
.lp-plan {
  position: relative; display: flex; flex-direction: column; gap: 6px;
  padding: 36px 30px 28px; border-radius: var(--lp-radius);
  background: #fff; border: 1px solid var(--lp-border);
  transition: transform .3s ease, box-shadow .3s ease;
}
.lp-plan:hover { transform: translateY(-4px); box-shadow: 0 20px 50px rgba(17,24,39,.08); }
.lp-plan--hot { background: var(--lp-black); color: #fff; border-color: var(--lp-black); }
.lp-plan__badge { position: absolute; top: -14px; left: 28px; padding: 6px 14px; border-radius: 999px; background: var(--lp-primary); color: #fff; font-size: .78rem; font-weight: 700; box-shadow: 0 8px 20px rgba(47,107,255,.35); }
.lp-plan__name { font-size: 1.2rem; font-weight: 700; }
.lp-plan__sub { font-size: .85rem; opacity: .7; }
.lp-plan__price { margin-top: 16px; }
.lp-plan__price strong { font-size: 2rem; font-weight: 700; letter-spacing: -0.02em; }
.lp-plan__price span { opacity: .7; font-weight: 500; }
.lp-plan__note { font-size: .82rem; color: var(--lp-primary); font-weight: 600; }
.lp-plan--hot .lp-plan__note { color: #93B4FF; }
.lp-plan__desc { margin: 14px 0 22px; line-height: 1.75; opacity: .85; font-size: .95rem; flex: 1; }
.lp-plan__actions { display: flex; align-items: center; justify-content: space-between; gap: 10px; }
.lp-plan--hot .lp-btn--link { color: rgba(255,255,255,.7); }
.lp-plan--hot .lp-btn--link:hover { color: #fff; }
.lp-notes { max-width: 1000px; margin: 32px auto 0; padding: 20px 24px; border-radius: 16px; background: #fff; border: 1px solid var(--lp-border); color: var(--lp-muted); font-size: .9rem; }
.lp-notes__title { display: flex; align-items: center; gap: 6px; font-weight: 700; color: var(--lp-text); margin-bottom: 8px; }
.lp-notes ul { margin: 0; padding-left: 20px; line-height: 1.9; }

/* =============================================================
   H CTA 帶 / I Footer
   ============================================================= */
.lp-cta-band { background: var(--lp-black); padding: 96px 0; color: #fff; }
.lp-cta-band__actions { display: flex; justify-content: center; gap: 14px; margin-top: 32px; flex-wrap: wrap; }

.lp-footer { background: #050508; color: #fff; padding: 64px 0 40px; border-top: 1px solid rgba(255,255,255,.06); }
.lp-footer__inner { display: grid; grid-template-columns: 1.2fr .8fr; gap: 48px; }
.lp-footer__logo { display: flex; align-items: center; gap: 10px; font-size: 1.2rem; font-weight: 700; margin-bottom: 16px; }
.lp-footer__logo img { height: 34px; width: auto; }
.lp-footer__brand p { max-width: 420px; line-height: 1.8; color: rgba(255,255,255,.6); font-size: .92rem; margin: 0 0 24px; }
.lp-footer__copy { font-size: .78rem; color: rgba(255,255,255,.35); }
.lp-footer__contact h4 { font-size: 1rem; font-weight: 700; margin: 0 0 14px; }
.lp-footer__contact a { display: flex; align-items: center; gap: 8px; color: rgba(255,255,255,.8); text-decoration: none; padding: 6px 0; font-size: .95rem; }
.lp-footer__contact a:hover { color: #fff; }
.lp-footer__legal { display: flex; gap: 16px; margin-top: 18px; }
.lp-footer__legal a { font-size: .82rem; color: rgba(255,255,255,.45); padding: 0; }

/* =============================================================
   v-reveal：模糊 → 清晰
   ============================================================= */
.lp :deep(.reveal) {
  opacity: 0;
  filter: blur(14px);
  transform: translateY(18px);
  transition: opacity .7s cubic-bezier(.2,.7,.2,1), filter .7s cubic-bezier(.2,.7,.2,1), transform .7s cubic-bezier(.2,.7,.2,1);
  will-change: opacity, filter, transform;
}
.lp :deep(.reveal.is-visible) { opacity: 1; filter: blur(0); transform: none; }
@media (prefers-reduced-motion: reduce) {
  .lp :deep(.reveal) { filter: none; transform: none; transition: opacity .3s ease; }
  .lp-hero__line { animation-duration: .3s; }
  .lp-hero__scroll { animation: none; }
}

/* =============================================================
   Responsive
   ============================================================= */
@media (min-width: 960px) {
  .lp-br-md { display: inline; }
}
@media (max-width: 1100px) {
  .lp-grid-4 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .lp-feature-hero { grid-template-columns: minmax(0, 1fr); }
}
@media (max-width: 959px) {
  .lp-section { padding: 72px 0; }
  .lp-nav__links, .lp-nav__login { display: none; }
  .lp-nav__burger { display: inline-flex; }
  .lp-nav__mobile { display: flex; }
  .lp-hero__inner { padding-top: calc(var(--lp-nav-h) + 32px); padding-bottom: 64px; gap: 28px; }
  .lp-hero__foot { flex-direction: column; align-items: flex-start; }
  .lp-feature-hero { padding: 32px 24px; min-height: 0; }
  .lp-feature-hero__visual { padding: 0 0 24px; }
  .lp-detail__inner { grid-template-columns: minmax(0, 1fr); gap: 36px; }
  .lp-detail__inner.is-reverse .lp-detail__text { order: 1; }
  .lp-detail__inner.is-reverse .lp-detail__visual { order: 2; }
  .lp-pricing__grid, .lp-pricing__grid--2 { grid-template-columns: 1fr; max-width: 520px; }
  .lp-footer__inner { grid-template-columns: 1fr; gap: 32px; }
}
@media (max-width: 600px) {
  .lp-container { width: min(1200px, 100% - 32px); }
  .lp-grid-4 { grid-template-columns: minmax(0, 1fr); }
  .lp-hero__title { font-size: 2.3rem; }
  .lp-cta { height: 52px; }
  .lp-plan__actions { flex-direction: column; align-items: stretch; }
}
</style>

<style>
/* 以下規則套用於以 render function 建立的內嵌元件（ScreenFrame / ShotCarousel）：
   scoped 屬性不會加到這些元素上，因此改為非 scoped、以 .lp 前綴限制範圍 */
.lp .lp-showcase__desktop { width: 100%; transform: rotate(-3deg); transition: transform .4s ease; }
.lp .lp-showcase__mobile { position: absolute; right: 0; bottom: 0; width: 132px !important; border-width: 6px !important; box-shadow: 0 24px 60px rgba(0,0,0,.35); }
.lp .lp-feature-hero:hover .lp-showcase__desktop { transform: rotate(-2deg) translateY(-6px); }
.lp .lp-card__shot .lp-frame { box-shadow: 0 12px 30px rgba(0,0,0,.12); border-radius: 12px 12px 0 0; }
.lp .lp-card__shot .lp-frame--mobile { width: 150px; border-radius: 22px 22px 0 0; border-bottom: 0; }
.lp .lp-card__shot .lp-frame--mobile .lp-frame__img,
.lp .lp-card__shot .lp-frame--mobile .lp-frame__placeholder { border-radius: 18px 18px 0 0; max-height: 200px; object-fit: cover; object-position: top; }
.lp .lp-frame { position: relative; width: 100%; max-width: 100%; min-width: 0; border-radius: 14px; overflow: hidden; background: #0F172A; box-shadow: 0 24px 60px rgba(0,0,0,.25); box-sizing: border-box; }
.lp .lp-frame--desktop .lp-frame__bar { height: 26px; display: flex; align-items: center; gap: 6px; padding: 0 12px; background: #1E293B; }
.lp .lp-frame--desktop .lp-frame__bar i { width: 9px; height: 9px; border-radius: 50%; background: #475569; }
.lp .lp-frame--desktop .lp-frame__bar i:nth-child(1) { background: #F87171; }
.lp .lp-frame--desktop .lp-frame__bar i:nth-child(2) { background: #FBBF24; }
.lp .lp-frame--desktop .lp-frame__bar i:nth-child(3) { background: #34D399; }
.lp .lp-frame__img { display: block; width: 100%; max-width: 100%; height: auto; }
.lp .lp-frame--mobile { width: 240px; max-width: 70vw; margin: 0 auto; border-radius: 32px; border: 8px solid #0F172A; background: #0F172A; }
.lp .lp-frame--mobile .lp-frame__notch { position: absolute; top: 8px; left: 50%; transform: translateX(-50%); width: 40%; height: 18px; border-radius: 999px; background: #0F172A; z-index: 2; }
.lp .lp-frame--mobile .lp-frame__img { border-radius: 24px; }
.lp .lp-frame__placeholder {
  aspect-ratio: 16 / 10; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 8px;
  background: linear-gradient(135deg, #1E293B 0%, #0F172A 100%); color: #94A3B8;
}
.lp .lp-frame--mobile .lp-frame__placeholder { aspect-ratio: 9 / 19.5; border-radius: 24px; }
.lp .lp-frame__ph-icon { font-size: 2rem; }
.lp .lp-frame__ph-text { font-size: .8rem; letter-spacing: .04em; }
.lp .lp-shots { width: 100%; min-width: 0; }
.lp .lp-shots__stage { display: grid; grid-template-columns: minmax(0, 1fr); width: 100%; }
.lp .lp-shots__slide { grid-area: 1 / 1; min-width: 0; width: 100%; opacity: 0; transition: opacity .8s ease; pointer-events: none; display: flex; flex-direction: column; align-items: center; justify-content: center; }
.lp .lp-shots__slide.is-active { opacity: 1; pointer-events: auto; }
.lp .lp-shots__slide .lp-frame--desktop { width: 100%; }
.lp .lp-shots__slide .lp-frame--mobile { width: 220px; }
.lp .lp-shots__caption { margin-top: 14px; font-size: .85rem; color: var(--lp-muted); letter-spacing: .02em; }
.lp .lp-shots__dots { display: flex; justify-content: center; gap: 8px; margin-top: 14px; }
.lp .lp-shots__dot { width: 8px; height: 8px; border-radius: 999px; border: 0; background: #D1D5DB; cursor: pointer; padding: 0; transition: width .25s ease, background .25s ease; }
.lp .lp-shots__dot.is-active { width: 24px; background: var(--lp-primary); }
@media (max-width: 959px) {
  .lp .lp-showcase__desktop { transform: none; }
  .lp .lp-showcase__mobile { display: none; }
}
</style>
