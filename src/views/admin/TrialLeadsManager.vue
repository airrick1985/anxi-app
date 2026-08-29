<template>
  <v-container fluid class="trial-leads-manager">
    <!-- 標題 -->
    <div class="d-flex align-center flex-wrap ga-2 mb-2">
      <v-icon size="large" color="warning">mdi-account-star</v-icon>
      <div>
        <h1 class="text-h5 mb-0">試用留資管理</h1>
        <div class="text-caption text-grey">留資名單、廣告 Email 群發、寄信紀錄與 DEMO 沙盒設定</div>
      </div>
    </div>

    <v-tabs v-model="tab" color="primary" class="mb-3">
      <v-tab value="leads" prepend-icon="mdi-account-multiple">留資名單</v-tab>
      <v-tab value="campaigns" prepend-icon="mdi-email-multiple">寄信紀錄</v-tab>
      <v-tab value="templates" prepend-icon="mdi-file-document-multiple">Email 範本</v-tab>
      <v-tab value="sandbox" prepend-icon="mdi-cube-outline">沙盒設定</v-tab>
    </v-tabs>

    <v-window v-model="tab">
      <!-- ============================================================ -->
      <!-- 留資名單 -->
      <!-- ============================================================ -->
      <v-window-item value="leads">
        <v-row>
          <v-col cols="12" :md="mdAndUp ? 5 : 12">
            <v-card>
              <v-card-text class="pb-2">
                <!-- 工具列 -->
                <v-text-field
                  v-model="search"
                  label="搜尋 姓名／電話／Email／公司"
                  prepend-inner-icon="mdi-magnify"
                  density="compact"
                  variant="outlined"
                  clearable
                  hide-details
                  class="mb-2"
                />
                <v-row dense>
                  <v-col cols="6" sm="3">
                    <v-select v-model="statusFilter" :items="statusFilterItems" label="狀態" density="compact" variant="outlined" hide-details clearable />
                  </v-col>
                  <v-col cols="6" sm="3">
                    <v-select v-model="tagFilter" :items="tagDefs" item-title="name" item-value="name" label="標籤" density="compact" variant="outlined" hide-details multiple chips closable-chips clearable />
                  </v-col>
                  <v-col cols="6" sm="3">
                    <v-select v-model="useTypeFilter" :items="useTypeOptions" label="型態" density="compact" variant="outlined" hide-details clearable />
                  </v-col>
                  <v-col cols="6" sm="3">
                    <v-select v-model="sortBy" :items="sortOptions" label="排序" density="compact" variant="outlined" hide-details />
                  </v-col>
                  <v-col cols="6" sm="3">
                    <v-text-field v-model="dateFrom" type="date" label="建立起" density="compact" variant="outlined" hide-details clearable />
                  </v-col>
                  <v-col cols="6" sm="3">
                    <v-text-field v-model="dateTo" type="date" label="建立迄" density="compact" variant="outlined" hide-details clearable />
                  </v-col>
                  <v-col cols="12" sm="6" class="d-flex align-center">
                    <v-checkbox v-model="showArchived" label="顯示已封存" density="compact" hide-details />
                  </v-col>
                </v-row>
                <div class="d-flex align-center flex-wrap ga-2 mt-2">
                  <span class="text-caption text-grey">共 {{ filteredLeads.length }} 筆</span>
                  <v-spacer />
                  <v-btn size="small" variant="text" prepend-icon="mdi-refresh" :loading="loadingLeads" @click="loadLeads">重新整理</v-btn>
                  <v-btn size="small" variant="outlined" prepend-icon="mdi-file-excel" :disabled="!filteredLeads.length" @click="exportExcel">匯出 Excel</v-btn>
                  <v-btn size="small" color="primary" variant="flat" prepend-icon="mdi-email-multiple" :disabled="!filteredLeads.length" @click="openComposer(filteredLeads)">群發 Email</v-btn>
                </div>

                <!-- 批次列 -->
                <v-sheet v-if="selectedIds.length" color="blue-lighten-5" rounded class="d-flex align-center flex-wrap ga-2 pa-2 mt-2">
                  <span class="text-body-2">已選 {{ selectedIds.length }} 筆</span>
                  <v-menu>
                    <template #activator="{ props: p }">
                      <v-btn v-bind="p" size="small" variant="tonal" prepend-icon="mdi-tag-plus" :loading="bulkLoading">加標籤</v-btn>
                    </template>
                    <v-list density="compact">
                      <v-list-item v-for="t in tagDefs" :key="t.id" @click="bulkTag('add', t.name)">
                        <template #prepend><v-chip :color="t.color" size="x-small" variant="flat" class="mr-2">&nbsp;</v-chip></template>
                        <v-list-item-title>{{ t.name }}</v-list-item-title>
                      </v-list-item>
                    </v-list>
                  </v-menu>
                  <v-menu>
                    <template #activator="{ props: p }">
                      <v-btn v-bind="p" size="small" variant="tonal" prepend-icon="mdi-tag-minus" :loading="bulkLoading">移除標籤</v-btn>
                    </template>
                    <v-list density="compact">
                      <v-list-item v-for="t in tagDefs" :key="t.id" @click="bulkTag('remove', t.name)">
                        <template #prepend><v-chip :color="t.color" size="x-small" variant="flat" class="mr-2">&nbsp;</v-chip></template>
                        <v-list-item-title>{{ t.name }}</v-list-item-title>
                      </v-list-item>
                    </v-list>
                  </v-menu>
                  <v-menu>
                    <template #activator="{ props: p }">
                      <v-btn v-bind="p" size="small" variant="tonal" prepend-icon="mdi-flag" :loading="bulkLoading">設定狀態</v-btn>
                    </template>
                    <v-list density="compact">
                      <v-list-item v-for="s in statusOptions" :key="s.value" :title="s.title" @click="bulkStatus(s.value)" />
                    </v-list>
                  </v-menu>
                  <v-btn size="small" color="primary" variant="flat" prepend-icon="mdi-email" @click="openComposer(selectedLeads)">寄信</v-btn>
                  <v-btn size="small" variant="text" @click="selectedIds = []">清除選取</v-btn>
                </v-sheet>
              </v-card-text>

              <!-- 列表 -->
              <v-data-table
                v-model="selectedIds"
                :headers="headers"
                :items="filteredLeads"
                item-value="id"
                show-select
                density="compact"
                :loading="loadingLeads"
                :items-per-page="25"
                :items-per-page-options="[25, 50, 100, -1]"
                hover
                class="leads-table"
                :row-props="rowProps"
                @click:row="onRowClick"
              >
                <template #item.name="{ item }">
                  <span class="font-weight-medium">{{ item.name || '(未填)' }}</span>
                </template>
                <template #item.useType="{ item }">{{ useTypeLabel(item.useType) }}</template>
                <template #item.tags="{ item }">
                  <v-chip
                    v-for="t in (item.tags || [])"
                    :key="t"
                    size="x-small"
                    :color="tagColor(t)"
                    variant="flat"
                    class="mr-1"
                  >{{ t }}</v-chip>
                </template>
                <template #item.status="{ item }">
                  <v-chip size="x-small" :color="statusColor(item.status)" variant="flat">{{ statusLabel(item.status) }}</v-chip>
                </template>
                <template #item.loginCount="{ item }">{{ item.loginCount || 0 }}</template>
                <template #item._lastActivity="{ item }">{{ fmt(item._lastActivity) }}</template>
                <template #item.createdAt="{ item }">{{ fmt(item.createdAt) }}</template>
                <template #no-data>
                  <div class="text-grey py-6">目前沒有符合條件的留資</div>
                </template>
              </v-data-table>
            </v-card>
          </v-col>

          <!-- 桌機右側詳情 -->
          <v-col v-if="mdAndUp" cols="12" md="7">
            <v-card class="detail-sticky">
              <v-card-text>
                <TrialLeadDetailPanel
                  v-if="selectedLead"
                  :lead="selectedLead"
                  :tag-defs="tagDefs"
                  @updated="applyLeadPatch"
                  @send-email="openComposer([$event])"
                  @open-tag-manager="tagManagerOpen = true"
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

      <!-- ============================================================ -->
      <!-- 寄信紀錄 -->
      <!-- ============================================================ -->
      <v-window-item value="campaigns">
        <v-card>
          <v-card-title class="d-flex align-center">
            寄信紀錄
            <v-spacer />
            <v-btn size="small" variant="text" prepend-icon="mdi-refresh" :loading="loadingCampaigns" @click="loadCampaigns">重新整理</v-btn>
          </v-card-title>
          <v-card-text>
            <div v-if="!campaigns.length && !loadingCampaigns" class="text-grey text-center py-8">尚無寄信紀錄</div>
            <v-expansion-panels v-else variant="accordion">
              <v-expansion-panel v-for="c in campaigns" :key="c.id">
                <v-expansion-panel-title>
                  <div class="d-flex align-center flex-wrap ga-2 w-100">
                    <v-chip size="x-small" :color="c.status === 'done' ? 'success' : 'info'" variant="flat">
                      {{ c.status === 'done' ? '完成' : '寄送中' }}
                    </v-chip>
                    <span class="font-weight-medium">{{ c.subject }}</span>
                    <v-spacer />
                    <span class="text-caption text-grey">
                      收件 {{ c.total || (c.recipients || []).length }}｜成功 {{ c.sent || 0 }}｜失敗 {{ c.failed || 0 }}
                      ｜{{ fmt(c.createdAt) }}｜{{ c.createdByName || c.createdBy || '—' }}
                    </span>
                  </div>
                </v-expansion-panel-title>
                <v-expansion-panel-text>
                  <div class="d-flex align-center flex-wrap ga-2 mb-2">
                    <span class="text-caption text-grey">附件 {{ (c.attachments || []).length }} 個　完成時間 {{ fmt(c.finishedAt) }}</span>
                    <v-spacer />
                    <v-btn
                      size="small"
                      color="warning"
                      variant="tonal"
                      prepend-icon="mdi-email-sync"
                      :disabled="!(c.recipients || []).some((r) => r.status === 'failed')"
                      @click="resendFailed(c)"
                    >重寄失敗者</v-btn>
                  </div>
                  <v-table density="compact">
                    <thead>
                      <tr>
                        <th>姓名</th>
                        <th>Email</th>
                        <th>狀態</th>
                        <th>時間</th>
                        <th>錯誤</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr v-for="r in (c.recipients || [])" :key="r.leadId || r.email">
                        <td>{{ r.name || '—' }}</td>
                        <td>{{ r.email }}</td>
                        <td>
                          <v-chip size="x-small" variant="flat" :color="recipientStatusColor(r.status)">{{ recipientStatusLabel(r.status) }}</v-chip>
                        </td>
                        <td>{{ fmt(r.sentAt) }}</td>
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

      <!-- ============================================================ -->
      <!-- Email 範本 -->
      <!-- ============================================================ -->
      <v-window-item value="templates">
        <v-card>
          <v-card-title class="d-flex align-center">
            Email 範本
            <v-spacer />
            <v-btn size="small" variant="text" prepend-icon="mdi-refresh" :loading="loadingTemplates" @click="loadTemplates">重新整理</v-btn>
            <v-btn size="small" color="primary" variant="flat" prepend-icon="mdi-plus" class="ml-2" @click="openTemplateEditor(null)">新增範本</v-btn>
          </v-card-title>
          <v-card-text>
            <div v-if="!templates.length && !loadingTemplates" class="text-grey text-center py-8">尚無範本</div>
            <v-row v-else>
              <v-col v-for="t in templates" :key="t.id" cols="12" md="6" lg="4">
                <v-card variant="outlined" class="h-100 d-flex flex-column">
                  <v-card-title class="text-subtitle-1">{{ t.name }}</v-card-title>
                  <v-card-subtitle>主旨：{{ t.subject }}</v-card-subtitle>
                  <v-card-text class="flex-grow-1">
                    <div class="template-preview text-body-2 text-grey">{{ plainText(t.html) }}</div>
                    <div class="text-caption text-grey mt-2">
                      附件 {{ (t.attachments || []).length }} 個　更新 {{ fmt(t.updatedAt) }} {{ t.updatedBy ? `by ${t.updatedBy}` : '' }}
                    </div>
                  </v-card-text>
                  <v-card-actions>
                    <v-btn size="small" variant="text" prepend-icon="mdi-pencil" @click="openTemplateEditor(t)">編輯</v-btn>
                    <v-btn size="small" variant="text" color="error" prepend-icon="mdi-delete" @click="askDeleteTemplate(t)">刪除</v-btn>
                    <v-spacer />
                    <v-btn size="small" color="primary" variant="tonal" prepend-icon="mdi-send" @click="openComposer(filteredLeads, t)">套用範本並寄信</v-btn>
                  </v-card-actions>
                </v-card>
              </v-col>
            </v-row>
          </v-card-text>
        </v-card>
      </v-window-item>

      <!-- ============================================================ -->
      <!-- 沙盒設定 -->
      <!-- ============================================================ -->
      <v-window-item value="sandbox">
        <v-row>
          <v-col cols="12" md="7">
            <v-card>
              <v-card-title class="d-flex align-center">
                沙盒設定（systemSettings/trial）
                <v-spacer />
                <v-btn size="small" variant="text" prepend-icon="mdi-refresh" :loading="loadingSettings" @click="loadSettings">重新整理</v-btn>
              </v-card-title>
              <v-card-text>
                <v-alert v-if="settings && settings._exists === false" type="info" variant="tonal" density="compact" class="mb-3">
                  尚未建立設定文件，儲存後會以下列內容建立。
                </v-alert>
                <v-row dense>
                  <v-col cols="12" sm="4">
                    <v-switch v-model="settings.enabled" label="啟用試用" color="primary" density="compact" hide-details />
                  </v-col>
                  <v-col cols="12" sm="4">
                    <v-switch v-model="settings.blockOutbound" label="封鎖對外通知" color="primary" density="compact" hide-details />
                  </v-col>
                  <v-col cols="12" sm="4">
                    <v-switch v-model="settings.resetEnabled" label="啟用每日重置（04:00）" color="primary" density="compact" hide-details />
                  </v-col>
                  <v-col cols="12" sm="6">
                    <v-text-field v-model="settings.accountKey" label="試用帳號（accountKey）" density="compact" variant="outlined" />
                  </v-col>
                  <v-col cols="12" sm="6">
                    <v-text-field
                      v-model="settings.password"
                      label="試用密碼"
                      :type="showPassword ? 'text' : 'password'"
                      :append-inner-icon="showPassword ? 'mdi-eye-off' : 'mdi-eye'"
                      density="compact"
                      variant="outlined"
                      @click:append-inner="showPassword = !showPassword"
                    />
                  </v-col>
                  <v-col cols="12" sm="6">
                    <v-combobox v-model="settings.projectIds" label="DEMO 建案 projectIds" multiple chips closable-chips density="compact" variant="outlined" hint="輸入後按 Enter 新增" persistent-hint />
                  </v-col>
                  <v-col cols="12" sm="6">
                    <v-combobox v-model="settings.projectNames" label="DEMO 建案 projectNames" multiple chips closable-chips density="compact" variant="outlined" hint="輸入後按 Enter 新增" persistent-hint />
                  </v-col>
                  <v-col cols="12">
                    <v-combobox
                      v-model="settings.sandboxCollections"
                      :items="defaultSandboxCollections"
                      label="快照／重置範圍集合（sandboxCollections）"
                      multiple
                      chips
                      closable-chips
                      density="compact"
                      variant="outlined"
                    />
                    <v-btn size="x-small" variant="text" @click="settings.sandboxCollections = [...defaultSandboxCollections]">還原預設清單</v-btn>
                  </v-col>
                </v-row>
                <div class="text-caption text-grey mt-2">
                  最近快照：{{ fmt(settings.lastSnapshotAt) }}　最近重置：{{ fmt(settings.lastResetAt) }}
                </div>
              </v-card-text>
              <v-card-actions>
                <v-spacer />
                <v-btn color="primary" variant="flat" prepend-icon="mdi-content-save" :loading="savingSettings" @click="saveSettings">儲存設定</v-btn>
              </v-card-actions>
            </v-card>
          </v-col>

          <v-col cols="12" md="5">
            <v-card class="mb-4">
              <v-card-title>沙盒操作</v-card-title>
              <v-card-text>
                <div class="d-flex flex-column ga-2">
                  <v-btn variant="outlined" prepend-icon="mdi-eye" :loading="snapshotLoading === 'dry'" @click="previewSnapshot">預覽快照筆數</v-btn>
                  <v-btn color="primary" variant="flat" prepend-icon="mdi-camera" :loading="snapshotLoading === 'run'" @click="askSnapshot">建立／更新沙盒範本快照</v-btn>
                  <v-btn color="error" variant="flat" prepend-icon="mdi-restore-alert" :loading="resetLoading" @click="resetDialog = true">立即重置沙盒</v-btn>
                </div>
                <div v-if="snapshotCounts" class="mt-4">
                  <div class="text-subtitle-2 mb-1">{{ snapshotCountsTitle }}</div>
                  <v-table density="compact">
                    <thead><tr><th>集合</th><th class="text-right">筆數</th></tr></thead>
                    <tbody>
                      <tr v-for="row in snapshotCountRows" :key="row.name">
                        <td>{{ row.name }}</td>
                        <td class="text-right">{{ row.count }}</td>
                      </tr>
                      <tr class="font-weight-bold"><td>合計</td><td class="text-right">{{ snapshotTotal }}</td></tr>
                    </tbody>
                  </v-table>
                </div>
              </v-card-text>
            </v-card>

            <v-card>
              <v-card-title class="d-flex align-center">
                最近 7 次重置紀錄
                <v-spacer />
                <v-btn size="small" variant="text" icon="mdi-refresh" :loading="loadingResets" @click="loadResets" />
              </v-card-title>
              <v-card-text>
                <div v-if="!resets.length" class="text-grey text-caption">尚無紀錄</div>
                <v-list v-else density="compact">
                  <v-list-item v-for="r in resets" :key="r.id">
                    <v-list-item-title>
                      {{ fmt(r.startedAt) }} → {{ fmt(r.finishedAt) }}
                      <v-chip size="x-small" class="ml-1" variant="tonal">{{ r.trigger || 'schedule' }}</v-chip>
                      <v-chip v-if="(r.errors || []).length" size="x-small" color="error" variant="flat" class="ml-1">錯誤 {{ r.errors.length }}</v-chip>
                    </v-list-item-title>
                    <v-list-item-subtitle>{{ summarizeCounts(r.counts) }}</v-list-item-subtitle>
                  </v-list-item>
                </v-list>
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>
      </v-window-item>
    </v-window>

    <!-- 手機詳情 dialog -->
    <v-dialog v-model="mobileDetailOpen" fullscreen transition="dialog-bottom-transition" scrollable>
      <v-card>
        <v-card-text class="pa-3">
          <TrialLeadDetailPanel
            v-if="selectedLead"
            :lead="selectedLead"
            :tag-defs="tagDefs"
            show-close
            @updated="applyLeadPatch"
            @send-email="openComposer([$event])"
            @open-tag-manager="tagManagerOpen = true"
            @close="mobileDetailOpen = false"
          />
        </v-card-text>
      </v-card>
    </v-dialog>

    <!-- Email 編輯器 -->
    <MarketingEmailComposer
      v-model="composerOpen"
      :recipients="composerRecipients"
      :preset="composerPreset"
      @sent="onComposerSent"
      @template-saved="loadTemplates"
    />

    <!-- 標籤管理 -->
    <TrialLeadTagManager v-model="tagManagerOpen" :tags="tagDefs" @changed="onTagsChanged" />

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
          <div class="d-flex align-center ga-1 mb-1">
            <span class="text-caption text-grey">插入變數：</span>
            <v-btn v-for="v in variableTokens" :key="v" size="x-small" variant="tonal" @click="insertTemplateVariable(v)">{{ v }}</v-btn>
          </div>
          <TiptapEditor v-model="templateForm.html" />
          <div class="text-subtitle-2 mt-4 mb-1">附件（最多 5 個，單檔 ≤ 10MB，總計 ≤ 20MB）</div>
          <v-file-input
            v-model="templatePendingFiles"
            label="選擇檔案"
            multiple
            density="compact"
            variant="outlined"
            prepend-icon="mdi-paperclip"
            hide-details
            :loading="templateUploading"
            :disabled="templateUploading || templateForm.attachments.length >= 5"
            @update:model-value="onTemplateFilesPicked"
          />
          <v-list v-if="templateForm.attachments.length" density="compact">
            <v-list-item v-for="a in templateForm.attachments" :key="a.url">
              <template #prepend><v-icon size="small">mdi-file</v-icon></template>
              <v-list-item-title class="text-body-2">{{ a.name }}</v-list-item-title>
              <v-list-item-subtitle>{{ formatSize(a.size) }}</v-list-item-subtitle>
              <template #append>
                <v-btn icon="mdi-close" size="x-small" variant="text" @click="templateForm.attachments = templateForm.attachments.filter((x) => x.url !== a.url)" />
              </template>
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

    <!-- 刪除範本確認 -->
    <v-dialog v-model="deleteTemplateDialog" max-width="400">
      <v-card>
        <v-card-title>刪除範本</v-card-title>
        <v-card-text>確定要刪除範本「{{ deleteTemplateTarget?.name }}」嗎？此動作無法復原。</v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="deleteTemplateDialog = false">取消</v-btn>
          <v-btn color="error" :loading="deletingTemplate" @click="confirmDeleteTemplate">刪除</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- 快照確認 -->
    <v-dialog v-model="snapshotDialog" max-width="480">
      <v-card>
        <v-card-title>建立／更新沙盒範本快照</v-card-title>
        <v-card-text>
          <p class="mb-2">將以目前 DEMO 建案資料覆蓋 <code>trialSandboxTemplates</code> 範本，之後每日重置與「立即重置」都會還原成這份快照。</p>
          <v-table density="compact" class="mb-2">
            <thead><tr><th>集合</th><th class="text-right">筆數</th></tr></thead>
            <tbody>
              <tr v-for="row in snapshotCountRows" :key="row.name"><td>{{ row.name }}</td><td class="text-right">{{ row.count }}</td></tr>
              <tr class="font-weight-bold"><td>合計</td><td class="text-right">{{ snapshotTotal }}</td></tr>
            </tbody>
          </v-table>
          <v-alert type="warning" variant="tonal" density="compact">請確認 DEMO 建案目前的資料狀態是您希望作為範本的版本。</v-alert>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="snapshotDialog = false">取消</v-btn>
          <v-btn color="primary" variant="flat" :loading="snapshotLoading === 'run'" @click="runSnapshot">確定建立快照</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- 重置確認 -->
    <v-dialog v-model="resetDialog" max-width="480">
      <v-card>
        <v-card-title class="text-error">立即重置沙盒</v-card-title>
        <v-card-text>
          <p class="mb-2">將<strong>刪除</strong> DEMO 建案在範圍集合中的所有現有資料，並以最近一次快照還原。目前試用中的使用者操作會遺失。</p>
          <p class="text-caption text-grey mb-3">最近快照：{{ fmt(settings.lastSnapshotAt) }}</p>
          <v-text-field v-model="resetConfirmText" label="請輸入 RESET 以確認" variant="outlined" density="compact" />
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="resetDialog = false">取消</v-btn>
          <v-btn color="error" variant="flat" :disabled="resetConfirmText !== 'RESET'" :loading="resetLoading" @click="runReset">確定重置</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { useDisplay } from 'vuetify';
