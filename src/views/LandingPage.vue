<template>
  <div class="landing-page">
    
    <section class="hero-section">
      <div class="hero-overlay">
        <div class="hero-content">
          <h1 class="main-title">ANXI</h1>
          <h2 class="sub-title">您的建案管理專家</h2>
          <p class="hero-desc">智慧整合 · 高效管理 · 數據驅動</p>
          
          <div class="hero-actions">
            <v-btn 
              color="primary" 
              size="x-large" 
              rounded="pill" 
              :to="{ name: 'Login' }"
              elevation="6"
              class="cta-btn font-weight-bold px-8"
              prepend-icon="mdi-login"
            >
              登入系統
            </v-btn>
            <v-btn 
              variant="outlined"
              color="white"
              size="x-large" 
              rounded="pill" 
              href="https://lin.ee/rBZmaUG" 
              target="_blank"
              class="cta-btn font-weight-bold px-8 ml-4"
              prepend-icon="mdi-chat"
            >
              LINE 洽詢
            </v-btn>
          </div>
        </div>
      </div>
    </section>

    <v-container class="mt-n10 position-relative" style="z-index: 5;">
      <v-card elevation="8" rounded="xl" class="overflow-hidden">
        
        <div class="d-md-none pa-2 bg-white">
          <v-select
            v-model="activeTab"
            :items="mobileTabOptions"
            item-title="label"
            item-value="value"
            variant="outlined"
            density="comfortable"
            hide-details
            prepend-inner-icon="mdi-menu"
            class="font-weight-bold"
            bg-color="white"
          >
            <template v-slot:selection="{ item }">
              <div class="d-flex align-center text-primary font-weight-bold">
                <v-icon :icon="item.raw.icon" start size="small"></v-icon>
                {{ item.title }}
              </div>
            </template>
            
            <template v-slot:item="{ props, item }">
              <v-list-item v-bind="props" :prepend-icon="item.raw.icon"></v-list-item>
            </template>
          </v-select>
        </div>

        <v-tabs
          v-model="activeTab"
          bg-color="white"
          color="primary"
          align-tabs="center"
          grow
          show-arrows
          class="product-tabs d-none d-md-block"
        >
          <v-tab value="sales" class="text-h6 font-weight-bold px-4">
            <v-icon start size="large" class="mr-2" icon="mdi-home-analytics"></v-icon>
            雲端銷控/報價系統
          </v-tab>
          
          <v-tab value="customer" class="text-h6 font-weight-bold px-4">
            <v-icon start size="large" class="mr-2" icon="mdi-account-group"></v-icon>
            客戶管理系統
          </v-tab>

          <v-tab value="booking" class="text-h6 font-weight-bold px-4">
            <v-icon start size="large" class="mr-2" icon="mdi-calendar-check"></v-icon>
            線上預約系統
          </v-tab>

          <v-tab value="inspection" class="text-h6 font-weight-bold px-4">
            <v-icon start size="large" class="mr-2" icon="mdi-clipboard-check"></v-icon>
            雲端驗屋/修繕系統
          </v-tab>

          <v-tab value="website" class="text-h6 font-weight-bold px-4">
            <v-icon start size="large" class="mr-2" icon="mdi-web"></v-icon>
            建案形象網站/電子表板
          </v-tab>
        </v-tabs>

      </v-card>
    </v-container>

    <div class="content-wrapper bg-grey-lighten-5 pb-16">
      
      <v-window 
  v-model="activeTab" 
