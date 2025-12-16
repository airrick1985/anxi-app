<template>
  <div class="policy-wrapper">
    <v-container class="policy-container">
      <div class="text-center mb-8">
        <h1 class="text-h3 font-weight-bold mb-2">服務條款</h1>
        <div class="text-subtitle-1 text-grey">Terms of Service</div>
        <p class="mt-4 text-body-2 text-grey-darken-1">最後更新日期：2025年8月2日</p>
      </div>

      <div class="content-body">
        <section>
          <h2>1. 同意條款</h2>
          <p>
            歡迎您使用 <strong>ANXI 安熙智慧建案管理系統</strong>（以下簡稱「本服務」）。
            當您註冊帳號、訪問或使用本服務時，即表示您已閱讀、瞭解並同意接受本服務條款（以下簡稱「本條款」）之所有內容。
            若您不同意本條款的任何部分，請立即停止使用本服務。
          </p>
        </section>

        <section>
          <h2>2. 服務內容與帳號規範</h2>
          <ul>
            <li><strong>帳號安全：</strong>您有責任維護您帳號與密碼的機密性。對於使用您的帳號進行的所有活動，您需負完全責任。若發現帳號遭盜用，請立即通知我們。</li>
            <li><strong>真實資料：</strong>註冊時您必須提供真實、準確且完整的個人資料。若提供虛假資料，我們有權暫停或終止您的帳號。</li>
            <li><strong>使用限制：</strong>您同意不將本服務用於任何非法目的，不干擾或破壞本服務的伺服器與網路連接，且不嘗試未經授權存取本服務的任何部分。</li>
          </ul>
        </section>

        <section>
          <h2>3. 訂閱與付款</h2>
          <ul>
            <li><strong>付費方案：</strong>本服務提供多種訂閱方案（如月繳、年繳）。具體價格與服務內容以您訂閱當時網頁公告為準。</li>
            <li><strong>付款：</strong>您同意按照所選方案支付相關費用。所有費用未含稅，除非另有說明。</li>
            <li><strong>自動續約：</strong>除非您在當期結束前取消訂閱，否則部分方案可能會自動續約。您可隨時於系統設定中管理您的訂閱狀態。</li>
            <li><strong>退款政策：</strong>除法律另有規定或經本公司同意外，已支付之訂閱費用概不退還。</li>
          </ul>
        </section>

        <section>
          <h2>4. 智慧財產權</h2>
          <p>
            本服務所使用之軟體、程式、網站內容（包括但不限於文字、圖片、圖表、商標、Logo）之智慧財產權，均屬 ANXI 或其權利人所有。
            未經書面授權，您不得逕自重製、修改、散布、出租、進行還原工程或創作衍生著作。
          </p>
          <p>
            <strong>您的資料：</strong>您上傳至本服務的建案數據與業務資料，其所有權仍歸您所有。您授權我們在提供服務之必要範圍內（如資料儲存、備份、產生報表）使用這些資料。
          </p>
        </section>

        <section>
          <h2>5. 免責聲明</h2>
          <p>本服務依「現況」及「現有」基礎提供，我們不保證：</p>
          <ul>
            <li>本服務將完全符合您的需求。</li>
            <li>本服務將不受干擾、及時提供、安全可靠或無錯誤。</li>
            <li>使用本服務取得之結果均為正確或可靠。</li>
          </ul>
          <p>
            對於因不可抗力、網路中斷、系統維護或第三方服務故障導致的服務中斷或資料遺失，本公司不負損害賠償責任。
          </p>
        </section>

        <section>
          <h2>6. 服務變更與終止</h2>
          <p>
            我們保留隨時修改、暫停或終止本服務（或其任何部分）的權利，無論是否發出通知。
            若您違反本條款，我們有權立即終止您的帳號與服務使用權。
          </p>
        </section>

        <section>
          <h2>7. 準據法與管轄法院</h2>
          <p>
            本條款之解釋與適用，以及與本條款有關的爭議，均應依照中華民國法律予以處理。
            若發生訴訟，雙方同意以臺灣新竹地方法院為第一審管轄法院。
          </p>
        </section>

        <section>
          <h2>8. 聯絡資訊</h2>
          <p>若您對本服務條款有任何疑問，請聯繫我們：</p>
          <div class="contact-info">
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
  name: 'TermsOfService'
}
</script>

<style scoped>
/* 樣式與隱私權政策共用，保持一致性 */
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
  color: #1976D2;
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

@media (max-width: 600px) {
  .policy-container {
    padding: 30px 20px;
  }
  h2 {
    font-size: 1.3rem;
  }
}
</style>