import { formatInTimeZone } from 'date-fns-tz';
import * as XLSX from 'xlsx';
import { useUserStore } from '@/store/user';
import { useUiStore } from '@/store/uiStore';
import { snapshotTrialSandboxAPI, resetTrialSandboxNowAPI, uploadMarketingAttachment } from '@/api';
import TiptapEditor from '@/components/TiptapEditor.vue';
import TrialLeadDetailPanel from '@/components/marketing/TrialLeadDetailPanel.vue';
import MarketingEmailComposer from '@/components/marketing/MarketingEmailComposer.vue';
import TrialLeadTagManager from '@/components/marketing/TrialLeadTagManager.vue';
import {
  fetchTrialLeads,
  bulkAddTag,
  bulkRemoveTag,
  bulkUpdateTrialLeads,
  fetchTrialLeadTags,
  fetchEmailTemplates,
  saveEmailTemplate,
  deleteEmailTemplate,
  fetchEmailCampaigns,
  fetchTrialSettings,
  saveTrialSettings,
  fetchSandboxResets,
  toDate,
  TRIAL_LEAD_STATUS_OPTIONS,
  TRIAL_USE_TYPE_OPTIONS,
  DEFAULT_SANDBOX_COLLECTIONS,
  DEFAULT_TRIAL_SETTINGS,
} from '@/services/trialLeadsService';

