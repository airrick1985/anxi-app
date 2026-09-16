<template>
  <v-container fluid class="prospect-manager pm">
    <!-- 標題列：左側留白避開全站浮動漢堡鈕（fixed 10px + 40px） -->
    <header class="pm-head">
      <h1 class="pm-title">客戶開發</h1>
      <button type="button" class="pm-due" :class="{ 'is-on': f.dueToday, 'has-due': dueCount > 0 }" title="只看今日待追蹤" @click="toggleDueFilter">
        <v-icon size="15">mdi-calendar-alert</v-icon>今日待追蹤<b>{{ dueCount }}</b>
      </button>
      <div class="pm-spacer" />
      <button type="button" class="mac-btn" @click="harvestOpen = true">
        <v-progress-circular v-if="harvestActive" indeterminate size="14" width="2" color="primary" />
        <v-icon v-else size="16">mdi-web</v-icon>網路蒐集
      </button>
      <button type="button" class="mac-btn" @click="importOpen = true"><v-icon size="16">mdi-file-excel</v-icon>匯入</button>
      <button type="button" class="mac-btn" :disabled="!filtered.length" @click="exportExcel"><v-icon size="16">mdi-download</v-icon>匯出</button>
      <v-menu>
        <template #activator="{ props: p }"><button type="button" class="mac-btn mac-btn--icon" v-bind="p" title="更多"><v-icon size="18">mdi-dots-horizontal</v-icon></button></template>
        <v-list density="compact" class="pm-menu">
          <v-list-item prepend-icon="mdi-tag-multiple" title="標籤管理" @click="tagManagerOpen = true" />
          <v-list-item prepend-icon="mdi-cog" title="設定" @click="openSettings" />
        </v-list>
      </v-menu>
      <button type="button" class="mac-btn mac-btn--primary" @click="startCreate"><v-icon size="16">mdi-plus</v-icon>新增</button>
    </header>

    <!-- 網路蒐集狀態列 -->
    <v-alert
      v-if="harvestBanner"
      :type="harvestBanner.type"
      variant="tonal"
      density="compact"
      class="mb-3"
      :closable="!harvestActive"
      @click:close="harvestDismissedId = harvestBanner.job.id"
    >
      <div class="d-flex align-center flex-wrap ga-2">
        <v-progress-circular v-if="harvestActive" indeterminate size="18" width="2" />
        <span>{{ harvestBanner.text }}</span>
        <v-spacer />
        <v-btn v-if="harvestActive" size="x-small" variant="text" :disabled="harvestBanner.job.cancelRequested" @click="cancelHarvest(harvestBanner.job)">
          {{ harvestBanner.job.cancelRequested ? '取消中…' : '取消' }}
        </v-btn>
      </div>
    </v-alert>

    <!-- 分頁：macOS 分段控制 -->
    <div class="mac-seg mb-3" role="tablist">
      <button v-for="t in tabItems" :key="t.value" type="button" class="mac-seg__btn" :class="{ 'is-active': tab === t.value }" role="tab" :aria-selected="tab === t.value" @click="tab = t.value">{{ t.title }}</button>
    </div>

    <v-window v-model="tab">
      <!-- ============================================================ 名單 -->
      <v-window-item value="list">
        <div class="pm-split" :class="{ 'has-inspector': inspectorOpen }">
          <!-- 左：列表（沒選取時滿版） -->
          <section class="pm-list">
            <!-- 單行工具列 -->
            <div class="pm-toolbar">
              <label class="pm-search">
                <v-icon size="16">mdi-magnify</v-icon>
                <input v-model="search" type="search" placeholder="搜尋名稱、建商、地址、聯絡人、Email" />
                <button v-if="search" type="button" class="pm-search__clear" title="清除" @click="search = ''"><v-icon size="15">mdi-close-circle</v-icon></button>
              </label>

              <v-menu v-model="filterMenu" :close-on-content-click="false" location="bottom start" :offset="6">
                <template #activator="{ props: p }">
                  <button type="button" class="mac-btn" :class="{ 'is-open': filterMenu, 'pm-btn--active': activeFilterCount }" v-bind="p">
                    <v-icon size="16">mdi-tune-variant</v-icon>篩選<span v-if="activeFilterCount" class="pm-badge">{{ activeFilterCount }}</span>
                  </button>
                </template>
                <div class="pm-popover">
                  <v-row dense>
                    <v-col cols="6"><v-select v-model="f.categories" :items="categoryOptions" item-title="title" item-value="value" label="類別" density="compact" variant="outlined" hide-details multiple chips closable-chips clearable /></v-col>
                    <v-col cols="6"><v-select v-model="f.statuses" :items="statusOptions" item-title="title" item-value="value" label="狀態" density="compact" variant="outlined" hide-details multiple chips closable-chips clearable /></v-col>
                    <v-col cols="6"><v-select v-model="f.cities" :items="cityItems" label="縣市" density="compact" variant="outlined" hide-details multiple chips closable-chips clearable /></v-col>
                    <v-col cols="6"><v-select v-model="f.districts" :items="districtItems" item-title="title" item-value="value" label="區" density="compact" variant="outlined" hide-details multiple chips closable-chips clearable :disabled="!f.cities.length" /></v-col>
                    <v-col cols="6"><v-select v-model="f.tags" :items="tagDefs" item-title="name" item-value="name" label="標籤" density="compact" variant="outlined" hide-details multiple chips closable-chips clearable /></v-col>
                    <v-col cols="6"><v-select v-model="f.owner" :items="ownerFilterItems" label="負責人" density="compact" variant="outlined" hide-details clearable /></v-col>
                    <v-col cols="6"><v-select v-model="f.notEmailedDays" :items="notEmailedItems" label="未寄信" density="compact" variant="outlined" hide-details clearable /></v-col>
                    <v-col cols="6" class="d-flex align-center">
                      <v-checkbox v-model="f.hasEmail" label="有 Email" density="compact" hide-details class="mr-2" />
                      <v-checkbox v-model="f.hasFb" label="有 FB" density="compact" hide-details />
                    </v-col>
                  </v-row>
                  <div class="pm-popover__foot">
                    <button type="button" class="mac-btn" :disabled="!activeFilterCount" @click="resetFilters">清除</button>
                    <div class="pm-spacer" />
                    <button type="button" class="mac-btn mac-btn--primary" @click="filterMenu = false">完成</button>
                  </div>
                </div>
              </v-menu>

              <v-menu location="bottom start" :offset="6">
                <template #activator="{ props: p }">
                  <button type="button" class="mac-btn" v-bind="p"><v-icon size="16">mdi-swap-vertical</v-icon>{{ sortLabel }}<v-icon size="14" class="mac-btn-chevron">mdi-chevron-down</v-icon></button>
                </template>
                <v-list density="compact" class="pm-menu">
                  <v-list-item v-for="s in sortOptions" :key="s.value" :title="s.title" :active="sortBy === s.value" @click="sortBy = s.value" />
                </v-list>
              </v-menu>

              <div class="pm-quick">
                <button v-for="q in quickFilters" :key="q.key" type="button" class="pm-chip" :class="[`pm-chip--${q.tone}`, { 'is-on': f[q.key] }]" @click="f[q.key] = !f[q.key]">{{ q.label }}</button>
              </div>

              <div class="pm-spacer" />
              <span class="pm-count" :title="`全部 ${prospects.length} 筆`">{{ filtered.length }}<span v-if="filtered.length !== prospects.length" class="pm-count__total"> / {{ prospects.length }}</span></span>
              <button type="button" class="mac-btn mac-btn--icon" title="重新整理" :disabled="store.loading" @click="reload"><v-icon size="16" :class="{ 'pm-spin': store.loading }">mdi-refresh</v-icon></button>
              <button type="button" class="mac-btn mac-btn--primary" :disabled="!filtered.length" @click="openComposerFor(filtered)"><v-icon size="16">mdi-email-multiple</v-icon>群發</button>
            </div>

            <!-- 已套用的篩選 -->
            <div v-if="activeFilterChips.length" class="pm-active">
              <v-chip v-for="c in activeFilterChips" :key="c.key" size="small" variant="tonal" closable class="pm-active__chip" @click:close="c.clear()">{{ c.label }}</v-chip>
              <button type="button" class="pm-link" @click="resetFilters">全部清除</button>
            </div>

            <!-- 批次列 -->
            <div v-if="selectedIds.length" class="pm-bulk">
              <span class="pm-bulk__count">已選 {{ selectedIds.length }} 筆</span>
              <button type="button" class="mac-btn mac-btn--primary" @click="openComposerFor(selectedList)"><v-icon size="16">mdi-email</v-icon>寄信</button>
              <v-menu>
                <template #activator="{ props: p }"><button type="button" class="mac-btn" v-bind="p" :disabled="bulkLoading"><v-icon size="16">mdi-flag</v-icon>狀態<v-icon size="14" class="mac-btn-chevron">mdi-chevron-down</v-icon></button></template>
                <v-list density="compact" class="pm-menu"><v-list-item v-for="s in statusOptions" :key="s.value" :title="s.title" @click="bulkStatus(s.value)" /></v-list>
              </v-menu>
              <v-menu>
                <template #activator="{ props: p }"><button type="button" class="mac-btn" v-bind="p" :disabled="bulkLoading"><v-icon size="16">mdi-tag</v-icon>標籤<v-icon size="14" class="mac-btn-chevron">mdi-chevron-down</v-icon></button></template>
                <v-list density="compact" class="pm-menu">
                  <v-list-subheader>加上</v-list-subheader>
                  <v-list-item v-for="t in tagDefs" :key="`add_${t.id}`" @click="bulkTag('add', t.name)">
                    <template #prepend><v-chip :color="t.color" size="x-small" variant="flat" class="mr-2">&nbsp;</v-chip></template>
                    <v-list-item-title>{{ t.name }}</v-list-item-title>
                  </v-list-item>
                  <v-divider />
                  <v-list-subheader>移除</v-list-subheader>
                  <v-list-item v-for="t in tagDefs" :key="`rm_${t.id}`" @click="bulkTag('remove', t.name)">
                    <template #prepend><v-icon size="small" class="mr-2">mdi-tag-minus</v-icon></template>
                    <v-list-item-title>{{ t.name }}</v-list-item-title>
                  </v-list-item>
                </v-list>
              </v-menu>
              <v-menu>
                <template #activator="{ props: p }"><button type="button" class="mac-btn" v-bind="p" :disabled="bulkLoading"><v-icon size="16">mdi-calendar-clock</v-icon>追蹤日<v-icon size="14" class="mac-btn-chevron">mdi-chevron-down</v-icon></button></template>
                <v-list density="compact" class="pm-menu">
                  <v-list-item v-for="d in [1, 3, 7, 14, 30]" :key="d" :title="`+${d} 天`" @click="bulkFollowUp(d)" />
                  <v-divider />
                  <v-list-item title="清除" @click="bulkFollowUp(null)" />
                </v-list>
              </v-menu>
              <v-menu>
                <template #activator="{ props: p }"><button type="button" class="mac-btn" v-bind="p" :disabled="bulkLoading"><v-icon size="16">mdi-account-check</v-icon>負責人<v-icon size="14" class="mac-btn-chevron">mdi-chevron-down</v-icon></button></template>
                <v-list density="compact" class="pm-menu">
                  <v-list-item v-for="a in admins" :key="a.key" :title="a.name" @click="bulkOwner(a)" />
                  <v-divider />
                  <v-list-item title="清除" @click="bulkOwner(null)" />
                </v-list>
              </v-menu>
              <button type="button" class="mac-btn mac-btn--danger" @click="bulkDeleteDialog = true"><v-icon size="16">mdi-delete</v-icon>刪除</button>
              <div class="pm-spacer" />
              <button type="button" class="pm-link" @click="selectedIds = []">取消選取</button>
            </div>

            <v-data-table
              v-model="selectedIds"
              v-model:sort-by="tableSort"
              :headers="headers"
              :items="filtered"
              :custom-key-sort="keySort"
              item-value="id"
              show-select
              density="compact"
              :loading="store.loading"
              :items-per-page="50"
              :items-per-page-options="[25, 50, 100, -1]"
              hover
              fixed-header
              class="pm-table"
              :row-props="rowProps"
              @click:row="onRowClick"
            >
              <template #item.name="{ item }">
                <div class="d-flex align-center ga-1">
                  <v-icon size="x-small" :color="catMeta(item.category).color" :title="catMeta(item.category).title">{{ catMeta(item.category).icon }}</v-icon>
                  <span class="font-weight-medium">{{ item.name }}</span>
                  <v-icon v-if="(item.priority || 0) >= 1" size="x-small" color="amber">mdi-star</v-icon>
                  <v-icon v-if="(item.priority || 0) >= 2" size="x-small" color="amber">mdi-star</v-icon>
                </div>
                <div v-if="item.category === 'project' && (item.companyName || item.builder)" class="text-caption text-grey">{{ item.companyName || item.builder }}</div>
              </template>
              <template #item._city="{ item }"><span class="text-no-wrap">{{ item._city || '—' }}</span></template>
              <template #item._district="{ item }"><span class="text-no-wrap">{{ item._district || '—' }}</span></template>
              <template #item.status="{ item }">
                <v-chip size="x-small" :color="statusMeta(item.status).color" variant="flat">{{ statusMeta(item.status).title }}</v-chip>
              </template>
              <template #item.tags="{ item }">
                <v-chip v-for="t in (item.tags || [])" :key="t" size="x-small" :color="tagColor(t)" variant="flat" class="mr-1">{{ t }}</v-chip>
              </template>
              <template #item._contactCount="{ item }">
                <span :class="item._emailCount ? 'text-success' : 'text-grey'">
                  <v-icon size="x-small">{{ item._emailCount ? 'mdi-email-check' : 'mdi-email-off' }}</v-icon>
                  {{ item._contactCount }}
                </span>
                <v-chip v-if="item._emailDup" size="x-small" color="orange" variant="tonal" class="ml-1" :title="`此 Email 也在其他 ${item._emailDup} 筆名單`">同 +{{ item._emailDup }}</v-chip>
              </template>
              <template #item.lastEmailAt="{ item }">
                <span class="text-no-wrap">{{ fmt(item.lastEmailAt, 'MM/dd') }}</span>
                <v-icon v-if="item.lastOpenedAt" size="x-small" color="cyan" class="ml-1" :title="`開信 ${fmt(item.lastOpenedAt)}`">mdi-email-open</v-icon>
                <v-icon v-if="item.lastClickedAt" size="x-small" color="deep-purple" class="ml-1" :title="`點擊 ${fmt(item.lastClickedAt)}`">mdi-cursor-default-click</v-icon>
              </template>
              <template #item.followUpAt="{ item }">
                <span :class="isDueForFollowUp(item) ? 'text-error font-weight-bold' : ''" class="text-no-wrap">{{ fmt(item.followUpAt, 'MM/dd') }}</span>
              </template>
              <template #item.ownerName="{ item }">{{ item.ownerName || '—' }}</template>
              <template #no-data><div class="text-grey py-6">沒有符合條件的資料</div></template>
            </v-data-table>
          </section>

          <!-- 右：檢視器（點列後滑出；↑↓ 切換、Esc 關閉） -->
          <transition name="pm-inspector">
            <aside v-if="inspectorOpen" class="pm-inspector">
              <ProspectDetailPanel
                :prospect="selected"
                :tag-defs="tagDefs"
                :admins="admins"
                :all-prospects="prospects"
                :nav="inspectorNav"
                show-close
                @updated="onPatched"
                @deleted="onDeleted"
                @send-email="onSendFromDetail"
                @open-tag-manager="tagManagerOpen = true"
                @navigate="selectById"
                @open-campaign="openCampaign"
                @prev="stepSelection(-1)"
                @next="stepSelection(1)"
                @close="selectById(null)"
              />
            </aside>
          </transition>
        </div>
      </v-window-item>

      <!-- ============================================================ 寄信紀錄 -->
      <v-window-item value="campaigns">
        <v-card>
          <v-card-title class="d-flex align-center">
            寄信紀錄
            <v-spacer />
            <v-btn size="small" variant="text" prepend-icon="mdi-refresh" :loading="loadingCampaigns" @click="loadCampaigns">重新整理</v-btn>
          </v-card-title>
          <v-card-text>
            <div v-if="!campaigns.length && !loadingCampaigns" class="text-grey text-center py-8">尚無寄信紀錄</div>
            <v-expansion-panels v-else v-model="openCampaignId" variant="accordion">
              <v-expansion-panel v-for="c in campaigns" :key="c.id" :value="c.id">
                <v-expansion-panel-title>
                  <div class="d-flex align-center flex-wrap ga-2 w-100">
                    <v-chip size="x-small" :color="c.status === 'done' ? 'success' : 'info'" variant="flat">{{ c.status === 'done' ? '完成' : '寄送中' }}</v-chip>
                    <span class="font-weight-medium">{{ c.subject }}</span>
                    <v-spacer />
                    <span class="text-caption text-grey">
                      收件 {{ c.total || (c.recipients || []).length }}｜成功 {{ c.sent || 0 }}｜失敗 {{ c.failed || 0 }}｜開信 {{ c.opened || 0 }}｜點擊 {{ c.clicked || 0 }}
                      ｜{{ fmt(c.createdAt) }}｜{{ c.createdByName || c.createdBy || '—' }}
                    </span>
                  </div>
                </v-expansion-panel-title>
                <v-expansion-panel-text>
                  <div class="d-flex align-center flex-wrap ga-2 mb-2">
                    <span class="text-caption text-grey">附件 {{ (c.attachments || []).length }} 個　Reply-To {{ c.replyTo || '—' }}　追蹤 {{ c.tracking ? '開' : '關' }}　完成 {{ fmt(c.finishedAt) }}</span>
                    <v-spacer />
                    <v-btn size="small" color="warning" variant="tonal" prepend-icon="mdi-email-sync" :disabled="!(c.recipients || []).some((r) => r.status === 'failed')" @click="resendFailed(c)">重寄失敗者</v-btn>
                  </div>
                  <v-table v-if="(c.links || []).length" density="compact" class="mb-3">
                    <thead><tr><th>連結</th><th class="text-right">點擊次數</th></tr></thead>
                    <tbody>
                      <tr v-for="(l, li) in c.links" :key="li">
                        <td><a :href="l.url" target="_blank" rel="noopener" class="text-primary">{{ l.label || l.url }}</a><span class="text-caption text-grey ml-2">{{ l.label ? l.url : '' }}</span></td>
                        <td class="text-right">{{ (c.linkClicks || {})[String(li)] || 0 }}</td>
                      </tr>
                    </tbody>
                  </v-table>
                  <v-table density="compact">
                    <thead><tr><th>對象</th><th>聯絡人</th><th>Email</th><th>狀態</th><th>時間</th><th>開信</th><th>點擊</th><th>錯誤</th></tr></thead>
                    <tbody>
                      <tr v-for="(r, i) in (c.recipients || [])" :key="i">
                        <td><a v-if="r.leadId && byId[r.leadId]" href="#" class="text-primary" @click.prevent="jumpTo(r.leadId)">{{ r.company || byId[r.leadId].name }}</a><span v-else>{{ r.company || '—' }}</span></td>
                        <td>{{ r.name || '—' }}</td>
                        <td>{{ r.email }}</td>
                        <td><v-chip size="x-small" variant="flat" :color="recipientStatusColor(r.status)">{{ recipientStatusLabel(r.status) }}</v-chip></td>
                        <td class="text-no-wrap">{{ fmt(r.sentAt) }}</td>
                        <td class="text-caption text-no-wrap">
                          <template v-if="r.openedAt"><v-icon size="x-small" color="cyan">mdi-email-open</v-icon> {{ fmt(r.openedAt) }}（{{ r.openCount || 1 }}）</template>
                          <span v-else class="text-grey">—</span>
                        </td>
                        <td class="text-caption text-no-wrap">
                          <template v-if="r.clickedAt"><v-icon size="x-small" color="deep-purple">mdi-cursor-default-click</v-icon> {{ fmt(r.clickedAt) }}（{{ r.clickCount || 1 }}）</template>
                          <span v-else class="text-grey">—</span>
                        </td>
                        <td class="text-error text-caption">{{ r.error || '' }}</td>
                      </tr>
                    </tbody>
                  </v-table>
                </v-expansion-panel-text>
              </v-expansion-panel>
            </v-expansion-panels>
          </v-card-text>
        </v-card>
      </v-window-item>

      <!-- ============================================================ 範本 -->
      <v-window-item value="templates">
        <v-card>
          <v-card-title class="d-flex align-center">
            Email 範本（客戶開發）
            <v-spacer />
            <v-btn size="small" variant="text" prepend-icon="mdi-refresh" :loading="loadingTemplates" @click="loadTemplates">重新整理</v-btn>
            <v-btn size="small" color="primary" variant="flat" prepend-icon="mdi-plus" class="ml-2" @click="openTemplateEditor(null)">新增範本</v-btn>
          </v-card-title>
          <v-card-text>
            <div v-if="!templates.length && !loadingTemplates" class="text-grey text-center py-8">尚無範本</div>
            <v-row v-else>
              <v-col v-for="t in templates" :key="t.id" cols="12" md="6" lg="4">
                <v-card variant="outlined" class="h-100 d-flex flex-column">
                  <v-card-title class="text-subtitle-1">{{ t.name }} <v-chip v-if="t.scope === 'all'" size="x-small" variant="tonal" class="ml-1">共用</v-chip></v-card-title>
                  <v-card-subtitle>主旨：{{ t.subject }}</v-card-subtitle>
                  <v-card-text class="flex-grow-1">
                    <div class="template-preview text-body-2 text-grey">{{ plainText(t.html) }}</div>
                    <div class="text-caption text-grey mt-2">附件 {{ (t.attachments || []).length }} 個　更新 {{ fmt(t.updatedAt) }} {{ t.updatedBy ? `by ${t.updatedBy}` : '' }}</div>
                  </v-card-text>
                  <v-card-actions>
                    <v-btn size="small" variant="text" prepend-icon="mdi-pencil" @click="openTemplateEditor(t)">編輯</v-btn>
                    <v-btn size="small" variant="text" color="error" prepend-icon="mdi-delete" @click="askDeleteTemplate(t)">刪除</v-btn>
                    <v-spacer />
                    <v-btn size="small" color="primary" variant="tonal" prepend-icon="mdi-send" @click="openComposerFor(selectedList.length ? selectedList : filtered, t)">套用並寄信</v-btn>
                  </v-card-actions>
                </v-card>
              </v-col>
            </v-row>
          </v-card-text>
        </v-card>
      </v-window-item>
    </v-window>

    <!-- 手機詳情 -->
    <v-dialog v-model="mobileDetailOpen" fullscreen transition="dialog-bottom-transition">
      <v-card class="pm-mobile-sheet">
        <ProspectDetailPanel
          v-if="selected"
          :prospect="selected"
          :tag-defs="tagDefs"
          :admins="admins"
          :all-prospects="prospects"
          :nav="inspectorNav"
          show-close
          @updated="onPatched"
          @deleted="onDeleted"
          @send-email="onSendFromDetail"
          @open-tag-manager="tagManagerOpen = true"
          @navigate="selectById"
          @open-campaign="openCampaign"
          @prev="stepSelection(-1)"
          @next="stepSelection(1)"
          @close="mobileDetailOpen = false"
        />
      </v-card>
    </v-dialog>

    <!-- 新增 -->
    <v-dialog v-model="createOpen" max-width="520">
      <v-card>
        <v-card-title>新增開發對象</v-card-title>
        <v-divider />
        <v-card-text>
          <v-select v-model="createForm.category" :items="categoryOptions" item-title="title" item-value="value" label="類別" variant="outlined" density="comfortable" class="mb-2" />
          <v-text-field v-model="createForm.name" label="名稱（建案／公司）" variant="outlined" density="comfortable" autofocus @keyup.enter="confirmCreate" />
          <v-text-field v-model="createForm.email" label="Email（選填，建立為第一位聯絡人）" variant="outlined" density="comfortable" />
          <v-alert v-if="createDuplicate" type="warning" variant="tonal" density="compact">已有同類別同名資料：{{ createDuplicate.name }}</v-alert>
        </v-card-text>
        <v-divider />
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="createOpen = false">取消</v-btn>
          <v-btn color="primary" variant="flat" :disabled="!createForm.name.trim() || !!createDuplicate" :loading="creating" @click="confirmCreate">建立</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- 批次刪除 -->
    <v-dialog v-model="bulkDeleteDialog" max-width="420">
      <v-card>
        <v-card-title class="text-error">刪除 {{ selectedIds.length }} 筆</v-card-title>
        <v-card-text>將刪除所選開發對象及其聯絡人、活動與寄信紀錄，無法復原。</v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="bulkDeleteDialog = false">取消</v-btn>
          <v-btn color="error" variant="flat" :loading="bulkLoading" @click="bulkDelete">確定刪除</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- 設定 -->
    <v-dialog v-model="settingsOpen" max-width="480">
      <v-card>
        <v-card-title>客戶開發設定</v-card-title>
        <v-divider />
        <v-card-text>
          <v-text-field v-model.number="settingsForm.followUpDaysAfterEmail" type="number" min="1" max="60" label="寄信後自動排追蹤日（天）" variant="outlined" density="comfortable" class="mb-2" />
          <v-text-field v-model="settingsForm.defaultReplyTo" label="預設 Reply-To（空＝操作者 Email）" variant="outlined" density="comfortable" class="mb-2" />
          <v-switch v-model="settingsForm.trackingEnabled" label="預設嵌入開信追蹤像素" color="primary" density="compact" hide-details class="mb-2" />
          <v-text-field v-model.number="settingsForm.emailCooldownDays" type="number" min="0" max="365" label="同 Email 冷卻期（天，0＝關閉）" variant="outlined" density="comfortable" hide-details />
          <v-divider class="my-3" />
          <div class="d-flex align-center mb-2">
            <span class="text-subtitle-2">網路蒐集：Brave 搜尋 API</span>
            <v-chip size="x-small" class="ml-2" :color="hasSearchKey ? 'success' : 'grey'" variant="tonal">{{ hasSearchKey ? '已設定' : '未設定' }}</v-chip>
          </div>
          <v-text-field v-model="searchKeyForm.key" label="API 金鑰" type="password" variant="outlined" density="comfortable" hide-details autocomplete="off" />
        </v-card-text>
        <v-divider />
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="settingsOpen = false">取消</v-btn>
          <v-btn color="primary" variant="flat" :loading="savingSettings" @click="saveSettings">儲存</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- 範本編輯 -->
    <v-dialog v-model="templateEditorOpen" :fullscreen="!mdAndUp" max-width="900" scrollable persistent>
      <v-card>
        <v-card-title class="d-flex align-center">
          {{ templateForm.id ? '編輯範本' : '新增範本' }}
          <v-spacer />
          <v-btn icon="mdi-close" variant="text" size="small" @click="templateEditorOpen = false" />
        </v-card-title>
        <v-divider />
        <v-card-text>
          <v-text-field v-model="templateForm.name" label="範本名稱" variant="outlined" density="comfortable" />
          <v-text-field v-model="templateForm.subject" :label="subjectLabel" variant="outlined" density="comfortable" />
          <div class="d-flex align-center ga-1 mb-1 flex-wrap">
            <span class="text-caption text-grey">插入變數：</span>
            <v-btn v-for="v in variableTokens" :key="v" size="x-small" variant="tonal" @click="insertTemplateVariable(v)">{{ v }}</v-btn>
          </div>
          <TiptapEditor v-model="templateForm.html" />
          <div class="text-subtitle-2 mt-4 mb-1">附件（最多 5 個，單檔 ≤ 10MB，總計 ≤ 20MB）</div>
          <v-file-input v-model="templatePendingFiles" label="選擇檔案" multiple density="compact" variant="outlined" prepend-icon="mdi-paperclip" hide-details :loading="templateUploading" :disabled="templateUploading || templateForm.attachments.length >= 5" @update:model-value="onTemplateFilesPicked" />
          <v-list v-if="templateForm.attachments.length" density="compact">
            <v-list-item v-for="a in templateForm.attachments" :key="a.url">
              <template #prepend><v-icon size="small">mdi-file</v-icon></template>
              <v-list-item-title class="text-body-2">{{ a.name }}</v-list-item-title>
              <v-list-item-subtitle>{{ formatSize(a.size) }}</v-list-item-subtitle>
              <template #append><v-btn icon="mdi-close" size="x-small" variant="text" @click="templateForm.attachments = templateForm.attachments.filter((x) => x.url !== a.url)" /></template>
            </v-list-item>
          </v-list>
        </v-card-text>
        <v-divider />
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="templateEditorOpen = false">取消</v-btn>
          <v-btn color="primary" variant="flat" :disabled="!templateForm.name.trim() || !templateForm.subject.trim()" :loading="savingTemplate" @click="saveTemplate">儲存</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="deleteTemplateDialog" max-width="400">
      <v-card>
        <v-card-title>刪除範本</v-card-title>
        <v-card-text>確定要刪除範本「{{ deleteTemplateTarget?.name }}」嗎？</v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="deleteTemplateDialog = false">取消</v-btn>
          <v-btn color="error" :loading="deletingTemplate" @click="confirmDeleteTemplate">刪除</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Email 編輯器 -->
    <MarketingEmailComposer
      v-model="composerOpen"
      target="prospects"
      :recipients="composerRecipients"
      :preset="composerPreset"
      :reply-to="settings.defaultReplyTo"
      :tracking="settings.trackingEnabled"
      :cooldown-days="settings.emailCooldownDays"
      @sent="onComposerSent"
      @template-saved="loadTemplates"
    />

    <TrialLeadTagManager v-model="tagManagerOpen" :tags="tagDefs" :adapter="prospectTagAdapter" @changed="onTagsChanged" />
    <ProspectImportDialog v-model="importOpen" :existing="prospects" @imported="onImported" />
    <ProspectHarvestDialog v-model="harvestOpen" :jobs="harvestJobs" :has-search-key="hasSearchKey" />
  </v-container>