>
        <v-window-item v-for="product in products" :key="product.id" :value="product.id">
          
          <v-container class="pt-12 text-center">
             <h3 class="text-h4 font-weight-bold text-primary mb-4">{{ product.name }}</h3>
             <p class="text-h5 text-grey-darken-2 font-weight-medium" style="line-height: 1.6;">
               {{ product.slogan }}
             </p>
             <p class="text-body-1 text-grey-darken-1 mt-4 mx-auto" style="max-width: 800px;">
               {{ product.description }}
             </p>
          </v-container>

          <v-container class="py-12">
            <div class="text-center mb-8">
              <h4 class="text-h4 font-weight-bold">核心功能</h4>
              <div class="section-divider mx-auto my-4"></div>
            </div>

            <v-row>
              <v-col 
                v-for="(feature, index) in product.features" 
                :key="index"
                cols="12" sm="6" md="3"
              >
                <v-card class="feature-card h-100 py-6 px-4 text-center" elevation="2" hover>
                  <div class="mb-4">
                     <v-img :src="feature.icon" width="64" height="64" class="mx-auto"></v-img>
                  </div>
                  <h5 class="text-h6 font-weight-bold mb-2">{{ feature.title }}</h5>
                  <p class="text-body-2 text-grey-darken-1">{{ feature.desc }}</p>
                </v-card>
              </v-col>
            </v-row>
          </v-container>

          <section class="pricing-section bg-white py-12">
            <v-container>
              <div class="text-center mb-12">
                <h4 class="text-h4 font-weight-bold">方案價格</h4>
                <div class="section-divider mx-auto my-4"></div>
                <p class="text-subtitle-1 text-grey">選擇最適合您的建案規模與需求的方案</p>
              </div>

              <v-row justify="center">
                <v-col 
                  v-for="(plan, index) in product.pricing" 
                  :key="index" 
                  cols="12" md="4"
                >
                  <v-card 
                    class="pricing-card h-100 d-flex flex-column text-center pt-8 pb-6" 
                    :class="{ 'recommended-plan': plan.isRecommended }"
                    :elevation="plan.isRecommended ? 12 : 2"
                    border
                  >
                    <div v-if="plan.badge" class="recommended-badge">
                      {{ plan.badge }}
                    </div>

                    <div class="text-h5 font-weight-bold mb-2">{{ plan.name }}</div>
                    <div class="text-subtitle-2 text-grey mb-4">{{ plan.subName }}</div>

                    <div class="price-area mb-6">
                      <span class="text-h3 font-weight-black text-primary">
                        {{ plan.price }}
                      </span>
                      <span class="text-body-1 text-grey font-weight-bold"> {{ plan.unit ? ' / ' + plan.unit : '' }}</span>
                      <div v-if="plan.priceNote" class="text-caption text-error font-weight-bold mt-1">
                        {{ plan.priceNote }}
                      </div>
                    </div>

                    <v-divider class="mb-6 mx-8"></v-divider>

                    <v-card-text class="flex-grow-1 pt-0">
                      <p class="text-body-1 text-grey-darken-2" style="line-height: 1.8;">
                        {{ plan.desc }}
                      </p>
                    </v-card-text>

                    <div class="px-8 mt-4">
                      <v-btn 
                        :color="plan.isRecommended ? 'primary' : 'grey-darken-3'"
                        :variant="plan.isRecommended ? 'flat' : 'outlined'"
                        block
                        rounded="pill"
                        size="large"
                        href="https://lin.ee/rBZmaUG"
                      >
                        立即諮詢
                      </v-btn>
                    </div>
                  </v-card>
                </v-col>
              </v-row>

              <v-alert 
                variant="tonal" 
                color="info" 
                class="mt-12 mx-auto" 
                max-width="900"
                border="start"
              >
                <div class="text-subtitle-1 font-weight-bold mb-2">
                  <v-icon icon="mdi-information" class="mr-1"></v-icon> 備註 (Notes)
                </div>
                <ul class="ml-6 text-body-2" style="list-style-type: disc;">
                  <li v-for="(note, nIndex) in product.notes" :key="nIndex" class="mb-1">
                    {{ note }}
                  </li>
                </ul>
              </v-alert>

            </v-container>
          </section>

        </v-window-item>
      </v-window>
    </div>

    <footer class="landing-footer bg-grey-darken-4 text-white py-12">
      <v-container>
        <v-row align="start" justify="space-between">
          <v-col cols="12" md="6" class="text-center text-md-left">
            <div class="d-flex align-center justify-center justify-md-start mb-4">
               <div class="text-h5 font-weight-bold">ANXI 安熙智慧</div>
            </div>
            <p class="text-body-2 text-grey mb-6" style="max-width: 400px; line-height: 1.8;">
              我們致力於為房地產產業提供最先進的數位轉型工具，
              從銷售控管到售後服務，全方位提升您的專業形象與管理效率。
            </p>
            <div class="text-caption text-grey-darken-1">
              &copy; {{ new Date().getFullYear() }} ANXI Smart System. All rights reserved.
            </div>
          </v-col>
          
          <v-col cols="12" md="5" class="text-center text-md-right mt-8 mt-md-0">
            <h4 class="text-h6 font-weight-bold mb-4">聯絡我們</h4>
            
            <div class="d-flex flex-column align-center align-md-end gap-2">
              <v-btn 
                variant="text" 
                color="white" 
                prepend-icon="mdi-phone"
                href="tel:0980371014"
                class="text-body-1"
              >
                0980-371-014
              </v-btn>
              
              <v-btn 
                variant="text" 
                color="white" 
                prepend-icon="mdi-chat"
                href="https://lin.ee/rBZmaUG"
                class="text-body-1"
              >
                加入 LINE 洽詢服務
              </v-btn>

              <div class="mt-4">
                <v-btn 
                variant="text" 
                color="grey" 
                size="small" 
                :to="{ name: 'PrivacyPolicy' }"
                >
                隱私權政策
                </v-btn>

                <v-btn 
                variant="text" 
                color="grey" 
                size="small" 
                :to="{ name: 'TermsOfService' }"
                >
                服務條款
                </v-btn>
              </div>
            </div>
          </v-col>
        </v-row>
      </v-container>
    </footer>

  </div>