const route = useRoute();
const { mdAndUp } = useDisplay();
const userStore = useUserStore();
const uiStore = useUiStore();

const tab = ref('leads');

// ---------------------------------------------------------------
// 共用
// ---------------------------------------------------------------
const statusOptions = TRIAL_LEAD_STATUS_OPTIONS;
const useTypeOptions = TRIAL_USE_TYPE_OPTIONS;
const defaultSandboxCollections = DEFAULT_SANDBOX_COLLECTIONS;
const variableTokens = ['{{姓名}}', '{{公司}}', '{{Email}}'];
const subjectLabel = '主旨（支援 {{姓名}} {{公司}} {{Email}} 變數）';

const fmt = (v) => {
  const d = toDate(v);
  return d ? formatInTimeZone(d, 'Asia/Taipei', 'yyyy/MM/dd HH:mm') : '—';
};
const statusLabel = (s) => statusOptions.find((o) => o.value === s)?.title || '新留資';
const statusColor = (s) => statusOptions.find((o) => o.value === s)?.color || 'primary';
const useTypeLabel = (t) => useTypeOptions.find((o) => o.value === t)?.title || '—';
const plainText = (html) => String(html || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 160);
const formatSize = (bytes) => {
  const n = Number(bytes) || 0;
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / 1024 / 1024).toFixed(2)} MB`;
};
const operatorKey = computed(() => userStore.user?.key || '');
const operatorName = computed(() => userStore.user?.name || userStore.user?.key || '');

// ---------------------------------------------------------------
// 標籤
// ---------------------------------------------------------------
const tagDefs = ref([]);
const tagManagerOpen = ref(false);
const tagColor = (name) => tagDefs.value.find((t) => t.name === name)?.color || 'grey';

async function loadTags() {
  try {
    tagDefs.value = await fetchTrialLeadTags();
  } catch (e) {
    console.error(e);
    uiStore.showSnackbar(`讀取標籤失敗：${e.message || e}`, 'error');
  }
}
function onTagsChanged({ tags, renamed, removed }) {
  tagDefs.value = tags;
  // 同步記憶體中的 lead 標籤
  if (renamed) {
    leads.value.forEach((l) => {
      if (Array.isArray(l.tags) && l.tags.includes(renamed.from)) {
        l.tags = Array.from(new Set(l.tags.map((t) => (t === renamed.from ? renamed.to : t))));
      }
    });
  }
  if (removed) {
    leads.value.forEach((l) => {
      if (Array.isArray(l.tags)) l.tags = l.tags.filter((t) => t !== removed);
    });
  }
}

// ---------------------------------------------------------------
// 留資名單
// ---------------------------------------------------------------
const leads = ref([]);
const loadingLeads = ref(false);
const search = ref('');
const statusFilter = ref(null);
const tagFilter = ref([]);
const useTypeFilter = ref(null);
const dateFrom = ref('');
const dateTo = ref('');
const sortBy = ref('newest');
const showArchived = ref(false);
const selectedIds = ref([]);
const selectedLeadId = ref(null);
const mobileDetailOpen = ref(false);
const bulkLoading = ref(false);

const statusFilterItems = statusOptions.map((s) => ({ title: s.title, value: s.value }));
const sortOptions = [
  { title: '最新建立', value: 'newest' },
  { title: '最舊建立', value: 'oldest' },
  { title: '最近活動', value: 'activity' },
];

const headers = [
  { title: '姓名', key: 'name', sortable: false },
  { title: '公司', key: 'company', sortable: false },
  { title: '型態', key: 'useType', sortable: false },
  { title: '電話', key: 'phone', sortable: false },
  { title: 'Email', key: 'email', sortable: false },
  { title: '標籤', key: 'tags', sortable: false },
  { title: '狀態', key: 'status', sortable: false },
  { title: '登入', key: 'loginCount', sortable: false, align: 'end' },
  { title: '最近活動', key: '_lastActivity', sortable: false },
  { title: '建立時間', key: 'createdAt', sortable: false },
];

function computeLastActivity(l) {
  const eventTimes = (Array.isArray(l.events) ? l.events : []).map((e) => toDate(e.at)).filter(Boolean);
  const logTimes = (Array.isArray(l.emailLogs) ? l.emailLogs : []).map((e) => toDate(e.sentAt)).filter(Boolean);
  const candidates = [toDate(l.lastSeenAt), toDate(l.lastLoginAt), ...eventTimes, ...logTimes].filter(Boolean);
  if (!candidates.length) return toDate(l.createdAt);
  return candidates.sort((a, b) => b.getTime() - a.getTime())[0];
}

const leadsById = computed(() => Object.fromEntries(leads.value.map((l) => [l.id, l])));

const filteredLeads = computed(() => {
  const q = String(search.value || '').trim().toLowerCase();
  const from = dateFrom.value ? new Date(`${dateFrom.value}T00:00:00+08:00`).getTime() : null;
  const to = dateTo.value ? new Date(`${dateTo.value}T23:59:59.999+08:00`).getTime() : null;
  const tagSet = tagFilter.value || [];

  let list = leads.value.filter((l) => {
    const status = l.status || 'new';
    if (!showArchived.value && status === 'archived' && statusFilter.value !== 'archived') return false;
    if (statusFilter.value && status !== statusFilter.value) return false;
    if (useTypeFilter.value && (l.useType || '') !== useTypeFilter.value) return false;
    if (tagSet.length) {
      const tags = Array.isArray(l.tags) ? l.tags : [];
      if (!tagSet.some((t) => tags.includes(t))) return false;
    }
    const created = toDate(l.createdAt)?.getTime();
    if (from && (!created || created < from)) return false;
    if (to && (!created || created > to)) return false;
    if (q) {
      const hay = [l.name, l.phone, l.email, l.company].map((x) => String(x || '').toLowerCase()).join(' ');
      if (!hay.includes(q)) return false;
    }
    return true;
  });

  list = list.map((l) => ({ ...l, _lastActivity: computeLastActivity(l) }));
  const t = (v) => toDate(v)?.getTime() || 0;
  if (sortBy.value === 'newest') list.sort((a, b) => t(b.createdAt) - t(a.createdAt));
  else if (sortBy.value === 'oldest') list.sort((a, b) => t(a.createdAt) - t(b.createdAt));
  else list.sort((a, b) => t(b._lastActivity) - t(a._lastActivity));
  return list;
});

const selectedLead = computed(() => (selectedLeadId.value ? leadsById.value[selectedLeadId.value] || null : null));
const selectedLeads = computed(() => selectedIds.value.map((id) => leadsById.value[id]).filter(Boolean));

function rowProps({ item }) {
  return { class: item.id === selectedLeadId.value ? 'row-selected' : '' };
}

async function loadLeads() {
  loadingLeads.value = true;
  try {
    leads.value = await fetchTrialLeads();
    // 清掉已不存在的選取
    selectedIds.value = selectedIds.value.filter((id) => leadsById.value[id]);
  } catch (e) {
    console.error(e);
    uiStore.showSnackbar(`讀取留資失敗：${e.message || e}`, 'error');
  } finally {
    loadingLeads.value = false;
  }
}

function selectLead(lead) {
  selectedLeadId.value = lead?.id || null;
  if (!mdAndUp.value && lead) mobileDetailOpen.value = true;
}
function onRowClick(_event, { item }) {
  selectLead(item);
}

/** 詳情面板回傳的局部更新 → 同步到記憶體 */
function applyLeadPatch(patch) {
  const target = leads.value.find((l) => l.id === patch.id);
  if (!target) return;
  Object.assign(target, patch);
}

async function bulkTag(mode, tagName) {
  if (!selectedIds.value.length) return;
  bulkLoading.value = true;
  try {
    if (mode === 'add') await bulkAddTag(selectedIds.value, tagName);
    else await bulkRemoveTag(selectedIds.value, tagName);
    selectedIds.value.forEach((id) => {
      const l = leadsById.value[id];
      if (!l) return;
      const tags = Array.isArray(l.tags) ? l.tags : [];
      l.tags = mode === 'add' ? Array.from(new Set([...tags, tagName])) : tags.filter((t) => t !== tagName);
    });
    uiStore.showSnackbar(`已${mode === 'add' ? '加上' : '移除'}標籤「${tagName}」（${selectedIds.value.length} 筆）`, 'success');
  } catch (e) {
    console.error(e);
    uiStore.showSnackbar(`批次更新失敗：${e.message || e}`, 'error');
  } finally {
    bulkLoading.value = false;
  }
}

async function bulkStatus(status) {
  if (!selectedIds.value.length) return;
  bulkLoading.value = true;
  try {
    await bulkUpdateTrialLeads(selectedIds.value, () => ({ status }), leadsById.value);
    selectedIds.value.forEach((id) => { if (leadsById.value[id]) leadsById.value[id].status = status; });
    uiStore.showSnackbar(`已將 ${selectedIds.value.length} 筆設為「${statusLabel(status)}」`, 'success');
  } catch (e) {
    console.error(e);
    uiStore.showSnackbar(`批次更新失敗：${e.message || e}`, 'error');
  } finally {
    bulkLoading.value = false;
  }
}

function exportExcel() {
  const rows = filteredLeads.value.map((l) => {
    const notes = Array.isArray(l.notes) ? [...l.notes] : [];
    notes.sort((a, b) => (toDate(b.createdAt)?.getTime() || 0) - (toDate(a.createdAt)?.getTime() || 0));
    return {
      姓名: l.name || '',
      公司: l.company || '',
      型態: useTypeLabel(l.useType),
      電話: l.phone || '',
      Email: l.email || '',
      標籤: (Array.isArray(l.tags) ? l.tags : []).join(','),
      狀態: statusLabel(l.status),
      感興趣系統: (Array.isArray(l.interests) ? l.interests : []).join(','),
      登入次數: l.loginCount || 0,
      完成導覽: l.tourCompleted ? '是' : '否',
      最近活動: fmt(l._lastActivity),
      建立時間: fmt(l.createdAt),
      來源: l.source || '',
      'UTM 活動': l.utm?.campaign || '',
      最新備註: notes[0]?.text || '',
    };
  });
  const ws = XLSX.utils.json_to_sheet(rows);
  ws['!cols'] = Object.keys(rows[0] || {}).map((k) => ({ wch: Math.max(10, k.length * 2 + 4) }));
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, '試用留資');
  const stamp = formatInTimeZone(new Date(), 'Asia/Taipei', 'yyyyMMdd_HHmm');
  XLSX.writeFile(wb, `試用留資_${stamp}.xlsx`);
}

// ---------------------------------------------------------------
// Email 編輯器
// ---------------------------------------------------------------
const composerOpen = ref(false);
const composerRecipients = ref([]);
const composerPreset = ref(null);

function openComposer(recipientLeads, template = null) {
  composerRecipients.value = (recipientLeads || []).map((l) => ({
    leadId: l.id || l.leadId,
    name: l.name,
    email: l.email,
    company: l.company,
    tags: l.tags,
  }));
  composerPreset.value = template
    ? { subject: template.subject || '', html: template.html || '', attachments: template.attachments || [] }
    : null;
  composerOpen.value = true;
}
function onComposerSent() {
  loadLeads();
  loadCampaigns();
}

// ---------------------------------------------------------------
// 寄信紀錄
// ---------------------------------------------------------------
const campaigns = ref([]);
const loadingCampaigns = ref(false);

const recipientStatusLabel = (s) => ({ pending: '等待中', sent: '成功', failed: '失敗' }[s] || s || '—');
const recipientStatusColor = (s) => ({ pending: 'grey', sent: 'success', failed: 'error' }[s] || 'grey');

async function loadCampaigns() {
  loadingCampaigns.value = true;
  try {
    campaigns.value = await fetchEmailCampaigns();
  } catch (e) {
    console.error(e);
    uiStore.showSnackbar(`讀取寄信紀錄失敗：${e.message || e}`, 'error');
  } finally {
    loadingCampaigns.value = false;
  }
}

function resendFailed(c) {
  const failed = (c.recipients || []).filter((r) => r.status === 'failed');
  const recipients = failed.map((r) => {
    const lead = r.leadId ? leadsById.value[r.leadId] : null;
    return {
      leadId: r.leadId || '',
      name: r.name || lead?.name || '',
      email: r.email || lead?.email || '',
      company: r.company || lead?.company || '',
      tags: lead?.tags || [],
    };
  });
  composerRecipients.value = recipients;
  composerPreset.value = { subject: c.subject || '', html: c.html || '', attachments: c.attachments || [] };
  composerOpen.value = true;
}

// ---------------------------------------------------------------
// Email 範本
// ---------------------------------------------------------------
const templates = ref([]);
const loadingTemplates = ref(false);
const templateEditorOpen = ref(false);
const templateForm = ref({ id: null, name: '', subject: '', html: '', attachments: [] });
const templatePendingFiles = ref([]);
const templateUploading = ref(false);
const savingTemplate = ref(false);
const deleteTemplateDialog = ref(false);
const deleteTemplateTarget = ref(null);
const deletingTemplate = ref(false);

const LINE_LINK = 'https://lin.ee/rBZmaUG';
const PRESET_TEMPLATES = [
  {
    name: '試用歡迎與快速上手',
    subject: '{{姓名}} 您好，歡迎試用 ANXI 建案管理系統',
    html: `<p>{{姓名}} 您好：</p>