</template>

<script setup>
import { ref, computed, watch, onMounted, reactive } from 'vue';
import { useRoute } from 'vue-router';
import { useDisplay } from 'vuetify';
import { formatInTimeZone } from 'date-fns-tz';
import * as XLSX from 'xlsx';
import { useUserStore } from '@/store/user';
import { useUiStore } from '@/store/uiStore';
import { useProspectStore } from '@/store/prospectStore';
import { uploadMarketingAttachment, prospectHarvestAPI } from '@/api';
import TiptapEditor from '@/components/TiptapEditor.vue';
import MarketingEmailComposer from '@/components/marketing/MarketingEmailComposer.vue';
import TrialLeadTagManager from '@/components/marketing/TrialLeadTagManager.vue';
import ProspectDetailPanel from '@/components/prospecting/ProspectDetailPanel.vue';
import ProspectImportDialog from '@/components/prospecting/ProspectImportDialog.vue';
import ProspectHarvestDialog from '@/components/prospecting/ProspectHarvestDialog.vue';
import { fetchEmailTemplates, saveEmailTemplate, deleteEmailTemplate } from '@/services/trialLeadsService';
import {
  PROSPECT_CATEGORY_OPTIONS,
  PROSPECT_STATUS_OPTIONS,
  EXCLUDED_STATUSES,
  EXPORT_SHEET_NAMES,
  DEFAULT_PROSPECT_SETTINGS,
  prospectTagAdapter,
  fetchProspectTags,
  fetchSuperAdmins,
  fetchProspectSettings,
  saveProspectSettings,
  fetchProspectCampaigns,
  fetchEmailCampaign,
  scheduleFollowUpAfterEmail,
  createProspect,
  bulkUpdateProspects,
  bulkAddProspectTag,
  bulkRemoveProspectTag,
  bulkDeleteProspects,
  prospectToExportRow,
  emailContacts,
  isDueForFollowUp,
  daysFromNowTaipei,
  categoryMeta,
  statusMeta,
  parseProspectLocation,
  compareCity,
  districtsOfCity,
  nameKey,
  genId,
  makeEvent,
  toDate,
  buildEmailIndex,
  subscribeHarvestJobs,
  isHarvestActive,
  harvestProgressText,
  harvestResultText,
  HARVEST_STATUS_LABELS,
} from '@/services/prospectService';
import { onUnmounted } from 'vue';
import { arrayUnion } from 'firebase/firestore';

