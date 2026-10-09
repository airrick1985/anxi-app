<template>
  <div
    class="dk"
    :class="{ 'is-flow': flowMode, 'is-idle': idle && !flowMode, 'is-fullscreen': isFullscreen }"
    :style="{ '--vz': visualZoom }"
  >
    <div v-if="!flowMode" class="dk-progress"><i :style="{ width: `${((current + 1) / slides.length) * 100}%` }"></i></div>

    <!-- 頂欄：簡報模式只留試用鈕；手機閱讀模式加品牌 -->
    <header class="dk-top">
      <a v-if="flowMode" class="dk-top__brand" href="#" @click.prevent="scrollToSlide(0)">
        <img :src="logoUrl" alt="ANXI" /><span>ANXI</span>
      </a>
      <button type="button" class="dk-btn dk-btn--primary" @click="goTrial('deck-top')">免費試用</button>
    </header>

    <div ref="viewportEl" class="dk-viewport" @touchstart.passive="onTouchStart" @touchend.passive="onTouchEnd">
      <div class="dk-stage" :style="stageStyle">
        <section
          v-for="(slide, i) in slides"
          :key="slide.id"
          :ref="(el) => (slideEls[i] = el)"
          class="dk-slide"
          :class="[`dk-slide--${slide.id}`, `is-${slide.theme || 'light'}`, slideState(i)]"
          :data-index="i"
          :inert="!flowMode && i !== current ? true : undefined"
        >
          <!-- ============ 封面 ============ -->
          <template v-if="slide.id === 'cover'">
            <img :src="heroImage" alt="" class="dk-cover__bg" />
            <div class="dk-cover__shade"></div>
            <div class="dk-cover">
              <div class="dk-cover__text">
                <div class="dk-cover__brand dk-in"><img :src="logoWhiteUrl" alt="ANXI" /><span>ANXI 安熙智慧</span></div>
                <h1 class="dk-cover__title dk-in" style="--d: 1">從案場銷控到<br />交屋驗屋，<br />一個平台全部搞定</h1>
                <p class="dk-cover__sub dk-in" style="--d: 2">專為建設公司與代銷團隊打造的雲端建案管理平台</p>
                <ul class="dk-cover__modules dk-in" style="--d: 3">
                  <li v-for="m in coverModules" :key="m">{{ m }}</li>
                </ul>
                <div class="dk-cover__cta dk-in" style="--d: 4">
                  <button type="button" class="dk-btn dk-btn--primary dk-btn--lg" @click="goTrial('deck-cover')">
                    免費試用 <v-icon size="20">mdi-arrow-right</v-icon>
                  </button>
                  <a class="dk-btn dk-btn--outline-light dk-btn--lg" :href="LINE_URL" target="_blank" rel="noopener">
                    <v-icon size="20">mdi-chat-outline</v-icon>LINE 洽詢
                  </a>
                </div>
              </div>
              <div class="dk-cover__visual dk-in" style="--d: 2">
                <div class="dk-frame dk-cover__desk">
                  <div class="dk-frame__bar"><i></i><i></i><i></i></div>
                  <img :src="salesGrid" alt="雲端銷控表" width="3200" height="2000" />
                </div>
                <div class="dk-frame dk-frame--phone dk-cover__phone">
                  <img :src="bookingMobile" alt="客戶線上預約" width="780" height="1688" />
                </div>
              </div>
            </div>
          </template>

          <!-- ============ 關於 ANXI ============ -->
          <template v-else-if="slide.id === 'about'">
            <div class="dk-about">
              <div class="dk-about__text">
                <span class="dk-eyebrow dk-in">關於 ANXI 安熙智慧</span>
                <h2 class="dk-h2 dk-in" style="--d: 1">
                  <span v-for="line in titleLines('把案場經驗，寫成每天更好用的系統')" :key="line" class="dk-h2__line">{{ line }}</span>
                </h2>
                <ol class="dk-story">
                  <li v-for="(st, k) in story" :key="st.tag" class="dk-in" :style="{ '--d': k + 2 }">
                    <span class="dk-story__tag">{{ st.tag }}</span>
                    <strong :class="{ 'is-quote': st.quote }">{{ st.title }}</strong>
                    <span>{{ st.desc }}</span>
                  </li>
                </ol>
              </div>
              <div class="dk-name dk-in" style="--d: 3">
                <img :src="logoUrl" alt="" class="dk-name__mark" />
                <span class="dk-name__label">名字的由來</span>
                <div class="dk-name__chars">
                  <div v-for="c in nameChars" :key="c.char" class="dk-name__char">
                    <b>{{ c.char }}</b><small>{{ c.roman }}</small><span>{{ c.meaning }}</span>
                  </div>
                </div>
                <p class="dk-name__motto">讓建案安心經營，業績光明興盛</p>
              </div>
            </div>
          </template>

          <!-- ============ 用數字認識我們 ============ -->
          <template v-else-if="slide.id === 'numbers'">
            <div class="dk-head">
              <span class="dk-eyebrow dk-in">用數字認識我們</span>
              <h2 class="dk-h2 dk-in" style="--d: 1">每一天，都比昨天更好用</h2>
            </div>
            <div class="dk-stats">
              <article v-for="(st, k) in stats" :key="st.label" class="dk-stat dk-in" :class="{ 'is-accent': st.accent }" :style="{ '--d': k + 2 }">
                <div class="dk-stat__value">
                  <small v-if="st.prefix">{{ st.prefix }}</small>
                  <b>{{ st.count != null ? countText(st) : st.text }}</b>
                  <small v-if="st.unit">{{ st.unit }}</small>
                </div>
                <strong>{{ st.label }}</strong>
                <span v-if="st.note">{{ st.note }}</span>
              </article>
            </div>
            <p class="dk-stats__foot dk-in" style="--d: 7">
              <span v-for="f in statFoot" :key="f">{{ f }}</span>
            </p>
          </template>

          <!-- ============ 案場痛點 ============ -->
          <template v-else-if="slide.id === 'pain'">
            <div class="dk-head">
              <span class="dk-eyebrow dk-in">現況</span>
              <h2 class="dk-h2 dk-in" style="--d: 1">案場每天都在發生的事</h2>
            </div>
            <div class="dk-pains">
              <article v-for="(p, k) in pains" :key="p.title" class="dk-pain dk-in" :style="{ '--d': k + 2 }">
                <span class="dk-pain__icon"><v-icon size="26">{{ p.icon }}</v-icon></span>
                <h3>{{ p.title }}</h3>
                <p>{{ p.desc }}</p>
              </article>
            </div>
            <p class="dk-pains__answer dk-in" style="--d: 8">
              <v-icon size="24">mdi-arrow-right-circle</v-icon>ANXI 把這些事，收進同一個平台
            </p>
          </template>

          <!-- ============ 平台總覽 ============ -->
          <template v-else-if="slide.id === 'platform'">
            <div class="dk-head">
              <span class="dk-eyebrow dk-in">平台總覽</span>
              <h2 class="dk-h2 dk-in" style="--d: 1">一個平台，<br class="dk-br-flow" />串起建案每個階段</h2>
            </div>
            <div class="dk-flowline">
              <template v-for="(st, k) in stages" :key="st.name">
                <article class="dk-stagecard dk-in" :style="{ '--d': k + 2 }">
                  <span class="dk-stagecard__no">{{ pad(k + 1) }}</span>
                  <v-icon class="dk-stagecard__icon" size="34">{{ st.icon }}</v-icon>
                  <h3>{{ st.name }}</h3>
                  <ul><li v-for="it in st.items" :key="it">{{ it }}</li></ul>
                </article>
                <v-icon v-if="k < stages.length - 1" class="dk-flowline__arrow dk-in" :style="{ '--d': k + 2 }" size="28">mdi-chevron-right</v-icon>
              </template>
            </div>
            <div class="dk-platform__base dk-in" style="--d: 8">
              <strong>同一份資料，從頭用到尾</strong>
              <span><v-icon size="20">mdi-devices</v-icon>手機・平板・電腦</span>
              <span><v-icon size="20">mdi-message-badge-outline</v-icon>LINE 即時通知</span>
              <span><v-icon size="20">mdi-account-key-outline</v-icon>依角色分權限</span>
            </div>
          </template>

          <!-- ============ 功能頁（左文右圖） ============ -->
          <template v-else-if="slide.feature">
            <div class="dk-feature">
              <div class="dk-feature__text">
                <span class="dk-eyebrow dk-in"><v-icon size="18">{{ slide.feature.icon }}</v-icon>{{ slide.feature.eyebrow }}</span>
                <h2 class="dk-h2 dk-in" style="--d: 1"><span v-for="line in titleLines(slide.feature.title)" :key="line" class="dk-h2__line">{{ line }}</span></h2>
                <ul class="dk-points">
                  <li v-for="(pt, k) in slide.feature.points" :key="pt[0]" class="dk-in" :style="{ '--d': k + 2 }">
                    <v-icon class="dk-points__icon" size="22">mdi-check-circle</v-icon>
                    <div><strong>{{ pt[0] }}</strong><span>{{ pt[1] }}</span></div>
                  </li>
                </ul>
              </div>

              <div class="dk-feature__visual">
                <div class="dk-visual">
                  <!-- 銷控 -->
                  <template v-if="slide.id === 'sales'">
                    <div class="dk-frame v-sales__desk dk-in" style="--d: 2">
                      <div class="dk-frame__bar"><i></i><i></i><i></i></div>
                      <img :src="salesGrid" alt="銷控表格模式" width="3200" height="2000" />
                    </div>
                    <div class="dk-frame dk-frame--phone v-sales__phone dk-in" style="--d: 4">
                      <img :src="salesMobile" alt="手機版銷控" width="780" height="1688" />
                    </div>
                    <span class="mk-pill v-sales__live dk-in" style="--d: 5"><i class="mk-dot"></i>即時同步</span>
                  </template>

                  <!-- 報價 -->
                  <template v-else-if="slide.id === 'quote'">
                    <div class="mk-card v-quote__card dk-in" style="--d: 2">
                      <div class="mk-quote__head">
                        <div><strong>A-3</strong><span>3F｜47.64 坪</span></div>
                        <span class="mk-chip mk-chip--green">露台</span>
                      </div>
                      <div class="mk-quote__total"><small>報價總價</small><b>3,567</b><em>萬</em></div>
                      <div class="mk-quote__split">房屋 3,280 萬 ＋ 車位 B2-3 287 萬</div>
                      <table class="mk-table">
                        <thead><tr><th>期款</th><th>比例</th><th>金額</th></tr></thead>
                        <tbody>
                          <tr v-for="row in quoteRows" :key="row[0]"><td>{{ row[0] }}</td><td>{{ row[1] }}</td><td>{{ row[2] }}</td></tr>
                        </tbody>
                      </table>
                      <div class="mk-alert"><v-icon size="18">mdi-shield-alert-outline</v-icon>議價 3,450 萬低於底價，已通知主管核准</div>
                    </div>
                    <div class="mk-card v-quote__measure dk-in" style="--d: 4">
                      <div class="mk-card__title"><span><v-icon size="18">mdi-ruler-square</v-icon> 平面圖丈量</span></div>
                      <svg viewBox="0 0 260 180" class="mk-measure" aria-hidden="true">
                        <rect x="8" y="8" width="244" height="164" rx="2" fill="#F8FAFC" stroke="#334155" stroke-width="4" />
                        <path d="M150 8V96M150 128V172M8 100H104M136 100H150M150 70H252" stroke="#334155" stroke-width="3" fill="none" />
                        <rect x="22" y="22" width="114" height="64" fill="rgba(47,107,255,.12)" stroke="#2F6BFF" stroke-width="2" stroke-dasharray="5 4" />
                        <text x="79" y="60" text-anchor="middle" font-size="15" font-weight="700" fill="#1F4FD1">12.6 m²</text>
                        <path d="M22 132H136M22 124V140M136 124V140" stroke="#2F6BFF" stroke-width="2.5" fill="none" />
                        <rect x="52" y="142" width="54" height="22" rx="11" fill="#2F6BFF" />
                        <text x="79" y="158" text-anchor="middle" font-size="13" font-weight="700" fill="#fff">4.20 m</text>
                      </svg>
                    </div>
                  </template>

                  <!-- 車位 -->
                  <template v-else-if="slide.id === 'parking'">
                    <div class="mk-card v-park__map dk-in" style="--d: 2">
                      <div class="mk-card__title"><span>B2 車位圖</span></div>
                      <div class="mk-park">
                        <span v-for="slot in parkingSlots.slice(0, 10)" :key="slot.no" class="mk-slot" :class="`is-${slot.st}`">{{ slot.no }}</span>
                        <div class="mk-park__aisle"><v-icon size="18">mdi-arrow-left</v-icon> 車道 <v-icon size="18">mdi-arrow-right</v-icon></div>
                        <span v-for="slot in parkingSlots.slice(10)" :key="slot.no" class="mk-slot" :class="`is-${slot.st}`">{{ slot.no }}</span>
                      </div>
                      <div class="mk-legend">
                        <span v-for="lg in parkingLegend" :key="lg.st"><i class="mk-slot" :class="`is-${lg.st}`"></i>{{ lg.label }}</span>
                      </div>
                    </div>
                    <div class="mk-card v-park__ratio dk-in" style="--d: 3">
                      <div class="mk-card__title"><span>房車比速覽</span><span class="mk-chip mk-chip--green">充足</span></div>
                      <table class="mk-table">
                        <thead><tr><th></th><th>戶別</th><th>車位</th></tr></thead>
                        <tbody>
                          <tr><td>全案</td><td>120</td><td>132</td></tr>
                          <tr><td>已售</td><td>82</td><td>79</td></tr>
                          <tr><td>剩餘</td><td>38</td><td>53</td></tr>
                        </tbody>
                      </table>
                      <div class="mk-ratio__sum">車位餘裕 <b>+15</b></div>
                    </div>
                    <div class="mk-card v-park__reserve dk-in" style="--d: 4">
                      <div class="mk-card__title"><span>暫時保留</span></div>
                      <div class="mk-reserve"><b>B2-6</b><span>王○明｜保留至 10/08</span></div>
                      <div class="mk-reserve"><b>B2-15</b><span>李○安｜保留至 10/02</span><em>逾期</em></div>
                    </div>
                  </template>

                  <!-- AI 助理 -->
                  <template v-else-if="slide.id === 'ai'">
                    <div class="mk-chat">
                      <div class="mk-chat__head dk-in" style="--d: 2">
                        <span class="mk-chat__avatar"><v-icon size="20">mdi-robot-outline</v-icon></span>
                        <strong>智能助理</strong><i class="mk-dot"></i>
                      </div>
                      <div class="mk-chat__body">
                        <div class="mk-msg mk-msg--me dk-in" style="--d: 3">A-3 賣了嗎？</div>
                        <div class="mk-msg mk-msg--ai dk-in" style="--d: 5">A-3 已於 9/12 小訂，銷售周小倫，成交總價 3,450 萬（含車位 B2-3）。</div>
                        <div class="mk-msg mk-msg--me dk-in" style="--d: 7">把 C-3 改小訂、配 B2-5 車位，房價 3,450</div>
                        <div class="mk-msg mk-msg--ai mk-diff dk-in" style="--d: 9">
                          <div class="mk-diff__title">請確認變更明細｜C-3</div>
                          <div v-for="row in aiDiffRows" :key="row[0]" class="mk-diff__row">
                            <span>{{ row[0] }}</span><s>{{ row[1] }}</s><v-icon size="16">mdi-arrow-right</v-icon><b>{{ row[2] }}</b>
                          </div>
                          <div class="mk-diff__actions"><span class="mk-btn mk-btn--primary">確認寫入</span><span class="mk-btn">取消</span></div>
                        </div>
                      </div>
                      <div class="mk-chat__input dk-in" style="--d: 2">輸入問題，例如「本案成交總額」<v-icon size="18">mdi-send</v-icon></div>
                    </div>
                  </template>

                  <!-- 合約製作 -->
                  <template v-else-if="slide.id === 'contract'">
                    <div class="mk-doc v-doc--3 dk-in" style="--d: 2"><div class="mk-doc__title">拆款表</div><i v-for="n in 7" :key="n"></i></div>
                    <div class="mk-doc v-doc--2 dk-in" style="--d: 3"><div class="mk-doc__title">付款明細表</div><i v-for="n in 7" :key="n"></i></div>
                    <div class="mk-doc v-doc--1 dk-in" style="--d: 4">
                      <div class="mk-doc__title">合約數字對照表</div>
                      <table class="mk-doc__table">
                        <tbody>
                          <tr v-for="row in contractRows" :key="row[0]"><th>{{ row[0] }}</th><td :class="{ 'mk-ink': row[2] }">{{ row[1] }}</td></tr>
                        </tbody>
                      </table>
                    </div>
                    <span class="mk-file v-doc__pdf dk-in" style="--d: 6">PDF</span>
                    <span class="mk-file mk-file--xls v-doc__xls dk-in" style="--d: 7">EXCEL</span>
                  </template>

                  <!-- 請佣獎金 -->
                  <template v-else-if="slide.id === 'commission'">
                    <div class="mk-card v-comm__table dk-in" style="--d: 2">
                      <div class="mk-card__title"><span>第 3 期請佣</span><span class="mk-chip">依成交價</span></div>
                      <table class="mk-table">
                        <thead><tr><th>戶別</th><th>成交總價</th><th>比例</th><th>請佣金額</th></tr></thead>
                        <tbody>
                          <tr v-for="row in commissionRows" :key="row[0]"><td>{{ row[0] }}</td><td>{{ row[1] }}</td><td>{{ row[2] }}</td><td>{{ row[3] }}</td></tr>
                        </tbody>
                        <tfoot><tr><td colspan="3">本期合計</td><td>289.25 萬</td></tr></tfoot>
                      </table>
                    </div>
                    <div class="mk-card v-comm__bonus dk-in" style="--d: 4">
                      <div class="mk-card__title"><span>個人獎金分配</span></div>
                      <div v-for="b in bonusRows" :key="b.name" class="mk-bar">
                        <span class="mk-bar__name">{{ b.name }}</span>
                        <span class="mk-bar__track"><i :style="{ width: `${b.pct}%` }"></i></span>
                        <span class="mk-bar__val">{{ b.amount }}</span>
                      </div>
                      <div class="mk-note">已扣保留款、稅金、二代健保</div>
                    </div>
                  </template>

                  <!-- 客戶管理 -->
                  <template v-else-if="slide.id === 'customer'">
                    <div class="dk-frame dk-frame--phone v-cust__phone dk-in" style="--d: 2">
                      <img :src="vipFormMobile" alt="貴賓資料表（客戶手機填寫）" width="780" height="1688" />
                    </div>
                    <div class="mk-line v-cust__line1 dk-in" style="--d: 4">
                      <div class="mk-line__head"><v-icon size="18">mdi-chat</v-icon>ANXI 通知</div>
                      <div class="mk-line__body">
                        <span class="mk-chip mk-chip--red">客戶重疊</span>
                        <strong>王○明｜0912-***-678</strong>
                        <p>同時登記：周小倫、蔡小林</p>
                        <span class="mk-line__btn">選擇歸屬銷售</span>
                      </div>
                    </div>
                    <div class="mk-line v-cust__line2 dk-in" style="--d: 6">
                      <div class="mk-line__head"><v-icon size="18">mdi-chat</v-icon>ANXI 通知</div>
                      <div class="mk-line__body">
                        <span class="mk-chip mk-chip--green">客戶資料完成</span>
                        <strong>林○華 已填寫貴賓資料表</strong>
                        <p>歸屬銷售：周小倫</p>
                        <span class="mk-line__btn">開啟洽談紀錄</span>
                      </div>
                    </div>
                  </template>

                  <!-- 名單分配 -->
                  <template v-else-if="slide.id === 'leads'">
                    <div class="dk-frame v-leads__desk dk-in" style="--d: 2">
                      <div class="dk-frame__bar"><i></i><i></i><i></i></div>
                      <img :src="viewingCalendar" alt="賞屋預約行事曆" width="3200" height="2000" />
                    </div>
                    <div class="mk-card v-leads__assign dk-in" style="--d: 4">
                      <div class="mk-card__title"><span>名單分配</span><span class="mk-chip">新進 36 筆</span></div>
                      <div v-for="a in assignRows" :key="a.name" class="mk-assign">
                        <span class="mk-avatar">{{ a.name.slice(0, 1) }}</span>
                        <strong>{{ a.name }}</strong>
                        <span><small>本週</small>{{ a.week }}</span>
                        <span><small>上週</small>{{ a.last }}</span>
                        <span><small>本月</small>{{ a.month }}</span>
                      </div>
                      <span class="mk-btn mk-btn--primary mk-btn--block">平均分配</span>
                    </div>
                  </template>

                  <!-- 線上預約 -->
                  <template v-else-if="slide.id === 'booking'">
                    <div class="dk-frame v-book__desk dk-in" style="--d: 2">
                      <div class="dk-frame__bar"><i></i><i></i><i></i></div>
                      <img :src="bookingCalendar" alt="預約時間表（後台）" width="3200" height="2000" />
                    </div>
                    <div class="dk-frame dk-frame--phone v-book__phone dk-in" style="--d: 4">
                      <img :src="bookingMobile" alt="客戶線上預約頁" width="780" height="1688" />
                    </div>
                    <span class="mk-pill v-book__toast dk-in" style="--d: 6"><v-icon size="18">mdi-email-check-outline</v-icon>預約確認信已寄出</span>
                  </template>

                  <!-- 驗屋修繕 -->
                  <template v-else-if="slide.id === 'inspection'">
                    <div class="dk-frame dk-frame--phone v-insp__phone dk-in" style="--d: 2">
                      <img :src="inspectionMobile" alt="驗屋紀錄拍照標記" width="780" height="1688" />
                    </div>
                    <div class="mk-card v-insp__progress dk-in" style="--d: 4">
                      <div class="mk-card__title"><span>A 棟修繕進度</span><span class="mk-chip">共 100 項</span></div>
                      <div v-for="r in repairRows" :key="r.label" class="mk-bar">
                        <span class="mk-bar__name"><i class="mk-dot" :style="{ background: r.color }"></i>{{ r.label }}</span>
                        <span class="mk-bar__track"><i :style="{ width: `${r.count}%`, background: r.color }"></i></span>
                        <span class="mk-bar__val">{{ r.count }}</span>
                      </div>
                    </div>
                    <div class="mk-card v-insp__extras dk-in" style="--d: 6">
                      <div class="mk-extra"><v-icon size="22">mdi-file-pdf-box</v-icon><span>PDF 驗屋報告</span><small>一鍵匯出</small></div>
                      <div class="mk-extra"><v-icon size="22">mdi-draw-pen</v-icon><span>電子簽名點交</span><small>現場完成</small></div>
                    </div>
                  </template>

                  <!-- 形象網站 -->
                  <template v-else-if="slide.id === 'website'">
                    <div class="dk-frame v-web__back dk-in" style="--d: 2">
                      <div class="dk-frame__bar"><i></i><i></i><i></i></div>
                      <img :src="website1" alt="建案形象網站" width="1600" height="904" />
                    </div>
                    <div class="dk-frame v-web__front dk-in" style="--d: 4">
                      <div class="dk-frame__bar"><i></i><i></i><i></i></div>
                      <img :src="website2" alt="案場電子表板" width="1600" height="899" />
                    </div>
                  </template>
                </div>
              </div>
            </div>
          </template>

          <!-- ============ 為什麼選 ANXI ============ -->
          <template v-else-if="slide.id === 'why'">
            <div class="dk-head">
              <span class="dk-eyebrow dk-in">為什麼選 ANXI</span>
              <h2 class="dk-h2 dk-in" style="--d: 1">好導入、好上手、持續進化</h2>
            </div>
            <div class="dk-reasons">
              <article v-for="(r, k) in reasons" :key="r.title" class="dk-reason dk-in" :style="{ '--d': k + 2 }">
                <span class="dk-reason__icon"><v-icon size="28">{{ r.icon }}</v-icon></span>
                <h3>{{ r.title }}</h3>
                <p>{{ r.desc }}</p>
              </article>
            </div>
          </template>

          <!-- ============ 方案價格 ============ -->
          <template v-else-if="slide.id === 'pricing'">
            <div class="dk-head">
              <span class="dk-eyebrow dk-in">方案價格</span>
              <h2 class="dk-h2 dk-in" style="--d: 1">依需求選擇，<br class="dk-br-flow" />先試用再決定</h2>
            </div>
            <div class="dk-plans">
              <article v-for="(p, k) in planProducts" :key="p.id" class="dk-plan dk-in" :style="{ '--d': k + 2 }">
                <div class="dk-plan__head"><v-icon size="26">{{ p.icon }}</v-icon><h3>{{ p.name }}</h3></div>
                <ul>
                  <li v-for="pl in p.plans" :key="pl.name" :class="{ 'is-hot': pl.isRecommended }">
                    <span class="dk-plan__name">{{ pl.name }}<em v-if="pl.badge">{{ pl.badge }}</em></span>
                    <span class="dk-plan__price"><b>{{ pl.price }}</b><small v-if="pl.unit"> / {{ pl.unit }}</small></span>
                    <span v-if="pl.priceNote" class="dk-plan__note">{{ pl.priceNote }}</span>
                  </li>
                </ul>
              </article>
            </div>
            <p class="dk-plans__foot dk-in" style="--d: 8">以上金額未含稅｜公司多人訂閱、大量戶別另有優惠</p>
          </template>

          <!-- ============ 開始試用 ============ -->
          <template v-else-if="slide.id === 'trial'">
            <div class="dk-trial">
              <div class="dk-trial__text">
                <span class="dk-eyebrow dk-in">免費試用</span>
                <h2 class="dk-h2 dk-in" style="--d: 1">現在就親自操作看看</h2>
                <p class="dk-trial__lead dk-in" style="--d: 2">掃描 QR Code 留下基本資料，立即進入範例建案</p>
                <ol class="dk-steps">
                  <li v-for="(st, k) in trialSteps" :key="st.title" class="dk-in" :style="{ '--d': k + 3 }">
                    <span class="dk-steps__no">{{ k + 1 }}</span>
                    <strong>{{ st.title }}</strong>
                    <span>{{ st.desc }}</span>
                  </li>
                </ol>
                <div class="dk-trial__contact dk-in" style="--d: 6">
                  <button type="button" class="dk-btn dk-btn--primary dk-btn--lg" @click="goTrial('deck-end')">
                    開始試用 <v-icon size="20">mdi-arrow-right</v-icon>
                  </button>
                  <a class="dk-btn dk-btn--outline-light dk-btn--lg" :href="LINE_URL" target="_blank" rel="noopener">
                    <v-icon size="20">mdi-chat-outline</v-icon>LINE 洽詢
                  </a>
                  <a class="dk-trial__tel" :href="`tel:${PHONE.replace(/-/g, '')}`"><v-icon size="20">mdi-phone-outline</v-icon>{{ PHONE }}</a>
                </div>
              </div>
              <div class="dk-qr dk-in" style="--d: 3">
                <img v-if="qrDataUrl" :src="qrDataUrl" alt="開始試用 QR Code" />
                <div v-else class="dk-qr__ph"></div>
                <strong>掃描開始試用</strong>
                <span>免安裝・免信用卡・附功能導覽</span>
              </div>
            </div>
          </template>

          <footer v-if="slide.id !== 'cover'" class="dk-foot">
            <span class="dk-foot__brand"><img :src="slide.theme === 'dark' ? logoWhiteUrl : logoUrl" alt="" />ANXI 安熙智慧</span>
            <span>{{ pad(i + 1) }} / {{ pad(slides.length) }}</span>
          </footer>
        </section>
      </div>
    </div>

    <!-- 控制列 -->
    <nav v-if="!flowMode" class="dk-controls" aria-label="簡報控制">
      <button type="button" class="dk-ctrl" :disabled="current === 0" aria-label="上一頁" @click="prev">
        <v-icon size="24">mdi-chevron-left</v-icon>
      </button>
      <span class="dk-ctrl__count">{{ current + 1 }} / {{ slides.length }}</span>
      <button type="button" class="dk-ctrl" :disabled="current === slides.length - 1" aria-label="下一頁" @click="next">
        <v-icon size="24">mdi-chevron-right</v-icon>
      </button>
      <span class="dk-ctrl__sep"></span>
      <button type="button" class="dk-ctrl" aria-label="目錄" @click="overviewOpen = !overviewOpen">
        <v-icon size="20">mdi-view-grid-outline</v-icon>
      </button>
      <button v-if="canFullscreen" type="button" class="dk-ctrl" :aria-label="isFullscreen ? '離開全螢幕' : '全螢幕'" @click="toggleFullscreen">
        <v-icon size="22">{{ isFullscreen ? 'mdi-fullscreen-exit' : 'mdi-fullscreen' }}</v-icon>
      </button>
    </nav>

    <!-- 目錄 -->
    <transition name="dk-fade">
      <div v-if="overviewOpen && !flowMode" class="dk-overview" @click.self="overviewOpen = false">
        <div class="dk-overview__panel">
          <div class="dk-overview__head">
            <strong>目錄</strong>
            <button type="button" class="dk-ctrl" aria-label="關閉" @click="overviewOpen = false"><v-icon size="20">mdi-close</v-icon></button>
          </div>
          <ol class="dk-overview__list">
            <li v-for="(s, i) in slides" :key="s.id">
              <button type="button" :class="{ 'is-current': i === current }" @click="jump(i)">
                <span>{{ pad(i + 1) }}</span>{{ s.nav }}
              </button>
            </li>
          </ol>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount, nextTick } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import QRCode from 'qrcode';