</template>

<script setup>
import { ref } from 'vue';

// --- ✅ 1. 引入既有圖片 ---
import userManagementIcon from '@/assets/icons/user-management.png';
import statusIcon from '@/assets/icons/status.png';
import priceIcon from '@/assets/icons/price.png';
import blueprintIcon from '@/assets/icons/blueprint.png';
import subscriptionIcon from '@/assets/icons/subscription.png';
import databaseIcon from '@/assets/icons/database.png';
import emailIcon from '@/assets/icons/email.png';
import inspectionCalenderIcon from '@/assets/icons/inspection-calender .png';

// --- ✅ 2. 引入新圖片 ---
import parkingControlIcon from '@/assets/icons/parkingcontrol.png';
import accounting from '@/assets/icons/accounting.png';
import smartphoneIcon from '@/assets/icons/smartphone.png';
import scheduleIcon from '@/assets/icons/schedule.png';
import bookingIcon from '@/assets/icons/booking.png';
import realTimeMonitoringIcon from '@/assets/icons/real-time-monitoring.png';
import notesIcon from '@/assets/icons/notes.png';
import argumentIcon from '@/assets/icons/argument.png';
import monitorIcon from '@/assets/icons/monitor.png';

import checkListIcon from '@/assets/icons/check-list.png';
import fileIcon from '@/assets/icons/file.png';
import phoneCheckIcon from '@/assets/icons/phonecheck.png';
import digitalSignatureIcon from '@/assets/icons/digital-signature.png';

import floorLayoutIcon from '@/assets/icons/floor-layout.png';
import architectIcon from '@/assets/icons/architect.png';
import emailMarketingIcon from '@/assets/icons/email-marketing.png';
import webDesignIcon from '@/assets/icons/web-design.png';
import refreshdataIcon from '@/assets/icons/refresh-data.png';
import robotIcon from '@/assets/icons/robot.png';


const activeTab = ref('sales');

// ✓ 更新手機版下拉選單選項 [cite: 2025-08-25]
const mobileTabOptions = [
  { label: '雲端銷控/報價系統', value: 'sales', icon: 'mdi-home-analytics' },
  { label: '客戶管理系統', value: 'customer', icon: 'mdi-account-group' },
  { label: '線上預約系統', value: 'booking', icon: 'mdi-calendar-check' },
  { label: '雲端驗屋/修繕系統', value: 'inspection', icon: 'mdi-clipboard-check' },
  { label: '建案形象網站/電子表板', value: 'website', icon: 'mdi-web' }
];