const route = useRoute();
const { mdAndUp } = useDisplay();
const userStore = useUserStore();
const uiStore = useUiStore();
const store = useProspectStore();

const tab = ref('list');
const tabItems = [
  { value: 'list', title: '名單' },
  { value: 'campaigns', title: '寄信紀錄' },
  { value: 'templates', title: 'Email 範本' },
];
const categoryOptions = PROSPECT_CATEGORY_OPTIONS;
const statusOptions = PROSPECT_STATUS_OPTIONS;
const catMeta = categoryMeta;
const variableTokens = ['{{建案}}', '{{建商}}', '{{聯絡人}}', '{{公司}}', '{{Email}}'];
const subjectLabel = '主旨（支援 {{建案}} {{建商}} {{聯絡人}} {{公司}} {{Email}} 變數）';

const fmt = (v, pattern = 'yyyy/MM/dd HH:mm') => {
  const d = toDate(v);
  return d ? formatInTimeZone(d, 'Asia/Taipei', pattern) : '—';
};
const plainText = (html) => String(html || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 160);
const formatSize = (bytes) => {
  const n = Number(bytes) || 0;
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / 1024 / 1024).toFixed(2)} MB`;
};
const operator = computed(() => ({ key: userStore.user?.key || '', name: userStore.user?.name || userStore.user?.key || '' }));

// ---------------------------------------------------------------
// 資料
// ---------------------------------------------------------------
const prospects = computed(() => store.prospects);
/** 附加前端推導欄位（縣市／區／聯絡人數），供表格顯示與表頭排序 */
const emailIndex = computed(() => buildEmailIndex(prospects.value));
const enriched = computed(() => prospects.value.map((p) => {
  const { city, district } = parseProspectLocation(p);
  let dup = 0; let lastSentByEmail = 0;
  emailContacts(p).forEach((c) => {
    const e = emailIndex.value.get(String(c.email).trim().toLowerCase());
    if (!e) return;
    dup = Math.max(dup, e.count - 1);
    lastSentByEmail = Math.max(lastSentByEmail, e.lastSentAt);
  });
  return { ...p, _city: city, _district: district, _contactCount: (p.contacts || []).length, _emailCount: emailContacts(p).length, _emailDup: dup, _lastSentByEmail: lastSentByEmail };
}));
const byId = computed(() => store.byId);
const dueCount = computed(() => store.dueTodayCount);
const admins = ref([]);
const tagDefs = ref([]);
const tagManagerOpen = ref(false);
const tagColor = (name) => tagDefs.value.find((t) => t.name === name)?.color || 'grey';
const settings = ref({ ...DEFAULT_PROSPECT_SETTINGS });

async function reload() {
  try {
    await store.load(true);
    selectedIds.value = selectedIds.value.filter((id) => byId.value[id]);
  } catch (e) {
    console.error(e);
    uiStore.showSnackbar(`讀取失敗：${e.message || e}`, 'error');
  }
}
async function loadTags() {
  try { tagDefs.value = await fetchProspectTags(); } catch (e) { console.error(e); }
}
function onTagsChanged({ tags, renamed, removed }) {
  tagDefs.value = tags;
  prospects.value.forEach((p) => {
    if (!Array.isArray(p.tags)) return;
    if (renamed && p.tags.includes(renamed.from)) p.tags = Array.from(new Set(p.tags.map((t) => (t === renamed.from ? renamed.to : t))));
    if (removed) p.tags = p.tags.filter((t) => t !== removed);
  });
}

// ---------------------------------------------------------------
// 篩選
// ---------------------------------------------------------------
const search = ref('');
const filterMenu = ref(false);
const f = reactive({
  categories: [], cities: [], districts: [], statuses: [], tags: [], owner: null, notEmailedDays: null,
  hasEmail: false, hasFb: false, hasLine: false, dueToday: false, openedNoReply: false, clicked: false,
});
function resetFilters() {
  Object.assign(f, { categories: [], cities: [], districts: [], statuses: [], tags: [], owner: null, notEmailedDays: null, hasEmail: false, hasFb: false, hasLine: false, dueToday: false, openedNoReply: false, clicked: false });
  search.value = '';
}
function toggleDueFilter() { f.dueToday = !f.dueToday; tab.value = 'list'; }
/** 工具列上的快捷切換（一鍵開關） */
const quickFilters = [
  { key: 'dueToday', label: '今日待追蹤', tone: 'red' },
  { key: 'openedNoReply', label: '已開信未回覆', tone: 'cyan' },
  { key: 'clicked', label: '已點擊', tone: 'purple' },
  { key: 'hasLine', label: '有 LINE', tone: 'green' },
];
/** 篩選彈出視窗內已套用的條件數（不含快捷切換與搜尋） */
const activeFilterCount = computed(() => [
  f.categories.length, f.cities.length, f.districts.length, f.statuses.length, f.tags.length,
  f.owner != null, f.notEmailedDays != null, f.hasEmail, f.hasFb,
].filter(Boolean).length);
/** 已套用篩選：以可關閉 chip 顯示在工具列下方 */
const activeFilterChips = computed(() => {
  const chips = [];
  const titleOf = (opts, v) => opts.find((o) => o.value === v)?.title || v;
  f.categories.forEach((v) => chips.push({ key: `cat_${v}`, label: titleOf(categoryOptions, v), clear: () => { f.categories = f.categories.filter((x) => x !== v); } }));
  f.statuses.forEach((v) => chips.push({ key: `st_${v}`, label: titleOf(statusOptions, v), clear: () => { f.statuses = f.statuses.filter((x) => x !== v); } }));
  f.cities.forEach((v) => chips.push({ key: `city_${v}`, label: v, clear: () => { f.cities = f.cities.filter((x) => x !== v); } }));
  f.districts.forEach((v) => chips.push({ key: `dist_${v}`, label: v.replace('/', ' '), clear: () => { f.districts = f.districts.filter((x) => x !== v); } }));
  f.tags.forEach((v) => chips.push({ key: `tag_${v}`, label: `#${v}`, clear: () => { f.tags = f.tags.filter((x) => x !== v); } }));
  if (f.owner != null) chips.push({ key: 'owner', label: `負責人：${titleOf(ownerFilterItems.value, f.owner)}`, clear: () => { f.owner = null; } });
  if (f.notEmailedDays != null) chips.push({ key: 'notEmailed', label: titleOf(notEmailedItems, f.notEmailedDays), clear: () => { f.notEmailedDays = null; } });
  if (f.hasEmail) chips.push({ key: 'hasEmail', label: '有 Email', clear: () => { f.hasEmail = false; } });
  if (f.hasFb) chips.push({ key: 'hasFb', label: '有 FB', clear: () => { f.hasFb = false; } });
  return chips;
});
/** 縣市變動時，移除不屬於已選縣市的區 */
watch(() => f.cities, (cities) => { f.districts = f.districts.filter((v) => cities.includes(v.split('/')[0])); });