import { PRODUCT_PLANS } from '@/constants/productPlans';
import { COMPANY_PROFILE } from '@/constants/companyProfile';
import { appVersion } from '@/version';
import logoUrl from '@/assets/landing/anxi-logo.webp';
import logoWhiteUrl from '@/assets/landing/anxi-logo-white.webp';
import heroImage from '@/assets/landing/hero-poster.webp';
import salesGrid from '@/assets/landing/sales/sales-grid.webp';
import salesMobile from '@/assets/landing/sales/sales-mobile.webp';
import bookingCalendar from '@/assets/landing/booking/booking-calendar.webp';
import bookingMobile from '@/assets/landing/booking/booking-page-mobile.webp';
import viewingCalendar from '@/assets/landing/booking/booking-batches.webp'; // 實際畫面為賞屋預約月曆
import vipFormMobile from '@/assets/landing/customer/vip-form-mobile.webp';
import inspectionMobile from '@/assets/landing/inspection/inspection-record-mobile.webp';
import website1 from '@/assets/landing/website/website-1.webp';
import website2 from '@/assets/landing/website/website-2.webp';

const route = useRoute();
const router = useRouter();

const LINE_URL = 'https://lin.ee/rBZmaUG';
const PHONE = '0980-371-014';
const STAGE_W = 1600;
const STAGE_H = 900;
const VISUAL_W = 720; // 功能頁右側示意圖設計寬度（手機閱讀模式依此等比縮放）

