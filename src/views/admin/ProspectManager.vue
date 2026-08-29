<template>
  <v-container fluid class="prospect-manager">
    <!-- 標題列 -->
    <div class="d-flex align-center flex-wrap ga-2 mb-2">
      <v-icon size="large" color="primary">mdi-account-tie</v-icon>
      <div>
        <h1 class="text-h5 mb-0">客戶開發</h1>
        <div class="text-caption text-grey">建案／建商名單、開發 Email、追蹤管理</div>
      </div>
      <v-spacer />
      <v-chip
        :color="dueCount ? 'error' : 'grey'"
        variant="flat"
        prepend-icon="mdi-calendar-alert"
        :class="{ 'cursor-pointer': true }"
        @click="toggleDueFilter"
      >今日待追蹤 {{ dueCount }}</v-chip>
      <v-btn size="small" variant="outlined" prepend-icon="mdi-file-excel" @click="importOpen = true">匯入 Excel</v-btn>
      <v-btn size="small" variant="outlined" prepend-icon="mdi-download" :disabled="!filtered.length" @click="exportExcel">匯出</v-btn>
      <v-btn size="small" color="primary" variant="flat" prepend-icon="mdi-plus" @click="startCreate">新增</v-btn>
      <v-btn size="small" variant="text" icon="mdi-cog" title="設定" @click="openSettings" />
    </div>

    <v-tabs v-model="tab" color="primary" class="mb-3">
      <v-tab value="list" prepend-icon="mdi-format-list-bulleted">名單</v-tab>
      <v-tab value="campaigns" prepend-icon="mdi-email-multiple">寄信紀錄</v-tab>
      <v-tab value="templates" prepend-icon="mdi-file-document-multiple">Email 範本</v-tab>
    </v-tabs>

    <v-window v-model="tab">
      <!-- ============================================================ 名單 -->
      <v-window-item value="list">
        <v-row>
          <v-col cols="12" :md="mdAndUp ? 5 : 12">
            <v-card>
              <v-card-text class="pb-2">
                <v-text-field v-model="search" label="搜尋 名稱／建商／代銷／地址／聯絡人／Email" prepend-inner-icon="mdi-magnify" density="compact" variant="outlined" clearable hide-details class="mb-2" />
                <v-row dense>
                  <v-col cols="6" sm="3"><v-select v-model="f.categories" :items="categoryOptions" item-title="title" item-value="value" label="類別" density="compact" variant="outlined" hide-details multiple chips closable-chips clearable /></v-col>
                  <v-col cols="6" sm="3"><v-select v-model="f.regions" :items="regionItems" label="區域" density="compact" variant="outlined" hide-details multiple chips closable-chips clearable /></v-col>
                  <v-col cols="6" sm="3"><v-select v-model="f.statuses" :items="statusOptions" item-title="title" item-value="value" label="狀態" density="compact" variant="outlined" hide-details multiple chips closable-chips clearable /></v-col>
                  <v-col cols="6" sm="3"><v-select v-model="f.tags" :items="tagDefs" item-title="name" item-value="name" label="標籤" density="compact" variant="outlined" hide-details multiple chips closable-chips clearable /></v-col>
                  <v-col cols="6" sm="3"><v-select v-model="f.owner" :items="ownerFilterItems" label="負責人" density="compact" variant="outlined" hide-details clearable /></v-col>
                  <v-col cols="6" sm="3"><v-select v-model="f.notEmailedDays" :items="notEmailedItems" label="未寄信" density="compact" variant="outlined" hide-details clearable /></v-col>
                  <v-col cols="6" sm="3"><v-select v-model="sortBy" :items="sortOptions" label="排序" density="compact" variant="outlined" hide-details /></v-col>
                  <v-col cols="12" sm="3" class="d-flex align-center flex-wrap">
                    <v-checkbox v-model="f.hasEmail" label="有 Email" density="compact" hide-details class="mr-2" />
                    <v-checkbox v-model="f.hasFb" label="有 FB" density="compact" hide-details />
                  </v-col>
                  <v-col cols="12" class="d-flex align-center flex-wrap ga-2">
                    <v-chip size="small" :variant="f.dueToday ? 'flat' : 'outlined'" color="error" @click="f.dueToday = !f.dueToday">今日待追蹤</v-chip>
                    <v-chip size="small" :variant="f.openedNoReply ? 'flat' : 'outlined'" color="cyan" @click="f.openedNoReply = !f.openedNoReply">已開信未回覆</v-chip>
                    <v-chip size="small" :variant="f.hasLine ? 'flat' : 'outlined'" color="green" @click="f.hasLine = !f.hasLine">有 LINE</v-chip>
                    <v-btn size="x-small" variant="text" @click="resetFilters">清除篩選</v-btn>
                  </v-col>
                </v-row>
                <div class="d-flex align-center flex-wrap ga-2 mt-2">
                  <span class="text-caption text-grey">共 {{ filtered.length }} 筆（全部 {{ prospects.length }}）</span>
                  <v-spacer />
                  <v-btn size="small" variant="text" prepend-icon="mdi-tag-multiple" @click="tagManagerOpen = true">標籤管理</v-btn>
                  <v-btn size="small" variant="text" prepend-icon="mdi-refresh" :loading="store.loading" @click="reload">重新整理</v-btn>
                  <v-btn size="small" color="primary" variant="flat" prepend-icon="mdi-email-multiple" :disabled="!filtered.length" @click="openComposerFor(filtered)">群發 Email</v-btn>
                </div>

                <!-- 批次列 -->
                <v-sheet v-if="selectedIds.length" color="blue-lighten-5" rounded class="d-flex align-center flex-wrap ga-2 pa-2 mt-2">
                  <span class="text-body-2">已選 {{ selectedIds.length }} 筆</span>
                  <v-btn size="small" color="primary" variant="flat" prepend-icon="mdi-email" @click="openComposerFor(selectedList)">寄信</v-btn>
                  <v-menu>
                    <template #activator="{ props: p }"><v-btn v-bind="p" size="small" variant="tonal" prepend-icon="mdi-flag" :loading="bulkLoading">狀態</v-btn></template>
                    <v-list density="compact"><v-list-item v-for="s in statusOptions" :key="s.value" :title="s.title" @click="bulkStatus(s.value)" /></v-list>
                  </v-menu>
                  <v-menu>
                    <template #activator="{ props: p }"><v-btn v-bind="p" size="small" variant="tonal" prepend-icon="mdi-tag-plus" :loading="bulkLoading">加標籤</v-btn></template>
                    <v-list density="compact">
                      <v-list-item v-for="t in tagDefs" :key="t.id" @click="bulkTag('add', t.name)">
                        <template #prepend><v-chip :color="t.color" size="x-small" variant="flat" class="mr-2">&nbsp;</v-chip></template>
                        <v-list-item-title>{{ t.name }}</v-list-item-title>
                      </v-list-item>
                    </v-list>
                  </v-menu>
                  <v-menu>
                    <template #activator="{ props: p }"><v-btn v-bind="p" size="small" variant="tonal" prepend-icon="mdi-tag-minus" :loading="bulkLoading">移除標籤</v-btn></template>
                    <v-list density="compact">
                      <v-list-item v-for="t in tagDefs" :key="t.id" @click="bulkTag('remove', t.name)">
                        <template #prepend><v-chip :color="t.color" size="x-small" variant="flat" class="mr-2">&nbsp;</v-chip></template>
                        <v-list-item-title>{{ t.name }}</v-list-item-title>
                      </v-list-item>
                    </v-list>
                  </v-menu>
                  <v-menu>
                    <template #activator="{ props: p }"><v-btn v-bind="p" size="small" variant="tonal" prepend-icon="mdi-calendar-clock" :loading="bulkLoading">追蹤日</v-btn></template>
                    <v-list density="compact">
                      <v-list-item v-for="d in [1, 3, 7, 14, 30]" :key="d" :title="`+${d} 天`" @click="bulkFollowUp(d)" />
                      <v-list-item title="清除" @click="bulkFollowUp(null)" />
                    </v-list>
                  </v-menu>
                  <v-menu>
                    <template #activator="{ props: p }"><v-btn v-bind="p" size="small" variant="tonal" prepend-icon="mdi-account-check" :loading="bulkLoading">負責人</v-btn></template>
                    <v-list density="compact">
                      <v-list-item v-for="a in admins" :key="a.key" :title="a.name" @click="bulkOwner(a)" />
                      <v-list-item title="清除" @click="bulkOwner(null)" />
                    </v-list>
                  </v-menu>
                  <v-btn size="small" color="error" variant="text" prepend-icon="mdi-delete" @click="bulkDeleteDialog = true">刪除</v-btn>
                  <v-btn size="small" variant="text" @click="selectedIds = []">清除選取</v-btn>
                </v-sheet>
              </v-card-text>

              <v-data-table
                v-model="selectedIds"
                :headers="headers"
                :items="filtered"
                item-value="id"
                show-select
                density="compact"
                :loading="store.loading"
                :items-per-page="50"
                :items-per-page-options="[25, 50, 100, -1]"
                hover
                fixed-header
                height="calc(100vh - 420px)"
                class="prospect-table"
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
                  <div class="text-caption text-grey">{{ item.region || '' }}<span v-if="item.category === 'project' && (item.companyName || item.builder)">｜{{ item.companyName || item.builder }}</span></div>
                </template>
                <template #item.status="{ item }">
                  <v-chip size="x-small" :color="statusMeta(item.status).color" variant="flat">{{ statusMeta(item.status).title }}</v-chip>
                </template>
                <template #item.tags="{ item }">
                  <v-chip v-for="t in (item.tags || [])" :key="t" size="x-small" :color="tagColor(t)" variant="flat" class="mr-1">{{ t }}</v-chip>
                </template>
                <template #item._contacts="{ item }">
                  <span :class="emailContacts(item).length ? 'text-success' : 'text-grey'">
                    <v-icon size="x-small">{{ emailContacts(item).length ? 'mdi-email-check' : 'mdi-email-off' }}</v-icon>
                    {{ (item.contacts || []).length }}
                  </span>
                </template>
                <template #item.lastEmailAt="{ item }">
                  <span class="text-no-wrap">{{ fmt(item.lastEmailAt, 'MM/dd') }}</span>
                  <v-icon v-if="item.lastOpenedAt" size="x-small" color="cyan" class="ml-1" :title="`開信 ${fmt(item.lastOpenedAt)}`">mdi-email-open</v-icon>
                </template>
                <template #item.followUpAt="{ item }">
                  <span :class="isDueForFollowUp(item) ? 'text-error font-weight-bold' : ''" class="text-no-wrap">{{ fmt(item.followUpAt, 'MM/dd') }}</span>
                </template>
                <template #item.ownerName="{ item }">{{ item.ownerName || '—' }}</template>
                <template #no-data><div class="text-grey py-6">沒有符合條件的資料</div></template>
              </v-data-table>
            </v-card>
          </v-col>

          <v-col v-if="mdAndUp" cols="12" md="7">
            <v-card class="detail-sticky">
              <v-card-text>
                <ProspectDetailPanel
                  v-if="selected"
                  :prospect="selected"
                  :tag-defs="tagDefs"
                  :admins="admins"
                  :all-prospects="prospects"
                  @updated="onPatched"
                  @deleted="onDeleted"
                  @send-email="onSendFromDetail"
                  @open-tag-manager="tagManagerOpen = true"
                  @navigate="selectById"
                  @open-campaign="openCampaign"
                />
                <div v-else class="text-center text-grey py-12">
                  <v-icon size="48" class="mb-2">mdi-account-search</v-icon>
                  <div>點選左側列表查看詳情</div>
                </div>
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>
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
                      收件 {{ c.total || (c.recipients || []).length }}｜成功 {{ c.sent || 0 }}｜失敗 {{ c.failed || 0 }}｜開信 {{ c.opened || 0 }}
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
                  <v-table density="compact">
                    <thead><tr><th>對象</th><th>聯絡人</th><th>Email</th><th>狀態</th><th>時間</th><th>開信</th><th>錯誤</th></tr></thead>
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
    <v-dialog v-model="mobileDetailOpen" fullscreen transition="dialog-bottom-transition" scrollable>
      <v-card>
        <v-card-text class="pa-3">
          <ProspectDetailPanel
            v-if="selected"
            :prospect="selected"
            :tag-defs="tagDefs"
            :admins="admins"
            :all-prospects="prospects"
            show-close
            @updated="onPatched"
            @deleted="onDeleted"
            @send-email="onSendFromDetail"
            @open-tag-manager="tagManagerOpen = true"
            @navigate="selectById"
            @open-campaign="openCampaign"
            @close="mobileDetailOpen = false"
          />
        </v-card-text>
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
          <v-switch v-model="settingsForm.trackingEnabled" label="預設嵌入開信追蹤像素" color="primary" density="compact" hide-details />
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
      @sent="onComposerSent"
      @template-saved="loadTemplates"
    />

    <TrialLeadTagManager v-model="tagManagerOpen" :tags="tagDefs" :adapter="prospectTagAdapter" @changed="onTagsChanged" />
    <ProspectImportDialog v-model="importOpen" :existing="prospects" @imported="onImported" />
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
import { uploadMarketingAttachment } from '@/api';
import TiptapEditor from '@/components/TiptapEditor.vue';
import MarketingEmailComposer from '@/components/marketing/MarketingEmailComposer.vue';
import TrialLeadTagManager from '@/components/marketing/TrialLeadTagManager.vue';
import ProspectDetailPanel from '@/components/prospecting/ProspectDetailPanel.vue';
import ProspectImportDialog from '@/components/prospecting/ProspectImportDialog.vue';
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
  nameKey,
  genId,
  makeEvent,
  toDate,
} from '@/services/prospectService';
import { arrayUnion } from 'firebase/firestore';

