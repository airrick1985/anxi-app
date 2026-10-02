<template>
  <div class="g-page">
    <header class="g-hero">
      <div class="g-hero-inner">
        <div class="g-brand">ANXI 建案管理系統</div>
        <h1>預約系統使用說明</h1>
        <p class="g-hero-meta">後台人員版 · 更新於 {{ UPDATED_AT }}</p>
      </div>
    </header>

    <!-- 手機：頂部章節列 -->
    <nav ref="chipsEl" class="g-chips" aria-label="章節">
      <a
        v-for="s in sections"
        :key="s.id"
        :href="sectionHref(s.id)"
        :class="['g-chip', { active: activeId === s.id }]"
        :data-chip="s.id"
        @click.prevent="select(s.id)"
      >{{ s.no ? `${s.no}. ` : '' }}{{ s.title }}</a>
    </nav>

    <div class="g-layout">
      <!-- 桌機：左側目錄 -->
      <aside class="g-toc" aria-label="目錄">
        <div class="g-toc-title">目錄</div>
        <a
          v-for="s in sections"
          :key="s.id"
          :href="sectionHref(s.id)"
          :class="['g-toc-item', { active: activeId === s.id }]"
          @click.prevent="select(s.id)"
        >
          <span class="g-toc-no">{{ s.no || '·' }}</span>{{ s.title }}
        </a>
      </aside>

      <main class="g-main">
        <!-- ═════════ 開始之前 ═════════ -->
        <section id="sec-start" class="g-section" data-sec="start">
          <div class="g-sec-head">
            <div>
              <h2>開始之前</h2>
              <p class="g-lead">認識入口與權限，照下方順序設定就能開放預約。</p>
            </div>
          </div>

          <h3>進入方式</h3>
          <p>登入 <a href="https://anxismart.com" target="_blank" rel="noopener">anxismart.com</a> → 首頁「<b>驗屋預約</b>」→ 選擇建案。左上角建案名稱可切換建案。</p>

          <GuideFigure :src="shot('start-nav')" caption="左側選單">
            <div class="mk mk-drawer">
              <div class="mk-drawer-head">
                <div class="mk-strong">範例建案</div>
                <div class="mk-cap">驗屋預約管理</div>
              </div>
              <div class="mk-sub">預約管理</div>
              <div class="mk-nav active"><i class="mdi mdi-table-large"></i>戶別資料管理</div>
              <div class="mk-nav"><i class="mdi mdi-calendar-month-outline"></i>預約時間表</div>
              <div class="mk-nav"><i class="mdi mdi-folder-outline"></i>驗屋報告管理</div>
              <div class="mk-sub">系統</div>
              <div class="mk-nav"><i class="mdi mdi-cog-outline"></i>批次及系統管理</div>
              <div class="mk-nav"><i class="mdi mdi-help-circle-outline"></i>使用說明</div>
            </div>
          </GuideFigure>

          <div class="g-table-wrap">
            <table class="g-table">
              <thead><tr><th>選單</th><th>用途</th><th>需要權限</th></tr></thead>
              <tbody>
                <tr><td>戶別資料管理</td><td>各戶批次、開關、買方資料</td><td>驗屋預約管理-修改</td></tr>
                <tr><td>預約時間表</td><td>查看、新增、修改預約</td><td>驗屋預約管理-修改／檢視</td></tr>
                <tr><td>驗屋報告管理</td><td>查看客戶上傳的報告</td><td>驗屋報告管理</td></tr>
                <tr><td>批次及系統管理</td><td>項目、批次、頁面、提醒設定</td><td>驗屋預約管理-修改</td></tr>
              </tbody>
            </table>
          </div>
          <div class="g-tip"><b>只有「檢視」權限：</b>可以看預約時間表，不能新增、修改或取消預約。</div>

          <h3>設定順序</h3>
          <ol class="g-flow">
            <li v-for="f in setupFlow" :key="f.id">
              <a :href="sectionHref(f.id)" @click.prevent="select(f.id)">
                <span class="g-flow-no">{{ f.no }}</span>
                <span class="g-flow-text">{{ f.text }}</span>
              </a>
            </li>
          </ol>
        </section>

        <!-- ═════════ 1. 預約項目與方式 ═════════ -->
        <section id="sec-menu" class="g-section" data-sec="menu">
          <div class="g-sec-head">
            <span class="g-sec-no">1</span>
            <div>
              <h2>預約項目與方式</h2>
              <p class="g-lead">「項目」是客戶看到的服務（初驗、複驗、對保），「方式」是項目底下的選擇（屋主自驗、委託代驗…）。</p>
            </div>
          </div>
          <div class="g-path"><span>批次及系統管理</span><span>預約系統狀態設定</span><span>預約選單與人員</span></div>

          <h3>建立項目與方式</h3>
          <ol class="g-steps">
            <li>按「<b>新增預約項目</b>」，輸入名稱，例如：初驗。</li>
            <li>展開項目，按「<b>新增選擇方式</b>」。</li>
            <li>輸入方式名稱，或點建議字（屋主自驗、委託代驗、授權驗屋…）。</li>
            <li>需要授權書的方式，打開「<b>啟用授權/委託流程</b>」。</li>
            <li>要先問本人是否到場，再打開「<b>詢問客戶本人是否到場</b>」，客戶選「否」才跑授權。</li>
            <li>（選填）子選項：輸入後按 Enter，可加多筆。例：對保 › 需貸款 › 各家銀行。</li>
          </ol>

          <GuideFigure :src="shot('menu-items')" :width="480" caption="預約選單：項目 › 方式">
            <div class="mk">
              <div class="mk-body">
                <div class="mk-row mk-between">
                  <span class="mk-strong">預約選單設定 (項目 &gt; 方式)</span>
                  <span class="mk-btn"><i class="mdi mdi-plus"></i>新增預約項目<b class="pin">1</b></span>
                </div>
                <div class="mk-acc">
                  <div class="mk-acc-head">
                    <i class="mdi mdi-drag mk-muted"></i><span class="mk-strong">初驗</span>
                    <span class="mk-chip grey">3 種方式</span>
                    <span class="mk-grow"></span>
                    <i class="mdi mdi-pencil mk-muted"></i><i class="mdi mdi-delete mk-muted"></i>
                  </div>
                  <div class="mk-acc-body">
                    <span class="mk-btn tonal"><i class="mdi mdi-plus"></i>新增選擇方式<b class="pin">2</b></span>
                    <div class="mk-li"><i class="mdi mdi-drag mk-muted"></i>屋主自驗<span class="mk-grow"></span><i class="mdi mdi-cog mk-muted"></i><i class="mdi mdi-pencil mk-muted"></i><i class="mdi mdi-close mk-muted"></i></div>
                    <div class="mk-li"><i class="mdi mdi-drag mk-muted"></i>委託代驗<span class="mk-chip warn">需授權</span><span class="mk-chip info">1 欄位</span><span class="mk-grow"></span><span class="mk-ic"><i class="mdi mdi-cog mk-primary"></i><b class="pin sup">3</b></span><i class="mdi mdi-pencil mk-muted"></i><i class="mdi mdi-close mk-muted"></i></div>
                    <div class="mk-li"><i class="mdi mdi-drag mk-muted"></i>驗屋公司<span class="mk-chip warn">需授權</span><span class="mk-grow"></span><i class="mdi mdi-cog mk-muted"></i><i class="mdi mdi-pencil mk-muted"></i><i class="mdi mdi-close mk-muted"></i></div>
                  </div>
                </div>
                <div class="mk-acc">
                  <div class="mk-acc-head"><i class="mdi mdi-drag mk-muted"></i><span class="mk-strong">複驗</span><span class="mk-chip grey">2 種方式</span></div>
                </div>
              </div>
            </div>
          </GuideFigure>
          <div class="mk-legend"><b class="pin">1</b>新增項目　<b class="pin">2</b>新增方式　<b class="pin">3</b>設定額外欄位</div>

          <h3>額外欄位</h3>
          <p>方式右邊的 <i class="mdi mdi-cog"></i>「設定額外欄位」可加入客戶要填的資料，例如委託代驗要填「驗屋公司名稱」。</p>
          <ul class="g-list">
            <li>欄位：單行文字、多行文字、單選題、多選題、日期、地址</li>
            <li>版面：標題、說明文字、分隔線、插入連結</li>
            <li>單選／多選可加「子欄位」，選到該選項才出現</li>
            <li>完成按「<b>暫存設定</b>」</li>
          </ul>

          <h3>工作人員名單</h3>
          <p>同頁下方「<b>編輯人員</b>」輸入姓名按 Enter。時間表指派驗屋人員、排休都用這份名單。</p>

          <h3>什麼時候要按「儲存設定」</h3>
          <div class="g-table-wrap">
            <table class="g-table">
              <tbody>
                <tr><td class="g-nowrap"><span class="g-tag ok">自動儲存</span></td><td>新增、改名、刪除項目或方式；額外欄位「暫存設定」</td></tr>
                <tr><td class="g-nowrap"><span class="g-tag warn">按儲存設定</span></td><td>拖曳排序、編輯人員、名額群組</td></tr>
              </tbody>
            </table>
          </div>

          <div class="g-warn"><b>新增方式或子選項後，</b>既有批次裡它是「未開放」（名額 0）。要到批次裡開名額，客戶才選得到。</div>
          <div class="g-tip"><b>刪錯了？</b>刪除的項目、方式會放在「已刪除的…」清單，可按「復原」。</div>
        </section>

        <!-- ═════════ 2. 預約批次 ═════════ -->
        <section id="sec-batches" class="g-section" data-sec="batches">
          <div class="g-sec-head">
            <span class="g-sec-no">2</span>
            <div>
              <h2>預約批次</h2>
              <p class="g-lead">批次決定：什麼時候能預約、能約哪幾天哪些時段、名額多少。</p>
            </div>
          </div>
          <div class="g-path"><span>批次及系統管理</span><span>批次管理</span></div>

          <h3>兩組時間</h3>
          <div class="g-cards2">
            <div class="g-card">
              <div class="g-card-title"><i class="mdi mdi-clock-outline"></i>預約開放時間 ～ 預約結束時間</div>
              <p>客戶<b>可以上網預約</b>的期間</p>
              <p class="g-eg">例：9/1 10:00 ～ 9/10 18:00</p>
            </div>
            <div class="g-card">
              <div class="g-card-title"><i class="mdi mdi-calendar-range"></i>可預約起始日 ～ 可預約結束日</div>
              <p>客戶<b>可以選的驗屋日期</b></p>
              <p class="g-eg">例：9/15 ～ 9/30</p>
            </div>
          </div>

          <h3>新增批次</h3>
          <ol class="g-steps">
            <li>按「<b>新增批次</b>」。</li>
            <li>填「批次代號」（例：A1，建立後不能改）並選「預約項目」。</li>
            <li>選「名額計算模式」：共用名額或獨立名額。</li>
            <li>填上面兩組時間。</li>
            <li>選設定方式，排日期、時段、名額。</li>
            <li>按「<b>儲存</b>」。</li>
          </ol>

          <GuideFigure :src="shot('batch-dialog')" :width="560" caption="新增預約批次">
            <div class="mk">
              <div class="mk-bar">新增預約批次<span class="mk-grow"></span><i class="mdi mdi-help-circle-outline"></i></div>
              <div class="mk-body">
                <div class="mk-grid2">
                  <div class="mk-field"><label>批次代號</label><div>A1</div></div>
                  <div class="mk-field"><label>預約項目</label><div>初驗 <i class="mdi mdi-menu-down"></i></div></div>
                </div>
                <div class="mk-label">名額計算模式</div>
                <div class="mk-row">
                  <span class="mk-radio on"></span>共用名額
                  <span class="mk-radio"></span>獨立名額
                </div>
                <div class="mk-grid2">
                  <div class="mk-field"><label>預約開放時間</label><div>2026/09/01 10:00</div></div>
                  <div class="mk-field"><label>預約結束時間</label><div>2026/09/10 18:00</div></div>
                  <div class="mk-field"><label>可預約起始日</label><div>2026/09/15</div></div>
                  <div class="mk-field"><label>可預約結束日</label><div>2026/09/30</div></div>
                </div>
                <div class="mk-seg"><span class="on"><i class="mdi mdi-calendar-edit"></i>依日期設定</span><span><i class="mdi mdi-target"></i>依方式設定</span></div>
                <div class="mk-grid3">
                  <div class="mk-panel"><div class="mk-cap">① 選日期</div><div class="mk-cal"><span v-for="d in 14" :key="d" :class="{ on: [3, 4, 5, 10, 11].includes(d) }">{{ d + 14 }}</span></div></div>
                  <div class="mk-panel"><div class="mk-cap">② 新增時段</div><div class="mk-field sm"><label>時段</label><div>09:00</div></div><div class="mk-field sm"><label>預設名額</label><div>4</div></div><span class="mk-btn sm">新增</span></div>
                  <div class="mk-panel"><div class="mk-cap">③ 正在設定：09:00</div><div class="mk-li sm">時段總名額<span class="mk-grow"></span>4</div><div class="mk-li sm">屋主自驗<span class="mk-grow"></span>不限</div><div class="mk-li sm">委託代驗<span class="mk-grow"></span>2</div></div>
                </div>
              </div>
            </div>
          </GuideFigure>

          <h3>名額計算模式</h3>
          <div class="g-table-wrap">
            <table class="g-table">
              <tbody>
                <tr><td class="g-nowrap"><b>共用名額</b>（預設）</td><td>同日同時段，其他批次有人約，這個批次的剩餘名額也會減少。</td></tr>
                <tr><td class="g-nowrap"><b>獨立名額</b></td><td>只算本批次自己的名額。</td></tr>
              </tbody>
            </table>
          </div>
          <p>共用名額時，同項目的其他批次會自動共用。要跟<b>不同項目</b>共用（例：初驗＋複驗用同一組人力），在「此批次要與誰共用名額？」選「不同預約項目」並勾選項目；這個設定套用整個建案。</p>

          <h3>兩種排法</h3>
          <div class="g-cards2">
            <div class="g-card">
              <div class="g-card-title"><i class="mdi mdi-calendar-edit"></i>依日期設定</div>
              <ol class="g-mini-steps">
                <li>日曆點選日期（可多選）</li>
                <li>「新增時段」：選時段、填預設名額、勾方式 → 新增</li>
                <li>點已設定的時段，調整各方式名額</li>
              </ol>
            </div>
            <div class="g-card">
              <div class="g-card-title"><i class="mdi mdi-target"></i>依方式設定</div>
              <ol class="g-mini-steps">
                <li>勾選方式／子項目</li>
                <li>選日期、選時段、填名額</li>
                <li>按「套用至所選日期 × 時段」</li>
              </ol>
            </div>
          </div>
          <div class="g-tip"><b>各方式名額：</b>勾「不限」或留空＝不限；填 0＝這個方式不開放。各方式合計不能超過時段總名額。</div>

          <h3>日期已被其他批次設定</h3>
          <p>儲存時會跳出「日期規則設定」，每一天選一種：</p>
          <div class="g-table-wrap">
            <table class="g-table">
              <tbody>
                <tr><td class="g-nowrap"><b>沿用</b></td><td>用舊批次的時段名額</td></tr>
                <tr><td class="g-nowrap"><b>獨立</b></td><td>本項目名額獨立，不影響其他預約</td></tr>
                <tr><td class="g-nowrap"><b>覆蓋</b></td><td>用本批次的設定蓋掉舊的</td></tr>
              </tbody>
            </table>
          </div>

          <h3>批次列表</h3>
          <GuideFigure :src="shot('batch-list')" :width="560" caption="批次管理列表">
            <div class="mk">
              <div class="mk-body">
                <div class="mk-row mk-between">
                  <div class="mk-field sm grow"><label>搜尋...</label><div>&nbsp;</div></div>
                  <span class="mk-btn"><i class="mdi mdi-plus"></i>新增批次</span>
                </div>
                <div class="mk-table">
                  <div class="mk-tr mk-th"><span>批次代號</span><span>預約項目</span><span>名額模式</span><span>批次狀態</span><span>預約項目對外顯示</span><span>操作</span></div>
                  <div class="mk-tr"><span>A1</span><span>初驗</span><span><span class="mk-chip info">共用名額</span></span><span><span class="mk-chip ok">開放中</span></span><span><span class="mk-sw on"></span>客戶可見</span><span><i class="mdi mdi-eye"></i><i class="mdi mdi-pencil"></i><i class="mdi mdi-delete"></i></span></div>
                  <div class="mk-tr"><span>B1</span><span>複驗</span><span><span class="mk-chip grey">獨立名額</span></span><span><span class="mk-chip grey">尚未開放</span></span><span><span class="mk-sw"></span>已對客戶隱藏</span><span><i class="mdi mdi-eye"></i><i class="mdi mdi-pencil"></i><i class="mdi mdi-delete"></i></span></div>
                </div>
              </div>
            </div>
          </GuideFigure>
          <ul class="g-list">
            <li><b>批次狀態：</b>尚未開放／開放中／已截止</li>
            <li>時間欄位旁的 <i class="mdi mdi-pencil"></i> 可直接改單一時間</li>
            <li><i class="mdi mdi-eye"></i> 預覽：每天每時段的已約、剩餘、額滿</li>
            <li><b>客戶可見：</b>控制整個預約項目的入口。到預約開放時間會自動打開，也可手動關閉。</li>
          </ul>
          <div class="g-tip"><b>下一步：</b>到「戶別資料管理」把批次代號填給戶別。</div>
        </section>

        <!-- ═════════ 3. 戶別資料管理 ═════════ -->
        <section id="sec-households" class="g-section" data-sec="households">
          <div class="g-sec-head">
            <span class="g-sec-no">3</span>
            <div>
              <h2>戶別資料管理</h2>
              <p class="g-lead">每戶的批次代號、開關、買方資料都在這張總表，改完自動存檔。</p>
            </div>
          </div>
          <div class="g-path"><span>預約管理</span><span>戶別資料管理</span></div>

          <h3>指定批次</h3>
          <ol class="g-steps">
            <li>找到「<b>初驗批次</b>」「<b>複驗批次</b>」欄（其他項目為「項目名稱＋批次」，例：對保批次）。</li>
            <li>在該戶填入批次代號，例如 A1。</li>
            <li>自動儲存，不用按儲存。</li>
          </ol>
          <div class="g-tip"><b>大量填寫：</b>從 Excel 複製一整欄貼上，一次更新多戶。</div>
          <div class="g-warn">代號要和批次管理的「批次代號」<b>完全一樣</b>，否則客戶會看到「尚未開放」。</div>

          <GuideFigure :src="shot('households-grid')" :width="520" caption="戶別資料總表">
            <div class="mk">
              <div class="mk-row mk-between mk-pad">
                <span class="mk-strong mk-primary">範例建案 - 戶別資料總表</span>
                <span class="mk-icons"><i class="mdi mdi-table-column-plus-after"></i><i class="mdi mdi-download"></i><i class="mdi mdi-upload"></i></span>
              </div>
              <div class="mk-table">
                <div class="mk-tr mk-th"><span>預約系統開關<b class="pin">1</b></span><span>戶號<b class="pin">2</b></span><span>買方姓名</span><span>初驗批次<b class="pin">3</b></span><span>初驗報告上傳開關</span></div>
                <div class="mk-tr"><span><span class="mk-sw on"></span></span><span class="mk-link">A1-2F</span><span>王小明</span><span>A1</span><span><span class="mk-sw"></span></span></div>
                <div class="mk-tr"><span><span class="mk-sw on"></span></span><span class="mk-link">A1-3F</span><span>陳美華</span><span>A1</span><span><span class="mk-sw on"></span></span></div>
                <div class="mk-tr"><span><span class="mk-sw"></span></span><span class="mk-link">A2-2F</span><span>林志強</span><span>A2</span><span><span class="mk-sw"></span></span></div>
              </div>
            </div>
          </GuideFigure>
          <div class="mk-legend"><b class="pin">1</b>開關欄位　<b class="pin">2</b>點戶號開啟整合資訊　<b class="pin">3</b>填批次代號</div>

          <h3>開關欄位</h3>
          <div class="g-table-wrap">
            <table class="g-table">
              <tbody>
                <tr><td class="g-nowrap"><b>預約系統開關</b></td><td>打開，這戶才會出現在預約頁的戶別選單</td></tr>
                <tr><td class="g-nowrap"><b>交屋</b></td><td>打開後不再寄「未上傳報告」提醒</td></tr>
                <tr><td class="g-nowrap"><b>初驗／複驗報告上傳開關</b></td><td>打開，客戶才能上傳該種報告；上傳成功後自動關閉</td></tr>
                <tr><td class="g-nowrap"><b>允許重複預約</b></td><td>打開，同一項目可以預約多筆</td></tr>
              </tbody>
            </table>
          </div>
          <div class="g-warn">欄位標題上的「全選」開關會<b>立即套用到全建案所有戶別</b>，不只篩選出來的戶。</div>

          <h3>戶別整合資訊</h3>
          <p>點藍色<b>戶號</b>開啟，可看這戶的預約、報告、授權書與客戶回傳。</p>
          <ul class="g-list">
            <li>要修改：按「<b>進入編輯</b>」→ 改完按「<b>儲存並退出</b>」；直接按 <i class="mdi mdi-close"></i> 會捨棄變更</li>
            <li>「<b>新增預約</b>」：直接替這戶預約</li>
            <li>取消預約、發送「未上傳報告」提醒也在這裡</li>
          </ul>

          <h3>Excel 下載與上傳</h3>
          <div class="g-table-wrap">
            <table class="g-table">
              <tbody>
                <tr><td class="g-nowrap"><i class="mdi mdi-download"></i> 下載戶別資料</td><td>匯出整張表（也可當備份）</td></tr>
                <tr><td class="g-nowrap"><i class="mdi mdi-upload"></i> 上傳戶別資料</td><td>用 Excel 批次更新：有「文件ID」就更新，只有「戶號」就新增戶別</td></tr>
              </tbody>
            </table>
          </div>
          <ul class="g-list">
            <li>只上傳部分欄位也可以，檔案沒有的欄位不會變動</li>
            <li>檔案裡有的欄位留空，會<b>清掉</b>該欄資料</li>
          </ul>
          <div class="g-warn">不要改第二列的標題，也不要改第一欄「文件ID」。上傳前建議先下載一份備份。</div>

          <h3>新增自訂欄位</h3>
          <p>按 <i class="mdi mdi-table-column-plus-after"></i>「新增資料欄位」，選格式：核取/開關、純文字、下拉選單。</p>
          <div class="g-warn">自訂欄位新增後<b>不能刪除或改名</b>。</div>
        </section>

        <!-- ═════════ 4. 預約頁面內容 ═════════ -->
        <section id="sec-page" class="g-section" data-sec="page">
          <div class="g-sec-head">
            <span class="g-sec-no">4</span>
            <div>
              <h2>預約頁面內容</h2>
              <p class="g-lead">每個預約項目都有自己的標題、說明、常見問答與附件。</p>
            </div>
          </div>
          <div class="g-path"><span>批次及系統管理</span><span>預約系統狀態設定</span><span>預約頁面設定</span></div>

          <ol class="g-steps">
            <li>在「請選擇要設定的預約項目」選擇項目。</li>
            <li>依下表設定各區塊，文字框可按「套用範本」快速帶入。</li>
            <li>按「<b>儲存設定</b>」。</li>
          </ol>

          <div class="g-split">
            <GuideFigure :src="shot('page-preview')" caption="客戶看到的項目頁">
              <div class="mk-phone">
                <div class="mk-phone-bar">初驗預約<b class="pin">1</b></div>
                <div class="mk-phone-body">
                  <div class="mk-text">親愛的住戶您好…<b class="pin">2</b></div>
                  <div class="mk-text short"></div>
                  <span class="mk-btn block"><i class="mdi mdi-file-document-multiple-outline"></i>點此閱讀預約說明<b class="pin">3</b></span>
                  <div class="mk-cap">常見問答<b class="pin">4</b></div>
                  <div class="mk-li sm">Q 可以帶設計師嗎？<span class="mk-grow"></span><i class="mdi mdi-chevron-down"></i></div>
                  <div class="mk-cap">聯絡資訊<b class="pin">5</b></div>
                  <div class="mk-cap">附件下載<b class="pin">6</b></div>
                  <div class="mk-li sm"><i class="mdi mdi-file-pdf-box"></i>驗屋須知.pdf</div>
                  <div class="mk-cap mk-primary">步驟一：填寫預約資料</div>
                </div>
              </div>
            </GuideFigure>
            <div class="g-table-wrap">
              <table class="g-table">
                <thead><tr><th>#</th><th>設定</th><th>顯示位置</th></tr></thead>
                <tbody>
                  <tr><td><b class="pin">1</b></td><td class="g-nowrap">預約頁面大標題</td><td>頁面最上方</td></tr>
                  <tr><td><b class="pin">2</b></td><td class="g-nowrap">招呼語、內文說明</td><td>標題下方</td></tr>
                  <tr><td><b class="pin">3</b></td><td class="g-nowrap">預約說明設定</td><td>預約前要看的說明；可設定「須勾選『我已閱讀』後才可開始預約」</td></tr>
                  <tr><td><b class="pin">4</b></td><td class="g-nowrap">常見問答 (FAQ)</td><td>按「新增問答」，不需要可刪除</td></tr>
                  <tr><td><b class="pin">5</b></td><td class="g-nowrap">聯絡資訊設定</td><td>頁面與通知信都會顯示</td></tr>
                  <tr><td><b class="pin">6</b></td><td class="g-nowrap">附件管理</td><td>圖片或 PDF，上傳到建案附件庫後，勾選此項目要顯示的檔案</td></tr>
                  <tr><td></td><td class="g-nowrap">日期選擇提醒事項</td><td>步驟二選日期的上方</td></tr>
                  <tr><td></td><td class="g-nowrap">頁尾文字</td><td>聯絡資訊上方的小字</td></tr>
                  <tr><td></td><td class="g-nowrap">結束語</td><td>預約成功頁的「重要提醒」</td></tr>
                </tbody>
              </table>
            </div>
          </div>

          <h3>預約欄位標籤自訂</h3>
          <p>同頁上方，可把「棟別」「戶別」「輸入身分證(驗證碼)」等欄位改成想要的名稱和提示文字。<b>全建案共用</b>。</p>

          <h3>LOGO 與授權書</h3>
          <div class="g-path"><span>預約系統狀態設定</span><span>頁面LOGO及授權書設定</span></div>
          <ul class="g-list">
            <li><b>LOGO：</b>「選擇 Logo 圖片」，建議 1800×500px、1MB 以內，可選顯示尺寸</li>
            <li><b>授權書格式：</b>由 ANXI 管理員設定，這裡可預覽</li>
          </ul>
          <p class="g-muted-text">記得按「儲存設定」。</p>
        </section>

        <!-- ═════════ 5. 開放預約與網址 ═════════ -->
        <section id="sec-open" class="g-section" data-sec="open">
          <div class="g-sec-head">
            <span class="g-sec-no">5</span>
            <div>
              <h2>開放預約與網址</h2>
              <p class="g-lead">打開總開關、設定身分驗證，再把網址或 QR Code 給客戶。</p>
            </div>
          </div>
          <div class="g-path"><span>批次及系統管理</span><span>預約系統狀態設定</span><span>一般與狀態設定</span></div>

          <ol class="g-steps">
            <li>「系統開放狀態」切到「<b>預約系統啟用中</b>」。</li>
            <li>（選用）勾「啟用定時開關預約系統」，設定自動開啟、關閉時間。總開關要先打開，排程才有效。</li>
            <li>建議打開「<b>啟用驗證碼機制</b>」，避免客戶選錯戶。</li>
            <li>按「<b>儲存設定</b>」。</li>
            <li>複製「預約系統網址」，或按「<b>產生網址 QR Code</b>」下載圖片。</li>
          </ol>

          <GuideFigure :src="shot('open-general')" :width="480" caption="一般與狀態設定">
            <div class="mk">
              <div class="mk-body">
                <div class="mk-cap">範例建案-預約系統網址</div>
                <div class="mk-row">
                  <div class="mk-field grow"><div><i class="mdi mdi-link-variant"></i> anxismart.com/#/booking/…</div></div>
                  <span class="mk-btn tonal"><i class="mdi mdi-qrcode"></i>產生網址 QR Code<b class="pin">5</b></span>
                </div>
                <div class="mk-row"><span class="mk-sw on"></span>啟用驗證碼機制(身分證、手機末碼..驗證碼)<b class="pin">3</b></div>
                <div class="mk-box">
                  <div class="mk-strong">系統開放狀態</div>
                  <div class="mk-row"><span class="mk-sw on"></span><span class="mk-ok">預約系統啟用中</span><b class="pin">1</b></div>
                  <div class="mk-row"><span class="mk-check"></span>啟用定時開關預約系統<b class="pin">2</b></div>
                </div>
              </div>
            </div>
          </GuideFigure>

          <h3>客戶約得到的條件</h3>
          <p>以下四項<b>都要成立</b>，客戶才看得到、約得到：</p>
          <ul class="g-check">
            <li><i class="mdi mdi-check-circle"></i>系統開放狀態：預約系統啟用中</li>
            <li><i class="mdi mdi-check-circle"></i>預約項目：客戶可見（批次管理）</li>
            <li><i class="mdi mdi-check-circle"></i>批次：開放中（在預約開放時間內）</li>
            <li><i class="mdi mdi-check-circle"></i>戶別：預約系統開關打開，且已填批次代號</li>
          </ul>

          <h3>驗證碼怎麼比對</h3>
          <ul class="g-list">
            <li>比對戶別資料總表的「<b>買方身分證(驗證碼)</b>」，英文大小寫要一致</li>
            <li>一戶有多位買方：用「/」分隔填多組，任一組都能通過</li>
          </ul>
        </section>

        <!-- ═════════ 6. 預約時間表 ═════════ -->
        <section id="sec-calendar" class="g-section" data-sec="calendar">
          <div class="g-sec-head">
            <span class="g-sec-no">6</span>
            <div>
              <h2>預約時間表</h2>
              <p class="g-lead">所有預約在這裡查看、修改、新增，也能排休與下載。</p>
            </div>
          </div>
          <div class="g-path"><span>預約管理</span><span>預約時間表</span></div>

          <GuideFigure :src="shot('calendar-toolbar')" :width="420" caption="時間表工具列（桌機）">
            <div class="mk">
              <div class="mk-row mk-pad mk-wrap">
                <div class="mk-field sm"><div><i class="mdi mdi-calendar"></i> 09/15 → 09/21</div></div>
                <span class="mk-btn tonal sm"><i class="mdi mdi-filter-variant"></i>篩選</span>
                <span class="mk-seg sm"><span>日</span><span class="on">週</span><span>月</span></span>
                <span class="mk-icons">
                  <span class="mk-ic"><i class="mdi mdi-refresh"></i><b class="pin sup">1</b></span>
                  <span class="mk-ic"><i class="mdi mdi-calendar-plus"></i><b class="pin sup">2</b></span>
                  <span class="mk-ic"><i class="mdi mdi-account-clock"></i><b class="pin sup">3</b></span>
                  <span class="mk-ic"><i class="mdi mdi-calendar-text"></i><b class="pin sup">4</b></span>
                  <span class="mk-ic"><i class="mdi mdi-download"></i><b class="pin sup">5</b></span>
                  <span class="mk-ic"><i class="mdi mdi-chart-bar"></i><b class="pin sup">6</b></span>
                  <span class="mk-ic"><i class="mdi mdi-table-pivot"></i><b class="pin sup">7</b></span>
                  <span class="mk-ic"><i class="mdi mdi-cog"></i><b class="pin sup">8</b></span>
                </span>
              </div>
            </div>
          </GuideFigure>
          <div class="g-table-wrap">
            <table class="g-table">
              <tbody>
                <tr><td><b class="pin">1</b></td><td class="g-nowrap">重新整理資料</td><td>重新讀取最新預約</td></tr>
                <tr><td><b class="pin">2</b></td><td class="g-nowrap">新增預約</td><td>後台替客戶預約</td></tr>
                <tr><td><b class="pin">3</b></td><td class="g-nowrap">驗屋人員排休</td><td>登記人員休假</td></tr>
                <tr><td><b class="pin">4</b></td><td class="g-nowrap">行事曆備註</td><td>在指定日期顯示備註</td></tr>
                <tr><td><b class="pin">5</b></td><td class="g-nowrap">下載時間表</td><td>PNG 或 Excel</td></tr>
                <tr><td><b class="pin">6</b></td><td class="g-nowrap">統計摘要</td><td>項目 × 狀態的件數</td></tr>
                <tr><td><b class="pin">7</b></td><td class="g-nowrap">資料透視</td><td>例：各驗屋人員件數，可「複製表格」</td></tr>
                <tr><td><b class="pin">8</b></td><td class="g-nowrap">顯示設定</td><td>卡片顯示欄位、事件顏色</td></tr>
              </tbody>
            </table>
          </div>
          <p class="g-muted-text">手機版工具在下方：重整／篩選／新增／更多。</p>

          <h3>查看預約</h3>
          <ul class="g-list">
            <li>日／週／月切換；日期區間可快選今天、本週、下週、本月、下月</li>
            <li>關鍵字搜尋任何欄位，空白分隔可搜多組</li>
            <li>「篩選」依狀態、項目、方式、驗屋人員等條件</li>
            <li>點左上角「<b>時間</b>」：自動顯示（只列有預約的時段）或手動選擇時段</li>
          </ul>

          <h3>修改預約</h3>
          <p>點預約卡片，開啟「預約詳細資訊」：</p>
          <ul class="g-list">
            <li><b>改日期、時段：</b>直接點日期或時段修改，立即儲存</li>
            <li><b>驗屋人員：</b>點人員即可指派（可複選），立即儲存；排休中的人會標示</li>
            <li><b>重要備註</b>（跟著戶別）、<b>預約備註</b>（跟著這筆預約）：點框框編輯</li>
            <li>「<b>編輯</b>」：修改其他資料後按「儲存」</li>
            <li>「<b>取消此預約</b>」：可選擇通知信寄給誰</li>
          </ul>
          <div class="g-tip">改到日期、時段、預約人、方式等資料，系統會寄「<b>預約異動通知</b>」給預約人。</div>

          <h3>後台新增預約</h3>
          <ol class="g-steps">
            <li><b>選擇戶別：</b>搜尋姓名、電話、身分證、戶號，或選棟別＋戶別。</li>
            <li><b>填寫預約資訊：</b>項目、方式、預約人、日期與時段（日曆 ○ 本戶批次、△ 其他批次）。</li>
            <li><b>確認送出。</b>名額已滿仍要排入時，勾「強制新增預約」。</li>
          </ol>

          <h3>驗屋人員排休</h3>
          <ol class="g-steps">
            <li>按「<b>新增排休/備註</b>」。</li>
            <li>選人員、日期，選上休／下休／休假。</li>
            <li>按「建立」。和已排定的驗屋衝突時會提醒。</li>
          </ol>
          <div class="g-tip"><b>快速排休：</b>先點人員，再點日期。</div>

          <h3>行事曆備註</h3>
          <p>「新增備註」→ 選日期、輸入內容（300 字內）、選顏色 → 儲存。備註會顯示在時間表的備註列。</p>

          <h3>下載</h3>
          <div class="g-table-wrap">
            <table class="g-table">
              <tbody>
                <tr><td class="g-nowrap">下載日期PNG</td><td>指定日期區間的時間表圖片</td></tr>
                <tr><td class="g-nowrap">下載人員行程表 (PNG)</td><td>依驗屋或銷售人員，合併一張或每人一張</td></tr>
                <tr><td class="g-nowrap">下載 (Excel)</td><td>行事曆格式</td></tr>
                <tr><td class="g-nowrap">下載EXCEL(列表)</td><td>自選欄位與排序的清單</td></tr>
              </tbody>
            </table>
          </div>

          <h3>顯示設定</h3>
          <ul class="g-list">
            <li><b>標題顯示：</b>卡片要顯示哪些欄位，只影響這台裝置</li>
            <li><b>事件顏色：</b>依項目、來源或關鍵字上色，全建案共用，要按「儲存事件顏色」</li>
          </ul>

          <h3>預約狀態</h3>
          <div class="g-states">
            <span class="g-tag info">預約中</span><i class="mdi mdi-arrow-right"></i>
            <span class="g-tag ok">已完成</span>
            <span class="g-states-note">每天 20:10 自動把當天的預約改為已完成</span>
          </div>
          <div class="g-states">
            <span class="g-tag info">預約中</span><i class="mdi mdi-arrow-right"></i>
            <span class="g-tag grey">取消</span>
            <span class="g-states-note">客戶或後台取消</span>
          </div>
        </section>

        <!-- ═════════ 7. 線上授權驗屋 ═════════ -->
        <section id="sec-auth" class="g-section" data-sec="auth">
          <div class="g-sec-head">
            <span class="g-sec-no">7</span>
            <div>
              <h2>線上授權驗屋</h2>
              <p class="g-lead">屋主委託他人驗屋時，線上完成授權書簽署，不用紙本。</p>
            </div>
          </div>
          <p>啟用方式：在預約方式打開「啟用授權/委託流程」（見 <a :href="sectionHref('menu')" @click.prevent="select('menu')">1. 預約項目與方式</a>）。</p>

          <ol class="g-timeline">
            <li>
              <div class="g-tl-who">屋主</div>
              <div class="g-tl-body"><b>預約時填寫授權書</b><br>按「驗屋授權書(線上授權)」，填委託人、受託人資料並簽名 →「寄送簽署邀請給受託人」</div>
            </li>
            <li>
              <div class="g-tl-who">受託人</div>
              <div class="g-tl-body"><b>收到邀請信</b><br>信件主旨「驗屋授權書簽署邀請」→ 按「前往簽署授權書」，<b>48 小時內有效</b></div>
            </li>
            <li>
              <div class="g-tl-who">受託人</div>
              <div class="g-tl-body"><b>確認並簽名</b><br>確認資料 → 簽名 →「我已確認並完成簽署」</div>
            </li>
            <li>
              <div class="g-tl-who">系統</div>
              <div class="g-tl-body"><b>完成</b><br>授權書（圖檔）存到該戶「驗屋文件」資料夾；完成通知寄給受託人，並副本給有「驗屋系統信件副本」權限的人員</div>
            </li>
          </ol>

          <ul class="g-list">
            <li>寄出邀請後，屋主就能送出預約，不必等受託人簽完</li>
            <li>查看授權：戶別資料總表「驗屋授權書」「授權狀態」欄，或戶別整合資訊</li>
          </ul>
          <div class="g-warn"><b>受託人 Email 要正確</b>才收得到邀請。客戶無法線上授權時，請後台代為預約，並準備紙本授權書（可放在預約頁附件供下載）。</div>
        </section>

        <!-- ═════════ 8. 驗屋報告 ═════════ -->
        <section id="sec-reports" class="g-section" data-sec="reports">
          <div class="g-sec-head">
            <span class="g-sec-no">8</span>
            <div>
              <h2>驗屋報告</h2>
              <p class="g-lead">客戶上傳驗屋公司的報告，系統提醒未上傳、通知未下載。</p>
            </div>
          </div>

          <h3>開放客戶上傳</h3>
          <div class="g-path"><span>預約系統狀態設定</span><span>驗屋報告上傳設定</span></div>
          <ol class="g-steps">
            <li>打開「<b>啟用上傳驗屋報告功能</b>」，預約首頁會出現「我有驗屋報告欲上傳」。</li>
            <li>編輯「上傳頁說明」與「上傳須知提示框」（可套用範本）。</li>
            <li>按「<b>儲存設定</b>」。</li>
            <li>到戶別資料管理，打開該戶的「<b>初驗／複驗報告上傳開關</b>」。</li>
          </ol>
          <ul class="g-list">
            <li><b>限制：</b>PDF、單檔 30MB；太大會引導客戶到 iLovePDF 壓縮</li>
            <li><b>上傳後：</b>檔案存到該戶雲端資料夾、客戶收到確認信、上傳開關自動關閉</li>
          </ul>

          <h3>未上傳提醒</h3>
          <div class="g-path"><span>驗屋報告上傳設定</span><span>自動化提醒設定</span></div>
          <ol class="g-steps">
            <li>在各預約項目勾選要提醒的方式（通常是委託代驗、驗屋公司）。沒勾＝不提醒。</li>
            <li>設定「驗屋完成後，間隔幾天後發送通知」，預設 7、14 天。</li>
            <li>打開「<b>啟用每日提醒排程</b>」，設定時間（預設 10:00）。</li>
            <li>編輯 Email 主旨與內文，可按「預覽 EMAIL」。</li>
            <li>按「<b>儲存設定</b>」。</li>
          </ol>
          <div class="g-example">
            <div class="g-example-title"><i class="mdi mdi-lightbulb-on-outline"></i>舉例</div>
            A1-08 預約 3/1 委託代驗 → 3/8、3/15 上午 10 點檢查，還沒上傳就寄 Email 給預約人；有「提醒上傳驗屋報告副本」權限的人員收到密件副本。
          </div>
          <ul class="g-list">
            <li>不會寄：已交屋、預約人沒有 Email、報告已上傳</li>
            <li>單戶立即提醒：戶別整合資訊 › 該項目預約 ›「<b>發送提醒通知</b>」</li>
          </ul>
          <div class="g-warn">設定頁的「手動提醒」按鈕目前只在<b>每日提醒時間那個小時內</b>按才會寄出。要立即提醒，請用單戶的「發送提醒通知」。</div>

          <h3>未下載通知（LINE）</h3>
          <p>同頁「排程設定」勾選星期與時間，系統用 LINE 通知有「LINE通知驗屋報告未下載」權限、且已綁定 LINE 的人員。已標記「已下載」或「作廢」的報告不會通知。</p>
          <p class="g-muted-text">需由 ANXI 管理員先完成 LINE 小助理設定。</p>

          <h3>標記報告</h3>
          <p>在<b>戶別資料總表</b>的「驗屋報告」欄（或戶別整合資訊 › 報告／其他）：</p>
          <GuideFigure :src="shot('reports-cell')" :width="440" caption="驗屋報告欄">
            <div class="mk">
              <div class="mk-table">
                <div class="mk-tr mk-th"><span>戶號</span><span>驗屋報告</span></div>
                <div class="mk-tr"><span class="mk-link">A1-8F</span><span class="mk-row"><span class="mk-link"><i class="mdi mdi-file-pdf-box"></i>初驗報告-A1-8F-王小明.pdf</span><span class="mk-ic"><i class="mdi mdi-check-circle-outline mk-ok"></i><b class="pin sup">1</b></span><span class="mk-ic"><i class="mdi mdi-delete mk-err"></i><b class="pin sup">2</b></span></span></div>
              </div>
            </div>
          </GuideFigure>
          <div class="g-table-wrap">
            <table class="g-table">
              <tbody>
                <tr><td><b class="pin">1</b></td><td class="g-nowrap"><i class="mdi mdi-check-circle-outline mk-ok"></i> 標記為已下載</td><td>雲端檔案加註（已下載），LINE 不再提醒</td></tr>
                <tr><td><b class="pin">2</b></td><td class="g-nowrap"><i class="mdi mdi-delete mk-err"></i> 作廢</td><td>雲端加註（作廢）保留檔案，並從驗屋報告欄移除</td></tr>
              </tbody>
            </table>
          </div>

          <h3>驗屋報告管理頁</h3>
          <div class="g-path"><span>預約管理</span><span>驗屋報告管理</span></div>
          <ul class="g-list">
            <li>預設只顯示「未下載」；點資料夾可展開、預覽 PDF</li>
            <li>勾選多筆 →「<b>加註</b>」→ 加註 (已下載)／加註 (作廢)</li>
          </ul>
          <div class="g-warn">這裡的「加註 (作廢)」只改雲端資料夾名稱，<b>不會清掉</b>戶別資料總表的驗屋報告。要讓客戶重傳，請用戶別資料總表的 <i class="mdi mdi-delete"></i>。</div>
          <div class="g-warn">不要直接刪除雲端檔案，系統都用改名標記，避免誤刪別戶報告。</div>

          <h3>讓客戶重新上傳</h3>
          <ol class="g-steps">
            <li>戶別資料總表 › 驗屋報告欄 › <i class="mdi mdi-delete"></i> 作廢舊報告。</li>
            <li>打開該戶「初驗／複驗報告上傳開關」。</li>
            <li>通知客戶重新上傳（作廢後系統不會自動寄提醒）。</li>
            <li>客戶上傳後，開關自動關閉。</li>
          </ol>
        </section>

        <!-- ═════════ 9. 客戶回傳 ═════════ -->
        <section id="sec-feedback" class="g-section" data-sec="feedback">
          <div class="g-sec-head">
            <span class="g-sec-no">9</span>
            <div>
              <h2>客戶回傳</h2>
              <p class="g-lead">做一張表單讓客戶回傳資料，例如自覓銀行、名片。</p>
            </div>
          </div>
          <div class="g-path"><span>批次及系統管理</span><span>預約系統狀態設定</span><span>客戶回傳功能設定</span></div>

          <ol class="g-steps">
            <li>按「<b>新增功能</b>」。</li>
            <li>填「功能名稱」「按鈕顯示文字」「對話框標題」。</li>
            <li>選功能開關：棟別選單、戶別選單、身分證或驗證碼、附件上傳（最多 10 個、單檔 30MB）。</li>
            <li>在「自定義欄位」加入要客戶填的欄位。</li>
            <li>按「預覽畫面」確認，再按「<b>儲存設定</b>」。</li>
          </ol>

          <GuideFigure :src="shot('feedback-editor')" caption="預約首頁出現回傳按鈕">
            <div class="mk-phone">
              <div class="mk-phone-bar">範例建案 預約系統</div>
              <div class="mk-phone-body">
                <div class="mk-cap">選擇您的預約服務</div>
                <span class="mk-btn block">初驗</span>
                <span class="mk-btn block">複驗</span>
                <div class="mk-cap">其他服務</div>
                <div class="mk-li sm"><i class="mdi mdi-file-upload-outline"></i>我有驗屋報告欲上傳</div>
                <span class="mk-btn block red">回傳自覓銀行</span>
              </div>
            </div>
          </GuideFigure>

          <ul class="g-list">
            <li><b>查看回傳：</b>戶別資料總表「客戶回傳」欄，或戶別整合資訊 › 客戶回傳訊息</li>
            <li>客戶回傳<b>不會發通知</b>，請定期查看</li>
          </ul>
          <div class="g-warn">沒打開「身分證或驗證碼」時，任何人都能替任一戶回傳。</div>
        </section>

        <!-- ═════════ 10. 客戶端預約流程 ═════════ -->
        <section id="sec-customer" class="g-section" data-sec="customer">
          <div class="g-sec-head">
            <span class="g-sec-no">10</span>
            <div>
              <h2>客戶端預約流程</h2>
              <p class="g-lead">了解客戶看到的畫面，方便回答客戶問題。</p>
            </div>
          </div>

          <ol class="g-timeline">
            <li><div class="g-tl-who">選項目</div><div class="g-tl-body">開啟預約網址，選服務項目。未開放的項目會顯示開放時間，可加入行事曆提醒。</div></li>
            <li><div class="g-tl-who">看說明</div><div class="g-tl-body">閱讀預約說明；有設定「須勾選我已閱讀」時，要讀完才能開始。</div></li>
            <li><div class="g-tl-who">步驟一</div><div class="g-tl-body">輸入身分證(驗證碼)、棟別、戶別、選擇方式 →「確認戶別，下一步」。</div></li>
            <li><div class="g-tl-who">步驟二</div><div class="g-tl-body">填姓名、電話、EMAIL，選日期與時段（顯示尚餘名額，<b>最早可約明天</b>）。需要授權時完成授權書。</div></li>
            <li><div class="g-tl-who">確認</div><div class="g-tl-body">確認資料，<b>5 分鐘內</b>按「送出預約」，逾時要重新操作。</div></li>
            <li><div class="g-tl-who">完成</div><div class="g-tl-body">顯示預約代碼，Email 收到預約成功通知。</div></li>
          </ol>

          <h3>客戶要改時間或取消</h3>
          <ul class="g-list">
            <li>請後台在預約時間表處理：直接改日期、時段，或「取消此預約」</li>
            <li>客戶端沒有改期功能；要改期須取消後重新預約</li>
            <li>建案已由 ANXI 開啟「檢查重複預約」時，客戶回預約頁選同項目、同戶別，可自行「取消此筆預約」</li>
          </ul>

          <h3>客戶會收到的信</h3>
          <div class="g-table-wrap">
            <table class="g-table">
              <tbody>
                <tr><td class="g-nowrap">預約成功通知</td><td>送出預約後</td></tr>
                <tr><td class="g-nowrap">預約取消成功通知</td><td>客戶或後台取消</td></tr>
                <tr><td class="g-nowrap">預約異動通知</td><td>後台改日期、時段、預約人等資料</td></tr>
                <tr><td class="g-nowrap">驗屋授權書簽署邀請</td><td>寄給受託人</td></tr>
                <tr><td class="g-nowrap">驗屋報告上傳成功通知</td><td>上傳報告後</td></tr>
                <tr><td class="g-nowrap">未收到驗屋報告提醒</td><td>依提醒排程</td></tr>
              </tbody>
            </table>
          </div>
          <p class="g-muted-text">客戶通知都以 Email 寄送，不發簡訊或 LINE。</p>
        </section>

        <!-- ═════════ 常見問題 ═════════ -->
        <section id="sec-faq" class="g-section" data-sec="faq">
          <div class="g-sec-head">
            <div>
              <h2>常見問題</h2>
            </div>
          </div>
          <details v-for="(q, i) in faqs" :key="i" class="g-faq">
            <summary>{{ q.q }}</summary>
            <div class="g-faq-a">{{ q.a }}</div>
          </details>
        </section>

        <footer class="g-footer">
          有問題請聯絡 ANXI 客服：<a href="mailto:anxismart@gmail.com">anxismart@gmail.com</a>
        </footer>
      </main>
    </div>
  </div>
