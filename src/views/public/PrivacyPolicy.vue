<template>
  <div class="privacy-container">
    <h1>隱私權政策 (Privacy Policy)</h1>
    <p><strong>最後更新日期：</strong>2025年8月2日</p>

    <p>感謝您使用ANXI建案管理系統！我們非常重視您的隱私。本政策旨在說明當您透過 Google 帳號授權登入我們的服務時，我們會如何處理您的資訊。</p>

    <h2>我們存取的資訊</h2>
    <p>為了讓我們的系統能夠正常運作並識別您的身分，當您授權本應用程式時，我們會向 Google 請求存取以下資料的權限：</p>
    <ul>
      <li><strong>您的基本個人資料：</strong>包括您的姓名與電子郵件地址。</li>
      <li><strong>讀取與寫入您 Google 試算表的權限：</strong>用於將系統資料儲存至您指定的試算表。</li>
      </ul>

    <h2>我們如何使用您的資訊</h2>
    <ul>
      <li><strong>身分驗證：</strong>我們使用您的電子郵件地址作為您登入我們系統的唯一識別碼，確保只有您本人能存取您自己的資料。</li>
      <li><strong>功能執行：</strong>我們需要存取您的 Google 試算表，是為了將您在網站上操作的資料儲存到您指定的試算表中。</li>
    </ul>
    <p>我們承諾，絕不會將您的資料用於上述目的以外的任何用途。</p>

    <h2>資訊分享與揭露</h2>
    <p>我們<strong>不會</strong>將您的個人資訊以任何形式出售、交易、出租或轉讓給任何外部的第三方。所有資料的處理皆在您與我們服務之間直接進行。</p>

    <h2>聯絡我們</h2>
    <p>如果您對於本隱私權政策有任何疑問，請隨時透過以下電子郵件與我們聯絡：<a href="airrick1985@gmail.com">airrick1985@gmail.com</a></p>
    </div>
</template>

<script>
export default {
  name: 'PrivacyPolicy'
}
</script>

<style scoped>
.privacy-container {
  max-width: 800px;
  margin: 40px auto;
  padding: 20px;
  line-height: 1.6;
  color: #333;
}
h1, h2 {
  border-bottom: 1px solid #eee;
  padding-bottom: 10px;
}
a {
  color: #007bff;
}
</style>