/** 縣市選項：只列名單中出現的縣市（北→南） */
const cityItems = computed(() => Array.from(new Set(enriched.value.map((p) => p._city).filter(Boolean))).sort(compareCity));
/** 區選項：已選縣市下、名單中出現的區（value = 縣市/區；多縣市時標題附縣市以區分同名區） */
const districtItems = computed(() => {
  const cities = [...f.cities].sort(compareCity);
  const present = new Set(enriched.value.filter((p) => cities.includes(p._city) && p._district).map((p) => `${p._city}/${p._district}`));
  return cities.flatMap((city) => districtsOfCity(city)
    .map((d) => `${city}/${d}`)
    .filter((v) => present.has(v))
    .map((v) => ({ value: v, title: cities.length > 1 ? v.replace('/', ' ') : v.split('/')[1] })));
});
const ownerFilterItems = computed(() => [{ title: '未指派', value: '__none__' }, ...admins.value.map((a) => ({ title: a.name, value: a.key }))]);
const notEmailedItems = [
  { title: '7 天內未寄', value: 7 }, { title: '14 天內未寄', value: 14 }, { title: '30 天內未寄', value: 30 }, { title: '從未寄過', value: 0 },
];
// ---------------------------------------------------------------
// 排序：表頭點按與「排序」下拉共用 tableSort；空陣列 = 預設（追蹤日到期優先）
// ---------------------------------------------------------------
const SORT_PRESETS = {
  followup: [],
  updated: [{ key: 'updatedAt', order: 'desc' }],
  email: [{ key: 'lastEmailAt', order: 'desc' }],
  name: [{ key: 'name', order: 'asc' }],
  city: [{ key: '_city', order: 'asc' }, { key: '_district', order: 'asc' }],
  priority: [{ key: 'priority', order: 'desc' }],
};
const sortOptions = [
  { title: '追蹤日（到期優先）', value: 'followup' },
  { title: '最近更新', value: 'updated' },
  { title: '最後寄信', value: 'email' },
  { title: '名稱', value: 'name' },
  { title: '縣市／區', value: 'city' },
  { title: '優先度', value: 'priority' },
];
const tableSort = ref([]);
const sameSort = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const sortBy = computed({
  get: () => Object.keys(SORT_PRESETS).find((k) => sameSort(SORT_PRESETS[k], tableSort.value)) || null,
  set: (k) => { tableSort.value = SORT_PRESETS[k] ? [...SORT_PRESETS[k]] : []; },
});
/** 工具列「排序」按鈕文字：預設顯示「排序」，表頭自訂排序時顯示欄名 */
const sortLabel = computed(() => {
  const preset = sortOptions.find((o) => o.value === sortBy.value);
  if (preset) return preset.value === 'followup' ? '排序' : preset.title;
  const first = tableSort.value[0];
  const h = first ? headers.value.find((x) => x.key === first.key) : null;
  return h ? `${h.title} ${first.order === 'desc' ? '↓' : '↑'}` : '排序';
});
const ts = (v) => toDate(v)?.getTime() || 0;
const zh = (a, b) => String(a || '').localeCompare(String(b || ''), 'zh-Hant');
/** 表頭排序比較函式（key → (a, b)）；日期以時間戳比較，追蹤日空值排最後 */
const keySort = {
  name: zh,
  _city: compareCity,
  _district: zh,
  ownerName: zh,
  status: (a, b) => (statusMeta(a || 'new').order ?? 0) - (statusMeta(b || 'new').order ?? 0),
  lastEmailAt: (a, b) => ts(a) - ts(b),
  followUpAt: (a, b) => (ts(a) || Infinity) - (ts(b) || Infinity),
  updatedAt: (a, b) => ts(a) - ts(b),
  priority: (a, b) => (a || 0) - (b || 0),
  _contactCount: (a, b) => (a || 0) - (b || 0),
};