</template>

<script setup>
import { ref, nextTick, watch, onMounted, onBeforeUnmount } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import GuideFigure from './GuideFigure.vue';
import { bookingGuideShotSrc as shot } from './bookingGuideShots';

const UPDATED_AT = '2026-10-02';

const sections = [
  { id: 'start', no: '', title: '開始之前' },
  { id: 'menu', no: 1, title: '預約項目與方式' },
  { id: 'batches', no: 2, title: '預約批次' },
  { id: 'households', no: 3, title: '戶別資料管理' },
  { id: 'page', no: 4, title: '預約頁面內容' },
  { id: 'open', no: 5, title: '開放預約與網址' },
  { id: 'calendar', no: 6, title: '預約時間表' },
  { id: 'auth', no: 7, title: '線上授權驗屋' },
  { id: 'reports', no: 8, title: '驗屋報告' },
  { id: 'feedback', no: 9, title: '客戶回傳' },
  { id: 'customer', no: 10, title: '客戶端預約流程' },
  { id: 'faq', no: '', title: '常見問題' },
];
const sectionIds = new Set(sections.map((s) => s.id));

const setupFlow = [
  { no: 1, id: 'menu', text: '建立預約項目與方式' },
  { no: 2, id: 'batches', text: '建立預約批次' },
  { no: 3, id: 'households', text: '戶別填批次代號、打開預約系統開關' },
  { no: 4, id: 'page', text: '編輯預約頁面內容' },
  { no: 5, id: 'open', text: '開啟預約系統、分享網址' },
];