// ---------------------------------------------------------------
// 簡報內容
// ---------------------------------------------------------------
const slides = [
  { id: 'cover', nav: '封面', theme: 'dark' },
  { id: 'about', nav: '關於 ANXI', theme: 'soft' },
  { id: 'numbers', nav: '用數字認識我們', theme: 'dark' },
  { id: 'pain', nav: '案場痛點' },
  { id: 'platform', nav: '平台總覽', theme: 'soft' },
  {
    id: 'sales', nav: '雲端銷控',
    feature: {
      eyebrow: '雲端銷控系統', icon: 'mdi-home-analytics', title: '即時同步的雲端銷控表',
      points: [
        ['一張表，全團隊同步', '櫃台改價、銷售報價，所有人看到同一份最新資料'],
        ['重點戶別一眼看見', '文字標籤、邊框特效，總價／單價／簽約日自由切換'],
        ['統計分析即時算好', '資料透視、去化率統計、Excel 匯出匯入'],
        ['成交資料完整保存', '留言備註、繳款紀錄、介紹費與贈品、上傳文件、退戶紀錄'],
        ['權限分工', '櫃台、銷售、主管各看各的、各做各的'],
      ],
    },
  },
  {
    id: 'quote', nav: '報價與期款', theme: 'soft',
    feature: {
      eyebrow: '報價系統', icon: 'mdi-calculator-variant', title: '報價自動算，議價有把關',
      points: [
        ['期款自動計算', '依物件類型、總價、首購條件帶出適用的期款範本'],
        ['公司借貸報價單', '借款金額、利率、期數現場試算，費用與攤還表一鍵列印'],
        ['低於底價先通知主管', '自動核對底價，可設定銷售議價授權額度'],
        ['平面圖丈量工具', '任意距離、面積，現場量給客戶看'],
        ['報價單一鍵輸出', '預覽、列印、下載 PDF'],
      ],
    },
  },
  {
    id: 'parking', nav: '車位與銷售圖面',
    feature: {
      eyebrow: '車位銷控・銷售圖面', icon: 'mdi-car-multiple', title: '車位、圖面，同樣即時銷控',
      points: [
        ['車位圖面化管理', '依樓層、類型、狀態篩選，配車一目了然'],
        ['房車比速覽', '自動算出車位缺口或餘裕，充足／吃緊／不足即時提示'],
        ['保留車位到期提醒', '記錄保留人與到期日，逾期紅字標示'],
        ['銷售圖面編輯器', '全區平面圖疊上即時戶別資訊卡，匯出 PNG／PDF'],
      ],
    },
  },
  {
    id: 'ai', nav: 'AI 智能助理', theme: 'dark',
    feature: {
      eyebrow: 'AI 智能助理', icon: 'mdi-robot-outline', title: '一句話，查銷控也改銷控',
      points: [
        ['自然語言查詢', '「A-3 賣了嗎」「本案成交總額」立刻回答'],
        ['口語就能改銷控', '狀態、車位、成交價一句話完成，缺資料會主動詢問'],
        ['確認後才寫入', '逐欄列出修改前 → 修改後，一眼核對'],
      ],
    },
  },
  {
    id: 'contract', nav: '合約製作', theme: 'soft',
    feature: {
      eyebrow: '合約製作', icon: 'mdi-file-sign', title: '成交後的文件，一鍵產出',
      points: [
        ['戶別資料自動帶入', '付款明細表、拆款表、繳款帳戶、合約附圖'],
        ['合約數字對照表', '價款國字大寫、面積、契約常數自動填好'],
        ['配套／裝修合約', '兩頁付款表、裝修會辦單同步產出'],
        ['自動防呆', '比例、金額、房土款不符即時標示，完全手動也照樣檢核'],
        ['PDF／EXCEL 下載', '產製過的檔案自動保存在戶別'],
      ],
    },
  },
  {
    id: 'commission', nav: '請佣獎金',
    feature: {
      eyebrow: '請佣獎金', icon: 'mdi-cash-multiple', title: '請佣、獎金，每期自動結算',
      points: [
        ['戶別請佣試算', '墊低法、墊高法、成交價、底價多種計算基準'],
        ['獎金彈性分配', '比例與金額並行，支援跨建案人員'],
        ['自動扣除', '介紹費、贈品逐筆帶入，保留款、稅金、二代健保依人員設定計算'],
        ['歷期紀錄可追溯', '拉回編輯、作廢重建、退佣追回都留紀錄'],
        ['報表版型自訂', 'Excel／PDF 即時預覽，直接拖曳調整'],
      ],
    },
  },
  {
    id: 'customer', nav: '客戶管理', theme: 'soft',
    feature: {
      eyebrow: '客戶管理系統', icon: 'mdi-account-group', title: '客資自己填，歸屬不再吵',
      points: [
        ['掃碼自主填寫', '客戶用手機填貴賓資料表，資料直接進系統'],
        ['銷售專屬 QR Code', '掃哪位銷售的碼，就自動歸屬誰'],
        ['重複客戶即時裁決', '系統比對重複客源，LINE 通知櫃台裁決並留紀錄'],
        ['洽談紀錄完整追蹤', '每次來訪、需求、預算都有紀錄，換人接手也不漏'],
      ],
    },
  },
  {
    id: 'leads', nav: '名單分配',
    feature: {
      eyebrow: '名單分配・賞屋預約', icon: 'mdi-account-arrow-right', title: '廣告名單，進來就分好',
      points: [
        ['Excel 名單匯入', '重複電話自動辨識，上千筆也能快速匯入'],
        ['一鍵平均分配', '顯示每位銷售本週、上週、本月已分配數量'],
        ['LINE 推送與回報', '銷售在 LINE 回報聯絡狀況，未回報定時提醒'],
        ['賞屋預約連動', '新客預約自動建立名單並分配給銷售，掃碼即加入手機行事曆'],
      ],
    },
  },
  {
    id: 'booking', nav: '線上預約', theme: 'soft',
    feature: {
      eyebrow: '線上預約系統', icon: 'mdi-calendar-check', title: '客變、對保、驗交屋，客戶線上自己約',
      points: [
        ['客戶自助預約', '手機就能預約、修改、取消，免來回電話'],
        ['批次、時段、名額', '自訂開放批次、時段與名額上限'],
        ['自動通知', 'Email 即時通知客戶與後台人員'],
        ['完整時間表', '日／週／月檢視、每日名額、人員排休'],
        ['LINE 也能看', '在 LINE 內查看時間表、下載行程'],
      ],
    },
  },
  {
    id: 'inspection', nav: '驗屋修繕',
    feature: {
      eyebrow: '雲端驗屋／修繕系統', icon: 'mdi-clipboard-check', title: '驗屋拍照標記，修繕一路追蹤',
      points: [
        ['數位驗屋紀錄', '手機平板拍照標記，自動產生缺失單'],
        ['修繕進度燈號', '待修繕、已安排、修繕中，廠商派工一目了然'],
        ['一鍵 PDF 報告', '專業驗屋報告自動產出'],
        ['住戶線上專區', '住戶掃碼查詢進度與修繕照片'],
        ['電子簽名點交', '現場簽名確認，無紙化交屋'],
      ],
    },
  },
  {
    id: 'website', nav: '形象網站', theme: 'soft',
    feature: {
      eyebrow: '形象網站／電子表板', icon: 'mdi-web', title: '從線上第一眼，到案場解說',
      points: [
        ['專屬主視覺', '依建案風格量身設計'],
        ['RWD 響應式', '手機、平板、電腦完美呈現'],
        ['留資即時通知', '預約表單送出即推送 LINE／Email'],
        ['互動電子表板', '周邊環境、建材工法、樓層規劃，雲端同步更新'],
      ],
    },
  },
  { id: 'why', nav: '為什麼選 ANXI' },
  { id: 'pricing', nav: '方案價格', theme: 'soft' },
  { id: 'trial', nav: '開始試用', theme: 'dark' },
];