const filtered = computed(() => {
  const q = String(search.value || '').trim().toLowerCase();
  const now = Date.now();
  let list = enriched.value.filter((p) => {
    if (f.categories.length && !f.categories.includes(p.category)) return false;
    if (f.cities.length && !f.cities.includes(p._city)) return false;
    if (f.districts.length && !f.districts.includes(`${p._city}/${p._district}`)) return false;
    if (f.statuses.length && !f.statuses.includes(p.status || 'new')) return false;
    if (f.tags.length) { const tags = Array.isArray(p.tags) ? p.tags : []; if (!f.tags.some((t) => tags.includes(t))) return false; }
    if (f.owner === '__none__' && p.owner) return false;
    if (f.owner && f.owner !== '__none__' && p.owner !== f.owner) return false;
    if (f.hasEmail && !emailContacts(p).length) return false;
    if (f.hasFb && !p.facebook) return false;
    if (f.hasLine && !p.line && !(p.contacts || []).some((c) => c.line)) return false;
    if (f.dueToday && !isDueForFollowUp(p)) return false;
    if (f.openedNoReply && !(p.lastOpenedAt && !p.repliedAt)) return false;
    if (f.clicked && !p.lastClickedAt) return false;
    if (f.notEmailedDays != null) {
      // 以 Email 地址計算：同一 Email 在其他名單寄過也算寄過
      const last = Math.max(toDate(p.lastEmailAt)?.getTime() || 0, p._lastSentByEmail || 0) || null;
      if (f.notEmailedDays === 0) { if (last) return false; } else if (last && now - last < f.notEmailedDays * 86400000) return false;
    }
    if (q) {
      const hay = [p.name, p.builder, p.companyName, p.agency, p.region, p.receptionAddress, p.siteAddress, p.phone, p.note, p.memo,
        ...(p.contacts || []).flatMap((c) => [c.name, c.email, c.phone])].map((x) => String(x || '').toLowerCase()).join(' ');
      if (!hay.includes(q)) return false;
    }
    return true;
  });
  // 基礎順序：追蹤日到期優先 → 最近更新；表頭排序在此順序上進行（穩定排序，同值維持此順序）
  return [...list].sort((a, b) => (ts(a.followUpAt) || Infinity) - (ts(b.followUpAt) || Infinity) || ts(b.updatedAt) - ts(a.updatedAt));
});

const ALL_HEADERS = [
  { title: '名稱', key: 'name' },
  { title: '縣市', key: '_city' },
  { title: '區', key: '_district' },
  { title: '狀態', key: 'status' },
  { title: '標籤', key: 'tags', sortable: false, wide: true },
  { title: '聯絡人', key: '_contactCount', align: 'center' },
  { title: '最後寄信', key: 'lastEmailAt' },
  { title: '追蹤', key: 'followUpAt' },
  { title: '負責人', key: 'ownerName', wide: true },
];

// ---------------------------------------------------------------
// 選取 / 檢視器
// ---------------------------------------------------------------
const selectedIds = ref([]);
const selectedId = ref(null);
const mobileDetailOpen = ref(false);
const selected = computed(() => (selectedId.value ? byId.value[selectedId.value] || null : null));
const selectedList = computed(() => selectedIds.value.map((id) => byId.value[id]).filter(Boolean));
const inspectorOpen = computed(() => mdAndUp.value && !!selected.value);
/** 檢視器開啟時表格變窄：隱藏檢視器內已可見的欄（標籤／負責人） */
const headers = computed(() => (inspectorOpen.value ? ALL_HEADERS.filter((h) => !h.wide) : ALL_HEADERS));

/** 表格實際顯示順序（套用表頭排序），供 ↑↓／上一筆下一筆使用 */
const displayed = computed(() => {
  const sorts = tableSort.value;
  if (!sorts.length) return filtered.value;
  return [...filtered.value].sort((a, b) => {
    for (const { key, order } of sorts) {
      const cmp = (keySort[key] || zh)(a[key], b[key]);
      if (cmp) return order === 'desc' ? -cmp : cmp;
    }
    return 0;
  });
});
const inspectorNav = computed(() => {
  const idx = selectedId.value ? displayed.value.findIndex((p) => p.id === selectedId.value) : -1;
  return { index: idx, total: displayed.value.length, hasPrev: idx > 0, hasNext: idx >= 0 && idx < displayed.value.length - 1 };
});
function stepSelection(delta) {
  const { index } = inspectorNav.value;
  const next = displayed.value[index + delta];
  if (next) selectById(next.id);
}
/** 檢視器開啟時：↑↓ 切換上一筆／下一筆、Esc 關閉；輸入中或有浮層時不攔截 */
function onKeydown(e) {
  if (!inspectorOpen.value) return;
  const t = e.target;
  if (t && (t.closest?.('input, textarea, select, [contenteditable="true"]'))) return;
  if (document.querySelector('.v-overlay--active')) return;
  if (e.key === 'ArrowDown') { e.preventDefault(); stepSelection(1); }
  else if (e.key === 'ArrowUp') { e.preventDefault(); stepSelection(-1); }
  else if (e.key === 'Escape') selectById(null);
}
onMounted(() => window.addEventListener('keydown', onKeydown));
onUnmounted(() => window.removeEventListener('keydown', onKeydown));

function rowProps({ item }) { return { class: item.id === selectedId.value ? 'row-selected' : '' }; }
function onRowClick(_e, { item }) { selectById(item.id); }
function selectById(id) {
  selectedId.value = id || null;
  if (!mdAndUp.value && id) mobileDetailOpen.value = true;
}
function jumpTo(id) { tab.value = 'list'; selectById(id); }
function onPatched(patch) { store.patch(patch.id, patch); }
function onDeleted(id) { store.remove(id); if (selectedId.value === id) selectedId.value = null; mobileDetailOpen.value = false; }