const faqs = [
  { q: '客戶說找不到自己的戶別？', a: '確認該戶「預約系統開關」已打開。' },
  { q: '客戶說「尚未開放」？', a: '依序檢查：系統開放狀態、預約項目客戶可見、批次在預約開放時間內、戶別已填批次代號且與批次代號完全一樣。' },
  { q: '某個方式選不到或沒有日期？', a: '批次裡這個方式的名額是 0 或沒有勾選。新增的方式預設未開放，要到批次開名額。' },
  { q: '驗證碼一直錯誤？', a: '比對戶別資料總表「買方身分證(驗證碼)」，英文大小寫要一致；多位買方用「/」分隔。' },
  { q: '一戶有多位買方，身分證(驗證碼)怎麼填？', a: '在戶別資料總表「買方身分證(驗證碼)」填入每位買方的號碼，用「/」隔開，例如 A123456789/B223456789。任一位輸入自己的號碼都能通過，預約、上傳報告、客戶回傳都適用。也可以用空白或「、」分隔。' },
  { q: '還沒約滿怎麼就額滿？', a: '共用名額模式下，同時段其他批次（或共用群組裡其他項目）的預約也會占用名額。' },
  { q: '同一戶要預約兩次？', a: '打開該戶「允許重複預約」。' },
  { q: '客戶沒收到通知信？', a: '確認預約人 Email 是否正確，並請客戶檢查垃圾信件匣。' },
  { q: '客戶上傳報告失敗？', a: '確認該戶「報告上傳開關」已打開，檔案是 PDF 且小於 30MB。' },
  { q: '受託人沒收到簽署信？', a: '確認受託人 Email；邀請 48 小時後失效。可由後台代為預約，改用紙本授權書。' },
];