const route = useRoute();
const { mdAndUp } = useDisplay();
const userStore = useUserStore();
const uiStore = useUiStore();
const store = useProspectStore();

const tab = ref('list');
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
const sortBy = ref('followup');
const f = reactive({
  categories: [], regions: [], statuses: [], tags: [], owner: null, notEmailedDays: null,
  hasEmail: false, hasFb: false, hasLine: false, dueToday: false, openedNoReply: false,
});
function resetFilters() {
  Object.assign(f, { categories: [], regions: [], statuses: [], tags: [], owner: null, notEmailedDays: null, hasEmail: false, hasFb: false, hasLine: false, dueToday: false, openedNoReply: false });
  search.value = '';
}
function toggleDueFilter() { f.dueToday = !f.dueToday; tab.value = 'list'; }

const regionItems = computed(() => Array.from(new Set(prospects.value.map((p) => regionGroup(p.region)).filter(Boolean))).sort((a, b) => a.localeCompare(b, 'zh-Hant')));
function regionGroup(r) {
  const s = String(r || '').trim();
  if (!s) return '';
  const m = s.match(/^(新竹市東區|新竹市北區|新竹市香山區|新竹市|竹北市|竹東鎮|湖口鄉|新豐鄉|芎林鄉|新埔鎮|北埔鄉|寶山鄉|關西鎮|峨眉鄉|橫山鄉|尖石鄉|五峰鄉)/);
  return m ? m[1] : s.replace(/[（(].*$/, '');
}
const ownerFilterItems = computed(() => [{ title: '未指派', value: '__none__' }, ...admins.value.map((a) => ({ title: a.name, value: a.key }))]);
const notEmailedItems = [
  { title: '7 天內未寄', value: 7 }, { title: '14 天內未寄', value: 14 }, { title: '30 天內未寄', value: 30 }, { title: '從未寄過', value: 0 },
];
const sortOptions = [
  { title: '追蹤日（到期優先）', value: 'followup' },
  { title: '最近更新', value: 'updated' },
  { title: '最後寄信', value: 'email' },
  { title: '名稱', value: 'name' },
  { title: '區域', value: 'region' },
  { title: '優先度', value: 'priority' },
];

const filtered = computed(() => {
  const q = String(search.value || '').trim().toLowerCase();
  const now = Date.now();
  let list = prospects.value.filter((p) => {
    if (f.categories.length && !f.categories.includes(p.category)) return false;
    if (f.regions.length && !f.regions.includes(regionGroup(p.region))) return false;
    if (f.statuses.length && !f.statuses.includes(p.status || 'new')) return false;
    if (f.tags.length) { const tags = Array.isArray(p.tags) ? p.tags : []; if (!f.tags.some((t) => tags.includes(t))) return false; }
    if (f.owner === '__none__' && p.owner) return false;
    if (f.owner && f.owner !== '__none__' && p.owner !== f.owner) return false;
    if (f.hasEmail && !emailContacts(p).length) return false;
    if (f.hasFb && !p.facebook) return false;
    if (f.hasLine && !p.line && !(p.contacts || []).some((c) => c.line)) return false;
    if (f.dueToday && !isDueForFollowUp(p)) return false;
    if (f.openedNoReply && !(p.lastOpenedAt && !p.repliedAt)) return false;
    if (f.notEmailedDays != null) {
      const last = toDate(p.lastEmailAt)?.getTime();
      if (f.notEmailedDays === 0) { if (last) return false; } else if (last && now - last < f.notEmailedDays * 86400000) return false;
    }
    if (q) {
      const hay = [p.name, p.builder, p.companyName, p.agency, p.region, p.receptionAddress, p.siteAddress, p.phone, p.note, p.memo,
        ...(p.contacts || []).flatMap((c) => [c.name, c.email, c.phone])].map((x) => String(x || '').toLowerCase()).join(' ');
      if (!hay.includes(q)) return false;
    }
    return true;
  });
  const t = (v) => toDate(v)?.getTime() || 0;
  const s = sortBy.value;
  list = [...list];
  if (s === 'followup') list.sort((a, b) => (t(a.followUpAt) || Infinity) - (t(b.followUpAt) || Infinity) || t(b.updatedAt) - t(a.updatedAt));
  else if (s === 'updated') list.sort((a, b) => t(b.updatedAt) - t(a.updatedAt));
  else if (s === 'email') list.sort((a, b) => t(b.lastEmailAt) - t(a.lastEmailAt));
  else if (s === 'name') list.sort((a, b) => String(a.name).localeCompare(String(b.name), 'zh-Hant'));
  else if (s === 'region') list.sort((a, b) => String(a.region || '').localeCompare(String(b.region || ''), 'zh-Hant') || String(a.name).localeCompare(String(b.name), 'zh-Hant'));
  else if (s === 'priority') list.sort((a, b) => (b.priority || 0) - (a.priority || 0) || t(b.updatedAt) - t(a.updatedAt));
  return list;
});

const headers = [
  { title: '名稱', key: 'name', sortable: false },
  { title: '狀態', key: 'status', sortable: false },
  { title: '標籤', key: 'tags', sortable: false },
  { title: '聯絡人', key: '_contacts', sortable: false, align: 'center' },
  { title: '最後寄信', key: 'lastEmailAt', sortable: false },
  { title: '追蹤', key: 'followUpAt', sortable: false },
  { title: '負責人', key: 'ownerName', sortable: false },
];

// ---------------------------------------------------------------
// 選取 / 詳情
// ---------------------------------------------------------------
const selectedIds = ref([]);
const selectedId = ref(null);
const mobileDetailOpen = ref(false);
const selected = computed(() => (selectedId.value ? byId.value[selectedId.value] || null : null));
const selectedList = computed(() => selectedIds.value.map((id) => byId.value[id]).filter(Boolean));

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
  return list.map((c) => ({ leadId: p.id, contactId: c.id, name: c.name || '', email: c.email, company: p.name, tags: p.tags || [], vars: buildVars(p, c), excludedReason }));
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
async function loadSettings() {
  try { settings.value = await fetchProspectSettings(); } catch (e) { console.error(e); }
}
function openSettings() { settingsForm.value = { ...settings.value }; settingsOpen.value = true; }
async function saveSettings() {
  savingSettings.value = true;
  try {
    await saveProspectSettings(settingsForm.value, operator.value.name);
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
  await Promise.all([reload(), loadTags(), loadSettings()]);
  try { admins.value = await fetchSuperAdmins(); } catch (e) { console.warn('讀取超管清單失敗', e); }
  const id = route.query.id;
  if (id && byId.value[id]) selectById(id);
  if (route.query.due === '1') f.dueToday = true;
});
</script>

<style scoped>
.detail-sticky {
  position: sticky;
  top: 80px;
  max-height: calc(100vh - 100px);
  overflow-y: auto;
}
.prospect-table :deep(tbody tr) { cursor: pointer; }
.prospect-table :deep(tr.row-selected) { background: rgba(25, 118, 210, 0.08); }
.template-preview {
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.cursor-pointer { cursor: pointer; }
</style>