// 產品資料結構
const products = ref([
  // 1. [Sales] 雲端銷控/報價系統
  {
    id: 'sales',
    name: '雲端銷控/報價系統',
    slogan: '打造高效、精準、移動化的現代案場',
    description: '本系統專為房地產銷售團隊設計，整合銷控管理與報價流程上雲端。透過即時數據同步與專業工具，提升團隊協作效率，優化客戶購屋體驗，決策快人一步。',
    features: [
      { title: '銷控表系統', desc: '客戶報價、櫃台銷控，列表篩選等模式自由切換，告別紙本價目表', icon: statusIcon },
      { title: '自動報價系統', desc: '各期付款方式比例系統自動計算，減少人為錯誤', icon: accounting },
      { title: '期款自訂義', desc: '適應各種不同價位、產品適合的比例', icon: subscriptionIcon },
      { title: '車位銷控設定', desc: '車位報價圖面化管理', icon: parkingControlIcon },
      { title: '底價表價調整', desc: '隨時隨地調整價格', icon: priceIcon },
      { title: '平面圖測量工具', desc: '獨家技術，各戶平面圖測量任意距離、空間面積，提升專業形象', icon: blueprintIcon },
      { title: '人員權限管理', desc: '區分人員角色，櫃台、銷售各司其職', icon: userManagementIcon },
      { title: '雲端資料夾', desc: '提供超大容量雲端空間，訂單、合約書、客戶證件資料可上傳雲端共同協作分享', icon: databaseIcon },
      { title: 'AI 銷控助理', desc: '24小時專屬 AI 助理，隨時透過文字聊天為您解析成交統計與底價差異，精準掌握各戶及車位的銷售狀態', icon: robotIcon },

    ],
    pricing: [
      {
        name: '彈性月繳方案',
        subName: '單一帳號費用',
        price: 'NT$ 2,500',
        unit: '月',
        desc: '適合短期專案或小型團隊，資金運用更靈活。',
        isRecommended: false
      },
      {
        name: '超值年繳優惠',
        subName: '單一帳號費用',
        price: 'NT$ 25,000',
        unit: '年',
        priceNote: '🔥 平均每月僅 NT$ 2,083',
        desc: '一次訂閱享整年優惠，現省 NT$ 5,000！',
        badge: '年度首選',
        isRecommended: true
      }
    ],
    notes: [
      '訂閱費為一個帳號費用，帳號無法共用。',
      '公司多人訂閱另有優惠，請聯繫我們。',
      '以上金額未含稅。'
    ]
  },

  // 2. [Customer] 客戶管理系統
  {
    id: 'customer',
    name: '客戶管理系統',
    slogan: '全方位客資整合，精準掌握每一位潛在客戶',
    description: '串聯雲端表單與後台管理，從客戶建檔、洽談紀錄追蹤到賞屋預約，提供一站式的客資解決方案。結合 LINE 自動化通知，確保團隊資訊同步，杜絕撞客爭議。',
    features: [
      { title: '雲端客資建立', desc: '透過手機或平板快速建檔，支援掃描QR Code客戶自主填表', icon: smartphoneIcon },
      { title: '客戶資料管理', desc: '完整記錄客戶輪廓、需求與來源，集中化管理', icon: userManagementIcon },
      { title: '洽談紀錄追蹤', desc: '詳細記錄每次互動細節與狀態，掌握銷售歷程', icon: notesIcon },
      { title: '客戶重疊通知', desc: '系統自動比對重複客源並透過 LINE 即時通知', icon: argumentIcon },
      { title: '客戶賞屋預約', desc: '整合行事曆與線上預約，輕鬆安排賞屋時段', icon: scheduleIcon },
      { title: '數據匯出分析', desc: '支援客資資料匯出，利於後續行銷分析使用', icon: monitorIcon },
    ],
    pricing: [
      {
        name: '彈性月繳方案',
        subName: '單一帳號費用',
        price: 'NT$ 1,000',
        unit: '月',
        desc: '輕鬆入門，適合個人或小型銷售團隊使用。',
        isRecommended: false
      },
      {
        name: '超值年繳優惠',
        subName: '單一帳號費用',
        price: 'NT$ 10,000',
        unit: '年',
        priceNote: '🔥 平均每月僅 NT$ 833',
        desc: '長期訂閱更划算，現省 NT$ 2,000！',
        badge: '超值推薦',
        isRecommended: true
      }
    ],
    notes: [
      '訂閱費為一個帳號費用，帳號無法共用。',
      '如需整合 LINE 官方帳號通知功能，需額外設定。',
      '以上金額未含稅。'
    ]
  },

  // 3. [Booking] 線上預約系統
  {
    id: 'booking',
    name: '線上預約系統',
    slogan: '告別電話與紙本，打造流暢的客戶服務體驗',
    description: '專為建設公司與代銷團隊設計的「全方位線上預約系統」。無論是客變、對保還是驗交屋，透過數位化排程，大幅降低人工溝通成本，提升客戶滿意度與品牌專業形象。',
    features: [
      { title: '多場景適用', desc: '彈性支援客變、對保、驗交屋等場景', icon: inspectionCalenderIcon },
      { title: '自動化通知機制', desc: '即時 Email 通知客戶及後台人員', icon: emailIcon },
      { title: '自助式管理', desc: '客戶可線上修改取消，減少溝通成本', icon: smartphoneIcon },
      { title: '精準時段控管', desc: '自訂開放批次、時段與名額限制', icon: scheduleIcon },
      { title: '客製化預約項目', desc: '支援初驗、複驗、代驗等多種類型', icon: bookingIcon },
      { title: '後台即時監控', desc: '隨時掌握預約狀況與手動排程權限', icon: realTimeMonitoringIcon },
    ],
    pricing: [
      {
        name: '短期彈性方案',
        subName: '月繳 (Monthly)',
        price: 'NT$ 100',
        unit: '戶 / 月',
        desc: '適合短期專案使用，隨需訂閱。',
        isRecommended: false
      },
      {
        name: '中期優惠方案',
        subName: '季繳 (Quarterly)',
        price: 'NT$ 80',
        unit: '戶 / 月',
        desc: '一次繳納 3 個月費用，取得更佳費率。',
        isRecommended: false
      },
      {
        name: '年度超值方案',
        subName: '年繳 (Yearly)',
        price: 'NT$ 50',
        unit: '戶 / 月',
        desc: '一次繳納 12 個月費用，省下 50% 成本！',
        badge: 'CP值最高 🔥',
        isRecommended: true
      }
    ],
    notes: [
      '計費說明：以上費用以建案「總戶數」為計算基準。',
      '大量戶別訂閱另有優惠，請聯繫我們。',
      '款項付清後，系統將於 1-3 個工作日內完成建置並開通。',
      '以上金額未含稅。'
    ]
  },

 // 4. [Inspection] 雲端驗屋系統
  {
    id: 'inspection',
    name: '雲端驗屋/修繕系統',
    slogan: '數位化驗屋流程，讓交屋最後一哩路更完美',
    description: '告別繁雜的紙本作業！從缺失紀錄、廠商修繕通知到住戶點交，提供全流程數位化解決方案。自動產出專業報告，即時追蹤修繕進度，大幅提升交屋效率與售後服務滿意度。',
    features: [
      { title: '數位化驗屋紀錄', desc: '手機平板即時拍照標記，自動生成電子缺失單', icon: smartphoneIcon },
      { title: '缺失改善追蹤', desc: '燈號管理修繕進度，廠商派工與回報一目瞭然', icon: checkListIcon },
      { title: '自動化報告生成', desc: '一鍵匯出專業 PDF 驗屋報告，節省大量文書時間', icon: fileIcon },
      { title: '住戶線上專區', desc: '住戶可掃碼登入查詢進度，即時查看修繕照片', icon: phoneCheckIcon },
      { title: '驗屋預約管理', desc: '智慧行事曆排程，自動防呆避免時段衝突', icon: inspectionCalenderIcon },
      { title: '電子簽名點交', desc: '支援現場數位簽名確認，無紙化完成交屋手續', icon: digitalSignatureIcon },
    ],
    pricing: [
      {
        name: '驗屋系統計價方案',
        subName: '按戶計費 (Per Unit)',
        price: 'NT$ 500',
        unit: '戶',
        desc: '透明靈活的計價方式，依實際建案總戶數計算，用多少算多少。',
        badge: '交屋階段',
        isRecommended: true
      },
      {
        name: '修繕系統計價方案',
        subName: '',
        price: '請洽詢報價',
        unit: '',
        desc: '',
        badge: '售後服務階段',
        isRecommended: true
      }
    ],
    notes: [
      '費用包含完整的驗屋系統功能與無限組數管理帳號。',
      '住戶端查詢介面不另收費。',
      '以上金額未含稅。'
    ]
  },

  // ✓ 5. [Website] 建案形象網站/電子表板 [cite: 2025-08-25]
  {
    id: 'website',
    name: '建案形象網站 / 電子表板',
    slogan: '數位美學整合行銷，打造最具感染力的建案門面',
    description: '從線上的第一眼驚艷到案場的沉浸式解說。我們提供量身定做的形象網站與互動式電子表板，將建案的環境優勢、團隊實力與工法細節數位化。',
    features: [
      { title: '專屬主視覺設計', desc: '根據建案風格量身打造，強化品牌記憶點', icon: webDesignIcon },
      { title: 'RWD 響應式佈局', desc: '手機、平板、電腦完美適配，隨時隨地輕鬆瀏覽', icon: smartphoneIcon },
      { title: '即時留資通知', desc: '表單留資後自動透過 LINE 或 Email 即時推送', icon: emailMarketingIcon },
      { title: '案場互動表板', desc: '專為銷售現場設計，流暢展示周邊與建築外觀', icon: realTimeMonitoringIcon },
      { title: '數位化建材工法', desc: '將繁雜的施工與建材圖案化，提升銷售說服力', icon: architectIcon },
      { title: '產品規劃展示', desc: '清晰呈現樓層平面圖、家具配置與公設示意', icon: floorLayoutIcon },
      { title: '雲端更新資料', desc: '支援雲端即時更新表版內容，一次更新所有電腦確保資訊同步(*僅線上版可雲端更新)', icon: refreshdataIcon },
    ],
    pricing: [
      {
        name: '形象網站方案',
        subName: '線上行銷首選',
        price: 'NT$ 50,000',
        unit: '案',
        desc: '含一次預告階段以及正式公開階段網站、LINE/Email 預約名單即時通知功能。',
        isRecommended: false
      },
      {
        name: '電子表板方案',
        subName: '案場解說利器',
        price: 'NT$ 150,000',
        unit: '案',
        desc: '雲端/離線皆可使用的互動式電子表板，提升案場解說效率與專業形象。',
        isRecommended: false
      },
    
    ],
    notes: [
      '網站與表板內容資料（如圖檔、文案）由客戶提供。',
      '形象網站包含首年伺服器空間與網址費用。',
      'LINE 通知功能需搭配建案官方帳號權限。',
      '以上金額未含稅。'
    ]
  }
]);