const route = useRoute();
const router = useRouter();
const activeId = ref('start');
const chipsEl = ref(null);

const sectionHref = (id) => router.resolve({ name: 'BookingGuide', params: { section: id } }).href;

const scrollToSection = (id, smooth = true) => {
  const el = document.getElementById(`sec-${id}`);
  if (!el) return;
  el.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto', block: 'start' });
  activeId.value = id;
};

const select = (id) => {
  if (route.params.section === id) scrollToSection(id);
  else router.replace({ name: 'BookingGuide', params: { section: id } });
};

watch(() => route.params.section, (id) => {
  if (id && sectionIds.has(id)) scrollToSection(id);
});

// 手機章節列：目前章節保持在可視範圍
watch(activeId, async (id) => {
  await nextTick();
  const bar = chipsEl.value;
  const chip = bar?.querySelector(`[data-chip="${id}"]`);
  if (!bar || !chip || bar.scrollWidth <= bar.clientWidth) return;
  bar.scrollTo({ left: chip.offsetLeft - (bar.clientWidth - chip.offsetWidth) / 2, behavior: 'smooth' });
});

let observer = null;
const prevTitle = document.title;

onMounted(async () => {
  document.title = '預約系統使用說明｜ANXI';
  await nextTick();
  const initial = route.params.section;
  if (initial && sectionIds.has(initial)) scrollToSection(initial, false);

  observer = new IntersectionObserver((entries) => {
    const visible = entries.filter((e) => e.isIntersecting);
    if (visible.length) activeId.value = visible[0].target.dataset.sec;
  }, { rootMargin: '-20% 0px -70% 0px' });
  document.querySelectorAll('.g-section').forEach((el) => observer.observe(el));
});