// ---------------------------------------------------------------
// 新增
// ---------------------------------------------------------------
const createOpen = ref(false);
const creating = ref(false);
const createForm = ref({ category: 'project', name: '', email: '' });
const createDuplicate = computed(() => {
  const k = nameKey(createForm.value.name);
  if (!k) return null;
  return prospects.value.find((p) => p.category === createForm.value.category && (p.nameKey || nameKey(p.name)) === k) || null;
});
function startCreate() { createForm.value = { category: 'project', name: '', email: '' }; createOpen.value = true; }
async function confirmCreate() {
  if (!createForm.value.name.trim() || createDuplicate.value) return;
  creating.value = true;
  try {
    const email = createForm.value.email.trim();
    const contacts = email ? [{ id: genId('c_'), name: '', title: '', email, phone: '', line: '', note: '', isPrimary: true }] : [];
    const data = { category: createForm.value.category, name: createForm.value.name.trim(), contacts, tags: email ? ['有 Email'] : [] };
    const id = await createProspect(data, operator.value);
    store.upsert({ id, ...data, status: 'new', events: [], emailLogs: [], createdAt: new Date(), updatedAt: new Date() });
    createOpen.value = false;
    selectById(id);
    uiStore.showSnackbar('已建立', 'success');
  } catch (e) {
    console.error(e);
    uiStore.showSnackbar(`建立失敗：${e.message || e}`, 'error');
  } finally {
    creating.value = false;
  }
}

// ---------------------------------------------------------------
// 批次
// ---------------------------------------------------------------
const bulkLoading = ref(false);
const bulkDeleteDialog = ref(false);

async function runBulk(label, fn) {
  if (!selectedIds.value.length) return;
  bulkLoading.value = true;
  try {
    await fn();
    uiStore.showSnackbar(`${label}（${selectedIds.value.length} 筆）`, 'success');
  } catch (e) {
    console.error(e);
    uiStore.showSnackbar(`批次更新失敗：${e.message || e}`, 'error');
  } finally {
    bulkLoading.value = false;
  }
}
function bulkStatus(status) {
  return runBulk(`已設為「${statusMeta(status).title}」`, async () => {
    await bulkUpdateProspects(selectedIds.value, (p) => ({
      status,
      events: arrayUnion(makeEvent('status_changed', { by: operator.value.key, byName: operator.value.name, text: `${statusMeta(p.status).title} → ${statusMeta(status).title}（批次）`, meta: { from: p.status || 'new', to: status } })),
    }), byId.value, operator.value.key);
    selectedIds.value.forEach((id) => store.patch(id, { status }));
  });
}
function bulkTag(mode, tagName) {
  return runBulk(`已${mode === 'add' ? '加上' : '移除'}標籤「${tagName}」`, async () => {
    if (mode === 'add') await bulkAddProspectTag(selectedIds.value, tagName); else await bulkRemoveProspectTag(selectedIds.value, tagName);
    selectedIds.value.forEach((id) => {
      const p = byId.value[id]; if (!p) return;
      const tags = Array.isArray(p.tags) ? p.tags : [];
      store.patch(id, { tags: mode === 'add' ? Array.from(new Set([...tags, tagName])) : tags.filter((t) => t !== tagName) });
    });
  });
}
function bulkFollowUp(days) {
  const date = days == null ? null : daysFromNowTaipei(days);
  return runBulk(days == null ? '已清除追蹤日' : `追蹤日設為 +${days} 天`, async () => {
    await bulkUpdateProspects(selectedIds.value, () => ({
      followUpAt: date,
      events: arrayUnion(makeEvent('followup_set', { by: operator.value.key, byName: operator.value.name, text: date ? `追蹤日設為 ${fmt(date, 'yyyy-MM-dd')}（批次）` : '清除追蹤日（批次）', meta: { followUpAt: date ? date.toISOString() : null } })),
    }), byId.value, operator.value.key);
    selectedIds.value.forEach((id) => store.patch(id, { followUpAt: date }));
  });
}
function bulkOwner(admin) {
  return runBulk(admin ? `負責人設為 ${admin.name}` : '已清除負責人', async () => {
    await bulkUpdateProspects(selectedIds.value, () => ({ owner: admin?.key || null, ownerName: admin?.name || '' }), byId.value, operator.value.key);
    selectedIds.value.forEach((id) => store.patch(id, { owner: admin?.key || null, ownerName: admin?.name || '' }));
  });
}
async function bulkDelete() {
  await runBulk('已刪除', async () => {
    await bulkDeleteProspects(selectedIds.value);
    if (selectedIds.value.includes(selectedId.value)) selectedId.value = null;
    store.remove(selectedIds.value);
    selectedIds.value = [];
  });
  bulkDeleteDialog.value = false;
}

// ---------------------------------------------------------------
// Email
// ---------------------------------------------------------------
const composerOpen = ref(false);
const composerRecipients = ref([]);
const composerPreset = ref(null);

function buildVars(p, c) {
  const builderName = p.category === 'project' ? (p.companyName || p.builder || '') : (p.category === 'builder' ? p.name : '');
  return {
    建案: p.category === 'project' ? p.name : '',
    建商: builderName,
    聯絡人: c?.name || '',
    公司: p.category === 'project' ? (p.companyName || p.builder || p.name) : p.name,
  };
}
function toRecipients(p, contacts = null) {
  const excludedReason = EXCLUDED_STATUSES.includes(p.status) ? '不聯絡' : '';
  const list = contacts || emailContacts(p);
  if (!list.length) return [{ leadId: p.id, contactId: '', name: '', email: '', company: p.name, tags: p.tags || [], vars: buildVars(p, null) }];
  return list.map((c) => ({
    leadId: p.id, contactId: c.id, name: c.name || '', email: c.email, company: p.name, tags: p.tags || [], vars: buildVars(p, c), excludedReason,
    lastSentAt: emailIndex.value.get(String(c.email).trim().toLowerCase())?.lastSentAt || 0,
  }));
}
function openComposerFor(list, template = null) {
  composerRecipients.value = (list || []).flatMap((p) => toRecipients(p));
  composerPreset.value = template ? { subject: template.subject || '', html: template.html || '', attachments: template.attachments || [] } : null;
  composerOpen.value = true;
}
function onSendFromDetail({ prospect, contacts }) {
  composerRecipients.value = toRecipients(prospect, contacts);
  composerPreset.value = null;
  composerOpen.value = true;
}
async function onComposerSent(res) {
  await reload();
  loadCampaigns();
  if (res?.campaignId) {
    try {
      const c = await fetchEmailCampaign(res.campaignId);
      if (c) {
        const n = await scheduleFollowUpAfterEmail(c, byId.value, settings.value.followUpDaysAfterEmail, operator.value);
        if (n > 0) {
          uiStore.showSnackbar(`已為 ${n} 筆自動排定 ${settings.value.followUpDaysAfterEmail} 天後追蹤`, 'info');
          await reload();
        }
      }
    } catch (e) {
      console.warn('自動排追蹤日失敗', e);
    }
  }
}

// ---------------------------------------------------------------
// 寄信紀錄
// ---------------------------------------------------------------
const campaigns = ref([]);
const loadingCampaigns = ref(false);
const openCampaignId = ref(null);
const recipientStatusLabel = (s) => ({ pending: '等待中', sent: '成功', failed: '失敗' }[s] || s || '—');
const recipientStatusColor = (s) => ({ pending: 'grey', sent: 'success', failed: 'error' }[s] || 'grey');

async function loadCampaigns() {
  loadingCampaigns.value = true;
  try { campaigns.value = await fetchProspectCampaigns(); } catch (e) { console.error(e); } finally { loadingCampaigns.value = false; }
}
async function openCampaign(id) {
  tab.value = 'campaigns';
  if (!campaigns.value.length) await loadCampaigns();
  openCampaignId.value = id;
}
function resendFailed(c) {
  composerRecipients.value = (c.recipients || []).filter((r) => r.status === 'failed').map((r) => {
    const p = r.leadId ? byId.value[r.leadId] : null;
    return { leadId: r.leadId || '', contactId: r.contactId || '', name: r.name || '', email: r.email || '', company: r.company || p?.name || '', tags: p?.tags || [], vars: r.vars || (p ? buildVars(p, { name: r.name }) : undefined) };
  });
  composerPreset.value = { subject: c.subject || '', html: c.html || '', attachments: c.attachments || [] };
  composerOpen.value = true;
}

// ---------------------------------------------------------------
// 範本
// ---------------------------------------------------------------
const templates = ref([]);
const loadingTemplates = ref(false);
const templateEditorOpen = ref(false);
const templateForm = ref({ id: null, name: '', subject: '', html: '', attachments: [], scope: 'prospect' });
const templatePendingFiles = ref([]);
const templateUploading = ref(false);
const savingTemplate = ref(false);
const deleteTemplateDialog = ref(false);
const deleteTemplateTarget = ref(null);
const deletingTemplate = ref(false);