<p>感謝您申請試用 ANXI 建案管理系統！您的試用帳號已開通，登入後即可在 DEMO 建案中自由操作，所有資料每日凌晨會自動還原，請放心測試。</p>
<p><strong>快速上手三步驟：</strong></p>
<ol>
<li><strong>銷控報價</strong>：進入「銷控」查看戶別狀態，點選任一戶即可產出報價單。</li>
<li><strong>客資管理</strong>：在「客資」新增一筆客戶，體驗來電／來人紀錄與跟進提醒。</li>
<li><strong>線上預約</strong>：開啟「預約」建立賞屋時段，並用手機掃描 QR 完成一次客戶預約。</li>
</ol>
<p>若在試用過程中有任何問題，或希望我們安排 30 分鐘的線上導覽，歡迎直接回覆此信，或加入 LINE 官方帳號與我們聯繫：<a href="${LINE_LINK}">${LINE_LINK}</a></p>
<p>祝 順心<br>ANXI 安熙智慧 團隊</p>`,
  },
  {
    name: '五大系統功能介紹',
    subject: '一套系統管好整個建案：ANXI 五大系統介紹',
    html: `<p>{{姓名}} 您好：</p>
<p>感謝 {{公司}} 對 ANXI 建案管理系統的關注。我們把建案從銷售到交屋的流程整合為五大系統，讓團隊在同一個平台完成所有工作：</p>
<ul>
<li><strong>銷控報價</strong>：即時銷控表、戶別／車位報價、付款表與合約文件一鍵產出，主管可線上審核折扣。</li>
<li><strong>客資管理</strong>：來電來人、VIP 名單、跟進紀錄與業務績效統計，資料自動同步至 Google Sheet。</li>
<li><strong>線上預約</strong>：賞屋、對保、驗屋時段自助預約，支援 LINE 通知與提醒，減少人工排程。</li>
<li><strong>驗屋修繕</strong>：現場拍照建檔、缺失分派廠商、修繕進度追蹤，並自動產出驗屋報告 PDF。</li>
<li><strong>形象網站</strong>：建案官網與活動訊息即時更新，訪客留資直接進入客資系統。</li>
</ul>
<p>您目前的試用帳號已可體驗上述所有功能。若想了解如何導入貴公司現有流程，歡迎透過 LINE 與我們聊聊：<a href="${LINE_LINK}">${LINE_LINK}</a></p>
<p>ANXI 安熙智慧 團隊 敬上</p>`,
  },
  {
    name: '方案優惠與洽詢',
    subject: '{{姓名}}，ANXI 建案管理系統導入方案與限時優惠',
    html: `<p>{{姓名}} 您好：</p>