onBeforeUnmount(() => {
  observer?.disconnect();
  document.title = prevTitle;
});
</script>

<style>
/* PublicLayout 的 v-layout 由 Vuetify 寫入行內 overflow:hidden，會讓目錄／章節列的 sticky 失效；
   只在本頁改用 clip（同樣裁切、但不是捲動容器），行內樣式需 !important 才蓋得過 */
.v-layout:has(> .v-main .g-page) {
  overflow: clip !important;
}
</style>

<style scoped>
/* ───── 版面 ───── */
.g-page {
  --g-primary: #1867c0;
  --g-primary-soft: #e8f1fc;
  --g-text: #1f2328;
  --g-muted: #5f6b7a;
  --g-border: #e3e6ea;
  --g-bg: #f6f7f9;
  --g-ok: #2e7d32;
  --g-warn: #b26a00;
  --g-err: #d32f2f;
  --g-pin: #e53935;
  min-height: 100vh;
  background: var(--g-bg);
  color: var(--g-text);
  font-size: 16px;
  line-height: 1.75;
  font-family: -apple-system, BlinkMacSystemFont, "PingFang TC", "Noto Sans TC", "Microsoft JhengHei", sans-serif;
}
.g-hero {
  background: linear-gradient(135deg, #1867c0 0%, #0d4a94 100%);
  color: #fff;
}
.g-hero-inner {
  max-width: 1120px;
  margin: 0 auto;
  padding: 40px 24px 36px;
}
.g-brand {
  font-size: 13px;
  letter-spacing: 0.08em;
  opacity: 0.85;
}
.g-hero h1 {
  margin: 6px 0 4px;
  font-size: 32px;
  line-height: 1.3;
  font-weight: 700;
}
.g-hero-meta {
  margin: 0;
  font-size: 14px;
  opacity: 0.85;
}
.g-layout {
  max-width: 1120px;
  margin: 0 auto;
  padding: 0 24px;
  display: grid;
  grid-template-columns: 220px minmax(0, 1fr);
  gap: 40px;
}

/* ───── 桌機目錄 ───── */
.g-toc {
  position: sticky;
  top: 24px;
  align-self: start;
  margin-top: 32px;
  max-height: calc(100vh - 48px);
  overflow-y: auto;
}
.g-toc-title {
  font-size: 12px;
  font-weight: 700;
  color: var(--g-muted);
  letter-spacing: 0.08em;
  margin: 0 0 8px 10px;
}
.g-toc-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 7px 10px;
  border-radius: 8px;
  color: var(--g-text);
  text-decoration: none;
  font-size: 15px;
  line-height: 1.4;
}
.g-toc-item:hover {
  background: #eceff3;
}
.g-toc-item.active {
  background: var(--g-primary-soft);
  color: var(--g-primary);
  font-weight: 700;
}
.g-toc-no {
  width: 22px;
  flex: none;
  text-align: center;
  font-size: 13px;
  color: var(--g-muted);
}
.g-toc-item.active .g-toc-no {
  color: var(--g-primary);
}