const PRESET_TEMPLATE = {
  name: 'ANXI 建案管理系統，一個平台就夠',
  subject: '{{建案}} 團隊您好，ANXI 建案管理系統免費試用邀請',
  scope: 'prospect',
  html: `<p>{{建商}} {{聯絡人}} 您好：</p>
<p>我們是 ANXI 安熙智慧，看到 {{建案}} 正在銷售中，冒昧來信介紹一套專為建案現場打造的管理平台。</p>
<p><strong>【ANXI 建案管理系統，一個平台就夠】</strong></p>
<p>銷控在紙本、客資在 Excel、預約靠電話、缺失單靠 LINE——資料越走越散，最後誰都對不上帳。</p>
<p>ANXI 把五件事收進同一個平台：</p>
<ul>
<li>📊 <strong>銷控報價</strong>：即時銷控表、戶別／車位報價、付款表與合約文件一鍵產出</li>
<li>👥 <strong>客戶管理</strong>：來電來人、VIP 名單、跟進紀錄與業務績效統計</li>
<li>📅 <strong>線上預約</strong>：賞屋、對保、驗屋時段自助預約，LINE 自動通知</li>
<li>🔧 <strong>驗屋修繕</strong>：現場拍照建檔、缺失分派廠商、修繕進度追蹤</li>
<li>🌐 <strong>形象網站</strong>：建案官網與活動訊息即時更新，訪客留資直接進客資</li>
</ul>
<p>銷售、櫃台、工程、客服，看的是同一份資料。</p>
<p>🎁 <strong>免費試用開放中</strong>：不付費、不等建置，留下資料直接進測試環境，走一遍真實流程再決定。</p>
<p>👉 立即試用：<a href="https://anxismart.com/">https://anxismart.com/</a><br>💬 LINE 洽詢：<a href="https://lin.ee/rBZmaUG">https://lin.ee/rBZmaUG</a></p>
<p>若方便，也歡迎直接回覆此信，我們可安排 30 分鐘線上導覽。</p>
<p>ANXI 安熙智慧 敬上</p>`,
};

async function loadTemplates() {
  loadingTemplates.value = true;
  try {
    let list = await fetchEmailTemplates('prospect');
    if (!list.some((t) => t.scope === 'prospect')) {
      await saveEmailTemplate({ ...PRESET_TEMPLATE, attachments: [] }, 'system');
      list = await fetchEmailTemplates('prospect');
      uiStore.showSnackbar('已建立預設開發 Email 範本', 'info');
    }
    templates.value = list;
  } catch (e) {
    console.error(e);
    uiStore.showSnackbar(`讀取範本失敗：${e.message || e}`, 'error');
  } finally {
    loadingTemplates.value = false;
  }
}
function openTemplateEditor(t) {
  templateForm.value = t
    ? { id: t.id, name: t.name || '', subject: t.subject || '', html: t.html || '', attachments: (t.attachments || []).map((a) => ({ ...a })), scope: t.scope || 'all' }
    : { id: null, name: '', subject: '', html: '<p></p>', attachments: [], scope: 'prospect' };
  templatePendingFiles.value = [];
  templateEditorOpen.value = true;
}
function insertTemplateVariable(token) {
  const current = templateForm.value.html || '';
  const idx = current.lastIndexOf('</p>');
  templateForm.value.html = idx >= 0 ? `${current.slice(0, idx)}${token}${current.slice(idx)}` : `${current}<p>${token}</p>`;
}
async function onTemplateFilesPicked(files) {
  const list = Array.isArray(files) ? files : (files ? [files] : []);
  templatePendingFiles.value = [];
  if (!list.length) return;
  const current = templateForm.value.attachments;
  let total = current.reduce((s, a) => s + (Number(a.size) || 0), 0);
  const accepted = [];
  for (const file of list) {
    if (current.length + accepted.length >= 5) { uiStore.showSnackbar('附件最多 5 個', 'warning'); break; }
    if (file.size > 10 * 1024 * 1024) { uiStore.showSnackbar(`「${file.name}」超過 10MB，已略過`, 'warning'); continue; }
    if (total + file.size > 20 * 1024 * 1024) { uiStore.showSnackbar(`加入「${file.name}」後總計會超過 20MB，已略過`, 'warning'); continue; }
    total += file.size; accepted.push(file);
  }
  if (!accepted.length) return;
  templateUploading.value = true;
  try {
    for (const file of accepted) {
      const meta = await uploadMarketingAttachment(file);
      templateForm.value.attachments.push({ name: meta.name, url: meta.url, size: meta.size });
    }
  } catch (e) {
    console.error(e);
    uiStore.showSnackbar(`附件上傳失敗：${e.message || e}`, 'error');
  } finally {
    templateUploading.value = false;
  }
}
async function saveTemplate() {
  savingTemplate.value = true;
  try {
    await saveEmailTemplate(templateForm.value, operator.value.name);
    uiStore.showSnackbar('範本已儲存', 'success');
    templateEditorOpen.value = false;
    await loadTemplates();
  } catch (e) {
    console.error(e);
    uiStore.showSnackbar(`儲存範本失敗：${e.message || e}`, 'error');
  } finally {
    savingTemplate.value = false;
  }
}
function askDeleteTemplate(t) { deleteTemplateTarget.value = t; deleteTemplateDialog.value = true; }
async function confirmDeleteTemplate() {
  if (!deleteTemplateTarget.value) return;
  deletingTemplate.value = true;
  try {
    await deleteEmailTemplate(deleteTemplateTarget.value.id);
    templates.value = templates.value.filter((t) => t.id !== deleteTemplateTarget.value.id);
    deleteTemplateDialog.value = false;
    uiStore.showSnackbar('範本已刪除', 'success');
  } catch (e) {
    console.error(e);
    uiStore.showSnackbar(`刪除範本失敗：${e.message || e}`, 'error');
  } finally {
    deletingTemplate.value = false;
  }
}

// ---------------------------------------------------------------
// 設定
// ---------------------------------------------------------------
const settingsOpen = ref(false);
const settingsForm = ref({ ...DEFAULT_PROSPECT_SETTINGS });
const savingSettings = ref(false);
const searchKeyForm = ref({ key: '' });
async function loadSettings() {
  try { settings.value = await fetchProspectSettings(); } catch (e) { console.error(e); }
}
function openSettings() { settingsForm.value = { ...settings.value }; searchKeyForm.value = { key: '' }; settingsOpen.value = true; }
async function saveSettings() {
  savingSettings.value = true;
  try {
    await saveProspectSettings(settingsForm.value, operator.value.name);
    if (searchKeyForm.value.key.trim()) {
      await prospectHarvestAPI({ action: 'setSearchKey', operatorKey: operator.value.key, key: searchKeyForm.value.key.trim() });
      hasSearchKey.value = true;
    }
    await loadSettings();
    settingsOpen.value = false;
    uiStore.showSnackbar('設定已儲存', 'success');
  } catch (e) {
    console.error(e);
    uiStore.showSnackbar(`儲存失敗：${e.message || e}`, 'error');
  } finally {
    savingSettings.value = false;
  }
}

// ---------------------------------------------------------------
// 匯入 / 匯出
// ---------------------------------------------------------------
const importOpen = ref(false);
async function onImported() { await reload(); }

// ---------------------------------------------------------------
// 網路蒐集（後端背景工作，訂閱 prospectHarvestJobs）
// ---------------------------------------------------------------
const harvestOpen = ref(false);
const harvestJobs = ref([]);
const harvestDismissedId = ref('');
const hasSearchKey = ref(false);
const latestHarvest = computed(() => harvestJobs.value[0] || null);
const harvestActive = computed(() => isHarvestActive(latestHarvest.value));
const harvestBanner = computed(() => {
  const job = latestHarvest.value;
  if (!job || job.id === harvestDismissedId.value) return null;
  if (isHarvestActive(job)) return { job, type: 'info', text: `網路蒐集${job.status === 'queued' ? '排隊中' : ''}　${harvestProgressText(job)}` };
  const finishedAt = toDate(job.finishedAt);
  if (!finishedAt || Date.now() - finishedAt.getTime() > 24 * 3600e3) return null;
  const meta = HARVEST_STATUS_LABELS[job.status] || {};
  return { job, type: job.status === 'done' ? 'success' : job.status === 'failed' ? 'error' : 'warning', text: `網路蒐集${meta.label || ''}　${harvestResultText(job)}` };
});
let prevHarvestStatus = null;
const unsubscribeHarvest = subscribeHarvestJobs((jobs) => {
  const prevId = latestHarvest.value?.id;
  harvestJobs.value = jobs;
  const job = jobs[0];
  if (!job) return;
  const key = `${job.id}|${job.status}`;
  if (prevHarvestStatus && prevHarvestStatus !== key && job.id === prevId && !isHarvestActive(job)) {
    reload();
    uiStore.showSnackbar(`網路蒐集${HARVEST_STATUS_LABELS[job.status]?.label || ''}：${harvestResultText(job)}`, job.status === 'done' ? 'success' : 'warning', 6000);
  }
  prevHarvestStatus = key;
});
onUnmounted(() => unsubscribeHarvest());
async function cancelHarvest(job) {
  try {
    await prospectHarvestAPI({ action: 'cancel', operatorKey: operator.value.key, jobId: job.id });
    uiStore.showSnackbar('已送出取消，目前這批處理完會停止', 'info');
  } catch (e) {
    console.error(e);
    uiStore.showSnackbar(e.message || '取消失敗', 'error');
  }
}
async function loadHarvestConfig() {
  try {
    const r = await prospectHarvestAPI({ action: 'config', operatorKey: operator.value.key });
    hasSearchKey.value = !!r.hasSearchKey;
  } catch (e) { console.warn('讀取蒐集設定失敗', e); }
}

function exportExcel() {
  const ownerName = (key) => admins.value.find((a) => a.key === key)?.name || '';
  const statusLabel = (s) => statusMeta(s).title;
  const wb = XLSX.utils.book_new();
  ['project', 'builder', 'agency', 'resource'].forEach((cat) => {
    const rows = filtered.value.filter((p) => p.category === cat).map((p) => prospectToExportRow(p, { fmt, statusLabel, ownerName }));
    if (!rows.length) return;
    const ws = XLSX.utils.json_to_sheet(rows);
    ws['!cols'] = Object.keys(rows[0]).map((k) => ({ wch: Math.max(10, Math.min(40, k.length * 2 + 6)) }));
    XLSX.utils.book_append_sheet(wb, ws, EXPORT_SHEET_NAMES[cat]);
  });
  if (!wb.SheetNames.length) { uiStore.showSnackbar('沒有可匯出的資料', 'warning'); return; }
  XLSX.writeFile(wb, `客戶開發名單_${formatInTimeZone(new Date(), 'Asia/Taipei', 'yyyyMMdd_HHmm')}.xlsx`);
}