const story = [
  { tag: '起點', title: '從建案專案主管開始', desc: '每天管銷控、名單、人員與報表，和紙本價目表、Excel 一起加班' },
  { tag: '轉折', title: '「被 Excel 折磨過，所以不讓你再受一次」', desc: '自己動手，把案場流程一項項搬上雲端', quote: true },
  { tag: '現在', title: '精實團隊，回饋直達開發', desc: '小改當天上線，大功能幾天就到位' },
];

// ANXI＝安（An）＋熙（Xi）
const nameChars = [
  { char: '安', roman: 'AN', meaning: '安心經營' },
  { char: '熙', roman: 'XI', meaning: '光明興盛' },
];

const monthsSince = (iso) => {
  const from = new Date(iso);
  const now = new Date();
  return (now.getFullYear() - from.getFullYear()) * 12 + now.getMonth() - from.getMonth() - (now.getDate() < from.getDate() ? 1 : 0);
};
const versionCount = Number(String(appVersion).split('.').pop()) || 0;
const stats = [
  { count: COMPANY_PROFILE.partnerProjects, suffix: '+', unit: '個', label: '累計合作建案' },
  { count: COMPANY_PROFILE.managedUnits, suffix: '+', unit: '戶', label: '系統管理戶數' },
  { count: versionCount, unit: '個版本', label: `${monthsSince(COMPANY_PROFILE.launchDate)} 個月內推出` },
  { prefix: '凌晨', text: COMPANY_PROFILE.latestRelease, label: '最晚一次發版', note: '我們比案場還晚下班', accent: true },
];
const statFoot = [
  `${COMPANY_PROFILE.lateNightUpdates}+ 次深夜更新`,
  `${COMPANY_PROFILE.weekendUpdates}+ 次週末更新`,
  '小改當天上線',
];

const coverModules = ['雲端銷控', '自動報價', '客戶管理', '名單分配', '線上預約', '驗屋修繕', '請佣獎金', '形象網站'];

const pains = [
  { icon: 'mdi-file-document-alert-outline', title: '價目表改了好幾版', desc: '紙本、Excel 各自更新，櫃台和銷售看到的價格不一樣' },
  { icon: 'mdi-calculator-variant-outline', title: '報價全靠手算', desc: '期款、車位、議價算錯一次，就是一次客訴' },
  { icon: 'mdi-account-multiple-remove-outline', title: '撞客說不清', desc: '客資散在各自手機，歸屬爭議沒有紀錄可查' },
  { icon: 'mdi-phone-alert-outline', title: '預約全靠電話', desc: '客變、對保、驗屋排程，一通一通打電話確認' },
  { icon: 'mdi-clipboard-alert-outline', title: '驗屋缺失難追', desc: '紙本缺失單、照片散落，修繕進度沒人說得清' },
  { icon: 'mdi-cash-clock', title: '請佣對帳耗時', desc: '每期佣金、獎金重拉 Excel，核對到半夜' },
];

const stages = [
  { icon: 'mdi-web', name: '預售行銷', items: ['形象網站', '電子表板', '留資通知'] },
  { icon: 'mdi-account-search-outline', name: '客戶開發', items: ['客資建檔', '名單分配', '賞屋預約'] },
  { icon: 'mdi-handshake-outline', name: '銷售成交', items: ['銷控', '報價', '車位', 'AI 助理'] },
  { icon: 'mdi-file-document-multiple-outline', name: '成交管理', items: ['合約製作', '繳款紀錄', '請佣獎金'] },
  { icon: 'mdi-key-variant', name: '交屋售後', items: ['線上預約', '驗屋修繕', '住戶專區'] },
];

const quoteRows = [
  ['訂金', '3%', '107.0 萬'],
  ['簽約金', '7%', '249.7 萬'],
  ['工程期款', '10%', '356.7 萬'],
  ['交屋貸款', '80%', '2,853.6 萬'],
];

// 車位圖：s 已簽約、b 已訂未簽、r 暫時保留、a 可售
const parkingSlots = 'ssbasraasbassarasaba'.split('').map((st, i) => ({ no: i + 1, st }));
const parkingLegend = [
  { st: 's', label: '已簽約' },
  { st: 'b', label: '已訂未簽' },
  { st: 'r', label: '暫時保留' },
  { st: 'a', label: '可售' },
];

const aiDiffRows = [
  ['後台狀態', '可售', '小訂'],
  ['車位', '—', 'B2-5'],
  ['房屋成交價', '—', '3,450 萬'],
];

const contractRows = [
  ['棟樓', 'C 棟 3 樓'],
  ['車位', 'B2-5'],
  ['房屋面積', '54.69 坪'],
  ['房屋總價款', '新臺幣參仟肆佰伍拾萬元整', true],
  ['貸款金額', '新臺幣貳仟柒佰陸拾萬元整', true],
];

const commissionRows = [
  ['A-3', '3,450 萬', '2.0%', '69.00 萬'],
  ['B-5', '3,675 萬', '2.0%', '73.50 萬'],
  ['C-4', '3,883 萬', '1.8%', '69.89 萬'],
  ['D-2', '3,843 萬', '2.0%', '76.86 萬'],
];

const bonusRows = [
  { name: '周小倫', amount: '12.6 萬', pct: 100 },
  { name: '蔡小林', amount: '9.8 萬', pct: 78 },
  { name: '林小美', amount: '7.4 萬', pct: 59 },
];

const assignRows = [
  { name: '周小倫', week: 12, last: 9, month: 41 },
  { name: '蔡小林', week: 11, last: 10, month: 40 },
  { name: '林小美', week: 13, last: 9, month: 42 },
];

const repairRows = [
  { label: '待修繕', count: 18, color: '#EF4444' },
  { label: '已安排', count: 12, color: '#2F6BFF' },
  { label: '修繕中', count: 7, color: '#F59E0B' },
  { label: '已完成', count: 63, color: '#22C55E' },
];

const reasons = [
  { icon: 'mdi-cloud-check-outline', title: '雲端免安裝', desc: '手機、平板、電腦打開瀏覽器就能用' },
  { icon: 'mdi-chat-processing-outline', title: 'LINE 深度整合', desc: '通知、裁決、名單回報，在 LINE 直接完成' },
  { icon: 'mdi-account-key-outline', title: '權限分工', desc: '櫃台、銷售、主管各看各的資料' },
  { icon: 'mdi-puzzle-outline', title: '模組自由組合', desc: '只訂需要的系統，資料彼此互通' },
  { icon: 'mdi-home-city-outline', title: '案場出身', desc: '懂第一線流程，功能照案場真實需求打造' },
  { icon: 'mdi-face-agent', title: '專人服務', desc: '專人協助建置開通，LINE 即時諮詢' },
];

const planProducts = [
  { id: 'sales', name: '雲端銷控／報價', icon: 'mdi-home-analytics' },
  { id: 'customer', name: '客戶管理', icon: 'mdi-account-group' },
  { id: 'booking', name: '線上預約', icon: 'mdi-calendar-check' },
  { id: 'inspection', name: '驗屋／修繕', icon: 'mdi-clipboard-check' },
  { id: 'website', name: '形象網站／電子表板', icon: 'mdi-web' },
].map((p) => ({ ...p, plans: PRODUCT_PLANS[p.id].pricing }));

const trialSteps = [
  { title: '掃碼留資', desc: '30 秒填寫基本資料' },
  { title: '立即體驗', desc: '自動登入範例建案，直接操作' },
  { title: '專人導入', desc: '確認需求後協助建置開通' },
];

const pad = (n) => String(n).padStart(2, '0');
const titleLines = (t) => t.replace(/，/g, '，\n').split('\n'); // 標題於逗號後斷行，避免單字孤行

// ---------------------------------------------------------------
// 試用連結（帶 source 與簡報網址上的 utm，方便追蹤業務分享來源）
// ---------------------------------------------------------------
const trialQuery = (entry) => {
  const q = { source: entry };
  ['utm_source', 'utm_medium', 'utm_campaign'].forEach((k) => {
    if (route.query[k]) q[k] = String(route.query[k]);
  });
  return q;
};
const goTrial = (entry) => router.push({ name: 'TrialSignup', query: trialQuery(entry) });

const qrDataUrl = ref('');
const buildQr = async () => {
  const href = router.resolve({ name: 'TrialSignup', query: trialQuery('deck-qr') }).href;
  const url = new URL(href, window.location.href).href;
  try {
    qrDataUrl.value = await QRCode.toDataURL(url, { margin: 1, width: 560, errorCorrectionLevel: 'M', color: { dark: '#0B0B0F', light: '#FFFFFF' } });
  } catch (e) {
    console.warn('[ProductDeck] QR Code 產生失敗:', e);
  }
};

// ---------------------------------------------------------------
// 模式：簡報（16:9 舞台等比縮放）／手機閱讀（直式或窄螢幕改上下捲動）
// ---------------------------------------------------------------
const flowQuery = window.matchMedia('screen and (max-aspect-ratio: 1/1), screen and (max-width: 560px)');
const isFlow = ref(flowQuery.matches);
const printing = ref(false);
const flowMode = computed(() => isFlow.value && !printing.value);
const vw = ref(window.innerWidth);
const vh = ref(window.innerHeight);
const scale = computed(() => Math.min(vw.value / STAGE_W, vh.value / STAGE_H));
const stageStyle = computed(() => (flowMode.value ? null : { transform: `translate(-50%, -50%) scale(${scale.value})` }));
const visualZoom = computed(() => Math.min(1, (vw.value - 40) / VISUAL_W).toFixed(3));

const viewportEl = ref(null);
const slideEls = [];
const indexOf = (id) => slides.findIndex((s) => s.id === id);
const current = ref(Math.max(0, indexOf(route.params.slide)));
const seen = ref(slides.map(() => false));

const slideState = (i) => {
  if (flowMode.value) return seen.value[i] ? 'is-seen' : '';
  if (i === current.value) return 'is-current';
  return i < current.value ? 'is-past' : '';
};

const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const countT = ref(1);
let countRaf = 0;
const runCount = () => {
  cancelAnimationFrame(countRaf);
  if (reducedMotion) { countT.value = 1; return; }
  countT.value = 0;
  const start = performance.now() + 350; // 等卡片浮現
  const step = (now) => {
    const p = Math.min(1, Math.max(0, (now - start) / 1400));
    countT.value = 1 - (1 - p) ** 3;
    if (p < 1) countRaf = requestAnimationFrame(step);
  };
  countRaf = requestAnimationFrame(step);
};
const countText = (st) => `${Math.round(st.count * countT.value).toLocaleString('en-US')}${st.suffix || ''}`;
const numbersIndex = indexOf('numbers');
watch(
  () => (flowMode.value ? seen.value[numbersIndex] : current.value === numbersIndex),
  (on) => { if (on) runCount(); },
  { immediate: true },
);

const go = (i) => { current.value = Math.max(0, Math.min(slides.length - 1, i)); };
const next = () => go(current.value + 1);
const prev = () => go(current.value - 1);
const overviewOpen = ref(false);
const jump = (i) => { go(i); overviewOpen.value = false; };

// 簡報模式同步網址（/deck/ai），方便業務直接分享某一頁
watch(current, (i) => {
  if (isFlow.value) return;
  const params = i === 0 ? {} : { slide: slides[i].id };
  router.replace({ name: 'ProductDeck', params, query: route.query });
});
watch(() => route.params.slide, (id) => {
  const i = Math.max(0, indexOf(id));
  if (i !== current.value) current.value = i;
});