/* ───── 手機章節列 ───── */
.g-chips {
  display: none;
}

/* ───── 章節 ───── */
.g-main {
  min-width: 0;
  max-width: 780px;
  padding: 32px 0 48px;
}
.g-section {
  background: #fff;
  border: 1px solid var(--g-border);
  border-radius: 16px;
  padding: 28px 32px 32px;
  margin-bottom: 24px;
  scroll-margin-top: 24px;
}
.g-sec-head {
  display: flex;
  align-items: flex-start;
  gap: 14px;
  margin-bottom: 12px;
}
.g-sec-no {
  flex: none;
  width: 36px;
  height: 36px;
  border-radius: 10px;
  background: var(--g-primary);
  color: #fff;
  font-weight: 700;
  font-size: 17px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-top: 2px;
}
.g-section h2 {
  margin: 0;
  font-size: 24px;
  line-height: 1.4;
  font-weight: 700;
}
.g-lead {
  margin: 4px 0 0;
  color: var(--g-muted);
}
.g-section h3 {
  margin: 28px 0 10px;
  font-size: 18px;
  font-weight: 700;
}
.g-section p {
  margin: 0 0 12px;
}
.g-section a {
  color: var(--g-primary);
}
.g-muted-text {
  color: var(--g-muted);
  font-size: 14px;
}