// ---------------------------------------------------------------
// 初始化
// ---------------------------------------------------------------
const loadedTabs = new Set(['list']);
watch(tab, (t) => {
  if (loadedTabs.has(t)) return;
  loadedTabs.add(t);
  if (t === 'campaigns') loadCampaigns();
  if (t === 'templates') loadTemplates();
});

onMounted(async () => {
  await Promise.all([reload(), loadTags(), loadSettings(), loadHarvestConfig()]);
  try { admins.value = await fetchSuperAdmins(); } catch (e) { console.warn('讀取超管清單失敗', e); }
  const id = route.query.id;
  if (id && byId.value[id]) selectById(id);
  if (route.query.due === '1') f.dueToday = true;
});
</script>

<style scoped>
/* ============================================================
   macOS 風格版面：系統字體、#1d1d1f 文字、#f5f5f7 底、細邊框、藍色 accent
   ============================================================ */
.pm {
  --pm-text: #1d1d1f;
  --pm-secondary: #6e6e73;
  --pm-accent: #0071e3;
  --pm-line: rgba(0, 0, 0, 0.08);
  --pm-ground: #f5f5f7;
  --pm-head-h: 44px;
  font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", "Helvetica Neue", "PingFang TC", "Noto Sans TC", sans-serif;
  color: var(--pm-text);
}
.pm-spacer { flex: 1 1 auto; }
.pm-link {
  border: 0;
  background: transparent;
  padding: 0 6px;
  height: 30px;
  font-size: 13px;
  color: var(--pm-accent);
  cursor: pointer;
  white-space: nowrap;
}
.pm-link:hover { text-decoration: underline; }

/* 標題列：padding-left 讓出全站浮動漢堡鈕（fixed left:10px + 40px 寬） */
.pm-head {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
  min-height: var(--pm-head-h);
  padding-left: 44px;
  margin-bottom: 10px;
}
.pm-title { font-size: 20px; font-weight: 700; letter-spacing: -0.01em; margin: 0 6px 0 0; line-height: 1; }
.pm-due {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  height: 28px;
  padding: 0 10px;
  border: 0;
  border-radius: 14px;
  background: rgba(0, 0, 0, 0.05);
  color: var(--pm-secondary);
  font-size: 12.5px;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.12s, color 0.12s;
}
.pm-due b { font-weight: 700; font-variant-numeric: tabular-nums; }
.pm-due.has-due { background: rgba(214, 45, 32, 0.1); color: #c4271b; }
.pm-due.is-on { background: #d62d20; color: #fff; }
.pm-due:hover { filter: brightness(0.96); }

/* 分段控制（分頁） */
.mac-seg {
  display: inline-flex;
  padding: 2px;
  border-radius: 8px;
  background: rgba(0, 0, 0, 0.06);
}
.mac-seg__btn {
  height: 26px;
  padding: 0 14px;
  border: 0;
  border-radius: 6px;
  background: transparent;
  color: var(--pm-text);
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.15s, box-shadow 0.15s;
}
.mac-seg__btn.is-active {
  background: #fff;
  font-weight: 600;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.15), 0 0 0 0.5px rgba(0, 0, 0, 0.05);
}

/* 左列表＋右檢視器 */
.pm-split {
  display: flex;
  align-items: stretch;
  gap: 12px;
  height: calc(100vh - 140px);
  min-height: 420px;
}
.pm-list {
  flex: 1 1 auto;
  min-width: 0;
  display: flex;
  flex-direction: column;
  background: #fff;
  border: 1px solid var(--pm-line);
  border-radius: 12px;
  overflow: hidden;
}
.pm-inspector {
  flex: 0 0 clamp(440px, 46%, 620px);
  min-width: 0;
  background: var(--pm-ground);
  border: 1px solid var(--pm-line);
  border-radius: 12px;
  overflow-y: auto;
  overscroll-behavior: contain;
}
.pm-inspector-enter-active, .pm-inspector-leave-active { transition: flex-basis 0.2s ease, opacity 0.2s ease, transform 0.2s ease; }
.pm-inspector-enter-from, .pm-inspector-leave-to { flex-basis: 0; opacity: 0; transform: translateX(12px); }

/* 工具列 */
.pm-toolbar {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 6px;
  padding: 8px 10px;
  border-bottom: 1px solid var(--pm-line);
}
.pm-search {
  display: flex;
  align-items: center;
  gap: 6px;
  flex: 1 1 220px;
  max-width: 360px;
  min-width: 160px;
  height: 30px;
  padding: 0 8px 0 9px;
  border-radius: 7px;
  background: rgba(0, 0, 0, 0.05);
  color: var(--pm-secondary);
  transition: box-shadow 0.12s, background-color 0.12s;
}
.pm-search:focus-within { background: #fff; box-shadow: 0 0 0 3px rgba(0, 113, 227, 0.25), 0 0 0 0.5px rgba(0, 0, 0, 0.12); }
.pm-search input {
  flex: 1 1 auto;
  min-width: 0;
  border: 0;
  outline: 0;
  background: transparent;
  font: inherit;
  font-size: 13px;
  color: var(--pm-text);
}
.pm-search input::placeholder { color: #a1a1a6; }
.pm-search input::-webkit-search-cancel-button { display: none; }
.pm-search__clear { display: inline-flex; border: 0; background: transparent; padding: 0; color: #a1a1a6; cursor: pointer; }
.pm-search__clear:hover { color: var(--pm-secondary); }
.pm-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 17px;
  height: 17px;
  padding: 0 5px;
  margin-left: 2px;
  border-radius: 9px;
  background: var(--pm-accent);
  color: #fff;
  font-size: 11px;
  font-weight: 700;
}
.pm-btn--active { color: var(--pm-accent); }
.pm-btn--active .v-icon { color: var(--pm-accent); }
.pm-quick { display: flex; align-items: center; gap: 4px; flex-wrap: wrap; }
.pm-chip {
  --tone: var(--pm-secondary);
  height: 26px;
  padding: 0 10px;
  border: 1px solid rgba(0, 0, 0, 0.12);
  border-radius: 13px;
  background: #fff;
  color: var(--pm-text);
  font-size: 12.5px;
  font-weight: 500;
  white-space: nowrap;
  cursor: pointer;
  transition: background-color 0.12s, color 0.12s, border-color 0.12s;
}
.pm-chip:hover { background: rgba(0, 0, 0, 0.04); }
.pm-chip.is-on { background: var(--tone); border-color: var(--tone); color: #fff; }
.pm-chip--red { --tone: #d62d20; }
.pm-chip--cyan { --tone: #0891b2; }
.pm-chip--purple { --tone: #5b3fd9; }
.pm-chip--green { --tone: #1f9d55; }
.pm-count { font-size: 12.5px; color: var(--pm-secondary); font-variant-numeric: tabular-nums; padding: 0 4px; white-space: nowrap; }
.pm-count__total { color: #a1a1a6; }
.pm-spin { animation: pm-spin 0.9s linear infinite; }
@keyframes pm-spin { to { transform: rotate(360deg); } }

/* 篩選彈出視窗 */
.pm-popover {
  width: min(520px, calc(100vw - 32px));
  padding: 12px;
  border-radius: 12px;
  background: #fff;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.18), 0 0 0 0.5px rgba(0, 0, 0, 0.1);
  font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", "Helvetica Neue", "PingFang TC", "Noto Sans TC", sans-serif;
}
.pm-popover__foot { display: flex; align-items: center; gap: 8px; margin-top: 12px; padding-top: 10px; border-top: 1px solid var(--pm-line); }
.pm-menu { border-radius: 10px !important; }

/* 已套用篩選 / 批次列 */
.pm-active {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 6px;
  padding: 6px 10px;
  border-bottom: 1px solid var(--pm-line);
  background: #fafafa;
}
.pm-bulk {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 6px;
  padding: 6px 10px;
  border-bottom: 1px solid rgba(0, 113, 227, 0.2);
  background: rgba(0, 113, 227, 0.07);
}
.pm-bulk__count { font-size: 13px; font-weight: 600; margin-right: 4px; white-space: nowrap; }

/* 表格：填滿剩餘高度、內層 wrapper 自行捲動 */
.pm-table { flex: 1 1 auto; min-height: 0; font-family: inherit; }
.pm-table :deep(.v-table__wrapper) { min-height: 0; }
.pm-table :deep(thead th) { font-size: 12px !important; color: var(--pm-secondary) !important; font-weight: 600 !important; }
.pm-table :deep(tbody tr) { cursor: pointer; }
.pm-table :deep(tbody td) { font-size: 13px !important; }
.pm-table :deep(tr.row-selected td) { background: rgba(0, 113, 227, 0.1); }
.pm-table :deep(tr.row-selected td:first-child) { box-shadow: inset 3px 0 0 var(--pm-accent); }
.pm-table :deep(.v-data-table-footer) { border-top: 1px solid var(--pm-line); font-size: 12px; }

/* 手機全螢幕詳情：卡片自己捲動；頂列左側讓出全站浮動漢堡鈕 */
.pm-mobile-sheet { height: 100%; overflow-y: auto; background: var(--pm-ground); }
.pm-mobile-sheet :deep(.pd-head) { padding-left: 52px; }

@media (max-width: 959px) {
  .pm-split { height: auto; min-height: 0; }
  .pm-list { min-height: 60vh; }
  .pm-table { max-height: calc(100vh - 220px); }
}

.template-preview {
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.cursor-pointer { cursor: pointer; }
</style>