</script>

<style scoped>
.landing-page {
  width: 100%;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background-color: #FAFAFA;
}

/* --- Hero Section --- */
.hero-section {
  width: 100%;
  position: relative;
  background-image: url('@/assets/home-banner.webp');
  background-repeat: no-repeat;
  height: 60vh; 
  background-size: cover;
  background-position: center;
}

@media (min-width: 960px) {
  .hero-section {
    height: auto;
    aspect-ratio: 16/9; 
    background-size: 100% auto; 
    background-position: center top;
  }
}

.hero-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(to bottom, rgba(0,0,0,0.4), rgba(0,0,0,0.7));
  display: flex;
  align-items: center;
  justify-content: center;
}

.hero-content {
  text-align: center;
  color: white;
  padding: 20px;
  max-width: 800px;
  animation: fadeUp 0.8s ease-out;
}

.main-title {
  font-size: 4rem;
  font-weight: 900;
  letter-spacing: 0.2rem;
  margin-bottom: 0.5rem;
}

.sub-title {
  font-size: 2rem;
  font-weight: 400;
  margin-bottom: 1rem;
  opacity: 0.95;
}

.hero-desc {
  font-size: 1.2rem;
  margin-bottom: 2.5rem;
  letter-spacing: 0.1rem;
  opacity: 0.8;
}