/* 後台路徑 */
.g-path {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 4px;
  margin: 8px 0 4px;
  font-size: 13px;
}
.g-path span {
  background: #f0f2f5;
  border-radius: 6px;
  padding: 2px 8px;
  color: #3d4855;
}
.g-path span + span::before {
  content: '›';
  margin: 0 6px 0 -2px;
  color: #9aa4b0;
}
.g-path span + span {
  background: none;
  padding-left: 0;
}
.g-path span:last-child {
  color: var(--g-primary);
  font-weight: 700;
}

/* 步驟 */
.g-steps {
  list-style: none;
  counter-reset: step;
  padding: 0;
  margin: 0 0 12px;
}
.g-steps li {
  counter-increment: step;
  position: relative;
  padding: 4px 0 4px 38px;
  margin-bottom: 4px;
}
.g-steps li::before {
  content: counter(step);
  position: absolute;
  left: 0;
  top: 5px;
  width: 26px;
  height: 26px;
  border-radius: 50%;
  background: var(--g-primary-soft);
  color: var(--g-primary);
  font-weight: 700;
  font-size: 14px;
  line-height: 26px;
  text-align: center;
}
.g-list {
  padding-left: 22px;
  margin: 0 0 12px;
}
.g-list li {
  margin-bottom: 4px;
}
.g-mini-steps {
  padding-left: 20px;
  margin: 0;
  font-size: 15px;
}

/* 提示框 */
.g-tip,
.g-warn {
  border-radius: 10px;
  padding: 10px 14px 10px 42px;
  margin: 12px 0;
  position: relative;
  font-size: 15px;
}
.g-tip {
  background: var(--g-primary-soft);
}
.g-warn {
  background: #fff4e0;
}
.g-tip::before,
.g-warn::before {
  font-family: 'Material Design Icons';
  position: absolute;
  left: 14px;
  top: 9px;
  font-size: 19px;
  line-height: 1.4;
}
.g-tip::before {
  content: '\F06E9'; /* mdi-lightbulb-on-outline */
  color: var(--g-primary);
}
.g-warn::before {
  content: '\F0026'; /* mdi-alert */
  color: #e08a00;
}
.g-example {
  border: 1px dashed #c5cdd8;
  border-radius: 10px;
  padding: 10px 14px;
  margin: 12px 0;
  font-size: 15px;
}
.g-example-title {
  font-weight: 700;
  margin-bottom: 2px;
}
.g-example-title .mdi {
  color: #e08a00;
  margin-right: 4px;
}