<p>感謝您試用 ANXI 建案管理系統。為協助 {{公司}} 順利導入，我們提供彈性的方案選擇：</p>
<ul>
<li><strong>單案方案</strong>：適合單一建案使用，含銷控報價、客資與線上預約，快速上線。</li>
<li><strong>多案方案</strong>：一個帳號管理多個建案，加入驗屋修繕與形象網站，跨案統計一目了然。</li>
<li><strong>企業方案</strong>：客製欄位、文件版型與 API 串接，並提供專屬導入顧問與教育訓練。</li>
</ul>
<p>本月完成簽約的客戶，可享<strong>首年導入費用優惠</strong>，並免費協助匯入既有客資與銷控資料。</p>
<p>歡迎回覆此信告知方便的時間，我們將為您安排線上說明；或加入 LINE 官方帳號直接洽詢：<a href="${LINE_LINK}">${LINE_LINK}</a></p>
<p>期待與您合作<br>ANXI 安熙智慧 團隊</p>`,
  },
];

async function loadTemplates() {
  loadingTemplates.value = true;
  try {
    let list = await fetchEmailTemplates('trial');
    if (!list.length) {
      // 首次進頁：寫入預置範本
      for (const t of PRESET_TEMPLATES) {
        await saveEmailTemplate({ ...t, attachments: [], scope: 'trial' }, 'system');
      }
      list = await fetchEmailTemplates('trial');
      uiStore.showSnackbar('已建立 3 份預置 Email 範本', 'info');
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
    : { id: null, name: '', subject: '', html: '<p></p>', attachments: [], scope: 'trial' };
  templatePendingFiles.value = [];
  templateEditorOpen.value = true;
}

function insertTemplateVariable(token) {
  const current = templateForm.value.html || '';
  const idx = current.lastIndexOf('</p>');
  templateForm.value.html = idx >= 0
    ? `${current.slice(0, idx)}${token}${current.slice(idx)}`
    : `${current}<p>${token}</p>`;
}

async function onTemplateFilesPicked(files) {
  const list = Array.isArray(files) ? files : (files ? [files] : []);
  templatePendingFiles.value = [];
  if (!list.length) return;
  const current = templateForm.value.attachments;
  let total = current.reduce((s, a) => s + (Number(a.size) || 0), 0);
  const accepted = [];
  for (const f of list) {
    if (current.length + accepted.length >= 5) { uiStore.showSnackbar('附件最多 5 個', 'warning'); break; }
    if (f.size > 10 * 1024 * 1024) { uiStore.showSnackbar(`「${f.name}」超過 10MB，已略過`, 'warning'); continue; }
    if (total + f.size > 20 * 1024 * 1024) { uiStore.showSnackbar(`加入「${f.name}」後總計會超過 20MB，已略過`, 'warning'); continue; }
    total += f.size;
    accepted.push(f);
  }
  if (!accepted.length) return;
  templateUploading.value = true;
  try {
    for (const f of accepted) {
      const meta = await uploadMarketingAttachment(f);
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
    await saveEmailTemplate({ ...templateForm.value, scope: templateForm.value.scope || 'trial' }, operatorName.value);
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

function askDeleteTemplate(t) {
  deleteTemplateTarget.value = t;
  deleteTemplateDialog.value = true;
}
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
// 沙盒設定
// ---------------------------------------------------------------
const settings = ref({ ...DEFAULT_TRIAL_SETTINGS, _exists: false });
const loadingSettings = ref(false);
const savingSettings = ref(false);
const showPassword = ref(false);
const snapshotLoading = ref(null); // 'dry' | 'run' | null
const snapshotCounts = ref(null);
const snapshotCountsTitle = ref('');
const snapshotDialog = ref(false);
const resetDialog = ref(false);
const resetConfirmText = ref('');
const resetLoading = ref(false);
const resets = ref([]);
const loadingResets = ref(false);

const snapshotCountRows = computed(() => {
  const counts = snapshotCounts.value || {};
  return Object.keys(counts)
    .sort((a, b) => a.localeCompare(b))
    .map((name) => ({ name, count: Number(counts[name]) || 0 }));
});
const snapshotTotal = computed(() => snapshotCountRows.value.reduce((s, r) => s + r.count, 0));

function summarizeCounts(counts) {
  if (!counts || typeof counts !== 'object') return '—';
  const total = Object.values(counts).reduce((s, v) => s + (typeof v === 'number' ? v : (Number(v?.restored ?? v?.written ?? 0) || 0)), 0);
  return `${Object.keys(counts).length} 個集合，合計 ${total} 筆`;
}

async function loadSettings() {
  loadingSettings.value = true;
  try {
    const s = await fetchTrialSettings();
    settings.value = {
      ...s,
      projectIds: Array.isArray(s.projectIds) ? s.projectIds : [],
      projectNames: Array.isArray(s.projectNames) ? s.projectNames : [],
      sandboxCollections: Array.isArray(s.sandboxCollections) ? s.sandboxCollections : [...DEFAULT_SANDBOX_COLLECTIONS],
    };
  } catch (e) {
    console.error(e);
    uiStore.showSnackbar(`讀取沙盒設定失敗：${e.message || e}`, 'error');
  } finally {
    loadingSettings.value = false;
  }
}

async function saveSettings() {
  savingSettings.value = true;
  try {
    await saveTrialSettings({
      ...settings.value,
      projectIds: (settings.value.projectIds || []).map((x) => String(x).trim()).filter(Boolean),
      projectNames: (settings.value.projectNames || []).map((x) => String(x).trim()).filter(Boolean),
      sandboxCollections: (settings.value.sandboxCollections || []).map((x) => String(x).trim()).filter(Boolean),
    }, operatorName.value);
    settings.value._exists = true;
    uiStore.showSnackbar('沙盒設定已儲存', 'success');
  } catch (e) {
    console.error(e);
    uiStore.showSnackbar(`儲存失敗：${e.message || e}`, 'error');
  } finally {
    savingSettings.value = false;
  }
}

function extractCounts(res) {
  if (!res) return {};
  if (res.counts && typeof res.counts === 'object') return res.counts;
  if (res.data?.counts && typeof res.data.counts === 'object') return res.data.counts;
  return {};
}

async function previewSnapshot() {
  snapshotLoading.value = 'dry';
  try {
    const res = await snapshotTrialSandboxAPI({ operatorKey: operatorKey.value, dryRun: true });
    snapshotCounts.value = extractCounts(res);
    snapshotCountsTitle.value = '快照筆數預覽（dry-run）';
  } catch (e) {
    console.error(e);
    uiStore.showSnackbar(`預覽失敗：${e.message || e}`, 'error');
  } finally {
    snapshotLoading.value = null;
  }
}

async function askSnapshot() {
  await previewSnapshot();
  if (snapshotCounts.value) snapshotDialog.value = true;
}

async function runSnapshot() {
  snapshotLoading.value = 'run';
  try {
    const res = await snapshotTrialSandboxAPI({ operatorKey: operatorKey.value, dryRun: false });
    snapshotCounts.value = extractCounts(res);
    snapshotCountsTitle.value = '快照完成，各集合筆數';
    snapshotDialog.value = false;
    uiStore.showSnackbar('沙盒範本快照已更新', 'success');
    await loadSettings();
  } catch (e) {
    console.error(e);
    uiStore.showSnackbar(`建立快照失敗：${e.message || e}`, 'error');
  } finally {
    snapshotLoading.value = null;
  }
}

async function runReset() {
  resetLoading.value = true;
  try {
    await resetTrialSandboxNowAPI({ operatorKey: operatorKey.value });
    resetDialog.value = false;
    resetConfirmText.value = '';
    uiStore.showSnackbar('沙盒已重置', 'success');
    await Promise.all([loadSettings(), loadResets()]);
  } catch (e) {
    console.error(e);
    uiStore.showSnackbar(`重置失敗：${e.message || e}`, 'error');
  } finally {
    resetLoading.value = false;
  }
}

async function loadResets() {
  loadingResets.value = true;
  try {
    resets.value = await fetchSandboxResets(7);
  } catch (e) {
    console.error(e);
  } finally {
    loadingResets.value = false;
  }
}

// ---------------------------------------------------------------
// 初始化 / 分頁懶載入
// ---------------------------------------------------------------
const loadedTabs = new Set();
watch(tab, (t) => {
  if (loadedTabs.has(t)) return;
  loadedTabs.add(t);
  if (t === 'campaigns') loadCampaigns();
  if (t === 'templates') loadTemplates();
  if (t === 'sandbox') { loadSettings(); loadResets(); }
});

onMounted(async () => {
  loadedTabs.add('leads');
  await Promise.all([loadTags(), loadLeads()]);
  const leadId = route.query.lead;
  if (leadId && leadsById.value[leadId]) {
    const lead = leadsById.value[leadId];
    if (lead.status === 'archived') showArchived.value = true;
    selectLead(lead);
  }
});
</script>

<style scoped>
.detail-sticky {
  position: sticky;
  top: 80px;
  max-height: calc(100vh - 100px);
  overflow-y: auto;
}
.leads-table :deep(tbody tr) {
  cursor: pointer;
}
.leads-table :deep(tr.row-selected) {
  background: rgba(25, 118, 210, 0.08);
}
.template-preview {
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
