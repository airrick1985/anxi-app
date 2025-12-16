<template>
  <div class="policy-wrapper">
    <v-container class="policy-container">
      <div class="text-center mb-8">
        <h1 class="text-h3 font-weight-bold mb-2">隱私權政策</h1>
        <div class="text-subtitle-1 text-grey">Privacy Policy</div>
        <p class="mt-4 text-body-2 text-grey-darken-1">最後更新日期：2025年8月2日</p>
      </div>

      <div class="content-body">
        <p>
          感謝您使用 <strong>ANXI 安熙智慧建案管理系統</strong>（以下簡稱「本服務」）。我們非常重視您的隱私權。
          本隱私權政策旨在說明當您訪問我們的網站、使用我們的行動應用程式或服務時，我們如何收集、使用、揭露及保護您的個人資訊。
        </p>

        <section>
          <h2>1. 我們收集的資訊</h2>
          <p>為了提供完整的功能並優化您的使用體驗，我們可能會收集以下類型的資訊：</p>
          <ul>
            <li><strong>帳號資訊：</strong>當您註冊或登入時，我們會收集您的姓名、電子郵件地址、電話號碼及登入憑證。</li>
            <li><strong>Google 授權資料：</strong>為驗證身分與執行特定功能，經您授權後，我們會向 Google 請求存取：
              <ul class="sub-list">
                <li>您的基本個人資料（姓名、Email）。</li>
                <li>讀取與寫入您 Google 試算表的權限（僅用於將系統資料匯出或同步至您指定的檔案）。</li>
              </ul>
            </li>
            <li><strong>使用數據：</strong>包括您的 IP 地址、瀏覽器類型、存取時間、點擊流向數據以及您在本服務中的操作紀錄。</li>
            <li><strong>建案與客戶資料：</strong>您上傳至系統的建案資訊、戶別數據、客戶資料與驗屋紀錄等業務數據。</li>
          </ul>
        </section>

        <section>
          <h2>2. 我們如何使用您的資訊</h2>
          <p>我們將收集的資訊用於以下用途：</p>
          <ul>
            <li><strong>服務提供：</strong>驗證您的身分、處理訂閱訂單、開通系統權限及執行您要求的操作（如產生報表）。</li>
            <li><strong>系統優化：</strong>分析使用趨勢以改善系統效能、修復錯誤並開發新功能。</li>
            <li><strong>客戶服務：</strong>回應您的諮詢、發送系統通知（如維護公告、訂閱到期提醒）。</li>
            <li><strong>安全性：</strong>偵測並防止詐欺、未經授權的存取或其他非法活動。</li>
          </ul>
        </section>

        <section>
          <h2>3. 資訊分享與揭露</h2>
          <p>
            我們<strong>不會</strong>將您的個人資訊出售、出租或交易給任何第三方。我們僅在以下情況下可能分享您的資訊：
          </p>
          <ul>
            <li><strong>服務供應商：</strong>協助我們營運業務的第三方合作夥伴（如雲端主機服務、金流支付處理商），其僅在必要範圍內接觸您的資料，並受保密協議約束。</li>
            <li><strong>法律要求：</strong>若為了遵守法律義務、法院命令或回應執法單位的合法要求。</li>
            <li><strong>企業轉讓：</strong>若本公司涉及合併、收購或資產出售，您的使用者資料可能作為交易資產的一部分。</li>
          </ul>
        </section>

        <section>
          <h2>4. 資料儲存與安全</h2>
          <p>
            我們採取符合業界標準的技術與組織措施（如 SSL 加密傳輸、存取控制權限）來保護您的資料安全。
            然而，網際網路傳輸無法保證 100% 安全，我們將盡商業上合理的努力保護您的資訊。
          </p>
        </section>

        <section>
          <h2>5. 您的權利</h2>
          <p>針對您的個人資料，您享有以下權利：</p>
          <ul>
            <li><strong>查詢與存取：</strong>您可以隨時登入系統查看您的個人資料與訂閱狀態。</li>
            <li><strong>更正與刪除：</strong>若資料有誤，您可以要求更正。在不違反法律保留義務的前提下，您亦可要求刪除您的帳號。</li>
            <li><strong>撤銷授權：</strong>您可以隨時在 Google 帳戶設定中，撤銷本應用程式存取您 Google 資料的權限（但這可能導致部分功能無法使用）。</li>
          </ul>
        </section>

        <section>
          <h2>6. 聯絡我們</h2>
          <p>如果您對於本隱私權政策有任何疑問或建議，請透過以下方式與我們聯絡：</p>
          <div class="contact-info">
            <p><strong>ANXI 客服團隊</strong></p>
            <p>Email: <a href="mailto:anxismart@gmail.com">anxismart@gmail.com</a></p>
          </div>
        </section>
      </div>
      
      <div class="text-center mt-12">
        <v-btn variant="outlined" color="primary" @click="$router.go(-1)">返回上一頁</v-btn>
      </div>
    </v-container>
  </div>
</template>

<script>
export default {
  name: 'PrivacyPolicy'
}
</script>

<style scoped>
.policy-wrapper {
  background-color: #f9f9f9;
  min-height: 100vh;
  padding: 40px 0;
}

.policy-container {
  max-width: 900px;
  background-color: white;
  padding: 60px 40px;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0,0,0,0.05);
}

.content-body {
  line-height: 1.8;
  color: #333;
}

section {
  margin-bottom: 40px;
}

h2 {
  font-size: 1.5rem;
  font-weight: 700;
  color: #1976D2; /* Primary Color */
  margin-bottom: 16px;
  border-bottom: 2px solid #f0f0f0;
  padding-bottom: 10px;
}

ul {
  padding-left: 24px;
  margin-bottom: 16px;
}

li {
  margin-bottom: 8px;
}

.sub-list {
  margin-top: 8px;
  list-style-type: circle;
}

.contact-info {
  background-color: #f5f5f5;
  padding: 20px;
  border-radius: 8px;
  margin-top: 16px;
}

a {
  color: #1976D2;
  text-decoration: none;
  font-weight: 500;
}

a:hover {
  text-decoration: underline;
}

/* RWD */
@media (max-width: 600px) {
  .policy-container {
    padding: 30px 20px;
  }
  h2 {
    font-size: 1.3rem;
  }
}
</style>