/* 表格 */
.g-table-wrap {
  overflow-x: auto;
  margin: 8px 0 12px;
}
.g-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 15px;
}
.g-table th,
.g-table td {
  border-bottom: 1px solid var(--g-border);
  padding: 9px 10px;
  text-align: left;
  vertical-align: top;
}
.g-table th {
  font-size: 13px;
  color: var(--g-muted);
  font-weight: 700;
  background: #fafbfc;
}
.g-nowrap {
  white-space: nowrap;
}
.g-tag {
  display: inline-block;
  border-radius: 6px;
  padding: 1px 8px;
  font-size: 13px;
  font-weight: 700;
  white-space: nowrap;
}
.g-tag.ok { background: #e6f4ea; color: var(--g-ok); }
.g-tag.warn { background: #fff4e0; color: var(--g-warn); }
.g-tag.info { background: var(--g-primary-soft); color: var(--g-primary); }
.g-tag.grey { background: #eceff3; color: #59636e; }

/* 卡片 */
.g-cards2 {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  margin: 8px 0 12px;
}
.g-card {
  border: 1px solid var(--g-border);
  border-radius: 12px;
  padding: 14px 16px;
}
.g-card p {
  margin: 0;
}
.g-card-title {
  font-weight: 700;
  margin-bottom: 6px;
  line-height: 1.5;
}
.g-card-title .mdi {
  color: var(--g-primary);
  margin-right: 6px;
}
.g-eg {
  color: var(--g-muted);
  font-size: 14px;
}

/* 設定順序 */
.g-flow {
  list-style: none;
  padding: 0;
  margin: 8px 0 0;
  display: grid;
  gap: 8px;
}
.g-flow a {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 14px;
  border: 1px solid var(--g-border);
  border-radius: 12px;
  color: var(--g-text) !important;
  text-decoration: none;
  transition: border-color 0.15s, background 0.15s;
}
.g-flow a:hover {
  border-color: var(--g-primary);
  background: var(--g-primary-soft);
}
.g-flow a::after {
  font-family: 'Material Design Icons';
  content: '\F0142'; /* mdi-chevron-right */
  margin-left: auto;
  color: #9aa4b0;
  font-size: 20px;
}
.g-flow-no {
  flex: none;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: var(--g-primary);
  color: #fff;
  font-weight: 700;
  font-size: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* 打勾清單 */
.g-check {
  list-style: none;
  padding: 0;
  margin: 0 0 12px;
}
.g-check li {
  display: flex;
  gap: 8px;
  padding: 3px 0;
}
.g-check .mdi {
  color: var(--g-ok);
  font-size: 20px;
  line-height: 1.4;
}

/* 時間軸 */
.g-timeline {
  list-style: none;
  padding: 0;
  margin: 12px 0 16px;
}
.g-timeline li {
  display: grid;
  grid-template-columns: 72px minmax(0, 1fr);
  gap: 14px;
  position: relative;
  padding-bottom: 16px;
}
.g-timeline li:not(:last-child)::after {
  content: '';
  position: absolute;
  left: 35px;
  top: 30px;
  bottom: 2px;
  width: 2px;
  background: #d6dde6;
}
.g-tl-who {
  align-self: start;
  background: var(--g-primary);
  color: #fff;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 700;
  text-align: center;
  padding: 3px 0;
  position: relative;
  z-index: 1;
}
.g-tl-body {
  font-size: 15px;
}

/* 狀態 */
.g-states {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}
.g-states .mdi {
  color: #9aa4b0;
}
.g-states-note {
  color: var(--g-muted);
  font-size: 14px;
}

/* 圖與表並排 */
.g-split {
  display: grid;
  grid-template-columns: 260px minmax(0, 1fr);
  gap: 20px;
  align-items: start;
}
.g-split :deep(.gf) {
  margin-top: 8px;
}

/* 常見問題 */
.g-faq {
  border-bottom: 1px solid var(--g-border);
}
.g-faq summary {
  cursor: pointer;
  padding: 12px 28px 12px 0;
  font-weight: 700;
  list-style: none;
  position: relative;
}
.g-faq summary::-webkit-details-marker {
  display: none;
}
.g-faq summary::after {
  font-family: 'Material Design Icons';
  content: '\F0140'; /* mdi-chevron-down */
  position: absolute;
  right: 0;
  top: 10px;
  font-size: 22px;
  color: #9aa4b0;
  transition: transform 0.2s;
}
.g-faq[open] summary::after {
  transform: rotate(180deg);
}
.g-faq-a {
  padding: 0 0 14px;
  color: #3d4855;
  font-size: 15px;
}

.g-footer {
  text-align: center;
  color: var(--g-muted);
  font-size: 14px;
  padding: 8px 0 24px;
}
.g-footer a {
  color: var(--g-primary);
}

/* ───── 示意圖元件（mk-*） ───── */
.mk {
  background: #fff;
  border: 1px solid #d9dee5;
  border-radius: 10px;
  overflow: hidden;
  font-size: 13px;
  line-height: 1.5;
  box-shadow: 0 1px 3px rgba(16, 24, 40, 0.06);
}
.mk .mdi {
  font-size: 16px;
}
.mk-body {
  padding: 12px 14px;
  display: grid;
  gap: 10px;
}
.mk-pad {
  padding: 10px 14px;
}
.mk-bar {
  display: flex;
  align-items: center;
  gap: 6px;
  background: var(--g-primary);
  color: #fff;
  padding: 8px 14px;
  font-weight: 700;
}
.mk-row {
  display: flex;
  align-items: center;
  gap: 8px;
}
.mk-wrap {
  flex-wrap: wrap;
}
.mk-between {
  justify-content: space-between;
}
.mk-grow {
  flex: 1;
}
.mk-strong {
  font-weight: 700;
}
.mk-cap {
  font-size: 12px;
  font-weight: 700;
  color: var(--g-muted);
}
.mk-label {
  font-size: 12px;
  font-weight: 700;
  margin-bottom: -6px;
}
.mk-muted { color: #9aa4b0; }
.mk-primary { color: var(--g-primary); }
.mk-ok { color: var(--g-ok); }
.mk-err { color: var(--g-err); }
.mk-link {
  color: var(--g-primary);
  text-decoration: underline;
}
.mk-icons {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: #3d4855;
}
.mk-icons .mdi {
  font-size: 19px;
}
.mk-btn {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  background: var(--g-primary);
  color: #fff;
  border-radius: 6px;
  padding: 5px 12px;
  font-weight: 700;
  white-space: nowrap;
  justify-self: start;
}
.mk-btn.tonal {
  background: var(--g-primary-soft);
  color: var(--g-primary);
}
.mk-btn.red {
  background: #e53935;
}
.mk-btn.sm {
  padding: 3px 10px;
  font-size: 12px;
}
.mk-btn.block {
  display: flex;
  justify-self: stretch;
}
.mk-chip {
  display: inline-block;
  border-radius: 999px;
  padding: 0 8px;
  font-size: 11px;
  font-weight: 700;
  white-space: nowrap;
}
.mk-chip.grey { background: #eceff3; color: #59636e; }
.mk-chip.warn { background: #fff0d6; color: var(--g-warn); }
.mk-chip.info { background: var(--g-primary-soft); color: var(--g-primary); }
.mk-chip.ok { background: #e6f4ea; color: var(--g-ok); }
.mk-sw {
  display: inline-block;
  width: 30px;
  height: 16px;
  border-radius: 999px;
  background: #c9cfd6;
  position: relative;
  flex: none;
  vertical-align: middle;
}
.mk-sw::after {
  content: '';
  position: absolute;
  top: 2px;
  left: 2px;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: #fff;
}
.mk-sw.on {
  background: var(--g-primary);
}
.mk-sw.on::after {
  left: 16px;
}
.mk-radio,
.mk-check {
  display: inline-block;
  width: 14px;
  height: 14px;
  border: 2px solid #8a949f;
  border-radius: 50%;
  flex: none;
}
.mk-radio.on {
  border-color: var(--g-primary);
  box-shadow: inset 0 0 0 3px #fff;
  background: var(--g-primary);
}
.mk-check {
  border-radius: 3px;
}
.mk-field {
  border: 1px solid #c9cfd6;
  border-radius: 6px;
  padding: 3px 10px 4px;
  min-width: 0;
}
.mk-field label {
  display: block;
  font-size: 10px;
  color: var(--g-muted);
}
.mk-field.sm {
  padding: 2px 8px;
  font-size: 12px;
}
.mk-field.grow {
  flex: 1;
}
.mk-grid2 {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}
.mk-grid3 {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 8px;
}
.mk-panel {
  border: 1px solid var(--g-border);
  border-radius: 8px;
  padding: 8px;
  display: grid;
  gap: 6px;
  align-content: start;
}
.mk-cal {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 2px;
  font-size: 10px;
  text-align: center;
}
.mk-cal span {
  border-radius: 4px;
  padding: 1px 0;
}
.mk-cal span.on {
  background: var(--g-primary);
  color: #fff;
}
.mk-seg {
  display: inline-flex;
  border: 1px solid var(--g-primary);
  border-radius: 6px;
  overflow: hidden;
  justify-self: start;
}
.mk-seg span {
  padding: 3px 12px;
  color: var(--g-primary);
  display: inline-flex;
  align-items: center;
  gap: 4px;
}
.mk-seg span.on {
  background: var(--g-primary);
  color: #fff;
}
.mk-seg.sm span {
  padding: 2px 10px;
  font-size: 12px;
}
.mk-box {
  border: 1px solid var(--g-border);
  border-radius: 8px;
  padding: 10px 12px;
  display: grid;
  gap: 6px;
}
.mk-acc {
  border: 1px solid var(--g-border);
  border-radius: 8px;
}
.mk-acc-head {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 10px;
}
.mk-acc-body {
  border-top: 1px solid var(--g-border);
  padding: 8px 10px;
  display: grid;
  gap: 6px;
}
.mk-li {
  display: flex;
  align-items: center;
  gap: 6px;
  border: 1px solid var(--g-border);
  border-radius: 6px;
  padding: 5px 8px;
}
.mk-li.sm {
  padding: 3px 6px;
  font-size: 12px;
}
.mk-table {
  display: grid;
  font-size: 12px;
}
.mk-tr {
  display: grid;
  grid-auto-flow: column;
  grid-auto-columns: minmax(0, 1fr);
  align-items: center;
  border-top: 1px solid var(--g-border);
}
.mk-tr > span {
  padding: 6px 8px;
  display: flex;
  align-items: center;
  gap: 4px;
  min-width: 0;
}
.mk-th {
  background: #fafbfc;
  font-weight: 700;
  color: #3d4855;
}
.mk-drawer {
  max-width: 260px;
  min-width: 0;
  padding: 0 0 8px;
}
.mk-drawer-head {
  padding: 12px 14px;
  border-bottom: 1px solid var(--g-border);
}
.mk-sub {
  font-size: 11px;
  color: var(--g-muted);
  padding: 10px 16px 4px;
}
.mk-nav {
  display: flex;
  align-items: center;
  gap: 10px;
  margin: 0 8px;
  padding: 6px 10px;
  border-radius: 8px;
}
.mk-nav .mdi {
  font-size: 18px;
  color: #59636e;
}
.mk-nav.active {
  background: var(--g-primary-soft);
  color: var(--g-primary);
  font-weight: 700;
}
.mk-nav.active .mdi {
  color: var(--g-primary);
}
.mk-phone {
  width: 230px;
  margin: 0 auto;
  border: 6px solid #2b3138;
  border-radius: 22px;
  overflow: hidden;
  background: #fff;
  font-size: 12px;
  line-height: 1.5;
}
.mk-phone-bar {
  position: relative;
  background: var(--g-primary);
  color: #fff;
  font-weight: 700;
  padding: 8px 10px;
}
.mk-phone-body {
  padding: 10px;
  display: grid;
  gap: 7px;
}
.mk-text {
  position: relative;
  height: 10px;
  border-radius: 4px;
  background: #e3e7ec;
  font-size: 0;
}
.mk-text.short {
  width: 70%;
}
.mk-legend {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 4px 14px;
  margin: -14px 0 20px;
  font-size: 13px;
  color: #3d4855;
}

/* 編號標記 */
.pin {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: var(--g-pin);
  color: #fff;
  font-size: 11px;
  font-weight: 700;
  line-height: 1;
  flex: none;
  margin-left: 4px;
  box-shadow: 0 0 0 2px #fff;
  vertical-align: middle;
}
.mk-text .pin {
  position: absolute;
  right: -4px;
  top: -4px;
  font-size: 11px;
}
.g-table .pin {
  margin-left: 0;
}
/* 圖示右上角的編號徽章 */
.mk-ic {
  position: relative;
  display: inline-flex;
  margin-right: 8px;
}
.pin.sup {
  position: absolute;
  top: -7px;
  right: -11px;
  width: 15px;
  height: 15px;
  font-size: 10px;
  margin: 0;
}

/* ───── 手機與平板 ───── */
@media (max-width: 959.98px) {
  .g-layout {
    display: block;
    padding: 0 16px;
  }
  .g-toc {
    display: none;
  }
  .g-chips {
    display: flex;
    gap: 6px;
    position: sticky;
    top: 0;
    z-index: 10;
    overflow-x: auto;
    padding: 10px 16px;
    background: rgba(246, 247, 249, 0.96);
    backdrop-filter: blur(6px);
    border-bottom: 1px solid var(--g-border);
    scrollbar-width: none;
  }
  .g-chips::-webkit-scrollbar {
    display: none;
  }
  .g-chip {
    flex: none;
    padding: 5px 12px;
    border-radius: 999px;
    border: 1px solid var(--g-border);
    background: #fff;
    color: var(--g-text);
    text-decoration: none;
    font-size: 14px;
    line-height: 1.4;
    white-space: nowrap;
  }
  .g-chip.active {
    background: var(--g-primary);
    border-color: var(--g-primary);
    color: #fff;
    font-weight: 700;
  }
  .g-main {
    max-width: none;
    padding-top: 16px;
  }
  .g-section {
    scroll-margin-top: 64px;
  }
}

@media (max-width: 599.98px) {
  .g-hero-inner {
    padding: 28px 16px 24px;
  }
  .g-hero h1 {
    font-size: 26px;
  }
  .g-section {
    padding: 20px 16px 24px;
    border-radius: 12px;
  }
  .g-section h2 {
    font-size: 21px;
  }
  .g-cards2,
  .g-split {
    grid-template-columns: 1fr;
  }
  .g-timeline li {
    grid-template-columns: 60px minmax(0, 1fr);
    gap: 10px;
  }
  .g-timeline li:not(:last-child)::after {
    left: 29px;
  }
}
</style>