const TOP_BAR_H = 56;
const scrollToSlide = (i, smooth = true) => {
  const el = slideEls[i];
  if (!el) return;
  const top = i === 0 ? 0 : el.getBoundingClientRect().top + window.scrollY - TOP_BAR_H;
  window.scrollTo({ top, behavior: smooth ? 'smooth' : 'auto' });
};

let io = null;
const observeFlow = () => {
  io?.disconnect();
  io = null;
  if (!isFlow.value) return;
  io = new IntersectionObserver((entries) => {
    entries.forEach((en) => { if (en.isIntersecting) seen.value[Number(en.target.dataset.index)] = true; });
  }, { threshold: 0.12 });
  slideEls.forEach((el) => el && io.observe(el));
};

const onFlowChange = async (e) => {
  if (printing.value || window.matchMedia('print').matches) return; // 列印時的版面切換不處理
  if (isFlow.value && !e.matches) {
    // 閱讀模式 → 簡報模式：接續目前捲到的頁
    const mid = window.innerHeight * 0.4;
    let idx = 0;
    slideEls.forEach((el, i) => { if (el && el.getBoundingClientRect().top <= mid) idx = i; });
    current.value = idx;
  }
  isFlow.value = e.matches;
  await nextTick();
  observeFlow();
  if (isFlow.value) scrollToSlide(current.value, false);
  else window.scrollTo(0, 0);
};

const onResize = () => { vw.value = window.innerWidth; vh.value = window.innerHeight; };
const onBeforePrint = () => { printing.value = true; cancelAnimationFrame(countRaf); countT.value = 1; };
const onAfterPrint = () => { printing.value = false; };

// ---------------------------------------------------------------
// 操作：鍵盤／滾輪／滑動
// ---------------------------------------------------------------
const onKey = (e) => {
  if (isFlow.value || e.metaKey || e.ctrlKey || e.altKey) return;
  if (e.target.closest?.('input, textarea, select, [contenteditable="true"]')) return;
  if (overviewOpen.value) {
    if (e.key === 'Escape') overviewOpen.value = false;
    return;
  }
  const onButton = !!e.target.closest?.('button, a');
  switch (e.key) {
    case 'ArrowRight': case 'ArrowDown': case 'PageDown':
      e.preventDefault(); next(); break;
    case 'ArrowLeft': case 'ArrowUp': case 'PageUp':
      e.preventDefault(); prev(); break;
    case ' ':
      if (onButton) return; // 交給按鈕本身的點擊
      e.preventDefault(); e.shiftKey ? prev() : next(); break;
    case 'Home': e.preventDefault(); go(0); break;
    case 'End': e.preventDefault(); go(slides.length - 1); break;
    case 'f': case 'F': toggleFullscreen(); break;
    default:
  }
};

// 觸控板慣性會連續送出滾輪事件：觸發一次後持續鎖住，直到事件停止 200ms
let wheelLockUntil = 0;
let wheelAcc = 0;
const onWheel = (e) => {
  if (isFlow.value || overviewOpen.value) return;
  e.preventDefault();
  const now = Date.now();
  if (now < wheelLockUntil) { wheelLockUntil = Math.max(wheelLockUntil, now + 200); return; }
  wheelAcc += Math.abs(e.deltaY) >= Math.abs(e.deltaX) ? e.deltaY : e.deltaX;
  if (Math.abs(wheelAcc) > 40) {
    wheelAcc > 0 ? next() : prev();
    wheelAcc = 0;
    wheelLockUntil = now + 650;
  }
};

let touchStart = null;
const onTouchStart = (e) => {
  if (isFlow.value) return;
  const t = e.touches[0];
  touchStart = { x: t.clientX, y: t.clientY, at: Date.now() };
};
const onTouchEnd = (e) => {
  if (!touchStart) return;
  const t = e.changedTouches[0];
  const dx = t.clientX - touchStart.x;
  const dy = t.clientY - touchStart.y;
  const quick = Date.now() - touchStart.at < 800;
  touchStart = null;
  if (!quick || Math.max(Math.abs(dx), Math.abs(dy)) < 50) return;
  const d = Math.abs(dx) > Math.abs(dy) ? dx : dy;
  d < 0 ? next() : prev();
};

// 閒置 3 秒淡出控制列（簡報時畫面乾淨）
const idle = ref(false);
let idleTimer = null;
const wake = () => {
  idle.value = false;
  clearTimeout(idleTimer);
  idleTimer = setTimeout(() => { if (!overviewOpen.value) idle.value = true; }, 3000);
};

const canFullscreen = !!document.documentElement.requestFullscreen;
const isFullscreen = ref(false);
const toggleFullscreen = () => {
  if (!canFullscreen) return;
  if (document.fullscreenElement) document.exitFullscreen();
  else document.documentElement.requestFullscreen().catch(() => {});
};
const onFullscreenChange = () => { isFullscreen.value = !!document.fullscreenElement; };

const prevTitle = document.title;

onMounted(async () => {
  document.title = '產品簡報｜ANXI 安熙智慧';
  flowQuery.addEventListener('change', onFlowChange);
  window.addEventListener('resize', onResize);
  window.addEventListener('keydown', onKey);
  window.addEventListener('mousemove', wake, { passive: true });
  window.addEventListener('touchstart', wake, { passive: true });
  window.addEventListener('keydown', wake);
  document.addEventListener('fullscreenchange', onFullscreenChange);
  window.addEventListener('beforeprint', onBeforePrint);
  window.addEventListener('afterprint', onAfterPrint);
  viewportEl.value?.addEventListener('wheel', onWheel, { passive: false });
  wake();
  buildQr();
  await nextTick();
  observeFlow();
  if (isFlow.value && current.value > 0) scrollToSlide(current.value, false);
});

onBeforeUnmount(() => {
  flowQuery.removeEventListener('change', onFlowChange);
  window.removeEventListener('resize', onResize);
  window.removeEventListener('keydown', onKey);
  window.removeEventListener('mousemove', wake);
  window.removeEventListener('touchstart', wake);
  window.removeEventListener('keydown', wake);
  document.removeEventListener('fullscreenchange', onFullscreenChange);
  window.removeEventListener('beforeprint', onBeforePrint);
  window.removeEventListener('afterprint', onAfterPrint);
  viewportEl.value?.removeEventListener('wheel', onWheel);
  io?.disconnect();
  clearTimeout(idleTimer);
  cancelAnimationFrame(countRaf);
  if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
  document.title = prevTitle;
});
</script>

<style scoped>
/* =============================================================
   Tokens（與首頁同一套：電光藍 #2F6BFF）
   ============================================================= */
.dk {
  --dk-primary: #2F6BFF;
  --dk-primary-dark: #1F4FD1;
  --dk-black: #0B0B0F;
  --dk-bg-soft: #F5F6F8;
  --dk-text: #111827;
  --dk-muted: #6B7280;
  --dk-border: #E5E7EB;

  position: fixed;
  inset: 0;
  overflow: hidden;
  background: #05070D;
  color: var(--dk-text);
  font-family: 'Inter', 'Noto Sans TC', system-ui, -apple-system, 'Segoe UI', sans-serif;
  -webkit-font-smoothing: antialiased;
}
.dk.is-idle.is-fullscreen { cursor: none; }

/* =============================================================
   舞台 / 投影片
   ============================================================= */
.dk-viewport { position: absolute; inset: 0; overflow: hidden; overscroll-behavior: none; }
.dk-stage { position: absolute; left: 50%; top: 50%; width: 1600px; height: 900px; transform-origin: center center; }
.dk-slide {
  position: absolute; inset: 0;
  display: flex; flex-direction: column;
  padding: 92px 104px 112px;
  overflow: hidden;
  background: #fff;
  opacity: 0; visibility: hidden; transform: translateX(48px);
  transition: opacity .55s ease, transform .55s cubic-bezier(.2,.7,.2,1), visibility 0s linear .55s;
}
.dk-slide.is-past { transform: translateX(-48px); }
.dk-slide.is-current { opacity: 1; visibility: visible; transform: none; transition-delay: 0s; }
.dk-slide.is-soft { background: var(--dk-bg-soft); }
.dk-slide.is-dark {
  color: #fff;
  background:
    radial-gradient(1100px 620px at 88% 8%, rgba(47,107,255,.34), transparent 62%),
    radial-gradient(900px 520px at 0% 100%, rgba(47,107,255,.16), transparent 60%),
    #070A14;
}

/* 進場：逐項浮現 */
.dk-in { opacity: 0; transform: translateY(18px); transition: opacity .6s ease, transform .6s cubic-bezier(.2,.7,.2,1); }
.is-current .dk-in,
.is-seen .dk-in { opacity: 1; transform: none; transition-delay: calc(var(--d, 0) * 70ms + 160ms); }