/* --- Features Section --- */
.section-divider {
  width: 60px;
  height: 4px;
  background-color: #1976D2;
  border-radius: 2px;
}

.feature-card {
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  border-radius: 16px;
  border: 1px solid rgba(0,0,0,0.03);
}

.feature-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 25px rgba(0,0,0,0.08) !important;
}

/* --- Pricing Section --- */
.pricing-card {
  border-radius: 16px;
  position: relative;
  overflow: visible;
  transition: all 0.3s ease;
  background: white;
}

.pricing-card:hover {
  border-color: #1976D2;
  transform: translateY(-5px);
}

.recommended-plan {
  border: 2px solid #1976D2;
  z-index: 2;
}

.recommended-badge {
  position: absolute;
  top: -15px;
  left: 50%;
  transform: translateX(-50%);
  background-color: #FF5252;
  color: white;
  padding: 6px 20px;
  font-size: 0.9rem;
  font-weight: bold;
  border-radius: 20px;
  box-shadow: 0 4px 10px rgba(255, 82, 82, 0.3);
  white-space: nowrap;
}

/* --- Responsive --- */
@media (max-width: 600px) {
  .hero-section {
    height: 60vh;
  }
  .main-title {
    font-size: 3rem;
  }
  .sub-title {
    font-size: 1.5rem;
  }
  .recommended-plan {
    margin-top: 30px;
  }
  .pricing-card {
    margin-bottom: 20px;
  }
  .product-tabs .v-btn__content {
    letter-spacing: 0px;
  }
}

@keyframes fadeUp {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>