/* 共用文字 */
.dk-head { display: flex; flex-direction: column; align-items: flex-start; }
.dk-eyebrow {
  display: inline-flex; align-items: center; gap: 8px; align-self: flex-start;
  padding: 8px 16px; border-radius: 999px;
  background: rgba(47,107,255,.08); color: var(--dk-primary);
  font-size: 17px; font-weight: 600; letter-spacing: .02em;
}
.is-dark .dk-eyebrow { background: rgba(255,255,255,.12); color: #A9C1FF; }
.dk-h2 { margin: 18px 0 0; font-size: 54px; font-weight: 700; line-height: 1.22; letter-spacing: -0.02em; }
.dk-h2__line { display: block; }
.dk-br-flow { display: none; }
.dk-cover__sub, .dk-trial__lead { text-wrap: balance; }
.dk-points span, .dk-pain p, .dk-reason p, .dk-steps li > span:last-child { text-wrap: pretty; }

.dk-foot {
  position: absolute; left: 104px; right: 104px; bottom: 36px;
  display: flex; align-items: center; justify-content: space-between;
  font-size: 15px; color: var(--dk-muted); letter-spacing: .04em; font-variant-numeric: tabular-nums;
}
.dk-foot__brand { display: inline-flex; align-items: center; gap: 10px; font-weight: 600; }
.dk-foot__brand img { height: 22px; width: auto; }
.is-dark .dk-foot { color: rgba(255,255,255,.5); }

/* 按鈕 */
.dk-btn {
  display: inline-flex; align-items: center; justify-content: center; gap: 8px;
  height: 44px; padding: 0 22px; border-radius: 999px;
  border: 1px solid transparent; cursor: pointer; text-decoration: none; white-space: nowrap;
  font: inherit; font-size: 15px; font-weight: 600;
  transition: transform .2s ease, background .2s ease, box-shadow .2s ease;
}
.dk-btn:hover { transform: translateY(-1px); }
.dk-btn--lg { height: 60px; padding: 0 30px; font-size: 19px; }
.dk-btn--primary { background: var(--dk-primary); color: #fff; box-shadow: 0 10px 24px rgba(47,107,255,.35); }
.dk-btn--primary:hover { background: var(--dk-primary-dark); }
.dk-btn--outline-light { background: transparent; color: #fff; border-color: rgba(255,255,255,.5); }
.dk-btn--outline-light:hover { background: rgba(255,255,255,.1); }

/* 截圖外框 */
.dk-frame { position: absolute; border-radius: 14px; overflow: hidden; background: #0F172A; box-shadow: 0 30px 70px rgba(15,23,42,.28); }
.dk-frame img { display: block; width: 100%; height: auto; }
.dk-frame__bar { height: 26px; display: flex; align-items: center; gap: 6px; padding: 0 12px; background: #1E293B; }
.dk-frame__bar i { width: 9px; height: 9px; border-radius: 50%; background: #475569; }
.dk-frame__bar i:nth-child(1) { background: #F87171; }
.dk-frame__bar i:nth-child(2) { background: #FBBF24; }
.dk-frame__bar i:nth-child(3) { background: #34D399; }
.dk-frame--phone { border-radius: 32px; border: 8px solid #0F172A; }
.dk-frame--phone img { border-radius: 24px; }

/* =============================================================
   頂欄 / 進度 / 控制列 / 目錄
   ============================================================= */
.dk-top { position: fixed; top: 16px; right: 20px; z-index: 5; display: flex; align-items: center; gap: 12px; transition: opacity .4s ease; }
.dk-top__brand { display: inline-flex; align-items: center; gap: 8px; color: var(--dk-text); text-decoration: none; font-weight: 700; letter-spacing: .03em; }
.dk-top__brand img { height: 26px; width: auto; }
.dk.is-idle .dk-top { opacity: 0; }

.dk-progress { position: fixed; top: 0; left: 0; right: 0; height: 3px; z-index: 6; }
.dk-progress i { display: block; height: 100%; background: var(--dk-primary); transition: width .4s ease; }

.dk-controls {
  position: fixed; left: 50%; bottom: 18px; z-index: 5; transform: translateX(-50%);
  display: flex; align-items: center; gap: 2px; padding: 6px;
  border-radius: 999px; background: rgba(15,18,28,.78); color: #fff;
  backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px);
  box-shadow: 0 10px 30px rgba(0,0,0,.25);
  transition: opacity .4s ease;
}
.dk.is-idle .dk-controls { opacity: 0; }
.dk-controls:hover { opacity: 1 !important; }
.dk-ctrl {
  width: 40px; height: 40px; border: 0; border-radius: 50%; padding: 0;
  display: inline-flex; align-items: center; justify-content: center;
  background: transparent; color: inherit; cursor: pointer;
}
.dk-ctrl:hover:not(:disabled) { background: rgba(255,255,255,.14); }
.dk-ctrl:disabled { opacity: .35; cursor: default; }
.dk-ctrl__count { min-width: 64px; text-align: center; font-size: 14px; letter-spacing: .04em; font-variant-numeric: tabular-nums; }
.dk-ctrl__sep { width: 1px; height: 20px; margin: 0 4px; background: rgba(255,255,255,.2); }

.dk-overview { position: fixed; inset: 0; z-index: 7; display: flex; justify-content: flex-end; background: rgba(5,7,13,.45); }
.dk-overview__panel { width: min(360px, 100%); height: 100%; overflow-y: auto; padding: 18px 16px 28px; background: #fff; box-shadow: -20px 0 50px rgba(0,0,0,.25); }
.dk-overview__head { display: flex; align-items: center; justify-content: space-between; padding: 0 4px 12px; font-size: 18px; }
.dk-overview__head .dk-ctrl { color: var(--dk-text); }
.dk-overview__head .dk-ctrl:hover { background: var(--dk-bg-soft); }
.dk-overview__list { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 2px; }
.dk-overview__list button {
  width: 100%; display: flex; align-items: center; gap: 14px;
  padding: 11px 12px; border: 0; border-radius: 12px; background: transparent;
  font: inherit; font-size: 16px; color: var(--dk-text); text-align: left; cursor: pointer;
}
.dk-overview__list button span { font-size: 13px; color: var(--dk-muted); font-variant-numeric: tabular-nums; }
.dk-overview__list button:hover { background: var(--dk-bg-soft); }
.dk-overview__list button.is-current { background: rgba(47,107,255,.1); color: var(--dk-primary); font-weight: 600; }
.dk-fade-enter-active, .dk-fade-leave-active { transition: opacity .2s ease; }
.dk-fade-enter-from, .dk-fade-leave-to { opacity: 0; }

/* =============================================================
   封面
   ============================================================= */
.dk-slide--cover { padding: 0; }
.dk-cover__bg { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; }
.dk-cover__shade { position: absolute; inset: 0; background: linear-gradient(90deg, rgba(5,8,18,.92) 0%, rgba(5,8,18,.72) 45%, rgba(5,8,18,.25) 100%); }
.dk-cover { position: relative; z-index: 1; height: 100%; display: grid; grid-template-columns: 780px 1fr; align-items: center; gap: 40px; padding: 0 104px; }
.dk-cover__brand { display: flex; align-items: center; gap: 14px; font-size: 22px; font-weight: 700; letter-spacing: .06em; }
.dk-cover__brand img { height: 44px; width: auto; }
.dk-cover__title { margin: 36px 0 24px; font-size: 80px; font-weight: 700; line-height: 1.14; letter-spacing: -0.02em; }
.dk-cover__sub { margin: 0; font-size: 24px; color: rgba(255,255,255,.78); }
.dk-cover__modules { list-style: none; margin: 32px 0 0; padding: 0; display: flex; flex-wrap: wrap; gap: 10px; }
.dk-cover__modules li { padding: 8px 16px; border-radius: 999px; border: 1px solid rgba(255,255,255,.28); background: rgba(255,255,255,.06); font-size: 16px; color: rgba(255,255,255,.9); }
.dk-cover__cta { display: flex; gap: 14px; margin-top: 44px; }
.dk-cover__visual { position: relative; height: 560px; }
.dk-cover__desk { left: 0; top: 80px; width: 540px; rotate: -4deg; }
.dk-cover__phone { right: 0; bottom: 10px; width: 190px; rotate: 4deg; box-shadow: 0 30px 70px rgba(0,0,0,.5); }

/* =============================================================
   關於 ANXI
   ============================================================= */
.dk-about { flex: 1; min-height: 0; display: grid; grid-template-columns: minmax(0, 1fr) 500px; gap: 96px; align-items: center; }
.dk-about__text { display: flex; flex-direction: column; }
.dk-story { list-style: none; margin: 44px 0 0; padding: 0; display: flex; flex-direction: column; gap: 28px; }
.dk-story li { position: relative; display: grid; grid-template-columns: 72px minmax(0, 1fr); column-gap: 22px; row-gap: 4px; }
.dk-story li:not(:last-child)::after { content: ''; position: absolute; left: 35px; top: 42px; bottom: -24px; width: 2px; background: #CBD5E1; }
.dk-story__tag { grid-row: span 2; align-self: start; width: 72px; padding: 6px 0; border-radius: 999px; background: var(--dk-black); color: #fff; text-align: center; font-size: 15px; font-weight: 700; letter-spacing: .1em; }
.dk-story strong { font-size: 25px; font-weight: 700; line-height: 1.4; text-wrap: balance; }
.dk-story strong.is-quote { color: var(--dk-primary); }
.dk-story li > span:last-child { font-size: 18px; line-height: 1.6; color: var(--dk-muted); text-wrap: pretty; }
.dk-name { position: relative; overflow: hidden; padding: 40px 44px 38px; border-radius: 28px; background: #fff; border: 1px solid var(--dk-border); box-shadow: 0 30px 70px rgba(15,23,42,.10); }
.dk-name__mark { position: absolute; right: -40px; top: -30px; width: 240px; height: auto; opacity: .05; pointer-events: none; }
.dk-name__label { font-size: 16px; font-weight: 600; letter-spacing: .12em; color: var(--dk-muted); }
.dk-name__chars { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin: 20px 0 28px; }
.dk-name__char { display: flex; flex-direction: column; align-items: flex-start; gap: 6px; }
.dk-name__char b { font-family: 'Noto Serif TC', 'Songti TC', 'PMingLiU', serif; font-size: 128px; font-weight: 700; line-height: 1.05; }
.dk-name__char small { font-size: 16px; font-weight: 700; letter-spacing: .3em; color: var(--dk-primary); }
.dk-name__char span { font-size: 22px; font-weight: 600; }
.dk-name__motto { margin: 0; padding-top: 22px; border-top: 1px solid var(--dk-border); font-size: 20px; font-weight: 700; }

/* =============================================================
   用數字認識我們
   ============================================================= */
.dk-slide--numbers { justify-content: center; }
.dk-stats { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 20px; margin-top: 56px; }
.dk-stat { display: flex; flex-direction: column; gap: 8px; min-height: 250px; padding: 36px 28px 32px; border-radius: 24px; background: rgba(255,255,255,.06); border: 1px solid rgba(255,255,255,.12); }
.dk-stat.is-accent { background: linear-gradient(135deg, #2F6BFF 0%, #2457E0 100%); border-color: transparent; box-shadow: 0 24px 60px rgba(47,107,255,.35); }
.dk-stat__value { display: flex; align-items: baseline; gap: 8px; margin-bottom: auto; padding-bottom: 20px; white-space: nowrap; }
.dk-stat__value b { font-size: 76px; font-weight: 700; line-height: 1; letter-spacing: -0.03em; font-variant-numeric: tabular-nums; }
.dk-stat__value small { font-size: 22px; font-weight: 600; color: rgba(255,255,255,.7); }
.dk-stat strong { font-size: 21px; font-weight: 700; }
.dk-stat > span { font-size: 17px; font-weight: 600; color: #A9C1FF; }
.dk-stat.is-accent > span, .dk-stat.is-accent .dk-stat__value small { color: rgba(255,255,255,.85); }
.dk-stats__foot { display: flex; flex-wrap: wrap; align-items: center; gap: 10px 0; margin: 40px 0 0; font-size: 19px; color: rgba(255,255,255,.72); }
.dk-stats__foot span + span::before { content: ''; display: inline-block; width: 6px; height: 6px; margin: 0 18px; border-radius: 50%; background: var(--dk-primary); vertical-align: middle; }

/* =============================================================
   案場痛點
   ============================================================= */
.dk-pains { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 20px; margin-top: 40px; }
.dk-pain { padding: 24px 28px; border-radius: 22px; background: var(--dk-bg-soft); border: 1px solid var(--dk-border); }
.dk-pain__icon { width: 50px; height: 50px; border-radius: 14px; display: inline-flex; align-items: center; justify-content: center; background: #FEE2E2; color: #DC2626; }
.dk-pain h3 { margin: 16px 0 6px; font-size: 25px; font-weight: 700; }
.dk-pain p { margin: 0; font-size: 18px; line-height: 1.6; color: var(--dk-muted); }
.dk-pains__answer { display: flex; align-items: center; gap: 10px; margin: 30px 0 0; font-size: 24px; font-weight: 700; color: var(--dk-primary); }

/* =============================================================
   平台總覽
   ============================================================= */
.dk-flowline { display: flex; align-items: stretch; gap: 8px; margin-top: 48px; }
.dk-stagecard { flex: 1; min-width: 0; display: flex; flex-direction: column; padding: 26px 22px; border-radius: 22px; background: #fff; border: 1px solid var(--dk-border); box-shadow: 0 12px 30px rgba(15,23,42,.06); }
.dk-stagecard__no { font-size: 14px; font-weight: 700; letter-spacing: .12em; color: var(--dk-primary); }
.dk-stagecard__icon { color: var(--dk-primary); margin: 14px 0; }
.dk-stagecard h3 { margin: 0 0 16px; font-size: 26px; font-weight: 700; }
.dk-stagecard ul { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 8px; }
.dk-stagecard li { padding: 8px 12px; border-radius: 10px; background: var(--dk-bg-soft); font-size: 17px; }
.dk-flowline__arrow { align-self: center; flex: none; color: #94A3B8; }
.dk-platform__base { display: flex; align-items: center; gap: 28px; margin-top: 32px; padding: 20px 28px; border-radius: 18px; background: var(--dk-black); color: #fff; font-size: 17px; }
.dk-platform__base strong { margin-right: auto; font-size: 21px; }
.dk-platform__base span { display: inline-flex; align-items: center; gap: 8px; color: rgba(255,255,255,.8); }

/* =============================================================
   功能頁
   ============================================================= */
.dk-feature { flex: 1; min-height: 0; display: grid; grid-template-columns: 560px 720px; justify-content: space-between; align-items: center; }
.dk-feature__text { display: flex; flex-direction: column; }
.dk-points { list-style: none; margin: 40px 0 0; padding: 0; display: flex; flex-direction: column; gap: 22px; }
.dk-points li { display: flex; align-items: flex-start; gap: 14px; }
.dk-points__icon { flex: none; margin-top: 4px; color: var(--dk-primary); }
.dk-points strong { display: block; font-size: 24px; font-weight: 700; line-height: 1.35; }
.dk-points span { display: block; margin-top: 2px; font-size: 18px; line-height: 1.6; color: var(--dk-muted); }
.is-dark .dk-points span { color: rgba(255,255,255,.66); }
.is-dark .dk-points__icon { color: #7EA2FF; }
.dk-visual { position: relative; width: 720px; height: 640px; }

/* 示意圖共用 */
.mk-card { position: absolute; padding: 22px 24px; border-radius: 18px; background: #fff; border: 1px solid var(--dk-border); color: var(--dk-text); box-shadow: 0 24px 60px rgba(15,23,42,.14); }
.mk-card__title { display: flex; align-items: center; justify-content: space-between; gap: 10px; margin-bottom: 14px; font-size: 18px; font-weight: 700; }
.mk-card__title > span:first-child { display: inline-flex; align-items: center; gap: 6px; }
.mk-chip { display: inline-flex; align-items: center; padding: 4px 10px; border-radius: 999px; background: rgba(47,107,255,.1); color: var(--dk-primary); font-size: 13px; font-weight: 600; white-space: nowrap; }
.mk-chip--green { background: #DCFCE7; color: #15803D; }
.mk-chip--red { background: #FEE2E2; color: #DC2626; }
.mk-table { width: 100%; border-collapse: collapse; font-size: 16px; font-variant-numeric: tabular-nums; }
.mk-table th { padding: 0 0 8px; border-bottom: 1px solid var(--dk-border); text-align: left; font-size: 13px; font-weight: 600; color: var(--dk-muted); }
.mk-table td { padding: 10px 0; border-bottom: 1px solid #F1F5F9; }
.mk-table th:not(:first-child), .mk-table td:not(:first-child) { text-align: right; }
.mk-table tfoot td { border-bottom: 0; padding-top: 12px; font-weight: 700; }
.mk-table tfoot td:last-child { color: var(--dk-primary); font-size: 18px; }
.mk-pill { position: absolute; display: inline-flex; align-items: center; gap: 8px; padding: 10px 16px; border-radius: 999px; background: #fff; color: var(--dk-text); font-size: 15px; font-weight: 600; box-shadow: 0 14px 34px rgba(15,23,42,.18); }
.mk-dot { display: inline-block; width: 9px; height: 9px; border-radius: 50%; background: #22C55E; flex: none; }
.mk-pill .mk-dot { box-shadow: 0 0 0 4px rgba(34,197,94,.2); }
.mk-btn { display: inline-flex; align-items: center; justify-content: center; padding: 8px 16px; border-radius: 999px; background: #F1F5F9; color: var(--dk-text); font-size: 14px; font-weight: 600; }
.mk-btn--primary { background: var(--dk-primary); color: #fff; }
.mk-btn--block { display: flex; margin-top: 14px; padding: 11px 16px; }
.mk-note { margin-top: 12px; font-size: 13px; color: var(--dk-muted); }

/* 銷控 */
.v-sales__desk { left: 0; top: 70px; width: 640px; }
.v-sales__phone { right: 0; bottom: 0; width: 200px; }
.v-sales__live { left: 24px; top: 14px; }

/* 報價 */
.v-quote__card { left: 0; top: 10px; width: 456px; }
.mk-quote__head { display: flex; align-items: center; justify-content: space-between; }
.mk-quote__head strong { font-size: 24px; margin-right: 10px; }
.mk-quote__head span:not(.mk-chip) { font-size: 15px; color: var(--dk-muted); }
.mk-quote__total { display: flex; align-items: baseline; gap: 8px; margin-top: 14px; }
.mk-quote__total small { font-size: 14px; color: var(--dk-muted); margin-right: 6px; }
.mk-quote__total b { font-size: 46px; font-weight: 700; letter-spacing: -0.02em; color: #E11D48; }
.mk-quote__total em { font-style: normal; font-size: 18px; font-weight: 600; color: #E11D48; }
.mk-quote__split { margin: 2px 0 16px; font-size: 14px; color: var(--dk-muted); }
.mk-alert { display: flex; align-items: center; gap: 8px; margin-top: 16px; padding: 10px 14px; border-radius: 12px; background: #FFF7ED; color: #C2410C; font-size: 14px; font-weight: 600; }
.v-quote__measure { right: 0; bottom: 60px; width: 244px; padding: 16px 18px; }
.mk-measure { display: block; width: 100%; height: auto; }

/* 車位 */
.v-park__map { left: 0; right: 0; top: 296px; }
.mk-park { display: grid; grid-template-columns: repeat(10, 1fr); gap: 6px; }
.mk-park__aisle { grid-column: 1 / -1; display: flex; align-items: center; justify-content: center; gap: 10px; padding: 10px 0; color: #94A3B8; font-size: 13px; letter-spacing: .2em; }
.mk-slot { display: flex; align-items: center; justify-content: center; height: 78px; border-radius: 8px; border: 1.5px solid #CBD5E1; background: #fff; font-size: 13px; font-weight: 600; color: #475569; }
.mk-slot.is-s { background: var(--dk-black); border-color: var(--dk-black); color: #fff; }
.mk-slot.is-b { background: var(--dk-primary); border-color: var(--dk-primary); color: #fff; }
.mk-slot.is-r { background: #F59E0B; border-color: #F59E0B; color: #fff; }
.mk-legend { display: flex; gap: 18px; margin-top: 16px; font-size: 13px; color: var(--dk-muted); }
.mk-legend span { display: inline-flex; align-items: center; gap: 6px; }
.mk-legend .mk-slot { width: 14px; height: 14px; border-radius: 4px; }
.v-park__ratio { left: 0; top: 0; width: 340px; padding: 18px 20px; }
.mk-ratio__sum { display: flex; justify-content: space-between; margin-top: 12px; font-size: 15px; color: var(--dk-muted); }
.mk-ratio__sum b { font-size: 20px; color: #15803D; }
.v-park__reserve { right: 0; top: 0; width: 356px; padding: 18px 20px; }
.mk-reserve { display: flex; align-items: center; gap: 10px; padding: 9px 0; border-top: 1px solid #F1F5F9; font-size: 14px; }
.mk-reserve b { min-width: 48px; font-size: 15px; }
.mk-reserve span { color: var(--dk-muted); }
.mk-reserve em { margin-left: auto; padding: 2px 8px; border-radius: 999px; background: #FEE2E2; color: #DC2626; font-style: normal; font-size: 12px; font-weight: 700; }

/* AI 助理 */
.mk-chat { position: absolute; left: 50px; top: 0; width: 620px; border-radius: 24px; overflow: hidden; background: #fff; color: var(--dk-text); box-shadow: 0 30px 80px rgba(0,0,0,.45); }
.mk-chat__head { display: flex; align-items: center; gap: 10px; padding: 16px 20px; border-bottom: 1px solid var(--dk-border); font-size: 17px; }
.mk-chat__avatar { width: 34px; height: 34px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; background: linear-gradient(135deg, #2F6BFF, #7C3AED); color: #fff; }
.mk-chat__body { display: flex; flex-direction: column; gap: 12px; padding: 20px; background: #F8FAFC; }
.mk-msg { max-width: 82%; padding: 12px 16px; border-radius: 18px; font-size: 17px; line-height: 1.55; }
.mk-msg--me { align-self: flex-end; border-bottom-right-radius: 6px; background: var(--dk-primary); color: #fff; }
.mk-msg--ai { align-self: flex-start; border-bottom-left-radius: 6px; background: #fff; border: 1px solid var(--dk-border); }
.mk-diff { width: 82%; }
.mk-diff__title { margin-bottom: 8px; font-weight: 700; }
.mk-diff__row { display: grid; grid-template-columns: 100px 1fr 20px 1fr; align-items: center; gap: 6px; padding: 6px 0; border-top: 1px solid #F1F5F9; font-size: 15px; }
.mk-diff__row span { color: var(--dk-muted); }
.mk-diff__row s { color: #94A3B8; text-align: right; }
.mk-diff__row b { color: var(--dk-primary); }
.mk-diff__actions { display: flex; gap: 8px; margin-top: 12px; }
.mk-chat__input { display: flex; align-items: center; justify-content: space-between; padding: 14px 20px; border-top: 1px solid var(--dk-border); font-size: 15px; color: #94A3B8; }

/* 合約製作 */
.mk-doc { position: absolute; width: 420px; height: 540px; padding: 28px 30px; border-radius: 8px; background: #fff; border: 1px solid var(--dk-border); box-shadow: 0 24px 60px rgba(15,23,42,.14); }
.mk-doc__title { margin-bottom: 22px; padding-bottom: 14px; border-bottom: 2px solid var(--dk-text); text-align: center; font-size: 22px; font-weight: 700; letter-spacing: .2em; color: var(--dk-text); }
.mk-doc > i { display: block; height: 12px; margin: 18px 0; border-radius: 6px; background: #EEF2F7; }
.mk-doc > i:nth-of-type(odd) { width: 78%; }
.v-doc--3 { left: 30px; top: 30px; rotate: -7deg; }
.v-doc--2 { left: 130px; top: 50px; rotate: -2deg; }
.v-doc--1 { left: 250px; top: 70px; width: 450px; }
.mk-doc__table { width: 100%; border-collapse: collapse; font-size: 16px; }
.mk-doc__table th, .mk-doc__table td { padding: 13px 10px; border: 1px solid #CBD5E1; text-align: left; }
.mk-doc__table th { width: 112px; background: #F8FAFC; font-weight: 600; color: #475569; }
.mk-ink { color: #1E40AF; font-weight: 700; font-family: 'BiauKai', 'DFKai-SB', 'Kaiti TC', serif; font-size: 18px; }
.mk-file { position: absolute; padding: 8px 16px; border-radius: 10px; background: #DC2626; color: #fff; font-size: 15px; font-weight: 700; letter-spacing: .06em; box-shadow: 0 12px 28px rgba(220,38,38,.35); }
.mk-file--xls { background: #15803D; box-shadow: 0 12px 28px rgba(21,128,61,.35); }
.v-doc__pdf { right: -6px; top: 40px; }
.v-doc__xls { right: -6px; top: 96px; }

/* 請佣獎金 */
.v-comm__table { left: 0; top: 20px; width: 520px; }
.v-comm__bonus { right: 0; bottom: 20px; width: 380px; }
.mk-bar { display: grid; grid-template-columns: 84px 1fr 70px; align-items: center; gap: 12px; padding: 8px 0; font-size: 15px; }
.mk-bar__name { display: inline-flex; align-items: center; gap: 8px; font-weight: 600; }
.mk-bar__track { height: 10px; border-radius: 999px; background: #EEF2F7; overflow: hidden; }
.mk-bar__track i { display: block; height: 100%; border-radius: inherit; background: var(--dk-primary); }
.mk-bar__val { text-align: right; font-weight: 700; font-variant-numeric: tabular-nums; }

/* 客戶管理 */
.v-cust__phone { right: 30px; top: 0; width: 250px; }
.mk-line { position: absolute; width: 380px; border-radius: 18px; overflow: hidden; background: #fff; color: var(--dk-text); box-shadow: 0 24px 60px rgba(15,23,42,.18); }
.mk-line__head { display: flex; align-items: center; gap: 8px; padding: 10px 16px; background: #06C755; color: #fff; font-size: 14px; font-weight: 700; }
.mk-line__body { display: flex; flex-direction: column; align-items: flex-start; gap: 8px; padding: 16px 18px 18px; }
.mk-line__body strong { font-size: 18px; }
.mk-line__body p { margin: 0; font-size: 15px; color: var(--dk-muted); }
.mk-line__btn { align-self: stretch; margin-top: 6px; padding: 10px; border-radius: 10px; background: #F1F5F9; text-align: center; font-size: 15px; font-weight: 600; color: #06A045; }
.v-cust__line1 { left: 0; top: 90px; }
.v-cust__line2 { left: 40px; top: 370px; }

/* 名單分配 */
.v-leads__desk { left: 0; top: 30px; width: 620px; }
.v-leads__assign { right: 0; bottom: 10px; width: 400px; }
.mk-assign { display: grid; grid-template-columns: 36px 1fr repeat(3, 56px); align-items: center; gap: 8px; padding: 9px 0; border-top: 1px solid #F1F5F9; font-size: 15px; }
.mk-assign > span:not(.mk-avatar) { text-align: center; font-weight: 700; font-variant-numeric: tabular-nums; }
.mk-assign small { display: block; font-size: 11px; font-weight: 500; color: var(--dk-muted); }
.mk-avatar { width: 32px; height: 32px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; background: rgba(47,107,255,.12); color: var(--dk-primary); font-size: 14px; font-weight: 700; }

/* 線上預約 */
.v-book__desk { left: 0; top: 60px; width: 620px; }
.v-book__phone { right: 0; bottom: 0; width: 210px; }
.v-book__toast { left: 30px; bottom: 60px; }
.v-book__toast .v-icon { color: #15803D; }

/* 驗屋修繕 */
.v-insp__phone { left: 20px; top: 0; width: 260px; }
.v-insp__progress { right: 0; top: 60px; width: 390px; }
.v-insp__extras { right: 0; bottom: 50px; width: 390px; display: flex; flex-direction: column; gap: 4px; padding: 14px 20px; }
.mk-extra { display: flex; align-items: center; gap: 12px; padding: 8px 0; font-size: 16px; font-weight: 600; }
.mk-extra .v-icon { color: var(--dk-primary); }
.mk-extra small { margin-left: auto; font-size: 13px; font-weight: 500; color: var(--dk-muted); }

/* 形象網站 */
.v-web__back { left: 0; top: 20px; width: 560px; }
.v-web__front { right: 0; bottom: 30px; width: 560px; box-shadow: 0 30px 80px rgba(15,23,42,.38); }

/* =============================================================
   為什麼選 ANXI
   ============================================================= */
.dk-reasons { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 22px; margin-top: 48px; }
.dk-reason { padding: 30px 30px 32px; border-radius: 22px; background: #fff; border: 1px solid var(--dk-border); box-shadow: 0 12px 30px rgba(15,23,42,.05); }
.dk-reason__icon { width: 56px; height: 56px; border-radius: 16px; display: inline-flex; align-items: center; justify-content: center; background: rgba(47,107,255,.1); color: var(--dk-primary); }
.dk-reason h3 { margin: 18px 0 8px; font-size: 26px; font-weight: 700; }
.dk-reason p { margin: 0; font-size: 18px; line-height: 1.6; color: var(--dk-muted); }

/* =============================================================
   方案價格
   ============================================================= */
.dk-plans { display: grid; grid-template-columns: repeat(5, minmax(0, 1fr)); gap: 18px; align-items: start; margin-top: 40px; }
.dk-plan { padding: 24px 20px 20px; border-radius: 22px; background: #fff; border: 1px solid var(--dk-border); }
.dk-plan__head { display: flex; flex-direction: column; gap: 10px; margin-bottom: 6px; }
.dk-plan__head .v-icon { color: var(--dk-primary); }
.dk-plan__head h3 { margin: 0; font-size: 21px; font-weight: 700; line-height: 1.35; }
.dk-plan ul { list-style: none; margin: 0; padding: 0; }
.dk-plan li { display: flex; flex-direction: column; gap: 4px; margin-top: 10px; padding: 14px; border-radius: 14px; background: var(--dk-bg-soft); }
.dk-plan li.is-hot { background: var(--dk-black); color: #fff; }
.dk-plan__name { display: flex; align-items: center; justify-content: space-between; gap: 6px; font-size: 14px; color: var(--dk-muted); }
.is-hot .dk-plan__name { color: rgba(255,255,255,.7); }
.dk-plan__name em { padding: 2px 8px; border-radius: 999px; background: var(--dk-primary); color: #fff; font-style: normal; font-size: 11px; font-weight: 700; white-space: nowrap; }
.dk-plan__price b { font-size: 24px; font-weight: 700; letter-spacing: -0.01em; }
.dk-plan__price small { font-size: 13px; opacity: .7; }
.dk-plan__note { font-size: 12px; font-weight: 600; color: var(--dk-primary); }
.is-hot .dk-plan__note { color: #93B4FF; }
.dk-plans__foot { margin: 22px 0 0; font-size: 15px; color: var(--dk-muted); }

/* =============================================================
   開始試用
   ============================================================= */
.dk-trial { flex: 1; min-height: 0; display: grid; grid-template-columns: 1fr 400px; gap: 96px; align-items: center; }
.dk-trial__text { display: flex; flex-direction: column; }
.dk-trial__lead { margin: 16px 0 0; font-size: 22px; color: rgba(255,255,255,.75); }
.dk-steps { list-style: none; margin: 40px 0 0; padding: 0; display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 16px; }
.dk-steps li { display: flex; flex-direction: column; gap: 6px; padding: 22px; border-radius: 18px; background: rgba(255,255,255,.06); border: 1px solid rgba(255,255,255,.12); }
.dk-steps__no { width: 34px; height: 34px; margin-bottom: 8px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; background: var(--dk-primary); font-size: 16px; font-weight: 700; }
.dk-steps strong { font-size: 21px; }
.dk-steps li > span:last-child { font-size: 16px; line-height: 1.55; color: rgba(255,255,255,.66); }
.dk-trial__contact { display: flex; align-items: center; flex-wrap: wrap; gap: 14px; margin-top: 40px; }
.dk-trial__tel { display: inline-flex; align-items: center; gap: 8px; margin-left: 10px; color: #fff; text-decoration: none; font-size: 19px; font-weight: 600; opacity: .9; }
.dk-qr { display: flex; flex-direction: column; align-items: center; gap: 6px; padding: 30px 30px 26px; border-radius: 28px; background: #fff; color: var(--dk-text); text-align: center; box-shadow: 0 30px 80px rgba(0,0,0,.45); }
.dk-qr img, .dk-qr__ph { display: block; width: 100%; aspect-ratio: 1; margin-bottom: 12px; }
.dk-qr__ph { border-radius: 12px; background: var(--dk-bg-soft); }
.dk-qr strong { font-size: 22px; }
.dk-qr span { font-size: 15px; color: var(--dk-muted); }

/* =============================================================
   手機閱讀模式（直式／窄螢幕）：投影片改為上下捲動
   ============================================================= */
.dk.is-flow { position: relative; inset: auto; overflow: visible; background: #fff; }
.is-flow .dk-top {
  position: sticky; top: 0; right: auto; z-index: 5;
  justify-content: space-between; height: 56px; padding: 0 16px;
  background: rgba(255,255,255,.92); backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px);
  box-shadow: 0 1px 0 var(--dk-border);
}
.is-flow .dk-top .dk-btn { height: 38px; padding: 0 16px; font-size: 14px; }
.is-flow .dk-viewport { position: static; overflow: visible; }
.is-flow .dk-stage { position: static; width: auto; height: auto; transform: none; }
.is-flow .dk-slide { position: relative; inset: auto; padding: 48px 20px 56px; opacity: 1; visibility: visible; transform: none; transition: none; }
.is-flow .dk-foot { display: none; }
.is-flow .dk-in { transition-delay: calc(var(--d, 0) * 50ms); }
.is-flow .dk-eyebrow { padding: 6px 12px; font-size: 13px; }
.is-flow .dk-h2 { margin-top: 12px; font-size: 28px; }
.is-flow .dk-br-flow { display: inline; }
.is-flow .dk-btn--lg { height: 50px; padding: 0 22px; font-size: 16px; }

.is-flow .dk-slide--cover { padding: 0; }
.is-flow .dk-cover { display: flex; flex-direction: column; justify-content: center; min-height: calc(100svh - 56px); padding: 48px 20px; }
.is-flow .dk-cover__shade { background: linear-gradient(180deg, rgba(5,8,18,.82) 0%, rgba(5,8,18,.7) 100%); }
.is-flow .dk-cover__brand { font-size: 16px; }
.is-flow .dk-cover__brand img { height: 32px; }
.is-flow .dk-cover__title { margin: 24px 0 16px; font-size: 38px; }
.is-flow .dk-cover__sub { font-size: 16px; }
.is-flow .dk-cover__modules { margin-top: 20px; gap: 8px; }
.is-flow .dk-cover__modules li { padding: 6px 12px; font-size: 13px; }
.is-flow .dk-cover__cta { flex-wrap: wrap; margin-top: 28px; }
.is-flow .dk-cover__visual { display: none; }

.is-flow .dk-about { display: flex; flex-direction: column; align-items: stretch; gap: 28px; }
.is-flow .dk-story { margin-top: 24px; gap: 18px; }
.is-flow .dk-story li { grid-template-columns: 52px minmax(0, 1fr); column-gap: 14px; }
.is-flow .dk-story li:not(:last-child)::after { left: 25px; top: 30px; bottom: -16px; }
.is-flow .dk-story__tag { width: 52px; padding: 4px 0; font-size: 12px; }
.is-flow .dk-story strong { font-size: 17px; }
.is-flow .dk-story li > span:last-child { font-size: 15px; }
.is-flow .dk-name { padding: 24px 24px 22px; border-radius: 22px; }
.is-flow .dk-name__mark { width: 160px; }
.is-flow .dk-name__label { font-size: 13px; }
.is-flow .dk-name__chars { margin: 12px 0 18px; }
.is-flow .dk-name__char b { font-size: 76px; }
.is-flow .dk-name__char small { font-size: 13px; }
.is-flow .dk-name__char span { font-size: 16px; }
.is-flow .dk-name__motto { padding-top: 16px; font-size: 16px; }

.is-flow .dk-stats { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; margin-top: 24px; }
.is-flow .dk-slide--numbers { justify-content: flex-start; }
.is-flow .dk-stat { gap: 4px; min-height: 0; padding: 18px 16px; border-radius: 18px; }
.is-flow .dk-stat__value { flex-wrap: wrap; gap: 2px 4px; margin-bottom: 0; padding-bottom: 6px; }
.is-flow .dk-stat__value b { font-size: 30px; }
.is-flow .dk-stat__value small { font-size: 13px; }
.is-flow .dk-stat strong { font-size: 15px; }
.is-flow .dk-stat > span { font-size: 13px; }
.is-flow .dk-stats__foot { flex-direction: column; align-items: flex-start; gap: 6px; margin-top: 20px; font-size: 14px; }
.is-flow .dk-stats__foot span::before { content: ''; display: inline-block; width: 6px; height: 6px; margin: 0 10px 0 0; border-radius: 50%; background: var(--dk-primary); vertical-align: middle; }

.is-flow .dk-pains,
.is-flow .dk-reasons { grid-template-columns: minmax(0, 1fr); gap: 12px; margin-top: 24px; }
.is-flow .dk-pain,
.is-flow .dk-reason { padding: 18px 20px; }
.is-flow .dk-pain__icon,
.is-flow .dk-reason__icon { width: 42px; height: 42px; border-radius: 12px; }
.is-flow .dk-pain h3,
.is-flow .dk-reason h3 { margin: 12px 0 4px; font-size: 19px; }
.is-flow .dk-pain p,
.is-flow .dk-reason p { font-size: 15px; }
.is-flow .dk-pains__answer { margin-top: 20px; font-size: 18px; }

.is-flow .dk-flowline { flex-direction: column; gap: 4px; margin-top: 24px; }
.is-flow .dk-flowline__arrow { rotate: 90deg; }
.is-flow .dk-stagecard { padding: 16px 18px; }
.is-flow .dk-stagecard__icon { display: none; }
.is-flow .dk-stagecard h3 { margin: 4px 0 10px; font-size: 19px; }
.is-flow .dk-stagecard ul { flex-direction: row; flex-wrap: wrap; gap: 6px; }
.is-flow .dk-stagecard li { padding: 5px 10px; font-size: 14px; }
.is-flow .dk-platform__base { flex-wrap: wrap; gap: 10px 16px; margin-top: 16px; padding: 16px 18px; font-size: 14px; }
.is-flow .dk-platform__base strong { width: 100%; font-size: 17px; }

.is-flow .dk-feature { display: flex; flex-direction: column; align-items: stretch; gap: 28px; }
.is-flow .dk-points { margin-top: 22px; gap: 14px; }
.is-flow .dk-points__icon { margin-top: 1px; }
.is-flow .dk-points strong { font-size: 17px; }
.is-flow .dk-points span { font-size: 15px; }
.is-flow .dk-feature__visual { display: flex; justify-content: center; }
.is-flow .dk-visual { zoom: var(--vz); }

.is-flow .dk-plans { grid-template-columns: minmax(0, 1fr); gap: 12px; margin-top: 24px; }
.is-flow .dk-plan { padding: 18px; }
.is-flow .dk-plan__head { flex-direction: row; align-items: center; }
.is-flow .dk-plan__head h3 { font-size: 18px; }
.is-flow .dk-plans__foot { font-size: 13px; }

.is-flow .dk-trial { display: flex; flex-direction: column; align-items: stretch; gap: 32px; }
.is-flow .dk-trial__lead { font-size: 16px; }
.is-flow .dk-steps { grid-template-columns: minmax(0, 1fr); gap: 10px; margin-top: 24px; }
.is-flow .dk-steps li { padding: 16px 18px; }
.is-flow .dk-steps strong { font-size: 18px; }
.is-flow .dk-steps li > span:last-child { font-size: 14px; }
.is-flow .dk-trial__contact { margin-top: 24px; }
.is-flow .dk-trial__tel { margin-left: 0; font-size: 17px; }
.is-flow .dk-qr { width: min(300px, 100%); align-self: center; padding: 22px; }
.is-flow .dk-qr strong { font-size: 18px; }

/* =============================================================
   減少動態 / 列印（每頁一張 16:9，可另存 PDF）
   ============================================================= */
@media (prefers-reduced-motion: reduce) {
  .dk-slide { transform: none !important; transition: opacity .2s ease, visibility 0s linear .2s; }
  .dk-slide.is-current { transition: opacity .2s ease; }
  .dk-in { transform: none !important; transition: opacity .2s ease !important; }
}

@media print {
  @page { size: 1600px 900px; margin: 0; }
  .dk { position: static; overflow: visible; background: #fff; }
  .dk-top, .dk-controls, .dk-progress, .dk-overview { display: none !important; }
  .dk-viewport { position: static; overflow: visible; }
  .dk-stage { position: static; width: 1600px; height: auto; transform: none !important; }
  .dk-slide {
    position: relative; inset: auto; width: 1600px; height: 899.5px; /* px 換算 pt 有小數誤差，滿 900px 會多一張空白頁 */
    opacity: 1; visibility: visible; transform: none; transition: none;
    break-after: page; -webkit-print-color-adjust: exact; print-color-adjust: exact;
  }
  .dk-slide:last-child { break-after: auto; }
  .dk-in { opacity: 1 !important; transform: none !important; transition: none !important; }
}
</style>
